---
read_when:
    - Mencari definisi saluran rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan kadensi rilis
summary: Jalur rilis, daftar periksa operator, box validasi, penamaan versi, dan ritme
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-06T17:59:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
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
- Jangan menambahkan nol di depan bulan atau hari
- `latest` berarti rilis npm stabil yang saat ini dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stabil dan rilis koreksi stabil dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang sudah diperiksa nanti
- Setiap rilis stabil OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/sign/notarize aplikasi Mac disisihkan untuk stabil kecuali diminta secara eksplisit

## Irama rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stabil menyusul hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari cabang `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi rilis dan perbaikan tidak memblokir
  pengembangan baru di `main`
- Jika tag beta telah didorong atau dipublikasikan dan memerlukan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Daftar periksa operator rilis

Daftar periksa ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: tarik yang terbaru, pastikan commit target sudah didorong,
   dan pastikan CI `main` saat ini cukup hijau untuk dibuatkan cabang darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, pertahankan entri tetap berorientasi pengguna, commit, push, dan rebase/pull
   sekali lagi sebelum membuat cabang.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas
   yang kedaluwarsa hanya ketika jalur peningkatan tetap tercakup, atau catat mengapa hal itu
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
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk cabang
   rilis, tag, atau SHA commit penuh. Ini adalah satu titik masuk manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di cabang rilis dan jalankan ulang file,
   jalur, job workflow, profil paket, provider, atau allowlist model terkecil yang gagal
   yang membuktikan perbaikan. Jalankan ulang umbrella penuh hanya ketika permukaan yang berubah membuat
   bukti sebelumnya basi.
9. Untuk beta, tag `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   cabang `release/YYYY.M.D` yang cocok. Workflow ini memverifikasi `pnpm plugins:sync:check`,
   mendispatch semua paket Plugin yang dapat dipublikasikan ke npm dan kumpulan yang sama ke
   ClawHub secara paralel, lalu mempromosikan artefak preflight npm OpenClaw yang disiapkan
   dengan dist-tag yang cocok segera setelah publikasi npm Plugin berhasil.
   Publikasi ClawHub mungkin masih berjalan saat npm OpenClaw dipublikasikan, tetapi
   workflow publikasi rilis tidak selesai sampai kedua jalur publikasi Plugin dan
   jalur publikasi npm OpenClaw selesai dengan sukses. Setelah publikasi, jalankan
   package acceptance pascapublikasi terhadap paket `openclaw@YYYY.M.D-beta.N` atau
   `openclaw@beta` yang dipublikasikan. Jika prarilis yang sudah didorong atau dipublikasikan memerlukan perbaikan,
   buat nomor prarilis cocok berikutnya; jangan hapus atau tulis ulang prarilis lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang telah diperiksa memiliki
    bukti validasi yang diperlukan. Publikasi npm stabil juga melalui
    `OpenClaw Release Publish`, menggunakan kembali artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stabil juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang sudah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
11. Setelah publikasi, jalankan verifier pascapublikasi npm, E2E Telegram published-npm
    mandiri opsional saat Anda memerlukan bukti channel pascapublikasi,
    promosi dist-tag saat diperlukan, catatan rilis/prarilis GitHub dari bagian
    `CHANGELOG.md` lengkap yang cocok, dan langkah-langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum preflight rilis agar TypeScript pengujian tetap
  tercakup di luar gerbang `pnpm check` lokal yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum preflight rilis agar pemeriksaan siklus
  impor dan batas arsitektur yang lebih luas hijau di luar gerbang lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak
  rilis `dist/*` yang diharapkan dan bundle Control UI tersedia untuk langkah
  validasi pack
- Jalankan `pnpm plugins:sync` setelah bump versi root dan sebelum tagging. Ini
  memperbarui versi paket plugin yang dapat dipublikasikan, metadata
  kompatibilitas peer/API OpenClaw, metadata build, dan stub changelog plugin
  agar cocok dengan versi rilis inti. `pnpm plugins:sync:check` adalah guard
  rilis non-mutating; alur kerja publikasi gagal sebelum mutasi registry apa pun
  jika langkah ini terlupakan.
- Jalankan alur kerja manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua kotak uji pra-rilis dari satu entrypoint. Ini menerima branch,
  tag, atau SHA commit penuh, men-dispatch `CI` manual, dan men-dispatch
  `OpenClaw Release Checks` untuk install smoke, package acceptance, pemeriksaan
  paket lintas-OS, paritas QA Lab, Matrix, dan lane Telegram. Run stabil/default
  menjaga live/E2E menyeluruh dan soak jalur rilis Docker di balik
  `run_release_soak=true`; `release_profile=full` memaksa soak aktif. Dengan
  `release_profile=full` dan `rerun_group=all`, ini juga menjalankan paket Telegram
  E2E terhadap artefak `release-package-under-test` dari pemeriksaan rilis.
  Berikan `npm_telegram_package_spec` setelah publikasi ketika Telegram E2E yang sama
  juga harus membuktikan paket npm yang dipublikasikan. Berikan
  `package_acceptance_package_spec` setelah publikasi ketika Package Acceptance
  harus menjalankan matriks paket/pembaruan terhadap paket npm yang telah dikirim
  alih-alih artefak yang dibangun dari SHA. Berikan
  `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa
  validasi cocok dengan paket npm yang dipublikasikan tanpa memaksa Telegram E2E.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan alur kerja manual `Package Acceptance` ketika Anda ingin bukti side-channel
  untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@beta`, `openclaw@latest`, atau versi rilis tepat; `source=ref`
  untuk mem-pack branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan
  SHA-256 wajib; atau `source=artifact` untuk tarball yang diunggah oleh run
  GitHub Actions lain. Alur kerja ini menyelesaikan kandidat menjadi
  `package-under-test`, menggunakan ulang scheduler rilis Docker E2E terhadap
  tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika
  lane Docker terpilih mencakup `published-upgrade-survivor`, artefak paket
  adalah kandidat dan `published_upgrade_survivor_baseline` memilih baseline
  yang dipublikasikan. `update-restart-auth` menggunakan paket kandidat sebagai
  CLI terinstal dan package-under-test sehingga ini melatih jalur restart
  terkelola dari perintah pembaruan kandidat.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane instal/channel/agent, jaringan Gateway, dan muat ulang konfigurasi
  - `package`: lane paket/pembaruan/restart/plugin native-artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket ditambah channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: chunk jalur rilis Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` tepat untuk rerun terfokus
- Jalankan alur kerja manual `CI` secara langsung ketika Anda hanya membutuhkan cakupan
  CI normal penuh untuk kandidat rilis. Dispatch CI manual melewati scoping perubahan
  dan memaksa shard Linux Node, shard plugin bundled, kontrak channel,
  kompatibilitas Node 22, lane `check`, `check-additional`, build smoke,
  pemeriksaan docs, Python skills, Windows, macOS, Android, dan Control UI i18n.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` ketika memvalidasi telemetri rilis. Ini melatih
  QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi nama span trace
  yang diekspor, atribut berbatas, serta redaksi konten/identifier tanpa
  memerlukan Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk urutan publikasi yang memutasi setelah
  tag tersedia. Dispatch dari `release/YYYY.M.D` (atau `main` ketika memublikasikan
  tag yang dapat dijangkau dari main), teruskan tag rilis dan
  `preflight_run_id` npm OpenClaw yang sukses, dan pertahankan scope publikasi
  plugin default `all-publishable` kecuali Anda sengaja menjalankan perbaikan
  terfokus. Alur kerja ini menserialkan publikasi npm plugin, publikasi ClawHub
  plugin, dan publikasi npm OpenClaw agar paket inti tidak dipublikasikan sebelum
  plugin yang dieksternalisasi.
- Pemeriksaan rilis sekarang berjalan dalam alur kerja manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan lane paritas mock QA Lab ditambah profil
  Matrix live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live
  menggunakan environment `qa-live-shared`; Telegram juga menggunakan lease
  kredensial CI Convex. Jalankan alur kerja manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris
  transport Matrix, media, dan E2EE penuh secara paralel.
- Validasi runtime instal dan upgrade lintas-OS adalah bagian dari
  `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil
  alur kerja reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap pendek,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap di
  lane sendiri agar tidak menahan atau memblokir publikasi
- Pemeriksaan rilis yang membawa secret harus di-dispatch melalui `Full Release
Validation` atau dari ref alur kerja `main`/rilis agar logika alur kerja dan
  secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit penuh selama
  commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Preflight validation-only `OpenClaw NPM Release` juga menerima SHA commit penuh
  40 karakter dari branch alur kerja saat ini tanpa memerlukan tag yang sudah di-push
- Jalur SHA itu hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi nyata
- Dalam mode SHA, alur kerja mensintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; publikasi nyata tetap memerlukan tag rilis nyata
- Kedua alur kerja menjaga jalur publikasi dan promosi nyata pada runner
  GitHub-hosted, sementara jalur validasi non-mutating dapat menggunakan runner
  Blacksmith Linux yang lebih besar
- Alur kerja itu menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret alur kerja `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Preflight rilis npm tidak lagi menunggu lane pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah publikasi npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instal registry
  yang dipublikasikan dalam prefix temp baru
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan E2E Telegram nyata
  terhadap paket npm yang dipublikasikan menggunakan pool kredensial Telegram leased bersama.
  One-off maintainer lokal dapat menghilangkan var Convex dan meneruskan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pasca-publikasi penuh dari mesin maintainer, gunakan `pnpm release:beta-smoke -- --beta betaN`. Helper menjalankan validasi pembaruan npm Parallels/target baru, men-dispatch `NPM Telegram Beta E2E`, melakukan polling run alur kerja yang tepat, mengunduh artefak, dan mencetak laporan Telegram.
- Maintainer dapat menjalankan pemeriksaan pasca-publikasi yang sama dari GitHub Actions melalui
  alur kerja manual `NPM Telegram Beta E2E`. Ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan preflight-lalu-promote:
  - publikasi npm nyata harus melewati `preflight_run_id` npm yang sukses
  - publikasi npm nyata harus di-dispatch dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run preflight yang sukses
  - rilis npm stabil default ke `beta`
  - publikasi npm stabil dapat menargetkan `latest` secara eksplisit melalui input alur kerja
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    untuk keamanan, karena `npm dist-tag add` masih membutuhkan `NPM_TOKEN` sementara
    repo publik mempertahankan publikasi hanya OIDC
  - `macOS Release` publik hanya validasi; ketika tag hanya ada pada
    branch rilis tetapi alur kerja di-dispatch dari `main`, setel
    `public_release_branch=release/YYYY.M.D`
  - publikasi mac privat nyata harus melewati `preflight_run_id` dan
    `validate_run_id` mac privat yang sukses
  - jalur publikasi nyata mempromosikan artefak yang disiapkan alih-alih membangunnya
    lagi
- Untuk rilis koreksi stabil seperti `YYYY.M.D-N`, verifier pasca-publikasi
  juga memeriksa jalur upgrade temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  agar koreksi rilis tidak diam-diam meninggalkan instal global lama pada
  payload stabil dasar
- Preflight rilis npm gagal tertutup kecuali tarball mencakup
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pasca-publikasi juga memeriksa bahwa entrypoint plugin yang dipublikasikan dan
  metadata paket ada dalam layout registry terinstal. Rilis yang
  mengirim payload runtime plugin yang hilang menggagalkan verifier postpublish dan
  tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball pembaruan kandidat, sehingga e2e installer menangkap pack bloat
  yang tidak disengaja sebelum jalur publikasi rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing plugin, atau
  matriks pengujian plugin, regenerasikan dan tinjau output matriks
  `plugin-prerelease-extension-shard` milik planner dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  mendeskripsikan layout CI yang basi
- Kesiapan rilis macOS stabil juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` terpaket
  - `appcast.xml` pada `main` harus menunjuk ke zip stabil baru setelah publikasi
  - aplikasi terpaket harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas floor build Sparkle kanonis
    untuk versi rilis tersebut

## Kotak uji rilis

`Full Release Validation` adalah cara operator memulai semua pengujian pra-rilis dari
satu entrypoint. Untuk bukti commit yang di-pin pada branch yang bergerak cepat, gunakan
helper agar setiap alur kerja child berjalan dari branch sementara yang tetap pada target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper men-push `release-ci/<sha>-...`, men-dispatch `Full Release Validation`
dari branch itu dengan `ref=<sha>`, memverifikasi setiap `headSha` alur kerja child
cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian
run child `main` yang lebih baru secara tidak sengaja.

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
`target_ref=<release-ref>`, menjalankan `OpenClaw Release Checks`, menyiapkan artefak
induk `release-package-under-test` untuk pemeriksaan yang berhadapan dengan paket, dan
menjalankan paket mandiri Telegram E2E saat `release_profile=full` dengan
`rerun_group=all` atau saat `npm_telegram_package_spec` ditetapkan. `OpenClaw Release
Checks` kemudian menyebar ke install smoke, pemeriksaan rilis lintas-OS, cakupan jalur rilis Docker live/E2E
saat soak diaktifkan, Package Acceptance dengan QA paket Telegram,
paritas QA Lab, Matrix live, dan Telegram live. Eksekusi penuh hanya dapat diterima saat ringkasan
`Full Release Validation`
menampilkan `normal_ci` dan `release_checks` berhasil. Dalam mode full/all,
child `npm_telegram` juga harus berhasil; di luar full/all, itu dilewati
kecuali `npm_telegram_package_spec` yang telah dipublikasikan diberikan. Ringkasan
verifier akhir mencakup tabel pekerjaan paling lambat untuk setiap child run, sehingga manajer rilis
dapat melihat jalur kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap lengkap, nama job alur kerja yang tepat, perbedaan profil stable versus full,
artefak, dan handle rerun terfokus.
Alur kerja child dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan saat `ref` target menunjuk ke
branch atau tag rilis yang lebih lama. Tidak ada input workflow-ref Full Release Validation
terpisah; pilih harness tepercaya dengan memilih ref workflow run.
Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit yang tepat pada `main` yang bergerak;
SHA commit mentah tidak dapat menjadi ref workflow dispatch, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat branch sementara yang dipin.

Gunakan `release_profile` untuk memilih keluasan live/provider:

- `minimum`: jalur OpenAI/core live dan Docker tercepat yang kritis untuk rilis
- `stable`: minimum ditambah cakupan provider/backend stable untuk persetujuan rilis
- `full`: stable ditambah cakupan provider/media advisory yang luas

Gunakan `run_release_soak=true` dengan `stable` saat lane pemblokir rilis
hijau dan Anda menginginkan sweep live/E2E yang menyeluruh, jalur rilis Docker, dan
upgrade-survivor terpublikasi yang dibatasi sebelum promosi. Sweep tersebut mencakup
empat paket stable terbaru ditambah baseline `2026.4.23` dan `2026.5.2`
yang dipin serta cakupan `2026.4.15` yang lebih lama, dengan baseline duplikat dihapus dan
setiap baseline di-shard ke job runner Docker sendiri. `full` menyiratkan
`run_release_soak=true`.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk menyelesaikan target
ref sekali sebagai `release-package-under-test` dan menggunakan kembali artefak tersebut di pemeriksaan lintas-OS,
Package Acceptance, dan Docker jalur rilis saat soak berjalan. Ini menjaga
semua box yang berhadapan dengan paket tetap pada byte yang sama dan menghindari build paket berulang.
Install smoke OpenAI lintas-OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat
variabel repo/org ditetapkan, jika tidak `openai/gpt-5.4`, karena lane ini
membuktikan instalasi paket, onboarding, startup gateway, dan satu giliran agen live
alih-alih melakukan benchmark model default paling lambat. Matriks provider live
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

Jangan gunakan umbrella penuh sebagai rerun pertama setelah perbaikan terfokus. Jika satu box
gagal, gunakan alur kerja child, job, lane Docker, profil paket, provider model,
atau lane QA yang gagal untuk bukti berikutnya. Jalankan umbrella penuh lagi hanya saat
perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua-box sebelumnya
kedaluwarsa. Verifier akhir umbrella memeriksa ulang id workflow run child yang direkam,
jadi setelah alur kerja child berhasil dijalankan ulang, jalankan ulang hanya job induk
`Verify full validation` yang gagal.

Untuk pemulihan terbatas, teruskan `rerun_group` ke umbrella. `all` adalah run
release-candidate nyata, `ci` hanya menjalankan child CI normal, `plugin-prerelease`
hanya menjalankan child Plugin khusus rilis, `release-checks` menjalankan setiap box rilis,
dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`.
Rerun `npm-telegram` terfokus memerlukan `npm_telegram_package_spec`; run full/all
dengan `release_profile=full` menggunakan artefak paket release-checks. Rerun
lintas-OS terfokus dapat menambahkan `cross_os_suite_filter=windows/packaged-upgrade` atau
filter OS/suite lain. Kegagalan QA release-check bersifat advisory; kegagalan khusus QA
tidak memblokir validasi rilis.

### Vitest

Box Vitest adalah alur kerja child `CI` manual. CI manual sengaja
melewati changed scoping dan memaksa grafik pengujian normal untuk release
candidate: shard Linux Node, shard Plugin bawaan, kontrak channel, kompatibilitas Node 22,
`check`, `check-additional`, build smoke, pemeriksaan docs, Python
skills, Windows, macOS, Android, dan Control UI i18n.

Gunakan box ini untuk menjawab "apakah source tree lolos suite pengujian normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dijalankan
- run `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artefak timing Vitest seperti `.artifacts/vitest-shard-timings.json` saat
  run memerlukan analisis performa

Jalankan CI manual secara langsung hanya saat rilis memerlukan CI normal yang deterministik tetapi
bukan box Docker, QA Lab, live, lintas-OS, atau paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, ditambah alur kerja
`install-smoke` mode rilis. Ini memvalidasi release candidate melalui lingkungan
Docker terpaket alih-alih hanya pengujian tingkat sumber.

Cakupan Docker rilis mencakup:

- install smoke penuh dengan slow Bun global install smoke diaktifkan
- persiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target, dengan job QR,
  root/gateway, dan installer/Bun smoke berjalan sebagai shard install-smoke terpisah
- lane E2E repositori
- chunk Docker jalur rilis: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, dan `plugins-runtime-install-h`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` saat diminta
- lane install/uninstall Plugin bawaan terpisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker saat pemeriksaan rilis
  mencakup suite live

Gunakan artefak Docker sebelum menjalankan ulang. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
timing fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada alur kerja live/E2E reusable alih-alih
menjalankan ulang semua chunk rilis. Perintah rerun yang dihasilkan menyertakan
`package_artifact_run_id` sebelumnya dan input image Docker yang disiapkan saat tersedia, sehingga
lane yang gagal dapat menggunakan kembali tarball dan image GHCR yang sama.

### QA Lab

Box QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Ini adalah gate rilis
perilaku agentic dan tingkat channel, terpisah dari Vitest dan mekanik paket
Docker.

Cakupan QA Lab rilis mencakup:

- lane paritas mock yang membandingkan lane kandidat OpenAI dengan baseline Opus 4.6
  menggunakan paket paritas agentic
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial Convex CI
- `pnpm qa:otel:smoke` saat telemetri rilis memerlukan bukti lokal eksplisit

Gunakan box ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan
alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram
saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai run QA-Lab
manual yang di-shard, bukan lane kritis rilis default.

### Paket

Box Paket adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan
kandidat menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, serta menjaga
ref harness alur kerja terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw
  yang tepat
- `source=ref`: pack branch, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS dengan `package_sha256` wajib
- `source=artifact`: gunakan kembali `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak
paket rilis yang disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, update,
restart update auth terkonfigurasi, pembersihan dependensi Plugin usang, fixture Plugin offline,
update Plugin, dan QA paket Telegram terhadap tarball terselesaikan yang sama. Pemeriksaan rilis
pemblokir menggunakan baseline paket terpublikasi terbaru default; `run_release_soak=true` atau
`release_profile=full` diperluas ke setiap baseline stable yang dipublikasikan npm dari
`2026.4.23` hingga `latest` ditambah fixture masalah yang dilaporkan. Gunakan
Package Acceptance dengan `source=npm` untuk kandidat yang sudah dikirim, atau
`source=ref`/`source=artifact` untuk tarball npm lokal yang didukung SHA sebelum
publikasi. Ini adalah pengganti GitHub-native
untuk sebagian besar cakupan paket/update yang sebelumnya memerlukan
Parallels. Pemeriksaan rilis lintas-OS tetap penting untuk onboarding,
installer, dan perilaku platform spesifik OS, tetapi validasi produk paket/update sebaiknya
mengutamakan Package Acceptance.

Checklist kanonis untuk validasi update dan Plugin adalah
[Menguji update dan Plugin](/id/help/testing-updates-plugins). Gunakan saat
memutuskan lane lokal, Docker, Package Acceptance, atau release-check mana yang membuktikan
instal/update Plugin, pembersihan doctor, atau perubahan migrasi paket terpublikasi.
Migrasi update terpublikasi yang menyeluruh dari setiap paket stable `2026.4.23+` adalah
alur kerja manual `Update Migration` terpisah, bukan bagian dari Full Release CI.

Kelonggaran package-acceptance lama sengaja dibatasi waktunya. Paket hingga
`2026.4.25` boleh menggunakan jalur kompatibilitas untuk celah metadata yang sudah diterbitkan
ke npm: entri inventaris QA privat yang hilang dari tarball, `gateway install --wrapper` yang hilang, file patch yang hilang di fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi catatan instalasi plugin lama, persistensi catatan instalasi marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Paket `2026.4.26` yang diterbitkan boleh memperingatkan untuk file stempel metadata build lokal yang sudah dikirimkan. Paket yang lebih baru harus memenuhi kontrak paket modern; celah yang sama menggagalkan validasi rilis.

Gunakan profil Package Acceptance yang lebih luas saat pertanyaan rilis berkaitan dengan paket yang benar-benar dapat diinstal:

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

- `smoke`: jalur cepat instalasi paket/channel/agent, jaringan gateway, dan muat ulang konfigurasi
- `package`: kontrak paket instalasi/pembaruan/mulai ulang/plugin tanpa ClawHub langsung; ini adalah default pemeriksaan rilis
- `product`: `package` ditambah channel MCP, pembersihan cron/subagent, pencarian web OpenAI, dan OpenWebUI
- `full`: potongan jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk rerun terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Package Acceptance. Workflow meneruskan tarball
`package-under-test` yang sudah diselesaikan ke jalur Telegram; workflow Telegram mandiri tetap menerima spesifikasi npm yang diterbitkan untuk pemeriksaan pascapublikasi.

## Otomasi publikasi rilis

`OpenClaw Release Publish` adalah entrypoint publikasi mutasi normal. Ia
mengorkestrasi workflow trusted-publisher dalam urutan yang diperlukan rilis:

1. Checkout tag rilis dan selesaikan commit SHA-nya.
2. Verifikasi tag dapat dijangkau dari `main` atau `release/*`.
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan scope dan SHA yang sama.
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

Gunakan workflow tingkat lebih rendah `Plugin NPM Release` dan `Plugin ClawHub Release`
hanya untuk perbaikan atau publikasi ulang terfokus. Untuk perbaikan plugin terpilih, berikan
`plugin_publish_scope=selected` dan `plugins=@openclaw/name` ke
`OpenClaw Release Publish`, atau dispatch workflow anak secara langsung saat paket
OpenClaw tidak boleh diterbitkan.

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; saat `preflight_only=true`, ini juga boleh berupa commit SHA penuh 40 karakter dari cabang workflow saat ini untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk jalur publikasi nyata
- `preflight_run_id`: wajib pada jalur publikasi nyata agar workflow menggunakan ulang tarball yang disiapkan dari run preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publikasi; default ke `beta`

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id run preflight `OpenClaw NPM Release` yang berhasil;
  wajib saat `publish_openclaw_npm=true`
- `npm_dist_tag`: tag target npm untuk paket OpenClaw
- `plugin_publish_scope`: default ke `all-publishable`; gunakan `selected` hanya
  untuk pekerjaan perbaikan terfokus
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma saat
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default ke `true`; setel `false` hanya saat menggunakan workflow sebagai orkestrator perbaikan khusus plugin

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: cabang, tag, atau commit SHA penuh untuk divalidasi. Pemeriksaan yang membawa rahasia mengharuskan commit yang diselesaikan dapat dijangkau dari cabang OpenClaw atau tag rilis.
- `run_release_soak`: ikut serta dalam soak live/E2E menyeluruh, jalur rilis Docker, dan all-since upgrade-survivor pada pemeriksaan rilis stabil/default. Ini dipaksa aktif oleh `release_profile=full`.

Aturan:

- Tag stabil dan koreksi boleh diterbitkan ke `beta` atau `latest`
- Tag prerelease beta hanya boleh diterbitkan ke `beta`
- Untuk `OpenClaw NPM Release`, input commit SHA penuh hanya diizinkan saat
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya validasi
- Jalur publikasi nyata harus menggunakan `npm_dist_tag` yang sama seperti saat preflight;
  workflow memverifikasi metadata itu sebelum publikasi berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda boleh menggunakan commit SHA penuh dari cabang workflow saat ini untuk dry run khusus validasi atas workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur normal beta-dulu, atau `latest` hanya
   saat Anda sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau commit SHA penuh saat Anda menginginkan CI normal plus cakupan live prompt cache, Docker, QA Lab, Matrix, dan Telegram dari satu workflow manual
4. Jika Anda sengaja hanya membutuhkan grafik pengujian normal deterministik, jalankan workflow manual `CI` pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag` yang sama,
   dan `preflight_run_id` tersimpan; ini menerbitkan plugin yang dieksternalkan ke npm
   dan ClawHub sebelum mempromosikan paket npm OpenClaw
7. Jika rilis mendarat di `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil itu dari `beta` ke `latest`
8. Jika rilis sengaja diterbitkan langsung ke `latest` dan `beta`
   harus segera mengikuti build stabil yang sama, gunakan workflow privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi pemulihan mandiri terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih memerlukan
`NPM_TOKEN`, sementara repo publik tetap mempertahankan publikasi hanya OIDC.

Itu menjaga jalur publikasi langsung dan jalur promosi beta-dulu sama-sama terdokumentasi dan terlihat oleh operator.

Jika maintainer harus kembali ke autentikasi npm lokal, jalankan perintah CLI 1Password (`op`) apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op` langsung dari shell agent utama; menahannya di dalam tmux membuat prompt, peringatan, dan penanganan OTP dapat diamati serta mencegah peringatan host berulang.

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
