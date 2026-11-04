export const PRICE_TYPE_LABELS = {
  sale: 'For Sale',
  rent: 'Per Month',
  airbnb: 'Per Night',
};

export const STATUS_LABELS = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  RENTED: 'Rented',
  BOUGHT: 'Sold',
};

export const CATEGORY_LABELS = {
  residential: 'Residential',
  commercial: 'Commercial',
};

export const STATUS_TONES = {
  AVAILABLE: 'positive',
  RESERVED: 'warning',
  RENTED: 'info',
  BOUGHT: 'neutral',
};

export const INQUIRY_STATUS_LABELS = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  CLOSED: 'Closed',
};

export const RESIDENTIAL_TYPES = [
  'Apartment',
  'Penthouse',
  'Villa',
  'Own Compound',
  'Rentals',
  'Airbnb',
  'Resell',
];

export const COMMERCIAL_TYPES = [
  'Office Space',
  'Office Building',
  'Shop',
  'Retail Shop',
  'Showroom',
  'Stall',
  'Hall',
  'Warehouse',
  'Warehouse / Godown',
  'Godown',
];

export const ADDIS_AREAS = [
  { name: 'Bole Atlas', lat: 8.9984, lng: 38.7842 },
  { name: 'Bole Medhanialem', lat: 8.9942, lng: 38.7885 },
  { name: 'Kazanchis', lat: 9.021, lng: 38.7663 },
  { name: 'Old Airport', lat: 8.9723, lng: 38.7391 },
  { name: 'Sarbet', lat: 8.9895, lng: 38.736 },
  { name: 'CMC', lat: 9.0195, lng: 38.831 },
  { name: 'Megenagna', lat: 9.0205, lng: 38.802 },
  { name: 'Piassa', lat: 9.0345, lng: 38.7512 },
  { name: 'Gotera', lat: 8.978, lng: 38.761 },
  { name: 'Meskel Square', lat: 9.0105, lng: 38.7615 },
  { name: 'Bisrate Gabriel', lat: 8.976, lng: 38.729 },
  { name: 'Ayat', lat: 9.025, lng: 38.868 },
  { name: 'Gerji', lat: 8.995, lng: 38.81 },
  { name: 'Lebu', lat: 8.953, lng: 38.718 },
  { name: 'Summit', lat: 9.031, lng: 38.845 },
];

export function formatETB(amount) {
  return `ETB ${Math.round(Number(amount) || 0).toLocaleString('en-US')}`;
}

export function formatUSD(amount, rate) {
  const value = Math.round((Number(amount) || 0) / (rate || 1));
  return `$${value.toLocaleString('en-US')}`;
}

export const formatPrice = (amount, currency, rate) =>
  currency === 'USD' ? formatUSD(amount, rate) : formatETB(amount);

/** Rounds large amounts so secondary currency captions stay readable. */
export function formatCompact(amount, currency, rate) {
  const numeric = Number(amount) || 0;
  const value = currency === 'USD' ? numeric / (rate || 1) : numeric;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${Math.round(value)}`;
}

export function priceCaption(listing) {
  return PRICE_TYPE_LABELS[listing.priceType] || 'For Sale';
}

export function describeSpecs(listing) {
  const parts = [];
  if (listing.bedrooms > 0) parts.push(`${listing.bedrooms} bed${listing.bedrooms > 1 ? 's' : ''}`);
  if (listing.bathrooms > 0) parts.push(`${listing.bathrooms} bath${listing.bathrooms > 1 ? 's' : ''}`);
  if (listing.areaSqm) parts.push(`${listing.areaSqm.toLocaleString('en-US')} m²`);
  return parts;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(value) {
  if (!value) return '';
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(value);
}
