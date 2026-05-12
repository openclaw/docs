---
read_when:
    - Memahami hasil pemindaian dan moderasi ClawHub
    - Melaporkan keterampilan atau paket
    - Memulihkan dari cantuman yang ditahan, disembunyikan, atau diblokir
summary: Perilaku kepercayaan, pemindaian, pelaporan, dan moderasi ClawHub.
x-i18n:
    generated_at: "2026-05-12T15:43:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Keamanan + Moderasi

ClawHub terbuka untuk publikasi, tetapi listing publik tetap melewati kontrol
kepercayaan, pemindaian, pelaporan, dan moderasi. Tujuannya praktis: membantu pengguna
memeriksa apa yang mereka pasang, memberi penerbit jalur pemulihan untuk false positive,
dan mencegah paket yang abusif muncul di penemuan publik.

Lihat juga [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage).

## Yang dapat diperiksa pengguna

Sebelum memasang Skills atau Plugin, periksa listing ClawHub-nya untuk:

- atribusi pemilik dan sumber
- versi terbaru dan changelog
- variabel lingkungan atau izin yang diperlukan
- metadata kompatibilitas untuk Plugin
- status pemindaian atau moderasi
- laporan, komentar, bintang, unduhan, dan sinyal pemasangan jika ditampilkan

Pasang hanya konten yang Anda pahami dan percayai.

## Status pemindaian

ClawHub dapat menampilkan hasil pemindaian atau moderasi pada halaman publik dan
diagnostik yang terlihat oleh pemilik.

Hasil umum meliputi:

- `clean`: tidak ada masalah pemblokir yang ditemukan.
- `suspicious`: rilis membutuhkan kehati-hatian atau peninjauan.
- `malicious`: rilis dianggap tidak aman.
- `pending`: pemeriksaan belum selesai.
- `held`, `quarantined`, `revoked`, atau `hidden`: rilis tidak sepenuhnya
  tersedia di permukaan pemasangan publik.

Kata-kata yang tepat dapat berbeda menurut permukaan, tetapi makna praktisnya sama: jika
rilis ditahan atau diblokir, pengguna tidak boleh memasangnya sampai pemilik menyelesaikan
masalahnya atau moderasi memulihkannya.

## Skills

Pemindaian Skills melihat bundle Skills yang diterbitkan, metadata, persyaratan yang
dideklarasikan, dan instruksi yang mencurigakan.

ClawHub memberi perhatian khusus pada ketidaksesuaian antara apa yang dideklarasikan oleh
Skills dan apa yang tampaknya dilakukan. Misalnya, Skills yang merujuk ke kunci API yang
diperlukan harus mendeklarasikan persyaratan itu di `SKILL.md` agar pengguna dapat melihatnya
sebelum memasang.

Temuan pemindaian berbasis artefak. Perilaku penyedia yang diharapkan, seperti kredensial
API yang dideklarasikan, callback OAuth localhost, pembersihan pencopotan pemasangan yang
terbatas cakupannya, encoding Basic Auth, atau unggahan file pilihan pengguna ke penyedia
yang disebutkan, diperlakukan berbeda dari penerusan kredensial tersembunyi, akses file
pribadi yang luas, tujuan jaringan yang tidak terkait, atau penyalahgunaan browser secara
diam-diam.

Lihat [Format Skills](/id/clawhub/skill-format).

## Plugin

Rilis Plugin mencakup metadata paket, atribusi sumber, bidang kompatibilitas, dan informasi
integritas artefak.

OpenClaw memeriksa kompatibilitas sebelum memasang Plugin yang di-hosting ClawHub. Catatan
paket juga dapat mengekspos metadata digest agar OpenClaw dapat memverifikasi artefak yang
diunduh. ClawScan menyertakan metadata env/config `openclaw.environment` paket yang
dideklarasikan saat meninjau rilis Plugin sehingga persyaratan runtime yang dideklarasikan
dibandingkan dengan perilaku yang diamati.

## Laporan

Pengguna yang sudah masuk dapat melaporkan Skills, paket, dan komentar.

Laporan harus spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan juga dapat
menyebabkan tindakan akun.

Contoh laporan:

- metadata yang menyesatkan
- persyaratan kredensial atau izin yang tidak dideklarasikan
- instruksi pemasangan yang mencurigakan
- komentar penipuan atau peniruan identitas
- pendaftaran dengan iktikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage)

## Catatan ClawScan penerbit

Penerbit dapat memberikan catatan ClawScan opsional saat menerbitkan Skills atau
Plugin. Catatan ini memberi ClawScan konteks untuk perilaku yang mungkin tampak
tidak biasa, seperti akses jaringan, akses native host, atau kredensial khusus
penyedia.

## Penahanan Moderasi

Saat pemindai statis menandai Skills yang diunggah sebagai berbahaya, penerbit
secara otomatis ditempatkan dalam penahanan moderasi (`requiresModerationAt` ditetapkan pada
pengguna). Ini menyembunyikan semua Skills milik penerbit, membuat publikasi berikutnya
dimulai dalam keadaan tersembunyi, dan membuat entri log audit `user.moderation.auto`.

Temuan statis yang mencurigakan disimpan sebagai bukti file/baris untuk moderator,
tetapi temuan tersebut tidak menyembunyikan konten atau menentukan verdict pemindaian publik
sendiri. Unggahan baru tetap dalam status peninjauan/pending sampai tinjauan LLM selesai. Pemindaian
statis hanya langsung memblokir untuk signature berbahaya. Hit engine VirusTotal
tetap terlihat sebagai bukti keamanan, tetapi verdict VirusTotal Code Insight/Palm
bersifat advisori dan tidak menyembunyikan Skills dengan sendirinya. Tinjauan LLM ClawScan
mempertahankan catatan yang selaras dengan tujuan sebagai panduan. Temuan tinjauan sedang tetap terlihat pada
artefak, sementara filter mencurigakan dicadangkan untuk kekhawatiran LLM berdampak tinggi,
temuan berbahaya, atau deteksi AV-engine yang terkonfirmasi.

Admin dapat mencabut penahanan false-positive:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Ini menghapus `requiresModerationAt` dan `requiresModerationReason`, memulihkan
Skills yang disembunyikan oleh penahanan tingkat pengguna, dan menulis entri log audit
`user.moderation.lift`. Skills yang disembunyikan karena alasan lain, atau yang pemindaian
statisnya sendiri tetap berbahaya, tetap tersembunyi.

## Pemblokiran dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses publikasi. Penyalahgunaan berat
dapat menyebabkan pemblokiran akun, pencabutan token, konten tersembunyi, atau listing
yang dihapus.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika auth CLI
mulai gagal setelah tindakan akun, masuk ke UI web untuk meninjau status akun.
Jika proses masuk atau akses CLI normal diblokir, hubungi
security@openclaw.ai untuk peninjauan pemulihan.

## Panduan penerbit

Untuk mengurangi false positive dan meningkatkan kepercayaan pengguna:

- jaga agar nama, ringkasan, tag, dan changelog tetap akurat
- deklarasikan variabel lingkungan dan izin yang diperlukan
- tambahkan catatan ClawScan penerbit saat rilis memiliki perilaku yang tidak biasa tetapi disengaja
- hindari perintah pemasangan yang diobfuscate
- tautkan ke sumber jika memungkinkan
- gunakan dry run sebelum menerbitkan Plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku paket
