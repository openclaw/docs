---
read_when:
    - Anda perlu memahami bagaimana stempel waktu dinormalisasi untuk model
    - Mengonfigurasi zona waktu pengguna untuk prompt sistem
summary: Penanganan zona waktu untuk agen, envelope, dan prompt
title: Zona Waktu
x-i18n:
    generated_at: "2026-04-05T13:52:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31a195fa43e3fc17b788d8e70d74ef55da998fc7997c4f0538d4331b1260baac
    source_path: concepts/timezone.md
    workflow: 15
---

# Zona Waktu

OpenClaw menstandarkan stempel waktu agar model melihat **satu waktu referensi**.

## Envelope pesan (lokal secara default)

Pesan masuk dibungkus dalam envelope seperti:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Stempel waktu dalam envelope **secara default adalah waktu lokal host**, dengan presisi menit.

Anda dapat menimpanya dengan:

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
- `envelopeTimezone: "user"` menggunakan `agents.defaults.userTimezone` (kembali ke zona waktu host).
- Gunakan zona waktu IANA eksplisit (misalnya `"Europe/Vienna"`) untuk offset tetap.
- `envelopeTimestamp: "off"` menghapus stempel waktu absolut dari header envelope.
- `envelopeElapsed: "off"` menghapus sufiks waktu berlalu (gaya `+2m`).

### Contoh

**Lokal (default):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Zona waktu tetap:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Waktu berlalu:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Payload tool (data provider mentah + field yang dinormalisasi)

Pemanggilan tool (`channels.discord.readMessages`, `channels.slack.readMessages`, dll.) mengembalikan **stempel waktu provider mentah**.
Kami juga melampirkan field yang dinormalisasi untuk konsistensi:

- `timestampMs` (milidetik epoch UTC)
- `timestampUtc` (string UTC ISO 8601)

Field provider mentah dipertahankan.

## Zona waktu pengguna untuk prompt sistem

Setel `agents.defaults.userTimezone` untuk memberi tahu model zona waktu lokal pengguna. Jika tidak
disetel, OpenClaw meresolusikan **zona waktu host saat runtime** (tanpa menulis config).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Prompt sistem mencakup:

- bagian `Current Date & Time` dengan waktu lokal dan zona waktu
- `Time format: 12-hour` atau `24-hour`

Anda dapat mengontrol format prompt dengan `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Lihat [Tanggal & Waktu](/date-time) untuk perilaku lengkap dan contoh.

## Terkait

- [Heartbeat](/gateway/heartbeat) — jam aktif menggunakan zona waktu untuk penjadwalan
- [Tugas Cron](/id/automation/cron-jobs) — ekspresi cron menggunakan zona waktu untuk penjadwalan
- [Tanggal & Waktu](/date-time) — perilaku tanggal/waktu lengkap dan contoh
