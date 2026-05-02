---
read_when:
    - Anda melakukan penyiapan pertama kali tanpa proses orientasi awal CLI lengkap
    - Anda ingin menetapkan jalur ruang kerja default
summary: Referensi CLI untuk `openclaw setup` (inisialisasi konfigurasi + ruang kerja)
title: Penyiapan
x-i18n:
    generated_at: "2026-05-02T20:43:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inisialisasi `~/.openclaw/openclaw.json` dan ruang kerja agen.

Terkait:

- Memulai: [Memulai](/id/start/getting-started)
- Orientasi awal CLI: [Orientasi Awal (CLI)](/id/start/wizard)

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
- `--wizard`: jalankan orientasi awal
- `--non-interactive`: jalankan orientasi awal tanpa prompt
- `--mode <local|remote>`: mode orientasi awal
- `--import-from <provider>`: penyedia migrasi yang dijalankan selama orientasi awal
- `--import-source <path>`: direktori home agen sumber untuk `--import-from`
- `--import-secrets`: impor rahasia yang didukung selama migrasi orientasi awal
- `--remote-url <url>`: URL WebSocket Gateway jarak jauh
- `--remote-token <token>`: token Gateway jarak jauh

Untuk menjalankan orientasi awal melalui setup:

```bash
openclaw setup --wizard
```

Catatan:

- `openclaw setup` biasa menginisialisasi konfigurasi + ruang kerja tanpa alur orientasi awal penuh.
- Setelah setup biasa, jalankan `openclaw configure` untuk memilih model, saluran, Gateway, plugin, skills, atau pemeriksaan kesehatan.
- Orientasi awal berjalan otomatis saat ada flag orientasi awal apa pun (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Jika status Hermes terdeteksi, orientasi awal interaktif dapat menawarkan migrasi secara otomatis. Orientasi awal impor memerlukan setup baru; gunakan [Migrasi](/id/cli/migrate) untuk rencana simulasi, cadangan, dan mode penimpaan di luar orientasi awal.

## Terkait

- [Referensi CLI](/id/cli)
- [Ringkasan instalasi](/id/install)
