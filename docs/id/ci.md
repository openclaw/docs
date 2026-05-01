---
read_when:
    - Anda perlu memahami mengapa sebuah job CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan proses validasi rilis atau menjalankannya ulang
summary: Graf job CI, gate cakupan, payung rilis, dan padanan perintah lokal
title: Alur kerja CI
x-i18n:
    generated_at: "2026-05-01T09:22:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 679913539743f9495fffa010489ec95e05ce875751afa8a93bf8bf7045d6d9de
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Job `preflight` mengklasifikasikan diff dan menonaktifkan lane mahal ketika hanya area yang tidak terkait yang berubah. Run `workflow_dispatch` manual sengaja melewati cakupan cerdas dan menyebarkan seluruh graf untuk kandidat rilis dan validasi luas. Lane Android tetap opsional melalui `include_android`. Cakupan Plugin khusus rilis berada di workflow terpisah [`Plugin Prarilis`](#plugin-prerelease) dan hanya berjalan dari [`Validasi Rilis Penuh`](#full-release-validation) atau dispatch manual eksplisit.

## Ikhtisar pipeline

| Job                              | Tujuan                                                                                       | Kapan berjalan                     |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, cakupan yang berubah, ekstensi yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draft |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                      | Selalu pada push dan PR non-draft |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisories npm                             | Selalu pada push dan PR non-draft |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                       | Selalu pada push dan PR non-draft |
| `check-dependencies`             | Pass khusus dependensi Knip produksi plus guard allowlist file yang tidak digunakan          | Perubahan yang relevan dengan Node |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan artefak build, dan artefak hilir yang dapat digunakan ulang | Perubahan yang relevan dengan Node |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/kontrak-plugin/protokol               | Perubahan yang relevan dengan Node |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel tershard dengan hasil pemeriksaan agregat yang stabil            | Perubahan yang relevan dengan Node |
| `checks-node-core-test`          | Shard pengujian Node inti, mengecualikan lane channel, bundled, kontrak, dan ekstensi        | Perubahan yang relevan dengan Node |
| `check`                          | Setara gate lokal utama tershard: tipe prod, lint, guard, tipe pengujian, dan smoke ketat    | Perubahan yang relevan dengan Node |
| `check-additional`               | Shard arsitektur, boundary, guard permukaan ekstensi, package-boundary, dan gateway-watch    | Perubahan yang relevan dengan Node |
| `build-smoke`                    | Pengujian smoke CLI hasil build dan smoke memori startup                                     | Perubahan yang relevan dengan Node |
| `checks`                         | Verifier untuk pengujian channel artefak build                                               | Perubahan yang relevan dengan Node |
| `checks-node-compat-node22`      | Lane build dan smoke kompatibilitas Node 22                                                  | Dispatch CI manual untuk rilis     |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan tautan rusak                                         | Docs berubah                       |
| `skills-python`                  | Ruff + pytest untuk skills berbasis Python                                                   | Perubahan yang relevan dengan skill Python |
| `checks-windows`                 | Pengujian proses/path khusus Windows plus regresi specifier import runtime bersama           | Perubahan yang relevan dengan Windows |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artefak build bersama                            | Perubahan yang relevan dengan macOS |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk aplikasi macOS                                        | Perubahan yang relevan dengan macOS |
| `android`                        | Pengujian unit Android untuk kedua flavor plus satu build APK debug                          | Perubahan yang relevan dengan Android |
| `test-performance-agent`         | Optimisasi harian pengujian lambat Codex setelah aktivitas tepercaya                         | Keberhasilan CI main atau dispatch manual |

## Urutan fail-fast

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal dengan cepat tanpa menunggu job matriks artefak dan platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat sehingga konsumen hilir dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR yang sama atau ref `main`. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak mengantre setelah seluruh workflow sudah tergantikan. Kunci concurrency CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

## Cakupan dan routing

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area tercakup berubah.

- **Edit workflow CI** memvalidasi graf CI Node plus linting workflow, tetapi tidak memaksa build native Windows, Android, atau macOS dengan sendirinya; lane platform tersebut tetap tercakup pada perubahan source platform.
- **Edit khusus routing CI, edit fixture pengujian inti murah terpilih, dan edit helper/routing pengujian kontrak plugin yang sempit** menggunakan jalur manifes cepat khusus Node: `preflight`, keamanan, dan satu tugas `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard inti penuh, shard bundled-plugin, dan matriks guard tambahan ketika perubahan terbatas pada permukaan routing atau helper yang langsung diuji oleh tugas cepat tersebut.
- **Pemeriksaan Node Windows** dicakup pada wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, config package manager, dan permukaan workflow CI yang menjalankan lane tersebut; perubahan source, plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada di lane Node Linux.

Keluarga pengujian Node paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil tanpa memesan runner secara berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, lane unit inti kecil dipasangkan, auto-reply berjalan sebagai empat worker seimbang (dengan subtree reply dipecah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan config gateway/plugin agentic disebar ke job Node agentic khusus source yang sudah ada alih-alih menunggu artefak build. Pengujian browser luas, QA, media, dan plugin lain-lain menggunakan config Vitest khususnya alih-alih catch-all plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan config utuh dari shard terfilter. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard guard boundary menjalankan guard independen kecilnya secara bersamaan di dalam satu job. Gateway watch, pengujian channel, dan shard support-boundary inti berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifes terpisah; lane pengujian unitnya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependensi Knip produksi yang dipin ke versi Knip terbaru, dengan usia rilis minimum pnpm dinonaktifkan untuk install `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan file produksi yang tidak digunakan dari Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard file yang tidak digunakan gagal ketika PR menambahkan file tidak digunakan baru yang belum ditinjau atau menyisakan entri allowlist kedaluwarsa, sambil mempertahankan permukaan plugin dinamis, generated, build, live-test, dan package bridge yang disengaja yang tidak dapat diselesaikan Knip secara statis.

## Dispatch manual

Dispatch CI manual menjalankan graf job yang sama seperti CI normal tetapi memaksa setiap lane tercakup non-Android aktif: shard Node Linux, shard bundled-plugin, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, build smoke, pemeriksaan docs, Python skills, Windows, macOS, dan i18n Control UI. Dispatch CI manual mandiri menjalankan Android hanya dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prarilis plugin, shard khusus rilis `agentic-plugins`, sweep batch ekstensi penuh, dan lane Docker prarilis plugin dikecualikan dari CI. Suite Docker prarilis hanya berjalan ketika `Full Release Validation` men-dispatch workflow `Plugin Prerelease` terpisah dengan gate release-validation diaktifkan.

Run manual menggunakan grup concurrency unik sehingga full suite kandidat rilis tidak dibatalkan oleh push atau run PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan graf tersebut terhadap branch, tag, atau SHA commit penuh sambil menggunakan file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, pekerjaan keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protokol/kontrak/bundel cepat, pemeriksaan kontrak channel bershard, shard `check` kecuali lint, shard dan agregat `check-additional`, pemverifikasi agregat pengujian Node, pemeriksaan docs, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard Plugin berbobot lebih rendah, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, dan `check-test-types`                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Node Linux, shard pengujian Plugin bundel, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (cukup sensitif terhadap CPU sehingga 8 vCPU lebih mahal daripada penghematan yang diberikannya); build Docker install-smoke (biaya waktu antre 32-vCPU lebih besar daripada penghematan yang diberikannya)                                                                                                                                                                                                                                                |
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
```

## Validasi Rilis Lengkap

`Full Release Validation` adalah workflow payung manual untuk "menjalankan semuanya sebelum rilis." Workflow ini menerima branch, tag, atau SHA commit lengkap, men-dispatch workflow `CI` manual dengan target tersebut, men-dispatch `Plugin Prerelease` untuk bukti Plugin/paket/statis/Docker khusus rilis, dan men-dispatch `OpenClaw Release Checks` untuk install smoke, package acceptance, suite jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram. Workflow ini juga dapat menjalankan workflow pascapublikasi `NPM Telegram Beta E2E` saat spesifikasi paket yang telah dipublikasikan diberikan.

Lihat [Validasi rilis lengkap](/id/reference/full-release-validation) untuk
matriks tahap, nama pekerjaan workflow persis, perbedaan profil, artefak, dan
handle rerun terfokus.

`release_profile` mengontrol cakupan live/provider yang diteruskan ke release checks. Workflow rilis manual default ke `stable`; gunakan `full` hanya saat Anda
sengaja menginginkan matriks provider/media advisory yang luas.

- `minimum` mempertahankan lane tercepat yang penting untuk rilis OpenAI/core.
- `stable` menambahkan set provider/backend stabil.
- `full` menjalankan matriks provider/media advisory yang luas.

Payung mencatat id run turunan yang di-dispatch, dan pekerjaan akhir `Verify full validation` memeriksa ulang kesimpulan run turunan saat ini dan menambahkan tabel pekerjaan paling lambat untuk setiap run turunan. Jika workflow turunan dijalankan ulang dan berubah hijau, jalankan ulang hanya pekerjaan pemverifikasi induk untuk menyegarkan hasil payung dan ringkasan waktu.

Untuk pemulihan, baik `Full Release Validation` maupun `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk turunan CI penuh normal, `plugin-prerelease` hanya untuk turunan prarilis Plugin, `release-checks` untuk setiap turunan rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref yang dipilih sekali menjadi tarball `release-package-under-test`, lalu meneruskan artefak itu ke workflow Docker jalur rilis live/E2E dan shard package acceptance. Ini menjaga byte paket konsisten di seluruh kotak rilis dan menghindari pengemasan ulang kandidat yang sama di beberapa pekerjaan turunan.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan payung yang lebih lama. Monitor induk membatalkan workflow turunan
apa pun yang sudah di-dispatch saat induk dibatalkan, sehingga validasi main yang lebih baru
tidak tertahan di belakang run release-check dua jam yang usang. Validasi branch/tag
rilis dan grup rerun terfokus mempertahankan `cancel-in-progress: false`.

## Shard Live dan E2E

Turunan live/E2E rilis mempertahankan cakupan luas `pnpm test:live` native, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs` alih-alih satu pekerjaan serial:

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
- shard audio/video media terpisah dan shard musik yang difilter provider

Ini mempertahankan cakupan file yang sama sekaligus membuat kegagalan provider live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh workflow `Live Media Runner Image`. Image tersebut memasang `ffmpeg` dan `ffprobe` sebelumnya; pekerjaan media hanya memverifikasi binari sebelum setup. Pertahankan suite live berbasis Docker di runner Blacksmith normal — pekerjaan container bukan tempat yang tepat untuk meluncurkan pengujian Docker bertingkat.

Shard model/backend live berbasis Docker menggunakan image bersama terpisah `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit yang dipilih. Workflow rilis live membangun dan mendorong image itu sekali, lalu shard model live Docker, Gateway bershard provider, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Docker Gateway membawa batas `timeout` eksplisit tingkat skrip di bawah timeout pekerjaan workflow sehingga container yang macet atau jalur pembersihan gagal cepat alih-alih menghabiskan seluruh anggaran release-check. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah konfigurasi dan akan membuang waktu wall clock pada build image duplikat.

## Package Acceptance

Gunakan `Package Acceptance` saat pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan package acceptance memvalidasi satu tarball melalui harness Docker E2E yang sama yang digunakan pengguna setelah install atau update.

### Pekerjaan

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref workflow, ref paket, versi, SHA-256, dan profil dalam ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Workflow yang dapat digunakan ulang mengunduh artefak tersebut, memvalidasi inventaris tarball, menyiapkan image Docker package-digest saat diperlukan, dan menjalankan lane Docker yang dipilih terhadap paket tersebut, bukan mengepak checkout workflow. Saat sebuah profil memilih beberapa `docker_lanes` tertarget, workflow yang dapat digunakan ulang menyiapkan paket dan image bersama satu kali, lalu menyebarkan lane tersebut sebagai job Docker tertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan saat `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama saat Package Acceptance menyelesaikan satu paket; dispatch Telegram mandiri masih dapat menginstal spesifikasi npm yang telah dipublikasikan.
4. `summary` menggagalkan workflow jika penyelesaian paket, Docker acceptance, atau lane Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk acceptance beta/stable yang dipublikasikan.
- `source=ref` mengepak cabang, tag, atau SHA commit penuh `package_ref` tepercaya. Resolver mengambil cabang/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat cabang repositori atau tag rilis, menginstal dependensi dalam worktree terlepas, dan mengepaknya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS; `package_sha256` wajib.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode workflow/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dipaketkan saat `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika workflow lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` tepat; wajib saat `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub langsung. Lane Telegram opsional menggunakan ulang artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap tersedia untuk dispatch mandiri.

Pemeriksaan rilis memanggil Package Acceptance dengan `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'`, dan `telegram_mode=mock-openai`. Chunk Docker jalur rilis mencakup lane paket/pembaruan/Plugin yang tumpang tindih; Package Acceptance mempertahankan bukti kompatibilitas bundled-channel, Plugin offline, dan Telegram yang native terhadap artefak pada tarball paket yang sama yang telah diselesaikan. Pemeriksaan rilis lintas OS tetap mencakup onboarding, installer, dan perilaku platform spesifik OS; validasi produk paket/pembaruan sebaiknya dimulai dengan Package Acceptance. Lane Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run. Dalam Package Acceptance, tarball `package-under-test` yang diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline yang dipublikasikan sebagai fallback, dengan default `openclaw@latest`; perintah rerun lane yang gagal mempertahankan baseline tersebut. Setel `published_upgrade_survivor_baselines=release-history` untuk memperluas lane di seluruh matriks riwayat yang telah dideduplikasi: enam rilis stable terbaru, `2026.4.23`, dan rilis stable terbaru sebelum `2026-03-15`. Setel `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas baseline yang sama di seluruh fixture berbentuk issue untuk config/runtime-deps Feishu, file bootstrap/persona yang dipertahankan, jalur log tilde, dan root runtime-deps berversi yang usang. Run agregat lokal dapat meneruskan spesifikasi paket tepat dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu lane dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menyetel `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Lane yang dipublikasikan mengonfigurasi baseline dengan resep perintah `openclaw config set` yang telah dipanggang, mencatat langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway dimulai. Lane fresh Windows packaged dan installer juga memverifikasi bahwa paket yang diinstal dapat mengimpor override browser-control dari jalur Windows absolut mentah. Smoke agent-turn lintas OS OpenAI menggunakan default `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat disetel, jika tidak `openai/gpt-5.4-mini`, sehingga bukti instalasi dan Gateway tetap cepat dan deterministik.

### Jendela kompatibilitas lama

Package Acceptance memiliki jendela kompatibilitas lama yang dibatasi untuk paket yang sudah dipublikasikan. Paket sampai `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui di `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` saat paket tidak mengekspos flag tersebut;
- `update-channel-switch` dapat memangkas `pnpm.patchedDependencies` yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke Plugin dapat membaca lokasi install-record lama atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata config sambil tetap mewajibkan install record dan perilaku no-reinstall tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memperingatkan tentang file cap metadata build lokal yang sudah dikirim. Paket berikutnya harus memenuhi kontrak modern; kondisi yang sama gagal alih-alih memberi peringatan atau melewati.

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

Saat men-debug run package acceptance yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa run turunan `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, timing fase, dan perintah rerun. Lebih baik menjalankan ulang profil paket yang gagal atau lane Docker tepat daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Workflow `Install Smoke` terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya. Ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifest Plugin bawaan, atau permukaan Plugin SDK core plugin/channel/gateway yang diuji oleh job smoke Docker. Perubahan Plugin bawaan yang hanya sumber, edit yang hanya test, dan edit yang hanya docs tidak memesan worker Docker. Jalur cepat membangun image root Dockerfile satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e container gateway-network, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker bundled-plugin terbatas di bawah timeout perintah agregat 240 detik (setiap run Docker skenario dibatasi terpisah).
- **Jalur penuh** mempertahankan cakupan install paket QR dan Docker/update installer untuk run terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan install paket QR, smoke root Dockerfile/gateway, smoke installer/update, dan E2E Docker bundled-plugin cepat sebagai job terpisah sehingga pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk merge commit) tidak memaksa jalur penuh; saat logika cakupan perubahan akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instalasi penuh ke validasi malam atau rilis.

Smoke image-provider Bun global install yang lambat digating secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat ikut mengaktifkannya, tetapi pull request dan push `main` tidak. Test Docker QR dan installer mempertahankan Dockerfile yang berfokus pada instalasi milik masing-masing.

## E2E Docker Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengepak OpenClaw satu kali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git polos untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika planner berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi rencana yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parameter yang dapat disetel

| Variabel                               | Default | Tujuan                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap penyedia.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live bersamaan agar penyedia tidak melakukan throttle.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Batas lane install npm bersamaan.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-layanan bersamaan.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda bertahap antar-start lane untuk menghindari badai pembuatan daemon Docker; setel `0` untuk tanpa jeda bertahap.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per lane (120 menit); lane live/tail tertentu menggunakan batas yang lebih ketat.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | tidak disetel   | `1` mencetak rencana scheduler tanpa menjalankan lane.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | tidak disetel   | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agen dapat mereproduksi satu lane gagal. |

Lane yang lebih berat daripada batas efektifnya masih dapat dimulai dari pool kosong, lalu berjalan sendiri hingga melepaskan kapasitas. Agregat lokal melakukan preflight Docker, menghapus container OpenClaw E2E yang basi, mengeluarkan status lane aktif, mempertahankan timing lane untuk pengurutan terlama dahulu, dan secara default berhenti menjadwalkan lane pooled baru setelah kegagalan pertama.

### Alur kerja live/E2E yang dapat digunakan kembali

Alur kerja live/E2E yang dapat digunakan kembali menanyakan `scripts/test-docker-all.mjs --plan-json` paket, jenis image, image live, lane, dan cakupan kredensial mana yang diperlukan. `scripts/docker-e2e.mjs` lalu mengubah rencana itu menjadi output dan ringkasan GitHub. Alur kerja ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket run saat ini, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image GHCR Docker E2E bare/functional yang diberi tag digest paket melalui cache lapisan Docker Blacksmith saat rencana membutuhkan lane yang memasang paket; dan menggunakan kembali input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout 180 detik per percobaan yang terbatas, sehingga aliran registry/cache yang macet dicoba ulang dengan cepat alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk jalur rilis

Cakupan Docker rilis menjalankan job ber-chunk yang lebih kecil dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, sehingga setiap chunk hanya menarik jenis image yang dibutuhkannya dan menjalankan beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hingga `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b`, dan `bundled-channels-contracts`. Chunk agregat `bundled-channels` tetap tersedia untuk rerun satu kali manual, dan `plugins-runtime-core`, `plugins-runtime`, serta `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer penyedia. Chunk `bundled-channels` menjalankan lane `bundled-channel-*` dan `bundled-channel-update-*` yang dipisah, bukan lane serial all-in-one `bundled-channel-deps`.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` saat cakupan release-path penuh memintanya, dan hanya mempertahankan chunk mandiri `openwebui` untuk dispatch khusus OpenWebUI. Lane pembaruan bundled-channel mencoba ulang sekali untuk kegagalan jaringan npm yang sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON rencana scheduler, tabel lane lambat, dan perintah rerun per lane. Input workflow `docker_lanes` menjalankan lane yang dipilih terhadap image yang disiapkan, bukan job chunk, sehingga debugging lane gagal tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan kembali artefak paket untuk run tersebut; jika lane yang dipilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun tersebut. Perintah rerun GitHub per lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan saat nilai tersebut ada, sehingga lane gagal dapat menggunakan kembali paket dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # unduh artefak Docker dan cetak perintah rerun tertarget gabungan/per-lane
pnpm test:docker:timings <summary>   # ringkasan lane lambat dan jalur kritis fase
```

Alur kerja live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, sehingga menjadi workflow terpisah yang di-dispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri tetap menonaktifkan suite tersebut. Alur kerja ini menyeimbangkan pengujian plugin bundled di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar, agar batch plugin yang berat impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis mengelompokkan lane Docker tertarget dalam grup kecil untuk menghindari reservasi puluhan runner untuk job berdurasi satu hingga tiga menit.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow smart-scoped utama.

- Workflow `Parity gate` berjalan pada perubahan PR yang cocok dan dispatch manual; workflow ini membangun runtime QA privat dan membandingkan paket agentik mock GPT-5.5 dan Opus 4.6.
- Workflow `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan pada dispatch manual; workflow ini menyebarkan gate paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport live Matrix dan Telegram dengan penyedia mock deterministik dan model berkualifikasi mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) agar kontrak channel terisolasi dari latensi model live dan startup plugin penyedia normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas penyedia dicakup oleh suite model live, penyedia native, dan penyedia Docker yang terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, dengan menambahkan `--fail-fast` hanya saat CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu membagi cakupan Matrix penuh ke dalam job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke dalam job laporan kecil untuk perbandingan paritas final.

Jangan menempatkan jalur landing PR di belakang `Parity gate` kecuali perubahan tersebut benar-benar menyentuh runtime QA, paritas paket model, atau permukaan yang dimiliki workflow paritas. Untuk perbaikan channel, konfigurasi, docs, atau unit-test normal, perlakukan itu sebagai sinyal opsional dan ikuti bukti CI/check yang terscoped.

## CodeQL

Workflow `CodeQL` sengaja menjadi pemindai keamanan tahap awal yang sempit, bukan sweep repositori penuh. Guard harian, manual, dan pull request non-draft memindai kode workflow Actions plus permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan berkeyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Guard pull request tetap ringan: hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan berkeyakinan tinggi yang sama seperti workflow terjadwal. CodeQL Android dan macOS tetap berada di luar default PR.

### Kategori keamanan

| Kategori                                          | Permukaan                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret, sandbox, cron, dan baseline gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti plus runtime plugin channel, gateway, Plugin SDK, secret, titik sentuh audit                 |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF inti, parsing IP, guard jaringan, web-fetch, dan permukaan kebijakan SSRF Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, delivery keluar, dan gate eksekusi tool agen                                              |
| `/codeql-security-high/plugin-trust-boundary`     | Install plugin, loader, manifest, registry, staging dependensi runtime, pemuatan source, dan permukaan kepercayaan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL pada Blacksmith macOS, memfilter hasil build dependensi keluar dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Dipertahankan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Shard ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan severity error di atas permukaan sempit bernilai tinggi pada runner Blacksmith Linux yang lebih kecil. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draft hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk perubahan kode eksekusi command/model/tool agen dan dispatch balasan, kode skema/migrasi/IO konfigurasi, kode auth/secret/sandbox/keamanan, runtime channel inti dan plugin channel bundled, protocol Gateway/metode server, runtime memori/perekat SDK, MCP/proses/delivery keluar, runtime penyedia/katalog model, diagnostik sesi/queue delivery, loader plugin, kontrak Plugin SDK/paket, atau runtime balasan Plugin SDK. Perubahan konfigurasi CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terisolasi.

| Kategori                                                | Permukaan                                                                                                                                                                    |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan auth, rahasia, sandbox, cron, dan Gateway                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema config, migrasi, normalisasi, dan IO                                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                                            |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan Plugin channel bawaan                                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi perintah, dispatch model/provider, dispatch dan antrean balasan otomatis, serta control-plane ACP                                                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge tool, helper supervisi proses, serta kontrak pengiriman keluar                                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, facade runtime memori, alias SDK Plugin memori, glue aktivasi runtime memori, dan perintah doctor memori                                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundle event/log diagnostik, dan kontrak CLI doctor sesi               |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk SDK Plugin, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread                        |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, auth dan discovery provider, registrasi runtime provider, default/katalog provider, serta registry web/search/fetch/embedding                    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol Gateway, dan kontrak runtime control-plane tugas                                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, pembuatan gambar, dan pembuatan media                                                                     |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint SDK Plugin                                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber SDK Plugin sisi paket yang dipublikasikan dan helper kontrak paket Plugin                                                                                            |

Kualitas tetap dipisahkan dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL untuk Swift, Python, dan Plugin bawaan sebaiknya ditambahkan kembali sebagai pekerjaan lanjutan yang terskop atau di-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Alur kerja pemeliharaan

### Agen Dokumentasi

Workflow `Docs Agent` adalah jalur pemeliharaan Codex berbasis peristiwa untuk menjaga dokumentasi yang ada tetap selaras dengan perubahan yang baru mendarat. Workflow ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, dan dispatch manual dapat menjalankannya secara langsung. Invokasi workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-dilewati lain dibuat dalam satu jam terakhir. Saat berjalan, workflow ini meninjau rentang commit dari SHA sumber Docs Agent non-dilewati sebelumnya sampai `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terkumpul sejak pemeriksaan dokumentasi terakhir.

### Agen Performa Tes

Workflow `Test Performance Agent` adalah jalur pemeliharaan Codex berbasis peristiwa untuk tes yang lambat. Workflow ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil di `main` dapat memicunya, tetapi workflow ini dilewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gerbang aktivitas harian itu. Jalur ini membuat laporan performa Vitest suite penuh yang dikelompokkan, membiarkan Codex hanya membuat perbaikan performa tes kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan suite penuh dan menolak perubahan yang mengurangi jumlah baseline tes yang lolos. Jika baseline memiliki tes yang gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan suite penuh setelah agen harus lolos sebelum apa pun di-commit. Ketika `main` maju sebelum push bot mendarat, jalur ini melakukan rebase patch yang telah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba push kembali; patch basi yang berkonflik dilewati. Workflow ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti agen dokumentasi.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat setelah mendarat. Default-nya dry-run dan hanya menutup PR yang dicantumkan secara eksplisit ketika `apply=true`. Sebelum memutasi GitHub, workflow ini memverifikasi bahwa PR yang mendarat sudah di-merge dan bahwa setiap duplikat memiliki issue rujukan bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gerbang pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gerbang pemeriksaan lokal itu lebih ketat tentang batas arsitektur dibandingkan cakupan platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan tes inti plus lint/guard inti;
- perubahan khusus tes inti hanya menjalankan typecheck tes inti plus lint inti;
- perubahan produksi ekstensi menjalankan typecheck prod ekstensi dan tes ekstensi plus lint ekstensi;
- perubahan khusus tes ekstensi menjalankan typecheck tes ekstensi plus lint ekstensi;
- perubahan SDK Plugin publik atau kontrak Plugin diperluas ke typecheck ekstensi karena ekstensi bergantung pada kontrak inti tersebut (sweep ekstensi Vitest tetap menjadi pekerjaan tes eksplisit);
- bump versi khusus metadata rilis menjalankan pemeriksaan versi/config/dependensi-root yang ditargetkan;
- perubahan root/config yang tidak diketahui gagal aman ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit tes langsung menjalankan dirinya sendiri, edit sumber memprioritaskan pemetaan eksplisit, lalu tes saudara dan dependensi import-graph. Config pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada config visible-reply grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui tes balasan inti plus regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup mencakup seluruh harness sehingga set murah yang dipetakan bukan proxy yang dapat dipercaya.

## Validasi Testbox

Jalankan Testbox dari root repo dan utamakan box baru yang telah di-warm untuk bukti luas. Sebelum menghabiskan gerbang lambat pada box yang digunakan ulang, kedaluwarsa, atau baru saja melaporkan sync yang jauh lebih besar dari perkiraan, jalankan `pnpm testbox:sanity` di dalam box terlebih dahulu.

Pemeriksaan sanity gagal cepat ketika file root wajib seperti `pnpm-lock.yaml` hilang atau ketika `git status --short` menampilkan setidaknya 200 penghapusan terlacak. Itu biasanya berarti status sync remote bukan salinan PR yang dapat dipercaya; hentikan box itu dan warm box baru alih-alih men-debug kegagalan tes produk. Untuk PR penghapusan besar yang disengaja, set `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk run sanity tersebut.

`pnpm testbox:run` juga menghentikan invokasi CLI Blacksmith lokal yang tetap berada di fase sync selama lebih dari lima menit tanpa output pasca-sync. Set `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` untuk menonaktifkan guard itu, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang luar biasa besar.

Crabbox adalah jalur remote-box kedua milik repo untuk bukti Linux ketika Blacksmith tidak tersedia atau ketika kapasitas cloud milik sendiri lebih disukai. Warm sebuah box, hydrate melalui workflow proyek, lalu jalankan perintah melalui CLI Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` mengatur default provider, sync, dan hidrasi GitHub Actions. File ini mengecualikan `.git` lokal sehingga checkout Actions yang di-hydrate mempertahankan metadata Git remote-nya sendiri alih-alih menyinkronkan remote dan object store lokal maintainer, dan mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` mengatur checkout, setup Node/pnpm, fetch `origin/main`, dan handoff environment non-rahasia yang kemudian di-source oleh perintah `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Channel pengembangan](/id/install/development-channels)
