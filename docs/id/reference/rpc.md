---
read_when:
    - Menambahkan atau mengubah integrasi CLI eksternal
    - Men-debug adaptor RPC (signal-cli, imsg)
summary: Adaptor RPC untuk CLI eksternal (signal-cli, imsg lama) dan pola Gateway
title: Adaptor RPC
x-i18n:
    generated_at: "2026-04-24T09:26:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw mengintegrasikan CLI eksternal melalui JSON-RPC. Dua pola digunakan saat ini.

## Pola A: daemon HTTP (signal-cli)

- `signal-cli` berjalan sebagai daemon dengan JSON-RPC melalui HTTP.
- Aliran event adalah SSE (`/api/v1/events`).
- Probe health: `/api/v1/check`.
- OpenClaw memiliki lifecycle saat `channels.signal.autoStart=true`.

Lihat [Signal](/id/channels/signal) untuk penyiapan dan endpoint.

## Pola B: proses anak stdio (lama: imsg)

> **Catatan:** Untuk penyiapan iMessage baru, gunakan [BlueBubbles](/id/channels/bluebubbles) sebagai gantinya.

- OpenClaw menjalankan `imsg rpc` sebagai proses anak (integrasi iMessage lama).
- JSON-RPC dibatasi per baris melalui stdin/stdout (satu objek JSON per baris).
- Tidak ada port TCP, tidak memerlukan daemon.

Metode inti yang digunakan:

- `watch.subscribe` → notifikasi (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostik)

Lihat [iMessage](/id/channels/imessage) untuk penyiapan lama dan pengalamatan (`chat_id` lebih disarankan).

## Panduan adaptor

- Gateway memiliki proses tersebut (mulai/berhenti terikat ke lifecycle penyedia).
- Jaga klien RPC tetap tangguh: timeout, mulai ulang saat proses keluar.
- Gunakan ID yang stabil (misalnya, `chat_id`) daripada string tampilan.

## Terkait

- [Protokol Gateway](/id/gateway/protocol)
