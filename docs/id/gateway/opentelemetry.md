---
read_when:
    - Anda ingin mengirim penggunaan model OpenClaw, alur pesan, atau metrik sesi ke kolektor OpenTelemetry
    - Anda sedang menghubungkan jejak, metrik, atau log ke Grafana, Datadog, Honeycomb, New Relic, Tempo, atau backend OTLP lainnya
    - Anda memerlukan nama metrik, nama span, atau bentuk atribut yang tepat untuk membuat dasbor atau peringatan
summary: Ekspor diagnostik OpenClaw ke kolektor OpenTelemetry apa pun melalui plugin diagnostics-otel (OTLP/HTTP)
title: Ekspor OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T20:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3287540a32b9b8400f227ab9400073e8145af89e5246e6af06945a96b751826f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw mengekspor diagnostik melalui Plugin resmi `diagnostics-otel`
menggunakan **OTLP/HTTP (protobuf)**. Kolektor atau backend apa pun yang menerima OTLP/HTTP
berfungsi tanpa perubahan kode. Untuk log file lokal dan cara membacanya, lihat
[Logging](/id/logging).

## Cara kerjanya

- **Peristiwa diagnostik** adalah rekaman terstruktur dalam proses yang dipancarkan oleh
  Gateway dan plugin bawaan untuk proses model, alur pesan, sesi, antrean,
  dan exec.
- **Plugin `diagnostics-otel`** berlangganan ke peristiwa tersebut dan mengekspornya sebagai
  **metrik**, **trace**, dan **log** OpenTelemetry melalui OTLP/HTTP.
- **Panggilan provider** menerima header W3C `traceparent` dari konteks span
  panggilan model tepercaya milik OpenClaw ketika transport provider menerima
  header kustom. Konteks trace yang dipancarkan Plugin tidak dipropagasikan.
- Eksportir hanya terpasang ketika permukaan diagnostik dan Plugin sama-sama
  diaktifkan, sehingga biaya dalam proses tetap mendekati nol secara default.

## Mulai cepat

Untuk instalasi paket, instal Plugin terlebih dahulu:

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

Anda juga dapat mengaktifkan Plugin dari CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` saat ini hanya mendukung `http/protobuf`. `grpc` diabaikan.
</Note>

## Sinyal yang diekspor

| Sinyal      | Apa yang masuk ke dalamnya                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrik** | Counter dan histogram untuk penggunaan token, biaya, durasi run, alur pesan, lane antrean, status sesi, exec, dan tekanan memori.          |
| **Trace**  | Span untuk penggunaan model, panggilan model, siklus hidup harness, eksekusi alat, exec, pemrosesan Webhook/pesan, penyusunan konteks, dan loop alat. |
| **Log**    | Rekaman `logging.file` terstruktur yang diekspor melalui OTLP ketika `diagnostics.otel.logs` diaktifkan.                                              |

Aktifkan atau nonaktifkan `traces`, `metrics`, dan `logs` secara independen. Ketiganya aktif secara default
ketika `diagnostics.otel.enabled` bernilai true.

## Referensi konfigurasi

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### Variabel lingkungan

| Variabel                                                                                                          | Tujuan                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Menimpa `diagnostics.otel.endpoint`. Jika nilainya sudah berisi `/v1/traces`, `/v1/metrics`, atau `/v1/logs`, nilai tersebut digunakan apa adanya.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Penimpaan endpoint khusus sinyal yang digunakan ketika kunci konfigurasi `diagnostics.otel.*Endpoint` yang cocok belum disetel. Konfigurasi khusus sinyal mengalahkan env khusus sinyal, yang mengalahkan endpoint bersama.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Menimpa `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Menimpa protokol wire (hanya `http/protobuf` yang dihormati saat ini).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Setel ke `gen_ai_latest_experimental` untuk memancarkan atribut span GenAI eksperimental terbaru (`gen_ai.provider.name`) alih-alih `gen_ai.system` lama. Metrik GenAI selalu menggunakan atribut semantik terbatas dan berkardinalitas rendah. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Setel ke `1` ketika preload atau proses host lain sudah mendaftarkan OpenTelemetry SDK global. Plugin kemudian melewati siklus hidup NodeSDK miliknya sendiri tetapi tetap memasang listener diagnostik dan menghormati `traces`/`metrics`/`logs`.                |

## Privasi dan penangkapan konten

Konten mentah model/alat **tidak** diekspor secara default. Span membawa
pengidentifikasi terbatas (channel, provider, model, kategori error, ID permintaan hanya-hash)
dan tidak pernah menyertakan teks prompt, teks respons, input alat, output alat, atau
kunci sesi.

Permintaan model keluar dapat menyertakan header W3C `traceparent`. Header tersebut
hanya dibuat dari konteks trace diagnostik milik OpenClaw untuk panggilan model
aktif. Header `traceparent` yang sudah ada dari pemanggil akan diganti, sehingga plugin atau
opsi provider kustom tidak dapat memalsukan leluhur trace lintas layanan.

Setel `diagnostics.otel.captureContent.*` ke `true` hanya ketika kolektor dan
kebijakan retensi Anda sudah disetujui untuk teks prompt, respons, alat, atau
system-prompt. Setiap subkunci diikutsertakan secara independen:

- `inputMessages` — konten prompt pengguna.
- `outputMessages` — konten respons model.
- `toolInputs` — payload argumen alat.
- `toolOutputs` — payload hasil alat.
- `systemPrompt` — prompt sistem/developer yang disusun.

Ketika subkunci apa pun diaktifkan, span model dan alat mendapat atribut
`openclaw.content.*` yang terbatas dan disunting hanya untuk kelas tersebut.

## Sampling dan flushing

- **Trace:** `diagnostics.otel.sampleRate` (hanya root-span, `0.0` membuang semua,
  `1.0` mempertahankan semua).
- **Metrik:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Log:** Log OTLP menghormati `logging.level` (level log file). Log tersebut menggunakan
  jalur penyuntingan rekaman log diagnostik, bukan pemformatan konsol. Instalasi bervolume tinggi
  sebaiknya memilih sampling/filtering kolektor OTLP daripada sampling lokal.
- **Korelasi log file:** Log file JSONL menyertakan `traceId`,
  `spanId`, `parentSpanId`, dan `traceFlags` tingkat atas ketika panggilan log membawa konteks
  trace diagnostik yang valid, yang memungkinkan pemroses log menggabungkan baris log lokal dengan
  span yang diekspor.
- **Korelasi permintaan:** Permintaan HTTP Gateway dan frame WebSocket membuat
  cakupan trace permintaan internal. Log dan peristiwa diagnostik di dalam cakupan tersebut
  mewarisi trace permintaan secara default, sementara span run agen dan panggilan model
  dibuat sebagai anak sehingga header `traceparent` provider tetap berada pada trace yang sama.

## Metrik yang diekspor

### Penggunaan model

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metrik konvensi semantik GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, detik, metrik konvensi semantik GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opsional `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, ditambah `openclaw.errorCategory` dan `openclaw.failureKind` pada error yang diklasifikasikan)
- `openclaw.model_call.request_bytes` (histogram, ukuran byte UTF-8 dari payload permintaan model akhir; tanpa konten payload mentah)
- `openclaw.model_call.response_bytes` (histogram, ukuran byte UTF-8 dari peristiwa respons model streaming; tanpa konten respons mentah)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, waktu berlalu sebelum peristiwa respons streaming pertama)

### Alur pesan

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Antrean dan sesi

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` atau `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; hanya dipancarkan untuk pembukuan sesi usang tanpa pekerjaan aktif)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; hanya dipancarkan untuk pembukuan sesi usang tanpa pekerjaan aktif)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Telemetri kelangsungan sesi

`diagnostics.stuckSessionWarnMs` adalah ambang usia tanpa progres untuk diagnostik
kelangsungan sesi. Sesi `processing` tidak menua menuju ambang ini
selama OpenClaw mengamati progres runtime balasan, alat, status, blok, atau ACP.
Keepalive pengetikan tidak dihitung sebagai progres, sehingga model atau harness yang senyap tetap dapat
dideteksi.

OpenClaw mengklasifikasikan sesi berdasarkan pekerjaan yang masih dapat diamatinya:

- `session.long_running`: pekerjaan tertanam aktif, panggilan model, atau panggilan alat
  masih membuat kemajuan.
- `session.stalled`: ada pekerjaan aktif, tetapi eksekusi aktif belum melaporkan
  kemajuan terbaru.
- `session.stuck`: pembukuan sesi usang tanpa pekerjaan aktif. Ini adalah
  satu-satunya klasifikasi keaktifan yang melepaskan lane sesi yang terdampak.

Hanya `session.stuck` yang memancarkan penghitung `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms`, dan rentang
`openclaw.session.stuck`. Diagnostik `session.stuck` yang berulang akan
mundur sementara sesi tetap tidak berubah, jadi dasbor sebaiknya memberi
peringatan pada peningkatan yang berkelanjutan, bukan setiap tick Heartbeat.
Untuk knob konfigurasi dan default, lihat
[Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics).

### Siklus hidup harness

- `openclaw.harness.duration_ms` (histogram, atribut: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` pada galat)

### Eksekusi

- `openclaw.exec.duration_ms` (histogram, atribut: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internal diagnostik (memori dan loop alat)

- `openclaw.memory.heap_used_bytes` (histogram, atribut: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (penghitung, atribut: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (penghitung, atribut: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, atribut: `openclaw.toolName`, `openclaw.outcome`)

## Rentang yang diekspor

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` secara default, atau `gen_ai.provider.name` saat konvensi semantik GenAI terbaru diikutsertakan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` secara default, atau `gen_ai.provider.name` saat konvensi semantik GenAI terbaru diikutsertakan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` dan `openclaw.failureKind` opsional pada galat
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hash berbasis SHA yang dibatasi dari id permintaan penyedia hulu; id mentah tidak diekspor)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Saat selesai: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Saat galat: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opsional
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (tanpa konten prompt, riwayat, respons, atau kunci sesi)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (tanpa pesan loop, parameter, atau keluaran alat)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Saat penangkapan konten diaktifkan secara eksplisit, rentang model dan alat juga
dapat menyertakan atribut `openclaw.content.*` yang dibatasi dan disunting untuk
kelas konten tertentu yang Anda ikutsertakan.

## Katalog peristiwa diagnostik

Peristiwa di bawah ini mendukung metrik dan rentang di atas. Plugin juga dapat
berlangganan langsung ke peristiwa tersebut tanpa ekspor OTLP.

**Penggunaan model**

- `model.usage` — token, biaya, durasi, konteks, penyedia/model/channel,
  id sesi. `usage` adalah akuntansi penyedia/giliran untuk biaya dan telemetri;
  `context.used` adalah snapshot prompt/konteks saat ini dan dapat lebih rendah
  daripada `usage.total` penyedia saat input cache atau panggilan loop alat terlibat.

**Alur pesan**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Antrean dan sesi**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (penghitung agregat: webhook/antrean/sesi)

**Siklus hidup harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  siklus hidup per eksekusi untuk harness agen. Menyertakan `harnessId`, `pluginId`
  opsional, penyedia/model/channel, dan id eksekusi. Penyelesaian menambahkan
  `durationMs`, `outcome`, `resultClassification` opsional, `yieldDetected`,
  dan jumlah `itemLifecycle`. Galat menambahkan `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, dan
  `cleanupFailed` opsional.

**Eksekusi**

- `exec.process.completed` — hasil terminal, durasi, target, mode, kode keluar,
  dan jenis kegagalan. Teks perintah dan direktori kerja tidak disertakan.

## Tanpa pengekspor

Anda dapat membuat peristiwa diagnostik tetap tersedia untuk Plugin atau sink
kustom tanpa menjalankan `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Untuk keluaran debug tertarget tanpa menaikkan `logging.level`, gunakan flag
diagnostik. Flag tidak peka huruf besar/kecil dan mendukung wildcard (mis.
`telegram.*` atau `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Atau sebagai penimpaan env satu kali:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Keluaran flag masuk ke file log standar (`logging.file`) dan tetap disunting
oleh `logging.redactSensitive`. Panduan lengkap:
[Flag diagnostik](/id/diagnostics/flags).

## Nonaktifkan

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Anda juga dapat mengeluarkan `diagnostics-otel` dari `plugins.allow`, atau menjalankan
`openclaw plugins disable diagnostics-otel`.

## Terkait

- [Logging](/id/logging) — log file, keluaran konsol, tailing CLI, dan tab Log Control UI
- [Internal logging Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Flag diagnostik](/id/diagnostics/flags) — flag log debug tertarget
- [Ekspor diagnostik](/id/gateway/diagnostics) — alat support-bundle operator (terpisah dari ekspor OTEL)
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) — referensi lengkap bidang `diagnostics.*`
