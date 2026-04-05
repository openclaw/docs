---
read_when:
    - Anda sedang melakukan penyiapan pertama tanpa onboarding CLI penuh
    - Anda ingin menetapkan path workspace default
summary: Referensi CLI untuk `openclaw setup` (inisialisasi config + workspace)
title: setup
x-i18n:
    generated_at: "2026-04-05T13:49:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f538aac341c749043ad959e35f2ed99c844ab8c3500ff59aa159d940bd301792
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Inisialisasi `~/.openclaw/openclaw.json` dan workspace agen.

Terkait:

- Memulai: [Getting started](/start/getting-started)
- Onboarding CLI: [Onboarding (CLI)](/start/wizard)

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
- `--remote-url <url>`: URL WebSocket Gateway jarak jauh
- `--remote-token <token>`: token Gateway jarak jauh

Untuk menjalankan onboarding melalui setup:

```bash
openclaw setup --wizard
```

Catatan:

- `openclaw setup` biasa menginisialisasi config + workspace tanpa alur onboarding penuh.
- Onboarding dijalankan otomatis saat ada flag onboarding (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).
