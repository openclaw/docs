---
read_when:
    - Menjalankan lebih dari satu Gateway di mesin yang sama
    - Anda memerlukan konfigurasi/status/port yang terisolasi per Gateway
summary: Menjalankan beberapa Gateway OpenClaw di satu host (isolasi, port, dan profil)
title: Beberapa Gateway
x-i18n:
    generated_at: "2026-04-05T13:53:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 061f204bf56b28c6bd0e2c9aee6c561a8a162ca219060117fea4d3a007f01899
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Beberapa Gateway (host yang sama)

Sebagian besar penyiapan sebaiknya menggunakan satu Gateway karena satu Gateway dapat menangani beberapa koneksi pesan dan agen. Jika Anda memerlukan isolasi atau redundansi yang lebih kuat (misalnya bot penyelamat), jalankan Gateway terpisah dengan profil/port yang terisolasi.

## Daftar periksa isolasi (wajib)

- `OPENCLAW_CONFIG_PATH` — file konfigurasi per instans
- `OPENCLAW_STATE_DIR` — sesi, kredensial, cache per instans
- `agents.defaults.workspace` — root ruang kerja per instans
- `gateway.port` (atau `--port`) — unik per instans
- Port turunan (browser/canvas) tidak boleh tumpang tindih

Jika ini dibagikan, Anda akan mengalami race konfigurasi dan konflik port.

## Direkomendasikan: profil (`--profile`)

Profil secara otomatis mencakup `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` dan menambahkan sufiks pada nama layanan.

```bash
# utama
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Layanan per profil:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Panduan bot penyelamat

Jalankan Gateway kedua di host yang sama dengan miliknya sendiri:

- profil/konfigurasi
- direktori status
- ruang kerja
- port dasar (plus port turunan)

Ini menjaga bot penyelamat tetap terisolasi dari bot utama sehingga dapat men-debug atau menerapkan perubahan konfigurasi jika bot utama tidak aktif.

Jarak port: sisakan setidaknya 20 port di antara port dasar agar port browser/canvas/CDP turunan tidak pernah bertabrakan.

### Cara menginstal (bot penyelamat)

```bash
# Bot utama (sudah ada atau baru, tanpa parameter --profile)
# Berjalan di port 18789 + port Chrome CDC/Canvas/... 
openclaw onboard
openclaw gateway install

# Bot penyelamat (profil + port terisolasi)
openclaw --profile rescue onboard
# Catatan:
# - nama ruang kerja akan diberi akhiran -rescue secara default
# - Port harus setidaknya 18789 + 20 Port,
#   lebih baik pilih port dasar yang benar-benar berbeda, seperti 19789,
# - sisanya dari onboarding sama seperti biasa

# Untuk menginstal layanan (jika belum terjadi otomatis saat setup)
openclaw --profile rescue gateway install
```

## Pemetaan port (turunan)

Port dasar = `gateway.port` (atau `OPENCLAW_GATEWAY_PORT` / `--port`).

- port layanan kontrol browser = dasar + 2 (hanya loopback)
- host canvas dilayani pada server HTTP Gateway (port yang sama dengan `gateway.port`)
- Port CDP profil browser dialokasikan otomatis dari `browser.controlPort + 9 .. + 108`

Jika Anda menimpa salah satu dari ini di konfigurasi atau env, Anda harus menjaganya tetap unik per instans.

## Catatan browser/CDP (jebakan umum)

- **Jangan** menetapkan `browser.cdpUrl` ke nilai yang sama pada beberapa instans.
- Setiap instans memerlukan port kontrol browser dan rentang CDP-nya sendiri (diturunkan dari port gateway-nya).
- Jika Anda memerlukan port CDP eksplisit, setel `browser.profiles.<name>.cdpPort` per instans.
- Chrome jarak jauh: gunakan `browser.profiles.<name>.cdpUrl` (per profil, per instans).

## Contoh env manual

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Pemeriksaan cepat

```bash
openclaw --profile main gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretasi:

- `gateway status --deep` membantu mendeteksi layanan launchd/systemd/schtasks lama yang masih tersisa dari instalasi sebelumnya.
- Teks peringatan `gateway probe` seperti `multiple reachable gateways detected` hanya diharapkan saat Anda memang sengaja menjalankan lebih dari satu gateway terisolasi.
