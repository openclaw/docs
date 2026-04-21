---
read_when:
    - Menjalankan lebih dari satu Gateway pada mesin yang sama
    - Anda memerlukan config/state/port yang terisolasi untuk setiap Gateway
summary: Menjalankan beberapa Gateway OpenClaw pada satu host (isolasi, port, dan profil)
title: Beberapa Gateway
x-i18n:
    generated_at: "2026-04-21T19:20:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Beberapa Gateway (host yang sama)

Sebagian besar penyiapan sebaiknya menggunakan satu Gateway karena satu Gateway dapat menangani beberapa koneksi pesan dan agent. Jika Anda memerlukan isolasi atau redundansi yang lebih kuat (misalnya, bot pemulihan), jalankan Gateway terpisah dengan profil/port yang terisolasi.

## Penyiapan Paling Direkomendasikan

Bagi sebagian besar pengguna, penyiapan bot pemulihan yang paling sederhana adalah:

- pertahankan bot utama pada profil default
- jalankan bot pemulihan pada `--profile rescue`
- gunakan bot Telegram yang sepenuhnya terpisah untuk akun pemulihan
- pertahankan bot pemulihan pada base port yang berbeda seperti `19789`

Ini menjaga bot pemulihan tetap terisolasi dari bot utama sehingga bot tersebut dapat men-debug atau menerapkan perubahan config jika bot utama tidak aktif. Sisakan setidaknya 20 port di antara base port agar port browser/canvas/CDP turunan tidak pernah bertabrakan.

## Mulai Cepat Bot Pemulihan

Gunakan ini sebagai jalur default kecuali Anda memiliki alasan kuat untuk melakukan hal lain:

```bash
# Bot pemulihan (bot Telegram terpisah, profil terpisah, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jika bot utama Anda sudah berjalan, biasanya hanya itu yang Anda perlukan.

Selama `openclaw --profile rescue onboard`:

- gunakan token bot Telegram yang terpisah
- pertahankan profil `rescue`
- gunakan base port setidaknya 20 lebih tinggi daripada bot utama
- terima workspace pemulihan default kecuali Anda sudah mengelolanya sendiri

Jika onboarding sudah memasang layanan pemulihan untuk Anda, `gateway install` terakhir tidak diperlukan.

## Mengapa Ini Berfungsi

Bot pemulihan tetap independen karena memiliki:

- profile/config sendiri
- direktori state sendiri
- workspace sendiri
- base port sendiri (beserta port turunannya)
- token bot Telegram sendiri

Untuk sebagian besar penyiapan, gunakan bot Telegram yang sepenuhnya terpisah untuk profil pemulihan:

- mudah dibatasi hanya untuk operator
- token dan identitas bot terpisah
- independen dari instalasi channel/app bot utama
- jalur pemulihan berbasis DM yang sederhana ketika bot utama bermasalah

## Apa yang Diubah oleh `--profile rescue onboard`

`openclaw --profile rescue onboard` menggunakan alur onboarding normal, tetapi menulis semuanya ke dalam profil terpisah.

Dalam praktiknya, itu berarti bot pemulihan mendapatkan:

- file config sendiri
- direktori state sendiri
- workspace sendiri (secara default `~/.openclaw/workspace-rescue`)
- nama layanan terkelola sendiri

Prompt-nya selain itu sama seperti onboarding normal.

## Penyiapan Multi-Gateway Umum

Tata letak bot pemulihan di atas adalah default termudah, tetapi pola isolasi yang sama juga berlaku untuk pasangan atau kelompok Gateway apa pun pada satu host.

Untuk penyiapan yang lebih umum, beri setiap Gateway tambahan profil bernama sendiri dan base port sendiri:

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

Gunakan mulai cepat bot pemulihan saat Anda menginginkan jalur operator cadangan. Gunakan pola profil umum saat Anda menginginkan beberapa Gateway jangka panjang untuk channel, tenant, workspace, atau peran operasional yang berbeda.

## Daftar Periksa Isolasi

Pertahankan hal-hal ini unik untuk setiap instance Gateway:

- `OPENCLAW_CONFIG_PATH` — file config per instance
- `OPENCLAW_STATE_DIR` — sesi, kredensial, cache per instance
- `agents.defaults.workspace` — root workspace per instance
- `gateway.port` (atau `--port`) — unik per instance
- port browser/canvas/CDP turunan

Jika hal-hal ini dibagikan, Anda akan mengalami race config dan konflik port.

## Pemetaan port (turunan)

Base port = `gateway.port` (atau `OPENCLAW_GATEWAY_PORT` / `--port`).

- port layanan kontrol browser = base + 2 (hanya loopback)
- host canvas disajikan pada server HTTP Gateway (port yang sama dengan `gateway.port`)
- port CDP profil browser dialokasikan otomatis dari `browser.controlPort + 9 .. + 108`

Jika Anda menimpa salah satu dari ini di config atau env, Anda harus menjaganya tetap unik per instance.

## Catatan browser/CDP (jebakan umum)

- **Jangan** sematkan `browser.cdpUrl` ke nilai yang sama pada beberapa instance.
- Setiap instance memerlukan port kontrol browser dan rentang CDP sendiri (diturunkan dari port gateway-nya).
- Jika Anda memerlukan port CDP eksplisit, atur `browser.profiles.<name>.cdpPort` per instance.
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

- `gateway status --deep` membantu mendeteksi layanan launchd/systemd/schtasks usang dari instalasi yang lebih lama.
- teks peringatan `gateway probe` seperti `multiple reachable gateways detected` hanya diharapkan ketika Anda memang sengaja menjalankan lebih dari satu gateway yang terisolasi.
