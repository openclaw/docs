---
read_when:
    - Transport channel menunjukkan terhubung tetapi balasan gagal
    - Anda memerlukan pemeriksaan khusus channel sebelum dokumentasi provider yang lebih mendalam
summary: Pemecahan masalah level channel dengan cepat menggunakan signature kegagalan dan perbaikan per channel
title: Channel Troubleshooting
x-i18n:
    generated_at: "2026-04-05T13:44:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45d8220505ea420d970b20bc66e65216c2d7024b5736db1936421ffc0676e1f
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Pemecahan masalah channel

Gunakan halaman ini saat sebuah channel terhubung tetapi perilakunya salah.

## Urutan perintah

Jalankan ini terlebih dahulu secara berurutan:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Baseline sehat:

- `Runtime: running`
- `RPC probe: ok`
- Probe channel menunjukkan transport terhubung dan, jika didukung, `works` atau `audit ok`

## WhatsApp

### Signature kegagalan WhatsApp

| Gejala                        | Pemeriksaan tercepat                               | Perbaikan                                               |
| ----------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| Terhubung tetapi tidak ada balasan DM | `openclaw pairing list whatsapp`                    | Setujui pengirim atau ubah kebijakan/allowlist DM.      |
| Pesan grup diabaikan          | Periksa `requireMention` + pola mention di konfigurasi | Mention bot atau longgarkan kebijakan mention untuk grup itu. |
| Putus sambung acak/loop login ulang | `openclaw channels status --probe` + log           | Login ulang dan verifikasi direktori kredensial sehat.  |

Pemecahan masalah lengkap: [/channels/whatsapp#troubleshooting](/channels/whatsapp#troubleshooting)

## Telegram

### Signature kegagalan Telegram

| Gejala                              | Pemeriksaan tercepat                          | Perbaikan                                                                   |
| ----------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| `/start` tetapi tidak ada alur balasan yang dapat digunakan | `openclaw pairing list telegram`                | Setujui pairing atau ubah kebijakan DM.                                     |
| Bot online tetapi grup tetap diam   | Verifikasi persyaratan mention dan mode privasi bot | Nonaktifkan mode privasi untuk visibilitas grup atau mention bot.           |
| Kegagalan kirim dengan kesalahan jaringan | Periksa log untuk kegagalan panggilan Telegram API | Perbaiki routing DNS/IPv6/proxy ke `api.telegram.org`.                      |
| `setMyCommands` ditolak saat startup | Periksa log untuk `BOT_COMMANDS_TOO_MUCH`        | Kurangi perintah Telegram plugin/Skills/kustom atau nonaktifkan menu native. |
| Sudah upgrade dan allowlist memblokir Anda | `openclaw security audit` dan allowlist konfigurasi | Jalankan `openclaw doctor --fix` atau ganti `@username` dengan ID pengirim numerik. |

Pemecahan masalah lengkap: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Signature kegagalan Discord

| Gejala                        | Pemeriksaan tercepat              | Perbaikan                                                 |
| ----------------------------- | --------------------------------- | --------------------------------------------------------- |
| Bot online tetapi tidak ada balasan guild | `openclaw channels status --probe`  | Izinkan guild/channel dan verifikasi message content intent. |
| Pesan grup diabaikan          | Periksa log untuk drop mention gating | Mention bot atau setel guild/channel `requireMention: false`. |
| Balasan DM tidak ada          | `openclaw pairing list discord`     | Setujui pairing DM atau sesuaikan kebijakan DM.           |

Pemecahan masalah lengkap: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Signature kegagalan Slack

| Gejala                                 | Pemeriksaan tercepat                    | Perbaikan                                                                                                                                            |
| -------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode terhubung tetapi tidak ada respons | `openclaw channels status --probe`        | Verifikasi app token + bot token dan scope yang diperlukan; perhatikan `botTokenStatus` / `appTokenStatus = configured_unavailable` pada penyiapan berbasis SecretRef. |
| DM diblokir                            | `openclaw pairing list slack`             | Setujui pairing atau longgarkan kebijakan DM.                                                                                                        |
| Pesan channel diabaikan                | Periksa `groupPolicy` dan allowlist channel | Izinkan channel atau ubah kebijakan menjadi `open`.                                                                                                  |

Pemecahan masalah lengkap: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage dan BlueBubbles

### Signature kegagalan iMessage dan BlueBubbles

| Gejala                         | Pemeriksaan tercepat                                                      | Perbaikan                                             |
| ------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Tidak ada event masuk          | Verifikasi keterjangkauan webhook/server dan izin aplikasi                | Perbaiki URL webhook atau status server BlueBubbles.  |
| Bisa mengirim tetapi tidak menerima di macOS | Periksa izin privasi macOS untuk otomasi Messages                 | Berikan ulang izin TCC dan restart proses channel.    |
| Pengirim DM diblokir           | `openclaw pairing list imessage` atau `openclaw pairing list bluebubbles` | Setujui pairing atau perbarui allowlist.              |

Pemecahan masalah lengkap:

- [/channels/imessage#troubleshooting](/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Signature kegagalan Signal

| Gejala                        | Pemeriksaan tercepat                     | Perbaikan                                                |
| ----------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| Daemon dapat dijangkau tetapi bot diam | `openclaw channels status --probe`         | Verifikasi URL/akun daemon `signal-cli` dan mode receive. |
| DM diblokir                   | `openclaw pairing list signal`             | Setujui pengirim atau sesuaikan kebijakan DM.            |
| Balasan grup tidak terpicu    | Periksa allowlist grup dan pola mention  | Tambahkan pengirim/grup atau longgarkan gating.          |

Pemecahan masalah lengkap: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## QQ Bot

### Signature kegagalan QQ Bot

| Gejala                        | Pemeriksaan tercepat                              | Perbaikan                                                        |
| ----------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| Bot membalas "gone to Mars"   | Verifikasi `appId` dan `clientSecret` di konfigurasi | Setel kredensial atau restart gateway.                           |
| Tidak ada pesan masuk         | `openclaw channels status --probe`                 | Verifikasi kredensial di QQ Open Platform.                       |
| Suara tidak ditranskripsikan  | Periksa konfigurasi provider STT                  | Konfigurasikan `channels.qqbot.stt` atau `tools.media.audio`.    |
| Pesan proaktif tidak sampai   | Periksa persyaratan interaksi platform QQ         | QQ mungkin memblokir pesan yang diprakarsai bot tanpa interaksi baru-baru ini. |

Pemecahan masalah lengkap: [/channels/qqbot#troubleshooting](/channels/qqbot#troubleshooting)

## Matrix

### Signature kegagalan Matrix

| Gejala                              | Pemeriksaan tercepat                  | Perbaikan                                                                 |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| Sudah login tetapi mengabaikan pesan room | `openclaw channels status --probe`     | Periksa `groupPolicy`, allowlist room, dan mention gating.                |
| DM tidak diproses                   | `openclaw pairing list matrix`         | Setujui pengirim atau sesuaikan kebijakan DM.                             |
| Room terenkripsi gagal              | `openclaw matrix verify status`        | Verifikasi ulang device, lalu periksa `openclaw matrix verify backup status`. |
| Pemulihan backup tertunda/rusak     | `openclaw matrix verify backup status` | Jalankan `openclaw matrix verify backup restore` atau jalankan ulang dengan recovery key. |
| Cross-signing/bootstrap tampak salah | `openclaw matrix verify bootstrap`     | Perbaiki status secret storage, cross-signing, dan backup dalam satu langkah. |

Penyiapan dan konfigurasi lengkap: [Matrix](/channels/matrix)
