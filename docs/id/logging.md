---
read_when:
    - Anda memerlukan gambaran umum pencatatan log OpenClaw yang ramah pemula
    - Anda ingin mengonfigurasi level log, format, atau redaksi
    - Anda sedang memecahkan masalah dan perlu menemukan log dengan cepat
summary: File log, output konsol, tailing CLI, dan tab Log UI Kontrol
title: Pencatatan log
x-i18n:
    generated_at: "2026-06-27T17:39:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw memiliki dua permukaan log utama:

- **Log file** (baris JSON) yang ditulis oleh Gateway.
- **Output konsol** yang ditampilkan di terminal dan UI Debug Gateway.

Tab **Logs** di Control UI mengikuti file log gateway. Halaman ini menjelaskan tempat
log berada, cara membacanya, serta cara mengonfigurasi level dan format log.

## Tempat log berada

Secara default, Gateway menulis file log bergilir di bawah:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tanggal menggunakan zona waktu lokal host gateway.

Setiap file dirotasi saat mencapai `logging.maxFileBytes` (default: 100 MB).
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

### CLI: tail langsung (direkomendasikan)

Gunakan CLI untuk mengikuti file log gateway melalui RPC:

```bash
openclaw logs --follow
```

Opsi saat ini yang berguna:

- `--local-time`: tampilkan stempel waktu dalam zona waktu lokal Anda
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC Gateway standar
- `--expect-final`: flag tunggu respons akhir RPC berbasis agen (diterima di sini melalui lapisan klien bersama)

Mode output:

- **Sesi TTY**: baris log terstruktur yang rapi dan berwarna.
- **Sesi non-TTY**: teks polos.
- `--json`: JSON berbatas baris (satu peristiwa log per baris).
- `--plain`: paksa teks polos dalam sesi TTY.
- `--no-color`: nonaktifkan warna ANSI.

Saat Anda meneruskan `--url` eksplisit, CLI tidak otomatis menerapkan kredensial
konfigurasi atau lingkungan; sertakan sendiri `--token` jika Gateway target
memerlukan autentikasi.

Dalam mode JSON, CLI mengeluarkan objek bertanda `type`:

- `meta`: metadata stream (file, kursor, ukuran)
- `log`: entri log yang diparsing
- `notice`: petunjuk pemangkasan / rotasi
- `raw`: baris log yang tidak diparsing

Jika Gateway local loopback implisit meminta pairing, menutup saat koneksi,
atau kehabisan waktu sebelum `logs.tail` menjawab, `openclaw logs` otomatis
beralih ke file log Gateway yang dikonfigurasi. Target `--url` eksplisit tidak
menggunakan fallback ini. `openclaw logs --follow` lebih ketat: di Linux, perintah
ini menggunakan jurnal Gateway user-systemd aktif berdasarkan PID bila tersedia,
dan jika tidak tersedia akan terus mencoba ulang Gateway langsung alih-alih
mengikuti file berdampingan yang berpotensi usang.

Jika Gateway tidak dapat dijangkau, CLI mencetak petunjuk singkat untuk menjalankan:

```bash
openclaw doctor
```

### Control UI (web)

Tab **Logs** di Control UI mengikuti file yang sama menggunakan `logs.tail`.
Lihat [Control UI](/id/web/control-ui) untuk cara membukanya.

### Log khusus kanal

Untuk memfilter aktivitas kanal (WhatsApp/Telegram/dll.), gunakan:

```bash
openclaw channels logs --channel whatsapp
```

## Format log

### Log file (JSONL)

Setiap baris dalam file log adalah objek JSON. CLI dan Control UI mem-parsing
entri ini untuk merender output terstruktur (waktu, level, subsistem, pesan).

Rekaman JSONL log file juga menyertakan field tingkat atas yang dapat difilter
mesin bila tersedia:

- `hostname`: nama host gateway.
- `message`: teks pesan log yang diratakan untuk pencarian teks penuh.
- `agent_id`: id agen aktif saat panggilan log membawa konteks agen.
- `session_id`: id/kunci sesi aktif saat panggilan log membawa konteks sesi.
- `channel`: kanal aktif saat panggilan log membawa konteks kanal.

OpenClaw mempertahankan argumen log terstruktur asli di samping field ini
sehingga parser yang ada yang membaca kunci argumen tslog bernomor tetap berfungsi.

Aktivitas talk, suara real-time, dan managed-room memancarkan rekaman log siklus
hidup terbatas melalui pipeline log file yang sama ini. Rekaman ini menyertakan
jenis peristiwa, mode, transport, penyedia, dan pengukuran ukuran/waktu bila
tersedia, tetapi menghilangkan teks transkrip, payload audio, id giliran, id
panggilan, dan id item penyedia.

### Output konsol

Log konsol **sadar TTY** dan diformat agar mudah dibaca:

- Prefiks subsistem (mis. `gateway/channels/whatsapp`)
- Pewarnaan level (info/warn/error)
- Mode ringkas atau JSON opsional

Pemformatan konsol dikendalikan oleh `logging.consoleStyle`.

### Log WebSocket Gateway

`openclaw gateway` juga memiliki logging protokol WebSocket untuk traffic RPC:

- mode normal: hanya hasil yang menarik (error, error parse, panggilan lambat)
- `--verbose`: semua traffic permintaan/respons
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

Anda dapat mengganti keduanya melalui variabel lingkungan **`OPENCLAW_LOG_LEVEL`** (mis. `OPENCLAW_LOG_LEVEL=debug`). Variabel env lebih diprioritaskan daripada file konfigurasi, sehingga Anda dapat menaikkan verbositas untuk satu kali jalan tanpa mengedit `openclaw.json`. Anda juga dapat meneruskan opsi CLI global **`--log-level <level>`** (misalnya, `openclaw --log-level debug gateway run`), yang menggantikan variabel lingkungan untuk perintah tersebut.

`--verbose` hanya memengaruhi output konsol dan verbositas log WS; flag ini tidak mengubah
level log file.

### Diagnostik transport model tertarget

Saat men-debug panggilan penyedia, gunakan flag lingkungan tertarget alih-alih menaikkan
semua log ke `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Flag yang tersedia:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: pancarkan awal permintaan, respons fetch, header SDK,
  peristiwa streaming pertama, penyelesaian stream, dan error transport pada
  level `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: sertakan ringkasan payload permintaan
  terbatas dalam log permintaan model.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: sertakan semua nama tool yang menghadap model dalam
  ringkasan payload.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: sertakan snapshot payload JSON
  yang disunting dan dibatasi. Gunakan hanya saat debugging; rahasia disunting tetapi prompt
  dan teks pesan mungkin masih ada.
- `OPENCLAW_DEBUG_SSE=events`: pancarkan timing peristiwa pertama dan penyelesaian stream.
- `OPENCLAW_DEBUG_SSE=peek`: juga pancarkan lima payload peristiwa SSE pertama
  yang disunting, dibatasi per peristiwa.
- `OPENCLAW_DEBUG_CODE_MODE=1`: pancarkan diagnostik permukaan model mode kode,
  termasuk saat tool penyedia native disembunyikan karena mode kode memiliki
  permukaan tool.

Flag ini mencatat melalui logging OpenClaw normal, sehingga `openclaw logs --follow`
dan tab Logs di Control UI menampilkannya. Tanpa flag tersebut, diagnostik yang sama
tetap tersedia pada level `debug`.

Metadata awal dan respons `[model-fetch]` (penyedia, API, model, status,
latensi, dan field permintaan seperti metode, URL, timeout, proxy, dan kebijakan)
selalu dipancarkan pada level `info` terlepas dari
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, sehingga kebersihan dasar transport model terlihat
tanpa flag debug.

### Korelasi trace

Log file adalah JSONL. Saat panggilan log membawa konteks trace diagnostik yang valid,
OpenClaw menulis field trace sebagai kunci JSON tingkat atas (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) sehingga pemroses log eksternal dapat mengorelasikan baris
dengan span OTEL dan propagasi `traceparent` penyedia.

Permintaan HTTP Gateway dan frame WebSocket Gateway membuat scope trace permintaan
internal. Log dan peristiwa diagnostik yang dipancarkan di dalam scope async tersebut
mewarisi trace permintaan saat tidak meneruskan konteks trace eksplisit. Trace agent run dan
panggilan model menjadi anak dari trace permintaan aktif, sehingga log lokal,
snapshot diagnostik, span OTEL, dan header `traceparent` penyedia tepercaya dapat
digabungkan berdasarkan `traceId` tanpa mencatat konten mentah permintaan atau model.

Rekaman log siklus hidup talk juga mengalir ke ekspor log diagnostics-otel saat
ekspor log OpenTelemetry diaktifkan, menggunakan atribut terbatas yang sama seperti log file.
Konfigurasikan `diagnostics.otel.logsExporter` untuk memilih OTLP, stdout JSONL, atau
kedua sink.

### Ukuran dan timing panggilan model

Diagnostik panggilan model merekam pengukuran permintaan/respons terbatas tanpa
menangkap konten prompt atau respons mentah:

- `requestPayloadBytes`: ukuran byte UTF-8 dari payload permintaan model final
- `responseStreamBytes`: ukuran byte UTF-8 dari payload chunk respons model yang di-stream.
  Peristiwa teks frekuensi tinggi, thinking, dan delta panggilan tool hanya menghitung
  byte `delta` inkremental alih-alih snapshot `partial` penuh.
- `timeToFirstByteMs`: waktu berlalu sebelum peristiwa respons streaming pertama
- `durationMs`: durasi total panggilan model

Field ini tersedia untuk snapshot diagnostik, hook Plugin panggilan model, dan
span/metrik panggilan model OTEL saat ekspor diagnostik diaktifkan.

### Gaya konsol

`logging.consoleStyle`:

- `pretty`: ramah manusia, berwarna, dengan stempel waktu.
- `compact`: output lebih rapat (terbaik untuk sesi panjang).
- `json`: JSON per baris (untuk pemroses log).

### Redaksi

OpenClaw dapat menyunting token sensitif sebelum mencapai output konsol, log file,
rekaman log OTLP, teks transkrip sesi yang dipersistenkan, atau payload peristiwa tool
Control UI (argumen awal tool, payload hasil parsial/final, output exec turunan,
dan ringkasan patch):

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: daftar string regex untuk mengganti set default. Pola kustom diterapkan di atas default bawaan untuk payload tool Control UI, sehingga menambahkan pola tidak pernah melemahkan redaksi nilai yang sudah tertangkap oleh default.

Log file dan transkrip sesi tetap JSONL, tetapi nilai rahasia yang cocok
disamarkan sebelum baris atau pesan ditulis ke disk. Redaksi bersifat upaya terbaik:
ini berlaku pada konten pesan yang memuat teks dan string log, bukan setiap
identifier atau field payload biner.

Default bawaan mencakup kredensial API umum dan nama field kredensial pembayaran
seperti nomor kartu, CVC/CVV, token pembayaran bersama, dan kredensial pembayaran
saat muncul sebagai field JSON, parameter URL, flag CLI, atau assignment.

`logging.redactSensitive: "off"` hanya menonaktifkan kebijakan umum log/transkrip
ini. OpenClaw tetap menyunting payload batas keselamatan yang dapat ditampilkan kepada klien
UI, bundel dukungan, pengamat diagnostik, prompt persetujuan, atau tool agen.
Contohnya mencakup peristiwa panggilan tool Control UI, output `sessions_history`,
ekspor dukungan diagnostik, observasi error penyedia, tampilan perintah persetujuan exec,
dan log protokol WebSocket Gateway. `logging.redactPatterns` kustom
masih dapat menambahkan pola khusus proyek pada permukaan tersebut.

## Diagnostik dan OpenTelemetry

Diagnostik adalah peristiwa terstruktur yang dapat dibaca mesin untuk run model dan
telemetri alur pesan (webhook, antrean, status sesi). Diagnostik **tidak**
menggantikan log — diagnostik memasok metrik, trace, dan exporter. Peristiwa dipancarkan
di dalam proses baik Anda mengekspornya maupun tidak.

Dua permukaan yang berdekatan:

- **Ekspor OpenTelemetry** — kirim metrik, trace, dan log melalui OTLP/HTTP ke
  kolektor atau backend apa pun yang kompatibel dengan OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, dll.). Konfigurasi lengkap, katalog sinyal,
  nama metrik/span, variabel env, dan model privasi berada di halaman khusus:
  [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
- **Flag diagnostik** — flag log debug tertarget yang merutekan log tambahan ke
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

## Kiat pemecahan masalah

- **Gateway tidak dapat dijangkau?** Jalankan `openclaw doctor` terlebih dahulu.
- **Log kosong?** Periksa bahwa Gateway sedang berjalan dan menulis ke jalur file
  di `logging.file`.
- **Perlu detail lebih lanjut?** Atur `logging.level` ke `debug` atau `trace` dan coba lagi.

## Terkait

- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — ekspor OTLP/HTTP, katalog metrik/span, model privasi
- [Flag diagnostik](/id/diagnostics/flags) — flag log debug yang ditargetkan
- [Internal logging Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) — referensi lengkap bidang `diagnostics.*`
