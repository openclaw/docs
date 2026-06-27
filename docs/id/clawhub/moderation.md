---
read_when:
    - Melaporkan skill, plugin, atau paket
    - Memulihkan dari daftar yang ditahan, disembunyikan, atau diblokir
    - Memahami moderasi, pemblokiran, atau status akun ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cara kerja laporan ClawHub, penahanan moderasi, listing tersembunyi, pemblokiran, dan status akun.
title: Moderasi dan Keamanan Akun
x-i18n:
    generated_at: "2026-06-27T17:15:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasi dan Keamanan Akun

ClawHub terbuka untuk penerbitan, tetapi permukaan penemuan dan pemasangan publik tetap
memerlukan pagar pengaman. Laporan, penangguhan moderasi, listing tersembunyi, dan tindakan akun
membantu melindungi pengguna saat sebuah rilis atau akun tampak tidak aman, menyesatkan, atau di luar
kebijakan.

Halaman ini membahas moderasi dan reputasi akun. Untuk label audit seperti
`Pass`, `Review`, `Warn`, `Malicious`, dan tingkat risiko, lihat
[Audit Keamanan](/id/clawhub/security-audits).

Lihat juga [Keamanan](/id/clawhub/security) dan
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage). Untuk hak cipta atau masalah hak
konten lainnya, gunakan [Permintaan Hak Konten](/id/clawhub/content-rights).

## Laporan

Pengguna yang sudah masuk dapat melaporkan Skills, plugins, dan paket.

Gunakan laporan ClawHub hanya untuk konten marketplace yang tidak aman, seperti:

- listing berbahaya
- metadata yang menyesatkan
- kredensial atau persyaratan izin yang tidak dideklarasikan
- instruksi pemasangan yang mencurigakan
- peniruan
- pendaftaran dengan iktikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage)

Gunakan tombol **Laporkan skill** di halaman skill, atau perintah/API pelaporan paket
untuk paket.

Jangan gunakan laporan ClawHub untuk kerentanan dalam kode sumber milik skill atau
plugin pihak ketiga. Laporkan hal tersebut langsung kepada penerbit atau repositori sumber
yang ditautkan dari listing. ClawHub tidak memelihara atau menambal
kode skill atau plugin pihak ketiga.

GitHub Security Advisories untuk `openclaw/clawhub` ditujukan untuk kerentanan di
ClawHub itu sendiri. Contohnya termasuk bug di situs web, API, CLI, registry, auth,
pemindaian, moderasi, atau batas kepercayaan unduh/pasang. Jangan gunakan advisory ClawHub
untuk kerentanan dalam Skills atau plugins pihak ketiga.

Laporan yang baik bersifat spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan itu sendiri dapat menyebabkan
tindakan akun.

## Klaim organisasi dan namespace

Sengketa kepemilikan organisasi, merek, cakupan paket, handle pemilik, atau namespace harus
menggunakan proses [Klaim Organisasi dan Namespace](/id/clawhub/namespace-claims), bukan
alur laporan dalam produk atau formulir banding akun.

Gunakan proses tersebut saat Anda membutuhkan staf ClawHub untuk meninjau bukti non-sensitif bahwa sebuah
namespace harus dicadangkan, ditransfer, diganti nama, disembunyikan, dikarantina, diberi alias,
atau ditinjau dengan cara lain. Jangan sertakan rahasia, dokumen pribadi, berkas hukum pribadi,
dokumen identitas pribadi, token API, atau token tantangan DNS dalam
isu publik.

## Penangguhan moderasi

Beberapa temuan berat atau masalah kebijakan dapat menempatkan penerbit atau listing dalam
penangguhan moderasi. Saat ini terjadi, konten yang terdampak dapat disembunyikan dari
penemuan publik atau penerbitan berikutnya dapat mulai dalam keadaan tersembunyi sampai masalahnya ditinjau.

Penangguhan moderasi dimaksudkan untuk melindungi pengguna sementara ClawHub menyelesaikan kasus
berisiko tinggi. Penangguhan juga dapat dicabut ketika positif palsu dikonfirmasi.

## Listing tersembunyi atau diblokir

Sebuah listing dapat ditahan, disembunyikan, dikarantina, dicabut, atau tidak tersedia dengan cara lain di
permukaan pemasangan publik.

Jika Anda melihat salah satu keadaan ini, jangan pasang rilis tersebut kecuali pemilik
menyelesaikan masalahnya atau moderasi memulihkannya.

Pemilik masih dapat melihat diagnostik untuk listing milik mereka sendiri yang ditahan atau disembunyikan. Diagnostik ini
membantu menjelaskan apa yang terjadi dan apa yang perlu diubah sebelum
listing dapat kembali ke permukaan publik.

## Pemblokiran dan reputasi akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses penerbitan. Penyalahgunaan berat dapat
mengakibatkan pemblokiran akun, pencabutan token, konten tersembunyi, atau listing yang dihapus.
Sinyal tekanan penyalahgunaan penerbit diperiksa setiap hari. Sinyal yang mencapai
ambang potensi pemblokiran ClawHub dapat memicu peringatan otomatis. Jika pemindaian
berikutnya yang memenuhi syarat setelah tenggat peringatan masih menempatkan penerbit dalam
ambang potensi pemblokiran, ClawHub dapat menerapkan tindakan akun secara otomatis.
Sinyal tinjauan temporal yang berkeyakinan lebih rendah dan berbatas tetap di luar penegakan
otomatis.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika auth CLI
mulai gagal setelah tindakan akun, masuk ke UI web untuk meninjau status akun.
Jika masuk atau akses CLI normal diblokir oleh pemblokiran atau akun yang dinonaktifkan,
gunakan [formulir banding ClawHub](https://appeals.openclaw.ai/) untuk tinjauan pemulihan.

Jika email yang dipicu pemindai menyebut versi skill atau plugin sebagai berbahaya,
unduh hasil pemindaian tersimpan untuk versi yang dikirimkan dan diblokir:
`clawhub scan download <slug> --version <version>`. Untuk plugins, tambahkan
`--kind plugin`. Tinjau output pemindaian, perbaiki listing, naikkan nomor versi,
dan unggah versi yang sudah diperbaiki.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga nama, ringkasan, tag, dan changelog tetap akurat
- deklarasikan variabel lingkungan dan izin yang diperlukan
- hindari perintah pemasangan yang disamarkan
- tautkan ke sumber jika memungkinkan
- gunakan dry run sebelum menerbitkan plugins
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku rilis
