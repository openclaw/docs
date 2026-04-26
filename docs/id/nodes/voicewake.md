---
read_when:
    - Mengubah perilaku atau default voice wake word
    - Menambahkan platform node baru yang memerlukan sinkronisasi wake word
summary: Wake word suara global (dimiliki Gateway) dan cara sinkronisasinya di seluruh node
title: Voice wake
x-i18n:
    generated_at: "2026-04-26T11:33:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw memperlakukan **wake word sebagai satu daftar global** yang dimiliki oleh **Gateway**.

- **Tidak ada wake word kustom per-node**.
- **UI node/app mana pun dapat mengedit** daftar tersebut; perubahan dipersistenkan oleh Gateway dan dibroadcast ke semua orang.
- macOS dan iOS tetap memiliki toggle lokal **Voice Wake aktif/nonaktif** (UX lokal + izin berbeda).
- Android saat ini mempertahankan Voice Wake nonaktif dan menggunakan alur mic manual di tab Voice.

## Penyimpanan (host Gateway)

Wake word disimpan pada mesin gateway di:

- `~/.openclaw/settings/voicewake.json`

Bentuk:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protokol

### Method

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` dengan parameter `{ triggers: string[] }` → `{ triggers: string[] }`

Catatan:

- Trigger dinormalisasi (spasi dipangkas, entri kosong dibuang). Daftar kosong fallback ke default.
- Batas diterapkan demi keamanan (batas jumlah/panjang).

### Method perutean (trigger → target)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` dengan parameter `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Bentuk `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Target rute mendukung tepat satu dari:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Event

- `voicewake.changed` payload `{ triggers: string[] }`
- `voicewake.routing.changed` payload `{ config: VoiceWakeRoutingConfig }`

Siapa yang menerimanya:

- Semua klien WebSocket (app macOS, WebChat, dll.)
- Semua node yang terhubung (iOS/Android), dan juga saat node terhubung sebagai push “state saat ini” awal.

## Perilaku klien

### App macOS

- Menggunakan daftar global untuk menggerbang trigger `VoiceWakeRuntime`.
- Mengedit “Trigger words” di pengaturan Voice Wake memanggil `voicewake.set` lalu mengandalkan broadcast agar klien lain tetap sinkron.

### Node iOS

- Menggunakan daftar global untuk deteksi trigger `VoiceWakeManager`.
- Mengedit Wake Words di Settings memanggil `voicewake.set` (melalui WS Gateway) dan juga menjaga deteksi wake word lokal tetap responsif.

### Node Android

- Voice Wake saat ini dinonaktifkan di runtime/Settings Android.
- Voice Android menggunakan pengambilan mic manual di tab Voice alih-alih trigger wake word.

## Terkait

- [Mode talk](/id/nodes/talk)
- [Audio dan catatan suara](/id/nodes/audio)
- [Media understanding](/id/nodes/media-understanding)
