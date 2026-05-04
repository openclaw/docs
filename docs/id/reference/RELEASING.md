---
read_when:
    - Mencari definisi saluran rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan irama rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan kadensi
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-04T07:07:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` saat diminta secara eksplisit
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: ujung bergerak dari `main`

## Penamaan versi

- Versi rilis stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prarilis beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan tambahkan nol di depan bulan atau hari
- `latest` berarti rilis npm stable yang saat ini dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stable dan koreksi stable dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang sudah diverifikasi nanti
- Setiap rilis stable OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/sign/notarize aplikasi Mac disisihkan untuk stable kecuali diminta secara eksplisit

## Irama rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stable menyusul hanya setelah beta terbaru divalidasi
- Pemelihara biasanya membuat rilis dari cabang `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta telah di-push atau dipublikasikan dan memerlukan perbaikan, pemelihara membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan bersifat
  khusus pemelihara

## Daftar periksa operator rilis

Daftar periksa ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus pemelihara.

1. Mulai dari `main` saat ini: tarik yang terbaru, konfirmasi commit target telah di-push,
   dan konfirmasi CI `main` saat ini cukup hijau untuk membuat cabang darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, jaga entri tetap berorientasi pengguna, commit, push, dan rebase/pull
   sekali lagi sebelum membuat cabang.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas yang kedaluwarsa
   hanya ketika jalur peningkatan tetap tercakup, atau catat mengapa kompatibilitas itu
   sengaja dipertahankan.
4. Buat `release/YYYY.M.D` dari `main` saat ini; jangan lakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dimaksud, jalankan
   `pnpm plugins:sync` agar paket Plugin yang dapat dipublikasikan berbagi versi rilis
   dan metadata kompatibilitas, lalu jalankan preflight deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, dan
   `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA cabang rilis penuh 40 karakter diperbolehkan untuk preflight khusus validasi.
   Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk cabang rilis,
   tag, atau SHA commit penuh. Ini adalah satu-satunya entrypoint manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di cabang rilis dan jalankan ulang file, jalur,
   job workflow, profil paket, penyedia, atau daftar izin model terkecil yang gagal
   dan membuktikan perbaikan. Jalankan ulang payung penuh hanya ketika permukaan yang berubah membuat
   bukti sebelumnya kedaluwarsa.
9. Untuk beta, tag `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   cabang `release/YYYY.M.D` yang sesuai. Ini memverifikasi `pnpm plugins:sync:check`,
   memublikasikan semua paket Plugin yang dapat dipublikasikan ke npm terlebih dahulu, memublikasikan set yang sama
   ke ClawHub kedua sebagai tarball ClawPack npm-pack, lalu mempromosikan
   artefak preflight npm OpenClaw yang disiapkan dengan dist-tag yang sesuai. Setelah
   publikasi, jalankan penerimaan paket pascapublikasi
   terhadap paket `openclaw@YYYY.M.D-beta.N` atau
   `openclaw@beta` yang dipublikasikan. Jika prarilis yang telah di-push atau dipublikasikan memerlukan perbaikan,
   buat nomor prarilis berikutnya yang sesuai; jangan hapus atau tulis ulang prarilis lama.
10. Untuk stable, lanjutkan hanya setelah beta atau kandidat rilis yang telah diverifikasi memiliki
    bukti validasi yang diperlukan. Publikasi npm stable juga melalui
    `OpenClaw Release Publish`, menggunakan kembali artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stable juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang telah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
11. Setelah publikasi, jalankan pemverifikasi pascapublikasi npm, E2E Telegram npm terpublikasi
    mandiri opsional saat Anda memerlukan bukti kanal pascapublikasi,
    promosi dist-tag saat diperlukan, catatan rilis/prarilis GitHub dari
    bagian `CHANGELOG.md` lengkap yang sesuai, dan langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum preflight rilis agar TypeScript pengujian tetap
  tercakup di luar gate lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum preflight rilis agar pemeriksaan siklus
  impor yang lebih luas dan batas arsitektur berstatus hijau di luar gate lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak
  rilis `dist/*` yang diharapkan dan bundel Control UI tersedia untuk langkah
  validasi paket
- Jalankan `pnpm plugins:sync` setelah bump versi root dan sebelum tagging. Ini
  memperbarui versi paket Plugin yang dapat dipublikasikan, metadata kompatibilitas
  peer/API OpenClaw, metadata build, dan stub changelog Plugin agar sesuai dengan versi
  rilis inti. `pnpm plugins:sync:check` adalah guard rilis non-mutasi;
  workflow publikasi gagal sebelum mutasi registry apa pun jika langkah ini
  terlupakan.
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua kotak pengujian prarilis dari satu entrypoint. Workflow ini menerima branch,
  tag, atau SHA commit penuh, menjalankan manual `CI`, dan menjalankan
  `OpenClaw Release Checks` untuk smoke instalasi, package acceptance, suite jalur rilis
  Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram. Dengan
  `release_profile=full` dan `rerun_group=all`, workflow ini juga menjalankan package
  Telegram E2E terhadap artefak `release-package-under-test` dari release
  checks. Berikan `npm_telegram_package_spec` setelah publikasi ketika Telegram E2E
  yang sama juga harus membuktikan paket npm yang dipublikasikan. Berikan
  `package_acceptance_package_spec` setelah publikasi ketika Package Acceptance
  harus menjalankan matriks paket/update terhadap paket npm yang dikirim, bukan
  artefak yang dibangun dari SHA. Berikan
  `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa
  validasi cocok dengan paket npm yang dipublikasikan tanpa memaksa Telegram E2E.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti
  side-channel untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@beta`, `openclaw@latest`, atau versi rilis persis; `source=ref`
  untuk mengemas branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan
  SHA-256 wajib; atau `source=artifact` untuk tarball yang diunggah oleh run
  GitHub Actions lain. Workflow ini menyelesaikan kandidat menjadi
  `package-under-test`, menggunakan ulang penjadwal rilis Docker E2E terhadap
  tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika lane
  Docker yang dipilih mencakup `published-upgrade-survivor`, artefak paket adalah
  kandidat dan `published_upgrade_survivor_baseline` memilih baseline yang dipublikasikan.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane instal/channel/agent, jaringan Gateway, dan reload konfigurasi
  - `package`: lane paket/update/Plugin berbasis artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket ditambah channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: chunk jalur rilis Docker dengan OpenWebUI
  - `custom`: pemilihan `docker_lanes` persis untuk rerun terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya membutuhkan cakupan
  CI normal penuh untuk kandidat rilis. Dispatch CI manual melewati scope changed
  dan memaksa shard Linux Node, shard Plugin bawaan, kontrak channel,
  kompatibilitas Node 22, `check`, `check-additional`, smoke build,
  pemeriksaan docs, Python skills, Windows, macOS, Android, dan lane i18n Control UI.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` saat memvalidasi telemetri rilis. Ini menjalankan
  QA-lab melalui receiver OTLP/HTTP lokal dan memverifikasi nama span trace yang diekspor,
  atribut berbatas, serta redaksi konten/pengidentifikasi tanpa memerlukan
  Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk urutan publikasi yang melakukan mutasi setelah
  tag tersedia. Dispatch dari `release/YYYY.M.D` (atau `main` saat memublikasikan tag
  yang dapat dijangkau main), berikan tag rilis dan `preflight_run_id` npm OpenClaw
  yang berhasil, dan pertahankan scope publikasi Plugin default
  `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Workflow ini
  menserialkan publikasi npm Plugin, publikasi ClawHub Plugin, dan publikasi npm OpenClaw
  agar paket inti tidak dipublikasikan sebelum Plugin eksternalnya.
- Pemeriksaan rilis sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan lane paritas mock QA Lab ditambah profil
  Matrix live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live
  menggunakan environment `qa-live-shared`; Telegram juga menggunakan lease kredensial
  Convex CI. Jalankan workflow manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris
  transport, media, dan E2EE Matrix penuh secara paralel.
- Validasi runtime instalasi dan upgrade lintas-OS adalah bagian dari
  `OpenClaw Release Checks` publik dan `Full Release Validation`, yang memanggil
  workflow reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: pertahankan jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada
  di lane sendiri agar tidak menahan atau memblokir publikasi
- Pemeriksaan rilis yang membawa secret harus di-dispatch melalui `Full Release
Validation` atau dari workflow ref `main`/rilis agar logika workflow dan
  secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit penuh selama
  commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Preflight hanya-validasi `OpenClaw NPM Release` juga menerima SHA commit branch-workflow
  penuh 40 karakter saat ini tanpa memerlukan tag yang sudah di-push
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; publikasi nyata tetap memerlukan tag rilis nyata
- Kedua workflow menjaga jalur publikasi dan promosi nyata pada runner yang di-host GitHub,
  sementara jalur validasi non-mutasi dapat menggunakan runner Linux Blacksmith yang lebih besar
- Workflow tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Preflight rilis npm tidak lagi menunggu lane release checks terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah publikasi npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi registry
  yang dipublikasikan dalam prefix temp baru
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan Telegram E2E nyata
  terhadap paket npm yang dipublikasikan menggunakan pool kredensial Telegram ber-lease bersama.
  One-off maintainer lokal dapat menghilangkan var Convex dan memberikan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pascapublikasi penuh dari mesin maintainer, gunakan `pnpm release:beta-smoke -- --beta betaN`. Helper menjalankan validasi update npm Parallels/target baru, menjalankan `NPM Telegram Beta E2E`, melakukan polling run workflow persis, mengunduh artefak, dan mencetak laporan Telegram.
- Maintainer dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui
  workflow manual `NPM Telegram Beta E2E`. Workflow ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan preflight-lalu-promote:
  - publikasi npm nyata harus melewati `preflight_run_id` npm yang berhasil
  - publikasi npm nyata harus di-dispatch dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run preflight yang berhasil
  - rilis npm stabil default ke `beta`
  - publikasi npm stabil dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    untuk keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara repo
    publik mempertahankan publikasi hanya OIDC
  - `macOS Release` publik hanya-validasi; ketika tag hanya berada pada
    branch rilis tetapi workflow di-dispatch dari `main`, tetapkan
    `public_release_branch=release/YYYY.M.D`
  - publikasi mac privat nyata harus melewati `preflight_run_id` dan `validate_run_id`
    mac privat yang berhasil
  - jalur publikasi nyata mempromosikan artefak yang telah disiapkan alih-alih membangunnya
    lagi
- Untuk rilis koreksi stabil seperti `YYYY.M.D-N`, verifier pascapublikasi
  juga memeriksa jalur upgrade prefix-temp yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  agar koreksi rilis tidak diam-diam meninggalkan instalasi global lama pada payload
  stabil dasar
- Preflight rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pascapublikasi juga memeriksa bahwa entrypoint Plugin yang dipublikasikan dan
  metadata paket tersedia dalam layout registry terinstal. Rilis yang
  mengirim payload runtime Plugin yang hilang gagal pada verifier pascapublikasi dan
  tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball update kandidat, sehingga installer e2e menangkap pembengkakan pack yang tidak disengaja
  sebelum jalur publikasi rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing Plugin, atau
  matriks pengujian Plugin, buat ulang dan tinjau output matriks
  `plugin-prerelease-extension-shard` milik planner dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  menggambarkan layout CI yang sudah kedaluwarsa
- Kesiapan rilis macOS stabil juga mencakup surface updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang dipaketkan
  - `appcast.xml` pada `main` harus menunjuk ke zip stabil baru setelah publikasi
  - aplikasi yang dipaketkan harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas floor build Sparkle kanonis
    untuk versi rilis tersebut

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai semua pengujian prarilis dari
satu entrypoint. Untuk bukti commit yang di-pin pada branch yang bergerak cepat, gunakan
helper agar setiap workflow turunan berjalan dari branch sementara yang dikunci pada
SHA target:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper ini mendorong `release-ci/<sha>-...`, menjalankan `Full Release Validation`
dari branch tersebut dengan `ref=<sha>`, memverifikasi setiap `headSha` workflow turunan
cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian run
turunan `main` yang lebih baru secara tidak sengaja.

Untuk validasi branch rilis atau tag, jalankan dari workflow ref `main` tepercaya
dan berikan branch rilis atau tag sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Alur kerja menyelesaikan ref target, memicu `CI` manual dengan
`target_ref=<release-ref>`, memicu `OpenClaw Release Checks`, menyiapkan artefak
induk `release-package-under-test` untuk pemeriksaan yang berhadapan dengan paket,
dan memicu E2E Telegram paket mandiri ketika `release_profile=full` dengan
`rerun_group=all` atau ketika `npm_telegram_package_spec` disetel. `OpenClaw Release
Checks` kemudian menyebar ke install smoke, pemeriksaan rilis lintas-OS, cakupan
jalur rilis Docker live/E2E, Package Acceptance dengan QA paket Telegram, paritas
QA Lab, Matrix live, dan Telegram live. Run penuh hanya dapat diterima ketika
ringkasan `Full Release Validation`
menampilkan `normal_ci` dan `release_checks` berhasil. Dalam mode full/all,
child `npm_telegram` juga harus berhasil; di luar full/all, itu dilewati kecuali
`npm_telegram_package_spec` yang telah diterbitkan diberikan. Ringkasan verifier
akhir menyertakan tabel pekerjaan paling lambat untuk setiap child run, sehingga
manajer rilis dapat melihat critical path saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk matriks
tahap lengkap, nama job workflow yang tepat, perbedaan profil stable versus full,
artefak, dan handle rerun terfokus.
Child workflow dipicu dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan ketika target `ref` menunjuk ke branch
atau tag rilis yang lebih lama. Tidak ada input workflow-ref Full Release Validation
terpisah; pilih harness tepercaya dengan memilih ref run workflow.
Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit persis pada `main`
yang bergerak; SHA commit mentah tidak dapat menjadi ref dispatch workflow, jadi
gunakan `pnpm ci:full-release --sha <sha>` untuk membuat branch sementara yang
dipin.

Gunakan `release_profile` untuk memilih cakupan live/provider:

- `minimum`: jalur live dan Docker OpenAI/core yang tercepat dan kritis untuk rilis
- `stable`: minimum ditambah cakupan provider/backend stable untuk persetujuan rilis
- `full`: stable ditambah cakupan provider/media advisory yang luas

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan
ref target sekali sebagai `release-package-under-test` dan menggunakan ulang
artefak itu dalam pemeriksaan Docker jalur rilis maupun Package Acceptance. Ini
menjaga semua box yang berhadapan dengan paket pada byte yang sama dan menghindari
build paket berulang. Install smoke OpenAI lintas-OS menggunakan
`OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika variabel repo/org disetel, jika tidak
`openai/gpt-5.4`, karena lane ini membuktikan instalasi paket, onboarding,
startup gateway, dan satu giliran agen live, bukan melakukan benchmark pada model
default yang paling lambat. Matriks provider live yang lebih luas tetap menjadi
tempat untuk cakupan spesifik model.

Gunakan varian ini tergantung tahap rilis:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Jangan gunakan payung penuh sebagai rerun pertama setelah perbaikan terfokus. Jika
satu box gagal, gunakan child workflow, job, lane Docker, profil paket, provider
model, atau lane QA yang gagal untuk bukti berikutnya. Jalankan payung penuh lagi
hanya ketika perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua
box sebelumnya menjadi usang. Verifier akhir payung memeriksa ulang id run child
workflow yang direkam, jadi setelah child workflow berhasil direrun, rerun hanya
job induk `Verify full validation` yang gagal.

Untuk pemulihan terbatas, berikan `rerun_group` ke payung. `all` adalah run
release-candidate sebenarnya, `ci` hanya menjalankan child CI normal,
`plugin-prerelease` hanya menjalankan child Plugin khusus rilis, `release-checks`
menjalankan setiap box rilis, dan grup rilis yang lebih sempit adalah
`install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`,
dan `npm-telegram`. Rerun `npm-telegram` terfokus memerlukan
`npm_telegram_package_spec`; run full/all dengan `release_profile=full` menggunakan
artefak paket release-checks.

### Vitest

Box Vitest adalah child workflow `CI` manual. CI manual sengaja melewati scoping
perubahan dan memaksa graph tes normal untuk kandidat rilis: shard Node Linux,
shard Plugin bundled, kontrak channel, kompatibilitas Node 22, `check`,
`check-additional`, build smoke, pemeriksaan docs, Skills Python, Windows, macOS,
Android, dan i18n Control UI.

Gunakan box ini untuk menjawab "apakah source tree lulus suite tes normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dipicu
- run `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artefak timing Vitest seperti `.artifacts/vitest-shard-timings.json` ketika
  suatu run memerlukan analisis performa

Jalankan CI manual secara langsung hanya ketika rilis memerlukan CI normal yang
deterministik tetapi tidak memerlukan box Docker, QA Lab, live, lintas-OS, atau
paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, ditambah workflow `install-smoke`
mode rilis. Ini memvalidasi kandidat rilis melalui lingkungan Docker berpacak
paket, bukan hanya tes tingkat source.

Cakupan Docker rilis mencakup:

- install smoke penuh dengan install smoke global Bun yang lambat diaktifkan
- persiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target,
  dengan job smoke QR, root/gateway, dan installer/Bun berjalan sebagai shard
  install-smoke terpisah
- lane E2E repositori
- chunk Docker jalur rilis: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, dan `plugins-runtime-install-h`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` ketika diminta
- lane install/uninstall Plugin bundled yang dibagi
  `bundled-plugin-install-uninstall-0` sampai
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker ketika release checks
  menyertakan suite live

Gunakan artefak Docker sebelum melakukan rerun. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
timing fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada workflow live/E2E reusable alih-alih
mererun semua chunk rilis. Perintah rerun yang dihasilkan menyertakan
`package_artifact_run_id` sebelumnya dan input image Docker yang disiapkan ketika
tersedia, sehingga lane yang gagal dapat menggunakan ulang tarball dan image GHCR
yang sama.

### QA Lab

Box QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Ini adalah gate
rilis perilaku agentic dan tingkat channel, terpisah dari mekanika paket Vitest
dan Docker.

Cakupan QA Lab rilis mencakup:

- lane paritas mock yang membandingkan lane kandidat OpenAI dengan baseline Opus 4.6
  menggunakan paket paritas agentic
- profil QA Matrix live cepat menggunakan environment `qa-live-shared`
- lane QA Telegram live menggunakan sewa kredensial Convex CI
- `pnpm qa:otel:smoke` ketika telemetri rilis memerlukan bukti lokal eksplisit

Gunakan box ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA
dan alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram
saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai run QA-Lab
sharded manual, bukan lane kritis rilis default.

### Package

Box Package adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan kandidat
menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, serta menjaga ref harness
workflow terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat
- `source=ref`: kemas branch, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS dengan `package_sha256` wajib
- `source=artifact`: gunakan ulang `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`,
artefak paket rilis yang disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues`, dan
`telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, pembaruan,
pembersihan dependensi Plugin usang, fixture Plugin offline, pembaruan Plugin,
dan QA paket Telegram terhadap tarball terselesaikan yang sama. Matriks upgrade
mencakup setiap baseline stable yang dipublikasikan npm dari `2026.4.23` sampai
`latest`; gunakan Package Acceptance dengan `source=npm` untuk kandidat yang
sudah dikirim, atau `source=ref`/`source=artifact` untuk tarball npm lokal
berbasis SHA sebelum publish. Ini adalah pengganti native GitHub untuk sebagian
besar cakupan package/update yang sebelumnya memerlukan Parallels. Pemeriksaan
rilis lintas-OS tetap penting untuk onboarding, installer, dan perilaku platform
spesifik OS, tetapi validasi produk package/update sebaiknya mengutamakan
Package Acceptance.

Checklist kanonis untuk validasi pembaruan dan Plugin adalah
[Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins). Gunakan ini saat
memutuskan lane lokal, Docker, Package Acceptance, atau release-check mana yang
membuktikan perubahan install/update Plugin, cleanup doctor, atau migrasi paket
yang dipublikasikan. Migrasi pembaruan publikasi lengkap dari setiap paket stable
`2026.4.23+` adalah workflow `Update Migration` manual terpisah, bukan bagian
dari Full Release CI.

Kelonggaran package-acceptance legacy sengaja dibatasi waktu. Paket hingga
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang sudah
dipublikasikan ke npm: entri inventaris QA privat yang hilang dari tarball,
`gateway install --wrapper` yang hilang, file patch yang hilang dalam fixture git
turunan tarball, `update.channel` tersimpan yang hilang, lokasi install-record
Plugin legacy, persistensi install-record marketplace yang hilang, dan migrasi
metadata config selama `plugins update`. Paket `2026.4.26` yang dipublikasikan
dapat memberi peringatan untuk file stamp metadata build lokal yang sudah
dikirim. Paket berikutnya harus memenuhi kontrak paket modern; celah yang sama
akan menggagalkan validasi rilis.

Gunakan profil Package Acceptance yang lebih luas ketika pertanyaan rilis adalah
tentang paket yang benar-benar dapat diinstal:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Profil paket umum:

- `smoke`: jalur pemasangan paket/kanal/agen cepat, jaringan Gateway, dan pemuatan ulang
  konfigurasi
- `package`: kontrak pemasangan/pembaruan/paket Plugin tanpa ClawHub langsung; ini adalah
  bawaan release-check
- `product`: `package` ditambah kanal MCP, pembersihan cron/subagen, pencarian web
  OpenAI, dan OpenWebUI
- `full`: potongan jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk pengulangan terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Package Acceptance. Alur kerja meneruskan
tarball `package-under-test` yang telah diselesaikan ke jalur Telegram; alur kerja
Telegram mandiri tetap menerima spesifikasi npm yang telah dipublikasikan untuk pemeriksaan pascapublikasi.

## Otomatisasi publikasi rilis

`OpenClaw Release Publish` adalah titik masuk publikasi bermutasi normal. Ini
mengorkestrasi alur kerja trusted-publisher sesuai urutan yang dibutuhkan rilis:

1. Check out tag rilis dan selesaikan SHA commit-nya.
2. Verifikasi tag dapat dijangkau dari `main` atau `release/*`.
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan cakupan dan SHA yang sama.
6. Dispatch `OpenClaw NPM Release` dengan tag rilis, dist-tag npm, dan
   `preflight_run_id` yang tersimpan.

Contoh publikasi beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publikasi stabil ke dist-tag beta bawaan:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Promosi stabil langsung ke `latest` bersifat eksplisit:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Gunakan alur kerja tingkat lebih rendah `Plugin NPM Release` dan `Plugin ClawHub Release`
hanya untuk pekerjaan perbaikan atau publikasi ulang yang terfokus. Untuk perbaikan Plugin
terpilih, berikan `plugin_publish_scope=selected` dan `plugins=@openclaw/name` ke
`OpenClaw Release Publish`, atau dispatch alur kerja anak secara langsung ketika paket
OpenClaw tidak boleh dipublikasikan.

## Input alur kerja NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; saat `preflight_only=true`, ini juga dapat berupa SHA commit
  cabang alur kerja lengkap 40 karakter saat ini untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk jalur
  publikasi sebenarnya
- `preflight_run_id`: wajib pada jalur publikasi sebenarnya agar alur kerja menggunakan kembali
  tarball yang telah disiapkan dari proses preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publikasi; bawaan ke `beta`

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id proses preflight `OpenClaw NPM Release` yang berhasil;
  wajib saat `publish_openclaw_npm=true`
- `npm_dist_tag`: tag target npm untuk paket OpenClaw
- `plugin_publish_scope`: bawaan ke `all-publishable`; gunakan `selected` hanya
  untuk pekerjaan perbaikan terfokus
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma saat
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: bawaan ke `true`; tetapkan `false` hanya saat menggunakan
  alur kerja sebagai orkestrator perbaikan khusus Plugin

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: cabang, tag, atau SHA commit lengkap yang akan divalidasi. Pemeriksaan yang memuat rahasia
  mengharuskan commit yang diselesaikan dapat dijangkau dari cabang OpenClaw atau
  tag rilis.

Aturan:

- Tag stabil dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prarilis beta hanya dapat dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit lengkap hanya diizinkan saat
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu
  khusus validasi
- Jalur publikasi sebenarnya harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama preflight;
  alur kerja memverifikasi metadata tersebut sebelum publikasi berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit cabang alur kerja lengkap saat ini
     untuk dry run khusus validasi dari alur kerja preflight
2. Pilih `npm_dist_tag=beta` untuk alur normal beta-terlebih-dahulu, atau `latest` hanya
   saat Anda sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau SHA commit lengkap
   saat Anda menginginkan CI normal ditambah cakupan cache prompt langsung, Docker, QA Lab,
   Matrix, dan Telegram dari satu alur kerja manual
4. Jika Anda sengaja hanya membutuhkan grafik pengujian normal yang deterministik, jalankan
   alur kerja manual `CI` pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag` yang sama,
   dan `preflight_run_id` yang tersimpan; ini memublikasikan Plugin yang dieksternalisasi ke npm
   dan ClawHub sebelum mempromosikan paket npm OpenClaw
7. Jika rilis mendarat di `beta`, gunakan alur kerja privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stabil yang sama, gunakan alur kerja privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi
   pemulihan mandiri terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan publikasi khusus OIDC.

Itu membuat jalur publikasi langsung dan jalur promosi beta-terlebih-dahulu sama-sama
terdokumentasi dan terlihat oleh operator.

Jika maintainer harus fallback ke autentikasi npm lokal, jalankan perintah CLI 1Password
(`op`) hanya di dalam sesi tmux khusus. Jangan panggil `op`
langsung dari shell agen utama; menempatkannya di dalam tmux membuat prompt,
peringatan, dan penanganan OTP dapat diamati dan mencegah peringatan host berulang.

## Referensi publik

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer menggunakan dokumen rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
untuk runbook sebenarnya.

## Terkait

- [Kanal rilis](/id/install/development-channels)
