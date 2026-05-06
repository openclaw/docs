---
read_when:
    - Anda mengubah cara stempel waktu ditampilkan kepada model atau pengguna
    - Anda sedang memecahkan masalah pemformatan waktu dalam pesan atau keluaran prompt sistem
summary: Penanganan tanggal dan waktu di seluruh amplop, prompt, alat, dan konektor
title: Tanggal dan waktu
x-i18n:
    generated_at: "2026-05-06T09:10:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw secara default menggunakan **waktu lokal host untuk stempel waktu transport** dan **zona waktu pengguna hanya di prompt sistem**.
Stempel waktu penyedia dipertahankan agar alat tetap menjaga semantik aslinya (waktu saat ini tersedia melalui `session_status`).

## Amplop pesan (lokal secara default)

Pesan masuk dibungkus dengan stempel waktu (presisi menit):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Stempel waktu amplop ini **lokal host secara default**, terlepas dari zona waktu penyedia.

Anda dapat mengganti perilaku ini:

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
- `envelopeTimezone: "local"` menggunakan zona waktu host.
- `envelopeTimezone: "user"` menggunakan `agents.defaults.userTimezone` (kembali ke zona waktu host).
- Gunakan zona waktu IANA eksplisit (misalnya, `"America/Chicago"`) untuk zona tetap.
- `envelopeTimestamp: "off"` menghapus stempel waktu absolut dari header amplop.
- `envelopeElapsed: "off"` menghapus sufiks waktu berlalu (gaya `+2m`).

### Contoh

**Lokal (default):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Zona waktu pengguna:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Waktu berlalu diaktifkan:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Prompt sistem: tanggal dan waktu saat ini

Jika zona waktu pengguna diketahui, prompt sistem menyertakan bagian khusus
**Tanggal & Waktu Saat Ini** dengan **zona waktu saja** (tanpa format jam/waktu)
untuk menjaga cache prompt tetap stabil:

```
Time zone: America/Chicago
```

Saat agen memerlukan waktu saat ini, gunakan alat `session_status`; kartu status
menyertakan baris stempel waktu.

## Baris peristiwa sistem (lokal secara default)

Peristiwa sistem antrean yang dimasukkan ke dalam konteks agen diawali dengan stempel waktu menggunakan
pemilihan zona waktu yang sama seperti amplop pesan (default: lokal host).

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
- `timeFormat` mengontrol **tampilan 12j/24j** dalam prompt. `auto` mengikuti preferensi OS.

## Deteksi format waktu (auto)

Saat `timeFormat: "auto"`, OpenClaw memeriksa preferensi OS (macOS/Windows)
dan kembali ke pemformatan lokal. Nilai yang terdeteksi **di-cache per proses**
untuk menghindari panggilan sistem berulang.

## Payload alat + konektor (waktu mentah penyedia + bidang ternormalisasi)

Alat kanal mengembalikan **stempel waktu asli penyedia** dan menambahkan bidang ternormalisasi untuk konsistensi:

- `timestampMs`: milidetik epoch (UTC)
- `timestampUtc`: string UTC ISO 8601

Bidang mentah penyedia dipertahankan agar tidak ada yang hilang.

- Slack: string mirip epoch dari API
- Discord: stempel waktu ISO UTC
- Telegram/WhatsApp: stempel waktu numerik/ISO khusus penyedia

Jika Anda memerlukan waktu lokal, konversikan di hilir menggunakan zona waktu yang diketahui.

## Dokumen terkait

- [Prompt Sistem](/id/concepts/system-prompt)
- [Zona Waktu](/id/concepts/timezone)
- [Pesan](/id/concepts/messages)
