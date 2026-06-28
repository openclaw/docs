---
read_when:
    - Menggunakan CLI ClawHub
    - Men-debug instalasi, pembaruan, atau publikasi
summary: 'Referensi CLI: perintah, flag, konfigurasi, dan perilaku lockfile.'
x-i18n:
    generated_at: "2026-06-28T00:10:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70aabaeae7b205e0ef30de010624e18c471baf214ff5e07ac1db8139fccb1c27
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
proksi korporat atau jaringan terbatas:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Saat salah satu variabel ini disetel, CLI merutekan permintaan keluar melalui
proksi yang ditentukan. `HTTPS_PROXY` digunakan untuk permintaan HTTPS, `HTTP_PROXY`
untuk HTTP biasa. `NO_PROXY` / `no_proxy` dipatuhi untuk melewati proksi bagi
host atau domain tertentu.

Ini diperlukan pada sistem tempat koneksi keluar langsung diblokir
(misalnya container Docker, VPS Hetzner dengan internet hanya melalui proksi, firewall
korporat).

Contoh:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Saat tidak ada variabel proksi yang disetel, perilaku tidak berubah (koneksi langsung).

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
- Interaktif remote/headless: `clawhub login --device` mencetak kode dan menunggu saat Anda mengotorisasinya di `<site>/cli/device`.

### `whoami`

- Memverifikasi token tersimpan melalui `/api/v1/whoami`.

### `token`

- Mencetak token API tersimpan ke stdout.
- Berguna untuk menyalurkan token login lokal ke perintah penyiapan secret CI.

### `star <skill>` / `unstar <skill>`

- Menambahkan/menghapus skill dari sorotan Anda.
- Memanggil `POST /api/v1/stars/<slug>` dan `DELETE /api/v1/stars/<slug>`.
- `--yes` melewati konfirmasi.

### `search <query...>`

- Memanggil `/api/v1/search?q=...`.
- Output mencakup slug skill, handle pemilik, nama tampilan, dan skor relevansi.
- Pencarian memprioritaskan kecocokan token slug/nama yang persis sebelum popularitas unduhan. Token slug mandiri seperti `map` lebih kuat mencocokkan `personal-map` daripada substring di dalam `amap`.
- Popularitas adalah prior peringkat kecil, bukan jaminan posisi teratas.
- Jika sebuah skill seharusnya muncul tetapi tidak muncul, jalankan `clawhub inspect @owner/slug` saat sudah login untuk memeriksa diagnostik moderasi yang terlihat oleh pemilik sebelum mengganti nama metadata.

### `explore`

- Mencantumkan skill terbaru melalui `/api/v1/skills?limit=...&sort=createdAt` (diurutkan menurut `createdAt` desc).
- Flag:
  - `--limit <n>` (1-200, default: 25)
  - `--sort newest|updated|rating|downloads|trending` (default: newest). Alias pengurutan instal legacy tetap berfungsi untuk kompatibilitas.
  - `--json` (output yang dapat dibaca mesin)
- Output: `<slug>  v<version>  <age>  <summary>` (ringkasan dipotong menjadi 50 karakter).

### `inspect @owner/slug`

- Mengambil metadata skill dan file versi tanpa menginstal.
- `--version <version>`: memeriksa versi tertentu (default: latest).
- `--tag <tag>`: memeriksa versi bertag (misalnya `latest`).
- `--versions`: mencantumkan riwayat versi (halaman pertama).
- `--limit <n>`: jumlah maksimum versi yang dicantumkan (1-200).
- `--files`: mencantumkan file untuk versi yang dipilih.
- `--file <path>`: mengambil konten file mentah (hanya file teks; batas 200KB).
- `--json`: output yang dapat dibaca mesin.

### `install @owner/slug`

- Menyelesaikan versi terbaru untuk pemilik dan skill bernama.
- Mengunduh zip melalui `/api/v1/download`.
- Mengekstrak ke `<workdir>/<dir>/<slug>`.
- Menolak menimpa skill yang dipin; jalankan `clawhub unpin <skill>` terlebih dahulu.
- Menulis:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <skill>`

- Menghapus `<workdir>/<dir>/<slug>` dan menghapus entri lockfile.
- Mengirim telemetri best-effort saat sudah login agar jumlah instal saat ini dapat
  dinonaktifkan.
- Interaktif: meminta konfirmasi.
- Non-interaktif (`--no-input`): memerlukan `--yes`.

### `list`

- Membaca `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`).
- Menampilkan `pinned` di samping skill yang dibekukan dengan `clawhub pin`, termasuk alasan opsional.

### `pin <skill>`

- Menandai skill terinstal sebagai dipin di lockfile.
- `--reason <text>` mencatat mengapa skill dibekukan.
- Skill yang dipin dilewati oleh `update --all` dan ditolak oleh `update <skill>` langsung.
- Skill yang dipin juga menolak `install --force` sehingga byte lokal tidak dapat terganti secara tidak sengaja.

### `unpin <skill>`

- Menghapus pin lockfile dari skill terinstal sehingga pembaruan mendatang dapat mengubahnya.

### `update [@owner/slug]` / `update --all`

- Menghitung fingerprint dari file lokal.
- Jika fingerprint cocok dengan versi yang dikenal: tidak ada prompt.
- Jika fingerprint tidak cocok:
  - menolak secara default
  - menimpa dengan `--force` (atau prompt, jika interaktif)
- Skill yang dipin tidak pernah diperbarui oleh `--force`.
- `update <skill>` gagal cepat untuk skill yang dipin dan memberi tahu Anda untuk menjalankan `clawhub unpin <skill>` terlebih dahulu.
- `update --all` melewati slug yang dipin dan mencetak ringkasan tentang apa yang tetap dibekukan.

### `skill publish <path>`

- Membandingkan fingerprint bundel lokal dengan ClawHub dan keluar dengan sukses saat
  konten sudah dipublikasikan.
- Skill baru default ke `1.0.0`; skill yang berubah default ke versi patch
  berikutnya.
- `--version <version>` memilih versi secara eksplisit dan mempublikasikan bahkan saat
  konten cocok dengan versi yang sudah ada.
- `--dry-run` menyelesaikan publikasi tanpa mengunggah; `--json` mencetak hasil
  yang dapat dibaca mesin.
- `--owner <handle>` mempublikasikan di bawah handle penerbit org/pengguna saat
  aktor memiliki akses penerbit.
- `--migrate-owner` memindahkan skill yang sudah ada ke `--owner` sambil mempublikasikan versi
  baru. Memerlukan akses admin/pemilik pada kedua penerbit.
- Perilaku pemilik dan review dijelaskan di `docs/publishing.md`.
- Mempublikasikan skill berarti skill tersebut dirilis di bawah `MIT-0` di ClawHub.
- Skill yang dipublikasikan bebas digunakan, dimodifikasi, dan didistribusikan ulang tanpa atribusi.
- ClawHub tidak mendukung skill berbayar atau harga per skill.
- Alias legacy: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Workflow reusable
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
milik ClawHub memanggil `skill publish` untuk satu `skill_path`, atau untuk setiap folder skill
langsung di bawah `root` (default: `skills`). Workflow ini melewati skill yang tidak berubah dan menggunakan
perilaku versi patch otomatis yang sama.

Setel `dry_run: true` untuk pratinjau tanpa token. Publikasi nyata memerlukan secret
`clawhub_token`.

### `sync`

- Memindai workdir saat ini, direktori skills yang dikonfigurasi, dan folder
  `--root <dir>` apa pun untuk folder skill lokal yang berisi `SKILL.md` atau
  `skill.md`.
- Membandingkan setiap fingerprint skill lokal dengan ClawHub dan hanya mempublikasikan skill baru atau
  yang berubah.
- Skill baru dipublikasikan sebagai `1.0.0`; skill yang berubah mempublikasikan versi patch berikutnya
  secara default. Gunakan `--bump minor|major` untuk batch pembaruan yang harus bergerak dengan
  langkah semver yang lebih besar.
- `--dry-run` menampilkan rencana publikasi tanpa mengunggah; `--json` mencetak rencana
  yang dapat dibaca mesin.
- `--all` mempublikasikan setiap skill baru atau yang berubah tanpa prompt. Tanpa
  `--all`, terminal interaktif memungkinkan Anda memilih skill yang akan dipublikasikan.
- `--owner <handle>` mempublikasikan di bawah handle penerbit org/pengguna saat
  aktor memiliki akses penerbit.
- `sync` hanya publikasi satu arah. Ini tidak menginstal, memperbarui, mengunduh, atau
  melaporkan telemetri instal/unduh.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Memerlukan `clawhub login`.
- Menjalankan ClawHub ClawScan melalui `POST /api/v1/skills/-/scan`, lalu melakukan polling hingga scan bersifat terminal.
- Scan bersifat asinkron dan mungkin perlu waktu untuk selesai. Saat berada dalam antrean, spinner terminal menampilkan posisi scan terprioritaskan saat ini dan berapa banyak scan yang berada di depan.
- Scan yang dipublikasikan memerlukan kepemilikan atau akses manajemen penerbit. Moderator/admin dapat menggunakan backend yang sama melalui `clawhub-admin`.
- `--update` hanya valid dengan `--slug`; ini menulis hasil scan terpublikasi yang berhasil kembali ke versi yang dipilih.
- `--output <file.zip>` mengunduh arsip laporan lengkap dengan `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, dan `README.md`.
- `--json` mencetak respons polling lengkap untuk otomasi.
- Scan path lokal tidak lagi didukung. Unggah versi baru, lalu gunakan `scan download` untuk mengambil hasil scan tersimpan bagi versi yang dikirimkan tersebut.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Memerlukan `clawhub login`.
- Mengunduh ZIP laporan scan tersimpan untuk versi skill atau plugin yang dikirimkan, termasuk versi yang diblokir atau disembunyikan oleh pemeriksaan keamanan ClawHub.
- Unduhan skill menggunakan slug skill dan default ke `--kind skill`.
- Unduhan plugin menggunakan nama paket dan memerlukan `--kind plugin`.
- `--version` diperlukan agar penulis memeriksa versi kiriman persis yang diblokir ClawHub.
- `--output <file.zip>` memilih path tujuan.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub menyediakan workflow reusable resmi di
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/skill-publish.yml)
untuk repo skill dan repo katalog.

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
- Teruskan `skill_path: skills/review-helper` untuk memproses satu folder skill.
- `owner` dipetakan ke flag CLI `--owner`; hilangkan untuk mempublikasikan sebagai pengguna yang terautentikasi.
- Publikasi skill V1 menggunakan `clawhub_token`; publikasi tepercaya GitHub OIDC saat ini hanya untuk paket.

### `delete <skill>`

- Tanpa `--version`, hapus sementara sebuah keterampilan (pemilik, moderator, atau admin).
- Memanggil `DELETE /api/v1/skills/{slug}`.
- Penghapusan sementara yang dimulai pemilik mencadangkan slug selama 30 hari; perintah mencetak waktu kedaluwarsa.
- `--version <version>` menghapus permanen satu versi milik sendiri yang bukan versi terbaru melalui rute fail-closed
  yang khusus versi.
  Versi yang dihapus tidak dapat dipulihkan atau dipublikasikan ulang. Publikasikan pengganti sebelum menghapus
  versi terbaru saat ini. Staf platform tidak melewati kepemilikan untuk alur khusus versi ini.
- `--reason <text>` mencatat catatan moderasi pada penghapusan sementara seluruh keterampilan dan log audit.
- `--note <text>` adalah alias untuk `--reason`.
- `--yes` melewati konfirmasi.

### `undelete <skill>`

- Pulihkan keterampilan tersembunyi (pemilik, moderator, atau admin).
- Tidak ada pembatalan penghapusan versi; versi yang dihapus permanen tidak dapat dipulihkan.
- Memanggil `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` mencatat catatan moderasi pada keterampilan dan log audit.
- `--note <text>` adalah alias untuk `--reason`.
- `--yes` melewati konfirmasi.

### `hide <skill>`

- Sembunyikan keterampilan (pemilik, moderator, atau admin).
- Alias untuk `delete`.

### `unhide <skill>`

- Tampilkan kembali keterampilan (pemilik, moderator, atau admin).
- Alias untuk `undelete`.

### `skill rename <skill> <new-name>`

- Ganti nama keterampilan milik sendiri dan pertahankan slug sebelumnya sebagai alias pengalihan.
- Memanggil `POST /api/v1/skills/{slug}/rename`.
- `--yes` melewati konfirmasi.

### `skill merge <source> <target>`

- Gabungkan satu keterampilan milik sendiri ke keterampilan milik sendiri lainnya.
- Slug sumber berhenti ditampilkan secara publik dan menjadi alias pengalihan ke target.
- Memanggil `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` melewati konfirmasi.

### `transfer`

- Alur kerja transfer kepemilikan.
- Transfer ke handle pengguna membuat permintaan tertunda yang diterima oleh penerima.
- Transfer ke handle org/publisher langsung diterapkan hanya ketika aktor memiliki
  akses admin ke pemilik saat ini dan publisher tujuan.
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

- Menjelajah atau mencari katalog paket terpadu melalui `GET /api/v1/packages` dan `GET /api/v1/packages/search`.
- Gunakan ini untuk plugin dan entri keluarga paket lainnya; `search` tingkat atas tetap menjadi permukaan pencarian keterampilan.
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

- Mengambil metadata paket tanpa menginstal.
- Gunakan ini untuk metadata plugin, kompatibilitas, verifikasi, sumber, dan pemeriksaan versi/berkas.
- `--version <version>`: periksa versi tertentu (default: terbaru).
- `--tag <tag>`: periksa versi bertag (mis. `latest`).
- `--versions`: tampilkan riwayat versi (halaman pertama).
- `--limit <n>`: versi maksimum untuk ditampilkan (1-100).
- `--files`: tampilkan berkas untuk versi yang dipilih.
- `--file <path>`: ambil konten berkas mentah (hanya berkas teks; batas 200KB).
- `--json`: output yang dapat dibaca mesin.

### `package download <name>`

- Menyelesaikan versi paket melalui
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Mengunduh artefak dari `downloadUrl` resolver.
- Memverifikasi SHA-256 ClawHub untuk semua artefak.
- Untuk artefak ClawPack npm-pack, juga memverifikasi integritas npm `sha512`,
  shasum npm, dan nama/versi `package.json` tarball.
- Versi ZIP lama diunduh melalui rute ZIP lama.
- Flag:
  - `--version <version>`: unduh versi tertentu.
  - `--tag <tag>`: unduh versi bertag (default: `latest`).
  - `-o, --output <path>`: berkas atau direktori output.
  - `--force`: timpa berkas output yang sudah ada.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Menghitung SHA-256 ClawHub, integritas npm `sha512`, dan shasum npm untuk
  artefak lokal.
- Dengan `--package`, menyelesaikan metadata yang diharapkan dari ClawHub dan membandingkan
  berkas lokal dengan metadata artefak yang dipublikasikan.
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
- Defaultnya adalah validasi offline/statis, tanpa menemukan atau mengimpor checkout
  OpenClaw lokal.
- Error kompatibilitas keras keluar dengan nilai non-nol. Temuan peringatan saja dicetak tetapi
  keluar dengan nilai nol.
- Flag:
  - `--out <dir>`: tulis laporan Plugin Inspector ke direktori ini.
  - `--openclaw <path>`: periksa terhadap checkout OpenClaw lokal yang eksplisit.
  - `--runtime`: aktifkan penangkapan runtime; mengimpor kode plugin.
  - `--allow-execute`: izinkan penangkapan runtime di workspace terisolasi.
  - `--no-mock-sdk`: nonaktifkan SDK OpenClaw tiruan selama penangkapan runtime.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package validate ./example-plugin
```

Jika validasi melaporkan temuan paket, manifes, impor SDK, atau artefak, lihat
[Perbaikan validasi plugin](/id/clawhub/plugin-validation-fixes), lalu jalankan ulang perintah.

### `package delete <name>`

- Tanpa `--version`, menghapus sementara paket dan semua rilis.
- `--version <version>` menghapus permanen satu rilis milik sendiri yang bukan terbaru melalui rute fail-closed
  yang khusus versi.
  Versi yang dihapus tidak dapat dipulihkan atau dipublikasikan ulang. Publikasikan pengganti sebelum menghapus
  versi terbaru saat ini. Alur khusus versi ini memerlukan pemilik paket atau admin org publisher;
  staf platform tidak melewati kepemilikan paket.
- Penghapusan sementara seluruh paket memerlukan pemilik paket, owner/admin org publisher, moderator platform,
  atau admin platform.
- Flag:
  - `--version <version>`: hapus permanen satu versi yang bukan terbaru.
  - `--yes`: lewati konfirmasi.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Memulihkan paket dan rilis yang dihapus sementara.
- Tidak ada pembatalan penghapusan versi; versi yang dihapus permanen tidak dapat dipulihkan.
- Memerlukan pemilik paket, owner/admin org publisher, moderator platform,
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

- Mentransfer paket ke publisher lain.
- Memerlukan akses admin ke pemilik paket saat ini dan publisher tujuan,
  kecuali dilakukan oleh admin platform.
- Nama paket bercakupan harus ditransfer ke pemilik cakupan yang sesuai.
- Memanggil `POST /api/v1/packages/{name}/transfer`.
- Flag:
  - `--to <owner>`: handle publisher tujuan.
  - `--reason <text>`: alasan audit opsional.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Perintah terautentikasi untuk melaporkan paket kepada moderator.
- Memanggil `POST /api/v1/packages/{name}/report`.
- Laporan berada pada tingkat paket, secara opsional terkait dengan versi, dan menjadi terlihat
  oleh moderator untuk ditinjau.
- Laporan tidak secara otomatis menyembunyikan paket atau memblokir unduhan.
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

- Memeriksa apakah paket siap untuk konsumsi OpenClaw di masa mendatang.
- Memanggil `GET /api/v1/packages/{name}/readiness`.
- Melaporkan penghambat untuk status resmi, ketersediaan ClawPack, digest artefak,
  asal-usul sumber, kompatibilitas OpenClaw, target host, metadata lingkungan,
  dan status pemindaian.
- Flag:
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Menampilkan status migrasi berorientasi operator untuk paket yang dapat menggantikan
  plugin OpenClaw bawaan.
- Memanggil endpoint kesiapan terhitung yang sama seperti `package readiness`, tetapi mencetak
  status yang berfokus pada migrasi, versi terbaru, status paket resmi, pemeriksaan, dan
  penghambat.
- Flag:
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Membuat org publisher yang dimiliki oleh pengguna terautentikasi.
- Handle dinormalisasi menjadi huruf kecil dan dapat diberikan dengan atau tanpa `@`.
- Org publisher yang baru dibuat tidak dipercaya/resmi secara default.
- Gagal jika handle sudah digunakan oleh publisher, pengguna, atau rute cadangan yang sudah ada.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Menerbitkan Plugin kode atau Plugin bundel melalui `POST /api/v1/packages`.
- `<source>` menerima:
  - Path folder lokal: `./my-plugin`
  - Tarball npm-pack ClawPack lokal: `./my-plugin-1.2.3.tgz`
  - Repo GitHub: `owner/repo` atau `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Metadata dideteksi otomatis dari `package.json`, `openclaw.plugin.json`, dan
  penanda bundel OpenClaw nyata seperti `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, dan `.cursor-plugin/plugin.json`.
- Sumber `.tgz` diperlakukan sebagai ClawPack. CLI mengunggah byte npm-pack
  yang persis dan menggunakan isi `package/` yang diekstrak hanya untuk validasi dan
  pengisian awal metadata.
- Folder Plugin kode dikemas menjadi tarball npm ClawPack sebelum diunggah sehingga
  instalasi OpenClaw dapat memverifikasi artefak yang persis. Folder Plugin bundel tetap
  menggunakan jalur penerbitan file terekstrak.
- Untuk sumber GitHub, atribusi sumber diisi otomatis dari repo, commit yang di-resolve, ref, dan subpath.
- Untuk folder lokal, atribusi sumber dideteksi otomatis dari git lokal ketika remote origin mengarah ke GitHub.
- Plugin kode eksternal harus mendeklarasikan `openclaw.compat.pluginApi` dan
  `openclaw.build.openclawVersion` secara eksplisit.
  `package.json.version` tingkat atas tidak digunakan sebagai fallback untuk validasi penerbitan.
- `--dry-run` menampilkan pratinjau payload penerbitan yang di-resolve tanpa mengunggah.
- `--json` menghasilkan output yang dapat dibaca mesin untuk CI.
- `--owner <handle>` menerbitkan di bawah handle penerbit pengguna atau organisasi ketika aktor memiliki akses penerbit.
- Nama paket berscope harus cocok dengan owner yang dipilih. Lihat `docs/publishing.md`.
- Flag yang sudah ada (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) tetap berfungsi sebagai override.
- Repo GitHub privat memerlukan `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
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

Untuk Plugin kode, penerbitan folder membuat dan mengunggah artefak ClawPack dari
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
  `openclaw.build.pluginSdkVersion` adalah tambahan opsional jika Anda ingin menerbitkan
  metadata kompatibilitas yang lebih terperinci.
- Jika Anda menggunakan rilis CLI `clawhub` yang lebih lama, tingkatkan sebelum menerbitkan agar
  pemeriksaan preflight lokal berjalan sebelum unggahan.
- Jika validasi melaporkan kode remediasi, lihat
  [Perbaikan validasi Plugin](/id/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub juga menyertakan workflow reusable resmi di
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/package-publish.yml)
untuk repo Plugin.

Setup pemanggil umum:

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

- Workflow reusable secara default mengatur `source` ke repo pemanggil.
- Untuk monorepo, berikan `source_path` agar workflow menerbitkan
  folder paket Plugin, misalnya `source_path: extensions/codex`.
- Pin workflow reusable ke tag stabil atau SHA commit penuh. Jangan menjalankan penerbitan rilis dari `@main`.
- `pull_request` harus menggunakan `dry_run: true` agar CI tetap tidak mencemari.
- Penerbitan nyata harus dibatasi pada event tepercaya seperti `workflow_dispatch` atau push tag.
- Penerbitan tepercaya tanpa rahasia hanya berfungsi pada `workflow_dispatch`; push tag tetap memerlukan `clawhub_token`.
- Tetap sediakan `clawhub_token` untuk penerbitan pertama, paket tidak tepercaya, atau penerbitan break-glass.
- Workflow mengunggah hasil JSON sebagai artefak dan mengeksposnya sebagai output workflow.

### `package trusted-publisher get <name>`

- Menampilkan konfigurasi penerbit tepercaya GitHub Actions untuk sebuah paket.
- Gunakan ini setelah mengatur konfigurasi untuk mengonfirmasi repositori, nama file workflow,
  dan pin environment opsional.
- Flag:
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Melampirkan atau mengganti konfigurasi penerbit tepercaya GitHub Actions untuk
  paket yang sudah ada.
- Paket harus dibuat terlebih dahulu melalui `clawhub package publish` normal yang manual atau
  diautentikasi token.
- Setelah konfigurasi diatur, penerbitan GitHub Actions yang didukung di masa mendatang dapat menggunakan
  OIDC/penerbitan tepercaya tanpa token ClawHub berumur panjang.
- `--repository <repo>` harus berupa `owner/repo`.
- `--workflow-filename <file>` harus cocok dengan nama file workflow di
  `.github/workflows/`.
- `--environment <name>` bersifat opsional. Saat dikonfigurasi, environment GitHub Actions
  dalam klaim OIDC harus cocok persis.
- ClawHub memverifikasi repositori GitHub yang dikonfigurasi saat perintah ini berjalan.
  Repositori publik dapat diverifikasi melalui metadata GitHub publik. Repositori
  privat memerlukan ClawHub memiliki akses GitHub ke repositori tersebut, misalnya
  melalui instalasi GitHub App ClawHub di masa mendatang atau integrasi GitHub resmi lainnya.
- Flag:
  - `--repository <repo>`: repositori GitHub, misalnya `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nama file workflow, misalnya `package-publish.yml`.
  - `--environment <name>`: environment GitHub Actions pencocokan persis opsional.
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Menghapus konfigurasi penerbit tepercaya dari sebuah paket.
- Gunakan ini sebagai rollback jika workflow, repositori, atau pin environment perlu
  dinonaktifkan atau dibuat ulang.
- Penerbitan nyata di masa mendatang harus menggunakan penerbitan terautentikasi normal sampai konfigurasi
  diatur lagi.
- Flag:
  - `--json`: output yang dapat dibaca mesin.

Contoh:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetri instalasi

- Dikirim setelah `clawhub install <slug>` saat login, kecuali
  `CLAWHUB_DISABLE_TELEMETRY=1` diatur.
- Pelaporan bersifat upaya terbaik. Perintah instalasi tidak gagal jika telemetri
  tidak tersedia.
- Detail: `docs/telemetry.md`.
