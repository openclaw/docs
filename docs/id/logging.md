---
read_when:
    - Anda memerlukan ikhtisar logging yang ramah untuk pemula
    - Anda ingin mengonfigurasi level atau format log
    - Anda sedang melakukan pemecahan masalah dan perlu menemukan log dengan cepat
summary: 'Ikhtisar logging: file log, output konsol, tailing CLI, dan Control UI'
title: Ikhtisar Logging
x-i18n:
    generated_at: "2026-04-05T13:59:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a5e3800b7c5128602d05d5a35df4f88c373cfbe9397cca7e7154fff56a7f7ef
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw memiliki dua permukaan log utama:

- **File log** (baris JSON) yang ditulis oleh Gateway.
- **Output konsol** yang ditampilkan di terminal dan Gateway Debug UI.

Tab **Logs** di Control UI melakukan tail pada file log gateway. Halaman ini menjelaskan tempat
log berada, cara membacanya, dan cara mengonfigurasi level serta format log.

## Lokasi log

Secara default, Gateway menulis file log bergulir di:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tanggal tersebut menggunakan zona waktu lokal host gateway.

Anda dapat menimpanya di `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cara membaca log

### CLI: live tail (direkomendasikan)

Gunakan CLI untuk melakukan tail pada file log gateway melalui RPC:

```bash
openclaw logs --follow
```

Opsi yang saat ini berguna:

- `--local-time`: tampilkan timestamp dalam zona waktu lokal Anda
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC Gateway standar
- `--expect-final`: flag tunggu respons akhir RPC berbasis agen (diterima di sini melalui lapisan klien bersama)

Mode output:

- **Sesi TTY**: baris log yang rapi, berwarna, dan terstruktur.
- **Sesi non-TTY**: teks biasa.
- `--json`: JSON yang dipisahkan per baris (satu event log per baris).
- `--plain`: paksa teks biasa dalam sesi TTY.
- `--no-color`: nonaktifkan warna ANSI.

Saat Anda memberikan `--url` eksplisit, CLI tidak otomatis menerapkan kredensial konfigurasi atau
environment; sertakan sendiri `--token` jika target Gateway
memerlukan autentikasi.

Dalam mode JSON, CLI mengeluarkan objek bertag `type`:

- `meta`: metadata stream (file, cursor, size)
- `log`: entri log yang telah di-parse
- `notice`: petunjuk truncation / rotation
- `raw`: baris log yang tidak di-parse

Jika Gateway loopback lokal meminta pairing, `openclaw logs` akan fallback ke
file log lokal yang dikonfigurasi secara otomatis. Target `--url` eksplisit tidak
menggunakan fallback ini.

Jika Gateway tidak dapat dijangkau, CLI menampilkan petunjuk singkat untuk menjalankan:

```bash
openclaw doctor
```

### Control UI (web)

Tab **Logs** di Control UI melakukan tail pada file yang sama menggunakan `logs.tail`.
Lihat [/web/control-ui](/web/control-ui) untuk cara membukanya.

### Log khusus channel

Untuk memfilter aktivitas channel (WhatsApp/Telegram/dll), gunakan:

```bash
openclaw channels logs --channel whatsapp
```

## Format log

### File log (JSONL)

Setiap baris dalam file log adalah objek JSON. CLI dan Control UI mengurai
entri ini untuk menampilkan output terstruktur (waktu, level, subsistem, pesan).

### Output konsol

Log konsol **sadar TTY** dan diformat agar mudah dibaca:

- Prefiks subsistem (misalnya `gateway/channels/whatsapp`)
- Pewarnaan level (info/warn/error)
- Mode compact atau JSON opsional

Pemformatan konsol dikendalikan oleh `logging.consoleStyle`.

### Log WebSocket Gateway

`openclaw gateway` juga memiliki logging protokol WebSocket untuk traffic RPC:

- mode normal: hanya hasil yang penting (error, parse error, panggilan lambat)
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

- `logging.level`: level **file log** (JSONL).
- `logging.consoleLevel`: level verbositas **konsol**.

Anda dapat menimpa keduanya melalui variabel environment **`OPENCLAW_LOG_LEVEL`** (misalnya `OPENCLAW_LOG_LEVEL=debug`). Variabel environment ini memiliki prioritas lebih tinggi daripada file konfigurasi, sehingga Anda dapat menaikkan verbositas untuk satu kali eksekusi tanpa mengedit `openclaw.json`. Anda juga dapat memberikan opsi CLI global **`--log-level <level>`** (misalnya, `openclaw --log-level debug gateway run`), yang menimpa variabel environment untuk perintah tersebut.

`--verbose` hanya memengaruhi output konsol dan verbositas log WS; ini tidak mengubah
level file log.

### Gaya konsol

`logging.consoleStyle`:

- `pretty`: ramah manusia, berwarna, dengan timestamp.
- `compact`: output lebih ringkas (terbaik untuk sesi panjang).
- `json`: JSON per baris (untuk pemroses log).

### Redaksi

Ringkasan alat dapat meredaksi token sensitif sebelum muncul di konsol:

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: daftar string regex untuk menimpa set default

Redaksi hanya memengaruhi **output konsol** dan tidak mengubah file log.

## Diagnostik + OpenTelemetry

Diagnostik adalah event terstruktur yang dapat dibaca mesin untuk eksekusi model **dan**
telemetri alur pesan (webhook, antrean, status sesi). Diagnostik **tidak** menggantikan log;
diagnostik ada untuk memasok metrik, trace, dan exporter lainnya.

Event diagnostik dikeluarkan dalam proses, tetapi exporter hanya terpasang saat
diagnostik + plugin exporter diaktifkan.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: model data + SDK untuk trace, metrik, dan log.
- **OTLP**: wire protocol yang digunakan untuk mengekspor data OTel ke collector/backend.
- OpenClaw saat ini mengekspor melalui **OTLP/HTTP (protobuf)**.

### Sinyal yang diekspor

- **Metrik**: counter + histogram (penggunaan token, alur pesan, antrean).
- **Trace**: span untuk penggunaan model + pemrosesan webhook/pesan.
- **Log**: diekspor melalui OTLP saat `diagnostics.otel.logs` diaktifkan. Volume
  log dapat tinggi; perhatikan `logging.level` dan filter exporter.

### Katalog event diagnostik

Penggunaan model:

- `model.usage`: token, biaya, durasi, konteks, provider/model/channel, ID sesi.

Alur pesan:

- `webhook.received`: ingress webhook per channel.
- `webhook.processed`: webhook ditangani + durasi.
- `webhook.error`: error handler webhook.
- `message.queued`: pesan dimasukkan ke antrean untuk diproses.
- `message.processed`: hasil + durasi + error opsional.

Antrean + sesi:

- `queue.lane.enqueue`: enqueue lane antrean perintah + kedalaman.
- `queue.lane.dequeue`: dequeue lane antrean perintah + waktu tunggu.
- `session.state`: transisi status sesi + alasan.
- `session.stuck`: peringatan sesi macet + usia.
- `run.attempt`: metadata retry/attempt eksekusi.
- `diagnostic.heartbeat`: counter agregat (webhook/antrean/sesi).

### Aktifkan diagnostik (tanpa exporter)

Gunakan ini jika Anda ingin event diagnostik tersedia bagi plugin atau sink kustom:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flag diagnostik (log bertarget)

Gunakan flag untuk mengaktifkan log debug tambahan yang bertarget tanpa menaikkan `logging.level`.
Flag tidak peka huruf besar/kecil dan mendukung wildcard (misalnya `telegram.*` atau `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Override env (sekali jalan):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Catatan:

- Log berbasis flag masuk ke file log standar (sama seperti `logging.file`).
- Output tetap diredaksi sesuai `logging.redactSensitive`.
- Panduan lengkap: [/diagnostics/flags](/id/diagnostics/flags).

### Ekspor ke OpenTelemetry

Diagnostik dapat diekspor melalui plugin `diagnostics-otel` (OTLP/HTTP). Ini
berfungsi dengan collector/backend OpenTelemetry apa pun yang menerima OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

Catatan:

- Anda juga dapat mengaktifkan plugin dengan `openclaw plugins enable diagnostics-otel`.
- `protocol` saat ini hanya mendukung `http/protobuf`. `grpc` diabaikan.
- Metrik mencakup penggunaan token, biaya, ukuran konteks, durasi eksekusi, dan
  counter/histogram alur pesan (webhook, antrean, status sesi, kedalaman/waktu tunggu antrean).
- Trace/metrik dapat diaktifkan atau dinonaktifkan dengan `traces` / `metrics` (default: aktif). Trace
  mencakup span penggunaan model ditambah span pemrosesan webhook/pesan saat diaktifkan.
- Tetapkan `headers` saat collector Anda memerlukan autentikasi.
- Variabel environment yang didukung: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Metrik yang diekspor (nama + tipe)

Penggunaan model:

- `openclaw.tokens` (counter, atribut: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, atribut: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atribut: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atribut: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Alur pesan:

- `openclaw.webhook.received` (counter, atribut: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, atribut: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, atribut: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, atribut: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, atribut: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, atribut: `openclaw.channel`,
  `openclaw.outcome`)

Antrean + sesi:

- `openclaw.queue.lane.enqueue` (counter, atribut: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, atribut: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atribut: `openclaw.lane` atau
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atribut: `openclaw.lane`)
- `openclaw.session.state` (counter, atribut: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, atribut: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, atribut: `openclaw.state`)
- `openclaw.run.attempt` (counter, atribut: `openclaw.attempt`)

### Span yang diekspor (nama + atribut kunci)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Sampling + flushing

- Sampling trace: `diagnostics.otel.sampleRate` (0.0–1.0, hanya root span).
- Interval ekspor metrik: `diagnostics.otel.flushIntervalMs` (minimal 1000ms).

### Catatan protokol

- Endpoint OTLP/HTTP dapat ditetapkan melalui `diagnostics.otel.endpoint` atau
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Jika endpoint sudah berisi `/v1/traces` atau `/v1/metrics`, endpoint digunakan apa adanya.
- Jika endpoint sudah berisi `/v1/logs`, endpoint digunakan apa adanya untuk log.
- `diagnostics.otel.logs` mengaktifkan ekspor log OTLP untuk output logger utama.

### Perilaku ekspor log

- Log OTLP menggunakan record terstruktur yang sama yang ditulis ke `logging.file`.
- Mengikuti `logging.level` (level file log). Redaksi konsol **tidak** berlaku
  untuk log OTLP.
- Instalasi dengan volume tinggi sebaiknya lebih mengutamakan sampling/filtering collector OTLP.

## Tips pemecahan masalah

- **Gateway tidak dapat dijangkau?** Jalankan `openclaw doctor` terlebih dahulu.
- **Log kosong?** Periksa apakah Gateway sedang berjalan dan menulis ke path file
  di `logging.file`.
- **Butuh detail lebih banyak?** Tetapkan `logging.level` ke `debug` atau `trace` lalu coba lagi.

## Terkait

- [Internal Logging Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Diagnostik](/gateway/configuration-reference#diagnostics) — ekspor OpenTelemetry dan konfigurasi trace cache
