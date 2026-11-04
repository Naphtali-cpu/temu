import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TONE_STYLES = {
  success: { border: 'border-success/40', icon: 'text-success-ink', Icon: CheckCircle },
  error: { border: 'border-danger/40', icon: 'text-danger-ink', Icon: AlertTriangle },
  info: { border: 'border-champagne-400/40', icon: 'text-champagne-300', Icon: Info },
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message, tone = 'success', title) => {
      counter.current += 1;
      const id = counter.current;
      setItems((current) => [...current, { id, message, tone, title }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-8"
        role="status"
        aria-live="polite"
      >
        {items.map(({ id, message, tone, title }) => {
          const { border, icon, Icon } = TONE_STYLES[tone] || TONE_STYLES.info;
          return (
            <div
              key={id}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border ${border} bg-ink-900/95 px-4 py-3 shadow-lift backdrop-blur animate-toastIn`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${icon}`} />
              <div className="min-w-0 flex-1">
                {title && <p className="text-sm font-medium text-ivory">{title}</p>}
                <p className="text-sm leading-snug text-stone">{message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="rounded p-1 text-stone transition hover:text-ivory"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}
