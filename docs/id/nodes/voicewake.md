---
read_when:
    - Mengubah perilaku atau default kata bangun suara
    - Menambahkan platform Node baru yang memerlukan sinkronisasi kata pemicu
summary: Kata pemicu suara global (milik Gateway) dan cara sinkronisasinya di seluruh node
title: Bangun suara
x-i18n:
    generated_at: "2026-06-27T17:40:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw memperlakukan **kata bangun sebagai satu daftar global** yang dimiliki oleh **Gateway**.

- **Tidak ada kata bangun kustom per node**.
- **UI node/aplikasi mana pun dapat mengedit** daftar tersebut; perubahan dipersistenkan oleh Gateway dan disiarkan ke semua orang.
- macOS dan iOS mempertahankan toggle lokal **Bangun Suara aktif/nonaktif** (UX lokal + izin berbeda).
- Android saat ini membiarkan Bangun Suara nonaktif dan menggunakan alur mikrofon manual di tab Suara.

## Penyimpanan (host Gateway)

Kata bangun dan aturan perutean disimpan di database status gateway:

- `~/.openclaw/state/openclaw.sqlite`

Tabel yang aktif adalah:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

File legacy `settings/voicewake.json` dan `settings/voicewake-routing.json` hanya merupakan input migrasi doctor; runtime membaca dan menulis tabel SQLite.

## Protokol

### Metode

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` dengan parameter `{ triggers: string[] }` → `{ triggers: string[] }`

Catatan:

- Pemicu dinormalisasi (dipangkas, nilai kosong dibuang). Daftar kosong kembali ke default.
- Batas diterapkan demi keamanan (batas jumlah/panjang).

### Metode perutean (pemicu → target)

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

Target rute mendukung tepat salah satu dari:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Peristiwa

- payload `voicewake.changed` `{ triggers: string[] }`
- payload `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Yang menerimanya:

- Semua klien WebSocket (aplikasi macOS, WebChat, dll.)
- Semua node yang terhubung (iOS/Android), dan juga saat node terhubung sebagai push awal "status saat ini".

## Perilaku klien

### Aplikasi macOS

- Menggunakan daftar global untuk membatasi pemicu `VoiceWakeRuntime`.
- Mengedit "Kata pemicu" di pengaturan Bangun Suara memanggil `voicewake.set`, lalu mengandalkan siaran agar klien lain tetap sinkron.

### Node iOS

- Menggunakan daftar global untuk deteksi pemicu `VoiceWakeManager`.
- Mengedit Kata Bangun di Pengaturan memanggil `voicewake.set` (melalui Gateway WS) dan juga menjaga deteksi kata bangun lokal tetap responsif.

### Node Android

- Bangun Suara saat ini dinonaktifkan di runtime/Pengaturan Android.
- Suara Android menggunakan penangkapan mikrofon manual di tab Suara, bukan pemicu kata bangun.

## Terkait

- [Mode bicara](/id/nodes/talk)
- [Audio dan catatan suara](/id/nodes/audio)
- [Pemahaman media](/id/nodes/media-understanding)
