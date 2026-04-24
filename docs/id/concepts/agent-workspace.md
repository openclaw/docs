---
read_when:
    - Anda perlu menjelaskan workspace agen atau tata letak filenya
    - Anda ingin mencadangkan atau memigrasikan workspace agen
summary: 'Workspace agen: lokasi, tata letak, dan strategi cadangan'
title: Workspace agen
x-i18n:
    generated_at: "2026-04-24T09:03:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6441991b5f9f71b13b2423d3c36b688a2d7d96386381e610a525aaccd55c9bf
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Workspace adalah rumah agen. Ini adalah satu-satunya direktori kerja yang digunakan untuk
alat file dan untuk konteks workspace. Jaga tetap privat dan perlakukan sebagai memori.

Ini terpisah dari `~/.openclaw/`, yang menyimpan config, kredensial, dan
sesi.

**Penting:** workspace adalah **cwd default**, bukan sandbox keras. Alat
meresolusikan path relatif terhadap workspace, tetapi path absolut tetap dapat menjangkau
lokasi lain di host kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan
[`agents.defaults.sandbox`](/id/gateway/sandboxing) (dan/atau config sandbox per-agen).
Saat sandboxing diaktifkan dan `workspaceAccess` bukan `"rw"`, alat beroperasi
di dalam workspace sandbox di bawah `~/.openclaw/sandboxes`, bukan workspace host Anda.

## Lokasi default

- Default: `~/.openclaw/workspace`
- Jika `OPENCLAW_PROFILE` disetel dan bukan `"default"`, default menjadi
  `~/.openclaw/workspace-<profile>`.
- Override di `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure`, atau `openclaw setup` akan membuat
workspace dan melakukan seed file bootstrap jika file tersebut belum ada.
Salinan seed sandbox hanya menerima file reguler di dalam workspace; alias symlink/hardlink
yang diresolusikan ke luar workspace sumber akan diabaikan.

Jika Anda sudah mengelola file workspace sendiri, Anda dapat menonaktifkan pembuatan
file bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Folder workspace tambahan

Instalasi lama mungkin telah membuat `~/openclaw`. Menyimpan beberapa direktori workspace
dapat menyebabkan auth atau state drift yang membingungkan, karena hanya satu
workspace yang aktif pada satu waktu.

**Rekomendasi:** pertahankan satu workspace aktif. Jika Anda tidak lagi menggunakan
folder tambahan tersebut, arsipkan atau pindahkan ke Trash (misalnya `trash ~/openclaw`).
Jika Anda sengaja menyimpan beberapa workspace, pastikan
`agents.defaults.workspace` menunjuk ke yang aktif.

`openclaw doctor` memperingatkan saat mendeteksi direktori workspace tambahan.

## Peta file workspace (arti tiap file)

Ini adalah file standar yang diharapkan OpenClaw di dalam workspace:

- `AGENTS.md`
  - Instruksi operasi untuk agen dan cara agen menggunakan memori.
  - Dimuat pada awal setiap sesi.
  - Tempat yang baik untuk aturan, prioritas, dan detail "bagaimana harus berperilaku".

- `SOUL.md`
  - Persona, nada, dan batasan.
  - Dimuat setiap sesi.
  - Panduan: [SOUL.md Personality Guide](/id/concepts/soul)

- `USER.md`
  - Siapa pengguna dan bagaimana menyapa mereka.
  - Dimuat setiap sesi.

- `IDENTITY.md`
  - Nama, vibe, dan emoji agen.
  - Dibuat/diperbarui selama ritual bootstrap.

- `TOOLS.md`
  - Catatan tentang alat dan konvensi lokal Anda.
  - Tidak mengontrol ketersediaan alat; ini hanya panduan.

- `HEARTBEAT.md`
  - Daftar periksa kecil opsional untuk run Heartbeat.
  - Buat tetap singkat untuk menghindari pemborosan token.

- `BOOT.md`
  - Daftar periksa startup opsional yang dijalankan otomatis saat Gateway restart (ketika [internal hooks](/id/automation/hooks) diaktifkan).
  - Buat tetap singkat; gunakan alat pesan untuk pengiriman keluar.

- `BOOTSTRAP.md`
  - Ritual sekali jalan untuk run pertama.
  - Hanya dibuat untuk workspace yang benar-benar baru.
  - Hapus setelah ritual selesai.

- `memory/YYYY-MM-DD.md`
  - Log memori harian (satu file per hari).
  - Disarankan membaca hari ini + kemarin saat sesi dimulai.

- `MEMORY.md` (opsional)
  - Memori jangka panjang yang dikurasi.
  - Hanya dimuat di sesi utama yang privat (bukan konteks bersama/grup).

Lihat [Memory](/id/concepts/memory) untuk alur kerja dan flush memori otomatis.

- `skills/` (opsional)
  - Skills khusus workspace.
  - Lokasi skill dengan prioritas tertinggi untuk workspace tersebut.
  - Menimpa skill agen proyek, skill agen pribadi, skill terkelola, skill bawaan, dan `skills.load.extraDirs` saat nama bertabrakan.

- `canvas/` (opsional)
  - File UI canvas untuk tampilan node (misalnya `canvas/index.html`).

Jika ada file bootstrap yang hilang, OpenClaw menyuntikkan penanda "missing file" ke
sesi lalu melanjutkan. File bootstrap besar dipotong saat disuntikkan;
sesuaikan batas dengan `agents.defaults.bootstrapMaxChars` (default: 12000) dan
`agents.defaults.bootstrapTotalMaxChars` (default: 60000).
`openclaw setup` dapat membuat ulang default yang hilang tanpa menimpa
file yang sudah ada.

## Apa yang TIDAK ada di workspace

Ini berada di bawah `~/.openclaw/` dan TIDAK boleh di-commit ke repo workspace:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profil auth model: OAuth + kunci API)
- `~/.openclaw/credentials/` (state channel/provider plus data impor OAuth legacy)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrip sesi + metadata)
- `~/.openclaw/skills/` (Skills terkelola)

Jika Anda perlu memigrasikan sesi atau config, salin secara terpisah dan simpan
di luar version control.

## Cadangan Git (disarankan, privat)

Perlakukan workspace sebagai memori privat. Simpan di repo git **privat** agar
dicadangkan dan dapat dipulihkan.

Jalankan langkah-langkah ini pada mesin tempat Gateway berjalan (di sanalah
workspace berada).

### 1) Inisialisasi repo

Jika git terinstal, workspace yang benar-benar baru diinisialisasi secara otomatis. Jika
workspace ini belum berupa repo, jalankan:

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

Opsi B: CLI GitHub (`gh`)

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

## Jangan commit secret

Bahkan di repo privat, hindari menyimpan secret di workspace:

- Kunci API, token OAuth, kata sandi, atau kredensial privat.
- Apa pun di bawah `~/.openclaw/`.
- Dump mentah chat atau lampiran sensitif.

Jika Anda harus menyimpan referensi sensitif, gunakan placeholder dan simpan
secret yang sebenarnya di tempat lain (password manager, variabel environment, atau `~/.openclaw/`).

Contoh awal `.gitignore` yang disarankan:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Memindahkan workspace ke mesin baru

1. Clone repo ke path yang diinginkan (default `~/.openclaw/workspace`).
2. Setel `agents.defaults.workspace` ke path tersebut di `~/.openclaw/openclaw.json`.
3. Jalankan `openclaw setup --workspace <path>` untuk melakukan seed file yang hilang.
4. Jika Anda memerlukan sesi, salin `~/.openclaw/agents/<agentId>/sessions/` dari
   mesin lama secara terpisah.

## Catatan lanjutan

- Perutean multi-agen dapat menggunakan workspace berbeda per agen. Lihat
  [Channel routing](/id/channels/channel-routing) untuk konfigurasi perutean.
- Jika `agents.defaults.sandbox` diaktifkan, sesi non-main dapat menggunakan
  workspace sandbox per sesi di bawah `agents.defaults.sandbox.workspaceRoot`.

## Terkait

- [Standing Orders](/id/automation/standing-orders) — instruksi persisten dalam file workspace
- [Heartbeat](/id/gateway/heartbeat) — file workspace `HEARTBEAT.md`
- [Session](/id/concepts/session) — path penyimpanan sesi
- [Sandboxing](/id/gateway/sandboxing) — akses workspace di environment yang disandbox
