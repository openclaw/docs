---
read_when:
    - Memahami hasil pemindaian dan moderasi ClawHub
    - Melaporkan skill atau paket
    - Memulihkan cantuman yang ditahan, disembunyikan, atau diblokir
summary: Perilaku kepercayaan, pemindaian, pelaporan, banding, dan moderasi ClawHub.
x-i18n:
    generated_at: "2026-05-10T19:26:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83d68ab910ad4812ae79e887d52ff1c5b8248542e1d27d54a81a18cbd821debf
    source_path: clawhub/security.md
    workflow: 16
---

# Keamanan + Moderasi

ClawHub terbuka untuk publikasi, tetapi listing publik tetap melewati kontrol
kepercayaan, pemindaian, pelaporan, dan moderasi. Tujuannya praktis: membantu pengguna
memeriksa apa yang mereka instal, memberi penerbit jalur pemulihan untuk positif palsu,
dan menjauhkan paket abusif dari penemuan publik.

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

ClawHub dapat menampilkan hasil pemindaian atau moderasi pada halaman publik dan
diagnostik yang terlihat oleh pemilik.

Hasil umum mencakup:

- `clean`: tidak ditemukan masalah yang memblokir.
- `suspicious`: rilis memerlukan kehati-hatian atau peninjauan.
- `malicious`: rilis dianggap tidak aman.
- `pending`: pemeriksaan belum selesai.
- `held`, `quarantined`, `revoked`, atau `hidden`: rilis belum sepenuhnya
  tersedia di permukaan instalasi publik.

Kata-kata persisnya dapat bervariasi menurut permukaan, tetapi makna praktisnya
sama: jika sebuah rilis ditahan atau diblokir, pengguna tidak boleh
menginstalnya sampai pemilik menyelesaikan masalah atau moderasi memulihkannya.

## Skills

Pemindaian skill melihat bundel skill yang dipublikasikan, metadata, persyaratan
yang dideklarasikan, dan instruksi yang mencurigakan.

ClawHub memberi perhatian khusus pada ketidaksesuaian antara apa yang dideklarasikan
oleh sebuah skill dan apa yang tampaknya dilakukannya. Misalnya, skill yang merujuk
kunci API wajib harus mendeklarasikan persyaratan tersebut di `SKILL.md` agar
pengguna dapat melihatnya sebelum menginstal.

Temuan pemindaian berbasis artefak. Perilaku penyedia yang diharapkan, seperti
kredensial API yang dideklarasikan, callback OAuth localhost, pembersihan uninstall
tercakup, enkode Basic Auth, atau unggahan file pilihan pengguna ke penyedia yang
disebutkan, diperlakukan berbeda dari penerusan kredensial tersembunyi, akses luas
ke file privat, tujuan jaringan yang tidak terkait, atau penyalahgunaan browser
secara tersembunyi.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Rilis Plugin mencakup metadata paket, atribusi sumber, bidang kompatibilitas,
dan informasi integritas artefak.

OpenClaw memeriksa kompatibilitas sebelum menginstal plugin yang dihosting ClawHub.
Catatan paket juga dapat mengekspos metadata digest agar OpenClaw dapat memverifikasi
artefak yang diunduh. ClawScan menyertakan metadata env/config paket
`openclaw.environment` yang dideklarasikan saat meninjau rilis plugin sehingga
persyaratan runtime yang dideklarasikan dibandingkan dengan perilaku yang diamati.

## Laporan

Pengguna yang masuk dapat melaporkan skill, paket, dan komentar.

Laporan harus spesifik dan dapat ditindaklanjuti. Penyalahgunaan pelaporan itu
sendiri dapat menyebabkan tindakan terhadap akun.

Contoh laporan:

- metadata yang menyesatkan
- persyaratan kredensial atau izin yang tidak dideklarasikan
- instruksi instalasi yang mencurigakan
- komentar penipuan atau penyamaran
- pendaftaran dengan itikad buruk atau penyalahgunaan merek dagang
- konten yang melanggar [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage)

## Laporan itikad buruk atau merek dagang

ClawHub menggunakan alur laporan dan moderasi staf yang sama untuk pendaftaran
dengan itikad buruk, penyamaran, dan sengketa terkait merek dagang. Laporan ini
memerlukan konteks yang cukup agar staf dapat mengidentifikasi penggugat, listing
yang disengketakan, dan tindakan yang diminta.

Sertakan:

- URL skill atau paket ClawHub kanonis dan handle pemilik
- merek dagang, proyek, perusahaan, atau nama produk yang dipermasalahkan
- bukti publik atas kepemilikan atau kewenangan penggugat
- alasan pemilik saat ini tidak berwenang untuk memublikasikan dengan nama tersebut
- tindakan yang diminta, seperti sembunyikan sambil menunggu peninjauan, alihkan kepemilikan, ganti nama,
  atau hapus

Jangan memasukkan rahasia privat atau dokumen hukum sensitif dalam laporan publik. Buka
issue GitHub dengan bukti yang tidak sensitif dan minta maintainer untuk jalur
serah terima privat bila diperlukan.

## Banding dan pemindaian ulang

Pemilik dapat meminta pemindaian ulang ketika mereka yakin sebuah skill atau paket
ditahan atau ditandai secara keliru. Moderator platform dan admin dapat meminta
pemindaian ulang untuk skill atau paket apa pun saat menangani laporan atau permintaan dukungan:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Untuk konten yang dimoderasi, pemilik mungkin dapat mengajukan banding dari
permukaan ClawHub yang terlihat oleh pemilik. Banding harus menjelaskan apa yang
berubah atau mengapa tanda tersebut keliru.

## Penahanan Moderasi

Ketika pemindai statis menandai skill yang diunggah sebagai berbahaya, penerbit
secara otomatis ditempatkan dalam penahanan moderasi (`requiresModerationAt` ditetapkan pada
pengguna). Ini menyembunyikan semua skill milik penerbit, menyebabkan publikasi berikutnya
dimulai dalam keadaan tersembunyi, dan membuat entri log audit `user.moderation.auto`.

Temuan statis yang mencurigakan disimpan sebagai bukti file/baris untuk moderator,
tetapi temuan tersebut tidak menyembunyikan konten atau menentukan verdict pemindaian publik sendiri.
Unggahan baru tetap dalam status peninjauan/tertunda sampai tinjauan VirusTotal dan LLM
selesai; pemindaian statis hanya langsung memblokir untuk signature berbahaya.
Tinjauan ClawScan LLM menyimpan catatan yang selaras dengan tujuan sebagai panduan; tinjauan tersebut hanya mengembalikan
verdict Review/suspicious ketika tinjauan terstruktur menyertakan kekhawatiran material.

Admin dapat mencabut penahanan positif palsu:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Ini menghapus `requiresModerationAt` dan `requiresModerationReason`, memulihkan
skill yang disembunyikan oleh penahanan tingkat pengguna, dan menulis entri log audit
`user.moderation.lift`. Skill yang disembunyikan karena alasan lain, atau yang
pemindaian statisnya sendiri tetap berbahaya, tetap tersembunyi.

## Banned dan status akun

Akun yang melanggar kebijakan ClawHub dapat kehilangan akses publikasi. Penyalahgunaan
berat dapat mengakibatkan banned akun, pencabutan token, konten tersembunyi, atau
listing dihapus.

Akun yang dihapus, di-banned, atau dinonaktifkan tidak dapat menggunakan token API ClawHub. Jika auth CLI
mulai gagal setelah tindakan terhadap akun, masuk ke UI web untuk meninjau status
akun atau hubungi maintainer melalui kanal dukungan proyek yang diharapkan.

## Panduan penerbit

Untuk mengurangi positif palsu dan meningkatkan kepercayaan pengguna:

- jaga agar nama, ringkasan, tag, dan changelog tetap akurat
- deklarasikan variabel lingkungan dan izin yang diperlukan
- hindari perintah instalasi yang diobfuskasi
- tautkan ke sumber bila memungkinkan
- gunakan dry run sebelum memublikasikan plugin
- tanggapi dengan jelas jika pengguna atau moderator bertanya tentang perilaku paket
