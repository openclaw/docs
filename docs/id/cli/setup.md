---
read_when:
    - Anda melakukan penyiapan pertama kali tanpa proses orientasi CLI lengkap
    - Anda ingin mengatur jalur ruang kerja default
summary: Referensi CLI untuk `openclaw setup` (inisialisasi konfigurasi + ruang kerja)
title: Penyiapan
x-i18n:
    generated_at: "2026-05-06T17:54:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inisialisasi `~/.openclaw/openclaw.json` dan ruang kerja agen.

<Note>
`openclaw setup` ditujukan untuk instalasi konfigurasi yang dapat diubah. Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw menolak penulisan setup karena file konfigurasi dikelola oleh Nix. Agen sebaiknya menggunakan [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) pihak pertama atau konfigurasi sumber yang setara untuk paket Nix lain.
</Note>

Terkait:

- Memulai: [Memulai](/id/start/getting-started)
- Onboarding CLI: [Onboarding (CLI)](/id/start/wizard)

## Contoh

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opsi

- `--workspace <dir>`: direktori ruang kerja agen (disimpan sebagai `agents.defaults.workspace`)
- `--wizard`: jalankan onboarding
- `--non-interactive`: jalankan onboarding tanpa prompt
- `--mode <local|remote>`: mode onboarding
- `--import-from <provider>`: penyedia migrasi yang dijalankan selama onboarding
- `--import-source <path>`: beranda agen sumber untuk `--import-from`
- `--import-secrets`: impor rahasia yang didukung selama migrasi onboarding
- `--remote-url <url>`: URL WebSocket Gateway jarak jauh
- `--remote-token <token>`: token Gateway jarak jauh

Untuk menjalankan onboarding melalui setup:

```bash
openclaw setup --wizard
```

Catatan:

- `openclaw setup` biasa menginisialisasi konfigurasi + ruang kerja tanpa alur onboarding penuh.
- Setelah setup biasa, jalankan `openclaw configure` untuk memilih model, saluran, Gateway, Plugin, Skills, atau pemeriksaan kesehatan.
- Onboarding berjalan otomatis ketika flag onboarding apa pun ada (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Jika status Hermes terdeteksi, onboarding interaktif dapat menawarkan migrasi secara otomatis. Onboarding impor memerlukan setup baru; gunakan [Migrasi](/id/cli/migrate) untuk rencana dry-run, cadangan, dan mode timpa di luar onboarding.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar instalasi](/id/install)
