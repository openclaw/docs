---
read_when:
    - Memahami hasil pemindaian dan moderasi ClawHub
    - Melaporkan keterampilan atau paket
    - Memulihkan cantuman yang ditahan, disembunyikan, atau diblokir
summary: Perilaku kepercayaan, pemindaian, pelaporan, dan moderasi ClawHub.
x-i18n:
    generated_at: "2026-05-13T05:33:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Keamanan + Moderasi

ClawHub terbuka untuk penerbitan, tetapi listing publik tetap melewati kontrol kepercayaan,
pemindaian, pelaporan, dan moderasi. Tujuannya praktis: membantu pengguna
memeriksa apa yang mereka instal, memberi penerbit jalur pemulihan untuk positif palsu,
dan menjaga paket yang abusif keluar dari penemuan publik.

Lihat juga [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage).

## Apa yang dapat diperiksa pengguna

Sebelum menginstal skill atau plugin, periksa listing ClawHub-nya untuk:

- atribusi pemilik dan sumber
- versi terbaru dan changelog
- variabel lingkungan atau izin yang diperlukan
- metadata kompatibilitas untuk plugin
- status pemindaian atau moderasi
- laporan, komentar, bintang, unduhan, dan sinyal instal jika ditampilkan

Instal hanya konten yang Anda pahami dan percayai.

## Status pemindaian

ClawHub dapat menampilkan hasil pemindaian atau moderasi di halaman publik dan diagnostik
yang terlihat oleh pemilik.

Hasil umum meliputi:

- `clean`: tidak ditemukan masalah yang memblokir.
- `suspicious`: rilis memerlukan kehati-hatian atau peninjauan.
- `malicious`: rilis dianggap tidak aman.
- `pending`: pemeriksaan belum selesai.
- `held`, `quarantined`, `revoked`, atau `hidden`: rilis tidak sepenuhnya
  tersedia di permukaan instal publik.

Kata-kata persisnya dapat bervariasi menurut permukaan, tetapi makna praktisnya sama: jika
sebuah rilis ditahan atau diblokir, pengguna sebaiknya tidak menginstalnya sampai pemilik menyelesaikan
masalah tersebut atau moderasi memulihkannya.

## Skills

Pemindaian skill memeriksa bundel skill yang diterbitkan, metadata, persyaratan yang dinyatakan,
dan instruksi yang mencurigakan.

ClawHub memberi perhatian khusus pada ketidaksesuaian antara apa yang dinyatakan oleh sebuah skill dan
apa yang tampaknya dilakukan. Misalnya, skill yang merujuk ke kunci API yang diperlukan
harus menyatakan persyaratan tersebut di `SKILL.md` agar pengguna dapat melihatnya sebelum
menginstal.

Temuan pemindaian berbasis artefak. Perilaku provider yang diharapkan, seperti kredensial
API yang dinyatakan, callback OAuth localhost, pembersihan uninstall terbatas cakupan, pengodean Basic Auth,
atau unggahan file yang dipilih pengguna ke provider yang dinyatakan, diperlakukan
berbeda dari penerusan kredensial tersembunyi, akses luas ke file pribadi,
tujuan jaringan yang tidak terkait, atau penyalahgunaan browser secara tersembunyi.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Rilis plugin mencakup metadata paket, atribusi sumber, bidang kompatibilitas,
dan informasi integritas artefak.

OpenClaw memeriksa kompatibilitas sebelum menginstal plugin yang di-host ClawHub. Catatan
paket juga dapat mengekspos metadata digest agar OpenClaw dapat memverifikasi artefak
yang diunduh. ClawScan menyertakan metadata env/config paket `openclaw.environment`
yang dinyatakan saat meninjau rilis plugin sehingga persyaratan runtime yang dinyatakan
dibandingkan dengan perilaku yang diamati.

## Laporan

Pengguna yang sudah masuk dapat melaporkan skill, paket, dan komentar.

Laporan harus spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan juga dapat menyebabkan
tindakan terhadap akun.

Contoh laporan:

- metadata yang menyesatkan
- persyaratan kredensial atau izin yang tidak dinyatakan
- instruksi instal yang mencurigakan
- komentar scam atau peniruan identitas
- pendaftaran dengan niat buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage)

## Catatan ClawScan penerbit

Penerbit dapat memberikan catatan ClawScan opsional saat menerbitkan skill atau
plugin. Catatan ini memberi ClawScan konteks untuk perilaku yang mungkin terlihat
tidak biasa, seperti akses jaringan, akses host native, atau kredensial khusus
provider.

## Penahanan Moderasi

Saat pemindai statis menandai skill yang diunggah sebagai berbahaya, penerbit
secara otomatis ditempatkan dalam penahanan moderasi (`requiresModerationAt` disetel pada
pengguna). Ini menyembunyikan semua skill milik penerbit, menyebabkan penerbitan berikutnya
dimulai dalam keadaan tersembunyi, dan membuat entri log audit `user.moderation.auto`.

Temuan statis yang mencurigakan disimpan sebagai bukti file/baris untuk moderator,
tetapi temuan tersebut tidak menyembunyikan konten atau menentukan verdict pemindaian publik sendiri.
Unggahan baru tetap berada dalam status tinjauan/tertunda hingga tinjauan LLM selesai. Pemindaian
statis hanya langsung memblokir untuk signature berbahaya. Hit engine VirusTotal
tetap menjadi bukti keamanan yang terlihat, tetapi verdict VirusTotal Code Insight/Palm
bersifat advisory dan tidak menyembunyikan skill sendiri. Tinjauan LLM ClawScan
mempertahankan catatan yang selaras dengan tujuan sebagai panduan. Temuan tinjauan medium tetap terlihat pada
artefak, sedangkan filter mencurigakan disediakan untuk perhatian LLM berdampak tinggi,
temuan berbahaya, atau deteksi AV-engine yang terkoroborasi.

Admin dapat mencabut penahanan positif palsu:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Ini menghapus `requiresModerationAt` dan `requiresModerationReason`, memulihkan
skill yang disembunyikan oleh penahanan tingkat pengguna, dan menulis entri log audit
`user.moderation.lift`. Skill yang disembunyikan karena alasan lain, atau yang pemindaian statisnya sendiri tetap
berbahaya, tetap tersembunyi.

## Bans dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses penerbitan. Penyalahgunaan berat
dapat mengakibatkan ban akun, pencabutan token, konten tersembunyi, atau listing
yang dihapus.

Akun yang dihapus, diban, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika auth CLI
mulai gagal setelah tindakan akun, masuk ke UI web untuk meninjau status akun.
Jika proses masuk atau akses CLI normal diblokir, hubungi
security@openclaw.ai untuk tinjauan pemulihan.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga nama, ringkasan, tag, dan changelog tetap akurat
- nyatakan variabel lingkungan dan izin yang diperlukan
- tambahkan catatan ClawScan penerbit saat rilis memiliki perilaku yang tidak biasa tetapi disengaja
- hindari perintah instal yang diobfuscate
- tautkan ke sumber jika memungkinkan
- gunakan dry run sebelum menerbitkan plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku paket
