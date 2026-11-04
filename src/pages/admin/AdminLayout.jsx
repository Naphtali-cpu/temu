import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight, Building2, Inbox, LayoutDashboard, LogOut, Menu, Plus, X } from 'lucide-react';
import { BrandMark } from '../../components/Logo.jsx';
import { Badge } from '../../components/ui.jsx';
import { ThemeToggle } from '../../components/ThemeToggle.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminApi } from '../../api/index.js';
import { SITE } from '../../lib/site.js';
import { cx } from '../../lib/ui.js';

function useAdminCounts() {
  const [counts, setCounts] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    adminApi
      .stats()
      .then((data) => {
        if (active) setCounts(data);
      })
      .catch(() => {
        if (active) setCounts(null);
      });
    return () => { active = false; };
  }, [location.pathname]);

  return counts;
}

function navItemClass({ isActive }) {
  return cx(
    'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition',
    isActive ? 'bg-champagne-400/10 text-champagne-200' : 'text-stone hover:bg-ink-800 hover:text-ivory'
  );
}

function NavItems({ counts, onNavigate }) {
  return (
    <>
      <p className="px-3 pb-2 pt-5 text-[10px] uppercase tracking-[0.2em] text-ink-500">Portfolio</p>
      <nav className="space-y-1" aria-label="Admin sections">
        <NavLink to="/admin" end className={navItemClass} onClick={onNavigate}>
          <span className="flex items-center gap-3">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </span>
        </NavLink>
        <NavLink to="/admin/listings" className={navItemClass} onClick={onNavigate}>
          <span className="flex items-center gap-3">
            <Building2 className="h-4 w-4" />
            Listings
          </span>
          {counts?.listings?.total !== undefined && (
            <span className="text-[11px] tabular-nums text-ink-500">{counts.listings.total}</span>
          )}
        </NavLink>
        <NavLink to="/admin/listings/new" className={navItemClass} onClick={onNavigate}>
          <span className="flex items-center gap-3">
            <Plus className="h-4 w-4" />
            New listing
          </span>
        </NavLink>

        <p className="px-3 pb-2 pt-5 text-[10px] uppercase tracking-[0.2em] text-ink-500">Clients</p>
        <NavLink to="/admin/inquiries" className={navItemClass} onClick={onNavigate}>
          <span className="flex items-center gap-3">
            <Inbox className="h-4 w-4" />
            Inquiries
          </span>
          {counts?.inquiries?.new > 0 && (
            <Badge tone="accent" className="px-1.5 py-0 text-[10px]">{counts.inquiries.new}</Badge>
          )}
        </NavLink>
      </nav>
    </>
  );
}

function SidebarContent({ counts, onNavigate, user, onSignOut }) {
  return (
    <div className="flex h-full flex-col p-4">
      <Link to="/admin" onClick={onNavigate} className="flex items-center gap-3 px-2 py-2">
        <BrandMark className="h-9 w-9 text-lg" />
        <span className="flex flex-col">
          <span className="font-display text-sm uppercase tracking-[0.2em] text-ivory">Temu Estates</span>
          <span className="text-[9px] uppercase tracking-[0.24em] text-champagne-400/80">Admin console</span>
        </span>
      </Link>

      <div className="flex-1 overflow-y-auto">
        <NavItems counts={counts} onNavigate={onNavigate} />
      </div>

      <div className="space-y-3 border-t border-ink-800 pt-4">
        <div className="px-2">
          <p className="truncate text-sm text-ivory">{user?.fullName}</p>
          <p className="truncate text-[11px] text-ink-500">{user?.email}</p>
        </div>
        <Link
          to="/"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-stone transition hover:bg-ink-800 hover:text-ivory"
        >
          View public site
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-stone transition hover:bg-danger/10 hover:text-danger-ink"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AdminPageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const counts = useAdminCounts();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const signOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const section = location.pathname.startsWith('/admin/inquiries')
    ? 'Inquiries'
    : location.pathname === '/admin'
      ? 'Overview'
      : params.id
        ? 'Edit listing'
        : 'Listings';

  return (
    <div className="min-h-screen bg-ink-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-ink-800 bg-ink-900 lg:block">
        <SidebarContent counts={counts} onNavigate={() => {}} user={user} onSignOut={signOut} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-ink-800 bg-ink-900">
            <div className="flex justify-end p-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-stone hover:text-ivory" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent counts={counts} onNavigate={() => setOpen(false)} user={user} onSignOut={signOut} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-lg border border-ink-700 p-2 text-ivory lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-500">Admin console</p>
                <p className="text-sm text-ivory">{section}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-stone sm:block">{SITE.tagline}</span>
              <ThemeToggle />
              <Link
                to="/"
                className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs text-stone transition hover:border-champagne-400/50 hover:text-champagne-200"
              >
                Public site
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
