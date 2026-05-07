---
read_when:
    - Menambahkan atau mengubah integrasi CLI eksternal
    - Men-debug adapter RPC (signal-cli, imsg)
summary: Adaptor RPC untuk CLI eksternal (signal-cli, imsg) dan pola Gateway
title: Adaptor RPC
x-i18n:
    generated_at: "2026-05-07T01:53:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw mengintegrasikan CLI eksternal melalui JSON-RPC. Dua pola digunakan saat ini.

## Pola A: daemon HTTP (signal-cli)

- `signal-cli` berjalan sebagai daemon dengan JSON-RPC melalui HTTP.
- Aliran peristiwa adalah SSE (`/api/v1/events`).
- Probe kesehatan: `/api/v1/check`.
- OpenClaw memiliki siklus hidup saat `channels.signal.autoStart=true`.

Lihat [Signal](/id/channels/signal) untuk penyiapan dan endpoint.

## Pola B: proses anak stdio (lama: imsg)

> **Catatan:** Untuk penyiapan iMessage baru, gunakan [BlueBubbles](/id/channels/bluebubbles) sebagai gantinya.

- OpenClaw menjalankan `imsg rpc` sebagai proses anak (integrasi iMessage lama).
- JSON-RPC dibatasi baris melalui stdin/stdout (satu objek JSON per baris).
- Tidak ada port TCP, tidak memerlukan daemon.

Metode inti yang digunakan:

- `watch.subscribe` → notifikasi (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostik)

Lihat [iMessage](/id/channels/imessage) untuk penyiapan lama dan pengalamatan (`chat_id` lebih disukai).

## Panduan adaptor

- Gateway memiliki proses (mulai/henti terkait dengan siklus hidup penyedia).
- Jaga agar klien RPC tetap tangguh: timeout, mulai ulang saat keluar.
- Lebih pilih ID stabil (mis., `chat_id`) daripada string tampilan.

## Terkait

- [Protokol Gateway](/id/gateway/protocol)
