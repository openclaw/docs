---
read_when:
    - Melaporkan skill, plugin, atau paket
    - Memulihkan dari listing yang ditahan, disembunyikan, atau diblokir
    - Memahami moderasi ClawHub, pemblokiran, atau status akun
sidebarTitle: Moderation and Account Safety
summary: Cara kerja laporan ClawHub, penahanan moderasi, listing tersembunyi, pemblokiran, dan status akun.
title: Moderasi dan Keamanan Akun
x-i18n:
    generated_at: "2026-07-03T23:43:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasi dan Keamanan Akun

ClawHub terbuka untuk publikasi, tetapi permukaan penemuan publik dan instalasi
tetap memerlukan pengaman. Laporan, penahanan moderasi, listing tersembunyi, dan
tindakan akun membantu melindungi pengguna ketika rilis atau akun tampak tidak
aman, menyesatkan, atau melanggar kebijakan.

Halaman ini membahas moderasi dan reputasi akun. Untuk label audit seperti
`Pass`, `Review`, `Warn`, `Malicious`, dan tingkat risiko, lihat
[Audit Keamanan](/clawhub/security-audits).

Lihat juga [Keamanan](/clawhub/security) dan
[Penggunaan yang Dapat Diterima](/clawhub/acceptable-usage). Untuk masalah hak
cipta atau hak konten lainnya, gunakan [Permintaan Hak Konten](/clawhub/content-rights).

## Laporan

Pengguna yang sudah masuk dapat melaporkan Skills, Plugin, dan paket.

Gunakan laporan ClawHub hanya untuk konten marketplace yang tidak aman, seperti:

- listing berbahaya
- metadata yang menyesatkan
- kredensial atau persyaratan izin yang tidak dinyatakan
- instruksi instalasi yang mencurigakan
- peniruan identitas
- pendaftaran dengan iktikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang Dapat Diterima](/clawhub/acceptable-usage)

Gunakan tombol **Laporkan skill** di halaman skill, atau perintah/API pelaporan
paket untuk paket.

Jangan gunakan laporan ClawHub untuk kerentanan dalam kode sumber milik Skills
atau Plugin pihak ketiga. Laporkan langsung kepada penerbit atau repositori
sumber yang ditautkan dari listing. ClawHub tidak memelihara atau menambal kode
Skills atau Plugin pihak ketiga.

GitHub Security Advisories untuk `openclaw/clawhub` ditujukan untuk kerentanan
di ClawHub itu sendiri. Contohnya mencakup bug di situs web, API, CLI, registry,
autentikasi, pemindaian, moderasi, atau batas kepercayaan unduhan/instalasi.
Jangan gunakan advisory ClawHub untuk kerentanan di Skills atau Plugin pihak
ketiga.

Laporan yang baik bersifat spesifik dan dapat ditindaklanjuti. Penyalahgunaan
pelaporan dapat menyebabkan tindakan akun.

## Klaim organisasi dan namespace

Sengketa kepemilikan organisasi, merek, cakupan paket, handle pemilik, atau
namespace harus menggunakan proses [Klaim Organisasi dan Namespace](/clawhub/namespace-claims),
bukan alur laporan dalam produk atau formulir banding akun.

Gunakan proses tersebut ketika Anda membutuhkan staf ClawHub untuk meninjau
bukti non-sensitif bahwa sebuah namespace harus dicadangkan, dialihkan, diganti
namanya, disembunyikan, dikarantina, diberi alias, atau ditinjau dengan cara
lain. Jangan sertakan rahasia, dokumen pribadi, berkas hukum pribadi, dokumen
identitas pribadi, token API, atau token tantangan DNS dalam issue publik.

## Penahanan moderasi

Beberapa temuan parah atau masalah kebijakan dapat membuat penerbit atau listing
dikenai penahanan moderasi. Ketika ini terjadi, konten yang terdampak dapat
disembunyikan dari penemuan publik atau publikasi berikutnya dapat mulai dalam
keadaan tersembunyi sampai masalahnya ditinjau.

Penahanan moderasi dimaksudkan untuk melindungi pengguna sementara ClawHub
menyelesaikan kasus berisiko tinggi. Penahanan juga dapat dicabut ketika positif
palsu dikonfirmasi.

## Listing tersembunyi atau diblokir

Sebuah listing dapat ditahan, disembunyikan, dikarantina, dicabut, atau tidak
tersedia dengan cara lain pada permukaan instalasi publik.

Jika Anda melihat salah satu status ini, jangan instal rilis tersebut kecuali
pemilik menyelesaikan masalahnya atau moderasi memulihkannya.

Pemilik masih dapat melihat diagnostik untuk listing mereka sendiri yang ditahan
atau disembunyikan. Diagnostik ini membantu menjelaskan apa yang terjadi dan apa
yang perlu diubah sebelum listing dapat kembali ke permukaan publik.

## Pemblokiran dan reputasi akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses publikasi.
Penyalahgunaan berat dapat mengakibatkan pemblokiran akun, pencabutan token,
konten tersembunyi, atau listing yang dihapus. Sinyal tekanan penyalahgunaan
penerbit diperiksa setiap hari. Sinyal yang mencapai ambang potensi pemblokiran
ClawHub dapat memicu peringatan otomatis. Jika pemindaian memenuhi syarat
berikutnya setelah tenggat peringatan masih menempatkan penerbit dalam ambang
potensi pemblokiran, ClawHub dapat menerapkan tindakan akun secara otomatis.
Sinyal tinjauan temporal yang berkeyakinan lebih rendah dan terbatas tidak
disertakan dalam penegakan otomatis.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menggunakan token
API ClawHub. Jika autentikasi CLI mulai gagal setelah tindakan akun, masuk ke UI
web untuk meninjau status akun. Jika masuk atau akses CLI normal diblokir oleh
pemblokiran atau akun yang dinonaktifkan, gunakan [formulir banding ClawHub](https://appeals.openclaw.ai/)
untuk peninjauan pemulihan.

Jika email yang dipicu pemindai menyebutkan versi Skills atau Plugin sebagai
berbahaya, unduh hasil pemindaian yang tersimpan untuk versi kiriman yang
diblokir:
`clawhub scan download <slug> --version <version>`. Untuk Plugin, tambahkan
`--kind plugin`. Tinjau keluaran pemindaian, perbaiki listing, naikkan nomor
versi, dan unggah versi yang sudah diperbaiki.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga agar nama, ringkasan, tag, dan changelog tetap akurat
- nyatakan variabel lingkungan dan izin yang diperlukan
- hindari perintah instalasi yang disamarkan
- tautkan ke sumber jika memungkinkan
- gunakan dry run sebelum menerbitkan Plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku rilis
