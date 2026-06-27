---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Memutuskan apakah suatu skill harus disembunyikan atau pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-06-27T17:14:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menghosting Skills, plugin, paket, dan metadata marketplace untuk OpenClaw.
Gunakan halaman ini untuk memutuskan apakah konten atau perilaku publikasi
sesuai ditempatkan di ClawHub.

Aturan ini berlaku untuk apa yang dilakukan sebuah listing, apa yang diminta
untuk dijalankan oleh pengguna, bagaimana listing tersebut merepresentasikan
dirinya, dan bagaimana penerbit menggunakan permukaan penemuan, instalasi, dan
kepercayaan ClawHub. Untuk status moderasi dan reputasi akun, lihat
[Moderasi dan Keamanan Akun](/id/clawhub/moderation). Untuk klaim hak cipta atau hak
lainnya, lihat [Permintaan Hak Konten](/id/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang berguna, dapat dipahami, dan dipublikasikan dengan
itikad baik.

| Kategori                                         | Diizinkan ketika                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                           | Listing membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.                                               |
| Alur kerja UI, data, dan otomatisasi               | Cakupannya jelas, kredensial yang diperlukan dinyatakan secara eksplisit, dan tindakan berisiko menyertakan jalur peninjauan, uji coba tanpa eksekusi, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan peninjauan penyalahgunaan | Alat dibingkai untuk peninjauan yang berwenang, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.                          |
| Alur kerja pribadi atau tim                       | Alur kerja menggunakan akun berbasis persetujuan, penyiapan transparan, dan izin eksplisit.                                            |
| Katalog yang dipelihara                              | Setiap listing berbeda, berguna, dijelaskan secara akurat, dan dipelihara secara wajar.                                                |

Konteks penting. Topik yang sama dapat diterima dalam pengaturan defensif yang
sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas
sebagai alur kerja penyalahgunaan.

## Konten yang tidak diizinkan

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan,
penipuan, eksekusi yang tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tidak sah atau bypass keamanan                      | Bypass autentikasi, pengambilalihan akun, penyalahgunaan batas laju, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, atau alur pairing yang menyetujui otomatis pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan penghindaran pemblokiran                              | Akun tersembunyi setelah pemblokiran, pemanasan atau pembiakan akun, engagement palsu, otomatisasi multi-akun, posting massal, bot spam, atau otomatisasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, scam, dan alur kerja keuangan yang menyesatkan             | Sertifikat atau faktur palsu, alur pembayaran yang menyesatkan, penjangkauan scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan atau pengawasan yang melanggar privasi                 | Pengambilan kontak untuk spam, doxxing, penguntitan, ekstraksi prospek yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau kumpulan data hasil pelanggaran.                                                                                                                  |
| Peniruan atau manipulasi identitas tanpa persetujuan       | Pertukaran wajah, kembaran digital, influencer kloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan pengaman dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; wrapper konten dewasa di sekitar API pihak ketiga; atau listing yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan        | Perintah instalasi yang diobfuskasi, installer pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa kemampuan ditinjau yang jelas, persyaratan rahasia atau kunci privat yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa kemampuan ditinjau yang jelas, atau metadata yang menyembunyikan apa yang sebenarnya dibutuhkan listing untuk berjalan. |
| Materi yang melanggar hak cipta atau hak lainnya           | Menerbitkan ulang skill, plugin, dokumentasi, aset merek, atau kode proprietari milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis atau penerbit asli.                                                                                                                            |

## Perilaku marketplace yang tidak diizinkan

ClawHub juga meninjau bagaimana penerbit menggunakan marketplace. Jangan gunakan
ClawHub untuk memanipulasi penemuan, metrik, sinyal kepercayaan, sistem
moderasi, atau perhatian pengguna.

Perilaku marketplace yang tidak diizinkan mencakup:

- memublikasikan secara massal sejumlah besar listing dengan usaha rendah,
  duplikatif, placeholder, atau yang dibuat mesin yang tidak tampak memiliki
  nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan Skills atau plugin yang
  hampir identik
- memublikasikan ratusan listing dengan sedikit atau tanpa penggunaan,
  pemeliharaan, kejelasan sumber, atau diferensiasi bermakna
- menaikkan instalasi, unduhan, bintang, atau metrik engagement lainnya secara
  artifisial melalui otomatisasi, loop instalasi mandiri, akun palsu, aktivitas
  terkoordinasi, engagement berbayar, atau perilaku non-organik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas
  penerbit, atau peninjauan marketplace
- menyesatkan pengguna tentang kepemilikan, sumber, kapabilitas, postur
  keamanan, persyaratan instalasi, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang sudah disembunyikan, dihapus, atau
  diblokir tanpa memperbaiki masalah dasarnya

Publikasi bervolume tinggi tidak otomatis merupakan penyalahgunaan. Katalog
besar dapat diterima ketika listing-nya berbeda secara bermakna, dijelaskan
secara akurat, dipelihara, dan digunakan oleh pengguna nyata. Katalog besar
menjadi masalah kepercayaan dan keselamatan ketika volume dipasangkan dengan
listing yang tipis, duplikatif, menyesatkan, tidak dipelihara, atau dipromosikan
secara artifisial.

## Hak konten

Jika Anda yakin konten di ClawHub melanggar hak cipta atau hak Anda lainnya,
gunakan [Permintaan Hak Konten](/id/clawhub/content-rights). Jangan gunakan laporan
marketplace biasa untuk klaim hak cipta atau hak kecuali listing tersebut juga
tidak aman, berbahaya, atau menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal penyalahgunaan statistik,
laporan pengguna, dan peninjauan staf untuk mengidentifikasi konten tidak aman
atau perilaku publikasi yang menyalahgunakan. Sebuah sinyal tidak membuktikan
penyalahgunaan dengan sendirinya; sinyal tersebut membantu ClawHub memutuskan
apa yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, menghapus lunak, atau, jika didukung untuk
  jenis sumber daya tersebut, menghapus permanen listing yang melanggar
- memblokir unduhan atau instalasi untuk rilis yang tidak aman
- mencabut token API
- menghapus lunak konten terkait
- membatasi akses publikasi
- memblokir pelanggar berulang atau berat

Kami tidak menjamin penegakan yang selalu diawali peringatan untuk penyalahgunaan
yang jelas. Lihat [Moderasi dan Keamanan Akun](/id/clawhub/moderation) untuk laporan,
penahanan moderasi, listing tersembunyi, pemblokiran, dan reputasi akun.
