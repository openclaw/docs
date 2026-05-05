---
read_when:
    - Mencari definisi saluran rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan ritme rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan ritme
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-05T06:18:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang diterbitkan ke npm `beta` secara default, atau ke npm `latest` ketika diminta secara eksplisit
- beta: tag prarilis yang diterbitkan ke npm `beta`
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
- Rilis stabil dan rilis koreksi stabil diterbitkan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah diperiksa nanti
- Setiap rilis stabil OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan menerbitkan jalur npm/paket terlebih dahulu, dengan
  build/sign/notarize aplikasi mac dicadangkan untuk stabil kecuali diminta secara eksplisit

## Kadensi rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stabil menyusul hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari cabang `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta telah di-push atau diterbitkan dan memerlukan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan bersifat
  khusus maintainer

## Daftar periksa operator rilis

Daftar periksa ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarization, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: pull terbaru, konfirmasi commit target telah di-push,
   dan konfirmasi CI `main` saat ini cukup hijau untuk membuat cabang darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, pertahankan entri berorientasi pengguna, commit, push, dan rebase/pull
   sekali lagi sebelum membuat cabang.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas yang kedaluwarsa
   hanya ketika jalur upgrade tetap tercakup, atau catat mengapa itu
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
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk cabang
   rilis, tag, atau SHA commit lengkap. Ini adalah satu entrypoint manual
   untuk empat kotak uji rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di cabang rilis dan jalankan ulang file,
   lane, job workflow, profil paket, provider, atau allowlist model terkecil yang gagal
   yang membuktikan perbaikan. Jalankan ulang umbrella penuh hanya ketika permukaan yang diubah membuat
   bukti sebelumnya menjadi usang.
9. Untuk beta, tag `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   cabang `release/YYYY.M.D` yang sesuai. Ini memverifikasi `pnpm plugins:sync:check`,
   menerbitkan semua paket Plugin yang dapat diterbitkan ke npm terlebih dahulu, menerbitkan set yang sama
   ke ClawHub kedua sebagai tarball npm-pack ClawPack, lalu mempromosikan
   artefak preflight npm OpenClaw yang disiapkan dengan dist-tag yang sesuai. Setelah
   penerbitan, jalankan penerimaan paket pasca-penerbitan
   terhadap paket `openclaw@YYYY.M.D-beta.N` atau
   `openclaw@beta` yang diterbitkan. Jika prarilis yang di-push atau diterbitkan memerlukan perbaikan,
   buat nomor prarilis berikutnya yang sesuai; jangan hapus atau tulis ulang prarilis lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang telah diperiksa memiliki
    bukti validasi yang diperlukan. Penerbitan npm stabil juga melalui
    `OpenClaw Release Publish`, menggunakan kembali artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stabil juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang telah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
11. Setelah penerbitan, jalankan verifier pasca-penerbitan npm, E2E Telegram
    npm-terbit mandiri opsional ketika Anda memerlukan bukti channel pasca-penerbitan,
    promosi dist-tag bila diperlukan, catatan rilis/prarilis GitHub dari
    bagian `CHANGELOG.md` lengkap yang sesuai, dan langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum praperiksa rilis agar TypeScript pengujian tetap
  tercakup di luar gerbang `pnpm check` lokal yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum praperiksa rilis agar pemeriksaan siklus
  impor dan batas arsitektur yang lebih luas hijau di luar gerbang lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak
  rilis `dist/*` yang diharapkan dan bundel Control UI tersedia untuk langkah
  validasi paket
- Jalankan `pnpm plugins:sync` setelah kenaikan versi root dan sebelum penandaan. Ini
  memperbarui versi paket Plugin yang dapat dipublikasikan, metadata kompatibilitas
  peer/API OpenClaw, metadata build, dan stub changelog Plugin agar cocok dengan versi
  rilis core. `pnpm plugins:sync:check` adalah penjaga rilis yang tidak mengubah;
  alur kerja publikasi gagal sebelum mutasi registry apa pun jika langkah ini
  terlupakan.
- Jalankan alur kerja manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua kotak pengujian prarilis dari satu titik masuk. Ini menerima branch,
  tag, atau SHA commit lengkap, memicu `CI` manual, dan memicu
  `OpenClaw Release Checks` untuk install smoke, package acceptance, pemeriksaan
  paket lintas-OS, paritas QA Lab, Matrix, dan lane Telegram. Run stabil/default
  menahan live/E2E lengkap dan soak jalur rilis Docker di balik
  `run_release_soak=true`; `release_profile=full` memaksa soak aktif. Dengan
  `release_profile=full` dan `rerun_group=all`, ini juga menjalankan package Telegram
  E2E terhadap artefak `release-package-under-test` dari release checks.
  Berikan `npm_telegram_package_spec` setelah publikasi ketika Telegram E2E yang sama
  juga harus membuktikan paket npm yang dipublikasikan. Berikan
  `package_acceptance_package_spec` setelah publikasi ketika Package Acceptance
  harus menjalankan matriks paket/pembaruan terhadap paket npm yang dikirim, bukan
  artefak yang dibangun dari SHA. Berikan
  `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa
  validasi cocok dengan paket npm yang dipublikasikan tanpa memaksa Telegram E2E.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan alur kerja manual `Package Acceptance` ketika Anda menginginkan bukti
  side-channel untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan
  `source=npm` untuk `openclaw@beta`, `openclaw@latest`, atau versi rilis persis;
  `source=ref` untuk memaketkan branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256 wajib;
  atau `source=artifact` untuk tarball yang diunggah oleh run GitHub Actions lain.
  Alur kerja menyelesaikan kandidat menjadi `package-under-test`, menggunakan ulang
  scheduler rilis Docker E2E terhadap tarball tersebut, dan dapat menjalankan QA
  Telegram terhadap tarball yang sama dengan `telegram_mode=mock-openai` atau
  `telegram_mode=live-frontier`. Ketika lane Docker yang dipilih mencakup
  `published-upgrade-survivor`, artefak paket adalah kandidat dan
  `published_upgrade_survivor_baseline` memilih baseline yang dipublikasikan.
  `update-restart-auth` menggunakan paket kandidat sebagai CLI yang terpasang
  sekaligus package-under-test sehingga menguji jalur restart terkelola dari perintah
  pembaruan kandidat.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane instal/channel/agent, jaringan Gateway, dan reload konfigurasi
  - `package`: lane paket/pembaruan/restart/Plugin yang native artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket plus channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: potongan jalur rilis Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` persis untuk rerun yang terfokus
- Jalankan alur kerja manual `CI` secara langsung ketika Anda hanya membutuhkan
  cakupan CI normal penuh untuk kandidat rilis. Pemicu CI manual melewati cakupan
  changed dan memaksa shard Linux Node, shard Plugin bundel, kontrak channel,
  kompatibilitas Node 22, `check`, `check-additional`, build smoke,
  pemeriksaan docs, Python skills, Windows, macOS, Android, dan lane Control UI i18n.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` ketika memvalidasi telemetri rilis. Ini menjalankan
  QA-lab melalui receiver OTLP/HTTP lokal dan memverifikasi nama span trace yang
  diekspor, atribut berbatas, serta redaksi konten/identifier tanpa memerlukan
  Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk urutan publikasi yang mengubah setelah
  tag tersedia. Picu dari `release/YYYY.M.D` (atau `main` saat memublikasikan tag
  yang dapat dijangkau dari main), teruskan tag rilis dan `preflight_run_id` npm
  OpenClaw yang berhasil, dan pertahankan cakupan publikasi Plugin default
  `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Alur kerja
  menserialkan publikasi npm Plugin, publikasi ClawHub Plugin, dan publikasi npm
  OpenClaw sehingga paket core tidak dipublikasikan sebelum Plugin yang dieksternalkan.
- Pemeriksaan rilis kini berjalan dalam alur kerja manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan lane paritas mock QA Lab plus profil
  Matrix live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live
  menggunakan lingkungan `qa-live-shared`; Telegram juga menggunakan lease kredensial
  Convex CI. Jalankan alur kerja manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris
  transport, media, dan E2EE Matrix penuh secara paralel.
- Validasi runtime instal dan peningkatan lintas-OS adalah bagian dari
  `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil
  alur kerja reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: pertahankan jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih
  lambat tetap berada di lane sendiri agar tidak menahan atau memblokir publikasi
- Pemeriksaan rilis yang membawa secret harus dipicu melalui `Full Release
Validation` atau dari ref alur kerja `main`/release agar logika alur kerja dan
  secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama
  commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Praperiksa khusus validasi `OpenClaw NPM Release` juga menerima SHA commit branch
  alur kerja 40 karakter penuh saat ini tanpa memerlukan tag yang sudah di-push
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi
  publikasi nyata
- Dalam mode SHA, alur kerja menyintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; publikasi nyata tetap memerlukan tag rilis nyata
- Kedua alur kerja mempertahankan jalur publikasi dan promosi nyata pada runner
  yang di-host GitHub, sementara jalur validasi yang tidak mengubah dapat menggunakan
  runner Linux Blacksmith yang lebih besar
- Alur kerja tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret alur kerja `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Praperiksa rilis npm tidak lagi menunggu lane pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah publikasi npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instal registry
  yang dipublikasikan dalam prefix temp baru
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terpasang, penyiapan Telegram, dan E2E
  Telegram nyata terhadap paket npm yang dipublikasikan menggunakan pool kredensial
  Telegram bersama yang disewa. One-off maintainer lokal dapat menghilangkan var
  Convex dan meneruskan tiga kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pascapublikasi penuh dari mesin maintainer, gunakan `pnpm release:beta-smoke -- --beta betaN`. Helper menjalankan validasi Parallels npm update/fresh-target, memicu `NPM Telegram Beta E2E`, polling run alur kerja persis, mengunduh artefak, dan mencetak laporan Telegram.
- Maintainer dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui
  alur kerja manual `NPM Telegram Beta E2E`. Ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer kini menggunakan preflight-then-promote:
  - publikasi npm nyata harus melewati npm `preflight_run_id` yang berhasil
  - publikasi npm nyata harus dipicu dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run praperiksa yang berhasil
  - rilis npm stabil default ke `beta`
  - publikasi npm stabil dapat menargetkan `latest` secara eksplisit melalui input alur kerja
  - mutasi dist-tag npm berbasis token kini berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    demi keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara
    repo publik mempertahankan publikasi hanya OIDC
  - `macOS Release` publik hanya untuk validasi; ketika tag hanya berada di
    branch rilis tetapi alur kerja dipicu dari `main`, setel
    `public_release_branch=release/YYYY.M.D`
  - publikasi mac privat nyata harus melewati `preflight_run_id` dan
    `validate_run_id` mac privat yang berhasil
  - jalur publikasi nyata mempromosikan artefak yang telah disiapkan alih-alih
    membangunnya ulang
- Untuk rilis koreksi stabil seperti `YYYY.M.D-N`, verifier pascapublikasi
  juga memeriksa jalur peningkatan temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  sehingga koreksi rilis tidak dapat diam-diam meninggalkan instal global lama pada
  payload stabil dasar
- Praperiksa rilis npm gagal tertutup kecuali tarball mencakup
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak lagi mengirim dasbor browser kosong
- Verifikasi pascapublikasi juga memeriksa bahwa entrypoint Plugin yang dipublikasikan dan
  metadata paket tersedia dalam layout registry yang terpasang. Rilis yang
  mengirim payload runtime Plugin yang hilang akan menggagalkan verifier postpublish dan
  tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball pembaruan kandidat, sehingga installer e2e menangkap pembengkakan pack
  yang tidak disengaja sebelum jalur publikasi rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes timing extension, atau
  matriks pengujian extension, regenerasi dan tinjau output matriks
  `plugin-prerelease-extension-shard` milik planner dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis
  tidak mendeskripsikan layout CI yang usang
- Kesiapan rilis macOS stabil juga mencakup surface updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang dipaketkan
  - `appcast.xml` pada `main` harus menunjuk ke zip stabil baru setelah publikasi
  - aplikasi yang dipaketkan harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas floor build Sparkle kanonis
    untuk versi rilis tersebut

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai semua pengujian prarilis dari
satu titik masuk. Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan
helper agar setiap alur kerja anak berjalan dari branch sementara yang dikunci pada target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper mendorong `release-ci/<sha>-...`, memicu `Full Release Validation`
dari branch tersebut dengan `ref=<sha>`, memverifikasi setiap `headSha` alur kerja anak
cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian
run anak `main` yang lebih baru secara tidak sengaja.

Untuk validasi branch rilis atau tag, jalankan dari ref alur kerja `main` tepercaya
dan teruskan branch rilis atau tag sebagai `ref`:

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
`target_ref=<release-ref>`, menjalankan `OpenClaw Release Checks`, menyiapkan
artefak induk `release-package-under-test` untuk pemeriksaan yang berhadapan
dengan paket, dan menjalankan E2E Telegram paket mandiri saat
`release_profile=full` dengan `rerun_group=all` atau saat
`npm_telegram_package_spec` diatur. `OpenClaw Release
Checks` kemudian menyebar ke install smoke, pemeriksaan rilis lintas OS,
cakupan jalur rilis Docker live/E2E saat soak diaktifkan, Package Acceptance
dengan QA paket Telegram, paritas QA Lab, Matrix live, dan Telegram live. Sebuah
run penuh hanya dapat diterima saat ringkasan
`Full Release Validation`
menampilkan `normal_ci` dan `release_checks` sebagai berhasil. Dalam mode full/all,
anak `npm_telegram` juga harus berhasil; di luar full/all, ini dilewati
kecuali `npm_telegram_package_spec` yang sudah dipublikasikan disediakan. Ringkasan
verifikator akhir menyertakan tabel pekerjaan paling lambat untuk setiap run anak, sehingga manajer rilis
dapat melihat jalur kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap lengkap, nama pekerjaan alur kerja yang tepat, perbedaan profil stable versus full,
artefak, dan handle rerun terfokus.
Alur kerja anak dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan saat `ref` target menunjuk ke
branch atau tag rilis yang lebih lama. Tidak ada input ref alur kerja Full Release Validation
terpisah; pilih harness tepercaya dengan memilih ref run alur kerja.
Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit yang tepat pada `main` yang bergerak;
SHA commit mentah tidak dapat menjadi ref dispatch alur kerja, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat branch sementara yang dipin.

Gunakan `release_profile` untuk memilih keluasan live/penyedia:

- `minimum`: jalur OpenAI/core live dan Docker yang paling cepat dan kritis untuk rilis
- `stable`: minimum ditambah cakupan penyedia/backend stable untuk persetujuan rilis
- `full`: stable ditambah cakupan penyedia/media advisory yang luas

Gunakan `run_release_soak=true` dengan `stable` saat lane pemblokir rilis
hijau dan Anda menginginkan sweep live/E2E lengkap, jalur rilis Docker, dan
survivor upgrade terpublikasi terbatas sebelum promosi. Sweep tersebut mencakup
empat paket stable terbaru ditambah baseline `2026.4.23` dan `2026.5.2`
yang dipin ditambah cakupan `2026.4.15` yang lebih lama, dengan baseline duplikat dihapus dan
setiap baseline di-shard ke pekerjaan runner Docker tersendiri. `full` mengimplikasikan
`run_release_soak=true`.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk menyelesaikan ref target
sekali sebagai `release-package-under-test` dan menggunakan kembali artefak tersebut di pemeriksaan lintas OS,
Package Acceptance, dan Docker jalur rilis saat soak berjalan. Ini menjaga
semua box yang berhadapan dengan paket pada byte yang sama dan menghindari build paket berulang.
Install smoke OpenAI lintas OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat
variabel repo/org diatur, jika tidak `openai/gpt-5.4`, karena lane ini
membuktikan instalasi paket, onboarding, startup gateway, dan satu giliran agen live
alih-alih melakukan benchmark model default paling lambat. Matriks penyedia live
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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Jangan gunakan payung penuh sebagai rerun pertama setelah perbaikan terfokus. Jika satu box
gagal, gunakan alur kerja anak, pekerjaan, lane Docker, profil paket, penyedia
model, atau lane QA yang gagal untuk bukti berikutnya. Jalankan kembali payung penuh hanya saat
perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua-box sebelumnya
kedaluwarsa. Verifikator akhir payung memeriksa ulang id run alur kerja anak
yang tercatat, jadi setelah alur kerja anak berhasil dijalankan ulang, jalankan ulang hanya pekerjaan induk
`Verify full validation` yang gagal.

Untuk pemulihan terbatas, teruskan `rerun_group` ke payung. `all` adalah run
kandidat rilis yang sebenarnya, `ci` hanya menjalankan anak CI normal, `plugin-prerelease`
hanya menjalankan anak Plugin khusus rilis, `release-checks` menjalankan setiap box rilis,
dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`.
Rerun `npm-telegram` terfokus memerlukan `npm_telegram_package_spec`; run full/all
dengan `release_profile=full` menggunakan artefak paket release-checks. Rerun
lintas OS terfokus dapat menambahkan `cross_os_suite_filter=windows/packaged-upgrade` atau
filter OS/suite lain. Kegagalan release-check QA bersifat advisory; kegagalan khusus QA
tidak memblokir validasi rilis.

### Vitest

Box Vitest adalah alur kerja anak `CI` manual. CI manual sengaja
melewati scope perubahan dan memaksa grafik pengujian normal untuk kandidat
rilis: shard Linux Node, shard Plugin terbundel, kontrak channel, kompatibilitas Node 22,
`check`, `check-additional`, build smoke, pemeriksaan docs, Python
skills, Windows, macOS, Android, dan i18n Control UI.

Gunakan box ini untuk menjawab "apakah source tree lulus test suite normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang harus disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dijalankan
- run `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari pekerjaan CI saat menyelidiki regresi
- artefak timing Vitest seperti `.artifacts/vitest-shard-timings.json` saat
  sebuah run memerlukan analisis performa

Jalankan CI manual secara langsung hanya saat rilis memerlukan CI normal deterministik tetapi
bukan box Docker, QA Lab, live, lintas OS, atau paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, ditambah alur kerja
`install-smoke` mode rilis. Ini memvalidasi kandidat rilis melalui lingkungan
Docker terpaket, bukan hanya pengujian tingkat sumber.

Cakupan Docker rilis meliputi:

- install smoke penuh dengan slow Bun global install smoke diaktifkan
- persiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target, dengan QR,
  root/gateway, dan pekerjaan installer/Bun smoke berjalan sebagai shard install-smoke
  terpisah
- lane E2E repositori
- chunk Docker jalur rilis: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, dan `plugins-runtime-install-h`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` saat diminta
- lane install/uninstall Plugin terbundel terpisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite penyedia live/E2E dan cakupan model live Docker saat pemeriksaan rilis
  mencakup suite live

Gunakan artefak Docker sebelum rerun. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
timing fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada alur kerja live/E2E reusable alih-alih
menjalankan ulang semua chunk rilis. Perintah rerun yang dihasilkan menyertakan
`package_artifact_run_id` sebelumnya dan input image Docker yang telah disiapkan saat tersedia, sehingga
lane yang gagal dapat menggunakan ulang tarball dan image GHCR yang sama.

### QA Lab

Box QA Lab juga bagian dari `OpenClaw Release Checks`. Ini adalah gate rilis
perilaku agentik dan tingkat channel, terpisah dari mekanika paket Vitest dan Docker.

Cakupan QA Lab rilis meliputi:

- lane paritas mock yang membandingkan lane kandidat OpenAI terhadap baseline Opus 4.6
  menggunakan paket paritas agentik
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial Convex CI
- `pnpm qa:otel:smoke` saat telemetri rilis memerlukan bukti lokal eksplisit

Gunakan box ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan
alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram
saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai
run QA-Lab sharded manual, bukan lane kritis rilis default.

### Paket

Box Paket adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan
kandidat menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, dan menjaga
ref harness alur kerja terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw
  yang tepat
- `source=ref`: kemas branch, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS dengan `package_sha256` yang wajib
- `source=artifact`: gunakan ulang `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak paket rilis
yang disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, pembaruan,
restart pembaruan auth terkonfigurasi, pembersihan dependensi Plugin usang, fixture Plugin
offline, pembaruan Plugin, dan QA paket Telegram terhadap tarball yang sama yang telah diselesaikan.
Pemeriksaan rilis yang memblokir menggunakan baseline paket terpublikasi terbaru default;
`run_release_soak=true` atau
`release_profile=full` memperluas ke setiap baseline yang dipublikasikan npm stable dari
`2026.4.23` hingga `latest` ditambah fixture isu yang dilaporkan. Gunakan
Package Acceptance dengan `source=npm` untuk kandidat yang sudah dikirim, atau
`source=ref`/`source=artifact` untuk tarball npm lokal berbasis SHA sebelum
publikasi. Ini adalah pengganti GitHub-native
untuk sebagian besar cakupan paket/pembaruan yang sebelumnya memerlukan
Parallels. Pemeriksaan rilis lintas OS tetap penting untuk onboarding,
installer, dan perilaku platform spesifik OS, tetapi validasi produk paket/pembaruan harus
memilih Package Acceptance.

Checklist kanonis untuk validasi pembaruan dan Plugin adalah
[Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins). Gunakan itu saat
menentukan lane lokal, Docker, Package Acceptance, atau release-check mana yang membuktikan
perubahan install/update Plugin, pembersihan doctor, atau migrasi paket terpublikasi.
Migrasi pembaruan terpublikasi lengkap dari setiap paket stable `2026.4.23+` adalah
alur kerja manual `Update Migration` terpisah, bukan bagian dari Full Release CI.

Kelonggaran penerimaan paket lawas sengaja dibatasi waktu. Paket sampai
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang sudah dipublikasikan
ke npm: entri inventaris QA privat yang hilang dari tarball, `gateway install --wrapper` yang hilang, file patch yang hilang di fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi catatan instalasi Plugin lawas, persistensi catatan instalasi marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Paket `2026.4.26` yang dipublikasikan dapat memberi peringatan untuk file stempel metadata build lokal yang sudah dikirim. Paket berikutnya harus memenuhi kontrak paket modern; celah yang sama akan menggagalkan validasi rilis.

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

- `smoke`: jalur cepat untuk instalasi paket/channel/agen, jaringan Gateway, dan pemuatan ulang konfigurasi
- `package`: kontrak instalasi/pembaruan/mulai ulang/paket Plugin tanpa ClawHub live; ini adalah default pemeriksaan rilis
- `product`: `package` ditambah channel MCP, pembersihan cron/subagen, pencarian web OpenAI, dan OpenWebUI
- `full`: potongan jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk pengulangan terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Package Acceptance. Workflow meneruskan tarball
`package-under-test` yang sudah diselesaikan ke jalur Telegram; workflow Telegram
mandiri tetap menerima spesifikasi npm yang sudah dipublikasikan untuk pemeriksaan pascapublikasi.

## Otomasi publikasi rilis

`OpenClaw Release Publish` adalah titik masuk publikasi mutasi normal. Ia
mengorkestrasi workflow penerbit tepercaya sesuai urutan yang diperlukan rilis:

1. Checkout tag rilis dan selesaikan SHA commit-nya.
2. Verifikasi bahwa tag dapat dijangkau dari `main` atau `release/*`.
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan cakupan dan SHA yang sama.
6. Dispatch `OpenClaw NPM Release` dengan tag rilis, dist-tag npm, dan
   `preflight_run_id` yang disimpan.

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
hanya untuk pekerjaan perbaikan atau publikasi ulang yang terfokus. Untuk perbaikan Plugin terpilih, berikan
`plugin_publish_scope=selected` dan `plugins=@openclaw/name` ke
`OpenClaw Release Publish`, atau dispatch workflow anak secara langsung ketika
paket OpenClaw tidak boleh dipublikasikan.

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga boleh berupa SHA commit lengkap 40 karakter dari cabang workflow saat ini untuk preflight validasi saja
- `preflight_only`: `true` untuk validasi/build/paket saja, `false` untuk jalur publikasi nyata
- `preflight_run_id`: wajib pada jalur publikasi nyata agar workflow menggunakan kembali tarball yang sudah disiapkan dari run preflight yang berhasil
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
- `publish_openclaw_npm`: default ke `true`; setel `false` hanya ketika menggunakan workflow sebagai orkestrator perbaikan khusus Plugin

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: cabang, tag, atau SHA commit lengkap untuk divalidasi. Pemeriksaan yang membawa rahasia
  mengharuskan commit yang diselesaikan dapat dijangkau dari cabang OpenClaw atau
  tag rilis.
- `run_release_soak`: ikut serta dalam live/E2E menyeluruh, jalur rilis Docker, dan
  soak upgrade-survivor all-since pada pemeriksaan rilis stabil/default. Ini dipaksa
  aktif oleh `release_profile=full`.

Aturan:

- Tag stabil dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prarilis beta hanya dapat dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit lengkap hanya diizinkan ketika
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya untuk validasi
- Jalur publikasi nyata harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama preflight;
  workflow memverifikasi bahwa metadata tersebut sebelum publikasi berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit lengkap cabang workflow saat ini
     untuk dry run validasi saja dari workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur normal beta-terlebih-dahulu, atau `latest` hanya
   ketika Anda secara sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau SHA
   commit lengkap ketika Anda menginginkan CI normal ditambah cakupan cache prompt live, Docker, QA Lab,
   Matrix, dan Telegram dari satu workflow manual
4. Jika Anda secara sengaja hanya membutuhkan graf pengujian normal yang deterministik, jalankan workflow
   manual `CI` pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag` yang sama,
   dan `preflight_run_id` yang disimpan; ini memublikasikan Plugin eksternalisasi ke npm
   dan ClawHub sebelum mempromosikan paket npm OpenClaw
7. Jika rilis mendarat di `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
8. Jika rilis secara sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stabil yang sama, gunakan workflow privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi
   penyembuhan mandiri terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan publikasi khusus OIDC.

Itu membuat jalur publikasi langsung dan jalur promosi beta-terlebih-dahulu sama-sama
terdokumentasi dan terlihat oleh operator.

Jika maintainer harus kembali ke autentikasi npm lokal, jalankan perintah CLI 1Password
(`op`) apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op`
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

Maintainer menggunakan dokumen rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
untuk runbook sebenarnya.

## Terkait

- [Channel rilis](/id/install/development-channels)
