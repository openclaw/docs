---
read_when:
    - Anda perlu memahami bagaimana stempel waktu dinormalisasi untuk model
    - Mengonfigurasi zona waktu pengguna untuk system prompt
summary: Penanganan zona waktu untuk agen, envelope, dan prompt
title: Zona waktu
x-i18n:
    generated_at: "2026-04-24T09:06:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

OpenClaw menstandarkan stempel waktu sehingga model melihat **satu waktu referensi**.

## Envelope pesan (lokal secara default)

Pesan masuk dibungkus dalam envelope seperti:

```
[Provider ... 2026-01-05 16:26 PST] teks pesan
```

Stempel waktu dalam envelope adalah **lokal host secara default**, dengan presisi menit.

Anda dapat meng-override ini dengan:

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
- `envelopeTimezone: "user"` menggunakan `agents.defaults.userTimezone` (fallback ke zona waktu host).
- Gunakan zona waktu IANA eksplisit (misalnya, `"Europe/Vienna"`) untuk offset tetap.
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

## Payload alat (data provider mentah + field ternormalisasi)

Pemanggilan alat (`channels.discord.readMessages`, `channels.slack.readMessages`, dll.) mengembalikan **stempel waktu provider mentah**.
Kami juga melampirkan field ternormalisasi untuk konsistensi:

- `timestampMs` (milidetik epoch UTC)
- `timestampUtc` (string UTC ISO 8601)

Field provider mentah dipertahankan.

## Zona waktu pengguna untuk system prompt

Setel `agents.defaults.userTimezone` untuk memberi tahu model zona waktu lokal pengguna. Jika
tidak disetel, OpenClaw menyelesaikan **zona waktu host saat runtime** (tanpa penulisan config).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

System prompt mencakup:

- bagian `Current Date & Time` dengan waktu lokal dan zona waktu
- `Time format: 12-hour` atau `24-hour`

Anda dapat mengontrol format prompt dengan `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Lihat [Date & Time](/id/date-time) untuk perilaku dan contoh lengkap.

## Terkait

- [Heartbeat](/id/gateway/heartbeat) — active hours menggunakan zona waktu untuk penjadwalan
- [Cron Jobs](/id/automation/cron-jobs) — ekspresi cron menggunakan zona waktu untuk penjadwalan
- [Date & Time](/id/date-time) — perilaku tanggal/waktu lengkap dan contohnya
