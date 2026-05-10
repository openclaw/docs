---
read_when:
    - Anda perlu memahami mengapa sebuah job CI dijalankan atau tidak dijalankan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pengulangan validasi rilis
    - Anda sedang mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Graf pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-10T19:25:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan mematikan lane mahal saat hanya area yang tidak terkait berubah. Run manual `workflow_dispatch` sengaja melewati scoping pintar dan menyebarkan seluruh graf untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan plugin khusus rilis berada di workflow [`Plugin Prerelease`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Validasi Rilis Penuh`](#full-release-validation) atau dispatch manual eksplisit.

## Ikhtisar pipeline

| Job                              | Tujuan                                                                                                           | Kapan berjalan                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, scope yang berubah, ekstensi yang berubah, dan membangun manifes CI            | Selalu pada push dan PR non-draf       |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                                          | Selalu pada push dan PR non-draf       |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisory npm                                                   | Selalu pada push dan PR non-draf       |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                                           | Selalu pada push dan PR non-draf       |
| `check-dependencies`             | Pass khusus dependensi Knip produksi plus guard allowlist file tak terpakai                                      | Perubahan yang relevan dengan Node     |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artifact terbangun, dan artifact downstream yang dapat digunakan ulang | Perubahan yang relevan dengan Node     |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol                                  | Perubahan yang relevan dengan Node     |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel tersharding dengan hasil pemeriksaan agregat yang stabil                             | Perubahan yang relevan dengan Node     |
| `checks-node-core-test`          | Shard test Node inti, tidak termasuk lane channel, bundled, contract, dan extension                              | Perubahan yang relevan dengan Node     |
| `check`                          | Ekuivalen gate lokal utama tersharding: tipe prod, lint, guard, tipe test, dan smoke ketat                       | Perubahan yang relevan dengan Node     |
| `check-additional`               | Arsitektur, drift boundary/prompt tersharding, guard extension, package boundary, dan gateway watch              | Perubahan yang relevan dengan Node     |
| `build-smoke`                    | Test smoke CLI terbangun dan smoke memori startup                                                                | Perubahan yang relevan dengan Node     |
| `checks`                         | Verifier untuk test channel artifact terbangun                                                                   | Perubahan yang relevan dengan Node     |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                                      | Dispatch CI manual untuk rilis         |
| `check-docs`                     | Pemeriksaan format docs, lint, dan broken-link                                                                   | Docs berubah                           |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                                       | Perubahan yang relevan dengan skill Python |
| `checks-windows`                 | Test proses/path khusus Windows plus regresi import specifier runtime bersama                                    | Perubahan yang relevan dengan Windows  |
| `macos-node`                     | Lane test TypeScript macOS menggunakan artifact terbangun bersama                                                | Perubahan yang relevan dengan macOS    |
| `macos-swift`                    | Swift lint, build, dan test untuk aplikasi macOS                                                                 | Perubahan yang relevan dengan macOS    |
| `android`                        | Test unit Android untuk kedua flavor plus satu build debug APK                                                   | Perubahan yang relevan dengan Android  |
| `test-performance-agent`         | Optimisasi test lambat Codex harian setelah aktivitas tepercaya                                                  | CI main sukses atau dispatch manual    |
| `openclaw-performance`           | Laporan performa runtime Kova harian/on-demand dengan lane mock-provider, deep-profile, dan GPT 5.4 live         | Terjadwal dan dispatch manual          |

## Urutan fail-fast

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job matrix artifact dan platform yang lebih berat.
3. `build-artifacts` tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` saat push yang lebih baru masuk ke PR atau ref `main` yang sama. Anggap itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tergantikan. Kunci concurrency CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

Job `ci-timings-summary` mengunggah artifact `ci-timings-summary` ringkas untuk setiap run CI non-draf. Artifact ini mencatat wall time, queue time, job paling lambat, dan job gagal untuk run saat ini, sehingga pemeriksaan kesehatan CI tidak perlu berulang kali mengambil seluruh payload Actions.

## Scope dan routing

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh test unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area berscope berubah.

- **Edit workflow CI** memvalidasi graf CI Node plus linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap terscope ke perubahan source platform.
- **Edit khusus routing CI, edit fixture core-test murah terpilih, dan edit helper/test-routing kontrak plugin yang sempit** menggunakan path manifes Node-only cepat: `preflight`, security, dan satu tugas `checks-fast-core`. Path itu melewati build artifact, kompatibilitas Node 22, kontrak channel, shard inti penuh, shard bundled-plugin, dan matrix guard tambahan saat perubahan terbatas pada surface routing atau helper yang langsung diuji oleh tugas cepat.
- **Pemeriksaan Node Windows** terscope ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan surface workflow CI yang menjalankan lane tersebut; perubahan source, plugin, install-smoke, dan khusus test yang tidak terkait tetap berada pada lane Node Linux.

Keluarga test Node paling lambat dipisah atau diseimbangkan agar setiap job tetap kecil tanpa mereservasi runner secara berlebihan: kontrak channel berjalan sebagai tiga shard berbobot berbasis Blacksmith dengan fallback runner GitHub standar, lane core unit fast/support berjalan terpisah, infrastruktur runtime inti dipisah antara shard state, process/config, cron, dan shared, auto-reply berjalan sebagai worker seimbang (dengan subtree reply dipisah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi agentic gateway/server dipisah di lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artifact terbangun. Test browser, QA, media, dan plugin miscellaneous yang luas menggunakan konfigurasi Vitest khususnya, bukan catch-all plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard terfilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar guard boundary distriping ke empat shard matrix, masing-masing menjalankan guard independen terpilih secara bersamaan dan mencetak timing per pemeriksaan. Pemeriksaan drift snapshot prompt Codex happy-path yang mahal berjalan sebagai job tambahan tersendiri untuk CI manual dan hanya untuk perubahan yang memengaruhi prompt, sehingga perubahan Node normal yang tidak terkait tidak menunggu di belakang generasi snapshot prompt dingin dan shard boundary tetap seimbang sementara drift prompt tetap dipin ke PR yang menyebabkannya; flag yang sama melewati generasi Vitest snapshot prompt di dalam shard support-boundary inti artifact terbangun. Gateway watch, test channel, dan shard support-boundary inti berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun Play debug APK. Flavor third-party tidak memiliki source set atau manifest terpisah; lane unit-test-nya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging debug APK duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipin ke versi Knip terbaru, dengan minimum release age pnpm dinonaktifkan untuk install `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file produksi tak terpakai dari Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tak terpakai gagal saat PR menambahkan file tak terpakai baru yang belum direview atau meninggalkan entri allowlist basi, sambil mempertahankan surface plugin dinamis, generated, build, live-test, dan package bridge yang disengaja yang tidak dapat di-resolve Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan check out atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow memiliki empat lane:

- `clawsweeper_item` untuk permintaan review issue dan pull request yang persis;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit di komentar issue;
- `clawsweeper_commit_review` untuk permintaan review tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata ternormalisasi: tipe event, action, actor, repository, nomor item, URL, title, state, dan kutipan singkat untuk komentar atau review jika ada. Ini sengaja menghindari penerusan seluruh body webhook. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event ternormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan sebaiknya memposting ke `#clawsweeper` hanya saat event mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise webhook duplikat, dan traffic review normal sebaiknya menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, isi, teks ulasan, nama cabang, dan pesan commit GitHub sebagai data tidak tepercaya di seluruh jalur ini. Semua itu adalah input untuk peringkasan dan triase, bukan instruksi untuk alur kerja atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan grafik job yang sama dengan CI normal, tetapi memaksa setiap lane berskup non-Android aktif: shard Linux Node, shard plugin bawaan, kontrak kanal, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri hanya menjalankan Android dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan lane Docker prarilis plugin dikecualikan dari CI. Suite prarilis Docker hanya berjalan ketika `Full Release Validation` mendispatch alur kerja `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup konkurensi unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik itu terhadap cabang, tag, atau SHA commit penuh sambil menggunakan file alur kerja dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job dan agregat keamanan cepat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/bawaan cepat, pemeriksaan kontrak kanal bershard, shard `check` kecuali lint, agregat `check-additional`, pemverifikasi agregat pengujian Node, pemeriksaan dokumentasi, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang dihosting GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ekstensi berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, shard pengujian Linux Node, shard pengujian plugin bawaan, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (cukup sensitif CPU sehingga 8 vCPU lebih mahal daripada penghematannya); build Docker install-smoke (waktu antrean 32-vCPU lebih mahal daripada penghematannya)                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |

CI repo kanonis mempertahankan Blacksmith sebagai jalur runner default. Selama `preflight`, `scripts/ci-runner-labels.mjs` memeriksa run Actions terbaru yang sedang mengantre dan sedang berjalan untuk job Blacksmith yang mengantre. Jika label Blacksmith tertentu sudah memiliki job yang mengantre, job downstream yang akan menggunakan label persis itu fallback ke runner yang dihosting GitHub yang sesuai (`ubuntu-24.04`, `windows-2025`, atau `macos-latest`) hanya untuk run tersebut. Ukuran Blacksmith lain dalam keluarga OS yang sama tetap memakai label utama. Jika probe API gagal, fallback tidak diterapkan.

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

## Kinerja OpenClaw

`OpenClaw Performance` adalah alur kerja kinerja produk/runtime. Alur kerja ini berjalan setiap hari di `main` dan dapat didispatch secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch manual biasanya melakukan benchmark pada ref alur kerja. Atur `target_ref` untuk melakukan benchmark pada tag rilis atau cabang lain dengan implementasi alur kerja saat ini. Jalur laporan yang dipublikasikan dan pointer terbaru dikunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA alur kerja, ref Kova, profil, mode otorisasi lane, model, jumlah pengulangan, dan filter skenario.

Alur kerja menginstal OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan otorisasi palsu kompatibel OpenAI yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, Gateway, dan giliran agen.
- `live-gpt54`: giliran agen OpenAI `openai/gpt-5.4` nyata, dilewati ketika `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber native OpenClaw setelah pass Kova: timing dan memori boot Gateway pada kasus startup default, hook, dan 50 plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; serta perintah startup CLI terhadap Gateway yang sudah diboot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundle laporan, dengan JSON mentah di sebelahnya.

Setiap lane mengunggah artefak GitHub. Ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, alur kerja juga mengcommit `report.json`, `report.md`, bundle, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer ref yang diuji saat ini ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah alur kerja payung manual untuk "menjalankan semuanya sebelum rilis." Alur kerja ini menerima cabang, tag, atau SHA commit penuh, mendispatch alur kerja `CI` manual dengan target tersebut, mendispatch `Plugin Prerelease` untuk bukti khusus rilis plugin/paket/statis/Docker, dan mendispatch `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, pemeriksaan paket lintas-OS, paritas QA Lab, Matrix, dan lane Telegram. Run stabil/default mempertahankan cakupan live/E2E dan Docker jalur rilis yang lengkap di balik `run_release_soak=true`; `release_profile=full` memaksa cakupan soak itu aktif agar validasi advisory yang luas tetap luas. Dengan `rerun_group=all` dan `release_profile=full`, alur kerja ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah publikasi, teruskan `npm_telegram_package_spec` untuk menjalankan ulang lane paket Telegram yang sama terhadap paket npm yang sudah dipublikasikan.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama job alur kerja yang tepat, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah alur kerja rilis mutatif manual. Dispatch
dari `release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah preflight
npm OpenClaw berhasil. Alur kerja ini memverifikasi `pnpm plugins:sync:check`,
mendispatch `Plugin NPM Release` untuk semua paket plugin yang dapat dipublikasikan, mendispatch
`Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru kemudian mendispatch
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
`headSha` workflow turunan cocok dengan target, dan menghapus branch sementara ketika
run selesai. Verifier payung juga gagal jika ada workflow turunan yang berjalan pada
SHA berbeda.

`release_profile` mengontrol keluasan live/provider yang diteruskan ke pemeriksaan rilis. Workflow
rilis manual default ke `stable`; gunakan `full` hanya ketika Anda
memang menginginkan matriks provider/media advisori yang luas. `run_release_soak`
mengontrol apakah pemeriksaan rilis stable/default menjalankan soak live/E2E lengkap dan
jalur rilis Docker; `full` memaksa soak aktif.

- `minimum` mempertahankan lane kritis rilis OpenAI/core yang paling cepat.
- `stable` menambahkan set provider/backend stable.
- `full` menjalankan matriks provider/media advisori yang luas.

Payung mencatat id run turunan yang di-dispatch, dan job akhir `Verify full validation` memeriksa ulang kesimpulan run turunan saat ini dan menambahkan tabel job terlambat untuk setiap run turunan. Jika workflow turunan dijalankan ulang dan menjadi hijau, jalankan ulang hanya job verifier induk untuk menyegarkan hasil payung dan ringkasan waktu.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk turunan CI penuh normal, `plugin-prerelease` hanya untuk turunan prarilis Plugin, `release-checks` untuk setiap turunan rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane cross-OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah cross-OS panjang mengeluarkan baris Heartbeat dan ringkasan packaged-upgrade menyertakan waktu per fase. Lane pemeriksaan rilis QA bersifat advisori, sehingga kegagalan hanya-QA memberi peringatan tetapi tidak memblokir verifier pemeriksaan rilis.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref yang dipilih sekali menjadi tarball `release-package-under-test`, lalu meneruskan artefak tersebut ke pemeriksaan cross-OS dan Package Acceptance, plus workflow Docker jalur rilis live/E2E ketika cakupan soak berjalan. Itu menjaga byte paket konsisten di seluruh kotak rilis dan menghindari pengemasan ulang kandidat yang sama di beberapa job turunan.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan payung yang lebih lama. Monitor induk membatalkan workflow turunan apa pun yang
sudah di-dispatch ketika induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang run pemeriksaan rilis lama selama dua jam. Validasi branch/tag
rilis dan grup rerun terfokus tetap menggunakan `cancel-in-progress: false`.

## Shard Live dan E2E

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
- shard audio/video media terpisah dan shard musik yang difilter provider

Itu mempertahankan cakupan file yang sama sambil membuat kegagalan provider live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh workflow `Live Media Runner Image`. Image tersebut melakukan pra-instal `ffmpeg` dan `ffprobe`; job media hanya memverifikasi biner sebelum setup. Pertahankan suite live berbasis Docker di runner Blacksmith normal — job container bukan tempat yang tepat untuk meluncurkan pengujian Docker bersarang.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Workflow rilis live membangun dan mendorong image tersebut sekali, lalu shard model live Docker, Gateway yang di-shard per provider, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` eksplisit tingkat skrip di bawah timeout job workflow agar container atau jalur cleanup yang macet gagal cepat alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah dikonfigurasi dan akan membuang waktu dinding pada build image duplikat.

## Package Acceptance

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan package acceptance memvalidasi satu tarball melalui harness Docker E2E yang sama yang digunakan pengguna setelah install atau update.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref workflow, ref paket, versi, SHA-256, dan profil dalam ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow reusable mengunduh artefak tersebut, memvalidasi inventaris tarball, menyiapkan image Docker digest paket saat diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket tersebut alih-alih mengemas checkout workflow. Ketika sebuah profil memilih beberapa `docker_lanes` bertarget, workflow reusable menyiapkan paket dan image bersama sekali, lalu menyebarkan lane tersebut sebagai job Docker bertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama ketika Package Acceptance menyelesaikan satu paket; dispatch Telegram mandiri masih dapat menginstal spesifikasi npm yang dipublikasikan.
4. `summary` menggagalkan workflow jika penyelesaian paket, Docker acceptance, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw eksak seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk acceptance prarilis/stable yang dipublikasikan.
- `source=ref` mengemas branch, tag, atau SHA commit penuh `package_ref` yang tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, menginstal dependensi dalam worktree detached, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — potongan jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` eksak; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan ulang artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan khusus pengujian update dan Plugin, termasuk perintah lokal,
lane Docker, input Package Acceptance, default rilis, dan triase kegagalan,
lihat [Menguji update dan Plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Package Acceptance dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, update, instal Skills ClawHub live, cleanup dependensi Plugin usang, perbaikan install Plugin terkonfigurasi, Plugin offline, update Plugin, dan bukti Telegram pada tarball paket terselesaikan yang sama. Atur `package_acceptance_package_spec` pada Full Release Validation atau OpenClaw Release Checks untuk menjalankan matriks yang sama terhadap paket npm yang sudah dikirim alih-alih artefak yang dibangun dari SHA. Pemeriksaan rilis cross-OS masih mencakup onboarding khusus OS, installer, dan perilaku platform; validasi produk package/update harus dimulai dengan Package Acceptance. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run dalam jalur rilis pemblokir. Dalam Package Acceptance, tarball `package-under-test` yang terselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline publikasi fallback, dengan default `openclaw@latest`; perintah rerun lane gagal mempertahankan baseline tersebut. Full Release Validation dengan `run_release_soak=true` atau `release_profile=full` mengatur `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas ke empat rilis npm stable terbaru plus rilis batas kompatibilitas Plugin yang dipin dan fixture berbentuk isu untuk config Feishu, file bootstrap/persona yang dipertahankan, install Plugin OpenClaw terkonfigurasi, jalur log tilde, dan root dependensi Plugin legacy usang. Pilihan published-upgrade survivor multi-baseline di-shard berdasarkan baseline ke dalam job runner Docker bertarget terpisah. Workflow `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah cleanup update publikasi lengkap, bukan keluasan CI Full Release normal. Run agregat lokal dapat meneruskan spesifikasi paket eksak dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau mengatur `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane yang dipublikasikan mengonfigurasi baseline dengan resep perintah `openclaw config set` bawaan, mencatat langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway start. Lane Windows packaged dan installer fresh juga memverifikasi bahwa paket yang terinstal dapat mengimpor override browser-control dari jalur Windows absolut mentah. Smoke agent-turn cross-OS OpenAI default ke `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika diatur, jika tidak `openai/gpt-5.4`, sehingga bukti install dan Gateway tetap berada pada model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas lama

Penerimaan Paket memiliki jendela kompatibilitas lama yang terbatas untuk paket yang sudah diterbitkan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui di `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` yang dipersistensikan hilang;
- smoke plugin dapat membaca lokasi install-record lama atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan install record dan perilaku tanpa instal ulang tetap tidak berubah.

Paket `2026.4.26` yang diterbitkan juga dapat memberi peringatan untuk file stempel metadata build lokal yang sudah dikirimkan. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama akan gagal, bukan memberi peringatan atau dilewati.

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

Saat men-debug proses penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa child run `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, waktu fase, dan perintah rerun. Lebih baik jalankan ulang profil paket yang gagal atau lane Docker yang tepat daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Workflow `Install Smoke` terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh surface Docker/paket, perubahan paket/manifest plugin bawaan, atau surface inti plugin/channel/gateway/Plugin SDK yang diuji oleh job smoke Docker. Perubahan plugin bawaan yang hanya menyentuh sumber, edit yang hanya menyentuh pengujian, dan edit yang hanya menyentuh dokumentasi tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e gateway-network container, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker plugin bawaan yang dibatasi di bawah timeout perintah agregat 240 detik (setiap Docker run skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan instalasi paket QR dan cakupan Docker/update installer untuk run terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh surface installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR SHA target, lalu menjalankan instalasi paket QR, smoke Dockerfile root/gateway, smoke installer/update, dan E2E Docker plugin bawaan cepat sebagai job terpisah agar pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; ketika logika cakupan perubahan akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi malam atau rilis.

Smoke image-provider instalasi global Bun yang lambat digating secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat memilih untuk menyertakannya, tetapi pull request dan push `main` tidak. Pengujian Docker QR dan installer mempertahankan Dockerfile berfokus instalasi masing-masing.

## E2E Docker Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw satu kali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi rencana yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Yang Dapat Disetel

| Variabel                               | Default | Tujuan                                                                                        |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif provider.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live bersamaan agar provider tidak melakukan throttle.                             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instalasi npm bersamaan.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service bersamaan.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jarak antar awal lane untuk menghindari lonjakan create daemon Docker; setel `0` tanpa jeda.  |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/tail tertentu menggunakan batas lebih ketat. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak rencana scheduler tanpa menjalankan lane.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane tepat yang dipisahkan koma; melewati smoke cleanup agar agen dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya masih dapat dimulai dari pool kosong, lalu berjalan sendiri sampai kapasitas dilepaskan. Agregat lokal melakukan preflight Docker, menghapus container E2E OpenClaw yang usang, mengeluarkan status lane aktif, mempertahankan waktu lane untuk pengurutan terlama dulu, dan secara default berhenti menjadwalkan lane pooled baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan kepada `scripts/test-docker-all.mjs --plan-json` cakupan paket, jenis image, image live, lane, dan kredensial apa yang diperlukan. `scripts/docker-e2e.mjs` lalu mengonversi rencana itu menjadi output dan ringkasan GitHub. Workflow ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket run saat ini, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/fungsional bertag digest paket melalui cache layer Docker Blacksmith ketika rencana membutuhkan lane dengan paket terinstal; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang diberikan atau image digest paket yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout 180 detik per upaya yang dibatasi agar stream registry/cache yang macet dicoba ulang dengan cepat, bukan menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkannya dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer provider.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` ketika cakupan jalur rilis penuh memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane update bundled-channel mencoba ulang satu kali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, waktu, `summary.json`, `failures.json`, waktu fase, JSON rencana scheduler, tabel lane lambat, dan perintah rerun per lane. Input workflow `docker_lanes` menjalankan lane yang dipilih terhadap image yang sudah disiapkan alih-alih job chunk, sehingga debugging lane gagal tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk run tersebut; jika lane yang dipilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun itu. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan ketika nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image yang tepat dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker jalur rilis penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, sehingga menjadi workflow terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri membiarkan suite itu nonaktif. Ini menyeimbangkan pengujian plugin bawaan di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch plugin dengan banyak import tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis membatch lane Docker tertarget dalam grup kecil untuk menghindari pencadangan puluhan runner bagi job berdurasi satu hingga tiga menit.

## Lab QA

Lab QA memiliki lane CI khusus di luar workflow cakupan cerdas utama. Paritas agentic berada di bawah harness QA dan rilis yang luas, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus ikut dalam run validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan setiap malam di `main` dan pada dispatch manual; workflow ini menyebarkan lane paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan jalur transport langsung Matrix dan Telegram dengan penyedia tiruan deterministik dan model yang memenuhi syarat tiruan (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) agar kontrak kanal terisolasi dari latensi model langsung dan startup provider-plugin normal. Gateway transport langsung menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh rangkaian model langsung, penyedia native, dan penyedia Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gerbang terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan masukan workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu memecah cakupan Matrix penuh menjadi pekerjaan `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan jalur QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gerbang paritas QA-nya menjalankan paket kandidat dan baseline sebagai pekerjaan jalur paralel, lalu mengunduh kedua artefak ke dalam pekerjaan laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/pemeriksaan yang tercakup, bukan memperlakukan paritas sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja merupakan pemindai keamanan tahap awal yang sempit, bukan penyisiran repositori penuh. Pemeriksaan harian, manual, dan penjaga pull request non-draft memindai kode workflow Actions ditambah permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Penjaga pull request tetap ringan: ia hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti workflow terjadwal. CodeQL Android dan macOS tetap di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret, sandbox, cron, dan baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi kanal inti ditambah runtime plugin kanal, gateway, Plugin SDK, secret, titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan SSRF inti, parsing IP, penjaga jaringan, web-fetch, dan kebijakan SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman outbound, dan gerbang eksekusi alat agen                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifes, registri, instalasi package-manager, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh kewarasan workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL pada Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dijaga di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ia hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error pada permukaan sempit bernilai tinggi di runner Blacksmith Linux yang lebih kecil. Penjaga pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draft hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk perubahan kode eksekusi perintah/model/alat agen dan dispatch balasan, kode skema/migrasi/IO konfigurasi, kode auth/secret/sandbox/keamanan, runtime kanal inti dan plugin kanal bawaan, protokol gateway/metode server, runtime memori/perekat SDK, MCP/proses/pengiriman outbound, runtime penyedia/katalog model, diagnostik sesi/antrean pengiriman, loader plugin, Plugin SDK/kontrak-paket, atau runtime balasan Plugin SDK. Perubahan konfigurasi CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Permukaan                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secret, sandbox, cron, dan kode batas keamanan gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Skema konfigurasi, migrasi, normalisasi, dan kontrak IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi kanal inti dan plugin kanal bawaan                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Eksekusi perintah, dispatch model/penyedia, dispatch dan antrean auto-reply, serta kontrak runtime bidang kontrol ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge alat, helper supervisi proses, serta kontrak pengiriman outbound                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, fasad runtime memori, alias Plugin SDK memori, perekat aktivasi runtime memori, dan perintah doctor memori                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper pengikatan/pengiriman sesi outbound, permukaan event/log bundle diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan inbound Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan kanal, antrean pengiriman, dan helper pengikatan sesi/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery penyedia, registrasi runtime penyedia, default/katalog penyedia, serta registri web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol gateway, dan kontrak runtime bidang kontrol tugas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, image-generation, dan media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registri, permukaan publik, dan entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket plugin                                                                                      |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan plugin bawaan harus ditambahkan kembali sebagai pekerjaan lanjutan yang tercakup atau di-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Workflow pemeliharaan

### Docs Agent

Workflow `Docs Agent` adalah jalur pemeliharaan Codex berbasis event untuk menjaga dokumentasi yang ada tetap selaras dengan perubahan yang baru mendarat. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Pemanggilan workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-dilewati lainnya dibuat dalam satu jam terakhir. Saat berjalan, ia meninjau rentang commit dari SHA sumber Docs Agent non-dilewati sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak lintasan dokumen terakhir.

### Test Performance Agent

Workflow `Test Performance Agent` adalah jalur pemeliharaan Codex berbasis event untuk pengujian lambat. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, tetapi ia melewati jika pemanggilan workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC itu. Dispatch manual melewati gerbang aktivitas harian tersebut. Jalur ini membangun laporan performa Vitest seluruh rangkaian yang dikelompokkan, membiarkan Codex hanya membuat perbaikan performa pengujian kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan seluruh rangkaian dan menolak perubahan yang mengurangi jumlah pengujian baseline yang lulus. Jika baseline memiliki pengujian yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan seluruh rangkaian setelah agen harus lulus sebelum apa pun di-commit. Ketika `main` maju sebelum push bot mendarat, jalur ini me-rebase patch yang tervalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch lama yang berkonflik dilewati. Ia menggunakan Ubuntu yang di-host GitHub agar aksi Codex dapat mempertahankan postur keselamatan drop-sudo yang sama seperti agen dokumen.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat setelah mendarat. Defaultnya dry-run dan hanya menutup PR yang dicantumkan secara eksplisit ketika `apply=true`. Sebelum memutasi GitHub, ia memverifikasi bahwa PR yang mendarat sudah di-merge dan bahwa setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gerbang pemeriksaan lokal dan perutean perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gerbang pemeriksaan lokal itu lebih ketat tentang batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan pemeriksaan tipe produksi inti dan pengujian inti serta lint/guard inti;
- perubahan khusus pengujian inti hanya menjalankan pemeriksaan tipe pengujian inti serta lint inti;
- perubahan produksi ekstensi menjalankan pemeriksaan tipe produksi ekstensi dan pengujian ekstensi serta lint ekstensi;
- perubahan khusus pengujian ekstensi menjalankan pemeriksaan tipe pengujian ekstensi serta lint ekstensi;
- perubahan Plugin SDK publik atau kontrak plugin diperluas ke pemeriksaan tipe ekstensi karena ekstensi bergantung pada kontrak inti tersebut (sweep ekstensi Vitest tetap menjadi pekerjaan pengujian eksplisit);
- kenaikan versi yang hanya metadata rilis menjalankan pemeriksaan versi/config/dependensi-root yang ditargetkan;
- perubahan root/config yang tidak diketahui gagal aman ke semua jalur pemeriksaan.

Perutean pengujian berubah lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit pengujian langsung menjalankan dirinya sendiri, edit sumber mengutamakan pemetaan eksplisit, lalu pengujian saudara dan dependen graf impor. Konfigurasi pengiriman ruang-grup bersama adalah salah satu pemetaan eksplisit: perubahan pada config balasan-terlihat grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui pengujian balasan inti serta regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas di seluruh harness sehingga set terpetakan murah bukan proksi yang dapat dipercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan utamakan box baru yang sudah dipanaskan untuk bukti luas. Sebelum menghabiskan gate lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sinkronisasi yang besar secara tidak terduga, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat ketika file root wajib seperti `pnpm-lock.yaml` hilang atau ketika `git status --short` menampilkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sinkronisasi jarak jauh bukan salinan PR yang dapat dipercaya; hentikan box tersebut dan panaskan yang baru, bukan men-debug kegagalan pengujian produk. Untuk PR penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk proses sanity tersebut.

`pnpm testbox:run` juga mengakhiri pemanggilan CLI Blacksmith lokal yang tetap berada di fase sinkronisasi selama lebih dari lima menit tanpa output pascasinkronisasi. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard tersebut, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang sangat besar.

Crabbox adalah wrapper remote-box milik repo untuk bukti Linux maintainer. Gunakan ketika pemeriksaan terlalu luas untuk loop edit lokal, ketika paritas CI penting, atau ketika bukti memerlukan secret, Docker, jalur paket, box yang dapat digunakan ulang, atau log jarak jauh. Backend OpenClaw normal adalah `blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah cadangan untuk outage Blacksmith, masalah kuota, atau pengujian kapasitas milik sendiri yang eksplisit.

Sebelum proses pertama, periksa wrapper dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo menolak biner Crabbox usang yang tidak mengiklankan `blacksmith-testbox`. Lewatkan provider secara eksplisit meskipun `.crabbox.yaml` memiliki default owned-cloud.

Gate berubah:

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

Baca ringkasan JSON akhir. Field yang berguna adalah `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Proses Crabbox sekali jalan yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis; jika proses terinterupsi atau pembersihan tidak jelas, periksa box aktif dan hentikan hanya box yang Anda buat:

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

Jika Crabbox adalah lapisan yang rusak tetapi Blacksmith sendiri berfungsi, gunakan Blacksmith langsung sebagai cadangan sempit:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Jika `blacksmith testbox list --all` dan `blacksmith testbox status` berfungsi tetapi warmup baru tetap `queued` tanpa IP atau URL proses Actions setelah beberapa menit, perlakukan itu sebagai tekanan provider, antrean, penagihan, atau batas org Blacksmith. Hentikan id antrean yang Anda buat, hindari memulai lebih banyak Testbox, dan pindahkan bukti ke jalur kapasitas Crabbox milik sendiri di bawah ini sementara seseorang memeriksa dasbor, penagihan, dan batas org Blacksmith.

Eskalasi ke kapasitas Crabbox milik sendiri hanya ketika Blacksmith sedang down, dibatasi kuota, tidak memiliki lingkungan yang diperlukan, atau kapasitas milik sendiri memang menjadi tujuan eksplisit:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Di bawah tekanan AWS, hindari `class=beast` kecuali tugas benar-benar memerlukan CPU kelas 48xlarge. Permintaan `beast` dimulai dari 192 vCPU dan merupakan cara termudah untuk memicu kuota EC2 Spot regional atau On-Demand Standard. `.crabbox.yaml` milik repo secara default menggunakan `standard`, beberapa wilayah kapasitas, dan `capacity.hints: true` sehingga lease AWS yang dibrokeri mencetak wilayah/market terpilih, tekanan kuota, cadangan Spot, dan peringatan kelas bertekanan tinggi. Gunakan `fast` untuk pemeriksaan luas yang lebih berat, `large` hanya setelah standard/fast tidak cukup, dan `beast` hanya untuk jalur luar biasa yang terikat CPU seperti suite penuh atau matriks Docker semua-plugin, validasi rilis/blocker eksplisit, atau profiling performa high-core. Jangan gunakan `beast` untuk `pnpm check:changed`, pengujian terfokus, pekerjaan khusus docs, lint/pemeriksaan tipe biasa, repro E2E kecil, atau triase outage Blacksmith. Gunakan `--market on-demand` untuk diagnosis kapasitas agar gejolak market Spot tidak tercampur ke dalam sinyal.

`.crabbox.yaml` mengatur default provider, sinkronisasi, dan hidrasi GitHub Actions untuk jalur owned-cloud. File ini mengecualikan `.git` lokal sehingga checkout Actions terhidrasi mempertahankan metadata Git jarak jauhnya sendiri, bukan menyinkronkan remote dan object store lokal maintainer, serta mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` mengatur checkout, penyiapan Node/pnpm, fetch `origin/main`, dan handoff lingkungan non-secret untuk perintah owned-cloud `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
