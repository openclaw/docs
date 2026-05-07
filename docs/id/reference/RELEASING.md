---
read_when:
    - Mencari definisi kanal rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan jadwal rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan ritme
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-07T15:08:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` ketika diminta secara eksplisit
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: head `main` yang terus bergerak

## Penamaan versi

- Versi rilis stabil: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stabil: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prarilis beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan menambahkan nol di depan bulan atau hari
- `latest` berarti rilis npm stabil yang sedang dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stabil dan rilis koreksi stabil dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang sudah diperiksa nanti
- Setiap rilis stabil OpenClaw mengirim paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/sign/notarize aplikasi mac dicadangkan untuk stabil kecuali diminta secara eksplisit

## Irama rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stabil mengikuti hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari cabang `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak menghambat
  pengembangan baru di `main`
- Jika tag beta sudah didorong atau dipublikasikan dan memerlukan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan bersifat
  khusus maintainer

## Checklist operator rilis

Checklist ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarization, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: tarik yang terbaru, konfirmasi commit target sudah didorong,
   dan konfirmasi CI `main` saat ini cukup hijau untuk membuat cabang darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, pertahankan entri agar berorientasi pengguna, commit, dorong, dan rebase/tarik
   sekali lagi sebelum membuat cabang.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas yang kedaluwarsa
   hanya ketika jalur peningkatan tetap tercakup, atau catat mengapa hal itu
   sengaja dipertahankan.
4. Buat `release/YYYY.M.D` dari `main` saat ini; jangan melakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dimaksud, lalu jalankan
   `pnpm release:prep`. Ini menyegarkan versi Plugin, inventaris Plugin, skema
   konfigurasi, metadata konfigurasi channel bawaan, baseline dokumen konfigurasi, ekspor SDK
   Plugin, dan baseline API SDK Plugin dalam urutan yang benar. Commit setiap drift yang
   dihasilkan sebelum memberi tag. Lalu jalankan preflight deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, dan `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA cabang rilis penuh 40 karakter diperbolehkan untuk preflight khusus validasi.
   Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk
   cabang rilis, tag, atau SHA commit penuh. Ini adalah satu entrypoint manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di cabang rilis dan jalankan ulang file, lane,
   job workflow, profil paket, provider, atau allowlist model terkecil yang gagal yang
   membuktikan perbaikan. Jalankan ulang umbrella penuh hanya ketika surface yang berubah membuat
   bukti sebelumnya menjadi basi.
9. Untuk beta, beri tag `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   cabang `release/YYYY.M.D` yang cocok. Ini memverifikasi `pnpm plugins:sync:check`,
   mendispatch semua paket Plugin yang dapat dipublikasikan ke npm dan set yang sama ke
   ClawHub secara paralel, lalu mempromosikan artefak preflight npm OpenClaw yang sudah disiapkan
   dengan dist-tag yang cocok segera setelah publikasi npm Plugin berhasil.
   Publikasi ClawHub mungkin masih berjalan saat npm OpenClaw dipublikasikan, tetapi
   workflow publikasi rilis mencetak ID run anak segera. Secara default workflow ini
   tidak menunggu ClawHub setelah mendispatchnya, sehingga ketersediaan npm OpenClaw
   tidak terhambat oleh persetujuan ClawHub atau pekerjaan registry yang lebih lambat; atur
   `wait_for_clawhub=true` ketika ClawHub harus memblokir penyelesaian workflow. Jalur
   ClawHub mencoba ulang kegagalan instalasi dependensi CLI yang sementara, memublikasikan
   Plugin yang lulus pratinjau bahkan ketika satu sel pratinjau flaky, dan berakhir dengan
   verifikasi registry untuk setiap versi Plugin yang diharapkan sehingga publikasi parsial
   tetap terlihat dan dapat dicoba ulang. Setelah publikasi, jalankan
   penerimaan paket pascapublikasi
   terhadap paket `openclaw@YYYY.M.D-beta.N` atau
   `openclaw@beta` yang sudah dipublikasikan. Jika prarilis yang sudah didorong atau dipublikasikan memerlukan perbaikan,
   buat nomor prarilis cocok berikutnya; jangan hapus atau tulis ulang prarilis lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang sudah diperiksa memiliki
    bukti validasi yang diperlukan. Publikasi npm stabil juga melalui
    `OpenClaw Release Publish`, menggunakan ulang artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stabil juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang sudah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
11. Setelah publikasi, jalankan verifier npm pascapublikasi, E2E Telegram
    published-npm mandiri opsional ketika Anda memerlukan bukti channel pascapublikasi,
    promosi dist-tag ketika diperlukan, catatan rilis/prarilis GitHub dari
    bagian `CHANGELOG.md` cocok yang lengkap, dan langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum preflight rilis agar TypeScript pengujian tetap
  tercakup di luar gate `pnpm check` lokal yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum preflight rilis agar pemeriksaan siklus
  impor dan batas arsitektur yang lebih luas sudah hijau di luar gate lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak
  rilis `dist/*` yang diharapkan dan bundel Control UI tersedia untuk langkah
  validasi pack
- Jalankan `pnpm release:prep` setelah bump versi root dan sebelum tagging. Ini
  menjalankan setiap generator rilis deterministik yang umum bergeser setelah
  perubahan versi/konfigurasi/API: versi Plugin, inventaris Plugin, skema
  konfigurasi dasar, metadata konfigurasi channel bawaan, baseline dokumentasi
  konfigurasi, ekspor SDK Plugin, dan baseline API SDK Plugin. `pnpm release:check` menjalankan ulang guard tersebut
  dalam mode pemeriksaan dan melaporkan setiap kegagalan drift tergenerasi yang ditemukan dalam satu
  lintasan sebelum menjalankan pemeriksaan rilis paket.
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua kotak pengujian pra-rilis dari satu entrypoint. Ini menerima branch,
  tag, atau SHA commit lengkap, men-dispatch `CI` manual, dan men-dispatch
  `OpenClaw Release Checks` untuk install smoke, package acceptance, pemeriksaan
  paket lintas-OS, paritas QA Lab, Matrix, dan lane Telegram. Run stabil/default
  menahan live/E2E menyeluruh dan soak jalur rilis Docker di balik
  `run_release_soak=true`; `release_profile=full` memaksa soak aktif. Dengan
  `release_profile=full` dan `rerun_group=all`, ini juga menjalankan paket Telegram
  E2E terhadap artefak `release-package-under-test` dari pemeriksaan rilis.
  Berikan `npm_telegram_package_spec` setelah publikasi ketika E2E
  Telegram yang sama juga harus membuktikan paket npm yang diterbitkan. Berikan
  `package_acceptance_package_spec` setelah publikasi ketika Package Acceptance
  harus menjalankan matriks paket/update terhadap paket npm yang dikirim, bukan
  artefak yang dibangun dari SHA. Berikan
  `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa
  validasi cocok dengan paket npm yang diterbitkan tanpa memaksa Telegram E2E.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti side-channel
  untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@beta`, `openclaw@latest`, atau versi rilis yang tepat; `source=ref`
  untuk mem-pack branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256
  wajib; atau `source=artifact` untuk tarball yang diunggah oleh run GitHub
  Actions lain. Workflow menyelesaikan kandidat menjadi
  `package-under-test`, menggunakan ulang scheduler rilis Docker E2E terhadap
  tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika
  lane Docker yang dipilih mencakup `published-upgrade-survivor`, artefak
  paket adalah kandidat dan `published_upgrade_survivor_baseline` memilih
  baseline yang diterbitkan. `update-restart-auth` menggunakan paket kandidat sebagai
  CLI yang terinstal sekaligus package-under-test sehingga ini melatih jalur
  restart terkelola perintah update kandidat.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane install/channel/agent, jaringan Gateway, dan muat ulang konfigurasi
  - `package`: lane paket/update/restart/Plugin native artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket plus channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: chunk jalur rilis Docker dengan OpenWebUI
  - `custom`: pemilihan `docker_lanes` yang tepat untuk rerun terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya membutuhkan cakupan CI
  normal penuh untuk kandidat rilis. Dispatch CI manual melewati cakupan berubah
  dan memaksa shard Linux Node, shard Plugin bawaan, kontrak channel,
  kompatibilitas Node 22, `check`, `check-additional`, build smoke,
  pemeriksaan dokumentasi, Skills Python, Windows, macOS, Android, dan lane i18n Control UI.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` ketika memvalidasi telemetri rilis. Ini melatih
  QA-lab melalui receiver OTLP/HTTP lokal dan memverifikasi nama span trace
  yang diekspor, atribut terbatas, dan redaksi konten/pengidentifikasi tanpa
  memerlukan Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk urutan publikasi yang memutasi setelah
  tag tersedia. Dispatch dari `release/YYYY.M.D` (atau `main` ketika menerbitkan
  tag yang dapat dijangkau dari main), berikan tag rilis dan `preflight_run_id`
  npm OpenClaw yang berhasil, dan pertahankan scope publikasi Plugin default
  `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Workflow
  menserialkan publikasi npm Plugin, publikasi ClawHub Plugin, dan publikasi npm OpenClaw
  agar paket inti tidak diterbitkan sebelum Plugin eksternalnya.
- Pemeriksaan rilis sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan lane paritas mock QA Lab plus profil
  Matrix live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live
  menggunakan environment `qa-live-shared`; Telegram juga menggunakan lease
  kredensial CI Convex. Jalankan workflow manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris
  transport Matrix, media, dan E2EE penuh secara paralel.
- Validasi runtime install dan upgrade lintas-OS adalah bagian dari
  `OpenClaw Release Checks` publik dan `Full Release Validation`, yang memanggil
  workflow reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di
  lane sendiri sehingga tidak menahan atau memblokir publikasi
- Pemeriksaan rilis yang membawa rahasia harus di-dispatch melalui `Full Release
Validation` atau dari workflow ref `main`/rilis agar logika workflow dan
  rahasia tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama
  commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Preflight khusus-validasi `OpenClaw NPM Release` juga menerima SHA commit
  branch workflow 40 karakter lengkap saat ini tanpa memerlukan tag yang di-push
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi nyata
- Dalam mode SHA, workflow menyintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; publikasi nyata tetap memerlukan tag rilis nyata
- Kedua workflow mempertahankan jalur publikasi dan promosi nyata di runner
  GitHub-hosted, sementara jalur validasi yang tidak memutasi dapat menggunakan runner
  Blacksmith Linux yang lebih besar
- Workflow tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Preflight rilis npm tidak lagi menunggu lane pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah publikasi npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur install registry
  yang diterbitkan dalam prefix temp baru
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan E2E Telegram nyata
  terhadap paket npm yang diterbitkan menggunakan pool kredensial Telegram tersewa bersama.
  One-off maintainer lokal dapat menghilangkan var Convex dan memberikan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pasca-publikasi penuh dari mesin maintainer, gunakan `pnpm release:beta-smoke -- --beta betaN`. Helper menjalankan validasi update npm/fresh-target Parallels, men-dispatch `NPM Telegram Beta E2E`, mem-poll run workflow yang tepat, mengunduh artefak, dan mencetak laporan Telegram.
- Maintainer dapat menjalankan pemeriksaan pasca-publikasi yang sama dari GitHub Actions melalui
  workflow manual `NPM Telegram Beta E2E`. Ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan preflight-lalu-promote:
  - publikasi npm nyata harus melewati `preflight_run_id` npm yang berhasil
  - publikasi npm nyata harus di-dispatch dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run preflight yang berhasil
  - rilis npm stabil default ke `beta`
  - publikasi npm stabil dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi npm dist-tag berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    untuk keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara repo
    publik mempertahankan publikasi hanya OIDC
  - `macOS Release` publik hanya validasi; ketika tag hanya ada di
    branch rilis tetapi workflow di-dispatch dari `main`, set
    `public_release_branch=release/YYYY.M.D`
  - publikasi mac privat nyata harus melewati
    `preflight_run_id` dan `validate_run_id` mac privat yang berhasil
  - jalur publikasi nyata mempromosikan artefak yang telah disiapkan, bukan membangunnya
    lagi
- Untuk rilis koreksi stabil seperti `YYYY.M.D-N`, verifier pasca-publikasi
  juga memeriksa jalur upgrade temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  sehingga koreksi rilis tidak dapat diam-diam meninggalkan install global lama pada
  payload stabil dasar
- Preflight rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pasca-publikasi juga memeriksa bahwa entrypoint Plugin yang diterbitkan dan
  metadata paket hadir dalam tata letak registry yang terinstal. Rilis yang
  mengirim payload runtime Plugin yang hilang akan menggagalkan verifier postpublish dan
  tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball update kandidat, sehingga e2e installer menangkap bloat pack yang tidak disengaja
  sebelum jalur publikasi rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing ekstensi, atau
  matriks pengujian ekstensi, regenerasi dan tinjau output matriks
  `plugin-prerelease-extension-shard` milik planner dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  mendeskripsikan tata letak CI yang basi
- Kesiapan rilis macOS stabil juga mencakup surface updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang dipaketkan
  - `appcast.xml` di `main` harus menunjuk ke zip stabil baru setelah publikasi
  - app yang dipaketkan harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas floor build Sparkle kanonis
    untuk versi rilis tersebut

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai semua pengujian pra-rilis dari
satu entrypoint. Untuk bukti commit yang di-pin pada branch yang bergerak cepat, gunakan
helper agar setiap workflow anak berjalan dari branch sementara yang ditetapkan pada
SHA target:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper mendorong `release-ci/<sha>-...`, men-dispatch `Full Release Validation`
dari branch tersebut dengan `ref=<sha>`, memverifikasi setiap `headSha` workflow anak
cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian run
anak `main` yang lebih baru secara tidak sengaja.

Untuk validasi branch atau tag rilis, jalankan dari ref workflow `main`
tepercaya dan teruskan branch atau tag rilis sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow menyelesaikan ref target, mem-dispatch `CI` manual dengan
`target_ref=<release-ref>`, mem-dispatch `OpenClaw Release Checks`, menyiapkan
artefak induk `release-package-under-test` untuk pemeriksaan yang menghadap
paket, dan mem-dispatch E2E Telegram paket mandiri saat `release_profile=full`
dengan `rerun_group=all` atau saat `npm_telegram_package_spec` ditetapkan.
`OpenClaw Release Checks` kemudian menjalankan secara paralel install smoke,
pemeriksaan rilis lintas OS, cakupan jalur rilis Docker live/E2E saat soak
diaktifkan, Package Acceptance dengan QA paket Telegram, paritas QA Lab, Matrix
live, dan Telegram live. Run penuh hanya dapat diterima saat ringkasan
`Full Release Validation` menampilkan `normal_ci` dan `release_checks` berhasil.
Dalam mode full/all, turunan `npm_telegram` juga harus berhasil; di luar
full/all, ini dilewati kecuali `npm_telegram_package_spec` yang sudah
dipublikasikan disediakan. Ringkasan verifier akhir menyertakan tabel job
terlambat untuk setiap run turunan, sehingga manajer rilis dapat melihat jalur
kritis saat ini tanpa mengunduh log. Lihat [Validasi rilis penuh](/id/reference/full-release-validation)
untuk matriks tahap lengkap, nama job workflow persis, perbedaan profil stable
versus full, artefak, dan handle rerun terfokus. Workflow turunan di-dispatch
dari ref tepercaya yang menjalankan `Full Release Validation`, biasanya
`--ref main`, bahkan saat `ref` target menunjuk ke branch atau tag rilis yang
lebih lama. Tidak ada input workflow-ref Full Release Validation terpisah; pilih
harness tepercaya dengan memilih ref run workflow. Jangan gunakan
`--ref main -f ref=<sha>` untuk bukti commit persis pada `main` yang bergerak;
SHA commit mentah tidak dapat menjadi ref dispatch workflow, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat branch sementara yang dipin.

Gunakan `release_profile` untuk memilih cakupan live/provider:

- `minimum`: jalur Docker dan live OpenAI/core yang paling cepat dan kritis untuk rilis
- `stable`: minimum ditambah cakupan provider/backend stable untuk persetujuan rilis
- `full`: stable ditambah cakupan provider/media advisory yang luas

Gunakan `run_release_soak=true` dengan `stable` saat lane pemblokir rilis sudah
hijau dan Anda menginginkan sweep live/E2E, jalur rilis Docker, dan upgrade-survivor
terpublikasi terbatas yang menyeluruh sebelum promosi. Sweep itu mencakup
empat paket stable terbaru plus baseline `2026.4.23` dan `2026.5.2` yang dipin
plus cakupan `2026.4.15` yang lebih lama, dengan baseline duplikat dihapus dan
setiap baseline di-shard ke job runner Docker tersendiri. `full` menyiratkan
`run_release_soak=true`.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan
ref target sekali sebagai `release-package-under-test` dan menggunakan kembali
artefak itu dalam pemeriksaan lintas OS, Package Acceptance, dan Docker jalur
rilis saat soak berjalan. Ini menjaga semua kotak yang menghadap paket pada
byte yang sama dan menghindari build paket berulang. Install smoke OpenAI
lintas OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat variabel repo/org
ditetapkan, jika tidak `openai/gpt-5.4`, karena lane ini membuktikan instalasi
paket, onboarding, startup gateway, dan satu giliran agen live, bukan melakukan
benchmark pada model default paling lambat. Matriks provider live yang lebih
luas tetap menjadi tempat untuk cakupan khusus model.

Gunakan varian ini sesuai tahap rilis:

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
Jika satu kotak gagal, gunakan workflow turunan, job, lane Docker, profil paket,
provider model, atau lane QA yang gagal untuk bukti berikutnya. Jalankan lagi
umbrella penuh hanya saat perbaikan mengubah orkestrasi rilis bersama atau
membuat bukti semua kotak sebelumnya menjadi basi. Verifier akhir umbrella
memeriksa ulang id run workflow turunan yang terekam, jadi setelah workflow
turunan berhasil dijalankan ulang, rerun hanya job induk `Verify full validation`
yang gagal.

Untuk pemulihan terbatas, teruskan `rerun_group` ke umbrella. `all` adalah run
kandidat rilis nyata, `ci` hanya menjalankan turunan CI normal,
`plugin-prerelease` hanya menjalankan turunan Plugin khusus rilis,
`release-checks` menjalankan setiap kotak rilis, dan grup rilis yang lebih
sempit adalah `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live`, dan `npm-telegram`. Rerun `npm-telegram` terfokus
memerlukan `npm_telegram_package_spec`; run full/all dengan `release_profile=full`
menggunakan artefak paket release-checks. Rerun lintas OS terfokus dapat
menambahkan `cross_os_suite_filter=windows/packaged-upgrade` atau filter
OS/suite lain. Kegagalan release-check QA bersifat advisory; kegagalan khusus
QA tidak memblokir validasi rilis.

### Vitest

Kotak Vitest adalah workflow turunan `CI` manual. CI manual sengaja melewati
scoping perubahan dan memaksa grafik pengujian normal untuk kandidat rilis:
shard Linux Node, shard Plugin bawaan, kontrak channel, kompatibilitas Node 22,
`check`, `check-additional`, build smoke, pemeriksaan dokumen, Skills Python,
Windows, macOS, Android, dan i18n Control UI.

Gunakan kotak ini untuk menjawab "apakah source tree lulus suite pengujian
normal penuh?" Ini tidak sama dengan validasi produk jalur rilis. Bukti yang
harus disimpan:

- Ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang di-dispatch
- Run `CI` hijau pada SHA target persis
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artefak timing Vitest seperti `.artifacts/vitest-shard-timings.json` saat
  run memerlukan analisis performa

Jalankan CI manual secara langsung hanya saat rilis memerlukan CI normal
deterministik tetapi tidak memerlukan Docker, QA Lab, live, lintas OS, atau
kotak paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Kotak Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, plus workflow `install-smoke` mode
rilis. Ini memvalidasi kandidat rilis melalui lingkungan Docker terpaket alih-alih
hanya pengujian tingkat sumber.

Cakupan Docker rilis mencakup:

- install smoke penuh dengan slow Bun global install smoke diaktifkan
- persiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target, dengan job QR,
  root/Gateway, dan installer/Bun smoke berjalan sebagai shard install-smoke terpisah
- lane E2E repositori
- chunk Docker jalur rilis: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, dan `plugins-runtime-install-h`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` saat diminta
- lane instal/uninstal Plugin bawaan terpisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker saat release checks
  menyertakan suite live

Gunakan artefak Docker sebelum rerun. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
timing fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan
terfokus, gunakan `docker_lanes=<lane[,lane]>` pada workflow live/E2E reusable
alih-alih menjalankan ulang semua chunk rilis. Perintah rerun yang dihasilkan
menyertakan `package_artifact_run_id` sebelumnya dan input image Docker yang
sudah disiapkan saat tersedia, sehingga lane yang gagal dapat menggunakan
ulang tarball dan image GHCR yang sama.

### QA Lab

Kotak QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Ini adalah
gate rilis perilaku agentic dan tingkat channel, terpisah dari Vitest dan
mekanika paket Docker.

Cakupan QA Lab rilis mencakup:

- lane paritas mock yang membandingkan lane kandidat OpenAI terhadap baseline Opus 4.6
  menggunakan agentic parity pack
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial CI Convex
- `pnpm qa:otel:smoke` saat telemetri rilis memerlukan bukti lokal eksplisit

Gunakan kotak ini untuk menjawab "apakah rilis berperilaku benar dalam skenario
QA dan alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan
Telegram saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai
run QA-Lab sharded manual, bukan lane kritis-rilis default.

### Paket

Kotak Package adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan kandidat
menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, serta menjaga ref harness
workflow terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw persis
- `source=ref`: mengemas branch, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: mengunduh `.tgz` HTTPS dengan `package_sha256` wajib
- `source=artifact`: menggunakan ulang `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`,
artefak paket rilis yang disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, update,
restart update auth terkonfigurasi, pembersihan dependensi Plugin basi, fixture
Plugin offline, update Plugin, dan QA paket Telegram terhadap tarball terselesaikan
yang sama. Release checks pemblokir menggunakan baseline paket terpublikasi
terbaru default; `run_release_soak=true` atau `release_profile=full` memperluasnya
ke setiap baseline npm-published stable dari `2026.4.23` hingga `latest` plus
fixture isu yang dilaporkan. Gunakan Package Acceptance dengan `source=npm`
untuk kandidat yang sudah dikirimkan, atau `source=ref`/`source=artifact` untuk
tarball npm lokal berbasis SHA sebelum publikasi. Ini adalah pengganti native
GitHub untuk sebagian besar cakupan package/update yang sebelumnya memerlukan
Parallels. Release checks lintas OS tetap penting untuk onboarding khusus OS,
installer, dan perilaku platform, tetapi validasi produk package/update
sebaiknya mengutamakan Package Acceptance.

Checklist kanonis untuk validasi update dan Plugin adalah
[Pengujian update dan Plugin](/id/help/testing-updates-plugins). Gunakan ini saat
memutuskan lane lokal, Docker, Package Acceptance, atau release-check mana yang
membuktikan perubahan instal/update Plugin, pembersihan doctor, atau migrasi
paket terpublikasi. Migrasi update terpublikasi yang menyeluruh dari setiap
paket stable `2026.4.23+` adalah workflow `Update Migration` manual terpisah,
bukan bagian dari Full Release CI.

Kelonggaran penerimaan paket legacy sengaja dibatasi waktu. Paket hingga
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang
sudah dipublikasikan ke npm: entri inventaris QA privat yang tidak ada di
tarball, `gateway install --wrapper` yang tidak ada, file patch yang tidak ada
di fixture git turunan tarball, `update.channel` yang dipersistenkan tidak ada,
lokasi catatan instalasi Plugin legacy, persistensi catatan instalasi
marketplace yang tidak ada, dan migrasi metadata konfigurasi selama
`plugins update`. Paket `2026.4.26` yang dipublikasikan dapat memperingatkan
file stempel metadata build lokal yang sudah dikirimkan. Paket berikutnya harus
memenuhi kontrak paket modern; celah yang sama tersebut menggagalkan validasi
rilis.

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

- `smoke`: jalur instalasi paket/kanal/agen cepat, jaringan Gateway, dan muat
  ulang konfigurasi
- `package`: kontrak paket instalasi/pembaruan/restart/Plugin tanpa ClawHub
  live; ini adalah default pemeriksaan rilis
- `product`: `package` ditambah kanal MCP, pembersihan Cron/subagen, pencarian
  web OpenAI, dan OpenWebUI
- `full`: potongan jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk rerun terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` di Package Acceptance. Alur kerja meneruskan
tarball `package-under-test` yang diselesaikan ke jalur Telegram; alur kerja
Telegram mandiri masih menerima spesifikasi npm yang dipublikasikan untuk
pemeriksaan pascapublikasi.

## Otomatisasi publikasi rilis

`OpenClaw Release Publish` adalah titik masuk publikasi bermutasi normal. Ia
mengorkestrasi alur kerja trusted-publisher dalam urutan yang dibutuhkan rilis:

1. Checkout tag rilis dan selesaikan SHA commit-nya.
2. Verifikasi tag dapat dijangkau dari `main` atau `release/*`.
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

Gunakan alur kerja tingkat lebih rendah `Plugin NPM Release` dan
`Plugin ClawHub Release` hanya untuk pekerjaan perbaikan atau publikasi ulang
yang terfokus. Untuk perbaikan Plugin terpilih, teruskan
`plugin_publish_scope=selected` dan `plugins=@openclaw/name` ke
`OpenClaw Release Publish`, atau dispatch alur kerja anak secara langsung ketika
paket OpenClaw tidak boleh dipublikasikan.

## Input alur kerja NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga dapat berupa SHA
  commit cabang alur kerja 40 karakter penuh saat ini untuk preflight khusus
  validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk
  jalur publikasi nyata
- `preflight_run_id`: wajib pada jalur publikasi nyata agar alur kerja
  menggunakan kembali tarball yang disiapkan dari run preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publikasi; default ke `beta`

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id run preflight `OpenClaw NPM Release` yang berhasil;
  wajib ketika `publish_openclaw_npm=true`
- `npm_dist_tag`: tag target npm untuk paket OpenClaw
- `plugin_publish_scope`: default ke `all-publishable`; gunakan `selected`
  hanya untuk pekerjaan perbaikan terfokus
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma ketika
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default ke `true`; setel `false` hanya ketika
  menggunakan alur kerja sebagai orkestrator perbaikan khusus Plugin

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: cabang, tag, atau SHA commit penuh untuk divalidasi. Pemeriksaan yang
  membawa secret mengharuskan commit yang diselesaikan dapat dijangkau dari
  cabang OpenClaw atau tag rilis.
- `run_release_soak`: ikut serta dalam soak live/E2E menyeluruh, jalur rilis
  Docker, dan upgrade-survivor all-since pada pemeriksaan rilis
  stabil/default. Ini dipaksa aktif oleh `release_profile=full`.

Aturan:

- Tag stabil dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prarilis beta hanya dapat dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit penuh hanya diizinkan ketika
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya validasi
- Jalur publikasi nyata harus menggunakan `npm_dist_tag` yang sama dengan yang
  digunakan selama preflight; alur kerja memverifikasi metadata itu sebelum
  publikasi berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit cabang alur kerja penuh
     saat ini untuk dry run khusus validasi dari alur kerja preflight
2. Pilih `npm_dist_tag=beta` untuk alur beta-first normal, atau `latest` hanya
   ketika Anda sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau SHA
   commit penuh ketika Anda menginginkan CI normal ditambah cakupan cache prompt
   live, Docker, QA Lab, Matrix, dan Telegram dari satu alur kerja manual
4. Jika Anda sengaja hanya membutuhkan grafik pengujian normal deterministik,
   jalankan alur kerja manual `CI` pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama,
   `npm_dist_tag` yang sama, dan `preflight_run_id` yang disimpan; ini
   memublikasikan Plugin yang dieksternalisasi ke npm dan ClawHub sebelum
   mempromosikan paket npm OpenClaw
7. Jika rilis mendarat di `beta`, gunakan alur kerja privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil itu dari `beta` ke `latest`
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta` harus
   segera mengikuti build stabil yang sama, gunakan alur kerja privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi
   pemulihan mandiri terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih memerlukan
`NPM_TOKEN`, sementara repo publik mempertahankan publikasi hanya OIDC.

Ini membuat jalur publikasi langsung dan jalur promosi beta-first sama-sama
terdokumentasi dan terlihat oleh operator.

Jika maintainer harus kembali ke autentikasi npm lokal, jalankan perintah CLI
1Password (`op`) apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op`
langsung dari shell agen utama; menjaganya di dalam tmux membuat prompt,
peringatan, dan penanganan OTP dapat diamati serta mencegah peringatan host
berulang.

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
untuk runbook aktual.

## Terkait

- [Kanal rilis](/id/install/development-channels)
