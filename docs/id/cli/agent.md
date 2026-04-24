---
read_when:
    - Anda ingin menjalankan satu giliran agen dari skrip (opsional mengirim balasan)
summary: Referensi CLI untuk `openclaw agent` (mengirim satu giliran agen melalui Gateway)
title: Agen
x-i18n:
    generated_at: "2026-04-24T09:00:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Jalankan satu giliran agen melalui Gateway (gunakan `--local` untuk mode tertanam).
Gunakan `--agent <id>` untuk langsung menargetkan agen yang dikonfigurasi.

Teruskan setidaknya satu pemilih sesi:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Terkait:

- Tool pengiriman agen: [Agent send](/id/tools/agent-send)

## Opsi

- `-m, --message <text>`: body pesan yang wajib
- `-t, --to <dest>`: penerima yang digunakan untuk menurunkan key sesi
- `--session-id <id>`: ID sesi eksplisit
- `--agent <id>`: ID agen; menimpa binding routing
- `--thinking <level>`: tingkat thinking agen (`off`, `minimal`, `low`, `medium`, `high`, ditambah tingkat kustom yang didukung provider seperti `xhigh`, `adaptive`, atau `max`)
- `--verbose <on|off>`: mempertahankan tingkat verbose untuk sesi
- `--channel <channel>`: kanal pengiriman; kosongkan untuk menggunakan kanal sesi utama
- `--reply-to <target>`: override target pengiriman
- `--reply-channel <channel>`: override kanal pengiriman
- `--reply-account <id>`: override akun pengiriman
- `--local`: jalankan agen tertanam secara langsung (setelah preload registry Plugin)
- `--deliver`: kirim balasan kembali ke kanal/target yang dipilih
- `--timeout <seconds>`: timpa timeout agen (default 600 atau nilai konfigurasi)
- `--json`: keluarkan JSON

## Contoh

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Catatan

- Mode Gateway fallback ke agen tertanam saat permintaan Gateway gagal. Gunakan `--local` untuk memaksa eksekusi tertanam sejak awal.
- `--local` tetap melakukan preload registry Plugin terlebih dahulu, sehingga provider, tool, dan kanal yang disediakan Plugin tetap tersedia selama eksekusi tertanam.
- `--channel`, `--reply-channel`, dan `--reply-account` memengaruhi pengiriman balasan, bukan routing sesi.
- Saat perintah ini memicu regenerasi `models.json`, kredensial provider yang dikelola SecretRef dipertahankan sebagai marker non-rahasia (misalnya nama env var, `secretref-env:ENV_VAR_NAME`, atau `secretref-managed`), bukan plaintext rahasia yang telah diselesaikan.
- Penulisan marker bersifat source-authoritative: OpenClaw mempertahankan marker dari snapshot konfigurasi sumber aktif, bukan dari nilai rahasia runtime yang telah diselesaikan.

## Terkait

- [Referensi CLI](/id/cli)
- [Runtime agen](/id/concepts/agent)
