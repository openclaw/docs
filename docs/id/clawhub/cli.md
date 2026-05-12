---
read_when:
    - Menggunakan CLI ClawHub
    - Men-debug instalasi, pembaruan, penerbitan, atau sinkronisasi
summary: 'Referensi CLI: perintah, flag, konfigurasi, lockfile, perilaku sinkronisasi.'
x-i18n:
    generated_at: "2026-05-12T08:44:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 541fb8367e70fab6aaa9fd622a0c2753170d7cd2afa5e4e02681d606bb45ea8c
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Paket CLI: `clawhub`, bin: `clawhub`.

Instal secara global dengan npm atau pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Lalu verifikasi:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Flag global

- `--workdir <dir>`: direktori kerja (default: cwd; fallback ke workspace Clawdbot jika dikonfigurasi)
- `--dir <dir>`: direktori instal di bawah workdir (default: `skills`)
- `--site <url>`: URL dasar untuk login browser (default: `https://clawhub.ai`)
- `--registry <url>`: URL dasar API (default: ditemukan otomatis, jika tidak `https://clawhub.ai`)
- `--no-input`: nonaktifkan prompt

Padanan env:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### Proksi HTTP

CLI mematuhi variabel lingkungan proksi HTTP standar untuk sistem di balik
proksi perusahaan atau jaringan terbatas:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Saat salah satu variabel ini diatur, CLI merutekan permintaan keluar melalui
proksi yang ditentukan. `HTTPS_PROXY` digunakan untuk permintaan HTTPS, `HTTP_PROXY`
untuk HTTP biasa. `NO_PROXY` / `no_proxy` dipatuhi untuk melewati proksi bagi
host atau domain tertentu.

Ini diperlukan pada sistem tempat koneksi keluar langsung diblokir
(misalnya kontainer Docker, VPS Hetzner dengan internet hanya melalui proksi,
firewall perusahaan).

Contoh:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Saat tidak ada variabel proksi yang diatur, perilaku tidak berubah (koneksi langsung).

## File konfigurasi

Menyimpan token API Anda + URL registry yang di-cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` atau `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Fallback legacy: jika `clawhub/config.json` belum ada tetapi `clawdhub/config.json` ada, CLI menggunakan ulang path legacy
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## Perintah

### `login` / `auth login`

- Default: membuka browser ke `<site>/cli/auth` dan menyelesaikan melalui callback loopback.
- Headless: `clawhub login --token clh_...`
- Interaktif jarak jauh/headless: `clawhub login --device` mencetak kode dan menunggu saat Anda mengotorisasinya di `<site>/cli/device`.

### `whoami`

- Memverifikasi token tersimpan melalui `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Menambahkan/menghapus skill dari sorotan Anda.
- Memanggil `POST /api/v1/stars/<slug>` dan `DELETE /api/v1/stars/<slug>`.
- `--yes` melewati konfirmasi.

### `search <query...>`

- Memanggil `/api/v1/search?q=...`.
- Pencarian memprioritaskan kecocokan token slug/nama yang persis sebelum popularitas unduhan. Token slug mandiri seperti `map` cocok dengan `personal-map` lebih kuat daripada substring di dalam `amap`.
- Unduhan adalah prior popularitas kecil, bukan jaminan posisi teratas.
- Jika sebuah skill seharusnya muncul tetapi tidak, jalankan `clawhub inspect <slug>` saat sudah login untuk memeriksa diagnostik moderasi yang terlihat oleh pemilik sebelum mengganti nama metadata.

### `explore`

- Mencantumkan skill terbaru melalui `/api/v1/skills?limit=...&sort=createdAt` (diurutkan berdasarkan `createdAt` desc).
- Flag:
  - `--limit <n>` (1-200, default: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (default: newest)
  - `--json` (output yang dapat dibaca mesin)
- Output: `<slug>  v<version>  <age>  <summary>` (ringkasan dipotong hingga 50 karakter).

### `inspect <slug>`

- Mengambil metadata skill dan file versi tanpa menginstal.
- `--version <version>`: inspeksi versi tertentu (default: terbaru).
- `--tag <tag>`: inspeksi versi bertag (misalnya `latest`).
- `--versions`: cantumkan riwayat versi (halaman pertama).
- `--limit <n>`: versi maksimum untuk dicantumkan (1-200).
- `--files`: cantumkan file untuk versi yang dipilih.
- `--file <path>`: ambil konten file mentah (hanya file teks; batas 200KB).
- `--json`: output yang dapat dibaca mesin.

### `install <slug>`

- Menyelesaikan versi terbaru melalui `/api/v1/skills/<slug>`.
- Mengunduh zip melalui `/api/v1/download`.
- Mengekstrak ke `<workdir>/<dir>/<slug>`.
- Menolak menimpa skill yang di-pin; jalankan `clawhub unpin <slug>` terlebih dahulu.
- Menulis:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <slug>`

- Menghapus `<workdir>/<dir>/<slug>` dan menghapus entri lockfile.
- Interaktif: meminta konfirmasi.
- Non-interaktif (`--no-input`): memerlukan `--yes`.

### `list`

- Membaca `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`).
- Menampilkan `pinned` di sebelah skill yang dibekukan dengan `clawhub pin`, termasuk alasan opsional.

### `pin <slug>`

- Menandai skill terpasang sebagai pinned di lockfile.
- `--reason <text>` mencatat alasan skill dibekukan.
- Skill yang pinned dilewati oleh `update --all` dan ditolak oleh `update <slug>` langsung.
- Skill yang pinned juga menolak `install --force` sehingga byte lokal tidak dapat terganti tanpa sengaja.

### `unpin <slug>`

- Menghapus pin lockfile dari skill terpasang sehingga pembaruan mendatang dapat mengubahnya.

### `update [slug]` / `update --all`

- Menghitung fingerprint dari file lokal.
- Jika fingerprint cocok dengan versi yang dikenal: tanpa prompt.
- Jika fingerprint tidak cocok:
  - menolak secara default
  - menimpa dengan `--force` (atau prompt, jika interaktif)
- Skill yang pinned tidak pernah diperbarui oleh `--force`.
- `update <slug>` gagal cepat untuk slug yang pinned dan memberi tahu Anda untuk menjalankan `clawhub unpin <slug>` terlebih dahulu.
- `update --all` melewati slug yang pinned dan mencetak ringkasan tentang apa yang tetap dibekukan.

### `skill publish <path>`

- Menerbitkan melalui `POST /api/v1/skills` (multipart).
- Memerlukan semver: `--version 1.2.3`.
- `--owner <handle>` menerbitkan di bawah handle penerbit org/pengguna saat
  aktor memiliki akses penerbit.
- `--migrate-owner` memindahkan skill yang sudah ada ke `--owner` sambil menerbitkan
  versi baru. Memerlukan akses admin/pemilik pada kedua penerbit.
- Perilaku pemilik dan peninjauan dijelaskan di `docs/publishing.md`.
- Menerbitkan skill berarti skill tersebut dirilis dengan `MIT-0` di ClawHub.
- Skill yang diterbitkan bebas digunakan, dimodifikasi, dan didistribusikan ulang tanpa atribusi.
- ClawHub tidak mendukung skill berbayar atau penetapan harga per skill.
- `--clawscan-note <text>` menambahkan catatan ClawScan. Catatan ini memberi ClawScan
  konteks untuk perilaku yang mungkin terlihat tidak biasa, seperti akses jaringan,
  akses host native, atau kredensial khusus penyedia. Catatan disimpan pada
  versi yang diterbitkan.
- Alias legacy: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Menghapus skill secara lunak (pemilik, moderator, atau admin).
- Memanggil `DELETE /api/v1/skills/{slug}`.
- Penghapusan lunak yang dimulai pemilik mencadangkan slug selama 30 hari; perintah mencetak waktu kedaluwarsanya.
- `--reason <text>` mencatat catatan moderasi pada skill dan log audit.
- `--note <text>` adalah alias untuk `--reason`.
- `--yes` melewati konfirmasi.

### `undelete <slug>`

- Memulihkan skill yang disembunyikan (pemilik, moderator, atau admin).
- Memanggil `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` mencatat catatan moderasi pada skill dan log audit.
- `--note <text>` adalah alias untuk `--reason`.
- `--yes` melewati konfirmasi.

### `hide <slug>`

- Menyembunyikan skill (pemilik, moderator, atau admin).
- Alias untuk `delete`.

### `unhide <slug>`

- Menampilkan kembali skill (pemilik, moderator, atau admin).
- Alias untuk `undelete`.

### `skill rename <slug> <new-slug>`

- Mengganti nama skill yang dimiliki dan mempertahankan slug sebelumnya sebagai alias pengalihan.
- Memanggil `POST /api/v1/skills/{slug}/rename`.
- `--yes` melewati konfirmasi.

### `skill merge <source-slug> <target-slug>`

- Menggabungkan satu skill yang dimiliki ke skill lain yang dimiliki.
- Slug sumber berhenti ditampilkan secara publik dan menjadi alias pengalihan ke target.
- Memanggil `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` melewati konfirmasi.

### `transfer`

- Alur kerja transfer kepemilikan.
- Transfer ke handle pengguna membuat permintaan tertunda yang diterima oleh penerima.
- Transfer ke handle org/penerbit langsung diterapkan hanya saat aktor memiliki
  akses admin ke pemilik saat ini dan penerbit tujuan.
- Subperintah:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpoint:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Menjelajah atau mencari katalog paket terpadu melalui `GET /api/v1/packages` dan `GET /api/v1/packages/search`.
- Gunakan ini untuk Plugin dan entri keluarga paket lainnya; `search` tingkat atas tetap menjadi permukaan pencarian skill.
- Flag:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, default: 25)
  - `--json`

Contoh:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Mengambil metadata paket tanpa memasang.
- Gunakan ini untuk metadata Plugin, kompatibilitas, verifikasi, sumber, dan pemeriksaan versi/file.
- `--version <version>`: periksa versi tertentu (default: terbaru).
- `--tag <tag>`: periksa versi bertag (mis. `latest`).
- `--versions`: cantumkan riwayat versi (halaman pertama).
- `--limit <n>`: jumlah maksimum versi untuk dicantumkan (1-100).
- `--files`: cantumkan file untuk versi yang dipilih.
- `--file <path>`: ambil konten file mentah (hanya file teks; batas 200KB).
- `--json`: output yang dapat dibaca mesin.

### `package download <name>`

- Me-resolve versi paket melalui
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Mengunduh artefak dari `downloadUrl` milik resolver.
- Memverifikasi SHA-256 ClawHub untuk semua artefak.
- Untuk artefak ClawPack npm-pack, juga memverifikasi integritas npm `sha512`,
  shasum npm, dan nama/versi `package.json` milik tarball.
- Versi ZIP legacy diunduh melalui rute ZIP legacy.
- Flag:
  - `--version <version>`: unduh versi tertentu.
  - `--tag <tag>`: unduh versi bertag (default: `latest`).
  - `-o, --output <path>`: file atau direktori output.
  - `--force`: timpa file output yang sudah ada.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Menghitung SHA-256 ClawHub, integritas npm `sha512`, dan shasum npm untuk artefak
  lokal.
- Dengan `--package`, me-resolve metadata yang diharapkan dari ClawHub dan membandingkan
  file lokal dengan metadata artefak yang diterbitkan.
- Dengan flag digest langsung, memverifikasi tanpa lookup jaringan.
- Flag:
  - `--package <name>`: nama paket untuk me-resolve metadata artefak yang diharapkan.
  - `--version <version>` atau `--tag <tag>`: versi paket yang diharapkan.
  - `--sha256 <hex>`: SHA-256 ClawHub yang diharapkan.
  - `--npm-integrity <sri>`: integritas npm yang diharapkan.
  - `--npm-shasum <sha1>`: shasum npm yang diharapkan.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Menghapus sementara sebuah paket dan semua rilisnya.
- Memerlukan pemilik paket, pemilik/admin penerbit org, moderator platform,
  atau admin platform.
- Flag:
  - `--yes`: lewati konfirmasi.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Memulihkan paket dan rilis yang dihapus sementara.
- Memerlukan pemilik paket, pemilik/admin penerbit org, moderator platform,
  atau admin platform.
- Memanggil `POST /api/v1/packages/{name}/undelete`.
- Flag:
  - `--yes`: lewati konfirmasi.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Mentransfer paket ke penerbit lain.
- Memerlukan akses admin ke pemilik paket saat ini dan penerbit tujuan,
  kecuali dilakukan oleh admin platform.
- Nama paket berscope harus ditransfer ke pemilik scope yang sesuai.
- Memanggil `POST /api/v1/packages/{name}/transfer`.
- Flag:
  - `--to <owner>`: handle penerbit tujuan.
  - `--reason <text>`: alasan audit opsional.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Perintah terautentikasi untuk melaporkan paket kepada moderator.
- Memanggil `POST /api/v1/packages/{name}/report`.
- Laporan berada pada level paket, secara opsional terkait dengan sebuah versi,
  dan menjadi terlihat oleh moderator untuk ditinjau.
- Laporan tidak otomatis menyembunyikan paket atau memblokir unduhan dengan sendirinya.
- Flag:
  - `--version <version>`: versi paket opsional untuk dilampirkan ke laporan.
  - `--reason <text>`: alasan laporan wajib.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Perintah pemilik untuk memeriksa visibilitas moderasi paket.
- Memanggil `GET /api/v1/packages/{name}/moderation`.
- Menampilkan status pemindaian paket saat ini, jumlah laporan terbuka, status
  moderasi manual rilis terbaru, status blokir unduhan, dan alasan moderasi.
- Flag:
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Memeriksa apakah sebuah paket siap untuk konsumsi OpenClaw di masa mendatang.
- Memanggil `GET /api/v1/packages/{name}/readiness`.
- Melaporkan pemblokir untuk status resmi, ketersediaan ClawPack, digest artefak,
  asal-usul sumber, kompatibilitas OpenClaw, target host, metadata lingkungan,
  dan status pemindaian.
- Flag:
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Menampilkan status migrasi berorientasi operator untuk paket yang mungkin menggantikan
  plugin OpenClaw bawaan.
- Memanggil endpoint kesiapan terhitung yang sama seperti `package readiness`, tetapi mencetak
  status berfokus migrasi, versi terbaru, status paket resmi, pemeriksaan, dan
  pemblokir.
- Flag:
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Menerbitkan plugin kode atau plugin bundle melalui `POST /api/v1/packages`.
- `<source>` menerima:
  - Jalur folder lokal: `./my-plugin`
  - Tarball npm-pack ClawPack lokal: `./my-plugin-1.2.3.tgz`
  - Repo GitHub: `owner/repo` atau `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Metadata dideteksi otomatis dari `package.json`, `openclaw.plugin.json`, dan
  penanda bundle OpenClaw nyata seperti `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, dan `.cursor-plugin/plugin.json`.
- Sumber `.tgz` diperlakukan sebagai ClawPack. CLI mengunggah byte npm-pack
  persisnya dan menggunakan konten `package/` yang diekstrak hanya untuk validasi dan
  pra-isi metadata.
- Folder plugin kode dikemas menjadi tarball npm ClawPack sebelum diunggah sehingga
  instalasi OpenClaw dapat memverifikasi artefak persisnya. Folder plugin bundle tetap
  menggunakan jalur penerbitan file terekstrak.
- Untuk sumber GitHub, atribusi sumber diisi otomatis dari repo, commit yang di-resolve, ref, dan subpath.
- Untuk folder lokal, atribusi sumber dideteksi otomatis dari git lokal ketika remote origin mengarah ke GitHub.
- Plugin kode eksternal harus mendeklarasikan `openclaw.compat.pluginApi` dan
  `openclaw.build.openclawVersion` secara eksplisit.
  `package.json.version` tingkat atas tidak digunakan sebagai fallback untuk validasi penerbitan.
- `--dry-run` menampilkan pratinjau payload penerbitan yang di-resolve tanpa mengunggah.
- `--json` menghasilkan output yang dapat dibaca mesin untuk CI.
- `--owner <handle>` menerbitkan di bawah handle penerbit pengguna atau org ketika aktor memiliki akses penerbit.
- `--clawscan-note <text>` menambahkan catatan ClawScan. Catatan ini memberi ClawScan
  konteks untuk perilaku yang mungkin terlihat tidak biasa, seperti akses jaringan,
  akses host native, atau kredensial khusus penyedia. Catatan disimpan pada
  rilis yang diterbitkan.
- Nama paket berscope harus cocok dengan pemilik yang dipilih. Lihat `docs/publishing.md`.
- Flag yang ada (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) tetap berfungsi sebagai override.
- Repo GitHub privat memerlukan `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Alur lokal yang direkomendasikan

Gunakan `--dry-run` terlebih dahulu agar Anda dapat mengonfirmasi metadata paket yang di-resolve dan
atribusi sumber sebelum membuat rilis live:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Alur folder lokal

Untuk plugin kode, penerbitan folder membangun dan mengunggah artefak ClawPack dari
folder paket:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` minimal untuk `--family code-plugin`

Plugin kode eksternal memerlukan sedikit metadata OpenClaw di
`package.json`. Manifest minimal ini cukup untuk penerbitan yang berhasil:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Kolom wajib:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Catatan:

- `package.json.version` adalah versi rilis paket Anda, tetapi tidak digunakan sebagai
  fallback untuk validasi kompatibilitas/build OpenClaw.
- `openclaw.hostTargets` dan `openclaw.environment` adalah metadata opsional.
  ClawHub dapat menampilkannya saat ada, tetapi tidak wajib untuk penerbitan.
- `openclaw.compat.minGatewayVersion` dan
  `openclaw.build.pluginSdkVersion` adalah ekstra opsional jika Anda ingin menerbitkan
  metadata kompatibilitas yang lebih terperinci.
- Jika Anda menggunakan rilis CLI `clawhub` yang lebih lama, tingkatkan sebelum menerbitkan agar
  pemeriksaan preflight lokal berjalan sebelum unggahan.

#### GitHub Actions

ClawHub juga menyediakan workflow resmi yang dapat digunakan ulang di
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)
untuk repo plugin.

Penyiapan pemanggil umum:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Catatan:

- Workflow yang dapat digunakan ulang menetapkan default `source` ke repo pemanggil.
- Untuk monorepo, teruskan `source_path` agar workflow menerbitkan folder paket
  plugin, misalnya `source_path: extensions/codex`.
- Pin workflow yang dapat digunakan ulang ke tag stabil atau SHA commit lengkap. Jangan menjalankan penerbitan rilis dari `@main`.
- `pull_request` harus menggunakan `dry_run: true` agar CI tetap tidak mencemari.
- Penerbitan nyata harus dibatasi ke event tepercaya seperti `workflow_dispatch` atau push tag.
- Penerbitan tepercaya tanpa secret hanya berfungsi pada `workflow_dispatch`; push tag tetap memerlukan `clawhub_token`.
- Pertahankan `clawhub_token` tersedia untuk penerbitan pertama, paket tidak tepercaya, atau penerbitan break-glass.
- Workflow mengunggah hasil JSON sebagai artefak dan mengeksposnya sebagai output workflow.

### `sync`

- Memindai folder skill lokal dan menerbitkan yang baru/berubah.
- Root dapat berupa folder apa pun: direktori skills atau satu folder skill dengan `SKILL.md`.
- Menambahkan otomatis root skill Clawdbot saat `~/.clawdbot/clawdbot.json` ada:
  - `agent.workspace/skills` (agen utama)
  - `routing.agents.*.workspace/skills` (per agen)
  - `~/.clawdbot/skills` (bersama)
  - `skills.load.extraDirs` (paket bersama)
- Menghormati `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` dan `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Flag:
  - `--root <dir...>` root pemindaian tambahan
  - `--all` unggah tanpa meminta konfirmasi
  - `--dry-run` tampilkan rencana saja
  - `--bump patch|minor|major` (default: patch)
  - `--changelog <text>` (non-interaktif)
  - `--tags a,b,c` (default: latest)
  - `--concurrency <n>` (default: 4)

Telemetri:

- Dikirim selama `sync` saat sudah masuk, kecuali `CLAWHUB_DISABLE_TELEMETRY=1` (`CLAWDHUB_DISABLE_TELEMETRY=1` lama).
- Detail: `docs/telemetry.md`.
