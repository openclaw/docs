---
read_when:
    - Anda menginginkan instalasi yang dapat direproduksi dan di-rollback
    - Anda sudah menggunakan Nix/NixOS/Home Manager
    - Anda ingin semuanya dipin dan dikelola secara deklaratif
summary: Pasang OpenClaw secara deklaratif dengan Nix
title: Nix
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T13:48:54Z"
  model: gpt-5.4
  provider: openai
  source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
  source_path: install/nix.md
  workflow: 15
---

Pasang OpenClaw secara deklaratif dengan **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — modul Home Manager lengkap.

<Info>
Repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) adalah sumber utama untuk instalasi Nix. Halaman ini adalah ikhtisar singkat.
</Info>

## Yang Anda dapatkan

- Gateway + aplikasi macOS + alat (whisper, spotify, cameras) -- semuanya dipin
- Layanan launchd yang bertahan setelah reboot
- Sistem Plugin dengan konfigurasi deklaratif
- Rollback instan: `home-manager switch --rollback`

## Mulai cepat

<Steps>
  <Step title="Pasang Determinate Nix">
    Jika Nix belum terpasang, ikuti petunjuk [installer Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Buat flake lokal">
    Gunakan template agent-first dari repo nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Konfigurasikan secret">
    Siapkan token bot pesan dan key API penyedia model Anda. File biasa di `~/.secrets/` sudah cukup.
  </Step>
  <Step title="Isi placeholder template dan switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifikasi">
    Pastikan layanan launchd berjalan dan bot Anda merespons pesan.
  </Step>
</Steps>

Lihat [README nix-openclaw](https://github.com/openclaw/nix-openclaw) untuk opsi modul dan contoh lengkap.

## Perilaku runtime mode Nix

Saat `OPENCLAW_NIX_MODE=1` diatur (otomatis dengan nix-openclaw), OpenClaw masuk ke mode deterministik yang menonaktifkan alur auto-install.

Anda juga dapat mengaturnya secara manual:

```bash
export OPENCLAW_NIX_MODE=1
```

Di macOS, aplikasi GUI tidak otomatis mewarisi variabel environment shell. Aktifkan mode Nix melalui defaults sebagai gantinya:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Apa yang berubah dalam mode Nix

- Alur auto-install dan self-mutation dinonaktifkan
- Dependensi yang hilang menampilkan pesan remediasi khusus Nix
- UI menampilkan banner mode Nix hanya-baca

### Path konfigurasi dan status

OpenClaw membaca konfigurasi JSON5 dari `OPENCLAW_CONFIG_PATH` dan menyimpan data yang dapat berubah di `OPENCLAW_STATE_DIR`. Saat berjalan di bawah Nix, atur keduanya secara eksplisit ke lokasi yang dikelola Nix agar status runtime dan konfigurasi tetap di luar immutable store.

| Variabel               | Default                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Penemuan PATH layanan

Layanan gateway launchd/systemd secara otomatis menemukan biner profil Nix sehingga
Plugin dan alat yang menjalankan executable yang dipasang dengan `nix` dapat berfungsi tanpa
penyiapan PATH manual:

- Saat `NIX_PROFILES` diatur, setiap entri ditambahkan ke PATH layanan dengan
  prioritas kanan-ke-kiri (sesuai prioritas shell Nix — yang paling kanan menang).
- Saat `NIX_PROFILES` tidak diatur, `~/.nix-profile/bin` ditambahkan sebagai fallback.

Ini berlaku untuk environment layanan launchd macOS maupun systemd Linux.

## Terkait

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- panduan penyiapan lengkap
- [Wizard](/id/start/wizard) -- penyiapan CLI non-Nix
- [Docker](/id/install/docker) -- penyiapan berbasis container
