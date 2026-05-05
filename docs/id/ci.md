---
read_when:
    - Anda perlu memahami mengapa suatu pekerjaan CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pengulangan validasi rilis
    - Anda sedang mengubah pengiriman ClawSweeper atau penerusan aktivitas GitHub
summary: Graf pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur kerja CI
x-i18n:
    generated_at: "2026-05-05T01:44:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan menonaktifkan lane yang mahal saat hanya area yang tidak terkait yang berubah. Run `workflow_dispatch` manual sengaja melewati smart scoping dan menyebarkan grafik penuh untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow [`Plugin Prarilis`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Validasi Rilis Penuh`](#full-release-validation) atau dispatch manual eksplisit.

## Ikhtisar pipeline

| Job                              | Tujuan                                                                                                     | Kapan berjalan                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, scope yang berubah, ekstensi yang berubah, dan membangun manifes CI      | Selalu pada push dan PR non-draf              |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                                    | Selalu pada push dan PR non-draf              |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisori npm                                             | Selalu pada push dan PR non-draf              |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                                     | Selalu pada push dan PR non-draf              |
| `check-dependencies`             | Pass khusus dependensi Knip produksi plus guard allowlist unused-file                                      | Perubahan relevan Node                        |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak build, dan artefak downstream yang dapat digunakan ulang | Perubahan relevan Node                        |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol                            | Perubahan relevan Node                        |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel tersharding dengan hasil pemeriksaan agregat stabil                            | Perubahan relevan Node                        |
| `checks-node-core-test`          | Shard test Core Node, mengecualikan lane channel, bundled, contract, dan extension                         | Perubahan relevan Node                        |
| `check`                          | Ekuivalen gate lokal utama tersharding: tipe prod, lint, guard, tipe test, dan smoke ketat                 | Perubahan relevan Node                        |
| `check-additional`               | Arsitektur, drift boundary/prompt tersharding, guard extension, boundary package, dan gateway watch        | Perubahan relevan Node                        |
| `build-smoke`                    | Test smoke CLI hasil build dan smoke memori startup                                                        | Perubahan relevan Node                        |
| `checks`                         | Verifier untuk test channel artefak build                                                                  | Perubahan relevan Node                        |
| `checks-node-compat-node22`      | Build kompatibilitas Node 22 dan lane smoke                                                                | Dispatch CI manual untuk rilis                |
| `check-docs`                     | Pemeriksaan format docs, lint, dan broken-link                                                             | Docs berubah                                  |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                                 | Perubahan relevan skill Python                |
| `checks-windows`                 | Test proses/path khusus Windows plus regresi specifier impor runtime bersama                               | Perubahan relevan Windows                     |
| `macos-node`                     | Lane test TypeScript macOS menggunakan artefak build bersama                                               | Perubahan relevan macOS                       |
| `macos-swift`                    | Swift lint, build, dan test untuk aplikasi macOS                                                           | Perubahan relevan macOS                       |
| `android`                        | Test unit Android untuk kedua flavor plus satu build APK debug                                             | Perubahan relevan Android                     |
| `test-performance-agent`         | Optimisasi test lambat Codex harian setelah aktivitas tepercaya                                            | Sukses CI main atau dispatch manual           |
| `openclaw-performance`           | Laporan performa runtime Kova harian/sesuai permintaan dengan lane mock-provider, deep-profile, dan GPT 5.4 live | Dispatch terjadwal dan manual                 |

## Urutan fail-fast

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job matriks artefak dan platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk pada PR yang sama atau ref `main`. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tergantikan. Key konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

## Scope dan routing

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh test unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area terscope berubah.

- **Edit workflow CI** memvalidasi grafik CI Node plus linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap terscope ke perubahan sumber platform.
- **Edit khusus routing CI, edit fixture core-test murah tertentu, dan edit helper/test-routing kontrak Plugin yang sempit** menggunakan path manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Path itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard core penuh, shard Plugin bawaan, dan matriks guard tambahan ketika perubahan terbatas pada permukaan routing atau helper yang dilatih langsung oleh tugas cepat tersebut.
- **Pemeriksaan Node Windows** terscope ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang menjalankan lane tersebut; perubahan sumber, Plugin, install-smoke, dan khusus test yang tidak terkait tetap pada lane Linux Node.

Keluarga test Node paling lambat dibagi atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, lane core unit fast/support berjalan terpisah, infra runtime core dibagi antara shard state dan process/config, auto-reply berjalan sebagai worker seimbang (dengan subtree reply dibagi menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi gateway/server agentic dibagi di seluruh lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artefak build. Test browser, QA, media, dan Plugin lain-lain yang luas menggunakan konfigurasi Vitest khususnya, bukan catch-all Plugin bersama. Shard include-pattern merekam entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh config dari shard terfilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar guard boundary distriping di empat shard matriks, masing-masing menjalankan guard independen terpilih secara paralel dan mencetak timing per pemeriksaan, termasuk `pnpm prompt:snapshots:check` sehingga drift prompt happy-path runtime Codex dipaku ke PR yang menyebabkannya. Gateway watch, test channel, dan shard core support-boundary berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest` lalu membangun APK debug Play. Flavor third-party tidak memiliki source set atau manifes terpisah; lane unit-test-nya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push relevan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipaku ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan unused-file produksi Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file gagal ketika PR menambahkan file tidak terpakai baru yang belum ditinjau atau meninggalkan entri allowlist basi, sambil mempertahankan permukaan Plugin dinamis, generated, build, live-test, dan package bridge yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak checkout atau mengeksekusi kode pull request tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow ini memiliki empat lane:

- `clawsweeper_item` untuk permintaan review issue dan pull request yang tepat;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit dalam komentar issue;
- `clawsweeper_commit_review` untuk permintaan review tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agent ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis event, action, actor, repositori, nomor item, URL, judul, state, dan kutipan singkat untuk komentar atau review jika ada. Lane ini sengaja menghindari penerusan seluruh body webhook. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event yang dinormalisasi ke hook OpenClaw Gateway untuk agent ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agent ClawSweeper menerima target Discord dalam prompt-nya dan sebaiknya memposting ke `#clawsweeper` hanya ketika event tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise webhook duplikat, dan traffic review normal sebaiknya menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, body, teks review, nama branch, dan pesan commit GitHub sebagai data tidak tepercaya di seluruh path ini. Semuanya adalah input untuk peringkasan dan triage, bukan instruksi untuk workflow atau runtime agent.

## Dispatch manual

Dispatch CI manual menjalankan grafik job yang sama seperti CI normal, tetapi memaksa setiap lane berskop non-Android aktif: shard Linux Node, shard plugin bawaan, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Python skills, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri hanya menjalankan Android dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis Plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan lane Docker prarilis plugin dikecualikan dari CI. Suite Docker prarilis hanya berjalan ketika `Full Release Validation` men-dispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup konkurensi unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan caller tepercaya menjalankan grafik itu terhadap branch, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/bawaan cepat, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifier agregat pengujian Node, pemeriksaan docs, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang dihosting GitHub agar matriks Blacksmith bisa mengantre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ekstensi berbobot lebih ringan, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Linux Node, shard pengujian plugin bawaan, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif CPU sehingga 8 vCPU lebih mahal daripada penghematannya); build Docker install-smoke (biaya waktu antre 32-vCPU lebih mahal daripada penghematannya)                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

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

`OpenClaw Performance` adalah workflow performa produk/runtime. Workflow ini berjalan harian pada `main` dan dapat di-dispatch secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch manual biasanya melakukan benchmark pada ref workflow. Atur `target_ref` untuk melakukan benchmark pada tag rilis atau branch lain dengan implementasi workflow saat ini. Path laporan yang dipublikasikan dan pointer terbaru diberi kunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA workflow, ref Kova, profil, mode auth lane, model, jumlah pengulangan, dan filter skenario.

Workflow menginstal OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: skenario diagnostik Kova terhadap runtime build lokal dengan auth kompatibel OpenAI palsu yang deterministik.
- `mock-deep-profile`: profiling CPU/heap/trace untuk hotspot startup, gateway, dan agent-turn.
- `live-gpt54`: satu turn agen OpenAI `openai/gpt-5.4` nyata, dilewati ketika `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber asli OpenClaw setelah pass Kova: timing boot gateway dan memori pada kasus startup default, hook, dan 50-plugin; loop hello `channel-chat-baseline` mock-OpenAI berulang; serta perintah startup CLI terhadap gateway yang sudah di-boot. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundle laporan, dengan JSON mentah di sampingnya.

Setiap lane mengunggah artefak GitHub. Ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, workflow juga meng-commit `report.json`, `report.md`, bundle, `index.md`, dan artefak source-probe ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer ref teruji saat ini ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow payung manual untuk "menjalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit penuh, men-dispatch workflow manual `CI` dengan target tersebut, men-dispatch `Plugin Prerelease` untuk pembuktian plugin/paket/statis/Docker khusus rilis, dan men-dispatch `OpenClaw Release Checks` untuk smoke install, penerimaan paket, pemeriksaan paket lintas OS, paritas QA Lab, Matrix, dan lane Telegram. Run stabil/default menjaga cakupan live/E2E dan jalur rilis Docker yang menyeluruh di balik `run_release_soak=true`; `release_profile=full` memaksa cakupan soak itu aktif agar validasi advisory luas tetap luas. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah publikasi, teruskan `npm_telegram_package_spec` untuk menjalankan ulang lane paket Telegram yang sama terhadap paket npm yang dipublikasikan.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama job workflow yang tepat, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah workflow rilis manual yang mengubah keadaan. Dispatch dari `release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah preflight npm OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`, men-dispatch `Plugin NPM Release` untuk semua paket plugin yang dapat dipublikasikan, men-dispatch `Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru kemudian men-dispatch `OpenClaw NPM Release` dengan `preflight_run_id` yang disimpan.

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

Ref dispatch workflow GitHub harus berupa branch atau tag, bukan SHA commit mentah. Helper mendorong branch sementara `release-ci/<sha>-...` pada SHA target, men-dispatch `Full Release Validation` dari ref yang dipin itu, memverifikasi setiap `headSha` workflow anak cocok dengan target, dan menghapus branch sementara ketika run selesai. Verifier payung juga gagal jika ada workflow anak yang berjalan pada SHA berbeda.

`release_profile` mengontrol cakupan live/penyedia yang diteruskan ke pemeriksaan rilis. Alur kerja rilis manual secara default menggunakan `stable`; gunakan `full` hanya ketika Anda sengaja menginginkan matriks penyedia/media advisori yang luas. `run_release_soak` mengontrol apakah pemeriksaan rilis stable/default menjalankan soak jalur rilis live/E2E dan Docker yang menyeluruh; `full` memaksa soak aktif.

- `minimum` mempertahankan lane OpenAI/core paling cepat yang kritis untuk rilis.
- `stable` menambahkan set penyedia/backend stabil.
- `full` menjalankan matriks penyedia/media advisori yang luas.

Payung mencatat ID run anak yang didispatch, dan job final `Verify full validation` memeriksa ulang kesimpulan run anak saat ini dan menambahkan tabel job terlambat untuk setiap run anak. Jika alur kerja anak dijalankan ulang dan menjadi hijau, jalankan ulang hanya job verifier induk untuk menyegarkan hasil payung dan ringkasan waktunya.

Untuk pemulihan, baik `Full Release Validation` maupun `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk anak CI penuh normal, `plugin-prerelease` hanya untuk anak prarilis plugin, `release-checks` untuk setiap anak rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga agar rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane cross-OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah cross-OS yang panjang memancarkan baris Heartbeat dan ringkasan packaged-upgrade menyertakan timing per fase. Lane QA release-check bersifat advisori, jadi kegagalan khusus QA memberi peringatan tetapi tidak memblokir verifier release-check.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk me-resolve ref terpilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke pemeriksaan cross-OS dan Package Acceptance, ditambah alur kerja Docker jalur rilis live/E2E ketika cakupan soak berjalan. Ini menjaga byte paket tetap konsisten di seluruh kotak rilis dan menghindari pengemasan ulang kandidat yang sama di beberapa job anak.

Duplikat run `Full Release Validation` untuk `ref=main` dan `rerun_group=all`
menggantikan payung yang lebih lama. Monitor induk membatalkan alur kerja anak mana pun yang
telah didispatch ketika induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang run release-check dua jam yang basi. Validasi branch/tag
rilis dan grup rerun terfokus mempertahankan `cancel-in-progress: false`.

## Shard Live dan E2E

Anak live/E2E rilis mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs` alih-alih satu job serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- job `native-live-src-gateway-profiles` yang difilter berdasarkan penyedia
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard audio/video media terpisah dan shard musik yang difilter berdasarkan penyedia

Ini mempertahankan cakupan file yang sama sambil membuat kegagalan penyedia live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun sekali jalan manual.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh alur kerja `Live Media Runner Image`. Image itu sudah memasang `ffmpeg` dan `ffprobe`; job media hanya memverifikasi biner sebelum setup. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job container adalah tempat yang salah untuk meluncurkan pengujian Docker bertingkat.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit terpilih. Alur kerja rilis live membangun dan mendorong image itu sekali, lalu shard model live Docker, gateway yang di-shard per penyedia, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Gateway Docker membawa batas `timeout` eksplisit di level skrip di bawah timeout job alur kerja sehingga container yang macet atau jalur cleanup gagal cepat alih-alih menghabiskan seluruh anggaran release-check. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah konfigurasi dan akan membuang waktu dinding pada build image duplikat.

## Package Acceptance

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan package acceptance memvalidasi satu tarball melalui harness Docker E2E yang sama yang dijalankan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, me-resolve satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref alur kerja, ref paket, versi, SHA-256, dan profil di ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Alur kerja reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker package-digest bila diperlukan, dan menjalankan lane Docker terpilih terhadap paket itu alih-alih mengemas checkout alur kerja. Ketika profil memilih beberapa `docker_lanes` tertarget, alur kerja reusable menyiapkan paket dan image bersama satu kali, lalu menyebarkan lane tersebut sebagai job Docker tertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan memasang artefak `package-under-test` yang sama ketika Package Acceptance me-resolve satu; dispatch Telegram mandiri masih dapat memasang spesifikasi npm yang sudah dipublikasikan.
4. `summary` menggagalkan alur kerja jika resolusi paket, Docker acceptance, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk acceptance prarilis/stable yang sudah dipublikasikan.
- `source=ref` mengemas branch, tag, atau SHA commit lengkap `package_ref` tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit terpilih dapat dijangkau dari riwayat branch repositori atau tag rilis, memasang dependensi di worktree terlepas, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya diberikan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode alur kerja/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika alur kerja lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` ditambah `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan live ClawHub. Lane Telegram opsional menggunakan ulang artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan pengujian pembaruan dan plugin khusus, termasuk perintah lokal,
lane Docker, input Package Acceptance, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins).

Release checks memanggil Package Acceptance dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, dan `telegram_mode=mock-openai`. Ini menjaga bukti migrasi paket, pembaruan, cleanup dependensi plugin basi, perbaikan instal plugin terkonfigurasi, plugin offline, plugin-update, dan Telegram pada tarball paket terselesaikan yang sama. Setel `package_acceptance_package_spec` pada Full Release Validation atau OpenClaw Release Checks untuk menjalankan matriks yang sama terhadap paket npm yang sudah dikirim alih-alih artefak yang dibangun dari SHA. Pemeriksaan rilis cross-OS tetap mencakup onboarding spesifik OS, installer, dan perilaku platform; validasi produk paket/pembaruan harus dimulai dengan Package Acceptance. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run di jalur rilis pemblokir. Dalam Package Acceptance, tarball `package-under-test` yang di-resolve selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline publikasi fallback, default ke `openclaw@latest`; perintah rerun lane gagal mempertahankan baseline tersebut. Full Release Validation dengan `run_release_soak=true` atau `release_profile=full` menyetel `published_upgrade_survivor_baselines=all-since-2026.4.23` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas ke setiap rilis npm stable dari `2026.4.23` hingga `latest` dan fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, instal plugin OpenClaw terkonfigurasi, jalur log tilde, dan root dependensi plugin legacy yang basi. Alur kerja `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah cleanup pembaruan publikasi yang menyeluruh, bukan cakupan CI Full Release normal. Run agregat lokal dapat meneruskan spesifikasi paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menyetel `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane publikasi mengonfigurasi baseline dengan resep perintah `openclaw config set` yang sudah dibaked, mencatat langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway mulai. Lane fresh Windows packaged dan installer juga memverifikasi bahwa paket terinstal dapat mengimpor override browser-control dari jalur Windows absolut mentah. Smoke agent-turn cross-OS OpenAI default ke `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika disetel, jika tidak `openai/gpt-5.4`, sehingga bukti instalasi dan gateway tetap menggunakan model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Package Acceptance memiliki jendela kompatibilitas legacy terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui di `dist/postinstall-inventory.json` dapat mengarah ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke plugin dapat membaca lokasi install-record legacy atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan install record dan perilaku tanpa-reinstall tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memperingatkan untuk file cap metadata build lokal yang sudah dikirim. Paket setelahnya harus memenuhi kontrak modern; kondisi yang sama gagal alih-alih memperingatkan atau melewati.

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

Saat men-debug eksekusi package acceptance yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa eksekusi turunan `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah eksekusi ulang. Utamakan menjalankan ulang profil paket yang gagal atau lane Docker yang persis, bukan menjalankan ulang validasi rilis penuh.

## Install smoke

Workflow `Install Smoke` terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya. Ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifes plugin bawaan, atau permukaan plugin/channel/gateway inti/Plugin SDK yang diuji oleh job Docker smoke. Perubahan plugin bawaan yang hanya source, edit hanya test, dan edit hanya docs tidak memesan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e gateway-network kontainer, memverifikasi arg build extension bawaan, dan menjalankan profil Docker plugin bawaan terbatas di bawah timeout perintah agregat 240 detik (setiap Docker run skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan cakupan instal paket QR dan Docker/update installer untuk eksekusi terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instal paket QR, smoke Dockerfile/Gateway root, smoke installer/update, dan E2E Docker plugin bawaan cepat sebagai job terpisah agar pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk merge commit) tidak memaksa jalur penuh; ketika logika changed-scope akan meminta cakupan penuh pada push, workflow mempertahankan Docker smoke cepat dan menyerahkan install smoke penuh ke validasi malam atau rilis.

Smoke image-provider instal global Bun yang lambat digate secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat ikut mengaktifkannya, tetapi pull request dan push `main` tidak. Test Docker QR dan installer mempertahankan Dockerfile yang berfokus pada instal milik mereka sendiri.

## E2E Docker Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw satu kali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi plan yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Yang Dapat Disetel

| Variabel                               | Default | Tujuan                                                                                        |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot main-pool untuk lane normal.                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live bersamaan agar provider tidak melakukan throttle.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instal npm bersamaan.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service bersamaan.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antar-start lane untuk menghindari lonjakan create daemon Docker; setel `0` untuk tanpa jeda. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/tail terpilih memakai batas yang lebih ketat. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak plan scheduler tanpa menjalankan lane.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agent dapat mereproduksi satu lane gagal. |

Lane yang lebih berat dari batas efektifnya tetap dapat dimulai dari pool kosong, lalu berjalan sendiri sampai melepas kapasitas. Agregat lokal melakukan preflight Docker, menghapus kontainer E2E OpenClaw usang, mengeluarkan status lane aktif, menyimpan timing lane untuk pengurutan longest-first, dan secara default berhenti menjadwalkan lane pooled baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan `scripts/test-docker-all.mjs --plan-json` tentang paket, jenis image, image live, lane, dan cakupan kredensial yang dibutuhkan. `scripts/docker-e2e.mjs` lalu mengonversi plan itu menjadi output dan ringkasan GitHub. Ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket current-run, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/functional bertag package-digest melalui cache layer Docker Blacksmith saat plan membutuhkan lane dengan paket terinstal; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image package-digest yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout terbatas 180 detik per percobaan agar stream registry/cache yang macet cepat dicoba ulang, bukan menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkan dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias eksekusi ulang manual agregat untuk kedua lane installer provider.

OpenWebUI digabungkan ke `plugins-runtime-services` ketika cakupan release-path penuh memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane update bundled-channel mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON plan scheduler, tabel lane lambat, dan perintah eksekusi ulang per lane. Input workflow `docker_lanes` menjalankan lane terpilih terhadap image yang sudah disiapkan alih-alih job chunk, yang menjaga debugging lane gagal tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk eksekusi itu; jika lane terpilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk eksekusi ulang itu. Perintah eksekusi ulang GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang sudah disiapkan saat nilai tersebut ada, sehingga lane gagal dapat menggunakan ulang paket dan image persis dari eksekusi yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Plugin Prarilis

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, sehingga menjadi workflow terpisah yang didispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri menonaktifkan suite tersebut. Ini menyeimbangkan test plugin bawaan di delapan worker extension; job shard extension tersebut menjalankan hingga dua grup config plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch plugin yang berat impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis membatch lane Docker tertarget dalam grup kecil untuk menghindari pemesanan puluhan runner untuk job berdurasi satu hingga tiga menit.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow smart-scoped utama. Paritas agentic bersarang di bawah harness QA dan rilis yang luas, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` saat paritas harus ikut dalam eksekusi validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan pada dispatch manual; ini menyebarkan lane paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan provider mock deterministik dan model mock-qualified (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup plugin provider normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas provider dicakup oleh suite model live, provider native, dan provider Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu men-shard cakupan Matrix penuh menjadi job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan pack kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas final.

Untuk PR normal, ikuti bukti CI/check bercakupan alih-alih memperlakukan paritas sebagai status wajib.

## CodeQL

Alur kerja `CodeQL` secara sengaja merupakan pemindai keamanan lintasan pertama yang sempit, bukan pemindaian seluruh repositori. Harian, manual, dan penjaga pull request non-draf memindai kode alur kerja Actions ditambah permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Penjaga pull request tetap ringan: ia hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti alur kerja terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret, sandbox, cron, dan baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti ditambah runtime plugin channel, gateway, Plugin SDK, secret, titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, parsing IP, penjaga jaringan, web-fetch, dan SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gerbang eksekusi tool agen                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifes, registry, instalasi package-manager, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh kewarasan alur kerja. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Tetap berada di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ia hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error pada permukaan bernilai tinggi yang sempit di runner Blacksmith Linux yang lebih kecil. Penjaga pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draf hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk perubahan kode eksekusi perintah/model/tool agen dan dispatch balasan, kode skema/migrasi/IO config, kode auth/secret/sandbox/keamanan, channel inti dan runtime plugin channel bawaan, protokol/metode-server gateway, perekat runtime memori/SDK, MCP/proses/pengiriman keluar, katalog runtime/model provider, diagnostik sesi/antrean pengiriman, loader plugin, kontrak Plugin SDK/paket, atau runtime balasan Plugin SDK. Perubahan config CodeQL dan alur kerja kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Permukaan                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan auth, secret, sandbox, cron, dan gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema config, migrasi, normalisasi, dan IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan plugin channel bawaan                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi perintah, dispatch model/provider, dispatch dan antrean auto-reply, serta control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan jembatan tool, helper supervisi proses, dan kontrak pengiriman keluar                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, facade runtime memori, alias Plugin SDK memori, perekat aktivasi runtime memori, dan perintah doctor memori                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundle event/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/pemotongan/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, serta registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol gateway, dan kontrak runtime control-plane tugas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, image-generation, dan media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket plugin                                                                                      |

Kualitas tetap dipisahkan dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan plugin bawaan sebaiknya ditambahkan kembali sebagai pekerjaan lanjutan yang tercakup atau di-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Alur kerja pemeliharaan

### Agen Docs

Alur kerja `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru saja mendarat. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Invocation workflow-run dilewati saat `main` sudah bergerak maju atau saat run Docs Agent non-terlewati lainnya dibuat dalam satu jam terakhir. Saat berjalan, ia meninjau rentang commit dari SHA sumber Docs Agent non-terlewati sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak lintasan docs terakhir.

### Agen Performa Test

Alur kerja `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk test yang lambat. Ia tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, tetapi ia melewati jika invocation workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gerbang aktivitas harian itu. Lane ini membuat laporan performa Vitest full-suite yang dikelompokkan, mengizinkan Codex hanya membuat perbaikan performa test kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah test baseline yang lulus. Jika baseline memiliki test yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite pasca-agen harus lulus sebelum apa pun di-commit. Saat `main` maju sebelum push bot mendarat, lane me-rebase patch yang sudah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch basi yang konflik dilewati. Ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keselamatan drop-sudo yang sama seperti agen docs.

### PR Duplikat Setelah Merge

Alur kerja `Duplicate PRs After Merge` adalah alur kerja maintainer manual untuk pembersihan duplikat pasca-land. Default-nya dry-run dan hanya menutup PR yang dicantumkan secara eksplisit saat `apply=true`. Sebelum memutasi GitHub, ia memverifikasi bahwa PR yang mendarat sudah di-merge dan bahwa setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gerbang pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gerbang pemeriksaan lokal itu lebih ketat tentang batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan test inti ditambah lint/guard inti;
- perubahan khusus test inti hanya menjalankan typecheck test inti ditambah lint inti;
- perubahan produksi ekstensi menjalankan typecheck prod ekstensi dan test ekstensi ditambah lint ekstensi;
- perubahan khusus test ekstensi menjalankan typecheck test ekstensi ditambah lint ekstensi;
- perubahan Plugin SDK publik atau kontrak plugin meluas ke typecheck ekstensi karena ekstensi bergantung pada kontrak inti tersebut (sweep ekstensi Vitest tetap menjadi pekerjaan test eksplisit);
- bump versi khusus metadata rilis menjalankan pemeriksaan versi/config/dependensi-root yang ditargetkan;
- perubahan root/config yang tidak diketahui fail safe ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan secara sengaja lebih murah daripada `check:changed`: edit test langsung menjalankan dirinya sendiri, edit sumber memprioritaskan pemetaan eksplisit, lalu test saudara dan dependen import-graph. Config pengiriman ruang-grup bersama adalah salah satu pemetaan eksplisit: perubahan pada config visible-reply grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui test balasan inti ditambah regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya saat perubahan cukup luas di harness sehingga set terpetakan yang murah bukan proksi yang dapat dipercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan utamakan box baru yang sudah di-warm untuk bukti luas. Sebelum menghabiskan gate yang lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sinkronisasi yang ukurannya tidak terduga besar, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat saat file root yang wajib ada seperti `pnpm-lock.yaml` hilang atau saat `git status --short` menunjukkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sinkronisasi jarak jauh bukan salinan PR yang dapat dipercaya; hentikan box tersebut dan warm box baru alih-alih men-debug kegagalan pengujian produk. Untuk PR penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk proses sanity tersebut.

`pnpm testbox:run` juga menghentikan pemanggilan Blacksmith CLI lokal yang tetap berada di fase sinkronisasi selama lebih dari lima menit tanpa keluaran pascasinkronisasi. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard tersebut, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang luar biasa besar.

Crabbox adalah wrapper remote-box milik repo untuk bukti Linux maintainer. Gunakan saat pemeriksaan terlalu luas untuk local loopback edit, saat paritas CI penting, atau saat bukti memerlukan secret, Docker, lane paket, box yang dapat digunakan ulang, atau log jarak jauh. Backend OpenClaw normal adalah `blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah fallback untuk gangguan Blacksmith, masalah kuota, atau pengujian kapasitas milik sendiri secara eksplisit.

Sebelum menjalankan untuk pertama kalinya, periksa wrapper dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo menolak binary Crabbox usang yang tidak mengiklankan `blacksmith-testbox`. Teruskan provider secara eksplisit meskipun `.crabbox.yaml` memiliki default owned-cloud.

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

Baca ringkasan JSON akhir. Field yang berguna adalah `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Proses Crabbox sekali jalan yang didukung Blacksmith seharusnya menghentikan Testbox secara otomatis; jika proses terinterupsi atau pembersihan tidak jelas, periksa box aktif dan hentikan hanya box yang Anda buat:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Gunakan reuse hanya saat Anda memang membutuhkan beberapa perintah pada box terhidrasi yang sama:

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

Eskalasi ke kapasitas Crabbox milik sendiri hanya saat Blacksmith down, dibatasi kuota, tidak memiliki lingkungan yang dibutuhkan, atau kapasitas milik sendiri memang menjadi tujuannya secara eksplisit:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` memiliki default provider, sinkronisasi, dan hidrasi GitHub Actions untuk lane owned-cloud. File ini mengecualikan `.git` lokal agar checkout Actions yang terhidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote lokal maintainer dan object store, serta mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, penyiapan Node/pnpm, fetch `origin/main`, dan handoff lingkungan non-secret untuk perintah owned-cloud `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Channel pengembangan](/id/install/development-channels)
