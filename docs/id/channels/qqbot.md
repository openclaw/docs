---
read_when:
    - Anda ingin menghubungkan OpenClaw ke QQ
    - Anda perlu menyiapkan kredensial QQ Bot
    - Anda menginginkan dukungan QQ Bot untuk obrolan grup atau pribadi
summary: Penyiapan, konfigurasi, dan penggunaan Bot QQ
title: bot QQ
x-i18n:
    generated_at: "2026-04-30T09:35:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 964a92021acc534b7ec2749670fedd0e8caa47d5edf67ced80f0a8fb3eda7600
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot terhubung ke OpenClaw melalui QQ Bot API resmi (WebSocket gateway). Plugin ini mendukung obrolan pribadi C2C, @pesan grup, dan pesan saluran guild dengan media kaya (gambar, suara, video, file).

Status: Plugin bawaan. Pesan langsung, obrolan grup, saluran guild, dan media didukung. Reaksi dan thread tidak didukung.

## Plugin bawaan

Rilis OpenClaw saat ini menyertakan QQ Bot, sehingga build paket normal tidak memerlukan langkah `openclaw plugins install` terpisah.

## Penyiapan

1. Buka [QQ Open Platform](https://q.qq.com/) dan pindai kode QR dengan QQ di ponsel Anda untuk mendaftar / masuk.
2. Klik **Create Bot** untuk membuat bot QQ baru.
3. Temukan **AppID** dan **AppSecret** di halaman pengaturan bot, lalu salin keduanya.

> AppSecret tidak disimpan dalam teks polos — jika Anda meninggalkan halaman tanpa menyimpannya,
> Anda harus membuat ulang yang baru.

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
- `openclaw channels add --channel qqbot --token-file ...` hanya menyediakan
  AppSecret; AppID harus sudah diatur di konfigurasi atau `QQBOT_APP_ID`.
- `clientSecret` juga menerima input SecretRef, bukan hanya string teks polos.

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

Setiap akun meluncurkan koneksi WebSocket sendiri dan mempertahankan cache token independen (diisolasi berdasarkan `appId`).

Tambahkan bot kedua melalui CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Obrolan grup

Dukungan obrolan grup QQ Bot menggunakan OpenID grup QQ, bukan nama tampilan. Tambahkan bot ke grup, lalu sebut bot tersebut atau konfigurasikan grup agar berjalan tanpa sebutan.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` menetapkan default untuk setiap grup, dan entri konkret
`groups.GROUP_OPENID` menimpa default tersebut untuk satu grup. Pengaturan grup mencakup:

- `requireMention`: mewajibkan @mention sebelum bot membalas. Default: `true`.
- `ignoreOtherMentions`: membuang pesan yang menyebut orang lain tetapi bukan bot.
- `historyLimit`: menyimpan pesan grup terbaru yang bukan sebutan sebagai konteks untuk giliran berikutnya yang menyebut bot. Atur `0` untuk menonaktifkan.
- `toolPolicy`: `full`, `restricted`, atau `none` untuk alat yang dicakup grup.
- `name`: label ramah yang digunakan dalam log dan konteks grup.
- `prompt`: prompt perilaku per grup yang ditambahkan ke konteks agen.

Mode aktivasi adalah `mention` dan `always`. `requireMention: true` dipetakan ke
`mention`; `requireMention: false` dipetakan ke `always`. Override aktivasi tingkat sesi, jika ada, mengungguli konfigurasi.

Antrean masuk bersifat per peer. Peer grup mendapatkan batas antrean yang lebih besar, menjaga pesan manusia tetap di depan percakapan yang ditulis bot saat penuh, dan menggabungkan ledakan pesan grup normal menjadi satu giliran beratribusi. Perintah slash tetap berjalan satu per satu.

### Suara (STT / TTS)

Dukungan STT dan TTS menggunakan konfigurasi dua tingkat dengan fallback prioritas:

| Pengaturan | Khusus Plugin                                           | Fallback framework            |
| ---------- | ------------------------------------------------------- | ----------------------------- |
| STT        | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

Atur `enabled: false` pada salah satunya untuk menonaktifkan.
Override TTS tingkat akun menggunakan bentuk yang sama seperti `messages.tts` dan melakukan deep-merge di atas konfigurasi TTS saluran/global.

Lampiran suara QQ yang masuk diekspos ke agen sebagai metadata media audio sambil menjaga file suara mentah tetap di luar `MediaPaths` generik. Balasan teks polos `[[audio_as_voice]]` menyintesis TTS dan mengirim pesan suara QQ native saat TTS dikonfigurasi.

Perilaku unggah/transkode audio keluar juga dapat disetel dengan
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Format target

| Format                     | Deskripsi             |
| -------------------------- | --------------------- |
| `qqbot:c2c:OPENID`         | Obrolan pribadi (C2C) |
| `qqbot:group:GROUP_OPENID` | Obrolan grup          |
| `qqbot:channel:CHANNEL_ID` | Saluran guild         |

> Setiap bot memiliki kumpulan OpenID pengguna sendiri. OpenID yang diterima oleh Bot A **tidak dapat**
> digunakan untuk mengirim pesan melalui Bot B.

## Perintah slash

Perintah bawaan yang dicegat sebelum antrean AI:

| Perintah       | Deskripsi                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Uji latensi                                                                                              |
| `/bot-version` | Tampilkan versi framework OpenClaw                                                                       |
| `/bot-help`    | Cantumkan semua perintah                                                                                 |
| `/bot-me`      | Tampilkan ID pengguna QQ pengirim (openid) untuk penyiapan `allowFrom`/`groupAllowFrom`                  |
| `/bot-upgrade` | Tampilkan tautan panduan upgrade QQBot                                                                   |
| `/bot-logs`    | Ekspor log gateway terbaru sebagai file                                                                  |
| `/bot-approve` | Setujui tindakan QQ Bot yang tertunda (misalnya, mengonfirmasi unggahan C2C atau grup) melalui alur native. |

Tambahkan `?` ke perintah apa pun untuk bantuan penggunaan (misalnya `/bot-upgrade ?`).

Perintah admin (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) hanya untuk pesan langsung dan memerlukan openid pengirim dalam daftar `allowFrom` non-wildcard eksplisit. Wildcard `allowFrom: ["*"]` mengizinkan obrolan tetapi tidak memberikan akses perintah admin. Pesan grup dicocokkan dengan `groupAllowFrom` terlebih dahulu dan fallback ke `allowFrom`. Menjalankan perintah admin di grup mengembalikan petunjuk alih-alih membuangnya diam-diam.

## Arsitektur mesin

QQ Bot dikirim sebagai mesin mandiri di dalam Plugin:

- Setiap akun memiliki stack resource terisolasi (koneksi WebSocket, klien API, cache token, root penyimpanan media) yang dikunci oleh `appId`. Akun tidak pernah berbagi status masuk/keluar.
- Logger multi-akun menandai baris log dengan akun pemilik agar diagnostik tetap terpisah saat Anda menjalankan beberapa bot dalam satu gateway.
- Jalur masuk, keluar, dan bridge gateway berbagi satu root payload media di bawah `~/.openclaw/media`, sehingga unggahan, unduhan, dan cache transkode berada di bawah satu direktori terlindungi, bukan pohon per subsistem.
- Pengiriman media kaya melalui satu jalur `sendMedia` untuk target C2C dan grup. File lokal dan buffer di atas ambang file besar menggunakan endpoint unggah chunked QQ, sedangkan payload yang lebih kecil menggunakan API media sekali jalan.
- Kredensial dapat dicadangkan dan dipulihkan sebagai bagian dari snapshot kredensial OpenClaw standar; mesin memasang kembali stack resource setiap akun saat pemulihan tanpa memerlukan pasangan kode QR baru.

## Onboarding kode QR

Sebagai alternatif untuk menempelkan `AppID:AppSecret` secara manual, mesin mendukung alur onboarding kode QR untuk menautkan QQ Bot ke OpenClaw:

1. Jalankan jalur penyiapan QQ Bot (misalnya `openclaw channels add --channel qqbot`) dan pilih alur kode QR saat diminta.
2. Pindai kode QR yang dibuat dengan aplikasi ponsel yang ditautkan ke QQ Bot target.
3. Setujui pairing di ponsel. OpenClaw mempertahankan kredensial yang dikembalikan ke dalam `credentials/` di bawah cakupan akun yang tepat.

Prompt persetujuan yang dibuat oleh bot itu sendiri (misalnya, alur "izinkan tindakan ini?" yang diekspos oleh QQ Bot API) muncul sebagai prompt native OpenClaw yang dapat Anda terima dengan `/bot-approve`, bukan membalas melalui klien QQ mentah.

## Pemecahan masalah

- **Bot membalas "gone to Mars":** kredensial belum dikonfigurasi atau Gateway belum dimulai.
- **Tidak ada pesan masuk:** verifikasi `appId` dan `clientSecret` benar, dan
  bot diaktifkan di QQ Open Platform.
- **Balasan mandiri berulang:** OpenClaw merekam indeks ref keluar QQ sebagai
  ditulis bot dan mengabaikan peristiwa masuk yang `msgIdx` saat ini cocok dengan
  akun bot yang sama. Ini mencegah loop gema platform sambil tetap memungkinkan pengguna
  mengutip atau membalas pesan bot sebelumnya.
- **Penyiapan dengan `--token-file` masih tampil belum dikonfigurasi:** `--token-file` hanya mengatur
  AppSecret. Anda tetap memerlukan `appId` di konfigurasi atau `QQBOT_APP_ID`.
- **Pesan proaktif tidak tiba:** QQ dapat mencegat pesan yang dimulai bot jika
  pengguna belum berinteraksi baru-baru ini.
- **Suara tidak ditranskripsi:** pastikan STT dikonfigurasi dan provider dapat dijangkau.

## Terkait

- [Pairing](/id/channels/pairing)
- [Groups](/id/channels/groups)
- [Pemecahan masalah saluran](/id/channels/troubleshooting)
