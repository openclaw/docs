---
read_when:
    - Melaporkan skill, plugin, atau paket
    - Memulihkan listing yang ditahan, disembunyikan, atau diblokir
    - Memahami moderasi ClawHub, pemblokiran, atau status akun
sidebarTitle: Moderation and Account Safety
summary: Cara kerja laporan ClawHub, penangguhan moderasi, listing tersembunyi, pemblokiran, dan status akun.
title: Moderasi dan Keamanan Akun
x-i18n:
    generated_at: "2026-07-16T17:51:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasi dan Keamanan Akun

ClawHub terbuka untuk publikasi, tetapi sarana penemuan publik dan penginstalan tetap
memerlukan perlindungan. Laporan, penangguhan moderasi, daftar tersembunyi, dan tindakan akun
membantu melindungi pengguna ketika suatu rilis atau akun tampak tidak aman, menyesatkan, atau
melanggar kebijakan.

Halaman ini membahas moderasi dan status akun. Untuk label audit seperti
`Pass`, `Review`, `Warn`, `Malicious`, dan tingkat risiko, lihat
[Audit Keamanan](/clawhub/security-audits).

Lihat juga [Keamanan](/clawhub/security) dan
[Penggunaan yang dapat diterima](/clawhub/acceptable-usage). Untuk masalah hak cipta atau hak
konten lainnya, gunakan [Permintaan Hak Konten](/clawhub/content-rights).

## Laporan

Pengguna yang telah masuk dapat melaporkan skill, plugin, dan paket.

Gunakan laporan ClawHub hanya untuk konten marketplace yang tidak aman, seperti:

- daftar berbahaya
- metadata menyesatkan
- kredensial atau persyaratan izin yang tidak dinyatakan
- petunjuk penginstalan yang mencurigakan
- peniruan identitas
- pendaftaran dengan iktikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/clawhub/acceptable-usage)

Gunakan tombol **Report skill** pada halaman skill, atau perintah/API pelaporan
paket untuk paket.

Jangan gunakan laporan ClawHub untuk kerentanan dalam kode sumber milik skill atau
plugin pihak ketiga. Laporkan hal tersebut langsung kepada penerbit atau repositori
sumber yang ditautkan dari daftar. ClawHub tidak memelihara atau menambal
kode skill atau plugin pihak ketiga.

GitHub Security Advisories untuk `openclaw/clawhub` ditujukan bagi kerentanan dalam
ClawHub itu sendiri. Contohnya mencakup bug pada situs web, API, CLI, registri, autentikasi,
pemindaian, moderasi, atau batas kepercayaan pengunduhan/penginstalan. Jangan gunakan advisory
ClawHub untuk kerentanan dalam skill atau plugin pihak ketiga.

Laporan yang baik bersifat spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan dapat
menyebabkan tindakan terhadap akun.

## Klaim organisasi dan namespace

Sengketa kepemilikan organisasi, merek, cakupan paket, nama pengguna pemilik, atau namespace harus
menggunakan proses [Klaim Organisasi dan Namespace](/clawhub/namespace-claims), bukan
alur pelaporan dalam produk atau formulir banding akun.

Gunakan proses tersebut jika Anda memerlukan staf ClawHub untuk meninjau bukti non-sensitif bahwa suatu
namespace seharusnya dicadangkan, dialihkan, diganti namanya, disembunyikan, dikarantina, diberi alias,
atau ditinjau dengan cara lain. Jangan sertakan rahasia, dokumen pribadi, berkas hukum
pribadi, dokumen identitas pribadi, token API, atau token tantangan DNS dalam
isu publik.

## Penangguhan moderasi

Beberapa temuan serius atau masalah kebijakan dapat menyebabkan penerbit atau daftar dikenai
penangguhan moderasi. Jika hal ini terjadi, konten yang terdampak dapat disembunyikan dari
penemuan publik atau publikasi berikutnya dapat dimulai dalam keadaan tersembunyi hingga masalah tersebut ditinjau.

Penangguhan moderasi dimaksudkan untuk melindungi pengguna selama ClawHub menangani kasus
berisiko tinggi. Penangguhan juga dapat dicabut ketika positif palsu telah dikonfirmasi.

## Daftar tersembunyi atau diblokir

Suatu daftar dapat ditangguhkan, disembunyikan, dikarantina, dicabut, atau menjadi tidak tersedia dengan cara lain pada
sarana penginstalan publik.

Jika Anda melihat salah satu status tersebut, jangan instal rilis itu kecuali pemilik
menyelesaikan masalahnya atau moderasi memulihkannya.

Pemilik mungkin masih dapat melihat diagnostik untuk daftar milik mereka yang ditangguhkan atau disembunyikan. Diagnostik ini
membantu menjelaskan apa yang terjadi dan apa yang perlu diubah sebelum
daftar dapat kembali ke sarana publik.

## Pemblokiran dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses publikasi. Penyalahgunaan berat dapat
mengakibatkan pemblokiran akun, pencabutan token, konten tersembunyi, atau penghapusan daftar.
Sinyal tekanan penyalahgunaan penerbit diperiksa setiap hari. Sinyal yang mencapai
ambang potensi pemblokiran ClawHub dapat memicu peringatan otomatis. Jika pemindaian
yang memenuhi syarat berikutnya setelah tenggat peringatan masih menempatkan penerbit pada
ambang potensi pemblokiran, ClawHub dapat menerapkan tindakan akun secara otomatis.
Sinyal peninjauan temporal dengan tingkat keyakinan lebih rendah dan cakupan terbatas tidak dikenai
penegakan otomatis.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika autentikasi CLI
mulai gagal setelah tindakan akun, masuklah ke UI web untuk meninjau status
akun. Jika proses masuk atau akses CLI normal diblokir akibat pemblokiran atau akun yang dinonaktifkan,
gunakan [formulir banding ClawHub](https://appeals.openclaw.ai/) untuk peninjauan pemulihan.

Jika email yang dipicu pemindai menyebut suatu versi skill atau plugin sebagai berbahaya,
unduh hasil pemindaian tersimpan untuk versi kiriman yang diblokir:
`clawhub scan download <slug> --version <version>`. Untuk plugin, tambahkan
`--kind plugin`. Tinjau hasil pemindaian, perbaiki daftar, naikkan nomor
versi, lalu unggah versi yang telah diperbaiki.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- pastikan nama, ringkasan, tag, dan catatan perubahan tetap akurat
- nyatakan variabel lingkungan dan izin yang diperlukan
- hindari perintah penginstalan yang disamarkan
- tautkan ke sumber jika memungkinkan
- gunakan uji coba kering sebelum memublikasikan plugin
- berikan respons dengan jelas jika pengguna atau moderator menanyakan perilaku rilis
