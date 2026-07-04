---
read_when:
    - Mencari definisi kanal rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan ritme rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan ritme rilis
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-07-04T18:24:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw saat ini mengekspos tiga kanal pembaruan yang menghadap pengguna:

- stable: kanal rilis promosi yang sudah ada, yang masih diselesaikan melalui
  npm `latest` sampai milestone CLI/kanal terpisah selesai
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: head bergerak dari `main`

Secara terpisah, operator rilis dapat memublikasikan paket inti bulan selesai
sebelumnya ke npm `extended-stable`, dimulai pada patch `33`. Lini final reguler
bulan berjalan tetap berlanjut di npm `latest`; pemisahan publikasi di sisi
operator ini tidak dengan sendirinya mengubah resolusi kanal pembaruan CLI.

## Penamaan versi

- Versi rilis npm extended-stable bulanan: `YYYY.M.PATCH`, dengan `PATCH >= 33`
  - Tag Git: `vYYYY.M.PATCH`
- Versi rilis final harian/reguler: `YYYY.M.PATCH`, dengan `PATCH < 33`
  - Tag Git: `vYYYY.M.PATCH`
- Versi rilis koreksi fallback reguler: `YYYY.M.PATCH-N`
  - Tag Git: `vYYYY.M.PATCH-N`
- Versi prarilis beta: `YYYY.M.PATCH-beta.N`
  - Tag Git: `vYYYY.M.PATCH-beta.N`
- Jangan beri nol di depan bulan atau patch
- Mulai pembaruan proses rilis Juni 2026, komponen ketiga adalah nomor
  rangkaian rilis bulanan berurutan, bukan hari kalender. Rilis stable dan beta
  menentukan rangkaian saat ini; tag khusus alpha tidak memakai atau memajukan
  nomor patch beta/stable. Tag dan versi npm sebelum pembaruan mempertahankan
  nama yang sudah ada dan tetap valid; otomasi rilis terus membandingkannya
  berdasarkan tahun, bulan, patch, kanal, dan nomor prarilis atau koreksi.
- Build alpha/nightly menggunakan rangkaian patch berikutnya yang belum dirilis
  dan hanya menaikkan `alpha.N` untuk build berulang. Setelah patch tersebut
  memiliki beta, build alpha baru pindah ke patch berikutnya. Abaikan tag lama
  khusus alpha dengan nomor patch lebih tinggi saat memilih rangkaian beta atau
  stable.
- Versi npm tidak dapat diubah. Jika tag beta sudah dipublikasikan, jangan
  menghapus, memublikasikan ulang, atau menggunakannya kembali; buat nomor beta
  berikutnya atau patch bulanan berikutnya. Karena `2026.6.5-beta.1` sudah
  dipublikasikan selama transisi, rangkaian rilis Juni 2026 harus menggunakan
  patch `5` atau lebih tinggi. Jangan publikasikan rangkaian stable atau beta
  Juni 2026 baru sebagai `2026.6.2`, `2026.6.3`, atau `2026.6.4`.
- Setelah final reguler `2026.6.5`, rangkaian beta baru berikutnya adalah
  `2026.6.6-beta.1`, meskipun
  tag otomatis khusus alpha dengan nomor patch lebih tinggi sudah ada.
- `latest` tetap mengikuti lini npm reguler/harian saat ini
- `beta` berarti target instalasi beta saat ini
- `extended-stable` berarti paket npm bulan sebelumnya yang didukung, dimulai pada patch
  `33`; patch `34` dan seterusnya adalah rilis pemeliharaan pada lini bulanan tersebut
- Jalur khusus extended-stable bulanan hanya memublikasikan paket npm inti. Jalur ini
  tidak memublikasikan plugin, artefak macOS atau Windows, GitHub Release,
  dist-tag repositori privat, image Docker, artefak mobile, atau unduhan situs web.

## Irama rilis

- Rilis bergerak dengan beta lebih dahulu
- Stable mengikuti hanya setelah beta terbaru divalidasi
- Maintainer biasanya membuat rilis dari branch `release/YYYY.M.PATCH` yang dibuat
  dari `main` saat ini, sehingga validasi rilis dan perbaikan tidak memblokir
  pengembangan baru di `main`
- Jika tag beta sudah di-push atau dipublikasikan dan memerlukan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Publikasi extended-stable bulanan khusus npm

Ini adalah pengecualian khusus terhadap prosedur rilis reguler di bawah. Untuk
bulan selesai `YYYY.M`, buat `extended-stable/YYYY.M.33`; publikasikan `vYYYY.M.33` dan
patch pemeliharaan berikutnya dari branch yang sama. Tag rilis, ujung branch,
checkout, versi paket, preflight npm, dan proses Validasi Rilis Lengkap harus
semuanya mengidentifikasi commit yang sama. `main` yang dilindungi harus sudah
memuat versi final bulan kalender yang benar-benar lebih baru di bawah patch `33`;
patch pemeliharaan tetap memenuhi syarat setelah `main` maju lebih dari satu bulan.

Jalankan preflight npm dan Validasi Rilis Lengkap dari branch extended-stable yang tepat,
lalu simpan kedua ID proses:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` adalah profil kedalaman validasi yang sudah ada; ini
terpisah dari dist-tag npm `extended-stable` dan sengaja tidak diubah.

Setelah kedua proses berhasil dan environment rilis npm siap, promosikan
tarball preflight yang tepat. Patch `P` harus `33` atau lebih besar:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

Untuk fork atau latihan non-produksi yang sengaja tidak dapat memenuhi
kebijakan bulan `.33` atau `main` dilindungi bulanan, tambahkan
`-f bypass_extended_stable_guard=true` ke dispatch preflight npm dan publish. Nilai
default adalah `false`. Bypass diterima hanya dengan `npm_dist_tag=extended-stable` dan
dicatat dalam ringkasan workflow. Ini tidak melewati ref workflow kanonis
`extended-stable/YYYY.M.33`, kesetaraan ujung branch/tag/checkout, sintaks tag final,
kesetaraan versi paket/tag, identitas proses dan manifes yang dirujuk,
provenans tarball, persetujuan environment, pembacaan balik registry, atau bukti
perbaikan selector.

Workflow publish memverifikasi identitas proses yang dirujuk, digest tarball
yang disiapkan, dan kedua selector registry npm. Konfirmasikan hasilnya secara
independen setelah workflow berhasil:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Kedua perintah harus mengembalikan `YYYY.M.P`. Jika publish berhasil tetapi pembacaan balik
selector gagal, jangan publikasikan ulang versi paket yang tidak dapat diubah. Gunakan satu
perintah perbaikan `npm dist-tag add openclaw@YYYY.M.P extended-stable` yang dicetak di
ringkasan always-run workflow yang gagal, lalu ulangi kedua pembacaan balik independen.
Rollback ke selector sebelumnya adalah keputusan operator terpisah, bukan
jalur perbaikan pembacaan balik.

Checklist reguler di bawah tetap memiliki beta, `latest`, GitHub Release,
plugin, macOS, Windows, dan publikasi platform lain. Jangan jalankan langkah-langkah tersebut
untuk jalur extended-stable khusus npm ini.

## Checklist operator rilis reguler

Checklist ini adalah bentuk publik dari alur rilis. Kredensial privat,
penandatanganan, notarization, pemulihan dist-tag, dan detail rollback darurat tetap berada di
runbook rilis khusus maintainer.

1. Mulai dari `main` saat ini: tarik yang terbaru, konfirmasi commit target sudah di-push,
   dan konfirmasi CI `main` saat ini cukup hijau untuk membuat cabang darinya.
2. Hasilkan bagian teratas `CHANGELOG.md` dari PR yang sudah digabungkan dan semua commit
   langsung sejak tag rilis terakhir yang dapat dijangkau. Buat entri berorientasi pengguna,
   hapus duplikasi entri PR/commit-langsung yang tumpang tindih, commit penulisan ulangnya, push,
   lalu rebase/pull sekali lagi sebelum membuat cabang.
3. Tinjau catatan kompatibilitas rilis di
   `src/plugins/compat/registry.ts` dan
   `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas
   yang kedaluwarsa hanya ketika jalur upgrade tetap tercakup, atau catat mengapa
   kompatibilitas itu sengaja dipertahankan.
4. Buat `release/YYYY.M.PATCH` dari `main` saat ini; jangan lakukan pekerjaan rilis normal
   langsung di `main`.
5. Naikkan setiap lokasi versi yang diperlukan untuk tag yang dituju, lalu jalankan
   `pnpm release:prep`. Perintah ini menyegarkan versi Plugin, inventaris Plugin, skema config,
   metadata config kanal bundel, baseline docs config, ekspor SDK Plugin,
   dan baseline API SDK Plugin dalam urutan yang benar. Commit setiap drift yang dihasilkan
   sebelum membuat tag. Lalu jalankan preflight deterministik lokal:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, dan `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag ada,
   SHA cabang rilis 40 karakter penuh diperbolehkan untuk preflight khusus validasi.
   Preflight menghasilkan bukti rilis dependensi untuk graf dependensi yang tepat
   sedang di-checkout dan menyimpannya di artefak preflight npm. Simpan
   `preflight_run_id` yang berhasil.
7. Mulai semua pengujian pra-rilis dengan `Full Release Validation` untuk cabang rilis,
   tag, atau SHA commit penuh. Ini adalah satu entrypoint manual untuk empat kotak pengujian
   rilis besar: Vitest, Docker, QA Lab, dan Package.
8. Jika validasi gagal, perbaiki di cabang rilis dan jalankan ulang file, lane,
   job workflow, profil package, provider, atau allowlist model terkecil yang gagal
   yang membuktikan perbaikan. Jalankan ulang payung penuh hanya ketika permukaan yang berubah
   membuat bukti sebelumnya menjadi usang.
9. Untuk kandidat beta bertag, jalankan
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` dari cabang
   `release/YYYY.M.PATCH` yang cocok. Untuk stabil, sertakan juga rilis sumber Windows
   yang diperlukan:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Helper ini menjalankan pemeriksaan rilis-terhasilkan lokal, mengirim atau memverifikasi
   bukti validasi rilis penuh dan preflight npm, menjalankan bukti fresh/update Parallels
   terhadap tarball yang disiapkan secara tepat plus bukti package Telegram,
   mencatat rencana npm Plugin dan ClawHub, serta mencetak perintah
   `OpenClaw Release Publish` yang tepat hanya setelah bundle bukti hijau.
   `OpenClaw Release Publish` mengirim package Plugin yang dipilih atau semua yang dapat dipublikasikan
   ke npm dan set yang sama ke ClawHub secara paralel, lalu mempromosikan
   artefak preflight npm OpenClaw yang disiapkan dengan dist-tag yang cocok segera setelah
   publikasi npm Plugin berhasil.
   Setelah child publikasi npm OpenClaw berhasil, workflow membuat atau memperbarui
   halaman rilis/prarilis GitHub yang cocok dari bagian `CHANGELOG.md` yang lengkap dan sesuai.
   Rilis stabil yang dipublikasikan ke npm `latest` menjadi rilis terbaru GitHub;
   rilis maintenance stabil yang tetap di npm `beta` dibuat dengan GitHub `latest=false`.
   Workflow ini juga mengunggah bukti dependensi preflight, manifest validasi penuh,
   dan bukti verifikasi registry pascapublikasi ke rilis GitHub untuk respons insiden
   pasca-rilis. Workflow publikasi mencetak ID run child segera, menyetujui otomatis
   gate environment rilis yang boleh disetujui token workflow, merangkum
   job child yang gagal dengan ekor log, menutup rilis GitHub dan bukti dependensi
   segera setelah publikasi npm OpenClaw berhasil, menunggu ClawHub setiap kali
   npm OpenClaw sedang dipublikasikan, lalu menjalankan `pnpm release:verify-beta` dan
   mengunggah bukti pascapublikasi untuk rilis GitHub, package npm, package npm Plugin
   terpilih, package ClawHub terpilih, ID run workflow child, dan ID run NPM Telegram
   opsional. Jalur ClawHub mencoba ulang kegagalan instalasi dependensi CLI yang sementara,
   memublikasikan Plugin yang lolos preview bahkan ketika satu sel preview flake,
   dan berakhir dengan verifikasi registry untuk setiap versi Plugin yang diharapkan
   agar publikasi parsial tetap terlihat dan dapat dicoba ulang. Lalu jalankan acceptance package
   pascapublikasi terhadap package
   `openclaw@YYYY.M.PATCH-beta.N` atau
   `openclaw@beta` yang sudah dipublikasikan. Jika prarilis yang sudah di-push atau dipublikasikan
   memerlukan perbaikan, buat nomor prarilis berikutnya yang cocok; jangan hapus atau tulis ulang
   prarilis lama.
10. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang sudah diperiksa memiliki
    bukti validasi yang diperlukan. Publikasi npm stabil juga melalui
    `OpenClaw Release Publish`, menggunakan kembali artefak preflight yang berhasil melalui
    `preflight_run_id`; kesiapan rilis macOS stabil juga memerlukan
    `.zip`, `.dmg`, `.dSYM.zip` yang sudah dipaketkan, dan `appcast.xml` yang diperbarui di `main`.
    Workflow publikasi macOS memublikasikan appcast bertanda tangan ke `main` publik
    secara otomatis setelah aset rilis diverifikasi; jika proteksi cabang memblokir
    push langsung, workflow membuka atau memperbarui PR appcast. Kesiapan Windows Hub stabil
    memerlukan aset `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe`, dan
    `OpenClawCompanion-SHA256SUMS.txt` bertanda tangan di rilis GitHub OpenClaw.
    Teruskan tag rilis `openclaw/openclaw-windows-node` bertanda tangan yang tepat sebagai
    `windows_node_tag` dan peta digest installer yang disetujui kandidatnya sebagai
    `windows_node_installer_digests`; `OpenClaw Release Publish` mempertahankan
    draft rilis, mengirim `Windows Node Release`, dan memverifikasi ketiga
    aset sebelum publikasi.
11. Setelah publikasi, jalankan verifier npm pascapublikasi, E2E Telegram npm-terpublikasi
    mandiri opsional ketika Anda memerlukan bukti kanal pascapublikasi,
    promosi dist-tag saat diperlukan, verifikasi halaman rilis GitHub yang dihasilkan,
    jalankan langkah pengumuman rilis, lalu selesaikan [Penutupan main
    stabil](#stable-main-closeout) sebelum menyebut rilis stabil selesai.

## Penutupan main stabil

Publikasi stabil belum lengkap sampai `main` membawa status rilis yang benar-benar dikirim.

1. Mulai dari `main` terbaru yang segar. Audit `release/YYYY.M.PATCH` terhadapnya dan
   forward-port perbaikan nyata yang tidak ada di `main`. Jangan menggabungkan secara membabi buta
   adapter kompatibilitas, pengujian, atau validasi khusus rilis ke `main` yang lebih baru.
2. Set `main` ke versi stabil yang dikirim, bukan train berikutnya yang spekulatif. Jalankan
   `pnpm release:prep` setelah perubahan versi root, lalu
   `pnpm deps:shrinkwrap:generate`.
3. Buat bagian `## YYYY.M.PATCH` di `CHANGELOG.md` pada `main` sama persis dengan
   cabang rilis bertag. Sertakan pembaruan `appcast.xml` stabil ketika rilis mac
   memublikasikannya.
4. Jangan tambahkan `YYYY.M.PATCH+1`, versi beta, atau bagian changelog masa depan kosong
   ke `main` sampai operator secara eksplisit memulai train rilis itu.
5. Jalankan `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, dan
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Push, lalu verifikasi `origin/main`
   berisi versi dan changelog yang dikirim sebelum menyebut rilis stabil
   selesai.
6. Jaga variabel repository `RELEASE_ROLLBACK_DRILL_ID` dan
   `RELEASE_ROLLBACK_DRILL_DATE` tetap terkini setelah setiap drill rollback privat.
   `OpenClaw Stable Main Closeout` dimulai dari push `main` yang membawa
   versi, changelog, dan appcast yang dikirim setelah publikasi stabil. Workflow ini membaca
   bukti pascapublikasi immutable untuk mengikat tag yang dikirim ke run Full Release
   Validation dan Publish-nya, lalu memverifikasi status main stabil, rilis,
   soak stabil wajib, dan bukti performa pemblokir. Workflow ini melampirkan
   manifest closeout immutable dan checksum ke rilis GitHub. Trigger push otomatis
   melewati rilis legacy yang mendahului bukti pascapublikasi immutable; workflow tidak pernah
   memperlakukan skip itu sebagai closeout yang selesai. Closeout lengkap memerlukan kedua
   aset dan checksum yang cocok. Manifest parsial memutar ulang SHA `main` dan drill rollback
   yang tercatat untuk menghasilkan ulang byte identik, lalu melampirkan checksum yang hilang;
   pasangan yang tidak valid, atau checksum tanpa manifest, tetap memblokir. Run yang dipicu push
   tanpa variabel repository drill rollback melewati tanpa menyelesaikan closeout; catatan drill
   yang hilang atau berusia lebih dari 90 hari masih memblokir closeout manual berbasis bukti.
   Perintah pemulihan privat tetap berada di runbook khusus maintainer.
   Gunakan pengiriman manual hanya untuk memperbaiki atau memutar ulang closeout stabil berbasis bukti.
   Tag koreksi fallback legacy dapat menggunakan kembali bukti package dasar hanya ketika
   tag koreksi resolve ke commit sumber yang sama dengan tag stabil dasar.
   Koreksi dengan sumber berbeda harus memublikasikan dan memverifikasi bukti package-nya sendiri.

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum preflight rilis agar TypeScript pengujian tetap
  tercakup di luar gate lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum preflight rilis agar pemeriksaan siklus
  impor yang lebih luas dan batas arsitektur hijau di luar gate lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak
  rilis `dist/*` yang diharapkan dan bundle Control UI tersedia untuk langkah
  validasi pack
- Jalankan `pnpm release:prep` setelah bump versi root dan sebelum tagging. Perintah ini
  menjalankan setiap generator rilis deterministik yang umum bergeser setelah perubahan
  versi/konfigurasi/API: versi plugin, inventaris plugin, skema konfigurasi dasar,
  metadata konfigurasi channel bawaan, baseline dokumen konfigurasi, ekspor SDK plugin,
  dan baseline API SDK plugin. `pnpm release:check` menjalankan ulang guard tersebut
  dalam mode pemeriksaan dan melaporkan setiap kegagalan drift yang dihasilkan dalam satu
  lintasan sebelum menjalankan pemeriksaan rilis paket.
- Sinkronisasi versi plugin memperbarui versi paket plugin resmi dan floor
  `openclaw.compat.pluginApi` yang ada ke versi rilis OpenClaw secara default.
  Perlakukan field itu sebagai floor API SDK/runtime plugin, bukan sekadar salinan
  versi paket: untuk rilis khusus plugin yang sengaja tetap kompatibel dengan host
  OpenClaw yang lebih lama, pertahankan floor pada API host tertua yang didukung
  dan dokumentasikan pilihan itu dalam bukti rilis plugin.
- Jalankan workflow manual `Full Release Validation` sebelum persetujuan rilis untuk
  memulai semua kotak pengujian pra-rilis dari satu entrypoint. Workflow ini menerima branch,
  tag, atau SHA commit lengkap, men-dispatch `CI` manual, dan men-dispatch
  `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, pemeriksaan paket
  lintas-OS, paritas QA Lab, Matrix, dan jalur Telegram. Run stable dan full
  selalu menyertakan live/E2E menyeluruh dan soak jalur rilis Docker;
  `run_release_soak=true` dipertahankan untuk soak beta eksplisit. Package
  Acceptance menyediakan Telegram E2E paket kanonis selama validasi kandidat,
  sehingga menghindari poller live kedua yang berjalan bersamaan.
  Berikan `release_package_spec` setelah memublikasikan beta untuk menggunakan ulang
  paket npm yang sudah dikirim di seluruh pemeriksaan rilis, Package Acceptance, dan
  Telegram E2E paket tanpa membangun ulang tarball rilis. Berikan
  `npm_telegram_package_spec` hanya ketika Telegram harus menggunakan paket yang
  dipublikasikan berbeda dari validasi rilis lainnya. Berikan
  `package_acceptance_package_spec` ketika Package Acceptance harus menggunakan paket
  yang dipublikasikan berbeda dari spec paket rilis. Berikan
  `evidence_package_spec` ketika laporan bukti rilis harus membuktikan bahwa
  validasi cocok dengan paket npm yang dipublikasikan tanpa memaksa Telegram E2E.
  Contoh:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Jalankan workflow manual `Package Acceptance` ketika Anda menginginkan bukti
  side-channel untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk
  `openclaw@beta`, `openclaw@latest`, atau versi rilis persis; `source=ref`
  untuk mengemas branch/tag/SHA `package_ref` tepercaya dengan harness
  `workflow_ref` saat ini; `source=url` untuk tarball HTTPS publik dengan
  SHA-256 wajib dan kebijakan URL publik yang ketat; `source=trusted-url` untuk
  kebijakan sumber tepercaya bernama menggunakan `trusted_source_id` dan SHA-256 wajib; atau
  `source=artifact` untuk tarball yang diunggah oleh run GitHub Actions lain. Workflow ini
  menyelesaikan kandidat menjadi
  `package-under-test`, menggunakan ulang scheduler rilis Docker E2E terhadap
  tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan
  `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika
  jalur Docker yang dipilih menyertakan `published-upgrade-survivor`, artefak
  paket adalah kandidat dan `published_upgrade_survivor_baseline` memilih
  baseline yang dipublikasikan. `update-restart-auth` menggunakan paket kandidat sebagai
  CLI yang diinstal dan package-under-test sehingga menguji jalur restart terkelola
  dari perintah update kandidat.
  Contoh: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profil umum:
  - `smoke`: jalur instalasi/channel/agent, jaringan gateway, dan reload konfigurasi
  - `package`: jalur paket/update/restart/plugin yang native-artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket ditambah channel MCP, pembersihan cron/subagent,
    pencarian web OpenAI, dan OpenWebUI
  - `full`: chunk jalur rilis Docker dengan OpenWebUI
  - `custom`: pilihan `docker_lanes` persis untuk rerun terfokus
- Jalankan workflow manual `CI` secara langsung ketika Anda hanya memerlukan cakupan CI normal
  deterministik untuk kandidat rilis. Dispatch CI manual melewati cakupan changed
  dan memaksa shard Linux Node, shard plugin bawaan, shard kontrak plugin dan
  channel, kompatibilitas Node 22, `check-*`, `check-additional-*`,
  pemeriksaan smoke artefak terbangun, pemeriksaan dokumen, Python skills, Windows, macOS, dan
  jalur i18n Control UI. Run CI manual standalone menjalankan Android hanya ketika di-dispatch
  dengan `include_android=true`; `Full Release Validation` meneruskan input itu untuk
  child CI-nya.
  Contoh dengan Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Jalankan `pnpm qa:otel:smoke` ketika memvalidasi telemetri rilis. Perintah ini menguji
  QA-lab melalui receiver OTLP/HTTP lokal dan memverifikasi ekspor trace, metrik, dan log
  plus atribut trace terbatas serta redaksi konten/identifier tanpa
  memerlukan Opik, Langfuse, atau collector eksternal lain.
- Jalankan `pnpm qa:otel:collector-smoke` ketika memvalidasi kompatibilitas collector.
  Perintah ini merutekan ekspor OTLP QA-lab yang sama melalui container Docker OpenTelemetry Collector
  nyata sebelum assertion receiver lokal.
- Jalankan `pnpm qa:prometheus:smoke` ketika memvalidasi scraping Prometheus yang dilindungi.
  Perintah ini menguji QA-lab, menolak scrape yang tidak terautentikasi, dan memverifikasi
  keluarga metrik kritis-rilis tetap bebas dari konten prompt, identifier mentah,
  token auth, dan path lokal.
- Jalankan `pnpm qa:observability:smoke` ketika Anda menginginkan jalur smoke
  OpenTelemetry dan Prometheus checkout sumber berjalan berurutan.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Preflight `OpenClaw NPM Release` menghasilkan bukti rilis dependensi sebelum
  mengemas tarball npm. Gate kerentanan advisory npm bersifat
  pemblokir rilis. Risiko manifes transitif, permukaan kepemilikan/instalasi dependensi,
  dan laporan perubahan dependensi hanya merupakan bukti rilis. Laporan
  perubahan dependensi membandingkan kandidat rilis dengan tag rilis terjangkau
  sebelumnya.
- Preflight mengunggah bukti dependensi sebagai
  `openclaw-release-dependency-evidence-<tag>` dan juga menyematkannya di bawah
  `dependency-evidence/` di dalam artefak preflight npm yang disiapkan. Jalur publish
  nyata menggunakan ulang artefak preflight itu, lalu melampirkan bukti yang sama
  ke rilis GitHub sebagai `openclaw-<version>-dependency-evidence.zip`.
- Jalankan `OpenClaw Release Publish` untuk urutan publish yang memutasi setelah
  tag ada. Dispatch dari `release/YYYY.M.PATCH` (atau `main` ketika memublikasikan
  tag yang terjangkau dari main), berikan tag rilis, `preflight_run_id` npm
  OpenClaw yang berhasil, dan `full_release_validation_run_id` yang berhasil, serta pertahankan
  cakupan publish plugin default `all-publishable` kecuali Anda sengaja
  menjalankan perbaikan terfokus. Workflow menserialkan publish npm plugin, publish
  ClawHub plugin, dan publish npm OpenClaw sehingga paket core tidak dipublikasikan
  sebelum plugin yang dieksternalisasi.
- `OpenClaw Release Publish` stable memerlukan `windows_node_tag` persis setelah
  rilis `openclaw/openclaw-windows-node` non-prerelease yang cocok ada.
  Workflow ini juga memerlukan map `windows_node_installer_digests` yang disetujui kandidat.
  Sebelum men-dispatch child publish apa pun, workflow memverifikasi bahwa rilis sumber
  sudah dipublikasikan, non-prerelease, berisi installer x64/ARM64 yang diperlukan, dan
  masih cocok dengan map yang disetujui itu. Lalu workflow men-dispatch `Windows Node Release`
  saat rilis OpenClaw masih berupa draf, membawa map digest installer yang dipin tanpa perubahan.
  Workflow child
  mengunduh installer Windows Hub bertanda tangan dari tag persis itu,
  mencocokkannya dengan digest yang dipin, memverifikasi tanda tangan Authenticode-nya
  menggunakan signer OpenClaw Foundation yang diharapkan pada runner Windows,
  menulis manifes SHA-256, dan mengunggah installer plus manifes ke
  rilis GitHub OpenClaw kanonis, lalu mengunduh ulang aset yang dipromosikan dan
  memverifikasi keanggotaan manifes serta hash. Parent memverifikasi kontrak aset
  x64, ARM64, dan checksum saat ini sebelum publikasi. Pemulihan langsung
  menolak nama aset `OpenClawCompanion-*` yang tidak diharapkan sebelum mengganti
  aset kontrak yang diharapkan dengan byte sumber yang dipin. Dispatch manual
  `Windows Node Release` hanya untuk pemulihan, dan selalu berikan tag persis, jangan pernah
  `latest`, plus map JSON `expected_installer_digests` eksplisit dari rilis sumber
  yang disetujui. Tautan unduhan situs web harus menargetkan URL aset rilis OpenClaw
  persis untuk rilis stable saat ini, atau
  `releases/latest/download/...` hanya setelah memverifikasi redirect latest GitHub
  mengarah ke rilis yang sama; jangan hanya menautkan ke halaman rilis repo companion.
- Pemeriksaan rilis sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan jalur paritas mock QA Lab plus profil
  Matrix live cepat dan jalur QA Telegram sebelum persetujuan rilis. Jalur live
  menggunakan environment `qa-live-shared`; Telegram juga menggunakan lease kredensial
  Convex CI. Jalankan workflow manual `QA-Lab - All Lanes` dengan
  `matrix_profile=all` dan `matrix_shards=true` ketika Anda menginginkan inventaris
  transport, media, dan E2EE Matrix penuh secara paralel.
- Validasi runtime instalasi dan upgrade lintas-OS adalah bagian dari
  `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil
  workflow reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung
- Pemisahan ini disengaja: jaga agar jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada
  di jalurnya sendiri agar tidak menahan atau memblokir publish
- Pemeriksaan rilis yang membawa secret harus di-dispatch melalui `Full Release
Validation` atau dari ref workflow `main`/release agar logika workflow dan
  secret tetap terkendali
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama
  commit yang diselesaikan dapat dijangkau dari branch OpenClaw atau tag rilis
- Preflight khusus-validasi `OpenClaw NPM Release` juga menerima SHA commit
  branch workflow 40 karakter penuh saat ini tanpa memerlukan tag yang sudah di-push
- Jalur SHA itu hanya untuk validasi dan tidak dapat dipromosikan menjadi publish nyata
- Dalam mode SHA, workflow menyintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata paket; publish nyata tetap memerlukan tag rilis nyata
- Kedua workflow mempertahankan jalur publish dan promosi nyata di runner yang di-host GitHub,
  sementara jalur validasi non-mutasi dapat menggunakan runner Linux Blacksmith yang lebih besar
- Workflow itu menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Preflight rilis npm tidak lagi menunggu jalur pemeriksaan rilis terpisah
- Sebelum men-tag kandidat rilis secara lokal, jalankan
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Helper ini
  menjalankan guardrail rilis cepat, pemeriksaan rilis npm/ClawHub plugin, build,
  build UI, dan `release:openclaw:npm:check` dalam urutan yang menangkap kesalahan
  umum yang memblokir persetujuan sebelum workflow publish GitHub dimulai.
- Jalankan `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang cocok) sebelum persetujuan
- Setelah npm publish, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi registry
  yang telah dipublikasikan dalam prefiks sementara baru
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan E2E Telegram nyata
  terhadap paket npm yang telah dipublikasikan menggunakan kumpulan kredensial Telegram
  sewaan bersama. One-off maintainer lokal dapat menghilangkan variabel Convex dan meneruskan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pascapublikasi penuh dari mesin maintainer, gunakan `pnpm release:beta-smoke -- --beta betaN`. Helper menjalankan validasi pembaruan npm Parallels/target baru, memicu `NPM Telegram Beta E2E`, melakukan polling pada run workflow yang tepat, mengunduh artefak, dan mencetak laporan Telegram.
- Maintainer dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui workflow
  manual `NPM Telegram Beta E2E`. Ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer sekarang menggunakan preflight-lalu-promote:
  - publikasi npm nyata harus lulus npm `preflight_run_id` yang berhasil
  - publikasi npm nyata harus dipicu dari branch `main` atau
    `release/YYYY.M.PATCH` yang sama dengan run preflight yang berhasil
  - rilis npm stable secara default menggunakan `beta`
  - publikasi npm stable dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` karena
    `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara repo sumber tetap menggunakan
    publikasi hanya OIDC
  - `macOS Release` publik bersifat hanya validasi; ketika tag hanya berada pada
    branch rilis tetapi workflow dipicu dari `main`, setel
    `public_release_branch=release/YYYY.M.PATCH`
  - publikasi macOS nyata harus lulus macOS `preflight_run_id` dan
    `validate_run_id` yang berhasil
  - jalur publikasi nyata mempromosikan artefak yang telah disiapkan alih-alih membangunnya
    lagi
- Untuk rilis koreksi stable seperti `YYYY.M.PATCH-N`, verifier pascapublikasi
  juga memeriksa jalur upgrade prefiks sementara yang sama dari `YYYY.M.PATCH` ke `YYYY.M.PATCH-N`
  sehingga koreksi rilis tidak dapat secara diam-diam membiarkan instalasi global lama tetap pada
  payload stable dasar
- Preflight rilis npm gagal tertutup kecuali tarball menyertakan keduanya
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  sehingga kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pascapublikasi juga memeriksa bahwa entrypoint plugin yang dipublikasikan dan
  metadata paket ada dalam tata letak registry yang terinstal. Rilis yang
  mengirim payload runtime plugin yang hilang akan gagal pada verifier pascapublikasi dan
  tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga memberlakukan batas `unpackedSize` npm pack pada
  tarball pembaruan kandidat, sehingga e2e installer menangkap pembengkakan pack yang tidak disengaja
  sebelum jalur publikasi rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes timing plugin, atau
  matriks pengujian plugin, regenerasikan dan tinjau output matriks milik planner
  `plugin-prerelease-extension-shard` dari
  `.github/workflows/plugin-prerelease.yml` sebelum persetujuan sehingga catatan rilis tidak
  menggambarkan tata letak CI yang usang
- Kesiapan rilis macOS stable juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang dipaketkan
  - `appcast.xml` pada `main` harus menunjuk ke zip stable baru setelah publikasi; workflow
    publikasi macOS meng-commit-nya secara otomatis, atau membuka PR appcast
    ketika push langsung diblokir
  - aplikasi yang dipaketkan harus mempertahankan bundle id non-debug, URL feed Sparkle
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas batas bawah build Sparkle kanonis
    untuk versi rilis tersebut

## Kotak uji rilis

`Full Release Validation` adalah cara operator memulai semua pengujian pra-rilis dari
satu titik masuk. Untuk bukti commit yang dipatok pada branch yang bergerak cepat, gunakan
helper agar setiap workflow anak berjalan dari branch sementara yang ditetapkan pada target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper tersebut mendorong `release-ci/<sha>-...`, menjalankan `Full Release Validation`
dari branch itu dengan `ref=<sha>`, memverifikasi setiap workflow anak `headSha`
cocok dengan target, lalu menghapus branch sementara. Ini menghindari pembuktian
run anak `main` yang lebih baru secara tidak sengaja.

Untuk validasi branch rilis atau tag, jalankan dari ref workflow `main` yang tepercaya
dan berikan branch rilis atau tag sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Workflow menyelesaikan ref target, menjalankan `CI` manual dengan
`target_ref=<release-ref>`, lalu menjalankan `OpenClaw Release Checks`.
`OpenClaw Release Checks` menyebar ke install smoke, pemeriksaan rilis lintas-OS,
cakupan jalur rilis Docker live/E2E saat soak diaktifkan, Package Acceptance
dengan E2E paket Telegram kanonis, paritas QA Lab, Matrix live, dan Telegram
live. Run penuh/semua hanya dapat diterima ketika ringkasan `Full Release Validation`
menampilkan `normal_ci`, `plugin_prerelease`, dan `release_checks` sebagai
berhasil, kecuali rerun terfokus sengaja melewati anak `Plugin
Prerelease` terpisah. Gunakan anak mandiri `npm-telegram` hanya untuk rerun
paket-terbit terfokus dengan `release_package_spec` atau
`npm_telegram_package_spec`. Ringkasan verifier akhir menyertakan tabel job
paling lambat untuk setiap run anak, sehingga manajer rilis dapat melihat jalur
kritis saat ini tanpa mengunduh log.
Lihat [Validasi rilis penuh](/id/reference/full-release-validation) untuk matriks
tahap lengkap, nama job workflow yang tepat, perbedaan profil stable versus full,
artefak, dan handle rerun terfokus.
Workflow anak dijalankan dari ref tepercaya yang menjalankan `Full Release
Validation`, biasanya `--ref main`, bahkan ketika target `ref` menunjuk ke
branch rilis atau tag yang lebih lama. Tidak ada input ref workflow Full Release
Validation yang terpisah; pilih harness tepercaya dengan memilih ref run workflow.
Jangan gunakan `--ref main -f ref=<sha>` untuk bukti commit tepat pada `main` yang bergerak;
SHA commit mentah tidak dapat menjadi ref workflow dispatch, jadi gunakan
`pnpm ci:full-release --sha <sha>` untuk membuat branch sementara yang dipatok.

Gunakan `release_profile` untuk memilih keluasan live/provider:

- `minimum`: jalur Docker dan live OpenAI/core yang paling cepat dan kritis untuk rilis
- `stable`: minimum plus cakupan provider/backend stable untuk persetujuan rilis
- `full`: stable plus cakupan provider/media advisory yang luas

Validasi stable dan full selalu menjalankan sweep live/E2E, Docker jalur rilis,
dan upgrade-survivor paket terbit terbatas yang menyeluruh sebelum promosi.
Gunakan `run_release_soak=true` untuk meminta sweep yang sama untuk beta. Sweep tersebut mencakup
empat paket stable terbaru plus baseline `2026.4.23` dan `2026.5.2` yang dipatok
plus cakupan `2026.4.15` yang lebih lama, dengan baseline duplikat dihapus dan
setiap baseline di-shard ke job runner Docker tersendiri.

`OpenClaw Release Checks` menggunakan ref workflow tepercaya untuk menyelesaikan ref target
sekali sebagai `release-package-under-test` dan menggunakan kembali artefak tersebut di
pemeriksaan lintas-OS, Package Acceptance, dan Docker jalur rilis saat soak berjalan. Ini menjaga
semua kotak yang berhadapan dengan paket pada byte yang sama dan menghindari build paket berulang.
Setelah beta sudah ada di npm, setel `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
agar pemeriksaan rilis mengunduh paket yang dikirim sekali, mengekstrak SHA sumber build-nya
dari `dist/build-info.json`, dan menggunakan kembali artefak tersebut untuk lintas-OS,
Package Acceptance, Docker jalur rilis, dan lane Telegram paket.
Install smoke OpenAI lintas-OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika
variabel repo/org disetel, jika tidak `openai/gpt-5.4`, karena lane ini
membuktikan instalasi paket, onboarding, startup Gateway, dan satu giliran agen live
alih-alih melakukan benchmark model default paling lambat. Matriks provider live yang lebih luas
tetap menjadi tempat untuk cakupan spesifik model.

Gunakan varian ini tergantung tahap rilis:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
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
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Jangan gunakan payung penuh sebagai rerun pertama setelah perbaikan terfokus. Jika satu kotak
gagal, gunakan workflow anak, job, lane Docker, profil paket, provider model,
atau lane QA yang gagal untuk bukti berikutnya. Jalankan kembali payung penuh hanya ketika
perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua-kotak sebelumnya
usang. Verifier akhir payung memeriksa ulang id run workflow anak yang direkam,
jadi setelah workflow anak berhasil dijalankan ulang, rerun hanya job induk
`Verify full validation` yang gagal.

Untuk pemulihan terbatas, berikan `rerun_group` ke payung. `all` adalah run
kandidat rilis yang sesungguhnya, `ci` hanya menjalankan anak CI normal, `plugin-prerelease`
hanya menjalankan anak plugin khusus rilis, `release-checks` menjalankan setiap kotak rilis,
dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`.
Rerun `npm-telegram` terfokus memerlukan `release_package_spec` atau
`npm_telegram_package_spec`; run penuh/semua menggunakan E2E Telegram paket kanonis
di dalam Package Acceptance. Rerun lintas-OS terfokus dapat menambahkan
`cross_os_suite_filter=windows/packaged-upgrade` atau filter OS/suite lain.
Kegagalan QA release-check memblokir validasi rilis normal, termasuk drift tool
dinamis OpenClaw yang wajib di tingkat standar. Run alpha Tideclaw masih dapat
memperlakukan lane release-check non-keamanan-paket sebagai advisory. Ketika
`live_suite_filter` secara eksplisit meminta lane live QA berpagar seperti
Discord, WhatsApp, atau Slack, variabel repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` yang sesuai harus diaktifkan; jika tidak,
pengambilan input gagal alih-alih diam-diam melewati lane.

### Vitest

Kotak Vitest adalah workflow anak `CI` manual. CI manual sengaja melewati
scoping perubahan dan memaksa grafik pengujian normal untuk kandidat rilis:
shard Linux Node, shard plugin bawaan, shard kontrak plugin dan channel,
kompatibilitas Node 22, `check-*`, `check-additional-*`,
pemeriksaan smoke artefak build, pemeriksaan docs, Skills Python, Windows, macOS,
dan i18n Control UI. Android disertakan ketika `Full Release Validation` menjalankan
kotak tersebut karena payung meneruskan `include_android=true`; CI manual mandiri
memerlukan `include_android=true` untuk cakupan Android.

Gunakan kotak ini untuk menjawab "apakah source tree lulus suite pengujian normal penuh?"
Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL run `CI` yang dijalankan
- run `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artefak timing Vitest seperti `.artifacts/vitest-shard-timings.json` ketika
  sebuah run membutuhkan analisis performa

Jalankan CI manual secara langsung hanya ketika rilis membutuhkan CI normal deterministik tetapi
bukan kotak Docker, QA Lab, live, lintas-OS, atau paket. Gunakan perintah pertama
untuk CI langsung non-Android. Tambahkan `include_android=true` ketika CI
kandidat rilis langsung harus mencakup Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Kotak Docker berada di `OpenClaw Release Checks` melalui
`openclaw-live-and-e2e-checks-reusable.yml`, plus workflow `install-smoke`
mode rilis. Ini memvalidasi kandidat rilis melalui lingkungan Docker terpaket
alih-alih hanya pengujian tingkat sumber.

Cakupan Docker rilis mencakup:

- install smoke penuh dengan smoke instal global Bun yang lambat diaktifkan
- persiapan/penggunaan ulang image smoke Dockerfile root berdasarkan SHA target, dengan job smoke QR,
  root/gateway, dan installer/Bun berjalan sebagai shard install-smoke terpisah
- lane E2E repositori
- chunk Docker jalur rilis: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, dan `plugins-runtime-install-h`
- cakupan OpenWebUI di dalam chunk `plugins-runtime-services` saat diminta
- lane install/uninstall plugin bawaan yang dipisah
  `bundled-plugin-install-uninstall-0` hingga
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E dan cakupan model live Docker ketika pemeriksaan rilis
  menyertakan suite live

Gunakan artefak Docker sebelum menjalankan ulang. Scheduler jalur rilis mengunggah
`.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`,
timing fase, JSON rencana scheduler, dan perintah rerun. Untuk pemulihan terfokus,
gunakan `docker_lanes=<lane[,lane]>` pada workflow live/E2E reusable alih-alih
menjalankan ulang semua chunk rilis. Perintah rerun yang dihasilkan menyertakan
`package_artifact_run_id` sebelumnya dan input image Docker yang disiapkan saat tersedia, sehingga
lane yang gagal dapat menggunakan ulang tarball dan image GHCR yang sama.

### QA Lab

Kotak QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Ini adalah gate rilis
perilaku agentik dan tingkat channel, terpisah dari mekanik paket Vitest dan Docker.

Cakupan QA Lab rilis mencakup:

- lane paritas mock yang membandingkan lane kandidat OpenAI dengan baseline Opus 4.6
  menggunakan paket paritas agentik
- profil QA Matrix live cepat menggunakan lingkungan `qa-live-shared`
- lane QA Telegram live menggunakan lease kredensial CI Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke`, atau
  `pnpm qa:observability:smoke` ketika telemetri rilis membutuhkan bukti lokal eksplisit

Gunakan kotak ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan
alur channel live?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram
saat menyetujui rilis. Cakupan Matrix penuh tetap tersedia sebagai run QA-Lab
manual yang di-shard alih-alih lane kritis rilis default.

### Paket

Kotak Package adalah gate produk yang dapat diinstal. Ini didukung oleh
`Package Acceptance` dan resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan
kandidat menjadi tarball `package-under-test` yang dikonsumsi oleh Docker E2E, memvalidasi
inventaris paket, mencatat versi paket dan SHA-256, serta menjaga ref harness
workflow terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw
  yang persis
- `source=ref`: kemas branch `package_ref`, tag, atau SHA commit penuh yang tepercaya
  dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS publik dengan `package_sha256` yang wajib;
  kredensial URL, port HTTPS non-default, hostname atau alamat terselesaikan
  privat/internal/penggunaan-khusus, dan pengalihan tidak aman ditolak
- `source=trusted-url`: unduh `.tgz` HTTPS dengan
  `package_sha256` dan `trusted_source_id` yang wajib dari kebijakan bernama di
  `.github/package-trusted-sources.json`; gunakan ini untuk mirror enterprise
  milik maintainer atau repositori paket privat alih-alih menambahkan bypass
  jaringan privat tingkat input ke `source=url`
- `source=artifact`: gunakan kembali `.tgz` yang diunggah oleh run GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`,
artefak paket rilis yang disiapkan, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mempertahankan QA paket migrasi, pembaruan,
restart pembaruan auth terkonfigurasi, instalasi skill ClawHub live, pembersihan dependensi Plugin usang, fixture Plugin offline, pembaruan Plugin, dan Telegram terhadap tarball
terselesaikan yang sama. Pemeriksaan rilis pemblokir menggunakan baseline paket
terpublikasi terbaru default; profil beta dengan `run_release_soak=true`, `release_profile=stable`, atau
`release_profile=full` diperluas ke setiap baseline stabil yang dipublikasikan npm dari
`2026.4.23` hingga `latest` plus fixture masalah yang dilaporkan. Gunakan
Package Acceptance dengan `source=npm` untuk kandidat yang sudah dikirim,
`source=ref` untuk tarball npm lokal berbasis SHA sebelum publikasi,
`source=trusted-url` untuk mirror enterprise/privat milik maintainer, atau
`source=artifact` untuk tarball yang disiapkan dan diunggah oleh run GitHub Actions lain.
Ini adalah pengganti native GitHub untuk sebagian besar cakupan paket/pembaruan yang
sebelumnya memerlukan Parallels. Pemeriksaan rilis lintas OS tetap penting untuk onboarding,
installer, dan perilaku platform spesifik OS, tetapi validasi produk paket/pembaruan sebaiknya
mengutamakan Package Acceptance.

Checklist kanonis untuk validasi pembaruan dan Plugin adalah
[Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins). Gunakan saat
memutuskan lane lokal, Docker, Package Acceptance, atau pemeriksaan rilis mana yang membuktikan
perubahan instalasi/pembaruan Plugin, pembersihan doctor, atau migrasi paket terpublikasi.
Migrasi pembaruan terpublikasi yang menyeluruh dari setiap paket stabil `2026.4.23+`
adalah workflow manual `Update Migration` yang terpisah, bukan bagian dari Full Release CI.

Kelonggaran package-acceptance lama sengaja dibatasi waktu. Paket hingga
`2026.4.25` dapat menggunakan jalur kompatibilitas untuk celah metadata yang sudah dipublikasikan
ke npm: entri inventaris QA privat yang hilang dari tarball, `gateway install --wrapper` yang hilang, file patch yang hilang di fixture git turunan tarball,
`update.channel` tersimpan yang hilang, lokasi install-record Plugin lama,
persistensi install-record marketplace yang hilang, dan migrasi metadata config
selama `plugins update`. Paket `2026.4.26` yang dipublikasikan dapat memberi peringatan
untuk file stamp metadata build lokal yang sudah dikirim. Paket berikutnya
harus memenuhi kontrak paket modern; celah yang sama menggagalkan validasi rilis.

Gunakan profil Package Acceptance yang lebih luas ketika pertanyaan rilis adalah tentang
paket yang benar-benar dapat diinstal:

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

- `smoke`: lane instalasi paket/channel/agent cepat, jaringan Gateway, dan reload
  config
- `package`: kontrak instalasi/pembaruan/restart/paket Plugin plus bukti instalasi
  skill ClawHub live; ini adalah default pemeriksaan rilis
- `product`: `package` plus channel MCP, pembersihan cron/subagent, pencarian web OpenAI,
  dan OpenWebUI
- `full`: potongan release-path Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk rerun terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau
`telegram_mode=live-frontier` pada Package Acceptance. Workflow meneruskan tarball
`package-under-test` yang terselesaikan ke lane Telegram; workflow Telegram mandiri
tetap menerima spec npm terpublikasi untuk pemeriksaan pascapublikasi.

## Otomasi publikasi rilis reguler

Untuk publikasi beta, `latest`, Plugin, GitHub Release, dan platform,
`OpenClaw Release Publish` adalah entrypoint mutasi normal. Jalur extended-stable bulanan
`.33+` khusus npm tidak menggunakan orkestrator ini. Workflow reguler
mengorkestrasi workflow trusted-publisher sesuai urutan yang dibutuhkan rilis:

1. Check out tag rilis dan selesaikan SHA commit-nya.
2. Verifikasi bahwa tag dapat dijangkau dari `main` atau `release/*`.
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan scope dan SHA yang sama.
6. Dispatch `OpenClaw NPM Release` dengan tag rilis, dist-tag npm, dan
   `preflight_run_id` tersimpan setelah memverifikasi
   `full_release_validation_run_id` tersimpan.
7. Untuk rilis stabil, buat atau perbarui GitHub release sebagai draft, dispatch
   `Windows Node Release` dengan `windows_node_tag` eksplisit dan
   `windows_node_installer_digests` yang disetujui kandidat, lalu verifikasi aset
   installer/checksum kanonis sebelum memublikasikan draft.

Contoh publikasi beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Publikasi stabil ke dist-tag beta default:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Promosi stabil langsung ke `latest` bersifat eksplisit:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Gunakan workflow tingkat lebih rendah `Plugin NPM Release` dan `Plugin ClawHub Release`
hanya untuk pekerjaan perbaikan atau publikasi ulang yang terfokus. `OpenClaw Release Publish` menolak
`plugin_publish_scope=selected` ketika `publish_openclaw_npm=true` sehingga paket core
tidak dapat dikirim tanpa setiap Plugin resmi yang dapat dipublikasikan, termasuk
`@openclaw/diffs-language-pack`. Untuk perbaikan Plugin terpilih, setel
`publish_openclaw_npm=false` dengan `plugin_publish_scope=selected` dan
`plugins=@openclaw/name`, atau dispatch workflow anak secara langsung.

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator ini:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga dapat berupa
  SHA commit branch workflow penuh 40 karakter saat ini untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk
  jalur publikasi sebenarnya
- `preflight_run_id`: wajib pada jalur publikasi sebenarnya agar workflow menggunakan kembali
  tarball yang disiapkan dari run preflight yang berhasil
- `full_release_validation_run_id`: wajib untuk publikasi monthly extended-stable dan reguler
  non-beta sebenarnya agar workflow mengautentikasi run validasi yang persis
- `npm_dist_tag`: tag target npm untuk jalur publikasi; menerima `alpha`, `beta`,
  `latest`, atau `extended-stable` dan default ke `beta`. Patch final `33` dan setelahnya harus
  menggunakan `extended-stable`; secara default, `extended-stable` menolak patch lebih awal, dan selalu
  menolak tag non-final.
- `bypass_extended_stable_guard`: boolean khusus pengujian, default `false`; dengan
  `npm_dist_tag=extended-stable`, melewati kelayakan monthly extended-stable sambil mempertahankan
  identitas rilis, artefak, persetujuan, dan pemeriksaan readback.

`OpenClaw Release Publish` menerima input yang dikendalikan operator ini:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id run preflight `OpenClaw NPM Release` yang berhasil;
  wajib ketika `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id run `Full Release Validation` yang berhasil;
  wajib ketika `publish_openclaw_npm=true`
- `windows_node_tag`: tag rilis `openclaw/openclaw-windows-node`
  non-prerelease yang persis; wajib untuk publikasi OpenClaw stabil
- `windows_node_installer_digests`: map JSON ringkas yang disetujui kandidat dari
  nama installer Windows saat ini ke digest `sha256:` yang dipatok; wajib
  untuk publikasi OpenClaw stabil
- `npm_dist_tag`: tag target npm untuk paket OpenClaw
- `plugin_publish_scope`: default ke `all-publishable`; gunakan `selected` hanya
  untuk pekerjaan perbaikan khusus Plugin yang terfokus dengan `publish_openclaw_npm=false`
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma ketika
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default ke `true`; setel `false` hanya ketika menggunakan workflow
  sebagai orkestrator perbaikan khusus Plugin
- `wait_for_clawhub`: default ke `false` sehingga ketersediaan npm tidak diblokir oleh
  sidecar ClawHub; setel `true` hanya ketika penyelesaian workflow harus mencakup
  penyelesaian ClawHub

`OpenClaw Release Checks` menerima input yang dikendalikan operator ini:

- `ref`: branch, tag, atau SHA commit penuh untuk divalidasi. Pemeriksaan yang membawa secret
  mengharuskan commit terselesaikan dapat dijangkau dari branch OpenClaw atau
  tag rilis.
- `run_release_soak`: ikut serta dalam live/E2E menyeluruh, release-path Docker, dan
  soak upgrade-survivor semua-sejak untuk pemeriksaan rilis beta. Ini dipaksa aktif oleh
  `release_profile=stable` dan `release_profile=full`.

Aturan:

- Versi final reguler dan koreksi di bawah patch `33` dapat dipublikasikan ke
  `beta` atau `latest`. Versi final pada patch `33` atau lebih tinggi harus dipublikasikan ke
  `extended-stable`, dan versi bersufiks koreksi pada batas itu ditolak.
- Tag prerelease beta hanya dapat dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit penuh hanya diizinkan ketika
  `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu
  khusus validasi
- Jalur publikasi sebenarnya harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama preflight;
  workflow memverifikasi metadata itu sebelum publikasi berlanjut

## Urutan rilis stabil beta/latest reguler

Urutan lama ini ditujukan untuk rilis terorkestrasi reguler yang juga memiliki
Plugin, GitHub Release, Windows, dan pekerjaan platform lain. Ini bukan jalur
monthly `.33+` npm-only extended-stable yang didokumentasikan di bagian atas halaman ini.

Saat memotong rilis stabil terorkestrasi reguler:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit branch workflow lengkap saat ini
     untuk dry run khusus validasi pada workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur normal beta-terlebih-dahulu, atau `latest` hanya
   ketika Anda sengaja menginginkan publikasi stabil langsung
3. Jalankan `Full Release Validation` pada branch rilis, tag rilis, atau SHA commit
   lengkap ketika Anda menginginkan CI normal plus cakupan live prompt cache,
   Docker, QA Lab, Matrix, dan Telegram dari satu workflow manual
4. Jika Anda sengaja hanya membutuhkan grafik pengujian normal yang deterministik, jalankan
   workflow manual `CI` pada ref rilis sebagai gantinya
5. Pilih tag rilis `openclaw/openclaw-windows-node` non-prarilis yang tepat
   yang installer x64 dan ARM64 bertanda tangannya harus dikirimkan. Simpan sebagai
   `windows_node_tag`, dan simpan peta digest tervalidasi mereka sebagai
   `windows_node_installer_digests`. Helper release-candidate mencatat keduanya
   dan menyertakannya dalam perintah publish yang dihasilkannya.
6. Simpan `preflight_run_id` dan `full_release_validation_run_id` yang berhasil
7. Jalankan `OpenClaw Release Publish` dengan `tag` yang sama, `npm_dist_tag` yang sama,
   `windows_node_tag` yang dipilih, `windows_node_installer_digests` yang tersimpan,
   `preflight_run_id` yang tersimpan, dan `full_release_validation_run_id` yang tersimpan;
   workflow ini memublikasikan Plugin yang dieksternalkan ke npm dan ClawHub sebelum mempromosikan
   paket npm OpenClaw
8. Jika rilis mendarat di `beta`, gunakan workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`
9. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stabil yang sama, gunakan workflow rilis yang sama
   untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi
   self-healing terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repositori ledger rilis karena masih memerlukan
`NPM_TOKEN`, sementara repositori sumber mempertahankan publish hanya dengan OIDC.

Itu membuat jalur publish langsung dan jalur promosi beta-terlebih-dahulu
sama-sama terdokumentasi dan terlihat oleh operator.

Jika maintainer harus kembali ke autentikasi npm lokal, jalankan perintah
CLI (`op`) 1Password apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op`
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
