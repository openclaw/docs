---
read_when:
    - Anda perlu memahami mengapa pekerjaan CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan pelaksanaan atau pelaksanaan ulang validasi rilis
summary: Graf pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Alur CI
x-i18n:
    generated_at: "2026-04-30T18:38:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan menonaktifkan lane mahal ketika hanya area yang tidak terkait yang berubah. Run manual `workflow_dispatch` sengaja melewati smart scoping dan menyebarkan seluruh graph untuk kandidat rilis dan validasi luas. Lane Android tetap opt-in melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow terpisah [`Plugin Prerelease`](#plugin-prerelease) dan hanya berjalan dari [`Full Release Validation`](#full-release-validation) atau dispatch manual eksplisit.

## Gambaran umum pipeline

| Job                              | Tujuan                                                                                      | Kapan berjalan                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, cakupan yang berubah, extension yang berubah, dan membangun manifest CI      | Selalu pada push dan PR non-draft |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                        | Selalu pada push dan PR non-draft |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisory npm                             | Selalu pada push dan PR non-draft |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                | Selalu pada push dan PR non-draft |
| `check-dependencies`             | Pass khusus dependensi Knip produksi plus guard allowlist file yang tidak digunakan                    | Perubahan yang relevan dengan Node              |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak hasil build, dan artefak downstream yang dapat digunakan ulang          | Perubahan yang relevan dengan Node              |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol                 | Perubahan yang relevan dengan Node              |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat stabil                         | Perubahan yang relevan dengan Node              |
| `checks-node-core-test`          | Shard pengujian Core Node, mengecualikan lane channel, bundled, contract, dan extension             | Perubahan yang relevan dengan Node              |
| `check`                          | Ekuivalen gate lokal utama yang di-shard: tipe prod, lint, guard, tipe pengujian, dan smoke ketat   | Perubahan yang relevan dengan Node              |
| `check-additional`               | Shard arsitektur, boundary, guard permukaan extension, package-boundary, dan gateway-watch | Perubahan yang relevan dengan Node              |
| `build-smoke`                    | Pengujian smoke built-CLI dan smoke memori startup                                               | Perubahan yang relevan dengan Node              |
| `checks`                         | Verifier untuk pengujian channel artefak hasil build                                                    | Perubahan yang relevan dengan Node              |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                   | Dispatch CI manual untuk rilis    |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan link rusak                                                | Docs berubah                       |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                       | Perubahan yang relevan dengan skill Python      |
| `checks-windows`                 | Pengujian proses/path khusus Windows plus regresi specifier impor runtime bersama         | Perubahan yang relevan dengan Windows           |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artefak hasil build bersama                                  | Perubahan yang relevan dengan macOS             |
| `macos-swift`                    | Swift lint, build, dan pengujian untuk aplikasi macOS                                               | Perubahan yang relevan dengan macOS             |
| `android`                        | Pengujian unit Android untuk kedua flavor plus satu build APK debug                                 | Perubahan yang relevan dengan Android           |
| `test-performance-agent`         | Optimisasi pengujian lambat Codex harian setelah aktivitas tepercaya                                    | CI main berhasil atau dispatch manual |

## Urutan fail-fast

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job tersendiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job artefak dan matriks platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR yang sama atau ref `main`. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tergantikan. Kunci concurrency CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

## Cakupan dan routing

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifest preflight bertindak seolah setiap area bercakupan berubah.

- **Edit workflow CI** memvalidasi graph CI Node plus linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap dicakup ke perubahan source platform.
- **Edit khusus routing CI, edit fixture core-test murah tertentu, dan edit helper/test-routing kontrak plugin yang sempit** menggunakan path manifest cepat khusus Node: `preflight`, keamanan, dan satu task `checks-fast-core`. Path tersebut melewati artefak build, kompatibilitas Node 22, kontrak channel, shard core penuh, shard bundled-plugin, dan matriks guard tambahan ketika perubahan terbatas pada permukaan routing atau helper yang langsung diuji task cepat.
- **Pemeriksaan Windows Node** dicakup ke wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang mengeksekusi lane tersebut; perubahan source, plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada pada lane Linux Node.

Keluarga pengujian Node paling lambat dibagi atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, lane unit core kecil dipasangkan, auto-reply berjalan sebagai empat worker seimbang (dengan subtree reply dibagi menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi agentic gateway/plugin disebar ke seluruh job agentic Node source-only yang ada alih-alih menunggu artefak hasil build. Pengujian plugin browser luas, QA, media, dan miscellaneous menggunakan konfigurasi Vitest khusus masing-masing alih-alih catch-all plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan seluruh config dari shard terfilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard guard boundary menjalankan guard independen kecilnya secara konkuren dalam satu job. Gateway watch, pengujian channel, dan shard support-boundary core berjalan secara konkuren di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest` lalu membangun APK debug Play. Flavor third-party tidak memiliki source set atau manifest terpisah; lane pengujian unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipin ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file produksi tidak digunakan dari Knip dengan `scripts/deadcode-unused-files.allowlist.mjs`. Guard file tidak digunakan gagal ketika PR menambahkan file tidak digunakan baru yang belum ditinjau atau meninggalkan entri allowlist usang, sambil mempertahankan permukaan plugin dinamis, generated, build, live-test, dan bridge package yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Dispatch manual

Dispatch CI manual menjalankan graph job yang sama seperti CI normal tetapi memaksa setiap lane bercakupan non-Android aktif: shard Linux Node, shard bundled-plugin, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, build smoke, pemeriksaan docs, Python skills, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android hanya dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prerelease plugin, shard `agentic-plugins` khusus rilis, sweep batch extension penuh, dan lane Docker prerelease plugin dikecualikan dari CI. Suite Docker prerelease berjalan hanya ketika `Full Release Validation` men-dispatch workflow `Plugin Prerelease` terpisah dengan gate release-validation diaktifkan.

Run manual menggunakan grup concurrency unik sehingga full suite kandidat rilis tidak dibatalkan oleh push atau run PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan graph tersebut terhadap branch, tag, atau full commit SHA sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Pelaksana                        | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, pekerjaan keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/terbundel cepat, pemeriksaan kontrak kanal yang dipecah shard, shard `check` kecuali lint, shard dan agregat `check-additional`, pemverifikasi agregat pengujian Node, pemeriksaan dokumentasi, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke juga memakai Ubuntu yang di-host GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard plugin berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Node Linux, shard pengujian Plugin terbundel, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif terhadap CPU sehingga 8 vCPU lebih mahal daripada penghematan yang diberikan); build Docker install-smoke (waktu antrean 32-vCPU lebih mahal daripada penghematan yang diberikan)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork kembali memakai `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork kembali memakai `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

## Validasi Rilis Lengkap

`Full Release Validation` adalah alur kerja payung manual untuk "menjalankan semuanya sebelum rilis." Ini menerima branch, tag, atau SHA commit lengkap, memicu alur kerja `CI` manual dengan target tersebut, memicu `Plugin Prerelease` untuk bukti Plugin/paket/statis/Docker khusus rilis, dan memicu `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, rangkaian jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram. Ini juga dapat menjalankan alur kerja pascapublikasi `NPM Telegram Beta E2E` ketika spesifikasi paket yang telah dipublikasikan disediakan.

`release_profile` mengendalikan cakupan live/penyedia yang diteruskan ke pemeriksaan rilis:

- `minimum` mempertahankan lane OpenAI/core tercepat yang kritis untuk rilis.
- `stable` menambahkan kumpulan penyedia/backend stabil.
- `full` menjalankan matriks penyedia/media advisory yang luas.

Payung mencatat id run turunan yang dipicu, dan pekerjaan akhir `Verify full validation` memeriksa ulang kesimpulan run turunan saat ini serta menambahkan tabel pekerjaan terlambat untuk setiap run turunan. Jika sebuah alur kerja turunan dijalankan ulang dan menjadi hijau, jalankan ulang hanya pekerjaan pemverifikasi induk untuk menyegarkan hasil payung dan ringkasan waktunya.

Untuk pemulihan, baik `Full Release Validation` maupun `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk turunan CI penuh normal, `release-checks` untuk setiap turunan rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga agar run ulang kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus.

`OpenClaw Release Checks` memakai ref alur kerja tepercaya untuk menyelesaikan ref yang dipilih sekali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke alur kerja Docker jalur rilis live/E2E dan shard penerimaan paket. Ini menjaga byte paket tetap konsisten di seluruh kotak rilis dan menghindari pengemasan ulang kandidat yang sama di beberapa pekerjaan turunan.

## Shard live dan E2E

Turunan live/E2E rilis mempertahankan cakupan `pnpm test:live` native yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs` alih-alih satu pekerjaan serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- pekerjaan `native-live-src-gateway-profiles` yang difilter penyedia
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard media audio/video terpisah dan shard musik yang difilter penyedia

Ini mempertahankan cakupan file yang sama sambil membuat kegagalan penyedia live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk run ulang manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibuat oleh alur kerja `Live Media Runner Image`. Image itu memasang `ffmpeg` dan `ffprobe` sebelumnya; pekerjaan media hanya memverifikasi biner sebelum penyiapan. Pertahankan rangkaian live berbasis Docker pada runner Blacksmith normal — pekerjaan kontainer bukan tempat yang tepat untuk meluncurkan pengujian Docker bersarang.

Shard model/backend live berbasis Docker memakai image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Alur kerja rilis live membuat dan mendorong image itu sekali, lalu shard model live Docker, Gateway, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah dikonfigurasi dan akan membuang waktu dinding untuk build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` ketika pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness Docker E2E yang sama yang digunakan pengguna setelah instalasi atau pembaruan.

### Pekerjaan

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref alur kerja, ref paket, versi, SHA-256, dan profil dalam ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Alur kerja yang dapat digunakan ulang mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker digest paket saat diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket itu alih-alih mengemas checkout alur kerja. Ketika sebuah profil memilih beberapa `docker_lanes` tertarget, alur kerja yang dapat digunakan ulang menyiapkan paket dan image bersama sekali, lalu menyebarkan lane tersebut sebagai pekerjaan Docker tertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan ketika `telegram_mode` bukan `none` dan memasang artefak `package-under-test` yang sama ketika Package Acceptance menyelesaikan satu paket; dispatch Telegram mandiri masih dapat memasang spesifikasi npm yang dipublikasikan.
4. `summary` menggagalkan alur kerja jika resolusi paket, penerimaan Docker, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang persis seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan beta/stabil yang dipublikasikan.
- `source=ref` mengemas branch, tag, atau SHA commit lengkap `package_ref` yang tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, menginstal dependensi di worktree terlepas, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artifact yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas saat `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` ditambah `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib saat `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Lane Telegram opsional menggunakan kembali artifact `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Pemeriksaan rilis memanggil Package Acceptance dengan `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'`, dan `telegram_mode=mock-openai`. Chunk Docker jalur rilis mencakup lane paket/pembaruan/Plugin yang tumpang tindih; Package Acceptance mempertahankan bukti kompatibilitas bundled-channel native artifact, Plugin offline, dan Telegram terhadap tarball paket terselesaikan yang sama. Pemeriksaan rilis lintas OS tetap mencakup onboarding, penginstal, dan perilaku platform yang spesifik OS; validasi produk paket/pembaruan harus dimulai dengan Package Acceptance. Lane paket Windows dan fresh penginstal juga memverifikasi bahwa paket terinstal dapat mengimpor override kontrol browser dari path Windows absolut mentah. Smoke agent-turn lintas OS OpenAI menggunakan default `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat disetel, jika tidak `openai/gpt-5.4-mini`, sehingga bukti install dan Gateway tetap cepat dan deterministik.

### Jendela kompatibilitas warisan

Package Acceptance memiliki jendela kompatibilitas warisan terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang dikenal di `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` saat paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke Plugin dapat membaca lokasi catatan install warisan atau menerima persistensi catatan install marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan catatan install dan perilaku tanpa reinstall tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memberi peringatan untuk file stempel metadata build lokal yang sudah dikirimkan. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama akan gagal, bukan memperingatkan atau melewati.

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

Saat men-debug run penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa child run `docker_acceptance` dan artifact Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Lebih baik menjalankan ulang profil paket yang gagal atau lane Docker yang persis daripada menjalankan ulang validasi rilis penuh.

## Smoke install

Workflow `Install Smoke` yang terpisah menggunakan kembali skrip cakupan yang sama melalui job `preflight` miliknya. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifest Plugin bawaan, atau permukaan Plugin/channel/Gateway/Plugin SDK inti yang dijalankan oleh job smoke Docker. Perubahan Plugin bawaan khusus sumber, edit khusus pengujian, dan edit khusus docs tidak memesan worker Docker. Jalur cepat membangun image Dockerfile root sekali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e container gateway-network, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker Plugin bawaan terbatas dengan batas waktu perintah agregat 240 detik (setiap Docker run skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan cakupan install paket QR dan Docker/pembaruan penginstal untuk run terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan penginstal/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan kembali satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan install paket QR, smoke Dockerfile root/Gateway, smoke penginstal/pembaruan, dan E2E Docker Plugin bawaan cepat sebagai job terpisah agar pekerjaan penginstal tidak menunggu di belakang smoke image root.

Push `main` (termasuk merge commit) tidak memaksa jalur penuh; saat logika cakupan perubahan akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke install penuh ke validasi malam atau rilis.

Smoke image-provider install global Bun yang lambat digate secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat ikut mengaktifkannya, tetapi pull request dan push `main` tidak. Pengujian Docker QR dan penginstal mempertahankan Dockerfile berfokus install masing-masing.

## E2E Docker lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane penginstal/pembaruan/dependensi-Plugin;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya menjalankan plan yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Pengaturan

| Variabel                               | Default | Tujuan                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live serentak agar provider tidak melakukan throttle.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane install npm serentak.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-layanan serentak.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda antar-start lane untuk menghindari lonjakan create daemon Docker; setel `0` untuk tanpa jeda. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/tail tertentu menggunakan batas lebih ketat. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak plan scheduler tanpa menjalankan lane.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agent dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya tetap dapat dimulai dari pool kosong, lalu berjalan sendiri hingga melepas kapasitas. Agregat lokal melakukan preflight Docker, menghapus container E2E OpenClaw usang, mengeluarkan status lane aktif, menyimpan timing lane untuk pengurutan terlama-terlebih-dahulu, dan secara default berhenti menjadwalkan lane pool baru setelah kegagalan pertama.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan ke `scripts/test-docker-all.mjs --plan-json` paket, jenis image, image live, lane, dan cakupan kredensial apa yang diperlukan. `scripts/docker-e2e.mjs` lalu mengonversi plan tersebut menjadi output dan ringkasan GitHub. Workflow ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artifact paket run saat ini, atau mengunduh artifact paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/fungsional bertag digest paket melalui cache layer Docker Blacksmith saat plan memerlukan lane dengan paket terinstal; dan menggunakan kembali input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout terbatas 180 detik per percobaan sehingga stream registry/cache yang macet dicoba ulang dengan cepat alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkan dan menjalankan beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Potongan Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hingga `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b`, dan `bundled-channels-contracts`. Potongan agregat `bundled-channels` tetap tersedia untuk pengulangan manual satu kali, dan `plugins-runtime-core`, `plugins-runtime`, serta `plugins-integrations` tetap menjadi alias Plugin/runtime agregat. Alias lane `install-e2e` tetap menjadi alias pengulangan manual agregat untuk kedua lane penginstal penyedia. Potongan `bundled-channels` menjalankan lane `bundled-channel-*` dan `bundled-channel-update-*` yang dipecah, bukan lane serial serba-satu `bundled-channel-deps`.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` saat cakupan jalur rilis penuh memintanya, dan mempertahankan potongan mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane pembaruan channel bawaan mencoba ulang sekali untuk kegagalan jaringan npm yang sementara.

Setiap potongan mengunggah `.artifacts/docker-tests/` dengan log lane, pengukuran waktu, `summary.json`, `failures.json`, pengukuran waktu fase, JSON rencana scheduler, tabel lane lambat, dan perintah pengulangan per lane. Input `docker_lanes` workflow menjalankan lane yang dipilih terhadap image yang sudah disiapkan, bukan job potongan, sehingga debug lane yang gagal tetap terbatas pada satu job Docker yang ditargetkan dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk run tersebut; jika lane yang dipilih adalah lane Docker live, job yang ditargetkan membangun image uji live secara lokal untuk pengulangan itu. Perintah pengulangan GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan saat nilai-nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E terjadwal menjalankan suite Docker jalur rilis penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, sehingga menjadi workflow terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri tidak menjalankan suite tersebut. Workflow ini menyeimbangkan pengujian Plugin bawaan di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi Plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch Plugin yang berat impor tidak membuat job CI tambahan.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow utama yang dicakup cerdas.

- Workflow `Parity gate` berjalan pada perubahan PR yang cocok dan dispatch manual; workflow ini membangun runtime QA privat dan membandingkan paket agentic GPT-5.5 dan Opus 4.6 tiruan.
- Workflow `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan pada dispatch manual; workflow ini menyebarkan parity gate tiruan, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport Matrix dan Telegram live dengan penyedia tiruan deterministik dan model yang memenuhi syarat tiruan (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup Plugin penyedia normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh suite model live, penyedia native, dan penyedia Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, dengan menambahkan `--fail-fast` hanya saat CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu memecah cakupan Matrix penuh ke dalam job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; parity gate QA-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke dalam job laporan kecil untuk perbandingan paritas akhir.

Jangan letakkan jalur landing PR di belakang `Parity gate` kecuali perubahan benar-benar menyentuh runtime QA, paritas paket model, atau permukaan yang dimiliki workflow paritas. Untuk perbaikan channel, konfigurasi, dokumentasi, atau unit test normal, perlakukan itu sebagai sinyal opsional dan ikuti bukti CI/pemeriksaan yang dicakup.

## CodeQL

Workflow `CodeQL` sengaja merupakan pemindai keamanan tahap pertama yang sempit, bukan sweep repositori penuh. Run harian, manual, dan penjaga pull request non-draft memindai kode workflow Actions ditambah permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Penjaga pull request tetap ringan: hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti workflow terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret, sandbox, cron, dan baseline gateway                                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti ditambah runtime Plugin channel, Gateway, Plugin SDK, secret, titik sentuh audit                     |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan SSRF inti, parsing IP, penjaga jaringan, web-fetch, dan kebijakan SSRF Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gate eksekusi tool agent                                                    |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan trust instalasi Plugin, loader, manifes, registry, staging dependensi runtime, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh kewajaran workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL pada Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Shard ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan tingkat error-severity di atas permukaan sempit bernilai tinggi pada runner Blacksmith Linux yang lebih kecil. Penjaga pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draft hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang cocok untuk perubahan kode eksekusi perintah/model/tool agent dan dispatch balasan, kode skema/migrasi/IO konfigurasi, kode auth/secret/sandbox/keamanan, runtime channel inti dan Plugin channel bawaan, protokol/metode server Gateway, perekat runtime/SDK memori, MCP/proses/pengiriman keluar, katalog model/runtime penyedia, diagnostik sesi/antrian pengiriman, loader Plugin, kontrak paket/Plugin SDK, atau runtime balasan Plugin SDK. Perubahan konfigurasi CodeQL dan workflow kualitas menjalankan seluruh dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                               | Permukaan                                                                                                                                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`           | Kode batas keamanan autentikasi, rahasia, sandbox, Cron, dan Gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`             | Skema konfigurasi, migrasi, normalisasi, dan kontrak IO                                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`    | Skema protokol Gateway dan kontrak metode server                                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`    | Kontrak implementasi kanal inti dan Plugin kanal bawaan                                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`      | Eksekusi perintah, dispatch model/penyedia, dispatch dan antrean balasan otomatis, serta kontrak runtime bidang kontrol ACP                                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan jembatan alat, pembantu pengawasan proses, serta kontrak pengiriman keluar                                                                                     |
| `/codeql-critical-quality/memory-runtime-boundary`     | SDK host memori, fasad runtime memori, alias SDK Plugin memori, perekat aktivasi runtime memori, dan perintah doctor memori                                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, pembantu pengikatan/pengiriman sesi keluar, permukaan bundel peristiwa/log diagnostik, dan kontrak CLI doctor sesi        |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`    | Dispatch balasan masuk SDK Plugin, pembantu payload/pemotongan/runtime balasan, opsi balasan kanal, antrean pengiriman, dan pembantu pengikatan sesi/thread                  |
| `/codeql-critical-quality/provider-runtime-boundary`   | Normalisasi katalog model, autentikasi dan penemuan penyedia, pendaftaran runtime penyedia, default/katalog penyedia, serta registri web/pencarian/fetch/embedding            |
| `/codeql-critical-quality/ui-control-plane`            | Bootstrap UI kontrol, persistensi lokal, alur kontrol Gateway, dan kontrak runtime bidang kontrol tugas                                                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`  | Fetch/pencarian web inti, IO media, pemahaman media, pembuatan gambar, dan kontrak runtime pembuatan media                                                                    |
| `/codeql-critical-quality/plugin-boundary`             | Kontrak loader, registri, permukaan publik, dan entrypoint SDK Plugin                                                                                                         |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Sumber SDK Plugin sisi paket yang dipublikasikan dan pembantu kontrak paket Plugin                                                                                            |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Perluasan CodeQL untuk Swift, Python, dan Plugin bawaan sebaiknya ditambahkan kembali sebagai pekerjaan lanjutan yang terskop atau di-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Alur kerja pemeliharaan

### Agen Docs

Alur kerja `Docs Agent` adalah jalur pemeliharaan Codex berbasis peristiwa untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru saja masuk. Alur ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Invokasi workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-dilewati lain dibuat dalam satu jam terakhir. Saat berjalan, alur ini meninjau rentang commit dari SHA sumber Docs Agent non-dilewati sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pemeriksaan dokumen terakhir.

### Agen Performa Pengujian

Alur kerja `Test Performance Agent` adalah jalur pemeliharaan Codex berbasis peristiwa untuk pengujian yang lambat. Alur ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, tetapi alur ini melewati eksekusi jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gerbang aktivitas harian itu. Jalur ini membangun laporan performa Vitest full-suite yang dikelompokkan, membiarkan Codex hanya membuat perbaikan performa pengujian kecil yang mempertahankan cakupan, bukan refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah baseline pengujian yang lulus. Jika baseline memiliki pengujian yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lulus sebelum apa pun di-commit. Ketika `main` maju sebelum push bot masuk, jalur ini melakukan rebase pada patch yang telah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch basi yang konflik dilewati. Alur ini menggunakan Ubuntu yang di-host GitHub sehingga action Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti agen docs.

### PR Duplikat Setelah Merge

Alur kerja `Duplicate PRs After Merge` adalah alur kerja maintainer manual untuk pembersihan duplikat setelah land. Default-nya adalah dry-run dan hanya menutup PR yang tercantum secara eksplisit saat `apply=true`. Sebelum memutasi GitHub, alur ini memverifikasi bahwa PR yang di-land sudah di-merge dan setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gerbang pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gerbang pemeriksaan lokal tersebut lebih ketat tentang batas arsitektur dibandingkan cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan pengujian inti plus lint/guard inti;
- perubahan hanya pengujian inti hanya menjalankan typecheck pengujian inti plus lint inti;
- perubahan produksi ekstensi menjalankan typecheck prod ekstensi dan pengujian ekstensi plus lint ekstensi;
- perubahan hanya pengujian ekstensi menjalankan typecheck pengujian ekstensi plus lint ekstensi;
- perubahan SDK Plugin publik atau kontrak plugin meluas ke typecheck ekstensi karena ekstensi bergantung pada kontrak inti tersebut (sweep ekstensi Vitest tetap menjadi pekerjaan pengujian eksplisit);
- bump versi metadata rilis saja menjalankan pemeriksaan versi/konfigurasi/dependensi-root yang ditargetkan;
- perubahan root/konfigurasi yang tidak diketahui fail safe ke semua jalur pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan secara sengaja lebih murah daripada `check:changed`: edit pengujian langsung menjalankan dirinya sendiri, edit sumber mengutamakan pemetaan eksplisit, lalu pengujian saudara dan dependen grafik impor. Konfigurasi pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada konfigurasi balasan terlihat grup, mode pengiriman balasan sumber, atau prompt sistem alat pesan dirutekan melalui pengujian balasan inti plus regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas di seluruh harness sehingga set murah yang dipetakan bukan proksi yang dapat dipercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan utamakan box baru yang sudah dihangatkan untuk bukti luas. Sebelum menghabiskan gerbang lambat pada box yang digunakan ulang, kedaluwarsa, atau baru melaporkan sinkronisasi yang sangat besar, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat ketika file root yang diperlukan seperti `pnpm-lock.yaml` hilang atau ketika `git status --short` menampilkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sinkronisasi jarak jauh bukan salinan PR yang dapat dipercaya; hentikan box tersebut dan hangatkan yang baru, alih-alih men-debug kegagalan pengujian produk. Untuk PR penghapusan besar yang disengaja, setel `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk run sanity tersebut.

`pnpm testbox:run` juga menghentikan invokasi CLI Blacksmith lokal yang tetap berada dalam fase sinkronisasi selama lebih dari lima menit tanpa output pasca-sinkronisasi. Setel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard tersebut, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang luar biasa besar.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Kanal pengembangan](/id/install/development-channels)
