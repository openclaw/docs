---
read_when:
    - Anda perlu memahami mengapa sebuah pekerjaan CI dijalankan atau tidak dijalankan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Graf pekerjaan CI, gerbang cakupan, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-23T13:58:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

CI berjalan pada setiap push ke `main` dan setiap pull request. CI menggunakan pembatasan cakupan cerdas untuk melewati pekerjaan yang mahal saat hanya area yang tidak terkait yang berubah.

QA Lab memiliki lane CI khusus di luar workflow utama yang dibatasi cakupan secara cerdas. Workflow
`Parity gate` berjalan pada perubahan PR yang cocok dan manual dispatch; workflow ini
membangun runtime QA privat dan membandingkan paket agentic mock GPT-5.4 dan Opus 4.6.
Workflow `QA-Lab - All Lanes` berjalan setiap malam di `main` dan pada
manual dispatch; workflow ini menyebarkan parity gate mock, lane Matrix live, dan lane
Telegram live sebagai pekerjaan paralel. Pekerjaan live menggunakan environment `qa-live-shared`,
dan lane Telegram menggunakan lease Convex. `OpenClaw Release
Checks` juga menjalankan lane QA Lab yang sama sebelum persetujuan rilis.

## Ringkasan Pekerjaan

| Pekerjaan                        | Tujuan                                                                                       | Kapan dijalankan                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Mendeteksi perubahan docs-only, cakupan yang berubah, extension yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draft   |
| `security-scm-fast`              | Deteksi kunci privat dan audit workflow melalui `zizmor`                                     | Selalu pada push dan PR non-draft   |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisory npm                               | Selalu pada push dan PR non-draft   |
| `security-fast`                  | Agregat wajib untuk pekerjaan keamanan cepat                                                 | Selalu pada push dan PR non-draft   |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan built-artifact, dan artifact downstream yang dapat digunakan ulang | Perubahan yang relevan dengan Node  |
| `checks-fast-core`               | Lane korektness Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol             | Perubahan yang relevan dengan Node  |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil       | Perubahan yang relevan dengan Node  |
| `checks-node-extensions`         | Shard pengujian bundled-plugin penuh di seluruh suite extension                              | Perubahan yang relevan dengan Node  |
| `checks-node-core-test`          | Shard pengujian Node inti, tidak termasuk lane channel, bundled, contract, dan extension     | Perubahan yang relevan dengan Node  |
| `extension-fast`                 | Pengujian terfokus hanya untuk bundled plugin yang berubah                                   | Pull request dengan perubahan extension |
| `check`                          | Padanan gerbang lokal utama yang di-shard: tipe prod, lint, guard, tipe test, dan smoke ketat | Perubahan yang relevan dengan Node  |
| `check-additional`               | Guard arsitektur, boundary, permukaan extension, package-boundary, dan shard gateway-watch   | Perubahan yang relevan dengan Node  |
| `build-smoke`                    | Pengujian smoke CLI hasil build dan smoke memori startup                                     | Perubahan yang relevan dengan Node  |
| `checks`                         | Verifier untuk pengujian channel built-artifact ditambah kompatibilitas Node 22 khusus push  | Perubahan yang relevan dengan Node  |
| `check-docs`                     | Pemeriksaan format docs, lint, dan tautan rusak                                              | Docs berubah                        |
| `skills-python`                  | Ruff + pytest untuk Skills berbasis Python                                                   | Perubahan yang relevan dengan Python skill |
| `checks-windows`                 | Lane pengujian khusus Windows                                                                | Perubahan yang relevan dengan Windows |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan built artifact bersama                           | Perubahan yang relevan dengan macOS |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk aplikasi macOS                                        | Perubahan yang relevan dengan macOS |
| `android`                        | Pengujian unit Android untuk kedua flavor ditambah satu build APK debug                      | Perubahan yang relevan dengan Android |

## Urutan Gagal Cepat

Pekerjaan diurutkan agar pemeriksaan murah gagal sebelum pekerjaan mahal berjalan:

1. `preflight` memutuskan lane mana yang ada. Logika `docs-scope` dan `changed-scope` adalah step di dalam pekerjaan ini, bukan pekerjaan terpisah.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu pekerjaan artifact dan matriks platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat agar konsumen downstream dapat mulai segera setelah build bersama siap.
4. Setelah itu, lane platform dan runtime yang lebih berat menyebar: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` khusus PR, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`.
Edit workflow CI memvalidasi grafik CI Node beserta workflow linting, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap dibatasi pada perubahan source platform.
Pemeriksaan Node Windows dibatasi pada wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang mengeksekusi lane tersebut; perubahan source, plugin, install-smoke, dan test-only yang tidak terkait tetap berada di lane Node Linux agar tidak memesan worker Windows 16-vCPU untuk cakupan yang sudah diuji oleh shard pengujian normal.
Workflow `install-smoke` yang terpisah menggunakan kembali skrip cakupan yang sama melalui pekerjaan `preflight` miliknya sendiri. Workflow ini menghitung `run_install_smoke` dari sinyal changed-smoke yang lebih sempit, sehingga smoke Docker/install berjalan untuk perubahan install, packaging, yang relevan dengan container, perubahan produksi bundled extension, dan permukaan inti plugin/channel/gateway/Plugin SDK yang dijalankan oleh pekerjaan smoke Docker. Edit test-only dan docs-only tidak memesan worker Docker. Smoke paket QR memaksa layer Docker `pnpm install` untuk dijalankan ulang sambil mempertahankan cache BuildKit pnpm store, sehingga tetap menguji instalasi tanpa mengunduh ulang dependensi pada setiap run. E2E gateway-network menggunakan kembali image runtime yang dibangun sebelumnya dalam pekerjaan, sehingga menambahkan cakupan WebSocket antarkontainer nyata tanpa menambahkan build Docker lain. `test:docker:all` lokal melakukan prebuild satu image live-test bersama dan satu image built-app bersama `scripts/e2e/Dockerfile`, lalu menjalankan lane smoke live/E2E secara paralel dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`; sesuaikan konkurensi default 4 dengan `OPENCLAW_DOCKER_ALL_PARALLELISM`. Agregat lokal berhenti menjadwalkan lane gabungan baru setelah kegagalan pertama secara default, dan tiap lane memiliki timeout 120 menit yang dapat dioverride dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lane yang sensitif terhadap startup atau provider berjalan secara eksklusif setelah pool paralel. Workflow live/E2E reusable mencerminkan pola image bersama dengan membangun dan mendorong satu image Docker E2E GHCR bertag SHA sebelum matriks Docker, lalu menjalankan matriks dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Workflow live/E2E terjadwal menjalankan suite Docker jalur-rilis penuh setiap hari. Pengujian Docker QR dan installer mempertahankan Dockerfile mereka sendiri yang berfokus pada instalasi. Pekerjaan `docker-e2e-fast` terpisah menjalankan profil Docker bundled-plugin yang dibatasi di bawah timeout perintah 120 detik: perbaikan dependensi setup-entry ditambah isolasi kegagalan bundled-loader sintetis. Matriks pembaruan/channel bundled penuh tetap manual/full-suite karena menjalankan pass update npm nyata dan doctor repair berulang.

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gerbang lokal ini lebih ketat terhadap boundary arsitektur daripada cakupan platform CI yang lebih luas: perubahan produksi inti menjalankan typecheck prod inti ditambah pengujian inti, perubahan test-only inti hanya menjalankan typecheck/pengujian test inti, perubahan produksi extension menjalankan typecheck prod extension ditambah pengujian extension, dan perubahan test-only extension hanya menjalankan typecheck/pengujian test extension. Perubahan pada Plugin SDK publik atau plugin-contract diperluas ke validasi extension karena extension bergantung pada kontrak inti tersebut. Version bump yang hanya mengubah metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang terarah. Perubahan root/konfigurasi yang tidak dikenal gagal aman ke semua lane.

Pada push, matriks `checks` menambahkan lane `compat-node22` yang khusus push. Pada pull request, lane tersebut dilewati dan matriks tetap berfokus pada lane pengujian/channel normal.

Keluarga pengujian Node yang paling lambat dibagi atau diseimbangkan agar setiap pekerjaan tetap kecil: kontrak channel membagi cakupan registry dan inti menjadi total enam shard berbobot, pengujian bundled plugin diseimbangkan di enam worker extension, auto-reply berjalan sebagai tiga worker seimbang alih-alih enam worker kecil, dan konfigurasi gateway/plugin agentic disebar ke pekerjaan Node agentic source-only yang sudah ada alih-alih menunggu built artifact. Pengujian plugin browser luas, QA, media, dan miscellaneous menggunakan konfigurasi Vitest khusus mereka alih-alih plugin catch-all bersama. Lane agents yang luas menggunakan penjadwal file-paralel Vitest bersama karena didominasi import/penjadwalan alih-alih dimiliki satu file pengujian lambat. `runtime-config` berjalan dengan shard infra core-runtime agar shard runtime bersama tidak memegang ekor terlama. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard boundary guard menjalankan guard kecil independennya secara serentak di dalam satu pekerjaan. Gateway watch, pengujian channel, dan shard core support-boundary berjalan serentak di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun, mempertahankan nama pemeriksaan lama mereka sebagai pekerjaan verifier ringan sambil menghindari dua worker Blacksmith tambahan dan antrean konsumen artifact kedua.
CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifest terpisah; lane pengujian unitnya tetap mengompilasi flavor tersebut dengan flag BuildConfig SMS/call-log, sambil menghindari pekerjaan packaging APK debug duplikat pada setiap push yang relevan dengan Android.
`extension-fast` khusus PR karena push run sudah mengeksekusi shard bundled plugin penuh. Ini menjaga umpan balik changed-plugin untuk review tanpa memesan worker Blacksmith tambahan di `main` untuk cakupan yang sudah ada di `checks-node-extensions`.

GitHub dapat menandai pekerjaan yang disupersede sebagai `cancelled` saat push yang lebih baru masuk pada PR atau ref `main` yang sama. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan agregat shard menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah disupersede.
Kunci konkurensi CI diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas.

## Runner

| Runner                           | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, pekerjaan dan agregat keamanan cepat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protocol/contract/bundled cepat, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifier agregat pengujian Node, pemeriksaan docs, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Node Linux, shard pengujian bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, yang tetap cukup sensitif terhadap CPU sehingga 8 vCPU justru lebih mahal daripada penghematannya; build Docker install-smoke, di mana waktu antre 32-vCPU lebih mahal daripada penghematannya                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork menggunakan fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork menggunakan fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |

## Padanan Lokal

```bash
pnpm changed:lanes   # periksa classifier changed-lane lokal untuk origin/main...HEAD
pnpm check:changed   # gerbang lokal cerdas: typecheck/lint/pengujian yang berubah menurut lane boundary
pnpm check          # gerbang lokal cepat: tsgo produksi + lint yang di-shard + guard cepat paralel
pnpm check:test-types
pnpm check:timed    # gerbang yang sama dengan timing per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # pengujian vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format docs + lint + tautan rusak
pnpm build          # build dist saat lane CI artifact/build-smoke relevan
node scripts/ci-run-timings.mjs <run-id>  # ringkas wall time, queue time, dan pekerjaan paling lambat
```
