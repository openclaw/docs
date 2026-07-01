---
read_when:
    - Melaporkan skill, Plugin, atau paket
    - Memulihkan dari listing yang ditahan, disembunyikan, atau diblokir
    - Memahami moderasi, pemblokiran, atau status akun ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cara kerja laporan ClawHub, penahanan moderasi, listing tersembunyi, pemblokiran, dan status akun.
title: Moderasi dan Keamanan Akun
x-i18n:
    generated_at: "2026-07-01T08:30:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasi dan Keamanan Akun

ClawHub terbuka untuk publikasi, tetapi permukaan penemuan dan pemasangan publik tetap
memerlukan pagar pengaman. Laporan, penahanan moderasi, daftar tersembunyi, dan tindakan akun
membantu melindungi pengguna ketika sebuah rilis atau akun tampak tidak aman, menyesatkan, atau di luar
kebijakan.

Halaman ini membahas moderasi dan status akun. Untuk label audit seperti
`Pass`, `Review`, `Warn`, `Malicious`, dan tingkat risiko, lihat
[Audit Keamanan](/clawhub/security-audits).

Lihat juga [Keamanan](/clawhub/security) dan
[Penggunaan yang Dapat Diterima](/clawhub/acceptable-usage). Untuk masalah hak cipta atau hak konten
lainnya, gunakan [Permintaan Hak Konten](/clawhub/content-rights).

## Laporan

Pengguna yang sudah masuk dapat melaporkan skills, plugin, dan paket.

Gunakan laporan ClawHub hanya untuk konten marketplace yang tidak aman, seperti:

- daftar berbahaya
- metadata yang menyesatkan
- kredensial atau persyaratan izin yang tidak dinyatakan
- instruksi pemasangan yang mencurigakan
- peniruan identitas
- pendaftaran dengan itikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang Dapat Diterima](/clawhub/acceptable-usage)

Gunakan tombol **Laporkan skill** pada halaman skill, atau perintah/API pelaporan paket
untuk paket.

Jangan gunakan laporan ClawHub untuk kerentanan dalam kode sumber milik skill atau
plugin pihak ketiga. Laporkan hal tersebut langsung kepada penerbit atau repositori sumber
yang ditautkan dari daftar. ClawHub tidak memelihara atau menambal
kode skill atau plugin pihak ketiga.

GitHub Security Advisories untuk `openclaw/clawhub` ditujukan untuk kerentanan di
ClawHub itu sendiri. Contohnya mencakup bug di situs web, API, CLI, registry, auth,
pemindaian, moderasi, atau batas kepercayaan unduhan/pemasangan. Jangan gunakan advisory ClawHub
untuk kerentanan dalam skills atau plugin pihak ketiga.

Laporan yang baik bersifat spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan dapat dengan sendirinya menyebabkan
tindakan akun.

## Klaim organisasi dan namespace

Sengketa kepemilikan org, merek, cakupan paket, handle pemilik, atau namespace sebaiknya
menggunakan proses [Klaim Organisasi dan Namespace](/clawhub/namespace-claims), bukan
alur laporan dalam produk atau formulir banding akun.

Gunakan proses tersebut ketika Anda memerlukan staf ClawHub untuk meninjau bukti non-sensitif bahwa sebuah
namespace sebaiknya dicadangkan, ditransfer, diganti namanya, disembunyikan, dikarantina, diberi alias,
atau ditinjau dengan cara lain. Jangan sertakan rahasia, dokumen privat, berkas hukum privat,
dokumen identitas pribadi, token API, atau token tantangan DNS dalam
isu publik.

## Penahanan moderasi

Beberapa temuan berat atau masalah kebijakan dapat membuat penerbit atau daftar berada dalam
penahanan moderasi. Ketika ini terjadi, konten yang terdampak dapat disembunyikan dari
penemuan publik atau publikasi di masa depan dapat mulai tersembunyi sampai masalah tersebut ditinjau.

Penahanan moderasi dimaksudkan untuk melindungi pengguna sementara ClawHub menyelesaikan kasus berisiko tinggi.
Penahanan juga dapat dicabut ketika positif palsu dikonfirmasi.

## Daftar tersembunyi atau diblokir

Sebuah daftar dapat ditahan, disembunyikan, dikarantina, dicabut, atau tidak tersedia dengan cara lain di
permukaan pemasangan publik.

Jika Anda melihat salah satu status ini, jangan pasang rilis tersebut kecuali pemilik
menyelesaikan masalahnya atau moderasi memulihkannya.

Pemilik mungkin masih melihat diagnostik untuk daftar miliknya sendiri yang ditahan atau disembunyikan. Diagnostik ini
membantu menjelaskan apa yang terjadi dan apa yang perlu berubah sebelum
daftar dapat kembali ke permukaan publik.

## Banned dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses publikasi. Penyalahgunaan berat dapat
mengakibatkan banned akun, pencabutan token, konten tersembunyi, atau daftar yang dihapus.
Sinyal tekanan penyalahgunaan penerbit diperiksa setiap hari. Sinyal yang mencapai
ambang kemungkinan banned ClawHub dapat memicu peringatan otomatis. Jika pemindaian
memenuhi syarat berikutnya setelah tenggat peringatan masih menempatkan penerbit dalam
ambang kemungkinan banned, ClawHub dapat menerapkan tindakan akun secara otomatis.
Sinyal tinjauan temporal dengan keyakinan lebih rendah dan terbatas tidak masuk ke dalam penegakan
otomatis.

Akun yang dihapus, banned, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika auth CLI
mulai gagal setelah tindakan akun, masuk ke UI web untuk meninjau status
akun. Jika proses masuk atau akses CLI normal diblokir oleh banned atau akun yang dinonaktifkan,
gunakan [formulir banding ClawHub](https://appeals.openclaw.ai/) untuk tinjauan pemulihan.

Jika email yang dipicu pemindai menyebut versi skill atau plugin sebagai berbahaya,
unduh hasil pemindaian tersimpan untuk versi terkirim yang diblokir:
`clawhub scan download <slug> --version <version>`. Untuk plugin, tambahkan
`--kind plugin`. Tinjau keluaran pemindaian, perbaiki daftar, naikkan nomor versi,
dan unggah versi yang sudah diperbaiki.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga agar nama, ringkasan, tag, dan changelog tetap akurat
- nyatakan variabel lingkungan dan izin yang diperlukan
- hindari perintah pemasangan yang disamarkan
- tautkan ke sumber bila memungkinkan
- gunakan dry run sebelum memublikasikan plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku rilis
