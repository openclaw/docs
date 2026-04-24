---
read_when:
    - Transport channel menunjukkan terhubung tetapi balasan gagal
    - Anda memerlukan pemeriksaan khusus channel sebelum masuk ke dokumentasi provider yang mendalam
summary: Pemecahan masalah cepat tingkat channel dengan tanda kegagalan dan perbaikan per channel
title: Pemecahan masalah channel
x-i18n:
    generated_at: "2026-04-24T08:59:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae605835c3566958341b11d8bdfc3cd4cb4656142bb2953933d06ed6018a483f
    source_path: channels/troubleshooting.md
    workflow: 15
---

Gunakan halaman ini saat sebuah channel terhubung tetapi perilakunya salah.

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
- Probe channel menunjukkan transport terhubung dan, jika didukung, `works` atau `audit ok`

## WhatsApp

### Tanda kegagalan WhatsApp

| Gejala                          | Pemeriksaan tercepat                              | Perbaikan                                               |
| ------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Terhubung tetapi tidak ada balasan DM | `openclaw pairing list whatsapp`             | Setujui pengirim atau ubah kebijakan DM/allowlist.      |
| Pesan grup diabaikan            | Periksa `requireMention` + pola mention di config | Mention bot atau longgarkan kebijakan mention untuk grup itu. |
| Putus sambung acak/loop login ulang | `openclaw channels status --probe` + log     | Login ulang dan verifikasi direktori kredensial sehat.  |

Pemecahan masalah lengkap: [Pemecahan masalah WhatsApp](/id/channels/whatsapp#troubleshooting)

## Telegram

### Tanda kegagalan Telegram

| Gejala                             | Pemeriksaan tercepat                              | Perbaikan                                                                                                                |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `/start` tetapi tidak ada alur balasan yang dapat digunakan | `openclaw pairing list telegram` | Setujui pairing atau ubah kebijakan DM.                                                                                 |
| Bot online tetapi grup tetap diam  | Verifikasi persyaratan mention dan mode privasi bot | Nonaktifkan mode privasi untuk visibilitas grup atau mention bot.                                                      |
| Kegagalan kirim dengan error jaringan | Periksa log untuk kegagalan panggilan API Telegram | Perbaiki perutean DNS/IPv6/proxy ke `api.telegram.org`.                                                                 |
| Polling macet atau reconnect lambat | `openclaw logs --follow` untuk diagnostik polling | Upgrade; jika restart adalah false positive, sesuaikan `pollingStallThresholdMs`. Kemacetan yang persisten tetap mengarah ke proxy/DNS/IPv6. |
| `setMyCommands` ditolak saat startup | Periksa log untuk `BOT_COMMANDS_TOO_MUCH`       | Kurangi command Telegram Plugin/Skills/kustom atau nonaktifkan menu native.                                            |
| Sudah upgrade dan allowlist memblokir Anda | `openclaw security audit` dan allowlist config | Jalankan `openclaw doctor --fix` atau ganti `@username` dengan ID pengirim numerik.                                     |

Pemecahan masalah lengkap: [Pemecahan masalah Telegram](/id/channels/telegram#troubleshooting)

## Discord

### Tanda kegagalan Discord

| Gejala                          | Pemeriksaan tercepat              | Perbaikan                                                    |
| ------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| Bot online tetapi tidak ada balasan guild | `openclaw channels status --probe` | Izinkan guild/channel dan verifikasi intent konten pesan. |
| Pesan grup diabaikan            | Periksa log untuk drop gerbang mention | Mention bot atau atur guild/channel `requireMention: false`. |
| Balasan DM tidak ada            | `openclaw pairing list discord`   | Setujui pairing DM atau sesuaikan kebijakan DM.             |

Pemecahan masalah lengkap: [Pemecahan masalah Discord](/id/channels/discord#troubleshooting)

## Slack

### Tanda kegagalan Slack

| Gejala                                | Pemeriksaan tercepat                      | Perbaikan                                                                                                                                            |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode terhubung tetapi tidak ada respons | `openclaw channels status --probe` | Verifikasi token aplikasi + token bot dan scope yang diperlukan; perhatikan `botTokenStatus` / `appTokenStatus = configured_unavailable` pada penyiapan berbasis SecretRef. |
| DM diblokir                           | `openclaw pairing list slack`             | Setujui pairing atau longgarkan kebijakan DM.                                                                                                        |
| Pesan channel diabaikan               | Periksa `groupPolicy` dan allowlist channel | Izinkan channel atau ubah kebijakan menjadi `open`.                                                                                                 |

Pemecahan masalah lengkap: [Pemecahan masalah Slack](/id/channels/slack#troubleshooting)

## iMessage dan BlueBubbles

### Tanda kegagalan iMessage dan BlueBubbles

| Gejala                          | Pemeriksaan tercepat                                                  | Perbaikan                                              |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| Tidak ada peristiwa masuk       | Verifikasi keterjangkauan webhook/server dan izin aplikasi            | Perbaiki URL webhook atau status server BlueBubbles.   |
| Bisa mengirim tetapi tidak menerima di macOS | Periksa izin privasi macOS untuk otomatisasi Messages | Berikan ulang izin TCC dan mulai ulang proses channel. |
| Pengirim DM diblokir            | `openclaw pairing list imessage` atau `openclaw pairing list bluebubbles` | Setujui pairing atau perbarui allowlist.         |

Pemecahan masalah lengkap:

- [Pemecahan masalah iMessage](/id/channels/imessage#troubleshooting)
- [Pemecahan masalah BlueBubbles](/id/channels/bluebubbles#troubleshooting)

## Signal

### Tanda kegagalan Signal

| Gejala                          | Pemeriksaan tercepat                  | Perbaikan                                                 |
| ------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| Daemon dapat dijangkau tetapi bot diam | `openclaw channels status --probe` | Verifikasi URL/akun daemon `signal-cli` dan mode terima. |
| DM diblokir                     | `openclaw pairing list signal`        | Setujui pengirim atau sesuaikan kebijakan DM.            |
| Balasan grup tidak terpicu      | Periksa allowlist grup dan pola mention | Tambahkan pengirim/grup atau longgarkan pembatasan.     |

Pemecahan masalah lengkap: [Pemecahan masalah Signal](/id/channels/signal#troubleshooting)

## QQ Bot

### Tanda kegagalan QQ Bot

| Gejala                          | Pemeriksaan tercepat                            | Perbaikan                                                          |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| Bot menjawab "gone to Mars"     | Verifikasi `appId` dan `clientSecret` di config | Atur kredensial atau mulai ulang gateway.                          |
| Tidak ada pesan masuk           | `openclaw channels status --probe`              | Verifikasi kredensial di QQ Open Platform.                         |
| Suara tidak ditranskripsikan    | Periksa config provider STT                     | Konfigurasikan `channels.qqbot.stt` atau `tools.media.audio`.      |
| Pesan proaktif tidak sampai     | Periksa persyaratan interaksi platform QQ       | QQ dapat memblokir pesan yang dimulai bot tanpa interaksi terbaru. |

Pemecahan masalah lengkap: [Pemecahan masalah QQ Bot](/id/channels/qqbot#troubleshooting)

## Matrix

### Tanda kegagalan Matrix

| Gejala                              | Pemeriksaan tercepat                   | Perbaikan                                                                  |
| ----------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Sudah login tetapi mengabaikan pesan room | `openclaw channels status --probe` | Periksa `groupPolicy`, allowlist room, dan gerbang mention.               |
| DM tidak diproses                   | `openclaw pairing list matrix`         | Setujui pengirim atau sesuaikan kebijakan DM.                             |
| Room terenkripsi gagal              | `openclaw matrix verify status`        | Verifikasi ulang perangkat, lalu periksa `openclaw matrix verify backup status`. |
| Pemulihan backup tertunda/rusak     | `openclaw matrix verify backup status` | Jalankan `openclaw matrix verify backup restore` atau jalankan ulang dengan recovery key. |
| Cross-signing/bootstrap tampak salah | `openclaw matrix verify bootstrap`    | Perbaiki penyimpanan secret, cross-signing, dan status backup dalam satu langkah. |

Penyiapan dan config lengkap: [Matrix](/id/channels/matrix)

## Terkait

- [Pairing](/id/channels/pairing)
- [Perutean channel](/id/channels/channel-routing)
- [Pemecahan masalah gateway](/id/gateway/troubleshooting)
