---
read_when:
    - Anda ingin memasukkan event sistem ke antrean tanpa membuat job Cron
    - Anda perlu mengaktifkan atau menonaktifkan Heartbeat
    - Anda ingin memeriksa entri presence sistem
summary: Referensi CLI untuk `openclaw system` (event sistem, Heartbeat, presence)
title: Sistem
x-i18n:
    generated_at: "2026-04-24T09:03:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Helper tingkat sistem untuk Gateway: masukkan event sistem ke antrean, kendalikan Heartbeat,
dan lihat presence.

Semua subperintah `system` menggunakan RPC Gateway dan menerima flag klien bersama:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Perintah umum

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Masukkan event sistem ke antrean pada sesi **main**. Heartbeat berikutnya akan menyuntikkannya
sebagai baris `System:` di prompt. Gunakan `--mode now` untuk memicu Heartbeat
segera; `next-heartbeat` menunggu tick terjadwal berikutnya.

Flag:

- `--text <text>`: teks event sistem yang wajib.
- `--mode <mode>`: `now` atau `next-heartbeat` (default).
- `--json`: output yang dapat dibaca mesin.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag RPC Gateway bersama.

## `system heartbeat last|enable|disable`

Kontrol Heartbeat:

- `last`: tampilkan event Heartbeat terakhir.
- `enable`: aktifkan kembali Heartbeat (gunakan ini jika sebelumnya dinonaktifkan).
- `disable`: jeda Heartbeat.

Flag:

- `--json`: output yang dapat dibaca mesin.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag RPC Gateway bersama.

## `system presence`

Daftarkan entri presence sistem saat ini yang diketahui Gateway (Node,
instance, dan baris status serupa).

Flag:

- `--json`: output yang dapat dibaca mesin.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag RPC Gateway bersama.

## Catatan

- Memerlukan Gateway yang sedang berjalan dan dapat dijangkau oleh config saat ini (lokal atau remote).
- Event sistem bersifat ephemeral dan tidak dipersistenkan saat restart.

## Terkait

- [Referensi CLI](/id/cli)
