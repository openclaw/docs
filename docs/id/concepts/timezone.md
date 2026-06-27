---
read_when:
    - Anda menginginkan model mental cepat untuk penanganan zona waktu
    - Anda sedang menentukan di mana harus menetapkan atau mengganti zona waktu
summary: Tempat zona waktu muncul di OpenClaw — amplop, payload alat, prompt sistem
title: Zona waktu
x-i18n:
    generated_at: "2026-06-27T17:27:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw menstandarkan stempel waktu agar model melihat **satu waktu referensi** alih-alih campuran jam lokal penyedia. Ada tiga permukaan tempat zona waktu muncul, masing-masing dengan tujuannya sendiri:

## Tiga permukaan zona waktu

| Permukaan        | Yang ditampilkan                                                                                             | Default                                           | Dikonfigurasi melalui                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| Amplop pesan     | Membungkus pesan channel masuk: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                            | Lokal host                                        | `agents.defaults.envelopeTimezone`                         |
| Muatan tool      | Tool bergaya `readMessages` channel mengembalikan waktu penyedia mentah + `timestampMs` / `timestampUtc` ternormalisasi | Field UTC selalu ada                              | Tidak dapat dikonfigurasi — mempertahankan stempel waktu asli penyedia |
| Prompt sistem    | Blok kecil `Current Date & Time` dengan **zona waktu saja** (tanpa nilai jam, untuk stabilitas cache)          | Zona waktu host jika `userTimezone` belum disetel | `agents.defaults.userTimezone`                             |

Prompt sistem sengaja menghilangkan jam langsung agar cache prompt tetap stabil lintas giliran. Saat agen membutuhkan waktu saat ini, agen memanggil `session_status`.

## Menyetel zona waktu pengguna

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Jika `userTimezone` belum disetel, OpenClaw menyelesaikan zona waktu host saat runtime (tanpa menulis konfigurasi). `agents.defaults.timeFormat` (`auto` | `12` | `24`) mengontrol rendering 12 jam/24 jam di amplop dan permukaan downstream, bukan di bagian prompt sistem.

## Kapan harus mengganti

- **Gunakan amplop UTC** (`envelopeTimezone: "utc"`) saat Anda menginginkan stempel waktu stabil lintas host di berbagai wilayah, atau saat Anda ingin log yang selaras dengan UTC cocok dengan output diagnostik.
- **Gunakan zona IANA tetap** (mis. `"Europe/Vienna"`) saat host Gateway berada di satu zona tetapi pengguna berada di zona lain dan Anda ingin amplop terbaca dalam zona pengguna terlepas dari migrasi host.
- **Setel `envelopeTimestamp: "off"`** saat konteks stempel waktu tidak berguna untuk percakapan. Ini menghapus stempel waktu absolut dari amplop, prefiks prompt agen langsung, dan prefiks input model tertanam.

Untuk referensi perilaku lengkap, contoh per penyedia, dan pemformatan waktu berlalu, lihat [Tanggal & Waktu](/id/date-time).

## Terkait

- [Tanggal & Waktu](/id/date-time) — perilaku dan contoh lengkap untuk amplop/tool/prompt.
- [Heartbeat](/id/gateway/heartbeat) — jam aktif menggunakan zona waktu untuk penjadwalan.
- [Pekerjaan Cron](/id/automation/cron-jobs) — ekspresi cron menggunakan zona waktu untuk penjadwalan.
