---
read_when:
    - Menambahkan atau mengubah integrasi CLI eksternal
    - Menelusuri kesalahan adaptor RPC (signal-cli, imsg)
summary: Adapter RPC untuk CLI eksternal (signal-cli, imsg) dan pola Gateway
title: Adapter RPC
x-i18n:
    generated_at: "2026-05-10T19:51:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw mengintegrasikan CLI eksternal melalui JSON-RPC. Dua pola digunakan saat ini.

## Pola A: daemon HTTP (signal-cli)

- `signal-cli` berjalan sebagai daemon dengan JSON-RPC melalui HTTP.
- Aliran peristiwa adalah SSE (`/api/v1/events`).
- Probe kesehatan: `/api/v1/check`.
- OpenClaw mengelola siklus hidup saat `channels.signal.autoStart=true`.

Lihat [Signal](/id/channels/signal) untuk penyiapan dan endpoint.

## Pola B: proses anak stdio (imsg)

- OpenClaw menjalankan `imsg rpc` sebagai proses anak untuk [iMessage](/id/channels/imessage).
- JSON-RPC dibatasi baris melalui stdin/stdout (satu objek JSON per baris).
- Tidak ada port TCP, tidak diperlukan daemon.

Metode inti yang digunakan:

- `watch.subscribe` → notifikasi (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostik)

Lihat [iMessage](/id/channels/imessage) untuk penyiapan legacy dan pengalamatan (`chat_id` lebih disukai).

## Panduan adapter

- Gateway mengelola proses (start/stop terkait dengan siklus hidup provider).
- Jaga agar klien RPC tetap tangguh: timeout, mulai ulang saat keluar.
- Lebih pilih ID stabil (misalnya, `chat_id`) daripada string tampilan.

## Terkait

- [Protokol Gateway](/id/gateway/protocol)
