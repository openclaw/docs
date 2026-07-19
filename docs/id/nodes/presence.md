---
read_when:
    - Anda ingin OpenClaw mengidentifikasi Mac yang aktif
    - Anda sedang men-debug aktivitas input terakhir atau pemilihan node aktif
    - Anda ingin memahami perutean notifikasi koneksi node
summary: Deteksi Mac yang paling baru Anda gunakan dan arahkan peringatan node ke sana
title: Keberadaan komputer aktif
x-i18n:
    generated_at: "2026-07-19T05:01:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c1d9ed66ed89580c51040026a7c054f76434446eb43a505fea79ee3412431771
    source_path: nodes/presence.md
    workflow: 16
---

Kehadiran komputer aktif memberi tahu Gateway tentang node macOS terhubung yang menerima
input fisik dari mouse atau papan ketik paling baru. OpenClaw menggunakan sinyal tersebut untuk
menandai satu Mac sebagai `active`, memberi agen petunjuk node aktif yang stabil, dan merutekan
peringatan koneksi node ke komputer tempat Anda kemungkinan besar sedang berada.

Ini berbeda dari [kehadiran sistem](/id/concepts/presence), yaitu daftar langsung
klien Gateway, dan dari beacon `node.presence.alive` yang persisten, yang
mencatat kapan node seluler terakhir kali aktif tanpa menganggapnya terhubung.

## Persyaratan

- Aplikasi OpenClaw untuk macOS telah dipasangkan dan terhubung dalam mode node.
- Izin **Accessibility** diberikan kepada aplikasi OpenClaw yang ditandatangani.
- Untuk peringatan koneksi, izin **Notifications** juga diberikan dan
  node Mac mengekspos `system.notify`.

Pelaporan aktivitas saat ini diterapkan oleh node macOS native. Host node iOS,
Android, watchOS, dan headless dapat melaporkan koneksi atau status terakhir dilihat
di latar belakang, tetapi tidak bersaing untuk mendapatkan penetapan sebagai komputer aktif.

## Memeriksa komputer aktif

1. Di aplikasi macOS, buka **Settings -> Permissions** dan berikan
   izin **Accessibility** di System Settings macOS.
2. Pastikan node Mac terhubung:

   ```bash
   openclaw nodes status --connected
   ```

3. Gerakkan mouse atau tekan tombol pada Mac tersebut, lalu jalankan:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

Mac memenuhi syarat yang paling baru ditandai sebagai `active`. Output status menampilkan usia
input terakhirnya; `describe` mengekspos `active`, `lastActiveAtMs`, dan `presenceUpdatedAtMs`.
Aktivitas sengaja digabungkan, sehingga tampilan mungkin memerlukan waktu hingga sekitar 15
detik untuk mencerminkan input berikutnya setelah laporan terbaru.

## Cara aktivitas menjadi kehadiran

Pelapor macOS mengambil sampel jam idle sistem HID setiap dua detik. Pelapor ini
melapor sekali ketika koneksi node siap, lalu melaporkan aktivitas fisik yang lebih baru
paling sering sekali setiap 15 detik. Saat idle, pelapor mengirim keepalive
setiap tiga menit. Durasi idle dibatasi hingga 30 hari agar sampel yang sangat lama
tidak bergeser maju dan keliru menjadi komputer terbaru.

Gateway menerima aktivitas hanya ketika semua kondisi berikut terpenuhi:

- peristiwa tersebut berasal dari koneksi terautentikasi saat ini untuk id node tersebut;
- node memiliki izin efektif `accessibility: true`;
- payload berisi nilai bilangan bulat terbatas `idleSeconds`.

Gateway mengurangi `idleSeconds` dari waktu pengamatannya sendiri untuk memperoleh
`lastActiveAtMs`. Gateway tidak pernah memercayai stempel waktu jam dinding yang diberikan node. Di antara
Mac terhubung yang memenuhi syarat, `lastActiveAtMs` terbaru yang dipilih; jika seri, pembaruan
kehadiran terbaru digunakan.

Kehadiran bersifat lokal pada proses dan terikat pada koneksi. Memutus sesi saat ini,
menggantinya dengan sesi lain yang menggunakan id node yang sama, atau mencabut
Accessibility akan menghapus status aktivitas node tersebut dan menghitung ulang Mac aktif.

## Privasi dan konteks model

OpenClaw mengirimkan durasi idle, bukan isi input. OpenClaw tidak mengirimkan nilai tombol,
koordinat mouse, nama aplikasi, judul jendela, atau peristiwa input mentah. Pelapor
macOS membaca status HID perangkat keras, sehingga peristiwa kontrol komputer sintetis
tidak membuat Mac otomatis tampak sebagai komputer yang Anda gunakan secara fisik.

Aktivitas berkelanjutan tidak membuat peristiwa sistem yang terlihat oleh model. Baris
runtime dinamis hanya berisi id node terautentikasi:

```text
active_node=<node-id>
```

Stempel waktu persis dan nama tampilan yang dikendalikan node tidak dimasukkan ke dalam prompt untuk
menghindari injeksi prompt dan perubahan cache. Saat agen memerlukan detail terkini,
alat `nodes` dapat membaca `node.list` atau `node.describe` sebagai gantinya.

## Cara peringatan koneksi dirutekan

Setelah node menyelesaikan handshake Gateway pertamanya yang berhasil setelah persetujuan,
OpenClaw menunggu 750 milidetik agar Mac yang sedang terhubung dapat mengirimkan sampel
aktivitas pertamanya. OpenClaw kemudian mencoba Mac terhubung berkemampuan notifikasi dengan
aktivitas terbaru.

- Jika pengiriman utama berhasil, tidak ada Mac lain yang menerima peringatan.
- Jika tidak ada Mac aktif yang tersedia atau pengiriman utama gagal, OpenClaw menunggu lima
  detik dan mencoba setiap Mac terhubung lainnya yang mengekspos `system.notify`.
- Koneksi ulang berikutnya tidak menghasilkan pemberitahuan. Gateway mencatat koneksi yang berhasil
  dalam metadata pemasangan, sehingga mulai ulang Gateway tidak memutar ulang peringatan untuk setiap
  node yang sebelumnya terhubung.

Peringatan terikat pada identitas node terautentikasi. Sesi pengganti untuk
node yang sama mengambil alih peringatan koneksi pertama yang tertunda; jika node tersebut tidak
lagi terhubung saat pengiriman dijalankan, peringatan dibatalkan.

## Pemecahan masalah

| Gejala                                    | Pemeriksaan                                                                                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tidak ada baris yang ditandai `active` | Pastikan node macOS native terhubung dan `openclaw nodes describe --node <id>` menampilkan `permissions.accessibility: true`.                                      |
| Mac yang salah tetap aktif                | Gunakan Mac tersebut secara fisik, tunggu selama jendela penggabungan, lalu jalankan ulang `openclaw nodes status`. Tindakan kontrol komputer sintetis tidak dihitung. |
| Data input terakhir menghilang            | Periksa apakah Mac terputus, sesi nodenya diganti, atau Accessibility dicabut. Setiap kondisi memang sengaja menghapus aktivitas.                                   |
| Peringatan muncul di beberapa Mac         | Pengiriman utama tidak tersedia atau gagal, sehingga fallback tertunda dijalankan. Pastikan Mac aktif terhubung, mengizinkan notifikasi, dan mengekspos `system.notify`. |
| Agen tidak menyebutkan Mac aktif          | Mulai giliran baru setelah aktivitas berubah. Petunjuk runtime bersifat stabil dan ringkas; gunakan alat `nodes` untuk metadata terkini yang persis.             |

Untuk pemulihan TCC, lihat [izin macOS](/id/platforms/mac/permissions). Untuk kegagalan
koneksi dan perintah node, lihat [pemecahan masalah Node](/id/nodes/troubleshooting).

## Terkait

- [Node](/id/nodes)
- [CLI Node](/id/cli/nodes)
- [Kehadiran sistem](/id/concepts/presence)
- [Protokol Gateway](/id/gateway/protocol#presence)
- [Aplikasi macOS](/id/platforms/macos)
