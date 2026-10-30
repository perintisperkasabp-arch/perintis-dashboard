const { requireAuth, gget, TITLE_RE } = require('./_lib');
const { summarizePkb, summarizeAsr } = require('./_detail');

// Komposisi unit entry satu bulan: Type Customer, Unit by Model, Unit by Insurance.
module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  const id = String((req.query && req.query.id) || '');
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) return res.status(400).json({ error: 'id tidak valid' });
  try {
    const meta = await gget('https://www.googleapis.com/drive/v3/files/' + id + '?fields=name&supportsAllDrives=true');
    if (!TITLE_RE.test(meta.name || '')) return res.status(403).json({ error: 'File ini bukan file UNIT ENTRY' });
    const ss = await gget('https://sheets.googleapis.com/v4/spreadsheets/' + id + '?fields=sheets.properties.title');
    const titles = (ss.sheets || []).map((s) => s.properties.title);
    const pkb = titles.find((t) => /^\s*PKB\b/i.test(t));
    const asr = titles.find((t) => /^\s*UE\s*ASR\b/i.test(t));
    if (!pkb) return res.status(404).json({ error: 'Sheet PKB tidak ditemukan di file ini' });
    const q = (t, r) => 'ranges=' + encodeURIComponent("'" + t.replace(/'/g, "''") + "'!" + r);
    const ranges = [q(pkb, 'A1:T2000')].concat(asr ? [q(asr, 'Y1:AC120')] : []).join('&');
    const vals = await gget('https://sheets.googleapis.com/v4/spreadsheets/' + id + '/values:batchGet?' + ranges + '&valueRenderOption=UNFORMATTED_VALUE');
    const vr = vals.valueRanges || [];
    const out = summarizePkb(vr[0] && vr[0].values);
    out.asr = asr && vr[1] ? summarizeAsr(vr[1].values) : [];
    out.sheets = { pkb, asr: asr || null };
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(out);
  } catch (e) {
    const msg = String((e && e.message) || e);
    const hint = /sheets\.googleapis|SERVICE_DISABLED|has not been used|is disabled/i.test(msg) ? 'Google Sheets API belum diaktifkan di Google Cloud project.' : msg;
    res.status(500).json({ error: hint });
  }
};
