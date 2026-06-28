---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumen moderasi atau runbook peninjau
    - Menentukan apakah suatu skill harus disembunyikan atau pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-06-28T00:10:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menghosting Skills, Plugin, paket, dan metadata marketplace untuk OpenClaw.
Gunakan halaman ini untuk menentukan apakah konten atau perilaku publikasi termasuk
di ClawHub.

Aturan ini berlaku untuk apa yang dilakukan sebuah cantuman, apa yang diminta untuk
dijalankan oleh pengguna, bagaimana cantuman tersebut merepresentasikan dirinya, dan
bagaimana penerbit menggunakan permukaan penemuan, instalasi, dan kepercayaan
ClawHub. Untuk status moderasi dan reputasi akun, lihat
[Moderasi dan Keamanan Akun](/id/clawhub/moderation). Untuk klaim hak cipta atau hak
lainnya, lihat [Permintaan Hak Konten](/id/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang berguna, dapat dipahami, dan diterbitkan dengan itikad
baik.

| Kategori                                         | Diizinkan ketika                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas developer                           | Cantuman membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak.                                               |
| Alur kerja UI, data, dan otomasi               | Cakupannya jelas, kredensial yang diperlukan dinyatakan secara eksplisit, dan tindakan berisiko menyertakan jalur peninjauan, dry-run, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan peninjauan penyalahgunaan | Alat diposisikan untuk peninjauan yang berwenang, menjaga bukti, dan membuat batas persetujuan manusia tetap jelas.                          |
| Alur kerja pribadi atau tim                       | Alur kerja menggunakan akun berbasis persetujuan, penyiapan yang transparan, dan izin yang eksplisit.                                            |
| Katalog yang dipelihara                              | Setiap cantuman berbeda, berguna, dijelaskan secara akurat, dan dipelihara secara wajar.                                                |

Konteks penting. Topik yang sama dapat diterima dalam pengaturan defensif yang
sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai
alur kerja penyalahgunaan.

## Konten yang tidak diizinkan

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan,
penipuan, eksekusi yang tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tanpa izin atau bypass keamanan                      | Bypass autentikasi, pengambilalihan akun, penyalahgunaan rate-limit, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan kembali, atau persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan pengelakan pemblokiran                              | Akun tersembunyi setelah pemblokiran, pemanasan atau pembiakan akun, engagement palsu, otomasi multi-akun, posting massal, bot spam, atau otomasi yang dibuat untuk menghindari deteksi.                                                                                                                                          |
| Penipuan, scam, dan alur kerja keuangan yang menipu             | Sertifikat atau faktur palsu, alur pembayaran yang menipu, penjangkauan scam, bukti sosial palsu, alur kerja identitas sintetis untuk penipuan, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan atau pengawasan yang melanggar privasi                 | Pengambilan kontak untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau dump pelanggaran.                                                                                                                  |
| Peniruan tanpa persetujuan atau manipulasi identitas       | Pertukaran wajah, kembaran digital, influencer kloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau pembuatan konten dewasa dengan pengaman dinonaktifkan | Pembuatan gambar, video, atau konten NSFW; wrapper konten dewasa di sekitar API pihak ketiga; atau cantuman yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan        | Perintah instalasi yang diobfuskasi, installer pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa kemampuan peninjauan yang jelas, persyaratan rahasia atau private key yang tidak dinyatakan, eksekusi jarak jauh `npx @latest` tanpa kemampuan peninjauan yang jelas, atau metadata yang menyembunyikan apa yang sebenarnya dibutuhkan cantuman untuk berjalan. |
| Materi yang melanggar hak cipta atau hak lainnya           | Menerbitkan ulang Skills, Plugin, dokumentasi, aset merek, atau kode proprietari milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis atau penerbit asli.                                                                                                                            |

## Perilaku marketplace yang tidak diizinkan

ClawHub juga meninjau bagaimana penerbit menggunakan marketplace. Jangan gunakan
ClawHub untuk memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi,
atau perhatian pengguna.

Perilaku marketplace yang tidak diizinkan meliputi:

- menerbitkan secara massal sejumlah besar cantuman rendah upaya, duplikatif,
  placeholder, atau hasil mesin yang tampaknya tidak memiliki nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan Skills atau Plugin yang hampir identik
- menerbitkan ratusan cantuman dengan sedikit atau tanpa penggunaan, pemeliharaan,
  kejelasan sumber, atau diferensiasi yang bermakna
- meningkatkan instalasi, unduhan, bintang, atau metrik engagement lainnya secara
  artifisial melalui otomasi, loop instalasi mandiri, akun palsu, aktivitas
  terkoordinasi, engagement berbayar, atau perilaku non-organik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas penerbit,
  atau peninjauan marketplace
- menyesatkan pengguna tentang kepemilikan, sumber, kemampuan, postur keamanan,
  persyaratan instalasi, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang sudah disembunyikan, dihapus, atau diblokir
  tanpa memperbaiki masalah yang mendasarinya

Publikasi bervolume tinggi tidak secara otomatis merupakan penyalahgunaan. Katalog
besar dapat diterima ketika cantumannya berbeda secara bermakna, dijelaskan secara
akurat, dipelihara, dan digunakan oleh pengguna nyata. Katalog besar menjadi masalah
kepercayaan dan keamanan ketika volumenya dipasangkan dengan cantuman yang tipis,
duplikatif, menyesatkan, tidak dipelihara, atau dipromosikan secara artifisial.

## Hak konten

Jika Anda yakin konten di ClawHub melanggar hak cipta atau hak Anda lainnya, gunakan
[Permintaan Hak Konten](/id/clawhub/content-rights). Jangan gunakan laporan marketplace
normal untuk klaim hak cipta atau hak kecuali cantuman tersebut juga tidak aman,
berbahaya, atau menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal penyalahgunaan statistik,
laporan pengguna, dan peninjauan staf untuk mengidentifikasi konten tidak aman atau
perilaku publikasi yang menyalahgunakan. Sebuah sinyal tidak membuktikan
penyalahgunaan dengan sendirinya; sinyal tersebut membantu ClawHub menentukan apa
yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, melakukan soft-delete, atau, jika didukung
  untuk jenis sumber daya tersebut, melakukan hard-delete pada cantuman yang melanggar
- memblokir unduhan atau instalasi untuk rilis yang tidak aman
- mencabut token API
- melakukan soft-delete pada konten terkait
- membatasi akses publikasi
- memblokir pelanggar berulang atau berat

Kami tidak menjamin penegakan yang selalu diawali peringatan untuk penyalahgunaan
yang jelas. Lihat [Moderasi dan Keamanan Akun](/id/clawhub/moderation) untuk laporan,
penahanan moderasi, cantuman tersembunyi, pemblokiran, dan reputasi akun.
