import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './env.js';

loadEnv();

const express = (await import('express')).default;
const { db, UPLOAD_DIR } = await import('./db.js');
const { seedDatabase } = await import('./seed.js');
const { HttpError } = await import('./http.js');

const authRouter = (await import('./routes/auth.js')).default;
const propertiesRouter = (await import('./routes/properties.js')).default;
const inquiriesRouter = (await import('./routes/inquiries.js')).default;
const uploadsRouter = (await import('./routes/uploads.js')).default;
const adminRouter = (await import('./routes/admin.js')).default;

seedDatabase();

const app = express();
app.disable('x-powered-by');

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && (allowedOrigins.includes(origin) || /^http:\/\/(\d+\.\d+\.\d+\.\d+|localhost)(:\d+)?$/.test(origin))) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.use(express.json({ limit: '12mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', index: false }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/admin', adminRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Serve the production build from the same origin when it exists. Development
// uses Vite on :5173, so this block is simply skipped until `npm run build`.
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api(?:\/|$)|uploads\/).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request is too large. Add fewer photos at a time.' });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON request body.' });
  }
  console.error('[api]', err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

const port = Number(process.env.PORT || process.env.API_PORT || 4000);
const server = app.listen(port, () => {
  console.log(`[api] Temu Estates API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    try { db.close(); } catch { /* already closed */ }
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
