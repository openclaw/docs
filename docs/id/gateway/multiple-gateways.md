---
read_when:
    - Menjalankan lebih dari satu Gateway pada mesin yang sama
    - Anda memerlukan konfigurasi/status/port yang terisolasi untuk setiap Gateway
summary: Menjalankan beberapa Gateway OpenClaw pada satu host (isolasi, port, dan profil)
title: Beberapa Gateway
x-i18n:
    generated_at: "2026-04-21T17:45:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Beberapa Gateway (host yang sama)

Sebagian besar penyiapan sebaiknya menggunakan satu Gateway karena satu Gateway dapat menangani beberapa koneksi perpesanan dan agen. Jika Anda memerlukan isolasi atau redundansi yang lebih kuat (misalnya, bot penyelamat), jalankan Gateway terpisah dengan profil/port yang terisolasi.

## Daftar periksa isolasi (wajib)

- `OPENCLAW_CONFIG_PATH` — file konfigurasi per instance
- `OPENCLAW_STATE_DIR` — sesi, kredensial, cache per instance
- `agents.defaults.workspace` — root workspace per instance
- `gateway.port` (atau `--port`) — unik per instance
- Port turunan (browser/canvas) tidak boleh tumpang tindih

Jika ini dibagikan, Anda akan mengalami race konfigurasi dan konflik port.

## Disarankan: gunakan profil default untuk utama, profil bernama untuk penyelamat

Profil secara otomatis mencakup `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` dan menambahkan sufiks pada nama layanan. Untuk sebagian besar penyiapan bot penyelamat, pertahankan bot utama pada profil default dan berikan hanya bot penyelamat profil bernama seperti `rescue`.

```bash
# utama (profil default)
openclaw setup
openclaw gateway --port 18789

# penyelamat
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Layanan:

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

Jika Anda ingin kedua Gateway menggunakan profil bernama, itu juga berfungsi, tetapi tidak wajib.

## Panduan bot penyelamat

Penyiapan yang disarankan:

- pertahankan bot utama pada profil default
- jalankan bot penyelamat pada `--profile rescue`
- gunakan bot Telegram yang benar-benar terpisah untuk akun penyelamat
- pertahankan bot penyelamat pada port dasar yang berbeda seperti `19001`

Ini menjaga bot penyelamat tetap terisolasi dari bot utama sehingga ia dapat melakukan debug atau menerapkan perubahan konfigurasi jika bot utama tidak aktif. Sisakan setidaknya 20 port di antara port dasar agar port turunan browser/canvas/CDP tidak pernah bertabrakan.

### Channel/akun penyelamat yang disarankan

Untuk sebagian besar penyiapan, gunakan bot Telegram yang benar-benar terpisah untuk profil penyelamat.

Mengapa Telegram:

- mudah dibatasi hanya untuk operator
- token dan identitas bot terpisah
- independen dari instalasi channel/aplikasi bot utama
- jalur pemulihan berbasis DM yang sederhana saat bot utama rusak

Bagian yang penting adalah kemandirian penuh: akun bot terpisah, kredensial terpisah, profil OpenClaw terpisah, workspace terpisah, dan port terpisah.

### Alur instalasi yang disarankan

Gunakan ini sebagai penyiapan default kecuali Anda memiliki alasan kuat untuk melakukan hal lain:

```bash
# Bot utama (profil default, port 18789)
openclaw onboard
openclaw gateway install

# Bot penyelamat (bot Telegram terpisah, profil terpisah, port 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

Selama `openclaw --profile rescue onboard`:

- gunakan token bot Telegram yang terpisah
- pertahankan profil `rescue`
- gunakan port dasar yang setidaknya 20 lebih tinggi daripada bot utama
- terima workspace penyelamat default kecuali Anda sudah mengelolanya sendiri

Jika onboarding sudah memasang layanan penyelamat untuk Anda, `gateway install` terakhir tidak diperlukan.

### Apa yang diubah oleh onboarding

`openclaw --profile rescue onboard` menggunakan alur onboarding normal, tetapi menulis semuanya ke dalam profil terpisah.

Dalam praktiknya, itu berarti bot penyelamat mendapatkan miliknya sendiri:

- file konfigurasi
- direktori status
- workspace (secara default `~/.openclaw/workspace-rescue`)
- nama layanan terkelola

Selain itu, prompt-nya sama seperti onboarding normal.

## Pemetaan port (turunan)

Port dasar = `gateway.port` (atau `OPENCLAW_GATEWAY_PORT` / `--port`).

- port layanan kontrol browser = dasar + 2 (hanya loopback)
- host canvas disajikan pada server HTTP Gateway (port yang sama dengan `gateway.port`)
- port CDP profil browser dialokasikan otomatis dari `browser.controlPort + 9 .. + 108`

Jika Anda menimpa salah satu dari ini di konfigurasi atau env, Anda harus menjaganya tetap unik per instance.

## Catatan browser/CDP (jebakan umum)

- **Jangan** sematkan `browser.cdpUrl` ke nilai yang sama pada beberapa instance.
- Setiap instance memerlukan port kontrol browser dan rentang CDP-nya sendiri (diturunkan dari port gateway-nya).
- Jika Anda memerlukan port CDP eksplisit, atur `browser.profiles.<name>.cdpPort` per instance.
- Chrome jarak jauh: gunakan `browser.profiles.<name>.cdpUrl` (per profil, per instance).

## Contoh env manual

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Pemeriksaan cepat

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretasi:

- `gateway status --deep` membantu mendeteksi layanan launchd/systemd/schtasks usang dari instalasi yang lebih lama.
- Teks peringatan `gateway probe` seperti `multiple reachable gateways detected` hanya diharapkan ketika Anda memang sengaja menjalankan lebih dari satu gateway terisolasi.
