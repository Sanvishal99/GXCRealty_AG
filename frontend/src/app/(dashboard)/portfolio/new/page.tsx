"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProperties } from '@/context/PropertyContext';
import { useNotifications } from '@/context/NotificationContext';
import { upload as uploadApi } from '@/lib/api';
import {
  Building2, MapPin, IndianRupee, Percent,
  Compass, Train, Plane, GraduationCap,
  CheckCircle2, ChevronRight, ChevronLeft,
  Layout, Image as ImageIcon, Map as MapIcon,
  ShieldCheck, Info, PlusCircle, AlertTriangle, Trash2,
  Waves, Dumbbell, Car, Shield, Wind, Coffee,
  Video, Lock, Flame, Library, Tv, Lamp, TreePine,
  Gamepad2, Activity, Home, ShoppingCart, Scissors, Users,
  Sun, Droplets, Recycle, PhoneCall, Zap, FileText, Upload, ExternalLink, Pencil, Check
} from 'lucide-react';

// ── Gold / Ivory palette ──────────────────────────────────────────────────────
const GOLD = '#C9A227';
const GOLD_LIGHT = '#D4A843';
const GOLD_DARK = '#A07208';
const IVORY = '#FFFDF5';
const IVORY_BG = '#FDF8ED';
const BORDER = 'rgba(180,130,30,0.18)';
const BORDER_MID = 'rgba(180,130,30,0.30)';
const TEXT_DARK = '#1a1200';
const TEXT_MID = '#5a4a28';
const TEXT_SOFT = '#9a8060';
const GOLD_BTN: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4A843, #C9A227, #A07208)',
  color: '#fff',
  boxShadow: '0 4px 14px rgba(180,130,30,0.28)',
};

// ── Amenity options ───────────────────────────────────────────────────────────
const AMENITY_OPTIONS = {
  common: [
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'lift', label: 'Lift', icon: Shield },
    { id: 'power', label: 'Power Backup', icon: Zap },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'cctv', label: 'CCTV', icon: Video },
    { id: 'water', label: 'Water Supply', icon: Droplets },
  ],
  lifestyle: [
    { id: 'pool', label: 'Swimming Pool', icon: Waves },
    { id: 'gym', label: 'Gym', icon: Dumbbell },
    { id: 'club', label: 'Clubhouse', icon: Coffee },
    { id: 'children', label: 'Kids Area', icon: Users },
    { id: 'garden', label: 'Garden', icon: TreePine },
    { id: 'jogging', label: 'Jogging Track', icon: Activity },
  ],
  premium: [
    { id: 'smart', label: 'Smart Home', icon: Lamp },
    { id: 'ev', label: 'EV Charging', icon: Zap },
    { id: 'coworking', label: 'Co-working', icon: Layout },
  ]
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Lakshadweep", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { properties, addProperty, updateProperty } = useProperties();
  const { addNotification } = useNotifications();

  const [step, setStep] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [docs, setDocs] = useState<{type: string, name: string, url: string}[]>([]);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Step 6 – Media
  const [imgUrlInput, setImgUrlInput] = useState('');

  // Step 7 – Documents
  const [addingDoc, setAddingDoc] = useState(false);
  const [newDocLabel, setNewDocLabel] = useState('');
  const [newDocType, setNewDocType] = useState('Brochure');
  const [editingDocIdx, setEditingDocIdx] = useState<number | null>(null);
  const [editingDocName, setEditingDocName] = useState('');

  // ── Location validation state ────────────────────────────────────────────────
  const [locErrors, setLocErrors] = useState<Record<string, string>>({});
  const [locTouched, setLocTouched] = useState<Record<string, boolean>>({});
  const [pincodeStatus, setPincodeStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');
  const [pincodeDistrict, setPincodeDistrict] = useState('');
  const [geocodeStatus, setGeocodeStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');
  const [mapPreviewUrl, setMapPreviewUrl] = useState('');

  // Dummy / junk pattern detector
  const isDummyText = (val: string): boolean => {
    if (!val) return false;
    const v = val.trim().toLowerCase();
    const BLOCKLIST = ['test','dummy','sample','abc','xyz','asdf','qwerty','aaaa','bbbb','cccc','1234',
      'na','n/a','null','none','temp','fake','demo','random','unknown','xxx','zzz','hello','hi','ok'];
    if (BLOCKLIST.some(b => v === b || v.startsWith(b+' ') || v.endsWith(' '+b))) return true;
    if (/(.)\1{2,}/.test(v)) return true;
    if (/^\d+$/.test(v)) return true;
    if (v.replace(/\s/g,'').length < 2) return true;
    return false;
  };

  const validateLocField = (field: string, value: string | null | undefined): string => {
    const v = (value ?? '').trim();
    switch (field) {
      case 'state':
        if (!v) return 'State is required.';
        return '';
      case 'city': {
        if (!v) return 'City is required.';
        if (v.length < 2) return 'City name is too short.';
        if (!/^[a-zA-Z\s\-\.]+$/.test(v)) return 'City name must contain only letters.';
        if (isDummyText(v)) return 'Enter a real city name.';
        return '';
      }
      case 'pincode': {
        if (!v) return 'Pincode is required.';
        if (!/^\d{6}$/.test(v)) return 'Pincode must be exactly 6 digits.';
        if (/^(\d)\1{5}$/.test(v)) return 'Enter a valid pincode (not repeated digits).';
        if (['000000','111111','999999','123456','654321'].includes(v)) return 'Enter a real Indian pincode.';
        return '';
      }
      case 'area': {
        if (!v) return 'Area / Locality is required.';
        if (v.length < 3) return 'Locality name is too short.';
        if (isDummyText(v)) return 'Enter a real locality name.';
        return '';
      }
      case 'address': {
        if (!v) return 'Complete address is required.';
        if (v.length < 15) return `Address is too short — add at least ${15 - v.length} more characters.`;
        if (isDummyText(v)) return 'Enter a real complete address.';
        return '';
      }
      case 'lat': {
        if (!v) return '';
        const n = parseFloat(v);
        if (isNaN(n)) return 'Enter a valid decimal latitude.';
        if (n < 6.0 || n > 37.6) return 'Latitude must be within India (6° – 37.6° N).';
        return '';
      }
      case 'lng': {
        if (!v) return '';
        const n = parseFloat(v);
        if (isNaN(n)) return 'Enter a valid decimal longitude.';
        if (n < 68.0 || n > 97.5) return 'Longitude must be within India (68° – 97.5° E).';
        return '';
      }
      case 'mapUrl': {
        if (!v) return '';
        if (!v.startsWith('http')) return 'Must be a valid URL starting with http.';
        if (!v.includes('google.com/maps') && !v.includes('maps.app.goo.gl') && !v.includes('goo.gl/maps')) {
          return 'Please use a Google Maps share link.';
        }
        return '';
      }
      default: return '';
    }
  };

  const touchLocField = (field: string, value: string) => {
    setLocTouched(prev => ({ ...prev, [field]: true }));
    setLocErrors(prev => ({ ...prev, [field]: validateLocField(field, value) }));
  };

  // ── Input styling helpers (ivory/gold theme) ─────────────────────────────────
  const inputBase = 'w-full border rounded-xl px-4 py-3 outline-none transition-all text-sm focus:ring-2 focus:ring-amber-300/40';
  const inputDefault: React.CSSProperties = { background: IVORY_BG, borderColor: BORDER_MID, color: TEXT_DARK };
  const inputError: React.CSSProperties = { background: '#fff5f5', borderColor: '#f87171', color: '#7f1d1d' };
  const inputSuccess: React.CSSProperties = { background: '#f0fdf4', borderColor: '#4ade80', color: '#14532d' };

  const locFieldStyle = (field: string): React.CSSProperties => {
    if (!locTouched[field]) return inputDefault;
    if (locErrors[field]) return inputError;
    return inputSuccess;
  };

  const locFieldClass = (field: string) => {
    return `${inputBase}`;
  };

  // Build the iframe embed URL (no API key needed)
  const buildMapEmbedUrl = (lat: string, lng: string, query?: string): string => {
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (GOOGLE_MAPS_API_KEY) {
      if (lat && lng) return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${lat},${lng}&zoom=15`;
      if (query) return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(query)}&zoom=13`;
    }
    if (lat && lng) return `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`;
    if (query) return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=en&z=13&output=embed`;
    return '';
  };

  const buildMapsOpenUrl = (lat: string, lng: string, query?: string): string => {
    if (lat && lng) return `https://www.google.com/maps?q=${lat},${lng}`;
    if (query) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    return '';
  };

  const parseCoordsFromMapsUrl = (url: string): { lat: string; lng: string } | null => {
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
    ];
    for (const pat of patterns) {
      const m = url.match(pat);
      if (m) return { lat: m[1], lng: m[2] };
    }
    return null;
  };

  // Geocode address → lat/lng via Nominatim (OpenStreetMap, free, no key)
  const geocodeAddress = async () => {
    const loc = formData.location;
    const parts = [loc.area, loc.city, loc.state, 'India'].filter(Boolean);
    if (parts.length < 2) return;
    const query = parts.join(', ');
    setGeocodeStatus('loading');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'AntigravityApp/1.0' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const roundedLat = parseFloat(lat).toFixed(6);
        const roundedLng = parseFloat(lon).toFixed(6);
        setFormData(prev => ({
          ...prev,
          location: { ...prev.location, lat: roundedLat, lng: roundedLng }
        }));
        setLocTouched(prev => ({ ...prev, lat: true, lng: true }));
        setLocErrors(prev => ({
          ...prev,
          lat: validateLocField('lat', roundedLat),
          lng: validateLocField('lng', roundedLng),
        }));
        setMapPreviewUrl(buildMapEmbedUrl(roundedLat, roundedLng));
        setGeocodeStatus('ok');
      } else {
        setGeocodeStatus('error');
      }
    } catch {
      setGeocodeStatus('error');
    }
  };

  const updateMapPreview = (lat: string, lng: string, city?: string, state?: string) => {
    const latErr = validateLocField('lat', lat);
    const lngErr = validateLocField('lng', lng);
    if (lat && lng && !latErr && !lngErr) {
      setMapPreviewUrl(buildMapEmbedUrl(lat, lng));
    } else if (city || state) {
      const query = [city, state, 'India'].filter(Boolean).join(', ');
      setMapPreviewUrl(buildMapEmbedUrl('', '', query));
    }
  };

  const autofillFromPincode = async (pincode: string) => {
    const err = validateLocField('pincode', pincode);
    setLocErrors(prev => ({ ...prev, pincode: err }));
    setLocTouched(prev => ({ ...prev, pincode: true }));
    if (err || pincode.length !== 6) { setPincodeStatus('idle'); return; }
    setPincodeStatus('loading');
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const district = po.District || po.Division || '';
        setPincodeDistrict(district);
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            state: po.State || prev.location.state,
            city: po.District || prev.location.city,
            area: prev.location.area || po.Name || '',
          }
        }));
        setLocTouched(prev => ({ ...prev, state: true, city: true }));
        setLocErrors(prev => ({
          ...prev,
          state: validateLocField('state', po.State || ''),
          city: validateLocField('city', po.District || ''),
          pincode: '',
        }));
        setPincodeStatus('ok');
        updateMapPreview('', '', po.District || '', po.State || '');
      } else {
        setPincodeStatus('error');
        setLocErrors(prev => ({ ...prev, pincode: 'Pincode not found in India Post database.' }));
      }
    } catch {
      setPincodeStatus('error');
      setLocErrors(prev => ({ ...prev, pincode: 'Could not verify pincode. Please check your connection.' }));
    }
  };

  const locationScore = (): number => {
    const loc = formData.location;
    let score = 0;
    if (loc.state) score += 15;
    if (loc.city && !validateLocField('city', loc.city)) score += 20;
    if (loc.pincode && !validateLocField('pincode', loc.pincode)) score += 20;
    if (loc.area && !validateLocField('area', loc.area)) score += 15;
    if (loc.address && !validateLocField('address', loc.address)) score += 20;
    if (loc.lat && loc.lng && !validateLocField('lat', loc.lat) && !validateLocField('lng', loc.lng)) score += 10;
    return score;
  };

  const isLocationValid = (): boolean => {
    const loc = formData.location;
    return (
      !validateLocField('state', loc.state) &&
      !validateLocField('city', loc.city) &&
      !validateLocField('pincode', loc.pincode) &&
      !validateLocField('area', loc.area) &&
      !validateLocField('address', loc.address) &&
      (loc.lat ? !validateLocField('lat', loc.lat) : true) &&
      (loc.lng ? !validateLocField('lng', loc.lng) : true)
    );
  };

  const [formData, setFormData] = useState({
    name: '', type: 'Apartment', statusEnum: 'Upcoming', reraId: '',
    launchDate: '', possessionDate: '',
    location: { country: 'India', state: '', city: '', area: '', address: '', pincode: '', mapUrl: '', lat: '', lng: '' },
    pricing: { minPrice: '', maxPrice: '', pricePerSqFt: '', bookingAmount: '', maintenance: '', commissionValue: '2', requiredApproval: false },
    units: [{ id: Math.random().toString(), name: '3BHK Standard', beds: 3, baths: 3, balconies: 1, superArea: 1450, carpetArea: 1200, price: 15000000, maxPrice: 16000000, total: 20, available: 20 }],
    amenities: { common: [] as string[], lifestyle: [] as string[], premium: [] as string[] },
    builder: { name: '', contact: '', email: '', address: '' },
    settings: { visitAvailable: 'Weekdays & Weekends', timeSlots: '10 AM - 6 PM', autoApprove: true, tags: '', keywords: '', featured: false }
  });

  const DRAFT_KEY = 'gxc-project-draft-v2';
  const [draftPending, setDraftPending] = useState<{ formData: any; step: number; images: string[] } | null>(null);

  useEffect(() => {
    if (editId) {
      const p = properties.find(x => x.id === editId);
      if (p) {
        setFormData({
          name: (p as any).name || '',
          type: (p as any).type || 'Apartment',
          statusEnum: (p as any).statusEnum || 'Upcoming',
          reraId: p.reraId || '',
          launchDate: p.launchDate || '',
          possessionDate: p.possessionDate || '',
          location: typeof p.location === 'object' ? p.location : { country: 'India', state: '', city: '', area: typeof p.location === 'string' ? p.location : '', address: '', pincode: '', mapUrl: '', lat: '', lng: '' },
          pricing: p.pricing || { minPrice: (p as any).price?.toString() || '', maxPrice: '', pricePerSqFt: '', bookingAmount: '', maintenance: '', commissionValue: (p as any).commissionPct?.toString() || '2', requiredApproval: false },
          units: p.units?.length ? p.units : [{ id: Math.random().toString(), name: 'Default Unit', beds: (p as any).beds || 3, baths: (p as any).baths || 3, balconies: 1, superArea: 1450, carpetArea: 1200, price: 0, maxPrice: 0, total: 1, available: 1 }],
          amenities: p.amenities && !Array.isArray(p.amenities) ? p.amenities : { common: Array.isArray(p.amenities) ? p.amenities : [], lifestyle: [], premium: [] },
          builder: p.builder || { name: '', contact: '', email: '', address: '' },
          settings: p.settings || { visitAvailable: 'Weekdays & Weekends', timeSlots: '10 AM - 6 PM', autoApprove: true, tags: '', keywords: '', featured: false }
        } as any);
        setImages(p.images || []);
        const existingDocs = (p as any).documents || (p as any).docs || [];
        setDocs(existingDocs.map((d: any) => ({ type: d.type || 'Other', name: d.title || d.name || d.type, url: d.url })));
      }
    } else {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.formData?.name?.trim()) {
            setDraftPending(parsed);
          } else {
            localStorage.removeItem(DRAFT_KEY);
          }
        } catch (e) {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    }
  }, [editId, properties]);

  useEffect(() => {
    if (!editId) localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, step, images }));
  }, [formData, step, images]);

  const toggleAmenity = (category: 'common'|'lifestyle'|'premium', id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [category]: prev.amenities[category].includes(id) ? prev.amenities[category].filter(a => a !== id) : [...prev.amenities[category], id]
      }
    }));
  };

  const addUnit = () => {
    setFormData(prev => ({
      ...prev,
      units: [...prev.units, { id: Math.random().toString(), name: 'New Unit', beds: 2, baths: 2, balconies: 1, superArea: 1000, carpetArea: 800, price: 0, maxPrice: 0, total: 10, available: 10 }]
    }));
  };

  const removeUnit = (id: string) => {
    setFormData(prev => ({ ...prev, units: prev.units.filter(u => u.id !== id) }));
  };

  const updateUnit = (id: string, field: string, value: any) => {
    setFormData(prev => ({ ...prev, units: prev.units.map(u => u.id === id ? { ...u, [field]: value } : u) }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      name: formData.name,
      type: formData.type,
      statusEnum: formData.statusEnum,
      reraId: formData.reraId,
      launchDate: formData.launchDate,
      possessionDate: formData.possessionDate,
      location: formData.location,
      pricing: {
        minPrice: parseFloat(formData.pricing.minPrice) || 0,
        maxPrice: parseFloat(formData.pricing.maxPrice) || 0,
        pricePerSqFt: parseFloat(formData.pricing.pricePerSqFt) || 0,
        bookingAmount: parseFloat(formData.pricing.bookingAmount) || 0,
        maintenance: parseFloat(formData.pricing.maintenance) || 0,
        commissionValue: parseFloat(formData.pricing.commissionValue) || 2,
        requiredApproval: formData.pricing.requiredApproval
      },
      units: formData.units as any,
      amenities: formData.amenities as any,
      images,
      docs,
      builder: formData.builder,
      settings: { ...formData.settings, tags: formData.settings.tags.split(',').map(t=>t.trim()) },
      tag: 'New Listing',
      tagColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      gradient: 'from-indigo-500/10 to-transparent',
      emoji: formData.type === 'Apartment' ? '🏙️' : '🏡',
      status: 'pending' as any,
    };

    setIsSubmitting(true);
    try {
      if (editId) {
        await updateProperty(editId, payload);
        addNotification({ type: 'success', title: 'Project Updated', message: 'Your project has been updated successfully.', category: 'system' });
      } else {
        await addProperty(payload);
        localStorage.removeItem(DRAFT_KEY);
        addNotification({ type: 'success', title: 'Project Submitted', message: 'Your project is pending approval.', category: 'system' });
      }
      router.push('/dashboard');
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Submission Failed', message: err?.message || 'Could not save project. Please try again.', category: 'system' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const STEPS = [
    { id: 1, title: 'Basic Info' },
    { id: 2, title: 'Location' },
    { id: 3, title: 'Pricing' },
    { id: 4, title: 'Unit Config' },
    { id: 5, title: 'Amenities' },
    { id: 6, title: 'Media' },
    { id: 7, title: 'Documents' },
    { id: 8, title: 'Review' }
  ];

  // ── Label helper ─────────────────────────────────────────────────────────────
  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-xs font-black uppercase tracking-widest mb-1.5 block" style={{ color: TEXT_SOFT }}>
      {children}
    </label>
  );

  return (
    <div style={{ background: IVORY_BG, color: TEXT_DARK }} className="h-screen overflow-hidden flex flex-col font-sans">

      {/* ── FIXED TOP: header + stepper ────────────────────────────────────────── */}
      <div className="shrink-0 px-6 md:px-10 pt-6 pb-0" style={{ borderBottom: `1px solid ${BORDER}`, background: IVORY }}>

        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full border"
              style={{ background: 'rgba(212,168,67,0.08)', borderColor: BORDER }}>
              <Building2 className="w-3.5 h-3.5" style={{ color: GOLD }} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Enterprise Project</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: TEXT_DARK }}>
              {editId ? 'Edit Project' : 'Create Master Project'}
            </h1>
            <p className="text-sm font-medium mt-0.5" style={{ color: TEXT_SOFT }}>Step-by-step project taxonomy compliance</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button"
              onClick={() => { localStorage.removeItem(DRAFT_KEY); window.location.reload(); }}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-rose-50"
              style={{ border: `1px solid ${BORDER}`, color: '#e11d48', background: 'transparent' }}>
              Reset
            </button>
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-amber-50"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_MID, background: 'transparent' }}>
              Cancel
            </button>
          </div>
        </div>

        {/* 8-step stepper */}
        <div className="pb-5 overflow-x-auto">
          <div className="flex items-start min-w-[640px]">
            {STEPS.map((s, idx) => {
              const isActive = step === s.id;
              const isDone = step > s.id;
              const isLast = idx === STEPS.length - 1;
              return (
                <div key={s.id} className="flex items-start flex-1 last:flex-none">
                  {/* dot + label */}
                  <button
                    type="button"
                    onClick={() => (isDone || isActive) && setStep(s.id)}
                    className="flex flex-col items-center gap-1.5 group shrink-0"
                    style={{ cursor: isDone || isActive ? 'pointer' : 'default' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-200"
                      style={
                        isActive
                          ? { background: GOLD, color: '#fff', boxShadow: `0 0 0 4px rgba(201,162,39,0.18)` }
                          : isDone
                          ? { background: '#10b981', color: '#fff' }
                          : { background: IVORY_BG, border: `2px solid ${BORDER}`, color: TEXT_SOFT }
                      }
                    >
                      {isDone ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : s.id}
                    </div>
                    <span
                      className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                      style={{ color: isActive ? GOLD : isDone ? TEXT_MID : TEXT_SOFT }}
                    >
                      {s.title}
                    </span>
                  </button>
                  {/* connector line */}
                  {!isLast && (
                    <div className="flex-1 h-[2px] mt-4 mx-1 rounded-full transition-all duration-500"
                      style={{ background: isDone ? '#10b981' : BORDER }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE FORM CARD ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden px-6 md:px-10 py-6">
        <div className="h-full rounded-2xl border overflow-hidden flex flex-col"
          style={{ background: IVORY, borderColor: BORDER, boxShadow: '0 4px 24px rgba(180,130,30,0.08)' }}>

          {/* Draft restore banner */}
          {draftPending && (
            <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-3 border-b"
              style={{ background: 'rgba(212,168,67,0.08)', borderColor: BORDER }}>
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: TEXT_DARK }}>Draft found: &quot;{draftPending.formData?.name}&quot;</p>
                  <p className="text-xs" style={{ color: TEXT_SOFT }}>Step {draftPending.step} of 8</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button"
                  onClick={() => {
                    setFormData(draftPending.formData);
                    setStep(draftPending.step || 1);
                    setImages(draftPending.images || []);
                    setDraftPending(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ background: GOLD }}>
                  Resume
                </button>
                <button type="button"
                  onClick={() => { localStorage.removeItem(DRAFT_KEY); setDraftPending(null); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT_MID }}>
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* Scrollable form content */}
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
            <form onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}>

              {/* ── STEP 1: BASIC INFO ────────────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-xl font-black pb-3 mb-5 border-b" style={{ color: TEXT_DARK, borderColor: BORDER }}>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label>Project Name</Label>
                      <input
                        required
                        className={inputBase}
                        style={inputDefault}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Project Type</Label>
                      <select
                        className={inputBase}
                        style={inputDefault}
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}>
                        {['Apartment', 'Villa', 'Plot', 'Commercial'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <select
                        className={inputBase}
                        style={inputDefault}
                        value={formData.statusEnum}
                        onChange={e => setFormData({ ...formData, statusEnum: e.target.value })}>
                        {['Upcoming', 'Under Construction', 'Ready to Move'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Launch Date</Label>
                      <input
                        type="date"
                        className={inputBase}
                        style={inputDefault}
                        value={formData.launchDate}
                        onChange={e => setFormData({ ...formData, launchDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Possession Date</Label>
                      <input
                        type="date"
                        className={inputBase}
                        style={inputDefault}
                        value={formData.possessionDate}
                        onChange={e => setFormData({ ...formData, possessionDate: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>RERA Registration Number</Label>
                      <input
                        placeholder="Ex: P518000XXXXX"
                        className={inputBase}
                        style={inputDefault}
                        value={formData.reraId}
                        onChange={e => setFormData({ ...formData, reraId: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: LOCATION ─────────────────────────────────────────── */}
              {step === 2 && (() => {
                const score = locationScore();
                const scoreColor = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-rose-500';
                const scoreLabel = score >= 80 ? 'Strong' : score >= 50 ? 'Moderate' : 'Weak';
                const scoreLabelColor = score >= 80 ? '#059669' : score >= 50 ? '#b45309' : '#dc2626';
                return (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-start justify-between border-b pb-4 gap-4" style={{ borderColor: BORDER }}>
                      <div>
                        <h3 className="text-xl font-black mb-1" style={{ color: TEXT_DARK }}>Location Matrix</h3>
                        <p className="text-xs font-medium" style={{ color: TEXT_SOFT }}>All fields are verified. Dummy or test data will be rejected.</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-bold mb-1 uppercase tracking-widest" style={{ color: TEXT_SOFT }}>Accuracy</div>
                        <div className="flex items-center gap-2">
                          <div className="w-28 h-2 rounded-full overflow-hidden" style={{ background: BORDER }}>
                            <div className={`h-full rounded-full transition-all duration-500 ${scoreColor}`} style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-xs font-extrabold" style={{ color: scoreLabelColor }}>{score}% {scoreLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pincode lookup */}
                    <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(212,168,67,0.08)', border: `1px solid ${BORDER}` }}>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD_DARK }}>
                        <MapPin className="w-3.5 h-3.5" /> Pincode Lookup — auto-fills city &amp; state
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input
                            maxLength={6}
                            placeholder="e.g. 400001"
                            className={`${locFieldClass('pincode')} font-mono text-lg tracking-widest`}
                            style={locFieldStyle('pincode')}
                            value={formData.location.pincode}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, '');
                              setFormData(prev => ({ ...prev, location: { ...prev.location, pincode: v } }));
                              if (v.length === 6) autofillFromPincode(v);
                              else { setPincodeStatus('idle'); setPincodeDistrict(''); }
                            }}
                            onBlur={e => touchLocField('pincode', e.target.value)}
                          />
                          {locTouched.pincode && locErrors.pincode && (
                            <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.pincode}
                            </p>
                          )}
                        </div>
                        <div className="pt-3">
                          {pincodeStatus === 'loading' && <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD }} />}
                          {pincodeStatus === 'ok' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                          {pincodeStatus === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500" />}
                        </div>
                      </div>
                      {pincodeStatus === 'ok' && pincodeDistrict && (
                        <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified — District: {pincodeDistrict}. City &amp; State auto-filled below.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Country */}
                      <div>
                        <Label>Country <span className="text-rose-500">*</span></Label>
                        <select
                          className={inputBase}
                          style={inputDefault}
                          value={formData.location.country}
                          onChange={e => setFormData({ ...formData, location: { ...formData.location, country: e.target.value, state: '' } })}>
                          <option value="India">India</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* State */}
                      <div>
                        <Label>State <span className="text-rose-500">*</span></Label>
                        {formData.location.country === 'India' ? (
                          <select
                            className={`${locFieldClass('state')} appearance-none cursor-pointer`}
                            style={locFieldStyle('state')}
                            value={formData.location.state}
                            onChange={e => {
                              setFormData(prev => ({ ...prev, location: { ...prev.location, state: e.target.value } }));
                              touchLocField('state', e.target.value);
                            }}
                            onBlur={e => touchLocField('state', e.target.value)}>
                            <option value="">— Select State —</option>
                            {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                          </select>
                        ) : (
                          <input
                            placeholder="Enter State / Province"
                            className={locFieldClass('state')}
                            style={locFieldStyle('state')}
                            value={formData.location.state}
                            onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, state: e.target.value } }))}
                            onBlur={e => touchLocField('state', e.target.value)}
                          />
                        )}
                        {locTouched.state && locErrors.state && (
                          <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.state}
                          </p>
                        )}
                      </div>

                      {/* City */}
                      <div>
                        <Label>
                          City <span className="text-rose-500">*</span>
                          <span className="ml-2 text-[10px] font-normal" style={{ color: TEXT_SOFT }}>No abbreviations or codes</span>
                        </Label>
                        <input
                          placeholder="e.g. Mumbai, Pune, Bengaluru"
                          className={locFieldClass('city')}
                          style={locFieldStyle('city')}
                          value={formData.location.city}
                          onChange={e => {
                            const v = e.target.value.replace(/[^a-zA-Z\s\-\.]/g, '');
                            setFormData(prev => ({ ...prev, location: { ...prev.location, city: v } }));
                            if (locTouched.city) setLocErrors(prev => ({ ...prev, city: validateLocField('city', v) }));
                          }}
                          onBlur={e => touchLocField('city', e.target.value)}
                        />
                        {locTouched.city && locErrors.city && (
                          <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.city}
                          </p>
                        )}
                        {locTouched.city && !locErrors.city && formData.location.city && (
                          <p className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />Looks good
                          </p>
                        )}
                      </div>

                      {/* Area / Locality */}
                      <div>
                        <Label>
                          Area / Locality <span className="text-rose-500">*</span>
                          <span className="ml-2 text-[10px] font-normal" style={{ color: TEXT_SOFT }}>Neighbourhood or sector name</span>
                        </Label>
                        <input
                          placeholder="e.g. Bandra West, Koregaon Park"
                          className={locFieldClass('area')}
                          style={locFieldStyle('area')}
                          value={formData.location.area}
                          onChange={e => {
                            const v = e.target.value;
                            setFormData(prev => ({ ...prev, location: { ...prev.location, area: v } }));
                            if (locTouched.area) setLocErrors(prev => ({ ...prev, area: validateLocField('area', v) }));
                          }}
                          onBlur={e => touchLocField('area', e.target.value)}
                        />
                        {locTouched.area && locErrors.area && (
                          <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.area}
                          </p>
                        )}
                        {locTouched.area && !locErrors.area && formData.location.area && (
                          <p className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />Looks good
                          </p>
                        )}
                      </div>

                      {/* Complete Address */}
                      <div className="md:col-span-2">
                        <Label>
                          Complete Address <span className="text-rose-500">*</span>
                          <span className="ml-2 text-[10px] font-normal" style={{ color: TEXT_SOFT }}>Include building/plot no., street, landmark</span>
                        </Label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Plot 12, Sector 7, Near City Mall, MG Road, Mumbai — 400001"
                          className={`${locFieldClass('address')} resize-none`}
                          style={locFieldStyle('address')}
                          value={formData.location.address}
                          onChange={e => {
                            const v = e.target.value;
                            setFormData(prev => ({ ...prev, location: { ...prev.location, address: v } }));
                            if (locTouched.address) setLocErrors(prev => ({ ...prev, address: validateLocField('address', v) }));
                          }}
                          onBlur={e => touchLocField('address', e.target.value)}
                        />
                        <div className="flex justify-between items-center mt-1">
                          {locTouched.address && locErrors.address ? (
                            <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.address}
                            </p>
                          ) : locTouched.address && !locErrors.address ? (
                            <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />Looks good
                            </p>
                          ) : <span />}
                          <span className={`text-xs font-mono ${formData.location.address.length < 15 ? 'text-rose-400' : 'text-neutral-400'}`}>
                            {formData.location.address.length}/15 min chars
                          </span>
                        </div>
                      </div>

                      {/* GPS + Map section */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="p-4 rounded-2xl space-y-4" style={{ background: IVORY_BG, border: `1px solid ${BORDER}` }}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <MapIcon className="w-4 h-4" style={{ color: TEXT_SOFT }} />
                              <span className="text-sm font-bold" style={{ color: TEXT_MID }}>GPS Coordinates</span>
                              <span className="text-xs font-medium" style={{ color: TEXT_SOFT }}>Optional · Must be within India</span>
                            </div>
                            <button
                              type="button"
                              onClick={geocodeAddress}
                              disabled={geocodeStatus === 'loading' || (!formData.location.city && !formData.location.area)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              style={{ background: 'rgba(212,168,67,0.08)', border: `1px solid ${BORDER}`, color: GOLD_DARK }}>
                              {geocodeStatus === 'loading'
                                ? <><div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD }} /> Geocoding…</>
                                : geocodeStatus === 'ok'
                                ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Geocoded</>
                                : <><MapPin className="w-3.5 h-3.5" /> Auto-detect Coordinates</>}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Latitude (°N)</Label>
                              <input
                                type="number" step="0.000001" placeholder="e.g. 19.076090"
                                className={locFieldClass('lat')}
                                style={locFieldStyle('lat')}
                                value={formData.location.lat}
                                onChange={e => {
                                  const v = e.target.value;
                                  setFormData(prev => ({ ...prev, location: { ...prev.location, lat: v } }));
                                  if (locTouched.lat) setLocErrors(prev => ({ ...prev, lat: validateLocField('lat', v) }));
                                  updateMapPreview(v, formData.location.lng);
                                }}
                                onBlur={e => {
                                  touchLocField('lat', e.target.value);
                                  updateMapPreview(e.target.value, formData.location.lng);
                                }}
                              />
                              {locTouched.lat && locErrors.lat && (
                                <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.lat}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label>Longitude (°E)</Label>
                              <input
                                type="number" step="0.000001" placeholder="e.g. 72.877670"
                                className={locFieldClass('lng')}
                                style={locFieldStyle('lng')}
                                value={formData.location.lng}
                                onChange={e => {
                                  const v = e.target.value;
                                  setFormData(prev => ({ ...prev, location: { ...prev.location, lng: v } }));
                                  if (locTouched.lng) setLocErrors(prev => ({ ...prev, lng: validateLocField('lng', v) }));
                                  updateMapPreview(formData.location.lat, v);
                                }}
                                onBlur={e => {
                                  touchLocField('lng', e.target.value);
                                  updateMapPreview(formData.location.lat, e.target.value);
                                }}
                              />
                              {locTouched.lng && locErrors.lng && (
                                <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.lng}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Google Maps Share Link */}
                          <div>
                            <Label>
                              Google Maps Share Link
                              <span className="ml-2 font-normal" style={{ color: TEXT_SOFT }}>Paste URL to auto-extract coordinates</span>
                            </Label>
                            <input
                              type="url"
                              placeholder="https://maps.app.goo.gl/… or https://www.google.com/maps/@…"
                              className={locFieldClass('mapUrl')}
                              style={locFieldStyle('mapUrl')}
                              value={formData.location.mapUrl}
                              onChange={e => {
                                const v = e.target.value;
                                setFormData(prev => ({ ...prev, location: { ...prev.location, mapUrl: v } }));
                                if (locTouched.mapUrl) setLocErrors(prev => ({ ...prev, mapUrl: validateLocField('mapUrl', v) }));
                                const coords = parseCoordsFromMapsUrl(v);
                                if (coords) {
                                  setFormData(prev => ({ ...prev, location: { ...prev.location, mapUrl: v, lat: coords.lat, lng: coords.lng } }));
                                  setLocTouched(prev => ({ ...prev, lat: true, lng: true }));
                                  setLocErrors(prev => ({
                                    ...prev,
                                    lat: validateLocField('lat', coords.lat),
                                    lng: validateLocField('lng', coords.lng),
                                  }));
                                  updateMapPreview(coords.lat, coords.lng);
                                }
                              }}
                              onBlur={e => touchLocField('mapUrl', e.target.value)}
                            />
                            {locTouched.mapUrl && locErrors.mapUrl && (
                              <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.mapUrl}
                              </p>
                            )}
                            {formData.location.lat && formData.location.lng && !locErrors.lat && !locErrors.lng && (
                              <p className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Coordinates extracted: {parseFloat(formData.location.lat).toFixed(4)}°N, {parseFloat(formData.location.lng).toFixed(4)}°E
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Live Map Preview */}
                        {mapPreviewUrl && (
                          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: BORDER, boxShadow: '0 2px 12px rgba(180,130,30,0.08)' }}>
                            <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: IVORY_BG, borderColor: BORDER }}>
                              <div className="flex items-center gap-2 text-xs font-bold" style={{ color: TEXT_MID }}>
                                <MapPin className="w-3.5 h-3.5" style={{ color: GOLD }} />
                                Map Preview
                                {formData.location.lat && formData.location.lng && !locErrors.lat && !locErrors.lng
                                  ? <span className="text-emerald-600">· Exact pin</span>
                                  : <span className="text-amber-600">· Approximate (city-level)</span>
                                }
                              </div>
                              {(() => {
                                const openUrl = buildMapsOpenUrl(
                                  formData.location.lat,
                                  formData.location.lng,
                                  [formData.location.area, formData.location.city, formData.location.state, 'India'].filter(Boolean).join(', ')
                                );
                                return openUrl ? (
                                  <a href={openUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs font-bold transition-colors"
                                    style={{ color: GOLD }}>
                                    Open in Google Maps <ChevronRight className="w-3 h-3" />
                                  </a>
                                ) : null;
                              })()}
                            </div>
                            <iframe
                              src={mapPreviewUrl}
                              width="100%"
                              height="280"
                              style={{ border: 0 }}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Property Location Map"
                            />
                          </div>
                        )}

                        {/* Show map trigger when no preview yet */}
                        {!mapPreviewUrl && (formData.location.city || formData.location.state) && (
                          <button
                            type="button"
                            onClick={() => updateMapPreview('', '', formData.location.city, formData.location.state)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-sm font-bold transition-all"
                            style={{ borderColor: GOLD, color: GOLD_DARK, background: 'rgba(212,168,67,0.05)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,168,67,0.12)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,168,67,0.05)'; }}>
                            <MapIcon className="w-4 h-4" /> Show Location Preview Map
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Validation summary banner */}
                    {!isLocationValid() && Object.values(locTouched).some(Boolean) && (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-rose-800">Fix errors before proceeding</p>
                          <p className="text-xs text-rose-600 mt-0.5">Required: State, City, Pincode, Area, and a complete Address (min 15 chars).</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── STEP 3: PRICING ──────────────────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-xl font-black pb-3 mb-5 border-b" style={{ color: TEXT_DARK, borderColor: BORDER }}>
                    Global Pricing &amp; Deals
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Minimum Project Price (₹)</Label>
                      <input
                        required type="number"
                        className={inputBase} style={inputDefault}
                        value={formData.pricing.minPrice}
                        onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, minPrice: e.target.value } })}
                      />
                    </div>
                    <div>
                      <Label>Maximum Project Price (₹)</Label>
                      <input
                        type="number"
                        className={inputBase} style={inputDefault}
                        value={formData.pricing.maxPrice}
                        onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, maxPrice: e.target.value } })}
                      />
                    </div>
                    <div>
                      <Label>Avg Price per Sq.Ft (₹)</Label>
                      <input
                        type="number"
                        className={inputBase} style={inputDefault}
                        value={formData.pricing.pricePerSqFt}
                        onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, pricePerSqFt: e.target.value } })}
                      />
                    </div>
                    <div>
                      <Label>Token / Booking Amount (₹)</Label>
                      <input
                        type="number"
                        className={inputBase} style={inputDefault}
                        value={formData.pricing.bookingAmount}
                        onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, bookingAmount: e.target.value } })}
                      />
                    </div>
                    <div className="md:col-span-2 p-6 rounded-2xl mt-4" style={{ background: 'rgba(212,168,67,0.08)', border: `1px solid ${BORDER}` }}>
                      <h4 className="font-bold mb-4" style={{ color: TEXT_DARK }}>Channel Partner Incentives</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Incentive % (Base)</Label>
                          <input
                            required type="number" step="0.1"
                            className={inputBase}
                            style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK, fontWeight: 700 }}
                            value={formData.pricing.commissionValue}
                            onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, commissionValue: e.target.value } })}
                          />
                        </div>
                        <div className="flex flex-col justify-center items-start pt-4">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-sm" style={{ color: TEXT_DARK }}>
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-amber-500 rounded"
                              checked={formData.pricing.requiredApproval}
                              onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, requiredApproval: e.target.checked } })}
                            />
                            Require Auto/Manual Deal Approval?
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: UNIT CONFIG ───────────────────────────────────────── */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="border-b pb-4 flex justify-between items-end" style={{ borderColor: BORDER }}>
                    <div>
                      <h3 className="text-xl font-black mb-1" style={{ color: TEXT_DARK }}>
                        Unit Configurations
                        <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-600 rounded ml-2">REQUIRED</span>
                      </h3>
                      <p className="text-sm font-medium" style={{ color: TEXT_SOFT }}>Every project requires at least one distinct unit type.</p>
                    </div>
                    <button
                      type="button" onClick={addUnit}
                      className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:bg-amber-50"
                      style={{ border: `1px solid ${BORDER_MID}`, color: GOLD_DARK, background: 'rgba(212,168,67,0.06)' }}>
                      <PlusCircle className="w-4 h-4" /> Add Unit
                    </button>
                  </div>

                  {formData.units.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: BORDER }}>
                      <p className="font-medium" style={{ color: TEXT_SOFT }}>No units added. Add a 2BHK, 3BHK, etc. to continue.</p>
                    </div>
                  )}

                  {formData.units.map((unit, idx) => (
                    <div key={unit.id} className="p-6 rounded-2xl relative group overflow-visible shadow-sm"
                      style={{ background: IVORY_BG, border: `1px solid ${BORDER}` }}>
                      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => removeUnit(unit.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <Label>Unit Name (e.g., 3BHK Premium)</Label>
                          <input
                            required
                            className="w-full border rounded-xl px-3 py-2 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                            style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                            value={unit.name}
                            onChange={e => updateUnit(unit.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Total Units</Label>
                          <input
                            required type="number"
                            className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                            style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                            value={unit.total}
                            onChange={e => updateUnit(unit.id, 'total', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Available Units</Label>
                          <input
                            required type="number"
                            className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                            style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                            value={unit.available}
                            onChange={e => updateUnit(unit.id, 'available', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Bedrooms</Label>
                          <input
                            type="number"
                            className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                            style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                            value={unit.beds}
                            onChange={e => updateUnit(unit.id, 'beds', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Bathrooms</Label>
                          <input
                            type="number"
                            className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                            style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                            value={unit.baths}
                            onChange={e => updateUnit(unit.id, 'baths', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Carpet (sqft)</Label>
                          <input
                            type="number"
                            className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                            style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                            value={unit.carpetArea}
                            onChange={e => updateUnit(unit.id, 'carpetArea', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Super Area (sqft)</Label>
                          <input
                            type="number"
                            className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                            style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                            value={unit.superArea}
                            onChange={e => updateUnit(unit.id, 'superArea', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── STEP 5: AMENITIES ────────────────────────────────────────── */}
              {step === 5 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                  <div className="border-b pb-4" style={{ borderColor: BORDER }}>
                    <h3 className="text-xl font-black mb-1" style={{ color: TEXT_DARK }}>Curated Amenities</h3>
                  </div>

                  {(['common', 'lifestyle', 'premium'] as const).map(category => (
                    <div key={category} className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: TEXT_SOFT }}>
                        {category} Features
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {AMENITY_OPTIONS[category].map(opt => {
                          const Icon = opt.icon;
                          const isActive = formData.amenities[category].includes(opt.id);
                          return (
                            <div
                              key={opt.id} role="button" tabIndex={0}
                              onClick={() => toggleAmenity(category, opt.id)}
                              className="p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer select-none"
                              style={isActive
                                ? { background: 'rgba(212,168,67,0.12)', borderColor: GOLD, color: TEXT_DARK, boxShadow: '0 0 0 2px rgba(201,162,39,0.15)' }
                                : { background: IVORY, borderColor: BORDER, color: TEXT_MID }}>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                style={isActive
                                  ? { background: GOLD, color: '#fff' }
                                  : { background: IVORY_BG, color: TEXT_SOFT }}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold leading-tight flex-1">{opt.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── STEP 6: MEDIA ────────────────────────────────────────────── */}
              {step === 6 && (() => {
                const moveToCover = (i: number) => {
                  if (i === 0) return;
                  const next = [...images];
                  const [item] = next.splice(i, 1);
                  next.unshift(item);
                  setImages(next);
                };
                return (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="border-b pb-4 flex items-end justify-between" style={{ borderColor: BORDER }}>
                      <div>
                        <h3 className="text-xl font-black mb-1" style={{ color: TEXT_DARK }}>Visual Media</h3>
                        <p className="text-sm font-medium" style={{ color: TEXT_SOFT }}>Add project photos. The first image is the cover photo shown on listings.</p>
                      </div>
                      {images.length > 0 && (
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                          images.length >= 5 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {images.length}/{images.length >= 5 ? '5+' : '5 required'} photos
                        </span>
                      )}
                    </div>

                    {/* Photo Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((img, i) => (
                        <div key={i} className="aspect-square relative rounded-xl overflow-hidden group border-2 shadow-sm"
                          style={i === 0
                            ? { borderColor: GOLD, boxShadow: '0 0 0 2px rgba(201,162,39,0.25)' }
                            : { borderColor: BORDER }}>
                          <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg"
                              style={{ background: GOLD }}>
                              ⭐ Cover
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                            {i !== 0 && (
                              <button type="button" onClick={() => moveToCover(i)}
                                className="w-full px-2 py-1 text-white rounded-lg text-[10px] font-bold transition-colors"
                                style={{ background: GOLD }}>
                                ⭐ Set as Cover
                              </button>
                            )}
                            <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                              className="w-full px-2 py-1 bg-white text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-50 transition-colors">
                              Remove
                            </button>
                          </div>
                          {i !== 0 && (
                            <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 text-white text-[9px] font-black flex items-center justify-center">
                              {i + 1}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Upload new */}
                      <label className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors group"
                        style={{ borderColor: BORDER_MID, background: 'rgba(212,168,67,0.05)' }}>
                        <input type="file" multiple accept="image/*" className="hidden"
                          onChange={async e => {
                            if (!e.target.files?.length) return;
                            const files = Array.from(e.target.files);
                            setIsUploading(true);
                            try {
                              const urls = await uploadApi.images(files);
                              setImages(prev => [...prev, ...urls]);
                            } catch {
                              // fallback: keep blob URLs for offline preview only
                              setImages(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                            } finally {
                              setIsUploading(false);
                              e.target.value = '';
                            }
                          }} />
                        {isUploading ? (
                          <svg className="animate-spin w-8 h-8 mb-2" style={{ color: GOLD_LIGHT }} fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <ImageIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" style={{ color: GOLD_LIGHT }} />
                        )}
                        <span className="text-xs font-bold" style={{ color: GOLD_DARK }}>{isUploading ? 'Uploading…' : 'Upload Photos'}</span>
                        <span className="text-[10px] mt-0.5" style={{ color: TEXT_SOFT }}>{isUploading ? 'Please wait' : 'Multiple OK'}</span>
                      </label>
                    </div>

                    {/* URL input option */}
                    <div className="p-4 rounded-2xl" style={{ background: IVORY_BG, border: `1px solid ${BORDER}` }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: TEXT_SOFT }}>Or add photo by URL</p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/property-photo.jpg"
                          value={imgUrlInput}
                          onChange={e => setImgUrlInput(e.target.value)}
                          className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                          style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = imgUrlInput.trim();
                            if (trimmed && trimmed.startsWith('http')) {
                              setImages([...images, trimmed]);
                              setImgUrlInput('');
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl font-bold text-sm shrink-0"
                          style={GOLD_BTN}>
                          Add
                        </button>
                      </div>
                    </div>

                    {images.length < 5 && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <span className="text-amber-500 text-sm">⚠️</span>
                        <p className="text-xs font-semibold text-amber-700">
                          {5 - images.length} more photo{5 - images.length !== 1 ? 's' : ''} needed for full listing visibility. Projects with 5+ photos rank higher.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── STEP 7: DOCUMENTS ────────────────────────────────────────── */}
              {step === 7 && (() => {
                const DOC_TYPES = ['Brochure', 'Master Plan', 'Floor Plan', 'Legal Approval', 'RERA Certificate', 'Price List', 'Other'];
                const ext = (filename: string) => filename.split('.').pop()?.toLowerCase() || '';
                const docIcon2 = (name: string) => {
                  const e = ext(name);
                  if (e === 'pdf') return '📄';
                  if (['jpg','jpeg','png','webp','gif'].includes(e)) return '🖼️';
                  if (['xls','xlsx','csv'].includes(e)) return '📊';
                  return '📎';
                };
                const docTagColor = (type: string) => {
                  const map: Record<string, string> = {
                    'Brochure': 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    'Master Plan': 'bg-purple-50 text-purple-700 border-purple-200',
                    'Floor Plan': 'bg-blue-50 text-blue-700 border-blue-200',
                    'Legal Approval': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'RERA Certificate': 'bg-teal-50 text-teal-700 border-teal-200',
                    'Price List': 'bg-amber-50 text-amber-700 border-amber-200',
                    'Other': 'bg-neutral-100 text-neutral-600 border-neutral-200',
                  };
                  return map[type] || map['Other'];
                };
                return (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="border-b pb-4 flex items-end justify-between" style={{ borderColor: BORDER }}>
                      <div>
                        <h3 className="text-xl font-black mb-1" style={{ color: TEXT_DARK }}>Documents &amp; Attachments</h3>
                        <p className="text-sm font-medium" style={{ color: TEXT_SOFT }}>Upload brochures, floor plans, RERA certificates, and more. PDFs, images, or spreadsheets.</p>
                      </div>
                      {docs.length > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-black border"
                          style={{ background: 'rgba(212,168,67,0.10)', borderColor: BORDER, color: GOLD_DARK }}>
                          {docs.length} file{docs.length !== 1 ? 's' : ''} added
                        </span>
                      )}
                    </div>

                    {/* Existing docs list */}
                    {docs.length > 0 && (
                      <div className="space-y-2">
                        {docs.map((doc, i) => {
                          const isEditingDoc = editingDocIdx === i;
                          return (
                            <div key={i} className="flex items-center gap-3 p-4 rounded-xl border shadow-sm transition-colors group"
                              style={{ background: IVORY_BG, borderColor: isEditingDoc ? GOLD : BORDER }}>
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                                style={{ background: IVORY, border: `1px solid ${BORDER}` }}>
                                {docIcon2(doc.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                {isEditingDoc ? (
                                  <input
                                    autoFocus
                                    value={editingDocName}
                                    onChange={e => setEditingDocName(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        const trimmed = editingDocName.trim();
                                        if (trimmed) setDocs(docs.map((d, idx) => idx === i ? { ...d, name: trimmed } : d));
                                        setEditingDocIdx(null);
                                      }
                                      if (e.key === 'Escape') setEditingDocIdx(null);
                                    }}
                                    className="w-full font-bold text-sm rounded-lg px-2 py-0.5 outline-none border"
                                    style={{ background: IVORY, borderColor: GOLD, color: TEXT_DARK }}
                                  />
                                ) : (
                                  <p className="font-bold text-sm truncate" style={{ color: TEXT_DARK }}>{doc.name}</p>
                                )}
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wide ${docTagColor(doc.type)}`}>
                                    {doc.type}
                                  </span>
                                  {ext(doc.name) && (
                                    <span className="text-[10px] font-bold uppercase" style={{ color: TEXT_SOFT }}>.{ext(doc.name)}</span>
                                  )}
                                </div>
                              </div>
                              {isEditingDoc ? (
                                <button type="button"
                                  onClick={() => {
                                    const trimmed = editingDocName.trim();
                                    if (trimmed) setDocs(docs.map((d, idx) => idx === i ? { ...d, name: trimmed } : d));
                                    setEditingDocIdx(null);
                                  }}
                                  className="p-2 rounded-lg transition-colors"
                                  style={{ background: GOLD, color: '#fff' }}>
                                  <Check className="w-4 h-4" />
                                </button>
                              ) : (
                                <button type="button"
                                  onClick={() => { setEditingDocIdx(i); setEditingDocName(doc.name); }}
                                  className="p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                  style={{ color: TEXT_SOFT }}>
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hover:bg-amber-50"
                                style={{ color: TEXT_SOFT }}>
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button type="button" onClick={() => setDocs(docs.filter((_, idx) => idx !== i))}
                                className="p-2 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                                style={{ color: TEXT_SOFT }}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add doc zone */}
                    {addingDoc ? (
                      <div className="p-5 rounded-2xl border-2 space-y-4"
                        style={{ borderColor: BORDER_MID, background: 'rgba(212,168,67,0.06)' }}>
                        <p className="text-sm font-bold" style={{ color: TEXT_DARK }}>New Attachment</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Document Type</Label>
                            <select
                              value={newDocType}
                              onChange={e => setNewDocType(e.target.value)}
                              className={inputBase}
                              style={inputDefault}>
                              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <Label>Custom Label <span className="font-normal" style={{ color: TEXT_SOFT }}>(optional)</span></Label>
                            <input
                              type="text"
                              placeholder="e.g. Phase 1 Floor Plan, Tower A"
                              value={newDocLabel}
                              onChange={e => setNewDocLabel(e.target.value)}
                              className={inputBase}
                              style={inputDefault}
                            />
                          </div>
                        </div>
                        <label className="flex items-center justify-center gap-3 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors group hover:bg-amber-50"
                          style={{ borderColor: BORDER_MID, background: IVORY }}>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp"
                            multiple
                            className="hidden"
                            onChange={async e => {
                              if (!e.target.files?.length) return;
                              const files = Array.from(e.target.files);
                              setIsUploading(true);
                              try {
                                const urls = await uploadApi.documents(files);
                                const newDocs = files.map((f, idx) => ({
                                  type: newDocType,
                                  name: newDocLabel && files.length === 1 ? (newDocLabel + '.' + f.name.split('.').pop()) : f.name,
                                  url: urls[idx],
                                }));
                                setDocs(prev => [...prev, ...newDocs]);
                              } catch {
                                const newDocs = files.map(f => ({
                                  type: newDocType,
                                  name: newDocLabel && files.length === 1 ? (newDocLabel + '.' + f.name.split('.').pop()) : f.name,
                                  url: URL.createObjectURL(f),
                                }));
                                setDocs(prev => [...prev, ...newDocs]);
                              } finally {
                                setIsUploading(false);
                                setAddingDoc(false);
                                setNewDocLabel('');
                                setNewDocType('Brochure');
                                e.target.value = '';
                              }
                            }}
                          />
                          <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: GOLD }} />
                          <div>
                            <p className="font-bold text-sm" style={{ color: GOLD_DARK }}>Browse &amp; Select Files</p>
                            <p className="text-xs" style={{ color: TEXT_SOFT }}>PDF, Word, Excel, Images — multiple files OK</p>
                          </div>
                        </label>
                        <div className="flex gap-2 justify-end">
                          <button type="button"
                            onClick={() => { setAddingDoc(false); setNewDocLabel(''); setNewDocType('Brochure'); }}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-amber-50"
                            style={{ border: `1px solid ${BORDER}`, color: TEXT_MID }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingDoc(true)}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed font-bold text-sm transition-all hover:bg-amber-50"
                        style={{ borderColor: BORDER, color: TEXT_SOFT }}>
                        <PlusCircle className="w-4 h-4" /> Add Document / Attachment
                      </button>
                    )}

                    {docs.length === 0 && !addingDoc && (
                      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: IVORY_BG, border: `1px solid ${BORDER}` }}>
                        <span className="text-2xl">💡</span>
                        <p className="text-xs font-medium" style={{ color: TEXT_SOFT }}>
                          Adding documents like a brochure, master plan, and RERA certificate significantly increases buyer trust and deal conversion.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── STEP 8: REVIEW & BUILDER INFO ────────────────────────────── */}
              {step === 8 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="border-b pb-4" style={{ borderColor: BORDER }}>
                    <h3 className="text-xl font-black mb-1" style={{ color: TEXT_DARK }}>Final Settings &amp; Builder Info</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-6 rounded-2xl" style={{ background: IVORY_BG, border: `1px solid ${BORDER}` }}>
                      <h4 className="font-bold border-b pb-2" style={{ color: TEXT_DARK, borderColor: BORDER }}>Builder Info</h4>
                      <input
                        placeholder="Company Name"
                        className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                        style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                        value={formData.builder.name}
                        onChange={e => setFormData({ ...formData, builder: { ...formData.builder, name: e.target.value } })}
                      />
                      <input
                        placeholder="Contact Person Email"
                        className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                        style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                        value={formData.builder.email}
                        onChange={e => setFormData({ ...formData, builder: { ...formData.builder, email: e.target.value } })}
                      />
                      <input
                        placeholder="Phone / Local Contact"
                        className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                        style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                        value={formData.builder.contact}
                        onChange={e => setFormData({ ...formData, builder: { ...formData.builder, contact: e.target.value } })}
                      />
                    </div>

                    <div className="space-y-4 p-6 rounded-2xl" style={{ background: IVORY_BG, border: `1px solid ${BORDER}` }}>
                      <h4 className="font-bold border-b pb-2" style={{ color: TEXT_DARK, borderColor: BORDER }}>SEO &amp; Discovery</h4>
                      <input
                        placeholder="Tags (e.g., Luxury, Affordable, Sea-view)"
                        className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300/40"
                        style={{ background: IVORY, borderColor: BORDER_MID, color: TEXT_DARK }}
                        value={formData.settings.tags}
                        onChange={e => setFormData({ ...formData, settings: { ...formData.settings, tags: e.target.value } })}
                      />
                      <div className="flex items-center justify-between p-3 rounded-xl border"
                        style={{ background: IVORY, borderColor: BORDER_MID }}>
                        <span className="text-sm font-bold" style={{ color: TEXT_DARK }}>Buy Featured Listing Slot</span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-amber-500 rounded"
                          checked={formData.settings.featured}
                          onChange={e => setFormData({ ...formData, settings: { ...formData.settings, featured: e.target.checked } })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* ── Footer nav — always visible, does NOT scroll ─────────────────── */}
          <div className="shrink-0 px-6 md:px-8 py-4 border-t flex justify-between gap-4"
            style={{ borderColor: BORDER, background: IVORY }}>
            {step > 1
              ? <button type="button" onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 hover:bg-amber-50"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT_MID }}>
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              : <div />}

            {step < STEPS.length
              ? <button type="button"
                  onClick={() => {
                    if (step === 2) {
                      const required = ['state','city','pincode','area','address'];
                      const newTouched: Record<string,boolean> = {};
                      const newErrors: Record<string,string> = {};
                      required.forEach(f => {
                        newTouched[f] = true;
                        newErrors[f] = validateLocField(f, (formData.location as any)[f] || '');
                      });
                      setLocTouched(prev => ({ ...prev, ...newTouched }));
                      setLocErrors(prev => ({ ...prev, ...newErrors }));
                      if (!isLocationValid()) return addNotification({ type:'error', title:'Location Incomplete', message:'Please fill all required location fields with valid data.', category:'system' });
                    }
                    if (step === 4 && formData.units.length === 0) return addNotification({ type:'error', title:'Required', message:'Add at least 1 unit.', category:'system' });
                    setStep(step + 1);
                  }}
                  className="px-7 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ml-auto"
                  style={GOLD_BTN}>
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              : <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                  className="px-7 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all flex items-center gap-2 ml-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                  {isSubmitting
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                    : <><CheckCircle2 className="w-4 h-4" /> Publish Enterprise Project</>}
                </button>}
          </div>

        </div>
      </div>
    </div>
  );
}
