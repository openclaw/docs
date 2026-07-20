---
read_when:
    - Mencari definisi kanal rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan jadwal rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan irama rilis
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-07-20T03:54:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7807f44029f8f5fd0d40499c0b1f2e731cd99780cf1f081bf62230a2146c49e4
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw saat ini menyediakan tiga saluran pembaruan yang terlihat oleh pengguna:

- stable: saluran rilis yang dipromosikan saat ini, yang masih diresolusikan melalui npm `latest` hingga pencapaian CLI/saluran terpisah tersedia
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: ujung bergerak dari `main`

Secara terpisah, operator rilis dapat memublikasikan paket inti bulan terakhir yang
telah selesai ke npm `extended-stable`, dimulai pada patch `33`. Jalur final reguler
bulan berjalan tetap berlanjut di npm `latest`; pemisahan publikasi pada sisi operator ini
tidak dengan sendirinya mengubah resolusi saluran pembaruan CLI.

Build alfa Tideclaw merupakan jalur prarilis internal terpisah (dist-tag npm `alpha`), yang dibahas dalam [Input alur kerja NPM](#npm-workflow-inputs) dan [Kotak pengujian rilis](#release-test-boxes).

## Penamaan versi

- Versi rilis extended-stable npm bulanan: `YYYY.M.PATCH`, dengan `PATCH >= 33`, tag git `vYYYY.M.PATCH`
- Versi rilis final harian/reguler: `YYYY.M.PATCH`, dengan `PATCH < 33`, tag git `vYYYY.M.PATCH`
- Versi rilis koreksi fallback reguler: `YYYY.M.PATCH-N`, tag git `vYYYY.M.PATCH-N`
- Versi prarilis beta: `YYYY.M.PATCH-beta.N`, tag git `vYYYY.M.PATCH-beta.N`
- Versi prarilis alfa: `YYYY.M.PATCH-alpha.N`, tag git `vYYYY.M.PATCH-alpha.N`
- Jangan pernah menambahkan nol di depan bulan atau patch
- `PATCH` adalah nomor rangkaian rilis bulanan yang berurutan, bukan tanggal kalender. Rilis final reguler dan beta memajukan rangkaian saat ini; tag khusus alfa tidak pernah menggunakan atau memajukan nomor patch beta/reguler, jadi abaikan tag lama khusus alfa dengan nomor patch lebih tinggi saat memilih rangkaian beta atau reguler.
- Build alfa/nightly menggunakan rangkaian patch berikutnya yang belum dirilis dan hanya menaikkan `alpha.N` untuk build berulang. Setelah patch tersebut memiliki beta, build alfa baru berpindah ke patch berikutnya.
- Versi npm tidak dapat diubah: jangan pernah menghapus, memublikasikan ulang, atau menggunakan kembali tag yang telah dipublikasikan. Buat nomor prarilis berikutnya atau patch bulanan berikutnya sebagai gantinya.
- `latest` tetap mengikuti jalur npm reguler/harian saat ini; `beta` adalah target instalasi beta saat ini
- `extended-stable` berarti paket npm bulan terakhir yang didukung, dimulai pada patch `33`; patch `34` dan seterusnya merupakan rilis pemeliharaan pada jalur bulanan tersebut
- Rilis final reguler dan koreksi reguler secara default dipublikasikan ke npm `beta`; operator rilis dapat secara eksplisit menargetkan `latest`, atau mempromosikan build beta yang telah diperiksa kemudian
- Jalur extended-stable bulanan khusus memublikasikan paket inti npm dan setiap plugin resmi yang dapat dipublikasikan ke npm dengan versi yang sama persis. Jalur ini tidak memublikasikan plugin ke ClawHub atau memublikasikan artefak macOS atau Windows, GitHub Release, dist-tag repositori privat, image Docker, artefak seluler, atau unduhan situs web.
- Setiap rilis final reguler mengirimkan paket npm, aplikasi macOS, APK Android mandiri yang ditandatangani, dan penginstal Windows Hub yang ditandatangani secara bersamaan. Rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, sementara build/penandatanganan/notarisasi/promosi aplikasi native dicadangkan untuk rilis final reguler kecuali diminta secara eksplisit.

## Irama rilis

- Rilis bergerak dengan beta terlebih dahulu; stable menyusul hanya setelah beta terbaru divalidasi
- Pengelola biasanya membuat rilis dari cabang `release/YYYY.M.PATCH` yang dibuat dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak menghambat pengembangan baru di `main`
- Jika tag beta telah didorong atau dipublikasikan dan memerlukan perbaikan, pengelola membuat tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan hanya tersedia bagi pengelola

## Publikasi extended-stable bulanan khusus npm

Ini merupakan pengecualian khusus terhadap prosedur rilis reguler di bawah. Untuk
bulan `YYYY.M` yang telah selesai, buat `extended-stable/YYYY.M.33`; publikasikan
`vYYYY.M.33` dan patch pemeliharaan berikutnya dari cabang yang sama. Tag rilis,
ujung cabang, checkout, versi paket, pra-pemeriksaan npm, dan proses Validasi Rilis
Lengkap semuanya harus mengidentifikasi commit yang sama. `main` yang dilindungi harus
sudah berisi versi final bulan kalender yang benar-benar lebih baru di bawah patch
`33`; patch pemeliharaan tetap memenuhi syarat setelah `main` maju lebih dari satu
bulan.

Pada cabang extended-stable yang tepat, naikkan versi paket root ke `YYYY.M.P`, jalankan
`pnpm release:prep`, dan verifikasi bahwa setiap paket ekstensi yang dapat dipublikasikan memiliki
versi yang sama. Commit dan dorong semua perubahan yang dihasilkan, buat dan dorong
tag `vYYYY.M.P` yang tidak dapat diubah pada commit tersebut, lalu catat SHA lengkap yang dihasilkan.
Alur kerja menggunakan pohon yang telah disiapkan ini; alur kerja tidak menaikkan atau menyinkronkan
versi untuk Anda.

Jalankan pra-pemeriksaan npm dan Validasi Rilis Lengkap dari ujung cabang
yang telah disiapkan tersebut, lalu simpan kedua ID proses dan percobaan proses
Validasi Rilis Lengkap yang berhasil:

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
ujung cabang yang sama persis. Patch `P` harus bernilai `33` atau lebih besar. Teruskan SHA rilis lengkap
sebagai `ref`, tunggu matriks lengkap dan pembacaan ulang registri, lalu simpan
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
termasuk paket yang sumbernya tidak berubah. Alur kerja memverifikasi setiap paket persis
dan setiap tag plugin `extended-stable` sebelum berhasil. Jika proses parsial
gagal, jalankan kembali perintah yang sama: paket yang telah dipublikasikan digunakan kembali, tag
plugin yang hilang atau kedaluwarsa direkonsiliasi di bawah lingkungan rilis npm, dan
pembacaan ulang akhir tetap mencakup kumpulan paket lengkap.

Setelah alur kerja plugin berhasil dan lingkungan rilis npm siap,
publikasikan tarball pra-pemeriksaan inti yang tepat. Publikasi inti memverifikasi bahwa
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

Untuk fork atau simulasi nonproduksi yang secara sengaja tidak dapat memenuhi
kebijakan bulan `.33` bulanan atau `main` yang dilindungi, tambahkan
`-f bypass_extended_stable_guard=true` ke dispatch pra-pemeriksaan dan publikasi
npm. Nilai default-nya adalah `false`. Bypass hanya diterima dengan
`npm_dist_tag=extended-stable` dan dicatat dalam ringkasan alur kerja. Bypass ini
tidak melewati ref alur kerja `extended-stable/YYYY.M.33` kanonis,
kesetaraan ujung cabang/tag/checkout, sintaks tag final, kesetaraan versi
paket/tag, identitas proses dan manifes yang dirujuk, asal tarball,
persetujuan lingkungan, pembacaan ulang registri, atau bukti perbaikan pemilih.

Alur kerja publikasi memverifikasi identitas pra-pemeriksaan, validasi, dan proses plugin
yang dirujuk, digest tarball yang telah disiapkan, serta pemilih registri inti.
Konfirmasikan hasil secara independen setelah alur kerja berhasil:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Kedua perintah harus mengembalikan `YYYY.M.P`. Jika publikasi berhasil tetapi pembacaan ulang
pemilih gagal, jangan publikasikan ulang versi paket yang tidak dapat diubah. Gunakan
satu perintah perbaikan `npm dist-tag add openclaw@YYYY.M.P extended-stable`
yang dicetak dalam ringkasan yang selalu dijalankan milik alur kerja yang gagal, lalu ulangi kedua
pembacaan ulang independen. Pengembalian ke pemilih sebelumnya merupakan keputusan operator
terpisah, bukan jalur perbaikan pembacaan ulang.

Dokumentasi dukungan publik pada awalnya menetapkan Slack, Discord, dan Codex sebagai
permukaan plugin extended-stable yang dicakup. Daftar tersebut merupakan pernyataan dukungan, bukan
daftar yang diizinkan oleh kode rilis: setiap plugin resmi yang dapat dipublikasikan ke npm mengikuti
jalur publikasi dengan versi yang sama persis.

Daftar periksa reguler di bawah tetap menangani beta, `latest`, GitHub Release,
plugin, macOS, Windows, dan publikasi platform lainnya. Jangan jalankan
langkah-langkah tersebut untuk jalur extended-stable khusus npm ini.

## Daftar periksa operator rilis reguler

Daftar periksa ini merupakan bentuk publik dari alur rilis. Kredensial privat, penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada dalam buku panduan rilis khusus pengelola.

1. Mulai dari `main` saat ini: tarik versi terbaru, konfirmasikan bahwa commit target telah didorong, dan konfirmasikan bahwa Pipeline CI `main` cukup hijau untuk dijadikan dasar cabang.
2. Buat `release/YYYY.M.PATCH` dari commit tersebut. Backport bersifat opsional; terapkan hanya kumpulan yang dipilih operator. Naikkan setiap lokasi versi yang diwajibkan, jalankan `pnpm release:prep`, selesaikan perbaikan rilis dan forward-port yang diwajibkan, lalu tinjau `src/plugins/compat/registry.ts` beserta `src/commands/doctor/shared/deprecation-compat.ts`.
3. Bekukan commit lengkap-produk sebelum changelog sebagai **SHA Kode**. Jalankan pra-pemeriksaan sumber deterministik, lalu gunakan `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Ini menyematkan perkakas alur kerja tepercaya sementara matriks lengkap Vitest, Docker, QA, paket, dan performa menargetkan SHA Kode yang tepat.
4. Klasifikasikan kegagalan sebelum mengedit. Kegagalan produk/kode menghasilkan SHA Kode baru dan memerlukan validasi lengkap yang hijau untuk SHA tersebut. Kegagalan alur kerja, harness, kredensial, persetujuan, atau infrastruktur diperbaiki pada permukaan pemiliknya dan dijalankan ulang terhadap SHA Kode yang sama.
5. Hanya setelah SHA Kode hijau, hasilkan bagian teratas `CHANGELOG.md` dari PR yang digabungkan dan commit langsung sejak tag terkirim terakhir yang dapat dijangkau. Pastikan entri ditujukan kepada pengguna dan tidak diduplikasi. Ketika tag terkirim yang menyimpang atau forward-port berikutnya mengaitkan kembali PR yang telah dirilis, teruskan secara eksplisit sebagai `--shipped-ref`.
6. Commit hanya `CHANGELOG.md`. Commit ini adalah **SHA Rilis**. Diff lengkap dari SHA Kode ke SHA Rilis harus tepat berupa `CHANGELOG.md`; perubahan pada jalur lain mengembalikan rilis ke langkah 2.
7. Jalankan Validasi Rilis Lengkap yang disematkan ke SHA untuk SHA Rilis dengan penggunaan ulang bukti diaktifkan. Induk ringan harus mencatat `changelog-only-release-v1`, mengarah ke SHA Kode yang hijau, dan tidak menjalankan lane turunan produk. Ini menggunakan ulang bukti produk; bukan byte paket.
8. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true` terhadap SHA/tag Rilis. Simpan `preflight_run_id` yang berhasil. Ini membangun dan memeriksa byte paket persis yang menyertakan changelog final.
9. Beri tag pada SHA Rilis, lalu jalankan pembantu kandidat dengan induk validasi SHA Rilis dan pra-pemeriksaan npm yang berhasil alih-alih menjalankan ulang salah satunya:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Untuk rilis stabil, sertakan juga `--windows-node-tag vX.Y.Z`. Pembantu ini memverifikasi asal catatan rilis, byte prapemeriksaan npm, bukti penginstalan/pembaruan Parallels, bukti paket Telegram, dan rencana publikasi plugin, lalu mencetak perintah publikasi.

   `OpenClaw Release Publish` mengirimkan paket plugin yang dipilih atau semua paket plugin yang dapat dipublikasikan ke npm dan kumpulan yang sama ke ClawHub secara paralel, lalu mempromosikan artefak prapemeriksaan npm OpenClaw yang telah disiapkan dengan dist-tag yang sesuai setelah publikasi plugin ke npm berhasil. Checkout rilis tetap menjadi akar produk/data, sedangkan perencanaan dan verifikasi akhir dijalankan dari checkout sumber alur kerja tepercaya yang persis sama agar commit rilis lama tidak dapat secara diam-diam menggunakan perkakas rilis yang usang. Sebelum proses turunan publikasi dimulai, alur kerja merender dan menyimpan dalam cache isi rilis GitHub yang persis. Jika bagian lengkap yang cocok dengan `CHANGELOG.md` memenuhi batas 125,000 karakter GitHub dan batas aman 125,000 byte yang cocok dari perender, halaman memuat bagian `## YYYY.M.PATCH` tersebut secara persis, termasuk judulnya. Jika bagian sumber tidak muat, halaman mempertahankan catatan editorial yang dikelompokkan secara persis dan mengganti catatan kontribusi yang terlalu besar dengan tautan stabil ke catatan lengkap dalam `CHANGELOG.md` yang disematkan ke tag; catatan parsial dan butir yang terpotong tidak pernah dipublikasikan. Alur kerja memilih isi lengkap atau ringkas tersebut sebelum menambahkan `### Release verification`; jika bagian akhir bukti akan melampaui batas, alur kerja mempertahankan isi kanonis dan sebagai gantinya mengandalkan bukti terlampir yang tidak dapat diubah. Rilis stabil yang dipublikasikan ke npm `latest` menjadi rilis terbaru GitHub, sedangkan rilis pemeliharaan stabil yang dipertahankan di npm `beta` dibuat dengan GitHub `latest=false`. Alur kerja juga mengunggah bukti dependensi prapemeriksaan, manifes validasi lengkap, dan bukti verifikasi registri pascapublikasi ke rilis GitHub untuk respons insiden pascarilis. Alur kerja segera mencetak ID eksekusi turunan, menyetujui secara otomatis gerbang lingkungan rilis yang boleh disetujui oleh token alur kerja, merangkum tugas turunan yang gagal beserta bagian akhir log, membuat halaman draf rilis GitHub sejak awal dan mempromosikan aset Windows serta Android secara bersamaan dengan publikasi OpenClaw ke npm, menyelesaikan halaman rilis dan bukti dependensi setelah tahap-tahap tersebut berhasil, menunggu ClawHub setiap kali OpenClaw dipublikasikan ke npm, lalu menjalankan pemverifikasi beta dari main tepercaya dan mengunggah bukti pascapublikasi untuk rilis GitHub, paket npm, paket npm plugin yang dipilih, paket ClawHub yang dipilih, ID eksekusi alur kerja turunan, dan ID eksekusi NPM Telegram opsional. Pemverifikasi bootstrap ClawHub memerlukan jalur dan SHA alur kerja main tepercaya yang persis, percobaan eksekusi produsen dan terminal, SHA rilis, kumpulan paket yang diminta, tuple artefak paket yang tidak dapat diubah, serta artefak pembacaan kembali registri terminal; eksekusi ref-rilis lama yang berhasil tidak diterima.

   Kemudian jalankan penerimaan paket pascapublikasi terhadap paket `openclaw@YYYY.M.PATCH-beta.N` atau `openclaw@beta` yang telah dipublikasikan. Jika prarilis yang telah didorong atau dipublikasikan memerlukan perbaikan, buat nomor prarilis berikutnya yang sesuai; jangan pernah menghapus atau menulis ulang prarilis lama.

10. Jika upaya publikasi gagal, pertahankan Release SHA tanpa perubahan kecuali kegagalan tersebut membuktikan adanya cacat produk atau changelog. Lanjutkan proses turunan dan artefak permanen yang telah berhasil; jangan pernah membangun ulang atau memublikasikan ulang versi paket yang sudah berhasil.
11. Untuk rilis stabil, lanjutkan hanya setelah beta atau kandidat rilis yang telah diperiksa memiliki bukti validasi yang diwajibkan. Publikasi npm stabil juga dilakukan melalui `OpenClaw Release Publish`, dengan menggunakan kembali artefak prapemeriksaan yang berhasil melalui `preflight_run_id`. Kesiapan rilis macOS stabil juga memerlukan `.zip`, `.dmg`, dan `.dSYM.zip` yang telah dipaketkan, serta `appcast.xml` yang telah diperbarui pada `main`; alur kerja publikasi macOS secara otomatis memublikasikan appcast bertanda tangan ke `main` publik setelah aset rilis terverifikasi, atau membuka/memperbarui PR appcast jika perlindungan cabang memblokir pendorongan langsung. Kesiapan Windows Hub stabil memerlukan aset `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe`, dan `OpenClawCompanion-SHA256SUMS.txt` bertanda tangan pada rilis GitHub OpenClaw. Sertakan tag rilis `openclaw/openclaw-windows-node` bertanda tangan yang persis sebagai `windows_node_tag` dan peta digest penginstal yang disetujui kandidatnya sebagai `windows_node_installer_digests`; `OpenClaw Release Publish` mempertahankan draf rilis, mengirimkan `Windows Node Release`, dan memverifikasi ketiga aset sebelum publikasi.
12. Setelah publikasi, jalankan pemverifikasi pascapublikasi npm, E2E Telegram mandiri opsional dari npm yang telah dipublikasikan ketika Anda memerlukan bukti kanal pascapublikasi, promosi dist-tag bila diperlukan, verifikasi halaman rilis GitHub yang dihasilkan, jalankan langkah pengumuman rilis, lalu selesaikan [penutupan main stabil](#stable-main-closeout) sebelum menyatakan rilis stabil selesai.

## Penutupan main stabil

Publikasi stabil belum selesai hingga `main` memuat keadaan rilis aktual yang dikirimkan.

1. Mulai dari `main` terbaru yang baru. Audit `release/YYYY.M.PATCH` terhadapnya dan porting ke depan perbaikan nyata yang tidak ada di `main`. Jangan menggabungkan secara membabi buta adaptor kompatibilitas, pengujian, atau validasi khusus rilis ke `main` yang lebih baru.
2. Untuk jalur normal, atur `main` ke versi stabil yang dikirimkan. Penutupan yang terlambat dapat menggunakan `main` setelah nilainya maju ke CalVer OpenClaw stabil yang lebih baru; jangan menurunkan versi rangkaian rilis yang sudah dimulai hanya untuk menutup rilis sebelumnya. Validator tetap memerlukan bagian changelog dan entri appcast dari rilis yang dikirimkan secara persis serta mencatat versi dan SHA `main` yang sebenarnya. Jalankan `pnpm release:prep` setelah setiap perubahan versi akar, lalu `pnpm deps:shrinkwrap:generate`.
3. Buat bagian `## YYYY.M.PATCH` milik `CHANGELOG.md` pada `main` sama persis dengan cabang rilis yang diberi tag. Sertakan pembaruan `appcast.xml` stabil saat rilis Mac memublikasikannya.
4. Jangan menambahkan `YYYY.M.PATCH+1`, versi beta, atau bagian changelog mendatang yang kosong ke `main` hingga operator secara eksplisit memulai rangkaian rilis tersebut.
5. Jalankan `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, dan `OPENCLAW_TESTBOX=1 pnpm check:changed`. Dorong perubahan, lalu verifikasi bahwa `origin/main` memuat versi dan changelog yang dikirimkan sebelum menyatakan rilis stabil selesai.
6. Pastikan variabel repositori `RELEASE_ROLLBACK_DRILL_ID` dan `RELEASE_ROLLBACK_DRILL_DATE` tetap mutakhir setelah setiap latihan rollback privat.

`OpenClaw Stable Main Closeout` dimulai dari pendorongan `main` yang memuat versi, changelog, dan appcast yang dikirimkan setelah publikasi stabil. Proses ini membaca bukti pascapublikasi yang tidak dapat diubah untuk mengikat tag yang dikirimkan ke eksekusi Full Release Validation dan Publish-nya, lalu memverifikasi keadaan main stabil, rilis, periode pengamatan stabil wajib, dan bukti kinerja yang bersifat memblokir. Proses ini melampirkan manifes penutupan yang tidak dapat diubah beserta checksum ke rilis GitHub. Pemicu pendorongan otomatis melewati rilis lama yang mendahului bukti pascapublikasi yang tidak dapat diubah dan tidak pernah menganggap pelewatan tersebut sebagai penutupan yang selesai.

Penutupan lengkap memerlukan kedua aset dan checksum yang cocok. Manifes parsial memutar ulang SHA `main` dan latihan rollback yang telah dicatat untuk menghasilkan ulang byte yang identik, lalu melampirkan checksum yang belum ada; pasangan yang tidak valid, atau checksum tanpa manifes, tetap memblokir. Eksekusi yang dipicu oleh pendorongan tanpa variabel repositori latihan rollback akan dilewati tanpa menyelesaikan penutupan; catatan latihan yang tidak ada atau berusia lebih dari 90 hari tetap memblokir penutupan manual berbasis bukti. Perintah pemulihan privat tetap berada dalam runbook khusus pengelola. Gunakan pengiriman manual hanya untuk memperbaiki atau memutar ulang penutupan stabil berbasis bukti.

Jika induk Release Publish gagal hanya setelah bukti npm/plugin yang tidak dapat diubah dilampirkan, perbaiki dan publikasikan setiap aset platform stabil terlebih dahulu. Kemudian pengelola dapat mengirimkan penutupan secara manual dengan `allow_failed_publish_recovery=true`; mode tersebut hanya menerima induk gagal yang telah selesai dan juga memerlukan kontrak aset Android dan Windows yang persis, digest SHA-256 GitHub, verifikasi checksum, asal Android, serta promosi Windows yang berhasil dan dikirimkan oleh induk, dengan pemeriksaan Authenticode dan digest yang disetujui kandidat cocok dengan penginstal yang dipublikasikan, di samping pemeriksaan macOS/appcast normal. Penutupan pendorongan otomatis tidak pernah mengaktifkan mode pemulihan ini.

Tag koreksi fallback lama boleh menggunakan kembali bukti paket dasar hanya jika tag koreksi mengarah ke commit sumber yang sama dengan tag stabil dasar. Rilis Android-nya menggunakan kembali APK terverifikasi dari tag dasar dan menambahkan asal untuk tag koreksi. Koreksi dengan sumber berbeda harus memublikasikan dan memverifikasi bukti paketnya sendiri serta menggunakan `versionCode` Android yang lebih tinggi.

## Prapemeriksaan rilis

- Jalankan `pnpm check:test-types` sebelum prapemeriksaan rilis agar TypeScript pengujian tetap tercakup di luar gerbang lokal `pnpm check` yang lebih cepat.
- Jalankan `pnpm check:architecture` sebelum prapemeriksaan rilis agar pemeriksaan siklus impor dan batas arsitektur yang lebih luas berhasil di luar gerbang lokal yang lebih cepat.
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis `dist/*` yang diharapkan dan bundel Control UI tersedia untuk langkah validasi paket.
- Jalankan `pnpm release:prep` setelah kenaikan versi akar dan sebelum pemberian tag. Proses ini menjalankan setiap generator rilis deterministik yang umumnya menyimpang setelah perubahan versi/konfigurasi/API: versi plugin, shrinkwrap npm, inventaris plugin, skema konfigurasi dasar, metadata konfigurasi kanal yang dibundel, garis dasar dokumentasi konfigurasi, ekspor SDK plugin, manifes kontrak API SDK Plugin, dan bundel locale Control UI. Proses ini juga memblokir hingga terjemahan aplikasi native dan sumber daya locale yang dihasilkan platform cocok dengan inventaris sumber; jika tertinggal, tunggu atau kirimkan `Native App Locale Refresh` sebelum membekukan Code SHA. `pnpm release:check` menjalankan ulang pemeriksaan tersebut dalam mode pemeriksaan (termasuk gerbang locale ketat serta anggaran permukaan SDK plugin) dan melaporkan setiap kegagalan penyimpangan hasil generasi dalam satu lintasan sebelum menjalankan pemeriksaan rilis paket.
- Sinkronisasi versi plugin secara default memperbarui paket runtime `@openclaw/ai` yang dapat dipublikasikan, versi paket plugin resmi, dan batas bawah `openclaw.compat.pluginApi` yang ada ke versi rilis OpenClaw. Perlakukan bidang tersebut sebagai batas bawah API SDK/runtime plugin, bukan sekadar salinan versi paket: untuk rilis khusus plugin yang sengaja tetap kompatibel dengan host OpenClaw yang lebih lama, pertahankan batas bawah pada API host tertua yang didukung dan dokumentasikan pilihan tersebut dalam bukti rilis plugin.
- Jalankan alur kerja manual `Full Release Validation` sebelum persetujuan rilis untuk memulai semua kotak pengujian prarilis dari satu titik masuk. Alur kerja ini menerima cabang, tag, atau SHA commit lengkap, mengirimkan `CI` manual, dan mengirimkan `OpenClaw Release Checks` untuk pengujian singkat instalasi, penerimaan paket, pemeriksaan paket lintas OS, kesetaraan QA Lab, Matrix, dan lajur Telegram. Eksekusi stabil dan lengkap selalu mencakup pengujian live/E2E menyeluruh dan periode pengamatan jalur rilis Docker; `run_release_soak=true` dipertahankan untuk periode pengamatan beta yang eksplisit. Package Acceptance menyediakan E2E Telegram paket kanonis selama validasi kandidat, sehingga menghindari pemantau live kedua yang berjalan secara bersamaan.

  Berikan `release_package_spec` setelah memublikasikan beta untuk menggunakan kembali paket npm yang dikirimkan di seluruh pemeriksaan rilis, Package Acceptance, dan E2E Telegram paket tanpa membangun ulang tarball rilis. Berikan `npm_telegram_package_spec` hanya ketika Telegram harus menggunakan paket terpublikasi yang berbeda dari validasi rilis lainnya. Berikan `package_acceptance_package_spec` ketika Package Acceptance harus menggunakan paket terpublikasi yang berbeda dari spesifikasi paket rilis. Berikan `evidence_package_spec` ketika laporan bukti rilis harus membuktikan bahwa validasi cocok dengan paket npm yang telah dipublikasikan tanpa memaksakan E2E Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Jalankan alur kerja `Package Acceptance` secara manual ketika Anda menginginkan bukti jalur samping untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk `openclaw@beta`, `openclaw@latest`, atau versi rilis yang tepat; `source=ref` untuk mengemas cabang/tag/SHA `package_ref` tepercaya dengan harness `workflow_ref` saat ini; `source=url` untuk tarball HTTPS publik dengan SHA-256 wajib dan kebijakan URL publik yang ketat; `source=trusted-url` untuk kebijakan sumber tepercaya bernama yang menggunakan `trusted_source_id` dan SHA-256 wajib; atau `source=artifact` untuk tarball yang diunggah oleh eksekusi GitHub Actions lain.

  Alur kerja tersebut menetapkan kandidat menjadi `package-under-test`, menggunakan kembali penjadwal rilis Docker E2E terhadap tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika lane Docker yang dipilih mencakup `published-upgrade-survivor`, artefak paket menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline yang telah dipublikasikan. `update-restart-auth` menggunakan paket kandidat sebagai CLI yang diinstal sekaligus paket yang diuji sehingga jalur mulai ulang terkelola milik perintah pembaruan kandidat turut diuji.

  Contoh:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Profil umum:
  - `smoke`: lane instalasi/channel/agen, jaringan Gateway, dan pemuatan ulang konfigurasi
  - `package`: lane paket/pembaruan/mulai ulang/plugin yang berbasis artefak tanpa OpenWebUI atau ClawHub langsung
  - `product`: profil paket ditambah channel MCP, pembersihan cron/subagen, pencarian web OpenAI, dan OpenWebUI
  - `full`: bagian jalur rilis Docker dengan OpenWebUI
  - `custom`: pemilihan `docker_lanes` yang tepat untuk menjalankan ulang secara terfokus

- Jalankan alur kerja `CI` secara manual dan langsung ketika Anda hanya memerlukan cakupan CI normal yang deterministik untuk kandidat rilis. Pemicu CI manual melewati pembatasan berdasarkan perubahan dan memaksa shard Linux Node, shard plugin bawaan, shard kontrak plugin dan channel, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, dan lane i18n Control UI. Eksekusi CI manual mandiri menjalankan Android hanya ketika dipicu dengan `include_android=true`; `Full Release Validation` meneruskan input tersebut kepada CI turunannya.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Jalankan `pnpm qa:otel:smoke` saat memvalidasi telemetri rilis. Ini menjalankan QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi ekspor trace, metrik, dan log serta atribut trace yang dibatasi dan redaksi konten/pengidentifikasi tanpa memerlukan Opik, Langfuse, atau kolektor eksternal lainnya.
- Jalankan `pnpm qa:otel:collector-smoke` saat memvalidasi kompatibilitas kolektor. Ini merutekan ekspor OTLP QA-lab yang sama melalui kontainer Docker OpenTelemetry Collector yang sebenarnya sebelum menjalankan pemeriksaan penerima lokal.
- Jalankan `pnpm qa:prometheus:smoke` saat memvalidasi scraping Prometheus yang dilindungi. Ini menjalankan QA-lab, menolak scraping tanpa autentikasi, dan memverifikasi bahwa kelompok metrik yang penting bagi rilis tetap bebas dari konten prompt, pengidentifikasi mentah, token autentikasi, dan path lokal.
- Jalankan `pnpm qa:observability:smoke` untuk menjalankan lane smoke OpenTelemetry dan Prometheus pada checkout sumber secara berurutan.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag.
- Prapemeriksaan `OpenClaw NPM Release` menghasilkan bukti rilis dependensi sebelum mengemas tarball npm. Gate kerentanan advisory npm memblokir rilis jika gagal. Risiko manifes transitif, permukaan kepemilikan/instalasi dependensi, dan laporan perubahan dependensi hanya merupakan bukti rilis. Laporan perubahan dependensi membandingkan kandidat rilis dengan tag rilis sebelumnya yang dapat dijangkau. Prapemeriksaan mengunggah bukti dependensi sebagai `openclaw-release-dependency-evidence-<tag>` dan juga menyematkannya di bawah `dependency-evidence/` dalam artefak prapemeriksaan npm yang telah disiapkan. Jalur publikasi sebenarnya menggunakan kembali artefak prapemeriksaan tersebut, lalu melampirkan bukti yang sama ke rilis GitHub sebagai `openclaw-<version>-dependency-evidence.zip`.
- Jalankan `OpenClaw Release Publish` untuk urutan publikasi yang mengubah keadaan setelah tag tersedia. Picu publikasi beta dan stabil reguler dari `main` tepercaya; tag rilis tetap memilih commit target yang tepat dan dapat menunjuk ke dalam `release/YYYY.M.PATCH`. Publikasi alfa Tideclaw tetap berada di cabang alfa yang sesuai. Teruskan `preflight_run_id` npm OpenClaw yang berhasil, `full_release_validation_run_id` yang berhasil, dan `full_release_validation_run_attempt` yang tepat, serta pertahankan cakupan publikasi plugin default `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Alur kerja menjalankan publikasi npm plugin, publikasi ClawHub plugin, dan publikasi npm OpenClaw secara berurutan agar paket inti tidak dipublikasikan sebelum plugin yang dieksternalisasi; promosi Windows dan Android berjalan secara bersamaan dengan publikasi npm inti terhadap halaman rilis draf. Pengulangan publikasi dapat dilanjutkan: versi npm inti yang sudah dipublikasikan akan melewati pemicu inti setelah alur kerja membuktikan tarball registri cocok dengan artefak prapemeriksaan tag, dan promosi Windows/Android dilewati ketika rilis sudah memiliki kontrak artefak yang terverifikasi, sehingga percobaan ulang hanya mengulang tahap yang gagal. Perbaikan khusus plugin yang terfokus memerlukan `plugin_publish_scope=selected` dan daftar plugin yang tidak kosong. Eksekusi `all-publishable` khusus plugin memerlukan bukti prapemeriksaan yang lengkap dan tidak dapat diubah serta bukti Validasi Rilis Penuh; bukti parsial ditolak.
- `OpenClaw Release Publish` stabil memerlukan `windows_node_tag` yang tepat setelah rilis `openclaw/openclaw-windows-node` non-prarilis yang sesuai tersedia, beserta peta `windows_node_installer_digests` yang disetujui untuk kandidat. Sebelum memicu turunan publikasi apa pun, alur ini memverifikasi bahwa rilis sumber tersebut telah dipublikasikan, bukan prarilis, berisi penginstal x64/ARM64 yang diwajibkan, dan masih cocok dengan peta yang disetujui tersebut. Alur ini kemudian memicu `Windows Node Release` ketika rilis OpenClaw masih berupa draf, dengan membawa peta digest penginstal yang disematkan tanpa perubahan. Alur kerja turunan mengunduh penginstal Windows Hub yang telah ditandatangani dari tag yang tepat tersebut, mencocokkannya dengan digest yang disematkan, memverifikasi pada runner Windows bahwa tanda tangan Authenticode-nya menggunakan penanda tangan OpenClaw Foundation yang diharapkan, menulis manifes SHA-256, dan mengunggah penginstal beserta manifes ke rilis GitHub OpenClaw kanonis, lalu mengunduh ulang artefak yang dipromosikan dan memverifikasi keanggotaan serta hash manifes. Alur induk memverifikasi kontrak artefak x64, ARM64, dan checksum saat ini sebelum publikasi. Pemulihan langsung menolak nama artefak `OpenClawCompanion-*` yang tidak diharapkan sebelum mengganti artefak kontrak yang diharapkan dengan byte sumber yang disematkan.

  Picu `Windows Node Release` secara manual hanya untuk pemulihan, dan selalu teruskan tag yang tepat, jangan pernah `latest`, beserta peta JSON `expected_installer_digests` eksplisit dari rilis sumber yang disetujui. Tautan unduhan situs web harus mengarah ke URL artefak rilis OpenClaw yang tepat untuk rilis stabil saat ini, atau ke `releases/latest/download/...` hanya setelah memverifikasi bahwa pengalihan terbaru GitHub menunjuk ke rilis yang sama; jangan hanya menautkan ke halaman rilis repositori pendamping.

- Pemeriksaan rilis kini dijalankan dalam alur kerja manual terpisah: `OpenClaw Release Checks`. Alur ini juga menjalankan jalur paritas mock QA Lab serta profil rilis Matrix dan jalur QA Telegram sebelum persetujuan rilis. Jalur live menggunakan environment `qa-live-shared`; Telegram juga menggunakan penyewaan kredensial CI Convex. Jalankan alur kerja manual `QA-Lab - All Lanes` dengan `matrix_profile=all` saat Anda menginginkan setiap skenario Matrix yang dipelihara; alur kerja menyebarkan pilihan tersebut ke seluruh profil transportasi, media, dan E2EE agar pembuktian lengkap tetap berada dalam batas waktu tunggu per job.
- Validasi runtime instalasi dan peningkatan lintas OS merupakan bagian dari `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil alur kerja yang dapat digunakan kembali `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung. Pemisahan ini disengaja: menjaga jalur rilis npm yang sebenarnya tetap singkat, deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di jalurnya sendiri agar tidak menahan atau memblokir publikasi.
- Pemeriksaan rilis yang memuat rahasia harus dipicu melalui `Full Release Validation` atau dari ref alur kerja `main`/release agar logika alur kerja dan rahasia tetap terkendali.
- `OpenClaw Release Checks` menerima branch, tag, atau SHA commit lengkap selama commit yang di-resolve dapat dijangkau dari branch atau tag rilis OpenClaw.
- Preflight khusus validasi `OpenClaw NPM Release` juga menerima SHA commit lengkap 40 karakter dari branch alur kerja saat ini tanpa memerlukan tag yang telah didorong. Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi yang sebenarnya. Dalam mode SHA, alur kerja menyintesis `v<package.json version>` hanya untuk pemeriksaan metadata paket; publikasi yang sebenarnya tetap memerlukan tag rilis yang sebenarnya.
- Kedua alur kerja mempertahankan jalur publikasi dan promosi yang sebenarnya pada runner yang di-host GitHub, sementara jalur validasi yang tidak melakukan mutasi dapat menggunakan runner Linux Blacksmith yang lebih besar.
- Alur kerja tersebut menjalankan `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` menggunakan rahasia alur kerja `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`.
- Preflight rilis npm tidak lagi menunggu jalur pemeriksaan rilis terpisah.
- Sebelum memberi tag pada kandidat rilis secara lokal, jalankan `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Helper menjalankan pagar pengaman rilis cepat, pemeriksaan rilis npm/ClawHub Plugin, build, build UI, dan `release:openclaw:npm:check` dalam urutan yang mendeteksi kesalahan umum yang memblokir persetujuan sebelum alur kerja publikasi GitHub dimulai.
- Jalankan `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (atau tag prarilis/koreksi yang sesuai) sebelum persetujuan.
- Setelah publikasi npm, jalankan `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi registry yang telah dipublikasikan dalam prefiks sementara baru.
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan E2E Telegram sebenarnya terhadap paket npm yang telah dipublikasikan menggunakan kumpulan kredensial Telegram sewaan bersama. Eksekusi satu kali oleh maintainer lokal dapat menghilangkan variabel Convex dan meneruskan ketiga kredensial environment `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pascapublikasi lengkap dari mesin maintainer, gunakan `pnpm release:beta-smoke -- --beta betaN`. Helper menjalankan validasi pembaruan npm/target baru Parallels, memicu `NPM Telegram Beta E2E`, melakukan polling terhadap eksekusi alur kerja yang tepat, mengunduh artefak, dan mencetak laporan Telegram.
- Maintainer dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui alur kerja manual `NPM Telegram Beta E2E`. Alur ini sengaja hanya manual dan tidak dijalankan pada setiap merge.
- Otomatisasi rilis maintainer menggunakan preflight-lalu-promosi:
  - Publikasi npm yang sebenarnya harus melewati npm `preflight_run_id` yang berhasil.
  - Orkestrasi dan preflight publikasi beta serta stabil reguler menggunakan `main` tepercaya terhadap tag target yang tepat. Publikasi dan preflight alfa Tideclaw menggunakan branch alfa yang sesuai.
  - Rilis npm stabil secara default menggunakan `beta`; publikasi npm stabil dapat menargetkan `latest` secara eksplisit melalui input alur kerja.
  - Mutasi dist-tag npm berbasis token berada di `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` karena `npm dist-tag add` masih memerlukan `NPM_TOKEN`, sementara repo sumber mempertahankan publikasi khusus OIDC.
  - `macOS Release` publik hanya untuk validasi; saat tag hanya berada pada branch rilis tetapi alur kerja dipicu dari `main`, tetapkan `public_release_branch=release/YYYY.M.PATCH`.
  - Publikasi macOS yang sebenarnya harus melewati macOS `preflight_run_id` dan `validate_run_id` yang berhasil.
  - Jalur publikasi yang sebenarnya mempromosikan artefak yang telah disiapkan alih-alih membangunnya kembali.
- Untuk rilis koreksi stabil seperti `YYYY.M.PATCH-N`, pemverifikasi pascapublikasi juga memeriksa jalur peningkatan prefiks sementara yang sama dari `YYYY.M.PATCH` ke `YYYY.M.PATCH-N` agar koreksi rilis tidak secara diam-diam membiarkan instalasi global yang lebih lama tetap menggunakan payload stabil dasar.
- Preflight rilis npm gagal secara tertutup kecuali tarball menyertakan `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong, agar kami tidak kembali mengirimkan dasbor browser kosong.
- Verifikasi pascapublikasi juga memeriksa bahwa entrypoint Plugin yang dipublikasikan dan metadata paket tersedia dalam tata letak registry yang terinstal. Rilis yang dikirim tanpa payload runtime Plugin akan gagal dalam pemverifikasi pascapublikasi dan tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga memberlakukan anggaran npm pack `unpackedSize` pada tarball pembaruan kandidat, sehingga e2e penginstal mendeteksi pembengkakan pack yang tidak disengaja sebelum jalur publikasi rilis.
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes waktu ekstensi, atau matriks pengujian ekstensi, buat ulang dan tinjau output matriks `plugin-prerelease-extension-shard` milik perencana dari `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak menjelaskan tata letak CI yang usang.
- Kesiapan rilis macOS stabil juga mencakup permukaan pembaru: rilis GitHub pada akhirnya harus memiliki `.zip`, `.dmg`, dan `.dSYM.zip` yang dikemas; `appcast.xml` pada `main` harus menunjuk ke zip stabil baru setelah publikasi (alur kerja publikasi macOS meng-commit-nya secara otomatis, atau membuka PR appcast saat push langsung diblokir); aplikasi yang dikemas harus mempertahankan id bundle non-debug, URL feed Sparkle yang tidak kosong, dan `CFBundleVersion` yang sama dengan atau lebih tinggi dari batas minimum build Sparkle kanonis untuk versi rilis tersebut.

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai matriks produk lengkap dari satu entrypoint. Gunakan helper agar setiap alur kerja anak dijalankan dari branch sementara yang ditetapkan pada satu SHA alur kerja `main` tepercaya, sementara commit yang diminta tetap menjadi kandidat yang diuji:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

Helper mengambil `origin/main` saat ini, mendorong `release-ci/<workflow-sha>-...` pada commit alur kerja tepercaya tersebut, menyimpulkan `beta` dari versi paket alfa/beta dan `stable` untuk versi lainnya, memicu `Full Release Validation` dari branch sementara dengan `ref=<target-sha>`, memverifikasi bahwa setiap `headSha` alur kerja anak cocok dengan SHA alur kerja induk yang disematkan, lalu menghapus branch sementara. Teruskan `-f reuse_evidence=false` untuk memaksakan eksekusi baru, `-f release_profile=full` untuk penyisiran advisori luas, atau `--workflow-sha <trusted-main-sha>` untuk menyematkan commit lama yang masih dapat dijangkau dari `origin/main` saat ini. Alur kerja itu sendiri tidak pernah menulis ref repositori. Hal ini menjaga tooling rilis khusus main tetap tersedia tanpa menambahkan commit tooling ke kandidat dan menghindari pembuktian eksekusi anak `main` yang lebih baru secara tidak sengaja.

Setelah SHA Kode berstatus hijau, commit hanya `CHANGELOG.md` dan jalankan helper yang sama dengan SHA Rilis:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

Induk kedua menggunakan kembali bukti produk hanya ketika GitHub membuktikan bahwa SHA Rilis merupakan turunan dari SHA Kode dan kumpulan jalur yang berubah secara lengkap tepat sama dengan `CHANGELOG.md`. Induk tersebut mencatat `changelog-only-release-v1` dan tidak memicu anak produk. Preflight npm dan penerimaan paket/instalasi tetap dijalankan pada SHA Rilis karena byte tarball-nya berubah.

Untuk SHA Kode baru, alur kerja me-resolve target, memicu `CI` manual, lalu memicu `OpenClaw Release Checks`. `OpenClaw Release Checks` menyebarkan smoke instalasi, pemeriksaan rilis lintas OS, cakupan jalur rilis Docker live/E2E saat soak diaktifkan, Penerimaan Paket dengan E2E paket Telegram kanonis, paritas QA Lab, Matrix live, dan Telegram live. Eksekusi penuh/semua hanya dapat diterima ketika ringkasan `Full Release Validation` menunjukkan `normal_ci`, `plugin_prerelease`, dan `release_checks` berhasil, kecuali eksekusi ulang terfokus sengaja melewati anak `Plugin Prerelease` yang terpisah. Gunakan anak mandiri `npm-telegram` hanya untuk eksekusi ulang terfokus paket yang telah dipublikasikan dengan `release_package_spec` atau `npm_telegram_package_spec`. Ringkasan pemverifikasi akhir menyertakan tabel job paling lambat untuk setiap eksekusi anak, sehingga manajer rilis dapat melihat jalur kritis saat ini tanpa mengunduh log.

Anak performa produk hanya menghasilkan artefak dalam jalur rilis ini. Alur payung
memicunya dengan `publish_reports=false`, dan validasi ditolak
kecuali pagar pengaman khusus artefaknya membuktikan bahwa penerbit laporan Clawgrit tetap
dilewati.

Lihat [Validasi rilis lengkap](/id/reference/full-release-validation) untuk matriks tahap lengkap, nama job alur kerja yang tepat, perbedaan profil stabil dan penuh, artefak, serta penanganan eksekusi ulang terfokus.

Alur kerja anak dipicu dari ref tepercaya yang disematkan ke SHA yang menjalankan `Full Release Validation`. Setiap eksekusi anak harus menggunakan SHA alur kerja induk yang tepat. Jangan gunakan pemicu mentah `--ref main -f ref=<sha>` untuk pembuktian rilis; gunakan `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Gunakan `release_profile` untuk memilih keluasan live/penyedia:

- `beta`: jalur live dan Docker OpenAI/core kritis-rilis yang paling cepat
- `stable`: cakupan penyedia/backend beta serta stabil untuk persetujuan rilis
- `full`: cakupan advisori penyedia/media yang stabil serta luas

Validasi stabil dan penuh selalu menjalankan penyisiran lengkap live/E2E, jalur rilis Docker, dan penyintas peningkatan yang dipublikasikan secara terbatas sebelum promosi. Gunakan `run_release_soak=true` untuk meminta penyisiran yang sama bagi beta. Penyisiran tersebut mencakup empat paket stabil terbaru ditambah baseline `2026.4.23` dan `2026.5.2` yang disematkan serta cakupan `2026.4.15` yang lebih lama, dengan baseline duplikat dihapus dan setiap baseline dibagi menjadi job runner Docker tersendiri.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk me-resolve ref target satu kali sebagai `release-package-under-test` dan menggunakan kembali artefak tersebut dalam pemeriksaan lintas OS, Penerimaan Paket, dan Docker jalur rilis saat soak dijalankan. Hal ini menjaga semua kotak yang berhadapan dengan paket menggunakan byte yang sama dan menghindari build paket berulang. Setelah beta tersedia di npm, tetapkan `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` agar pemeriksaan rilis mengunduh paket yang telah dikirim satu kali, mengekstrak SHA sumber build-nya dari `dist/build-info.json`, dan menggunakan kembali artefak tersebut untuk jalur lintas OS, Penerimaan Paket, Docker jalur rilis, dan Telegram paket.

Smoke instalasi OpenAI lintas OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat variabel repo/organisasi ditetapkan, atau `openai/gpt-5.6-luna` jika tidak, karena jalur ini membuktikan instalasi paket, onboarding, startup gateway, dan satu giliran agen live, bukan melakukan benchmark terhadap model yang paling mampu. Matriks penyedia live yang lebih luas tetap menjadi tempat untuk cakupan khusus model.

Gunakan varian berikut sesuai tahap rilis:

```bash
# Validasi Code SHA dengan produk lengkap.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Validasi Release SHA yang hanya berisi changelog dengan menggunakan kembali bukti produk Code SHA.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Setelah menerbitkan beta, tambahkan E2E Telegram untuk paket yang diterbitkan.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Jangan gunakan payung lengkap sebagai eksekusi ulang pertama setelah perbaikan terfokus. Jika satu kotak gagal, gunakan alur kerja turunan, job, jalur Docker, profil paket, penyedia model, atau jalur QA yang gagal untuk pembuktian berikutnya. Jalankan kembali payung lengkap hanya jika perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua kotak sebelumnya kedaluwarsa. Pemverifikasi akhir payung memeriksa ulang ID eksekusi alur kerja turunan yang tercatat, jadi setelah alur kerja turunan berhasil dijalankan ulang, jalankan ulang hanya job induk `Verify full validation` yang gagal.

`rerun_group=all` dapat menggunakan kembali eksekusi payung hijau sebelumnya ketika profil rilis,
pengaturan soak efektif, dan input validasi cocok serta SHA target
identik atau target baru merupakan turunannya yang seluruh kumpulan path perubahannya
tepat `CHANGELOG.md`. Penggunaan kembali target yang sama persis mencatat
`exact-target-full-validation-v1`; Release SHA pascavalidasi mencatat
`changelog-only-release-v1`. Yang terakhir hanya menggunakan kembali validasi produk. Pra-pemeriksaan npm,
byte paket, asal-usul catatan rilis, dan penerimaan instalasi/pembaruan
tetap harus dijalankan terhadap Release SHA. Setiap perubahan target yang dimiliki versi, sumber, hasil pembuatan,
dependensi, paket, atau alur kerja memerlukan Code SHA baru
dan validasi lengkap baru. Eksekusi payung yang lebih baru untuk ref `release/*` dan
grup eksekusi ulang yang sama secara otomatis menggantikan eksekusi yang masih berlangsung. Teruskan
`reuse_evidence=false` untuk memaksa eksekusi lengkap baru.

Untuk pemulihan terbatas, teruskan `rerun_group` ke payung. `all` adalah eksekusi kandidat rilis yang sebenarnya, `ci` hanya menjalankan turunan CI normal, `plugin-prerelease` hanya menjalankan turunan plugin khusus rilis, `release-checks` menjalankan setiap kotak rilis, dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`. Eksekusi ulang `npm-telegram` yang terfokus memerlukan `release_package_spec` atau `npm_telegram_package_spec`; eksekusi lengkap/semua menggunakan E2E Telegram paket kanonis di dalam Package Acceptance. Eksekusi ulang lintas OS yang terfokus dapat menambahkan `cross_os_suite_filter=windows/packaged-upgrade` atau filter OS/suite lain. Kegagalan pemeriksaan rilis QA memblokir validasi rilis normal, termasuk penyimpangan alat dinamis OpenClaw yang diwajibkan pada tingkat standar. Eksekusi alfa Tideclaw masih dapat memperlakukan jalur pemeriksaan rilis yang bukan terkait keamanan paket sebagai imbauan. Dengan `release_profile=beta`, suite penyedia langsung `Run repo/live E2E validation` bersifat imbauan (peringatan, bukan pemblokir); profil stabil dan lengkap tetap menjadikannya pemblokir. Ketika `live_suite_filter` secara eksplisit meminta jalur langsung QA berpagar seperti Discord, WhatsApp, atau Slack, variabel repo `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` yang sesuai harus diaktifkan; jika tidak, pengambilan input gagal alih-alih melewati jalur tersebut secara diam-diam.

### Vitest

Kotak Vitest adalah alur kerja turunan `CI` manual. CI manual sengaja melewati pembatasan cakupan perubahan dan memaksa grafik pengujian normal untuk kandidat rilis: shard Node Linux, shard plugin bawaan, shard kontrak plugin dan kanal, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, dan i18n Control UI. Android disertakan ketika `Full Release Validation` menjalankan kotak karena payung meneruskan `include_android=true`; CI manual mandiri memerlukan `include_android=true` untuk cakupan Android.

Gunakan kotak ini untuk menjawab "apakah pohon sumber lulus suite pengujian normal lengkap?" Ini tidak sama dengan validasi produk pada jalur rilis. Bukti yang perlu disimpan:

- ringkasan `Full Release Validation` yang menampilkan URL eksekusi `CI` yang dipicu
- eksekusi `CI` hijau pada SHA target yang tepat
- nama shard yang gagal atau lambat dari job CI saat menyelidiki regresi
- artefak waktu Vitest seperti `.artifacts/vitest-shard-timings.json` ketika suatu eksekusi memerlukan analisis performa

Jalankan CI manual secara langsung hanya ketika rilis memerlukan CI normal deterministik tetapi tidak memerlukan kotak Docker, QA Lab, langsung, lintas OS, atau paket. Gunakan perintah pertama untuk CI langsung non-Android. Tambahkan `include_android=true` ketika CI kandidat rilis langsung harus mencakup Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Kotak Docker berada di `OpenClaw Release Checks` hingga `openclaw-live-and-e2e-checks-reusable.yml`, ditambah alur kerja mode rilis `install-smoke`. Kotak ini memvalidasi kandidat rilis melalui lingkungan Docker terpaket, bukan hanya pengujian tingkat sumber.

Cakupan Docker rilis meliputi:

- smoke instalasi lengkap dengan smoke instalasi global Bun yang lambat diaktifkan
- persiapan/penggunaan kembali image smoke Dockerfile root berdasarkan SHA target, dengan job smoke QR, root/gateway, dan penginstal/Bun berjalan sebagai shard smoke instalasi terpisah
- jalur E2E repositori
- potongan Docker jalur rilis: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hingga `plugins-runtime-install-h`, dan `openwebui`
- cakupan OpenWebUI pada runner khusus dengan disk besar ketika diminta
- jalur instalasi/pencopotan plugin bawaan terpisah `bundled-plugin-install-uninstall-0` hingga `bundled-plugin-install-uninstall-23`
- suite penyedia langsung/E2E dan cakupan model langsung Docker ketika pemeriksaan rilis mencakup suite langsung

Gunakan artefak Docker sebelum menjalankan ulang. Penjadwal jalur rilis mengunggah `.artifacts/docker-tests/` dengan log jalur, `summary.json`, `failures.json`, waktu fase, JSON rencana penjadwal, dan perintah eksekusi ulang. Untuk pemulihan terfokus, gunakan `docker_lanes=<lane[,lane]>` pada alur kerja langsung/E2E yang dapat digunakan kembali alih-alih menjalankan ulang semua potongan rilis. Perintah eksekusi ulang yang dihasilkan mencakup `package_artifact_run_id` sebelumnya dan input image Docker yang telah disiapkan jika tersedia, sehingga jalur yang gagal dapat menggunakan kembali tarball dan image GHCR yang sama.

### QA Lab

Kotak QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Kotak ini adalah gerbang perilaku agentik dan rilis tingkat kanal, terpisah dari mekanisme paket Vitest dan Docker.

Cakupan QA Lab rilis meliputi:

- jalur paritas tiruan yang membandingkan jalur kandidat OpenAI dengan baseline `anthropic/claude-opus-4-8` menggunakan paket paritas agentik
- profil rilis adaptor langsung Matrix menggunakan lingkungan `qa-live-shared`
- jalur QA Telegram langsung menggunakan sewa kredensial CI Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke`, atau `pnpm qa:observability:smoke` ketika telemetri rilis memerlukan bukti lokal eksplisit

Gunakan kotak ini untuk menjawab "apakah rilis berperilaku dengan benar dalam skenario QA dan alur kanal langsung?" Simpan URL artefak untuk jalur paritas, Matrix, dan Telegram saat menyetujui rilis. Cakupan Matrix lengkap tetap tersedia sebagai eksekusi QA Lab manual dengan shard, bukan sebagai jalur kritis rilis default.

### Paket

Kotak Paket adalah gerbang produk yang dapat diinstal. Kotak ini didukung oleh `Package Acceptance` dan resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalisasi kandidat menjadi tarball `package-under-test` yang digunakan oleh E2E Docker, memvalidasi inventaris paket, mencatat versi paket dan SHA-256, serta memisahkan ref harness alur kerja dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat
- `source=ref`: kemas cabang, tag, atau SHA commit lengkap `package_ref` tepercaya dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS publik dengan `package_sha256` yang diwajibkan; kredensial URL, port HTTPS non-default, nama host atau alamat yang diresolusikan yang bersifat privat/internal/penggunaan khusus, dan pengalihan tidak aman ditolak
- `source=trusted-url`: unduh `.tgz` HTTPS dengan `package_sha256` dan `trusted_source_id` yang diwajibkan dari kebijakan bernama di `.github/package-trusted-sources.json`; gunakan ini untuk mirror perusahaan milik maintainer atau repositori paket privat alih-alih menambahkan bypass jaringan privat tingkat input ke `source=url`
- `source=artifact`: gunakan kembali `.tgz` yang diunggah oleh eksekusi GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak paket rilis yang telah disiapkan, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance mempertahankan migrasi, pembaruan, peningkatan VPS yang dikelola root, pemulaian ulang pembaruan autentikasi yang dikonfigurasi, instalasi Skills ClawHub langsung, pembersihan dependensi plugin usang, fixture plugin luring, pembaruan plugin, penguatan escape pengikatan perintah plugin, dan QA paket Telegram terhadap tarball hasil resolusi yang sama. Pemeriksaan rilis pemblokir menggunakan baseline paket terbaru yang diterbitkan secara default; profil beta dengan `run_release_soak=true`, `release_profile=stable`, atau `release_profile=full` memperluas sapuan penyintas peningkatan yang diterbitkan menjadi `last-stable-4` ditambah baseline `2026.4.23`, `2026.5.2`, dan `2026.4.15` yang disematkan dengan skenario `reported-issues`. Gunakan Package Acceptance dengan `source=npm` untuk kandidat yang sudah dirilis, `source=ref` untuk tarball npm lokal berbasis SHA sebelum diterbitkan, `source=trusted-url` untuk mirror perusahaan/privat milik maintainer, atau `source=artifact` untuk tarball yang telah disiapkan dan diunggah oleh eksekusi GitHub Actions lain.

Ini adalah pengganti native GitHub untuk sebagian besar cakupan paket/pembaruan yang sebelumnya memerlukan Parallels. Pemeriksaan rilis lintas OS tetap penting untuk onboarding, penginstal, dan perilaku platform khusus OS, tetapi validasi produk paket/pembaruan sebaiknya mengutamakan Package Acceptance.

Daftar periksa kanonis untuk validasi pembaruan dan plugin adalah [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins). Gunakan daftar tersebut saat menentukan jalur lokal, Docker, Package Acceptance, atau pemeriksaan rilis mana yang membuktikan perubahan instalasi/pembaruan plugin, pembersihan doctor, atau migrasi paket yang diterbitkan. Migrasi pembaruan terbitan menyeluruh dari setiap paket stabil `2026.4.23+` adalah alur kerja `Update Migration` manual terpisah, bukan bagian dari CI Rilis Lengkap.

Kelonggaran package-acceptance lama sengaja dibatasi waktu. Paket hingga `2026.4.25` dapat menggunakan jalur kompatibilitas untuk kekurangan metadata yang sudah diterbitkan ke npm: entri inventaris QA privat yang tidak ada dalam tarball, `gateway install --wrapper` yang tidak ada, file patch yang tidak ada dalam fixture git turunan tarball, `update.channel` tersimpan yang tidak ada, lokasi catatan instalasi plugin lama, persistensi catatan instalasi marketplace yang tidak ada, dan migrasi metadata konfigurasi selama `plugins update`. Paket `2026.4.26` yang diterbitkan dapat memperingatkan tentang file stempel metadata build lokal yang sudah dirilis. Paket berikutnya harus memenuhi kontrak paket modern; kekurangan yang sama tersebut menggagalkan validasi rilis.

Gunakan profil Package Acceptance yang lebih luas ketika pertanyaan rilis berkaitan dengan paket aktual yang dapat diinstal:

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
- `package`: kontrak instalasi/pembaruan/mulai ulang/paket Plugin ditambah bukti instalasi Skills ClawHub langsung; ini adalah default pemeriksaan rilis
- `product`: `package` ditambah channel MCP, pembersihan cron/subagen, pencarian web OpenAI, dan OpenWebUI
- `full`: bagian jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` yang tepat untuk menjalankan ulang secara terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier` pada Package Acceptance. Alur kerja meneruskan tarball `package-under-test` yang telah ditentukan ke jalur Telegram; alur kerja Telegram mandiri tetap menerima spesifikasi npm yang telah dipublikasikan untuk pemeriksaan pascapublikasi.

## Otomatisasi publikasi rilis reguler

Untuk publikasi beta, `latest`, Plugin, GitHub Release, dan platform,
`OpenClaw Release Publish` adalah titik masuk mutasi normal. Jalur extended-stable khusus npm bulanan
`.33+` tidak menggunakan orkestrator ini. Alur kerja
reguler mengorkestrasi alur kerja penerbit tepercaya sesuai urutan yang
diperlukan rilis:

1. Checkout tag rilis dan tentukan SHA commit-nya.
2. Verifikasi bahwa tag dapat dijangkau dari `main` atau `release/*` (atau cabang alfa Tideclaw untuk prarilis alfa).
3. Jalankan `pnpm plugins:sync:check`.
4. Picu `Plugin NPM Release` dengan `publish_scope=all-publishable` dan `ref=<release-sha>`.
5. Picu `Plugin ClawHub Release` dengan cakupan dan SHA yang sama.
6. Picu `OpenClaw NPM Release` dengan tag rilis, dist-tag npm, dan `preflight_run_id` yang tersimpan setelah memverifikasi `full_release_validation_run_id` yang tersimpan dan upaya eksekusi yang tepat.
7. Untuk rilis stabil, buat atau perbarui rilis GitHub sebagai draf, picu `Windows Node Release` dengan `windows_node_tag` eksplisit dan `windows_node_installer_digests` yang disetujui sebagai kandidat, lalu verifikasi aset penginstal/checksum Windows kanonis. Picu juga `Android Release` untuk membangun APK bertanda tangan dari tag yang tepat beserta checksum dan provenans. Verifikasi kedua kontrak aset native sebelum memublikasikan draf.

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

Promosi stabil secara langsung ke `latest` bersifat eksplisit:

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

Gunakan alur kerja tingkat rendah `Plugin NPM Release` dan `Plugin ClawHub Release` hanya untuk pekerjaan perbaikan atau publikasi ulang yang terfokus. `OpenClaw Release Publish` menolak `plugin_publish_scope=selected` ketika `publish_openclaw_npm=true` agar paket inti tidak dapat dirilis tanpa setiap Plugin resmi yang dapat dipublikasikan, termasuk `@openclaw/diffs-language-pack`. Untuk perbaikan Plugin terpilih, tetapkan `publish_openclaw_npm=false` dengan `plugin_publish_scope=selected` dan `plugins=@openclaw/name`, atau picu alur kerja anak secara langsung.

Bootstrap ClawHub untuk publikasi pertama merupakan pengecualian: picu `Plugin ClawHub New`
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
serta hanya menerima target tepat yang dapat dijangkau dari `main` atau `release/*`.
Proses ini tidak memuat kredensial ClawHub, memublikasikan byte paket, atau mengubah konfigurasi
penerbit tepercaya. Alur kerja tetap menentukan rencana registry langsung,
melakukan checkout dan mengemas target hanya dalam job tanpa rahasia, mewujudkan
toolchain ClawHub yang dikunci, serta memvalidasi artefak kekal dan
slug/identitas paket sebelum tag rilis tersedia. Setujui
environment `clawhub-plugin-bootstrap` hanya setelah job pengemasan tanpa rahasia
selesai; job validasi terlindungi ini tidak memiliki kredensial atau perintah mutasi.

Uji coba yang disetujui atau bootstrap nyata setelah pemberian tag harus menyertakan
tag rilis yang tepat beserta id eksekusi, upaya, dan
cabang `OpenClaw Release Publish` induk. Induk mengatestasi SHA alur kerjanya sendiri dan SHA tepercaya
`main` terpisah yang tepat untuk `Plugin ClawHub New`; eksekusi anak dan setiap persetujuan
environment terlindungi harus cocok dengan SHA anak yang disetujui tersebut. Tag rilis
diperiksa ulang sebelum setiap upaya publikasi dan mutasi penerbit tepercaya.

Job pengemasan
mengunggah satu artefak kekal yang nama, ID/digest artefak Actions,
eksekusi/upaya produsen, SHA target, serta SHA-256/ukuran tarball per paketnya
diteruskan ke job validasi dan job terlindungi. Job terlindungi hanya melakukan checkout tooling `main`
tepercaya, memvalidasi tuple artefak melalui API GitHub, mengunduh
berdasarkan ID artefak yang tepat, menghitung ulang hash setiap tarball, serta memvalidasi jalur TAR lokal dan
identitas paket dengan aturan kanonisasi USTAR dari CLI yang disematkan. Setiap
kandidat kemudian melewati uji coba publikasi CLI yang disematkan, yang kembali sebelum
pencarian registry atau autentikasi. Prapenyaring job kredensial membatasi ClawPack terkompresi
hingga 120 MiB, total muatan file hingga 50 MiB, data TAR yang diekspansi hingga 64 MiB, dan
jumlah entri TAR hingga 10,000. Perbaikan penerbit tepercaya untuk paket yang sudah ada tetap
hanya-konfigurasi, tetapi proses tersebut tetap mengemas target dan mewajibkan tag yang diminta
beserta kesetaraan byte registry dan metadata yang tepat sebelum mengubah konfigurasi
penerbit tepercaya. Verifikasi pascapublikasi mengunduh artefak ClawHub dan
mewajibkan SHA-256 serta ukuran yang sama. Pemulihan dengan menjalankan ulang kegagalan dapat menggunakan kembali
artefak paket dari upaya sebelumnya hanya ketika job produsen yang tepat selesai
dengan sukses. Bukti akhir juga mengikat versi ClawHub yang dikunci, SHA-256
kunci, dan integritas npm. Ketidakcocokan memerlukan versi paket baru.

## Input alur kerja NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1`, atau `v2026.4.2-alpha.1`; ketika `preflight_only=true`, nilainya juga dapat berupa SHA commit cabang alur kerja saat ini sepanjang 40 karakter untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk jalur publikasi nyata
- `preflight_run_id`: id eksekusi preflight sukses yang sudah ada, wajib pada jalur publikasi nyata agar alur kerja menggunakan kembali tarball yang telah disiapkan alih-alih membangunnya ulang
- `full_release_validation_run_id`: id eksekusi `Full Release Validation` yang sukses untuk tag/SHA ini, wajib untuk publikasi nyata. Publikasi beta dapat dilanjutkan hanya dengan preflight disertai peringatan, tetapi promosi stabil/`latest` tetap memerlukannya.
- `full_release_validation_run_attempt`: upaya eksekusi positif yang tepat dan dipasangkan dengan `full_release_validation_run_id`; wajib setiap kali id eksekusi diberikan agar eksekusi ulang tidak dapat mengubah bukti otorisasi selama publikasi.
- `release_publish_run_id`: id eksekusi `OpenClaw Release Publish` yang disetujui; wajib ketika alur kerja ini dipicu oleh induk tersebut (pemanggilan publikasi nyata oleh aktor bot)
- `plugin_npm_run_id`: id eksekusi `Plugin NPM Release` exact-head yang sukses; wajib untuk publikasi inti `extended-stable` nyata
- `npm_dist_tag`: tag target npm untuk jalur publikasi; menerima `alpha`, `beta`, `latest`, atau `extended-stable` dan secara default menggunakan `beta`. Patch final `33` dan yang lebih baru harus menggunakan `extended-stable`; secara default, `extended-stable` menolak patch sebelumnya, dan selalu menolak tag nonfinal.
- `bypass_extended_stable_guard`: boolean khusus pengujian, default `false`; dengan `npm_dist_tag=extended-stable`, melewati kelayakan extended-stable bulanan sambil mempertahankan pemeriksaan identitas rilis, artefak, persetujuan, dan pembacaan balik.

`Plugin NPM Release` menerima `npm_dist_tag=default` untuk perilaku rilis
yang sudah ada atau `npm_dist_tag=extended-stable` untuk jalur bulanan yang dijaga. Opsi
extended-stable memerlukan `publish_scope=all-publishable`, input
`plugins` kosong, patch final pada atau di atas `33`, dan cabang kanonis
`extended-stable/YYYY.M.33` pada ujung tepatnya. Opsi ini tidak pernah memindahkan
`latest` atau `beta` Plugin. Versi paket baru menerima `extended-stable` secara atomik
melalui publikasi tepercaya OIDC (`npm publish --tag extended-stable`); alur kerja
sumber ini tidak menggunakan `npm dist-tag add` yang diautentikasi dengan token. Percobaan ulang
melewati versi tepat yang sudah tersedia di npm, lalu gagal secara tertutup kecuali
pembacaan balik lengkap mengonfirmasi bahwa setiap paket tepat dan tag `extended-stable` telah konvergen.

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah tersedia
- `preflight_run_id`: id eksekusi preflight `OpenClaw NPM Release` yang sukses; wajib ketika `publish_openclaw_npm=true` atau `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: id eksekusi `Full Release Validation` yang sukses; wajib ketika `publish_openclaw_npm=true` atau `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: upaya positif tepat yang dipasangkan dengan `full_release_validation_run_id`; wajib setiap kali id eksekusi diberikan
- `windows_node_tag`: tag rilis `openclaw/openclaw-windows-node` nonprarilis yang tepat; wajib untuk publikasi stabil OpenClaw
- `windows_node_installer_digests`: peta JSON ringkas yang disetujui sebagai kandidat dari nama penginstal Windows saat ini ke digest `sha256:` yang disematkan; wajib untuk publikasi stabil OpenClaw
- `npm_telegram_run_id`: id eksekusi `NPM Telegram Beta E2E` sukses opsional untuk disertakan dalam bukti rilis akhir
- `npm_dist_tag`: tag target npm untuk paket OpenClaw, salah satu dari `alpha`, `beta`, atau `latest`
- `plugin_publish_scope`: secara default menggunakan `all-publishable`; gunakan `selected` hanya untuk pekerjaan perbaikan khusus Plugin yang terfokus dengan `publish_openclaw_npm=false`
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma ketika `plugin_publish_scope=selected`
- `publish_openclaw_npm`: secara default menggunakan `true`; tetapkan `false` hanya ketika menggunakan alur kerja sebagai orkestrator perbaikan khusus Plugin
- `release_profile`: profil cakupan rilis yang digunakan untuk ringkasan bukti rilis; secara default menggunakan `from-validation`, yang membacanya dari manifes validasi, atau ganti dengan `beta`, `stable`, atau `full`
- `wait_for_clawhub`: secara default menggunakan `false` agar ketersediaan npm tidak diblokir oleh sidecar ClawHub; tetapkan `true` hanya ketika penyelesaian alur kerja harus mencakup penyelesaian ClawHub

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: branch, tag, atau SHA commit lengkap yang akan divalidasi. Pemeriksaan yang menggunakan rahasia mengharuskan commit yang dihasilkan dapat dijangkau dari branch OpenClaw atau tag rilis.
- `run_release_soak`: ikut serta dalam pengujian menyeluruh live/E2E, jalur rilis Docker, dan soak penyintas peningkatan all-since untuk pemeriksaan rilis beta. Opsi ini diaktifkan secara paksa oleh `release_profile=stable` dan `release_profile=full`.

Aturan:

- Versi final dan koreksi reguler di bawah patch `33` dapat dipublikasikan ke `beta` atau `latest`. Versi final pada patch `33` atau yang lebih tinggi harus dipublikasikan ke `extended-stable`, dan versi dengan sufiks koreksi pada batas tersebut ditolak.
- Tag prarilis beta hanya dapat dipublikasikan ke `beta`; tag prarilis alfa hanya dapat dipublikasikan ke `alpha`
- Untuk `OpenClaw NPM Release`, input SHA commit lengkap hanya diizinkan jika `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya untuk validasi
- Jalur publikasi sebenarnya harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama prapemeriksaan; alur kerja memverifikasi metadata tersebut sebelum publikasi dilanjutkan

## Urutan rilis beta reguler/stabil terbaru

Urutan lama ini ditujukan untuk rilis reguler yang diorkestrasi dan juga mencakup plugin, GitHub Release, Windows, serta pekerjaan platform lainnya. Ini bukan jalur stabil diperpanjang bulanan khusus npm `.33+` yang didokumentasikan di bagian atas halaman ini.

Saat membuat rilis stabil reguler yang diorkestrasi:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag tersedia, Anda dapat menggunakan SHA commit branch alur kerja lengkap saat ini untuk dry run khusus validasi pada alur kerja prapemeriksaan.
2. Pilih `npm_dist_tag=beta` untuk alur normal yang mendahulukan beta, atau `latest` hanya jika Anda memang sengaja ingin melakukan publikasi stabil secara langsung.
3. Jalankan `Full Release Validation` pada branch rilis, tag rilis, atau SHA commit lengkap jika Anda menginginkan CI normal beserta cakupan cache prompt live, Docker, QA Lab, Matrix, dan Telegram dari satu alur kerja manual. Jika Anda sengaja hanya membutuhkan grafik pengujian normal yang deterministik, jalankan alur kerja manual `CI` pada ref rilis sebagai gantinya.
4. Pilih tag rilis `openclaw/openclaw-windows-node` non-prarilis yang tepat, yang penginstal x64 dan ARM64 bertanda tangannya akan dirilis. Simpan sebagai `windows_node_tag`, lalu simpan peta digest tervalidasinya sebagai `windows_node_installer_digests`. Pembantu kandidat rilis mencatat keduanya dan menyertakannya dalam perintah publikasi yang dihasilkan.
5. Simpan `preflight_run_id`, `full_release_validation_run_id`, dan `full_release_validation_run_attempt` yang tepat dari proses yang berhasil.
6. Jalankan `OpenClaw Release Publish` dari `main` tepercaya dengan `tag` yang sama, `npm_dist_tag` yang sama, `windows_node_tag` yang dipilih, `windows_node_installer_digests` yang tersimpan, `preflight_run_id` yang tersimpan, `full_release_validation_run_id`, dan `full_release_validation_run_attempt`. Proses ini memublikasikan plugin yang dieksternalisasi ke npm dan ClawHub sebelum mempromosikan paket npm OpenClaw.
7. Jika rilis masuk ke `beta`, gunakan alur kerja `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`.
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta` harus segera mengikuti build stabil yang sama, gunakan alur kerja rilis yang sama untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi pemulihan mandiri terjadwalnya memindahkan `beta` nanti.

Mutasi dist-tag berada di repo buku besar rilis karena masih memerlukan `NPM_TOKEN`, sedangkan repo sumber tetap menggunakan publikasi khusus OIDC. Dengan demikian, jalur publikasi langsung dan jalur promosi yang mendahulukan beta tetap terdokumentasi serta terlihat oleh operator.

Jika pengelola harus kembali menggunakan autentikasi npm lokal, jalankan semua perintah CLI 1Password (`op`) hanya di dalam sesi tmux khusus. Jangan panggil `op` secara langsung dari shell agen utama; menjalankannya di dalam tmux membuat prompt, peringatan, dan penanganan OTP dapat diamati serta mencegah peringatan host berulang.

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

Pengelola menggunakan dokumentasi rilis privat di [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) sebagai panduan operasional sebenarnya.

## Terkait

- [Saluran rilis](/id/install/development-channels)
