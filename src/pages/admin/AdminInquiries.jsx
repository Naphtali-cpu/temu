import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Mail, MessageSquare, Phone, RefreshCw, Search, Trash2 } from 'lucide-react';
import { AdminPageHeader } from './AdminLayout.jsx';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
} from '../../components/ui.jsx';
import { inquiriesApi } from '../../api/index.js';
import { apiErrorMessage } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { INQUIRY_STATUS_LABELS, formatDateTime, timeAgo } from '../../lib/format.js';
import { openTelegram, openWhatsApp } from '../../lib/contact.js';
import { cx } from '../../lib/ui.js';

const TONES = { NEW: 'warning', CONTACTED: 'info', CLOSED: 'neutral' };
const TABS = ['ALL', 'NEW', 'CONTACTED', 'CLOSED'];

export default function AdminInquiries() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('ALL');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await inquiriesApi.list();
      setItems(data.items || []);
      setError('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Inquiries could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(
    () => ({
      ALL: items.length,
      NEW: items.filter((item) => item.status === 'NEW').length,
      CONTACTED: items.filter((item) => item.status === 'CONTACTED').length,
      CLOSED: items.filter((item) => item.status === 'CLOSED').length,
    }),
    [items]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (tab !== 'ALL' && item.status !== tab) return false;
      if (!needle) return true;
      return `${item.fullName} ${item.email} ${item.phone} ${item.purpose} ${item.propertyTitle || ''}`
        .toLowerCase()
        .includes(needle);
    });
  }, [items, tab, query]);

  const changeStatus = async (inquiry, status) => {
    setUpdatingId(inquiry.id);
    try {
      const updated = await inquiriesApi.setStatus(inquiry.id, status);
      setItems((current) => current.map((item) => (item.id === inquiry.id ? { ...item, status: updated.status } : item)));
      setSelected((current) => (current && current.id === inquiry.id ? { ...current, status: updated.status } : current));
      toast(`Inquiry marked ${INQUIRY_STATUS_LABELS[status].toLowerCase()}.`, 'success', 'Inbox updated');
    } catch (err) {
      toast(apiErrorMessage(err, 'The inquiry could not be updated.'), 'error', 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Clients"
        title="Inquiries"
        description="Every enquiry submitted on the website, newest first. Reply by email, WhatsApp or Telegram and mark each one as handled."
        action={
          <Button type="button" variant="outline" size="sm" onClick={load} loading={loading && items.length > 0}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-ink-700 bg-ink-900 p-1">
          {TABS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTab(option)}
              className={cx(
                'rounded-md px-3 py-1.5 text-xs font-medium transition',
                tab === option ? 'bg-champagne-400 text-ink-1000' : 'text-stone hover:text-ivory'
              )}
            >
              {option === 'ALL' ? 'All' : INQUIRY_STATUS_LABELS[option]}
              <span className={cx('ml-1.5 tabular-nums', tab === option ? 'text-ink-1000/60' : 'text-ink-500')}>
                {counts[option]}
              </span>
            </button>
          ))}
        </div>

        <label className="relative flex w-full max-w-xs items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or listing"
            aria-label="Search inquiries"
            className="pl-10"
          />
        </label>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={items.length === 0 ? 'No inquiries yet' : 'Nothing in this view'}
          description={
            items.length === 0
              ? 'When a visitor sends an enquiry from the website it appears here, along with the listing they asked about.'
              : 'Try a different status tab or clear your search.'
          }
          action={
            items.length > 0 ? (
              <Button type="button" variant="outline" onClick={() => { setTab('ALL'); setQuery(''); }}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((inquiry) => (
            <Card
              key={inquiry.id}
              className={cx(
                'cursor-pointer p-4 transition hover:border-champagne-400/40',
                inquiry.status === 'NEW' && 'border-l-2 border-l-champagne-400'
              )}
              onClick={() => setSelected(inquiry)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ivory">{inquiry.fullName}</p>
                    <Badge tone={TONES[inquiry.status]} dot>{INQUIRY_STATUS_LABELS[inquiry.status]}</Badge>
                    <span className="text-[11px] text-ink-500">{timeAgo(inquiry.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone">
                    {inquiry.purpose}
                    {inquiry.propertyTitle ? ` · ${inquiry.propertyTitle}` : ''}
                  </p>
                  <p className="mt-2 line-clamp-2 max-w-3xl text-[13px] leading-relaxed text-stone/90">
                    {inquiry.message}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-[11px] text-ink-500">{formatDateTime(inquiry.createdAt)}</span>
                  <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                    <a
                      href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Re: your ${inquiry.purpose.toLowerCase()} enquiry — Temu Estates`)}`}
                      className="rounded-lg border border-ink-700 p-2 text-stone transition hover:border-champagne-400/50 hover:text-champagne-200"
                      aria-label={`Email ${inquiry.fullName}`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => changeStatus(inquiry, inquiry.status === 'NEW' ? 'CONTACTED' : 'CLOSED')}
                      disabled={updatingId === inquiry.id || inquiry.status === 'CLOSED'}
                      className="rounded-lg border border-ink-700 px-2.5 py-1.5 text-[11px] text-stone transition hover:border-champagne-400/50 hover:text-champagne-200 disabled:opacity-40"
                    >
                      {inquiry.status === 'NEW' ? 'Mark contacted' : inquiry.status === 'CONTACTED' ? 'Close' : 'Closed'}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.fullName : ''}
        width="max-w-2xl"
        footer={
          selected ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <Select
                value={selected.status}
                onChange={(event) => changeStatus(selected, event.target.value)}
                disabled={updatingId === selected.id}
                aria-label="Inquiry status"
                className="h-10 w-[160px] py-0 text-xs"
              >
                {Object.entries(INQUIRY_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => openWhatsApp(selected.propertyTitle || selected.purpose)}>
                  <MessageSquare className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => openTelegram(selected.propertyTitle || selected.purpose)}>
                  Telegram
                </Button>
                <Button
                  as="a"
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: your ${selected.purpose.toLowerCase()} enquiry — Temu Estates`)}&body=${encodeURIComponent(`Hello ${selected.fullName},\n\nThank you for your enquiry about ${selected.propertyTitle || 'our portfolio'}.\n\n`)}`}
                  size="sm"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Reply by email
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={TONES[selected.status]} dot>{INQUIRY_STATUS_LABELS[selected.status]}</Badge>
              <Badge tone="neutral">{selected.purpose}</Badge>
              <span className="text-[11px] text-ink-500">{formatDateTime(selected.createdAt)}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={`mailto:${selected.email}`}
                className="flex items-center gap-2.5 rounded-lg border border-ink-700 px-3 py-2.5 text-sm text-stone transition hover:border-champagne-400/40 hover:text-ivory"
              >
                <Mail className="h-4 w-4 text-champagne-400" />
                <span className="truncate">{selected.email}</span>
              </a>
              {selected.phone ? (
                <a
                  href={`tel:${selected.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-2.5 rounded-lg border border-ink-700 px-3 py-2.5 text-sm text-stone transition hover:border-champagne-400/40 hover:text-ivory"
                >
                  <Phone className="h-4 w-4 text-champagne-400" />
                  {selected.phone}
                </a>
              ) : (
                <div className="flex items-center gap-2.5 rounded-lg border border-ink-800 px-3 py-2.5 text-sm text-ink-500">
                  <Phone className="h-4 w-4" /> No phone provided
                </div>
              )}
            </div>

            {selected.propertyTitle && (
              <div className="rounded-lg border border-champagne-400/25 bg-champagne-400/[0.05] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-champagne-400">Listing enquired about</p>
                <Link
                  to={`/property/${selected.propertyId}`}
                  className="mt-1 block text-sm text-ivory hover:text-champagne-200"
                >
                  {selected.propertyTitle}
                </Link>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Message</p>
              <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-stone">{selected.message}</p>
            </div>

            <p className="flex items-center gap-1.5 text-[11px] text-ink-500">
              <Trash2 className="h-3 w-3" />
              Inquiries are retained for the client record; nothing is deleted automatically.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
