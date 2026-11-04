import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { Alert, Button, SectionHeading } from '../components/ui.jsx';
import { useProperties } from '../hooks/useProperties.js';
import { ADDIS_AREAS } from '../lib/format.js';

export default function MapPage() {
  const { items, loading, error, reload } = useProperties();

  const counts = useMemo(() => {
    const map = new Map();
    items.forEach((listing) => {
      map.set(listing.locationName, (map.get(listing.locationName) || 0) + 1);
    });
    return map;
  }, [items]);

  const areas = useMemo(() => {
    const known = new Set(ADDIS_AREAS.map((area) => area.name.toLowerCase()));
    const extras = [...counts.keys()]
      .filter((name) => !known.has(name.toLowerCase()))
      .map((name) => ({ name, lat: 0, lng: 0 }));
    return [...ADDIS_AREAS, ...extras].filter((area) => counts.get(area.name) || known.has(area.name.toLowerCase()));
  }, [counts]);

  return (
    <div className="shell py-12">
      <SectionHeading
        eyebrow="Coverage"
        title="The Addis Ababa map"
        description="We work across the city's established residential and commercial districts. Tap a neighbourhood to see what is currently available."
        action={
          <Button as={Link} to="/" variant="outline">
            Back to listings
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />

      {error && (
        <Alert className="mt-6">
          {error}{' '}
          <button type="button" onClick={reload} className="underline underline-offset-4">Try again</button>
        </Alert>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
          <iframe
            title="Map of Addis Ababa"
            src="https://maps.google.com/maps?q=Addis%20Ababa%2C%20Ethiopia&t=m&z=12&output=embed"
            width="100%"
            height="560"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ivory">Neighbourhoods</p>
            <span className="text-[11px] uppercase tracking-[0.16em] text-ink-500">
              {loading ? 'Loading…' : `${items.length} listings`}
            </span>
          </div>
          <ul className="mt-4 divide-y divide-ink-800">
            {areas.map((area) => {
              const count = counts.get(area.name) || 0;
              return (
                <li key={area.name}>
                  <Link
                    to={`/?q=${encodeURIComponent(area.name)}`}
                    className="flex items-center justify-between gap-3 py-3 text-sm transition hover:text-champagne-200"
                  >
                    <span className="flex items-center gap-2.5 text-stone">
                      <MapPin className="h-3.5 w-3.5 text-champagne-400" />
                      {area.name}
                    </span>
                    <span className="text-xs tabular-nums text-ink-500">
                      {count > 0 ? `${count} listing${count > 1 ? 's' : ''}` : 'On request'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
