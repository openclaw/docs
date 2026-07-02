---
read_when:
    - Anda perlu memahami mengapa job CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan proses validasi rilis atau menjalankannya ulang
    - Anda mengubah dispatch ClawSweeper atau penerusan aktivitas GitHub
summary: Graf tugas CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-07-02T14:11:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

CI OpenClaw berjalan pada setiap push ke `main` dan setiap pull request. Push
`main` kanonis terlebih dahulu melewati jendela penerimaan hosted runner selama
90 detik. Grup konkurensi `CI` yang ada membatalkan run yang sedang menunggu itu
saat commit yang lebih baru masuk, sehingga merge berurutan tidak masing-masing
mendaftarkan matriks Blacksmith penuh. Pull request dan dispatch manual melewati
waktu tunggu. Job `preflight` kemudian mengklasifikasikan diff dan mematikan
lane mahal saat hanya area yang tidak terkait yang berubah. Run
`workflow_dispatch` manual sengaja melewati pencakupan cerdas dan menyebarkan
graf penuh untuk kandidat rilis dan validasi luas. Lane Android tetap ikut
serta secara opsional melalui `include_android`. Cakupan Plugin khusus rilis
berada di workflow [`Pra-rilis Plugin`](#plugin-prerelease) terpisah dan hanya
berjalan dari [`Validasi Rilis Penuh`](#full-release-validation) atau dispatch
manual eksplisit.

## Ringkasan pipeline

| Job                                | Tujuan                                                                                                   | Kapan berjalan                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `preflight`                        | Mendeteksi perubahan khusus docs, cakupan yang berubah, ekstensi yang berubah, dan membangun manifes CI | Selalu pada push non-draft dan PR                     |
| `runner-admission`                 | Debounce hosted 90 detik untuk push `main` kanonis sebelum pekerjaan Blacksmith didaftarkan             | Setiap run CI; tidur hanya pada push `main` kanonis   |
| `security-fast`                    | Deteksi kunci privat, audit workflow yang berubah melalui `zizmor`, dan audit lockfile produksi         | Selalu pada push non-draft dan PR                     |
| `check-dependencies`               | Pemeriksaan khusus dependensi produksi Knip plus guard allowlist file tidak terpakai                    | Perubahan yang relevan dengan Node                    |
| `build-artifacts`                  | Membangun `dist/`, Control UI, pemeriksaan smoke CLI terbangun, pemeriksaan artefak terbangun tertanam, dan artefak pakai ulang | Perubahan yang relevan dengan Node                    |
| `checks-fast-core`                 | Lane kebenaran Linux cepat seperti bundled, protocol, QA Smoke CI, dan pemeriksaan routing CI           | Perubahan yang relevan dengan Node                    |
| `checks-fast-contracts-plugins-*`  | Dua pemeriksaan kontrak Plugin yang di-shard                                                           | Perubahan yang relevan dengan Node                    |
| `checks-fast-contracts-channels-*` | Dua pemeriksaan kontrak channel yang di-shard                                                          | Perubahan yang relevan dengan Node                    |
| `checks-node-core-*`               | Shard pengujian Node inti, mengecualikan lane channel, bundled, kontrak, dan ekstensi                   | Perubahan yang relevan dengan Node                    |
| `check-*`                          | Padanan gate lokal utama yang di-shard: tipe produksi, lint, guard, tipe pengujian, dan smoke ketat     | Perubahan yang relevan dengan Node                    |
| `check-additional-*`               | Arsitektur, drift batas/prompt yang di-shard, guard ekstensi, batas paket, dan topologi runtime         | Perubahan yang relevan dengan Node                    |
| `checks-node-compat-node22`        | Build kompatibilitas Node 22 dan lane smoke                                                            | Dispatch CI manual untuk rilis                        |
| `check-docs`                       | Pemformatan docs, lint, dan pemeriksaan tautan rusak                                                    | Docs berubah                                          |
| `skills-python`                    | Ruff + pytest untuk Skills berbasis Python                                                              | Perubahan yang relevan dengan skill Python            |
| `checks-windows`                   | Pengujian proses/path khusus Windows plus regresi specifier impor runtime bersama                       | Perubahan yang relevan dengan Windows                 |
| `macos-node`                       | Lane pengujian TypeScript macOS menggunakan artefak terbangun bersama                                   | Perubahan yang relevan dengan macOS                   |
| `macos-swift`                      | Lint, build, dan pengujian Swift untuk aplikasi macOS                                                   | Perubahan yang relevan dengan macOS                   |
| `ios-build`                        | Pembuatan proyek Xcode plus build simulator aplikasi iOS                                                | Aplikasi iOS, kit aplikasi bersama, atau perubahan Swabble |
| `android`                          | Pengujian unit Android untuk kedua varian plus satu build APK debug                                     | Perubahan yang relevan dengan Android                 |
| `test-performance-agent`           | Optimisasi pengujian lambat Codex harian setelah aktivitas tepercaya                                    | Keberhasilan CI utama atau dispatch manual            |
| `openclaw-performance`             | Laporan performa runtime Kova harian/sesuai permintaan dengan lane mock-provider, deep-profile, dan live GPT 5.5 | Terjadwal dan dispatch manual                         |

## Urutan gagal cepat

1. `runner-admission` menunggu hanya untuk push `main` kanonis; push yang lebih baru membatalkan run sebelum pendaftaran Blacksmith.
2. `preflight` memutuskan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, dan `skills-python` gagal dengan cepat tanpa menunggu job matriks artefak dan platform yang lebih berat.
4. `build-artifacts` berjalan beririsan dengan lane Linux cepat sehingga konsumen hilir dapat mulai segera setelah build bersama siap.
5. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, dan `android`.

GitHub dapat menandai job yang digantikan sebagai `cancelled` saat push yang lebih baru masuk ke PR yang sama atau ref `main`. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Job matriks menggunakan `fail-fast: false`, dan `build-artifacts` melaporkan kegagalan channel tertanam, core-support-boundary, dan gateway-watch secara langsung alih-alih mengantrekan job verifikator kecil. Kunci konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga proses macet sisi GitHub di grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run suite lengkap manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

Gunakan `pnpm ci:timings`, `pnpm ci:timings:recent`, atau `node scripts/ci-run-timings.mjs <run-id>` untuk merangkum waktu wall, waktu antrean, job paling lambat, kegagalan, dan penghalang fanout `pnpm-store-warmup` dari GitHub Actions. CI juga mengunggah ringkasan run yang sama sebagai artefak `ci-timings-summary`. Untuk waktu build, periksa langkah `Build dist` pada job `build-artifacts`: `pnpm build:ci-artifacts` mencetak `[build-all] phase timings:` dan menyertakan `ui:build`; job juga mengunggah artefak `startup-memory`.

Untuk run pull request, job ringkasan waktu terminal menjalankan helper dari revisi dasar tepercaya sebelum meneruskan `GH_TOKEN` ke `gh run view`. Ini menjaga kueri bertoken keluar dari kode yang dikontrol branch sambil tetap merangkum run CI pull request saat ini.

## Konteks dan bukti PR

PR kontributor eksternal menjalankan gate konteks dan bukti PR dari
`.github/workflows/real-behavior-proof.yml`. Workflow melakukan checkout commit
dasar tepercaya dan hanya mengevaluasi isi PR; workflow tidak mengeksekusi kode
dari branch kontributor.

Gate berlaku untuk penulis PR yang bukan pemilik repositori, anggota,
kolaborator, atau bot. Gate lulus saat isi PR memuat bagian
`What Problem This Solves` dan `Evidence` yang ditulis penulis. Bukti dapat berupa
pengujian terfokus, hasil CI, screenshot, rekaman, keluaran terminal,
observasi live, log yang disunting, atau tautan artefak. Isi menyediakan maksud
dan validasi yang berguna; peninjau memeriksa kode, pengujian, dan CI untuk
menilai kebenaran.

Saat pemeriksaan gagal, perbarui isi PR alih-alih mendorong commit kode lain.

## Cakupan dan routing

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area tercakup berubah.

- **Edit workflow CI** memvalidasi graf CI Node plus lint workflow, tetapi tidak memaksa build native Windows, iOS, Android, atau macOS dengan sendirinya; lane platform tersebut tetap dicakup pada perubahan sumber platform.
- **Pemeriksaan Kewarasan Workflow** menjalankan `actionlint`, `zizmor` atas semua file YAML workflow, guard interpolasi composite-action, dan guard penanda konflik. Job `security-fast` yang dicakup PR juga menjalankan `zizmor` atas file workflow yang berubah sehingga temuan keamanan workflow gagal lebih awal di graf CI utama.
- **Docs pada push `main`** diperiksa oleh workflow `Docs` mandiri dengan mirror docs ClawHub yang sama yang digunakan CI, sehingga push campuran kode+docs tidak juga mengantrekan shard `check-docs` CI. Pull request dan CI manual tetap menjalankan `check-docs` dari CI saat docs berubah.
- **TUI PTY** berjalan di shard Node Linux `checks-node-core-runtime-tui-pty` untuk perubahan TUI. Shard menjalankan `test/vitest/vitest.tui-pty.config.ts` dengan `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, sehingga mencakup lane fixture `TuiBackend` deterministik dan smoke `tui --local` yang lebih lambat yang hanya memock endpoint model eksternal.
- **Edit khusus routing CI, edit fixture pengujian inti murah terpilih, dan edit helper/routing pengujian kontrak Plugin yang sempit** menggunakan jalur manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard inti penuh, shard bundled-plugin, dan matriks guard tambahan saat perubahan terbatas pada permukaan routing atau helper yang langsung dilatih tugas cepat tersebut.
- **Pemeriksaan Node Windows** dicakup pada wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi manajer paket, dan permukaan workflow CI yang mengeksekusi lane tersebut; perubahan sumber, Plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada di lane Node Linux.

Rangkaian pengujian Node yang paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner secara berlebihan: kontrak plugin dan kontrak channel masing-masing berjalan sebagai dua shard berbobot yang didukung Blacksmith dengan fallback runner GitHub standar, lane core unit fast/support berjalan terpisah, infra runtime core dipecah antara shard state, process/config, shared, dan tiga domain cron, auto-reply berjalan sebagai worker yang diseimbangkan (dengan subtree reply dipecah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi gateway/server agentic dipecah ke lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artefak hasil build. CI normal kemudian hanya mengemas shard include-pattern infra terisolasi ke dalam bundle deterministik berisi paling banyak 64 file pengujian, sehingga mengurangi matriks Node tanpa menggabungkan suite command/cron yang tidak terisolasi, agents-core yang stateful, atau gateway/server; suite tetap yang berat tetap berjalan pada 8 vCPU sementara lane yang dibundle dan berbobot lebih rendah menggunakan 4 vCPU. Pull request pada repositori kanonis menggunakan rencana admission ringkas tambahan: grup per konfigurasi yang sama berjalan dalam subprocess terisolasi di dalam rencana Linux Node 34-job saat ini, sehingga satu PR tidak mendaftarkan matriks Node penuh yang berisi lebih dari 70 job. Push ke `main`, dispatch manual, dan gate rilis tetap mempertahankan matriks penuh. Pengujian browser luas, QA, media, dan plugin lain-lain menggunakan konfigurasi Vitest khususnya sendiri alih-alih catch-all plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan satu konfigurasi utuh dari shard yang difilter. `check-additional-*` menjaga pekerjaan compile/canary batas paket tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar boundary guard dipilah menjadi satu shard yang berat pada prompt dan satu shard gabungan untuk sisa strip guard, masing-masing menjalankan guard independen terpilih secara bersamaan dan mencetak timing per check. Pemeriksaan mahal drift snapshot prompt happy-path Codex berjalan sebagai job tambahan tersendiri hanya untuk CI manual dan perubahan yang memengaruhi prompt, sehingga perubahan Node normal yang tidak terkait tidak perlu menunggu pembuatan snapshot prompt dingin dan shard batas tetap seimbang sementara drift prompt tetap dipatok ke PR yang menyebabkannya; flag yang sama melewati pembuatan Vitest snapshot prompt di dalam shard support-boundary core artefak hasil build. Gateway watch, pengujian channel, dan shard support-boundary core berjalan secara bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibuild.

Setelah diterima, CI Linux kanonis mengizinkan hingga 24 job pengujian Node
berjalan bersamaan dan 12 untuk lane fast/check yang lebih kecil; Windows dan
Android tetap dua karena pool runner tersebut lebih sempit.

Rencana PR ringkas mengeluarkan 18 job Node untuk suite saat ini: grup
whole-config dibatch dalam subprocess terisolasi dengan timeout batch 120 menit,
sementara grup include-pattern berbagi anggaran job terbatas yang sama.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membuild APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifest terpisah; lane unit-test-nya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass production Knip khusus dependency yang dipatok ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file tidak terpakai produksi dari Knip dengan `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak terpakai gagal ketika PR menambahkan file tidak terpakai baru yang belum ditinjau atau meninggalkan entri allowlist yang sudah usang, sambil mempertahankan permukaan plugin dinamis, generated, build, live-test, dan package bridge yang disengaja dan tidak dapat di-resolve Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow ini memiliki empat lane:

- `clawsweeper_item` untuk permintaan tinjauan issue dan pull request yang spesifik;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit dalam komentar issue;
- `clawsweeper_commit_review` untuk permintaan tinjauan tingkat commit pada push ke `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis event, action, actor, repositori, nomor item, URL, judul, state, dan kutipan pendek untuk komentar atau tinjauan jika ada. Lane ini sengaja menghindari penerusan body webhook lengkap. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan hanya boleh memposting ke `#clawsweeper` ketika event tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise webhook duplikat, dan traffic tinjauan normal harus menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, body, teks tinjauan, nama branch, dan pesan commit GitHub sebagai data yang tidak tepercaya di sepanjang jalur ini. Semuanya adalah input untuk peringkasan dan triage, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan grafik job yang sama seperti CI normal tetapi memaksa setiap lane berscope non-Android aktif: shard Linux Node, shard bundled-plugin, shard kontrak plugin dan channel, kompatibilitas Node 22, `check-*`, `check-additional-*`, smoke check artefak hasil build, pemeriksaan docs, Skills Python, Windows, macOS, build iOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android hanya dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan lane Docker prarilis plugin dikecualikan dari CI. Suite prarilis Docker hanya berjalan ketika `Full Release Validation` mengirim dispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup concurrency unik sehingga suite penuh release-candidate tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan caller tepercaya menjalankan grafik tersebut terhadap branch, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch CI manual dan fallback repositori non-kanonis, pemindaian kualitas CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs di luar CI, dan preflight install-smoke agar matriks Blacksmith dapat mengantre lebih awal                               |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard ekstensi berbobot lebih rendah, `checks-fast-core`, shard kontrak plugin/channel, sebagian besar shard Linux Node bundled/berbobot lebih rendah, `check-guards`, `check-prod-types`, `check-test-types`, shard `check-additional-*` terpilih, dan `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suite Linux Node berat yang dipertahankan, shard `check-additional-*` yang berat pada boundary/ekstensi, dan `android`                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (cukup sensitif CPU sehingga 8 vCPU memakan biaya lebih besar daripada penghematannya); build Docker install-smoke (waktu antrean 32-vCPU memakan biaya lebih besar daripada penghematannya)                                                        |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` dan `ios-build` pada `openclaw/openclaw`; fork fallback ke `macos-26`                                                                                                                                                                                                  |

## Anggaran pendaftaran runner

Bucket pendaftaran runner GitHub OpenClaw saat ini melaporkan 10.000
pendaftaran runner self-hosted per 5 menit di `ghx api rate_limit`. Periksa ulang
`actions_runner_registration` sebelum setiap pass tuning karena GitHub dapat
mengubah bucket ini. Batas ini digunakan bersama oleh semua pendaftaran runner
Blacksmith dalam organisasi `openclaw`, jadi menambahkan instalasi Blacksmith
lain tidak menambahkan bucket baru.

Perlakukan label Blacksmith sebagai sumber daya langka untuk kontrol burst. Job yang
hanya melakukan routing, notifikasi, peringkasan, pemilihan shard, atau menjalankan
pemindaian CodeQL singkat harus tetap berada pada runner yang dihosting GitHub kecuali
memiliki kebutuhan spesifik Blacksmith yang sudah diukur. Setiap matriks Blacksmith
baru, `max-parallel` yang lebih besar, atau workflow berfrekuensi tinggi harus
menunjukkan jumlah pendaftaran kasus terburuknya dan menjaga target tingkat org
di bawah sekitar 60% dari bucket live. Dengan bucket 10.000 pendaftaran saat ini,
itu berarti target operasi 6.000 pendaftaran, menyisakan ruang untuk repositori
bersamaan, retry, dan overlap burst.

CI repo kanonis mempertahankan Blacksmith sebagai jalur runner default untuk run push dan pull-request normal. `workflow_dispatch` dan run repositori non-kanonis menggunakan runner yang dihosting GitHub, tetapi run kanonis normal saat ini tidak memeriksa kesehatan antrean Blacksmith atau secara otomatis fallback ke label yang dihosting GitHub ketika Blacksmith tidak tersedia.

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

## Performa OpenClaw

`OpenClaw Performance` adalah alur kerja performa produk/runtime. Alur kerja ini berjalan setiap hari di `main` dan dapat dijalankan secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch manual biasanya melakukan benchmark terhadap ref alur kerja. Atur `target_ref` untuk melakukan benchmark terhadap tag rilis atau cabang lain dengan implementasi alur kerja saat ini. Jalur laporan yang dipublikasikan dan pointer terbaru dikunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA alur kerja, ref Kova, profil, mode auth lane, model, jumlah pengulangan, dan filter skenario.

Alur kerja memasang OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan auth palsu kompatibel OpenAI yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, gateway, dan agent-turn.
- `live-openai-candidate`: giliran agen OpenAI `openai/gpt-5.5` nyata, dilewati ketika `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah pass Kova: timing dan memori boot gateway di kasus startup default, hook, dan 50-plugin; RSS impor plugin bawaan, loop hello `channel-chat-baseline` mock-OpenAI berulang, perintah startup CLI terhadap gateway yang sudah boot, dan probe performa smoke state SQLite. Ketika laporan sumber mock-provider sebelumnya yang dipublikasikan tersedia untuk ref yang diuji, ringkasan sumber membandingkan nilai RSS dan heap saat ini dengan baseline tersebut dan menandai kenaikan RSS besar sebagai `watch`. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundel laporan, dengan JSON mentah di sebelahnya.

Setiap lane mengunggah artefak GitHub. Ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, alur kerja juga meng-commit `report.json`, `report.md`, bundel, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer ref yang diuji saat ini ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah alur kerja payung manual untuk "menjalankan semuanya sebelum rilis." Alur kerja ini menerima cabang, tag, atau SHA commit lengkap, menjalankan alur kerja manual `CI` dengan target tersebut, menjalankan `Plugin Prerelease` untuk bukti khusus rilis plugin/paket/static/Docker, dan menjalankan `OpenClaw Release Checks` untuk smoke pemasangan, penerimaan paket, pemeriksaan paket lintas-OS, rendering scorecard kematangan dari bukti profil QA, paritas QA Lab, Matrix, dan lane Telegram. Profil stable dan full selalu menyertakan cakupan soak live/E2E dan Docker release-path yang menyeluruh; profil beta dapat ikut serta dengan `run_release_soak=true`. E2E Telegram paket kanonis berjalan di dalam Package Acceptance, sehingga kandidat penuh tidak memulai poller live duplikat. Setelah publikasi, berikan `release_package_spec` untuk menggunakan kembali paket npm yang sudah dikirim di seluruh release checks, Package Acceptance, Docker, lintas-OS, dan Telegram tanpa membangun ulang. Gunakan `npm_telegram_package_spec` hanya untuk rerun Telegram paket terpublikasi yang terfokus. Lane paket live plugin Codex menggunakan state terpilih yang sama secara default: `release_package_spec=openclaw@<tag>` yang dipublikasikan menghasilkan `codex_plugin_spec=npm:@openclaw/codex@<tag>`, sementara run SHA/artefak memaketkan `extensions/codex` dari ref terpilih. Atur `codex_plugin_spec` secara eksplisit untuk sumber plugin khusus seperti spec `npm:`, `npm-pack:`, atau `git:`.

Lihat [validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama job alur kerja yang tepat, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah alur kerja rilis manual yang mengubah state. Jalankan
dari `release/YYYY.M.PATCH` atau `main` setelah tag rilis ada dan setelah
preflight npm OpenClaw berhasil. Alur kerja ini memverifikasi `pnpm plugins:sync:check`,
menjalankan `Plugin NPM Release` untuk semua paket plugin yang dapat dipublikasikan, menjalankan
`Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru setelah itu menjalankan
`OpenClaw NPM Release` dengan `preflight_run_id` yang disimpan. Publikasi stable juga
memerlukan `windows_node_tag` yang tepat; alur kerja memverifikasi rilis sumber Windows
dan membandingkan installer x64/ARM64-nya dengan input
`windows_node_installer_digests` yang disetujui kandidat sebelum child publikasi apa pun, lalu mempromosikan
dan memverifikasi digest installer terpin yang sama ditambah aset pendamping yang tepat
dan kontrak checksum sebelum memublikasikan draf rilis GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Untuk bukti commit terpin pada cabang yang bergerak cepat, gunakan helper alih-alih
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref dispatch alur kerja GitHub harus berupa cabang atau tag, bukan SHA commit mentah. Helper
mendorong cabang sementara `release-ci/<sha>-...` pada SHA target,
menjalankan `Full Release Validation` dari ref terpin tersebut, memverifikasi setiap
`headSha` alur kerja child cocok dengan target, dan menghapus cabang sementara saat
run selesai. Verifier payung juga gagal jika ada alur kerja child yang berjalan pada
SHA berbeda.

`release_profile` mengontrol keluasan live/provider yang diteruskan ke release checks. Alur kerja
rilis manual default ke `stable`; gunakan `full` hanya ketika Anda
secara sengaja menginginkan matriks provider/media advisory yang luas. Release checks stable dan full
selalu menjalankan soak live/E2E dan Docker release-path yang menyeluruh;
profil beta dapat ikut serta dengan `run_release_soak=true`.

- `minimum` mempertahankan lane OpenAI/core release-critical tercepat.
- `stable` menambahkan set provider/backend stable.
- `full` menjalankan matriks provider/media advisory yang luas.

Payung mencatat id run child yang dijalankan, dan job akhir `Verify full validation` memeriksa ulang kesimpulan run child saat ini dan menambahkan tabel job paling lambat untuk setiap run child. Jika alur kerja child di-rerun dan menjadi hijau, rerun hanya job verifier induk untuk menyegarkan hasil payung dan ringkasan timing.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk child CI penuh normal, `plugin-prerelease` hanya untuk child prerelease plugin, `release-checks` untuk setiap child rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane lintas-OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah lintas-OS yang panjang memancarkan baris Heartbeat dan ringkasan packaged-upgrade menyertakan timing per fase. Lane QA release-check bersifat advisory kecuali gate cakupan tool runtime standar, yang memblokir ketika tool dinamis OpenClaw wajib bergeser atau hilang dari ringkasan tier standar.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk me-resolve ref terpilih sekali menjadi tarball `release-package-under-test`, lalu meneruskan artefak tersebut ke pemeriksaan lintas-OS dan Package Acceptance, ditambah alur kerja Docker release-path live/E2E ketika cakupan soak berjalan. Ini menjaga byte paket konsisten di seluruh kotak rilis dan menghindari pemaketan ulang kandidat yang sama di beberapa job child. Untuk lane live plugin-npm Codex, release checks meneruskan spec plugin terpublikasi yang cocok yang diturunkan dari `release_package_spec`, meneruskan `codex_plugin_spec` yang disediakan operator, atau membiarkan input kosong agar skrip Docker memaketkan plugin Codex dari checkout terpilih.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan payung yang lebih lama. Monitor induk membatalkan alur kerja child apa pun yang
sudah dijalankannya ketika induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang run release-check lama selama dua jam. Validasi cabang/tag
rilis dan grup rerun terfokus mempertahankan `cancel-in-progress: false`.

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
- shard audio/video media terpisah dan shard musik yang difilter provider

Ini mempertahankan cakupan file yang sama sambil membuat kegagalan provider live yang lambat lebih mudah di-rerun dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, dibangun oleh alur kerja `Live Media Runner Image`. Image tersebut memasang `ffmpeg` dan `ffprobe` sebelumnya; job media hanya memverifikasi biner sebelum setup. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job container bukan tempat yang tepat untuk meluncurkan pengujian Docker bertingkat.

Shard model/backend live yang didukung Docker menggunakan image bersama `ghcr.io/openclaw/openclaw-live-test:<sha>` terpisah untuk setiap commit yang dipilih. Workflow rilis live membangun dan mendorong image itu sekali, lalu shard model live Docker, Gateway yang di-shard per provider, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` eksplisit di level skrip yang lebih rendah daripada timeout job workflow, sehingga kontainer yang macet atau jalur pembersihan gagal cepat alih-alih menghabiskan seluruh anggaran release-check. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah konfigurasi dan akan membuang wall clock untuk build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi source tree, sedangkan penerimaan paket memvalidasi satu tarball melalui harness Docker E2E yang sama yang digunakan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, menentukan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref workflow, ref paket, versi, SHA-256, serta profil di ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker package-digest bila diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket tersebut alih-alih memaketkan checkout workflow. Ketika sebuah profil memilih beberapa `docker_lanes` bertarget, workflow reusable menyiapkan paket dan image bersama sekali, lalu menyebarkan lane tersebut sebagai job Docker bertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama ketika Penerimaan Paket menentukan satu; dispatch Telegram mandiri masih dapat menginstal spesifikasi npm yang dipublikasikan.
4. `summary` menggagalkan workflow jika resolusi paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prerelease/stable yang dipublikasikan.
- `source=ref` memaketkan branch, tag, atau SHA commit penuh `package_ref` yang tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, menginstal dependensi dalam worktree terlepas, dan memaketkannya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS publik; `package_sha256` wajib. Jalur ini menolak kredensial URL, port HTTPS non-default, hostname atau IP teresolusi yang privat/internal/penggunaan khusus, dan redirect di luar kebijakan keselamatan publik yang sama.
- `source=trusted-url` mengunduh `.tgz` HTTPS dari kebijakan trusted-source bernama di `.github/package-trusted-sources.json`; `package_sha256` dan `trusted_source_id` wajib. Gunakan ini hanya untuk mirror enterprise milik maintainer atau repositori paket privat yang membutuhkan host, port, prefiks path, host redirect, atau resolusi jaringan privat yang dikonfigurasi. Jika kebijakan mendeklarasikan bearer auth, workflow menggunakan secret tetap `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; kredensial yang disematkan dalam URL tetap ditolak.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` bersifat opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dipaketkan ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber lama yang tepercaya tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan kembali artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan khusus pengujian pembaruan dan Plugin, termasuk perintah lokal,
lane Docker, input Penerimaan Paket, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Penerimaan Paket dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, pembaruan, instalasi Skills ClawHub live, pembersihan dependensi Plugin usang, perbaikan instalasi Plugin terkonfigurasi, Plugin offline, plugin-update, dan bukti Telegram pada tarball paket terselesaikan yang sama. Setel `release_package_spec` pada Full Release Validation atau OpenClaw Release Checks setelah memublikasikan beta untuk menjalankan matriks yang sama terhadap paket npm yang telah dikirim tanpa membangun ulang; setel `package_acceptance_package_spec` hanya ketika Penerimaan Paket membutuhkan paket yang berbeda dari validasi rilis lainnya. Pemeriksaan rilis lintas-OS tetap mencakup onboarding, installer, dan perilaku platform yang spesifik OS; validasi produk paket/pembaruan sebaiknya dimulai dengan Penerimaan Paket. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run dalam jalur rilis yang memblokir. Dalam Penerimaan Paket, tarball `package-under-test` yang terselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline fallback yang dipublikasikan, default ke `openclaw@latest`; perintah rerun lane yang gagal mempertahankan baseline itu. Full Release Validation dengan `run_release_soak=true` atau `release_profile=full` menetapkan `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas ke empat rilis npm stable terbaru plus rilis batas kompatibilitas Plugin yang dipin dan fixture berbentuk issue untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, instalasi Plugin OpenClaw terkonfigurasi, path log tilde, dan root dependensi Plugin legacy yang usang. Pilihan published-upgrade survivor multi-baseline di-shard berdasarkan baseline ke dalam job runner Docker bertarget yang terpisah. Workflow `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah pembersihan pembaruan terpublikasi yang menyeluruh, bukan cakupan CI Full Release normal. Run agregat lokal dapat meneruskan spesifikasi paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane terpublikasi mengonfigurasi baseline dengan resep perintah `openclaw config set` yang sudah dibundel, merekam langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway mulai. Lane Windows packaged dan installer fresh juga memverifikasi bahwa paket yang terinstal dapat mengimpor override browser-control dari path Windows absolut mentah. Smoke agent-turn lintas-OS OpenAI default ke `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika disetel, jika tidak ke `openai/gpt-5.5`, sehingga bukti instalasi dan Gateway tetap berada pada model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Penerimaan Paket memiliki jendela kompatibilitas legacy terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui di `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `patchedDependencies` pnpm yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` persisten yang hilang;
- smoke Plugin dapat membaca lokasi install-record legacy atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan install record dan perilaku no-reinstall tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memperingatkan untuk file stamp metadata build lokal yang sudah dikirim. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama akan gagal alih-alih memperingatkan atau melewati.

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

Saat men-debug run penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa run turunan `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Lebih baik menjalankan ulang profil paket yang gagal atau lane Docker persis daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Workflow `Install Smoke` terpisah menggunakan kembali skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/package, perubahan package/manifest Plugin bawaan, atau permukaan Plugin SDK plugin/channel/gateway inti yang diuji oleh pekerjaan smoke Docker. Perubahan Plugin bawaan yang hanya menyentuh source, edit khusus pengujian, dan edit khusus dokumentasi tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root sekali, memeriksa CLI, menjalankan smoke CLI hapus agents shared-workspace, menjalankan e2e container gateway-network, memverifikasi argumen build ekstensi bawaan, dan menjalankan profil Docker Plugin bawaan terbatas dalam timeout perintah agregat 240 detik (setiap Docker run skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan cakupan pemasangan package QR dan Docker/update penginstal untuk jadwal nightly, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/package/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR SHA target, lalu menjalankan pemasangan package QR, smoke Dockerfile/gateway root, smoke installer/update, dan E2E Docker Plugin bawaan cepat sebagai pekerjaan terpisah agar pekerjaan penginstal tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; ketika logika changed-scope akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke pemasangan penuh ke validasi nightly atau rilis.

Smoke image-provider pemasangan global Bun yang lambat digate secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal nightly dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat ikut mengaktifkannya, tetapi pull request dan push `main` tidak. CI PR normal tetap menjalankan lane regresi peluncur Bun cepat untuk perubahan yang relevan dengan Node. Pengujian Docker QR dan penginstal mempertahankan Dockerfile yang berfokus pada pemasangan masing-masing.

## E2E Docker Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git kosong untuk lane installer/update/plugin-dependency;
- image fungsional yang memasang tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi rencana yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Yang Dapat Disetel

| Variabel                               | Default | Tujuan                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live bersamaan agar provider tidak melakukan throttle.                             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Batas lane pemasangan npm bersamaan.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service bersamaan.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda bertahap antar mulai lane untuk menghindari badai create daemon Docker; setel `0` untuk tanpa jeda. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/tail tertentu memakai batas lebih ketat.     |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak rencana scheduler tanpa menjalankan lane.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agents dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya masih dapat dimulai dari pool kosong, lalu berjalan sendiri hingga melepaskan kapasitas. Agregat lokal melakukan preflight Docker, menghapus container E2E OpenClaw yang usang, memancarkan status lane aktif, mempertahankan timing lane untuk pengurutan yang terlama dulu, dan berhenti menjadwalkan lane pool baru setelah kegagalan pertama secara default.

### Workflow live/E2E yang Dapat Digunakan Ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan kepada `scripts/test-docker-all.mjs --plan-json` cakupan package, jenis image, image live, lane, dan kredensial mana yang diperlukan. `scripts/docker-e2e.mjs` lalu mengubah rencana itu menjadi output dan ringkasan GitHub. Ini dapat mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak package dari run saat ini, atau mengunduh artefak package dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/functional bertag digest package melalui cache layer Docker Blacksmith ketika rencana membutuhkan lane dengan package terpasang; serta menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest package yang ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout per upaya terbatas 180 detik sehingga stream registry/cache yang macet dicoba ulang dengan cepat alih-alih menghabiskan sebagian besar jalur kritis CI.

### Potongan Jalur Rilis

Cakupan Docker rilis menjalankan pekerjaan kecil yang dipotong-potong dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap potongan hanya menarik jenis image yang dibutuhkannya dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Potongan Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `package-update-openai` mencakup lane package Plugin Codex live, yang memasang package kandidat OpenClaw, memasang Plugin Codex dari `codex_plugin_spec` atau tarball same-ref dengan persetujuan pemasangan CLI Codex eksplisit, menjalankan preflight CLI Codex, lalu menjalankan beberapa giliran agent OpenClaw dalam sesi yang sama terhadap OpenAI. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane penginstal provider.

OpenWebUI dimasukkan ke dalam `plugins-runtime-services` ketika cakupan release-path penuh memintanya, dan mempertahankan potongan mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane pembaruan bundled-channel mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap potongan mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON rencana scheduler, tabel lane lambat, dan perintah rerun per lane. Input workflow `docker_lanes` menjalankan lane yang dipilih terhadap image yang sudah disiapkan alih-alih pekerjaan potongan, yang menjaga debugging lane gagal terbatas pada satu pekerjaan Docker terarah dan menyiapkan, mengunduh, atau menggunakan ulang artefak package untuk run tersebut; jika lane yang dipilih adalah lane Docker live, pekerjaan terarah membangun image live-test secara lokal untuk rerun itu. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan ketika nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang package dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # unduh artefak Docker dan cetak perintah rerun gabungan/per-lane terarah
pnpm test:docker:timings <summary>   # ringkasan lane lambat dan jalur kritis fase
```

Workflow live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/package yang lebih mahal, jadi ini adalah workflow terpisah yang didispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri menonaktifkan suite itu. Ini menyeimbangkan pengujian Plugin bawaan di delapan worker ekstensi; pekerjaan shard ekstensi tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch Plugin yang berat impor tidak membuat pekerjaan CI tambahan. Jalur prarilis Docker khusus rilis membatch lane Docker terarah dalam grup kecil untuk menghindari pencadangan puluhan runner untuk pekerjaan satu hingga tiga menit. Workflow juga mengunggah artefak informasional `plugin-inspector-advisory` dari `@openclaw/plugin-inspector`; temuan inspector adalah input triage dan tidak mengubah gate `Plugin Prerelease` yang memblokir.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow smart-scoped utama. Paritas agentic berada di bawah harness QA luas dan rilis, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus ikut dalam run validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan nightly pada `main` dan pada dispatch manual; ini mem-fan out lane paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai pekerjaan paralel. Pekerjaan live memakai lingkungan `qa-live-shared`, dan Telegram/Discord memakai lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan provider mock deterministik dan model yang memenuhi syarat mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel diisolasi dari latensi model live dan startup provider-plugin normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas provider dicakup oleh suite model live, provider native, dan provider Docker yang terpisah.

Matrix memakai `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu memecah cakupan Matrix penuh menjadi pekerjaan `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan pack kandidat dan baseline sebagai pekerjaan lane paralel, lalu mengunduh kedua artefak ke pekerjaan laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/check berskoped alih-alih memperlakukan paritas sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja menjadi pemindai keamanan first-pass yang sempit, bukan sweep repositori penuh. Run harian, manual, dan penjaga pull request non-draft memindai kode workflow Actions plus permukaan JavaScript/TypeScript berisiko tertinggi dengan query keamanan keyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Penjaga pull request tetap ringan: ini hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, atau path runtime Plugin bawaan yang memiliki proses, dan menjalankan matriks keamanan keyakinan tinggi yang sama seperti workflow terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, rahasia, sandbox, cron, dan baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti ditambah runtime plugin channel, gateway, Plugin SDK, rahasia, titik sentuh audit                 |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, penguraian IP, penjaga jaringan, web-fetch, dan SSRF Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gerbang eksekusi alat agen                                               |
| `/codeql-security-high/process-exec-boundary`     | Shell lokal, helper spawn proses, runtime plugin terbundel yang memiliki subprocess, dan perekat skrip workflow                     |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifest, registry, instalasi package-manager, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Linux Blacksmith terkecil yang diterima oleh sanity workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Disimpan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Critical Quality

`CodeQL Critical Quality` adalah shard non-keamanan yang sesuai. Ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error pada permukaan bernilai tinggi yang sempit di runner Linux yang di-host GitHub agar pemindaian kualitas tidak menghabiskan anggaran registrasi runner Blacksmith. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draft hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk perubahan kode eksekusi perintah/model/alat agen dan dispatch balasan, skema konfigurasi/migrasi/IO, auth/rahasia/sandbox/keamanan, channel inti dan runtime plugin channel terbundel, protokol/metode-server gateway, perekat runtime/SDK memori, MCP/proses/pengiriman keluar, katalog runtime/model provider, antrean diagnostik/pengiriman sesi, loader plugin, kontrak Plugin SDK/paket, atau runtime balasan Plugin SDK. Perubahan konfigurasi CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terpisah.

| Kategori                                                | Permukaan                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan auth, rahasia, sandbox, cron, dan gateway                                                                                                     |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema konfigurasi, migrasi, normalisasi, dan IO                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan plugin channel terbundel                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Eksekusi perintah, dispatch model/provider, dispatch dan antrean auto-reply, serta kontrak runtime control-plane ACP                                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan jembatan alat, helper supervisi proses, dan kontrak pengiriman keluar                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, fasad runtime memori, alias Plugin SDK memori, perekat aktivasi runtime memori, dan perintah doctor memori                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundel event/log diagnostik, dan kontrak CLI doctor sesi      |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread              |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, dan registry web/search/fetch/embedding             |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, persistensi lokal, alur kontrol gateway, dan kontrak runtime control-plane tugas                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, image-generation, dan media-generation                                                           |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket plugin                                                                                  |

Kualitas tetap dipisahkan dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan plugin terbundel harus ditambahkan kembali sebagai pekerjaan lanjutan yang terlingkup atau di-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Workflow pemeliharaan

### Docs Agent

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga docs yang ada tetap selaras dengan perubahan yang baru landed. Workflow ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Pemanggilan workflow-run dilewati saat `main` sudah bergerak maju atau saat run Docs Agent non-skipped lain dibuat dalam satu jam terakhir. Saat berjalan, workflow ini meninjau rentang commit dari SHA sumber Docs Agent non-skipped sebelumnya ke `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pass docs terakhir.

### Test Performance Agent

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk test yang lambat. Workflow ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, tetapi dilewati jika pemanggilan workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC itu. Dispatch manual melewati gerbang aktivitas harian tersebut. Lane ini membangun laporan performa Vitest full-suite yang dikelompokkan, membiarkan Codex hanya membuat perbaikan performa test kecil yang mempertahankan cakupan, bukan refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah baseline test yang lulus. Laporan yang dikelompokkan mencatat wall time per konfigurasi dan RSS maksimum di Linux dan macOS, sehingga perbandingan sebelum/sesudah menampilkan delta memori test di samping delta durasi. Jika baseline memiliki test yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lulus sebelum apa pun di-commit. Saat `main` maju sebelum push bot masuk, lane ini me-rebase patch yang sudah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba push lagi; patch stale yang konflik dilewati. Workflow ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keselamatan drop-sudo yang sama seperti docs agent.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat pasca-land. Default-nya dry-run dan hanya menutup PR yang dicantumkan secara eksplisit saat `apply=true`. Sebelum memutasi GitHub, workflow ini memverifikasi bahwa PR yang landed sudah di-merge dan bahwa setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gerbang pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gerbang pemeriksaan lokal itu lebih ketat tentang batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan test inti ditambah lint/guard inti;
- perubahan khusus test inti hanya menjalankan typecheck test inti ditambah lint inti;
- perubahan produksi extension menjalankan typecheck prod extension dan test extension ditambah lint extension;
- perubahan khusus test extension menjalankan typecheck test extension ditambah lint extension;
- perubahan Plugin SDK publik atau kontrak plugin meluas ke typecheck extension karena extension bergantung pada kontrak inti tersebut (sweep extension Vitest tetap menjadi pekerjaan test eksplisit);
- bump versi khusus metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi-root yang ditargetkan;
- perubahan root/konfigurasi yang tidak dikenal fail safe ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit test langsung menjalankan dirinya sendiri, edit sumber memprioritaskan mapping eksplisit, lalu test sibling dan dependensi import-graph. Konfigurasi pengiriman group-room bersama adalah salah satu mapping eksplisit: perubahan pada konfigurasi visible-reply grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui test balasan inti ditambah regresi pengiriman Discord dan Slack agar perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya saat perubahan cukup luas di seluruh harness sehingga set murah yang dipetakan bukan proksi yang tepercaya.

## Validasi Testbox

Crabbox adalah wrapper remote-box milik repo untuk bukti Linux maintainer. Gunakan
dari root repo saat sebuah pemeriksaan terlalu luas untuk loop edit lokal, saat
paritas CI penting, atau saat bukti memerlukan secret, Docker, lane paket,
box yang dapat digunakan ulang, atau log jarak jauh. Backend OpenClaw normal adalah
`blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah fallback untuk gangguan Blacksmith,
masalah kuota, atau pengujian kapasitas milik sendiri secara eksplisit.

Run Blacksmith yang didukung Crabbox melakukan warm, claim, sync, run, report, dan membersihkan
Testbox sekali pakai. Pemeriksaan kewajaran sync bawaan gagal cepat saat file
root yang diperlukan seperti `pnpm-lock.yaml` hilang atau saat `git status --short`
menampilkan setidaknya 200 penghapusan terlacak. Untuk PR penghapusan besar yang disengaja, setel
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk perintah jarak jauh.

Crabbox juga menghentikan pemanggilan CLI Blacksmith lokal yang tetap berada dalam
fase sync selama lebih dari lima menit tanpa output pasca-sync. Setel
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` untuk menonaktifkan penjaga itu, atau gunakan nilai
milidetik yang lebih besar untuk diff lokal yang sangat besar.

Sebelum run pertama, periksa wrapper dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo menolak binary Crabbox usang yang tidak mengiklankan `blacksmith-testbox`. Berikan provider secara eksplisit meskipun `.crabbox.yaml` memiliki default owned-cloud. Di worktree Codex atau checkout linked/sparse, hindari skrip lokal `pnpm crabbox:run` karena pnpm dapat merekonsiliasi dependensi sebelum Crabbox mulai; panggil wrapper node secara langsung sebagai gantinya:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Run yang didukung Blacksmith memerlukan Crabbox 0.22.0 atau yang lebih baru agar wrapper mendapatkan perilaku sync, antrean, dan pembersihan Testbox saat ini. Saat menggunakan checkout saudara, bangun ulang binary lokal yang diabaikan sebelum pekerjaan timing atau bukti:

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
`syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Untuk run
Blacksmith Testbox yang didelegasikan, kode keluar wrapper Crabbox dan ringkasan JSON adalah
hasil perintah. Run GitHub Actions tertaut memiliki hydration dan keepalive; ia
dapat selesai sebagai `cancelled` saat Testbox dihentikan secara eksternal setelah perintah SSH
sudah kembali. Perlakukan itu sebagai artefak pembersihan/status kecuali
`exitCode` wrapper bukan nol atau output perintah menunjukkan pengujian gagal.
Run Crabbox sekali pakai yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis;
jika run terinterupsi atau pembersihan tidak jelas, inspeksi box live dan hentikan hanya
box yang Anda buat:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gunakan reuse hanya saat Anda sengaja memerlukan beberapa perintah pada box ter-hydrate yang sama:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jika Crabbox adalah lapisan yang rusak tetapi Blacksmith sendiri berfungsi, gunakan
Blacksmith langsung hanya untuk diagnostik seperti `list`, `status`, dan pembersihan. Perbaiki
jalur Crabbox sebelum memperlakukan run Blacksmith langsung sebagai bukti maintainer.

Jika `blacksmith testbox list --all` dan `blacksmith testbox status` berfungsi tetapi warmup baru
tetap `queued` tanpa IP atau URL run Actions setelah beberapa menit,
perlakukan itu sebagai tekanan provider, antrean, penagihan, atau batas org Blacksmith. Hentikan
id antrean yang Anda buat, hindari memulai Testbox lagi, dan pindahkan bukti ke
jalur kapasitas Crabbox milik sendiri di bawah ini sementara seseorang memeriksa dashboard,
penagihan, dan batas org Blacksmith.

Eskalasi ke kapasitas Crabbox milik sendiri hanya saat Blacksmith down, dibatasi kuota, kehilangan lingkungan yang diperlukan, atau kapasitas milik sendiri adalah tujuan eksplisit:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Di bawah tekanan AWS, hindari `class=beast` kecuali tugas benar-benar memerlukan CPU kelas 48xlarge. Permintaan `beast` dimulai dari 192 vCPU dan merupakan cara termudah untuk memicu kuota regional EC2 Spot atau On-Demand Standard. `.crabbox.yaml` milik repo default ke `standard`, beberapa region kapasitas, dan `capacity.hints: true` sehingga lease AWS yang dibrokerkan mencetak region/market terpilih, tekanan kuota, fallback Spot, dan peringatan kelas tekanan tinggi. Gunakan `fast` untuk pemeriksaan luas yang lebih berat, `large` hanya setelah standard/fast tidak cukup, dan `beast` hanya untuk lane CPU-bound luar biasa seperti suite penuh atau matriks Docker semua Plugin, validasi release/blocker eksplisit, atau profiling performa high-core. Jangan gunakan `beast` untuk `pnpm check:changed`, pengujian terfokus, pekerjaan khusus docs, lint/typecheck biasa, repro E2E kecil, atau triase gangguan Blacksmith. Gunakan `--market on-demand` untuk diagnosis kapasitas agar churn pasar Spot tidak tercampur ke dalam sinyal.

`.crabbox.yaml` memiliki default provider, sync, dan hydration GitHub Actions untuk lane owned-cloud. File ini mengecualikan `.git` lokal sehingga checkout Actions ter-hydrate mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan object store lokal maintainer, dan mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, penyiapan Node/pnpm, fetch `origin/main`, dan handoff lingkungan non-secret untuk perintah owned-cloud `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
