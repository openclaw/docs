---
read_when:
    - Kanal transport menyatakan tersambung tetapi balasan gagal
    - Anda memerlukan pemeriksaan khusus channel sebelum dokumentasi provider yang mendalam
summary: Pemecahan masalah tingkat channel secara cepat dengan tanda kegagalan dan perbaikan per channel
title: Pemecahan masalah saluran
x-i18n:
    generated_at: "2026-06-27T17:13:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gunakan halaman ini saat channel terhubung tetapi perilakunya salah.

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

## Setelah pembaruan

Gunakan ini saat Telegram, iMessage, konfigurasi era BlueBubbles, atau channel Plugin lain menghilang setelah pembaruan.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Cari `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` di `openclaw status --all`. Itu berarti channel telah dikonfigurasi, tetapi jalur penyiapan/pemuatan Plugin menemui pohon dependensi yang rusak alih-alih mendaftarkan channel. `openclaw doctor --fix` menghapus direktori staging dependensi Plugin yang usang dan bayangan auth yang usang, lalu `openclaw gateway restart` memuat ulang status bersih.

## WhatsApp

### Tanda kegagalan WhatsApp

| Gejala                              | Pemeriksaan tercepat                              | Perbaikan                                                                                                                               |
| ----------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Terhubung tetapi tidak ada balasan DM | `openclaw pairing list whatsapp`                  | Setujui pengirim atau ubah kebijakan/daftar izin DM.                                                                                    |
| Pesan grup diabaikan                | Periksa pola `requireMention` + mention di konfigurasi | Mention bot atau longgarkan kebijakan mention untuk grup tersebut.                                                                      |
| Login QR habis waktu dengan 408     | Periksa env Gateway `HTTPS_PROXY` / `HTTP_PROXY`  | Tetapkan proxy yang dapat dijangkau; gunakan `NO_PROXY` hanya untuk bypass.                                                             |
| Loop putus/masuk ulang acak         | `openclaw channels status --probe` + log          | Reconnect terbaru ditandai meskipun saat ini terhubung; pantau log, restart Gateway, lalu tautkan ulang jika flapping berlanjut.        |
| Loop `status=408 Request Time-out`  | Probe, log, doctor, lalu status Gateway           | Perbaiki konektivitas/timing host terlebih dahulu; cadangkan auth dan tautkan ulang akun jika loop berlanjut.                           |
| Balasan tiba terlambat detik/menit  | `openclaw doctor --fix`                           | Doctor menghentikan klien TUI lokal usang yang terverifikasi ketika klien tersebut menurunkan kinerja loop peristiwa Gateway.           |

Pemecahan masalah lengkap: [Pemecahan masalah WhatsApp](/id/channels/whatsapp#troubleshooting)

## Telegram

### Tanda kegagalan Telegram

| Gejala                                | Pemeriksaan tercepat                              | Perbaikan                                                                                                                   |
| ------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/start` tetapi tidak ada alur balasan yang dapat digunakan | `openclaw pairing list telegram`                  | Setujui pairing atau ubah kebijakan DM.                                                                                     |
| Bot online tetapi grup tetap diam     | Verifikasi persyaratan mention dan mode privasi bot | Nonaktifkan mode privasi untuk visibilitas grup atau mention bot.                                                           |
| Kegagalan kirim dengan galat jaringan | Periksa log untuk kegagalan panggilan API Telegram | Perbaiki routing DNS/IPv6/proxy ke `api.telegram.org`.                                                                      |
| Startup melaporkan `getMe returned 401` | Periksa sumber token yang dikonfigurasi           | Salin ulang atau buat ulang token BotFather dan perbarui `botToken`, `tokenFile`, atau akun default `TELEGRAM_BOT_TOKEN`.   |
| Polling macet atau reconnect lambat   | `openclaw logs --follow` untuk diagnostik polling | Tingkatkan versi; jika restart adalah positif palsu, sesuaikan `pollingStallThresholdMs`. Macet persisten tetap mengarah ke proxy/DNS/IPv6. |
| `setMyCommands` ditolak saat startup  | Periksa log untuk `BOT_COMMANDS_TOO_MUCH`         | Kurangi perintah Telegram dari Plugin/skill/kustom atau nonaktifkan menu native.                                             |
| Setelah upgrade, daftar izin memblokir Anda | `openclaw security audit` dan daftar izin konfigurasi | Jalankan `openclaw doctor --fix` atau ganti `@username` dengan ID pengirim numerik.                                          |

Pemecahan masalah lengkap: [Pemecahan masalah Telegram](/id/channels/telegram#troubleshooting)

## Discord

### Tanda kegagalan Discord

| Gejala                                    | Pemeriksaan tercepat                                                                                                           | Perbaikan                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online tetapi tidak ada balasan guild | `openclaw channels status --probe`                                                                                              | Izinkan guild/channel dan verifikasi intent konten pesan.                                                                                                                                                                                                             |
| Pesan grup diabaikan                      | Periksa log untuk drop gating mention                                                                                           | Mention bot atau tetapkan `requireMention: false` pada guild/channel.                                                                                                                                                                                                 |
| Penggunaan typing/token tetapi tidak ada pesan Discord | Periksa apakah ini peristiwa ruang ambient atau ruang `message_tool` yang diikutsertakan ketika model melewatkan `message(action=send)` | Periksa log verbose Gateway untuk metadata payload akhir yang ditekan, verifikasi `messages.groupChat.unmentionedInbound`, baca [Peristiwa ruang ambient](/id/channels/ambient-room-events), atau pertahankan `messages.groupChat.visibleReplies: "automatic"` untuk permintaan grup normal. |
| Balasan DM hilang                         | `openclaw pairing list discord`                                                                                                 | Setujui pairing DM atau sesuaikan kebijakan DM.                                                                                                                                                                                                                       |

Pemecahan masalah lengkap: [Pemecahan masalah Discord](/id/channels/discord#troubleshooting)

## Slack

### Tanda kegagalan Slack

| Gejala                                  | Pemeriksaan tercepat                         | Perbaikan                                                                                                                                             |
| --------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mode socket terhubung tetapi tidak ada respons | `openclaw channels status --probe`           | Verifikasi token aplikasi + token bot dan scope yang diperlukan; pantau `botTokenStatus` / `appTokenStatus = configured_unavailable` pada penyiapan berbasis SecretRef. |
| DM diblokir                             | `openclaw pairing list slack`                | Setujui pairing atau longgarkan kebijakan DM.                                                                                                         |
| Pesan channel diabaikan                 | Periksa `groupPolicy` dan daftar izin channel | Izinkan channel atau ubah kebijakan ke `open`.                                                                                                        |

Pemecahan masalah lengkap: [Pemecahan masalah Slack](/id/channels/slack#troubleshooting)

## iMessage

### Tanda kegagalan iMessage

| Gejala                                | Pemeriksaan tercepat                                     | Perbaikan                                                            |
| ------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| `imsg` hilang atau gagal di non-macOS | `openclaw channels status --probe --channel imessage`    | Jalankan OpenClaw di Mac Messages atau gunakan wrapper SSH untuk `cliPath`. |
| Dapat mengirim tetapi tidak menerima di macOS | Periksa izin privasi macOS untuk automasi Messages       | Berikan ulang izin TCC dan restart proses channel.                   |
| Pengirim DM diblokir                  | `openclaw pairing list imessage`                         | Setujui pairing atau perbarui daftar izin.                           |

Pemecahan masalah lengkap:

- [Pemecahan masalah iMessage](/id/channels/imessage#troubleshooting)

## Signal

### Tanda kegagalan Signal

| Gejala                         | Pemeriksaan tercepat                         | Perbaikan                                                   |
| ------------------------------ | -------------------------------------------- | ----------------------------------------------------------- |
| Daemon dapat dijangkau tetapi bot diam | `openclaw channels status --probe`           | Verifikasi URL/akun daemon `signal-cli` dan mode penerimaan. |
| DM diblokir                    | `openclaw pairing list signal`               | Setujui pengirim atau sesuaikan kebijakan DM.               |
| Balasan grup tidak terpicu     | Periksa daftar izin grup dan pola mention    | Tambahkan pengirim/grup atau longgarkan gating.             |

Pemecahan masalah lengkap: [Pemecahan masalah Signal](/id/channels/signal#troubleshooting)

## QQ Bot

### Tanda kegagalan QQ Bot

| Gejala                               | Pemeriksaan tercepat                            | Perbaikan                                                        |
| ------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------- |
| Bot membalas "gone to Mars"          | Verifikasi `appId` dan `clientSecret` di konfigurasi | Tetapkan kredensial atau restart Gateway.                        |
| Tidak ada pesan masuk                | `openclaw channels status --probe`              | Verifikasi kredensial di QQ Open Platform.                       |
| Suara tidak ditranskripsi            | Periksa konfigurasi penyedia STT                | Konfigurasikan `channels.qqbot.stt` atau `tools.media.audio`.    |
| Pesan proaktif tidak tiba            | Periksa persyaratan interaksi platform QQ       | QQ dapat memblokir pesan yang dimulai bot tanpa interaksi terbaru. |

Pemecahan masalah lengkap: [Pemecahan masalah QQ Bot](/id/channels/qqbot#troubleshooting)

## Matrix

### Tanda kegagalan Matrix

| Gejala                              | Pemeriksaan tercepat                   | Perbaikan                                                                 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Sudah masuk tetapi mengabaikan pesan ruang | `openclaw channels status --probe`     | Periksa `groupPolicy`, daftar izin ruang, dan gating penyebutan.          |
| DM tidak diproses                   | `openclaw pairing list matrix`         | Setujui pengirim atau sesuaikan kebijakan DM.                             |
| Ruang terenkripsi gagal             | `openclaw matrix verify status`        | Verifikasi ulang perangkat, lalu periksa `openclaw matrix verify backup status`. |
| Pemulihan cadangan tertunda/rusak   | `openclaw matrix verify backup status` | Jalankan `openclaw matrix verify backup restore` atau jalankan ulang dengan kunci pemulihan. |
| Penandatanganan silang/bootstrap terlihat salah | `openclaw matrix verify bootstrap`     | Perbaiki penyimpanan rahasia, penandatanganan silang, dan status cadangan dalam satu proses. |

Penyiapan dan konfigurasi lengkap: [Matrix](/id/channels/matrix)

## Terkait

- [Pairing](/id/channels/pairing)
- [Perutean channel](/id/channels/channel-routing)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
