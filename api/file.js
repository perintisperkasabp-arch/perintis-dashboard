const { requireAuth, drive, TITLE_RE } = require('./_lib');

// Sheet pertama (Dashboard) dari satu file UNIT ENTRY, diekspor sebagai CSV (base64).
module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  const id = String((req.query && req.query.id) || '');
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) return res.status(400).json({ error: 'id tidak valid' });
  try {
    const meta = JSON.parse((await drive('files/' + id, { fields: 'id,name,mimeType', supportsAllDrives: 'true' })).toString('utf8'));
    if (!TITLE_RE.test(meta.name || '')) return res.status(403).json({ error: 'File ini bukan file UNIT ENTRY' });
    const csv = await drive('files/' + id + '/export', { mimeType: 'text/csv' });
    res.setHeader('Cache-Control', 'private, max-age=120');
    res.status(200).json({ id, title: meta.name, mimeType: 'text/csv', content: csv.toString('base64') });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
