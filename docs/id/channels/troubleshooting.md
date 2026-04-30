---
read_when:
    - Transport kanal menunjukkan terhubung tetapi balasan gagal
    - Anda memerlukan pemeriksaan khusus saluran sebelum dokumentasi penyedia yang mendalam
summary: Pemecahan masalah cepat di tingkat saluran dengan ciri kegagalan dan perbaikan per saluran
title: Pemecahan masalah saluran
x-i18n:
    generated_at: "2026-04-30T09:36:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gunakan halaman ini ketika channel terhubung tetapi perilakunya salah.

## Tangga perintah

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
- Probe channel menunjukkan transport terhubung dan, jika didukung, `works` atau `audit ok`

## WhatsApp

### Tanda kegagalan WhatsApp

| Gejala                          | Pemeriksaan tercepat                                | Perbaikan                                                                                                                       |
| ------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Terhubung tetapi tidak ada balasan DM | `openclaw pairing list whatsapp`                    | Setujui pengirim atau ubah kebijakan/allowlist DM.                                                                              |
| Pesan grup diabaikan            | Periksa `requireMention` + pola mention di config | Mention bot atau longgarkan kebijakan mention untuk grup tersebut.                                                              |
| Login QR habis waktu dengan 408 | Periksa env `HTTPS_PROXY` / `HTTP_PROXY` Gateway      | Tetapkan proxy yang dapat dijangkau; gunakan `NO_PROXY` hanya untuk bypass.                                                     |
| Loop disconnect/relogin acak    | `openclaw channels status --probe` + log           | Reconnect terbaru ditandai meskipun saat ini terhubung; pantau log, restart Gateway, lalu tautkan ulang jika flapping berlanjut. |

Pemecahan masalah lengkap: [Pemecahan masalah WhatsApp](/id/channels/whatsapp#troubleshooting)

## Telegram

### Tanda kegagalan Telegram

| Gejala                               | Pemeriksaan tercepat                             | Perbaikan                                                                                                                     |
| ------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `/start` tetapi tidak ada alur balasan yang dapat digunakan | `openclaw pairing list telegram`                 | Setujui pairing atau ubah kebijakan DM.                                                                                       |
| Bot online tetapi grup tetap diam    | Verifikasi persyaratan mention dan mode privasi bot | Nonaktifkan mode privasi untuk visibilitas grup atau mention bot.                                                             |
| Kegagalan pengiriman dengan error jaringan | Periksa log untuk kegagalan panggilan API Telegram | Perbaiki routing DNS/IPv6/proxy ke `api.telegram.org`.                                                                        |
| Startup melaporkan `getMe returned 401` | Periksa sumber token yang dikonfigurasi          | Salin ulang atau buat ulang token BotFather dan perbarui `botToken`, `tokenFile`, atau akun default `TELEGRAM_BOT_TOKEN`.     |
| Polling macet atau reconnect lambat  | `openclaw logs --follow` untuk diagnostik polling | Upgrade; jika restart adalah positif palsu, sesuaikan `pollingStallThresholdMs`. Stalled persisten tetap mengarah ke proxy/DNS/IPv6. |
| `setMyCommands` ditolak saat startup | Periksa log untuk `BOT_COMMANDS_TOO_MUCH`         | Kurangi perintah Telegram dari Plugin/Skills/kustom atau nonaktifkan menu native.                                             |
| Setelah upgrade, allowlist memblokir Anda | `openclaw security audit` dan allowlist config   | Jalankan `openclaw doctor --fix` atau ganti `@username` dengan ID pengirim numerik.                                           |

Pemecahan masalah lengkap: [Pemecahan masalah Telegram](/id/channels/telegram#troubleshooting)

## Discord

### Tanda kegagalan Discord

| Gejala                          | Pemeriksaan tercepat                | Perbaikan                                                  |
| ------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| Bot online tetapi tidak ada balasan guild | `openclaw channels status --probe`  | Izinkan guild/channel dan verifikasi intent konten pesan.  |
| Pesan grup diabaikan            | Periksa log untuk drop gating mention | Mention bot atau setel `requireMention: false` guild/channel. |
| Balasan DM hilang               | `openclaw pairing list discord`     | Setujui pairing DM atau sesuaikan kebijakan DM.            |

Pemecahan masalah lengkap: [Pemecahan masalah Discord](/id/channels/discord#troubleshooting)

## Slack

### Tanda kegagalan Slack

| Gejala                                 | Pemeriksaan tercepat                      | Perbaikan                                                                                                                                             |
| -------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode terhubung tetapi tidak ada respons | `openclaw channels status --probe`        | Verifikasi token app + token bot dan scope yang diperlukan; pantau `botTokenStatus` / `appTokenStatus = configured_unavailable` pada setup berbasis SecretRef. |
| DM diblokir                            | `openclaw pairing list slack`             | Setujui pairing atau longgarkan kebijakan DM.                                                                                                        |
| Pesan channel diabaikan                | Periksa `groupPolicy` dan allowlist channel | Izinkan channel atau ubah kebijakan ke `open`.                                                                                                       |

Pemecahan masalah lengkap: [Pemecahan masalah Slack](/id/channels/slack#troubleshooting)

## iMessage dan BlueBubbles

### Tanda kegagalan iMessage dan BlueBubbles

| Gejala                           | Pemeriksaan tercepat                                                    | Perbaikan                                             |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Tidak ada event masuk            | Verifikasi keterjangkauan webhook/server dan izin app                   | Perbaiki URL Webhook atau status server BlueBubbles.  |
| Dapat mengirim tetapi tidak menerima di macOS | Periksa izin privasi macOS untuk automasi Messages                 | Berikan ulang izin TCC dan restart proses channel.    |
| Pengirim DM diblokir             | `openclaw pairing list imessage` atau `openclaw pairing list bluebubbles` | Setujui pairing atau perbarui allowlist.              |

Pemecahan masalah lengkap:

- [Pemecahan masalah iMessage](/id/channels/imessage#troubleshooting)
- [Pemecahan masalah BlueBubbles](/id/channels/bluebubbles#troubleshooting)

## Signal

### Tanda kegagalan Signal

| Gejala                          | Pemeriksaan tercepat                       | Perbaikan                                               |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Daemon dapat dijangkau tetapi bot diam | `openclaw channels status --probe`         | Verifikasi URL/akun daemon `signal-cli` dan mode terima. |
| DM diblokir                     | `openclaw pairing list signal`             | Setujui pengirim atau sesuaikan kebijakan DM.           |
| Balasan grup tidak terpicu      | Periksa allowlist grup dan pola mention    | Tambahkan pengirim/grup atau longgarkan gating.         |

Pemecahan masalah lengkap: [Pemecahan masalah Signal](/id/channels/signal#troubleshooting)

## QQ Bot

### Tanda kegagalan QQ Bot

| Gejala                          | Pemeriksaan tercepat                        | Perbaikan                                                      |
| ------------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| Bot membalas "gone to Mars"     | Verifikasi `appId` dan `clientSecret` di config | Tetapkan kredensial atau restart Gateway.                      |
| Tidak ada pesan masuk           | `openclaw channels status --probe`          | Verifikasi kredensial di QQ Open Platform.                     |
| Suara tidak ditranskripsikan    | Periksa config penyedia STT                 | Konfigurasikan `channels.qqbot.stt` atau `tools.media.audio`.  |
| Pesan proaktif tidak sampai     | Periksa persyaratan interaksi platform QQ   | QQ dapat memblokir pesan yang dimulai bot tanpa interaksi terbaru. |

Pemecahan masalah lengkap: [Pemecahan masalah QQ Bot](/id/channels/qqbot#troubleshooting)

## Matrix

### Tanda kegagalan Matrix

| Gejala                              | Pemeriksaan tercepat                   | Perbaikan                                                                |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Sudah login tetapi mengabaikan pesan room | `openclaw channels status --probe`     | Periksa `groupPolicy`, allowlist room, dan gating mention.               |
| DM tidak diproses                   | `openclaw pairing list matrix`         | Setujui pengirim atau sesuaikan kebijakan DM.                            |
| Room terenkripsi gagal              | `openclaw matrix verify status`        | Verifikasi ulang perangkat, lalu periksa `openclaw matrix verify backup status`. |
| Restore backup tertunda/rusak       | `openclaw matrix verify backup status` | Jalankan `openclaw matrix verify backup restore` atau jalankan ulang dengan recovery key. |
| Cross-signing/bootstrap terlihat salah | `openclaw matrix verify bootstrap`     | Perbaiki secret storage, cross-signing, dan status backup dalam satu lintasan. |

Setup dan config lengkap: [Matrix](/id/channels/matrix)

## Terkait

- [Pairing](/id/channels/pairing)
- [Routing channel](/id/channels/channel-routing)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
