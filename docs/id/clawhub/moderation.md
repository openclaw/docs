---
read_when:
    - Melaporkan skill, plugin, atau paket
    - Memulihkan dari daftar yang ditahan, disembunyikan, atau diblokir
    - Memahami moderasi ClawHub, pemblokiran, atau status akun
sidebarTitle: Moderation and Account Safety
summary: Cara kerja laporan ClawHub, penahanan moderasi, listing tersembunyi, pemblokiran, dan reputasi akun.
title: Moderasi dan Keamanan Akun
x-i18n:
    generated_at: "2026-06-28T05:07:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasi dan Keamanan Akun

ClawHub terbuka untuk publikasi, tetapi permukaan penemuan publik dan instalasi tetap
memerlukan pagar pembatas. Laporan, penahanan moderasi, cantuman tersembunyi, dan tindakan akun
membantu melindungi pengguna ketika sebuah rilis atau akun tampak tidak aman, menyesatkan, atau di luar
kebijakan.

Halaman ini membahas moderasi dan status akun. Untuk label audit seperti
`Pass`, `Review`, `Warn`, `Malicious`, dan tingkat risiko, lihat
[Audit Keamanan](/id/clawhub/security-audits).

Lihat juga [Keamanan](/id/clawhub/security) dan
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage). Untuk masalah hak cipta atau hak konten
lainnya, gunakan [Permintaan Hak Konten](/id/clawhub/content-rights).

## Laporan

Pengguna yang masuk dapat melaporkan Skills, Plugin, dan paket.

Gunakan laporan ClawHub hanya untuk konten marketplace yang tidak aman, seperti:

- cantuman berbahaya
- metadata menyesatkan
- kredensial atau persyaratan izin yang tidak dinyatakan
- instruksi instalasi yang mencurigakan
- peniruan identitas
- pendaftaran dengan itikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage)

Gunakan tombol **Laporkan skill** di halaman skill, atau perintah/API pelaporan
paket untuk paket.

Jangan gunakan laporan ClawHub untuk kerentanan dalam kode sumber milik skill atau
Plugin pihak ketiga. Laporkan langsung kepada penerbit atau repositori sumber
yang ditautkan dari cantuman. ClawHub tidak memelihara atau menambal
kode skill atau Plugin pihak ketiga.

GitHub Security Advisories untuk `openclaw/clawhub` ditujukan untuk kerentanan di
ClawHub itu sendiri. Contohnya mencakup bug di situs web, API, CLI, registri, auth,
pemindaian, moderasi, atau batas kepercayaan unduhan/instalasi. Jangan gunakan advisori ClawHub
untuk kerentanan dalam Skills atau Plugin pihak ketiga.

Laporan yang baik bersifat spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan juga dapat berujung pada
tindakan akun.

## Klaim org dan namespace

Sengketa kepemilikan org, merek, cakupan paket, handle pemilik, atau namespace sebaiknya
menggunakan proses [Klaim Org dan Namespace](/id/clawhub/namespace-claims), bukan
alur laporan dalam produk atau formulir banding akun.

Gunakan proses tersebut ketika Anda memerlukan staf ClawHub untuk meninjau bukti non-sensitif bahwa sebuah
namespace harus dicadangkan, ditransfer, diganti nama, disembunyikan, dikarantina, diberi alias,
atau ditinjau dengan cara lain. Jangan sertakan rahasia, dokumen pribadi, berkas hukum pribadi,
dokumen identitas pribadi, token API, atau token tantangan DNS dalam
isu publik.

## Penahanan moderasi

Beberapa temuan berat atau masalah kebijakan dapat menempatkan penerbit atau cantuman dalam
penahanan moderasi. Ketika ini terjadi, konten yang terdampak dapat disembunyikan dari
penemuan publik atau publikasi berikutnya dapat dimulai sebagai tersembunyi sampai masalahnya ditinjau.

Penahanan moderasi dimaksudkan untuk melindungi pengguna sementara ClawHub menyelesaikan kasus
berisiko tinggi. Penahanan juga dapat dicabut ketika positif palsu dikonfirmasi.

## Cantuman tersembunyi atau diblokir

Sebuah cantuman dapat ditahan, disembunyikan, dikarantina, dicabut, atau tidak tersedia dengan cara lain di
permukaan instalasi publik.

Jika Anda melihat salah satu status ini, jangan instal rilis tersebut kecuali pemilik
menyelesaikan masalahnya atau moderasi memulihkannya.

Pemilik mungkin masih melihat diagnostik untuk cantuman milik mereka sendiri yang ditahan atau disembunyikan. Diagnostik ini
membantu menjelaskan apa yang terjadi dan apa yang perlu diubah sebelum
cantuman dapat kembali ke permukaan publik.

## Pemblokiran dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses publikasi. Penyalahgunaan berat dapat
mengakibatkan pemblokiran akun, pencabutan token, konten tersembunyi, atau cantuman yang dihapus.
Sinyal tekanan penyalahgunaan penerbit diperiksa setiap hari. Sinyal yang mencapai
ambang potensi pemblokiran ClawHub dapat memicu peringatan otomatis. Jika pemindaian berikutnya yang
memenuhi syarat setelah tenggat peringatan masih menempatkan penerbit dalam
ambang potensi pemblokiran, ClawHub dapat menerapkan tindakan akun secara otomatis.
Sinyal tinjauan temporal yang berkeyakinan lebih rendah dan terbatas tidak masuk ke dalam penegakan
otomatis.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika auth CLI
mulai gagal setelah tindakan akun, masuk ke UI web untuk meninjau status akun.
Jika proses masuk atau akses CLI normal diblokir oleh pemblokiran atau akun yang dinonaktifkan,
gunakan [formulir banding ClawHub](https://appeals.openclaw.ai/) untuk tinjauan pemulihan.

Jika email yang dipicu pemindai menamai versi skill atau Plugin sebagai berbahaya,
unduh hasil pemindaian tersimpan untuk versi yang dikirimkan dan diblokir:
`clawhub scan download <slug> --version <version>`. Untuk Plugin, tambahkan
`--kind plugin`. Tinjau keluaran pemindaian, perbaiki cantuman, naikkan nomor versi,
dan unggah versi yang sudah diperbaiki.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga agar nama, ringkasan, tag, dan changelog tetap akurat
- nyatakan variabel lingkungan dan izin yang diperlukan
- hindari perintah instalasi yang disamarkan
- tautkan ke sumber bila memungkinkan
- gunakan dry run sebelum memublikasikan Plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku rilis
