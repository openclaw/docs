---
read_when:
    - Menyiapkan atau men-debug kontrol mac remote
summary: Alur aplikasi macOS untuk mengendalikan gateway OpenClaw remote melalui SSH
title: Kontrol remote
x-i18n:
    generated_at: "2026-04-26T11:34:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw remote (macOS ⇄ host remote)

Alur ini memungkinkan aplikasi macOS bertindak sebagai kontrol remote penuh untuk gateway OpenClaw yang berjalan di host lain (desktop/server). Ini adalah fitur aplikasi **Remote over SSH** (eksekusi remote). Semua fitur—pemeriksaan kesehatan, penerusan Voice Wake, dan Web Chat—menggunakan config SSH remote yang sama dari _Settings → General_.

## Mode

- **Local (Mac ini)**: Semua berjalan di laptop. Tidak ada SSH yang terlibat.
- **Remote over SSH (default)**: Perintah OpenClaw dijalankan di host remote. Aplikasi mac membuka koneksi SSH dengan `-o BatchMode` ditambah identitas/key pilihan Anda dan local port-forward.
- **Remote direct (ws/wss)**: Tanpa tunnel SSH. Aplikasi mac terhubung langsung ke URL gateway (misalnya, melalui Tailscale Serve atau reverse proxy HTTPS publik).

## Transport remote

Mode remote mendukung dua transport:

- **Tunnel SSH** (default): Menggunakan `ssh -N -L ...` untuk meneruskan port gateway ke localhost. Gateway akan melihat IP node sebagai `127.0.0.1` karena tunnel bersifat loopback.
- **Direct (ws/wss)**: Terhubung langsung ke URL gateway. Gateway melihat IP klien yang sebenarnya.

Dalam mode tunnel SSH, hostname LAN/tailnet yang ditemukan disimpan sebagai
`gateway.remote.sshTarget`. Aplikasi mempertahankan `gateway.remote.url` pada
endpoint tunnel lokal, misalnya `ws://127.0.0.1:18789`, sehingga CLI, Web Chat, dan
service host-node lokal semuanya menggunakan transport loopback aman yang sama.

Otomasi browser dalam mode remote dimiliki oleh host node CLI, bukan oleh node aplikasi macOS native.
Aplikasi memulai service host node yang terinstal bila memungkinkan; jika Anda memerlukan
kontrol browser dari Mac tersebut, instal/mulai dengan
`openclaw node install ...` dan `openclaw node start` (atau jalankan
`openclaw node run ...` di foreground), lalu targetkan node dengan kapabilitas
browser tersebut.

## Prasyarat pada host remote

1. Instal Node + pnpm dan build/instal CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Pastikan `openclaw` ada di PATH untuk shell non-interaktif (buat symlink ke `/usr/local/bin` atau `/opt/homebrew/bin` jika perlu).
3. Buka SSH dengan auth berbasis key. Kami menyarankan IP **Tailscale** untuk keterjangkauan stabil di luar LAN.

## Penyiapan aplikasi macOS

1. Buka _Settings → General_.
2. Di bawah **OpenClaw runs**, pilih **Remote over SSH** dan atur:
   - **Transport**: **SSH tunnel** atau **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:port` opsional).
     - Jika gateway berada di LAN yang sama dan mengiklankan Bonjour, pilih dari daftar yang ditemukan untuk mengisi field ini secara otomatis.
   - **Gateway URL** (hanya Direct): `wss://gateway.example.ts.net` (atau `ws://...` untuk lokal/LAN).
   - **Identity file** (lanjutan): path ke key Anda.
   - **Project root** (lanjutan): path checkout remote yang digunakan untuk perintah.
   - **CLI path** (lanjutan): path opsional ke entrypoint/binary `openclaw` yang dapat dijalankan (diisi otomatis saat diiklankan).
3. Tekan **Test remote**. Keberhasilan menandakan `openclaw status --json` remote berjalan dengan benar. Kegagalan biasanya berarti masalah PATH/CLI; exit 127 berarti CLI tidak ditemukan di remote.
4. Pemeriksaan kesehatan dan Web Chat sekarang akan berjalan melalui tunnel SSH ini secara otomatis.

## Web Chat

- **Tunnel SSH**: Web Chat terhubung ke gateway melalui port kontrol WebSocket yang diteruskan (default 18789).
- **Direct (ws/wss)**: Web Chat terhubung langsung ke URL gateway yang dikonfigurasi.
- Tidak ada lagi server HTTP WebChat terpisah.

## Izin

- Host remote memerlukan persetujuan TCC yang sama seperti lokal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Jalankan onboarding di mesin tersebut untuk memberikannya sekali.
- Node mengiklankan status izinnya melalui `node.list` / `node.describe` agar agen mengetahui apa yang tersedia.

## Catatan keamanan

- Utamakan bind loopback pada host remote dan hubungkan melalui SSH atau Tailscale.
- SSH tunneling menggunakan pemeriksaan host-key yang ketat; percayai host key terlebih dahulu agar ada di `~/.ssh/known_hosts`.
- Jika Anda me-bind Gateway ke interface non-loopback, wajibkan auth Gateway yang valid: token, password, atau reverse proxy yang sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Lihat [Security](/id/gateway/security) dan [Tailscale](/id/gateway/tailscale).

## Alur login WhatsApp (remote)

- Jalankan `openclaw channels login --verbose` **di host remote**. Pindai QR dengan WhatsApp di ponsel Anda.
- Jalankan ulang login di host tersebut jika auth kedaluwarsa. Pemeriksaan kesehatan akan menampilkan masalah tautan.

## Pemecahan masalah

- **exit 127 / not found**: `openclaw` tidak ada di PATH untuk shell non-login. Tambahkan ke `/etc/paths`, rc shell Anda, atau buat symlink ke `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: periksa keterjangkauan SSH, PATH, dan bahwa Baileys sudah login (`openclaw status --json`).
- **Web Chat stuck**: pastikan gateway berjalan di host remote dan port yang diteruskan cocok dengan port WS gateway; UI memerlukan koneksi WS yang sehat.
- **IP node menunjukkan 127.0.0.1**: ini diharapkan dengan tunnel SSH. Ubah **Transport** ke **Direct (ws/wss)** jika Anda ingin gateway melihat IP klien yang sebenarnya.
- **Voice Wake**: frasa pemicu diteruskan secara otomatis dalam mode remote; tidak diperlukan forwarder terpisah.

## Suara notifikasi

Pilih suara per notifikasi dari script dengan `openclaw` dan `node.invoke`, misalnya:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Tidak ada lagi toggle “default sound” global di aplikasi; pemanggil memilih suara (atau tidak ada) per permintaan.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Akses remote](/id/gateway/remote)
