---
read_when:
    - Anda ingin menghubungkan OpenClaw ke QQ
    - Anda perlu menyiapkan kredensial QQ Bot
    - Anda menginginkan dukungan obrolan grup atau pribadi QQ Bot
summary: Penyiapan, konfigurasi, dan penggunaan QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-07-19T04:50:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0bc41f915707f1367e69eaae86ade03c742fbc8fdf6855d2b6094ce05009a903
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot terhubung ke OpenClaw melalui QQ Bot API resmi (Gateway WebSocket).
Chat pribadi C2C dan penyebutan `@` dalam grup adalah jenis chat utama, dengan media
lengkap (gambar, suara, video, file). Pesan kanal guild didukung hanya untuk
teks dan gambar URL jarak jauh; unggahan suara, video, file, serta gambar
lokal/Base64 tidak tersedia di kanal guild. Reaksi dan utas tidak didukung
di mana pun.

Status: plugin resmi yang dapat diunduh.

## Instalasi

```bash
openclaw plugins install @openclaw/qqbot
```

## Penyiapan

1. Buka [QQ Open Platform](https://q.qq.com/) dan pindai kode QR dengan QQ di
   ponsel Anda untuk mendaftar / masuk.
2. Klik **Create Bot** untuk membuat bot QQ baru.
3. Temukan **AppID** dan **AppSecret** pada halaman pengaturan bot lalu salin keduanya.

<Note>
AppSecret tidak disimpan sebagai teks biasa. Jika Anda meninggalkan halaman tanpa menyimpannya, Anda harus membuat ulang yang baru.
</Note>

4. Tambahkan kanal:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Mulai ulang Gateway.

## Ketahanan pesan masuk

Untuk peristiwa giliran Gateway QQ, OpenClaw mempertahankan peristiwa mentah sebelum memajukan urutan resume Gateway yang tersimpan. Giliran yang tertunda atau dapat dicoba ulang tetap bertahan setelah Gateway dimulai ulang, tetap diserialkan per percakapan, dan menggunakan ID peristiwa penyedia untuk mencegah entri antrean duplikat selama catatan penyelesaian aktif atau yang dipertahankan masih ada.

Jika penerimaan persisten gagal, OpenClaw memutus soket Gateway saat ini tanpa memajukan urutan. Jalur penyambungan kembali/resume kemudian dapat meminta kembali peristiwa yang belum dikomit. Pengiriman tetap dilakukan setidaknya satu kali melintasi batas antrean-ke-agen, sehingga crash saat serah terima dapat memutar ulang suatu giliran.

Penyiapan interaktif:

```bash
openclaw channels add
```

Wizard juga menawarkan pengikatan kode QR sebagai alternatif untuk mengetik AppID/AppSecret
secara manual: pindai kode dengan aplikasi ponsel yang ditautkan ke QQ Bot target untuk menyelesaikan
pengikatan. OpenClaw mempertahankan kredensial yang dikembalikan dalam cakupan konfigurasi
akun.

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

Variabel lingkungan akun default (hanya akun tingkat teratas):

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

AppSecret SecretRef lingkungan:

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

- `openclaw channels add --channel qqbot --token-file ...` hanya menetapkan AppSecret;
  `appId` harus sudah ditetapkan dalam konfigurasi atau `QQBOT_APP_ID`.
- `clientSecret` menerima string teks biasa, jalur file (`clientSecretFile`),
  atau objek SecretRef terstruktur.
- String penanda lama `secretref:...` / `secretref-env:...` ditolak untuk
  `clientSecret`; gunakan objek SecretRef terstruktur sebagai gantinya.

### Streaming

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // streaming blok: "partial" (default) atau "off"
        nativeTransport: true, // gunakan API stream_messages C2C resmi QQ untuk DM
      },
    },
  },
}
```

- `streaming.mode: "off"` menonaktifkan streaming blok untuk akun.
- `streaming.nativeTransport: true` melakukan streaming balasan C2C (DM) melalui
  API resmi `stream_messages` milik QQ; target grup/kanal tidak terpengaruh.
- Skalar lama `streaming: true|false` dan kunci `streaming.c2cStreamApi`
  dimigrasikan ke bentuk ini melalui `openclaw doctor --fix`.
- `/bot-streaming on|off` mengaktifkan atau menonaktifkan konfigurasi yang sama dari DM.

### Kebijakan akses

- `allowFrom` / `groupAllowFrom` membatasi siapa yang dapat mengobrol dengan bot dalam konteks C2C /
  grup. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  mengontrol mode penerapan. `dmPolicy` ditetapkan secara default ke `allowlist` setelah
  `allowFrom` memiliki entri konkret (bukan wildcard), jika tidak maka `open`.
  `groupPolicy` ditetapkan secara default ke `allowlist` setelah `groupAllowFrom` atau
  `allowFrom` memiliki entri konkret, jika tidak maka `open`.
- Perintah garis miring "Auth: allowlist" memerlukan entri eksplisit bukan wildcard dalam
  `allowFrom` (atau `groupAllowFrom` untuk pemanggilan grup), terlepas dari
  `dmPolicy` / `groupPolicy` — lihat [Perintah garis miring](#slash-commands).

### Penyiapan multiakun

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

Setiap akun memiliki koneksi WebSocket, klien API, dan cache token
yang terisolasi, dengan kunci `appId`. Baris log diberi tag ID akun pemilik agar
diagnostik tetap dapat dipisahkan saat Anda menjalankan beberapa bot dalam satu Gateway.

Tambahkan bot kedua melalui CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chat grup

Dukungan grup menggunakan OpenID grup QQ, bukan nama tampilan. Tambahkan bot ke
grup, lalu sebut bot tersebut atau konfigurasikan grup agar berjalan tanpa penyebutan.

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
          prompt: "Buat balasan tetap singkat dan operasional.",
        },
      },
    },
  },
}
```

`groups["*"]` menetapkan default untuk setiap grup; entri konkret `groups.GROUP_OPENID`
menggantikan default tersebut untuk satu grup. Pengaturan grup:

| Bidang                | Default          | Deskripsi                                                                                          |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Memerlukan penyebutan `@` sebelum bot membalas.                                                    |
| `commandLevel`        | `all`            | Perintah garis miring bawaan yang dapat dijalankan dalam grup (lihat di bawah).                    |
| `ignoreOtherMentions` | `false`          | Mengabaikan pesan yang menyebut orang lain tetapi tidak menyebut bot.                              |
| `historyLimit`        | `50`             | Pesan terbaru tanpa penyebutan yang disimpan sebagai konteks untuk giliran berikutnya yang menyebut bot. `0` menonaktifkan riwayat. |
| `tools`               | —                | Mengizinkan/menolak alat untuk seluruh grup.                                                       |
| `toolsBySender`       | —                | Penggantian alat per pengirim; lihat [Grup](/id/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefiks openid   | Label ramah yang digunakan dalam log dan konteks grup.                                             |
| `prompt`              | default bawaan   | Prompt perilaku per grup yang ditambahkan ke konteks agen.                                         |

`commandLevel` menerima:

| Tingkat  | Perilaku                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Perintah bawaan yang ada tetap tersedia. Beberapa tetap disembunyikan dari menu, tetapi pengguna yang diotorisasi masih dapat menjalankannya dalam grup. |
| `safety` | `/help`, `/btw`, `/stop` tetap terlihat dalam grup; perintah sensitif (`/config`, `/tools`, `/bash`, dan lainnya) harus dijalankan dalam chat pribadi. |
| `strict` | Hanya kontrol sesi grup yang diperlukan untuk operasi ketat yang diizinkan. `/stop` tetap berfungsi agar pengirim yang diotorisasi dapat menghentikan proses aktif. |

Entri QQBot lama `toolPolicy` telah dihentikan. Jalankan `openclaw doctor --fix` untuk memigrasikannya ke `tools`.

Mode aktivasi adalah `mention` dan `always`. `requireMention: true` dipetakan ke
`mention`; `requireMention: false` dipetakan ke `always`. Penggantian aktivasi tingkat sesi,
jika ada, lebih diutamakan daripada konfigurasi.

Antrean pesan masuk dibuat per peer. Peer grup mendapatkan batas antrean yang lebih besar (50 dibandingkan 20
untuk peer langsung), mengeluarkan pesan buatan bot sebelum pesan manusia saat penuh,
dan menggabungkan rentetan pesan grup normal menjadi satu giliran beratribusi. Perintah garis
miring dijalankan satu per satu, terlepas dari batch penggabungan apa pun.

### Suara (STT / TTS)

STT dan TTS mendukung konfigurasi dua tingkat dengan fallback prioritas:

| Pengaturan | Khusus plugin                                             | Fallback kerangka kerja         |
| ---------- | -------------------------------------------------------- | ------------------------------- |
| STT        | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
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

Tetapkan `enabled: false` pada salah satunya untuk menonaktifkannya. Penggantian TTS tingkat akun menggunakan
bentuk yang sama seperti `messages.tts` dan digabungkan secara mendalam di atas konfigurasi TTS kanal/global.

Permintaan STT mengalami batas waktu setelah 60 detik secara default. STT khusus plugin menggunakan
penggantian `models.providers.<id>.timeoutSeconds` yang dipilih. STT audio kerangka kerja
menggunakan `tools.media.audio.models[0].timeoutSeconds`, kemudian
`tools.media.audio.timeoutSeconds`, lalu penggantian penyedia yang dipilih.

Lampiran suara QQ yang masuk diekspos kepada agen sebagai metadata media audio
sembari menjaga file suara mentah tetap berada di luar `MediaPaths` generik. `[[audio_as_voice]]`
dalam balasan teks biasa menyintesis TTS dan mengirim pesan suara QQ native saat
TTS dikonfigurasi.

Perilaku unggah/transkode audio keluar juga dapat disesuaikan dengan
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Format target

| Format                     | Deskripsi          |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat pribadi (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat grup           |
| `qqbot:channel:CHANNEL_ID` | Kanal guild         |

<Note>
Setiap bot memiliki kumpulan OpenID penggunanya sendiri. OpenID yang diterima oleh Bot A **tidak dapat** digunakan untuk mengirim pesan melalui Bot B.
</Note>

## Perintah garis miring

Perintah bawaan yang dicegat sebelum antrean AI:

| Perintah              | Autentikasi | Cakupan      | Deskripsi                                                                      |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | apa pun      | Uji latensi                                                                    |
| `/bot-help`          | —         | apa pun      | Cantumkan semua perintah                                                       |
| `/bot-me`            | —         | hanya privat | Tampilkan ID pengguna QQ pengirim (openid) untuk penyiapan `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —         | hanya privat | Tampilkan versi kerangka kerja OpenClaw dan versi plugin                       |
| `/bot-upgrade`       | —         | hanya privat | Tampilkan tautan panduan peningkatan QQBot                                     |
| `/bot-approve`       | daftar izin | hanya privat | Kelola konfigurasi persetujuan eksekusi perintah (aktif / nonaktif / selalu / atur ulang / status) |
| `/bot-logs`          | daftar izin | hanya privat | Ekspor log Gateway terbaru sebagai berkas                                      |
| `/bot-clear-storage` | daftar izin | hanya privat | Hapus unduhan yang di-cache di direktori media QQBot                           |
| `/bot-streaming`     | daftar izin | hanya privat | Aktifkan atau nonaktifkan balasan streaming C2C                                |
| `/bot-group-allways` | daftar izin | hanya privat | Alihkan mode aktivasi grup default (wajib menyebut vs. selalu aktif)            |

Tambahkan `?` ke perintah apa pun untuk mendapatkan bantuan penggunaan (misalnya `/bot-upgrade ?`).

Perintah "Autentikasi: daftar izin" juga mengharuskan openid pengirim tercantum dalam
daftar `allowFrom` eksplisit tanpa karakter pengganti (`groupAllowFrom` diprioritaskan untuk
perintah yang diberikan dari grup, dengan fallback ke `allowFrom`). Karakter pengganti
`allowFrom: ["*"]` mengizinkan percakapan, tetapi tidak mengizinkan perintah ini. Menjalankan salah satunya
di luar percakapan privat atau tanpa otorisasi akan menampilkan petunjuk, bukan
mengabaikan pesan secara diam-diam.

`/bot-me`, `/bot-version`, dan `/bot-upgrade` hanya dapat digunakan dalam percakapan privat, tetapi tidak
memerlukan daftar izin — setiap pengirim C2C dapat menjalankannya.

Saat persetujuan eksekusi QQ Bot menggunakan fallback percakapan yang sama secara default, klik tombol
persetujuan native mengikuti daftar izin perintah eksplisit tanpa karakter pengganti yang sama. Untuk
memberikan akses khusus persetujuan tanpa akses perintah yang lebih luas, konfigurasikan
`channels.qqbot.execApprovals.approvers`. Persetujuan eksekusi native diaktifkan secara
default.

## Media dan penyimpanan

- Media masuk, keluar, dan jembatan Gateway berbagi satu root payload di bawah
  `~/.openclaw/media/qqbot` (mengikuti `OPENCLAW_HOME` jika ditetapkan), sehingga unggahan,
  unduhan, dan cache transkode tetap berada di dalam satu direktori yang terlindungi.
- Pengiriman media kaya untuk target C2C dan grup melewati satu jalur `sendMedia`.
  Berkas lokal dan buffer dalam memori sebesar 5&nbsp;MiB atau lebih menggunakan endpoint
  unggahan bertahap QQ; payload yang lebih kecil serta sumber URL jarak jauh/Base64 menggunakan
  API unggahan sekali jalan.
- Jika peningkatan langsung menginterupsi Gateway sebelum selesai menulis
  `openclaw.json`, plugin memulihkan `appId` / `clientSecret` terakhir yang diketahui
  untuk akun tersebut dari snapshot internal saat dimulai berikutnya (tanpa pernah
  menimpa perubahan konfigurasi yang disengaja), sehingga pemindaian ulang kode QR tidak
  diperlukan.

## Pemecahan masalah

- **Gateway tidak dimulai / tidak ada pesan masuk:** pastikan `appId` dan
  `clientSecret` sudah benar dan bot diaktifkan di QQ Open Platform.
  Kredensial yang tidak ada ditampilkan sebagai "QQBot belum dikonfigurasi (appId atau
  clientSecret tidak ada)".
- **Penyiapan dengan `--token-file` masih menunjukkan belum dikonfigurasi:** `--token-file` hanya
  menetapkan AppSecret. `appId` tetap harus ditetapkan dalam konfigurasi atau `QQBOT_APP_ID`.
- **Balasan grup bertubi-tubi bertabrakan:** antrean masuk mengeluarkan pesan yang dibuat bot
  sebelum pesan manusia ketika antrean rekan penuh, dan menggabungkan
  rentetan pesan grup normal (bukan perintah) menjadi satu giliran dengan atribusi, sehingga
  banjir percakapan bot tidak akan menghambat pesan manusia.
- **Pesan proaktif tidak diterima:** QQ mungkin memblokir pesan yang dimulai bot jika
  pengguna tidak berinteraksi baru-baru ini.
- **Suara tidak ditranskripsikan:** pastikan STT dikonfigurasi dan penyedia
  dapat dijangkau.

## Terkait

- [Pemasangan](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Pemecahan masalah saluran](/id/channels/troubleshooting)
