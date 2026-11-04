import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';

const router = Router();

router.get('/stats', requireAdmin, (req, res) => {
  const listings = db.prepare(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END), 0) AS available,
      COALESCE(SUM(CASE WHEN status = 'RESERVED' THEN 1 ELSE 0 END), 0) AS reserved,
      COALESCE(SUM(CASE WHEN status IN ('RENTED', 'BOUGHT') THEN 1 ELSE 0 END), 0) AS closed,
      COALESCE(SUM(CASE WHEN category = 'commercial' THEN 1 ELSE 0 END), 0) AS commercial,
      COALESCE(SUM(CASE WHEN category = 'residential' THEN 1 ELSE 0 END), 0) AS residential,
      COALESCE(SUM(CASE WHEN is_vip = 1 THEN 1 ELSE 0 END), 0) AS vip
    FROM properties
  `).get();

  const inquiries = db.prepare(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END), 0) AS new
    FROM inquiries
  `).get();

  const recent = db.prepare(`
    SELECT i.id, i.full_name, i.purpose, i.status, i.created_at, p.title AS property_title
    FROM inquiries i LEFT JOIN properties p ON p.id = i.property_id
    ORDER BY i.created_at DESC LIMIT 5
  `).all();

  res.json({
    listings: {
      total: listings.total,
      available: listings.available,
      reserved: listings.reserved,
      closed: listings.closed,
      commercial: listings.commercial,
      residential: listings.residential,
      vip: listings.vip,
    },
    inquiries: { total: inquiries.total, new: inquiries.new },
    recentInquiries: recent.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      purpose: row.purpose,
      status: row.status,
      propertyTitle: row.property_title,
      createdAt: row.created_at,
    })),
  });
});

export default router;
