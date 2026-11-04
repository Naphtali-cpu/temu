import crypto from 'node:crypto';
import { Router } from 'express';
import { db } from '../db.js';
import { HttpError, assertValid } from '../http.js';
import { createSession, hashPassword, requireAuth, revokeSession, toPublicUser, verifyPassword } from '../auth.js';
import { isValidEmail } from '../validation.js';

const router = Router();

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

router.post('/register', (req, res) => {
  const fullName = String(req.body?.fullName || '').trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const errors = {};

  if (fullName.length < 2 || fullName.length > 120) errors.fullName = 'Please enter your full name.';
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (password.length < 8 || password.length > 200) errors.password = 'Password must be at least 8 characters.';
  if (req.body?.newsletterConsent !== true) {
    errors.newsletterConsent = 'Please accept the VIP communications consent to continue.';
  }
  assertValid(errors);

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) throw new HttpError(409, 'An account with this email already exists. Please sign in.');

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO users (id, full_name, email, password_hash, role, newsletter_consent, created_at)
    VALUES (?, ?, ?, ?, 'CLIENT', 1, ?)
  `).run(id, fullName, email, hashPassword(password), new Date().toISOString());

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const session = createSession(id);
  res.status(201).json({ token: session.token, expiresAt: session.expiresAt, user: toPublicUser(user) });
});

router.post('/login', (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  const session = createSession(user.id);
  res.json({ token: session.token, expiresAt: session.expiresAt, user: toPublicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', requireAuth, (req, res) => {
  revokeSession(req.token);
  res.status(204).end();
});

export default router;
