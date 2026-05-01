---
read_when:
    - Mencari definisi kanal rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan dan ritme versi
summary: Jalur rilis, daftar periksa operator, box validasi, penamaan versi, dan kadensi
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-01T09:27:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertanda yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` saat diminta secara eksplisit
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: head `main` yang terus bergerak

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
- Rilis stabil dan rilis koreksi stabil dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang sudah diperiksa nanti
- Setiap rilis stabil OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/tanda tangan/notarisasi aplikasi mac disisihkan untuk stabil kecuali diminta secara eksplisit

## Irama rilis

- Rilis bergerak dengan beta lebih dulu
- Stabil menyusul hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari cabang `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta telah di-push atau dipublikasikan dan memerlukan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Checklist operator rilis

Checklist ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: pull terbaru, konfirmasi commit target sudah di-push,
   dan konfirmasi CI `main` saat ini cukup hijau untuk dibuat cabang darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, pertahankan entri tetap berorientasi pengguna, commit, push, dan rebase/pull
   sekali lagi sebelum membuat cabang.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas
   yang kedaluwarsa hanya ketika jalur peningkatan tetap tercakup, atau catat mengapa kompatibilitas itu
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
   cabang rilis, tag, atau SHA commit lengkap. Ini adalah satu titik masuk manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di cabang rilis dan jalankan ulang file,
   jalur, job workflow, profil paket, penyedia, atau allowlist model terkecil yang gagal
   yang membuktikan perbaikan. Jalankan ulang payung penuh hanya ketika permukaan yang berubah membuat
   bukti sebelumnya kedaluwarsa.
9. Untuk beta, tag `vYYYY.M.D-beta.N`, publikasikan dengan dist-tag npm `beta`, lalu jalankan
   penerimaan paket pascapublikasi terhadap paket `openclaw@YYYY.M.D-beta.N`
   atau `openclaw@beta` yang dipublikasikan. Jika beta yang sudah di-push atau dipublikasikan memerlukan perbaikan, buat
   `-beta.N` berikutnya; jangan hapus atau tulis ulang beta lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang sudah diperiksa memiliki
    bukti validasi yang diperlukan. Publikasi npm stabil menggunakan kembali
    artefak preflight yang berhasil melalui `preflight_run_id`; kesiapan rilis macOS stabil
    juga memerlukan `.zip`, `.dmg`, `.dSYM.zip` yang sudah dipaketkan, dan
    `appcast.xml` yang diperbarui di `main`.
11. Setelah publikasi, jalankan verifier pascapublikasi npm, E2E Telegram
    npm terpublikasi mandiri opsional saat Anda memerlukan bukti kanal pascapublikasi,
    promosi dist-tag bila diperlukan, catatan rilis/prarilis GitHub dari
    bagian `CHANGELOG.md` lengkap yang cocok, dan langkah-langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum pemeriksaan pra-rilis agar TypeScript pengujian tetap
  tercakup di luar gerbang `pnpm check` lokal yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum pemeriksaan pra-rilis agar pemeriksaan siklus
  impor dan batas arsitektur yang lebih luas hijau di luar gerbang lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis
  `dist/*` yang diharapkan dan bundel Control UI tersedia untuk langkah validasi
  paket
- Jalankan alur kerja manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua kotak uji pra-rilis dari satu titik masuk. Alur kerja ini menerima cabang,
  tag, atau SHA commit lengkap, menjalankan `CI` manual, dan menjalankan
  `OpenClaw Release Checks` untuk asap instalasi, penerimaan paket, rangkaian
  jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan jalur Telegram.
  Berikan `npm_telegram_package_spec` hanya setelah paket diterbitkan dan E2E Telegram
  pasca-terbit juga harus berjalan. Berikan `evidence_package_spec` saat laporan bukti privat
  harus membuktikan bahwa validasi cocok dengan paket npm yang diterbitkan tanpa memaksa E2E Telegram.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan alur kerja manual `Package Acceptance` saat Anda menginginkan bukti jalur samping
  untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@beta`, `openclaw@latest`, atau versi rilis persis; `source=ref`
  untuk mengemas cabang/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256
  wajib; atau `source=artifact` untuk tarball yang diunggah oleh proses GitHub
  Actions lain. Alur kerja menyelesaikan kandidat menjadi
  `package-under-test`, menggunakan ulang penjadwal rilis Docker E2E terhadap
  tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Saat jalur Docker
  yang dipilih menyertakan `published-upgrade-survivor`, artefak paket adalah kandidat
  dan `published_upgrade_survivor_baseline` memilih baseline yang diterbitkan.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: jalur instalasi/channel/agent, jaringan Gateway, dan muat ulang konfigurasi
  - `package`: jalur paket/update/plugin berbasis artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket ditambah channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: potongan jalur rilis Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` persis untuk pengulangan terfokus
- Jalankan alur kerja manual `CI` secara langsung saat Anda hanya membutuhkan cakupan CI
  normal penuh untuk kandidat rilis. Eksekusi CI manual melewati pelingkupan perubahan
  dan memaksa shard Node Linux, shard bundled-plugin, kontrak channel,
  kompatibilitas Node 22, `check`, `check-additional`, asap build,
  pemeriksaan docs, Skills Python, Windows, macOS, Android, dan jalur i18n Control UI.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` saat memvalidasi telemetri rilis. Perintah ini melatih
  QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi nama span trace
  yang diekspor, atribut berbatas, serta redaksi konten/pengenal tanpa
  membutuhkan Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Pemeriksaan rilis sekarang berjalan dalam alur kerja manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan gerbang paritas mock QA Lab plus profil Matrix
  live cepat dan jalur QA Telegram sebelum persetujuan rilis. Jalur live
  menggunakan lingkungan `qa-live-shared`; Telegram juga menggunakan sewa kredensial CI
  Convex. Jalankan alur kerja manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` saat Anda menginginkan inventaris transport
  Matrix, media, dan E2EE penuh secara paralel.
- Validasi runtime instalasi dan peningkatan lintas-OS adalah bagian dari
  `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil
  alur kerja yang dapat digunakan ulang
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada
  di jalurnya sendiri agar tidak menahan atau memblokir penerbitan
- Pemeriksaan rilis yang membawa rahasia harus dijalankan melalui `Full Release
Validation` atau dari ref alur kerja `main`/rilis agar logika alur kerja dan
  rahasia tetap terkendali
- `OpenClaw Release Checks` menerima cabang, tag, atau SHA commit lengkap selama
  commit yang diselesaikan dapat dijangkau dari cabang OpenClaw atau tag rilis
- Pemeriksaan awal validasi-saja `OpenClaw NPM Release` juga menerima SHA commit
  cabang alur kerja 40 karakter penuh saat ini tanpa mewajibkan tag yang sudah di-push
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi penerbitan nyata
- Dalam mode SHA, alur kerja menyintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; penerbitan nyata tetap membutuhkan tag rilis nyata
- Kedua alur kerja menjaga jalur penerbitan dan promosi nyata di runner yang di-host GitHub,
  sementara jalur validasi non-mutasi dapat menggunakan runner Linux Blacksmith
  yang lebih besar
- Alur kerja tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan rahasia alur kerja `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Pemeriksaan pra-rilis npm tidak lagi menunggu jalur pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang cocok) sebelum persetujuan
- Setelah penerbitan npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang cocok) untuk memverifikasi jalur instalasi registry
  yang diterbitkan dalam prefiks sementara baru
- Setelah penerbitan beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan E2E Telegram nyata
  terhadap paket npm yang diterbitkan menggunakan kumpulan kredensial Telegram bersama
  yang disewa. Percobaan satu kali maintainer lokal dapat menghilangkan var Convex dan meneruskan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Maintainer dapat menjalankan pemeriksaan pasca-terbit yang sama dari GitHub Actions melalui alur kerja
  manual `NPM Telegram Beta E2E`. Alur kerja ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan preflight-lalu-promosi:
  - penerbitan npm nyata harus melewati `preflight_run_id` npm yang berhasil
  - penerbitan npm nyata harus dijalankan dari cabang `main` atau
    `release/YYYY.M.D` yang sama dengan proses preflight yang berhasil
  - rilis npm stabil default ke `beta`
  - penerbitan npm stabil dapat menargetkan `latest` secara eksplisit melalui input alur kerja
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    demi keamanan, karena `npm dist-tag add` masih membutuhkan `NPM_TOKEN` sementara repo
    publik mempertahankan penerbitan hanya OIDC
  - `macOS Release` publik hanya validasi; saat tag hanya berada di cabang
    rilis tetapi alur kerja dijalankan dari `main`, tetapkan
    `public_release_branch=release/YYYY.M.D`
  - penerbitan mac privat nyata harus melewati `preflight_run_id` dan `validate_run_id`
    mac privat yang berhasil
  - jalur penerbitan nyata mempromosikan artefak yang disiapkan alih-alih membangunnya
    ulang
- Untuk rilis koreksi stabil seperti `YYYY.M.D-N`, pemverifikasi pasca-terbit
  juga memeriksa jalur peningkatan prefiks sementara yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  agar koreksi rilis tidak dapat diam-diam meninggalkan instalasi global lama pada
  payload stabil dasar
- Pemeriksaan pra-rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak mengirim dasbor browser kosong lagi
- Verifikasi pasca-terbit juga memeriksa bahwa instalasi registry yang diterbitkan
  berisi dependensi runtime bundled plugin yang tidak kosong di bawah tata letak root `dist/*`.
  Rilis yang dikirim dengan payload dependensi bundled plugin yang hilang atau kosong
  menggagalkan pemverifikasi pasca-terbit dan tidak dapat dipromosikan
  ke `latest`.
- `pnpm test:install:smoke` juga memberlakukan anggaran `unpackedSize` paket npm pada
  tarball pembaruan kandidat, sehingga installer e2e menangkap pembengkakan paket yang tidak sengaja
  sebelum jalur penerbitan rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes waktu extension, atau
  matriks pengujian extension, regenerasi dan tinjau keluaran matriks
  `plugin-prerelease-extension-shard` milik perencana dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  menggambarkan tata letak CI yang usang
- Kesiapan rilis macOS stabil juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang dipaketkan
  - `appcast.xml` pada `main` harus menunjuk ke zip stabil baru setelah penerbitan
  - app yang dipaketkan harus mempertahankan id bundel non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas batas bawah build Sparkle kanonis
    untuk versi rilis tersebut

## Kotak uji rilis

`Full Release Validation` adalah cara operator memulai semua pengujian pra-rilis dari
satu titik masuk. Jalankan dari ref alur kerja `main` tepercaya dan teruskan cabang
rilis, tag, atau SHA commit lengkap sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Alur kerja menyelesaikan ref target, menjalankan `CI` manual dengan
`target_ref=<release-ref>`, menjalankan `OpenClaw Release Checks`, dan
secara opsional menjalankan E2E Telegram pasca-terbit mandiri saat
`npm_telegram_package_spec` ditetapkan. `OpenClaw Release Checks` kemudian menyebar
ke asap instalasi, pemeriksaan rilis lintas-OS, cakupan jalur rilis Docker live/E2E,
Package Acceptance dengan QA paket Telegram, paritas QA Lab, Matrix live, dan
Telegram live. Proses penuh hanya dapat diterima saat ringkasan `Full Release Validation`
menunjukkan `normal_ci` dan `release_checks` berhasil, dan setiap turunan opsional
`npm_telegram` berhasil atau sengaja dilewati. Ringkasan pemverifikasi akhir
menyertakan tabel pekerjaan paling lambat untuk setiap proses turunan, sehingga manajer rilis
dapat melihat jalur kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap lengkap, nama pekerjaan alur kerja persis, perbedaan profil stabil versus penuh,
artefak, dan pegangan pengulangan terfokus.
Alur kerja turunan dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan saat `ref` target menunjuk ke
cabang atau tag rilis yang lebih lama. Tidak ada input ref alur kerja Full Release Validation
terpisah; pilih harness tepercaya dengan memilih ref proses alur kerja.

Gunakan `release_profile` untuk memilih cakupan live/provider:

- `minimum`: jalur Docker dan live OpenAI/core paling cepat yang kritis untuk rilis
- `stable`: minimum ditambah cakupan provider/backend stabil untuk persetujuan rilis
- `full`: stable ditambah cakupan provider/media advisory yang luas

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk menyelesaikan ref target sekali sebagai `release-package-under-test` dan menggunakan ulang artefak tersebut dalam pemeriksaan Docker jalur-rilis dan Package Acceptance. Ini menjaga semua box yang menghadap paket pada byte yang sama dan menghindari build paket berulang. Smoke instalasi OpenAI lintas-OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat variabel repo/org disetel, jika tidak `openai/gpt-5.4-mini`, karena lane ini membuktikan instalasi paket, onboarding, startup gateway, dan satu giliran agen live, bukan membenchmark model default paling lambat. Matriks provider live yang lebih luas tetap menjadi tempat untuk cakupan khusus model.

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Jangan gunakan umbrella penuh sebagai rerun pertama setelah perbaikan terfokus. Jika satu box gagal, gunakan alur kerja anak, job, lane Docker, profil paket, provider model, atau lane QA yang gagal untuk pembuktian berikutnya. Jalankan umbrella penuh lagi hanya ketika perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua-box sebelumnya usang. Pemverifikasi akhir umbrella memeriksa ulang id run alur kerja anak yang direkam, jadi setelah alur kerja anak berhasil dijalankan ulang, rerun hanya job induk `Verify full validation` yang gagal.

Untuk pemulihan terbatas, teruskan `rerun_group` ke umbrella. `all` adalah run kandidat rilis yang sebenarnya, `ci` hanya menjalankan anak CI normal, `plugin-prerelease` hanya menjalankan anak plugin khusus rilis, `release-checks` menjalankan setiap box rilis, dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram` ketika lane Telegram paket mandiri disediakan.

### Vitest

Box Vitest adalah alur kerja anak `CI` manual. CI manual sengaja melewati cakupan perubahan dan memaksa grafik pengujian normal untuk kandidat rilis: shard Linux Node, shard plugin bawaan, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build, pemeriksaan docs, Python skills, Windows, macOS, Android, dan i18n Control UI.

Gunakan box ini untuk menjawab "apakah pohon sumber lulus suite pengujian normal penuh?" Ini tidak sama dengan validasi produk jalur-rilis. Bukti yang perlu disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dikirim
- run `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artefak timing Vitest seperti `.artifacts/vitest-shard-timings.json` saat run memerlukan analisis performa

Jalankan CI manual secara langsung hanya ketika rilis memerlukan CI normal yang deterministik tetapi tidak memerlukan box Docker, QA Lab, live, lintas-OS, atau paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker berada di `OpenClaw Release Checks` melalui `openclaw-live-and-e2e-checks-reusable.yml`, ditambah alur kerja `install-smoke` mode rilis. Ini memvalidasi kandidat rilis melalui lingkungan Docker terpaket, bukan hanya pengujian tingkat sumber.

Cakupan Docker rilis mencakup:

- smoke instalasi penuh dengan smoke instalasi global Bun lambat diaktifkan
- persiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target, dengan job smoke QR, root/gateway, dan installer/Bun berjalan sebagai shard install-smoke terpisah
- lane E2E repositori
- chunk Docker jalur-rilis: `core`, `package-update-openai`,
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
- lane dependensi bundled-channel yang dipisah di channel-smoke, update-target, dan chunk kontrak setup/runtime, bukan satu job bundled-channel besar
- lane install/uninstall plugin bawaan yang dipisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker saat pemeriksaan rilis menyertakan suite live

Gunakan artefak Docker sebelum rerun. Penjadwal jalur-rilis mengunggah `.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`, timing fase, JSON rencana penjadwal, dan perintah rerun. Untuk pemulihan terfokus, gunakan `docker_lanes=<lane[,lane]>` pada alur kerja live/E2E reusable alih-alih rerun semua chunk rilis. Perintah rerun yang dihasilkan menyertakan `package_artifact_run_id` sebelumnya dan input image Docker yang sudah disiapkan bila tersedia, sehingga lane yang gagal dapat menggunakan ulang tarball dan image GHCR yang sama.

### QA Lab

Box QA Lab juga bagian dari `OpenClaw Release Checks`. Ini adalah gerbang rilis perilaku agentic dan tingkat channel, terpisah dari mekanika paket Vitest dan Docker.

Cakupan QA Lab rilis mencakup:

- gerbang paritas mock yang membandingkan lane kandidat OpenAI dengan baseline Opus 4.6 menggunakan paket paritas agentic
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial Convex CI
- `pnpm qa:otel:smoke` saat telemetri rilis memerlukan bukti lokal eksplisit

Gunakan box ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai run QA-Lab sharded manual, bukan lane kritis-rilis default.

### Paket

Box Paket adalah gerbang produk yang dapat diinstal. Ini didukung oleh `Package Acceptance` dan resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan kandidat menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi inventaris paket, merekam versi paket dan SHA-256, serta menjaga ref harness alur kerja tetap terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat
- `source=ref`: kemas branch, tag, atau SHA commit penuh `package_ref` tepercaya dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS dengan `package_sha256` wajib
- `source=artifact`: gunakan ulang `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline`, dan `telegram_mode=mock-openai`. Chunk Docker jalur-rilis mencakup lane instalasi, update, dan plugin-update yang tumpang tindih; Package Acceptance mempertahankan kompatibilitas bundled-channel native-artefak, fixture plugin offline, dan QA paket Telegram terhadap tarball terselesaikan yang sama. Ini adalah pengganti native GitHub untuk sebagian besar cakupan paket/update yang sebelumnya memerlukan Parallels. Pemeriksaan rilis lintas-OS masih penting untuk onboarding, installer, dan perilaku platform khusus OS, tetapi validasi produk paket/update sebaiknya mengutamakan Package Acceptance.

Kelonggaran package-acceptance legacy sengaja dibatasi waktu. Paket hingga `2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang sudah diterbitkan ke npm: entri inventaris QA privat yang hilang dari tarball, `gateway install --wrapper` yang hilang, file patch yang hilang di fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi catatan instal plugin legacy, persistensi catatan instal marketplace yang hilang, dan migrasi metadata config selama `plugins update`. Paket `2026.4.26` yang diterbitkan dapat memberi peringatan untuk file stamp metadata build lokal yang sudah dikirimkan. Paket setelahnya harus memenuhi kontrak paket modern; celah yang sama akan menggagalkan validasi rilis.

Gunakan profil Package Acceptance yang lebih luas ketika pertanyaan rilis berkaitan dengan paket yang benar-benar dapat diinstal:

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

- `smoke`: lane instalasi paket/channel/agen cepat, jaringan gateway, dan reload config
- `package`: kontrak paket instal/update/plugin tanpa ClawHub live; ini adalah default release-check
- `product`: `package` ditambah channel MCP, pembersihan cron/subagent, pencarian web OpenAI, dan OpenWebUI
- `full`: chunk jalur-rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` yang tepat untuk rerun terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier` pada Package Acceptance. Alur kerja meneruskan tarball `package-under-test` yang terselesaikan ke lane Telegram; alur kerja Telegram mandiri tetap menerima spec npm yang diterbitkan untuk pemeriksaan pascapublikasi.

## Input alur kerja NPM

`OpenClaw NPM Release` menerima input yang dikontrol operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; saat `preflight_only=true`, ini juga dapat berupa SHA commit branch alur kerja penuh 40 karakter saat ini untuk preflight khusus validasi
- `preflight_only`: `true` untuk validasi/build/paket saja, `false` untuk jalur publikasi nyata
- `preflight_run_id`: wajib pada jalur publikasi nyata agar alur kerja menggunakan ulang tarball yang disiapkan dari run preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publikasi; default ke `beta`

`OpenClaw Release Checks` menerima input yang dikontrol operator berikut:

- `ref`: branch, tag, atau SHA commit penuh untuk divalidasi. Pemeriksaan yang membawa secret mengharuskan commit yang terselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis.

Aturan:

- Tag stabil dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prerelease beta hanya dapat dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit penuh hanya diizinkan ketika `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya untuk validasi
- Jalur publikasi nyata harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama preflight; alur kerja memverifikasi metadata tersebut sebelum publikasi berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit lengkap cabang alur kerja saat ini
     untuk dry run khusus validasi dari alur kerja pra-pemeriksaan
2. Pilih `npm_dist_tag=beta` untuk alur normal beta-terlebih-dahulu, atau `latest` hanya
   ketika Anda sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau SHA
   commit lengkap ketika Anda menginginkan CI normal plus cakupan cache prompt langsung,
   Docker, QA Lab, Matrix, dan Telegram dari satu alur kerja manual
4. Jika Anda sengaja hanya memerlukan grafik pengujian normal yang deterministik, jalankan
   alur kerja manual `CI` pada referensi rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw NPM Release` lagi dengan `preflight_only=false`, `tag` yang sama,
   `npm_dist_tag` yang sama, dan `preflight_run_id` yang disimpan
7. Jika rilis mendarat di `beta`, gunakan alur kerja privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stabil yang sama, gunakan alur kerja privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi
   pemulihan mandiri terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan publikasi khusus OIDC.

Itu membuat jalur publikasi langsung dan jalur promosi beta-terlebih-dahulu
sama-sama terdokumentasi dan terlihat oleh operator.

Jika maintainer harus kembali ke autentikasi npm lokal, jalankan perintah CLI
1Password (`op`) hanya di dalam sesi tmux khusus. Jangan panggil `op`
langsung dari shell agen utama; menyimpannya di dalam tmux membuat prompt,
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

Maintainer menggunakan dokumentasi rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
untuk runbook sebenarnya.

## Terkait

- [Kanal rilis](/id/install/development-channels)
