import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { cx } from '../lib/ui.js';

/** Wide, cinematic architecture shots used behind the hero copy. */
export const HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2400&q=80',
    caption: 'Bole Atlas',
  },
  {
    src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2400&q=80',
    caption: 'Old Airport',
  },
  {
    src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2400&q=80',
    caption: 'Sarbet',
  },
];

const INTERVAL_MS = 3000;
const ZOOM_MS = 9000;

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Full-bleed hero with a three-image crossfade carousel. Each slide holds for
 * three seconds while its image slowly pushes in; hovering pauses the rotation.
 */
export function HeroCarousel({ slides = HERO_SLIDES, interval = INTERVAL_MS, children }) {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const reduced = useReducedMotion();
  const paused = hovering || userPaused || reduced;

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [paused, interval, slides.length]);

  const current = slides[active] || slides[0];

  return (
    <section
      className="relative isolate overflow-hidden border-b border-ink-800"
      aria-roledescription="carousel"
      aria-label="Featured residences"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {slides.map((slide, index) => {
          const isActive = index === active;
          return (
            <div
              key={slide.src}
              aria-hidden="true"
              className={cx(
                'absolute inset-0 transition-opacity duration-[1100ms] ease-out',
                isActive ? 'opacity-100' : 'opacity-0'
              )}
            >
              <img
                src={slide.src}
                alt=""
                loading="eager"
                className="h-full w-full object-cover object-center will-change-transform"
                style={{
                  transform:
                    isActive && !reduced
                      ? 'scale(1.16) translate3d(-1%, -0.6%, 0)'
                      : 'scale(1.02)',
                  transition:
                    isActive && !reduced
                      ? `transform ${ZOOM_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
                      : 'none',
                }}
              />
            </div>
          );
        })}
        {/* Fixed dark veil: enough for legible copy while the photography stays visible. */}
        <div className="absolute inset-0 bg-jet-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-jet-950/90 via-jet-950/45 to-jet-950/5" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-jet-950/95 via-jet-950/35 to-transparent" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="shell flex items-center justify-end gap-3 pt-6">
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-pearl/55 sm:block">
            {String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')} · {current.caption}
          </span>
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/10 bg-jet-950/30 px-2.5 py-1.5 backdrop-blur">
            <div className="flex items-center gap-1.5" role="group" aria-label="Choose hero slide">
              {slides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Show ${slide.caption}`}
                  aria-current={index === active}
                  className={cx(
                    'h-0.5 rounded-full transition-all duration-500',
                    index === active ? 'w-9 bg-goldleaf' : 'w-4 bg-pearl/30 hover:bg-pearl/60'
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setUserPaused((value) => !value)}
              className="text-pearl/55 transition hover:text-pearl"
              aria-label={userPaused ? 'Resume hero slideshow' : 'Pause hero slideshow'}
            >
              {userPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}
