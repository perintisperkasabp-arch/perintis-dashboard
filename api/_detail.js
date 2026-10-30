// Ringkas sheet PKB (unit masuk) dan UE ASR (target per asuransi) menjadi hitungan.
const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const up = (s) => norm(s).toUpperCase();

function findCol(header, names) {
  for (let i = 0; i < header.length; i++) {
    const h = up(header[i]);
    if (names.some((n) => h === n || h.startsWith(n))) return i;
  }
  return -1;
}

function summarizePkb(values) {
  const out = { total: 0, type: { cash: 0, twc: 0, insurance: 0, unknown: 0 }, insurance: {}, model: {}, columns: null };
  if (!values || !values.length) return out;
  let hr = values.findIndex((r) => findCol(r || [], ['CASH/ASR']) >= 0 && findCol(r || [], ['TIPE KENDARAAN']) >= 0);
  if (hr < 0) return out;
  const h = values[hr];
  const cPol = findCol(h, ['NO POLISI']), cIn = findCol(h, ['TGL MASUK']), cTy = findCol(h, ['CASH/ASR']), cMo = findCol(h, ['TIPE KENDARAAN']);
  out.columns = { polisi: cPol, masuk: cIn, jenis: cTy, model: cMo };
  for (let i = hr + 1; i < values.length; i++) {
    const r = values[i] || [];
    const pol = norm(r[cPol]);
    if (!pol || (cIn >= 0 && !norm(r[cIn]))) continue;
    out.total++;
    const t = up(r[cTy]);
    if (!t) out.type.unknown++;
    else if (t === 'NORMAL' || t === 'CASH' || t === 'UMUM') out.type.cash++;
    else if (t === 'TWC') out.type.twc++;
    else { out.type.insurance++; out.insurance[t] = (out.insurance[t] || 0) + 1; }
    const m = up(r[cMo]) || 'TIDAK DIISI';
    out.model[m] = (out.model[m] || 0) + 1;
  }
  return out;
}

function summarizeAsr(values) {
  // Kolom ASURANSI / TARGET / ACT di sheet UE ASR
  const res = [];
  if (!values || !values.length) return res;
  const hr = values.findIndex((r) => findCol(r || [], ['ASURANSI']) >= 0 && findCol(r || [], ['TARGET']) >= 0);
  if (hr < 0) return res;
  const h = values[hr];
  const cN = findCol(h, ['ASURANSI']), cT = findCol(h, ['TARGET']), cA = findCol(h, ['ACT']);
  const num = (v) => { if (typeof v === 'number') return v; const s = norm(v).replace(/\./g, '').replace(',', '.'); return s === '' || isNaN(Number(s)) ? null : Number(s); };
  for (let i = hr + 1; i < values.length; i++) {
    const r = values[i] || [];
    const name = up(r[cN]);
    if (!name || name === 'TOTAL' || name.startsWith('TOTAL')) continue;
    const t = num(r[cT]), a = num(r[cA]);
    if (t == null && a == null) continue;
    res.push({ name, target: t, act: a });
  }
  return res;
}

module.exports = { summarizePkb, summarizeAsr };
