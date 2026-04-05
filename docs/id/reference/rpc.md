---
read_when:
    - Menambahkan atau mengubah integrasi CLI eksternal
    - Men-debug adaptor RPC (signal-cli, imsg)
summary: Adaptor RPC untuk CLI eksternal (signal-cli, imsg lama) dan pola gateway
title: Adaptor RPC
x-i18n:
    generated_at: "2026-04-05T14:05:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06dc6b97184cc704ba4ec4a9af90502f4316bcf717c3f4925676806d8b184c57
    source_path: reference/rpc.md
    workflow: 15
---

# Adaptor RPC

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
- JSON-RPC dibatasi per baris melalui stdin/stdout (satu objek JSON per baris).
- Tidak ada port TCP, tidak memerlukan daemon.

Metode inti yang digunakan:

- `watch.subscribe` → notifikasi (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostik)

Lihat [iMessage](/id/channels/imessage) untuk penyiapan lama dan pengalamatan (`chat_id` lebih disukai).

## Panduan adaptor

- Gateway memiliki proses tersebut (mulai/berhenti terkait dengan siklus hidup penyedia).
- Jaga agar klien RPC tetap tangguh: batas waktu, mulai ulang saat keluar.
- Utamakan ID yang stabil (misalnya, `chat_id`) daripada string tampilan.
