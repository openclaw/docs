---
read_when:
    - Anda sedang mengubah cara timestamp ditampilkan ke model atau pengguna
    - Anda sedang men-debug pemformatan waktu dalam pesan atau output prompt sistem
summary: Penanganan tanggal dan waktu di seluruh envelope, prompt, alat, dan konektor
title: Tanggal dan waktu
x-i18n:
    generated_at: "2026-04-24T09:06:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d54da4077ac985ae1209b4364e049afb83b5746276e164181c1a30f0faa06e
    source_path: date-time.md
    workflow: 15
---

# Tanggal & Waktu

OpenClaw secara default menggunakan **waktu lokal host untuk timestamp transport** dan **timezone pengguna hanya di prompt sistem**.
Timestamp penyedia dipertahankan agar alat tetap memiliki semantik native-nya (waktu saat ini tersedia melalui `session_status`).

## Envelope pesan (lokal secara default)

Pesan masuk dibungkus dengan timestamp (presisi menit):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Timestamp envelope ini **lokal host secara default**, terlepas dari timezone penyedia.

Anda dapat mengoverride perilaku ini:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` menggunakan UTC.
- `envelopeTimezone: "local"` menggunakan timezone host.
- `envelopeTimezone: "user"` menggunakan `agents.defaults.userTimezone` (fallback ke timezone host).
- Gunakan timezone IANA eksplisit (misalnya, `"America/Chicago"`) untuk zona tetap.
- `envelopeTimestamp: "off"` menghapus timestamp absolut dari header envelope.
- `envelopeElapsed: "off"` menghapus sufiks waktu berlalu (gaya `+2m`).

### Contoh

**Lokal (default):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Timezone pengguna:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Waktu berlalu diaktifkan:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Prompt sistem: Current Date & Time

Jika timezone pengguna diketahui, prompt sistem menyertakan bagian khusus
**Current Date & Time** dengan **hanya zona waktu** (tanpa format jam/waktu)
untuk menjaga cache prompt tetap stabil:

```
Time zone: America/Chicago
```

Saat agen memerlukan waktu saat ini, gunakan alat `session_status`; kartu status
menyertakan baris timestamp.

## Baris event sistem (lokal secara default)

Event sistem dalam antrean yang disisipkan ke konteks agen diberi prefiks timestamp menggunakan
pemilihan timezone yang sama seperti envelope pesan (default: lokal host).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Konfigurasikan timezone pengguna + format

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

- `userTimezone` menetapkan **timezone lokal pengguna** untuk konteks prompt.
- `timeFormat` mengontrol tampilan **12j/24j** di prompt. `auto` mengikuti preferensi OS.

## Deteksi format waktu (auto)

Saat `timeFormat: "auto"`, OpenClaw memeriksa preferensi OS (macOS/Windows)
dan fallback ke pemformatan locale. Nilai yang terdeteksi **di-cache per proses**
untuk menghindari panggilan sistem berulang.

## Payload alat + konektor (waktu mentah penyedia + field ternormalisasi)

Alat channel mengembalikan **timestamp native penyedia** dan menambahkan field ternormalisasi untuk konsistensi:

- `timestampMs`: epoch milidetik (UTC)
- `timestampUtc`: string UTC ISO 8601

Field mentah penyedia dipertahankan sehingga tidak ada yang hilang.

- Slack: string mirip epoch dari API
- Discord: timestamp ISO UTC
- Telegram/WhatsApp: timestamp numerik/ISO spesifik penyedia

Jika Anda memerlukan waktu lokal, konversikan di tahap downstream menggunakan timezone yang diketahui.

## Dokumentasi terkait

- [System Prompt](/id/concepts/system-prompt)
- [Timezones](/id/concepts/timezone)
- [Messages](/id/concepts/messages)
