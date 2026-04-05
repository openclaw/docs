---
read_when:
    - Anda sedang mengubah cara timestamp ditampilkan ke model atau pengguna
    - Anda sedang men-debug pemformatan waktu dalam pesan atau output prompt sistem
summary: Penanganan tanggal dan waktu di seluruh envelope, prompt, alat, dan connector
title: Tanggal dan Waktu
x-i18n:
    generated_at: "2026-04-05T13:52:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753af5946a006215d6af2467fa478f3abb42b1dff027cf85d5dc4c7ba4b58d39
    source_path: date-time.md
    workflow: 15
---

# Tanggal & Waktu

OpenClaw secara default menggunakan **waktu lokal host untuk timestamp transport** dan **zona waktu pengguna hanya di prompt sistem**.
Timestamp provider dipertahankan agar alat tetap memiliki semantik aslinya (waktu saat ini tersedia melalui `session_status`).

## Envelope pesan (lokal secara default)

Pesan masuk dibungkus dengan timestamp (presisi menit):

```
[Provider ... 2026-01-05 16:26 PST] teks pesan
```

Timestamp envelope ini **secara default menggunakan waktu lokal host**, terlepas dari zona waktu provider.

Anda dapat mengganti perilaku ini:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | zona waktu IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` menggunakan UTC.
- `envelopeTimezone: "local"` menggunakan zona waktu host.
- `envelopeTimezone: "user"` menggunakan `agents.defaults.userTimezone` (fallback ke zona waktu host).
- Gunakan zona waktu IANA eksplisit (misalnya, `"America/Chicago"`) untuk zona tetap.
- `envelopeTimestamp: "off"` menghapus timestamp absolut dari header envelope.
- `envelopeElapsed: "off"` menghapus sufiks waktu berlalu (gaya `+2m`).

### Contoh

**Lokal (default):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] halo
```

**Zona waktu pengguna:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] halo
```

**Waktu berlalu diaktifkan:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] tindak lanjut
```

## Prompt sistem: Current Date & Time

Jika zona waktu pengguna diketahui, prompt sistem menyertakan bagian khusus
**Current Date & Time** dengan **hanya zona waktunya** (tanpa format jam/waktu)
agar caching prompt tetap stabil:

```
Time zone: America/Chicago
```

Saat agen membutuhkan waktu saat ini, gunakan alat `session_status`; kartu status
menyertakan baris timestamp.

## Baris event sistem (lokal secara default)

Event sistem dalam antrean yang dimasukkan ke konteks agen diberi prefiks timestamp menggunakan
pemilihan zona waktu yang sama seperti envelope pesan (default: waktu lokal host).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Konfigurasikan zona waktu pengguna + format

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` menetapkan **zona waktu lokal pengguna** untuk konteks prompt.
- `timeFormat` mengontrol tampilan **12 jam/24 jam** di prompt. `auto` mengikuti preferensi OS.

## Deteksi format waktu (auto)

Saat `timeFormat: "auto"`, OpenClaw memeriksa preferensi OS (macOS/Windows)
dan fallback ke pemformatan locale. Nilai yang terdeteksi **di-cache per proses**
untuk menghindari panggilan sistem berulang.

## Payload alat + connector (waktu provider mentah + field ternormalisasi)

Alat channel mengembalikan **timestamp asli provider** dan menambahkan field ternormalisasi untuk konsistensi:

- `timestampMs`: milidetik epoch (UTC)
- `timestampUtc`: string UTC ISO 8601

Field provider mentah dipertahankan sehingga tidak ada yang hilang.

- Slack: string mirip epoch dari API
- Discord: timestamp ISO UTC
- Telegram/WhatsApp: timestamp numerik/ISO khusus provider

Jika Anda memerlukan waktu lokal, konversikan di downstream menggunakan zona waktu yang diketahui.

## Dokumentasi terkait

- [Prompt Sistem](/concepts/system-prompt)
- [Zona waktu](/concepts/timezone)
- [Pesan](/concepts/messages)
