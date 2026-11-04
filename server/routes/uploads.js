import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { UPLOAD_DIR } from '../db.js';
import { HttpError } from '../http.js';
import { requireAdmin } from '../auth.js';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
const DATA_URL_PATTERN = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/;

const router = Router();

router.post('/', requireAdmin, (req, res) => {
  const match = DATA_URL_PATTERN.exec(String(req.body?.dataUrl || ''));
  if (!match) throw new HttpError(422, 'Upload must be a WebP, JPEG or PNG image.');

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0) throw new HttpError(422, 'The uploaded image is empty.');
  if (buffer.length > MAX_UPLOAD_BYTES) throw new HttpError(413, 'Each photo must be 5 MB or smaller after optimization.');

  const fileName = `${crypto.randomUUID()}.${IMAGE_EXTENSIONS[match[1]]}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer);
  res.status(201).json({ url: `/uploads/${fileName}` });
});

export default router;
