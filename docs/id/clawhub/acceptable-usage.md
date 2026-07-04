---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Memutuskan apakah suatu skill harus disembunyikan atau pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-07-04T18:19:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menghosting Skills, Plugin, paket, dan metadata marketplace untuk OpenClaw.
Gunakan halaman ini untuk menentukan apakah konten atau perilaku publikasi
layak berada di ClawHub.

Aturan ini berlaku untuk apa yang dilakukan sebuah listing, apa yang diminta
untuk dijalankan oleh pengguna, bagaimana listing tersebut merepresentasikan
dirinya, dan bagaimana penerbit menggunakan permukaan penemuan, instalasi, dan
kepercayaan ClawHub. Untuk status moderasi dan reputasi akun, lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation). Untuk klaim hak cipta atau hak
lainnya, lihat [Permintaan Hak Konten](/id/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menyambut konten yang berguna, dapat dipahami, dan diterbitkan dengan
iktikad baik.

| Kategori                                         | Diizinkan bila                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                           | Listing membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.                                               |
| Alur kerja UI, data, dan automasi               | Cakupannya jelas, kredensial yang diperlukan dinyatakan secara eksplisit, dan tindakan berisiko menyertakan jalur peninjauan, uji coba tanpa eksekusi, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan peninjauan penyalahgunaan | Alat dibingkai untuk peninjauan yang berwenang, menjaga bukti, dan menjaga batas persetujuan manusia tetap jelas.                          |
| Alur kerja pribadi atau tim                       | Alur kerja menggunakan akun berbasis persetujuan, penyiapan yang transparan, dan izin yang eksplisit.                                            |
| Katalog yang dipelihara                              | Setiap listing berbeda, berguna, dijelaskan secara akurat, dan dipelihara secara wajar.                                                |

Konteks penting. Topik yang sama dapat diterima dalam konteks defensif yang
sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas
sebagai alur kerja penyalahgunaan.

## Konten yang tidak diizinkan

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan,
penipuan, eksekusi tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tidak berwenang atau pengelakan keamanan                      | Pengelakan autentikasi, pengambilalihan akun, penyalahgunaan batas laju, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, atau persetujuan otomatis alur pemasangan untuk pengguna yang belum disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan penghindaran larangan                              | Akun tersembunyi setelah larangan, pemanasan atau budidaya akun, interaksi palsu, automasi multi-akun, posting massal, bot spam, atau automasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, scam, dan alur kerja keuangan yang menyesatkan             | Sertifikat atau faktur palsu, alur pembayaran menyesatkan, penjangkauan scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan atau pengawasan yang melanggar privasi                 | Pengambilan kontak untuk spam, doxxing, penguntitan, ekstraksi prospek yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau dump pelanggaran.                                                                                                                  |
| Peniruan tanpa persetujuan atau manipulasi identitas       | Tukar wajah, kembaran digital, influencer kloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan keamanan dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; pembungkus konten dewasa di sekitar API pihak ketiga; atau listing yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan        | Perintah instalasi yang dikaburkan, penginstal pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa kemampuan tinjauan yang jelas, persyaratan rahasia atau kunci privat yang tidak dinyatakan, eksekusi jarak jauh `npx @latest` tanpa kemampuan tinjauan yang jelas, atau metadata yang menyembunyikan apa yang sebenarnya dibutuhkan listing untuk berjalan. |
| Materi yang melanggar hak cipta atau hak lain           | Menerbitkan ulang skill, Plugin, dokumentasi, aset merek, atau kode proprietari milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis atau penerbit asli.                                                                                                                            |

## Perilaku marketplace yang tidak diizinkan

ClawHub juga meninjau bagaimana penerbit menggunakan marketplace. Jangan gunakan
ClawHub untuk memanipulasi penemuan, metrik, sinyal kepercayaan, sistem
moderasi, atau perhatian pengguna.

Perilaku marketplace yang tidak diizinkan mencakup:

- menerbitkan secara massal listing dalam jumlah besar yang minim usaha,
  duplikatif, berupa placeholder, atau dihasilkan mesin dan tidak tampak memiliki
  nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan Skills atau Plugin yang
  hampir identik
- menerbitkan ratusan listing dengan sedikit atau tanpa penggunaan, pemeliharaan,
  kejelasan sumber, atau diferensiasi yang bermakna
- menaikkan instalasi, unduhan, bintang, atau metrik keterlibatan lain secara
  artifisial melalui automasi, loop instalasi sendiri, akun palsu, aktivitas
  terkoordinasi, keterlibatan berbayar, atau perilaku non-organik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, larangan, batas
  penerbit, atau tinjauan marketplace
- menyesatkan pengguna tentang kepemilikan, sumber, kapabilitas, postur
  keamanan, persyaratan instalasi, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang sudah disembunyikan, dihapus, atau
  diblokir tanpa memperbaiki masalah yang mendasarinya

Publikasi bervolume tinggi tidak otomatis merupakan penyalahgunaan. Katalog
besar dapat diterima ketika listing berbeda secara bermakna, dijelaskan secara
akurat, dipelihara, dan digunakan oleh pengguna nyata. Katalog besar menjadi
masalah kepercayaan dan keamanan ketika volume dipasangkan dengan listing yang
tipis, duplikatif, menyesatkan, tidak dipelihara, atau dipromosikan secara
artifisial.

## Hak konten

Jika Anda yakin konten di ClawHub melanggar hak cipta atau hak Anda lainnya,
gunakan [Permintaan Hak Konten](/id/clawhub/content-rights). Jangan gunakan laporan
marketplace biasa untuk klaim hak cipta atau hak kecuali listing tersebut juga
tidak aman, berbahaya, atau menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal penyalahgunaan statistik,
laporan pengguna, dan tinjauan staf untuk mengidentifikasi konten tidak aman
atau perilaku publikasi yang menyalahgunakan. Sebuah sinyal tidak membuktikan
penyalahgunaan dengan sendirinya; sinyal tersebut membantu ClawHub menentukan
apa yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, menghapus lunak, atau, jika didukung untuk
  jenis sumber daya tersebut, menghapus permanen listing yang melanggar
- memblokir unduhan atau instalasi untuk rilis yang tidak aman
- mencabut token API
- menghapus lunak konten terkait
- membatasi akses publikasi
- melarang pelanggar berulang atau berat

Kami tidak menjamin penegakan yang selalu diawali peringatan untuk penyalahgunaan
yang jelas. Lihat [Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan,
penahanan moderasi, listing tersembunyi, larangan, dan reputasi akun.
