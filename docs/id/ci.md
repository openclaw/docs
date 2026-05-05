---
read_when:
    - Anda perlu memahami mengapa suatu pekerjaan CI dijalankan atau tidak dijalankan
    - Anda sedang menelusuri masalah pada pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pengulangan validasi rilis
    - Anda mengubah pemicu ClawSweeper atau penerusan aktivitas GitHub
summary: Graf pekerjaan CI, gate cakupan, payung rilis, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-05T06:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan menonaktifkan lane yang mahal ketika hanya area yang tidak terkait berubah. Run `workflow_dispatch` manual sengaja melewati scoping cerdas dan menyebarkan seluruh grafik untuk kandidat rilis dan validasi luas. Lane Android tetap bersifat opt-in melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow [`Plugin Prerelease`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Full Release Validation`](#full-release-validation) atau dispatch manual eksplisit.

## Gambaran umum pipeline

| Job                              | Tujuan                                                                                                      | Kapan berjalan                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus dokumen, scope yang berubah, ekstensi yang berubah, dan membangun manifes CI    | Selalu pada push dan PR non-draft         |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                                     | Selalu pada push dan PR non-draft         |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisory npm                                              | Selalu pada push dan PR non-draft         |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                                      | Selalu pada push dan PR non-draft         |
| `check-dependencies`             | Pass khusus dependensi Knip produksi plus guard allowlist file tidak terpakai                               | Perubahan yang relevan dengan Node        |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak build, dan artefak hilir yang dapat digunakan ulang      | Perubahan yang relevan dengan Node        |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol                             | Perubahan yang relevan dengan Node        |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel tersharding dengan hasil pemeriksaan agregat yang stabil                        | Perubahan yang relevan dengan Node        |
| `checks-node-core-test`          | Shard pengujian Node inti, mengecualikan lane channel, bundled, contract, dan ekstensi                      | Perubahan yang relevan dengan Node        |
| `check`                          | Ekuivalen gate lokal utama tersharding: tipe produksi, lint, guard, tipe pengujian, dan smoke ketat         | Perubahan yang relevan dengan Node        |
| `check-additional`               | Arsitektur, drift boundary/prompt tersharding, guard ekstensi, package boundary, dan gateway watch          | Perubahan yang relevan dengan Node        |
| `build-smoke`                    | Uji smoke CLI yang sudah dibuild dan smoke memori startup                                                   | Perubahan yang relevan dengan Node        |
| `checks`                         | Verifier untuk pengujian channel artefak build                                                              | Perubahan yang relevan dengan Node        |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                                 | Dispatch CI manual untuk rilis            |
| `check-docs`                     | Pemformatan, lint, dan pemeriksaan tautan rusak untuk dokumentasi                                           | Dokumen berubah                           |
| `skills-python`                  | Ruff + pytest untuk Skills berbasis Python                                                                  | Perubahan yang relevan dengan Skills Python |
| `checks-windows`                 | Pengujian proses/path khusus Windows plus regresi specifier import runtime bersama                          | Perubahan yang relevan dengan Windows     |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artefak build bersama                                           | Perubahan yang relevan dengan macOS       |
| `macos-swift`                    | Swift lint, build, dan pengujian untuk aplikasi macOS                                                       | Perubahan yang relevan dengan macOS       |
| `android`                        | Pengujian unit Android untuk kedua flavor plus satu build APK debug                                         | Perubahan yang relevan dengan Android     |
| `test-performance-agent`         | Optimisasi pengujian lambat Codex harian setelah aktivitas tepercaya                                        | Keberhasilan CI utama atau dispatch manual |
| `openclaw-performance`           | Laporan performa runtime Kova harian/berdasarkan permintaan dengan lane mock-provider, deep-profile, dan GPT 5.4 live | Terjadwal dan dispatch manual             |

## Urutan fail-fast

1. `preflight` memutuskan lane mana yang benar-benar ada. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal dengan cepat tanpa menunggu job artefak dan matriks platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat agar konsumen hilir dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR yang sama atau ref `main`. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tergantikan. Kunci konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub di grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run suite penuh manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

## Scope dan perutean

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area berscope berubah.

- **Edit workflow CI** memvalidasi grafik CI Node plus linting workflow, tetapi tidak dengan sendirinya memaksa build native Windows, Android, atau macOS; lane platform tersebut tetap berscope pada perubahan sumber platform.
- **Edit khusus perutean CI, edit fixture core-test murah terpilih, dan edit helper/test-routing kontrak Plugin yang sempit** menggunakan path manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Path itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard inti penuh, shard bundled-plugin, dan matriks guard tambahan ketika perubahan terbatas pada permukaan perutean atau helper yang langsung diuji oleh tugas cepat tersebut.
- **Pemeriksaan Node Windows** dibatasi pada wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang menjalankan lane tersebut; perubahan sumber, Plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada di lane Node Linux.

Keluarga pengujian Node paling lambat dipisah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner secara berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, lane core unit fast/support berjalan terpisah, infrastruktur runtime inti dipisah antara shard state dan process/config, auto-reply berjalan sebagai worker seimbang (dengan subtree reply dipisah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi agentic gateway/server dipisah di seluruh lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artefak build. Pengujian browser luas, QA, media, dan Plugin lain-lain menggunakan konfigurasi Vitest khususnya alih-alih catch-all Plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan satu konfigurasi penuh dari shard terfilter. `check-additional` mempertahankan pekerjaan kompilasi/canary package-boundary bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar guard boundary distripe di empat shard matriks, masing-masing menjalankan guard independen terpilih secara bersamaan dan mencetak timing per pemeriksaan, termasuk `pnpm prompt:snapshots:check` sehingga drift prompt jalur sukses runtime Codex dipatok ke PR yang menyebabkannya. Gateway watch, pengujian channel, dan shard core support-boundary berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibuild.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membuild APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane pengujian unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipatok ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk install `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file tidak terpakai produksi Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak terpakai gagal ketika PR menambahkan file tidak terpakai baru yang belum direview atau meninggalkan entri allowlist yang usang, sambil mempertahankan permukaan Plugin dinamis, generated, build, live-test, dan bridge package yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow ini memiliki empat lane:

- `clawsweeper_item` untuk permintaan review issue dan pull request yang tepat;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit dalam komentar issue;
- `clawsweeper_commit_review` untuk permintaan review tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis event, aksi, aktor, repositori, nomor item, URL, judul, status, dan kutipan singkat untuk komentar atau review bila ada. Ini sengaja menghindari penerusan seluruh body webhook. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan hanya boleh memposting ke `#clawsweeper` ketika event tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise webhook duplikat, dan lalu lintas review normal seharusnya menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, body, teks review, nama branch, dan pesan commit GitHub sebagai data tidak tepercaya di seluruh path ini. Semua itu adalah input untuk peringkasan dan triage, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Pengiriman CI manual menjalankan grafik job yang sama seperti CI normal, tetapi memaksa setiap lane bercakupan non-Android aktif: shard Node Linux, shard bundled-plugin, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, build smoke, pemeriksaan docs, Skills Python, Windows, macOS, dan i18n Control UI. Pengiriman CI manual mandiri hanya menjalankan Android dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis Plugin, shard khusus rilis `agentic-plugins`, sweep batch extension penuh, dan lane Docker prarilis Plugin dikecualikan dari CI. Suite prarilis Docker hanya berjalan saat `Full Release Validation` mengirim workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Jalankan manual menggunakan grup concurrency unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik tersebut terhadap branch, tag, atau SHA commit lengkap sambil menggunakan file workflow dari ref pengiriman yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Pelaksana

| Pelaksana                        | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/bundled cepat, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifikator agregat pengujian Node, pemeriksaan docs, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat antre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard extension berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                            |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Node Linux, shard pengujian bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif CPU sehingga 8 vCPU menghabiskan lebih banyak biaya daripada penghematannya); build Docker install-smoke (waktu antre 32-vCPU menghabiskan lebih banyak biaya daripada penghematannya)                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork kembali ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork kembali ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |

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

`OpenClaw Performance` adalah workflow performa produk/runtime. Workflow ini berjalan harian pada `main` dan dapat dikirim secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Pengiriman manual biasanya melakukan benchmark pada ref workflow. Setel `target_ref` untuk melakukan benchmark tag rilis atau branch lain dengan implementasi workflow saat ini. Jalur laporan yang dipublikasikan dan pointer terbaru dikunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA workflow, ref Kova, profil, mode autentikasi lane, model, jumlah pengulangan, dan filter skenario.

Workflow menginstal OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan autentikasi kompatibel OpenAI palsu yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, gateway, dan agent-turn.
- `live-gpt54`: turn agen OpenAI `openai/gpt-5.4` nyata, dilewati saat `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah lintasan Kova: waktu boot Gateway dan memori pada kasus startup default, hook, dan 50-Plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; serta perintah startup CLI terhadap Gateway yang sudah diboot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundle laporan, dengan JSON mentah di sebelahnya.

Setiap lane mengunggah artefak GitHub. Saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, workflow juga meng-commit `report.json`, `report.md`, bundle, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer ref yang diuji saat ini ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow payung manual untuk "menjalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit lengkap, mengirim workflow `CI` manual dengan target tersebut, mengirim `Plugin Prerelease` untuk bukti Plugin/paket/statis/Docker khusus rilis, dan mengirim `OpenClaw Release Checks` untuk install smoke, penerimaan paket, pemeriksaan paket lintas-OS, paritas QA Lab, Matrix, dan lane Telegram. Run stable/default mempertahankan cakupan live/E2E menyeluruh dan jalur rilis Docker di balik `run_release_soak=true`; `release_profile=full` memaksa cakupan soak tersebut aktif agar validasi advisory yang luas tetap luas. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah publikasi, teruskan `npm_telegram_package_spec` untuk menjalankan ulang lane paket Telegram yang sama terhadap paket npm yang dipublikasikan.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama job workflow yang tepat, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah workflow rilis manual yang mengubah status. Kirim
dari `release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah preflight
npm OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`,
mengirim `Plugin NPM Release` untuk semua paket Plugin yang dapat dipublikasikan, mengirim
`Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru kemudian mengirim
`OpenClaw NPM Release` dengan `preflight_run_id` yang tersimpan.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Untuk bukti commit terpin pada branch yang bergerak cepat, gunakan helper, bukan
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref pengiriman workflow GitHub harus berupa branch atau tag, bukan SHA commit mentah. Helper
mendorong branch sementara `release-ci/<sha>-...` pada SHA target,
mengirim `Full Release Validation` dari ref terpin tersebut, memverifikasi setiap
`headSha` workflow anak cocok dengan target, dan menghapus branch sementara saat
run selesai. Verifikator payung juga gagal jika workflow anak mana pun berjalan pada
SHA yang berbeda.

`release_profile` mengontrol cakupan live/penyedia yang diteruskan ke pemeriksaan rilis. Alur kerja rilis manual secara default menggunakan `stable`; gunakan `full` hanya ketika Anda memang menginginkan matriks penyedia/media penasihat yang luas. `run_release_soak` mengontrol apakah pemeriksaan rilis stabil/default menjalankan soak live/E2E menyeluruh dan jalur rilis Docker; `full` memaksa soak aktif.

- `minimum` mempertahankan lane OpenAI/core paling cepat yang kritis untuk rilis.
- `stable` menambahkan set penyedia/backend stabil.
- `full` menjalankan matriks penyedia/media penasihat yang luas.

Umbrella mencatat id run turunan yang dikirim, dan job akhir `Verify full validation` memeriksa ulang kesimpulan run turunan saat ini serta menambahkan tabel job paling lambat untuk setiap run turunan. Jika alur kerja turunan dijalankan ulang dan menjadi hijau, jalankan ulang hanya job verifikator induk untuk menyegarkan hasil umbrella dan ringkasan waktu.

Untuk pemulihan, baik `Full Release Validation` maupun `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk turunan CI penuh normal, `plugin-prerelease` hanya untuk turunan prarilis Plugin, `release-checks` untuk setiap turunan rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada umbrella. Ini menjaga rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane lintas-OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah lintas-OS yang panjang memancarkan baris Heartbeat dan ringkasan packaged-upgrade menyertakan waktu per fase. Lane pemeriksaan rilis QA bersifat penasihat, sehingga kegagalan khusus QA memberi peringatan tetapi tidak memblokir verifikator pemeriksaan rilis.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk me-resolve ref yang dipilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke pemeriksaan lintas-OS dan Penerimaan Paket, ditambah alur kerja Docker jalur rilis live/E2E ketika cakupan soak berjalan. Ini menjaga byte paket tetap konsisten di seluruh kotak rilis dan menghindari pemaketan ulang kandidat yang sama di beberapa job turunan.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all` menggantikan umbrella yang lebih lama. Monitor induk membatalkan alur kerja turunan apa pun yang sudah dikirimkannya ketika induk dibatalkan, sehingga validasi main yang lebih baru tidak tertahan di belakang run pemeriksaan rilis lama selama dua jam. Validasi branch/tag rilis dan grup rerun terfokus mempertahankan `cancel-in-progress: false`.

## Shard live dan E2E

Turunan live/E2E rilis mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs`, bukan satu job serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- job `native-live-src-gateway-profiles` yang difilter penyedia
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard media audio/video terpisah dan shard musik yang difilter penyedia

Ini mempertahankan cakupan file yang sama sekaligus membuat kegagalan penyedia live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media native live berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh alur kerja `Live Media Runner Image`. Image itu memasang `ffmpeg` dan `ffprobe` sebelumnya; job media hanya memverifikasi biner sebelum setup. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job kontainer adalah tempat yang salah untuk meluncurkan pengujian Docker bersarang.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Alur kerja rilis live membangun dan mendorong image itu satu kali, lalu shard model live Docker, Gateway yang di-shard per penyedia, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` tingkat skrip yang eksplisit di bawah timeout job alur kerja sehingga kontainer atau jalur cleanup yang macet gagal cepat alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber lengkap secara independen, run rilis salah dikonfigurasi dan akan membuang waktu dinding untuk build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness E2E Docker yang sama yang dijalankan pengguna setelah instal atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, me-resolve satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref alur kerja, ref paket, versi, SHA-256, serta profil dalam ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Alur kerja reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker digest paket bila diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket itu alih-alih memaketkan checkout alur kerja. Ketika sebuah profil memilih beberapa `docker_lanes` tertarget, alur kerja reusable menyiapkan paket dan image bersama satu kali, lalu menyebarkan lane tersebut sebagai job Docker tertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan memasang artefak `package-under-test` yang sama ketika Penerimaan Paket me-resolve salah satunya; dispatch Telegram mandiri masih dapat memasang spec npm yang dipublikasikan.
4. `summary` menggagalkan alur kerja jika resolusi paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prarilis/stabil yang dipublikasikan.
- `source=ref` memaketkan branch, tag, atau SHA commit penuh `package_ref` yang tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, memasang dependensi di worktree terlepas, dan memaketkannya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode alur kerja/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dipaketkan ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika alur kerja lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — potongan jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan ulang artefak `package-under-test` dalam `NPM Telegram Beta E2E`, dengan jalur spec npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan khusus pengujian pembaruan dan Plugin, termasuk perintah lokal, lane Docker, input Penerimaan Paket, default rilis, dan triase kegagalan, lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Penerimaan Paket dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, pembaruan, cleanup dependensi Plugin usang, perbaikan instal Plugin terkonfigurasi, Plugin offline, pembaruan Plugin, dan bukti Telegram pada tarball paket yang sama yang sudah di-resolve. Tetapkan `package_acceptance_package_spec` pada Validasi Rilis Penuh atau Pemeriksaan Rilis OpenClaw untuk menjalankan matriks yang sama terhadap paket npm terkirim alih-alih artefak yang dibangun dari SHA. Pemeriksaan rilis lintas-OS masih mencakup onboarding, installer, dan perilaku platform yang spesifik OS; validasi produk paket/pembaruan harus dimulai dengan Penerimaan Paket. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run dalam jalur rilis yang memblokir. Dalam Penerimaan Paket, tarball `package-under-test` yang di-resolve selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline terpublikasi cadangan, default ke `openclaw@latest`; perintah rerun lane yang gagal mempertahankan baseline itu. Validasi Rilis Penuh dengan `run_release_soak=true` atau `release_profile=full` menetapkan `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas cakupan ke empat rilis npm stabil terbaru plus rilis batas kompatibilitas Plugin yang dipin dan fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, instalasi Plugin OpenClaw terkonfigurasi, jalur log tilde, dan root dependensi Plugin legacy yang usang. Pilihan survivor published-upgrade multi-baseline di-shard berdasarkan baseline ke job runner Docker tertarget terpisah. Alur kerja `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah cleanup pembaruan terpublikasi yang menyeluruh, bukan cakupan CI Validasi Rilis Penuh normal. Run agregat lokal dapat meneruskan spec paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane terpublikasi mengonfigurasi baseline dengan resep perintah `openclaw config set` yang sudah dipanggang, mencatat langkah resep dalam `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway mulai. Lane fresh terpaket dan installer Windows juga memverifikasi bahwa paket terinstal dapat mengimpor override kontrol browser dari jalur Windows absolut mentah. Smoke giliran agen lintas-OS OpenAI secara default menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika disetel, jika tidak `openai/gpt-5.4`, sehingga bukti instal dan Gateway tetap menggunakan model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Penerimaan Paket memiliki jendela kompatibilitas legacy terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui dalam `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke Plugin dapat membaca lokasi install-record legacy atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan record instal dan perilaku tanpa-instal-ulang tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memperingatkan file stempel metadata build lokal yang sudah dikirimkan. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama akan gagal, bukan memperingatkan atau melewati.

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

Saat men-debug proses package acceptance yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa run anak `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, waktu fase, dan perintah rerun. Utamakan menjalankan ulang profil paket yang gagal atau lane Docker yang persis sama, bukan menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Workflow `Install Smoke` terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifest plugin bawaan, atau permukaan plugin inti/channel/gateway/Plugin SDK yang diuji oleh job smoke Docker. Perubahan plugin bawaan yang hanya menyentuh sumber, perubahan hanya-test, dan perubahan hanya-dokumentasi tidak memesan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e gateway-network container, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker plugin bawaan terbatas di bawah batas waktu perintah agregat 240 detik (setiap Docker run skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan instalasi paket QR dan cakupan Docker/update installer untuk run terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instalasi paket QR, smoke Dockerfile/gateway root, smoke installer/update, dan E2E Docker plugin bawaan cepat sebagai job terpisah agar pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; saat logika changed-scope akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi malam atau rilis.

Smoke image-provider instalasi global Bun yang lambat diatur secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat ikut mengaktifkannya, tetapi pull request dan push `main` tidak. Test Docker QR dan installer mempertahankan Dockerfile yang berfokus pada instalasi miliknya sendiri.

## E2E Docker Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw satu kali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi rencana yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Talaan

| Variabel                               | Bawaan | Tujuan                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif provider.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live serentak agar provider tidak melakukan throttle.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instalasi npm serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda bertahap antar-mulai lane untuk menghindari lonjakan create daemon Docker; setel `0` untuk tanpa jeda. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Batas waktu fallback per lane (120 menit); lane live/tail terpilih menggunakan batas lebih ketat. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak rencana scheduler tanpa menjalankan lane.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agent dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya tetap dapat dimulai dari pool kosong, lalu berjalan sendiri hingga melepas kapasitas. Preflight agregat lokal memeriksa Docker, menghapus container E2E OpenClaw yang usang, memancarkan status lane aktif, menyimpan waktu lane untuk pengurutan terlama-dulu, dan secara bawaan berhenti menjadwalkan lane pool baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan kepada `scripts/test-docker-all.mjs --plan-json` paket, jenis image, image live, lane, dan cakupan kredensial mana yang diperlukan. `scripts/docker-e2e.mjs` lalu mengonversi rencana itu menjadi output dan ringkasan GitHub. Ia mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket current-run, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/functional bertag digest paket melalui cache layer Docker Blacksmith saat rencana memerlukan lane yang menginstal paket; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan batas waktu per upaya 180 detik yang terbatas agar stream registry/cache yang macet cepat dicoba ulang alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job ber-chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` agar setiap chunk hanya menarik jenis image yang dibutuhkannya dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer provider.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` saat cakupan release-path penuh memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane update bundled-channel mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, waktu, `summary.json`, `failures.json`, waktu fase, JSON rencana scheduler, tabel lane lambat, dan perintah rerun per lane. Input workflow `docker_lanes` menjalankan lane terpilih terhadap image yang sudah disiapkan alih-alih job chunk, sehingga debugging lane gagal tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk run tersebut; jika lane terpilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun itu. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan saat nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image yang persis sama dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, jadi ini adalah workflow terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri membuat suite tersebut tetap nonaktif. Ini menyeimbangkan test plugin bawaan di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch plugin yang berat impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis membatch lane Docker tertarget dalam grup kecil untuk menghindari pemesanan puluhan runner bagi job berdurasi satu hingga tiga menit.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow smart-scoped utama. Paritas agentic bertingkat di bawah harness QA dan rilis yang luas, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` saat paritas harus ikut dalam run validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan setiap malam di `main` dan pada dispatch manual; ia menyebarkan lane mock parity, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan provider mock deterministik dan model berkualifikasi mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup plugin provider normal. Gateway transport live menonaktifkan pencarian memori karena QA parity mencakup perilaku memori secara terpisah; konektivitas provider dicakup oleh suite model live, provider native, dan provider Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya saat CLI yang di-checkout mendukungnya. Bawaan CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu men-shard cakupan Matrix penuh ke job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate QA parity-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/pemeriksaan sesuai cakupan alih-alih memperlakukan parity sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja dibuat sebagai pemindai keamanan tahap awal yang sempit, bukan penyisiran penuh repositori. Jalankan penjaga pull request harian, manual, dan non-draf untuk memindai kode workflow Actions serta permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Penjaga pull request tetap ringan: ia hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti workflow terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, rahasia, sandbox, cron, dan baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti plus runtime Plugin channel, Gateway, Plugin SDK, rahasia, titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan SSRF inti, parsing IP, penjaga jaringan, web-fetch, dan kebijakan SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gate eksekusi tool agen                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifest, registry, instalasi package-manager, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh workflow sanity. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan pasangannya. Ia hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error pada permukaan bernilai tinggi yang sempit di runner Blacksmith Linux yang lebih kecil. Penjaga pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draf hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang cocok untuk perubahan kode eksekusi perintah/model/tool agen dan dispatch balasan, kode skema/migrasi/IO konfigurasi, kode auth/rahasia/sandbox/keamanan, runtime channel inti dan Plugin channel bawaan, protokol Gateway/metode server, runtime memori/perekat SDK, MCP/proses/pengiriman keluar, runtime provider/katalog model, diagnostik sesi/antrean pengiriman, loader Plugin, kontrak Plugin SDK/paket, atau runtime balasan Plugin SDK. Perubahan konfigurasi CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Permukaan                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, rahasia, sandbox, cron, dan kode boundary keamanan gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema konfigurasi, migrasi, normalisasi, dan IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan Plugin channel bawaan                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Eksekusi perintah, dispatch model/provider, dispatch dan antrean balasan otomatis, serta kontrak runtime control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge tool, helper supervisi proses, serta kontrak pengiriman keluar                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, facade runtime memori, alias Plugin SDK memori, perekat aktivasi runtime memori, dan perintah doctor memori                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundel event/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, serta registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, persistensi lokal, alur kontrol Gateway, dan kontrak runtime control-plane tugas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime web fetch/search inti, IO media, pemahaman media, pembuatan gambar, dan pembuatan media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket plugin                                                                                      |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan Plugin bawaan harus ditambahkan kembali sebagai pekerjaan lanjutan yang tercakup atau di-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Workflow pemeliharaan

### Docs Agent

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru mendarat. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Invokasi workflow-run dilewati saat `main` sudah bergerak maju atau saat run Docs Agent non-dilewati lain dibuat dalam satu jam terakhir. Saat berjalan, ia meninjau rentang commit dari SHA sumber Docs Agent non-dilewati sebelumnya ke `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terakumulasi sejak pass dokumen terakhir.

### Test Performance Agent

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk pengujian lambat. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, tetapi ia dilewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC itu. Dispatch manual melewati gate aktivitas harian tersebut. Lane ini membangun laporan performa Vitest full-suite yang dikelompokkan, mengizinkan Codex hanya membuat perbaikan performa pengujian kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah baseline pengujian yang lulus. Jika baseline memiliki pengujian yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lulus sebelum apa pun di-commit. Saat `main` maju sebelum push bot mendarat, lane ini me-rebase patch yang tervalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch basi yang berkonflik dilewati. Ia menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti agen dokumen.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat pasca-mendarat. Default-nya adalah dry-run dan hanya menutup PR yang dicantumkan secara eksplisit saat `apply=true`. Sebelum memutasi GitHub, ia memverifikasi bahwa PR yang mendarat sudah di-merge dan bahwa setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gate pemeriksaan lokal itu lebih ketat tentang boundary arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan pengujian inti plus lint/guard inti;
- perubahan khusus pengujian inti hanya menjalankan typecheck pengujian inti plus lint inti;
- perubahan produksi extension menjalankan typecheck prod extension dan pengujian extension plus lint extension;
- perubahan khusus pengujian extension menjalankan typecheck pengujian extension plus lint extension;
- perubahan Plugin SDK publik atau kontrak plugin meluas ke typecheck extension karena extension bergantung pada kontrak inti tersebut (penyisiran extension Vitest tetap merupakan pekerjaan pengujian eksplisit);
- bump versi khusus metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang ditargetkan;
- perubahan root/konfigurasi yang tidak diketahui gagal aman ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit pengujian langsung menjalankan dirinya sendiri, edit sumber lebih memilih pemetaan eksplisit, lalu pengujian sibling dan dependent import-graph. Konfigurasi pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada konfigurasi balasan yang terlihat grup, mode pengiriman balasan sumber, atau route prompt sistem message-tool melewati pengujian balasan inti plus regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya saat perubahan cukup seluas harness sehingga set murah yang dipetakan bukan proxy yang dapat dipercaya.

## Validasi Testbox

Jalankan Testbox dari akar repo dan utamakan box baru yang sudah dipersiapkan untuk pembuktian luas. Sebelum menghabiskan gate lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sinkronisasi yang besarnya tidak terduga, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan kewarasan gagal cepat ketika file akar yang wajib ada seperti `pnpm-lock.yaml` hilang atau ketika `git status --short` menampilkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sinkronisasi jarak jauh bukan salinan PR yang dapat dipercaya; hentikan box tersebut dan siapkan box baru alih-alih men-debug kegagalan pengujian produk. Untuk PR penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk pemeriksaan kewarasan tersebut.

`pnpm testbox:run` juga menghentikan pemanggilan CLI Blacksmith lokal yang bertahan di fase sinkronisasi selama lebih dari lima menit tanpa keluaran pascasinkronisasi. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard tersebut, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang sangat besar.

Crabbox adalah pembungkus box jarak jauh milik repo untuk pembuktian Linux maintainer. Gunakan ketika pemeriksaan terlalu luas untuk loop edit lokal, ketika paritas CI penting, atau ketika pembuktian membutuhkan rahasia, Docker, lane paket, box yang dapat digunakan ulang, atau log jarak jauh. Backend OpenClaw normal adalah `blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah fallback untuk gangguan Blacksmith, masalah kuota, atau pengujian kapasitas milik sendiri secara eksplisit.

Sebelum menjalankan pertama kali, periksa pembungkus dari akar repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Pembungkus repo menolak biner Crabbox yang usang dan tidak mengiklankan `blacksmith-testbox`. Teruskan provider secara eksplisit meskipun `.crabbox.yaml` memiliki default owned-cloud.

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

Pengulangan pengujian terfokus:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Baca ringkasan JSON akhir. Field yang berguna adalah `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Eksekusi Crabbox sekali jalan yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis; jika eksekusi terinterupsi atau pembersihan tidak jelas, periksa box aktif dan hentikan hanya box yang Anda buat:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Gunakan penggunaan ulang hanya ketika Anda sengaja membutuhkan beberapa perintah pada box terhidrasi yang sama:

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

Eskalasi ke kapasitas Crabbox milik sendiri hanya ketika Blacksmith sedang down, dibatasi kuota, tidak memiliki lingkungan yang dibutuhkan, atau kapasitas milik sendiri secara eksplisit menjadi tujuannya:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` mengatur default provider, sinkronisasi, dan hidrasi GitHub Actions untuk lane owned-cloud. File ini mengecualikan `.git` lokal sehingga checkout Actions yang terhidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan penyimpanan objek lokal maintainer, dan mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` mengatur checkout, penyiapan Node/pnpm, pengambilan `origin/main`, dan handoff lingkungan non-rahasia untuk perintah owned-cloud `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Channel pengembangan](/id/install/development-channels)
