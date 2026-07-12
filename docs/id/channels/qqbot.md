---
read_when:
    - Anda ingin menghubungkan OpenClaw ke QQ
    - Anda perlu menyiapkan kredensial QQ Bot
    - Anda menginginkan dukungan obrolan grup atau pribadi QQ Bot
summary: Penyiapan, konfigurasi, dan penggunaan QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-07-12T14:01:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot terhubung ke OpenClaw melalui API QQ Bot resmi (Gateway WebSocket).
Chat privat C2C dan sebutan `@` dalam grup merupakan jenis chat utama, dengan media
kaya (gambar, suara, video, berkas). Pesan saluran guild hanya mendukung teks
dan gambar dari URL jarak jauh; suara, video, unggahan berkas, serta gambar
lokal/Base64 tidak tersedia di saluran guild. Reaksi dan utas tidak didukung
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
3. Temukan **AppID** dan **AppSecret** di halaman pengaturan bot, lalu salin keduanya.

<Note>
AppSecret tidak disimpan sebagai teks biasa. Jika Anda meninggalkan halaman tanpa menyimpannya, Anda harus membuat ulang yang baru.
</Note>

4. Tambahkan saluran:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Mulai ulang Gateway.

Penyiapan interaktif:

```bash
openclaw channels add
```

Wizard juga menawarkan pengaitan melalui kode QR sebagai alternatif untuk
mengetik AppID/AppSecret secara manual: pindai kode dengan aplikasi ponsel yang
terhubung ke QQ Bot target untuk menyelesaikan pengaitan. OpenClaw menyimpan
kredensial yang dikembalikan dalam cakupan konfigurasi akun.

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

Variabel lingkungan akun default (khusus akun tingkat teratas):

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret berbasis berkas:

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

AppSecret SecretRef dari lingkungan:

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

- `openclaw channels add --channel qqbot --token-file ...` hanya menetapkan
  AppSecret; `appId` harus sudah ditetapkan dalam konfigurasi atau `QQBOT_APP_ID`.
- `clientSecret` menerima string teks biasa, jalur berkas (`clientSecretFile`),
  atau objek SecretRef terstruktur.
- String penanda lama `secretref:...` / `secretref-env:...` ditolak untuk
  `clientSecret`; gunakan objek SecretRef terstruktur sebagai gantinya.

### Kebijakan akses

- `allowFrom` / `groupAllowFrom` membatasi siapa yang dapat mengobrol dengan bot
  dalam konteks C2C / grup. `dmPolicy` / `groupPolicy` (`open` | `allowlist` |
  `disabled`) mengendalikan mode penerapan. `dmPolicy` secara default menjadi
  `allowlist` setelah `allowFrom` memiliki entri konkret (bukan wildcard);
  jika tidak, nilainya `open`. `groupPolicy` secara default menjadi `allowlist`
  setelah `groupAllowFrom` atau `allowFrom` memiliki entri konkret; jika tidak,
  nilainya `open`.
- Perintah garis miring dengan "Autorisasi: daftar izin" memerlukan entri
  eksplisit bukan wildcard dalam `allowFrom` (atau `groupAllowFrom` untuk
  pemanggilan dari grup), terlepas dari `dmPolicy` / `groupPolicy` — lihat
  [Perintah garis miring](#slash-commands).

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

Setiap akun memiliki koneksi WebSocket, klien API, dan cache token yang
terisolasi, dengan kunci `appId`. Baris log diberi tag ID akun pemilik agar
diagnostik tetap dapat dipisahkan saat Anda menjalankan beberapa bot dalam satu
Gateway.

Tambahkan bot kedua melalui CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chat grup

Dukungan grup menggunakan OpenID grup QQ, bukan nama tampilan. Tambahkan bot ke
grup, lalu sebut bot tersebut atau konfigurasikan grup agar berjalan tanpa
sebutan.

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

`groups["*"]` menetapkan nilai default untuk setiap grup; entri konkret
`groups.GROUP_OPENID` menimpa nilai default tersebut untuk satu grup.
Pengaturan grup:

| Bidang                | Default          | Deskripsi                                                                                                 |
| --------------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Mengharuskan sebutan `@` sebelum bot merespons.                                                           |
| `commandLevel`        | `all`            | Menentukan perintah garis miring bawaan yang dapat dijalankan dalam grup (lihat di bawah).                |
| `ignoreOtherMentions` | `false`          | Mengabaikan pesan yang menyebut orang lain, tetapi tidak menyebut bot.                                    |
| `historyLimit`        | `50`             | Pesan terbaru tanpa sebutan yang disimpan sebagai konteks untuk giliran berikutnya yang menyebut bot. `0` menonaktifkan riwayat. |
| `tools`               | —                | Mengizinkan/menolak alat untuk seluruh grup.                                                              |
| `toolsBySender`       | —                | Penimpaan alat per pengirim; lihat [Grup](/id/channels/groups#groupchannel-tool-restrictions-optional).      |
| `name`                | awalan openid     | Label ramah yang digunakan dalam log dan konteks grup.                                                    |
| `prompt`              | default bawaan   | Prompt perilaku per grup yang ditambahkan ke konteks agen.                                               |

`commandLevel` menerima:

| Tingkat  | Perilaku                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Perintah bawaan yang ada tetap tersedia. Sebagian tetap tersembunyi dari menu, tetapi pengguna yang berwenang masih dapat menjalankannya dalam grup.       |
| `safety` | `/help`, `/btw`, `/stop` tetap terlihat dalam grup; perintah sensitif (`/config`, `/tools`, `/bash`, dan lain-lain) harus dijalankan dalam chat privat.    |
| `strict` | Hanya kontrol sesi grup yang diperlukan untuk operasi ketat yang diizinkan. `/stop` tetap berfungsi agar pengirim yang berwenang dapat menghentikan proses aktif. |

Entri `toolPolicy` QQBot lama telah dihentikan. Jalankan `openclaw doctor --fix`
untuk memigrasikannya ke `tools`.

Mode aktivasi adalah `mention` dan `always`. `requireMention: true` dipetakan ke
`mention`; `requireMention: false` dipetakan ke `always`. Penimpaan aktivasi
tingkat sesi, jika ada, lebih diprioritaskan daripada konfigurasi.

Antrean masuk dibuat per rekan. Rekan grup mendapatkan batas antrean yang lebih
besar (50 dibandingkan 20 untuk rekan langsung), mengeluarkan pesan buatan bot
sebelum pesan manusia ketika penuh, dan menggabungkan rangkaian pesan grup biasa
menjadi satu giliran dengan atribusi. Perintah garis miring dijalankan satu per
satu, terpisah dari kelompok penggabungan apa pun.

### Suara (STT / TTS)

STT dan TTS mendukung konfigurasi dua tingkat dengan fallback berdasarkan
prioritas:

| Pengaturan | Khusus Plugin                                             | Fallback kerangka kerja        |
| ---------- | --------------------------------------------------------- | ------------------------------ |
| STT        | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]`  |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`  | `messages.tts`                 |

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

Tetapkan `enabled: false` pada salah satunya untuk menonaktifkannya. Penimpaan
TTS tingkat akun menggunakan bentuk yang sama dengan `messages.tts` dan
digabungkan secara mendalam di atas konfigurasi TTS saluran/global.

Permintaan STT secara default mengalami batas waktu setelah 60 detik. STT khusus
Plugin menggunakan penimpaan `models.providers.<id>.timeoutSeconds` yang
dipilih. STT audio kerangka kerja menggunakan
`tools.media.audio.models[0].timeoutSeconds`, lalu
`tools.media.audio.timeoutSeconds`, kemudian penimpaan penyedia yang dipilih.

Lampiran suara QQ yang masuk diekspos kepada agen sebagai metadata media audio,
sementara berkas suara mentah tidak dimasukkan ke dalam `MediaPaths` generik.
`[[audio_as_voice]]` dalam balasan teks biasa menyintesis TTS dan mengirim pesan
suara QQ asli ketika TTS dikonfigurasi.

Perilaku unggah/transkode audio keluar juga dapat disesuaikan dengan
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Format target

| Format                     | Deskripsi          |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privat (C2C)  |
| `qqbot:group:GROUP_OPENID` | Chat grup          |
| `qqbot:channel:CHANNEL_ID` | Saluran guild      |

<Note>
Setiap bot memiliki kumpulan OpenID pengguna sendiri. OpenID yang diterima oleh Bot A **tidak dapat** digunakan untuk mengirim pesan melalui Bot B.
</Note>

## Perintah garis miring

Perintah bawaan yang dicegat sebelum antrean AI:

| Perintah             | Autorisasi  | Cakupan            | Deskripsi                                                                                      |
| -------------------- | ----------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| `/bot-ping`          | —           | apa pun            | Uji latensi                                                                                    |
| `/bot-help`          | —           | apa pun            | Mencantumkan semua perintah                                                                    |
| `/bot-me`            | —           | hanya privat       | Menampilkan ID pengguna QQ pengirim (openid) untuk penyiapan `allowFrom` / `groupAllowFrom`    |
| `/bot-version`       | —           | hanya privat       | Menampilkan versi kerangka kerja OpenClaw dan versi plugin                                     |
| `/bot-upgrade`       | —           | hanya privat       | Menampilkan tautan panduan peningkatan QQBot                                                   |
| `/bot-approve`       | daftar izin | hanya privat       | Mengelola konfigurasi persetujuan eksekusi perintah (aktif / nonaktif / selalu / atur ulang / status) |
| `/bot-logs`          | daftar izin | hanya privat       | Mengekspor log Gateway terbaru sebagai berkas                                                  |
| `/bot-clear-storage` | daftar izin | hanya privat       | Menghapus unduhan yang di-cache di direktori media QQBot                                       |
| `/bot-streaming`     | daftar izin | hanya privat       | Mengaktifkan atau menonaktifkan balasan streaming C2C                                          |
| `/bot-group-allways` | daftar izin | hanya privat       | Mengalihkan mode aktivasi grup default (wajib sebutan atau selalu aktif)                        |

Tambahkan `?` ke perintah apa pun untuk mendapatkan bantuan penggunaan
(misalnya `/bot-upgrade ?`).

Perintah dengan "Autorisasi: daftar izin" juga mengharuskan openid pengirim
tercantum dalam daftar `allowFrom` eksplisit bukan wildcard
(`groupAllowFrom` lebih diprioritaskan untuk perintah yang dikeluarkan dari
grup, dengan fallback ke `allowFrom`). Wildcard `allowFrom: ["*"]` mengizinkan
chat, tetapi tidak mengizinkan perintah-perintah ini. Menjalankan salah satunya
di luar chat privat atau tanpa otorisasi akan mengembalikan petunjuk, bukan
mengabaikan pesan secara diam-diam.

`/bot-me`, `/bot-version`, dan `/bot-upgrade` hanya tersedia untuk percakapan privat, tetapi tidak
memerlukan daftar izin — pengirim C2C mana pun dapat menjalankannya.

Saat persetujuan eksekusi QQ Bot menggunakan fallback percakapan yang sama secara default, klik tombol
persetujuan native mengikuti daftar izin perintah eksplisit tanpa wildcard yang sama. Untuk
memberikan akses khusus persetujuan tanpa akses perintah yang lebih luas, konfigurasikan
`channels.qqbot.execApprovals.approvers`. Persetujuan eksekusi native diaktifkan secara
default.

## Media dan penyimpanan

- Media masuk, keluar, dan jembatan Gateway menggunakan satu direktori akar payload bersama di bawah
  `~/.openclaw/media/qqbot` (mengikuti `OPENCLAW_HOME` jika ditetapkan), sehingga unggahan,
  unduhan, dan cache transkode tetap berada dalam satu direktori yang terlindungi.
- Pengiriman media kaya untuk target C2C dan grup melewati satu jalur `sendMedia`.
  Berkas lokal dan buffer dalam memori berukuran 5&nbsp;MiB atau lebih menggunakan endpoint
  unggahan bertahap QQ; payload yang lebih kecil dan sumber URL jarak jauh/Base64 menggunakan
  API unggahan sekali jalan.
- Jika pemutakhiran langsung menginterupsi Gateway sebelum selesai menulis
  `openclaw.json`, Plugin memulihkan `appId` / `clientSecret` terakhir yang diketahui
  untuk akun tersebut dari snapshot internal pada proses mulai berikutnya (tanpa pernah
  menimpa perubahan konfigurasi yang disengaja), sehingga pemindaian ulang kode QR tidak
  diperlukan.

## Pemecahan masalah

- **Gateway tidak dimulai / tidak ada pesan masuk:** pastikan `appId` dan
  `clientSecret` sudah benar serta bot diaktifkan di QQ Open Platform.
  Kredensial yang tidak ada ditampilkan sebagai "QQBot belum dikonfigurasi (`appId` atau
  `clientSecret` tidak ada)".
- **Penyiapan dengan `--token-file` masih ditampilkan sebagai belum dikonfigurasi:** `--token-file` hanya
  menetapkan AppSecret. `appId` tetap harus ditetapkan dalam konfigurasi atau `QQBOT_APP_ID`.
- **Balasan grup beruntun saling bertabrakan:** antrean masuk mengeluarkan pesan yang dibuat bot
  sebelum pesan manusia ketika antrean rekan penuh, serta menggabungkan
  rentetan pesan grup normal (bukan perintah) menjadi satu giliran yang disertai atribusi, sehingga
  banjir percakapan bot tidak akan menghambat pesan manusia.
- **Pesan proaktif tidak diterima:** QQ dapat memblokir pesan yang dimulai oleh bot jika
  pengguna belum berinteraksi baru-baru ini.
- **Suara tidak ditranskripsikan:** pastikan STT telah dikonfigurasi dan penyedianya
  dapat dijangkau.

## Terkait

- [Pemasangan](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Pemecahan masalah saluran](/id/channels/troubleshooting)
