import { Link } from 'react-router-dom';
import { Badge, Skeleton } from './ui.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { assetUrl } from '../api/client.js';
import { openTelegram, openWhatsApp } from '../lib/contact.js';
import { CATEGORY_LABELS, PRICE_TYPE_LABELS, STATUS_LABELS, STATUS_TONES, describeSpecs, formatCompact, formatPrice } from '../lib/format.js';
import { cx } from '../lib/ui.js';

function ListingImage({ src, alt }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
      {src ? (
        <img
          src={assetUrl(src)}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-ink-600">
          <span className="font-display text-4xl">T</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent opacity-90" />
    </div>
  );
}

export function PropertyCard({ listing }) {
  const { currency, rate } = useCurrency();
  const specs = describeSpecs(listing);
  const secondary = currency === 'ETB' ? `$${formatCompact(listing.priceETB, 'USD', rate)}` : `ETB ${formatCompact(listing.priceETB, 'ETB', rate)}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-ink-700 bg-ink-900 transition duration-300 hover:-translate-y-0.5 hover:border-champagne-400/40 hover:shadow-lift">
      <ListingImage src={listing.images?.[0]?.thumb || listing.images?.[0]?.url} alt={listing.title} />

      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <Badge tone="neutral" className="border-ink-600/80 bg-ink-950/80 backdrop-blur">
          {listing.category === 'commercial' ? 'Commercial' : listing.type}
        </Badge>
        {listing.isVIP && <Badge tone="accent" className="bg-ink-950/80 backdrop-blur">VIP</Badge>}
      </div>
      <div className="absolute right-3 top-3">
        <Badge tone={STATUS_TONES[listing.status]} dot className="bg-ink-950/80 backdrop-blur">
          {STATUS_LABELS[listing.status]}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-champagne-400/90">{listing.locationName}</p>
        <h3 className="mt-2 font-display text-[22px] leading-snug text-ivory transition group-hover:text-champagne-100 line-clamp-2">
          <Link to={`/property/${listing.id}`} className="focus:outline-none">
            <span className="absolute inset-0 z-10" aria-hidden="true" />
            {listing.title}
          </Link>
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-stone">
          {specs.length > 0 ? (
            specs.map((spec, index) => (
              <span key={spec} className="flex items-center gap-3">
                {index > 0 && <span className="h-1 w-1 rounded-full bg-ink-600" aria-hidden="true" />}
                {spec}
              </span>
            ))
          ) : (
            <span>{CATEGORY_LABELS[listing.category]} space</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-ink-800 pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500">{PRICE_TYPE_LABELS[listing.priceType]}</p>
            <p className="mt-1 font-display text-xl text-ivory">{formatPrice(listing.priceETB, currency, rate)}</p>
            <p className="text-[11px] text-stone/80">≈ {secondary}</p>
          </div>
          <div className="z-20 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openWhatsApp(listing.title)}
              title="Enquire on WhatsApp"
              className="grid h-9 w-9 place-items-center rounded-lg border border-ink-700 text-stone transition hover:border-success/50 hover:text-success-ink"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.5-5.9c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.2 7.2 0 0 1-1.3-1.7c-.1-.2 0-.3.1-.5l.4-.4.2-.4v-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.6 1.6.4 1.9.4a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2s0-.1-.1-.2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => openTelegram(listing.title)}
              title="Enquire on Telegram (message copied)"
              className="grid h-9 w-9 place-items-center rounded-lg border border-ink-700 text-stone transition hover:border-info/50 hover:text-info-ink"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M21.4 4.3 2.9 11.3c-1 .4-1 1 0 1.3l4.6 1.4 1.8 5.3c.2.6.5.7 1 .3l2.5-1.9 4.7 3.5c.7.4 1.1.2 1.3-.6l3.4-15.5c.2-.9-.4-1.3-1-1zM9.4 14.2l9.1-5.7c.4-.3.8-.1.5.2l-7.6 6.9-.3 3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
      </div>
    </div>
  );
}

export function PropertyGrid({ listings, loading, skeletonCount = 8 }) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing, index) => (
        <div key={listing.id} className={cx('animate-rise')} style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
          <PropertyCard listing={listing} />
        </div>
      ))}
    </div>
  );
}
