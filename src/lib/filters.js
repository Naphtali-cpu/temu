export function readFilters(searchParams, defaults = {}) {
  return {
    q: searchParams.get('q') || '',
    type: searchParams.get('type') || 'ALL',
    beds: searchParams.get('beds') || 'ALL',
    status: searchParams.get('status') || 'ALL',
    priceType: searchParams.get('priceType') || 'ALL',
    vip: searchParams.get('vip') === '1',
    category: defaults.category || 'residential',
  };
}

export function applySearchFilters(setSearchParams, filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'category') return;
    if (key === 'vip') {
      if (value) params.set('vip', '1');
      return;
    }
    if (value && value !== 'ALL') params.set(key, value);
  });
  setSearchParams(params, { replace: true });
}

export const FILTER_LABELS = {
  q: 'Search',
  type: 'Type',
  beds: 'Bedrooms',
  status: 'Status',
};
