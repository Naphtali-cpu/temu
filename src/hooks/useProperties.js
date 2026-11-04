import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { propertiesApi } from '../api/index.js';
import { apiErrorMessage } from '../api/client.js';

/**
 * Client-side filter used by the public site once the portfolio is loaded.
 * The API also supports these filters server-side (see GET /api/properties).
 */
export function matchesFilters(listing, filters = {}) {
  const { category, q, type, beds, status, vip, priceType } = filters;
  if (category && listing.category !== category) return false;
  if (type && type !== 'ALL' && listing.type.toLowerCase() !== String(type).toLowerCase()) return false;
  if (status && status !== 'ALL' && listing.status !== status) return false;
  if (vip && !listing.isVIP) return false;
  if (priceType && priceType !== 'ALL' && listing.priceType !== priceType) return false;
  if (beds && beds !== 'ALL') {
    const count = Number(beds);
    if (Number.isInteger(count)) {
      if (count === 0 ? listing.bedrooms > 1 : listing.bedrooms < count) return false;
    }
  }
  if (q) {
    const needle = String(q).trim().toLowerCase();
    if (needle) {
      const haystack = `${listing.title} ${listing.locationName} ${listing.type}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
  }
  return true;
}

/**
 * Loads the listing portfolio from the API. `params` are sent to the server;
 * pass nothing to load the full portfolio and filter with `matchesFilters`.
 */
export function useProperties(params) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestRef = useRef(0);
  const paramsKey = useMemo(() => JSON.stringify(params || {}), [params]);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError('');
    try {
      const data = await propertiesApi.list(JSON.parse(paramsKey));
      if (requestRef.current === requestId) setItems(data.items || []);
    } catch (err) {
      if (requestRef.current === requestId) setError(apiErrorMessage(err, 'Listings could not be loaded.'));
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    load();
  }, [load]);

  const patchItem = useCallback((id, patch) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  return { items, setItems, loading, error, reload: load, patchItem, removeItem, total: items.length };
}

/** Loads a single listing by id. */
export function useProperty(id) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id) {
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    setError('');
    setNotFound(false);
    setListing(null);
    propertiesApi
      .get(id)
      .then((data) => {
        if (active) setListing(data);
      })
      .catch((err) => {
        if (!active) return;
        if (err?.response?.status === 404) setNotFound(true);
        else setError(apiErrorMessage(err, 'This property could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  return { listing, loading, error, notFound };
}
