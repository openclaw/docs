---
read_when:
    - Anda perlu memahami mengapa job CI dijalankan atau tidak dijalankan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pelaksanaan ulang validasi rilis
    - Anda sedang mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Graf pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur CI
x-i18n:
    generated_at: "2026-05-06T09:04:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

CI OpenClaw berjalan pada setiap push ke `main` dan setiap permintaan tarik. Job `preflight` mengklasifikasikan diff dan mematikan lane mahal ketika hanya area yang tidak terkait berubah. Run manual `workflow_dispatch` secara sengaja melewati pelingkupan pintar dan menyebarkan seluruh grafik untuk kandidat rilis dan validasi luas. Lane Android tetap ikut serta secara eksplisit melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow [`Plugin Prerelease`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Full Release Validation`](#full-release-validation) atau dispatch manual eksplisit.

## Gambaran umum pipeline

| Job                              | Tujuan                                                                                                           | Kapan berjalan                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, cakupan yang berubah, ekstensi yang berubah, dan membangun manifes CI          | Selalu pada push dan PR non-draft           |
| `security-scm-fast`              | Deteksi kunci privat dan audit workflow melalui `zizmor`                                                         | Selalu pada push dan PR non-draft           |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisori npm                                                   | Selalu pada push dan PR non-draft           |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                                           | Selalu pada push dan PR non-draft           |
| `check-dependencies`             | Lintasan produksi Knip khusus dependensi plus guard allowlist file tidak terpakai                                | Perubahan relevan Node                      |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak hasil build, dan artefak hilir yang dapat digunakan ulang     | Perubahan relevan Node                      |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/kontrak-plugin/protokol                                   | Perubahan relevan Node                      |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel ber-shard dengan hasil pemeriksaan agregat yang stabil                               | Perubahan relevan Node                      |
| `checks-node-core-test`          | Shard pengujian Node inti, mengecualikan lane channel, bundled, kontrak, dan ekstensi                            | Perubahan relevan Node                      |
| `check`                          | Padanan gate lokal utama ber-shard: tipe prod, lint, guard, tipe pengujian, dan smoke ketat                      | Perubahan relevan Node                      |
| `check-additional`               | Arsitektur, drift boundary/prompt ber-shard, guard ekstensi, boundary paket, dan gateway watch                   | Perubahan relevan Node                      |
| `build-smoke`                    | Pengujian smoke CLI hasil build dan smoke memori startup                                                         | Perubahan relevan Node                      |
| `checks`                         | Pemverifikasi untuk pengujian channel artefak hasil build                                                        | Perubahan relevan Node                      |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                                      | Dispatch CI manual untuk rilis              |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan tautan rusak                                                             | Docs berubah                                |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                                       | Perubahan relevan skill Python              |
| `checks-windows`                 | Pengujian proses/path khusus Windows plus regresi specifier impor runtime bersama                                | Perubahan relevan Windows                   |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artefak hasil build bersama                                          | Perubahan relevan macOS                     |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk aplikasi macOS                                                            | Perubahan relevan macOS                     |
| `android`                        | Pengujian unit Android untuk kedua flavor plus satu build APK debug                                              | Perubahan relevan Android                   |
| `test-performance-agent`         | Optimisasi pengujian lambat Codex harian setelah aktivitas tepercaya                                             | Keberhasilan CI utama atau dispatch manual  |
| `openclaw-performance`           | Laporan performa runtime Kova harian/sesuai permintaan dengan lane mock-provider, deep-profile, dan live GPT 5.4 | Dispatch terjadwal dan manual               |

## Urutan fail-fast

1. `preflight` memutuskan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job matriks artefak dan platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat sehingga konsumen hilir dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR atau ref `main` yang sama. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tergantikan. Kunci konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga zombie di sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run manual suite penuh menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berlangsung.

## Cakupan dan routing

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area tercakup berubah.

- **Edit workflow CI** memvalidasi grafik CI Node plus linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap tercakup ke perubahan sumber platform.
- **Edit khusus routing CI, edit fixture pengujian inti murah tertentu, dan edit helper/routing pengujian kontrak Plugin yang sempit** menggunakan jalur manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard inti penuh, shard Plugin bundled, dan matriks guard tambahan ketika perubahan terbatas pada permukaan routing atau helper yang langsung dilatih oleh tugas cepat tersebut.
- **Pemeriksaan Node Windows** dicakup ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi pengelola paket, dan permukaan workflow CI yang mengeksekusi lane tersebut; perubahan sumber, Plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada di lane Node Linux.

Keluarga pengujian Node paling lambat dibagi atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner secara berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, lane cepat/dukungan unit inti berjalan terpisah, infra runtime inti dibagi antara shard status dan proses/konfigurasi, auto-reply berjalan sebagai worker seimbang (dengan subtree balasan dibagi menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi gateway/server agentik dibagi di lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artefak hasil build. Pengujian browser luas, QA, media, dan Plugin lain-lain menggunakan konfigurasi Vitest khusus mereka alih-alih catch-all Plugin bersama. Shard pola include mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard yang difilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar guard boundary distriping ke empat shard matriks, masing-masing menjalankan guard independen terpilih secara konkuren dan mencetak timing per pemeriksaan, termasuk `pnpm prompt:snapshots:check` sehingga drift prompt happy-path runtime Codex dipatok ke PR yang menyebabkannya. Gateway watch, pengujian channel, dan shard support-boundary inti berjalan konkuren di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane pengujian unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push relevan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (lintasan produksi Knip khusus dependensi yang dipatok ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file produksi tidak terpakai dari Knip dengan `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak terpakai gagal ketika PR menambahkan file tidak terpakai baru yang belum ditinjau atau meninggalkan entri allowlist usang, sambil mempertahankan permukaan Plugin dinamis, generated, build, live-test, dan package bridge yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Ia tidak melakukan checkout atau mengeksekusi kode permintaan tarik yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow memiliki empat lane:

- `clawsweeper_item` untuk permintaan tinjauan issue dan permintaan tarik yang tepat;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit di komentar issue;
- `clawsweeper_commit_review` untuk permintaan tinjauan tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis event, aksi, aktor, repositori, nomor item, URL, judul, status, dan cuplikan pendek untuk komentar atau tinjauan ketika ada. Secara sengaja lane ini menghindari penerusan seluruh isi webhook. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan seharusnya memposting ke `#clawsweeper` hanya ketika event tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise webhook duplikat, dan traffic tinjauan normal seharusnya menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, isi, teks tinjauan, nama branch, dan pesan commit GitHub sebagai data tidak tepercaya di seluruh jalur ini. Semua itu adalah input untuk peringkasan dan triase, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan graf pekerjaan yang sama seperti CI normal tetapi memaksa setiap jalur scoped non-Android aktif: shard Linux Node, shard bundled-plugin, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, build smoke, pemeriksaan docs, Skills Python, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri hanya menjalankan Android dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis Plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan jalur Docker prarilis Plugin dikecualikan dari CI. Suite prarilis Docker hanya berjalan ketika `Full Release Validation` men-dispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup konkurensi unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan graf tersebut terhadap branch, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, pekerjaan keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/bundled cepat, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, agregat `check-additional`, verifier agregat pengujian Node, pemeriksaan docs, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat masuk antrean lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ekstensi berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Linux Node, shard pengujian Plugin bundled, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif terhadap CPU sehingga 8 vCPU memakan biaya lebih besar daripada penghematan yang diberikannya); build Docker install-smoke (waktu antre 32-vCPU memakan biaya lebih besar daripada penghematan yang diberikannya)                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

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

Dispatch manual biasanya menjalankan benchmark pada ref workflow. Atur `target_ref` untuk menjalankan benchmark pada tag rilis atau branch lain dengan implementasi workflow saat ini. Path laporan yang dipublikasikan dan pointer terbaru dikunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA workflow, ref Kova, profil, mode auth jalur, model, jumlah pengulangan, dan filter skenario.

Workflow menginstal OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga jalur:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan auth kompatibel OpenAI palsu yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, Gateway, dan giliran agen.
- `live-gpt54`: giliran agen OpenAI `openai/gpt-5.4` sungguhan, dilewati ketika `OPENAI_API_KEY` tidak tersedia.

Jalur mock-provider juga menjalankan probe sumber native OpenClaw setelah pass Kova: timing boot Gateway dan memori pada kasus startup default, hook, dan 50-Plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; serta perintah startup CLI terhadap Gateway yang sudah di-boot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundel laporan, dengan JSON mentah di sampingnya.

Setiap jalur mengunggah artefak GitHub. Ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, workflow juga meng-commit `report.json`, `report.md`, bundel, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer ref yang sedang diuji ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow payung manual untuk "jalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit penuh, men-dispatch workflow `CI` manual dengan target tersebut, men-dispatch `Plugin Prerelease` untuk bukti Plugin/paket/statis/Docker khusus rilis, dan men-dispatch `OpenClaw Release Checks` untuk install smoke, penerimaan paket, pemeriksaan paket lintas-OS, paritas QA Lab, Matrix, dan jalur Telegram. Run stabil/default mempertahankan cakupan live/E2E menyeluruh dan jalur rilis Docker di balik `run_release_soak=true`; `release_profile=full` memaksa cakupan soak tersebut aktif sehingga validasi advisory luas tetap luas. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah publikasi, teruskan `npm_telegram_package_spec` untuk menjalankan ulang jalur paket Telegram yang sama terhadap paket npm yang sudah dipublikasikan.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama pekerjaan workflow yang tepat, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah workflow rilis mutating manual. Dispatch dari
`release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah preflight npm
OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`,
men-dispatch `Plugin NPM Release` untuk semua paket Plugin yang dapat dipublikasikan, men-dispatch
`Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru kemudian men-dispatch
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
men-dispatch `Full Release Validation` dari ref yang dipin tersebut, memverifikasi setiap
`headSha` workflow anak cocok dengan target, dan menghapus branch sementara ketika
run selesai. Verifier payung juga gagal jika ada workflow anak yang berjalan pada
SHA berbeda.

`release_profile` mengontrol cakupan live/penyedia yang diteruskan ke pemeriksaan rilis. Workflow rilis manual default ke `stable`; gunakan `full` hanya ketika Anda memang menginginkan matriks penyedia/media advisori yang luas. `run_release_soak` mengontrol apakah pemeriksaan rilis stabil/default menjalankan uji daya tahan live/E2E dan jalur rilis Docker yang menyeluruh; `full` memaksa uji daya tahan aktif.

- `minimum` mempertahankan lane OpenAI/core kritis-rilis yang paling cepat.
- `stable` menambahkan set penyedia/backend stabil.
- `full` menjalankan matriks penyedia/media advisori yang luas.

Umbrella mencatat id run anak yang didispatch, dan job akhir `Verify full validation` memeriksa ulang kesimpulan run anak saat ini serta menambahkan tabel job paling lambat untuk setiap run anak. Jika workflow anak dijalankan ulang dan berubah hijau, jalankan ulang hanya job verifier induk untuk menyegarkan hasil umbrella dan ringkasan waktu.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk anak CI penuh normal, `plugin-prerelease` hanya untuk anak prarilis Plugin, `release-checks` untuk setiap anak rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada umbrella. Ini menjaga rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane lintas-OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah lintas-OS yang panjang mengeluarkan baris Heartbeat dan ringkasan packaged-upgrade menyertakan waktu per fase. Lane pemeriksaan rilis QA bersifat advisori, sehingga kegagalan khusus QA memberi peringatan tetapi tidak memblokir verifier pemeriksaan rilis.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref yang dipilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke pemeriksaan lintas-OS dan Penerimaan Paket, ditambah workflow Docker jalur rilis live/E2E ketika cakupan uji daya tahan berjalan. Ini menjaga byte paket konsisten di seluruh kotak rilis dan menghindari pemaketan ulang kandidat yang sama di beberapa job anak.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan umbrella yang lebih lama. Monitor induk membatalkan workflow anak apa pun yang
sudah didispatch ketika induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang run pemeriksaan rilis dua jam yang basi. Validasi branch/tag
rilis dan grup rerun terfokus mempertahankan `cancel-in-progress: false`.

## Shard Live dan E2E

Anak live/E2E rilis mempertahankan cakupan luas `pnpm test:live` native, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs`, bukan sebagai satu job serial:

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

Ini mempertahankan cakupan file yang sama sekaligus membuat kegagalan penyedia live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun sekali jalan manual.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh workflow `Live Media Runner Image`. Image itu melakukan prainstal `ffmpeg` dan `ffprobe`; job media hanya memverifikasi biner sebelum setup. Pertahankan suite live berbasis Docker di runner Blacksmith normal — job kontainer bukan tempat yang tepat untuk meluncurkan pengujian Docker bersarang.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Workflow rilis live membangun dan mendorong image itu satu kali, lalu shard model live Docker, Gateway yang dishard per penyedia, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` eksplisit di level skrip yang lebih rendah dari timeout job workflow sehingga kontainer yang macet atau jalur pembersihan gagal cepat alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah dikonfigurasi dan akan membuang waktu dinding pada build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness Docker E2E yang sama yang dijalankan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref workflow, ref paket, versi, SHA-256, serta profil dalam ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker digest paket bila diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket itu alih-alih memaketkan checkout workflow. Ketika sebuah profil memilih beberapa `docker_lanes` tertarget, workflow reusable menyiapkan paket dan image bersama satu kali, lalu menyebarkan lane tersebut sebagai job Docker tertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama ketika Penerimaan Paket menyelesaikannya; dispatch Telegram mandiri masih dapat menginstal spesifikasi npm yang diterbitkan.
4. `summary` menggagalkan workflow jika resolusi paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prarilis/stabil yang diterbitkan.
- `source=ref` memaketkan branch, tag, atau SHA commit penuh `package_ref` tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, menginstal dependensi di worktree terlepas, dan memaketkannya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dipaketkan ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` ditambah `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — potongan jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` tepat; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang diterbitkan tidak bergantung pada ketersediaan live ClawHub. Lane Telegram opsional menggunakan ulang artefak `package-under-test` dalam `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang diterbitkan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan khusus pengujian pembaruan dan Plugin, termasuk perintah lokal,
lane Docker, input Penerimaan Paket, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Penerimaan Paket dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, dan `telegram_mode=mock-openai`. Ini menjaga bukti migrasi paket, pembaruan, pembersihan dependensi Plugin basi, perbaikan instalasi Plugin terkonfigurasi, Plugin offline, pembaruan Plugin, dan Telegram pada tarball paket terselesaikan yang sama. Atur `package_acceptance_package_spec` pada Full Release Validation atau OpenClaw Release Checks untuk menjalankan matriks yang sama terhadap paket npm yang sudah dikirim alih-alih artefak yang dibangun dari SHA. Pemeriksaan rilis lintas-OS masih mencakup onboarding, installer, dan perilaku platform yang spesifik OS; validasi produk paket/pembaruan harus dimulai dengan Penerimaan Paket. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang diterbitkan per run dalam jalur rilis pemblokir. Dalam Penerimaan Paket, tarball `package-under-test` yang diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline terbitan fallback, dengan default `openclaw@latest`; perintah rerun lane yang gagal mempertahankan baseline itu. Full Release Validation dengan `run_release_soak=true` atau `release_profile=full` menetapkan `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas ke empat rilis npm stabil terbaru ditambah rilis batas kompatibilitas Plugin yang dipin serta fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, instalasi Plugin OpenClaw terkonfigurasi, jalur log tilde, dan root dependensi Plugin lama yang basi. Pilihan survivor published-upgrade multi-baseline dishard berdasarkan baseline ke dalam job runner Docker tertarget terpisah. Workflow `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah pembersihan pembaruan terbitan yang menyeluruh, bukan cakupan CI Full Release normal. Run agregat lokal dapat meneruskan spesifikasi paket tepat dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane terbitan mengonfigurasi baseline dengan resep perintah `openclaw config set` bawaan, mencatat langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, serta status RPC setelah Gateway dimulai. Lane fresh Windows packaged dan installer juga memverifikasi bahwa paket terinstal dapat mengimpor override browser-control dari jalur Windows absolut mentah. Smoke agent-turn lintas-OS OpenAI default ke `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika disetel, jika tidak `openai/gpt-5.4`, sehingga bukti instalasi dan Gateway tetap berada pada model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas lama

Penerimaan Paket memiliki jendela kompatibilitas lama yang dibatasi untuk paket yang sudah diterbitkan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui dalam `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag itu;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` persisten yang hilang;
- smoke Plugin dapat membaca lokasi install-record lama atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan install record dan perilaku tanpa-instal-ulang tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memberi peringatan untuk file stempel metadata build lokal yang sudah dikirimkan. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama akan gagal, bukan memberi peringatan atau melewati.

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

Saat men-debug proses package acceptance yang gagal, mulai dari ringkasan `resolve_package` untuk memastikan sumber paket, versi, dan SHA-256. Lalu periksa child run `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Lebih baik menjalankan ulang profil paket yang gagal atau lane Docker yang persis daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Workflow `Install Smoke` yang terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifes Plugin bundel, atau permukaan Plugin SDK plugin/channel/gateway inti yang dijalankan oleh job smoke Docker. Perubahan Plugin bundel yang hanya source, edit yang hanya test, dan edit yang hanya docs tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e container gateway-network, memverifikasi arg build ekstensi bundel, dan menjalankan profil Docker bundled-plugin terbatas dalam timeout perintah agregat 240 detik (setiap Docker run skenario dibatasi terpisah).
- **Jalur penuh** mempertahankan instalasi paket QR dan cakupan Docker/update installer untuk run terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instalasi paket QR, smoke Dockerfile root/gateway, smoke installer/update, dan Docker E2E bundled-plugin cepat sebagai job terpisah sehingga pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; ketika logika changed-scope akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi malam atau rilis.

Smoke penyedia image instalasi global Bun yang lambat dikendalikan terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat ikut menyertakannya, tetapi pull request dan push `main` tidak. Test Docker QR dan installer tetap memakai Dockerfile berfokus instalasi mereka sendiri.

## Docker E2E lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya menjalankan plan yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parameter yang dapat disetel

| Variabel                               | Default | Tujuan                                                                                       |
| -------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot pool ekor yang sensitif penyedia.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live bersamaan agar penyedia tidak melakukan throttle.                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instalasi npm bersamaan.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service bersamaan.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antar-start lane untuk menghindari lonjakan create daemon Docker; setel `0` untuk tanpa jeda. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/ekor tertentu memakai batas lebih ketat.    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak plan scheduler tanpa menjalankan lane.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati smoke pembersihan agar agent dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya masih dapat dimulai dari pool kosong, lalu berjalan sendiri sampai kapasitas dilepaskan. Preflight agregat lokal memeriksa Docker, menghapus container OpenClaw E2E usang, memancarkan status lane aktif, menyimpan timing lane untuk pengurutan longest-first, dan secara default berhenti menjadwalkan lane pooled baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan ke `scripts/test-docker-all.mjs --plan-json` paket, jenis image, image live, lane, dan cakupan kredensial mana yang diperlukan. `scripts/docker-e2e.mjs` lalu mengonversi plan tersebut menjadi output dan ringkasan GitHub. Ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket current-run, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image Docker E2E GHCR bare/functional bertag digest paket melalui cache layer Docker Blacksmith ketika plan membutuhkan lane yang paketnya sudah terinstal; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang sudah ada daripada membangun ulang. Pull image Docker dicoba ulang dengan timeout per upaya 180 detik yang terbatas sehingga stream registry/cache yang macet cepat dicoba ulang alih-alih menghabiskan sebagian besar jalur kritis CI.

### Potongan jalur rilis

Cakupan Docker rilis menjalankan job chunked yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkannya dan menjalankan beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer penyedia.

OpenWebUI digabungkan ke `plugins-runtime-services` ketika cakupan release-path penuh memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane update bundled-channel mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON plan scheduler, tabel lane lambat, dan perintah rerun per lane. Input workflow `docker_lanes` menjalankan lane yang dipilih terhadap image yang sudah disiapkan alih-alih job chunk, yang menjaga debugging lane gagal tetap terbatas ke satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk run tersebut; jika lane yang dipilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun tersebut. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang sudah disiapkan ketika nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, jadi ini adalah workflow terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri menonaktifkan suite tersebut. Ini menyeimbangkan test Plugin bundel di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch Plugin yang berat import tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis mengelompokkan lane Docker tertarget dalam grup kecil untuk menghindari pencadangan puluhan runner untuk job berdurasi satu hingga tiga menit.

## Lab QA

Lab QA memiliki lane CI khusus di luar workflow smart-scoped utama. Paritas agentic bersarang di bawah harness QA dan rilis yang luas, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus ikut dalam run validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan setiap malam di `main` dan pada dispatch manual; ini menyebarkan lane mock parity, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live memakai environment `qa-live-shared`, dan Telegram/Discord memakai lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan penyedia mock deterministik dan model yang memenuhi syarat mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup provider-plugin normal. Gateway transport live menonaktifkan pencarian memory karena paritas QA mencakup perilaku memory secara terpisah; konektivitas penyedia dicakup oleh suite model live, penyedia native, dan penyedia Docker yang terpisah.

Matrix memakai `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-check out mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu membagi cakupan Matrix penuh menjadi job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane Lab QA yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan pack kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas final.

Untuk PR normal, ikuti bukti CI/pemeriksaan terskop alih-alih memperlakukan parity sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja menjadi pemindai keamanan tahap awal yang sempit, bukan penyisiran repositori penuh. Jalankan guard harian, manual, dan pull request non-draf untuk memindai kode workflow Actions plus permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkepercayaan tinggi yang difilter ke `security-severity` tinggi/kritis.

Guard pull request tetap ringan: hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkepercayaan tinggi yang sama seperti workflow terjadwal. Android dan macOS CodeQL tetap di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, rahasia, sandbox, cron, dan baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi saluran inti plus runtime plugin saluran, gateway, Plugin SDK, rahasia, titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, parsing IP, penjaga jaringan, pengambilan web, dan SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gerbang eksekusi alat agen                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifest, registry, instalasi package-manager, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error pada permukaan bernilai tinggi yang sempit di runner Blacksmith Linux yang lebih kecil. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draf hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk perubahan kode eksekusi perintah/model/alat agen dan dispatch balasan, kode skema/migrasi/IO konfigurasi, kode auth/rahasia/sandbox/keamanan, runtime saluran inti dan plugin saluran bawaan, protokol Gateway/metode server, perekat runtime memori/SDK, MCP/proses/pengiriman keluar, katalog runtime/model provider, diagnostik sesi/antrean pengiriman, loader plugin, kontrak Plugin SDK/paket, atau runtime balasan Plugin SDK. Perubahan konfigurasi CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terpisah.

| Kategori                                                | Permukaan                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan auth, rahasia, sandbox, cron, dan gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema konfigurasi, migrasi, normalisasi, dan IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi saluran inti dan plugin saluran bawaan                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi perintah, dispatch model/provider, dispatch dan antrean balasan otomatis, serta control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge alat, helper supervisi proses, serta kontrak pengiriman keluar                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, fasad runtime memori, alias Plugin SDK memori, perekat aktivasi runtime memori, dan perintah doctor memori                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundel event/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/pemotongan/runtime balasan, opsi balasan saluran, antrean pengiriman, dan helper binding sesi/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, serta registry web/pencarian/pengambilan/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol gateway, dan kontrak runtime control-plane tugas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime pengambilan/pencarian web inti, IO media, pemahaman media, generasi gambar, dan generasi media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket plugin                                                                                      |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL untuk Swift, Python, dan plugin bawaan sebaiknya ditambahkan kembali sebagai pekerjaan lanjutan terskop atau tershard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Workflow pemeliharaan

### Docs Agent

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru saja mendarat. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Invokasi workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-dilewati lain dibuat dalam satu jam terakhir. Saat berjalan, ia meninjau rentang commit dari SHA sumber Docs Agent non-dilewati sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terakumulasi sejak pass dokumen terakhir.

### Test Performance Agent

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk tes lambat. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, tetapi akan dilewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC itu. Dispatch manual melewati gerbang aktivitas harian tersebut. Lane ini membangun laporan performa Vitest berkelompok untuk seluruh suite, mengizinkan Codex hanya membuat perbaikan performa tes kecil yang mempertahankan cakupan alih-alih refaktor luas, lalu menjalankan ulang laporan seluruh suite dan menolak perubahan yang mengurangi jumlah baseline tes yang lulus. Jika baseline memiliki tes yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan seluruh suite setelah agen harus lulus sebelum apa pun di-commit. Ketika `main` maju sebelum push bot mendarat, lane me-rebase patch yang sudah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch basi yang berkonflik dilewati. Ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti agen dokumen.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat pasca-land. Default-nya dry-run dan hanya menutup PR yang dicantumkan secara eksplisit ketika `apply=true`. Sebelum memutasi GitHub, workflow ini memverifikasi bahwa PR yang mendarat sudah di-merge dan bahwa setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gerbang pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gerbang pemeriksaan lokal itu lebih ketat tentang batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan tes inti plus lint/guard inti;
- perubahan hanya tes inti hanya menjalankan typecheck tes inti plus lint inti;
- perubahan produksi ekstensi menjalankan typecheck prod ekstensi dan tes ekstensi plus lint ekstensi;
- perubahan hanya tes ekstensi menjalankan typecheck tes ekstensi plus lint ekstensi;
- perubahan Plugin SDK publik atau kontrak plugin melebar ke typecheck ekstensi karena ekstensi bergantung pada kontrak inti tersebut (penyisiran ekstensi Vitest tetap menjadi pekerjaan tes eksplisit);
- bump versi hanya metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang ditargetkan;
- perubahan root/konfigurasi yang tidak diketahui fail safe ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit tes langsung menjalankan dirinya sendiri, edit sumber lebih memilih pemetaan eksplisit, lalu tes saudara dan dependensi graf impor. Konfigurasi pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada konfigurasi visible-reply grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui tes balasan inti plus regresi pengiriman Discord dan Slack agar perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup seluas harness sehingga set murah yang dipetakan bukan proxy yang tepercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan utamakan kotak baru yang sudah dipanaskan untuk pembuktian luas. Sebelum menghabiskan gate lambat pada kotak yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sinkronisasi yang sangat besar secara tidak terduga, jalankan `pnpm testbox:sanity` di dalam kotak terlebih dahulu.

Pemeriksaan sanity gagal cepat ketika file root yang diperlukan seperti `pnpm-lock.yaml` menghilang atau ketika `git status --short` menampilkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sinkronisasi jarak jauh bukan salinan PR yang tepercaya; hentikan kotak itu dan panaskan yang baru alih-alih men-debug kegagalan pengujian produk. Untuk PR penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk run sanity tersebut.

`pnpm testbox:run` juga menghentikan pemanggilan Blacksmith CLI lokal yang tetap berada dalam fase sinkronisasi selama lebih dari lima menit tanpa output pasca-sinkronisasi. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard tersebut, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang luar biasa besar.

Crabbox adalah wrapper kotak jarak jauh milik repo untuk pembuktian Linux maintainer. Gunakan saat sebuah pemeriksaan terlalu luas untuk local loopback edit, saat paritas CI penting, atau saat pembuktian membutuhkan secret, Docker, lane paket, kotak yang dapat digunakan ulang, atau log jarak jauh. Backend OpenClaw normal adalah `blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah fallback untuk gangguan Blacksmith, masalah kuota, atau pengujian kapasitas milik sendiri secara eksplisit.

Sebelum run pertama, periksa wrapper dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo menolak biner Crabbox usang yang tidak mengiklankan `blacksmith-testbox`. Teruskan provider secara eksplisit meskipun `.crabbox.yaml` memiliki default owned-cloud.

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

Run ulang pengujian terfokus:

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

Baca ringkasan JSON akhir. Field yang berguna adalah `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Run Crabbox sekali pakai yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis; jika sebuah run terinterupsi atau cleanup tidak jelas, periksa kotak live dan hentikan hanya kotak yang Anda buat:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Gunakan ulang hanya ketika Anda memang membutuhkan beberapa perintah pada kotak terhidrasi yang sama:

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

Eskalasi ke kapasitas Crabbox milik sendiri hanya saat Blacksmith sedang down, dibatasi kuota, tidak memiliki lingkungan yang diperlukan, atau kapasitas milik sendiri memang tujuannya secara eksplisit:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` memiliki default provider, sinkronisasi, dan hidrasi GitHub Actions untuk lane owned-cloud. File itu mengecualikan `.git` lokal agar checkout Actions yang terhidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan object store lokal maintainer, dan mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, penyiapan Node/pnpm, fetch `origin/main`, dan handoff environment non-secret untuk perintah owned-cloud `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Channel pengembangan](/id/install/development-channels)
