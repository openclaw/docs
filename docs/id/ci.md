---
read_when:
    - Anda perlu memahami mengapa sebuah job CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pengulangan validasi rilis
    - Anda mengubah dispatch ClawSweeper atau penerusan aktivitas GitHub
summary: Graf tugas CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur CI
x-i18n:
    generated_at: "2026-06-28T00:11:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Push
`main` kanonis pertama-tama melewati jendela penerimaan hosted-runner selama 90
detik. Grup konkurensi `CI` yang ada membatalkan run yang sedang menunggu itu
ketika commit yang lebih baru masuk, sehingga merge berurutan tidak masing-masing
mendaftarkan matriks Blacksmith penuh. Pull request dan dispatch manual melewati
penantian tersebut. Job `preflight` kemudian mengklasifikasikan diff dan
menonaktifkan lane yang mahal ketika hanya area yang tidak terkait berubah. Run
`workflow_dispatch` manual sengaja melewati scoping pintar dan menjalankan graph
penuh untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui
`include_android`. Cakupan plugin khusus rilis berada di workflow terpisah
[`Plugin Prerelease`](#plugin-prerelease) dan hanya berjalan dari
[`Full Release Validation`](#full-release-validation) atau dispatch manual
eksplisit.

## Ikhtisar pipeline

| Job                                | Tujuan                                                                                                    | Kapan berjalan                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Mendeteksi perubahan khusus docs, scope yang berubah, extension yang berubah, dan membangun manifes CI    | Selalu pada push dan PR non-draft                   |
| `runner-admission`                 | Debounce terhosting 90 detik untuk push `main` kanonis sebelum pekerjaan Blacksmith didaftarkan           | Setiap run CI; sleep hanya pada push `main` kanonis |
| `security-fast`                    | Deteksi kunci privat, audit workflow yang berubah via `zizmor`, dan audit lockfile produksi               | Selalu pada push dan PR non-draft                   |
| `check-dependencies`               | Pass khusus dependensi Knip produksi plus guard allowlist file yang tidak digunakan                       | Perubahan relevan Node                              |
| `build-artifacts`                  | Build `dist/`, Control UI, smoke check built-CLI, check artefak build tertanam, dan artefak reusable      | Perubahan relevan Node                              |
| `checks-fast-core`                 | Lane kebenaran Linux cepat seperti bundled, protocol, QA Smoke CI, dan check routing CI                   | Perubahan relevan Node                              |
| `checks-fast-contracts-plugins-*`  | Dua check kontrak plugin yang di-shard                                                                    | Perubahan relevan Node                              |
| `checks-fast-contracts-channels-*` | Dua check kontrak channel yang di-shard                                                                   | Perubahan relevan Node                              |
| `checks-node-core-*`               | Shard test Node inti, tidak termasuk lane channel, bundled, kontrak, dan extension                        | Perubahan relevan Node                              |
| `check-*`                          | Padanan gate lokal utama yang di-shard: tipe prod, lint, guard, tipe test, dan smoke ketat                | Perubahan relevan Node                              |
| `check-additional-*`               | Arsitektur, drift boundary/prompt yang di-shard, guard extension, boundary paket, dan topologi runtime    | Perubahan relevan Node                              |
| `checks-node-compat-node22`        | Lane build kompatibilitas Node 22 dan smoke                                                               | Dispatch CI manual untuk rilis                      |
| `check-docs`                       | Formatting docs, lint, dan check tautan rusak                                                             | Docs berubah                                        |
| `skills-python`                    | Ruff + pytest untuk skill berbasis Python                                                                 | Perubahan relevan skill Python                      |
| `checks-windows`                   | Test proses/path khusus Windows plus regresi specifier import runtime bersama                             | Perubahan relevan Windows                           |
| `macos-node`                       | Lane test TypeScript macOS menggunakan artefak build bersama                                              | Perubahan relevan macOS                             |
| `macos-swift`                      | Lint, build, dan test Swift untuk aplikasi macOS                                                          | Perubahan relevan macOS                             |
| `ios-build`                        | Pembuatan proyek Xcode plus build simulator aplikasi iOS                                                  | Aplikasi iOS, app kit bersama, atau perubahan Swabble |
| `android`                          | Test unit Android untuk kedua flavor plus satu build APK debug                                            | Perubahan relevan Android                           |
| `test-performance-agent`           | Optimisasi test lambat Codex harian setelah aktivitas tepercaya                                           | CI main berhasil atau dispatch manual               |
| `openclaw-performance`             | Laporan performa runtime Kova harian/on-demand dengan lane mock-provider, deep-profile, dan live GPT 5.5  | Terjadwal dan dispatch manual                       |

## Urutan fail-fast

1. `runner-admission` menunggu hanya untuk push `main` kanonis; push yang lebih baru membatalkan run sebelum registrasi Blacksmith.
2. `preflight` memutuskan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job matriks artefak dan platform yang lebih berat.
4. `build-artifacts` tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
5. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR atau ref `main` yang sama. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Job matriks menggunakan `fail-fast: false`, dan `build-artifacts` melaporkan kegagalan channel tertanam, core-support-boundary, dan gateway-watch secara langsung alih-alih mengantrekan job verifier kecil. Kunci konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

Gunakan `pnpm ci:timings`, `pnpm ci:timings:recent`, atau `node scripts/ci-run-timings.mjs <run-id>` untuk merangkum wall time, queue time, job paling lambat, kegagalan, dan barrier fanout `pnpm-store-warmup` dari GitHub Actions. CI juga mengunggah ringkasan run yang sama sebagai artefak `ci-timings-summary`. Untuk timing build, periksa langkah `Build dist` pada job `build-artifacts`: `pnpm build:ci-artifacts` mencetak `[build-all] phase timings:` dan menyertakan `ui:build`; job tersebut juga mengunggah artefak `startup-memory`.

Untuk run pull request, job terminal timing-summary menjalankan helper dari revisi base tepercaya sebelum meneruskan `GH_TOKEN` ke `gh run view`. Ini menjaga kueri bertoken keluar dari kode yang dikontrol branch sambil tetap merangkum run CI pull request saat ini.

## Konteks PR dan bukti

PR kontributor eksternal menjalankan gate konteks PR dan bukti dari
`.github/workflows/real-behavior-proof.yml`. Workflow melakukan checkout commit
base tepercaya dan hanya mengevaluasi body PR; workflow tersebut tidak
mengeksekusi kode dari branch kontributor.

Gate berlaku untuk penulis PR yang bukan owner, member, collaborator, atau bot
repositori. Gate lulus ketika body PR berisi bagian `What Problem This Solves`
dan `Evidence` yang ditulis penulis. Bukti dapat berupa test terfokus, hasil CI,
screenshot, rekaman, output terminal, observasi live, log yang direduksi, atau
tautan artefak. Body memberikan niat dan validasi yang berguna; reviewer
memeriksa kode, test, dan CI untuk menilai kebenaran.

Ketika check gagal, perbarui body PR alih-alih mendorong commit kode lain.

## Scope dan routing

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh test unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area berscope berubah.

- **Edit workflow CI** memvalidasi graph CI Node plus linting workflow, tetapi tidak memaksa build native Windows, iOS, Android, atau macOS dengan sendirinya; lane platform tersebut tetap dibatasi ke perubahan source platform.
- **Sanity Workflow** menjalankan `actionlint`, `zizmor` atas semua file YAML workflow, guard interpolasi composite-action, dan guard marker konflik. Job `security-fast` yang berscope PR juga menjalankan `zizmor` atas file workflow yang berubah sehingga temuan keamanan workflow gagal lebih awal di graph CI utama.
- **Docs pada push `main`** diperiksa oleh workflow mandiri `Docs` dengan mirror docs ClawHub yang sama yang digunakan CI, sehingga push campuran kode+docs tidak juga mengantrekan shard `check-docs` CI. Pull request dan CI manual tetap menjalankan `check-docs` dari CI ketika docs berubah.
- **TUI PTY** berjalan di shard Linux Node `checks-node-core-runtime-tui-pty` untuk perubahan TUI. Shard menjalankan `test/vitest/vitest.tui-pty.config.ts` dengan `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, sehingga mencakup lane fixture `TuiBackend` deterministik dan smoke `tui --local` yang lebih lambat yang hanya melakukan mock pada endpoint model eksternal.
- **Edit khusus routing CI, edit fixture core-test murah terpilih, dan edit helper/test-routing kontrak plugin yang sempit** menggunakan path manifes khusus Node cepat: `preflight`, security, dan satu task `checks-fast-core`. Path itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard inti penuh, shard bundled-plugin, dan matriks guard tambahan ketika perubahan terbatas pada permukaan routing atau helper yang langsung diuji oleh task cepat.
- **Check Node Windows** dibatasi ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang mengeksekusi lane tersebut; perubahan source, plugin, install-smoke, dan khusus test yang tidak terkait tetap berada di lane Linux Node.

Keluarga pengujian Node yang paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil tanpa mencadangkan runner secara berlebihan: kontrak Plugin dan kontrak channel masing-masing berjalan sebagai dua shard berbobot yang didukung Blacksmith dengan fallback runner GitHub standar, lane core unit fast/support berjalan terpisah, infrastruktur runtime core dipecah antara state, process/config, shared, dan tiga shard domain cron, auto-reply berjalan sebagai worker seimbang (dengan subtree reply dipecah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi gateway/server agentic dipecah ke lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artefak yang sudah dibangun. CI normal kemudian hanya mengemas shard pola include infrastruktur yang terisolasi ke dalam bundle deterministik berisi paling banyak 64 file pengujian, mengurangi matriks Node tanpa menggabungkan suite command/cron yang tidak terisolasi, agents-core yang stateful, atau gateway/server; suite berat tetap menggunakan 8 vCPU sementara lane yang dibundel dan berbobot lebih rendah menggunakan 4 vCPU. Pull request pada repositori kanonik menggunakan rencana admission ringkas tambahan: grup per konfigurasi yang sama berjalan dalam subprocess terisolasi di dalam rencana Linux Node 34-job saat ini, sehingga satu PR tidak mendaftarkan seluruh matriks Node 70-plus-job. Push ke `main`, dispatch manual, dan gate rilis tetap mempertahankan matriks penuh. Pengujian browser luas, QA, media, dan Plugin lain-lain menggunakan konfigurasi Vitest khusus masing-masing, bukan catch-all Plugin bersama. Shard pola include mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan konfigurasi utuh dari shard yang difilter. `check-additional-*` menyatukan pekerjaan compile/canary batas paket dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar boundary guard distripe menjadi satu shard yang berat prompt dan satu shard gabungan untuk stripe guard yang tersisa, masing-masing menjalankan guard independen terpilih secara bersamaan dan mencetak timing per check. Pemeriksaan drift snapshot prompt happy-path Codex yang mahal berjalan sebagai job tambahan tersendiri hanya untuk CI manual dan perubahan yang memengaruhi prompt, sehingga perubahan Node normal yang tidak terkait tidak menunggu di belakang pembuatan snapshot prompt dingin dan shard boundary tetap seimbang sementara drift prompt masih dipatok ke PR yang menyebabkannya; flag yang sama melewati pembuatan snapshot prompt Vitest di dalam shard core support-boundary artefak build. Gateway watch, pengujian channel, dan shard core support-boundary berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

Setelah diterima, CI Linux kanonik mengizinkan hingga 24 job pengujian Node
secara bersamaan dan 12 untuk lane fast/check yang lebih kecil; Windows dan
Android tetap dua karena pool runner tersebut lebih sempit.

Rencana PR ringkas menghasilkan 18 job Node untuk suite saat ini: grup
whole-config dibatch dalam subprocess terisolasi dengan timeout batch 120 menit,
sementara grup pola include berbagi anggaran job terbatas yang sama.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor third-party tidak memiliki source set atau manifest terpisah; lane unit-test-nya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass produksi Knip khusus dependensi yang dipatok ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file tidak terpakai produksi dari Knip dengan `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak terpakai gagal saat PR menambahkan file tidak terpakai baru yang belum ditinjau atau meninggalkan entri allowlist usang, sambil mempertahankan permukaan Plugin dinamis, generated, build, live-test, dan package bridge yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow memiliki empat lane:

- `clawsweeper_item` untuk permintaan peninjauan issue dan pull request yang spesifik;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit di komentar issue;
- `clawsweeper_commit_review` untuk permintaan peninjauan tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis event, action, aktor, repositori, nomor item, URL, judul, state, dan kutipan pendek untuk komentar atau review jika ada. Ini sengaja menghindari penerusan seluruh body Webhook. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan seharusnya memposting ke `#clawsweeper` hanya ketika event tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise Webhook duplikat, dan traffic review normal seharusnya menghasilkan `NO_REPLY`.

Perlakukan judul GitHub, komentar, body, teks review, nama branch, dan pesan commit sebagai data yang tidak tepercaya di sepanjang jalur ini. Semuanya adalah input untuk peringkasan dan triase, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan graf job yang sama seperti CI normal tetapi memaksa setiap lane scoped non-Android aktif: shard Linux Node, shard bundled-plugin, shard kontrak Plugin dan channel, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak build, pemeriksaan docs, Skills Python, Windows, macOS, build iOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android hanya dengan `include_android=true`; umbrella rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prerelease Plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan lane Docker prerelease Plugin dikecualikan dari CI. Suite prerelease Docker hanya berjalan ketika `Full Release Validation` mengirim workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup concurrency unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh push atau run PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan caller tepercaya menjalankan graf tersebut terhadap branch, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch CI manual dan fallback repositori non-kanonik, pemindaian kualitas JavaScript/actions CodeQL, workflow-sanity, labeler, auto-response, workflow docs di luar CI, dan preflight install-smoke agar matriks Blacksmith dapat masuk antrean lebih awal                                  |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard ekstensi berbobot lebih rendah, `checks-fast-core`, shard kontrak Plugin/channel, sebagian besar shard Linux Node bundled/berbobot lebih rendah, `check-guards`, `check-prod-types`, `check-test-types`, shard `check-additional-*` terpilih, dan `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suite Linux Node berat yang dipertahankan, shard `check-additional-*` yang berat boundary/ekstensi, dan `android`                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (cukup sensitif CPU sehingga 8 vCPU memakan biaya lebih besar daripada penghematan yang diberikannya); build Docker install-smoke (waktu antrean 32-vCPU memakan biaya lebih besar daripada penghematan yang diberikannya)                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` dan `ios-build` pada `openclaw/openclaw`; fork fallback ke `macos-26`                                                                                                                                                                                                  |

## Anggaran pendaftaran runner

Bucket pendaftaran runner GitHub OpenClaw saat ini mengizinkan 3.000 pendaftaran
runner self-hosted per 5 menit. Batas tersebut dibagi oleh semua pendaftaran
runner Blacksmith di organisasi `openclaw`, sehingga menambahkan instalasi
Blacksmith lain tidak menambahkan bucket baru.

Perlakukan label Blacksmith sebagai sumber daya langka untuk kontrol burst. Job
yang hanya merutekan, memberi notifikasi, meringkas, memilih shard, atau
menjalankan pemindaian CodeQL singkat sebaiknya tetap berada di runner yang
dihosting GitHub kecuali ada kebutuhan khusus Blacksmith yang terukur. Setiap
matriks Blacksmith baru, `max-parallel` yang lebih besar, atau workflow
berfrekuensi tinggi harus menunjukkan jumlah pendaftaran kasus terburuknya dan
menjaga target tingkat organisasi di bawah 2.000 pendaftaran per 5 menit,
menyisakan ruang untuk repositori bersamaan dan job yang dicoba ulang.

CI repo kanonik menjaga Blacksmith sebagai jalur runner default untuk run push dan pull-request normal. `workflow_dispatch` dan run repositori non-kanonik menggunakan runner yang dihosting GitHub, tetapi run kanonik normal saat ini tidak memeriksa kesehatan antrean Blacksmith atau otomatis fallback ke label yang dihosting GitHub ketika Blacksmith tidak tersedia.

## Ekuivalen lokal

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Kinerja OpenClaw

`OpenClaw Performance` adalah alur kerja kinerja produk/runtime. Alur kerja ini berjalan setiap hari di `main` dan dapat dijalankan secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch manual biasanya melakukan benchmark terhadap ref alur kerja. Tetapkan `target_ref` untuk melakukan benchmark terhadap tag rilis atau cabang lain dengan implementasi alur kerja saat ini. Jalur laporan yang dipublikasikan dan pointer terbaru diberi kunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA alur kerja, ref Kova, profil, mode auth lane, model, jumlah pengulangan, dan filter skenario.

Alur kerja menginstal OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan auth kompatibel OpenAI palsu yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, Gateway, dan giliran agen.
- `live-openai-candidate`: giliran agen OpenAI `openai/gpt-5.5` nyata, dilewati saat `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah proses Kova: waktu boot Gateway dan memori pada kasus startup default, hook, dan 50-Plugin; RSS impor Plugin bawaan, loop halo `channel-chat-baseline` mock-OpenAI berulang, perintah startup CLI terhadap Gateway yang sudah berjalan, dan probe kinerja smoke status SQLite. Saat laporan sumber mock-provider sebelumnya yang dipublikasikan tersedia untuk ref yang diuji, ringkasan sumber membandingkan nilai RSS dan heap saat ini terhadap baseline tersebut dan menandai kenaikan RSS besar sebagai `watch`. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundel laporan, dengan JSON mentah di sebelahnya.

Setiap lane mengunggah artefak GitHub. Saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, alur kerja juga melakukan commit `report.json`, `report.md`, bundel, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer tested-ref saat ini ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah alur kerja payung manual untuk "jalankan semuanya sebelum rilis." Alur kerja ini menerima cabang, tag, atau SHA commit lengkap, menjalankan alur kerja manual `CI` dengan target tersebut, menjalankan `Plugin Prerelease` untuk bukti khusus rilis Plugin/paket/statis/Docker, dan menjalankan `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, pemeriksaan paket lintas OS, rendering kartu skor kematangan dari bukti profil QA, paritas QA Lab, Matrix, dan lane Telegram. Profil stabil dan penuh selalu menyertakan cakupan live/E2E menyeluruh dan soak jalur rilis Docker; profil beta dapat ikut serta dengan `run_release_soak=true`. E2E Telegram paket kanonis berjalan di dalam Package Acceptance, sehingga kandidat penuh tidak memulai poller live duplikat. Setelah publikasi, berikan `release_package_spec` untuk memakai ulang paket npm yang sudah dikirim di seluruh release checks, Package Acceptance, Docker, lintas OS, dan Telegram tanpa membangun ulang. Gunakan `npm_telegram_package_spec` hanya untuk rerun Telegram paket terpublikasi yang terfokus. Lane paket live Plugin Codex menggunakan status terpilih yang sama secara default: `release_package_spec=openclaw@<tag>` yang dipublikasikan menurunkan `codex_plugin_spec=npm:@openclaw/codex@<tag>`, sedangkan run SHA/artefak mengemas `extensions/codex` dari ref terpilih. Tetapkan `codex_plugin_spec` secara eksplisit untuk sumber Plugin kustom seperti spesifikasi `npm:`, `npm-pack:`, atau `git:`.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama job alur kerja yang tepat, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah alur kerja rilis manual yang melakukan mutasi. Jalankan
dari `release/YYYY.M.PATCH` atau `main` setelah tag rilis ada dan setelah
preflight npm OpenClaw berhasil. Alur kerja ini memverifikasi `pnpm plugins:sync:check`,
menjalankan `Plugin NPM Release` untuk semua paket Plugin yang dapat dipublikasikan, menjalankan
`Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru kemudian menjalankan
`OpenClaw NPM Release` dengan `preflight_run_id` yang disimpan. Publikasi stabil juga
memerlukan `windows_node_tag` yang tepat; alur kerja memverifikasi rilis sumber Windows
dan membandingkan installer x64/ARM64-nya dengan input
`windows_node_installer_digests` yang disetujui kandidat sebelum child publikasi apa pun, lalu mempromosikan
dan memverifikasi digest installer yang dipin yang sama beserta kontrak aset pendamping
dan checksum yang tepat sebelum memublikasikan draf rilis GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Untuk bukti commit yang disematkan pada branch yang bergerak cepat, gunakan helper alih-alih
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref dispatch workflow GitHub harus berupa branch atau tag, bukan SHA commit mentah. Helper
mendorong branch sementara `release-ci/<sha>-...` pada SHA target,
menjalankan `Full Release Validation` dari ref yang disematkan itu, memverifikasi setiap
workflow anak `headSha` cocok dengan target, dan menghapus branch sementara saat
run selesai. Verifikator payung juga gagal jika ada workflow anak yang berjalan pada
SHA yang berbeda.

`release_profile` mengontrol cakupan live/provider yang diteruskan ke pemeriksaan rilis. Workflow
rilis manual default ke `stable`; gunakan `full` hanya saat Anda
secara sengaja menginginkan matriks provider/media advisory yang luas. Pemeriksaan rilis stable dan full
selalu menjalankan soak jalur rilis live/E2E lengkap dan Docker; profil beta
dapat ikut serta dengan `run_release_soak=true`.

- `minimum` mempertahankan lane OpenAI/core paling cepat yang kritis untuk rilis.
- `stable` menambahkan set provider/backend stable.
- `full` menjalankan matriks provider/media advisory yang luas.

Payung mencatat id run anak yang dijalankan, dan job akhir `Verify full validation` memeriksa ulang kesimpulan run anak saat ini dan menambahkan tabel job paling lambat untuk setiap run anak. Jika workflow anak dijalankan ulang dan menjadi hijau, jalankan ulang hanya job verifikator induk untuk menyegarkan hasil payung dan ringkasan waktu.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk anak CI penuh normal, `plugin-prerelease` hanya untuk anak prarilis plugin, `release-checks` untuk setiap anak rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane cross-OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah cross-OS yang panjang mengeluarkan baris heartbeat dan ringkasan packaged-upgrade menyertakan waktu per fase. Lane pemeriksaan rilis QA bersifat advisory kecuali gerbang cakupan tool runtime standar, yang memblokir saat tool dinamis OpenClaw yang wajib bergeser atau hilang dari ringkasan tier standar.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref yang dipilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke pemeriksaan cross-OS dan Package Acceptance, ditambah workflow Docker jalur rilis live/E2E saat cakupan soak berjalan. Ini menjaga byte package konsisten di seluruh kotak rilis dan menghindari repacking kandidat yang sama di beberapa job anak. Untuk lane live npm-plugin Codex, pemeriksaan rilis meneruskan spec plugin terpublikasi yang cocok yang diturunkan dari `release_package_spec`, meneruskan `codex_plugin_spec` yang disediakan operator, atau membiarkan input kosong agar skrip Docker mengemas plugin Codex dari checkout yang dipilih.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan payung yang lebih lama. Monitor induk membatalkan workflow anak apa pun yang
sudah dijalankannya saat induk dibatalkan, sehingga validasi main yang lebih baru
tidak menunggu di belakang run release-check dua jam yang usang. Validasi branch/tag
rilis dan grup rerun terfokus mempertahankan `cancel-in-progress: false`.

## Shard Live dan E2E

Anak live/E2E rilis mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs` alih-alih satu job serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- job `native-live-src-gateway-profiles` yang difilter provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard media audio/video terpisah dan shard musik yang difilter provider

Ini mempertahankan cakupan file yang sama sekaligus membuat kegagalan provider live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh workflow `Live Media Runner Image`. Image itu sudah memasang `ffmpeg` dan `ffprobe`; job media hanya memverifikasi biner sebelum setup. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job container bukan tempat yang tepat untuk meluncurkan pengujian Docker bersarang.

Shard model/backend live berbasis Docker menggunakan image bersama `ghcr.io/openclaw/openclaw-live-test:<sha>` terpisah per commit yang dipilih. Alur kerja rilis live membangun dan mendorong image itu sekali, lalu shard model live Docker, gateway yang dishard berdasarkan penyedia, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Gateway Docker membawa batas `timeout` tingkat skrip yang eksplisit di bawah timeout job alur kerja sehingga kontainer yang macet atau jalur pembersihan gagal cepat alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah konfigurasi dan akan membuang waktu wall clock untuk build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness E2E Docker yang sama yang dijalankan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref alur kerja, ref paket, versi, SHA-256, dan profil dalam ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Alur kerja reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker package-digest bila diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket itu alih-alih mengemas checkout alur kerja. Ketika sebuah profil memilih beberapa `docker_lanes` bertarget, alur kerja reusable menyiapkan paket dan image bersama sekali, lalu menyebarkan lane tersebut sebagai job Docker bertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama ketika Package Acceptance menyelesaikan satu paket; dispatch Telegram mandiri masih dapat menginstal spesifikasi npm yang telah dipublikasikan.
4. `summary` menggagalkan alur kerja jika resolusi paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prarilis/stabil yang telah dipublikasikan.
- `source=ref` mengemas branch, tag, atau SHA commit penuh `package_ref` tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, menginstal dependensi dalam worktree terpisah, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS publik; `package_sha256` wajib. Jalur ini menolak kredensial URL, port HTTPS non-default, hostname atau IP hasil resolusi yang privat/internal/penggunaan khusus, dan redirect di luar kebijakan keamanan publik yang sama.
- `source=trusted-url` mengunduh `.tgz` HTTPS dari kebijakan trusted-source bernama dalam `.github/package-trusted-sources.json`; `package_sha256` dan `trusted_source_id` wajib. Gunakan ini hanya untuk mirror enterprise milik maintainer atau repositori paket privat yang memerlukan host, port, prefiks path, host redirect, atau resolusi jaringan privat yang dikonfigurasi. Jika kebijakan mendeklarasikan auth bearer, alur kerja menggunakan secret tetap `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; kredensial yang disematkan di URL tetap ditolak.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode alur kerja/harness tepercaya yang menjalankan tes. `package_ref` adalah commit sumber yang dikemas ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika alur kerja lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` ditambah `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — potongan jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` yang tepat; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan ulang artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan khusus pengujian pembaruan dan Plugin, termasuk perintah lokal,
lane Docker, input Package Acceptance, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Package Acceptance dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, pembaruan, instalasi skill ClawHub live, pembersihan dependensi Plugin usang, perbaikan instalasi Plugin yang dikonfigurasi, Plugin offline, plugin-update, dan bukti Telegram pada tarball paket hasil resolusi yang sama. Tetapkan `release_package_spec` pada Full Release Validation atau OpenClaw Release Checks setelah memublikasikan beta untuk menjalankan matriks yang sama terhadap paket npm yang dikirim tanpa membangun ulang; tetapkan `package_acceptance_package_spec` hanya ketika Package Acceptance membutuhkan paket yang berbeda dari validasi rilis lainnya. Pemeriksaan rilis lintas OS tetap mencakup onboarding, installer, dan perilaku platform spesifik OS; validasi produk paket/pembaruan harus dimulai dengan Package Acceptance. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run dalam jalur rilis blocking. Dalam Package Acceptance, tarball `package-under-test` yang diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline terpublikasi fallback, dengan default `openclaw@latest`; perintah rerun lane yang gagal mempertahankan baseline itu. Full Release Validation dengan `run_release_soak=true` atau `release_profile=full` menetapkan `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas cakupan ke empat rilis npm stabil terbaru ditambah rilis batas kompatibilitas Plugin yang dipin dan fixture berbentuk issue untuk config Feishu, file bootstrap/persona yang dipertahankan, instalasi Plugin OpenClaw yang dikonfigurasi, path log tilde, dan root dependensi Plugin legacy usang. Pilihan survivor published-upgrade multi-baseline dishard menurut baseline ke job runner Docker bertarget terpisah. Alur kerja `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah pembersihan pembaruan terpublikasi yang menyeluruh, bukan cakupan Full Release CI normal. Run agregat lokal dapat meneruskan spesifikasi paket yang tepat dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane terpublikasi mengonfigurasi baseline dengan resep perintah `openclaw config set` yang sudah dipanggang, mencatat langkah resep dalam `summary.json`, dan memeriksa `/healthz`, `/readyz`, serta status RPC setelah Gateway dimulai. Lane paket dan installer baru Windows juga memverifikasi bahwa paket yang diinstal dapat mengimpor override browser-control dari path Windows absolut mentah. Smoke agent-turn lintas OS OpenAI menggunakan default `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika disetel, jika tidak `openai/gpt-5.5`, sehingga bukti instalasi dan gateway tetap berada pada model uji GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Package Acceptance memiliki jendela kompatibilitas legacy terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui di `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `patchedDependencies` pnpm yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` persisten yang hilang;
- smoke Plugin dapat membaca lokasi install-record legacy atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata config sambil tetap mewajibkan install record dan perilaku tanpa reinstall tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memberi peringatan untuk file stamp metadata build lokal yang sudah dikirim. Paket setelahnya harus memenuhi kontrak modern; kondisi yang sama gagal alih-alih memberi peringatan atau dilewati.

### Contoh

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Saat men-debug run penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa run turunan `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Lebih baik menjalankan ulang profil paket yang gagal atau lane Docker yang tepat daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Alur kerja `Install Smoke` terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifest plugin bawaan, atau permukaan plugin/channel/gateway/Plugin SDK inti yang diuji oleh pekerjaan smoke Docker. Perubahan plugin bawaan yang hanya source, edit yang hanya test, dan edit yang hanya docs tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root sekali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e container gateway-network, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker plugin bawaan terbatas di bawah timeout perintah agregat 240 detik (setiap Docker run skenario dibatasi terpisah).
- **Jalur penuh** mempertahankan cakupan instal paket QR dan installer Docker/update untuk jadwal nightly, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instal paket QR, smoke Dockerfile/gateway root, smoke installer/update, dan E2E Docker plugin bawaan cepat sebagai pekerjaan terpisah agar pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; ketika logika changed-scope akan meminta cakupan penuh pada sebuah push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instal penuh ke validasi nightly atau rilis.

Smoke image-provider instal global Bun yang lambat dikawal secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal nightly dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat memilih untuk menyertakannya, tetapi pull request dan push `main` tidak. CI PR normal tetap menjalankan lane regresi peluncur Bun cepat untuk perubahan yang relevan dengan Node. Test QR dan installer Docker mempertahankan Dockerfile yang berfokus pada instal miliknya sendiri.

## E2E Docker Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git dasar untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi plan yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Yang Dapat Disetel

| Variabel                               | Default | Tujuan                                                                                             |
| -------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap provider.                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live konkuren agar provider tidak melakukan throttle.                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Batas lane instal npm konkuren.                                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service konkuren.                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antarawal lane untuk menghindari lonjakan create daemon Docker; setel `0` untuk tanpa jeda.   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/tail terpilih memakai batas yang lebih ketat.     |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak plan scheduler tanpa menjalankan lane.                                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agent dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya tetap dapat dimulai dari pool kosong, lalu berjalan sendiri sampai melepaskan kapasitas. Preflight agregat lokal memeriksa Docker, menghapus container E2E OpenClaw yang usang, memancarkan status active-lane, mempertahankan timing lane untuk pengurutan longest-first, dan secara default berhenti menjadwalkan lane pooled baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan `scripts/test-docker-all.mjs --plan-json` cakupan paket, jenis image, image live, lane, dan kredensial mana yang diperlukan. `scripts/docker-e2e.mjs` lalu mengubah plan itu menjadi output dan ringkasan GitHub. Workflow ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket current-run, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/functional bertag package-digest melalui cache layer Docker Blacksmith ketika plan memerlukan lane package-installed; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang diberikan atau image package-digest yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout per percobaan terbatas 180 detik sehingga stream registry/cache yang macet mencoba ulang dengan cepat alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan pekerjaan chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkannya dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `package-update-openai` mencakup lane paket plugin Codex live, yang menginstal paket kandidat OpenClaw, menginstal plugin Codex dari `codex_plugin_spec` atau tarball same-ref dengan persetujuan instal CLI Codex eksplisit, menjalankan preflight CLI Codex, lalu menjalankan beberapa turn agent OpenClaw same-session terhadap OpenAI. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer provider.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` ketika cakupan release-path penuh memintanya, dan mempertahankan chunk `openwebui` mandiri hanya untuk dispatch khusus OpenWebUI. Lane update bundled-channel mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON plan scheduler, tabel slow-lane, dan perintah rerun per lane. Input workflow `docker_lanes` menjalankan lane terpilih terhadap image yang disiapkan alih-alih pekerjaan chunk, sehingga debugging failed-lane terbatas pada satu pekerjaan Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk run itu; jika lane terpilih adalah lane Docker live, pekerjaan tertarget membangun image live-test secara lokal untuk rerun tersebut. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan ketika nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, sehingga menjadi workflow terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri membiarkan suite itu nonaktif. Workflow ini menyeimbangkan test plugin bawaan di delapan worker ekstensi; pekerjaan shard ekstensi tersebut menjalankan hingga dua grup konfigurasi plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch plugin yang berat impor tidak membuat pekerjaan CI tambahan. Jalur prerelease Docker khusus rilis membatch lane Docker tertarget dalam grup kecil untuk menghindari pencadangan puluhan runner bagi pekerjaan satu hingga tiga menit. Workflow ini juga mengunggah artefak informasional `plugin-inspector-advisory` dari `@openclaw/plugin-inspector`; temuan inspector adalah masukan triase dan tidak mengubah gate pemblokir Plugin Prerelease.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow smart-scoped utama. Paritas agentik berada di bawah harness QA dan rilis yang luas, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus ikut dalam run validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan nightly pada `main` dan pada dispatch manual; workflow ini mem-fan out lane paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai pekerjaan paralel. Pekerjaan live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan provider mock deterministik dan model berkualifikasi mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup provider-plugin normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas provider dicakup oleh suite model live, provider native, dan provider Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu membagi cakupan Matrix penuh ke dalam pekerjaan `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan paket kandidat dan baseline sebagai pekerjaan lane paralel, lalu mengunduh kedua artefak ke pekerjaan laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/check yang terscope alih-alih memperlakukan paritas sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja menjadi pemindai keamanan first-pass yang sempit, bukan sweep repositori penuh. Run harian, manual, dan penjaga pull request non-draft memindai kode workflow Actions ditambah permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan high-confidence yang difilter ke `security-severity` high/critical.

Penjaga pull request tetap ringan: ia hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan high-confidence yang sama dengan workflow terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                         | Permukaan                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret, sandbox, Cron, dan baseline Gateway                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti plus runtime plugin channel, Gateway, Plugin SDK, secret, titik sentuh audit                      |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, parsing IP, penjaga jaringan, web-fetch, dan SSRF Plugin SDK                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gate eksekusi tool agen                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan kontrak package Plugin install, loader, manifest, registry, instalasi package-manager, source-loading, dan Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi runtime bahkan ketika bersih.

### Kategori Critical Quality

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ini hanya menjalankan query kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error pada permukaan sempit bernilai tinggi di runner Linux yang di-host GitHub agar pemindaian kualitas tidak memakai anggaran registrasi runner Blacksmith. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draf hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk perubahan kode eksekusi perintah/model/tool agen dan dispatch balasan, kode schema/migrasi/IO config, kode auth/secret/sandbox/keamanan, runtime plugin channel inti dan channel bawaan, protokol/metode-server Gateway, glue runtime/SDK memori, MCP/proses/pengiriman keluar, katalog runtime/model provider, antrean diagnostik/pengiriman sesi, loader plugin, Plugin SDK/kontrak-package, atau runtime balasan Plugin SDK. Perubahan config CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                               | Permukaan                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan auth, secret, sandbox, Cron, dan Gateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Kontrak schema config, migrasi, normalisasi, dan IO                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema protokol Gateway dan kontrak metode server                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi plugin channel inti dan channel bawaan                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi perintah, dispatch model/provider, dispatch dan antrean auto-reply, serta control-plane ACP                                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge tool, helper supervisi proses, serta kontrak pengiriman keluar                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, facade runtime memori, alias Plugin SDK memori, glue aktivasi runtime memori, dan perintah doctor memori                                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundle event/log diagnostik, dan kontrak CLI doctor sesi      |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread              |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, serta registry web/search/fetch/embedding          |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, persistensi lokal, alur kontrol Gateway, dan kontrak runtime control-plane task                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, image-generation, dan media-generation                                                          |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak entrypoint loader, registry, permukaan publik, dan Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source Plugin SDK sisi package yang dipublikasikan dan helper kontrak package plugin                                                                              |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan plugin bawaan sebaiknya ditambahkan kembali sebagai pekerjaan lanjutan yang ter-scope atau di-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Workflow pemeliharaan

### Docs Agent

Workflow `Docs Agent` adalah jalur pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru mendarat. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Invokasi workflow-run dilewati ketika `main` sudah bergerak lanjut atau ketika run Docs Agent non-skipped lain dibuat dalam satu jam terakhir. Saat berjalan, ini meninjau rentang commit dari SHA sumber Docs Agent non-skipped sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pass dokumen terakhir.

### Test Performance Agent

Workflow `Test Performance Agent` adalah jalur pemeliharaan Codex berbasis event untuk test yang lambat. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, tetapi ini dilewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gate aktivitas harian itu. Jalur ini membangun laporan performa Vitest full-suite yang dikelompokkan, membiarkan Codex hanya membuat perbaikan performa test kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah baseline test yang lulus. Laporan yang dikelompokkan mencatat wall time per config dan max RSS di Linux dan macOS, sehingga perbandingan sebelum/sesudah menampilkan delta memori test di samping delta durasi. Jika baseline memiliki test yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lulus sebelum apa pun di-commit. Saat `main` maju sebelum push bot mendarat, jalur ini melakukan rebase patch tervalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch basi yang konflik dilewati. Ini menggunakan Ubuntu yang di-host GitHub sehingga action Codex dapat mempertahankan postur keamanan drop-sudo yang sama dengan agen dokumen.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat pasca-mendarat. Default-nya adalah dry-run dan hanya menutup PR yang dicantumkan secara eksplisit ketika `apply=true`. Sebelum memutasi GitHub, ini memverifikasi bahwa PR yang mendarat sudah di-merge dan setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gate pemeriksaan lokal itu lebih ketat tentang batas arsitektur dibandingkan scope platform CI yang luas:

- perubahan produksi inti menjalankan typecheck core prod dan core test plus lint/guard inti;
- perubahan inti khusus test hanya menjalankan typecheck core test plus lint inti;
- perubahan produksi ekstensi menjalankan typecheck extension prod dan extension test plus lint ekstensi;
- perubahan ekstensi khusus test menjalankan typecheck extension test plus lint ekstensi;
- perubahan Plugin SDK publik atau kontrak plugin meluas ke typecheck ekstensi karena ekstensi bergantung pada kontrak inti tersebut (sweep ekstensi Vitest tetap menjadi pekerjaan test eksplisit);
- bump versi metadata rilis saja menjalankan pemeriksaan versi/config/dependensi-root yang ditargetkan;
- perubahan root/config yang tidak dikenal fail safe ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit test langsung menjalankan dirinya sendiri, edit source memprioritaskan mapping eksplisit, lalu test sibling dan dependensi import-graph. Config pengiriman group-room bersama adalah salah satu mapping eksplisit: perubahan pada config balasan terlihat grup, mode pengiriman balasan source, atau prompt sistem message-tool dirutekan melalui test balasan inti plus regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas pada harness sehingga set murah yang dipetakan bukan proxy yang dapat dipercaya.

## Validasi Testbox

Crabbox adalah wrapper remote-box milik repo untuk proof Linux maintainer. Gunakan dari root repo ketika pemeriksaan terlalu luas untuk loop edit lokal, ketika paritas CI penting, atau ketika proof membutuhkan secret, Docker, lane package, box yang dapat digunakan ulang, atau log remote. Backend OpenClaw normal adalah `blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah fallback untuk gangguan Blacksmith, masalah kuota, atau pengujian kapasitas milik sendiri secara eksplisit.

Crabbox yang didukung Blacksmith menjalankan pemanasan, klaim, sinkronisasi, eksekusi, pelaporan, dan pembersihan
Testbox sekali pakai. Pemeriksaan kewajaran sinkronisasi bawaan gagal cepat ketika file
root yang diperlukan seperti `pnpm-lock.yaml` menghilang atau ketika `git status --short`
menampilkan setidaknya 200 penghapusan terlacak. Untuk PR penghapusan besar yang disengaja, atur
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk perintah jarak jauh.

Crabbox juga menghentikan pemanggilan CLI Blacksmith lokal yang tetap berada dalam
fase sinkronisasi selama lebih dari lima menit tanpa keluaran pascasinkronisasi. Atur
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` untuk menonaktifkan pelindung tersebut, atau gunakan nilai
milidetik yang lebih besar untuk diff lokal yang sangat besar.

Sebelum eksekusi pertama, periksa wrapper dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo menolak biner Crabbox usang yang tidak mengiklankan `blacksmith-testbox`. Teruskan penyedia secara eksplisit meskipun `.crabbox.yaml` memiliki default owned-cloud. Di worktree Codex atau checkout tertaut/sparse, hindari skrip lokal `pnpm crabbox:run` karena pnpm dapat merekonsiliasi dependensi sebelum Crabbox dimulai; panggil wrapper node secara langsung sebagai gantinya:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Eksekusi yang didukung Blacksmith memerlukan Crabbox 0.22.0 atau yang lebih baru agar wrapper mendapatkan perilaku sinkronisasi, antrean, dan pembersihan Testbox saat ini. Saat menggunakan checkout saudara, bangun ulang biner lokal yang diabaikan sebelum pekerjaan pengukuran waktu atau bukti:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Gate perubahan:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Eksekusi ulang pengujian terfokus:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Suite lengkap:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Baca ringkasan JSON akhir. Field yang berguna adalah `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Untuk eksekusi
Blacksmith Testbox yang didelegasikan, kode keluar wrapper Crabbox dan ringkasan JSON adalah
hasil perintah. Eksekusi GitHub Actions yang tertaut memiliki hidrasi dan keepalive; ia
dapat selesai sebagai `cancelled` ketika Testbox dihentikan secara eksternal setelah perintah SSH
sudah kembali. Perlakukan itu sebagai artefak pembersihan/status kecuali
`exitCode` wrapper bukan nol atau keluaran perintah menunjukkan pengujian gagal.
Eksekusi Crabbox sekali pakai yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis;
jika eksekusi terputus atau pembersihan tidak jelas, periksa box aktif dan hentikan hanya
box yang Anda buat:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gunakan penggunaan ulang hanya ketika Anda sengaja memerlukan beberapa perintah pada box terhidrasi yang sama:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jika Crabbox adalah lapisan yang rusak tetapi Blacksmith sendiri berfungsi, gunakan
Blacksmith langsung hanya untuk diagnostik seperti `list`, `status`, dan pembersihan. Perbaiki
jalur Crabbox sebelum memperlakukan eksekusi Blacksmith langsung sebagai bukti maintainer.

Jika `blacksmith testbox list --all` dan `blacksmith testbox status` berfungsi tetapi pemanasan baru
tetap `queued` tanpa IP atau URL eksekusi Actions setelah beberapa menit,
perlakukan itu sebagai tekanan penyedia Blacksmith, antrean, penagihan, atau batas org. Hentikan
id antrean yang Anda buat, hindari memulai Testbox tambahan, dan pindahkan bukti ke
jalur kapasitas Crabbox milik sendiri di bawah sambil seseorang memeriksa dasbor Blacksmith,
penagihan, dan batas org.

Eskalasi ke kapasitas Crabbox milik sendiri hanya ketika Blacksmith sedang down, dibatasi kuota, tidak memiliki lingkungan yang diperlukan, atau kapasitas milik sendiri secara eksplisit menjadi tujuan:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Di bawah tekanan AWS, hindari `class=beast` kecuali tugas benar-benar membutuhkan CPU kelas 48xlarge. Permintaan `beast` dimulai dari 192 vCPU dan merupakan cara termudah untuk memicu kuota regional EC2 Spot atau On-Demand Standard. `.crabbox.yaml` milik repo default ke `standard`, beberapa wilayah kapasitas, dan `capacity.hints: true` sehingga sewa AWS yang dibrokeri mencetak wilayah/pasar terpilih, tekanan kuota, fallback Spot, dan peringatan kelas tekanan tinggi. Gunakan `fast` untuk pemeriksaan luas yang lebih berat, `large` hanya setelah standard/fast tidak cukup, dan `beast` hanya untuk lane luar biasa yang terikat CPU seperti suite lengkap atau matriks Docker semua Plugin, validasi rilis/blocker eksplisit, atau profiling performa core tinggi. Jangan gunakan `beast` untuk `pnpm check:changed`, pengujian terfokus, pekerjaan khusus dokumen, lint/typecheck biasa, repro E2E kecil, atau triase gangguan Blacksmith. Gunakan `--market on-demand` untuk diagnosis kapasitas agar perubahan pasar Spot tidak tercampur ke dalam sinyal.

`.crabbox.yaml` memiliki default penyedia, sinkronisasi, dan hidrasi GitHub Actions untuk lane owned-cloud. File ini mengecualikan `.git` lokal sehingga checkout Actions yang terhidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote lokal maintainer dan penyimpanan objek, dan mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, penyiapan Node/pnpm, fetch `origin/main`, dan handoff lingkungan non-rahasia untuk perintah owned-cloud `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
