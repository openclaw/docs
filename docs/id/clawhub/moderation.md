---
read_when:
    - Melaporkan skill, plugin, atau paket
    - Memulihkan dari listing yang ditahan, disembunyikan, atau diblokir
    - Memahami moderasi, pemblokiran, atau status akun ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cara kerja laporan ClawHub, penahanan moderasi, listing tersembunyi, pemblokiran, dan reputasi akun.
title: Moderasi dan Keamanan Akun
x-i18n:
    generated_at: "2026-07-05T08:35:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasi dan Keamanan Akun

ClawHub terbuka untuk publikasi, tetapi antarmuka penemuan dan instalasi publik tetap
memerlukan pagar pengaman. Laporan, penahanan moderasi, cantuman tersembunyi, dan tindakan akun
membantu melindungi pengguna ketika sebuah rilis atau akun tampak tidak aman, menyesatkan, atau di luar
kebijakan.

Halaman ini membahas moderasi dan status akun. Untuk label audit seperti
`Pass`, `Review`, `Warn`, `Malicious`, dan tingkat risiko, lihat
[Audit Keamanan](/clawhub/security-audits).

Lihat juga [Keamanan](/id/clawhub/security) dan
[Penggunaan yang dapat diterima](/clawhub/acceptable-usage). Untuk masalah hak cipta atau hak konten
lainnya, gunakan [Permintaan Hak Konten](/clawhub/content-rights).

## Laporan

Pengguna yang sudah masuk dapat melaporkan Skills, Plugin, dan paket.

Gunakan laporan ClawHub hanya untuk konten marketplace yang tidak aman, seperti:

- cantuman berbahaya
- metadata yang menyesatkan
- kredensial atau persyaratan izin yang tidak dideklarasikan
- instruksi instalasi yang mencurigakan
- peniruan identitas
- pendaftaran beriktikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/clawhub/acceptable-usage)

Gunakan tombol **Laporkan Skill** di halaman Skill, atau perintah/API pelaporan paket
untuk paket.

Jangan gunakan laporan ClawHub untuk kerentanan dalam kode sumber milik Skill atau
Plugin pihak ketiga. Laporkan langsung ke penerbit atau repositori sumber
yang ditautkan dari cantuman. ClawHub tidak memelihara atau menambal
kode Skill atau Plugin pihak ketiga.

GitHub Security Advisories untuk `openclaw/clawhub` ditujukan untuk kerentanan di
ClawHub itu sendiri. Contohnya mencakup bug di situs web, API, CLI, registry, autentikasi,
pemindaian, moderasi, atau batas kepercayaan unduhan/instalasi. Jangan gunakan advisory ClawHub
untuk kerentanan dalam Skills atau Plugin pihak ketiga.

Laporan yang baik bersifat spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan juga dapat berujung pada
tindakan akun.

## Klaim organisasi dan namespace

Sengketa kepemilikan organisasi, merek, cakupan paket, handle pemilik, atau namespace sebaiknya
menggunakan proses [Klaim Organisasi dan Namespace](/clawhub/namespace-claims), bukan alur
laporan dalam produk atau formulir banding akun.

Gunakan proses tersebut ketika Anda perlu staf ClawHub meninjau bukti non-sensitif bahwa sebuah
namespace harus dicadangkan, ditransfer, diganti nama, disembunyikan, dikarantina, diberi alias,
atau ditinjau dengan cara lain. Jangan sertakan rahasia, dokumen pribadi, berkas hukum pribadi,
dokumen identitas pribadi, token API, atau token tantangan DNS dalam
issue publik.

## Penahanan moderasi

Beberapa temuan berat atau masalah kebijakan dapat menempatkan penerbit atau cantuman dalam
penahanan moderasi. Ketika ini terjadi, konten yang terdampak dapat disembunyikan dari penemuan publik
atau publikasi berikutnya dapat mulai dalam keadaan tersembunyi hingga masalah ditinjau.

Penahanan moderasi dimaksudkan untuk melindungi pengguna sementara ClawHub menyelesaikan kasus berisiko tinggi.
Penahanan juga dapat dicabut ketika positif palsu dikonfirmasi.

## Cantuman tersembunyi atau diblokir

Sebuah cantuman dapat ditahan, disembunyikan, dikarantina, dicabut, atau tidak tersedia dengan cara lain di
antarmuka instalasi publik.

Jika Anda melihat salah satu status ini, jangan instal rilis tersebut kecuali pemilik
menyelesaikan masalah atau moderasi memulihkannya.

Pemilik masih dapat melihat diagnostik untuk cantuman miliknya sendiri yang ditahan atau disembunyikan. Diagnostik ini
membantu menjelaskan apa yang terjadi dan apa yang perlu diubah sebelum
cantuman dapat kembali ke antarmuka publik.

## Pemblokiran dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses publikasi. Penyalahgunaan berat dapat
mengakibatkan pemblokiran akun, pencabutan token, konten tersembunyi, atau cantuman yang dihapus.
Sinyal tekanan penyalahgunaan penerbit diperiksa setiap hari. Sinyal yang mencapai
ambang potensi pemblokiran ClawHub dapat memicu peringatan otomatis. Jika pemindaian
memenuhi syarat berikutnya setelah batas waktu peringatan masih menempatkan penerbit dalam
ambang potensi pemblokiran, ClawHub dapat menerapkan tindakan akun secara otomatis.
Sinyal peninjauan temporal dengan keyakinan lebih rendah dan terbatas tetap dikecualikan dari penegakan otomatis.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika autentikasi CLI
mulai gagal setelah tindakan akun, masuk ke UI web untuk meninjau status akun.
Jika masuk atau akses CLI normal diblokir oleh pemblokiran atau akun yang dinonaktifkan,
gunakan [formulir banding ClawHub](https://appeals.openclaw.ai/) untuk peninjauan pemulihan.

Jika email yang dipicu pemindai menamai versi Skill atau Plugin sebagai berbahaya,
unduh hasil pemindaian yang tersimpan untuk versi terkirim yang diblokir:
`clawhub scan download <slug> --version <version>`. Untuk Plugin, tambahkan
`--kind plugin`. Tinjau keluaran pemindaian, perbaiki cantuman, naikkan nomor versi,
dan unggah versi yang sudah diperbaiki.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga agar nama, ringkasan, tag, dan changelog tetap akurat
- deklarasikan variabel lingkungan dan izin yang diperlukan
- hindari perintah instalasi yang diobfusikasi
- tautkan ke sumber jika memungkinkan
- gunakan dry run sebelum memublikasikan Plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku rilis
