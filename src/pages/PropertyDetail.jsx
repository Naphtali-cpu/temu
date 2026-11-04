import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Crown,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ListingGallery } from '../components/ListingGallery.jsx';
import { PropertyCard } from '../components/PropertyCard.jsx';
import { Alert, Badge, Button, EmptyState, Skeleton } from '../components/ui.jsx';
import { useProperties, useProperty } from '../hooks/useProperties.js';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { openTelegram, openWhatsApp } from '../lib/contact.js';
import {
  PRICE_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  describeSpecs,
  formatDate,
  formatPrice,
} from '../lib/format.js';
import { SITE } from '../lib/site.js';

const FEATURES = [
  'Backup generator',
  'Secure parking',
  '24/7 security',
  'Water reservoir',
  'Furnished',
  'Elevator',
];

function mapEmbedUrl(listing) {
  const delta = 0.012;
  const bbox = [listing.lng - delta, listing.lat - delta, listing.lng + delta, listing.lat + delta].join('%2C');
  return `https://maps.google.com/maps?q=${listing.lat},${listing.lng}&z=15&output=embed&bbox=${bbox}`;
}

function DetailSkeleton() {
  return (
    <div className="shell space-y-8 py-10">
      <Skeleton className="h-3 w-56" />
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="aspect-[16/8] w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-9/12" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function PropertyDetail() {
  const { id } = useParams();
  const { listing, loading, error, notFound } = useProperty(id);
  const { currency, rate } = useCurrency();
  const { items } = useProperties();

  const related = useMemo(() => {
    if (!listing) return [];
    return items
      .filter((item) => item.id !== listing.id && item.locationName === listing.locationName)
      .slice(0, 4);
  }, [items, listing]);

  if (loading) return <DetailSkeleton />;

  if (notFound) {
    return (
      <div className="shell py-24">
        <EmptyState
          title="This listing is no longer available"
          description="It may have been sold, withdrawn, or the link may be out of date. Our current portfolio is always a click away."
          action={
            <Button as={Link} to="/">
              Browse current listings
            </Button>
          }
        />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="shell py-24">
        <Alert>{error || 'This property could not be loaded.'}</Alert>
      </div>
    );
  }

  const specs = describeSpecs(listing);
  const isRental = listing.priceType === 'rent' || listing.priceType === 'airbnb';
  const secondary = currency === 'ETB'
    ? `≈ $${Math.round(listing.priceETB / rate).toLocaleString('en-US')} USD`
    : `≈ ETB ${Math.round(listing.priceETB).toLocaleString('en-US')}`;

  return (
    <div className="shell py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-ink-500">
        <Link to="/" className="transition hover:text-champagne-300">Residential</Link>
        {listing.category === 'commercial' && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link to="/commercial" className="transition hover:text-champagne-300">Commercial</Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-stone">{listing.locationName}</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{listing.type}</Badge>
            <Badge tone={STATUS_TONES[listing.status]} dot>{STATUS_LABELS[listing.status]}</Badge>
            {listing.isVIP && (
              <Badge tone="accent">
                <Crown className="h-3 w-3" /> VIP collection
              </Badge>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-ivory sm:text-5xl">{listing.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-stone">
            <MapPin className="h-4 w-4 text-champagne-400" />
            {listing.locationName}, Addis Ababa
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-500">{PRICE_TYPE_LABELS[listing.priceType]}</p>
          <p className="font-display text-3xl text-ivory sm:text-4xl">{formatPrice(listing.priceETB, currency, rate)}</p>
          <p className="text-xs text-stone">{secondary}</p>
        </div>
      </div>

      <div className="mt-8">
        <ListingGallery images={listing.images || []} title={listing.title} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.7fr_1fr]">
        <div className="min-w-0 space-y-10">
          <dl className="grid grid-cols-2 divide-ink-800 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 sm:grid-cols-4 sm:divide-x">
            {[
              { label: 'Bedrooms', value: listing.bedrooms || '—' },
              { label: 'Bathrooms', value: listing.bathrooms || '—' },
              { label: 'Internal area', value: `${listing.areaSqm.toLocaleString('en-US')} m²` },
              { label: 'Reference', value: listing.id.replace('prop-', '').slice(0, 6).toUpperCase() },
            ].map(({ label, value }) => (
              <div key={label} className="border-b border-ink-800 px-5 py-4 sm:border-b-0">
                <dt className="text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</dt>
                <dd className="mt-1 font-display text-2xl text-ivory">{value}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h2 className="font-display text-2xl text-ivory">The property</h2>
            <div className="prose-listing mt-4 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-stone">
              {listing.description || 'Full details for this residence are available on request from the managing director.'}
            </div>
            {specs.length > 0 && (
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-ink-500">{specs.join(' · ')}</p>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl text-ivory">Considerations</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {FEATURES.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-700 px-3 py-1.5 text-xs text-stone"
                >
                  <Sparkles className="h-3 w-3 text-champagne-400" />
                  {feature}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink-500">
              Amenities shown are standard for this class of property. Confirm the final list during a viewing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ivory">Location</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-ink-700">
              <iframe
                title={`Map of ${listing.locationName}`}
                src={mapEmbedUrl(listing)}
                width="100%"
                height="340"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-stone">
              <span className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-champagne-400" />
                {listing.locationName} · {listing.lat.toFixed(4)}, {listing.lng.toFixed(4)}
              </span>
              <Link to="/map" className="inline-flex items-center gap-1.5 text-champagne-300 hover:text-champagne-200">
                Open full map <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-ink-500">
              {isRental ? 'Rental enquiry' : 'Purchase enquiry'}
            </p>
            <p className="mt-2 font-display text-3xl text-ivory">{formatPrice(listing.priceETB, currency, rate)}</p>
            <p className="text-xs text-stone">{PRICE_TYPE_LABELS[listing.priceType]}</p>

            <div className="mt-5 space-y-2.5">
              <Button as={Link} to={`/contact?property=${listing.id}`} className="w-full justify-between">
                Request a private viewing
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => openWhatsApp(listing.title)}
              >
                WhatsApp the director
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => openTelegram(listing.title)}
              >
                Telegram (message copied)
              </Button>
            </div>

            <ul className="mt-5 space-y-2 border-t border-ink-800 pt-5 text-xs text-stone">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-champagne-400" /> Documents verified before listing
              </li>
              <li className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-champagne-400" /> Listings updated {formatDate(listing.updatedAt)}
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-900 p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-champagne-400/40 bg-champagne-400/10 font-display text-lg text-champagne-200">
                {SITE.agent.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-ivory">{SITE.agent.name}</p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-champagne-400">Managing Director</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-stone">
              <a href={`tel:+${SITE.agent.phoneIntl}`} className="block hover:text-champagne-200">{SITE.agent.phoneDisplay}</a>
              <a href={`mailto:${SITE.agent.email}`} className="block hover:text-champagne-200">{SITE.agent.email}</a>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-ink-800 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Nearby</p>
              <h2 className="mt-2 font-display text-3xl text-ivory">More in {listing.locationName}</h2>
            </div>
            <Link to={`/?q=${encodeURIComponent(listing.locationName)}`} className="text-xs text-champagne-300 hover:text-champagne-200">
              See all in this area →
            </Link>
          </div>
          <div className="no-scrollbar -mx-1 mt-6 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
            {related.map((item) => (
              <div key={item.id} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
                <PropertyCard listing={item} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
