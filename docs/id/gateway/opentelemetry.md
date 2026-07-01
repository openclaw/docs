---
read_when:
    - Anda ingin mengirim penggunaan model OpenClaw, alur pesan, atau metrik sesi ke kolektor OpenTelemetry
    - Anda sedang menghubungkan trace, metrik, atau log ke Grafana, Datadog, Honeycomb, New Relic, Tempo, atau backend OTLP lainnya
    - Anda memerlukan nama metrik, nama span, atau bentuk atribut yang tepat untuk membuat dasbor atau peringatan
summary: Ekspor diagnostik OpenClaw ke kolektor OpenTelemetry atau stdout JSONL melalui Plugin diagnostics-otel
title: Ekspor OpenTelemetry
x-i18n:
    generated_at: "2026-07-01T08:32:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw mengekspor diagnostik melalui plugin resmi `diagnostics-otel`
menggunakan **OTLP/HTTP (protobuf)**. Log juga dapat ditulis sebagai stdout JSONL untuk
pipeline log container dan sandbox. Collector atau backend apa pun yang menerima
OTLP/HTTP berfungsi tanpa perubahan kode. Untuk log file lokal dan cara membacanya,
lihat [Logging](/id/logging).

## Cara kerjanya bersama

- **Peristiwa diagnostik** adalah rekaman terstruktur dalam proses yang dipancarkan oleh
  Gateway dan plugin bawaan untuk run model, alur pesan, sesi, antrean,
  dan exec.
- **Plugin `diagnostics-otel`** berlangganan peristiwa tersebut dan mengekspornya sebagai
  **metrik**, **trace**, dan **log** OpenTelemetry melalui OTLP/HTTP. Plugin ini juga dapat
  mencerminkan rekaman log diagnostik ke stdout JSONL.
- **Panggilan penyedia** menerima header W3C `traceparent` dari konteks span
  panggilan model tepercaya milik OpenClaw ketika transport penyedia menerima header
  khusus. Konteks trace yang dipancarkan plugin tidak dipropagasikan.
- Exporter hanya terpasang ketika permukaan diagnostik dan plugin sama-sama
  diaktifkan, sehingga biaya dalam proses tetap mendekati nol secara default.

## Mulai cepat

Untuk instalasi paket, instal plugin terlebih dahulu:

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

Anda juga dapat mengaktifkan plugin dari CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` saat ini hanya mendukung `http/protobuf`. `grpc` diabaikan.
</Note>

## Sinyal yang diekspor

| Sinyal      | Isi di dalamnya                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrik** | Counter dan histogram untuk penggunaan token, biaya, durasi run, failover, penggunaan Skills, alur pesan, peristiwa Talk, jalur antrean, status/pemulihan sesi, eksekusi alat, payload berukuran terlalu besar, exec, dan tekanan memori. |
| **Trace**  | Span untuk penggunaan model, panggilan model, siklus hidup harness, penggunaan Skills, eksekusi alat, exec, pemrosesan Webhook/pesan, penyusunan konteks, dan loop alat.                                                            |
| **Log**    | Rekaman `logging.file` terstruktur yang diekspor melalui OTLP atau stdout JSONL ketika `diagnostics.otel.logs` diaktifkan; body log ditahan kecuali penangkapan konten diaktifkan secara eksplisit.                                |

Alihkan `traces`, `metrics`, dan `logs` secara terpisah. Trace dan metrik
aktif secara default ketika `diagnostics.otel.enabled` bernilai true. Log nonaktif secara default dan
diekspor hanya ketika `diagnostics.otel.logs` secara eksplisit bernilai `true`. Ekspor log
default-nya adalah OTLP; atur `diagnostics.otel.logsExporter` ke `stdout` untuk JSONL di
stdout, atau `both` untuk mengirim setiap rekaman log diagnostik ke OTLP dan stdout.

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
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### Variabel lingkungan

| Variabel                                                                                                          | Tujuan                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Mengganti `diagnostics.otel.endpoint`. Jika nilainya sudah berisi `/v1/traces`, `/v1/metrics`, atau `/v1/logs`, nilai tersebut digunakan apa adanya.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Pengganti endpoint khusus sinyal yang digunakan ketika kunci konfigurasi `diagnostics.otel.*Endpoint` yang sesuai belum diatur. Konfigurasi khusus sinyal mengalahkan env khusus sinyal, yang mengalahkan endpoint bersama.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Mengganti `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Mengganti protokol wire (hanya `http/protobuf` yang dihormati saat ini).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Atur ke `gen_ai_latest_experimental` untuk memancarkan bentuk span inferensi GenAI eksperimental terbaru, termasuk nama span `{gen_ai.operation.name} {gen_ai.request.model}`, jenis span `CLIENT`, dan `gen_ai.provider.name` alih-alih `gen_ai.system` legacy. Metrik GenAI selalu menggunakan atribut semantik berbatas dan ber-kardinalitas rendah terlepas dari itu. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Atur ke `1` ketika preload lain atau proses host sudah mendaftarkan SDK OpenTelemetry global. Plugin kemudian melewati siklus hidup NodeSDK miliknya sendiri tetapi tetap memasang listener diagnostik dan menghormati `traces`/`metrics`/`logs`.                                                                                                                    |

## Privasi dan penangkapan konten

Konten model/alat mentah **tidak** diekspor secara default. Span membawa
pengidentifikasi berbatas (channel, penyedia, model, kategori kesalahan, id permintaan hanya-hash,
sumber alat, pemilik alat, dan nama/sumber Skills) dan tidak pernah menyertakan teks prompt,
teks respons, input alat, output alat, path file Skills, atau kunci sesi.
Rekaman log OTLP secara default mempertahankan severity, logger, lokasi kode, konteks trace tepercaya,
dan atribut yang telah disanitasi, tetapi body pesan log mentah diekspor
hanya ketika `diagnostics.otel.captureContent` diatur ke boolean `true`. Subkunci granular
`captureContent.*` tidak mengaktifkan body log. Label yang terlihat seperti
kunci sesi agen ber-scope diganti dengan `unknown`.
Metrik Talk hanya mengekspor metadata peristiwa berbatas seperti mode, transport,
penyedia, dan jenis peristiwa. Metrik ini tidak menyertakan transkrip, payload audio,
id sesi, id turn, id panggilan, id room, atau token handoff.

Permintaan model keluar dapat menyertakan header W3C `traceparent`. Header tersebut
dibuat hanya dari konteks trace diagnostik milik OpenClaw untuk panggilan model
aktif. Header `traceparent` yang sudah disediakan pemanggil diganti, sehingga plugin atau
opsi penyedia khusus tidak dapat memalsukan asal-usul trace lintas layanan.

Atur `diagnostics.otel.captureContent.*` ke `true` hanya ketika collector dan
kebijakan retensi Anda disetujui untuk teks prompt, respons, alat, atau system-prompt.
Setiap subkunci bersifat opt-in secara independen:

- `inputMessages` - konten prompt pengguna.
- `outputMessages` - konten respons model.
- `toolInputs` - payload argumen alat.
- `toolOutputs` - payload hasil alat.
- `systemPrompt` - prompt sistem/developer yang disusun.
- `toolDefinitions` - nama, deskripsi, dan skema alat model.

Ketika subkunci apa pun diaktifkan, span model dan alat mendapatkan atribut
`openclaw.content.*` yang berbatas dan direduksi hanya untuk kelas tersebut. Gunakan boolean
`captureContent: true` hanya untuk penangkapan diagnostik luas ketika body pesan log
OTLP juga disetujui untuk diekspor.

Konten `toolInputs`/`toolOutputs` ditangkap untuk eksekusi alat runtime agen bawaan
(`openclaw.content.tool_input` pada span selesai/error,
`openclaw.content.tool_output` pada span selesai). Panggilan alat harness eksternal
(Codex, Claude CLI) memancarkan span `tool.execution.*` tanpa payload konten.
Konten yang ditangkap berjalan melalui channel tepercaya yang hanya untuk listener dan tidak pernah ditempatkan
di bus peristiwa diagnostik publik.

## Sampling dan flushing

- **Trace:** `diagnostics.otel.sampleRate` (hanya root-span, `0.0` membuang semua,
  `1.0` mempertahankan semua).
- **Metrik:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Log:** Log OTLP mematuhi `logging.level` (level log file). Log tersebut menggunakan
  jalur redaksi diagnostic log-record, bukan pemformatan konsol. Instalasi bervolume tinggi
  sebaiknya memilih sampling/filtering kolektor OTLP daripada sampling lokal.
  Tetapkan `diagnostics.otel.logsExporter: "stdout"` ketika platform Anda sudah
  mengirim stdout/stderr ke pemroses log dan Anda tidak memiliki kolektor log OTLP.
  Rekaman stdout berupa satu objek JSON per baris dengan `ts`, `signal`,
  `service.name`, severity, body, atribut yang direduksi, dan field trace tepercaya
  ketika tersedia.
- **Korelasi file-log:** Log file JSONL menyertakan `traceId`,
  `spanId`, `parentSpanId`, dan `traceFlags` tingkat atas ketika pemanggilan log membawa
  konteks trace diagnostik yang valid, sehingga pemroses log dapat menggabungkan baris log lokal dengan
  span yang diekspor.
- **Korelasi request:** Request HTTP Gateway dan frame WebSocket membuat
  cakupan trace request internal. Log dan event diagnostik di dalam cakupan tersebut
  mewarisi trace request secara default, sementara span agent run dan model-call
  dibuat sebagai child sehingga header `traceparent` provider tetap berada pada trace yang sama.
- **Korelasi model-call:** Span `openclaw.model.call` menyertakan ukuran komponen prompt
  yang aman secara default dan menyertakan atribut token per panggilan ketika hasil
  provider mengekspos penggunaan. `openclaw.model.usage` tetap menjadi span akuntansi
  tingkat run untuk biaya agregat, konteks, dan dasbor channel; span ini tetap
  berada pada trace diagnostik yang sama ketika runtime yang memancarkan memiliki konteks trace
  tepercaya.

## Metrik yang diekspor

### Penggunaan model

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metrik konvensi semantik GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, detik, metrik konvensi semantik GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opsional `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, ditambah `openclaw.errorCategory` dan `openclaw.failureKind` pada error yang diklasifikasikan)
- `openclaw.model_call.request_bytes` (histogram, ukuran byte UTF-8 dari payload request model final; tanpa konten payload mentah)
- `openclaw.model_call.response_bytes` (histogram, ukuran byte UTF-8 dari payload chunk respons streaming; delta teks, thinking, dan tool-call berfrekuensi tinggi hanya menghitung byte `delta` inkremental; tanpa konten respons mentah)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, waktu yang berlalu sebelum event respons streaming pertama)
- `openclaw.model.failover` (counter, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (counter, attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, opsional `openclaw.agent`, opsional `openclaw.toolName`)

### Alur pesan

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Bicara

- `openclaw.talk.event` (counter, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, attrs: sama seperti `openclaw.talk.event`; dipancarkan ketika event Bicara melaporkan durasi)
- `openclaw.talk.audio.bytes` (histogram, attrs: sama seperti `openclaw.talk.event`; dipancarkan untuk event frame audio Bicara yang melaporkan panjang byte)

### Antrean dan sesi

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` atau `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; dipancarkan untuk pembukuan sesi usang yang dapat dipulihkan)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; dipancarkan untuk pembukuan sesi usang yang dapat dipulihkan)
- `openclaw.session.turn.created` (counter, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (counter, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (counter, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, attrs: sama seperti counter recovery yang cocok)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Telemetri keaktifan sesi

`diagnostics.stuckSessionWarnMs` adalah ambang usia tanpa progres untuk diagnostik
keaktifan sesi. Sesi `processing` tidak bertambah usianya menuju ambang ini
selama OpenClaw mengamati progres runtime balasan, tool, status, blok, atau ACP.
Keepalive pengetikan tidak dihitung sebagai progres, sehingga model atau harness yang senyap
tetap dapat terdeteksi.

OpenClaw mengklasifikasikan sesi berdasarkan pekerjaan yang masih dapat diamatinya:

- `session.long_running`: pekerjaan embedded aktif, pemanggilan model, atau pemanggilan tool
  masih membuat progres. Pemanggilan model yang dimiliki yang tetap senyap melewati
  `diagnostics.stuckSessionWarnMs` juga dilaporkan sebagai long-running sebelum
  `diagnostics.stuckSessionAbortMs` sehingga provider model yang lambat atau non-streaming
  tidak terlihat seperti sesi gateway yang macet selama tetap dapat diamati untuk abort.
- `session.stalled`: pekerjaan aktif ada, tetapi run aktif belum melaporkan
  progres terbaru. Pemanggilan model yang dimiliki beralih dari `session.long_running` ke
  `session.stalled` pada atau setelah `diagnostics.stuckSessionAbortMs`; aktivitas
  model/tool usang tanpa owner tidak diperlakukan sebagai pekerjaan long-running yang tidak berbahaya.
  Run embedded yang stalled tetap observe-only pada awalnya, lalu abort-drain setelah
  `diagnostics.stuckSessionAbortMs` tanpa progres sehingga turn yang mengantre di belakang
  lane dapat dilanjutkan. Ketika tidak ditetapkan, ambang abort default ke jendela
  diperpanjang yang lebih aman, setidaknya 5 menit dan 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: pembukuan sesi usang tanpa pekerjaan aktif, atau sesi mengantre yang idle
  dengan aktivitas model/tool usang tanpa owner. Ini melepaskan lane sesi
  yang terdampak segera setelah gate recovery lolos.

Recovery memancarkan event `session.recovery.requested` dan
`session.recovery.completed` terstruktur. Status sesi diagnostik ditandai idle
hanya setelah outcome recovery yang memutasi (`aborted` atau `released`) dan hanya jika
generasi processing yang sama masih menjadi yang terbaru.

Hanya `session.stuck` yang memancarkan counter `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms`, dan span `openclaw.session.stuck`.
Diagnostik `session.stuck` berulang melakukan back off selama sesi tetap
tidak berubah, sehingga dasbor sebaiknya memberi alert pada peningkatan berkelanjutan, bukan setiap
tick Heartbeat. Untuk knob konfigurasi dan default, lihat
[Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics).

Peringatan keaktifan juga memancarkan:

- `openclaw.liveness.warning` (counter, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, attrs: `openclaw.liveness.reason`)

### Siklus hidup harness

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` pada error)

### Eksekusi tool

- `openclaw.tool.execution.duration_ms` (histogram, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, ditambah `openclaw.errorCategory` pada error)
- `openclaw.tool.execution.blocked` (counter, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Eksekusi

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internal diagnostik (memori dan loop tool)

- `openclaw.payload.large` (counter, attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, attrs: sama seperti `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Span yang diekspor

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` secara default, atau `gen_ai.provider.name` ketika konvensi semantik GenAI terbaru diikutsertakan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` secara default, atau `gen_ai.provider.name` ketika konvensi semantik GenAI terbaru diikutsertakan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` dan `openclaw.failureKind` opsional pada kesalahan
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (hanya ukuran komponen yang aman, tanpa teks prompt)
  - `openclaw.model_call.usage.*` dan `gen_ai.usage.*` ketika hasil panggilan model membawa penggunaan penyedia untuk panggilan individual tersebut
  - `openclaw.provider.request_id_hash` (hash terbatas berbasis SHA dari id permintaan penyedia upstream; id mentah tidak diekspor)
  - Dengan `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, span panggilan model menggunakan nama span inferensi GenAI terbaru `{gen_ai.operation.name} {gen_ai.request.model}` dan jenis span `CLIENT`, bukan `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Saat selesai: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Saat terjadi kesalahan: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opsional
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
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

Ketika penangkapan konten diaktifkan secara eksplisit, span model dan alat juga dapat
menyertakan atribut `openclaw.content.*` yang terbatas dan disunting untuk kelas
konten spesifik yang Anda ikutsertakan.

## Katalog peristiwa diagnostik

Peristiwa di bawah ini mendukung metrik dan span di atas. Plugin juga dapat berlangganan
langsung ke peristiwa tersebut tanpa ekspor OTLP.

**Penggunaan model**

- `model.usage` - token, biaya, durasi, konteks, penyedia/model/saluran,
  id sesi. `usage` adalah akuntansi penyedia/giliran untuk biaya dan telemetri;
  `context.used` adalah snapshot prompt/konteks saat ini dan dapat lebih rendah daripada
  `usage.total` penyedia ketika input yang di-cache atau panggilan loop alat terlibat.

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  siklus hidup per-run untuk harness agen. Mencakup `harnessId`, `pluginId` opsional,
  penyedia/model/saluran, dan id run. Penyelesaian menambahkan
  `durationMs`, `outcome`, `resultClassification` opsional, `yieldDetected`,
  dan hitungan `itemLifecycle`. Kesalahan menambahkan `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, dan
  `cleanupFailed` opsional.

**Exec**

- `exec.process.completed` - hasil terminal, durasi, target, mode, kode keluar,
  dan jenis kegagalan. Teks perintah dan direktori kerja tidak
  disertakan.
- `exec.approval.followup_suppressed` - tindak lanjut persetujuan yang usang dibuang setelah
  sesi memantul kembali. Mencakup `approvalId`, `reason` (`session_rebound`),
  `phase` (`direct_delivery` atau `gateway_preflight`), dan stempel waktu
  dispatcher. Kunci sesi, rute, dan teks perintah tidak disertakan.

## Tanpa eksportir

Anda dapat tetap menyediakan peristiwa diagnostik untuk Plugin atau sink khusus tanpa
menjalankan `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Untuk keluaran debug yang ditargetkan tanpa menaikkan `logging.level`, gunakan flag
diagnostik. Flag tidak peka huruf besar/kecil dan mendukung wildcard (mis. `telegram.*` atau
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

Anda juga dapat membiarkan `diagnostics-otel` tidak disertakan dalam `plugins.allow`, atau menjalankan
`openclaw plugins disable diagnostics-otel`.

## Terkait

- [Pencatatan log](/id/logging) - log file, keluaran konsol, tailing CLI, dan tab Log Control UI
- [Internal pencatatan log Gateway](/id/gateway/logging) - gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Flag diagnostik](/id/diagnostics/flags) - flag log debug yang ditargetkan
- [Ekspor diagnostik](/id/gateway/diagnostics) - alat support-bundle operator (terpisah dari ekspor OTEL)
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) - referensi lengkap bidang `diagnostics.*`
