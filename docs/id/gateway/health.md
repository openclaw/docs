---
read_when:
    - Mendiagnosis konektivitas channel atau kesehatan gateway
    - Memahami perintah CLI pemeriksaan kesehatan dan opsinya
summary: Perintah pemeriksaan kesehatan dan pemantauan kesehatan gateway
title: Pemeriksaan Kesehatan
x-i18n:
    generated_at: "2026-04-05T13:53:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8824bca34c4d1139f043481c75f0a65d83e54008898c34cf69c6f98fd04e819
    source_path: gateway/health.md
    workflow: 15
---

# Pemeriksaan Kesehatan (CLI)

Panduan singkat untuk memverifikasi konektivitas channel tanpa menebak-nebak.

## Pemeriksaan cepat

- `openclaw status` — ringkasan lokal: keterjangkauan/mode gateway, petunjuk pembaruan, usia autentikasi channel yang tertaut, sesi + aktivitas terbaru.
- `openclaw status --all` — diagnosis lokal lengkap (hanya baca, berwarna, aman untuk ditempel saat debugging).
- `openclaw status --deep` — meminta gateway yang sedang berjalan untuk melakukan probe kesehatan langsung (`health` dengan `probe:true`), termasuk probe channel per akun jika didukung.
- `openclaw health` — meminta snapshot kesehatan gateway yang sedang berjalan (khusus WS; tidak ada socket channel langsung dari CLI).
- `openclaw health --verbose` — memaksa probe kesehatan langsung dan mencetak detail koneksi gateway.
- `openclaw health --json` — output snapshot kesehatan yang dapat dibaca mesin.
- Kirim `/status` sebagai pesan mandiri di WhatsApp/WebChat untuk mendapatkan balasan status tanpa memanggil agen.
- Log: tail `/tmp/openclaw/openclaw-*.log` dan filter untuk `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnosis mendalam

- Kredensial di disk: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime harus terbaru).
- Penyimpanan sesi: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (path dapat dioverride di konfigurasi). Jumlah dan penerima terbaru ditampilkan melalui `status`.
- Alur relink: `openclaw channels logout && openclaw channels login --verbose` ketika kode status 409–515 atau `loggedOut` muncul di log. (Catatan: alur login QR otomatis memulai ulang sekali untuk status 515 setelah pairing.)

## Konfigurasi monitor kesehatan

- `gateway.channelHealthCheckMinutes`: seberapa sering gateway memeriksa kesehatan channel. Default: `5`. Setel `0` untuk menonaktifkan restart monitor kesehatan secara global.
- `gateway.channelStaleEventThresholdMinutes`: berapa lama channel yang terhubung dapat tetap idle sebelum monitor kesehatan menganggapnya stale dan me-restart-nya. Default: `30`. Pertahankan nilai ini lebih besar atau sama dengan `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: batas bergulir satu jam untuk restart monitor kesehatan per channel/akun. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: nonaktifkan restart monitor kesehatan untuk channel tertentu sambil tetap membiarkan pemantauan global aktif.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-akun yang menang atas pengaturan tingkat channel.
- Override per channel ini berlaku untuk monitor channel bawaan yang mengeksposnya saat ini: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, dan WhatsApp.

## Saat ada yang gagal

- `logged out` atau status 409–515 → lakukan relink dengan `openclaw channels logout` lalu `openclaw channels login`.
- Gateway tidak terjangkau → mulai: `openclaw gateway --port 18789` (gunakan `--force` jika port sedang sibuk).
- Tidak ada pesan masuk → pastikan ponsel yang tertaut sedang online dan pengirim diizinkan (`channels.whatsapp.allowFrom`); untuk chat grup, pastikan aturan allowlist + mention sesuai (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Perintah khusus "health"

`openclaw health` meminta gateway yang sedang berjalan untuk snapshot kesehatannya (tanpa socket channel
langsung dari CLI). Secara default, perintah ini dapat mengembalikan snapshot gateway yang baru di-cache; gateway
kemudian memperbarui cache tersebut di latar belakang. `openclaw health --verbose` memaksa
probe langsung. Perintah ini melaporkan usia kredensial/autentikasi tertaut saat tersedia,
ringkasan probe per channel, ringkasan penyimpanan sesi, dan durasi probe. Perintah akan keluar
dengan status non-zero jika gateway tidak terjangkau atau probe gagal/timeout.

Opsi:

- `--json`: output JSON yang dapat dibaca mesin
- `--timeout <ms>`: override timeout probe default 10 detik
- `--verbose`: paksa probe langsung dan cetak detail koneksi gateway
- `--debug`: alias untuk `--verbose`

Snapshot kesehatan mencakup: `ok` (boolean), `ts` (timestamp), `durationMs` (waktu probe), status per channel, ketersediaan agen, dan ringkasan penyimpanan sesi.
