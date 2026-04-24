---
read_when:
    - Anda ingin menghubungkan OpenClaw ke QQ
    - Anda memerlukan penyiapan kredensial bot QQ
    - Anda menginginkan dukungan grup atau chat privat QQ
summary: Penyiapan, konfigurasi, dan penggunaan QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-04-24T08:59:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8127ec59d3a17222e7fe883e77aa1c7d384b231b7d479385421df51c995f7dc2
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot terhubung ke OpenClaw melalui API QQ Bot resmi (Gateway WebSocket). Plugin ini mendukung chat privat C2C, @messages grup, dan pesan saluran guild dengan media kaya (gambar, suara, video, file).

Status: plugin bawaan. Pesan langsung, chat grup, saluran guild, dan media didukung. Reaksi dan thread tidak didukung.

## Plugin bawaan

Rilis OpenClaw saat ini menyertakan QQ Bot, sehingga build paket normal tidak memerlukan langkah `openclaw plugins install` terpisah.

## Penyiapan

1. Buka [QQ Open Platform](https://q.qq.com/) dan pindai kode QR dengan aplikasi QQ di ponsel Anda untuk mendaftar / masuk.
2. Klik **Create Bot** untuk membuat bot QQ baru.
3. Temukan **AppID** dan **AppSecret** di halaman pengaturan bot dan salin keduanya.

> AppSecret tidak disimpan dalam plaintext — jika Anda meninggalkan halaman tanpa menyimpannya, Anda harus membuat ulang yang baru.

4. Tambahkan saluran:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Mulai ulang Gateway.

Jalur penyiapan interaktif:

```bash
openclaw channels add
openclaw configure --section channels
```

## Konfigurasi

Config minimal:

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

Variabel env akun default:

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

- Fallback env hanya berlaku untuk akun QQ Bot default.
- `openclaw channels add --channel qqbot --token-file ...` hanya menyediakan AppSecret; AppID harus sudah disetel di config atau `QQBOT_APP_ID`.
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

Setiap akun meluncurkan koneksi WebSocket-nya sendiri dan mempertahankan cache token independen (diisolasi oleh `appId`).

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

Setel `enabled: false` pada salah satunya untuk menonaktifkan.

Perilaku upload/transcode audio keluar juga dapat disetel dengan `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Format target

| Format                     | Deskripsi         |
| -------------------------- | ----------------- |
| `qqbot:c2c:OPENID`         | Chat privat (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat grup         |
| `qqbot:channel:CHANNEL_ID` | Saluran guild     |

> Setiap bot memiliki kumpulan OpenID pengguna sendiri. OpenID yang diterima oleh Bot A **tidak dapat** digunakan untuk mengirim pesan melalui Bot B.

## Perintah slash

Perintah bawaan yang diintersep sebelum antrean AI:

| Perintah       | Deskripsi                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Uji latensi                                                                                                 |
| `/bot-version` | Tampilkan versi framework OpenClaw                                                                          |
| `/bot-help`    | Daftar semua perintah                                                                                       |
| `/bot-upgrade` | Tampilkan tautan panduan upgrade QQBot                                                                      |
| `/bot-logs`    | Ekspor log Gateway terbaru sebagai file                                                                     |
| `/bot-approve` | Setujui tindakan QQ Bot yang tertunda (misalnya, mengonfirmasi upload C2C atau grup) melalui alur bawaan. |

Tambahkan `?` ke perintah mana pun untuk bantuan penggunaan (misalnya `/bot-upgrade ?`).

## Arsitektur engine

QQ Bot dikirim sebagai engine mandiri di dalam plugin:

- Setiap akun memiliki tumpukan resource terisolasi (koneksi WebSocket, klien API, cache token, root penyimpanan media) yang diberi kunci oleh `appId`. Akun tidak pernah berbagi status masuk/keluar.
- Logger multi-akun menandai baris log dengan akun pemilik agar diagnostik tetap terpisah saat Anda menjalankan beberapa bot dalam satu gateway.
- Jalur masuk, keluar, dan bridge gateway berbagi satu root payload media di bawah `~/.openclaw/media`, sehingga upload, download, dan cache transcode ditempatkan di satu direktori yang terlindungi alih-alih pohon per subsistem.
- Kredensial dapat dicadangkan dan dipulihkan sebagai bagian dari snapshot kredensial OpenClaw standar; engine akan memasang kembali tumpukan resource setiap akun saat pemulihan tanpa memerlukan pairing ulang kode QR baru.

## Onboarding kode QR

Sebagai alternatif dari menempelkan `AppID:AppSecret` secara manual, engine mendukung alur onboarding kode QR untuk menautkan QQ Bot ke OpenClaw:

1. Jalankan jalur penyiapan QQ Bot (misalnya `openclaw channels add --channel qqbot`) dan pilih alur kode QR saat diminta.
2. Pindai kode QR yang dihasilkan dengan aplikasi ponsel yang terhubung ke QQ Bot target.
3. Setujui pairing di ponsel. OpenClaw menyimpan kredensial yang dikembalikan ke dalam `credentials/` pada cakupan akun yang benar.

Prompt persetujuan yang dihasilkan oleh bot itu sendiri (misalnya alur "izinkan tindakan ini?" yang diekspos oleh API QQ Bot) muncul sebagai prompt OpenClaw bawaan yang dapat Anda setujui dengan `/bot-approve` alih-alih membalas melalui klien QQ mentah.

## Pemecahan masalah

- **Bot membalas "gone to Mars":** kredensial belum dikonfigurasi atau Gateway belum dijalankan.
- **Tidak ada pesan masuk:** verifikasi `appId` dan `clientSecret` benar, dan bot diaktifkan di QQ Open Platform.
- **Penyiapan dengan `--token-file` masih terlihat belum dikonfigurasi:** `--token-file` hanya menyetel AppSecret. Anda tetap memerlukan `appId` di config atau `QQBOT_APP_ID`.
- **Pesan proaktif tidak sampai:** QQ mungkin mencegat pesan yang diprakarsai bot jika pengguna belum berinteraksi baru-baru ini.
- **Suara tidak ditranskripsikan:** pastikan STT dikonfigurasi dan provider dapat dijangkau.

## Terkait

- [Pairing](/id/channels/pairing)
- [Groups](/id/channels/groups)
- [Pemecahan masalah saluran](/id/channels/troubleshooting)
