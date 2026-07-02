---
read_when:
    - Menggunakan CLI ClawHub
    - Men-debug instalasi, pembaruan, atau publikasi
summary: 'Referensi CLI: perintah, flag, config, dan perilaku lockfile.'
x-i18n:
    generated_at: "2026-07-02T17:46:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 57fee67174cf491721e8479a48a11b66e23260ce4899d2ee5437add05880748e
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

- `--workdir <dir>`: direktori kerja (default: cwd; fallback ke ruang kerja Clawdbot jika dikonfigurasi)
- `--dir <dir>`: direktori instalasi di bawah workdir (default: `skills`)
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

Ketika salah satu variabel ini diatur, CLI merutekan permintaan keluar melalui
proksi yang ditentukan. `HTTPS_PROXY` digunakan untuk permintaan HTTPS, `HTTP_PROXY`
untuk HTTP biasa. `NO_PROXY` / `no_proxy` dihormati untuk melewati proksi bagi
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

Jika tidak ada variabel proksi yang diatur, perilaku tidak berubah (koneksi langsung).

## File konfigurasi

Menyimpan token API Anda + URL registry yang di-cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` atau `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Fallback legacy: jika `clawhub/config.json` belum ada tetapi `clawdhub/config.json` ada, CLI menggunakan ulang path legacy tersebut
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## Perintah

### `login` / `auth login`

- Default: membuka browser ke `<site>/cli/auth` dan selesai melalui callback loopback.
- Headless: `clawhub login --token clh_...`
- Interaktif remote/headless: `clawhub login --device` mencetak kode dan menunggu saat Anda mengotorisasinya di `<site>/cli/device`.

### `whoami`

- Memverifikasi token tersimpan melalui `/api/v1/whoami`.

### `token`

- Mencetak token API tersimpan ke stdout.
- Berguna untuk menyalurkan token login lokal ke perintah penyiapan secret CI.

### `star <skill>` / `unstar <skill>`

- Menambahkan/menghapus kemampuan dari sorotan Anda.
- Memanggil `POST /api/v1/stars/<slug>` dan `DELETE /api/v1/stars/<slug>`.
- `--yes` melewati konfirmasi.

### `search <query...>`

- Memanggil `/api/v1/search?q=...`.
- Output menyertakan slug kemampuan, handle pemilik, nama tampilan, dan skor relevansi.
- Pencarian mengutamakan kecocokan token slug/nama yang persis sebelum popularitas unduhan. Token slug mandiri seperti `map` lebih kuat mencocokkan `personal-map` daripada substring di dalam `amap`.
- Popularitas adalah prior peringkat kecil, bukan jaminan posisi teratas.
- Jika suatu kemampuan seharusnya muncul tetapi tidak, jalankan `clawhub inspect @owner/slug` saat login untuk memeriksa diagnostik moderasi yang terlihat oleh pemilik sebelum mengganti nama metadata.

### `explore`

- Mencantumkan kemampuan terbaru melalui `/api/v1/skills?limit=...&sort=createdAt` (diurutkan berdasarkan `createdAt` desc).
- Flag:
  - `--limit <n>` (1-200, default: 25)
  - `--sort newest|updated|rating|downloads|trending` (default: newest). Alias pengurutan instalasi legacy masih berfungsi untuk kompatibilitas.
  - `--json` (output dapat dibaca mesin)
- Output: `<slug>  v<version>  <age>  <summary>` (ringkasan dipotong menjadi 50 karakter).

### `inspect @owner/slug`

- Mengambil metadata kemampuan dan file versi tanpa menginstal.
- `--version <version>`: periksa versi tertentu (default: terbaru).
- `--tag <tag>`: periksa versi bertag (misalnya `latest`).
- `--versions`: cantumkan riwayat versi (halaman pertama).
- `--limit <n>`: jumlah versi maksimum untuk dicantumkan (1-200).
- `--files`: cantumkan file untuk versi yang dipilih.
- `--file <path>`: ambil konten file mentah (hanya file teks; batas 200KB).
- `--json`: output dapat dibaca mesin.

### `install @owner/slug`

- Menyelesaikan versi terbaru untuk pemilik dan kemampuan bernama.
- Mengunduh zip melalui `/api/v1/download`.
- Mengekstrak ke `<workdir>/<dir>/<slug>`.
- Menolak menimpa kemampuan yang dipin; jalankan `clawhub unpin <skill>` terlebih dahulu.
- Menulis:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <skill>`

- Menghapus `<workdir>/<dir>/<slug>` dan menghapus entri lockfile.
- Mengirim telemetri best-effort saat login agar jumlah instalasi saat ini dapat
  dinonaktifkan.
- Interaktif: meminta konfirmasi.
- Non-interaktif (`--no-input`): memerlukan `--yes`.

### `list`

- Membaca `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`).
- Menampilkan `pinned` di samping kemampuan yang dibekukan dengan `clawhub pin`, termasuk alasan opsionalnya.

### `pin <skill>`

- Menandai kemampuan terinstal sebagai dipin di lockfile.
- `--reason <text>` mencatat mengapa kemampuan dibekukan.
- Kemampuan yang dipin dilewati oleh `update --all` dan ditolak oleh `update <skill>` langsung.
- Kemampuan yang dipin juga menolak `install --force` sehingga byte lokal tidak dapat diganti secara tidak sengaja.

### `unpin <skill>`

- Menghapus pin lockfile dari kemampuan terinstal agar pembaruan mendatang dapat memodifikasinya.

### `update [@owner/slug]` / `update --all`

- Menghitung fingerprint dari file lokal.
- Jika fingerprint cocok dengan versi yang diketahui: tanpa prompt.
- Jika fingerprint tidak cocok:
  - menolak secara default
  - menimpa dengan `--force` (atau prompt, jika interaktif)
- Kemampuan yang dipin tidak pernah diperbarui oleh `--force`.
- `update <skill>` gagal cepat untuk kemampuan yang dipin dan memberi tahu Anda untuk menjalankan `clawhub unpin <skill>` terlebih dahulu.
- `update --all` melewati slug yang dipin dan mencetak ringkasan tentang apa yang tetap dibekukan.

### `skill publish <path>`

- Membandingkan fingerprint bundel lokal dengan ClawHub dan keluar dengan sukses ketika
  konten sudah diterbitkan.
- Kemampuan baru default ke `1.0.0`; kemampuan yang berubah default ke versi patch
  berikutnya.
- `--version <version>` memilih versi secara eksplisit dan menerbitkan bahkan ketika
  konten cocok dengan versi yang sudah ada.
- `--dry-run` menyelesaikan publikasi tanpa mengunggah; `--json` mencetak hasil
  yang dapat dibaca mesin.
- `--owner <handle>` menerbitkan di bawah handle penerbit org/pengguna ketika
  aktor memiliki akses penerbit.
- `--migrate-owner` memindahkan kemampuan yang ada ke `--owner` sambil menerbitkan versi
  baru. Memerlukan akses admin/pemilik pada kedua penerbit.
- Perilaku pemilik dan peninjauan dijelaskan di `docs/publishing.md`.
- Menerbitkan kemampuan berarti kemampuan tersebut dirilis di bawah `MIT-0` di ClawHub.
- Kemampuan yang diterbitkan bebas digunakan, dimodifikasi, dan didistribusikan ulang tanpa atribusi.
- ClawHub tidak mendukung kemampuan berbayar atau harga per kemampuan.
- Alias legacy: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Workflow reusable ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
memanggil `skill publish` untuk satu `skill_path`, atau untuk setiap folder kemampuan langsung
di bawah `root` (default: `skills`). Workflow ini melewati kemampuan yang tidak berubah dan menggunakan
perilaku versi patch otomatis yang sama.

Atur `dry_run: true` untuk pratinjau tanpa token. Publikasi nyata memerlukan
secret `clawhub_token`.

### `sync`

- Memindai workdir saat ini, direktori kemampuan yang dikonfigurasi, dan folder
  `--root <dir>` apa pun untuk folder kemampuan lokal yang berisi `SKILL.md` atau
  `skill.md`.
- Membandingkan setiap fingerprint kemampuan lokal dengan ClawHub dan hanya menerbitkan kemampuan baru atau
  yang berubah.
- Kemampuan baru diterbitkan sebagai `1.0.0`; kemampuan yang berubah menerbitkan versi patch berikutnya
  secara default. Gunakan `--bump minor|major` untuk batch pembaruan yang harus bergerak dengan
  langkah semver lebih besar.
- `--dry-run` menampilkan rencana publikasi tanpa mengunggah; `--json` mencetak rencana
  yang dapat dibaca mesin.
- `--all` menerbitkan setiap kemampuan baru atau yang berubah tanpa prompt. Tanpa
  `--all`, terminal interaktif memungkinkan Anda memilih kemampuan untuk diterbitkan.
- `--owner <handle>` menerbitkan di bawah handle penerbit org/pengguna ketika
  aktor memiliki akses penerbit.
- `sync` hanya publikasi satu arah. Ini tidak menginstal, memperbarui, mengunduh, atau
  melaporkan telemetri instalasi/unduhan.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Memerlukan `clawhub login`.
- Menjalankan ClawHub ClawScan melalui `POST /api/v1/skills/-/scan`, lalu melakukan polling hingga pemindaian terminal.
- Pemindaian bersifat asinkron dan dapat memerlukan waktu untuk selesai. Saat masuk antrean, spinner terminal menampilkan posisi pemindaian prioritas saat ini dan berapa banyak pemindaian yang ada di depan.
- Pemindaian yang diterbitkan memerlukan kepemilikan atau akses manajemen penerbit. Moderator/admin dapat menggunakan backend yang sama melalui `clawhub-admin`.
- `--update` hanya valid dengan `--slug`; ini menulis hasil pemindaian terbitan yang berhasil kembali ke versi yang dipilih.
- `--output <file.zip>` mengunduh arsip laporan lengkap dengan `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, dan `README.md`.
- `--json` mencetak respons polling lengkap untuk otomatisasi.
- Pemindaian path lokal tidak lagi didukung. Unggah versi baru, lalu gunakan `scan download` untuk mengambil hasil pemindaian tersimpan untuk versi yang dikirimkan tersebut.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Memerlukan `clawhub login`.
- Mengunduh ZIP laporan pemindaian tersimpan untuk versi kemampuan atau plugin yang dikirimkan, termasuk versi yang diblokir atau disembunyikan oleh pemeriksaan keamanan ClawHub.
- Unduhan kemampuan menggunakan slug kemampuan dan default ke `--kind skill`.
- Unduhan plugin menggunakan nama paket dan memerlukan `--kind plugin`.
- `--version` diperlukan agar penulis memeriksa versi kiriman persis yang diblokir ClawHub.
- `--output <file.zip>` memilih path tujuan.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub mengirimkan workflow reusable resmi di
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/skill-publish.yml)
untuk repo kemampuan dan repo katalog.

Penyiapan katalog tipikal:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Catatan:

- `root` default ke `skills` untuk repo katalog.
- Berikan `skill_path: skills/review-helper` untuk memproses satu folder kemampuan.
- `owner` dipetakan ke flag CLI `--owner`; hilangkan untuk menerbitkan sebagai pengguna terautentikasi.
- Publikasi kemampuan V1 menggunakan `clawhub_token`; publikasi tepercaya GitHub OIDC hanya untuk paket untuk saat ini.

### `delete <skill>`

- Tanpa `--version`, hapus sementara sebuah skill (pemilik, moderator, atau admin).
- Memanggil `DELETE /api/v1/skills/{slug}`.
- Hapus sementara yang dimulai oleh pemilik mencadangkan slug selama 30 hari; perintah mencetak waktu kedaluwarsa.
- `--version <version>` menghapus permanen satu versi non-terbaru yang dimiliki melalui rute khusus versi
  yang fail-closed.
  Versi yang dihapus tidak dapat dipulihkan atau diterbitkan ulang. Terbitkan pengganti sebelum menghapus
  versi terbaru saat ini. Staf platform tidak melewati kepemilikan untuk alur khusus versi ini.
- `--reason <text>` mencatat catatan moderasi pada hapus sementara seluruh skill dan log audit.
- `--note <text>` adalah alias untuk `--reason`.
- `--yes` melewati konfirmasi.

### `undelete <skill>`

- Pulihkan skill yang disembunyikan (pemilik, moderator, atau admin).
- Tidak ada pemulihan versi; versi yang dihapus permanen tidak dapat dipulihkan.
- Memanggil `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` mencatat catatan moderasi pada skill dan log audit.
- `--note <text>` adalah alias untuk `--reason`.
- `--yes` melewati konfirmasi.

### `hide <skill>`

- Sembunyikan skill (pemilik, moderator, atau admin).
- Alias untuk `delete`.

### `unhide <skill>`

- Tampilkan kembali skill (pemilik, moderator, atau admin).
- Alias untuk `undelete`.

### `skill rename <skill> <new-name>`

- Ganti nama skill yang dimiliki dan pertahankan slug sebelumnya sebagai alias pengalihan.
- Memanggil `POST /api/v1/skills/{slug}/rename`.
- `--yes` melewati konfirmasi.

### `skill merge <source> <target>`

- Gabungkan satu skill yang dimiliki ke skill lain yang dimiliki.
- Slug sumber berhenti ditampilkan secara publik dan menjadi alias pengalihan ke target.
- Memanggil `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` melewati konfirmasi.

### `transfer`

- Alur kerja transfer kepemilikan.
- Transfer ke handle pengguna membuat permintaan tertunda yang diterima oleh penerima.
- Transfer ke handle organisasi/penerbit langsung diterapkan hanya ketika aktor memiliki
  akses admin ke pemilik saat ini dan penerbit tujuan.
- Subperintah:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoint:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Menjelajahi atau mencari katalog paket terpadu melalui `GET /api/v1/packages` dan `GET /api/v1/packages/search`.
- Gunakan ini untuk plugin dan entri keluarga paket lainnya; `search` tingkat atas tetap menjadi permukaan pencarian skill.
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
- Gunakan ini untuk metadata plugin, kompatibilitas, verifikasi, sumber, dan pemeriksaan versi/file.
- `--version <version>`: periksa versi tertentu (default: terbaru).
- `--tag <tag>`: periksa versi bertag (mis. `latest`).
- `--versions`: cantumkan riwayat versi (halaman pertama).
- `--limit <n>`: versi maksimum yang akan dicantumkan (1-100).
- `--files`: cantumkan file untuk versi yang dipilih.
- `--file <path>`: ambil konten file mentah (hanya file teks; batas 200KB).
- `--json`: output yang dapat dibaca mesin.

### `package download <name>`

- Menyelesaikan versi paket melalui
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Mengunduh artefak dari `downloadUrl` milik resolver.
- Memverifikasi SHA-256 ClawHub untuk semua artefak.
- Untuk artefak ClawPack npm-pack, juga memverifikasi integritas `sha512` npm,
  shasum npm, dan nama/versi `package.json` tarball.
- Versi ZIP lama diunduh melalui rute ZIP lama.
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

- Menghitung SHA-256 ClawHub, integritas `sha512` npm, dan shasum npm untuk artefak
  lokal.
- Dengan `--package`, menyelesaikan metadata yang diharapkan dari ClawHub dan membandingkan
  file lokal dengan metadata artefak yang diterbitkan.
- Dengan flag digest langsung, memverifikasi tanpa pencarian jaringan.
- Flag:
  - `--package <name>`: nama paket untuk menyelesaikan metadata artefak yang diharapkan.
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

### `package validate <source>`

- Menjalankan Plugin Inspector bawaan CLI ClawHub terhadap folder paket plugin
  lokal.
- Default ke validasi offline/statis, tanpa menemukan atau mengimpor checkout
  OpenClaw lokal.
- Kesalahan kompatibilitas keras keluar dengan non-nol. Temuan yang hanya peringatan dicetak tetapi
  keluar dengan nol.
- Flag:
  - `--out <dir>`: tulis laporan Plugin Inspector ke direktori ini.
  - `--openclaw <path>`: periksa terhadap checkout OpenClaw lokal yang eksplisit.
  - `--runtime`: aktifkan penangkapan runtime; mengimpor kode plugin.
  - `--allow-execute`: izinkan penangkapan runtime di ruang kerja terisolasi.
  - `--no-mock-sdk`: nonaktifkan SDK OpenClaw tiruan selama penangkapan runtime.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package validate ./example-plugin
```

Jika validasi melaporkan temuan paket, manifes, impor SDK, atau artefak, lihat
[Perbaikan validasi plugin](/clawhub/plugin-validation-fixes), lalu jalankan ulang perintah.

### `package delete <name>`

- Tanpa `--version`, hapus sementara sebuah paket dan semua rilis.
- `--version <version>` menghapus permanen satu rilis non-terbaru yang dimiliki melalui rute khusus versi
  yang fail-closed.
  Versi yang dihapus tidak dapat dipulihkan atau diterbitkan ulang. Terbitkan pengganti sebelum menghapus
  versi terbaru saat ini. Alur khusus versi ini memerlukan pemilik paket atau admin penerbit organisasi;
  staf platform tidak melewati kepemilikan paket.
- Hapus sementara seluruh paket memerlukan pemilik paket, pemilik/admin penerbit organisasi, moderator
  platform, atau admin platform.
- Flag:
  - `--version <version>`: hapus permanen satu versi non-terbaru.
  - `--yes`: lewati konfirmasi.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Memulihkan paket dan rilis yang dihapus sementara.
- Tidak ada pemulihan versi; versi yang dihapus permanen tidak dapat dipulihkan.
- Memerlukan pemilik paket, pemilik/admin penerbit organisasi, moderator platform,
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
- Laporan berada pada tingkat paket, dapat dikaitkan secara opsional ke versi, dan menjadi terlihat
  oleh moderator untuk ditinjau.
- Laporan tidak otomatis menyembunyikan paket atau memblokir unduhan dengan sendirinya.
- Flag:
  - `--version <version>`: versi paket opsional untuk dilampirkan ke laporan.
  - `--reason <text>`: alasan laporan yang wajib.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Perintah pemilik untuk memeriksa visibilitas moderasi paket.
- Memanggil `GET /api/v1/packages/{name}/moderation`.
- Menampilkan status pemindaian paket saat ini, jumlah laporan terbuka, status moderasi manual
  rilis terbaru, status blokir unduhan, dan alasan moderasi.
- Flag:
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Memeriksa apakah paket siap untuk konsumsi OpenClaw mendatang.
- Memanggil `GET /api/v1/packages/{name}/readiness`.
- Melaporkan pemblokir untuk status resmi, ketersediaan ClawPack, digest artefak,
  asal sumber, kompatibilitas OpenClaw, target host, metadata lingkungan,
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
  status yang berfokus pada migrasi, versi terbaru, status paket resmi, pemeriksaan, dan
  pemblokir.
- Flag:
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Membuat penerbit organisasi yang dimiliki oleh pengguna terautentikasi.
- Handle dinormalisasi ke huruf kecil dan dapat diberikan dengan atau tanpa `@`.
- Penerbit organisasi yang baru dibuat tidak tepercaya/resmi secara default.
- Gagal jika handle sudah digunakan oleh penerbit, pengguna, atau rute cadangan yang sudah ada.

```bash
clawhub publisher create opik --display-name "Opik"
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
  persisnya dan menggunakan isi `package/` yang diekstrak hanya untuk validasi dan
  pra-pengisian metadata.
- Folder plugin kode dikemas menjadi tarball npm ClawPack sebelum diunggah agar
  instalasi OpenClaw dapat memverifikasi artefak persisnya. Folder plugin bundle tetap
  menggunakan jalur publikasi file yang diekstrak.
- Untuk sumber GitHub, atribusi sumber diisi otomatis dari repo, commit yang diselesaikan, ref, dan subjalur.
- Untuk folder lokal, atribusi sumber dideteksi otomatis dari git lokal saat remote origin mengarah ke GitHub.
- Plugin kode eksternal harus mendeklarasikan `openclaw.compat.pluginApi` dan
  `openclaw.build.openclawVersion` secara eksplisit.
  `package.json.version` tingkat atas tidak digunakan sebagai fallback untuk validasi publikasi.
- `--dry-run` mempratinjau payload publikasi yang diselesaikan tanpa mengunggah.
- `--json` menghasilkan keluaran yang dapat dibaca mesin untuk CI.
- `--owner <handle>` menerbitkan di bawah handle penerbit pengguna atau organisasi saat aktor memiliki akses penerbit.
- Nama paket bercakupan harus cocok dengan pemilik yang dipilih. Lihat `docs/publishing.md`.
- Flag yang sudah ada (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) tetap berfungsi sebagai override.
- Repo GitHub privat memerlukan `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Alur lokal yang direkomendasikan

Gunakan `--dry-run` terlebih dahulu agar Anda dapat mengonfirmasi metadata paket
dan atribusi sumber yang diselesaikan sebelum membuat rilis live:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Alur folder lokal

Untuk plugin kode, publikasi folder membangun dan mengunggah artefak ClawPack dari
folder paket:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` minimal untuk `--family code-plugin`

Plugin kode eksternal memerlukan sedikit metadata OpenClaw di
`package.json`. Manifest minimal ini cukup untuk publikasi yang berhasil:

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
  ClawHub dapat menampilkannya saat ada, tetapi tidak wajib untuk publikasi.
- `openclaw.compat.minGatewayVersion` dan
  `openclaw.build.pluginSdkVersion` adalah tambahan opsional jika Anda ingin menerbitkan
  metadata kompatibilitas yang lebih terperinci.
- Jika Anda menggunakan rilis CLI `clawhub` yang lebih lama, tingkatkan sebelum menerbitkan agar
  pemeriksaan preflight lokal berjalan sebelum pengunggahan.
- Jika validasi melaporkan kode remediasi, lihat
  [Perbaikan validasi Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub juga menyediakan workflow resmi yang dapat digunakan ulang di
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/package-publish.yml)
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

- Workflow yang dapat digunakan ulang secara default menetapkan `source` ke repo pemanggil.
- Untuk monorepo, berikan `source_path` agar workflow menerbitkan folder paket
  plugin, misalnya `source_path: extensions/codex`.
- Pin workflow yang dapat digunakan ulang ke tag stabil atau SHA commit lengkap. Jangan menjalankan publikasi rilis dari `@main`.
- `pull_request` harus menggunakan `dry_run: true` agar CI tetap tidak mencemari.
- Publikasi nyata harus dibatasi pada event tepercaya seperti `workflow_dispatch` atau push tag.
- Publikasi tepercaya tanpa secret hanya berfungsi pada `workflow_dispatch`; push tag tetap memerlukan `clawhub_token`.
- Sediakan `clawhub_token` untuk publikasi pertama, paket tidak tepercaya, atau publikasi darurat.
- Workflow mengunggah hasil JSON sebagai artefak dan mengeksposnya sebagai keluaran workflow.

### `package trusted-publisher get <name>`

- Menampilkan konfigurasi penerbit tepercaya GitHub Actions untuk sebuah paket.
- Gunakan ini setelah mengatur konfigurasi untuk mengonfirmasi repository, nama file workflow,
  dan pin environment opsional.
- Flag:
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Melampirkan atau mengganti konfigurasi penerbit tepercaya GitHub Actions untuk paket
  yang sudah ada.
- Paket harus dibuat terlebih dahulu melalui `clawhub package publish` manual biasa
  atau yang diautentikasi token.
- Setelah konfigurasi diatur, publikasi GitHub Actions yang didukung berikutnya dapat menggunakan
  OIDC/publikasi tepercaya tanpa token ClawHub berumur panjang.
- `--repository <repo>` harus berupa `owner/repo`.
- `--workflow-filename <file>` harus cocok dengan nama file workflow di
  `.github/workflows/`.
- `--environment <name>` bersifat opsional. Saat dikonfigurasi, environment GitHub Actions
  dalam klaim OIDC harus cocok persis.
- ClawHub memverifikasi repository GitHub yang dikonfigurasi saat perintah ini berjalan.
  Repository publik dapat diverifikasi melalui metadata GitHub publik. Repository
  privat memerlukan ClawHub memiliki akses GitHub ke repository tersebut, misalnya
  melalui instalasi GitHub App ClawHub di masa depan atau integrasi GitHub resmi lainnya.
- Flag:
  - `--repository <repo>`: repository GitHub, misalnya `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nama file workflow, misalnya `package-publish.yml`.
  - `--environment <name>`: environment GitHub Actions opsional yang harus cocok persis.
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Menghapus konfigurasi penerbit tepercaya dari paket.
- Gunakan ini sebagai rollback jika workflow, repository, atau pin environment perlu
  dinonaktifkan atau dibuat ulang.
- Publikasi nyata berikutnya harus menggunakan publikasi terautentikasi biasa hingga konfigurasi
  diatur lagi.
- Flag:
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetri instalasi

- Dikirim setelah `clawhub install <slug>` saat sudah login, kecuali
  `CLAWHUB_DISABLE_TELEMETRY=1` diatur.
- Pelaporan bersifat upaya terbaik. Perintah instalasi tidak gagal jika telemetri
  tidak tersedia.
- Detail: `docs/telemetry.md`.
