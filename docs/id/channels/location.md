---
read_when:
    - Menambahkan atau mengubah penguraian lokasi channel
    - Menggunakan field konteks lokasi dalam prompt agen atau tool
summary: Penguraian lokasi channel masuk (Telegram/WhatsApp/Matrix) dan field konteks
title: Penguraian lokasi channel
x-i18n:
    generated_at: "2026-04-24T08:58:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 15
---

OpenClaw menormalkan lokasi yang dibagikan dari channel chat menjadi:

- teks koordinat ringkas yang ditambahkan ke body masuk, dan
- field terstruktur dalam payload konteks balasan otomatis. Label, alamat, dan caption/komentar yang disediakan channel dirender ke dalam prompt melalui blok JSON metadata tidak tepercaya bersama, bukan inline di body pengguna.

Saat ini didukung:

- **Telegram** (pin lokasi + venue + lokasi live)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` dengan `geo_uri`)

## Pemformatan teks

Lokasi dirender sebagai baris yang mudah dibaca tanpa tanda kurung:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Tempat bernama:
  - `📍 48.858844, 2.294351 ±12m`
- Berbagi live:
  - `🛰 Lokasi live: 48.858844, 2.294351 ±12m`

Jika channel menyertakan label, alamat, atau caption/komentar, informasi itu dipertahankan dalam payload konteks dan muncul dalam prompt sebagai JSON tidak tepercaya yang dipagari:

````text
Location (untrusted metadata):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## Field konteks

Saat lokasi ada, field ini ditambahkan ke `ctx`:

- `LocationLat` (angka)
- `LocationLon` (angka)
- `LocationAccuracy` (angka, meter; opsional)
- `LocationName` (string; opsional)
- `LocationAddress` (string; opsional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)
- `LocationCaption` (string; opsional)

Perender prompt memperlakukan `LocationName`, `LocationAddress`, dan `LocationCaption` sebagai metadata tidak tepercaya dan menserialisasikannya melalui jalur JSON terbatas yang sama yang digunakan untuk konteks channel lainnya.

## Catatan channel

- **Telegram**: venue dipetakan ke `LocationName/LocationAddress`; lokasi live menggunakan `live_period`.
- **WhatsApp**: `locationMessage.comment` dan `liveLocationMessage.caption` mengisi `LocationCaption`.
- **Matrix**: `geo_uri` diurai sebagai lokasi pin; altitude diabaikan dan `LocationIsLive` selalu false.

## Terkait

- [Perintah lokasi (node)](/id/nodes/location-command)
- [Pengambilan kamera](/id/nodes/camera)
- [Pemahaman media](/id/nodes/media-understanding)
