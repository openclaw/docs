---
read_when:
    - Menginstal aplikasi macOS
    - Menentukan antara mode Gateway lokal dan jarak jauh di macOS
    - Mencari unduhan rilis aplikasi macOS
summary: Instal dan gunakan aplikasi bilah menu OpenClaw untuk macOS
title: aplikasi macOS
x-i18n:
    generated_at: "2026-07-19T05:10:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b319d72bcbffcf91b6bc012d352c2cf647abd66e08ab0146cf98f5edfae3bca1
    source_path: platforms/macos.md
    workflow: 16
---

Aplikasi macOS adalah **pendamping bilah menu** OpenClaw: UI baki native, permintaan
izin macOS, notifikasi, WebChat, input suara, Canvas, dan
alat node yang dihosting Mac seperti `system.run`.

Gunakan **Quick Chat** untuk penulisan pesan sesi utama bergaya Spotlight tanpa membuka jendela penuh. Tekan Option-Space (⌥Space) secara default, pilih dari menu bilah menu, atau rekam pintasan lain di **Settings → General**.

Hanya memerlukan CLI dan Gateway? Mulailah dengan [Memulai](/id/start/getting-started).

## Unduh

Dapatkan build aplikasi macOS dari [rilis GitHub OpenClaw](https://github.com/openclaw/openclaw/releases).
Jika sebuah rilis menyertakan aset aplikasi macOS, cari:

- `OpenClaw-<version>.dmg` (disarankan)
- `OpenClaw-<version>.zip`

Beberapa rilis hanya menyertakan aset CLI, bukti, atau Windows. Jika rilis terbaru
tidak memiliki aset aplikasi macOS, gunakan rilis terbaru yang memilikinya, atau lakukan build dari sumber dengan
[penyiapan pengembangan macOS](/id/platforms/mac/dev-setup).

## Penggunaan pertama

1. Instal dan luncurkan **OpenClaw.app**.
2. Pilih **This Mac** untuk Gateway lokal, atau hubungkan ke Gateway jarak jauh.
3. Tunggu sementara aplikasi menginstal runtime CLI yang sesuai. Dalam mode lokal, aplikasi juga
   menginstal dan memulai Gateway.
4. Siapkan inferensi dengan pemeriksaan model aktif. Setelah pemeriksaan berhasil, OpenClaw
   menangani penyiapan yang tersisa.
5. Selesaikan daftar periksa izin macOS dan kirim pesan pengujian orientasi.

Jika aplikasi menjangkau Gateway yang sudah ada dan agen default-nya memiliki
model yang telah dikonfigurasi, aplikasi menganggap Gateway tersebut sudah disiapkan, melewati orientasi penyedia dan
OpenClaw, lalu membuka dasbor. Jika Gateway tidak dapat terhubung atau
agen default-nya tidak memiliki model, orientasi inferensi tetap tersedia untuk
pemulihan.

Untuk jalur penyiapan CLI/Gateway, gunakan [Memulai](/id/start/getting-started).
Untuk pemulihan izin, gunakan [izin macOS](/id/platforms/mac/permissions).

## Pembaruan

Kartu pembaruan dasbor menyebutkan apa yang akan diperbarui oleh aplikasi:

- **Perbarui aplikasi Mac + Gateway** berarti aplikasi bertanda tangan memiliki Gateway
  launchd lokal. Sparkle memperbarui aplikasi terlebih dahulu; setelah diluncurkan ulang, aplikasi secara otomatis
  memperbarui dan memulai ulang Gateway pada versi yang sesuai, lalu memverifikasi
  koneksi.
- **Perbarui Gateway** berarti aplikasi terhubung ke Gateway jarak jauh, Gateway lokal yang
  dikelola secara manual, atau instalasi lain yang tidak dimiliki aplikasi. Tombol tersebut
  menjalankan alur pembaruan normal Gateway itu alih-alih mengubah aplikasi Mac.

Pembaruan terkoordinasi yang gagal tetap berada di jendela bergaya penyiapan dengan tindakan untuk mencoba kembali,
[panduan pembaruan](/id/install/updating), dan Discord. Perbaikan otomatis tidak pernah
menurunkan versi Gateway yang lebih baru atau menimpa pin saluran `extended-stable`.

Setelah pembaruan berhasil, aplikasi menemukan sesi langsung tingkat teratas yang
terakhir digunakan manusia dan memberikan peristiwa pembaruan satu kali kepada agen tersebut. Aktivitas Heartbeat
dan Cron tidak memengaruhi pilihan ini. Agen kemudian dapat menyambut Anda kembali
dari percakapan yang kemungkinan besar sedang Anda gunakan. Dalam mode jarak jauh, aplikasi
hanya memperbarui runtime node Mac lokal dan melewati notifikasi ketika
Gateway jarak jauh lebih lama daripada aplikasi.

Sparkle mengikuti pengaturan `update.channel` Gateway. `beta` dan `dev` memilih untuk menggunakan
build aplikasi beta; `stable`, `extended-stable`, serta nilai yang tidak ada atau tidak dikenal
tetap menggunakan build aplikasi stabil.

## Membuka tautan dasbor

Di dasbor tersemat aplikasi macOS, mengeklik tautan web eksternal akan membukanya di bilah sisi peramban yang dapat diubah ukurannya dengan lebar setengah jendela, sementara navigasi dasbor tetap terlihat. Seret pemisah untuk memilih lebar lain; aplikasi akan mengingatnya. Setiap tautan terbuka di tabnya sendiri, bilah tab muncul saat beberapa halaman terbuka, dan mengeklik tautan yang sama lagi akan menggunakan kembali tab yang sudah ada. Seret tab untuk mengubah urutannya, tutup dengan tombol tutup tab atau klik tengah, dan klik kanan tab untuk **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab**, dan **Close Other Tabs**. Kontrol mundur/maju pada bilah judul jendela dan gestur usap trackpad menavigasi riwayat dasbor; kontrol mundur/maju milik bilah sisi menavigasi riwayat tab aktif. Bilah sisi juga memiliki kontrol muat ulang, buka-di-peramban-bawaan, dan tutup.

Kontrol bilah judul mengikuti bilah sisi aplikasi: saat bilah sisi diperluas, tombol mundur/maju berada di tepi kanannya di samping tombol pengalih bilah sisi; saat bilah sisi diciutkan, tombol tersebut memberi tempat bagi tombol pencarian (membuka palet perintah) dan tombol sesi baru.

Klik kanan tautan eksternal untuk memilih **Open in Sidebar**, **Open in Default Browser**, atau **Copy Link**. Klik dengan tombol pengubah dan tautan jendela baru yang diaktifkan pengguna dari dasbor tetap terbuka di peramban bawaan; tautan jendela baru di dalam bilah sisi terbuka sebagai tab bilah sisi baru. Halaman Control UI biasa yang dihosting peramban tetap menggunakan perilaku tautan dan menu konteks normal peramban.

## Mengimpor login peramban

Saat bilah sisi peramban dibuka untuk pertama kalinya ketika aplikasi berjalan dengan Gateway lokal, dasbor menampilkan banner yang dapat ditutup jika profil keluarga Chrome dengan cookie tersedia di Mac. Banner tersebut menawarkan penyalinan cookie itu ke profil terkelola terisolasi yang digunakan agen untuk menjelajah. Pilih profil melalui kontrol **Import** (Touch ID mungkin diperlukan); progres dan jumlah cookie yang diimpor ditampilkan secara langsung, dan hanya cookie yang disalin — kata sandi tidak pernah meninggalkan peramban sumber. Menutup banner akan mencatat pilihan tersebut; **Settings → General → Browser login → Import…** menawarkannya kembali kapan saja. Lihat [Peramban](/id/cli/browser) untuk alur impor yang mendasarinya dan gerbang `browser.allowSystemProfileImport`.

## Memilih mode Gateway

| Mode   | Gunakan ketika                                                                  | Halaman detail                                      |
| ------ | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| Lokal  | Mac ini harus menjalankan Gateway dan menjaganya tetap aktif dengan launchd.    | [Gateway di macOS](/id/platforms/mac/bundled-gateway)  |
| Jarak jauh | Host lain menjalankan Gateway; Mac ini mengendalikannya melalui SSH, LAN, atau Tailnet. | [Kendali jarak jauh](/id/platforms/mac/remote)     |

Kedua mode memerlukan CLI `openclaw` yang terinstal karena aplikasi menggunakan kembali runtime
host node miliknya. Pada Mac baru, aplikasi menginstal CLI yang sesuai secara otomatis; mode
lokal kemudian memulai wisaya Gateway, sedangkan mode jarak jauh terhubung ke Gateway
yang dipilih tanpa memulai Gateway lokal kedua.
Lihat [Gateway di macOS](/id/platforms/mac/bundled-gateway) untuk pemulihan manual.

## Yang dikelola aplikasi

- Status bilah menu, notifikasi, kesehatan, WebChat, dan bilah Quick Chat mengambang.
- Permintaan izin macOS untuk layar, mikrofon, ucapan, otomatisasi, dan aksesibilitas.
- Satu node Mac yang menggabungkan Canvas native, pengambilan kamera/layar, notifikasi,
  lokasi, dan kendali komputer dengan perintah sistem, peramban,
  plugin, skill, dan MCP dari host node CLI.
- Permintaan persetujuan eksekusi untuk perintah yang dihosting di Mac.
- Eksekusi dalam konteks aplikasi untuk perintah shell yang disetujui, dengan mempertahankan
  atribusi izin macOS aplikasi sementara runtime CLI mengelola kebijakan node bersama.
- Terowongan SSH mode jarak jauh atau koneksi langsung ke Gateway.

Di Control UI tersemat, **Settings → Notifications** menampilkan izin notifikasi native
aplikasi, bukan push peramban, karena aplikasi mengirimkan notifikasi secara native.

Aplikasi **tidak** menggantikan dokumentasi Gateway atau CLI umum. Konfigurasi Gateway,
penyedia, plugin, kanal, alat, dan keamanan dijelaskan dalam dokumentasinya
masing-masing.

## Halaman detail macOS

| Tugas                                    | Bacaan                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Menginstal atau men-debug layanan CLI/Gateway | [Gateway di macOS](/id/platforms/mac/bundled-gateway)                                     |
| Menjauhkan status dari folder yang disinkronkan ke cloud | [Gateway di macOS](/id/platforms/mac/bundled-gateway#state-directory-on-macos)     |
| Men-debug penemuan dan konektivitas aplikasi | [Gateway di macOS](/id/platforms/mac/bundled-gateway#debug-app-connectivity)              |
| Memahami perilaku launchd                | [Siklus hidup Gateway](/id/platforms/mac/child-process)                                        |
| Memperbaiki masalah izin atau penandatanganan/TCC | [Izin macOS](/id/platforms/mac/permissions)                                           |
| Mendeteksi Mac yang terakhir digunakan   | [Kehadiran komputer aktif](/id/nodes/presence)                                                 |
| Terhubung ke Gateway jarak jauh          | [Kendali jarak jauh](/id/platforms/mac/remote)                                                 |
| Membaca status bilah menu dan pemeriksaan kesehatan | [Bilah menu](/id/platforms/mac/menu-bar), [Pemeriksaan kesehatan](/id/platforms/mac/health) |
| Menggunakan UI obrolan tersemat          | [WebChat](/id/platforms/mac/webchat)                                                           |
| Menggunakan aktivasi suara atau tekan-untuk-bicara | [Aktivasi suara](/id/platforms/mac/voicewake)                                         |
| Menggunakan Canvas dan tautan dalam Canvas | [Canvas](/id/platforms/mac/canvas)                                                           |
| Menghosting PeekabooBridge untuk otomatisasi UI | [Jembatan Peekaboo](/id/platforms/mac/peekaboo)                                        |
| Mengonfigurasi persetujuan perintah      | [Persetujuan eksekusi](/id/tools/exec-approvals), [detail lanjutan](/id/tools/exec-approvals-advanced) |
| Memeriksa perintah node Mac dan IPC aplikasi | [IPC macOS](/id/platforms/mac/xpc)                                                         |
| Mengambil log                            | [Pencatatan macOS](/id/platforms/mac/logging)                                                  |
| Membangun dari sumber                    | [Penyiapan pengembangan macOS](/id/platforms/mac/dev-setup)                                    |

## Terkait

- [Platform](/id/platforms)
- [Memulai](/id/start/getting-started)
- [Gateway](/id/gateway)
- [Persetujuan eksekusi](/id/tools/exec-approvals)
