---
read_when:
    - Anda mengubah cara stempel waktu ditampilkan kepada model atau pengguna
    - Anda sedang men-debug pemformatan waktu dalam pesan atau keluaran prompt sistem
summary: Penanganan tanggal dan waktu di seluruh envelope, prompt, alat, dan konektor
title: Tanggal dan waktu
x-i18n:
    generated_at: "2026-07-12T14:07:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw menggunakan **waktu lokal host untuk stempel waktu transportasi** dan hanya mencantumkan **zona waktu** dalam prompt sistem.
Stempel waktu penyedia dipertahankan agar alat tetap mempertahankan semantik aslinya. Saat agen memerlukan waktu
saat ini, agen menjalankan alat `session_status`.

## Amplop pesan (lokal secara default)

Pesan masuk dibungkus dengan hari dalam seminggu serta stempel waktu berpresisi detik:

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] teks pesan
```

Stempel waktu amplop menggunakan **waktu lokal host secara default**, terlepas dari zona waktu penyedia.
Timpa pengaturan di bawah `agents.defaults`:

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

| Kunci               | Nilai                                                | Perilaku                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local` (default), `utc`, `user`, nama IANA eksplisit | `user` menggunakan `agents.defaults.userTimezone` (zona waktu host jika tidak ditetapkan). Nama IANA eksplisit (misalnya `"America/Chicago"`) menetapkan zona tetap; nama yang tidak dikenali kembali ke UTC. |
| `envelopeTimestamp` | `on` (default), `off`                                | `off` menghapus stempel waktu absolut dari header amplop, prefiks prompt agen langsung, dan prefiks masukan model yang disematkan.                                                                         |
| `envelopeElapsed`   | `on` (default), `off`                                | `off` menghapus sufiks waktu berlalu (dengan gaya `+30s` / `+2m`) yang ditampilkan sejak pesan sebelumnya dalam sesi.                                                                                      |

### Contoh

**Lokal (default):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] halo
```

**Zona waktu pengguna:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] halo
```

**Waktu berlalu dengan `envelopeTimezone: "utc"`:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] tindak lanjut
```

## Prompt sistem: tanggal dan waktu saat ini

Prompt sistem menyertakan bagian **Tanggal & Waktu Saat Ini** yang hanya berisi **zona waktu**
(tanpa jam atau format waktu) agar penyimpanan cache prompt tetap stabil:

```
Zona waktu: America/Chicago
```

Zona tersebut adalah `agents.defaults.userTimezone` jika dikonfigurasi; jika tidak, zona waktu host yang digunakan.
Prompt juga menginstruksikan agen untuk menjalankan alat `session_status` setiap kali memerlukan
tanggal, waktu, atau hari dalam seminggu saat ini.

## Baris peristiwa sistem (lokal secara default)

Peristiwa sistem dalam antrean yang disisipkan ke konteks agen diawali dengan stempel waktu menggunakan
pilihan `envelopeTimezone` yang sama seperti amplop pesan (default: waktu lokal host).

```
Sistem: [2026-01-12 12:19:17 PST] Model dialihkan.
```

### Mengonfigurasi zona waktu pengguna + format

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

- `userTimezone` menetapkan **zona waktu lokal pengguna** untuk konteks prompt (dan untuk `envelopeTimezone: "user"`).
- `timeFormat` mengontrol **tampilan 12 jam/24 jam** untuk waktu yang ditampilkan dalam prompt. `auto` mengikuti preferensi OS.

## Deteksi format waktu (otomatis)

Saat `timeFormat: "auto"`, OpenClaw memeriksa preferensi OS (macOS dan Windows)
dan kembali menggunakan pemformatan lokal. Nilai yang terdeteksi **disimpan dalam cache per proses**
untuk menghindari pemanggilan sistem berulang.

## Payload alat + konektor (waktu mentah penyedia + bidang yang dinormalisasi)

Alat saluran mengembalikan **stempel waktu asli penyedia** dan menambahkan bidang yang dinormalisasi demi konsistensi:

- `timestampMs`: milidetik epoch (UTC)
- `timestampUtc`: string UTC ISO 8601

Bidang mentah penyedia dipertahankan agar tidak ada yang hilang.

- Discord: stempel waktu ISO UTC
- Slack: string serupa epoch dari API
- Telegram/WhatsApp: stempel waktu numerik/ISO khusus penyedia

Jika memerlukan waktu lokal, konversikan di tahap berikutnya menggunakan zona waktu yang diketahui.

## Dokumentasi terkait

- [Prompt Sistem](/id/concepts/system-prompt)
- [Zona Waktu](/id/concepts/timezone)
- [Pesan](/id/concepts/messages)
