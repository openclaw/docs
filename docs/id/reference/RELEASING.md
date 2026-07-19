---
read_when:
    - Mencari definisi kanal rilis publik
    - Menjalankan validasi rilis atau penerimaan paket
    - Mencari penamaan versi dan kadensinya
summary: Jalur rilis, daftar periksa operator, kotak validasi, penamaan versi, dan siklus rilis
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-07-19T05:09:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db7e2337495368b5d849e44ccbe60078fafa2dbb3d45d657b53e2104ad23a7f9
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw saat ini menyediakan tiga saluran pembaruan yang dapat digunakan pengguna:

- stable: saluran rilis yang dipromosikan saat ini, yang masih diresolusikan melalui npm `latest` hingga pencapaian CLI/saluran terpisah tersedia
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: ujung bergerak dari `main`

Secara terpisah, operator rilis dapat memublikasikan paket inti bulan terakhir yang telah selesai
ke npm `extended-stable`, dimulai pada patch `33`. Lini final reguler
bulan berjalan tetap berada di npm `latest`; pemisahan publikasi di sisi operator ini
tidak dengan sendirinya mengubah resolusi saluran pembaruan CLI.

Build alfa Tideclaw merupakan jalur prarilis internal terpisah (dist-tag npm `alpha`), yang dibahas dalam [Input alur kerja NPM](#npm-workflow-inputs) dan [Kotak pengujian rilis](#release-test-boxes).

## Penamaan versi

- Versi rilis extended-stable npm bulanan: `YYYY.M.PATCH`, dengan `PATCH >= 33`, tag git `vYYYY.M.PATCH`
- Versi rilis final harian/reguler: `YYYY.M.PATCH`, dengan `PATCH < 33`, tag git `vYYYY.M.PATCH`
- Versi rilis koreksi fallback reguler: `YYYY.M.PATCH-N`, tag git `vYYYY.M.PATCH-N`
- Versi prarilis beta: `YYYY.M.PATCH-beta.N`, tag git `vYYYY.M.PATCH-beta.N`
- Versi prarilis alfa: `YYYY.M.PATCH-alpha.N`, tag git `vYYYY.M.PATCH-alpha.N`
- Jangan pernah menambahkan nol di depan bulan atau patch
- `PATCH` adalah nomor rangkaian rilis bulanan berurutan, bukan hari kalender. Rilis final reguler dan beta memajukan rangkaian saat ini; tag khusus alfa tidak pernah menggunakan atau memajukan nomor patch beta/reguler, jadi abaikan tag lama khusus alfa dengan nomor patch yang lebih tinggi saat memilih rangkaian beta atau reguler.
- Build alfa/nightly menggunakan rangkaian patch berikutnya yang belum dirilis dan hanya menaikkan `alpha.N` untuk build berulang. Setelah patch tersebut memiliki beta, build alfa baru berpindah ke patch berikutnya.
- Versi npm bersifat tetap: jangan pernah menghapus, memublikasikan ulang, atau menggunakan kembali tag yang telah dipublikasikan. Buat nomor prarilis berikutnya atau patch bulanan berikutnya sebagai gantinya.
- `latest` tetap mengikuti lini npm reguler/harian saat ini; `beta` adalah target instalasi beta saat ini
- `extended-stable` berarti paket npm bulan sebelumnya yang didukung, dimulai pada patch `33`; patch `34` dan seterusnya merupakan rilis pemeliharaan pada lini bulanan tersebut
- Rilis final reguler dan koreksi reguler dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah diperiksa kemudian
- Jalur extended-stable bulanan khusus memublikasikan paket inti npm dan setiap plugin resmi yang dapat dipublikasikan ke npm dengan versi yang sama persis. Jalur ini tidak memublikasikan plugin ke ClawHub ataupun memublikasikan artefak macOS atau Windows, GitHub Release, dist-tag repositori privat, image Docker, artefak seluler, atau unduhan situs web.
- Setiap rilis final reguler mengirimkan paket npm, aplikasi macOS, APK Android mandiri yang ditandatangani, dan penginstal Windows Hub yang ditandatangani secara bersamaan. Rilis beta biasanya memvalidasi dan memublikasikan jalur npm/paket terlebih dahulu, sedangkan build/penandatanganan/notarisasi/promosi aplikasi native dicadangkan untuk rilis final reguler kecuali diminta secara eksplisit.

## Irama rilis

- Rilis berjalan dengan beta terlebih dahulu; stable hanya menyusul setelah beta terbaru divalidasi
- Pemelihara biasanya membuat rilis dari cabang `release/YYYY.M.PATCH` yang dibuat dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak menghambat pengembangan baru pada `main`
- Jika tag beta telah didorong atau dipublikasikan dan memerlukan perbaikan, pemelihara membuat tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan hanya tersedia bagi pemelihara

## Publikasi extended-stable bulanan khusus npm

Ini merupakan pengecualian khusus terhadap prosedur rilis reguler di bawah. Untuk
bulan yang telah selesai `YYYY.M`, buat `extended-stable/YYYY.M.33`; publikasikan
`vYYYY.M.33` dan patch pemeliharaan berikutnya dari cabang yang sama. Tag rilis,
ujung cabang, checkout, versi paket, prapemeriksaan npm, dan proses Full Release
Validation semuanya harus mengidentifikasi commit yang sama. `main` yang dilindungi harus
sudah berisi versi final dari bulan kalender yang benar-benar lebih baru di bawah patch
`33`; patch pemeliharaan tetap memenuhi syarat setelah `main` maju lebih dari satu
bulan.

Pada cabang extended-stable yang tepat, naikkan paket root ke `YYYY.M.P`, jalankan
`pnpm release:prep`, dan verifikasi bahwa setiap paket ekstensi yang dapat dipublikasikan memiliki
versi yang sama. Commit dan dorong semua perubahan yang dihasilkan, buat dan dorong
tag tetap `vYYYY.M.P` pada commit tersebut, lalu catat SHA lengkap yang dihasilkan.
Alur kerja menggunakan pohon yang telah disiapkan ini; alur kerja tidak menaikkan atau menyinkronkan
versi untuk Anda.

Jalankan prapemeriksaan npm dan Full Release Validation dari ujung cabang tepat
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
ujung cabang yang sama persis. Patch `P` harus bernilai `33` atau lebih besar. Berikan SHA rilis lengkap
sebagai `ref`, tunggu seluruh matriks dan pembacaan balik registri selesai, lalu simpan
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
dan setiap tag plugin `extended-stable` sebelum berhasil. Jika proses parsial
gagal, jalankan ulang perintah yang sama: paket yang telah dipublikasikan digunakan kembali, tag plugin
yang hilang atau usang diselaraskan dalam lingkungan rilis npm, dan
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
kebijakan bulanan `.33` atau bulan `main` yang dilindungi, tambahkan
`-f bypass_extended_stable_guard=true` ke dispatch prapemeriksaan dan publikasi
npm. Nilai defaultnya adalah `false`. Bypass hanya diterima dengan
`npm_dist_tag=extended-stable` dan dicatat dalam ringkasan alur kerja. Bypass tersebut
tidak melewati ref alur kerja `extended-stable/YYYY.M.33` yang kanonis,
kesamaan ujung cabang/tag/checkout, sintaks tag final, kesamaan versi
paket/tag, identitas proses dan manifes yang dirujuk, asal-usul tarball,
persetujuan lingkungan, pembacaan balik registri, atau bukti perbaikan pemilih.

Alur kerja publikasi memverifikasi identitas proses prapemeriksaan, validasi, dan plugin
yang dirujuk, digest tarball yang telah disiapkan, serta pemilih registri inti.
Konfirmasikan hasil secara terpisah setelah alur kerja berhasil:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Kedua perintah harus mengembalikan `YYYY.M.P`. Jika publikasi berhasil tetapi pembacaan balik
pemilih gagal, jangan memublikasikan ulang versi paket yang tetap tersebut. Gunakan
satu perintah perbaikan `npm dist-tag add openclaw@YYYY.M.P extended-stable`
yang dicetak dalam ringkasan always-run alur kerja yang gagal, lalu ulangi kedua
pembacaan balik independen. Pengembalian ke pemilih sebelumnya merupakan keputusan
operator yang terpisah, bukan jalur perbaikan pembacaan balik.

Dokumentasi dukungan publik pada awalnya menetapkan Slack, Discord, dan Codex sebagai
permukaan plugin extended-stable yang dicakup. Daftar tersebut merupakan pernyataan dukungan, bukan
daftar izin kode rilis: setiap plugin resmi yang dapat dipublikasikan ke npm mengikuti
jalur publikasi versi tepat yang sama.

Daftar periksa reguler di bawah tetap mencakup publikasi beta, `latest`, GitHub Release,
plugin, macOS, Windows, dan platform lainnya. Jangan jalankan
langkah-langkah tersebut untuk jalur extended-stable khusus npm ini.

## Daftar periksa operator rilis reguler

Daftar periksa ini merupakan bentuk publik dari alur rilis. Kredensial privat, penandatanganan, notarisasi, pemulihan dist-tag, dan detail rollback darurat tetap berada dalam panduan rilis khusus pemelihara.

1. Mulai dari `main` saat ini: tarik perubahan terbaru, konfirmasikan bahwa commit target telah didorong, dan konfirmasikan bahwa Pipeline CI `main` cukup hijau untuk dijadikan dasar cabang.
2. Buat `release/YYYY.M.PATCH` dari commit tersebut. Backport bersifat opsional; terapkan hanya kumpulan yang dipilih operator. Naikkan setiap lokasi versi yang diperlukan, jalankan `pnpm release:prep`, selesaikan perbaikan rilis dan forward-port yang diperlukan, serta tinjau `src/plugins/compat/registry.ts` beserta `src/commands/doctor/shared/deprecation-compat.ts`.
3. Bekukan commit sebelum changelog yang produknya telah lengkap sebagai **SHA Kode**. Jalankan prapemeriksaan sumber deterministik, lalu gunakan `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Ini menyematkan perangkat alur kerja tepercaya sementara matriks lengkap Vitest, Docker, QA, paket, dan performa menargetkan SHA Kode yang tepat.
4. Klasifikasikan kegagalan sebelum mengedit. Kegagalan produk/kode menghasilkan SHA Kode baru dan memerlukan validasi penuh yang hijau untuk SHA tersebut. Kegagalan alur kerja, harness, kredensial, persetujuan, atau infrastruktur diperbaiki pada permukaan pemiliknya dan dijalankan ulang terhadap SHA Kode yang sama.
5. Hanya setelah SHA Kode hijau, buat bagian teratas `CHANGELOG.md` dari PR yang digabungkan dan commit langsung sejak tag rilis terakhir yang dapat dijangkau. Pastikan entri berorientasi pada pengguna dan tidak duplikat. Ketika tag rilis yang menyimpang atau forward-port berikutnya mengaitkan kembali PR yang sudah dirilis, berikan tag tersebut secara eksplisit sebagai `--shipped-ref`.
6. Commit hanya `CHANGELOG.md`. Commit ini adalah **SHA Rilis**. Diff lengkap dari SHA Kode ke SHA Rilis harus tepat berupa `CHANGELOG.md`; perubahan pada jalur lain akan mengembalikan rilis ke langkah 2.
7. Jalankan Full Release Validation yang disematkan ke SHA untuk SHA Rilis dengan penggunaan kembali bukti diaktifkan. Induk ringan harus mencatat `changelog-only-release-v1`, menunjuk ke SHA Kode yang hijau, dan tidak melakukan dispatch terhadap lane turunan produk. Ini menggunakan kembali bukti produk; ini tidak menggunakan kembali byte paket.
8. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true` terhadap SHA/tag Rilis. Simpan `preflight_run_id` yang berhasil. Ini membangun dan memeriksa byte paket yang tepat serta menyertakan changelog final.
9. Beri tag pada SHA Rilis, lalu jalankan pembantu kandidat dengan induk validasi SHA Rilis yang berhasil dan prapemeriksaan npm alih-alih melakukan dispatch ulang terhadap keduanya:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Untuk stabil, teruskan juga `--windows-node-tag vX.Y.Z`. Helper tersebut memverifikasi asal-usul catatan rilis, byte prapemeriksaan npm, bukti instalasi/pembaruan Parallels, bukti paket Telegram, dan rencana publikasi plugin, lalu mencetak perintah publikasi.

   `OpenClaw Release Publish` mengirimkan paket plugin yang dipilih atau semua yang dapat dipublikasikan ke npm dan set yang sama ke ClawHub secara paralel, lalu mempromosikan artefak prapemeriksaan npm OpenClaw yang telah disiapkan dengan dist-tag yang cocok setelah publikasi plugin ke npm berhasil. Checkout rilis tetap menjadi root produk/data, sementara perencanaan dan verifikasi akhir dijalankan dari checkout sumber alur kerja tepercaya yang persis agar commit rilis lama tidak dapat secara diam-diam menggunakan perkakas rilis usang. Sebelum proses turunan publikasi apa pun dimulai, alur kerja merender dan menyimpan dalam cache isi rilis GitHub yang persis. Jika seluruh bagian `CHANGELOG.md` yang cocok memenuhi batas 125.000 karakter GitHub dan batas aman 125.000 byte milik perender, halaman memuat bagian `## YYYY.M.PATCH` yang persis tersebut, termasuk judulnya. Jika bagian sumber tidak muat, halaman mempertahankan catatan editorial berkelompok yang persis dan mengganti catatan kontribusi yang terlalu besar dengan tautan stabil ke catatan lengkap dalam `CHANGELOG.md` yang dipatok ke tag; catatan parsial dan butir yang terpotong tidak pernah dipublikasikan. Alur kerja memilih isi lengkap atau ringkas tersebut sebelum menambahkan `### Release verification`; jika bagian akhir bukti akan melampaui batas, alur kerja mempertahankan isi kanonis dan mengandalkan bukti terlampir yang tidak dapat diubah. Rilis stabil yang dipublikasikan ke npm `latest` menjadi rilis terbaru GitHub, sedangkan rilis pemeliharaan stabil yang dipertahankan pada npm `beta` dibuat dengan GitHub `latest=false`. Alur kerja juga mengunggah bukti dependensi prapemeriksaan, manifes validasi lengkap, dan bukti verifikasi registri pascapublikasi ke rilis GitHub untuk penanganan insiden pascarilis. Alur kerja segera mencetak ID proses turunan, menyetujui secara otomatis gerbang lingkungan rilis yang diizinkan untuk disetujui oleh token alur kerja, merangkum tugas turunan yang gagal beserta bagian akhir log, membuat halaman draf rilis GitHub sejak awal dan mempromosikan aset Windows serta Android secara bersamaan dengan publikasi OpenClaw ke npm, menyelesaikan halaman rilis dan bukti dependensi setelah tahap tersebut berhasil, menunggu ClawHub setiap kali OpenClaw sedang dipublikasikan ke npm, lalu menjalankan pemverifikasi beta trusted-main serta mengunggah bukti pascapublikasi untuk rilis GitHub, paket npm, paket npm plugin terpilih, paket ClawHub terpilih, ID proses alur kerja turunan, dan ID proses NPM Telegram opsional. Pemverifikasi bootstrap ClawHub memerlukan jalur dan SHA alur kerja trusted-main yang persis, percobaan proses produsen dan terminal, SHA rilis, set paket yang diminta, tuple artefak paket yang tidak dapat diubah, serta artefak pembacaan balik registri terminal; proses release-ref lama yang berhasil tidak diterima.

   Kemudian jalankan penerimaan paket pascapublikasi terhadap paket `openclaw@YYYY.M.PATCH-beta.N` atau `openclaw@beta` yang telah dipublikasikan. Jika prarilis yang telah didorong atau dipublikasikan memerlukan perbaikan, buat nomor prarilis berikutnya yang cocok; jangan pernah menghapus atau menulis ulang yang lama.

10. Jika upaya publikasi gagal, pertahankan Release SHA tanpa perubahan kecuali kegagalan tersebut membuktikan adanya cacat produk atau log perubahan. Lanjutkan proses turunan dan artefak tidak dapat diubah yang berhasil; jangan pernah membangun ulang atau memublikasikan ulang versi paket yang telah berhasil.
11. Untuk stabil, lanjutkan hanya setelah beta atau kandidat rilis yang telah diperiksa memiliki bukti validasi yang diwajibkan. Publikasi npm stabil juga melalui `OpenClaw Release Publish`, dengan menggunakan kembali artefak prapemeriksaan yang berhasil melalui `preflight_run_id`. Kesiapan rilis macOS stabil juga memerlukan `.zip`, `.dmg`, `.dSYM.zip` yang telah dikemas, dan `appcast.xml` yang diperbarui pada `main`; alur kerja publikasi macOS memublikasikan appcast bertanda tangan ke `main` publik secara otomatis setelah aset rilis terverifikasi, atau membuka/memperbarui PR appcast jika perlindungan cabang memblokir push langsung. Kesiapan Windows Hub stabil memerlukan aset `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe`, dan `OpenClawCompanion-SHA256SUMS.txt` bertanda tangan pada rilis GitHub OpenClaw. Teruskan tag rilis `openclaw/openclaw-windows-node` bertanda tangan yang persis sebagai `windows_node_tag` dan peta digest penginstalnya yang disetujui kandidat sebagai `windows_node_installer_digests`; `OpenClaw Release Publish` mempertahankan draf rilis, mengirimkan `Windows Node Release`, dan memverifikasi ketiga aset sebelum publikasi.
12. Setelah publikasi, jalankan pemverifikasi pascapublikasi npm, E2E Telegram opsional mandiri untuk npm yang telah dipublikasikan saat Anda memerlukan bukti saluran pascapublikasi, promosi dist-tag bila diperlukan, verifikasi halaman rilis GitHub yang dihasilkan, jalankan langkah pengumuman rilis, lalu selesaikan [penutupan main stabil](#stable-main-closeout) sebelum menyatakan rilis stabil selesai.

## Penutupan main stabil

Publikasi stabil belum selesai sampai `main` memuat status rilis yang benar-benar dikirimkan.

1. Mulai dari `main` terbaru yang baru. Audit `release/YYYY.M.PATCH` terhadapnya dan forward-port perbaikan nyata yang tidak ada dalam `main`. Jangan menggabungkan secara membabi buta adaptor kompatibilitas, pengujian, atau validasi khusus rilis ke `main` yang lebih baru.
2. Untuk jalur normal, tetapkan `main` ke versi stabil yang dikirimkan. Penutupan terlambat dapat menggunakan `main` setelah nilainya berlanjut ke CalVer OpenClaw stabil yang lebih baru; jangan menurunkan versi rangkaian rilis yang telah dimulai hanya untuk menutup rilis sebelumnya. Validator tetap mewajibkan bagian log perubahan dan entri appcast yang persis dari rilis yang dikirimkan serta mencatat versi dan SHA `main` yang sebenarnya. Jalankan `pnpm release:prep` setelah setiap perubahan versi root, lalu `pnpm deps:shrinkwrap:generate`.
3. Buat bagian `## YYYY.M.PATCH` milik `CHANGELOG.md` pada `main` sama persis dengan cabang rilis yang diberi tag. Sertakan pembaruan `appcast.xml` stabil jika rilis Mac memublikasikannya.
4. Jangan tambahkan `YYYY.M.PATCH+1`, versi beta, atau bagian log perubahan mendatang yang kosong ke `main` sampai operator secara eksplisit memulai rangkaian rilis tersebut.
5. Jalankan `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, dan `OPENCLAW_TESTBOX=1 pnpm check:changed`. Lakukan push, lalu verifikasi bahwa `origin/main` memuat versi dan log perubahan yang dikirimkan sebelum menyatakan rilis stabil selesai.
6. Pertahankan variabel repositori `RELEASE_ROLLBACK_DRILL_ID` dan `RELEASE_ROLLBACK_DRILL_DATE` tetap mutakhir setelah setiap latihan rollback privat.

`OpenClaw Stable Main Closeout` dimulai dari push `main` yang memuat versi, log perubahan, dan appcast yang dikirimkan setelah publikasi stabil. Proses ini membaca bukti pascapublikasi yang tidak dapat diubah untuk mengikat tag yang dikirimkan ke proses Full Release Validation dan Publish-nya, lalu memverifikasi status main stabil, rilis, masa pemantauan stabil wajib, dan bukti performa yang bersifat memblokir. Proses ini melampirkan manifes penutupan yang tidak dapat diubah dan checksum-nya ke rilis GitHub. Pemicu push otomatis melewati rilis lama yang dibuat sebelum adanya bukti pascapublikasi yang tidak dapat diubah dan tidak pernah menganggap pelewatan tersebut sebagai penutupan yang selesai.

Penutupan lengkap memerlukan kedua aset dan checksum yang cocok. Manifes parsial memutar ulang SHA `main` dan latihan rollback yang tercatat untuk menghasilkan ulang byte yang identik, lalu melampirkan checksum yang hilang; pasangan yang tidak valid, atau checksum tanpa manifes, tetap bersifat memblokir. Proses yang dipicu push tanpa variabel repositori latihan rollback dilewati tanpa menyelesaikan penutupan; catatan latihan yang hilang atau berusia lebih dari 90 hari tetap memblokir penutupan manual berbasis bukti. Perintah pemulihan privat tetap berada dalam runbook khusus pengelola. Gunakan pengiriman manual hanya untuk memperbaiki atau memutar ulang penutupan stabil berbasis bukti.

Jika induk Release Publish gagal hanya setelah bukti npm/plugin yang tidak dapat diubah dilampirkan, perbaiki dan publikasikan terlebih dahulu setiap aset platform stabil. Kemudian pengelola dapat mengirimkan penutupan secara manual dengan `allow_failed_publish_recovery=true`; mode tersebut hanya menerima induk gagal yang telah selesai dan juga mewajibkan kontrak aset Android serta Windows yang persis, digest SHA-256 GitHub, verifikasi checksum, asal-usul Android, dan promosi Windows yang berhasil serta dikirimkan oleh induk, dengan pemeriksaan Authenticode dan digest yang disetujui kandidat cocok dengan penginstal yang dipublikasikan, beserta pemeriksaan macOS/appcast normal. Penutupan push otomatis tidak pernah mengaktifkan mode pemulihan ini.

Tag koreksi fallback lama hanya dapat menggunakan kembali bukti paket dasar jika tag koreksi tersebut mengarah ke commit sumber yang sama dengan tag stabil dasar. Rilis Android-nya menggunakan kembali APK terverifikasi milik tag dasar dan menambahkan asal-usul untuk tag koreksi. Koreksi dengan sumber berbeda harus memublikasikan dan memverifikasi bukti paketnya sendiri serta menggunakan `versionCode` Android yang lebih tinggi.

## Prapemeriksaan rilis

- Jalankan `pnpm check:test-types` sebelum prapemeriksaan rilis agar TypeScript pengujian tetap tercakup di luar gerbang lokal `pnpm check` yang lebih cepat.
- Jalankan `pnpm check:architecture` sebelum prapemeriksaan rilis agar pemeriksaan siklus impor dan batas arsitektur yang lebih luas berhasil di luar gerbang lokal yang lebih cepat.
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar artefak rilis `dist/*` yang diharapkan dan bundel Control UI tersedia untuk langkah validasi paket.
- Jalankan `pnpm release:prep` setelah kenaikan versi root dan sebelum pemberian tag. Perintah ini menjalankan setiap generator rilis deterministik yang umumnya mengalami penyimpangan setelah perubahan versi/konfigurasi/API: versi plugin, shrinkwrap npm, inventaris plugin, skema konfigurasi dasar, metadata konfigurasi saluran terbundel, baseline dokumentasi konfigurasi, ekspor SDK plugin, manifes kontrak API SDK Plugin, dan bundel lokal Control UI. `pnpm release:check` menjalankan ulang pemeriksaan tersebut dalam mode pemeriksaan (termasuk gerbang lokal zero-fallback yang ketat serta anggaran permukaan SDK plugin) dan melaporkan setiap kegagalan penyimpangan hasil generasi dalam satu proses sebelum menjalankan pemeriksaan rilis paket.
- Sinkronisasi versi plugin memperbarui paket runtime `@openclaw/ai` yang dapat dipublikasikan, versi paket plugin resmi, dan batas bawah `openclaw.compat.pluginApi` yang ada ke versi rilis OpenClaw secara default. Perlakukan bidang tersebut sebagai batas bawah API SDK/runtime plugin, bukan sekadar salinan versi paket: untuk rilis khusus plugin yang sengaja tetap kompatibel dengan host OpenClaw lama, pertahankan batas bawah pada API host terlama yang didukung dan dokumentasikan pilihan tersebut dalam bukti rilis plugin.
- Jalankan alur kerja manual `Full Release Validation` sebelum persetujuan rilis untuk memulai semua kotak pengujian prarilis dari satu titik masuk. Alur kerja ini menerima cabang, tag, atau SHA commit lengkap, mengirimkan `CI` manual, dan mengirimkan `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, pemeriksaan paket lintas OS, paritas QA Lab, Matrix, dan jalur Telegram. Proses stabil dan lengkap selalu menyertakan soak jalur rilis live/E2E dan Docker yang menyeluruh; `run_release_soak=true` dipertahankan untuk soak beta eksplisit. Package Acceptance menyediakan E2E Telegram paket kanonis selama validasi kandidat, sehingga menghindari poller live kedua yang berjalan bersamaan.

  Berikan `release_package_spec` setelah memublikasikan beta untuk menggunakan kembali paket npm yang dikirimkan di seluruh pemeriksaan rilis, Package Acceptance, dan E2E Telegram paket tanpa membangun ulang tarball rilis. Berikan `npm_telegram_package_spec` hanya jika Telegram harus menggunakan paket terpublikasi yang berbeda dari validasi rilis lainnya. Berikan `package_acceptance_package_spec` jika Package Acceptance harus menggunakan paket terpublikasi yang berbeda dari spesifikasi paket rilis. Berikan `evidence_package_spec` jika laporan bukti rilis harus membuktikan bahwa validasi cocok dengan paket npm terpublikasi tanpa memaksakan E2E Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Jalankan alur kerja manual `Package Acceptance` saat Anda memerlukan bukti melalui jalur samping untuk kandidat paket sementara pekerjaan rilis berlanjut. Gunakan `source=npm` untuk `openclaw@beta`, `openclaw@latest`, atau versi rilis yang tepat; `source=ref` untuk mengemas cabang/tag/SHA `package_ref` tepercaya dengan harness `workflow_ref` saat ini; `source=url` untuk tarball HTTPS publik dengan SHA-256 wajib dan kebijakan URL publik yang ketat; `source=trusted-url` untuk kebijakan sumber tepercaya bernama yang menggunakan `trusted_source_id` dan SHA-256 wajib; atau `source=artifact` untuk tarball yang diunggah oleh proses GitHub Actions lain.

  Alur kerja tersebut menetapkan kandidat menjadi `package-under-test`, menggunakan kembali penjadwal rilis E2E Docker terhadap tarball tersebut, dan dapat menjalankan QA Telegram terhadap tarball yang sama dengan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier`. Ketika lane Docker yang dipilih mencakup `published-upgrade-survivor`, artefak paket adalah kandidatnya dan `published_upgrade_survivor_baseline` memilih baseline yang telah dipublikasikan. `update-restart-auth` menggunakan paket kandidat sebagai CLI yang diinstal sekaligus paket yang diuji sehingga jalur mulai ulang terkelola milik perintah pembaruan kandidat turut diuji.

  Contoh:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Profil umum:
  - `smoke`: lane instalasi/channel/agen, jaringan Gateway, dan pemuatan ulang konfigurasi
  - `package`: lane paket/pembaruan/mulai ulang/Plugin yang menggunakan artefak secara langsung tanpa OpenWebUI atau ClawHub aktif
  - `product`: profil paket ditambah channel MCP, pembersihan cron/subagen, pencarian web OpenAI, dan OpenWebUI
  - `full`: bagian-bagian jalur rilis Docker dengan OpenWebUI
  - `custom`: pemilihan `docker_lanes` yang tepat untuk menjalankan ulang secara terfokus

- Jalankan alur kerja manual `CI` secara langsung saat Anda hanya memerlukan cakupan CI normal yang deterministik untuk kandidat rilis. Pemicu CI manual melewati pembatasan berdasarkan perubahan dan memaksakan shard Node Linux, shard Plugin bawaan, shard kontrak Plugin dan channel, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, serta lane i18n Control UI. Proses CI manual mandiri menjalankan Android hanya jika dipicu dengan `include_android=true`; `Full Release Validation` meneruskan input tersebut ke CI turunannya.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Jalankan `pnpm qa:otel:smoke` saat memvalidasi telemetri rilis. Proses ini menjalankan QA-lab melalui penerima OTLP/HTTP lokal dan memverifikasi ekspor trace, metrik, dan log serta atribut trace yang dibatasi dan penyamaran konten/pengidentifikasi tanpa memerlukan Opik, Langfuse, atau kolektor eksternal lainnya.
- Jalankan `pnpm qa:otel:collector-smoke` saat memvalidasi kompatibilitas kolektor. Proses ini merutekan ekspor OTLP QA-lab yang sama melalui kontainer Docker OpenTelemetry Collector sungguhan sebelum menjalankan asersi penerima lokal.
- Jalankan `pnpm qa:prometheus:smoke` saat memvalidasi scraping Prometheus yang dilindungi. Proses ini menjalankan QA-lab, menolak scraping tanpa autentikasi, dan memverifikasi bahwa kelompok metrik penting bagi rilis tetap bebas dari konten prompt, pengidentifikasi mentah, token autentikasi, dan jalur lokal.
- Jalankan `pnpm qa:observability:smoke` untuk menjalankan lane smoke OpenTelemetry dan Prometheus pada checkout sumber secara berurutan.
- Jalankan `pnpm release:check` sebelum setiap rilis bertag.
- Pra-pemeriksaan `OpenClaw NPM Release` menghasilkan bukti rilis dependensi sebelum mengemas tarball npm. Gerbang kerentanan advisory npm memblokir rilis jika gagal. Risiko manifes transitif, permukaan kepemilikan/instalasi dependensi, dan laporan perubahan dependensi hanya berfungsi sebagai bukti rilis. Laporan perubahan dependensi membandingkan kandidat rilis dengan tag rilis sebelumnya yang dapat dijangkau. Pra-pemeriksaan mengunggah bukti dependensi sebagai `openclaw-release-dependency-evidence-<tag>` dan juga menyematkannya di bawah `dependency-evidence/` dalam artefak pra-pemeriksaan npm yang telah disiapkan. Jalur publikasi sebenarnya menggunakan kembali artefak pra-pemeriksaan tersebut, lalu melampirkan bukti yang sama ke rilis GitHub sebagai `openclaw-<version>-dependency-evidence.zip`.
- Jalankan `OpenClaw Release Publish` untuk urutan publikasi yang mengubah keadaan setelah tag tersedia. Picu publikasi beta dan stabil reguler dari `main` tepercaya; tag rilis tetap memilih commit target yang tepat dan dapat mengarah ke dalam `release/YYYY.M.PATCH`. Publikasi alfa Tideclaw tetap berada di cabang alfa yang sesuai. Berikan `preflight_run_id` npm OpenClaw yang berhasil, `full_release_validation_run_id` yang berhasil, dan `full_release_validation_run_attempt` yang tepat, serta pertahankan cakupan publikasi Plugin default `all-publishable` kecuali Anda sengaja menjalankan perbaikan terfokus. Alur kerja menjalankan publikasi npm Plugin, publikasi ClawHub Plugin, dan publikasi npm OpenClaw secara berurutan agar paket inti tidak dipublikasikan sebelum Plugin yang telah dieksternalisasi; promosi Windows dan Android berjalan bersamaan dengan publikasi npm inti terhadap halaman draf rilis. Publikasi yang dijalankan ulang dapat dilanjutkan: versi npm inti yang telah dipublikasikan akan melewati pemicu inti setelah alur kerja membuktikan bahwa tarball registri cocok dengan artefak pra-pemeriksaan tag, dan promosi Windows/Android dilewati ketika rilis sudah memiliki kontrak artefak yang terverifikasi, sehingga percobaan ulang hanya mengulangi tahap yang gagal. Perbaikan terfokus khusus Plugin memerlukan `plugin_publish_scope=selected` dan daftar Plugin yang tidak kosong. Proses `all-publishable` khusus Plugin memerlukan bukti pra-pemeriksaan dan Validasi Rilis Penuh yang lengkap serta tidak dapat diubah; bukti parsial ditolak.
- `OpenClaw Release Publish` stabil memerlukan `windows_node_tag` yang tepat setelah rilis `openclaw/openclaw-windows-node` non-prarilis yang sesuai tersedia, serta peta `windows_node_installer_digests` yang telah disetujui untuk kandidat. Sebelum memicu turunan publikasi apa pun, proses ini memverifikasi bahwa rilis sumber tersebut telah dipublikasikan, bukan prarilis, berisi penginstal x64/ARM64 yang diwajibkan, dan masih cocok dengan peta yang telah disetujui tersebut. Kemudian proses ini memicu `Windows Node Release` saat rilis OpenClaw masih berupa draf, dengan membawa peta digest penginstal yang telah ditetapkan tanpa perubahan. Alur kerja turunan mengunduh penginstal Windows Hub yang telah ditandatangani dari tag yang tepat tersebut, mencocokkannya dengan digest yang telah ditetapkan, memverifikasi pada runner Windows bahwa tanda tangan Authenticode menggunakan penanda tangan OpenClaw Foundation yang diharapkan, menulis manifes SHA-256, dan mengunggah penginstal beserta manifes ke rilis GitHub OpenClaw kanonis, lalu mengunduh kembali artefak yang dipromosikan dan memverifikasi keanggotaan manifes serta hash-nya. Induk memverifikasi kontrak artefak x64, ARM64, dan checksum saat ini sebelum publikasi. Pemulihan langsung menolak nama artefak `OpenClawCompanion-*` yang tidak diharapkan sebelum mengganti artefak kontrak yang diharapkan dengan byte sumber yang telah ditetapkan.

  Picu `Windows Node Release` secara manual hanya untuk pemulihan, dan selalu berikan tag yang tepat, jangan pernah `latest`, serta peta JSON `expected_installer_digests` eksplisit dari rilis sumber yang telah disetujui. Tautan unduhan situs web harus mengarah ke URL artefak rilis OpenClaw yang tepat untuk rilis stabil saat ini, atau `releases/latest/download/...` hanya setelah memverifikasi bahwa pengalihan latest GitHub mengarah ke rilis yang sama; jangan hanya menautkan ke halaman rilis repositori pendamping.

- Pemeriksaan rilis kini dijalankan dalam alur kerja manual terpisah: `OpenClaw Release Checks`. Alur ini juga menjalankan lane paritas mock QA Lab serta profil rilis Matrix dan lane QA Telegram sebelum persetujuan rilis. Lane live menggunakan lingkungan `qa-live-shared`; Telegram juga menggunakan sewa kredensial CI Convex. Jalankan alur kerja manual `QA-Lab - All Lanes` dengan `matrix_profile=all` jika Anda menginginkan setiap skenario Matrix yang dipelihara; alur kerja menyebarkan pilihan tersebut ke seluruh profil transportasi, media, dan E2EE agar pembuktian penuh tetap berada dalam batas waktu per job.
- Validasi runtime penginstalan dan peningkatan lintas OS merupakan bagian dari `OpenClaw Release Checks` dan `Full Release Validation` publik, yang memanggil alur kerja yang dapat digunakan kembali `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` secara langsung. Pemisahan ini disengaja: menjaga jalur rilis npm yang sebenarnya tetap singkat, deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di lane tersendiri agar tidak menunda atau memblokir publikasi.
- Pemeriksaan rilis yang memuat rahasia harus dipicu melalui `Full Release Validation` atau dari ref alur kerja `main`/release agar logika alur kerja dan rahasia tetap terkendali.
- `OpenClaw Release Checks` menerima cabang, tag, atau SHA commit lengkap selama commit yang dihasilkan dapat dijangkau dari cabang atau tag rilis OpenClaw.
- Prapemeriksaan khusus validasi `OpenClaw NPM Release` juga menerima SHA commit 40 karakter lengkap dari cabang alur kerja saat ini tanpa memerlukan tag yang telah didorong. Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi yang sebenarnya. Dalam mode SHA, alur kerja menyintesis `v<package.json version>` hanya untuk pemeriksaan metadata paket; publikasi sebenarnya tetap memerlukan tag rilis yang sebenarnya.
- Kedua alur kerja mempertahankan jalur publikasi dan promosi yang sebenarnya pada runner yang dihosting GitHub, sementara jalur validasi yang tidak melakukan mutasi dapat menggunakan runner Linux Blacksmith yang lebih besar.
- Alur kerja tersebut menjalankan `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` menggunakan kedua rahasia alur kerja `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`.
- Prapemeriksaan rilis npm tidak lagi menunggu lane pemeriksaan rilis yang terpisah.
- Sebelum menandai kandidat rilis secara lokal, jalankan `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Helper tersebut menjalankan batas pengaman rilis cepat, pemeriksaan rilis npm/ClawHub Plugin, build, build UI, dan `release:openclaw:npm:check` dalam urutan yang mendeteksi kesalahan umum yang memblokir persetujuan sebelum alur kerja publikasi GitHub dimulai.
- Jalankan `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (atau tag prarilis/koreksi yang sesuai) sebelum persetujuan.
- Setelah publikasi npm, jalankan `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur penginstalan registri yang telah dipublikasikan dalam prefiks sementara yang baru.
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` untuk memverifikasi onboarding paket terinstal, penyiapan Telegram, dan E2E Telegram sebenarnya terhadap paket npm yang telah dipublikasikan menggunakan kumpulan kredensial Telegram sewaan bersama. Proses satu kali oleh pengelola lokal dapat menghilangkan variabel Convex dan meneruskan ketiga kredensial lingkungan `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Untuk menjalankan smoke beta pascapublikasi lengkap dari mesin pengelola, gunakan `pnpm release:beta-smoke -- --beta betaN`. Helper tersebut menjalankan validasi pembaruan npm/target baru Parallels, memicu `NPM Telegram Beta E2E`, melakukan polling terhadap eksekusi alur kerja yang tepat, mengunduh artefak, dan mencetak laporan Telegram.
- Pengelola dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui alur kerja manual `NPM Telegram Beta E2E`. Alur ini sengaja hanya manual dan tidak dijalankan pada setiap penggabungan.
- Otomatisasi rilis pengelola menggunakan prapemeriksaan-lalu-promosi:
  - Publikasi npm yang sebenarnya harus melewati `preflight_run_id` npm yang berhasil.
  - Orkestrasi publikasi beta dan stabil reguler serta prapemeriksaannya menggunakan `main` tepercaya terhadap tag target yang tepat. Publikasi dan prapemeriksaan alfa Tideclaw menggunakan cabang alfa yang sesuai.
  - Rilis npm stabil secara default menggunakan `beta`; publikasi npm stabil dapat menargetkan `latest` secara eksplisit melalui input alur kerja.
  - Mutasi dist-tag npm berbasis token berada di `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` karena `npm dist-tag add` masih memerlukan `NPM_TOKEN`, sedangkan repo sumber tetap menggunakan publikasi khusus OIDC.
  - `macOS Release` publik hanya untuk validasi; ketika tag hanya berada pada cabang rilis tetapi alur kerja dipicu dari `main`, atur `public_release_branch=release/YYYY.M.PATCH`.
  - Publikasi macOS yang sebenarnya harus melewati `preflight_run_id` dan `validate_run_id` macOS yang berhasil.
  - Jalur publikasi yang sebenarnya mempromosikan artefak yang telah disiapkan alih-alih membangunnya kembali.
- Untuk rilis koreksi stabil seperti `YYYY.M.PATCH-N`, pemverifikasi pascapublikasi juga memeriksa jalur peningkatan dengan prefiks sementara yang sama dari `YYYY.M.PATCH` ke `YYYY.M.PATCH-N` agar koreksi rilis tidak secara diam-diam membiarkan penginstalan global lama tetap menggunakan payload stabil dasar.
- Prapemeriksaan rilis npm gagal secara tertutup kecuali tarball menyertakan `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong, agar dasbor browser kosong tidak dikirim lagi.
- Verifikasi pascapublikasi juga memeriksa bahwa entrypoint Plugin yang dipublikasikan dan metadata paket tersedia dalam tata letak registri yang terinstal. Rilis yang dikirim tanpa payload runtime Plugin akan menggagalkan pemverifikasi pascapublikasi dan tidak dapat dipromosikan ke `latest`.
- `pnpm test:install:smoke` juga memberlakukan anggaran npm pack `unpackedSize` pada tarball pembaruan kandidat, sehingga e2e penginstal mendeteksi pembengkakan pack yang tidak disengaja sebelum jalur publikasi rilis.
- Jika pekerjaan rilis menyentuh perencanaan CI, manifes waktu ekstensi, atau matriks pengujian ekstensi, buat ulang dan tinjau keluaran matriks `plugin-prerelease-extension-shard` milik perencana dari `.github/workflows/plugin-prerelease.yml` sebelum persetujuan agar catatan rilis tidak mendeskripsikan tata letak CI yang kedaluwarsa.
- Kesiapan rilis macOS stabil juga mencakup permukaan pembaru: rilis GitHub pada akhirnya harus memiliki `.zip`, `.dmg`, dan `.dSYM.zip` yang telah dipaketkan; `appcast.xml` pada `main` harus mengarah ke zip stabil baru setelah publikasi (alur kerja publikasi macOS melakukan commit secara otomatis, atau membuka PR appcast ketika push langsung diblokir); aplikasi yang dipaketkan harus mempertahankan id bundle non-debug, URL feed Sparkle yang tidak kosong, dan `CFBundleVersion` yang sama dengan atau di atas batas minimum build Sparkle kanonis untuk versi rilis tersebut.

## Kotak pengujian rilis

`Full Release Validation` adalah cara operator memulai matriks produk lengkap dari satu entrypoint. Gunakan helper agar setiap alur kerja anak dijalankan dari cabang sementara yang ditetapkan pada satu SHA alur kerja `main` tepercaya, sementara commit yang diminta tetap menjadi kandidat yang diuji:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

Helper mengambil `origin/main` saat ini, mendorong `release-ci/<workflow-sha>-...` pada commit alur kerja tepercaya tersebut, menyimpulkan `beta` dari versi paket alfa/beta dan `stable` untuk versi lainnya, memicu `Full Release Validation` dari cabang sementara dengan `ref=<target-sha>`, memverifikasi bahwa setiap `headSha` alur kerja anak cocok dengan SHA alur kerja induk yang disematkan, lalu menghapus cabang sementara. Teruskan `-f reuse_evidence=false` untuk memaksa eksekusi baru, `-f release_profile=full` untuk pemeriksaan advisori yang luas, atau `--workflow-sha <trusted-main-sha>` untuk menyematkan commit lama yang masih dapat dijangkau dari `origin/main` saat ini. Alur kerja itu sendiri tidak pernah menulis ref repositori. Hal ini menjaga ketersediaan perkakas rilis khusus main tanpa menambahkan commit perkakas ke kandidat dan menghindari pembuktian eksekusi anak `main` yang lebih baru secara tidak sengaja.

Setelah SHA Kode berstatus hijau, lakukan commit hanya pada `CHANGELOG.md` dan jalankan helper yang sama dengan SHA Rilis:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

Induk kedua menggunakan kembali bukti produk hanya ketika GitHub membuktikan bahwa SHA Rilis merupakan turunan dari SHA Kode dan kumpulan jalur yang berubah secara lengkap tepat sama dengan `CHANGELOG.md`. Induk tersebut mencatat `changelog-only-release-v1` dan tidak memicu proses anak produk apa pun. Prapemeriksaan npm serta penerimaan paket/penginstalan tetap dijalankan pada SHA Rilis karena byte tarball-nya berubah.

Untuk SHA Kode baru, alur kerja menyelesaikan target, memicu `CI` manual, lalu memicu `OpenClaw Release Checks`. `OpenClaw Release Checks` menyebarkan smoke penginstalan, pemeriksaan rilis lintas OS, cakupan jalur rilis Docker live/E2E ketika soak diaktifkan, Penerimaan Paket dengan E2E paket Telegram kanonis, paritas QA Lab, Matrix live, dan Telegram live. Eksekusi penuh/semua hanya dapat diterima ketika ringkasan `Full Release Validation` menunjukkan `normal_ci`, `plugin_prerelease`, dan `release_checks` berhasil, kecuali eksekusi ulang terfokus sengaja melewati anak `Plugin Prerelease` yang terpisah. Gunakan anak mandiri `npm-telegram` hanya untuk eksekusi ulang terfokus paket yang telah dipublikasikan dengan `release_package_spec` atau `npm_telegram_package_spec`. Ringkasan pemverifikasi akhir mencakup tabel job paling lambat untuk setiap eksekusi anak, sehingga pengelola rilis dapat melihat jalur kritis saat ini tanpa mengunduh log.

Anak kinerja produk hanya menghasilkan artefak dalam jalur rilis ini. Alur
payung memicunya dengan `publish_reports=false`, dan validasi ditolak
kecuali batas pengaman khusus artefaknya membuktikan bahwa penerbit laporan Clawgrit tetap
dilewati.

Lihat [Validasi rilis lengkap](/id/reference/full-release-validation) untuk matriks tahap lengkap, nama job alur kerja yang tepat, perbedaan profil stabil dengan penuh, artefak, dan penanganan eksekusi ulang terfokus.

Alur kerja anak dipicu dari ref tepercaya yang disematkan ke SHA yang menjalankan `Full Release Validation`. Setiap eksekusi anak harus menggunakan SHA alur kerja induk yang tepat. Jangan gunakan pemicu `--ref main -f ref=<sha>` mentah untuk bukti rilis; gunakan `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Gunakan `release_profile` untuk memilih cakupan live/penyedia:

- `beta`: jalur live dan Docker OpenAI/inti kritis-rilis tercepat
- `stable`: cakupan penyedia/backend beta plus stabil untuk persetujuan rilis
- `full`: cakupan advisori penyedia/media stabil plus luas

Validasi stabil dan penuh selalu menjalankan pemeriksaan live/E2E menyeluruh, jalur rilis Docker, dan penyintas peningkatan terpublikasi yang dibatasi sebelum promosi. Gunakan `run_release_soak=true` untuk meminta pemeriksaan yang sama bagi beta. Pemeriksaan tersebut mencakup empat paket stabil terbaru serta baseline `2026.4.23` dan `2026.5.2` yang disematkan beserta cakupan `2026.4.15` yang lebih lama, dengan baseline duplikat dihapus dan setiap baseline dibagi ke dalam job runner Docker tersendiri.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk menyelesaikan ref target satu kali sebagai `release-package-under-test` dan menggunakan kembali artefak tersebut dalam pemeriksaan lintas OS, Penerimaan Paket, dan jalur rilis Docker ketika soak dijalankan. Hal ini menjaga semua kotak yang berhadapan dengan paket tetap menggunakan byte yang sama dan menghindari build paket berulang. Setelah beta tersedia di npm, atur `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` agar pemeriksaan rilis mengunduh paket yang dikirim satu kali, mengekstrak SHA sumber build-nya dari `dist/build-info.json`, dan menggunakan kembali artefak tersebut untuk lane lintas OS, Penerimaan Paket, jalur rilis Docker, dan Telegram paket.

Smoke penginstalan OpenAI lintas OS menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` ketika variabel repo/organisasi ditetapkan, dan jika tidak menggunakan `openai/gpt-5.6-luna`, karena lane ini membuktikan penginstalan paket, onboarding, startup Gateway, dan satu giliran agen live, bukan membandingkan kinerja model yang paling mumpuni. Matriks penyedia live yang lebih luas tetap menjadi tempat untuk cakupan khusus model.

Gunakan varian berikut bergantung pada tahap rilis:

```bash
# Validasi Code SHA dengan produk lengkap.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Validasi Release SHA yang hanya berisi changelog dengan menggunakan kembali bukti produk Code SHA.
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

Jangan gunakan payung lengkap sebagai pengulangan pertama setelah perbaikan terfokus. Jika satu kotak gagal, gunakan workflow turunan, job, lane Docker, profil paket, penyedia model, atau lane QA yang gagal untuk pembuktian berikutnya. Jalankan kembali payung lengkap hanya jika perbaikan mengubah orkestrasi rilis bersama atau membuat bukti semua kotak sebelumnya menjadi kedaluwarsa. Verifikator akhir payung memeriksa ulang id proses workflow turunan yang tercatat, jadi setelah workflow turunan berhasil dijalankan ulang, jalankan ulang hanya job induk `Verify full validation` yang gagal.

`rerun_group=all` dapat menggunakan kembali proses payung hijau sebelumnya ketika profil rilis,
pengaturan soak efektif, dan input validasi cocok serta SHA target
identik atau target baru merupakan turunannya dengan kumpulan lengkap jalur yang berubah
tepat `CHANGELOG.md`. Penggunaan kembali target yang sama persis mencatat
`exact-target-full-validation-v1`; Release SHA pascavalidasi mencatat
`changelog-only-release-v1`. Yang terakhir hanya menggunakan kembali validasi produk. Preflight
npm, byte paket, asal-usul catatan rilis, serta penerimaan instalasi/pembaruan
tetap harus dijalankan terhadap Release SHA. Setiap perubahan target yang dimiliki versi, sumber, hasil generasi,
dependensi, paket, atau workflow memerlukan Code SHA baru
dan validasi lengkap baru. Proses payung yang lebih baru untuk ref `release/*` dan
grup pengulangan yang sama secara otomatis menggantikan proses yang sedang berlangsung. Teruskan
`reuse_evidence=false` untuk memaksa proses lengkap baru.

Untuk pemulihan terbatas, teruskan `rerun_group` ke payung. `all` adalah proses kandidat rilis yang sebenarnya, `ci` hanya menjalankan turunan CI normal, `plugin-prerelease` hanya menjalankan turunan Plugin khusus rilis, `release-checks` menjalankan setiap kotak rilis, dan grup rilis yang lebih sempit adalah `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, dan `npm-telegram`. Pengulangan `npm-telegram` yang terfokus memerlukan `release_package_spec` atau `npm_telegram_package_spec`; proses lengkap/semua menggunakan E2E Telegram paket kanonis di dalam Package Acceptance. Pengulangan lintas-OS yang terfokus dapat menambahkan `cross_os_suite_filter=windows/packaged-upgrade` atau filter OS/rangkaian lain. Kegagalan pemeriksaan rilis QA memblokir validasi rilis normal, termasuk penyimpangan alat dinamis OpenClaw yang diwajibkan dalam tingkat standar. Proses alfa Tideclaw masih dapat memperlakukan lane pemeriksaan rilis yang tidak terkait dengan keamanan paket sebagai rekomendasi. Dengan `release_profile=beta`, rangkaian penyedia langsung `Run repo/live E2E validation` bersifat rekomendasi (peringatan, bukan pemblokir); profil stabil dan lengkap tetap menjadikannya pemblokir. Ketika `live_suite_filter` secara eksplisit meminta lane langsung QA berpagar seperti Discord, WhatsApp, atau Slack, variabel repo `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` yang sesuai harus diaktifkan; jika tidak, pengambilan input gagal alih-alih melewati lane secara diam-diam.

### Vitest

Kotak Vitest adalah workflow turunan manual `CI`. CI manual sengaja melewati pembatasan cakupan perubahan dan memaksa grafik pengujian normal untuk kandidat rilis: shard Linux Node, shard Plugin terbundel, shard kontrak Plugin dan saluran, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak hasil build, pemeriksaan dokumentasi, Skills Python, Windows, macOS, dan i18n Control UI. Android disertakan ketika `Full Release Validation` menjalankan kotak karena payung meneruskan `include_android=true`; CI manual mandiri memerlukan `include_android=true` untuk cakupan Android.

Gunakan kotak ini untuk menjawab "apakah pohon sumber lulus rangkaian pengujian normal lengkap?" Ini tidak sama dengan validasi produk jalur rilis. Bukti yang perlu disimpan:

- Ringkasan `Full Release Validation` yang menampilkan URL proses `CI` yang dikirim
- Proses `CI` hijau pada SHA target yang persis sama
- Nama shard yang gagal atau lambat dari job CI ketika menyelidiki regresi
- Artefak waktu Vitest seperti `.artifacts/vitest-shard-timings.json` ketika suatu proses memerlukan analisis kinerja

Jalankan CI manual secara langsung hanya ketika rilis memerlukan CI normal deterministik tetapi tidak memerlukan kotak Docker, QA Lab, langsung, lintas-OS, atau paket. Gunakan perintah pertama untuk CI langsung non-Android. Tambahkan `include_android=true` ketika CI kandidat rilis langsung harus mencakup Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Kotak Docker berada di `OpenClaw Release Checks` hingga `openclaw-live-and-e2e-checks-reusable.yml`, ditambah workflow mode rilis `install-smoke`. Kotak ini memvalidasi kandidat rilis melalui lingkungan Docker terpaket, bukan hanya pengujian tingkat sumber.

Cakupan Docker rilis meliputi:

- Smoke instalasi lengkap dengan smoke instalasi global Bun yang lambat diaktifkan
- Persiapan/penggunaan kembali citra smoke Dockerfile root berdasarkan SHA target, dengan job smoke QR, root/gateway, dan penginstal/Bun berjalan sebagai shard smoke instalasi terpisah
- Lane E2E repositori
- Potongan Docker jalur rilis: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hingga `plugins-runtime-install-h`, dan `openwebui`
- Cakupan OpenWebUI pada runner khusus dengan disk besar ketika diminta
- Lane instalasi/penghapusan terpisah untuk Plugin terbundel `bundled-plugin-install-uninstall-0` hingga `bundled-plugin-install-uninstall-23`
- Rangkaian penyedia langsung/E2E dan cakupan model langsung Docker ketika pemeriksaan rilis mencakup rangkaian langsung

Gunakan artefak Docker sebelum menjalankan ulang. Penjadwal jalur rilis mengunggah `.artifacts/docker-tests/` dengan log lane, `summary.json`, `failures.json`, waktu fase, JSON rencana penjadwal, dan perintah pengulangan. Untuk pemulihan terfokus, gunakan `docker_lanes=<lane[,lane]>` pada workflow langsung/E2E yang dapat digunakan kembali, alih-alih menjalankan ulang semua potongan rilis. Perintah pengulangan yang dihasilkan menyertakan `package_artifact_run_id` sebelumnya dan input citra Docker yang telah disiapkan jika tersedia, sehingga lane yang gagal dapat menggunakan kembali tarball dan citra GHCR yang sama.

### QA Lab

Kotak QA Lab juga merupakan bagian dari `OpenClaw Release Checks`. Kotak ini adalah gerbang rilis perilaku agen dan tingkat saluran, terpisah dari mekanisme paket Vitest dan Docker.

Cakupan QA Lab rilis meliputi:

- Lane paritas tiruan yang membandingkan lane kandidat OpenAI dengan garis dasar `anthropic/claude-opus-4-8` menggunakan paket paritas agen
- Profil rilis adaptor langsung Matrix menggunakan lingkungan `qa-live-shared`
- Lane QA Telegram langsung menggunakan sewa kredensial Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke`, atau `pnpm qa:observability:smoke` ketika telemetri rilis memerlukan bukti lokal eksplisit

Gunakan kotak ini untuk menjawab "apakah rilis berperilaku dengan benar dalam skenario QA dan alur saluran langsung?" Simpan URL artefak untuk lane paritas, Matrix, dan Telegram ketika menyetujui rilis. Cakupan Matrix lengkap tetap tersedia sebagai proses QA Lab manual yang dibagi menjadi beberapa shard, bukan sebagai lane kritis rilis default.

### Paket

Kotak Paket adalah gerbang produk yang dapat diinstal. Kotak ini didukung oleh `Package Acceptance` dan resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver menormalisasi kandidat menjadi tarball `package-under-test` yang digunakan oleh E2E Docker, memvalidasi inventaris paket, mencatat versi paket dan SHA-256, serta menjaga ref harness workflow tetap terpisah dari ref sumber paket.

Sumber kandidat yang didukung:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang persis sama
- `source=ref`: kemas branch, tag, atau SHA commit lengkap `package_ref` tepercaya dengan harness `workflow_ref` yang dipilih
- `source=url`: unduh `.tgz` HTTPS publik dengan `package_sha256` yang diwajibkan; kredensial URL, port HTTPS nondefault, nama host atau alamat hasil resolusi yang privat/internal/penggunaan khusus, dan pengalihan yang tidak aman akan ditolak
- `source=trusted-url`: unduh `.tgz` HTTPS dengan `package_sha256` dan `trusted_source_id` yang diwajibkan dari kebijakan bernama dalam `.github/package-trusted-sources.json`; gunakan ini untuk cermin perusahaan milik pengelola atau repositori paket privat, alih-alih menambahkan pintasan jaringan privat tingkat input ke `source=url`
- `source=artifact`: gunakan kembali `.tgz` yang diunggah oleh proses GitHub Actions lain

`OpenClaw Release Checks` menjalankan Package Acceptance dengan `source=artifact`, artefak paket rilis yang telah disiapkan, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance mempertahankan migrasi, pembaruan, peningkatan VPS yang dikelola root, pemulaian ulang pembaruan dengan autentikasi terkonfigurasi, instalasi skill ClawHub langsung, pembersihan dependensi Plugin usang, fixture Plugin luring, pembaruan Plugin, penguatan escape pengikatan perintah Plugin, dan QA paket Telegram terhadap tarball hasil resolusi yang sama. Pemeriksaan rilis yang memblokir menggunakan garis dasar paket terbaru yang telah diterbitkan secara default; profil beta dengan `run_release_soak=true`, `release_profile=stable`, atau `release_profile=full` memperluas penyisiran penyintas peningkatan versi yang telah diterbitkan ke `last-stable-4` ditambah garis dasar `2026.4.23`, `2026.5.2`, dan `2026.4.15` yang disematkan dengan skenario `reported-issues`. Gunakan Package Acceptance dengan `source=npm` untuk kandidat yang telah dirilis, `source=ref` untuk tarball npm lokal berbasis SHA sebelum penerbitan, `source=trusted-url` untuk cermin perusahaan/privat milik pengelola, atau `source=artifact` untuk tarball yang telah disiapkan dan diunggah oleh proses GitHub Actions lain.

Ini merupakan pengganti asli GitHub untuk sebagian besar cakupan paket/pembaruan yang sebelumnya memerlukan Parallels. Pemeriksaan rilis lintas-OS tetap penting untuk orientasi awal, penginstal, dan perilaku platform khusus OS, tetapi validasi produk paket/pembaruan sebaiknya mengutamakan Package Acceptance.

Daftar periksa kanonis untuk validasi pembaruan dan Plugin adalah [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins). Gunakan ini ketika menentukan lane lokal, Docker, Package Acceptance, atau pemeriksaan rilis mana yang membuktikan perubahan instalasi/pembaruan Plugin, pembersihan doctor, atau migrasi paket yang telah diterbitkan. Migrasi pembaruan lengkap dari setiap paket stabil `2026.4.23+` adalah workflow manual `Update Migration` yang terpisah, bukan bagian dari CI Rilis Lengkap.

Kelonggaran Package Acceptance lama sengaja dibatasi waktunya. Paket hingga `2026.4.25` dapat menggunakan jalur kompatibilitas untuk kesenjangan metadata yang sudah diterbitkan ke npm: entri inventaris QA privat yang tidak ada dalam tarball, `gateway install --wrapper` yang tidak ada, file patch yang tidak ada dalam fixture git turunan tarball, `update.channel` tersimpan yang tidak ada, lokasi catatan instalasi Plugin lama, persistensi catatan instalasi marketplace yang tidak ada, dan migrasi metadata konfigurasi selama `plugins update`. Paket `2026.4.26` yang telah diterbitkan dapat memperingatkan tentang file stempel metadata build lokal yang sudah dirilis. Paket yang lebih baru harus memenuhi kontrak paket modern; kesenjangan yang sama menyebabkan validasi rilis gagal.

Gunakan profil Package Acceptance yang lebih luas ketika pertanyaan rilis berkaitan dengan paket nyata yang dapat diinstal:

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
- `package`: kontrak instalasi/pembaruan/mulai ulang/paket plugin ditambah bukti instalasi Skills ClawHub langsung; ini adalah default pemeriksaan rilis
- `product`: `package` ditambah channel MCP, pembersihan cron/subagen, pencarian web OpenAI, dan OpenWebUI
- `full`: bagian-bagian jalur rilis Docker dengan OpenWebUI
- `custom`: daftar `docker_lanes` yang persis untuk pengulangan proses yang terfokus

Untuk bukti Telegram kandidat paket, aktifkan `telegram_mode=mock-openai` atau `telegram_mode=live-frontier` pada Penerimaan Paket. Alur kerja meneruskan tarball `package-under-test` yang telah ditetapkan ke jalur Telegram; alur kerja Telegram mandiri tetap menerima spesifikasi npm yang telah dipublikasikan untuk pemeriksaan pascapublikasi.

## Otomatisasi publikasi rilis reguler

Untuk publikasi beta, `latest`, plugin, GitHub Release, dan platform,
`OpenClaw Release Publish` adalah titik masuk normal yang melakukan mutasi. Jalur extended-stable bulanan
`.33+` khusus npm tidak menggunakan orkestrator ini. Alur kerja
reguler mengorkestrasi alur kerja penerbit tepercaya dalam urutan yang
diperlukan rilis:

1. Checkout tag rilis dan tetapkan SHA commit-nya.
2. Verifikasi bahwa tag dapat dijangkau dari `main` atau `release/*` (atau cabang alfa Tideclaw untuk prarilis alfa).
3. Jalankan `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` dengan `publish_scope=all-publishable` dan `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` dengan cakupan dan SHA yang sama.
6. Dispatch `OpenClaw NPM Release` dengan tag rilis, dist-tag npm, dan `preflight_run_id` tersimpan setelah memverifikasi `full_release_validation_run_id` tersimpan dan percobaan proses yang persis.
7. Untuk rilis stabil, buat atau perbarui rilis GitHub sebagai draf, dispatch `Windows Node Release` dengan `windows_node_tag` eksplisit dan `windows_node_installer_digests` yang disetujui kandidat, lalu verifikasi aset penginstal/checksum Windows kanonis. Dispatch juga `Android Release` untuk membangun APK bertanda tangan dengan tag persis beserta checksum dan asal-usulnya. Verifikasi kedua kontrak aset native sebelum memublikasikan draf.

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

Gunakan alur kerja tingkat rendah `Plugin NPM Release` dan `Plugin ClawHub Release` hanya untuk pekerjaan perbaikan atau publikasi ulang yang terfokus. `OpenClaw Release Publish` menolak `plugin_publish_scope=selected` ketika `publish_openclaw_npm=true` agar paket inti tidak dapat dirilis tanpa setiap plugin resmi yang dapat dipublikasikan, termasuk `@openclaw/diffs-language-pack`. Untuk perbaikan plugin yang dipilih, tetapkan `publish_openclaw_npm=false` dengan `plugin_publish_scope=selected` dan `plugins=@openclaw/name`, atau dispatch alur kerja turunan secara langsung.

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

Validasi pra-tag memerlukan `dry_run=true`, menolak input tag rilis dan proses induk,
serta hanya menerima target persis yang dapat dijangkau dari `main` atau `release/*`.
Proses ini tidak memuat kredensial ClawHub, memublikasikan byte paket, atau mengubah konfigurasi
penerbit tepercaya. Alur kerja tetap menetapkan rencana registri aktif,
melakukan checkout dan mengemas target hanya dalam tugas tanpa rahasia, menyiapkan
toolchain ClawHub yang dikunci, serta memvalidasi artefak kekal dan slug/identitas
paket sebelum tag rilis tersedia. Setujui lingkungan
`clawhub-plugin-bootstrap` hanya setelah tugas pengemasan tanpa rahasia
selesai; tugas validasi terlindungi ini tidak memiliki kredensial atau perintah mutasi.

Dry run yang disetujui atau bootstrap nyata setelah pemberian tag harus menyertakan
tag rilis persis beserta id proses, percobaan, dan cabang `OpenClaw Release Publish`
induk. Induk mengesahkan SHA alur kerjanya sendiri dan SHA `main`
tepercaya persis yang terpisah untuk `Plugin ClawHub New`; proses turunan dan setiap persetujuan
lingkungan terlindungi harus cocok dengan SHA turunan yang disetujui tersebut. Tag rilis
diperiksa ulang sebelum setiap upaya publikasi dan mutasi penerbit tepercaya.

Tugas pengemasan
mengunggah satu artefak kekal yang nama, ID/digest artefak Actions,
proses/percobaan produsen, SHA target, serta SHA-256/ukuran tarball per paketnya
diteruskan ke tugas validasi dan tugas terlindungi. Tugas terlindungi hanya melakukan checkout tooling `main`
tepercaya, memvalidasi tuple artefak melalui API GitHub, mengunduh
berdasarkan ID artefak persis, menghitung ulang hash setiap tarball, serta memvalidasi jalur TAR lokal dan
identitas paket dengan aturan kanonisasi USTAR milik CLI yang disematkan. Setiap
kandidat kemudian melewati dry run publikasi CLI yang disematkan, yang selesai sebelum
pencarian registri atau autentikasi. Prapenyaringan tugas kredensial membatasi ClawPack terkompresi
hingga 120 MiB, total muatan file hingga 50 MiB, data TAR yang diperluas hingga 64 MiB, dan
jumlah entri TAR hingga 10,000. Perbaikan penerbit tepercaya untuk paket yang sudah ada tetap
hanya-konfigurasi, tetapi proses ini tetap mengemas target dan mewajibkan tag yang diminta
beserta kesamaan persis byte registri dan metadata sebelum mengubah konfigurasi penerbit
tepercaya. Verifikasi pascapublikasi mengunduh artefak ClawHub dan
mewajibkan SHA-256 serta ukuran yang sama. Pemulihan pengulangan proses yang gagal dapat menggunakan kembali
artefak paket dari percobaan sebelumnya hanya jika tugas produsen yang persis selesai
dengan sukses. Bukti akhir juga mengikat versi ClawHub yang dikunci, SHA-256
kunci, dan integritas npm. Ketidakcocokan memerlukan versi paket baru.

## Input alur kerja NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1`, atau `v2026.4.2-alpha.1`; ketika `preflight_only=true`, nilainya juga dapat berupa SHA commit cabang alur kerja 40 karakter penuh saat ini untuk preflight khusus validasi
- `preflight_only`: `true` hanya untuk validasi/build/paket, `false` untuk jalur publikasi nyata
- `preflight_run_id`: id proses preflight sukses yang sudah ada, diperlukan pada jalur publikasi nyata agar alur kerja menggunakan kembali tarball yang telah disiapkan alih-alih membangunnya ulang
- `full_release_validation_run_id`: id proses `Full Release Validation` yang sukses untuk tag/SHA ini, diperlukan untuk publikasi nyata. Publikasi beta dapat dilanjutkan hanya dengan preflight disertai peringatan, tetapi promosi stabil/`latest` tetap memerlukannya.
- `full_release_validation_run_attempt`: percobaan proses positif persis yang dipasangkan dengan `full_release_validation_run_id`; diperlukan setiap kali id proses diberikan agar pengulangan proses tidak dapat mengubah bukti otorisasi selama publikasi.
- `release_publish_run_id`: id proses `OpenClaw Release Publish` yang disetujui; diperlukan ketika alur kerja ini didispatch oleh induk tersebut (panggilan publikasi nyata oleh aktor bot)
- `plugin_npm_run_id`: id proses `Plugin NPM Release` exact-head yang sukses; diperlukan untuk publikasi inti `extended-stable` yang nyata
- `npm_dist_tag`: tag target npm untuk jalur publikasi; menerima `alpha`, `beta`, `latest`, atau `extended-stable` dan default-nya adalah `beta`. Patch final `33` dan yang lebih baru harus menggunakan `extended-stable`; secara default, `extended-stable` menolak patch yang lebih lama, dan selalu menolak tag nonfinal.
- `bypass_extended_stable_guard`: boolean khusus pengujian, default `false`; dengan `npm_dist_tag=extended-stable`, melewati kelayakan extended-stable bulanan sambil mempertahankan pemeriksaan identitas rilis, artefak, persetujuan, dan pembacaan kembali.

`Plugin NPM Release` menerima `npm_dist_tag=default` untuk perilaku rilis
yang sudah ada atau `npm_dist_tag=extended-stable` untuk jalur bulanan yang dilindungi. Opsi
extended-stable memerlukan `publish_scope=all-publishable`, input
`plugins` kosong, patch final pada atau di atas `33`, dan cabang
`extended-stable/YYYY.M.33` kanonis tepat pada ujungnya. Opsi ini tidak pernah memindahkan
`latest` atau `beta` plugin. Versi paket baru menerima `extended-stable` secara atomik
melalui publikasi tepercaya OIDC (`npm publish --tag extended-stable`); alur kerja
sumber ini tidak menggunakan `npm dist-tag add` yang diautentikasi dengan token. Percobaan ulang
melewati versi persis yang sudah ada di npm, lalu gagal secara tertutup kecuali
pembacaan kembali lengkap mengonfirmasi bahwa setiap paket persis dan tag `extended-stable` telah konvergen.

`OpenClaw Release Publish` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib; harus sudah ada
- `preflight_run_id`: id proses preflight `OpenClaw NPM Release` yang sukses; diperlukan ketika `publish_openclaw_npm=true` atau `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: id proses `Full Release Validation` yang sukses; diperlukan ketika `publish_openclaw_npm=true` atau `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: percobaan positif persis yang dipasangkan dengan `full_release_validation_run_id`; diperlukan setiap kali id proses diberikan
- `windows_node_tag`: tag rilis `openclaw/openclaw-windows-node` nonprarilis yang persis; diperlukan untuk publikasi OpenClaw stabil
- `windows_node_installer_digests`: peta JSON ringkas yang disetujui kandidat dari nama penginstal Windows saat ini ke digest `sha256:` yang disematkan; diperlukan untuk publikasi OpenClaw stabil
- `npm_telegram_run_id`: id proses `NPM Telegram Beta E2E` sukses opsional untuk disertakan dalam bukti rilis akhir
- `npm_dist_tag`: tag target npm untuk paket OpenClaw, salah satu dari `alpha`, `beta`, atau `latest`
- `plugin_publish_scope`: default-nya adalah `all-publishable`; gunakan `selected` hanya untuk pekerjaan perbaikan khusus plugin yang terfokus dengan `publish_openclaw_npm=false`
- `plugins`: nama paket `@openclaw/*` yang dipisahkan koma ketika `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default-nya adalah `true`; tetapkan `false` hanya ketika menggunakan alur kerja sebagai orkestrator perbaikan khusus plugin
- `release_profile`: profil cakupan rilis yang digunakan untuk ringkasan bukti rilis; default-nya adalah `from-validation`, yang membacanya dari manifes validasi, atau timpa dengan `beta`, `stable`, atau `full`
- `wait_for_clawhub`: default-nya adalah `false` agar ketersediaan npm tidak diblokir oleh sidecar ClawHub; tetapkan `true` hanya ketika penyelesaian alur kerja harus mencakup penyelesaian ClawHub

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: branch, tag, atau SHA commit lengkap yang akan divalidasi. Pemeriksaan yang menggunakan rahasia mengharuskan commit yang telah diresolusi dapat dijangkau dari branch OpenClaw atau tag rilis.
- `run_release_soak`: ikut serta dalam pengujian menyeluruh live/E2E, jalur rilis Docker, dan soak penyintas peningkatan all-since untuk pemeriksaan rilis beta. Opsi ini diaktifkan secara paksa oleh `release_profile=stable` dan `release_profile=full`.

Aturan:

- Versi final dan koreksi reguler di bawah patch `33` dapat dipublikasikan ke `beta` atau `latest`. Versi final pada patch `33` atau yang lebih tinggi harus dipublikasikan ke `extended-stable`, dan versi dengan sufiks koreksi pada batas tersebut ditolak.
- Tag prarilis beta hanya dapat dipublikasikan ke `beta`; tag prarilis alfa hanya dapat dipublikasikan ke `alpha`
- Untuk `OpenClaw NPM Release`, input SHA commit lengkap hanya diizinkan ketika `preflight_only=true`
- `OpenClaw Release Checks` dan `Full Release Validation` selalu hanya untuk validasi
- Jalur publikasi sebenarnya harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan selama pra-pemeriksaan; alur kerja memverifikasi metadata tersebut sebelum publikasi dilanjutkan

## Urutan rilis stabil beta/latest reguler

Urutan lama ini ditujukan untuk rilis terorkestrasi reguler yang juga menangani plugin, GitHub Release, Windows, dan pekerjaan platform lainnya. Ini bukan jalur extended-stable bulanan `.33+` khusus npm yang didokumentasikan di bagian atas halaman ini.

Saat membuat rilis stabil terorkestrasi reguler:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`. Sebelum tag tersedia, Anda dapat menggunakan SHA commit branch alur kerja lengkap saat ini untuk dry run alur kerja pra-pemeriksaan yang hanya melakukan validasi.
2. Pilih `npm_dist_tag=beta` untuk alur normal yang mendahulukan beta, atau `latest` hanya ketika Anda sengaja ingin melakukan publikasi stabil secara langsung.
3. Jalankan `Full Release Validation` pada branch rilis, tag rilis, atau SHA commit lengkap saat Anda menginginkan CI normal beserta cakupan cache prompt live, Docker, QA Lab, Matrix, dan Telegram dari satu alur kerja manual. Jika Anda sengaja hanya memerlukan grafik pengujian normal yang deterministik, jalankan alur kerja manual `CI` pada ref rilis sebagai gantinya.
4. Pilih tag rilis non-prarilis `openclaw/openclaw-windows-node` yang tepat, yang penginstal x64 dan ARM64 bertanda tangannya akan dikirimkan. Simpan sebagai `windows_node_tag`, dan simpan peta digest yang telah divalidasi sebagai `windows_node_installer_digests`. Pembantu kandidat rilis mencatat keduanya dan menyertakannya dalam perintah publikasi yang dihasilkannya.
5. Simpan `preflight_run_id`, `full_release_validation_run_id`, dan `full_release_validation_run_attempt` yang tepat dari proses yang berhasil.
6. Jalankan `OpenClaw Release Publish` dari `main` tepercaya dengan `tag` yang sama, `npm_dist_tag` yang sama, `windows_node_tag` yang dipilih, `windows_node_installer_digests` yang tersimpan, `preflight_run_id` yang tersimpan, `full_release_validation_run_id`, dan `full_release_validation_run_attempt`. Proses ini memublikasikan plugin yang telah dieksternalisasi ke npm dan ClawHub sebelum mempromosikan paket npm OpenClaw.
7. Jika rilis diterbitkan pada `beta`, gunakan alur kerja `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` untuk mempromosikan versi stabil tersebut dari `beta` ke `latest`.
8. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta` harus segera mengikuti build stabil yang sama, gunakan alur kerja rilis yang sama untuk mengarahkan kedua dist-tag ke versi stabil, atau biarkan sinkronisasi pemulihan mandiri terjadwal memindahkan `beta` nanti.

Mutasi dist-tag berada di repo ledger rilis karena masih memerlukan `NPM_TOKEN`, sementara repo sumber mempertahankan publikasi khusus OIDC. Dengan demikian, jalur publikasi langsung dan jalur promosi yang mendahulukan beta tetap terdokumentasi dan terlihat oleh operator.

Jika pengelola harus beralih ke autentikasi npm lokal, jalankan semua perintah CLI 1Password (`op`) hanya di dalam sesi tmux khusus. Jangan panggil `op` secara langsung dari shell agen utama; menyimpannya di dalam tmux membuat prompt, peringatan, dan penanganan OTP dapat diamati serta mencegah peringatan host berulang.

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

Pengelola menggunakan dokumentasi rilis privat di [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) sebagai runbook aktual.

## Terkait

- [Saluran rilis](/id/install/development-channels)
