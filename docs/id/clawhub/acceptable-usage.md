---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Memutuskan apakah sebuah skill harus disembunyikan atau seorang pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-07-03T02:56:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menghosting Skills, Plugin, paket, dan metadata pasar untuk OpenClaw.
Gunakan halaman ini untuk menentukan apakah konten atau perilaku publikasi layak berada di
ClawHub.

Aturan ini berlaku pada apa yang dilakukan sebuah listing, apa yang diminta untuk dijalankan
oleh pengguna, bagaimana listing tersebut merepresentasikan dirinya, dan bagaimana penerbit menggunakan permukaan
penemuan, instalasi, dan kepercayaan ClawHub. Untuk status moderasi dan reputasi akun, lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation). Untuk klaim hak cipta atau hak lainnya,
lihat [Permintaan Hak Konten](/id/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang berguna, mudah dipahami, dan diterbitkan dengan iktikad
baik.

| Kategori                                         | Diizinkan ketika                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                         | Listing membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.   |
| Alur kerja UI, data, dan otomatisasi             | Cakupannya jelas, kredensial yang diperlukan dinyatakan eksplisit, dan tindakan berisiko menyertakan jalur peninjauan, dry-run, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan peninjauan penyalahgunaan | Alat dibingkai untuk peninjauan berwenang, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.              |
| Alur kerja pribadi atau tim                      | Alur kerja menggunakan akun berbasis persetujuan, penyiapan transparan, dan izin eksplisit.                                      |
| Katalog yang dipelihara                          | Setiap listing berbeda, berguna, dijelaskan secara akurat, dan dipelihara secara wajar.                                         |

Konteks penting. Topik yang sama dapat diterima dalam lingkungan defensif yang sempit atau
berbasis persetujuan dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.

## Konten yang tidak diizinkan

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan, penipuan, eksekusi
yang tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tidak sah atau pengelakan keamanan                    | Pengelakan autentikasi, pengambilalihan akun, penyalahgunaan batas laju, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, atau persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.                                                               |
| Penyalahgunaan platform dan pengelakan pemblokiran          | Akun tersembunyi setelah pemblokiran, pemanasan atau peternakan akun, interaksi palsu, otomatisasi multi-akun, posting massal, bot spam, atau otomatisasi yang dibuat untuk menghindari deteksi.                                                                                                            |
| Penipuan, skema scam, dan alur kerja keuangan yang menyesatkan | Sertifikat atau faktur palsu, alur pembayaran menyesatkan, penjangkauan scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                      |
| Pengayaan atau pengawasan yang melanggar privasi            | Pengambilan kontak untuk spam, doxxing, penguntitan, ekstraksi prospek yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau kumpulan data pelanggaran.                                                     |
| Peniruan atau manipulasi identitas tanpa persetujuan        | Pertukaran wajah, kembaran digital, influencer kloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                         |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan keselamatan dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; pembungkus konten dewasa di sekitar API pihak ketiga; atau listing yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                          |
| Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan | Perintah instalasi yang dikaburkan, installer pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa kemampuan peninjauan yang jelas, persyaratan rahasia atau private-key yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa kemampuan peninjauan yang jelas, atau metadata yang menyembunyikan apa yang sebenarnya dibutuhkan listing untuk berjalan. |
| Materi yang melanggar hak cipta atau hak lainnya            | Menerbitkan ulang skill, plugin, dokumentasi, aset merek, atau kode proprietari milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis atau penerbit asli.                                                                                                                            |

## Perilaku pasar yang tidak diizinkan

ClawHub juga meninjau bagaimana penerbit menggunakan pasar. Jangan gunakan ClawHub untuk
memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi, atau perhatian
pengguna.

Perilaku pasar yang tidak diizinkan mencakup:

- menerbitkan secara massal sejumlah besar listing berupaya rendah, duplikatif, placeholder, atau
  yang dibuat mesin yang tampaknya tidak memiliki nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan Skills atau Plugin yang nyaris identik
- menerbitkan ratusan listing dengan sedikit atau tanpa penggunaan, pemeliharaan, kejelasan sumber,
  atau diferensiasi bermakna
- menggembungkan instalasi, unduhan, bintang, atau metrik interaksi lainnya secara artifisial
  melalui otomatisasi, loop instalasi sendiri, akun palsu, aktivitas terkoordinasi,
  interaksi berbayar, atau perilaku non-organik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas penerbit, atau
  tinjauan pasar
- menyesatkan pengguna tentang kepemilikan, sumber, kapabilitas, postur keamanan,
  persyaratan instalasi, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang sudah disembunyikan, dihapus, atau diblokir
  tanpa memperbaiki masalah yang mendasarinya

Publikasi volume tinggi tidak otomatis merupakan penyalahgunaan. Katalog besar dapat diterima
ketika listing-nya berbeda secara bermakna, dijelaskan secara akurat, dipelihara,
dan digunakan oleh pengguna nyata. Katalog besar menjadi masalah kepercayaan dan keamanan ketika
volume dipasangkan dengan listing yang tipis, duplikatif, menyesatkan, tidak dipelihara, atau
dipromosikan secara artifisial.

## Hak konten

Jika Anda yakin konten di ClawHub melanggar hak cipta atau hak lainnya milik Anda, gunakan
[Permintaan Hak Konten](/id/clawhub/content-rights). Jangan gunakan laporan pasar normal
untuk klaim hak cipta atau hak kecuali listing tersebut juga tidak aman,
berbahaya, atau menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal penyalahgunaan statistik, laporan pengguna, dan
peninjauan staf untuk mengidentifikasi konten tidak aman atau perilaku publikasi yang menyalahgunakan. Sebuah sinyal
tidak membuktikan penyalahgunaan dengan sendirinya; sinyal membantu ClawHub menentukan apa yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, soft-delete, atau, jika didukung untuk jenis sumber daya tersebut,
  hard-delete listing yang melanggar
- memblokir unduhan atau instalasi untuk rilis yang tidak aman
- mencabut token API
- soft-delete konten terkait
- membatasi akses publikasi
- memblokir pelanggar berulang atau berat

Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas. Lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan, penahanan moderasi,
listing tersembunyi, pemblokiran, dan reputasi akun.
