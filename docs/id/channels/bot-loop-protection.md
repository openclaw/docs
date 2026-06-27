---
read_when:
    - Mengonfigurasi pesan saluran yang ditulis bot
    - Menyetel perlindungan loop bot-ke-bot
sidebarTitle: Bot loop protection
summary: Perlindungan loop bot-ke-bot default dan penggantian channel
title: Perlindungan loop bot
x-i18n:
    generated_at: "2026-06-27T17:09:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# Perlindungan loop bot

OpenClaw dapat menerima pesan yang ditulis oleh bot lain di channel yang mendukung `allowBots`.
Saat jalur itu diaktifkan, perlindungan loop pasangan mencegah dua identitas bot
saling membalas tanpa batas.

Penjaga ini diterapkan oleh runner balasan masuk inti. Setiap channel yang mendukungnya
memetakan peristiwa masuknya sendiri menjadi fakta generik: akun atau cakupan, id percakapan,
id bot pengirim, dan id bot penerima. Inti kemudian melacak pasangan peserta di kedua
arah, menerapkan anggaran jendela geser, dan menekan pasangan tersebut selama
masa jeda setelah anggaran terlampaui.

## Default

Perlindungan loop pasangan aktif saat sebuah channel mengizinkan pesan yang dibuat bot mencapai
dispatch. Default bawaan adalah:

- `maxEventsPerWindow: 20` - pasangan bot dapat bertukar 20 peristiwa dalam jendela
- `windowSeconds: 60` - panjang jendela geser
- `cooldownSeconds: 60` - waktu penekanan setelah pasangan melampaui anggaran

Penjaga ini tidak memengaruhi pesan normal yang ditulis manusia, deployment bot tunggal,
pemfilteran pesan sendiri, atau balasan bot sekali jalan yang tetap berada di bawah anggaran.

## Konfigurasikan default bersama

Atur `channels.defaults.botLoopProtection` sekali untuk memberi setiap channel yang mendukung
baseline yang sama. Penggantian channel dan akun masih dapat menyetel permukaan individual.

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

Atur `enabled: false` hanya saat kebijakan channel Anda secara sengaja mengizinkan
percakapan bot-ke-bot tanpa penekanan otomatis.

## Ganti per channel atau akun

Channel yang mendukung melapiskan konfigurasinya sendiri di atas default bersama. Prioritasnya adalah:

- `channels.<channel>.<room-or-space>.botLoopProtection`, saat channel mendukung penggantian per percakapan
- `channels.<channel>.accounts.<account>.botLoopProtection`, saat channel mendukung akun
- `channels.<channel>.botLoopProtection`, saat channel mendukung default tingkat atas
- `channels.defaults.botLoopProtection`
- default bawaan

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
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
  },
}
```

## Dukungan channel

- Discord: fakta `author.bot` native, diberi kunci berdasarkan akun Discord, channel, dan pasangan bot.
- Slack: fakta `bot_id` native untuk pesan yang ditulis bot yang diterima, diberi kunci berdasarkan akun Slack, channel, dan pasangan bot.
- Matrix: akun bot Matrix yang dikonfigurasi, diberi kunci berdasarkan akun Matrix, room, dan pasangan bot yang dikonfigurasi.
- Google Chat: fakta `sender.type=BOT` native untuk pesan yang ditulis bot yang diterima, diberi kunci berdasarkan akun, space, dan pasangan bot.

Channel yang tidak mengekspos identitas bot masuk yang andal tetap menggunakan
pemfilteran pesan sendiri dan kebijakan akses normalnya. Channel tersebut sebaiknya tidak ikut memakai
penjaga ini sampai dapat mengidentifikasi kedua peserta dalam pasangan bot.

Lihat [runtime SDK](/id/plugins/sdk-runtime#reusable-runtime-utilities) untuk detail implementasi
Plugin.
