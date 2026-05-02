---
read_when:
    - Anda perlu memahami mengapa sebuah job CI berjalan atau tidak berjalan
    - Anda sedang memecahkan masalah pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pengulangan validasi rilis
    - Anda sedang mengubah dispatch ClawSweeper atau penerusan aktivitas GitHub
summary: Graf pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-02T09:15:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39af4afcb3e7c847c44a9d47513ac4b99c62d13fb139ece0bee979f24687ea38
    source_path: ci.md
    workflow: 16
---

CI OpenClaw berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan menonaktifkan lane yang mahal ketika hanya area yang tidak terkait berubah. Run `workflow_dispatch` manual sengaja melewati scoping pintar dan menyebarkan seluruh graph untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow [`Plugin Prerelease`](#plugin-prerelease) yang terpisah dan hanya berjalan dari [`Full Release Validation`](#full-release-validation) atau dispatch manual eksplisit.

## Ikhtisar pipeline

| Job                              | Tujuan                                                                                      | Kapan berjalan                       |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Mendeteksi perubahan khusus docs, cakupan yang berubah, extension yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draf |
| `security-scm-fast`              | Deteksi kunci privat dan audit workflow melalui `zizmor`                                    | Selalu pada push dan PR non-draf |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisories npm                            | Selalu pada push dan PR non-draf |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                      | Selalu pada push dan PR non-draf |
| `check-dependencies`             | Pass khusus dependensi Knip produksi plus penjaga allowlist file yang tidak digunakan        | Perubahan yang relevan dengan Node |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak build, dan artefak downstream yang dapat digunakan ulang | Perubahan yang relevan dengan Node |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol              | Perubahan yang relevan dengan Node |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil       | Perubahan yang relevan dengan Node |
| `checks-node-core-test`          | Shard pengujian Core Node, mengecualikan lane channel, bundled, contract, dan extension      | Perubahan yang relevan dengan Node |
| `check`                          | Padanan gate lokal utama yang di-shard: tipe prod, lint, guard, tipe test, dan smoke ketat   | Perubahan yang relevan dengan Node |
| `check-additional`               | Shard arsitektur, boundary, guard surface extension, package-boundary, dan gateway-watch     | Perubahan yang relevan dengan Node |
| `build-smoke`                    | Smoke test CLI hasil build dan smoke memori startup                                         | Perubahan yang relevan dengan Node |
| `checks`                         | Verifier untuk test channel artefak build                                                    | Perubahan yang relevan dengan Node |
| `checks-node-compat-node22`      | Lane build kompatibilitas Node 22 dan smoke                                                  | Dispatch CI manual untuk rilis |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan tautan rusak                                         | Docs berubah |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                   | Perubahan yang relevan dengan skill Python |
| `checks-windows`                 | Test proses/path khusus Windows plus regresi specifier import runtime bersama                | Perubahan yang relevan dengan Windows |
| `macos-node`                     | Lane test TypeScript macOS menggunakan artefak build bersama                                 | Perubahan yang relevan dengan macOS |
| `macos-swift`                    | Lint, build, dan test Swift untuk aplikasi macOS                                             | Perubahan yang relevan dengan macOS |
| `android`                        | Unit test Android untuk kedua flavor plus satu build APK debug                               | Perubahan yang relevan dengan Android |
| `test-performance-agent`         | Optimisasi test lambat Codex harian setelah aktivitas tepercaya                             | Keberhasilan CI main atau dispatch manual |

## Urutan gagal-cepat

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal dengan cepat tanpa menunggu job matriks artefak dan platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat agar konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR yang sama atau ref `main`. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tergantikan. Kunci konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub di grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run suite penuh manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

## Cakupan dan perutean

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area bercakupan berubah.

- **Edit workflow CI** memvalidasi graph CI Node plus linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap dicakup ke perubahan sumber platform.
- **Edit khusus perutean CI, edit fixture core-test murah tertentu, dan edit sempit helper/test-routing kontrak Plugin** menggunakan jalur manifes cepat khusus Node: `preflight`, keamanan, dan satu task `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard core penuh, shard bundled-plugin, dan matriks guard tambahan ketika perubahan terbatas pada surface perutean atau helper yang diuji langsung oleh task cepat.
- **Pemeriksaan Node Windows** dicakup ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan surface workflow CI yang menjalankan lane tersebut; perubahan sumber, Plugin, install-smoke, dan khusus test yang tidak terkait tetap berada di lane Linux Node.

Keluarga test Node yang paling lambat dipisah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner secara berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, lane unit core kecil dipasangkan, auto-reply berjalan sebagai empat worker seimbang (dengan subtree reply dibagi menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi Gateway/Plugin agentik disebar ke job Node agentik khusus sumber yang sudah ada alih-alih menunggu artefak build. Test browser luas, QA, media, dan Plugin lain-lain menggunakan konfigurasi Vitest khusus masing-masing alih-alih catch-all Plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard terfilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard guard boundary menjalankan guard independen kecilnya secara konkuren di dalam satu job. Gateway watch, test channel, dan shard support-boundary core berjalan secara konkuren di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane unit-test-nya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipin ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file produksi tidak digunakan dari Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak digunakan gagal ketika PR menambahkan file tidak digunakan baru yang belum ditinjau atau meninggalkan entri allowlist basi, sambil mempertahankan surface Plugin dinamis, generated, build, live-test, dan bridge package yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan check out atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow memiliki empat lane:

- `clawsweeper_item` untuk permintaan review issue dan pull request yang tepat;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit dalam komentar issue;
- `clawsweeper_commit_review` untuk permintaan review tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diinspeksi agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata ternormalisasi: jenis event, action, actor, repository, nomor item, URL, judul, state, dan kutipan singkat untuk komentar atau review bila ada. Lane ini sengaja menghindari penerusan seluruh body Webhook. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event ternormalisasi ke hook Gateway OpenClaw untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan seharusnya memposting ke `#clawsweeper` hanya ketika event mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise Webhook duplikat, dan lalu lintas review normal seharusnya menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, body, teks review, nama branch, dan pesan commit GitHub sebagai data yang tidak tepercaya di seluruh jalur ini. Semua itu adalah input untuk peringkasan dan triage, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan graph job yang sama seperti CI normal tetapi memaksa setiap lane bercakupan non-Android aktif: shard Linux Node, shard bundled-plugin, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, build smoke, pemeriksaan docs, Skills Python, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android hanya dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prerelease Plugin, shard khusus rilis `agentic-plugins`, sweep batch extension penuh, dan lane Docker prerelease Plugin dikecualikan dari CI. Suite Docker prerelease hanya berjalan ketika `Full Release Validation` mengirim workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual menggunakan grup konkurensi unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh push atau run PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan graph tersebut terhadap branch, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Pelaksana

| Pelaksana                        | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, pekerjaan keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/terbundel cepat, pemeriksaan kontrak kanal yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifikator agregat pengujian Node, pemeriksaan docs, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard Plugin berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Node Linux, shard pengujian Plugin terbundel, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif terhadap CPU sehingga 8 vCPU memakan biaya lebih besar daripada penghematannya); build Docker install-smoke (biaya waktu antrean 32-vCPU lebih besar daripada penghematannya)                                                                                                                                                                                                                                                                                                                     |
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
```

## Validasi Rilis Penuh

`Full Release Validation` adalah workflow payung manual untuk "menjalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit lengkap, memicu workflow manual `CI` dengan target tersebut, memicu `Plugin Prerelease` untuk bukti Plugin/paket/statis/Docker khusus rilis, dan memicu `OpenClaw Release Checks` untuk install smoke, penerimaan paket, rangkaian jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram. Dengan `rerun_group=all` dan `release_profile=full`, workflow ini juga menjalankan `NPM Telegram Beta E2E` terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Setelah publikasi, teruskan `npm_telegram_package_spec` untuk menjalankan ulang lane paket Telegram yang sama terhadap paket npm yang telah dipublikasikan.

Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama pekerjaan workflow yang tepat, perbedaan profil, artefak, dan
handle pemutaran ulang terfokus.

`OpenClaw Release Publish` adalah workflow rilis manual yang mengubah status. Picu workflow ini
dari `release/YYYY.M.D` atau `main` setelah tag rilis ada dan setelah
preflight npm OpenClaw berhasil. Workflow ini memverifikasi `pnpm plugins:sync:check`,
memicu `Plugin NPM Release` untuk semua paket Plugin yang dapat dipublikasikan, memicu
`Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru setelah itu memicu
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
memicu `Full Release Validation` dari ref yang dipin tersebut, memverifikasi setiap
`headSha` workflow turunan cocok dengan target, dan menghapus branch sementara saat
run selesai. Verifikator payung juga gagal jika ada workflow turunan yang berjalan pada
SHA yang berbeda.

`release_profile` mengontrol cakupan live/provider yang diteruskan ke pemeriksaan rilis. Workflow
rilis manual default ke `stable`; gunakan `full` hanya saat Anda
secara sengaja menginginkan matriks advisory provider/media yang luas.

- `minimum` mempertahankan lane OpenAI/inti kritis rilis yang paling cepat.
- `stable` menambahkan set provider/backend stabil.
- `full` menjalankan matriks advisory provider/media yang luas.

Payung mencatat id run turunan yang dipicu, dan pekerjaan akhir `Verify full validation` memeriksa ulang kesimpulan run turunan saat ini dan menambahkan tabel pekerjaan paling lambat untuk setiap run turunan. Jika workflow turunan dijalankan ulang dan menjadi hijau, jalankan ulang hanya pekerjaan verifikator induk untuk menyegarkan hasil payung dan ringkasan waktu.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk turunan CI penuh normal, `plugin-prerelease` hanya untuk turunan prarilis Plugin, `release-checks` untuk setiap turunan rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga pemutaran ulang kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk me-resolve ref yang dipilih satu kali menjadi tarball `release-package-under-test`, lalu meneruskan artefak tersebut ke workflow Docker jalur rilis live/E2E dan shard penerimaan paket. Ini menjaga byte paket tetap konsisten di seluruh kotak rilis dan menghindari pengemasan ulang kandidat yang sama di beberapa pekerjaan turunan.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan payung lama. Monitor induk membatalkan workflow turunan apa pun yang
sudah dipicunya saat induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang run release-check dua jam yang basi. Validasi branch/tag
rilis dan grup pemutaran ulang terfokus tetap menggunakan `cancel-in-progress: false`.

## Shard live dan E2E

Turunan live/E2E rilis mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs` alih-alih satu pekerjaan serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- pekerjaan `native-live-src-gateway-profiles` yang difilter berdasarkan provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard audio/video media terpisah dan shard musik yang difilter berdasarkan provider

Ini mempertahankan cakupan file yang sama sekaligus membuat kegagalan provider live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk pemutaran ulang manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh workflow `Live Media Runner Image`. Image tersebut memasang `ffmpeg` dan `ffprobe` sebelumnya; pekerjaan media hanya memverifikasi binary sebelum setup. Pertahankan rangkaian live berbasis Docker pada runner Blacksmith normal — pekerjaan kontainer bukan tempat yang tepat untuk meluncurkan pengujian Docker bersarang.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Workflow rilis live membangun dan mendorong image itu sekali, lalu shard model live Docker, gateway yang dishard per provider, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Gateway Docker membawa batas `timeout` eksplisit pada level skrip di bawah timeout job workflow sehingga container yang macet atau jalur pembersihan gagal cepat alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber lengkap secara independen, run rilis salah konfigurasi dan akan membuang waktu wall clock untuk build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi tree sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness Docker E2E yang sama yang dijalankan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref workflow, ref paket, versi, SHA-256, dan profil di ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker digest paket bila diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket itu alih-alih mengemas checkout workflow. Ketika sebuah profil memilih beberapa `docker_lanes` bertarget, workflow reusable menyiapkan paket dan image bersama sekali, lalu menyebarkan lane tersebut sebagai job Docker bertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama ketika Package Acceptance menyelesaikan satu paket; dispatch Telegram mandiri masih dapat menginstal spesifikasi npm yang sudah dipublikasikan.
4. `summary` menggagalkan workflow jika resolusi paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan beta/stabil yang telah dipublikasikan.
- `source=ref` mengemas branch, tag, atau SHA commit lengkap `package_ref` tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, menginstal dependensi di worktree terpisah, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` ditambah `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — potongan jalur rilis Docker lengkap dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan live ClawHub. Lane Telegram opsional menggunakan ulang artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap tersedia untuk dispatch mandiri.

Untuk kebijakan khusus pengujian pembaruan dan plugin, termasuk perintah lokal,
lane Docker, input Package Acceptance, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Package Acceptance dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues`, dan `telegram_mode=mock-openai`. Ini menjaga bukti migrasi paket, pembaruan, pembersihan dependensi plugin usang, plugin offline, pembaruan plugin, dan Telegram pada tarball paket terselesaikan yang sama. Pemeriksaan rilis lintas OS tetap mencakup onboarding spesifik OS, installer, dan perilaku platform; validasi produk paket/pembaruan harus dimulai dengan Package Acceptance. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run. Dalam Package Acceptance, tarball `package-under-test` yang diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline fallback yang dipublikasikan, dengan default `openclaw@latest`; perintah rerun lane yang gagal mempertahankan baseline itu. Atur `published_upgrade_survivor_baselines=release-history` untuk memperluas lane ke seluruh matriks riwayat yang didedup: enam rilis stabil terbaru, `2026.4.23`, dan rilis stabil terbaru sebelum `2026-03-15`. Atur `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas baseline yang sama ke seluruh fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, jalur log tilde, dan akar dependensi plugin legacy yang usang. Workflow `Update Migration` terpisah menggunakan lane Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` ketika pertanyaannya adalah pembersihan pembaruan terpublikasi yang menyeluruh, bukan cakupan CI Full Release normal. Run agregat lokal dapat meneruskan spesifikasi paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane yang dipublikasikan mengonfigurasi baseline dengan resep perintah `openclaw config set` bawaan, merekam langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway dimulai. Lane baru paket dan installer Windows juga memverifikasi bahwa paket yang diinstal dapat mengimpor override kontrol browser dari jalur Windows absolut mentah. Smoke agent-turn lintas OS OpenAI menggunakan default `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika ditetapkan, jika tidak `openai/gpt-5.5`, sehingga bukti instalasi dan gateway tetap pada model pengujian GPT-5 yang disukai.

### Jendela kompatibilitas legacy

Package Acceptance memiliki jendela kompatibilitas legacy yang dibatasi untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui di `dist/postinstall-inventory.json` dapat menunjuk ke file yang tidak disertakan dalam tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke plugin dapat membaca lokasi catatan instalasi legacy atau menerima persistensi catatan instalasi marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan catatan instalasi dan perilaku tanpa instal ulang tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memberi peringatan untuk file stamp metadata build lokal yang sudah terkirim. Paket setelahnya harus memenuhi kontrak modern; kondisi yang sama akan gagal alih-alih memperingatkan atau melewati.

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

Saat men-debug run penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa run anak `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Utamakan menjalankan ulang profil paket yang gagal atau lane Docker persis alih-alih menjalankan ulang validasi rilis lengkap.

## Smoke instalasi

Workflow `Install Smoke` terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifest plugin bawaan, atau permukaan plugin/channel/gateway/Plugin SDK inti yang dijalankan job smoke Docker. Perubahan plugin bawaan khusus sumber, edit khusus pengujian, dan edit khusus dokumentasi tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root sekali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e gateway-network container, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker plugin bawaan yang dibatasi di bawah timeout perintah agregat 240 detik (setiap run Docker skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan cakupan instalasi paket QR dan Docker/update installer untuk run terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR SHA target, lalu menjalankan instalasi paket QR, smoke Dockerfile/gateway root, smoke installer/update, dan Docker E2E plugin bawaan cepat sebagai job terpisah sehingga pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; ketika logika cakupan perubahan akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi malam atau rilis.

Smoke image-provider instalasi global Bun yang lambat dikendalikan secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat memilih untuk menyertakannya, tetapi pull request dan push `main` tidak. Pengujian Docker QR dan installer mempertahankan Dockerfile khusus instalasi masing-masing.

## Docker E2E Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/dependensi plugin;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi rencana yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parameter yang dapat disetel

| Variabel                               | Bawaan | Tujuan                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot pool akhir yang sensitif terhadap provider.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live serentak agar provider tidak melakukan throttle.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instalasi npm serentak.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-layanan serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda bertahap antar-start lane untuk menghindari lonjakan pembuatan oleh daemon Docker; setel `0` untuk tanpa jeda bertahap.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/akhir tertentu menggunakan batas yang lebih ketat.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | tidak disetel   | `1` mencetak rencana scheduler tanpa menjalankan lane.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | tidak disetel   | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agen dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya masih dapat mulai dari pool kosong, lalu berjalan sendiri sampai melepas kapasitas. Agregat lokal melakukan preflight Docker, menghapus kontainer E2E OpenClaw yang kedaluwarsa, memancarkan status lane aktif, mempertahankan timing lane untuk pengurutan yang paling lama terlebih dahulu, dan berhenti menjadwalkan lane pooled baru setelah kegagalan pertama secara default.

### Alur kerja live/E2E yang dapat digunakan ulang

Alur kerja live/E2E yang dapat digunakan ulang menanyakan `scripts/test-docker-all.mjs --plan-json` tentang paket, jenis image, image live, lane, dan cakupan kredensial yang diperlukan. `scripts/docker-e2e.mjs` kemudian mengonversi rencana tersebut menjadi output dan ringkasan GitHub. Ini memaketkan OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket dari run saat ini, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mengirim image GHCR Docker E2E bare/functional bertag digest paket melalui cache lapisan Docker Blacksmith ketika rencana membutuhkan lane dengan paket terinstal; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout terbatas 180 detik per percobaan agar stream registry/cache yang macet cepat dicoba ulang alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkannya dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` sampai `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat Plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer provider.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` ketika cakupan penuh release-path memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane pembaruan bundled-channel mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON rencana scheduler, tabel lane lambat, dan perintah rerun per lane. Input alur kerja `docker_lanes` menjalankan lane yang dipilih terhadap image yang disiapkan alih-alih job chunk, sehingga debugging lane yang gagal dibatasi pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk run tersebut; jika lane yang dipilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun tersebut. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan ketika nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # unduh artefak Docker dan cetak perintah rerun tertarget gabungan/per lane
pnpm test:docker:timings <summary>   # ringkasan lane lambat dan jalur kritis fase
```

Alur kerja live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, jadi ini adalah alur kerja terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri menonaktifkan suite tersebut. Ini menyeimbangkan pengujian Plugin bundled di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar sehingga batch Plugin yang berat impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis mengelompokkan lane Docker tertarget dalam grup kecil untuk menghindari pemesanan puluhan runner bagi job berdurasi satu hingga tiga menit.

## QA Lab

QA Lab memiliki lane CI khusus di luar alur kerja utama yang dicakup secara cerdas.

- Alur kerja `Parity gate` berjalan pada perubahan PR yang cocok dan dispatch manual; ini membangun runtime QA privat dan membandingkan paket agentic mock GPT-5.5 dan Opus 4.6.
- Alur kerja `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan pada dispatch manual; ini menyebarkan gate paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan provider mock deterministik dan model berkualifikasi mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup Plugin provider normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas provider dicakup oleh suite model live, provider native, dan provider Docker terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input alur kerja manual tetap `all`; dispatch manual `matrix_profile=all` selalu membagi cakupan Matrix penuh menjadi job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas final.

Jangan menempatkan jalur landing PR di belakang `Parity gate` kecuali perubahan benar-benar menyentuh runtime QA, paritas paket model, atau surface yang dimiliki alur kerja paritas. Untuk perbaikan channel, konfigurasi, docs, atau unit-test normal, perlakukan ini sebagai sinyal opsional dan ikuti bukti CI/check yang tercakup.

## CodeQL

Alur kerja `CodeQL` sengaja menjadi pemindai keamanan first-pass yang sempit, bukan sweep repositori penuh. Run harian, manual, dan guard pull request non-draft memindai kode alur kerja Actions plus surface JavaScript/TypeScript berisiko tertinggi dengan query keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Guard pull request tetap ringan: ini hanya mulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti alur kerja terjadwal. CodeQL Android dan macOS tetap di luar default PR.

### Kategori keamanan

| Kategori                                          | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, rahasia, sandbox, cron, dan baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti plus runtime Plugin channel, gateway, Plugin SDK, rahasia, titik sentuh audit              |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF inti, parsing IP, guard jaringan, web-fetch, dan surface kebijakan SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman outbound, dan gate eksekusi tool agen                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Instalasi Plugin, loader, manifest, registry, instalasi package-manager, source-loading, dan surface kepercayaan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity alur kerja. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL pada Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi runtime bahkan ketika bersih.

### Kategori Critical Quality

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ini hanya menjalankan query kualitas JavaScript/TypeScript non-keamanan dengan tingkat keparahan error pada surface sempit bernilai tinggi di runner Blacksmith Linux yang lebih kecil. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draft hanya menjalankan shard kualitas `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang cocok untuk perubahan kode eksekusi perintah/model/tool agen dan dispatch balasan, kode skema/migrasi/IO konfigurasi, kode auth/rahasia/sandbox/keamanan, channel inti dan runtime Plugin channel bundled, protocol gateway/metode server, runtime memori/perekat SDK, MCP/proses/pengiriman outbound, runtime provider/katalog model, diagnostik sesi/antrean pengiriman, loader Plugin, Plugin SDK/kontrak paket, atau runtime balasan Plugin SDK. Perubahan konfigurasi CodeQL dan alur kerja kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Surface                                                                                                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Batas kode keamanan autentikasi, rahasia, sandbox, Cron, dan Gateway                                                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema konfigurasi, migrasi, normalisasi, dan IO                                                                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan Plugin channel bawaan                                                                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi perintah, dispatch model/penyedia, dispatch dan antrean balasan otomatis, serta control plane ACP                                                                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Kontrak server MCP dan bridge alat, helper supervisi proses, serta pengiriman keluar                                                                                                                     |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, facade runtime memori, alias SDK Plugin memori, glue aktivasi runtime memori, dan perintah doctor memori                                                                               |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, surface bundel event/log diagnostik, dan kontrak CLI doctor sesi                                             |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk SDK Plugin, helper payload/pemotongan/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread                                                 |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, autentikasi dan discovery penyedia, registrasi runtime penyedia, default/katalog penyedia, serta registry web/search/fetch/embedding                                         |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol Gateway, dan kontrak runtime control plane tugas                                                                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, pembuatan gambar, dan pembuatan media                                                                                                 |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, surface publik, dan entrypoint SDK Plugin                                                                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber SDK Plugin sisi paket yang dipublikasikan dan helper kontrak paket plugin                                                                                                                        |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan plugin bawaan harus ditambahkan kembali sebagai pekerjaan lanjutan yang dibatasi atau di-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Alur kerja pemeliharaan

### Docs Agent

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru saja mendarat. Workflow ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, dan dispatch manual dapat menjalankannya secara langsung. Pemanggilan workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-terlewati lain dibuat dalam satu jam terakhir. Saat berjalan, workflow ini meninjau rentang commit dari SHA sumber Docs Agent non-terlewati sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pass dokumentasi terakhir.

### Test Performance Agent

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk test yang lambat. Workflow ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, tetapi dilewati jika pemanggilan workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gate aktivitas harian itu. Lane ini membangun laporan performa Vitest terkelompok full-suite, membiarkan Codex hanya membuat perbaikan performa test kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah baseline test yang lulus. Jika baseline memiliki test yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lulus sebelum apa pun di-commit. Ketika `main` maju sebelum push bot mendarat, lane ini melakukan rebase patch yang sudah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch stale yang konflik dilewati. Workflow ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti agen dokumentasi.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat setelah landing. Default-nya adalah dry-run dan hanya menutup PR yang dicantumkan eksplisit saat `apply=true`. Sebelum memutasi GitHub, workflow ini memverifikasi bahwa PR yang mendarat sudah di-merge dan bahwa setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gate pemeriksaan lokal itu lebih ketat tentang batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan test inti plus lint/guard inti;
- perubahan hanya test inti hanya menjalankan typecheck test inti plus lint inti;
- perubahan produksi ekstensi menjalankan typecheck prod ekstensi dan test ekstensi plus lint ekstensi;
- perubahan hanya test ekstensi menjalankan typecheck test ekstensi plus lint ekstensi;
- perubahan SDK Plugin publik atau kontrak plugin diperluas ke typecheck ekstensi karena ekstensi bergantung pada kontrak inti tersebut (sweep ekstensi Vitest tetap menjadi pekerjaan test eksplisit);
- bump versi khusus metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root tertarget;
- perubahan root/konfigurasi yang tidak dikenal fail safe ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit test langsung menjalankan dirinya sendiri, edit sumber memprioritaskan pemetaan eksplisit, lalu test saudara dan dependen import-graph. Konfigurasi pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada konfigurasi balasan terlihat grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui test balasan inti plus regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas di harness sehingga set murah yang dipetakan bukan proxy yang tepercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan utamakan box warmed baru untuk bukti luas. Sebelum menghabiskan gate lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sync yang sangat besar secara tidak terduga, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat ketika file root wajib seperti `pnpm-lock.yaml` hilang atau ketika `git status --short` menunjukkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sync remote bukan salinan PR yang tepercaya; hentikan box itu dan warm box baru alih-alih men-debug kegagalan test produk. Untuk PR penghapusan besar yang disengaja, set `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk run sanity tersebut.

`pnpm testbox:run` juga menghentikan pemanggilan CLI Blacksmith lokal yang tetap berada di fase sync selama lebih dari lima menit tanpa output pasca-sync. Set `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard itu, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang sangat besar.

Crabbox adalah jalur remote-box kedua milik repo untuk bukti Linux ketika Blacksmith tidak tersedia atau ketika kapasitas cloud milik sendiri lebih disukai. Warm sebuah box, hidrasi melalui workflow proyek, lalu jalankan perintah melalui CLI Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` memiliki default penyedia, sync, dan hidrasi GitHub Actions. File ini mengecualikan `.git` lokal agar checkout Actions yang terhidrasi mempertahankan metadata Git remote miliknya sendiri alih-alih menyinkronkan remote dan object store lokal maintainer, dan mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, setup Node/pnpm, fetch `origin/main`, dan handoff environment non-rahasia yang nanti di-source oleh perintah `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Channel pengembangan](/id/install/development-channels)
