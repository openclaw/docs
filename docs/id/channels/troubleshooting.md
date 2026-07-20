---
read_when:
    - Transport channel menyatakan terhubung, tetapi balasan gagal
    - Anda memerlukan pemeriksaan khusus kanal sebelum dokumentasi penyedia yang mendalam
summary: Pemecahan masalah tingkat saluran secara cepat dengan ciri kegagalan dan perbaikan untuk setiap saluran
title: Pemecahan masalah channel
x-i18n:
    generated_at: "2026-07-20T03:43:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3891595e4b5aca9de7997a6e908fa1c9246579032bfdfa1656a6992d644c3ecc
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gunakan halaman ini ketika suatu channel terhubung tetapi perilakunya salah.

## Tahapan perintah

Jalankan perintah berikut secara berurutan terlebih dahulu:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Kondisi dasar yang sehat:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, atau `admin-capable`
- Pemeriksaan channel menunjukkan bahwa transport terhubung dan, jika didukung, `works` atau `audit ok`

## Setelah pembaruan

Gunakan langkah ini ketika Telegram, iMessage, konfigurasi era BlueBubbles, atau channel plugin lain menghilang
setelah pembaruan.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Cari `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` di `openclaw
status --all`. Ini berarti channel telah dikonfigurasi, tetapi penyiapan/pemuatan plugin menemui pohon
dependensi yang rusak alih-alih mendaftarkan channel. `openclaw doctor --fix` membersihkan symlink dependensi
runtime plugin yang usang dan bayangan autentikasi yang usang, lalu `openclaw gateway restart` memuat ulang
status yang bersih.

## WhatsApp

### Tanda-tanda kegagalan WhatsApp

| Gejala                              | Pemeriksaan tercepat                                  | Perbaikan                                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Terhubung tetapi DM tidak dibalas   | `openclaw pairing list whatsapp`                                    | Setujui pengirim atau ubah kebijakan/daftar yang diizinkan untuk DM.                                                                      |
| Pesan grup diabaikan                | Periksa `requireMention` + pola penyebutan dalam konfigurasi | Sebut bot atau longgarkan kebijakan penyebutan untuk grup tersebut.                                                               |
| Login QR berakhir dengan 408        | Periksa Gateway `HTTPS_PROXY` / lingkungan `HTTP_PROXY` | Tetapkan proksi yang dapat dijangkau; gunakan `NO_PROXY` hanya untuk bypass.                                               |
| Siklus pemutusan/login ulang acak   | `openclaw channels status --probe` + log                              | Koneksi ulang terbaru ditandai meskipun saat ini terhubung; pantau log, mulai ulang Gateway, lalu tautkan ulang jika kondisi tidak stabil berlanjut. |
| Siklus `status=408 Request Time-out`           | Pemeriksaan, log, doctor, lalu status Gateway          | Perbaiki konektivitas/pengaturan waktu host terlebih dahulu; cadangkan autentikasi dan tautkan ulang akun jika siklus berlanjut.            |
| Balasan terlambat beberapa detik/menit | `openclaw doctor --fix`                                  | Doctor menghentikan klien TUI lokal usang yang telah diverifikasi ketika klien tersebut menurunkan kinerja perulangan peristiwa Gateway.    |

Pemecahan masalah lengkap: [Pemecahan masalah WhatsApp](/id/channels/whatsapp#troubleshooting)

## Telegram

### Tanda-tanda kegagalan Telegram

| Gejala                                      | Pemeriksaan tercepat                              | Perbaikan                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start` tetapi tidak ada alur balasan yang dapat digunakan | `openclaw pairing list telegram`                    | Setujui pemasangan atau ubah kebijakan DM.                                                                                       |
| Bot daring tetapi grup tetap diam           | Verifikasi persyaratan penyebutan dan mode privasi bot | Nonaktifkan mode privasi agar grup terlihat atau sebut bot.                                                                |
| Pengiriman gagal karena kesalahan jaringan  | Periksa log untuk kegagalan panggilan API Telegram | Perbaiki perutean DNS/IPv6/proksi ke `api.telegram.org`.                                                                         |
| Saat mulai dilaporkan `getMe returned 401`    | Periksa sumber token yang dikonfigurasi           | Salin ulang atau buat ulang token BotFather dan perbarui `botToken`, `tokenFile`, atau `TELEGRAM_BOT_TOKEN` akun default. |
| Polling terhenti atau lambat terhubung ulang | `openclaw logs --follow` untuk diagnostik polling      | Lakukan peningkatan; kondisi terhenti yang terus terjadi biasanya menunjukkan masalah proksi/DNS/IPv6.                           |
| `setMyCommands` ditolak saat mulai       | Periksa log untuk `BOT_COMMANDS_TOO_MUCH`               | Kurangi perintah plugin/skill/Telegram khusus atau nonaktifkan menu native.                                                       |
| Setelah peningkatan, daftar yang diizinkan memblokir Anda | `openclaw security audit` dan daftar yang diizinkan dalam konfigurasi | Jalankan `openclaw doctor --fix` atau ganti `@username` dengan ID pengirim numerik.                         |

Pemecahan masalah lengkap: [Pemecahan masalah Telegram](/id/channels/telegram#troubleshooting)

## Discord

### Tanda-tanda kegagalan Discord

| Gejala                                      | Pemeriksaan tercepat                                                                                                          | Perbaikan                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot daring tetapi guild tidak dibalas       | `openclaw channels status --probe`                                                                                                            | Izinkan guild/channel dan verifikasi intent konten pesan.                                                                                                                                                                                                                            |
| Pesan grup diabaikan                        | Periksa log untuk pesan yang dibuang karena pembatasan penyebutan                                                              | Sebut bot atau tetapkan `requireMention: false` guild/channel.                                                                                                                                                                                                                            |
| Penggunaan pengetikan/token tetapi tidak ada pesan Discord | Periksa apakah ini merupakan peristiwa ruang ambien atau ruang `message_tool` yang telah diaktifkan tempat model melewatkan `message(action=send)` | Periksa log verbose Gateway untuk metadata muatan akhir yang disembunyikan, verifikasi `messages.groupChat.unmentionedInbound`, baca [Peristiwa ruang ambien](/id/channels/ambient-room-events), atau pertahankan `messages.groupChat.visibleReplies: "automatic"` untuk permintaan grup normal. |
| Balasan DM tidak ada                        | `openclaw pairing list discord`                                                                                                            | Setujui pemasangan DM atau sesuaikan kebijakan DM.                                                                                                                                                                                                                                   |

Pemecahan masalah lengkap: [Pemecahan masalah Discord](/id/channels/discord#troubleshooting)

## Slack

### Tanda-tanda kegagalan Slack

| Gejala                                      | Pemeriksaan tercepat                                | Perbaikan                                                                                                                                                  |
| ------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mode soket terhubung tetapi tidak ada respons | `openclaw channels status --probe`                                | Verifikasi token aplikasi + token bot dan cakupan yang diwajibkan; perhatikan `botTokenStatus` / `appTokenStatus = configured_unavailable` pada penyiapan berbasis SecretRef. |
| DM diblokir                                 | `openclaw pairing list slack`                                  | Setujui pemasangan atau longgarkan kebijakan DM.                                                                                                           |
| Pesan channel diabaikan                     | Periksa `groupPolicy` dan daftar channel yang diizinkan | Izinkan channel atau ubah kebijakan menjadi `open`.                                                                                   |

Pemecahan masalah lengkap: [Pemecahan masalah Slack](/id/channels/slack#troubleshooting)

## iMessage

### Tanda-tanda kegagalan iMessage

| Gejala                                        | Pemeriksaan tercepat                                      | Perbaikan                                                                      |
| --------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `imsg` tidak ada atau gagal pada selain macOS | `openclaw channels status --probe --channel imessage`                          | Jalankan OpenClaw di Mac Messages atau gunakan pembungkus SSH untuk `cliPath`. |
| Dapat mengirim tetapi tidak menerima di macOS | Periksa izin privasi macOS untuk otomatisasi Messages     | Berikan kembali izin TCC dan mulai ulang proses channel.                       |
| Pengirim DM diblokir                          | `openclaw pairing list imessage`                                        | Setujui pemasangan atau perbarui daftar yang diizinkan.                        |

Pemecahan masalah lengkap: [Pemecahan masalah iMessage](/id/channels/imessage#troubleshooting)

## Signal

### Tanda-tanda kegagalan Signal

| Gejala                             | Pemeriksaan tercepat                            | Perbaikan                                                        |
| ---------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| Daemon dapat dijangkau tetapi bot diam | `openclaw channels status --probe`                          | Verifikasi URL/akun daemon `signal-cli` dan mode penerimaan. |
| DM diblokir                        | `openclaw pairing list signal`                              | Setujui pengirim atau sesuaikan kebijakan DM.                    |
| Balasan grup tidak terpicu         | Periksa daftar grup yang diizinkan dan pola penyebutan | Tambahkan pengirim/grup atau longgarkan pembatasan.          |

Pemecahan masalah lengkap: [Pemecahan masalah Signal](/id/channels/signal#troubleshooting)

## QQ Bot

### Tanda-tanda kegagalan QQ Bot

| Gejala                                | Pemeriksaan tercepat                                | Perbaikan                                                              |
| ------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| Bot membalas "pergi ke Mars"          | Verifikasi `appId` dan `clientSecret` dalam konfigurasi | Tetapkan kredensial atau mulai ulang Gateway.                |
| Tidak ada pesan masuk                 | `openclaw channels status --probe`                                  | Verifikasi kredensial di QQ Open Platform.                             |
| Suara tidak ditranskripsikan          | Periksa konfigurasi penyedia STT                     | Konfigurasikan `channels.qqbot.stt` atau `tools.media.audio`.             |
| Pesan proaktif tidak diterima         | Periksa persyaratan interaksi platform QQ            | QQ dapat memblokir pesan yang dimulai bot tanpa interaksi terbaru.     |

Pemecahan masalah lengkap: [Pemecahan masalah QQ Bot](/id/channels/qqbot#troubleshooting)

## Matrix

### Tanda-tanda kegagalan Matrix

| Gejala                              | Pemeriksaan tercepat                   | Perbaikan                                                                 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Sudah masuk tetapi mengabaikan pesan ruang | `openclaw channels status --probe`     | Periksa `groupPolicy`, daftar izin ruang, dan pembatasan penyebutan. |
| DM tidak diproses                   | `openclaw pairing list matrix`         | Setujui pengirim atau sesuaikan kebijakan DM.                             |
| Ruang terenkripsi gagal             | `openclaw matrix verify status`        | Verifikasi ulang perangkat, lalu periksa `openclaw matrix verify backup status`.              |
| Pemulihan cadangan tertunda/rusak   | `openclaw matrix verify backup status` | Jalankan `openclaw matrix verify backup restore` atau jalankan ulang dengan kunci pemulihan.   |
| Penandatanganan silang/bootstrap tampak keliru | `openclaw matrix verify bootstrap`     | Perbaiki penyimpanan rahasia, penandatanganan silang, dan status cadangan sekaligus. |

Penyiapan dan konfigurasi lengkap: [Matrix](/id/channels/matrix)

## Terkait

- [Pemasangan](/id/channels/pairing)
- [Perutean kanal](/id/channels/channel-routing)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
