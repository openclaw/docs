---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumen moderasi atau runbook peninjau
    - Memutuskan apakah sebuah skill harus disembunyikan atau pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-07-04T11:03:01Z"
    model: gpt-5.5
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

Aturan ini berlaku pada apa yang dilakukan listing, apa yang diminta untuk dijalankan
oleh pengguna, bagaimana listing merepresentasikan dirinya, dan bagaimana penerbit
menggunakan permukaan penemuan, pemasangan, dan kepercayaan ClawHub. Untuk status
moderasi dan reputasi akun, lihat [Moderasi dan Keamanan Akun](/clawhub/moderation).
Untuk klaim hak cipta atau hak lainnya, lihat [Permintaan Hak Konten](/id/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang berguna, dapat dipahami, dan diterbitkan dengan iktikad
baik.

| Kategori                                         | Diizinkan bila                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                           | Listing membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.                                               |
| Alur kerja UI, data, dan automasi               | Cakupannya jelas, kredensial yang diperlukan dinyatakan eksplisit, dan tindakan berisiko menyertakan jalur peninjauan, simulasi, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan peninjauan penyalahgunaan | Alat dibingkai untuk peninjauan yang berwenang, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.                          |
| Alur kerja pribadi atau tim                       | Alur kerja menggunakan akun berbasis persetujuan, penyiapan transparan, dan izin eksplisit.                                            |
| Katalog yang dipelihara                              | Setiap listing berbeda, berguna, dijelaskan secara akurat, dan dipelihara secara wajar.                                                |

Konteks penting. Topik yang sama dapat diterima dalam pengaturan defensif yang sempit
atau berbasis persetujuan dan tidak dapat diterima ketika dikemas sebagai alur kerja
penyalahgunaan.

## Konten yang dilarang

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan, penipuan,
eksekusi tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tidak sah atau pengelakan keamanan                      | Pengelakan autentikasi, pengambilalihan akun, penyalahgunaan batas laju, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, atau persetujuan otomatis alur penyandingan untuk pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan pengelakan pemblokiran                              | Akun terselubung setelah pemblokiran, pemanasan atau pengelolaan akun secara massal, keterlibatan palsu, automasi multiakun, posting massal, bot spam, atau automasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, scam, dan alur kerja keuangan yang menyesatkan             | Sertifikat atau faktur palsu, alur pembayaran yang menyesatkan, pendekatan scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pengeluaran/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan atau pengawasan yang melanggar privasi                 | Pengikisan kontak untuk spam, doxxing, penguntitan, ekstraksi prospek yang dipasangkan dengan pendekatan tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau dump pelanggaran.                                                                                                                  |
| Peniruan atau manipulasi identitas tanpa persetujuan       | Tukar wajah, kembaran digital, influencer kloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan keselamatan dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; pembungkus konten dewasa di sekitar API pihak ketiga; atau listing yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan        | Perintah pemasangan yang diobfuskasi, penginstal pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa keterlihatan yang jelas untuk ditinjau, persyaratan rahasia atau kunci privat yang tidak dinyatakan, eksekusi jarak jauh `npx @latest` tanpa keterlihatan yang jelas untuk ditinjau, atau metadata yang menyembunyikan apa yang sebenarnya diperlukan listing untuk berjalan. |
| Materi yang melanggar hak cipta atau hak lain           | Menerbitkan ulang Skills, Plugin, dokumentasi, aset merek, atau kode proprietari milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis atau penerbit asli.                                                                                                                            |

## Perilaku marketplace yang dilarang

ClawHub juga meninjau bagaimana penerbit menggunakan marketplace. Jangan gunakan ClawHub
untuk memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi, atau perhatian
pengguna.

Perilaku marketplace yang dilarang mencakup:

- menerbitkan secara massal sejumlah besar listing berkualitas rendah, duplikatif,
  placeholder, atau buatan mesin yang tampaknya tidak memiliki nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan Skills atau Plugin yang nyaris identik
- menerbitkan ratusan listing dengan sedikit atau tanpa penggunaan, pemeliharaan, kejelasan
  sumber, atau diferensiasi bermakna
- menaikkan pemasangan, unduhan, bintang, atau metrik keterlibatan lain secara artifisial
  melalui automasi, putaran pemasangan sendiri, akun palsu, aktivitas terkoordinasi,
  keterlibatan berbayar, atau perilaku non-organik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas penerbit, atau
  peninjauan marketplace
- menyesatkan pengguna tentang kepemilikan, sumber, kapabilitas, postur keamanan,
  persyaratan pemasangan, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang sudah disembunyikan, dihapus, atau diblokir
  tanpa memperbaiki masalah dasarnya

Penerbitan bervolume tinggi tidak otomatis merupakan penyalahgunaan. Katalog besar dapat
diterima ketika listing berbeda secara bermakna, dijelaskan secara akurat, dipelihara,
dan digunakan oleh pengguna nyata. Katalog besar menjadi masalah kepercayaan dan keamanan
ketika volume dipasangkan dengan listing yang tipis, duplikatif, menyesatkan, tidak
dipelihara, atau dipromosikan secara artifisial.

## Hak konten

Jika Anda meyakini konten di ClawHub melanggar hak cipta atau hak Anda lainnya, gunakan
[Permintaan Hak Konten](/id/clawhub/content-rights). Jangan gunakan laporan marketplace biasa
untuk klaim hak cipta atau hak kecuali listing juga tidak aman, berbahaya, atau
menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal penyalahgunaan statistik, laporan
pengguna, dan peninjauan staf untuk mengidentifikasi konten tidak aman atau perilaku
penerbitan yang menyalahgunakan. Sinyal tidak membuktikan penyalahgunaan dengan sendirinya;
sinyal membantu ClawHub menentukan apa yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, menghapus secara lunak, atau, jika didukung untuk
  jenis sumber daya tersebut, menghapus permanen listing yang melanggar
- memblokir unduhan atau pemasangan untuk rilis yang tidak aman
- mencabut token API
- menghapus secara lunak konten terkait
- membatasi akses penerbitan
- memblokir pelanggar berulang atau berat

Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang
jelas. Lihat [Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan, penahanan
moderasi, listing tersembunyi, pemblokiran, dan reputasi akun.
