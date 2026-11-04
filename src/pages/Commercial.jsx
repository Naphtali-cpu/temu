import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, Compass, Warehouse } from 'lucide-react';
import { PropertyFilters } from '../components/PropertyFilters.jsx';
import { PropertyGrid } from '../components/PropertyCard.jsx';
import { Alert, Button, EmptyState, SectionHeading } from '../components/ui.jsx';
import { matchesFilters, useProperties } from '../hooks/useProperties.js';
import { COMMERCIAL_TYPES } from '../lib/format.js';
import { applySearchFilters, readFilters } from '../lib/filters.js';

export default function Commercial() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams, { category: 'commercial' }), [searchParams]);
  const { items, loading, error, reload } = useProperties();

  const commercial = useMemo(() => items.filter((listing) => listing.category === 'commercial'), [items]);
  const results = useMemo(
    () => commercial.filter((listing) => matchesFilters(listing, { ...filters, category: 'commercial' })),
    [commercial, filters]
  );

  const leaseCount = commercial.filter((listing) => listing.priceType === 'rent').length;
  const totalArea = commercial.reduce((sum, listing) => sum + listing.areaSqm, 0);

  const applyFilters = (next) => applySearchFilters(setSearchParams, { ...next, category: 'commercial' });

  return (
    <>
      <section className="border-b border-ink-800 bg-ink-900/40">
        <div className="shell grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <Building2 className="h-4 w-4 text-champagne-400" />
              Commercial portfolio
            </p>
            <h1 className="mt-5 max-w-2xl font-display text-[42px] leading-[1.05] text-ivory sm:text-6xl">
              Addresses that <span className="italic text-champagne-200">work</span>.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-stone">
              Grade-A office floors, retail frontage, showrooms and warehousing across Addis Ababa’s established
              commercial districts — for occupation or investment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/contact">
                Brief our commercial team
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button as={Link} to="/" variant="ghost">
                Residential portfolio
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-4 rounded-xl border border-ink-700 bg-ink-900 p-6">
            {[
              { label: 'Listings', value: commercial.length },
              { label: 'For lease', value: leaseCount },
              { label: 'Total m²', value: totalArea.toLocaleString('en-US') },
            ].map(({ label, value }) => (
              <div key={label}>
                <dd className="font-display text-3xl text-ivory tabular-nums">{value}</dd>
                <dt className="mt-1 text-[10px] uppercase tracking-[0.18em] text-stone">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="shell relative z-10 pb-2 pt-8">
        <PropertyFilters value={filters} onChange={applyFilters} types={COMMERCIAL_TYPES} />
      </div>

      <section className="shell py-14">
        <SectionHeading
          eyebrow="Commercial collection"
          title="Available commercial space"
          description={`${results.length} ${results.length === 1 ? 'listing' : 'listings'} available`}
        />

        <div className="mt-8">
          {error ? (
            <Alert>
              {error}{' '}
              <button type="button" onClick={reload} className="underline underline-offset-4">Try again</button>
            </Alert>
          ) : !loading && results.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No commercial space matches that search"
              description="We regularly place businesses in off-market buildings. Share your requirement and we will shortlist quietly."
              action={<Button as={Link} to="/contact">Submit a requirement</Button>}
            />
          ) : (
            <PropertyGrid listings={results} loading={loading} skeletonCount={4} />
          )}
        </div>
      </section>

      <section className="border-t border-ink-800 bg-ink-900/40">
        <div className="shell flex flex-col items-start justify-between gap-6 py-12 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <Warehouse className="mt-1 h-5 w-5 text-champagne-400" />
            <div>
              <h2 className="font-display text-2xl text-ivory">Have a commercial asset to place?</h2>
              <p className="mt-1 max-w-xl text-sm text-stone">
                We represent owners for offices, retail and warehousing with qualified tenant and buyer lists.
              </p>
            </div>
          </div>
          <Button as={Link} to="/contact?purpose=Property%20Listing" variant="outline">
            List a commercial property
          </Button>
        </div>
      </section>
    </>
  );
}
