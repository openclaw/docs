---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Memutuskan apakah skill harus disembunyikan atau pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-06-30T22:34:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menampung skills, plugin, paket, dan metadata marketplace untuk OpenClaw.
Gunakan halaman ini untuk memutuskan apakah konten atau perilaku penerbitan sesuai
untuk ClawHub.

Aturan ini berlaku untuk apa yang dilakukan sebuah listing, apa yang diminta untuk
dijalankan oleh pengguna, bagaimana listing merepresentasikan dirinya, dan bagaimana
penerbit menggunakan permukaan penemuan, instalasi, dan kepercayaan ClawHub. Untuk
status moderasi dan kedudukan akun, lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation). Untuk klaim hak cipta atau hak
lainnya, lihat [Permintaan Hak Konten](/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang berguna, dapat dipahami, dan diterbitkan dengan
itikad baik.

| Kategori                                          | Diizinkan ketika                                                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas pengembang                          | Listing membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.    |
| Alur kerja UI, data, dan otomatisasi              | Cakupannya jelas, kredensial yang diperlukan dinyatakan eksplisit, dan tindakan berisiko menyertakan jalur tinjauan, dry-run, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan tinjauan penyalahgunaan | Alat dibingkai untuk tinjauan yang berwenang, mempertahankan bukti, dan menjaga batas persetujuan manusia tetap jelas.             |
| Alur kerja pribadi atau tim                       | Alur kerja menggunakan akun berbasis persetujuan, penyiapan yang transparan, dan izin yang eksplisit.                              |
| Katalog terpelihara                               | Setiap listing berbeda, berguna, dijelaskan secara akurat, dan dipelihara secara wajar.                                            |

Konteks penting. Topik yang sama dapat diterima dalam pengaturan defensif yang
sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai
alur kerja penyalahgunaan.

## Konten yang tidak diizinkan

ClawHub tidak menampung konten yang tujuan utamanya adalah penyalahgunaan,
penipuan, eksekusi tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tanpa izin atau bypass keamanan                       | Bypass autentikasi, pengambilalihan akun, penyalahgunaan batas laju, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, atau alur pemasangan yang menyetujui otomatis untuk pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan pengelakan larangan             | Akun tersembunyi setelah larangan, pemanasan atau pertanian akun, keterlibatan palsu, otomatisasi banyak akun, posting massal, bot spam, atau otomatisasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, scam, dan alur kerja keuangan yang menyesatkan    | Sertifikat atau faktur palsu, alur pembayaran yang menyesatkan, penjangkauan scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan atau pengawasan yang melanggar privasi            | Pengambilan kontak untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau dump pelanggaran.                                                                                                                  |
| Peniruan atau manipulasi identitas tanpa persetujuan        | Face swap, kembaran digital, influencer kloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan keamanan dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; wrapper konten dewasa di sekitar API pihak ketiga; atau listing yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi tersembunyi, tidak aman, atau menyesatkan | Perintah instalasi yang diobfuskasi, installer pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa kemampuan peninjauan yang jelas, persyaratan rahasia atau kunci privat yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa kemampuan peninjauan yang jelas, atau metadata yang menyembunyikan apa yang benar-benar dibutuhkan listing untuk berjalan. |
| Materi yang melanggar hak cipta atau hak                    | Menerbitkan ulang skill, plugin, dokumen, aset merek, atau kode proprietari milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis atau penerbit asli.                                                                                                                            |

## Perilaku marketplace yang tidak diizinkan

ClawHub juga meninjau bagaimana penerbit menggunakan marketplace. Jangan gunakan
ClawHub untuk memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi,
atau perhatian pengguna.

Perilaku marketplace yang tidak diizinkan mencakup:

- menerbitkan secara massal sejumlah besar listing yang minim upaya, duplikatif,
  berupa placeholder, atau dihasilkan mesin yang tampaknya tidak memiliki nilai
  nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan skill atau plugin yang
  hampir identik
- menerbitkan ratusan listing dengan sedikit atau tanpa penggunaan, pemeliharaan,
  kejelasan sumber, atau diferensiasi yang bermakna
- secara artifisial meningkatkan instalasi, unduhan, bintang, atau metrik
  keterlibatan lain melalui otomatisasi, putaran instalasi mandiri, akun palsu,
  aktivitas terkoordinasi, keterlibatan berbayar, atau perilaku non-organik
  lainnya
- membuat atau merotasi akun untuk menghindari moderasi, larangan, batas penerbit,
  atau tinjauan marketplace
- menyesatkan pengguna tentang kepemilikan, sumber, kemampuan, postur keamanan,
  persyaratan instalasi, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang sudah disembunyikan, dihapus, atau diblokir
  tanpa memperbaiki masalah dasarnya

Penerbitan bervolume tinggi tidak otomatis merupakan penyalahgunaan. Katalog besar
dapat diterima ketika listing berbeda secara bermakna, dijelaskan secara akurat,
dipelihara, dan digunakan oleh pengguna nyata. Katalog besar menjadi masalah
kepercayaan dan keamanan ketika volume dipasangkan dengan listing yang tipis,
duplikatif, menyesatkan, tidak terpelihara, atau dipromosikan secara artifisial.

## Hak konten

Jika Anda meyakini konten di ClawHub melanggar hak cipta atau hak lain milik Anda,
gunakan [Permintaan Hak Konten](/clawhub/content-rights). Jangan gunakan laporan
marketplace biasa untuk klaim hak cipta atau hak kecuali listing tersebut juga
tidak aman, berbahaya, atau menyesatkan.

## Tinjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal statistik penyalahgunaan,
laporan pengguna, dan tinjauan staf untuk mengidentifikasi konten tidak aman atau
perilaku penerbitan yang menyalahgunakan. Sebuah sinyal tidak membuktikan
penyalahgunaan dengan sendirinya; sinyal membantu ClawHub memutuskan apa yang
perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, menghapus sementara, atau, jika didukung
  untuk jenis sumber daya tersebut, menghapus permanen listing yang melanggar
- memblokir unduhan atau instalasi untuk rilis yang tidak aman
- mencabut token API
- menghapus sementara konten terkait
- membatasi akses penerbitan
- melarang pelanggar berulang atau berat

Kami tidak menjamin penegakan yang didahului peringatan untuk penyalahgunaan yang
jelas. Lihat [Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan,
penahanan moderasi, listing tersembunyi, larangan, dan kedudukan akun.
