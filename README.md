# Dashboard KPI Perintis Perkasa Body & Paint (Vercel)

Dashboard ini membaca sheet **Dashboard** (sheet pertama) dari setiap file Google Sheets bernama
`NN UNIT ENTRY … TAHUN` (contoh: `10 UNIT ENTRY OKTOBER 2026`). File bulan baru otomatis ikut,
dan tahun terbaru dipilih otomatis.

Datanya dibaca oleh **service account** Google (akun robot), jadi tim tidak perlu login Google.
Dashboard dikunci dengan **satu password tim**.

```
api/search.js   daftar file UNIT ENTRY yang dibagikan ke service account
api/file.js     ekspor sheet pertama satu file sebagai CSV
api/login.js    cek password tim, simpan cookie login 30 hari
api/logout.js   keluar
public/index.html  tampilan dashboard
```

---

## Langkah 1 – Buat service account di Google Cloud (±10 menit)

1. Buka https://console.cloud.google.com → login dengan **perintisperkasabp@gmail.com**.
2. Klik pilihan project di atas → **New Project** → nama: `perintis-dashboard` → **Create**.
3. Menu ☰ → **APIs & Services → Library** → cari **Google Drive API** → **Enable**.
4. Menu ☰ → **IAM & Admin → Service Accounts** → **Create service account**
   - Nama: `dashboard-reader` → **Create and continue** → lewati role → **Done**.
5. Klik service account yang baru dibuat → tab **Keys** → **Add key → Create new key → JSON** → **Create**.
   File `.json` akan terunduh. **Simpan baik-baik, jangan dibagikan dan jangan di-upload ke GitHub.**
6. Catat email service account, bentuknya seperti
   `dashboard-reader@perintis-dashboard.iam.gserviceaccount.com`.

## Langkah 2 – Bagikan folder UNIT ENTRY ke service account

1. Buka Google Drive → folder tempat file `01 UNIT ENTRY …` s/d `10 UNIT ENTRY …` disimpan.
2. Klik kanan folder → **Share** → tempel email service account → peran **Viewer** →
   hilangkan centang "Notify people" → **Share**.

File bulan baru yang dibuat di folder ini otomatis ikut terbaca.

## Langkah 3 – Upload ke GitHub

1. Buka https://github.com/new → nama repo `perintis-dashboard` → pilih **Private** → **Create repository**.
2. Klik **uploading an existing file** → seret semua isi folder ini
   (`api`, `public`, `package.json`, `README.md`, `.gitignore`, `.env.example`) → **Commit changes**.
   Jangan ikut meng-upload file JSON service account.

## Langkah 4 – Deploy di Vercel

1. Buka https://vercel.com → login dengan akun GitHub → **Add New → Project** → pilih repo
   `perintis-dashboard` → **Import**.
2. Framework Preset: **Other**. Root directory, build command dan output: biarkan default.
3. Buka **Environment Variables**, isi tiga variabel ini:

   | Name | Value |
   |---|---|
   | `DASHBOARD_PASSWORD` | password untuk tim, misalnya `BPPerintis#2026` |
   | `AUTH_SECRET` | teks acak panjang, misalnya 40 huruf/angka bebas |
   | `GOOGLE_SERVICE_ACCOUNT_JSON` | buka file JSON dari Langkah 1 dengan Notepad, salin **seluruh isinya**, tempel di sini |

4. Klik **Deploy**. Setelah selesai, Vercel memberi alamat seperti
   `https://perintis-dashboard.vercel.app`. Buka, masukkan password tim, dashboard tampil.

## Mengganti password

Vercel → Project → **Settings → Environment Variables** → ubah `DASHBOARD_PASSWORD` → **Save** →
tab **Deployments** → titik tiga di deployment terakhir → **Redeploy**.
Agar semua orang harus login ulang, ubah juga `AUTH_SECRET`.

## Jika data tidak muncul

| Pesan | Penyebab dan solusi |
|---|---|
| "Kredensial service account belum diisi" | `GOOGLE_SERVICE_ACCOUNT_JSON` belum diisi atau salah tempel. Isi ulang lalu Redeploy. |
| Dashboard kosong, tidak ada bulan | Folder belum dibagikan ke email service account (Langkah 2), atau Google Drive API belum di-Enable. |
| Satu bulan abu-abu | Sheet pertama file itu bukan sheet Dashboard, atau sheet Dashboard-nya kosong. |

## Aturan nama file

- Diawali 2 digit bulan: `01` … `12`
- Mengandung tulisan `UNIT ENTRY`
- Diakhiri tahun 4 digit, misalnya `2026`
- Sheet **Dashboard** harus menjadi sheet paling kiri (pertama)
