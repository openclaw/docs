---
read_when:
    - Anda perlu memahami mengapa suatu tugas CI dijalankan atau tidak dijalankan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pengulangan pelaksanaan validasi rilis
    - Anda sedang mengubah dispatch ClawSweeper atau penerusan aktivitas GitHub
summary: Graf tugas CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur CI
x-i18n:
    generated_at: "2026-05-07T13:13:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan menonaktifkan lane yang mahal saat hanya area yang tidak terkait yang berubah. Run `workflow_dispatch` manual sengaja melewati smart scoping dan menyebarkan seluruh graf untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow [`Plugin Pra-rilis`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Validasi Rilis Penuh`](#full-release-validation) atau dispatch manual eksplisit.

## Ikhtisar pipeline

| Job                              | Tujuan                                                                                                   | Kapan berjalan                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Mendeteksi perubahan docs-only, cakupan yang berubah, ekstensi yang berubah, dan membangun manifes CI                   | Selalu pada push dan PR non-draft |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                                     | Selalu pada push dan PR non-draft |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisory npm                                          | Selalu pada push dan PR non-draft |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                             | Selalu pada push dan PR non-draft |
| `check-dependencies`             | Pass produksi Knip khusus dependensi plus guard allowlist file yang tidak digunakan                                 | Perubahan yang relevan dengan Node              |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak hasil build, dan artefak downstream yang dapat digunakan ulang                       | Perubahan yang relevan dengan Node              |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol                              | Perubahan yang relevan dengan Node              |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat stabil                                      | Perubahan yang relevan dengan Node              |
| `checks-node-core-test`          | Shard pengujian inti Node, mengecualikan lane channel, bundled, contract, dan ekstensi                          | Perubahan yang relevan dengan Node              |
| `check`                          | Padanan gate lokal utama yang di-shard: tipe prod, lint, guard, tipe pengujian, dan smoke ketat                | Perubahan yang relevan dengan Node              |
| `check-additional`               | Arsitektur, boundary/prompt drift yang di-shard, guard ekstensi, boundary paket, dan gateway watch        | Perubahan yang relevan dengan Node              |
| `build-smoke`                    | Pengujian smoke CLI hasil build dan smoke memori startup                                                            | Perubahan yang relevan dengan Node              |
| `checks`                         | Verifier untuk pengujian channel artefak hasil build                                                                 | Perubahan yang relevan dengan Node              |
| `checks-node-compat-node22`      | Lane build kompatibilitas Node 22 dan smoke                                                                | Dispatch CI manual untuk rilis    |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan broken-link                                                             | Docs berubah                       |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                                    | Perubahan yang relevan dengan skill Python      |
| `checks-windows`                 | Pengujian proses/path khusus Windows plus regresi penentu import runtime bersama                      | Perubahan yang relevan dengan Windows           |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artefak hasil build bersama                                               | Perubahan yang relevan dengan macOS             |
| `macos-swift`                    | Swift lint, build, dan pengujian untuk aplikasi macOS                                                            | Perubahan yang relevan dengan macOS             |
| `android`                        | Pengujian unit Android untuk kedua flavor plus satu build APK debug                                              | Perubahan yang relevan dengan Android           |
| `test-performance-agent`         | Optimisasi pengujian lambat harian Codex setelah aktivitas tepercaya                                                 | CI main berhasil atau dispatch manual |
| `openclaw-performance`           | Laporan performa runtime Kova harian/sesuai permintaan dengan lane mock-provider, deep-profile, dan live GPT 5.4 | Terjadwal dan dispatch manual      |

## Urutan fail-fast

1. `preflight` memutuskan lane mana yang benar-benar ada. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job matriks artefak dan platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tersusul sebagai `cancelled` saat push yang lebih baru masuk ke PR atau ref `main` yang sama. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tersusul. Kunci concurrency CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

Job `ci-timings-summary` mengunggah artefak ringkas `ci-timings-summary` untuk setiap run CI non-draft. Artefak ini mencatat waktu wall, waktu antrean, job paling lambat, dan job gagal untuk run saat ini, sehingga pemeriksaan kesehatan CI tidak perlu mengambil payload Actions penuh berulang kali.

## Cakupan dan routing

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area bercakupan berubah.

- **Edit workflow CI** memvalidasi graf CI Node plus linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap dicakup ke perubahan source platform.
- **Edit khusus routing CI, edit fixture core-test murah tertentu, dan edit helper/test-routing kontrak Plugin yang sempit** menggunakan path manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Path itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard core penuh, shard bundled-plugin, dan matriks guard tambahan saat perubahan terbatas pada permukaan routing atau helper yang langsung diuji oleh tugas cepat tersebut.
- **Pemeriksaan Node Windows** dicakup ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang menjalankan lane itu; perubahan source, Plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada di lane Linux Node.

Keluarga pengujian Node paling lambat dipisah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner secara berlebihan: kontrak channel berjalan sebagai tiga shard berbobot berbasis Blacksmith dengan fallback runner GitHub standar, lane core unit fast/support berjalan terpisah, infra runtime core dipisah antara shard state, process/config, cron, dan shared, auto-reply berjalan sebagai worker seimbang (dengan subtree reply dipisah menjadi shard agent-runner, dispatch, dan commands/state-routing), serta konfigurasi agentic gateway/server dipisah ke lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artefak hasil build. Pengujian browser, QA, media, dan Plugin miscellaneous yang luas menggunakan konfigurasi Vitest khususnya alih-alih catch-all Plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard yang difilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar guard boundary di-striping ke empat shard matriks, masing-masing menjalankan guard independen terpilih secara bersamaan dan mencetak timing per pemeriksaan. Pemeriksaan drift snapshot prompt happy-path Codex yang mahal berjalan sebagai job tambahan sendiri untuk CI manual dan hanya untuk perubahan yang memengaruhi prompt, sehingga perubahan Node normal yang tidak terkait tidak menunggu generasi snapshot prompt dingin dan shard boundary tetap seimbang sementara prompt drift tetap dipatok ke PR yang menyebabkannya; flag yang sama melewati generasi Vitest snapshot prompt di dalam shard support-boundary core artefak hasil build. Gateway watch, pengujian channel, dan shard support-boundary core berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane unit-test-nya tetap mengompilasi flavor dengan flag SMS/call-log BuildConfig, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass produksi Knip khusus dependensi yang dipatok ke versi Knip terbaru, dengan minimum release age pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file produksi tidak digunakan dari Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak digunakan gagal saat PR menambahkan file tidak digunakan baru yang belum ditinjau atau meninggalkan entri allowlist usang, sambil mempertahankan permukaan Plugin dinamis, generated, build, live-test, dan bridge paket yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau menjalankan kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow memiliki empat lane:

- `clawsweeper_item` untuk permintaan review issue dan pull request yang tepat;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit dalam komentar issue;
- `clawsweeper_commit_review` untuk permintaan review tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: tipe event, action, actor, repository, nomor item, URL, judul, state, dan cuplikan pendek untuk komentar atau review jika ada. Lane ini sengaja menghindari penerusan body webhook penuh. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan hanya boleh memposting ke `#clawsweeper` saat event mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise webhook duplikat, dan traffic review normal harus menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, isi, teks ulasan, nama branch, dan pesan commit GitHub sebagai data yang tidak tepercaya di seluruh path ini. Semua itu adalah masukan untuk peringkasan dan triase, bukan instruksi untuk workflow atau runtime agent.

## Dispatch Manual

Dispatch CI manual menjalankan grafik job yang sama seperti CI normal tetapi memaksa setiap lane berscope non-Android aktif: shard Linux Node, shard bundled-plugin, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Python skills, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android saja dengan `include_android=true`; umbrella rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis Plugin, shard khusus rilis `agentic-plugins`, sweep batch extension penuh, dan lane Docker prarilis Plugin dikecualikan dari CI. Suite prarilis Docker hanya berjalan ketika `Full Release Validation` men-dispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup konkurensi unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh push atau run PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik tersebut terhadap branch, tag, atau SHA commit lengkap sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/bundled cepat, pemeriksaan kontrak channel bershard, shard `check` kecuali lint, agregat `check-additional`, verifier agregat pengujian Node, pemeriksaan docs, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang dihosting GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard extension berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Linux Node, shard pengujian bundled Plugin, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif CPU sehingga 8 vCPU lebih mahal daripada penghematan yang diberikannya); build Docker install-smoke (biaya waktu antre 32-vCPU lebih besar daripada penghematannya)                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

CI repo kanonis mempertahankan Blacksmith sebagai path runner default. Selama `preflight`, `scripts/ci-runner-labels.mjs` memeriksa run Actions terbaru yang sedang mengantre dan berjalan untuk job Blacksmith yang mengantre. Jika label Blacksmith tertentu sudah memiliki job yang mengantre, job downstream yang akan menggunakan label persis itu fallback ke runner yang dihosting GitHub yang sesuai (`ubuntu-24.04`, `windows-2025`, atau `macos-latest`) hanya untuk run tersebut. Ukuran Blacksmith lain dalam keluarga OS yang sama tetap memakai label utama masing-masing. Jika probe API gagal, fallback tidak diterapkan.

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

## Kinerja OpenClaw

`OpenClaw Performance` adalah workflow kinerja produk/runtime. Workflow ini berjalan harian pada `main` dan dapat di-dispatch secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch manual biasanya membenchmark ref workflow. Tetapkan `target_ref` untuk membenchmark tag rilis atau branch lain dengan implementasi workflow saat ini. Path laporan yang dipublikasikan dan pointer terbaru dikunci oleh ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA workflow, ref Kova, profil, mode auth lane, model, jumlah pengulangan, dan filter skenario.

Workflow menginstal OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan auth kompatibel OpenAI palsu yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, Gateway, dan agent-turn.
- `live-gpt54`: turn agent OpenAI `openai/gpt-5.4` nyata, dilewati ketika `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah pass Kova: timing boot Gateway dan memori pada kasus startup default, hook, dan 50-Plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; dan perintah startup CLI terhadap Gateway yang sudah diboot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundle laporan, dengan JSON mentah di sebelahnya.

Setiap lane mengunggah artefak GitHub. Ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, workflow juga meng-commit `report.json`, `report.md`, bundle, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer ref teruji saat ini ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow umbrella manual untuk "menjalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit lengkap, men-dispatch workflow `CI` manual dengan target tersebut, men-dispatch `Plugin Prerelease` untuk bukti Plugin/package/statis/Docker khusus rilis, dan men-dispatch `OpenClaw Release Checks` untuk install smoke, penerimaan package, pemeriksaan package lintas OS, paritas QA Lab, Matrix, dan lane Telegram. Run stabil/default mempertahankan cakupan live/E2E dan path rilis Docker yang lengkap di balik `run_release_soak=true`; `release_profile=full` memaksa cakupan soak tersebut aktif agar validasi advisory luas tetap luas. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah publikasi, teruskan `npm_telegram_package_spec` untuk menjalankan ulang lane package Telegram yang sama terhadap package npm yang sudah dipublikasikan.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks stage, nama job workflow persis, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah workflow rilis manual yang memutasi. Dispatch workflow ini
dari `release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah preflight
npm OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`,
men-dispatch `Plugin NPM Release` untuk semua package Plugin yang dapat dipublikasikan, men-dispatch
`Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru setelah itu men-dispatch
`OpenClaw NPM Release` dengan `preflight_run_id` yang tersimpan.

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
run selesai. Verifier payung juga gagal jika ada workflow turunan yang berjalan pada
SHA berbeda.

`release_profile` mengontrol cakupan live/provider yang diteruskan ke pemeriksaan rilis. Workflow
rilis manual default ke `stable`; gunakan `full` hanya ketika Anda
secara sengaja menginginkan matriks provider/media advisory yang luas. `run_release_soak`
mengontrol apakah pemeriksaan rilis stable/default menjalankan live/E2E lengkap dan
soak jalur rilis Docker; `full` memaksa soak aktif.

- `minimum` mempertahankan lane OpenAI/core tercepat yang kritis untuk rilis.
- `stable` menambahkan kumpulan provider/backend stabil.
- `full` menjalankan matriks provider/media advisory yang luas.

Payung mencatat id run turunan yang di-dispatch, dan job akhir `Verify full validation` memeriksa ulang kesimpulan run turunan saat ini serta menambahkan tabel job terlambat untuk setiap run turunan. Jika workflow turunan dijalankan ulang dan menjadi hijau, jalankan ulang hanya job verifier induk untuk menyegarkan hasil payung dan ringkasan waktu.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk turunan CI penuh normal, `plugin-prerelease` hanya untuk turunan prarilis Plugin, `release-checks` untuk setiap turunan rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane lintas-OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah lintas-OS yang panjang memancarkan baris heartbeat dan ringkasan packaged-upgrade menyertakan waktu per fase. Lane pemeriksaan rilis QA bersifat advisory, sehingga kegagalan hanya-QA memberi peringatan tetapi tidak memblokir verifier pemeriksaan rilis.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref yang dipilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke pemeriksaan lintas-OS dan Penerimaan Paket, ditambah workflow Docker jalur rilis live/E2E saat cakupan soak berjalan. Ini menjaga byte paket tetap konsisten di seluruh kotak rilis dan menghindari pengemasan ulang kandidat yang sama di beberapa job turunan.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan payung yang lebih lama. Monitor induk membatalkan workflow turunan apa pun yang
sudah di-dispatch saat induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang run pemeriksaan rilis lama selama dua jam. Validasi branch/tag
rilis dan grup rerun terfokus menjaga `cancel-in-progress: false`.

## Shard Live dan E2E

Turunan live/E2E rilis mempertahankan cakupan `pnpm test:live` native yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs` alih-alih satu job serial:

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

Ini mempertahankan cakupan file yang sama sambil membuat kegagalan provider live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, dibangun oleh workflow `Live Media Runner Image`. Image tersebut sudah menginstal `ffmpeg` dan `ffprobe`; job media hanya memverifikasi biner sebelum penyiapan. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job container bukan tempat yang tepat untuk meluncurkan pengujian Docker bersarang.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Workflow rilis live membangun dan mendorong image tersebut satu kali, lalu shard model live Docker, gateway yang dishard berdasarkan provider, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` tingkat skrip eksplisit di bawah timeout job workflow agar container atau jalur pembersihan yang macet cepat gagal alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah dikonfigurasi dan akan membuang waktu dinding pada build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` saat pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness Docker E2E yang sama yang digunakan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref workflow, ref paket, versi, SHA-256, dan profil di ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker package-digest saat diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket itu alih-alih mengemas checkout workflow. Saat profil memilih beberapa `docker_lanes` tertarget, workflow reusable menyiapkan paket dan image bersama satu kali, lalu menyebarkan lane tersebut sebagai job Docker tertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan saat `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama saat Penerimaan Paket menyelesaikan satu; dispatch Telegram mandiri tetap dapat menginstal spec npm yang sudah diterbitkan.
4. `summary` menggagalkan workflow jika penyelesaian paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber Kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prarilis/stabil yang sudah diterbitkan.
- `source=ref` mengemas branch, tag, atau SHA commit penuh `package_ref` tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, menginstal dependensi di worktree terlepas, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Jaga `workflow_ref` dan `package_ref` tetap terpisah. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas saat `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil Suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` ditambah `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — potongan jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib saat `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang diterbitkan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan kembali artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spec npm yang diterbitkan tetap tersedia untuk dispatch mandiri.

Untuk kebijakan pengujian pembaruan dan Plugin khusus, termasuk perintah lokal,
lane Docker, input Penerimaan Paket, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Penerimaan Paket dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, pembaruan, pembersihan dependensi Plugin usang, perbaikan instalasi Plugin terkonfigurasi, Plugin offline, pembaruan Plugin, dan bukti Telegram pada tarball paket terselesaikan yang sama. Atur `package_acceptance_package_spec` pada Full Release Validation atau OpenClaw Release Checks untuk menjalankan matriks yang sama terhadap paket npm yang sudah dikirim alih-alih artefak yang dibangun dari SHA. Pemeriksaan rilis lintas-OS tetap mencakup onboarding, installer, dan perilaku platform spesifik OS; validasi produk paket/pembaruan harus dimulai dengan Penerimaan Paket. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang diterbitkan per run di jalur rilis pemblokir. Dalam Penerimaan Paket, tarball `package-under-test` yang diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline diterbitkan cadangan, default ke `openclaw@latest`; perintah rerun lane gagal mempertahankan baseline itu. Full Release Validation dengan `run_release_soak=true` atau `release_profile=full` menetapkan `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas ke empat rilis npm stabil terbaru ditambah rilis batas kompatibilitas Plugin yang dipin dan fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, instalasi Plugin OpenClaw terkonfigurasi, jalur log tilde, dan root dependensi Plugin lama yang usang. Pilihan survivor published-upgrade multi-baseline dishard berdasarkan baseline menjadi job runner Docker tertarget terpisah. Workflow `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` saat pertanyaannya adalah pembersihan pembaruan diterbitkan yang lengkap, bukan cakupan CI Rilis Penuh normal. Run agregat lokal dapat meneruskan spec paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane diterbitkan mengonfigurasi baseline dengan resep perintah `openclaw config set` bawaan, mencatat langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway dimulai. Lane fresh paket dan installer Windows juga memverifikasi bahwa paket terinstal dapat mengimpor override kontrol browser dari jalur Windows absolut mentah. Smoke giliran agen lintas-OS OpenAI default ke `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat diatur, jika tidak `openai/gpt-5.4`, sehingga bukti instalasi dan gateway tetap pada model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas lama

Package Acceptance memiliki jendela kompatibilitas lama yang terbatas untuk paket yang sudah diterbitkan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, boleh menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui di `dist/postinstall-inventory.json` boleh mengarah ke file yang dihilangkan dari tarball;
- `doctor-switch` boleh melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` boleh memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan boleh mencatat `update.channel` tersimpan yang hilang;
- smoke plugin boleh membaca lokasi install-record lama atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` boleh mengizinkan migrasi metadata konfigurasi sambil tetap mensyaratkan install record dan perilaku tanpa-instal-ulang tetap tidak berubah.

Paket `2026.4.26` yang diterbitkan juga boleh memperingatkan untuk file stempel metadata build lokal yang sudah dikirimkan. Paket berikutnya harus memenuhi kontrak modern; kondisi yang sama akan gagal, bukan memperingatkan atau dilewati.

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

Saat men-debug run package acceptance yang gagal, mulai dari ringkasan `resolve_package` untuk memastikan sumber paket, versi, dan SHA-256. Lalu periksa run anak `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Utamakan menjalankan ulang profil paket yang gagal atau lane Docker persisnya, bukan menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Alur kerja `Install Smoke` terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Alur ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh surface Docker/paket, perubahan paket/manifes plugin bawaan, atau surface Plugin SDK plugin/channel/gateway/core yang diuji oleh job smoke Docker. Perubahan plugin bawaan yang hanya source, edit yang hanya test, dan edit yang hanya docs tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root sekali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e container gateway-network, memverifikasi argumen build ekstensi bawaan, dan menjalankan profil Docker plugin bawaan terbatas di bawah timeout perintah agregat 240 detik (setiap run Docker skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan instalasi paket QR dan cakupan Docker/update installer untuk run terjadwal nightly, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh surface installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instalasi paket QR, smoke Dockerfile/gateway root, smoke installer/update, dan E2E Docker plugin bawaan cepat sebagai job terpisah supaya pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk merge commit) tidak memaksa jalur penuh; ketika logika changed-scope akan meminta cakupan penuh pada push, alur kerja mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi nightly atau rilis.

Smoke image-provider instalasi global Bun yang lambat di-gate secara terpisah oleh `run_bun_global_install_smoke`. Smoke ini berjalan pada jadwal nightly dan dari alur kerja pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat ikut menyertakannya, tetapi pull request dan push `main` tidak. Test Docker QR dan installer mempertahankan Dockerfile mereka sendiri yang berfokus pada instalasi.

## Docker E2E Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengepak OpenClaw sekali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi plan yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parameter yang dapat disetel

| Variabel                               | Default | Tujuan                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot main-pool untuk lane normal.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap provider.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live bersamaan agar provider tidak melakukan throttle.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instalasi npm bersamaan.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service bersamaan.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antar-mulai lane untuk menghindari lonjakan create daemon Docker; setel `0` untuk tanpa jeda.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per-lane (120 menit); lane live/tail terpilih menggunakan batas yang lebih ketat.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak plan scheduler tanpa menjalankan lane.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agen dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat dari batas efektifnya tetap dapat dimulai dari pool kosong, lalu berjalan sendiri hingga melepaskan kapasitas. Preflight agregat lokal memeriksa Docker, menghapus container OpenClaw E2E usang, mengeluarkan status lane aktif, mempertahankan timing lane untuk pengurutan terlama-dulu, dan secara default berhenti menjadwalkan lane pooled baru setelah kegagalan pertama.

### Alur kerja live/E2E yang dapat digunakan ulang

Alur kerja live/E2E yang dapat digunakan ulang menanyakan kepada `scripts/test-docker-all.mjs --plan-json` paket, jenis image, image live, lane, dan cakupan kredensial apa yang diperlukan. `scripts/docker-e2e.mjs` lalu mengonversi plan itu menjadi output dan ringkasan GitHub. Alur ini mengepak OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket current-run, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image Docker E2E GHCR bare/functional bertag digest paket melalui cache layer Docker Blacksmith ketika plan membutuhkan lane package-installed; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang ada, bukan membangun ulang. Pull image Docker dicoba ulang dengan timeout 180 detik per upaya yang terbatas, sehingga stream registry/cache yang macet dicoba ulang dengan cepat, bukan menghabiskan sebagian besar critical path CI.

### Potongan jalur rilis

Cakupan Docker rilis menjalankan job yang dipecah lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap potongan hanya menarik jenis image yang dibutuhkannya dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Potongan Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer provider.

OpenWebUI digabungkan ke `plugins-runtime-services` ketika cakupan release-path penuh memintanya, dan mempertahankan potongan `openwebui` mandiri hanya untuk dispatch khusus OpenWebUI. Lane update channel bawaan mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap potongan mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON plan scheduler, tabel slow-lane, dan perintah rerun per-lane. Input `docker_lanes` alur kerja menjalankan lane yang dipilih terhadap image yang disiapkan alih-alih job potongan, sehingga debugging lane gagal tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk run tersebut; jika lane yang dipilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun itu. Perintah rerun GitHub per-lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan ketika nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Alur kerja live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, jadi ini adalah alur kerja terpisah yang didispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri tidak mengaktifkan suite tersebut. Alur ini menyeimbangkan test plugin bawaan di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch plugin yang berat impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis mengelompokkan lane Docker tertarget dalam grup kecil untuk menghindari pencadangan puluhan runner bagi job berdurasi satu hingga tiga menit.

## QA Lab

QA Lab memiliki lane CI khusus di luar alur kerja smart-scoped utama. Paritas agentic disarangkan di bawah harness QA dan rilis yang luas, bukan alur kerja PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus ikut dengan run validasi yang luas.

- Alur kerja `QA-Lab - All Lanes` berjalan nightly pada `main` dan pada dispatch manual; alur ini mem-fan out lane paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport langsung Matrix dan Telegram dengan penyedia tiruan deterministik dan model berkualifikasi tiruan (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak saluran terisolasi dari latensi model langsung dan startup provider-plugin normal. Gateway transport langsung menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh suite model langsung, penyedia native, dan penyedia Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, dengan menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu memecah cakupan Matrix penuh menjadi job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke dalam job laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/pemeriksaan yang terscoped alih-alih memperlakukan paritas sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja merupakan pemindai keamanan lintasan pertama yang sempit, bukan sapuan repositori penuh. Run guard harian, manual, dan pull request non-draft memindai kode workflow Actions plus permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Guard pull request tetap ringan: guard ini hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti workflow terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, rahasia, sandbox, cron, dan baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi saluran inti plus runtime plugin saluran, gateway, Plugin SDK, rahasia, titik sentuh audit                    |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan SSRF inti, parsing IP, penjaga jaringan, web-fetch, dan kebijakan SSRF Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gate eksekusi alat agen                                                 |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifes, registry, instalasi package-manager, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Shard ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error pada permukaan bernilai tinggi yang sempit di runner Blacksmith Linux yang lebih kecil. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draft hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk perubahan kode eksekusi perintah/model/alat agen dan dispatch balasan, kode skema/migrasi/IO config, kode auth/rahasia/sandbox/keamanan, runtime saluran inti dan plugin saluran terbundel, protokol/metode-server gateway, perekat runtime/SDK memori, MCP/proses/pengiriman keluar, runtime penyedia/katalog model, diagnostik sesi/antrian pengiriman, loader plugin, Plugin SDK/kontrak-paket, atau runtime balasan Plugin SDK. Perubahan config CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Permukaan                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan auth, rahasia, sandbox, cron, dan gateway                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema config, migrasi, normalisasi, dan IO                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi saluran inti dan plugin saluran terbundel                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi perintah, dispatch model/penyedia, dispatch dan antrian balasan otomatis, serta control-plane ACP                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan jembatan alat, helper supervisi proses, dan kontrak pengiriman keluar                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, facade runtime memori, alias Plugin SDK memori, perekat aktivasi runtime memori, dan perintah doctor memori                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrian balasan, antrian pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundle event/log diagnostik, dan kontrak CLI doctor sesi     |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan saluran, antrian pengiriman, dan helper binding sesi/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery penyedia, registrasi runtime penyedia, default/katalog penyedia, dan registry web/search/fetch/embedding           |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol gateway, dan kontrak runtime control-plane tugas                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, pembuatan gambar, dan pembuatan media                                                          |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang diterbitkan dan helper kontrak paket plugin                                                                                     |

Kualitas tetap terpisah dari keamanan sehingga temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan plugin terbundel harus ditambahkan kembali sebagai pekerjaan lanjutan yang terscoped atau dishard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Workflow pemeliharaan

### Docs Agent

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga docs yang ada tetap selaras dengan perubahan yang baru saja masuk. Workflow ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Invokasi workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-dilewati lainnya dibuat dalam satu jam terakhir. Saat berjalan, workflow ini meninjau rentang commit dari SHA sumber Docs Agent non-dilewati sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pass docs terakhir.

### Test Performance Agent

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk pengujian lambat. Workflow ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, tetapi dilewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gate aktivitas harian tersebut. Lane ini membuat laporan performa Vitest terkelompok untuk suite penuh, mengizinkan Codex hanya membuat perbaikan performa pengujian kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan suite penuh dan menolak perubahan yang mengurangi jumlah pengujian baseline yang lulus. Jika baseline memiliki pengujian yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan suite penuh setelah agen harus lulus sebelum apa pun di-commit. Ketika `main` maju sebelum push bot masuk, lane ini me-rebase patch yang telah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch usang yang berkonflik dilewati. Workflow ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti docs agent.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat pasca-land. Default-nya dry-run dan hanya menutup PR yang dicantumkan secara eksplisit ketika `apply=true`. Sebelum memutasi GitHub, workflow ini memverifikasi bahwa PR yang sudah landed telah di-merge dan bahwa setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Gate pemeriksaan lokal tersebut lebih ketat tentang batas arsitektur daripada scope platform CI yang luas:

- perubahan produksi core menjalankan typecheck core prod dan core test serta lint/guard core;
- perubahan khusus pengujian core hanya menjalankan typecheck core test serta lint core;
- perubahan produksi ekstensi menjalankan typecheck extension prod dan extension test serta lint ekstensi;
- perubahan khusus pengujian ekstensi menjalankan typecheck extension test serta lint ekstensi;
- perubahan Plugin SDK publik atau kontrak plugin diperluas ke typecheck ekstensi karena ekstensi bergantung pada kontrak core tersebut (sweep ekstensi Vitest tetap menjadi pekerjaan pengujian eksplisit);
- kenaikan versi khusus metadata rilis menjalankan pemeriksaan versi/config/dependensi root yang tertarget;
- perubahan root/config yang tidak diketahui mengambil jalur aman dengan menjalankan semua lane pemeriksaan.

Perutean pengujian perubahan lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih ringan daripada `check:changed`: edit pengujian langsung menjalankan pengujian itu sendiri, edit source mengutamakan pemetaan eksplisit, lalu pengujian sibling dan dependent grafik impor. Config pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada config visible-reply grup, mode pengiriman balasan source, atau prompt sistem message-tool dirutekan melalui pengujian balasan core plus regresi pengiriman Discord dan Slack agar perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas di seluruh harness sehingga set murah yang dipetakan bukan proxy yang dapat dipercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan utamakan box baru yang sudah dipanaskan untuk bukti luas. Sebelum menjalankan gate lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sinkronisasi yang besarnya tidak terduga, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat ketika file root wajib seperti `pnpm-lock.yaml` hilang atau ketika `git status --short` menampilkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sinkronisasi remote bukan salinan PR yang dapat dipercaya; hentikan box tersebut dan panaskan yang baru, alih-alih men-debug kegagalan pengujian produk. Untuk PR penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk proses sanity tersebut.

`pnpm testbox:run` juga menghentikan invocation Blacksmith CLI lokal yang tetap berada di fase sinkronisasi selama lebih dari lima menit tanpa output pascasinkronisasi. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard tersebut, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang luar biasa besar.

Crabbox adalah wrapper remote-box milik repo untuk bukti Linux maintainer. Gunakan saat pemeriksaan terlalu luas untuk local loop pengeditan, saat paritas CI penting, atau saat bukti membutuhkan secret, Docker, lane package, box yang dapat digunakan ulang, atau log remote. Backend OpenClaw normal adalah `blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah fallback untuk outage Blacksmith, masalah kuota, atau pengujian kapasitas milik sendiri yang eksplisit.

Sebelum proses pertama, periksa wrapper dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo menolak binary Crabbox usang yang tidak mengiklankan `blacksmith-testbox`. Berikan provider secara eksplisit meskipun `.crabbox.yaml` memiliki default owned-cloud.

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

Jalankan ulang pengujian terfokus:

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

Baca ringkasan JSON final. Field yang berguna adalah `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Proses Crabbox sekali jalan yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis; jika proses terinterupsi atau pembersihan tidak jelas, periksa box aktif dan hentikan hanya box yang Anda buat:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gunakan reuse hanya saat Anda sengaja membutuhkan beberapa command pada box terhidrasi yang sama:

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

Jika `blacksmith testbox list --all` dan `blacksmith testbox status` berfungsi tetapi warmup baru tetap `queued` tanpa IP atau URL proses Actions setelah beberapa menit, perlakukan itu sebagai tekanan provider, antrean, billing, atau batas org Blacksmith. Hentikan id antrean yang Anda buat, hindari memulai lebih banyak Testbox, dan pindahkan bukti ke jalur kapasitas Crabbox milik sendiri di bawah ini sementara seseorang memeriksa dashboard, billing, dan batas org Blacksmith.

Eskalasi ke kapasitas Crabbox milik sendiri hanya ketika Blacksmith down, dibatasi kuota, tidak memiliki environment yang dibutuhkan, atau kapasitas milik sendiri memang tujuannya secara eksplisit:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Di bawah tekanan AWS, hindari `class=beast` kecuali tugas benar-benar membutuhkan CPU kelas 48xlarge. Permintaan `beast` dimulai dari 192 vCPU dan merupakan cara termudah untuk terkena kuota regional EC2 Spot atau On-Demand Standard. Default `.crabbox.yaml` milik repo adalah `standard`, beberapa region kapasitas, dan `capacity.hints: true` sehingga lease AWS yang dibrokerkan mencetak region/market yang dipilih, tekanan kuota, fallback Spot, dan peringatan kelas bertekanan tinggi. Gunakan `fast` untuk pemeriksaan luas yang lebih berat, `large` hanya setelah standard/fast tidak cukup, dan `beast` hanya untuk lane luar biasa yang terikat CPU seperti full-suite atau matriks Docker semua plugin, validasi rilis/blocker eksplisit, atau profiling performa core tinggi. Jangan gunakan `beast` untuk `pnpm check:changed`, pengujian terfokus, pekerjaan khusus docs, lint/typecheck biasa, repro E2E kecil, atau triase outage Blacksmith. Gunakan `--market on-demand` untuk diagnosis kapasitas agar churn pasar Spot tidak tercampur ke dalam sinyal.

`.crabbox.yaml` memiliki default provider, sinkronisasi, dan hidrasi GitHub Actions untuk lane owned-cloud. File ini mengecualikan `.git` lokal sehingga checkout Actions yang terhidrasi mempertahankan metadata Git remote-nya sendiri alih-alih menyinkronkan remote dan object store lokal maintainer, dan mengecualikan artifact runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, setup Node/pnpm, fetch `origin/main`, dan handoff environment non-secret untuk command owned-cloud `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
