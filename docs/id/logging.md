---
read_when:
    - Anda memerlukan ikhtisar yang ramah pemula tentang pencatatan log OpenClaw
    - Anda ingin mengonfigurasi tingkat log, format, atau penyamaran
    - Anda sedang memecahkan masalah dan perlu menemukan log dengan cepat
summary: File log, output konsol, pemantauan tail CLI, dan tab Log UI Kontrol
title: Pencatatan log
x-i18n:
    generated_at: "2026-05-11T20:31:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw memiliki dua permukaan log utama:

- **Log file** (baris JSON) yang ditulis oleh Gateway.
- **Keluaran konsol** yang ditampilkan di terminal dan UI Debug Gateway.

Tab **Log** UI Kontrol mengikuti log file gateway. Halaman ini menjelaskan lokasi
log, cara membacanya, dan cara mengonfigurasi level serta format log.

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

### CLI: ikuti langsung (direkomendasikan)

Gunakan CLI untuk mengikuti file log gateway melalui RPC:

```bash
openclaw logs --follow
```

Opsi saat ini yang berguna:

- `--local-time`: render stempel waktu dalam zona waktu lokal Anda
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC Gateway standar
- `--expect-final`: flag tunggu respons akhir berbasis agen (diterima di sini melalui lapisan klien bersama)

Mode keluaran:

- **Sesi TTY**: baris log terstruktur yang rapi dan berwarna.
- **Sesi non-TTY**: teks biasa.
- `--json`: JSON yang dibatasi baris (satu peristiwa log per baris).
- `--plain`: paksa teks biasa dalam sesi TTY.
- `--no-color`: nonaktifkan warna ANSI.

Saat Anda meneruskan `--url` eksplisit, CLI tidak otomatis menerapkan konfigurasi atau
kredensial lingkungan; sertakan sendiri `--token` jika Gateway target
memerlukan auth.

Dalam mode JSON, CLI menghasilkan objek bertanda `type`:

- `meta`: metadata stream (file, cursor, ukuran)
- `log`: entri log yang diurai
- `notice`: petunjuk pemotongan / rotasi
- `raw`: baris log yang tidak diurai

Jika Gateway local loopback implisit meminta pemasangan, menutup saat koneksi,
atau waktu habis sebelum `logs.tail` menjawab, `openclaw logs` otomatis kembali ke
log file Gateway yang dikonfigurasi. Target `--url` eksplisit tidak menggunakan
fallback ini.

Jika Gateway tidak dapat dijangkau, CLI mencetak petunjuk singkat untuk menjalankan:

```bash
openclaw doctor
```

### UI Kontrol (web)

Tab **Log** UI Kontrol mengikuti file yang sama menggunakan `logs.tail`.
Lihat [UI Kontrol](/id/web/control-ui) untuk cara membukanya.

### Log khusus channel

Untuk memfilter aktivitas channel (WhatsApp/Telegram/dll.), gunakan:

```bash
openclaw channels logs --channel whatsapp
```

## Format log

### Log file (JSONL)

Setiap baris dalam file log adalah objek JSON. CLI dan UI Kontrol mengurai
entri ini untuk merender keluaran terstruktur (waktu, level, subsistem, pesan).

Catatan JSONL log file juga menyertakan bidang tingkat atas yang dapat difilter mesin saat
tersedia:

- `hostname`: nama host gateway.
- `message`: teks pesan log yang diratakan untuk pencarian teks penuh.
- `agent_id`: id agen aktif saat panggilan log membawa konteks agen.
- `session_id`: id/kunci sesi aktif saat panggilan log membawa konteks sesi.
- `channel`: channel aktif saat panggilan log membawa konteks channel.

OpenClaw mempertahankan argumen log terstruktur asli di samping bidang-bidang ini
sehingga parser yang ada yang membaca kunci argumen tslog bernomor tetap berfungsi.

Aktivitas bicara, suara realtime, dan ruang terkelola memancarkan catatan log siklus hidup
terbatas melalui pipeline log file yang sama ini. Catatan ini menyertakan jenis peristiwa,
mode, transport, provider, serta pengukuran ukuran/waktu saat tersedia, tetapi menghilangkan
teks transkrip, payload audio, id giliran, id panggilan, dan id item provider.

### Keluaran konsol

Log konsol **sadar TTY** dan diformat agar mudah dibaca:

- Prefiks subsistem (mis. `gateway/channels/whatsapp`)
- Pewarnaan level (info/warn/error)
- Mode ringkas atau JSON opsional

Pemformatan konsol dikendalikan oleh `logging.consoleStyle`.

### Log WebSocket Gateway

`openclaw gateway` juga memiliki pencatatan protokol WebSocket untuk trafik RPC:

- mode normal: hanya hasil yang menarik (error, error penguraian, panggilan lambat)
- `--verbose`: semua trafik permintaan/respons
- `--ws-log auto|compact|full`: pilih gaya render verbose
- `--compact`: alias untuk `--ws-log compact`

Contoh:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Mengonfigurasi pencatatan log

Semua konfigurasi pencatatan log berada di bawah `logging` dalam `~/.openclaw/openclaw.json`.

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

Anda dapat menimpa keduanya melalui variabel lingkungan **`OPENCLAW_LOG_LEVEL`** (mis. `OPENCLAW_LOG_LEVEL=debug`). Variabel lingkungan lebih diutamakan daripada file konfigurasi, sehingga Anda dapat menaikkan verbositas untuk satu kali proses tanpa mengedit `openclaw.json`. Anda juga dapat meneruskan opsi CLI global **`--log-level <level>`** (misalnya, `openclaw --log-level debug gateway run`), yang menimpa variabel lingkungan untuk perintah tersebut.

`--verbose` hanya memengaruhi keluaran konsol dan verbositas log WS; ini tidak mengubah
level log file.

### Diagnostik transport model tertarget

Saat men-debug panggilan provider, gunakan flag lingkungan tertarget alih-alih menaikkan
semua log ke `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Flag yang tersedia:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: pancarkan awal permintaan, respons fetch, header
  SDK, peristiwa streaming pertama, penyelesaian stream, dan error transport pada
  level `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: sertakan ringkasan payload permintaan terbatas
  dalam log permintaan model.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: sertakan semua nama tool yang menghadap model dalam
  ringkasan payload.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: sertakan snapshot payload JSON yang
  disunting dan dibatasi. Gunakan hanya saat debugging; rahasia disunting tetapi prompt
  dan teks pesan mungkin masih ada.
- `OPENCLAW_DEBUG_SSE=events`: pancarkan waktu peristiwa pertama dan penyelesaian stream.
- `OPENCLAW_DEBUG_SSE=peek`: juga pancarkan lima payload peristiwa SSE pertama yang disunting,
  dibatasi per peristiwa.
- `OPENCLAW_DEBUG_CODE_MODE=1`: pancarkan diagnostik permukaan model mode kode,
  termasuk saat tool provider native disembunyikan karena mode kode memiliki
  permukaan tool.

Flag ini mencatat melalui pencatatan log OpenClaw normal, sehingga `openclaw logs --follow`
dan tab Log UI Kontrol menampilkannya. Tanpa flag tersebut, diagnostik yang sama
tetap tersedia pada level `debug`.

### Korelasi trace

Log file adalah JSONL. Saat panggilan log membawa konteks trace diagnostik yang valid,
OpenClaw menulis bidang trace sebagai kunci JSON tingkat atas (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) sehingga pemroses log eksternal dapat mengorelasikan baris
dengan span OTEL dan propagasi `traceparent` provider.

Permintaan HTTP Gateway dan frame WebSocket Gateway membentuk cakupan trace permintaan
internal. Log dan peristiwa diagnostik yang dipancarkan di dalam cakupan async tersebut mewarisi
trace permintaan saat tidak meneruskan konteks trace eksplisit. Trace run agen dan
panggilan model menjadi anak dari trace permintaan aktif, sehingga log lokal,
snapshot diagnostik, span OTEL, dan header `traceparent` provider tepercaya dapat
digabungkan dengan `traceId` tanpa mencatat permintaan mentah atau konten model.

Catatan log siklus hidup bicara juga mengalir ke log OTLP saat ekspor log OpenTelemetry
diaktifkan, menggunakan atribut terbatas yang sama dengan log file.

### Ukuran dan waktu panggilan model

Diagnostik panggilan model mencatat pengukuran permintaan/respons terbatas tanpa
menangkap konten prompt atau respons mentah:

- `requestPayloadBytes`: ukuran byte UTF-8 dari payload permintaan model akhir
- `responseStreamBytes`: ukuran byte UTF-8 dari peristiwa respons model yang di-stream
- `timeToFirstByteMs`: waktu berlalu sebelum peristiwa respons streaming pertama
- `durationMs`: total durasi panggilan model

Bidang ini tersedia untuk snapshot diagnostik, hook Plugin panggilan model, dan
span/metrik panggilan model OTEL saat ekspor diagnostik diaktifkan.

### Gaya konsol

`logging.consoleStyle`:

- `pretty`: ramah manusia, berwarna, dengan stempel waktu.
- `compact`: keluaran lebih rapat (terbaik untuk sesi panjang).
- `json`: JSON per baris (untuk pemroses log).

### Redaksi

OpenClaw dapat menyunting token sensitif sebelum masuk ke keluaran konsol, log file,
catatan log OTLP, teks transkrip sesi yang dipertahankan, atau payload peristiwa tool
UI Kontrol (argumen awal tool, payload hasil parsial/akhir, keluaran exec turunan,
dan ringkasan patch):

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: daftar string regex untuk menimpa set default. Pola kustom diterapkan di atas default bawaan untuk payload tool UI Kontrol, sehingga menambahkan pola tidak pernah melemahkan redaksi nilai yang sudah tertangkap oleh default.

Log file dan transkrip sesi tetap JSONL, tetapi nilai rahasia yang cocok
disamarkan sebelum baris atau pesan ditulis ke disk. Redaksi bersifat upaya terbaik:
ini diterapkan pada konten pesan yang berisi teks dan string log, bukan setiap
identifier atau bidang payload biner.

Default bawaan mencakup kredensial API umum dan nama bidang kredensial pembayaran
seperti nomor kartu, CVC/CVV, token pembayaran bersama, dan kredensial pembayaran
saat muncul sebagai bidang JSON, parameter URL, flag CLI, atau assignment.

`logging.redactSensitive: "off"` hanya menonaktifkan kebijakan log/transkrip umum
ini. OpenClaw tetap menyunting payload batas keselamatan yang dapat ditampilkan kepada
klien UI, bundle dukungan, pengamat diagnostik, prompt persetujuan, atau tool
agen. Contohnya mencakup peristiwa panggilan tool UI Kontrol, keluaran `sessions_history`,
ekspor dukungan diagnostik, observasi error provider, tampilan perintah persetujuan exec,
dan log protokol WebSocket Gateway. `logging.redactPatterns` kustom
masih dapat menambahkan pola khusus proyek pada permukaan tersebut.

## Diagnostik dan OpenTelemetry

Diagnostik adalah peristiwa terstruktur yang dapat dibaca mesin untuk run model dan
telemetri alur pesan (Webhook, antrean, status sesi). Diagnostik **tidak**
menggantikan log — diagnostik memasok metrik, trace, dan exporter. Peristiwa dipancarkan
dalam proses baik Anda mengekspornya maupun tidak.

Dua permukaan bersebelahan:

- **Ekspor OpenTelemetry** — kirim metrik, trace, dan log melalui OTLP/HTTP ke
  collector atau backend yang kompatibel dengan OpenTelemetry apa pun (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, dll.). Konfigurasi lengkap, katalog sinyal,
  nama metrik/span, variabel lingkungan, dan model privasi ada di halaman khusus:
  [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
- **Flag diagnostik** — flag log debug tertarget yang mengarahkan log tambahan ke
  `logging.file` tanpa menaikkan `logging.level`. Flag tidak peka huruf besar/kecil
  dan mendukung wildcard (`telegram.*`, `*`). Konfigurasikan di bawah `diagnostics.flags`
  atau melalui override lingkungan `OPENCLAW_DIAGNOSTICS=...`. Panduan lengkap:
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
- **Perlu detail lebih banyak?** Setel `logging.level` ke `debug` atau `trace` dan coba lagi.

## Terkait

- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — ekspor OTLP/HTTP, katalog metrik/span, model privasi
- [Flag diagnostik](/id/diagnostics/flags) — flag log debug tertarget
- [Internal pencatatan log Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) — referensi lengkap bidang `diagnostics.*`
