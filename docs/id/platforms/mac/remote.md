---
read_when:
    - Menyiapkan atau memecahkan masalah kontrol Mac jarak jauh
summary: Alur aplikasi macOS untuk mengontrol Gateway OpenClaw jarak jauh melalui SSH
title: Kontrol jarak jauh
x-i18n:
    generated_at: "2026-05-06T09:20:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd7eb110f4c3e6a52b4b9baeccce4ef9d02c01104c188940c28f245bc161894a
    source_path: platforms/mac/remote.md
    workflow: 16
---

Alur ini memungkinkan aplikasi macOS bertindak sebagai kendali jarak jauh penuh untuk Gateway OpenClaw yang berjalan di host lain (desktop/server). Ini adalah fitur **Jarak Jauh melalui SSH** (remote run) milik aplikasi. Semua fitur-pemeriksaan kesehatan, penerusan Voice Wake, dan Obrolan Web-menggunakan kembali konfigurasi SSH jarak jauh yang sama dari _Pengaturan → Umum_.

## Mode

- **Lokal (Mac ini)**: Semuanya berjalan di laptop. Tidak melibatkan SSH.
- **Jarak Jauh melalui SSH (default)**: Perintah OpenClaw dijalankan di host jarak jauh. Aplikasi Mac membuka koneksi SSH dengan `-o BatchMode` ditambah identitas/kunci yang Anda pilih dan penerusan port lokal.
- **Jarak jauh langsung (ws/wss)**: Tanpa tunnel SSH. Aplikasi Mac terhubung langsung ke URL Gateway (misalnya, melalui Tailscale Serve atau reverse proxy HTTPS publik).

## Transport jarak jauh

Mode jarak jauh mendukung dua transport:

- **Tunnel SSH** (default): Menggunakan `ssh -N -L ...` untuk meneruskan port Gateway ke localhost. Gateway akan melihat IP Node sebagai `127.0.0.1` karena tunnel bersifat loopback.
- **Langsung (ws/wss)**: Terhubung langsung ke URL Gateway. Gateway melihat IP klien yang sebenarnya.

Dalam mode tunnel SSH, nama host LAN/tailnet yang ditemukan disimpan sebagai
`gateway.remote.sshTarget`. Aplikasi mempertahankan `gateway.remote.url` pada endpoint
tunnel lokal, misalnya `ws://127.0.0.1:18789`, sehingga CLI, Obrolan Web, dan
layanan host Node lokal semuanya menggunakan transport loopback aman yang sama.

Otomasi browser dalam mode jarak jauh dimiliki oleh host Node CLI, bukan oleh
Node aplikasi macOS native. Aplikasi memulai layanan host Node terpasang jika
memungkinkan; jika Anda memerlukan kendali browser dari Mac tersebut, instal/mulai dengan
`openclaw node install ...` dan `openclaw node start` (atau jalankan
`openclaw node run ...` di latar depan), lalu targetkan Node yang mendukung browser itu.

## Prasyarat di host jarak jauh

1. Instal Node + pnpm dan build/instal CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Pastikan `openclaw` ada di PATH untuk shell non-interaktif (buat symlink ke `/usr/local/bin` atau `/opt/homebrew/bin` jika diperlukan).
3. Buka SSH dengan autentikasi kunci. Kami merekomendasikan IP **Tailscale** untuk keterjangkauan stabil di luar LAN.

## Penyiapan aplikasi macOS

1. Buka _Pengaturan → Umum_.
2. Di bawah **OpenClaw berjalan**, pilih **Jarak Jauh melalui SSH** dan atur:
   - **Transport**: **Tunnel SSH** atau **Langsung (ws/wss)**.
   - **Target SSH**: `user@host` (opsional `:port`).
     - Jika Gateway berada di LAN yang sama dan mengiklankan Bonjour, pilih dari daftar yang ditemukan untuk mengisi bidang ini secara otomatis.
   - **URL Gateway** (hanya Langsung): `wss://gateway.example.ts.net` (atau `ws://...` untuk lokal/LAN).
   - **File identitas** (lanjutan): path ke kunci Anda.
   - **Root proyek** (lanjutan): path checkout jarak jauh yang digunakan untuk perintah.
   - **Path CLI** (lanjutan): path opsional ke entrypoint/biner `openclaw` yang dapat dijalankan (diisi otomatis saat diiklankan).
3. Tekan **Uji jarak jauh**. Sukses menunjukkan bahwa `openclaw status --json` jarak jauh berjalan dengan benar. Kegagalan biasanya berarti masalah PATH/CLI; exit 127 berarti CLI tidak ditemukan dari jarak jauh.
4. Pemeriksaan kesehatan dan Obrolan Web sekarang akan berjalan melalui tunnel SSH ini secara otomatis.

## Obrolan Web

- **Tunnel SSH**: Obrolan Web terhubung ke Gateway melalui port kontrol WebSocket yang diteruskan (default 18789).
- **Langsung (ws/wss)**: Obrolan Web terhubung langsung ke URL Gateway yang dikonfigurasi.
- Tidak ada lagi server HTTP WebChat terpisah.

## Izin

- Host jarak jauh memerlukan persetujuan TCC yang sama seperti lokal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Jalankan onboarding di mesin tersebut untuk memberikannya satu kali.
- Node mengiklankan status izinnya melalui `node.list` / `node.describe` sehingga agen tahu apa yang tersedia.

## Catatan keamanan

- Utamakan bind loopback di host jarak jauh dan hubungkan melalui SSH atau Tailscale.
- Tunneling SSH menggunakan pemeriksaan kunci host yang ketat; percayai kunci host terlebih dahulu agar ada di `~/.ssh/known_hosts`.
- Jika Anda mengikat Gateway ke antarmuka non-loopback, wajibkan autentikasi Gateway yang valid: token, kata sandi, atau reverse proxy sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Lihat [Keamanan](/id/gateway/security) dan [Tailscale](/id/gateway/tailscale).

## Alur login WhatsApp (jarak jauh)

- Jalankan `openclaw channels login --verbose` **di host jarak jauh**. Pindai QR dengan WhatsApp di ponsel Anda.
- Jalankan ulang login di host tersebut jika autentikasi kedaluwarsa. Pemeriksaan kesehatan akan menampilkan masalah tautan.

## Pemecahan masalah

- **exit 127 / tidak ditemukan**: `openclaw` tidak ada di PATH untuk shell non-login. Tambahkan ke `/etc/paths`, rc shell Anda, atau buat symlink ke `/usr/local/bin`/`/opt/homebrew/bin`.
- **Probe kesehatan gagal**: periksa keterjangkauan SSH, PATH, dan bahwa Baileys sudah login (`openclaw status --json`).
- **Obrolan Web macet**: konfirmasi Gateway berjalan di host jarak jauh dan port yang diteruskan cocok dengan port WS Gateway; UI memerlukan koneksi WS yang sehat.
- **IP Node menampilkan 127.0.0.1**: ini sesuai ekspektasi dengan tunnel SSH. Ubah **Transport** ke **Langsung (ws/wss)** jika Anda ingin Gateway melihat IP klien yang sebenarnya.
- **Dashboard berfungsi tetapi kapabilitas Mac offline**: ini berarti koneksi operator/kontrol aplikasi sehat, tetapi koneksi Node pendamping tidak terhubung atau kehilangan permukaan perintahnya. Buka bagian perangkat bilah menu dan periksa apakah Mac berstatus `paired · disconnected`. Untuk endpoint Tailscale Serve `wss://*.ts.net`, aplikasi mendeteksi pin leaf TLS lama yang basi setelah rotasi sertifikat, menghapus pin basi saat macOS memercayai sertifikat baru, dan mencoba ulang secara otomatis. Jika sertifikat tidak dipercaya sistem atau host bukan nama Tailscale Serve, tinjau sertifikat atau beralih ke **Jarak Jauh melalui SSH**.
- **Voice Wake**: frasa pemicu diteruskan secara otomatis dalam mode jarak jauh; penerus terpisah tidak diperlukan.

## Suara notifikasi

Pilih suara per notifikasi dari skrip dengan `openclaw` dan `node.invoke`, misalnya:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Tidak ada lagi toggle "suara default" global di aplikasi; pemanggil memilih suara (atau tidak ada) per permintaan.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Akses jarak jauh](/id/gateway/remote)
