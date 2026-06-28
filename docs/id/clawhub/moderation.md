---
read_when:
    - Melaporkan skill, plugin, atau paket
    - Memulihkan dari listing yang ditahan, disembunyikan, atau diblokir
    - Memahami moderasi ClawHub, pemblokiran, atau status akun
sidebarTitle: Moderation and Account Safety
summary: Cara kerja laporan ClawHub, penahanan moderasi, listing tersembunyi, pemblokiran, dan reputasi akun.
title: Moderasi dan Keamanan Akun
x-i18n:
    generated_at: "2026-06-28T10:01:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasi dan Keamanan Akun

ClawHub terbuka untuk penerbitan, tetapi permukaan penemuan dan instalasi publik tetap
memerlukan pagar pengaman. Laporan, penahanan moderasi, listing tersembunyi, dan tindakan akun
membantu melindungi pengguna saat suatu rilis atau akun tampak tidak aman, menyesatkan, atau
melanggar kebijakan.

Halaman ini mencakup moderasi dan status akun. Untuk label audit seperti
`Pass`, `Review`, `Warn`, `Malicious`, dan tingkat risiko, lihat
[Audit Keamanan](/id/clawhub/security-audits).

Lihat juga [Keamanan](/id/clawhub/security) dan
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage). Untuk masalah hak cipta atau hak
konten lainnya, gunakan [Permintaan Hak Konten](/id/clawhub/content-rights).

## Laporan

Pengguna yang sudah masuk dapat melaporkan skill, plugin, dan paket.

Gunakan laporan ClawHub hanya untuk konten marketplace yang tidak aman, seperti:

- listing berbahaya
- metadata yang menyesatkan
- kredensial atau persyaratan izin yang tidak dinyatakan
- instruksi instalasi yang mencurigakan
- peniruan identitas
- pendaftaran beriktikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage)

Gunakan tombol **Laporkan skill** di halaman skill, atau perintah/API pelaporan paket
untuk paket.

Jangan gunakan laporan ClawHub untuk kerentanan dalam kode sumber milik skill atau
plugin pihak ketiga. Laporkan langsung kepada penerbit atau repositori sumber yang
ditautkan dari listing. ClawHub tidak memelihara atau menambal kode skill atau plugin
pihak ketiga.

GitHub Security Advisories untuk `openclaw/clawhub` ditujukan untuk kerentanan di
ClawHub itu sendiri. Contohnya mencakup bug di situs web, API, CLI, registry, autentikasi,
pemindaian, moderasi, atau batas kepercayaan unduhan/instalasi. Jangan gunakan advisory
ClawHub untuk kerentanan dalam skill atau plugin pihak ketiga.

Laporan yang baik bersifat spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan juga
dapat mengakibatkan tindakan akun.

## Klaim org dan namespace

Sengketa kepemilikan org, merek, cakupan paket, handle pemilik, atau namespace harus
menggunakan proses [Klaim Org dan Namespace](/id/clawhub/namespace-claims), bukan alur
laporan dalam produk atau formulir banding akun.

Gunakan proses tersebut saat Anda memerlukan staf ClawHub untuk meninjau bukti non-sensitif bahwa suatu
namespace harus dicadangkan, ditransfer, diganti nama, disembunyikan, dikarantina, diberi alias,
atau ditinjau dengan cara lain. Jangan sertakan rahasia, dokumen privat, berkas hukum privat,
dokumen identitas pribadi, token API, atau token tantangan DNS dalam issue publik.

## Penahanan moderasi

Beberapa temuan berat atau masalah kebijakan dapat menempatkan penerbit atau listing dalam
penahanan moderasi. Saat ini terjadi, konten yang terdampak dapat disembunyikan dari
penemuan publik atau penerbitan berikutnya dapat mulai dalam keadaan tersembunyi sampai masalahnya ditinjau.

Penahanan moderasi dimaksudkan untuk melindungi pengguna sementara ClawHub menyelesaikan kasus
berisiko tinggi. Penahanan juga dapat dicabut saat positif palsu dikonfirmasi.

## Listing tersembunyi atau diblokir

Listing dapat ditahan, disembunyikan, dikarantina, dicabut, atau tidak tersedia dengan cara lain pada
permukaan instalasi publik.

Jika Anda melihat salah satu status ini, jangan instal rilis tersebut kecuali pemilik
menyelesaikan masalahnya atau moderasi memulihkannya.

Pemilik mungkin masih melihat diagnostik untuk listing mereka sendiri yang ditahan atau disembunyikan. Diagnostik ini
membantu menjelaskan apa yang terjadi dan apa yang perlu berubah sebelum
listing dapat kembali ke permukaan publik.

## Banned dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses penerbitan. Penyalahgunaan berat dapat
mengakibatkan akun dibanned, pencabutan token, konten tersembunyi, atau listing dihapus.
Sinyal tekanan penyalahgunaan penerbit diperiksa setiap hari. Sinyal yang mencapai
ambang potensi banned ClawHub dapat memicu peringatan otomatis. Jika pemindaian berikutnya
yang memenuhi syarat setelah tenggat peringatan masih menempatkan penerbit pada
ambang potensi banned, ClawHub dapat menerapkan tindakan akun secara otomatis.
Sinyal tinjauan dengan keyakinan lebih rendah dan berbatas waktu tetap berada di luar
penegakan otomatis.

Akun yang dihapus, dibanned, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika autentikasi CLI
mulai gagal setelah tindakan akun, masuk ke UI web untuk meninjau status akun.
Jika proses masuk atau akses CLI normal diblokir oleh banned atau akun yang dinonaktifkan,
gunakan [formulir banding ClawHub](https://appeals.openclaw.ai/) untuk tinjauan pemulihan.

Jika email yang dipicu pemindai menyebut versi skill atau plugin sebagai berbahaya,
unduh hasil pemindaian yang disimpan untuk versi kiriman yang diblokir:
`clawhub scan download <slug> --version <version>`. Untuk plugin, tambahkan
`--kind plugin`. Tinjau output pemindaian, perbaiki listing, naikkan nomor versi,
dan unggah versi yang sudah diperbaiki.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga agar nama, ringkasan, tag, dan changelog tetap akurat
- nyatakan variabel lingkungan dan izin yang diperlukan
- hindari perintah instalasi yang disamarkan
- tautkan ke sumber bila memungkinkan
- gunakan dry run sebelum menerbitkan plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku rilis
