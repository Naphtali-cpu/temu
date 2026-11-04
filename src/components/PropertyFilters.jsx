import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button, Select } from './ui.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';

const EMPTY = { q: '', type: 'ALL', beds: 'ALL', status: 'ALL', priceType: 'ALL' };

export function PropertyFilters({ value, onChange, types = [], className, compact = false }) {
  const { currency, rate, rateMeta } = useCurrency();
  const [draft, setDraft] = useState({ ...EMPTY, ...value });

  useEffect(() => {
    setDraft({ ...EMPTY, ...value });
  }, [value]);

  const update = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const submit = (event) => {
    event?.preventDefault();
    onChange(draft);
  };
  const reset = () => {
    setDraft(EMPTY);
    onChange(EMPTY);
  };
  const isDirty = JSON.stringify({ ...EMPTY, ...value }) !== JSON.stringify(EMPTY);

  return (
    <form
      onSubmit={submit}
      className={`rounded-xl border border-ink-700 bg-ink-900/90 p-4 backdrop-blur ${className || ''}`}
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-500" />
          <input
            type="search"
            value={draft.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Search by area, title or type"
            aria-label="Search listings"
            className="h-11 w-full rounded-lg border border-ink-700 bg-ink-950 pl-10 pr-3 text-sm text-ivory placeholder:text-ink-500 transition focus:border-champagne-400/70 focus:outline-none"
          />
        </label>

        <Select value={draft.type} onChange={(event) => update({ type: event.target.value })} aria-label="Property type" className="h-11 py-0">
          <option value="ALL">All types</option>
          {types.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </Select>

        <Select value={draft.beds} onChange={(event) => update({ beds: event.target.value })} aria-label="Bedrooms" className="h-11 py-0">
          <option value="ALL">Any bedrooms</option>
          <option value="0">Studio / 1 bed</option>
          {[2, 3, 4, 5, 6, 7, 8].map((count) => (
            <option key={count} value={count}>{count}+ bedrooms</option>
          ))}
        </Select>

        <Select value={draft.status} onChange={(event) => update({ status: event.target.value })} aria-label="Status" className="h-11 py-0">
          <option value="ALL">Any status</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="RENTED">Rented</option>
          <option value="BOUGHT">Sold</option>
        </Select>

        <div className="flex items-center gap-2">
          <Button type="submit" className="h-11 flex-1 lg:flex-none">
            <SlidersHorizontal className="h-4 w-4" />
            Show results
          </Button>
          {isDirty && (
            <Button type="button" variant="ghost" size="icon" onClick={reset} aria-label="Clear filters" title="Clear filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-800 pt-3 text-[11px] text-ink-500">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-[0.16em]">Price basis</span>
            <span className="text-stone">Sale · monthly rent · nightly stays</span>
          </div>
          <span>
            1 USD ≈ {Number(rate).toFixed(2)} ETB · showing {currency} {rateMeta?.updatedAt ? '· live rate' : '· indicative rate'}
          </span>
        </div>
      )}
    </form>
  );
}
