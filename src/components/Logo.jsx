import { Link } from 'react-router-dom';
import { cx } from '../lib/ui.js';
import { SITE } from '../lib/site.js';

export function BrandMark({ className }) {
  return (
    <span
      className={cx(
        'grid place-items-center rounded-md border border-champagne-400/50 bg-champagne-400/[0.07] font-display leading-none text-champagne-300',
        className
      )}
      aria-hidden="true"
    >
      T
    </span>
  );
}

export function Logo({ compact = false, onNavigate }) {
  return (
    <Link
      to="/"
      onClick={onNavigate}
      className="group flex items-center gap-3"
      aria-label={`${SITE.name} — home`}
    >
      <BrandMark className={compact ? 'h-9 w-9 text-lg' : 'h-10 w-10 text-xl'} />
      <span className="flex flex-col">
        <span
          className={cx(
            'font-display font-medium uppercase leading-none tracking-[0.22em] text-ivory transition group-hover:text-champagne-200',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          Temu Estates
        </span>
        <span className="mt-1 text-[9px] uppercase tracking-[0.3em] text-stone">
          {compact ? SITE.nameAmharic : `${SITE.nameAmharic} · Addis Ababa`}
        </span>
      </span>
    </Link>
  );
}
