---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Memutuskan apakah sebuah skill harus disembunyikan atau seorang pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-07-01T20:35:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menghosting Skills, plugin, paket, dan metadata marketplace untuk OpenClaw.
Gunakan halaman ini untuk menentukan apakah konten atau perilaku penerbitan layak berada di
ClawHub.

Aturan ini berlaku untuk apa yang dilakukan sebuah listing, apa yang diminta untuk dijalankan oleh pengguna, bagaimana listing itu
merepresentasikan dirinya, dan bagaimana penerbit menggunakan permukaan penemuan, pemasangan, dan
kepercayaan ClawHub. Untuk status moderasi dan reputasi akun, lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation). Untuk klaim hak cipta atau hak lainnya,
lihat [Permintaan Hak Konten](/id/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang berguna, mudah dipahami, dan diterbitkan dengan itikad
baik.

| Kategori                                         | Diizinkan saat                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                         | Listing membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.   |
| Alur kerja UI, data, dan automasi                | Cakupannya jelas, kredensial yang diperlukan eksplisit, dan tindakan berisiko mencakup jalur tinjauan, dry-run, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan peninjauan penyalahgunaan | Alat diposisikan untuk tinjauan yang terotorisasi, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.       |
| Alur kerja pribadi atau tim                      | Alur kerja menggunakan akun berbasis persetujuan, penyiapan yang transparan, dan izin eksplisit.                                  |
| Katalog yang dipelihara                          | Setiap listing berbeda, berguna, dijelaskan secara akurat, dan dipelihara secara wajar.                                           |

Konteks penting. Topik yang sama dapat diterima dalam pengaturan defensif yang sempit atau
berbasis persetujuan, dan tidak dapat diterima saat dikemas sebagai alur kerja penyalahgunaan.

## Konten yang dilarang

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan, penipuan, eksekusi yang tidak aman,
atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tanpa otorisasi atau bypass keamanan                  | Bypass auth, pengambilalihan akun, penyalahgunaan rate-limit, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, atau persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan penghindaran pemblokiran        | Akun terselubung setelah pemblokiran, account warming atau farming, engagement palsu, automasi multi-akun, posting massal, bot spam, atau automasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, scam, dan alur kerja finansial yang menyesatkan   | Sertifikat atau faktur palsu, alur pembayaran yang menyesatkan, outreach scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan atau pengawasan yang invasif terhadap privasi     | Scraping kontak untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan outreach tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau dump pelanggaran.                                                                                                                  |
| Peniruan atau manipulasi identitas tanpa persetujuan        | Face swap, kembaran digital, influencer yang dikloning, persona palsu, atau tooling lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan keamanan dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; wrapper konten dewasa di sekitar API pihak ketiga; atau listing yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi tersembunyi, tidak aman, atau menyesatkan | Perintah pemasangan yang diobfuscate, installer pipe-to-shell seperti konten yang diunduh lalu dijalankan dengan `sh` atau `bash` tanpa kemampuan peninjauan yang jelas, persyaratan rahasia atau private-key yang tidak dinyatakan, eksekusi remote `npx @latest` tanpa kemampuan peninjauan yang jelas, atau metadata yang menyembunyikan apa yang benar-benar dibutuhkan listing untuk berjalan. |
| Materi yang melanggar hak cipta atau hak lain               | Menerbitkan ulang skill, plugin, dokumen, aset merek, atau kode proprietary milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis atau penerbit asli.                                                                                                                            |

## Perilaku marketplace yang dilarang

ClawHub juga meninjau bagaimana penerbit menggunakan marketplace. Jangan gunakan ClawHub untuk
memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi, atau perhatian
pengguna.

Perilaku marketplace yang dilarang mencakup:

- menerbitkan secara massal banyak listing yang rendah usaha, duplikatif, placeholder, atau
  dihasilkan mesin dan tampak tidak memiliki nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan skill atau plugin yang hampir identik
- menerbitkan ratusan listing dengan penggunaan, pemeliharaan, kejelasan sumber,
  atau diferensiasi bermakna yang sedikit atau tidak ada
- menaikkan pemasangan, unduhan, bintang, atau metrik engagement lainnya secara artifisial
  melalui automasi, loop pemasangan sendiri, akun palsu, aktivitas terkoordinasi,
  engagement berbayar, atau perilaku non-organik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas penerbit, atau
  peninjauan marketplace
- menyesatkan pengguna tentang kepemilikan, sumber, kemampuan, postur keamanan,
  persyaratan pemasangan, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang sudah disembunyikan, dihapus, atau diblokir
  tanpa memperbaiki masalah dasarnya

Penerbitan volume tinggi tidak otomatis merupakan penyalahgunaan. Katalog besar dapat diterima
saat listing berbeda secara bermakna, dijelaskan secara akurat, dipelihara,
dan digunakan oleh pengguna nyata. Katalog besar menjadi masalah kepercayaan dan keamanan saat
volume dipasangkan dengan listing yang tipis, duplikatif, menyesatkan, tidak dipelihara, atau
dipromosikan secara artifisial.

## Hak konten

Jika Anda yakin konten di ClawHub melanggar hak cipta atau hak Anda yang lain, gunakan
[Permintaan Hak Konten](/id/clawhub/content-rights). Jangan gunakan laporan marketplace biasa
untuk klaim hak cipta atau hak kecuali listing tersebut juga tidak aman,
berbahaya, atau menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal penyalahgunaan statistik, laporan pengguna, dan
tinjauan staf untuk mengidentifikasi konten yang tidak aman atau perilaku penerbitan yang menyalahgunakan. Sebuah sinyal
tidak membuktikan penyalahgunaan dengan sendirinya; sinyal membantu ClawHub menentukan apa yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, soft-delete, atau, jika didukung untuk jenis sumber daya tersebut,
  hard-delete listing yang melanggar
- memblokir unduhan atau pemasangan untuk rilis yang tidak aman
- mencabut token API
- soft-delete konten terkait
- membatasi akses penerbitan
- memblokir pelanggar berulang atau berat

Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas. Lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan, penahanan moderasi,
listing tersembunyi, pemblokiran, dan reputasi akun.
