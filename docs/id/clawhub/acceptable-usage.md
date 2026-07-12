---
read_when:
    - Meninjau unggahan untuk mendeteksi penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau panduan operasional peninjau
    - Menentukan apakah suatu skill harus disembunyikan atau pengguna dilarang
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-07-12T13:58:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menghosting Skills, Plugin, paket, dan metadata marketplace untuk OpenClaw.
Gunakan halaman ini untuk menentukan apakah konten atau perilaku penerbitan sesuai
untuk ClawHub.

Aturan ini berlaku pada fungsi suatu cantuman, perintah yang diminta untuk dijalankan
oleh pengguna, cara cantuman tersebut merepresentasikan dirinya, serta cara penerbit
menggunakan fitur penemuan, penginstalan, dan kepercayaan ClawHub. Untuk status
moderasi dan status akun, lihat [Moderasi dan Keamanan Akun](/clawhub/moderation).
Untuk klaim hak cipta atau hak lainnya, lihat
[Permintaan Hak Konten](/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang bermanfaat, mudah dipahami, dan diterbitkan dengan
iktikad baik.

| Kategori                                         | Diizinkan jika                                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                         | Cantuman membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.              |
| Alur kerja UI, data, dan otomatisasi             | Cakupannya jelas, kredensial yang diperlukan dinyatakan secara eksplisit, dan tindakan berisiko menyertakan jalur peninjauan, uji coba tanpa eksekusi, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan peninjauan penyalahgunaan | Alat ditujukan untuk peninjauan yang diotorisasi, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.                    |
| Alur kerja pribadi atau tim                      | Alur kerja menggunakan akun berbasis persetujuan, penyiapan yang transparan, dan izin yang eksplisit.                                        |
| Katalog yang dipelihara                          | Setiap cantuman berbeda, bermanfaat, dideskripsikan secara akurat, dan dipelihara secara wajar.                                               |

Konteks berperan penting. Topik yang sama dapat diterima dalam konteks defensif
yang terbatas atau berbasis persetujuan, tetapi tidak dapat diterima jika dikemas
sebagai alur kerja penyalahgunaan.

## Konten yang dilarang

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan,
penipuan, eksekusi yang tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tanpa izin atau pengelakan keamanan                   | Pengelakan autentikasi, pengambilalihan akun, penyalahgunaan batas laju, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan kembali, atau persetujuan otomatis terhadap alur pemasangan untuk pengguna yang tidak disetujui.                                                               |
| Penyalahgunaan platform dan pengelakan pemblokiran          | Akun terselubung setelah pemblokiran, pemanasan atau peternakan akun, interaksi palsu, otomatisasi banyak akun, pengeposan massal, bot spam, atau otomatisasi yang dibuat untuk menghindari deteksi.                                                                                                                       |
| Penipuan, scam, dan alur kerja keuangan yang menyesatkan    | Sertifikat atau faktur palsu, alur pembayaran yang menyesatkan, penjangkauan untuk scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/pembebanan biaya tanpa persetujuan manusia yang jelas.                                                                                   |
| Pengayaan data yang mengganggu privasi atau pengawasan      | Pengambilan data kontak untuk spam, penyebaran informasi pribadi, penguntitan, ekstraksi prospek yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data yang bocor maupun kumpulan data hasil pembobolan.                                   |
| Peniruan tanpa persetujuan atau manipulasi identitas        | Pertukaran wajah, kembaran digital, influencer kloningan, persona palsu, atau alat lain yang digunakan untuk menyamar sebagai orang lain atau menyesatkan.                                                                                                                                                              |
| Konten seksual eksplisit atau pembuatan konten dewasa tanpa fitur keamanan | Pembuatan gambar, video, atau konten NSFW; pembungkus konten dewasa untuk API pihak ketiga; atau cantuman yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                          |
| Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan | Perintah penginstalan yang disamarkan, penginstal pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa kemudahan peninjauan yang jelas, persyaratan rahasia atau kunci privat yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa kemudahan peninjauan yang jelas, atau metadata yang menyembunyikan kebutuhan sebenarnya untuk menjalankan cantuman. |
| Materi yang melanggar hak cipta atau hak lainnya            | Menerbitkan ulang Skills, Plugin, dokumentasi, aset merek, atau kode proprieter milik pihak lain tanpa izin; melanggar ketentuan lisensi; atau menyamar sebagai penulis atau penerbit asli.                                                                                                                              |

## Perilaku marketplace yang dilarang

ClawHub juga meninjau cara penerbit menggunakan marketplace. Jangan gunakan
ClawHub untuk memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi,
atau perhatian pengguna.

Perilaku marketplace yang dilarang meliputi:

- menerbitkan secara massal sejumlah besar cantuman yang dibuat dengan upaya
  minim, duplikatif, berupa pengganti sementara, atau dibuat oleh mesin dan
  tampaknya tidak memiliki nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan Skills atau Plugin yang
  hampir identik
- menerbitkan ratusan cantuman dengan penggunaan, pemeliharaan, kejelasan sumber,
  atau diferensiasi yang bermakna dalam jumlah sedikit atau bahkan tidak ada
- meningkatkan jumlah penginstalan, unduhan, bintang, atau metrik interaksi
  lainnya secara artifisial melalui otomatisasi, siklus penginstalan mandiri,
  akun palsu, aktivitas terkoordinasi, interaksi berbayar, atau perilaku
  nonorganik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas
  penerbit, atau peninjauan marketplace
- menyesatkan pengguna mengenai kepemilikan, sumber, kemampuan, postur keamanan,
  persyaratan penginstalan, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang telah disembunyikan, dihapus, atau
  diblokir tanpa memperbaiki masalah yang mendasarinya

Penerbitan dalam volume tinggi tidak otomatis merupakan penyalahgunaan. Katalog
besar dapat diterima jika cantumannya memiliki perbedaan yang bermakna,
dideskripsikan secara akurat, dipelihara, dan digunakan oleh pengguna nyata.
Katalog besar menjadi masalah kepercayaan dan keamanan jika volumenya disertai
cantuman yang minim substansi, duplikatif, menyesatkan, tidak dipelihara, atau
dipromosikan secara artifisial.

## Hak konten

Jika Anda meyakini bahwa konten di ClawHub melanggar hak cipta atau hak Anda yang
lain, gunakan [Permintaan Hak Konten](/clawhub/content-rights). Jangan gunakan
laporan marketplace biasa untuk klaim hak cipta atau hak lainnya, kecuali
cantuman tersebut juga tidak aman, berbahaya, atau menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal statistik penyalahgunaan,
laporan pengguna, dan peninjauan staf untuk mengidentifikasi konten yang tidak
aman atau perilaku penerbitan yang bersifat menyalahgunakan. Sebuah sinyal tidak
dengan sendirinya membuktikan penyalahgunaan; sinyal tersebut membantu ClawHub
menentukan hal yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, menghapus secara lunak, atau, jika didukung
  untuk jenis sumber daya tersebut, menghapus secara permanen cantuman yang
  melanggar
- memblokir unduhan atau penginstalan untuk rilis yang tidak aman
- mencabut token API
- menghapus secara lunak konten terkait
- membatasi akses penerbitan
- memblokir pelanggar berulang atau berat

Kami tidak menjamin bahwa peringatan akan selalu diberikan sebelum penegakan
untuk penyalahgunaan yang jelas. Lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan, penahanan
moderasi, cantuman tersembunyi, pemblokiran, dan status akun.
