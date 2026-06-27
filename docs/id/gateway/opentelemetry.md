---
read_when:
    - Anda ingin mengirim penggunaan model OpenClaw, alur pesan, atau metrik sesi ke kolektor OpenTelemetry
    - Anda menghubungkan trace, metrik, atau log ke Grafana, Datadog, Honeycomb, New Relic, Tempo, atau backend OTLP lainnya
    - Anda memerlukan nama metrik, nama span, atau bentuk atribut yang tepat untuk membuat dasbor atau peringatan
summary: Ekspor diagnostik OpenClaw ke kolektor OpenTelemetry atau stdout JSONL melalui plugin diagnostics-otel
title: Ekspor OpenTelemetry
x-i18n:
    generated_at: "2026-06-27T17:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw mengekspor diagnostik melalui Plugin resmi `diagnostics-otel`
menggunakan **OTLP/HTTP (protobuf)**. Log juga dapat ditulis sebagai stdout JSONL untuk
pipeline log container dan sandbox. Collector atau backend apa pun yang menerima
OTLP/HTTP berfungsi tanpa perubahan kode. Untuk log file lokal dan cara membacanya,
lihat [Logging](/id/logging).

## Cara semuanya terhubung

- **Peristiwa diagnostik** adalah rekaman terstruktur dalam proses yang dipancarkan oleh
  Gateway dan Plugin bawaan untuk run model, alur pesan, sesi, antrean,
  dan exec.
- **Plugin `diagnostics-otel`** berlangganan peristiwa tersebut dan mengekspornya sebagai
  **metrik**, **trace**, dan **log** OpenTelemetry melalui OTLP/HTTP. Plugin ini juga dapat
  mencerminkan rekaman log diagnostik ke stdout JSONL.
- **Panggilan penyedia** menerima header W3C `traceparent` dari konteks span panggilan model
  tepercaya milik OpenClaw ketika transport penyedia menerima header khusus.
  Konteks trace yang dipancarkan Plugin tidak dipropagasikan.
- Exporter hanya terpasang ketika permukaan diagnostik dan Plugin sama-sama
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

| Sinyal      | Isi di dalamnya                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrik** | Counter dan histogram untuk penggunaan token, biaya, durasi run, failover, penggunaan skill, alur pesan, peristiwa Talk, lane antrean, status/pemulihan sesi, eksekusi alat, payload terlalu besar, exec, dan tekanan memori. |
| **Trace**  | Span untuk penggunaan model, panggilan model, siklus hidup harness, penggunaan skill, eksekusi alat, exec, pemrosesan Webhook/pesan, perakitan konteks, dan loop alat.                                                            |
| **Log**    | Rekaman `logging.file` terstruktur yang diekspor melalui OTLP atau stdout JSONL ketika `diagnostics.otel.logs` diaktifkan; isi log ditahan kecuali penangkapan konten diaktifkan secara eksplisit.                                |

Alihkan `traces`, `metrics`, dan `logs` secara independen. Trace dan metrik
aktif secara default ketika `diagnostics.otel.enabled` bernilai true. Log nonaktif secara default dan
hanya diekspor ketika `diagnostics.otel.logs` secara eksplisit bernilai `true`. Ekspor log
default ke OTLP; tetapkan `diagnostics.otel.logsExporter` ke `stdout` untuk JSONL di
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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Penggantian endpoint khusus sinyal yang digunakan ketika kunci konfigurasi `diagnostics.otel.*Endpoint` yang cocok belum disetel. Konfigurasi khusus sinyal mengalahkan env khusus sinyal, yang mengalahkan endpoint bersama.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Mengganti `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Mengganti protokol kabel (hanya `http/protobuf` yang dihormati saat ini).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Setel ke `gen_ai_latest_experimental` untuk memancarkan bentuk span inferensi GenAI eksperimental terbaru, termasuk nama span `{gen_ai.operation.name} {gen_ai.request.model}`, jenis span `CLIENT`, dan `gen_ai.provider.name` alih-alih `gen_ai.system` lama. Metrik GenAI selalu menggunakan atribut semantik berbatas dan berkardinalitas rendah. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Setel ke `1` ketika preload lain atau proses host sudah mendaftarkan SDK OpenTelemetry global. Plugin kemudian melewati siklus hidup NodeSDK miliknya sendiri tetapi tetap menghubungkan listener diagnostik dan menghormati `traces`/`metrics`/`logs`.                                                                                                                    |

## Privasi dan penangkapan konten

Konten model/alat mentah **tidak** diekspor secara default. Span membawa
identifier berbatas (channel, penyedia, model, kategori error, id permintaan hanya hash,
sumber alat, pemilik alat, dan nama/sumber skill) dan tidak pernah menyertakan teks prompt,
teks respons, input alat, output alat, path file skill, atau kunci sesi.
Rekaman log OTLP mempertahankan severity, logger, lokasi kode, konteks trace tepercaya,
dan atribut yang disanitasi secara default, tetapi isi pesan log mentah diekspor
hanya ketika `diagnostics.otel.captureContent` disetel ke boolean `true`. Subkunci granular
`captureContent.*` tidak mengaktifkan isi log. Label yang tampak seperti
kunci sesi agen ber-scope diganti dengan `unknown`.
Metrik Talk hanya mengekspor metadata peristiwa berbatas seperti mode, transport,
penyedia, dan jenis peristiwa. Metrik ini tidak menyertakan transkrip, payload audio,
id sesi, id giliran, id panggilan, id ruangan, atau token handoff.

Permintaan model keluar dapat menyertakan header W3C `traceparent`. Header tersebut
dibuat hanya dari konteks trace diagnostik milik OpenClaw untuk panggilan model aktif.
Header `traceparent` yang sudah dipasok pemanggil diganti, sehingga Plugin atau
opsi penyedia khusus tidak dapat memalsukan asal-usul trace lintas layanan.

Setel `diagnostics.otel.captureContent.*` ke `true` hanya ketika collector dan
kebijakan retensi Anda disetujui untuk teks prompt, respons, alat, atau system-prompt.
Setiap subkunci bersifat opt-in secara independen:

- `inputMessages` - konten prompt pengguna.
- `outputMessages` - konten respons model.
- `toolInputs` - payload argumen alat.
- `toolOutputs` - payload hasil alat.
- `systemPrompt` - prompt sistem/developer yang dirakit.
- `toolDefinitions` - nama, deskripsi, dan skema alat model.

Ketika subkunci mana pun diaktifkan, span model dan alat mendapatkan atribut
`openclaw.content.*` yang berbatas dan disunting hanya untuk kelas tersebut. Gunakan boolean
`captureContent: true` hanya untuk penangkapan diagnostik luas ketika isi pesan log
OTLP juga disetujui untuk diekspor.

Konten `toolInputs`/`toolOutputs` ditangkap untuk eksekusi alat runtime agen bawaan
(`openclaw.content.tool_input` pada span selesai/error,
`openclaw.content.tool_output` pada span selesai). Panggilan alat harness eksternal
(Codex, Claude CLI) memancarkan span `tool.execution.*` tanpa payload konten.
Konten yang ditangkap berjalan pada channel tepercaya khusus listener dan tidak pernah ditempatkan
di bus peristiwa diagnostik publik.

## Sampling dan flushing

- **Trace:** `diagnostics.otel.sampleRate` (hanya root-span, `0.0` menjatuhkan semua,
  `1.0` mempertahankan semua).
- **Metrik:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Log:** Log OTLP menghormati `logging.level` (level log file). Log ini menggunakan
  jalur penyuntingan rekaman log diagnostik, bukan pemformatan konsol. Instalasi bervolume tinggi
  sebaiknya memilih sampling/filtering collector OTLP daripada sampling lokal.
  Setel `diagnostics.otel.logsExporter: "stdout"` ketika platform Anda sudah
  mengirim stdout/stderr ke pemroses log dan Anda tidak memiliki collector log
  OTLP. Rekaman stdout adalah satu objek JSON per baris dengan `ts`, `signal`,
  `service.name`, severity, body, atribut yang disunting, dan field trace tepercaya
  ketika tersedia.
- **Korelasi log file:** Log file JSONL menyertakan `traceId`,
  `spanId`, `parentSpanId`, dan `traceFlags` tingkat atas ketika panggilan log membawa konteks
  trace diagnostik yang valid, yang memungkinkan pemroses log menggabungkan baris log lokal dengan
  span yang diekspor.
- **Korelasi permintaan:** Permintaan HTTP Gateway dan frame WebSocket membuat
  scope trace permintaan internal. Log dan peristiwa diagnostik di dalam scope tersebut
  mewarisi trace permintaan secara default, sementara span run agen dan panggilan model
  dibuat sebagai anak sehingga header `traceparent` penyedia tetap berada pada trace yang sama.

## Metrik yang diekspor

### Penggunaan model

- `openclaw.tokens` (penghitung, atribut: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (penghitung, atribut: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atribut: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metrik konvensi semantik GenAI, atribut: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, detik, metrik konvensi semantik GenAI, atribut: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opsional `error.type`)
- `openclaw.model_call.duration_ms` (histogram, atribut: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, ditambah `openclaw.errorCategory` dan `openclaw.failureKind` pada galat yang diklasifikasikan)
- `openclaw.model_call.request_bytes` (histogram, ukuran byte UTF-8 dari payload permintaan model final; tanpa konten payload mentah)
- `openclaw.model_call.response_bytes` (histogram, ukuran byte UTF-8 dari payload chunk respons yang di-stream; teks frekuensi tinggi, proses berpikir, dan delta panggilan tool hanya menghitung byte `delta` inkremental; tanpa konten respons mentah)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, waktu berlalu sebelum peristiwa respons streaming pertama)
- `openclaw.model.failover` (penghitung, atribut: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (penghitung, atribut: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, opsional `openclaw.agent`, opsional `openclaw.toolName`)

### Alur pesan

- `openclaw.webhook.received` (penghitung, atribut: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (penghitung, atribut: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (penghitung, atribut: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (penghitung, atribut: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (penghitung, atribut: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (penghitung, atribut: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (penghitung, atribut: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (penghitung, atribut: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Percakapan

- `openclaw.talk.event` (penghitung, atribut: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, atribut: sama seperti `openclaw.talk.event`; dipancarkan ketika peristiwa Percakapan melaporkan durasi)
- `openclaw.talk.audio.bytes` (histogram, atribut: sama seperti `openclaw.talk.event`; dipancarkan untuk peristiwa frame audio Percakapan yang melaporkan panjang byte)

### Antrean dan sesi

- `openclaw.queue.lane.enqueue` (penghitung, atribut: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (penghitung, atribut: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atribut: `openclaw.lane` atau `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atribut: `openclaw.lane`)
- `openclaw.session.state` (penghitung, atribut: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (penghitung, atribut: `openclaw.state`; dipancarkan untuk pembukuan sesi basi yang dapat dipulihkan)
- `openclaw.session.stuck_age_ms` (histogram, atribut: `openclaw.state`; dipancarkan untuk pembukuan sesi basi yang dapat dipulihkan)
- `openclaw.session.turn.created` (penghitung, atribut: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (penghitung, atribut: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (penghitung, atribut: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, atribut: sama seperti penghitung pemulihan yang cocok)
- `openclaw.run.attempt` (penghitung, atribut: `openclaw.attempt`)

### Telemetri kelangsungan sesi

`diagnostics.stuckSessionWarnMs` adalah ambang usia tanpa progres untuk diagnostik
kelangsungan sesi. Sesi `processing` tidak bertambah usianya menuju ambang ini
selama OpenClaw mengamati progres runtime balasan, tool, status, blok, atau ACP.
Keepalive pengetikan tidak dihitung sebagai progres, sehingga model atau harness yang diam
tetap dapat terdeteksi.

OpenClaw mengklasifikasikan sesi berdasarkan pekerjaan yang masih dapat diamatinya:

- `session.long_running`: pekerjaan tertanam aktif, panggilan model, atau panggilan tool
  masih membuat progres. Panggilan model yang dimiliki dan tetap diam melewati
  `diagnostics.stuckSessionWarnMs` juga dilaporkan sebagai berjalan lama sebelum
  `diagnostics.stuckSessionAbortMs` sehingga penyedia model yang lambat atau tidak streaming
  tidak terlihat seperti sesi Gateway yang macet selama tetap dapat diamati untuk pembatalan.
- `session.stalled`: pekerjaan aktif ada, tetapi run aktif belum melaporkan
  progres terbaru. Panggilan model yang dimiliki beralih dari `session.long_running` ke
  `session.stalled` pada atau setelah `diagnostics.stuckSessionAbortMs`; aktivitas
  model/tool basi tanpa pemilik tidak diperlakukan sebagai pekerjaan berjalan lama yang tidak berbahaya.
  Run tertanam yang macet awalnya tetap hanya diamati, lalu dibatalkan dan dikosongkan setelah
  `diagnostics.stuckSessionAbortMs` tanpa progres agar giliran yang mengantre di belakang
  lane dapat dilanjutkan. Ketika tidak disetel, ambang pembatalan default ke jendela
  diperpanjang yang lebih aman, setidaknya 5 menit dan 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: pembukuan sesi basi tanpa pekerjaan aktif, atau sesi
  antrean yang menganggur dengan aktivitas model/tool basi tanpa pemilik. Ini melepaskan
  lane sesi yang terpengaruh segera setelah gerbang pemulihan lolos.

Pemulihan memancarkan peristiwa terstruktur `session.recovery.requested` dan
`session.recovery.completed`. Status sesi diagnostik ditandai menganggur
hanya setelah hasil pemulihan yang memutasi (`aborted` atau `released`) dan hanya jika
generasi pemrosesan yang sama masih terkini.

Hanya `session.stuck` yang memancarkan penghitung `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms`, dan span `openclaw.session.stuck`.
Diagnostik `session.stuck` berulang melakukan backoff selama sesi tetap
tidak berubah, sehingga dasbor sebaiknya memberi peringatan pada kenaikan berkelanjutan, bukan setiap
tik Heartbeat. Untuk kenop konfigurasi dan default, lihat
[Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics).

Peringatan kelangsungan juga memancarkan:

- `openclaw.liveness.warning` (penghitung, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, atribut: `openclaw.liveness.reason`)

### Siklus hidup harness

- `openclaw.harness.duration_ms` (histogram, atribut: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` pada galat)

### Eksekusi tool

- `openclaw.tool.execution.duration_ms` (histogram, atribut: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, ditambah `openclaw.errorCategory` pada galat)
- `openclaw.tool.execution.blocked` (penghitung, atribut: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogram, atribut: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internal diagnostik (memori dan loop tool)

- `openclaw.payload.large` (penghitung, atribut: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, atribut: sama seperti `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (histogram, atribut: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (penghitung, atribut: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (penghitung, atribut: `openclaw.toolName`, `openclaw.outcome`)
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
  - `openclaw.provider.request_id_hash` (hash berbasis SHA terbatas dari id permintaan penyedia hulu; id mentah tidak diekspor)
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (tanpa pesan loop, parameter, atau keluaran tool)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Saat penangkapan konten diaktifkan secara eksplisit, span model dan tool juga dapat
menyertakan atribut `openclaw.content.*` yang terbatas dan disunting untuk kelas
konten tertentu yang Anda pilih.

## Katalog peristiwa diagnostik

Peristiwa di bawah ini mendukung metrik dan span di atas. Plugin juga dapat berlangganan
langsung ke peristiwa tersebut tanpa ekspor OTLP.

**Penggunaan model**

- `model.usage` - token, biaya, durasi, konteks, penyedia/model/saluran,
  id sesi. `usage` adalah akuntansi penyedia/giliran untuk biaya dan telemetri;
  `context.used` adalah snapshot prompt/konteks saat ini dan dapat lebih rendah daripada
  `usage.total` penyedia saat input cache atau panggilan loop-tool terlibat.

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
  siklus hidup per run untuk harness agen. Mencakup `harnessId`, `pluginId`
  opsional, penyedia/model/saluran, dan id run. Penyelesaian menambahkan
  `durationMs`, `outcome`, `resultClassification` opsional, `yieldDetected`,
  dan jumlah `itemLifecycle`. Kesalahan menambahkan `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, dan
  `cleanupFailed` opsional.

**Exec**

- `exec.process.completed` - hasil terminal, durasi, target, mode, kode keluar,
  dan jenis kegagalan. Teks perintah dan direktori kerja tidak
  disertakan.

## Tanpa pengekspor

Anda dapat membuat peristiwa diagnostik tetap tersedia bagi plugin atau sink khusus tanpa
menjalankan `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Untuk keluaran debug bertarget tanpa menaikkan `logging.level`, gunakan flag diagnostik.
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

Keluaran flag masuk ke file log standar (`logging.file`) dan tetap
disunting oleh `logging.redactSensitive`. Panduan lengkap:
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

- [Logging](/id/logging) - log file, keluaran konsol, tailing CLI, dan tab Log Control UI
- [Internal logging Gateway](/id/gateway/logging) - gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Flag diagnostik](/id/diagnostics/flags) - flag log-debug bertarget
- [Ekspor diagnostik](/id/gateway/diagnostics) - alat bundel dukungan operator (terpisah dari ekspor OTEL)
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) - referensi lengkap field `diagnostics.*`
