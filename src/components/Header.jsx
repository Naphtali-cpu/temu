import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Menu, ShieldCheck, X } from 'lucide-react';
import { Logo } from './Logo.jsx';
import { Button } from './ui.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { NAV_LINKS } from '../lib/site.js';
import { cx } from '../lib/ui.js';

function CurrencySwitch({ className }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <div
      className={cx('flex items-center rounded-md border border-ink-700 bg-ink-900 p-0.5', className)}
      role="group"
      aria-label="Display currency"
    >
      {['ETB', 'USD'].map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setCurrency(option)}
          aria-pressed={currency === option}
          className={cx(
            'rounded px-2.5 py-1 text-[11px] font-medium tracking-wide transition',
            currency === option ? 'bg-champagne-400 text-ink-1000' : 'text-stone hover:text-ivory'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function navClass({ isActive }) {
  return cx(
    'relative py-2 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors',
    isActive
      ? 'text-ivory after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:bg-champagne-400'
      : 'text-stone hover:text-ivory'
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-950/85 backdrop-blur-md">
      <div className="shell flex h-[74px] items-center justify-between gap-6">
        <Logo onNavigate={() => setOpen(false)} />

        <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <CurrencySwitch />
          <ThemeToggle />
          {isAdmin ? (
            <Button as={Link} to="/admin" size="sm" variant="outline">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          ) : null}
          {isAuthenticated ? (
            <Button as={Link} to="/portal" size="sm" variant="ghost">
              <ShieldCheck className="h-4 w-4" />
              My portal
            </Button>
          ) : (
            <Button as={Link} to="/portal" size="sm">
              Client portal
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <CurrencySwitch />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-md border border-ink-700 p-2 text-ivory"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-700 bg-ink-950 md:hidden">
          <nav className="shell flex flex-col py-3" aria-label="Mobile">
            <div className="flex items-center justify-between border-b border-ink-800 py-3">
              <span className="text-sm text-ivory">Appearance</span>
              <ThemeToggle showLabel />
            </div>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cx(
                    'flex items-center justify-between border-b border-ink-800 py-3.5 text-sm',
                    isActive ? 'text-champagne-300' : 'text-ivory'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              {isAdmin && (
                <Button as={Link} to="/admin" variant="outline">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Button>
              )}
              <Button as={Link} to="/portal">
                {isAuthenticated ? 'My portal' : 'Client portal'}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
