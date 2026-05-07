---
read_when:
    - Mencari definisi kanal rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan ritme rilis
    - Merencanakan jalur rilis dukungan bulanan atau LTS
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, lini dukungan bulanan yang direncanakan, dan kadensi
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-07T01:53:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` saat diminta secara eksplisit
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: head yang terus bergerak dari `main`

## Penamaan versi

- Versi rilis stabil: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stabil lama: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prarilis beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan tambahkan nol di depan bulan atau hari
- `latest` berarti rilis npm stabil yang saat ini dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stabil dan rilis koreksi lama dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang sudah diperiksa kemudian
- Setiap rilis stabil OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/sign/notarize aplikasi Mac disisihkan untuk stabil kecuali diminta secara eksplisit

### Versioning dukungan bulanan yang direncanakan

OpenClaw belum memiliki kanal LTS atau dukungan bulanan. Maintainer sedang
bergerak menuju lini dukungan bulanan yang kompatibel dengan SemVer, tetapi kanal
pembaruan yang dikirimkan saat ini masih `stable`, `beta`, dan `dev`.

Bentuk versi yang direncanakan adalah `YYYY.M.PATCH`:

- `YYYY` adalah tahun.
- `M` adalah lini rilis bulanan, tanpa nol di depan.
- `PATCH` bertambah di dalam lini bulanan tersebut dan dapat naik setinggi yang diperlukan.

Misalnya, `2026.6.0`, `2026.6.1`, dan `2026.6.2` semuanya berada pada lini Juni
2026. dist-tag dukungan bulanan mendatang seperti `stable-2026-6` atau
`lts-2026-6` dapat menunjuk ke lini tersebut, sementara `latest` terus bergerak cepat.

Model mendatang ini menggantikan kebutuhan untuk rilis koreksi `YYYY.M.D-N` baru.
Versi koreksi lama yang sudah ada tetap dikenali agar paket lama dan
jalur peningkatan tetap berfungsi.

## Irama rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stabil menyusul hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari branch `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta telah di-push atau dipublikasikan dan memerlukan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis mendetail, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Checklist operator rilis

Checklist ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarization, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: tarik yang terbaru, konfirmasi commit target sudah di-push,
   dan konfirmasi CI `main` saat ini cukup hijau untuk membuat branch darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, pastikan entri berorientasi pengguna, commit, push, dan rebase/pull
   sekali lagi sebelum membuat branch.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas
   yang kedaluwarsa hanya ketika jalur peningkatan tetap tercakup, atau catat mengapa
   kompatibilitas itu sengaja dipertahankan.
4. Buat `release/YYYY.M.D` dari `main` saat ini; jangan lakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dimaksud, jalankan
   `pnpm plugins:sync` agar paket Plugin yang dapat dipublikasikan berbagi versi rilis
   dan metadata kompatibilitas, lalu jalankan preflight deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, dan
   `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA branch rilis lengkap 40 karakter diperbolehkan untuk preflight khusus validasi.
   Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk
   branch rilis, tag, atau SHA commit lengkap. Ini adalah satu entrypoint manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di branch rilis dan jalankan ulang file, lane,
   job workflow, profil paket, provider, atau allowlist model terkecil yang gagal
   yang membuktikan perbaikan. Jalankan ulang umbrella penuh hanya ketika permukaan yang berubah membuat
   bukti sebelumnya basi.
9. Untuk beta, tag `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   branch `release/YYYY.M.D` yang cocok. Ini memverifikasi `pnpm plugins:sync:check`,
   mendispatch semua paket Plugin yang dapat dipublikasikan ke npm dan set yang sama ke
   ClawHub secara paralel, lalu mempromosikan artefak preflight npm OpenClaw yang disiapkan
   dengan dist-tag yang cocok segera setelah publikasi npm Plugin berhasil.
   Publikasi ClawHub mungkin masih berjalan sementara npm OpenClaw dipublikasikan, tetapi
   workflow publikasi rilis tidak selesai sampai kedua jalur publikasi Plugin dan
   jalur publikasi npm OpenClaw berhasil diselesaikan. Setelah publikasi, jalankan
   penerimaan paket pascapublikasi
   terhadap paket `openclaw@YYYY.M.D-beta.N` atau
   `openclaw@beta` yang sudah dipublikasikan. Jika prarilis yang sudah di-push atau dipublikasikan memerlukan perbaikan,
   buat nomor prarilis berikutnya yang cocok; jangan hapus atau tulis ulang prarilis lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau release candidate yang sudah diperiksa memiliki
    bukti validasi yang diperlukan. Publikasi npm stabil juga melalui
    `OpenClaw Release Publish`, menggunakan kembali artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stabil juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang sudah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
11. Setelah publikasi, jalankan verifier npm pascapublikasi, E2E Telegram
    npm-terpublikasi standalone opsional saat Anda membutuhkan bukti kanal pascapublikasi,
    promosi dist-tag saat diperlukan, catatan GitHub release/prerelease dari
    bagian `CHANGELOG.md` lengkap yang cocok, dan langkah pengumuman rilis.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum prapemeriksaan rilis agar TypeScript pengujian tetap tercakup di luar gerbang lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum prapemeriksaan rilis agar pemeriksaan siklus impor yang lebih luas dan batas arsitektur sudah hijau di luar gerbang lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis `dist/*` yang diharapkan dan bundle Control UI ada untuk langkah validasi paket
- Jalankan `pnpm plugins:sync` setelah bump versi root dan sebelum tagging. Perintah ini memperbarui versi paket plugin yang dapat dipublikasikan, metadata kompatibilitas peer/API OpenClaw, metadata build, dan stub changelog plugin agar cocok dengan versi rilis core. `pnpm plugins:sync:check` adalah penjaga rilis non-mutasi; workflow publish gagal sebelum mutasi registry apa pun jika langkah ini terlupakan.
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk memulai semua test box prarilis dari satu entrypoint. Workflow ini menerima branch, tag, atau SHA commit lengkap, men-dispatch `CI` manual, dan men-dispatch `OpenClaw Release Checks` untuk install smoke, package acceptance, pemeriksaan paket lintas-OS, paritas QA Lab, Matrix, dan lane Telegram. Run stabil/default menahan live/E2E lengkap dan soak jalur rilis Docker di balik `run_release_soak=true`; `release_profile=full` memaksa soak aktif. Dengan `release_profile=full` dan `rerun_group=all`, workflow ini juga menjalankan Telegram E2E paket terhadap artefak `release-package-under-test` dari pemeriksaan rilis. Berikan `npm_telegram_package_spec` setelah publikasi ketika Telegram E2E yang sama juga harus membuktikan paket npm yang telah dipublikasikan. Berikan `package_acceptance_package_spec` setelah publikasi ketika Package Acceptance harus menjalankan matriks paket/update terhadap paket npm yang dikirim, bukan artefak yang dibuild dari SHA. Berikan `evidence_package_spec` ketika laporan bukti privat harus membuktikan bahwa validasi cocok dengan paket npm yang dipublikasikan tanpa memaksa Telegram E2E. Contoh: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti side-channel untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk `openclaw@beta`, `openclaw@latest`, atau versi rilis yang tepat; `source=ref` untuk memaketkan branch/tag/SHA `package_ref` tepercaya dengan harness `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256 wajib; atau `source=artifact` untuk tarball yang diunggah oleh run GitHub Actions lain. Workflow ini me-resolve kandidat ke `package-under-test`, menggunakan ulang scheduler rilis Docker E2E terhadap tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika lane Docker yang dipilih mencakup `published-upgrade-survivor`, artefak paket adalah kandidat dan `published_upgrade_survivor_baseline` memilih baseline yang dipublikasikan. `update-restart-auth` menggunakan paket kandidat sebagai CLI terinstal dan package-under-test sehingga menjalankan jalur restart terkelola dari perintah update kandidat. Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai` Profil umum:
  - `smoke`: lane install/channel/agent, jaringan gateway, dan reload config
  - `package`: lane package/update/restart/plugin yang native-artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil package plus channel MCP, pembersihan cron/subagent, pencarian web OpenAI, dan OpenWebUI
  - `full`: potongan jalur rilis Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` yang tepat untuk rerun terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya memerlukan cakupan CI normal penuh untuk kandidat rilis. Dispatch CI manual melewati cakupan changed dan memaksa shard Linux Node, shard bundled-plugin, kontrak channel, kompatibilitas Node 22, `check`, `check-additional`, build smoke, pemeriksaan docs, Python skills, Windows, macOS, Android, dan lane i18n Control UI. Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` ketika memvalidasi telemetri rilis. Perintah ini menjalankan QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi nama span trace yang diekspor, atribut berbatas, serta redaksi konten/identifier tanpa memerlukan Opik, Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk urutan publish yang memutasi setelah tag ada. Dispatch dari `release/YYYY.M.D` (atau `main` ketika memublikasikan tag yang dapat dijangkau main), teruskan tag rilis dan `preflight_run_id` npm OpenClaw yang sukses, dan pertahankan cakupan publish plugin default `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Workflow ini menserialkan publish npm plugin, publish ClawHub plugin, dan publish npm OpenClaw agar paket core tidak dipublikasikan sebelum plugin yang dieksternalisasi.
- Pemeriksaan rilis sekarang berjalan dalam workflow manual terpisah: `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan lane paritas mock QA Lab plus profil Matrix live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live menggunakan environment `qa-live-shared`; Telegram juga menggunakan lease kredensial CI Convex. Jalankan workflow manual `QA-Lab - All Lanes` dengan `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris transport, media, dan E2EE Matrix penuh secara paralel.
- Validasi runtime install dan upgrade lintas-OS adalah bagian dari `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil workflow reusable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap singkat, deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di lane sendiri agar tidak menahan atau memblokir publish
- Pemeriksaan rilis yang memuat secret harus di-dispatch melalui `Full Release Validation` atau dari ref workflow `main`/release agar logika workflow dan secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama commit yang di-resolve dapat dijangkau dari branch OpenClaw atau tag rilis
- Prapemeriksaan khusus validasi `OpenClaw NPM Release` juga menerima SHA commit branch workflow 40 karakter lengkap saat ini tanpa memerlukan tag yang sudah di-push
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publish nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk pemeriksaan metadata paket; publish nyata tetap memerlukan tag rilis nyata
- Kedua workflow mempertahankan jalur publish dan promosi nyata di runner yang di-host GitHub, sementara jalur validasi non-mutasi dapat menggunakan runner Blacksmith Linux yang lebih besar
- Workflow tersebut menjalankan `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Prapemeriksaan rilis npm tidak lagi menunggu lane pemeriksaan rilis yang terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (atau tag beta/koreksi yang cocok) sebelum persetujuan
- Setelah publish npm, jalankan `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (atau versi beta/koreksi yang cocok) untuk memverifikasi jalur install registry yang dipublikasikan dalam prefix temp yang baru
- Setelah publish beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan Telegram E2E nyata terhadap paket npm yang dipublikasikan menggunakan pool kredensial Telegram ber-lease bersama. One-off maintainer lokal dapat menghilangkan var Convex dan meneruskan tiga kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pascapublikasi penuh dari mesin maintainer, gunakan `pnpm release:beta-smoke -- --beta betaN`. Helper ini menjalankan validasi update npm Parallels/target baru, men-dispatch `NPM Telegram Beta E2E`, melakukan polling run workflow yang tepat, mengunduh artefak, dan mencetak laporan Telegram.
- Maintainer dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui workflow manual `NPM Telegram Beta E2E`. Workflow ini sengaja hanya manual dan tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan preflight-lalu-promote:
  - publish npm nyata harus melewati `preflight_run_id` npm yang sukses
  - publish npm nyata harus di-dispatch dari branch `main` atau `release/YYYY.M.D` yang sama dengan run prapemeriksaan yang sukses
  - rilis npm stabil default ke `beta`
  - publish npm stabil dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token sekarang berada di `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` demi keamanan, karena `npm dist-tag add` masih membutuhkan `NPM_TOKEN` sementara repo publik mempertahankan publish OIDC-only
  - `macOS Release` publik hanya untuk validasi; ketika tag hanya ada di branch rilis tetapi workflow di-dispatch dari `main`, setel `public_release_branch=release/YYYY.M.D`
  - publish mac privat nyata harus melewati `preflight_run_id` mac privat dan `validate_run_id` yang sukses
  - jalur publish nyata mempromosikan artefak yang sudah disiapkan alih-alih membuild ulang
- Untuk rilis koreksi stabil legacy seperti `YYYY.M.D-N`, verifier pascapublikasi juga memeriksa jalur upgrade prefix temp yang sama dari `YYYY.M.D` ke `YYYY.M.D-N` agar koreksi rilis tidak diam-diam meninggalkan install global lama pada payload stabil dasar
- Prapemeriksaan rilis npm gagal tertutup kecuali tarball menyertakan `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong agar kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pascapublikasi juga memeriksa bahwa entrypoint plugin yang dipublikasikan dan metadata paket ada dalam layout registry terinstal. Rilis yang mengirim payload runtime plugin yang hilang akan menggagalkan verifier pascapublish dan tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada tarball update kandidat, sehingga e2e installer menangkap pack bloat yang tidak disengaja sebelum jalur publish rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing ekstensi, atau matriks pengujian ekstensi, regenerasi dan tinjau output matriks `plugin-prerelease-extension-shard` milik planner dari `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak menjelaskan layout CI yang usang
- Kesiapan rilis macOS stabil juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang dipaketkan
  - `appcast.xml` di `main` harus menunjuk ke zip stabil baru setelah publish
  - app yang dipaketkan harus mempertahankan bundle id non-debug, URL feed Sparkle yang tidak kosong, dan `CFBundleVersion` pada atau di atas batas bawah build Sparkle kanonis untuk versi rilis tersebut

## Test box rilis

`Full Release Validation` adalah cara operator memulai semua pengujian prarilis dari satu entrypoint. Untuk bukti commit terpaku pada branch yang bergerak cepat, gunakan helper agar setiap workflow anak berjalan dari branch sementara yang dipatok pada SHA target:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper ini mem-push `release-ci/<sha>-...`, men-dispatch `Full Release Validation` dari branch tersebut dengan `ref=<sha>`, memverifikasi setiap `headSha` workflow anak cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian run anak `main` yang lebih baru secara tidak sengaja.

Untuk validasi branch rilis atau tag, jalankan dari ref workflow `main` tepercaya dan teruskan branch rilis atau tag sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow menyelesaikan ref target, menjalankan manual `CI` dengan
`target_ref=<release-ref>`, menjalankan `OpenClaw Release Checks`, menyiapkan artefak
induk `release-package-under-test` untuk pemeriksaan yang berhadapan dengan paket, dan
menjalankan paket mandiri Telegram E2E saat `release_profile=full` dengan
`rerun_group=all` atau saat `npm_telegram_package_spec` ditetapkan. `OpenClaw Release
Checks` kemudian menyebar ke install smoke, pemeriksaan rilis lintas-OS, cakupan live/E2E Docker
release-path saat soak diaktifkan, Package Acceptance dengan QA paket Telegram, paritas QA Lab, Matrix live, dan Telegram live. Run penuh hanya dapat diterima saat ringkasan
`Full Release Validation`
menampilkan `normal_ci` dan `release_checks` berhasil. Dalam mode full/all,
anak `npm_telegram` juga harus berhasil; di luar full/all, itu dilewati
kecuali `npm_telegram_package_spec` yang telah dipublikasikan diberikan. Ringkasan
verifier akhir menyertakan tabel pekerjaan paling lambat untuk setiap run anak, sehingga manajer rilis dapat melihat jalur kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap lengkap, nama pekerjaan workflow yang tepat, perbedaan profil stable versus full, artefak, dan handle rerun terfokus.
Workflow anak dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan saat `ref` target menunjuk ke
branch atau tag rilis lama. Tidak ada input workflow-ref Full Release Validation
terpisah; pilih harness tepercaya dengan memilih ref run workflow.
Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit tepat pada `main` yang bergerak;
SHA commit mentah tidak dapat menjadi ref workflow dispatch, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat branch sementara yang dipin.

Gunakan `release_profile` untuk memilih keluasan live/provider:

- `minimum`: jalur live dan Docker OpenAI/core yang paling cepat dan kritis untuk rilis
- `stable`: minimum plus cakupan provider/backend stable untuk persetujuan rilis
- `full`: stable plus cakupan provider/media advisory yang luas

Gunakan `run_release_soak=true` dengan `stable` saat lane pemblokir rilis sudah
hijau dan Anda menginginkan sweep live/E2E, Docker release-path, dan
upgrade-survivor terpublikasi yang terbatas secara menyeluruh sebelum promosi. Sweep itu mencakup
empat paket stable terbaru plus baseline `2026.4.23` dan `2026.5.2`
yang dipin plus cakupan `2026.4.15` yang lebih lama, dengan baseline duplikat dihapus dan
setiap baseline di-shard ke pekerjaan runner Docker-nya sendiri. `full` mengimplikasikan
`run_release_soak=true`.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref target
sekali sebagai `release-package-under-test` dan menggunakan ulang artefak itu dalam pemeriksaan lintas-OS,
Package Acceptance, dan Docker release-path saat soak berjalan. Ini menjaga
semua box yang berhadapan dengan paket pada byte yang sama dan menghindari build paket berulang.
Install smoke OpenAI lintas-OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat
variabel repo/org ditetapkan, jika tidak `openai/gpt-5.4`, karena lane ini
membuktikan instalasi paket, onboarding, startup Gateway, dan satu giliran agen live
bukan melakukan benchmark model default paling lambat. Matriks provider live
yang lebih luas tetap menjadi tempat untuk cakupan khusus model.

Gunakan varian ini tergantung tahap rilis:

```bash
# Validasi branch kandidat rilis yang belum dipublikasikan.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validasi commit pushed yang tepat.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Setelah memublikasikan beta, tambahkan paket terpublikasi Telegram E2E.
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
gagal, gunakan workflow anak, pekerjaan, lane Docker, profil paket, provider model,
atau lane QA yang gagal untuk bukti berikutnya. Jalankan umbrella penuh lagi hanya saat
perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua-box sebelumnya
usang. Verifier akhir umbrella memeriksa ulang id run workflow anak yang tercatat,
jadi setelah workflow anak berhasil dijalankan ulang, jalankan ulang hanya pekerjaan induk
`Verify full validation` yang gagal.

Untuk pemulihan terbatas, berikan `rerun_group` ke umbrella. `all` adalah run
kandidat rilis sebenarnya, `ci` hanya menjalankan anak CI normal, `plugin-prerelease`
hanya menjalankan anak Plugin khusus rilis, `release-checks` menjalankan setiap box rilis,
dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`.
Rerun `npm-telegram` terfokus memerlukan `npm_telegram_package_spec`; run full/all
dengan `release_profile=full` menggunakan artefak paket release-checks. Rerun
lintas-OS terfokus dapat menambahkan `cross_os_suite_filter=windows/packaged-upgrade` atau
filter OS/suite lainnya. Kegagalan QA release-check bersifat advisory; kegagalan hanya-QA
tidak memblokir validasi rilis.

### Vitest

Box Vitest adalah workflow anak `CI` manual. CI manual dengan sengaja
melewati cakupan changed dan memaksa grafik pengujian normal untuk kandidat rilis:
shard Linux Node, shard Plugin bundel, kontrak channel, kompatibilitas Node 22,
`check`, `check-additional`, build smoke, pemeriksaan docs, Python
skills, Windows, macOS, Android, dan Control UI i18n.

Gunakan box ini untuk menjawab "apakah source tree lulus suite pengujian normal penuh?"
Ini tidak sama dengan validasi produk release-path. Bukti yang perlu disimpan:

- Ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dijalankan
- Run `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari pekerjaan CI saat menyelidiki regresi
- artefak waktu Vitest seperti `.artifacts/vitest-shard-timings.json` saat
  run memerlukan analisis performa

Jalankan CI manual secara langsung hanya saat rilis memerlukan CI normal deterministik tetapi
bukan box Docker, QA Lab, live, lintas-OS, atau paket:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, plus workflow `install-smoke`
mode rilis. Ini memvalidasi kandidat rilis melalui lingkungan Docker terpaket
alih-alih hanya pengujian tingkat sumber.

Cakupan Docker rilis mencakup:

- install smoke penuh dengan smoke install global Bun yang lambat diaktifkan
- persiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target, dengan pekerjaan smoke QR,
  root/gateway, dan installer/Bun berjalan sebagai shard install-smoke terpisah
- lane E2E repositori
- chunk Docker release-path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, dan `plugins-runtime-install-h`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` saat diminta
- lane install/uninstall Plugin bundel yang dipisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker saat release checks
  menyertakan suite live

Gunakan artefak Docker sebelum menjalankan ulang. Scheduler release-path mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
waktu fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada workflow live/E2E reusable alih-alih
menjalankan ulang semua chunk rilis. Perintah rerun yang dihasilkan menyertakan
`package_artifact_run_id` sebelumnya dan input image Docker yang disiapkan saat tersedia, sehingga
lane yang gagal dapat menggunakan ulang tarball dan image GHCR yang sama.

### QA Lab

Box QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Ini adalah gate rilis
perilaku agentic dan tingkat channel, terpisah dari mekanika paket Vitest dan Docker.

Cakupan QA Lab rilis mencakup:

- lane paritas mock yang membandingkan lane kandidat OpenAI terhadap baseline Opus 4.6
  menggunakan agentic parity pack
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
inventaris paket, mencatat versi paket dan SHA-256, dan menjaga
ref harness workflow terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw
  yang tepat
- `source=ref`: kemas branch, tag, atau SHA commit lengkap `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS dengan `package_sha256` wajib
- `source=artifact`: gunakan ulang `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak
paket rilis yang disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, update,
restart update configured-auth, pembersihan dependensi Plugin basi, fixture Plugin offline,
update Plugin, dan QA paket Telegram terhadap tarball terselesaikan yang sama. Release checks yang memblokir menggunakan baseline paket terpublikasi latest default; `run_release_soak=true` atau
`release_profile=full` meluas ke setiap baseline yang dipublikasikan npm stable dari
`2026.4.23` hingga `latest` plus fixture issue yang dilaporkan. Gunakan
Package Acceptance dengan `source=npm` untuk kandidat yang sudah dikirim, atau
`source=ref`/`source=artifact` untuk tarball npm lokal yang didukung SHA sebelum
publish. Ini adalah pengganti GitHub-native untuk sebagian besar cakupan paket/update
yang sebelumnya memerlukan Parallels. Release checks lintas-OS tetap penting untuk onboarding,
installer, dan perilaku platform khusus OS, tetapi validasi produk paket/update sebaiknya
mengutamakan Package Acceptance.

Checklist kanonis untuk validasi update dan Plugin adalah
[Menguji update dan Plugin](/id/help/testing-updates-plugins). Gunakan saat
memutuskan lane lokal, Docker, Package Acceptance, atau release-check mana yang membuktikan
instalasi/update Plugin, pembersihan doctor, atau perubahan migrasi paket terpublikasi.
Migrasi update terpublikasi yang menyeluruh dari setiap paket stable `2026.4.23+`
adalah workflow `Update Migration` manual terpisah, bukan bagian dari Full Release CI.

Kelonggaran package-acceptance lama sengaja dibatasi waktunya. Paket hingga
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang
sudah dipublikasikan ke npm: entri inventaris QA privat yang tidak ada di
tarball, `gateway install --wrapper` yang tidak ada, file patch yang tidak ada
di fixture git turunan tarball, `update.channel` tersimpan yang tidak ada,
lokasi catatan instalasi plugin lama, persistensi catatan instalasi marketplace
yang tidak ada, dan migrasi metadata konfigurasi selama `plugins update`. Paket
`2026.4.26` yang dipublikasikan dapat memperingatkan untuk file stempel metadata
build lokal yang sudah dikirim. Paket setelahnya harus memenuhi kontrak paket
modern; celah yang sama akan menggagalkan validasi rilis.

Gunakan profil Package Acceptance yang lebih luas ketika pertanyaan rilis
berkaitan dengan paket yang benar-benar dapat diinstal:

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

- `smoke`: jalur cepat untuk instalasi paket/channel/agent, jaringan Gateway,
  dan pemuatan ulang konfigurasi
- `package`: kontrak instal/update/restart/paket plugin tanpa ClawHub live; ini
  adalah default pemeriksaan rilis
- `product`: `package` ditambah channel MCP, pembersihan cron/subagent, pencarian
  web OpenAI, dan OpenWebUI
- `full`: potongan jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk rerun terfokus

Untuk pembuktian Telegram kandidat paket, aktifkan `telegram_mode=mock-openai`
atau `telegram_mode=live-frontier` pada Package Acceptance. Workflow meneruskan
tarball `package-under-test` yang telah di-resolve ke jalur Telegram; workflow
Telegram mandiri tetap menerima spesifikasi npm yang dipublikasikan untuk
pemeriksaan pascapublikasi.

## Otomasi publikasi rilis

`OpenClaw Release Publish` adalah entrypoint publikasi mutatif normal. Ia
mengorkestrasi workflow trusted-publisher dalam urutan yang dibutuhkan rilis:

1. Check out tag rilis dan resolve SHA commit-nya.
2. Verifikasi bahwa tag dapat dijangkau dari `main` atau `release/*`.
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
hanya untuk pekerjaan perbaikan atau publikasi ulang yang terfokus. Untuk
perbaikan plugin terpilih, berikan `plugin_publish_scope=selected` dan
`plugins=@openclaw/name` ke `OpenClaw Release Publish`, atau dispatch workflow
anak secara langsung ketika paket OpenClaw tidak boleh dipublikasikan.

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga dapat berupa SHA
  commit branch workflow lengkap 40 karakter saat ini untuk preflight khusus
  validasi
- `preflight_only`: `true` untuk validasi/build/paket saja, `false` untuk jalur
  publikasi sebenarnya
- `preflight_run_id`: wajib pada jalur publikasi sebenarnya agar workflow
  menggunakan ulang tarball yang disiapkan dari run preflight yang berhasil
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
  menggunakan workflow sebagai orkestrator perbaikan khusus plugin

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: branch, tag, atau SHA commit lengkap yang akan divalidasi. Pemeriksaan
  yang membawa secret mengharuskan commit yang di-resolve dapat dijangkau dari
  branch OpenClaw atau tag rilis.
- `run_release_soak`: ikut serta dalam live/E2E menyeluruh, jalur rilis Docker,
  dan soak all-since upgrade-survivor pada pemeriksaan rilis stabil/default. Ini
  dipaksa aktif oleh `release_profile=full`.

Aturan:

- Tag stabil dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prarilis beta hanya dapat dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit lengkap hanya diizinkan ketika
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya untuk
  validasi
- Jalur publikasi sebenarnya harus menggunakan `npm_dist_tag` yang sama dengan
  yang digunakan saat preflight; workflow memverifikasi metadata tersebut
  sebelum publikasi berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit branch workflow lengkap
     saat ini untuk dry run khusus validasi dari workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur normal beta-terlebih-dahulu, atau
   `latest` hanya ketika Anda sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada branch rilis, tag rilis, atau SHA
   commit lengkap ketika Anda menginginkan CI normal ditambah cakupan cache
   prompt live, Docker, QA Lab, Matrix, dan Telegram dari satu workflow manual
4. Jika Anda sengaja hanya membutuhkan grafik pengujian normal yang
   deterministik, jalankan workflow manual `CI` pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama,
   `npm_dist_tag` yang sama, dan `preflight_run_id` tersimpan; ini
   mempublikasikan plugin yang dieksternalisasi ke npm dan ClawHub sebelum
   mempromosikan paket npm OpenClaw
7. Jika rilis masuk ke `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta` harus segera
   mengikuti build stabil yang sama, gunakan workflow privat yang sama untuk
   mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi
   pemulihan mandiri terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih memerlukan
`NPM_TOKEN`, sementara repo publik mempertahankan publikasi khusus OIDC.

Itu membuat jalur publikasi langsung dan jalur promosi beta-terlebih-dahulu
sama-sama terdokumentasi dan terlihat oleh operator.

Jika maintainer harus fallback ke autentikasi npm lokal, jalankan perintah CLI
1Password (`op`) apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op`
langsung dari shell agent utama; menjaganya di dalam tmux membuat prompt,
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
