---
read_when:
    - Menyiapkan atau men-debug kontrol mac remote
summary: Alur aplikasi macOS untuk mengontrol gateway OpenClaw remote melalui SSH
title: Kontrol Remote
x-i18n:
    generated_at: "2026-04-05T14:00:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96e46e603c2275d04596b5d1ae0fb6858bd1a102a727dc13924ffcd9808fdf7e
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw Remote (macOS ⇄ host remote)

Alur ini memungkinkan aplikasi macOS bertindak sebagai kontrol penuh remote untuk gateway OpenClaw yang berjalan di host lain (desktop/server). Ini adalah fitur **Remote over SSH** (jalankan remote) pada aplikasi. Semua fitur—pemeriksaan kesehatan, penerusan Voice Wake, dan Web Chat—menggunakan konfigurasi SSH remote yang sama dari _Settings → General_.

## Mode

- **Local (Mac ini)**: Semuanya berjalan di laptop. Tidak melibatkan SSH.
- **Remote over SSH (default)**: Perintah OpenClaw dijalankan di host remote. Aplikasi mac membuka koneksi SSH dengan `-o BatchMode` plus identitas/kunci yang Anda pilih dan port-forward lokal.
- **Remote direct (ws/wss)**: Tidak ada tunnel SSH. Aplikasi mac terhubung langsung ke URL gateway (misalnya melalui Tailscale Serve atau reverse proxy HTTPS publik).

## Transport remote

Mode remote mendukung dua transport:

- **Tunnel SSH** (default): Menggunakan `ssh -N -L ...` untuk meneruskan port gateway ke localhost. Gateway akan melihat IP node sebagai `127.0.0.1` karena tunnel ini adalah loopback.
- **Direct (ws/wss)**: Terhubung langsung ke URL gateway. Gateway melihat IP klien yang sebenarnya.

## Prasyarat di host remote

1. Instal Node + pnpm dan build/instal CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Pastikan `openclaw` ada di PATH untuk shell non-interaktif (buat symlink ke `/usr/local/bin` atau `/opt/homebrew/bin` jika perlu).
3. Buka SSH dengan auth berbasis kunci. Kami merekomendasikan IP **Tailscale** untuk jangkauan stabil di luar LAN.

## Penyiapan aplikasi macOS

1. Buka _Settings → General_.
2. Di bawah **OpenClaw runs**, pilih **Remote over SSH** lalu setel:
   - **Transport**: **SSH tunnel** atau **Direct (ws/wss)**.
   - **SSH target**: `user@host` (opsional `:port`).
     - Jika gateway berada di LAN yang sama dan mengiklankan Bonjour, pilih dari daftar yang ditemukan untuk mengisi bidang ini secara otomatis.
   - **Gateway URL** (khusus Direct): `wss://gateway.example.ts.net` (atau `ws://...` untuk lokal/LAN).
   - **Identity file** (lanjutan): path ke kunci Anda.
   - **Project root** (lanjutan): path checkout remote yang digunakan untuk perintah.
   - **CLI path** (lanjutan): path opsional ke entrypoint/biner `openclaw` yang dapat dijalankan (diisi otomatis saat diiklankan).
3. Tekan **Test remote**. Keberhasilan menunjukkan bahwa `openclaw status --json` remote berjalan dengan benar. Kegagalan biasanya berarti masalah PATH/CLI; exit 127 berarti CLI tidak ditemukan di remote.
4. Pemeriksaan kesehatan dan Web Chat sekarang akan berjalan melalui tunnel SSH ini secara otomatis.

## Web Chat

- **Tunnel SSH**: Web Chat terhubung ke gateway melalui port kontrol WebSocket yang diteruskan (default `18789`).
- **Direct (ws/wss)**: Web Chat terhubung langsung ke URL gateway yang dikonfigurasi.
- Tidak ada lagi server HTTP WebChat terpisah.

## Izin

- Host remote memerlukan persetujuan TCC yang sama seperti lokal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Jalankan onboarding di mesin tersebut untuk memberikannya satu kali.
- Node mengiklankan status izinnya melalui `node.list` / `node.describe` agar agent mengetahui apa yang tersedia.

## Catatan keamanan

- Utamakan bind loopback di host remote dan hubungkan melalui SSH atau Tailscale.
- Tunneling SSH menggunakan pemeriksaan host-key yang ketat; percayai host key terlebih dahulu agar tersedia di `~/.ssh/known_hosts`.
- Jika Anda melakukan bind Gateway ke antarmuka non-loopback, wajibkan auth Gateway yang valid: token, kata sandi, atau reverse proxy yang sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Lihat [Security](/gateway/security) dan [Tailscale](/id/gateway/tailscale).

## Alur login WhatsApp (remote)

- Jalankan `openclaw channels login --verbose` **di host remote**. Pindai QR dengan WhatsApp di ponsel Anda.
- Jalankan ulang login di host tersebut jika auth kedaluwarsa. Pemeriksaan kesehatan akan menampilkan masalah tautan.

## Pemecahan masalah

- **exit 127 / not found**: `openclaw` tidak ada di PATH untuk shell non-login. Tambahkan ke `/etc/paths`, rc shell Anda, atau buat symlink ke `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: periksa keterjangkauan SSH, PATH, dan bahwa Baileys sudah login (`openclaw status --json`).
- **Web Chat macet**: pastikan gateway berjalan di host remote dan port yang diteruskan cocok dengan port WS gateway; UI memerlukan koneksi WS yang sehat.
- **IP node menunjukkan 127.0.0.1**: ini wajar dengan tunnel SSH. Ubah **Transport** ke **Direct (ws/wss)** jika Anda ingin gateway melihat IP klien yang sebenarnya.
- **Voice Wake**: frasa pemicu diteruskan secara otomatis dalam mode remote; tidak diperlukan forwarder terpisah.

## Suara notifikasi

Pilih suara per notifikasi dari skrip dengan `openclaw` dan `node.invoke`, misalnya:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Gateway remote siap" --sound Glass
```

Tidak ada lagi toggle “default sound” global di aplikasi; pemanggil memilih suara (atau tanpa suara) per permintaan.
