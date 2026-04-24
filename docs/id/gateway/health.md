---
read_when:
    - Mendiagnosis konektivitas kanal atau kesehatan gateway
    - Memahami perintah dan opsi CLI pemeriksaan kesehatan
summary: Perintah pemeriksaan kesehatan dan pemantauan kesehatan gateway
title: Pemeriksaan kesehatan
x-i18n:
    generated_at: "2026-04-24T09:08:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08278ff0079102459c4d9141dc2e8d89e731de1fc84487f6baa620aaf7c119b4
    source_path: gateway/health.md
    workflow: 15
---

# Pemeriksaan Kesehatan (CLI)

Panduan singkat untuk memverifikasi konektivitas kanal tanpa menebak-nebak.

## Pemeriksaan cepat

- `openclaw status` — ringkasan lokal: keterjangkauan/mode gateway, petunjuk pembaruan, usia auth kanal yang tertaut, sesi + aktivitas terbaru.
- `openclaw status --all` — diagnosis lokal penuh (hanya-baca, berwarna, aman untuk ditempel saat debugging).
- `openclaw status --deep` — meminta gateway yang sedang berjalan untuk probe kesehatan langsung (`health` dengan `probe:true`), termasuk probe kanal per akun jika didukung.
- `openclaw health` — meminta gateway yang sedang berjalan untuk snapshot kesehatannya (khusus WS; tidak ada socket kanal langsung dari CLI).
- `openclaw health --verbose` — memaksa probe kesehatan langsung dan mencetak detail koneksi gateway.
- `openclaw health --json` — output snapshot kesehatan yang dapat dibaca mesin.
- Kirim `/status` sebagai pesan mandiri di WhatsApp/WebChat untuk mendapatkan balasan status tanpa memanggil agen.
- Log: tail `/tmp/openclaw/openclaw-*.log` dan filter untuk `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostik mendalam

- Kredensial di disk: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime harus baru).
- Penyimpanan sesi: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (path dapat dioverride di konfigurasi). Jumlah dan penerima terbaru ditampilkan melalui `status`.
- Alur relink: `openclaw channels logout && openclaw channels login --verbose` saat kode status 409–515 atau `loggedOut` muncul di log. (Catatan: alur login QR otomatis restart sekali untuk status 515 setelah pairing.)
- Diagnostik aktif secara default. Gateway mencatat fakta operasional kecuali `diagnostics.enabled: false` diatur. Peristiwa memori mencatat jumlah byte RSS/heap, tekanan ambang, dan tekanan pertumbuhan. Peristiwa payload yang terlalu besar mencatat apa yang ditolak, dipotong, atau dipecah, plus ukuran dan batas jika tersedia. Peristiwa ini tidak mencatat teks pesan, isi lampiran, body Webhook, body permintaan atau respons mentah, token, cookie, atau nilai secret. Heartbeat yang sama memulai perekam stabilitas terbatas, yang tersedia melalui `openclaw gateway stability` atau Gateway RPC `diagnostics.stability`. Keluar Gateway fatal, timeout shutdown, dan kegagalan startup restart menyimpan snapshot perekam terbaru di bawah `~/.openclaw/logs/stability/` ketika ada peristiwa; periksa bundle tersimpan terbaru dengan `openclaw gateway stability --bundle latest`.
- Untuk laporan bug, jalankan `openclaw gateway diagnostics export` dan lampirkan zip yang dihasilkan. Ekspor tersebut menggabungkan ringkasan Markdown, bundle stabilitas terbaru, metadata log yang disanitasi, snapshot status/kesehatan Gateway yang disanitasi, dan bentuk konfigurasi. Ekspor ini memang dimaksudkan untuk dibagikan: teks chat, body Webhook, output alat, kredensial, cookie, pengenal akun/pesan, dan nilai secret dihilangkan atau disunting. Lihat [Ekspor Diagnostik](/id/gateway/diagnostics).

## Konfigurasi monitor kesehatan

- `gateway.channelHealthCheckMinutes`: seberapa sering gateway memeriksa kesehatan kanal. Default: `5`. Atur `0` untuk menonaktifkan restart monitor kesehatan secara global.
- `gateway.channelStaleEventThresholdMinutes`: berapa lama kanal yang terhubung boleh diam sebelum monitor kesehatan menganggapnya stale dan me-restart-nya. Default: `30`. Pertahankan nilai ini lebih besar atau sama dengan `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: batas rolling satu jam untuk restart monitor kesehatan per kanal/akun. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: nonaktifkan restart monitor kesehatan untuk kanal tertentu sambil tetap membiarkan pemantauan global aktif.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-akun yang menang atas pengaturan tingkat kanal.
- Override per kanal ini berlaku untuk monitor kanal bawaan yang mengeksposnya saat ini: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, dan WhatsApp.

## Saat sesuatu gagal

- `logged out` atau status 409–515 → relink dengan `openclaw channels logout` lalu `openclaw channels login`.
- Gateway tidak dapat dijangkau → mulai: `openclaw gateway --port 18789` (gunakan `--force` jika port sibuk).
- Tidak ada pesan masuk → konfirmasi ponsel yang tertaut sedang online dan pengirim diizinkan (`channels.whatsapp.allowFrom`); untuk obrolan grup, pastikan allowlist + aturan mention sesuai (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Perintah "health" khusus

`openclaw health` meminta snapshot kesehatan dari gateway yang sedang berjalan (tanpa socket kanal langsung
dari CLI). Secara default perintah ini dapat mengembalikan snapshot gateway cache yang masih segar; lalu
gateway menyegarkan cache itu di latar belakang. `openclaw health --verbose` memaksa
probe langsung sebagai gantinya. Perintah ini melaporkan usia kredensial/auth tertaut jika tersedia,
ringkasan probe per kanal, ringkasan penyimpanan sesi, dan durasi probe. Perintah ini keluar
non-zero jika gateway tidak dapat dijangkau atau probe gagal/timeout.

Opsi:

- `--json`: output JSON yang dapat dibaca mesin
- `--timeout <ms>`: override timeout probe default 10 detik
- `--verbose`: paksa probe langsung dan cetak detail koneksi gateway
- `--debug`: alias untuk `--verbose`

Snapshot kesehatan mencakup: `ok` (boolean), `ts` (timestamp), `durationMs` (waktu probe), status per kanal, ketersediaan agen, dan ringkasan penyimpanan sesi.

## Terkait

- [Runbook Gateway](/id/gateway)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
