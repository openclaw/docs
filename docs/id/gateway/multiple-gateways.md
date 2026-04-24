---
read_when:
    - Menjalankan lebih dari satu Gateway di mesin yang sama
    - Anda memerlukan config/state/port yang terisolasi per Gateway
summary: Menjalankan beberapa Gateway OpenClaw pada satu host (isolasi, port, dan profil)
title: Beberapa gateway
x-i18n:
    generated_at: "2026-04-24T09:08:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Beberapa Gateway (host yang sama)

Sebagian besar penyiapan sebaiknya menggunakan satu Gateway karena satu Gateway dapat menangani banyak koneksi pesan dan agen. Jika Anda membutuhkan isolasi atau redundansi yang lebih kuat (misalnya bot penyelamat), jalankan Gateway terpisah dengan profil/port yang terisolasi.

## Penyiapan terbaik yang direkomendasikan

Untuk sebagian besar pengguna, penyiapan bot penyelamat yang paling sederhana adalah:

- pertahankan bot utama pada profil default
- jalankan bot penyelamat pada `--profile rescue`
- gunakan bot Telegram yang benar-benar terpisah untuk akun penyelamat
- pertahankan bot penyelamat pada base port yang berbeda seperti `19789`

Ini menjaga bot penyelamat tetap terisolasi dari bot utama sehingga ia dapat men-debug atau menerapkan
perubahan config jika bot utama mati. Sisakan setidaknya 20 port di antara
base port agar port turunan browser/canvas/CDP tidak pernah bentrok.

## Mulai cepat bot penyelamat

Gunakan ini sebagai jalur default kecuali Anda punya alasan kuat untuk melakukan hal
lain:

```bash
# Bot penyelamat (bot Telegram terpisah, profil terpisah, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jika bot utama Anda sudah berjalan, biasanya itu saja yang Anda perlukan.

Selama `openclaw --profile rescue onboard`:

- gunakan token bot Telegram yang terpisah
- pertahankan profil `rescue`
- gunakan base port setidaknya 20 lebih tinggi daripada bot utama
- terima workspace penyelamat default kecuali Anda sudah mengelolanya sendiri

Jika onboarding sudah memasang layanan penyelamat untuk Anda, maka
`gateway install` terakhir tidak diperlukan.

## Mengapa ini berhasil

Bot penyelamat tetap independen karena memiliki:

- profil/config sendiri
- direktori state sendiri
- workspace sendiri
- base port sendiri (plus port turunannya)
- token bot Telegram sendiri

Untuk sebagian besar penyiapan, gunakan bot Telegram yang benar-benar terpisah untuk profil penyelamat:

- mudah dijaga hanya untuk operator
- token dan identitas bot terpisah
- independen dari pemasangan channel/aplikasi bot utama
- jalur pemulihan berbasis DM yang sederhana saat bot utama rusak

## Apa yang diubah oleh `--profile rescue onboard`

`openclaw --profile rescue onboard` menggunakan alur onboarding normal, tetapi
menulis semuanya ke profil terpisah.

Dalam praktiknya, ini berarti bot penyelamat mendapatkan:

- file config sendiri
- direktori state sendiri
- workspace sendiri (default `~/.openclaw/workspace-rescue`)
- nama layanan terkelola sendiri

Prompt lainnya tetap sama seperti onboarding biasa.

## Penyiapan umum multi-Gateway

Tata letak bot penyelamat di atas adalah default termudah, tetapi pola isolasi yang sama
berfungsi untuk pasangan atau kelompok Gateway apa pun pada satu host.

Untuk penyiapan yang lebih umum, beri setiap Gateway tambahan profil bernama sendiri dan
base port sendiri:

```bash
# utama (profil default)
openclaw setup
openclaw gateway --port 18789

# gateway tambahan
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Jika Anda ingin kedua Gateway menggunakan profil bernama, itu juga bisa:

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

Gunakan mulai cepat bot penyelamat saat Anda menginginkan jalur operator cadangan. Gunakan
pola profil umum saat Anda menginginkan beberapa Gateway jangka panjang untuk
channel, tenant, workspace, atau peran operasional yang berbeda.

## Daftar periksa isolasi

Pastikan ini unik untuk setiap instance Gateway:

- `OPENCLAW_CONFIG_PATH` — file config per instance
- `OPENCLAW_STATE_DIR` — sesi, kredensial, cache per instance
- `agents.defaults.workspace` — root workspace per instance
- `gateway.port` (atau `--port`) — unik per instance
- port turunan browser/canvas/CDP

Jika ini dibagikan, Anda akan mengalami race config dan konflik port.

## Pemetaan port (turunan)

Base port = `gateway.port` (atau `OPENCLAW_GATEWAY_PORT` / `--port`).

- port layanan kontrol browser = base + 2 (hanya loopback)
- host canvas disajikan pada server HTTP Gateway (port yang sama dengan `gateway.port`)
- port CDP profil Browser dialokasikan otomatis dari `browser.controlPort + 9 .. + 108`

Jika Anda menimpa salah satu dari ini di config atau env, Anda harus menjaganya tetap unik per instance.

## Catatan browser/CDP (jebakan umum)

- **Jangan** menetapkan `browser.cdpUrl` ke nilai yang sama pada beberapa instance.
- Setiap instance memerlukan port kontrol browser dan rentang CDP sendiri (diturunkan dari port gateway-nya).
- Jika Anda memerlukan port CDP eksplisit, atur `browser.profiles.<name>.cdpPort` per instance.
- Chrome remote: gunakan `browser.profiles.<name>.cdpUrl` (per profil, per instance).

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

- `gateway status --deep` membantu menangkap layanan launchd/systemd/schtasks lama yang stale dari instalasi sebelumnya.
- Teks peringatan `gateway probe` seperti `multiple reachable gateways detected` hanya diharapkan saat Anda memang sengaja menjalankan lebih dari satu gateway terisolasi.

## Terkait

- [Runbook Gateway](/id/gateway)
- [Kunci Gateway](/id/gateway/gateway-lock)
- [Konfigurasi](/id/gateway/configuration)
