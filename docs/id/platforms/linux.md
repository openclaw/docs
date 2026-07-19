---
read_when:
    - Mencari status aplikasi pendamping Linux
    - Mengaktifkan kamera, lokasi, atau notifikasi pada host Node Linux
    - Merencanakan cakupan platform atau kontribusi
    - Men-debug penghentian proses oleh OOM Linux atau kode keluar 137 pada VPS atau kontainer
summary: Status dukungan Linux + aplikasi pendamping
title: Aplikasi Linux
x-i18n:
    generated_at: "2026-07-19T05:09:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea38a6a70596713074c0caf55512da76e4239672224c9a62c044ce25ef930c0f
    source_path: platforms/linux.md
    workflow: 16
---

Gateway didukung sepenuhnya di Linux dan memerlukan Node. Bun masih dapat digunakan
sebagai penginstal dependensi atau penjalan skrip paket, tetapi tidak dapat menjalankan OpenClaw
karena tidak menyediakan `node:sqlite`.

## Pendamping desktop

Pendamping OpenClaw untuk Linux adalah aplikasi desktop Tauri untuk Gateway lokal. Aplikasi ini:

- menginstal CLI OpenClaw dan runtime Node terkelola jika belum tersedia; build rilis menginstal saluran stabil secara otomatis, sedangkan build pengembangan meminta saluran terlebih dahulu
- terhubung ke Gateway yang sehat sebelum mencoba mengubah layanan
- mendelegasikan operasi instalasi, mulai, berhenti, dan mulai ulang ke layanan pengguna systemd yang dikelola CLI
- menemukan Gateway Bonjour di sekitar dan membuka UI Kontrolnya dari endpoint layanan yang telah diresolusi
- membuka UI Kontrol yang disajikan Gateway dengan URL autentikasi yang telah diresolusi
- membuka UI Kontrol dalam mode orientasi setelah instalasi pertama, yang
  menawarkan impor memori Claude Code, Codex, atau Hermes yang terdeteksi ke
  ruang kerja agen (impor yang sama tetap tersedia kemudian melalui
  Pengaturan → Impor Memori)
- merender Canvas yang digerakkan agen dan konten A2UI bawaan untuk host Node CLI yang berada di lokasi yang sama
- tetap tersedia dari baki sistem ketika jendelanya ditutup

Rilis stabil yang dibuat dari `main` menyertakan bundel `.deb` dan AppImage sebagai aset dalam
[rilis GitHub](https://github.com/openclaw/openclaw/releases) untuk tag tersebut,
bernama `OpenClaw-<version>-amd64.deb` dan `OpenClaw-<version>-amd64.AppImage`,
dengan file checksum `SHA256SUMS.linux-app.txt` di sebelahnya. Unduh
`.deb` dan instal dengan `sudo apt install ./OpenClaw-<version>-amd64.deb`,
atau tandai AppImage sebagai dapat dieksekusi dan jalankan secara langsung. Runtime AppImage
memerlukan FUSE 2 (`sudo apt install libfuse2`, atau `libfuse2t64` pada Ubuntu 24.04+);
tanpanya, jalankan AppImage dengan `APPIMAGE_EXTRACT_AND_RUN=1`.

Anda juga dapat membuat bundel yang sama dari checkout sumber:

```bash
cd apps/linux/src-tauri
pnpm dlx @tauri-apps/cli@2.11.4 build --bundles deb,appimage
```

Alur kerja CI `Linux App` mengunggah bundel yang sama sebagai
artefak `openclaw-linux-companion` untuk pull request yang menyentuh aplikasi dan untuk
proses manual. Lihat `apps/linux/README.md` di repositori untuk dependensi build Linux
dan perintah pengembangan.

### Obrolan Cepat

Buka Obrolan Cepat dengan `Ctrl+Shift+Space` atau item baki **Obrolan Cepat**. Chip agen
menampilkan avatar, emoji, atau monogram yang dikonfigurasi; pilih chip tersebut untuk beralih agen.
Pesan menggunakan sesi utama agen yang dipilih dan mematuhi cakupan sesi global.
Klien Rust native memiliki identitas perangkat Ed25519 persisten. Klien tersebut menggunakan
token atau kata sandi bersama dari serah terima CLI hanya untuk memulai pemasangan, lalu menyimpan dan
mengutamakan token perangkat yang diterbitkan Gateway pada koneksi berikutnya. Identitas dan
token perangkat disimpan di direktori konfigurasi aplikasi dalam file bermode `0600`; WebView
Obrolan Cepat tidak menerima kredensial maupun WebSocket.

Ketika koneksi native tidak tersedia, Obrolan Cepat menampilkan **Gateway
tidak dapat dijangkau — mencoba kembali** dan menonaktifkan pengiriman hingga tersambung kembali. Perangkat jarak jauh
yang telah mencapai tahap pemasangan menampilkan **Setujui perangkat ini di dasbor
(Node)** sebagai gantinya, disertai ID perangkat singkat jika Gateway menyediakannya. Gateway
yang memerlukan kredensial bersama yang tidak tersedia menampilkan **Gateway memerlukan
kredensial — buka dasbor pada host gateway**; tidak ada permintaan pemasangan yang
menunggu persetujuan dalam keadaan tersebut. Panduan perbaikan yang disediakan server
menggantikan pemberitahuan cadangan ini jika lebih spesifik.
Untuk Gateway TLS, CLI menyerahkan sidik jari SHA-256 sertifikat Gateway
kepada aplikasi; klien native menyematkan sertifikat tersebut dan melaporkan **Kepercayaan TLS Gateway
gagal — periksa sidik jari sertifikat** secara terpisah dari waktu henti.
Gateway yang rahasia bersamanya dikonfigurasi melalui SecretRef tidak menyertakannya dalam
serah terima CLI. Instalasi yang telah dipasangkan tetap berfungsi melalui token perangkat
yang tersimpan, tetapi instalasi baru tidak dapat membuat permintaan pemasangan tertunda dengan autentikasi
rahasia bersama tanpa kredensial pemulai tersebut.
Penukaran kode penyiapan dan `bootstrapToken` memerlukan UI produk khusus dan tetap
menjadi tindak lanjut; Obrolan Cepat tidak mencoba kedua alur tersebut.

Pada X11, gunakan roda gigi di Obrolan Cepat untuk merekam atau mengatur ulang pintasan khusus. Tombol
baki **Pintasan Obrolan Cepat** mengaktifkan atau menonaktifkannya tanpa menonaktifkan
item baki **Obrolan Cepat** biasa. Pintasan global tidak tersedia di Wayland, sehingga
pengaturan pintasan disembunyikan dan item baki tetap menjadi titik masuk.
Setelah pengiriman diterima, Obrolan Cepat tetap terbuka dan mengalirkan balasan teks biasa
dari agen yang dipilih di bawah penyusun pesan. Tekan `Esc` untuk menutup bilah dan balasannya;
`Ctrl+Enter` tetap membuka dasbor.

### Canvas

Canvas Linux menggunakan dua proses yang bekerja sama. `openclaw node run` tetap menjadi satu-satunya koneksi Node Gateway; plugin `linux-canvas` bawaan meneruskan panggilan `canvas.*` ke aplikasi desktop yang sedang berjalan melalui soket Unix khusus pengguna. Aplikasi memiliki satu jendela WebView sesuai permintaan, termasuk perender A2UI bawaan dan jembatan tindakan kembali ke agen.

Plugin diaktifkan secara default. Plugin mengiklankan Canvas hanya ketika soket desktop tersedia di `$XDG_RUNTIME_DIR/openclaw-canvas.sock`, atau `/tmp/openclaw-canvas-$UID.sock` ketika `XDG_RUNTIME_DIR` tidak tersedia. Nonaktifkan dengan `plugins.entries.linux-canvas.enabled: false`. Pada server Linux headless tanpa aplikasi desktop, Canvas tidak diiklankan.

Linux v1 menggunakan satu jendela Canvas. Halaman HTTP dan HTTPS dapat dirender, tetapi tindakan A2UI hanya diterima dari perender bawaan.

## Alternatif CLI dan SSH

CLI tetap menjadi opsi paling sederhana untuk server headless, VPS, atau Gateway jarak jauh:

1. Instal Node 24.15+ (disarankan), Node 22.22.3+ (LTS), atau Node 25.9+.
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dari laptop Anda: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Buka `http://127.0.0.1:18789/` dan lakukan autentikasi dengan rahasia bersama yang dikonfigurasi
   (token secara default; kata sandi jika `gateway.auth.mode` adalah `"password"`).

Panduan server lengkap: [Server Linux](/id/vps). Contoh VPS langkah demi langkah:
[exe.dev](/id/install/exe-dev).

## Kapabilitas Node

Plugin Node Linux bawaan memberikan kapabilitas perangkat layanan `openclaw node` kepada CLI tanpa memerlukan aplikasi desktop. Perintah diiklankan ke Gateway hanya ketika kapabilitasnya diaktifkan dan alat lokal yang diperlukan tersedia.

| Kapabilitas                              | Default | Persyaratan                                                           |
| --------------------------------------- | ------- | --------------------------------------------------------------------- |
| Notifikasi desktop (`system.notify`) | Aktif      | `notify-send` dari libnotify dan sesi notifikasi desktop       |
| Foto dan klip kamera (`camera.*`)    | Nonaktif     | FFmpeg, akses kamera V4L2, serta PulseAudio atau PipeWire untuk audio klip |
| Lokasi (`location.get`)               | Nonaktif     | GeoClue2 dan demo `where-am-i` miliknya                                    |

Konfigurasikan plugin di `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          notify: { enabled: true },
          camera: { enabled: true },
          location: { enabled: true },
        },
      },
    },
  },
}
```

Mulai ulang layanan Node setelah mengubah pengaturan ini. Ketersediaan ditentukan satu kali per proses dan iklan Node dibuat ulang saat dimulai ulang.

Gateway menyetujui permukaan perintah dan kapabilitas Node secara terpisah dari pemasangan perangkat. Pada saat pertama kali dimulai, atau setelah mengaktifkan lebih banyak kapabilitas, setujui permukaan yang tertunda:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Node dapat terhubung dan dipasangkan dengan perangkat sementara `caps` dan `commands` efektifnya tetap kosong hingga persetujuan ini selesai.

Perangkat kamera harus dapat dibaca oleh pengguna layanan, biasanya melalui grup `video`. Klip kamera menggunakan sumber PulseAudio atau PipeWire default ketika `includeAudio` bernilai benar; audio mikrofon hanya tersedia sebagai trek klip tersebut, bukan sebagai perintah mandiri. Lokasi mengharuskan pengguna layanan Node diizinkan oleh kebijakan GeoClue host.

`camera.snap` dan `camera.clip` juga memerlukan pengaktifan Gateway secara eksplisit melalui `gateway.nodes.allowCommands`. Lihat [Pengambilan gambar kamera](/id/nodes/camera) dan [Perintah lokasi](/id/nodes/location-command) untuk payload, batas, dan kesalahan.

## Instalasi

- [Memulai](/id/start/getting-started)
- [Instalasi & pembaruan](/id/install/updating)
- Opsional: [Alur kerja paket Bun](/id/install/bun), [Nix](/id/install/nix), [Docker](/id/install/docker)

## Layanan Gateway (systemd)

Instal dengan salah satu cara berikut:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # pilih "Gateway service" saat diminta
```

Perbaiki atau migrasikan instalasi yang sudah ada:

```bash
openclaw doctor
```

`openclaw gateway install` merender unit **pengguna** systemd secara default. Panduan
layanan lengkap, termasuk varian unit tingkat **sistem** untuk host bersama atau
yang selalu aktif, tersedia dalam [panduan operasional Gateway](/id/gateway#supervision-and-service-lifecycle).

Tulis unit secara manual hanya untuk penyiapan khusus. Contoh unit pengguna minimal
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Unit yang ditulis manual tidak mewarisi penentuan ukuran heap adaptif yang ditulis `openclaw gateway install` untuk layanan Gateway terkelola. Utamakan penginstal terkelola, atau tetapkan batas heap eksplisit di supervisor khusus setelah memperhitungkan ruang cadangan memori native.

Aktifkan:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Tekanan memori dan penghentian OOM

Di Linux, kernel memilih korban OOM ketika host, VM, atau cgroup kontainer
kehabisan memori. Gateway bukan korban yang tepat karena memiliki sesi
berumur panjang dan koneksi saluran, sehingga OpenClaw mengutamakan proses anak
sementara agar dihentikan terlebih dahulu jika memungkinkan.

Untuk peluncuran proses anak Linux yang memenuhi syarat, OpenClaw membungkus perintah dalam shim
`/bin/sh` singkat yang menaikkan `oom_score_adj` milik proses anak menjadi `1000`, lalu
melakukan `exec` terhadap perintah sebenarnya. Operasi ini tidak memerlukan hak istimewa: proses selalu dapat menaikkan
skor OOM miliknya sendiri.

Permukaan proses anak yang tercakup:

- Proses anak perintah yang dikelola supervisor
- Proses anak shell PTY
- Proses anak server stdio MCP
- Proses browser/Chrome yang diluncurkan OpenClaw (melalui runtime proses SDK plugin)

Pembungkus ini hanya untuk Linux dan dilewati ketika `/bin/sh` tidak tersedia, atau ketika
lingkungan proses anak menetapkan `OPENCLAW_CHILD_OOM_SCORE_ADJ` menjadi `0`, `false`, `no`, atau
`off`.

Verifikasi proses anak:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Nilai yang diharapkan untuk proses anak yang tercakup adalah `1000`; proses Gateway itu sendiri
mempertahankan skor normalnya (biasanya `0`).

`OOMPolicy=continue` milik unit systemd menjaga layanan Gateway tetap berjalan ketika
proses anak sementara dipilih oleh penghenti OOM, alih-alih menandai seluruh
unit gagal dan memulai ulang semua saluran; proses anak/sesi yang gagal melaporkan
kesalahannya sendiri.

Ini tidak menggantikan penyesuaian memori normal. Jika VPS atau kontainer berulang kali
menghentikan proses anak, naikkan batas memori, kurangi konkurensi, atau tambahkan
kontrol sumber daya yang lebih ketat (`MemoryMax=` systemd, batas memori kontainer).

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Server Linux](/id/vps)
- [Raspberry Pi](/id/install/raspberry-pi)
- [Panduan operasional Gateway](/id/gateway)
- [Konfigurasi Gateway](/id/gateway/configuration)
