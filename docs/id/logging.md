---
read_when:
    - Anda memerlukan ikhtisar logging yang ramah bagi pemula
    - Anda ingin mengonfigurasi level atau format log
    - Anda sedang memecahkan masalah dan perlu menemukan log dengan cepat
summary: 'Ikhtisar logging: log file, output konsol, tailing CLI, dan UI Control'
title: Ikhtisar logging
x-i18n:
    generated_at: "2026-04-24T09:15:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw memiliki dua permukaan log utama:

- **Log file** (baris JSON) yang ditulis oleh Gateway.
- **Output konsol** yang ditampilkan di terminal dan UI Debug Gateway.

Tab **Logs** di UI Control melakukan tail pada log file gateway. Halaman ini menjelaskan
di mana log berada, cara membacanya, dan cara mengonfigurasi level serta format log.

## Lokasi log

Secara default, Gateway menulis file log rolling di:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tanggal menggunakan zona waktu lokal host gateway.

Anda dapat meng-override ini di `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cara membaca log

### CLI: tail live (disarankan)

Gunakan CLI untuk melakukan tail pada file log gateway melalui RPC:

```bash
openclaw logs --follow
```

Opsi saat ini yang berguna:

- `--local-time`: render stempel waktu dalam zona waktu lokal Anda
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC Gateway standar
- `--expect-final`: flag tunggu respons final RPC berbasis agen (diterima di sini melalui lapisan klien bersama)

Mode output:

- **Sesi TTY**: baris log terstruktur yang rapi, berwarna, dan mudah dibaca.
- **Sesi non-TTY**: teks biasa.
- `--json`: JSON dipisahkan per baris (satu peristiwa log per baris).
- `--plain`: paksa teks biasa dalam sesi TTY.
- `--no-color`: nonaktifkan warna ANSI.

Saat Anda memberikan `--url` eksplisit, CLI tidak otomatis menerapkan kredensial config atau
environment; sertakan `--token` sendiri jika Gateway target
memerlukan auth.

Dalam mode JSON, CLI mengeluarkan objek bertag `type`:

- `meta`: metadata stream (file, cursor, size)
- `log`: entri log yang telah di-parse
- `notice`: petunjuk truncation / rotation
- `raw`: baris log yang tidak di-parse

Jika Gateway loopback lokal meminta pairing, `openclaw logs` otomatis fallback ke
file log lokal yang dikonfigurasi. Target `--url` eksplisit tidak
menggunakan fallback ini.

Jika Gateway tidak dapat dijangkau, CLI mencetak petunjuk singkat untuk menjalankan:

```bash
openclaw doctor
```

### UI Control (web)

Tab **Logs** di UI Control melakukan tail pada file yang sama menggunakan `logs.tail`.
Lihat [/web/control-ui](/id/web/control-ui) untuk cara membukanya.

### Log khusus saluran

Untuk memfilter aktivitas saluran (WhatsApp/Telegram/dll), gunakan:

```bash
openclaw channels logs --channel whatsapp
```

## Format log

### Log file (JSONL)

Setiap baris dalam file log adalah objek JSON. CLI dan UI Control mem-parse
entri ini untuk merender output terstruktur (waktu, level, subsistem, pesan).

### Output konsol

Log konsol bersifat **sadar TTY** dan diformat agar mudah dibaca:

- Prefiks subsistem (misalnya `gateway/channels/whatsapp`)
- Pewarnaan level (info/warn/error)
- Mode compact atau JSON opsional

Format konsol dikendalikan oleh `logging.consoleStyle`.

### Log WebSocket Gateway

`openclaw gateway` juga memiliki logging protokol WebSocket untuk lalu lintas RPC:

- mode normal: hanya hasil yang menarik (error, parse error, panggilan lambat)
- `--verbose`: semua lalu lintas request/response
- `--ws-log auto|compact|full`: pilih gaya rendering verbose
- `--compact`: alias untuk `--ws-log compact`

Contoh:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Mengonfigurasi logging

Semua konfigurasi logging berada di bawah `logging` di `~/.openclaw/openclaw.json`.

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

Anda dapat meng-override keduanya melalui variabel environment **`OPENCLAW_LOG_LEVEL`** (misalnya `OPENCLAW_LOG_LEVEL=debug`). Variabel env ini lebih diutamakan daripada file config, jadi Anda dapat meningkatkan verbositas untuk satu kali eksekusi tanpa mengedit `openclaw.json`. Anda juga dapat memberikan opsi CLI global **`--log-level <level>`** (misalnya, `openclaw --log-level debug gateway run`), yang meng-override variabel environment untuk perintah tersebut.

`--verbose` hanya memengaruhi output konsol dan verbositas log WS; ini tidak mengubah
level log file.

### Gaya konsol

`logging.consoleStyle`:

- `pretty`: ramah manusia, berwarna, dengan stempel waktu.
- `compact`: output lebih ringkas (terbaik untuk sesi panjang).
- `json`: JSON per baris (untuk pemroses log).

### Redaksi

Ringkasan alat dapat menyamarkan token sensitif sebelum mencapai konsol:

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: daftar string regex untuk meng-override set default

Redaksi hanya memengaruhi **output konsol** dan tidak mengubah log file.

## Diagnostik + OpenTelemetry

Diagnostik adalah peristiwa terstruktur yang dapat dibaca mesin untuk eksekusi model **dan**
telemetri alur pesan (Webhook, antrean, status sesi). Diagnostik **tidak**
menggantikan log; diagnostik ada untuk memasok metrik, trace, dan exporter lainnya.

Peristiwa diagnostik dipancarkan di dalam proses, tetapi exporter hanya terpasang saat
diagnostik + plugin exporter diaktifkan.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: model data + SDK untuk trace, metrik, dan log.
- **OTLP**: protokol wire yang digunakan untuk mengekspor data OTel ke collector/backend.
- OpenClaw saat ini mengekspor melalui **OTLP/HTTP (protobuf)**.

### Sinyal yang diekspor

- **Metrik**: counter + histogram (penggunaan token, alur pesan, antrean).
- **Trace**: span untuk penggunaan model + pemrosesan Webhook/pesan.
- **Log**: diekspor melalui OTLP saat `diagnostics.otel.logs` diaktifkan. Volume log
  bisa tinggi; pertimbangkan `logging.level` dan filter exporter.

### Katalog peristiwa diagnostik

Penggunaan model:

- `model.usage`: token, biaya, durasi, konteks, provider/model/channel, id sesi.

Alur pesan:

- `webhook.received`: ingress Webhook per saluran.
- `webhook.processed`: Webhook ditangani + durasi.
- `webhook.error`: error handler Webhook.
- `message.queued`: pesan dimasukkan ke antrean untuk diproses.
- `message.processed`: hasil + durasi + error opsional.

Antrean + sesi:

- `queue.lane.enqueue`: enqueue jalur antrean perintah + kedalaman.
- `queue.lane.dequeue`: dequeue jalur antrean perintah + waktu tunggu.
- `session.state`: transisi status sesi + alasan.
- `session.stuck`: peringatan sesi macet + usia.
- `run.attempt`: metadata retry/percobaan eksekusi.
- `diagnostic.heartbeat`: counter agregat (Webhook/antrean/sesi).

### Aktifkan diagnostik (tanpa exporter)

Gunakan ini jika Anda ingin peristiwa diagnostik tersedia untuk plugin atau sink kustom:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flag diagnostik (log terarah)

Gunakan flag untuk mengaktifkan log debug tambahan yang terarah tanpa menaikkan `logging.level`.
Flag tidak peka huruf besar-kecil dan mendukung wildcard (misalnya `telegram.*` atau `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Override env (sekali pakai):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Catatan:

- Log flag masuk ke file log standar (sama seperti `logging.file`).
- Output tetap disamarkan sesuai `logging.redactSensitive`.
- Panduan lengkap: [/diagnostics/flags](/id/diagnostics/flags).

### Ekspor ke OpenTelemetry

Diagnostik dapat diekspor melalui plugin `diagnostics-otel` (OTLP/HTTP). Ini
bekerja dengan collector/backend OpenTelemetry apa pun yang menerima OTLP/HTTP.

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
- Metrik mencakup penggunaan token, biaya, ukuran konteks, durasi eksekusi, dan counter/histogram alur pesan (Webhook, antrean, status sesi, kedalaman/waktu tunggu antrean).
- Trace/metrik dapat diaktifkan/nonaktifkan dengan `traces` / `metrics` (default: aktif). Trace
  mencakup span penggunaan model plus span pemrosesan Webhook/pesan saat diaktifkan.
- Setel `headers` saat collector Anda memerlukan auth.
- Variabel environment yang didukung: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Metrik yang diekspor (nama + tipe)

Penggunaan model:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Alur pesan:

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.outcome`)

Antrean + sesi:

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` atau
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

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
- Interval ekspor metrik: `diagnostics.otel.flushIntervalMs` (min 1000md).

### Catatan protokol

- Endpoint OTLP/HTTP dapat disetel melalui `diagnostics.otel.endpoint` atau
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Jika endpoint sudah mengandung `/v1/traces` atau `/v1/metrics`, endpoint tersebut digunakan apa adanya.
- Jika endpoint sudah mengandung `/v1/logs`, endpoint tersebut digunakan apa adanya untuk log.
- `diagnostics.otel.logs` mengaktifkan ekspor log OTLP untuk output logger utama.

### Perilaku ekspor log

- Log OTLP menggunakan record terstruktur yang sama dengan yang ditulis ke `logging.file`.
- Menghormati `logging.level` (level log file). Redaksi konsol **tidak** berlaku
  untuk log OTLP.
- Instalasi dengan volume tinggi sebaiknya memilih sampling/filtering collector OTLP.

## Tips pemecahan masalah

- **Gateway tidak dapat dijangkau?** Jalankan `openclaw doctor` terlebih dahulu.
- **Log kosong?** Periksa bahwa Gateway sedang berjalan dan menulis ke path file
  di `logging.file`.
- **Butuh detail lebih banyak?** Setel `logging.level` ke `debug` atau `trace` lalu coba lagi.

## Terkait

- [Internal Logging Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Diagnostik](/id/gateway/configuration-reference#diagnostics) — ekspor OpenTelemetry dan config trace cache
