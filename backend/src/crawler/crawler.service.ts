import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PropertiesService } from '../properties/properties.service';
import { Role } from '@prisma/client';

interface ScrapedProperty {
  title: string;
  city: string;
  locality?: string;
  price: number;
  maxPrice?: number;
  projectType: string;
  description?: string;
  builderName?: string;
  images?: string[];
  sourceUrl?: string;
}

interface CrawlerStatus {
  lastRunAt: Date | null;
  lastRunImported: number;
  lastRunFailed: number;
  lastRunError: string | null;
  isRunning: boolean;
  totalRuns: number;
}

@Injectable()
export class CrawlerService implements OnModuleInit {
  private readonly logger = new Logger(CrawlerService.name);

  private status: CrawlerStatus = {
    lastRunAt: null,
    lastRunImported: 0,
    lastRunFailed: 0,
    lastRunError: null,
    isRunning: false,
    totalRuns: 0,
  };

  // Dedup cache: title+city keys seen this session
  private readonly seen = new Set<string>();

  constructor(private readonly propertiesService: PropertiesService) {}

  onModuleInit() {
    if (process.env.SCRAPER_ENABLED === 'true') {
      this.logger.log('Crawler enabled – first run will fire at the next scheduled cron tick.');
    } else {
      this.logger.warn('Crawler disabled. Set SCRAPER_ENABLED=true to enable.');
    }
  }

  getStatus(): CrawlerStatus {
    return this.status;
  }

  // ── Schedule: every 6 hours ─────────────────────────────────────────────────
  @Cron('0 */6 * * *')
  async scheduledRun() {
    if (process.env.SCRAPER_ENABLED !== 'true') return;
    await this.runScrape();
  }

  // ── Manual trigger ──────────────────────────────────────────────────────────
  async runScrape(): Promise<CrawlerStatus> {
    if (this.status.isRunning) {
      this.logger.warn('Scrape already in progress – skipping.');
      return this.status;
    }

    const companyId = process.env.SCRAPER_COMPANY_ID;
    if (!companyId) {
      const msg = 'SCRAPER_COMPANY_ID env var is not set – aborting scrape.';
      this.logger.error(msg);
      this.status.lastRunError = msg;
      return this.status;
    }

    this.status.isRunning = true;
    this.status.lastRunError = null;
    this.status.totalRuns++;
    this.logger.log(`Scrape run #${this.status.totalRuns} started.`);

    const cities = (process.env.SCRAPER_CITIES || 'Bengaluru,Mumbai,Hyderabad,Pune')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const allRows: any[] = [];

    for (const city of cities) {
      try {
        const rows = await this.scrape99acres(city);
        allRows.push(...rows);
        this.logger.log(`  ${city}: ${rows.length} listings scraped`);
      } catch (err: any) {
        this.logger.warn(`  ${city}: scrape failed – ${err.message}`);
      }
    }

    // Deduplicate against seen set
    const deduped = allRows.filter((r) => {
      const key = `${r.title?.toLowerCase()}|${r.city?.toLowerCase()}`;
      if (this.seen.has(key)) return false;
      this.seen.add(key);
      return true;
    });

    this.logger.log(`Total after dedup: ${deduped.length} / ${allRows.length}`);

    let imported = 0;
    let failed = 0;

    if (deduped.length > 0) {
      try {
        const result = await this.propertiesService.bulkImport(companyId, Role.ADMIN, deduped);
        imported = result.succeeded;
        failed = result.failed;
        this.logger.log(`Import complete: ${imported} succeeded, ${failed} failed.`);
      } catch (err: any) {
        this.logger.error(`BulkImport threw: ${err.message}`);
        this.status.lastRunError = err.message;
      }
    }

    this.status.lastRunAt = new Date();
    this.status.lastRunImported = imported;
    this.status.lastRunFailed = failed;
    this.status.isRunning = false;

    return this.status;
  }

  // ── 99acres scraper ─────────────────────────────────────────────────────────
  private async scrape99acres(city: string): Promise<any[]> {
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.99acres.com/property-in-${citySlug}-ffid`;

    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-IN,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 20_000,
    });

    return this.parse99acresHtml(html, city);
  }

  private parse99acresHtml(html: string, city: string): any[] {
    const $ = cheerio.load(html);
    const results: any[] = [];

    // 99acres injects listings as JSON-LD or in data attributes on .srpTuple cards.
    // Try JSON-LD first (most reliable), fall back to card scraping.
    const jsonLdBlocks = $('script[type="application/ld+json"]');
    let parsedFromJsonLd = false;

    jsonLdBlocks.each((_, el) => {
      try {
        const raw = JSON.parse($(el).html() || '{}');
        const items: any[] = Array.isArray(raw['@graph'])
          ? raw['@graph']
          : raw['@type'] === 'ItemList'
          ? raw.itemListElement || []
          : [];

        for (const item of items) {
          const offer = item.offers || item.item?.offers;
          const name = item.name || item.item?.name;
          if (!name) continue;

          const price = offer?.price
            ? Math.round(Number(String(offer.price).replace(/[^0-9.]/g, '')) || 0)
            : 0;

          results.push(
            this.normalise({
              title: name,
              city,
              locality: item.address?.addressLocality || '',
              price,
              projectType: 'APARTMENT',
              description: item.description || '',
              builderName: item.brand?.name || '',
            }),
          );
        }

        if (results.length > 0) parsedFromJsonLd = true;
      } catch {
        // ignore malformed JSON-LD
      }
    });

    if (parsedFromJsonLd) return results;

    // ── Fallback: parse listing cards ─────────────────────────────────────────
    // 99acres card selectors (may change with site updates)
    const cardSelectors = [
      '.srpTuple',         // classic listing card
      '[data-sid]',        // data attribute cards
      '.projectTuple',     // project cards
    ];

    for (const sel of cardSelectors) {
      $(sel).each((_, card) => {
        try {
          const $card = $(card);
          const title =
            $card.find('.tuplePropName, [class*="ProjectName"], h2').first().text().trim() ||
            $card.find('[data-label="name"]').text().trim();

          if (!title) return;

          const localityRaw =
            $card.find('[class*="localityName"], [class*="locality"]').first().text().trim();

          const priceRaw =
            $card.find('[class*="price"], .priceVal').first().text().trim();

          const price = this.parseIndianPrice(priceRaw);

          const typeRaw =
            $card.find('[class*="propType"], [class*="type"]').first().text().trim().toUpperCase();

          const projectType = ['VILLA', 'PLOT', 'COMMERCIAL', 'PENTHOUSE'].includes(typeRaw)
            ? typeRaw
            : 'APARTMENT';

          const imgSrc =
            $card.find('img[src*="99acres"], img[data-src]').first().attr('data-src') ||
            $card.find('img').first().attr('src');

          results.push(
            this.normalise({
              title,
              city,
              locality: localityRaw,
              price,
              projectType,
              images: imgSrc ? [imgSrc] : [],
            }),
          );
        } catch {
          // skip malformed card
        }
      });

      if (results.length > 0) break; // stop at first selector that produced results
    }

    return results;
  }

  // ── Normalise scraped data → PropertiesService shape ──────────────────────
  private normalise(raw: ScrapedProperty): any {
    return {
      title: raw.title,
      description: raw.description || `${raw.projectType} property in ${raw.city}`,
      city: raw.city,
      locality: raw.locality || '',
      projectType: raw.projectType || 'APARTMENT',
      projectStage: 'UPCOMING',
      price: raw.price || 0,
      maxPrice: raw.maxPrice || undefined,
      builderName: raw.builderName || undefined,
      images: raw.images || [],
      // Mark scraped listings as pending so admin can review before publishing
      status: 'PENDING_APPROVAL',
    };
  }

  // ── Indian price parser: "₹1.2 Cr" → 12000000 ────────────────────────────
  private parseIndianPrice(raw: string): number {
    if (!raw) return 0;
    const s = raw.replace(/[₹,\s]/g, '').toLowerCase();
    const num = parseFloat(s);
    if (isNaN(num)) return 0;
    if (s.includes('cr')) return Math.round(num * 10_000_000);
    if (s.includes('l') || s.includes('lac')) return Math.round(num * 100_000);
    return Math.round(num);
  }
}
