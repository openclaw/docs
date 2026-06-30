---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Memutuskan apakah sebuah skill harus disembunyikan atau seorang pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-06-30T14:25:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menghosting Skills, plugin, paket, dan metadata lokapasar untuk OpenClaw.
Gunakan halaman ini untuk memutuskan apakah konten atau perilaku penerbitan
pantas berada di ClawHub.

Aturan ini berlaku pada apa yang dilakukan sebuah cantuman, apa yang diminta
untuk dijalankan oleh pengguna, bagaimana cantuman itu merepresentasikan dirinya,
dan bagaimana penerbit menggunakan permukaan penemuan, pemasangan, dan
kepercayaan ClawHub. Untuk status moderasi dan reputasi akun, lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation). Untuk klaim hak cipta atau hak
lainnya, lihat [Permintaan Hak Konten](/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menyambut konten yang berguna, dapat dipahami, dan diterbitkan dengan
itikad baik.

| Kategori                                         | Diizinkan ketika                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                           | Cantuman membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.                                               |
| Alur kerja UI, data, dan otomatisasi               | Cakupannya jelas, kredensial yang diperlukan dinyatakan secara eksplisit, dan tindakan berisiko menyertakan jalur peninjauan, uji jalan tanpa perubahan, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan peninjauan penyalahgunaan | Alat dibingkai untuk peninjauan yang berwenang, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.                          |
| Alur kerja pribadi atau tim                       | Alur kerja menggunakan akun berbasis persetujuan, penyiapan yang transparan, dan izin eksplisit.                                            |
| Katalog yang dipelihara                              | Setiap cantuman berbeda, berguna, dijelaskan secara akurat, dan dipelihara secara wajar.                                                |

Konteks itu penting. Topik yang sama dapat diterima dalam pengaturan defensif
yang sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas
sebagai alur kerja penyalahgunaan.

## Konten yang dilarang

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan,
penipuan, eksekusi yang tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tanpa otorisasi atau pengelakan keamanan                      | Pengelakan autentikasi, pengambilalihan akun, penyalahgunaan batas laju, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan kembali, atau alur pemasangan berpasangan yang disetujui otomatis untuk pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan pengelakan pemblokiran                              | Akun tersembunyi setelah pemblokiran, pemanasan atau pertanian akun, keterlibatan palsu, otomatisasi multi-akun, pengeposan massal, bot spam, atau otomatisasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, scam, dan alur kerja finansial yang menyesatkan             | Sertifikat atau faktur palsu, alur pembayaran yang menyesatkan, penjangkauan scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan atau pengawasan yang mengganggu privasi                 | Pengambilan kontak untuk spam, doxxing, penguntitan, ekstraksi prospek yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau kumpulan data hasil pelanggaran.                                                                                                                  |
| Peniruan tanpa persetujuan atau manipulasi identitas       | Tukar wajah, kembaran digital, influencer kloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan keamanan dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; pembungkus konten dewasa di sekitar API pihak ketiga; atau cantuman yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan        | Perintah pemasangan yang diobfuskasi, penginstal pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa keterulasan yang jelas, persyaratan rahasia atau kunci privat yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa keterulasan yang jelas, atau metadata yang menyembunyikan apa yang benar-benar diperlukan cantuman untuk berjalan. |
| Materi yang melanggar hak cipta atau melanggar hak           | Menerbitkan ulang Skills, plugin, dokumen, aset merek, atau kode proprietari milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis atau penerbit asli.                                                                                                                            |

## Perilaku lokapasar yang dilarang

ClawHub juga meninjau bagaimana penerbit menggunakan lokapasar. Jangan gunakan
ClawHub untuk memanipulasi penemuan, metrik, sinyal kepercayaan, sistem
moderasi, atau perhatian pengguna.

Perilaku lokapasar yang dilarang mencakup:

- menerbitkan secara massal sejumlah besar cantuman berupaya rendah, duplikatif,
  placeholder, atau dihasilkan mesin yang tidak tampak memiliki nilai nyata bagi
  pengguna
- membanjiri permukaan pencarian atau kategori dengan Skills atau plugin yang
  nyaris identik
- menerbitkan ratusan cantuman dengan sedikit atau tanpa penggunaan, pemeliharaan,
  kejelasan sumber, atau diferensiasi bermakna
- menaikkan pemasangan, unduhan, bintang, atau metrik keterlibatan lainnya secara
  artifisial melalui otomatisasi, putaran pemasangan sendiri, akun palsu,
  aktivitas terkoordinasi, keterlibatan berbayar, atau perilaku non-organik
  lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas
  penerbit, atau peninjauan lokapasar
- menyesatkan pengguna tentang kepemilikan, sumber, kemampuan, postur keamanan,
  persyaratan pemasangan, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang sudah disembunyikan, dihapus, atau
  diblokir tanpa memperbaiki masalah dasarnya

Penerbitan volume tinggi tidak otomatis merupakan penyalahgunaan. Katalog besar
dapat diterima ketika cantumannya berbeda secara bermakna, dijelaskan secara
akurat, dipelihara, dan digunakan oleh pengguna nyata. Katalog besar menjadi
masalah kepercayaan dan keamanan ketika volume dipasangkan dengan cantuman yang
tipis, duplikatif, menyesatkan, tidak dipelihara, atau dipromosikan secara
artifisial.

## Hak konten

Jika Anda meyakini konten di ClawHub melanggar hak cipta atau hak lainnya milik
Anda, gunakan [Permintaan Hak Konten](/clawhub/content-rights). Jangan gunakan
laporan lokapasar biasa untuk klaim hak cipta atau hak kecuali cantuman tersebut
juga tidak aman, berbahaya, atau menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal penyalahgunaan statistik,
laporan pengguna, dan peninjauan staf untuk mengidentifikasi konten yang tidak
aman atau perilaku penerbitan yang menyalahgunakan. Sebuah sinyal tidak
membuktikan penyalahgunaan dengan sendirinya; sinyal membantu ClawHub memutuskan
apa yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, menghapus lunak, atau, jika didukung untuk
  jenis sumber daya tersebut, menghapus keras cantuman yang melanggar
- memblokir unduhan atau pemasangan untuk rilis yang tidak aman
- mencabut token API
- menghapus lunak konten terkait
- membatasi akses penerbitan
- memblokir pelanggar berulang atau berat

Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk
penyalahgunaan yang jelas. Lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan, penahanan
moderasi, cantuman tersembunyi, pemblokiran, dan reputasi akun.
