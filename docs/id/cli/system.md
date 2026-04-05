---
read_when:
    - Anda ingin mengantrekan peristiwa sistem tanpa membuat tugas cron
    - Anda perlu mengaktifkan atau menonaktifkan heartbeat
    - Anda ingin memeriksa entri presence sistem
summary: Referensi CLI untuk `openclaw system` (peristiwa sistem, heartbeat, presence)
title: system
x-i18n:
    generated_at: "2026-04-05T13:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7d19afde9d9cde8a79b0bb8cec6e5673466f4cb9b575fb40111fc32f4eee5d7
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Helper tingkat sistem untuk Gateway: mengantrekan peristiwa sistem, mengontrol heartbeat,
dan melihat presence.

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

Antrekan peristiwa sistem pada sesi **utama**. Heartbeat berikutnya akan menyisipkannya
sebagai baris `System:` di prompt. Gunakan `--mode now` untuk memicu heartbeat
segera; `next-heartbeat` menunggu tick terjadwal berikutnya.

Flag:

- `--text <text>`: teks peristiwa sistem yang wajib diisi.
- `--mode <mode>`: `now` atau `next-heartbeat` (default).
- `--json`: output yang dapat dibaca mesin.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag RPC Gateway bersama.

## `system heartbeat last|enable|disable`

Kontrol heartbeat:

- `last`: tampilkan peristiwa heartbeat terakhir.
- `enable`: aktifkan kembali heartbeat (gunakan ini jika sebelumnya dinonaktifkan).
- `disable`: jeda heartbeat.

Flag:

- `--json`: output yang dapat dibaca mesin.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag RPC Gateway bersama.

## `system presence`

Daftarkan entri presence sistem saat ini yang diketahui Gateway (node,
instance, dan baris status serupa).

Flag:

- `--json`: output yang dapat dibaca mesin.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag RPC Gateway bersama.

## Catatan

- Memerlukan Gateway yang sedang berjalan dan dapat dijangkau oleh konfigurasi Anda saat ini (lokal atau jarak jauh).
- Peristiwa sistem bersifat sementara dan tidak disimpan setelah restart.
