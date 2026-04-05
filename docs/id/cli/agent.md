---
read_when:
    - Anda ingin menjalankan satu giliran agen dari skrip (opsional kirim balasan)
summary: Referensi CLI untuk `openclaw agent` (kirim satu giliran agen melalui Gateway)
title: agent
x-i18n:
    generated_at: "2026-04-05T13:45:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0627f943bc7f3556318008f76dc6150788cf06927dccdc7d2681acb98f257d56
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Jalankan satu giliran agen melalui Gateway (gunakan `--local` untuk mode tersemat).
Gunakan `--agent <id>` untuk langsung menargetkan agen yang dikonfigurasi.

Berikan setidaknya satu pemilih sesi:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Terkait:

- Tool pengiriman agen: [Agent send](/tools/agent-send)

## Opsi

- `-m, --message <text>`: isi pesan wajib
- `-t, --to <dest>`: penerima yang digunakan untuk menurunkan kunci sesi
- `--session-id <id>`: id sesi eksplisit
- `--agent <id>`: id agen; menggantikan binding routing
- `--thinking <off|minimal|low|medium|high|xhigh>`: level thinking agen
- `--verbose <on|off>`: simpan level verbose untuk sesi
- `--channel <channel>`: channel pengiriman; hilangkan untuk menggunakan channel sesi utama
- `--reply-to <target>`: override target pengiriman
- `--reply-channel <channel>`: override channel pengiriman
- `--reply-account <id>`: override akun pengiriman
- `--local`: jalankan agen tersemat secara langsung (setelah preload registry plugin)
- `--deliver`: kirim balasan kembali ke channel/target yang dipilih
- `--timeout <seconds>`: override timeout agen (default 600 atau nilai config)
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

- Mode Gateway fallback ke agen tersemat saat permintaan Gateway gagal. Gunakan `--local` untuk memaksa eksekusi tersemat sejak awal.
- `--local` tetap melakukan preload registry plugin terlebih dahulu, sehingga provider, tool, dan channel yang disediakan plugin tetap tersedia selama eksekusi tersemat.
- `--channel`, `--reply-channel`, dan `--reply-account` memengaruhi pengiriman balasan, bukan routing sesi.
- Saat perintah ini memicu regenerasi `models.json`, kredensial provider yang dikelola SecretRef disimpan sebagai penanda non-rahasia (misalnya nama env var, `secretref-env:ENV_VAR_NAME`, atau `secretref-managed`), bukan plaintext rahasia yang sudah di-resolve.
- Penulisan penanda bersifat source-authoritative: OpenClaw menyimpan penanda dari snapshot config sumber aktif, bukan dari nilai rahasia runtime yang sudah di-resolve.
