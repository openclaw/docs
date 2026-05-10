---
read_when:
    - Mencari definisi saluran rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan ritme rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan kadensi
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-10T19:51:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki tiga jalur rilis publik:

- stabil: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` saat diminta secara eksplisit
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
- `beta` berarti target instalasi beta saat ini
- Rilis stabil dan rilis koreksi stabil dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah diperiksa nanti
- Setiap rilis stabil OpenClaw mengirim paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/sign/notarize aplikasi Mac dicadangkan untuk rilis stabil kecuali diminta secara eksplisit

## Irama rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stabil menyusul hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari branch `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi rilis dan perbaikan tidak memblokir
  pengembangan baru di `main`
- Jika tag beta telah di-push atau dipublikasikan dan memerlukan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Checklist operator rilis

Checklist ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarization, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: pull terbaru, konfirmasi commit target telah di-push,
   dan konfirmasi CI `main` saat ini cukup hijau untuk dijadikan dasar branch.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, jaga entri tetap berorientasi pengguna, commit, push, dan rebase/pull
   sekali lagi sebelum membuat branch.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas
   yang kedaluwarsa hanya ketika jalur upgrade tetap tercakup, atau catat mengapa kompatibilitas itu
   sengaja dipertahankan.
4. Buat `release/YYYY.M.D` dari `main` saat ini; jangan lakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dimaksud, lalu jalankan
   `pnpm release:prep`. Ini menyegarkan versi plugin, inventaris plugin, skema config,
   metadata config channel bawaan, baseline dokumen config, ekspor SDK plugin,
   dan baseline API SDK plugin dalam urutan yang benar. Commit setiap drift yang dihasilkan
   sebelum tagging. Lalu jalankan preflight deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, dan `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA branch rilis penuh 40 karakter diizinkan untuk preflight
   khusus validasi. Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk
   branch rilis, tag, atau SHA commit penuh. Ini adalah satu entrypoint manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di branch rilis dan jalankan ulang file, lane,
   job workflow, profil paket, provider, atau allowlist model terkecil yang gagal
   yang membuktikan perbaikan. Jalankan ulang umbrella penuh hanya ketika surface yang berubah membuat
   bukti sebelumnya usang.
9. Untuk beta, tag `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   branch `release/YYYY.M.D` yang cocok. Ini memverifikasi `pnpm plugins:sync:check`,
   mendispatch semua paket plugin yang dapat dipublikasikan ke npm dan set yang sama ke
   ClawHub secara paralel, lalu mempromosikan artefak preflight npm OpenClaw yang telah disiapkan
   dengan dist-tag yang cocok segera setelah publikasi npm plugin berhasil.
   Setelah child publikasi npm OpenClaw berhasil, workflow membuat atau memperbarui
   halaman release/prerelease GitHub yang cocok dari bagian `CHANGELOG.md`
   lengkap yang cocok. Rilis stabil yang dipublikasikan ke npm `latest` menjadi
   rilis terbaru GitHub; rilis maintenance stabil yang tetap di npm `beta`
   dibuat dengan GitHub `latest=false`.
   Publikasi ClawHub mungkin masih berjalan saat npm OpenClaw dipublikasikan, tetapi
   workflow publikasi rilis mencetak ID run child segera. Secara default workflow ini
   tidak menunggu ClawHub setelah mendispatchnya, sehingga ketersediaan npm OpenClaw
   tidak diblokir oleh persetujuan ClawHub atau pekerjaan registry yang lebih lambat; setel
   `wait_for_clawhub=true` saat ClawHub harus memblokir penyelesaian workflow. Jalur
   ClawHub mencoba ulang kegagalan instalasi dependensi CLI yang sementara, memublikasikan
   plugin yang lolos preview meskipun satu cell preview flake, dan berakhir dengan
   verifikasi registry untuk setiap versi plugin yang diharapkan sehingga publikasi parsial
   tetap terlihat dan dapat dicoba ulang. Setelah publikasi, jalankan
   acceptance paket pascapublikasi
   terhadap paket `openclaw@YYYY.M.D-beta.N` atau
   `openclaw@beta` yang dipublikasikan. Jika prarilis yang telah di-push atau dipublikasikan memerlukan perbaikan,
   buat nomor prarilis cocok berikutnya; jangan hapus atau tulis ulang
   prarilis lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau release candidate yang telah diperiksa memiliki
    bukti validasi yang diperlukan. Publikasi npm stabil juga melalui
    `OpenClaw Release Publish`, menggunakan ulang artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stabil juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang telah dikemas, dan `appcast.xml` yang diperbarui di `main`.
    Workflow publikasi macOS privat memublikasikan appcast bertanda tangan ke `main`
    publik secara otomatis setelah aset rilis diverifikasi; jika branch protection memblokir
    push langsung, workflow membuka atau memperbarui PR appcast.
11. Setelah publikasi, jalankan verifier npm pascapublikasi, E2E Telegram published-npm
    mandiri opsional saat Anda memerlukan bukti channel pascapublikasi,
    promosi dist-tag saat diperlukan, verifikasi halaman rilis GitHub yang dihasilkan,
    dan jalankan langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum preflight rilis agar TypeScript pengujian tetap
  tercakup di luar gerbang lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum preflight rilis agar pemeriksaan siklus
  impor yang lebih luas dan batas arsitektur sudah hijau di luar gerbang lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis
  `dist/*` yang diharapkan dan bundle UI Kontrol tersedia untuk langkah validasi
  paket
- Jalankan `pnpm release:prep` setelah kenaikan versi root dan sebelum tagging. Perintah ini
  menjalankan setiap generator rilis deterministik yang biasanya bergeser setelah
  perubahan versi/konfigurasi/API: versi plugin, inventaris plugin, skema konfigurasi
  dasar, metadata konfigurasi channel terbundel, baseline dokumentasi konfigurasi,
  ekspor SDK plugin, dan baseline API SDK plugin. `pnpm release:check` menjalankan
  ulang penjaga tersebut dalam mode pemeriksaan dan melaporkan setiap kegagalan drift
  tergenerasi yang ditemukannya dalam satu lintasan sebelum menjalankan pemeriksaan rilis paket.
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua kotak pengujian pra-rilis dari satu entrypoint. Workflow ini menerima branch,
  tag, atau SHA commit lengkap, mendispatch `CI` manual, dan mendispatch
  `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, pemeriksaan paket
  lintas-OS, paritas QA Lab, Matrix, dan lane Telegram. Run stabil/default
  menahan soak live/E2E menyeluruh dan jalur rilis Docker di balik
  `run_release_soak=true`; `release_profile=full` memaksa soak aktif. Dengan
  `release_profile=full` dan `rerun_group=all`, workflow ini juga menjalankan E2E Telegram paket
  terhadap artefak `release-package-under-test` dari pemeriksaan rilis.
  Berikan `npm_telegram_package_spec` setelah publikasi ketika E2E Telegram yang sama
  juga harus membuktikan paket npm yang telah dipublikasikan. Berikan
  `package_acceptance_package_spec` setelah publikasi ketika Package Acceptance
  harus menjalankan matriks paket/pembaruan terhadap paket npm yang dikirim
  alih-alih artefak yang dibangun dari SHA. Berikan
  `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa
  validasi cocok dengan paket npm yang dipublikasikan tanpa memaksa E2E Telegram.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti jalur samping
  untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@beta`, `openclaw@latest`, atau versi rilis yang persis; `source=ref`
  untuk memaketkan branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256
  wajib; atau `source=artifact` untuk tarball yang diunggah oleh run GitHub
  Actions lain. Workflow ini menyelesaikan kandidat menjadi
  `package-under-test`, menggunakan ulang scheduler rilis Docker E2E terhadap
  tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika lane Docker
  yang dipilih mencakup `published-upgrade-survivor`, artefak paket adalah kandidat dan
  `published_upgrade_survivor_baseline` memilih baseline yang dipublikasikan.
  `update-restart-auth` menggunakan paket kandidat sebagai CLI yang terpasang sekaligus
  package-under-test sehingga ia menguji jalur restart terkelola milik perintah pembaruan
  kandidat.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane instalasi/channel/agen, jaringan gateway, dan muat ulang konfigurasi
  - `package`: lane paket/pembaruan/restart/plugin yang native artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket ditambah channel MCP, pembersihan cron/subagen,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: chunk jalur rilis Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` persis untuk rerun terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya membutuhkan cakupan CI normal
  penuh untuk kandidat rilis. Dispatch CI manual melewati cakupan berbasis perubahan
  dan memaksa shard Linux Node, shard plugin terbundel, kontrak channel,
  kompatibilitas Node 22, `check`, `check-additional`, smoke build,
  pemeriksaan dokumentasi, Python skills, Windows, macOS, Android, dan lane i18n UI Kontrol.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` ketika memvalidasi telemetri rilis. Perintah ini menguji
  QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi nama span trace yang diekspor,
  atribut yang dibatasi, serta redaksi konten/pengidentifikasi tanpa
  memerlukan Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk rangkaian publikasi yang mengubah state setelah
  tag tersedia. Dispatch dari `release/YYYY.M.D` (atau `main` ketika memublikasikan
  tag yang dapat dijangkau dari main), teruskan tag rilis dan `preflight_run_id` npm
  OpenClaw yang berhasil, dan pertahankan cakupan publikasi plugin default
  `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Workflow ini
  menserialkan publikasi npm plugin, publikasi ClawHub plugin, dan publikasi npm OpenClaw
  agar paket inti tidak dipublikasikan sebelum plugin yang dieksternalkan.
- Pemeriksaan rilis sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan lane paritas mock QA Lab ditambah profil Matrix
  live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live menggunakan
  environment `qa-live-shared`; Telegram juga menggunakan lease kredensial CI Convex.
  Jalankan workflow manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris
  transport Matrix, media, dan E2EE penuh secara paralel.
- Validasi runtime instalasi dan upgrade lintas-OS adalah bagian dari
  `OpenClaw Release Checks` publik dan `Full Release Validation`, yang memanggil
  workflow reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap
  berada di lane sendiri agar tidak menahan atau memblokir publikasi
- Pemeriksaan rilis yang membawa secret harus didispatch melalui `Full Release
Validation` atau dari ref workflow `main`/rilis agar logika workflow dan
  secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama
  commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Preflight khusus validasi `OpenClaw NPM Release` juga menerima SHA commit branch workflow
  lengkap 40 karakter saat ini tanpa memerlukan tag yang sudah dipush
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi nyata
- Dalam mode SHA, workflow menyintesis `v<package.json version>` hanya untuk pemeriksaan
  metadata paket; publikasi nyata tetap memerlukan tag rilis nyata
- Kedua workflow menjaga jalur publikasi dan promosi nyata di runner GitHub-hosted,
  sementara jalur validasi non-mutating dapat menggunakan runner Linux Blacksmith
  yang lebih besar
- Workflow tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Preflight rilis npm tidak lagi menunggu lane pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah publikasi npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi registry
  yang dipublikasikan dalam prefix sementara yang segar
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terpasang, penyiapan Telegram, dan E2E Telegram nyata
  terhadap paket npm yang dipublikasikan menggunakan pool kredensial Telegram sewaan bersama.
  One-off maintainer lokal dapat menghilangkan variabel Convex dan meneruskan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pasca-publikasi penuh dari mesin maintainer, gunakan `pnpm release:beta-smoke -- --beta betaN`. Helper ini menjalankan validasi pembaruan npm Parallels/target-segar, mendispatch `NPM Telegram Beta E2E`, melakukan polling run workflow yang persis, mengunduh artefak, dan mencetak laporan Telegram.
- Maintainer dapat menjalankan pemeriksaan pasca-publikasi yang sama dari GitHub Actions melalui
  workflow manual `NPM Telegram Beta E2E`. Workflow ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan preflight-lalu-promosi:
  - publikasi npm nyata harus melewati `preflight_run_id` npm yang berhasil
  - publikasi npm nyata harus didispatch dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run preflight yang berhasil
  - rilis npm stabil default ke `beta`
  - publikasi npm stabil dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    demi keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara
    repo publik mempertahankan publikasi hanya OIDC
  - `macOS Release` publik hanya untuk validasi; ketika sebuah tag hanya berada di
    branch rilis tetapi workflow didispatch dari `main`, setel
    `public_release_branch=release/YYYY.M.D`
  - publikasi mac privat nyata harus melewati `preflight_run_id` dan `validate_run_id`
    mac privat yang berhasil
  - jalur publikasi nyata mempromosikan artefak yang sudah disiapkan alih-alih membangunnya
    ulang
- Untuk rilis koreksi stabil seperti `YYYY.M.D-N`, verifier pasca-publikasi
  juga memeriksa jalur upgrade temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  agar koreksi rilis tidak diam-diam meninggalkan instalasi global lama pada payload
  stabil dasar
- Preflight rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pasca-publikasi juga memeriksa bahwa entrypoint plugin yang dipublikasikan dan
  metadata paket ada di layout registry yang terpasang. Rilis yang
  mengirim payload runtime plugin yang hilang akan menggagalkan verifier postpublish dan
  tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball pembaruan kandidat, sehingga e2e installer menangkap pembengkakan pack yang tidak sengaja
  sebelum jalur publikasi rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes waktu extension, atau
  matriks pengujian extension, regenerasikan dan tinjau output matriks
  `plugin-prerelease-extension-shard` yang dimiliki planner dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  menjelaskan layout CI yang basi
- Kesiapan rilis macOS stabil juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` terpaket
  - `appcast.xml` di `main` harus menunjuk ke zip stabil baru setelah publikasi; workflow
    publikasi macOS privat meng-commit-nya otomatis, atau membuka PR appcast
    ketika push langsung diblokir
  - aplikasi terpaket harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas floor build Sparkle kanonis
    untuk versi rilis tersebut

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai semua pengujian pra-rilis dari
satu entrypoint. Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan
helper agar setiap workflow anak berjalan dari branch sementara yang ditetapkan pada SHA
target:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper mendorong `release-ci/<sha>-...`, menjalankan `Full Release Validation`
dari branch tersebut dengan `ref=<sha>`, memverifikasi setiap workflow anak `headSha`
cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian
run anak `main` yang lebih baru secara tidak sengaja.

Untuk validasi branch rilis atau tag, jalankan dari ref workflow `main` tepercaya
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

Workflow menyelesaikan ref target, menjalankan `CI` manual dengan
`target_ref=<release-ref>`, menjalankan `OpenClaw Release Checks`, menyiapkan
artefak induk `release-package-under-test` untuk pemeriksaan yang berhadapan
dengan paket, dan menjalankan package Telegram E2E mandiri saat `release_profile=full` dengan
`rerun_group=all` atau saat `npm_telegram_package_spec` ditetapkan. `OpenClaw Release
Checks` kemudian menyebar ke install smoke, pemeriksaan rilis lintas OS, cakupan jalur rilis live/E2E Docker
saat soak diaktifkan, Package Acceptance dengan QA paket Telegram, paritas QA Lab, Matrix live, dan Telegram live. Run penuh hanya dapat diterima saat
ringkasan `Full Release Validation`
menampilkan `normal_ci` dan `release_checks` berhasil. Dalam mode full/all,
anak `npm_telegram` juga harus berhasil; di luar full/all, ini dilewati
kecuali `npm_telegram_package_spec` yang diterbitkan disediakan. Ringkasan
verifier akhir menyertakan tabel job paling lambat untuk setiap run anak, sehingga manajer rilis
dapat melihat jalur kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap lengkap, nama job workflow yang tepat, perbedaan profil stable versus full,
artefak, dan handle rerun terfokus.
Workflow anak dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan saat `ref` target menunjuk ke
branch rilis atau tag yang lebih lama. Tidak ada input ref workflow Full Release Validation
terpisah; pilih harness tepercaya dengan memilih ref run workflow.
Jangan gunakan `--ref main -f ref=<sha>` untuk pembuktian commit tepat pada `main` yang bergerak;
SHA commit mentah tidak dapat menjadi ref workflow dispatch, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat branch sementara yang dipin.

Gunakan `release_profile` untuk memilih cakupan live/provider:

- `minimum`: jalur OpenAI/core live dan Docker yang paling cepat dan kritis untuk rilis
- `stable`: minimum plus cakupan provider/backend stable untuk persetujuan rilis
- `full`: stable plus cakupan luas provider/media advisory

Gunakan `run_release_soak=true` dengan `stable` saat lane yang memblokir rilis sudah
hijau dan Anda menginginkan sweep live/E2E, jalur rilis Docker, dan
upgrade-survivor terbitan terbatas yang menyeluruh sebelum promosi. Sweep tersebut mencakup
empat paket stable terbaru plus baseline `2026.4.23` dan `2026.5.2`
yang dipin plus cakupan `2026.4.15` yang lebih lama, dengan baseline duplikat dihapus dan
setiap baseline di-shard ke job runner Docker sendiri. `full` mengimplikasikan
`run_release_soak=true`.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref target
sekali sebagai `release-package-under-test` dan menggunakan ulang artefak tersebut di pemeriksaan lintas OS,
Package Acceptance, dan Docker jalur rilis saat soak berjalan. Ini menjaga
semua box yang berhadapan dengan paket pada byte yang sama dan menghindari build paket berulang.
Install smoke OpenAI lintas OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat
variabel repo/org ditetapkan, jika tidak `openai/gpt-5.4`, karena lane ini
membuktikan instalasi paket, onboarding, startup Gateway, dan satu giliran agent live
alih-alih membenchmark model default paling lambat. Matriks provider live
yang lebih luas tetap menjadi tempat untuk cakupan spesifik model.

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
gagal, gunakan workflow anak, job, lane Docker, profil paket, provider model,
atau lane QA yang gagal untuk pembuktian berikutnya. Jalankan umbrella penuh lagi hanya saat
perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua-box sebelumnya
menjadi usang. Verifier akhir umbrella memeriksa ulang id run workflow anak
yang direkam, jadi setelah workflow anak berhasil dijalankan ulang, jalankan ulang hanya job induk
`Verify full validation` yang gagal.

Untuk pemulihan terbatas, teruskan `rerun_group` ke umbrella. `all` adalah run
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

Box Vitest adalah workflow anak `CI` manual. CI manual sengaja
melewati scoping perubahan dan memaksa grafik test normal untuk kandidat rilis:
shard Linux Node, shard bundled-plugin, kontrak channel, kompatibilitas Node 22,
`check`, `check-additional`, build smoke, pemeriksaan docs, Skills Python, Windows,
macOS, Android, dan i18n Control UI.

Gunakan box ini untuk menjawab "apakah source tree lulus rangkaian test normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dijalankan
- run `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artefak timing Vitest seperti `.artifacts/vitest-shard-timings.json` saat
  run memerlukan analisis performa

Jalankan CI manual secara langsung hanya saat rilis memerlukan CI normal deterministik tetapi
bukan box Docker, QA Lab, live, lintas OS, atau paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, plus workflow `install-smoke`
mode rilis. Ini memvalidasi kandidat rilis melalui lingkungan Docker berpaket
alih-alih hanya test tingkat source.

Cakupan Docker rilis meliputi:

- install smoke penuh dengan smoke install global Bun yang lambat diaktifkan
- persiapan/penggunaan ulang image smoke root Dockerfile berdasarkan SHA target, dengan QR,
  root/gateway, dan job smoke installer/Bun berjalan sebagai shard install-smoke terpisah
- lane E2E repository
- chunk Docker jalur rilis: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, dan `plugins-runtime-install-h`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` saat diminta
- lane install/uninstall Plugin bundled terpisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker saat release checks
  menyertakan suite live

Gunakan artefak Docker sebelum rerun. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
timing fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada workflow live/E2E reusable alih-alih
menjalankan ulang semua chunk rilis. Perintah rerun yang dihasilkan menyertakan
`package_artifact_run_id` sebelumnya dan input image Docker yang disiapkan jika tersedia, sehingga
lane yang gagal dapat menggunakan ulang tarball dan image GHCR yang sama.

### QA Lab

Box QA Lab juga bagian dari `OpenClaw Release Checks`. Ini adalah gate rilis
perilaku agentik dan tingkat channel, terpisah dari mekanika paket Vitest dan Docker.

Cakupan QA Lab rilis meliputi:

- lane paritas mock yang membandingkan lane kandidat OpenAI dengan baseline Opus 4.6
  menggunakan pack paritas agentik
- profil QA Matrix live cepat menggunakan environment `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial CI Convex
- `pnpm qa:otel:smoke` saat telemetri rilis memerlukan bukti lokal eksplisit

Gunakan box ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan
alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram
saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai
run QA-Lab manual yang di-shard, bukan lane kritis rilis default.

### Paket

Box Paket adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan
kandidat menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, serta menjaga
ref harness workflow terpisah dari ref source paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw
  yang tepat
- `source=ref`: pack branch, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS dengan `package_sha256` wajib
- `source=artifact`: gunakan ulang `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`,
artefak paket rilis yang disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, update,
restart update configured-auth, install skill ClawHub live, pembersihan dependensi Plugin kedaluwarsa, fixture Plugin offline,
update Plugin, dan QA paket Telegram terhadap tarball terselesaikan yang sama.
Release checks yang memblokir menggunakan baseline paket terbitan latest default;
`run_release_soak=true` atau
`release_profile=full` diperluas ke setiap baseline npm-published stable dari
`2026.4.23` hingga `latest` plus fixture reported-issue. Gunakan
Package Acceptance dengan `source=npm` untuk kandidat yang sudah dikirim, atau
`source=ref`/`source=artifact` untuk tarball npm lokal berbasis SHA sebelum
publish. Ini adalah pengganti GitHub-native
untuk sebagian besar cakupan package/update yang sebelumnya memerlukan
Parallels. Release checks lintas OS tetap penting untuk onboarding, installer,
dan perilaku platform spesifik OS, tetapi validasi produk package/update sebaiknya
memilih Package Acceptance.

Checklist kanonis untuk validasi pembaruan dan plugin adalah
[Menguji pembaruan dan plugin](/id/help/testing-updates-plugins). Gunakan saat
menentukan lane lokal, Docker, Package Acceptance, atau release-check mana yang
membuktikan instalasi/pembaruan plugin, pembersihan doctor, atau perubahan
migrasi paket yang dipublikasikan. Migrasi pembaruan terbitan yang menyeluruh
dari setiap paket stabil `2026.4.23+` adalah workflow manual `Update Migration`
terpisah, bukan bagian dari Full Release CI.

Kelonggaran package-acceptance lama sengaja dibatasi waktunya. Paket hingga
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang
sudah dipublikasikan ke npm: entri inventaris QA privat yang hilang dari
tarball, `gateway install --wrapper` yang hilang, file patch yang hilang di
fixture git turunan tarball, `update.channel` persisten yang hilang, lokasi
catatan instalasi plugin lama, persistensi catatan instalasi marketplace yang
hilang, dan migrasi metadata konfigurasi selama `plugins update`. Paket
`2026.4.26` yang dipublikasikan dapat memperingatkan untuk file cap metadata
build lokal yang sudah dikirimkan. Paket berikutnya harus memenuhi kontrak paket
modern; celah yang sama akan menggagalkan validasi rilis.

Gunakan profil Package Acceptance yang lebih luas saat pertanyaan rilisnya
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

- `smoke`: lane cepat untuk instalasi paket/channel/agent, jaringan Gateway,
  dan muat ulang konfigurasi
- `package`: kontrak paket instalasi/pembaruan/mulai ulang/plugin plus bukti
  instalasi skill ClawHub langsung; ini adalah default release-check
- `product`: `package` plus channel MCP, pembersihan cron/subagent, pencarian
  web OpenAI, dan OpenWebUI
- `full`: potongan jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk rerun terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Package Acceptance. Workflow meneruskan
tarball `package-under-test` yang diselesaikan ke lane Telegram; workflow
Telegram mandiri tetap menerima spesifikasi npm yang dipublikasikan untuk
pemeriksaan pascapublikasi.

## Otomatisasi publikasi rilis

`OpenClaw Release Publish` adalah entrypoint publikasi bermutasi yang normal. Ia
mengorkestrasi workflow trusted-publisher dalam urutan yang dibutuhkan rilis:

1. Check out tag rilis dan selesaikan SHA commit-nya.
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

Gunakan workflow tingkat lebih rendah `Plugin NPM Release` dan
`Plugin ClawHub Release` hanya untuk pekerjaan perbaikan atau publikasi ulang
yang terfokus. Untuk perbaikan plugin terpilih, teruskan
`plugin_publish_scope=selected` dan `plugins=@openclaw/name` ke
`OpenClaw Release Publish`, atau dispatch workflow anak secara langsung saat
paket OpenClaw tidak boleh dipublikasikan.

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; saat `preflight_only=true`, ini juga dapat berupa SHA
  commit branch workflow lengkap 40 karakter saat ini untuk preflight khusus
  validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk jalur
  publikasi nyata
- `preflight_run_id`: wajib pada jalur publikasi nyata agar workflow
  menggunakan ulang tarball yang disiapkan dari run preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publikasi; defaultnya `beta`

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id run preflight `OpenClaw NPM Release` yang berhasil;
  wajib saat `publish_openclaw_npm=true`
- `npm_dist_tag`: tag target npm untuk paket OpenClaw
- `plugin_publish_scope`: defaultnya `all-publishable`; gunakan `selected` hanya
  untuk pekerjaan perbaikan terfokus
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma saat
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: defaultnya `true`; atur `false` hanya saat menggunakan
  workflow sebagai orkestrator perbaikan khusus plugin

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: branch, tag, atau SHA commit lengkap untuk divalidasi. Pemeriksaan yang
  membawa secret mengharuskan commit yang diselesaikan dapat dijangkau dari
  branch OpenClaw atau tag rilis.
- `run_release_soak`: ikut serta dalam soak live/E2E menyeluruh, jalur rilis
  Docker, dan upgrade-survivor all-since pada pemeriksaan rilis stabil/default.
  Ini dipaksa aktif oleh `release_profile=full`.

Aturan:

- Tag stabil dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prerelease beta hanya dapat dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit lengkap hanya diizinkan saat
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya validasi
- Jalur publikasi nyata harus menggunakan `npm_dist_tag` yang sama dengan yang
  digunakan selama preflight; workflow memverifikasi metadata itu sebelum
  publikasi berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit branch workflow lengkap
     saat ini untuk dry run khusus validasi dari workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur beta-first normal, atau `latest` hanya
   saat Anda sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada branch rilis, tag rilis, atau SHA
   commit lengkap saat Anda menginginkan CI normal plus cakupan live prompt
   cache, Docker, QA Lab, Matrix, dan Telegram dari satu workflow manual
4. Jika Anda sengaja hanya membutuhkan grafik pengujian normal yang deterministik,
   jalankan workflow manual `CI` pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag`
   yang sama, dan `preflight_run_id` yang disimpan; ini memublikasikan plugin
   yang dieksternalisasi ke npm dan ClawHub sebelum mempromosikan paket npm
   OpenClaw
7. Jika rilis mendarat di `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta` harus
   segera mengikuti build stabil yang sama, gunakan workflow privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi
   self-healing terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih membutuhkan
`NPM_TOKEN`, sementara repo publik mempertahankan publikasi khusus OIDC.

Itu membuat jalur publikasi langsung dan jalur promosi beta-first sama-sama
terdokumentasi dan terlihat oleh operator.

Jika maintainer harus fallback ke autentikasi npm lokal, jalankan perintah CLI
1Password (`op`) apa pun hanya di dalam sesi tmux khusus. Jangan memanggil `op`
langsung dari shell agent utama; menyimpannya di dalam tmux membuat prompt,
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

Maintainer menggunakan dokumen rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
untuk runbook sebenarnya.

## Terkait

- [Channel rilis](/id/install/development-channels)
