---
read_when:
    - Menyiapkan atau men-debug kontrol Mac jarak jauh
summary: Alur aplikasi macOS untuk mengontrol Gateway OpenClaw jarak jauh
title: Kendali jarak jauh
x-i18n:
    generated_at: "2026-07-22T01:25:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7238ff381b93223f96236246a96190ee1d62fa4313bff272ec24be9439fb7a8d
    source_path: platforms/mac/remote.md
    workflow: 16
---

Alur ini memungkinkan aplikasi macOS berfungsi sebagai kendali jarak jauh penuh untuk Gateway OpenClaw yang berjalan di host lain (desktop/server). Aplikasi terhubung langsung ke URL Gateway LAN/Tailnet tepercaya, atau mengelola terowongan SSH saat Gateway jarak jauh hanya dapat diakses melalui loopback. Pemeriksaan kesehatan, penerusan Voice Wake, dan Web Chat menggunakan kembali konfigurasi jarak jauh yang sama dari _Settings -> General_.

## Mode

- **Lokal (Mac ini)**: semuanya berjalan di laptop; tidak melibatkan SSH.
- **Jarak jauh melalui SSH (default)**: perintah OpenClaw berjalan di host jarak jauh. Aplikasi membuka koneksi SSH dengan `-o BatchMode`, identitas/kunci pilihan Anda, dan penerusan port lokal.
- **Jarak jauh langsung (ws/wss)**: tanpa terowongan SSH; aplikasi terhubung langsung ke URL Gateway (LAN, Tailscale, Tailscale Serve, atau proksi balik HTTPS publik).

## Transportasi jarak jauh

- **Terowongan SSH** (default): menggunakan `ssh -N -L ...` untuk meneruskan port Gateway ke localhost. Gateway melihat IP Node sebagai `127.0.0.1` karena terowongan menggunakan loopback.
- **Langsung (ws/wss)**: terhubung langsung ke URL Gateway. Gateway melihat IP klien yang sebenarnya.

Aplikasi menonaktifkan multipleks koneksi SSH dan proses latar belakang pascaautentikasi untuk proses SSH miliknya agar dapat memantau dan memulai ulang proses yang tepat, meskipun alias yang dipilih mengaktifkan `ControlMaster` atau `ForkAfterAuthentication`.

Verifikasi kunci host SSH bersifat ketat secara default karena kredensial Gateway melewati terowongan ini. Untuk menggunakan perilaku kepercayaan milik alias SSH terkelola, tetapkan `--ssh-host-key-policy openssh` melalui `openclaw-mac configure-remote`, atau tetapkan `gateway.remote.sshHostKeyPolicy` langsung ke `"openssh"`. Tinjau alias tersebut serta setiap `Host *` yang cocok atau konfigurasi sistem sebelum mengaktifkannya. Mengubah target SSH (di aplikasi atau melalui `configure-remote`) mereset kebijakan kembali ke `strict`, kecuali Anda mengaktifkannya kembali secara eksplisit untuk target baru.

Dalam mode terowongan SSH, nama host LAN/tailnet yang ditemukan disimpan sebagai `gateway.remote.sshTarget`. Aplikasi mempertahankan `gateway.remote.url` pada titik akhir terowongan lokal (misalnya `ws://127.0.0.1:18789`) agar CLI, Web Chat, dan layanan host Node lokal semuanya menggunakan transportasi loopback yang sama. Saat penemuan menghasilkan IP Tailnet mentah dan nama host stabil, aplikasi lebih memilih nama Tailscale MagicDNS atau LAN agar koneksi lebih mampu bertahan terhadap perubahan alamat. Jika port terowongan lokal berbeda dari port Gateway jarak jauh, tetapkan `gateway.remote.remotePort` ke port pada host jarak jauh.

Automasi browser dalam mode jarak jauh dimiliki oleh host Node CLI, bukan Node aplikasi macOS native. Aplikasi memulai layanan host Node yang terpasang jika memungkinkan; untuk mengaktifkan kendali browser dari Mac tersebut, pasang/mulai layanan itu dengan `openclaw node install ...` dan `openclaw node start` (atau jalankan `openclaw node run ...` di latar depan), lalu targetkan Node yang mendukung browser tersebut.

## Prasyarat pada host jarak jauh

1. Pasang Node + pnpm dan bangun/pasang CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Pastikan `openclaw` tersedia di PATH untuk shell noninteraktif (buat symlink ke `/usr/local/bin` atau `/opt/homebrew/bin` jika diperlukan).
3. Untuk transportasi SSH: siapkan autentikasi SSH berbasis kunci. IP Tailscale direkomendasikan untuk keterjangkauan yang stabil dari luar LAN.

## Penyiapan aplikasi macOS

Untuk melakukan prakonfigurasi aplikasi tanpa alur sambutan, melalui SSH:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Atau untuk Gateway yang sudah dapat dijangkau melalui LAN atau Tailnet tepercaya, lewati SSH sepenuhnya:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

`openclaw-mac connect`, `wizard`, dan `configure-remote` menentukan konfigurasi aktif dalam urutan berikut: `OPENCLAW_CONFIG_PATH`, lalu `$OPENCLAW_STATE_DIR/openclaw.json`, kemudian `~/.openclaw/openclaw.json`. Kedua bentuk konfigurasi menulis ke berkas aktif tersebut, menandai onboarding sebagai selesai, dan memungkinkan aplikasi mengelola transportasi yang dipilih pada saat dimulai berikutnya. `--local-port`/`--remote-port` menggunakan `18789` secara default. Flag lainnya: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Jalankan `openclaw-mac configure-remote --help` untuk referensi lengkap.

Untuk mengonfigurasi dari UI:

1. Buka _Settings -> General_.
2. Di bawah **OpenClaw berjalan**, pilih **Jarak Jauh** dan tetapkan:
   - **Transportasi**: **Terowongan SSH** atau **Langsung (ws/wss)**.
   - **Target SSH**: `user@host` (`:port` opsional). Jika Gateway berada di LAN yang sama dan mengiklankan Bonjour, pilih dari daftar yang ditemukan untuk mengisi kolom ini secara otomatis.
   - **URL Gateway** (khusus Langsung): `wss://gateway.example.ts.net` (atau `ws://...` untuk lokal/LAN).
   - **Berkas identitas** (lanjutan): jalur ke kunci Anda.
   - **Root proyek** (lanjutan): jalur checkout jarak jauh yang digunakan untuk perintah.
   - **Jalur CLI** (lanjutan): jalur opsional ke titik masuk/biner `openclaw` yang dapat dijalankan (diisi otomatis saat diiklankan).
3. Tekan **Uji jarak jauh**. Keberhasilan berarti `openclaw status --json` jarak jauh berjalan dengan benar. Kegagalan biasanya berarti masalah PATH/CLI; kode keluar 127 berarti CLI tidak ditemukan dari jarak jauh.
4. Pemeriksaan kesehatan dan Web Chat kini berjalan secara otomatis melalui transportasi yang dipilih.

## Web Chat

- **Terowongan SSH**: terhubung ke Gateway melalui port kendali WebSocket yang diteruskan (default 18789).
- **Langsung (ws/wss)**: terhubung langsung ke URL Gateway yang dikonfigurasi.
- Tidak ada server HTTP Web Chat terpisah.

## Izin

- Host jarak jauh memerlukan persetujuan TCC yang sama seperti host lokal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Jalankan onboarding satu kali pada mesin tersebut untuk memberikannya.
- Node mengiklankan status izinnya melalui `node.list` / `node.describe` agar agen mengetahui apa yang tersedia.

## Catatan keamanan

- Utamakan binding loopback pada host jarak jauh dan hubungkan melalui SSH, Tailscale Serve, atau URL langsung Tailnet/LAN tepercaya.
- Terowongan SSH memerlukan kunci host yang sudah dipercaya secara default. Percayai kunci host terlebih dahulu (tambahkan ke berkas known-hosts yang dikonfigurasi), atau tetapkan `gateway.remote.sshHostKeyPolicy: "openssh"` secara eksplisit untuk alias terkelola yang kebijakan kepercayaan OpenSSH-nya Anda terima.
- Jika Anda mengikat Gateway ke antarmuka non-loopback, wajibkan autentikasi Gateway yang valid: token, kata sandi, atau proksi balik berbasis identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Lihat [Keamanan](/id/gateway/security) dan [Tailscale](/id/gateway/tailscale).

## Alur masuk WhatsApp (jarak jauh)

- Jalankan `openclaw channels login --channel whatsapp --verbose` **pada host jarak jauh**. Pindai kode QR dengan WhatsApp di ponsel Anda.
- Jalankan kembali proses masuk pada host tersebut jika autentikasi kedaluwarsa. Pemeriksaan kesehatan menampilkan masalah penautan.

## Pemecahan masalah

| Gejala                                          | Penyebab / perbaikan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / tidak ditemukan                           | `openclaw` tidak berada di PATH untuk shell non-login. Tambahkan ke `/etc/paths`, berkas rc shell Anda, atau buat symlink ke `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Pemeriksaan kesehatan gagal                              | Periksa keterjangkauan SSH, PATH, dan pastikan Baileys (WhatsApp) telah masuk (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Web Chat macet                                   | Pastikan Gateway berjalan di host jarak jauh dan port yang diteruskan sesuai dengan port WS Gateway; UI memerlukan koneksi WS yang sehat.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| IP Node menampilkan `127.0.0.1`                        | Hal ini wajar saat menggunakan terowongan SSH. Ubah **Transport** ke **Direct (ws/wss)** jika Anda ingin Gateway melihat IP klien yang sebenarnya.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Dasbor berfungsi, tetapi kemampuan Mac luring | Koneksi operator/kontrol berfungsi dengan baik, tetapi koneksi Node pendamping tidak tersambung atau tidak memiliki antarmuka perintahnya. Buka bagian perangkat pada bilah menu dan periksa apakah Mac `paired · disconnected`. Untuk titik akhir Tailscale Serve `wss://*.ts.net`, aplikasi mendeteksi pin sertifikat TLS leaf lama yang sudah usang setelah rotasi sertifikat, menghapus pin usang tersebut setelah macOS memercayai sertifikat baru, lalu mencoba kembali secara otomatis. Jika sertifikat tidak dipercaya oleh sistem atau host bukan nama Tailscale Serve, tetapkan `gateway.remote.tlsFingerprint` ke sidik jari sertifikat yang diharapkan, tinjau sertifikat, atau beralih ke **Remote over SSH**. |
| Voice Wake                                       | Frasa pemicu diteruskan secara otomatis dalam mode jarak jauh; tidak diperlukan penerus terpisah.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Suara notifikasi

Pilih suara untuk setiap notifikasi dari skrip dengan `openclaw nodes notify`, misalnya:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Gateway jarak jauh siap" --sound Glass
```

Tidak ada tombol suara default global di aplikasi; pemanggil memilih suara (atau tanpa suara) untuk setiap permintaan.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [Akses jarak jauh](/id/gateway/remote)
