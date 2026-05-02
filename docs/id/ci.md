---
read_when:
    - Anda perlu memahami mengapa pekerjaan CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pengulangan validasi rilis
    - Anda sedang mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Graf pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur CI
x-i18n:
    generated_at: "2026-05-02T20:41:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan menonaktifkan lane mahal ketika hanya area yang tidak terkait berubah. Run manual `workflow_dispatch` sengaja melewati smart scoping dan menyebarkan graf penuh untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow terpisah [`Plugin Pra-rilis`](#plugin-prerelease) dan hanya berjalan dari [`Validasi Rilis Penuh`](#full-release-validation) atau dispatch manual eksplisit.

## Ikhtisar pipeline

| Job                              | Tujuan                                                                                                   | Kapan berjalan                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus dokumen, scope yang berubah, extension yang berubah, dan membangun manifes CI | Selalu pada push non-draf dan PR |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                                     | Selalu pada push non-draf dan PR |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependency terhadap advisory npm                                          | Selalu pada push non-draf dan PR |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                             | Selalu pada push non-draf dan PR |
| `check-dependencies`             | Pass production Knip khusus dependency plus guard allowlist unused-file                                 | Perubahan yang relevan dengan Node              |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak build, dan artefak downstream yang dapat digunakan ulang                       | Perubahan yang relevan dengan Node              |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol                              | Perubahan yang relevan dengan Node              |
| `checks-fast-contracts-channels` | Pemeriksaan contract channel yang di-shard dengan hasil pemeriksaan agregat yang stabil                                      | Perubahan yang relevan dengan Node              |
| `checks-node-core-test`          | Shard test inti Node, mengecualikan lane channel, bundled, contract, dan extension                          | Perubahan yang relevan dengan Node              |
| `check`                          | Setara gate lokal utama yang di-shard: tipe prod, lint, guard, tipe test, dan smoke ketat                | Perubahan yang relevan dengan Node              |
| `check-additional`               | Shard arsitektur, boundary, guard extension-surface, package-boundary, dan gateway-watch              | Perubahan yang relevan dengan Node              |
| `build-smoke`                    | Test smoke built-CLI dan smoke startup-memory                                                            | Perubahan yang relevan dengan Node              |
| `checks`                         | Verifier untuk test channel artefak build                                                                 | Perubahan yang relevan dengan Node              |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                                | Dispatch CI manual untuk rilis    |
| `check-docs`                     | Pemformatan dokumen, lint, dan pemeriksaan tautan rusak                                                             | Dokumen berubah                       |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                                    | Perubahan yang relevan dengan skill Python      |
| `checks-windows`                 | Test proses/path khusus Windows plus regresi specifier import runtime bersama                      | Perubahan yang relevan dengan Windows           |
| `macos-node`                     | Lane test TypeScript macOS menggunakan artefak build bersama                                               | Perubahan yang relevan dengan macOS             |
| `macos-swift`                    | Swift lint, build, dan test untuk aplikasi macOS                                                            | Perubahan yang relevan dengan macOS             |
| `android`                        | Test unit Android untuk kedua flavor plus satu build APK debug                                              | Perubahan yang relevan dengan Android           |
| `test-performance-agent`         | Optimisasi test lambat Codex harian setelah aktivitas tepercaya                                                 | Keberhasilan CI main atau dispatch manual |
| `openclaw-performance`           | Laporan performa runtime Kova harian/on-demand dengan lane mock-provider, deep-profile, dan live GPT 5.4 | Terjadwal dan dispatch manual      |

## Urutan fail-fast

1. `preflight` memutuskan lane mana yang benar-benar ada. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal dengan cepat tanpa menunggu job matriks artefak dan platform yang lebih berat.
3. `build-artifacts` tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang digantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR yang sama atau ref `main`. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah digantikan. Kunci concurrency CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub di grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berlangsung.

## Scope dan routing

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh test unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area berscope berubah.

- **Edit workflow CI** memvalidasi graf CI Node plus linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap terscope ke perubahan sumber platform.
- **Edit khusus routing CI, edit fixture core-test murah terpilih, dan edit helper/test-routing plugin contract yang sempit** menggunakan jalur manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, contract channel, shard inti penuh, shard bundled-plugin, dan matriks guard tambahan ketika perubahan terbatas pada permukaan routing atau helper yang dijalankan langsung oleh tugas cepat.
- **Pemeriksaan Node Windows** terscope ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang menjalankan lane itu; perubahan sumber, Plugin, install-smoke, dan khusus test yang tidak terkait tetap berada di lane Linux Node.

Keluarga test Node paling lambat dipisah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner berlebihan: contract channel berjalan sebagai tiga shard berbobot, lane unit inti kecil dipasangkan, auto-reply berjalan sebagai empat worker seimbang (dengan subtree reply dipisah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi agentic Gateway/Plugin disebar ke seluruh job agentic Node khusus sumber yang ada alih-alih menunggu artefak build. Test browser, QA, media, dan Plugin lain-lain yang luas menggunakan konfigurasi Vitest khusus masing-masing alih-alih catch-all Plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard yang difilter. `check-additional` menjaga pekerjaan kompilasi/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard guard boundary menjalankan guard kecil independennya secara bersamaan di dalam satu job. Gateway watch, test channel, dan shard core support-boundary berjalan secara bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

Android CI menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor third-party tidak memiliki source set atau manifes terpisah; lane unit-test-nya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass production Knip khusus dependency yang dipin ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan unused-file produksi Knip dengan `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file gagal ketika PR menambahkan file tidak terpakai baru yang belum ditinjau atau meninggalkan entri allowlist yang usang, sambil mempertahankan permukaan Plugin dinamis, generated, build, live-test, dan package bridge yang disengaja yang tidak dapat di-resolve Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repository OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow memiliki empat lane:

- `clawsweeper_item` untuk permintaan review issue dan pull request yang spesifik;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit di komentar issue;
- `clawsweeper_commit_review` untuk permintaan review tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis event, action, actor, repository, nomor item, URL, judul, status, dan kutipan singkat untuk komentar atau review jika ada. Lane ini sengaja menghindari penerusan body Webhook penuh. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord di prompt-nya dan sebaiknya memposting ke `#clawsweeper` hanya ketika event tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise Webhook duplikat, dan lalu lintas review normal sebaiknya menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, body, teks review, nama branch, dan pesan commit GitHub sebagai data tidak tepercaya di seluruh jalur ini. Semua itu adalah input untuk peringkasan dan triage, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan grafik pekerjaan yang sama seperti CI normal, tetapi memaksa setiap lane berskup non-Android aktif: shard Linux Node, shard Plugin bawaan, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Skills Python, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri hanya menjalankan Android dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis Plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan lane Docker prarilis Plugin dikecualikan dari CI. Suite Docker prarilis hanya berjalan ketika `Full Release Validation` men-dispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup konkurensi unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik itu terhadap branch, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, pekerjaan dan agregat keamanan cepat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/bawaan cepat, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, pemverifikasi agregat pengujian Node, pemeriksaan docs, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub sehingga matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ekstensi berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Linux Node, shard pengujian Plugin bawaan, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif terhadap CPU sehingga 8 vCPU lebih mahal daripada penghematan yang diberikannya); build Docker install-smoke (waktu antrean 32-vCPU lebih mahal daripada penghematan yang diberikannya)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork kembali menggunakan `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork kembali menggunakan `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
```

Workflow menginstal OCM dari rilis yang dipin dan Kova dari input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan auth palsu deterministik yang kompatibel dengan OpenAI.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, Gateway, dan giliran agen.
- `live-gpt54`: giliran agen OpenAI `openai/gpt-5.4` nyata, dilewati ketika `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah lintasan Kova: waktu boot Gateway dan memori di seluruh kasus startup default, hook, dan 50-Plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; dan perintah startup CLI terhadap Gateway yang sudah di-boot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundel laporan, dengan JSON mentah di sampingnya.

Setiap lane mengunggah artefak GitHub. Ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, workflow juga meng-commit `report.json`, `report.md`, bundel, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Pointer branch saat ini ditulis sebagai `openclaw-performance/<ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow payung manual untuk "menjalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit penuh, men-dispatch workflow manual `CI` dengan target tersebut, men-dispatch `Plugin Prerelease` untuk bukti Plugin/paket/statis/Docker khusus rilis, dan men-dispatch `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, suite jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah publikasi, teruskan `npm_telegram_package_spec` untuk menjalankan ulang lane paket Telegram yang sama terhadap paket npm yang dipublikasikan.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama pekerjaan workflow persis, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah workflow rilis manual yang melakukan mutasi. Dispatch dari `release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah preflight npm OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`, men-dispatch `Plugin NPM Release` untuk semua paket Plugin yang dapat dipublikasikan, men-dispatch `Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru kemudian men-dispatch `OpenClaw NPM Release` dengan `preflight_run_id` yang disimpan.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan helper sebagai ganti
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref dispatch workflow GitHub harus berupa branch atau tag, bukan SHA commit mentah. Helper mendorong branch sementara `release-ci/<sha>-...` pada SHA target, men-dispatch `Full Release Validation` dari ref yang dipin itu, memverifikasi setiap `headSha` workflow anak cocok dengan target, dan menghapus branch sementara ketika run selesai. Pemverifikasi payung juga gagal jika ada workflow anak yang berjalan pada SHA berbeda.

`release_profile` mengontrol cakupan live/provider yang diteruskan ke pemeriksaan rilis. Workflow rilis manual default ke `stable`; gunakan `full` hanya ketika Anda secara sengaja menginginkan matriks advisory provider/media yang luas.

- `minimum` mempertahankan lane OpenAI/inti paling cepat yang kritis untuk rilis.
- `stable` menambahkan set provider/backend stabil.
- `full` menjalankan matriks advisory provider/media yang luas.

Payung mencatat id run anak yang di-dispatch, dan pekerjaan final `Verify full validation` memeriksa ulang kesimpulan run anak saat ini serta menambahkan tabel pekerjaan paling lambat untuk setiap run anak. Jika workflow anak dijalankan ulang dan berubah hijau, jalankan ulang hanya pekerjaan pemverifikasi induk untuk menyegarkan hasil payung dan ringkasan waktu.

Untuk pemulihan, baik `Full Release Validation` maupun `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk workflow turunan CI penuh normal, `plugin-prerelease` hanya untuk workflow turunan prarilis plugin, `release-checks` untuk setiap workflow turunan rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada workflow payung. Ini menjaga rerun box rilis yang gagal tetap terbatas setelah perbaikan terfokus.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref yang dipilih sekali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke workflow Docker jalur rilis live/E2E dan shard penerimaan paket. Itu menjaga byte paket tetap konsisten di seluruh box rilis dan menghindari pengemasan ulang kandidat yang sama di beberapa job turunan.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan workflow payung yang lebih lama. Monitor induk membatalkan workflow turunan apa pun yang
sudah dikirim saat induk dibatalkan, sehingga validasi main yang lebih baru
tidak menunggu di belakang run pemeriksaan rilis dua jam yang sudah basi. Validasi branch/tag rilis
dan grup rerun terfokus tetap menggunakan `cancel-in-progress: false`.

## Shard Live dan E2E

Workflow turunan live/E2E rilis mempertahankan cakupan luas `pnpm test:live` native, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs`, bukan sebagai satu job serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- job `native-live-src-gateway-profiles` yang difilter berdasarkan provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard audio/video media terpisah dan shard musik yang difilter berdasarkan provider

Ini mempertahankan cakupan file yang sama sambil membuat kegagalan provider live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh workflow `Live Media Runner Image`. Image itu memasang `ffmpeg` dan `ffprobe` sebelumnya; job media hanya memverifikasi binary sebelum penyiapan. Tetap jalankan suite live berbasis Docker pada runner Blacksmith normal — job container bukan tempat yang tepat untuk meluncurkan pengujian Docker bersarang.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Workflow rilis live membangun dan mengunggah image itu sekali, lalu shard model live Docker, Gateway yang di-shard berdasarkan provider, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` eksplisit pada level skrip di bawah timeout job workflow, sehingga container atau jalur pembersihan yang macet gagal cepat alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah konfigurasi dan akan membuang waktu pada build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` saat pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sementara penerimaan paket memvalidasi satu tarball melalui harness Docker E2E yang sama yang dijalankan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref workflow, ref paket, versi, SHA-256, dan profil di ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker digest paket bila diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket itu, bukan mengemas checkout workflow. Saat profil memilih beberapa `docker_lanes` bertarget, workflow reusable menyiapkan paket dan image bersama sekali, lalu menyebarkan lane tersebut sebagai job Docker bertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan saat `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama saat Package Acceptance menyelesaikannya; dispatch Telegram mandiri tetap dapat menginstal spesifikasi npm yang sudah dipublikasikan.
4. `summary` menggagalkan workflow jika penyelesaian paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@alpha`, `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw eksak seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prarilis/stabil yang sudah dipublikasikan.
- `source=ref` mengemas branch, tag, atau SHA commit penuh `package_ref` tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, memasang dependensi dalam worktree terlepas, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya diberikan untuk artefak yang dibagikan secara eksternal.

Jaga `workflow_ref` dan `package_ref` tetap terpisah. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas saat `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` eksak; wajib saat `suite_profile=custom`

Profil `package` menggunakan cakupan plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan ulang artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan khusus pengujian pembaruan dan plugin, termasuk perintah lokal,
lane Docker, input Package Acceptance, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Package Acceptance dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, pembaruan, pembersihan dependensi plugin basi, perbaikan instalasi plugin yang dikonfigurasi, plugin offline, pembaruan plugin, dan bukti Telegram pada tarball paket terselesaikan yang sama. Tetapkan `package_acceptance_package_spec` pada Full Release Validation atau OpenClaw Release Checks untuk menjalankan matriks yang sama terhadap paket npm yang sudah dikirim, bukan artefak yang dibangun dari SHA. Pemeriksaan rilis lintas-OS tetap mencakup perilaku onboarding, installer, dan platform spesifik OS; validasi produk paket/pembaruan harus dimulai dengan Package Acceptance. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run. Dalam Package Acceptance, tarball `package-under-test` yang diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline fallback yang dipublikasikan, dengan default `openclaw@latest`; perintah rerun lane gagal mempertahankan baseline itu. Tetapkan `published_upgrade_survivor_baselines=all-since-2026.4.23` untuk memperluas CI Full Release ke setiap rilis npm stabil dari `2026.4.23` hingga `latest`; `release-history` tetap tersedia untuk sampling manual yang lebih luas dengan anchor pra-tanggal yang lebih lama. Tetapkan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas baseline yang sama ke fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, instalasi plugin OpenClaw yang dikonfigurasi, jalur log tilde, dan root dependensi plugin legacy yang basi. Workflow `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` saat pertanyaannya adalah pembersihan pembaruan yang dipublikasikan secara menyeluruh, bukan keluasan CI Full Release normal. Run agregat lokal dapat meneruskan spesifikasi paket eksak dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane yang dipublikasikan mengonfigurasi baseline dengan resep perintah `openclaw config set` bawaan, merekam langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, serta status RPC setelah Gateway dimulai. Lane fresh paket dan installer Windows juga memverifikasi bahwa paket terinstal dapat mengimpor override kontrol browser dari jalur Windows absolut mentah. Smoke agent-turn lintas-OS OpenAI menggunakan default `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat disetel, jika tidak `openai/gpt-5.4`, sehingga bukti instalasi dan Gateway tetap menggunakan model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Package Acceptance memiliki jendela kompatibilitas legacy terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui di `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` saat paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke plugin dapat membaca lokasi record instalasi legacy atau menerima persistensi record instalasi marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan record instalasi dan perilaku tanpa instal ulang tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memperingatkan untuk file cap metadata build lokal yang sudah dikirim. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama akan gagal, bukan memperingatkan atau dilewati.

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

Saat men-debug proses package acceptance yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa proses turunan `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Utamakan menjalankan ulang profil paket yang gagal atau lane Docker yang tepat daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Workflow `Install Smoke` terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifest Plugin bawaan, atau permukaan Plugin/kanal/Gateway/Plugin SDK inti yang dijalankan oleh job smoke Docker. Perubahan Plugin bawaan yang hanya source, edit yang hanya test, dan edit yang hanya dokumentasi tidak memesan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e container gateway-network, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker Plugin bawaan terbatas di bawah timeout perintah agregat 240 detik (setiap Docker run skenario dibatasi terpisah).
- **Jalur penuh** mempertahankan instalasi paket QR dan cakupan Docker/update installer untuk proses terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instalasi paket QR, smoke Dockerfile/Gateway root, smoke installer/update, dan E2E Docker Plugin bawaan cepat sebagai job terpisah sehingga pekerjaan installer tidak menunggu di belakang smoke image root.

Push ke `main` (termasuk merge commit) tidak memaksa jalur penuh; saat logika changed-scope akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi malam atau rilis.

Smoke image-provider instalasi global Bun yang lambat digate secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat memilihnya, tetapi pull request dan push `main` tidak. Test Docker QR dan installer mempertahankan Dockerfile mereka sendiri yang berfokus pada instalasi.

## E2E Docker Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi plan yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parameter yang dapat disetel

| Variabel                               | Default | Tujuan                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live bersamaan agar provider tidak melakukan throttle.                             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instalasi npm bersamaan.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service bersamaan.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antar start lane untuk menghindari badai create daemon Docker; setel `0` untuk tanpa jeda. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/tail tertentu menggunakan batas lebih ketat. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak plan scheduler tanpa menjalankan lane.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane tepat yang dipisahkan koma; melewati cleanup smoke agar agent dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat dari batas efektifnya masih dapat dimulai dari pool kosong, lalu berjalan sendiri sampai melepas kapasitas. Preflight agregat lokal memeriksa Docker, menghapus container E2E OpenClaw yang usang, memancarkan status lane aktif, menyimpan timing lane untuk pengurutan longest-first, dan secara default berhenti menjadwalkan lane pool baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang meminta `scripts/test-docker-all.mjs --plan-json` menentukan cakupan paket, jenis image, image live, lane, dan kredensial yang diperlukan. `scripts/docker-e2e.mjs` lalu mengonversi plan tersebut menjadi output dan ringkasan GitHub. Workflow ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket current-run, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/functional bertag digest paket melalui cache layer Docker Blacksmith saat plan memerlukan lane yang sudah menginstal paket; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang diberikan atau image digest paket yang sudah ada, bukan membangun ulang. Pull image Docker dicoba ulang dengan timeout per upaya terbatas 180 detik sehingga stream registry/cache yang macet cepat dicoba ulang, bukan menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkan dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias Plugin/runtime agregat. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer provider.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` saat cakupan release-path penuh memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane update kanal bawaan mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON plan scheduler, tabel lane lambat, dan perintah rerun per lane. Input workflow `docker_lanes` menjalankan lane terpilih terhadap image yang disiapkan, bukan job chunk, yang menjaga debugging lane gagal tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk proses tersebut; jika lane terpilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun tersebut. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan saat nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image yang tepat dari proses yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, sehingga menjadi workflow terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri menjaga suite tersebut tetap mati. Workflow ini menyeimbangkan test Plugin bawaan di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch Plugin yang berat impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis mengelompokkan lane Docker tertarget dalam grup kecil untuk menghindari pemesanan puluhan runner untuk job satu hingga tiga menit.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow utama yang smart-scoped. Paritas agentik disarang di bawah harness QA dan rilis yang luas, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` saat paritas perlu ikut dalam proses validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan pada dispatch manual; workflow ini menyebarkan lane mock parity, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan provider mock deterministik dan model yang memenuhi syarat mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak kanal diisolasi dari latensi model live dan startup provider-plugin normal. Gateway transport live menonaktifkan pencarian memori karena QA parity mencakup perilaku memori secara terpisah; konektivitas provider dicakup oleh suite model live, provider native, dan provider Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya saat CLI yang di-check out mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu membagi cakupan Matrix penuh menjadi job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate QA parity-nya menjalankan pack kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas final.

Untuk PR normal, ikuti bukti CI/check yang tercakup, bukan memperlakukan paritas sebagai status wajib.

## CodeQL

Alur kerja `CodeQL` sengaja menjadi pemindai keamanan tahap pertama yang sempit, bukan penyapuan repositori penuh. Setiap hari, manual, dan guard pull request non-draf memindai kode alur kerja Actions serta permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Guard pull request tetap ringan: ia hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti alur kerja terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autentikasi, rahasia, sandbox, Cron, dan baseline Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti plus runtime plugin channel, Gateway, Plugin SDK, rahasia, titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, penguraian IP, guard jaringan, web-fetch, dan SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gate eksekusi alat agen                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifes, registry, instalasi package-manager, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan spesifik platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity alur kerja. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error pada permukaan bernilai tinggi yang sempit di runner Blacksmith Linux yang lebih kecil. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draf hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk perubahan kode eksekusi perintah/model/alat agen dan dispatch balasan, kode skema/migrasi/IO konfigurasi, kode autentikasi/rahasia/sandbox/keamanan, runtime channel inti dan plugin channel bawaan, metode server/protokol Gateway, runtime memori/glue SDK, MCP/proses/pengiriman keluar, katalog model/runtime penyedia, diagnostik sesi/antrean pengiriman, loader plugin, kontrak paket/Plugin SDK, atau runtime balasan Plugin SDK. Perubahan konfigurasi CodeQL dan alur kerja kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Permukaan                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan autentikasi, rahasia, sandbox, Cron, dan Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema konfigurasi, migrasi, normalisasi, dan IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan plugin channel bawaan                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi perintah, dispatch model/penyedia, dispatch dan antrean auto-reply, serta control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge alat, helper supervisi proses, dan kontrak pengiriman keluar                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, facade runtime memori, alias Plugin SDK memori, glue aktivasi runtime memori, dan perintah doctor memori                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundel event/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, autentikasi dan discovery penyedia, registrasi runtime penyedia, default/katalog penyedia, dan registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol Gateway, dan kontrak runtime control-plane tugas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, pembuatan gambar, dan pembuatan media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket plugin                                                                                      |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan plugin bawaan harus ditambahkan kembali sebagai pekerjaan lanjutan yang terscoped atau dishard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Alur kerja pemeliharaan

### Agen Dokumentasi

Alur kerja `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumentasi yang ada tetap selaras dengan perubahan yang baru landed. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Invokasi workflow-run dilewati saat `main` sudah bergerak lanjut atau saat run Docs Agent non-dilewati lain dibuat dalam satu jam terakhir. Saat berjalan, ia meninjau rentang commit dari SHA sumber Docs Agent non-dilewati sebelumnya ke `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pass dokumentasi terakhir.

### Agen Performa Pengujian

Alur kerja `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk pengujian lambat. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, tetapi ia melewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC itu. Dispatch manual melewati gate aktivitas harian tersebut. Lane ini membangun laporan performa Vitest full-suite yang dikelompokkan, membiarkan Codex hanya membuat perbaikan performa pengujian kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah pengujian baseline yang lulus. Jika baseline memiliki pengujian yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lulus sebelum apa pun di-commit. Saat `main` maju sebelum push bot landed, lane ini merebase patch yang telah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch basi yang berkonflik dilewati. Ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keselamatan drop-sudo yang sama seperti agen dokumentasi.

### PR Duplikat Setelah Merge

Alur kerja `Duplicate PRs After Merge` adalah alur kerja maintainer manual untuk pembersihan duplikat pasca-land. Default-nya dry-run dan hanya menutup PR yang dicantumkan secara eksplisit saat `apply=true`. Sebelum memutasi GitHub, ia memverifikasi bahwa PR yang landed sudah di-merge dan bahwa setiap duplikat memiliki issue referensi bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gate pemeriksaan lokal tersebut lebih ketat tentang batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan pengujian inti plus lint/guard inti;
- perubahan khusus pengujian inti hanya menjalankan typecheck pengujian inti plus lint inti;
- perubahan produksi extension menjalankan typecheck prod extension dan pengujian extension plus lint extension;
- perubahan khusus pengujian extension menjalankan typecheck pengujian extension plus lint extension;
- perubahan Plugin SDK publik atau kontrak plugin meluas ke typecheck extension karena extension bergantung pada kontrak inti tersebut (sweep extension Vitest tetap menjadi pekerjaan pengujian eksplisit);
- bump versi khusus metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang ditargetkan;
- perubahan root/konfigurasi yang tidak diketahui fail safe ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit pengujian langsung menjalankan dirinya sendiri, edit sumber lebih memilih pemetaan eksplisit, lalu pengujian saudara dan dependent import-graph. Konfigurasi pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada konfigurasi balasan terlihat grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui pengujian balasan inti plus regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya saat perubahan cukup luas pada harness sehingga set murah yang dipetakan bukan proxy yang dapat dipercaya.

## Validasi Testbox

Jalankan Testbox dari root repositori dan utamakan box baru yang sudah dihangatkan untuk pembuktian luas. Sebelum menghabiskan gate yang lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sinkronisasi yang ukurannya tidak terduga besar, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat ketika file root yang diperlukan seperti `pnpm-lock.yaml` hilang atau ketika `git status --short` menunjukkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sinkronisasi jarak jauh bukan salinan PR yang dapat dipercaya; hentikan box itu dan hangatkan box baru alih-alih men-debug kegagalan pengujian produk. Untuk PR penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk proses sanity tersebut.

`pnpm testbox:run` juga menghentikan pemanggilan Blacksmith CLI lokal yang tetap berada di fase sinkronisasi selama lebih dari lima menit tanpa output pascasinkronisasi. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard tersebut, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang ukurannya tidak biasa besar.

Crabbox adalah jalur box jarak jauh kedua milik repositori untuk pembuktian Linux ketika Blacksmith tidak tersedia atau ketika kapasitas cloud milik sendiri lebih disukai. Hangatkan box, hidrasi melalui workflow proyek, lalu jalankan perintah melalui Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` memiliki default penyedia, sinkronisasi, dan hidrasi GitHub Actions. File ini mengecualikan `.git` lokal agar checkout Actions yang dihidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan object store lokal maintainer, dan mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, penyiapan Node/pnpm, fetch `origin/main`, dan penerusan environment non-rahasia yang nantinya di-source oleh perintah `crabbox run --id <cbx_id>`.

## Terkait

- [Ringkasan instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
