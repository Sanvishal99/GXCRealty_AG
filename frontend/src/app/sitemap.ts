import type { MetadataRoute } from 'next';

const API_BASE  = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gxcrealty.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Dynamic property pages
  try {
    const res = await fetch(`${API_BASE}/properties`, {
      next: { revalidate: 3600 }, // revalidate sitemap every hour
    });

    if (!res.ok) return staticRoutes;

    const properties: any[] = await res.json();

    const propertyRoutes: MetadataRoute.Sitemap = properties
      .filter((p) => p?.id)
      .map((p) => ({
        url: `${SITE_URL}/p/${p.id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    return [...staticRoutes, ...propertyRoutes];
  } catch {
    // Return static routes if API is unreachable during build
    return staticRoutes;
  }
}
