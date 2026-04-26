---
read_when:
    - Anda ingin mengirim penggunaan model, alur pesan, atau metrik sesi OpenClaw ke kolektor OpenTelemetry
    - Anda sedang menghubungkan trace, metrik, atau log ke Grafana, Datadog, Honeycomb, New Relic, Tempo, atau backend OTLP lainnya
    - Anda memerlukan nama metrik, nama span, atau bentuk atribut yang tepat untuk membangun dashboard atau alert
summary: Ekspor diagnostik OpenClaw ke kolektor OpenTelemetry apa pun melalui Plugin diagnostics-otel (OTLP/HTTP)
title: Ekspor OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T11:29:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw mengekspor diagnostik melalui Plugin `diagnostics-otel` bawaan
menggunakan **OTLP/HTTP (protobuf)**. Kolektor atau backend apa pun yang menerima OTLP/HTTP
berfungsi tanpa perubahan kode. Untuk log file lokal dan cara membacanya, lihat
[Logging](/id/logging).

## Cara kerjanya

- **Peristiwa diagnostik** adalah rekaman terstruktur dalam proses yang dipancarkan oleh
  Gateway dan Plugin bawaan untuk eksekusi model, alur pesan, sesi, antrean,
  dan exec.
- **Plugin `diagnostics-otel`** berlangganan ke peristiwa tersebut dan mengekspornya sebagai
  OpenTelemetry **metrics**, **traces**, dan **logs** melalui OTLP/HTTP.
- **Panggilan provider** menerima header W3C `traceparent` dari konteks span panggilan model
  tepercaya milik OpenClaw saat transport provider menerima header kustom.
  Konteks trace yang dipancarkan Plugin tidak dipropagasikan.
- Exporter hanya dipasang saat surface diagnostik dan Plugin sama-sama
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

| Sinyal      | Apa yang dimasukkan di dalamnya                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Counter dan histogram untuk penggunaan token, biaya, durasi eksekusi, alur pesan, lane antrean, state sesi, exec, dan tekanan memori.     |
| **Traces**  | Span untuk penggunaan model, panggilan model, siklus hidup harness, eksekusi tool, exec, pemrosesan webhook/pesan, perakitan konteks, dan loop tool. |
| **Logs**    | Rekaman `logging.file` terstruktur yang diekspor melalui OTLP saat `diagnostics.otel.logs` diaktifkan.                                     |

Aktifkan/nonaktifkan `traces`, `metrics`, dan `logs` secara independen. Ketiganya default aktif
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
      protocol: "http/protobuf", // grpc diabaikan
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // sampler root-span, 0.0..1.0
      flushIntervalMs: 60000, // interval ekspor metrik (minimum 1000md)
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

| Variabel                                                                                                          | Tujuan                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Override `diagnostics.otel.endpoint`. Jika nilainya sudah berisi `/v1/traces`, `/v1/metrics`, atau `/v1/logs`, nilai itu digunakan apa adanya.                                                                                           |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Override endpoint khusus sinyal yang digunakan saat kunci config `diagnostics.otel.*Endpoint` yang cocok tidak disetel. Config khusus sinyal lebih diutamakan daripada env khusus sinyal, yang lebih diutamakan daripada endpoint bersama. |
| `OTEL_SERVICE_NAME`                                                                                               | Override `diagnostics.otel.serviceName`.                                                                                                                                                                                                    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Override protokol wire (hanya `http/protobuf` yang dihormati saat ini).                                                                                                                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Setel ke `gen_ai_latest_experimental` untuk memancarkan atribut span GenAI eksperimental terbaru (`gen_ai.provider.name`) alih-alih `gen_ai.system` lama. Metrik GenAI selalu menggunakan atribut semantik berbatas dengan kardinalitas rendah. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Setel ke `1` saat preload lain atau proses host sudah mendaftarkan SDK OpenTelemetry global. Plugin kemudian melewati siklus hidup NodeSDK miliknya sendiri tetapi tetap memasang listener diagnostik dan menghormati `traces`/`metrics`/`logs`. |

## Privasi dan penangkapan konten

Konten model/tool mentah **tidak** diekspor secara default. Span membawa
pengenal berbatas (kanal, provider, model, kategori error, id permintaan khusus hash)
dan tidak pernah menyertakan teks prompt, teks respons, input tool, output tool, atau
kunci sesi.

Permintaan model keluar dapat menyertakan header W3C `traceparent`. Header itu
dihasilkan hanya dari konteks trace diagnostik milik OpenClaw untuk panggilan model
aktif. Header `traceparent` yang sudah disediakan pemanggil akan diganti, sehingga Plugin atau
opsi provider kustom tidak dapat memalsukan leluhur trace lintas layanan.

Setel `diagnostics.otel.captureContent.*` ke `true` hanya saat kolektor dan
kebijakan retensi Anda disetujui untuk teks prompt, respons, tool, atau
system prompt. Setiap subkunci bersifat opt-in secara independen:

- `inputMessages` — konten prompt pengguna.
- `outputMessages` — konten respons model.
- `toolInputs` — payload argumen tool.
- `toolOutputs` — payload hasil tool.
- `systemPrompt` — prompt system/developer yang dirakit.

Saat subkunci apa pun diaktifkan, span model dan tool mendapatkan atribut
`openclaw.content.*` yang dibatasi dan disunting hanya untuk kelas tersebut.

## Sampling dan flushing

- **Traces:** `diagnostics.otel.sampleRate` (hanya root-span, `0.0` membuang semua,
  `1.0` menyimpan semua).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logs:** Log OTLP mengikuti `logging.level` (level log file). Redaksi
  konsol **tidak** berlaku untuk log OTLP. Instalasi dengan volume tinggi sebaiknya
  memilih sampling/filtering kolektor OTLP daripada sampling lokal.

## Metrics yang diekspor

### Penggunaan model

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metrik semantic-conventions GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, detik, metrik semantic-conventions GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opsional `error.type`)

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

- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Span yang diekspor

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` secara default, atau `gen_ai.provider.name` saat semantic conventions GenAI terbaru diikutsertakan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` secara default, atau `gen_ai.provider.name` saat semantic conventions GenAI terbaru diikutsertakan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (hash berbatas berbasis SHA dari id permintaan provider upstream; id mentah tidak diekspor)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Saat selesai: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Saat error: `openclaw.harness.phase`, `openclaw.errorCategory`, opsional `openclaw.harness.cleanup_failed`
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (tanpa pesan loop, params, atau output tool)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Saat penangkapan konten diaktifkan secara eksplisit, span model dan tool juga dapat
menyertakan atribut `openclaw.content.*` yang dibatasi dan disunting untuk kelas
konten spesifik yang Anda pilih.

## Katalog peristiwa diagnostik

Peristiwa di bawah ini mendasari metrics dan span di atas. Plugin juga dapat berlangganan
langsung ke peristiwa ini tanpa ekspor OTLP.

**Penggunaan model**

- `model.usage` — token, biaya, durasi, konteks, provider/model/kanal,
  id sesi. `usage` adalah akuntansi provider/giliran untuk biaya dan telemetri;
  `context.used` adalah snapshot prompt/konteks saat ini dan dapat lebih rendah daripada
  `usage.total` provider saat input yang di-cache atau panggilan loop tool terlibat.

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
  siklus hidup per eksekusi untuk harness agen. Mencakup `harnessId`, opsional
  `pluginId`, provider/model/kanal, dan id eksekusi. Penyelesaian menambahkan
  `durationMs`, `outcome`, opsional `resultClassification`, `yieldDetected`,
  dan jumlah `itemLifecycle`. Error menambahkan `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, dan
  opsional `cleanupFailed`.

**Exec**

- `exec.process.completed` — hasil akhir, durasi, target, mode, exit
  code, dan jenis kegagalan. Teks perintah dan direktori kerja tidak
  disertakan.

## Tanpa exporter

Anda dapat menjaga peristiwa diagnostik tetap tersedia untuk Plugin atau sink kustom tanpa
menjalankan `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Untuk output debug terarah tanpa menaikkan `logging.level`, gunakan flag
diagnostik. Flag tidak peka huruf besar/kecil dan mendukung wildcard (misalnya `telegram.*` atau
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Atau sebagai override env sekali jalan:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Output flag masuk ke log file standar (`logging.file`) dan tetap
disunting oleh `logging.redactSensitive`. Panduan lengkap:
[Diagnostics flags](/id/diagnostics/flags).

## Nonaktifkan

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Anda juga dapat tidak menyertakan `diagnostics-otel` dari `plugins.allow`, atau menjalankan
`openclaw plugins disable diagnostics-otel`.

## Terkait

- [Logging](/id/logging) — log file, output konsol, tailing CLI, dan tab Logs UI Control
- [Gateway logging internals](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Diagnostics flags](/id/diagnostics/flags) — flag debug-log terarah
- [Diagnostics export](/id/gateway/diagnostics) — tool bundel dukungan operator (terpisah dari ekspor OTEL)
- [Configuration reference](/id/gateway/configuration-reference#diagnostics) — referensi lengkap field `diagnostics.*`
