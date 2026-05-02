---
read_when:
    - Mencari definisi saluran rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan irama rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan kadensi
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-05-02T20:59:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki empat jalur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` saat diminta secara eksplisit
- alpha: tag prarilis yang dipublikasikan ke npm `alpha`
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: head bergerak dari `main`

## Penamaan versi

- Versi rilis stabil: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stabil: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prarilis alpha: `YYYY.M.D-alpha.N`
  - Tag Git: `vYYYY.M.D-alpha.N`
- Versi prarilis beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan isi bulan atau hari dengan nol di depan
- `latest` berarti rilis npm stabil yang saat ini dipromosikan
- `alpha` berarti target instalasi alpha saat ini
- `beta` berarti target instalasi beta saat ini
- Rilis stabil dan rilis koreksi stabil dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah diperiksa nanti
- Setiap rilis stabil OpenClaw mengirimkan paket npm dan aplikasi macOS bersama-sama;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/tanda tangan/notarisasi aplikasi mac disisihkan untuk stabil kecuali diminta secara eksplisit

## Irama rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stabil mengikuti hanya setelah beta terbaru divalidasi
- Maintainer biasanya memotong rilis dari branch `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta telah didorong atau dipublikasikan dan memerlukan perbaikan, maintainer memotong
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Daftar periksa operator rilis

Daftar periksa ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada di
buku panduan operasional rilis khusus maintainer.

1. Mulai dari `main` saat ini: tarik yang terbaru, pastikan commit target telah didorong,
   dan pastikan CI `main` saat ini cukup hijau untuk membuat branch darinya.
2. Tulis ulang bagian teratas `CHANGELOG.md` dari riwayat commit nyata dengan
   `/changelog`, jaga entri tetap berorientasi pengguna, commit, dorong, dan rebase/tarik
   sekali lagi sebelum membuat branch.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas yang kedaluwarsa
   hanya ketika jalur peningkatan tetap tercakup, atau catat mengapa hal itu
   sengaja dipertahankan.
4. Buat `release/YYYY.M.D` dari `main` saat ini; jangan lakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dimaksud, jalankan
   `pnpm plugins:sync` agar paket Plugin yang dapat dipublikasikan berbagi versi rilis
   dan metadata kompatibilitas, lalu jalankan prapemeriksaan deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, dan
   `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA branch rilis 40 karakter penuh diizinkan untuk prapemeriksaan khusus validasi.
   Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk
   branch rilis, tag, atau SHA commit penuh. Ini adalah satu titik masuk manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di branch rilis dan jalankan ulang file, jalur,
   job alur kerja, profil paket, penyedia, atau allowlist model gagal terkecil yang
   membuktikan perbaikan. Jalankan ulang umbrella penuh hanya ketika permukaan yang berubah membuat
   bukti sebelumnya usang.
9. Untuk alpha atau beta, beri tag `vYYYY.M.D-alpha.N` atau `vYYYY.M.D-beta.N`, lalu jalankan `OpenClaw Release Publish` dari
   branch `release/YYYY.M.D` yang cocok. Ini memverifikasi `pnpm plugins:sync:check`,
   memublikasikan semua paket Plugin yang dapat dipublikasikan ke npm terlebih dahulu, memublikasikan set yang sama
   ke ClawHub kedua, lalu mempromosikan artefak prapemeriksaan npm OpenClaw yang disiapkan
   dengan dist-tag yang cocok. Setelah publikasi, jalankan penerimaan paket pascapublikasi
   terhadap paket `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N`, atau `openclaw@beta` yang dipublikasikan. Jika prarilis yang telah didorong atau
   dipublikasikan memerlukan perbaikan, potong nomor prarilis cocok berikutnya;
   jangan hapus atau tulis ulang prarilis lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang telah diperiksa memiliki
    bukti validasi yang diperlukan. Publikasi npm stabil juga melalui
    `OpenClaw Release Publish`, menggunakan kembali artefak prapemeriksaan yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stabil juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang telah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
11. Setelah publikasi, jalankan pemverifikasi npm pascapublikasi, E2E Telegram npm-terpublikasi
    mandiri opsional saat Anda memerlukan bukti saluran pascapublikasi,
    promosi dist-tag saat diperlukan, catatan rilis/prarilis GitHub dari
    bagian `CHANGELOG.md` cocok yang lengkap, dan langkah-langkah pengumuman rilis.

## Prapemeriksaan rilis

- Jalankan `pnpm check:test-types` sebelum preflight rilis agar TypeScript pengujian tetap
  tercakup di luar gate lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum preflight rilis agar pemeriksaan siklus
  impor dan batas arsitektur yang lebih luas hijau di luar gate lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak
  rilis `dist/*` yang diharapkan dan bundel Control UI tersedia untuk langkah
  validasi pack
- Jalankan `pnpm plugins:sync` setelah bump versi root dan sebelum tagging. Perintah ini
  memperbarui versi paket Plugin yang dapat dipublikasikan, metadata kompatibilitas
  peer/API OpenClaw, metadata build, dan stub changelog Plugin agar cocok dengan versi
  rilis core. `pnpm plugins:sync:check` adalah guard rilis non-mutating;
  workflow publish gagal sebelum mutasi registry apa pun jika langkah ini
  terlupa.
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua test box pra-rilis dari satu entrypoint. Workflow ini menerima branch,
  tag, atau SHA commit penuh, mendispatch `CI` manual, dan mendispatch
  `OpenClaw Release Checks` untuk install smoke, package acceptance, rangkaian
  release-path Docker, live/E2E, OpenWebUI, paritas QA Lab, Matrix, dan lane Telegram.
  Dengan `release_profile=full` dan `rerun_group=all`, workflow ini juga menjalankan
  package Telegram E2E terhadap artefak `release-package-under-test` dari release
  checks. Berikan `npm_telegram_package_spec` setelah publish ketika Telegram E2E yang
  sama juga harus membuktikan paket npm yang dipublikasikan. Berikan
  `package_acceptance_package_spec` setelah publish ketika Package Acceptance harus
  menjalankan matriks package/update terhadap paket npm yang sudah dikirim, bukan
  artefak yang dibuild dari SHA. Berikan
  `evidence_package_spec` ketika laporan evidence privat harus membuktikan bahwa
  validasi cocok dengan paket npm yang dipublikasikan tanpa memaksa Telegram E2E.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti
  side-channel untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@alpha`, `openclaw@beta`, `openclaw@latest`, atau versi rilis persis; `source=ref`
  untuk mem-pack branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS dengan SHA-256 yang wajib;
  atau `source=artifact` untuk tarball yang diunggah oleh run GitHub Actions lain.
  Workflow ini me-resolve kandidat menjadi
  `package-under-test`, menggunakan kembali scheduler rilis Docker E2E terhadap
  tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika
  lane Docker yang dipilih menyertakan `published-upgrade-survivor`, artefak paket
  adalah kandidat dan `published_upgrade_survivor_baseline` memilih baseline yang
  dipublikasikan.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane install/channel/agent, jaringan Gateway, dan reload config
  - `package`: lane package/update/Plugin native artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil package ditambah channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: chunk release-path Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` persis untuk rerun terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya membutuhkan cakupan CI
  normal penuh untuk kandidat rilis. Dispatch CI manual melewati scoping changed
  dan memaksa shard Linux Node, shard bundled-plugin, kontrak channel,
  kompatibilitas Node 22, `check`, `check-additional`, build smoke,
  pemeriksaan docs, Skills Python, Windows, macOS, Android, dan lane i18n Control UI.
  Contoh: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Jalankan `pnpm qa:otel:smoke` saat memvalidasi telemetri rilis. Perintah ini
  melatih QA-lab melalui receiver OTLP/HTTP lokal dan memverifikasi nama span trace
  yang diekspor, atribut yang dibatasi, serta redaksi konten/identifier tanpa
  memerlukan Opik, Langfuse, atau collector eksternal lain.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Jalankan `OpenClaw Release Publish` untuk urutan publish yang melakukan mutasi setelah
  tag tersedia. Dispatch dari `release/YYYY.M.D` (atau `main` saat mem-publish tag
  yang dapat dijangkau dari main), berikan tag rilis dan
  `preflight_run_id` npm OpenClaw yang sukses, dan pertahankan scope publish Plugin default
  `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Workflow
  ini menserialkan publish npm Plugin, publish ClawHub Plugin, dan publish npm OpenClaw
  agar paket core tidak dipublikasikan sebelum Plugin eksternalnya.
- Release checks sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan lane paritas mock QA Lab ditambah profil
  Matrix live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live
  menggunakan environment `qa-live-shared`; Telegram juga menggunakan lease kredensial
  Convex CI. Jalankan workflow manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` saat Anda menginginkan inventaris
  transport Matrix, media, dan E2EE penuh secara paralel.
- Validasi runtime install dan upgrade lintas-OS adalah bagian dari
  `OpenClaw Release Checks` publik dan `Full Release Validation`, yang memanggil
  workflow reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: pertahankan jalur rilis npm nyata tetap pendek,
  deterministik, dan berfokus artefak, sementara pemeriksaan live yang lebih lambat
  tetap berada di lane sendiri agar tidak menahan atau memblokir publish
- Release checks yang membawa secret harus didispatch melalui `Full Release
Validation` atau dari ref workflow `main`/release agar logika workflow dan
  secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit penuh selama
  commit yang di-resolve dapat dijangkau dari branch OpenClaw atau tag rilis
- Preflight validation-only `OpenClaw NPM Release` juga menerima SHA commit
  branch workflow 40 karakter penuh saat ini tanpa memerlukan tag yang sudah dipush
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publish nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; publish nyata tetap memerlukan tag rilis nyata
- Kedua workflow mempertahankan jalur publish dan promosi nyata di runner
  GitHub-hosted, sementara jalur validasi non-mutating dapat menggunakan runner
  Linux Blacksmith yang lebih besar
- Workflow tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Preflight rilis npm tidak lagi menunggu lane release checks terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang cocok) sebelum persetujuan
- Setelah publish npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang cocok) untuk memverifikasi jalur install registry
  yang dipublikasikan dalam prefix temp baru
- Setelah publish beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terinstal, setup Telegram, dan Telegram E2E nyata
  terhadap paket npm yang dipublikasikan menggunakan pool kredensial Telegram leased bersama.
  One-off maintainer lokal dapat menghilangkan var Convex dan memberikan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Maintainer dapat menjalankan pemeriksaan post-publish yang sama dari GitHub Actions melalui
  workflow manual `NPM Telegram Beta E2E`. Workflow ini sengaja manual-only dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan preflight-lalu-promote:
  - publish npm nyata harus lolos `preflight_run_id` npm yang sukses
  - publish npm nyata harus didispatch dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run preflight yang sukses
  - rilis npm stable default ke `beta`
  - publish npm stable dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi npm dist-tag berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    untuk keamanan, karena `npm dist-tag add` masih membutuhkan `NPM_TOKEN` sementara
    repo publik mempertahankan publish OIDC-only
  - `macOS Release` publik hanya untuk validasi; ketika tag hanya berada di
    branch rilis tetapi workflow didispatch dari `main`, set
    `public_release_branch=release/YYYY.M.D`
  - publish mac privat nyata harus lolos
    `preflight_run_id` dan `validate_run_id` mac privat yang sukses
  - jalur publish nyata mempromosikan artefak yang sudah disiapkan, bukan
    membuildnya lagi
- Untuk rilis koreksi stable seperti `YYYY.M.D-N`, verifier post-publish
  juga memeriksa jalur upgrade temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  agar koreksi rilis tidak dapat diam-diam meninggalkan install global lama pada
  payload stable dasar
- Preflight rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak mengirim dashboard browser kosong lagi
- Verifikasi post-publish juga memeriksa bahwa entrypoint Plugin yang dipublikasikan dan
  metadata paket ada di layout registry yang terinstal. Rilis yang
  mengirim payload runtime Plugin yang hilang menggagalkan verifier postpublish dan
  tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball update kandidat, sehingga e2e installer menangkap pack bloat yang tidak disengaja
  sebelum jalur publish rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing extension, atau
  matriks pengujian extension, regenerasi dan tinjau output matriks
  `plugin-prerelease-extension-shard` milik planner dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  menggambarkan layout CI yang basi
- Kesiapan rilis macOS stable juga mencakup surface updater:
  - release GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang sudah dipaketkan
  - `appcast.xml` di `main` harus menunjuk ke zip stable baru setelah publish
  - app yang dipaketkan harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas floor build Sparkle kanonis
    untuk versi rilis tersebut

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai semua pengujian pra-rilis dari
satu entrypoint. Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan
helper agar setiap workflow turunan berjalan dari branch sementara yang dikunci pada SHA
target:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper mendorong `release-ci/<sha>-...`, mendispatch `Full Release Validation`
dari branch tersebut dengan `ref=<sha>`, memverifikasi setiap `headSha` workflow turunan
cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian
run turunan `main` yang lebih baru secara tidak sengaja.

Untuk validasi branch rilis atau tag, jalankan dari ref workflow `main` tepercaya
dan berikan branch rilis atau tag sebagai `ref`:

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
Checks` lalu menyebar ke install smoke, pemeriksaan rilis lintas-OS, cakupan jalur rilis Docker live/E2E, Package Acceptance dengan QA paket Telegram, paritas QA Lab, Matrix live, dan Telegram live. Sebuah run penuh hanya dapat diterima ketika ringkasan
`Full Release Validation`
menampilkan `normal_ci` dan `release_checks` sebagai berhasil. Dalam mode full/all,
child `npm_telegram` juga harus berhasil; di luar full/all, ini dilewati
kecuali `npm_telegram_package_spec` yang telah dipublikasikan disediakan. Ringkasan
verifier akhir menyertakan tabel pekerjaan terlambat untuk setiap child run, sehingga manajer rilis dapat melihat jalur kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap lengkap, nama pekerjaan alur kerja yang tepat, perbedaan profil stabil versus penuh, artefak, dan handle rerun terfokus.
Alur kerja child dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan ketika `ref` target menunjuk ke
cabang atau tag rilis yang lebih lama. Tidak ada input ref alur kerja Full Release Validation terpisah; pilih harness tepercaya dengan memilih ref run alur kerja.
Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit tepat pada `main` yang bergerak;
SHA commit mentah tidak dapat menjadi ref workflow dispatch, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat cabang sementara yang disematkan.

Gunakan `release_profile` untuk memilih keluasan live/provider:

- `minimum`: jalur OpenAI/core live dan Docker yang paling cepat dan kritis untuk rilis
- `stable`: minimum ditambah cakupan provider/backend stabil untuk persetujuan rilis
- `full`: stable ditambah cakupan luas provider/media bersifat advisori

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk menyelesaikan ref target
sekali sebagai `release-package-under-test` dan menggunakan kembali artefak itu dalam pemeriksaan Docker jalur rilis dan Package Acceptance. Ini menjaga semua
box yang menghadap paket berada pada byte yang sama dan menghindari build paket berulang.
OpenAI install smoke lintas-OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat
variabel repo/org ditetapkan, jika tidak `openai/gpt-5.4`, karena lane ini
membuktikan instalasi paket, onboarding, startup gateway, dan satu putaran agen live
bukan membandingkan model default paling lambat. Matriks provider live yang lebih luas
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

Jangan gunakan umbrella penuh sebagai rerun pertama setelah perbaikan terfokus. Jika satu box
gagal, gunakan alur kerja child, pekerjaan, lane Docker, profil paket, provider model,
atau lane QA yang gagal untuk bukti berikutnya. Jalankan umbrella penuh lagi hanya ketika
perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua-box sebelumnya
menjadi usang. Verifier akhir umbrella memeriksa ulang id run alur kerja child
yang tercatat, jadi setelah alur kerja child berhasil dijalankan ulang, jalankan ulang hanya pekerjaan parent
`Verify full validation` yang gagal.

Untuk pemulihan terbatas, teruskan `rerun_group` ke umbrella. `all` adalah run
kandidat rilis yang sebenarnya, `ci` hanya menjalankan child CI normal, `plugin-prerelease`
hanya menjalankan child plugin khusus rilis, `release-checks` menjalankan setiap box rilis,
dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`.
Rerun `npm-telegram` terfokus memerlukan `npm_telegram_package_spec`; run full/all
dengan `release_profile=full` menggunakan artefak paket release-checks.

### Vitest

Box Vitest adalah alur kerja child `CI` manual. CI manual sengaja
melewati cakupan changed dan memaksa grafik pengujian normal untuk kandidat rilis:
shard Linux Node, shard plugin bundel, kontrak channel, kompatibilitas Node 22,
`check`, `check-additional`, build smoke, pemeriksaan dokumen, Python
skills, Windows, macOS, Android, dan Control UI i18n.

Gunakan box ini untuk menjawab "apakah source tree lulus suite pengujian normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dijalankan
- run `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari pekerjaan CI saat menyelidiki regresi
- artefak timing Vitest seperti `.artifacts/vitest-shard-timings.json` saat
  sebuah run membutuhkan analisis performa

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

Cakupan Docker rilis mencakup:

- install smoke penuh dengan slow Bun global install smoke diaktifkan
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
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` saat diminta
- lane install/uninstall plugin bundel yang dipisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker saat pemeriksaan rilis
  menyertakan suite live

Gunakan artefak Docker sebelum menjalankan ulang. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
timing fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada alur kerja live/E2E reusable alih-alih
menjalankan ulang semua chunk rilis. Perintah rerun yang dihasilkan menyertakan
`package_artifact_run_id` sebelumnya dan input image Docker yang disiapkan jika tersedia, sehingga
lane yang gagal dapat menggunakan kembali tarball dan image GHCR yang sama.

### QA Lab

Box QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Ini adalah gate rilis
perilaku agen dan tingkat channel, terpisah dari mekanika paket Vitest dan Docker.

Cakupan QA Lab rilis mencakup:

- lane paritas mock yang membandingkan lane kandidat OpenAI dengan baseline Opus 4.6
  menggunakan paket paritas agen
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial CI Convex
- `pnpm qa:otel:smoke` saat telemetri rilis membutuhkan bukti lokal eksplisit

Gunakan box ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan
alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram
saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai run QA-Lab shard manual,
bukan lane kritis rilis default.

### Package

Box Package adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan
kandidat menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, serta menjaga
ref harness alur kerja terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw
  yang tepat
- `source=ref`: pack cabang, tag, atau SHA commit penuh `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS dengan `package_sha256` yang wajib
- `source=artifact`: gunakan kembali `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak
paket rilis yang disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues`, dan
`telegram_mode=mock-openai`. Package Acceptance menjaga migrasi, pembaruan, pembersihan
dependensi plugin usang, fixture plugin offline, pembaruan plugin, dan QA paket Telegram
terhadap tarball terselesaikan yang sama. Matriks upgrade mencakup setiap baseline stabil yang dipublikasikan npm dari `2026.4.23` hingga `latest`; gunakan
Package Acceptance dengan `source=npm` untuk kandidat yang sudah dikirimkan, atau
`source=ref`/`source=artifact` untuk tarball npm lokal berbasis SHA sebelum
publish. Ini adalah pengganti native GitHub
untuk sebagian besar cakupan paket/pembaruan yang sebelumnya memerlukan
Parallels. Pemeriksaan rilis lintas-OS tetap penting untuk onboarding,
installer, dan perilaku platform khusus OS, tetapi validasi produk paket/pembaruan sebaiknya
memilih Package Acceptance.

Checklist kanonis untuk validasi pembaruan dan plugin adalah
[Menguji pembaruan dan plugin](/id/help/testing-updates-plugins). Gunakan ini saat
memutuskan lane lokal, Docker, Package Acceptance, atau release-check mana yang membuktikan
instal/update plugin, pembersihan doctor, atau perubahan migrasi paket yang dipublikasikan.
Migrasi pembaruan yang dipublikasikan secara menyeluruh dari setiap paket stabil `2026.4.23+` adalah
alur kerja manual `Update Migration` terpisah, bukan bagian dari Full Release CI.

Kelonggaran package-acceptance lama sengaja dibatasi waktu. Paket hingga
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang sudah dipublikasikan
ke npm: entri inventaris QA privat yang hilang dari tarball, `gateway install --wrapper`
yang hilang, file patch yang hilang dalam fixture git turunan tarball,
`update.channel` tersimpan yang hilang, lokasi install-record plugin lama,
persistensi install-record marketplace yang hilang, dan migrasi metadata konfigurasi
selama `plugins update`. Paket `2026.4.26` yang dipublikasikan dapat memperingatkan
untuk file stempel metadata build lokal yang sudah dikirimkan. Paket setelahnya
harus memenuhi kontrak paket modern; celah yang sama tersebut menggagalkan validasi
rilis.

Gunakan profil Package Acceptance yang lebih luas ketika pertanyaan rilis berkaitan dengan
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

- `smoke`: lane cepat instalasi paket/channel/agen, jaringan gateway, dan muat ulang konfigurasi
- `package`: kontrak paket instalasi/pembaruan/plugin tanpa ClawHub live; ini adalah default release-check
- `product`: `package` ditambah channel MCP, pembersihan cron/subagen, pencarian web OpenAI,
  dan OpenWebUI
- `full`: chunk jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` tepat untuk rerun terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Package Acceptance. Alur kerja meneruskan tarball
`package-under-test` yang telah diselesaikan ke lane Telegram; alur kerja Telegram
mandiri masih menerima spesifikasi npm yang sudah dipublikasikan untuk pemeriksaan pascapublikasi.

## Otomasi publikasi rilis

`OpenClaw Release Publish` adalah titik masuk publikasi bermutasi yang normal. Ini
mengorkestrasi alur kerja trusted-publisher sesuai urutan yang dibutuhkan rilis:

1. Check out tag rilis dan selesaikan SHA commit-nya.
2. Verifikasi bahwa tag dapat dijangkau dari `main` atau `release/*`.
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan scope dan SHA yang sama.
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

Contoh publikasi alfa:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
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

Gunakan alur kerja tingkat lebih rendah `Plugin NPM Release` dan `Plugin ClawHub Release`
hanya untuk pekerjaan perbaikan atau publikasi ulang yang terfokus. Untuk perbaikan plugin
terpilih, berikan `plugin_publish_scope=selected` dan `plugins=@openclaw/name` ke
`OpenClaw Release Publish`, atau dispatch alur kerja anak secara langsung ketika paket
OpenClaw tidak boleh dipublikasikan.

## Input alur kerja NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-alpha.1` atau `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga boleh berupa
  SHA commit lengkap 40 karakter saat ini dari cabang alur kerja untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk
  jalur publikasi sebenarnya
- `preflight_run_id`: wajib pada jalur publikasi sebenarnya agar alur kerja memakai ulang
  tarball yang sudah disiapkan dari run preflight yang berhasil
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
- `publish_openclaw_npm`: default ke `true`; atur `false` hanya ketika menggunakan
  alur kerja sebagai orkestrator perbaikan khusus plugin

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: cabang, tag, atau SHA commit lengkap yang akan divalidasi. Pemeriksaan yang
  membawa secret mensyaratkan commit yang diselesaikan dapat dijangkau dari cabang
  OpenClaw atau tag rilis.

Aturan:

- Tag stabil dan koreksi boleh dipublikasikan ke `beta` atau `latest`
- Tag prarilis alfa hanya boleh dipublikasikan ke `alpha`
- Tag prarilis beta hanya boleh dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit lengkap hanya diizinkan ketika
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu
  hanya validasi
- Jalur publikasi sebenarnya harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan saat preflight;
  alur kerja memverifikasi metadata tersebut sebelum publikasi berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda boleh menggunakan SHA commit lengkap saat ini dari cabang alur kerja
     untuk dry run khusus validasi atas alur kerja preflight
2. Pilih `npm_dist_tag=beta` untuk alur normal beta terlebih dahulu, atau `latest` hanya
   ketika Anda sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau SHA
   commit lengkap ketika Anda menginginkan CI normal plus cakupan live prompt cache, Docker, QA Lab,
   Matrix, dan Telegram dari satu alur kerja manual
4. Jika Anda sengaja hanya membutuhkan graf pengujian normal deterministik, jalankan
   alur kerja `CI` manual pada ref rilis sebagai gantinya
5. Simpan `preflight_run_id` yang berhasil
6. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag` yang sama,
   dan `preflight_run_id` yang tersimpan; ini memublikasikan plugin yang dieksternalisasi ke npm
   dan ClawHub sebelum mempromosikan paket npm OpenClaw
7. Jika rilis mendarat di `beta`, gunakan alur kerja privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stabil yang sama, gunakan alur kerja privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi self-healing
   terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan publikasi hanya OIDC.

Itu membuat jalur publikasi langsung dan jalur promosi beta terlebih dahulu sama-sama
terdokumentasi dan terlihat oleh operator.

Jika maintainer harus fallback ke autentikasi npm lokal, jalankan perintah CLI 1Password
(`op`) apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op`
langsung dari shell agen utama; menjaganya di dalam tmux membuat prompt,
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
