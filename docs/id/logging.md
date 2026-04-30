---
read_when:
    - Anda memerlukan ikhtisar ramah pemula tentang pencatatan log OpenClaw
    - Anda ingin mengonfigurasi tingkat log, format, atau penyamaran data sensitif
    - Anda sedang melakukan pemecahan masalah dan perlu menemukan log dengan cepat
summary: Log file, keluaran konsol, pemantauan log melalui CLI, dan tab Log UI Kontrol
title: Pencatatan log
x-i18n:
    generated_at: "2026-04-30T09:57:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 916fb03219d571f0302560a4cb6755940575c92fff0b4eab024b9dad53f841ce
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

- `--local-time`: render stempel waktu dalam zona waktu lokal Anda
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC Gateway standar
- `--expect-final`: flag tunggu respons akhir RPC berbasis agen (diterima di sini melalui lapisan klien bersama)

Mode output:

- **Sesi TTY**: baris log terstruktur yang rapi dan berwarna.
- **Sesi non-TTY**: teks biasa.
- `--json`: JSON berbatas baris (satu peristiwa log per baris).
- `--plain`: paksa teks biasa dalam sesi TTY.
- `--no-color`: nonaktifkan warna ANSI.

Saat Anda meneruskan `--url` eksplisit, CLI tidak menerapkan kredensial konfigurasi atau
lingkungan secara otomatis; sertakan sendiri `--token` jika Gateway target
memerlukan autentikasi.

Dalam mode JSON, CLI memancarkan objek bertanda `type`:

- `meta`: metadata stream (file, kursor, ukuran)
- `log`: entri log yang diurai
- `notice`: petunjuk pemotongan / rotasi
- `raw`: baris log yang tidak diurai

Jika Gateway local loopback implisit meminta pemasangan, menutup saat koneksi,
atau waktu habis sebelum `logs.tail` menjawab, `openclaw logs` otomatis beralih ke
log file Gateway yang dikonfigurasi. Target `--url` eksplisit tidak menggunakan
fallback ini.

Jika Gateway tidak dapat dijangkau, CLI mencetak petunjuk singkat untuk menjalankan:

```bash
openclaw doctor
```

### UI Kontrol (web)

Tab **Log** UI Kontrol mengikuti file yang sama menggunakan `logs.tail`.
Lihat [/web/control-ui](/id/web/control-ui) untuk cara membukanya.

### Log khusus kanal

Untuk memfilter aktivitas kanal (WhatsApp/Telegram/dll.), gunakan:

```bash
openclaw channels logs --channel whatsapp
```

## Format log

### Log file (JSONL)

Setiap baris dalam file log adalah objek JSON. CLI dan UI Kontrol mengurai
entri ini untuk merender output terstruktur (waktu, level, subsistem, pesan).

Rekaman JSONL log file juga menyertakan field tingkat atas yang dapat difilter mesin saat
tersedia:

- `hostname`: nama host gateway.
- `message`: teks pesan log yang diratakan untuk pencarian teks penuh.
- `agent_id`: id agen aktif saat panggilan log membawa konteks agen.
- `session_id`: id/kunci sesi aktif saat panggilan log membawa konteks sesi.
- `channel`: kanal aktif saat panggilan log membawa konteks kanal.

OpenClaw mempertahankan argumen log terstruktur asli bersama field ini
agar parser yang sudah ada yang membaca kunci argumen tslog bernomor tetap berfungsi.

### Output konsol

Log konsol **sadar TTY** dan diformat agar mudah dibaca:

- Prefiks subsistem (mis. `gateway/channels/whatsapp`)
- Pewarnaan level (info/warn/error)
- Mode ringkas atau JSON opsional

Pemformatan konsol dikontrol oleh `logging.consoleStyle`.

### Log WebSocket Gateway

`openclaw gateway` juga memiliki pencatatan protokol WebSocket untuk lalu lintas RPC:

- mode normal: hanya hasil yang menarik (error, error penguraian, panggilan lambat)
- `--verbose`: semua lalu lintas permintaan/respons
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

Anda dapat menimpa keduanya melalui variabel lingkungan **`OPENCLAW_LOG_LEVEL`** (mis. `OPENCLAW_LOG_LEVEL=debug`). Variabel lingkungan lebih diprioritaskan daripada file konfigurasi, sehingga Anda dapat menaikkan verbositas untuk satu eksekusi tanpa mengedit `openclaw.json`. Anda juga dapat meneruskan opsi CLI global **`--log-level <level>`** (misalnya, `openclaw --log-level debug gateway run`), yang menimpa variabel lingkungan untuk perintah tersebut.

`--verbose` hanya memengaruhi output konsol dan verbositas log WS; itu tidak mengubah
level log file.

### Korelasi trace

Log file adalah JSONL. Saat panggilan log membawa konteks trace diagnostik yang valid,
OpenClaw menulis field trace sebagai kunci JSON tingkat atas (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) agar prosesor log eksternal dapat mengorelasikan baris
dengan span OTEL dan propagasi `traceparent` penyedia.

Permintaan HTTP Gateway dan frame WebSocket Gateway membentuk cakupan trace permintaan
internal. Log dan peristiwa diagnostik yang dipancarkan di dalam cakupan async tersebut mewarisi
trace permintaan saat tidak meneruskan konteks trace eksplisit. Trace eksekusi agen dan
panggilan model menjadi turunan dari trace permintaan aktif, sehingga log lokal,
snapshot diagnostik, span OTEL, dan header `traceparent` penyedia tepercaya dapat
digabungkan berdasarkan `traceId` tanpa mencatat konten permintaan mentah atau model.

### Ukuran dan timing panggilan model

Diagnostik panggilan model merekam pengukuran permintaan/respons berbatas tanpa
menangkap konten prompt atau respons mentah:

- `requestPayloadBytes`: ukuran byte UTF-8 dari payload permintaan model akhir
- `responseStreamBytes`: ukuran byte UTF-8 dari peristiwa respons model yang di-stream
- `timeToFirstByteMs`: waktu berlalu sebelum peristiwa respons streaming pertama
- `durationMs`: durasi total panggilan model

Field ini tersedia untuk snapshot diagnostik, hook Plugin panggilan model, dan
span/metrik panggilan model OTEL saat ekspor diagnostik diaktifkan.

### Gaya konsol

`logging.consoleStyle`:

- `pretty`: ramah manusia, berwarna, dengan stempel waktu.
- `compact`: output lebih rapat (terbaik untuk sesi panjang).
- `json`: JSON per baris (untuk prosesor log).

### Redaksi

OpenClaw dapat meredaksi token sensitif sebelum token tersebut masuk ke output konsol, log file,
rekaman log OTLP, teks transkrip sesi persisten, atau payload peristiwa alat
UI Kontrol (argumen mulai alat, payload hasil parsial/akhir, output exec turunan,
dan ringkasan patch):

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: daftar string regex untuk menimpa set default. Pola kustom diterapkan di atas default bawaan untuk payload alat UI Kontrol, sehingga menambahkan pola tidak pernah melemahkan redaksi nilai yang sudah tertangkap oleh default.

Log file dan transkrip sesi tetap JSONL, tetapi nilai rahasia yang cocok
disamarkan sebelum baris atau pesan ditulis ke disk. Redaksi bersifat upaya terbaik:
ini diterapkan pada konten pesan berbasis teks dan string log, bukan setiap
field pengenal atau payload biner.

`logging.redactSensitive: "off"` hanya menonaktifkan kebijakan log/transkrip
umum ini. OpenClaw tetap meredaksi payload batas keamanan yang dapat ditampilkan kepada klien
UI, bundel dukungan, pengamat diagnostik, prompt persetujuan, atau alat agen.
Contohnya meliputi peristiwa panggilan alat UI Kontrol, output `sessions_history`,
ekspor dukungan diagnostik, observasi error penyedia, tampilan perintah persetujuan
exec, dan log protokol WebSocket Gateway. `logging.redactPatterns` kustom
tetap dapat menambahkan pola khusus proyek pada permukaan tersebut.

## Diagnostik dan OpenTelemetry

Diagnostik adalah peristiwa terstruktur yang dapat dibaca mesin untuk eksekusi model dan
telemetri alur pesan (webhook, antrean, status sesi). Diagnostik **tidak**
menggantikan log — diagnostik memasok metrik, trace, dan eksportir. Peristiwa dipancarkan
di dalam proses, baik Anda mengekspornya maupun tidak.

Dua permukaan yang berdekatan:

- **Ekspor OpenTelemetry** — kirim metrik, trace, dan log melalui OTLP/HTTP ke
  kolektor atau backend yang kompatibel dengan OpenTelemetry apa pun (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, dll.). Konfigurasi lengkap, katalog sinyal,
  nama metrik/span, variabel lingkungan, dan model privasi berada di halaman khusus:
  [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
- **Flag diagnostik** — flag log debug tertarget yang mengarahkan log ekstra ke
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

Untuk ekspor OTLP ke kolektor, lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry).

## Tips pemecahan masalah

- **Gateway tidak dapat dijangkau?** Jalankan `openclaw doctor` terlebih dahulu.
- **Log kosong?** Periksa bahwa Gateway sedang berjalan dan menulis ke jalur file
  di `logging.file`.
- **Butuh detail lebih banyak?** Setel `logging.level` ke `debug` atau `trace` lalu coba lagi.

## Terkait

- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — ekspor OTLP/HTTP, katalog metrik/span, model privasi
- [Flag diagnostik](/id/diagnostics/flags) — flag log debug tertarget
- [Internal logging Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) — referensi field `diagnostics.*` lengkap
