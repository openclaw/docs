---
read_when:
    - Menyiapkan atau men-debug kontrol Mac jarak jauh
summary: Alur aplikasi macOS untuk mengendalikan Gateway OpenClaw jarak jauh
title: Kendali jarak jauh
x-i18n:
    generated_at: "2026-06-27T17:43:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

Alur ini memungkinkan aplikasi macOS bertindak sebagai kendali jarak jauh penuh untuk Gateway OpenClaw yang berjalan di host lain (desktop/server). Aplikasi dapat terhubung langsung ke URL Gateway LAN/Tailnet tepercaya atau mengelola tunnel SSH saat Gateway jarak jauh hanya loopback. Pemeriksaan kesehatan, penerusan Voice Wake, dan Web Chat menggunakan ulang konfigurasi jarak jauh yang sama dari _Pengaturan → Umum_.

## Mode

- **Lokal (Mac ini)**: Semuanya berjalan di laptop. Tidak ada SSH yang terlibat.
- **Jarak jauh melalui SSH (default)**: Perintah OpenClaw dijalankan di host jarak jauh. Aplikasi Mac membuka koneksi SSH dengan `-o BatchMode` ditambah identitas/kunci pilihan Anda dan penerusan port lokal.
- **Jarak jauh langsung (ws/wss)**: Tanpa tunnel SSH. Aplikasi Mac terhubung langsung ke URL Gateway (misalnya, melalui LAN, Tailscale, Tailscale Serve, atau reverse proxy HTTPS publik).

## Transport jarak jauh

Mode jarak jauh mendukung dua transport:

- **Tunnel SSH** (default): Menggunakan `ssh -N -L ...` untuk meneruskan port Gateway ke localhost. Gateway akan melihat IP node sebagai `127.0.0.1` karena tunnel bersifat loopback.
- **Langsung (ws/wss)**: Terhubung langsung ke URL Gateway. Gateway melihat IP klien yang sebenarnya.

Dalam mode tunnel SSH, hostname LAN/tailnet yang ditemukan disimpan sebagai
`gateway.remote.sshTarget`. Aplikasi mempertahankan `gateway.remote.url` pada endpoint
tunnel lokal, misalnya `ws://127.0.0.1:18789`, sehingga CLI, Web Chat, dan
layanan host node lokal semuanya menggunakan transport loopback aman yang sama.
Jika port tunnel lokal berbeda dari port Gateway jarak jauh, atur
`gateway.remote.remotePort` ke port pada host jarak jauh.

Otomasi browser dalam mode jarak jauh dimiliki oleh host node CLI, bukan oleh
node aplikasi macOS native. Aplikasi memulai layanan host node yang terpasang jika
memungkinkan; jika Anda memerlukan kontrol browser dari Mac tersebut, pasang/mulai dengan
`openclaw node install ...` dan `openclaw node start` (atau jalankan
`openclaw node run ...` di foreground), lalu targetkan node yang mendukung browser tersebut.

## Prasyarat pada host jarak jauh

1. Pasang Node + pnpm dan build/pasang CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Pastikan `openclaw` ada di PATH untuk shell non-interaktif (symlink ke `/usr/local/bin` atau `/opt/homebrew/bin` jika diperlukan).
3. Hanya untuk transport SSH: buka SSH dengan autentikasi kunci. Kami merekomendasikan IP **Tailscale** untuk keterjangkauan yang stabil di luar LAN.

## Penyiapan aplikasi macOS

Untuk mengonfigurasi aplikasi sebelumnya tanpa alur sambutan:

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

1. Buka _Pengaturan → Umum_.
2. Di bawah **OpenClaw berjalan**, pilih **Jarak jauh** dan atur:
   - **Transport**: **Tunnel SSH** atau **Langsung (ws/wss)**.
   - **Target SSH**: `user@host` (`:port` opsional).
     - Jika Gateway berada di LAN yang sama dan mengiklankan Bonjour, pilih dari daftar yang ditemukan untuk mengisi bidang ini secara otomatis.
   - **URL Gateway** (hanya Langsung): `wss://gateway.example.ts.net` (atau `ws://...` untuk lokal/LAN).
   - **File identitas** (lanjutan): path ke kunci Anda.
   - **Root proyek** (lanjutan): path checkout jarak jauh yang digunakan untuk perintah.
   - **Path CLI** (lanjutan): path opsional ke entrypoint/binary `openclaw` yang dapat dijalankan (terisi otomatis saat diiklankan).
3. Tekan **Uji jarak jauh**. Berhasil berarti `openclaw status --json` jarak jauh berjalan dengan benar. Kegagalan biasanya berarti masalah PATH/CLI; exit 127 berarti CLI tidak ditemukan dari jarak jauh.
4. Pemeriksaan kesehatan dan Web Chat sekarang akan berjalan melalui transport yang dipilih secara otomatis.

## Web Chat

- **Tunnel SSH**: Web Chat terhubung ke Gateway melalui port kontrol WebSocket yang diteruskan (default 18789).
- **Langsung (ws/wss)**: Web Chat terhubung langsung ke URL Gateway yang dikonfigurasi.
- Tidak ada server HTTP WebChat terpisah lagi.

## Izin

- Host jarak jauh memerlukan persetujuan TCC yang sama seperti lokal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Jalankan onboarding pada mesin tersebut untuk memberikannya sekali.
- Node mengiklankan status izinnya melalui `node.list` / `node.describe` sehingga agen mengetahui apa yang tersedia.

## Catatan keamanan

- Lebih baik gunakan bind loopback pada host jarak jauh dan hubungkan melalui SSH, Tailscale Serve, atau URL langsung Tailnet/LAN tepercaya.
- Tunneling SSH menggunakan pemeriksaan host-key yang ketat; percayai host key terlebih dahulu agar ada di `~/.ssh/known_hosts`.
- Jika Anda mengikat Gateway ke antarmuka non-loopback, wajibkan autentikasi Gateway yang valid: token, kata sandi, atau reverse proxy sadar-identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Lihat [Keamanan](/id/gateway/security) dan [Tailscale](/id/gateway/tailscale).

## Alur login WhatsApp (jarak jauh)

- Jalankan `openclaw channels login --verbose` **pada host jarak jauh**. Pindai QR dengan WhatsApp di ponsel Anda.
- Jalankan ulang login pada host tersebut jika autentikasi kedaluwarsa. Pemeriksaan kesehatan akan memunculkan masalah tautan.

## Pemecahan masalah

- **exit 127 / tidak ditemukan**: `openclaw` tidak ada di PATH untuk shell non-login. Tambahkan ke `/etc/paths`, rc shell Anda, atau symlink ke `/usr/local/bin`/`/opt/homebrew/bin`.
- **Probe kesehatan gagal**: periksa keterjangkauan SSH, PATH, dan bahwa Baileys sudah login (`openclaw status --json`).
- **Web Chat macet**: konfirmasi Gateway berjalan di host jarak jauh dan port yang diteruskan cocok dengan port WS Gateway; UI memerlukan koneksi WS yang sehat.
- **IP Node menampilkan 127.0.0.1**: ini diharapkan dengan tunnel SSH. Ubah **Transport** ke **Langsung (ws/wss)** jika Anda ingin Gateway melihat IP klien yang sebenarnya.
- **Dashboard berfungsi tetapi kapabilitas Mac offline**: ini berarti koneksi operator/kontrol aplikasi sehat, tetapi koneksi node pendamping tidak terhubung atau kehilangan permukaan perintahnya. Buka bagian perangkat bilah menu dan periksa apakah Mac berstatus `paired · disconnected`. Untuk endpoint Tailscale Serve `wss://*.ts.net`, aplikasi mendeteksi pin leaf TLS legacy yang usang setelah rotasi sertifikat, menghapus pin usang saat macOS memercayai sertifikat baru, dan mencoba ulang secara otomatis. Jika sertifikat tidak dipercaya sistem atau host bukan nama Tailscale Serve, atur `gateway.remote.tlsFingerprint` ke fingerprint sertifikat yang diharapkan, tinjau sertifikat, atau beralih ke **Jarak jauh melalui SSH**.
- **Voice Wake**: frasa pemicu diteruskan secara otomatis dalam mode jarak jauh; tidak diperlukan penerus terpisah.

## Suara notifikasi

Pilih suara per notifikasi dari skrip dengan `openclaw` dan `node.invoke`, misalnya:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Tidak ada toggle "suara default" global di aplikasi lagi; pemanggil memilih suara (atau tanpa suara) per permintaan.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [Akses jarak jauh](/id/gateway/remote)
