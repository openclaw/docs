---
read_when:
    - Mencari definisi kanal rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan irama rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan irama rilis
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-06-27T18:09:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` saat diminta secara eksplisit
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: head bergerak dari `main`

## Penamaan versi

- Versi rilis stable: `YYYY.M.PATCH`
  - Tag Git: `vYYYY.M.PATCH`
- Versi rilis koreksi stable: `YYYY.M.PATCH-N`
  - Tag Git: `vYYYY.M.PATCH-N`
- Versi prarilis beta: `YYYY.M.PATCH-beta.N`
  - Tag Git: `vYYYY.M.PATCH-beta.N`
- Jangan beri padding nol pada bulan atau patch
- Mulai pembaruan proses rilis Juni 2026, komponen ketiga adalah nomor
  release-train bulanan berurutan, bukan hari kalender. Rilis stable dan beta
  menentukan train saat ini; tag yang hanya alpha tidak memakai atau
  memajukan nomor patch beta/stable. Tag dan versi npm sebelum pembaruan tetap
  memakai nama yang sudah ada dan tetap valid; otomasi rilis terus
  membandingkannya berdasarkan tahun, bulan, patch, kanal, dan nomor prarilis
  atau koreksi.
- Build alpha/nightly memakai patch train berikutnya yang belum dirilis dan hanya
  menaikkan `alpha.N` untuk build berulang. Setelah patch tersebut memiliki beta,
  build alpha baru berpindah ke patch berikutnya. Abaikan tag lama yang hanya
  alpha dengan nomor patch lebih tinggi saat memilih train beta atau stable.
- Versi npm tidak dapat diubah. Jika tag beta sudah dipublikasikan, jangan
  menghapus, memublikasikan ulang, atau memakainya kembali; buat nomor beta
  berikutnya atau patch bulanan berikutnya. Karena `2026.6.5-beta.1` sudah
  dipublikasikan selama transisi, release train Juni 2026 harus memakai patch
  `5` atau lebih tinggi. Jangan memublikasikan train stable atau beta Juni 2026
  baru sebagai `2026.6.2`, `2026.6.3`, atau `2026.6.4`.
- Setelah stable `2026.6.5`, train beta baru berikutnya adalah `2026.6.6-beta.1`,
  meskipun tag otomatis yang hanya alpha dengan nomor patch lebih tinggi sudah ada.
- `latest` berarti rilis npm stable yang saat ini dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stable dan koreksi stable dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang sudah diperiksa nanti
- Setiap rilis stable OpenClaw mengirimkan paket npm, aplikasi macOS, dan
  installer Windows Hub bertanda tangan secara bersamaan; rilis beta biasanya
  memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, dengan
  build/tanda tangan/notarisasi/promosi aplikasi native dicadangkan untuk stable
  kecuali diminta secara eksplisit

## Kadensi rilis

- Rilis bergerak dengan beta terlebih dahulu
- Stable menyusul hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari branch `release/YYYY.M.PATCH` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta sudah didorong atau dipublikasikan dan membutuhkan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Daftar periksa operator rilis

Daftar periksa ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: pull terbaru, konfirmasi commit target sudah didorong,
   dan konfirmasi CI `main` saat ini cukup hijau untuk dijadikan dasar branch.
2. Buat bagian teratas `CHANGELOG.md` dari PR yang sudah digabungkan dan semua commit
   langsung sejak tag rilis terakhir yang dapat dijangkau. Pertahankan entri yang menghadap pengguna,
   deduplikasi entri PR/commit-langsung yang tumpang tindih, commit penulisan ulang, dorong,
   lalu rebase/pull sekali lagi sebelum membuat branch.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas
   yang kedaluwarsa hanya jika jalur upgrade tetap tercakup, atau catat mengapa itu
   sengaja dipertahankan.
4. Buat `release/YYYY.M.PATCH` dari `main` saat ini`; jangan melakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dimaksud, lalu jalankan
   `pnpm release:prep`. Ini menyegarkan versi plugin, inventaris plugin, skema config,
   metadata config kanal bundled, baseline docs config, ekspor plugin SDK,
   dan baseline API plugin SDK dalam urutan yang benar. Commit drift yang dihasilkan
   sebelum membuat tag. Lalu jalankan preflight deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, dan `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA branch rilis penuh 40 karakter diizinkan untuk preflight khusus validasi.
   Preflight menghasilkan bukti rilis dependensi untuk
   grafik dependensi checkout persis tersebut dan menyimpannya dalam artefak preflight npm.
   Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk branch
   rilis, tag, atau SHA commit penuh. Ini adalah satu entrypoint manual
   untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di branch rilis dan jalankan ulang file gagal terkecil,
   lane, job workflow, profil paket, penyedia, atau allowlist model yang
   membuktikan perbaikan. Jalankan ulang umbrella penuh hanya saat permukaan yang berubah membuat
   bukti sebelumnya kedaluwarsa.
9. Untuk kandidat beta bertag, jalankan
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` dari branch
   `release/YYYY.M.PATCH` yang cocok. Untuk stable, sertakan juga rilis sumber Windows
   yang diperlukan:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Helper menjalankan pemeriksaan rilis yang dihasilkan secara lokal, mengirim atau memverifikasi
   bukti validasi rilis penuh dan preflight npm, menjalankan bukti fresh/update Parallels
   terhadap tarball yang disiapkan secara persis plus bukti paket Telegram,
   mencatat rencana npm plugin dan ClawHub, lalu mencetak perintah
   `OpenClaw Release Publish` yang persis hanya setelah bundle bukti hijau.
   `OpenClaw Release Publish` mengirim paket plugin yang dipilih atau semua yang dapat dipublikasikan
   ke npm dan set yang sama ke ClawHub secara paralel, lalu mempromosikan
   artefak preflight npm OpenClaw yang disiapkan dengan dist-tag yang cocok segera setelah
   publikasi npm plugin berhasil.
   Setelah child publikasi npm OpenClaw berhasil, workflow membuat atau memperbarui
   halaman rilis/prarilis GitHub yang cocok dari bagian lengkap
   `CHANGELOG.md` yang cocok. Rilis stable yang dipublikasikan ke npm `latest` menjadi
   rilis terbaru GitHub; rilis maintenance stable yang tetap di npm `beta` dibuat
   dengan GitHub `latest=false`. Workflow juga mengunggah bukti dependensi
   preflight, manifes validasi penuh, dan bukti verifikasi registry pascapublikasi
   ke rilis GitHub untuk respons insiden pascarilis. Workflow publikasi mencetak ID run child
   segera, menyetujui otomatis gate environment rilis yang boleh disetujui oleh token workflow,
   merangkum job child yang gagal dengan tail log, menutup rilis GitHub dan bukti
   dependensi segera setelah publikasi npm OpenClaw berhasil, menunggu ClawHub kapan pun
   npm OpenClaw sedang dipublikasikan, lalu menjalankan `pnpm release:verify-beta` dan
   mengunggah bukti pascapublikasi untuk rilis GitHub, paket npm, paket npm plugin yang dipilih,
   paket ClawHub yang dipilih, ID run workflow child, dan ID run NPM Telegram opsional.
   Jalur ClawHub mencoba ulang kegagalan instalasi dependensi CLI sementara, memublikasikan
   plugin yang lolos pratinjau meskipun satu sel pratinjau flake, dan berakhir dengan verifikasi
   registry untuk setiap versi plugin yang diharapkan sehingga publikasi parsial tetap terlihat
   dan dapat dicoba ulang. Lalu jalankan acceptance paket pascapublikasi terhadap paket
   `openclaw@YYYY.M.PATCH-beta.N` atau
   `openclaw@beta` yang sudah dipublikasikan. Jika prarilis yang sudah didorong atau dipublikasikan membutuhkan perbaikan,
   buat nomor prarilis cocok berikutnya; jangan menghapus atau menulis ulang prarilis lama.
10. Untuk stable, lanjutkan hanya setelah beta atau kandidat rilis yang sudah diperiksa memiliki
    bukti validasi yang diperlukan. Publikasi npm stable juga melalui
    `OpenClaw Release Publish`, memakai ulang artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stable juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang sudah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
    Workflow publikasi macOS memublikasikan appcast bertanda tangan ke `main` publik
    secara otomatis setelah aset rilis diverifikasi; jika perlindungan branch memblokir
    push langsung, workflow membuka atau memperbarui PR appcast. Kesiapan Windows Hub
    stable memerlukan aset `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe`, dan
    `OpenClawCompanion-SHA256SUMS.txt` bertanda tangan pada rilis GitHub OpenClaw.
    Berikan tag rilis `openclaw/openclaw-windows-node` bertanda tangan yang persis sebagai
    `windows_node_tag` dan peta digest installer yang disetujui kandidat sebagai
    `windows_node_installer_digests`; `OpenClaw Release Publish` mempertahankan
    draf rilis, mengirim `Windows Node Release`, dan memverifikasi ketiga
    aset sebelum publikasi.
11. Setelah publikasi, jalankan verifier pascapublikasi npm, E2E Telegram npm-terpublikasi
    mandiri opsional saat Anda membutuhkan bukti kanal pascapublikasi,
    promosi dist-tag saat diperlukan, verifikasi halaman rilis GitHub yang dihasilkan,
    jalankan langkah pengumuman rilis, lalu selesaikan [penutupan main
    stable](#stable-main-closeout) sebelum menyebut rilis stable selesai.

## Penutupan main stable

Publikasi stable belum lengkap sampai `main` membawa status rilis yang benar-benar dikirim.

1. Mulai dari `main` terbaru yang bersih. Audit `release/YYYY.M.PATCH` terhadapnya dan
   forward-port perbaikan nyata yang belum ada di `main`. Jangan menggabungkan
   adapter kompatibilitas, pengujian, atau validasi khusus rilis secara membabi buta ke `main` yang lebih baru.
2. Tetapkan `main` ke versi stabil yang telah dikirimkan, bukan train berikutnya yang spekulatif. Jalankan
   `pnpm release:prep` setelah perubahan versi root, lalu
   `pnpm deps:shrinkwrap:generate`.
3. Buat bagian `## YYYY.M.PATCH` di `CHANGELOG.md` pada `main` sama persis dengan
   branch rilis bertag. Sertakan pembaruan `appcast.xml` stabil ketika rilis mac
   menerbitkannya.
4. Jangan menambahkan `YYYY.M.PATCH+1`, versi beta, atau bagian changelog masa depan
   yang kosong ke `main` sampai operator secara eksplisit memulai release train tersebut.
5. Jalankan `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, dan
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Push, lalu verifikasi bahwa `origin/main`
   berisi versi dan changelog yang telah dikirimkan sebelum menyebut rilis stabil
   selesai.
6. Jaga agar variabel repositori `RELEASE_ROLLBACK_DRILL_ID` dan
   `RELEASE_ROLLBACK_DRILL_DATE` tetap terkini setelah setiap latihan rollback privat.
   `OpenClaw Stable Main Closeout` dimulai dari push `main` yang membawa
   versi, changelog, dan appcast yang telah dikirimkan setelah publikasi stabil. Proses ini membaca
   bukti postpublish yang tidak dapat diubah untuk mengikat tag yang dikirimkan ke proses Full Release
   Validation dan Publish, lalu memverifikasi status main stabil, rilis,
   masa soak stabil wajib, dan bukti performa yang memblokir. Proses ini melampirkan
   manifes closeout yang tidak dapat diubah dan checksum ke rilis GitHub. Trigger push otomatis
   melewati rilis legacy yang mendahului bukti postpublish yang tidak dapat diubah;
   proses itu tidak pernah menganggap pelewatan tersebut sebagai closeout yang selesai. Closeout lengkap
   memerlukan aset sekaligus checksum yang cocok. Manifes parsial
   memutar ulang SHA `main` dan latihan rollback yang tercatat untuk menghasilkan ulang byte
   identik, lalu melampirkan checksum yang hilang; pasangan yang tidak valid, atau checksum
   tanpa manifes, tetap memblokir. Run yang dipicu push tanpa variabel repositori
   latihan rollback akan dilewati tanpa menyelesaikan closeout; catatan latihan yang hilang atau
   berusia lebih dari 90 hari tetap memblokir closeout manual yang didukung bukti.
   Perintah pemulihan privat tetap berada di runbook khusus maintainer.
   Gunakan dispatch manual hanya untuk memperbaiki atau memutar ulang closeout stabil yang didukung bukti.
   Tag koreksi fallback legacy boleh menggunakan kembali bukti base-package hanya ketika
   tag koreksi resolve ke commit sumber yang sama dengan tag stabil dasar.
   Koreksi dengan sumber berbeda harus menerbitkan dan memverifikasi bukti paketnya sendiri.

## Praflight rilis

- Jalankan `pnpm check:test-types` sebelum preflight rilis agar TypeScript pengujian tetap
  tercakup di luar gerbang lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum preflight rilis agar pemeriksaan siklus
  import dan batas arsitektur yang lebih luas lulus di luar gerbang lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis
  `dist/*` yang diharapkan dan bundel Control UI ada untuk langkah validasi pack
- Jalankan `pnpm release:prep` setelah kenaikan versi root dan sebelum tagging. Perintah ini
  menjalankan setiap generator rilis deterministik yang biasanya bergeser setelah perubahan
  versi/konfigurasi/API: versi Plugin, inventaris Plugin, skema konfigurasi dasar,
  metadata konfigurasi channel yang dibundel, baseline dokumentasi konfigurasi, ekspor SDK
  Plugin, dan baseline API SDK Plugin. `pnpm release:check` menjalankan ulang guard tersebut
  dalam mode pemeriksaan dan melaporkan setiap kegagalan drift hasil generasi yang ditemukan
  dalam satu lintasan sebelum menjalankan pemeriksaan rilis package.
- Sinkronisasi versi Plugin memperbarui versi package Plugin resmi dan floor
  `openclaw.compat.pluginApi` yang ada ke versi rilis OpenClaw secara default. Perlakukan
  field itu sebagai floor API SDK/runtime Plugin, bukan sekadar salinan versi package:
  untuk rilis khusus Plugin yang sengaja tetap kompatibel dengan host OpenClaw yang lebih
  lama, pertahankan floor pada API host tertua yang didukung dan dokumentasikan pilihan itu
  dalam bukti rilis Plugin.
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua test box pra-rilis dari satu entrypoint. Workflow ini menerima branch,
  tag, atau SHA commit lengkap, men-dispatch `CI` manual, dan men-dispatch
  `OpenClaw Release Checks` untuk smoke instalasi, penerimaan package, pemeriksaan package
  lintas OS, paritas QA Lab, Matrix, dan lane Telegram. Run stabil dan penuh selalu
  menyertakan live/E2E lengkap dan soak jalur rilis Docker; `run_release_soak=true`
  dipertahankan untuk soak beta eksplisit. Package Acceptance menyediakan E2E Telegram
  package kanonis selama validasi kandidat, sehingga menghindari live poller kedua yang
  berjalan bersamaan.
  Berikan `release_package_spec` setelah menerbitkan beta untuk menggunakan ulang package
  npm yang sudah dikirim di seluruh release checks, Package Acceptance, dan E2E Telegram
  package tanpa membangun ulang tarball rilis. Berikan `npm_telegram_package_spec` hanya
  ketika Telegram harus menggunakan package terbitan yang berbeda dari validasi rilis
  lainnya. Berikan `package_acceptance_package_spec` ketika Package Acceptance harus
  menggunakan package terbitan yang berbeda dari spesifikasi package rilis. Berikan
  `evidence_package_spec` ketika laporan bukti rilis harus membuktikan bahwa validasi
  cocok dengan package npm terbitan tanpa memaksa E2E Telegram.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti side-channel
  untuk kandidat package sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@beta`, `openclaw@latest`, atau versi rilis persis; `source=ref` untuk mengemas
  branch/tag/SHA `package_ref` tepercaya dengan harness `workflow_ref` saat ini; `source=url`
  untuk tarball HTTPS publik dengan SHA-256 wajib dan kebijakan URL publik yang ketat;
  `source=trusted-url` untuk kebijakan sumber tepercaya bernama menggunakan
  `trusted_source_id` dan SHA-256 wajib; atau `source=artifact` untuk tarball yang diunggah
  oleh run GitHub Actions lain. Workflow menyelesaikan kandidat menjadi
  `package-under-test`, menggunakan ulang scheduler rilis Docker E2E terhadap tarball itu,
  dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika lane Docker yang
  dipilih menyertakan `published-upgrade-survivor`, artefak package adalah kandidat dan
  `published_upgrade_survivor_baseline` memilih baseline terbitan. `update-restart-auth`
  menggunakan package kandidat sebagai CLI yang diinstal sekaligus package-under-test
  sehingga menguji jalur restart terkelola milik perintah pembaruan kandidat.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: lane instalasi/channel/agen, jaringan Gateway, dan reload konfigurasi
  - `package`: lane package/update/restart/Plugin native artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil package plus channel MCP, pembersihan cron/subagen,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: chunk jalur rilis Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` persis untuk rerun terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya membutuhkan cakupan CI
  normal deterministik untuk kandidat rilis. Dispatch CI manual melewati scope perubahan
  dan memaksa shard Linux Node, shard Plugin yang dibundel, shard kontrak Plugin dan
  channel, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke
  artefak build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, dan lane i18n
  Control UI. Run CI manual mandiri menjalankan Android hanya ketika di-dispatch dengan
  `include_android=true`; `Full Release Validation` meneruskan input itu untuk child CI-nya.
  Contoh dengan Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Jalankan `pnpm qa:otel:smoke` saat memvalidasi telemetri rilis. Perintah ini menguji
  QA-lab melalui receiver OTLP/HTTP lokal dan memverifikasi ekspor trace, metrik, dan log
  beserta atribut trace yang terbatas serta redaksi konten/pengenal tanpa memerlukan Opik,
  Langfuse, atau kolektor eksternal lain.
- Jalankan `pnpm qa:otel:collector-smoke` saat memvalidasi kompatibilitas kolektor.
  Perintah ini merutekan ekspor OTLP QA-lab yang sama melalui container Docker
  OpenTelemetry Collector nyata sebelum assertion receiver lokal.
- Jalankan `pnpm qa:prometheus:smoke` saat memvalidasi scraping Prometheus yang dilindungi.
  Perintah ini menguji QA-lab, menolak scrape tanpa autentikasi, dan memverifikasi keluarga
  metrik yang kritis untuk rilis tetap bebas dari konten prompt, pengenal mentah, token
  auth, dan path lokal.
- Jalankan `pnpm qa:observability:smoke` ketika Anda menginginkan lane smoke OpenTelemetry
  dan Prometheus dari checkout sumber berjalan berurutan.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Preflight `OpenClaw NPM Release` menghasilkan bukti rilis dependensi sebelum mengemas
  tarball npm. Gerbang kerentanan advisory npm bersifat memblokir rilis. Risiko manifest
  transitif, permukaan kepemilikan/instalasi dependensi, dan laporan perubahan dependensi
  hanya merupakan bukti rilis. Laporan perubahan dependensi membandingkan kandidat rilis
  dengan tag rilis sebelumnya yang dapat dijangkau.
- Preflight mengunggah bukti dependensi sebagai
  `openclaw-release-dependency-evidence-<tag>` dan juga menyematkannya di bawah
  `dependency-evidence/` di dalam artefak preflight npm yang disiapkan. Jalur publikasi
  nyata menggunakan ulang artefak preflight itu, lalu melampirkan bukti yang sama ke rilis
  GitHub sebagai `openclaw-<version>-dependency-evidence.zip`.
- Jalankan `OpenClaw Release Publish` untuk urutan publikasi yang memutasi setelah tag ada.
  Dispatch dari `release/YYYY.M.PATCH` (atau `main` ketika menerbitkan tag yang dapat
  dijangkau dari main), teruskan tag rilis, `preflight_run_id` npm OpenClaw yang berhasil,
  dan `full_release_validation_run_id` yang berhasil, dan pertahankan scope publikasi
  Plugin default `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus.
  Workflow menserialkan publikasi npm Plugin, publikasi ClawHub Plugin, dan publikasi npm
  OpenClaw agar package core tidak diterbitkan sebelum Plugin eksternalnya.
- `OpenClaw Release Publish` stabil memerlukan `windows_node_tag` persis setelah rilis
  `openclaw/openclaw-windows-node` non-prarilis yang cocok ada. Workflow ini juga
  memerlukan map `windows_node_installer_digests` yang disetujui kandidat. Sebelum
  men-dispatch child publikasi apa pun, workflow memverifikasi bahwa rilis sumber sudah
  dipublikasikan, bukan prarilis, berisi installer x64/ARM64 yang diperlukan, dan masih
  cocok dengan map yang disetujui itu. Workflow kemudian men-dispatch `Windows Node Release`
  saat rilis OpenClaw masih berupa draft, membawa map digest installer yang dipin tanpa
  perubahan. Workflow child mengunduh installer Windows Hub yang sudah ditandatangani dari
  tag persis itu, mencocokkannya dengan digest yang dipin, memverifikasi tanda tangan
  Authenticode-nya menggunakan penanda tangan OpenClaw Foundation yang diharapkan pada
  runner Windows, menulis manifest SHA-256, dan mengunggah installer beserta manifest ke
  rilis GitHub OpenClaw kanonis, lalu mengunduh ulang aset yang dipromosikan dan
  memverifikasi keanggotaan manifest serta hash. Parent memverifikasi kontrak aset x64,
  ARM64, dan checksum saat ini sebelum publikasi. Pemulihan langsung menolak nama aset
  `OpenClawCompanion-*` yang tidak diharapkan sebelum mengganti aset kontrak yang diharapkan
  dengan byte sumber yang dipin. Dispatch manual `Windows Node Release` hanya untuk
  pemulihan, dan selalu berikan tag persis, jangan pernah `latest`, plus map JSON
  `expected_installer_digests` eksplisit dari rilis sumber yang disetujui. Link unduhan
  situs web harus menargetkan URL aset rilis OpenClaw persis untuk rilis stabil saat ini,
  atau `releases/latest/download/...` hanya setelah memverifikasi redirect latest GitHub
  menunjuk ke rilis yang sama; jangan menautkan hanya ke halaman rilis repo companion.
- Release checks sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan lane paritas mock QA Lab plus profil Matrix
  live cepat dan lane QA Telegram sebelum persetujuan rilis. Lane live menggunakan
  environment `qa-live-shared`; Telegram juga menggunakan lease kredensial CI Convex.
  Jalankan workflow manual `QA-Lab - All Lanes` dengan `matrix_profile=all` dan
  `matrix_shards=true` ketika Anda menginginkan inventaris transport, media, dan E2EE
  Matrix penuh secara paralel.
- Validasi runtime instalasi dan upgrade lintas OS adalah bagian dari
  `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil workflow
  reusable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: pertahankan jalur rilis npm nyata tetap pendek, deterministik,
  dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di
  lane sendiri agar tidak menahan atau memblokir publikasi
- Release checks yang membawa secret harus di-dispatch melalui `Full Release
Validation` atau dari ref workflow `main`/release agar logika workflow dan
  secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama commit
  yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Preflight khusus validasi `OpenClaw NPM Release` juga menerima SHA commit branch workflow
  lengkap 40 karakter saat ini tanpa memerlukan tag yang sudah di-push
- Jalur SHA itu hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk pemeriksaan
  metadata package; publikasi nyata tetap memerlukan tag rilis nyata
- Kedua workflow mempertahankan jalur publikasi dan promosi nyata pada runner yang di-host
  GitHub, sementara jalur validasi non-mutasi dapat menggunakan runner Linux Blacksmith
  yang lebih besar
- Workflow itu menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Preflight rilis npm tidak lagi menunggu lane release checks terpisah
- Sebelum membuat tag kandidat rilis secara lokal, jalankan
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Helper ini
  menjalankan guardrail rilis cepat, pemeriksaan rilis npm/ClawHub Plugin, build,
  build UI, dan `release:openclaw:npm:check` dalam urutan yang menangkap kesalahan umum
  yang memblokir persetujuan sebelum workflow publikasi GitHub dimulai.
- Jalankan `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah publikasi npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur pemasangan registry yang dipublikasikan
  dalam prefiks sementara yang baru
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi penyiapan awal paket terpasang, pengaturan Telegram, dan E2E Telegram nyata
  terhadap paket npm yang dipublikasikan menggunakan kumpulan kredensial Telegram sewaan bersama.
  Eksekusi satu kali oleh maintainer lokal dapat menghilangkan variabel Convex dan meneruskan ketiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan pemeriksaan cepat beta pascapublikasi lengkap dari mesin maintainer, gunakan `pnpm release:beta-smoke -- --beta betaN`. Pembantu ini menjalankan validasi pembaruan npm Parallels/target-baru, memicu `NPM Telegram Beta E2E`, melakukan polling pada eksekusi alur kerja yang tepat, mengunduh artefak, dan mencetak laporan Telegram.
- Maintainer dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui alur kerja manual `NPM Telegram Beta E2E`. Alur kerja ini sengaja hanya manual dan
  tidak berjalan pada setiap penggabungan.
- Otomasi rilis maintainer sekarang menggunakan preflight-lalu-promosi:
  - publikasi npm nyata harus melewati `preflight_run_id` npm yang berhasil
  - publikasi npm nyata harus dipicu dari cabang `main` atau
    `release/YYYY.M.PATCH` yang sama dengan eksekusi preflight yang berhasil
  - rilis npm stabil secara bawaan menggunakan `beta`
  - publikasi npm stabil dapat menargetkan `latest` secara eksplisit melalui input alur kerja
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` karena
    `npm dist-tag add` masih membutuhkan `NPM_TOKEN` sementara repo sumber tetap menggunakan
    publikasi hanya OIDC
  - `macOS Release` publik bersifat hanya validasi; ketika tag hanya berada di
    cabang rilis tetapi alur kerja dipicu dari `main`, tetapkan
    `public_release_branch=release/YYYY.M.PATCH`
  - publikasi macOS nyata harus melewati `preflight_run_id` dan
    `validate_run_id` macOS yang berhasil
  - jalur publikasi nyata mempromosikan artefak yang sudah disiapkan alih-alih membangunnya ulang
- Untuk rilis koreksi stabil seperti `YYYY.M.PATCH-N`, pemverifikasi pascapublikasi
  juga memeriksa jalur peningkatan prefiks sementara yang sama dari `YYYY.M.PATCH` ke `YYYY.M.PATCH-N`
  sehingga koreksi rilis tidak dapat diam-diam membiarkan pemasangan global lama tetap pada
  payload stabil dasar
- Preflight rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  sehingga kita tidak mengirimkan dashboard browser kosong lagi
- Verifikasi pascapublikasi juga memeriksa bahwa entrypoint Plugin yang dipublikasikan dan
  metadata paket ada dalam tata letak registry yang terpasang. Rilis yang
  mengirimkan payload runtime Plugin yang hilang akan menggagalkan pemverifikasi pascapublikasi dan
  tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga memberlakukan anggaran `unpackedSize` npm pack pada
  tarball pembaruan kandidat, sehingga e2e pemasang menangkap pembengkakan pack yang tidak disengaja
  sebelum jalur publikasi rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes pengaturan waktu ekstensi, atau
  matriks pengujian ekstensi, buat ulang dan tinjau keluaran matriks
  `plugin-prerelease-extension-shard` milik perencana dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak
  menggambarkan tata letak CI yang usang
- Kesiapan rilis macOS stabil juga mencakup permukaan pembaru:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang dikemas
  - `appcast.xml` pada `main` harus menunjuk ke zip stabil baru setelah publikasi; alur kerja
    publikasi macOS meng-commit-nya secara otomatis, atau membuka PR appcast
    ketika push langsung diblokir
  - aplikasi yang dikemas harus mempertahankan id bundle non-debug, URL umpan Sparkle yang tidak kosong,
    dan `CFBundleVersion` pada atau di atas batas bawah build Sparkle kanonis
    untuk versi rilis tersebut

## Kotak uji rilis

`Full Release Validation` adalah cara operator memulai semua pengujian pra-rilis dari
satu entrypoint. Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan
helper agar setiap workflow turunan berjalan dari branch sementara yang dikunci pada target
SHA:
__OC_I18N_900000__
Helper ini mendorong `release-ci/<sha>-...`, menjalankan `Full Release Validation`
dari branch tersebut dengan `ref=<sha>`, memverifikasi setiap workflow turunan `headSha`
cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian
run turunan `main` yang lebih baru secara tidak sengaja.

Untuk validasi branch atau tag rilis, jalankan dari ref workflow `main` yang tepercaya
dan teruskan branch atau tag rilis sebagai `ref`:
__OC_I18N_900001__
Workflow menyelesaikan ref target, menjalankan `CI` manual dengan
`target_ref=<release-ref>`, lalu menjalankan `OpenClaw Release Checks`.
`OpenClaw Release Checks` menyebar ke install smoke, pemeriksaan rilis lintas-OS,
cakupan jalur rilis Docker live/E2E saat soak diaktifkan, Package Acceptance
dengan E2E paket Telegram kanonis, paritas QA Lab, Matrix live, dan Telegram live.
Run full/all hanya dapat diterima ketika ringkasan `Full Release Validation`
menunjukkan `normal_ci`, `plugin_prerelease`, dan `release_checks` sebagai
berhasil, kecuali rerun terfokus sengaja melewati turunan `Plugin
Prerelease` terpisah. Gunakan turunan mandiri `npm-telegram` hanya untuk rerun
paket terpublikasi yang terfokus dengan `release_package_spec` atau
`npm_telegram_package_spec`. Ringkasan verifier akhir menyertakan tabel job
terlambat untuk setiap run turunan, sehingga manajer rilis dapat melihat jalur
kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/reference/full-release-validation) untuk
matriks tahap lengkap, nama job workflow yang persis, perbedaan profil stable
versus full, artifact, dan handle rerun terfokus.
Workflow turunan dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan ketika `ref` target menunjuk ke
branch atau tag rilis yang lebih lama. Tidak ada input ref workflow Full Release
Validation terpisah; pilih harness tepercaya dengan memilih ref run workflow.
Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit persis pada `main`
yang bergerak; SHA commit mentah tidak dapat menjadi ref workflow dispatch, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat branch sementara yang dipin.

Gunakan `release_profile` untuk memilih cakupan live/provider:

- `minimum`: jalur OpenAI/core live dan Docker paling cepat yang kritis untuk rilis
- `stable`: minimum ditambah cakupan provider/backend stable untuk persetujuan rilis
- `full`: stable ditambah cakupan advisory provider/media yang luas

Validasi stable dan full selalu menjalankan sweep live/E2E, jalur rilis Docker,
dan penyintas upgrade terpublikasi terbatas yang menyeluruh sebelum promosi.
Gunakan `run_release_soak=true` untuk meminta sweep yang sama untuk beta. Sweep itu mencakup
empat paket stable terbaru plus baseline `2026.4.23` dan `2026.5.2`
yang dipin plus cakupan `2026.4.15` yang lebih lama, dengan baseline duplikat dihapus dan
setiap baseline dishard ke dalam job runner Docker sendiri.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref target
sekali sebagai `release-package-under-test` dan menggunakan kembali artifact tersebut di
pemeriksaan lintas-OS, Package Acceptance, dan Docker jalur rilis saat soak berjalan. Ini menjaga
semua kotak yang berhadapan dengan paket pada byte yang sama dan menghindari build paket berulang.
Setelah beta sudah berada di npm, setel `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
agar pemeriksaan rilis mengunduh paket yang telah dikirim sekali, mengekstrak SHA sumber build-nya
dari `dist/build-info.json`, dan menggunakan kembali artifact tersebut untuk lintas-OS,
Package Acceptance, Docker jalur rilis, dan lane Telegram paket.
Install smoke OpenAI lintas-OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat
variabel repo/org disetel, jika tidak `openai/gpt-5.4`, karena lane ini
membuktikan instalasi paket, onboarding, startup gateway, dan satu giliran agent live,
bukan melakukan benchmark terhadap model default paling lambat. Matriks provider live
yang lebih luas tetap menjadi tempat untuk cakupan spesifik model.

Gunakan varian ini bergantung pada tahap rilis:
__OC_I18N_900002__
Jangan gunakan payung full sebagai rerun pertama setelah perbaikan terfokus. Jika satu kotak
gagal, gunakan workflow turunan, job, lane Docker, profil paket, provider model,
atau lane QA yang gagal untuk bukti berikutnya. Jalankan payung full lagi hanya ketika
perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua-kotak sebelumnya
kedaluwarsa. Verifier akhir payung memeriksa ulang id run workflow turunan yang tercatat,
jadi setelah workflow turunan berhasil dijalankan ulang, jalankan ulang hanya job induk
`Verify full validation` yang gagal.

Untuk pemulihan terbatas, teruskan `rerun_group` ke payung. `all` adalah run
kandidat rilis sebenarnya, `ci` hanya menjalankan turunan CI normal, `plugin-prerelease`
hanya menjalankan turunan plugin khusus rilis, `release-checks` menjalankan setiap kotak
rilis, dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`.
Rerun `npm-telegram` terfokus memerlukan `release_package_spec` atau
`npm_telegram_package_spec`; run full/all menggunakan E2E Telegram paket kanonis
di dalam Package Acceptance. Rerun
cross-OS terfokus dapat menambahkan `cross_os_suite_filter=windows/packaged-upgrade` atau
filter OS/suite lain. Kegagalan release-check QA memblokir validasi rilis normal,
termasuk drift tool dinamis OpenClaw yang wajib di tier standar.
Run alpha Tideclaw masih dapat memperlakukan lane release-check non-package-safety sebagai
advisory. Saat `live_suite_filter` secara eksplisit meminta lane QA live berpagar seperti
Discord, WhatsApp, atau Slack, variabel repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` yang cocok harus diaktifkan; jika tidak,
penangkapan input gagal alih-alih melewati lane secara diam-diam.

### Vitest

Kotak Vitest adalah workflow turunan `CI` manual. CI manual sengaja
melewati scoping perubahan dan memaksa grafik pengujian normal untuk kandidat rilis:
shard Linux Node, shard bundled-plugin, shard kontrak plugin dan channel,
kompatibilitas Node 22, `check-*`, `check-additional-*`,
pemeriksaan smoke artifact yang dibangun, pemeriksaan docs, Skills Python, Windows, macOS,
dan i18n Control UI. Android disertakan ketika `Full Release Validation` menjalankan
kotak karena payung meneruskan `include_android=true`; CI manual mandiri
memerlukan `include_android=true` untuk cakupan Android.

Gunakan kotak ini untuk menjawab "apakah source tree lulus rangkaian pengujian normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- Ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dijalankan
- Run `CI` hijau pada SHA target yang persis
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artifact timing Vitest seperti `.artifacts/vitest-shard-timings.json` saat
  run memerlukan analisis performa

Jalankan CI manual secara langsung hanya ketika rilis memerlukan CI normal deterministik tetapi
bukan kotak Docker, QA Lab, live, lintas-OS, atau paket. Gunakan perintah pertama
untuk CI langsung non-Android. Tambahkan `include_android=true` saat CI langsung
kandidat rilis harus mencakup Android:
__OC_I18N_900003__
### Docker

Kotak Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, ditambah workflow
`install-smoke` mode rilis. Ini memvalidasi kandidat rilis melalui lingkungan
Docker berpaket, bukan hanya pengujian tingkat sumber.

Cakupan Docker rilis mencakup:

- install smoke penuh dengan smoke instalasi global Bun yang lambat diaktifkan
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
- lane install/uninstall bundled plugin yang dipisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker saat pemeriksaan rilis
  menyertakan suite live

Gunakan artifact Docker sebelum menjalankan ulang. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
timing fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada workflow live/E2E reusable alih-alih
menjalankan ulang semua chunk rilis. Perintah rerun yang dihasilkan menyertakan
`package_artifact_run_id` sebelumnya dan input image Docker yang disiapkan saat tersedia, sehingga
lane yang gagal dapat menggunakan kembali tarball dan image GHCR yang sama.

### QA Lab

Kotak QA Lab juga bagian dari `OpenClaw Release Checks`. Ini adalah gate rilis
perilaku agentic dan tingkat channel, terpisah dari mekanika paket Vitest dan Docker.

Cakupan QA Lab rilis mencakup:

- lane paritas mock yang membandingkan lane kandidat OpenAI terhadap baseline Opus 4.6
  menggunakan paket paritas agentic
- profil QA Matrix live cepat menggunakan environment `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke`, atau
  `pnpm qa:observability:smoke` saat telemetri rilis memerlukan bukti lokal
  eksplisit

Gunakan kotak ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan
alur channel live?" Simpan URL artifact untuk lane paritas, Matrix, dan Telegram
saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai run QA-Lab
sharded manual, bukan lane default yang kritis untuk rilis.

### Paket

Kotak Package adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalisasi
kandidat menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, serta menjaga ref harness
workflow tetap terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw
  yang tepat
- `source=ref`: kemas branch, tag, atau SHA commit lengkap `package_ref` tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS publik dengan `package_sha256` wajib;
  kredensial URL, port HTTPS non-default, hostname atau alamat yang diselesaikan
  yang bersifat privat/internal/penggunaan khusus, dan pengalihan tidak aman ditolak
- `source=trusted-url`: unduh `.tgz` HTTPS dengan `package_sha256` dan
  `trusted_source_id` wajib dari kebijakan bernama di
  `.github/package-trusted-sources.json`; gunakan ini untuk mirror enterprise
  milik maintainer atau repositori paket privat alih-alih menambahkan bypass
  jaringan privat tingkat input ke `source=url`
- `source=artifact`: gunakan kembali `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak
paket rilis yang telah disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mempertahankan migrasi, pembaruan,
restart pembaruan auth terkonfigurasi, instalasi skill ClawHub live, pembersihan dependensi Plugin usang, fixture Plugin offline, pembaruan Plugin, dan QA paket Telegram terhadap tarball yang sama yang telah diselesaikan. Pemeriksaan rilis yang memblokir menggunakan baseline paket terpublikasi terbaru default; profil beta dengan `run_release_soak=true`, `release_profile=stable`, atau
`release_profile=full` diperluas ke setiap baseline stabil yang dipublikasikan npm dari
`2026.4.23` hingga `latest` plus fixture isu yang dilaporkan. Gunakan
Package Acceptance dengan `source=npm` untuk kandidat yang sudah dikirim,
`source=ref` untuk tarball npm lokal berbasis SHA sebelum publikasi,
`source=trusted-url` untuk mirror enterprise/privat milik maintainer, atau
`source=artifact` untuk tarball yang telah disiapkan dan diunggah oleh run GitHub Actions lain.
Ini adalah pengganti native GitHub
untuk sebagian besar cakupan paket/pembaruan yang sebelumnya memerlukan
Parallels. Pemeriksaan rilis lintas OS tetap penting untuk onboarding,
installer, dan perilaku platform khusus OS, tetapi validasi produk paket/pembaruan sebaiknya
mengutamakan Package Acceptance.

Checklist kanonis untuk validasi pembaruan dan Plugin adalah
[Menguji pembaruan dan Plugin](/help/testing-updates-plugins). Gunakan saat
memutuskan lane lokal, Docker, Package Acceptance, atau release-check mana yang membuktikan
instalasi/pembaruan Plugin, pembersihan doctor, atau perubahan migrasi paket terpublikasi.
Migrasi pembaruan terpublikasi lengkap dari setiap paket stabil `2026.4.23+` adalah
workflow manual `Update Migration` terpisah, bukan bagian dari Full Release CI.

Kelonggaran package-acceptance legacy sengaja dibatasi waktu. Paket hingga
`2026.4.25` boleh menggunakan jalur kompatibilitas untuk celah metadata yang sudah dipublikasikan
ke npm: entri inventaris QA privat yang hilang dari tarball, `gateway install --wrapper` yang hilang, file patch yang hilang di fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi install-record Plugin legacy, persistensi install-record marketplace yang hilang, dan migrasi metadata config selama `plugins update`. Paket `2026.4.26` yang dipublikasikan boleh memberi peringatan
untuk file stamp metadata build lokal yang sudah dikirim. Paket berikutnya
harus memenuhi kontrak paket modern; celah yang sama akan menggagalkan
validasi rilis.

Gunakan profil Package Acceptance yang lebih luas ketika pertanyaan rilis berkaitan dengan
paket yang benar-benar dapat diinstal:
__OC_I18N_900004__
Profil paket umum:

- `smoke`: lane cepat untuk instalasi paket/channel/agen, jaringan Gateway, dan pemuatan ulang config
- `package`: kontrak paket instalasi/pembaruan/restart/Plugin plus bukti instalasi skill ClawHub live; ini adalah default release-check
- `product`: `package` plus channel MCP, pembersihan cron/subagent, pencarian web OpenAI, dan OpenWebUI
- `full`: bagian jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk rerun terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Package Acceptance. Workflow meneruskan tarball
`package-under-test` yang telah diselesaikan ke lane Telegram; workflow Telegram mandiri
tetap menerima spec npm terpublikasi untuk pemeriksaan pascapublikasi.

## Otomasi publikasi rilis

`OpenClaw Release Publish` adalah entrypoint publikasi bermutasi yang normal. Ini
mengorkestrasi workflow trusted-publisher dalam urutan yang dibutuhkan rilis:

1. Checkout tag rilis dan selesaikan SHA commit-nya.
2. Verifikasi tag dapat dijangkau dari `main` atau `release/*`.
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan scope dan SHA yang sama.
6. Dispatch `OpenClaw NPM Release` dengan tag rilis, npm dist-tag, dan
   `preflight_run_id` tersimpan setelah memverifikasi
   `full_release_validation_run_id` tersimpan.
7. Untuk rilis stabil, buat atau perbarui rilis GitHub sebagai draf, dispatch
   `Windows Node Release` dengan `windows_node_tag` eksplisit dan
   `windows_node_installer_digests` yang disetujui kandidat, lalu verifikasi aset
   installer/checksum kanonis sebelum memublikasikan draf.

Contoh publikasi beta:
__OC_I18N_900005__
Publikasi stabil ke dist-tag beta default:
__OC_I18N_900006__
Promosi stabil langsung ke `latest` bersifat eksplisit:
__OC_I18N_900007__
Gunakan workflow tingkat lebih rendah `Plugin NPM Release` dan `Plugin ClawHub Release`
hanya untuk pekerjaan perbaikan atau publikasi ulang yang terfokus. `OpenClaw Release Publish` menolak
`plugin_publish_scope=selected` ketika `publish_openclaw_npm=true` sehingga paket inti
tidak dapat dikirim tanpa setiap Plugin resmi yang dapat dipublikasikan, termasuk
`@openclaw/diffs-language-pack`. Untuk perbaikan Plugin terpilih, setel
`publish_openclaw_npm=false` dengan `plugin_publish_scope=selected` dan
`plugins=@openclaw/name`, atau dispatch workflow anak secara langsung.

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga boleh berupa
  SHA commit penuh 40 karakter dari branch workflow saat ini untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk
  jalur publikasi nyata
- `preflight_run_id`: wajib pada jalur publikasi nyata agar workflow menggunakan kembali
  tarball yang disiapkan dari run preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publikasi; default ke `beta`

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id run preflight `OpenClaw NPM Release` yang berhasil;
  wajib ketika `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id run `Full Release Validation` yang berhasil;
  wajib ketika `publish_openclaw_npm=true`
- `windows_node_tag`: tag rilis `openclaw/openclaw-windows-node` non-prarilis yang tepat;
  wajib untuk publikasi OpenClaw stabil
- `windows_node_installer_digests`: map JSON ringkas yang disetujui kandidat dari
  nama installer Windows saat ini ke digest `sha256:` yang dipin; wajib
  untuk publikasi OpenClaw stabil
- `npm_dist_tag`: tag target npm untuk paket OpenClaw
- `plugin_publish_scope`: default ke `all-publishable`; gunakan `selected` hanya
  untuk pekerjaan perbaikan khusus Plugin dengan `publish_openclaw_npm=false`
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma ketika
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default ke `true`; setel `false` hanya ketika menggunakan
  workflow sebagai orkestrator perbaikan khusus Plugin
- `wait_for_clawhub`: default ke `false` sehingga ketersediaan npm tidak diblokir oleh
  sidecar ClawHub; setel `true` hanya ketika penyelesaian workflow harus mencakup
  penyelesaian ClawHub

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: branch, tag, atau SHA commit penuh untuk divalidasi. Pemeriksaan yang membawa secret
  mengharuskan commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau
  tag rilis.
- `run_release_soak`: ikut serta dalam live/E2E lengkap, jalur rilis Docker, dan
  soak upgrade-survivor sejak semua rilis untuk pemeriksaan rilis beta. Ini dipaksa aktif oleh
  `release_profile=stable` dan `release_profile=full`.

Aturan:

- Tag stabil dan koreksi boleh dipublikasikan ke `beta` atau `latest`
- Tag prarilis beta hanya boleh dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit penuh hanya diizinkan ketika
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu
  khusus validasi
- Jalur publikasi nyata harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama preflight;
  workflow memverifikasi bahwa metadata tersebut sebelum publikasi berlanjut

## Urutan rilis npm stabil

Saat membuat rilis npm stabil:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit lengkap cabang workflow
     saat ini untuk dry run khusus validasi pada workflow prapenerbangan
2. Pilih `npm_dist_tag=beta` untuk alur normal beta-terlebih-dahulu, atau `latest` hanya
   saat Anda sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau SHA
   commit lengkap saat Anda menginginkan CI normal plus cakupan cache prompt live,
   Docker, QA Lab, Matrix, dan Telegram dari satu workflow manual
4. Jika Anda sengaja hanya memerlukan grafik pengujian normal yang deterministik, jalankan
   workflow manual `CI` pada ref rilis sebagai gantinya
5. Pilih tag rilis non-prarilis `openclaw/openclaw-windows-node` yang tepat
   yang installer x64 dan ARM64 bertanda tangannya harus dikirimkan. Simpan sebagai
   `windows_node_tag`, dan simpan peta digest tervalidasi mereka sebagai
   `windows_node_installer_digests`. Pembantu kandidat rilis mencatat keduanya
   dan menyertakannya dalam perintah publikasi yang dihasilkannya.
6. Simpan `preflight_run_id` dan `full_release_validation_run_id` yang berhasil
7. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag` yang sama,
   `windows_node_tag` yang dipilih, `windows_node_installer_digests` yang disimpan,
   `preflight_run_id` yang disimpan, dan `full_release_validation_run_id` yang disimpan;
   ini memublikasikan plugin yang dieksternalkan ke npm dan ClawHub sebelum mempromosikan
   paket npm OpenClaw
8. Jika rilis mendarat di `beta`, gunakan workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
9. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stabil yang sama, gunakan workflow rilis yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi
   pemulihan mandiri terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo ledger rilis karena masih memerlukan
`NPM_TOKEN`, sementara repo sumber mempertahankan publikasi khusus OIDC.

Itu membuat jalur publikasi langsung dan jalur promosi beta-terlebih-dahulu sama-sama
terdokumentasi dan terlihat oleh operator.

Jika seorang maintainer harus kembali ke autentikasi npm lokal, jalankan perintah
CLI 1Password (`op`) apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op`
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
untuk runbook aktual.

## Terkait

- [Kanal rilis](/id/install/development-channels)
