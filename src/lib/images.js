/**
 * Client-side image pipeline for the admin dashboard.
 *
 * Each upload is resized to a 1920px wide master plus a 640px thumbnail, given a
 * subtle natural enhancement (no colour shifts), and encoded to WebP under a size
 * budget. Both files are uploaded to the API and stored as URLs, so listings stay
 * light and the database never holds base64 blobs.
 */

export const MAX_PROPERTY_IMAGES = 12;
const FULL_MAX_BYTES = 300 * 1024;
const THUMB_MAX_BYTES = 100 * 1024;

export const ROOM_LABELS = [
  'Compound / Exterior',
  'Sitting Room',
  'Kitchen',
  'Bedroom',
  'Bathroom',
];

function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onloadend = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('That image could not be opened.'));
      image.onload = () => resolve(image);
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function drawScaled(image, targetWidth) {
  const scale = Math.min(1, targetWidth / image.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  context.filter = 'brightness(1.04) contrast(1.05) saturate(1.02)';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function encodeUnder(canvas, maxBytes) {
  return new Promise((resolve, reject) => {
    let quality = 0.85;
    const attempt = () => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image encoding failed.'));
            return;
          }
          if (blob.size > maxBytes && quality > 0.45) {
            quality -= 0.1;
            attempt();
            return;
          }
          const reader = new FileReader();
          reader.onerror = () => reject(new Error('Could not encode that image.'));
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        },
        'image/webp',
        quality
      );
    };
    attempt();
  });
}

export async function optimizeImage(file) {
  const image = await loadImage(file);
  const [full, thumb] = await Promise.all([
    encodeUnder(drawScaled(image, 1920), FULL_MAX_BYTES),
    encodeUnder(drawScaled(image, Math.min(640, image.width)), THUMB_MAX_BYTES),
  ]);
  return { full, thumb };
}
