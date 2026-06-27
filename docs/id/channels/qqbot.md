---
read_when:
    - Anda ingin menghubungkan OpenClaw ke QQ
    - Anda perlu menyiapkan kredensial QQ Bot
    - Anda menginginkan dukungan grup QQ Bot atau obrolan privat
summary: Pengaturan, konfigurasi, dan penggunaan QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-06-27T17:12:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot terhubung ke OpenClaw melalui QQ Bot API resmi (Gateway WebSocket). Plugin ini mendukung obrolan privat C2C, @pesan grup, dan pesan channel guild dengan media kaya (gambar, suara, video, file).

Status: Plugin yang dapat diunduh. Pesan langsung, obrolan grup, channel guild, dan media didukung. Reaksi dan utas tidak didukung.

## Instal

Instal QQ Bot sebelum penyiapan:

```bash
openclaw plugins install @openclaw/qqbot
```

## Penyiapan

1. Buka [QQ Open Platform](https://q.qq.com/) dan pindai kode QR dengan QQ di
   ponsel Anda untuk mendaftar / masuk.
2. Klik **Create Bot** untuk membuat bot QQ baru.
3. Temukan **AppID** dan **AppSecret** di halaman pengaturan bot, lalu salin keduanya.

> AppSecret tidak disimpan dalam teks biasa — jika Anda meninggalkan halaman tanpa menyimpannya,
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
  AppSecret; AppID harus sudah ditetapkan dalam konfigurasi atau `QQBOT_APP_ID`.
- `clientSecret` juga menerima input SecretRef, bukan hanya string teks biasa.
- String marker `secretref:/...` lama bukan nilai `clientSecret` yang valid;
  gunakan objek SecretRef terstruktur seperti contoh di atas.

### Penyiapan multi-akun

Jalankan beberapa bot QQ dalam satu instans OpenClaw:

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

Setiap akun meluncurkan koneksi WebSocket miliknya sendiri dan mempertahankan
cache token independen (diisolasi berdasarkan `appId`).

Tambahkan bot kedua melalui CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Obrolan grup

Dukungan obrolan grup QQ Bot menggunakan OpenID grup QQ, bukan nama tampilan. Tambahkan bot
ke grup, lalu mention bot tersebut atau konfigurasikan grup agar berjalan tanpa mention.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` menetapkan default untuk setiap grup, dan entri konkret
`groups.GROUP_OPENID` menimpa default tersebut untuk satu grup. Pengaturan grup
mencakup:

- `requireMention`: mewajibkan @mention sebelum bot membalas. Default: `true`.
- `commandLevel`: mengontrol perintah slash bawaan mana yang dapat berjalan di grup.
  Default: `all`, yang mempertahankan perilaku grup QQBot yang sudah ada saat
  pengaturan dihilangkan.
- `ignoreOtherMentions`: membuang pesan yang mention orang lain tetapi bukan bot.
- `historyLimit`: menyimpan pesan grup non-mention terbaru sebagai konteks untuk giliran berikutnya yang di-mention. Atur ke `0` untuk menonaktifkan.
- `tools`: mengizinkan/menolak tool untuk seluruh grup.
- `toolsBySender`: penimpaan tool grup per pengirim; lihat [Grup](/id/channels/groups#groupchannel-tool-restrictions-optional).
- `name`: label ramah yang digunakan dalam log dan konteks grup.
- `prompt`: prompt perilaku per grup yang ditambahkan ke konteks agen.

`commandLevel` menerima:

- `all`: mempertahankan perintah bawaan yang dikenali agar tetap tersedia seperti sebelumnya. Beberapa perintah mungkin
  tetap tersembunyi dari menu, tetapi pengguna yang berwenang tetap dapat menjalankannya di grup.
- `safety`: mengizinkan perintah kolaborasi umum seperti `/help`, `/btw`, dan
  `/stop`; meminta pengguna menjalankan perintah sensitif seperti `/config`, `/tools`, dan
  `/bash` dalam obrolan privat.
- `strict`: hanya mengizinkan kontrol sesi grup yang diperlukan untuk operasi grup
  ketat. `/stop` tetap bersifat mendesak agar pengirim yang berwenang dapat menginterupsi
  run yang aktif.

Entri `toolPolicy` QQBot lama telah dihentikan. Jalankan `openclaw doctor --fix` untuk memigrasikannya ke `tools`.

Mode aktivasi adalah `mention` dan `always`. `requireMention: true` dipetakan ke
`mention`; `requireMention: false` dipetakan ke `always`. Jika ada, penimpaan aktivasi
tingkat sesi mengalahkan konfigurasi.

Antrean masuk bersifat per peer. Peer grup mendapat batas antrean yang lebih besar, mempertahankan pesan manusia
di depan percakapan yang ditulis bot saat penuh, dan menggabungkan ledakan pesan grup normal
menjadi satu giliran yang diberi atribusi. Perintah slash tetap berjalan satu per satu.

### Suara (STT / TTS)

Dukungan STT dan TTS menggunakan konfigurasi dua tingkat dengan fallback prioritas:

| Pengaturan | Khusus Plugin                                             | Fallback framework           |
| ---------- | --------------------------------------------------------- | ---------------------------- |
| STT        | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`  | `messages.tts`               |

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
        "qq-main": {
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
Penimpaan TTS tingkat akun menggunakan bentuk yang sama seperti `messages.tts` dan melakukan deep-merge
di atas konfigurasi TTS channel/global.

Lampiran suara QQ masuk diekspos ke agen sebagai metadata media audio sambil
menjaga file suara mentah tetap berada di luar `MediaPaths` generik. Balasan teks biasa
`[[audio_as_voice]]` mensintesis TTS dan mengirim pesan suara QQ native saat TTS
dikonfigurasi.

Perilaku unggah/transcode audio keluar juga dapat disesuaikan dengan
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Format target

| Format                     | Deskripsi          |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Obrolan privat (C2C) |
| `qqbot:group:GROUP_OPENID` | Obrolan grup       |
| `qqbot:channel:CHANNEL_ID` | Channel guild      |

> Setiap bot memiliki kumpulan OpenID penggunanya sendiri. OpenID yang diterima oleh Bot A **tidak dapat**
> digunakan untuk mengirim pesan melalui Bot B.

## Perintah slash

Perintah bawaan yang diintersep sebelum antrean AI:

| Perintah       | Deskripsi                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Uji latensi                                                                                             |
| `/bot-version` | Menampilkan versi framework OpenClaw                                                                    |
| `/bot-help`    | Mencantumkan semua perintah                                                                             |
| `/bot-me`      | Menampilkan ID pengguna QQ pengirim (openid) untuk penyiapan `allowFrom`/`groupAllowFrom`               |
| `/bot-upgrade` | Menampilkan tautan panduan peningkatan QQBot                                                            |
| `/bot-logs`    | Mengekspor log gateway terbaru sebagai file                                                             |
| `/bot-approve` | Menyetujui tindakan QQ Bot yang tertunda (misalnya, mengonfirmasi unggahan C2C atau grup) melalui alur native. |

Tambahkan `?` ke perintah apa pun untuk bantuan penggunaan (misalnya `/bot-upgrade ?`).

Perintah admin (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) hanya untuk pesan langsung dan memerlukan openid pengirim dalam daftar `allowFrom` eksplisit non-wildcard. Wildcard `allowFrom: ["*"]` mengizinkan obrolan tetapi tidak memberikan akses perintah admin. Pesan grup dicocokkan terhadap `groupAllowFrom` terlebih dahulu dan fallback ke `allowFrom`. Menjalankan perintah admin dalam grup mengembalikan petunjuk alih-alih dibuang diam-diam.

Saat persetujuan exec QQ Bot menggunakan fallback obrolan yang sama secara default, klik tombol persetujuan native
mengikuti allowlist perintah eksplisit non-wildcard yang sama. Untuk memberikan akses
khusus persetujuan tanpa akses perintah yang lebih luas, konfigurasikan
`channels.qqbot.execApprovals.approvers`.

## Arsitektur engine

QQ Bot dikirim sebagai engine mandiri di dalam Plugin:

- Setiap akun memiliki stack resource terisolasi (koneksi WebSocket, klien API, cache token, root penyimpanan media) yang dikunci berdasarkan `appId`. Akun tidak pernah berbagi state masuk/keluar.
- Logger multi-akun menandai baris log dengan akun pemilik agar diagnostik tetap dapat dipisahkan saat Anda menjalankan beberapa bot di bawah satu Gateway.
- Jalur masuk, keluar, dan bridge Gateway berbagi satu root payload media di bawah `~/.openclaw/media`, sehingga unggahan, unduhan, dan cache transcode berada di bawah satu direktori terlindungi, bukan pohon per subsistem.
- Pengiriman media kaya melewati satu jalur `sendMedia` untuk target C2C dan grup. File lokal dan buffer di atas ambang file besar menggunakan endpoint unggah bersegmen milik QQ, sedangkan payload yang lebih kecil menggunakan API media sekali jalan.
- Kredensial dapat dicadangkan dan dipulihkan sebagai bagian dari snapshot kredensial OpenClaw standar; engine memasang ulang stack resource setiap akun saat pemulihan tanpa memerlukan pasangan kode QR baru.

## Onboarding kode QR

Sebagai alternatif untuk menempelkan `AppID:AppSecret` secara manual, engine mendukung alur onboarding kode QR untuk menautkan QQ Bot ke OpenClaw:

1. Jalankan jalur penyiapan QQ Bot (misalnya `openclaw channels add --channel qqbot`) dan pilih alur kode QR saat diminta.
2. Pindai kode QR yang dihasilkan dengan aplikasi ponsel yang terhubung ke QQ Bot target.
3. Setujui pemasangan di ponsel. OpenClaw menyimpan kredensial yang dikembalikan ke `credentials/` di bawah cakupan akun yang benar.

Prompt persetujuan yang dibuat oleh bot itu sendiri (misalnya, alur "izinkan tindakan ini?" yang diekspos oleh QQ Bot API) muncul sebagai prompt OpenClaw native yang dapat Anda terima dengan `/bot-approve`, bukan membalas melalui klien QQ mentah.

## Pemecahan masalah

- **Bot membalas "pergi ke Mars":** kredensial belum dikonfigurasi atau Gateway belum dimulai.
- **Tidak ada pesan masuk:** verifikasi bahwa `appId` dan `clientSecret` sudah benar, dan
  bot diaktifkan di QQ Open Platform.
- **Balasan mandiri berulang:** OpenClaw mencatat indeks referensi keluar QQ sebagai
  dibuat oleh bot dan mengabaikan peristiwa masuk yang `msgIdx` saat ini cocok dengan
  akun bot yang sama. Ini mencegah loop gema platform sambil tetap memungkinkan pengguna
  mengutip atau membalas pesan bot sebelumnya.
- **Penyiapan dengan `--token-file` masih menampilkan belum dikonfigurasi:** `--token-file` hanya mengatur
  AppSecret. Anda masih memerlukan `appId` di konfigurasi atau `QQBOT_APP_ID`.
- **Pesan proaktif tidak diterima:** QQ dapat mencegat pesan yang dimulai oleh bot jika
  pengguna belum berinteraksi baru-baru ini.
- **Suara tidak ditranskripsikan:** pastikan STT dikonfigurasi dan penyedia dapat dijangkau.

## Terkait

- [Pemasangan](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Pemecahan masalah channel](/id/channels/troubleshooting)
