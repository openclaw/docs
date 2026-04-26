---
read_when:
    - Anda perlu memahami mengapa suatu pekerjaan CI dijalankan atau tidak dijalankan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Grafik pekerjaan CI, gate cakupan, dan padanan perintah lokal
title: pipeline CI
x-i18n:
    generated_at: "2026-04-26T11:24:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

CI berjalan pada setiap push ke `main` dan setiap pull request. CI menggunakan scoping cerdas untuk melewati pekerjaan mahal ketika hanya area yang tidak terkait yang berubah.

QA Lab memiliki lane CI khusus di luar workflow smart-scoped utama. Workflow
`Parity gate` berjalan pada perubahan PR yang cocok dan manual dispatch; workflow ini
membangun runtime QA privat dan membandingkan paket agentic mock GPT-5.5 dan Opus 4.6.
Workflow `QA-Lab - All Lanes` berjalan setiap malam di `main` dan pada
manual dispatch; workflow ini memecah mock parity gate, lane Matrix live, dan lane
Telegram live sebagai pekerjaan paralel. Pekerjaan live menggunakan environment
`qa-live-shared`, dan lane Telegram menggunakan lease Convex. `OpenClaw Release
Checks` juga menjalankan lane QA Lab yang sama sebelum persetujuan rilis.

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk
pembersihan duplikat setelah pendaratan. Workflow ini default ke dry-run dan hanya menutup PR
yang secara eksplisit terdaftar ketika `apply=true`. Sebelum memodifikasi GitHub, workflow ini
memverifikasi bahwa PR yang sudah didaratkan telah di-merge dan bahwa setiap duplikat memiliki
referenced issue yang sama atau hunk perubahan yang tumpang tindih.

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis peristiwa untuk menjaga
dokumen yang ada tetap selaras dengan perubahan yang baru didaratkan. Workflow ini tidak memiliki jadwal murni:
workflow ini dapat dipicu oleh keberhasilan CI push non-bot di `main`, dan
manual dispatch dapat menjalankannya secara langsung. Pemanggilan workflow-run dilewati ketika
`main` sudah bergerak maju atau ketika run Docs Agent non-skipped lain dibuat
dalam satu jam terakhir. Ketika workflow ini berjalan, workflow ini meninjau rentang commit dari source SHA
Docs Agent non-skipped sebelumnya ke `main` saat ini, sehingga satu run per jam dapat
mencakup semua perubahan `main` yang terakumulasi sejak pass docs terakhir.

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis peristiwa
untuk pengujian lambat. Workflow ini tidak memiliki jadwal murni: workflow ini dapat dipicu oleh keberhasilan CI push non-bot di
`main`, tetapi akan dilewati jika pemanggilan workflow-run lain sudah
berjalan atau sedang berjalan pada hari UTC tersebut. Manual dispatch melewati gerbang
aktivitas harian itu. Lane ini membangun laporan performa Vitest grouped full-suite, membiarkan Codex
hanya melakukan perbaikan performa pengujian kecil yang mempertahankan cakupan alih-alih refaktor luas,
lalu menjalankan ulang laporan full-suite dan menolak perubahan yang
mengurangi jumlah pengujian baseline yang lulus. Jika baseline memiliki pengujian yang gagal,
Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen
harus lulus sebelum apa pun di-commit. Ketika `main` maju sebelum push bot berhasil didaratkan,
lane ini merebase patch yang tervalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push;
patch usang yang konflik akan dilewati. Lane ini menggunakan GitHub-hosted Ubuntu agar aksi Codex
dapat mempertahankan postur keamanan drop-sudo yang sama seperti docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Ikhtisar pekerjaan

| Pekerjaan                       | Tujuan                                                                                       | Kapan berjalan                       |
| ------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                     | Mendeteksi perubahan hanya-docs, scope yang berubah, extension yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draft    |
| `security-scm-fast`             | Deteksi private key dan audit workflow melalui `zizmor`                                      | Selalu pada push dan PR non-draft    |
| `security-dependency-audit`     | Audit lockfile produksi tanpa dependensi terhadap advisory npm                               | Selalu pada push dan PR non-draft    |
| `security-fast`                 | Agregat wajib untuk pekerjaan keamanan cepat                                                 | Selalu pada push dan PR non-draft    |
| `build-artifacts`               | Membangun `dist/`, Control UI, pemeriksaan built artifact, dan artifact downstream yang dapat digunakan ulang | Perubahan yang relevan dengan Node |
| `checks-fast-core`              | Lane korektness Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol             | Perubahan yang relevan dengan Node   |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil     | Perubahan yang relevan dengan Node   |
| `checks-node-extensions`        | Shard pengujian bundled-plugin penuh di seluruh suite extension                              | Perubahan yang relevan dengan Node   |
| `checks-node-core-test`         | Shard pengujian core Node, tidak termasuk lane channel, bundled, contract, dan extension     | Perubahan yang relevan dengan Node   |
| `extension-fast`                | Pengujian terfokus hanya untuk bundled plugin yang berubah                                   | Pull request dengan perubahan extension |
| `check`                         | Padanan main local gate yang di-shard: type produksi, lint, guard, type pengujian, dan smoke ketat | Perubahan yang relevan dengan Node |
| `check-additional`              | Shard architecture, boundary, extension-surface guard, package-boundary, dan gateway-watch   | Perubahan yang relevan dengan Node   |
| `build-smoke`                   | Pengujian built-CLI smoke dan startup-memory smoke                                           | Perubahan yang relevan dengan Node   |
| `checks`                        | Verifier untuk pengujian channel built-artifact ditambah kompatibilitas Node 22 khusus push  | Perubahan yang relevan dengan Node   |
| `check-docs`                    | Pemeriksaan formatting, lint, dan tautan rusak pada docs                                     | Docs berubah                         |
| `skills-python`                 | Ruff + pytest untuk Skills berbasis Python                                                   | Perubahan yang relevan dengan skill Python |
| `checks-windows`                | Lane pengujian khusus Windows                                                                | Perubahan yang relevan dengan Windows |
| `macos-node`                    | Lane pengujian TypeScript macOS menggunakan built artifact bersama                           | Perubahan yang relevan dengan macOS  |
| `macos-swift`                   | Swift lint, build, dan pengujian untuk aplikasi macOS                                        | Perubahan yang relevan dengan macOS  |
| `android`                       | Pengujian unit Android untuk kedua flavor plus satu build APK debug                          | Perubahan yang relevan dengan Android |
| `test-performance-agent`        | Optimasi pengujian lambat harian oleh Codex setelah aktivitas tepercaya                      | Keberhasilan main CI atau manual dispatch |

## Urutan fail-fast

Pekerjaan diurutkan agar pemeriksaan murah gagal sebelum pekerjaan mahal berjalan:

1. `preflight` memutuskan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah step di dalam pekerjaan ini, bukan pekerjaan terpisah.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal dengan cepat tanpa menunggu pekerjaan matrix artifact dan platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat agar konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat kemudian dipecah: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` khusus PR, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`.
Edit workflow CI memvalidasi grafik Node CI plus workflow linting, tetapi tidak dengan sendirinya memaksa build native Windows, Android, atau macOS; lane platform tersebut tetap di-scope ke perubahan sumber platform.
Edit khusus perutean CI, edit fixture core-test murah tertentu, dan edit helper/test-routing plugin contract yang sempit menggunakan jalur manifes Node-only cepat: preflight, security, dan satu tugas `checks-fast-core`. Jalur itu menghindari build artifacts, kompatibilitas Node 22, kontrak channel, shard core penuh, shard bundled-plugin, dan matriks guard tambahan ketika file yang berubah terbatas pada permukaan perutean atau helper yang langsung diuji oleh tugas cepat tersebut.
Pemeriksaan Node Windows di-scope ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang mengeksekusi lane itu; perubahan source, plugin, install-smoke, dan test-only yang tidak terkait tetap berada di lane Linux Node sehingga tidak memesan worker Windows 16-vCPU untuk cakupan yang sudah diuji oleh shard test normal.
Workflow `install-smoke` terpisah menggunakan kembali skrip scope yang sama melalui pekerjaan `preflight` miliknya sendiri. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`. Pull request menjalankan jalur cepat untuk permukaan Docker/package, perubahan package/manifest bundled plugin, serta permukaan core plugin/channel/gateway/Plugin SDK yang diuji oleh pekerjaan Docker smoke. Perubahan bundled plugin yang hanya source, edit test-only, dan edit docs-only tidak memesan worker Docker. Jalur cepat membangun image root Dockerfile sekali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e container gateway-network, memverifikasi build arg bundled extension, dan menjalankan profil Docker bundled-plugin yang dibatasi di bawah timeout perintah agregat 240 detik dengan batas terpisah untuk Docker run tiap skenario. Jalur penuh mempertahankan cakupan install package QR dan installer Docker/update untuk run terjadwal malam, manual dispatch, workflow-call release checks, dan pull request yang benar-benar menyentuh permukaan installer/package/Docker. Push ke `main`, termasuk merge commit, tidak memaksa jalur penuh; ketika logika changed-scope akan meminta cakupan penuh pada push, workflow mempertahankan Docker smoke cepat dan menyerahkan install smoke penuh ke validasi malam atau rilis. Smoke image-provider Bun global install yang lambat di-gate terpisah oleh `run_bun_global_install_smoke`; ini berjalan pada jadwal malam dan dari workflow release checks, dan dispatch `install-smoke` manual dapat memilihnya, tetapi pull request dan push `main` tidak menjalankannya. Pengujian QR dan installer Docker mempertahankan Dockerfile fokus-install mereka sendiri. `test:docker:all` lokal melakukan prebuild satu image live-test bersama dan satu image built-app bersama `scripts/e2e/Dockerfile`, lalu menjalankan lane smoke live/E2E dengan scheduler berbobot dan `OPENCLAW_SKIP_DOCKER_BUILD=1`; sesuaikan jumlah slot pool utama default 10 dengan `OPENCLAW_DOCKER_ALL_PARALLELISM` dan jumlah slot tail-pool sensitif-provider default 10 dengan `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Batas lane berat default ke `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` agar lane npm install dan multi-service tidak terlalu membebani Docker sementara lane yang lebih ringan tetap mengisi slot yang tersedia. Awal lane dibuat berselang 2 detik secara default untuk menghindari badai create daemon Docker lokal; override dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` atau nilai milidetik lain. Agregat lokal melakukan preflight Docker, menghapus container OpenClaw E2E yang basi, mengeluarkan status lane aktif, menyimpan timing lane untuk pengurutan longest-first, dan mendukung `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk inspeksi scheduler. Secara default, ini berhenti menjadwalkan lane pool baru setelah kegagalan pertama, dan tiap lane memiliki fallback timeout 120 menit yang dapat dioverride dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail tertentu menggunakan batas per-lane yang lebih ketat. Workflow live/E2E yang dapat digunakan ulang mencerminkan pola shared-image dengan membangun dan mendorong satu image Docker E2E GHCR bertag SHA sebelum matriks Docker, lalu menjalankan matriks dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Workflow live/E2E terjadwal menjalankan suite Docker jalur-rilis penuh setiap hari. Matriks bundled update dibagi berdasarkan target update sehingga pass npm update dan doctor repair yang berulang dapat di-shard bersama pemeriksaan bundled lainnya.

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Gate lokal itu lebih ketat tentang boundary arsitektur dibanding scope platform CI yang luas: perubahan produksi core menjalankan typecheck prod core plus test core, perubahan hanya test core hanya menjalankan typecheck/test test core, perubahan produksi extension menjalankan typecheck prod extension plus test extension, dan perubahan hanya test extension hanya menjalankan typecheck/test test extension. Perubahan Plugin SDK publik atau plugin-contract diperluas ke validasi extension karena extension bergantung pada kontrak core tersebut. Version bump hanya metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang ditargetkan. Perubahan root/konfigurasi yang tidak diketahui gagal aman ke semua lane.

Pada push, matriks `checks` menambahkan lane `compat-node22` yang hanya ada pada push. Pada pull request, lane itu dilewati dan matriks tetap fokus pada lane test/channel normal.

Keluarga test Node yang paling lambat dibagi atau diseimbangkan agar tiap pekerjaan tetap kecil tanpa memesan runner berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, test bundled plugin diseimbangkan di enam worker extension, lane unit core kecil dipasangkan, auto-reply berjalan sebagai empat worker seimbang dengan subtree reply dibagi menjadi shard agent-runner, dispatch, dan commands/state-routing, dan konfigurasi gateway/plugin agentic disebarkan ke pekerjaan Node agentic khusus source yang sudah ada alih-alih menunggu built artifacts. Test browser luas, QA, media, dan plugin lain-lain menggunakan konfigurasi Vitest khusus mereka, bukan catch-all plugin bersama. Pekerjaan shard extension menjalankan hingga dua grup konfigurasi plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar sehingga batch plugin berat-impor tidak membuat pekerjaan CI tambahan. Lane agents yang luas menggunakan scheduler file-parallel Vitest bersama karena didominasi impor/penjadwalan, bukan dimiliki oleh satu file test lambat. `runtime-config` berjalan bersama shard infra core-runtime agar shard runtime bersama tidak memiliki tail. Shard include-pattern merekam entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan satu konfigurasi utuh dari shard yang difilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard boundary guard menjalankan guard kecil independennya secara bersamaan di dalam satu pekerjaan. Gateway watch, test channel, dan shard core support-boundary berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun, mempertahankan nama pemeriksaan lama mereka sebagai pekerjaan verifier ringan sambil menghindari dua worker Blacksmith ekstra dan antrean artifact-consumer kedua.
Android CI menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor third-party tidak memiliki source set atau manifest terpisah; lane unit-test-nya tetap mengompilasi flavor tersebut dengan flag BuildConfig SMS/call-log, sambil menghindari pekerjaan packaging APK debug duplikat pada setiap push yang relevan dengan Android.
`extension-fast` hanya untuk PR karena run push sudah mengeksekusi shard bundled plugin penuh. Itu menjaga feedback changed-plugin untuk review tanpa memesan worker Blacksmith tambahan di `main` untuk cakupan yang sudah ada di `checks-node-extensions`.

GitHub dapat menandai pekerjaan yang tersupersesi sebagai `cancelled` ketika push yang lebih baru masuk pada PR atau ref `main` yang sama. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan agregat shard menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tersupersesi.
Kunci konkurensi CI diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run `main` yang lebih baru tanpa batas waktu.

## Runner

| Runner                           | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, pekerjaan keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protocol/contract/bundled cepat, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifier agregat test Node, pemeriksaan docs, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith bisa mengantre lebih awal |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard test Linux Node, shard test bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, yang tetap cukup sensitif terhadap CPU sehingga 8 vCPU justru lebih mahal daripada penghematannya; build Docker install-smoke, di mana biaya waktu antre 32-vCPU lebih besar daripada penghematannya                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork kembali ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork kembali ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

## Padanan lokal

```bash
pnpm changed:lanes   # periksa pengklasifikasi changed-lane lokal untuk origin/main...HEAD
pnpm check:changed   # gate lokal cerdas: typecheck/lint/test yang berubah menurut lane boundary
pnpm check          # gate lokal cepat: tsgo produksi + lint ter-shard + guard cepat paralel
pnpm check:test-types
pnpm check:timed    # gate yang sama dengan timing per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format docs + lint + tautan rusak
pnpm build          # build dist saat lane artifact/build-smoke CI relevan
pnpm ci:timings                               # ringkas run CI push origin/main terbaru
pnpm ci:timings:recent                        # bandingkan run CI main sukses terbaru
node scripts/ci-run-timings.mjs <run-id>      # ringkas wall time, queue time, dan pekerjaan terlambat
node scripts/ci-run-timings.mjs --latest-main # abaikan noise issue/comment dan pilih CI push origin/main
node scripts/ci-run-timings.mjs --recent 10   # bandingkan run CI main sukses terbaru
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Channel rilis](/id/install/development-channels)
