---
read_when:
    - Anda ingin agen menampilkan hasil interaktif di obrolan web, aplikasi native, atau Discord
    - Anda ingin tombol widget mengirim prompt tindak lanjut ke dalam obrolan
    - Anda ingin menerapkan tema pada widget dengan token desain bersama
    - Anda memerlukan kontrak input, keamanan, atau retensi show_widget
sidebarTitle: Show widget
summary: Tampilkan widget HTML mandiri pada antarmuka chat yang didukung
title: Tampilkan widget
x-i18n:
    generated_at: "2026-07-19T05:37:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f269156b16b40d5171d5a0e8edaef87a9cb726a536dce1d9a73a426ce89a71b2
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` adalah alat inti yang menampilkan widget HTML mandiri pada permukaan yang sedang digunakan pengguna. OpenClaw merendernya secara inline dalam transkrip obrolan Control UI, iOS, Android, dan macOS; Linux menggunakan Control UI di browser. Dalam sesi Discord yang mengaktifkan [Activities](/channels/discord-activities), plugin Discord memposting tombol **Open widget** yang meluncurkannya sebagai Activity.

## Cara kerja widget

Saat agen memanggil `show_widget`, inti OpenClaw membungkus `widget_code` dalam dokumen HTML minimal, menyimpannya sebagai dokumen Canvas, dan mengembalikan handel pratinjau. Control UI merender handel tersebut sebagai iframe dengan sandbox tepat di bawah panggilan alat, sedangkan aplikasi native menggunakan tampilan web terisolasi. Keduanya memulihkan widget setelah riwayat dimuat ulang.

Untuk penyematan di browser, dokumen pembungkus menyuntikkan empat jembatan host kecil di sekitar kode widget:

- Pelapor ukuran mengirimkan tinggi konten yang dirender ke obrolan penyemat, yang membatasinya dan menyesuaikan iframe (160 hingga 1200 piksel).
- Jembatan prompt mendefinisikan fungsi global `sendPrompt(text)` yang dapat dipanggil skrip widget untuk mengirimkan pesan tindak lanjut ke obrolan. Jembatan tersebut membuat saluran pesan privat dan menawarkan satu titik akhir kepada obrolan sebelum kode widget apa pun dijalankan; obrolan hanya menerima penawaran pertama tersebut. Lihat [Widget interaktif](#interactive-widgets).
- Jembatan tema memantau token desain Control UI saat ini dan menerapkannya sebagai variabel CSS, saat pemuatan dan kembali pada setiap perubahan tema.
- Jembatan snapshot merender dokumen widget saat ini sebagai PNG ketika obrolan penyemat meminta ekspor.

Semua hal lainnya tetap berada di dalam frame: dokumen berjalan dalam origin buram dengan Content Security Policy yang ketat, sehingga skrip widget tidak dapat mengakses Control UI, Gateway, atau jaringan.

Implementasi inti hanya tersedia jika klien Gateway asal mendeklarasikan kapabilitas `inline-widgets`. Control UI dan aplikasi native yang didukung mendeklarasikan kapabilitas ini secara otomatis. Implementasi Discord hanya tersedia dalam sesi Discord yang telah mengonfigurasi Activities. Proses kanal lain tidak menerima `show_widget`.

Transportasi kapabilitas mencakup backend model tertanam, server aplikasi Codex, dan berbasis CLI. Pemanggil MCP yang diautentikasi dengan grant dan pemanggil langsung alat melalui HTTP tetap tertutup jika gagal karena tidak mendeklarasikan kapabilitas klien.

## Sistem desain

Setiap widget Canvas menyertakan stylesheet dasar tanpa kelas dan sekumpulan kecil token:

| Token                                                                                 | Tujuan                                |
| ------------------------------------------------------------------------------------- | ------------------------------------- |
| `--surface`                                                                           | Warna permukaan tingkat halaman       |
| `--card`                                                                              | Latar belakang kartu, tombol, dan kode |
| `--elevated`                                                                          | Latar belakang kontrol formulir yang ditinggikan |
| `--text`                                                                              | Teks isi dan kontrol default          |
| `--text-strong`                                                                       | Judul dan nilai yang ditonjolkan      |
| `--muted`                                                                             | Teks sekunder dan batas halus         |
| `--border`                                                                            | Pemisah standar dan batas kartu       |
| `--border-strong`                                                                     | Batas kontrol yang kuat               |
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
- `.metric` untuk nilai numerik yang ditonjolkan
- `.muted` untuk teks sekunder
- `.row` untuk tata letak horizontal yang dapat membungkus
- `button.primary` untuk tindakan utama

Control UI mengirimkan pesan `openclaw:widget-theme` dengan nilai tema aktif saat widget dimuat dan setiap kali tema berubah. Karena itu, widget mengikuti setiap kelompok tema, termasuk Claw, Knot, Dash, dan tema khusus, tanpa dimuat ulang. Di luar Control UI, termasuk aplikasi native dan pembukaan langsung, widget menggunakan palet terang atau gelap bawaan yang dipilih oleh `prefers-color-scheme`.

Buat widget dengan tiga aturan:

1. Gunakan variabel desain untuk setiap warna dan latar belakang. Jangan melakukan hardcode pada nilai warna.
2. Biarkan latar belakang halaman transparan agar widget menyatu dengan permukaan host-nya.
3. Gunakan `--accent-fill` untuk paling banyak satu tindakan utama.

**Ekspor:** Dalam obrolan web, buka menu kartu widget untuk menyalin widget yang dirender ke papan klip atau mengunduhnya sebagai PNG. Dokumen widget lama tanpa jembatan snapshot akan menggunakan pengunduhan file HTML sebagai fallback.

## Menggunakan alat

Kedua implementasi menggunakan bidang wajib yang sama:

<ParamField path="title" type="string" required>
  Judul singkat yang ditampilkan bersama pratinjau inline dan dalam judul dokumen yang di-host.
</ParamField>

<ParamField path="widget_code" type="string" required>
  HTML atau SVG mandiri. Untuk klien widget inline, input yang diawali dengan `<svg` setelah spasi di awal dan akhir dihapus akan dirender dalam mode SVG; panjang maksimum adalah 262.144 karakter. Discord menerima dokumen HTML lengkap atau fragmen isi hingga 48 KiB.
</ParamField>

Discord juga menerima teks opsional `button_label` untuk tombol peluncuran Activity. Skema Canvas sengaja tidak menyertakan bidang khusus Discord ini.

Hasil inti menyertakan handel pratinjau Canvas, sehingga Control UI dan aplikasi native yang didukung merender widget langsung dari panggilan alat dan memulihkannya setelah riwayat dimuat ulang. Discord mengembalikan pengidentifikasi widget yang disimpan dan pesan yang diposting.

`discord_widget` tetap terdaftar sebagai alias usang selama satu rilis. Panggilan agen baru harus menggunakan `show_widget`.

## Widget interaktif

Dalam Control UI, skrip widget dapat mengendalikan percakapan. Dokumen pembungkus mendefinisikan fungsi global `sendPrompt(text)`; memanggilnya akan mengirimkan `text` ke obrolan seolah-olah pengguna telah mengetik dan mengirim pesan tersebut. Hubungkan fungsi ini ke tombol atau kontrol lain untuk membangun alur interaktif seperti pemilih, kuis, atau dasbor penelusuran mendetail. Aplikasi native merender kode widget interaktif, tetapi tidak mengekspos jembatan prompt obrolan ini.

```html
<button onclick="sendPrompt('Tampilkan pengujian yang gagal secara mendetail')">Pengujian yang gagal</button>
```

Setiap prompt divalidasi pada kedua sisi batas frame:

- `sendPrompt` memerlukan [aktivasi pengguna sementara](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation) di dalam widget: fungsi ini hanya bekerja selama beberapa detik setelah pengguna mengeklik atau menekan tombol keyboard di dalam widget, jadi hubungkan ke tombol dan target klik lainnya — memanggilnya secara otomatis saat pemuatan tidak menghasilkan apa pun. Jembatan menjaga titik akhir pengiriman tetap privat untuk dirinya sendiri dan tertutup jika gagal pada browser yang tidak mengekspos aktivasi pengguna, sehingga kode widget tidak dapat melewati pemeriksaan tersebut.
- Otoritas prompt hanya dimiliki oleh dokumen widget asli. Jembatan tepercaya menawarkan titik akhir salurannya kepada obrolan sebelum kode widget dapat berjalan atau menavigasikan frame, obrolan hanya menerima penawaran pertama tersebut, dan saluran berakhir bersama dokumen saat navigasi. URL penyematan yang diizinkan secara eksternal tidak pernah diterima.
- Frame widget harus terlihat dalam transkrip obrolan dan memiliki fokus — sinyal tambahan yang diamati host bahwa pengguna benar-benar sedang berinteraksi dengan widget ini.
- Teks tidak boleh kosong setelah spasi di awal dan akhir dihapus dan panjangnya maksimal 4.000 karakter.
- Prompt yang diawali dengan `/` ditolak, sehingga kode widget tidak dapat memicu perintah obrolan seperti `/approve` atau `/stop`.
- Setiap dokumen widget dapat mengirim maksimal 10 prompt per menit bergulir; prompt yang melebihi batas dibuang tanpa pemberitahuan.

Prompt yang diterima muncul dalam transkrip sebagai pesan pengguna biasa dan memulai giliran agen normal dalam sesi yang memiliki widget tersebut. Tidak ada saluran umpan balik ke widget: prompt yang dibuang gagal tanpa pemberitahuan, dan widget tidak dapat membaca balasan agen.

## Keamanan dan penyimpanan

Dokumen widget menggunakan Content Security Policy yang ketat. Gaya dan skrip inline diizinkan, sedangkan pengambilan dan pemuatan sumber daya eksternal diblokir. Simpan semua markup, gaya, skrip, dan data gambar di dalam `widget_code`.

Iframe Control UI selalu tidak menyertakan `allow-same-origin`, bahkan ketika mode penyematan global adalah `trusted`, sehingga skrip widget tidak dapat membaca origin aplikasi induk. Klien native menggunakan tampilan web terisolasi dan nonpersisten serta memblokir navigasi keluar dari widget yang di-host. Host dokumen inti juga menyajikan widget dengan header respons `Content-Security-Policy: sandbox allow-scripts`, sehingga rendering langsung tetap menjalankan widget dalam origin buram, bukan origin aplikasi. Hanya render kode widget yang bersedia Anda jalankan dalam frame terisolasi tersebut.

Iframe juga mengikuti [`gateway.controlUi.embedSandbox`](/id/web/control-ui#hosted-embeds). Tingkat default `scripts` mendukung widget interaktif sekaligus mempertahankan isolasi origin.

Canvas menyimpan maksimal 32 widget per sesi (atau per agen jika sesi tidak tersedia). Membuat widget lain akan menghapus dokumen tertua dalam cakupan tersebut.

## Terkait

- [Penyematan yang di-host Control UI](/id/web/control-ui#hosted-embeds)
- [Discord Activities](/channels/discord-activities)
- [Kontrol node Canvas](/id/plugins/reference/canvas)
- [Kapabilitas klien protokol Gateway](/id/gateway/protocol#client-capabilities)
