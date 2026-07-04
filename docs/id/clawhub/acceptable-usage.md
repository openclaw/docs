---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Memutuskan apakah sebuah skill harus disembunyikan atau seorang pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-07-04T20:43:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menghosting Skills, plugin, paket, dan metadata marketplace untuk OpenClaw.
Gunakan halaman ini untuk menentukan apakah konten atau perilaku penerbitan termasuk
di ClawHub.

Aturan ini berlaku untuk apa yang dilakukan listing, apa yang diminta untuk dijalankan
oleh pengguna, bagaimana listing merepresentasikan dirinya, dan bagaimana penerbit
menggunakan permukaan penemuan, instalasi, dan kepercayaan ClawHub. Untuk status
moderasi dan reputasi akun, lihat [Moderasi dan Keamanan Akun](/clawhub/moderation).
Untuk klaim hak cipta atau hak lainnya, lihat [Permintaan Hak Konten](/id/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menyambut konten yang berguna, mudah dipahami, dan diterbitkan dengan iktikad
baik.

| Kategori                                         | Diizinkan ketika                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                           | Listing membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.                                               |
| Alur kerja UI, data, dan otomasi               | Cakupannya jelas, kredensial yang diperlukan dinyatakan eksplisit, dan tindakan berisiko menyertakan jalur peninjauan, dry-run, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan peninjauan penyalahgunaan | Alat diposisikan untuk peninjauan yang terotorisasi, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.                          |
| Alur kerja pribadi atau tim                       | Alur kerja menggunakan akun berbasis persetujuan, penyiapan transparan, dan izin eksplisit.                                            |
| Katalog yang dipelihara                              | Setiap listing berbeda, berguna, dijelaskan secara akurat, dan dipelihara secara wajar.                                                |

Konteks penting. Topik yang sama dapat diterima dalam konteks defensif yang sempit
atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai alur kerja
penyalahgunaan.

## Konten yang tidak diizinkan

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan, penipuan,
eksekusi tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tidak sah atau bypass keamanan                      | Bypass autentikasi, pengambilalihan akun, penyalahgunaan rate-limit, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan kembali, atau persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan penghindaran pemblokiran                              | Akun tersembunyi setelah pemblokiran, pemanasan atau farming akun, engagement palsu, otomasi multi-akun, posting massal, bot spam, atau otomasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, scam, dan alur kerja keuangan yang menipu             | Sertifikat atau faktur palsu, alur pembayaran yang menipu, outreach scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan atau pengawasan yang melanggar privasi                 | Scraping kontak untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan outreach tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau dump pelanggaran data.                                                                                                                  |
| Peniruan tanpa persetujuan atau manipulasi identitas       | Tukar wajah, kembaran digital, influencer kloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan keamanan dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; wrapper konten dewasa di sekitar API pihak ketiga; atau listing yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan        | Perintah instalasi yang diobfuskasi, installer pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa kemampuan peninjauan yang jelas, persyaratan rahasia atau kunci privat yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa kemampuan peninjauan yang jelas, atau metadata yang menyembunyikan apa yang benar-benar dibutuhkan listing untuk berjalan. |
| Materi yang melanggar hak cipta atau hak lain           | Menerbitkan ulang skill, plugin, dokumentasi, aset merek, atau kode proprietari milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis atau penerbit asli.                                                                                                                            |

## Perilaku marketplace yang tidak diizinkan

ClawHub juga meninjau bagaimana penerbit menggunakan marketplace. Jangan gunakan
ClawHub untuk memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi,
atau perhatian pengguna.

Perilaku marketplace yang tidak diizinkan mencakup:

- menerbitkan secara massal listing dalam jumlah besar yang berkualitas rendah,
  duplikatif, berupa placeholder, atau dihasilkan mesin dan tampaknya tidak memiliki
  nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan Skills atau plugin yang hampir identik
- menerbitkan ratusan listing dengan sedikit atau tanpa penggunaan, pemeliharaan,
  kejelasan sumber, atau diferensiasi yang bermakna
- menggelembungkan instalasi, unduhan, bintang, atau metrik engagement lainnya secara
  artifisial melalui otomasi, loop instalasi mandiri, akun palsu, aktivitas terkoordinasi,
  engagement berbayar, atau perilaku non-organik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas penerbit,
  atau peninjauan marketplace
- menyesatkan pengguna tentang kepemilikan, sumber, kemampuan, postur keamanan,
  persyaratan instalasi, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang sudah disembunyikan, dihapus, atau diblokir
  tanpa memperbaiki masalah dasarnya

Penerbitan bervolume tinggi tidak otomatis merupakan penyalahgunaan. Katalog besar
dapat diterima ketika listing berbeda secara bermakna, dijelaskan secara akurat,
dipelihara, dan digunakan oleh pengguna nyata. Katalog besar menjadi masalah
kepercayaan dan keamanan ketika volume dipadukan dengan listing yang tipis, duplikatif,
menyesatkan, tidak dipelihara, atau dipromosikan secara artifisial.

## Hak konten

Jika Anda yakin konten di ClawHub melanggar hak cipta atau hak Anda lainnya, gunakan
[Permintaan Hak Konten](/id/clawhub/content-rights). Jangan gunakan laporan marketplace
normal untuk klaim hak cipta atau hak kecuali listing tersebut juga tidak aman,
berbahaya, atau menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal penyalahgunaan statistik,
laporan pengguna, dan peninjauan staf untuk mengidentifikasi konten tidak aman atau
perilaku penerbitan yang menyalahgunakan. Sebuah sinyal tidak membuktikan
penyalahgunaan dengan sendirinya; sinyal membantu ClawHub memutuskan apa yang perlu
ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, soft-delete, atau, jika didukung untuk jenis
  sumber daya tersebut, hard-delete listing yang melanggar
- memblokir unduhan atau instalasi untuk rilis yang tidak aman
- mencabut token API
- soft-delete konten terkait
- membatasi akses penerbitan
- memblokir pelanggar berulang atau berat

Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan
yang jelas. Lihat [Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan,
penahanan moderasi, listing tersembunyi, pemblokiran, dan reputasi akun.
