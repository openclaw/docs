---
read_when:
    - Anda ingin OpenClaw mengidentifikasi Mac yang aktif
    - Anda sedang men-debug aktivitas input terakhir atau pemilihan node aktif
    - Anda ingin memahami perutean notifikasi koneksi Node
summary: Deteksi Mac yang terakhir Anda gunakan dan arahkan peringatan node ke sana
title: Keberadaan komputer aktif
x-i18n:
    generated_at: "2026-07-16T18:16:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a4ec4607e1e4ef8d989d3c4ece0ee6e0730908a1df76ff52c1898b4307d979b
    source_path: nodes/presence.md
    workflow: 16
---

Kehadiran komputer aktif memberi tahu Gateway node macOS terhubung mana yang menerima
input fisik mouse atau papan ketik terbaru. OpenClaw menggunakan sinyal tersebut untuk
menandai satu Mac sebagai `active`, memberikan petunjuk node aktif yang stabil kepada agen, dan merutekan
peringatan koneksi node ke komputer tempat Anda kemungkinan besar berada.

Ini terpisah dari [kehadiran sistem](/id/concepts/presence), yaitu daftar langsung
klien Gateway, dan dari suar `node.presence.alive` yang persisten, yang
mencatat kapan node seluler terakhir aktif tanpa menganggapnya terhubung.

## Persyaratan

- Aplikasi OpenClaw macOS telah dipasangkan dan terhubung dalam mode node.
- Izin **Accessibility** diberikan kepada aplikasi OpenClaw yang ditandatangani.
- Untuk peringatan koneksi, izin **Notifications** juga diberikan dan
  node Mac menyediakan `system.notify`.

Pelaporan aktivitas saat ini diterapkan oleh node macOS native. Host node iOS,
Android, watchOS, dan tanpa antarmuka dapat melaporkan koneksi atau status
terakhir terlihat di latar belakang, tetapi tidak bersaing untuk penetapan komputer aktif.

## Memeriksa komputer aktif

1. Di aplikasi macOS, buka **Settings -> Permissions** dan berikan
   **Accessibility** di macOS System Settings.
2. Pastikan node Mac terhubung:

   ```bash
   openclaw nodes status --connected
   ```

3. Gerakkan mouse atau tekan tombol pada Mac tersebut, lalu jalankan:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

Mac memenuhi syarat yang paling baru ditandai sebagai `active`. Output status menampilkan usia input
terakhirnya; `describe` menyediakan `active`, `lastActiveAtMs`, dan `presenceUpdatedAtMs`.
Aktivitas sengaja digabungkan, sehingga tampilan mungkin memerlukan waktu hingga sekitar 15
detik untuk mencerminkan input lain setelah laporan terbaru.

## Cara aktivitas menjadi kehadiran

Pelapor macOS mengambil sampel jam idle sistem HID setiap dua detik. Pelapor
mengirim laporan sekali saat koneksi node siap, lalu melaporkan aktivitas fisik
yang lebih baru paling sering sekali setiap 15 detik. Saat idle, pelapor mengirim keepalive
setiap tiga menit. Durasi idle dibatasi hingga 30 hari agar sampel yang sangat lama
tidak bergeser maju dan secara keliru menjadi komputer terbaru.

Gateway menerima aktivitas hanya jika semua kondisi berikut terpenuhi:

- peristiwa tersebut milik koneksi terautentikasi saat ini untuk id node tersebut;
- node memiliki izin `accessibility: true` yang efektif;
- payload berisi nilai bilangan bulat `idleSeconds` yang dibatasi.

Gateway mengurangi `idleSeconds` dari waktu pengamatannya sendiri untuk memperoleh
`lastActiveAtMs`. Gateway tidak pernah memercayai stempel waktu jam dinding yang diberikan node. Di antara
Mac terhubung yang memenuhi syarat, `lastActiveAtMs` terbaru menang; jika seri, pembaruan
kehadiran terbaru digunakan.

Kehadiran bersifat lokal bagi proses dan terikat pada koneksi. Memutuskan
sesi saat ini, menggantinya dengan sesi lain yang menggunakan id node yang sama, atau mencabut
Accessibility akan menghapus status aktivitas node tersebut dan menghitung ulang Mac aktif.

## Privasi dan konteks model

OpenClaw mengirim durasi idle, bukan konten input. OpenClaw tidak mengirim nilai tombol,
koordinat mouse, nama aplikasi, judul jendela, atau peristiwa input mentah. Pelapor
macOS membaca status HID perangkat keras, sehingga peristiwa kontrol komputer sintetis
tidak membuat Mac otomatis tampak sebagai komputer yang Anda gunakan secara fisik.

Aktivitas berkelanjutan tidak membuat peristiwa sistem yang dihadapkan ke model. Baris
runtime dinamis hanya berisi id node terautentikasi:

```text
active_node=<node-id>
```

Stempel waktu yang tepat dan nama tampilan yang dikendalikan node tidak dimasukkan ke prompt untuk
menghindari injeksi prompt dan perubahan cache. Saat agen memerlukan detail terkini,
alat `nodes` dapat membaca `node.list` atau `node.describe` sebagai gantinya.

## Cara peringatan koneksi dirutekan

Setelah node menyelesaikan handshake Gateway, OpenClaw menunggu 750 milidetik agar
Mac yang terhubung dapat mengirimkan sampel aktivitas pertamanya. Kemudian OpenClaw mencoba
Mac terhubung berkemampuan notifikasi dengan aktivitas terbaru.

- Jika pengiriman utama berhasil, tidak ada Mac lain yang menerima peringatan.
- Jika tidak ada Mac aktif yang tersedia atau pengiriman utama gagal, OpenClaw menunggu lima
  detik dan mencoba setiap Mac terhubung lainnya yang menyediakan `system.notify`.
- Peringatan koneksi ulang untuk node yang sama ditekan selama lima menit setelah
  upaya pengiriman aktual, sehingga koneksi ulang yang berulang tidak menghasilkan
  banjir notifikasi.

Peringatan terikat pada koneksi node yang tepat. Sesi sumber yang terputus atau diganti
tidak dapat menyelesaikan peringatan terjadwal lama, dan koneksi tujuan pengganti
tetap dapat berpartisipasi dalam pengiriman cadangan.

## Pemecahan masalah

| Gejala                                    | Pemeriksaan                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tidak ada baris yang ditandai `active`      | Pastikan node macOS native terhubung dan `openclaw nodes describe --node <id>` menampilkan `permissions.accessibility: true`.                                          |
| Mac yang salah tetap aktif                | Gunakan Mac tersebut secara fisik, tunggu jendela penggabungan, lalu jalankan kembali `openclaw nodes status`. Tindakan kontrol komputer sintetis tidak dihitung.                        |
| Data input terakhir menghilang            | Periksa apakah Mac terputus, sesi nodenya diganti, atau Accessibility dicabut. Setiap kondisi memang sengaja menghapus aktivitas.                       |
| Peringatan muncul di beberapa Mac         | Pengiriman utama tidak tersedia atau gagal, sehingga mekanisme cadangan tertunda dijalankan. Pastikan Mac aktif terhubung, mengizinkan notifikasi, dan menyediakan `system.notify`. |
| Agen tidak menyebutkan Mac aktif          | Mulai giliran baru setelah aktivitas berubah. Petunjuk runtime stabil dan ringkas; gunakan alat `nodes` untuk metadata terkini yang tepat.                                    |

Untuk pemulihan TCC, lihat [izin macOS](/id/platforms/mac/permissions). Untuk kegagalan
koneksi dan perintah node, lihat [Pemecahan masalah Node](/id/nodes/troubleshooting).

## Terkait

- [Node](/id/nodes)
- [CLI Node](/id/cli/nodes)
- [Kehadiran sistem](/id/concepts/presence)
- [Protokol Gateway](/id/gateway/protocol#presence)
- [Aplikasi macOS](/id/platforms/macos)
