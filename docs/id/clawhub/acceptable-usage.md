---
read_when:
    - Meninjau unggahan untuk mendeteksi penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau panduan operasional peninjau
    - Menentukan apakah suatu skill harus disembunyikan atau pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-07-16T17:55:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menyediakan Skills, Plugin, paket, dan metadata marketplace untuk OpenClaw.
Gunakan halaman ini untuk menentukan apakah konten atau perilaku penerbitan
sesuai untuk ClawHub.

Aturan ini berlaku untuk tindakan suatu listing, hal yang diminta untuk dijalankan pengguna, cara listing tersebut
merepresentasikan dirinya, dan cara penerbit menggunakan permukaan penemuan, penginstalan, dan
kepercayaan ClawHub. Untuk status moderasi dan status akun, lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation). Untuk klaim hak cipta atau hak lainnya,
lihat [Permintaan Hak atas Konten](/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang bermanfaat, mudah dipahami, dan diterbitkan dengan
itikad baik.

| Kategori                                         | Diizinkan jika                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                           | Listing membantu pengguna membangun, menguji, memigrasikan, melakukan debug, mendokumentasikan, atau mengoperasikan perangkat lunak.                                               |
| Alur kerja UI, data, dan otomatisasi               | Cakupannya jelas, kredensial yang diperlukan dinyatakan secara eksplisit, dan tindakan berisiko menyertakan jalur peninjauan, uji coba tanpa eksekusi, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan peninjauan penyalahgunaan | Alat dirancang untuk peninjauan yang berwenang, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.                          |
| Alur kerja pribadi atau tim                       | Alur kerja menggunakan akun berbasis persetujuan, penyiapan yang transparan, dan izin yang eksplisit.                                            |
| Katalog yang dipelihara                              | Setiap listing berbeda, bermanfaat, dideskripsikan secara akurat, dan dipelihara secara wajar.                                                |

Konteks itu penting. Topik yang sama dapat diterima dalam lingkungan defensif yang terbatas atau
berbasis persetujuan, tetapi tidak dapat diterima jika dikemas sebagai alur kerja penyalahgunaan.

## Konten yang dilarang

ClawHub tidak menyediakan konten yang tujuan utamanya adalah penyalahgunaan, penipuan, eksekusi
yang tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tanpa izin atau bypass keamanan                      | Bypass autentikasi, pengambilalihan akun, penyalahgunaan batas laju, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan kembali, atau persetujuan otomatis terhadap alur pemasangan bagi pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan penghindaran pemblokiran                              | Akun tersembunyi setelah diblokir, pemanasan atau peternakan akun, interaksi palsu, otomatisasi multiakun, pengeposan massal, bot spam, atau otomatisasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, skema penipuan, dan alur kerja keuangan yang menyesatkan             | Sertifikat atau faktur palsu, alur pembayaran yang menyesatkan, penjangkauan untuk penipuan, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan data atau pengawasan yang melanggar privasi                 | Pengambilan data kontak untuk spam, doxing, penguntitan, ekstraksi prospek yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor maupun dump pelanggaran data.                                                                                                                  |
| Peniruan tanpa persetujuan atau manipulasi identitas       | Pertukaran wajah, kembaran digital, influencer kloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan fitur keamanan dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; wrapper konten dewasa untuk API pihak ketiga; atau listing yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan        | Perintah penginstalan yang disamarkan, penginstal pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa kemudahan peninjauan yang jelas, persyaratan rahasia atau kunci privat yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa kemudahan peninjauan yang jelas, atau metadata yang menyembunyikan hal yang sebenarnya diperlukan listing agar dapat dijalankan. |
| Materi yang melanggar hak cipta atau hak lainnya           | Menerbitkan ulang Skills, Plugin, dokumentasi, aset merek, atau kode proprieter milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis maupun penerbit asli.                                                                                                                            |

## Perilaku marketplace yang dilarang

ClawHub juga meninjau cara penerbit menggunakan marketplace. Jangan gunakan ClawHub untuk
memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi, atau perhatian
pengguna.

Perilaku marketplace yang dilarang meliputi:

- menerbitkan secara massal sejumlah besar listing yang dibuat dengan upaya minim, duplikatif, berupa placeholder, atau
  dibuat oleh mesin yang tampaknya tidak memiliki nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan Skills atau Plugin yang hampir identik
- menerbitkan ratusan listing dengan sedikit atau tanpa penggunaan, pemeliharaan, kejelasan
  sumber, atau diferensiasi yang berarti
- meningkatkan jumlah penginstalan, unduhan, bintang, atau metrik interaksi lainnya secara
  artifisial melalui otomatisasi, siklus penginstalan mandiri, akun palsu, aktivitas
  terkoordinasi, interaksi berbayar, atau perilaku nonorganik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas penerbit, atau
  peninjauan marketplace
- menyesatkan pengguna tentang kepemilikan, sumber, kemampuan, postur keamanan,
  persyaratan penginstalan, atau afiliasi dengan proyek maupun penerbit lain
- berulang kali mengunggah konten yang telah disembunyikan, dihapus, atau diblokir
  tanpa memperbaiki masalah yang mendasarinya

Penerbitan dalam volume tinggi tidak otomatis merupakan penyalahgunaan. Katalog besar dapat diterima
jika listing-nya berbeda secara bermakna, dideskripsikan secara akurat, dipelihara,
dan digunakan oleh pengguna nyata. Katalog besar menjadi masalah kepercayaan dan keamanan jika
volumenya disertai listing yang minim substansi, duplikatif, menyesatkan, tidak dipelihara, atau
dipromosikan secara artifisial.

## Hak atas konten

Jika Anda meyakini bahwa konten di ClawHub melanggar hak cipta atau hak Anda lainnya, gunakan
[Permintaan Hak atas Konten](/clawhub/content-rights). Jangan gunakan laporan marketplace biasa
untuk klaim hak cipta atau hak lainnya, kecuali listing tersebut juga tidak aman,
berbahaya, atau menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal statistik penyalahgunaan, laporan pengguna, dan
peninjauan staf untuk mengidentifikasi konten tidak aman atau perilaku penerbitan yang menyalahgunakan. Sebuah sinyal
tidak dengan sendirinya membuktikan penyalahgunaan; sinyal tersebut membantu ClawHub menentukan hal yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, melakukan penghapusan lunak, atau, jika didukung untuk jenis sumber daya tersebut,
  melakukan penghapusan permanen terhadap listing yang melanggar
- memblokir unduhan atau penginstalan untuk rilis yang tidak aman
- mencabut token API
- melakukan penghapusan lunak terhadap konten terkait
- membatasi akses penerbitan
- memblokir pelanggar berulang atau berat

Kami tidak menjamin bahwa penegakan selalu diawali dengan peringatan untuk penyalahgunaan yang jelas. Lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan, penahanan moderasi,
listing tersembunyi, pemblokiran, dan status akun.
