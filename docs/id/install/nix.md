---
read_when:
    - Anda menginginkan instalasi yang dapat direproduksi dan dapat dikembalikan ke versi sebelumnya
    - Anda sudah menggunakan Nix/NixOS/Home Manager
    - Anda ingin semuanya dikunci dan dikelola secara deklaratif
summary: Instal OpenClaw secara deklaratif dengan Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:57:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Instal OpenClaw secara deklaratif dengan **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - modul Home Manager pihak pertama yang sudah lengkap.

<Info>
Repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) adalah sumber kebenaran untuk instalasi Nix. Halaman ini adalah ikhtisar singkat.
</Info>

## Yang Anda dapatkan

- Gateway + aplikasi macOS + alat (whisper, spotify, cameras) -- semuanya dipin
- Layanan launchd yang tetap berjalan setelah reboot
- Sistem Plugin dengan config deklaratif
- Rollback instan: `home-manager switch --rollback`

## Mulai cepat

<Steps>
  <Step title="Instal Determinate Nix">
    Jika Nix belum terinstal, ikuti instruksi [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Buat flake lokal">
    Gunakan templat agent-first dari repo nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Konfigurasikan rahasia">
    Siapkan token bot perpesanan dan kunci API penyedia model Anda. File polos di `~/.secrets/` sudah cukup.
  </Step>
  <Step title="Isi placeholder templat dan beralih">
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

Saat `OPENCLAW_NIX_MODE=1` ditetapkan (otomatis dengan nix-openclaw), OpenClaw masuk ke mode deterministik untuk instalasi yang dikelola Nix. Paket Nix lain dapat menetapkan mode yang sama; nix-openclaw adalah referensi pihak pertama.

Anda juga dapat menetapkannya secara manual:

```bash
export OPENCLAW_NIX_MODE=1
```

Di macOS, aplikasi GUI tidak otomatis mewarisi variabel lingkungan shell. Aktifkan mode Nix melalui defaults sebagai gantinya:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Yang berubah dalam mode Nix

- Alur auto-install dan mutasi mandiri dinonaktifkan
- `openclaw.json` diperlakukan sebagai immutable. Default turunan startup tetap hanya runtime, dan penulis config seperti setup, onboarding, `openclaw update` yang memutasi, install/update/uninstall/enable Plugin, `doctor --fix`, `doctor --generate-gateway-token`, dan `openclaw config set` menolak mengedit file tersebut.
- Agent sebaiknya mengedit sumber Nix sebagai gantinya. Untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) agent-first dan tetapkan config di bawah `programs.openclaw.config` atau `instances.<name>.config`.
- Dependency yang hilang menampilkan pesan remediasi khusus Nix
- UI menampilkan banner mode Nix read-only

### Jalur config dan state

OpenClaw membaca config JSON5 dari `OPENCLAW_CONFIG_PATH` dan menyimpan data yang dapat diubah di `OPENCLAW_STATE_DIR`. Saat berjalan di bawah Nix, tetapkan ini secara eksplisit ke lokasi yang dikelola Nix agar state runtime dan config tetap berada di luar store immutable.

| Variabel               | Default                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Penemuan PATH layanan

Layanan Gateway launchd/systemd otomatis menemukan biner profil Nix sehingga
Plugin dan alat yang melakukan shell out ke executable yang diinstal `nix` berfungsi tanpa
penyiapan PATH manual:

- Saat `NIX_PROFILES` ditetapkan, setiap entri ditambahkan ke PATH layanan dengan
  prioritas kanan-ke-kiri (sesuai prioritas shell Nix - yang paling kanan menang).
- Saat `NIX_PROFILES` tidak ditetapkan, `~/.nix-profile/bin` ditambahkan sebagai fallback.

Ini berlaku untuk lingkungan layanan launchd macOS maupun systemd Linux.

## Terkait

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Modul Home Manager sumber kebenaran dan panduan penyiapan lengkap.
  </Card>
  <Card title="Wizard penyiapan" href="/id/start/wizard" icon="wand-magic-sparkles">
    Panduan penyiapan CLI non-Nix.
  </Card>
  <Card title="Docker" href="/id/install/docker" icon="docker">
    Penyiapan berbasis container sebagai alternatif non-Nix.
  </Card>
  <Card title="Memperbarui" href="/id/install/updating" icon="arrow-up-right-from-square">
    Memperbarui instalasi yang dikelola Home Manager bersama paketnya.
  </Card>
</CardGroup>
