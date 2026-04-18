---
read_when:
    - Anda perlu menjelaskan ruang kerja agen atau tata letak filenya
    - Anda ingin mencadangkan atau memigrasikan ruang kerja agen
summary: 'Ruang kerja agen: lokasi, tata letak, dan strategi cadangan'
title: Ruang Kerja Agen
x-i18n:
    generated_at: "2026-04-18T09:05:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd2e74614d8d45df04b1bbda48e2224e778b621803d774d38e4b544195eb234e
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Ruang kerja agen

Ruang kerja adalah rumah agen. Ini adalah satu-satunya direktori kerja yang digunakan untuk
alat file dan untuk konteks ruang kerja. Jaga tetap privat dan perlakukan sebagai memori.

Ini terpisah dari `~/.openclaw/`, yang menyimpan konfigurasi, kredensial, dan
sesi.

**Penting:** ruang kerja adalah **cwd default**, bukan sandbox ketat. Alat
menyelesaikan path relatif terhadap ruang kerja, tetapi path absolut tetap dapat menjangkau
lokasi lain di host kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan
[`agents.defaults.sandbox`](/id/gateway/sandboxing) (dan/atau konfigurasi sandbox per agen).
Saat sandboxing diaktifkan dan `workspaceAccess` bukan `"rw"`, alat beroperasi
di dalam ruang kerja sandbox di bawah `~/.openclaw/sandboxes`, bukan ruang kerja host Anda.

## Lokasi default

- Default: `~/.openclaw/workspace`
- Jika `OPENCLAW_PROFILE` disetel dan bukan `"default"`, default menjadi
  `~/.openclaw/workspace-<profile>`.
- Ganti di `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure`, atau `openclaw setup` akan membuat
ruang kerja dan mengisi file bootstrap jika belum ada.
Salinan seed sandbox hanya menerima file biasa di dalam ruang kerja; alias symlink/hardlink
yang mengarah ke luar ruang kerja sumber akan diabaikan.

Jika Anda sudah mengelola file ruang kerja sendiri, Anda dapat menonaktifkan pembuatan
file bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Folder ruang kerja tambahan

Instalasi lama mungkin telah membuat `~/openclaw`. Menyimpan beberapa direktori
ruang kerja sekaligus dapat menyebabkan drift autentikasi atau status yang membingungkan,
karena hanya satu ruang kerja yang aktif pada satu waktu.

**Rekomendasi:** pertahankan satu ruang kerja aktif. Jika Anda tidak lagi menggunakan
folder tambahan, arsipkan atau pindahkan ke Trash (misalnya `trash ~/openclaw`).
Jika Anda sengaja menyimpan beberapa ruang kerja, pastikan
`agents.defaults.workspace` menunjuk ke yang aktif.

`openclaw doctor` memperingatkan saat mendeteksi direktori ruang kerja tambahan.

## Peta file ruang kerja (arti setiap file)

Berikut adalah file standar yang diharapkan OpenClaw di dalam ruang kerja:

- `AGENTS.md`
  - Instruksi operasional untuk agen dan cara agen harus menggunakan memori.
  - Dimuat pada awal setiap sesi.
  - Tempat yang baik untuk aturan, prioritas, dan detail "cara berperilaku".

- `SOUL.md`
  - Persona, nada, dan batasan.
  - Dimuat setiap sesi.
  - Panduan: [Panduan Kepribadian SOUL.md](/id/concepts/soul)

- `USER.md`
  - Siapa pengguna itu dan bagaimana menyapanya.
  - Dimuat setiap sesi.

- `IDENTITY.md`
  - Nama, vibe, dan emoji agen.
  - Dibuat/diperbarui selama ritual bootstrap.

- `TOOLS.md`
  - Catatan tentang alat dan konvensi lokal Anda.
  - Tidak mengontrol ketersediaan alat; ini hanya panduan.

- `HEARTBEAT.md`
  - Daftar periksa kecil opsional untuk menjalankan Heartbeat.
  - Buat tetap singkat agar tidak boros token.

- `BOOT.md`
  - Daftar periksa startup opsional yang dijalankan saat gateway dimulai ulang ketika internal hooks diaktifkan.
  - Buat tetap singkat; gunakan alat message untuk pengiriman keluar.

- `BOOTSTRAP.md`
  - Ritual satu kali saat pertama kali dijalankan.
  - Hanya dibuat untuk ruang kerja yang benar-benar baru.
  - Hapus setelah ritual selesai.

- `memory/YYYY-MM-DD.md`
  - Log memori harian (satu file per hari).
  - Disarankan membaca hari ini + kemarin saat memulai sesi.

- `MEMORY.md` (opsional)
  - Memori jangka panjang yang dikurasi.
  - Hanya dimuat di sesi utama yang privat (bukan konteks bersama/grup).

Lihat [Memory](/id/concepts/memory) untuk alur kerja dan flush memori otomatis.

- `skills/` (opsional)
  - Skills khusus ruang kerja.
  - Lokasi skill dengan prioritas tertinggi untuk ruang kerja tersebut.
  - Menggantikan skill agen proyek, skill agen pribadi, skill terkelola, skill bawaan, dan `skills.load.extraDirs` saat namanya bertabrakan.

- `canvas/` (opsional)
  - File UI Canvas untuk tampilan node (misalnya `canvas/index.html`).

Jika ada file bootstrap yang hilang, OpenClaw menyisipkan penanda "file hilang" ke dalam
sesi dan tetap melanjutkan. File bootstrap yang besar dipotong saat disisipkan;
sesuaikan batas dengan `agents.defaults.bootstrapMaxChars` (default: 12000) dan
`agents.defaults.bootstrapTotalMaxChars` (default: 60000).
`openclaw setup` dapat membuat ulang default yang hilang tanpa menimpa
file yang sudah ada.

## Yang TIDAK ada di ruang kerja

Berikut berada di bawah `~/.openclaw/` dan TIDAK boleh dikomit ke repo ruang kerja:

- `~/.openclaw/openclaw.json` (konfigurasi)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profil autentikasi model: OAuth + API key)
- `~/.openclaw/credentials/` (status channel/provider plus data impor OAuth lama)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrip sesi + metadata)
- `~/.openclaw/skills/` (skill terkelola)

Jika Anda perlu memigrasikan sesi atau konfigurasi, salin secara terpisah dan jauhkan
dari version control.

## Cadangan Git (disarankan, privat)

Perlakukan ruang kerja sebagai memori privat. Simpan di repo git **privat** agar
dicadangkan dan dapat dipulihkan.

Jalankan langkah-langkah ini pada mesin tempat Gateway berjalan (di situlah
ruang kerja berada).

### 1) Inisialisasi repo

Jika git terpasang, ruang kerja baru akan diinisialisasi secara otomatis. Jika
ruang kerja ini belum menjadi repo, jalankan:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Tambahkan remote privat (opsi ramah pemula)

Opsi A: UI web GitHub

1. Buat repository **privat** baru di GitHub.
2. Jangan inisialisasi dengan README (menghindari konflik merge).
3. Salin URL remote HTTPS.
4. Tambahkan remote dan push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opsi B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Opsi C: UI web GitLab

1. Buat repository **privat** baru di GitLab.
2. Jangan inisialisasi dengan README (menghindari konflik merge).
3. Salin URL remote HTTPS.
4. Tambahkan remote dan push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Pembaruan berkelanjutan

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Jangan commit rahasia

Bahkan di repo privat, hindari menyimpan rahasia di ruang kerja:

- API key, token OAuth, kata sandi, atau kredensial privat.
- Apa pun di bawah `~/.openclaw/`.
- Dump mentah chat atau lampiran sensitif.

Jika Anda harus menyimpan referensi sensitif, gunakan placeholder dan simpan
rahasia yang sebenarnya di tempat lain (pengelola kata sandi, environment variable, atau `~/.openclaw/`).

Contoh awal `.gitignore` yang disarankan:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Memindahkan ruang kerja ke mesin baru

1. Clone repo ke path yang diinginkan (default `~/.openclaw/workspace`).
2. Setel `agents.defaults.workspace` ke path tersebut di `~/.openclaw/openclaw.json`.
3. Jalankan `openclaw setup --workspace <path>` untuk mengisi file yang hilang.
4. Jika Anda memerlukan sesi, salin `~/.openclaw/agents/<agentId>/sessions/` dari
   mesin lama secara terpisah.

## Catatan lanjutan

- Routing multi-agen dapat menggunakan ruang kerja berbeda per agen. Lihat
  [Routing channel](/id/channels/channel-routing) untuk konfigurasi routing.
- Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menggunakan
  ruang kerja sandbox per sesi di bawah `agents.defaults.sandbox.workspaceRoot`.

## Terkait

- [Standing Orders](/id/automation/standing-orders) — instruksi persisten dalam file ruang kerja
- [Heartbeat](/id/gateway/heartbeat) — file ruang kerja HEARTBEAT.md
- [Session](/id/concepts/session) — path penyimpanan sesi
- [Sandboxing](/id/gateway/sandboxing) — akses ruang kerja di lingkungan tersandbox
