---
read_when:
    - Mengubah perilaku atau default voice wake word
    - Menambahkan platform node baru yang memerlukan sinkronisasi wake word
summary: Voice wake word global (milik Gateway) dan cara sinkronisasinya di seluruh node
title: Voice Wake
x-i18n:
    generated_at: "2026-04-05T13:59:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80e0cf7f68a3d48ff79af0ffb3058a7a0ecebd2cdbaad20b9ff53bc2b39dc84
    source_path: nodes/voicewake.md
    workflow: 15
---

# Voice Wake (Wake Word Global)

OpenClaw memperlakukan **wake word sebagai satu daftar global** yang dimiliki oleh **Gateway**.

- Tidak ada **wake word kustom per node**.
- **UI node/app mana pun dapat mengedit** daftar tersebut; perubahan dipersistenkan oleh Gateway dan disiarkan ke semua orang.
- macOS dan iOS mempertahankan toggle lokal **Voice Wake aktif/nonaktif** (UX lokal + izin berbeda).
- Android saat ini mempertahankan Voice Wake tetap nonaktif dan menggunakan alur mic manual di tab Voice.

## Penyimpanan (host Gateway)

Wake word disimpan di mesin gateway pada:

- `~/.openclaw/settings/voicewake.json`

Bentuk:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protokol

### Metode

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` dengan params `{ triggers: string[] }` → `{ triggers: string[] }`

Catatan:

- Trigger dinormalisasi (spasi dipangkas, entri kosong dibuang). Daftar kosong akan fallback ke default.
- Batas diterapkan demi keamanan (batas jumlah/panjang).

### Event

- Payload `voicewake.changed` `{ triggers: string[] }`

Siapa yang menerimanya:

- Semua klien WebSocket (app macOS, WebChat, dll.)
- Semua node yang terhubung (iOS/Android), dan juga saat node terhubung sebagai push “state saat ini” awal.

## Perilaku klien

### App macOS

- Menggunakan daftar global untuk mengendalikan trigger `VoiceWakeRuntime`.
- Mengedit “Trigger words” di pengaturan Voice Wake memanggil `voicewake.set` lalu mengandalkan siaran untuk menjaga klien lain tetap sinkron.

### Node iOS

- Menggunakan daftar global untuk deteksi trigger `VoiceWakeManager`.
- Mengedit Wake Words di Settings memanggil `voicewake.set` (melalui Gateway WS) dan juga menjaga deteksi wake word lokal tetap responsif.

### Node Android

- Voice Wake saat ini dinonaktifkan di runtime/Settings Android.
- Voice Android menggunakan pengambilan mic manual di tab Voice alih-alih trigger wake word.
