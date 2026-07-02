---
read_when:
    - Mengonfigurasi ruang grup atau kanal yang selalu aktif
    - Anda ingin agen memantau obrolan ruang tanpa memposting teks akhir secara otomatis
    - Men-debug indikator mengetik dan penggunaan token tanpa pesan ruang yang terlihat
sidebarTitle: Ambient room events
summary: Izinkan ruang grup yang didukung menyediakan konteks senyap kecuali agen mengirim dengan alat pesan
title: Peristiwa ruang sekitar
x-i18n:
    generated_at: "2026-07-02T17:46:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Peristiwa ruang ambien memungkinkan OpenClaw memproses obrolan grup atau kanal yang tidak menyebut agen sebagai konteks senyap. Agen dapat memperbarui memori dan status sesi, tetapi ruang tetap diam kecuali agen secara eksplisit memanggil tool `message`.

Untuk chat grup yang selalu aktif, ini adalah mode yang direkomendasikan: gabungkan `messages.groupChat.unmentionedInbound: "room_event"` dengan `messages.groupChat.visibleReplies: "message_tool"`. Gunakan saat agen harus mendengarkan, memutuskan kapan balasan berguna, dan menghindari pola prompt lama yang menjawab `NO_REPLY`.

Didukung saat ini: kanal guild Discord, kanal Slack dan kanal privat, DM multipengguna Slack, serta grup atau supergrup Telegram. Kanal grup lain mempertahankan perilaku grup yang sudah ada kecuali halaman kanalnya menyatakan bahwa kanal tersebut mendukung peristiwa ruang ambien.

## Penyiapan yang Direkomendasikan

Tetapkan perilaku chat grup global:

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

Lalu konfigurasikan ruang itu sendiri sebagai selalu aktif dengan menonaktifkan gerbang mention untuk ruang tersebut. Kanal tetap harus diizinkan oleh `groupPolicy` normalnya, daftar izin ruang, dan daftar izin pengirim.

Setelah menyimpan config, Gateway memuat ulang pengaturan `messages` secara panas. Mulai ulang hanya ketika pemantauan file atau pemuatan ulang config dinonaktifkan.

## Yang Berubah

Dengan `messages.groupChat.unmentionedInbound: "room_event"`:

- pesan grup atau kanal yang diizinkan tanpa mention menjadi peristiwa ruang senyap
- pesan dengan mention tetap menjadi permintaan pengguna
- perintah teks dan perintah native tetap menjadi permintaan pengguna
- permintaan abort atau stop tetap menjadi permintaan pengguna
- pesan langsung tetap menjadi permintaan pengguna

Peristiwa ruang menggunakan pengiriman terlihat yang ketat. Teks akhir asisten bersifat privat. Agen harus memanggil `message(action=send)` untuk memposting di ruang.

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

Gunakan config Discord per kanal ketika hanya satu kanal yang harus bersifat ambien:

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

Daftar izin kanal Slack mengutamakan ID. Gunakan ID kanal seperti `C12345678`, bukan `#channel-name`.

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

## Kebijakan Khusus Agen

Gunakan override agen ketika beberapa agen berbagi ruang yang sama tetapi hanya satu yang harus memperlakukan obrolan tanpa mention sebagai konteks ambien:

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

Nilai `agents.list[].groupChat.unmentionedInbound` khusus agen mengesampingkan `messages.groupChat.unmentionedInbound` untuk agen tersebut.

## Mode Balasan Terlihat

`messages.groupChat.visibleReplies` default ke `"automatic"` untuk permintaan pengguna grup/kanal normal. Pertahankan default itu ketika Anda ingin teks akhir asisten diposting secara terlihat tanpa memerlukan pemanggilan message-tool eksplisit.

Untuk ruang ambien yang selalu aktif, `messages.groupChat.visibleReplies: "message_tool"` tetap direkomendasikan, terutama dengan model generasi terbaru yang andal menggunakan tool seperti GPT 5.5. Ini memungkinkan agen memutuskan kapan berbicara dengan memanggil tool pesan. Jika model mengembalikan teks akhir tanpa memanggil tool, OpenClaw mempertahankan teks akhir itu sebagai privat dan mencatat metadata pengiriman yang ditekan.

Peristiwa ruang tetap ketat bahkan ketika permintaan grup lain menggunakan balasan otomatis. Peristiwa ruang ambien tanpa mention tetap memerlukan `message(action=send)` untuk keluaran terlihat.

## Riwayat

`messages.groupChat.historyLimit` mengontrol default riwayat grup global. Kanal dapat mengesampingkannya dengan `channels.<channel>.historyLimit`, dan beberapa kanal juga mendukung batas riwayat per akun.

Tetapkan `historyLimit: 0` untuk menonaktifkan konteks riwayat grup.

Kanal room-event yang didukung menyimpan pesan ruang ambien terbaru sebagai konteks. Telegram menyimpan jendela bergulir per grup yang selalu aktif dan dibatasi oleh `historyLimit`; giliran permintaan pengguna memilih entri setelah balasan terakhir bot yang tercatat, sementara giliran room-event menerima seluruh jendela terbaru agar model dapat melihat posting terbarunya sendiri. Kunci mode Telegram `includeGroupHistoryContext` yang sudah dihentikan dihapus oleh `openclaw doctor --fix`.

## Pemecahan Masalah

Jika ruang menampilkan pengetikan atau penggunaan token tetapi tidak ada pesan terlihat:

1. Konfirmasi bahwa ruang diizinkan oleh daftar izin kanal dan daftar izin pengirim.
2. Konfirmasi bahwa `requireMention: false` ditetapkan pada level ruang yang Anda harapkan.
3. Periksa apakah `messages.groupChat.unmentionedInbound` atau override agen adalah `"room_event"`.
4. Periksa log untuk metadata payload akhir yang ditekan atau `didSendViaMessagingTool: false`.
5. Untuk permintaan grup normal, pertahankan atau pulihkan `messages.groupChat.visibleReplies: "automatic"` jika Anda ingin balasan akhir diposting secara otomatis. Untuk ruang ambien yang menggunakan `message_tool`, gunakan model/runtime yang andal memanggil tool.

Jika ruang ambien Telegram tidak terpicu sama sekali, periksa mode privasi BotFather dan verifikasi bahwa Gateway menerima pesan grup normal.

Jika ruang ambien Slack tidak terpicu, verifikasi bahwa kunci kanal adalah ID kanal Slack dan app memiliki cakupan `channels:history` atau `groups:history` yang diperlukan untuk jenis ruang tersebut.

## Terkait

- [Grup](/id/channels/groups)
- [Discord](/id/channels/discord)
- [Slack](/id/channels/slack)
- [Telegram](/id/channels/telegram)
- [Pemecahan masalah kanal](/id/channels/troubleshooting)
- [Referensi konfigurasi kanal](/id/gateway/config-channels)
