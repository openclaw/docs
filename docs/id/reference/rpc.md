---
read_when:
    - Menambahkan atau mengubah integrasi CLI eksternal
    - Men-debug adaptor RPC (signal-cli, imsg)
summary: Adaptor RPC untuk CLI eksternal (signal-cli, imsg) dan pola Gateway
title: Adaptor RPC
x-i18n:
    generated_at: "2026-07-12T14:37:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw mengintegrasikan CLI eksternal melalui JSON-RPC. Saat ini, ada dua pola yang digunakan.

## Pola A: daemon HTTP (signal-cli)

- `signal-cli` berjalan sebagai daemon dengan JSON-RPC melalui HTTP.
- Aliran peristiwa menggunakan SSE (`/api/v1/events`).
- Pemeriksaan kesehatan: `/api/v1/check`.
- OpenClaw mengelola siklus hidup ketika `channels.signal.autoStart=true`.

Lihat [Signal](/id/channels/signal) untuk penyiapan dan endpoint.

## Pola B: proses anak stdio (imsg)

- OpenClaw menjalankan `imsg rpc` sebagai proses anak untuk [iMessage](/id/channels/imessage).
- JSON-RPC dipisahkan per baris melalui stdin/stdout (satu objek JSON per baris).
- Tidak ada port TCP dan tidak memerlukan daemon.

Metode inti yang digunakan:

- `watch.subscribe` → notifikasi (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (pemeriksaan/diagnostik)

Lihat [iMessage](/id/channels/imessage) untuk penyiapan dan pengalamatan (`chat_id` lebih disarankan daripada string tampilan).

## Pedoman adaptor

- Gateway mengelola proses (mulai/berhenti terkait dengan siklus hidup penyedia).
- Pastikan klien RPC tetap tangguh: gunakan batas waktu dan mulai ulang saat proses berhenti.
- Utamakan ID stabil (misalnya, `chat_id`) daripada string tampilan.

## Terkait

- [Protokol Gateway](/id/gateway/protocol)
