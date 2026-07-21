---
read_when:
    - Menggunakan atau menjelaskan dasbor sesi di UI Kontrol
    - Menentukan tindakan yang dapat dilakukan agen pada sebuah papan dan tindakan yang memerlukan izin operator
summary: 'Dasbor sesi: widget, papan, tab yang dibuat agen, dan obrolan yang ditambatkan'
title: Dasbor Sesi
x-i18n:
    generated_at: "2026-07-21T12:46:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3babbc859e261aa959740ea778b44fdc1a07bce8ce7628cbabcfbc5fa207a0ce
    source_path: web/dashboards.md
    workflow: 16
---

Setiap utas di UI Kontrol memiliki dua sisi: percakapan yang Anda kenal, dan
**dasbor** — kisi widget aktif yang dibuat agen untuk Anda. Utas tanpa
widget hanyalah percakapan. Begitu sebuah widget disematkan, tombol alih **Percakapan | Dasbor**
muncul di header, dan dasbor menjadi tampilan utama dengan
percakapan Anda ditambatkan di sampingnya.

Tidak ada yang perlu disiapkan dan tidak ada aplikasi terpisah yang perlu dikonfigurasi: dasbor adalah
fitur inti, dimiliki oleh utas, disimpan bersama agen, dan tetap bertahan setelah
`/new` dan `/reset` (konteks percakapan dihapus; papan tetap ada).

## Buat dasbor dengan meminta

Minta agen menampilkan apa yang ingin Anda lihat:

> Buat widget bernama revenue-graph: diagram batang interaktif untuk pendapatan
> bulanan. Tambahkan tombol "Batang" dan "Tren" untuk beralih tampilan. Sematkan ke
> dasbor saya.

Agen terlebih dahulu merender widget sebaris dalam percakapan, sehingga Anda dapat melihatnya
sebelum widget ditempatkan di mana pun. Dari sana:

- **Anda menyematkannya**: arahkan penunjuk ke widget sebaris dan pilih **Sematkan ke dasbor**.
- **Atau agen menyematkannya** secara langsung saat Anda meminta, lalu memperbaruinya nanti berdasarkan
  nama — widget memiliki nama yang stabil, sehingga "perbarui revenue-graph dengan
  angka bulan Juni" mengganti konten di tempatnya sementara papan tetap pada posisinya.

Widget adalah aplikasi kecil mandiri (HTML/JS/SVG dalam sandbox yang ketat). Tombol
dan pengalih tampilan di dalam widget langsung berfungsi — mengganti tampilan diagram
tidak pernah memerlukan agen.

## Papan

- **Kisi fleksibel.** Seret widget melalui pegangannya; semuanya mengalir ulang dan
  dipadatkan secara otomatis. Ubah ukuran melalui pegangan atau pilih preset ukuran (kecil,
  sedang, besar, ekstra besar) dari menu widget. Tidak ada yang menempatkan piksel —
  bukan Anda, bukan pula agen.
- **Tab.** Sebuah papan dapat memiliki beberapa halaman — misalnya, tab ringkasan dan
  tab terfokus dengan satu widget besar. Setiap tab mengingat posisi tambatan
  percakapannya sendiri.
- **Percakapan tertambat.** Pada sisi dasbor, percakapan Anda ditambatkan ke
  kiri, kanan, atau bawah, dapat diubah ukurannya seperti bilah samping, dan dapat disembunyikan
  sepenuhnya — agen tetap dapat mendengar Anda saat Anda menampilkannya kembali.
- **Kemampuan agen yang setara.** Semua yang dapat Anda lakukan juga dapat dilakukan agen dengan alat
  `dashboard` miliknya: menambah, memperbarui, memindahkan, mengubah ukuran, dan menghapus widget, mengelola
  tab, mengganti tab yang terlihat, serta memindahkan atau menyembunyikan tambatan percakapan. Minta "letakkan
  percakapan di sebelah kiri dan tampilkan tab keuangan", lalu lihat perubahan tersebut terjadi.

## Yang boleh dilakukan widget

Widget yang hanya merender tidak memerlukan persetujuan — widget langsung muncul, persis
seperti widget percakapan sebaris, dan akses jaringannya dinonaktifkan sepenuhnya.

Widget yang menginginkan **akses** harus mendeklarasikannya, dan Anda memberikannya sekali per widget
dengan satu ketukan:

- **Jaringan** (`net`): mengambil data dari origin HTTPS yang dideklarasikan secara langsung dari sandbox —
  misalnya, kartu cuaca yang menyegarkan datanya sendiri dari API.
- **Data Gateway** (`data`): umpan hanya-baca seperti sesi, penggunaan, atau status
  cron, yang diambil oleh Gateway — widget tidak pernah menyimpan token Anda.
- **Otomatisasi** (`actions`): memicu tugas cron tertentu, sehingga tombol dapat menjalankan
  tugas nyata (yang mungkin menggunakan model lebih kecil) tanpa membangunkan percakapan
  utama Anda.
- **Prompt** (`prompt`): mengirim pesan ke utas Anda tanpa konfirmasi setiap klik
  yang diwajibkan untuk widget yang belum disetujui.

Plugin yang diaktifkan dapat menambahkan umpan hanya-baca dan tindakan bernama miliknya sendiri ke daftar kemampuan ini; menonaktifkan Plugin akan menghapus integrasi tersebut.

Izin terikat pada byte dan revisi persis widget yang Anda tinjau. Jika
agen mengubah widget dan meminta _lebih banyak_ daripada yang Anda setujui, statusnya kembali
menjadi tertunda; menyegarkan konten dengan izin yang sama akan mempertahankan pemberian izin.
Interaksi widget yang perlu diketahui agen (filter yang Anda klik, tampilan yang
Anda ganti) diteruskan secara diam-diam sebagai pemberitahuan sesi — agen tetap mendapat informasi tanpa
diinterupsi.

## Aplikasi MCP di papan

Jika Gateway Anda memiliki server MCP yang dikonfigurasi, aplikasi MCP interaktif yang muncul
dalam percakapan dapat disematkan seperti widget lainnya. Aplikasi yang disematkan kembali aktif di
papan dengan sesi baru; secara default aplikasi tersebut hanya untuk tampilan, dan memberikan
alat server yang dideklarasikan kepada widget membuatnya sepenuhnya interaktif — dengan persetujuan
satu ketukan yang terikat pada revisi, sama seperti yang lainnya.

## Perlu diketahui

- Mengatur ulang utas yang memiliki papan akan meminta konfirmasi dan mempertahankan
  papan tersebut.
- Menghapus utas akan menghapus papannya.
- Papan berada di Gateway Anda (dalam basis data agen pemilik) dan muncul di
  setiap perangkat yang Anda gunakan untuk terhubung.
- Model keamanan, detail penyimpanan, dan alasan desain tersedia di
  [Arsitektur Dasbor](/id/web/dashboard-architecture), termasuk kompromi
  sandbox yang didokumentasikan.
