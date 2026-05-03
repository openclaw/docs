---
read_when:
    - Anda ingin menghubungkan OpenClaw ke QQ
    - Anda perlu menyiapkan kredensial QQ Bot
    - Anda ingin dukungan QQ Bot untuk obrolan grup atau obrolan pribadi
summary: Penyiapan, konfigurasi, dan penggunaan QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-05-03T21:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 471c24110bf0ab8896d22f5bb5932ac4e03ff5169560c99ba6b9d1ca4025d9a8
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot terhubung ke OpenClaw melalui API QQ Bot resmi (Gateway WebSocket). Plugin ini mendukung chat privat C2C, @pesan grup, dan pesan saluran guild dengan media kaya (gambar, suara, video, file).

Status: Plugin yang dapat diunduh. Pesan langsung, chat grup, saluran guild, dan media didukung. Reaksi dan thread tidak didukung.

## Instal

Instal QQ Bot sebelum penyiapan:

```bash
openclaw plugins install @openclaw/qqbot
```

## Penyiapan

1. Buka [QQ Open Platform](https://q.qq.com/) dan pindai kode QR dengan QQ di ponsel Anda untuk mendaftar / masuk.
2. Klik **Create Bot** untuk membuat bot QQ baru.
3. Temukan **AppID** dan **AppSecret** di halaman pengaturan bot, lalu salin.

> AppSecret tidak disimpan sebagai teks biasa — jika Anda meninggalkan halaman tanpa menyimpannya,
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

AppSecret SecretRef env:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

Catatan:

- Fallback env hanya berlaku untuk akun QQ Bot default.
- `openclaw channels add --channel qqbot --token-file ...` hanya menyediakan
  AppSecret; AppID harus sudah diatur di konfigurasi atau `QQBOT_APP_ID`.
- `clientSecret` juga menerima input SecretRef, bukan hanya string teks biasa.
- String penanda lama `secretref:/...` bukan nilai `clientSecret` yang valid;
  gunakan objek SecretRef terstruktur seperti contoh di atas.

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

Setiap akun meluncurkan koneksi WebSocket sendiri dan mempertahankan cache token independen (diisolasi oleh `appId`).

Tambahkan bot kedua melalui CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chat grup

Dukungan chat grup QQ Bot menggunakan OpenID grup QQ, bukan nama tampilan. Tambahkan bot ke grup, lalu sebut bot tersebut atau konfigurasikan grup agar berjalan tanpa mention.

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

`groups["*"]` menetapkan default untuk setiap grup, dan entri konkret `groups.GROUP_OPENID` menimpa default tersebut untuk satu grup. Pengaturan grup mencakup:

- `requireMention`: mewajibkan @mention sebelum bot membalas. Default: `true`.
- `ignoreOtherMentions`: membuang pesan yang menyebut orang lain tetapi tidak menyebut bot.
- `historyLimit`: menyimpan pesan grup non-mention terbaru sebagai konteks untuk giliran berikutnya yang menyebut bot. Atur `0` untuk menonaktifkan.
- `toolPolicy`: `full`, `restricted`, atau `none` untuk alat yang dicakup grup.
- `name`: label ramah yang digunakan dalam log dan konteks grup.
- `prompt`: prompt perilaku per grup yang ditambahkan ke konteks agen.

Mode aktivasi adalah `mention` dan `always`. `requireMention: true` dipetakan ke `mention`; `requireMention: false` dipetakan ke `always`. Override aktivasi tingkat sesi, jika ada, mengalahkan konfigurasi.

Antrean masuk bersifat per peer. Peer grup mendapatkan batas antrean yang lebih besar, memprioritaskan pesan manusia di atas percakapan buatan bot saat penuh, dan menggabungkan lonjakan pesan grup normal menjadi satu giliran beratribusi. Perintah slash tetap berjalan satu per satu.

### Suara (STT / TTS)

Dukungan STT dan TTS menggunakan konfigurasi dua tingkat dengan fallback prioritas:

| Pengaturan | Khusus Plugin                                            | Fallback framework           |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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
Override TTS tingkat akun menggunakan bentuk yang sama seperti `messages.tts` dan deep-merge di atas konfigurasi TTS saluran/global.

Lampiran suara QQ masuk diekspos ke agen sebagai metadata media audio sambil menjaga file suara mentah tetap di luar `MediaPaths` generik. Balasan teks biasa `[[audio_as_voice]]` menyintesis TTS dan mengirim pesan suara QQ native saat TTS dikonfigurasi.

Perilaku unggah/transkode audio keluar juga dapat disetel dengan `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Format target

| Format                     | Deskripsi          |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privat (C2C)  |
| `qqbot:group:GROUP_OPENID` | Chat grup          |
| `qqbot:channel:CHANNEL_ID` | Saluran guild      |

> Setiap bot memiliki kumpulan OpenID pengguna sendiri. OpenID yang diterima oleh Bot A **tidak dapat**
> digunakan untuk mengirim pesan melalui Bot B.

## Perintah slash

Perintah bawaan yang dicegat sebelum antrean AI:

| Perintah       | Deskripsi                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Uji latensi                                                                                             |
| `/bot-version` | Tampilkan versi framework OpenClaw                                                                      |
| `/bot-help`    | Cantumkan semua perintah                                                                                |
| `/bot-me`      | Tampilkan ID pengguna QQ pengirim (openid) untuk penyiapan `allowFrom`/`groupAllowFrom`                 |
| `/bot-upgrade` | Tampilkan tautan panduan upgrade QQBot                                                                  |
| `/bot-logs`    | Ekspor log Gateway terbaru sebagai file                                                                 |
| `/bot-approve` | Setujui tindakan QQ Bot yang tertunda (misalnya, mengonfirmasi unggahan C2C atau grup) melalui alur native. |

Tambahkan `?` ke perintah apa pun untuk bantuan penggunaan (misalnya `/bot-upgrade ?`).

Perintah admin (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) hanya untuk pesan langsung dan memerlukan openid pengirim dalam daftar `allowFrom` eksplisit non-wildcard. Wildcard `allowFrom: ["*"]` mengizinkan chat tetapi tidak memberikan akses perintah admin. Pesan grup dicocokkan terhadap `groupAllowFrom` terlebih dahulu dan fallback ke `allowFrom`. Menjalankan perintah admin di grup mengembalikan petunjuk alih-alih dibuang diam-diam.

## Arsitektur mesin

QQ Bot dikirim sebagai mesin mandiri di dalam Plugin:

- Setiap akun memiliki stack sumber daya terisolasi (koneksi WebSocket, klien API, cache token, root penyimpanan media) yang dikunci oleh `appId`. Akun tidak pernah berbagi status masuk/keluar.
- Logger multi-akun menandai baris log dengan akun pemilik sehingga diagnostik tetap dapat dipisahkan saat Anda menjalankan beberapa bot dalam satu Gateway.
- Jalur inbound, outbound, dan bridge Gateway berbagi satu root payload media di bawah `~/.openclaw/media`, sehingga unggahan, unduhan, dan cache transkode berada di bawah satu direktori yang dijaga, bukan pohon per subsistem.
- Pengiriman media kaya melewati satu jalur `sendMedia` untuk target C2C dan grup. File lokal dan buffer di atas ambang file besar menggunakan endpoint unggahan chunked QQ, sedangkan payload yang lebih kecil menggunakan API media sekali jalan.
- Kredensial dapat dicadangkan dan dipulihkan sebagai bagian dari snapshot kredensial OpenClaw standar; mesin memasang ulang stack sumber daya setiap akun saat pemulihan tanpa memerlukan pasangan kode QR baru.

## Onboarding kode QR

Sebagai alternatif untuk menempelkan `AppID:AppSecret` secara manual, mesin mendukung alur onboarding kode QR untuk menautkan QQ Bot ke OpenClaw:

1. Jalankan jalur penyiapan QQ Bot (misalnya `openclaw channels add --channel qqbot`) dan pilih alur kode QR saat diminta.
2. Pindai kode QR yang dihasilkan dengan aplikasi ponsel yang terhubung ke QQ Bot target.
3. Setujui pairing di ponsel. OpenClaw menyimpan kredensial yang dikembalikan ke `credentials/` di bawah cakupan akun yang tepat.

Prompt persetujuan yang dihasilkan oleh bot itu sendiri (misalnya, alur "izinkan tindakan ini?" yang diekspos oleh API QQ Bot) muncul sebagai prompt native OpenClaw yang dapat Anda terima dengan `/bot-approve` alih-alih membalas melalui klien QQ mentah.

## Pemecahan masalah

- **Bot membalas "gone to Mars":** kredensial tidak dikonfigurasi atau Gateway belum dimulai.
- **Tidak ada pesan masuk:** verifikasi `appId` dan `clientSecret` sudah benar, dan
  bot diaktifkan di QQ Open Platform.
- **Balasan mandiri berulang:** OpenClaw mencatat indeks ref keluar QQ sebagai
  buatan bot dan mengabaikan event masuk yang `msgIdx` saat ini cocok dengan
  akun bot yang sama. Ini mencegah loop echo platform sambil tetap mengizinkan pengguna
  mengutip atau membalas pesan bot sebelumnya.
- **Penyiapan dengan `--token-file` masih menunjukkan belum dikonfigurasi:** `--token-file` hanya mengatur
  AppSecret. Anda masih memerlukan `appId` dalam konfigurasi atau `QQBOT_APP_ID`.
- **Pesan proaktif tidak tiba:** QQ dapat mencegat pesan yang dimulai bot jika
  pengguna belum berinteraksi baru-baru ini.
- **Suara tidak ditranskripsi:** pastikan STT dikonfigurasi dan provider dapat dijangkau.

## Terkait

- [Pairing](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Pemecahan masalah saluran](/id/channels/troubleshooting)
