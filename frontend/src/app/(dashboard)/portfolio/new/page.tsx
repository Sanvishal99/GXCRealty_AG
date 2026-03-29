"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProperties } from '@/context/PropertyContext';
import { useNotifications } from '@/context/NotificationContext';
import { 
  Building2, MapPin, IndianRupee, Percent, 
  Compass, Train, Plane, GraduationCap, 
  CheckCircle2, ChevronRight, ChevronLeft, 
  Layout, Image as ImageIcon, Map as MapIcon, 
  ShieldCheck, Info, PlusCircle, AlertTriangle, Trash2,
  Waves, Dumbbell, Car, Shield, Wind, Coffee,
  Video, Lock, Flame, Library, Tv, Lamp, TreePine, 
  Gamepad2, Activity, Home, ShoppingCart, Scissors, Users, 
  Sun, Droplets, Recycle, PhoneCall, Zap, FileText, Upload, ExternalLink
} from 'lucide-react';

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

  // Step 6 – Media
  const [imgUrlInput, setImgUrlInput] = useState('');

  // Step 7 – Documents
  const [addingDoc, setAddingDoc] = useState(false);
  const [newDocLabel, setNewDocLabel] = useState('');
  const [newDocType, setNewDocType] = useState('Brochure');

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
    // 3+ consecutive identical chars: "aaaa", "111"
    if (/(.)\1{2,}/.test(v)) return true;
    // All digits (for name/city fields)
    if (/^\d+$/.test(v)) return true;
    // Too short
    if (v.replace(/\s/g,'').length < 2) return true;
    return false;
  };

  const validateLocField = (field: string, value: string): string => {
    const v = value.trim();
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

  const locFieldClass = (field: string) => {
    const base = 'w-full border rounded-xl px-4 py-3 outline-none transition-all focus:ring-2';
    if (!locTouched[field]) return `${base} bg-neutral-50 border-neutral-200 focus:ring-indigo-500/20 focus:border-indigo-500`;
    if (locErrors[field]) return `${base} bg-rose-50 border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 text-rose-900`;
    return `${base} bg-emerald-50 border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500 text-emerald-900`;
  };

  // Build the iframe embed URL (no API key needed)
  const buildMapEmbedUrl = (lat: string, lng: string, query?: string): string => {
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (GOOGLE_MAPS_API_KEY) {
      // Official Maps Embed API (requires key)
      if (lat && lng) return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${lat},${lng}&zoom=15`;
      if (query) return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(query)}&zoom=13`;
    }
    // Legacy Google Maps embed — no key, still works
    if (lat && lng) return `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`;
    if (query) return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=en&z=13&output=embed`;
    return '';
  };

  const buildMapsOpenUrl = (lat: string, lng: string, query?: string): string => {
    if (lat && lng) return `https://www.google.com/maps?q=${lat},${lng}`;
    if (query) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    return '';
  };

  // Parse lat/lng from a pasted Google Maps URL
  // Handles: /maps/@lat,lng,zoom  and  ?ll=lat,lng  and  q=lat,lng
  const parseCoordsFromMapsUrl = (url: string): { lat: string; lng: string } | null => {
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,                       // /maps/@lat,lng,zoom
      /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,                 // ?ll=lat,lng
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,                  // ?q=lat,lng
      /place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/,         // /place/Name/@lat,lng
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

  // Update map preview when coordinates change
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
        // Show map centered on the district/city
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
        if ((p as any).docs) setDocs((p as any).docs);
      }
    } else {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only show prompt if draft has meaningful data (project name filled)
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
      
      // Legacy required UI mapping
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

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8 lg:p-12 text-neutral-900 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50">
               <Building2 className="w-4 h-4 text-indigo-600" />
               <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest leading-none">Enterprise Project</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 mb-2">
              {editId ? 'Edit Project Setup' : 'Create Master Project'}
            </h1>
            <p className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              Step-by-step rigorous project taxonomy compliance.
            </p>
          </div>
          <div className="flex gap-3">
             <button type="button" onClick={() => { localStorage.removeItem(DRAFT_KEY); window.location.reload(); }} className="px-5 py-2.5 rounded-xl bg-white border border-neutral-200 text-rose-600 font-bold hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm">Reset</button>
             <button type="button" onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 font-bold text-neutral-600 transition-all shadow-sm">Cancel</button>
          </div>
        </header>

        {/* Draft restore prompt */}
        {draftPending && (
          <div className="mb-6 flex items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Unsaved draft found: &quot;{draftPending.formData?.name}&quot;</p>
                <p className="text-xs text-amber-700 font-medium">Step {draftPending.step} of 8 · Do you want to resume or start fresh?</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setFormData(draftPending.formData);
                  setStep(draftPending.step || 1);
                  setImages(draftPending.images || []);
                  setDraftPending(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all"
              >
                Resume Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(DRAFT_KEY);
                  setDraftPending(null);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-50 transition-all"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Elegant 8-Step Stepper */}
        <div className="mb-10 px-2 overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex items-center justify-between min-w-[800px] relative">
            <div className="absolute left-0 top-1/2 -translate-y-[2px] w-full h-[3px] bg-neutral-200 rounded-full z-0" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-[2px] h-[3px] bg-indigo-600 rounded-full z-0 transition-all duration-500 ease-in-out" 
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} 
            />
            {STEPS.map((s) => {
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <button 
                  key={s.id} type="button" onClick={() => (isDone || isActive) && setStep(s.id)}
                  className="relative z-10 flex flex-col items-center gap-3 transition-transform hover:scale-105"
                >
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-sm transition-colors border-2 ${
                    isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 
                    isDone ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 
                    'bg-white border-neutral-300 text-neutral-400'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                  </div>
                  <span className={`text-[10px] md:text-xs font-bold leading-tight uppercase tracking-wide ${isActive ? 'text-indigo-700' : isDone ? 'text-neutral-700' : 'text-neutral-400'}`}>
                    {s.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/80 p-8 transition-all">
          <form onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} className="w-full">
            
            {/* 1. BASIC INFO */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-xl font-bold text-neutral-900 border-b border-neutral-100 pb-4">Basic Information</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <label className="block text-sm font-bold text-neutral-700 mb-2">Project Name</label>
                       <input required className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-neutral-700 mb-2">Project Type</label>
                       <select className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                         {['Apartment', 'Villa', 'Plot', 'Commercial'].map(t => <option key={t}>{t}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-neutral-700 mb-2">Status</label>
                       <select className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3" value={formData.statusEnum} onChange={e => setFormData({...formData, statusEnum: e.target.value})}>
                         {['Upcoming', 'Under Construction', 'Ready to Move'].map(t => <option key={t}>{t}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-neutral-700 mb-2">Launch Date</label>
                       <input type="date" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3" value={formData.launchDate} onChange={e => setFormData({...formData, launchDate: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-neutral-700 mb-2">Possession Date</label>
                       <input type="date" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3" value={formData.possessionDate} onChange={e => setFormData({...formData, possessionDate: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-sm font-bold text-neutral-700 mb-2">RERA Registration Number</label>
                       <input placeholder="Ex: P518000XXXXX" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3" value={formData.reraId} onChange={e => setFormData({...formData, reraId: e.target.value})} />
                    </div>
                 </div>
              </div>
            )}

            {/* 2. LOCATION */}
            {step === 2 && (() => {
              const score = locationScore();
              const scoreColor = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-rose-500';
              const scoreLabel = score >= 80 ? 'Strong' : score >= 50 ? 'Moderate' : 'Weak';
              const scoreLabelColor = score >= 80 ? 'text-emerald-700' : score >= 50 ? 'text-amber-700' : 'text-rose-700';
              return (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-start justify-between border-b border-neutral-100 pb-4 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">Location Matrix</h3>
                    <p className="text-xs text-neutral-500 font-medium">All fields are verified. Dummy or test data will be rejected.</p>
                  </div>
                  {/* Completeness Score */}
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-bold text-neutral-500 mb-1 uppercase tracking-widest">Accuracy</div>
                    <div className="flex items-center gap-2">
                      <div className="w-28 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${scoreColor}`} style={{ width: `${score}%` }} />
                      </div>
                      <span className={`text-xs font-extrabold ${scoreLabelColor}`}>{score}% {scoreLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Pincode first — auto-fills city/state */}
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-widest">
                    <MapPin className="w-3.5 h-3.5" /> Pincode Lookup — auto-fills city &amp; state
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        maxLength={6}
                        placeholder="e.g. 400001"
                        className={`${locFieldClass('pincode')} font-mono text-lg tracking-widest`}
                        value={formData.location.pincode}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g,'');
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
                      {pincodeStatus === 'loading' && <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />}
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
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Country <span className="text-rose-500">*</span></label>
                    <select
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={formData.location.country}
                      onChange={e => setFormData({ ...formData, location: { ...formData.location, country: e.target.value, state: '' } })}
                    >
                      <option value="India">India</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">State <span className="text-rose-500">*</span></label>
                    {formData.location.country === 'India' ? (
                      <select
                        className={locFieldClass('state').replace('px-4 py-3', 'px-4 py-3 appearance-none cursor-pointer')}
                        value={formData.location.state}
                        onChange={e => {
                          setFormData(prev => ({ ...prev, location: { ...prev.location, state: e.target.value } }));
                          touchLocField('state', e.target.value);
                        }}
                        onBlur={e => touchLocField('state', e.target.value)}
                      >
                        <option value="">— Select State —</option>
                        {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    ) : (
                      <input
                        placeholder="Enter State / Province"
                        className={locFieldClass('state')}
                        value={formData.location.state}
                        onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, state: e.target.value } }))}
                        onBlur={e => touchLocField('state', e.target.value)}
                      />
                    )}
                    {locTouched.state && locErrors.state && (
                      <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.state}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">
                      City <span className="text-rose-500">*</span>
                      <span className="ml-2 text-xs font-normal text-neutral-400">No abbreviations or codes</span>
                    </label>
                    <input
                      placeholder="e.g. Mumbai, Pune, Bengaluru"
                      className={locFieldClass('city')}
                      value={formData.location.city}
                      onChange={e => {
                        const v = e.target.value.replace(/[^a-zA-Z\s\-\.]/g, '');
                        setFormData(prev => ({ ...prev, location: { ...prev.location, city: v } }));
                        if (locTouched.city) setLocErrors(prev => ({ ...prev, city: validateLocField('city', v) }));
                      }}
                      onBlur={e => touchLocField('city', e.target.value)}
                    />
                    {locTouched.city && locErrors.city && (
                      <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.city}</p>
                    )}
                    {locTouched.city && !locErrors.city && formData.location.city && (
                      <p className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Looks good</p>
                    )}
                  </div>

                  {/* Area / Locality */}
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">
                      Area / Locality <span className="text-rose-500">*</span>
                      <span className="ml-2 text-xs font-normal text-neutral-400">Neighbourhood or sector name</span>
                    </label>
                    <input
                      placeholder="e.g. Bandra West, Koregaon Park"
                      className={locFieldClass('area')}
                      value={formData.location.area}
                      onChange={e => {
                        const v = e.target.value;
                        setFormData(prev => ({ ...prev, location: { ...prev.location, area: v } }));
                        if (locTouched.area) setLocErrors(prev => ({ ...prev, area: validateLocField('area', v) }));
                      }}
                      onBlur={e => touchLocField('area', e.target.value)}
                    />
                    {locTouched.area && locErrors.area && (
                      <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.area}</p>
                    )}
                    {locTouched.area && !locErrors.area && formData.location.area && (
                      <p className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Looks good</p>
                    )}
                  </div>

                  {/* Complete Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-neutral-700 mb-2">
                      Complete Address <span className="text-rose-500">*</span>
                      <span className="ml-2 text-xs font-normal text-neutral-400">Include building/plot no., street, landmark</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Plot 12, Sector 7, Near City Mall, MG Road, Mumbai — 400001"
                      className={`${locFieldClass('address')} resize-none`}
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
                        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.address}</p>
                      ) : locTouched.address && !locErrors.address ? (
                        <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Looks good</p>
                      ) : <span />}
                      <span className={`text-xs font-mono ${formData.location.address.length < 15 ? 'text-rose-400' : 'text-neutral-400'}`}>
                        {formData.location.address.length}/15 min chars
                      </span>
                    </div>
                  </div>

                  {/* GPS + Map section */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <MapIcon className="w-4 h-4 text-neutral-500" />
                          <span className="text-sm font-bold text-neutral-700">GPS Coordinates</span>
                          <span className="text-xs text-neutral-400 font-medium">Optional · Must be within India</span>
                        </div>
                        {/* Auto-geocode button */}
                        <button
                          type="button"
                          onClick={geocodeAddress}
                          disabled={geocodeStatus === 'loading' || (!formData.location.city && !formData.location.area)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {geocodeStatus === 'loading'
                            ? <><div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Geocoding…</>
                            : geocodeStatus === 'ok'
                            ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Geocoded</>
                            : <><MapPin className="w-3.5 h-3.5" /> Auto-detect Coordinates</>}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 mb-1">Latitude (°N)</label>
                          <input
                            type="number" step="0.000001" placeholder="e.g. 19.076090"
                            className={locFieldClass('lat')}
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
                            <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.lat}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 mb-1">Longitude (°E)</label>
                          <input
                            type="number" step="0.000001" placeholder="e.g. 72.877670"
                            className={locFieldClass('lng')}
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
                            <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.lng}</p>
                          )}
                        </div>
                      </div>

                      {/* Google Maps Share Link — parses coords on paste */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 mb-1">
                          Google Maps Share Link
                          <span className="ml-2 text-neutral-400 font-normal">Paste URL to auto-extract coordinates</span>
                        </label>
                        <input
                          type="url" placeholder="https://maps.app.goo.gl/… or https://www.google.com/maps/@…"
                          className={locFieldClass('mapUrl')}
                          value={formData.location.mapUrl}
                          onChange={e => {
                            const v = e.target.value;
                            setFormData(prev => ({ ...prev, location: { ...prev.location, mapUrl: v } }));
                            if (locTouched.mapUrl) setLocErrors(prev => ({ ...prev, mapUrl: validateLocField('mapUrl', v) }));
                            // Auto-parse coordinates from pasted URL
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
                          <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" />{locErrors.mapUrl}</p>
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
                      <div className="rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
                        <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 border-b border-neutral-200">
                          <div className="flex items-center gap-2 text-xs font-bold text-neutral-600">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                            Map Preview
                            {formData.location.lat && formData.location.lng && !locErrors.lat && !locErrors.lng
                              ? <span className="text-emerald-600">· Exact pin</span>
                              : <span className="text-amber-600">· Approximate (city-level)</span>
                            }
                          </div>
                          {/* Open in Google Maps button */}
                          {(() => {
                            const openUrl = buildMapsOpenUrl(
                              formData.location.lat,
                              formData.location.lng,
                              [formData.location.area, formData.location.city, formData.location.state, 'India'].filter(Boolean).join(', ')
                            );
                            return openUrl ? (
                              <a
                                href={openUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                              >
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

                    {/* Show map trigger when no preview yet but enough info */}
                    {!mapPreviewUrl && (formData.location.city || formData.location.state) && (
                      <button
                        type="button"
                        onClick={() => updateMapPreview('', '', formData.location.city, formData.location.state)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-neutral-200 text-neutral-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-bold"
                      >
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

            {/* 3. PRICING */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-xl font-bold text-neutral-900 border-b border-neutral-100 pb-4">Global Pricing & Deals</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="block text-sm font-bold text-neutral-700 mb-2">Minimum Project Price (₹)</label>
                       <input required type="number" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3" value={formData.pricing.minPrice} onChange={e => setFormData({...formData, pricing: {...formData.pricing, minPrice: e.target.value}})} />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-neutral-700 mb-2">Maximum Project Price (₹)</label>
                       <input type="number" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3" value={formData.pricing.maxPrice} onChange={e => setFormData({...formData, pricing: {...formData.pricing, maxPrice: e.target.value}})} />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-neutral-700 mb-2">Avg Price per Sq.Ft (₹)</label>
                       <input type="number" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3" value={formData.pricing.pricePerSqFt} onChange={e => setFormData({...formData, pricing: {...formData.pricing, pricePerSqFt: e.target.value}})} />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-neutral-700 mb-2">Token / Booking Amount (₹)</label>
                       <input type="number" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3" value={formData.pricing.bookingAmount} onChange={e => setFormData({...formData, pricing: {...formData.pricing, bookingAmount: e.target.value}})} />
                    </div>
                    <div className="md:col-span-2 p-6 rounded-2xl bg-indigo-50 border border-indigo-100 mt-4">
                       <h4 className="font-bold text-indigo-900 mb-4">Channel Partner Incentives</h4>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-indigo-700 mb-2">Incentive % (Base)</label>
                              <input required type="number" step="0.1" className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-indigo-900 font-bold" value={formData.pricing.commissionValue} onChange={e => setFormData({...formData, pricing: {...formData.pricing, commissionValue: e.target.value}})} />
                           </div>
                           <div className="flex flex-col justify-center items-start pt-4">
                              <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-900 text-sm">
                                 <input type="checkbox" className="w-5 h-5 accent-indigo-600 rounded" checked={formData.pricing.requiredApproval} onChange={e => setFormData({...formData, pricing: {...formData.pricing, requiredApproval: e.target.checked}})} />
                                 Require Auto/Manual Deal Approval?
                              </label>
                           </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* 4. UNIT CONFIGURATION */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                 <div className="border-b border-neutral-100 pb-4 flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-1">Unit Configurations <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-600 rounded ml-2">REQUIRED</span></h3>
                      <p className="text-sm font-medium text-neutral-500">Every project requires at least one distinct unit type.</p>
                    </div>
                    <button type="button" onClick={addUnit} className="px-4 py-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2">
                       <PlusCircle className="w-4 h-4" /> Add Unit
                    </button>
                 </div>
                 
                 {formData.units.length === 0 && (
                   <div className="p-8 text-center border-2 border-dashed border-neutral-200 rounded-2xl">
                     <p className="text-neutral-500 font-medium">No units added. Add a 2BHK, 3BHK, etc. to continue.</p>
                   </div>
                 )}
                 {formData.units.map((unit, idx) => (
                   <div key={unit.id} className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm relative group overflow-visible">
                      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button type="button" onClick={() => removeUnit(unit.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Unit Name (e.g., 3BHK Premium)</label>
                            <input required className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-bold" value={unit.name} onChange={e => updateUnit(unit.id, 'name', e.target.value)} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Total Units</label>
                            <input required type="number" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" value={unit.total} onChange={e => updateUnit(unit.id, 'total', parseInt(e.target.value))} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Available Units</label>
                            <input required type="number" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" value={unit.available} onChange={e => updateUnit(unit.id, 'available', parseInt(e.target.value))} />
                         </div>
                         
                         <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Bedrooms</label>
                            <input type="number" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" value={unit.beds} onChange={e => updateUnit(unit.id, 'beds', parseInt(e.target.value))} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Bathrooms</label>
                            <input type="number" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" value={unit.baths} onChange={e => updateUnit(unit.id, 'baths', parseInt(e.target.value))} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Carpet (sqft)</label>
                            <input type="number" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" value={unit.carpetArea} onChange={e => updateUnit(unit.id, 'carpetArea', parseInt(e.target.value))} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Super Area (sqft)</label>
                            <input type="number" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" value={unit.superArea} onChange={e => updateUnit(unit.id, 'superArea', parseInt(e.target.value))} />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            )}

            {/* 5. AMENITIES */}
            {step === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                 <div className="border-b border-neutral-100 pb-4">
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">Curated Amenities</h3>
                 </div>
                 
                 {(['common', 'lifestyle', 'premium'] as const).map(category => (
                   <div key={category} className="space-y-4">
                     <h4 className="text-sm font-bold uppercase tracking-widest text-neutral-500">{category} Features</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {AMENITY_OPTIONS[category].map(opt => {
                           const Icon = opt.icon;
                           const isActive = formData.amenities[category].includes(opt.id);
                           return (
                             <div 
                               key={opt.id} role="button" tabIndex={0}
                               onClick={() => toggleAmenity(category, opt.id)}
                               className={`p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer select-none ${isActive ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-sm ring-1 ring-indigo-400/20' : 'bg-white border-neutral-200 hover:border-indigo-300 text-neutral-600'}`}
                             >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-neutral-100 text-neutral-500'}`}><Icon className="w-4 h-4" /></div>
                                <span className={`text-xs font-bold leading-tight flex-1`}>{opt.label}</span>
                             </div>
                           );
                        })}
                     </div>
                   </div>
                 ))}
              </div>
            )}

            {/* 6. MEDIA */}
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
                <div className="border-b border-neutral-100 pb-4 flex items-end justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">Visual Media</h3>
                    <p className="text-sm font-medium text-neutral-500">Add project photos. The first image is the cover photo shown on listings.</p>
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
                    <div key={i} className={`aspect-square relative rounded-xl overflow-hidden group border-2 shadow-sm ${
                      i === 0 ? 'border-indigo-400 ring-2 ring-indigo-300/40' : 'border-neutral-200'
                    }`}>
                      <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      {/* Cover Badge */}
                      {i === 0 && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                          ⭐ Cover
                        </div>
                      )}
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                        {i !== 0 && (
                          <button type="button" onClick={() => moveToCover(i)}
                            className="w-full px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-colors">
                            ⭐ Set as Cover
                          </button>
                        )}
                        <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="w-full px-2 py-1 bg-white text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-50 transition-colors">
                          Remove
                        </button>
                      </div>
                      {/* Index badge for non-cover */}
                      {i !== 0 && (
                        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 text-white text-[9px] font-black flex items-center justify-center">
                          {i + 1}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Upload new */}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-100 transition-colors group">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={e => {
                      if (e.target.files) setImages([...images, ...Array.from(e.target.files).map(f => URL.createObjectURL(f))]);
                    }} />
                    <ImageIcon className="w-8 h-8 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-indigo-600">Upload Photos</span>
                    <span className="text-[10px] text-indigo-400 mt-0.5">Multiple OK</span>
                  </label>
                </div>

                {/* URL input option */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-3">Or add photo by URL</p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/property-photo.jpg"
                      value={imgUrlInput}
                      onChange={e => setImgUrlInput(e.target.value)}
                      className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shrink-0"
                    >
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

            {/* 7. DOCUMENTS */}
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
                <div className="border-b border-neutral-100 pb-4 flex items-end justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">Documents & Attachments</h3>
                    <p className="text-sm font-medium text-neutral-500">Upload brochures, floor plans, RERA certificates, and more. PDFs, images, or spreadsheets.</p>
                  </div>
                  {docs.length > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-black border bg-indigo-50 text-indigo-700 border-indigo-200">
                      {docs.length} file{docs.length !== 1 ? 's' : ''} added
                    </span>
                  )}
                </div>

                {/* Existing docs list */}
                {docs.length > 0 && (
                  <div className="space-y-2">
                    {docs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 bg-white shadow-sm hover:border-neutral-300 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-xl shrink-0">
                          {docIcon2(doc.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-neutral-900 truncate">{doc.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wide ${docTagColor(doc.type)}`}>
                              {doc.type}
                            </span>
                            {ext(doc.name) && (
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">.{ext(doc.name)}</span>
                            )}
                          </div>
                        </div>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button type="button" onClick={() => setDocs(docs.filter((_, idx) => idx !== i))}
                          className="p-2 rounded-lg hover:bg-rose-50 text-neutral-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add doc zone */}
                {addingDoc ? (
                  <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50 space-y-4">
                    <p className="text-sm font-bold text-indigo-800">New Attachment</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-600 mb-1.5">Document Type</label>
                        <select
                          value={newDocType}
                          onChange={e => setNewDocType(e.target.value)}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-600 mb-1.5">Custom Label <span className="font-normal text-neutral-400">(optional)</span></label>
                        <input
                          type="text"
                          placeholder="e.g. Phase 1 Floor Plan, Tower A"
                          value={newDocLabel}
                          onChange={e => setNewDocLabel(e.target.value)}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <label className="flex items-center justify-center gap-3 p-5 rounded-xl border-2 border-dashed border-indigo-300 bg-white cursor-pointer hover:bg-indigo-50 transition-colors group">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp"
                        multiple
                        className="hidden"
                        onChange={e => {
                          if (e.target.files) {
                            const newDocs = Array.from(e.target.files).map((f, idx) => ({
                              type: newDocType,
                              name: newDocLabel && e.target.files!.length === 1 ? (newDocLabel + '.' + f.name.split('.').pop()) : f.name,
                              url: URL.createObjectURL(f)
                            }));
                            setDocs([...docs, ...newDocs]);
                            setAddingDoc(false);
                            setNewDocLabel('');
                            setNewDocType('Brochure');
                          }
                        }}
                      />
                      <Upload className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="font-bold text-sm text-indigo-700">Browse & Select Files</p>
                        <p className="text-xs text-indigo-500">PDF, Word, Excel, Images — multiple files OK</p>
                      </div>
                    </label>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => { setAddingDoc(false); setNewDocLabel(''); setNewDocType('Brochure'); }}
                        className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-sm font-bold hover:bg-neutral-50 transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingDoc(true)}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-neutral-200 text-neutral-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-bold text-sm"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Document / Attachment
                  </button>
                )}

                {docs.length === 0 && !addingDoc && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <span className="text-2xl">💡</span>
                    <p className="text-xs text-neutral-500 font-medium">
                      Adding documents like a brochure, master plan, and RERA certificate significantly increases buyer trust and deal conversion.
                    </p>
                  </div>
                )}
              </div>
              );
            })()}

            {/* 8. REVIEW & BUILDER INFO */}
            {step === 8 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                 <div className="border-b border-neutral-100 pb-4">
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">Final Settings & Builder Info</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-6 rounded-2xl bg-neutral-50 border border-neutral-200">
                       <h4 className="font-bold text-neutral-800 border-b border-neutral-200 pb-2">Builder Info</h4>
                       <input placeholder="Company Name" className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" value={formData.builder.name} onChange={e => setFormData({...formData, builder: {...formData.builder, name: e.target.value}})} />
                       <input placeholder="Contact Person Email" className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" value={formData.builder.email} onChange={e => setFormData({...formData, builder: {...formData.builder, email: e.target.value}})} />
                       <input placeholder="Phone / Local Contact" className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" value={formData.builder.contact} onChange={e => setFormData({...formData, builder: {...formData.builder, contact: e.target.value}})} />
                    </div>
                    
                    <div className="space-y-4 p-6 rounded-2xl bg-neutral-50 border border-neutral-200">
                       <h4 className="font-bold text-neutral-800 border-b border-neutral-200 pb-2">SEO & Discovery</h4>
                       <input placeholder="Tags (e.g., Luxury, Affordable, Sea-view)" className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" value={formData.settings.tags} onChange={e => setFormData({...formData, settings: {...formData.settings, tags: e.target.value}})} />
                       <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg">
                          <span className="text-sm font-bold text-neutral-700">Buy Featured Listing Slot</span>
                          <input type="checkbox" className="w-5 h-5 accent-indigo-600 rounded" checked={formData.settings.featured} onChange={e => setFormData({...formData, settings: {...formData.settings, featured: e.target.checked}})} />
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* Footer Navigation */}
            <div className="mt-8 pt-6 border-t border-neutral-200 flex justify-between gap-4">
               {step > 1 ? (
                 <button type="button" onClick={() => setStep(step-1)} className="px-6 py-3 rounded-xl border border-neutral-200 font-bold bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all text-sm shadow-sm flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                 </button>
               ) : <div />}
               
               {step < STEPS.length ? (
                 <button
                   type="button" onClick={() => {
                     if (step === 2) {
                       // Touch all required location fields to show errors
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
                     setStep(step+1);
                   }}
                   className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 text-sm ml-auto"
                 >
                    Next Step <ChevronRight className="w-4 h-4" />
                 </button>
               ) : (
                 <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2 text-sm ml-auto group">
                    {isSubmitting
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                      : <><CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" /> Publish Enterprise Project</>
                    }
                 </button>
               )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
