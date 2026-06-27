---
read_when:
    - Mengonfigurasi ruang grup atau channel yang selalu aktif
    - Anda ingin agen memantau obrolan ruang tanpa memposting teks final secara otomatis
    - Debugging pengetikan dan penggunaan token tanpa pesan ruang yang terlihat
sidebarTitle: Ambient room events
summary: Biarkan ruang grup yang didukung menyediakan konteks secara senyap kecuali agen mengirim melalui alat pesan
title: Kejadian ruang ambient
x-i18n:
    generated_at: "2026-06-27T17:09:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Peristiwa ruang latar memungkinkan OpenClaw memproses obrolan grup atau kanal yang tidak menyebut agen sebagai konteks senyap. Agen dapat memperbarui memori dan status sesi, tetapi ruang tetap diam kecuali agen secara eksplisit memanggil alat `message`.

Untuk obrolan grup yang selalu aktif, ini adalah mode yang direkomendasikan: gabungkan `messages.groupChat.unmentionedInbound: "room_event"` dengan `messages.groupChat.visibleReplies: "message_tool"`. Gunakan ini ketika agen harus mendengarkan, memutuskan kapan balasan berguna, dan menghindari pola prompt lama yang menjawab `NO_REPLY`.

Didukung saat ini: kanal guild Discord, kanal dan kanal privat Slack, DM multi-orang Slack, serta grup atau supergrup Telegram. Kanal grup lain mempertahankan perilaku grup yang sudah ada kecuali halaman kanalnya menyatakan bahwa kanal tersebut mendukung peristiwa ruang latar.

## Penyiapan yang direkomendasikan

Atur perilaku obrolan grup global:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

Lalu konfigurasikan ruang itu sendiri sebagai selalu aktif dengan menonaktifkan gerbang penyebutan untuk ruang tersebut. Kanal masih harus diizinkan oleh `groupPolicy` normalnya, daftar izinkan ruang, dan daftar izinkan pengirim.

Setelah menyimpan konfigurasi, Gateway memuat ulang panas pengaturan `messages`. Mulai ulang hanya ketika pemantauan file atau pemuatan ulang konfigurasi dinonaktifkan.

## Apa yang berubah

Dengan `messages.groupChat.unmentionedInbound: "room_event"`:

- pesan grup atau kanal yang diizinkan dan tidak menyebut agen menjadi peristiwa ruang senyap
- pesan yang menyebut agen tetap menjadi permintaan pengguna
- perintah teks dan perintah bawaan tetap menjadi permintaan pengguna
- permintaan batal atau berhenti tetap menjadi permintaan pengguna
- pesan langsung tetap menjadi permintaan pengguna

Peristiwa ruang menggunakan pengiriman terlihat yang ketat. Teks asisten akhir bersifat privat. Agen harus memanggil `message(action=send)` untuk memposting di ruang.

## Contoh Discord

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

Gunakan konfigurasi Discord per kanal ketika hanya satu kanal yang harus bersifat latar:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Contoh Slack

Daftar izinkan kanal Slack mengutamakan ID. Gunakan ID kanal seperti `C12345678`, bukan `#channel-name`.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Contoh Telegram

Untuk grup Telegram, bot harus dapat melihat pesan grup normal. Jika `requireMention: false`, nonaktifkan mode privasi BotFather atau gunakan penyiapan Telegram lain yang mengirimkan seluruh lalu lintas grup ke bot.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

ID grup Telegram biasanya berupa angka negatif seperti `-1001234567890`. Baca `chat.id` dari `openclaw logs --follow`, teruskan pesan grup ke bot pembantu ID, atau periksa Bot API `getUpdates`.

## Kebijakan khusus agen

Gunakan penggantian agen ketika beberapa agen berbagi ruang yang sama tetapi hanya satu yang harus memperlakukan obrolan tanpa penyebutan sebagai konteks latar:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

Nilai `agents.list[].groupChat.unmentionedInbound` khusus agen menggantikan `messages.groupChat.unmentionedInbound` untuk agen tersebut.

## Mode balasan terlihat

`messages.groupChat.visibleReplies` secara default bernilai `"automatic"` untuk permintaan pengguna grup/kanal normal. Pertahankan default itu ketika Anda ingin teks asisten akhir diposting secara terlihat tanpa memerlukan pemanggilan alat pesan secara eksplisit.

Untuk ruang latar yang selalu aktif, `messages.groupChat.visibleReplies: "message_tool"` tetap direkomendasikan, terutama dengan model generasi terbaru yang andal menggunakan alat seperti GPT 5.5. Ini memungkinkan agen memutuskan kapan harus berbicara dengan memanggil alat pesan. Jika model mengembalikan teks akhir tanpa memanggil alat, OpenClaw menjaga teks akhir itu tetap privat dan mencatat metadata pengiriman yang ditekan.

Peristiwa ruang tetap ketat meskipun permintaan grup lain menggunakan balasan otomatis. Peristiwa ruang latar yang tidak menyebut agen tetap memerlukan `message(action=send)` untuk keluaran terlihat.

## Riwayat

`messages.groupChat.historyLimit` mengontrol default riwayat grup global. Kanal dapat menggantinya dengan `channels.<channel>.historyLimit`, dan beberapa kanal juga mendukung batas riwayat per akun.

Atur `historyLimit: 0` untuk menonaktifkan konteks riwayat grup.

Kanal peristiwa ruang yang didukung menyimpan pesan ruang latar terbaru sebagai konteks. Discord menyimpan riwayat peristiwa ruang hingga pengiriman Discord yang terlihat berhasil, sehingga konteks senyap tidak hilang sebelum pengiriman alat pesan.

## Pemecahan masalah

Jika ruang menampilkan pengetikan atau penggunaan token tetapi tidak ada pesan terlihat:

1. Pastikan ruang diizinkan oleh daftar izinkan kanal dan daftar izinkan pengirim.
2. Pastikan `requireMention: false` diatur pada tingkat ruang yang Anda harapkan.
3. Periksa apakah `messages.groupChat.unmentionedInbound` atau penggantian agen bernilai `"room_event"`.
4. Periksa log untuk metadata payload akhir yang ditekan atau `didSendViaMessagingTool: false`.
5. Untuk permintaan grup normal, pertahankan atau pulihkan `messages.groupChat.visibleReplies: "automatic"` jika Anda ingin balasan akhir diposting secara otomatis. Untuk ruang latar yang menggunakan `message_tool`, gunakan model/runtime yang andal memanggil alat.

Jika ruang latar Telegram sama sekali tidak terpicu, periksa mode privasi BotFather dan verifikasi bahwa Gateway menerima pesan grup normal.

Jika ruang latar Slack tidak terpicu, verifikasi bahwa kunci kanal adalah ID kanal Slack dan aplikasi memiliki cakupan `channels:history` atau `groups:history` yang diperlukan untuk tipe ruang tersebut.

## Terkait

- [Grup](/id/channels/groups)
- [Discord](/id/channels/discord)
- [Slack](/id/channels/slack)
- [Telegram](/id/channels/telegram)
- [Pemecahan masalah kanal](/id/channels/troubleshooting)
- [Referensi konfigurasi kanal](/id/gateway/config-channels)
