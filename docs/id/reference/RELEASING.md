---
read_when:
    - Mencari definisi kanal rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan irama rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan siklus
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-03T21:35:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` saat diminta secara eksplisit
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: head bergerak dari `main`

## Penamaan versi

- Versi rilis stabil: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stabil: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prarilis beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan tambahkan nol di depan bulan atau hari
- `latest` berarti rilis npm stabil yang saat ini dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stabil dan rilis koreksi stabil dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah diperiksa nanti
- Setiap rilis stabil OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/sign/notarize aplikasi Mac dicadangkan untuk stabil kecuali diminta secara eksplisit

## Kadensi rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stabil menyusul hanya setelah beta terbaru divalidasi
- Maintainer biasanya memotong rilis dari branch `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta telah didorong atau dipublikasikan dan memerlukan perbaikan, maintainer memotong
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Daftar periksa operator rilis

Daftar periksa ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: tarik terbaru, pastikan commit target sudah didorong,
   dan pastikan CI `main` saat ini cukup hijau untuk membuat branch darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, pertahankan entri yang berfokus pada pengguna, commit, dorong, dan rebase/pull
   sekali lagi sebelum membuat branch.
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
   SHA branch rilis 40 karakter penuh diizinkan untuk preflight khusus validasi.
   Simpan `preflight_run_id` yang berhasil.
7. Mulai semua tes prarilis dengan `Full Release Validation` untuk
   branch rilis, tag, atau SHA commit penuh. Ini adalah satu-satunya entrypoint manual
   untuk empat kotak tes rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di branch rilis dan jalankan ulang file, lane,
   job workflow, profil paket, penyedia, atau allowlist model terkecil yang gagal yang
   membuktikan perbaikan. Jalankan ulang payung penuh hanya ketika permukaan yang berubah membuat
   bukti sebelumnya basi.
9. Untuk beta, tag `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   branch `release/YYYY.M.D` yang sesuai. Ini memverifikasi `pnpm plugins:sync:check`,
   memublikasikan semua paket Plugin yang dapat dipublikasikan ke npm terlebih dahulu, memublikasikan set yang sama
   ke ClawHub kedua sebagai tarball npm-pack ClawPack, lalu mempromosikan
   artefak preflight npm OpenClaw yang disiapkan dengan dist-tag yang sesuai. Setelah
   publikasi, jalankan penerimaan paket pascapublikasi
   terhadap paket `openclaw@YYYY.M.D-beta.N` atau
   `openclaw@beta` yang dipublikasikan. Jika prarilis yang telah didorong atau dipublikasikan memerlukan perbaikan,
   potong nomor prarilis berikutnya yang sesuai; jangan hapus atau tulis ulang
   prarilis lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang telah diperiksa memiliki
    bukti validasi yang diperlukan. Publikasi npm stabil juga melalui
    `OpenClaw Release Publish`, menggunakan kembali artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stabil juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang telah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
11. Setelah publikasi, jalankan pemverifikasi npm pascapublikasi, E2E Telegram
    npm-terpublikasi standalone opsional saat Anda memerlukan bukti channel pascapublikasi,
    promosi dist-tag saat diperlukan, catatan rilis/prarilis GitHub dari bagian
    `CHANGELOG.md` lengkap yang sesuai, dan langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum prapenerbangan rilis agar TypeScript pengujian tetap
  tercakup di luar gerbang lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum prapenerbangan rilis agar pemeriksaan siklus
  impor dan batas arsitektur yang lebih luas hijau di luar gerbang lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis
  `dist/*` yang diharapkan dan bundle Control UI tersedia untuk langkah validasi
  paket
- Jalankan `pnpm plugins:sync` setelah kenaikan versi root dan sebelum pemberian tag. Ini
  memperbarui versi paket Plugin yang dapat dipublikasikan, metadata kompatibilitas peer/API
  OpenClaw, metadata build, dan stub changelog Plugin agar cocok dengan versi rilis
  inti. `pnpm plugins:sync:check` adalah penjaga rilis yang tidak mengubah apa pun;
  workflow publikasi gagal sebelum mutasi registry apa pun jika langkah ini
  terlupakan.
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua kotak pengujian prarilis dari satu entrypoint. Workflow ini menerima branch,
  tag, atau SHA commit lengkap, men-dispatch `CI` manual, dan men-dispatch
  `OpenClaw Release Checks` untuk install smoke, package acceptance, suite jalur rilis
  Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram. Dengan
  `release_profile=full` dan `rerun_group=all`, workflow ini juga menjalankan package
  Telegram E2E terhadap artefak `release-package-under-test` dari pemeriksaan rilis.
  Berikan `npm_telegram_package_spec` setelah publikasi ketika Telegram E2E yang sama
  juga harus membuktikan paket npm yang dipublikasikan. Berikan
  `package_acceptance_package_spec` setelah publikasi ketika Package Acceptance
  harus menjalankan matriks paket/pembaruan terhadap paket npm yang sudah dikirim,
  bukan artefak yang dibangun dari SHA. Berikan
  `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa
  validasi cocok dengan paket npm yang dipublikasikan tanpa memaksa Telegram E2E.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti side-channel
  untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@beta`, `openclaw@latest`, atau versi rilis persis; `source=ref`
  untuk memaketkan branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256
  wajib; atau `source=artifact` untuk tarball yang diunggah oleh run GitHub
  Actions lain. Workflow menyelesaikan kandidat menjadi
  `package-under-test`, memakai ulang scheduler rilis Docker E2E terhadap
  tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika lane Docker
  yang dipilih mencakup `published-upgrade-survivor`, artefak paket adalah kandidat
  dan `published_upgrade_survivor_baseline` memilih baseline yang dipublikasikan.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane instalasi/channel/agent, jaringan Gateway, dan muat ulang konfigurasi
  - `package`: lane paket/pembaruan/Plugin native artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil package ditambah channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: potongan jalur rilis Docker dengan OpenWebUI
  - `custom`: pemilihan `docker_lanes` persis untuk rerun terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya memerlukan cakupan CI
  normal penuh untuk kandidat rilis. Dispatch CI manual melewati scoping perubahan
  dan memaksa shard Linux Node, shard bundled-Plugin, kontrak channel,
  kompatibilitas Node 22, `check`, `check-additional`, build smoke,
  pemeriksaan docs, Python skills, Windows, macOS, Android, dan lane i18n Control UI.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` saat memvalidasi telemetri rilis. Ini menjalankan
  QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi nama span trace
  yang diekspor, atribut terbatas, serta redaksi konten/pengenal tanpa
  memerlukan Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk urutan publikasi yang mengubah status setelah
  tag ada. Dispatch dari `release/YYYY.M.D` (atau `main` ketika memublikasikan
  tag yang dapat dijangkau dari main), berikan tag rilis dan
  `preflight_run_id` npm OpenClaw yang berhasil, dan pertahankan cakupan publikasi
  Plugin default `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus.
  Workflow menserialkan publikasi npm Plugin, publikasi ClawHub Plugin, dan publikasi npm OpenClaw
  agar paket inti tidak dipublikasikan sebelum Plugin eksternalnya.
- Pemeriksaan rilis sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan lane paritas mock QA Lab ditambah profil Matrix
  live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live
  menggunakan environment `qa-live-shared`; Telegram juga menggunakan lease kredensial CI
  Convex. Jalankan workflow manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris
  transport, media, dan E2EE Matrix penuh secara paralel.
- Validasi runtime instalasi dan upgrade lintas OS adalah bagian dari
  `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil
  workflow reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap di
  lane sendiri agar tidak menunda atau memblokir publikasi
- Pemeriksaan rilis yang membawa secret harus di-dispatch melalui `Full Release
Validation` atau dari ref workflow `main`/release agar logika workflow dan
  secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama
  commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Prapenerbangan khusus validasi `OpenClaw NPM Release` juga menerima SHA commit
  branch workflow 40 karakter lengkap saat ini tanpa memerlukan tag yang sudah di-push
- Jalur SHA itu hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; publikasi nyata tetap memerlukan tag rilis nyata
- Kedua workflow mempertahankan jalur publikasi dan promosi nyata di runner yang di-host GitHub,
  sementara jalur validasi yang tidak mengubah status dapat menggunakan runner Linux
  Blacksmith yang lebih besar
- Workflow itu menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Prapenerbangan rilis npm tidak lagi menunggu lane pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang cocok) sebelum persetujuan
- Setelah publikasi npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang cocok) untuk memverifikasi jalur instalasi registry
  yang dipublikasikan dalam prefix temp baru
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terinstal, setup Telegram, dan Telegram E2E nyata
  terhadap paket npm yang dipublikasikan menggunakan pool kredensial Telegram lease bersama.
  One-off maintainer lokal dapat menghilangkan var Convex dan memberikan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Maintainer dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui
  workflow manual `NPM Telegram Beta E2E`. Workflow ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan prapenerbangan-lalu-promosi:
  - publikasi npm nyata harus melewati `preflight_run_id` npm yang berhasil
  - publikasi npm nyata harus di-dispatch dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run prapenerbangan yang berhasil
  - rilis npm stabil default ke `beta`
  - publikasi npm stabil dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi npm dist-tag berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    demi keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara
    repo publik mempertahankan publikasi hanya OIDC
  - `macOS Release` publik hanya validasi; ketika tag hanya ada di
    branch rilis tetapi workflow di-dispatch dari `main`, setel
    `public_release_branch=release/YYYY.M.D`
  - publikasi mac privat nyata harus melewati
    `preflight_run_id` dan `validate_run_id` mac privat yang berhasil
  - jalur publikasi nyata mempromosikan artefak yang sudah disiapkan alih-alih membangunnya
    lagi
- Untuk rilis koreksi stabil seperti `YYYY.M.D-N`, verifier pascapublikasi
  juga memeriksa jalur upgrade temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  agar koreksi rilis tidak diam-diam meninggalkan instalasi global lama pada
  payload stabil dasar
- Prapenerbangan rilis npm gagal tertutup kecuali tarball mencakup
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pascapublikasi juga memeriksa bahwa entrypoint Plugin yang dipublikasikan dan
  metadata paket ada di layout registry terinstal. Rilis yang mengirim payload runtime
  Plugin yang hilang akan gagal pada verifier pascapublikasi dan tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran npm pack `unpackedSize` pada
  tarball pembaruan kandidat, sehingga installer e2e menangkap pembengkakan pack yang tidak disengaja
  sebelum jalur publikasi rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing extension, atau
  matriks pengujian extension, regenerasi dan tinjau output matriks
  `plugin-prerelease-extension-shard` milik planner dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  menggambarkan layout CI yang sudah usang
- Kesiapan rilis macOS stabil juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang dipaketkan
  - `appcast.xml` di `main` harus menunjuk ke zip stabil baru setelah publikasi
  - aplikasi yang dipaketkan harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas batas bawah build Sparkle kanonis
    untuk versi rilis tersebut

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai semua pengujian prarilis dari
satu entrypoint. Untuk bukti commit terpin pada branch yang bergerak cepat, gunakan
helper agar setiap workflow anak berjalan dari branch sementara yang dipatok ke SHA
target:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper ini mendorong `release-ci/<sha>-...`, men-dispatch `Full Release Validation`
dari branch tersebut dengan `ref=<sha>`, memverifikasi setiap `headSha` workflow anak
cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian run anak
`main` yang lebih baru secara tidak sengaja.

Untuk validasi branch atau tag rilis, jalankan dari ref workflow `main` tepercaya dan
berikan branch atau tag rilis sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Alur kerja menyelesaikan ref target, men-dispatch `CI` manual dengan
`target_ref=<release-ref>`, men-dispatch `OpenClaw Release Checks`, menyiapkan
artefak induk `release-package-under-test` untuk pemeriksaan yang berhadapan
dengan paket, dan men-dispatch E2E Telegram paket mandiri ketika
`release_profile=full` dengan `rerun_group=all` atau ketika
`npm_telegram_package_spec` ditetapkan. `OpenClaw Release Checks` kemudian
menyebarkan install smoke, pemeriksaan rilis lintas-OS, cakupan jalur rilis
Docker live/E2E, Package Acceptance dengan QA paket Telegram, paritas QA Lab,
Matrix live, dan Telegram live. Run penuh hanya dapat diterima ketika ringkasan
`Full Release Validation` menampilkan `normal_ci` dan `release_checks` sebagai
berhasil. Dalam mode full/all, child `npm_telegram` juga harus berhasil; di luar
full/all, itu dilewati kecuali `npm_telegram_package_spec` yang sudah
dipublikasikan disediakan. Ringkasan verifier akhir menyertakan tabel job
terlambat untuk setiap run child, sehingga release manager dapat melihat jalur
kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk matriks
tahap lengkap, nama job alur kerja yang tepat, perbedaan profil stable versus
full, artefak, dan handle rerun terfokus.
Alur kerja child di-dispatch dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan ketika target `ref` menunjuk ke
branch atau tag rilis yang lebih lama. Tidak ada input ref alur kerja Full
Release Validation yang terpisah; pilih harness tepercaya dengan memilih ref run
alur kerja. Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit yang
tepat pada `main` yang bergerak; SHA commit mentah tidak dapat menjadi ref
dispatch alur kerja, jadi gunakan `pnpm ci:full-release --sha <sha>` untuk
membuat branch sementara yang dipin.

Gunakan `release_profile` untuk memilih keluasan live/provider:

- `minimum`: jalur OpenAI/core live dan Docker yang paling cepat dan kritis untuk rilis
- `stable`: minimum plus cakupan provider/backend stabil untuk persetujuan rilis
- `full`: stable plus cakupan luas provider/media penasihat

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk
menyelesaikan ref target sekali sebagai `release-package-under-test` dan
menggunakan kembali artefak itu dalam pemeriksaan Docker jalur rilis dan Package
Acceptance. Ini menjaga semua box yang berhadapan dengan paket pada byte yang
sama dan menghindari build paket berulang. Install smoke OpenAI lintas-OS
menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika variabel repo/org
ditetapkan, jika tidak `openai/gpt-5.4`, karena lane ini membuktikan instalasi
paket, onboarding, startup Gateway, dan satu giliran agen live, bukan
membenchmark model default paling lambat. Matriks provider live yang lebih luas
tetap menjadi tempat untuk cakupan spesifik model.

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

Jangan gunakan umbrella penuh sebagai rerun pertama setelah perbaikan terfokus.
Jika satu box gagal, gunakan alur kerja child yang gagal, job, lane Docker,
profil paket, provider model, atau lane QA untuk bukti berikutnya. Jalankan
umbrella penuh lagi hanya ketika perbaikan mengubah orkestrasi rilis bersama
atau membuat bukti semua-box sebelumnya usang. Verifier akhir umbrella memeriksa
ulang id run alur kerja child yang tercatat, jadi setelah alur kerja child
berhasil di-rerun, rerun hanya job induk `Verify full validation` yang gagal.

Untuk pemulihan terbatas, teruskan `rerun_group` ke umbrella. `all` adalah run
release-candidate yang sebenarnya, `ci` hanya menjalankan child CI normal,
`plugin-prerelease` hanya menjalankan child Plugin khusus rilis,
`release-checks` menjalankan setiap box rilis, dan grup rilis yang lebih sempit
adalah `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`,
`qa-live`, dan `npm-telegram`. Rerun `npm-telegram` terfokus memerlukan
`npm_telegram_package_spec`; run full/all dengan `release_profile=full`
menggunakan artefak paket release-checks.

### Vitest

Box Vitest adalah alur kerja child `CI` manual. CI manual sengaja melewati
scoping perubahan dan memaksa grafik pengujian normal untuk kandidat rilis:
shard Linux Node, shard Plugin bawaan, kontrak channel, kompatibilitas Node 22,
`check`, `check-additional`, build smoke, pemeriksaan docs, Skills Python,
Windows, macOS, Android, dan i18n Control UI.

Gunakan box ini untuk menjawab "apakah pohon sumber lulus suite pengujian normal
penuh?" Ini tidak sama dengan validasi produk jalur rilis. Bukti yang disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang di-dispatch
- run `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artefak waktu Vitest seperti `.artifacts/vitest-shard-timings.json` ketika
  sebuah run memerlukan analisis performa

Jalankan CI manual secara langsung hanya ketika rilis membutuhkan CI normal yang
deterministik tetapi tidak membutuhkan Docker, QA Lab, live, lintas-OS, atau box
paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, plus alur kerja
`install-smoke` mode rilis. Ini memvalidasi kandidat rilis melalui lingkungan
Docker terpaket, bukan hanya pengujian tingkat sumber.

Cakupan Docker rilis mencakup:

- install smoke penuh dengan install smoke global Bun lambat diaktifkan
- persiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target, dengan job smoke QR, root/Gateway, dan installer/Bun berjalan sebagai shard install-smoke terpisah
- lane E2E repository
- chunk Docker jalur rilis: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, dan `plugins-runtime-install-h`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` ketika diminta
- lane install/uninstall Plugin bawaan terpisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker ketika pemeriksaan rilis
  menyertakan suite live

Gunakan artefak Docker sebelum rerun. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
waktu fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan
terfokus, gunakan `docker_lanes=<lane[,lane]>` pada alur kerja live/E2E yang
dapat digunakan ulang alih-alih mererun semua chunk rilis. Perintah rerun yang
dihasilkan menyertakan `package_artifact_run_id` sebelumnya dan input image
Docker yang disiapkan ketika tersedia, sehingga lane yang gagal dapat
menggunakan kembali tarball dan image GHCR yang sama.

### QA Lab

Box QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Ini adalah gate
rilis perilaku agentik dan tingkat channel, terpisah dari mekanika paket Vitest
dan Docker.

Cakupan QA Lab rilis mencakup:

- lane paritas mock yang membandingkan lane kandidat OpenAI dengan baseline Opus 4.6 menggunakan paket paritas agentik
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial CI Convex
- `pnpm qa:otel:smoke` ketika telemetri rilis membutuhkan bukti lokal eksplisit

Gunakan box ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA
dan alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan
Telegram saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai run
QA-Lab sharded manual, bukan lane kritis rilis default.

### Paket

Box Paket adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan kandidat
menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, dan menjaga ref harness alur
kerja terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat
- `source=ref`: mengemas branch, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: mengunduh `.tgz` HTTPS dengan `package_sha256` yang wajib
- `source=artifact`: menggunakan kembali `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, dan `telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, pembaruan, pembersihan dependensi Plugin usang, fixture Plugin offline, pembaruan Plugin, dan QA paket Telegram terhadap tarball terselesaikan yang sama. Matriks upgrade mencakup setiap baseline stabil yang dipublikasikan npm dari `2026.4.23` hingga `latest`; gunakan Package Acceptance dengan `source=npm` untuk kandidat yang sudah dikirimkan, atau `source=ref`/`source=artifact` untuk tarball npm lokal berbasis SHA sebelum publish. Ini adalah pengganti GitHub-native untuk sebagian besar cakupan paket/pembaruan yang sebelumnya membutuhkan Parallels. Pemeriksaan rilis lintas-OS tetap penting untuk onboarding, installer, dan perilaku platform spesifik OS, tetapi validasi produk paket/pembaruan sebaiknya memilih Package Acceptance.

Checklist kanonis untuk validasi pembaruan dan Plugin adalah
[Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins). Gunakan ini saat
memutuskan lane lokal, Docker, Package Acceptance, atau release-check mana yang
membuktikan perubahan instal/pembaruan Plugin, pembersihan doctor, atau migrasi
paket yang dipublikasikan. Migrasi pembaruan terbit yang menyeluruh dari setiap
paket stabil `2026.4.23+` adalah alur kerja `Update Migration` manual terpisah,
bukan bagian dari Full Release CI.

Kelonggaran package-acceptance lama sengaja dibatasi waktu. Paket hingga
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang
sudah dipublikasikan ke npm: entri inventaris QA privat yang hilang dari
tarball, `gateway install --wrapper` yang hilang, file patch yang hilang dalam
fixture git turunan tarball, `update.channel` persisten yang hilang, lokasi
catatan instal Plugin lama, persistensi catatan instal marketplace yang hilang,
dan migrasi metadata konfigurasi selama `plugins update`. Paket `2026.4.26`
yang dipublikasikan dapat memperingatkan untuk file cap metadata build lokal
yang sudah dikirimkan. Paket berikutnya harus memenuhi kontrak paket modern;
celah yang sama tersebut menggagalkan validasi rilis.

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

- `smoke`: lane pemasangan paket/channel/agent cepat, jaringan Gateway, dan pemuatan
  ulang konfigurasi
- `package`: kontrak pemasangan/pembaruan/paket Plugin tanpa ClawHub live; ini adalah default
  pemeriksaan rilis
- `product`: `package` plus channel MCP, pembersihan cron/subagent, pencarian web
  OpenAI, dan OpenWebUI
- `full`: bagian jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk menjalankan ulang secara terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Package Acceptance. Alur kerja meneruskan
tarball `package-under-test` yang telah di-resolve ke lane Telegram; alur kerja
Telegram mandiri tetap menerima spesifikasi npm yang sudah dipublikasikan untuk pemeriksaan pascapublikasi.

## Otomatisasi publikasi rilis

`OpenClaw Release Publish` adalah titik masuk publikasi bermutasi yang normal. Ini
mengorkestrasi alur kerja penerbit tepercaya sesuai urutan yang dibutuhkan rilis:

1. Check out tag rilis dan resolve SHA commit-nya.
2. Verifikasi bahwa tag dapat dijangkau dari `main` atau `release/*`.
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan cakupan dan SHA yang sama.
6. Dispatch `OpenClaw NPM Release` dengan tag rilis, dist-tag npm, dan
   `preflight_run_id` tersimpan.

Contoh publikasi beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publikasi stabil ke dist-tag beta default:

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
hanya untuk perbaikan terfokus atau pekerjaan publikasi ulang. Untuk perbaikan Plugin terpilih, teruskan
`plugin_publish_scope=selected` dan `plugins=@openclaw/name` ke
`OpenClaw Release Publish`, atau dispatch alur kerja anak secara langsung ketika paket
OpenClaw tidak boleh dipublikasikan.

## Input alur kerja NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga boleh berupa SHA commit 40 karakter lengkap dari cabang alur kerja saat ini untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk jalur
  publikasi nyata
- `preflight_run_id`: wajib pada jalur publikasi nyata agar alur kerja menggunakan ulang
  tarball yang disiapkan dari run preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publikasi; default ke `beta`

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id run preflight `OpenClaw NPM Release` yang berhasil;
  wajib ketika `publish_openclaw_npm=true`
- `npm_dist_tag`: tag target npm untuk paket OpenClaw
- `plugin_publish_scope`: default ke `all-publishable`; gunakan `selected` hanya
  untuk pekerjaan perbaikan terfokus
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma ketika
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default ke `true`; setel `false` hanya ketika menggunakan alur kerja
  sebagai orkestrator perbaikan khusus Plugin

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: cabang, tag, atau SHA commit lengkap untuk divalidasi. Pemeriksaan yang membawa rahasia
  mengharuskan commit yang di-resolve dapat dijangkau dari cabang OpenClaw atau
  tag rilis.

Aturan:

- Tag stabil dan koreksi boleh dipublikasikan ke `beta` atau `latest`
- Tag prarilis beta hanya boleh dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit lengkap hanya diizinkan ketika
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu
  khusus validasi
- Jalur publikasi nyata harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama preflight;
  alur kerja memverifikasi metadata itu sebelum publikasi berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit 40 karakter lengkap dari cabang alur kerja saat ini
     untuk dry run khusus validasi dari alur kerja preflight
2. Pilih `npm_dist_tag=beta` untuk alur beta-first normal, atau `latest` hanya
   ketika Anda memang menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau SHA commit lengkap
   ketika Anda menginginkan CI normal plus cakupan cache prompt live, Docker, QA Lab,
   Matrix, dan Telegram dari satu alur kerja manual
4. Jika Anda sengaja hanya membutuhkan grafik pengujian normal yang deterministik, jalankan
   alur kerja manual `CI` pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag` yang sama,
   dan `preflight_run_id` yang tersimpan; ini mempublikasikan Plugin yang dieksternalisasi ke npm
   dan ClawHub sebelum mempromosikan paket npm OpenClaw
7. Jika rilis mendarat di `beta`, gunakan alur kerja privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stabil yang sama, gunakan alur kerja privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi self-healing terjadwalnya
   memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan publikasi hanya OIDC.

Itu membuat jalur publikasi langsung dan jalur promosi beta-first sama-sama
terdokumentasi dan terlihat oleh operator.

Jika maintainer harus fallback ke autentikasi npm lokal, jalankan perintah CLI 1Password
(`op`) hanya di dalam sesi tmux khusus. Jangan panggil `op`
langsung dari shell agent utama; menjaganya tetap di dalam tmux membuat prompt,
peringatan, dan penanganan OTP dapat diamati serta mencegah peringatan host berulang.

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
untuk runbook aktual.

## Terkait

- [Channel rilis](/id/install/development-channels)
