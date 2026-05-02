---
read_when:
    - Mendiagnosis konektivitas saluran atau kesehatan Gateway
    - Memahami perintah dan opsi CLI pemeriksaan kesehatan
summary: Perintah pemeriksaan kesehatan dan pemantauan kesehatan Gateway
title: Pemeriksaan kesehatan
x-i18n:
    generated_at: "2026-05-02T09:20:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

Panduan singkat untuk memverifikasi konektivitas saluran tanpa menebak.

## Pemeriksaan cepat

- `openclaw status` — ringkasan lokal: keterjangkauan/mode Gateway, petunjuk pembaruan, usia autentikasi saluran tertaut, sesi + aktivitas terbaru.
- `openclaw status --all` — diagnosis lokal lengkap (hanya baca, berwarna, aman ditempel untuk debugging).
- `openclaw status --deep` — meminta Gateway yang berjalan untuk melakukan probe kesehatan langsung (`health` dengan `probe:true`), termasuk probe saluran per akun saat didukung.
- `openclaw health` — meminta Gateway yang berjalan untuk snapshot kesehatannya (hanya WS; tidak ada soket saluran langsung dari CLI).
- `openclaw health --verbose` — memaksa probe kesehatan langsung dan mencetak detail koneksi Gateway.
- `openclaw health --json` — keluaran snapshot kesehatan yang dapat dibaca mesin.
- Kirim `/status` sebagai pesan mandiri di WhatsApp/WebChat untuk mendapatkan balasan status tanpa memanggil agen.
- Log: tail `/tmp/openclaw/openclaw-*.log` dan filter untuk `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Untuk Discord dan penyedia chat lainnya, baris sesi bukan keaktifan soket.
`openclaw sessions`, Gateway `sessions.list`, dan tool agen `sessions_list`
membaca status percakapan yang tersimpan. Penyedia dapat tersambung ulang dan menampilkan status saluran
yang sehat sebelum baris sesi baru diwujudkan. Gunakan status saluran dan
perintah kesehatan di atas untuk pemeriksaan konektivitas langsung.

## Diagnostik mendalam

- Kredensial di disk: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime seharusnya terbaru).
- Penyimpanan sesi: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (jalur dapat ditimpa dalam konfigurasi). Jumlah dan penerima terbaru ditampilkan melalui `status`.
- Alur penautan ulang: `openclaw channels logout && openclaw channels login --verbose` ketika kode status 409–515 atau `loggedOut` muncul di log. (Catatan: alur login QR otomatis dimulai ulang sekali untuk status 515 setelah pairing.)
- Diagnostik diaktifkan secara default. Gateway mencatat fakta operasional kecuali `diagnostics.enabled: false` disetel. Peristiwa memori mencatat jumlah byte RSS/heap, tekanan ambang batas, dan tekanan pertumbuhan. Peringatan keaktifan mencatat penundaan event-loop, utilisasi event-loop, rasio inti CPU, dan jumlah sesi aktif/menunggu/antrean ketika proses berjalan tetapi jenuh. Peristiwa payload terlalu besar mencatat apa yang ditolak, dipotong, atau dipecah menjadi chunk, plus ukuran dan batas jika tersedia. Peristiwa tersebut tidak mencatat teks pesan, isi lampiran, isi Webhook, isi permintaan atau respons mentah, token, cookie, atau nilai rahasia. Heartbeat yang sama memulai perekam stabilitas terbatas, yang tersedia melalui `openclaw gateway stability` atau RPC Gateway `diagnostics.stability`. Keluarnya Gateway secara fatal, timeout shutdown, dan kegagalan startup restart mempertahankan snapshot perekam terbaru di bawah `~/.openclaw/logs/stability/` ketika peristiwa ada; periksa bundel tersimpan terbaru dengan `openclaw gateway stability --bundle latest`.
- Untuk laporan bug, jalankan `openclaw gateway diagnostics export` dan lampirkan zip yang dihasilkan. Ekspor menggabungkan ringkasan Markdown, bundel stabilitas terbaru, metadata log yang disanitasi, snapshot status/kesehatan Gateway yang disanitasi, dan bentuk konfigurasi. Ini dimaksudkan untuk dibagikan: teks chat, isi Webhook, keluaran tool, kredensial, cookie, pengidentifikasi akun/pesan, dan nilai rahasia dihilangkan atau disunting. Lihat [Ekspor Diagnostik](/id/gateway/diagnostics).

## Konfigurasi monitor kesehatan

- `gateway.channelHealthCheckMinutes`: seberapa sering Gateway memeriksa kesehatan saluran. Default: `5`. Setel `0` untuk menonaktifkan restart monitor kesehatan secara global.
- `gateway.channelStaleEventThresholdMinutes`: berapa lama saluran yang tersambung dapat tetap idle sebelum monitor kesehatan menganggapnya stale dan memulainya ulang. Default: `30`. Pertahankan ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: batas bergulir satu jam untuk restart monitor kesehatan per saluran/akun. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: menonaktifkan restart monitor kesehatan untuk saluran tertentu sambil membiarkan pemantauan global tetap aktif.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-akun yang mengungguli pengaturan tingkat saluran.
- Override per saluran ini berlaku untuk monitor saluran bawaan yang mengeksposnya saat ini: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, dan WhatsApp.

## Ketika sesuatu gagal

- `logged out` atau status 409–515 → tautkan ulang dengan `openclaw channels logout` lalu `openclaw channels login`.
- Gateway tidak dapat dijangkau → mulai: `openclaw gateway --port 18789` (gunakan `--force` jika port sedang sibuk).
- Tidak ada pesan masuk → pastikan ponsel tertaut sedang online dan pengirim diizinkan (`channels.whatsapp.allowFrom`); untuk chat grup, pastikan allowlist + aturan mention cocok (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Perintah "health" khusus

`openclaw health` meminta Gateway yang berjalan untuk snapshot kesehatannya (tidak ada soket saluran langsung
dari CLI). Secara default, perintah ini dapat mengembalikan snapshot Gateway cache yang segar; lalu
Gateway menyegarkan cache tersebut di latar belakang. `openclaw health --verbose` memaksa
probe langsung sebagai gantinya. Perintah ini melaporkan kredensial tertaut/usia autentikasi jika tersedia,
ringkasan probe per saluran, ringkasan penyimpanan sesi, dan durasi probe. Perintah ini keluar
non-nol jika Gateway tidak dapat dijangkau atau probe gagal/timeout.

Opsi:

- `--json`: keluaran JSON yang dapat dibaca mesin
- `--timeout <ms>`: menimpa timeout probe default 10 dtk
- `--verbose`: memaksa probe langsung dan mencetak detail koneksi Gateway
- `--debug`: alias untuk `--verbose`

Snapshot kesehatan mencakup: `ok` (boolean), `ts` (timestamp), `durationMs` (waktu probe), status per saluran, ketersediaan agen, dan ringkasan penyimpanan sesi.

## Terkait

- [Runbook Gateway](/id/gateway)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
