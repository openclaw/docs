---
read_when:
    - Mencari definisi channel rilis publik
    - Mencari penamaan versi dan cadence
summary: Channel rilis publik, penamaan versi, dan cadence
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-04-24T09:25:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw memiliki tiga lane rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` saat diminta secara eksplisit
- beta: tag prerelease yang dipublikasikan ke npm `beta`
- dev: head bergerak dari `main`

## Penamaan versi

- Versi rilis stabil: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stabil: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan zero-pad bulan atau hari
- `latest` berarti rilis npm stabil yang dipromosikan saat ini
- `beta` berarti target instalasi beta saat ini
- Rilis stabil dan koreksi stabil dipublikasikan ke npm `beta` secara default; operator rilis dapat secara eksplisit menargetkan `latest`, atau mempromosikan build beta yang telah diperiksa kemudian
- Setiap rilis stabil OpenClaw mengirim paket npm dan aplikasi macOS bersama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/package terlebih dahulu, dengan build/sign/notarize aplikasi Mac disediakan untuk stabil kecuali diminta secara eksplisit

## Cadence rilis

- Rilis bergerak beta-first
- Stable mengikuti hanya setelah beta terbaru divalidasi
- Maintainer biasanya memotong rilis dari branch `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta sudah di-push atau dipublikasikan dan memerlukan perbaikan, maintainer memotong
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan hanya untuk maintainer

## Praflight rilis

- Jalankan `pnpm check:test-types` sebelum praflight rilis agar TypeScript pengujian tetap
  tercakup di luar gate lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum praflight rilis agar pemeriksaan import
  cycle dan batas arsitektur yang lebih luas tetap hijau di luar gate lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis
  `dist/*` yang diharapkan dan bundle UI Control ada untuk langkah
  validasi pack
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Pemeriksaan rilis sekarang berjalan di workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan parity gate mock QA Lab plus lane QA
  Matrix dan Telegram live sebelum persetujuan rilis. Lane live menggunakan
  environment `qa-live-shared`; Telegram juga menggunakan lease kredensial CI Convex.
- Validasi runtime instalasi dan upgrade lintas OS dikirim dari
  workflow pemanggil privat
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  yang memanggil workflow publik reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Pemisahan ini disengaja: pertahankan jalur rilis npm nyata tetap singkat,
  deterministik, dan fokus artefak, sementara pemeriksaan live yang lebih lambat tetap di
  lane sendiri sehingga tidak menghambat atau memblokir publish
- Pemeriksaan rilis harus di-dispatch dari ref workflow `main` atau dari
  ref workflow `release/YYYY.M.D` agar logika workflow dan secret tetap
  terkontrol
- Workflow itu menerima tag rilis yang sudah ada atau commit SHA branch-workflow 40 karakter penuh saat ini
- Dalam mode commit-SHA, workflow hanya menerima HEAD branch-workflow saat ini; gunakan
  tag rilis untuk commit rilis yang lebih lama
- Praflight validasi-saja `OpenClaw NPM Release` juga menerima commit SHA branch-workflow 40 karakter penuh saat ini tanpa memerlukan tag yang di-push
- Jalur SHA itu hanya untuk validasi dan tidak dapat dipromosikan menjadi publish nyata
- Dalam mode SHA workflow mensintesis `v<package.json version>` hanya untuk pemeriksaan metadata package; publish nyata tetap memerlukan tag rilis nyata
- Kedua workflow mempertahankan jalur publish dan promosi nyata pada runner yang di-host GitHub, sementara jalur validasi non-mutasi dapat menggunakan runner Linux Blacksmith yang lebih besar
- Workflow itu menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Praflight rilis npm tidak lagi menunggu lane pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang cocok) sebelum persetujuan
- Setelah publish npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang cocok) untuk memverifikasi jalur instalasi registry yang dipublikasikan di prefix temp baru
- Setelah publish beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terinstal, setup Telegram, dan Telegram E2E nyata
  terhadap paket npm yang dipublikasikan menggunakan pool kredensial Telegram bersama yang disewakan.
  One-off maintainer lokal dapat menghilangkan var Convex dan memberikan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Maintainer dapat menjalankan pemeriksaan pasca-publish yang sama dari GitHub Actions melalui workflow manual
  `NPM Telegram Beta E2E`. Workflow ini sengaja manual-only dan tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan preflight-then-promote:
  - publish npm nyata harus lolos `preflight_run_id` npm yang berhasil
  - publish npm nyata harus di-dispatch dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run preflight yang berhasil
  - rilis npm stabil default ke `beta`
  - publish npm stabil dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    untuk keamanan, karena `npm dist-tag add` masih membutuhkan `NPM_TOKEN` sementara
    repo publik mempertahankan publish hanya-OIDC
  - `macOS Release` publik hanya untuk validasi
  - jalur publish Mac privat nyata harus lolos preflight Mac privat yang berhasil
    `preflight_run_id` dan `validate_run_id`
  - jalur publish nyata mempromosikan artefak yang telah disiapkan alih-alih membangunnya lagi
- Untuk rilis koreksi stabil seperti `YYYY.M.D-N`, verifier pasca-publish
  juga memeriksa jalur upgrade prefix-temp yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  sehingga koreksi rilis tidak diam-diam meninggalkan instalasi global lama pada payload stabil dasar
- Praflight rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak lagi mengirim dasbor browser kosong
- Verifikasi pasca-publish juga memeriksa bahwa instalasi registry yang dipublikasikan
  berisi dependensi runtime Plugin bawaan yang tidak kosong di bawah tata letak root `dist/*`.
  Rilis yang dikirim dengan payload dependensi Plugin bawaan yang hilang atau kosong gagal di verifier pasca-publish dan tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball pembaruan kandidat, sehingga installer e2e menangkap pack bloat yang tidak disengaja
  sebelum jalur publish rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes timing extension, atau matriks pengujian extension, regenerasikan dan tinjau output matriks workflow `checks-node-extensions` milik perencana dari `.github/workflows/ci.yml`
  sebelum persetujuan agar catatan rilis tidak menggambarkan tata letak CI yang basi
- Kesiapan rilis macOS stabil juga mencakup permukaan updater:
  - GitHub release harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang dipaketkan
  - `appcast.xml` di `main` harus menunjuk ke zip stabil baru setelah publish
  - aplikasi yang dipaketkan harus mempertahankan bundle id non-debug, feed URL Sparkle yang tidak kosong, dan `CFBundleVersion` pada atau di atas lantai build Sparkle kanonis
    untuk versi rilis tersebut

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga dapat berupa commit SHA branch-workflow 40 karakter penuh saat ini untuk praflight validasi-saja
- `preflight_only`: `true` untuk hanya validasi/build/package, `false` untuk jalur publish nyata
- `preflight_run_id`: wajib pada jalur publish nyata agar workflow menggunakan kembali tarball yang disiapkan dari run preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publish; default ke `beta`

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: tag rilis yang ada atau commit SHA `main` 40 karakter penuh saat ini
  untuk divalidasi saat di-dispatch dari `main`; dari branch rilis, gunakan
  tag rilis yang ada atau commit SHA branch-rilis 40 karakter penuh saat ini

Aturan:

- Tag stabil dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prerelease beta hanya dapat dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input commit SHA penuh diizinkan hanya ketika
  `preflight_only=true`
- `OpenClaw Release Checks` selalu hanya-validasi dan juga menerima
  commit SHA branch-workflow saat ini
- Mode commit-SHA pemeriksaan rilis juga mewajibkan HEAD branch-workflow saat ini
- Jalur publish nyata harus menggunakan `npm_dist_tag` yang sama yang digunakan saat preflight;
  workflow memverifikasi metadata itu sebelum publish berlanjut

## Urutan rilis npm stabil

Saat memotong rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan commit SHA branch-workflow penuh saat ini
     untuk dry run validasi-saja pada workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur beta-first normal, atau `latest` hanya
   saat Anda sengaja menginginkan publish stabil langsung
3. Jalankan `OpenClaw Release Checks` secara terpisah dengan tag yang sama atau
   commit SHA branch-workflow penuh saat ini saat Anda menginginkan cache prompt live,
   parity QA Lab, serta cakupan Matrix dan Telegram
   - Ini dipisahkan dengan sengaja agar cakupan live tetap tersedia tanpa
     menghubungkan kembali pemeriksaan yang berjalan lama atau flaky ke workflow publish
4. Simpan `preflight_run_id` yang berhasil
5. Jalankan `OpenClaw NPM Release` lagi dengan `preflight_only=false`, `tag`
   yang sama, `npm_dist_tag` yang sama, dan `preflight_run_id` yang disimpan
6. Jika rilis mendarat di `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
7. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   seharusnya mengikuti build stabil yang sama segera, gunakan workflow privat yang sama untuk
   mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi self-healing terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan publish hanya-OIDC.

Ini menjaga jalur publish langsung dan jalur promosi beta-first tetap
terdokumentasi dan terlihat oleh operator.

## Referensi publik

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer menggunakan dokumentasi rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
untuk runbook yang sebenarnya.

## Terkait

- [Release channels](/id/install/development-channels)
