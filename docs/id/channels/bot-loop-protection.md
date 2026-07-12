---
read_when:
    - Mengonfigurasi pesan saluran yang dibuat oleh bot
    - Menyesuaikan perlindungan perulangan antarbot
sidebarTitle: Bot loop protection
summary: Default perlindungan perulangan antarbot dan penggantian khusus kanal
title: Perlindungan perulangan bot
x-i18n:
    generated_at: "2026-07-12T13:55:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw dapat menerima pesan yang ditulis oleh bot lain di kanal yang mendukung `allowBots`. Saat jalur tersebut diaktifkan, perlindungan perulangan pasangan mencegah dua identitas bot saling membalas tanpa henti.

Pengaman ini diberlakukan oleh pemroses balasan masuk inti. Setiap kanal yang mendukung memetakan peristiwa masuknya menjadi fakta generik: akun atau cakupan, id percakapan, id bot pengirim, dan id bot penerima. Inti melacak pasangan peserta dalam kedua arah (A ke B dan B ke A dihitung sebagai pasangan yang sama), menerapkan batas dalam jendela bergulir, dan menangguhkan pasangan tersebut selama masa jeda setelah batas terlampaui.

## Nilai bawaan

Perlindungan perulangan pasangan aktif setiap kali kanal mengizinkan pesan yang dibuat bot mencapai pengiriman. Nilai bawaan internal:

| Kunci                | Nilai bawaan | Arti                                                   |
| -------------------- | ------------ | ------------------------------------------------------ |
| `enabled`            | `true`       | Pengaman aktif untuk kanal yang mendukungnya.           |
| `maxEventsPerWindow` | `20`         | Peristiwa yang dapat dipertukarkan pasangan bot dalam jendela. |
| `windowSeconds`      | `60`         | Durasi jendela bergulir.                               |
| `cooldownSeconds`    | `60`         | Waktu penangguhan setelah pasangan melampaui batas.     |

Pengaman ini tidak memengaruhi pesan yang dibuat manusia, penerapan dengan satu bot, pemfilteran pesan sendiri, atau balasan bot yang tetap berada di bawah batas.

## Mengonfigurasi nilai bawaan bersama

Tetapkan `channels.defaults.botLoopProtection` sekali untuk memberikan dasar yang sama kepada setiap kanal yang mendukung. Penggantian pada tingkat kanal, akun, dan ruang tetap dapat menyesuaikan masing-masing permukaan.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

Tetapkan `enabled: false` hanya jika kebijakan kanal Anda secara sengaja mengizinkan percakapan antarbobot tanpa penangguhan otomatis.

## Mengganti per kanal, akun, atau ruang

Kanal yang mendukung menumpuk konfigurasinya sendiri di atas nilai bawaan bersama, kunci demi kunci. Urutan prioritas, dari yang paling spesifik:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, jika kanal mendukung penggantian per percakapan
2. `channels.<channel>.accounts.<account>.botLoopProtection`, jika kanal mendukung akun
3. `channels.<channel>.botLoopProtection`, jika kanal mendukung nilai bawaan tingkat atas
4. `channels.defaults.botLoopProtection`
5. nilai bawaan internal

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## Dukungan kanal

- Discord: fakta asli `author.bot`, dikunci berdasarkan akun Discord, kanal, dan pasangan bot.
- Google Chat: fakta asli `sender.type=BOT` untuk pesan yang dibuat bot dan diterima, dikunci berdasarkan akun, ruang, dan pasangan bot.
- Matrix: akun bot Matrix yang dikonfigurasi, dikunci berdasarkan akun Matrix, ruang, dan pasangan bot yang dikonfigurasi.
- Slack: fakta asli `bot_id` untuk pesan yang dibuat bot dan diterima, dikunci berdasarkan akun Slack, kanal, dan pasangan bot.

Kanal yang tidak menyediakan identitas bot masuk yang dapat diandalkan tetap menggunakan filter pesan sendiri dan kebijakan akses seperti biasa. Kanal tersebut tidak boleh mengaktifkan pengaman ini hingga dapat mengidentifikasi kedua peserta dalam pasangan bot.

Lihat [runtime SDK](/id/plugins/sdk-runtime#reusable-runtime-utilities) untuk detail implementasi plugin.
