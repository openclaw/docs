---
read_when:
    - Menyiapkan atau men-debug kontrol Mac jarak jauh
summary: alur aplikasi macOS untuk mengontrol Gateway OpenClaw jarak jauh
title: Kendali jarak jauh
x-i18n:
    generated_at: "2026-07-03T23:43:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

Alur ini memungkinkan aplikasi macOS bertindak sebagai kendali jarak jauh penuh untuk Gateway OpenClaw yang berjalan di host lain (desktop/server). Aplikasi dapat terhubung langsung ke URL Gateway LAN/Tailnet tepercaya atau mengelola tunnel SSH ketika Gateway jarak jauh hanya loopback. Pemeriksaan kesehatan, penerusan Voice Wake, dan Web Chat menggunakan ulang konfigurasi jarak jauh yang sama dari _Pengaturan → Umum_.

## Mode

- **Lokal (Mac ini)**: Semuanya berjalan di laptop. Tidak ada SSH yang terlibat.
- **Jarak jauh melalui SSH (default)**: Perintah OpenClaw dijalankan di host jarak jauh. Aplikasi Mac membuka koneksi SSH dengan `-o BatchMode` plus identitas/kunci pilihan Anda dan penerusan port lokal.
- **Jarak jauh langsung (ws/wss)**: Tanpa tunnel SSH. Aplikasi Mac terhubung langsung ke URL Gateway (misalnya, melalui LAN, Tailscale, Tailscale Serve, atau proxy balik HTTPS publik).

## Transport jarak jauh

Mode jarak jauh mendukung dua transport:

- **Tunnel SSH** (default): Menggunakan `ssh -N -L ...` untuk meneruskan port Gateway ke localhost. Gateway akan melihat IP node sebagai `127.0.0.1` karena tunnel bersifat loopback.
- **Langsung (ws/wss)**: Terhubung langsung ke URL Gateway. Gateway melihat IP klien yang sebenarnya.

Aplikasi menonaktifkan multiplexing koneksi SSH dan proses latar setelah autentikasi untuk proses SSH yang dimiliki aplikasi agar dapat memantau dan memulai ulang proses yang tepat bahkan ketika alias yang dipilih mengaktifkan `ControlMaster` atau `ForkAfterAuthentication`.

Verifikasi kunci host SSH bersifat ketat secara default karena kredensial Gateway melewati tunnel ini. Untuk alias SSH terkelola yang perilaku kepercayaannya secara eksplisit ingin Anda gunakan, aktifkan dengan `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` atau setel `gateway.remote.sshHostKeyPolicy` ke `"openssh"`. Keikutsertaan ini menggunakan kebijakan kunci host OpenSSH yang efektif; tinjau alias dan konfigurasi `Host *` atau sistem yang cocok terlebih dahulu. Mengubah target SSH di aplikasi atau dengan `configure-remote` mengatur ulang kebijakan ke `strict` kecuali Anda secara eksplisit mengaktifkannya lagi.

Dalam mode tunnel SSH, nama host LAN/tailnet yang ditemukan disimpan sebagai
`gateway.remote.sshTarget`. Aplikasi mempertahankan `gateway.remote.url` pada endpoint tunnel lokal, misalnya `ws://127.0.0.1:18789`, sehingga CLI, Web Chat, dan layanan host node lokal semuanya menggunakan transport loopback aman yang sama.
Ketika penemuan mengembalikan IP Tailnet mentah dan nama host stabil sekaligus, aplikasi lebih memilih Tailscale MagicDNS atau nama LAN agar koneksi jarak jauh lebih tahan terhadap perubahan alamat.
Jika port tunnel lokal berbeda dari port Gateway jarak jauh, setel
`gateway.remote.remotePort` ke port pada host jarak jauh.

Otomatisasi browser dalam mode jarak jauh dimiliki oleh host node CLI, bukan oleh node aplikasi macOS native. Aplikasi memulai layanan host node yang terpasang bila memungkinkan; jika Anda memerlukan kontrol browser dari Mac tersebut, instal/mulai dengan `openclaw node install ...` dan `openclaw node start` (atau jalankan `openclaw node run ...` di latar depan), lalu arahkan ke node yang mendukung browser tersebut.

## Prasyarat pada host jarak jauh

1. Instal Node + pnpm dan bangun/instal CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Pastikan `openclaw` ada di PATH untuk shell non-interaktif (buat symlink ke `/usr/local/bin` atau `/opt/homebrew/bin` jika diperlukan).
3. Khusus transport SSH: buka SSH dengan autentikasi kunci. Kami merekomendasikan IP **Tailscale** untuk keterjangkauan stabil di luar LAN.

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

Ini menulis konfigurasi jarak jauh, menandai onboarding selesai, dan memungkinkan aplikasi mengelola transport yang dipilih saat dimulai.

1. Buka _Pengaturan → Umum_.
2. Di bawah **OpenClaw berjalan**, pilih **Jarak jauh** dan setel:
   - **Transport**: **Tunnel SSH** atau **Langsung (ws/wss)**.
   - **Target SSH**: `user@host` (opsional `:port`).
     - Jika Gateway berada di LAN yang sama dan mengiklankan Bonjour, pilih dari daftar yang ditemukan untuk mengisi bidang ini secara otomatis.
   - **URL Gateway** (hanya Langsung): `wss://gateway.example.ts.net` (atau `ws://...` untuk lokal/LAN).
   - **File identitas** (lanjutan): path ke kunci Anda.
   - **Root proyek** (lanjutan): path checkout jarak jauh yang digunakan untuk perintah.
   - **Path CLI** (lanjutan): path opsional ke entrypoint/binary `openclaw` yang dapat dijalankan (diisi otomatis ketika diiklankan).
3. Tekan **Uji jarak jauh**. Berhasil berarti `openclaw status --json` jarak jauh berjalan dengan benar. Kegagalan biasanya berarti masalah PATH/CLI; exit 127 berarti CLI tidak ditemukan secara jarak jauh.
4. Pemeriksaan kesehatan dan Web Chat sekarang akan berjalan otomatis melalui transport yang dipilih.

## Web Chat

- **Tunnel SSH**: Web Chat terhubung ke Gateway melalui port kontrol WebSocket yang diteruskan (default 18789).
- **Langsung (ws/wss)**: Web Chat terhubung langsung ke URL Gateway yang dikonfigurasi.
- Tidak ada lagi server HTTP WebChat terpisah.

## Izin

- Host jarak jauh memerlukan persetujuan TCC yang sama seperti lokal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Jalankan onboarding di mesin tersebut untuk memberikannya sekali.
- Node mengiklankan status izinnya melalui `node.list` / `node.describe` sehingga agen mengetahui apa yang tersedia.

## Catatan keamanan

- Lebih pilih bind loopback pada host jarak jauh dan hubungkan melalui SSH, Tailscale Serve, atau URL langsung Tailnet/LAN tepercaya.
- Tunneling SSH secara default memerlukan kunci host yang sudah tepercaya. Percayai kunci host terlebih dahulu agar ada di file known-hosts yang dikonfigurasi, atau pilih secara eksplisit `gateway.remote.sshHostKeyPolicy: "openssh"` untuk alias terkelola yang kebijakan kepercayaan OpenSSH-nya Anda terima.
- Jika Anda mengikat Gateway ke antarmuka non-loopback, wajibkan autentikasi Gateway yang valid: token, kata sandi, atau proxy balik sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Lihat [Keamanan](/id/gateway/security) dan [Tailscale](/id/gateway/tailscale).

## Alur login WhatsApp (jarak jauh)

- Jalankan `openclaw channels login --verbose` **di host jarak jauh**. Pindai QR dengan WhatsApp di ponsel Anda.
- Jalankan ulang login di host tersebut jika autentikasi kedaluwarsa. Pemeriksaan kesehatan akan menampilkan masalah tautan.

## Pemecahan masalah

- **exit 127 / tidak ditemukan**: `openclaw` tidak ada di PATH untuk shell non-login. Tambahkan ke `/etc/paths`, rc shell Anda, atau buat symlink ke `/usr/local/bin`/`/opt/homebrew/bin`.
- **Probe kesehatan gagal**: periksa keterjangkauan SSH, PATH, dan pastikan Baileys sudah login (`openclaw status --json`).
- **Web Chat macet**: pastikan Gateway berjalan di host jarak jauh dan port yang diteruskan cocok dengan port WS Gateway; UI memerlukan koneksi WS yang sehat.
- **IP node menampilkan 127.0.0.1**: ini diharapkan dengan tunnel SSH. Alihkan **Transport** ke **Langsung (ws/wss)** jika Anda ingin Gateway melihat IP klien yang sebenarnya.
- **Dashboard berfungsi tetapi kapabilitas Mac offline**: ini berarti koneksi operator/kontrol aplikasi sehat, tetapi koneksi node pendamping tidak terhubung atau kehilangan permukaan perintahnya. Buka bagian perangkat bilah menu dan periksa apakah Mac berstatus `paired · disconnected`. Untuk endpoint Tailscale Serve `wss://*.ts.net`, aplikasi mendeteksi pin leaf TLS legacy yang usang setelah rotasi sertifikat, menghapus pin usang ketika macOS memercayai sertifikat baru, dan mencoba ulang secara otomatis. Jika sertifikat tidak dipercaya sistem atau host bukan nama Tailscale Serve, setel `gateway.remote.tlsFingerprint` ke sidik jari sertifikat yang diharapkan, tinjau sertifikat, atau beralih ke **Jarak jauh melalui SSH**.
- **Voice Wake**: frasa pemicu diteruskan otomatis dalam mode jarak jauh; tidak diperlukan penerus terpisah.

## Suara notifikasi

Pilih suara per notifikasi dari skrip dengan `openclaw` dan `node.invoke`, misalnya:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Tidak ada lagi toggle "suara default" global di aplikasi; pemanggil memilih suara (atau tidak ada) per permintaan.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Akses jarak jauh](/id/gateway/remote)
