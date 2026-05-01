---
read_when:
    - Anda memerlukan gambaran umum tentang pencatatan log OpenClaw yang ramah pemula
    - Anda ingin mengonfigurasi tingkat log, format, atau penyamaran data
    - Anda sedang memecahkan masalah dan perlu menemukan log dengan cepat
summary: File log, output konsol, pemantauan langsung CLI, dan tab Log Antarmuka Kontrol
title: Pencatatan log
x-i18n:
    generated_at: "2026-05-01T09:26:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw memiliki dua permukaan log utama:

- **Log file** (baris JSON) yang ditulis oleh Gateway.
- **Output konsol** yang ditampilkan di terminal dan UI Debug Gateway.

Tab **Log** di UI Kontrol mengikuti log file gateway. Halaman ini menjelaskan tempat
log berada, cara membacanya, dan cara mengonfigurasi level serta format log.

## Tempat log berada

Secara default, Gateway menulis file log bergulir di bawah:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tanggal menggunakan zona waktu lokal host gateway.

Setiap file berotasi ketika mencapai `logging.maxFileBytes` (default: 100 MB).
OpenClaw menyimpan hingga lima arsip bernomor di samping file aktif, seperti
`openclaw-YYYY-MM-DD.1.log`, dan terus menulis ke log aktif baru alih-alih
menekan diagnostik.

Anda dapat menggantinya di `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cara membaca log

### CLI: tail langsung (disarankan)

Gunakan CLI untuk mengikuti file log gateway melalui RPC:

```bash
openclaw logs --follow
```

Opsi terkini yang berguna:

- `--local-time`: render stempel waktu dalam zona waktu lokal Anda
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC Gateway standar
- `--expect-final`: flag tunggu respons akhir RPC berbasis agen (diterima di sini melalui lapisan klien bersama)

Mode output:

- **Sesi TTY**: baris log terstruktur yang rapi, berwarna.
- **Sesi non-TTY**: teks biasa.
- `--json`: JSON berbatas baris (satu peristiwa log per baris).
- `--plain`: paksa teks biasa dalam sesi TTY.
- `--no-color`: nonaktifkan warna ANSI.

Ketika Anda memberikan `--url` eksplisit, CLI tidak menerapkan otomatis kredensial
konfigurasi atau lingkungan; sertakan sendiri `--token` jika Gateway target
memerlukan autentikasi.

Dalam mode JSON, CLI memancarkan objek bertanda `type`:

- `meta`: metadata stream (file, kursor, ukuran)
- `log`: entri log yang diuraikan
- `notice`: petunjuk pemotongan / rotasi
- `raw`: baris log yang tidak terurai

Jika Gateway local loopback implisit meminta pairing, menutup saat terhubung,
atau waktu habis sebelum `logs.tail` menjawab, `openclaw logs` otomatis fallback
ke log file Gateway yang dikonfigurasi. Target `--url` eksplisit tidak menggunakan
fallback ini.

Jika Gateway tidak dapat dijangkau, CLI mencetak petunjuk singkat untuk menjalankan:

```bash
openclaw doctor
```

### UI Kontrol (web)

Tab **Log** di UI Kontrol mengikuti file yang sama menggunakan `logs.tail`.
Lihat [/web/control-ui](/id/web/control-ui) untuk cara membukanya.

### Log khusus channel

Untuk memfilter aktivitas channel (WhatsApp/Telegram/dll.), gunakan:

```bash
openclaw channels logs --channel whatsapp
```

## Format log

### Log file (JSONL)

Setiap baris dalam file log adalah objek JSON. CLI dan UI Kontrol menguraikan
entri ini untuk merender output terstruktur (waktu, level, subsistem, pesan).

Record JSONL log file juga menyertakan field tingkat atas yang dapat difilter mesin
jika tersedia:

- `hostname`: nama host gateway.
- `message`: teks pesan log yang diratakan untuk pencarian teks lengkap.
- `agent_id`: id agen aktif ketika panggilan log membawa konteks agen.
- `session_id`: id/kunci sesi aktif ketika panggilan log membawa konteks sesi.
- `channel`: channel aktif ketika panggilan log membawa konteks channel.

OpenClaw mempertahankan argumen log terstruktur asli bersama field ini
sehingga parser yang sudah ada yang membaca kunci argumen tslog bernomor tetap berfungsi.

### Output konsol

Log konsol **sadar TTY** dan diformat agar mudah dibaca:

- Prefiks subsistem (misalnya `gateway/channels/whatsapp`)
- Pewarnaan level (info/warn/error)
- Mode ringkas atau JSON opsional

Pemformatan konsol dikontrol oleh `logging.consoleStyle`.

### Log WebSocket Gateway

`openclaw gateway` juga memiliki pencatatan protokol WebSocket untuk traffic RPC:

- mode normal: hanya hasil yang menarik (error, error parse, panggilan lambat)
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

Anda dapat mengganti keduanya melalui variabel lingkungan **`OPENCLAW_LOG_LEVEL`** (misalnya `OPENCLAW_LOG_LEVEL=debug`). Env var diprioritaskan di atas file konfigurasi, sehingga Anda dapat menaikkan verbositas untuk satu kali eksekusi tanpa mengedit `openclaw.json`. Anda juga dapat memberikan opsi CLI global **`--log-level <level>`** (misalnya, `openclaw --log-level debug gateway run`), yang mengganti variabel lingkungan untuk perintah tersebut.

`--verbose` hanya memengaruhi output konsol dan verbositas log WS; itu tidak mengubah
level log file.

### Korelasi trace

Log file adalah JSONL. Ketika panggilan log membawa konteks trace diagnostik yang valid,
OpenClaw menulis field trace sebagai kunci JSON tingkat atas (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) sehingga prosesor log eksternal dapat mengorelasikan baris
dengan span OTEL dan propagasi `traceparent` provider.

Request HTTP Gateway dan frame WebSocket Gateway membentuk scope trace request internal.
Log dan peristiwa diagnostik yang dipancarkan di dalam scope async tersebut mewarisi
trace request ketika tidak meneruskan konteks trace eksplisit. Trace agent run dan
model-call menjadi anak dari trace request aktif, sehingga log lokal,
snapshot diagnostik, span OTEL, dan header `traceparent` provider tepercaya dapat
digabungkan berdasarkan `traceId` tanpa mencatat konten request mentah atau model.

### Ukuran dan timing panggilan model

Diagnostik model-call merekam pengukuran request/response berbatas tanpa
menangkap konten prompt atau respons mentah:

- `requestPayloadBytes`: ukuran byte UTF-8 dari payload request model final
- `responseStreamBytes`: ukuran byte UTF-8 dari peristiwa respons model yang di-stream
- `timeToFirstByteMs`: waktu berlalu sebelum peristiwa respons stream pertama
- `durationMs`: durasi total model-call

Field ini tersedia untuk snapshot diagnostik, hook Plugin model-call, dan
span/metrik model-call OTEL ketika ekspor diagnostik diaktifkan.

### Gaya konsol

`logging.consoleStyle`:

- `pretty`: ramah manusia, berwarna, dengan stempel waktu.
- `compact`: output lebih rapat (terbaik untuk sesi panjang).
- `json`: JSON per baris (untuk prosesor log).

### Redaksi

OpenClaw dapat meredaksi token sensitif sebelum masuk ke output konsol, log file,
record log OTLP, teks transkrip sesi yang dipersistenkan, atau payload peristiwa tool
UI Kontrol (argumen mulai tool, payload hasil parsial/final, output exec turunan,
dan ringkasan patch):

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: daftar string regex untuk mengganti set default. Pola kustom diterapkan di atas default bawaan untuk payload tool UI Kontrol, sehingga menambahkan pola tidak pernah melemahkan redaksi nilai yang sudah tertangkap oleh default.

Log file dan transkrip sesi tetap JSONL, tetapi nilai rahasia yang cocok
dimasking sebelum baris atau pesan ditulis ke disk. Redaksi bersifat upaya terbaik:
ini berlaku pada konten pesan berisi teks dan string log, bukan setiap
identifier atau field payload biner.

Default bawaan mencakup kredensial API umum dan nama field kredensial pembayaran
seperti nomor kartu, CVC/CVV, token pembayaran bersama, dan kredensial pembayaran
ketika muncul sebagai field JSON, parameter URL, flag CLI, atau assignment.

`logging.redactSensitive: "off"` hanya menonaktifkan kebijakan umum
log/transkrip ini. OpenClaw tetap meredaksi payload batas keamanan yang dapat ditampilkan
ke klien UI, bundel dukungan, observer diagnostik, prompt persetujuan, atau tool
agen. Contohnya mencakup peristiwa tool-call UI Kontrol, output `sessions_history`,
ekspor dukungan diagnostik, observasi error provider, tampilan perintah persetujuan exec,
dan log protokol WebSocket Gateway. `logging.redactPatterns` kustom
tetap dapat menambahkan pola khusus proyek pada permukaan tersebut.

## Diagnostik dan OpenTelemetry

Diagnostik adalah peristiwa terstruktur yang dapat dibaca mesin untuk model run dan
telemetri alur pesan (webhook, antrean, status sesi). Diagnostik **tidak**
menggantikan log — diagnostik memberi masukan ke metrik, trace, dan exporter. Peristiwa dipancarkan
di dalam proses terlepas dari apakah Anda mengekspornya atau tidak.

Dua permukaan berdekatan:

- **Ekspor OpenTelemetry** — kirim metrik, trace, dan log melalui OTLP/HTTP ke
  collector atau backend kompatibel OpenTelemetry apa pun (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, dll.). Konfigurasi lengkap, katalog sinyal,
  nama metrik/span, env var, dan model privasi berada di halaman khusus:
  [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
- **Flag diagnostik** — flag log debug tertarget yang merutekan log ekstra ke
  `logging.file` tanpa menaikkan `logging.level`. Flag tidak peka huruf besar/kecil
  dan mendukung wildcard (`telegram.*`, `*`). Konfigurasikan di bawah `diagnostics.flags`
  atau melalui override env `OPENCLAW_DIAGNOSTICS=...`. Panduan lengkap:
  [Flag diagnostik](/id/diagnostics/flags).

Untuk mengaktifkan peristiwa diagnostik bagi Plugin atau sink kustom tanpa ekspor OTLP:

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
- **Perlu detail lebih banyak?** Atur `logging.level` ke `debug` atau `trace` dan coba lagi.

## Terkait

- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — ekspor OTLP/HTTP, katalog metrik/span, model privasi
- [Flag diagnostik](/id/diagnostics/flags) — flag log debug tertarget
- [Internal logging Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) — referensi lengkap field `diagnostics.*`
