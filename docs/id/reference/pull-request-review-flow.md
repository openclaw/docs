---
read_when:
    - Menindaklanjuti masukan dari Barnacle atau ClawSweeper
    - Meminta review dari ClawSweeper
    - Men-debug Barnacle, ClawSweeper, label usang, atau penutupan otomatis
sidebarTitle: PR review flow
summary: Bagaimana umpan balik Barnacle dan ClawSweeper membantu memajukan pull request OpenClaw melalui proses review.
title: Alur review pull request
x-i18n:
    generated_at: "2026-07-19T05:09:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e9bec4578d55d2279450e991480467946db7da5ca956f85c35b4221190b2babe
    source_path: reference/pull-request-review-flow.md
    workflow: 16
---

Halaman ini menjelaskan alur review setelah Anda membuka atau memperbarui pull
request OpenClaw: apa yang dilakukan Barnacle dan ClawSweeper, cara meningkatkan PR berdasarkan
umpan balik mereka, dan apa yang harus diperiksa ketika otomatisasi tetap diam.

Barnacle dan ClawSweeper membantu pengelola menjaga agar antrean review tetap dapat digunakan. Keduanya
tidak menggantikan pertimbangan pengelola.

## Barnacle

Barnacle adalah triase GitHub deterministik. Barnacle mencari kasus pengelolaan antrean
yang sudah diketahui dan merespons dengan label, komentar, atau penutupan.

Barnacle dapat bertindak ketika:

- isi PR hampir kosong atau tidak memiliki konteks masalah;
- PR tidak memiliki bukti yang berguna;
- perubahan yang hanya mencakup dokumentasi, pengujian, refaktor, CI, atau infrastruktur tidak memiliki tautan ke
  konteks pengelola;
- perubahan tampaknya lebih tepat ditempatkan di ClawHub atau Plugin daripada di inti;
- cabang memuat pekerjaan yang tidak terkait;
- seorang penulis memiliki lebih dari 20 PR terbuka.

Barnacle berjalan dari kode alur kerja repositori tepercaya. Barnacle tidak melakukan checkout atau
menjalankan kode kontributor.

Sebagian besar label perutean merupakan sinyal bagi pengelola atau otomatisasi, sehingga kontributor
tidak perlu menambahkan label sendiri.

## ClawSweeper

ClawSweeper adalah bot review dan pemeliharaan berbantuan AI untuk repositori
OpenClaw. Bot ini dapat mereview PR, mengevaluasi bukti, meninggalkan komentar review permanen,
dan membantu pengelola dengan alur perbaikan atau penggabungan otomatis yang dilindungi.

Hasil positif dari ClawSweeper merupakan bukti pendukung, bukan persetujuan pengelola.
Pengelola tetap memutuskan apakah dan kapan suatu PR siap digabungkan.

ClawSweeper menggunakan antrean. Jangan mengharapkan respons langsung setelah membuka
PR, mendorong commit, atau menambahkan permintaan review. Pembaruan label setelah
ClawSweeper dijalankan juga dapat memerlukan waktu.

PR baru masuk ke antrean review ClawSweeper. Pengelola juga dapat mengantrekan alur review,
perbaikan, atau penggabungan otomatis menggunakan label atau perintah. Untuk pembaruan kontributor
biasa, minta ClawSweeper melakukan review lagi hanya setelah Anda memperbarui
cabang, deskripsi PR, bukti, atau kode. Kemudian minta review baru dengan komentar
PR baru:

```text
@clawsweeper re-review
```

Penulis PR juga dapat menggunakan `@clawsweeper re-run`; pengguna dengan akses tulis
repositori dapat menggunakan salah satu perintah pada setiap item terbuka. Perintah biasa
`@clawsweeper review` hanya untuk pengelola. Bersabarlah: meminta lagi
sebelum perubahan yang diminta tersedia hanya menambah kebisingan antrean.

Ketika ClawSweeper meninggalkan percakapan review, perlakukan percakapan tersebut seperti umpan balik review
biasa dan gunakan daftar periksa tindak lanjut di bawah ini.

Jika kontributor manusia atau pengelola telah mengambil alih PR dan sedang aktif
mengerjakannya, jangan memanggil ClawSweeper atau mengerjakan PR tersebut secara bersamaan.
Biarkan review atau perbaikan oleh manusia selesai terlebih dahulu. Jika aktivitas berhenti, periksa
apakah penulis diminta memberikan bukti atau melakukan pembaruan lain.

## Meningkatkan PR selama review

Setelah Barnacle, ClawSweeper, atau pengelola merespons, gunakan umpan balik tersebut sebagai
daftar periksa langkah berikutnya untuk PR.

1. Baca `Rank-up moves:` dan `Proof guidance:` dari ClawSweeper sebagai daftar tindakan
   untuk PR tersebut. Peringkat dan label adalah sinyal review, bukan target penggabungan yang tetap.
2. Dorong perubahan kode atau dokumentasi yang diminta, dan perbarui deskripsi PR ketika
   masalah, solusi, dampak terhadap pengguna, atau bukti telah berubah.
3. Tambahkan bukti yang diminta dengan menggunakan bukti yang sesuai dengan perubahan.
4. Selesaikan sendiri percakapan review yang telah ditangani. Balas dan biarkan
   percakapan tetap terbuka hanya ketika Anda memerlukan pertimbangan pengelola atau pereview.
5. Minta review ulang hanya setelah cabang, deskripsi PR, bukti, dan
   hasil CI yang relevan sudah terkini. Beberapa siklus pembaruan dan review antara
   penulis, pengelola, dan ClawSweeper adalah hal yang normal.
6. Pertahankan diskusi di PR jika memungkinkan. Beralihlah ke `#clawtributors` di Discord
   hanya ketika PR memerlukan koordinasi pengelola, otomatisasi tampaknya terhambat,
   atau keputusan berikutnya sulit diselesaikan melalui komentar GitHub. Sertakan tautan PR,
   status saat ini, serta pertanyaan spesifik atau bukti yang masih diperlukan.

Jaga agar isi PR tetap terkini. Komentar membantu diskusi, tetapi deskripsi
PR adalah ringkasan permanen yang ditinjau kembali oleh pengelola dan otomatisasi.

`status: ⏳ waiting on author` berarti tindakan berikutnya berada pada penulis PR:
perbarui cabang, deskripsi PR, bukti, atau balas dengan konteks yang belum tersedia
sebelum meminta review lagi.

Bukti yang berguna mencakup keluaran pengujian terfokus, hasil CI, tangkapan layar,
rekaman, keluaran terminal, pengamatan langsung, log yang telah disunting, atau tautan
artefak. Untuk perubahan visual, sertakan tangkapan layar sebelum dan sesudah jika memungkinkan.
Untuk berkas bukti, utamakan tautan ke artefak CI, tangkapan layar atau rekaman yang
diunggah ke GitHub, atau cuplikan singkat log yang telah disunting. Jangan melakukan commit terhadap berkas bukti yang dihasilkan
kecuali berkas tersebut merupakan bagian dari perubahan dokumentasi, pengujian, atau produk yang sebenarnya.

Penyuntingan data sensitif merupakan tanggung jawab kontributor. Hapus rahasia,
token, URL privat, data pengguna, dan log yang tidak terkait sebelum memposting bukti.

OpenClaw juga menggunakan otomatisasi kedaluwarsa yang terpisah. Issue dan PR yang belum ditetapkan dapat
ditandai kedaluwarsa setelah 14 hari tanpa aktivitas, lalu ditutup setelah 7 hari tanpa aktivitas berikutnya.
PR yang telah ditetapkan ditandai kedaluwarsa 27 hari setelah dibuka, terlepas dari
pembaruan berikutnya, lalu ditutup setelah 7 hari berstatus kedaluwarsa tanpa aktivitas. Jika PR yang telah ditetapkan
masih aktif, berkoordinasilah dengan pengelola yang mengerjakannya.

## Ketika otomatisasi tetap diam

Otomatisasi dapat tetap diam ketika pengelola sudah menangani item tersebut,
permintaan review atau perbaikan masih mengantre, peristiwanya rutin, atau jalur
ClawSweeper tidak dikonfigurasi untuk tindakan yang diminta.

Otomatisasi juga dapat menghindari tindakan ketika alur kerja tepercaya harus menjalankan kode kontributor
yang tidak tepercaya. Dalam hal tersebut, pengelola menggunakan review biasa atau alur kerja yang lebih aman.

## Pemecahan masalah

Jika ClawSweeper tidak segera merespons, tunggu sebelum mencoba lagi. Layanan ini
menggunakan antrean, dan komentar atau perubahan label berulang dapat membuat utas lebih sulit
direview tanpa mempercepat antrean.

Sebelum meminta bantuan, periksa:

- deskripsi PR sudah terkini;
- commit terbaru berisi perubahan yang diminta;
- CI telah selesai, atau isi PR menjelaskan alasan kegagalan yang tersisa
  tidak terkait dengan PR;
- permintaan review terbaru dibuat sebagai komentar PR:
  `@clawsweeper re-review`;
- pengelola atau kontributor belum sedang aktif mengerjakan PR;
- permintaan terbaru tidak masih berada dalam waktu tunda normal antrean ClawSweeper.

Jika masih tidak ada respons ClawSweeper beberapa jam setelah PR diperbarui,
atau jika PR tampaknya terhambat oleh otomatisasi, tanyakan di `#clawtributors` di Discord.
Sertakan tautan PR, hal yang Anda harapkan, waktu Anda memintanya, dan hal yang berubah sejak
komentar bot terakhir.

## Membuat fork otomatisasi

Proyek yang menginginkan otomatisasi review serupa dapat mempelajari atau membuat fork ClawSweeper:

- [openclaw/clawsweeper](https://github.com/openclaw/clawsweeper)
- [Dokumentasi ClawSweeper](https://clawsweeper.bot/)

## Terkait

- [Berkontribusi](https://github.com/openclaw/openclaw/blob/main/CONTRIBUTING.md)
- [Pipeline CI](/id/ci)
