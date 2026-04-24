---
read_when:
    - Anda perlu memahami mengapa sebuah job CI dijalankan atau tidak dijalankan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Grafik job CI, gate cakupan, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-24T09:00:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

CI berjalan pada setiap push ke `main` dan setiap pull request. CI menggunakan scoping cerdas untuk melewati job mahal saat hanya area yang tidak terkait yang berubah.

QA Lab memiliki lane CI khusus di luar workflow utama yang discoping secara cerdas. Workflow
`Parity gate` berjalan pada perubahan PR yang cocok dan manual dispatch; workflow ini
membangun runtime QA privat dan membandingkan pack agentik mock GPT-5.4 dan Opus 4.6.
Workflow `QA-Lab - All Lanes` berjalan setiap malam di `main` dan pada
manual dispatch; workflow ini memecah mock parity gate, lane Matrix live, dan lane
Telegram live sebagai job paralel. Job live menggunakan environment `qa-live-shared`,
dan lane Telegram menggunakan lease Convex. `OpenClaw Release
Checks` juga menjalankan lane QA Lab yang sama sebelum persetujuan rilis.

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk
pembersihan duplikat setelah land. Workflow ini default ke dry-run dan hanya menutup PR yang
dicantumkan secara eksplisit saat `apply=true`. Sebelum memodifikasi GitHub, workflow ini memverifikasi bahwa
PR yang di-land sudah di-merge dan bahwa setiap duplikat memiliki issue yang dirujuk bersama
atau hunk yang berubah dan saling tumpang tindih.

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis peristiwa untuk menjaga
dokumen yang ada tetap selaras dengan perubahan yang baru di-land. Workflow ini tidak memiliki jadwal murni:
run CI push non-bot yang berhasil di `main` dapat memicunya, dan manual dispatch dapat
menjalankannya secara langsung. Pemanggilan workflow-run dilewati saat `main` sudah bergerak maju atau saat
run Docs Agent non-skipped lain dibuat dalam satu jam terakhir. Saat berjalan, workflow ini
meninjau rentang commit dari SHA sumber Docs Agent non-skipped sebelumnya ke
`main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang
terakumulasi sejak pass docs terakhir.

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis peristiwa
untuk pengujian lambat. Workflow ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di
`main` dapat memicunya, tetapi workflow ini dilewati jika pemanggilan workflow-run lain sudah
berjalan atau sedang berjalan pada hari UTC tersebut. Manual dispatch melewati gate aktivitas
harian itu. Lane ini membangun laporan performa Vitest grouped full-suite, membiarkan Codex
hanya membuat perbaikan kecil performa pengujian yang tetap menjaga cakupan alih-alih refaktor luas,
lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah
baseline pengujian yang lulus. Jika baseline memiliki pengujian yang gagal, Codex hanya boleh
memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lulus sebelum
apa pun di-commit. Saat `main` maju sebelum push bot tervalidasi di-land, lane ini
merebase patch tervalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push;
patch lama yang konflik akan dilewati. Workflow ini menggunakan Ubuntu yang di-host GitHub agar aksi Codex
dapat mempertahankan postur keamanan drop-sudo yang sama seperti docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Ikhtisar Job

| Job                              | Tujuan                                                                                       | Kapan dijalankan                     |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Mendeteksi perubahan docs-only, cakupan yang berubah, extension yang berubah, dan membangun manifest CI | Selalu pada push dan PR non-draft    |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                      | Selalu pada push dan PR non-draft    |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependensi terhadap advisori npm                               | Selalu pada push dan PR non-draft    |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                       | Selalu pada push dan PR non-draft    |
| `build-artifacts`                | Membangun `dist/`, UI kontrol, pemeriksaan built-artifact, dan artefak downstream yang dapat digunakan kembali | Perubahan yang relevan untuk Node    |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol              | Perubahan yang relevan untuk Node    |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil check agregat yang stabil             | Perubahan yang relevan untuk Node    |
| `checks-node-extensions`         | Shard pengujian full bundled-plugin di seluruh suite extension                               | Perubahan yang relevan untuk Node    |
| `checks-node-core-test`          | Shard pengujian Node inti, tidak termasuk lane channel, bundled, contract, dan extension     | Perubahan yang relevan untuk Node    |
| `extension-fast`                 | Pengujian terfokus hanya untuk bundled plugin yang berubah                                   | Pull request dengan perubahan extension |
| `check`                          | Padanan gate lokal utama yang di-shard: tipe prod, lint, guard, tipe test, dan smoke ketat  | Perubahan yang relevan untuk Node    |
| `check-additional`               | Arsitektur, boundary, guard extension-surface, package-boundary, dan shard gateway-watch     | Perubahan yang relevan untuk Node    |
| `build-smoke`                    | Pengujian smoke built-CLI dan smoke startup-memory                                           | Perubahan yang relevan untuk Node    |
| `checks`                         | Verifier untuk pengujian channel built-artifact plus kompatibilitas Node 22 khusus push      | Perubahan yang relevan untuk Node    |
| `check-docs`                     | Pemeriksaan formatting, lint, dan broken-link docs                                           | Docs berubah                         |
| `skills-python`                  | Ruff + pytest untuk Skills berbasis Python                                                   | Perubahan yang relevan untuk skill Python |
| `checks-windows`                 | Lane pengujian khusus Windows                                                                | Perubahan yang relevan untuk Windows |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan built artifacts bersama                          | Perubahan yang relevan untuk macOS   |
| `macos-swift`                    | Swift lint, build, dan pengujian untuk aplikasi macOS                                        | Perubahan yang relevan untuk macOS   |
| `android`                        | Pengujian unit Android untuk kedua flavor plus satu build APK debug                          | Perubahan yang relevan untuk Android |
| `test-performance-agent`         | Optimasi pengujian lambat Codex harian setelah aktivitas tepercaya                           | Keberhasilan CI main atau manual dispatch |

## Urutan Fail-Fast

Job diurutkan agar pemeriksaan murah gagal sebelum yang mahal berjalan:

1. `preflight` memutuskan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah step di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job artefak dan matriks platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat agar consumer downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat kemudian fan out setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` khusus PR, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`.
Pengeditan workflow CI memvalidasi grafik Node CI plus linting workflow, tetapi tidak dengan sendirinya memaksa build native Windows, Android, atau macOS; lane platform tersebut tetap discoping ke perubahan source platform.
Pemeriksaan Node Windows discoping ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, config package manager, dan surface workflow CI yang menjalankan lane tersebut; perubahan source, plugin, install-smoke, dan test-only yang tidak terkait tetap berada di lane Linux Node agar tidak memesan worker Windows 16-vCPU untuk cakupan yang sudah diuji oleh shard pengujian normal.
Workflow `install-smoke` yang terpisah menggunakan kembali skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`. Pull request menjalankan jalur cepat untuk surface Docker/package, perubahan paket/manifest bundled plugin, dan surface inti plugin/channel/gateway/Plugin SDK yang dijalankan oleh job smoke Docker. Perubahan source-only bundled plugin, pengeditan test-only, dan pengeditan docs-only tidak memesan worker Docker. Jalur cepat membangun image Dockerfile root sekali, memeriksa CLI, menjalankan e2e gateway-network container, memverifikasi build arg bundled extension, dan menjalankan profil Docker bundled-plugin berbatas di bawah timeout perintah 120 detik. Jalur penuh mempertahankan cakupan install paket QR dan Docker/update installer untuk run terjadwal malam hari, manual dispatch, workflow-call pemeriksaan rilis, dan pull request yang benar-benar menyentuh surface installer/package/Docker. Push `main`, termasuk merge commit, tidak memaksa jalur penuh; saat logika changed-scope akan meminta cakupan penuh pada push, workflow tetap memakai smoke Docker cepat dan menyerahkan full install smoke ke validasi malam hari atau rilis. Smoke image-provider instalasi global Bun yang lambat digate secara terpisah oleh `run_bun_global_install_smoke`; lane ini berjalan pada jadwal malam hari dan dari workflow release checks, dan manual dispatch `install-smoke` dapat ikut mengaktifkannya, tetapi pull request dan push `main` tidak menjalankannya. Pengujian QR dan Docker installer mempertahankan Dockerfile berfokus-instalasi mereka sendiri. `test:docker:all` lokal membangun lebih dulu satu image live-test bersama dan satu image built-app bersama `scripts/e2e/Dockerfile`, lalu menjalankan lane smoke live/E2E secara paralel dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`; sesuaikan konkurensi default main-pool 8 dengan `OPENCLAW_DOCKER_ALL_PARALLELISM` dan konkurensi tail-pool sensitif-provider 8 dengan `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Awal lane diberi jeda 2 detik secara default untuk menghindari badai create pada daemon Docker lokal; override dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` atau nilai milidetik lain. Agregat lokal berhenti menjadwalkan lane pooled baru setelah kegagalan pertama secara default, dan setiap lane memiliki timeout 120 menit yang dapat dioverride dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Workflow live/E2E yang dapat digunakan kembali mencerminkan pola image bersama dengan membangun dan mendorong satu image Docker E2E GHCR bertag SHA sebelum matriks Docker, lalu menjalankan matriks dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Workflow live/E2E terjadwal menjalankan suite Docker jalur-rilis penuh setiap hari. Matriks pembaruan/channel bundled penuh yang terpisah tetap manual/full-suite karena melakukan pass update npm nyata dan perbaikan doctor berulang.

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Gate lokal itu lebih ketat tentang boundary arsitektur daripada cakupan platform CI yang luas: perubahan produksi inti menjalankan typecheck prod inti plus pengujian inti, perubahan test-only inti hanya menjalankan typecheck/test pengujian inti, perubahan produksi extension menjalankan typecheck prod extension plus pengujian extension, dan perubahan test-only extension hanya menjalankan typecheck/test pengujian extension. Perubahan Plugin SDK publik atau plugin-contract diperluas ke validasi extension karena extension bergantung pada kontrak inti tersebut. Version bump hanya metadata rilis menjalankan pemeriksaan versi/config/dependensi root yang tertarget. Perubahan root/config yang tidak dikenal fail safe ke semua lane.

Pada push, matriks `checks` menambahkan lane `compat-node22` khusus push. Pada pull request, lane itu dilewati dan matriks tetap berfokus pada lane pengujian/channel normal.

Keluarga pengujian Node yang paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, pengujian bundled plugin diseimbangkan di enam worker extension, lane unit inti kecil dipasangkan, auto-reply berjalan sebagai tiga worker seimbang alih-alih enam worker kecil, dan config gateway/plugin agentik disebarkan ke job Node agentik source-only yang sudah ada alih-alih menunggu built artifact. Pengujian browser, QA, media, dan plugin lain yang luas menggunakan config Vitest khusus masing-masing alih-alih catch-all plugin bersama. Job shard extension menjalankan grup config plugin secara serial dengan satu worker Vitest dan heap Node yang lebih besar agar batch plugin yang berat pada import tidak overcommit runner CI kecil. Lane agents yang luas menggunakan scheduler file-parallel Vitest bersama karena didominasi import/penjadwalan alih-alih dimiliki satu file pengujian lambat. `runtime-config` berjalan dengan shard infra core-runtime agar shard runtime bersama tidak memegang ekor. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard boundary guard menjalankan guard independen kecilnya secara paralel di dalam satu job. Gateway watch, pengujian channel, dan shard core support-boundary berjalan secara paralel di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun, mempertahankan nama check lamanya sebagai job verifier ringan sambil menghindari dua worker Blacksmith tambahan dan antrean consumer artefak kedua.

Android CI menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor third-party tidak memiliki source set atau manifest terpisah; lane unit-test-nya tetap mengompilasi flavor itu dengan flag SMS/call-log BuildConfig, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan untuk Android.
`extension-fast` khusus PR karena push run sudah menjalankan shard bundled plugin penuh. Itu menjaga umpan balik changed-plugin untuk review tanpa memesan worker Blacksmith tambahan di `main` untuk cakupan yang sudah ada di `checks-node-extensions`.

GitHub dapat menandai job yang digantikan sebagai `cancelled` saat push yang lebih baru masuk ke PR atau ref `main` yang sama. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Check shard agregat menggunakan `!cancelled() && always()` agar tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah digantikan.
Kunci konkurensi CI diberi versi (`CI-v7-*`) agar zombie sisi GitHub di grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas waktu.

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protocol/contract/bundled cepat, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifier agregat pengujian Node, pemeriksaan docs, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Linux Node, shard pengujian bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, yang tetap cukup sensitif terhadap CPU sehingga 8 vCPU justru lebih mahal daripada penghematannya; build Docker install-smoke, di mana biaya waktu antre 32-vCPU lebih besar daripada penghematannya                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` di `openclaw/openclaw`; fork menggunakan fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` di `openclaw/openclaw`; fork menggunakan fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                        |

## Padanan Lokal

```bash
pnpm changed:lanes   # periksa classifier changed-lane lokal untuk origin/main...HEAD
pnpm check:changed   # gate lokal cerdas: typecheck/lint/test yang berubah berdasarkan lane boundary
pnpm check          # gate lokal cepat: tsgo produksi + lint yang di-shard + fast guard paralel
pnpm check:test-types
pnpm check:timed    # gate yang sama dengan timing per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # pengujian vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format docs + lint + broken links
pnpm build          # bangun dist saat lane artefak/build-smoke CI relevan
node scripts/ci-run-timings.mjs <run-id>      # ringkas wall time, queue time, dan job terlambat
node scripts/ci-run-timings.mjs --recent 10   # bandingkan run CI main berhasil terbaru
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Channel pengembangan](/id/install/development-channels)
