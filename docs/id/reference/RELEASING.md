---
read_when:
    - Mencari definisi saluran rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan ritme rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan irama rilis
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-07-16T18:41:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88c7c61be963ed832b1716e811e09d5f270cb296bb08625e6fd53d5359e45b8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw saat ini menyediakan tiga saluran pembaruan yang dapat digunakan pengguna:

- stable: saluran rilis yang dipromosikan saat ini, yang masih diselesaikan melalui npm `latest` hingga pencapaian CLI/saluran terpisah tersedia
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: posisi terbaru yang terus bergerak dari `main`

Secara terpisah, operator rilis dapat memublikasikan paket inti bulan terakhir yang
telah selesai ke npm `extended-stable`, dimulai pada patch `33`. Jalur final reguler
bulan berjalan tetap dilanjutkan di npm `latest`; pemisahan publikasi di sisi operator ini
tidak dengan sendirinya mengubah resolusi saluran pembaruan CLI.

Build alfa Tideclaw merupakan jalur prarilis internal yang terpisah (dist-tag npm `alpha`), yang dibahas dalam [Input alur kerja NPM](#npm-workflow-inputs) dan [Kotak pengujian rilis](#release-test-boxes).

## Penamaan versi

- Versi rilis extended-stable npm bulanan: `YYYY.M.PATCH`, dengan `PATCH >= 33`, tag git `vYYYY.M.PATCH`
- Versi rilis final harian/reguler: `YYYY.M.PATCH`, dengan `PATCH < 33`, tag git `vYYYY.M.PATCH`
- Versi rilis koreksi fallback reguler: `YYYY.M.PATCH-N`, tag git `vYYYY.M.PATCH-N`
- Versi prarilis beta: `YYYY.M.PATCH-beta.N`, tag git `vYYYY.M.PATCH-beta.N`
- Versi prarilis alfa: `YYYY.M.PATCH-alpha.N`, tag git `vYYYY.M.PATCH-alpha.N`
- Jangan pernah menambahkan nol di depan bulan atau patch
- `PATCH` adalah nomor rangkaian rilis bulanan yang berurutan, bukan hari kalender. Rilis final reguler dan beta memajukan rangkaian saat ini; tag khusus alfa tidak pernah memakai atau memajukan nomor patch beta/reguler, jadi abaikan tag lama khusus alfa dengan nomor patch yang lebih tinggi saat memilih rangkaian beta atau reguler.
- Build alfa/nightly menggunakan rangkaian patch berikutnya yang belum dirilis dan hanya menambah `alpha.N` untuk build berulang. Setelah patch tersebut memiliki versi beta, build alfa baru berpindah ke patch berikutnya.
- Versi npm bersifat tetap: jangan pernah menghapus, memublikasikan ulang, atau menggunakan kembali tag yang telah dipublikasikan. Buat nomor prarilis berikutnya atau patch bulanan berikutnya sebagai gantinya.
- `latest` tetap mengikuti jalur npm reguler/harian saat ini; `beta` adalah target instalasi beta saat ini
- `extended-stable` berarti paket npm bulan terakhir yang didukung, dimulai pada patch `33`; patch `34` dan seterusnya adalah rilis pemeliharaan pada jalur bulanan tersebut
- Rilis final reguler dan koreksi reguler dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah diperiksa kemudian
- Jalur khusus extended-stable bulanan memublikasikan paket inti npm dan setiap plugin resmi yang dapat dipublikasikan ke npm pada versi yang sama persis. Jalur ini tidak memublikasikan plugin ke ClawHub ataupun memublikasikan artefak macOS atau Windows, GitHub Release, dist-tag repositori privat, image Docker, artefak seluler, atau unduhan situs web.
- Setiap rilis final reguler mengirimkan paket npm, aplikasi macOS, APK Android mandiri yang ditandatangani, dan penginstal Windows Hub yang ditandatangani secara bersamaan. Rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, sedangkan build/penandatanganan/notarisasi/promosi aplikasi native disediakan untuk rilis final reguler kecuali diminta secara eksplisit.

## Irama rilis

- Rilis bergerak dengan beta terlebih dahulu; stable hanya menyusul setelah beta terbaru divalidasi
- Pengelola biasanya membuat rilis dari cabang `release/YYYY.M.PATCH` yang dibuat dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak menghambat pengembangan baru di `main`
- Jika tag beta telah didorong atau dipublikasikan dan memerlukan perbaikan, pengelola membuat tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan hanya tersedia bagi pengelola

## Publikasi extended-stable bulanan khusus npm

Ini adalah pengecualian khusus dari prosedur rilis reguler di bawah. Untuk
bulan yang telah selesai `YYYY.M`, buat `extended-stable/YYYY.M.33`; publikasikan
`vYYYY.M.33` dan patch pemeliharaan selanjutnya dari cabang yang sama. Tag
rilis, ujung cabang, checkout, versi paket, prapemeriksaan npm, dan proses Full Release
Validation harus mengidentifikasi commit yang sama. `main` yang dilindungi harus
sudah berisi versi final dari bulan kalender yang benar-benar lebih baru di bawah patch
`33`; patch pemeliharaan tetap memenuhi syarat setelah `main` maju lebih dari satu
bulan.

Pada cabang extended-stable yang tepat, naikkan versi paket root menjadi `YYYY.M.P`, jalankan
`pnpm release:prep`, dan verifikasi bahwa setiap paket ekstensi yang dapat dipublikasikan memiliki
versi yang sama. Commit dan dorong semua perubahan yang dihasilkan, buat dan dorong
tag tetap `vYYYY.M.P` pada commit tersebut, lalu catat SHA lengkap yang dihasilkan.
Alur kerja menggunakan struktur yang telah disiapkan ini; alur kerja tidak menaikkan atau menyinkronkan
versi untuk Anda.

Jalankan prapemeriksaan npm dan Full Release Validation dari ujung cabang
yang telah disiapkan tersebut, lalu simpan kedua ID proses dan percobaan proses Full Release Validation
yang berhasil:

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

`release_profile=stable` adalah profil kedalaman validasi yang sudah ada; profil ini
terpisah dari dist-tag npm `extended-stable` dan sengaja
tidak diubah.

Setelah kedua proses berhasil, publikasikan setiap plugin resmi yang dapat dipublikasikan ke npm dari
ujung cabang yang sama persis. Patch `P` harus `33` atau lebih besar. Teruskan SHA rilis lengkap
sebagai `ref`, tunggu hingga seluruh matriks dan pembacaan balik registry selesai, lalu simpan
ID proses Plugin NPM Release yang berhasil:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Alur kerja menggunakan inventaris paket `all-publishable` reguler yang telah disiapkan,
termasuk paket yang sumbernya tidak berubah. Alur kerja memverifikasi setiap paket yang tepat
dan setiap tag plugin `extended-stable` sebelum berhasil. Jika sebagian proses
gagal, jalankan kembali perintah yang sama: paket yang telah dipublikasikan digunakan kembali, tag
plugin yang hilang atau usang direkonsiliasi dalam lingkungan rilis npm, dan
pembacaan balik akhir tetap mencakup seluruh kumpulan paket.

Setelah alur kerja plugin berhasil dan lingkungan rilis npm siap,
publikasikan tarball prapemeriksaan inti yang tepat. Publikasi inti memverifikasi bahwa
proses plugin yang dirujuk adalah `completed/success` pada cabang kanonis yang sama dan
SHA sumber yang tepat:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

Untuk fork atau latihan nonproduksi yang sengaja tidak dapat memenuhi
kebijakan bulan `.33` bulanan atau `main` yang dilindungi, tambahkan
`-f bypass_extended_stable_guard=true` ke dispatch prapemeriksaan dan publikasi
npm. Nilai default-nya adalah `false`. Bypass hanya diterima dengan
`npm_dist_tag=extended-stable` dan dicatat dalam ringkasan alur kerja. Bypass
tersebut tidak melewati ref alur kerja `extended-stable/YYYY.M.33` kanonis,
kesetaraan ujung cabang/tag/checkout, sintaks tag final, kesetaraan versi
paket/tag, identitas proses dan manifes yang dirujuk, asal-usul tarball,
persetujuan lingkungan, pembacaan balik registry, atau bukti perbaikan pemilih.

Alur kerja publikasi memverifikasi identitas prapemeriksaan, validasi, dan proses plugin
yang dirujuk, digest tarball yang telah disiapkan, serta pemilih registry inti.
Konfirmasikan hasilnya secara terpisah setelah alur kerja berhasil:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Kedua perintah harus mengembalikan `YYYY.M.P`. Jika publikasi berhasil tetapi pembacaan balik
pemilih gagal, jangan memublikasikan ulang versi paket yang bersifat tetap. Gunakan
satu perintah perbaikan `npm dist-tag add openclaw@YYYY.M.P extended-stable`
yang dicetak dalam ringkasan alur kerja yang selalu dijalankan dari alur kerja yang gagal, lalu ulangi kedua
pembacaan balik terpisah. Rollback ke pemilih sebelumnya merupakan keputusan operator
yang terpisah, bukan jalur perbaikan pembacaan balik.

Dokumentasi dukungan publik pada awalnya menetapkan Slack, Discord, dan Codex sebagai
permukaan plugin extended-stable yang tercakup. Daftar tersebut merupakan pernyataan dukungan, bukan
daftar izin kode rilis: setiap plugin resmi yang dapat dipublikasikan ke npm mengikuti
jalur publikasi versi yang sama persis.

Daftar periksa reguler di bawah tetap menangani beta, `latest`, GitHub Release,
plugin, macOS, Windows, dan publikasi platform lainnya. Jangan jalankan
langkah-langkah tersebut untuk jalur extended-stable khusus npm ini.

## Daftar periksa operator rilis reguler

Daftar periksa ini merupakan bentuk publik dari alur rilis. Kredensial privat, penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada dalam panduan rilis khusus pengelola.

1. Mulai dari `main` saat ini: tarik versi terbaru, konfirmasikan bahwa commit target telah didorong, dan konfirmasikan bahwa CI `main` cukup hijau untuk dijadikan dasar cabang.
2. Buat `release/YYYY.M.PATCH` dari commit tersebut. Backport bersifat opsional; terapkan hanya kumpulan yang dipilih operator. Naikkan setiap lokasi versi yang diwajibkan, jalankan `pnpm release:prep`, selesaikan perbaikan rilis dan forward-port yang diwajibkan, lalu tinjau `src/plugins/compat/registry.ts` serta `src/commands/doctor/shared/deprecation-compat.ts`.
3. Bekukan commit lengkap-produk sebelum changelog sebagai **SHA Kode**. Jalankan prapemeriksaan sumber deterministik, lalu gunakan `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Ini menyematkan perangkat alur kerja tepercaya sementara seluruh matriks Vitest, Docker, QA, paket, dan performa menargetkan SHA Kode yang tepat.
4. Klasifikasikan kegagalan sebelum mengedit. Kegagalan produk/kode menghasilkan SHA Kode baru dan memerlukan validasi penuh yang hijau untuk SHA tersebut. Kegagalan alur kerja, harness, kredensial, persetujuan, atau infrastruktur diperbaiki pada permukaan pemiliknya dan dijalankan kembali terhadap SHA Kode yang sama.
5. Hanya setelah SHA Kode berstatus hijau, hasilkan bagian teratas `CHANGELOG.md` dari PR yang digabungkan dan commit langsung sejak tag terkirim terakhir yang dapat dijangkau. Pertahankan entri yang ditujukan bagi pengguna dan hapus duplikasi. Ketika tag terkirim yang menyimpang atau forward-port berikutnya mengaitkan kembali PR yang telah dirilis, teruskan tag tersebut secara eksplisit sebagai `--shipped-ref`.
6. Commit hanya `CHANGELOG.md`. Commit ini adalah **SHA Rilis**. Diff lengkap dari SHA Kode ke SHA Rilis harus tepat `CHANGELOG.md`; perubahan pada path lain mengembalikan rilis ke langkah 2.
7. Jalankan Full Release Validation yang disematkan ke SHA untuk SHA Rilis dengan penggunaan kembali bukti diaktifkan. Induk ringan harus mencatat `changelog-only-release-v1`, menunjuk ke SHA Kode yang hijau, dan tidak melakukan dispatch jalur turunan produk. Ini menggunakan kembali bukti produk; bukan byte paket.
8. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true` terhadap SHA/tag Rilis. Simpan `preflight_run_id` yang berhasil. Ini membangun dan memeriksa byte paket yang tepat dan menyertakan changelog final.
9. Beri tag pada SHA Rilis, lalu jalankan helper kandidat dengan induk validasi SHA Rilis dan prapemeriksaan npm yang berhasil alih-alih melakukan dispatch ulang pada keduanya:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Untuk stabil, teruskan juga `--windows-node-tag vX.Y.Z`. Helper memverifikasi asal-usul catatan rilis, byte prapemeriksaan npm, bukti instalasi/pembaruan Parallels, bukti paket Telegram, dan rencana publikasi plugin, lalu mencetak perintah publikasi.

   `OpenClaw Release Publish` mengirimkan paket plugin yang dipilih atau semua yang dapat dipublikasikan ke npm dan set yang sama ke ClawHub secara paralel, lalu mempromosikan artefak prapemeriksaan npm OpenClaw yang telah disiapkan dengan dist-tag yang cocok setelah publikasi npm plugin berhasil. Checkout rilis tetap menjadi root produk/data, sedangkan perencanaan dan verifikasi akhir dijalankan dari checkout sumber alur kerja tepercaya yang tepat agar commit rilis lama tidak dapat secara diam-diam menggunakan alat rilis yang usang. Sebelum proses turunan publikasi dimulai, alur kerja merender dan menyimpan cache isi rilis GitHub yang tepat. Ketika seluruh bagian `CHANGELOG.md` yang cocok muat dalam batas 125,000 karakter GitHub dan batas aman 125,000 byte milik perender, halaman berisi bagian `## YYYY.M.PATCH` yang tepat tersebut, termasuk judulnya. Ketika bagian sumber tidak muat, halaman mempertahankan catatan editorial berkelompok yang tepat dan mengganti catatan kontribusi yang terlalu besar dengan tautan stabil ke catatan lengkap dalam `CHANGELOG.md` yang disematkan ke tag; catatan parsial dan butir yang terpotong tidak pernah dipublikasikan. Alur kerja memilih isi lengkap atau ringkas tersebut sebelum menambahkan `### Release verification`; jika bagian akhir bukti akan melampaui batas, alur kerja mempertahankan isi kanonis dan mengandalkan bukti terlampir yang tidak dapat diubah. Rilis stabil yang dipublikasikan ke npm `latest` menjadi rilis terbaru GitHub, sedangkan rilis pemeliharaan stabil yang dipertahankan di npm `beta` dibuat dengan `latest=false` GitHub. Alur kerja juga mengunggah bukti dependensi prapemeriksaan, manifes validasi penuh, dan bukti verifikasi registri pascapublikasi ke rilis GitHub untuk respons insiden pascarilis. Alur kerja segera mencetak ID proses turunan, menyetujui secara otomatis gerbang lingkungan rilis yang boleh disetujui oleh token alur kerja, merangkum tugas turunan yang gagal beserta bagian akhir log, membuat halaman draf rilis GitHub di awal dan mempromosikan aset Windows serta Android secara bersamaan dengan publikasi npm OpenClaw, menyelesaikan halaman rilis dan bukti dependensi setelah tahap-tahap tersebut berhasil, menunggu ClawHub setiap kali npm OpenClaw sedang dipublikasikan, lalu menjalankan pemverifikasi beta main tepercaya dan mengunggah bukti pascapublikasi untuk rilis GitHub, paket npm, paket npm plugin yang dipilih, paket ClawHub yang dipilih, ID proses alur kerja turunan, dan ID proses Telegram NPM opsional. Pemverifikasi bootstrap ClawHub memerlukan jalur dan SHA alur kerja main tepercaya yang tepat, percobaan proses produsen dan terminal, SHA rilis, set paket yang diminta, tuple artefak paket yang tidak dapat diubah, serta artefak pembacaan balik registri terminal; proses ref rilis lama yang berhasil tidak diterima.

   Kemudian jalankan penerimaan paket pascapublikasi terhadap paket `openclaw@YYYY.M.PATCH-beta.N` atau `openclaw@beta` yang telah dipublikasikan. Jika prarilis yang telah didorong atau dipublikasikan memerlukan perbaikan, buat nomor prarilis berikutnya yang cocok; jangan pernah menghapus atau menulis ulang yang lama.

10. Jika upaya publikasi gagal, pertahankan SHA Rilis tanpa perubahan kecuali kegagalan membuktikan adanya cacat produk atau changelog. Lanjutkan proses turunan dan artefak permanen yang berhasil; jangan pernah membangun ulang atau memublikasikan ulang versi paket yang sudah berhasil.
11. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang telah diperiksa memiliki bukti validasi yang diwajibkan. Publikasi npm stabil juga melalui `OpenClaw Release Publish`, dengan menggunakan kembali artefak prapemeriksaan yang berhasil melalui `preflight_run_id`. Kesiapan rilis macOS stabil juga memerlukan `.zip`, `.dmg`, dan `.dSYM.zip` yang telah dikemas, serta `appcast.xml` yang telah diperbarui pada `main`; alur kerja publikasi macOS memublikasikan appcast yang telah ditandatangani secara otomatis ke `main` publik setelah aset rilis terverifikasi, atau membuka/memperbarui PR appcast jika perlindungan cabang memblokir push langsung. Kesiapan Windows Hub stabil memerlukan aset `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe`, dan `OpenClawCompanion-SHA256SUMS.txt` yang telah ditandatangani pada rilis GitHub OpenClaw. Teruskan tag rilis `openclaw/openclaw-windows-node` bertanda tangan yang tepat sebagai `windows_node_tag` dan peta digest penginstalnya yang disetujui kandidat sebagai `windows_node_installer_digests`; `OpenClaw Release Publish` mempertahankan draf rilis, mengirimkan `Windows Node Release`, dan memverifikasi ketiga aset sebelum publikasi.
12. Setelah publikasi, jalankan pemverifikasi pascapublikasi npm, E2E Telegram npm-terpublikasi mandiri opsional ketika memerlukan bukti kanal pascapublikasi, promosi dist-tag bila diperlukan, verifikasi halaman rilis GitHub yang dihasilkan, jalankan langkah pengumuman rilis, lalu selesaikan [penutupan main stabil](#stable-main-closeout) sebelum menyatakan rilis stabil selesai.

## Penutupan main stabil

Publikasi stabil belum selesai hingga `main` memuat status rilis aktual yang dikirimkan.

1. Mulai dari `main` terbaru yang baru. Audit `release/YYYY.M.PATCH` terhadapnya dan porting maju perbaikan nyata yang tidak terdapat dalam `main`. Jangan menggabungkan secara membabi buta adaptor kompatibilitas, pengujian, atau validasi khusus rilis ke `main` yang lebih baru.
2. Untuk jalur normal, atur `main` ke versi stabil yang dikirimkan. Penutupan yang terlambat dapat menggunakan `main` setelah nilainya meningkat ke CalVer OpenClaw stabil yang lebih baru; jangan menurunkan versi rangkaian rilis yang sudah dimulai hanya untuk menutup rilis sebelumnya. Validator tetap memerlukan bagian changelog dan entri appcast yang tepat dari rilis yang dikirimkan serta mencatat versi dan SHA `main` aktual. Jalankan `pnpm release:prep` setelah perubahan versi root apa pun, lalu `pnpm deps:shrinkwrap:generate`.
3. Buat bagian `## YYYY.M.PATCH` milik `CHANGELOG.md` pada `main` sama persis dengan cabang rilis yang diberi tag. Sertakan pembaruan `appcast.xml` stabil ketika rilis Mac memublikasikannya.
4. Jangan menambahkan `YYYY.M.PATCH+1`, versi beta, atau bagian changelog mendatang yang kosong ke `main` hingga operator secara eksplisit memulai rangkaian rilis tersebut.
5. Jalankan `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, dan `OPENCLAW_TESTBOX=1 pnpm check:changed`. Lakukan push, lalu verifikasi bahwa `origin/main` berisi versi dan changelog yang dikirimkan sebelum menyatakan rilis stabil selesai.
6. Pastikan variabel repositori `RELEASE_ROLLBACK_DRILL_ID` dan `RELEASE_ROLLBACK_DRILL_DATE` tetap mutakhir setelah setiap simulasi rollback privat.

`OpenClaw Stable Main Closeout` dimulai dari push `main` yang memuat versi, changelog, dan appcast yang dikirimkan setelah publikasi stabil. Alur kerja membaca bukti pascapublikasi yang tidak dapat diubah untuk mengikat tag yang dikirimkan ke proses Validasi Rilis Penuh dan Publikasinya, lalu memverifikasi status main stabil, rilis, periode observasi stabil wajib, dan bukti performa yang memblokir. Alur kerja melampirkan manifes penutupan permanen dan checksum ke rilis GitHub. Pemicu push otomatis melewati rilis lama yang mendahului bukti pascapublikasi permanen dan tidak pernah menganggap pelewatan tersebut sebagai penutupan yang selesai.

Penutupan lengkap memerlukan aset dan checksum yang cocok. Manifes parsial memutar ulang SHA `main` dan simulasi rollback yang tercatat untuk menghasilkan ulang byte yang identik, lalu melampirkan checksum yang hilang; pasangan yang tidak valid, atau checksum tanpa manifes, tetap memblokir. Proses yang dipicu push tanpa variabel repositori simulasi rollback dilewati tanpa menyelesaikan penutupan; catatan simulasi yang hilang atau berusia lebih dari 90 hari tetap memblokir penutupan manual berbasis bukti. Perintah pemulihan privat tetap berada dalam runbook khusus pengelola. Gunakan pengiriman manual hanya untuk memperbaiki atau memutar ulang penutupan stabil berbasis bukti.

Jika induk Publikasi Rilis gagal hanya setelah bukti npm/plugin yang tidak dapat diubah dilampirkan, perbaiki dan publikasikan terlebih dahulu setiap aset platform stabil. Kemudian pengelola dapat mengirimkan penutupan secara manual dengan `allow_failed_publish_recovery=true`; mode tersebut hanya menerima induk gagal yang telah selesai dan juga memerlukan kontrak aset Android dan Windows yang tepat, digest SHA-256 GitHub, verifikasi checksum, asal-usul Android, serta promosi Windows berhasil yang dikirimkan induk, dengan pemeriksaan Authenticode dan digest yang disetujui kandidat cocok dengan penginstal yang dipublikasikan, beserta pemeriksaan macOS/appcast normal. Penutupan push otomatis tidak pernah mengaktifkan mode pemulihan ini.

Tag koreksi fallback lama hanya boleh menggunakan kembali bukti paket dasar ketika tag koreksi mengarah ke commit sumber yang sama dengan tag stabil dasar. Rilis Android-nya menggunakan kembali APK tag dasar yang telah diverifikasi dan menambahkan asal-usul untuk tag koreksi. Koreksi dengan sumber berbeda harus memublikasikan dan memverifikasi bukti paketnya sendiri serta menggunakan `versionCode` Android yang lebih tinggi.

## Prapemeriksaan rilis

- Jalankan `pnpm check:test-types` sebelum prapemeriksaan rilis agar TypeScript pengujian tetap tercakup di luar gerbang lokal `pnpm check` yang lebih cepat.
- Jalankan `pnpm check:architecture` sebelum prapemeriksaan rilis agar pemeriksaan siklus impor dan batas arsitektur yang lebih luas berhasil di luar gerbang lokal yang lebih cepat.
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis `dist/*` yang diharapkan dan bundel UI Kontrol tersedia untuk langkah validasi paket.
- Jalankan `pnpm release:prep` setelah peningkatan versi root dan sebelum pemberian tag. Perintah ini menjalankan setiap generator rilis deterministik yang biasanya menyimpang setelah perubahan versi/konfigurasi/API: versi plugin, shrinkwrap npm, inventaris plugin, skema konfigurasi dasar, metadata konfigurasi kanal yang dibundel, baseline dokumentasi konfigurasi, ekspor SDK plugin, dan baseline API SDK plugin. `pnpm release:check` menjalankan ulang pengaman tersebut dalam mode pemeriksaan (ditambah pemeriksaan anggaran permukaan SDK plugin) dan melaporkan setiap kegagalan penyimpangan yang dihasilkan dalam satu proses sebelum menjalankan pemeriksaan rilis paket.
- Sinkronisasi versi plugin memperbarui paket runtime `@openclaw/ai` yang dapat dipublikasikan, versi paket plugin resmi, dan batas bawah `openclaw.compat.pluginApi` yang ada ke versi rilis OpenClaw secara default. Perlakukan bidang tersebut sebagai batas bawah API runtime/SDK plugin, bukan sekadar salinan versi paket: untuk rilis khusus plugin yang sengaja tetap kompatibel dengan host OpenClaw lama, pertahankan batas bawah pada API host terlama yang didukung dan dokumentasikan pilihan tersebut dalam bukti rilis plugin.
- Jalankan alur kerja manual `Full Release Validation` sebelum persetujuan rilis untuk memulai semua kotak pengujian prarilis dari satu titik masuk. Alur kerja ini menerima cabang, tag, atau SHA commit lengkap, mengirimkan `CI` secara manual, dan mengirimkan `OpenClaw Release Checks` untuk jalur pengujian singkat instalasi, penerimaan paket, pemeriksaan paket lintas OS, paritas QA Lab, Matrix, dan Telegram. Proses stabil dan penuh selalu mencakup live/E2E menyeluruh dan periode observasi jalur rilis Docker; `run_release_soak=true` dipertahankan untuk periode observasi beta eksplisit. Penerimaan Paket menyediakan E2E Telegram paket kanonis selama validasi kandidat, sehingga menghindari pemantau live kedua yang berjalan bersamaan.

  Berikan `release_package_spec` setelah memublikasikan beta untuk menggunakan kembali paket npm yang dikirimkan di seluruh pemeriksaan rilis, Penerimaan Paket, dan E2E Telegram paket tanpa membangun ulang tarball rilis. Berikan `npm_telegram_package_spec` hanya ketika Telegram harus menggunakan paket terpublikasi yang berbeda dari validasi rilis lainnya. Berikan `package_acceptance_package_spec` ketika Penerimaan Paket harus menggunakan paket terpublikasi yang berbeda dari spesifikasi paket rilis. Berikan `evidence_package_spec` ketika laporan bukti rilis harus membuktikan bahwa validasi cocok dengan paket npm terpublikasi tanpa memaksakan E2E Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Jalankan alur kerja manual `Package Acceptance` ketika Anda menginginkan bukti melalui kanal samping untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk `openclaw@beta`, `openclaw@latest`, atau versi rilis yang persis; `source=ref` untuk mengemas cabang/tag/SHA `package_ref` tepercaya dengan harness `workflow_ref` saat ini; `source=url` untuk tarball HTTPS publik dengan SHA-256 wajib dan kebijakan URL publik yang ketat; `source=trusted-url` untuk kebijakan sumber tepercaya bernama yang menggunakan `trusted_source_id` dan SHA-256 wajib; atau `source=artifact` untuk tarball yang diunggah oleh proses GitHub Actions lain.

  Alur kerja tersebut menetapkan kandidat menjadi `package-under-test`, menggunakan kembali penjadwal rilis E2E Docker terhadap tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika lane Docker yang dipilih mencakup `published-upgrade-survivor`, artefak paket menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline yang telah dipublikasikan. `update-restart-auth` menggunakan paket kandidat sebagai CLI yang terpasang sekaligus paket yang diuji sehingga jalur mulai ulang terkelola milik perintah pembaruan kandidat turut diuji.

  Contoh:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Profil umum:
  - `smoke`: lane pemasangan/kanal/agen, jaringan Gateway, dan pemuatan ulang konfigurasi
  - `package`: lane paket/pembaruan/mulai ulang/Plugin berbasis artefak tanpa OpenWebUI atau ClawHub langsung
  - `product`: profil paket ditambah kanal MCP, pembersihan cron/subagen, pencarian web OpenAI, dan OpenWebUI
  - `full`: bagian jalur rilis Docker dengan OpenWebUI
  - `custom`: pemilihan `docker_lanes` yang persis untuk menjalankan ulang secara terfokus

- Jalankan alur kerja manual `CI` secara langsung ketika Anda hanya memerlukan cakupan CI normal yang deterministik untuk kandidat rilis. Pemanggilan CI manual melewati pembatasan cakupan berdasarkan perubahan dan memaksa shard Linux Node, shard Plugin bawaan, shard kontrak Plugin dan kanal, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, dan lane i18n Control UI. Proses CI manual mandiri hanya menjalankan Android ketika dipanggil dengan `include_android=true`; `Full Release Validation` meneruskan input tersebut kepada proses CI turunannya.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Jalankan `pnpm qa:otel:smoke` saat memvalidasi telemetri rilis. Proses ini menjalankan QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi ekspor jejak, metrik, dan log serta atribut jejak yang dibatasi dan penyuntingan konten/pengidentifikasi tanpa memerlukan Opik, Langfuse, atau pengumpul eksternal lain.
- Jalankan `pnpm qa:otel:collector-smoke` saat memvalidasi kompatibilitas pengumpul. Proses ini mengarahkan ekspor OTLP QA-lab yang sama melalui kontainer Docker OpenTelemetry Collector nyata sebelum pemeriksaan penerima lokal.
- Jalankan `pnpm qa:prometheus:smoke` saat memvalidasi scraping Prometheus yang dilindungi. Proses ini menjalankan QA-lab, menolak scraping tanpa autentikasi, dan memverifikasi bahwa kelompok metrik penting untuk rilis tetap bebas dari konten prompt, pengidentifikasi mentah, token autentikasi, dan jalur lokal.
- Jalankan `pnpm qa:observability:smoke` untuk menjalankan lane smoke OpenTelemetry dan Prometheus pada checkout sumber secara berurutan.
- Jalankan `pnpm release:check` sebelum setiap rilis yang diberi tag.
- Prapemeriksaan `OpenClaw NPM Release` menghasilkan bukti rilis dependensi sebelum mengemas tarball npm. Gerbang kerentanan advisori npm memblokir rilis. Laporan risiko manifes transitif, permukaan kepemilikan/pemasangan dependensi, dan perubahan dependensi hanya merupakan bukti rilis. Laporan perubahan dependensi membandingkan kandidat rilis dengan tag rilis sebelumnya yang dapat dijangkau. Prapemeriksaan mengunggah bukti dependensi sebagai `openclaw-release-dependency-evidence-<tag>` dan juga menyematkannya di bawah `dependency-evidence/` dalam artefak prapemeriksaan npm yang telah disiapkan. Jalur publikasi sebenarnya menggunakan kembali artefak prapemeriksaan tersebut, lalu melampirkan bukti yang sama ke rilis GitHub sebagai `openclaw-<version>-dependency-evidence.zip`.
- Jalankan `OpenClaw Release Publish` untuk urutan publikasi yang melakukan perubahan setelah tag tersedia. Panggil publikasi beta dan stabil reguler dari `main` tepercaya; tag rilis tetap memilih commit target yang persis dan dapat mengarah ke `release/YYYY.M.PATCH`. Publikasi alfa Tideclaw tetap berada di cabang alfa yang sesuai. Teruskan `preflight_run_id` npm OpenClaw yang berhasil, `full_release_validation_run_id` yang berhasil, dan `full_release_validation_run_attempt` yang persis, serta pertahankan cakupan publikasi Plugin default `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Alur kerja menjalankan publikasi npm Plugin, publikasi ClawHub Plugin, dan publikasi npm OpenClaw secara berurutan agar paket inti tidak dipublikasikan sebelum Plugin yang telah dieksternalisasi; promosi Windows dan Android berjalan bersamaan dengan publikasi npm inti terhadap halaman rilis draf. Pengulangan publikasi dapat dilanjutkan: versi npm inti yang telah dipublikasikan akan melewati pemanggilan inti setelah alur kerja membuktikan bahwa tarball registri cocok dengan artefak prapemeriksaan tag, sedangkan promosi Windows/Android dilewati ketika rilis telah memiliki kontrak artefak yang terverifikasi, sehingga percobaan ulang hanya mengulangi tahap yang gagal. Perbaikan terfokus khusus Plugin memerlukan `plugin_publish_scope=selected` dan daftar Plugin yang tidak kosong. Proses `all-publishable` khusus Plugin memerlukan bukti prapemeriksaan dan Validasi Rilis Penuh yang lengkap serta tidak dapat diubah; bukti parsial ditolak.
- `OpenClaw Release Publish` stabil memerlukan `windows_node_tag` yang persis setelah rilis `openclaw/openclaw-windows-node` nonprarilis yang sesuai tersedia, beserta peta `windows_node_installer_digests` yang disetujui untuk kandidat. Sebelum memanggil proses publikasi turunan apa pun, alur ini memverifikasi bahwa rilis sumber telah dipublikasikan, bukan prarilis, berisi penginstal x64/ARM64 yang diperlukan, dan masih cocok dengan peta yang disetujui tersebut. Alur ini kemudian memanggil `Windows Node Release` saat rilis OpenClaw masih berupa draf, dengan membawa peta digest penginstal yang telah disematkan tanpa perubahan. Alur kerja turunan mengunduh penginstal Windows Hub yang telah ditandatangani dari tag yang persis tersebut, mencocokkannya dengan digest yang disematkan, memverifikasi bahwa tanda tangan Authenticode-nya menggunakan penanda tangan OpenClaw Foundation yang diharapkan pada runner Windows, menulis manifes SHA-256, dan mengunggah penginstal beserta manifes ke rilis GitHub OpenClaw kanonis, lalu mengunduh kembali aset yang dipromosikan dan memverifikasi keanggotaan manifes serta hash-nya. Alur induk memverifikasi kontrak aset x64, ARM64, dan checksum saat ini sebelum publikasi. Pemulihan langsung menolak nama aset `OpenClawCompanion-*` yang tidak diharapkan sebelum mengganti aset kontrak yang diharapkan dengan byte sumber yang disematkan.

  Panggil `Windows Node Release` secara manual hanya untuk pemulihan, dan selalu teruskan tag yang persis, jangan pernah `latest`, beserta peta JSON `expected_installer_digests` eksplisit dari rilis sumber yang disetujui. Tautan unduhan situs web harus mengarah ke URL aset rilis OpenClaw yang persis untuk rilis stabil saat ini, atau ke `releases/latest/download/...` hanya setelah memverifikasi bahwa pengalihan terbaru GitHub mengarah ke rilis yang sama; jangan hanya menautkan ke halaman rilis repositori pendamping.

- Pemeriksaan rilis kini berjalan dalam alur kerja manual terpisah: `OpenClaw Release Checks`. Alur ini juga menjalankan jalur paritas mock QA Lab serta profil rilis Matrix dan jalur QA Telegram sebelum persetujuan rilis. Jalur live menggunakan lingkungan `qa-live-shared`; Telegram juga menggunakan penyewaan kredensial Convex CI. Jalankan alur kerja manual `QA-Lab - All Lanes` dengan `matrix_profile=all` saat Anda menginginkan setiap skenario Matrix yang dipelihara; alur kerja menyebarkan pilihan tersebut ke seluruh profil transportasi, media, dan E2EE agar pembuktian lengkap tetap berada dalam batas waktu tunggu per tugas.
- Validasi runtime instalasi dan peningkatan lintas OS merupakan bagian dari `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil alur kerja yang dapat digunakan kembali `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung. Pemisahan ini disengaja: menjaga jalur rilis npm yang sebenarnya tetap singkat, deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di jalurnya sendiri agar tidak menunda atau memblokir publikasi.
- Pemeriksaan rilis yang memuat rahasia harus dikirim melalui `Full Release Validation` atau dari referensi alur kerja `main`/release agar logika alur kerja dan rahasia tetap terkendali.
- `OpenClaw Release Checks` menerima cabang, tag, atau SHA commit lengkap selama commit yang diselesaikan dapat dijangkau dari cabang atau tag rilis OpenClaw.
- Pra-pemeriksaan khusus validasi `OpenClaw NPM Release` juga menerima SHA commit lengkap 40 karakter dari cabang alur kerja saat ini tanpa memerlukan tag yang telah didorong. Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi sebenarnya. Dalam mode SHA, alur kerja menyintesis `v<package.json version>` hanya untuk pemeriksaan metadata paket; publikasi sebenarnya tetap memerlukan tag rilis yang sebenarnya.
- Kedua alur kerja mempertahankan jalur publikasi dan promosi sebenarnya pada runner yang dihosting GitHub, sedangkan jalur validasi yang tidak mengubah apa pun dapat menggunakan runner Linux Blacksmith yang lebih besar.
- Alur kerja tersebut menjalankan `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` menggunakan kedua rahasia alur kerja `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`.
- Pra-pemeriksaan rilis npm tidak lagi menunggu jalur pemeriksaan rilis yang terpisah.
- Sebelum menandai kandidat rilis secara lokal, jalankan `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Pembantu tersebut menjalankan pagar pengaman rilis cepat, pemeriksaan rilis npm/ClawHub Plugin, build, build UI, dan `release:openclaw:npm:check` dalam urutan yang mendeteksi kesalahan umum yang memblokir persetujuan sebelum alur kerja publikasi GitHub dimulai.
- Jalankan `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (atau tag prarilis/koreksi yang sesuai) sebelum persetujuan.
- Setelah publikasi npm, jalankan `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi registri yang dipublikasikan dalam prefiks sementara baru.
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan E2E Telegram nyata terhadap paket npm yang dipublikasikan menggunakan kumpulan kredensial Telegram sewaan bersama. Untuk proses satu kali lokal, pengelola dapat menghilangkan variabel Convex dan meneruskan ketiga kredensial lingkungan `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pascapublikasi lengkap dari mesin pengelola, gunakan `pnpm release:beta-smoke -- --beta betaN`. Pembantu tersebut menjalankan validasi pembaruan npm/target baru Parallels, mengirim `NPM Telegram Beta E2E`, melakukan polling terhadap proses alur kerja yang tepat, mengunduh artefak, dan mencetak laporan Telegram.
- Pengelola dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui alur kerja manual `NPM Telegram Beta E2E`. Alur ini sengaja hanya bersifat manual dan tidak berjalan pada setiap penggabungan.
- Automasi rilis pengelola menggunakan pra-pemeriksaan-lalu-promosi:
  - Publikasi npm sebenarnya harus melewati npm `preflight_run_id` yang berhasil.
  - Orkestrasi dan pra-pemeriksaan publikasi beta reguler dan stabil menggunakan `main` tepercaya terhadap tag target yang tepat. Publikasi dan pra-pemeriksaan alfa Tideclaw menggunakan cabang alfa yang sesuai.
  - Rilis npm stabil secara default menggunakan `beta`; publikasi npm stabil dapat menargetkan `latest` secara eksplisit melalui input alur kerja.
  - Mutasi dist-tag npm berbasis token berada di `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` karena `npm dist-tag add` masih memerlukan `NPM_TOKEN`, sementara repositori sumber mempertahankan publikasi khusus OIDC.
  - `macOS Release` publik hanya untuk validasi; ketika tag hanya berada di cabang rilis tetapi alur kerja dikirim dari `main`, tetapkan `public_release_branch=release/YYYY.M.PATCH`.
  - Publikasi macOS sebenarnya harus melewati macOS `preflight_run_id` dan `validate_run_id` yang berhasil.
  - Jalur publikasi sebenarnya mempromosikan artefak yang telah disiapkan alih-alih membangunnya kembali.
- Untuk rilis koreksi stabil seperti `YYYY.M.PATCH-N`, pemverifikasi pascapublikasi juga memeriksa jalur peningkatan prefiks sementara yang sama dari `YYYY.M.PATCH` ke `YYYY.M.PATCH-N` agar koreksi rilis tidak dapat secara diam-diam membiarkan instalasi global lama tetap menggunakan muatan stabil dasar.
- Pra-pemeriksaan rilis npm gagal secara tertutup kecuali tarball menyertakan `dist/control-ui/index.html` dan muatan `dist/control-ui/assets/` yang tidak kosong, sehingga dasbor peramban kosong tidak dikirim lagi.
- Verifikasi pascapublikasi juga memeriksa bahwa titik masuk Plugin dan metadata paket yang dipublikasikan tersedia dalam tata letak registri yang terinstal. Rilis yang dikirim tanpa muatan runtime Plugin akan menggagalkan pemverifikasi pascapublikasi dan tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga memberlakukan anggaran `unpackedSize` npm pack pada tarball pembaruan kandidat, sehingga e2e penginstal mendeteksi pembengkakan pack yang tidak disengaja sebelum jalur publikasi rilis.
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes waktu ekstensi, atau matriks pengujian ekstensi, buat ulang dan tinjau keluaran matriks `plugin-prerelease-extension-shard` milik perencana dari `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak menjelaskan tata letak CI yang kedaluwarsa.
- Kesiapan rilis macOS stabil juga mencakup permukaan pembaru: rilis GitHub pada akhirnya harus memiliki `.zip`, `.dmg`, dan `.dSYM.zip` yang telah dipaketkan; `appcast.xml` pada `main` harus menunjuk ke zip stabil baru setelah publikasi (alur kerja publikasi macOS melakukan commit secara otomatis, atau membuka PR appcast ketika push langsung diblokir); aplikasi yang dipaketkan harus mempertahankan id bundle non-debug, URL umpan Sparkle yang tidak kosong, dan `CFBundleVersion` yang sama dengan atau lebih tinggi daripada batas minimum build Sparkle kanonis untuk versi rilis tersebut.

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai matriks produk lengkap dari satu titik masuk. Gunakan pembantu agar setiap alur kerja anak berjalan dari cabang sementara yang ditetapkan pada satu SHA alur kerja `main` tepercaya, sementara commit yang diminta tetap menjadi kandidat yang diuji:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

Pembantu mengambil `origin/main` saat ini, mendorong `release-ci/<workflow-sha>-...` pada commit alur kerja tepercaya tersebut, menyimpulkan `beta` dari versi paket alfa/beta dan `stable` untuk versi lainnya, mengirim `Full Release Validation` dari cabang sementara dengan `ref=<target-sha>`, memverifikasi bahwa setiap `headSha` alur kerja anak cocok dengan SHA alur kerja induk yang disematkan, lalu menghapus cabang sementara. Teruskan `-f reuse_evidence=false` untuk memaksa proses baru, `-f release_profile=full` untuk penyisiran advisori luas, atau `--workflow-sha <trusted-main-sha>` untuk menyematkan commit lama yang masih dapat dijangkau dari `origin/main` saat ini. Alur kerja itu sendiri tidak pernah menulis referensi repositori. Hal ini menjaga ketersediaan alat rilis khusus main tanpa menambahkan commit alat ke kandidat dan menghindari pembuktian proses anak `main` yang lebih baru secara tidak sengaja.

Setelah SHA Kode berstatus hijau, lakukan commit hanya pada `CHANGELOG.md` dan jalankan pembantu yang sama dengan SHA Rilis:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

Induk kedua menggunakan kembali bukti produk hanya ketika GitHub membuktikan bahwa SHA Rilis merupakan turunan dari SHA Kode dan kumpulan jalur yang berubah secara lengkap tepat sama dengan `CHANGELOG.md`. Alur tersebut mencatat `changelog-only-release-v1` dan tidak mengirim anak produk. Pra-pemeriksaan npm serta penerimaan paket/instalasi tetap berjalan pada SHA Rilis karena byte tarball-nya berubah.

Untuk SHA Kode baru, alur kerja menyelesaikan target, mengirim `CI` manual, lalu mengirim `OpenClaw Release Checks`. `OpenClaw Release Checks` menyebarkan smoke instalasi, pemeriksaan rilis lintas OS, cakupan jalur rilis Docker live/E2E ketika soak diaktifkan, Penerimaan Paket dengan E2E paket Telegram kanonis, paritas QA Lab, Matrix live, dan Telegram live. Proses full/all hanya dapat diterima ketika ringkasan `Full Release Validation` menunjukkan `normal_ci`, `plugin_prerelease`, dan `release_checks` berhasil, kecuali proses ulang terfokus dengan sengaja melewati anak `Plugin Prerelease` yang terpisah. Gunakan anak mandiri `npm-telegram` hanya untuk proses ulang paket yang dipublikasikan secara terfokus dengan `release_package_spec` atau `npm_telegram_package_spec`. Ringkasan pemverifikasi akhir menyertakan tabel tugas paling lambat untuk setiap proses anak, sehingga pengelola rilis dapat melihat jalur kritis saat ini tanpa mengunduh log.

Anak performa produk hanya menggunakan artefak dalam jalur rilis ini. Alur
payung mengirimnya dengan `publish_reports=false`, dan validasi ditolak
kecuali pagar khusus artefaknya membuktikan bahwa penerbit laporan Clawgrit tetap
dilewati.

Lihat [Validasi rilis lengkap](/id/reference/full-release-validation) untuk matriks tahap lengkap, nama tugas alur kerja yang tepat, perbedaan profil stabil dan lengkap, artefak, serta pegangan proses ulang terfokus.

Alur kerja anak dikirim dari referensi tepercaya yang disematkan ke SHA dan menjalankan `Full Release Validation`. Setiap proses anak harus menggunakan SHA alur kerja induk yang tepat. Jangan gunakan pengiriman `--ref main -f ref=<sha>` mentah untuk pembuktian rilis; gunakan `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Gunakan `release_profile` untuk memilih cakupan live/penyedia:

- `beta`: jalur OpenAI/inti live dan Docker kritis-rilis yang tercepat
- `stable`: cakupan penyedia/backend beta serta stabil untuk persetujuan rilis
- `full`: cakupan penyedia/media advisori yang stabil serta luas

Validasi stabil dan lengkap selalu menjalankan penyisiran lengkap live/E2E, jalur rilis Docker, dan penyintas peningkatan terpublikasi yang dibatasi sebelum promosi. Gunakan `run_release_soak=true` untuk meminta penyisiran yang sama bagi beta. Penyisiran tersebut mencakup empat paket stabil terbaru ditambah dasar acuan `2026.4.23` dan `2026.5.2` yang disematkan serta cakupan `2026.4.15` yang lebih lama, dengan dasar acuan duplikat dihapus dan setiap dasar acuan dibagi ke tugas runner Docker tersendiri.

`OpenClaw Release Checks` menggunakan referensi alur kerja tepercaya untuk menyelesaikan referensi target satu kali sebagai `release-package-under-test` dan menggunakan kembali artefak tersebut dalam pemeriksaan lintas OS, Penerimaan Paket, dan Docker jalur rilis ketika soak berjalan. Hal ini menjaga semua kotak yang berhadapan dengan paket menggunakan byte yang sama dan menghindari build paket berulang. Setelah beta tersedia di npm, tetapkan `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` agar pemeriksaan rilis mengunduh paket yang telah dikirim satu kali, mengekstrak SHA sumber build-nya dari `dist/build-info.json`, dan menggunakan kembali artefak tersebut untuk jalur lintas OS, Penerimaan Paket, Docker jalur rilis, dan paket Telegram.

Smoke instalasi OpenAI lintas OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika variabel repositori/organisasi ditetapkan, atau `openai/gpt-5.6-luna` jika tidak, karena jalur ini membuktikan instalasi paket, onboarding, startup Gateway, dan satu giliran agen live, bukan melakukan tolok ukur terhadap model yang paling mumpuni. Matriks penyedia live yang lebih luas tetap menjadi tempat untuk cakupan khusus model.

Gunakan varian berikut sesuai tahap rilis:

```bash
# Validasi Code SHA dengan produk lengkap.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Validasi Release SHA khusus changelog dengan menggunakan kembali bukti produk Code SHA.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Setelah menerbitkan beta, tambahkan E2E Telegram untuk paket yang telah diterbitkan.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Jangan gunakan payung lengkap sebagai pengulangan pertama setelah perbaikan terfokus. Jika satu kotak gagal, gunakan alur kerja turunan, tugas, jalur Docker, profil paket, penyedia model, atau jalur QA yang gagal untuk pembuktian berikutnya. Jalankan kembali payung lengkap hanya jika perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua kotak sebelumnya kedaluwarsa. Pemverifikasi akhir payung memeriksa ulang ID proses alur kerja turunan yang tercatat, sehingga setelah alur kerja turunan berhasil dijalankan ulang, jalankan ulang hanya tugas induk `Verify full validation` yang gagal.

`rerun_group=all` dapat menggunakan kembali proses payung hijau sebelumnya jika profil rilis,
pengaturan soak efektif, dan input validasi cocok serta SHA target sama
atau target baru merupakan turunannya dengan kumpulan lengkap jalur yang berubah
tepat `CHANGELOG.md`. Penggunaan kembali target yang sama mencatat
`exact-target-full-validation-v1`; Release SHA pascavalidasi mencatat
`changelog-only-release-v1`. Yang terakhir hanya menggunakan kembali validasi produk. Pra-pemeriksaan
npm, byte paket, asal-usul catatan rilis, serta penerimaan instalasi/pembaruan
tetap harus dijalankan terhadap Release SHA. Setiap perubahan target milik versi, sumber, hasil pembuatan,
dependensi, paket, atau alur kerja memerlukan Code SHA baru
dan validasi lengkap yang baru. Proses payung yang lebih baru untuk ref `release/*` dan
grup pengulangan yang sama secara otomatis menggantikan proses yang sedang berlangsung. Berikan
`reuse_evidence=false` untuk memaksa proses lengkap baru.

Untuk pemulihan terbatas, berikan `rerun_group` ke payung. `all` adalah proses kandidat rilis yang sebenarnya, `ci` hanya menjalankan turunan CI normal, `plugin-prerelease` hanya menjalankan turunan plugin khusus rilis, `release-checks` menjalankan setiap kotak rilis, dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`. Pengulangan `npm-telegram` terfokus memerlukan `release_package_spec` atau `npm_telegram_package_spec`; proses lengkap/semua menggunakan E2E Telegram paket kanonis di dalam Penerimaan Paket. Pengulangan lintas OS terfokus dapat menambahkan `cross_os_suite_filter=windows/packaged-upgrade` atau filter OS/rangkaian lain. Kegagalan pemeriksaan rilis QA memblokir validasi rilis normal, termasuk penyimpangan alat dinamis OpenClaw yang diwajibkan pada tingkat standar. Proses alfa Tideclaw masih dapat memperlakukan jalur pemeriksaan rilis yang tidak terkait keamanan paket sebagai advisori. Dengan `release_profile=beta`, rangkaian penyedia langsung `Run repo/live E2E validation` bersifat advisori (peringatan, bukan pemblokir); profil stabil dan lengkap tetap menjadikannya pemblokir. Ketika `live_suite_filter` secara eksplisit meminta jalur langsung QA bergate seperti Discord, WhatsApp, atau Slack, variabel repo `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` yang sesuai harus diaktifkan; jika tidak, pengambilan input akan gagal, bukan melewati jalur tersebut secara diam-diam.

### Vitest

Kotak Vitest adalah alur kerja turunan `CI` manual. CI manual sengaja melewati pembatasan cakupan berdasarkan perubahan dan memaksa graf pengujian normal untuk kandidat rilis: shard Linux Node, shard plugin terbundel, shard kontrak plugin dan saluran, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, dan i18n Control UI. Android disertakan ketika `Full Release Validation` menjalankan kotak karena payung memberikan `include_android=true`; CI manual mandiri memerlukan `include_android=true` untuk cakupan Android.

Gunakan kotak ini untuk menjawab "apakah pohon sumber lulus rangkaian pengujian normal lengkap?" Ini tidak sama dengan validasi produk jalur rilis. Bukti yang harus disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL proses `CI` yang dikirim
- proses `CI` hijau pada SHA target yang sama persis
- nama shard yang gagal atau lambat dari tugas CI saat menyelidiki regresi
- artefak pewaktuan Vitest seperti `.artifacts/vitest-shard-timings.json` ketika suatu proses memerlukan analisis kinerja

Jalankan CI manual secara langsung hanya ketika rilis memerlukan CI normal yang deterministik, tetapi tidak memerlukan kotak Docker, QA Lab, langsung, lintas OS, atau paket. Gunakan perintah pertama untuk CI langsung non-Android. Tambahkan `include_android=true` ketika CI kandidat rilis langsung harus mencakup Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Kotak Docker berada di `OpenClaw Release Checks` hingga `openclaw-live-and-e2e-checks-reusable.yml`, ditambah alur kerja mode rilis `install-smoke`. Kotak ini memvalidasi kandidat rilis melalui lingkungan Docker yang dipaketkan, bukan hanya pengujian tingkat sumber.

Cakupan Docker rilis mencakup:

- smoke instalasi lengkap dengan smoke instalasi global Bun yang lambat diaktifkan
- persiapan/penggunaan kembali image smoke Dockerfile root berdasarkan SHA target, dengan tugas smoke QR, root/gateway, dan penginstal/Bun berjalan sebagai shard smoke instalasi terpisah
- jalur E2E repositori
- potongan Docker jalur rilis: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hingga `plugins-runtime-install-h`, dan `openwebui`
- cakupan OpenWebUI pada runner khusus dengan disk besar saat diminta
- jalur instalasi/penghapusan instalasi plugin terbundel yang dipisah, `bundled-plugin-install-uninstall-0` hingga `bundled-plugin-install-uninstall-23`
- rangkaian penyedia langsung/E2E dan cakupan model langsung Docker ketika pemeriksaan rilis mencakup rangkaian langsung

Gunakan artefak Docker sebelum menjalankan ulang. Penjadwal jalur rilis mengunggah `.artifacts/docker-tests/` dengan log jalur, `summary.json`, `failures.json`, pewaktuan fase, JSON rencana penjadwal, dan perintah pengulangan. Untuk pemulihan terfokus, gunakan `docker_lanes=<lane[,lane]>` pada alur kerja langsung/E2E yang dapat digunakan kembali, alih-alih menjalankan ulang semua potongan rilis. Perintah pengulangan yang dihasilkan menyertakan `package_artifact_run_id` sebelumnya dan input image Docker yang telah disiapkan jika tersedia, sehingga jalur yang gagal dapat menggunakan kembali tarball dan image GHCR yang sama.

### QA Lab

Kotak QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Kotak ini adalah gate rilis perilaku agen dan tingkat saluran, yang terpisah dari mekanisme paket Vitest dan Docker.

Cakupan QA Lab rilis mencakup:

- jalur paritas tiruan yang membandingkan jalur kandidat OpenAI dengan baseline `anthropic/claude-opus-4-8` menggunakan paket paritas agen
- profil rilis adaptor langsung Matrix menggunakan lingkungan `qa-live-shared`
- jalur QA Telegram langsung menggunakan sewa kredensial Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke`, atau `pnpm qa:observability:smoke` ketika telemetri rilis memerlukan bukti lokal eksplisit

Gunakan kotak ini untuk menjawab "apakah rilis berperilaku dengan benar dalam skenario QA dan alur saluran langsung?" Simpan URL artefak untuk jalur paritas, Matrix, dan Telegram saat menyetujui rilis. Cakupan Matrix lengkap tetap tersedia sebagai proses QA Lab manual bershard, bukan sebagai jalur kritis rilis default.

### Paket

Kotak Paket adalah gate produk yang dapat diinstal. Kotak ini didukung oleh `Package Acceptance` dan resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan kandidat menjadi tarball `package-under-test` yang digunakan oleh E2E Docker, memvalidasi inventaris paket, mencatat versi paket dan SHA-256, serta menjaga ref harness alur kerja tetap terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang sama persis
- `source=ref`: kemas cabang, tag, atau SHA commit lengkap `package_ref` tepercaya dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS publik dengan `package_sha256` yang diwajibkan; kredensial URL, port HTTPS non-default, nama host atau alamat hasil resolusi privat/internal/penggunaan khusus, dan pengalihan yang tidak aman akan ditolak
- `source=trusted-url`: unduh `.tgz` HTTPS dengan `package_sha256` dan `trusted_source_id` yang diwajibkan dari kebijakan bernama dalam `.github/package-trusted-sources.json`; gunakan ini untuk mirror perusahaan milik pengelola atau repositori paket privat, bukan menambahkan bypass jaringan privat tingkat input ke `source=url`
- `source=artifact`: gunakan kembali `.tgz` yang diunggah oleh proses GitHub Actions lain

`OpenClaw Release Checks` menjalankan Penerimaan Paket dengan `source=artifact`, artefak paket rilis yang telah disiapkan, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Penerimaan Paket mempertahankan migrasi, pembaruan, peningkatan VPS yang dikelola root, pemulaian ulang pembaruan dengan autentikasi terkonfigurasi, instalasi skill ClawHub langsung, pembersihan dependensi plugin usang, fixture plugin luring, pembaruan plugin, penguatan pelolosan pengikatan perintah plugin, dan QA paket Telegram terhadap tarball hasil resolusi yang sama. Pemeriksaan rilis yang memblokir menggunakan baseline paket terbaru yang diterbitkan secara default; profil beta dengan `run_release_soak=true`, `release_profile=stable`, atau `release_profile=full` memperluas penyapuan penyintas peningkatan versi yang diterbitkan ke `last-stable-4` ditambah baseline `2026.4.23`, `2026.5.2`, dan `2026.4.15` yang disematkan dengan skenario `reported-issues`. Gunakan Penerimaan Paket dengan `source=npm` untuk kandidat yang sudah dirilis, `source=ref` untuk tarball npm lokal berbasis SHA sebelum penerbitan, `source=trusted-url` untuk mirror perusahaan/privat milik pengelola, atau `source=artifact` untuk tarball yang telah disiapkan dan diunggah oleh proses GitHub Actions lain.

Kotak ini merupakan pengganti asli GitHub untuk sebagian besar cakupan paket/pembaruan yang sebelumnya memerlukan Parallels. Pemeriksaan rilis lintas OS tetap penting untuk orientasi, penginstal, dan perilaku platform khusus OS, tetapi validasi produk paket/pembaruan sebaiknya mengutamakan Penerimaan Paket.

Daftar periksa kanonis untuk validasi pembaruan dan plugin adalah [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins). Gunakan daftar tersebut saat menentukan jalur lokal, Docker, Penerimaan Paket, atau pemeriksaan rilis mana yang membuktikan perubahan instalasi/pembaruan plugin, pembersihan oleh doctor, atau migrasi paket yang diterbitkan. Migrasi pembaruan menyeluruh dari setiap paket stabil `2026.4.23+` merupakan alur kerja `Update Migration` manual terpisah, bukan bagian dari CI Rilis Lengkap.

Kelonggaran penerimaan paket lama sengaja dibatasi waktu. Paket hingga `2026.4.25` dapat menggunakan jalur kompatibilitas untuk kesenjangan metadata yang sudah diterbitkan ke npm: entri inventaris QA privat yang tidak ada dalam tarball, `gateway install --wrapper` yang tidak ada, berkas patch yang tidak ada dalam fixture git turunan tarball, `update.channel` tersimpan yang tidak ada, lokasi catatan instalasi plugin lama, persistensi catatan instalasi marketplace yang tidak ada, dan migrasi metadata konfigurasi selama `plugins update`. Paket `2026.4.26` yang diterbitkan dapat memperingatkan tentang berkas stempel metadata build lokal yang sudah dirilis. Paket yang lebih baru harus memenuhi kontrak paket modern; kesenjangan yang sama akan menggagalkan validasi rilis.

Gunakan profil Penerimaan Paket yang lebih luas ketika pertanyaan rilis berkaitan dengan paket aktual yang dapat diinstal:

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

- `smoke`: jalur instalasi paket/channel/agen cepat, jaringan Gateway, dan pemuatan ulang konfigurasi
- `package`: kontrak instalasi/pembaruan/mulai ulang/paket Plugin serta bukti langsung instalasi skill ClawHub; ini adalah default pemeriksaan rilis
- `product`: `package` ditambah channel MCP, pembersihan cron/subagen, pencarian web OpenAI, dan OpenWebUI
- `full`: bagian jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` yang persis untuk pengulangan eksekusi terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier` pada Package Acceptance. Alur kerja meneruskan tarball `package-under-test` yang telah diresolusikan ke jalur Telegram; alur kerja Telegram mandiri tetap menerima spesifikasi npm yang telah dipublikasikan untuk pemeriksaan pascapublikasi.

## Otomatisasi publikasi rilis reguler

Untuk publikasi beta, `latest`, Plugin, GitHub Release, dan platform,
`OpenClaw Release Publish` adalah titik masuk normal yang melakukan mutasi. Jalur extended-stable
khusus npm bulanan `.33+` tidak menggunakan orkestrator ini. Alur kerja
reguler mengorkestrasi alur kerja penerbit tepercaya sesuai urutan yang
dibutuhkan rilis:

1. Checkout tag rilis dan resolusikan SHA commit-nya.
2. Verifikasi bahwa tag dapat dijangkau dari `main` atau `release/*` (atau cabang alfa Tideclaw untuk prarilis alfa).
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan cakupan dan SHA yang sama.
6. Dispatch `OpenClaw NPM Release` dengan tag rilis, dist-tag npm, dan `preflight_run_id` yang disimpan setelah memverifikasi `full_release_validation_run_id` yang disimpan dan percobaan eksekusi yang persis.
7. Untuk rilis stabil, buat atau perbarui rilis GitHub sebagai draf, dispatch `Windows Node Release` dengan `windows_node_tag` eksplisit dan `windows_node_installer_digests` yang disetujui kandidat, lalu verifikasi aset installer/checksum Windows kanonis. Dispatch juga `Android Release` untuk membangun APK bertanda tangan dari tag persis beserta checksum dan provenans. Verifikasi kedua kontrak aset native sebelum memublikasikan draf.

Contoh publikasi beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Publikasi stabil ke dist-tag beta default:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Promosi stabil langsung ke `latest` bersifat eksplisit:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

Gunakan alur kerja tingkat rendah `Plugin NPM Release` dan `Plugin ClawHub Release` hanya untuk pekerjaan perbaikan atau publikasi ulang terfokus. `OpenClaw Release Publish` menolak `plugin_publish_scope=selected` ketika `publish_openclaw_npm=true` agar paket inti tidak dapat dirilis tanpa setiap Plugin resmi yang dapat dipublikasikan, termasuk `@openclaw/diffs-language-pack`. Untuk perbaikan Plugin terpilih, tetapkan `publish_openclaw_npm=false` dengan `plugin_publish_scope=selected` dan `plugins=@openclaw/name`, atau dispatch alur kerja anak secara langsung.

Bootstrap ClawHub untuk publikasi pertama merupakan pengecualian: dispatch `Plugin ClawHub New`
dari `main` tepercaya dan teruskan SHA rilis target lengkap melalui `ref`.
Jangan pernah menjalankan alur kerja bootstrap itu sendiri dari tag atau cabang rilis:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Validasi pra-tag memerlukan `dry_run=true`, menolak input tag rilis dan eksekusi induk,
serta hanya menerima target persis yang dapat dijangkau dari `main` atau `release/*`.
Validasi ini tidak memuat kredensial ClawHub, memublikasikan byte paket, atau mengubah
konfigurasi penerbit tepercaya. Alur kerja tetap meresolusikan rencana registri langsung,
melakukan checkout dan mengemas target hanya dalam job tanpa rahasia, mewujudkan
toolchain ClawHub yang dikunci, serta memvalidasi artefak tetap dan
slug/identitas paket sebelum tag rilis tersedia. Setujui environment
`clawhub-plugin-bootstrap` hanya setelah job pengemasan tanpa rahasia
selesai; job validasi terlindungi ini tidak memiliki kredensial atau perintah mutasi.

Dry run yang disetujui atau bootstrap nyata setelah pemberian tag harus menyertakan tag
rilis yang persis beserta id eksekusi, percobaan, dan cabang `OpenClaw Release Publish`
induk. Induk mengatestasi SHA alur kerjanya sendiri dan SHA `main`
tepercaya terpisah yang persis untuk `Plugin ClawHub New`; eksekusi anak dan setiap persetujuan
environment terlindungi harus cocok dengan SHA anak yang disetujui tersebut. Tag rilis
diperiksa ulang sebelum setiap upaya publikasi dan mutasi penerbit tepercaya.

Job pengemasan
mengunggah satu artefak tetap yang nama, ID/digest artefak Actions,
eksekusi/percobaan produsen, SHA target, serta SHA-256/ukuran tarball per paketnya
diteruskan ke job validasi dan job terlindungi. Job terlindungi hanya melakukan checkout tooling
`main` tepercaya, memvalidasi tuple artefak melalui API GitHub, mengunduh
berdasarkan ID artefak yang persis, menghitung ulang hash setiap tarball, serta memvalidasi jalur TAR lokal dan
identitas paket dengan aturan kanonisasi USTAR milik CLI yang disematkan. Setiap
kandidat kemudian melewati dry run publikasi CLI yang disematkan, yang kembali sebelum
pencarian registri atau autentikasi. Prapenyaring job kredensial membatasi ClawPack terkompresi
hingga 120 MiB, total payload file hingga 50 MiB, data TAR yang diekspansi hingga 64 MiB, dan
jumlah entri TAR hingga 10,000. Perbaikan penerbit tepercaya untuk paket yang sudah ada tetap
hanya-konfigurasi, tetapi masih mengemas target dan memerlukan tag yang diminta
serta kesetaraan persis byte dan metadata registri sebelum mengubah konfigurasi
penerbit tepercaya. Verifikasi pascapublikasi mengunduh artefak ClawHub dan
memerlukan SHA-256 serta ukuran yang sama. Pemulihan pengulangan job yang gagal dapat menggunakan kembali
artefak paket dari percobaan sebelumnya hanya jika job produsen yang persis telah selesai
dengan sukses. Bukti akhir juga mengikat versi ClawHub yang dikunci, SHA-256
kunci, dan integritas npm. Ketidakcocokan memerlukan versi paket baru.

## Input alur kerja NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1`, atau `v2026.4.2-alpha.1`; ketika `preflight_only=true`, nilainya juga dapat berupa SHA commit cabang alur kerja saat ini yang lengkap sepanjang 40 karakter untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk jalur publikasi nyata
- `preflight_run_id`: id eksekusi preflight sukses yang sudah ada, diwajibkan pada jalur publikasi nyata agar alur kerja menggunakan kembali tarball yang telah disiapkan alih-alih membangunnya ulang
- `full_release_validation_run_id`: id eksekusi `Full Release Validation` yang sukses untuk tag/SHA ini, diwajibkan untuk publikasi nyata. Publikasi beta dapat dilanjutkan hanya dengan preflight disertai peringatan, tetapi promosi stabil/`latest` tetap memerlukannya.
- `full_release_validation_run_attempt`: percobaan eksekusi positif yang persis dan dipasangkan dengan `full_release_validation_run_id`; diwajibkan setiap kali id eksekusi diberikan agar pengulangan eksekusi tidak dapat mengubah bukti otorisasi selama publikasi.
- `release_publish_run_id`: id eksekusi `OpenClaw Release Publish` yang disetujui; diwajibkan ketika alur kerja ini di-dispatch oleh induk tersebut (pemanggilan publikasi nyata oleh aktor bot)
- `plugin_npm_run_id`: id eksekusi `Plugin NPM Release` exact-head yang sukses; diwajibkan untuk publikasi inti `extended-stable` yang nyata
- `npm_dist_tag`: tag target npm untuk jalur publikasi; menerima `alpha`, `beta`, `latest`, atau `extended-stable` dan default ke `beta`. Patch final `33` dan yang lebih baru harus menggunakan `extended-stable`; secara default, `extended-stable` menolak patch sebelumnya, dan selalu menolak tag nonfinal.
- `bypass_extended_stable_guard`: boolean khusus pengujian, default `false`; dengan `npm_dist_tag=extended-stable`, melewati kelayakan extended-stable bulanan sambil mempertahankan pemeriksaan identitas rilis, artefak, persetujuan, dan pembacaan balik.

`Plugin NPM Release` menerima `npm_dist_tag=default` untuk perilaku rilis
yang sudah ada atau `npm_dist_tag=extended-stable` untuk jalur bulanan yang dijaga. Opsi
extended-stable memerlukan `publish_scope=all-publishable`, input
`plugins` kosong, patch final pada atau di atas `33`, dan cabang
`extended-stable/YYYY.M.33` kanonis pada ujung persisnya. Opsi ini tidak pernah memindahkan
`latest` atau `beta` Plugin. Versi paket baru menerima `extended-stable` secara atomik
melalui publikasi tepercaya OIDC (`npm publish --tag extended-stable`); alur kerja
sumber ini tidak menggunakan `npm dist-tag add` yang diautentikasi dengan token. Percobaan ulang
melewati versi persis yang sudah ada di npm, lalu gagal secara tertutup kecuali
pembacaan balik lengkap mengonfirmasi bahwa setiap paket persis dan tag `extended-stable`
telah konvergen.

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id eksekusi preflight `OpenClaw NPM Release` yang sukses; diwajibkan ketika `publish_openclaw_npm=true` atau `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: id eksekusi `Full Release Validation` yang sukses; diwajibkan ketika `publish_openclaw_npm=true` atau `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: percobaan positif yang persis dan dipasangkan dengan `full_release_validation_run_id`; diwajibkan setiap kali id eksekusi diberikan
- `windows_node_tag`: tag rilis `openclaw/openclaw-windows-node` nonprarilis yang persis; diwajibkan untuk publikasi stabil OpenClaw
- `windows_node_installer_digests`: peta JSON ringkas yang disetujui kandidat dari nama installer Windows saat ini ke digest `sha256:` yang disematkan; diwajibkan untuk publikasi stabil OpenClaw
- `npm_telegram_run_id`: id eksekusi `NPM Telegram Beta E2E` sukses opsional untuk disertakan dalam bukti rilis akhir
- `npm_dist_tag`: tag target npm untuk paket OpenClaw, salah satu dari `alpha`, `beta`, atau `latest`
- `plugin_publish_scope`: default ke `all-publishable`; gunakan `selected` hanya untuk pekerjaan perbaikan khusus Plugin yang terfokus dengan `publish_openclaw_npm=false`
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma ketika `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default ke `true`; tetapkan `false` hanya ketika menggunakan alur kerja sebagai orkestrator perbaikan khusus Plugin
- `release_profile`: profil cakupan rilis yang digunakan untuk ringkasan bukti rilis; default ke `from-validation`, yang membacanya dari manifes validasi, atau timpa dengan `beta`, `stable`, atau `full`
- `wait_for_clawhub`: default ke `false` agar ketersediaan npm tidak diblokir oleh sidecar ClawHub; tetapkan `true` hanya ketika penyelesaian alur kerja harus mencakup penyelesaian ClawHub

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: branch, tag, atau SHA commit lengkap yang akan divalidasi. Pemeriksaan yang melibatkan secret mengharuskan commit yang telah di-resolve dapat dijangkau dari branch atau tag rilis OpenClaw.
- `run_release_soak`: aktifkan pemeriksaan live/E2E menyeluruh, jalur rilis Docker, dan pengujian ketahanan upgrade all-since untuk pemeriksaan rilis beta. Opsi ini diaktifkan secara paksa oleh `release_profile=stable` dan `release_profile=full`.

Aturan:

- Versi final reguler dan versi koreksi di bawah patch `33` dapat dipublikasikan ke `beta` atau `latest`. Versi final pada patch `33` atau lebih tinggi harus dipublikasikan ke `extended-stable`, dan versi dengan sufiks koreksi pada batas tersebut akan ditolak.
- Tag prarilis beta hanya dapat dipublikasikan ke `beta`; tag prarilis alfa hanya dapat dipublikasikan ke `alpha`
- Untuk `OpenClaw NPM Release`, input SHA commit lengkap hanya diizinkan ketika `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya untuk validasi
- Jalur publikasi sebenarnya harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama prapemeriksaan; alur kerja memverifikasi metadata tersebut sebelum publikasi dilanjutkan

## Urutan rilis stabil beta/latest reguler

Urutan lama ini ditujukan untuk rilis reguler yang diorkestrasi dan juga menangani plugin, GitHub Release, Windows, serta pekerjaan platform lainnya. Ini bukan jalur extended-stable bulanan `.33+` khusus npm yang didokumentasikan di bagian atas halaman ini.

Saat membuat rilis stabil reguler yang diorkestrasi:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag tersedia, Anda dapat menggunakan SHA commit lengkap saat ini dari branch alur kerja untuk dry run khusus validasi pada alur kerja prapemeriksaan.
2. Pilih `npm_dist_tag=beta` untuk alur normal yang mendahulukan beta, atau `latest` hanya jika Anda sengaja ingin melakukan publikasi stabil secara langsung.
3. Jalankan `Full Release Validation` pada branch rilis, tag rilis, atau SHA commit lengkap jika Anda menginginkan CI normal beserta cakupan cache prompt live, Docker, QA Lab, Matrix, dan Telegram dari satu alur kerja manual. Jika Anda sengaja hanya memerlukan grafik pengujian normal yang deterministik, jalankan alur kerja manual `CI` pada ref rilis sebagai gantinya.
4. Pilih tag rilis `openclaw/openclaw-windows-node` non-prarilis yang tepat untuk installer x64 dan ARM64 bertanda tangan yang akan dikirimkan. Simpan sebagai `windows_node_tag`, dan simpan peta digest yang telah divalidasi sebagai `windows_node_installer_digests`. Pembantu kandidat rilis mencatat keduanya dan menyertakannya dalam perintah publikasi yang dihasilkannya.
5. Simpan `preflight_run_id`, `full_release_validation_run_id`, dan `full_release_validation_run_attempt` yang tepat dari proses yang berhasil.
6. Jalankan `OpenClaw Release Publish` dari `main` tepercaya dengan `tag` yang sama, `npm_dist_tag` yang sama, `windows_node_tag` yang dipilih, `windows_node_installer_digests` yang tersimpan, `preflight_run_id` yang tersimpan, `full_release_validation_run_id`, dan `full_release_validation_run_attempt`. Proses ini memublikasikan plugin yang dieksternalisasi ke npm dan ClawHub sebelum mempromosikan paket npm OpenClaw.
7. Jika rilis masuk ke `beta`, gunakan alur kerja `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`.
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta` harus segera mengikuti build stabil yang sama, gunakan alur kerja rilis yang sama untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi pemulihan mandiri terjadwalnya memindahkan `beta` nanti.

Mutasi dist-tag berada di repo ledger rilis karena masih memerlukan `NPM_TOKEN`, sedangkan repo sumber tetap menggunakan publikasi khusus OIDC. Dengan demikian, jalur publikasi langsung dan jalur promosi yang mendahulukan beta tetap terdokumentasi dan terlihat oleh operator.

Jika maintainer harus kembali menggunakan autentikasi npm lokal, jalankan semua perintah CLI 1Password (`op`) hanya di dalam sesi tmux khusus. Jangan panggil `op` secara langsung dari shell agen utama; menjalankannya di dalam tmux membuat prompt, peringatan, dan penanganan OTP dapat diamati serta mencegah peringatan host berulang.

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

Maintainer menggunakan dokumentasi rilis privat di [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) sebagai panduan operasional yang sebenarnya.

## Terkait

- [Saluran rilis](/id/install/development-channels)
