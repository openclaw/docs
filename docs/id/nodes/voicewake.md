---
read_when:
    - Mengubah perilaku atau nilai default kata pemicu suara
    - Menambahkan platform Node baru yang memerlukan sinkronisasi kata bangun
summary: Kata bangun suara global (dimiliki Gateway) dan cara sinkronisasinya di seluruh node
title: Aktivasi suara
x-i18n:
    generated_at: "2026-05-06T09:19:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: a284cbe3e12784a8d7a3eab6ba8ae230123557bca7593c956111199b94b91b73
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw memperlakukan **kata bangun sebagai satu daftar global** yang dimiliki oleh **Gateway**.

- Tidak ada **kata bangun kustom per node**.
- **UI node/aplikasi mana pun dapat mengedit** daftar tersebut; perubahan dipertahankan oleh Gateway dan disiarkan ke semua orang.
- macOS dan iOS menyimpan toggle lokal **Voice Wake aktif/nonaktif** (UX lokal + izin berbeda).
- Android saat ini tetap mematikan Voice Wake dan menggunakan alur mikrofon manual di tab Voice.

## Penyimpanan (host Gateway)

Kata bangun disimpan di mesin gateway pada:

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

- Pemicu dinormalisasi (dipangkas, nilai kosong dibuang). Daftar kosong kembali ke default.
- Batas diterapkan untuk keamanan (batas jumlah/panjang).

### Metode perutean (pemicu → target)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` dengan params `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Bentuk `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Target rute mendukung tepat salah satu dari:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Peristiwa

- payload `voicewake.changed` `{ triggers: string[] }`
- payload `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Siapa yang menerimanya:

- Semua klien WebSocket (aplikasi macOS, WebChat, dll.)
- Semua node yang terhubung (iOS/Android), dan juga saat node terhubung sebagai push "status saat ini" awal.

## Perilaku klien

### Aplikasi macOS

- Menggunakan daftar global untuk membatasi pemicu `VoiceWakeRuntime`.
- Mengedit "Trigger words" di pengaturan Voice Wake memanggil `voicewake.set` lalu mengandalkan siaran untuk menjaga klien lain tetap sinkron.

### Node iOS

- Menggunakan daftar global untuk deteksi pemicu `VoiceWakeManager`.
- Mengedit Wake Words di Settings memanggil `voicewake.set` (melalui Gateway WS) dan juga menjaga deteksi kata bangun lokal tetap responsif.

### Node Android

- Voice Wake saat ini dinonaktifkan di runtime/Settings Android.
- Suara Android menggunakan penangkapan mikrofon manual di tab Voice, bukan pemicu kata bangun.

## Terkait

- [Mode bicara](/id/nodes/talk)
- [Audio dan catatan suara](/id/nodes/audio)
- [Pemahaman media](/id/nodes/media-understanding)
