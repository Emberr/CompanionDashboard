import fs from 'fs';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = process.env.PORT || 3000;

// Basic config via env
const AUTH_USERNAME_ENV = process.env.AUTH_USERNAME || 'admin';
const AUTH_PASSWORD_HASH_ENV = process.env.AUTH_PASSWORD_HASH || '';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-please';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

const dataDir = path.resolve('/app/data');
const dataFile = path.join(dataDir, 'store.json');
const credFile = path.join(dataDir, 'auth.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Helpers
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function loadCreds() {
  if (fs.existsSync(credFile)) {
    try {
      const raw = fs.readFileSync(credFile, 'utf-8');
      const json = JSON.parse(raw);
      if (json?.username && json?.passwordHash) {
        return { username: json.username, passwordHash: json.passwordHash, source: 'file' };
      }
    } catch {}
  }
  if (AUTH_PASSWORD_HASH_ENV) {
    return { username: AUTH_USERNAME_ENV, passwordHash: AUTH_PASSWORD_HASH_ENV, source: 'env' };
  }
  return null;
}

function signupAllowed() {
  return loadCreds() === null;
}

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/config', (_req, res) => {
  res.json({ signupAllowed: signupAllowed() });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  const creds = loadCreds();
  if (!creds) {
    return res.status(409).json({ error: 'No account configured. Sign up first.' });
  }
  if (username !== creds.username) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const ok = await bcrypt.compare(password, creds.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ sub: creds.username });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE, // set true if serving over HTTPS/CF tunnel with TLS termination
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  res.json({ ok: true });
});

app.post('/api/auth/signup', async (req, res) => {
  if (!signupAllowed()) {
    return res.status(409).json({ error: 'Signup disabled; account already exists or env credentials set.' });
  }
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Invalid input' });
  if (username.length < 3 || username.length > 50) return res.status(400).json({ error: 'Username length invalid' });
  if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const tmp = credFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify({ username, passwordHash: hash }));
    fs.renameSync(tmp, credFile);
    const token = signToken({ sub: username });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: COOKIE_SECURE,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/data', authMiddleware, (_req, res) => {
  if (!fs.existsSync(dataFile)) {
    return res.status(204).end();
  }
  try {
    const raw = fs.readFileSync(dataFile, 'utf-8');
    const json = JSON.parse(raw || '{}');
    return res.json(json);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to read data' });
  }
});

app.put('/api/data', authMiddleware, (req, res) => {
  try {
    const body = req.body;
    // Minimal shape check
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid data' });
    }
    const tmpFile = dataFile + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(body));
    fs.renameSync(tmpFile, dataFile);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to write data' });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
