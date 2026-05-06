---
read_when:
    - Anda memerlukan gambaran umum pencatatan log OpenClaw yang ramah pemula
    - Anda ingin mengonfigurasi tingkat log, format, atau redaksi
    - Anda sedang memecahkan masalah dan perlu menemukan log dengan cepat
summary: Berkas log, keluaran konsol, tailing CLI, dan tab Log Control UI
title: Pencatatan log
x-i18n:
    generated_at: "2026-05-06T09:18:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: abcdfeb0f9fbd13715762a1829198d0285738855c50f2ee531cab1e989d936b1
    source_path: logging.md
    workflow: 16
---

OpenClaw memiliki dua permukaan log utama:

- **Log file** (baris JSON) yang ditulis oleh Gateway.
- **Output konsol** yang ditampilkan di terminal dan Gateway Debug UI.

Tab **Logs** di Control UI mengikuti log file gateway. Halaman ini menjelaskan di mana
log berada, cara membacanya, dan cara mengonfigurasi level serta format log.

## Lokasi log

Secara default, Gateway menulis file log bergulir di bawah:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tanggal menggunakan zona waktu lokal host gateway.

Setiap file dirotasi saat mencapai `logging.maxFileBytes` (default: 100 MB).
OpenClaw menyimpan hingga lima arsip bernomor di samping file aktif, seperti
`openclaw-YYYY-MM-DD.1.log`, dan terus menulis ke log aktif baru alih-alih
menekan diagnostik.

Anda dapat menimpanya di `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cara membaca log

### CLI: tail langsung (direkomendasikan)

Gunakan CLI untuk mengikuti file log gateway melalui RPC:

```bash
openclaw logs --follow
```

Opsi saat ini yang berguna:

- `--local-time`: tampilkan stempel waktu dalam zona waktu lokal Anda
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC Gateway standar
- `--expect-final`: flag tunggu respons akhir RPC yang didukung agen (diterima di sini melalui lapisan klien bersama)

Mode output:

- **Sesi TTY**: baris log terstruktur yang rapi, berwarna.
- **Sesi non-TTY**: teks biasa.
- `--json`: JSON berbatas baris (satu peristiwa log per baris).
- `--plain`: paksa teks biasa dalam sesi TTY.
- `--no-color`: nonaktifkan warna ANSI.

Saat Anda meneruskan `--url` eksplisit, CLI tidak otomatis menerapkan kredensial
konfigurasi atau lingkungan; sertakan sendiri `--token` jika Gateway target
memerlukan autentikasi.

Dalam mode JSON, CLI menghasilkan objek bertanda `type`:

- `meta`: metadata stream (file, kursor, ukuran)
- `log`: entri log yang diurai
- `notice`: petunjuk pemangkasan / rotasi
- `raw`: baris log yang tidak diurai

Jika Gateway local loopback implisit meminta pairing, menutup saat koneksi,
atau waktu habis sebelum `logs.tail` menjawab, `openclaw logs` otomatis fallback
ke log file Gateway yang dikonfigurasi. Target `--url` eksplisit tidak menggunakan
fallback ini.

Jika Gateway tidak dapat dijangkau, CLI mencetak petunjuk singkat untuk menjalankan:

```bash
openclaw doctor
```

### Control UI (web)

Tab **Logs** di Control UI mengikuti file yang sama menggunakan `logs.tail`.
Lihat [Control UI](/id/web/control-ui) untuk cara membukanya.

### Log khusus channel

Untuk memfilter aktivitas channel (WhatsApp/Telegram/dll), gunakan:

```bash
openclaw channels logs --channel whatsapp
```

## Format log

### Log file (JSONL)

Setiap baris dalam file log adalah objek JSON. CLI dan Control UI mengurai
entri ini untuk merender output terstruktur (waktu, level, subsistem, pesan).

Record JSONL log file juga menyertakan field tingkat atas yang dapat difilter mesin saat
tersedia:

- `hostname`: nama host gateway.
- `message`: teks pesan log yang diratakan untuk pencarian teks lengkap.
- `agent_id`: id agen aktif saat pemanggilan log membawa konteks agen.
- `session_id`: id/kunci sesi aktif saat pemanggilan log membawa konteks sesi.
- `channel`: channel aktif saat pemanggilan log membawa konteks channel.

OpenClaw mempertahankan argumen log terstruktur asli di samping field ini
agar parser yang sudah ada yang membaca kunci argumen tslog bernomor tetap berfungsi.

### Output konsol

Log konsol **sadar TTY** dan diformat agar mudah dibaca:

- Prefiks subsistem (misalnya `gateway/channels/whatsapp`)
- Pewarnaan level (info/warn/error)
- Mode ringkas atau JSON opsional

Pemformatan konsol dikendalikan oleh `logging.consoleStyle`.

### Log WebSocket Gateway

`openclaw gateway` juga memiliki logging protokol WebSocket untuk traffic RPC:

- mode normal: hanya hasil menarik (error, error parse, panggilan lambat)
- `--verbose`: semua traffic request/response
- `--ws-log auto|compact|full`: pilih gaya rendering verbose
- `--compact`: alias untuk `--ws-log compact`

Contoh:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Mengonfigurasi logging

Semua konfigurasi logging berada di bawah `logging` dalam `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Level log

- `logging.level`: level **log file** (JSONL).
- `logging.consoleLevel`: level verbositas **konsol**.

Anda dapat menimpa keduanya melalui variabel lingkungan **`OPENCLAW_LOG_LEVEL`** (misalnya `OPENCLAW_LOG_LEVEL=debug`). Variabel lingkungan lebih diutamakan daripada file konfigurasi, sehingga Anda dapat menaikkan verbositas untuk satu kali run tanpa mengedit `openclaw.json`. Anda juga dapat meneruskan opsi CLI global **`--log-level <level>`** (misalnya, `openclaw --log-level debug gateway run`), yang menimpa variabel lingkungan untuk perintah tersebut.

`--verbose` hanya memengaruhi output konsol dan verbositas log WS; opsi ini tidak mengubah
level log file.

### Korelasi trace

Log file adalah JSONL. Saat pemanggilan log membawa konteks trace diagnostik yang valid,
OpenClaw menulis field trace sebagai kunci JSON tingkat atas (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) agar pemroses log eksternal dapat mengorelasikan baris
dengan span OTEL dan propagasi `traceparent` provider.

Request HTTP Gateway dan frame WebSocket Gateway menetapkan scope trace request
internal. Log dan peristiwa diagnostik yang dipancarkan di dalam scope async tersebut mewarisi
trace request saat tidak meneruskan konteks trace eksplisit. Trace run agen dan
panggilan model menjadi anak dari trace request aktif, sehingga log lokal,
snapshot diagnostik, span OTEL, dan header `traceparent` provider tepercaya dapat
digabungkan berdasarkan `traceId` tanpa mencatat konten request atau model mentah.

### Ukuran dan timing panggilan model

Diagnostik panggilan model merekam pengukuran request/response berbatas tanpa
menangkap konten prompt atau respons mentah:

- `requestPayloadBytes`: ukuran byte UTF-8 dari payload request model akhir
- `responseStreamBytes`: ukuran byte UTF-8 dari peristiwa respons model yang di-stream
- `timeToFirstByteMs`: waktu yang berlalu sebelum peristiwa respons stream pertama
- `durationMs`: total durasi panggilan model

Field ini tersedia untuk snapshot diagnostik, hook plugin panggilan model, dan
span/metrik panggilan model OTEL saat ekspor diagnostik diaktifkan.

### Gaya konsol

`logging.consoleStyle`:

- `pretty`: ramah manusia, berwarna, dengan stempel waktu.
- `compact`: output lebih padat (terbaik untuk sesi panjang).
- `json`: JSON per baris (untuk pemroses log).

### Redaksi

OpenClaw dapat meredaksi token sensitif sebelum mencapai output konsol, log file,
record log OTLP, teks transkrip sesi yang dipersistenkan, atau payload peristiwa tool
Control UI (argumen mulai tool, payload hasil parsial/akhir, output
exec turunan, dan ringkasan patch):

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: daftar string regex untuk menimpa set default. Pola kustom diterapkan di atas default bawaan untuk payload tool Control UI, sehingga menambahkan pola tidak pernah memperlemah redaksi nilai yang sudah tertangkap oleh default.

Log file dan transkrip sesi tetap JSONL, tetapi nilai rahasia yang cocok
disamarkan sebelum baris atau pesan ditulis ke disk. Redaksi bersifat upaya terbaik:
berlaku pada konten pesan yang memuat teks dan string log, bukan setiap
identifier atau field payload biner.

Default bawaan mencakup kredensial API umum dan nama field kredensial pembayaran
seperti nomor kartu, CVC/CVV, token pembayaran bersama, dan kredensial pembayaran
saat muncul sebagai field JSON, parameter URL, flag CLI, atau assignment.

`logging.redactSensitive: "off"` hanya menonaktifkan kebijakan log/transkrip
umum ini. OpenClaw tetap meredaksi payload batas keselamatan yang dapat ditampilkan kepada klien
UI, bundel dukungan, observer diagnostik, prompt persetujuan, atau tool agen.
Contohnya mencakup peristiwa tool-call Control UI, output `sessions_history`,
ekspor dukungan diagnostik, observasi error provider, tampilan perintah persetujuan
exec, dan log protokol WebSocket Gateway. `logging.redactPatterns` kustom
tetap dapat menambahkan pola khusus proyek pada permukaan tersebut.

## Diagnostik dan OpenTelemetry

Diagnostik adalah peristiwa terstruktur yang dapat dibaca mesin untuk run model dan
telemetri alur pesan (webhook, antrean, status sesi). Diagnostik **tidak**
menggantikan log — diagnostik memberi makan metrik, trace, dan exporter. Peristiwa dipancarkan
di dalam proses baik Anda mengekspornya maupun tidak.

Dua permukaan yang berdekatan:

- **Ekspor OpenTelemetry** — kirim metrik, trace, dan log melalui OTLP/HTTP ke
  collector atau backend yang kompatibel dengan OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, dll.). Konfigurasi lengkap, katalog sinyal,
  nama metrik/span, variabel lingkungan, dan model privasi berada di halaman khusus:
  [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
- **Flag diagnostik** — flag log debug tertarget yang merutekan log tambahan ke
  `logging.file` tanpa menaikkan `logging.level`. Flag tidak peka huruf besar/kecil
  dan mendukung wildcard (`telegram.*`, `*`). Konfigurasikan di bawah `diagnostics.flags`
  atau melalui override env `OPENCLAW_DIAGNOSTICS=...`. Panduan lengkap:
  [Flag diagnostik](/id/diagnostics/flags).

Untuk mengaktifkan peristiwa diagnostik bagi plugin atau sink kustom tanpa ekspor OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Untuk ekspor OTLP ke collector, lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry).

## Tips pemecahan masalah

- **Gateway tidak dapat dijangkau?** Jalankan `openclaw doctor` terlebih dahulu.
- **Log kosong?** Periksa bahwa Gateway sedang berjalan dan menulis ke path file
  di `logging.file`.
- **Butuh detail lebih banyak?** Atur `logging.level` ke `debug` atau `trace` dan coba lagi.

## Terkait

- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — ekspor OTLP/HTTP, katalog metrik/span, model privasi
- [Flag diagnostik](/id/diagnostics/flags) — flag log debug tertarget
- [Internal logging Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan capture konsol
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) — referensi field `diagnostics.*` lengkap
