---
read_when:
    - Mendiagnosis konektivitas saluran atau kondisi Gateway
    - Memahami perintah dan opsi CLI pemeriksaan kesehatan
summary: Perintah pemeriksaan kesehatan dan pemantauan kesehatan Gateway
title: Pemeriksaan kesehatan
x-i18n:
    generated_at: "2026-07-20T03:48:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2aad0ffe968452e34158757c45e094c60528a4c6b5c57f9977bb6bc15ffd202e
    source_path: gateway/health.md
    workflow: 16
---

Panduan singkat untuk memverifikasi konektivitas channel tanpa menebak-nebak.

## Pemeriksaan cepat

- `openclaw status` - ringkasan lokal: keterjangkauan/mode Gateway, petunjuk pembaruan, usia autentikasi channel tertaut, sesi + aktivitas terbaru.
- `openclaw status --all` - diagnosis lokal lengkap (hanya-baca, berwarna, aman ditempel untuk proses debug).
- `openclaw status --deep` - meminta Gateway yang sedang berjalan melakukan pemeriksaan langsung (`health` dengan `probe:true`), termasuk pemeriksaan channel per akun jika didukung.
- `openclaw status --usage` - menampilkan cuplikan penggunaan/kuota penyedia model.
- `openclaw health` - meminta cuplikan kesehatan dari Gateway yang sedang berjalan (hanya WS; tidak ada soket channel langsung dari CLI).
- `openclaw health --verbose` (alias `--debug`) - memaksa pemeriksaan kesehatan langsung dan mencetak detail koneksi Gateway.
- `openclaw health --json` - keluaran cuplikan kesehatan yang dapat dibaca mesin.
- Kirim `/status` sebagai perintah obrolan mandiri di channel mana pun untuk mendapatkan balasan status tanpa memanggil agen.
- Log: pantau `/tmp/openclaw/openclaw-*.log` dan filter berdasarkan `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Untuk Discord dan penyedia obrolan lainnya, baris sesi bukanlah indikator keaktifan soket.
`openclaw sessions`, `sessions.list` Gateway, dan alat `sessions_list` agen
membaca status percakapan yang tersimpan. Penyedia dapat terhubung kembali dan menampilkan status
channel yang sehat sebelum baris sesi baru dibuat. Gunakan perintah status dan
kesehatan channel di atas untuk pemeriksaan konektivitas langsung.

## Diagnostik mendalam

- Kredensial pada disk: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime seharusnya baru).
- Penyimpanan sesi: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Jumlah dan penerima terbaru ditampilkan melalui `status`.
- Alur penautan ulang: `openclaw channels logout && openclaw channels login --verbose` ketika kode status 409-515 atau `loggedOut` muncul dalam log. Alur login QR otomatis dimulai ulang satu kali untuk status 515 setelah pemasangan.
- Diagnostik diaktifkan secara default (`diagnostics.enabled: false` menonaktifkannya). Peristiwa memori mencatat jumlah byte RSS/heap serta tekanan ambang batas/pertumbuhan. Peringatan keaktifan mencatat penundaan/penggunaan event loop, rasio inti CPU, serta jumlah sesi aktif/menunggu/dalam antrean ketika proses berjalan tetapi mengalami saturasi. Peristiwa muatan berukuran terlalu besar mencatat hal yang ditolak/dipotong/dipecah beserta ukuran dan batasnya, tetapi tidak pernah mencatat teks pesan, isi lampiran, isi Webhook, isi mentah permintaan/respons, token, cookie, atau nilai rahasia.
- Heartbeat yang sama menggerakkan pencatat stabilitas berbatas: `openclaw gateway stability` (atau RPC Gateway `diagnostics.stability`). Penghentian fatal Gateway, batas waktu pematian, dan kegagalan startup saat memulai ulang menyimpan cuplikan terbaru di `~/.openclaw/logs/stability/`. Periksa bundel terbaru dengan `openclaw gateway stability --bundle latest`.
- Untuk laporan bug, jalankan `openclaw gateway diagnostics export` dan lampirkan zip yang dihasilkan: ringkasan Markdown, bundel stabilitas terbaru, metadata log yang disanitasi, cuplikan status/kesehatan Gateway yang disanitasi, dan struktur konfigurasi. Teks obrolan, isi Webhook, keluaran alat, kredensial, cookie, pengidentifikasi akun/pesan, dan nilai rahasia dihilangkan atau disunting. Lihat [Ekspor Diagnostik](/id/gateway/diagnostics).

## Konfigurasi pemantau kesehatan

- `channels.<provider>.healthMonitor.enabled`: menonaktifkan mulai ulang oleh pemantau kesehatan untuk channel tertentu sambil tetap mengaktifkan pemantauan global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: penggantian multiakun yang mengungguli pengaturan tingkat channel.
- Penggantian per channel ini berlaku untuk channel bawaan yang menyediakannya saat ini: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram, dan WhatsApp.

## Pemantauan waktu aktif

Layanan pemantauan waktu aktif eksternal harus menggunakan endpoint khusus `/health`, bukan `/v1/chat/completions`.

- **GUNAKAN:** `GET /health` - respons instan, tidak membuat sesi, tidak memanggil LLM, mengembalikan `{"ok":true,"status":"live"}`
- **JANGAN gunakan:** `/v1/chat/completions` untuk pemeriksaan kesehatan - setiap permintaan membuat sesi agen lengkap dengan cuplikan Skills, penyusunan konteks, dan panggilan LLM

Jika header `x-openclaw-session-key` atau bidang `user` tidak diberikan, `/v1/chat/completions` menghasilkan sesi acak baru untuk setiap permintaan. Layanan pemantauan yang melakukan ping setiap 15 menit membuat ~96 sesi/hari, masing-masing menggunakan 4-22KB. Seiring waktu, hal ini menyebabkan pembengkakan penyimpanan sesi dan dapat mengakibatkan luapan jendela konteks.

### Contoh penyiapan layanan pemantauan

- **BetterStack:** Atur URL pemeriksaan kesehatan ke `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Tambahkan monitor HTTP baru dengan URL `https://<your-gateway-host>:<port>/health`
- **Umum:** Setiap HTTP GET ke `/health` mengembalikan 200 dengan `{"ok":true}` ketika Gateway sehat

## Ketika terjadi kegagalan

- `logged out` atau status 409-515 -> tautkan ulang dengan `openclaw channels logout`, lalu `openclaw channels login`.
- Gateway tidak dapat dijangkau -> mulai: `openclaw gateway --port 18789` (gunakan `--force` jika port sedang digunakan).
- Tidak ada pesan masuk -> pastikan ponsel tertaut sedang online dan pengirim diizinkan (`channels.whatsapp.allowFrom`); untuk obrolan grup, pastikan aturan daftar izin + penyebutan cocok (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Perintah khusus "health"

`openclaw health` meminta cuplikan kesehatan dari Gateway yang sedang berjalan (tidak ada soket
channel langsung dari CLI). Secara default, perintah ini mengembalikan cuplikan Gateway tersimpan yang baru dan
Gateway menyegarkan cache tersebut di latar belakang; `--verbose` memaksa pemeriksaan langsung.
Perintah ini melaporkan usia kredensial/autentikasi tertaut jika tersedia, ringkasan pemeriksaan per channel,
ringkasan penyimpanan sesi, dan durasi pemeriksaan. Perintah keluar dengan kode bukan nol jika Gateway
tidak dapat dijangkau atau pemeriksaan gagal/melewati batas waktu.

Opsi:

- `--json`: keluaran JSON yang dapat dibaca mesin
- `--timeout <ms>`: mengganti batas waktu pemeriksaan default 10s
- `--verbose`: memaksa pemeriksaan langsung dan mencetak detail koneksi Gateway
- `--debug`: alias untuk `--verbose`

Cuplikan kesehatan mencakup: `ok` (boolean), `ts` (stempel waktu), `durationMs` (waktu pemeriksaan), status per channel, ketersediaan agen, dan ringkasan penyimpanan sesi.

## Terkait

- [Panduan operasional Gateway](/id/gateway)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
