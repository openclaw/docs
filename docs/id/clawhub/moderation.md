---
read_when:
    - Melaporkan skill, plugin, atau paket
    - Memulihkan dari listing yang ditahan, disembunyikan, atau diblokir
    - Memahami moderasi, pemblokiran, atau status akun ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cara kerja laporan ClawHub, penahanan moderasi, listing tersembunyi, pemblokiran, dan status akun.
title: Moderasi dan Keamanan Akun
x-i18n:
    generated_at: "2026-07-04T18:20:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasi dan Keamanan Akun

ClawHub terbuka untuk publikasi, tetapi permukaan penemuan publik dan pemasangan tetap
memerlukan pagar pengaman. Laporan, penahanan moderasi, listing tersembunyi, dan tindakan akun
membantu melindungi pengguna ketika sebuah rilis atau akun tampak tidak aman, menyesatkan, atau di luar
kebijakan.

Halaman ini mencakup moderasi dan status akun. Untuk label audit seperti
`Pass`, `Review`, `Warn`, `Malicious`, dan tingkat risiko, lihat
[Audit Keamanan](/clawhub/security-audits).

Lihat juga [Keamanan](/clawhub/security) dan
[Penggunaan yang dapat diterima](/clawhub/acceptable-usage). Untuk masalah hak cipta atau hak konten
lainnya, gunakan [Permintaan Hak Konten](/clawhub/content-rights).

## Laporan

Pengguna yang sudah masuk dapat melaporkan skill, plugin, dan paket.

Gunakan laporan ClawHub hanya untuk konten marketplace yang tidak aman, seperti:

- listing berbahaya
- metadata yang menyesatkan
- kredensial atau persyaratan izin yang tidak dideklarasikan
- instruksi pemasangan yang mencurigakan
- peniruan identitas
- pendaftaran dengan itikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/clawhub/acceptable-usage)

Gunakan tombol **Laporkan skill** di halaman skill, atau perintah/API pelaporan paket untuk paket.

Jangan gunakan laporan ClawHub untuk kerentanan di kode sumber milik skill atau
plugin pihak ketiga. Laporkan hal tersebut langsung kepada penerbit atau repositori
sumber yang ditautkan dari listing. ClawHub tidak memelihara atau menambal
kode skill atau plugin pihak ketiga.

GitHub Security Advisories untuk `openclaw/clawhub` ditujukan untuk kerentanan di
ClawHub itu sendiri. Contohnya mencakup bug di situs web, API, CLI, registry, auth,
pemindaian, moderasi, atau batas kepercayaan unduhan/pemasangan. Jangan gunakan advisori ClawHub
untuk kerentanan di skill atau plugin pihak ketiga.

Laporan yang baik bersifat spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan itu sendiri dapat menyebabkan
tindakan akun.

## Klaim org dan namespace

Sengketa kepemilikan org, merek, cakupan paket, handle pemilik, atau namespace sebaiknya
menggunakan proses [Klaim Org dan Namespace](/clawhub/namespace-claims), bukan
alur laporan dalam produk atau formulir banding akun.

Gunakan proses tersebut ketika Anda membutuhkan staf ClawHub untuk meninjau bukti non-sensitif bahwa sebuah
namespace sebaiknya dicadangkan, dialihkan, diganti namanya, disembunyikan, dikarantina, diberi alias,
atau ditinjau dengan cara lain. Jangan sertakan rahasia, dokumen privat, berkas hukum privat,
dokumen identitas pribadi, token API, atau token tantangan DNS dalam issue publik.

## Penahanan moderasi

Beberapa temuan berat atau masalah kebijakan dapat menempatkan penerbit atau listing dalam
penahanan moderasi. Ketika hal ini terjadi, konten yang terdampak mungkin disembunyikan dari
penemuan publik atau publikasi berikutnya mungkin mulai tersembunyi sampai masalahnya ditinjau.

Penahanan moderasi dimaksudkan untuk melindungi pengguna sementara ClawHub menyelesaikan kasus berisiko tinggi.
Penahanan juga dapat dicabut ketika positif palsu dikonfirmasi.

## Listing tersembunyi atau diblokir

Sebuah listing dapat ditahan, disembunyikan, dikarantina, dicabut, atau dengan cara lain tidak tersedia di
permukaan pemasangan publik.

Jika Anda melihat salah satu status ini, jangan pasang rilis tersebut kecuali pemilik
menyelesaikan masalahnya atau moderasi memulihkannya.

Pemilik mungkin tetap melihat diagnostik untuk listing miliknya sendiri yang ditahan atau disembunyikan. Diagnostik ini
membantu menjelaskan apa yang terjadi dan apa yang perlu diubah sebelum listing
dapat kembali ke permukaan publik.

## Pemblokiran dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses publikasi. Penyalahgunaan berat dapat
mengakibatkan pemblokiran akun, pencabutan token, konten tersembunyi, atau listing yang dihapus.
Sinyal tekanan penyalahgunaan penerbit diperiksa setiap hari. Sinyal yang mencapai
ambang potensi pemblokiran ClawHub dapat memicu peringatan otomatis. Jika pemindaian
layak berikutnya setelah tenggat peringatan masih menempatkan penerbit dalam
ambang potensi pemblokiran, ClawHub dapat menerapkan tindakan akun secara otomatis.
Sinyal tinjauan temporal yang berkepercayaan lebih rendah dan berbatas tetap berada di luar penegakan
otomatis.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika auth CLI
mulai gagal setelah tindakan akun, masuk ke UI web untuk meninjau status akun.
Jika masuk atau akses CLI normal diblokir oleh pemblokiran atau akun yang dinonaktifkan,
gunakan [formulir banding ClawHub](https://appeals.openclaw.ai/) untuk tinjauan pemulihan.

Jika email yang dipicu pemindai menyebut versi skill atau plugin sebagai berbahaya,
unduh hasil pemindaian tersimpan untuk versi terkirim yang diblokir:
`clawhub scan download <slug> --version <version>`. Untuk plugin, tambahkan
`--kind plugin`. Tinjau output pemindaian, perbaiki listing, naikkan nomor versi,
dan unggah versi yang sudah diperbaiki.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga agar nama, ringkasan, tag, dan changelog tetap akurat
- deklarasikan variabel lingkungan dan izin yang diperlukan
- hindari perintah pemasangan yang diobfuskasi
- tautkan ke sumber jika memungkinkan
- gunakan dry run sebelum memublikasikan plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku rilis
