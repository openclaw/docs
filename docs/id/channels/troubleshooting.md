---
read_when:
    - Transport kanal menyatakan terhubung, tetapi balasan gagal
    - Anda memerlukan pemeriksaan khusus kanal sebelum dokumentasi penyedia yang mendalam
summary: Pemecahan masalah cepat pada tingkat saluran dengan ciri kegagalan dan perbaikan untuk setiap saluran
title: Pemecahan masalah saluran
x-i18n:
    generated_at: "2026-07-12T13:58:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Gunakan halaman ini ketika suatu channel terhubung tetapi perilakunya tidak benar.

## Urutan perintah

Jalankan perintah berikut secara berurutan terlebih dahulu:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Tolok ukur kondisi sehat:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, atau `admin-capable`
- Probe channel menunjukkan transport terhubung dan, jika didukung, `works` atau `audit ok`

## Setelah pembaruan

Gunakan langkah ini ketika Telegram, iMessage, konfigurasi era BlueBubbles, atau channel Plugin lainnya menghilang
setelah pembaruan.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Cari `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` dalam `openclaw
status --all`. Ini berarti channel telah dikonfigurasi, tetapi penyiapan/pemuatan Plugin mengalami kerusakan
pohon dependensi sehingga tidak mendaftarkan channel. `openclaw doctor --fix` menghapus
symlink dependensi runtime Plugin yang kedaluwarsa dan bayangan autentikasi yang kedaluwarsa, lalu `openclaw gateway restart` memuat ulang
status yang bersih.

## WhatsApp

### Ciri-ciri kegagalan WhatsApp

| Gejala                              | Pemeriksaan tercepat                                 | Perbaikan                                                                                                                                 |
| ----------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Terhubung tetapi tidak ada balasan DM | `openclaw pairing list whatsapp`                   | Setujui pengirim atau ubah kebijakan/daftar izin DM.                                                                                      |
| Pesan grup diabaikan                | Periksa `requireMention` + pola penyebutan dalam konfigurasi | Sebut bot atau longgarkan kebijakan penyebutan untuk grup tersebut.                                                               |
| Waktu masuk login QR habis dengan 408 | Periksa env `HTTPS_PROXY` / `HTTP_PROXY` Gateway   | Tetapkan proksi yang dapat dijangkau; gunakan `NO_PROXY` hanya untuk pengecualian.                                                        |
| Pemutusan/siklus login ulang acak   | `openclaw channels status --probe` + log             | Penyambungan ulang terbaru ditandai meskipun saat ini terhubung; pantau log, mulai ulang Gateway, lalu tautkan ulang jika ketidakstabilan berlanjut. |
| Siklus `status=408 Request Time-out` | Probe, log, doctor, lalu status Gateway             | Perbaiki konektivitas/pengaturan waktu host terlebih dahulu; cadangkan autentikasi dan tautkan ulang akun jika siklus berlanjut.          |
| Balasan tiba terlambat beberapa detik/menit | `openclaw doctor --fix`                       | Doctor menghentikan klien TUI lokal kedaluwarsa yang telah diverifikasi ketika klien tersebut menurunkan kinerja perulangan peristiwa Gateway. |

Pemecahan masalah lengkap: [Pemecahan masalah WhatsApp](/id/channels/whatsapp#troubleshooting)

## Telegram

### Ciri-ciri kegagalan Telegram

| Gejala                               | Pemeriksaan tercepat                                | Perbaikan                                                                                                                     |
| ------------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/start` tetapi tidak ada alur balasan yang dapat digunakan | `openclaw pairing list telegram` | Setujui pemasangan atau ubah kebijakan DM.                                                                                   |
| Bot daring tetapi grup tetap diam    | Verifikasi persyaratan penyebutan dan mode privasi bot | Nonaktifkan mode privasi agar grup terlihat atau sebut bot.                                                                |
| Pengiriman gagal dengan kesalahan jaringan | Periksa log untuk kegagalan panggilan API Telegram | Perbaiki perutean DNS/IPv6/proksi ke `api.telegram.org`.                                                                    |
| Saat dimulai, muncul laporan `getMe returned 401` | Periksa sumber token yang dikonfigurasi | Salin ulang atau buat ulang token BotFather dan perbarui `botToken`, `tokenFile`, atau `TELEGRAM_BOT_TOKEN` akun bawaan. |
| Polling macet atau lambat tersambung kembali | Periksa diagnostik polling dengan `openclaw logs --follow` | Tingkatkan versi; jika pemulaian ulang adalah positif palsu, sesuaikan `pollingStallThresholdMs`. Kemacetan berkelanjutan tetap menunjukkan masalah proksi/DNS/IPv6. |
| `setMyCommands` ditolak saat dimulai | Periksa log untuk `BOT_COMMANDS_TOO_MUCH`           | Kurangi perintah Plugin/skill/kustom Telegram atau nonaktifkan menu native.                                                   |
| Setelah peningkatan versi, daftar izin memblokir Anda | `openclaw security audit` dan daftar izin konfigurasi | Jalankan `openclaw doctor --fix` atau ganti `@username` dengan ID pengirim numerik.                                         |

Pemecahan masalah lengkap: [Pemecahan masalah Telegram](/id/channels/telegram#troubleshooting)

## Discord

### Ciri-ciri kegagalan Discord

| Gejala                                    | Pemeriksaan tercepat                                                                                                           | Perbaikan                                                                                                                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bot daring tetapi tidak ada balasan guild | `openclaw channels status --probe`                                                                                             | Izinkan guild/channel dan verifikasi intent konten pesan.                                                                                                                                                                                                                      |
| Pesan grup diabaikan                      | Periksa log untuk pesan yang dihapus oleh pembatasan penyebutan                                                                | Sebut bot atau tetapkan `requireMention: false` untuk guild/channel.                                                                                                                                                                                                            |
| Penggunaan pengetikan/token tetapi tidak ada pesan Discord | Periksa apakah ini peristiwa ruang ambient atau ruang `message_tool` yang ikut serta, tempat model melewatkan `message(action=send)` | Periksa log verbose Gateway untuk metadata payload akhir yang ditekan, verifikasi `messages.groupChat.unmentionedInbound`, baca [Peristiwa ruang ambient](/id/channels/ambient-room-events), atau pertahankan `messages.groupChat.visibleReplies: "automatic"` untuk permintaan grup normal. |
| Balasan DM tidak ada                      | `openclaw pairing list discord`                                                                                                | Setujui pemasangan DM atau sesuaikan kebijakan DM.                                                                                                                                                                                                                              |

Pemecahan masalah lengkap: [Pemecahan masalah Discord](/id/channels/discord#troubleshooting)

## Slack

### Ciri-ciri kegagalan Slack

| Gejala                                  | Pemeriksaan tercepat                          | Perbaikan                                                                                                                                                           |
| --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mode soket terhubung tetapi tidak ada respons | `openclaw channels status --probe`      | Verifikasi token aplikasi + token bot serta cakupan yang diperlukan; perhatikan `botTokenStatus` / `appTokenStatus = configured_unavailable` pada penyiapan berbasis SecretRef. |
| DM diblokir                             | `openclaw pairing list slack`                 | Setujui pemasangan atau longgarkan kebijakan DM.                                                                                                                    |
| Pesan channel diabaikan                 | Periksa `groupPolicy` dan daftar izin channel | Izinkan channel atau ubah kebijakan menjadi `open`.                                                                                                                 |

Pemecahan masalah lengkap: [Pemecahan masalah Slack](/id/channels/slack#troubleshooting)

## iMessage

### Ciri-ciri kegagalan iMessage

| Gejala                               | Pemeriksaan tercepat                                      | Perbaikan                                                                       |
| ------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `imsg` tidak ada atau gagal pada non-macOS | `openclaw channels status --probe --channel imessage` | Jalankan OpenClaw pada Mac yang menjalankan Messages atau gunakan pembungkus SSH untuk `cliPath`. |
| Dapat mengirim tetapi tidak menerima di macOS | Periksa izin privasi macOS untuk otomatisasi Messages | Berikan kembali izin TCC dan mulai ulang proses channel.                        |
| Pengirim DM diblokir                 | `openclaw pairing list imessage`                          | Setujui pemasangan atau perbarui daftar izin.                                   |

Pemecahan masalah lengkap: [Pemecahan masalah iMessage](/id/channels/imessage#troubleshooting)

## Signal

### Ciri-ciri kegagalan Signal

| Gejala                              | Pemeriksaan tercepat                         | Perbaikan                                                        |
| ----------------------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| Daemon dapat dijangkau tetapi bot diam | `openclaw channels status --probe`        | Verifikasi URL/akun daemon `signal-cli` dan mode penerimaan.     |
| DM diblokir                         | `openclaw pairing list signal`               | Setujui pengirim atau sesuaikan kebijakan DM.                    |
| Balasan grup tidak terpicu          | Periksa daftar izin grup dan pola penyebutan | Tambahkan pengirim/grup atau longgarkan pembatasan.              |

Pemecahan masalah lengkap: [Pemecahan masalah Signal](/id/channels/signal#troubleshooting)

## Bot QQ

### Ciri-ciri kegagalan Bot QQ

| Gejala                                | Pemeriksaan tercepat                           | Perbaikan                                                               |
| ------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| Bot membalas "gone to Mars"           | Verifikasi `appId` dan `clientSecret` dalam konfigurasi | Tetapkan kredensial atau mulai ulang Gateway.                   |
| Tidak ada pesan masuk                 | `openclaw channels status --probe`             | Verifikasi kredensial di QQ Open Platform.                              |
| Suara tidak ditranskripsikan          | Periksa konfigurasi penyedia STT               | Konfigurasikan `channels.qqbot.stt` atau `tools.media.audio`.            |
| Pesan proaktif tidak tiba             | Periksa persyaratan interaksi platform QQ      | QQ mungkin memblokir pesan yang dimulai bot tanpa interaksi terbaru.    |

Pemecahan masalah lengkap: [Pemecahan masalah Bot QQ](/id/channels/qqbot#troubleshooting)

## Matrix

### Pola kegagalan Matrix

| Gejala                                       | Pemeriksaan tercepat                    | Perbaikan                                                                                  |
| -------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| Sudah masuk tetapi mengabaikan pesan ruangan | `openclaw channels status --probe`      | Periksa `groupPolicy`, daftar izin ruangan, dan pembatasan berdasarkan penyebutan.          |
| Pesan langsung tidak diproses                | `openclaw pairing list matrix`          | Setujui pengirim atau sesuaikan kebijakan pesan langsung.                                  |
| Ruangan terenkripsi gagal                    | `openclaw matrix verify status`         | Verifikasi ulang perangkat, lalu periksa `openclaw matrix verify backup status`.            |
| Pemulihan cadangan tertunda/rusak            | `openclaw matrix verify backup status`  | Jalankan `openclaw matrix verify backup restore` atau jalankan ulang dengan kunci pemulihan. |
| Penandatanganan silang/bootstrap tampak salah | `openclaw matrix verify bootstrap`      | Perbaiki penyimpanan rahasia, penandatanganan silang, dan status cadangan sekaligus.         |

Penyiapan dan konfigurasi lengkap: [Matrix](/id/channels/matrix)

## Terkait

- [Pemasangan](/id/channels/pairing)
- [Perutean kanal](/id/channels/channel-routing)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
