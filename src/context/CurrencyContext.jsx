import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const RATE_STORAGE_KEY = 'temu_estates_rate_v1';
const CURRENCY_STORAGE_KEY = 'temu_estates_currency_v1';
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
const STARTING_RATE = 163.0;

const CurrencyContext = createContext(null);

function readCachedRate() {
  try {
    const saved = JSON.parse(localStorage.getItem(RATE_STORAGE_KEY) || 'null');
    if (saved && Number(saved.rate) > 0) return saved;
  } catch {
    // Ignore malformed cache entries.
  }
  return { rate: STARTING_RATE, updatedAt: null, source: 'Starting rate' };
}

async function fetchRate() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.ETB) return { rate: data.rates.ETB, source: 'ExchangeRate-API · CBE-compatible' };
    }
  } catch {
    // Try the CDN fallback below.
  }
  const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
  if (res.ok) {
    const data = await res.json();
    if (data?.usd?.etb) return { rate: data.usd.etb, source: 'Currency API · CDN fallback' };
  }
  throw new Error('Exchange rate sources are unavailable.');
}

export function CurrencyProvider({ children }) {
  const [rate, setRate] = useState(readCachedRate);
  const [currency, setCurrencyState] = useState(() => localStorage.getItem(CURRENCY_STORAGE_KEY) || 'ETB');
  const [syncing, setSyncing] = useState(false);
  const [rateError, setRateError] = useState('');

  const refreshRate = useCallback(async () => {
    setSyncing(true);
    setRateError('');
    try {
      const next = { ...(await fetchRate()), updatedAt: new Date().toISOString() };
      setRate(next);
      localStorage.setItem(RATE_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      setRateError(error.message || 'The exchange rate source is unavailable.');
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshRate();
    const timer = setInterval(refreshRate, SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refreshRate]);

  const setCurrency = useCallback((next) => {
    setCurrencyState(next);
    localStorage.setItem(CURRENCY_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ rate: rate.rate, rateMeta: rate, currency, setCurrency, syncing, refreshRate, rateError }),
    [rate, currency, setCurrency, syncing, refreshRate, rateError]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used inside a CurrencyProvider');
  return context;
}
