---
read_when:
    - Anda perlu memahami mengapa sebuah pekerjaan CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pengulangan validasi rilis
    - Anda mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Graf pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur kerja CI
x-i18n:
    generated_at: "2026-05-04T07:03:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan menonaktifkan lane mahal ketika hanya area yang tidak terkait yang berubah. Eksekusi manual `workflow_dispatch` sengaja melewati pemetaan cakupan cerdas dan menyebarkan graf penuh untuk kandidat rilis dan validasi luas. Lane Android tetap opsional melalui `include_android`. Cakupan plugin khusus rilis berada di workflow [`Plugin Prerelease`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Full Release Validation`](#full-release-validation) atau dispatch manual eksplisit.

## Ikhtisar pipeline

| Job                              | Tujuan                                                                                                   | Kapan berjalan                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, cakupan yang berubah, ekstensi yang berubah, dan membangun manifes CI                   | Selalu pada push dan PR non-draft |
| `security-scm-fast`              | Deteksi kunci privat dan audit workflow melalui `zizmor`                                                     | Selalu pada push dan PR non-draft |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisori npm                                          | Selalu pada push dan PR non-draft |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                             | Selalu pada push dan PR non-draft |
| `check-dependencies`             | Pass Knip khusus dependensi produksi plus guard allowlist file yang tidak digunakan                                 | Perubahan yang relevan dengan Node              |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak build, dan artefak downstream yang dapat digunakan ulang                       | Perubahan yang relevan dengan Node              |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol                              | Perubahan yang relevan dengan Node              |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil                                      | Perubahan yang relevan dengan Node              |
| `checks-node-core-test`          | Shard tes Node inti, mengecualikan lane channel, bundled, contract, dan extension                          | Perubahan yang relevan dengan Node              |
| `check`                          | Padanan gate lokal utama yang di-shard: tipe prod, lint, guard, tipe tes, dan smoke ketat                | Perubahan yang relevan dengan Node              |
| `check-additional`               | Arsitektur, drift boundary/prompt yang di-shard, guard ekstensi, boundary paket, dan gateway watch        | Perubahan yang relevan dengan Node              |
| `build-smoke`                    | Tes smoke CLI hasil build dan smoke memori startup                                                            | Perubahan yang relevan dengan Node              |
| `checks`                         | Verifikator untuk tes channel artefak build                                                                 | Perubahan yang relevan dengan Node              |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                                | Dispatch CI manual untuk rilis    |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan broken link                                                             | Docs berubah                       |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                                    | Perubahan yang relevan dengan skill Python      |
| `checks-windows`                 | Tes proses/path khusus Windows plus regresi specifier impor runtime bersama                      | Perubahan yang relevan dengan Windows           |
| `macos-node`                     | Lane tes TypeScript macOS menggunakan artefak build bersama                                               | Perubahan yang relevan dengan macOS             |
| `macos-swift`                    | Swift lint, build, dan tes untuk aplikasi macOS                                                            | Perubahan yang relevan dengan macOS             |
| `android`                        | Tes unit Android untuk kedua flavor plus satu build APK debug                                              | Perubahan yang relevan dengan Android           |
| `test-performance-agent`         | Optimisasi tes lambat Codex harian setelah aktivitas tepercaya                                                 | CI main berhasil atau dispatch manual |
| `openclaw-performance`           | Laporan performa runtime Kova harian/berdasarkan permintaan dengan lane mock-provider, deep-profile, dan live GPT 5.4 | Terjadwal dan dispatch manual      |

## Urutan fail-fast

1. `preflight` menentukan lane mana yang ada sejak awal. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job matriks artefak dan platform yang lebih berat.
3. `build-artifacts` berjalan beririsan dengan lane Linux cepat agar konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR yang sama atau ref `main`. Perlakukan itu sebagai noise CI kecuali eksekusi terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tergantikan. Kunci konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga zombie di sisi GitHub dalam grup antrean lama tidak dapat memblokir eksekusi main yang lebih baru tanpa batas. Eksekusi full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan eksekusi yang sedang berjalan.

## Cakupan dan routing

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh tes unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area bercakupan berubah.

- **Edit workflow CI** memvalidasi graf CI Node plus linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap dicakup ke perubahan sumber platform.
- **Edit khusus routing CI, edit fixture core-test murah tertentu, dan edit helper/test-routing kontrak plugin yang sempit** menggunakan jalur manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard inti penuh, shard bundled-plugin, dan matriks guard tambahan ketika perubahan terbatas pada permukaan routing atau helper yang langsung diuji tugas cepat.
- **Pemeriksaan Node Windows** dicakup ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang mengeksekusi lane itu; perubahan sumber, plugin, install-smoke, dan khusus tes yang tidak terkait tetap berada pada lane Node Linux.

Keluarga tes Node paling lambat dipisah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, lane core unit fast/support berjalan terpisah, infrastruktur runtime inti dibagi antara shard state dan process/config, auto-reply berjalan sebagai worker seimbang (dengan subtree reply dipisah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi gateway/server agentic dipisah di lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artefak build. Tes browser, QA, media, dan plugin lain yang luas menggunakan konfigurasi Vitest khususnya, bukan catch-all plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard terfilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar guard boundary distriping di empat shard matriks, masing-masing menjalankan guard independen terpilih secara bersamaan dan mencetak timing per pemeriksaan, termasuk `pnpm prompt:snapshots:check` sehingga drift prompt happy-path runtime Codex dipatok ke PR yang menyebabkannya. Gateway watch, tes channel, dan shard core support-boundary berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor third-party tidak memiliki source set atau manifes terpisah; lane tes unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sekaligus menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass Knip khusus dependensi produksi yang dipatok ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file produksi tidak terpakai dari Knip dengan `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak terpakai gagal ketika PR menambahkan file tidak terpakai baru yang belum ditinjau atau meninggalkan entri allowlist basi, sambil mempertahankan permukaan plugin dinamis, generated, build, live-test, dan package bridge yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repository OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow ini memiliki empat lane:

- `clawsweeper_item` untuk permintaan tinjauan issue dan pull request yang tepat;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit di komentar issue;
- `clawsweeper_commit_review` untuk permintaan tinjauan tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis event, aksi, aktor, repository, nomor item, URL, judul, status, dan kutipan singkat untuk komentar atau ulasan jika ada. Lane ini sengaja menghindari penerusan seluruh body webhook. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang mengirim event yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord di prompt-nya dan hanya boleh memposting ke `#clawsweeper` ketika event mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise webhook duplikat, dan lalu lintas ulasan normal harus menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, body, teks ulasan, nama branch, dan pesan commit GitHub sebagai data yang tidak tepercaya di seluruh jalur ini. Semua itu adalah input untuk peringkasan dan triase, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan grafik job yang sama seperti CI normal tetapi memaksa setiap lane berscope non-Android aktif: shard Linux Node, shard plugin bawaan, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan dokumen, Python skills, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri hanya menjalankan Android dengan `include_android=true`; umbrella rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis Plugin, shard `agentic-plugins` khusus rilis, sweep batch ekstensi penuh, dan lane Docker prarilis Plugin dikecualikan dari CI. Suite Docker prarilis hanya berjalan saat `Full Release Validation` men-dispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup konkurensi unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan caller tepercaya menjalankan grafik tersebut terhadap branch, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job dan agregat keamanan cepat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/bundled cepat, pemeriksaan kontrak channel tershard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifier agregat pengujian Node, pemeriksaan dokumen, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang dihosting GitHub agar matriks Blacksmith dapat antre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ekstensi berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Linux Node, shard pengujian plugin bawaan, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif CPU sehingga 8 vCPU memakan biaya lebih besar daripada penghematannya); build Docker install-smoke (waktu antre 32-vCPU memakan biaya lebih besar daripada penghematannya)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Padanan Lokal

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Performa OpenClaw

`OpenClaw Performance` adalah workflow performa produk/runtime. Workflow ini berjalan setiap hari pada `main` dan dapat di-dispatch secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch manual biasanya melakukan benchmark terhadap ref workflow. Tetapkan `target_ref` untuk melakukan benchmark terhadap tag rilis atau branch lain dengan implementasi workflow saat ini. Path laporan yang diterbitkan dan pointer terbaru dikunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA workflow, ref Kova, profil, mode auth lane, model, jumlah pengulangan, dan filter skenario.

Workflow menginstal OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: Skenario diagnostik Kova terhadap runtime build lokal dengan auth palsu kompatibel OpenAI yang deterministik.
- `mock-deep-profile`: Profiling CPU/heap/trace untuk hotspot startup, gateway, dan giliran agen.
- `live-gpt54`: Giliran agen OpenAI `openai/gpt-5.4` nyata, dilewati saat `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah pass Kova: timing boot gateway dan memori pada kasus startup default, hook, dan 50-plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; dan perintah startup CLI terhadap gateway yang sudah boot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundle laporan, dengan JSON mentah di sebelahnya.

Setiap lane mengunggah artefak GitHub. Saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, workflow juga meng-commit `report.json`, `report.md`, bundle, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer ref yang sedang diuji ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow umbrella manual untuk "menjalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit penuh, men-dispatch workflow manual `CI` dengan target tersebut, men-dispatch `Plugin Prerelease` untuk bukti plugin/paket/statis/Docker khusus rilis, dan men-dispatch `OpenClaw Release Checks` untuk install smoke, penerimaan paket, suite jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah penerbitan, teruskan `npm_telegram_package_spec` untuk menjalankan ulang lane paket Telegram yang sama terhadap paket npm yang sudah diterbitkan.

Lihat [validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama job workflow persis, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah workflow rilis manual yang mengubah state. Dispatch dari `release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah preflight npm OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`, men-dispatch `Plugin NPM Release` untuk semua paket plugin yang dapat diterbitkan, men-dispatch `Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru kemudian men-dispatch `OpenClaw NPM Release` dengan `preflight_run_id` yang disimpan.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan helper alih-alih
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref dispatch workflow GitHub harus berupa branch atau tag, bukan SHA commit mentah. Helper
mendorong branch sementara `release-ci/<sha>-...` pada SHA target,
men-dispatch `Full Release Validation` dari ref yang dipin tersebut, memverifikasi setiap
workflow turunan `headSha` cocok dengan target, dan menghapus branch sementara saat
run selesai. Verifier umbrella juga gagal jika workflow turunan mana pun berjalan pada
SHA yang berbeda.

`release_profile` mengontrol cakupan langsung/penyedia yang diteruskan ke pemeriksaan rilis. Alur kerja rilis manual default ke `stable`; gunakan `full` hanya saat Anda memang menginginkan matriks penasihat penyedia/media yang luas.

- `minimum` mempertahankan jalur OpenAI/inti yang paling cepat dan kritis untuk rilis.
- `stable` menambahkan set penyedia/backend stabil.
- `full` menjalankan matriks penasihat penyedia/media yang luas.

Umbrella mencatat id proses anak yang dikirim, dan pekerjaan akhir `Verify full validation` memeriksa ulang kesimpulan proses anak saat ini serta menambahkan tabel pekerjaan paling lambat untuk setiap proses anak. Jika alur kerja anak dijalankan ulang dan menjadi hijau, jalankan ulang hanya pekerjaan pemverifikasi induk untuk menyegarkan hasil umbrella dan ringkasan waktunya.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` sama-sama menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk anak CI penuh normal, `plugin-prerelease` hanya untuk anak prarilis Plugin, `release-checks` untuk setiap anak rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada umbrella. Ini menjaga proses ulang kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk menyelesaikan ref yang dipilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke alur kerja Docker jalur rilis langsung/E2E dan shard penerimaan paket. Ini menjaga byte paket tetap konsisten di seluruh kotak rilis dan menghindari pengemasan ulang kandidat yang sama di beberapa pekerjaan anak.

Proses `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan umbrella yang lebih lama. Pemantau induk membatalkan setiap alur kerja anak yang
telah dikirim saat induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang proses pemeriksaan rilis usang berdurasi dua jam. Validasi cabang/tag
rilis dan grup proses ulang terfokus mempertahankan `cancel-in-progress: false`.

## Shard Langsung dan E2E

Anak langsung/E2E rilis mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs`, bukan sebagai satu pekerjaan serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- pekerjaan `native-live-src-gateway-profiles` yang difilter penyedia
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard audio/video media terpisah dan shard musik yang difilter penyedia

Ini mempertahankan cakupan file yang sama sekaligus membuat kegagalan penyedia langsung yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk proses ulang sekali jalan secara manual.

Shard media langsung native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh alur kerja `Live Media Runner Image`. Image itu memasang `ffmpeg` dan `ffprobe` terlebih dahulu; pekerjaan media hanya memverifikasi biner sebelum penyiapan. Pertahankan suite langsung berbasis Docker pada runner Blacksmith normal — pekerjaan container bukan tempat yang tepat untuk meluncurkan pengujian Docker bersarang.

Shard model/backend langsung berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Alur kerja rilis langsung membangun dan mendorong image itu satu kali, lalu shard model langsung Docker, Gateway yang di-shard menurut penyedia, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` tingkat skrip eksplisit di bawah batas waktu pekerjaan alur kerja, sehingga container yang macet atau jalur pembersihan gagal cepat alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, proses rilis salah konfigurasi dan akan membuang waktu pada build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` saat pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness Docker E2E yang sama dengan yang digunakan pengguna setelah memasang atau memperbarui.

### Pekerjaan

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref alur kerja, ref paket, versi, SHA-256, dan profil dalam ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Alur kerja reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker digest paket bila diperlukan, dan menjalankan jalur Docker yang dipilih terhadap paket tersebut alih-alih mengemas checkout alur kerja. Saat sebuah profil memilih beberapa `docker_lanes` bertarget, alur kerja reusable menyiapkan paket dan image bersama satu kali, lalu menyebarkan jalur tersebut sebagai pekerjaan Docker bertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan saat `telegram_mode` bukan `none` dan memasang artefak `package-under-test` yang sama saat Penerimaan Paket menyelesaikannya; dispatch Telegram mandiri masih dapat memasang spesifikasi npm yang diterbitkan.
4. `summary` menggagalkan alur kerja jika penyelesaian paket, penerimaan Docker, atau jalur Telegram opsional gagal.

### Sumber Kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prarilis/stabil yang telah diterbitkan.
- `source=ref` mengemas cabang, tag, atau SHA commit penuh `package_ref` tepercaya. Resolver mengambil cabang/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat cabang repositori atau tag rilis, memasang dependensi dalam worktree terlepas, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya diberikan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode alur kerja/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas saat `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika alur kerja lama.

### Profil Suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — potongan jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib saat `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang diterbitkan tidak bergantung pada ketersediaan ClawHub langsung. Jalur Telegram opsional menggunakan kembali artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang diterbitkan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan pembaruan dan pengujian Plugin khusus, termasuk perintah lokal,
jalur Docker, input Penerimaan Paket, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Penerimaan Paket dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, pembaruan, pembersihan dependensi Plugin usang, perbaikan pemasangan Plugin yang dikonfigurasi, Plugin offline, pembaruan Plugin, dan bukti Telegram pada tarball paket terselesaikan yang sama. Atur `package_acceptance_package_spec` pada Full Release Validation atau OpenClaw Release Checks untuk menjalankan matriks yang sama terhadap paket npm yang telah dikirim, bukan artefak yang dibangun dari SHA. Pemeriksaan rilis lintas-OS tetap mencakup onboarding, installer, dan perilaku platform khusus OS; validasi produk paket/pembaruan harus dimulai dengan Penerimaan Paket. Jalur Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang diterbitkan per proses. Dalam Penerimaan Paket, tarball `package-under-test` yang diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline terbitan fallback, dengan default `openclaw@latest`; perintah proses ulang jalur gagal mempertahankan baseline itu. Atur `published_upgrade_survivor_baselines=all-since-2026.4.23` untuk memperluas CI Rilis Penuh ke setiap rilis npm stabil dari `2026.4.23` hingga `latest`; `release-history` tetap tersedia untuk pengambilan sampel manual yang lebih luas dengan jangkar tanggal lama. Atur `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas baseline yang sama ke seluruh fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, pemasangan Plugin OpenClaw yang dikonfigurasi, jalur log tilde, dan root dependensi Plugin lama yang usang. Alur kerja terpisah `Update Migration` menggunakan jalur Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` saat pertanyaannya adalah pembersihan pembaruan terbitan yang menyeluruh, bukan cakupan CI Rilis Penuh normal. Proses agregat lokal dapat meneruskan spesifikasi paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu jalur dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau mengatur `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Jalur terbitan mengonfigurasi baseline dengan resep perintah `openclaw config set` yang sudah dipanggang, mencatat langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway dimulai. Jalur paket Windows dan installer baru juga memverifikasi bahwa paket terpasang dapat mengimpor override kontrol browser dari jalur Windows absolut mentah. Smoke giliran agen lintas-OS OpenAI menggunakan default `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat disetel, jika tidak `openai/gpt-5.4`, sehingga bukti pemasangan dan Gateway tetap memakai model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela Kompatibilitas Lama

Penerimaan Paket memiliki jendela kompatibilitas lama yang terbatas untuk paket yang sudah diterbitkan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui dalam `dist/postinstall-inventory.json` dapat mengarah ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` saat paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` persisten yang hilang;
- smoke Plugin dapat membaca lokasi catatan pemasangan lama atau menerima persistensi catatan pemasangan marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan catatan pemasangan dan perilaku tanpa pemasangan ulang tetap tidak berubah.

Paket `2026.4.26` yang diterbitkan juga dapat memperingatkan untuk file cap metadata build lokal yang sudah dikirim. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama gagal alih-alih memperingatkan atau melewati.

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
  -f package_ref=release/YYYY.M.D \
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

Saat men-debug proses penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa proses turunan `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, pengaturan waktu fase, dan perintah rerun. Lebih baik menjalankan ulang profil paket yang gagal atau lane Docker persisnya daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Workflow `Install Smoke` yang terpisah menggunakan kembali skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifest Plugin yang dibundel, atau permukaan inti Plugin/channel/gateway/Plugin SDK yang diuji oleh job smoke Docker. Perubahan Plugin bundel yang hanya menyentuh sumber, edit khusus pengujian, dan edit khusus dokumentasi tidak memesan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e gateway-network container, memverifikasi argumen build ekstensi bundel, dan menjalankan profil Docker Plugin bundel terbatas di bawah timeout perintah agregat 240 detik (setiap proses Docker skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan instalasi paket QR dan cakupan Docker/update installer untuk proses terjadwal malam hari, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan kembali satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instalasi paket QR, smoke Dockerfile root/gateway, smoke installer/update, dan E2E Docker Plugin bundel cepat sebagai job terpisah agar pekerjaan installer tidak menunggu di belakang smoke image root.

Push ke `main` (termasuk commit merge) tidak memaksa jalur penuh; ketika logika cakupan perubahan akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi malam hari atau rilis.

Smoke image-provider instalasi global Bun yang lambat digate secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam hari dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat ikut mengaktifkannya, tetapi pull request dan push ke `main` tidak. Pengujian Docker QR dan installer mempertahankan Dockerfile yang berfokus pada instalasi masing-masing.

## E2E Docker Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw satu kali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya menjalankan rencana yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Penyetelan

| Variabel                               | Default | Tujuan                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot pool ekor yang sensitif terhadap penyedia.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live serentak agar penyedia tidak melakukan throttle.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instalasi npm serentak.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-layanan serentak.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda bertahap antar-start lane untuk menghindari badai create daemon Docker; setel `0` untuk tanpa jeda. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/ekor terpilih memakai batas yang lebih ketat. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak rencana scheduler tanpa menjalankan lane.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati smoke pembersihan agar agen dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya masih dapat dimulai dari pool kosong, lalu berjalan sendiri sampai melepaskan kapasitas. Preflight agregat lokal memeriksa Docker, menghapus container E2E OpenClaw yang basi, memancarkan status lane aktif, menyimpan pengaturan waktu lane untuk pengurutan terlama lebih dulu, dan secara default berhenti menjadwalkan lane pool baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan kembali

Workflow live/E2E yang dapat digunakan kembali menanyakan `scripts/test-docker-all.mjs --plan-json` paket, jenis image, image live, lane, dan cakupan kredensial yang diperlukan. `scripts/docker-e2e.mjs` kemudian mengubah rencana itu menjadi output dan ringkasan GitHub. Workflow ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket dari proses saat ini, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/fungsional bertag digest paket melalui cache layer Docker Blacksmith saat rencana membutuhkan lane dengan paket terinstal; dan menggunakan kembali input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout terbatas 180 detik per percobaan agar stream registry/cache yang macet cepat dicoba ulang alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkannya dan menjalankan beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat Plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer penyedia.

OpenWebUI digabungkan ke `plugins-runtime-services` ketika cakupan release-path penuh memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane update channel bundel mencoba ulang satu kali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, pengaturan waktu, `summary.json`, `failures.json`, pengaturan waktu fase, JSON rencana scheduler, tabel lane lambat, dan perintah rerun per lane. Input `docker_lanes` workflow menjalankan lane terpilih terhadap image yang sudah disiapkan alih-alih job chunk, sehingga debug lane gagal tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan kembali artefak paket untuk proses tersebut; jika lane terpilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun itu. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan saat nilai tersebut ada, sehingga lane yang gagal dapat menggunakan kembali paket dan image persis dari proses yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, jadi ini adalah workflow terpisah yang didispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push ke `main`, dan dispatch CI manual mandiri menonaktifkan suite itu. Workflow ini menyeimbangkan pengujian Plugin bundel di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch Plugin yang berat impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis mengelompokkan lane Docker tertarget dalam grup kecil untuk menghindari pemesanan puluhan runner bagi job berdurasi satu hingga tiga menit.

## Lab QA

Lab QA memiliki lane CI khusus di luar workflow utama yang dicakup secara cerdas. Paritas agentik disarangkan di bawah harness QA dan rilis yang luas, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus ikut dalam proses validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan pada dispatch manual; workflow ini menyebarkan lane paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan penyedia mock deterministik dan model yang memenuhi syarat mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel diisolasi dari latensi model live dan startup Plugin penyedia normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh suite model live, penyedia native, dan penyedia Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu melakukan shard cakupan Matrix penuh ke job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane Lab QA yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/pemeriksaan tercakup alih-alih memperlakukan paritas sebagai status wajib.

## CodeQL

Alur kerja `CodeQL` sengaja dibuat sebagai pemindai keamanan tahap awal yang sempit, bukan sapuan repositori penuh. Setiap hari, manual, dan pada guard pull request non-draf, pemindaian menjalankan kode workflow Actions ditambah permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Guard pull request tetap ringan: guard ini hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti workflow terjadwal. CodeQL Android dan macOS tetap di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, rahasia, sandbox, cron, dan baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti ditambah runtime Plugin channel, Gateway, Plugin SDK, rahasia, titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, parsing IP, penjaga jaringan, web-fetch, dan SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gate eksekusi tool agen                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifest, registry, instalasi package-manager, source-loading, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Critical Quality

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error di permukaan sempit bernilai tinggi pada runner Blacksmith Linux yang lebih kecil. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draf hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk perubahan pada kode eksekusi perintah/model/tool agen dan dispatch balasan, kode skema/migrasi/IO config, kode auth/rahasia/sandbox/keamanan, runtime channel inti dan Plugin channel bawaan, metode server/protokol gateway, runtime memori/perekat SDK, MCP/proses/pengiriman keluar, katalog model/runtime provider, antrean diagnostik/pengiriman sesi, loader Plugin, kontrak paket/Plugin SDK, atau runtime balasan Plugin SDK. Perubahan config CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Permukaan                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, rahasia, sandbox, cron, dan kode batas keamanan gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Skema config, migrasi, normalisasi, dan kontrak IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan Plugin channel bawaan                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Eksekusi perintah, dispatch model/provider, dispatch dan antrean auto-reply, serta kontrak runtime control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge tool, helper supervisi proses, serta kontrak pengiriman keluar                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, facade runtime memori, alias Plugin SDK memori, perekat aktivasi runtime memori, dan perintah doctor memori                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundle event/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, serta registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, flow kontrol Gateway, dan kontrak runtime control-plane tugas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, image-generation, dan media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, public-surface, dan entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket plugin                                                                                      |

Kualitas tetap dipisahkan dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan bundled-plugin harus ditambahkan kembali sebagai pekerjaan lanjutan yang terskop atau di-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Workflow pemeliharaan

### Docs Agent

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru mendarat. Workflow ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Invokasi workflow-run dilewati saat `main` sudah bergerak maju atau saat run Docs Agent non-skip lain dibuat dalam satu jam terakhir. Saat berjalan, workflow ini meninjau rentang commit dari SHA sumber Docs Agent non-skip sebelumnya ke `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pass dokumen terakhir.

### Test Performance Agent

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk test lambat. Workflow ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, tetapi dilewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gate aktivitas harian itu. Lane ini membangun laporan performa Vitest full-suite yang dikelompokkan, mengizinkan Codex hanya membuat perbaikan performa test kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah test baseline yang lolos. Jika baseline memiliki test yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lolos sebelum apa pun di-commit. Saat `main` bergerak maju sebelum push bot mendarat, lane ini melakukan rebase patch yang telah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba push lagi; patch usang yang konflik dilewati. Workflow ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keselamatan drop-sudo yang sama seperti docs agent.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat pasca-land. Default-nya dry-run dan hanya menutup PR yang dicantumkan secara eksplisit saat `apply=true`. Sebelum memutasi GitHub, workflow ini memverifikasi bahwa PR yang mendarat sudah di-merge dan bahwa setiap duplikat memiliki issue referensi bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate check lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gate check lokal itu lebih ketat tentang batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan test inti ditambah lint/guard inti;
- perubahan khusus test inti hanya menjalankan typecheck test inti ditambah lint inti;
- perubahan produksi extension menjalankan typecheck prod extension dan test extension ditambah lint extension;
- perubahan khusus test extension menjalankan typecheck test extension ditambah lint extension;
- perubahan Plugin SDK publik atau kontrak plugin meluas ke typecheck extension karena extension bergantung pada kontrak inti tersebut (sapuan extension Vitest tetap berupa pekerjaan test eksplisit);
- bump versi khusus metadata rilis menjalankan check versi/config/dependensi-root yang ditargetkan;
- perubahan root/config yang tidak dikenal fail safe ke semua lane check.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit test langsung menjalankan dirinya sendiri, edit source memprioritaskan pemetaan eksplisit, lalu test saudara dan dependen import-graph. Config pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada config visible-reply grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui test balasan inti ditambah regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya saat perubahan cukup luas di harness sehingga set terpetakan murah bukan proxy yang dapat dipercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan utamakan box baru yang sudah di-warm untuk pembuktian luas. Sebelum menghabiskan gate yang lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sync yang ukurannya tak terduga besar, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat saat file root wajib seperti `pnpm-lock.yaml` menghilang atau saat `git status --short` menampilkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sync jarak jauh bukan salinan PR yang dapat dipercaya; hentikan box itu dan warm box baru alih-alih men-debug kegagalan pengujian produk. Untuk PR penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk run sanity tersebut.

`pnpm testbox:run` juga menghentikan invocation Blacksmith CLI lokal yang tetap berada dalam fase sync selama lebih dari lima menit tanpa output pasca-sync. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard itu, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang sangat besar.

Crabbox adalah wrapper remote-box milik repo untuk pembuktian Linux maintainer. Gunakan saat sebuah pemeriksaan terlalu luas untuk local edit loop, saat paritas CI penting, atau saat pembuktian membutuhkan secret, Docker, package lane, box yang dapat digunakan ulang, atau log jarak jauh. Backend OpenClaw normal adalah `blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah fallback untuk gangguan Blacksmith, masalah kuota, atau pengujian kapasitas milik sendiri secara eksplisit.

Sebelum run pertama, periksa wrapper dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo menolak binary Crabbox usang yang tidak mengiklankan `blacksmith-testbox`. Teruskan provider secara eksplisit meskipun `.crabbox.yaml` memiliki default owned-cloud.

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Baca ringkasan JSON akhir. Field yang berguna adalah `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Run Crabbox sekali jalan yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis; jika sebuah run terinterupsi atau cleanup tidak jelas, inspeksi box live dan hentikan hanya box yang Anda buat:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Gunakan reuse hanya saat Anda sengaja membutuhkan beberapa perintah pada box terhidrasi yang sama:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jika Crabbox adalah lapisan yang rusak tetapi Blacksmith sendiri berfungsi, gunakan Blacksmith langsung sebagai fallback sempit:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Eskalasi ke kapasitas Crabbox milik sendiri hanya saat Blacksmith sedang down, dibatasi kuota, tidak memiliki environment yang dibutuhkan, atau kapasitas milik sendiri secara eksplisit menjadi tujuan:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` memiliki default provider, sync, dan hidrasi GitHub Actions untuk lane owned-cloud. File ini mengecualikan `.git` lokal agar checkout Actions terhidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote lokal maintainer dan object store, serta mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, penyiapan Node/pnpm, fetch `origin/main`, dan handoff environment non-secret untuk perintah owned-cloud `crabbox run --id <cbx_id>`.

## Terkait

- [Ringkasan instalasi](/id/install)
- [Channel pengembangan](/id/install/development-channels)
