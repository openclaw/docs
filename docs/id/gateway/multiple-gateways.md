---
read_when:
    - Menjalankan lebih dari satu Gateway pada mesin yang sama
    - Anda memerlukan konfigurasi/keadaan/port yang terisolasi untuk setiap Gateway
summary: Jalankan beberapa OpenClaw Gateway pada satu host (isolasi, port, dan profil)
title: Beberapa gateway
x-i18n:
    generated_at: "2026-06-27T17:31:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Sebagian besar penyiapan sebaiknya menggunakan satu Gateway karena satu Gateway dapat menangani beberapa koneksi pesan dan agen. Jika Anda memerlukan isolasi atau redundansi yang lebih kuat (misalnya, bot penyelamat), jalankan Gateway terpisah dengan profil/port yang terisolasi.

## Penyiapan terbaik yang direkomendasikan

Untuk sebagian besar pengguna, penyiapan bot penyelamat yang paling sederhana adalah:

- biarkan bot utama pada profil default
- jalankan bot penyelamat pada `--profile rescue`
- gunakan bot Telegram yang benar-benar terpisah untuk akun penyelamat
- pertahankan bot penyelamat pada port dasar yang berbeda seperti `19789`

Ini menjaga bot penyelamat tetap terisolasi dari bot utama sehingga dapat men-debug atau menerapkan
perubahan konfigurasi jika bot utama sedang mati. Sisakan setidaknya 20 port di antara
port dasar agar port browser/canvas/CDP turunan tidak pernah bentrok.

## Mulai Cepat Bot Penyelamat

Gunakan ini sebagai jalur default kecuali Anda punya alasan kuat untuk melakukan hal
lain:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jika bot utama Anda sudah berjalan, biasanya hanya itu yang Anda perlukan.

Selama `openclaw --profile rescue onboard`:

- gunakan token bot Telegram terpisah
- pertahankan profil `rescue`
- gunakan port dasar setidaknya 20 lebih tinggi daripada bot utama
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

Untuk sebagian besar penyiapan, gunakan bot Telegram yang benar-benar terpisah untuk profil penyelamat:

- mudah dijaga hanya untuk operator
- token dan identitas bot terpisah
- independen dari instalasi channel/app bot utama
- jalur pemulihan berbasis DM yang sederhana ketika bot utama rusak

## Yang Diubah oleh `--profile rescue onboard`

`openclaw --profile rescue onboard` menggunakan alur onboarding normal, tetapi
menulis semuanya ke profil terpisah.

Dalam praktiknya, itu berarti bot penyelamat mendapatkan miliknya sendiri:

- file konfigurasi
- direktori status
- workspace (secara default `~/.openclaw/workspace-rescue`)
- nama layanan terkelola

Prompt lainnya sama seperti onboarding normal.

## Penyiapan multi-Gateway umum

Tata letak bot penyelamat di atas adalah default yang paling mudah, tetapi pola
isolasi yang sama berlaku untuk pasangan atau grup Gateway mana pun pada satu host.

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

Gunakan mulai cepat bot penyelamat ketika Anda menginginkan jalur operator fallback. Gunakan
pola profil umum ketika Anda menginginkan beberapa Gateway jangka panjang untuk
channel, tenant, workspace, atau peran operasional yang berbeda.

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

Jika Anda menimpa salah satu dari ini dalam konfigurasi atau env, Anda harus menjaganya tetap unik per instance.

## Catatan Browser/CDP (kesalahan umum)

- **Jangan** sematkan `browser.cdpUrl` ke nilai yang sama pada beberapa instance.
- Setiap instance memerlukan port kontrol browser dan rentang CDP sendiri (diturunkan dari port gateway-nya).
- Jika Anda memerlukan port CDP eksplisit, tetapkan `browser.profiles.<name>.cdpPort` per instance.
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
- Teks peringatan `gateway probe` seperti `multiple reachable gateway identities detected` diharapkan hanya ketika Anda sengaja menjalankan lebih dari satu gateway terisolasi, atau ketika OpenClaw tidak dapat membuktikan bahwa target probe yang dapat dijangkau adalah gateway yang sama. Tunnel SSH, URL proxy, atau URL jarak jauh yang dikonfigurasi ke gateway yang sama adalah satu gateway dengan beberapa transport, meskipun port transport berbeda.

## Terkait

- [Runbook Gateway](/id/gateway)
- [Kunci Gateway](/id/gateway/gateway-lock)
- [Konfigurasi](/id/gateway/configuration)
