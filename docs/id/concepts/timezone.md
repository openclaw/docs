---
read_when:
    - Anda menginginkan gambaran singkat untuk memahami penanganan zona waktu
    - Anda sedang menentukan tempat untuk menetapkan atau mengganti zona waktu
summary: Tempat zona waktu muncul di OpenClaw — amplop pesan, payload alat, prompt sistem
title: Zona waktu
x-i18n:
    generated_at: "2026-07-12T14:10:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw menstandarkan stempel waktu agar model melihat **satu waktu acuan** alih-alih campuran waktu lokal penyedia. Tiga permukaan menampilkan zona waktu, masing-masing dengan tujuannya sendiri:

## Tiga permukaan zona waktu

| Permukaan         | Yang ditampilkan                                                                                                  | Bawaan                                        | Dikonfigurasi melalui                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| Amplop pesan      | Membungkus pesan kanal masuk: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                  | Lokal host                                    | `agents.defaults.envelopeTimezone`                     |
| Muatan alat       | Alat bergaya `readMessages` kanal mengembalikan waktu mentah penyedia serta `timestampMs` / `timestampUtc` yang dinormalisasi | Kolom UTC selalu tersedia                     | Tidak dapat dikonfigurasi; mempertahankan stempel waktu asli penyedia |
| Prompt sistem     | Blok kecil `Tanggal & Waktu Saat Ini` yang hanya memuat **zona waktu** (tanpa nilai jam, demi stabilitas cache)   | Zona waktu host jika `userTimezone` tidak disetel | `agents.defaults.userTimezone`                      |

Prompt sistem sengaja tidak menyertakan waktu saat ini agar cache prompt tetap stabil antarputaran. Ketika agen memerlukan waktu saat ini, agen memanggil `session_status`.

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

Jika `userTimezone` tidak disetel, OpenClaw menentukan zona waktu host saat runtime melalui `Intl.DateTimeFormat().resolvedOptions().timeZone` (tanpa menulis konfigurasi). `agents.defaults.timeFormat` (`auto` | `12` | `24`) mengontrol penyajian format 12 jam/24 jam dalam amplop dan permukaan hilir, bukan dalam bagian prompt sistem.

## Nilai zona waktu amplop

`agents.defaults.envelopeTimezone` menerima:

- `"local"` (bawaan) atau `"host"` - zona waktu mesin host.
- `"utc"` atau `"gmt"` - UTC.
- `"user"` - `agents.defaults.userTimezone` yang telah ditentukan (kembali menggunakan zona waktu host jika tidak disetel).
- String zona IANA eksplisit apa pun, misalnya `"Europe/Vienna"`.

## Kapan perlu mengganti

- **Gunakan `"utc"`** untuk stempel waktu yang konsisten pada host di wilayah berbeda, atau agar sesuai dengan keluaran diagnostik/log yang diselaraskan dengan UTC.
- **Gunakan `"user"`** agar amplop tetap selaras dengan zona waktu pengguna yang dikonfigurasi, terlepas dari zona tempat host Gateway berjalan.
- **Gunakan zona IANA tetap** ketika host Gateway berada di satu zona, tetapi amplop harus selalu dibaca dalam zona lain terlepas dari migrasi host.
- **Setel `envelopeTimestamp: "off"`** ketika konteks stempel waktu tidak berguna bagi percakapan. Ini menghapus stempel waktu absolut dari amplop, prefiks prompt agen langsung, dan prefiks masukan model yang disematkan.

Untuk referensi perilaku lengkap, contoh per penyedia, dan pemformatan waktu berlalu, lihat [Tanggal & Waktu](/id/date-time).

## Terkait

- [Tanggal & Waktu](/id/date-time) - perilaku lengkap amplop/alat/prompt beserta contohnya.
- [Heartbeat](/id/gateway/heartbeat) - jam aktif menggunakan zona waktu untuk penjadwalan.
- [Pekerjaan Cron](/id/automation/cron-jobs) - ekspresi cron menggunakan zona waktu untuk penjadwalan.
