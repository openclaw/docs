---
read_when:
    - Menambahkan atau memodifikasi penguraian lokasi channel
    - Menggunakan field konteks lokasi dalam prompt agent atau tool
summary: Penguraian lokasi channel masuk (Telegram/WhatsApp/Matrix) dan field konteks
title: Channel Location Parsing
x-i18n:
    generated_at: "2026-04-05T13:43:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10061f0c109240a9e0bcab649b17f03b674e8bdf410debf3669b7b6da8189d96
    source_path: channels/location.md
    workflow: 15
---

# Penguraian lokasi channel

OpenClaw menormalkan lokasi bersama dari chat channel menjadi:

- teks yang dapat dibaca manusia yang ditambahkan ke body masuk, dan
- field terstruktur dalam payload konteks balasan otomatis.

Saat ini didukung:

- **Telegram** (pin lokasi + venue + lokasi live)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` dengan `geo_uri`)

## Pemformatan teks

Lokasi dirender sebagai baris yang ramah tanpa tanda kurung:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Tempat bernama:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Berbagi live:
  - `🛰 Lokasi live: 48.858844, 2.294351 ±12m`

Jika channel menyertakan caption/komentar, itu ditambahkan pada baris berikutnya:

```
📍 48.858844, 2.294351 ±12m
Temui di sini
```

## Field konteks

Saat lokasi ada, field ini ditambahkan ke `ctx`:

- `LocationLat` (angka)
- `LocationLon` (angka)
- `LocationAccuracy` (angka, meter; opsional)
- `LocationName` (string; opsional)
- `LocationAddress` (string; opsional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)

## Catatan channel

- **Telegram**: venue dipetakan ke `LocationName/LocationAddress`; lokasi live menggunakan `live_period`.
- **WhatsApp**: `locationMessage.comment` dan `liveLocationMessage.caption` ditambahkan sebagai baris caption.
- **Matrix**: `geo_uri` diurai sebagai lokasi pin; ketinggian diabaikan dan `LocationIsLive` selalu false.
