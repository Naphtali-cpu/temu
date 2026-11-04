import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Loader2, X } from 'lucide-react';
import { cx, errorClass, helpClass, inputClass, labelClass } from '../lib/ui.js';

const VARIANTS = {
  primary:
    'bg-champagne-400 text-ink-1000 hover:bg-champagne-300 disabled:hover:bg-champagne-400 shadow-soft',
  dark: 'bg-ink-800 text-ivory border border-ink-700 hover:border-ink-600 hover:bg-ink-700',
  outline:
    'border border-ink-600 text-ivory hover:border-champagne-400/60 hover:text-champagne-200 bg-transparent',
  ghost: 'text-stone hover:text-ivory hover:bg-ink-800',
  danger: 'border border-danger/40 bg-danger/10 text-danger-ink hover:bg-danger/20',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-sm',
  icon: 'h-9 w-9',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50';

export function buttonClass(variant = 'primary', size = 'md', className) {
  return cx(BASE, VARIANTS[variant] || VARIANTS.primary, SIZES[size] || SIZES.md, className);
}

export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  children,
  disabled,
  ...props
}) {
  const isDisabled = disabled || loading;
  const shared = {
    className: buttonClass(variant, size, className),
    ...props,
    ...(Component === 'button' ? { type: props.type || 'button', disabled: isDisabled } : { 'aria-disabled': isDisabled }),
  };
  return (
    <Component {...shared}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Component>
  );
}

export function Field({ label, htmlFor, hint, error, required, className, children }) {
  return (
    <div className={className}>
      {label && (
        <label className={labelClass} htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-1 text-champagne-400">*</span>}
        </label>
      )}
      {children}
      {error ? <p className={errorClass}>{error}</p> : hint ? <p className={helpClass}>{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }) {
  return <input className={cx(inputClass, className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }) {
  return <textarea rows={rows} className={cx(inputClass, 'resize-y leading-relaxed', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select className={cx(inputClass, 'cursor-pointer appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
    </div>
  );
}

export function Checkbox({ label, checked, onChange, name, hint }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-stone">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600 bg-ink-900 accent-champagne-400"
        />
        <span className="leading-snug">{label}</span>
      </label>
      {hint && <p className={cx(helpClass, 'pl-7')}>{hint}</p>}
    </div>
  );
}

const TONES = {
  positive: 'border-success/40 bg-success/10 text-success-ink',
  warning: 'border-champagne-400/50 bg-champagne-400/10 text-champagne-300',
  info: 'border-info/40 bg-info/10 text-info-ink',
  neutral: 'border-ink-600 bg-ink-800 text-stone',
  accent: 'border-champagne-400/50 bg-champagne-400/10 text-champagne-300',
  danger: 'border-danger/40 bg-danger/10 text-danger-ink',
};

export function Badge({ tone = 'neutral', children, className, dot = false }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
        TONES[tone] || TONES.neutral,
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Card({ className, children, as: Component = 'div', ...props }) {
  return (
    <Component className={cx('rounded-xl border border-ink-700 bg-ink-900', className)} {...props}>
      {children}
    </Component>
  );
}

export function SectionHeading({ eyebrow, title, description, action, className, size = 'lg' }) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2
          className={cx(
            'font-display font-medium tracking-tight text-ivory',
            size === 'lg' ? 'mt-2 text-3xl sm:text-4xl' : 'mt-1 text-2xl'
          )}
        >
          {title}
        </h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Alert({ tone = 'danger', children, className }) {
  const styles = {
    danger: 'border-danger/50 bg-danger/10 text-danger-ink',
    warning: 'border-champagne-400/40 bg-champagne-500/10 text-champagne-200',
    info: 'border-ink-700 bg-ink-800 text-stone',
  };
  return (
    <div className={cx('rounded-lg border px-4 py-3 text-sm leading-relaxed', styles[tone] || styles.info, className)}>
      {children}
    </div>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cx('h-5 w-5 animate-spin text-champagne-400', className)} />;
}

export function EmptyState({ title, description, action, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-700 bg-ink-900/40 px-6 py-16 text-center">
      {Icon && <Icon className="mb-4 h-8 w-8 text-ink-500" />}
      <p className="font-display text-xl text-ivory">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-lg bg-ink-800', className)} />;
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-2xl' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/80 p-4 backdrop-blur-sm sm:p-8">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'my-4 w-full animate-rise rounded-xl border border-ink-700 bg-ink-900 shadow-lift outline-none',
          width
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-700 px-6 py-4">
          <h3 className="font-display text-2xl text-ivory">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone transition hover:bg-ink-800 hover:text-ivory"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-ink-700 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/** Small hook for copy-to-clipboard feedback. */
export function useCopied(timeout = 1800) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), timeout);
    return () => clearTimeout(timer);
  }, [copied, timeout]);
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return { copied, copy };
}
