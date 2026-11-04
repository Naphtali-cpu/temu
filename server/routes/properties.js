import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { db, transaction, UPLOAD_DIR } from '../db.js';
import { HttpError, assertValid } from '../http.js';
import { requireAdmin } from '../auth.js';
import { CATEGORIES, STATUSES, parsePropertyInput } from '../validation.js';

const router = Router();

const LOCAL_UPLOAD = /^\/uploads\/([\w.-]+)$/;

/** Delete image files that only ever belonged to this listing. */
function removeUploads(images, keep = new Set()) {
  const names = new Set();
  for (const image of images) {
    for (const url of [image.url, image.thumb]) {
      const match = LOCAL_UPLOAD.exec(url || '');
      if (match && !keep.has(`/uploads/${match[1]}`)) names.add(match[1]);
    }
  }
  for (const name of names) {
    try {
      fs.unlinkSync(path.join(UPLOAD_DIR, name));
    } catch (error) {
      if (error.code !== 'ENOENT') console.warn(`Could not remove upload ${name}:`, error.message);
    }
  }
}

function loadImages(ids) {
  const images = new Map();
  if (ids.length === 0) return images;
  const rows = db.prepare(
    `SELECT property_id, url, thumb_url FROM property_images
     WHERE property_id IN (${ids.map(() => '?').join(',')})
     ORDER BY position ASC`
  ).all(...ids);
  for (const row of rows) {
    if (!images.has(row.property_id)) images.set(row.property_id, []);
    images.get(row.property_id).push({ url: row.url, thumb: row.thumb_url });
  }
  return images;
}

function toListing(row, images = []) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    type: row.type,
    priceType: row.price_type,
    priceETB: row.price_etb,
    status: row.status,
    locationName: row.location_name,
    lat: row.lat,
    lng: row.lng,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    areaSqm: row.area_sqm,
    isVIP: row.is_vip === 1,
    description: row.description,
    sortOrder: row.sort_order,
    images,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function findListings(rows) {
  const imagesById = loadImages(rows.map((row) => row.id));
  return rows.map((row) => toListing(row, imagesById.get(row.id) || []));
}

function findListing(id) {
  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  if (!row) return null;
  return findListings([row])[0];
}

function requireListing(id) {
  const listing = findListing(id);
  if (!listing) throw new HttpError(404, 'Property not found.');
  return listing;
}

function writeImages(propertyId, images) {
  db.prepare('DELETE FROM property_images WHERE property_id = ?').run(propertyId);
  const insert = db.prepare('INSERT INTO property_images (property_id, position, url, thumb_url) VALUES (?, ?, ?, ?)');
  images.forEach((image, position) => insert.run(propertyId, position, image.url, image.thumb));
}

function buildListingFilters(query) {
  const where = [];
  const params = [];

  if (CATEGORIES.includes(query.category)) {
    where.push('category = ?');
    params.push(query.category);
  }
  if (query.type && query.type !== 'ALL') {
    where.push('LOWER(type) = LOWER(?)');
    params.push(String(query.type));
  }
  if (STATUSES.includes(query.status)) {
    where.push('status = ?');
    params.push(query.status);
  }
  if (query.q) {
    const like = `%${String(query.q).trim()}%`;
    where.push('(title LIKE ? OR location_name LIKE ? OR type LIKE ?)');
    params.push(like, like, like);
  }
  if (query.vip === '1' || query.vip === 'true') {
    where.push('is_vip = 1');
  }
  if (query.beds !== undefined && query.beds !== '' && query.beds !== 'ALL') {
    const beds = Number(query.beds);
    if (Number.isInteger(beds) && beds >= 0) {
      if (beds === 0) {
        where.push('bedrooms <= 1');
      } else {
        where.push('bedrooms >= ?');
        params.push(beds);
      }
    }
  }

  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

router.get('/', (req, res) => {
  const { clause, params } = buildListingFilters(req.query);
  const rows = db.prepare(
    `SELECT * FROM properties ${clause} ORDER BY sort_order ASC, created_at DESC`
  ).all(...params);
  res.json({ items: findListings(rows), total: rows.length });
});

router.get('/:id', (req, res) => {
  res.json(requireListing(req.params.id));
});

router.post('/reorder', requireAdmin, (req, res) => {
  const ids = req.body?.ids;
  const existing = db.prepare('SELECT id FROM properties').all().map((row) => row.id);
  const valid = Array.isArray(ids)
    && ids.length === existing.length
    && new Set(ids).size === ids.length
    && ids.every((id) => existing.includes(id));
  if (!valid) throw new HttpError(422, 'Reorder request must include every listing exactly once.');

  transaction(() => {
    const update = db.prepare('UPDATE properties SET sort_order = ? WHERE id = ?');
    ids.forEach((id, index) => update.run(index, id));
  });
  res.json({ items: findListings(db.prepare('SELECT * FROM properties ORDER BY sort_order ASC, created_at DESC').all()) });
});

router.post('/', requireAdmin, (req, res) => {
  const { value, errors } = parsePropertyInput(req.body);
  assertValid(errors || {});

  const id = `prop-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const { images, ...fields } = value;

  transaction(() => {
    const { next } = db.prepare('SELECT COALESCE(MIN(sort_order), 0) - 1 AS next FROM properties').get();
    db.prepare(`
      INSERT INTO properties (
        id, title, category, type, price_type, price_etb, status, location_name, lat, lng,
        bedrooms, bathrooms, area_sqm, is_vip, description, sort_order, created_at, updated_at
      ) VALUES (
        @id, @title, @category, @type, @priceType, @priceETB, @status, @locationName, @lat, @lng,
        @bedrooms, @bathrooms, @areaSqm, @isVIP, @description, @sortOrder, @now, @now
      )
    `).run({ ...fields, isVIP: fields.isVIP ? 1 : 0, id, sortOrder: next, now });
    writeImages(id, images);
  });

  res.status(201).json(requireListing(id));
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = requireListing(req.params.id);
  const { value, errors } = parsePropertyInput(req.body);
  assertValid(errors || {});
  const { images, ...fields } = value;

  transaction(() => {
    db.prepare(`
      UPDATE properties SET
        title = @title, category = @category, type = @type, price_type = @priceType,
        price_etb = @priceETB, status = @status, location_name = @locationName,
        lat = @lat, lng = @lng, bedrooms = @bedrooms, bathrooms = @bathrooms,
        area_sqm = @areaSqm, is_vip = @isVIP, description = @description,
        updated_at = @updatedAt
      WHERE id = @id
    `).run({
      ...fields,
      isVIP: fields.isVIP ? 1 : 0,
      updatedAt: new Date().toISOString(),
      id: existing.id,
    });
    writeImages(existing.id, images);
  });

  const kept = new Set(images.flatMap((image) => [image.url, image.thumb]));
  removeUploads(existing.images, kept);

  res.json(requireListing(existing.id));
});

router.patch('/:id/status', requireAdmin, (req, res) => {
  const existing = requireListing(req.params.id);
  if (!STATUSES.includes(req.body?.status)) {
    throw new HttpError(422, 'Please correct the highlighted fields.', { status: 'Choose a valid status.' });
  }
  db.prepare('UPDATE properties SET status = ?, updated_at = ? WHERE id = ?')
    .run(req.body.status, new Date().toISOString(), existing.id);
  res.json(requireListing(existing.id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const existing = requireListing(req.params.id);
  db.prepare('DELETE FROM properties WHERE id = ?').run(existing.id);
  removeUploads(existing.images);
  res.status(204).end();
});

export default router;
