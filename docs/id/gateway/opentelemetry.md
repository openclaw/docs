---
read_when:
    - Anda ingin mengirim penggunaan model OpenClaw, alur pesan, atau metrik sesi ke kolektor OpenTelemetry
    - Anda menghubungkan trace, metrik, atau log ke Grafana, Datadog, Honeycomb, New Relic, Tempo, atau backend OTLP lainnya
    - Anda memerlukan nama metrik, nama span, atau bentuk atribut yang persis untuk membuat dasbor atau peringatan
summary: Ekspor diagnostik OpenClaw ke kolektor OpenTelemetry atau stdout JSONL melalui plugin diagnostics-otel
title: Ekspor OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T14:28:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw mengekspor diagnostik melalui Plugin resmi `diagnostics-otel`
menggunakan **OTLP/HTTP (protobuf)**. Log juga dapat ditulis sebagai JSONL stdout untuk
alur log container dan sandbox. Kolektor atau backend apa pun yang menerima
OTLP/HTTP berfungsi tanpa perubahan kode. Untuk log file lokal dan cara membacanya,
lihat [Logging](/id/logging).

## Cara semuanya saling terhubung

- **Peristiwa diagnostik** adalah rekaman terstruktur dalam proses yang dipancarkan oleh
  Gateway dan Plugin bawaan untuk eksekusi model, alur pesan, sesi, antrean,
  dan exec.
- **Plugin `diagnostics-otel`** berlangganan ke peristiwa tersebut dan mengekspornya sebagai
  **metrik**, **trace**, dan **log** OpenTelemetry melalui OTLP/HTTP. Plugin ini juga dapat
  mencerminkan rekaman log diagnostik ke JSONL stdout.
- **Panggilan penyedia** menerima header W3C `traceparent` dari konteks span
  panggilan model tepercaya milik OpenClaw saat transport penyedia menerima header
  kustom. Konteks trace yang dipancarkan Plugin tidak diteruskan.
- Eksportir hanya terpasang saat permukaan diagnostik dan Plugin sama-sama
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

| Sinyal      | Isinya                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrik** | Counter dan histogram untuk penggunaan token, biaya, durasi eksekusi, failover, penggunaan skill, alur pesan, peristiwa Talk, lane antrean, status/pemulihan sesi, eksekusi tool, payload terlalu besar, exec, dan tekanan memori. |
| **Trace**  | Span untuk penggunaan model, panggilan model, siklus hidup harness, penggunaan skill, eksekusi tool, exec, pemrosesan webhook/pesan, penyusunan konteks, dan loop tool.                                                            |
| **Log**    | Rekaman `logging.file` terstruktur yang diekspor melalui OTLP atau JSONL stdout saat `diagnostics.otel.logs` diaktifkan; isi log ditahan kecuali penangkapan konten diaktifkan secara eksplisit.                                |

Alihkan `traces`, `metrics`, dan `logs` secara independen. Trace dan metrik
aktif secara default saat `diagnostics.otel.enabled` bernilai true. Log nonaktif
secara default dan hanya diekspor saat `diagnostics.otel.logs` secara eksplisit bernilai `true`. Ekspor log
default ke OTLP; atur `diagnostics.otel.logsExporter` ke `stdout` untuk JSONL di
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Mengganti `diagnostics.otel.endpoint`. Jika nilai sudah berisi `/v1/traces`, `/v1/metrics`, atau `/v1/logs`, nilai tersebut digunakan apa adanya.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Penggantian endpoint khusus sinyal yang digunakan saat kunci konfigurasi `diagnostics.otel.*Endpoint` yang cocok belum diatur. Konfigurasi khusus sinyal mengalahkan env khusus sinyal, yang mengalahkan endpoint bersama.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Mengganti `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Mengganti protokol wire (hanya `http/protobuf` yang dihormati saat ini).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Atur ke `gen_ai_latest_experimental` untuk memancarkan bentuk span inferensi GenAI eksperimental terbaru, termasuk nama span `{gen_ai.operation.name} {gen_ai.request.model}`, jenis span `CLIENT`, dan `gen_ai.provider.name` alih-alih `gen_ai.system` lama. Metrik GenAI selalu menggunakan atribut semantik terbatas dengan kardinalitas rendah. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Atur ke `1` saat preload lain atau proses host sudah mendaftarkan SDK OpenTelemetry global. Plugin kemudian melewati siklus hidup NodeSDK miliknya sendiri tetapi tetap memasang listener diagnostik dan menghormati `traces`/`metrics`/`logs`.                                                                                                                    |

## Privasi dan penangkapan konten

Konten model/tool mentah **tidak** diekspor secara default. Span membawa
pengidentifikasi terbatas (channel, penyedia, model, kategori kesalahan, id permintaan hanya hash,
sumber tool, pemilik tool, dan nama/sumber skill) dan tidak pernah menyertakan teks prompt,
teks respons, input tool, output tool, path file skill, atau kunci sesi.
Rekaman log OTLP mempertahankan severity, logger, lokasi kode, konteks trace tepercaya,
dan atribut yang disanitasi secara default, tetapi isi pesan log mentah diekspor
hanya saat `diagnostics.otel.captureContent` diatur ke boolean `true`. Subkunci granular
`captureContent.*` tidak mengaktifkan isi log. Label yang terlihat seperti
kunci sesi agen bercakupan diganti dengan `unknown`.
Metrik Talk hanya mengekspor metadata peristiwa terbatas seperti mode, transport,
penyedia, dan jenis peristiwa. Metrik ini tidak menyertakan transkrip, payload audio,
id sesi, id turn, id panggilan, id room, atau token handoff.

Permintaan model keluar dapat menyertakan header W3C `traceparent`. Header tersebut
dibuat hanya dari konteks trace diagnostik milik OpenClaw untuk panggilan model yang aktif.
Header `traceparent` yang sudah disediakan pemanggil diganti, sehingga Plugin atau
opsi penyedia kustom tidak dapat memalsukan garis asal trace lintas layanan.

Atur `diagnostics.otel.captureContent.*` ke `true` hanya saat kolektor dan
kebijakan retensi Anda disetujui untuk teks prompt, respons, tool, atau system-prompt.
Setiap subkunci bersifat opt-in secara independen:

- `inputMessages` - konten prompt pengguna.
- `outputMessages` - konten respons model.
- `toolInputs` - payload argumen tool.
- `toolOutputs` - payload hasil tool.
- `systemPrompt` - prompt sistem/developer yang disusun.
- `toolDefinitions` - nama, deskripsi, dan skema tool model.

Saat subkunci mana pun diaktifkan, span model dan tool mendapatkan atribut
`openclaw.content.*` yang terbatas dan disunting untuk kelas tersebut saja. Gunakan boolean
`captureContent: true` hanya untuk penangkapan diagnostik luas saat isi pesan log OTLP
juga disetujui untuk diekspor.

Konten `toolInputs`/`toolOutputs` ditangkap untuk eksekusi tool runtime agen bawaan
(`openclaw.content.tool_input` pada span selesai/galat,
`openclaw.content.tool_output` pada span selesai). Panggilan tool harness eksternal
(Codex, Claude CLI) memancarkan span `tool.execution.*` tanpa payload konten.
Konten yang ditangkap berjalan pada channel tepercaya khusus listener dan tidak pernah ditempatkan
di bus peristiwa diagnostik publik.

## Sampling dan flushing

- **Jejak:** `diagnostics.otel.sampleRate` (hanya root-span, `0.0` membuang semua,
  `1.0` menyimpan semua).
- **Metrik:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Log:** Log OTLP mematuhi `logging.level` (level log file). Log tersebut menggunakan
  jalur redaksi record log diagnostik, bukan pemformatan konsol. Instalasi bervolume tinggi
  sebaiknya mengutamakan pengambilan sampel/pemfilteran kolektor OTLP daripada pengambilan sampel lokal.
  Atur `diagnostics.otel.logsExporter: "stdout"` ketika platform Anda sudah
  mengirim stdout/stderr ke pemroses log dan Anda tidak memiliki kolektor log
  OTLP. Record stdout adalah satu objek JSON per baris dengan `ts`, `signal`,
  `service.name`, tingkat keparahan, isi, atribut yang telah diredaksi, dan field jejak tepercaya
  bila tersedia.
- **Korelasi log file:** Log file JSONL menyertakan `traceId`,
  `spanId`, `parentSpanId`, dan `traceFlags` tingkat atas ketika panggilan log membawa konteks
  jejak diagnostik yang valid, sehingga pemroses log dapat menggabungkan baris log lokal dengan
  span yang diekspor.
- **Korelasi permintaan:** Permintaan HTTP Gateway dan frame WebSocket membuat
  cakupan jejak permintaan internal. Log dan peristiwa diagnostik di dalam cakupan tersebut
  mewarisi jejak permintaan secara default, sementara span eksekusi agen dan panggilan model
  dibuat sebagai anak sehingga header `traceparent` penyedia tetap berada pada jejak yang sama.
- **Korelasi panggilan model:** Span `openclaw.model.call` menyertakan ukuran komponen prompt
  yang aman secara default dan menyertakan atribut token per panggilan ketika
  hasil penyedia mengekspos penggunaan. `openclaw.model.usage` tetap menjadi span akuntansi
  tingkat eksekusi untuk biaya agregat, konteks, dan dasbor kanal; span tersebut tetap
  berada pada jejak diagnostik yang sama ketika runtime yang memancarkan memiliki konteks jejak
  tepercaya.

## Metrik yang diekspor

### Penggunaan model

- `openclaw.tokens` (counter, atribut: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, atribut: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atribut: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metrik konvensi semantik GenAI, atribut: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, detik, metrik konvensi semantik GenAI, atribut: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opsional `error.type`)
- `openclaw.model_call.duration_ms` (histogram, atribut: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, ditambah `openclaw.errorCategory` dan `openclaw.failureKind` pada error terklasifikasi)
- `openclaw.model_call.request_bytes` (histogram, ukuran byte UTF-8 dari payload permintaan model akhir; tanpa konten payload mentah)
- `openclaw.model_call.response_bytes` (histogram, ukuran byte UTF-8 dari payload potongan respons yang dialirkan; delta teks, pemikiran, dan panggilan alat berfrekuensi tinggi hanya menghitung byte `delta` inkremental; tanpa konten respons mentah)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, waktu berlalu sebelum peristiwa respons yang dialirkan pertama)
- `openclaw.model.failover` (counter, atribut: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (counter, atribut: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, opsional `openclaw.agent`, opsional `openclaw.toolName`)

### Alur pesan

- `openclaw.webhook.received` (counter, atribut: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, atribut: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, atribut: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (counter, atribut: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (counter, atribut: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (counter, atribut: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (counter, atribut: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, atribut: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Percakapan

- `openclaw.talk.event` (counter, atribut: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, atribut: sama seperti `openclaw.talk.event`; dipancarkan ketika peristiwa Percakapan melaporkan durasi)
- `openclaw.talk.audio.bytes` (histogram, atribut: sama seperti `openclaw.talk.event`; dipancarkan untuk peristiwa frame audio Percakapan yang melaporkan panjang byte)

### Antrean dan sesi

- `openclaw.queue.lane.enqueue` (counter, atribut: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, atribut: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atribut: `openclaw.lane` atau `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atribut: `openclaw.lane`)
- `openclaw.session.state` (counter, atribut: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, atribut: `openclaw.state`; dipancarkan untuk pembukuan sesi usang yang dapat dipulihkan)
- `openclaw.session.stuck_age_ms` (histogram, atribut: `openclaw.state`; dipancarkan untuk pembukuan sesi usang yang dapat dipulihkan)
- `openclaw.session.turn.created` (counter, atribut: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (counter, atribut: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (counter, atribut: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, atribut: sama seperti counter pemulihan yang cocok)
- `openclaw.run.attempt` (counter, atribut: `openclaw.attempt`)

### Telemetri keaktifan sesi

`diagnostics.stuckSessionWarnMs` adalah ambang usia tanpa kemajuan untuk diagnostik
keaktifan sesi. Sesi `processing` tidak bertambah usia menuju ambang ini
selama OpenClaw mengamati kemajuan runtime balasan, alat, status, blok, atau ACP.
Keepalive pengetikan tidak dihitung sebagai kemajuan, sehingga model atau harness yang diam
tetap dapat terdeteksi.

OpenClaw mengklasifikasikan sesi berdasarkan pekerjaan yang masih dapat diamatinya:

- `session.long_running`: pekerjaan tersemat aktif, panggilan model, atau panggilan alat
  masih mengalami kemajuan. Panggilan model yang dimiliki dan tetap diam melewati
  `diagnostics.stuckSessionWarnMs` juga dilaporkan sebagai berjalan lama sebelum
  `diagnostics.stuckSessionAbortMs` sehingga penyedia model yang lambat atau tidak melakukan streaming
  tidak tampak seperti sesi gateway yang macet selama masih dapat diamati untuk dibatalkan.
- `session.stalled`: pekerjaan aktif ada, tetapi eksekusi aktif belum melaporkan
  kemajuan terbaru. Panggilan model yang dimiliki beralih dari `session.long_running` ke
  `session.stalled` pada atau setelah `diagnostics.stuckSessionAbortMs`; aktivitas
  model/alat usang tanpa pemilik tidak diperlakukan sebagai pekerjaan berjalan lama yang tidak berbahaya.
  Eksekusi tersemat yang macet tetap hanya-diamati pada awalnya, lalu abort-drain setelah
  `diagnostics.stuckSessionAbortMs` tanpa kemajuan sehingga giliran yang mengantre di belakang
  lane dapat dilanjutkan. Jika tidak diatur, ambang pembatalan default ke jendela
  diperpanjang yang lebih aman, setidaknya 5 menit dan 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: pembukuan sesi usang tanpa pekerjaan aktif, atau sesi antrean
  diam dengan aktivitas model/alat usang tanpa pemilik. Ini melepaskan
  lane sesi yang terdampak segera setelah gate pemulihan lolos.

Pemulihan memancarkan peristiwa `session.recovery.requested` dan
`session.recovery.completed` yang terstruktur. Status sesi diagnostik ditandai diam
hanya setelah hasil pemulihan yang mengubah keadaan (`aborted` atau `released`) dan hanya jika
generasi pemrosesan yang sama masih terkini.

Hanya `session.stuck` yang memancarkan counter `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms`, dan span `openclaw.session.stuck`.
Diagnostik `session.stuck` berulang melakukan backoff selama sesi tetap
tidak berubah, sehingga dasbor sebaiknya memberi peringatan pada peningkatan yang berkelanjutan, bukan setiap
tick Heartbeat. Untuk kenop konfigurasi dan default, lihat
[Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics).

Peringatan keaktifan juga memancarkan:

- `openclaw.liveness.warning` (counter, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, atribut: `openclaw.liveness.reason`)

### Siklus hidup harness

- `openclaw.harness.duration_ms` (histogram, atribut: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` pada error)

### Eksekusi alat

- `openclaw.tool.execution.duration_ms` (histogram, atribut: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, ditambah `openclaw.errorCategory` pada error)
- `openclaw.tool.execution.blocked` (counter, atribut: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogram, atribut: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internal diagnostik (memori dan loop alat)

- `openclaw.payload.large` (counter, atribut: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, atribut: sama seperti `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (histogram, atribut: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, atribut: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, atribut: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, atribut: `openclaw.toolName`, `openclaw.outcome`)

## Span yang diekspor

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
  - `openclaw.errorCategory` dan `openclaw.failureKind` opsional pada kesalahan
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (hanya ukuran komponen yang aman, tanpa teks prompt)
  - `openclaw.model_call.usage.*` dan `gen_ai.usage.*` saat hasil pemanggilan model membawa penggunaan penyedia untuk panggilan individual tersebut
  - `openclaw.provider.request_id_hash` (hash berbasis SHA terbatas dari id permintaan penyedia upstream; id mentah tidak diekspor)
  - Dengan `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, span pemanggilan model menggunakan nama span inferensi GenAI terbaru `{gen_ai.operation.name} {gen_ai.request.model}` dan jenis span `CLIENT`, bukan `openclaw.model.call`.
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (tanpa prompt, riwayat, respons, atau konten kunci sesi)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (tanpa pesan loop, params, atau output tool)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Saat penangkapan konten diaktifkan secara eksplisit, span model dan tool juga dapat
menyertakan atribut `openclaw.content.*` yang terbatas dan telah direduksi untuk kelas
konten spesifik yang Anda ikutsertakan.

## Katalog peristiwa diagnostik

Peristiwa di bawah ini mendukung metrik dan span di atas. Plugin juga dapat berlangganan
langsung ke peristiwa tersebut tanpa ekspor OTLP.

**Penggunaan model**

- `model.usage` - token, biaya, durasi, konteks, penyedia/model/saluran,
  id sesi. `usage` adalah akuntansi penyedia/giliran untuk biaya dan telemetri;
  `context.used` adalah snapshot prompt/konteks saat ini dan dapat lebih rendah daripada
  `usage.total` penyedia saat input yang di-cache atau panggilan loop tool terlibat.

**Alur pesan**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Antrean dan sesi**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (penghitung agregat: Webhook/antrean/sesi)

**Siklus hidup harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  siklus hidup per-run untuk harness agen. Mencakup `harnessId`, `pluginId` opsional,
  penyedia/model/saluran, dan id run. Penyelesaian menambahkan
  `durationMs`, `outcome`, `resultClassification` opsional, `yieldDetected`,
  dan jumlah `itemLifecycle`. Kesalahan menambahkan `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, dan
  `cleanupFailed` opsional.

**Exec**

- `exec.process.completed` - hasil terminal, durasi, target, mode, kode keluar,
  dan jenis kegagalan. Teks perintah dan direktori kerja tidak
  disertakan.

## Tanpa exporter

Anda dapat menjaga peristiwa diagnostik tetap tersedia bagi Plugin atau sink kustom tanpa
menjalankan `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Untuk output debug tertarget tanpa menaikkan `logging.level`, gunakan flag diagnostik.
Flag tidak peka huruf besar/kecil dan mendukung wildcard (mis. `telegram.*` atau
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

Output flag masuk ke file log standar (`logging.file`) dan tetap
direduksi oleh `logging.redactSensitive`. Panduan lengkap:
[Flag diagnostik](/id/diagnostics/flags).

## Nonaktifkan

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Anda juga dapat membiarkan `diagnostics-otel` tidak masuk dalam `plugins.allow`, atau menjalankan
`openclaw plugins disable diagnostics-otel`.

## Terkait

- [Logging](/id/logging) - log file, output konsol, tailing CLI, dan tab Log Control UI
- [Internal logging Gateway](/id/gateway/logging) - gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Flag diagnostik](/id/diagnostics/flags) - flag log debug tertarget
- [Ekspor diagnostik](/id/gateway/diagnostics) - alat support-bundle operator (terpisah dari ekspor OTEL)
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) - referensi lengkap field `diagnostics.*`
