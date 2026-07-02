---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Menentukan apakah skill harus disembunyikan atau pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan pasar: apa yang diizinkan ClawHub dan apa yang tidak akan ditampungnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-07-02T14:11:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menghosting Skills, Plugin, paket, dan metadata lokapasar untuk OpenClaw.
Gunakan halaman ini untuk memutuskan apakah konten atau perilaku penerbitan termasuk di
ClawHub.

Aturan ini berlaku untuk apa yang dilakukan sebuah listing, apa yang diminta untuk dijalankan oleh pengguna, bagaimana listing itu
merepresentasikan dirinya, dan bagaimana penerbit menggunakan permukaan penemuan, instalasi, dan
kepercayaan ClawHub. Untuk status moderasi dan reputasi akun, lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation). Untuk klaim hak cipta atau hak lainnya,
lihat [Permintaan Hak Konten](/id/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang berguna, dapat dipahami, dan diterbitkan dengan itikad
baik.

| Kategori                                         | Diizinkan ketika                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                           | Listing membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.                                               |
| Alur kerja UI, data, dan otomatisasi               | Cakupannya jelas, kredensial yang diperlukan dinyatakan eksplisit, dan tindakan berisiko mencakup jalur tinjauan, dry-run, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan tinjauan penyalahgunaan | Alat diposisikan untuk tinjauan terotorisasi, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.                          |
| Alur kerja pribadi atau tim                       | Alur kerja menggunakan akun berbasis persetujuan, penyiapan yang transparan, dan izin eksplisit.                                            |
| Katalog yang dipelihara                              | Setiap listing berbeda, berguna, dijelaskan secara akurat, dan dipelihara secara wajar.                                                |

Konteks penting. Topik yang sama dapat diterima dalam lingkungan defensif yang sempit atau
berbasis persetujuan dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.

## Konten yang dilarang

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan, penipuan, eksekusi tidak aman,
atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tidak sah atau bypass keamanan                      | Bypass autentikasi, pengambilalihan akun, penyalahgunaan batas laju, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, atau persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan penghindaran pemblokiran                              | Akun terselubung setelah pemblokiran, pemanasan atau farming akun, interaksi palsu, otomatisasi multi-akun, posting massal, bot spam, atau otomatisasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, scam, dan alur kerja keuangan yang menyesatkan             | Sertifikat atau faktur palsu, alur pembayaran yang menyesatkan, pendekatan scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pengeluaran/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan atau pengawasan yang invasif terhadap privasi                 | Scraping kontak untuk spam, doxxing, penguntitan, ekstraksi prospek yang dipasangkan dengan pendekatan tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau dump pelanggaran.                                                                                                                  |
| Penyamaran atau manipulasi identitas tanpa persetujuan       | Face swap, digital twin, influencer kloning, persona palsu, atau perkakas lain yang digunakan untuk menyamar atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau generasi dewasa dengan keamanan dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; wrapper konten dewasa di sekitar API pihak ketiga; atau listing yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi tersembunyi, tidak aman, atau menyesatkan        | Perintah instalasi yang dikaburkan, installer pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa keterlihatan tinjauan yang jelas, persyaratan rahasia atau kunci privat yang tidak dinyatakan, eksekusi jarak jauh `npx @latest` tanpa keterlihatan tinjauan yang jelas, atau metadata yang menyembunyikan apa yang sebenarnya diperlukan listing untuk berjalan. |
| Materi yang melanggar hak cipta atau hak lainnya           | Menerbitkan ulang skill, Plugin, dokumentasi, aset merek, atau kode proprietari milik orang lain tanpa izin; melanggar ketentuan lisensi; atau menyamar sebagai penulis atau penerbit asli.                                                                                                                            |

## Perilaku lokapasar yang dilarang

ClawHub juga meninjau bagaimana penerbit menggunakan lokapasar. Jangan gunakan ClawHub untuk
memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi, atau perhatian
pengguna.

Perilaku lokapasar yang dilarang mencakup:

- menerbitkan secara massal listing dalam jumlah besar yang minim upaya, duplikatif, placeholder, atau
  dihasilkan mesin dan tampaknya tidak memiliki nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan Skills atau Plugin yang hampir identik
- menerbitkan ratusan listing dengan sedikit atau tanpa penggunaan, pemeliharaan, kejelasan sumber,
  atau diferensiasi bermakna
- menggembungkan instalasi, unduhan, bintang, atau metrik interaksi lainnya secara artifisial
  melalui otomatisasi, loop instalasi sendiri, akun palsu, aktivitas terkoordinasi,
  interaksi berbayar, atau perilaku non-organik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas penerbit, atau
  tinjauan lokapasar
- menyesatkan pengguna tentang kepemilikan, sumber, kapabilitas, postur keamanan,
  persyaratan instalasi, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang sudah disembunyikan, dihapus, atau diblokir
  tanpa memperbaiki masalah yang mendasarinya

Penerbitan bervolume tinggi tidak otomatis merupakan penyalahgunaan. Katalog besar dapat diterima
ketika listing memiliki perbedaan bermakna, dijelaskan secara akurat, dipelihara,
dan digunakan oleh pengguna nyata. Katalog besar menjadi masalah kepercayaan dan keamanan ketika
volume dipasangkan dengan listing yang tipis, duplikatif, menyesatkan, tidak dipelihara, atau
dipromosikan secara artifisial.

## Hak konten

Jika Anda yakin konten di ClawHub melanggar hak cipta atau hak Anda lainnya, gunakan
[Permintaan Hak Konten](/id/clawhub/content-rights). Jangan gunakan laporan lokapasar normal
untuk klaim hak cipta atau hak kecuali listing tersebut juga tidak aman,
berbahaya, atau menyesatkan.

## Tinjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal penyalahgunaan statistik, laporan pengguna, dan
tinjauan staf untuk mengidentifikasi konten tidak aman atau perilaku penerbitan yang menyalahgunakan. Sinyal
tidak membuktikan penyalahgunaan dengan sendirinya; sinyal membantu ClawHub memutuskan apa yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, soft-delete, atau, jika didukung untuk jenis sumber daya tersebut,
  hard-delete listing yang melanggar
- memblokir unduhan atau instalasi untuk rilis yang tidak aman
- mencabut token API
- soft-delete konten terkait
- membatasi akses penerbitan
- memblokir pelanggar berulang atau berat

Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas. Lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan, penahanan moderasi,
listing tersembunyi, pemblokiran, dan reputasi akun.
