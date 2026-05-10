---
read_when:
    - Transport kanal menunjukkan status terhubung tetapi balasan gagal
    - Anda memerlukan pemeriksaan khusus saluran sebelum menelaah dokumentasi penyedia secara mendalam
summary: Pemecahan masalah cepat tingkat saluran dengan ciri kegagalan dan perbaikan per saluran
title: Pemecahan masalah saluran
x-i18n:
    generated_at: "2026-05-10T19:24:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gunakan halaman ini saat saluran tersambung tetapi perilakunya salah.

## Urutan perintah

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
- Probe saluran menunjukkan transport tersambung dan, jika didukung, `works` atau `audit ok`

## WhatsApp

### Pola kegagalan WhatsApp

| Gejala                              | Pemeriksaan tercepat                              | Perbaikan                                                                                                                             |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Tersambung tetapi tidak ada balasan DM | `openclaw pairing list whatsapp`                  | Setujui pengirim atau ubah kebijakan/allowlist DM.                                                                                    |
| Pesan grup diabaikan                | Periksa `requireMention` + pola mention di config | Mention bot atau longgarkan kebijakan mention untuk grup tersebut.                                                                    |
| Login QR habis waktu dengan 408     | Periksa env Gateway `HTTPS_PROXY` / `HTTP_PROXY`  | Tetapkan proxy yang dapat dijangkau; gunakan `NO_PROXY` hanya untuk bypass.                                                           |
| Loop putus sambung/login ulang acak | `openclaw channels status --probe` + log          | Reconnect terbaru ditandai meskipun saat ini tersambung; pantau log, mulai ulang Gateway, lalu tautkan ulang jika flapping berlanjut. |
| Balasan tiba terlambat beberapa detik/menit | `openclaw doctor --fix`                    | Doctor menghentikan klien TUI lokal usang yang terverifikasi saat klien tersebut menurunkan kinerja event loop Gateway.              |

Pemecahan masalah lengkap: [Pemecahan masalah WhatsApp](/id/channels/whatsapp#troubleshooting)

## Telegram

### Pola kegagalan Telegram

| Gejala                              | Pemeriksaan tercepat                           | Perbaikan                                                                                                                    |
| ----------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/start` tetapi tidak ada alur balasan yang dapat digunakan | `openclaw pairing list telegram` | Setujui pairing atau ubah kebijakan DM.                                                                                      |
| Bot online tetapi grup tetap senyap | Verifikasi persyaratan mention dan mode privasi bot | Nonaktifkan mode privasi untuk visibilitas grup atau mention bot.                                                            |
| Kegagalan kirim dengan error jaringan | Periksa log untuk kegagalan panggilan API Telegram | Perbaiki routing DNS/IPv6/proxy ke `api.telegram.org`.                                                                       |
| Startup melaporkan `getMe returned 401` | Periksa sumber token yang dikonfigurasi      | Salin ulang atau buat ulang token BotFather dan perbarui `botToken`, `tokenFile`, atau `TELEGRAM_BOT_TOKEN` akun default.    |
| Polling macet atau reconnect lambat | `openclaw logs --follow` untuk diagnostik polling | Upgrade; jika restart adalah positif palsu, sesuaikan `pollingStallThresholdMs`. Kemacetan persisten tetap mengarah ke proxy/DNS/IPv6. |
| `setMyCommands` ditolak saat startup | Periksa log untuk `BOT_COMMANDS_TOO_MUCH`    | Kurangi perintah Telegram Plugin/skill/kustom atau nonaktifkan menu native.                                                   |
| Setelah upgrade, allowlist memblokir Anda | `openclaw security audit` dan allowlist config | Jalankan `openclaw doctor --fix` atau ganti `@username` dengan ID pengirim numerik.                                          |

Pemecahan masalah lengkap: [Pemecahan masalah Telegram](/id/channels/telegram#troubleshooting)

## Discord

### Pola kegagalan Discord

| Gejala                                   | Pemeriksaan tercepat                                                  | Perbaikan                                                                                                                                              |
| ---------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bot online tetapi tidak ada balasan guild | `openclaw channels status --probe`                                    | Izinkan guild/saluran dan verifikasi intent konten pesan.                                                                                              |
| Pesan grup diabaikan                    | Periksa log untuk drop karena gating mention                          | Mention bot atau tetapkan `requireMention: false` guild/saluran.                                                                                       |
| Ada aktivitas mengetik/penggunaan token tetapi tidak ada pesan Discord | Log sesi menunjukkan teks asisten dengan `didSendViaMessagingTool: false` | Model menjawab secara privat alih-alih memanggil tool pesan. Gunakan model yang andal untuk tool-call, atau tetapkan `messages.groupChat.visibleReplies: "automatic"` untuk mem-posting otomatis. |
| Balasan DM hilang                       | `openclaw pairing list discord`                                       | Setujui pairing DM atau sesuaikan kebijakan DM.                                                                                                        |

Pemecahan masalah lengkap: [Pemecahan masalah Discord](/id/channels/discord#troubleshooting)

## Slack

### Pola kegagalan Slack

| Gejala                                | Pemeriksaan tercepat                      | Perbaikan                                                                                                                                             |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode tersambung tetapi tidak ada respons | `openclaw channels status --probe` | Verifikasi token app + token bot dan scope yang diperlukan; pantau `botTokenStatus` / `appTokenStatus = configured_unavailable` pada setup berbasis SecretRef. |
| DM diblokir                           | `openclaw pairing list slack`             | Setujui pairing atau longgarkan kebijakan DM.                                                                                                         |
| Pesan saluran diabaikan               | Periksa `groupPolicy` dan allowlist saluran | Izinkan saluran atau ubah kebijakan menjadi `open`.                                                                                                   |

Pemecahan masalah lengkap: [Pemecahan masalah Slack](/id/channels/slack#troubleshooting)

## iMessage

### Pola kegagalan iMessage

| Gejala                              | Pemeriksaan tercepat                                      | Perbaikan                                                              |
| ----------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `imsg` hilang atau gagal di non-macOS | `openclaw channels status --probe --channel imessage`   | Jalankan OpenClaw di Mac Messages atau gunakan wrapper SSH untuk `cliPath`. |
| Dapat mengirim tetapi tidak menerima di macOS | Periksa izin privasi macOS untuk automasi Messages | Berikan ulang izin TCC dan mulai ulang proses saluran.                 |
| Pengirim DM diblokir                | `openclaw pairing list imessage`                          | Setujui pairing atau perbarui allowlist.                               |

Pemecahan masalah lengkap:

- [Pemecahan masalah iMessage](/id/channels/imessage#troubleshooting)

## Signal

### Pola kegagalan Signal

| Gejala                         | Pemeriksaan tercepat                      | Perbaikan                                                  |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------------------- |
| Daemon dapat dijangkau tetapi bot senyap | `openclaw channels status --probe` | Verifikasi URL/akun daemon `signal-cli` dan mode penerimaan. |
| DM diblokir                    | `openclaw pairing list signal`            | Setujui pengirim atau sesuaikan kebijakan DM.              |
| Balasan grup tidak terpicu     | Periksa allowlist grup dan pola mention   | Tambahkan pengirim/grup atau longgarkan gating.            |

Pemecahan masalah lengkap: [Pemecahan masalah Signal](/id/channels/signal#troubleshooting)

## QQ Bot

### Pola kegagalan QQ Bot

| Gejala                         | Pemeriksaan tercepat                         | Perbaikan                                                      |
| ------------------------------ | -------------------------------------------- | -------------------------------------------------------------- |
| Bot membalas "gone to Mars"    | Verifikasi `appId` dan `clientSecret` di config | Tetapkan kredensial atau mulai ulang Gateway.                  |
| Tidak ada pesan masuk          | `openclaw channels status --probe`           | Verifikasi kredensial di QQ Open Platform.                     |
| Suara tidak ditranskripsikan   | Periksa config penyedia STT                  | Konfigurasi `channels.qqbot.stt` atau `tools.media.audio`.     |
| Pesan proaktif tidak tiba      | Periksa persyaratan interaksi platform QQ    | QQ dapat memblokir pesan yang diinisiasi bot tanpa interaksi terbaru. |

Pemecahan masalah lengkap: [Pemecahan masalah QQ Bot](/id/channels/qqbot#troubleshooting)

## Matrix

### Pola kegagalan Matrix

| Gejala                             | Pemeriksaan tercepat                    | Perbaikan                                                                 |
| ---------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Sudah login tetapi mengabaikan pesan ruang | `openclaw channels status --probe` | Periksa `groupPolicy`, allowlist ruang, dan gating mention.               |
| DM tidak diproses                  | `openclaw pairing list matrix`          | Setujui pengirim atau sesuaikan kebijakan DM.                             |
| Ruang terenkripsi gagal            | `openclaw matrix verify status`         | Verifikasi ulang perangkat, lalu periksa `openclaw matrix verify backup status`. |
| Pemulihan backup tertunda/rusak    | `openclaw matrix verify backup status`  | Jalankan `openclaw matrix verify backup restore` atau jalankan ulang dengan recovery key. |
| Cross-signing/bootstrap terlihat salah | `openclaw matrix verify bootstrap`  | Perbaiki penyimpanan secret, cross-signing, dan status backup dalam satu kali proses. |

Setup dan config lengkap: [Matrix](/id/channels/matrix)

## Terkait

- [Pairing](/id/channels/pairing)
- [Routing saluran](/id/channels/channel-routing)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
