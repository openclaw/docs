---
read_when:
    - Mendeploy OpenClaw ke Railway
    - Anda menginginkan deploy cloud sekali klik dengan Control UI berbasis browser
summary: Deploy OpenClaw di Railway dengan template sekali klik
title: Railway
x-i18n:
    generated_at: "2026-04-23T09:23:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 15
    postprocess_version: locale-links-v1
---

# Railway

Deploy OpenClaw di Railway dengan template sekali klik dan akses melalui web Control UI.
Ini adalah jalur termudah “tanpa terminal di server”: Railway menjalankan Gateway untuk Anda.

## Checklist cepat (pengguna baru)

1. Klik **Deploy on Railway** (di bawah).
2. Tambahkan **Volume** yang dimount di `/data`.
3. Tetapkan **Variables** yang diperlukan (setidaknya `OPENCLAW_GATEWAY_PORT` dan `OPENCLAW_GATEWAY_TOKEN`).
4. Aktifkan **HTTP Proxy** pada port `8080`.
5. Buka `https://<your-railway-domain>/openclaw` dan hubungkan menggunakan shared secret yang telah dikonfigurasi. Template ini menggunakan `OPENCLAW_GATEWAY_TOKEN` secara default; jika Anda menggantinya dengan auth password, gunakan password tersebut.

## Deploy sekali klik

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

Setelah deploy, temukan URL publik Anda di **Railway → layanan Anda → Settings → Domains**.

Railway akan:

- memberi Anda domain yang dibuat otomatis (sering kali `https://<something>.up.railway.app`), atau
- menggunakan domain kustom Anda jika Anda melampirkannya.

Lalu buka:

- `https://<your-railway-domain>/openclaw` — Control UI

## Yang Anda dapatkan

- Gateway OpenClaw terhosting + Control UI
- Penyimpanan persisten melalui Railway Volume (`/data`) sehingga `openclaw.json`,
  `auth-profiles.json` per-agent, state channel/provider, sesi, dan
  workspace tetap ada setelah redeploy

## Pengaturan Railway yang diperlukan

### Public Networking

Aktifkan **HTTP Proxy** untuk layanan.

- Port: `8080`

### Volume (wajib)

Lampirkan volume yang dimount di:

- `/data`

### Variables

Tetapkan variabel ini pada layanan:

- `OPENCLAW_GATEWAY_PORT=8080` (wajib — harus cocok dengan port di Public Networking)
- `OPENCLAW_GATEWAY_TOKEN` (wajib; perlakukan sebagai secret admin)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (disarankan)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (disarankan)

## Hubungkan channel

Gunakan Control UI di `/openclaw` atau jalankan `openclaw onboard` melalui shell Railway untuk instruksi penyiapan channel:

- [Telegram](/id/channels/telegram) (paling cepat — hanya token bot)
- [Discord](/id/channels/discord)
- [Semua channel](/id/channels)

## Backup & migrasi

Ekspor state, konfigurasi, profil auth, dan workspace Anda:

```bash
openclaw backup create
```

Ini membuat arsip backup portabel dengan state OpenClaw plus workspace apa pun yang
telah dikonfigurasi. Lihat [Backup](/id/cli/backup) untuk detail.

## Langkah berikutnya

- Siapkan channel pesan: [Channels](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Jaga OpenClaw tetap terbaru: [Updating](/id/install/updating)
