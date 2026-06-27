---
read_when:
    - Mendiagnosis konektivitas saluran atau kesehatan gateway
    - Memahami perintah dan opsi CLI pemeriksaan kesehatan
summary: Perintah pemeriksaan kesehatan dan pemantauan kesehatan Gateway
title: Pemeriksaan kesehatan
x-i18n:
    generated_at: "2026-06-27T17:30:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

Panduan singkat untuk memverifikasi konektivitas saluran tanpa menebak.

## Pemeriksaan cepat

- `openclaw status` — ringkasan lokal: keterjangkauan/mode gateway, petunjuk pembaruan, umur autentikasi saluran tertaut, sesi + aktivitas terbaru.
- `openclaw status --all` — diagnosis lokal lengkap (hanya-baca, berwarna, aman ditempel untuk debugging).
- `openclaw status --deep` — meminta Gateway yang sedang berjalan untuk probe kesehatan langsung (`health` dengan `probe:true`), termasuk probe saluran per akun jika didukung.
- `openclaw health` — meminta Gateway yang sedang berjalan untuk snapshot kesehatannya (hanya WS; tidak ada soket saluran langsung dari CLI).
- `openclaw health --verbose` — memaksa probe kesehatan langsung dan mencetak detail koneksi Gateway.
- `openclaw health --json` — keluaran snapshot kesehatan yang dapat dibaca mesin.
- Kirim `/status` sebagai pesan mandiri di WhatsApp/WebChat untuk mendapatkan balasan status tanpa memanggil agen.
- Log: tail `/tmp/openclaw/openclaw-*.log` dan filter untuk `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Untuk Discord dan penyedia chat lain, baris sesi bukan tanda soket masih hidup.
`openclaw sessions`, Gateway `sessions.list`, dan tool `sessions_list` agen
membaca status percakapan yang tersimpan. Penyedia dapat tersambung ulang dan menampilkan status
saluran yang sehat sebelum baris sesi baru diwujudkan. Gunakan status saluran dan
perintah kesehatan di atas untuk pemeriksaan konektivitas langsung.

## Diagnosis mendalam

- Kredensial di disk: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime seharusnya baru).
- Penyimpanan sesi: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (jalur dapat ditimpa di config). Jumlah dan penerima terbaru ditampilkan melalui `status`.
- Alur tautkan ulang: `openclaw channels logout && openclaw channels login --verbose` saat kode status 409–515 atau `loggedOut` muncul di log. (Catatan: alur login QR otomatis dimulai ulang sekali untuk status 515 setelah pairing.)
- Diagnosis diaktifkan secara default. Gateway mencatat fakta operasional kecuali `diagnostics.enabled: false` ditetapkan. Peristiwa memori mencatat jumlah byte RSS/heap, tekanan ambang, dan tekanan pertumbuhan. Tekanan memori kritis dicatat melalui logger Gateway. Saat `diagnostics.memoryPressureSnapshot: true` ditetapkan, tekanan memori kritis juga menulis bundel stabilitas pra-OOM dengan statistik heap V8, penghitung cgroup Linux jika tersedia, jumlah resource aktif, dan file sesi/transkrip terbesar berdasarkan jalur relatif yang disunting. Peringatan liveness mencatat penundaan event-loop, utilisasi event-loop, rasio inti CPU, dan jumlah sesi aktif/menunggu/antre saat proses berjalan tetapi jenuh. Peristiwa payload terlalu besar mencatat apa yang ditolak, dipotong, atau dipecah, beserta ukuran dan batas jika tersedia. Peristiwa ini tidak mencatat teks pesan, isi lampiran, badan Webhook, badan request atau response mentah, token, cookie, atau nilai rahasia. Heartbeat yang sama memulai perekam stabilitas berbatas, yang tersedia melalui `openclaw gateway stability` atau RPC Gateway `diagnostics.stability`. Keluar fatal Gateway, timeout shutdown, dan kegagalan startup ulang mempertahankan snapshot perekam terbaru di bawah `~/.openclaw/logs/stability/` saat peristiwa ada; tekanan memori kritis juga melakukannya hanya saat `diagnostics.memoryPressureSnapshot: true` ditetapkan. Periksa bundel tersimpan terbaru dengan `openclaw gateway stability --bundle latest`.
- Untuk laporan bug, jalankan `openclaw gateway diagnostics export` dan lampirkan zip yang dihasilkan. Ekspor ini menggabungkan ringkasan Markdown, bundel stabilitas terbaru, metadata log yang disanitasi, snapshot status/kesehatan Gateway yang disanitasi, dan bentuk config. Ini dimaksudkan untuk dibagikan: teks chat, badan Webhook, keluaran tool, kredensial, cookie, identifier akun/pesan, dan nilai rahasia dihilangkan atau disunting. Lihat [Ekspor Diagnosis](/id/gateway/diagnostics).

## Config monitor kesehatan

- `gateway.channelHealthCheckMinutes`: seberapa sering Gateway memeriksa kesehatan saluran. Default: `5`. Tetapkan `0` untuk menonaktifkan restart monitor kesehatan secara global.
- `gateway.channelStaleEventThresholdMinutes`: berapa lama saluran yang tersambung boleh tetap idle sebelum monitor kesehatan menganggapnya stale dan memulai ulangnya. Default: `30`. Pertahankan ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: batas bergulir satu jam untuk restart monitor kesehatan per saluran/akun. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: menonaktifkan restart monitor kesehatan untuk saluran tertentu sambil tetap mengaktifkan pemantauan global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-akun yang mengalahkan pengaturan tingkat saluran.
- Override per saluran ini berlaku untuk monitor saluran bawaan yang mengeksposnya saat ini: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, dan WhatsApp.

## Pemantauan uptime

Layanan pemantauan uptime eksternal harus menggunakan endpoint khusus `/health`, bukan `/v1/chat/completions`.

- **GUNAKAN:** `GET /health` — respons instan, tidak ada sesi dibuat, tidak ada panggilan LLM, mengembalikan `{"ok":true,"status":"live"}`
- **JANGAN gunakan:** `/v1/chat/completions` untuk pemeriksaan kesehatan — setiap request membuat sesi agen lengkap dengan snapshot Skills, penyusunan konteks, dan panggilan LLM

Saat tidak ada header `x-openclaw-session-key` atau field `user` yang diberikan, `/v1/chat/completions` menghasilkan sesi acak baru untuk setiap request. Layanan pemantauan yang melakukan ping setiap 15 menit membuat ~96 sesi/hari, masing-masing mengonsumsi 4–22KB. Seiring waktu ini menyebabkan penyimpanan sesi membengkak dan dapat menyebabkan overflow jendela konteks.

### Contoh penyiapan layanan pemantauan

- **BetterStack:** Tetapkan URL pemeriksaan kesehatan ke `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Tambahkan monitor HTTP baru dengan URL `https://<your-gateway-host>:<port>/health`
- **Generik:** HTTP GET apa pun ke `/health` mengembalikan 200 dengan `{"ok":true}` saat Gateway sehat

## Saat sesuatu gagal

- `logged out` atau status 409–515 → tautkan ulang dengan `openclaw channels logout` lalu `openclaw channels login`.
- Gateway tidak terjangkau → mulai: `openclaw gateway --port 18789` (gunakan `--force` jika port sedang dipakai).
- Tidak ada pesan masuk → pastikan ponsel tertaut online dan pengirim diizinkan (`channels.whatsapp.allowFrom`); untuk chat grup, pastikan allowlist + aturan mention cocok (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Perintah khusus "health"

`openclaw health` meminta Gateway yang sedang berjalan untuk snapshot kesehatannya (tidak ada soket saluran langsung
dari CLI). Secara default perintah ini dapat mengembalikan snapshot Gateway cache yang baru; lalu
Gateway menyegarkan cache tersebut di latar belakang. `openclaw health --verbose` memaksa
probe langsung sebagai gantinya. Perintah ini melaporkan kredensial tertaut/umur autentikasi jika tersedia,
ringkasan probe per saluran, ringkasan penyimpanan sesi, dan durasi probe. Perintah keluar
non-zero jika Gateway tidak terjangkau atau probe gagal/timeout.

Opsi:

- `--json`: keluaran JSON yang dapat dibaca mesin
- `--timeout <ms>`: menimpa timeout probe default 10s
- `--verbose`: memaksa probe langsung dan mencetak detail koneksi Gateway
- `--debug`: alias untuk `--verbose`

Snapshot kesehatan mencakup: `ok` (boolean), `ts` (timestamp), `durationMs` (waktu probe), status per saluran, ketersediaan agen, dan ringkasan penyimpanan sesi.

## Terkait

- [Runbook Gateway](/id/gateway)
- [Ekspor diagnosis](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
