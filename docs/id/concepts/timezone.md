---
read_when:
    - Anda menginginkan model mental singkat untuk penanganan zona waktu
    - Anda sedang menentukan di mana harus menetapkan atau menimpa zona waktu
summary: Di mana zona waktu muncul di OpenClaw — amplop, muatan alat, prompt sistem
title: Zona waktu
x-i18n:
    generated_at: "2026-05-06T09:09:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 041b207a0fa2758a20e8f3c4eca852d3dd416560d045459cb4d86709b45449e3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw menstandarkan stempel waktu sehingga model melihat **satu waktu referensi** alih-alih campuran jam lokal penyedia. Ada tiga permukaan tempat zona waktu muncul, masing-masing dengan tujuannya sendiri:

## Tiga permukaan zona waktu

| Permukaan         | Yang ditampilkan                                                                                         | Bawaan                                      | Dikonfigurasi melalui                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| Amplop pesan      | Membungkus pesan kanal masuk: `[Signal +1555 2026-01-18 00:19 PST] hello`                                 | Lokal host                                  | `agents.defaults.envelopeTimezone`                     |
| Payload alat      | Alat bergaya `readMessages` kanal mengembalikan waktu mentah penyedia + `timestampMs` / `timestampUtc` ternormalisasi | Kolom UTC selalu ada                        | Tidak dapat dikonfigurasi — mempertahankan stempel waktu native penyedia |
| Prompt sistem     | Blok kecil `Current Date & Time` dengan **zona waktu saja** (tanpa nilai jam, untuk stabilitas cache)      | Zona waktu host jika `userTimezone` belum diatur | `agents.defaults.userTimezone`                         |

Prompt sistem sengaja menghilangkan jam langsung agar caching prompt tetap stabil antar giliran. Saat agent membutuhkan waktu saat ini, agent memanggil `session_status`.

## Mengatur zona waktu pengguna

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Jika `userTimezone` belum diatur, OpenClaw menyelesaikan zona waktu host saat runtime (tanpa menulis konfigurasi). `agents.defaults.timeFormat` (`auto` | `12` | `24`) mengontrol rendering 12 jam/24 jam di amplop dan permukaan downstream, bukan di bagian prompt sistem.

## Kapan menimpa

- **Gunakan amplop UTC** (`envelopeTimezone: "utc"`) saat Anda menginginkan stempel waktu yang stabil di berbagai host di wilayah berbeda, atau saat Anda ingin log yang selaras UTC cocok dengan output diagnostik.
- **Gunakan zona IANA tetap** (mis. `"Europe/Vienna"`) saat host Gateway berada di satu zona tetapi pengguna berada di zona lain dan Anda ingin amplop terbaca dalam zona pengguna terlepas dari migrasi host.
- **Atur `envelopeTimestamp: "off"`** untuk amplop rendah token saat konteks stempel waktu tidak berguna untuk percakapan.

Untuk referensi perilaku lengkap, contoh per penyedia, dan format waktu berlalu, lihat [Tanggal & Waktu](/id/date-time).

## Terkait

- [Tanggal & Waktu](/id/date-time) — perilaku dan contoh lengkap untuk amplop/alat/prompt.
- [Heartbeat](/id/gateway/heartbeat) — jam aktif menggunakan zona waktu untuk penjadwalan.
- [Pekerjaan Cron](/id/automation/cron-jobs) — ekspresi cron menggunakan zona waktu untuk penjadwalan.
