export const cx = (...classes) => classes.filter(Boolean).join(' ');

export const surface = 'rounded-xl border border-ink-700 bg-ink-900';

export const inputClass =
  'w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-ivory placeholder:text-ink-500 transition focus:border-champagne-400/70 focus:outline-none focus:ring-0';

export const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-cap text-stone';

export const helpClass = 'mt-1.5 text-xs text-ink-500';

export const errorClass = 'mt-1.5 text-xs text-danger-ink';
