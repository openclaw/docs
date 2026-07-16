---
read_when:
    - Menginstal aplikasi macOS
    - Memilih antara mode Gateway lokal dan jarak jauh di macOS
    - Mencari unduhan rilis aplikasi macOS
summary: Instal dan gunakan aplikasi bilah menu OpenClaw untuk macOS
title: aplikasi macOS
x-i18n:
    generated_at: "2026-07-16T18:18:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

Aplikasi macOS adalah **pendamping bilah menu** OpenClaw: UI baki native, permintaan
izin macOS, notifikasi, WebChat, input suara, Canvas, dan alat Node
yang dihosting Mac seperti `system.run`.

Hanya memerlukan CLI dan Gateway? Mulai dengan [Memulai](/id/start/getting-started).

## Unduh

Dapatkan build aplikasi macOS dari [rilis GitHub OpenClaw](https://github.com/openclaw/openclaw/releases).
Jika suatu rilis menyertakan aset aplikasi macOS, cari:

- `OpenClaw-<version>.dmg` (disarankan)
- `OpenClaw-<version>.zip`

Beberapa rilis hanya menyertakan aset CLI, bukti, atau Windows. Jika rilis terbaru
tidak memiliki aset aplikasi macOS, gunakan rilis terbaru yang memilikinya, atau build dari sumber dengan
[penyiapan pengembangan macOS](/id/platforms/mac/dev-setup).

## Penggunaan pertama

1. Instal dan jalankan **OpenClaw.app**.
2. Pilih **This Mac** untuk Gateway lokal, atau hubungkan ke Gateway jarak jauh.
3. Tunggu sementara aplikasi menginstal runtime CLI yang sesuai. Dalam mode lokal, aplikasi juga
   menginstal dan memulai Gateway.
4. Buat koneksi inferensi dengan pemeriksaan model aktif. Setelah pemeriksaan berhasil, OpenClaw
   menangani sisa penyiapan.
5. Selesaikan daftar periksa izin macOS dan kirim pesan pengujian orientasi.

Jika aplikasi mencapai Gateway yang sudah ada dan agen default-nya memiliki model yang
telah dikonfigurasi, aplikasi menganggap Gateway tersebut sudah disiapkan, melewati orientasi penyedia dan
OpenClaw, lalu membuka dasbor. Jika Gateway tidak dapat terhubung atau
agen default-nya tidak memiliki model, orientasi inferensi tetap tersedia untuk
pemulihan.

Untuk jalur penyiapan CLI/Gateway, gunakan [Memulai](/id/start/getting-started).
Untuk pemulihan izin, gunakan [izin macOS](/id/platforms/mac/permissions).

## Pembaruan

Kartu pembaruan dasbor menyebutkan apa yang akan diperbarui oleh aplikasi:

- **Perbarui aplikasi Mac + Gateway** berarti aplikasi bertanda tangan memiliki Gateway
  launchd lokal. Sparkle memperbarui aplikasi terlebih dahulu; setelah dijalankan ulang, aplikasi secara otomatis
  memperbarui dan memulai ulang Gateway ke versi yang sesuai, lalu memverifikasi
  koneksi.
- **Perbarui Gateway** berarti aplikasi terhubung ke Gateway jarak jauh, Gateway lokal
  yang dikelola secara manual, atau instalasi lain yang tidak dimiliki aplikasi. Tombol tersebut
  menjalankan alur pembaruan normal Gateway itu alih-alih mengubah aplikasi Mac.

Pembaruan terkoordinasi yang gagal tetap berada di jendela bergaya penyiapan dengan tindakan coba lagi,
[panduan pembaruan](/id/install/updating), dan Discord. Perbaikan otomatis tidak pernah
menurunkan versi Gateway yang lebih baru atau mengesampingkan pin saluran `extended-stable`.

Setelah pembaruan berhasil, aplikasi menemukan sesi langsung tingkat teratas yang
paling baru digunakan manusia dan memberikan peristiwa pembaruan satu kali kepada agen tersebut. Aktivitas Heartbeat
dan Cron tidak memengaruhi pilihan ini. Agen kemudian dapat menyambut Anda kembali
dari percakapan yang kemungkinan besar sedang Anda gunakan. Dalam mode jarak jauh, aplikasi
hanya memperbarui runtime Node Mac lokal dan melewati notifikasi saat
Gateway jarak jauh lebih lama daripada aplikasi.

Sparkle mengikuti pengaturan `update.channel` Gateway. `beta` dan `dev` mengaktifkan
build aplikasi beta; `stable`, `extended-stable`, serta nilai yang tidak ada atau tidak dikenal
tetap menggunakan build aplikasi stabil.

## Membuka tautan dasbor

Di dasbor tertanam aplikasi macOS, mengeklik tautan web eksternal akan membukanya di bilah sisi peramban yang dapat diubah ukurannya, dengan lebar setengah jendela sambil tetap menampilkan navigasi dasbor. Seret pembatas untuk memilih lebar lain; aplikasi akan mengingatnya. Setiap tautan terbuka di tab tersendiri, bilah tab muncul saat beberapa halaman terbuka, dan mengeklik kembali tautan yang sama akan menggunakan ulang tab yang sudah ada. Seret tab untuk mengurutkannya ulang, tutup dengan tombol tutup tab atau klik tengah, dan klik kanan tab untuk **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab**, dan **Close Other Tabs**. Kontrol kembali/maju pada bilah judul jendela dan gestur geser trackpad menavigasi riwayat dasbor; kontrol kembali/maju milik bilah sisi menavigasi riwayat tab aktif. Bilah sisi juga memiliki kontrol muat ulang, buka di peramban default, dan tutup.

Kontrol bilah judul mengikuti bilah sisi aplikasi: saat bilah sisi diperluas, kontrol kembali/maju berada di tepi kanannya di samping tombol alih bilah sisi; saat bilah sisi diciutkan, kontrol tersebut memberi tempat bagi tombol pencarian (membuka palet perintah) dan tombol sesi baru.

Klik kanan tautan eksternal untuk memilih **Open in Sidebar**, **Open in Default Browser**, atau **Copy Link**. Klik dengan tombol pengubah dan tautan jendela baru yang diaktifkan pengguna dari dasbor tetap terbuka di peramban default; tautan jendela baru di dalam bilah sisi terbuka sebagai tab bilah sisi baru. Halaman Control UI yang dihosting peramban biasa mempertahankan perilaku tautan dan menu konteks normal peramban.

## Mengimpor login peramban

Saat bilah sisi peramban pertama kali dibuka ketika aplikasi berjalan dengan Gateway lokal, dasbor menampilkan spanduk yang dapat ditutup jika profil keluarga Chrome dengan cookie tersedia di Mac. Spanduk tersebut menawarkan penyalinan cookie ke profil terkelola terisolasi yang digunakan agen untuk menjelajah. Pilih profil dari kontrol **Import** (Touch ID mungkin diperlukan); progres dan jumlah cookie yang diimpor muncul di baris yang sama, dan hanya cookie yang disalin — kata sandi tidak pernah meninggalkan peramban sumber. Menutup spanduk akan merekam pilihan tersebut; **Settings → General → Browser login → Import…** menawarkannya kembali kapan saja. Lihat [Peramban](/id/cli/browser) untuk alur impor yang mendasarinya dan gerbang `browser.allowSystemProfileImport`.

## Memilih mode Gateway

| Mode       | Gunakan ketika                                                                         | Halaman detail                                      |
| ---------- | -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Lokal      | Mac ini harus menjalankan Gateway dan menjaganya tetap aktif dengan launchd.           | [Gateway di macOS](/id/platforms/mac/bundled-gateway)  |
| Jarak jauh | Host lain menjalankan Gateway; Mac ini mengontrolnya melalui SSH, LAN, atau Tailnet.   | [Kontrol jarak jauh](/id/platforms/mac/remote)          |

Kedua mode memerlukan CLI `openclaw` yang terinstal karena aplikasi menggunakan ulang runtime
host Node-nya. Pada Mac baru, aplikasi secara otomatis menginstal CLI yang sesuai; mode
lokal kemudian memulai wizard Gateway, sedangkan mode jarak jauh terhubung ke Gateway
yang dipilih tanpa memulai Gateway lokal kedua.
Lihat [Gateway di macOS](/id/platforms/mac/bundled-gateway) untuk pemulihan manual.

## Yang dikelola aplikasi

- Status bilah menu, notifikasi, kesehatan, dan WebChat.
- Permintaan izin macOS untuk layar, mikrofon, ucapan, otomatisasi, dan aksesibilitas.
- Satu Node Mac yang menggabungkan Canvas native, pengambilan kamera/layar, notifikasi,
  lokasi, dan kontrol komputer dengan perintah sistem, peramban,
  Plugin, Skills, dan MCP milik host Node CLI.
- Permintaan persetujuan eksekusi untuk perintah yang dihosting Mac.
- Eksekusi dalam konteks aplikasi untuk perintah shell yang disetujui, dengan mempertahankan
  atribusi izin macOS aplikasi sementara runtime CLI mengelola kebijakan Node bersama.
- Terowongan SSH mode jarak jauh atau koneksi Gateway langsung.

Aplikasi ini **tidak** menggantikan dokumentasi Gateway atau CLI umum. Konfigurasi Gateway,
penyedia, Plugin, saluran, alat, dan keamanan berada dalam dokumentasinya
masing-masing.

## Halaman detail macOS

| Tugas                                      | Baca                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Menginstal atau men-debug layanan CLI/Gateway | [Gateway di macOS](/id/platforms/mac/bundled-gateway)                                        |
| Menjauhkan status dari folder tersinkronisasi cloud | [Gateway di macOS](/id/platforms/mac/bundled-gateway#state-directory-on-macos)          |
| Men-debug penemuan dan konektivitas aplikasi | [Gateway di macOS](/id/platforms/mac/bundled-gateway#debug-app-connectivity)                  |
| Memahami perilaku launchd                  | [Siklus hidup Gateway](/id/platforms/mac/child-process)                                         |
| Memperbaiki masalah izin atau penandatanganan/TCC | [izin macOS](/id/platforms/mac/permissions)                                               |
| Mendeteksi Mac yang paling baru digunakan | [Kehadiran komputer aktif](/id/nodes/presence)                                                  |
| Menghubungkan ke Gateway jarak jauh        | [Kontrol jarak jauh](/id/platforms/mac/remote)                                                  |
| Membaca status bilah menu dan pemeriksaan kesehatan | [Bilah menu](/id/platforms/mac/menu-bar), [Pemeriksaan kesehatan](/id/platforms/mac/health) |
| Menggunakan UI obrolan tertanam            | [WebChat](/id/platforms/mac/webchat)                                                            |
| Menggunakan aktivasi suara atau tekan-untuk-bicara | [Aktivasi suara](/id/platforms/mac/voicewake)                                             |
| Menggunakan Canvas dan tautan dalam Canvas | [Canvas](/id/platforms/mac/canvas)                                                              |
| Menghosting PeekabooBridge untuk otomatisasi UI | [Jembatan Peekaboo](/id/platforms/mac/peekaboo)                                            |
| Mengonfigurasi persetujuan perintah        | [Persetujuan eksekusi](/id/tools/exec-approvals), [detail lanjutan](/id/tools/exec-approvals-advanced) |
| Memeriksa perintah Node Mac dan IPC aplikasi | [IPC macOS](/id/platforms/mac/xpc)                                                            |
| Merekam log                                | [Pencatatan macOS](/id/platforms/mac/logging)                                                   |
| Melakukan build dari sumber                | [Penyiapan pengembangan macOS](/id/platforms/mac/dev-setup)                                     |

## Terkait

- [Platform](/id/platforms)
- [Memulai](/id/start/getting-started)
- [Gateway](/id/gateway)
- [Persetujuan eksekusi](/id/tools/exec-approvals)
