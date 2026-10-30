const crypto = require('crypto');
const { JWT } = require('google-auth-library');

const COOKIE = 'pp_auth';

function secret() {
  return process.env.AUTH_SECRET || process.env.DASHBOARD_PASSWORD || '';
}

function token() {
  return crypto.createHmac('sha256', secret()).update('perintis-dashboard-ok').digest('hex');
}

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  const m = raw.split(';').map((s) => s.trim()).find((s) => s.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}

function isAuthed(req) {
  if (!process.env.DASHBOARD_PASSWORD) return true; // tanpa password: terbuka
  const got = readCookie(req, COOKIE);
  if (!got) return false;
  const a = Buffer.from(got), b = Buffer.from(token());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireAuth(req, res) {
  if (isAuthed(req)) return true;
  res.status(401).json({ error: 'unauthorized' });
  return false;
}

let client = null;
function google() {
  if (client) return client;
  let email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const j = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    email = j.client_email; key = j.private_key;
  }
  if (!email || !key) throw new Error('Kredensial service account belum diisi (GOOGLE_SERVICE_ACCOUNT_JSON).');
  client = new JWT({ email, key: key.replace(/\\n/g, '\n'), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
  return client;
}

async function drive(path, params) {
  const qs = new URLSearchParams(params || {}).toString();
  const url = 'https://www.googleapis.com/drive/v3/' + path + (qs ? '?' + qs : '');
  const r = await google().request({ url, responseType: 'arraybuffer' });
  return Buffer.from(r.data);
}

async function gget(url) {
  const r = await google().request({ url });
  return r.data;
}

const TITLE_RE = /UNIT ENTRY/i;

module.exports = { COOKIE, token, requireAuth, isAuthed, drive, gget, TITLE_RE };
