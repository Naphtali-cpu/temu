import crypto from 'node:crypto';
import { Router } from 'express';
import { db } from '../db.js';
import { HttpError, assertValid } from '../http.js';
import { requireAdmin } from '../auth.js';
import { INQUIRY_STATUSES, parseInquiryInput } from '../validation.js';

const router = Router();

function toInquiry(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    purpose: row.purpose,
    message: row.message,
    status: row.status,
    propertyId: row.property_id,
    propertyTitle: row.property_title || null,
    createdAt: row.created_at,
  };
}

const SELECT_INQUIRIES = `
  SELECT i.*, p.title AS property_title
  FROM inquiries i LEFT JOIN properties p ON p.id = i.property_id
`;

router.post('/', (req, res) => {
  const { value, errors } = parseInquiryInput(req.body);
  assertValid(errors || {});

  if (value.propertyId && !db.prepare('SELECT id FROM properties WHERE id = ?').get(value.propertyId)) {
    value.propertyId = null;
  }

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO inquiries (id, full_name, email, phone, purpose, message, property_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW', ?)
  `).run(id, value.fullName, value.email, value.phone, value.purpose, value.message, value.propertyId, new Date().toISOString());

  res.status(201).json({ id });
});

router.get('/', requireAdmin, (req, res) => {
  const status = req.query.status;
  const rows = status && INQUIRY_STATUSES.includes(status)
    ? db.prepare(`${SELECT_INQUIRIES} WHERE i.status = ? ORDER BY i.created_at DESC`).all(status)
    : db.prepare(`${SELECT_INQUIRIES} ORDER BY i.created_at DESC`).all();
  res.json({ items: rows.map(toInquiry), total: rows.length });
});

router.patch('/:id/status', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM inquiries WHERE id = ?').get(req.params.id);
  if (!existing) throw new HttpError(404, 'Inquiry not found.');
  if (!INQUIRY_STATUSES.includes(req.body?.status)) {
    throw new HttpError(422, 'Please correct the highlighted fields.', { status: 'Choose a valid status.' });
  }
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  const row = db.prepare(`${SELECT_INQUIRIES} WHERE i.id = ?`).get(req.params.id);
  res.json(toInquiry(row));
});

export default router;
