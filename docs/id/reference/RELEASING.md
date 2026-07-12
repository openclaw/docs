---
read_when:
    - Mencari definisi kanal rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan siklus rilis
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan irama rilis
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-07-12T14:39:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw saat ini menyediakan tiga kanal pembaruan yang ditujukan bagi pengguna:

- stable: kanal rilis yang sudah dipromosikan, yang masih diresolusikan melalui npm `latest` hingga pencapaian CLI/kanal terpisah tersedia
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: posisi terbaru yang terus bergerak dari `main`

Secara terpisah, operator rilis dapat memublikasikan paket inti dari bulan terakhir yang telah selesai ke npm `extended-stable`, dimulai pada patch `33`. Jalur final reguler bulan berjalan tetap berlanjut di npm `latest`; pemisahan publikasi di sisi operator ini tidak dengan sendirinya mengubah resolusi kanal pembaruan CLI.

Build alfa Tideclaw merupakan jalur prarilis internal yang terpisah (dist-tag npm `alpha`), yang dibahas dalam [Input alur kerja NPM](#npm-workflow-inputs) dan [Kotak pengujian rilis](#release-test-boxes).

## Penamaan versi

- Versi rilis extended-stable npm bulanan: `YYYY.M.PATCH`, dengan `PATCH >= 33`, tag git `vYYYY.M.PATCH`
- Versi rilis final harian/reguler: `YYYY.M.PATCH`, dengan `PATCH < 33`, tag git `vYYYY.M.PATCH`
- Versi rilis koreksi fallback reguler: `YYYY.M.PATCH-N`, tag git `vYYYY.M.PATCH-N`
- Versi prarilis beta: `YYYY.M.PATCH-beta.N`, tag git `vYYYY.M.PATCH-beta.N`
- Versi prarilis alfa: `YYYY.M.PATCH-alpha.N`, tag git `vYYYY.M.PATCH-alpha.N`
- Jangan pernah menambahkan nol di depan angka bulan atau patch
- `PATCH` adalah nomor urut rangkaian rilis bulanan, bukan hari kalender. Rilis final reguler dan beta memajukan rangkaian saat ini; tag khusus alfa tidak pernah menggunakan atau memajukan nomor patch beta/reguler, jadi abaikan tag lama khusus alfa dengan nomor patch lebih tinggi saat memilih rangkaian beta atau reguler.
- Build alfa/nightly menggunakan rangkaian patch berikutnya yang belum dirilis dan hanya menaikkan `alpha.N` untuk build berulang. Setelah patch tersebut memiliki versi beta, build alfa baru berpindah ke patch berikutnya.
- Versi npm tidak dapat diubah: jangan pernah menghapus, memublikasikan ulang, atau menggunakan kembali tag yang telah dipublikasikan. Buat nomor prarilis berikutnya atau patch bulanan berikutnya.
- `latest` tetap mengikuti jalur npm reguler/harian saat ini; `beta` adalah target instalasi beta saat ini
- `extended-stable` berarti paket npm bulan sebelumnya yang didukung, dimulai pada patch `33`; patch `34` dan seterusnya merupakan rilis pemeliharaan pada jalur bulanan tersebut
- Rilis final reguler dan koreksi reguler secara default dipublikasikan ke npm `beta`; operator rilis dapat secara eksplisit menargetkan `latest`, atau mempromosikan build beta yang telah diperiksa kemudian
- Jalur extended-stable bulanan khusus memublikasikan paket npm inti dan setiap plugin resmi yang dapat dipublikasikan ke npm pada versi yang sama persis. Jalur ini tidak memublikasikan plugin ke ClawHub maupun memublikasikan artefak macOS atau Windows, GitHub Release, dist-tag repositori privat, image Docker, artefak seluler, atau unduhan situs web.
- Setiap rilis final reguler mengirimkan paket npm, aplikasi macOS, APK Android mandiri yang ditandatangani, dan penginstal Windows Hub yang ditandatangani secara bersamaan. Rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, sedangkan build/penandatanganan/notarisasi/promosi aplikasi native dikhususkan untuk rilis final reguler kecuali diminta secara eksplisit.

## Jadwal rilis

- Rilis bergerak dengan beta terlebih dahulu; stable menyusul hanya setelah beta terbaru divalidasi
- Pengelola biasanya membuat rilis dari cabang `release/YYYY.M.PATCH` yang dibuat dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak menghambat pengembangan baru di `main`
- Jika tag beta telah didorong atau dipublikasikan dan memerlukan perbaikan, pengelola membuat tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan hanya tersedia bagi pengelola

## Publikasi extended-stable bulanan khusus npm

Ini adalah pengecualian khusus dari prosedur rilis reguler di bawah. Untuk bulan yang telah selesai `YYYY.M`, buat `extended-stable/YYYY.M.33`; publikasikan `vYYYY.M.33` dan patch pemeliharaan berikutnya dari cabang yang sama. Tag rilis, ujung cabang, checkout, versi paket, pemeriksaan awal npm, dan proses Validasi Rilis Lengkap semuanya harus mengidentifikasi commit yang sama. `main` yang dilindungi harus sudah memuat versi final dari bulan kalender yang lebih baru secara ketat dengan patch di bawah `33`; patch pemeliharaan tetap memenuhi syarat setelah `main` maju lebih dari satu bulan.

Pada cabang extended-stable yang tepat, naikkan versi paket root menjadi `YYYY.M.P`, jalankan `pnpm release:prep`, dan verifikasi bahwa setiap paket ekstensi yang dapat dipublikasikan memiliki versi yang sama. Commit dan dorong semua perubahan yang dihasilkan, buat dan dorong tag permanen `vYYYY.M.P` pada commit tersebut, lalu catat SHA lengkap yang dihasilkan. Alur kerja menggunakan pohon yang telah disiapkan ini; alur kerja tidak menaikkan atau menyinkronkan versi untuk Anda.

Jalankan pemeriksaan awal npm dan Validasi Rilis Lengkap dari ujung cabang yang telah disiapkan tersebut, lalu simpan kedua ID proses dan percobaan proses Validasi Rilis Lengkap yang berhasil:

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

`release_profile=stable` adalah profil kedalaman validasi yang sudah ada; profil ini terpisah dari dist-tag npm `extended-stable` dan sengaja tidak diubah.

Setelah kedua proses berhasil, publikasikan setiap plugin resmi yang dapat dipublikasikan ke npm dari ujung cabang yang sama persis. Patch `P` harus bernilai `33` atau lebih besar. Teruskan SHA rilis lengkap sebagai `ref`, tunggu hingga seluruh matriks dan pembacaan balik registri selesai, lalu simpan ID proses Rilis NPM Plugin yang berhasil:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Alur kerja menggunakan inventaris paket `all-publishable` reguler yang telah disiapkan, termasuk paket yang sumbernya tidak berubah. Alur kerja memverifikasi setiap paket yang tepat dan setiap tag plugin `extended-stable` sebelum dinyatakan berhasil. Jika proses parsial gagal, jalankan ulang perintah yang sama: paket yang telah dipublikasikan akan digunakan kembali, tag plugin yang hilang atau kedaluwarsa akan direkonsiliasi dalam lingkungan rilis npm, dan pembacaan balik akhir tetap mencakup seluruh kumpulan paket.

Setelah alur kerja plugin berhasil dan lingkungan rilis npm siap, publikasikan tarball pemeriksaan awal inti yang tepat. Publikasi inti memverifikasi bahwa proses plugin yang dirujuk berstatus `completed/success` pada cabang kanonis dan SHA sumber yang sama persis:

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

Untuk fork atau simulasi nonproduksi yang sengaja tidak dapat memenuhi kebijakan bulanan `.33` atau kebijakan bulan pada `main` yang dilindungi, tambahkan `-f bypass_extended_stable_guard=true` ke dispatch pemeriksaan awal dan publikasi npm. Nilai default-nya adalah `false`. Bypass hanya diterima dengan `npm_dist_tag=extended-stable` dan dicatat dalam ringkasan alur kerja. Bypass ini tidak melewati ref alur kerja kanonis `extended-stable/YYYY.M.33`, kesetaraan ujung cabang/tag/checkout, sintaks tag final, kesetaraan versi paket/tag, identitas proses dan manifes yang dirujuk, asal tarball, persetujuan lingkungan, pembacaan balik registri, atau bukti perbaikan selektor.

Alur kerja publikasi memverifikasi identitas pemeriksaan awal, validasi, dan proses plugin yang dirujuk, digest tarball yang telah disiapkan, serta selektor registri inti. Konfirmasikan hasil secara terpisah setelah alur kerja berhasil:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Kedua perintah harus mengembalikan `YYYY.M.P`. Jika publikasi berhasil tetapi pembacaan balik selektor gagal, jangan memublikasikan ulang versi paket yang permanen. Gunakan satu perintah perbaikan `npm dist-tag add openclaw@YYYY.M.P extended-stable` yang dicetak dalam ringkasan yang selalu dijalankan dari alur kerja yang gagal, lalu ulangi kedua pembacaan balik independen. Pengembalian ke selektor sebelumnya merupakan keputusan operator yang terpisah, bukan jalur perbaikan pembacaan balik.

Dokumentasi dukungan publik pada awalnya menetapkan Slack, Discord, dan Codex sebagai permukaan plugin extended-stable yang tercakup. Daftar tersebut merupakan pernyataan dukungan, bukan daftar izin kode rilis: setiap plugin resmi yang dapat dipublikasikan ke npm mengikuti jalur publikasi versi yang sama persis.

Daftar periksa reguler di bawah tetap mencakup publikasi beta, `latest`, GitHub Release, plugin, macOS, Windows, dan platform lainnya. Jangan jalankan langkah-langkah tersebut untuk jalur extended-stable khusus npm ini.

## Daftar periksa operator rilis reguler

Daftar periksa ini merupakan bentuk publik dari alur rilis. Kredensial privat, penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada dalam panduan pelaksanaan rilis khusus pengelola.

1. Mulai dari `main` terkini: tarik perubahan terbaru, konfirmasikan bahwa commit target telah didorong, dan konfirmasikan bahwa CI `main` cukup hijau untuk dijadikan dasar cabang.
2. Hasilkan bagian teratas `CHANGELOG.md` dari PR yang telah digabungkan dan semua commit langsung sejak tag rilis terakhir yang dapat dijangkau. Pastikan entri berorientasi kepada pengguna, hapus duplikasi antara entri PR dan commit langsung yang tumpang tindih, lakukan commit, dorong, lalu lakukan rebase/tarik sekali lagi sebelum membuat cabang. Ketika tag terkirim yang menyimpang atau forward-port berikutnya mengaitkan kembali PR yang sudah dirilis, teruskan tag tersebut secara eksplisit sebagai `--shipped-ref`; pemverifikasi menggunakan baris PR eksplisit dari catatan kontribusi lengkap dalam bagian bernomor pada snapshot tag, mengabaikan `Unreleased`, serta mencatat inventaris dan jumlah persis PR yang dikecualikan.
3. Tinjau catatan kompatibilitas rilis di `src/plugins/compat/registry.ts` dan `src/commands/doctor/shared/deprecation-compat.ts`. Hapus kompatibilitas yang kedaluwarsa hanya jika jalur peningkatan tetap tercakup, atau catat alasan kompatibilitas tersebut sengaja dipertahankan.
4. Buat `release/YYYY.M.PATCH` dari `main` terkini. Jangan lakukan pekerjaan rilis normal secara langsung di `main`.
5. Naikkan setiap lokasi versi yang diwajibkan untuk tag tersebut, lalu jalankan `pnpm release:prep`. Perintah ini memperbarui secara berurutan versi plugin, shrinkwrap npm, inventaris plugin, skema konfigurasi dasar, metadata konfigurasi kanal bawaan, baseline dokumentasi konfigurasi, ekspor SDK plugin, dan baseline API SDK plugin. Commit setiap penyimpangan yang dihasilkan sebelum membuat tag, lalu jalankan prapemeriksaan lokal deterministik: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build`, dan `pnpm release:check`.
6. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag tersedia, SHA cabang rilis lengkap sepanjang 40 karakter diizinkan untuk prapemeriksaan khusus validasi. Prapemeriksaan menghasilkan bukti rilis dependensi untuk grafik dependensi persis yang sedang diperiksa dan menyimpannya dalam artefak prapemeriksaan npm. Simpan `preflight_run_id` yang berhasil.
7. Mulai semua pengujian prarilis dengan `Full Release Validation` untuk cabang rilis, tag, atau SHA commit lengkap. Ini merupakan satu-satunya titik masuk manual untuk empat kotak pengujian rilis besar: Vitest, Docker, QA Lab, dan Package. Simpan `full_release_validation_run_id` dan `full_release_validation_run_attempt` yang persis; keduanya merupakan input wajib untuk `OpenClaw NPM Release` dan `OpenClaw Release Publish`.
8. Jika validasi gagal, perbaiki di cabang rilis dan jalankan kembali file, jalur, pekerjaan alur kerja, profil paket, penyedia, atau daftar izin model gagal terkecil yang membuktikan perbaikan. Jalankan kembali keseluruhan payung validasi hanya jika permukaan yang diubah membuat bukti sebelumnya kedaluwarsa.
9. Untuk kandidat beta bertag, jalankan `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` dari cabang `release/YYYY.M.PATCH` yang sesuai. Untuk stabil, teruskan juga rilis sumber Windows yang diwajibkan: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. Pembantu menggunakan `main` tepercaya sebagai sumber alur kerja sementara setiap alur kerja menargetkan tag yang persis. Pembantu membuat titik pemeriksaan identitas kandidat/peralatan yang tidak dapat diubah dan ID eksekusi yang dikirim di `.artifacts/release-candidate/<tag>/release-candidate-state.json`; menjalankan kembali perintah yang sama akan melanjutkan eksekusi persis tersebut, sedangkan setiap penyimpangan kandidat, peralatan, profil, atau opsi akan gagal secara tertutup. Sebelum mengirim matriks validasi lengkap, pembantu merender secara deterministik isi rilis GitHub untuk tag yang persis dan menolak judul versi yang hilang, isi yang melampaui batas dan tidak dapat menggunakan bentuk ringkas kanonis, atau asal-usul dasar/target catatan kontribusi yang tidak dapat dijangkau dari tag. Pembantu juga memvalidasi setiap metadata pengecualian baseline terkirim eksplisit terhadap catatan tag kumulatif yang dirujuk. Kemudian pembantu menjalankan pemeriksaan rilis yang dihasilkan secara lokal, mengirim atau memverifikasi validasi rilis lengkap dan bukti prapemeriksaan npm, menjalankan bukti pemasangan baru/pembaruan Parallels terhadap tarball yang disiapkan secara persis beserta bukti paket Telegram, mencatat rencana npm plugin dan ClawHub, serta mencetak perintah `OpenClaw Release Publish` yang persis hanya setelah bundel bukti berstatus hijau.

   `OpenClaw Release Publish` mengirim paket plugin yang dipilih atau seluruh paket yang dapat dipublikasikan ke npm dan kumpulan yang sama ke ClawHub secara paralel, lalu mempromosikan artefak prapemeriksaan npm OpenClaw yang telah disiapkan dengan dist-tag yang sesuai setelah publikasi npm plugin berhasil. Checkout rilis tetap menjadi akar produk/data, sedangkan perencanaan dan verifikasi akhir dijalankan dari checkout sumber alur kerja tepercaya yang persis agar commit rilis lama tidak dapat secara diam-diam menggunakan peralatan rilis usang. Sebelum proses publikasi turunan dimulai, perintah ini merender dan menyimpan dalam cache isi rilis GitHub yang persis. Ketika bagian `CHANGELOG.md` lengkap yang sesuai muat dalam batas 125.000 karakter GitHub dan batas aman 125.000 byte yang sesuai milik perender, halaman memuat bagian `## YYYY.M.PATCH` tersebut secara persis, termasuk judulnya. Ketika bagian sumber tidak muat, halaman mempertahankan catatan editorial berkelompok yang persis dan mengganti catatan kontribusi yang terlalu besar dengan tautan stabil ke catatan lengkap dalam `CHANGELOG.md` yang dipatok ke tag; catatan parsial dan butir yang terpotong tidak pernah dipublikasikan. Alur kerja memilih isi lengkap atau ringkas tersebut sebelum menambahkan `### Verifikasi rilis`; jika bagian akhir bukti akan melampaui batas, alur kerja mempertahankan isi kanonis dan mengandalkan bukti terlampir yang tidak dapat diubah. Rilis stabil yang dipublikasikan ke npm `latest` menjadi rilis terbaru GitHub, sedangkan rilis pemeliharaan stabil yang tetap menggunakan npm `beta` dibuat dengan GitHub `latest=false`. Alur kerja juga mengunggah bukti dependensi prapemeriksaan, manifes validasi lengkap, dan bukti verifikasi registri pascapublikasi ke rilis GitHub untuk penanganan insiden pascarilis. Alur kerja segera mencetak ID eksekusi turunan, menyetujui otomatis gerbang lingkungan rilis yang diizinkan untuk disetujui oleh token alur kerja, meringkas pekerjaan turunan yang gagal beserta bagian akhir log, membuat halaman rilis GitHub draf sejak awal dan mempromosikan aset Windows serta Android secara bersamaan dengan publikasi npm OpenClaw, menyelesaikan halaman rilis dan bukti dependensi setelah tahap-tahap tersebut berhasil, menunggu ClawHub setiap kali npm OpenClaw sedang dipublikasikan, lalu menjalankan pemverifikasi beta dari main tepercaya dan mengunggah bukti pascapublikasi untuk rilis GitHub, paket npm, paket npm plugin yang dipilih, paket ClawHub yang dipilih, ID eksekusi alur kerja turunan, dan ID eksekusi NPM Telegram opsional. Pemverifikasi bootstrap ClawHub mewajibkan jalur dan SHA alur kerja main tepercaya yang persis, percobaan eksekusi produsen dan terminal, SHA rilis, kumpulan paket yang diminta, tuple artefak paket yang tidak dapat diubah, serta artefak pembacaan balik registri terminal; eksekusi referensi rilis lama yang berhasil tidak diterima.

   Kemudian jalankan penerimaan paket pascapublikasi terhadap paket `openclaw@YYYY.M.PATCH-beta.N` atau `openclaw@beta` yang telah dipublikasikan. Jika prarilis yang telah didorong atau dipublikasikan memerlukan perbaikan, buat nomor prarilis berikutnya yang sesuai; jangan pernah menghapus atau menulis ulang nomor lama.

10. Untuk stabil, lanjutkan hanya setelah kandidat beta atau kandidat rilis yang telah diperiksa memiliki bukti validasi yang diwajibkan. Publikasi npm stabil juga dilakukan melalui `OpenClaw Release Publish`, dengan menggunakan kembali artefak prapemeriksaan yang berhasil melalui `preflight_run_id`. Kesiapan rilis macOS stabil juga mewajibkan `.zip`, `.dmg`, `.dSYM.zip` yang telah dipaketkan, dan `appcast.xml` yang diperbarui di `main`; alur kerja publikasi macOS secara otomatis memublikasikan appcast bertanda tangan ke `main` publik setelah aset rilis terverifikasi, atau membuka/memperbarui PR appcast jika perlindungan cabang memblokir dorongan langsung. Kesiapan Windows Hub stabil mewajibkan aset `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe`, dan `OpenClawCompanion-SHA256SUMS.txt` yang telah ditandatangani pada rilis GitHub OpenClaw. Teruskan tag rilis `openclaw/openclaw-windows-node` bertanda tangan yang persis sebagai `windows_node_tag` dan peta digest penginstalnya yang disetujui kandidat sebagai `windows_node_installer_digests`; `OpenClaw Release Publish` mempertahankan draf rilis, mengirim `Windows Node Release`, dan memverifikasi ketiga aset sebelum publikasi.
11. Setelah publikasi, jalankan pemverifikasi pascapublikasi npm, E2E Telegram npm-terpublikasi mandiri opsional ketika Anda memerlukan bukti kanal pascapublikasi, promosi dist-tag jika diperlukan, verifikasi halaman rilis GitHub yang dihasilkan, jalankan langkah pengumuman rilis, lalu selesaikan [Penutupan main stabil](#stable-main-closeout) sebelum menyatakan rilis stabil selesai.

## Penutupan main stabil

Publikasi stabil belum selesai sampai `main` memuat keadaan rilis terkirim yang sebenarnya.

1. Mulai dari `main` terbaru yang baru ditarik. Audit `release/YYYY.M.PATCH` terhadapnya dan lakukan forward-port untuk perbaikan nyata yang belum ada di `main`. Jangan menggabungkan secara membabi buta adaptor kompatibilitas, pengujian, atau validasi khusus rilis ke `main` yang lebih baru.
2. Atur `main` ke versi stabil terkirim, bukan rangkaian berikutnya yang masih spekulatif. Jalankan `pnpm release:prep` setelah perubahan versi akar, lalu `pnpm deps:shrinkwrap:generate`.
3. Buat bagian `## YYYY.M.PATCH` pada `CHANGELOG.md` di `main` sama persis dengan cabang rilis bertag. Sertakan pembaruan `appcast.xml` stabil ketika rilis Mac memublikasikannya.
4. Jangan tambahkan `YYYY.M.PATCH+1`, versi beta, atau bagian catatan perubahan masa depan yang kosong ke `main` sampai operator secara eksplisit memulai rangkaian rilis tersebut.
5. Jalankan `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, dan `OPENCLAW_TESTBOX=1 pnpm check:changed`. Dorong, lalu verifikasi bahwa `origin/main` memuat versi terkirim dan catatan perubahan sebelum menyatakan rilis stabil selesai.
6. Selalu perbarui variabel repositori `RELEASE_ROLLBACK_DRILL_ID` dan `RELEASE_ROLLBACK_DRILL_DATE` setelah setiap latihan rollback privat.

`OpenClaw Stable Main Closeout` dimulai dari dorongan `main` yang memuat versi terkirim, catatan perubahan, dan appcast setelah publikasi stabil. Proses ini membaca bukti pascapublikasi yang tidak dapat diubah untuk mengikat tag terkirim ke eksekusi Full Release Validation dan Publish, lalu memverifikasi keadaan main stabil, rilis, masa pemantauan stabil wajib, dan bukti performa yang memblokir. Proses ini melampirkan manifes penutupan yang tidak dapat diubah beserta checksum ke rilis GitHub. Pemicu dorongan otomatis melewati rilis lama yang mendahului bukti pascapublikasi yang tidak dapat diubah dan tidak pernah menganggap pelewatan tersebut sebagai penutupan yang selesai.

Penutupan lengkap mewajibkan kedua aset dan checksum yang sesuai. Manifes parsial menjalankan ulang SHA `main` dan latihan rollback yang tercatat untuk menghasilkan kembali byte yang identik, lalu melampirkan checksum yang hilang; pasangan yang tidak valid, atau checksum tanpa manifes, tetap memblokir. Eksekusi yang dipicu oleh dorongan tanpa variabel repositori latihan rollback akan dilewati tanpa menyelesaikan penutupan; catatan latihan yang hilang atau berusia lebih dari 90 hari tetap memblokir penutupan manual berbasis bukti. Perintah pemulihan privat tetap berada dalam panduan operasional khusus pengelola. Gunakan pengiriman manual hanya untuk memperbaiki atau menjalankan ulang penutupan stabil berbasis bukti.

Tag koreksi fallback lama dapat menggunakan kembali bukti paket dasar hanya ketika tag koreksi tersebut merujuk ke commit sumber yang sama dengan tag stabil dasar. Rilis Android-nya menggunakan kembali APK terverifikasi milik tag dasar dan menambahkan asal-usul untuk tag koreksi. Koreksi dengan sumber berbeda harus memublikasikan dan memverifikasi bukti paketnya sendiri serta menggunakan `versionCode` Android yang lebih tinggi.

## Prapemeriksaan rilis

- Jalankan `pnpm check:test-types` sebelum pemeriksaan awal rilis agar TypeScript pengujian tetap tercakup di luar gerbang lokal `pnpm check` yang lebih cepat.
- Jalankan `pnpm check:architecture` sebelum pemeriksaan awal rilis agar pemeriksaan siklus impor dan batas arsitektur yang lebih luas berhasil di luar gerbang lokal yang lebih cepat.
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis `dist/*` yang diharapkan dan bundel UI Kontrol tersedia untuk langkah validasi paket.
- Jalankan `pnpm release:prep` setelah menaikkan versi root dan sebelum membuat tag. Perintah ini menjalankan setiap generator rilis deterministik yang biasanya mengalami penyimpangan setelah perubahan versi/konfigurasi/API: versi plugin, shrinkwrap npm, inventaris plugin, skema konfigurasi dasar, metadata konfigurasi kanal yang dibundel, garis dasar dokumentasi konfigurasi, ekspor SDK plugin, dan garis dasar API SDK plugin. `pnpm release:check` menjalankan ulang pemeriksaan tersebut dalam mode pemeriksaan (ditambah pemeriksaan batas permukaan SDK plugin) dan melaporkan setiap kegagalan penyimpangan hasil generasi dalam satu kali proses sebelum menjalankan pemeriksaan rilis paket.
- Sinkronisasi versi plugin secara default memperbarui paket runtime `@openclaw/ai` yang dapat dipublikasikan, versi paket plugin resmi, dan batas bawah `openclaw.compat.pluginApi` yang ada ke versi rilis OpenClaw. Perlakukan bidang tersebut sebagai batas bawah API SDK/runtime plugin, bukan sekadar salinan versi paket: untuk rilis khusus plugin yang sengaja tetap kompatibel dengan host OpenClaw lama, pertahankan batas bawah pada API host tertua yang didukung dan dokumentasikan pilihan tersebut dalam bukti rilis plugin.
- Jalankan alur kerja manual `Full Release Validation` sebelum persetujuan rilis untuk memulai semua kotak pengujian prarilis dari satu titik masuk. Alur kerja ini menerima cabang, tag, atau SHA commit lengkap, memicu `CI` manual, serta memicu `OpenClaw Release Checks` untuk pemeriksaan singkat instalasi, penerimaan paket, pemeriksaan paket lintas OS, kesetaraan Lab QA, Matrix, dan jalur Telegram. Proses stabil dan lengkap selalu menyertakan pengujian live/E2E menyeluruh serta pengujian ketahanan jalur rilis Docker; `run_release_soak=true` dipertahankan untuk pengujian ketahanan beta secara eksplisit. Penerimaan Paket menyediakan E2E Telegram paket kanonis selama validasi kandidat, sehingga tidak memerlukan pemantau polling live kedua yang berjalan bersamaan.

  Berikan `release_package_spec` setelah memublikasikan versi beta untuk menggunakan kembali paket npm yang telah dirilis di seluruh pemeriksaan rilis, Penerimaan Paket, dan E2E Telegram paket tanpa membangun ulang tarball rilis. Berikan `npm_telegram_package_spec` hanya ketika Telegram harus menggunakan paket terpublikasi yang berbeda dari bagian validasi rilis lainnya. Berikan `package_acceptance_package_spec` ketika Penerimaan Paket harus menggunakan paket terpublikasi yang berbeda dari spesifikasi paket rilis. Berikan `evidence_package_spec` ketika laporan bukti rilis harus membuktikan bahwa validasi cocok dengan paket npm terpublikasi tanpa memaksa E2E Telegram.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Jalankan alur kerja manual `Package Acceptance` ketika Anda menginginkan bukti melalui jalur samping untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk `openclaw@beta`, `openclaw@latest`, atau versi rilis yang tepat; `source=ref` untuk mengemas cabang/tag/SHA `package_ref` tepercaya dengan harness `workflow_ref` saat ini; `source=url` untuk tarball HTTPS publik dengan SHA-256 wajib dan kebijakan URL publik yang ketat; `source=trusted-url` untuk kebijakan sumber tepercaya bernama yang menggunakan `trusted_source_id` dan SHA-256 wajib; atau `source=artifact` untuk tarball yang diunggah oleh proses GitHub Actions lain.

  Alur kerja ini menetapkan kandidat sebagai `package-under-test`, menggunakan kembali penjadwal rilis E2E Docker terhadap tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika jalur Docker yang dipilih menyertakan `published-upgrade-survivor`, artefak paket menjadi kandidat dan `published_upgrade_survivor_baseline` memilih garis dasar terpublikasi. `update-restart-auth` menggunakan paket kandidat sebagai CLI yang terinstal sekaligus paket yang diuji agar menjalankan jalur mulai ulang terkelola milik perintah pembaruan kandidat.

  Contoh:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Profil umum:
  - `smoke`: jalur instalasi/kanal/agen, jaringan gateway, dan pemuatan ulang konfigurasi
  - `package`: jalur paket/pembaruan/mulai ulang/plugin berbasis artefak tanpa OpenWebUI atau ClawHub live
  - `product`: profil paket ditambah kanal MCP, pembersihan cron/subagen, pencarian web OpenAI, dan OpenWebUI
  - `full`: bagian jalur rilis Docker dengan OpenWebUI
  - `custom`: pemilihan `docker_lanes` yang tepat untuk menjalankan ulang secara terfokus

- Jalankan alur kerja manual `CI` secara langsung ketika Anda hanya memerlukan cakupan CI normal yang deterministik untuk kandidat rilis. Pemicu CI manual mengabaikan pembatasan berdasarkan perubahan dan memaksa shard Node Linux, shard plugin yang dibundel, shard kontrak plugin dan kanal, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan singkat artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, dan jalur i18n UI Kontrol. Proses CI manual mandiri menjalankan Android hanya ketika dipicu dengan `include_android=true`; `Full Release Validation` meneruskan masukan tersebut kepada proses CI turunannya.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Jalankan `pnpm qa:otel:smoke` saat memvalidasi telemetri rilis. Perintah ini menjalankan Lab QA melalui penerima OTLP/HTTP lokal dan memverifikasi ekspor jejak, metrik, dan log serta atribut jejak yang dibatasi dan penyamaran konten/pengidentifikasi tanpa memerlukan Opik, Langfuse, atau pengumpul eksternal lainnya.
- Jalankan `pnpm qa:otel:collector-smoke` saat memvalidasi kompatibilitas pengumpul. Perintah ini merutekan ekspor OTLP Lab QA yang sama melalui kontainer Docker OpenTelemetry Collector nyata sebelum menjalankan pemeriksaan penerima lokal.
- Jalankan `pnpm qa:prometheus:smoke` saat memvalidasi pengambilan data Prometheus yang dilindungi. Perintah ini menjalankan Lab QA, menolak pengambilan data tanpa autentikasi, dan memverifikasi bahwa keluarga metrik yang sangat penting bagi rilis tetap bebas dari konten prompt, pengidentifikasi mentah, token autentikasi, dan jalur lokal.
- Jalankan `pnpm qa:observability:smoke` untuk menjalankan jalur pemeriksaan singkat OpenTelemetry dan Prometheus dari checkout sumber secara berurutan.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag.
- Pemeriksaan awal `OpenClaw NPM Release` menghasilkan bukti rilis dependensi sebelum mengemas tarball npm. Gerbang kerentanan advisori npm memblokir rilis jika gagal. Risiko manifes transitif, permukaan kepemilikan/instalasi dependensi, dan laporan perubahan dependensi hanya merupakan bukti rilis. Laporan perubahan dependensi membandingkan kandidat rilis dengan tag rilis sebelumnya yang dapat dijangkau. Pemeriksaan awal mengunggah bukti dependensi sebagai `openclaw-release-dependency-evidence-<tag>` dan juga menyematkannya di bawah `dependency-evidence/` dalam artefak pemeriksaan awal npm yang telah disiapkan. Jalur publikasi sebenarnya menggunakan kembali artefak pemeriksaan awal tersebut, lalu melampirkan bukti yang sama ke rilis GitHub sebagai `openclaw-<version>-dependency-evidence.zip`.
- Jalankan `OpenClaw Release Publish` untuk urutan publikasi yang mengubah keadaan setelah tag tersedia. Picu publikasi beta dan stabil biasa dari `main` tepercaya; tag rilis tetap memilih commit target yang tepat dan dapat menunjuk ke `release/YYYY.M.PATCH`. Publikasi alfa Tideclaw tetap berada di cabang alfa yang sesuai. Teruskan `preflight_run_id` npm OpenClaw yang berhasil, `full_release_validation_run_id` yang berhasil, dan `full_release_validation_run_attempt` yang tepat, serta pertahankan cakupan publikasi plugin bawaan `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Alur kerja menserialkan publikasi npm plugin, publikasi ClawHub plugin, dan publikasi npm OpenClaw agar paket inti tidak dipublikasikan sebelum plugin yang dieksternalisasi; promosi Windows dan Android berjalan bersamaan dengan publikasi npm inti terhadap halaman draf rilis. Proses ulang publikasi dapat dilanjutkan: versi npm inti yang sudah dipublikasikan akan melewati pemicu inti setelah alur kerja membuktikan bahwa tarball registri cocok dengan artefak pemeriksaan awal milik tag, dan promosi Windows/Android dilewati ketika rilis sudah memiliki kontrak aset yang terverifikasi, sehingga percobaan ulang hanya mengulangi tahap yang gagal. Perbaikan terfokus khusus plugin memerlukan `plugin_publish_scope=selected` dan daftar plugin yang tidak kosong. Proses khusus plugin dengan `all-publishable` memerlukan bukti pemeriksaan awal lengkap yang tidak dapat diubah dan bukti Validasi Rilis Lengkap; bukti parsial ditolak.
- `OpenClaw Release Publish` stabil memerlukan `windows_node_tag` yang tepat setelah tersedia rilis non-prarilis `openclaw/openclaw-windows-node` yang sesuai, beserta peta `windows_node_installer_digests` yang disetujui untuk kandidat. Sebelum memicu turunan publikasi apa pun, alur kerja memverifikasi bahwa rilis sumber tersebut telah dipublikasikan, bukan prarilis, berisi penginstal x64/ARM64 yang diwajibkan, dan masih cocok dengan peta yang disetujui tersebut. Kemudian alur kerja memicu `Windows Node Release` selagi rilis OpenClaw masih berupa draf, dengan meneruskan peta digest penginstal yang disematkan tanpa perubahan. Alur kerja turunan mengunduh penginstal Windows Hub yang telah ditandatangani dari tag tersebut secara tepat, mencocokkannya dengan digest yang disematkan, memverifikasi bahwa tanda tangan Authenticode-nya menggunakan penanda tangan OpenClaw Foundation yang diharapkan pada runner Windows, menulis manifes SHA-256, dan mengunggah penginstal beserta manifes ke rilis GitHub OpenClaw kanonis, lalu mengunduh ulang aset yang dipromosikan dan memverifikasi keanggotaan serta hash manifes. Alur kerja induk memverifikasi kontrak aset x64, ARM64, dan checksum saat ini sebelum publikasi. Pemulihan langsung menolak nama aset `OpenClawCompanion-*` yang tidak diharapkan sebelum mengganti aset kontrak yang diharapkan dengan byte sumber yang disematkan.

  Picu `Windows Node Release` secara manual hanya untuk pemulihan, dan selalu teruskan tag yang tepat, jangan pernah `latest`, beserta peta JSON `expected_installer_digests` eksplisit dari rilis sumber yang disetujui. Tautan unduhan situs web harus mengarah ke URL aset rilis OpenClaw yang tepat untuk rilis stabil saat ini, atau `releases/latest/download/...` hanya setelah memverifikasi bahwa pengalihan terbaru GitHub mengarah ke rilis yang sama; jangan hanya menautkan ke halaman rilis repositori pendamping.

- Pemeriksaan rilis kini berjalan dalam alur kerja manual terpisah: `OpenClaw Release Checks`. Alur ini juga menjalankan jalur paritas mock QA Lab serta profil Matrix live cepat dan jalur QA Telegram sebelum persetujuan rilis. Jalur live menggunakan lingkungan `qa-live-shared`; Telegram juga menggunakan penyewaan kredensial CI Convex. Jalankan alur kerja manual `QA-Lab - All Lanes` dengan `matrix_profile=all` dan `matrix_shards=true` ketika Anda ingin menjalankan inventaris lengkap transportasi, media, dan E2EE Matrix secara paralel.
- Validasi runtime instalasi dan peningkatan lintas-OS merupakan bagian dari `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil alur kerja yang dapat digunakan kembali `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung. Pemisahan ini disengaja: menjaga jalur rilis npm yang sebenarnya tetap singkat, deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di jalurnya sendiri agar tidak menunda atau memblokir publikasi.
- Pemeriksaan rilis yang memuat rahasia harus dipicu melalui `Full Release Validation` atau dari referensi alur kerja `main`/rilis agar logika alur kerja dan rahasia tetap terkendali.
- `OpenClaw Release Checks` menerima cabang, tag, atau SHA commit lengkap selama commit yang dihasilkan dapat dijangkau dari cabang OpenClaw atau tag rilis.
- Pra-pemeriksaan khusus validasi `OpenClaw NPM Release` juga menerima SHA commit lengkap 40 karakter dari cabang alur kerja saat ini tanpa memerlukan tag yang telah didorong. Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi sebenarnya. Dalam mode SHA, alur kerja menyintesis `v<package.json version>` hanya untuk pemeriksaan metadata paket; publikasi sebenarnya tetap memerlukan tag rilis yang nyata.
- Kedua alur kerja mempertahankan jalur publikasi dan promosi sebenarnya pada runner yang dihosting GitHub, sedangkan jalur validasi yang tidak melakukan mutasi dapat menggunakan runner Linux Blacksmith yang lebih besar.
- Alur kerja tersebut menjalankan `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` menggunakan rahasia alur kerja `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`.
- Pra-pemeriksaan rilis npm tidak lagi menunggu jalur pemeriksaan rilis yang terpisah.
- Sebelum menandai kandidat rilis secara lokal, jalankan `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Pembantu tersebut menjalankan pembatas pengaman rilis cepat, pemeriksaan rilis npm/ClawHub Plugin, build, build UI, dan `release:openclaw:npm:check` dalam urutan yang mendeteksi kesalahan umum yang memblokir persetujuan sebelum alur kerja publikasi GitHub dimulai.
- Jalankan `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (atau tag prarilis/koreksi yang sesuai) sebelum persetujuan.
- Setelah publikasi npm, jalankan `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi registri yang telah dipublikasikan dalam prefiks sementara yang baru.
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` untuk memverifikasi orientasi paket terinstal, penyiapan Telegram, dan E2E Telegram nyata terhadap paket npm yang dipublikasikan menggunakan kumpulan kredensial Telegram sewaan bersama. Untuk proses satu kali lokal, pengelola dapat menghilangkan variabel Convex dan meneruskan tiga kredensial lingkungan `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pascapublikasi lengkap dari mesin pengelola, gunakan `pnpm release:beta-smoke -- --beta betaN`. Pembantu tersebut menjalankan validasi pembaruan npm Parallels/target baru, memicu `NPM Telegram Beta E2E`, memantau proses alur kerja yang tepat, mengunduh artefak, dan mencetak laporan Telegram.
- Pengelola dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui alur kerja manual `NPM Telegram Beta E2E`. Alur ini sengaja hanya bersifat manual dan tidak berjalan pada setiap penggabungan.
- Otomatisasi rilis pengelola menggunakan pra-pemeriksaan-lalu-promosi:
  - Publikasi npm sebenarnya harus lulus `preflight_run_id` npm yang berhasil.
  - Orkestrasi dan pra-pemeriksaan publikasi beta reguler serta stabil menggunakan `main` tepercaya terhadap tag target yang tepat. Publikasi dan pra-pemeriksaan alfa Tideclaw menggunakan cabang alfa yang sesuai.
  - Rilis npm stabil menggunakan `beta` secara default; publikasi npm stabil dapat menargetkan `latest` secara eksplisit melalui masukan alur kerja.
  - Mutasi dist-tag npm berbasis token berada di `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` karena `npm dist-tag add` masih memerlukan `NPM_TOKEN`, sementara repositori sumber mempertahankan publikasi khusus OIDC.
  - `macOS Release` publik hanya untuk validasi; ketika sebuah tag hanya berada pada cabang rilis tetapi alur kerja dipicu dari `main`, tetapkan `public_release_branch=release/YYYY.M.PATCH`.
  - Publikasi macOS sebenarnya harus lulus `preflight_run_id` dan `validate_run_id` macOS yang berhasil.
  - Jalur publikasi sebenarnya mempromosikan artefak yang telah disiapkan alih-alih membangunnya kembali.
- Untuk rilis koreksi stabil seperti `YYYY.M.PATCH-N`, pemverifikasi pascapublikasi juga memeriksa jalur peningkatan prefiks sementara yang sama dari `YYYY.M.PATCH` ke `YYYY.M.PATCH-N` agar koreksi rilis tidak secara diam-diam membiarkan instalasi global lama tetap menggunakan payload stabil dasar.
- Pra-pemeriksaan rilis npm gagal secara tertutup kecuali tarball menyertakan `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong, agar kita tidak kembali mengirim dasbor peramban kosong.
- Verifikasi pascapublikasi juga memeriksa bahwa titik masuk Plugin yang dipublikasikan dan metadata paket tersedia dalam tata letak registri yang terinstal. Rilis yang dikirim tanpa payload runtime Plugin akan gagal pada pemverifikasi pascapublikasi dan tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga memberlakukan anggaran `unpackedSize` paket npm pada tarball pembaruan kandidat, sehingga E2E penginstal mendeteksi pembengkakan paket yang tidak disengaja sebelum jalur publikasi rilis.
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes waktu ekstensi, atau matriks pengujian ekstensi, buat ulang dan tinjau keluaran matriks `plugin-prerelease-extension-shard` milik perencana dari `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak menjelaskan tata letak CI yang usang.
- Kesiapan rilis macOS stabil juga mencakup permukaan pembaru: rilis GitHub pada akhirnya harus memiliki paket `.zip`, `.dmg`, dan `.dSYM.zip`; `appcast.xml` pada `main` harus menunjuk ke zip stabil baru setelah publikasi (alur kerja publikasi macOS meng-commit-nya secara otomatis, atau membuka PR appcast ketika pendorongan langsung diblokir); aplikasi yang dipaketkan harus mempertahankan id bundel non-debug, URL umpan Sparkle yang tidak kosong, dan `CFBundleVersion` yang sama dengan atau lebih tinggi dari batas minimum build Sparkle kanonis untuk versi rilis tersebut.

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai semua pengujian prarilis dari satu titik masuk. Untuk pembuktian commit yang disematkan pada cabang yang bergerak cepat, gunakan pembantu agar setiap alur kerja anak berjalan dari cabang sementara yang ditetapkan pada satu SHA alur kerja `main` tepercaya, sementara commit yang diminta tetap menjadi kandidat yang diuji:

```bash
pnpm ci:full-release --sha <full-sha>
```

Pembantu tersebut mengambil `origin/main` saat ini, mendorong `release-ci/<workflow-sha>-...` pada commit alur kerja tepercaya tersebut, memicu `Full Release Validation` dari cabang sementara dengan `ref=<target-sha>`, menggunakan kembali bukti target persis yang ketat jika tersedia, memverifikasi bahwa setiap `headSha` alur kerja anak cocok dengan SHA alur kerja induk yang disematkan, lalu menghapus cabang sementara. Teruskan `-f reuse_evidence=false` untuk memaksa proses baru atau `--workflow-sha <trusted-main-sha>` untuk menyematkan commit lama yang masih dapat dijangkau dari `origin/main` saat ini. Alur kerja itu sendiri tidak pernah menulis referensi repositori. Hal ini menjaga perkakas rilis khusus-main tetap tersedia tanpa menambahkan commit perkakas ke kandidat dan menghindari pembuktian proses anak `main` yang lebih baru secara tidak sengaja.

Untuk validasi cabang atau tag rilis, jalankan dari referensi alur kerja `main` tepercaya dan teruskan cabang atau tag rilis sebagai `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Alur kerja menyelesaikan referensi target, memicu `CI` manual dengan `target_ref=<release-ref>`, lalu memicu `OpenClaw Release Checks`. `OpenClaw Release Checks` menyebarkan smoke instalasi, pemeriksaan rilis lintas-OS, cakupan jalur rilis Docker live/E2E ketika soak diaktifkan, Penerimaan Paket dengan E2E paket Telegram kanonis, paritas QA Lab, Matrix live, dan Telegram live. Proses lengkap/semua hanya dapat diterima ketika ringkasan `Full Release Validation` menunjukkan `normal_ci`, `plugin_prerelease`, dan `release_checks` berhasil, kecuali proses ulang terfokus sengaja melewati anak `Plugin Prerelease` yang terpisah. Gunakan anak mandiri `npm-telegram` hanya untuk proses ulang terfokus paket yang dipublikasikan dengan `release_package_spec` atau `npm_telegram_package_spec`. Ringkasan pemverifikasi akhir menyertakan tabel pekerjaan paling lambat untuk setiap proses anak, sehingga pengelola rilis dapat melihat jalur kritis saat ini tanpa mengunduh log.

Anak kinerja produk hanya menghasilkan artefak dalam jalur rilis ini. Alur
payung memicunya dengan `publish_reports=false`, dan validasi ditolak
kecuali pembatas khusus artefaknya membuktikan bahwa penerbit laporan Clawgrit tetap
dilewati.

Lihat [Validasi rilis lengkap](/id/reference/full-release-validation) untuk matriks tahapan lengkap, nama pekerjaan alur kerja yang tepat, perbedaan profil stabil dan lengkap, artefak, serta pengendali proses ulang terfokus.

Alur kerja anak dipicu dari referensi tepercaya yang menjalankan `Full Release Validation`, biasanya `--ref main`, bahkan ketika `ref` target menunjuk ke cabang atau tag rilis yang lebih lama. Setiap proses anak harus menggunakan SHA alur kerja induk yang tepat; jika `main` bergerak maju sebelum pemicuan anak diselesaikan, alur payung akan gagal secara tertutup. Tidak ada masukan referensi alur kerja Full Release Validation yang terpisah; pilih perangkat uji tepercaya dengan memilih referensi proses alur kerja. Jangan gunakan `--ref main -f ref=<sha>` untuk pembuktian commit persis pada `main` yang bergerak; SHA commit mentah tidak dapat menjadi referensi pemicuan alur kerja, jadi gunakan `pnpm ci:full-release --sha <target-sha>` untuk membuat cabang sementara pada `origin/main` tepercaya sambil mempertahankan SHA target sebagai masukan kandidat.

Gunakan `release_profile` untuk memilih cakupan live/penyedia:

- `minimum`: jalur live dan Docker OpenAI/inti yang paling cepat dan kritis bagi rilis
- `stable`: minimum ditambah cakupan penyedia/backend stabil untuk persetujuan rilis
- `full`: stabil ditambah cakupan saran penyedia/media yang luas

Validasi stabil dan lengkap selalu menjalankan pengujian lengkap live/E2E, jalur rilis Docker, dan penyisiran terbatas kemampuan bertahan terhadap peningkatan paket yang dipublikasikan sebelum promosi. Gunakan `run_release_soak=true` untuk meminta penyisiran yang sama bagi beta. Penyisiran tersebut mencakup empat paket stabil terbaru ditambah acuan dasar `2026.4.23` dan `2026.5.2` yang disematkan serta cakupan `2026.4.15` yang lebih lama, dengan acuan dasar duplikat dihapus dan setiap acuan dasar dibagi menjadi pekerjaan runner Docker tersendiri.

`OpenClaw Release Checks` menggunakan referensi alur kerja tepercaya untuk menyelesaikan referensi target satu kali sebagai `release-package-under-test` dan menggunakan kembali artefak tersebut dalam pemeriksaan lintas-OS, Penerimaan Paket, dan Docker jalur rilis ketika soak berjalan. Hal ini menjaga semua kotak yang berhadapan dengan paket tetap menggunakan byte yang sama dan menghindari build paket berulang. Setelah beta tersedia di npm, tetapkan `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` agar pemeriksaan rilis mengunduh paket yang dikirim satu kali, mengekstrak SHA sumber build-nya dari `dist/build-info.json`, dan menggunakan kembali artefak tersebut untuk jalur lintas-OS, Penerimaan Paket, Docker jalur rilis, dan Telegram paket.

Smoke instalasi OpenAI lintas-OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika variabel repositori/organisasi ditetapkan, atau `openai/gpt-5.6-luna` jika tidak, karena jalur ini membuktikan instalasi paket, orientasi, startup Gateway, dan satu giliran agen live, bukan menguji tolok ukur model yang paling mumpuni. Matriks penyedia live yang lebih luas tetap menjadi tempat untuk cakupan khusus model.

Gunakan varian berikut sesuai tahapan rilis:

```bash
# Validasi cabang kandidat rilis yang belum dipublikasikan.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validasi commit yang telah didorong secara persis.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Setelah memublikasikan beta, tambahkan E2E Telegram paket yang dipublikasikan.
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

Jangan gunakan payung lengkap sebagai pengulangan pertama setelah perbaikan terfokus. Jika satu kotak gagal, gunakan alur kerja turunan, tugas, lajur Docker, profil paket, penyedia model, atau lajur QA yang gagal untuk bukti berikutnya. Jalankan kembali payung lengkap hanya ketika perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua kotak sebelumnya kedaluwarsa. Pemverifikasi akhir payung memeriksa ulang ID eksekusi alur kerja turunan yang tercatat, jadi setelah alur kerja turunan berhasil dijalankan ulang, jalankan ulang hanya tugas induk `Verify full validation` yang gagal.

`rerun_group=all` dapat menggunakan kembali eksekusi payung hijau sebelumnya hanya ketika eksekusi tersebut memvalidasi SHA target, profil rilis, pengaturan soak efektif, dan masukan validasi yang sama persis. Ini adalah pemulihan terbatas untuk menjalankan ulang kandidat yang sama, bukan penggunaan kembali bukti lintas-SHA. Untuk kandidat yang berubah, termasuk commit yang hanya mengubah catatan perubahan atau versi, jalankan ulang setiap gerbang paket, artefak, instalasi, Docker, atau penyedia yang terpengaruh oleh jalur yang berubah atau hash artefak. Eksekusi payung yang lebih baru untuk ref `release/*` dan grup pengulangan yang sama secara otomatis menggantikan eksekusi yang sedang berlangsung. Teruskan `reuse_evidence=false` untuk memaksa eksekusi lengkap yang baru.

Untuk pemulihan terbatas, teruskan `rerun_group` ke payung. `all` adalah eksekusi kandidat rilis sebenarnya, `ci` hanya menjalankan turunan CI normal, `plugin-prerelease` hanya menjalankan turunan Plugin khusus rilis, `release-checks` menjalankan setiap kotak rilis, dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, serta `npm-telegram`. Pengulangan `npm-telegram` terfokus memerlukan `release_package_spec` atau `npm_telegram_package_spec`; eksekusi lengkap/semua menggunakan E2E Telegram paket kanonis di dalam Package Acceptance. Pengulangan lintas-OS terfokus dapat menambahkan `cross_os_suite_filter=windows/packaged-upgrade` atau filter OS/rangkaian lainnya. Kegagalan pemeriksaan rilis QA memblokir validasi rilis normal, termasuk penyimpangan alat dinamis OpenClaw yang diwajibkan pada tingkat standar. Eksekusi alfa Tideclaw masih dapat memperlakukan lajur pemeriksaan rilis yang tidak terkait keamanan paket sebagai saran. Dengan `release_profile=beta`, rangkaian penyedia langsung `Run repo/live E2E validation` bersifat saran (peringatan, bukan pemblokir); profil stabil dan lengkap tetap menjadikannya pemblokir. Ketika `live_suite_filter` secara eksplisit meminta lajur langsung QA yang diberi gerbang seperti Discord, WhatsApp, atau Slack, variabel repo `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` yang sesuai harus diaktifkan; jika tidak, pengambilan masukan akan gagal alih-alih melewati lajur secara diam-diam.

### Vitest

Kotak Vitest adalah alur kerja turunan `CI` manual. CI manual sengaja mengabaikan pembatasan berdasarkan perubahan dan memaksa grafik pengujian normal untuk kandidat rilis: shard Node Linux, shard Plugin yang dibundel, shard kontrak Plugin dan saluran, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan asap artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, dan i18n Control UI. Android disertakan ketika `Full Release Validation` menjalankan kotak tersebut karena payung meneruskan `include_android=true`; CI manual mandiri memerlukan `include_android=true` untuk cakupan Android.

Gunakan kotak ini untuk menjawab "apakah pohon sumber lulus seluruh rangkaian pengujian normal?" Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- Ringkasan `Full Release Validation` yang menampilkan URL eksekusi `CI` yang dijalankan
- Eksekusi `CI` hijau pada SHA target yang tepat
- Nama shard yang gagal atau lambat dari tugas CI saat menyelidiki regresi
- Artefak waktu Vitest seperti `.artifacts/vitest-shard-timings.json` ketika suatu eksekusi memerlukan analisis kinerja

Jalankan CI manual secara langsung hanya ketika rilis memerlukan CI normal deterministik, tetapi tidak memerlukan kotak Docker, QA Lab, langsung, lintas-OS, atau paket. Gunakan perintah pertama untuk CI langsung non-Android. Tambahkan `include_android=true` ketika CI kandidat rilis langsung harus mencakup Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Kotak Docker berada di `OpenClaw Release Checks` melalui `openclaw-live-and-e2e-checks-reusable.yml`, ditambah alur kerja `install-smoke` mode rilis. Kotak ini memvalidasi kandidat rilis melalui lingkungan Docker terpaket, bukan hanya pengujian tingkat sumber.

Cakupan Docker rilis mencakup:

- pemeriksaan asap instalasi lengkap dengan pemeriksaan asap instalasi global Bun yang lambat diaktifkan
- persiapan/penggunaan kembali citra pemeriksaan asap Dockerfile akar berdasarkan SHA target, dengan tugas pemeriksaan asap QR, akar/Gateway, dan pemasang/Bun berjalan sebagai shard install-smoke terpisah
- lajur E2E repositori
- potongan Docker jalur rilis: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hingga `plugins-runtime-install-h`, dan `openwebui`
- cakupan OpenWebUI pada runner khusus dengan disk besar ketika diminta
- lajur instalasi/pencopotan Plugin terbundel yang dipisah, dari `bundled-plugin-install-uninstall-0` hingga `bundled-plugin-install-uninstall-23`
- rangkaian penyedia langsung/E2E dan cakupan model langsung Docker ketika pemeriksaan rilis menyertakan rangkaian langsung

Gunakan artefak Docker sebelum menjalankan ulang. Penjadwal jalur rilis mengunggah `.artifacts/docker-tests/` yang berisi log lajur, `summary.json`, `failures.json`, waktu fase, JSON rencana penjadwal, dan perintah pengulangan. Untuk pemulihan terfokus, gunakan `docker_lanes=<lane[,lane]>` pada alur kerja langsung/E2E yang dapat digunakan kembali, alih-alih menjalankan ulang semua potongan rilis. Perintah pengulangan yang dihasilkan menyertakan `package_artifact_run_id` sebelumnya dan masukan citra Docker yang telah disiapkan jika tersedia, sehingga lajur yang gagal dapat menggunakan kembali tarball dan citra GHCR yang sama.

### QA Lab

Kotak QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Kotak ini adalah gerbang rilis perilaku agen dan tingkat saluran, terpisah dari Vitest dan mekanisme paket Docker.

Cakupan QA Lab rilis mencakup:

- lajur paritas tiruan yang membandingkan lajur kandidat OpenAI dengan garis dasar `anthropic/claude-opus-4-8` menggunakan paket paritas agen
- profil QA Matrix langsung cepat yang menggunakan lingkungan `qa-live-shared`
- lajur QA Telegram langsung yang menggunakan penyewaan kredensial CI Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke`, atau `pnpm qa:observability:smoke` ketika telemetri rilis memerlukan bukti lokal eksplisit

Gunakan kotak ini untuk menjawab "apakah rilis berperilaku benar dalam skenario QA dan alur saluran langsung?" Simpan URL artefak untuk lajur paritas, Matrix, dan Telegram saat menyetujui rilis. Cakupan Matrix lengkap tetap tersedia sebagai eksekusi QA-Lab bershard manual, bukan sebagai lajur kritis rilis bawaan.

### Paket

Kotak Paket adalah gerbang produk yang dapat diinstal. Kotak ini didukung oleh `Package Acceptance` dan resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalkan kandidat menjadi tarball `package-under-test` yang digunakan oleh E2E Docker, memvalidasi inventaris paket, mencatat versi paket dan SHA-256, serta menjaga ref harness alur kerja tetap terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat
- `source=ref`: mengemas cabang `package_ref`, tag, atau SHA commit lengkap yang tepercaya dengan harness `workflow_ref` yang dipilih
- `source=url`: mengunduh `.tgz` HTTPS publik dengan `package_sha256` yang diwajibkan; kredensial URL, port HTTPS nonbawaan, nama host atau alamat teresolusi privat/internal/penggunaan khusus, dan pengalihan yang tidak aman ditolak
- `source=trusted-url`: mengunduh `.tgz` HTTPS dengan `package_sha256` dan `trusted_source_id` yang diwajibkan dari kebijakan bernama di `.github/package-trusted-sources.json`; gunakan ini untuk cermin perusahaan milik pengelola atau repositori paket privat, alih-alih menambahkan pengabaian jaringan privat tingkat masukan ke `source=url`
- `source=artifact`: menggunakan kembali `.tgz` yang diunggah oleh eksekusi GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak paket rilis yang telah disiapkan, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance mempertahankan migrasi, pembaruan, peningkatan VPS yang dikelola akar, mulai ulang pembaruan autentikasi terkonfigurasi, instalasi Skills ClawHub langsung, pembersihan dependensi Plugin usang, fixture Plugin luring, pembaruan Plugin, penguatan pelepasan pengikatan perintah Plugin, dan QA paket Telegram terhadap tarball teresolusi yang sama. Pemeriksaan rilis pemblokir menggunakan garis dasar paket terbaru yang dipublikasikan secara bawaan; profil beta dengan `run_release_soak=true`, `release_profile=stable`, atau `release_profile=full` memperluas sapuan published-upgrade-survivor ke `last-stable-4` ditambah garis dasar `2026.4.23`, `2026.5.2`, dan `2026.4.15` yang disematkan dengan skenario `reported-issues`. Gunakan Package Acceptance dengan `source=npm` untuk kandidat yang sudah dirilis, `source=ref` untuk tarball npm lokal berbasis SHA sebelum publikasi, `source=trusted-url` untuk cermin perusahaan/privat milik pengelola, atau `source=artifact` untuk tarball yang telah disiapkan dan diunggah oleh eksekusi GitHub Actions lain.

Kotak ini adalah pengganti asli GitHub untuk sebagian besar cakupan paket/pembaruan yang sebelumnya memerlukan Parallels. Pemeriksaan rilis lintas-OS tetap penting untuk orientasi, pemasang, dan perilaku khusus platform, tetapi validasi produk paket/pembaruan sebaiknya mengutamakan Package Acceptance.

Daftar periksa kanonis untuk validasi pembaruan dan Plugin adalah [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins). Gunakan daftar ini saat menentukan lajur lokal, Docker, Package Acceptance, atau pemeriksaan rilis yang membuktikan perubahan instalasi/pembaruan Plugin, pembersihan doctor, atau migrasi paket yang dipublikasikan. Migrasi pembaruan terpublikasi menyeluruh dari setiap paket stabil `2026.4.23+` adalah alur kerja manual `Update Migration` yang terpisah, bukan bagian dari Full Release CI.

Kelonggaran package-acceptance lama sengaja dibatasi waktunya. Paket hingga `2026.4.25` dapat menggunakan jalur kompatibilitas untuk kesenjangan metadata yang sudah dipublikasikan ke npm: entri inventaris QA privat yang hilang dari tarball, `gateway install --wrapper` yang hilang, berkas tambalan yang hilang dalam fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi catatan instalasi Plugin lama, persistensi catatan instalasi marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Paket `2026.4.26` yang dipublikasikan dapat memberikan peringatan untuk berkas stempel metadata build lokal yang sudah dirilis. Paket yang lebih baru harus memenuhi kontrak paket modern; kesenjangan yang sama akan menggagalkan validasi rilis.

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
- `package`: kontrak instalasi/pembaruan/mulai ulang/paket Plugin serta bukti instalasi Skills ClawHub langsung; ini adalah default pemeriksaan rilis
- `product`: `package` ditambah channel MCP, pembersihan cron/subagen, pencarian web OpenAI, dan OpenWebUI
- `full`: bagian jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` persis untuk pengulangan eksekusi terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier` pada Package Acceptance. Alur kerja meneruskan tarball `package-under-test` yang telah ditentukan ke jalur Telegram; alur kerja Telegram mandiri tetap menerima spesifikasi npm yang telah dipublikasikan untuk pemeriksaan pascapublikasi.

## Otomatisasi publikasi rilis reguler

Untuk publikasi beta, `latest`, Plugin, GitHub Release, dan platform,
`OpenClaw Release Publish` adalah titik masuk mutasi normal. Jalur extended-stable
khusus npm bulanan `.33+` tidak menggunakan orkestrator ini. Alur kerja reguler
mengorkestrasi alur kerja penerbit tepercaya dalam urutan yang diperlukan rilis:

1. Checkout tag rilis dan tentukan SHA commit-nya.
2. Verifikasi bahwa tag dapat dijangkau dari `main` atau `release/*` (atau cabang alfa Tideclaw untuk prarilis alfa).
3. Jalankan `pnpm plugins:sync:check`.
4. Picu `Plugin NPM Release` dengan `publish_scope=all-publishable` dan `ref=<release-sha>`.
5. Picu `Plugin ClawHub Release` dengan cakupan dan SHA yang sama.
6. Picu `OpenClaw NPM Release` dengan tag rilis, dist-tag npm, dan `preflight_run_id` tersimpan setelah memverifikasi `full_release_validation_run_id` tersimpan serta percobaan eksekusi yang persis.
7. Untuk rilis stabil, buat atau perbarui rilis GitHub sebagai draf, picu `Windows Node Release` dengan `windows_node_tag` eksplisit dan `windows_node_installer_digests` yang disetujui kandidat, lalu verifikasi aset penginstal/checksum Windows kanonis. Picu juga `Android Release` untuk membangun APK bertanda tangan dengan tag persis beserta checksum dan asal-usulnya. Verifikasi kedua kontrak aset native sebelum memublikasikan draf.

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

Promosi stabil langsung ke `latest` harus dinyatakan secara eksplisit:

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

Gunakan alur kerja tingkat rendah `Plugin NPM Release` dan `Plugin ClawHub Release` hanya untuk pekerjaan perbaikan atau publikasi ulang yang terfokus. `OpenClaw Release Publish` menolak `plugin_publish_scope=selected` ketika `publish_openclaw_npm=true` agar paket inti tidak dapat dirilis tanpa semua Plugin resmi yang dapat dipublikasikan, termasuk `@openclaw/diffs-language-pack`. Untuk perbaikan Plugin tertentu, tetapkan `publish_openclaw_npm=false` dengan `plugin_publish_scope=selected` dan `plugins=@openclaw/name`, atau picu alur kerja anak secara langsung.

Bootstrap publikasi pertama ClawHub adalah pengecualian: picu `Plugin ClawHub New`
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

Validasi pratanda memerlukan `dry_run=true`, menolak input tag rilis dan eksekusi
induk, serta hanya menerima target persis yang dapat dijangkau dari `main` atau
`release/*`. Validasi ini tidak memuat kredensial ClawHub, memublikasikan byte
paket, atau mengubah konfigurasi penerbit tepercaya. Alur kerja tetap menentukan
rencana registri langsung, melakukan checkout dan pengemasan target hanya dalam
pekerjaan tanpa rahasia, mewujudkan toolchain ClawHub yang dikunci, serta
memvalidasi artefak yang tidak dapat diubah dan slug/identitas paket sebelum tag
rilis tersedia. Setujui lingkungan `clawhub-plugin-bootstrap` hanya setelah
pekerjaan pengemasan tanpa rahasia selesai; pekerjaan validasi terlindungi ini
tidak memiliki kredensial atau perintah mutasi.

Eksekusi uji coba yang disetujui atau bootstrap nyata setelah pemberian tag harus
menyertakan tag rilis yang persis serta ID eksekusi, percobaan, dan cabang induk
`OpenClaw Release Publish`. Induk mengesahkan SHA alur kerjanya sendiri dan SHA
`main` tepercaya terpisah yang persis untuk `Plugin ClawHub New`; eksekusi anak
dan setiap persetujuan lingkungan terlindungi harus cocok dengan SHA anak yang
disetujui tersebut. Tag rilis diperiksa ulang sebelum setiap upaya publikasi dan
mutasi penerbit tepercaya.

Pekerjaan pengemasan
mengunggah satu artefak yang tidak dapat diubah, yang nama, ID/digest artefak
Actions, eksekusi/percobaan produsen, SHA target, serta SHA-256/ukuran tarball
per paketnya diteruskan ke pekerjaan validasi dan terlindungi. Pekerjaan
terlindungi hanya melakukan checkout perkakas `main` tepercaya, memvalidasi
tuple artefak melalui API GitHub, mengunduh berdasarkan ID artefak yang persis,
menghitung ulang hash setiap tarball, serta memvalidasi jalur TAR lokal dan
identitas paket menggunakan aturan kanonisasi USTAR milik CLI yang disematkan.
Setiap kandidat kemudian melewati uji coba publikasi CLI yang disematkan, yang
berhenti sebelum pencarian registri atau autentikasi. Prapenyaring pekerjaan
kredensial membatasi ClawPack terkompresi hingga 120 MiB, total muatan berkas
hingga 50 MiB, data TAR yang diekspansi hingga 64 MiB, dan jumlah entri TAR
hingga 10.000. Perbaikan penerbit tepercaya untuk paket yang sudah ada tetap
hanya melakukan konfigurasi, tetapi masih mengemas target dan mewajibkan tag
yang diminta serta kesetaraan persis byte registri dan metadata sebelum mengubah
konfigurasi penerbit tepercaya. Verifikasi pascapublikasi mengunduh artefak
ClawHub dan mewajibkan SHA-256 serta ukuran yang sama. Pemulihan pengulangan
eksekusi yang gagal dapat menggunakan kembali artefak paket dari percobaan
sebelumnya hanya ketika pekerjaan produsen yang persis selesai dengan sukses.
Bukti akhir juga mengikat versi ClawHub yang dikunci, SHA-256 kunci, dan
integritas npm. Ketidakcocokan memerlukan versi paket baru.

## Input alur kerja NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1`, atau `v2026.4.2-alpha.1`; ketika `preflight_only=true`, nilainya juga dapat berupa SHA commit 40 karakter lengkap saat ini dari cabang alur kerja untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk jalur publikasi nyata
- `preflight_run_id`: ID eksekusi preflight berhasil yang sudah ada, wajib pada jalur publikasi nyata agar alur kerja menggunakan kembali tarball yang telah disiapkan alih-alih membangunnya kembali
- `full_release_validation_run_id`: ID eksekusi `Full Release Validation` yang berhasil untuk tag/SHA ini, wajib untuk publikasi nyata. Publikasi beta dapat dilanjutkan hanya dengan preflight disertai peringatan, tetapi promosi stabil/`latest` tetap memerlukannya.
- `full_release_validation_run_attempt`: percobaan eksekusi positif yang persis dan dipasangkan dengan `full_release_validation_run_id`; wajib setiap kali ID eksekusi diberikan agar pengulangan eksekusi tidak dapat mengubah bukti otorisasi selama publikasi.
- `release_publish_run_id`: ID eksekusi `OpenClaw Release Publish` yang disetujui; wajib ketika alur kerja ini dipicu oleh induk tersebut (panggilan publikasi nyata oleh aktor bot)
- `plugin_npm_run_id`: ID eksekusi `Plugin NPM Release` exact-head yang berhasil; wajib untuk publikasi inti `extended-stable` nyata
- `npm_dist_tag`: tag target npm untuk jalur publikasi; menerima `alpha`, `beta`, `latest`, atau `extended-stable` dan default-nya adalah `beta`. Patch final `33` dan seterusnya harus menggunakan `extended-stable`; secara default, `extended-stable` menolak patch sebelumnya, dan selalu menolak tag nonfinal.
- `bypass_extended_stable_guard`: boolean khusus pengujian, default `false`; dengan `npm_dist_tag=extended-stable`, melewati kelayakan extended-stable bulanan sambil mempertahankan pemeriksaan identitas rilis, artefak, persetujuan, dan pembacaan balik.

`Plugin NPM Release` menerima `npm_dist_tag=default` untuk perilaku rilis yang
sudah ada atau `npm_dist_tag=extended-stable` untuk jalur bulanan yang dijaga.
Opsi extended-stable memerlukan `publish_scope=all-publishable`, input `plugins`
kosong, patch final `33` atau lebih tinggi, dan cabang kanonis
`extended-stable/YYYY.M.33` tepat di ujungnya. Opsi ini tidak pernah memindahkan
`latest` atau `beta` milik Plugin. Versi paket baru menerima `extended-stable`
secara atomik melalui publikasi tepercaya OIDC (`npm publish --tag extended-stable`);
alur kerja sumber ini tidak menggunakan `npm dist-tag add` yang diautentikasi
dengan token. Percobaan ulang melewati versi persis yang sudah tersedia di npm,
lalu berhenti secara tertutup kecuali pembacaan balik lengkap mengonfirmasi bahwa
setiap paket persis dan tag `extended-stable` telah konvergen.

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah tersedia
- `preflight_run_id`: ID eksekusi preflight `OpenClaw NPM Release` yang berhasil; wajib ketika `publish_openclaw_npm=true` atau `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: ID eksekusi `Full Release Validation` yang berhasil; wajib ketika `publish_openclaw_npm=true` atau `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: percobaan positif yang persis dan dipasangkan dengan `full_release_validation_run_id`; wajib setiap kali ID eksekusi diberikan
- `windows_node_tag`: tag rilis `openclaw/openclaw-windows-node` nonprarilis yang persis; wajib untuk publikasi OpenClaw stabil
- `windows_node_installer_digests`: peta JSON ringkas yang disetujui kandidat dari nama penginstal Windows saat ini ke digest `sha256:` yang disematkan; wajib untuk publikasi OpenClaw stabil
- `npm_telegram_run_id`: ID eksekusi `NPM Telegram Beta E2E` berhasil yang opsional untuk disertakan dalam bukti rilis akhir
- `npm_dist_tag`: tag target npm untuk paket OpenClaw, salah satu dari `alpha`, `beta`, atau `latest`
- `plugin_publish_scope`: default-nya `all-publishable`; gunakan `selected` hanya untuk pekerjaan perbaikan khusus Plugin yang terfokus dengan `publish_openclaw_npm=false`
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma ketika `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default-nya `true`; tetapkan `false` hanya ketika menggunakan alur kerja sebagai orkestrator perbaikan khusus Plugin
- `release_profile`: profil cakupan rilis yang digunakan untuk ringkasan bukti rilis; default-nya `from-validation`, yang membacanya dari manifes validasi, atau timpa dengan `beta`, `stable`, atau `full`
- `wait_for_clawhub`: default-nya `false` agar ketersediaan npm tidak diblokir oleh sidecar ClawHub; tetapkan `true` hanya ketika penyelesaian alur kerja harus mencakup penyelesaian ClawHub

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: cabang, tag, atau SHA commit lengkap untuk divalidasi. Pemeriksaan yang membawa rahasia mengharuskan commit yang ditentukan dapat dijangkau dari cabang atau tag rilis OpenClaw.
- `run_release_soak`: ikut serta dalam soak langsung/E2E menyeluruh, jalur rilis Docker, dan penyintas peningkatan semua versi sejak awal untuk pemeriksaan rilis beta. Ini dipaksa aktif oleh `release_profile=stable` dan `release_profile=full`.

Aturan:

- Versi final reguler dan versi koreksi di bawah patch `33` dapat dipublikasikan ke `beta` atau `latest`. Versi final pada patch `33` atau lebih tinggi harus dipublikasikan ke `extended-stable`, dan versi dengan sufiks koreksi pada batas tersebut ditolak.
- Tag prarilis beta hanya dapat dipublikasikan ke `beta`; tag prarilis alfa hanya dapat dipublikasikan ke `alpha`
- Untuk `OpenClaw NPM Release`, input SHA commit lengkap hanya diizinkan saat `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya untuk validasi
- Jalur publikasi sebenarnya harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama prapemeriksaan; alur kerja memverifikasi metadata tersebut sebelum publikasi dilanjutkan

## Urutan rilis stabil beta/latest reguler

Urutan lama ini digunakan untuk rilis reguler yang diorkestrasi, yang juga menangani plugin, Rilis GitHub, Windows, dan pekerjaan platform lainnya. Ini bukan jalur extended-stable khusus npm bulanan `.33+` yang didokumentasikan di bagian atas halaman ini.

Saat membuat rilis stabil reguler yang diorkestrasi:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag tersedia, Anda dapat menggunakan SHA commit lengkap dari cabang alur kerja saat ini untuk uji coba kering khusus validasi terhadap alur kerja prapemeriksaan.
2. Pilih `npm_dist_tag=beta` untuk alur normal yang mendahulukan beta, atau `latest` hanya jika Anda memang menginginkan publikasi stabil langsung.
3. Jalankan `Full Release Validation` pada cabang rilis, tag rilis, atau SHA commit lengkap jika Anda menginginkan CI normal beserta cakupan cache prompt langsung, Docker, QA Lab, Matrix, dan Telegram dari satu alur kerja manual. Jika Anda memang hanya memerlukan grafik pengujian normal yang deterministik, jalankan alur kerja manual `CI` pada referensi rilis sebagai gantinya.
4. Pilih tag rilis non-prarilis `openclaw/openclaw-windows-node` yang tepat, yang penginstal x64 dan ARM64 bertanda tangannya akan dirilis. Simpan tag tersebut sebagai `windows_node_tag`, lalu simpan peta digest yang telah divalidasi sebagai `windows_node_installer_digests`. Pembantu kandidat rilis mencatat keduanya dan menyertakannya dalam perintah publikasi yang dihasilkan.
5. Simpan `preflight_run_id`, `full_release_validation_run_id`, dan `full_release_validation_run_attempt` yang tepat dari proses yang berhasil.
6. Jalankan `OpenClaw Release Publish` dari `main` tepercaya dengan `tag` yang sama, `npm_dist_tag` yang sama, `windows_node_tag` yang dipilih, `windows_node_installer_digests` yang telah disimpan, serta `preflight_run_id`, `full_release_validation_run_id`, dan `full_release_validation_run_attempt` yang telah disimpan. Proses ini memublikasikan plugin yang telah dieksternalisasi ke npm dan ClawHub sebelum mempromosikan paket npm OpenClaw.
7. Jika rilis diterbitkan pada `beta`, gunakan alur kerja `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`.
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta` harus segera mengikuti build stabil yang sama, gunakan alur kerja rilis yang sama untuk mengarahkan kedua dist-tag ke versi stabil tersebut, atau biarkan sinkronisasi pemulihan mandiri terjadwal memindahkan `beta` nanti.

Mutasi dist-tag berada di repositori buku besar rilis karena masih memerlukan `NPM_TOKEN`, sedangkan repositori sumber mempertahankan publikasi khusus OIDC. Dengan demikian, jalur publikasi langsung dan jalur promosi yang mendahulukan beta tetap terdokumentasi serta terlihat oleh operator.

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
