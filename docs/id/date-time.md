---
read_when:
    - Anda mengubah cara stempel waktu ditampilkan kepada model atau pengguna
    - Anda sedang men-debug pemformatan waktu dalam pesan atau output prompt sistem
summary: Penanganan tanggal dan waktu di seluruh envelope, prompt, alat, dan konektor
title: Tanggal dan waktu
x-i18n:
    generated_at: "2026-06-27T17:27:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw secara default menggunakan **waktu lokal host untuk stempel waktu transport** dan **zona waktu pengguna hanya di prompt sistem**.
Stempel waktu penyedia dipertahankan agar alat tetap memakai semantik native-nya (waktu saat ini tersedia melalui `session_status`).

## Envelope pesan (lokal secara default)

Pesan masuk dibungkus dengan stempel waktu (presisi detik):

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

Stempel waktu envelope ini **secara default bersifat lokal host**, terlepas dari zona waktu penyedia.

Anda dapat menimpa perilaku ini:

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
- `envelopeTimezone: "user"` menggunakan `agents.defaults.userTimezone` (fallback ke zona waktu host).
- Gunakan zona waktu IANA eksplisit (misalnya, `"America/Chicago"`) untuk zona tetap.
- `envelopeTimestamp: "off"` menghapus stempel waktu absolut dari header envelope, prefiks prompt agen langsung, dan prefiks input model yang disematkan.
- `envelopeElapsed: "off"` menghapus sufiks waktu berlalu (gaya `+2m`).

### Contoh

**Lokal (default):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Zona waktu pengguna:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Waktu berlalu diaktifkan:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Prompt sistem: tanggal dan waktu saat ini

Jika zona waktu pengguna diketahui, prompt sistem menyertakan bagian khusus
**Tanggal & Waktu Saat Ini** dengan **zona waktu saja** (tanpa format jam/waktu)
untuk menjaga caching prompt tetap stabil:

```
Time zone: America/Chicago
```

Saat agen membutuhkan waktu saat ini, gunakan alat `session_status`; kartu status
menyertakan baris stempel waktu.

## Baris peristiwa sistem (lokal secara default)

Peristiwa sistem yang diantrekan dan disisipkan ke konteks agen diberi prefiks stempel waktu menggunakan
pilihan zona waktu yang sama seperti envelope pesan (default: lokal host).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Konfigurasi zona waktu pengguna + format

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

- `userTimezone` mengatur **zona waktu lokal pengguna** untuk konteks prompt.
- `timeFormat` mengontrol **tampilan 12j/24j** dalam prompt. `auto` mengikuti preferensi OS.

## Deteksi format waktu (auto)

Saat `timeFormat: "auto"`, OpenClaw memeriksa preferensi OS (macOS/Windows)
dan fallback ke pemformatan locale. Nilai yang terdeteksi **di-cache per proses**
untuk menghindari panggilan sistem berulang.

## Payload alat + connector (waktu penyedia mentah + kolom ternormalisasi)

Alat channel mengembalikan **stempel waktu native penyedia** dan menambahkan kolom ternormalisasi untuk konsistensi:

- `timestampMs`: milidetik epoch (UTC)
- `timestampUtc`: string ISO 8601 UTC

Kolom penyedia mentah dipertahankan agar tidak ada yang hilang.

- Slack: string mirip epoch dari API
- Discord: stempel waktu ISO UTC
- Telegram/WhatsApp: stempel waktu numerik/ISO khusus penyedia

Jika Anda membutuhkan waktu lokal, konversikan di hilir menggunakan zona waktu yang diketahui.

## Dokumen terkait

- [Prompt Sistem](/id/concepts/system-prompt)
- [Zona Waktu](/id/concepts/timezone)
- [Pesan](/id/concepts/messages)
