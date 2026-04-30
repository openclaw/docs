---
read_when:
    - Anda perlu memahami mengapa sebuah tugas CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pengulangan validasi rilis
summary: Graf pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur CI
x-i18n:
    generated_at: "2026-04-30T09:37:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan mematikan lane mahal ketika hanya area yang tidak terkait berubah. Run manual `workflow_dispatch` secara sengaja melewati scope cerdas dan menyebarkan seluruh grafik untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow [`Plugin Prerelease`](#plugin-prerelease) terpisah dan hanya berjalan dari [`Full Release Validation`](#full-release-validation) atau dispatch manual eksplisit.

## Ikhtisar pipeline

| Job                              | Tujuan                                                                                       | Kapan berjalan                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, scope yang berubah, extension yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draft      |
| `security-scm-fast`              | Deteksi kunci privat dan audit workflow melalui `zizmor`                                     | Selalu pada push dan PR non-draft      |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependensi terhadap advisory npm                               | Selalu pada push dan PR non-draft      |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                       | Selalu pada push dan PR non-draft      |
| `check-dependencies`             | Pass khusus dependensi Knip produksi ditambah guard allowlist file tidak terpakai            | Perubahan yang relevan dengan Node     |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak build, dan artefak downstream yang dapat digunakan ulang | Perubahan yang relevan dengan Node     |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol              | Perubahan yang relevan dengan Node     |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel bershard dengan hasil pemeriksaan agregat stabil                 | Perubahan yang relevan dengan Node     |
| `checks-node-core-test`          | Shard pengujian Core Node, mengecualikan lane channel, bundled, contract, dan extension      | Perubahan yang relevan dengan Node     |
| `check`                          | Ekuivalen gate lokal utama bershard: tipe prod, lint, guard, tipe pengujian, dan smoke ketat | Perubahan yang relevan dengan Node     |
| `check-additional`               | Shard arsitektur, boundary, guard permukaan extension, package-boundary, dan gateway-watch   | Perubahan yang relevan dengan Node     |
| `build-smoke`                    | Pengujian smoke CLI yang sudah dibuild dan smoke memori startup                              | Perubahan yang relevan dengan Node     |
| `checks`                         | Verifier untuk pengujian channel artefak build                                               | Perubahan yang relevan dengan Node     |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                  | Dispatch CI manual untuk rilis         |
| `check-docs`                     | Pemeriksaan format docs, lint, dan tautan rusak                                              | Docs berubah                           |
| `skills-python`                  | Ruff + pytest untuk skill berbasis Python                                                    | Perubahan yang relevan dengan skill Python |
| `checks-windows`                 | Pengujian proses/path khusus Windows ditambah regresi specifier impor runtime bersama        | Perubahan yang relevan dengan Windows  |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artefak build bersama                            | Perubahan yang relevan dengan macOS    |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk aplikasi macOS                                        | Perubahan yang relevan dengan macOS    |
| `android`                        | Pengujian unit Android untuk kedua flavor ditambah satu build APK debug                      | Perubahan yang relevan dengan Android  |
| `test-performance-agent`         | Optimasi pengujian lambat Codex harian setelah aktivitas tepercaya                          | CI utama sukses atau dispatch manual   |

## Urutan fail-fast

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal dengan cepat tanpa menunggu job artefak dan matriks platform yang lebih berat.
3. `build-artifacts` tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR atau ref `main` yang sama. Anggap itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tergantikan. Kunci konkurensi CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

## Scope dan routing

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area berscope berubah.

- **Edit workflow CI** memvalidasi grafik CI Node ditambah linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap terscope pada perubahan sumber platform.
- **Edit khusus routing CI, edit fixture core-test murah tertentu, dan edit helper/test-routing kontrak Plugin yang sempit** menggunakan jalur manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard core penuh, shard bundled-plugin, dan matriks guard tambahan ketika perubahan terbatas pada permukaan routing atau helper yang diuji langsung oleh tugas cepat.
- **Pemeriksaan Node Windows** terscope pada wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang mengeksekusi lane tersebut; perubahan sumber, Plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada di lane Linux Node.

Keluarga pengujian Node paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, lane unit core kecil dipasangkan, auto-reply berjalan sebagai empat worker seimbang (dengan subtree reply dipecah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi agentic gateway/plugin disebar di seluruh job Node agentic khusus sumber yang ada alih-alih menunggu artefak build. Pengujian browser, QA, media, dan Plugin lain-lain yang luas menggunakan konfigurasi Vitest khususnya alih-alih catch-all Plugin bersama. Shard include-pattern merekam entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh konfigurasi dari shard terfilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard guard boundary menjalankan guard independen kecilnya secara konkuren di dalam satu job. Gateway watch, pengujian channel, dan shard core support-boundary berjalan secara konkuren di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibuild.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membuild APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane pengujian unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipin ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file produksi tidak terpakai dari Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak terpakai gagal ketika PR menambahkan file tidak terpakai baru yang belum ditinjau atau meninggalkan entri allowlist usang, sambil mempertahankan permukaan Plugin dinamis yang disengaja, generated, build, live-test, dan package bridge yang tidak dapat diselesaikan Knip secara statis.

## Dispatch manual

Dispatch CI manual menjalankan grafik job yang sama seperti CI normal tetapi memaksa setiap lane berscope non-Android aktif: shard Linux Node, shard bundled-plugin, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, build smoke, pemeriksaan docs, skill Python, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android hanya dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prerelease Plugin, shard `agentic-plugins` khusus rilis, sweep batch extension penuh, dan lane Docker prerelease Plugin dikecualikan dari CI. Suite Docker prerelease berjalan hanya ketika `Full Release Validation` mendispatch workflow `Plugin Prerelease` terpisah dengan gate release-validation diaktifkan.

Run manual menggunakan grup konkurensi unik sehingga suite penuh kandidat rilis tidak dibatalkan oleh push atau run PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik itu terhadap branch, tag, atau SHA commit lengkap sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, pekerjaan keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan cepat protokol/kontrak/bundel, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, pemverifikasi agregat pengujian Node, pemeriksaan docs, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke juga memakai Ubuntu yang di-host GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard Plugin berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Node Linux, shard pengujian Plugin bundel, `android`                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif CPU sehingga 8 vCPU biayanya lebih besar daripada penghematannya); build Docker install-smoke (biaya waktu antrean 32-vCPU lebih besar daripada penghematannya)                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` di `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` di `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

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

`Full Release Validation` adalah alur kerja payung manual untuk "menjalankan semuanya sebelum rilis." Alur ini menerima branch, tag, atau SHA commit lengkap, men-dispatch alur kerja manual `CI` dengan target tersebut, men-dispatch `Plugin Prerelease` untuk pembuktian khusus rilis bagi Plugin/package/static/Docker, dan men-dispatch `OpenClaw Release Checks` untuk install smoke, package acceptance, suite jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram. Alur ini juga dapat menjalankan alur kerja pascapublikasi `NPM Telegram Beta E2E` ketika spesifikasi package yang sudah dipublikasikan diberikan.

`release_profile` mengontrol keluasan live/provider yang diteruskan ke pemeriksaan rilis:

- `minimum` mempertahankan lane OpenAI/core tercepat yang kritis untuk rilis.
- `stable` menambahkan set provider/backend stabil.
- `full` menjalankan matriks provider/media advisory yang luas.

Payung mencatat id run child yang di-dispatch, dan pekerjaan akhir `Verify full validation` memeriksa ulang conclusion run child saat ini dan menambahkan tabel pekerjaan terlambat untuk setiap run child. Jika alur kerja child dijalankan ulang dan menjadi hijau, jalankan ulang hanya pekerjaan verifier induk untuk menyegarkan hasil payung dan ringkasan waktu.

Untuk pemulihan, `Full Release Validation` dan `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk child CI penuh normal, `release-checks` untuk setiap child rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus.

`OpenClaw Release Checks` memakai ref alur kerja tepercaya untuk me-resolve ref yang dipilih sekali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke alur kerja Docker live/E2E jalur rilis dan shard package acceptance. Ini menjaga byte package tetap konsisten di seluruh kotak rilis dan menghindari pemaketan ulang kandidat yang sama di beberapa pekerjaan child.

## Shard live dan E2E

Child live/E2E rilis mempertahankan cakupan luas `pnpm test:live` native, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs`, bukan satu pekerjaan serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- pekerjaan `native-live-src-gateway-profiles` yang difilter provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard media audio/video terpisah dan shard musik yang difilter provider

Ini mempertahankan cakupan file yang sama sekaligus membuat kegagalan provider live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun sekali jalan manual.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh alur kerja `Live Media Runner Image`. Image tersebut sudah memasang `ffmpeg` dan `ffprobe`; pekerjaan media hanya memverifikasi binary sebelum setup. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — pekerjaan container bukan tempat yang tepat untuk meluncurkan pengujian Docker bersarang.

Shard model/backend live berbasis Docker memakai image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Alur kerja rilis live membangun dan mendorong image tersebut sekali, lalu shard model live Docker, Gateway, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Jika shard tersebut membangun ulang target Docker sumber lengkap secara independen, run rilis salah konfigurasi dan akan membuang waktu berjalan untuk build image duplikat.

## Package Acceptance

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah package OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan package acceptance memvalidasi satu tarball melalui harness Docker E2E yang sama yang digunakan pengguna setelah instalasi atau pembaruan.

### Pekerjaan

1. `resolve_package` melakukan checkout `workflow_ref`, me-resolve satu kandidat package, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref alur kerja, ref package, versi, SHA-256, dan profil dalam ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Alur kerja reusable mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker package-digest bila diperlukan, dan menjalankan lane Docker yang dipilih terhadap package tersebut alih-alih memaketkan checkout alur kerja. Ketika suatu profil memilih beberapa `docker_lanes` bertarget, alur kerja reusable menyiapkan package dan image bersama sekali, lalu menyebarkan lane tersebut sebagai pekerjaan Docker bertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan memasang artefak `package-under-test` yang sama ketika Package Acceptance me-resolve satu; dispatch Telegram mandiri tetap dapat memasang spesifikasi npm yang telah dipublikasikan.
4. `summary` menggagalkan alur kerja jika resolusi package, Docker acceptance, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan beta/stabil yang telah dipublikasikan.
- `source=ref` mengemas cabang, tag, atau SHA commit penuh `package_ref` tepercaya. Resolver mengambil cabang/tag OpenClaw, memverifikasi bahwa commit yang dipilih dapat dijangkau dari riwayat cabang repositori atau tag rilis, menginstal dependensi di worktree terpisah, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas ketika `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` ditambah `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk jalur rilis Docker lengkap dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib ketika `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan kembali artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap tersedia untuk dispatch mandiri.

Pemeriksaan rilis memanggil Package Acceptance dengan `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'`, dan `telegram_mode=mock-openai`. Chunk Docker jalur rilis mencakup lane paket/update/Plugin yang tumpang tindih; Package Acceptance mempertahankan bukti kompatibilitas bundled-channel native artefak, Plugin offline, dan Telegram terhadap tarball paket terselesaikan yang sama. Pemeriksaan rilis lintas OS tetap mencakup onboarding, installer, dan perilaku platform spesifik OS; validasi produk paket/update harus dimulai dengan Package Acceptance. Lane paket Windows dan installer fresh juga memverifikasi bahwa paket yang terinstal dapat mengimpor override browser-control dari jalur Windows absolut mentah. Smoke agent-turn lintas OS OpenAI memakai default `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika disetel, jika tidak `openai/gpt-5.4-mini`, sehingga bukti instalasi dan Gateway tetap cepat dan deterministik.

### Jendela kompatibilitas lama

Package Acceptance memiliki jendela kompatibilitas lama terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang dikenal di `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` ketika paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` yang dipersistenkan hilang;
- smoke Plugin dapat membaca lokasi install-record lama atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan install record dan perilaku tanpa reinstall tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memberi peringatan untuk file cap metadata build lokal yang sudah dikirimkan. Paket berikutnya harus memenuhi kontrak modern; kondisi yang sama akan gagal, bukan memberi peringatan atau dilewati.

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

Saat men-debug run package acceptance yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa run anak `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Lebih baik menjalankan ulang profil paket yang gagal atau lane Docker persis daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Workflow `Install Smoke` terpisah menggunakan kembali skrip scope yang sama melalui job `preflight` miliknya sendiri. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifest Plugin bawaan, atau permukaan inti Plugin/channel/Gateway/Plugin SDK yang diuji oleh job smoke Docker. Perubahan Plugin bawaan khusus sumber, edit khusus pengujian, dan edit khusus docs tidak memesan worker Docker. Jalur cepat membangun image Dockerfile root sekali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e container gateway-network, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker Plugin bawaan terbatas di bawah timeout perintah agregat 240 detik (setiap run Docker skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan instalasi paket QR dan cakupan Docker/update installer untuk run terjadwal nightly, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan kembali satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instalasi paket QR, smoke Dockerfile/Gateway root, smoke installer/update, dan E2E Docker Plugin bawaan cepat sebagai job terpisah sehingga pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk merge commit) tidak memaksa jalur penuh; ketika logika changed-scope meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi nightly atau rilis.

Smoke image-provider instalasi global Bun yang lambat digate secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal nightly dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat memilih untuk menyertakannya, tetapi pull request dan push `main` tidak. Pengujian Docker QR dan installer mempertahankan Dockerfile khusus instalasi masing-masing.

## E2E Docker lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/dependensi-Plugin;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi plan yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tuning

| Variabel                               | Default | Tujuan                                                                                        |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot main-pool untuk lane normal.                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live serentak agar provider tidak melakukan throttle.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane instalasi npm serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda bertahap antar-start lane untuk menghindari badai create daemon Docker; setel `0` untuk tanpa jeda bertahap. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/tail terpilih memakai batas yang lebih ketat. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak plan scheduler tanpa menjalankan lane.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati cleanup smoke agar agent dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat dari batas efektifnya tetap dapat dimulai dari pool kosong, lalu berjalan sendiri hingga melepas kapasitas. Preflight agregat lokal memeriksa Docker, menghapus container E2E OpenClaw yang usang, menampilkan status lane aktif, mempersistenkan timing lane untuk pengurutan yang terlama lebih dulu, dan secara default berhenti menjadwalkan lane pooled baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan kembali

Workflow live/E2E yang dapat digunakan kembali menanyakan `scripts/test-docker-all.mjs --plan-json` tentang paket, jenis image, image live, lane, dan cakupan kredensial yang diperlukan. `scripts/docker-e2e.mjs` lalu mengonversi plan tersebut menjadi output dan ringkasan GitHub. Workflow ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket current-run, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/functional bertag digest paket melalui cache layer Docker Blacksmith ketika plan membutuhkan lane dengan paket terinstal; dan menggunakan kembali input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout terbatas 180 detik per percobaan sehingga stream registry/cache yang macet cepat dicoba ulang alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkan dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hingga `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b`, dan `bundled-channels-contracts`. Chunk agregat `bundled-channels` tetap tersedia untuk rerun manual sekali jalan, dan `plugins-runtime-core`, `plugins-runtime`, serta `plugins-integrations` tetap menjadi alias Plugin/runtime agregat. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane penginstal provider. Chunk `bundled-channels` menjalankan lane `bundled-channel-*` dan `bundled-channel-update-*` yang dipecah, bukan lane `bundled-channel-deps` serial yang serba menjadi satu.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` saat cakupan jalur rilis penuh memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane pembaruan bundled-channel mencoba ulang sekali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON rencana penjadwal, tabel lane lambat, dan perintah rerun per lane. Input alur kerja `docker_lanes` menjalankan lane yang dipilih terhadap image yang disiapkan, bukan job chunk, sehingga debugging lane gagal tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk run tersebut; jika lane yang dipilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun tersebut. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan saat nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Alur kerja live/E2E terjadwal menjalankan suite Docker jalur rilis penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, jadi ini adalah alur kerja terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri membiarkan suite tersebut nonaktif. Suite ini menyeimbangkan pengujian Plugin bawaan di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch Plugin yang berat impor tidak membuat job CI tambahan.

## QA Lab

QA Lab memiliki lane CI khusus di luar alur kerja utama yang dicakup secara cerdas.

- Alur kerja `Parity gate` berjalan pada perubahan PR yang cocok dan dispatch manual; alur kerja ini membangun runtime QA privat dan membandingkan pack agentik mock GPT-5.5 dan Opus 4.6.
- Alur kerja `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan pada dispatch manual; alur kerja ini menyebarkan mock parity gate, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport Matrix dan Telegram live dengan provider mock deterministik dan model berkualifikasi mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup provider-plugin normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas provider dicakup oleh suite model live, provider native, dan provider Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input alur kerja manual tetap `all`; dispatch manual `matrix_profile=all` selalu membagi cakupan Matrix penuh menjadi job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; parity gate QA-nya menjalankan pack kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas akhir.

Jangan menempatkan jalur landing PR di balik `Parity gate` kecuali perubahan benar-benar menyentuh runtime QA, paritas model-pack, atau permukaan yang dimiliki alur kerja paritas. Untuk perbaikan channel, konfigurasi, dokumen, atau unit-test normal, perlakukan ini sebagai sinyal opsional dan ikuti bukti CI/check yang dicakup.

## CodeQL

Alur kerja `CodeQL` sengaja menjadi pemindai keamanan pass pertama yang sempit, bukan sweep repositori penuh. Run harian, manual, dan guard pull request non-draft memindai kode alur kerja Actions ditambah permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan keyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Guard pull request tetap ringan: ini hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan keyakinan tinggi yang sama seperti alur kerja terjadwal. CodeQL Android dan macOS tetap di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, rahasia, sandbox, cron, dan baseline gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti ditambah runtime Plugin channel, gateway, Plugin SDK, rahasia, titik sentuh audit                    |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, parsing IP, network guard, web-fetch, dan SSRF Plugin SDK                                               |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gate eksekusi tool agen                                                     |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan kontrak paket instalasi Plugin, loader, manifest, registry, staging dependensi runtime, pemuatan sumber, dan Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity alur kerja. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi keluar dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Disimpan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Critical Quality

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan severity error di atas permukaan bernilai tinggi yang sempit pada runner Blacksmith Linux yang lebih kecil. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draft hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang cocok untuk perubahan kode eksekusi command/model/tool agen dan dispatch balasan, kode skema/migrasi/IO konfigurasi, kode auth/rahasia/sandbox/keamanan, runtime channel inti dan Plugin channel bawaan, protokol Gateway/server-method, glue runtime memori/SDK, MCP/proses/pengiriman keluar, runtime provider/katalog model, diagnostik sesi/antrean pengiriman, loader Plugin, kontrak paket/Plugin SDK, atau runtime balasan Plugin SDK. Perubahan konfigurasi CodeQL dan alur kerja kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                               | Permukaan                                                                                                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`           | Auth, secret, sandbox, cron, dan kode batas keamanan gateway                                                                                                |
| `/codeql-critical-quality/config-boundary`             | Skema konfigurasi, migrasi, normalisasi, dan kontrak IO                                                                                                     |
| `/codeql-critical-quality/gateway-runtime-boundary`    | Skema protokol Gateway dan kontrak metode server                                                                                                           |
| `/codeql-critical-quality/channel-runtime-boundary`    | Kontrak implementasi kanal inti dan Plugin kanal bawaan                                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`      | Eksekusi perintah, dispatch model/provider, dispatch dan antrean balasan otomatis, serta kontrak runtime control-plane ACP                                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge tool, helper supervisi proses, dan kontrak pengiriman keluar                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`     | SDK host memori, facade runtime memori, alias SDK Plugin memori, glue aktivasi runtime memori, dan perintah doctor memori                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundel event/log diagnostik, dan kontrak CLI doctor sesi |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`    | Dispatch balasan masuk SDK Plugin, helper payload/chunking/runtime balasan, opsi balasan kanal, antrean pengiriman, dan helper binding sesi/thread          |
| `/codeql-critical-quality/provider-runtime-boundary`   | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, serta registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`            | Bootstrap UI kontrol, persistensi lokal, alur kontrol Gateway, dan kontrak runtime control-plane tugas                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`  | Kontrak runtime fetch/search web inti, IO media, pemahaman media, pembuatan gambar, dan pembuatan media                                                     |
| `/codeql-critical-quality/plugin-boundary`             | Kontrak loader, registry, permukaan publik, dan entrypoint SDK Plugin                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Sumber SDK Plugin sisi paket yang dipublikasikan dan helper kontrak paket Plugin                                                                            |

Kualitas tetap dipisahkan dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL untuk Swift, Python, dan Plugin bawaan harus ditambahkan kembali sebagai pekerjaan lanjutan yang berscope atau dishard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Alur kerja pemeliharaan

### Docs Agent

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru landed. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Invokasi workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-skipped lain dibuat dalam satu jam terakhir. Saat berjalan, workflow ini meninjau rentang commit dari SHA sumber Docs Agent non-skipped sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pass dokumen terakhir.

### Test Performance Agent

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk pengujian lambat. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, tetapi akan dilewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gate aktivitas harian itu. Lane ini membuat laporan performa Vitest full-suite yang dikelompokkan, mengizinkan Codex hanya membuat perbaikan performa pengujian kecil yang mempertahankan coverage alih-alih refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah baseline pengujian yang lulus. Jika baseline memiliki pengujian yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agent harus lulus sebelum apa pun di-commit. Saat `main` maju sebelum push bot landed, lane ini me-rebase patch yang sudah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch stale yang konflik dilewati. Lane ini menggunakan Ubuntu yang di-host GitHub sehingga action Codex dapat mempertahankan postur keselamatan drop-sudo yang sama seperti docs agent.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat pasca-land. Default-nya adalah dry-run dan hanya menutup PR yang dicantumkan secara eksplisit ketika `apply=true`. Sebelum mengubah GitHub, workflow ini memverifikasi bahwa PR yang landed sudah di-merge dan setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gate pemeriksaan lokal itu lebih ketat terhadap batas arsitektur daripada cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan pengujian inti plus lint/guard inti;
- perubahan khusus pengujian inti hanya menjalankan typecheck pengujian inti plus lint inti;
- perubahan produksi ekstensi menjalankan typecheck prod ekstensi dan pengujian ekstensi plus lint ekstensi;
- perubahan khusus pengujian ekstensi menjalankan typecheck pengujian ekstensi plus lint ekstensi;
- perubahan SDK Plugin publik atau kontrak Plugin meluas ke typecheck ekstensi karena ekstensi bergantung pada kontrak inti tersebut (sweep ekstensi Vitest tetap menjadi pekerjaan pengujian eksplisit);
- bump versi metadata-only rilis menjalankan pemeriksaan versi/konfigurasi/dependensi-root yang tertarget;
- perubahan root/konfigurasi yang tidak diketahui fail safe ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit pengujian langsung menjalankan dirinya sendiri, edit sumber mengutamakan pemetaan eksplisit, lalu pengujian sibling dan dependent import-graph. Konfigurasi pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada konfigurasi balasan yang terlihat grup, mode pengiriman balasan sumber, atau prompt sistem message-tool diarahkan melalui pengujian balasan inti plus regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas pada harness sehingga set terpetakan murah bukan proxy yang tepercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan utamakan box warmed baru untuk bukti luas. Sebelum menghabiskan gate lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sync yang sangat besar, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat ketika file root wajib seperti `pnpm-lock.yaml` menghilang atau ketika `git status --short` menunjukkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sync remote bukan salinan PR yang tepercaya; hentikan box itu dan warm box baru alih-alih men-debug kegagalan pengujian produk. Untuk PR penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk run sanity tersebut.

`pnpm testbox:run` juga menghentikan invokasi CLI Blacksmith lokal yang tetap berada di fase sync selama lebih dari lima menit tanpa output pasca-sync. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard itu, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang sangat besar.

## Terkait

- [Ringkasan instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
