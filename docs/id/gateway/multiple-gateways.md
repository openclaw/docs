---
read_when:
    - Menjalankan lebih dari satu Gateway pada mesin yang sama
    - Anda memerlukan konfigurasi/state/port terisolasi per Gateway
summary: Jalankan beberapa Gateway OpenClaw pada satu host (isolasi, port, dan profil)
title: Beberapa Gateway
x-i18n:
    generated_at: "2026-04-30T09:50:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 655f9ea5100813d5836f24eb47a5646443f83d70953efa64122633a5a1341002
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Sebagian besar penyiapan sebaiknya menggunakan satu Gateway karena satu Gateway dapat menangani beberapa koneksi pesan dan agen. Jika Anda membutuhkan isolasi atau redundansi yang lebih kuat (misalnya, bot penyelamat), jalankan Gateway terpisah dengan profil/port yang terisolasi.

## Penyiapan terbaik yang direkomendasikan

Untuk sebagian besar pengguna, penyiapan bot penyelamat yang paling sederhana adalah:

- pertahankan bot utama pada profil default
- jalankan bot penyelamat pada `--profile rescue`
- gunakan bot Telegram yang sepenuhnya terpisah untuk akun penyelamat
- pertahankan bot penyelamat pada port dasar yang berbeda seperti `19789`

Ini membuat bot penyelamat tetap terisolasi dari bot utama sehingga dapat men-debug atau menerapkan
perubahan konfigurasi jika bot utama sedang tidak aktif. Sisakan setidaknya 20 port di antara
port dasar agar port browser/canvas/CDP turunan tidak pernah bertabrakan.

## Panduan Cepat Bot Penyelamat

Gunakan ini sebagai jalur default kecuali Anda memiliki alasan kuat untuk melakukan hal
lain:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jika bot utama Anda sudah berjalan, biasanya hanya itu yang Anda butuhkan.

Selama `openclaw --profile rescue onboard`:

- gunakan token bot Telegram yang terpisah
- pertahankan profil `rescue`
- gunakan port dasar setidaknya 20 lebih tinggi dari bot utama
- terima workspace penyelamat default kecuali Anda sudah mengelolanya sendiri

Jika onboarding sudah memasang layanan penyelamat untuk Anda, perintah akhir
`gateway install` tidak diperlukan.

## Mengapa ini bekerja

Bot penyelamat tetap independen karena memiliki miliknya sendiri:

- profil/konfigurasi
- direktori status
- workspace
- port dasar (ditambah port turunan)
- token bot Telegram

Untuk sebagian besar penyiapan, gunakan bot Telegram yang sepenuhnya terpisah untuk profil penyelamat:

- mudah dibuat hanya untuk operator
- token dan identitas bot terpisah
- independen dari instalasi kanal/aplikasi bot utama
- jalur pemulihan berbasis DM yang sederhana saat bot utama rusak

## Apa yang Diubah oleh `--profile rescue onboard`

`openclaw --profile rescue onboard` menggunakan alur onboarding normal, tetapi
menulis semuanya ke profil terpisah.

Dalam praktiknya, itu berarti bot penyelamat mendapatkan miliknya sendiri:

- file konfigurasi
- direktori status
- workspace (secara default `~/.openclaw/workspace-rescue`)
- nama layanan terkelola

Prompt selain itu sama dengan onboarding normal.

## Penyiapan multi-Gateway umum

Tata letak bot penyelamat di atas adalah default termudah, tetapi pola isolasi yang sama
berfungsi untuk pasangan atau grup Gateway apa pun pada satu host.

Untuk penyiapan yang lebih umum, berikan setiap Gateway tambahan profil bernamanya sendiri dan
port dasarnya sendiri:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Jika Anda ingin kedua Gateway menggunakan profil bernama, itu juga berfungsi:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Layanan mengikuti pola yang sama:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Gunakan panduan cepat bot penyelamat saat Anda menginginkan jalur operator cadangan. Gunakan
pola profil umum saat Anda menginginkan beberapa Gateway jangka panjang untuk
kanal, penyewa, workspace, atau peran operasional yang berbeda.

## Daftar periksa isolasi

Jaga agar ini unik per instance Gateway:

- `OPENCLAW_CONFIG_PATH` — file konfigurasi per instance
- `OPENCLAW_STATE_DIR` — sesi, kredensial, cache per instance
- `agents.defaults.workspace` — root workspace per instance
- `gateway.port` (atau `--port`) — unik per instance
- port browser/canvas/CDP turunan

Jika ini dibagikan, Anda akan mengalami race konfigurasi dan konflik port.

## Pemetaan port (turunan)

Port dasar = `gateway.port` (atau `OPENCLAW_GATEWAY_PORT` / `--port`).

- port layanan kontrol browser = dasar + 2 (hanya loopback)
- host canvas disajikan pada server HTTP Gateway (port yang sama dengan `gateway.port`)
- port CDP profil browser dialokasikan otomatis dari `browser.controlPort + 9 .. + 108`

Jika Anda mengganti salah satu dari ini dalam konfigurasi atau env, Anda harus menjaganya tetap unik per instance.

## Catatan browser/CDP (kesalahan umum)

- Jangan **pin** `browser.cdpUrl` ke nilai yang sama pada beberapa instance.
- Setiap instance membutuhkan port kontrol browser dan rentang CDP sendiri (diturunkan dari port gateway-nya).
- Jika Anda membutuhkan port CDP eksplisit, atur `browser.profiles.<name>.cdpPort` per instance.
- Chrome jarak jauh: gunakan `browser.profiles.<name>.cdpUrl` (per profil, per instance).

## Contoh env manual

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
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

- `gateway status --deep` membantu menangkap layanan launchd/systemd/schtasks usang dari instalasi lama.
- Teks peringatan `gateway probe` seperti `multiple reachable gateways detected` diharapkan hanya saat Anda sengaja menjalankan lebih dari satu gateway terisolasi.

## Terkait

- [Runbook Gateway](/id/gateway)
- [Kunci Gateway](/id/gateway/gateway-lock)
- [Konfigurasi](/id/gateway/configuration)
