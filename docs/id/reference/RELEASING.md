---
read_when:
    - Mencari definisi kanal rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan irama rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan ritme rilis
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-04-30T10:10:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
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
- Jangan beri padding nol pada bulan atau hari
- `latest` berarti rilis npm stabil yang saat ini dipromosikan
- `beta` berarti target pemasangan beta saat ini
- Rilis stabil dan rilis koreksi stabil dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah diperiksa kemudian
- Setiap rilis stabil OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/tanda tangan/notarisasi aplikasi mac dicadangkan untuk stabil kecuali diminta secara eksplisit

## Kadensi rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stabil mengikuti hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari cabang `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta telah didorong atau dipublikasikan dan perlu diperbaiki, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Daftar periksa operator rilis

Daftar periksa ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: tarik yang terbaru, pastikan commit target telah didorong,
   dan pastikan CI `main` saat ini cukup hijau untuk dibuatkan cabang darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, pertahankan entri agar berorientasi pengguna, commit, push, lalu rebase/pull
   sekali lagi sebelum membuat cabang.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas
   yang kedaluwarsa hanya jika jalur peningkatan tetap tercakup, atau catat mengapa itu
   sengaja dipertahankan.
4. Buat `release/YYYY.M.D` dari `main` saat ini; jangan melakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dimaksud, lalu jalankan
   preflight deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, dan `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA cabang rilis lengkap 40 karakter diizinkan untuk preflight khusus validasi.
   Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk
   cabang rilis, tag, atau SHA commit lengkap. Ini adalah satu entrypoint manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di cabang rilis dan jalankan ulang file gagal terkecil,
   lane, job workflow, profil paket, penyedia, atau allowlist model yang
   membuktikan perbaikan. Jalankan ulang umbrella penuh hanya saat permukaan yang berubah membuat
   bukti sebelumnya menjadi usang.
9. Untuk beta, tag `vYYYY.M.D-beta.N`, publikasikan dengan dist-tag npm `beta`, lalu jalankan
   penerimaan paket pascapublikasi terhadap paket `openclaw@YYYY.M.D-beta.N`
   atau `openclaw@beta` yang telah dipublikasikan. Jika beta yang telah didorong atau dipublikasikan perlu diperbaiki, buat
   `-beta.N` berikutnya; jangan hapus atau tulis ulang beta lama.
10. Untuk stabil, lanjutkan hanya setelah beta yang telah diperiksa atau kandidat rilis memiliki
    bukti validasi yang diperlukan. Publikasi npm stabil menggunakan ulang artefak
    preflight yang berhasil melalui `preflight_run_id`; kesiapan rilis macOS stabil
    juga memerlukan paket `.zip`, `.dmg`, `.dSYM.zip`, dan
    `appcast.xml` yang diperbarui di `main`.
11. Setelah publikasi, jalankan pemverifikasi pascapublikasi npm, E2E Telegram
    npm-terpublikasi mandiri opsional saat Anda memerlukan bukti channel pascapublikasi,
    promosi dist-tag bila diperlukan, catatan rilis/prarilis GitHub dari
    bagian `CHANGELOG.md` lengkap yang cocok, dan langkah-langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum prapemeriksaan rilis agar TypeScript pengujian tetap
  tercakup di luar gerbang lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum prapemeriksaan rilis agar pemeriksaan siklus impor
  yang lebih luas dan batas arsitektur hijau di luar gerbang lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis
  `dist/*` yang diharapkan dan bundel Control UI ada untuk langkah validasi
  paket
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua kotak pengujian pra-rilis dari satu entrypoint. Ini menerima branch,
  tag, atau SHA commit lengkap, men-dispatch `CI` manual, dan men-dispatch
  `OpenClaw Release Checks` untuk install smoke, package acceptance, suite
  release-path Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram.
  Berikan `npm_telegram_package_spec` hanya setelah sebuah paket telah
  dipublikasikan dan E2E Telegram pascapublikasi juga harus berjalan. Berikan
  `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa
  validasi cocok dengan paket npm yang dipublikasikan tanpa memaksa E2E Telegram.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti
  side-channel untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@beta`, `openclaw@latest`, atau versi rilis persis; `source=ref`
  untuk memaketkan branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256
  wajib; atau `source=artifact` untuk tarball yang diunggah oleh run GitHub
  Actions lain. Workflow menyelesaikan kandidat menjadi
  `package-under-test`, menggunakan ulang scheduler rilis Docker E2E terhadap
  tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane instalasi/channel/agent, jaringan Gateway, dan reload konfigurasi
  - `package`: lane paket/update/Plugin native artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket plus channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: potongan release-path Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` persis untuk rerun yang terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya membutuhkan cakupan CI normal penuh
  untuk kandidat rilis. Dispatch CI manual melewati pelingkupan changed
  dan memaksa shard Linux Node, shard bundled-plugin, kontrak channel,
  kompatibilitas Node 22, `check`, `check-additional`, build smoke,
  pemeriksaan dokumen, Skills Python, Windows, macOS, Android, dan lane i18n Control UI.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` ketika memvalidasi telemetri rilis. Ini menjalankan
  QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi nama span trace
  yang diekspor, atribut terbatas, serta redaksi konten/pengenal tanpa
  memerlukan Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Pemeriksaan rilis sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan gerbang paritas mock QA Lab plus profil Matrix live
  cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live
  menggunakan environment `qa-live-shared`; Telegram juga menggunakan lease kredensial
  CI Convex. Jalankan workflow manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris transport,
  media, dan E2EE Matrix penuh secara paralel.
- Validasi runtime install dan upgrade lintas-OS adalah bagian dari
  `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil
  workflow reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di lane
  sendiri agar tidak menahan atau memblokir publikasi
- Pemeriksaan rilis yang membawa secret harus di-dispatch melalui `Full Release
Validation` atau dari ref workflow `main`/release agar logika workflow dan
  secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama
  commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Prapemeriksaan validation-only `OpenClaw NPM Release` juga menerima SHA commit lengkap 40 karakter
  branch workflow saat ini tanpa memerlukan tag yang sudah didorong
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; publikasi nyata tetap memerlukan tag rilis nyata
- Kedua workflow menjaga jalur publikasi dan promosi nyata di runner GitHub-hosted,
  sementara jalur validasi non-mutating dapat menggunakan runner Linux Blacksmith
  yang lebih besar
- Workflow tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Prapemeriksaan rilis npm tidak lagi menunggu lane pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang cocok) sebelum persetujuan
- Setelah publikasi npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang cocok) untuk memverifikasi jalur instalasi registry
  yang dipublikasikan dalam prefix temp baru
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding installed-package, penyiapan Telegram, dan E2E Telegram nyata
  terhadap paket npm yang dipublikasikan menggunakan pool kredensial Telegram bersama
  yang disewa. One-off maintainer lokal boleh menghilangkan var Convex dan meneruskan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Maintainer dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui
  workflow manual `NPM Telegram Beta E2E`. Ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan prapemeriksaan-lalu-promosi:
  - publikasi npm nyata harus melewati `preflight_run_id` npm yang berhasil
  - publikasi npm nyata harus di-dispatch dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run prapemeriksaan yang berhasil
  - rilis npm stable default ke `beta`
  - publikasi npm stable dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    demi keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara repo
    publik mempertahankan publikasi hanya OIDC
  - `macOS Release` publik hanya untuk validasi
  - publikasi mac privat nyata harus melewati `preflight_run_id` dan `validate_run_id`
    mac privat yang berhasil
  - jalur publikasi nyata mempromosikan artefak yang telah disiapkan alih-alih membangunnya ulang
- Untuk rilis koreksi stable seperti `YYYY.M.D-N`, verifier pascapublikasi
  juga memeriksa jalur upgrade temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  sehingga koreksi rilis tidak dapat diam-diam membiarkan instalasi global lama tetap pada
  payload stable dasar
- Prapemeriksaan rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  sehingga kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pascapublikasi juga memeriksa bahwa instalasi registry yang dipublikasikan
  berisi dependency runtime Plugin bundel yang tidak kosong di bawah layout root `dist/*`.
  Rilis yang dikirim dengan payload dependency Plugin bundel yang hilang atau kosong
  akan menggagalkan verifier postpublish dan tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga memberlakukan anggaran `unpackedSize` paket npm pada
  tarball update kandidat, sehingga e2e installer menangkap pembengkakan paket yang tidak disengaja
  sebelum jalur publikasi rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes timing ekstensi, atau
  matriks pengujian ekstensi, regenerasikan dan tinjau output matriks
  `plugin-prerelease-extension-shard` milik planner dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  menggambarkan layout CI yang usang
- Kesiapan rilis stable macOS juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang telah dipaketkan
  - `appcast.xml` di `main` harus menunjuk ke zip stable baru setelah publikasi
  - aplikasi yang dipaketkan harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas floor build Sparkle kanonis
    untuk versi rilis tersebut

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai semua pengujian pra-rilis dari
satu entrypoint. Jalankan dari ref workflow `main` tepercaya dan teruskan branch
rilis, tag, atau SHA commit lengkap sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow menyelesaikan ref target, men-dispatch `CI` manual dengan
`target_ref=<release-ref>`, men-dispatch `OpenClaw Release Checks`, dan
secara opsional men-dispatch E2E Telegram pascapublikasi standalone ketika
`npm_telegram_package_spec` disetel. `OpenClaw Release Checks` kemudian melakukan fan out
install smoke, pemeriksaan rilis lintas-OS, cakupan release-path Docker live/E2E,
Package Acceptance dengan QA paket Telegram, paritas QA Lab, Matrix live, dan
Telegram live. Run penuh hanya dapat diterima ketika ringkasan `Full Release Validation`
menampilkan `normal_ci` dan `release_checks` berhasil, dan setiap child
`npm_telegram` opsional berhasil atau sengaja dilewati. Ringkasan verifier akhir
menyertakan tabel job terlambat untuk setiap child run, sehingga manajer rilis
dapat melihat critical path saat ini tanpa mengunduh log.
Workflow child di-dispatch dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan ketika target `ref` menunjuk ke
branch atau tag rilis lama. Tidak ada input ref workflow Full Release Validation
terpisah; pilih harness tepercaya dengan memilih ref run workflow.

Gunakan `release_profile` untuk memilih keluasan live/provider:

- `minimum`: jalur OpenAI/core live dan Docker paling cepat yang kritis untuk rilis
- `stable`: minimum plus cakupan provider/backend stable untuk persetujuan rilis
- `full`: stable plus cakupan provider/media advisory yang luas

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref target
sekali sebagai `release-package-under-test` dan menggunakan ulang artefak tersebut dalam
pemeriksaan Docker release-path dan Package Acceptance. Ini menjaga semua kotak
yang menghadap paket pada byte yang sama dan menghindari build paket berulang.
Install smoke OpenAI lintas-OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika
variabel repo/org disetel, jika tidak `openai/gpt-5.4-mini`, karena lane ini
membuktikan instalasi paket, onboarding, startup Gateway, dan satu giliran agent live
alih-alih melakukan benchmark model default yang paling lambat. Matriks provider live
yang lebih luas tetap menjadi tempat untuk cakupan spesifik model.

Gunakan varian ini bergantung pada tahap rilis:

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Jangan gunakan payung penuh sebagai rerun pertama setelah perbaikan terfokus. Jika satu kotak
gagal, gunakan alur kerja anak, job, lane Docker, profil paket, penyedia model,
atau lane QA yang gagal untuk pembuktian berikutnya. Jalankan payung penuh lagi hanya ketika
perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua-kotak sebelumnya
kedaluwarsa. Pemverifikasi akhir payung memeriksa ulang id run alur kerja anak yang tercatat,
jadi setelah alur kerja anak berhasil dijalankan ulang, jalankan ulang hanya job induk
`Verify full validation` yang gagal.

Untuk pemulihan terbatas, teruskan `rerun_group` ke payung. `all` adalah run
kandidat rilis yang sebenarnya, `ci` hanya menjalankan anak CI normal, `plugin-prerelease`
hanya menjalankan anak plugin khusus rilis, `release-checks` menjalankan setiap kotak rilis,
dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram` ketika
lane Telegram paket mandiri disediakan.

### Vitest

Kotak Vitest adalah alur kerja anak `CI` manual. CI manual dengan sengaja
melewati cakupan perubahan dan memaksa grafik pengujian normal untuk kandidat rilis:
shard Node Linux, shard plugin bawaan, kontrak kanal, kompatibilitas Node 22,
`check`, `check-additional`, smoke build, pemeriksaan dokumentasi, Python
skills, Windows, macOS, Android, dan Control UI i18n.

Gunakan kotak ini untuk menjawab "apakah pohon sumber lulus suite pengujian normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- Ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dikirim
- run `CI` hijau pada SHA target persis
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artefak waktu Vitest seperti `.artifacts/vitest-shard-timings.json` ketika
  sebuah run membutuhkan analisis performa

Jalankan CI manual secara langsung hanya ketika rilis membutuhkan CI normal deterministik tetapi
bukan kotak Docker, QA Lab, live, lintas-OS, atau paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Kotak Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, ditambah alur kerja
`install-smoke` mode rilis. Kotak ini memvalidasi kandidat rilis melalui lingkungan
Docker terpaket, bukan hanya pengujian tingkat sumber.

Cakupan Docker rilis mencakup:

- smoke instal penuh dengan smoke instal global Bun yang lambat diaktifkan
- penyiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target, dengan job smoke QR,
  root/Gateway, dan installer/Bun berjalan sebagai shard install-smoke terpisah
- lane E2E repositori
- chunk Docker jalur rilis: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b`, dan
  `bundled-channels-contracts`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` saat diminta
- lane dependensi kanal bawaan yang dipisah di antara chunk channel-smoke, update-target,
  dan kontrak setup/runtime, bukan satu job kanal bawaan besar
- lane instal/uninstal plugin bawaan yang dipisah
  `bundled-plugin-install-uninstall-0` sampai
  `bundled-plugin-install-uninstall-23`
- suite penyedia live/E2E dan cakupan model live Docker ketika pemeriksaan rilis
  mencakup suite live

Gunakan artefak Docker sebelum menjalankan ulang. Penjadwal jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
waktu fase, JSON rencana penjadwal, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada alur kerja live/E2E reusable alih-alih
menjalankan ulang semua chunk rilis. Perintah rerun yang dihasilkan menyertakan
`package_artifact_run_id` sebelumnya dan input image Docker yang telah disiapkan jika tersedia, sehingga
lane yang gagal dapat menggunakan ulang tarball dan image GHCR yang sama.

### QA Lab

Kotak QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Ini adalah gerbang rilis
perilaku agentik dan tingkat kanal, terpisah dari mekanik paket Vitest dan Docker.

Cakupan QA Lab rilis mencakup:

- gerbang paritas mock yang membandingkan lane kandidat OpenAI dengan baseline Opus 4.6
  menggunakan paket paritas agentik
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial CI Convex
- `pnpm qa:otel:smoke` ketika telemetri rilis membutuhkan bukti lokal eksplisit

Gunakan kotak ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan
alur kanal live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram
saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai run QA-Lab manual
bershard, bukan lane kritis-rilis default.

### Paket

Kotak Paket adalah gerbang produk yang dapat diinstal. Kotak ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan kandidat
menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, serta menjaga ref harness
alur kerja tetap terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang persis
- `source=ref`: kemas cabang, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS dengan `package_sha256` yang wajib
- `source=artifact`: gunakan ulang `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline`, dan
`telegram_mode=mock-openai`. Chunk Docker jalur rilis mencakup lane instal,
update, dan plugin-update yang tumpang tindih; Package Acceptance mempertahankan
kompatibilitas kanal bawaan native-artefak, fixture plugin offline, dan QA paket
Telegram terhadap tarball terselesaikan yang sama. Ini adalah pengganti native GitHub
untuk sebagian besar cakupan paket/update yang sebelumnya membutuhkan Parallels.
Pemeriksaan rilis lintas-OS tetap penting untuk onboarding, installer, dan perilaku
platform khusus OS, tetapi validasi produk paket/update sebaiknya mengutamakan
Package Acceptance.

Kelonggaran package-acceptance lama sengaja dibatasi waktu. Paket hingga
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk kekurangan metadata yang sudah diterbitkan
ke npm: entri inventaris QA privat yang hilang dari tarball, `gateway install --wrapper`
yang hilang, file patch yang hilang dalam fixture git turunan tarball, `update.channel`
persisten yang hilang, lokasi record instal plugin lama, persistensi record instal
marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`.
Paket `2026.4.26` yang diterbitkan dapat memperingatkan untuk file stamp metadata build lokal
yang sudah dikirim. Paket setelahnya harus memenuhi kontrak paket modern; kekurangan yang sama
akan menggagalkan validasi rilis.

Gunakan profil Package Acceptance yang lebih luas ketika pertanyaan rilis berkaitan dengan
paket nyata yang dapat diinstal:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Profil paket umum:

- `smoke`: lane cepat instal paket/kanal/agen, jaringan Gateway, dan muat ulang konfigurasi
- `package`: kontrak paket instal/update/plugin tanpa ClawHub live; ini adalah default
  release-check
- `product`: `package` ditambah kanal MCP, pembersihan cron/subagent, pencarian web OpenAI,
  dan OpenWebUI
- `full`: chunk jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk rerun terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Package Acceptance. Alur kerja meneruskan tarball
`package-under-test` yang sudah diselesaikan ke lane Telegram; alur kerja Telegram mandiri
tetap menerima spec npm yang diterbitkan untuk pemeriksaan pascapenerbitan.

## Input alur kerja NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga boleh berupa SHA commit
  cabang alur kerja 40 karakter penuh saat ini untuk preflight khusus validasi
- `preflight_only`: `true` untuk validasi/build/paket saja, `false` untuk
  jalur publish nyata
- `preflight_run_id`: wajib pada jalur publish nyata agar alur kerja menggunakan ulang
  tarball yang disiapkan dari run preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publish; default-nya `beta`

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: cabang, tag, atau SHA commit penuh yang akan divalidasi. Pemeriksaan yang membawa secret
  mengharuskan commit yang diselesaikan dapat dijangkau dari cabang OpenClaw atau
  tag rilis.

Aturan:

- Tag stabil dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prarilis beta hanya boleh dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit penuh hanya diizinkan ketika
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu
  khusus validasi
- Jalur publish nyata harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama preflight;
  alur kerja memverifikasi bahwa metadata tersebut tetap berlanjut sebelum publish

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda boleh menggunakan SHA commit cabang alur kerja penuh saat ini
     untuk dry run khusus validasi dari alur kerja preflight
2. Pilih `npm_dist_tag=beta` untuk alur normal beta-dulu, atau `latest` hanya
   ketika Anda secara sengaja menginginkan publish stabil langsung
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau SHA commit penuh
   ketika Anda menginginkan CI normal ditambah cakupan cache prompt live, Docker, QA Lab,
   Matrix, dan Telegram dari satu alur kerja manual
4. Jika Anda secara sengaja hanya membutuhkan grafik pengujian normal deterministik, jalankan
   alur kerja `CI` manual pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw NPM Release` lagi dengan `preflight_only=false`, `tag` yang sama,
   `npm_dist_tag` yang sama, dan `preflight_run_id` yang disimpan
7. Jika rilis mendarat di `beta`, gunakan alur kerja privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stabil yang sama, gunakan alur kerja privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi self-healing
   terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
membutuhkan `NPM_TOKEN`, sementara repo publik mempertahankan publish khusus OIDC.

Itu membuat jalur publish langsung dan jalur promosi beta-dulu sama-sama
terdokumentasi dan terlihat oleh operator.

Jika seorang pemelihara harus kembali menggunakan autentikasi npm lokal, jalankan perintah
CLI (`op`) 1Password apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op`
langsung dari shell agen utama; menjaganya tetap di dalam tmux membuat prompt,
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

Pemelihara menggunakan dokumen rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
untuk panduan eksekusi yang sebenarnya.

## Terkait

- [Kanal rilis](/id/install/development-channels)
