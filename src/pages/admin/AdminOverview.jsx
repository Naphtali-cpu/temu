import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle, Crown, Inbox, Plus, RefreshCw } from 'lucide-react';
import { AdminPageHeader } from './AdminLayout.jsx';
import { Alert, Badge, Button, Card, Skeleton } from '../../components/ui.jsx';
import { adminApi } from '../../api/index.js';
import { apiErrorMessage, assetUrl } from '../../api/client.js';
import { useProperties } from '../../hooks/useProperties.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { INQUIRY_STATUS_LABELS, STATUS_LABELS, STATUS_TONES, formatPrice, timeAgo } from '../../lib/format.js';
import { cx } from '../../lib/ui.js';

const INQUIRY_TONES = { NEW: 'warning', CONTACTED: 'info', CLOSED: 'neutral' };

function Kpi({ icon: Icon, label, value, hint, to, tone = 'default' }) {
  const body = (
    <Card className={cx('h-full p-5 transition', to && 'hover:border-champagne-400/40')}>
      <div className="flex items-start justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
        <Icon className={cx('h-4 w-4', tone === 'accent' ? 'text-champagne-400' : 'text-ink-500')} />
      </div>
      <p className="mt-3 font-display text-3xl text-ivory tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function Panel({ title, action, children }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-ivory">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { items, loading, reload } = useProperties();
  const { currency, rate, rateMeta, syncing, refreshRate, rateError } = useCurrency();

  const loadStats = async () => {
    setRefreshing(true);
    try {
      setStats(await adminApi.stats());
      setError('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Dashboard statistics could not be loaded.'));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const total = stats?.listings?.total ?? items.length;
  const available = stats?.listings?.available ?? items.filter((item) => item.status === 'AVAILABLE').length;
  const vip = stats?.listings?.vip ?? items.filter((item) => item.isVIP).length;
  const newInquiries = stats?.inquiries?.new ?? 0;

  const recentInquiries = stats?.recentInquiries || [];
  const latest = [...items].slice(0, 5);

  const composition = [
    { label: 'Residential', value: stats?.listings?.residential ?? 0 },
    { label: 'Commercial', value: stats?.listings?.commercial ?? 0 },
    { label: 'VIP exclusives', value: vip },
    { label: 'Reserved', value: stats?.listings?.reserved ?? 0 },
    { label: 'Rented / sold', value: stats?.listings?.closed ?? 0 },
  ];
  const maxComposition = Math.max(1, ...composition.map((row) => row.value));

  const priceMix = ['sale', 'rent', 'airbnb'].map((type) => ({
    type,
    count: items.filter((item) => item.priceType === type).length,
  }));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Portfolio overview"
        description="A live view of the listings on the website, client demand and the exchange rate shown to visitors."
        action={
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => { loadStats(); reload(); }} loading={refreshing}>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Building2} label="Total listings" value={stats ? total : '—'} hint="Across all categories" to="/admin/listings" />
        <Kpi icon={CheckCircle} label="Available now" value={stats ? available : '—'} hint="Live on the public site" to="/admin/listings?status=AVAILABLE" />
        <Kpi icon={Inbox} label="New inquiries" value={stats ? newInquiries : '—'} hint="Awaiting a first response" to="/admin/inquiries" tone="accent" />
        <Kpi icon={Crown} label="VIP exclusives" value={stats ? vip : '—'} hint="Visible to registered clients" to="/admin/listings?vip=1" tone="accent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Panel
          title="Recent inquiries"
          action={
            <Link to="/admin/inquiries" className="inline-flex items-center gap-1 text-xs text-champagne-300 hover:text-champagne-200">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {!stats ? (
            <div className="space-y-2">
              {[0, 1, 2].map((row) => <Skeleton key={row} className="h-12" />)}
            </div>
          ) : recentInquiries.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone">No inquiries yet. New website inquiries appear here.</p>
          ) : (
            <ul className="divide-y divide-ink-800">
              {recentInquiries.map((inquiry) => (
                <li key={inquiry.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ivory">{inquiry.fullName}</p>
                    <p className="truncate text-xs text-stone">
                      {inquiry.purpose}
                      {inquiry.propertyTitle ? ` · ${inquiry.propertyTitle}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[11px] text-ink-500">{timeAgo(inquiry.createdAt)}</span>
                    <Badge tone={INQUIRY_TONES[inquiry.status]}>{INQUIRY_STATUS_LABELS[inquiry.status]}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Exchange rate">
          <p className="font-display text-3xl text-ivory">
            1 USD = {Number(rate).toFixed(2)} <span className="text-lg text-stone">ETB</span>
          </p>
          <p className="mt-1 text-xs text-stone">
            {rateMeta?.source}
            {rateMeta?.updatedAt ? ` · synced ${timeAgo(rateMeta.updatedAt)}` : ''}
          </p>
          {rateError && <p className="mt-2 text-xs text-danger-ink">{rateError} Showing the last known rate.</p>}
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={refreshRate} loading={syncing}>
            <RefreshCw className={cx('h-3.5 w-3.5', syncing && 'animate-spin')} />
            Sync now
          </Button>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
            Rates refresh automatically every six hours. Visitors can switch between ETB and {currency === 'ETB' ? 'USD' : 'ETB'} anywhere on the site.
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Latest listings"
          action={
            <Link to="/admin/listings" className="text-xs text-champagne-300 hover:text-champagne-200">Manage</Link>
          }
        >
          {loading ? (
            <div className="space-y-2">{[0, 1, 2].map((row) => <Skeleton key={row} className="h-12" />)}</div>
          ) : (
            <ul className="divide-y divide-ink-800">
              {latest.map((listing) => (
                <li key={listing.id}>
                  <Link to={`/admin/listings/${listing.id}`} className="flex items-center gap-3 py-2.5">
                    {listing.images?.[0] ? (
                      <img src={assetUrl(listing.images[0].thumb || listing.images[0].url)} alt="" className="h-10 w-12 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-12 shrink-0 rounded bg-ink-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ivory">{listing.title}</p>
                      <p className="text-[11px] text-stone">{formatPrice(listing.priceETB, currency, rate)}</p>
                    </div>
                    <Badge tone={STATUS_TONES[listing.status]} className="shrink-0">
                      {STATUS_LABELS[listing.status]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Portfolio composition">
          <ul className="space-y-3">
            {composition.map((row) => (
              <li key={row.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone">{row.label}</span>
                  <span className="tabular-nums text-ivory">{row.value}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full bg-champagne-400/70"
                    style={{ width: `${Math.round((row.value / maxComposition) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Price basis">
          <ul className="divide-y divide-ink-800">
            {priceMix.map(({ type, count }) => (
              <li key={type} className="flex items-center justify-between py-3 text-sm">
                <span className="text-stone">
                  {type === 'sale' ? 'For sale' : type === 'rent' ? 'Monthly rental' : 'Nightly stays'}
                </span>
                <span className="tabular-nums text-ivory">{count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
            Photo order follows the gallery labels on the website: compound, sitting room, kitchen, bedroom, bathroom.
          </p>
        </Panel>
      </div>
    </div>
  );
}
