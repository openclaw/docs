---
read_when:
    - Menerapkan OpenClaw ke Railway
    - Anda menginginkan penerapan cloud sekali klik dengan UI Kontrol berbasis browser
summary: Terapkan OpenClaw di Railway dengan templat sekali klik
title: Railway
x-i18n:
    generated_at: "2026-07-12T14:20:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Deploy OpenClaw di Railway dengan templat sekali klik dan akses melalui UI Kontrol web. Ini adalah cara termudah "tanpa terminal di server": Railway menjalankan Gateway untuk Anda.

## Deploy sekali klik

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy di Railway
</a>

<Steps>
  <Step title="Deploy templat">
    Klik **Deploy on Railway** di atas.
  </Step>

<Step title="Tambahkan volume">
  Lampirkan volume yang dipasang di `/data` (diperlukan untuk status persisten).
</Step>

  <Step title="Atur variabel">
    Atur **Variables** yang diperlukan pada layanan:

    - `OPENCLAW_GATEWAY_PORT=8080` (wajib -- harus sesuai dengan port di Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (wajib; perlakukan sebagai rahasia admin)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (disarankan)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (disarankan)

  </Step>

<Step title="Aktifkan jaringan publik">
  Di bagian **Public Networking**, aktifkan **HTTP Proxy** untuk layanan pada port `8080`.
</Step>

  <Step title="Hubungkan">
    Temukan URL publik Anda di **Railway -> layanan Anda -> Settings -> Domains** -- baik domain yang dibuat secara otomatis (biasanya `https://<something>.up.railway.app`) maupun domain khusus yang Anda lampirkan.

    Buka `https://<your-railway-domain>/openclaw` dan hubungkan menggunakan rahasia bersama yang dikonfigurasi. Secara default, templat menggunakan `OPENCLAW_GATEWAY_TOKEN`; jika Anda menggantinya dengan autentikasi kata sandi, gunakan kata sandi tersebut.

  </Step>
</Steps>

## Yang Anda dapatkan

- Gateway OpenClaw yang dihosting + UI Kontrol
- Penyimpanan persisten melalui Railway Volume (`/data`), sehingga `openclaw.json`, `auth-profiles.json` per agen, status saluran/penyedia, sesi, dan ruang kerja tetap tersedia setelah deploy ulang

## Hubungkan saluran

Gunakan UI Kontrol di `/openclaw` atau jalankan `openclaw onboard` melalui shell Railway untuk mendapatkan petunjuk penyiapan saluran:

- [Discord](/id/channels/discord)
- [Telegram](/id/channels/telegram) (paling cepat -- hanya memerlukan token bot)
- [Semua saluran](/id/channels)

## Pencadangan dan migrasi

Ekspor status, konfigurasi, profil autentikasi, dan ruang kerja Anda:

```bash
openclaw backup create
```

Perintah ini membuat arsip cadangan portabel yang berisi status OpenClaw beserta ruang kerja yang dikonfigurasi. Lihat [Pencadangan](/id/cli/backup) untuk detailnya.

## Langkah berikutnya

- Siapkan saluran perpesanan: [Saluran](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Pastikan OpenClaw selalu mutakhir: [Pembaruan](/id/install/updating)
