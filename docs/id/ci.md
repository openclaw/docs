---
read_when:
    - Anda perlu memahami mengapa sebuah pekerjaan CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan eksekusi atau eksekusi ulang validasi rilis
    - Anda mengubah dispatch ClawSweeper atau penerusan aktivitas GitHub
summary: Graf tugas CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur CI
x-i18n:
    generated_at: "2026-07-04T06:50:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Push `main` kanonis pertama-tama melewati jendela penerimaan hosted-runner selama 90 detik. Grup konkurensi `CI` yang ada membatalkan proses tunggu tersebut saat commit yang lebih baru masuk, sehingga merge berurutan tidak masing-masing mendaftarkan matriks Blacksmith penuh. Pull request dan dispatch manual melewati masa tunggu. Job `preflight` lalu mengklasifikasikan diff dan mematikan lane mahal saat hanya area yang tidak terkait berubah. Run `workflow_dispatch` manual secara sengaja melewati scoping cerdas dan menyebarkan grafik penuh untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow [`Plugin Prerelease`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Full Release Validation`](#full-release-validation) atau dispatch manual eksplisit.

## Ikhtisar pipeline

| Job                                | Tujuan                                                                                                    | Kapan berjalan                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Mendeteksi perubahan khusus docs, scope yang berubah, extension yang berubah, dan membangun manifes CI    | Selalu pada push dan PR non-draft                   |
| `runner-admission`                 | Debounce hosted 90 detik untuk push `main` kanonis sebelum pekerjaan Blacksmith didaftarkan               | Setiap run CI; sleep hanya pada push `main` kanonis |
| `security-fast`                    | Deteksi private key, audit workflow yang berubah via `zizmor`, dan audit lockfile produksi                | Selalu pada push dan PR non-draft                   |
| `check-dependencies`               | Pass khusus dependency produksi Knip plus guard allowlist file tidak terpakai                             | Perubahan yang relevan dengan Node                  |
| `build-artifacts`                  | Build `dist/`, Control UI, pemeriksaan cepat built-CLI, pemeriksaan artefak built tertanam, dan artefak reusable | Perubahan yang relevan dengan Node                  |
| `checks-fast-core`                 | Lane kebenaran Linux cepat seperti bundled, protocol, QA Smoke CI, dan pemeriksaan routing CI             | Perubahan yang relevan dengan Node                  |
| `checks-fast-contracts-plugins-*`  | Dua pemeriksaan kontrak Plugin yang dishard                                                               | Perubahan yang relevan dengan Node                  |
| `checks-fast-contracts-channels-*` | Dua pemeriksaan kontrak channel yang dishard                                                              | Perubahan yang relevan dengan Node                  |
| `checks-node-core-*`               | Shard pengujian Core Node, tidak termasuk lane channel, bundled, contract, dan extension                  | Perubahan yang relevan dengan Node                  |
| `check-*`                          | Ekuivalen gate lokal utama yang dishard: tipe prod, lint, guard, tipe test, dan smoke ketat               | Perubahan yang relevan dengan Node                  |
| `check-additional-*`               | Arsitektur, drift boundary/prompt yang dishard, guard extension, boundary package, dan topologi runtime   | Perubahan yang relevan dengan Node                  |
| `checks-node-compat-node22`        | Lane build kompatibilitas Node 22 dan smoke                                                               | Dispatch CI manual untuk rilis                      |
| `check-docs`                       | Pemformatan docs, lint, dan pemeriksaan broken-link                                                       | Docs berubah                                        |
| `skills-python`                    | Ruff + pytest untuk Skills berbasis Python                                                               | Perubahan yang relevan dengan Python-skill          |
| `checks-windows`                   | Pengujian proses/path khusus Windows plus regresi specifier import runtime bersama                        | Perubahan yang relevan dengan Windows               |
| `macos-node`                       | Lane pengujian TypeScript macOS menggunakan artefak built bersama                                        | Perubahan yang relevan dengan macOS                 |
| `macos-swift`                      | Swift lint, build, dan pengujian untuk aplikasi macOS                                                     | Perubahan yang relevan dengan macOS                 |
| `ios-build`                        | Pembuatan proyek Xcode plus build simulator aplikasi iOS                                                  | Aplikasi iOS, shared app kit, atau perubahan Swabble |
| `android`                          | Unit test Android untuk kedua flavor plus satu build APK debug                                            | Perubahan yang relevan dengan Android               |
| `test-performance-agent`           | Optimisasi test lambat Codex harian setelah aktivitas tepercaya                                           | Sukses CI utama atau dispatch manual                |
| `openclaw-performance`             | Laporan performa runtime Kova harian/on-demand dengan lane mock-provider, deep-profile, dan GPT 5.5 live  | Terjadwal dan dispatch manual                       |

## Urutan fail-fast

1. `runner-admission` hanya menunggu untuk push `main` kanonis; push yang lebih baru membatalkan run sebelum registrasi Blacksmith.
2. `preflight` memutuskan lane mana yang benar-benar ada. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, dan `skills-python` gagal dengan cepat tanpa menunggu job artefak dan matriks platform yang lebih berat.
4. `build-artifacts` berjalan beririsan dengan lane Linux cepat sehingga konsumen hilir dapat mulai segera setelah build bersama siap.
5. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, dan `android`.

GitHub dapat menandai job yang tersupersesi sebagai `cancelled` saat push yang lebih baru masuk ke PR atau ref `main` yang sama. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Job matriks menggunakan `fail-fast: false`, dan `build-artifacts` melaporkan kegagalan embedded channel, core-support-boundary, dan gateway-watch secara langsung alih-alih mengantrekan job verifier kecil. Kunci konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga zombie di sisi GitHub pada grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

Gunakan `pnpm ci:timings`, `pnpm ci:timings:recent`, atau `node scripts/ci-run-timings.mjs <run-id>` untuk merangkum wall time, waktu antrean, job paling lambat, kegagalan, dan barrier fanout `pnpm-store-warmup` dari GitHub Actions. CI juga mengunggah ringkasan run yang sama sebagai artefak `ci-timings-summary`. Untuk timing build, periksa langkah `Build dist` pada job `build-artifacts`: `pnpm build:ci-artifacts` mencetak `[build-all] phase timings:` dan menyertakan `ui:build`; job juga mengunggah artefak `startup-memory`.

Untuk run pull request, job terminal timing-summary menjalankan helper dari revisi base tepercaya sebelum meneruskan `GH_TOKEN` ke `gh run view`. Ini menjaga query bertoken keluar dari kode yang dikendalikan branch sambil tetap merangkum run CI pull request saat ini.

## Konteks PR dan bukti

PR kontributor eksternal menjalankan gate konteks PR dan bukti dari `.github/workflows/real-behavior-proof.yml`. Workflow memeriksa commit base tepercaya dan hanya mengevaluasi body PR; workflow tidak mengeksekusi kode dari branch kontributor.

Gate berlaku untuk penulis PR yang bukan owner repository, member, collaborator, atau bot. Gate lulus saat body PR berisi bagian `What Problem This Solves` dan `Evidence` yang ditulis penulis. Bukti dapat berupa test terfokus, hasil CI, screenshot, rekaman, output terminal, observasi live, log yang disunting, atau tautan artefak. Body menyediakan intent dan validasi berguna; reviewer memeriksa kode, test, dan CI untuk menilai kebenaran.

Saat pemeriksaan gagal, perbarui body PR alih-alih mendorong commit kode lain.

## Scope dan routing

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area scoped berubah.

- **Edit workflow CI** memvalidasi grafik CI Node plus linting workflow, tetapi tidak memaksa build native Windows, iOS, Android, atau macOS dengan sendirinya; lane platform tersebut tetap di-scope ke perubahan source platform.
- **Workflow Sanity** menjalankan `actionlint`, `zizmor` pada semua file YAML workflow, guard interpolasi composite-action, dan guard conflict-marker. Job `security-fast` yang di-scope PR juga menjalankan `zizmor` pada file workflow yang berubah sehingga temuan keamanan workflow gagal lebih awal di grafik CI utama.
- **Docs pada push `main`** diperiksa oleh workflow `Docs` mandiri dengan mirror docs ClawHub yang sama seperti yang digunakan CI, sehingga push campuran code+docs tidak juga mengantrekan shard CI `check-docs`. Pull request dan CI manual tetap menjalankan `check-docs` dari CI saat docs berubah.
- **TUI PTY** berjalan di shard Linux Node `checks-node-core-runtime-tui-pty` untuk perubahan TUI. Shard menjalankan `test/vitest/vitest.tui-pty.config.ts` dengan `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, sehingga mencakup lane fixture `TuiBackend` deterministik dan smoke `tui --local` yang lebih lambat yang hanya memock endpoint model eksternal.
- **Edit khusus routing CI, edit fixture core-test murah terpilih, dan edit helper/test-routing kontrak Plugin yang sempit** menggunakan path manifes cepat khusus Node: `preflight`, keamanan, dan satu task `checks-fast-core`. Path tersebut melewati artefak build, kompatibilitas Node 22, kontrak channel, shard core penuh, shard bundled-plugin, dan matriks guard tambahan saat perubahan terbatas pada permukaan routing atau helper yang langsung dilatih task cepat.
- **Pemeriksaan Node Windows** di-scope ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang mengeksekusi lane tersebut; source, Plugin, install-smoke, dan perubahan khusus test yang tidak terkait tetap berada pada lane Linux Node.

Keluarga pengujian Node yang paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner berlebihan: kontrak plugin dan kontrak channel masing-masing berjalan sebagai dua shard berbobot yang didukung Blacksmith dengan fallback runner GitHub standar, lane core unit fast/support berjalan terpisah, infra runtime core dipecah antara state, process/config, shared, dan tiga shard domain cron, auto-reply berjalan sebagai worker seimbang (dengan subtree reply dipecah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi gateway/server agentic dipecah di lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artefak yang dibangun. CI normal kemudian hanya mengemas shard pola-include infra terisolasi ke dalam bundle deterministik berisi paling banyak 64 file pengujian, mengurangi matriks Node tanpa menggabungkan suite command/cron yang tidak terisolasi, agents-core stateful, atau gateway/server; suite tetap yang berat tetap memakai 8 vCPU sementara lane bundle dan berbobot lebih rendah memakai 4 vCPU. Pull request pada repositori kanonis menggunakan rencana penerimaan ringkas tambahan: grup per konfigurasi yang sama berjalan dalam subprocess terisolasi di dalam rencana Linux Node 34-job saat ini, sehingga satu PR tidak mendaftarkan seluruh matriks Node 70-plus-job. Push `main`, dispatch manual, dan gate rilis mempertahankan matriks penuh. Pengujian browser luas, QA, media, dan berbagai Plugin menggunakan konfigurasi Vitest khususnya alih-alih catch-all plugin bersama. Shard pola-include mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard yang difilter. `check-additional-*` menyatukan pekerjaan compile/canary batas paket dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar guard batas distripe menjadi satu shard berat prompt dan satu shard gabungan untuk stripe guard yang tersisa, masing-masing menjalankan guard independen terpilih secara bersamaan dan mencetak timing per check. Pemeriksaan drift snapshot prompt happy-path Codex yang mahal berjalan sebagai job tambahannya sendiri hanya untuk CI manual dan perubahan yang memengaruhi prompt, sehingga perubahan Node normal yang tidak terkait tidak menunggu di belakang generasi snapshot prompt dingin dan shard batas tetap seimbang sementara drift prompt tetap dipatok ke PR yang menyebabkannya; flag yang sama melewati generasi Vitest snapshot prompt di dalam shard support-boundary core artefak-bangun. Gateway watch, pengujian channel, dan shard support-boundary core berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

Setelah diterima, CI Linux kanonis mengizinkan hingga 24 job pengujian Node bersamaan dan
12 untuk lane fast/check yang lebih kecil; Windows dan Android tetap dua karena
pool runner tersebut lebih sempit.

Rencana PR ringkas menghasilkan 18 job Node untuk suite saat ini: grup konfigurasi-utuh
dibatch dalam subprocess terisolasi dengan timeout batch 120 menit,
sementara grup pola-include berbagi anggaran job terbatas yang sama.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane unit-test-nya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass dependency-only Knip produksi yang dipatok ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file tidak terpakai produksi dari Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak terpakai gagal ketika PR menambahkan file tidak terpakai baru yang belum direview atau meninggalkan entri allowlist basi, sambil mempertahankan permukaan Plugin dinamis, generated, build, live-test, dan package bridge yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow ini memiliki empat lane:

- `clawsweeper_item` untuk permintaan review issue dan pull request yang spesifik;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit di komentar issue;
- `clawsweeper_commit_review` untuk permintaan review tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang mungkin diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis event, action, aktor, repositori, nomor item, URL, judul, status, dan kutipan pendek untuk komentar atau review saat ada. Lane ini sengaja menghindari penerusan seluruh body Webhook. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord di prompt-nya dan sebaiknya memposting ke `#clawsweeper` hanya ketika event tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise Webhook duplikat, dan traffic review normal sebaiknya menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, body, teks review, nama branch, dan pesan commit GitHub sebagai data tidak tepercaya di sepanjang jalur ini. Itu adalah input untuk peringkasan dan triase, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan grafik job yang sama seperti CI normal tetapi memaksa setiap lane berscope non-Android aktif: shard Linux Node, shard Plugin bundle, shard kontrak Plugin dan channel, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak-bangun, pemeriksaan docs, Skills Python, Windows, macOS, build iOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android hanya dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prerelease Plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan lane Docker prerelease Plugin dikecualikan dari CI. Suite prerelease Docker hanya berjalan ketika `Full Release Validation` mendispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual memakai grup concurrency unik sehingga suite penuh release-candidate tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik tersebut terhadap branch, tag, atau SHA commit penuh sambil memakai file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Dispatch CI manual dan fallback repositori non-kanonis, pemindaian kualitas CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs di luar CI, dan preflight install-smoke agar matriks Blacksmith dapat mengantre lebih awal                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard ekstensi berbobot lebih rendah, `checks-fast-core` kecuali QA Smoke CI, shard kontrak Plugin/channel, sebagian besar shard Linux Node bundle/berbobot lebih rendah, `check-guards`, `check-prod-types`, `check-test-types`, shard `check-additional-*` terpilih, dan `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suite Linux Node berat yang dipertahankan, shard `check-additional-*` yang berat batas/ekstensi, dan `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` di CI dan Testbox, `check-lint` (cukup sensitif CPU sehingga 8 vCPU lebih mahal daripada penghematannya); build Docker install-smoke (waktu antre 32-vCPU lebih mahal daripada penghematannya)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` dan `ios-build` pada `openclaw/openclaw`; fork fallback ke `macos-26`                                                                                                                                                                                                                     |

## Anggaran pendaftaran runner

Bucket pendaftaran runner GitHub OpenClaw saat ini melaporkan 10.000 pendaftaran
runner self-hosted per 5 menit di `ghx api rate_limit`. Periksa ulang
`actions_runner_registration` sebelum setiap pass tuning karena GitHub dapat mengubah
bucket ini. Batas ini dibagi oleh semua pendaftaran runner Blacksmith di organisasi
`openclaw`, sehingga menambahkan instalasi Blacksmith lain tidak menambahkan
bucket baru.

Perlakukan label Blacksmith sebagai sumber daya langka untuk kontrol burst. Job yang
hanya merutekan, memberi notifikasi, meringkas, memilih shard, atau menjalankan pemindaian CodeQL singkat sebaiknya
tetap di runner yang dihosting GitHub kecuali memiliki kebutuhan spesifik Blacksmith
yang terukur. Setiap matriks Blacksmith baru, `max-parallel` yang lebih besar, atau workflow
berfrekuensi tinggi harus menunjukkan jumlah pendaftaran worst-case-nya dan menjaga target
tingkat org di bawah sekitar 60% dari bucket live. Dengan bucket 10.000 pendaftaran
saat ini, itu berarti target operasi 6.000 pendaftaran, menyisakan ruang untuk
repositori bersamaan, retry, dan tumpang tindih burst.

CI repo kanonis mempertahankan Blacksmith sebagai jalur runner default untuk run push dan pull-request normal. `workflow_dispatch` dan run repositori non-kanonis memakai runner yang dihosting GitHub, tetapi run kanonis normal saat ini tidak memeriksa kesehatan antrean Blacksmith atau secara otomatis fallback ke label yang dihosting GitHub saat Blacksmith tidak tersedia.

## Padanan lokal

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

Dispatch manual biasanya melakukan benchmark terhadap ref alur kerja. Atur `target_ref` untuk melakukan benchmark pada tag rilis atau branch lain dengan implementasi alur kerja saat ini. Jalur laporan yang dipublikasikan dan pointer terbaru dikunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA alur kerja, ref Kova, profil, mode auth lane, model, jumlah pengulangan, dan filter skenario.

Alur kerja memasang OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan auth palsu kompatibel OpenAI yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, Gateway, dan agent-turn.
- `live-openai-candidate`: giliran agen OpenAI `openai/gpt-5.5` nyata, dilewati ketika `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah pass Kova: timing boot Gateway dan memori pada kasus startup default, hook, dan 50-Plugin; RSS impor Plugin bawaan, loop hello `channel-chat-baseline` mock-OpenAI berulang, perintah startup CLI terhadap Gateway yang sudah diboot, dan probe kinerja smoke state SQLite. Ketika laporan sumber mock-provider yang dipublikasikan sebelumnya tersedia untuk ref yang diuji, ringkasan sumber membandingkan nilai RSS dan heap saat ini dengan baseline tersebut dan menandai kenaikan RSS besar sebagai `watch`. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundel laporan, dengan JSON mentah di sampingnya.

Setiap lane mengunggah artefak GitHub. Ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, alur kerja juga meng-commit `report.json`, `report.md`, bundel, `index.md`, dan artefak source-probe ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer tested-ref saat ini ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Lengkap

`Full Release Validation` adalah alur kerja payung manual untuk "jalankan semuanya sebelum rilis." Alur kerja ini menerima branch, tag, atau SHA commit lengkap, menjalankan alur kerja manual `CI` dengan target tersebut, menjalankan `Plugin Prerelease` untuk bukti Plugin/paket/statis/Docker khusus rilis, dan menjalankan `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, pemeriksaan paket lintas OS, rendering maturity scorecard dari bukti profil QA, paritas QA Lab, Matrix, dan lane Telegram. Profil stable dan full selalu mencakup cakupan live/E2E lengkap dan soak jalur rilis Docker; profil beta dapat ikut serta dengan `run_release_soak=true`. E2E Telegram paket kanonis berjalan di dalam Package Acceptance, sehingga kandidat penuh tidak memulai poller live duplikat. Setelah publikasi, berikan `release_package_spec` untuk menggunakan ulang paket npm yang sudah dikirim di release checks, Package Acceptance, Docker, lintas OS, dan Telegram tanpa membangun ulang. Gunakan `npm_telegram_package_spec` hanya untuk rerun Telegram paket terpublikasi yang terfokus. Lane paket live Plugin Codex menggunakan status terpilih yang sama secara default: `release_package_spec=openclaw@<tag>` yang dipublikasikan menurunkan `codex_plugin_spec=npm:@openclaw/codex@<tag>`, sementara run SHA/artefak memaketkan `extensions/codex` dari ref terpilih. Atur `codex_plugin_spec` secara eksplisit untuk sumber Plugin khusus seperti spesifikasi `npm:`, `npm-pack:`, atau `git:`.

Lihat [Validasi rilis lengkap](/id/reference/full-release-validation) untuk matriks tahap, nama job alur kerja yang tepat, perbedaan profil, artefak, dan handle rerun terfokus.

`OpenClaw Release Publish` adalah alur kerja rilis manual yang mengubah status. Jalankan dari `release/YYYY.M.PATCH` atau `main` setelah tag rilis ada dan setelah preflight npm OpenClaw berhasil. Alur kerja ini memverifikasi `pnpm plugins:sync:check`, menjalankan `Plugin NPM Release` untuk semua paket Plugin yang dapat dipublikasikan, menjalankan `Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru kemudian menjalankan `OpenClaw NPM Release` dengan `preflight_run_id` yang disimpan. Publikasi stable juga memerlukan `windows_node_tag` yang tepat; alur kerja memverifikasi rilis sumber Windows dan membandingkan installer x64/ARM64-nya dengan input `windows_node_installer_digests` yang disetujui kandidat sebelum child publish apa pun, lalu mempromosikan dan memverifikasi digest installer yang dipin yang sama beserta aset pendamping yang tepat dan kontrak checksum sebelum memublikasikan draf rilis GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan helper alih-alih `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref dispatch alur kerja GitHub harus berupa branch atau tag, bukan SHA commit mentah. Helper mendorong branch sementara `release-ci/<sha>-...` pada SHA target, menjalankan `Full Release Validation` dari ref yang dipin tersebut, memverifikasi setiap `headSha` alur kerja child cocok dengan target, dan menghapus branch sementara ketika run selesai. Verifier payung juga gagal jika ada alur kerja child yang berjalan pada SHA berbeda.

`release_profile` mengontrol cakupan live/provider yang diteruskan ke release checks. Alur kerja rilis manual default ke `stable`; gunakan `full` hanya ketika Anda sengaja menginginkan matriks provider/media advisory yang luas. Release checks stable dan full selalu menjalankan soak live/E2E lengkap dan jalur rilis Docker; profil beta dapat ikut serta dengan `run_release_soak=true`.

- `minimum` mempertahankan lane OpenAI/core tercepat yang kritis untuk rilis.
- `stable` menambahkan kumpulan provider/backend stable.
- `full` menjalankan matriks provider/media advisory yang luas.

Payung mencatat id run child yang dijalankan, dan job akhir `Verify full validation` memeriksa ulang kesimpulan run child saat ini serta menambahkan tabel job paling lambat untuk setiap run child. Jika alur kerja child direrun dan menjadi hijau, rerun hanya job verifier induk untuk menyegarkan hasil payung dan ringkasan timing.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` sama-sama menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk child CI penuh normal, `plugin-prerelease` hanya untuk child prerelease Plugin, `release-checks` untuk setiap child rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane lintas OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah lintas OS yang panjang mengeluarkan baris Heartbeat dan ringkasan packaged-upgrade menyertakan timing per fase. Lane QA release-check bersifat advisory kecuali gate cakupan tool runtime standar, yang memblokir ketika tool dinamis OpenClaw yang diperlukan menyimpang atau menghilang dari ringkasan tier standar.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk menyelesaikan ref terpilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak tersebut ke pemeriksaan lintas OS dan Package Acceptance, plus alur kerja Docker jalur rilis live/E2E ketika cakupan soak berjalan. Ini menjaga byte paket konsisten di seluruh kotak rilis dan menghindari pemaketan ulang kandidat yang sama di beberapa job child. Untuk lane live npm-Plugin Codex, release checks meneruskan spesifikasi Plugin terpublikasi yang cocok yang diturunkan dari `release_package_spec`, meneruskan `codex_plugin_spec` yang disediakan operator, atau membiarkan input kosong sehingga skrip Docker memaketkan Plugin Codex dari checkout terpilih.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all` menggantikan payung yang lebih lama. Monitor induk membatalkan alur kerja child apa pun yang sudah dijalankannya ketika induk dibatalkan, sehingga validasi main yang lebih baru tidak menunggu di belakang run release-check dua jam yang sudah usang. Validasi branch/tag rilis dan grup rerun terfokus mempertahankan `cancel-in-progress: false`.

## Shard Live dan E2E

Child live/E2E rilis mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs` alih-alih satu job serial:

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

Ini mempertahankan cakupan file yang sama sekaligus membuat kegagalan provider live yang lambat lebih mudah direrun dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, dibangun oleh alur kerja `Live Media Runner Image`. Image tersebut memasang `ffmpeg` dan `ffprobe` sebelumnya; job media hanya memverifikasi binary sebelum setup. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job container bukan tempat yang tepat untuk meluncurkan pengujian Docker bertingkat.

Shard model/backend live yang didukung Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` untuk setiap commit yang dipilih. Workflow rilis live membangun dan mendorong image tersebut sekali, lalu shard model live Docker, Gateway yang dipecah per penyedia, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Gateway Docker membawa batas `timeout` eksplisit di level skrip di bawah timeout job workflow sehingga container yang macet atau jalur pembersihan gagal cepat alih-alih menghabiskan seluruh anggaran release-check. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, konfigurasi run rilis keliru dan akan membuang waktu wall clock untuk build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi tree sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness Docker E2E yang sama yang dijalankan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, workflow ref, package ref, versi, SHA-256, serta profil di ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow reusable mengunduh artefak tersebut, memvalidasi inventaris tarball, menyiapkan image Docker package-digest bila diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket tersebut alih-alih mengemas checkout workflow. Ketika sebuah profil memilih beberapa `docker_lanes` tertarget, workflow reusable menyiapkan paket dan image bersama sekali, lalu menyebarkan lane tersebut sebagai job Docker tertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Job ini berjalan ketika `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama ketika Package Acceptance menyelesaikan satu; dispatch Telegram mandiri masih dapat menginstal spesifikasi npm yang dipublikasikan.
4. `summary` menggagalkan workflow jika penyelesaian paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prerelease/stabil yang sudah dipublikasikan.
- `source=ref` mengemas branch, tag, atau SHA commit penuh `package_ref` tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, menginstal dependensi di worktree detached, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS publik; `package_sha256` wajib. Jalur ini menolak kredensial URL, port HTTPS non-default, hostname atau IP hasil resolve yang privat/internal/penggunaan-khusus, dan redirect di luar kebijakan keamanan publik yang sama.
- `source=trusted-url` mengunduh `.tgz` HTTPS dari kebijakan trusted-source bernama di `.github/package-trusted-sources.json`; `package_sha256` dan `trusted_source_id` wajib. Gunakan ini hanya untuk mirror enterprise milik maintainer atau repositori paket privat yang membutuhkan host, port, prefiks path, host redirect, atau resolusi jaringan privat yang dikonfigurasi. Jika kebijakan mendeklarasikan auth bearer, workflow menggunakan secret tetap `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; kredensial yang disematkan dalam URL tetap ditolak.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — potongan jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan ulang artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap tersedia untuk dispatch mandiri.

Untuk kebijakan khusus pengujian pembaruan dan plugin, termasuk perintah lokal,
lane Docker, input Package Acceptance, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins).

Release check memanggil Package Acceptance dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, pembaruan, instalasi skill ClawHub live, pembersihan dependensi plugin usang, perbaikan instalasi plugin terkonfigurasi, plugin offline, plugin-update, dan bukti Telegram pada tarball paket yang sama yang sudah diselesaikan. Atur `release_package_spec` pada Full Release Validation atau OpenClaw Release Checks setelah memublikasikan beta untuk menjalankan matriks yang sama terhadap paket npm yang sudah dikirim tanpa membangun ulang; atur `package_acceptance_package_spec` hanya ketika Package Acceptance membutuhkan paket yang berbeda dari sisa validasi rilis. Release check lintas-OS tetap mencakup onboarding, installer, dan perilaku platform spesifik OS; validasi produk paket/pembaruan harus dimulai dengan Package Acceptance. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run di jalur rilis yang memblokir. Dalam Package Acceptance, tarball `package-under-test` yang diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline fallback yang dipublikasikan, default ke `openclaw@latest`; perintah rerun lane yang gagal mempertahankan baseline tersebut. Full Release Validation dengan `run_release_soak=true` atau `release_profile=full` mengatur `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas ke empat rilis npm stabil terbaru plus rilis batas kompatibilitas plugin yang dipin dan fixture berbentuk isu untuk config Feishu, file bootstrap/persona yang dipertahankan, instalasi Plugin OpenClaw terkonfigurasi, path log tilde, dan root dependensi plugin legacy yang usang. Pilihan survivor published-upgrade multi-baseline di-shard berdasarkan baseline ke job runner Docker tertarget terpisah. Workflow `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah pembersihan pembaruan terpublikasi yang menyeluruh, bukan cakupan CI Full Release normal. Run agregat lokal dapat meneruskan spesifikasi paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau mengatur `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane terpublikasi mengonfigurasi baseline dengan resep perintah `openclaw config set` bawaan, merekam langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway dimulai. Lane fresh paket dan installer Windows juga memverifikasi bahwa paket yang diinstal dapat mengimpor override browser-control dari path Windows absolut mentah. Smoke agent-turn lintas-OS OpenAI default ke `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika disetel, jika tidak `openai/gpt-5.5`, sehingga bukti instalasi dan Gateway tetap menggunakan model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Package Acceptance memiliki jendela kompatibilitas legacy terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang dikenal di `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `patchedDependencies` pnpm yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` persisten yang hilang;
- smoke plugin dapat membaca lokasi install-record legacy atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata config sambil tetap mewajibkan install record dan perilaku tanpa-reinstall tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memperingatkan untuk file stamp metadata build lokal yang sudah dikirim. Paket berikutnya harus memenuhi kontrak modern; kondisi yang sama gagal alih-alih memperingatkan atau melewati.

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

Saat men-debug run penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa run turunan `docker_acceptance` dan artefak Dockernya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Utamakan menjalankan ulang profil paket yang gagal atau lane Docker persis alih-alih menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Workflow `Install Smoke` terpisah menggunakan ulang skrip scope yang sama melalui job `preflight` miliknya sendiri. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk permintaan pull yang menyentuh permukaan Docker/paket, perubahan paket/manifes Plugin terbundel, atau permukaan Plugin SDK plugin/channel/gateway inti yang diuji oleh tugas smoke Docker. Perubahan Plugin terbundel yang hanya source, edit yang hanya test, dan edit yang hanya docs tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e gateway-network container, memverifikasi arg build extension terbundel, dan menjalankan profil Docker Plugin terbundel terbatas di bawah timeout perintah agregat 240 detik (setiap Docker run skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan cakupan instal paket QR dan Docker/update installer untuk run terjadwal nightly, dispatch manual, pemeriksaan rilis workflow-call, dan permintaan pull yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke GHCR root Dockerfile target-SHA, lalu menjalankan instal paket QR, smoke root Dockerfile/gateway, smoke installer/update, dan E2E Docker Plugin terbundel cepat sebagai job terpisah agar pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; ketika logika changed-scope akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instal penuh ke validasi nightly atau rilis.

Smoke image-provider instal global Bun yang lambat dikendalikan secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal nightly dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat ikut mengaktifkannya, tetapi permintaan pull dan push `main` tidak. CI PR normal tetap menjalankan lane regresi launcher Bun cepat untuk perubahan yang relevan dengan Node. Test Docker QR dan installer mempertahankan Dockerfile mereka sendiri yang berfokus pada instalasi.

## E2E Docker Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw satu kali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya menjalankan plan yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Penyetelan

| Variabel                               | Bawaan        | Tujuan                                                                                               |
| -------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10            | Jumlah slot pool utama untuk lane normal.                                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10            | Jumlah slot pool ekor yang sensitif terhadap penyedia.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9             | Batas lane live serentak agar penyedia tidak melakukan throttling.                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5             | Batas lane instal npm serentak.                                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7             | Batas lane multi-service serentak.                                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000          | Jeda antar-start lane untuk menghindari badai create daemon Docker; setel `0` untuk tanpa jeda.      |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000       | Timeout fallback per lane (120 menit); lane live/tail tertentu memakai batas yang lebih ketat.       |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | tidak disetel | `1` mencetak plan scheduler tanpa menjalankan lane.                                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | tidak disetel | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agent dapat mereproduksi satu lane gagal. |

Lane yang lebih berat daripada batas efektifnya tetap dapat mulai dari pool kosong, lalu berjalan sendiri sampai melepas kapasitas. Preflight agregat lokal memeriksa Docker, menghapus container E2E OpenClaw yang usang, mengeluarkan status lane aktif, mempertahankan timing lane untuk pengurutan longest-first, dan secara default berhenti menjadwalkan lane pool baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan kepada `scripts/test-docker-all.mjs --plan-json` paket, jenis image, image live, lane, dan cakupan kredensial mana yang diperlukan. `scripts/docker-e2e.mjs` lalu mengubah plan tersebut menjadi output dan ringkasan GitHub. Ia mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artifact paket current-run, atau mengunduh artifact paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/fungsional bertag digest paket melalui cache layer Docker Blacksmith ketika plan memerlukan lane dengan paket terinstal; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout terbatas 180 detik per percobaan agar stream registry/cache yang macet cepat dicoba ulang alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkan dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `package-update-openai` mencakup lane paket Plugin Codex live, yang menginstal paket kandidat OpenClaw, menginstal Plugin Codex dari `codex_plugin_spec` atau tarball same-ref dengan persetujuan instal CLI Codex eksplisit, menjalankan preflight CLI Codex, lalu menjalankan beberapa giliran agent OpenClaw dalam sesi yang sama terhadap OpenAI. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer penyedia.

OpenWebUI digabungkan ke `plugins-runtime-services` ketika cakupan release-path penuh memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane update channel terbundel mencoba ulang satu kali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON plan scheduler, tabel lane lambat, dan perintah rerun per lane. Input workflow `docker_lanes` menjalankan lane yang dipilih terhadap image yang disiapkan alih-alih job chunk, yang membuat debugging lane gagal terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artifact paket untuk run tersebut; jika lane yang dipilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun tersebut. Perintah rerun GitHub per lane yang dihasilkan mencakup `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan ketika nilai tersebut ada, sehingga lane gagal dapat menggunakan ulang paket dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, sehingga menjadi workflow terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Permintaan pull normal, push `main`, dan dispatch CI manual mandiri menonaktifkan suite tersebut. Ini menyeimbangkan test Plugin terbundel di delapan worker extension; job shard extension tersebut menjalankan hingga dua grup config Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch Plugin yang berat import tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis membatch lane Docker tertarget dalam grup kecil untuk menghindari pencadangan puluhan runner untuk job satu hingga tiga menit. Workflow ini juga mengunggah artifact informasional `plugin-inspector-advisory` dari `@openclaw/plugin-inspector`; temuan inspector adalah input triase dan tidak mengubah gate pemblokir Plugin Prerelease.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow smart-scoped utama. Paritas agentic berada di dalam harness QA dan rilis yang luas, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus ikut dalam run validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan nightly pada `main` dan pada dispatch manual; workflow ini membagi lane paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan penyedia mock deterministik dan model berkualifikasi mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup provider-plugin normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh suite model live, penyedia native, dan penyedia Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu membagi cakupan Matrix penuh ke dalam job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan pack kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artifact ke dalam job laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/check terskop alih-alih memperlakukan paritas sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja menjadi pemindai keamanan first-pass yang sempit, bukan sweep repository penuh. Run harian, manual, dan guard permintaan pull non-draft memindai kode workflow Actions ditambah permukaan JavaScript/TypeScript berisiko tertinggi dengan query keamanan high-confidence yang difilter ke `security-severity` high/critical.

Guard permintaan pull tetap ringan: ia hanya mulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, atau path runtime Plugin terbundel yang memiliki proses, dan menjalankan matriks keamanan high-confidence yang sama seperti workflow terjadwal. CodeQL Android dan macOS tetap dikeluarkan dari default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Baseline auth, secrets, sandbox, Cron, dan Gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti ditambah runtime Plugin channel, Gateway, Plugin SDK, secrets, titik sentuh audit                |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, parsing IP, guard jaringan, web-fetch, dan SSRF Plugin SDK                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gate eksekusi tool agen                                                 |
| `/codeql-security-high/process-exec-boundary`     | Shell lokal, helper spawn proses, runtime Plugin bundel yang memiliki subprocess, dan perekat skrip workflow                       |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifest, registry, instalasi package-manager, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Linux Blacksmith terkecil yang diterima oleh sanity workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL pada Blacksmith macOS, menyaring hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Critical Quality

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error pada permukaan sempit bernilai tinggi di runner Linux yang di-host GitHub agar pemindaian kualitas tidak menghabiskan anggaran registrasi runner Blacksmith. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draft hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang cocok untuk perubahan pada kode eksekusi command/model/tool agen dan dispatch balasan, kode skema/migrasi/IO config, kode auth/secrets/sandbox/keamanan, runtime channel inti dan Plugin channel bundel, protokol/metode server Gateway, perekat runtime/SDK memori, MCP/proses/pengiriman keluar, katalog runtime/model provider, diagnostik sesi/antrean pengiriman, loader Plugin, kontrak paket/Plugin SDK, atau runtime balasan Plugin SDK. Perubahan config CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terpisah.

| Kategori                                                | Permukaan                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan auth, secrets, sandbox, Cron, dan Gateway                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema config, migrasi, normalisasi, dan IO                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                            |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan Plugin channel bundel                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi command, dispatch model/provider, dispatch dan antrean auto-reply, serta control-plane ACP                                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge tool, helper supervisi proses, dan kontrak pengiriman keluar                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, facade runtime memori, alias Plugin SDK memori, perekat aktivasi runtime memori, dan command doctor memori                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundel event/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread        |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, serta registry web/search/fetch/embedding     |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, persistensi lokal, alur kontrol Gateway, dan kontrak runtime control-plane tugas                                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, pembuatan gambar, dan pembuatan media                                                     |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint Plugin SDK                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket Plugin                                                                            |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan Plugin bundel harus ditambahkan kembali sebagai pekerjaan lanjutan yang berscope atau dishard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Workflow pemeliharaan

### Docs Agent

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru mendarat. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, dan dispatch manual dapat menjalankannya secara langsung. Invokasi workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-skipped lain dibuat dalam satu jam terakhir. Saat berjalan, ini meninjau rentang commit dari SHA sumber Docs Agent non-skipped sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pass docs terakhir.

### Test Performance Agent

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk test yang lambat. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, tetapi dilewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gate aktivitas harian itu. Lane ini membangun laporan performa Vitest full-suite yang dikelompokkan, membiarkan Codex hanya membuat perbaikan performa test kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah test baseline yang lulus. Laporan yang dikelompokkan mencatat wall time per-config dan RSS maksimum di Linux dan macOS, sehingga perbandingan sebelum/sesudah menampilkan delta memori test berdampingan dengan delta durasi. Jika baseline memiliki test yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lulus sebelum apa pun di-commit. Ketika `main` maju sebelum push bot mendarat, lane ini me-rebase patch yang sudah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch basi yang berkonflik dilewati. Ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti docs agent.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat pasca-mendarat. Default-nya adalah dry-run dan hanya menutup PR yang dicantumkan secara eksplisit saat `apply=true`. Sebelum memutasi GitHub, ini memverifikasi bahwa PR yang mendarat sudah di-merge dan bahwa setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gate pemeriksaan lokal itu lebih ketat tentang batas arsitektur daripada scope platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan test inti ditambah lint/guard inti;
- perubahan khusus test inti hanya menjalankan typecheck test inti ditambah lint inti;
- perubahan produksi ekstensi menjalankan typecheck prod ekstensi dan test ekstensi ditambah lint ekstensi;
- perubahan khusus test ekstensi menjalankan typecheck test ekstensi ditambah lint ekstensi;
- perubahan Plugin SDK publik atau kontrak Plugin meluas ke typecheck ekstensi karena ekstensi bergantung pada kontrak inti tersebut (sweep ekstensi Vitest tetap menjadi pekerjaan test eksplisit);
- bump versi khusus metadata rilis menjalankan pemeriksaan versi/config/dependensi-root yang ditargetkan;
- perubahan root/config yang tidak diketahui fail safe ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit test langsung menjalankan dirinya sendiri, edit sumber lebih memilih mapping eksplisit, lalu test saudara dan dependen import-graph. Config pengiriman group-room bersama adalah salah satu mapping eksplisit: perubahan pada config balasan yang terlihat grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui test balasan inti ditambah regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas pada harness sehingga set mapped yang murah bukan proxy yang dapat dipercaya.

## Validasi Testbox

Crabbox adalah wrapper remote-box milik repo untuk bukti Linux maintainer. Gunakan
dari root repo ketika pemeriksaan terlalu luas untuk loop edit lokal, ketika
paritas CI penting, atau ketika bukti memerlukan rahasia, Docker, lane paket,
box yang dapat digunakan ulang, atau log jarak jauh. Backend OpenClaw normal adalah
`blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah fallback untuk
gangguan Blacksmith, masalah kuota, atau pengujian kapasitas milik sendiri secara eksplisit.

Run Blacksmith yang didukung Crabbox melakukan warm, claim, sync, run, report, dan cleanup
Testbox sekali pakai. Pemeriksaan kewarasan sync bawaan gagal cepat ketika file root
yang diperlukan seperti `pnpm-lock.yaml` hilang atau ketika `git status --short`
menampilkan setidaknya 200 penghapusan terlacak. Untuk PR penghapusan besar yang disengaja, tetapkan
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk perintah jarak jauh.

Crabbox juga menghentikan pemanggilan CLI Blacksmith lokal yang tetap berada di
fase sync selama lebih dari lima menit tanpa output pasca-sync. Tetapkan
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard itu, atau gunakan nilai
milidetik yang lebih besar untuk diff lokal yang sangat besar.

Sebelum run pertama, periksa wrapper dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo menolak biner Crabbox usang yang tidak mengiklankan `blacksmith-testbox`. Teruskan provider secara eksplisit meskipun `.crabbox.yaml` memiliki default owned-cloud. Di worktree Codex atau checkout linked/sparse, hindari skrip lokal `pnpm crabbox:run` karena pnpm dapat merekonsiliasi dependensi sebelum Crabbox dimulai; panggil wrapper node secara langsung sebagai gantinya:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Run yang didukung Blacksmith memerlukan Crabbox 0.22.0 atau yang lebih baru agar wrapper mendapatkan perilaku sync, antrean, dan cleanup Testbox saat ini. Saat menggunakan checkout sibling, rebuild biner lokal yang diabaikan sebelum pekerjaan timing atau bukti:

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

Rerun pengujian terfokus:

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

Suite penuh:

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
`syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Untuk run Blacksmith
Testbox yang didelegasikan, kode keluar wrapper Crabbox dan ringkasan JSON adalah
hasil perintah. Run GitHub Actions tertaut memiliki hydration dan keepalive; run itu
dapat selesai sebagai `cancelled` ketika Testbox dihentikan secara eksternal setelah perintah SSH
sudah kembali. Perlakukan itu sebagai artefak cleanup/status kecuali
`exitCode` wrapper bukan nol atau output perintah menampilkan pengujian gagal.
Run Crabbox sekali pakai yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis;
jika run terinterupsi atau cleanup tidak jelas, inspeksi box live dan hentikan hanya
box yang Anda buat:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gunakan reuse hanya ketika Anda sengaja memerlukan beberapa perintah pada box ter-hydrate yang sama:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jika Crabbox adalah lapisan yang rusak tetapi Blacksmith sendiri berfungsi, gunakan Blacksmith
langsung hanya untuk diagnostik seperti `list`, `status`, dan cleanup. Perbaiki
jalur Crabbox sebelum memperlakukan run Blacksmith langsung sebagai bukti maintainer.

Jika `blacksmith testbox list --all` dan `blacksmith testbox status` berfungsi tetapi warmup baru
tetap `queued` tanpa IP atau URL run Actions setelah beberapa menit,
perlakukan itu sebagai tekanan provider, antrean, penagihan, atau batas org Blacksmith. Hentikan
id antrean yang Anda buat, hindari memulai Testbox tambahan, dan pindahkan bukti ke
jalur kapasitas Crabbox milik sendiri di bawah ini sementara seseorang memeriksa dashboard Blacksmith,
penagihan, dan batas org.

Eskalasi ke kapasitas Crabbox milik sendiri hanya ketika Blacksmith down, dibatasi kuota, tidak memiliki lingkungan yang dibutuhkan, atau kapasitas milik sendiri secara eksplisit menjadi tujuan:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Di bawah tekanan AWS, hindari `class=beast` kecuali tugas benar-benar memerlukan CPU kelas 48xlarge. Permintaan `beast` dimulai pada 192 vCPU dan merupakan cara termudah memicu kuota regional EC2 Spot atau On-Demand Standard. `.crabbox.yaml` milik repo memiliki default `standard`, beberapa wilayah kapasitas, dan `capacity.hints: true` sehingga lease AWS yang dibrokeri mencetak region/market terpilih, tekanan kuota, fallback Spot, dan peringatan kelas tekanan tinggi. Gunakan `fast` untuk pemeriksaan luas yang lebih berat, `large` hanya setelah standard/fast tidak cukup, dan `beast` hanya untuk lane luar biasa yang terikat CPU seperti full-suite atau matriks Docker semua-plugin, validasi rilis/blocker eksplisit, atau profiling performa high-core. Jangan gunakan `beast` untuk `pnpm check:changed`, pengujian terfokus, pekerjaan docs-only, lint/typecheck biasa, repro E2E kecil, atau triase gangguan Blacksmith. Gunakan `--market on-demand` untuk diagnosis kapasitas agar churn market Spot tidak bercampur ke dalam sinyal.

`.crabbox.yaml` memiliki default provider, sync, dan hydration GitHub Actions untuk lane owned-cloud. File itu mengecualikan `.git` lokal sehingga checkout Actions yang ter-hydrate mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan object store lokal maintainer, dan mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, setup Node/pnpm, fetch `origin/main`, dan handoff environment non-rahasia untuk perintah owned-cloud `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Channel pengembangan](/id/install/development-channels)
