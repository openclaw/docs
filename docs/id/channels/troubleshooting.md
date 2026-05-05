---
read_when:
    - Transport saluran menunjukkan terhubung tetapi balasan gagal
    - Anda memerlukan pemeriksaan khusus saluran sebelum dokumentasi penyedia yang mendalam
summary: Pemecahan masalah cepat tingkat kanal dengan pola kegagalan dan perbaikan per kanal
title: Pemecahan masalah saluran
x-i18n:
    generated_at: "2026-05-05T08:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gunakan halaman ini ketika saluran tersambung tetapi perilakunya salah.

## Jenjang perintah

Jalankan ini secara berurutan terlebih dahulu:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Baseline sehat:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, atau `admin-capable`
- Probe saluran menampilkan transport tersambung dan, jika didukung, `works` atau `audit ok`

## WhatsApp

### Tanda kegagalan WhatsApp

| Gejala                              | Pemeriksaan tercepat                               | Perbaikan                                                                                                                        |
| ----------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Tersambung tetapi tidak ada balasan DM | `openclaw pairing list whatsapp`                 | Setujui pengirim atau ubah kebijakan/daftar izin DM.                                                                             |
| Pesan grup diabaikan                | Periksa `requireMention` + pola mention di config  | Mention bot atau longgarkan kebijakan mention untuk grup tersebut.                                                               |
| Login QR habis waktu dengan 408     | Periksa env `HTTPS_PROXY` / `HTTP_PROXY` Gateway   | Atur proxy yang dapat dijangkau; gunakan `NO_PROXY` hanya untuk bypass.                                                          |
| Loop putus sambung/login ulang acak | `openclaw channels status --probe` + log           | Reconnect terbaru ditandai meskipun saat ini tersambung; pantau log, mulai ulang Gateway, lalu tautkan ulang jika flapping berlanjut. |
| Balasan tiba terlambat detik/menit  | `openclaw doctor --fix`                            | Doctor menghentikan klien TUI lokal usang yang terverifikasi ketika klien tersebut menurunkan kinerja event loop Gateway.        |

Pemecahan masalah lengkap: [Pemecahan masalah WhatsApp](/id/channels/whatsapp#troubleshooting)

## Telegram

### Tanda kegagalan Telegram

| Gejala                                | Pemeriksaan tercepat                              | Perbaikan                                                                                                                        |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start` tetapi tidak ada alur balasan yang dapat digunakan | `openclaw pairing list telegram` | Setujui pairing atau ubah kebijakan DM.                                                                                         |
| Bot online tetapi grup tetap diam     | Verifikasi persyaratan mention dan mode privasi bot | Nonaktifkan mode privasi untuk visibilitas grup atau mention bot.                                                               |
| Kegagalan kirim dengan kesalahan jaringan | Periksa log untuk kegagalan panggilan API Telegram | Perbaiki routing DNS/IPv6/proxy ke `api.telegram.org`.                                                                          |
| Startup melaporkan `getMe returned 401` | Periksa sumber token yang dikonfigurasi          | Salin ulang atau buat ulang token BotFather dan perbarui `botToken`, `tokenFile`, atau `TELEGRAM_BOT_TOKEN` akun default.       |
| Polling macet atau reconnect lambat   | `openclaw logs --follow` untuk diagnostik polling | Upgrade; jika restart adalah positif palsu, sesuaikan `pollingStallThresholdMs`. Stall persisten tetap mengarah ke proxy/DNS/IPv6. |
| `setMyCommands` ditolak saat startup  | Periksa log untuk `BOT_COMMANDS_TOO_MUCH`         | Kurangi perintah plugin/skill/kustom Telegram atau nonaktifkan menu native.                                                      |
| Setelah upgrade, daftar izin memblokir Anda | `openclaw security audit` dan daftar izin config | Jalankan `openclaw doctor --fix` atau ganti `@username` dengan ID pengirim numerik.                                             |

Pemecahan masalah lengkap: [Pemecahan masalah Telegram](/id/channels/telegram#troubleshooting)

## Discord

### Tanda kegagalan Discord

| Gejala                                   | Pemeriksaan tercepat                                                   | Perbaikan                                                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online tetapi tidak ada balasan guild | `openclaw channels status --probe`                                     | Izinkan guild/saluran dan verifikasi message content intent.                                                                                                      |
| Pesan grup diabaikan                     | Periksa log untuk drop akibat gating mention                           | Mention bot atau atur `requireMention: false` pada guild/saluran.                                                                                                 |
| Ada penggunaan typing/token tetapi tidak ada pesan Discord | Log sesi menampilkan teks asisten dengan `didSendViaMessagingTool: false` | Model menjawab secara privat alih-alih memanggil message tool. Gunakan model yang andal untuk tool call, atau atur `messages.groupChat.visibleReplies: "automatic"` agar memposting otomatis. |
| Balasan DM hilang                        | `openclaw pairing list discord`                                        | Setujui pairing DM atau sesuaikan kebijakan DM.                                                                                                                   |

Pemecahan masalah lengkap: [Pemecahan masalah Discord](/id/channels/discord#troubleshooting)

## Slack

### Tanda kegagalan Slack

| Gejala                                 | Pemeriksaan tercepat                      | Perbaikan                                                                                                                                          |
| -------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode tersambung tetapi tidak ada respons | `openclaw channels status --probe` | Verifikasi app token + bot token dan scope yang diperlukan; pantau `botTokenStatus` / `appTokenStatus = configured_unavailable` pada setup berbasis SecretRef. |
| DM diblokir                            | `openclaw pairing list slack`             | Setujui pairing atau longgarkan kebijakan DM.                                                                                                      |
| Pesan saluran diabaikan                | Periksa `groupPolicy` dan daftar izin saluran | Izinkan saluran atau ubah kebijakan ke `open`.                                                                                                     |

Pemecahan masalah lengkap: [Pemecahan masalah Slack](/id/channels/slack#troubleshooting)

## iMessage dan BlueBubbles

### Tanda kegagalan iMessage dan BlueBubbles

| Gejala                           | Pemeriksaan tercepat                                                    | Perbaikan                                             |
| -------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Tidak ada event masuk            | Verifikasi keterjangkauan webhook/server dan izin aplikasi             | Perbaiki URL webhook atau status server BlueBubbles.  |
| Bisa mengirim tetapi tidak menerima di macOS | Periksa izin privasi macOS untuk otomatisasi Messages        | Berikan ulang izin TCC dan mulai ulang proses saluran. |
| Pengirim DM diblokir             | `openclaw pairing list imessage` atau `openclaw pairing list bluebubbles` | Setujui pairing atau perbarui daftar izin.            |

Pemecahan masalah lengkap:

- [Pemecahan masalah iMessage](/id/channels/imessage#troubleshooting)
- [Pemecahan masalah BlueBubbles](/id/channels/bluebubbles#troubleshooting)

## Signal

### Tanda kegagalan Signal

| Gejala                          | Pemeriksaan tercepat                      | Perbaikan                                                  |
| ------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| Daemon dapat dijangkau tetapi bot diam | `openclaw channels status --probe` | Verifikasi URL/akun daemon `signal-cli` dan mode penerimaan. |
| DM diblokir                     | `openclaw pairing list signal`            | Setujui pengirim atau sesuaikan kebijakan DM.              |
| Balasan grup tidak terpicu      | Periksa daftar izin grup dan pola mention | Tambahkan pengirim/grup atau longgarkan gating.            |

Pemecahan masalah lengkap: [Pemecahan masalah Signal](/id/channels/signal#troubleshooting)

## QQ Bot

### Tanda kegagalan QQ Bot

| Gejala                          | Pemeriksaan tercepat                         | Perbaikan                                                       |
| ------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| Bot membalas "gone to Mars"     | Verifikasi `appId` dan `clientSecret` di config | Atur kredensial atau mulai ulang Gateway.                       |
| Tidak ada pesan masuk           | `openclaw channels status --probe`           | Verifikasi kredensial di QQ Open Platform.                      |
| Suara tidak ditranskripsikan    | Periksa config penyedia STT                  | Konfigurasikan `channels.qqbot.stt` atau `tools.media.audio`.   |
| Pesan proaktif tidak tiba       | Periksa persyaratan interaksi platform QQ    | QQ dapat memblokir pesan yang diinisiasi bot tanpa interaksi terbaru. |

Pemecahan masalah lengkap: [Pemecahan masalah QQ Bot](/id/channels/qqbot#troubleshooting)

## Matrix

### Tanda kegagalan Matrix

| Gejala                              | Pemeriksaan tercepat                     | Perbaikan                                                                 |
| ----------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Sudah login tetapi mengabaikan pesan room | `openclaw channels status --probe` | Periksa `groupPolicy`, daftar izin room, dan gating mention.              |
| DM tidak diproses                   | `openclaw pairing list matrix`           | Setujui pengirim atau sesuaikan kebijakan DM.                             |
| Room terenkripsi gagal              | `openclaw matrix verify status`          | Verifikasi ulang perangkat, lalu periksa `openclaw matrix verify backup status`. |
| Pemulihan backup tertunda/rusak     | `openclaw matrix verify backup status`   | Jalankan `openclaw matrix verify backup restore` atau jalankan ulang dengan recovery key. |
| Cross-signing/bootstrap terlihat salah | `openclaw matrix verify bootstrap`    | Perbaiki secret storage, cross-signing, dan status backup dalam satu kali proses. |

Setup dan config lengkap: [Matrix](/id/channels/matrix)

## Terkait

- [Pairing](/id/channels/pairing)
- [Routing saluran](/id/channels/channel-routing)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
