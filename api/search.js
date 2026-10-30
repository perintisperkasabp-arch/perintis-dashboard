const { requireAuth, drive, TITLE_RE } = require('./_lib');

// Daftar file "NN UNIT ENTRY … TAHUN" yang dibagikan ke service account.
module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const files = [];
    let pageToken;
    for (let i = 0; i < 10; i++) {
      const params = {
        q: "name contains 'UNIT ENTRY' and trashed = false",
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
        pageSize: '200',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      };
      if (pageToken) params.pageToken = pageToken;
      const j = JSON.parse((await drive('files', params)).toString('utf8'));
      (j.files || []).forEach((f) => { if (TITLE_RE.test(f.name)) files.push({ id: f.id, title: f.name, mimeType: f.mimeType, modifiedTime: f.modifiedTime }); });
      pageToken = j.nextPageToken;
      if (!pageToken) break;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ files });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
