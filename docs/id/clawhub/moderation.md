---
read_when:
    - Melaporkan skill, plugin, atau paket
    - Memulihkan listing yang ditahan, disembunyikan, atau diblokir
    - Memahami moderasi, pemblokiran, atau status akun ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cara kerja laporan ClawHub, penangguhan moderasi, listing tersembunyi, pemblokiran, dan status akun.
title: Moderasi dan Keamanan Akun
x-i18n:
    generated_at: "2026-07-19T04:51:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasi dan Keamanan Akun

ClawHub terbuka untuk publikasi, tetapi fitur penemuan publik dan instalasi tetap
memerlukan pagar pengaman. Laporan, penangguhan moderasi, daftar tersembunyi, dan tindakan akun
membantu melindungi pengguna ketika suatu rilis atau akun tampak tidak aman, menyesatkan, atau
melanggar kebijakan.

Halaman ini membahas moderasi dan status akun. Untuk label audit seperti
`Pass`, `Review`, `Warn`, `Malicious`, dan tingkat risiko, lihat
[Audit Keamanan](/clawhub/security-audits).

Lihat juga [Keamanan](/clawhub/security) dan
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage). Untuk masalah hak cipta atau hak
konten lainnya, gunakan [Permintaan Hak Konten](/id/clawhub/content-rights).

## Laporan

Pengguna yang telah masuk dapat melaporkan Skills, plugin, dan paket.

Gunakan laporan ClawHub hanya untuk konten marketplace yang tidak aman, seperti:

- daftar berbahaya
- metadata yang menyesatkan
- persyaratan kredensial atau izin yang tidak dideklarasikan
- petunjuk instalasi yang mencurigakan
- peniruan identitas
- pendaftaran dengan iktikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage)

Gunakan tombol **Report skill** pada halaman skill, atau perintah/API pelaporan
paket untuk paket.

Jangan gunakan laporan ClawHub untuk kerentanan dalam kode sumber milik skill
atau plugin pihak ketiga. Laporkan kerentanan tersebut secara langsung kepada penerbit atau repositori
sumber yang ditautkan dari daftar. ClawHub tidak memelihara atau menambal
kode skill atau plugin pihak ketiga.

GitHub Security Advisories untuk `openclaw/clawhub` ditujukan bagi kerentanan di
ClawHub itu sendiri. Contohnya mencakup bug pada situs web, API, CLI, registri, autentikasi,
pemindaian, moderasi, atau batas kepercayaan pengunduhan/instalasi. Jangan gunakan advisori ClawHub
untuk kerentanan pada Skills atau plugin pihak ketiga.

Laporan yang baik bersifat spesifik dan dapat ditindaklanjuti. Penyalahgunaan fitur pelaporan juga dapat menyebabkan
tindakan terhadap akun.

## Klaim organisasi dan namespace

Sengketa kepemilikan organisasi, merek, cakupan paket, handle pemilik, atau namespace harus
menggunakan proses [Klaim Organisasi dan Namespace](/clawhub/namespace-claims), bukan
alur pelaporan dalam produk atau formulir banding akun.

Gunakan proses tersebut ketika staf ClawHub perlu meninjau bukti non-sensitif bahwa suatu
namespace harus dicadangkan, dialihkan, diganti namanya, disembunyikan, dikarantina, diberi alias,
atau ditinjau dengan cara lain. Jangan sertakan rahasia, dokumen pribadi, berkas hukum
pribadi, dokumen identitas pribadi, token API, atau token tantangan DNS dalam
isu publik.

## Penangguhan moderasi

Beberapa temuan serius atau masalah kebijakan dapat menyebabkan penerbit atau daftar dikenai
penangguhan moderasi. Jika ini terjadi, konten yang terdampak dapat disembunyikan dari
penemuan publik atau publikasi berikutnya dapat dimulai dalam keadaan tersembunyi hingga masalah tersebut ditinjau.

Penangguhan moderasi dimaksudkan untuk melindungi pengguna selama ClawHub menyelesaikan kasus
berisiko tinggi. Penangguhan juga dapat dicabut ketika positif palsu telah dikonfirmasi.

## Daftar tersembunyi atau diblokir

Suatu daftar dapat ditahan, disembunyikan, dikarantina, dicabut, atau tidak tersedia dengan cara lain pada
fitur instalasi publik.

Jika Anda melihat salah satu status ini, jangan instal rilis tersebut kecuali pemiliknya
menyelesaikan masalah atau moderasi memulihkannya.

Pemilik mungkin masih dapat melihat diagnostik untuk daftar mereka sendiri yang ditahan atau disembunyikan. Diagnostik ini
membantu menjelaskan apa yang terjadi dan apa yang perlu diubah sebelum
daftar tersebut dapat kembali ke fitur publik.

## Pemblokiran dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses publikasi. Penyalahgunaan berat dapat
mengakibatkan pemblokiran akun, pencabutan token, konten tersembunyi, atau daftar yang dihapus.
Sinyal tekanan penyalahgunaan penerbit diperiksa setiap hari. Sinyal yang mencapai
ambang potensi pemblokiran ClawHub dapat memicu peringatan otomatis. Jika pemindaian
yang memenuhi syarat berikutnya setelah tenggat peringatan masih menempatkan penerbit pada
ambang potensi pemblokiran, ClawHub dapat menerapkan tindakan terhadap akun secara otomatis.
Sinyal peninjauan temporal dengan tingkat keyakinan lebih rendah dan berbatas tetap tidak disertakan dalam penegakan
otomatis.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika autentikasi CLI
mulai gagal setelah tindakan terhadap akun, masuk ke UI web untuk meninjau status
akun. Jika proses masuk atau akses CLI normal diblokir karena pemblokiran atau akun yang dinonaktifkan,
gunakan [formulir banding ClawHub](https://appeals.openclaw.ai/) untuk peninjauan pemulihan.

Jika email yang dipicu pemindai menyebut versi skill atau plugin sebagai berbahaya,
unduh hasil pemindaian yang tersimpan untuk versi kiriman yang diblokir:
`clawhub scan download <slug> --version <version>`. Untuk plugin, tambahkan
`--kind plugin`. Tinjau keluaran pemindaian, perbaiki daftar, naikkan nomor
versi, lalu unggah versi yang telah diperbaiki.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- pastikan nama, ringkasan, tag, dan log perubahan tetap akurat
- deklarasikan variabel lingkungan dan izin yang diperlukan
- hindari perintah instalasi yang disamarkan
- tautkan ke sumber jika memungkinkan
- gunakan uji coba kering sebelum memublikasikan plugin
- berikan tanggapan yang jelas jika pengguna atau moderator menanyakan perilaku rilis
