---
read_when:
    - Anda perlu memahami mengapa pekerjaan CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan proses validasi rilis atau pengulangannya
    - Anda sedang mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Graf tugas CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-02T23:39:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan mematikan lane yang mahal ketika hanya area yang tidak terkait yang berubah. Run `workflow_dispatch` manual secara sengaja melewati scoping cerdas dan menyebarkan seluruh graph untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow [`Plugin Prerelease`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Full Release Validation`](#full-release-validation) atau dispatch manual eksplisit.

## Ikhtisar pipeline

| Job                              | Tujuan                                                                                                             | Kapan berjalan                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, scope yang berubah, extension yang berubah, dan membangun manifes CI                             | Selalu pada push dan PR non-draft |
| `security-scm-fast`              | Deteksi kunci privat dan audit workflow melalui `zizmor`                                                               | Selalu pada push dan PR non-draft |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependensi terhadap advisory npm                                                    | Selalu pada push dan PR non-draft |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                                       | Selalu pada push dan PR non-draft |
| `check-dependencies`             | Pass khusus dependensi Knip produksi plus guard allowlist file yang tidak digunakan                                           | Perubahan relevan Node              |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak build, dan artefak downstream yang dapat digunakan ulang                                 | Perubahan relevan Node              |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/kontrak-Plugin/protokol                                        | Perubahan relevan Node              |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil                                                | Perubahan relevan Node              |
| `checks-node-core-test`          | Shard pengujian Node inti, mengecualikan lane channel, bundled, kontrak, dan extension                                    | Perubahan relevan Node              |
| `check`                          | Ekuivalen gate lokal utama yang di-shard: tipe prod, lint, guard, tipe pengujian, dan smoke ketat                          | Perubahan relevan Node              |
| `check-additional`               | Arsitektur, boundary, drift snapshot prompt, guard permukaan extension, package-boundary, dan shard gateway-watch | Perubahan relevan Node              |
| `build-smoke`                    | Pengujian smoke CLI hasil build dan smoke memori startup                                                                      | Perubahan relevan Node              |
| `checks`                         | Verifier untuk pengujian channel artefak hasil build                                                                           | Perubahan relevan Node              |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                                          | Dispatch CI manual untuk rilis    |
| `check-docs`                     | Format docs, lint, dan pemeriksaan tautan rusak                                                                       | Docs berubah                       |
| `skills-python`                  | Ruff + pytest untuk skills yang didukung Python                                                                              | Perubahan relevan skill Python      |
| `checks-windows`                 | Pengujian proses/path khusus Windows plus regresi specifier impor runtime bersama                                | Perubahan relevan Windows           |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artefak hasil build bersama                                                         | Perubahan relevan macOS             |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk aplikasi macOS                                                                      | Perubahan relevan macOS             |
| `android`                        | Pengujian unit Android untuk kedua flavor plus satu build APK debug                                                        | Perubahan relevan Android           |
| `test-performance-agent`         | Optimisasi pengujian lambat Codex harian setelah aktivitas tepercaya                                                           | CI utama berhasil atau dispatch manual |
| `openclaw-performance`           | Laporan performa runtime Kova harian/on-demand dengan lane mock-provider, deep-profile, dan live GPT 5.4           | Terjadwal dan dispatch manual      |

## Urutan fail-fast

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job artefak dan matriks platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR yang sama atau ref `main`. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak antre setelah seluruh workflow sudah tergantikan. Kunci konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub di grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berlangsung.

## Scope dan routing

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area berscope berubah.

- **Edit workflow CI** memvalidasi graph CI Node plus linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap dibatasi ke perubahan source platform.
- **Edit khusus routing CI, edit fixture pengujian inti murah tertentu, dan edit helper/routing pengujian kontrak Plugin yang sempit** menggunakan jalur manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard inti penuh, shard bundled-Plugin, dan matriks guard tambahan ketika perubahan terbatas pada permukaan routing atau helper yang langsung diuji tugas cepat tersebut.
- **Pemeriksaan Node Windows** dibatasi ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang menjalankan lane tersebut; perubahan source, Plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada di lane Node Linux.

Keluarga pengujian Node paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, lane unit inti kecil dipasangkan, auto-reply berjalan sebagai empat worker seimbang (dengan subtree reply dipecah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi agentic Gateway/Plugin disebar ke job Node agentic khusus source yang sudah ada alih-alih menunggu artefak hasil build. Pengujian browser luas, QA, media, dan Plugin lain-lain menggunakan konfigurasi Vitest khususnya, bukan catch-all Plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard yang difilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard guard boundary menjalankan guard independen kecilnya secara konkuren di dalam satu job, termasuk `pnpm prompt:snapshots:check` sehingga drift prompt happy-path runtime Codex dipakukan ke PR yang menyebabkannya. Gateway watch, pengujian channel, dan shard support-boundary inti berjalan konkuren di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane pengujian unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push relevan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipin ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk install `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file produksi yang tidak digunakan dari Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard file yang tidak digunakan gagal ketika PR menambahkan file tidak digunakan baru yang belum ditinjau atau meninggalkan entri allowlist usang, sambil mempertahankan permukaan Plugin dinamis, generated, build, live-test, dan bridge package yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow ini memiliki empat lane:

- `clawsweeper_item` untuk permintaan tinjauan issue dan pull request yang tepat;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit di komentar issue;
- `clawsweeper_commit_review` untuk permintaan tinjauan tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: tipe event, aksi, aktor, repositori, nomor item, URL, judul, status, dan kutipan pendek untuk komentar atau tinjauan ketika ada. Lane ini sengaja menghindari penerusan body webhook penuh. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord di prompt-nya dan sebaiknya memposting ke `#clawsweeper` hanya ketika event tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise webhook duplikat, dan traffic tinjauan normal sebaiknya menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, body, teks tinjauan, nama branch, dan pesan commit GitHub sebagai data yang tidak tepercaya di seluruh jalur ini. Semua itu adalah input untuk peringkasan dan triage, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan grafik pekerjaan yang sama seperti CI normal, tetapi memaksa setiap lane berscope non-Android aktif: shard Linux Node, shard plugin bawaan, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, build smoke, pemeriksaan docs, Python skills, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android saja dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan lane Docker prarilis plugin dikecualikan dari CI. Suite prarilis Docker hanya berjalan ketika `Full Release Validation` men-dispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup konkurensi unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik tersebut terhadap branch, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, pekerjaan keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/bawaan cepat, pemeriksaan kontrak channel bershard, shard `check` kecuali lint, shard dan agregat `check-additional`, pemverifikasi agregat pengujian Node, pemeriksaan docs, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat antre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ekstensi berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                              |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Linux Node, shard pengujian plugin bawaan, `android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif terhadap CPU sehingga 8 vCPU biayanya lebih besar daripada penghematannya); build Docker install-smoke (biaya waktu antre 32-vCPU lebih besar daripada penghematannya)                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Padanan lokal

```bash
pnpm changed:lanes                            # periksa pengklasifikasi changed-lane lokal untuk origin/main...HEAD
pnpm check:changed                            # gate pemeriksaan lokal cerdas: typecheck/lint/guard yang berubah berdasarkan lane batas
pnpm check                                    # gate lokal cepat: prod tsgo + lint bershard + guard cepat paralel
pnpm check:test-types
pnpm check:timed                              # gate yang sama dengan waktu per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # pengujian vitest
pnpm test:changed                             # target Vitest changed cerdas yang murah
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # format docs + lint + tautan rusak
pnpm build                                    # build dist saat lane artefak CI/build-smoke penting
pnpm ci:timings                               # ringkas run CI push origin/main terbaru
pnpm ci:timings:recent                        # bandingkan run CI main berhasil terbaru
node scripts/ci-run-timings.mjs <run-id>      # ringkas waktu wall, waktu antre, dan pekerjaan paling lambat
node scripts/ci-run-timings.mjs --latest-main # abaikan noise issue/comment dan pilih CI push origin/main
node scripts/ci-run-timings.mjs --recent 10   # bandingkan run CI main berhasil terbaru
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Performa OpenClaw

`OpenClaw Performance` adalah workflow performa produk/runtime. Workflow ini berjalan harian pada `main` dan dapat di-dispatch secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow menginstal OCM dari rilis yang dipin dan Kova dari input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan auth kompatibel OpenAI palsu yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, gateway, dan agent-turn.
- `live-gpt54`: giliran agen OpenAI `openai/gpt-5.4` nyata, dilewati ketika `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah pass Kova: timing boot gateway dan memori di seluruh kasus startup default, hook, dan 50-plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; dan perintah startup CLI terhadap gateway yang sudah diboot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundle laporan, dengan JSON mentah di sebelahnya.

Setiap lane mengunggah artefak GitHub. Ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, workflow juga meng-commit `report.json`, `report.md`, bundle, `index.md`, dan artefak source-probe ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Pointer branch saat ini ditulis sebagai `openclaw-performance/<ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow payung manual untuk "jalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit penuh, men-dispatch workflow `CI` manual dengan target tersebut, men-dispatch `Plugin Prerelease` untuk bukti plugin/package/static/Docker khusus rilis, dan men-dispatch `OpenClaw Release Checks` untuk install smoke, penerimaan package, suite jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah publikasi, teruskan `npm_telegram_package_spec` untuk menjalankan ulang lane package Telegram yang sama terhadap package npm yang sudah dipublikasikan.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk matriks tahap, nama pekerjaan workflow yang tepat, perbedaan profil, artefak, dan handle rerun terfokus.

`OpenClaw Release Publish` adalah workflow rilis mutasi manual. Dispatch dari `release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah preflight npm OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`, men-dispatch `Plugin NPM Release` untuk semua package plugin yang dapat dipublikasikan, men-dispatch `Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru kemudian men-dispatch `OpenClaw NPM Release` dengan `preflight_run_id` yang tersimpan.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan helper alih-alih `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref dispatch workflow GitHub harus berupa branch atau tag, bukan SHA commit mentah. Helper mendorong branch sementara `release-ci/<sha>-...` pada SHA target, men-dispatch `Full Release Validation` dari ref yang dipin tersebut, memverifikasi setiap `headSha` workflow anak cocok dengan target, dan menghapus branch sementara ketika run selesai. Pemverifikasi payung juga gagal jika ada workflow anak yang berjalan pada SHA berbeda.

`release_profile` mengontrol keluasan live/provider yang diteruskan ke pemeriksaan rilis. Workflow rilis manual default ke `stable`; gunakan `full` hanya ketika Anda sengaja menginginkan matriks provider/media advisory yang luas.

- `minimum` mempertahankan lane OpenAI/core tercepat yang kritis untuk rilis.
- `stable` menambahkan set provider/backend stabil.
- `full` menjalankan matriks provider/media advisory yang luas.

Payung mencatat id run anak yang di-dispatch, dan pekerjaan final `Verify full validation` memeriksa ulang kesimpulan run anak saat ini serta menambahkan tabel pekerjaan paling lambat untuk setiap run anak. Jika workflow anak dijalankan ulang dan menjadi hijau, jalankan ulang hanya pekerjaan pemverifikasi induk untuk menyegarkan hasil payung dan ringkasan timing.

Untuk pemulihan, baik `Full Release Validation` maupun `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk child CI penuh normal, `plugin-prerelease` hanya untuk child prarilis Plugin, `release-checks` untuk setiap child rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada umbrella. Ini menjaga rerun release box yang gagal tetap terbatas setelah perbaikan terfokus.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk me-resolve ref terpilih sekali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke workflow Docker jalur rilis live/E2E dan shard penerimaan paket. Ini menjaga byte paket tetap konsisten di seluruh release box dan menghindari pengemasan ulang kandidat yang sama di beberapa job child.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan umbrella yang lebih lama. Monitor parent membatalkan workflow child apa pun yang
sudah dikirim saat parent dibatalkan, sehingga validasi main yang lebih baru
tidak antre di belakang run release-check basi selama dua jam. Validasi branch/tag rilis
dan grup rerun terfokus tetap memakai `cancel-in-progress: false`.

## Shard live dan E2E

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
- shard media audio/video terpisah dan shard musik yang difilter berdasarkan provider

Ini mempertahankan cakupan file yang sama sambil membuat kegagalan provider live yang lambat lebih mudah di-rerun dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibuat oleh workflow `Live Media Runner Image`. Image itu sudah memasang `ffmpeg` dan `ffprobe`; job media hanya memverifikasi biner sebelum setup. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job container bukan tempat yang tepat untuk meluncurkan pengujian Docker bersarang.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit terpilih. Workflow rilis live membuat dan push image itu sekali, lalu shard model live Docker, Gateway yang di-shard berdasarkan provider, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` tingkat skrip eksplisit di bawah timeout job workflow agar container atau jalur cleanup yang macet gagal cepat alih-alih menghabiskan seluruh anggaran release-check. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah konfigurasi dan akan membuang waktu dinding untuk build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini bekerja sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi source tree, sedangkan penerimaan paket memvalidasi satu tarball melalui harness Docker E2E yang sama yang digunakan pengguna setelah install atau update.

### Job

1. `resolve_package` checkout `workflow_ref`, me-resolve satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref workflow, ref paket, versi, SHA-256, dan profil dalam ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker package-digest bila diperlukan, dan menjalankan lane Docker terpilih terhadap paket itu, bukan mengemas checkout workflow. Ketika sebuah profil memilih beberapa `docker_lanes` bertarget, workflow reusable menyiapkan paket dan image bersama sekali, lalu menyebarkan lane tersebut sebagai job Docker bertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama ketika Penerimaan Paket me-resolve satu paket; dispatch Telegram mandiri tetap dapat menginstal spec npm yang sudah dipublikasikan.
4. `summary` menggagalkan workflow jika resolusi paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prarilis/stabil yang telah dipublikasikan.
- `source=ref` mengemas branch, tag, atau SHA commit penuh `package_ref` tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit terpilih dapat dijangkau dari riwayat branch repositori atau tag rilis, memasang dependensi dalam worktree terlepas, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Jaga `workflow_ref` dan `package_ref` tetap terpisah. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — potongan jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline agar validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan ulang artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spec npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan khusus pengujian update dan Plugin, termasuk perintah lokal,
lane Docker, input Penerimaan Paket, default rilis, dan triase kegagalan,
lihat [Menguji update dan Plugin](/id/help/testing-updates-plugins).

Release check memanggil Penerimaan Paket dengan `source=artifact`, artefak paket rilis yang sudah disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, update, cleanup dependensi Plugin basi, perbaikan install Plugin terkonfigurasi, Plugin offline, update Plugin, dan bukti Telegram pada tarball paket hasil resolusi yang sama. Setel `package_acceptance_package_spec` pada Full Release Validation atau OpenClaw Release Checks untuk menjalankan matriks yang sama terhadap paket npm yang sudah dikirim, bukan artefak yang dibuat dari SHA. Release check lintas OS tetap mencakup onboarding, installer, dan perilaku platform spesifik OS; validasi produk paket/update sebaiknya dimulai dengan Penerimaan Paket. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run. Dalam Penerimaan Paket, tarball `package-under-test` yang di-resolve selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline fallback yang dipublikasikan, dengan default `openclaw@latest`; perintah rerun lane yang gagal mempertahankan baseline itu. Setel `published_upgrade_survivor_baselines=all-since-2026.4.23` untuk memperluas Full Release CI ke setiap rilis npm stabil dari `2026.4.23` hingga `latest`; `release-history` tetap tersedia untuk sampling manual yang lebih luas dengan anchor pra-tanggal yang lebih lama. Setel `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas baseline yang sama ke fixture berbentuk issue untuk config Feishu, file bootstrap/persona yang dipertahankan, install Plugin OpenClaw terkonfigurasi, path log tilde, dan root dependensi Plugin legacy basi. Workflow `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah cleanup update yang dipublikasikan secara menyeluruh, bukan keluasan Full Release CI normal. Run agregat lokal dapat meneruskan spec paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menyetel `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane yang dipublikasikan mengonfigurasi baseline dengan resep perintah `openclaw config set` bawaan, mencatat langkah resep di `summary.json`, dan mem-probe `/healthz`, `/readyz`, plus status RPC setelah Gateway start. Lane fresh paket dan installer Windows juga memverifikasi bahwa paket terinstal dapat mengimpor override browser-control dari path Windows absolut mentah. Smoke agent-turn lintas OS OpenAI default ke `OPENCLAW_CROSS_OS_OPENAI_MODEL` bila disetel, jika tidak `openai/gpt-5.4`, sehingga bukti install dan Gateway tetap memakai model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Penerimaan Paket memiliki jendela kompatibilitas legacy terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui di `dist/postinstall-inventory.json` boleh menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` boleh melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag itu;
- `update-channel-switch` boleh memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan boleh mencatat `update.channel` persisten yang hilang;
- smoke Plugin boleh membaca lokasi install-record legacy atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` boleh mengizinkan migrasi metadata config sambil tetap mewajibkan install record dan perilaku tanpa reinstall tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga boleh memperingatkan untuk file stamp metadata build lokal yang sudah dikirim. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama akan gagal, bukan memperingatkan atau dilewati.

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

Saat men-debug eksekusi penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa eksekusi anak `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, pengaturan waktu fase, dan perintah eksekusi ulang. Lebih baik jalankan ulang profil paket yang gagal atau lane Docker yang tepat daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Alur kerja `Install Smoke` terpisah menggunakan kembali skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Alur ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifes Plugin bawaan, atau permukaan Plugin inti/channel/Gateway/Plugin SDK yang diuji oleh job smoke Docker. Perubahan Plugin bawaan yang hanya menyentuh sumber, edit hanya pengujian, dan edit hanya dokumentasi tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI hapus agen workspace bersama, menjalankan e2e gateway-network kontainer, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker Plugin bawaan terbatas dengan batas waktu perintah agregat 240 detik (setiap eksekusi Docker skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan instalasi paket QR dan cakupan Docker/update penginstal untuk eksekusi terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan penginstal/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan kembali satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instalasi paket QR, smoke Dockerfile root/Gateway, smoke penginstal/update, dan E2E Docker Plugin bawaan jalur cepat sebagai job terpisah sehingga pekerjaan penginstal tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; ketika logika cakupan perubahan akan meminta cakupan penuh pada push, alur kerja mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi malam atau rilis.

Smoke penyedia image instalasi global Bun yang lambat dipagari secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam dan dari alur kerja pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat memilih untuk mengaktifkannya, tetapi pull request dan push `main` tidak. Pengujian Docker QR dan penginstal mempertahankan Dockerfile mereka sendiri yang berfokus pada instalasi.

## E2E Docker lokal

`pnpm test:docker:all` melakukan prabangun satu image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, dan membangun dua image bersama `scripts/e2e/Dockerfile`:

- runner Node/Git polos untuk lane penginstal/update/dependensi-Plugin;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi rencana yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parameter yang dapat disetel

| Variabel                               | Bawaan  | Tujuan                                                                                              |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                           |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot pool akhir yang sensitif terhadap penyedia.                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live serentak agar penyedia tidak melakukan throttling.                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instalasi npm serentak.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-layanan serentak.                                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antar-start lane untuk menghindari lonjakan pembuatan daemon Docker; setel `0` untuk tanpa jeda. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Batas waktu fallback per lane (120 menit); lane live/akhir terpilih menggunakan batas lebih ketat.  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak rencana scheduler tanpa menjalankan lane.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane tepat yang dipisahkan koma; melewati smoke pembersihan agar agen dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat dari batas efektifnya tetap dapat mulai dari pool kosong, lalu berjalan sendiri hingga melepas kapasitas. Agregat lokal melakukan preflight Docker, menghapus kontainer OpenClaw E2E usang, memancarkan status lane aktif, mempertahankan pengaturan waktu lane untuk pengurutan yang terlama lebih dulu, dan secara bawaan berhenti menjadwalkan lane pool baru setelah kegagalan pertama.

### Alur kerja live/E2E yang dapat digunakan kembali

Alur kerja live/E2E yang dapat digunakan kembali menanyakan `scripts/test-docker-all.mjs --plan-json` cakupan paket, jenis image, image live, lane, dan kredensial mana yang diperlukan. `scripts/docker-e2e.mjs` lalu mengonversi rencana tersebut menjadi output dan ringkasan GitHub. Alur ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket dari eksekusi saat ini, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/fungsional bertag digest paket melalui cache layer Docker Blacksmith saat rencana membutuhkan lane dengan paket terinstal; dan menggunakan kembali input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan batas waktu 180 detik per percobaan yang terbatas sehingga stream registry/cache yang tersangkut mencoba ulang dengan cepat alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job yang dibagi menjadi chunk lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkan dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat Plugin/runtime. Alias lane `install-e2e` tetap menjadi alias eksekusi ulang manual agregat untuk kedua lane penginstal penyedia.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` ketika cakupan release-path penuh memintanya, dan mempertahankan chunk `openwebui` mandiri hanya untuk dispatch khusus OpenWebUI. Lane update channel bawaan mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, pengaturan waktu, `summary.json`, `failures.json`, pengaturan waktu fase, JSON rencana scheduler, tabel lane lambat, dan perintah eksekusi ulang per lane. Input alur kerja `docker_lanes` menjalankan lane yang dipilih terhadap image yang telah disiapkan alih-alih job chunk, yang menjaga debugging lane gagal tetap terbatas pada satu job Docker bertarget dan menyiapkan, mengunduh, atau menggunakan kembali artefak paket untuk eksekusi tersebut; jika lane yang dipilih adalah lane Docker live, job bertarget membangun image live-test secara lokal untuk eksekusi ulang tersebut. Perintah eksekusi ulang GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang telah disiapkan saat nilai tersebut ada, sehingga lane yang gagal dapat menggunakan kembali paket dan image yang tepat dari eksekusi yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Alur kerja live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, jadi ini adalah alur kerja terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri menonaktifkan suite tersebut. Alur ini menyeimbangkan pengujian Plugin bawaan di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch Plugin dengan impor berat tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis mengelompokkan lane Docker bertarget dalam grup kecil untuk menghindari pencadangan puluhan runner untuk job berdurasi satu hingga tiga menit.

## QA Lab

QA Lab memiliki lane CI khusus di luar alur kerja bercakupan cerdas utama. Paritas agentic ditempatkan di bawah harness QA dan rilis luas, bukan alur kerja PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus ikut dalam eksekusi validasi luas.

- Alur kerja `QA-Lab - All Lanes` berjalan setiap malam di `main` dan pada dispatch manual; alur ini menyebarkan lane paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan lingkungan `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan penyedia mock deterministik dan model yang memenuhi syarat mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup Plugin penyedia normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh suite model live, penyedia native, dan penyedia Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Bawaan CLI dan input alur kerja manual tetap `all`; dispatch manual `matrix_profile=all` selalu membagi cakupan Matrix penuh menjadi job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/pemeriksaan bercakupan alih-alih memperlakukan paritas sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja merupakan pemindai keamanan lintas-pertama yang sempit, bukan penyisiran repositori penuh. Pemindaian penjaga harian, manual, dan pull request non-draf memindai kode workflow Actions plus permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Penjaga pull request tetap ringan: ia hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti workflow terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret, sandbox, cron, dan baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi kanal inti plus runtime plugin kanal, gateway, Plugin SDK, secret, titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, parsing IP, penjaga jaringan, web-fetch, dan SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gerbang eksekusi tool agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifest, registry, instalasi package-manager, source-loading, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL pada Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sesuai. Ia hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan severity error pada permukaan bernilai tinggi yang sempit di runner Blacksmith Linux yang lebih kecil. Penjaga pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draf hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk eksekusi perintah/model/tool agent dan kode dispatch balasan, skema config/migration/kode IO, kode auth/secret/sandbox/keamanan, runtime kanal inti dan plugin kanal bawaan, protokol gateway/server-method, runtime memory/glue SDK, MCP/proses/pengiriman keluar, katalog model/runtime provider, diagnostik sesi/antrean pengiriman, loader plugin, kontrak Plugin SDK/paket, atau perubahan runtime balasan Plugin SDK. Perubahan config CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Permukaan                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan auth, secret, sandbox, cron, dan gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Skema config, migration, normalisasi, dan kontrak IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi kanal inti dan plugin kanal bawaan                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Eksekusi perintah, dispatch model/provider, dispatch dan antrean auto-reply, serta kontrak runtime control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan jembatan tool, helper supervisi proses, serta kontrak pengiriman keluar                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memory, facade runtime memory, alias Plugin SDK memory, glue aktivasi runtime memory, dan perintah doctor memory                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundle event/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan kanal, antrean pengiriman, dan helper binding sesi/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, serta registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol gateway, dan kontrak runtime control-plane tugas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, image-generation, dan media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface, dan kontrak entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket plugin                                                                                      |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL untuk Swift, Python, dan plugin bawaan harus ditambahkan kembali sebagai pekerjaan lanjutan yang terskop atau tershard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Workflow pemeliharaan

### Docs Agent

Workflow `Docs Agent` adalah jalur pemeliharaan Codex berbasis event untuk menjaga docs yang ada tetap selaras dengan perubahan yang baru saja mendarat. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Invokasi workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-skipped lain dibuat dalam satu jam terakhir. Saat berjalan, ia meninjau rentang commit dari SHA sumber Docs Agent non-skipped sebelumnya ke `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terakumulasi sejak pemeriksaan docs terakhir.

### Test Performance Agent

Workflow `Test Performance Agent` adalah jalur pemeliharaan Codex berbasis event untuk test lambat. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, tetapi ia melewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gerbang aktivitas harian itu. Jalur ini membangun laporan performa Vitest full-suite yang dikelompokkan, memungkinkan Codex hanya membuat perbaikan performa test kecil yang mempertahankan coverage, bukan refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah test baseline yang lulus. Jika baseline memiliki test yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agent harus lulus sebelum apa pun di-commit. Saat `main` maju sebelum push bot mendarat, jalur ini melakukan rebase patch yang telah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch basi yang konflik dilewati. Ia menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keselamatan drop-sudo yang sama seperti agent docs.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat pasca-land. Default-nya dry-run dan hanya menutup PR yang dicantumkan eksplisit ketika `apply=true`. Sebelum mengubah GitHub, ia memverifikasi bahwa PR yang mendarat sudah merged dan bahwa setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gerbang check lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gerbang check lokal itu lebih ketat terhadap batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan test inti plus lint/guard inti;
- perubahan khusus test inti hanya menjalankan typecheck test inti plus lint inti;
- perubahan produksi ekstensi menjalankan typecheck prod ekstensi dan test ekstensi plus lint ekstensi;
- perubahan khusus test ekstensi menjalankan typecheck test ekstensi plus lint ekstensi;
- perubahan Plugin SDK publik atau kontrak plugin meluas ke typecheck ekstensi karena ekstensi bergantung pada kontrak inti tersebut (penyisiran ekstensi Vitest tetap pekerjaan test eksplisit);
- bump versi khusus metadata rilis menjalankan check versi/config/dependensi-root yang ditargetkan;
- perubahan root/config yang tidak diketahui gagal secara aman ke semua jalur check.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit test langsung menjalankan dirinya sendiri, edit sumber memilih mapping eksplisit, lalu test saudara dan dependen import-graph. Config pengiriman group-room bersama adalah salah satu mapping eksplisit: perubahan pada config balasan terlihat grup, mode pengiriman balasan sumber, atau prompt sistem message-tool diarahkan melalui test balasan inti plus regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas pada harness sehingga set murah yang dipetakan bukan proxy tepercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan lebih utamakan box baru yang sudah dipanaskan untuk pembuktian luas. Sebelum memakai gate lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sinkronisasi yang besar secara tak terduga, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat saat file root wajib seperti `pnpm-lock.yaml` menghilang atau saat `git status --short` menunjukkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sinkronisasi jarak jauh bukan salinan PR yang tepercaya; hentikan box tersebut dan panaskan yang baru alih-alih men-debug kegagalan uji produk. Untuk PR dengan penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk proses sanity tersebut.

`pnpm testbox:run` juga menghentikan pemanggilan Blacksmith CLI lokal yang tetap berada dalam fase sinkronisasi selama lebih dari lima menit tanpa keluaran pascasinkronisasi. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard tersebut, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang sangat besar.

Crabbox adalah jalur remote-box kedua milik repo untuk pembuktian Linux saat Blacksmith tidak tersedia atau saat kapasitas cloud milik sendiri lebih disukai. Panaskan sebuah box, hidrasi melalui workflow proyek, lalu jalankan perintah melalui Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` memiliki default provider, sinkronisasi, dan hidrasi GitHub Actions. File tersebut mengecualikan `.git` lokal sehingga checkout Actions yang terhidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan object store lokal milik maintainer, serta mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, penyiapan Node/pnpm, pengambilan `origin/main`, dan handoff lingkungan non-rahasia yang kemudian di-source oleh perintah `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Channel pengembangan](/id/install/development-channels)
