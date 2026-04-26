---
read_when:
    - Mencari definisi kanal rilis publik
    - Mencari penamaan versi dan cadence
summary: Kanal rilis publik, penamaan versi, dan cadence
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-04-26T11:38:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` bila diminta secara eksplisit
- beta: tag prerelease yang dipublikasikan ke npm `beta`
- dev: head bergerak dari `main`

## Penamaan versi

- Versi rilis stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan menambahkan nol di depan bulan atau hari
- `latest` berarti rilis npm stable yang saat ini dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stable dan koreksi stable dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah divalidasi nanti
- Setiap rilis stable OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan path npm/paket terlebih dahulu, dengan
  build/sign/notarize aplikasi mac dicadangkan untuk stable kecuali diminta secara eksplisit

## Cadence rilis

- Rilis bergerak beta-first
- Stable menyusul hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari branch `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta sudah didorong atau dipublikasikan dan memerlukan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum preflight rilis agar test TypeScript tetap
  tercakup di luar gate lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum preflight rilis agar import
  cycle yang lebih luas dan pemeriksaan batas arsitektur hijau di luar gate lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar
  artefak rilis `dist/*` yang diharapkan dan bundel UI Control tersedia untuk langkah
  validasi pack
- Jalankan `pnpm qa:otel:smoke` saat memvalidasi telemetri rilis. Perintah ini menjalankan
  QA-lab melalui receiver OTLP/HTTP lokal dan memverifikasi nama span trace
  yang diekspor, atribut yang dibatasi, dan redaksi konten/pengenal tanpa
  memerlukan Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Pemeriksaan rilis sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan gate paritas mock QA Lab plus lane QA
  Matrix dan Telegram live sebelum persetujuan rilis. Lane live menggunakan
  lingkungan `qa-live-shared`; Telegram juga menggunakan lease kredensial Convex CI.
- Validasi runtime instalasi dan upgrade lintas OS dikirim dari
  workflow pemanggil privat
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  yang memanggil workflow publik reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Pemisahan ini disengaja: pertahankan path rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di
  jalurnya sendiri sehingga tidak menunda atau memblokir publish
- Pemeriksaan rilis harus dikirim dari ref workflow `main` atau dari
  ref workflow `release/YYYY.M.D` agar logika workflow dan secret tetap
  terkontrol
- Workflow itu menerima tag rilis yang sudah ada atau commit SHA branch workflow penuh
  40 karakter saat ini
- Dalam mode commit-SHA, hanya HEAD branch workflow saat ini yang diterima; gunakan
  tag rilis untuk commit rilis yang lebih lama
- Preflight validasi saja `OpenClaw NPM Release` juga menerima commit SHA branch workflow penuh
  40 karakter saat ini tanpa memerlukan tag yang sudah didorong
- Path SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publish nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; publish nyata tetap memerlukan tag rilis nyata
- Kedua workflow mempertahankan path publish dan promosi nyata pada runner yang dihosting GitHub, sementara path validasi non-mutating dapat menggunakan runner Linux Blacksmith yang lebih besar
- Workflow itu menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan kedua secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Preflight rilis npm tidak lagi menunggu jalur pemeriksaan rilis yang terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang cocok) sebelum persetujuan
- Setelah publish npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang cocok) untuk memverifikasi path instalasi registry
  yang dipublikasikan dalam temp prefix baru
- Setelah publish beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan Telegram E2E nyata
  terhadap paket npm yang dipublikasikan menggunakan pool kredensial Telegram sewaan bersama.
  One-off maintainer lokal dapat menghilangkan variabel Convex dan memberikan langsung tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*`.
- Maintainer dapat menjalankan pemeriksaan pasca-publish yang sama dari GitHub Actions melalui
  workflow manual `NPM Telegram Beta E2E`. Workflow ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Automasi rilis maintainer sekarang menggunakan preflight-then-promote:
  - publish npm nyata harus lulus `preflight_run_id` npm yang berhasil
  - publish npm nyata harus dikirim dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan eksekusi preflight yang berhasil
  - rilis npm stable default ke `beta`
  - publish npm stable dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token kini berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    demi keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara repo
    publik mempertahankan publish hanya-OIDC
  - `macOS Release` publik hanya untuk validasi
  - publish mac privat nyata harus lulus private mac
    `preflight_run_id` dan `validate_run_id` yang berhasil
  - path publish nyata mempromosikan artefak yang telah disiapkan alih-alih membangunnya
    lagi
- Untuk rilis koreksi stable seperti `YYYY.M.D-N`, verifier pasca-publish
  juga memeriksa path upgrade temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  sehingga koreksi rilis tidak dapat diam-diam membiarkan instalasi global yang lebih lama berada pada
  payload stable dasar
- Preflight rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak lagi mengirim dashboard browser kosong
- Verifikasi pasca-publish juga memeriksa bahwa instalasi registry yang dipublikasikan
  berisi dependensi runtime Plugin bawaan yang tidak kosong di bawah layout root `dist/*`.
  Rilis yang dikirim dengan payload dependensi Plugin bawaan yang hilang atau kosong
  gagal pada verifier pascapublish dan tidak dapat dipromosikan
  ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball update kandidat, sehingga installer e2e menangkap pack bloat yang tidak disengaja
  sebelum path publish rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing extension, atau
  matriks tes extension, regenerasi dan tinjau output matriks workflow `checks-node-extensions`
  milik planner dari `.github/workflows/ci.yml`
  sebelum persetujuan agar catatan rilis tidak menggambarkan layout CI yang basi
- Kesiapan rilis stable macOS juga mencakup surface updater:
  - GitHub release harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang telah dipaketkan
  - `appcast.xml` pada `main` harus menunjuk ke zip stable baru setelah publish
  - aplikasi yang dipaketkan harus mempertahankan bundle id non-debug, Sparkle feed
    URL yang tidak kosong, dan `CFBundleVersion` pada atau di atas batas build Sparkle kanonis
    untuk versi rilis tersebut

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator ini:

- `tag`: tag rilis yang wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; saat `preflight_only=true`, ini juga dapat berupa commit
  SHA branch workflow penuh 40 karakter saat ini untuk preflight validasi saja
- `preflight_only`: `true` untuk validasi/build/package saja, `false` untuk
  path publish nyata
- `preflight_run_id`: wajib pada path publish nyata agar workflow menggunakan kembali
  tarball yang disiapkan dari eksekusi preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk path publish; default ke `beta`

`OpenClaw Release Checks` menerima input yang dikendalikan operator ini:

- `ref`: tag rilis yang sudah ada atau commit SHA `main` penuh 40 karakter saat ini
  untuk divalidasi saat dikirim dari `main`; dari branch rilis, gunakan
  tag rilis yang sudah ada atau commit SHA branch rilis penuh 40 karakter saat ini

Aturan:

- Tag stable dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prerelease beta hanya dapat dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input commit SHA penuh diizinkan hanya saat
  `preflight_only=true`
- `OpenClaw Release Checks` selalu validasi saja dan juga menerima
  commit SHA branch workflow saat ini
- Mode commit-SHA pemeriksaan rilis juga memerlukan HEAD branch workflow saat ini
- Path publish nyata harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan saat preflight;
  workflow memverifikasi metadata tersebut sebelum publish dilanjutkan

## Urutan rilis npm stable

Saat membuat rilis npm stable:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan commit SHA branch workflow penuh saat ini
     untuk dry run validasi saja pada workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur beta-first normal, atau `latest` hanya
   saat Anda sengaja menginginkan publish stable langsung
3. Jalankan `OpenClaw Release Checks` secara terpisah dengan tag yang sama atau
   commit SHA branch workflow penuh saat ini ketika Anda menginginkan cakupan live prompt cache,
   paritas QA Lab, Matrix, dan Telegram
   - Ini sengaja terpisah agar cakupan live tetap tersedia tanpa
     menyatukan kembali pemeriksaan yang berjalan lama atau flaky ke workflow publish
4. Simpan `preflight_run_id` yang berhasil
5. Jalankan `OpenClaw NPM Release` lagi dengan `preflight_only=false`, `tag`
   yang sama, `npm_dist_tag` yang sama, dan `preflight_run_id` yang disimpan
6. Jika rilis mendarat di `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stable tersebut dari `beta` ke `latest`
7. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stable yang sama, gunakan workflow privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stable, atau biarkan sinkronisasi self-healing
   terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan publish hanya-OIDC.

Itu menjaga path publish langsung dan path promosi beta-first tetap
terdokumentasi dan terlihat bagi operator.

Jika maintainer harus fallback ke autentikasi npm lokal, jalankan perintah 1Password
CLI (`op`) apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op`
langsung dari shell agen utama; menyimpannya di dalam tmux membuat prompt,
alert, dan penanganan OTP dapat diamati serta mencegah alert host berulang.

## Referensi publik

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer menggunakan dokumen rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
sebagai runbook yang sebenarnya.

## Terkait

- [Release channels](/id/install/development-channels)
