---
read_when:
    - Menggunakan CLI ClawHub
    - Men-debug instalasi, pembaruan, atau publikasi
summary: 'Referensi CLI: perintah, flag, konfigurasi, dan perilaku lockfile.'
x-i18n:
    generated_at: "2026-07-19T04:47:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa830e77a2fe0639b113b5f3171da138189c3bdf0271f7b729ad0a84404bce72
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Paket CLI: `clawhub`, biner: `clawhub`.

Instal secara global dengan npm atau pnpm:

```bash
npm i -g clawhub
# atau
pnpm add -g clawhub
```

Kemudian verifikasi:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Flag global

- `--workdir <dir>`: direktori kerja (default: cwd; beralih ke ruang kerja Clawdbot jika dikonfigurasi)
- `--dir <dir>`: direktori instalasi di bawah direktori kerja (default: `skills`)
- `--site <url>`: URL dasar untuk login melalui browser (default: `https://clawhub.ai`)
- `--registry <url>`: URL dasar API (default: ditemukan secara otomatis, jika tidak `https://clawhub.ai`)
- `--no-input`: nonaktifkan prompt

Padanan variabel lingkungan:

- `CLAWHUB_SITE` (lama `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (lama `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (lama `CLAWDHUB_WORKDIR`)

### Proksi HTTP

CLI mengikuti variabel lingkungan proksi HTTP standar untuk sistem di belakang
proksi perusahaan atau jaringan terbatas:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Ketika salah satu variabel ini ditetapkan, CLI merutekan permintaan keluar melalui
proksi yang ditentukan. `HTTPS_PROXY` digunakan untuk permintaan HTTPS, `HTTP_PROXY`
untuk HTTP biasa. `NO_PROXY` / `no_proxy` dipatuhi untuk melewati proksi bagi
host atau domain tertentu.

Hal ini diperlukan pada sistem tempat koneksi keluar langsung diblokir
(misalnya kontainer Docker, VPS Hetzner dengan internet hanya melalui proksi, firewall
perusahaan).

Contoh:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "kueri saya"
```

Ketika tidak ada variabel proksi yang ditetapkan, perilakunya tidak berubah (koneksi langsung).

## File konfigurasi

Menyimpan token API Anda + URL registri yang di-cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` atau `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Fallback lama: jika `clawhub/config.json` belum ada tetapi `clawdhub/config.json` ada, CLI menggunakan kembali jalur lama
- penggantian: `CLAWHUB_CONFIG_PATH` (lama `CLAWDHUB_CONFIG_PATH`)

## Perintah

### `login` / `auth login`

- Default: membuka browser ke `<site>/cli/auth` dan menyelesaikan melalui callback loopback.
- Tanpa antarmuka grafis: `clawhub login --token clh_...`
- Interaktif jarak jauh/tanpa antarmuka grafis: `clawhub login --device` mencetak kode dan menunggu selama Anda mengotorisasinya di `<site>/cli/device`.

### `whoami`

- Memverifikasi token yang tersimpan melalui `/api/v1/whoami`.

### `token`

- Mencetak token API yang tersimpan ke stdout.
- Berguna untuk menyalurkan token login lokal ke perintah penyiapan rahasia CI.

### `star <skill>` / `unstar <skill>`

- Menambahkan/menghapus skill dari sorotan Anda.
- Memanggil `POST /api/v1/stars/<slug>` dan `DELETE /api/v1/stars/<slug>`.
- `--yes` melewati konfirmasi.

### `search <query...>`

- Memanggil `/api/v1/search?q=...`.
- Output mencakup slug skill, handle pemilik, nama tampilan, dan skor relevansi.
- Pencarian memprioritaskan kecocokan token slug/nama yang persis sebelum popularitas unduhan. Token slug mandiri seperti `map` lebih cocok dengan `personal-map` daripada substring di dalam `amap`.
- Popularitas hanya merupakan prioritas kecil dalam pemeringkatan, bukan jaminan penempatan teratas.
- Jika suatu skill seharusnya muncul tetapi tidak, jalankan `clawhub inspect @owner/slug` saat login untuk memeriksa diagnostik moderasi yang terlihat oleh pemilik sebelum mengganti nama metadata.

### `explore`

- Mencantumkan skill terbaru melalui `/api/v1/skills?limit=...&sort=createdAt` (diurutkan berdasarkan `createdAt` menurun).
- Flag:
  - `--limit <n>` (1-200, default: 25)
  - `--sort newest|updated|rating|downloads|trending` (default: terbaru). Alias pengurutan instalasi lama tetap berfungsi untuk kompatibilitas.
  - `--json` (output yang dapat dibaca mesin)
- Output: `<slug>  v<version>  <age>  <summary>` (ringkasan dipotong menjadi 50 karakter).

### `inspect @owner/slug`

- Mengambil metadata skill dan file versi tanpa menginstal.
- `--version <version>`: periksa versi tertentu (default: terbaru).
- `--tag <tag>`: periksa versi bertag (misalnya `latest`).
- `--versions`: cantumkan riwayat versi (halaman pertama).
- `--limit <n>`: jumlah maksimum versi yang dicantumkan (1-200).
- `--files`: cantumkan file untuk versi yang dipilih.
- `--file <path>`: ambil konten file mentah (hanya file teks; batas 200KB).
- `--json`: output yang dapat dibaca mesin.

### `install @owner/slug`

- Menentukan versi terbaru untuk pemilik dan skill yang disebutkan.
- Mengunduh zip melalui `/api/v1/download`.
- Mengekstrak ke `<workdir>/<dir>/<slug>`.
- Menolak menimpa skill yang disematkan; jalankan `clawhub unpin <skill>` terlebih dahulu.
- Menulis:
  - `<workdir>/.clawhub/lock.json` (lama `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (lama `.clawdhub`)

### `uninstall <skill>`

- Menghapus `<workdir>/<dir>/<slug>` dan menghapus entri lockfile.
- Mengirim telemetri upaya terbaik saat login agar jumlah instalasi saat ini dapat
  dinonaktifkan.
- Interaktif: meminta konfirmasi.
- Noninteraktif (`--no-input`): memerlukan `--yes`.

### `list`

- Membaca `<workdir>/.clawhub/lock.json` (lama `.clawdhub`).
- Menampilkan `pinned` di samping skill yang dibekukan dengan `clawhub pin`, termasuk alasan opsional.

### `pin <skill>`

- Menandai skill terinstal sebagai disematkan dalam lockfile.
- `--reason <text>` mencatat alasan skill dibekukan.
- Skill yang disematkan dilewati oleh `update --all` dan ditolak oleh `update <skill>` langsung.
- Skill yang disematkan juga menolak `install --force` agar byte lokal tidak dapat diganti secara tidak sengaja.

### `unpin <skill>`

- Menghapus sematan lockfile dari skill terinstal sehingga pembaruan mendatang dapat mengubahnya.

### `update [@owner/slug]` / `update --all`

- Menghitung sidik jari dari file lokal.
- Jika sidik jari cocok dengan versi yang diketahui: tanpa prompt.
- Jika sidik jari tidak cocok:
  - menolak secara default
  - menimpa dengan `--force` (atau prompt, jika interaktif)
- Skill yang disematkan tidak pernah diperbarui oleh `--force`.
- `update <skill>` langsung gagal untuk skill yang disematkan dan meminta Anda menjalankan `clawhub unpin <skill>` terlebih dahulu.
- `update --all` melewati slug yang disematkan dan mencetak ringkasan mengenai apa yang tetap dibekukan.

### `skill publish <path>`

- Membandingkan sidik jari bundel lokal dengan ClawHub dan keluar dengan sukses ketika
  konten telah dipublikasikan.
- Skill baru secara default menggunakan `1.0.0`; skill yang diubah secara default menggunakan versi patch
  berikutnya.
- `--version <version>` secara eksplisit memilih versi dan memublikasikannya meskipun
  konten cocok dengan versi yang sudah ada.
- `--dry-run` menyelesaikan publikasi tanpa mengunggah; `--json` mencetak
  hasil yang dapat dibaca mesin.
- `--owner <handle>` memublikasikan di bawah handle penerbit organisasi/pengguna ketika
  pelaku memiliki akses penerbit.
- `--migrate-owner` memindahkan skill yang sudah ada ke `--owner` saat memublikasikan versi
  baru. Memerlukan akses admin/pemilik pada kedua penerbit.
- Perilaku pemilik dan review dijelaskan dalam `docs/publishing.md`.
- Memublikasikan skill berarti skill tersebut dirilis di bawah `MIT-0` di ClawHub.
- Skill yang dipublikasikan bebas digunakan, dimodifikasi, dan didistribusikan ulang tanpa atribusi.
- ClawHub tidak mendukung skill berbayar atau harga per skill.
- Alias lama: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Alur kerja
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
ClawHub yang dapat digunakan kembali memanggil `skill publish` untuk satu `skill_path`, atau untuk setiap folder skill
langsung di bawah `root` (default: `skills`). Alur kerja ini melewati skill yang tidak berubah dan menggunakan
perilaku versi patch otomatis yang sama.

Tetapkan `dry_run: true` untuk melihat pratinjau tanpa token. Publikasi sebenarnya memerlukan
rahasia `clawhub_token`.

### `sync`

- Memindai direktori kerja saat ini, direktori skill yang dikonfigurasi, dan setiap
  folder `--root <dir>` untuk mencari folder skill lokal yang berisi `SKILL.md` atau
  `skill.md`.
- Membandingkan setiap sidik jari skill lokal dengan ClawHub dan hanya memublikasikan skill baru atau
  yang diubah.
- Skill baru dipublikasikan sebagai `1.0.0`; skill yang diubah secara default dipublikasikan menggunakan versi patch
  berikutnya. Gunakan `--bump minor|major` untuk kumpulan pembaruan yang harus bergerak dengan
  langkah semver yang lebih besar.
- `--dry-run` menampilkan rencana publikasi tanpa mengunggah; `--json` mencetak
  rencana yang dapat dibaca mesin.
- `--all` memublikasikan setiap skill baru atau yang diubah tanpa prompt. Tanpa
  `--all`, terminal interaktif memungkinkan Anda memilih skill yang akan dipublikasikan.
- `--owner <handle>` memublikasikan di bawah handle penerbit organisasi/pengguna ketika
  pelaku memiliki akses penerbit.
- `sync` hanya melakukan publikasi satu arah. Perintah ini tidak menginstal, memperbarui, mengunduh, atau
  melaporkan telemetri instalasi/unduhan.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Memerlukan `clawhub login`.
- Menjalankan ClawScan ClawHub melalui `POST /api/v1/skills/-/scan`, lalu melakukan polling hingga pemindaian mencapai status terminal.
- Pemindaian bersifat asinkron dan mungkin memerlukan waktu untuk selesai. Selama dalam antrean, spinner terminal menampilkan posisi pemindaian yang diprioritaskan saat ini dan jumlah pemindaian di depannya.
- Pemindaian yang dipublikasikan memerlukan akses kepemilikan atau pengelolaan penerbit. Moderator/admin dapat menggunakan backend yang sama melalui `clawhub-admin`.
- `--update` hanya valid dengan `--slug`; opsi ini menulis kembali hasil pemindaian terpublikasi yang berhasil ke versi yang dipilih.
- `--output <file.zip>` mengunduh arsip laporan lengkap dengan `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, dan `README.md`.
- `--json` mencetak respons polling lengkap untuk otomatisasi.
- Pemindaian jalur lokal tidak lagi didukung. Unggah versi baru, lalu gunakan `scan download` untuk mengambil hasil pemindaian yang tersimpan bagi versi yang dikirimkan tersebut.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Memerlukan `clawhub login`.
- Mengunduh ZIP laporan pemindaian tersimpan untuk versi Skills atau Plugin yang dikirimkan, termasuk versi yang diblokir atau disembunyikan oleh pemeriksaan keamanan ClawHub.
- Unduhan Skills menggunakan slug Skills dan secara default menggunakan `--kind skill`.
- Unduhan Plugin menggunakan nama paket dan memerlukan `--kind plugin`.
- `--version` diperlukan agar penulis memeriksa versi persis yang dikirimkan dan diblokir oleh ClawHub.
- `--output <file.zip>` memilih jalur tujuan.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub menyediakan alur kerja resmi yang dapat digunakan kembali di
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/aaa73625ed4100b1006653f49089f2a2d969a427/.github/workflows/skill-publish.yml)
untuk repositori Skills dan repositori katalog.

Penyiapan katalog umum:

```yaml
name: Publikasi Skills

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

- `root` secara default menggunakan `skills` untuk repositori katalog.
- Teruskan `skill_path: skills/review-helper` untuk memproses satu folder Skills.
- `owner` dipetakan ke tanda CLI `--owner`; hilangkan untuk memublikasikan sebagai pengguna yang diautentikasi.
- Publikasi Skills V1 menggunakan `clawhub_token`; publikasi tepercaya GitHub OIDC saat ini hanya untuk paket.

### `delete <skill>`

- Tanpa `--version`, hapus sementara sebuah Skills (pemilik, moderator, atau admin).
- Memanggil `DELETE /api/v1/skills/{slug}`.
- Penghapusan sementara yang dimulai pemilik mencadangkan slug selama 30 hari; perintah mencetak waktu kedaluwarsanya.
- `--version <version>` menghapus secara permanen satu versi milik sendiri yang bukan versi terbaru melalui rute khusus versi yang tertutup jika terjadi kegagalan.
  Versi yang dihapus tidak dapat dipulihkan atau dipublikasikan ulang. Publikasikan pengganti sebelum menghapus
  versi terbaru saat ini. Staf platform tidak dapat mengesampingkan kepemilikan untuk alur khusus versi ini.
- `--reason <text>` mencatat catatan moderasi pada penghapusan sementara seluruh Skills dan log audit.
- `--note <text>` adalah alias untuk `--reason`.
- `--yes` melewati konfirmasi.

### `undelete <skill>`

- Pulihkan Skills yang disembunyikan (pemilik, moderator, atau admin).
- Tidak ada pembatalan penghapusan versi; versi yang dihapus secara permanen tidak dapat dipulihkan.
- Memanggil `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` mencatat catatan moderasi pada Skills dan log audit.
- `--note <text>` adalah alias untuk `--reason`.
- `--yes` melewati konfirmasi.

### `hide <skill>`

- Sembunyikan Skills (pemilik, moderator, atau admin).
- Alias untuk `delete`.

### `unhide <skill>`

- Tampilkan kembali Skills yang disembunyikan (pemilik, moderator, atau admin).
- Alias untuk `undelete`.

### `skill rename <skill> <new-name>`

- Ganti nama Skills milik sendiri dan pertahankan slug sebelumnya sebagai alias pengalihan.
- Memanggil `POST /api/v1/skills/{slug}/rename`.
- `--yes` melewati konfirmasi.

### `skill merge <source> <target>`

- Gabungkan satu Skills milik sendiri ke dalam Skills milik sendiri lainnya.
- Slug sumber tidak lagi tercantum secara publik dan menjadi alias pengalihan ke target.
- Memanggil `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` melewati konfirmasi.

### `transfer`

- Alur kerja pengalihan kepemilikan.
- Pengalihan ke nama pengguna membuat permintaan tertunda yang harus diterima oleh penerima.
- Pengalihan ke nama organisasi/penerbit langsung diterapkan hanya jika pelaku memiliki
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
- Gunakan ini untuk Plugin dan entri keluarga paket lainnya; `search` tingkat atas tetap menjadi antarmuka pencarian Skills.
- Tanda:
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
- Gunakan ini untuk memeriksa metadata, kompatibilitas, verifikasi, sumber, serta versi/berkas Plugin.
- `--version <version>`: periksa versi tertentu (default: terbaru).
- `--tag <tag>`: periksa versi bertag (misalnya `latest`).
- `--versions`: tampilkan riwayat versi (halaman pertama).
- `--limit <n>`: jumlah maksimum versi yang ditampilkan (1-100).
- `--files`: tampilkan berkas untuk versi yang dipilih.
- `--file <path>`: ambil konten berkas mentah (hanya berkas teks; batas 200KB).
- `--json`: keluaran yang dapat dibaca mesin.

### `package download <name>`

- Menguraikan versi paket melalui
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Mengunduh artefak dari `downloadUrl` milik resolver.
- Memverifikasi SHA-256 ClawHub untuk semua artefak.
- Untuk artefak npm-pack ClawPack, juga memverifikasi integritas `sha512` npm,
  shasum npm, serta nama/versi `package.json` milik tarball.
- Versi ZIP lama diunduh melalui rute ZIP lama.
- Tanda:
  - `--version <version>`: unduh versi tertentu.
  - `--tag <tag>`: unduh versi bertag (default: `latest`).
  - `-o, --output <path>`: berkas atau direktori keluaran.
  - `--force`: timpa berkas keluaran yang sudah ada.
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Menghitung SHA-256 ClawHub, integritas `sha512` npm, dan shasum npm untuk artefak
  lokal.
- Dengan `--package`, menguraikan metadata yang diharapkan dari ClawHub dan membandingkan
  berkas lokal dengan metadata artefak yang dipublikasikan.
- Dengan tanda digest langsung, melakukan verifikasi tanpa pencarian jaringan.
- Tanda:
  - `--package <name>`: nama paket untuk menguraikan metadata artefak yang diharapkan.
  - `--version <version>` atau `--tag <tag>`: versi paket yang diharapkan.
  - `--sha256 <hex>`: SHA-256 ClawHub yang diharapkan.
  - `--npm-integrity <sri>`: integritas npm yang diharapkan.
  - `--npm-shasum <sha1>`: shasum npm yang diharapkan.
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Menjalankan Plugin Inspector bawaan CLI ClawHub terhadap folder paket Plugin
  lokal.
- Secara default menggunakan validasi luring/statis, tanpa mencari atau mengimpor checkout
  OpenClaw lokal.
- Kesalahan kompatibilitas fatal menghasilkan kode keluar bukan nol. Temuan yang hanya berupa peringatan dicetak, tetapi
  menghasilkan kode keluar nol.
- Tanda:
  - `--out <dir>`: tulis laporan Plugin Inspector ke direktori ini.
  - `--openclaw <path>`: periksa terhadap checkout OpenClaw lokal yang ditentukan secara eksplisit.
  - `--runtime`: aktifkan penangkapan runtime; mengimpor kode Plugin.
  - `--allow-execute`: izinkan penangkapan runtime dalam ruang kerja terisolasi.
  - `--no-mock-sdk`: nonaktifkan SDK OpenClaw tiruan selama penangkapan runtime.
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package validate ./example-plugin
```

Jika validasi melaporkan temuan paket, manifes, impor SDK, atau artefak, lihat
[Perbaikan validasi Plugin](/clawhub/plugin-validation-fixes), lalu jalankan kembali perintah tersebut.

### `package delete <name>`

- Tanpa `--version`, menghapus sementara sebuah paket dan semua rilis.
- `--version <version>` menghapus secara permanen satu rilis milik sendiri yang bukan versi terbaru melalui rute khusus versi yang tertutup jika terjadi kegagalan.
  Versi yang dihapus tidak dapat dipulihkan atau dipublikasikan ulang. Publikasikan pengganti sebelum menghapus
  versi terbaru saat ini. Alur khusus versi ini memerlukan pemilik paket atau admin penerbit organisasi;
  staf platform tidak dapat mengesampingkan kepemilikan paket.
- Penghapusan sementara seluruh paket memerlukan pemilik paket, pemilik/admin penerbit organisasi, moderator
  platform, atau admin platform.
- Tanda:
  - `--version <version>`: hapus secara permanen satu versi yang bukan versi terbaru.
  - `--yes`: lewati konfirmasi.
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Memulihkan paket dan rilis yang dihapus sementara.
- Tidak ada pembatalan penghapusan versi; versi yang dihapus secara permanen tidak dapat dipulihkan.
- Memerlukan pemilik paket, pemilik/admin penerbit organisasi, moderator platform,
  atau admin platform.
- Memanggil `POST /api/v1/packages/{name}/undelete`.
- Tanda:
  - `--yes`: lewati konfirmasi.
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Mentransfer paket ke penerbit lain.
- Memerlukan akses admin ke pemilik paket saat ini dan penerbit
  tujuan, kecuali dilakukan oleh admin platform.
- Nama paket berlingkup harus ditransfer ke pemilik lingkup yang sesuai.
- Memanggil `POST /api/v1/packages/{name}/transfer`.
- Flag:
  - `--to <owner>`: handle penerbit tujuan.
  - `--reason <text>`: alasan audit opsional.
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Perintah terautentikasi untuk melaporkan paket kepada moderator.
- Memanggil `POST /api/v1/packages/{name}/report`.
- Laporan berada pada tingkat paket, dapat dikaitkan secara opsional dengan suatu versi, dan dapat dilihat
  oleh moderator untuk ditinjau.
- Laporan tidak secara otomatis menyembunyikan paket atau memblokir unduhan.
- Flag:
  - `--version <version>`: versi paket opsional untuk dilampirkan pada laporan.
  - `--reason <text>`: alasan laporan yang wajib diisi.
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "muatan native mencurigakan"
```

### `package moderation-status`

- Perintah pemilik untuk memeriksa visibilitas moderasi paket.
- Memanggil `GET /api/v1/packages/{name}/moderation`.
- Menampilkan status pemindaian paket saat ini, jumlah laporan terbuka, status moderasi manual
  rilis terbaru, status pemblokiran unduhan, dan alasan moderasi.
- Flag:
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Memeriksa apakah paket siap digunakan oleh OpenClaw pada masa mendatang.
- Memanggil `GET /api/v1/packages/{name}/readiness`.
- Melaporkan penghambat untuk status resmi, ketersediaan ClawPack, digest artefak,
  asal-usul sumber, kompatibilitas OpenClaw, target host, metadata lingkungan,
  dan status pemindaian.
- Flag:
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Menampilkan status migrasi berorientasi operator untuk paket yang mungkin menggantikan
  plugin OpenClaw bawaan.
- Memanggil endpoint kesiapan terkomputasi yang sama dengan `package readiness`, tetapi menampilkan
  status yang berfokus pada migrasi, versi terbaru, status paket resmi, pemeriksaan, dan
  penghambat.
- Flag:
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Membuat penerbit organisasi yang dimiliki oleh pengguna terautentikasi.
- Handle dinormalisasi menjadi huruf kecil dan dapat diberikan dengan atau tanpa `@`.
- Penerbit organisasi yang baru dibuat tidak tepercaya/resmi secara default.
- Gagal jika handle sudah digunakan oleh penerbit, pengguna, atau rute yang dicadangkan.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Menerbitkan plugin kode atau plugin bundel melalui `POST /api/v1/packages`.
- `<source>` menerima:
  - Jalur folder lokal: `./my-plugin`
  - Tarball npm-pack ClawPack lokal: `./my-plugin-1.2.3.tgz`
  - Repo GitHub: `owner/repo` atau `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Metadata dideteksi secara otomatis dari `package.json`, `openclaw.plugin.json`, dan
  penanda bundel OpenClaw yang sebenarnya seperti `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, dan `.cursor-plugin/plugin.json`.
- Sumber `.tgz` diperlakukan sebagai ClawPack. CLI mengunggah byte npm-pack
  yang persis sama dan menggunakan konten `package/` yang diekstrak hanya untuk validasi dan
  pengisian awal metadata.
- Folder plugin kode dikemas menjadi tarball npm ClawPack sebelum diunggah agar
  instalasi OpenClaw dapat memverifikasi artefak yang persis sama. Folder plugin bundel tetap
  menggunakan jalur penerbitan berkas yang diekstrak.
- Untuk sumber GitHub, atribusi sumber diisi secara otomatis dari repo, commit yang di-resolve, ref, dan subjalur.
- Untuk folder lokal, atribusi sumber dideteksi secara otomatis dari git lokal ketika remote origin mengarah ke GitHub.
- Plugin kode eksternal harus mendeklarasikan `openclaw.compat.pluginApi` dan
  `openclaw.build.openclawVersion` secara eksplisit.
  `package.json.version` tingkat atas tidak digunakan sebagai fallback untuk validasi penerbitan.
- `--dry-run` menampilkan pratinjau payload penerbitan yang telah di-resolve tanpa mengunggah.
- `--json` menghasilkan keluaran yang dapat dibaca mesin untuk CI.
- `--owner <handle>` menerbitkan di bawah handle penerbit pengguna atau organisasi ketika pelaku memiliki akses penerbit.
- Nama paket berlingkup harus sesuai dengan pemilik yang dipilih. Lihat `docs/publishing.md`.
- Flag yang ada (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) tetap berfungsi sebagai penggantian.
- Repo GitHub privat memerlukan `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Alur lokal yang direkomendasikan

Gunakan `--dry-run` terlebih dahulu agar Anda dapat mengonfirmasi metadata paket yang telah di-resolve dan
atribusi sumber sebelum membuat rilis aktif:

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

Plugin kode eksternal memerlukan sedikit metadata OpenClaw dalam
`package.json`. Manifes minimal ini cukup untuk penerbitan yang berhasil:

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
- `openclaw.hostTargets` dan `openclaw.environment` merupakan metadata opsional.
  ClawHub dapat menampilkannya jika tersedia, tetapi keduanya tidak diwajibkan untuk penerbitan.
- `openclaw.compat.minGatewayVersion` dan
  `openclaw.build.pluginSdkVersion` merupakan tambahan opsional jika Anda ingin menerbitkan
  metadata kompatibilitas yang lebih terperinci.
- Jika Anda menggunakan rilis CLI `clawhub` yang lebih lama, lakukan upgrade sebelum menerbitkan agar
  pemeriksaan pra-penerbitan lokal dijalankan sebelum pengunggahan.
- Jika validasi melaporkan kode remediasi, lihat
  [Perbaikan validasi plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub juga menyediakan alur kerja resmi yang dapat digunakan kembali di
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/aaa73625ed4100b1006653f49089f2a2d969a427/.github/workflows/package-publish.yml)
untuk repo plugin.

Konfigurasi pemanggil umum:

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

- Alur kerja yang dapat digunakan kembali menetapkan `source` secara default ke repo pemanggil.
- Untuk monorepo, berikan `source_path` agar alur kerja menerbitkan folder
  paket plugin, misalnya `source_path: extensions/codex`.
- Sematkan alur kerja yang dapat digunakan kembali ke tag stabil atau SHA commit lengkap. Jangan jalankan penerbitan rilis dari `@main`.
- `pull_request` harus menggunakan `dry_run: true` agar CI tidak menghasilkan perubahan persisten.
- Penerbitan sebenarnya harus dibatasi pada peristiwa tepercaya seperti `workflow_dispatch` atau push tag.
- Penerbitan tepercaya tanpa rahasia hanya berfungsi pada `workflow_dispatch`; push tag tetap memerlukan `clawhub_token`.
- Pastikan `clawhub_token` tetap tersedia untuk penerbitan pertama, paket tidak tepercaya, atau penerbitan darurat.
- Alur kerja mengunggah hasil JSON sebagai artefak dan mengeksposnya sebagai keluaran alur kerja.

### `package trusted-publisher get <name>`

- Menampilkan konfigurasi penerbit tepercaya GitHub Actions untuk sebuah paket.
- Gunakan ini setelah mengatur konfigurasi untuk mengonfirmasi repositori, nama berkas alur kerja,
  dan penyematan lingkungan opsional.
- Flag:
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Melampirkan atau mengganti konfigurasi penerbit tepercaya GitHub Actions untuk
  paket yang sudah ada.
- Paket harus dibuat terlebih dahulu melalui `clawhub package publish` manual atau
  terautentikasi token seperti biasa.
- Setelah konfigurasi diatur, penerbitan GitHub Actions yang didukung pada masa mendatang dapat menggunakan
  OIDC/penerbitan tepercaya tanpa token ClawHub berumur panjang.
- `--repository <repo>` harus berupa `owner/repo`.
- `--workflow-filename <file>` harus cocok dengan nama berkas alur kerja dalam
  `.github/workflows/`.
- `--environment <name>` bersifat opsional. Jika dikonfigurasi, lingkungan GitHub Actions
  dalam klaim OIDC harus sama persis.
- ClawHub memverifikasi repositori GitHub yang dikonfigurasi saat perintah ini dijalankan.
  Repositori publik dapat diverifikasi melalui metadata GitHub publik. Repositori
  privat mengharuskan ClawHub memiliki akses GitHub ke repositori tersebut,
  misalnya melalui instalasi GitHub App ClawHub pada masa mendatang atau integrasi
  GitHub lain yang diotorisasi.
- Flag:
  - `--repository <repo>`: repositori GitHub, misalnya `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nama berkas alur kerja, misalnya `package-publish.yml`.
  - `--environment <name>`: lingkungan GitHub Actions opsional dengan kecocokan persis.
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Menghapus konfigurasi penerbit tepercaya dari sebuah paket.
- Gunakan ini sebagai rollback jika penyematan alur kerja, repositori, atau lingkungan perlu
  dinonaktifkan atau dibuat ulang.
- Penerbitan sebenarnya pada masa mendatang harus menggunakan penerbitan terautentikasi biasa hingga konfigurasi
  diatur kembali.
- Flag:
  - `--json`: keluaran yang dapat dibaca mesin.

Contoh:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetri instalasi

- Dikirim setelah `clawhub install <slug>` saat sudah masuk, kecuali
  `CLAWHUB_DISABLE_TELEMETRY=1` ditetapkan.
- Pelaporan dilakukan atas dasar upaya terbaik. Perintah instalasi tidak gagal jika telemetri
  tidak tersedia.
- Detail: `docs/telemetry.md`.
