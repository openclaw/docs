---
read_when:
    - Anda memerlukan gambaran umum yang ramah pemula tentang pencatatan log OpenClaw
    - Anda ingin mengonfigurasi tingkat log, format, atau penyamaran
    - Anda sedang melakukan pemecahan masalah dan perlu menemukan log dengan cepat
summary: File log, output konsol, pengikutan CLI, dan tab Log UI Kontrol
title: Pencatatan log
x-i18n:
    generated_at: "2026-05-06T17:57:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 218f68c5111b6de01dc14707dad132d15d5e78c8e906af8a5416e618807663ac
    source_path: logging.md
    workflow: 16
---

OpenClaw memiliki dua permukaan log utama:

- **Log file** (baris JSON) yang ditulis oleh Gateway.
- **Output konsol** yang ditampilkan di terminal dan UI Debug Gateway.

Tab **Logs** di UI Kontrol mengikuti log file gateway. Halaman ini menjelaskan di mana
log berada, cara membacanya, serta cara mengonfigurasi level dan format log.

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

- `--local-time`: render timestamp dalam zona waktu lokal Anda
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC Gateway standar
- `--expect-final`: flag tunggu respons akhir RPC berbasis agen (diterima di sini melalui lapisan klien bersama)

Mode output:

- **Sesi TTY**: baris log terstruktur yang rapi, berwarna.
- **Sesi non-TTY**: teks polos.
- `--json`: JSON berbatas baris (satu peristiwa log per baris).
- `--plain`: paksa teks polos dalam sesi TTY.
- `--no-color`: nonaktifkan warna ANSI.

Saat Anda meneruskan `--url` eksplisit, CLI tidak menerapkan otomatis kredensial
konfigurasi atau lingkungan; sertakan sendiri `--token` jika Gateway target
memerlukan autentikasi.

Dalam mode JSON, CLI mengeluarkan objek bertanda `type`:

- `meta`: metadata stream (file, cursor, ukuran)
- `log`: entri log yang diurai
- `notice`: petunjuk pemotongan / rotasi
- `raw`: baris log yang tidak diurai

Jika Gateway local loopback implisit meminta pairing, menutup saat koneksi,
atau timeout sebelum `logs.tail` menjawab, `openclaw logs` otomatis fallback ke
log file Gateway yang dikonfigurasi. Target `--url` eksplisit tidak menggunakan
fallback ini.

Jika Gateway tidak dapat dijangkau, CLI mencetak petunjuk singkat untuk menjalankan:

```bash
openclaw doctor
```

### UI Kontrol (web)

Tab **Logs** di UI Kontrol mengikuti file yang sama menggunakan `logs.tail`.
Lihat [UI Kontrol](/id/web/control-ui) untuk cara membukanya.

### Log khusus channel

Untuk memfilter aktivitas channel (WhatsApp/Telegram/dll), gunakan:

```bash
openclaw channels logs --channel whatsapp
```

## Format log

### Log file (JSONL)

Setiap baris dalam file log adalah objek JSON. CLI dan UI Kontrol mengurai
entri ini untuk merender output terstruktur (waktu, level, subsistem, pesan).

Record JSONL log file juga menyertakan field tingkat atas yang dapat difilter
mesin saat tersedia:

- `hostname`: nama host gateway.
- `message`: teks pesan log yang diratakan untuk pencarian teks penuh.
- `agent_id`: id agen aktif saat panggilan log membawa konteks agen.
- `session_id`: id/kunci sesi aktif saat panggilan log membawa konteks sesi.
- `channel`: channel aktif saat panggilan log membawa konteks channel.

OpenClaw mempertahankan argumen log terstruktur asli di samping field ini
sehingga parser yang ada yang membaca kunci argumen tslog bernomor tetap berfungsi.

Aktivitas bicara, suara realtime, dan ruang terkelola memancarkan record log
siklus hidup berbatas melalui pipeline log file yang sama ini. Record ini
menyertakan tipe peristiwa, mode, transport, provider, dan pengukuran ukuran/waktu
saat tersedia, tetapi menghilangkan teks transkrip, payload audio, id giliran,
id panggilan, dan id item provider.

### Output konsol

Log konsol **sadar TTY** dan diformat agar mudah dibaca:

- Prefiks subsistem (mis. `gateway/channels/whatsapp`)
- Pewarnaan level (info/warn/error)
- Mode ringkas atau JSON opsional

Pemformatan konsol dikontrol oleh `logging.consoleStyle`.

### Log WebSocket Gateway

`openclaw gateway` juga memiliki logging protokol WebSocket untuk traffic RPC:

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

Anda dapat menimpa keduanya melalui variabel lingkungan **`OPENCLAW_LOG_LEVEL`** (mis. `OPENCLAW_LOG_LEVEL=debug`). Variabel env lebih diutamakan daripada file konfigurasi, sehingga Anda dapat menaikkan verbositas untuk satu kali jalan tanpa mengedit `openclaw.json`. Anda juga dapat meneruskan opsi CLI global **`--log-level <level>`** (misalnya, `openclaw --log-level debug gateway run`), yang menimpa variabel lingkungan untuk perintah tersebut.

`--verbose` hanya memengaruhi output konsol dan verbositas log WS; ini tidak mengubah
level log file.

### Korelasi trace

Log file adalah JSONL. Saat panggilan log membawa konteks trace diagnostik yang valid,
OpenClaw menulis field trace sebagai kunci JSON tingkat atas (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) sehingga pemroses log eksternal dapat mengorelasikan baris
dengan span OTEL dan propagasi `traceparent` provider.

Request HTTP Gateway dan frame WebSocket Gateway membentuk scope trace request internal.
Log dan peristiwa diagnostik yang dipancarkan di dalam scope async tersebut mewarisi
trace request saat tidak meneruskan konteks trace eksplisit. Trace eksekusi agen dan
panggilan model menjadi anak dari trace request aktif, sehingga log lokal,
snapshot diagnostik, span OTEL, dan header `traceparent` provider tepercaya dapat
digabungkan berdasarkan `traceId` tanpa mencatat request mentah atau konten model.

Record log siklus hidup bicara juga mengalir ke log OTLP saat ekspor log OpenTelemetry
diaktifkan, menggunakan atribut berbatas yang sama seperti log file.

### Ukuran dan waktu panggilan model

Diagnostik panggilan model mencatat pengukuran request/response berbatas tanpa
menangkap prompt mentah atau konten respons:

- `requestPayloadBytes`: ukuran byte UTF-8 dari payload request model akhir
- `responseStreamBytes`: ukuran byte UTF-8 dari peristiwa respons model yang di-stream
- `timeToFirstByteMs`: waktu berlalu sebelum peristiwa respons stream pertama
- `durationMs`: total durasi panggilan model

Field ini tersedia untuk snapshot diagnostik, hook plugin panggilan model, dan
span/metrik panggilan model OTEL saat ekspor diagnostik diaktifkan.

### Gaya konsol

`logging.consoleStyle`:

- `pretty`: ramah manusia, berwarna, dengan timestamp.
- `compact`: output lebih ringkas (terbaik untuk sesi panjang).
- `json`: JSON per baris (untuk pemroses log).

### Redaksi

OpenClaw dapat meredaksi token sensitif sebelum mencapai output konsol, log file,
record log OTLP, teks transkrip sesi yang dipersistenkan, atau payload peristiwa
alat UI Kontrol (argumen mulai alat, payload hasil parsial/akhir, output
exec turunan, dan ringkasan patch):

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: daftar string regex untuk menimpa set default. Pola kustom diterapkan di atas default bawaan untuk payload alat UI Kontrol, sehingga menambahkan pola tidak pernah melemahkan redaksi nilai yang sudah tertangkap oleh default.

Log file dan transkrip sesi tetap JSONL, tetapi nilai rahasia yang cocok
disamarkan sebelum baris atau pesan ditulis ke disk. Redaksi bersifat upaya terbaik:
redaksi berlaku pada konten pesan yang memuat teks dan string log, bukan setiap
identifier atau field payload biner.

Default bawaan mencakup kredensial API umum dan nama field kredensial pembayaran
seperti nomor kartu, CVC/CVV, token pembayaran bersama, dan kredensial pembayaran
saat muncul sebagai field JSON, parameter URL, flag CLI, atau assignment.

`logging.redactSensitive: "off"` hanya menonaktifkan kebijakan umum log/transkrip ini.
OpenClaw tetap meredaksi payload batas keselamatan yang dapat ditampilkan kepada klien
UI, bundel dukungan, pengamat diagnostik, prompt persetujuan, atau alat agen.
Contohnya meliputi peristiwa panggilan alat UI Kontrol, output `sessions_history`,
ekspor dukungan diagnostik, observasi error provider, tampilan perintah persetujuan
exec, dan log protokol WebSocket Gateway. `logging.redactPatterns` kustom
tetap dapat menambahkan pola khusus proyek pada permukaan tersebut.

## Diagnostik dan OpenTelemetry

Diagnostik adalah peristiwa terstruktur yang dapat dibaca mesin untuk eksekusi model dan
telemetri alur pesan (webhook, antrean, status sesi). Diagnostik **tidak**
menggantikan log — diagnostik memberi makan metrik, trace, dan exporter. Peristiwa
dipancarkan dalam proses baik Anda mengekspornya maupun tidak.

Dua permukaan yang berdekatan:

- **Ekspor OpenTelemetry** — kirim metrik, trace, dan log melalui OTLP/HTTP ke
  kolektor atau backend yang kompatibel dengan OpenTelemetry mana pun (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, dll.). Konfigurasi lengkap, katalog sinyal,
  nama metrik/span, variabel env, dan model privasi berada di halaman khusus:
  [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
- **Flag diagnostik** — flag log debug tertarget yang mengarahkan log tambahan ke
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

Untuk ekspor OTLP ke kolektor, lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry).

## Tips pemecahan masalah

- **Gateway tidak dapat dijangkau?** Jalankan `openclaw doctor` terlebih dahulu.
- **Log kosong?** Periksa bahwa Gateway berjalan dan menulis ke path file
  dalam `logging.file`.
- **Butuh detail lebih lanjut?** Setel `logging.level` ke `debug` atau `trace` dan coba lagi.

## Terkait

- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — ekspor OTLP/HTTP, katalog metrik/span, model privasi
- [Flag diagnostik](/id/diagnostics/flags) — flag log debug tertarget
- [Internal logging Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan capture konsol
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) — referensi lengkap field `diagnostics.*`
