---
read_when:
    - Anda menginginkan instalasi yang dapat direproduksi dan dapat dikembalikan
    - Anda sudah menggunakan Nix/NixOS/Home Manager
    - Anda ingin semuanya dikunci dan dikelola secara deklaratif
summary: Instal OpenClaw secara deklaratif dengan Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T09:17:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

Instal OpenClaw secara deklaratif dengan **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - modul Home Manager lengkap siap pakai.

<Info>
Repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) adalah sumber kebenaran untuk instalasi Nix. Halaman ini adalah ringkasan singkat.
</Info>

## Yang Anda dapatkan

- Gateway + aplikasi macOS + alat (whisper, spotify, kamera) -- semuanya dipin
- Layanan launchd yang tetap berjalan setelah reboot
- Sistem Plugin dengan konfigurasi deklaratif
- Rollback instan: `home-manager switch --rollback`

## Mulai cepat

<Steps>
  <Step title="Install Determinate Nix">
    Jika Nix belum terinstal, ikuti instruksi [penginstal Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Create a local flake">
    Gunakan templat agent-first dari repo nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configure secrets">
    Siapkan token bot perpesanan dan kunci API penyedia model Anda. File biasa di `~/.secrets/` sudah cukup.
  </Step>
  <Step title="Fill in template placeholders and switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verify">
    Pastikan layanan launchd sedang berjalan dan bot Anda merespons pesan.
  </Step>
</Steps>

Lihat [README nix-openclaw](https://github.com/openclaw/nix-openclaw) untuk opsi modul dan contoh lengkap.

## Perilaku runtime mode Nix

Ketika `OPENCLAW_NIX_MODE=1` ditetapkan (otomatis dengan nix-openclaw), OpenClaw memasuki mode deterministik yang menonaktifkan alur instalasi otomatis.

Anda juga dapat menetapkannya secara manual:

```bash
export OPENCLAW_NIX_MODE=1
```

Di macOS, aplikasi GUI tidak otomatis mewarisi variabel lingkungan shell. Aktifkan mode Nix melalui defaults sebagai gantinya:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Yang berubah dalam mode Nix

- Alur instalasi otomatis dan mutasi mandiri dinonaktifkan
- Dependensi yang hilang menampilkan pesan remediasi khusus Nix
- UI menampilkan banner mode Nix baca-saja

### Jalur konfigurasi dan state

OpenClaw membaca konfigurasi JSON5 dari `OPENCLAW_CONFIG_PATH` dan menyimpan data yang dapat berubah di `OPENCLAW_STATE_DIR`. Saat berjalan di bawah Nix, tetapkan ini secara eksplisit ke lokasi yang dikelola Nix agar state runtime dan konfigurasi tetap berada di luar store yang immutable.

| Variabel               | Default                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Penemuan PATH layanan

Layanan gateway launchd/systemd otomatis menemukan biner profil Nix sehingga
Plugin dan alat yang menjalankan executable terinstal `nix` melalui shell dapat bekerja tanpa
penyiapan PATH manual:

- Ketika `NIX_PROFILES` ditetapkan, setiap entri ditambahkan ke PATH layanan dalam
  prioritas kanan-ke-kiri (cocok dengan prioritas shell Nix - yang paling kanan menang).
- Ketika `NIX_PROFILES` tidak ditetapkan, `~/.nix-profile/bin` ditambahkan sebagai fallback.

Ini berlaku untuk lingkungan layanan launchd macOS dan systemd Linux.

## Terkait

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Modul Home Manager sumber kebenaran dan panduan penyiapan lengkap.
  </Card>
  <Card title="Setup wizard" href="/id/start/wizard" icon="wand-magic-sparkles">
    Panduan langkah demi langkah penyiapan CLI non-Nix.
  </Card>
  <Card title="Docker" href="/id/install/docker" icon="docker">
    Penyiapan terkontainerisasi sebagai alternatif non-Nix.
  </Card>
  <Card title="Updating" href="/id/install/updating" icon="arrow-up-right-from-square">
    Memperbarui instalasi yang dikelola Home Manager bersama paket.
  </Card>
</CardGroup>
