import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { BrandMark } from './Logo.jsx';
import { SITE } from '../lib/site.js';

export function InstagramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.6 7.2a6.7 6.7 0 0 1-4.1-1.4v8.1a5.5 5.5 0 1 1-4.8-5.4v3a2.6 2.6 0 1 0 1.8 2.5V2.5h3a3.8 3.8 0 0 0 4.1 3.7z" />
    </svg>
  );
}

export function TelegramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M21.4 4.3 2.9 11.3c-1 .4-1 1 0 1.3l4.6 1.4 1.8 5.3c.2.6.5.7 1 .3l2.5-1.9 4.7 3.5c.7.4 1.1.2 1.3-.6l3.4-15.5c.2-.9-.4-1.3-1-1zM9.4 14.2l9.1-5.7c.4-.3.8-.1.5.2l-7.6 6.9-.3 3z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink-700 bg-ink-950">
      <div className="shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10 text-xl" />
            <div>
              <p className="font-display text-lg uppercase tracking-[0.22em] text-ivory">Temu Estates</p>
              <p className="text-[9px] uppercase tracking-[0.3em] text-stone">{SITE.nameAmharic}</p>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-stone">{SITE.description}</p>
        </div>

        <div>
          <p className="eyebrow">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm text-stone">
            {[
              { label: 'Residential', to: '/' },
              { label: 'Commercial', to: '/commercial' },
              { label: 'Map', to: '/map' },
              { label: 'Contact', to: '/contact' },
              { label: 'Client portal', to: '/portal' },
            ].map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition hover:text-champagne-200">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Office</p>
          <ul className="mt-4 space-y-3 text-sm text-stone">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne-400" />
              {SITE.agent.office}
            </li>
            <li>
              <a href={`tel:+${SITE.agent.phoneIntl}`} className="flex items-center gap-2.5 hover:text-champagne-200">
                <Phone className="h-4 w-4 shrink-0 text-champagne-400" />
                {SITE.agent.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.agent.email}`} className="flex items-center gap-2.5 hover:text-champagne-200">
                <Mail className="h-4 w-4 shrink-0 text-champagne-400" />
                {SITE.agent.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Follow</p>
          <ul className="mt-4 space-y-2.5 text-sm text-stone">
            {[
              { label: 'Instagram', href: SITE.social.instagram, Icon: InstagramIcon },
              { label: 'TikTok', href: SITE.social.tiktok, Icon: TikTokIcon },
              { label: 'Telegram', href: SITE.social.telegram, Icon: TelegramIcon },
            ].map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 transition hover:text-champagne-200"
                >
                  <Icon className="h-4 w-4 text-champagne-400" />
                  {label}
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="shell flex flex-col gap-2 py-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Temu Estates · Addis Ababa, Ethiopia</p>
          <p className="uppercase tracking-[0.2em]">Private brokerage · Direct managed</p>
        </div>
      </div>
    </footer>
  );
}
