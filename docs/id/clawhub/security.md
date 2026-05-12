---
read_when:
    - Memahami hasil pemindaian dan moderasi ClawHub
    - Melaporkan skill atau paket
    - Memulihkan cantuman yang ditahan, disembunyikan, atau diblokir
summary: Perilaku kepercayaan, pemindaian, pelaporan, dan moderasi ClawHub.
x-i18n:
    generated_at: "2026-05-12T08:44:46Z"
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
dan menjaga paket abusif agar tidak muncul dalam penemuan publik.

Lihat juga [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage).

## Apa yang dapat diperiksa pengguna

Sebelum menginstal skill atau plugin, periksa listing ClawHub-nya untuk:

- atribusi pemilik dan sumber
- versi terbaru dan changelog
- variabel lingkungan atau izin yang diperlukan
- metadata kompatibilitas untuk plugin
- status pemindaian atau moderasi
- laporan, komentar, bintang, unduhan, dan sinyal instalasi jika ditampilkan

Instal hanya konten yang Anda pahami dan percayai.

## Status pemindaian

ClawHub dapat menampilkan hasil pemindaian atau moderasi pada halaman publik dan
diagnostik yang terlihat oleh pemilik.

Hasil umum mencakup:

- `clean`: tidak ada masalah pemblokir yang ditemukan.
- `suspicious`: rilis perlu kehati-hatian atau peninjauan.
- `malicious`: rilis dianggap tidak aman.
- `pending`: pemeriksaan belum selesai.
- `held`, `quarantined`, `revoked`, atau `hidden`: rilis tidak sepenuhnya
  tersedia pada permukaan instalasi publik.

Kata-kata persisnya dapat bervariasi menurut permukaan, tetapi makna praktisnya sama: jika suatu
rilis ditahan atau diblokir, pengguna tidak boleh menginstalnya sampai pemilik menyelesaikan
masalahnya atau moderasi memulihkannya.

## Skills

Pemindaian skill melihat bundel skill yang dipublikasikan, metadata, persyaratan yang
dideklarasikan, dan instruksi yang mencurigakan.

ClawHub memberi perhatian khusus pada ketidaksesuaian antara apa yang dideklarasikan skill dan
apa yang tampaknya dilakukan skill tersebut. Misalnya, skill yang merujuk ke kunci API yang diperlukan
harus mendeklarasikan persyaratan itu di `SKILL.md` agar pengguna dapat melihatnya sebelum
menginstal.

Temuan pemindaian berbasis artefak. Perilaku penyedia yang diharapkan, seperti kredensial
API yang dideklarasikan, callback OAuth localhost, pembersihan uninstall terbatas cakupan, pengodean Basic Auth,
atau unggahan file pilihan pengguna ke penyedia yang dinyatakan, diperlakukan
berbeda dari penerusan kredensial tersembunyi, akses file privat yang luas,
tujuan jaringan yang tidak terkait, atau penyalahgunaan browser terselubung.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Rilis plugin mencakup metadata paket, atribusi sumber, kolom kompatibilitas,
dan informasi integritas artefak.

OpenClaw memeriksa kompatibilitas sebelum menginstal plugin yang di-hosting ClawHub. Catatan
paket juga dapat mengekspos metadata digest agar OpenClaw dapat memverifikasi artefak
yang diunduh. ClawScan menyertakan metadata env/config paket `openclaw.environment`
yang dideklarasikan saat meninjau rilis plugin, sehingga persyaratan runtime yang dideklarasikan
dibandingkan dengan perilaku yang diamati.

## Laporan

Pengguna yang sudah masuk dapat melaporkan skill, paket, dan komentar.

Laporan harus spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan juga dapat menyebabkan
tindakan akun.

Contoh laporan:

- metadata yang menyesatkan
- persyaratan kredensial atau izin yang tidak dideklarasikan
- instruksi instalasi yang mencurigakan
- komentar penipuan atau peniruan identitas
- pendaftaran dengan iktikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage)

## Catatan ClawScan penerbit

Penerbit dapat memberikan catatan ClawScan opsional saat menerbitkan skill atau
plugin. Catatan ini memberi ClawScan konteks untuk perilaku yang mungkin terlihat
tidak biasa, seperti akses jaringan, akses host native, atau kredensial khusus
penyedia.

## Penahanan Moderasi

Saat pemindai statis menandai skill yang diunggah sebagai berbahaya, penerbit
secara otomatis ditempatkan dalam penahanan moderasi (`requiresModerationAt` diatur pada
pengguna). Ini menyembunyikan semua skill penerbit, menyebabkan publikasi berikutnya
dimulai dalam keadaan tersembunyi, dan membuat entri log audit `user.moderation.auto`.

Temuan mencurigakan statis disimpan sebagai bukti file/baris untuk moderator,
tetapi temuan tersebut tidak menyembunyikan konten atau menentukan verdict pemindaian publik sendiri.
Unggahan baru tetap dalam status tinjauan/tertunda hingga tinjauan LLM selesai. Pemindaian
statis hanya memblokir segera untuk signature berbahaya. Hit mesin VirusTotal
tetap terlihat sebagai bukti keamanan, tetapi verdict VirusTotal Code Insight/Palm
bersifat nasihat dan tidak menyembunyikan skill dengan sendirinya. Tinjauan LLM ClawScan
menyimpan catatan yang selaras dengan tujuan sebagai panduan. Temuan tinjauan sedang tetap terlihat pada
artefak, sementara filter mencurigakan dicadangkan untuk kekhawatiran LLM berdampak tinggi,
temuan berbahaya, atau deteksi mesin AV yang terkonfirmasi.

Admin dapat mencabut penahanan positif palsu:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Ini menghapus `requiresModerationAt` dan `requiresModerationReason`, memulihkan
skill yang disembunyikan oleh penahanan tingkat pengguna, dan menulis entri log audit `user.moderation.lift`.
Skill yang disembunyikan karena alasan lain, atau yang pemindaian statisnya sendiri masih
berbahaya, tetap tersembunyi.

## Pemblokiran dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses penerbitan. Penyalahgunaan berat
dapat mengakibatkan pemblokiran akun, pencabutan token, konten tersembunyi, atau listing
yang dihapus.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika autentikasi CLI
mulai gagal setelah tindakan akun, masuk ke UI web untuk meninjau status akun.
Jika proses masuk atau akses CLI normal diblokir, hubungi
security@openclaw.ai untuk tinjauan pemulihan.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga agar nama, ringkasan, tag, dan changelog akurat
- deklarasikan variabel lingkungan dan izin yang diperlukan
- tambahkan catatan ClawScan penerbit saat rilis memiliki perilaku yang tidak biasa tetapi disengaja
- hindari perintah instalasi yang disamarkan
- tautkan ke sumber jika memungkinkan
- gunakan dry run sebelum menerbitkan plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku paket
