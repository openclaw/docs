---
read_when:
    - Mencari definisi saluran rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan kadensi
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan irama rilis
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-02T09:31:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce52c9144de3c8b914954db64f6ca5b2196edbbdcc7385984235a39c208bb59e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang diterbitkan ke npm `beta` secara default, atau ke npm `latest` ketika diminta secara eksplisit
- beta: tag prarilis yang diterbitkan ke npm `beta`
- dev: posisi head yang bergerak dari `main`

## Penamaan versi

- Versi rilis stabil: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stabil: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prarilis beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan tambahkan nol di depan bulan atau hari
- `latest` berarti rilis npm stabil yang sedang dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stabil dan rilis koreksi stabil diterbitkan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah diverifikasi nanti
- Setiap rilis stabil OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan menerbitkan jalur npm/paket terlebih dahulu, dengan
  build/sign/notarize aplikasi mac dicadangkan untuk stabil kecuali diminta secara eksplisit

## Kadensi rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stabil menyusul hanya setelah beta terbaru divalidasi
- Pemelihara biasanya membuat rilis dari cabang `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta telah di-push atau diterbitkan dan perlu perbaikan, pemelihara membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan bersifat
  khusus pemelihara

## Daftar periksa operator rilis

Daftar periksa ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus pemelihara.

1. Mulai dari `main` saat ini: pull terbaru, konfirmasi commit target sudah di-push,
   dan konfirmasi CI `main` saat ini cukup hijau untuk membuat cabang darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, jaga entri tetap berorientasi pengguna, commit, push, lalu rebase/pull
   sekali lagi sebelum membuat cabang.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas yang kedaluwarsa
   hanya ketika jalur peningkatan tetap tercakup, atau catat mengapa kompatibilitas tersebut
   sengaja dipertahankan.
4. Buat `release/YYYY.M.D` dari `main` saat ini; jangan lakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dimaksud, jalankan
   `pnpm plugins:sync` agar paket Plugin yang dapat diterbitkan berbagi versi rilis
   dan metadata kompatibilitas, lalu jalankan preflight deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, dan
   `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA cabang rilis lengkap 40 karakter diizinkan untuk preflight khusus validasi.
   Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk
   cabang rilis, tag, atau SHA commit lengkap. Ini adalah satu titik masuk manual
   untuk empat kotak uji rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di cabang rilis dan jalankan ulang file, lane,
   job workflow, profil paket, penyedia, atau allowlist model terkecil yang gagal dan
   membuktikan perbaikan. Jalankan ulang umbrella penuh hanya ketika permukaan yang berubah membuat
   bukti sebelumnya kedaluwarsa.
9. Untuk beta, tag `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   cabang `release/YYYY.M.D` yang cocok. Proses ini memverifikasi `pnpm plugins:sync:check`,
   menerbitkan semua paket Plugin yang dapat diterbitkan ke npm terlebih dahulu, menerbitkan set yang sama
   ke ClawHub kedua, lalu mempromosikan artefak preflight npm OpenClaw yang disiapkan
   dengan dist-tag `beta`. Setelah penerbitan, jalankan penerimaan paket pasca-penerbitan
   terhadap paket `openclaw@YYYY.M.D-beta.N` atau `openclaw@beta` yang diterbitkan.
   Jika beta yang sudah di-push atau diterbitkan perlu perbaikan, buat `-beta.N` berikutnya;
   jangan hapus atau tulis ulang beta lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang telah diverifikasi memiliki
    bukti validasi yang diperlukan. Penerbitan npm stabil juga melalui
    `OpenClaw Release Publish`, menggunakan kembali artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stabil juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang sudah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
11. Setelah penerbitan, jalankan verifier pasca-penerbitan npm, E2E Telegram
    published-npm standalone opsional ketika Anda memerlukan bukti channel pasca-penerbitan,
    promosi dist-tag bila diperlukan, catatan rilis/prarilis GitHub dari
    bagian `CHANGELOG.md` lengkap yang cocok, dan langkah-langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum pemeriksaan awal rilis agar TypeScript pengujian tetap
  tercakup di luar gerbang lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum pemeriksaan awal rilis agar pemeriksaan siklus
  impor dan batas arsitektur yang lebih luas lulus di luar gerbang lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis
  `dist/*` yang diharapkan dan bundel Control UI tersedia untuk langkah validasi
  paket
- Jalankan `pnpm plugins:sync` setelah kenaikan versi root dan sebelum penandaan. Perintah ini
  memperbarui versi paket plugin yang dapat diterbitkan, metadata kompatibilitas peer/API
  OpenClaw, metadata build, dan stub changelog plugin agar sesuai dengan versi rilis
  inti. `pnpm plugins:sync:check` adalah penjaga rilis yang tidak mengubah apa pun;
  alur kerja penerbitan gagal sebelum mutasi registry apa pun jika langkah ini
  terlupakan.
- Jalankan alur kerja manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua kotak uji pra-rilis dari satu titik masuk. Alur ini menerima branch,
  tag, atau SHA commit lengkap, menjalankan manual `CI`, dan menjalankan
  `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, rangkaian
  jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram.
  Dengan `release_profile=full` dan `rerun_group=all`, alur ini juga menjalankan paket
  Telegram E2E terhadap artefak `release-package-under-test` dari pemeriksaan rilis.
  Berikan `npm_telegram_package_spec` setelah penerbitan ketika Telegram E2E yang sama
  juga harus membuktikan paket npm yang diterbitkan. Berikan
  `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa
  validasi cocok dengan paket npm yang diterbitkan tanpa memaksa Telegram E2E.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan alur kerja manual `Package Acceptance` ketika Anda menginginkan bukti
  jalur samping untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan
  `source=npm` untuk `openclaw@beta`, `openclaw@latest`, atau versi rilis persis;
  `source=ref` untuk mengemas branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256 wajib;
  atau `source=artifact` untuk tarball yang diunggah oleh run GitHub Actions lain.
  Alur kerja menyelesaikan kandidat menjadi `package-under-test`, menggunakan ulang
  penjadwal rilis Docker E2E terhadap tarball tersebut, dan dapat menjalankan QA
  Telegram terhadap tarball yang sama dengan `telegram_mode=mock-openai` atau
  `telegram_mode=live-frontier`. Ketika lane Docker yang dipilih menyertakan
  `published-upgrade-survivor`, artefak paket adalah kandidat dan
  `published_upgrade_survivor_baseline` memilih baseline yang diterbitkan.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane instalasi/channel/agent, jaringan gateway, dan muat ulang konfigurasi
  - `package`: lane paket/pembaruan/plugin berbasis artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket ditambah channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: potongan jalur rilis Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` persis untuk run ulang yang terfokus
- Jalankan alur kerja manual `CI` secara langsung ketika Anda hanya membutuhkan
  cakupan CI normal penuh untuk kandidat rilis. Dispatch CI manual melewati
  penskupan perubahan dan memaksa shard Linux Node, shard plugin bundel, kontrak
  channel, kompatibilitas Node 22, `check`, `check-additional`, smoke build,
  pemeriksaan docs, Python skills, Windows, macOS, Android, dan lane Control UI i18n.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` ketika memvalidasi telemetri rilis. Ini menjalankan
  QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi nama span trace yang
  diekspor, atribut berbatas, serta redaksi konten/pengidentifikasi tanpa
  memerlukan Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk urutan penerbitan yang mengubah status setelah
  tag tersedia. Dispatch dari `release/YYYY.M.D` (atau `main` ketika menerbitkan tag
  yang dapat dijangkau dari main), berikan tag rilis dan `preflight_run_id` npm
  OpenClaw yang berhasil, dan pertahankan cakupan penerbitan plugin default
  `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Alur kerja
  menserialkan penerbitan npm plugin, penerbitan ClawHub plugin, dan penerbitan npm
  OpenClaw sehingga paket inti tidak diterbitkan sebelum plugin yang dieksternalisasi.
- Pemeriksaan rilis sekarang berjalan dalam alur kerja manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan gerbang paritas mock QA Lab ditambah profil
  Matrix live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live
  menggunakan lingkungan `qa-live-shared`; Telegram juga menggunakan sewa kredensial
  CI Convex. Jalankan alur kerja manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris
  transport Matrix, media, dan E2EE penuh secara paralel.
- Validasi runtime instalasi dan peningkatan lintas-OS adalah bagian dari
  `OpenClaw Release Checks` publik dan `Full Release Validation`, yang memanggil
  alur kerja yang dapat digunakan ulang
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat
  tetap berada di lane tersendiri agar tidak menahan atau memblokir penerbitan
- Pemeriksaan rilis yang membawa rahasia harus dijalankan melalui `Full Release
Validation` atau dari ref alur kerja `main`/rilis agar logika alur kerja dan
  rahasia tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama
  commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Pemeriksaan awal khusus validasi `OpenClaw NPM Release` juga menerima SHA commit
  branch alur kerja 40 karakter penuh saat ini tanpa memerlukan tag yang telah didorong
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi
  penerbitan nyata
- Dalam mode SHA, alur kerja mensintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; penerbitan nyata tetap memerlukan tag rilis nyata
- Kedua alur kerja menjaga jalur penerbitan dan promosi nyata pada runner
  GitHub-hosted, sementara jalur validasi yang tidak mengubah status dapat menggunakan
  runner Linux Blacksmith yang lebih besar
- Alur kerja tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan kedua secret alur kerja `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Pemeriksaan awal rilis npm tidak lagi menunggu lane pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah npm publish, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi registry
  yang diterbitkan dalam prefix temp baru
- Setelah penerbitan beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan Telegram E2E
  nyata terhadap paket npm yang diterbitkan menggunakan kumpulan kredensial Telegram
  sewaan bersama. One-off maintainer lokal dapat menghilangkan var Convex dan
  meneruskan tiga kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Maintainer dapat menjalankan pemeriksaan pascapenerbitan yang sama dari GitHub Actions melalui
  alur kerja manual `NPM Telegram Beta E2E`. Alur ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan pemeriksaan awal lalu promosi:
  - penerbitan npm nyata harus melewati `preflight_run_id` npm yang berhasil
  - penerbitan npm nyata harus dijalankan dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run pemeriksaan awal yang berhasil
  - rilis npm stabil secara default ke `beta`
  - penerbitan npm stabil dapat menargetkan `latest` secara eksplisit melalui input alur kerja
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    demi keamanan, karena `npm dist-tag add` masih membutuhkan `NPM_TOKEN` sementara
    repo publik mempertahankan penerbitan hanya OIDC
  - `macOS Release` publik hanya untuk validasi; ketika tag hanya ada di
    branch rilis tetapi alur kerja dijalankan dari `main`, setel
    `public_release_branch=release/YYYY.M.D`
  - penerbitan mac privat nyata harus melewati
    `preflight_run_id` dan `validate_run_id` mac privat yang berhasil
  - jalur penerbitan nyata mempromosikan artefak yang sudah disiapkan alih-alih membangunnya
    lagi
- Untuk rilis koreksi stabil seperti `YYYY.M.D-N`, pemverifikasi pascapenerbitan
  juga memeriksa jalur peningkatan prefix temp yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  sehingga koreksi rilis tidak dapat diam-diam meninggalkan instalasi global lama pada
  payload stabil dasar
- Pemeriksaan awal rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pascapenerbitan juga memeriksa bahwa entrypoint plugin yang diterbitkan dan
  metadata paket tersedia dalam layout registry yang terinstal. Rilis yang
  mengirim payload runtime plugin yang hilang akan menggagalkan pemverifikasi
  pascapenerbitan dan tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball pembaruan kandidat, sehingga e2e installer menangkap pembengkakan paket
  tidak disengaja sebelum jalur penerbitan rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes timing plugin, atau
  matriks pengujian plugin, regenerasi dan tinjau keluaran matriks
  `plugin-prerelease-extension-shard` milik planner dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  menjelaskan layout CI yang usang
- Kesiapan rilis macOS stabil juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang sudah dikemas
  - `appcast.xml` di `main` harus mengarah ke zip stabil baru setelah penerbitan
  - aplikasi yang dikemas harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas batas build Sparkle
    kanonis untuk versi rilis tersebut

## Kotak uji rilis

`Full Release Validation` adalah cara operator memulai semua pengujian pra-rilis dari
satu titik masuk. Untuk bukti commit tersemat pada branch yang bergerak cepat, gunakan
helper agar setiap alur kerja anak berjalan dari branch sementara yang dipatok ke SHA
target:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper mendorong `release-ci/<sha>-...`, menjalankan `Full Release Validation`
dari branch tersebut dengan `ref=<sha>`, memverifikasi setiap `headSha` alur kerja anak
cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian run
anak `main` yang lebih baru secara tidak sengaja.

Untuk validasi branch atau tag rilis, jalankan dari ref alur kerja `main` tepercaya
dan teruskan branch atau tag rilis sebagai `ref`:

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
`target_ref=<release-ref>`, menjalankan `OpenClaw Release Checks`, dan menjalankan
paket mandiri Telegram E2E saat `release_profile=full` dengan
`rerun_group=all` atau saat `npm_telegram_package_spec` ditetapkan. `OpenClaw Release
Checks` lalu menyebar ke install smoke, pemeriksaan rilis lintas-OS, cakupan jalur
rilis live/E2E Docker, Package Acceptance dengan QA paket Telegram, paritas QA Lab,
Matrix live, dan Telegram live. Run penuh hanya dapat diterima saat ringkasan
`Full Release Validation`
menampilkan `normal_ci` dan `release_checks` sebagai berhasil. Dalam mode full/all,
child `npm_telegram` juga harus berhasil; di luar full/all, ini dilewati kecuali
`npm_telegram_package_spec` yang telah dipublikasikan disediakan. Ringkasan verifier
akhir menyertakan tabel job paling lambat untuk setiap child run, sehingga release
manager dapat melihat critical path saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk matriks
tahap lengkap, nama job workflow yang tepat, perbedaan profil stable versus full,
artefak, dan handle rerun terfokus.
Child workflow dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan saat `ref` target menunjuk ke branch
atau tag rilis yang lebih lama. Tidak ada input workflow-ref Full Release Validation
yang terpisah; pilih harness tepercaya dengan memilih ref workflow run.
Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit persis pada `main` yang
bergerak; SHA commit mentah tidak dapat menjadi ref workflow dispatch, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat branch sementara yang dipin.

Gunakan `release_profile` untuk memilih keluasan live/provider:

- `minimum`: jalur live dan Docker OpenAI/core yang paling cepat dan kritis untuk rilis
- `stable`: minimum ditambah cakupan provider/backend stable untuk persetujuan rilis
- `full`: stable ditambah cakupan provider/media advisory yang luas

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref
target sekali sebagai `release-package-under-test` dan menggunakan ulang artefak itu
di pemeriksaan Docker jalur rilis dan Package Acceptance. Ini menjaga semua box yang
menghadapi paket pada byte yang sama dan menghindari build paket berulang.
Install smoke OpenAI lintas-OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat
variabel repo/org ditetapkan, jika tidak `openai/gpt-5.5`, karena lane ini
membuktikan instalasi paket, onboarding, startup gateway, dan satu giliran agent
live, bukan membenchmark model default paling lambat. Matriks provider live yang
lebih luas tetap menjadi tempat untuk cakupan spesifik model.

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

Jangan gunakan umbrella penuh sebagai rerun pertama setelah perbaikan terfokus. Jika satu box
gagal, gunakan child workflow, job, lane Docker, profil paket, provider model, atau lane QA
yang gagal untuk bukti berikutnya. Jalankan umbrella penuh lagi hanya saat perbaikan
mengubah orkestrasi rilis bersama atau membuat bukti semua box sebelumnya menjadi basi.
Verifier akhir umbrella memeriksa ulang id child workflow run yang direkam, jadi setelah
child workflow berhasil direrun, rerun hanya job induk `Verify full validation` yang gagal.

Untuk pemulihan terbatas, teruskan `rerun_group` ke umbrella. `all` adalah run release-candidate
yang sebenarnya, `ci` hanya menjalankan child CI normal, `plugin-prerelease` hanya menjalankan
child plugin khusus rilis, `release-checks` menjalankan setiap box rilis, dan grup rilis yang
lebih sempit adalah `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`.
Rerun `npm-telegram` terfokus memerlukan `npm_telegram_package_spec`; run full/all
dengan `release_profile=full` menggunakan artefak paket release-checks.

### Vitest

Box Vitest adalah child workflow `CI` manual. CI manual sengaja melewati scoping perubahan
dan memaksa grafik pengujian normal untuk release candidate: shard Linux Node, shard plugin
bundel, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, build smoke,
pemeriksaan docs, Python skills, Windows, macOS, Android, dan Control UI i18n.

Gunakan box ini untuk menjawab "apakah source tree lulus suite pengujian normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- Ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dijalankan
- Run `CI` hijau pada SHA target yang tepat
- nama shard gagal atau lambat dari job CI saat menyelidiki regresi
- artefak timing Vitest seperti `.artifacts/vitest-shard-timings.json` saat
  run membutuhkan analisis performa

Jalankan CI manual secara langsung hanya saat rilis membutuhkan CI normal deterministik tetapi
tidak membutuhkan box Docker, QA Lab, live, lintas-OS, atau paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, ditambah workflow
`install-smoke` mode rilis. Ini memvalidasi release candidate melalui lingkungan
Docker berpaket, bukan hanya pengujian level source.

Cakupan Docker rilis meliputi:

- install smoke penuh dengan install smoke global Bun yang lambat diaktifkan
- persiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target, dengan job smoke QR,
  root/gateway, dan installer/Bun berjalan sebagai shard install-smoke terpisah
- lane E2E repository
- chunk Docker jalur rilis: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, dan `plugins-runtime-install-h`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` saat diminta
- lane install/uninstall plugin bundel terpisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker saat release checks
  menyertakan suite live

Gunakan artefak Docker sebelum rerun. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
timing fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada workflow live/E2E reusable alih-alih
mererun semua chunk rilis. Perintah rerun yang dihasilkan menyertakan
`package_artifact_run_id` sebelumnya dan input image Docker yang sudah disiapkan saat tersedia,
sehingga lane yang gagal dapat menggunakan ulang tarball dan image GHCR yang sama.

### QA Lab

Box QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Ini adalah gate rilis
perilaku agentic dan level channel, terpisah dari Vitest dan mekanika paket Docker.

Cakupan QA Lab rilis meliputi:

- gate paritas mock yang membandingkan lane kandidat OpenAI dengan baseline Opus 4.6
  menggunakan paket paritas agentic
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial Convex CI
- `pnpm qa:otel:smoke` saat telemetri rilis membutuhkan bukti lokal eksplisit

Gunakan box ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan
alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram saat
menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai run QA-Lab sharded manual,
bukan lane kritis-rilis default.

### Paket

Box Package adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan kandidat
menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, serta menjaga ref harness workflow
terpisah dari ref source paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat
- `source=ref`: mengemas branch, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: mengunduh `.tgz` HTTPS dengan `package_sha256` wajib
- `source=artifact`: menggunakan ulang `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak
paket rilis yang disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues`, dan
`telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, update, pembersihan
dependensi plugin basi, fixture plugin offline, update plugin, dan QA paket Telegram
terhadap tarball yang sama yang sudah diselesaikan. Ini adalah pengganti native GitHub
untuk sebagian besar cakupan paket/update yang sebelumnya memerlukan Parallels.
Pemeriksaan rilis lintas-OS masih penting untuk onboarding, installer, dan perilaku platform
yang spesifik OS, tetapi validasi produk paket/update sebaiknya memilih Package Acceptance.

Checklist kanonis untuk validasi update dan plugin adalah
[Menguji update dan plugin](/id/help/testing-updates-plugins). Gunakan ini saat
memutuskan lane lokal, Docker, Package Acceptance, atau release-check mana yang membuktikan
perubahan install/update plugin, pembersihan doctor, atau migrasi published-package.
Migrasi update yang dipublikasikan secara menyeluruh dari setiap paket stable `2026.4.23+`
adalah workflow `Update Migration` manual terpisah, bukan bagian dari Full Release CI.

Kelonggaran package-acceptance legacy sengaja dibatasi waktu. Paket hingga
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang sudah dipublikasikan
ke npm: entri inventaris QA privat yang hilang dari tarball, `gateway install --wrapper` yang hilang,
file patch yang hilang dalam fixture git turunan tarball, `update.channel` tersimpan yang hilang,
lokasi install-record plugin legacy, persistensi install-record marketplace yang hilang, dan migrasi
metadata config selama `plugins update`. Paket `2026.4.26` yang dipublikasikan dapat memberi
peringatan untuk file stempel metadata build lokal yang sudah dikirim. Paket yang lebih baru
harus memenuhi kontrak paket modern; celah yang sama menggagalkan validasi rilis.

Gunakan profil Package Acceptance yang lebih luas saat pertanyaan rilis adalah tentang
paket nyata yang dapat diinstal:

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

- `smoke`: lane install/channel/agent paket cepat, jaringan gateway, dan reload config
- `package`: kontrak paket install/update/plugin tanpa ClawHub live; ini adalah default
  release-check
- `product`: `package` ditambah channel MCP, pembersihan cron/subagent, pencarian web OpenAI,
  dan OpenWebUI
- `full`: chunk Docker jalur rilis dengan OpenWebUI
- `custom`: daftar `docker_lanes` tepat untuk rerun terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Package Acceptance. Workflow meneruskan tarball
`package-under-test` yang diselesaikan ke lane Telegram; workflow mandiri
Telegram tetap menerima spesifikasi npm yang telah dipublikasikan untuk pemeriksaan pascapublikasi.

## Automasi publikasi rilis

`OpenClaw Release Publish` adalah entrypoint publikasi mutasi normal. Ini
mengorkestrasi workflow trusted-publisher dalam urutan yang dibutuhkan rilis:

1. Check out tag rilis dan selesaikan commit SHA-nya.
2. Verifikasi bahwa tag dapat dijangkau dari `main` atau `release/*`.
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

Gunakan workflow tingkat lebih rendah `Plugin NPM Release` dan `Plugin ClawHub Release`
hanya untuk pekerjaan perbaikan atau publikasi ulang yang terfokus. Untuk perbaikan plugin
yang dipilih, berikan `plugin_publish_scope=selected` dan `plugins=@openclaw/name` ke
`OpenClaw Release Publish`, atau dispatch workflow anak secara langsung ketika paket
OpenClaw tidak boleh dipublikasikan.

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga dapat berupa
  commit SHA cabang workflow lengkap 40 karakter saat ini untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk
  jalur publikasi nyata
- `preflight_run_id`: wajib pada jalur publikasi nyata agar workflow menggunakan ulang
  tarball yang disiapkan dari run preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publikasi; default ke `beta`

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id run preflight `OpenClaw NPM Release` yang berhasil;
  wajib ketika `publish_openclaw_npm=true`
- `npm_dist_tag`: tag target npm untuk paket OpenClaw
- `plugin_publish_scope`: default ke `all-publishable`; gunakan `selected` hanya
  untuk pekerjaan perbaikan yang terfokus
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma ketika
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default ke `true`; setel `false` hanya ketika menggunakan
  workflow sebagai orkestrator perbaikan khusus plugin

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: cabang, tag, atau commit SHA lengkap untuk divalidasi. Pemeriksaan yang
  membawa secret mengharuskan commit yang diselesaikan dapat dijangkau dari cabang
  OpenClaw atau tag rilis.

Aturan:

- Tag stabil dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prerelease beta hanya dapat dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input commit SHA lengkap hanya diizinkan ketika
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu
  hanya untuk validasi
- Jalur publikasi nyata harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama preflight;
  workflow memverifikasi metadata itu sebelum publikasi dilanjutkan

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan commit SHA cabang workflow lengkap saat ini
     untuk dry run khusus validasi pada workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur normal beta-terlebih-dahulu, atau `latest` hanya
   ketika Anda sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau commit SHA lengkap
   ketika Anda menginginkan CI normal plus cakupan cache prompt live, Docker, QA Lab,
   Matrix, dan Telegram dari satu workflow manual
4. Jika Anda sengaja hanya membutuhkan grafik pengujian normal yang deterministik, jalankan
   workflow manual `CI` pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag` yang sama,
   dan `preflight_run_id` yang tersimpan; ini memublikasikan plugin yang dieksternalisasi ke npm
   dan ClawHub sebelum mempromosikan paket npm OpenClaw
7. Jika rilis mendarat di `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stabil yang sama, gunakan workflow privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi
   self-healing terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan publikasi khusus OIDC.

Itu membuat jalur publikasi langsung dan jalur promosi beta-terlebih-dahulu sama-sama
terdokumentasi dan terlihat oleh operator.

Jika maintainer harus fallback ke autentikasi npm lokal, jalankan perintah CLI 1Password
(`op`) hanya di dalam sesi tmux khusus. Jangan panggil `op`
langsung dari shell agent utama; menjaganya di dalam tmux membuat prompt,
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
