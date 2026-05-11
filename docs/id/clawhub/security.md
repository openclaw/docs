---
read_when:
    - Memahami hasil pemindaian dan moderasi ClawHub
    - Melaporkan keahlian atau paket
    - Memulihkan cantuman yang ditahan, disembunyikan, atau diblokir
summary: Perilaku ClawHub untuk kepercayaan, pemindaian, pelaporan, banding, dan moderasi.
x-i18n:
    generated_at: "2026-05-11T20:24:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf88073ce581f25c93b2fe0067ebd2bb1a481c8c927d65a06943a38d33e3425e
    source_path: clawhub/security.md
    workflow: 16
---

# Keamanan + Moderasi

ClawHub terbuka untuk publikasi, tetapi listing publik tetap melewati kontrol kepercayaan,
pemindaian, pelaporan, dan moderasi. Tujuannya praktis: membantu pengguna
memeriksa apa yang mereka instal, memberi penerbit jalur pemulihan untuk positif palsu,
dan menjaga paket yang menyalahgunakan layanan agar tidak muncul dalam penemuan publik.

Lihat juga [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage).

## Apa yang dapat diperiksa pengguna

Sebelum menginstal skill atau plugin, periksa listing ClawHub-nya untuk:

- pemilik dan atribusi sumber
- versi terbaru dan changelog
- variabel lingkungan atau izin yang diperlukan
- metadata kompatibilitas untuk plugin
- status pemindaian atau moderasi
- laporan, komentar, bintang, unduhan, dan sinyal instalasi jika ditampilkan

Instal hanya konten yang Anda pahami dan percayai.

## Status pemindaian

ClawHub dapat menampilkan hasil pemindaian atau moderasi pada halaman publik dan diagnostik
yang terlihat oleh pemilik.

Hasil umum meliputi:

- `clean`: tidak ditemukan masalah yang memblokir.
- `suspicious`: rilis memerlukan kehati-hatian atau peninjauan.
- `malicious`: rilis dianggap tidak aman.
- `pending`: pemeriksaan belum selesai.
- `held`, `quarantined`, `revoked`, atau `hidden`: rilis belum sepenuhnya
  tersedia pada permukaan instalasi publik.

Redaksi persis dapat berbeda menurut permukaan, tetapi makna praktisnya sama: jika sebuah
rilis ditahan atau diblokir, pengguna sebaiknya tidak menginstalnya sampai pemilik menyelesaikan
masalahnya atau moderasi memulihkannya.

## Skills

Pemindaian skill memeriksa bundel skill yang diterbitkan, metadata, persyaratan yang dinyatakan,
dan instruksi yang mencurigakan.

ClawHub memberi perhatian khusus pada ketidaksesuaian antara apa yang dinyatakan sebuah skill dan
apa yang tampaknya dilakukan. Misalnya, skill yang merujuk pada kunci API yang diperlukan
sebaiknya menyatakan persyaratan itu dalam `SKILL.md` agar pengguna dapat melihatnya sebelum
menginstal.

Temuan pemindaian berbasis artefak. Perilaku provider yang diharapkan, seperti kredensial API
yang dinyatakan, callback OAuth localhost, pembersihan uninstall terbatas cakupan, pengodean Basic Auth,
atau unggahan file yang dipilih pengguna ke provider yang dinyatakan, diperlakukan berbeda
dari penerusan kredensial tersembunyi, akses luas ke file pribadi,
tujuan jaringan yang tidak terkait, atau penyalahgunaan browser secara diam-diam.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Rilis Plugin mencakup metadata paket, atribusi sumber, bidang kompatibilitas,
dan informasi integritas artefak.

OpenClaw memeriksa kompatibilitas sebelum menginstal plugin yang dihosting ClawHub. Catatan paket
juga dapat mengekspos metadata digest agar OpenClaw dapat memverifikasi artefak yang diunduh.
ClawScan menyertakan metadata env/config `openclaw.environment` paket yang dinyatakan
saat meninjau rilis plugin agar persyaratan runtime yang dinyatakan
dibandingkan dengan perilaku yang diamati.

## Laporan

Pengguna yang masuk dapat melaporkan skill, paket, dan komentar.

Laporan harus spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan juga dapat menyebabkan
tindakan akun.

Contoh laporan:

- metadata yang menyesatkan
- persyaratan kredensial atau izin yang tidak dinyatakan
- instruksi instalasi yang mencurigakan
- komentar penipuan atau peniruan identitas
- pendaftaran dengan niat buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage)

## Laporan niat buruk atau merek dagang

ClawHub menggunakan pipeline laporan dan moderasi staf yang sama untuk pendaftaran dengan niat buruk,
peniruan identitas, dan sengketa terkait merek dagang. Laporan ini memerlukan
konteks yang cukup agar staf dapat mengidentifikasi penggugat, listing yang disengketakan, dan
tindakan yang diminta.

Sertakan:

- URL skill atau paket ClawHub kanonis dan handle pemilik
- merek dagang, proyek, perusahaan, atau nama produk yang dipermasalahkan
- bukti publik tentang kepemilikan atau kewenangan penggugat
- alasan pemilik saat ini tidak berwenang untuk menerbitkan dengan nama tersebut
- tindakan yang diminta, seperti menyembunyikan sambil menunggu peninjauan, mentransfer kepemilikan, mengganti nama,
  atau menghapus

Jangan menaruh rahasia pribadi atau dokumen hukum sensitif dalam laporan publik. Buka
issue GitHub dengan bukti yang tidak sensitif dan minta maintainer menyediakan jalur serah terima
privat bila diperlukan.

## Banding dan pemindaian ulang

Pemilik dapat meminta pemindaian ulang ketika mereka yakin skill atau paket secara keliru
ditahan atau ditandai. Moderator platform dan admin dapat meminta pemindaian ulang untuk
skill atau paket apa pun saat menangani laporan atau permintaan dukungan:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Untuk konten yang dimoderasi, pemilik mungkin dapat mengajukan banding dari permukaan ClawHub
yang terlihat oleh pemilik. Banding sebaiknya menjelaskan apa yang berubah atau mengapa
penandaan tersebut tidak benar.

## Penahanan Moderasi

Ketika pemindai statis menandai skill yang diunggah sebagai berbahaya, penerbit
secara otomatis ditempatkan dalam penahanan moderasi (`requiresModerationAt` ditetapkan pada
pengguna). Ini menyembunyikan semua skill penerbit, menyebabkan publikasi mendatang
dimulai dalam keadaan tersembunyi, dan membuat entri log audit `user.moderation.auto`.

Temuan statis yang mencurigakan disimpan sebagai bukti file/baris untuk moderator,
tetapi temuan tersebut tidak menyembunyikan konten atau menentukan vonis pemindaian publik sendiri.
Unggahan baru tetap dalam status peninjauan/tertunda hingga peninjauan LLM selesai. Pemindaian statis
hanya langsung memblokir untuk tanda tangan berbahaya. Hit engine VirusTotal
tetap terlihat sebagai bukti keamanan, tetapi vonis VirusTotal Code Insight/Palm
bersifat penasihat dan tidak menyembunyikan skill dengan sendirinya. Peninjauan LLM ClawScan
menyimpan catatan yang selaras dengan tujuan sebagai panduan. Temuan peninjauan tingkat sedang tetap terlihat pada
artefak, sementara filter mencurigakan dicadangkan untuk kekhawatiran LLM berdampak tinggi,
temuan berbahaya, atau deteksi engine AV yang terkoroborasi.

Admin dapat mencabut penahanan positif palsu:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Ini menghapus `requiresModerationAt` dan `requiresModerationReason`, memulihkan
skill yang disembunyikan oleh penahanan tingkat pengguna, dan menulis entri log audit `user.moderation.lift`.
Skill yang disembunyikan karena alasan lain, atau yang pemindaian statisnya sendiri tetap
berbahaya, tetap tersembunyi.

## Pemblokiran dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses penerbitan. Penyalahgunaan berat
dapat mengakibatkan pemblokiran akun, pencabutan token, konten tersembunyi, atau listing
yang dihapus.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika autentikasi CLI
mulai gagal setelah tindakan akun, masuk ke UI web untuk meninjau status akun
atau hubungi maintainer melalui kanal dukungan proyek yang diharapkan.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga nama, ringkasan, tag, dan changelog tetap akurat
- nyatakan variabel lingkungan dan izin yang diperlukan
- hindari perintah instalasi yang dikaburkan
- tautkan ke sumber bila memungkinkan
- gunakan dry run sebelum menerbitkan plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku paket
