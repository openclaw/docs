---
read_when:
    - Anda menginginkan instalasi yang reproduktif dan dapat di-rollback
    - Anda sudah menggunakan Nix/NixOS/Home Manager
    - Anda menginginkan semuanya dipin dan dikelola secara deklaratif
summary: Pasang OpenClaw secara deklaratif dengan Nix
title: Nix
x-i18n:
    generated_at: "2026-04-05T13:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e1e73533db1350d82d3a786092b4328121a082dfeeedee7c7574021dada546
    source_path: install/nix.md
    workflow: 15
---

# Instalasi Nix

Pasang OpenClaw secara deklaratif dengan **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** -- modul Home Manager lengkap.

<Info>
Repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) adalah sumber kebenaran untuk instalasi Nix. Halaman ini adalah ringkasan singkat.
</Info>

## Yang Anda dapatkan

- Gateway + aplikasi macOS + alat (whisper, spotify, cameras) -- semuanya dipin
- Layanan launchd yang tetap berjalan setelah reboot
- Sistem plugin dengan konfigurasi deklaratif
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
    Siapkan token bot pesan dan kunci API provider model Anda. File biasa di `~/.secrets/` sudah cukup baik.
  </Step>
  <Step title="Isi placeholder template lalu jalankan switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifikasi">
    Konfirmasikan bahwa layanan launchd berjalan dan bot Anda merespons pesan.
  </Step>
</Steps>

Lihat [README nix-openclaw](https://github.com/openclaw/nix-openclaw) untuk opsi modul dan contoh lengkap.

## Perilaku runtime mode Nix

Saat `OPENCLAW_NIX_MODE=1` disetel (otomatis dengan nix-openclaw), OpenClaw masuk ke mode deterministik yang menonaktifkan alur auto-install.

Anda juga dapat menyetelnya secara manual:

```bash
export OPENCLAW_NIX_MODE=1
```

Di macOS, aplikasi GUI tidak secara otomatis mewarisi variabel lingkungan shell. Aktifkan mode Nix melalui defaults sebagai gantinya:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Apa yang berubah dalam mode Nix

- Alur auto-install dan self-mutation dinonaktifkan
- Dependensi yang hilang menampilkan pesan remediasi khusus Nix
- UI menampilkan banner mode Nix baca-saja

### Jalur konfigurasi dan state

OpenClaw membaca konfigurasi JSON5 dari `OPENCLAW_CONFIG_PATH` dan menyimpan data yang dapat berubah di `OPENCLAW_STATE_DIR`. Saat berjalan di bawah Nix, setel ini secara eksplisit ke lokasi yang dikelola Nix agar state runtime dan konfigurasi tetap berada di luar immutable store.

| Variable               | Default                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

## Terkait

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- panduan penyiapan lengkap
- [Wizard](/start/wizard) -- penyiapan CLI non-Nix
- [Docker](/install/docker) -- penyiapan berbasis container
