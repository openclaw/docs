---
read_when:
    - Memahami hasil pemindaian dan moderasi ClawHub
    - Melaporkan keterampilan atau paket
    - Memulihkan cantuman yang ditahan, disembunyikan, atau diblokir
summary: Perilaku kepercayaan, pemindaian, pelaporan, dan moderasi ClawHub.
x-i18n:
    generated_at: "2026-05-12T12:49:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Keamanan + Moderasi

ClawHub terbuka untuk publikasi, tetapi listing publik tetap melewati kontrol kepercayaan,
pemindaian, pelaporan, dan moderasi. Tujuannya praktis: membantu pengguna
memeriksa apa yang mereka instal, memberi penerbit jalur pemulihan untuk positif palsu,
dan menjauhkan paket yang menyalahgunakan layanan dari penemuan publik.

Lihat juga [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage).

## Yang dapat diperiksa pengguna

Sebelum menginstal skill atau plugin, periksa listing ClawHub-nya untuk:

- atribusi pemilik dan sumber
- versi terbaru dan changelog
- variabel lingkungan atau izin yang diperlukan
- metadata kompatibilitas untuk plugin
- status pemindaian atau moderasi
- laporan, komentar, bintang, unduhan, dan sinyal instalasi jika ditampilkan

Instal hanya konten yang Anda pahami dan percayai.

## Status pemindaian

ClawHub dapat menampilkan hasil pemindaian atau moderasi di halaman publik dan diagnostik
yang terlihat oleh pemilik.

Hasil umum mencakup:

- `clean`: tidak ditemukan masalah yang memblokir.
- `suspicious`: rilis memerlukan kehati-hatian atau peninjauan.
- `malicious`: rilis dianggap tidak aman.
- `pending`: pemeriksaan belum selesai.
- `held`, `quarantined`, `revoked`, atau `hidden`: rilis belum sepenuhnya
  tersedia di permukaan instalasi publik.

Kata-kata persisnya dapat berbeda menurut permukaan, tetapi makna praktisnya sama: jika sebuah
rilis ditahan atau diblokir, pengguna tidak boleh menginstalnya sampai pemilik menyelesaikan
masalahnya atau moderasi memulihkannya.

## Skills

Pemindaian skill memeriksa bundel skill yang dipublikasikan, metadata, persyaratan
yang dideklarasikan, dan instruksi yang mencurigakan.

ClawHub memberi perhatian khusus pada ketidaksesuaian antara apa yang dideklarasikan skill dan
apa yang tampaknya dilakukannya. Misalnya, skill yang merujuk ke kunci API yang diperlukan
harus mendeklarasikan persyaratan tersebut di `SKILL.md` sehingga pengguna dapat melihatnya sebelum
menginstal.

Temuan pemindaian berbasis artefak. Perilaku penyedia yang diharapkan, seperti
kredensial API yang dideklarasikan, callback OAuth localhost, pembersihan uninstall yang tercakup, pengodean Basic Auth,
atau unggahan file yang dipilih pengguna ke penyedia yang disebutkan, diperlakukan
berbeda dari penerusan kredensial tersembunyi, akses file pribadi yang luas,
tujuan jaringan yang tidak terkait, atau penyalahgunaan browser diam-diam.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Rilis plugin mencakup metadata paket, atribusi sumber, bidang kompatibilitas,
dan informasi integritas artefak.

OpenClaw memeriksa kompatibilitas sebelum menginstal plugin yang dihosting ClawHub. Catatan
paket juga dapat mengekspos metadata digest sehingga OpenClaw dapat memverifikasi artefak
yang diunduh. ClawScan menyertakan metadata env/konfigurasi `openclaw.environment` paket
yang dideklarasikan saat meninjau rilis plugin sehingga persyaratan runtime yang dideklarasikan
dibandingkan dengan perilaku yang diamati.

## Laporan

Pengguna yang masuk dapat melaporkan skill, paket, dan komentar.

Laporan harus spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan juga dapat menyebabkan
tindakan terhadap akun.

Contoh laporan:

- metadata yang menyesatkan
- persyaratan kredensial atau izin yang tidak dideklarasikan
- instruksi instalasi yang mencurigakan
- komentar scam atau peniruan identitas
- pendaftaran dengan itikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage)

## Catatan ClawScan penerbit

Penerbit dapat memberikan catatan ClawScan opsional saat memublikasikan skill atau
plugin. Catatan ini memberi ClawScan konteks untuk perilaku yang mungkin tampak
tidak biasa, seperti akses jaringan, akses host native, atau kredensial khusus penyedia.

## Penahanan Moderasi

Ketika pemindai statis menandai skill yang diunggah sebagai berbahaya, penerbit akan
secara otomatis ditempatkan dalam penahanan moderasi (`requiresModerationAt` ditetapkan pada
pengguna). Ini menyembunyikan semua skill penerbit, membuat publikasi berikutnya
dimulai dalam keadaan tersembunyi, dan membuat entri log audit `user.moderation.auto`.

Temuan statis yang mencurigakan dipertahankan sebagai bukti file/baris untuk moderator,
tetapi temuan tersebut tidak menyembunyikan konten atau menentukan verdict pemindaian publik sendiri.
Unggahan baru tetap dalam status ditinjau/pending sampai tinjauan LLM selesai. Pemindaian statis
hanya langsung memblokir untuk tanda tangan berbahaya. Hit mesin VirusTotal
tetap terlihat sebagai bukti keamanan, tetapi verdict VirusTotal Code Insight/Palm
bersifat nasihat dan tidak menyembunyikan skill dengan sendirinya. Tinjauan LLM ClawScan
menyimpan catatan yang selaras dengan tujuan sebagai panduan. Temuan tinjauan medium tetap terlihat pada
artefak, sementara filter mencurigakan disediakan untuk kekhawatiran LLM berdampak tinggi,
temuan berbahaya, atau deteksi mesin AV yang dikuatkan.

Admin dapat mencabut penahanan positif palsu:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Ini menghapus `requiresModerationAt` dan `requiresModerationReason`, memulihkan
skill yang disembunyikan oleh penahanan tingkat pengguna, dan menulis entri log audit `user.moderation.lift`.
Skill yang disembunyikan karena alasan lain, atau yang pemindaian statisnya sendiri tetap
berbahaya, tetap tersembunyi.

## Pemblokiran dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses publikasi. Penyalahgunaan berat
dapat mengakibatkan pemblokiran akun, pencabutan token, konten tersembunyi, atau listing
yang dihapus.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika autentikasi CLI
mulai gagal setelah tindakan akun, masuk ke UI web untuk meninjau status akun.
Jika proses masuk atau akses CLI normal diblokir, hubungi
security@openclaw.ai untuk peninjauan pemulihan.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga agar nama, ringkasan, tag, dan changelog tetap akurat
- deklarasikan variabel lingkungan dan izin yang diperlukan
- tambahkan catatan ClawScan penerbit ketika rilis memiliki perilaku yang tidak biasa tetapi disengaja
- hindari perintah instalasi yang diobfuskasi
- tautkan ke sumber jika memungkinkan
- gunakan dry run sebelum memublikasikan plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku paket
