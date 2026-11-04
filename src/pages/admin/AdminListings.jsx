import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Building2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { AdminPageHeader } from './AdminLayout.jsx';
import { Alert, Badge, Button, EmptyState, Input, Modal, Select, Skeleton } from '../../components/ui.jsx';
import { useProperties } from '../../hooks/useProperties.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { propertiesApi } from '../../api/index.js';
import { apiErrorMessage, assetUrl } from '../../api/client.js';
import { CATEGORY_LABELS, STATUS_LABELS, formatDate, formatPrice } from '../../lib/format.js';
import { cx } from '../../lib/ui.js';

const PAGE_SIZE = 12;

export default function AdminListings() {
  const [searchParams] = useSearchParams();
  const { items, loading, error, reload, patchItem, removeItem, setItems } = useProperties();
  const { currency, rate } = useCurrency();
  const { toast } = useToast();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [category, setCategory] = useState('ALL');
  const [vipOnly, setVipOnly] = useState(searchParams.get('vip') === '1');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [query, status, category, vipOnly]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((listing) => {
      if (status !== 'ALL' && listing.status !== status) return false;
      if (category !== 'ALL' && listing.category !== category) return false;
      if (vipOnly && !listing.isVIP) return false;
      if (needle) {
        const haystack = `${listing.title} ${listing.locationName} ${listing.type}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [items, query, status, category, vipOnly]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const changeStatus = async (listing, nextStatus) => {
    setUpdatingId(listing.id);
    try {
      const updated = await propertiesApi.setStatus(listing.id, nextStatus);
      patchItem(listing.id, { status: updated.status, updatedAt: updated.updatedAt });
      toast(`${listing.title} marked ${STATUS_LABELS[nextStatus].toLowerCase()}.`, 'success', 'Status updated');
    } catch (err) {
      toast(apiErrorMessage(err, 'The status could not be updated.'), 'error', 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const move = async (listingId, direction) => {
    const index = items.findIndex((item) => item.id === listingId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setItems(reordered);
    setBusyId(listingId);
    try {
      const data = await propertiesApi.reorder(reordered.map((item) => item.id));
      setItems(data.items);
    } catch (err) {
      toast(apiErrorMessage(err, 'The new order could not be saved.'), 'error', 'Reorder failed');
      reload();
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await propertiesApi.remove(pendingDelete.id);
      removeItem(pendingDelete.id);
      toast(`“${pendingDelete.title}” was removed from the portfolio.`, 'success', 'Listing deleted');
      setPendingDelete(null);
    } catch (err) {
      toast(apiErrorMessage(err, 'The listing could not be deleted.'), 'error', 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setStatus('ALL');
    setCategory('ALL');
    setVipOnly(false);
  };

  const filtersActive = query || status !== 'ALL' || category !== 'ALL' || vipOnly;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Portfolio"
        title="Listings"
        description="Edit, reorder, publish and retire every property on the website. The order here is the order visitors see."
        action={
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={reload} loading={loading && items.length > 0}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button as={Link} to="/admin/listings/new" size="sm">
              <Plus className="h-4 w-4" />
              New listing
            </Button>
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="rounded-xl border border-ink-700 bg-ink-900">
        <div className="flex flex-col gap-3 border-b border-ink-800 p-4 lg:flex-row lg:items-center">
          <label className="relative flex flex-1 items-center">
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, area or type"
              aria-label="Search listings"
              className="pl-10"
            />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto lg:grid-cols-[150px_150px_auto_auto]">
            <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
              <option value="ALL">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
              <option value="ALL">All categories</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </Select>
            <button
              type="button"
              onClick={() => setVipOnly((value) => !value)}
              aria-pressed={vipOnly}
              className={cx(
                'h-11 rounded-lg border px-3 text-xs font-medium transition',
                vipOnly
                  ? 'border-champagne-400/60 bg-champagne-400/10 text-champagne-200'
                  : 'border-ink-700 text-stone hover:text-ivory'
              )}
            >
              VIP only
            </button>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-lg px-3 text-xs text-stone underline underline-offset-4 hover:text-ivory"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 text-[11px] text-ink-500">
          <span>
            {filtered.length} of {items.length} listings
            {filtersActive ? ' matching filters' : ''}
          </span>
          <span>Page {safePage} of {pageCount}</span>
        </div>

        {loading && items.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-16" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Building2}
              title="No listings match those filters"
              description="Adjust the search or filters, or add a new property to the portfolio."
              action={
                filtersActive ? (
                  <Button type="button" variant="outline" onClick={clearFilters}>Clear filters</Button>
                ) : (
                  <Button as={Link} to="/admin/listings/new">Add a listing</Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-y border-ink-800 text-[10px] uppercase tracking-[0.16em] text-ink-500">
                  <th className="px-3 py-2.5 font-medium">Order</th>
                  <th className="px-3 py-2.5 font-medium">Listing</th>
                  <th className="px-3 py-2.5 font-medium">Area</th>
                  <th className="px-3 py-2.5 font-medium">Price</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Updated</th>
                  <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {visible.map((listing) => {
                  const position = items.findIndex((item) => item.id === listing.id);
                  return (
                    <tr key={listing.id} className={cx('transition hover:bg-ink-850/60', busyId === listing.id && 'opacity-50')}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <span className="w-5 text-center text-xs tabular-nums text-ink-500">{position + 1}</span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => move(listing.id, -1)}
                              disabled={position === 0 || busyId === listing.id}
                              className="rounded p-0.5 text-ink-500 transition hover:text-champagne-300 disabled:opacity-25"
                              aria-label={`Move ${listing.title} up`}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => move(listing.id, 1)}
                              disabled={position === items.length - 1 || busyId === listing.id}
                              className="rounded p-0.5 text-ink-500 transition hover:text-champagne-300 disabled:opacity-25"
                              aria-label={`Move ${listing.title} down`}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {listing.images?.[0] ? (
                            <img
                              src={assetUrl(listing.images[0].thumb || listing.images[0].url)}
                              alt=""
                              className="h-11 w-14 shrink-0 rounded object-cover"
                            />
                          ) : (
                            <div className="h-11 w-14 shrink-0 rounded bg-ink-800" />
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/admin/listings/${listing.id}`}
                              className="block max-w-[280px] truncate text-[13px] text-ivory hover:text-champagne-200"
                            >
                              {listing.title}
                            </Link>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="text-[11px] text-stone">{listing.type}</span>
                              <span className="text-[11px] text-ink-600">·</span>
                              <span className="text-[11px] text-ink-500">{CATEGORY_LABELS[listing.category]}</span>
                              {listing.isVIP && (
                                <Badge tone="accent" className="px-1.5 py-0 text-[9px]">VIP</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[13px] text-stone">{listing.locationName}</td>
                      <td className="px-3 py-3">
                        <p className="text-[13px] text-ivory">{formatPrice(listing.priceETB, currency, rate)}</p>
                        <p className="text-[11px] capitalize text-ink-500">
                          {listing.priceType === 'airbnb' ? 'per night' : listing.priceType === 'rent' ? 'per month' : 'sale'}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Select
                              value={listing.status}
                              onChange={(event) => changeStatus(listing, event.target.value)}
                              disabled={updatingId === listing.id}
                              aria-label={`Status for ${listing.title}`}
                              className="h-8 w-[130px] py-0 text-xs"
                            >
                              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-stone">{formatDate(listing.updatedAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/property/${listing.id}`}
                            title="View on site"
                            className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-800 hover:text-ivory"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/admin/listings/${listing.id}`}
                            title="Edit listing"
                            className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-800 hover:text-champagne-200"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(listing)}
                            title="Delete listing"
                            className="rounded-lg p-2 text-ink-500 transition hover:bg-danger/10 hover:text-danger-ink"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-ink-800 px-4 py-3">
            <span className="text-[11px] text-ink-500">Showing {visible.length} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                Previous
              </Button>
              <span className="text-xs text-stone">{safePage} / {pageCount}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={safePage === pageCount}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => (deleting ? null : setPendingDelete(null))}
        title="Delete this listing?"
        width="max-w-md"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Keep listing
            </Button>
            <Button type="button" variant="danger" onClick={confirmDelete} loading={deleting}>
              <Trash2 className="h-4 w-4" />
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-stone">
          <span className="text-ivory">“{pendingDelete?.title}”</span> will be removed from the website immediately.
          This cannot be undone — if the property is only temporarily unavailable, set its status to Reserved or
          Rented instead.
        </p>
        <p className="mt-3 text-xs text-ink-500">Client inquiries already received are kept in the inbox.</p>
      </Modal>
    </div>
  );
}
