---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumen moderasi atau runbook peninjau
    - Menentukan apakah suatu skill harus disembunyikan atau pengguna diblokir
sidebarTitle: Acceptable Usage
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
title: Penggunaan yang Dapat Diterima
x-i18n:
    generated_at: "2026-07-01T15:31:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

ClawHub menghosting Skills, Plugin, paket, dan metadata lokapasar untuk OpenClaw.
Gunakan halaman ini untuk menentukan apakah konten atau perilaku penerbitan termasuk
di ClawHub.

Aturan ini berlaku untuk apa yang dilakukan listing, apa yang diminta untuk dijalankan
oleh pengguna, bagaimana listing merepresentasikan dirinya, dan bagaimana penerbit
menggunakan permukaan penemuan, instalasi, dan kepercayaan ClawHub. Untuk status moderasi
dan reputasi akun, lihat [Moderasi dan Keamanan Akun](/clawhub/moderation). Untuk klaim
hak cipta atau hak lainnya, lihat [Permintaan Hak Konten](/id/clawhub/content-rights).

## Konten yang diizinkan

ClawHub menerima konten yang berguna, dapat dipahami, dan diterbitkan dengan itikad baik.

| Kategori                                         | Diizinkan ketika                                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Produktivitas developer                          | Listing membantu pengguna membangun, menguji, memigrasikan, men-debug, mendokumentasikan, atau mengoperasikan perangkat lunak. |
| Alur kerja UI, data, dan otomatisasi             | Cakupannya jelas, kredensial yang diperlukan dinyatakan eksplisit, dan tindakan berisiko menyertakan jalur peninjauan, dry-run, pratinjau, atau konfirmasi. |
| Keamanan defensif, moderasi, dan tinjauan penyalahgunaan | Alat dibingkai untuk peninjauan yang berwenang, menjaga bukti, dan mempertahankan batas persetujuan manusia yang jelas. |
| Alur kerja pribadi atau tim                      | Alur kerja menggunakan akun berbasis persetujuan, penyiapan transparan, dan izin eksplisit.                                    |
| Katalog yang dikelola                            | Setiap listing berbeda, berguna, dijelaskan secara akurat, dan dikelola secara wajar.                                          |

Konteks itu penting. Topik yang sama dapat diterima dalam pengaturan defensif yang sempit
atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai alur kerja
penyalahgunaan.

## Konten yang dilarang

ClawHub tidak menghosting konten yang tujuan utamanya adalah penyalahgunaan, penipuan,
eksekusi yang tidak aman, atau pelanggaran hak.

| Kategori                                                    | Tidak diizinkan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akses tidak sah atau bypass keamanan                        | Bypass auth, pengambilalihan akun, penyalahgunaan rate limit, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, atau alur pairing yang disetujui otomatis untuk pengguna yang tidak disetujui.                                                                                                                                                   |
| Penyalahgunaan platform dan penghindaran pemblokiran        | Akun tersembunyi setelah diblokir, pemanasan atau pembudidayaan akun, engagement palsu, otomatisasi multi-akun, posting massal, bot spam, atau otomatisasi yang dibangun untuk menghindari deteksi.                                                                                                                                          |
| Fraud, scam, dan alur kerja keuangan yang menipu            | Sertifikat atau faktur palsu, alur pembayaran yang menipu, outreach scam, bukti sosial palsu, alur kerja identitas sintetis untuk fraud, atau alat pembelanjaan/penagihan tanpa persetujuan manusia yang jelas.                                                                                                                    |
| Pengayaan atau pengawasan yang invasif privasi              | Scraping kontak untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan outreach tanpa diminta, pemantauan terselubung, pencocokan biometrik tanpa persetujuan, atau penggunaan data bocor atau dump pelanggaran.                                                                                                                  |
| Peniruan identitas atau manipulasi identitas tanpa persetujuan | Face swap, kembaran digital, influencer yang dikloning, persona palsu, atau alat lain yang digunakan untuk meniru atau menyesatkan.                                                                                                                                                                                                 |
| Konten seksual eksplisit atau generasi dewasa dengan pengaman dinonaktifkan | Generasi gambar, video, atau konten NSFW; wrapper konten dewasa di sekitar API pihak ketiga; atau listing yang tujuan utamanya adalah konten seksual eksplisit.                                                                                                                                                       |
| Persyaratan eksekusi tersembunyi, tidak aman, atau menyesatkan | Perintah instalasi yang dikaburkan, installer pipe-to-shell seperti konten unduhan yang dijalankan dengan `sh` atau `bash` tanpa kemampuan peninjauan yang jelas, persyaratan secret atau private key yang tidak dideklarasikan, eksekusi `npx @latest` jarak jauh tanpa kemampuan peninjauan yang jelas, atau metadata yang menyembunyikan apa yang sebenarnya diperlukan listing untuk berjalan. |
| Materi yang melanggar hak cipta atau melanggar hak          | Menerbitkan ulang skill, plugin, dokumentasi, aset merek, atau kode proprietari milik orang lain tanpa izin; melanggar ketentuan lisensi; atau meniru penulis atau penerbit asli.                                                                                                                            |

## Perilaku lokapasar yang dilarang

ClawHub juga meninjau bagaimana penerbit menggunakan lokapasar. Jangan gunakan ClawHub
untuk memanipulasi penemuan, metrik, sinyal kepercayaan, sistem moderasi, atau perhatian
pengguna.

Perilaku lokapasar yang dilarang mencakup:

- menerbitkan massal sejumlah besar listing yang rendah upaya, duplikatif,
  placeholder, atau dihasilkan mesin dan tidak tampak memiliki nilai nyata bagi pengguna
- membanjiri permukaan pencarian atau kategori dengan skills atau plugin yang hampir identik
- menerbitkan ratusan listing dengan sedikit atau tanpa penggunaan, pemeliharaan, kejelasan
  sumber, atau diferensiasi bermakna
- menggembungkan instalasi, unduhan, bintang, atau metrik engagement lainnya secara artifisial
  melalui otomatisasi, loop instalasi mandiri, akun palsu, aktivitas terkoordinasi,
  engagement berbayar, atau perilaku non-organik lainnya
- membuat atau merotasi akun untuk menghindari moderasi, pemblokiran, batas penerbit, atau
  peninjauan lokapasar
- menyesatkan pengguna tentang kepemilikan, sumber, kemampuan, postur keamanan,
  persyaratan instalasi, atau afiliasi dengan proyek atau penerbit lain
- berulang kali mengunggah konten yang sudah disembunyikan, dihapus, atau diblokir
  tanpa memperbaiki masalah dasarnya

Penerbitan volume tinggi tidak otomatis merupakan penyalahgunaan. Katalog besar dapat diterima
ketika listing berbeda secara bermakna, dijelaskan secara akurat, dikelola, dan digunakan oleh
pengguna nyata. Katalog besar menjadi masalah kepercayaan dan keamanan ketika volume dipasangkan
dengan listing yang tipis, duplikatif, menyesatkan, tidak dikelola, atau dipromosikan secara
artifisial.

## Hak konten

Jika Anda yakin konten di ClawHub melanggar hak cipta atau hak Anda lainnya, gunakan
[Permintaan Hak Konten](/id/clawhub/content-rights). Jangan gunakan laporan lokapasar normal
untuk klaim hak cipta atau hak kecuali listing tersebut juga tidak aman, berbahaya, atau
menyesatkan.

## Peninjauan dan penegakan

ClawHub dapat menggunakan pemeriksaan otomatis, sinyal penyalahgunaan statistik, laporan pengguna,
dan peninjauan staf untuk mengidentifikasi konten yang tidak aman atau perilaku penerbitan yang
menyalahgunakan. Sebuah sinyal tidak membuktikan penyalahgunaan dengan sendirinya; sinyal membantu
ClawHub menentukan apa yang perlu ditinjau.

Kami dapat:

- menyembunyikan, menahan, menghapus, menghapus sementara, atau, jika didukung untuk jenis sumber daya,
  menghapus permanen listing yang melanggar
- memblokir unduhan atau instalasi untuk rilis yang tidak aman
- mencabut token API
- menghapus sementara konten terkait
- membatasi akses penerbitan
- memblokir pelanggar berulang atau berat

Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas. Lihat
[Moderasi dan Keamanan Akun](/clawhub/moderation) untuk laporan, penahanan moderasi,
listing tersembunyi, pemblokiran, dan reputasi akun.
