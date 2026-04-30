---
read_when:
    - Anda melakukan penyiapan pertama kali tanpa proses orientasi CLI lengkap
    - Anda ingin menetapkan jalur ruang kerja default
summary: Referensi CLI untuk `openclaw setup` (inisialisasi konfigurasi + ruang kerja)
title: Penyiapan
x-i18n:
    generated_at: "2026-04-30T09:41:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inisialisasi `~/.openclaw/openclaw.json` dan ruang kerja agen.

Terkait:

- Memulai: [Memulai](/id/start/getting-started)
- Orientasi CLI: [Orientasi (CLI)](/id/start/wizard)

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
- `--wizard`: jalankan orientasi
- `--non-interactive`: jalankan orientasi tanpa permintaan masukan
- `--mode <local|remote>`: mode orientasi
- `--import-from <provider>`: penyedia migrasi yang akan dijalankan selama orientasi
- `--import-source <path>`: beranda agen sumber untuk `--import-from`
- `--import-secrets`: impor rahasia yang didukung selama migrasi orientasi
- `--remote-url <url>`: URL WebSocket Gateway jarak jauh
- `--remote-token <token>`: token Gateway jarak jauh

Untuk menjalankan orientasi melalui penyiapan:

```bash
openclaw setup --wizard
```

Catatan:

- `openclaw setup` biasa menginisialisasi konfigurasi + ruang kerja tanpa alur orientasi penuh.
- Orientasi berjalan otomatis ketika ada tanda orientasi apa pun (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Jika status Hermes terdeteksi, orientasi interaktif dapat menawarkan migrasi secara otomatis. Orientasi impor memerlukan penyiapan baru; gunakan [Migrasi](/id/cli/migrate) untuk rencana uji coba, cadangan, dan mode timpa di luar orientasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar instalasi](/id/install)
