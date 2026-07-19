---
read_when:
    - Mengonfigurasi pesan saluran yang dibuat oleh bot
    - Menyesuaikan perlindungan perulangan antarbot
sidebarTitle: Bot loop protection
summary: Default perlindungan loop antarbot dan penggantian khusus saluran
title: Perlindungan terhadap loop bot
x-i18n:
    generated_at: "2026-07-19T04:54:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d59d3b48dd5506e774282b880334df8970b05c4d001261ff7107e8e1678894db
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw dapat menerima pesan yang ditulis oleh bot lain pada kanal yang mendukung `allowBots`. Saat jalur tersebut diaktifkan, perlindungan loop pasangan mencegah dua identitas bot saling membalas tanpa batas.

Pengaman diterapkan oleh runner balasan masuk inti. Setiap kanal yang mendukung memetakan peristiwa masuknya menjadi fakta generik: akun atau cakupan, id percakapan, id bot pengirim, dan id bot penerima. Inti melacak pasangan peserta dalam kedua arah (A ke B dan B ke A dihitung sebagai pasangan yang sama), menerapkan batas anggaran jendela bergeser, dan menekan pasangan tersebut selama periode jeda setelah anggaran terlampaui.

## Nilai default

Perlindungan loop pasangan aktif setiap kali sebuah kanal mengizinkan pesan yang ditulis bot mencapai dispatch. Nilai default bawaan:

| Kunci                | Default | Arti                                                |
| -------------------- | ------- | --------------------------------------------------- |
| `enabled`            | `true`  | Pengaman aktif untuk kanal yang mendukungnya.       |
| `maxEventsPerWindow` | `20`    | Peristiwa yang dapat dipertukarkan pasangan bot dalam jendela. |
| `windowSeconds`      | `60`    | Durasi jendela bergeser.                            |
| `cooldownSeconds`    | `60`    | Waktu penekanan setelah pasangan melampaui anggaran. |

Pengaman tidak memengaruhi pesan yang ditulis manusia, deployment bot tunggal, pemfilteran pesan sendiri, atau balasan bot yang tetap di bawah anggaran.

## Mengonfigurasi nilai default bersama

Tetapkan `channels.defaults.botLoopProtection` sekali agar setiap kanal yang mendukung memiliki acuan dasar yang sama. Kanal juga dapat menyediakan penggantian yang lebih spesifik; Feishu sengaja hanya menggunakan acuan dasar bersama ini.

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

Tetapkan `enabled: false` hanya jika kebijakan kanal Anda secara sengaja mengizinkan percakapan antarbots tanpa penekanan otomatis.

## Mengganti per kanal, akun, atau ruang

Kanal yang mendukung melapiskan konfigurasinya sendiri di atas nilai default bersama, kunci demi kunci. Urutan prioritas, dari yang paling spesifik:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, jika kanal mendukung penggantian per percakapan
2. `channels.<channel>.accounts.<account>.botLoopProtection`, jika kanal mendukung akun
3. `channels.<channel>.botLoopProtection`, jika kanal mendukung nilai default tingkat atas
4. `channels.defaults.botLoopProtection`
5. nilai default bawaan

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
          allowBots: true,
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

- Discord: fakta `author.bot` native, dikunci berdasarkan akun Discord, kanal, dan pasangan bot.
- Feishu: fakta `sender_type=bot` native untuk pesan grup yang ditulis bot dan diterima, dikunci berdasarkan akun Feishu, obrolan, dan pasangan bot. Feishu hanya menggunakan `channels.defaults.botLoopProtection`.
- Google Chat: fakta `sender.type=BOT` native untuk pesan yang ditulis bot dan diterima, dikunci berdasarkan akun, ruang, dan pasangan bot.
- Matrix: akun bot Matrix yang dikonfigurasi, dikunci berdasarkan akun Matrix, ruang, dan pasangan bot yang dikonfigurasi.
- Slack: fakta `bot_id` native untuk pesan yang ditulis bot dan diterima, dikunci berdasarkan akun Slack, kanal, dan pasangan bot.

Kanal yang tidak menyediakan identitas bot masuk yang andal tetap menggunakan filter pesan sendiri dan kebijakan akses normalnya. Kanal tersebut tidak boleh mengaktifkan pengaman ini hingga dapat mengidentifikasi kedua peserta dalam pasangan bot.

Lihat [runtime SDK](/id/plugins/sdk-runtime#reusable-runtime-utilities) untuk detail implementasi plugin.
