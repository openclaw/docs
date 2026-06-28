---
read_when:
    - Menyiapkan atau men-debug kontrol Mac jarak jauh
summary: Alur aplikasi macOS untuk mengendalikan Gateway OpenClaw jarak jauh
title: Kendali jarak jauh
x-i18n:
    generated_at: "2026-06-28T00:13:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

Alur ini memungkinkan aplikasi macOS bertindak sebagai remote control penuh untuk Gateway OpenClaw yang berjalan di host lain (desktop/server). Aplikasi dapat terhubung langsung ke URL Gateway LAN/Tailnet tepercaya atau mengelola tunnel SSH ketika Gateway jarak jauh hanya loopback. Pemeriksaan kesehatan, penerusan Bangun Suara, dan Web Chat menggunakan ulang konfigurasi jarak jauh yang sama dari _Settings → General_.

## Mode

- **Lokal (Mac ini)**: Semuanya berjalan di laptop. Tidak ada SSH yang terlibat.
- **Jarak jauh melalui SSH (default)**: Perintah OpenClaw dijalankan pada host jarak jauh. Aplikasi Mac membuka koneksi SSH dengan `-o BatchMode` ditambah identitas/kunci pilihan Anda dan penerusan port lokal.
- **Jarak jauh langsung (ws/wss)**: Tanpa tunnel SSH. Aplikasi Mac terhubung langsung ke URL Gateway (misalnya, melalui LAN, Tailscale, Tailscale Serve, atau reverse proxy HTTPS publik).

## Transport jarak jauh

Mode jarak jauh mendukung dua transport:

- **Tunnel SSH** (default): Menggunakan `ssh -N -L ...` untuk meneruskan port Gateway ke localhost. Gateway akan melihat IP Node sebagai `127.0.0.1` karena tunnel tersebut adalah loopback.
- **Langsung (ws/wss)**: Terhubung langsung ke URL Gateway. Gateway melihat IP klien yang sebenarnya.

Dalam mode tunnel SSH, hostname LAN/tailnet yang ditemukan disimpan sebagai
`gateway.remote.sshTarget`. Aplikasi mempertahankan `gateway.remote.url` pada endpoint
tunnel lokal, misalnya `ws://127.0.0.1:18789`, sehingga CLI, Web Chat, dan
layanan host Node lokal semuanya menggunakan transport loopback aman yang sama.
Ketika penemuan mengembalikan IP Tailnet mentah dan hostname stabil, aplikasi
memilih Tailscale MagicDNS atau nama LAN agar koneksi jarak jauh lebih tahan
terhadap perubahan alamat.
Jika port tunnel lokal berbeda dari port Gateway jarak jauh, atur
`gateway.remote.remotePort` ke port pada host jarak jauh.

Otomasi browser dalam mode jarak jauh dimiliki oleh host Node CLI, bukan oleh
Node aplikasi macOS native. Aplikasi memulai layanan host Node yang terpasang bila
memungkinkan; jika Anda membutuhkan kontrol browser dari Mac tersebut, pasang/mulai dengan
`openclaw node install ...` dan `openclaw node start` (atau jalankan
`openclaw node run ...` di foreground), lalu targetkan Node yang mendukung browser
tersebut.

## Prasyarat pada host jarak jauh

1. Pasang Node + pnpm dan build/pasang CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Pastikan `openclaw` ada di PATH untuk shell non-interaktif (buat symlink ke `/usr/local/bin` atau `/opt/homebrew/bin` jika diperlukan).
3. Hanya untuk transport SSH: buka SSH dengan autentikasi kunci. Kami merekomendasikan IP **Tailscale** agar dapat dijangkau secara stabil di luar LAN.

## Penyiapan aplikasi macOS

Untuk melakukan prakonfigurasi aplikasi tanpa alur sambutan:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Untuk Gateway yang sudah dapat dijangkau di LAN atau Tailnet tepercaya, lewati SSH sepenuhnya:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Ini menulis konfigurasi jarak jauh, menandai onboarding selesai, dan memungkinkan aplikasi memiliki
transport yang dipilih saat dimulai.

1. Buka _Settings → General_.
2. Di bawah **OpenClaw runs**, pilih **Remote** dan atur:
   - **Transport**: **SSH tunnel** atau **Direct (ws/wss)**.
   - **SSH target**: `user@host` (opsional `:port`).
     - Jika Gateway berada di LAN yang sama dan mengiklankan Bonjour, pilih dari daftar yang ditemukan untuk mengisi otomatis bidang ini.
   - **Gateway URL** (hanya Direct): `wss://gateway.example.ts.net` (atau `ws://...` untuk lokal/LAN).
   - **Identity file** (lanjutan): path ke kunci Anda.
   - **Project root** (lanjutan): path checkout jarak jauh yang digunakan untuk perintah.
   - **CLI path** (lanjutan): path opsional ke entrypoint/binary `openclaw` yang dapat dijalankan (diisi otomatis saat diiklankan).
3. Tekan **Test remote**. Keberhasilan menunjukkan `openclaw status --json` jarak jauh berjalan dengan benar. Kegagalan biasanya berarti masalah PATH/CLI; exit 127 berarti CLI tidak ditemukan secara jarak jauh.
4. Pemeriksaan kesehatan dan Web Chat sekarang akan berjalan melalui transport yang dipilih secara otomatis.

## Web Chat

- **Tunnel SSH**: Web Chat terhubung ke Gateway melalui port kontrol WebSocket yang diteruskan (default 18789).
- **Langsung (ws/wss)**: Web Chat terhubung langsung ke URL Gateway yang dikonfigurasi.
- Tidak ada server HTTP WebChat terpisah lagi.

## Izin

- Host jarak jauh memerlukan persetujuan TCC yang sama seperti lokal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Jalankan onboarding pada mesin tersebut untuk memberikannya sekali.
- Node mengiklankan status izinnya melalui `node.list` / `node.describe` sehingga agen mengetahui apa yang tersedia.

## Catatan keamanan

- Utamakan bind loopback pada host jarak jauh dan hubungkan melalui SSH, Tailscale Serve, atau URL langsung Tailnet/LAN tepercaya.
- Tunneling SSH menggunakan pemeriksaan host-key yang ketat; percayai host key terlebih dahulu agar ada di `~/.ssh/known_hosts`.
- Jika Anda mengikat Gateway ke antarmuka non-loopback, wajibkan autentikasi Gateway yang valid: token, kata sandi, atau reverse proxy sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Lihat [Keamanan](/id/gateway/security) dan [Tailscale](/id/gateway/tailscale).

## Alur login WhatsApp (jarak jauh)

- Jalankan `openclaw channels login --verbose` **pada host jarak jauh**. Pindai QR dengan WhatsApp di ponsel Anda.
- Jalankan ulang login pada host tersebut jika autentikasi kedaluwarsa. Pemeriksaan kesehatan akan menampilkan masalah tautan.

## Pemecahan masalah

- **exit 127 / not found**: `openclaw` tidak ada di PATH untuk shell non-login. Tambahkan ke `/etc/paths`, rc shell Anda, atau buat symlink ke `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: periksa keterjangkauan SSH, PATH, dan bahwa Baileys sudah login (`openclaw status --json`).
- **Web Chat stuck**: pastikan Gateway berjalan pada host jarak jauh dan port yang diteruskan cocok dengan port WS Gateway; UI memerlukan koneksi WS yang sehat.
- **Node IP shows 127.0.0.1**: ini diharapkan dengan tunnel SSH. Ubah **Transport** ke **Direct (ws/wss)** jika Anda ingin Gateway melihat IP klien yang sebenarnya.
- **Dashboard works but Mac capabilities are offline**: ini berarti koneksi operator/kontrol aplikasi sehat, tetapi koneksi Node pendamping tidak tersambung atau kehilangan permukaan perintahnya. Buka bagian perangkat di bilah menu dan periksa apakah Mac berstatus `paired · disconnected`. Untuk endpoint Tailscale Serve `wss://*.ts.net`, aplikasi mendeteksi pin leaf TLS lama yang sudah usang setelah rotasi sertifikat, menghapus pin usang saat macOS memercayai sertifikat baru, dan mencoba lagi secara otomatis. Jika sertifikat tidak dipercaya sistem atau host bukan nama Tailscale Serve, atur `gateway.remote.tlsFingerprint` ke fingerprint sertifikat yang diharapkan, tinjau sertifikat, atau beralih ke **Remote over SSH**.
- **Voice Wake**: frasa pemicu diteruskan secara otomatis dalam mode jarak jauh; tidak diperlukan forwarder terpisah.

## Suara notifikasi

Pilih suara per notifikasi dari skrip dengan `openclaw` dan `node.invoke`, misalnya:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Tidak ada lagi toggle "default sound" global di aplikasi; pemanggil memilih suara (atau tidak ada) per permintaan.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Akses jarak jauh](/id/gateway/remote)
