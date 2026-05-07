---
read_when:
    - Anda perlu memahami mengapa pekerjaan CI dijalankan atau tidak dijalankan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan proses menjalankan atau menjalankan ulang validasi rilis
    - Anda mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Graf pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur CI
x-i18n:
    generated_at: "2026-05-07T01:51:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan menonaktifkan lane yang mahal ketika hanya area yang tidak terkait yang berubah. Run `workflow_dispatch` manual secara sengaja melewati scoping cerdas dan menyebarkan seluruh graph untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow [`Plugin Prarilis`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Validasi Rilis Lengkap`](#full-release-validation) atau dispatch manual eksplisit.

## Ringkasan pipeline

| Job                              | Tujuan                                                                                                   | Kapan berjalan                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, scope yang berubah, extension yang berubah, dan membangun manifes CI                   | Selalu pada push dan PR non-draft |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                                     | Selalu pada push dan PR non-draft |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependensi terhadap advisori npm                                          | Selalu pada push dan PR non-draft |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                             | Selalu pada push dan PR non-draft |
| `check-dependencies`             | Pass khusus dependensi Knip produksi ditambah guard allowlist file tidak terpakai                                 | Perubahan relevan Node              |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artifact terbangun, dan artifact hilir yang dapat digunakan ulang                       | Perubahan relevan Node              |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol                              | Perubahan relevan Node              |
| `checks-fast-contracts-channels` | Pemeriksaan contract channel tersharding dengan hasil pemeriksaan agregat stabil                                      | Perubahan relevan Node              |
| `checks-node-core-test`          | Shard pengujian Node inti, mengecualikan lane channel, bundled, contract, dan extension                          | Perubahan relevan Node              |
| `check`                          | Ekuivalen gate lokal utama tersharding: tipe prod, lint, guard, tipe pengujian, dan smoke ketat                | Perubahan relevan Node              |
| `check-additional`               | Arsitektur, boundary/prompt drift tersharding, guard extension, boundary paket, dan gateway watch        | Perubahan relevan Node              |
| `build-smoke`                    | Pengujian smoke built-CLI dan smoke memori startup                                                            | Perubahan relevan Node              |
| `checks`                         | Verifier untuk pengujian channel artifact terbangun                                                                 | Perubahan relevan Node              |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                                | Dispatch CI manual untuk rilis    |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan tautan rusak                                                             | Docs berubah                       |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                                    | Perubahan relevan skill Python      |
| `checks-windows`                 | Pengujian proses/path khusus Windows ditambah regresi specifier impor runtime bersama                      | Perubahan relevan Windows           |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artifact terbangun bersama                                               | Perubahan relevan macOS             |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk app macOS                                                            | Perubahan relevan macOS             |
| `android`                        | Pengujian unit Android untuk kedua flavor ditambah satu build APK debug                                              | Perubahan relevan Android           |
| `test-performance-agent`         | Optimisasi pengujian lambat Codex harian setelah aktivitas tepercaya                                                 | CI utama berhasil atau dispatch manual |
| `openclaw-performance`           | Laporan performa runtime Kova harian/on-demand dengan lane mock-provider, deep-profile, dan live GPT 5.4 | Dispatch terjadwal dan manual      |

## Urutan fail-fast

1. `preflight` memutuskan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job artifact dan matrix platform yang lebih berat.
3. `build-artifacts` bertumpang tindih dengan lane Linux cepat agar konsumen hilir dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat kemudian menyebar: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang digantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR yang sama atau ref `main`. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah digantikan. Key concurrency CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

Job `ci-timings-summary` mengunggah artifact ringkas `ci-timings-summary` untuk setiap run CI non-draft. Artifact ini mencatat wall time, queue time, job terlambat, dan job gagal untuk run saat ini, sehingga pemeriksaan kesehatan CI tidak perlu berulang kali melakukan scrape payload Actions lengkap.

## Scope dan routing

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area berscope berubah.

- **Edit workflow CI** memvalidasi graph CI Node ditambah linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap scoped ke perubahan sumber platform.
- **Edit khusus routing CI, edit fixture core-test murah tertentu, dan edit helper/test-routing plugin contract yang sempit** menggunakan path manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Path itu melewati artifact build, kompatibilitas Node 22, contract channel, shard inti penuh, shard bundled-plugin, dan matrix guard tambahan ketika perubahan terbatas pada permukaan routing atau helper yang diuji langsung oleh tugas cepat.
- **Pemeriksaan Node Windows** scoped ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, config package manager, dan permukaan workflow CI yang mengeksekusi lane itu; perubahan sumber, plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada di lane Node Linux.

Keluarga pengujian Node paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil tanpa mencadangkan runner secara berlebihan: contract channel berjalan sebagai tiga shard berbobot, lane core unit fast/support berjalan terpisah, infrastruktur runtime inti dipecah antara shard state, process/config, cron, dan shared, auto-reply berjalan sebagai worker seimbang (dengan subtree reply dipecah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan config gateway/server agentic dipecah lintas lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artifact terbangun. Pengujian browser, QA, media, dan plugin miscellaneous yang luas menggunakan config Vitest khusus masing-masing alih-alih catch-all plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan config utuh dari shard terfilter. `check-additional` menyatukan pekerjaan compile/canary package-boundary dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar guard boundary distripe ke empat shard matrix, masing-masing menjalankan guard independen terpilih secara bersamaan dan mencetak timing per pemeriksaan. Pemeriksaan drift snapshot prompt happy-path Codex yang mahal berjalan hanya untuk CI manual dan perubahan yang memengaruhi prompt, sehingga perubahan Node normal yang tidak terkait tidak menunggu di balik generasi snapshot prompt dingin sementara prompt drift tetap dipin ke PR yang menyebabkannya; flag yang sama melewati generasi Vitest snapshot prompt di dalam shard support-boundary inti artifact terbangun. Gateway watch, pengujian channel, dan shard support-boundary inti berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

Android CI menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane unit-test-nya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push relevan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipin ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk install `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file tidak terpakai produksi Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak terpakai gagal ketika PR menambahkan file tidak terpakai baru yang belum ditinjau atau meninggalkan entri allowlist basi, sambil mempertahankan permukaan plugin dinamis, generated, build, live-test, dan bridge paket yang disengaja yang tidak dapat diresolusikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow memiliki empat lane:

- `clawsweeper_item` untuk permintaan tinjauan issue dan pull request eksak;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit dalam komentar issue;
- `clawsweeper_commit_review` untuk permintaan tinjauan level commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis event, aksi, aktor, repositori, nomor item, URL, judul, state, dan kutipan singkat untuk komentar atau review saat ada. Lane ini secara sengaja menghindari penerusan body webhook lengkap. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event ternormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan hanya boleh memposting ke `#clawsweeper` ketika event mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise webhook duplikat, dan traffic review normal harus menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, body, teks ulasan, nama branch, dan pesan commit GitHub sebagai data tidak tepercaya di seluruh path ini. Semua itu adalah input untuk ringkasan dan triase, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan grafik job yang sama seperti CI normal, tetapi memaksa setiap lane bercakupan non-Android aktif: shard Node Linux, shard plugin bawaan, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Skills Python, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android saja dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan lane Docker prarilis plugin dikecualikan dari CI. Suite prarilis Docker hanya berjalan saat `Full Release Validation` men-dispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup konkurensi unik agar suite penuh kandidat rilis tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik tersebut terhadap branch, tag, atau SHA commit lengkap sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan cepat protocol/contract/bundled, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, agregat `check-additional`, verifikator agregat pengujian Node, pemeriksaan docs, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ekstensi berbobot lebih ringan, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Node Linux, shard pengujian plugin bawaan, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif CPU sehingga 8 vCPU lebih mahal daripada penghematan yang diberikan); build Docker install-smoke (waktu antrean 32-vCPU lebih mahal daripada penghematan yang diberikan)                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

CI repo kanonis mempertahankan Blacksmith sebagai path runner default. Selama `preflight`, `scripts/ci-runner-labels.mjs` memeriksa run Actions terbaru yang sedang antre dan berjalan untuk job Blacksmith yang antre. Jika label Blacksmith tertentu sudah memiliki job yang antre, job downstream yang akan menggunakan label persis itu akan fallback ke runner yang di-host GitHub yang cocok (`ubuntu-24.04`, `windows-2025`, atau `macos-latest`) hanya untuk run tersebut. Ukuran Blacksmith lain dalam keluarga OS yang sama tetap menggunakan label utamanya. Jika probe API gagal, tidak ada fallback yang diterapkan.

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

Dispatch manual biasanya melakukan benchmark pada ref workflow. Atur `target_ref` untuk melakukan benchmark pada tag rilis atau branch lain dengan implementasi workflow saat ini. Path laporan yang dipublikasikan dan pointer terbaru diberi kunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA workflow, ref Kova, profil, mode auth lane, model, jumlah pengulangan, dan filter skenario.

Workflow menginstal OCM dari rilis yang di-pin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang di-pin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan auth kompatibel OpenAI palsu yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, gateway, dan giliran agen.
- `live-gpt54`: giliran agen OpenAI `openai/gpt-5.4` nyata, dilewati saat `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah pass Kova: timing boot gateway dan memori pada kasus startup default, hook, dan 50-plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; dan perintah startup CLI terhadap gateway yang sudah di-boot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundle laporan, dengan JSON mentah di sampingnya.

Setiap lane mengunggah artefak GitHub. Saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, workflow juga meng-commit `report.json`, `report.md`, bundle, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer ref teruji saat ini ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow payung manual untuk "jalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit lengkap, men-dispatch workflow `CI` manual dengan target tersebut, men-dispatch `Plugin Prerelease` untuk bukti khusus rilis plugin/paket/statis/Docker, dan men-dispatch `OpenClaw Release Checks` untuk install smoke, penerimaan paket, pemeriksaan paket lintas-OS, paritas QA Lab, Matrix, dan lane Telegram. Run stabil/default mempertahankan cakupan live/E2E lengkap dan path rilis Docker di balik `run_release_soak=true`; `release_profile=full` memaksa cakupan soak itu aktif agar validasi advisory yang luas tetap luas. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah publikasi, teruskan `npm_telegram_package_spec` untuk menjalankan ulang lane paket Telegram yang sama terhadap paket npm yang dipublikasikan.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks stage, nama job workflow persis, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah workflow rilis manual yang memutasi. Dispatch workflow ini
dari `release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah
preflight npm OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`,
men-dispatch `Plugin NPM Release` untuk semua paket plugin yang dapat dipublikasikan, men-dispatch
`Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru setelah itu men-dispatch
`OpenClaw NPM Release` dengan `preflight_run_id` yang disimpan.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
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
alur kerja turunan `headSha` cocok dengan target, dan menghapus cabang sementara saat
run selesai. Verifier payung juga gagal jika ada alur kerja turunan yang berjalan pada
SHA berbeda.

`release_profile` mengontrol cakupan live/provider yang diteruskan ke pemeriksaan rilis. Alur kerja
rilis manual secara default menggunakan `stable`; gunakan `full` hanya saat Anda
sengaja menginginkan matriks advisory provider/media yang luas. `run_release_soak`
mengontrol apakah pemeriksaan rilis stable/default menjalankan soak live/E2E dan
jalur rilis Docker yang menyeluruh; `full` memaksa soak aktif.

- `minimum` mempertahankan lane OpenAI/core paling cepat yang kritis untuk rilis.
- `stable` menambahkan set provider/backend stabil.
- `full` menjalankan matriks advisory provider/media yang luas.

Payung mencatat id run turunan yang di-dispatch, dan job akhir `Verify full validation` memeriksa ulang kesimpulan run turunan saat ini dan menambahkan tabel job paling lambat untuk setiap run turunan. Jika alur kerja turunan dijalankan ulang dan berubah hijau, jalankan ulang hanya job verifier induk untuk menyegarkan hasil payung dan ringkasan waktunya.

Untuk pemulihan, baik `Full Release Validation` maupun `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk turunan CI penuh normal, `plugin-prerelease` hanya untuk turunan prarilis Plugin, `release-checks` untuk setiap turunan rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga run ulang kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane lintas-OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah lintas-OS yang panjang mengeluarkan baris Heartbeat dan ringkasan packaged-upgrade menyertakan waktu per fase. Lane pemeriksaan rilis QA bersifat advisory, sehingga kegagalan khusus QA memberi peringatan tetapi tidak memblokir verifier pemeriksaan rilis.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk meresolusi ref yang dipilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke pemeriksaan lintas-OS dan Package Acceptance, plus alur kerja Docker jalur rilis live/E2E saat cakupan soak berjalan. Ini menjaga byte paket konsisten di seluruh kotak rilis dan menghindari pengemasan ulang kandidat yang sama di beberapa job turunan.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan payung yang lebih lama. Monitor induk membatalkan setiap alur kerja turunan yang
sudah di-dispatch saat induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang run pemeriksaan rilis dua jam yang usang. Validasi cabang/tag
rilis dan grup run ulang terfokus mempertahankan `cancel-in-progress: false`.

## Shard live dan E2E

Turunan live/E2E rilis mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs` alih-alih satu job serial:

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
- shard media audio/video yang dipisah dan shard musik yang difilter provider

Ini mempertahankan cakupan file yang sama sekaligus membuat kegagalan provider live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk run ulang manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh alur kerja `Live Media Runner Image`. Image itu sudah memasang `ffmpeg` dan `ffprobe`; job media hanya memverifikasi biner sebelum penyiapan. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job container bukan tempat yang tepat untuk meluncurkan pengujian Docker bersarang.

Shard model/backend live berbasis Docker menggunakan image bersama `ghcr.io/openclaw/openclaw-live-test:<sha>` yang terpisah per commit terpilih. Alur kerja rilis live membangun dan mendorong image itu satu kali, lalu shard model live Docker, Gateway yang di-shard per provider, backend CLI, ACP bind, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` tingkat skrip eksplisit di bawah timeout job alur kerja sehingga container atau jalur cleanup yang macet gagal cepat alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah konfigurasi dan akan membuang waktu dinding pada build image duplikat.

## Package Acceptance

Gunakan `Package Acceptance` saat pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan package acceptance memvalidasi satu tarball melalui harness Docker E2E yang sama seperti yang digunakan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, meresolusi satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref alur kerja, ref paket, versi, SHA-256, serta profil dalam ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Alur kerja reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker package-digest bila diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket itu alih-alih mengemas checkout alur kerja. Saat profil memilih beberapa `docker_lanes` tertarget, alur kerja reusable menyiapkan paket dan image bersama satu kali, lalu menyebarkan lane tersebut sebagai job Docker tertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan saat `telegram_mode` bukan `none` dan memasang artefak `package-under-test` yang sama saat Package Acceptance meresolusi satu; dispatch Telegram mandiri tetap dapat memasang spec npm yang dipublikasikan.
4. `summary` menggagalkan alur kerja jika resolusi paket, Docker acceptance, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk acceptance prarilis/stabil yang dipublikasikan.
- `source=ref` mengemas cabang, tag, atau SHA commit penuh `package_ref` yang tepercaya. Resolver mengambil cabang/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat cabang repositori atau tag rilis, memasang dependensi dalam worktree terlepas, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode alur kerja/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas saat `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika alur kerja lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — potongan jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` tepat; wajib saat `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan kembali artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spec npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan khusus pengujian pembaruan dan Plugin, termasuk perintah lokal,
lane Docker, input Package Acceptance, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Package Acceptance dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, pembaruan, cleanup dependensi Plugin usang, perbaikan instalasi Plugin terkonfigurasi, Plugin offline, pembaruan Plugin, dan bukti Telegram pada tarball paket yang sama-sama diresolusi. Setel `package_acceptance_package_spec` pada Full Release Validation atau OpenClaw Release Checks untuk menjalankan matriks yang sama terhadap paket npm yang sudah dikirim alih-alih artefak yang dibangun dari SHA. Pemeriksaan rilis lintas-OS tetap mencakup onboarding, installer, dan perilaku platform spesifik OS; validasi produk paket/pembaruan harus dimulai dengan Package Acceptance. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run dalam jalur rilis yang memblokir. Dalam Package Acceptance, tarball `package-under-test` yang diresolusi selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline publikasi fallback, default ke `openclaw@latest`; perintah run ulang lane gagal mempertahankan baseline tersebut. Full Release Validation dengan `run_release_soak=true` atau `release_profile=full` menyetel `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas ke empat rilis npm stabil terbaru plus rilis batas kompatibilitas Plugin terpin dan fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, instalasi Plugin OpenClaw terkonfigurasi, jalur log tilde, dan root dependensi Plugin legacy yang usang. Pilihan multi-baseline published-upgrade survivor di-shard berdasarkan baseline ke dalam job runner Docker tertarget yang terpisah. Alur kerja `Update Migration` yang terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` saat pertanyaannya adalah cleanup pembaruan publikasi yang menyeluruh, bukan cakupan CI Full Release normal. Run agregat lokal dapat meneruskan spec paket tepat dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menyetel `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane yang dipublikasikan mengonfigurasi baseline dengan resep perintah `openclaw config set` bawaan, mencatat langkah resep dalam `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway mulai. Lane fresh paket dan installer Windows juga memverifikasi bahwa paket terinstal dapat mengimpor override browser-control dari jalur Windows absolut mentah. Smoke agent-turn lintas-OS OpenAI secara default menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat disetel, jika tidak `openai/gpt-5.4`, sehingga bukti instalasi dan Gateway tetap berada pada model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Package Acceptance memiliki jendela kompatibilitas lama yang dibatasi untuk package yang sudah dipublikasikan. Package hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang dikenal di `dist/postinstall-inventory.json` dapat mengarah ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika package tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu yang diturunkan dari tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke Plugin dapat membaca lokasi install-record lama atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan install record dan perilaku tanpa instal ulang tetap tidak berubah.

Package `2026.4.26` yang dipublikasikan juga dapat memperingatkan file stempel metadata build lokal yang sudah dikirim. Package yang lebih baru harus memenuhi kontrak modern; kondisi yang sama gagal, bukan memberi peringatan atau dilewati.

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

Saat men-debug run package acceptance yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber package, versi, dan SHA-256. Lalu periksa run turunan `docker_acceptance` dan artifact Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Lebih pilih menjalankan ulang profil package yang gagal atau lane Docker persisnya daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Alur kerja `Install Smoke` terpisah menggunakan ulang skrip scope yang sama melalui job `preflight` miliknya sendiri. Alur ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh surface Docker/package, perubahan package/manifest Plugin bawaan, atau surface Plugin SDK/plugin/channel/Gateway inti yang diuji oleh job smoke Docker. Perubahan Plugin bawaan khusus sumber, edit khusus pengujian, dan edit khusus docs tidak memesan worker Docker. Jalur cepat membangun image Dockerfile root sekali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e gateway-network container, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker Plugin bawaan terbatas di bawah timeout perintah agregat 240 detik (run Docker tiap skenario dibatasi terpisah).
- **Jalur penuh** mempertahankan install package QR serta cakupan Docker/update installer untuk run terjadwal malam hari, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh surface installer/package/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan install package QR, smoke Dockerfile/Gateway root, smoke installer/update, dan E2E Docker Plugin bawaan jalur cepat sebagai job terpisah agar pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; ketika logika changed-scope akan meminta cakupan penuh pada push, alur kerja mempertahankan smoke Docker cepat dan menyerahkan smoke install penuh ke validasi malam hari atau rilis.

Smoke image-provider Bun global install yang lambat di-gate secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam hari dan dari alur kerja pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat memilih untuk menyertakannya, tetapi pull request dan push `main` tidak. Pengujian Docker QR dan installer mempertahankan Dockerfile mereka sendiri yang berfokus pada instalasi.

## Docker E2E Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya menjalankan plan yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parameter yang dapat disetel

| Variabel                               | Default | Tujuan                                                                                        |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live serentak agar provider tidak melakukan throttle.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane install npm serentak.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antarawal lane untuk menghindari badai create daemon Docker; atur `0` untuk tanpa jeda.  |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/tail terpilih menggunakan batas lebih ketat. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak plan scheduler tanpa menjalankan lane.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agent dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya tetap dapat mulai dari pool kosong, lalu berjalan sendiri sampai melepas kapasitas. Preflight agregat lokal memeriksa Docker, menghapus container E2E OpenClaw yang usang, memancarkan status active-lane, menyimpan timing lane untuk pengurutan longest-first, dan secara default berhenti menjadwalkan lane pool baru setelah kegagalan pertama.

### Alur kerja live/E2E yang dapat digunakan ulang

Alur kerja live/E2E yang dapat digunakan ulang menanyakan kepada `scripts/test-docker-all.mjs --plan-json` package, jenis image, image live, lane, dan cakupan credential mana yang diperlukan. `scripts/docker-e2e.mjs` kemudian mengubah plan itu menjadi output dan ringkasan GitHub. Alur ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artifact package dari run saat ini, atau mengunduh artifact package dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image Docker E2E GHCR bare/functional bertag digest-package melalui cache layer Docker Blacksmith ketika plan membutuhkan lane package-installed; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest-package yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout 180 detik per upaya yang dibatasi agar stream registry/cache yang macet dicoba ulang dengan cepat alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkan dan menjalankan beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer provider.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` ketika cakupan release-path penuh memintanya, dan mempertahankan chunk `openwebui` mandiri hanya untuk dispatch khusus OpenWebUI. Lane update bundled-channel mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON plan scheduler, tabel slow-lane, dan perintah rerun per lane. Input `docker_lanes` alur kerja menjalankan lane terpilih terhadap image yang telah disiapkan alih-alih job chunk, yang menjaga debugging failed-lane tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artifact package untuk run tersebut; jika lane terpilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun itu. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan ketika nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang package dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Alur kerja live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prapeluncuran Plugin

`Plugin Prerelease` adalah cakupan produk/package yang lebih mahal, sehingga ini menjadi alur kerja terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri membiarkan suite tersebut nonaktif. Alur ini menyeimbangkan pengujian Plugin bawaan di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch Plugin yang berat impor tidak membuat job CI tambahan. Jalur prapeluncuran Docker khusus rilis mengelompokkan lane Docker tertarget dalam grup kecil untuk menghindari pemesanan puluhan runner untuk job berdurasi satu hingga tiga menit.

## QA Lab

QA Lab memiliki lane CI khusus di luar alur kerja smart-scoped utama. Paritas agentic bersarang di bawah harness QA dan rilis yang luas, bukan alur kerja PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus ikut dalam run validasi luas.

- Alur kerja `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan pada dispatch manual; alur ini menyebarkan lane mock parity, lane live Matrix, serta lane live Telegram dan Discord sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan penyedia mock deterministik dan model berkualifikasi mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup Plugin penyedia normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh suite model live, penyedia native, dan penyedia Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu membagi cakupan penuh Matrix menjadi job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke dalam job laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/pemeriksaan terscoped alih-alih memperlakukan paritas sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja dibuat sebagai pemindai keamanan tahap awal yang sempit, bukan sapuan repositori penuh. Run harian, manual, dan guard pull request non-draft memindai kode workflow Actions beserta surface JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Guard pull request tetap ringan: ia hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti workflow terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                          | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, rahasia, sandbox, cron, dan baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti beserta runtime Plugin channel, gateway, Plugin SDK, rahasia, titik sentuh audit                 |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF inti, parsing IP, guard jaringan, web-fetch, dan surface kebijakan SSRF Plugin SDK                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman outbound, dan gate eksekusi alat agen                                                |
| `/codeql-security-high/plugin-trust-boundary`     | Surface kepercayaan instalasi Plugin, loader, manifest, registry, instalasi package-manager, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL pada Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Tetap berada di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ia hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error pada surface bernilai tinggi yang sempit di runner Blacksmith Linux yang lebih kecil. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draft hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sepadan untuk perubahan kode eksekusi perintah/model/alat agen dan dispatch balasan, kode skema/migrasi/IO config, kode auth/rahasia/sandbox/keamanan, runtime channel inti dan Plugin channel bundel, protocol/server-method gateway, runtime memori/glue SDK, MCP/proses/pengiriman outbound, runtime penyedia/katalog model, diagnostik sesi/antrean pengiriman, loader Plugin, kontrak Plugin SDK/paket, atau runtime balasan Plugin SDK. Perubahan config CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode auth, rahasia, sandbox, cron, dan boundary keamanan gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema config, migrasi, normalisasi, dan IO                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protocol Gateway dan kontrak metode server                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan Plugin channel bundel                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Eksekusi perintah, dispatch model/penyedia, dispatch dan antrean balasan otomatis, serta kontrak runtime control-plane ACP                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge alat, helper supervisi proses, serta kontrak pengiriman outbound                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, fasad runtime memori, alias Plugin SDK memori, glue aktivasi runtime memori, dan perintah doctor memori                                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi outbound, surface bundel event/log diagnostik, dan kontrak CLI doctor sesi     |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan inbound Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread           |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery penyedia, registrasi runtime penyedia, default/katalog penyedia, serta registry web/search/fetch/embedding         |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol gateway, dan kontrak runtime control-plane tugas                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Web fetch/search inti, IO media, pemahaman media, image-generation, dan kontrak runtime media-generation                                                          |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, surface publik, dan entrypoint Plugin SDK                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket Plugin                                                                                  |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan Plugin bundel sebaiknya ditambahkan kembali sebagai pekerjaan lanjutan terscoped atau tersharding hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Workflow pemeliharaan

### Agen Docs

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru landed. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, dan dispatch manual dapat menjalankannya secara langsung. Invokasi workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-skipped lain dibuat dalam satu jam terakhir. Saat berjalan, ia meninjau rentang commit dari SHA sumber Docs Agent non-skipped sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terakumulasi sejak pass docs terakhir.

### Agen Performa Test

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk test lambat. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, tetapi ia dilewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gate aktivitas harian itu. Lane ini membangun laporan performa Vitest suite penuh yang dikelompokkan, mengizinkan Codex membuat hanya perbaikan performa test kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan suite penuh dan menolak perubahan yang mengurangi jumlah baseline test yang lulus. Jika baseline memiliki test yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan suite penuh setelah agen harus lulus sebelum apa pun di-commit. Ketika `main` maju sebelum push bot landed, lane ini me-rebase patch yang sudah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba push lagi; patch basi yang konflik dilewati. Ia menggunakan Ubuntu yang di-host GitHub sehingga aksi Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti agen docs.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat pasca-land. Default-nya dry-run dan hanya menutup PR yang dicantumkan secara eksplisit ketika `apply=true`. Sebelum memutasi GitHub, ia memverifikasi bahwa PR yang landed sudah di-merge dan bahwa setiap duplikat memiliki issue yang direferensikan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gate pemeriksaan lokal tersebut lebih ketat tentang boundary arsitektur daripada scope platform CI yang luas:

- perubahan produksi inti menjalankan typecheck produksi inti dan pengujian inti ditambah lint/guard inti;
- perubahan khusus pengujian inti hanya menjalankan typecheck pengujian inti ditambah lint inti;
- perubahan produksi ekstensi menjalankan typecheck produksi ekstensi dan pengujian ekstensi ditambah lint ekstensi;
- perubahan khusus pengujian ekstensi menjalankan typecheck pengujian ekstensi ditambah lint ekstensi;
- perubahan publik Plugin SDK atau kontrak plugin diperluas ke typecheck ekstensi karena ekstensi bergantung pada kontrak inti tersebut (sweep ekstensi Vitest tetap menjadi pekerjaan pengujian eksplisit);
- kenaikan versi khusus metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi-root yang ditargetkan;
- perubahan root/konfigurasi yang tidak diketahui gagal secara aman ke semua lane pemeriksaan.

Perutean pengujian-berubah lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit pengujian langsung menjalankan dirinya sendiri, edit sumber lebih memilih pemetaan eksplisit, lalu pengujian saudara dan dependen grafik-impor. Konfigurasi pengiriman ruang-grup bersama adalah salah satu pemetaan eksplisit: perubahan pada konfigurasi balasan-terlihat grup, mode pengiriman balasan sumber, atau prompt sistem alat-pesan dirutekan melalui pengujian balasan inti ditambah regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas di seluruh harness sehingga set terpetakan murah bukan proksi yang tepercaya.

## Validasi Testbox

Jalankan Testbox dari root repositori dan lebih pilih box baru yang sudah dipanaskan untuk bukti luas. Sebelum menghabiskan gate lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sinkronisasi yang besarnya tidak terduga, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan kewarasan gagal cepat ketika file root yang diperlukan seperti `pnpm-lock.yaml` menghilang atau ketika `git status --short` menunjukkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sinkronisasi jarak jauh bukan salinan PR yang tepercaya; hentikan box tersebut dan panaskan yang baru alih-alih men-debug kegagalan pengujian produk. Untuk PR penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk proses kewarasan itu.

`pnpm testbox:run` juga menghentikan invokasi CLI Blacksmith lokal yang tetap berada di fase sinkronisasi selama lebih dari lima menit tanpa output pasca-sinkronisasi. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard itu, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang luar biasa besar.

Crabbox adalah wrapper remote-box milik repositori untuk bukti Linux pemelihara. Gunakan ketika pemeriksaan terlalu luas untuk local loopback edit lokal, ketika paritas CI penting, atau ketika bukti memerlukan rahasia, Docker, lane paket, box yang dapat digunakan ulang, atau log jarak jauh. Backend OpenClaw normal adalah `blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah fallback untuk gangguan Blacksmith, masalah kuota, atau pengujian kapasitas-milik-sendiri eksplisit.

Sebelum proses pertama, periksa wrapper dari root repositori:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repositori menolak biner Crabbox usang yang tidak mengiklankan `blacksmith-testbox`. Teruskan penyedia secara eksplisit meskipun `.crabbox.yaml` memiliki default owned-cloud.

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

Baca ringkasan JSON final. Field yang berguna adalah `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Proses Crabbox satu-kali yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis; jika proses terinterupsi atau pembersihan tidak jelas, inspeksi box aktif dan hentikan hanya box yang Anda buat:

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

Jika Crabbox adalah lapisan yang rusak tetapi Blacksmith sendiri berfungsi, gunakan Blacksmith langsung sebagai fallback sempit:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Jika `blacksmith testbox list --all` dan `blacksmith testbox status` berfungsi tetapi warmup baru berada dalam status `queued` tanpa IP atau URL proses Actions setelah beberapa menit, perlakukan itu sebagai tekanan penyedia Blacksmith, antrean, penagihan, atau batas org. Hentikan id antrean yang Anda buat, hindari memulai lebih banyak Testbox, dan pindahkan bukti ke jalur kapasitas Crabbox milik sendiri di bawah sementara seseorang memeriksa dasbor Blacksmith, penagihan, dan batas org.

Eskalasi ke kapasitas Crabbox milik sendiri hanya ketika Blacksmith sedang down, dibatasi kuota, tidak memiliki lingkungan yang diperlukan, atau kapasitas milik sendiri secara eksplisit menjadi tujuan:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Di bawah tekanan AWS, hindari `class=beast` kecuali tugas benar-benar memerlukan CPU kelas 48xlarge. Permintaan `beast` dimulai dari 192 vCPU dan merupakan cara termudah untuk memicu kuota EC2 Spot regional atau On-Demand Standard. Default `.crabbox.yaml` milik repositori adalah `standard`, beberapa wilayah kapasitas, dan `capacity.hints: true` sehingga lease AWS yang dibrokeri mencetak wilayah/pasar terpilih, tekanan kuota, fallback Spot, dan peringatan kelas tekanan-tinggi. Gunakan `fast` untuk pemeriksaan luas yang lebih berat, `large` hanya setelah standard/fast tidak cukup, dan `beast` hanya untuk lane CPU-bound luar biasa seperti suite-lengkap atau matriks Docker semua-plugin, validasi rilis/pemblokir eksplisit, atau profiling kinerja inti-tinggi. Jangan gunakan `beast` untuk `pnpm check:changed`, pengujian terfokus, pekerjaan khusus dokumentasi, lint/typecheck biasa, repro E2E kecil, atau triase gangguan Blacksmith. Gunakan `--market on-demand` untuk diagnosis kapasitas agar churn pasar Spot tidak tercampur ke dalam sinyal.

`.crabbox.yaml` memiliki default penyedia, sinkronisasi, dan hidrasi GitHub Actions untuk lane owned-cloud. File itu mengecualikan `.git` lokal sehingga checkout Actions terhidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan object store lokal pemelihara, dan mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, penyiapan Node/pnpm, fetch `origin/main`, dan handoff lingkungan non-rahasia untuk perintah owned-cloud `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
