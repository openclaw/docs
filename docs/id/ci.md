---
read_when:
    - Anda perlu memahami mengapa sebuah pekerjaan CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pengulangan validasi rilis
    - Anda mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Grafik pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-11T20:22:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan mematikan lane mahal ketika hanya area yang tidak terkait yang berubah. Jalankan `workflow_dispatch` manual secara sengaja melewati pelingkupan cerdas dan menyebarkan graf penuh untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan plugin khusus rilis berada di workflow [`Plugin Prerelease`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Full Release Validation`](#full-release-validation) atau dispatch manual eksplisit.

## Ringkasan pipeline

| Job                              | Tujuan                                                                                                   | Kapan berjalan                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Mendeteksi perubahan khusus docs, cakupan yang berubah, extension yang berubah, dan membangun manifes CI | Selalu pada push non-draft dan PR    |
| `security-scm-fast`              | Deteksi kunci privat dan audit workflow melalui `zizmor`                                                 | Selalu pada push non-draft dan PR    |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependensi terhadap advisories npm                                         | Selalu pada push non-draft dan PR    |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                                   | Selalu pada push non-draft dan PR    |
| `check-dependencies`             | Pass khusus dependensi Knip produksi ditambah guard allowlist file yang tidak digunakan                  | Perubahan relevan Node               |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak build, dan artefak downstream yang dapat digunakan ulang | Perubahan relevan Node            |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol                          | Perubahan relevan Node               |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil                   | Perubahan relevan Node               |
| `checks-node-core-test`          | Shard pengujian Node inti, mengecualikan lane channel, bundled, contract, dan extension                  | Perubahan relevan Node               |
| `check`                          | Padanan gate lokal utama yang di-shard: tipe prod, lint, guard, tipe test, dan smoke ketat               | Perubahan relevan Node               |
| `check-additional`               | Arsitektur, drift boundary/prompt yang di-shard, guard extension, boundary paket, dan gateway watch      | Perubahan relevan Node               |
| `build-smoke`                    | Pengujian smoke built-CLI dan smoke startup-memory                                                       | Perubahan relevan Node               |
| `checks`                         | Verifier untuk pengujian channel artefak build                                                           | Perubahan relevan Node               |
| `checks-node-compat-node22`      | Lane build kompatibilitas Node 22 dan smoke                                                              | Dispatch CI manual untuk rilis       |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan tautan rusak                                                     | Docs berubah                         |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                               | Perubahan relevan Python-skill       |
| `checks-windows`                 | Pengujian proses/path khusus Windows ditambah regresi specifier impor runtime bersama                    | Perubahan relevan Windows            |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artefak build bersama                                        | Perubahan relevan macOS              |
| `macos-swift`                    | Swift lint, build, dan test untuk aplikasi macOS                                                         | Perubahan relevan macOS              |
| `android`                        | Pengujian unit Android untuk kedua flavor ditambah satu build APK debug                                  | Perubahan relevan Android            |
| `test-performance-agent`         | Optimisasi pengujian lambat Codex harian setelah aktivitas tepercaya                                     | CI main berhasil atau dispatch manual |
| `openclaw-performance`           | Laporan performa runtime Kova harian/sesuai permintaan dengan lane mock-provider, deep-profile, dan live GPT 5.4 | Terjadwal dan dispatch manual |

## Urutan fail-fast

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job matriks artefak dan platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat agar konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR yang sama atau ref `main`. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tergantikan. Kunci konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub di grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

Job `ci-timings-summary` mengunggah artefak `ci-timings-summary` ringkas untuk setiap run CI non-draft. Artefak ini mencatat wall time, queue time, job paling lambat, dan job yang gagal untuk run saat ini, sehingga pemeriksaan kesehatan CI tidak perlu berulang kali mengikis payload Actions penuh.

## Cakupan dan routing

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area bercakupan berubah.

- **Edit workflow CI** memvalidasi graf CI Node ditambah linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap dicakup ke perubahan sumber platform.
- **Edit khusus routing CI, edit fixture core-test murah tertentu, dan edit helper/test-routing kontrak plugin yang sempit** menggunakan jalur manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard inti penuh, shard bundled-plugin, dan matriks guard tambahan ketika perubahan terbatas pada permukaan routing atau helper yang langsung dilatih oleh tugas cepat tersebut.
- **Pemeriksaan Node Windows** dicakup ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang menjalankan lane itu; perubahan sumber, plugin, install-smoke, dan khusus test yang tidak terkait tetap berada di lane Linux Node.

Keluarga pengujian Node paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner secara berlebihan: kontrak channel berjalan sebagai tiga shard berbobot yang didukung Blacksmith dengan fallback runner GitHub standar, lane core unit fast/support berjalan terpisah, infra runtime inti dibagi antara shard state, process/config, cron, dan shared, auto-reply berjalan sebagai worker seimbang (dengan subtree reply dipecah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi agentic gateway/server dibagi ke seluruh lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artefak build. Pengujian browser, QA, media, dan plugin miscellaneous yang luas menggunakan konfigurasi Vitest khususnya alih-alih catch-all plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan keseluruhan konfigurasi dari shard yang difilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur runtime topology dari cakupan gateway watch; daftar guard boundary distriping ke empat shard matriks, masing-masing menjalankan guard independen terpilih secara paralel dan mencetak timing per pemeriksaan. Pemeriksaan drift snapshot prompt happy-path Codex yang mahal berjalan sebagai job tambahan tersendiri untuk CI manual dan hanya untuk perubahan yang memengaruhi prompt, sehingga perubahan Node normal yang tidak terkait tidak menunggu di belakang pembuatan snapshot prompt dingin dan shard boundary tetap seimbang sementara drift prompt tetap dipatok ke PR yang menyebabkannya; flag yang sama melewati pembuatan snapshot prompt Vitest di dalam shard support-boundary inti artefak build. Gateway watch, pengujian channel, dan shard support-boundary inti berjalan secara paralel di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

Android CI menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifest terpisah; lane pengujian unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipatok ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file produksi yang tidak digunakan dari Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard file yang tidak digunakan gagal ketika PR menambahkan file tidak digunakan baru yang belum ditinjau atau meninggalkan entri allowlist basi, sambil mempertahankan permukaan plugin dinamis, generated, build, live-test, dan package bridge yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow memiliki empat lane:

- `clawsweeper_item` untuk permintaan tinjauan issue dan pull request yang tepat;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit di komentar issue;
- `clawsweeper_commit_review` untuk permintaan tinjauan tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diinspeksi oleh agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: tipe event, tindakan, aktor, repositori, nomor item, URL, judul, status, dan kutipan singkat untuk komentar atau review saat ada. Lane ini secara sengaja menghindari penerusan body webhook penuh. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event ternormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam promptnya dan hanya boleh memposting ke `#clawsweeper` ketika event tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise webhook duplikat, dan traffic review normal harus menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, isi, teks ulasan, nama cabang, dan pesan commit GitHub sebagai data tidak tepercaya di seluruh jalur ini. Itu adalah input untuk peringkasan dan triase, bukan instruksi untuk workflow atau runtime agen.

## Dispatch Manual

Dispatch CI manual menjalankan graf pekerjaan yang sama seperti CI normal tetapi memaksa setiap lane berskala non-Android aktif: shard Linux Node, shard Plugin terbundel, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Python Skills, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android saja dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prerelease Plugin, shard khusus rilis `agentic-plugins`, sweep batch extension penuh, dan lane Docker prerelease Plugin dikecualikan dari CI. Suite Docker prerelease hanya berjalan ketika `Full Release Validation` mendispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan concurrency group unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh push lain atau run PR pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan graf tersebut terhadap cabang, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, pekerjaan keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/terbundel cepat, pemeriksaan kontrak channel tersharding, shard `check` kecuali lint, agregat `check-additional`, verifikator agregat pengujian Node, pemeriksaan docs, Python Skills, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard extension berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, shard pengujian Linux Node, shard pengujian Plugin terbundel, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (cukup sensitif CPU sehingga 8 vCPU lebih mahal daripada penghematan yang diberikan); build Docker install-smoke (biaya waktu antrean 32-vCPU lebih besar daripada penghematan yang diberikan)                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

CI repo kanonis mempertahankan Blacksmith sebagai jalur runner default. Selama `preflight`, `scripts/ci-runner-labels.mjs` memeriksa run Actions terbaru yang sedang mengantre dan berjalan untuk pekerjaan Blacksmith yang sedang mengantre. Jika label Blacksmith tertentu sudah memiliki pekerjaan yang mengantre, pekerjaan downstream yang akan menggunakan label persis tersebut fallback ke runner yang di-host GitHub yang sesuai (`ubuntu-24.04`, `windows-2025`, atau `macos-latest`) hanya untuk run tersebut. Ukuran Blacksmith lain dalam keluarga OS yang sama tetap menggunakan label primernya. Jika probe API gagal, fallback tidak diterapkan.

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

`OpenClaw Performance` adalah workflow performa produk/runtime. Workflow ini berjalan harian pada `main` dan dapat didispatch secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch manual biasanya melakukan benchmark pada ref workflow. Atur `target_ref` untuk melakukan benchmark pada tag rilis atau cabang lain dengan implementasi workflow saat ini. Jalur laporan yang dipublikasikan dan pointer terbaru dikunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA workflow, ref Kova, profil, mode auth lane, model, jumlah pengulangan, dan filter skenario.

Workflow menginstal OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan auth kompatibel OpenAI palsu yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, Gateway, dan giliran agen.
- `live-gpt54`: giliran agen OpenAI `openai/gpt-5.4` nyata, dilewati ketika `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber asli OpenClaw setelah pass Kova: waktu boot Gateway dan memori pada kasus startup default, hook, dan 50-Plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; dan perintah startup CLI terhadap Gateway yang sudah di-boot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundel laporan, dengan JSON mentah di sebelahnya.

Setiap lane mengunggah artefak GitHub. Ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, workflow juga meng-commit `report.json`, `report.md`, bundel, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer ref yang diuji saat ini ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow payung manual untuk "menjalankan semuanya sebelum rilis." Workflow ini menerima cabang, tag, atau SHA commit penuh, mendispatch workflow `CI` manual dengan target tersebut, mendispatch `Plugin Prerelease` untuk bukti khusus rilis Plugin/paket/statis/Docker, dan mendispatch `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, pemeriksaan paket lintas-OS, paritas QA Lab, Matrix, dan lane Telegram. Run stable/default mempertahankan cakupan live/E2E dan jalur rilis Docker yang menyeluruh di balik `run_release_soak=true`; `release_profile=full` memaksa cakupan soak tersebut aktif sehingga validasi advisory yang luas tetap luas. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah publikasi, teruskan `release_package_spec` untuk menggunakan kembali paket npm yang sudah dikirim di seluruh pemeriksaan rilis, Package Acceptance, Docker, lintas-OS, dan Telegram tanpa membangun ulang. Gunakan `npm_telegram_package_spec` hanya ketika Telegram harus membuktikan paket yang berbeda.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama pekerjaan workflow yang persis, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah workflow rilis manual yang mengubah state. Dispatch workflow ini
dari `release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah preflight npm
OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`,
mendispatch `Plugin NPM Release` untuk semua paket Plugin yang dapat dipublikasikan, mendispatch
`Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru kemudian mendispatch
`OpenClaw NPM Release` dengan `preflight_run_id` yang tersimpan.

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

Ref dispatch workflow GitHub harus berupa branch atau tag, bukan SHA commit mentah.
Helper mendorong branch sementara `release-ci/<sha>-...` pada SHA target,
menjalankan dispatch `Full Release Validation` dari ref yang dipin tersebut, memverifikasi setiap
workflow anak `headSha` cocok dengan target, dan menghapus branch sementara saat
run selesai. Verifier umbrella juga gagal jika ada workflow anak yang berjalan pada
SHA berbeda.

`release_profile` mengontrol cakupan live/provider yang diteruskan ke pemeriksaan rilis. Workflow
rilis manual default ke `stable`; gunakan `full` hanya ketika Anda
sengaja menginginkan matriks provider/media advisory yang luas. `run_release_soak`
mengontrol apakah pemeriksaan rilis stabil/default menjalankan soak live/E2E dan
jalur rilis Docker yang menyeluruh; `full` memaksa soak aktif.

- `minimum` mempertahankan lane kritis rilis OpenAI/core yang paling cepat.
- `stable` menambahkan set provider/backend stabil.
- `full` menjalankan matriks provider/media advisory yang luas.

Umbrella mencatat id run anak yang didispatch, dan job akhir `Verify full validation` memeriksa ulang kesimpulan run anak saat ini serta menambahkan tabel job paling lambat untuk setiap run anak. Jika sebuah workflow anak dijalankan ulang dan menjadi hijau, jalankan ulang hanya job verifier induk untuk menyegarkan hasil umbrella dan ringkasan waktu.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` sama-sama menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk anak CI penuh normal, `plugin-prerelease` hanya untuk anak prarilis plugin, `release-checks` untuk setiap anak rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada umbrella. Ini menjaga rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane lintas-OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah lintas-OS yang panjang memancarkan baris Heartbeat dan ringkasan packaged-upgrade menyertakan waktu per fase. Lane pemeriksaan rilis QA bersifat advisory, jadi kegagalan hanya-QA memberi peringatan tetapi tidak memblokir verifier pemeriksaan rilis.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk me-resolve ref yang dipilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke pemeriksaan lintas-OS dan Penerimaan Paket, ditambah workflow Docker jalur rilis live/E2E saat cakupan soak berjalan. Ini menjaga byte paket konsisten di seluruh kotak rilis dan menghindari pemaketan ulang kandidat yang sama di beberapa job anak.

Run duplikat `Full Release Validation` untuk `ref=main` dan `rerun_group=all`
menggantikan umbrella yang lebih lama. Monitor induk membatalkan workflow anak apa pun yang
sudah didispatch ketika induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang run pemeriksaan rilis lama selama dua jam. Validasi branch/tag
rilis dan grup rerun terfokus tetap menggunakan `cancel-in-progress: false`.

## Shard Live dan E2E

Anak live/E2E rilis mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs`, bukan satu job serial:

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

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh workflow `Live Media Runner Image`. Image itu sudah menginstal `ffmpeg` dan `ffprobe`; job media hanya memverifikasi biner sebelum setup. Pertahankan suite live berbasis Docker di runner Blacksmith normal — job container bukan tempat yang tepat untuk meluncurkan test Docker bertingkat.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Workflow rilis live membangun dan mendorong image itu satu kali, lalu shard model live Docker, gateway yang dishard per provider, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` tingkat skrip eksplisit di bawah timeout job workflow agar container yang macet atau jalur cleanup gagal cepat, bukan menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah konfigurasi dan akan membuang waktu dinding untuk build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` saat pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness E2E Docker yang sama yang digunakan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, me-resolve satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref workflow, ref paket, versi, SHA-256, dan profil di ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker package-digest saat diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket tersebut, bukan memaketkan checkout workflow. Saat sebuah profil memilih beberapa `docker_lanes` tertarget, workflow reusable menyiapkan paket dan image bersama satu kali, lalu menyebarkan lane tersebut sebagai job Docker tertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama saat Penerimaan Paket me-resolve satu; dispatch Telegram mandiri tetap dapat menginstal spesifikasi npm yang diterbitkan.
4. `summary` menggagalkan workflow jika resolusi paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw eksak seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prarilis/stabil yang sudah diterbitkan.
- `source=ref` memaketkan branch, tag, atau SHA commit penuh `package_ref` yang tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, menginstal dependensi di worktree terlepas, dan memaketkannya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disertakan untuk artefak yang dibagikan secara eksternal.

Jaga `workflow_ref` dan `package_ref` tetap terpisah. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan test. `package_ref` adalah commit sumber yang dipaketkan saat `source=ref`. Ini memungkinkan harness test saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` ditambah `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` eksak; wajib saat `suite_profile=custom`

Profil `package` menggunakan cakupan plugin offline agar validasi paket yang diterbitkan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan kembali artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang diterbitkan dipertahankan untuk dispatch mandiri.

Untuk kebijakan khusus pengujian pembaruan dan plugin, termasuk perintah lokal,
lane Docker, input Penerimaan Paket, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Penerimaan Paket dengan `source=artifact`, artefak paket rilis yang sudah disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, dan `telegram_mode=mock-openai`. Ini menjaga migrasi paket, pembaruan, instalasi skill ClawHub langsung, pembersihan dependensi plugin usang, perbaikan instalasi plugin terkonfigurasi, plugin offline, pembaruan plugin, dan bukti Telegram pada tarball paket terselesaikan yang sama. Tetapkan `release_package_spec` pada Validasi Rilis Penuh atau Pemeriksaan Rilis OpenClaw setelah menerbitkan beta untuk menjalankan matriks yang sama terhadap paket npm yang sudah dikirim tanpa membangun ulang; tetapkan `package_acceptance_package_spec` hanya ketika Penerimaan Paket membutuhkan paket yang berbeda dari validasi rilis lainnya. Pemeriksaan rilis lintas OS tetap mencakup onboarding, installer, dan perilaku platform khusus OS; validasi produk paket/pembaruan harus dimulai dengan Penerimaan Paket. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket terbitan per run di jalur rilis pemblokir. Dalam Penerimaan Paket, tarball `package-under-test` yang diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline terbitan fallback, dengan default `openclaw@latest`; perintah rerun lane yang gagal mempertahankan baseline tersebut. Validasi Rilis Penuh dengan `run_release_soak=true` atau `release_profile=full` menetapkan `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas ke empat rilis npm stabil terbaru plus rilis batas kompatibilitas plugin yang dipin dan fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, instalasi plugin OpenClaw terkonfigurasi, jalur log tilde, dan root dependensi plugin legacy yang usang. Pilihan survivor published-upgrade multi-baseline di-shard berdasarkan baseline ke job runner Docker tertarget yang terpisah. Workflow `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah pembersihan pembaruan terbitan yang menyeluruh, bukan cakupan CI Validasi Rilis Penuh normal. Run agregat lokal dapat meneruskan spesifikasi paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane terbitan mengonfigurasi baseline dengan resep perintah `openclaw config set` yang sudah dibakukan, mencatat langkah resep dalam `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway dimulai. Lane paket Windows dan installer fresh juga memverifikasi bahwa paket yang terinstal dapat mengimpor override kontrol browser dari jalur Windows absolut mentah. Smoke agent-turn lintas OS OpenAI menggunakan default `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat ditetapkan, jika tidak `openai/gpt-5.4`, sehingga bukti instalasi dan gateway tetap memakai model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Penerimaan Paket memiliki jendela kompatibilitas legacy terbatas untuk paket yang sudah diterbitkan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang dikenal di `dist/postinstall-inventory.json` dapat mengarah ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `patchedDependencies` pnpm yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke plugin dapat membaca lokasi catatan instalasi legacy atau menerima persistensi catatan instalasi marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan catatan instalasi dan perilaku tanpa instal ulang tetap tidak berubah.

Paket `2026.4.26` yang diterbitkan juga dapat memperingatkan untuk file stempel metadata build lokal yang sudah dikirim. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama akan gagal, bukan memperingatkan atau melewati.

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

Saat men-debug run penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa run anak `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Lebih baik menjalankan ulang profil paket yang gagal atau lane Docker persis daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Workflow `Install Smoke` terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifest plugin bawaan, atau permukaan Plugin SDK/plugin/channel/gateway inti yang diuji oleh job smoke Docker. Perubahan plugin bawaan hanya sumber, edit hanya pengujian, dan edit hanya dokumentasi tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e gateway-network container, memverifikasi arg build extension bawaan, dan menjalankan profil Docker plugin bawaan terbatas di bawah timeout perintah agregat 240 detik (setiap run Docker skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan instalasi paket QR serta cakupan Docker/update installer untuk run terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instalasi paket QR, smoke Dockerfile/gateway root, smoke installer/update, dan E2E Docker plugin bawaan cepat sebagai job terpisah sehingga pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; saat logika cakupan perubahan akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi malam atau rilis.

Smoke image-provider instalasi global Bun yang lambat di-gate secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat memilih ikut menjalankannya, tetapi pull request dan push `main` tidak. Pengujian Docker QR dan installer mempertahankan Dockerfile berfokus instalasi milik masing-masing.

## E2E Docker Lokal

`pnpm test:docker:all` membangun awal satu image live-test bersama, mengemas OpenClaw satu kali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi rencana yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parameter yang dapat disetel

| Variabel                               | Default | Tujuan                                                                                        |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live serentak agar provider tidak melakukan throttle.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instalasi npm serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antarawal lane untuk menghindari lonjakan create daemon Docker; tetapkan `0` tanpa jeda. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/tail terpilih memakai batas lebih ketat.     |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak rencana scheduler tanpa menjalankan lane.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis dipisahkan koma; melewati smoke pembersihan agar agen dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya masih dapat dimulai dari pool kosong, lalu berjalan sendiri hingga melepas kapasitas. Agregat lokal melakukan preflight Docker, menghapus container E2E OpenClaw yang usang, memancarkan status lane aktif, mempertahankan timing lane untuk pengurutan terlama dulu, dan secara default berhenti menjadwalkan lane pool baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan kepada `scripts/test-docker-all.mjs --plan-json` paket, jenis image, image live, lane, dan cakupan kredensial mana yang diperlukan. `scripts/docker-e2e.mjs` lalu mengonversi rencana tersebut menjadi output dan ringkasan GitHub. Ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket current-run, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/functional bertag digest paket melalui cache layer Docker Blacksmith saat rencana membutuhkan lane dengan paket terinstal; serta menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout per percobaan 180 detik yang dibatasi sehingga stream registry/cache yang macet cepat dicoba ulang alih-alih menghabiskan sebagian besar jalur kritis CI.

### Potongan jalur rilis

Cakupan Docker rilis menjalankan job chunk lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkan dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Cuplikan Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat Plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane penginstal penyedia.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` ketika cakupan jalur rilis penuh memintanya, dan mempertahankan cuplikan mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane pembaruan kanal bundel mencoba ulang sekali untuk kegagalan jaringan npm yang sementara.

Setiap cuplikan mengunggah `.artifacts/docker-tests/` dengan log lane, pengaturan waktu, `summary.json`, `failures.json`, pengaturan waktu fase, JSON rencana scheduler, tabel lane lambat, dan perintah rerun per lane. Input workflow `docker_lanes` menjalankan lane yang dipilih terhadap image yang telah disiapkan alih-alih job cuplikan, sehingga debugging lane gagal tetap terbatas pada satu job Docker yang ditargetkan dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk run tersebut; jika lane yang dipilih adalah lane Docker live, job yang ditargetkan membangun image uji live secara lokal untuk rerun tersebut. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan ketika nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker jalur rilis penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, sehingga menjadi workflow terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri tidak menjalankan suite tersebut. Workflow ini menyeimbangkan pengujian Plugin bundel di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch Plugin dengan banyak impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis mengelompokkan lane Docker yang ditargetkan dalam grup kecil untuk menghindari pencadangan puluhan runner bagi job berdurasi satu hingga tiga menit. Workflow ini juga mengunggah artefak informasional `plugin-inspector-advisory` dari `@openclaw/plugin-inspector`; temuan inspector adalah input triase dan tidak mengubah gerbang pemblokir Plugin Prerelease.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow smart-scoped utama. Paritas agentic berada di bawah harness QA luas dan rilis, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus ikut dalam run validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan tiap malam di `main` dan pada dispatch manual; workflow ini menyebarkan lane paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan lingkungan `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan penyedia mock deterministik dan model berkualifikasi mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak kanal terisolasi dari latensi model live dan startup Plugin penyedia normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh suite model live, penyedia native, dan penyedia Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gerbang terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu memecah cakupan Matrix penuh menjadi job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gerbang paritas QA-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas akhir.

Untuk PR normal, ikuti bukti CI/pemeriksaan yang tercakup alih-alih memperlakukan paritas sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja menjadi pemindai keamanan tahap pertama yang sempit, bukan sapuan repositori penuh. Run harian, manual, dan guard pull request non-draf memindai kode workflow Actions plus permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Guard pull request tetap ringan: guard ini hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama dengan workflow terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret, sandbox, cron, dan baseline gateway                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi kanal inti plus runtime Plugin kanal, gateway, Plugin SDK, secret, titik sentuh audit                          |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF inti, parsing IP, guard jaringan, web-fetch, dan permukaan kebijakan SSRF Plugin SDK                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gerbang eksekusi alat agen                                               |
| `/codeql-security-high/plugin-trust-boundary`     | Instalasi Plugin, loader, manifest, registry, instalasi package-manager, source-loading, dan permukaan kepercayaan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Tetap berada di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan severity error pada permukaan bernilai tinggi yang sempit di runner Blacksmith Linux yang lebih kecil. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draf hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk perubahan kode perintah agen/model/eksekusi alat dan dispatch balasan, kode skema/migrasi/IO konfigurasi, kode auth/secret/sandbox/keamanan, runtime kanal inti dan Plugin kanal bundel, protokol Gateway/server-method, glue runtime memori/SDK, MCP/proses/pengiriman keluar, runtime penyedia/katalog model, diagnostik sesi/antrean pengiriman, loader Plugin, kontrak paket/Plugin SDK, atau runtime balasan Plugin SDK. Perubahan konfigurasi CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Permukaan                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan auth, secret, sandbox, Cron, dan Gateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema config, migrasi, normalisasi, dan IO                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan Plugin channel bawaan                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi perintah, dispatch model/provider, dispatch dan antrean auto-reply, serta control-plane ACP                                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge tool, helper supervisi proses, dan kontrak pengiriman outbound                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, facade runtime memori, alias SDK Plugin memori, perekat aktivasi runtime memori, dan perintah doctor memori                                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi outbound, permukaan event/log bundle diagnostik, dan kontrak CLI doctor sesi   |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan inbound SDK Plugin, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread            |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, serta registry web/search/fetch/embedding          |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol Gateway, dan kontrak runtime control-plane tugas                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, pembuatan gambar, dan pembuatan media                                                           |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint SDK Plugin                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber SDK Plugin sisi paket yang dipublikasikan dan helper kontrak paket plugin                                                                                   |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL untuk Swift, Python, dan Plugin bawaan harus ditambahkan kembali sebagai pekerjaan lanjutan yang terscope atau dishard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Alur Kerja Pemeliharaan

### Docs Agent

Alur kerja `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru saja masuk. Alur ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, dan dispatch manual dapat menjalankannya secara langsung. Invocation workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-skipped lain dibuat dalam satu jam terakhir. Saat berjalan, alur ini meninjau rentang commit dari SHA sumber Docs Agent non-skipped sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pass docs terakhir.

### Test Performance Agent

Alur kerja `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk test yang lambat. Alur ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, tetapi alur ini dilewati jika invocation workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC yang sama. Dispatch manual melewati gate aktivitas harian itu. Lane ini membuat laporan performa Vitest full-suite yang dikelompokkan, mengizinkan Codex hanya membuat perbaikan performa test kecil yang mempertahankan coverage, bukan refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah test baseline yang lolos. Jika baseline memiliki test yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agent harus lulus sebelum apa pun di-commit. Saat `main` maju sebelum push bot masuk, lane ini merebase patch yang telah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch stale yang berkonflik dilewati. Alur ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti docs agent.

### PR Duplikat Setelah Merge

Alur kerja `Duplicate PRs After Merge` adalah alur kerja maintainer manual untuk pembersihan duplikat pasca-land. Default-nya dry-run dan hanya menutup PR yang tercantum secara eksplisit saat `apply=true`. Sebelum memutasi GitHub, alur ini memverifikasi bahwa PR yang landed sudah di-merge dan setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate Check Lokal dan Routing Perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gate check lokal itu lebih ketat terhadap batas arsitektur dibanding cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan test inti serta lint/guard inti;
- perubahan khusus test inti hanya menjalankan typecheck test inti serta lint inti;
- perubahan produksi extension menjalankan typecheck prod extension dan test extension serta lint extension;
- perubahan khusus test extension menjalankan typecheck test extension serta lint extension;
- perubahan SDK Plugin publik atau kontrak plugin meluas ke typecheck extension karena extension bergantung pada kontrak inti tersebut (sweep extension Vitest tetap menjadi pekerjaan test eksplisit);
- bump versi khusus metadata rilis menjalankan check versi/config/dependensi-root yang ditargetkan;
- perubahan root/config yang tidak diketahui fail safe ke semua lane check.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit test langsung menjalankan dirinya sendiri, edit sumber mengutamakan mapping eksplisit, lalu test sibling dan dependent import-graph. Config pengiriman shared group-room adalah salah satu mapping eksplisit: perubahan pada config visible-reply grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui test balasan inti plus regresi pengiriman Discord dan Slack agar perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas di harness sehingga set murah yang dipetakan bukan proxy yang dapat dipercaya.

## Validasi Testbox

Crabbox adalah wrapper remote-box milik repo untuk proof Linux maintainer. Gunakan dari root repo ketika sebuah check terlalu luas untuk local edit loop, ketika paritas CI penting, atau ketika proof membutuhkan secret, Docker, package lane, box yang dapat dipakai ulang, atau log remote. Backend OpenClaw normal adalah `blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah fallback untuk outage Blacksmith, masalah kuota, atau pengujian kapasitas milik sendiri yang eksplisit.

Run Blacksmith yang didukung Crabbox melakukan warm, claim, sync, run, report, dan cleanup Testbox one-shot. Sync sanity check bawaan gagal cepat ketika file root yang diperlukan seperti `pnpm-lock.yaml` hilang atau ketika `git status --short` menunjukkan setidaknya 200 penghapusan terlacak. Untuk PR penghapusan besar yang disengaja, set `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk perintah remote.

Crabbox juga menghentikan invocation CLI Blacksmith lokal yang tetap berada dalam fase sync selama lebih dari lima menit tanpa output pasca-sync. Set `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard itu, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang luar biasa besar.

Sebelum run pertama, periksa wrapper dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo menolak binary Crabbox stale yang tidak mengiklankan `blacksmith-testbox`. Teruskan provider secara eksplisit meskipun `.crabbox.yaml` memiliki default owned-cloud.

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

Rerun test terfokus:

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

Full suite:

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

Baca ringkasan JSON akhir. Field yang berguna adalah `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Run Crabbox one-shot yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis; jika sebuah run terinterupsi atau cleanup tidak jelas, periksa box live dan hentikan hanya box yang Anda buat:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gunakan reuse hanya ketika Anda secara sengaja memerlukan beberapa perintah pada box hydrated yang sama:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jika Crabbox adalah lapisan yang rusak tetapi Blacksmith sendiri berfungsi, gunakan Blacksmith langsung hanya untuk diagnostik seperti `list`, `status`, dan cleanup. Perbaiki jalur Crabbox sebelum memperlakukan run Blacksmith langsung sebagai proof maintainer.

Jika `blacksmith testbox list --all` dan `blacksmith testbox status` berfungsi tetapi warmup baru tetap `queued` tanpa IP atau URL run Actions setelah beberapa menit, perlakukan itu sebagai tekanan provider, antrean, billing, atau batas org Blacksmith. Hentikan id queued yang Anda buat, hindari memulai lebih banyak Testbox, dan pindahkan proof ke jalur kapasitas Crabbox milik sendiri di bawah sementara seseorang memeriksa dashboard, billing, dan batas org Blacksmith.

Eskalasi ke kapasitas Crabbox milik sendiri hanya ketika Blacksmith down, dibatasi kuota, tidak memiliki lingkungan yang dibutuhkan, atau kapasitas milik sendiri adalah tujuan eksplisit:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Saat kapasitas AWS sedang tertekan, hindari `class=beast` kecuali tugasnya benar-benar membutuhkan CPU kelas 48xlarge. Permintaan `beast` dimulai dari 192 vCPU dan merupakan cara termudah untuk mencapai batas kuota EC2 Spot atau On-Demand Standard regional. `.crabbox.yaml` milik repo memiliki default `standard`, beberapa wilayah kapasitas, dan `capacity.hints: true` sehingga lease AWS yang diperantarai broker mencetak wilayah/pasar yang dipilih, tekanan kuota, fallback Spot, dan peringatan kelas tekanan tinggi. Gunakan `fast` untuk pemeriksaan luas yang lebih berat, `large` hanya setelah standard/fast tidak cukup, dan `beast` hanya untuk jalur luar biasa yang terikat CPU seperti matriks Docker suite penuh atau semua Plugin, validasi rilis/blocker eksplisit, atau profiling performa berinti tinggi. Jangan gunakan `beast` untuk `pnpm check:changed`, pengujian terfokus, pekerjaan khusus dokumentasi, lint/typecheck biasa, repro E2E kecil, atau triase gangguan Blacksmith. Gunakan `--market on-demand` untuk diagnosis kapasitas agar gejolak pasar Spot tidak tercampur ke dalam sinyal.

`.crabbox.yaml` mengatur default provider, sinkronisasi, dan hidrasi GitHub Actions untuk jalur cloud milik sendiri. File ini mengecualikan `.git` lokal sehingga checkout Actions yang dihidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote lokal maintainer dan penyimpanan objek, serta mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` mengatur checkout, penyiapan Node/pnpm, fetch `origin/main`, dan serah terima lingkungan non-rahasia untuk perintah `crabbox run --id <cbx_id>` cloud milik sendiri.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
