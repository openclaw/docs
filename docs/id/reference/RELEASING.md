---
read_when:
    - Mencari definisi saluran rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan kadensi
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan irama
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-11T20:34:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` saat diminta secara eksplisit
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: posisi terbaru yang terus bergerak dari `main`

## Penamaan versi

- Versi rilis stabil: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stabil: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prarilis beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan beri nol di depan bulan atau hari
- `latest` berarti rilis npm stabil yang saat ini dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stabil dan koreksi stabil dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang sudah diperiksa nanti
- Setiap rilis stabil OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/sign/notarize aplikasi mac disediakan untuk rilis stabil kecuali diminta secara eksplisit

## Irama rilis

- Rilis bergerak dengan beta lebih dahulu
- Stabil mengikuti hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari branch `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta sudah di-push atau dipublikasikan dan perlu perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan bersifat
  khusus maintainer

## Daftar periksa operator rilis

Daftar periksa ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarization, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: tarik yang terbaru, konfirmasi commit target sudah di-push,
   dan konfirmasi CI `main` saat ini cukup hijau untuk membuat branch darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, pertahankan entri agar berorientasi pengguna, commit, push, lalu rebase/pull
   sekali lagi sebelum membuat branch.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas
   yang kedaluwarsa hanya ketika jalur upgrade tetap tercakup, atau catat mengapa kompatibilitas itu
   sengaja dipertahankan.
4. Buat `release/YYYY.M.D` dari `main` saat ini; jangan melakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dimaksud, lalu jalankan
   `pnpm release:prep`. Perintah ini menyegarkan versi Plugin, inventaris Plugin, skema config,
   metadata config channel bawaan, baseline docs config, ekspor SDK Plugin,
   dan baseline API SDK Plugin dalam urutan yang benar. Commit setiap drift yang dihasilkan
   sebelum memberi tag. Lalu jalankan preflight deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, dan `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA branch rilis sepanjang 40 karakter penuh diizinkan untuk preflight khusus validasi.
   Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk
   branch rilis, tag, atau SHA commit penuh. Ini adalah satu entrypoint manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di branch rilis dan jalankan ulang file, lane,
   job workflow, profil paket, provider, atau allowlist model terkecil yang gagal
   yang membuktikan perbaikan. Jalankan ulang payung penuh hanya ketika permukaan yang berubah membuat
   bukti sebelumnya tidak lagi berlaku.
9. Untuk beta, beri tag `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   branch `release/YYYY.M.D` yang sesuai. Perintah ini memverifikasi `pnpm plugins:sync:check`,
   mengirim semua paket Plugin yang dapat dipublikasikan ke npm dan set yang sama ke
   ClawHub secara paralel, lalu mempromosikan artefak preflight npm OpenClaw yang sudah disiapkan
   dengan dist-tag yang sesuai segera setelah publikasi npm Plugin berhasil.
   Setelah child publish npm OpenClaw berhasil, workflow ini membuat atau memperbarui
   halaman rilis/prarilis GitHub yang sesuai dari bagian `CHANGELOG.md`
   lengkap yang cocok. Rilis stabil yang dipublikasikan ke npm `latest` menjadi
   rilis terbaru GitHub; rilis pemeliharaan stabil yang tetap berada di npm `beta`
   dibuat dengan GitHub `latest=false`.
   Publikasi ClawHub mungkin masih berjalan saat npm OpenClaw dipublikasikan, tetapi
   workflow publish rilis langsung mencetak ID run child. Secara default,
   workflow ini tidak menunggu ClawHub setelah mengirimkannya, sehingga ketersediaan npm OpenClaw
   tidak diblokir oleh persetujuan ClawHub atau pekerjaan registry yang lebih lambat; set
   `wait_for_clawhub=true` ketika ClawHub harus memblokir penyelesaian workflow. Jalur
   ClawHub mencoba ulang kegagalan instalasi dependensi CLI yang sementara, memublikasikan
   Plugin yang lolos pratinjau bahkan ketika satu sel pratinjau bermasalah, dan berakhir dengan
   verifikasi registry untuk setiap versi Plugin yang diharapkan sehingga publikasi parsial
   tetap terlihat dan dapat dicoba ulang. Setelah publish, jalankan
   penerimaan paket pascapublikasi
   terhadap paket `openclaw@YYYY.M.D-beta.N` atau
   `openclaw@beta` yang sudah dipublikasikan. Jika prarilis yang sudah di-push atau dipublikasikan perlu perbaikan,
   buat nomor prarilis berikutnya yang sesuai; jangan hapus atau tulis ulang prarilis lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang sudah diperiksa memiliki
    bukti validasi yang diperlukan. Publish npm stabil juga melalui
    `OpenClaw Release Publish`, menggunakan ulang artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stabil juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang sudah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
    Workflow publish macOS privat memublikasikan appcast bertanda tangan ke `main`
    publik secara otomatis setelah aset rilis terverifikasi; jika proteksi branch memblokir
    push langsung, workflow ini membuka atau memperbarui PR appcast.
11. Setelah publish, jalankan verifier npm pascapublikasi, E2E Telegram npm terpublikasi
    standalone opsional saat Anda memerlukan bukti channel pascapublikasi,
    promosi dist-tag bila diperlukan, verifikasi halaman rilis GitHub yang dihasilkan,
    dan jalankan langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum preflight rilis agar TypeScript pengujian tetap
  tercakup di luar gate `pnpm check` lokal yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum preflight rilis agar pemeriksaan siklus
  impor dan batas arsitektur yang lebih luas berstatus hijau di luar gate lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak
  rilis `dist/*` yang diharapkan dan bundel Control UI ada untuk langkah validasi pack
- Jalankan `pnpm release:prep` setelah bump versi root dan sebelum penandaan tag. Perintah ini
  menjalankan setiap generator rilis deterministik yang umum bergeser setelah
  perubahan versi/konfigurasi/API: versi plugin, inventaris plugin, skema konfigurasi
  dasar, metadata konfigurasi channel bawaan, baseline docs konfigurasi, ekspor plugin SDK,
  dan baseline API plugin SDK. `pnpm release:check` menjalankan ulang guard tersebut
  dalam mode pemeriksaan dan melaporkan setiap kegagalan drift yang dihasilkan dalam satu
  pass sebelum menjalankan pemeriksaan rilis paket.
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua test box pra-rilis dari satu entrypoint. Workflow ini menerima branch,
  tag, atau SHA commit lengkap, menjalankan `CI` manual, dan menjalankan
  `OpenClaw Release Checks` untuk install smoke, penerimaan paket, pemeriksaan paket
  lintas-OS, paritas QA Lab, Matrix, dan lane Telegram. Jalankan stabil/default
  mempertahankan live/E2E lengkap dan soak jalur rilis Docker di balik
  `run_release_soak=true`; `release_profile=full` memaksa soak aktif. Dengan
  `release_profile=full` dan `rerun_group=all`, workflow ini juga menjalankan package Telegram
  E2E terhadap artefak `release-package-under-test` dari release checks.
  Berikan `release_package_spec` setelah menerbitkan beta untuk menggunakan kembali paket
  npm yang sudah dikirim di release checks, Package Acceptance, dan package Telegram
  E2E tanpa membangun ulang tarball rilis. Berikan
  `npm_telegram_package_spec` hanya ketika Telegram harus menggunakan paket terbitan yang berbeda
  dari validasi rilis lainnya. Berikan
  `package_acceptance_package_spec` ketika Package Acceptance harus menggunakan
  paket terbitan yang berbeda dari spesifikasi paket rilis. Berikan
  `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa
  validasi cocok dengan paket npm yang sudah diterbitkan tanpa memaksa Telegram E2E.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti side-channel
  untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@beta`, `openclaw@latest`, atau versi rilis yang tepat; `source=ref`
  untuk mem-pack branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256 wajib;
  atau `source=artifact` untuk tarball yang diunggah oleh run GitHub
  Actions lain. Workflow ini menyelesaikan kandidat menjadi
  `package-under-test`, menggunakan ulang penjadwal rilis Docker E2E terhadap tarball tersebut,
  dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika
  lane Docker terpilih menyertakan `published-upgrade-survivor`, artefak paket adalah
  kandidat dan `published_upgrade_survivor_baseline` memilih baseline yang diterbitkan.
  `update-restart-auth` menggunakan paket kandidat sebagai CLI terpasang sekaligus
  package-under-test sehingga menguji jalur restart terkelola dari perintah update kandidat.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane install/channel/agent, jaringan Gateway, dan muat ulang konfigurasi
  - `package`: lane paket/update/restart/plugin native artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil package ditambah channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: chunk jalur rilis Docker dengan OpenWebUI
  - `custom`: pemilihan `docker_lanes` yang tepat untuk rerun terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya membutuhkan cakupan CI normal penuh
  untuk kandidat rilis. Dispatch CI manual melewati cakupan changed
  dan memaksa shard Linux Node, shard bundled-plugin, kontrak channel,
  kompatibilitas Node 22, `check`, `check-additional`, build smoke,
  pemeriksaan docs, Skills Python, Windows, macOS, Android, dan lane i18n Control UI.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` saat memvalidasi telemetri rilis. Perintah ini menguji
  QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi nama span trace yang diekspor,
  atribut terbatas, serta redaksi konten/identifier tanpa
  memerlukan Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk urutan publish yang memutasi setelah
  tag ada. Dispatch dari `release/YYYY.M.D` (atau `main` saat menerbitkan
  tag yang dapat dijangkau dari main), berikan tag rilis dan
  `preflight_run_id` npm OpenClaw yang berhasil, dan pertahankan cakupan publish plugin default
  `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Workflow ini
  menserialkan publish npm plugin, publish ClawHub plugin, dan publish npm OpenClaw
  agar paket core tidak dipublikasikan sebelum plugin eksternalnya.
- Release checks sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan lane paritas mock QA Lab ditambah profil
  Matrix live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live
  menggunakan environment `qa-live-shared`; Telegram juga menggunakan lease kredensial CI
  Convex. Jalankan workflow manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris
  transport, media, dan E2EE Matrix penuh secara paralel.
- Validasi runtime install dan upgrade lintas-OS adalah bagian dari
  `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil
  workflow reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap di
  lane sendiri agar tidak menghentikan atau memblokir publish
- Release checks yang membawa secret harus di-dispatch melalui `Full Release
Validation` atau dari ref workflow `main`/release agar logika workflow dan
  secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama
  commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Preflight khusus validasi `OpenClaw NPM Release` juga menerima SHA commit
  branch workflow penuh 40 karakter saat ini tanpa memerlukan tag yang sudah dipush
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publish nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk pemeriksaan
  metadata paket; publish nyata tetap memerlukan tag rilis nyata
- Kedua workflow mempertahankan jalur publish dan promosi nyata di runner GitHub-hosted,
  sementara jalur validasi non-mutasi dapat menggunakan runner Linux Blacksmith yang lebih besar
- Workflow tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Preflight rilis npm tidak lagi menunggu lane release checks terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah publish npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur install registry
  yang diterbitkan dalam prefix temp baru
- Setelah publish beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terpasang, penyiapan Telegram, dan Telegram E2E nyata
  terhadap paket npm yang diterbitkan menggunakan pool kredensial Telegram leased bersama.
  One-off maintainer lokal boleh menghilangkan var Convex dan memberikan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pasca-publish penuh dari mesin maintainer, gunakan `pnpm release:beta-smoke -- --beta betaN`. Helper ini menjalankan validasi update npm Parallels/fresh-target, men-dispatch `NPM Telegram Beta E2E`, melakukan polling run workflow yang tepat, mengunduh artefak, dan mencetak laporan Telegram.
- Maintainer dapat menjalankan pemeriksaan pasca-publish yang sama dari GitHub Actions melalui
  workflow manual `NPM Telegram Beta E2E`. Workflow ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan preflight-lalu-promote:
  - publish npm nyata harus lulus `preflight_run_id` npm yang berhasil
  - publish npm nyata harus di-dispatch dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run preflight yang berhasil
  - rilis npm stabil default ke `beta`
  - publish npm stabil dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    untuk keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara repo
    publik mempertahankan publish hanya OIDC
  - `macOS Release` publik hanya validasi; ketika tag hanya ada di
    branch rilis tetapi workflow di-dispatch dari `main`, setel
    `public_release_branch=release/YYYY.M.D`
  - publish mac privat nyata harus lulus `preflight_run_id` dan `validate_run_id`
    mac privat yang berhasil
  - jalur publish nyata mempromosikan artefak yang sudah disiapkan alih-alih membangunnya
    kembali
- Untuk rilis koreksi stabil seperti `YYYY.M.D-N`, verifier pasca-publish
  juga memeriksa jalur upgrade temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  sehingga koreksi rilis tidak bisa diam-diam meninggalkan install global lama pada
  payload stabil dasar
- Preflight rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pasca-publish juga memeriksa bahwa entrypoint plugin yang diterbitkan dan
  metadata paket ada dalam layout registry yang terpasang. Rilis yang
  mengirim payload runtime plugin yang hilang akan menggagalkan verifier postpublish dan
  tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball update kandidat, sehingga installer e2e menangkap pack bloat yang tidak disengaja
  sebelum jalur publish rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing plugin, atau
  matriks pengujian plugin, regenerasi dan tinjau output matriks
  `plugin-prerelease-extension-shard` milik planner dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  menjelaskan layout CI yang basi
- Kesiapan rilis macOS stabil juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang sudah dipaketkan
  - `appcast.xml` di `main` harus menunjuk ke zip stabil baru setelah publish; workflow
    publish macOS privat meng-commitnya secara otomatis, atau membuka PR appcast
    ketika push langsung diblokir
  - app yang dipaketkan harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas floor build Sparkle kanonis
    untuk versi rilis tersebut

## Test box rilis

`Full Release Validation` adalah cara operator memulai semua pengujian pra-rilis dari
satu entrypoint. Untuk bukti commit terpin pada branch yang bergerak cepat, gunakan
helper agar setiap workflow turunan berjalan dari branch sementara yang dipatok pada SHA
target:

```bash
pnpm ci:full-release --sha <full-sha>
```

Pembantu mendorong `release-ci/<sha>-...`, menjalankan `Full Release Validation`
dari cabang tersebut dengan `ref=<sha>`, memverifikasi setiap workflow turunan `headSha`
cocok dengan target, lalu menghapus cabang sementara. Ini menghindari pembuktian
run turunan `main` yang lebih baru secara tidak sengaja.

Untuk validasi cabang atau tag rilis, jalankan dari ref workflow `main` tepercaya
dan berikan cabang atau tag rilis sebagai `ref`:

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
artefak induk `release-package-under-test` untuk pemeriksaan yang berhadapan
dengan paket, dan menjalankan E2E Telegram paket mandiri ketika
`release_profile=full` dengan `rerun_group=all` atau ketika
`release_package_spec` atau `npm_telegram_package_spec` diatur. `OpenClaw Release
Checks` lalu menyebar ke smoke install, pemeriksaan rilis lintas OS, cakupan
jalur rilis live/E2E Docker ketika soak diaktifkan, Package Acceptance dengan QA
paket Telegram, paritas QA Lab, Matrix live, dan Telegram live. Run penuh hanya dapat diterima ketika
ringkasan `Full Release Validation`
menampilkan `normal_ci` dan `release_checks` sebagai berhasil. Dalam mode full/all,
turunan `npm_telegram` juga harus berhasil; di luar full/all, ini dilewati
kecuali `release_package_spec` atau `npm_telegram_package_spec` yang sudah dipublikasikan
diberikan. Ringkasan verifier akhir mencakup tabel pekerjaan paling lambat untuk setiap run turunan, sehingga manajer rilis dapat melihat jalur kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap lengkap, nama pekerjaan workflow yang tepat, perbedaan profil
stable versus full, artefak, dan handle rerun terfokus.
Workflow turunan dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan ketika `ref` target menunjuk ke
cabang atau tag rilis yang lebih lama. Tidak ada input ref workflow Full Release Validation
terpisah; pilih harness tepercaya dengan memilih ref run workflow.
Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit persis pada `main`
yang bergerak; SHA commit mentah tidak dapat menjadi ref workflow dispatch, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat cabang sementara yang dipin.

Gunakan `release_profile` untuk memilih cakupan live/provider:

- `minimum`: jalur OpenAI/core live dan Docker paling cepat yang kritis untuk rilis
- `stable`: minimum plus cakupan provider/backend stable untuk persetujuan rilis
- `full`: stable plus cakupan provider/media advisori yang luas

Gunakan `run_release_soak=true` dengan `stable` ketika lane yang memblokir rilis
sudah hijau dan Anda menginginkan live/E2E menyeluruh, jalur rilis Docker, dan
sweep upgrade-survivor terpublikasi yang terbatas sebelum promosi. Sweep tersebut mencakup
empat paket stable terbaru plus baseline `2026.4.23` dan `2026.5.2`
yang dipin plus cakupan `2026.4.15` yang lebih lama, dengan baseline duplikat dihapus dan
setiap baseline dishard ke pekerjaan runner Docker-nya sendiri. `full` menyiratkan
`run_release_soak=true`.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref target
sekali sebagai `release-package-under-test` dan menggunakan kembali artefak tersebut dalam pemeriksaan lintas OS,
Package Acceptance, dan Docker jalur rilis ketika soak berjalan. Ini menjaga
semua box yang berhadapan dengan paket pada byte yang sama dan menghindari build paket berulang.
Setelah beta sudah ada di npm, atur `release_package_spec=openclaw@YYYY.M.D-beta.N`
agar pemeriksaan rilis mengunduh paket yang dikirim satu kali, mengekstrak SHA sumber build-nya
dari `dist/build-info.json`, dan menggunakan kembali artefak tersebut untuk lane lintas OS,
Package Acceptance, Docker jalur rilis, dan Telegram paket.
Smoke install OpenAI lintas OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika
variabel repo/org diatur, jika tidak `openai/gpt-5.4`, karena lane ini
membuktikan install paket, onboarding, startup Gateway, dan satu giliran agen live
alih-alih membenchmark model default paling lambat. Matriks provider live yang lebih luas
tetap menjadi tempat untuk cakupan khusus model.

Gunakan varian berikut tergantung tahap rilis:

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

Jangan gunakan payung penuh sebagai rerun pertama setelah perbaikan terfokus. Jika satu box
gagal, gunakan workflow turunan yang gagal, pekerjaan, lane Docker, profil paket, provider
model, atau lane QA untuk bukti berikutnya. Jalankan payung penuh lagi hanya ketika
perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua box sebelumnya
kedaluwarsa. Verifier akhir payung memeriksa ulang id run workflow turunan yang direkam,
jadi setelah workflow turunan berhasil direrun, rerun hanya pekerjaan induk
`Verify full validation` yang gagal.

Untuk pemulihan terbatas, berikan `rerun_group` ke payung. `all` adalah run
kandidat rilis yang sebenarnya, `ci` hanya menjalankan turunan CI normal, `plugin-prerelease`
hanya menjalankan turunan Plugin khusus rilis, `release-checks` menjalankan setiap box rilis,
dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`.
Rerun `npm-telegram` terfokus memerlukan `release_package_spec` atau
`npm_telegram_package_spec`; run full/all dengan `release_profile=full` menggunakan
artefak paket release-checks. Rerun
lintas OS terfokus dapat menambahkan `cross_os_suite_filter=windows/packaged-upgrade` atau
filter OS/suite lain. Kegagalan QA release-check bersifat advisori; kegagalan khusus QA
tidak memblokir validasi rilis.

### Vitest

Box Vitest adalah workflow turunan `CI` manual. CI manual dengan sengaja
melewati cakupan perubahan dan memaksa grafik pengujian normal untuk kandidat rilis:
shard Linux Node, shard Plugin bundel, kontrak channel, kompatibilitas Node 22,
`check`, `check-additional`, smoke build, pemeriksaan docs, Python
Skills, Windows, macOS, Android, dan i18n Control UI.

Gunakan box ini untuk menjawab "apakah source tree lulus suite pengujian normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dijalankan
- run `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari pekerjaan CI ketika menyelidiki regresi
- artefak waktu Vitest seperti `.artifacts/vitest-shard-timings.json` ketika
  run memerlukan analisis performa

Jalankan CI manual secara langsung hanya ketika rilis memerlukan CI normal deterministik tetapi
bukan box Docker, QA Lab, live, lintas OS, atau paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, plus workflow `install-smoke`
mode rilis. Ini memvalidasi kandidat rilis melalui lingkungan Docker terpaket
alih-alih hanya pengujian level sumber.

Cakupan Docker rilis mencakup:

- smoke install penuh dengan smoke install global Bun yang lambat diaktifkan
- persiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target, dengan pekerjaan QR,
  root/gateway, dan installer/Bun smoke berjalan sebagai shard install-smoke terpisah
- lane E2E repositori
- chunk Docker jalur rilis: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, dan `plugins-runtime-install-h`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` ketika diminta
- lane install/uninstall Plugin bundel yang dipecah
  `bundled-plugin-install-uninstall-0` sampai
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker ketika pemeriksaan rilis
  mencakup suite live

Gunakan artefak Docker sebelum rerun. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
waktu fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada workflow live/E2E reusable alih-alih
mererun semua chunk rilis. Perintah rerun yang dihasilkan mencakup
`package_artifact_run_id` sebelumnya dan input image Docker yang disiapkan ketika tersedia, sehingga
lane yang gagal dapat menggunakan kembali tarball dan image GHCR yang sama.

### QA Lab

Box QA Lab juga bagian dari `OpenClaw Release Checks`. Ini adalah gate rilis
perilaku agentic dan level channel, terpisah dari mekanik paket Vitest dan Docker.

Cakupan QA Lab rilis mencakup:

- lane paritas mock yang membandingkan lane kandidat OpenAI terhadap baseline Opus 4.6
  menggunakan pack paritas agentic
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial CI Convex
- `pnpm qa:otel:smoke` ketika telemetri rilis memerlukan bukti lokal eksplisit

Gunakan box ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan
alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram
ketika menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai run QA-Lab
sharded manual, bukan lane kritis rilis default.

### Paket

Box Paket adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan
kandidat menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, dan menjaga
ref harness workflow terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw
  yang tepat
- `source=ref`: mengemas cabang, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: mengunduh `.tgz` HTTPS dengan `package_sha256` wajib
- `source=artifact`: menggunakan kembali `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak
paket rilis yang disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, update,
restart update auth terkonfigurasi, install skill ClawHub live, pembersihan dependensi Plugin usang, fixture Plugin offline,
update Plugin, dan QA paket Telegram terhadap tarball terselesaikan yang sama.
Pemeriksaan rilis yang memblokir menggunakan baseline paket terpublikasi terbaru default;
`run_release_soak=true` atau
`release_profile=full` memperluas ke setiap baseline stable yang dipublikasikan npm dari
`2026.4.23` hingga `latest` plus fixture issue yang dilaporkan. Gunakan
Package Acceptance dengan `source=npm` untuk kandidat yang sudah dikirim, atau
`source=ref`/`source=artifact` untuk tarball npm lokal berbasis SHA sebelum
publish. Ini adalah pengganti native GitHub
untuk sebagian besar cakupan paket/update yang sebelumnya memerlukan
Parallels. Pemeriksaan rilis lintas OS tetap penting untuk onboarding,
installer, dan perilaku platform khusus OS, tetapi validasi produk paket/update harus
lebih memilih Package Acceptance.

Daftar periksa kanonis untuk validasi pembaruan dan Plugin adalah
[Menguji pembaruan dan plugin](/id/help/testing-updates-plugins). Gunakan saat
memutuskan jalur lokal, Docker, Penerimaan Paket, atau pemeriksaan rilis mana
yang membuktikan perubahan instalasi/pembaruan Plugin, pembersihan doctor, atau
migrasi paket terbitan. Migrasi pembaruan terbitan menyeluruh dari setiap paket
stabil `2026.4.23+` adalah workflow `Update Migration` manual terpisah, bukan
bagian dari CI Rilis Lengkap.

Kelonggaran penerimaan paket lama sengaja dibatasi waktunya. Paket hingga
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang
sudah diterbitkan ke npm: entri inventaris QA privat yang hilang dari tarball,
`gateway install --wrapper` yang hilang, file patch yang hilang di fixture git
turunan tarball, `update.channel` persisten yang hilang, lokasi catatan instalasi
Plugin lama, persistensi catatan instalasi marketplace yang hilang, dan migrasi
metadata konfigurasi selama `plugins update`. Paket `2026.4.26` yang diterbitkan
dapat memperingatkan untuk file stempel metadata build lokal yang sudah dikirimkan.
Paket yang lebih baru harus memenuhi kontrak paket modern; celah yang sama akan
menggagalkan validasi rilis.

Gunakan profil Penerimaan Paket yang lebih luas saat pertanyaan rilis berkaitan
dengan paket yang benar-benar dapat diinstal:

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

- `smoke`: jalur cepat untuk instalasi paket/channel/agent, jaringan gateway,
  dan muat ulang konfigurasi
- `package`: kontrak paket instalasi/pembaruan/mulai ulang/Plugin plus bukti
  instalasi skill ClawHub live; ini adalah default pemeriksaan rilis
- `product`: `package` plus channel MCP, pembersihan cron/subagent, pencarian web
  OpenAI, dan OpenWebUI
- `full`: bagian jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk pengulangan terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Penerimaan Paket. Workflow meneruskan tarball
`package-under-test` yang sudah di-resolve ke jalur Telegram; workflow Telegram
mandiri tetap menerima spesifikasi npm terbitan untuk pemeriksaan pascaterbit.

## Otomasi penerbitan rilis

`OpenClaw Release Publish` adalah entrypoint penerbitan mutatif normal. Ini
mengorkestrasi workflow penerbit tepercaya dalam urutan yang dibutuhkan rilis:

1. Checkout tag rilis dan resolve SHA commit-nya.
2. Verifikasi tag dapat dijangkau dari `main` atau `release/*`.
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan cakupan dan SHA yang sama.
6. Dispatch `OpenClaw NPM Release` dengan tag rilis, dist-tag npm, dan
   `preflight_run_id` tersimpan.

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

Gunakan workflow tingkat lebih rendah `Plugin NPM Release` dan
`Plugin ClawHub Release` hanya untuk pekerjaan perbaikan atau penerbitan ulang
terfokus. Untuk perbaikan Plugin terpilih, teruskan
`plugin_publish_scope=selected` dan `plugins=@openclaw/name` ke
`OpenClaw Release Publish`, atau dispatch workflow anak secara langsung saat
paket OpenClaw tidak boleh diterbitkan.

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; saat `preflight_only=true`, ini juga dapat berupa SHA
  commit branch workflow 40 karakter penuh saat ini untuk preflight khusus
  validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk jalur
  penerbitan sebenarnya
- `preflight_run_id`: wajib pada jalur penerbitan sebenarnya agar workflow
  menggunakan ulang tarball yang disiapkan dari preflight run yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur penerbitan; default ke `beta`

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id preflight run `OpenClaw NPM Release` yang berhasil;
  wajib saat `publish_openclaw_npm=true`
- `npm_dist_tag`: tag target npm untuk paket OpenClaw
- `plugin_publish_scope`: default ke `all-publishable`; gunakan `selected` hanya
  untuk pekerjaan perbaikan terfokus
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma saat
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default ke `true`; setel `false` hanya saat menggunakan
  workflow sebagai orkestrator perbaikan khusus Plugin

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: branch, tag, atau SHA commit penuh untuk divalidasi. Pemeriksaan yang
  membawa rahasia mengharuskan commit yang di-resolve dapat dijangkau dari branch
  OpenClaw atau tag rilis.
- `run_release_soak`: ikut serta dalam live/E2E menyeluruh, jalur rilis Docker,
  dan soak upgrade-survivor seluruh-sejak pada pemeriksaan rilis stabil/default.
  Ini dipaksa aktif oleh `release_profile=full`.

Aturan:

- Tag stabil dan koreksi dapat diterbitkan ke `beta` atau `latest`
- Tag prarilis beta hanya dapat diterbitkan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit penuh hanya diizinkan saat
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya validasi
- Jalur penerbitan sebenarnya harus menggunakan `npm_dist_tag` yang sama seperti
  yang digunakan selama preflight; workflow memverifikasi metadata itu sebelum
  penerbitan berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit branch workflow penuh
     saat ini untuk dry run khusus validasi dari workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur beta-dulu yang normal, atau `latest`
   hanya saat Anda sengaja menginginkan penerbitan stabil langsung
3. Jalankan `Full Release Validation` pada branch rilis, tag rilis, atau SHA
   commit penuh saat Anda menginginkan CI normal plus cakupan cache prompt live,
   Docker, QA Lab, Matrix, dan Telegram dari satu workflow manual
4. Jika Anda sengaja hanya membutuhkan grafik pengujian normal deterministik,
   jalankan workflow `CI` manual pada ref rilis
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag`
   yang sama, dan `preflight_run_id` yang disimpan; ini menerbitkan Plugin yang
   dieksternalisasi ke npm dan ClawHub sebelum mempromosikan paket npm OpenClaw
7. Jika rilis mendarat di `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
8. Jika rilis sengaja diterbitkan langsung ke `latest` dan `beta` harus segera
   mengikuti build stabil yang sama, gunakan workflow privat yang sama untuk
   mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi
   self-healing terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih membutuhkan
`NPM_TOKEN`, sementara repo publik mempertahankan penerbitan hanya OIDC.

Itu membuat jalur penerbitan langsung dan jalur promosi beta-dulu sama-sama
terdokumentasi dan terlihat oleh operator.

Jika maintainer harus fallback ke autentikasi npm lokal, jalankan perintah CLI
1Password (`op`) apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op`
langsung dari shell agent utama; menjaganya tetap di dalam tmux membuat prompt,
alert, dan penanganan OTP dapat diamati serta mencegah alert host berulang.

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
