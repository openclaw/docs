---
read_when:
    - Anda ingin menghubungkan OpenClaw ke QQ
    - Anda perlu menyiapkan kredensial QQ Bot
    - Anda menginginkan dukungan grup atau chat pribadi QQ Bot
summary: Penyiapan, konfigurasi, dan penggunaan QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-04-26T11:24:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd899d9556ab418bbb3d7dc368e6f6e1eca96828cbcc87b4147ccad362f1918e
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot terhubung ke OpenClaw melalui API QQ Bot resmi (gateway WebSocket). Plugin
ini mendukung chat pribadi C2C, @message grup, dan pesan channel guild dengan
media kaya (gambar, suara, video, file).

Status: plugin bawaan. Pesan langsung, chat grup, channel guild, dan
media didukung. Reaksi dan thread tidak didukung.

## Plugin bawaan

Rilis OpenClaw saat ini menyertakan QQ Bot, sehingga build paket normal tidak memerlukan
langkah `openclaw plugins install` terpisah.

## Penyiapan

1. Buka [QQ Open Platform](https://q.qq.com/) dan pindai kode QR dengan
   QQ ponsel Anda untuk mendaftar / masuk.
2. Klik **Create Bot** untuk membuat bot QQ baru.
3. Temukan **AppID** dan **AppSecret** di halaman pengaturan bot dan salin keduanya.

> AppSecret tidak disimpan dalam plaintext — jika Anda meninggalkan halaman tanpa menyimpannya,
> Anda harus membuat ulang yang baru.

4. Tambahkan channel:

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

- Fallback env hanya berlaku untuk akun QQ Bot default.
- `openclaw channels add --channel qqbot --token-file ...` hanya menyediakan
  AppSecret; AppID harus sudah diatur di konfigurasi atau `QQBOT_APP_ID`.
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
token yang independen (terisolasi berdasarkan `appId`).

Tambahkan bot kedua melalui CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Suara (STT / TTS)

Dukungan STT dan TTS menggunakan konfigurasi dua tingkat dengan fallback prioritas:

| Pengaturan | Khusus Plugin                                           | Fallback framework           |
| ---------- | ------------------------------------------------------- | ---------------------------- |
| STT        | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`              |

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
      accounts: {
        qq-main: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Atur `enabled: false` pada salah satunya untuk menonaktifkannya.
Override TTS tingkat akun menggunakan bentuk yang sama seperti `messages.tts` dan melakukan deep-merge
di atas konfigurasi TTS channel/global.

Lampiran suara QQ masuk diekspos ke agen sebagai metadata media audio sambil
menjaga file suara mentah tetap di luar `MediaPaths` generik. Balasan teks biasa
`[[audio_as_voice]]` mensintesis TTS dan mengirim pesan suara QQ native saat TTS
dikonfigurasi.

Perilaku unggah/transkode audio keluar juga dapat disesuaikan dengan
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Format target

| Format                     | Deskripsi          |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat pribadi (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat grup          |
| `qqbot:channel:CHANNEL_ID` | Channel guild      |

> Setiap bot memiliki kumpulan OpenID pengguna sendiri. OpenID yang diterima oleh Bot A **tidak dapat**
> digunakan untuk mengirim pesan melalui Bot B.

## Perintah slash

Perintah bawaan yang dicegat sebelum antrean AI:

| Perintah       | Deskripsi                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Uji latensi                                                                                                      |
| `/bot-version` | Tampilkan versi framework OpenClaw                                                                               |
| `/bot-help`    | Daftarkan semua perintah                                                                                         |
| `/bot-upgrade` | Tampilkan tautan panduan upgrade QQBot                                                                           |
| `/bot-logs`    | Ekspor log gateway terbaru sebagai file                                                                          |
| `/bot-approve` | Setujui tindakan QQ Bot yang tertunda (misalnya, mengonfirmasi unggahan C2C atau grup) melalui alur native. |

Tambahkan `?` ke perintah apa pun untuk bantuan penggunaan (misalnya `/bot-upgrade ?`).

## Arsitektur engine

QQ Bot dikirim sebagai engine mandiri di dalam plugin:

- Setiap akun memiliki stack sumber daya terisolasi (koneksi WebSocket, klien API, cache token, root penyimpanan media) yang dikunci oleh `appId`. Akun tidak pernah berbagi status masuk/keluar.
- Logger multi-akun menandai baris log dengan akun pemilik agar diagnostik tetap terpisah saat Anda menjalankan beberapa bot dalam satu gateway.
- Jalur bridge masuk, keluar, dan gateway berbagi satu root muatan media di bawah `~/.openclaw/media`, sehingga unggahan, unduhan, dan cache transkode berada di satu direktori terlindungi, bukan di pohon per subsistem.
- Kredensial dapat dicadangkan dan dipulihkan sebagai bagian dari snapshot kredensial OpenClaw standar; engine memasang ulang stack sumber daya setiap akun saat pemulihan tanpa memerlukan pasangan kode QR baru.

## Onboarding kode QR

Sebagai alternatif untuk menempelkan `AppID:AppSecret` secara manual, engine mendukung alur onboarding kode QR untuk menautkan QQ Bot ke OpenClaw:

1. Jalankan jalur penyiapan QQ Bot (misalnya `openclaw channels add --channel qqbot`) dan pilih alur kode QR saat diminta.
2. Pindai kode QR yang dihasilkan dengan aplikasi ponsel yang terhubung ke QQ Bot target.
3. Setujui pairing di ponsel. OpenClaw menyimpan kredensial yang dikembalikan ke `credentials/` di bawah cakupan akun yang benar.

Prompt persetujuan yang dibuat oleh bot itu sendiri (misalnya alur "allow this action?" yang diekspos oleh API QQ Bot) ditampilkan sebagai prompt OpenClaw native yang dapat Anda setujui dengan `/bot-approve` alih-alih membalas melalui klien QQ mentah.

## Pemecahan masalah

- **Bot membalas "gone to Mars":** kredensial belum dikonfigurasi atau Gateway belum dimulai.
- **Tidak ada pesan masuk:** verifikasi bahwa `appId` dan `clientSecret` benar, dan
  bot diaktifkan di QQ Open Platform.
- **Balasan diri berulang:** OpenClaw mencatat indeks ref keluar QQ sebagai
  ditulis bot dan mengabaikan peristiwa masuk yang `msgIdx` saat ini cocok dengan
  akun bot yang sama. Ini mencegah loop echo platform sambil tetap memungkinkan pengguna
  mengutip atau membalas pesan bot sebelumnya.
- **Penyiapan dengan `--token-file` masih terlihat belum dikonfigurasi:** `--token-file` hanya menetapkan
  AppSecret. Anda tetap memerlukan `appId` di konfigurasi atau `QQBOT_APP_ID`.
- **Pesan proaktif tidak sampai:** QQ dapat mencegat pesan yang dimulai bot jika
  pengguna belum berinteraksi baru-baru ini.
- **Suara tidak ditranskripsikan:** pastikan STT dikonfigurasi dan provider dapat dijangkau.

## Terkait

- [Pairing](/id/channels/pairing)
- [Groups](/id/channels/groups)
- [Pemecahan masalah channel](/id/channels/troubleshooting)
