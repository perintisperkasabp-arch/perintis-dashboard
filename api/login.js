const crypto = require('crypto');
const { COOKIE, token } = require('./_lib');

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body) return resolve(typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body);
    let s = '';
    req.on('data', (c) => { s += c; });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch (e) { resolve({}); } });
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST saja' });
  const pass = process.env.DASHBOARD_PASSWORD || '';
  const body = await readBody(req);
  const given = String(body.password || '');
  const ok = pass && given.length === pass.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(pass));
  if (!ok) { await new Promise((r) => setTimeout(r, 600)); return res.status(401).json({ error: 'Password salah' }); }
  res.setHeader('Set-Cookie', `${COOKIE}=${token()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`);
  res.status(200).json({ ok: true });
};
