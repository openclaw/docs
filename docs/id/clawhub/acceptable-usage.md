---
read_when:
    - Meninjau unggahan untuk mendeteksi penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau panduan operasional reviewer
    - Menentukan apakah suatu skill harus disembunyikan atau pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-07-19T04:51:22Z"
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
Gunakan halaman ini untuk menentukan apakah konten atau perilaku penerbitan termasuk
dalam ClawHub.

Aturan ini berlaku untuk tindakan suatu listing, hal yang diminta untuk dijalankan
oleh pengguna, cara listing merepresentasikan dirinya, dan cara penerbit menggunakan
fitur penemuan, instalasi, dan kepercayaan ClawHub. Untuk status moderasi dan reputasi akun,
lihat [Moderasi dan Keamanan Akun](/id/clawhub/moderation). Untuk klaim hak cipta atau hak
lainnya, lihat [Permintaan Hak atas Konten](/id/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang bermanfaat, mudah dipahami, dan diterbitkan dengan
iktikad baik.

| Kategori                                         | Diizinkan jika                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                         | Listing membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.                                               |
| Alur kerja UI, data, dan otomatisasi             | Cakupannya jelas, kredensial yang diperlukan dinyatakan secara eksplisit, dan tindakan berisiko mencakup jalur peninjauan, uji coba, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan peninjauan penyalahgunaan | Alat diposisikan untuk peninjauan yang diizinkan, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.                          |
| Alur kerja pribadi atau tim                      | Alur kerja menggunakan akun berbasis persetujuan, penyiapan yang transparan, dan izin yang eksplisit.                                            |
| Katalog yang dipelihara                          | Setiap listing berbeda, bermanfaat, dideskripsikan secara akurat, dan dipelihara secara wajar.                                                |

Konteks berperan penting. Topik yang sama dapat diterima dalam lingkungan defensif
yang terbatas atau berbasis persetujuan, tetapi tidak dapat diterima jika dikemas sebagai
alur kerja penyalahgunaan.

## Konten yang dilarang

ClawHub tidak menyediakan konten yang tujuan utamanya adalah penyalahgunaan,
penipuan, eksekusi yang tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tanpa izin atau pengelakan keamanan                   | Pengelakan autentikasi, pengambilalihan akun, penyalahgunaan batas laju, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan kembali, atau persetujuan otomatis alur pemasangan untuk pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan pengelakan pemblokiran          | Akun terselubung setelah pemblokiran, pemanasan atau pembiakan akun, interaksi palsu, otomatisasi multiakun, pengeposan massal, bot spam, atau otomatisasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, scam, dan alur kerja keuangan yang menyesatkan    | Sertifikat atau faktur palsu, alur pembayaran yang menyesatkan, penjangkauan scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan data yang melanggar privasi atau pengawasan       | Pengambilan data kontak untuk spam, penyebaran informasi pribadi, penguntitan, ekstraksi prospek yang dipadukan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor maupun kumpulan data hasil pembobolan.                                                                                                                  |
| Peniruan tanpa persetujuan atau manipulasi identitas        | Pertukaran wajah, kembaran digital, influencer kloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan fitur keamanan dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; pembungkus konten dewasa untuk API pihak ketiga; atau listing yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan | Perintah instalasi yang disamarkan, penginstal pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa kemudahan peninjauan yang jelas, persyaratan rahasia atau kunci privat yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa kemudahan peninjauan yang jelas, atau metadata yang menyembunyikan kebutuhan sebenarnya untuk menjalankan listing. |
| Materi yang melanggar hak cipta atau hak lainnya            | Menerbitkan ulang Skills, Plugin, dokumentasi, aset merek, atau kode proprieter milik pihak lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis maupun penerbit asli.                                                                                                                            |

## Perilaku marketplace yang dilarang

ClawHub juga meninjau cara penerbit menggunakan marketplace. Jangan gunakan ClawHub untuk
memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi, atau perhatian
pengguna.

Perilaku marketplace yang dilarang mencakup:

- menerbitkan secara massal sejumlah besar listing berkualitas rendah, duplikatif, pengisi sementara, atau
  buatan mesin yang tampaknya tidak memberikan nilai nyata bagi pengguna
- membanjiri fitur pencarian atau kategori dengan Skills atau Plugin yang nyaris identik
- menerbitkan ratusan listing dengan sedikit atau tanpa penggunaan, pemeliharaan, kejelasan
  sumber, atau pembeda yang bermakna
- meningkatkan jumlah instalasi, unduhan, bintang, atau metrik interaksi lainnya secara
  artifisial melalui otomatisasi, siklus instalasi mandiri, akun palsu, aktivitas
  terkoordinasi, interaksi berbayar, atau perilaku nonorganik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas penerbit, atau
  peninjauan marketplace
- menyesatkan pengguna tentang kepemilikan, sumber, kemampuan, postur keamanan,
  persyaratan instalasi, atau afiliasi dengan proyek maupun penerbit lain
- berulang kali mengunggah konten yang telah disembunyikan, dihapus, atau diblokir
  tanpa memperbaiki masalah yang mendasarinya

Penerbitan dalam volume tinggi tidak otomatis merupakan penyalahgunaan. Katalog besar dapat diterima
jika listing di dalamnya berbeda secara bermakna, dideskripsikan secara akurat, dipelihara,
dan digunakan oleh pengguna nyata. Katalog besar menjadi masalah kepercayaan dan keamanan jika
volume disertai listing yang minim substansi, duplikatif, menyesatkan, tidak dipelihara, atau
dipromosikan secara artifisial.

## Hak atas konten

Jika Anda meyakini bahwa konten di ClawHub melanggar hak cipta atau hak Anda lainnya, gunakan
[Permintaan Hak atas Konten](/id/clawhub/content-rights). Jangan gunakan laporan marketplace biasa
untuk klaim hak cipta atau hak lainnya, kecuali listing tersebut juga tidak aman,
berbahaya, atau menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal statistik penyalahgunaan, laporan pengguna, dan
peninjauan staf untuk mengidentifikasi konten yang tidak aman atau perilaku penerbitan yang menyalahgunakan. Suatu sinyal
tidak dengan sendirinya membuktikan penyalahgunaan; sinyal tersebut membantu ClawHub menentukan hal yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, melakukan penghapusan lunak, atau, jika didukung untuk jenis sumber daya tersebut,
  melakukan penghapusan permanen terhadap listing yang melanggar
- memblokir unduhan atau instalasi untuk rilis yang tidak aman
- mencabut token API
- melakukan penghapusan lunak terhadap konten terkait
- membatasi akses penerbitan
- memblokir pelanggar berulang atau berat

Kami tidak menjamin pemberian peringatan sebelum penegakan untuk penyalahgunaan yang jelas. Lihat
[Moderasi dan Keamanan Akun](/id/clawhub/moderation) untuk laporan, penangguhan moderasi,
listing tersembunyi, pemblokiran, dan reputasi akun.
