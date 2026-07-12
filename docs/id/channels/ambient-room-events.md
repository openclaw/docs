---
read_when:
    - Mengonfigurasi ruang grup atau kanal yang selalu aktif
    - Anda ingin agen memantau obrolan ruang tanpa memposting teks akhir secara otomatis
    - Men-debug indikator pengetikan dan penggunaan token tanpa pesan yang terlihat di ruang obrolan
sidebarTitle: Ambient room events
summary: Izinkan ruang grup yang didukung menyediakan konteks secara senyap kecuali agen mengirim pesan dengan alat pesan
title: Peristiwa ruangan sekitar
x-i18n:
    generated_at: "2026-07-12T13:58:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Peristiwa ruang ambien memungkinkan OpenClaw memproses percakapan grup atau kanal yang tidak menyebutnya sebagai konteks pasif. Agen dapat memperbarui memori dan status sesi, tetapi ruang tetap senyap kecuali agen secara eksplisit memanggil alat `message`.

Untuk obrolan grup yang selalu aktif, gabungkan `messages.groupChat.unmentionedInbound: "room_event"` dengan `messages.groupChat.visibleReplies: "message_tool"`. Agen mendengarkan, memutuskan kapan balasan berguna, dan tidak lagi memerlukan pola perintah lama untuk menjawab `NO_REPLY`.

Saat ini didukung: kanal guild Discord, kanal dan kanal privat Slack, DM multipengguna Slack, serta grup atau supergrup Telegram. Kanal grup lainnya mempertahankan perilaku grup yang sudah ada, kecuali halaman kanalnya menyatakan bahwa kanal tersebut mendukung peristiwa ruang ambien.

## Penyiapan yang disarankan

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

Kemudian buat ruang selalu aktif dengan menonaktifkan persyaratan penyebutan untuk ruang tersebut. Ruang tetap harus lolos `groupPolicy`, daftar izin ruang, dan daftar izin pengirim seperti biasa.

Setelah konfigurasi disimpan, Gateway menerapkan langsung pengaturan `messages`. Mulai ulang hanya jika pemantauan berkas atau pemuatan ulang konfigurasi dinonaktifkan (`gateway.reload.mode: "off"`).

## Hal yang berubah

Dengan `messages.groupChat.unmentionedInbound: "room_event"`:

- pesan grup atau kanal yang diizinkan dan tidak menyebut agen menjadi peristiwa ruang pasif
- pesan yang menyebut agen tetap menjadi permintaan pengguna
- perintah kontrol teks dan perintah native tetap menjadi permintaan pengguna
- permintaan untuk membatalkan atau menghentikan tetap menjadi permintaan pengguna
- pesan langsung tetap menjadi permintaan pengguna

Peristiwa ruang menggunakan pengiriman terlihat yang ketat. Teks akhir asisten bersifat privat. Agen harus memanggil `message(action=send)` untuk mengirimkannya ke ruang.

Indikator pengetikan dan reaksi status siklus proses tetap dinonaktifkan untuk peristiwa ruang. Satu-satunya pengecualian tanda terima eksplisit adalah `messages.ackReactionScope: "all"`, yang mengirimkan reaksi konfirmasi yang dikonfigurasi; gunakan cakupan yang lebih sempit atau `"off"` jika ruang harus tetap sepenuhnya senyap.

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

Gunakan konfigurasi Discord per kanal jika hanya satu kanal yang akan dibuat ambien. Di bawah `groupPolicy: "allowlist"`, mencantumkan kanal akan mengizinkannya (`enabled: false` menonaktifkan entri):

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
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

Daftar izin kanal Slack mengutamakan ID. Gunakan ID kanal seperti `C12345678`, bukan `#channel-name`. Mencantumkan kanal di bawah `channels.slack.channels` akan mengizinkannya (`enabled: false` menonaktifkan entri):

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
          requireMention: false,
        },
      },
    },
  },
}
```

## Contoh Telegram

Untuk grup Telegram, bot harus dapat melihat pesan grup biasa. Jika `requireMention: false`, nonaktifkan mode privasi BotFather atau gunakan penyiapan Telegram lain yang mengirimkan seluruh lalu lintas grup kepada bot.

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

ID grup Telegram biasanya berupa angka negatif seperti `-1001234567890`. Baca `chat.id` dari `openclaw logs --follow`, teruskan pesan grup kepada bot pembantu ID, atau periksa `getUpdates` dari Bot API.

## Kebijakan khusus agen

Gunakan penimpaan agen ketika beberapa agen berbagi ruang yang sama, tetapi hanya satu agen yang boleh memperlakukan percakapan tanpa penyebutan sebagai konteks ambien:

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

Nilai `agents.list[].groupChat.unmentionedInbound` khusus agen menimpa `messages.groupChat.unmentionedInbound` untuk agen tersebut.

## Mode balasan terlihat

`messages.groupChat.visibleReplies` secara default menggunakan `"automatic"` untuk permintaan pengguna grup/kanal biasa. Pertahankan nilai default tersebut jika teks akhir asisten harus dikirim secara terlihat tanpa pemanggilan eksplisit alat pesan.

Untuk ruang ambien yang selalu aktif, `messages.groupChat.visibleReplies: "message_tool"` tetap disarankan, terutama dengan model generasi terbaru yang andal menggunakan alat, seperti GPT-5.6 Sol. Pengaturan ini memungkinkan agen memutuskan kapan harus berbicara dengan memanggil alat pesan. Jika model mengembalikan teks akhir tanpa memanggil alat, OpenClaw menjaga teks akhir tersebut tetap privat dan mencatat metadata pengiriman yang dinonaktifkan.

Peristiwa ruang tetap ketat meskipun permintaan grup lainnya menggunakan balasan otomatis. Peristiwa ruang ambien tanpa penyebutan selalu memerlukan `message(action=send)` untuk keluaran yang terlihat.

## Riwayat

`messages.groupChat.historyLimit` menetapkan nilai default riwayat grup global (50 jika tidak diatur; harus berupa bilangan bulat positif). Kanal dapat menimpanya dengan `channels.<channel>.historyLimit`, dan beberapa kanal juga mendukung batas riwayat per akun. Atur `historyLimit: 0` pada tingkat kanal untuk menonaktifkan konteks riwayat grup bagi kanal tersebut.

Kanal peristiwa ruang yang didukung menyimpan pesan ruang ambien terbaru sebagai konteks. Telegram menyimpan jendela bergulir per grup yang selalu aktif dan dibatasi oleh `historyLimit`; giliran permintaan pengguna memilih entri setelah balasan terakhir bot yang tercatat, sedangkan giliran peristiwa ruang menerima seluruh jendela terbaru agar model dapat melihat kiriman terbarunya sendiri. Kunci mode Telegram `includeGroupHistoryContext` yang telah dihentikan dihapus oleh `openclaw doctor --fix`.

## Pemecahan masalah

Jika ruang menampilkan indikator pengetikan atau penggunaan token, tetapi tidak ada pesan yang terlihat:

1. Pastikan ruang diizinkan oleh daftar izin kanal dan daftar izin pengirim.
2. Pastikan `requireMention: false` ditetapkan pada tingkat ruang yang Anda harapkan.
3. Periksa apakah `messages.groupChat.unmentionedInbound` atau penimpaan agen bernilai `"room_event"`.
4. Periksa log untuk metadata muatan akhir yang pengirimannya dinonaktifkan atau `didSendViaMessagingTool: false`.
5. Untuk permintaan grup biasa, pertahankan atau pulihkan `messages.groupChat.visibleReplies: "automatic"` jika Anda ingin balasan akhir dikirim secara otomatis. Untuk ruang ambien yang menggunakan `message_tool`, gunakan model/runtime yang memanggil alat dengan andal.

Jika ruang ambien Telegram sama sekali tidak terpicu, periksa mode privasi BotFather dan pastikan Gateway menerima pesan grup biasa.

Jika ruang ambien Slack tidak terpicu, pastikan kunci kanal adalah ID kanal Slack dan aplikasi memiliki cakupan riwayat untuk jenis ruang tersebut: `channels:history` (publik), `groups:history` (privat), atau `mpim:history` (DM multipengguna).

## Terkait

- [Grup](/id/channels/groups)
- [Discord](/id/channels/discord)
- [Slack](/id/channels/slack)
- [Telegram](/id/channels/telegram)
- [Pemecahan masalah kanal](/id/channels/troubleshooting)
- [Referensi konfigurasi kanal](/id/gateway/config-channels)
