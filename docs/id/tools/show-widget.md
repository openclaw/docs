---
read_when:
    - Anda ingin agen merender hasil interaktif di obrolan web, aplikasi native, atau Discord
    - Anda ingin tombol widget mengirimkan prompt tindak lanjut ke dalam obrolan
    - Anda ingin menerapkan tema pada widget dengan token desain bersama
    - Anda memerlukan kontrak input, keamanan, atau retensi show_widget
sidebarTitle: Show widget
summary: Tampilkan widget HTML mandiri pada platform chat yang didukung
title: Tampilkan widget
x-i18n:
    generated_at: "2026-07-21T12:46:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 903adff1fadeb9d224d3e2d839c86082b5244e1e319255c8d3f6619344b749a3
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` adalah alat inti yang menampilkan widget HTML mandiri pada permukaan pengguna saat ini. OpenClaw merendernya secara inline di Control UI dan dalam transkrip Quick Chat iOS, Android, macOS, dan Linux; dasbor Linux menggunakan Control UI browser. Dalam sesi Discord dengan [Activities](/id/channels/discord-activities) yang diaktifkan, plugin Discord memposting tombol **Open widget** yang meluncurkannya sebagai Activity.

## Cara kerja widget

Saat agen memanggil `show_widget`, inti OpenClaw membungkus `widget_code` dalam dokumen HTML minimal, menyimpannya sebagai dokumen Canvas, dan mengembalikan handle pratinjau. Control UI merender handle tersebut dalam iframe terisolasi, sedangkan Quick Chat iOS, Android, macOS, dan Linux menggunakan tampilan web terisolasi. Klien obrolan lengkap memulihkan widget setelah riwayat dimuat ulang; Quick Chat mempertahankan widget selama balasan aktifnya.

Dalam sesi Control UI, widget Canvas juga dapat disematkan ke dasbor sesi. Tetapkan `pin: true` dalam pemanggilan alat, atau gunakan **Sematkan ke dasbor** pada widget transkrip yang sudah ada. HTML yang disematkan berjalan di belakang host sandbox origin khusus dengan iframe ganda yang sama seperti yang digunakan oleh MCP Apps; browser tidak pernah menyelesaikan pengikatan data widget di dalam frame yang tidak tepercaya.

Untuk penyematan browser, dokumen pembungkus menyisipkan empat bridge host kecil di sekitar kode widget:

- Pelapor ukuran memposting tinggi konten yang dirender ke obrolan penyemat, yang membatasinya dan menyesuaikan iframe (160 hingga 1200 piksel).
- Bridge host mendefinisikan pembantu lama `sendPrompt(text)` beserta API terstruktur `openclaw.prompt`, `openclaw.state`, `openclaw.data`, dan `openclaw.cron`. Prompt obrolan inline mempertahankan saluran pesan privatnya; API dasbor menggunakan saluran permintaan yang terikat tiket tampilan. Lihat [Widget interaktif](#interactive-widgets) dan [Kemampuan dasbor](#dashboard-capabilities).
- Bridge tema memantau token desain Control UI saat ini dan menerapkannya sebagai variabel CSS, saat pemuatan dan kembali pada setiap perubahan tema.
- Bridge snapshot merender dokumen widget saat ini sebagai PNG ketika obrolan penyemat meminta ekspor.

Semua hal lainnya tetap berada di dalam frame: dokumen berjalan pada origin buram dengan Content Security Policy yang ketat, sehingga skrip widget tidak dapat mengakses Control UI, Gateway, atau jaringan.

Implementasi inti hanya tersedia ketika klien Gateway asal mendeklarasikan kemampuan `inline-widgets`. Control UI dan aplikasi native yang didukung mendeklarasikan kemampuan ini secara otomatis. Quick Chat Linux tetap hanya berupa teks untuk koneksi Gateway yang memerlukan pin leaf TLS khusus karena WebView platformnya tidak dapat mengikat pin tersebut. Implementasi Discord hanya tersedia dalam sesi Discord dengan Activities yang dikonfigurasi. Eksekusi saluran lain tidak menerima `show_widget`.

Transportasi kemampuan mencakup backend model tertanam, app-server Codex, dan berbasis CLI. Pemanggil MCP yang diautentikasi dengan grant dan pemanggil langsung tool-invoke HTTP tetap gagal secara tertutup karena tidak mendeklarasikan kemampuan klien.

## Sistem desain

Setiap widget Canvas menyertakan stylesheet dasar tanpa kelas dan sekumpulan kecil token:

| Token                                                                                 | Tujuan                                |
| ------------------------------------------------------------------------------------- | ------------------------------------- |
| `--surface`                                                                           | Warna permukaan tingkat halaman       |
| `--card`                                                                              | Latar belakang kartu, tombol, dan kode |
| `--elevated`                                                                          | Latar belakang kontrol formulir yang ditinggikan |
| `--text`                                                                              | Teks isi dan kontrol default          |
| `--text-strong`                                                                       | Judul dan nilai yang menonjol         |
| `--muted`                                                                             | Teks sekunder dan batas halus         |
| `--border`                                                                            | Pemisah standar dan batas kartu       |
| `--border-strong`                                                                     | Batas kontrol tegas                   |
| `--accent`                                                                            | Tautan dan cincin fokus               |
| `--accent-fill`                                                                       | Isian tindakan utama                  |
| `--accent-fg`                                                                         | Teks pada tindakan utama              |
| `--ok`                                                                                | Status berhasil                       |
| `--warn`                                                                              | Status peringatan                     |
| `--danger`                                                                            | Status kesalahan atau destruktif      |
| `--info`                                                                              | Status informasional                  |
| `--radius`                                                                            | Radius sudut bersama untuk kontrol dan kartu |
| `--font-body`                                                                         | Tumpukan font isi host                |
| `--font-mono`                                                                         | Tumpukan font monospace host          |
| `--accent-subtle`, `--ok-subtle`, `--warn-subtle`, `--danger-subtle`, `--info-subtle` | Latar belakang status transparan turunan |

Judul, paragraf, tautan, tombol, input, pilihan, area teks, tabel, dan blok kode tanpa kelas menerima gaya dasar. Kelas pembantu menyediakan pola umum:

- `.card` untuk permukaan konten berbatas
- `.badge`, beserta `.ok`, `.warn`, `.danger`, atau `.info`, untuk label status ringkas
- `.metric` untuk nilai numerik yang menonjol
- `.muted` untuk teks sekunder
- `.row` untuk tata letak horizontal yang membungkus
- `button.primary` untuk tindakan utama

Control UI memposting pesan `openclaw:widget-theme` dengan nilai tema aktif saat widget dimuat dan setiap kali tema berubah. Oleh karena itu, widget mengikuti setiap keluarga tema, termasuk Claw, Knot, Dash, dan tema khusus, tanpa memuat ulang. Di luar Control UI, termasuk aplikasi native dan pembukaan langsung, widget menggunakan palet terang atau gelap bawaan yang dipilih oleh `prefers-color-scheme`.

Buat widget dengan tiga aturan:

1. Gunakan variabel desain untuk setiap warna dan latar belakang. Jangan menuliskan nilai warna secara langsung.
2. Pertahankan latar belakang halaman tetap transparan agar widget menyatu dengan permukaan host-nya.
3. Cadangkan `--accent-fill` untuk paling banyak satu tindakan utama.

**Ekspor:** Dalam obrolan web, buka menu kartu widget untuk menyalin widget yang dirender ke clipboard atau mengunduhnya sebagai PNG. Dokumen widget lama tanpa bridge snapshot akan kembali menggunakan pengunduhan file HTML.

## Menggunakan alat

Kedua implementasi menggunakan bidang wajib yang sama:

<ParamField path="title" type="string" required>
  Judul singkat yang ditampilkan bersama pratinjau inline dan dalam judul dokumen yang di-host.
</ParamField>

<ParamField path="widget_code" type="string" required>
  HTML atau SVG mandiri. Untuk klien widget inline, input yang diawali dengan `<svg` setelah pemangkasan dirender dalam mode SVG; panjang maksimum adalah 262,144 karakter. Discord menerima dokumen HTML lengkap atau fragmen body hingga 48 KiB.
</ParamField>

Discord juga menerima teks opsional `button_label` untuk tombol peluncuran Activity. Skema Canvas sengaja menghilangkan bidang khusus Discord ini.

Alat Canvas inti menerima bidang penempatan dasbor opsional berikut:

- `pin`: tempatkan juga widget pada dasbor sesi.
- `name`: nama widget stabil; secara default menggunakan slug dari `title`.
- `tab`: slug tab tujuan.
- `size`: salah satu dari `sm`, `md`, `lg`, `xl`, atau `full`.
- `after`: nama widget saudara yang setelahnya widget ini ditempatkan.
- `capabilities`: akses yang diminta oleh widget yang disematkan. `netOrigins` berisi origin HTTPS yang tepat; `tools` berisi `prompt`, pengikatan baca yang masuk daftar izin, atau tindakan `cron.trigger:<jobId>` yang tepat.

Hasil inti menyertakan handle pratinjau Canvas, sehingga Control UI dan aplikasi native yang didukung merender widget secara langsung dari pemanggilan alat dan memulihkannya setelah riwayat dimuat ulang. Hasil yang disematkan juga mempertahankan nama widget papan agar Control UI tidak menawarkan penyematan duplikat setelah transkrip dimuat ulang. Discord mengembalikan pengenal widget tersimpan dan pesan yang diposting.

`discord_widget` tetap terdaftar sebagai alias usang selama satu rilis. Pemanggilan agen baru sebaiknya menggunakan `show_widget`.

## Widget interaktif

Di Control UI, skrip widget dapat mengendalikan percakapan. Dokumen pembungkus mendefinisikan fungsi global `sendPrompt(text)`; memanggilnya akan mengirimkan `text` ke obrolan seolah-olah pengguna telah mengetik dan mengirim pesan tersebut. Hubungkan fungsi ini ke tombol atau kontrol lain untuk membangun alur interaktif seperti pemilih, kuis, atau dasbor perincian. Aplikasi native merender kode widget interaktif tetapi tidak mengekspos bridge prompt obrolan ini.

```html
<button onclick="sendPrompt('Tampilkan pengujian yang gagal secara terperinci')">Pengujian yang gagal</button>
```

Setiap prompt divalidasi pada kedua sisi batas frame:

- `sendPrompt` memerlukan [aktivasi pengguna sementara](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation) di dalam widget: fungsi ini hanya bekerja selama beberapa detik setelah pengguna mengeklik atau menekan tombol keyboard di dalam widget, jadi hubungkan fungsi ini ke tombol dan target klik lainnya — memanggilnya secara otomatis saat pemuatan tidak menghasilkan apa pun. Bridge menjaga endpoint pengiriman tetap privat untuk dirinya sendiri dan gagal secara tertutup pada browser yang tidak mengekspos aktivasi pengguna, sehingga kode widget tidak dapat melewati pemeriksaan.
- Otoritas prompt hanya dimiliki oleh dokumen widget asli. Bridge tepercaya menawarkan endpoint salurannya ke obrolan sebelum kode widget dapat berjalan atau menavigasi frame, obrolan hanya mengadopsi penawaran pertama tersebut, dan saluran berakhir bersama dokumen saat navigasi. URL sematan yang diizinkan secara eksternal tidak pernah diadopsi.
- Frame widget harus terlihat dalam transkrip obrolan dan memegang fokus — sinyal tambahan yang diamati host bahwa pengguna benar-benar berinteraksi dengan widget ini.
- Teks harus tidak kosong setelah pemangkasan dan paling banyak 4,000 karakter.
- Prompt yang diawali dengan `/` ditolak, sehingga kode widget tidak dapat memicu perintah obrolan seperti `/approve` atau `/stop`.
- Setiap dokumen widget dapat mengirim paling banyak 10 prompt per menit berjalan; prompt berlebih dibuang tanpa pemberitahuan.

Prompt yang diterima muncul dalam transkrip sebagai pesan pengguna biasa dan memulai giliran agen normal dalam sesi yang memiliki widget. Tidak ada saluran umpan balik ke widget: prompt yang dibuang gagal tanpa pemberitahuan, dan widget tidak dapat membaca balasan agen.

## Kemampuan dasbor

Widget yang disematkan dapat menggunakan satu API host terikat tiket setelah operator meninjau deklarasi yang ditampilkan pada kartu tertunda:

- `openclaw.prompt.send(text)` memerlukan aktivasi pengguna sementara dan memposting pesan komposer yang terlihat. Mendeklarasikan dan menerima pemberian alat `prompt` akan melewati konfirmasi tambahan per klik; validasi, pemeriksaan fokus, dan batas laju tetap berlaku.
- `openclaw.state.emit(payload)` menambahkan pemberitahuan sesi. Payload dibatasi hingga 8 KiB, dan emisi klien identik dalam waktu lima detik digabungkan.
- `openclaw.data.read(bindingId, params?)` hanya di-resolve di Gateway. Binding yang dapat diberikan adalah `sessions.list`, `usage.status`, `usage.cost`, `cron.list`, `cron.status`, `agents.list`, dan `health`.
- `openclaw.cron.trigger(jobId)` menjalankan pekerjaan yang sudah ada sekarang hanya jika kapabilitas `cron.trigger:<jobId>` yang persis telah diberikan.

Akses jaringan terpisah dari alat host. Masukkan origin HTTPS yang persis di `capabilities.netOrigins`; setelah disetujui, hanya origin tersebut yang dimasukkan ke `connect-src` milik widget. Wildcard, kredensial, jalur, string kueri, dan origin yang tidak dideklarasikan tetap diblokir. Port literal hanya diizinkan jika merupakan bagian dari origin yang dideklarasikan.

## Keamanan dan penyimpanan

Dokumen widget menggunakan Kebijakan Keamanan Konten yang ketat. Gaya dan skrip inline diizinkan, sedangkan pemuatan sumber daya eksternal tetap diblokir. Widget transkrip inline tidak dapat mengambil data dari jaringan. Widget dasbor yang disematkan dapat mengambil data hanya dari origin HTTPS persis yang dideklarasikan oleh agen dan diberikan oleh operator.

Iframe Control UI selalu menghilangkan `allow-same-origin`, bahkan ketika mode penyematan global adalah `trusted`, sehingga skrip widget tidak dapat membaca origin aplikasi induk. Klien native menggunakan tampilan web terisolasi yang tidak persisten dan memblokir navigasi keluar dari widget yang di-host. Host dokumen inti juga menyajikan widget dengan header respons `Content-Security-Policy: sandbox allow-scripts`, sehingga rendering langsung tetap menjalankan widget dalam origin buram, bukan origin aplikasi. Hanya render kode widget yang bersedia Anda jalankan dalam bingkai terisolasi tersebut.

Iframe juga mengikuti [`gateway.controlUi.embedSandbox`](/id/web/control-ui#hosted-embeds). Tingkat `scripts` default mendukung widget interaktif sekaligus mempertahankan isolasi origin.

Risiko residual egress saluran data WebRTC yang diterima didokumentasikan dalam [Arsitektur Dasbor](/id/web/dashboard-architecture#modeled-residual-webrtc-data-channels).

Canvas mempertahankan paling banyak 32 widget per sesi (atau per agen jika tidak ada sesi yang tersedia). Membuat widget lain akan menghapus dokumen tertua dalam cakupan tersebut.

## Terkait

- [Penyematan yang di-host Control UI](/id/web/control-ui#hosted-embeds)
- [Aktivitas Discord](/id/channels/discord-activities)
- [Kontrol node Canvas](/id/plugins/reference/canvas)
- [Kapabilitas klien protokol Gateway](/id/gateway/protocol#client-capabilities)
