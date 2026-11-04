import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, Compass, Crown, KeyRound, ShieldCheck, Sparkles, TrendingUp, X } from 'lucide-react';
import { PropertyFilters } from '../components/PropertyFilters.jsx';
import { PropertyGrid } from '../components/PropertyCard.jsx';
import { HeroCarousel } from '../components/HeroCarousel.jsx';
import { Alert, Button, EmptyState, SectionHeading } from '../components/ui.jsx';
import { matchesFilters, useProperties } from '../hooks/useProperties.js';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { RESIDENTIAL_TYPES } from '../lib/format.js';
import { FILTER_LABELS, applySearchFilters, readFilters } from '../lib/filters.js';
import { SITE } from '../lib/site.js';

function Stat({ value, label }) {
  return (
    <div>
      <p className="font-display text-3xl leading-none tabular-nums text-pearl">{value}</p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-pearl/50">{label}</p>
    </div>
  );
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const { currency } = useCurrency();
  const { items, loading, error, reload } = useProperties();

  const residential = useMemo(() => items.filter((listing) => listing.category === 'residential'), [items]);
  const results = useMemo(
    () => residential.filter((listing) => matchesFilters(listing, filters)),
    [residential, filters]
  );

  const stats = useMemo(
    () => ({
      total: residential.length,
      neighbourhoods: new Set(residential.map((listing) => listing.locationName)).size,
      vip: residential.filter((listing) => listing.isVIP).length,
    }),
    [residential]
  );

  const applyFilters = (next) => applySearchFilters(setSearchParams, next);
  const clearFilter = (key) => applyFilters({ ...filters, [key]: key === 'vip' ? false : '' });
  const activeChips = [
    ...Object.entries(FILTER_LABELS)
      .filter(([key]) => filters[key] && filters[key] !== 'ALL')
      .map(([key, label]) => ({ key, label, value: filters[key] })),
    ...(filters.vip ? [{ key: 'vip', label: 'Collection', value: 'VIP only' }] : []),
  ];

  return (
    <>
      <HeroCarousel>
        <div className="shell grid gap-12 pb-16 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pb-20 lg:pt-20">
          <div className="animate-rise">
            <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-cap text-goldleaf">
              <span className="h-px w-8 bg-goldleaf/60" aria-hidden="true" />
              {SITE.tagline}
            </p>
            <h1 className="mt-6 max-w-2xl font-display text-[44px] leading-[1.05] tracking-tight text-pearl sm:text-6xl lg:text-[68px]">
              Residences of consequence,
              <span className="block italic text-goldleaf">quietly curated.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-pearl/70">
              Temu Estates represents a considered portfolio of houses, apartments, serviced stays and commercial
              addresses across Addis Ababa — verified in person, presented without noise.
            </p>
            <div className="mt-9 grid max-w-lg grid-cols-3 gap-5 border-t border-white/15 pt-6">
              <Stat value={stats.total ? `${stats.total}` : '—'} label="Listings" />
              <Stat value={stats.neighbourhoods ? `${stats.neighbourhoods}` : '—'} label="Neighbourhoods" />
              <Stat value={stats.vip ? `${stats.vip}` : '—'} label="VIP exclusives" />
            </div>
          </div>

          <div className="hidden justify-self-end text-right lg:block">
            <Link
              to="/commercial"
              className="group inline-flex flex-col items-end gap-2 rounded-xl border border-white/15 bg-jet-950/30 px-6 py-5 backdrop-blur transition hover:border-goldleaf/40"
            >
              <Building2 className="h-5 w-5 text-goldleaf" />
              <span className="font-display text-xl text-pearl">Commercial portfolio</span>
              <span className="flex items-center gap-1.5 text-xs text-pearl/60 transition group-hover:text-goldleaf">
                Offices, retail & warehousing
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </HeroCarousel>

      <div className="shell relative z-10 -mt-10">
        <PropertyFilters value={filters} onChange={applyFilters} types={RESIDENTIAL_TYPES} />
      </div>

      <section id="listings" className="shell scroll-mt-24 pb-20 pt-14 lg:pt-16">
        <SectionHeading
          eyebrow="The collection"
          title="Available residences"
          description={`${results.length} ${results.length === 1 ? 'listing' : 'listings'} matching your search · prices shown in ${currency}`}
        />

        {activeChips.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {activeChips.map(({ key, label, value }) => (
              <button
                key={key}
                type="button"
                onClick={() => clearFilter(key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-champagne-400/40 bg-champagne-400/10 px-3 py-1 text-xs text-champagne-200 transition hover:bg-champagne-400/20"
              >
                <span className="text-champagne-400/80">{label}:</span>
                {value}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          {error ? (
            <Alert>
              {error}{' '}
              <button type="button" onClick={reload} className="underline underline-offset-4">
                Try again
              </button>
            </Alert>
          ) : !loading && results.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No listings match that search"
              description="Try widening the area, refreshing the filters, or speaking with us about off-market opportunities."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => applyFilters({ ...filters, q: '', type: 'ALL', beds: 'ALL', status: 'ALL' })}
                  >
                    Clear filters
                  </Button>
                  <Button as={Link} to="/contact">
                    Speak with an advisor
                  </Button>
                </div>
              }
            />
          ) : (
            <PropertyGrid listings={results} loading={loading} />
          )}
        </div>
      </section>

      <section className="border-y border-ink-800 bg-ink-900/40">
        <div className="shell grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <Crown className="h-4 w-4 text-champagne-400" />
              VIP collection
            </p>
            <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight text-ivory sm:text-5xl">
              A quieter register of <span className="italic text-champagne-200">off-market</span> addresses.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone">
              Genuine VIP listings — diplomatic villas, private compounds and penthouses — are shared selectively.
              Register for the client portal to receive first access and private viewing invitations.
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <div className="flex items-center gap-3 text-sm text-stone">
              <ShieldCheck className="h-4 w-4 text-champagne-400" />
              Verified owners and title checks
            </div>
            <Button as={Link} to="/portal" size="lg" className="w-full lg:w-auto">
              Request VIP access
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-ink-500">Registered clients are contacted by the managing director directly.</p>
          </div>
        </div>
      </section>

      <section className="shell py-20">
        <SectionHeading
          eyebrow="How we work"
          title="Three ways to engage"
          description="Whether you are placing capital, relocating a family or expanding a business, the process is deliberate and discreet."
        />
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700 sm:grid-cols-3">
          {[
            {
              icon: KeyRound,
              title: 'Buy or lease',
              body: 'Shortlists built around your brief, with title diligence, negotiation and a single point of contact to completion.',
            },
            {
              icon: Sparkles,
              title: 'Serviced stays',
              body: 'Furnished nightly and monthly residences for executives and visiting delegations — inspected, staffed and ready.',
            },
            {
              icon: TrendingUp,
              title: 'Place property',
              body: 'Owner representation for compounds, towers and commercial assets, including photography, pricing and qualified buyers.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-ink-900 p-7">
              <Icon className="h-5 w-5 text-champagne-400" />
              <h3 className="mt-5 font-display text-2xl text-ivory">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-800 bg-ink-900/30">
        <div className="shell grid gap-10 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-8">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-champagne-400/40 bg-champagne-400/10 font-display text-2xl text-champagne-200">
                {SITE.agent.initials}
              </div>
              <div>
                <p className="font-display text-2xl text-ivory">{SITE.agent.name}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-champagne-400">{SITE.agent.title}</p>
              </div>
            </div>
            <dl className="mt-7 space-y-3 border-t border-ink-800 pt-6 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-500">Office</dt>
                <dd className="text-right text-stone">{SITE.agent.office}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-500">Direct line</dt>
                <dd>
                  <a href={`tel:+${SITE.agent.phoneIntl}`} className="text-ivory hover:text-champagne-200">
                    {SITE.agent.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-500">Email</dt>
                <dd>
                  <a href={`mailto:${SITE.agent.email}`} className="text-ivory hover:text-champagne-200">
                    {SITE.agent.email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <p className="eyebrow">The house</p>
            <blockquote className="mt-5 font-display text-3xl leading-snug text-ivory sm:text-4xl">
              “We present fewer properties than most, because every listing we take on is inspected, priced and
              represented as though we were buying it ourselves.”
            </blockquote>
            <p className="mt-6 text-sm uppercase tracking-[0.18em] text-stone">Temesgen Teklay · Managing Director</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/contact" variant="outline">
                Arrange a viewing
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button as={Link} to="/map" variant="ghost">
                Explore the map
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
