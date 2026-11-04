import { useRef, useState } from 'react';
import { Camera, Check, GripVertical, ImageOff, Loader2, X } from 'lucide-react';
import { optimizeImage, MAX_PROPERTY_IMAGES } from '../../lib/images.js';
import { cx } from '../../lib/ui.js';

let photoKeySeed = 0;
const nextKey = () => {
  photoKeySeed += 1;
  return `photo-${photoKeySeed}`;
};

export function photosFromListing(images = []) {
  return images.map((image) => ({
    key: nextKey(),
    url: image.url,
    thumb: image.thumb || image.url,
    pending: null,
  }));
}

export function photosToPayload(photos) {
  return photos.map((photo) => ({ url: photo.url, thumb: photo.thumb }));
}

/**
 * Drag-and-drop photo manager. Photos are optimised in the browser and uploaded
 * when the listing is saved, so cancelling an edit leaves nothing behind.
 */
export function PhotoManager({ photos, onChange, max = MAX_PROPERTY_IMAGES }) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [dragKey, setDragKey] = useState(null);
  const inputRef = useRef(null);
  const remaining = Math.max(0, max - photos.length);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || [])
      .filter((file) => file.type?.startsWith('image/'))
      .slice(0, remaining);
    if (files.length === 0) return;

    setWorking(true);
    setError('');
    const results = await Promise.all(
      files.map((file) =>
        optimizeImage(file)
          .then((optimized) => ({ key: nextKey(), url: null, thumb: optimized.thumb, pending: optimized }))
          .catch(() => null)
      )
    );
    setWorking(false);

    const failed = results.filter((result) => !result).length;
    if (failed > 0) setError(`${failed} file${failed > 1 ? 's' : ''} could not be processed.`);
    const next = results.filter(Boolean);
    if (next.length > 0) onChange([...photos, ...next]);
  };

  const remove = (key) => onChange(photos.filter((photo) => photo.key !== key));

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };

  const dropOn = (targetKey) => {
    if (!dragKey || dragKey === targetKey) return;
    const from = photos.findIndex((photo) => photo.key === dragKey);
    const to = photos.findIndex((photo) => photo.key === targetKey);
    if (from < 0 || to < 0) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setDragKey(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone">
          {photos.length} of {max} photos · drag to reorder
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={remaining === 0 || working}
          className="inline-flex items-center gap-2 rounded-lg border border-ink-600 px-3 py-1.5 text-xs text-ivory transition hover:border-champagne-400/60 disabled:opacity-40"
        >
          {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {working ? 'Optimising…' : 'Add photos'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {error && <p className="mt-2 text-xs text-danger-ink">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <div
            key={photo.key}
            draggable
            onDragStart={() => setDragKey(photo.key)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropOn(photo.key)}
            onDragEnd={() => setDragKey(null)}
            className={cx(
              'group relative aspect-[4/3] cursor-grab overflow-hidden rounded-lg border bg-ink-950',
              dragKey === photo.key ? 'border-champagne-400/80 opacity-60' : 'border-ink-700'
            )}
          >
            <img src={photo.thumb || photo.url} alt={`Property photo ${index + 1}`} className="h-full w-full object-cover" />
            <span className="absolute left-1.5 top-1.5 rounded bg-jet-950/80 px-1.5 py-0.5 text-[10px] font-medium text-pearl">
              {index === 0 ? 'Featured' : `#${index + 1}`}
            </span>
            {photo.pending && (
              <span className="absolute bottom-1.5 left-1.5 rounded bg-champagne-400/90 px-1.5 py-0.5 text-[10px] font-medium text-ink-1000">
                New
              </span>
            )}
            <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded bg-jet-950/85 p-1 text-pearl disabled:opacity-30"
                aria-label="Move photo earlier"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === photos.length - 1}
                className="rounded bg-jet-950/85 p-1 text-pearl disabled:opacity-30"
                aria-label="Move photo later"
              >
                →
              </button>
            </div>
            <button
              type="button"
              onClick={() => remove(photo.key)}
              className="absolute right-1.5 top-1.5 rounded bg-jet-950/85 p-1 text-red-300 transition hover:text-red-200"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={working}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink-600 text-ink-500 transition hover:border-champagne-400/60 hover:text-champagne-300"
          >
            <GripVertical className="h-4 w-4" />
            <span className="text-xs">Drop or select photos</span>
          </button>
        )}
      </div>

      {photos.length === 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-ink-800 bg-ink-950/60 p-3 text-xs text-stone">
          <ImageOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
          <span>
            At least one photo is required. For the best result upload in this order: compound, sitting room, kitchen,
            bedroom, bathroom — the first photo becomes the featured image and the gallery labels follow this order.
          </span>
        </div>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-500">
        <Check className="h-3 w-3" />
        Photos are resized to 1920px, gently enhanced and converted to WebP on save.
      </p>
    </div>
  );
}
