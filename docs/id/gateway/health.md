---
read_when:
    - Mendiagnosis konektivitas saluran atau kesehatan Gateway
    - Memahami perintah dan opsi CLI untuk pemeriksaan kesehatan
summary: Perintah pemeriksaan kesehatan dan pemantauan kesehatan Gateway
title: Pemeriksaan kesehatan
x-i18n:
    generated_at: "2026-04-30T09:49:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

Panduan singkat untuk memverifikasi konektivitas channel tanpa menebak.

## Pemeriksaan cepat

- `openclaw status` — ringkasan lokal: keterjangkauan/mode gateway, petunjuk pembaruan, usia auth channel tertaut, sesi + aktivitas terbaru.
- `openclaw status --all` — diagnosis lokal lengkap (hanya baca, berwarna, aman ditempel untuk debugging).
- `openclaw status --deep` — meminta gateway yang berjalan untuk probe kesehatan live (`health` dengan `probe:true`), termasuk probe channel per akun jika didukung.
- `openclaw health` — meminta gateway yang berjalan untuk snapshot kesehatannya (hanya WS; tidak ada soket channel langsung dari CLI).
- `openclaw health --verbose` — memaksa probe kesehatan live dan mencetak detail koneksi gateway.
- `openclaw health --json` — output snapshot kesehatan yang dapat dibaca mesin.
- Kirim `/status` sebagai pesan mandiri di WhatsApp/WebChat untuk mendapatkan balasan status tanpa memanggil agen.
- Log: tail `/tmp/openclaw/openclaw-*.log` dan filter untuk `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostik mendalam

- Kredensial di disk: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime seharusnya baru).
- Penyimpanan sesi: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (path dapat ditimpa di konfigurasi). Jumlah dan penerima terbaru ditampilkan melalui `status`.
- Alur tautkan ulang: `openclaw channels logout && openclaw channels login --verbose` saat kode status 409–515 atau `loggedOut` muncul di log. (Catatan: alur login QR otomatis dimulai ulang sekali untuk status 515 setelah pairing.)
- Diagnostik diaktifkan secara default. Gateway mencatat fakta operasional kecuali `diagnostics.enabled: false` disetel. Peristiwa memori mencatat jumlah byte RSS/heap, tekanan ambang batas, dan tekanan pertumbuhan. Peringatan liveness mencatat penundaan event-loop, utilisasi event-loop, rasio CPU-core, dan jumlah sesi aktif/menunggu/antrean saat proses berjalan tetapi jenuh. Peristiwa payload terlalu besar mencatat apa yang ditolak, dipotong, atau dipecah menjadi chunk, beserta ukuran dan batas jika tersedia. Peristiwa tersebut tidak mencatat teks pesan, isi lampiran, body webhook, body permintaan atau respons mentah, token, cookie, atau nilai rahasia. Heartbeat yang sama memulai perekam stabilitas terbatas, yang tersedia melalui `openclaw gateway stability` atau RPC Gateway `diagnostics.stability`. Exit Gateway fatal, timeout shutdown, dan kegagalan startup restart mempertahankan snapshot perekam terbaru di bawah `~/.openclaw/logs/stability/` saat ada peristiwa; periksa bundle tersimpan terbaru dengan `openclaw gateway stability --bundle latest`.
- Untuk laporan bug, jalankan `openclaw gateway diagnostics export` dan lampirkan zip yang dihasilkan. Ekspor menggabungkan ringkasan Markdown, bundle stabilitas terbaru, metadata log yang disanitasi, snapshot status/kesehatan Gateway yang disanitasi, dan bentuk konfigurasi. Ini dimaksudkan untuk dibagikan: teks chat, body webhook, output tool, kredensial, cookie, pengenal akun/pesan, dan nilai rahasia dihilangkan atau disunting. Lihat [Ekspor Diagnostik](/id/gateway/diagnostics).

## Konfigurasi pemantau kesehatan

- `gateway.channelHealthCheckMinutes`: seberapa sering gateway memeriksa kesehatan channel. Default: `5`. Setel `0` untuk menonaktifkan restart pemantau kesehatan secara global.
- `gateway.channelStaleEventThresholdMinutes`: berapa lama channel yang terhubung dapat tetap idle sebelum pemantau kesehatan menganggapnya stale dan memulai ulangnya. Default: `30`. Jaga agar nilai ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: batas bergulir satu jam untuk restart pemantau kesehatan per channel/akun. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: nonaktifkan restart pemantau kesehatan untuk channel tertentu sambil tetap mengaktifkan pemantauan global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-akun yang mengalahkan pengaturan tingkat channel.
- Override per channel ini berlaku untuk pemantau channel bawaan yang mengeksposnya saat ini: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, dan WhatsApp.

## Saat terjadi kegagalan

- `logged out` atau status 409–515 → tautkan ulang dengan `openclaw channels logout` lalu `openclaw channels login`.
- Gateway tidak dapat dijangkau → mulai: `openclaw gateway --port 18789` (gunakan `--force` jika port sibuk).
- Tidak ada pesan masuk → pastikan ponsel tertaut online dan pengirim diizinkan (`channels.whatsapp.allowFrom`); untuk chat grup, pastikan allowlist + aturan mention cocok (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Perintah khusus "health"

`openclaw health` meminta gateway yang berjalan untuk snapshot kesehatannya (tidak ada soket channel langsung dari CLI). Secara default, perintah ini dapat mengembalikan snapshot gateway cache yang baru; gateway lalu menyegarkan cache tersebut di latar belakang. `openclaw health --verbose` memaksa probe live sebagai gantinya. Perintah ini melaporkan usia kredensial/auth tertaut jika tersedia, ringkasan probe per channel, ringkasan penyimpanan sesi, dan durasi probe. Perintah ini keluar dengan non-zero jika gateway tidak dapat dijangkau atau probe gagal/timeout.

Opsi:

- `--json`: output JSON yang dapat dibaca mesin
- `--timeout <ms>`: timpa timeout probe default 10 detik
- `--verbose`: paksa probe live dan cetak detail koneksi gateway
- `--debug`: alias untuk `--verbose`

Snapshot kesehatan mencakup: `ok` (boolean), `ts` (timestamp), `durationMs` (waktu probe), status per channel, ketersediaan agen, dan ringkasan penyimpanan sesi.

## Terkait

- [Runbook Gateway](/id/gateway)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
