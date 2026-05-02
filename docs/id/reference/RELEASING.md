---
read_when:
    - Mencari definisi saluran rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan ritme rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan kadensi
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-02T23:39:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
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
- Jangan tambahkan nol di depan bulan atau hari
- `latest` berarti rilis npm stabil yang saat ini dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stabil dan rilis koreksi stabil dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah diperiksa nanti
- Setiap rilis stabil OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/tanda tangan/notarisasi aplikasi mac dicadangkan untuk stabil kecuali diminta secara eksplisit

## Irama rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stabil mengikuti hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari cabang `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta telah didorong atau dipublikasikan dan membutuhkan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis, persetujuan, kredensial, dan catatan pemulihan terperinci
  hanya untuk maintainer

## Daftar periksa operator rilis

Daftar periksa ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada dalam
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: tarik yang terbaru, konfirmasi commit target telah didorong,
   dan konfirmasi CI `main` saat ini cukup hijau untuk membuat cabang darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, pertahankan entri yang berorientasi pengguna, commit, dorong, lalu rebase/tarik
   sekali lagi sebelum membuat cabang.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas
   yang kedaluwarsa hanya saat jalur upgrade tetap tercakup, atau catat mengapa itu
   sengaja tetap dibawa.
4. Buat `release/YYYY.M.D` dari `main` saat ini; jangan melakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dimaksud, jalankan
   `pnpm plugins:sync` agar paket Plugin yang dapat dipublikasikan berbagi versi rilis
   dan metadata kompatibilitas, lalu jalankan preflight deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, dan
   `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA cabang rilis lengkap 40 karakter diizinkan untuk preflight khusus validasi.
   Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk
   cabang rilis, tag, atau SHA commit lengkap. Ini adalah satu-satunya entrypoint manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di cabang rilis dan jalankan ulang file gagal terkecil,
   lane, pekerjaan workflow, profil paket, penyedia, atau allowlist model yang
   membuktikan perbaikan. Jalankan ulang umbrella penuh hanya saat permukaan yang berubah membuat
   bukti sebelumnya usang.
9. Untuk beta, tag `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   cabang `release/YYYY.M.D` yang cocok. Itu memverifikasi `pnpm plugins:sync:check`,
   memublikasikan semua paket Plugin yang dapat dipublikasikan ke npm terlebih dahulu, memublikasikan set
   yang sama ke ClawHub kedua, lalu mempromosikan artefak preflight npm OpenClaw
   yang disiapkan dengan dist-tag yang cocok. Setelah publikasi, jalankan penerimaan paket
   pascapublikasi terhadap paket `openclaw@YYYY.M.D-beta.N` atau
   `openclaw@beta` yang dipublikasikan. Jika prarilis yang telah didorong atau dipublikasikan membutuhkan perbaikan,
   buat nomor prarilis cocok berikutnya; jangan hapus atau tulis ulang prarilis lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang telah diperiksa memiliki
    bukti validasi yang diperlukan. Publikasi npm stabil juga melalui
    `OpenClaw Release Publish`, menggunakan ulang artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stabil juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang telah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
11. Setelah publikasi, jalankan pemverifikasi pascapublikasi npm, E2E Telegram
    published-npm mandiri opsional saat Anda membutuhkan bukti channel pascapublikasi,
    promosi dist-tag saat diperlukan, catatan rilis/prarilis GitHub dari
    bagian `CHANGELOG.md` lengkap yang cocok, dan langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum preflight rilis agar TypeScript pengujian tetap tercakup di luar gate lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum preflight rilis agar pemeriksaan siklus impor dan batas arsitektur yang lebih luas hijau di luar gate lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis `dist/*` yang diharapkan dan bundle Control UI ada untuk langkah validasi pack
- Jalankan `pnpm plugins:sync` setelah bump versi root dan sebelum tagging. Ini memperbarui versi paket Plugin yang dapat dipublikasikan, metadata kompatibilitas peer/API OpenClaw, metadata build, dan stub changelog Plugin agar cocok dengan versi rilis inti. `pnpm plugins:sync:check` adalah guard rilis yang tidak memutasi; workflow publikasi gagal sebelum mutasi registry apa pun jika langkah ini terlupakan.
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk memulai semua kotak pengujian pra-rilis dari satu entrypoint. Ini menerima branch, tag, atau SHA commit lengkap, mendispatch `CI` manual, dan mendispatch `OpenClaw Release Checks` untuk install smoke, package acceptance, suite jalur rilis Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan jalur Telegram. Dengan `release_profile=full` dan `rerun_group=all`, ini juga menjalankan paket Telegram E2E terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Berikan `npm_telegram_package_spec` setelah publikasi ketika Telegram E2E yang sama juga harus membuktikan paket npm yang dipublikasikan. Berikan `package_acceptance_package_spec` setelah publikasi ketika Package Acceptance harus menjalankan matriks paket/pembaruan terhadap paket npm yang dikirim, bukan artefak yang dibangun dari SHA. Berikan `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa validasi cocok dengan paket npm yang dipublikasikan tanpa memaksa Telegram E2E. Contoh: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti side-channel untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk `openclaw@beta`, `openclaw@latest`, atau versi rilis eksak; `source=ref` untuk mem-pack branch/tag/SHA `package_ref` tepercaya dengan harness `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256 wajib; atau `source=artifact` untuk tarball yang diunggah oleh run GitHub Actions lain. Workflow menyelesaikan kandidat menjadi `package-under-test`, menggunakan ulang scheduler rilis Docker E2E terhadap tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika jalur Docker yang dipilih menyertakan `published-upgrade-survivor`, artefak paket adalah kandidat dan `published_upgrade_survivor_baseline` memilih baseline yang dipublikasikan.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: jalur instal/channel/agent, jaringan Gateway, dan reload konfigurasi
  - `package`: jalur paket/pembaruan/Plugin native artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket ditambah channel MCP, pembersihan cron/subagent, pencarian web OpenAI, dan OpenWebUI
  - `full`: chunk jalur rilis Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` eksak untuk rerun terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya membutuhkan cakupan CI normal penuh untuk kandidat rilis. Dispatch CI manual melewati scoping perubahan dan memaksa shard Linux Node, shard Plugin terbundel, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, build smoke, pemeriksaan docs, Skills Python, Windows, macOS, Android, dan jalur i18n Control UI.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` ketika memvalidasi telemetri rilis. Ini menjalankan QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi nama span trace yang diekspor, atribut terbatas, serta redaksi konten/identifier tanpa memerlukan Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk urutan publikasi yang memutasi setelah tag ada. Dispatch dari `release/YYYY.M.D` (atau `main` ketika memublikasikan tag yang dapat dijangkau dari main), berikan tag rilis dan `preflight_run_id` npm OpenClaw yang berhasil, dan pertahankan scope publikasi Plugin default `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Workflow menserialkan publikasi npm Plugin, publikasi ClawHub Plugin, dan publikasi npm OpenClaw agar paket inti tidak dipublikasikan sebelum Plugin eksternalnya.
- Pemeriksaan rilis sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan jalur paritas mock QA Lab ditambah profil Matrix live cepat dan jalur QA Telegram sebelum persetujuan rilis. Jalur live menggunakan environment `qa-live-shared`; Telegram juga menggunakan lease kredensial CI Convex. Jalankan workflow manual `QA-Lab - All Lanes` dengan `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris transport Matrix, media, dan E2EE penuh secara paralel.
- Validasi runtime instal dan upgrade lintas-OS adalah bagian dari `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil workflow reusable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap pendek, deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di jalurnya sendiri agar tidak menunda atau memblokir publikasi
- Pemeriksaan rilis yang membawa secret harus didispatch melalui `Full Release Validation` atau dari ref workflow `main`/rilis agar logika workflow dan secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Preflight khusus validasi `OpenClaw NPM Release` juga menerima SHA commit branch-workflow 40 karakter penuh saat ini tanpa memerlukan tag yang sudah dipush
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk pemeriksaan metadata paket; publikasi nyata tetap memerlukan tag rilis nyata
- Kedua workflow mempertahankan jalur publikasi dan promosi nyata pada runner yang di-host GitHub, sementara jalur validasi non-mutasi dapat menggunakan runner Blacksmith Linux yang lebih besar
- Workflow tersebut menjalankan `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Preflight rilis npm tidak lagi menunggu jalur pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah publikasi npm, jalankan `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instal registry yang dipublikasikan dalam prefix temp baru
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan Telegram E2E nyata terhadap paket npm yang dipublikasikan menggunakan pool kredensial Telegram lease bersama. One-off maintainer lokal dapat menghilangkan var Convex dan meneruskan tiga kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Maintainer dapat menjalankan pemeriksaan pasca-publikasi yang sama dari GitHub Actions melalui workflow manual `NPM Telegram Beta E2E`. Ini sengaja hanya manual dan tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan preflight-lalu-promosi:
  - publikasi npm nyata harus lulus `preflight_run_id` npm yang berhasil
  - publikasi npm nyata harus didispatch dari branch `main` atau `release/YYYY.M.D` yang sama dengan run preflight yang berhasil
  - rilis npm stable default ke `beta`
  - publikasi npm stable dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token sekarang berada di `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` untuk keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara repo publik mempertahankan publikasi hanya OIDC
  - `macOS Release` publik hanya untuk validasi; ketika tag hanya berada di branch rilis tetapi workflow didispatch dari `main`, atur `public_release_branch=release/YYYY.M.D`
  - publikasi mac privat nyata harus lulus `preflight_run_id` mac privat dan `validate_run_id` yang berhasil
  - jalur publikasi nyata mempromosikan artefak yang sudah disiapkan, bukan membangunnya ulang
- Untuk rilis koreksi stable seperti `YYYY.M.D-N`, verifier pasca-publikasi juga memeriksa jalur upgrade temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N` agar koreksi rilis tidak diam-diam meninggalkan instal global lama pada payload stable dasar
- Preflight rilis npm gagal tertutup kecuali tarball menyertakan `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong agar kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pasca-publikasi juga memeriksa bahwa entrypoint Plugin yang dipublikasikan dan metadata paket ada dalam layout registry yang terinstal. Rilis yang mengirim payload runtime Plugin yang hilang menggagalkan verifier postpublish dan tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga memberlakukan anggaran `unpackedSize` pack npm pada tarball pembaruan kandidat, sehingga e2e installer menangkap pembengkakan pack tidak disengaja sebelum jalur publikasi rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing ekstensi, atau matriks pengujian ekstensi, regenerasi dan tinjau output matriks `plugin-prerelease-extension-shard` milik planner dari `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak mendeskripsikan layout CI yang basi
- Kesiapan rilis macOS stable juga mencakup permukaan updater:
  - GitHub release harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang sudah dipaketkan
  - `appcast.xml` pada `main` harus menunjuk ke zip stable baru setelah publikasi
  - aplikasi yang dipaketkan harus mempertahankan bundle id non-debug, URL feed Sparkle yang tidak kosong, dan `CFBundleVersion` pada atau di atas batas bawah build Sparkle kanonis untuk versi rilis tersebut

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai semua pengujian pra-rilis dari satu entrypoint. Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan helper agar setiap child workflow berjalan dari branch sementara yang dikunci pada SHA target:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper mendorong `release-ci/<sha>-...`, mendispatch `Full Release Validation` dari branch tersebut dengan `ref=<sha>`, memverifikasi setiap child workflow `headSha` cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian run child `main` yang lebih baru secara tidak sengaja.

Untuk validasi branch atau tag rilis, jalankan dari ref workflow `main` tepercaya dan berikan branch atau tag rilis sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Alur kerja menyelesaikan ref target, menjalankan manual `CI` dengan
`target_ref=<release-ref>`, menjalankan `OpenClaw Release Checks`, dan menjalankan
paket mandiri Telegram E2E ketika `release_profile=full` dengan
`rerun_group=all` atau ketika `npm_telegram_package_spec` diatur. `OpenClaw Release
Checks` kemudian menyebar ke install smoke, pemeriksaan rilis lintas-OS, cakupan
jalur rilis Docker live/E2E, Package Acceptance dengan QA paket Telegram, paritas
QA Lab, Matrix live, dan Telegram live. Proses penuh hanya dapat diterima ketika
ringkasan `Full Release Validation`
menampilkan `normal_ci` dan `release_checks` sebagai berhasil. Dalam mode full/all,
turunan `npm_telegram` juga harus berhasil; di luar full/all, ini dilewati
kecuali `npm_telegram_package_spec` yang sudah dipublikasikan disediakan. Ringkasan
verifikator akhir menyertakan tabel job paling lambat untuk setiap proses turunan,
sehingga manajer rilis dapat melihat jalur kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap lengkap, nama job alur kerja yang tepat, perbedaan profil stabil
versus penuh, artefak, dan pegangan rerun terfokus.
Alur kerja turunan dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan ketika `ref` target menunjuk ke
branch atau tag rilis yang lebih lama. Tidak ada input ref alur kerja Full Release Validation
terpisah; pilih harness tepercaya dengan memilih ref proses alur kerja.
Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit persis pada `main`
yang bergerak; SHA commit mentah tidak dapat menjadi ref dispatch alur kerja, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat branch sementara yang dipin.

Gunakan `release_profile` untuk memilih cakupan live/penyedia:

- `minimum`: jalur live OpenAI/core dan Docker paling cepat yang kritis untuk rilis
- `stable`: minimum ditambah cakupan penyedia/backend stabil untuk persetujuan rilis
- `full`: stable ditambah cakupan penyedia/media advisory yang luas

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk menyelesaikan ref target
sekali sebagai `release-package-under-test` dan menggunakan kembali artefak itu dalam
pemeriksaan Docker jalur rilis maupun Package Acceptance. Ini menjaga semua
box yang menghadap paket pada byte yang sama dan menghindari build paket berulang.
Install smoke OpenAI lintas-OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika
variabel repo/org diatur, jika tidak `openai/gpt-5.4`, karena lane ini
membuktikan instalasi paket, onboarding, startup Gateway, dan satu giliran agen live
alih-alih membenchmark model default paling lambat. Matriks penyedia live yang lebih luas
tetap menjadi tempat untuk cakupan khusus model.

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

Jangan gunakan payung penuh sebagai rerun pertama setelah perbaikan terfokus. Jika satu box
gagal, gunakan alur kerja turunan yang gagal, job, lane Docker, profil paket, penyedia
model, atau lane QA untuk bukti berikutnya. Jalankan payung penuh lagi hanya ketika
perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua-box sebelumnya
menjadi usang. Verifikator akhir payung memeriksa ulang id proses alur kerja turunan
yang tercatat, jadi setelah alur kerja turunan berhasil dijalankan ulang, jalankan ulang hanya job induk
`Verify full validation` yang gagal.

Untuk pemulihan berbatas, berikan `rerun_group` ke payung. `all` adalah proses
kandidat rilis yang sebenarnya, `ci` hanya menjalankan turunan CI normal, `plugin-prerelease`
hanya menjalankan turunan Plugin khusus rilis, `release-checks` menjalankan setiap box rilis,
dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`.
Rerun `npm-telegram` terfokus memerlukan `npm_telegram_package_spec`; proses full/all
dengan `release_profile=full` menggunakan artefak paket release-checks.

### Vitest

Box Vitest adalah alur kerja turunan manual `CI`. CI manual sengaja
melewati cakupan perubahan dan memaksa graf pengujian normal untuk kandidat rilis:
shard Linux Node, shard Plugin bawaan, kontrak channel, kompatibilitas Node 22,
`check`, `check-additional`, build smoke, pemeriksaan docs, Skills Python, Windows,
macOS, Android, dan i18n Control UI.

Gunakan box ini untuk menjawab "apakah source tree lulus suite pengujian normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL proses `CI` yang dijalankan
- proses `CI` hijau pada SHA target yang persis
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artefak waktu Vitest seperti `.artifacts/vitest-shard-timings.json` ketika
  sebuah proses memerlukan analisis performa

Jalankan CI manual secara langsung hanya ketika rilis membutuhkan CI normal deterministik tetapi
bukan box Docker, QA Lab, live, lintas-OS, atau paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, ditambah alur kerja
`install-smoke` mode rilis. Ini memvalidasi kandidat rilis melalui lingkungan
Docker terpaket, bukan hanya pengujian tingkat sumber.

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
- lane install/uninstall Plugin bawaan yang dipisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite penyedia live/E2E dan cakupan model live Docker ketika release checks
  menyertakan suite live

Gunakan artefak Docker sebelum rerun. Penjadwal jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
waktu fase, JSON rencana penjadwal, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada alur kerja reusable live/E2E alih-alih
menjalankan ulang semua chunk rilis. Perintah rerun yang dihasilkan menyertakan
`package_artifact_run_id` sebelumnya dan input image Docker yang disiapkan ketika tersedia, sehingga
lane yang gagal dapat menggunakan kembali tarball dan image GHCR yang sama.

### QA Lab

Box QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Ini adalah gate rilis
perilaku agenik dan tingkat channel, terpisah dari mekanik paket Vitest dan Docker.

Cakupan QA Lab rilis meliputi:

- lane paritas mock yang membandingkan lane kandidat OpenAI dengan baseline Opus 4.6
  menggunakan paket paritas agenik
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial Convex CI
- `pnpm qa:otel:smoke` ketika telemetri rilis memerlukan bukti lokal eksplisit

Gunakan box ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan
alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram
saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai proses QA-Lab
sharded manual, bukan lane default yang kritis untuk rilis.

### Paket

Box Paket adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalisasi
kandidat menjadi tarball `package-under-test` yang digunakan oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, serta menjaga ref harness
alur kerja tetap terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw
  yang persis
- `source=ref`: kemas branch, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS dengan `package_sha256` wajib
- `source=artifact`: gunakan kembali `.tgz` yang diunggah oleh proses GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak
paket rilis yang disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues`, dan
`telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, pembaruan, pembersihan
dependensi Plugin usang, fixture Plugin offline, pembaruan Plugin, dan QA paket Telegram
terhadap tarball terselesaikan yang sama. Matriks upgrade mencakup setiap baseline stabil yang dipublikasikan npm dari `2026.4.23` hingga `latest`; gunakan
Package Acceptance dengan `source=npm` untuk kandidat yang sudah dikirim, atau
`source=ref`/`source=artifact` untuk tarball npm lokal berbasis SHA sebelum
publish. Ini adalah pengganti native GitHub
untuk sebagian besar cakupan paket/pembaruan yang sebelumnya memerlukan
Parallels. Pemeriksaan rilis lintas-OS tetap penting untuk onboarding khusus OS,
installer, dan perilaku platform, tetapi validasi produk paket/pembaruan sebaiknya
mengutamakan Package Acceptance.

Checklist kanonis untuk validasi pembaruan dan Plugin adalah
[Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins). Gunakan ini saat
menentukan lane lokal, Docker, Package Acceptance, atau release-check mana yang membuktikan
instalasi/pembaruan Plugin, pembersihan doctor, atau perubahan migrasi paket yang dipublikasikan.
Migrasi pembaruan yang dipublikasikan secara menyeluruh dari setiap paket stabil `2026.4.23+` adalah
alur kerja manual `Update Migration` terpisah, bukan bagian dari Full Release CI.

Kelonggaran package-acceptance lama sengaja dibatasi waktu. Paket hingga
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang sudah dipublikasikan
ke npm: entri inventaris QA privat yang hilang dari tarball, `gateway install --wrapper`
yang hilang, file patch yang hilang di fixture git turunan tarball, `update.channel`
persisten yang hilang, lokasi catatan instalasi Plugin lama, persistensi catatan instalasi
marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Paket
`2026.4.26` yang dipublikasikan dapat memberi peringatan untuk file cap metadata build lokal
yang sudah dikirim. Paket berikutnya harus memenuhi kontrak paket modern; celah yang sama
menggagalkan validasi rilis.

Gunakan profil Package Acceptance yang lebih luas ketika pertanyaan rilis adalah tentang
paket aktual yang dapat diinstal:

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

- `smoke`: lane instalasi paket/channel/agen cepat, jaringan Gateway, dan reload
  konfigurasi
- `package`: kontrak instalasi/pembaruan/Plugin paket tanpa ClawHub live; ini adalah default
  release-check
- `product`: `package` ditambah channel MCP, pembersihan cron/subagen, pencarian web
  OpenAI, dan OpenWebUI
- `full`: chunk jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk rerun terfokus

Untuk pembuktian Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Package Acceptance. Workflow meneruskan tarball
`package-under-test` yang telah di-resolve ke lane Telegram; workflow Telegram
mandiri tetap menerima spesifikasi npm yang sudah dipublikasikan untuk pemeriksaan pascapublikasi.

## Otomatisasi publikasi rilis

`OpenClaw Release Publish` adalah entrypoint publikasi bermutasi yang normal. Ini
mengorkestrasi workflow trusted-publisher dalam urutan yang dibutuhkan rilis:

1. Check out tag rilis dan resolve SHA commit-nya.
2. Verifikasi tag dapat dijangkau dari `main` atau `release/*`.
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan cakupan dan SHA yang sama.
6. Dispatch `OpenClaw NPM Release` dengan tag rilis, npm dist-tag, dan
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
hanya untuk pekerjaan perbaikan atau publikasi ulang yang terfokus. Untuk perbaikan Plugin terpilih, teruskan
`plugin_publish_scope=selected` dan `plugins=@openclaw/name` ke
`OpenClaw Release Publish`, atau dispatch workflow anak secara langsung ketika paket
OpenClaw tidak boleh dipublikasikan.

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga dapat berupa SHA commit
  branch workflow 40 karakter penuh saat ini untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk jalur
  publikasi sebenarnya
- `preflight_run_id`: wajib pada jalur publikasi sebenarnya agar workflow menggunakan kembali
  tarball yang disiapkan dari proses preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publikasi; default-nya `beta`

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id proses preflight `OpenClaw NPM Release` yang berhasil;
  wajib ketika `publish_openclaw_npm=true`
- `npm_dist_tag`: tag target npm untuk paket OpenClaw
- `plugin_publish_scope`: default-nya `all-publishable`; gunakan `selected` hanya
  untuk pekerjaan perbaikan yang terfokus
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma ketika
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default-nya `true`; atur `false` hanya ketika menggunakan
  workflow sebagai orkestrator perbaikan khusus Plugin

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: branch, tag, atau SHA commit penuh yang akan divalidasi. Pemeriksaan yang membawa secret
  mengharuskan commit yang di-resolve dapat dijangkau dari branch OpenClaw atau
  tag rilis.

Aturan:

- Tag stabil dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prarilis beta hanya boleh dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit penuh hanya diizinkan ketika
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu
  hanya untuk validasi
- Jalur publikasi sebenarnya harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama preflight;
  workflow memverifikasi metadata tersebut sebelum publikasi berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit branch workflow penuh saat ini
     untuk dry run khusus validasi dari workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur normal beta-terlebih-dahulu, atau `latest` hanya
   ketika Anda sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada branch rilis, tag rilis, atau SHA
   commit penuh ketika Anda menginginkan CI normal ditambah cakupan live prompt cache, Docker, QA Lab,
   Matrix, dan Telegram dari satu workflow manual
4. Jika Anda sengaja hanya membutuhkan graph pengujian normal yang deterministik, jalankan
   workflow manual `CI` pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag` yang sama,
   dan `preflight_run_id` yang tersimpan; ini memublikasikan Plugin yang dieksternalisasi ke npm
   dan ClawHub sebelum mempromosikan paket npm OpenClaw
7. Jika rilis mendarat di `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stabil yang sama, gunakan workflow privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi
   self-healing terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan publikasi hanya OIDC.

Itu membuat jalur publikasi langsung dan jalur promosi beta-terlebih-dahulu sama-sama
terdokumentasi dan terlihat oleh operator.

Jika maintainer harus fallback ke autentikasi npm lokal, jalankan perintah CLI 1Password
(`op`) hanya di dalam sesi tmux khusus. Jangan panggil `op`
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

Maintainer menggunakan dokumen rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
untuk runbook sebenarnya.

## Terkait

- [Kanal rilis](/id/install/development-channels)
