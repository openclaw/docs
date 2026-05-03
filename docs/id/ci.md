---
read_when:
    - Anda perlu memahami mengapa pekerjaan CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pengulangan validasi rilis
    - Anda sedang mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Graf tugas CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur CI
x-i18n:
    generated_at: "2026-05-03T21:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan menonaktifkan lane mahal ketika hanya area yang tidak terkait yang berubah. Run manual `workflow_dispatch` sengaja melewati scoping cerdas dan menyebarkan seluruh grafik untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow [`Plugin Prerelease`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Full Release Validation`](#full-release-validation) atau dispatch manual eksplisit.

## Gambaran umum pipeline

| Job                              | Tujuan                                                                                                   | Kapan dijalankan                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, scope yang berubah, ekstensi yang berubah, dan membangun manifes CI    | Selalu pada push dan PR non-draft   |
| `security-scm-fast`              | Deteksi kunci privat dan audit workflow melalui `zizmor`                                                 | Selalu pada push dan PR non-draft   |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisory npm                                           | Selalu pada push dan PR non-draft   |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                                   | Selalu pada push dan PR non-draft   |
| `check-dependencies`             | Pass khusus dependensi Knip produksi plus guard allowlist file yang tidak digunakan                      | Perubahan yang relevan dengan Node  |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak build, dan artefak downstream yang dapat digunakan ulang | Perubahan yang relevan dengan Node  |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol                          | Perubahan yang relevan dengan Node  |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil                   | Perubahan yang relevan dengan Node  |
| `checks-node-core-test`          | Shard pengujian Node inti, mengecualikan lane channel, bundled, contract, dan ekstensi                   | Perubahan yang relevan dengan Node  |
| `check`                          | Padanan gate lokal utama yang di-shard: tipe produksi, lint, guard, tipe pengujian, dan smoke ketat      | Perubahan yang relevan dengan Node  |
| `check-additional`               | Arsitektur, drift boundary/prompt yang di-shard, guard ekstensi, boundary paket, dan gateway watch       | Perubahan yang relevan dengan Node  |
| `build-smoke`                    | Pengujian smoke CLI hasil build dan smoke memori startup                                                 | Perubahan yang relevan dengan Node  |
| `checks`                         | Verifikator untuk pengujian channel artefak build                                                        | Perubahan yang relevan dengan Node  |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                              | Dispatch CI manual untuk rilis      |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan tautan rusak                                                     | Docs berubah                        |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                               | Perubahan yang relevan dengan skill Python |
| `checks-windows`                 | Pengujian proses/path khusus Windows plus regresi specifier impor runtime bersama                         | Perubahan yang relevan dengan Windows |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artefak build bersama                                        | Perubahan yang relevan dengan macOS |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk aplikasi macOS                                                    | Perubahan yang relevan dengan macOS |
| `android`                        | Pengujian unit Android untuk kedua flavor plus satu build APK debug                                      | Perubahan yang relevan dengan Android |
| `test-performance-agent`         | Optimasi pengujian lambat Codex harian setelah aktivitas tepercaya                                       | CI main berhasil atau dispatch manual |
| `openclaw-performance`           | Laporan performa runtime Kova harian/sesuai permintaan dengan lane mock-provider, deep-profile, dan live GPT 5.4 | Terjadwal dan dispatch manual       |

## Urutan fail-fast

1. `preflight` memutuskan lane mana saja yang ada. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job artefak dan matriks platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR atau ref `main` yang sama. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tergantikan. Kunci concurrency CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub di grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas waktu. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

## Scope dan routing

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area berscope berubah.

- **Edit workflow CI** memvalidasi grafik CI Node plus linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap dibatasi ke perubahan sumber platform.
- **Edit khusus routing CI, edit fixture core-test murah tertentu, dan edit helper/test-routing kontrak Plugin yang sempit** menggunakan jalur manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard core penuh, shard bundled-plugin, dan matriks guard tambahan ketika perubahan dibatasi pada permukaan routing atau helper yang langsung diuji oleh tugas cepat tersebut.
- **Pemeriksaan Node Windows** dibatasi ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang mengeksekusi lane tersebut; perubahan source, Plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada di lane Node Linux.

Keluarga pengujian Node paling lambat dipisah atau diseimbangkan agar setiap job tetap kecil tanpa mencadangkan runner secara berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, lane core unit fast/support berjalan terpisah, infra runtime core dipisah antara shard state dan process/config, auto-reply berjalan sebagai worker seimbang (dengan subtree reply dipisah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi gateway/server agentic dipisah ke lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artefak build. Pengujian browser luas, QA, media, dan Plugin lain-lain menggunakan konfigurasi Vitest khususnya alih-alih catch-all Plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan satu konfigurasi penuh dari shard terfilter. `check-additional` menyatukan kerja compile/canary package-boundary dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar guard boundary di-stripe ke empat shard matriks, masing-masing menjalankan guard independen terpilih secara konkuren dan mencetak timing per pemeriksaan, termasuk `pnpm prompt:snapshots:check` sehingga drift prompt jalur sukses runtime Codex dipaku ke PR yang menyebabkannya. Gateway watch, pengujian channel, dan shard support-boundary core berjalan konkuren di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane pengujian unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipaku ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file produksi tidak terpakai dari Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file gagal ketika PR menambahkan file tidak terpakai baru yang belum ditinjau atau menyisakan entri allowlist usang, sambil mempertahankan permukaan Plugin dinamis, generated, build, live-test, dan package bridge yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mendispatch payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow memiliki empat lane:

- `clawsweeper_item` untuk permintaan tinjauan issue dan pull request yang spesifik;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit di komentar issue;
- `clawsweeper_commit_review` untuk permintaan tinjauan tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa oleh agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: tipe event, action, actor, repository, nomor item, URL, judul, state, dan kutipan pendek untuk komentar atau review bila ada. Lane ini sengaja menghindari penerusan seluruh body Webhook. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event ternormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan sebaiknya memposting ke `#clawsweeper` hanya ketika event tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise Webhook duplikat, dan lalu lintas review normal sebaiknya menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, body, teks review, nama branch, dan pesan commit GitHub sebagai data yang tidak tepercaya di sepanjang jalur ini. Itu adalah input untuk peringkasan dan triase, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan grafik job yang sama seperti CI normal tetapi memaksa setiap lane bercakupan non-Android aktif: shard Linux Node, shard bundled-plugin, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Python skills, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android saja dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis Plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan lane Docker prarilis Plugin dikecualikan dari CI. Suite prarilis Docker hanya berjalan ketika `Full Release Validation` men-dispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup concurrency unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik tersebut terhadap branch, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/bundled yang cepat, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifikator agregat pengujian Node, pemeriksaan docs, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ekstensi berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Linux Node, shard pengujian Plugin bundled, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif CPU sehingga 8 vCPU biayanya lebih besar daripada penghematannya); build Docker install-smoke (biaya waktu antrean 32-vCPU lebih besar daripada penghematannya)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

Dispatch manual biasanya menjalankan benchmark pada ref workflow. Atur `target_ref` untuk melakukan benchmark pada tag rilis atau branch lain dengan implementasi workflow saat ini. Path laporan yang dipublikasikan dan pointer terbaru dikunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA workflow, ref Kova, profil, mode auth lane, model, jumlah pengulangan, dan filter skenario.

Workflow memasang OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan auth palsu kompatibel OpenAI yang deterministik.
- `mock-deep-profile`: pembuatan profil CPU/heap/trace untuk hotspot startup, Gateway, dan giliran agen.
- `live-gpt54`: giliran agen OpenAI `openai/gpt-5.4` sungguhan, dilewati ketika `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah pass Kova: waktu boot Gateway dan memori di seluruh kasus startup default, hook, dan 50-Plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; dan perintah startup CLI terhadap Gateway yang sudah di-boot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundle laporan, dengan JSON mentah di sampingnya.

Setiap lane mengunggah artefak GitHub. Ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, workflow juga meng-commit `report.json`, `report.md`, bundle, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer ref yang sedang diuji ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow payung manual untuk "menjalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit penuh, men-dispatch workflow manual `CI` dengan target tersebut, men-dispatch `Plugin Prerelease` untuk bukti Plugin/paket/statis/Docker khusus rilis, dan men-dispatch `OpenClaw Release Checks` untuk install smoke, penerimaan paket, suite jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah publikasi, teruskan `npm_telegram_package_spec` untuk menjalankan ulang lane paket Telegram yang sama terhadap paket npm yang dipublikasikan.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama job workflow yang tepat, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah workflow rilis manual yang mengubah status. Dispatch dari `release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah preflight npm OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`, men-dispatch `Plugin NPM Release` untuk semua paket Plugin yang dapat dipublikasikan, men-dispatch `Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru setelah itu men-dispatch `OpenClaw NPM Release` dengan `preflight_run_id` yang disimpan.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan helper, bukan
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref dispatch workflow GitHub harus berupa branch atau tag, bukan SHA commit mentah. Helper mendorong branch sementara `release-ci/<sha>-...` pada SHA target, men-dispatch `Full Release Validation` dari ref yang dipin tersebut, memverifikasi setiap workflow anak `headSha` cocok dengan target, dan menghapus branch sementara ketika run selesai. Verifikator payung juga gagal jika ada workflow anak yang berjalan pada SHA berbeda.

`release_profile` mengontrol keluasan live/provider yang diteruskan ke pemeriksaan rilis. Workflow rilis manual default ke `stable`; gunakan `full` hanya ketika Anda memang menginginkan matriks advisory provider/media yang luas.

- `minimum` mempertahankan lane OpenAI/core yang paling cepat dan kritis untuk rilis.
- `stable` menambahkan set provider/backend stabil.
- `full` menjalankan matriks advisory provider/media yang luas.

Umbrella mencatat id run child yang di-dispatch, dan job akhir `Verify full validation` memeriksa ulang conclusion run child saat ini serta menambahkan tabel job terlambat untuk setiap run child. Jika workflow child dijalankan ulang dan menjadi hijau, jalankan ulang hanya job verifier parent untuk menyegarkan hasil umbrella dan ringkasan timing.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk release candidate, `ci` hanya untuk child full CI normal, `plugin-prerelease` hanya untuk child prarilis plugin, `release-checks` untuk setiap child rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada umbrella. Ini menjaga agar rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk me-resolve ref yang dipilih sekali menjadi tarball `release-package-under-test`, lalu meneruskan artifact tersebut ke workflow Docker jalur rilis live/E2E dan shard package acceptance. Itu menjaga byte paket tetap konsisten di seluruh kotak rilis dan menghindari pengemasan ulang candidate yang sama di beberapa job child.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all` menggantikan umbrella yang lebih lama. Monitor parent membatalkan workflow child apa pun yang sudah di-dispatch ketika parent dibatalkan, sehingga validasi main yang lebih baru tidak tertahan di belakang run release-check basi selama dua jam. Validasi branch/tag rilis dan grup rerun terfokus tetap menggunakan `cancel-in-progress: false`.

## Shard Live dan E2E

Child release live/E2E mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs`, bukan satu job serial:

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

Ini mempertahankan cakupan file yang sama sambil membuat kegagalan provider live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh workflow `Live Media Runner Image`. Image tersebut memasang `ffmpeg` dan `ffprobe` terlebih dahulu; job media hanya memverifikasi binari sebelum setup. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job container adalah tempat yang salah untuk meluncurkan tes Docker bersarang.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Workflow rilis live membangun dan mendorong image itu sekali, lalu shard model live Docker, Gateway yang di-shard per provider, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` tingkat skrip yang eksplisit di bawah timeout job workflow sehingga container yang macet atau jalur cleanup gagal cepat alih-alih menghabiskan seluruh anggaran release-check. Jika shard tersebut membangun ulang target Docker source penuh secara independen, run rilis salah konfigurasi dan akan membuang waktu wall clock pada build image duplikat.

## Package Acceptance

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi source tree, sementara package acceptance memvalidasi satu tarball melalui harness Docker E2E yang sama yang digunakan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, me-resolve satu package candidate, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artifact `package-under-test`, dan mencetak source, workflow ref, package ref, version, SHA-256, dan profile di ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow reusable mengunduh artifact tersebut, memvalidasi inventaris tarball, menyiapkan image Docker package-digest jika diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket tersebut alih-alih mengemas checkout workflow. Ketika sebuah profile memilih beberapa `docker_lanes` tertarget, workflow reusable menyiapkan paket dan image bersama sekali, lalu menjalankan lane tersebut sebagai job Docker tertarget paralel dengan artifact unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan memasang artifact `package-under-test` yang sama ketika Package Acceptance me-resolve satu paket; dispatch Telegram mandiri tetap dapat memasang spec npm yang dipublikasikan.
4. `summary` menggagalkan workflow jika package resolution, Docker acceptance, atau lane Telegram opsional gagal.

### Sumber candidate

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk acceptance prarilis/stabil yang dipublikasikan.
- `source=ref` mengemas branch, tag, atau full commit SHA `package_ref` tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi bahwa commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, memasang dependency di worktree detached, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artifact yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan tes. `package_ref` adalah commit source yang dikemas ketika `source=ref`. Ini memungkinkan harness tes saat ini memvalidasi commit source tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profile suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` ditambah `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib ketika `suite_profile=custom`

Profile `package` menggunakan cakupan plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan live ClawHub. Lane Telegram opsional menggunakan ulang artifact `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spec npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan khusus pengujian update dan plugin, termasuk perintah lokal, lane Docker, input Package Acceptance, default rilis, dan triase kegagalan, lihat [Menguji update dan plugin](/id/help/testing-updates-plugins).

Release checks memanggil Package Acceptance dengan `source=artifact`, artifact paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, dan `telegram_mode=mock-openai`. Ini menjaga bukti migrasi paket, update, cleanup dependency plugin usang, perbaikan instalasi plugin terkonfigurasi, plugin offline, plugin-update, dan Telegram pada tarball paket yang sama yang sudah di-resolve. Set `package_acceptance_package_spec` pada Full Release Validation atau OpenClaw Release Checks untuk menjalankan matriks yang sama terhadap paket npm yang sudah dikirim, bukan artifact yang dibangun dari SHA. Cross-OS release checks tetap mencakup onboarding, installer, dan perilaku platform khusus OS; validasi produk paket/update sebaiknya dimulai dengan Package Acceptance. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run. Dalam Package Acceptance, tarball `package-under-test` yang di-resolve selalu menjadi candidate dan `published_upgrade_survivor_baseline` memilih baseline fallback yang dipublikasikan, dengan default `openclaw@latest`; perintah rerun lane gagal mempertahankan baseline tersebut. Set `published_upgrade_survivor_baselines=all-since-2026.4.23` untuk memperluas Full Release CI ke setiap rilis npm stabil dari `2026.4.23` hingga `latest`; `release-history` tetap tersedia untuk sampling manual yang lebih luas dengan anchor pra-tanggal yang lebih lama. Set `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas baseline yang sama ke seluruh fixture berbentuk isu untuk config Feishu, file bootstrap/persona yang dipertahankan, instalasi plugin OpenClaw terkonfigurasi, jalur log tilde, dan root dependency plugin legacy usang. Workflow `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah cleanup update yang dipublikasikan secara menyeluruh, bukan keluasan Full Release CI normal. Run agregat lokal dapat meneruskan spec paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane yang dipublikasikan mengonfigurasi baseline dengan resep perintah `openclaw config set` yang sudah dipanggang, mencatat langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway dimulai. Lane fresh Windows packaged dan installer juga memverifikasi bahwa paket yang diinstal dapat mengimpor override browser-control dari jalur Windows absolut mentah. Smoke agent-turn cross-OS OpenAI default ke `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika disetel, jika tidak `openai/gpt-5.4`, sehingga bukti instalasi dan Gateway tetap pada model tes GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Package Acceptance memiliki jendela kompatibilitas legacy terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui di `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subcase persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke plugin dapat membaca lokasi install-record legacy atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata config sambil tetap mewajibkan install record dan perilaku tanpa reinstall tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memperingatkan untuk file stamp metadata build lokal yang sudah dikirim. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama gagal alih-alih memperingatkan atau melewati.

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

Saat men-debug kegagalan proses penerimaan paket, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa proses turunan `docker_acceptance` beserta artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log jalur, timing fase, dan perintah jalankan ulang. Utamakan menjalankan ulang profil paket yang gagal atau jalur Docker yang persis, bukan menjalankan ulang validasi rilis penuh.

## Smoke Instalasi

Workflow `Install Smoke` yang terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifes Plugin bawaan, atau permukaan Plugin inti/kanal/Gateway/Plugin SDK yang diuji oleh job smoke Docker. Perubahan Plugin bawaan yang hanya sumber, edit khusus pengujian, dan edit khusus dokumentasi tidak memesan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e container gateway-network, memverifikasi argumen build extension bawaan, dan menjalankan profil Docker Plugin bawaan terbatas dalam batas waktu perintah agregat 240 detik (setiap proses Docker skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan cakupan instalasi paket QR dan Docker/update installer untuk jadwal nightly, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke GHCR root Dockerfile target-SHA, lalu menjalankan instalasi paket QR, smoke root Dockerfile/Gateway, smoke installer/update, dan E2E Docker Plugin bawaan cepat sebagai job terpisah sehingga pekerjaan installer tidak menunggu di belakang smoke image root.

Push ke `main` (termasuk commit merge) tidak memaksa jalur penuh; saat logika changed-scope akan meminta cakupan penuh pada push, workflow tetap menjalankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke nightly atau validasi rilis.

Smoke penyedia-image instalasi global Bun yang lambat diatur secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal nightly dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat ikut menyertakannya, tetapi pull request dan push `main` tidak. Pengujian Docker QR dan installer tetap memakai Dockerfile berfokus instalasi masing-masing.

## E2E Docker Lokal

`pnpm test:docker:all` membangun terlebih dahulu satu image live-test bersama, mengemas OpenClaw satu kali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk jalur installer/update/plugin-dependency;
- image fungsional yang memasang tarball yang sama ke `/app` untuk jalur fungsionalitas normal.

Definisi jalur Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi rencana yang dipilih. Scheduler memilih image per jalur dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan jalur dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Dapat Disetel

| Variabel                               | Bawaan  | Tujuan                                                                                                      |
| -------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk jalur normal.                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap penyedia.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas jalur live bersamaan agar penyedia tidak melakukan throttle.                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas jalur instalasi npm bersamaan.                                                                        |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas jalur multi-layanan bersamaan.                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antar-mulai jalur untuk menghindari lonjakan create daemon Docker; setel `0` agar tanpa jeda.          |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per jalur (120 menit); jalur live/tail terpilih memakai batas yang lebih ketat.            |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak rencana scheduler tanpa menjalankan jalur.                                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar jalur persis yang dipisahkan koma; melewati smoke cleanup agar agen dapat mereproduksi satu jalur gagal. |

Jalur yang lebih berat daripada batas efektifnya tetap dapat mulai dari pool kosong, lalu berjalan sendiri sampai kapasitas dilepas. Agregat lokal melakukan preflight Docker, menghapus container E2E OpenClaw yang usang, mengeluarkan status jalur aktif, menyimpan timing jalur untuk pengurutan terlama-dulu, dan secara bawaan berhenti menjadwalkan jalur pool baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan `scripts/test-docker-all.mjs --plan-json` tentang paket, jenis image, image live, jalur, dan cakupan kredensial yang diperlukan. `scripts/docker-e2e.mjs` lalu mengubah rencana tersebut menjadi output dan ringkasan GitHub. Workflow ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket dari proses saat ini, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/fungsional bertag digest paket melalui cache layer Docker Blacksmith saat rencana memerlukan jalur dengan paket terinstal; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout terbatas 180 detik per percobaan sehingga stream registry/cache yang macet dapat dicoba ulang dengan cepat alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job berchunk lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkan dan mengeksekusi beberapa jalur melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat Plugin/runtime. Alias jalur `install-e2e` tetap menjadi alias jalankan ulang manual agregat untuk kedua jalur installer penyedia.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` saat cakupan release-path penuh memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Jalur update kanal bawaan mencoba ulang satu kali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log jalur, timing, `summary.json`, `failures.json`, timing fase, JSON rencana scheduler, tabel jalur lambat, dan perintah jalankan ulang per jalur. Input workflow `docker_lanes` menjalankan jalur terpilih terhadap image yang disiapkan alih-alih job chunk, yang menjaga debugging jalur gagal tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk proses tersebut; jika jalur terpilih adalah jalur Docker live, job tertarget membangun image live-test secara lokal untuk proses ulang tersebut. Perintah jalankan ulang GitHub per jalur yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan saat nilai tersebut ada, sehingga jalur yang gagal dapat menggunakan ulang paket dan image yang persis dari proses yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, jadi ini adalah workflow terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri tetap menonaktifkan suite tersebut. Ini menyeimbangkan pengujian Plugin bawaan di delapan worker extension; job shard extension tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar sehingga batch Plugin berat impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis membatch jalur Docker tertarget dalam grup kecil untuk menghindari pemesanan puluhan runner untuk job satu hingga tiga menit.

## QA Lab

QA Lab memiliki jalur CI khusus di luar workflow utama yang dicakup secara cerdas. Paritas agentic bersarang di bawah harness QA dan rilis yang luas, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` saat paritas harus ikut dalam proses validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan nightly di `main` dan pada dispatch manual; workflow ini menyebarkan jalur paritas mock, jalur Matrix live, serta jalur Telegram dan Discord live sebagai job paralel. Job live memakai environment `qa-live-shared`, dan Telegram/Discord memakai lease Convex.

Pemeriksaan rilis menjalankan jalur transport live Matrix dan Telegram dengan penyedia mock deterministik dan model berkualifikasi mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak kanal terisolasi dari latensi model live dan startup normal Plugin penyedia. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh suite model live, penyedia native, dan penyedia Docker yang terpisah.

Matrix memakai `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya saat CLI yang di-checkout mendukungnya. Bawaan CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu men-shard cakupan Matrix penuh ke job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan jalur QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan paket kandidat dan baseline sebagai job jalur paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas final.

Untuk PR normal, ikuti bukti CI/pemeriksaan yang tercakup, bukan memperlakukan paritas sebagai status wajib.

## CodeQL

Alur kerja `CodeQL` secara sengaja merupakan pemindai keamanan tahap awal yang sempit, bukan penyisiran repositori penuh. Harian, manual, dan run penjaga pull request non-draft memindai kode alur kerja Actions beserta permukaan JavaScript/TypeScript dengan risiko tertinggi menggunakan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Penjaga pull request tetap ringan: ia hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti alur kerja terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron, dan baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti plus runtime plugin channel, gateway, Plugin SDK, secrets, titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, parsing IP, guard jaringan, web-fetch, dan SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gate eksekusi tool agen                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifest, registry, instalasi package-manager, source-loading, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity alur kerja. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL pada Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Tetap berada di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan pasangannya. Ia hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat error-severity pada permukaan bernilai tinggi yang sempit di runner Blacksmith Linux yang lebih kecil. Penjaga pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draft hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang cocok untuk perubahan kode eksekusi perintah/model/tool agen dan dispatch balasan, kode skema/migrasi/IO konfigurasi, kode auth/secrets/sandbox/keamanan, runtime channel inti dan plugin channel bawaan, protokol Gateway/metode server, runtime memori/perekat SDK, MCP/proses/pengiriman keluar, runtime provider/katalog model, diagnostik sesi/antrean pengiriman, loader plugin, kontrak paket/Plugin SDK, atau runtime balasan Plugin SDK. Perubahan konfigurasi CodeQL dan alur kerja kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terpisah.

| Kategori                                                | Permukaan                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan auth, secrets, sandbox, cron, dan gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema konfigurasi, migrasi, normalisasi, dan IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan plugin channel bawaan                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Eksekusi perintah, dispatch model/provider, dispatch dan antrean auto-reply, serta kontrak runtime control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge tool, helper supervisi proses, serta kontrak pengiriman keluar                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, fasad runtime memori, alias Plugin SDK memori, perekat aktivasi runtime memori, dan perintah doctor memori                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundle event/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, serta registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol Gateway, dan kontrak runtime control-plane tugas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, pembuatan gambar, dan pembuatan media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket plugin                                                                                      |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL untuk Swift, Python, dan plugin bawaan sebaiknya ditambahkan kembali sebagai pekerjaan lanjutan yang berscope atau dishard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Alur kerja pemeliharaan

### Docs Agent

Alur kerja `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru masuk. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Pemanggilan workflow-run dilewati saat `main` sudah bergerak maju atau saat run Docs Agent non-skipped lain dibuat dalam satu jam terakhir. Saat berjalan, ia meninjau rentang commit dari SHA sumber Docs Agent non-skipped sebelumnya ke `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pass dokumen terakhir.

### Test Performance Agent

Alur kerja `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk test lambat. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, tetapi ia dilewati jika pemanggilan workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC itu. Dispatch manual melewati gate aktivitas harian tersebut. Lane ini membangun laporan performa Vitest full-suite yang dikelompokkan, membiarkan Codex hanya membuat perbaikan performa test kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah test baseline yang lolos. Jika baseline memiliki test yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lolos sebelum apa pun di-commit. Saat `main` maju sebelum push bot masuk, lane ini me-rebase patch yang telah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch usang yang konflik dilewati. Ia menggunakan Ubuntu yang di-host GitHub sehingga action Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti docs agent.

### PR Duplikat Setelah Merge

Alur kerja `Duplicate PRs After Merge` adalah alur kerja maintainer manual untuk pembersihan duplikat pasca-land. Default-nya dry-run dan hanya menutup PR yang dicantumkan secara eksplisit saat `apply=true`. Sebelum memutasi GitHub, ia memverifikasi bahwa PR yang landed sudah di-merge dan bahwa setiap duplikat memiliki referenced issue yang sama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gate pemeriksaan lokal itu lebih ketat tentang batas arsitektur daripada scope platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan test inti plus lint/guard inti;
- perubahan khusus test inti hanya menjalankan typecheck test inti plus lint inti;
- perubahan produksi extension menjalankan typecheck prod extension dan test extension plus lint extension;
- perubahan khusus test extension menjalankan typecheck test extension plus lint extension;
- perubahan Plugin SDK publik atau kontrak plugin diperluas ke typecheck extension karena extension bergantung pada kontrak inti tersebut (penyisiran extension Vitest tetap menjadi pekerjaan test eksplisit);
- kenaikan versi khusus metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root tertarget;
- perubahan root/konfigurasi yang tidak diketahui fail safe ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit test langsung menjalankan dirinya sendiri, edit sumber lebih memilih pemetaan eksplisit, lalu test saudara dan dependent import-graph. Konfigurasi pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada konfigurasi balasan terlihat grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui test balasan inti plus regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya saat perubahan cukup luas di harness sehingga set terpetakan yang murah bukan proxy yang tepercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan utamakan box baru yang sudah disiapkan untuk pembuktian luas. Sebelum menjalankan gate lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sinkronisasi yang ukurannya tidak terduga besar, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat ketika file root yang wajib ada seperti `pnpm-lock.yaml` hilang atau ketika `git status --short` menampilkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sinkronisasi jarak jauh bukan salinan PR yang dapat dipercaya; hentikan box tersebut dan siapkan box baru alih-alih men-debug kegagalan pengujian produk. Untuk PR dengan penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk proses sanity tersebut.

`pnpm testbox:run` juga menghentikan pemanggilan CLI Blacksmith lokal yang tetap berada dalam fase sinkronisasi selama lebih dari lima menit tanpa output pascasinkronisasi. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard tersebut, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang sangat besar.

Crabbox adalah jalur remote-box kedua milik repo untuk pembuktian Linux ketika Blacksmith tidak tersedia atau ketika kapasitas cloud milik sendiri lebih disukai. Siapkan box, hidrasi melalui workflow proyek, lalu jalankan perintah melalui CLI Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` mengatur default provider, sinkronisasi, dan hidrasi GitHub Actions. File tersebut mengecualikan `.git` lokal agar checkout Actions yang terhidrasi tetap mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan object store lokal maintainer, serta mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` mengatur checkout, penyiapan Node/pnpm, pengambilan `origin/main`, dan handoff environment nonrahasia yang kemudian dijadikan sumber oleh perintah `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
