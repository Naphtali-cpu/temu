import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { assetUrl } from '../api/client.js';
import { ROOM_LABELS } from '../lib/images.js';
import { cx } from '../lib/ui.js';

export const photoLabel = (index) => ROOM_LABELS[index] || `View ${index + 1}`;

export function ListingGallery({ images = [], title }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const total = images.length;

  useEffect(() => {
    setActive(0);
  }, [images]);

  const step = useCallback(
    (direction) => setActive((current) => (current + direction + total) % Math.max(total, 1)),
    [total]
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, step]);

  if (total === 0) {
    return <div className="aspect-[16/10] rounded-xl border border-ink-700 bg-ink-800" />;
  }

  const side = images.slice(1, 3);

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-[1.7fr_1fr]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative aspect-[16/10] overflow-hidden rounded-xl bg-ink-800 sm:aspect-auto sm:h-full"
          aria-label="Open photo gallery"
        >
          <img
            src={assetUrl(images[active].url)}
            alt={`${title} — ${photoLabel(active)}`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
          />
          <span className="absolute bottom-3 left-3 rounded-md bg-jet-950/75 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-pearl backdrop-blur">
            {photoLabel(active)}
          </span>
          <span className="absolute bottom-3 right-3 flex items-center gap-2 rounded-md bg-jet-950/75 px-2.5 py-1 text-[11px] text-pearl backdrop-blur">
            <Expand className="h-3.5 w-3.5" />
            {total} photo{total > 1 ? 's' : ''}
          </span>
        </button>

        {side.length > 0 && (
          <div className="hidden grid-rows-2 gap-2 sm:grid">
            {side.map((image, index) => (
              <button
                key={image.url}
                type="button"
                onClick={() => { setActive(index + 1); setOpen(true); }}
                className="group relative overflow-hidden rounded-xl bg-ink-800"
                aria-label={`View ${photoLabel(index + 1)}`}
              >
                <img
                  src={assetUrl(image.thumb || image.url)}
                  alt={photoLabel(index + 1)}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                {index === 1 && total > 3 && (
                  <span className="absolute inset-0 grid place-items-center bg-jet-950/60 text-sm font-medium text-pearl">
                    +{total - 3} more
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip: labelled room views, matching the dashboard photo order. */}
      {total > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cx(
                'group relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition',
                active === index ? 'border-champagne-400' : 'border-ink-700 opacity-70 hover:opacity-100'
              )}
              aria-label={photoLabel(index)}
            >
              <img src={assetUrl(image.thumb || image.url)} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-jet-950/70 px-1.5 py-0.5 text-[9px] text-pearl">
                {photoLabel(index)}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-jet-950/[0.97] backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <p className="truncate text-sm text-pearl">{title}</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-pearl/55">
                {photoLabel(active)} · {active + 1} of {total}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/15 p-2 text-pearl transition hover:border-goldleaf/50"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
            <img
              src={assetUrl(images[active].url)}
              alt={`${title} — ${photoLabel(active)}`}
              className="max-h-full max-w-full object-contain"
            />
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-jet-950/60 p-3 text-pearl transition hover:border-goldleaf/60"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-jet-950/60 p-3 text-pearl transition hover:border-goldleaf/60"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3">
            {images.map((image, index) => (
              <button
                key={`lightbox-${image.url}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                className={cx(
                  'h-14 w-20 shrink-0 overflow-hidden rounded-md border transition',
                  active === index ? 'border-champagne-400' : 'border-transparent opacity-50 hover:opacity-100'
                )}
              >
                <img src={assetUrl(image.thumb || image.url)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
