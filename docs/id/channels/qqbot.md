---
read_when:
    - Anda ingin menghubungkan OpenClaw ke QQ
    - Anda memerlukan penyiapan kredensial QQ Bot
    - Anda ingin dukungan grup atau obrolan pribadi QQ Bot
summary: Penyiapan, konfigurasi, dan penggunaan QQ Bot
title: QQ Bot
x-i18n:
    generated_at: "2026-04-05T13:43:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e58fb7b07c59ecbf80a1276368c4a007b45d84e296ed40cffe9845e0953696c
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Bot terhubung ke OpenClaw melalui API resmi QQ Bot (gateway WebSocket). Plugin
ini mendukung obrolan pribadi C2C, @message grup, dan pesan channel guild dengan
media kaya (gambar, suara, video, file).

Status: plugin bawaan. Pesan langsung, obrolan grup, channel guild, dan
media didukung. Reaksi dan thread tidak didukung.

## Plugin bawaan

Rilis OpenClaw saat ini menyertakan QQ Bot, jadi build paket normal tidak memerlukan
langkah `openclaw plugins install` terpisah.

## Penyiapan

1. Buka [QQ Open Platform](https://q.qq.com/) dan pindai kode QR dengan
   QQ di ponsel Anda untuk mendaftar / masuk.
2. Klik **Create Bot** untuk membuat bot QQ baru.
3. Temukan **AppID** dan **AppSecret** di halaman pengaturan bot dan salin.

> AppSecret tidak disimpan dalam plaintext — jika Anda meninggalkan halaman tanpa menyimpannya,
> Anda harus membuat ulang yang baru.

4. Tambahkan channel:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Mulai ulang Gateway.

Path penyiapan interaktif:

```bash
openclaw channels add
openclaw configure --section channels
```

## Konfigurasi

Konfigurasi minimal:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Variabel lingkungan akun default:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret berbasis file:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Catatan:

- Fallback env hanya berlaku untuk akun default QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` hanya menyediakan
  AppSecret; AppID harus sudah ditetapkan di konfigurasi atau `QQBOT_APP_ID`.
- `clientSecret` juga menerima input SecretRef, bukan hanya string plaintext.

### Penyiapan multi-akun

Jalankan beberapa bot QQ dalam satu instance OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Setiap akun meluncurkan koneksi WebSocket-nya sendiri dan mempertahankan cache
token yang independen (diisolasi berdasarkan `appId`).

Tambahkan bot kedua melalui CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Suara (STT / TTS)

Dukungan STT dan TTS menggunakan konfigurasi dua tingkat dengan fallback prioritas:

| Pengaturan | Khusus plugin         | Fallback framework            |
| ---------- | --------------------- | ----------------------------- |
| STT        | `channels.qqbot.stt`  | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`  | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

Tetapkan `enabled: false` pada salah satu untuk menonaktifkannya.

Perilaku upload/transcode audio outbound juga dapat disetel dengan
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Format target

| Format                     | Deskripsi           |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | Obrolan pribadi (C2C) |
| `qqbot:group:GROUP_OPENID` | Obrolan grup        |
| `qqbot:channel:CHANNEL_ID` | Channel guild       |

> Setiap bot memiliki kumpulan OpenID penggunanya sendiri. OpenID yang diterima oleh Bot A **tidak dapat**
> digunakan untuk mengirim pesan melalui Bot B.

## Slash command

Perintah bawaan yang dicegat sebelum antrean AI:

| Perintah       | Deskripsi                              |
| -------------- | -------------------------------------- |
| `/bot-ping`    | Uji latensi                            |
| `/bot-version` | Tampilkan versi framework OpenClaw     |
| `/bot-help`    | Daftarkan semua perintah               |
| `/bot-upgrade` | Tampilkan tautan panduan upgrade QQBot |
| `/bot-logs`    | Ekspor log gateway terbaru sebagai file |

Tambahkan `?` ke perintah apa pun untuk bantuan penggunaan (misalnya `/bot-upgrade ?`).

## Pemecahan masalah

- **Bot membalas "gone to Mars":** kredensial belum dikonfigurasi atau Gateway belum dijalankan.
- **Tidak ada pesan masuk:** verifikasi bahwa `appId` dan `clientSecret` benar, dan
  bot diaktifkan di QQ Open Platform.
- **Penyiapan dengan `--token-file` masih menunjukkan belum dikonfigurasi:** `--token-file` hanya menetapkan
  AppSecret. Anda tetap memerlukan `appId` di konfigurasi atau `QQBOT_APP_ID`.
- **Pesan proaktif tidak sampai:** QQ dapat mencegat pesan yang diprakarsai bot jika
  pengguna belum berinteraksi baru-baru ini.
- **Suara tidak ditranskripsikan:** pastikan STT sudah dikonfigurasi dan provider dapat dijangkau.
