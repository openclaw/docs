---
read_when:
    - Menyiapkan atau men-debug kontrol Mac jarak jauh
summary: Alur aplikasi macOS untuk mengontrol Gateway OpenClaw jarak jauh
title: Kendali jarak jauh
x-i18n:
    generated_at: "2026-07-12T14:23:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Alur ini memungkinkan aplikasi macOS bertindak sebagai kendali jarak jauh penuh untuk Gateway OpenClaw yang berjalan di host lain (desktop/server). Aplikasi terhubung langsung ke URL Gateway LAN/Tailnet tepercaya, atau mengelola tunnel SSH ketika Gateway jarak jauh hanya tersedia melalui local loopback. Pemeriksaan kondisi, penerusan Voice Wake, dan Web Chat menggunakan kembali konfigurasi jarak jauh yang sama dari _Settings -> General_.

## Mode

- **Lokal (Mac ini)**: semuanya berjalan di laptop; tidak melibatkan SSH.
- **Jarak jauh melalui SSH (bawaan)**: perintah OpenClaw berjalan di host jarak jauh. Aplikasi membuka koneksi SSH dengan `-o BatchMode`, identitas/kunci pilihan Anda, dan penerusan porta lokal.
- **Jarak jauh langsung (ws/wss)**: tanpa tunnel SSH; aplikasi terhubung langsung ke URL Gateway (LAN, Tailscale, Tailscale Serve, atau proksi balik HTTPS publik).

## Transport jarak jauh

- **Tunnel SSH** (bawaan): menggunakan `ssh -N -L ...` untuk meneruskan porta Gateway ke localhost. Gateway melihat IP Node sebagai `127.0.0.1` karena tunnel menggunakan loopback.
- **Langsung (ws/wss)**: terhubung langsung ke URL Gateway. Gateway melihat IP klien yang sebenarnya.

Aplikasi menonaktifkan multipleks koneksi SSH dan proses latar belakang setelah autentikasi untuk proses SSH miliknya agar dapat memantau dan memulai ulang proses yang tepat, meskipun alias yang dipilih mengaktifkan `ControlMaster` atau `ForkAfterAuthentication`.

Verifikasi kunci host SSH bersifat ketat secara bawaan karena kredensial Gateway melewati tunnel ini. Untuk menggunakan perilaku kepercayaan milik alias SSH terkelola, tetapkan `--ssh-host-key-policy openssh` melalui `openclaw-mac configure-remote`, atau tetapkan `gateway.remote.sshHostKeyPolicy` ke `"openssh"` secara langsung. Tinjau alias dan setiap konfigurasi `Host *` yang cocok atau konfigurasi sistem sebelum mengaktifkannya. Mengubah target SSH (di aplikasi atau melalui `configure-remote`) akan mengembalikan kebijakan ke `strict`, kecuali Anda secara eksplisit mengaktifkannya lagi untuk target baru.

Dalam mode tunnel SSH, nama host LAN/tailnet yang ditemukan disimpan sebagai `gateway.remote.sshTarget`. Aplikasi mempertahankan `gateway.remote.url` pada titik akhir tunnel lokal (misalnya `ws://127.0.0.1:18789`) agar CLI, Web Chat, dan layanan host Node lokal semuanya menggunakan transport loopback yang sama. Ketika penemuan menghasilkan IP Tailnet mentah sekaligus nama host stabil, aplikasi mengutamakan nama Tailscale MagicDNS atau LAN agar koneksi lebih tahan terhadap perubahan alamat. Jika porta tunnel lokal berbeda dari porta Gateway jarak jauh, tetapkan `gateway.remote.remotePort` ke porta pada host jarak jauh.

Automasi peramban dalam mode jarak jauh dimiliki oleh host Node CLI, bukan Node aplikasi macOS native. Aplikasi memulai layanan host Node yang terpasang jika memungkinkan; untuk mengaktifkan kendali peramban dari Mac tersebut, pasang/mulai layanan dengan `openclaw node install ...` dan `openclaw node start` (atau jalankan `openclaw node run ...` di latar depan), lalu targetkan Node yang memiliki kemampuan peramban tersebut.

## Prasyarat pada host jarak jauh

1. Pasang Node + pnpm serta bangun/pasang CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Pastikan `openclaw` tersedia di PATH untuk shell noninteraktif (buat symlink ke `/usr/local/bin` atau `/opt/homebrew/bin` jika diperlukan).
3. Untuk transport SSH: siapkan autentikasi SSH berbasis kunci. IP Tailscale disarankan agar tetap dapat dijangkau secara stabil dari luar LAN.

## Penyiapan aplikasi macOS

Untuk melakukan prakonfigurasi aplikasi tanpa alur sambutan, melalui SSH:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Atau, untuk Gateway yang sudah dapat dijangkau melalui LAN atau Tailnet tepercaya, lewati SSH sepenuhnya:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Kedua bentuk tersebut menulis `~/.openclaw/openclaw.json`, menandai orientasi awal sebagai selesai, dan memungkinkan aplikasi mengelola transport yang dipilih pada saat berikutnya dimulai. `--local-port`/`--remote-port` secara bawaan bernilai `18789`. Flag lainnya: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Jalankan `openclaw-mac configure-remote --help` untuk referensi lengkap.

Untuk mengonfigurasi dari UI sebagai gantinya:

1. Buka _Settings -> General_.
2. Di bawah **OpenClaw runs**, pilih **Remote** dan tetapkan:
   - **Transport**: **SSH tunnel** atau **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:port` opsional). Jika Gateway berada di LAN yang sama dan menyiarkan Bonjour, pilih dari daftar yang ditemukan untuk mengisi bidang ini secara otomatis.
   - **Gateway URL** (hanya Direct): `wss://gateway.example.ts.net` (atau `ws://...` untuk lokal/LAN).
   - **Identity file** (lanjutan): jalur ke kunci Anda.
   - **Project root** (lanjutan): jalur checkout jarak jauh yang digunakan untuk perintah.
   - **CLI path** (lanjutan): jalur opsional ke titik masuk/biner `openclaw` yang dapat dijalankan (diisi otomatis ketika disiarkan).
3. Tekan **Test remote**. Keberhasilan berarti `openclaw status --json` jarak jauh berjalan dengan benar. Kegagalan biasanya menunjukkan masalah PATH/CLI; kode keluar 127 berarti CLI tidak ditemukan di host jarak jauh.
4. Pemeriksaan kondisi dan Web Chat kini berjalan secara otomatis melalui transport yang dipilih.

## Web Chat

- **Tunnel SSH**: terhubung ke Gateway melalui porta kendali WebSocket yang diteruskan (bawaan 18789).
- **Langsung (ws/wss)**: terhubung langsung ke URL Gateway yang dikonfigurasi.
- Tidak ada server HTTP Web Chat terpisah.

## Izin

- Host jarak jauh memerlukan persetujuan TCC yang sama seperti host lokal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Jalankan orientasi awal satu kali pada mesin tersebut untuk memberikannya.
- Node menyiarkan status izinnya melalui `node.list` / `node.describe` agar agen mengetahui apa yang tersedia.

## Catatan keamanan

- Utamakan pengikatan loopback pada host jarak jauh dan hubungkan melalui SSH, Tailscale Serve, atau URL langsung Tailnet/LAN tepercaya.
- Tunnel SSH secara bawaan memerlukan kunci host yang sudah tepercaya. Percayai kunci host terlebih dahulu (tambahkan ke berkas known-hosts yang dikonfigurasi), atau tetapkan `gateway.remote.sshHostKeyPolicy: "openssh"` secara eksplisit untuk alias terkelola yang kebijakan kepercayaan OpenSSH-nya Anda terima.
- Jika Anda mengikat Gateway ke antarmuka non-loopback, wajibkan autentikasi Gateway yang valid: token, kata sandi, atau proksi balik sadar-identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Lihat [Keamanan](/id/gateway/security) dan [Tailscale](/id/gateway/tailscale).

## Alur masuk WhatsApp (jarak jauh)

- Jalankan `openclaw channels login --channel whatsapp --verbose` **di host jarak jauh**. Pindai QR dengan WhatsApp di ponsel Anda.
- Jalankan ulang proses masuk di host tersebut jika autentikasi kedaluwarsa. Pemeriksaan kondisi menampilkan masalah penautan.

## Pemecahan masalah

| Gejala                                           | Penyebab / perbaikan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / tidak ditemukan                     | `openclaw` tidak ada di PATH untuk shell non-login. Tambahkan ke `/etc/paths`, berkas rc shell Anda, atau buat symlink ke `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Pemeriksaan kesehatan gagal                      | Periksa keterjangkauan SSH, PATH, dan pastikan Baileys (WhatsApp) sudah masuk (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Web Chat macet                                   | Pastikan Gateway berjalan di host jarak jauh dan port yang diteruskan sesuai dengan port WS Gateway; UI memerlukan koneksi WS yang sehat.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| IP Node menampilkan `127.0.0.1`                  | Hal ini wajar saat menggunakan terowongan SSH. Ubah **Transport** menjadi **Direct (ws/wss)** jika Anda ingin Gateway melihat IP klien yang sebenarnya.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Dasbor berfungsi tetapi kemampuan Mac luring     | Koneksi operator/kontrol berfungsi dengan baik, tetapi koneksi Node pendamping tidak tersambung atau tidak memiliki antarmuka perintahnya. Buka bagian perangkat di bilah menu dan periksa apakah Mac berstatus `paired · disconnected`. Untuk endpoint Tailscale Serve `wss://*.ts.net`, aplikasi mendeteksi pin sertifikat daun TLS lama yang sudah usang setelah rotasi sertifikat, menghapus pin usang tersebut setelah macOS memercayai sertifikat baru, lalu mencoba kembali secara otomatis. Jika sertifikat tidak dipercaya oleh sistem atau host bukan nama Tailscale Serve, tetapkan `gateway.remote.tlsFingerprint` ke sidik jari sertifikat yang diharapkan, tinjau sertifikat, atau beralih ke **Remote over SSH**. |
| Aktivasi Suara                                   | Frasa pemicu diteruskan secara otomatis dalam mode jarak jauh; tidak diperlukan penerus terpisah.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Suara notifikasi

Pilih suara untuk setiap notifikasi dari skrip dengan `openclaw nodes notify`, misalnya:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Tidak ada pengalih suara default global di aplikasi; pemanggil memilih suara (atau tanpa suara) untuk setiap permintaan.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Akses jarak jauh](/id/gateway/remote)
