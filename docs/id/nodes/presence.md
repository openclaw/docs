---
read_when:
    - Anda ingin OpenClaw mengidentifikasi Mac yang aktif
    - Anda sedang men-debug aktivitas input terakhir atau pemilihan node aktif
    - Anda ingin memahami perutean notifikasi koneksi node
summary: Deteksi Mac yang paling baru Anda gunakan dan arahkan peringatan node ke sana
title: Keberadaan komputer aktif
x-i18n:
    generated_at: "2026-07-22T01:41:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3f1d1d0e98b1f3b7478cf80696dc693677b57897b07260cce30938e9187c314
    source_path: nodes/presence.md
    workflow: 16
---

Kehadiran komputer aktif memberi tahu Gateway tentang node macOS terhubung yang menerima
input fisik mouse atau papan ketik terbaru. OpenClaw menggunakan sinyal tersebut untuk
menandai satu Mac sebagai `active`, memberikan petunjuk node aktif yang stabil kepada agen, dan merutekan
peringatan koneksi node ke komputer tempat Anda kemungkinan besar berada.

Ini terpisah dari [kehadiran sistem](/id/concepts/presence), yaitu daftar langsung
klien Gateway, dan dari beacon `node.presence.alive` yang persisten, yang
mencatat kapan node seluler terakhir aktif tanpa menganggapnya terhubung.

## Persyaratan

- Aplikasi OpenClaw macOS telah dipasangkan dan terhubung dalam mode node.
- **Settings -> Permissions -> Active computer detection** diaktifkan. Fitur ini dinonaktifkan secara default.
- Izin **Accessibility** diberikan kepada aplikasi OpenClaw yang ditandatangani.
- Untuk peringatan koneksi, izin **Notifications** juga diberikan dan
  node Mac mengekspos `system.notify`.

Pelaporan aktivitas saat ini diimplementasikan oleh node macOS native. Host node
iOS, Android, watchOS, dan headless dapat melaporkan status terakhir terlihat saat terhubung atau di latar belakang,
tetapi tidak bersaing untuk mendapatkan penetapan sebagai komputer aktif.

## Memeriksa komputer aktif

1. Di aplikasi macOS, buka **Settings -> Permissions**, aktifkan
   **Active computer detection**, lalu berikan izin **Accessibility** di macOS System Settings.
2. Pastikan node Mac terhubung:

   ```bash
   openclaw nodes status --connected
   ```

3. Gerakkan mouse atau tekan tombol pada Mac tersebut, lalu jalankan:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

Mac terbaru yang memenuhi syarat ditandai sebagai `active`. Output status menampilkan usia input
terakhirnya; `describe` mengekspos `active`, `lastActiveAtMs`, dan `presenceUpdatedAtMs`.
Aktivitas sengaja digabungkan, sehingga tampilan mungkin memerlukan waktu hingga sekitar 15
detik untuk mencerminkan input lain setelah laporan terbaru.

## Cara aktivitas menjadi kehadiran

Pelapor macOS mengambil sampel jam idle sistem HID setiap dua detik. Pelapor
mengirim satu laporan saat koneksi node siap, lalu melaporkan aktivitas fisik yang lebih baru
tidak lebih dari sekali setiap 15 detik. Saat idle, pelapor mengirim keepalive
setiap tiga menit. Durasi idle dibatasi hingga 30 hari agar sampel yang sangat lama
tidak bergeser ke depan dan secara keliru menjadi komputer terbaru.

Menonaktifkan **Active computer detection** menghentikan pengambilan sampel dan mengirim peristiwa
penghapusan terautentikasi melalui koneksi node saat ini. Gateway segera menghapus
stempel waktu aktivitas Mac tersebut yang tersimpan dan menghitung ulang komputer aktif;
kemampuan node lainnya dan pekerjaan yang sedang berlangsung tetap terhubung. Jika Gateway yang terhubung
berasal dari versi sebelum tindakan penghapusan ini, node Mac akan terhubung kembali satu kali agar pembersihan saat
pemutusan koneksi dapat menghapus aktivitas yang tersimpan.

Gateway hanya menerima aktivitas jika semua kondisi berikut terpenuhi:

- peristiwa tersebut termasuk dalam koneksi terautentikasi saat ini untuk id node tersebut;
- node memiliki izin `accessibility: true` yang efektif;
- payload berisi nilai bilangan bulat terbatas `idleSeconds`.

Gateway mengurangi `idleSeconds` dari waktu pengamatannya sendiri untuk memperoleh
`lastActiveAtMs`. Gateway tidak pernah memercayai stempel waktu jam dinding yang diberikan node. Di antara
Mac terhubung yang memenuhi syarat, `lastActiveAtMs` terbaru yang dipilih; jika seri, pembaruan
kehadiran terbaru digunakan.

Kehadiran bersifat lokal bagi proses dan terikat pada koneksi. Memutuskan
sesi saat ini, menggantinya dengan sesi lain yang menggunakan id node yang sama, atau mencabut
Accessibility akan menghapus status aktivitas node tersebut dan menghitung ulang Mac aktif.

## Privasi dan konteks model

Berbagi aktivitas dinonaktifkan secara default dan terpisah dari pemberian izin Accessibility
yang digunakan untuk otomatisasi UI. OpenClaw mengirim durasi idle, bukan konten input. OpenClaw tidak mengirim nilai tombol,
koordinat mouse, nama aplikasi, judul jendela, atau peristiwa input mentah.
Pelapor macOS membaca status HID perangkat keras, sehingga peristiwa kontrol komputer
sintetis tidak membuat Mac otomatis tampak sebagai komputer yang Anda gunakan secara
fisik.

Aktivitas berkelanjutan tidak membuat peristiwa sistem yang ditujukan kepada model. Baris
runtime dinamis hanya berisi id node terautentikasi:

```text
active_node=<node-id>
```

Stempel waktu persis dan nama tampilan yang dikendalikan node tidak disertakan dalam prompt untuk
menghindari injeksi prompt dan perubahan cache. Saat agen memerlukan detail terkini,
alat `nodes` dapat membaca `node.list` atau `node.describe` sebagai gantinya.

## Cara peringatan koneksi dirutekan

Setelah node menyelesaikan handshake Gateway pertamanya yang berhasil setelah disetujui,
OpenClaw menunggu 750 milidetik agar Mac yang terhubung dapat mengirim sampel
aktivitas pertamanya. OpenClaw kemudian mencoba Mac terhubung yang mendukung notifikasi dengan
aktivitas terbaru.

- Jika pengiriman utama berhasil, tidak ada Mac lain yang menerima peringatan.
- Jika tidak ada Mac aktif yang tersedia atau pengiriman utama gagal, OpenClaw menunggu lima
  detik dan mencoba setiap Mac terhubung lainnya yang mengekspos `system.notify`.
- Koneksi ulang berikutnya tidak menghasilkan pemberitahuan. Gateway mencatat koneksi yang berhasil
  dalam metadata pemasangan, sehingga memulai ulang Gateway tidak memutar ulang peringatan untuk setiap
  node yang sebelumnya terhubung.

Peringatan terikat pada identitas node terautentikasi. Sesi pengganti untuk
node yang sama mengambil alih peringatan koneksi pertama yang tertunda; jika node tersebut tidak
lagi terhubung saat pengiriman dijalankan, peringatan dibatalkan.

## Pemecahan masalah

| Gejala                                    | Pemeriksaan                                                                                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tidak ada baris yang ditandai `active`    | Pastikan deteksi komputer aktif diaktifkan, node macOS native terhubung, dan `openclaw nodes describe --node <id>` menampilkan `permissions.accessibility: true`. |
| Mac yang salah tetap aktif                | Gunakan Mac tersebut secara fisik, tunggu hingga jendela penggabungan selesai, lalu jalankan kembali `openclaw nodes status`. Tindakan kontrol komputer sintetis tidak dihitung. |
| Data input terakhir menghilang            | Periksa apakah Mac terputus, sesi nodenya diganti, atau Accessibility dicabut. Setiap kondisi sengaja menghapus aktivitas.                                             |
| Peringatan muncul di beberapa Mac         | Pengiriman utama tidak tersedia atau gagal, sehingga fallback tertunda dijalankan. Pastikan Mac aktif terhubung, mengizinkan notifikasi, dan mengekspos `system.notify`. |
| Agen tidak menyebutkan Mac aktif          | Mulai giliran baru setelah aktivitas berubah. Petunjuk runtime bersifat stabil dan ringkas; gunakan alat `nodes` untuk metadata terkini yang persis.          |

Untuk pemulihan TCC, lihat [izin macOS](/id/platforms/mac/permissions). Untuk kegagalan
koneksi dan perintah node, lihat [Pemecahan masalah Node](/id/nodes/troubleshooting).

## Terkait

- [Node](/id/nodes)
- [CLI Node](/id/cli/nodes)
- [Kehadiran sistem](/id/concepts/presence)
- [Protokol Gateway](/id/gateway/protocol#presence)
- [Aplikasi macOS](/id/platforms/macos)
