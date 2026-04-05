---
read_when:
    - Mencari definisi kanal rilis publik
    - Mencari penamaan versi dan frekuensi rilis
summary: Kanal rilis publik, penamaan versi, dan frekuensi rilis
title: Kebijakan Rilis
x-i18n:
    generated_at: "2026-04-05T14:05:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb52a13264c802395aa55404c6baeec5c7b2a6820562e7a684057e70cc85668f
    source_path: reference/RELEASING.md
    workflow: 15
---

# Kebijakan Rilis

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` jika diminta secara eksplisit
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: head `main` yang terus bergerak

## Penamaan versi

- Versi rilis stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prarilis beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan tambahkan nol di depan bulan atau hari
- `latest` berarti rilis npm stable yang saat ini dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stable dan rilis koreksi stable dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang sudah divalidasi nanti
- Setiap rilis OpenClaw mengirimkan paket npm dan aplikasi macOS secara bersamaan

## Frekuensi rilis

- Rilis bergerak beta-first
- Stable hanya menyusul setelah beta terbaru divalidasi
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Pemeriksaan awal rilis

- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar
  artefak rilis `dist/*` yang diharapkan dan bundle UI Control tersedia untuk langkah
  validasi pack
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Pemeriksaan awal npm untuk branch main juga menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  sebelum membuat paket tarball, dengan menggunakan kedua secret workflow
  `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah publish npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi
  registry yang sudah dipublikasikan dalam prefix temp yang baru
- Otomatisasi rilis maintainer sekarang menggunakan preflight-then-promote:
  - publish npm nyata harus lolos dengan `preflight_run_id` npm yang berhasil
  - rilis npm stable secara default menuju `beta`
  - publish npm stable dapat menargetkan `latest` secara eksplisit melalui input workflow
  - promosi npm stable dari `beta` ke `latest` masih tersedia sebagai mode manual eksplisit pada workflow tepercaya `OpenClaw NPM Release`
  - mode promosi tersebut tetap memerlukan `NPM_TOKEN` yang valid di environment `npm-release` karena pengelolaan npm `dist-tag` terpisah dari trusted publishing
  - `macOS Release` publik hanya untuk validasi
  - publish mac privat nyata harus lolos dengan `preflight_run_id` mac privat
    dan `validate_run_id` yang berhasil
  - jalur publish nyata mempromosikan artefak yang sudah disiapkan alih-alih membangunnya
    kembali
- Untuk rilis koreksi stable seperti `YYYY.M.D-N`, verifier pascapublish
  juga memeriksa jalur upgrade prefix temp yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  agar koreksi rilis tidak diam-diam meninggalkan instalasi global lama pada
  payload stable dasar
- Pemeriksaan awal rilis npm gagal tertutup kecuali tarball menyertakan kedua
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak mengirim dashboard browser kosong lagi
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing extension, atau fast
  test matrix, buat ulang dan tinjau output matriks workflow
  `checks-fast-extensions` milik planner dari `.github/workflows/ci.yml`
  sebelum persetujuan agar catatan rilis tidak menjelaskan tata letak CI yang usang
- Kesiapan rilis stable macOS juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang sudah dipaketkan
  - `appcast.xml` di `main` harus menunjuk ke zip stable baru setelah publish
  - aplikasi yang sudah dipaketkan harus mempertahankan bundle id non-debug, Sparkle feed
    URL yang tidak kosong, dan `CFBundleVersion` pada atau di atas lantai build Sparkle kanonis
    untuk versi rilis tersebut

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`
- `preflight_only`: `true` hanya untuk validasi/build/package, `false` untuk
  jalur publish nyata
- `preflight_run_id`: wajib pada jalur publish nyata agar workflow menggunakan kembali
  tarball yang sudah disiapkan dari preflight run yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publish; default-nya `beta`
- `promote_beta_to_latest`: `true` untuk melewati publish dan memindahkan build
  stable `beta` yang sudah dipublikasikan ke `latest`

Aturan:

- Tag stable dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prarilis beta hanya boleh dipublikasikan ke `beta`
- Jalur publish nyata harus menggunakan `npm_dist_tag` yang sama seperti saat preflight;
  workflow memverifikasi metadata itu sebelum publish dilanjutkan
- Mode promosi harus menggunakan tag stable atau koreksi, `preflight_only=false`,
  `preflight_run_id` kosong, dan `npm_dist_tag=beta`
- Mode promosi juga memerlukan `NPM_TOKEN` yang valid di environment `npm-release`
  karena `npm dist-tag add` masih memerlukan autentikasi npm biasa

## Urutan rilis npm stable

Saat membuat rilis npm stable:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
2. Pilih `npm_dist_tag=beta` untuk alur beta-first normal, atau `latest` hanya
   jika Anda memang ingin publish stable langsung
3. Simpan `preflight_run_id` yang berhasil
4. Jalankan `OpenClaw NPM Release` lagi dengan `preflight_only=false`, `tag`
   yang sama, `npm_dist_tag` yang sama, dan `preflight_run_id` yang disimpan
5. Jika rilis mendarat di `beta`, jalankan `OpenClaw NPM Release` nanti dengan
   `tag` stable yang sama, `promote_beta_to_latest=true`, `preflight_only=false`,
   `preflight_run_id` kosong, dan `npm_dist_tag=beta` saat Anda ingin memindahkan
   build yang sudah dipublikasikan itu ke `latest`

Mode promosi tetap memerlukan persetujuan environment `npm-release` dan
`NPM_TOKEN` yang valid di environment tersebut.

Itu menjaga agar jalur publish langsung dan jalur promosi beta-first keduanya
tetap terdokumentasi dan terlihat oleh operator.

## Referensi publik

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer menggunakan dokumen rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
untuk runbook yang sebenarnya.
