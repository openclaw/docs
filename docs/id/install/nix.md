---
read_when:
    - Anda menginginkan instalasi yang dapat direproduksi dan dibatalkan kembali
    - Anda sudah menggunakan Nix/NixOS/Home Manager
    - Anda ingin semuanya dipatok dan dikelola secara deklaratif
summary: Instal OpenClaw secara deklaratif dengan Nix
title: Nix
x-i18n:
    generated_at: "2026-07-12T14:19:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Instal OpenClaw secara deklaratif dengan **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, modul Home Manager resmi dengan semua komponen yang diperlukan.

<Info>
Repositori [nix-openclaw](https://github.com/openclaw/nix-openclaw) adalah sumber acuan untuk instalasi Nix. Halaman ini merupakan ikhtisar singkat.
</Info>

## Yang Anda dapatkan

- Gateway + aplikasi macOS + alat (whisper, spotify, kamera), semuanya dikunci ke versi tertentu
- Layanan launchd yang tetap berjalan setelah sistem dimulai ulang
- Sistem Plugin dengan konfigurasi deklaratif
- Pengembalian instan: `home-manager switch --rollback`

## Mulai cepat

<Steps>
  <Step title="Instal Determinate Nix">
    Jika Nix belum terinstal, ikuti petunjuk [penginstal Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Buat flake lokal">
    Gunakan templat yang mengutamakan agen dari repositori nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Salin templates/agent-first/flake.nix dari repositori nix-openclaw
    ```
  </Step>
  <Step title="Konfigurasikan rahasia">
    Siapkan token bot perpesanan dan kunci API penyedia model Anda. Berkas biasa di `~/.secrets/` dapat digunakan.
  </Step>
  <Step title="Isi placeholder templat dan terapkan">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifikasi">
    Pastikan layanan launchd berjalan dan bot Anda merespons pesan.
  </Step>
</Steps>

Lihat [README nix-openclaw](https://github.com/openclaw/nix-openclaw) untuk opsi dan contoh modul lengkap.

## Perilaku runtime mode Nix

Saat `OPENCLAW_NIX_MODE=1` ditetapkan (otomatis dengan nix-openclaw), OpenClaw memasuki mode deterministik untuk instalasi yang dikelola Nix. Paket Nix lainnya dapat menetapkan mode yang sama; nix-openclaw adalah acuan resmi.

Anda juga dapat menetapkannya secara manual:

```bash
export OPENCLAW_NIX_MODE=1
```

Di macOS, aplikasi GUI tidak mewarisi variabel lingkungan shell. Aktifkan mode Nix melalui `defaults` sebagai gantinya:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Perubahan dalam mode Nix

- Alur instalasi otomatis dan modifikasi mandiri dinonaktifkan.
- `openclaw.json` diperlakukan sebagai berkas yang tidak dapat diubah. Nilai default yang diturunkan saat startup hanya berlaku saat runtime, dan penulis konfigurasi (penyiapan, orientasi awal, `openclaw update` yang melakukan perubahan, instalasi/pembaruan/penghapusan/pengaktifan Plugin, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) tidak akan mengedit berkas tersebut.
- Edit sumber Nix sebagai gantinya. Untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen dan tetapkan konfigurasi di `programs.openclaw.config` atau `instances.<name>.config`.
- Dependensi yang tidak tersedia akan menampilkan pesan perbaikan khusus Nix.
- UI menampilkan banner mode Nix hanya-baca.

### Jalur konfigurasi dan status

OpenClaw membaca konfigurasi JSON5 dari `OPENCLAW_CONFIG_PATH` dan menyimpan data yang dapat diubah di `OPENCLAW_STATE_DIR`. Di bawah Nix, tetapkan keduanya secara eksplisit ke lokasi yang dikelola Nix agar status runtime dan konfigurasi tetap berada di luar penyimpanan yang tidak dapat diubah.

| Variabel               | Default                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Penemuan PATH layanan

Layanan gateway launchd/systemd secara otomatis menemukan biner profil Nix sehingga Plugin dan alat yang menjalankan berkas yang dapat dieksekusi hasil instalasi `nix` melalui shell dapat berfungsi tanpa penyiapan PATH secara manual:

- Saat `NIX_PROFILES` ditetapkan, setiap entri ditambahkan ke PATH layanan dengan urutan prioritas dari kanan ke kiri (sesuai dengan prioritas shell Nix: yang paling kanan diprioritaskan).
- Saat `NIX_PROFILES` tidak ditetapkan, `~/.nix-profile/bin` ditambahkan sebagai cadangan.

Hal ini berlaku untuk lingkungan layanan launchd macOS dan systemd Linux.

## Terkait

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Modul Home Manager sumber acuan dan panduan penyiapan lengkap.
  </Card>
  <Card title="Wizard penyiapan" href="/id/start/wizard" icon="wand-magic-sparkles">
    Panduan langkah demi langkah penyiapan CLI non-Nix.
  </Card>
  <Card title="Docker" href="/id/install/docker" icon="docker">
    Penyiapan dalam kontainer sebagai alternatif non-Nix.
  </Card>
  <Card title="Pembaruan" href="/id/install/updating" icon="arrow-up-right-from-square">
    Memperbarui instalasi yang dikelola Home Manager bersama paketnya.
  </Card>
</CardGroup>
