---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Menentukan apakah suatu skill harus disembunyikan atau pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan di-host.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-07-03T01:04:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menghosting Skills, Plugin, paket, dan metadata marketplace untuk OpenClaw.
Gunakan halaman ini untuk memutuskan apakah konten atau perilaku penerbitan layak berada di
ClawHub.

Aturan ini berlaku pada apa yang dilakukan suatu cantuman, apa yang diminta untuk dijalankan oleh pengguna, bagaimana cantuman itu
merepresentasikan dirinya, dan bagaimana penerbit menggunakan permukaan penemuan, instalasi, dan
kepercayaan ClawHub. Untuk status moderasi dan reputasi akun, lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation). Untuk klaim hak cipta atau hak lainnya,
lihat [Permintaan Hak Konten](/id/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang berguna, dapat dipahami, dan diterbitkan dengan itikad baik.

| Kategori                                         | Diizinkan ketika                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas developer                           | Cantuman membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.                                               |
| Alur kerja UI, data, dan automasi               | Cakupannya jelas, kredensial yang diperlukan dinyatakan eksplisit, dan tindakan berisiko menyertakan jalur tinjauan, uji coba tanpa eksekusi, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan tinjauan penyalahgunaan | Alat dibingkai untuk tinjauan yang terotorisasi, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.                          |
| Alur kerja pribadi atau tim                       | Alur kerja menggunakan akun berbasis persetujuan, penyiapan yang transparan, dan izin eksplisit.                                            |
| Katalog yang dipelihara                              | Setiap cantuman berbeda, berguna, dijelaskan secara akurat, dan dipelihara secara wajar.                                                |

Konteks penting. Topik yang sama dapat diterima dalam pengaturan defensif yang sempit atau
berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.

## Konten yang tidak diizinkan

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan, penipuan, eksekusi yang tidak aman,
atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tanpa otorisasi atau bypass keamanan                      | Bypass autentikasi, pengambilalihan akun, penyalahgunaan batas laju, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan kembali, atau persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan penghindaran pemblokiran                              | Akun tersembunyi setelah pemblokiran, pemanasan atau pembudidayaan akun, engagement palsu, automasi multi-akun, pengiriman massal, bot spam, atau automasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, scam, dan alur kerja keuangan yang menyesatkan             | Sertifikat atau faktur palsu, alur pembayaran yang menyesatkan, outreach scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan atau pengawasan yang melanggar privasi                 | Pengambilan kontak untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan outreach tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau dump pelanggaran.                                                                                                                  |
| Peniruan tanpa persetujuan atau manipulasi identitas       | Tukar wajah, kembaran digital, influencer kloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan keselamatan dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; pembungkus konten dewasa di sekitar API pihak ketiga; atau cantuman yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi tersembunyi, tidak aman, atau menyesatkan        | Perintah instalasi yang diobfuskasi, penginstal pipe-to-shell seperti konten yang diunduh lalu dijalankan dengan `sh` atau `bash` tanpa kemampuan tinjauan yang jelas, persyaratan rahasia atau kunci privat yang tidak dinyatakan, eksekusi jarak jauh `npx @latest` tanpa kemampuan tinjauan yang jelas, atau metadata yang menyembunyikan apa yang sebenarnya dibutuhkan cantuman untuk berjalan. |
| Materi yang melanggar hak cipta atau melanggar hak           | Menerbitkan ulang skill, Plugin, dokumen, aset merek, atau kode proprietari milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis atau penerbit asli.                                                                                                                            |

## Perilaku marketplace yang tidak diizinkan

ClawHub juga meninjau bagaimana penerbit menggunakan marketplace. Jangan gunakan ClawHub untuk
memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi, atau
perhatian pengguna.

Perilaku marketplace yang tidak diizinkan mencakup:

- menerbitkan secara massal banyak cantuman yang rendah usaha, duplikatif, placeholder, atau
  dibuat mesin yang tampaknya tidak memiliki nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan Skills atau Plugin yang nyaris identik
- menerbitkan ratusan cantuman dengan sedikit atau tanpa penggunaan, pemeliharaan, kejelasan sumber,
  atau diferensiasi yang bermakna
- meningkatkan instalasi, unduhan, bintang, atau metrik engagement lainnya secara artifisial
  melalui automasi, loop instalasi sendiri, akun palsu, aktivitas terkoordinasi,
  engagement berbayar, atau perilaku non-organik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas penerbit, atau
  tinjauan marketplace
- menyesatkan pengguna tentang kepemilikan, sumber, kapabilitas, postur keamanan,
  persyaratan instalasi, atau afiliasi dengan proyek atau penerbit lain
- mengunggah berulang kali konten yang sudah disembunyikan, dihapus, atau diblokir
  tanpa memperbaiki masalah dasarnya

Penerbitan volume tinggi tidak otomatis merupakan penyalahgunaan. Katalog besar dapat diterima
ketika cantumannya berbeda secara bermakna, dijelaskan secara akurat, dipelihara,
dan digunakan oleh pengguna nyata. Katalog besar menjadi masalah kepercayaan dan keselamatan ketika
volume dipasangkan dengan cantuman yang tipis, duplikatif, menyesatkan, tidak dipelihara, atau
dipromosikan secara artifisial.

## Hak konten

Jika Anda yakin konten di ClawHub melanggar hak cipta atau hak Anda yang lain, gunakan
[Permintaan Hak Konten](/id/clawhub/content-rights). Jangan gunakan laporan marketplace normal
untuk klaim hak cipta atau hak kecuali cantuman tersebut juga tidak aman,
berbahaya, atau menyesatkan.

## Tinjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal penyalahgunaan statistik, laporan pengguna, dan
tinjauan staf untuk mengidentifikasi konten tidak aman atau perilaku penerbitan yang menyalahgunakan. Sebuah sinyal
tidak membuktikan penyalahgunaan dengan sendirinya; sinyal itu membantu ClawHub memutuskan apa yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, menghapus lunak, atau, jika didukung untuk jenis sumber daya tersebut,
  menghapus keras cantuman yang melanggar
- memblokir unduhan atau instalasi untuk rilis yang tidak aman
- mencabut token API
- menghapus lunak konten terkait
- membatasi akses penerbitan
- memblokir pelanggar berulang atau berat

Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas. Lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan, penahanan moderasi,
cantuman tersembunyi, pemblokiran, dan reputasi akun.
