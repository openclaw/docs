---
read_when:
    - Anda sedang melakukan penyiapan pertama tanpa onboarding CLI penuh
    - Anda ingin menyetel path workspace default
summary: Referensi CLI untuk `openclaw setup` (inisialisasi konfigurasi + workspace)
title: Penyiapan
x-i18n:
    generated_at: "2026-04-24T09:02:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Inisialisasi `~/.openclaw/openclaw.json` dan workspace agen.

Terkait:

- Memulai: [Memulai](/id/start/getting-started)
- Onboarding CLI: [Onboarding (CLI)](/id/start/wizard)

## Contoh

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opsi

- `--workspace <dir>`: direktori workspace agen (disimpan sebagai `agents.defaults.workspace`)
- `--wizard`: jalankan onboarding
- `--non-interactive`: jalankan onboarding tanpa prompt
- `--mode <local|remote>`: mode onboarding
- `--remote-url <url>`: URL WebSocket Gateway remote
- `--remote-token <token>`: token Gateway remote

Untuk menjalankan onboarding melalui setup:

```bash
openclaw setup --wizard
```

Catatan:

- `openclaw setup` biasa menginisialisasi konfigurasi + workspace tanpa alur onboarding penuh.
- Onboarding berjalan otomatis saat ada flag onboarding apa pun (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar instalasi](/id/install)
