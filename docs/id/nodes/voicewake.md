---
read_when:
    - Mengubah perilaku atau default kata pemicu suara
    - Adding new node platforms that need wake word sync
summary: Kata pemicu suara global (dimiliki Gateway) dan cara sinkronisasinya di seluruh Node
title: Voice wake
x-i18n:
    generated_at: "2026-04-24T09:15:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw memperlakukan **kata pemicu** sebagai **satu daftar global** yang dimiliki oleh **Gateway**.

- Tidak ada **kata pemicu kustom per-Node**.
- **UI Node/aplikasi mana pun dapat mengedit** daftar tersebut; perubahan dipersistenkan oleh Gateway dan disiarkan ke semua orang.
- macOS dan iOS mempertahankan toggle lokal **Voice Wake enabled/disabled** (UX lokal + izin berbeda).
- Android saat ini tetap menonaktifkan Voice Wake dan menggunakan alur mic manual di tab Voice.

## Penyimpanan (host Gateway)

Kata pemicu disimpan di mesin gateway pada:

- `~/.openclaw/settings/voicewake.json`

Bentuk:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protokol

### Metode

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` dengan parameter `{ triggers: string[] }` → `{ triggers: string[] }`

Catatan:

- Trigger dinormalisasi (spasi dipangkas, entri kosong dibuang). Daftar kosong fallback ke default.
- Batas diberlakukan untuk keamanan (batas jumlah/panjang).

### Event

- payload `voicewake.changed` `{ triggers: string[] }`

Siapa yang menerimanya:

- Semua klien WebSocket (aplikasi macOS, WebChat, dll.)
- Semua Node yang terhubung (iOS/Android), dan juga saat Node connect sebagai push “state saat ini” awal.

## Perilaku klien

### aplikasi macOS

- Menggunakan daftar global untuk mengendalikan trigger `VoiceWakeRuntime`.
- Mengedit “Trigger words” di pengaturan Voice Wake memanggil `voicewake.set` lalu mengandalkan broadcast untuk menjaga klien lain tetap sinkron.

### Node iOS

- Menggunakan daftar global untuk deteksi trigger `VoiceWakeManager`.
- Mengedit Wake Words di Settings memanggil `voicewake.set` (melalui WS Gateway) dan juga menjaga deteksi kata pemicu lokal tetap responsif.

### Node Android

- Voice Wake saat ini dinonaktifkan di runtime/Settings Android.
- Voice Android menggunakan penangkapan mic manual di tab Voice alih-alih trigger kata pemicu.

## Terkait

- [Talk mode](/id/nodes/talk)
- [Audio and voice notes](/id/nodes/audio)
- [Media understanding](/id/nodes/media-understanding)
