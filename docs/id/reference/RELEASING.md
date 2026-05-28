---
read_when:
    - Mencari definisi kanal rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan ritme rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan irama
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-12T08:46:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` ketika diminta secara eksplisit
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: head bergerak dari `main`

## Penamaan versi

- Versi rilis stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prarilis beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan menambahkan nol di depan bulan atau hari
- `latest` berarti rilis npm stable yang saat ini dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stable dan rilis koreksi stable dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang sudah diperiksa nanti
- Setiap rilis stable OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/tanda tangan/notarisasi aplikasi Mac disediakan untuk stable kecuali diminta secara eksplisit

## Jadwal rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stable menyusul hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari cabang `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak menghambat
  pengembangan baru di `main`
- Jika tag beta sudah didorong atau dipublikasikan dan membutuhkan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Daftar periksa operator rilis

Daftar periksa ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada di
buku panduan rilis khusus maintainer.

1. Mulai dari `main` saat ini: tarik yang terbaru, konfirmasi commit target sudah didorong,
   dan konfirmasi CI `main` saat ini cukup hijau untuk menjadi dasar cabang.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, pertahankan entri tetap menghadap pengguna, commit, dorong, dan rebase/pull
   sekali lagi sebelum membuat cabang.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas
   yang sudah kedaluwarsa hanya ketika jalur upgrade tetap tercakup, atau catat mengapa kompatibilitas itu
   sengaja dipertahankan.
4. Buat `release/YYYY.M.D` dari `main` saat ini; jangan lakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dimaksud, lalu jalankan
   `pnpm release:prep`. Perintah ini menyegarkan versi plugin, inventaris plugin, skema
   config, metadata config channel terbundel, baseline dokumen config, ekspor SDK plugin,
   dan baseline API SDK plugin dalam urutan yang benar. Commit drift yang dihasilkan
   sebelum membuat tag. Lalu jalankan preflight deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, dan `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA cabang rilis 40 karakter penuh diizinkan untuk preflight khusus validasi.
   Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk
   cabang rilis, tag, atau SHA commit penuh. Ini adalah satu entrypoint manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di cabang rilis dan jalankan ulang file,
   lane, job workflow, profil paket, provider, atau allowlist model terkecil yang gagal dan
   membuktikan perbaikannya. Jalankan ulang umbrella penuh hanya ketika permukaan yang berubah membuat
   bukti sebelumnya usang.
9. Untuk beta, tag `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   cabang `release/YYYY.M.D` yang cocok. Perintah ini memverifikasi `pnpm plugins:sync:check`,
   mendispatch semua paket plugin yang dapat dipublikasikan ke npm dan set yang sama ke
   ClawHub secara paralel, lalu mempromosikan artefak preflight npm OpenClaw yang disiapkan
   dengan dist-tag yang cocok segera setelah publish npm plugin berhasil.
   Setelah child publish npm OpenClaw berhasil, perintah ini membuat atau memperbarui
   halaman rilis/prarilis GitHub yang cocok dari bagian `CHANGELOG.md`
   lengkap yang cocok. Rilis stable yang dipublikasikan ke npm `latest` menjadi
   rilis GitHub latest; rilis pemeliharaan stable yang dipertahankan di npm `beta` dibuat
   dengan GitHub `latest=false`.
   Publikasi ClawHub mungkin masih berjalan saat npm OpenClaw dipublikasikan, tetapi workflow
   publish rilis langsung mencetak ID run child. Secara default, workflow ini
   tidak menunggu ClawHub setelah mendispatchnya, sehingga ketersediaan npm OpenClaw
   tidak diblokir oleh persetujuan atau pekerjaan registry ClawHub yang lebih lambat; set
   `wait_for_clawhub=true` ketika ClawHub harus memblokir penyelesaian workflow. Jalur
   ClawHub mencoba ulang kegagalan instalasi dependensi CLI yang bersifat sementara, memublikasikan
   plugin yang lolos preview bahkan ketika satu sel preview flake, dan berakhir dengan
   verifikasi registry untuk setiap versi plugin yang diharapkan sehingga publish parsial
   tetap terlihat dan dapat dicoba ulang. Setelah publish, jalankan
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   untuk memverifikasi prarilis GitHub, dist-tag npm `beta`, integritas npm,
   jalur instalasi yang dipublikasikan, versi tepat ClawHub, artefak ClawHub, dan kesimpulan
   workflow child dari satu perintah. Tambahkan `--rerun-failed-clawhub` ketika sidecar
   ClawHub gagal hanya pada job yang dapat dicoba ulang dan harus dijalankan ulang di tempat.
   Lalu jalankan penerimaan paket pascapublish terhadap paket
   `openclaw@YYYY.M.D-beta.N` atau
   `openclaw@beta` yang dipublikasikan. Jika prarilis yang sudah didorong atau dipublikasikan membutuhkan perbaikan,
   buat nomor prarilis cocok berikutnya; jangan hapus atau tulis ulang prarilis lama.
10. Untuk stable, lanjutkan hanya setelah beta atau kandidat rilis yang sudah diperiksa memiliki
    bukti validasi yang diperlukan. Publish npm stable juga melalui
    `OpenClaw Release Publish`, menggunakan ulang artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stable juga membutuhkan
    `.zip`, `.dmg`, `.dSYM.zip` yang sudah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
    Workflow publish macOS privat memublikasikan appcast bertanda tangan ke `main`
    publik secara otomatis setelah aset rilis diverifikasi; jika perlindungan cabang memblokir
    push langsung, workflow ini membuka atau memperbarui PR appcast.
11. Setelah publish, jalankan verifier npm pascapublish, E2E Telegram standalone
    published-npm opsional ketika Anda membutuhkan bukti channel pascapublish,
    promosi dist-tag ketika diperlukan, verifikasi halaman rilis GitHub yang dihasilkan,
    dan jalankan langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum prapenerbangan rilis agar TypeScript pengujian tetap
  tercakup di luar gerbang lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum prapenerbangan rilis agar pemeriksaan siklus
  impor dan batas arsitektur yang lebih luas hijau di luar gerbang lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis
  `dist/*` yang diharapkan dan bundel UI Kontrol tersedia untuk langkah validasi
  paket
- Jalankan `pnpm release:prep` setelah kenaikan versi root dan sebelum penandaan. Perintah ini
  menjalankan setiap generator rilis deterministik yang umum bergeser setelah perubahan
  versi/konfigurasi/API: versi plugin, inventaris plugin, skema konfigurasi dasar,
  metadata konfigurasi channel bawaan, baseline dokumen konfigurasi, ekspor SDK plugin,
  dan baseline API SDK plugin. `pnpm release:check` menjalankan ulang guard tersebut
  dalam mode pemeriksaan dan melaporkan setiap kegagalan drift yang dihasilkan yang
  ditemukannya dalam satu kali proses sebelum menjalankan pemeriksaan rilis paket.
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua kotak pengujian prarilis dari satu titik masuk. Workflow ini menerima branch,
  tag, atau SHA commit lengkap, menjalankan `CI` manual, dan menjalankan
  `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, pemeriksaan paket
  lintas OS, paritas QA Lab, Matrix, dan lane Telegram. Eksekusi stabil/default
  mempertahankan live/E2E lengkap dan soak jalur rilis Docker di balik
  `run_release_soak=true`; `release_profile=full` memaksa soak aktif. Dengan
  `release_profile=full` dan `rerun_group=all`, workflow ini juga menjalankan E2E Telegram
  paket terhadap artefak `release-package-under-test` dari pemeriksaan rilis.
  Berikan `release_package_spec` setelah menerbitkan beta untuk menggunakan ulang paket
  npm yang sudah dikirim di pemeriksaan rilis, Package Acceptance, dan E2E Telegram
  paket tanpa membangun ulang tarball rilis. Berikan
  `npm_telegram_package_spec` hanya ketika Telegram harus menggunakan paket terbitan
  yang berbeda dari validasi rilis lainnya. Berikan
  `package_acceptance_package_spec` ketika Package Acceptance harus menggunakan paket
  terbitan yang berbeda dari spesifikasi paket rilis. Berikan
  `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa
  validasi cocok dengan paket npm yang diterbitkan tanpa memaksa E2E Telegram.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti side-channel
  untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@beta`, `openclaw@latest`, atau versi rilis persis; `source=ref`
  untuk memaketkan branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256 wajib;
  atau `source=artifact` untuk tarball yang diunggah oleh eksekusi GitHub
  Actions lain. Workflow menyelesaikan kandidat menjadi
  `package-under-test`, menggunakan ulang penjadwal rilis Docker E2E terhadap
  tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika lane Docker
  yang dipilih menyertakan `published-upgrade-survivor`, artefak paket adalah kandidat
  dan `published_upgrade_survivor_baseline` memilih baseline terbitan.
  `update-restart-auth` menggunakan paket kandidat sebagai CLI yang terinstal sekaligus
  package-under-test sehingga ia menguji jalur restart terkelola dari perintah pembaruan
  kandidat.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane instalasi/channel/agent, jaringan gateway, dan muat ulang konfigurasi
  - `package`: lane paket/pembaruan/restart/plugin yang native artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket ditambah channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: chunk jalur rilis Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` persis untuk rerun terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya memerlukan cakupan CI
  normal penuh untuk kandidat rilis. Eksekusi CI manual melewati cakupan berbasis perubahan
  dan memaksa shard Linux Node, shard plugin bawaan, kontrak channel,
  kompatibilitas Node 22, `check`, `check-additional`, smoke build,
  pemeriksaan dokumen, Skills Python, Windows, macOS, Android, dan lane i18n UI Kontrol.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` ketika memvalidasi telemetri rilis. Perintah ini menguji
  QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi nama span trace yang diekspor,
  atribut terbatas, serta redaksi konten/identifier tanpa memerlukan Opik, Langfuse,
  atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk urutan publish yang memutasi setelah
  tag ada. Jalankan dari `release/YYYY.M.D` (atau `main` saat menerbitkan tag yang
  dapat dicapai dari main), berikan tag rilis dan `preflight_run_id` npm OpenClaw
  yang berhasil, dan pertahankan cakupan publish plugin default
  `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Workflow ini
  menserialkan publish npm plugin, publish ClawHub plugin, dan publish npm OpenClaw
  sehingga paket inti tidak diterbitkan sebelum plugin yang dieksternalkan.
- Pemeriksaan rilis sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan lane paritas mock QA Lab ditambah profil
  Matrix live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live
  menggunakan lingkungan `qa-live-shared`; Telegram juga menggunakan lease kredensial
  CI Convex. Jalankan workflow manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris
  transport, media, dan E2EE Matrix penuh secara paralel.
- Validasi runtime instalasi dan pemutakhiran lintas OS adalah bagian dari
  `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil
  workflow reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: menjaga jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat
  tetap berada di lane sendiri sehingga tidak menahan atau memblokir publish
- Pemeriksaan rilis yang membawa secret harus dijalankan melalui `Full Release
Validation` atau dari ref workflow `main`/rilis agar logika workflow dan
  secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama
  commit yang diselesaikan dapat dicapai dari branch OpenClaw atau tag rilis
- Prapenerbangan khusus validasi `OpenClaw NPM Release` juga menerima SHA commit
  branch workflow lengkap 40 karakter saat ini tanpa mewajibkan tag yang sudah dipush
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publish nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; publish nyata tetap memerlukan tag rilis nyata
- Kedua workflow mempertahankan jalur publish dan promosi nyata di runner
  GitHub-hosted, sementara jalur validasi non-mutasi dapat menggunakan runner
  Blacksmith Linux yang lebih besar
- Workflow tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Prapenerbangan rilis npm tidak lagi menunggu lane pemeriksaan rilis terpisah
- Sebelum menandai kandidat rilis secara lokal, jalankan
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check`. Helper ini
  menjalankan guardrail rilis cepat, pemeriksaan rilis npm/ClawHub plugin, build,
  build UI, dan `release:openclaw:npm:check` dalam urutan yang menangkap kesalahan
  umum yang memblokir persetujuan sebelum workflow publish GitHub dimulai.
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah npm publish, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi registry
  yang diterbitkan dalam prefiks sementara baru
- Setelah publish beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan E2E Telegram nyata
  terhadap paket npm yang diterbitkan menggunakan pool kredensial Telegram bersama yang
  disewa. Percobaan lokal sekali jalan oleh maintainer dapat menghilangkan variabel Convex
  dan meneruskan tiga kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pascapublish penuh dari mesin maintainer, gunakan `pnpm release:beta-smoke -- --beta betaN`. Helper ini menjalankan validasi pembaruan npm Parallels/target baru, menjalankan `NPM Telegram Beta E2E`, melakukan polling eksekusi workflow persis, mengunduh artefak, dan mencetak laporan Telegram.
- Maintainer dapat menjalankan pemeriksaan pascapublish yang sama dari GitHub Actions melalui
  workflow manual `NPM Telegram Beta E2E`. Workflow ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan prapenerbangan-lalu-promosi:
  - publish npm nyata harus melewati `preflight_run_id` npm yang berhasil
  - publish npm nyata harus dijalankan dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan eksekusi prapenerbangan yang berhasil
  - rilis npm stabil default ke `beta`
  - publish npm stabil dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
    demi keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara
    repo publik tetap menggunakan publish hanya OIDC
  - `macOS Release` publik hanya untuk validasi; ketika tag hanya berada di
    branch rilis tetapi workflow dijalankan dari `main`, setel
    `public_release_branch=release/YYYY.M.D`
  - publish mac privat nyata harus melewati
    `preflight_run_id` dan `validate_run_id` mac privat yang berhasil
  - jalur publish nyata mempromosikan artefak yang sudah disiapkan alih-alih membangunnya
    lagi
- Untuk rilis koreksi stabil seperti `YYYY.M.D-N`, verifier pascapublish
  juga memeriksa jalur pemutakhiran dengan prefiks sementara yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  sehingga koreksi rilis tidak dapat diam-diam membiarkan instalasi global lama berada pada
  payload stabil dasar
- Prapenerbangan rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  sehingga kita tidak mengirim dasbor browser kosong lagi
- Verifikasi pascapublish juga memeriksa bahwa entrypoint plugin yang diterbitkan dan
  metadata paket ada dalam layout registry terinstal. Rilis yang mengirim payload runtime
  plugin yang hilang akan menggagalkan verifier pascapublish dan
  tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menerapkan anggaran `unpackedSize` npm pack pada
  tarball pembaruan kandidat, sehingga e2e installer menangkap pembengkakan paket yang
  tidak disengaja sebelum jalur publish rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes timing ekstensi, atau
  matriks pengujian ekstensi, regenerasi dan tinjau output matriks
  `plugin-prerelease-extension-shard` milik planner dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  menggambarkan layout CI yang usang
- Kesiapan rilis macOS stabil juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang sudah dikemas
  - `appcast.xml` di `main` harus menunjuk ke zip stabil baru setelah publish; workflow
    publish macOS privat meng-commit-nya secara otomatis, atau membuka PR appcast
    ketika push langsung diblokir
  - aplikasi yang dikemas harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas batas bawah build Sparkle
    kanonis untuk versi rilis tersebut

## Kotak uji rilis

`Full Release Validation` adalah cara operator memulai semua pengujian prarilis dari
satu titik masuk. Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan
helper agar setiap workflow anak berjalan dari branch sementara yang ditetapkan pada
SHA target:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper mendorong `release-ci/<sha>-...`, menjalankan `Full Release Validation`
dari branch tersebut dengan `ref=<sha>`, memverifikasi setiap workflow anak `headSha`
cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian
run anak `main` yang lebih baru secara tidak sengaja.

Untuk validasi branch atau tag rilis, jalankan dari ref workflow `main` tepercaya
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

Workflow menyelesaikan ref target, menjalankan `CI` manual dengan
`target_ref=<release-ref>`, menjalankan `OpenClaw Release Checks`, menyiapkan
artefak induk `release-package-under-test` untuk pemeriksaan yang menghadap paket, dan
menjalankan E2E Telegram paket mandiri ketika `release_profile=full` dengan
`rerun_group=all` atau ketika `release_package_spec` atau
`npm_telegram_package_spec` disetel. `OpenClaw Release
Checks` kemudian menyebar ke install smoke, pemeriksaan rilis lintas OS, cakupan
jalur rilis Docker live/E2E ketika soak diaktifkan, Package Acceptance dengan QA
paket Telegram, paritas QA Lab, Matrix live, dan Telegram live. Run penuh hanya dapat diterima ketika
ringkasan `Full Release Validation`
menampilkan `normal_ci` dan `release_checks` sebagai berhasil. Dalam mode full/all,
anak `npm_telegram` juga harus berhasil; di luar full/all, ini dilewati
kecuali `release_package_spec` atau `npm_telegram_package_spec` yang dipublikasikan
disediakan. Ringkasan verifier akhir mencakup tabel job terlambat untuk setiap run anak, sehingga manajer rilis dapat melihat jalur kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap lengkap, nama job workflow yang tepat, perbedaan profil stable versus full,
artefak, dan handle rerun terfokus.
Workflow anak dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan ketika `ref` target mengarah ke
branch atau tag rilis yang lebih lama. Tidak ada input workflow-ref Full Release Validation
terpisah; pilih harness tepercaya dengan memilih ref run workflow.
Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit tepat pada `main` yang bergerak;
SHA commit mentah tidak dapat menjadi ref workflow dispatch, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat branch sementara yang dipin.

Gunakan `release_profile` untuk memilih keluasan live/provider:

- `minimum`: jalur OpenAI/core live dan Docker kritis rilis tercepat
- `stable`: minimum ditambah cakupan provider/backend stable untuk persetujuan rilis
- `full`: stable ditambah cakupan provider/media advisori yang luas

Gunakan `run_release_soak=true` dengan `stable` ketika lane pemblokir rilis
sudah hijau dan Anda menginginkan live/E2E yang menyeluruh, jalur rilis Docker, dan
sweep upgrade-survivor terpublikasi yang dibatasi sebelum promosi. Sweep tersebut mencakup
empat paket stable terbaru ditambah baseline `2026.4.23` dan `2026.5.2`
yang dipin serta cakupan `2026.4.15` yang lebih lama, dengan baseline duplikat dihapus dan
setiap baseline dishard ke job runner Docker sendiri. `full` menyiratkan
`run_release_soak=true`.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref target
sekali sebagai `release-package-under-test` dan menggunakan ulang artefak tersebut dalam pemeriksaan lintas OS,
Package Acceptance, dan Docker jalur rilis ketika soak berjalan. Ini menjaga
semua kotak yang menghadap paket pada byte yang sama dan menghindari build paket berulang.
Setelah beta sudah ada di npm, setel `release_package_spec=openclaw@YYYY.M.D-beta.N`
agar pemeriksaan rilis mengunduh paket terkirim sekali, mengekstrak SHA sumber build-nya
dari `dist/build-info.json`, dan menggunakan ulang artefak tersebut untuk lane lintas OS,
Package Acceptance, Docker jalur rilis, dan Telegram paket.
Install smoke OpenAI lintas OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika
variabel repo/org disetel, jika tidak `openai/gpt-5.4`, karena lane ini
membuktikan instalasi paket, onboarding, startup Gateway, dan satu giliran agen live
bukan melakukan benchmark model default paling lambat. Matriks provider live
yang lebih luas tetap menjadi tempat untuk cakupan khusus model.

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Jangan gunakan umbrella penuh sebagai rerun pertama setelah perbaikan terfokus. Jika satu kotak
gagal, gunakan workflow anak, job, lane Docker, profil paket, provider model,
atau lane QA yang gagal untuk bukti berikutnya. Jalankan umbrella penuh lagi hanya ketika
perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua kotak sebelumnya
usang. Verifier akhir umbrella memeriksa ulang id run workflow anak yang tercatat,
jadi setelah workflow anak berhasil dijalankan ulang, jalankan ulang hanya job induk
`Verify full validation` yang gagal.

Untuk pemulihan terbatas, teruskan `rerun_group` ke umbrella. `all` adalah run
release-candidate yang sebenarnya, `ci` hanya menjalankan anak CI normal, `plugin-prerelease`
hanya menjalankan anak Plugin khusus rilis, `release-checks` menjalankan setiap kotak rilis,
dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`.
Rerun `npm-telegram` terfokus memerlukan `release_package_spec` atau
`npm_telegram_package_spec`; run full/all dengan `release_profile=full` menggunakan
artefak paket release-checks. Rerun lintas OS terfokus dapat menambahkan
`cross_os_suite_filter=windows/packaged-upgrade` atau filter OS/suite lain.
Kegagalan QA release-check bersifat advisori; kegagalan QA saja
tidak memblokir validasi rilis.

### Vitest

Kotak Vitest adalah workflow anak `CI` manual. CI manual sengaja
melewati cakupan changed dan memaksa grafik pengujian normal untuk release
candidate: shard Linux Node, shard Plugin terbundel, kontrak channel, kompatibilitas Node 22,
`check`, `check-additional`, build smoke, pemeriksaan docs, Skills Python,
Windows, macOS, Android, dan i18n Control UI.

Gunakan kotak ini untuk menjawab "apakah source tree lolos suite pengujian normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dijalankan
- run `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artefak waktu Vitest seperti `.artifacts/vitest-shard-timings.json` ketika
  sebuah run memerlukan analisis performa

Jalankan CI manual secara langsung hanya ketika rilis memerlukan CI normal deterministik tetapi
bukan kotak Docker, QA Lab, live, lintas OS, atau paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Kotak Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, ditambah workflow `install-smoke`
mode rilis. Ini memvalidasi release candidate melalui lingkungan Docker
terpaket alih-alih hanya pengujian tingkat sumber.

Cakupan Docker rilis meliputi:

- install smoke penuh dengan smoke install global Bun yang lambat diaktifkan
- persiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target, dengan QR,
  root/Gateway, dan job smoke installer/Bun berjalan sebagai shard install-smoke terpisah
- lane E2E repositori
- chunk Docker jalur rilis: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, dan `plugins-runtime-install-h`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` ketika diminta
- lane install/uninstall Plugin terbundel yang dipecah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker ketika pemeriksaan rilis
  mencakup suite live

Gunakan artefak Docker sebelum menjalankan ulang. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
timing fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada workflow live/E2E reusable alih-alih
menjalankan ulang semua chunk rilis. Perintah rerun yang dihasilkan mencakup
`package_artifact_run_id` sebelumnya dan input image Docker yang disiapkan ketika tersedia, sehingga
lane yang gagal dapat menggunakan ulang tarball dan image GHCR yang sama.

### QA Lab

Kotak QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Ini adalah gerbang rilis
perilaku agentik dan tingkat channel, terpisah dari Vitest dan mekanika paket
Docker.

Cakupan QA Lab rilis meliputi:

- lane paritas mock yang membandingkan lane kandidat OpenAI dengan baseline Opus 4.6
  menggunakan paket paritas agentik
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial Convex CI
- `pnpm qa:otel:smoke` ketika telemetri rilis memerlukan bukti lokal eksplisit

Gunakan kotak ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan
alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram
saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai
run QA-Lab sharded manual alih-alih lane kritis rilis default.

### Paket

Kotak Paket adalah gerbang produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan
kandidat menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventori paket, mencatat versi paket dan SHA-256, serta menjaga
ref harness workflow terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw
  yang tepat
- `source=ref`: kemas branch, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS dengan `package_sha256` yang diwajibkan
- `source=artifact`: gunakan ulang `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak paket rilis yang disiapkan, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, pembaruan, mulai ulang pembaruan auth terkonfigurasi, instalasi Skills ClawHub langsung, pembersihan dependensi Plugin usang, fixture Plugin offline, pembaruan Plugin, dan QA paket Telegram terhadap tarball hasil resolusi yang sama. Pemeriksaan rilis pemblokir menggunakan baseline paket terbitan terbaru default; `run_release_soak=true` atau `release_profile=full` memperluasnya ke setiap baseline stabil yang diterbitkan npm dari `2026.4.23` hingga `latest` plus fixture isu yang dilaporkan. Gunakan Package Acceptance dengan `source=npm` untuk kandidat yang sudah dikirim, atau `source=ref`/`source=artifact` untuk tarball npm lokal berbasis SHA sebelum penerbitan. Ini adalah pengganti asli GitHub untuk sebagian besar cakupan paket/pembaruan yang sebelumnya memerlukan Parallels. Pemeriksaan rilis lintas OS tetap penting untuk onboarding, installer, dan perilaku platform yang spesifik OS, tetapi validasi produk paket/pembaruan sebaiknya mengutamakan Package Acceptance.

Checklist kanonis untuk validasi pembaruan dan Plugin adalah [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins). Gunakan itu saat memutuskan lane lokal, Docker, Package Acceptance, atau pemeriksaan rilis mana yang membuktikan instalasi/pembaruan Plugin, pembersihan doctor, atau perubahan migrasi paket terbitan. Migrasi pembaruan terbitan yang menyeluruh dari setiap paket stabil `2026.4.23+` adalah workflow manual `Update Migration` terpisah, bukan bagian dari Full Release CI.

Kelonggaran package-acceptance lama sengaja dibatasi waktu. Paket hingga `2026.4.25` boleh menggunakan jalur kompatibilitas untuk celah metadata yang sudah diterbitkan ke npm: entri inventaris QA privat yang tidak ada dalam tarball, `gateway install --wrapper` yang hilang, file patch yang hilang dalam fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi catatan instalasi Plugin lama, persistensi catatan instalasi marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Paket `2026.4.26` yang diterbitkan boleh memperingatkan untuk file stempel metadata build lokal yang sudah dikirim. Paket setelahnya harus memenuhi kontrak paket modern; celah yang sama akan menggagalkan validasi rilis.

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

- `smoke`: lane cepat untuk instalasi paket/channel/agent, jaringan Gateway, dan muat ulang konfigurasi
- `package`: kontrak instalasi/pembaruan/mulai ulang/paket Plugin plus bukti instalasi Skills ClawHub langsung; ini adalah default pemeriksaan rilis
- `product`: `package` plus channel MCP, pembersihan cron/subagent, pencarian web OpenAI, dan OpenWebUI
- `full`: chunk jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk rerun terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier` pada Package Acceptance. Workflow meneruskan tarball `package-under-test` hasil resolusi ke lane Telegram; workflow Telegram mandiri tetap menerima spesifikasi npm terbitan untuk pemeriksaan pasca-penerbitan.

## Otomatisasi penerbitan rilis

`OpenClaw Release Publish` adalah entrypoint penerbitan mutasi normal. Ini mengorkestrasi workflow trusted-publisher dalam urutan yang dibutuhkan rilis:

1. Check out tag rilis dan resolusi SHA commit-nya.
2. Verifikasi bahwa tag dapat dijangkau dari `main` atau `release/*`.
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan scope dan SHA yang sama.
6. Dispatch `OpenClaw NPM Release` dengan tag rilis, dist-tag npm, dan `preflight_run_id` yang disimpan.

Contoh penerbitan beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Penerbitan stabil ke dist-tag beta default:

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

Gunakan workflow tingkat lebih rendah `Plugin NPM Release` dan `Plugin ClawHub Release` hanya untuk pekerjaan perbaikan atau penerbitan ulang terfokus. Untuk perbaikan Plugin terpilih, teruskan `plugin_publish_scope=selected` dan `plugins=@openclaw/name` ke `OpenClaw Release Publish`, atau dispatch workflow anak secara langsung ketika paket OpenClaw tidak boleh diterbitkan.

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga boleh berupa SHA commit penuh 40 karakter dari cabang workflow saat ini untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk jalur penerbitan sebenarnya
- `preflight_run_id`: wajib pada jalur penerbitan sebenarnya agar workflow menggunakan ulang tarball yang disiapkan dari run preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur penerbitan; default-nya `beta`

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id run preflight `OpenClaw NPM Release` yang berhasil; wajib ketika `publish_openclaw_npm=true`
- `npm_dist_tag`: tag target npm untuk paket OpenClaw
- `plugin_publish_scope`: default-nya `all-publishable`; gunakan `selected` hanya untuk pekerjaan perbaikan terfokus
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma ketika `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default-nya `true`; setel `false` hanya ketika menggunakan workflow sebagai orkestrator perbaikan khusus Plugin
- `wait_for_clawhub`: default-nya `false` sehingga ketersediaan npm tidak diblokir oleh sidecar ClawHub; setel `true` hanya ketika penyelesaian workflow harus mencakup penyelesaian ClawHub

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: cabang, tag, atau SHA commit penuh untuk divalidasi. Pemeriksaan yang membawa secret mengharuskan commit hasil resolusi dapat dijangkau dari cabang OpenClaw atau tag rilis.
- `run_release_soak`: ikut serta dalam soak live/E2E menyeluruh, jalur rilis Docker, dan all-since upgrade-survivor pada pemeriksaan rilis stabil/default. Ini dipaksakan aktif oleh `release_profile=full`.

Aturan:

- Tag stabil dan koreksi boleh diterbitkan ke `beta` atau `latest`
- Tag prerelease beta hanya boleh diterbitkan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit penuh hanya diizinkan ketika `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya validasi
- Jalur penerbitan sebenarnya harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama preflight; workflow memverifikasi metadata itu sebelum penerbitan berlanjut

## Urutan rilis npm stabil

Saat memotong rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda boleh menggunakan SHA commit penuh dari cabang workflow saat ini untuk dry run khusus validasi pada workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur normal beta-dahulu, atau `latest` hanya ketika Anda sengaja menginginkan penerbitan stabil langsung
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau SHA commit penuh ketika Anda menginginkan CI normal plus cakupan cache prompt langsung, Docker, QA Lab, Matrix, dan Telegram dari satu workflow manual
4. Jika Anda sengaja hanya memerlukan graf pengujian normal yang deterministik, jalankan workflow manual `CI` pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag` yang sama, dan `preflight_run_id` yang disimpan; ini menerbitkan Plugin yang dieksternalkan ke npm dan ClawHub sebelum mempromosikan paket npm OpenClaw
7. Jika rilis mendarat di `beta`, gunakan workflow privat `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` untuk mempromosikan versi stabil itu dari `beta` ke `latest`
8. Jika rilis sengaja diterbitkan langsung ke `latest` dan `beta` harus segera mengikuti build stabil yang sama, gunakan workflow privat yang sama untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi pemulihan mandiri terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat untuk keamanan karena masih memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan penerbitan khusus OIDC.

Itu menjaga jalur penerbitan langsung dan jalur promosi beta-dahulu tetap terdokumentasi dan terlihat oleh operator.

Jika maintainer harus kembali ke autentikasi npm lokal, jalankan perintah CLI 1Password (`op`) apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op` langsung dari shell agent utama; menyimpannya di dalam tmux membuat prompt, alert, dan penanganan OTP dapat diamati serta mencegah alert host berulang.

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

Maintainer menggunakan dokumentasi rilis privat di [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) untuk runbook sebenarnya.

## Terkait

- [Channel rilis](/id/install/development-channels)
