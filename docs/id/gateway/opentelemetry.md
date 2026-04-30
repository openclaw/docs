---
read_when:
    - Anda ingin mengirim penggunaan model OpenClaw, alur pesan, atau metrik sesi ke kolektor OpenTelemetry
    - Anda sedang mengintegrasikan trace, metrik, atau log ke Grafana, Datadog, Honeycomb, New Relic, Tempo, atau backend OTLP lainnya
    - Anda memerlukan nama metrik, nama span, atau bentuk atribut yang tepat untuk membuat dasbor atau peringatan
summary: Ekspor diagnostik OpenClaw ke kolektor OpenTelemetry mana pun melalui Plugin diagnostics-otel (OTLP/HTTP)
title: Ekspor OpenTelemetry
x-i18n:
    generated_at: "2026-04-30T09:50:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9d06589d281223ebb57e76f6f19441d30c138b9f7b0636198ab7bae5fad3c8a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw mengekspor diagnostik melalui Plugin `diagnostics-otel` bawaan
menggunakan **OTLP/HTTP (protobuf)**. Collector atau backend apa pun yang menerima OTLP/HTTP
berfungsi tanpa perubahan kode. Untuk log file lokal dan cara membacanya, lihat
[Logging](/id/logging).

## Cara semuanya terhubung

- **Peristiwa diagnostik** adalah record terstruktur dalam proses yang dipancarkan oleh
  Gateway dan Plugin bawaan untuk eksekusi model, alur pesan, sesi, antrean,
  dan exec.
- **Plugin `diagnostics-otel`** berlangganan peristiwa tersebut dan mengekspornya sebagai
  **metrik**, **trace**, dan **log** OpenTelemetry melalui OTLP/HTTP.
- **Panggilan provider** menerima header W3C `traceparent` dari konteks span
  panggilan model tepercaya OpenClaw saat transport provider menerima header
  kustom. Konteks trace yang dipancarkan Plugin tidak dipropagasikan.
- Exporter hanya dipasang saat permukaan diagnostik dan Plugin sama-sama
  diaktifkan, sehingga biaya dalam proses tetap mendekati nol secara default.

## Mulai cepat

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

| Sinyal      | Isi di dalamnya                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrik**  | Counter dan histogram untuk penggunaan token, biaya, durasi eksekusi, alur pesan, jalur antrean, status sesi, exec, dan tekanan memori.    |
| **Trace**   | Span untuk penggunaan model, panggilan model, siklus hidup harness, eksekusi tool, exec, pemrosesan webhook/pesan, penyusunan konteks, dan loop tool. |
| **Log**     | Record `logging.file` terstruktur yang diekspor melalui OTLP saat `diagnostics.otel.logs` diaktifkan.                                      |

Aktifkan atau nonaktifkan `traces`, `metrics`, dan `logs` secara terpisah. Ketiganya default aktif
saat `diagnostics.otel.enabled` bernilai true.

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
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Mengganti `diagnostics.otel.endpoint`. Jika nilainya sudah berisi `/v1/traces`, `/v1/metrics`, atau `/v1/logs`, nilai tersebut digunakan apa adanya.                                                                                       |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Penggantian endpoint khusus sinyal yang digunakan saat kunci konfigurasi `diagnostics.otel.*Endpoint` yang sesuai belum disetel. Konfigurasi khusus sinyal mengalahkan env khusus sinyal, yang mengalahkan endpoint bersama.              |
| `OTEL_SERVICE_NAME`                                                                                               | Mengganti `diagnostics.otel.serviceName`.                                                                                                                                                                                                 |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Mengganti protokol wire protocol (hanya `http/protobuf` yang dihormati saat ini).                                                                                                                                                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Setel ke `gen_ai_latest_experimental` untuk memancarkan atribut span GenAI eksperimental terbaru (`gen_ai.provider.name`) alih-alih `gen_ai.system` lama. Metrik GenAI selalu menggunakan atribut semantik berbatas dan berkardinalitas rendah. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Setel ke `1` saat preload atau proses host lain sudah mendaftarkan OpenTelemetry SDK global. Plugin kemudian melewati siklus hidup NodeSDK miliknya sendiri tetapi tetap menghubungkan listener diagnostik dan menghormati `traces`/`metrics`/`logs`. |

## Privasi dan pengambilan konten

Konten mentah model/tool **tidak** diekspor secara default. Span membawa
identifier berbatas (channel, provider, model, kategori error, id permintaan hanya hash)
dan tidak pernah menyertakan teks prompt, teks respons, input tool, output tool, atau
kunci sesi.

Permintaan model keluar dapat menyertakan header W3C `traceparent`. Header tersebut
dibuat hanya dari konteks trace diagnostik milik OpenClaw untuk panggilan model
aktif. Header `traceparent` yang sudah diberikan pemanggil akan diganti, sehingga Plugin atau
opsi provider kustom tidak dapat memalsukan silsilah trace lintas layanan.

Setel `diagnostics.otel.captureContent.*` ke `true` hanya saat collector dan
kebijakan retensi Anda disetujui untuk teks prompt, respons, tool, atau system-prompt.
Setiap subkunci bersifat opt-in secara terpisah:

- `inputMessages` — konten prompt pengguna.
- `outputMessages` — konten respons model.
- `toolInputs` — payload argumen tool.
- `toolOutputs` — payload hasil tool.
- `systemPrompt` — prompt sistem/developer yang disusun.

Saat subkunci apa pun diaktifkan, span model dan tool mendapatkan atribut
`openclaw.content.*` berbatas dan disunting hanya untuk kelas tersebut.

## Sampling dan flushing

- **Trace:** `diagnostics.otel.sampleRate` (hanya root-span, `0.0` membuang semua,
  `1.0` menyimpan semua).
- **Metrik:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Log:** Log OTLP menghormati `logging.level` (level log file). Log tersebut menggunakan
  jalur penyuntingan record log diagnostik, bukan pemformatan konsol. Instalasi bervolume tinggi
  sebaiknya memilih sampling/filtering collector OTLP daripada sampling lokal.
- **Korelasi file-log:** Log file JSONL menyertakan `traceId`,
  `spanId`, `parentSpanId`, dan `traceFlags` di tingkat teratas saat panggilan log membawa
  konteks trace diagnostik yang valid, sehingga pemroses log dapat menggabungkan baris log lokal dengan
  span yang diekspor.
- **Korelasi permintaan:** Permintaan HTTP Gateway dan frame WebSocket membuat
  cakupan trace permintaan internal. Log dan peristiwa diagnostik di dalam cakupan tersebut
  mewarisi trace permintaan secara default, sementara span eksekusi agent dan panggilan model
  dibuat sebagai anak sehingga header `traceparent` provider tetap berada pada trace yang sama.

## Metrik yang diekspor

### Penggunaan model

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metrik konvensi semantik GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, detik, metrik konvensi semantik GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opsional)
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
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Siklus hidup harness

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` pada error)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internal diagnostik (memori dan loop tool)

- `openclaw.memory.heap_used_bytes` (histogram, atribut: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, atribut: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, atribut: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, atribut: `openclaw.toolName`, `openclaw.outcome`)

## Span yang diekspor

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` secara default, atau `gen_ai.provider.name` saat konvensi semantik GenAI terbaru diaktifkan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` secara default, atau `gen_ai.provider.name` saat konvensi semantik GenAI terbaru diaktifkan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` dan `openclaw.failureKind` opsional pada kesalahan
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hash berbasis SHA terbatas dari id permintaan penyedia upstream; id mentah tidak diekspor)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Saat selesai: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Saat error: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opsional
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (tanpa prompt, riwayat, respons, atau konten session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (tanpa pesan loop, parameter, atau keluaran tool)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Saat penangkapan konten diaktifkan secara eksplisit, span model dan tool juga dapat
menyertakan atribut `openclaw.content.*` yang terbatas dan disunting untuk kelas
konten tertentu yang Anda pilih.

## Katalog peristiwa diagnostik

Peristiwa di bawah mendukung metrik dan span di atas. Plugin juga dapat berlangganan
langsung ke peristiwa tersebut tanpa ekspor OTLP.

**Penggunaan model**

- `model.usage` — token, biaya, durasi, konteks, penyedia/model/channel,
  id sesi. `usage` adalah akuntansi penyedia/turn untuk biaya dan telemetri;
  `context.used` adalah snapshot prompt/konteks saat ini dan dapat lebih rendah daripada
  `usage.total` penyedia saat input yang di-cache atau panggilan tool-loop terlibat.

**Alur pesan**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Antrean dan sesi**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (counter agregat: webhook/antrean/sesi)

**Siklus hidup harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  siklus hidup per-run untuk harness agen. Mencakup `harnessId`, `pluginId` opsional,
  penyedia/model/channel, dan id run. Penyelesaian menambahkan
  `durationMs`, `outcome`, `resultClassification` opsional, `yieldDetected`,
  dan hitungan `itemLifecycle`. Error menambahkan `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, dan
  `cleanupFailed` opsional.

**Exec**

- `exec.process.completed` — hasil terminal, durasi, target, mode, kode keluar,
  dan jenis kegagalan. Teks perintah dan direktori kerja tidak
  disertakan.

## Tanpa pengekspor

Anda dapat tetap menyediakan peristiwa diagnostik untuk plugin atau sink khusus tanpa
menjalankan `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Untuk keluaran debug tertarget tanpa menaikkan `logging.level`, gunakan flag diagnostik.
Flag tidak peka huruf besar/kecil dan mendukung wildcard (misalnya `telegram.*` atau
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Atau sebagai override env sekali pakai:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Keluaran flag masuk ke file log standar (`logging.file`) dan tetap
disunting oleh `logging.redactSensitive`. Panduan lengkap:
[Flag diagnostik](/id/diagnostics/flags).

## Nonaktifkan

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Anda juga dapat tidak menyertakan `diagnostics-otel` dari `plugins.allow`, atau menjalankan
`openclaw plugins disable diagnostics-otel`.

## Terkait

- [Pencatatan log](/id/logging) — log file, keluaran konsol, tailing CLI, dan tab Log Control UI
- [Internal pencatatan log Gateway](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Flag diagnostik](/id/diagnostics/flags) — flag log-debug tertarget
- [Ekspor diagnostik](/id/gateway/diagnostics) — tool support-bundle operator (terpisah dari ekspor OTEL)
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) — referensi lengkap field `diagnostics.*`
