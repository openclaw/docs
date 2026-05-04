---
read_when:
    - Transport kanal menunjukkan terhubung tetapi balasan gagal
    - Anda memerlukan pemeriksaan khusus saluran sebelum dokumentasi penyedia yang mendalam
summary: Pemecahan masalah tingkat saluran secara cepat dengan pola kegagalan dan perbaikan per saluran
title: Pemecahan masalah saluran
x-i18n:
    generated_at: "2026-05-04T02:22:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3a0737156ae83897c44d18505e0355a5d8e5700106b984496d94874c270deb2
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gunakan halaman ini saat saluran terhubung tetapi perilakunya salah.

## Urutan perintah

Jalankan ini secara berurutan terlebih dahulu:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Dasar acuan yang sehat:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, atau `admin-capable`
- Probe saluran menampilkan transport terhubung dan, jika didukung, `works` atau `audit ok`

## WhatsApp

### Tanda kegagalan WhatsApp

| Gejala                         | Pemeriksaan tercepat                                | Perbaikan                                                                                                                        |
| ------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Terhubung tetapi tidak ada balasan DM | `openclaw pairing list whatsapp`                    | Setujui pengirim atau ubah kebijakan/daftar izin DM.                                                                             |
| Pesan grup diabaikan            | Periksa `requireMention` + pola mention di konfigurasi | Mention bot atau longgarkan kebijakan mention untuk grup tersebut.                                                               |
| Login QR habis waktu dengan 408 | Periksa env `HTTPS_PROXY` / `HTTP_PROXY` Gateway    | Tetapkan proxy yang dapat dijangkau; gunakan `NO_PROXY` hanya untuk bypass.                                                      |
| Loop putus sambung/login ulang acak | `openclaw channels status --probe` + log            | Rekoneksi terbaru ditandai meskipun saat ini terhubung; pantau log, mulai ulang Gateway, lalu tautkan ulang jika flapping berlanjut. |

Pemecahan masalah lengkap: [Pemecahan masalah WhatsApp](/id/channels/whatsapp#troubleshooting)

## Telegram

### Tanda kegagalan Telegram

| Gejala                               | Pemeriksaan tercepat                                | Perbaikan                                                                                                                        |
| ------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start` tetapi tidak ada alur balasan yang dapat digunakan | `openclaw pairing list telegram`                    | Setujui pairing atau ubah kebijakan DM.                                                                                         |
| Bot online tetapi grup tetap diam    | Verifikasi persyaratan mention dan mode privasi bot | Nonaktifkan mode privasi agar grup terlihat atau mention bot.                                                                    |
| Kegagalan pengiriman dengan kesalahan jaringan | Periksa log untuk kegagalan panggilan API Telegram  | Perbaiki perutean DNS/IPv6/proxy ke `api.telegram.org`.                                                                         |
| Startup melaporkan `getMe returned 401` | Periksa sumber token yang dikonfigurasi             | Salin ulang atau buat ulang token BotFather dan perbarui `botToken`, `tokenFile`, atau akun bawaan `TELEGRAM_BOT_TOKEN`.        |
| Polling macet atau lambat terhubung ulang | `openclaw logs --follow` untuk diagnostik polling   | Tingkatkan versi; jika restart adalah positif palsu, sesuaikan `pollingStallThresholdMs`. Kemacetan yang persisten tetap mengarah ke proxy/DNS/IPv6. |
| `setMyCommands` ditolak saat startup | Periksa log untuk `BOT_COMMANDS_TOO_MUCH`           | Kurangi perintah Telegram Plugin/skill/kustom atau nonaktifkan menu native.                                                     |
| Setelah peningkatan versi daftar izin memblokir Anda | `openclaw security audit` dan daftar izin konfigurasi | Jalankan `openclaw doctor --fix` atau ganti `@username` dengan ID pengirim numerik.                                             |

Pemecahan masalah lengkap: [Pemecahan masalah Telegram](/id/channels/telegram#troubleshooting)

## Discord

### Tanda kegagalan Discord

| Gejala                                   | Pemeriksaan tercepat                                                   | Perbaikan                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online tetapi tidak ada balasan server | `openclaw channels status --probe`                                     | Izinkan server/saluran dan verifikasi intent konten pesan.                                                                                                             |
| Pesan grup diabaikan                      | Periksa log untuk drop akibat gating mention                           | Mention bot atau atur `requireMention: false` untuk server/saluran.                                                                                                    |
| Ada penggunaan pengetikan/token tetapi tidak ada pesan Discord | Log sesi menampilkan teks asisten dengan `didSendViaMessagingTool: false` | Model menjawab secara privat alih-alih memanggil alat pesan. Gunakan model yang andal untuk pemanggilan alat, atau atur `messages.groupChat.visibleReplies: "automatic"` agar otomatis memposting. |
| Balasan DM hilang                         | `openclaw pairing list discord`                                        | Setujui pairing DM atau sesuaikan kebijakan DM.                                                                                                                        |

Pemecahan masalah lengkap: [Pemecahan masalah Discord](/id/channels/discord#troubleshooting)

## Slack

### Tanda kegagalan Slack

| Gejala                                 | Pemeriksaan tercepat                         | Perbaikan                                                                                                                                              |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mode soket terhubung tetapi tidak ada respons | `openclaw channels status --probe`           | Verifikasi token aplikasi + token bot dan cakupan yang diperlukan; pantau `botTokenStatus` / `appTokenStatus = configured_unavailable` pada penyiapan berbasis SecretRef. |
| DM diblokir                            | `openclaw pairing list slack`                | Setujui pairing atau longgarkan kebijakan DM.                                                                                                          |
| Pesan saluran diabaikan                | Periksa `groupPolicy` dan daftar izin saluran | Izinkan saluran atau ubah kebijakan ke `open`.                                                                                                         |

Pemecahan masalah lengkap: [Pemecahan masalah Slack](/id/channels/slack#troubleshooting)

## iMessage dan BlueBubbles

### Tanda kegagalan iMessage dan BlueBubbles

| Gejala                           | Pemeriksaan tercepat                                                     | Perbaikan                                             |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| Tidak ada peristiwa masuk        | Verifikasi keterjangkauan Webhook/server dan izin aplikasi               | Perbaiki URL Webhook atau status server BlueBubbles.  |
| Dapat mengirim tetapi tidak menerima di macOS | Periksa izin privasi macOS untuk otomatisasi Messages                    | Berikan ulang izin TCC dan mulai ulang proses saluran. |
| Pengirim DM diblokir             | `openclaw pairing list imessage` atau `openclaw pairing list bluebubbles` | Setujui pairing atau perbarui daftar izin.            |

Pemecahan masalah lengkap:

- [Pemecahan masalah iMessage](/id/channels/imessage#troubleshooting)
- [Pemecahan masalah BlueBubbles](/id/channels/bluebubbles#troubleshooting)

## Signal

### Tanda kegagalan Signal

| Gejala                         | Pemeriksaan tercepat                       | Perbaikan                                                     |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| Daemon dapat dijangkau tetapi bot diam | `openclaw channels status --probe`         | Verifikasi URL/akun daemon `signal-cli` dan mode penerimaan.  |
| DM diblokir                    | `openclaw pairing list signal`             | Setujui pengirim atau sesuaikan kebijakan DM.                 |
| Balasan grup tidak terpicu     | Periksa daftar izin grup dan pola mention  | Tambahkan pengirim/grup atau longgarkan gating.               |

Pemecahan masalah lengkap: [Pemecahan masalah Signal](/id/channels/signal#troubleshooting)

## QQ Bot

### Tanda kegagalan QQ Bot

| Gejala                         | Pemeriksaan tercepat                         | Perbaikan                                                          |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| Bot membalas "pergi ke Mars"   | Verifikasi `appId` dan `clientSecret` di konfigurasi | Tetapkan kredensial atau mulai ulang Gateway.                      |
| Tidak ada pesan masuk          | `openclaw channels status --probe`           | Verifikasi kredensial di QQ Open Platform.                         |
| Suara tidak ditranskripsi      | Periksa konfigurasi penyedia STT             | Konfigurasikan `channels.qqbot.stt` atau `tools.media.audio`.      |
| Pesan proaktif tidak tiba      | Periksa persyaratan interaksi platform QQ    | QQ dapat memblokir pesan yang dimulai bot tanpa interaksi terbaru. |

Pemecahan masalah lengkap: [Pemecahan masalah QQ Bot](/id/channels/qqbot#troubleshooting)

## Matrix

### Tanda kegagalan Matrix

| Gejala                               | Pemeriksaan tercepat                    | Perbaikan                                                                    |
| ------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------- |
| Sudah login tetapi mengabaikan pesan ruang | `openclaw channels status --probe`      | Periksa `groupPolicy`, daftar izin ruang, dan gating mention.                 |
| DM tidak diproses                    | `openclaw pairing list matrix`          | Setujui pengirim atau sesuaikan kebijakan DM.                                 |
| Ruang terenkripsi gagal              | `openclaw matrix verify status`         | Verifikasi ulang perangkat, lalu periksa `openclaw matrix verify backup status`. |
| Pemulihan cadangan tertunda/rusak    | `openclaw matrix verify backup status`  | Jalankan `openclaw matrix verify backup restore` atau jalankan ulang dengan kunci pemulihan. |
| Cross-signing/bootstrap terlihat salah | `openclaw matrix verify bootstrap`      | Perbaiki penyimpanan rahasia, cross-signing, dan status cadangan dalam satu langkah. |

Penyiapan dan konfigurasi lengkap: [Matrix](/id/channels/matrix)

## Terkait

- [Pairing](/id/channels/pairing)
- [Perutean saluran](/id/channels/channel-routing)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
