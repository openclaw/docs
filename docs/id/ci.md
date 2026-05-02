---
read_when:
    - Anda perlu memahami mengapa sebuah job CI berjalan atau tidak
    - Anda sedang menelusuri masalah pada pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan eksekusi validasi rilis atau eksekusi ulangnya
    - Anda sedang mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Graf pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur CI
x-i18n:
    generated_at: "2026-05-02T22:17:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan menonaktifkan lane yang mahal ketika hanya area yang tidak terkait yang berubah. Run `workflow_dispatch` manual sengaja melewati scoping cerdas dan menyebar ke seluruh grafik untuk kandidat rilis dan validasi luas. Lane Android tetap opsional melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow terpisah [`Prarilis Plugin`](#plugin-prerelease) dan hanya berjalan dari [`Validasi Rilis Penuh`](#full-release-validation) atau dispatch manual eksplisit.

## Ringkasan pipeline

| Job                              | Tujuan                                                                                                              | Kapan berjalan                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, scope yang berubah, ekstensi yang berubah, dan membangun manifest CI              | Selalu pada push dan PR non-draf       |
| `security-scm-fast`              | Deteksi kunci privat dan audit workflow melalui `zizmor`                                                            | Selalu pada push dan PR non-draf       |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisory npm                                                       | Selalu pada push dan PR non-draf       |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                                              | Selalu pada push dan PR non-draf       |
| `check-dependencies`             | Pass khusus dependensi Knip produksi ditambah penjaga allowlist file tidak terpakai                                 | Perubahan relevan Node                 |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak build, dan artefak downstream yang dapat digunakan ulang         | Perubahan relevan Node                 |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/kontrak-plugin/protokol                                      | Perubahan relevan Node                 |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak kanal yang di-shard dengan hasil pemeriksaan agregat yang stabil                                | Perubahan relevan Node                 |
| `checks-node-core-test`          | Shard pengujian Node inti, mengecualikan lane kanal, bundled, kontrak, dan ekstensi                                 | Perubahan relevan Node                 |
| `check`                          | Ekuivalen gate lokal utama yang di-shard: tipe prod, lint, guard, tipe pengujian, dan smoke ketat                   | Perubahan relevan Node                 |
| `check-additional`               | Arsitektur, batas, drift snapshot prompt, guard surface ekstensi, batas paket, dan shard gateway-watch              | Perubahan relevan Node                 |
| `build-smoke`                    | Pengujian smoke CLI yang sudah dibuild dan smoke memori startup                                                     | Perubahan relevan Node                 |
| `checks`                         | Verifier untuk pengujian kanal artefak build                                                                        | Perubahan relevan Node                 |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                                         | Dispatch CI manual untuk rilis         |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan tautan rusak                                                                | Docs berubah                           |
| `skills-python`                  | Ruff + pytest untuk skills yang didukung Python                                                                     | Perubahan relevan skill Python         |
| `checks-windows`                 | Pengujian proses/path khusus Windows ditambah regresi specifier impor runtime bersama                               | Perubahan relevan Windows              |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artefak build bersama                                                   | Perubahan relevan macOS                |
| `macos-swift`                    | Swift lint, build, dan pengujian untuk aplikasi macOS                                                               | Perubahan relevan macOS                |
| `android`                        | Pengujian unit Android untuk kedua flavor ditambah satu build APK debug                                             | Perubahan relevan Android              |
| `test-performance-agent`         | Optimisasi pengujian lambat Codex harian setelah aktivitas tepercaya                                                | CI utama sukses atau dispatch manual   |
| `openclaw-performance`           | Laporan performa runtime Kova harian/sesuai permintaan dengan lane mock-provider, deep-profile, dan live GPT 5.4    | Terjadwal dan dispatch manual          |

## Urutan fail-fast

1. `preflight` memutuskan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job artefak dan matriks platform yang lebih berat.
3. `build-artifacts` tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang digantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR atau ref `main` yang sama. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah digantikan. Kunci konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub di grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run suite penuh manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

## Scope dan routing

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifest preflight bertindak seolah-olah setiap area berscope berubah.

- **Edit workflow CI** memvalidasi grafik CI Node ditambah linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap berscope ke perubahan sumber platform.
- **Edit khusus routing CI, edit fixture pengujian inti murah tertentu, dan edit helper/test-routing kontrak Plugin yang sempit** menggunakan jalur manifest cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, kontrak kanal, shard inti penuh, shard Plugin bundled, dan matriks guard tambahan ketika perubahan terbatas pada surface routing atau helper yang diuji langsung oleh tugas cepat tersebut.
- **Pemeriksaan Node Windows** berscope ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi manajer paket, dan surface workflow CI yang menjalankan lane tersebut; perubahan sumber, Plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada di lane Linux Node.

Keluarga pengujian Node paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner secara berlebihan: kontrak kanal berjalan sebagai tiga shard berbobot, lane unit inti kecil dipasangkan, auto-reply berjalan sebagai empat worker seimbang (dengan subtree reply dipecah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi agentic Gateway/Plugin disebar di seluruh job Node agentic khusus sumber yang sudah ada alih-alih menunggu artefak build. Pengujian browser, QA, media, dan Plugin lain-lain yang luas menggunakan konfigurasi Vitest khususnya sendiri, bukan catch-all Plugin bersama. Shard include-pattern mencatat entri waktu menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard yang difilter. `check-additional` menjaga pekerjaan kompilasi/canary batas paket tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard guard batas menjalankan guard independen kecilnya secara bersamaan di dalam satu job, termasuk `pnpm prompt:snapshots:check` sehingga drift prompt jalur lancar Codex dipasangkan ke PR yang menyebabkannya. Gateway watch, pengujian kanal, dan shard batas dukungan inti berjalan secara bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibuild.

Android CI menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membuild APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifest terpisah; lane pengujian unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipin ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file tidak terpakai produksi Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak terpakai gagal ketika PR menambahkan file tidak terpakai baru yang belum ditinjau atau meninggalkan entri allowlist usang, sambil mempertahankan surface Plugin dinamis, generated, build, live-test, dan bridge paket yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow ini memiliki empat lane:

- `clawsweeper_item` untuk permintaan tinjauan issue dan pull request yang tepat;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit dalam komentar issue;
- `clawsweeper_commit_review` untuk permintaan tinjauan tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis peristiwa, tindakan, aktor, repositori, nomor item, URL, judul, status, dan kutipan pendek untuk komentar atau tinjauan jika ada. Lane ini sengaja menghindari penerusan seluruh body Webhook. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting peristiwa yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord di prompt-nya dan hanya boleh memposting ke `#clawsweeper` ketika peristiwa tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise Webhook duplikat, dan lalu lintas tinjauan normal seharusnya menghasilkan `NO_REPLY`.

Perlakukan judul GitHub, komentar, body, teks tinjauan, nama branch, dan pesan commit sebagai data yang tidak tepercaya di seluruh jalur ini. Semua itu adalah input untuk perangkuman dan triage, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan grafik job yang sama seperti CI normal, tetapi memaksa setiap lane berscope non-Android aktif: shard Linux Node, shard Plugin terbundel, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Python skills, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri hanya menjalankan Android dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis Plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan lane Docker prarilis Plugin dikecualikan dari CI. Suite prarilis Docker hanya berjalan ketika `Full Release Validation` mendispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup konkurensi unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik itu terhadap branch, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/terbundel cepat, pemeriksaan kontrak channel tershard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifier agregat pengujian Node, pemeriksaan docs, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang dihosting GitHub agar matriks Blacksmith dapat masuk antrean lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ekstensi berbobot lebih ringan, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                            |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Linux Node, shard pengujian Plugin terbundel, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif CPU sehingga 8 vCPU lebih mahal daripada penghematan yang diberikannya); build Docker install-smoke (biaya waktu antrean 32-vCPU lebih besar daripada penghematan yang diberikannya)                                                                                                                                                                                                                                                       |
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

`OpenClaw Performance` adalah workflow performa produk/runtime. Workflow ini berjalan harian di `main` dan dapat didispatch secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow menginstal OCM dari rilis yang dipin dan Kova dari input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan autentikasi kompatibel OpenAI palsu yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, gateway, dan agent-turn.
- `live-gpt54`: turn agen OpenAI `openai/gpt-5.4` nyata, dilewati ketika `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah pass Kova: timing boot gateway dan memori di seluruh kasus startup default, hook, dan 50-Plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; dan perintah startup CLI terhadap gateway yang sudah diboot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundel laporan, dengan JSON mentah di sebelahnya.

Setiap lane mengunggah artefak GitHub. Ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, workflow juga mengcommit `report.json`, `report.md`, bundel, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Pointer branch saat ini ditulis sebagai `openclaw-performance/<ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow payung manual untuk "menjalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit penuh, mendispatch workflow `CI` manual dengan target tersebut, mendispatch `Plugin Prerelease` untuk bukti khusus rilis Plugin/paket/statis/Docker, dan mendispatch `OpenClaw Release Checks` untuk smoke install, acceptance paket, suite jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah penerbitan, teruskan `npm_telegram_package_spec` untuk menjalankan ulang lane paket Telegram yang sama terhadap paket npm yang diterbitkan.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama job workflow persis, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah workflow rilis mutating manual. Dispatch dari
`release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah preflight npm
OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`,
mendispatch `Plugin NPM Release` untuk semua paket Plugin yang dapat dipublikasikan, mendispatch
`Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru kemudian mendispatch
`OpenClaw NPM Release` dengan `preflight_run_id` yang disimpan.

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
mendispatch `Full Release Validation` dari ref yang dipin itu, memverifikasi setiap
workflow anak `headSha` cocok dengan target, dan menghapus branch sementara ketika
run selesai. Verifier payung juga gagal jika ada workflow anak yang berjalan pada
SHA berbeda.

`release_profile` mengontrol cakupan live/provider yang diteruskan ke pemeriksaan rilis. Workflow
rilis manual default ke `stable`; gunakan `full` hanya ketika Anda
sengaja menginginkan matriks advisory provider/media yang luas.

- `minimum` mempertahankan lane OpenAI/core paling cepat yang kritis untuk rilis.
- `stable` menambahkan set provider/backend stabil.
- `full` menjalankan matriks advisory provider/media yang luas.

Payung mencatat id run anak yang didispatch, dan job final `Verify full validation` memeriksa ulang conclusion run anak saat ini serta menambahkan tabel job terlambat untuk setiap run anak. Jika workflow anak dijalankan ulang dan menjadi hijau, jalankan ulang hanya job verifier induk untuk menyegarkan hasil payung dan ringkasan timing.

Untuk pemulihan, baik `Full Release Validation` maupun `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk child CI penuh normal, `plugin-prerelease` hanya untuk child prarilis Plugin, `release-checks` untuk setiap child rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada umbrella. Ini menjaga rerun release box yang gagal tetap terbatas setelah perbaikan terfokus.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref yang dipilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke workflow Docker jalur rilis live/E2E dan shard penerimaan paket. Ini menjaga byte paket tetap konsisten di seluruh release box dan menghindari pemaketan ulang kandidat yang sama dalam beberapa job child.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan umbrella yang lebih lama. Monitor parent membatalkan workflow child apa pun yang
sudah didispatch saat parent dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang run release-check usang berdurasi dua jam. Validasi branch/tag rilis
dan grup rerun terfokus tetap memakai `cancel-in-progress: false`.

## Shard Live dan E2E

Child live/E2E rilis tetap mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs`, bukan satu job serial:

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

Ini mempertahankan cakupan file yang sama sekaligus membuat kegagalan provider live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibuat oleh workflow `Live Media Runner Image`. Image itu memasang `ffmpeg` dan `ffprobe` terlebih dahulu; job media hanya memverifikasi binary sebelum setup. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job container bukan tempat yang tepat untuk menjalankan pengujian Docker bertingkat.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Workflow rilis live membuat dan mendorong image itu satu kali, lalu shard model live Docker, Gateway yang di-shard berdasarkan provider, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` eksplisit tingkat skrip di bawah timeout job workflow sehingga container atau jalur pembersihan yang macet gagal cepat alih-alih menghabiskan seluruh anggaran release-check. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah konfigurasi dan akan membuang waktu nyata pada build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat dipasang ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi source tree, sementara penerimaan paket memvalidasi satu tarball melalui harness Docker E2E yang sama yang digunakan pengguna setelah install atau update.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref workflow, ref paket, versi, SHA-256, serta profil dalam ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker package-digest bila diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket itu, bukan memaketkan checkout workflow. Saat suatu profil memilih beberapa `docker_lanes` bertarget, workflow reusable menyiapkan paket dan image bersama satu kali, lalu menyebarkan lane tersebut sebagai job Docker bertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan memasang artefak `package-under-test` yang sama ketika Penerimaan Paket menyelesaikan satu paket; dispatch Telegram mandiri masih dapat memasang spec npm yang sudah dipublikasikan.
4. `summary` menggagalkan workflow jika resolusi paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@alpha`, `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prarilis/stabil yang sudah dipublikasikan.
- `source=ref` memaketkan branch, tag, atau SHA commit penuh `package_ref` tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, memasang dependensi dalam worktree detached, dan memaketkannya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dipaketkan ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan kembali artefak `package-under-test` dalam `NPM Telegram Beta E2E`, dengan jalur spec npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan khusus pengujian update dan Plugin, termasuk perintah lokal,
lane Docker, input Penerimaan Paket, default rilis, dan triase kegagalan,
lihat [Menguji update dan Plugin](/id/help/testing-updates-plugins).

Release checks memanggil Penerimaan Paket dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, dan `telegram_mode=mock-openai`. Ini menjaga bukti migrasi paket, update, pembersihan dependensi Plugin usang, perbaikan install Plugin yang dikonfigurasi, Plugin offline, plugin-update, dan Telegram pada tarball paket terselesaikan yang sama. Setel `package_acceptance_package_spec` pada Full Release Validation atau OpenClaw Release Checks untuk menjalankan matriks yang sama terhadap paket npm yang sudah dikirim, bukan artefak yang dibuat dari SHA. Release checks lintas-OS tetap mencakup onboarding, installer, dan perilaku platform yang spesifik OS; validasi produk paket/update harus dimulai dengan Penerimaan Paket. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run. Dalam Penerimaan Paket, tarball `package-under-test` yang diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline publikasi fallback, default-nya `openclaw@latest`; perintah rerun lane yang gagal mempertahankan baseline itu. Setel `published_upgrade_survivor_baselines=all-since-2026.4.23` untuk memperluas Full Release CI ke setiap rilis npm stabil dari `2026.4.23` hingga `latest`; `release-history` tetap tersedia untuk sampling manual yang lebih luas dengan anchor pra-tanggal yang lebih lama. Setel `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas baseline yang sama ke fixture berbentuk issue untuk config Feishu, file bootstrap/persona yang dipertahankan, install Plugin OpenClaw yang dikonfigurasi, jalur log tilde, dan root dependensi Plugin legacy yang usang. Workflow `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah pembersihan update publikasi yang menyeluruh, bukan keluasan Full Release CI normal. Run agregat lokal dapat meneruskan spec paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menyetel `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane yang dipublikasikan mengonfigurasi baseline dengan resep perintah `openclaw config set` bawaan, merekam langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway mulai. Lane fresh paket dan installer Windows juga memverifikasi bahwa paket yang terpasang dapat mengimpor override browser-control dari jalur Windows absolut mentah. Smoke agent-turn lintas-OS OpenAI default ke `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika disetel, jika tidak `openai/gpt-5.4`, sehingga bukti install dan Gateway tetap memakai model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Penerimaan Paket memiliki jendela kompatibilitas legacy terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui dalam `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag itu;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke Plugin dapat membaca lokasi catatan install legacy atau menerima persistensi catatan install marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata config sambil tetap mewajibkan catatan install dan perilaku tanpa reinstall tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memperingatkan untuk file stamp metadata build lokal yang sudah dikirim. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama gagal, bukan memperingatkan atau dilewati.

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

Saat men-debug proses penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa proses turunan `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah jalankan ulang. Utamakan menjalankan ulang profil paket yang gagal atau lane Docker persisnya daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Workflow `Install Smoke` yang terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifes Plugin bawaan, atau permukaan Plugin SDK core plugin/channel/gateway yang diuji oleh job smoke Docker. Perubahan Plugin bawaan khusus sumber, edit khusus pengujian, dan edit khusus dokumentasi tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e container gateway-network, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker Plugin bawaan terbatas di bawah batas waktu perintah agregat 240 detik (setiap Docker run skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan instalasi paket QR serta cakupan Docker/update installer untuk proses terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instalasi paket QR, smoke Dockerfile/gateway root, smoke installer/update, dan E2E Docker Plugin bawaan cepat sebagai job terpisah agar pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; ketika logika cakupan perubahan akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi malam atau rilis.

Smoke image-provider instalasi global Bun yang lambat dikendalikan secara terpisah oleh `run_bun_global_install_smoke`. Smoke ini berjalan pada jadwal malam dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat ikut menyertakannya, tetapi pull request dan push `main` tidak. Pengujian Docker QR dan installer tetap memiliki Dockerfile berfokus instalasinya sendiri.

## Docker E2E lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, dan membangun dua image bersama `scripts/e2e/Dockerfile`:

- runner Node/Git kosong untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi rencana yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Yang dapat disetel

| Variabel                               | Default | Tujuan                                                                                        |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot main-pool untuk lane normal.                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif provider.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live serentak agar provider tidak melakukan throttle.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instalasi npm serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antarawal lane untuk menghindari badai create daemon Docker; atur `0` tanpa jeda.        |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Batas waktu fallback per lane (120 menit); lane live/tail terpilih memakai batas lebih ketat. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak rencana scheduler tanpa menjalankan lane.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agent dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya masih dapat dimulai dari pool kosong, lalu berjalan sendiri sampai kapasitas dilepas. Preflight agregat lokal memeriksa Docker, menghapus container OpenClaw E2E usang, memancarkan status active-lane, menyimpan timing lane untuk pengurutan paling lama lebih dulu, dan secara default berhenti menjadwalkan lane pooled baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan `scripts/test-docker-all.mjs --plan-json` cakupan paket, jenis image, image live, lane, dan kredensial mana yang diperlukan. `scripts/docker-e2e.mjs` lalu mengonversi rencana itu menjadi output dan ringkasan GitHub. Workflow ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket dari run saat ini, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image Docker E2E bare/functional GHCR bertag digest paket melalui cache layer Docker Blacksmith saat rencana memerlukan lane yang sudah terinstal paket; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan batas waktu 180 detik per percobaan yang terbatas agar stream registry/cache yang macet cepat dicoba ulang alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkannya dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat Plugin/runtime. Alias lane `install-e2e` tetap menjadi alias jalankan ulang manual agregat untuk kedua lane installer provider.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` saat cakupan release-path penuh memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane pembaruan bundled-channel mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON rencana scheduler, tabel slow-lane, dan perintah jalankan ulang per lane. Input workflow `docker_lanes` menjalankan lane terpilih terhadap image yang sudah disiapkan alih-alih job chunk, sehingga debugging lane gagal tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk run itu; jika lane terpilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk jalankan ulang itu. Perintah jalankan ulang GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan saat nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, jadi ini adalah workflow terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri tidak menjalankan suite tersebut. Workflow ini menyeimbangkan pengujian Plugin bawaan di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch Plugin yang berat impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis mengelompokkan lane Docker tertarget dalam grup kecil untuk menghindari pencadangan puluhan runner untuk job berdurasi satu hingga tiga menit.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow utama yang dicakup secara cerdas. Paritas agentic berada di bawah harness QA dan rilis yang luas, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` saat paritas harus ikut dalam run validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan pada dispatch manual; workflow ini mem-fan out lane paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan provider mock deterministik dan model mock-qualified (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup provider-plugin normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas provider dicakup oleh suite model live, provider native, dan provider Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu men-shard cakupan Matrix penuh ke dalam job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/check yang sesuai cakupan alih-alih memperlakukan paritas sebagai status wajib.

## CodeQL

Alur kerja `CodeQL` sengaja merupakan pemindai keamanan lintas pertama yang sempit, bukan penyapuan repositori penuh. Penjaga harian, manual, dan pull request non-draf memindai kode alur kerja Actions ditambah permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Penjaga pull request tetap ringan: penjaga ini hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti alur kerja terjadwal. CodeQL Android dan macOS tetap berada di luar bawaan PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, rahasia, sandbox, Cron, dan baseline Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti ditambah runtime Plugin channel, Gateway, Plugin SDK, rahasia, titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF inti, parsing IP, penjaga jaringan, web-fetch, dan permukaan kebijakan SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gerbang eksekusi tool agen                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifes, registry, instalasi package-manager, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL di runner Blacksmith Linux terkecil yang diterima oleh kewarasan alur kerja. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi keluar dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar bawaan harian karena build macOS mendominasi runtime meskipun bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error di permukaan bernilai tinggi yang sempit pada runner Blacksmith Linux yang lebih kecil. Penjaga pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draf hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sepadan untuk perubahan kode eksekusi perintah/model/tool agen dan dispatch balasan, kode skema/migrasi/IO config, kode auth/rahasia/sandbox/keamanan, channel inti dan runtime Plugin channel terbundel, protokol Gateway/metode-server, runtime memori/perekat SDK, MCP/proses/pengiriman keluar, runtime provider/katalog model, diagnostik sesi/antrean pengiriman, loader Plugin, Plugin SDK/kontrak-paket, atau runtime balasan Plugin SDK. Perubahan config CodeQL dan alur kerja kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Permukaan                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan auth, rahasia, sandbox, Cron, dan Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Skema config, migrasi, normalisasi, dan kontrak IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan Plugin channel terbundel                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Eksekusi perintah, dispatch model/provider, dispatch dan antrean auto-reply, serta kontrak runtime control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge tool, helper supervisi proses, serta kontrak pengiriman keluar                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, fasad runtime memori, alias Plugin SDK memori, perekat aktivasi runtime memori, dan perintah doctor memori                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundle event/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, pendaftaran runtime provider, bawaan/katalog provider, serta registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol Gateway, dan kontrak runtime control-plane tugas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web inti, IO media, pemahaman media, image-generation, dan kontrak runtime media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket Plugin                                                                                      |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan Plugin terbundel harus ditambahkan kembali sebagai pekerjaan lanjutan yang terskop atau di-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Alur kerja pemeliharaan

### Docs Agent

Alur kerja `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru saja mendarat. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, dan dispatch manual dapat menjalankannya secara langsung. Pemanggilan workflow-run melewati saat `main` sudah bergerak maju atau saat run Docs Agent non-dilewati lain dibuat dalam satu jam terakhir. Saat berjalan, ini meninjau rentang commit dari SHA sumber Docs Agent non-dilewati sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pass dokumen terakhir.

### Test Performance Agent

Alur kerja `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk tes lambat. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, tetapi dilewati jika pemanggilan workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gerbang aktivitas harian itu. Lane ini membangun laporan performa Vitest yang dikelompokkan untuk full-suite, membiarkan Codex hanya membuat perbaikan performa tes kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah baseline tes yang lulus. Jika baseline memiliki tes yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite pasca-agen harus lulus sebelum apa pun di-commit. Saat `main` maju sebelum push bot mendarat, lane ini me-rebase patch yang telah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch kedaluwarsa yang konflik dilewati. Ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti agen dokumen.

### PR Duplikat Setelah Merge

Alur kerja `Duplicate PRs After Merge` adalah alur kerja maintainer manual untuk pembersihan duplikat pasca-land. Bawaannya adalah dry-run dan hanya menutup PR yang tercantum secara eksplisit saat `apply=true`. Sebelum mengubah GitHub, ini memverifikasi bahwa PR yang mendarat sudah di-merge dan bahwa setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gerbang pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gerbang pemeriksaan lokal itu lebih ketat tentang batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan tes inti ditambah lint/penjaga inti;
- perubahan khusus tes inti hanya menjalankan typecheck tes inti ditambah lint inti;
- perubahan produksi ekstensi menjalankan typecheck prod ekstensi dan tes ekstensi ditambah lint ekstensi;
- perubahan khusus tes ekstensi menjalankan typecheck tes ekstensi ditambah lint ekstensi;
- perubahan Plugin SDK publik atau kontrak Plugin meluas ke typecheck ekstensi karena ekstensi bergantung pada kontrak inti tersebut (penyapuan ekstensi Vitest tetap merupakan pekerjaan tes eksplisit);
- bump versi khusus metadata rilis menjalankan pemeriksaan versi/config/dependensi-root tertarget;
- perubahan root/config yang tidak diketahui fail safe ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit tes langsung menjalankan dirinya sendiri, edit sumber memprioritaskan pemetaan eksplisit, lalu tes saudara dan dependen grafik impor. Config pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada config visible-reply grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui tes balasan inti ditambah regresi pengiriman Discord dan Slack agar perubahan bawaan bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya saat perubahan cukup luas pada harness sehingga set terpetakan murah bukan proxy yang dapat dipercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan utamakan box baru yang sudah dihangatkan untuk pembuktian luas. Sebelum memakai gate lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sinkronisasi yang sangat besar secara tidak terduga, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat ketika file root yang diperlukan seperti `pnpm-lock.yaml` hilang atau ketika `git status --short` menampilkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sinkronisasi jarak jauh bukan salinan PR yang dapat dipercaya; hentikan box tersebut dan hangatkan yang baru alih-alih men-debug kegagalan pengujian produk. Untuk PR penghapusan besar yang disengaja, atur `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk proses sanity tersebut.

`pnpm testbox:run` juga menghentikan pemanggilan CLI Blacksmith lokal yang tetap berada dalam fase sinkronisasi selama lebih dari lima menit tanpa output pascasinkronisasi. Atur `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan pelindung tersebut, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang luar biasa besar.

Crabbox adalah jalur remote-box kedua milik repo untuk pembuktian Linux ketika Blacksmith tidak tersedia atau ketika kapasitas cloud milik sendiri lebih disukai. Hangatkan box, hidrasi melalui alur kerja proyek, lalu jalankan perintah melalui CLI Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` mengelola default provider, sinkronisasi, dan hidrasi GitHub Actions. File ini mengecualikan `.git` lokal sehingga checkout Actions yang dihidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan penyimpanan objek lokal milik maintainer, serta mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` mengelola checkout, penyiapan Node/pnpm, pengambilan `origin/main`, dan serah-terima lingkungan non-rahasia yang kemudian dijadikan sumber oleh perintah `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
