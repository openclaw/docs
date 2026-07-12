---
read_when:
    - Anda ingin mengirimkan metrik penggunaan model, alur pesan, atau sesi OpenClaw ke kolektor OpenTelemetry
    - Anda sedang mengintegrasikan jejak, metrik, atau log ke Grafana, Datadog, Honeycomb, New Relic, Tempo, atau backend OTLP lainnya
    - Anda memerlukan nama metrik, nama span, atau struktur atribut yang tepat untuk membuat dasbor atau peringatan
summary: Ekspor diagnostik OpenClaw ke kolektor OpenTelemetry atau JSONL stdout melalui Plugin diagnostics-otel
title: Ekspor OpenTelemetry
x-i18n:
    generated_at: "2026-07-12T14:13:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw mengekspor diagnostik melalui plugin resmi `diagnostics-otel`
menggunakan **OTLP/HTTP (protobuf)**. Log juga dapat ditulis sebagai JSONL stdout untuk
alur log kontainer dan sandbox. Setiap kolektor atau backend yang menerima
OTLP/HTTP dapat digunakan tanpa perubahan kode. Untuk log berkas lokal, lihat
[Logging](/id/logging).

- **Peristiwa diagnostik** adalah catatan terstruktur dalam proses yang dipancarkan oleh
  Gateway dan plugin bawaan untuk eksekusi model, alur pesan, sesi, antrean,
  dan eksekusi.
- **`diagnostics-otel`** berlangganan peristiwa tersebut dan mengekspornya sebagai
  **metrik**, **jejak**, dan **log** OpenTelemetry melalui OTLP/HTTP, serta dapat
  mencerminkan catatan log ke JSONL stdout.
- **Panggilan penyedia** menerima header W3C `traceparent` dari konteks span
  panggilan model tepercaya milik OpenClaw ketika transport penyedia menerima header
  khusus. Konteks jejak yang dipancarkan plugin tidak diteruskan.
- Eksportir hanya dipasang ketika permukaan diagnostik dan plugin sama-sama
  diaktifkan, sehingga biaya dalam proses secara default tetap mendekati nol.

## Mulai cepat

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

Atau aktifkan plugin dari CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` hanya mendukung `http/protobuf`. Karena `traces` dan `metrics` secara default diaktifkan, nilai lainnya (termasuk `grpc`) membatalkan seluruh langganan diagnostics-otel dengan peringatan `unsupported protocol`—hal ini juga menghentikan ekspor log stdout. Tetapkan `traces: false` dan `metrics: false` secara eksplisit jika Anda hanya menginginkan `logsExporter: "stdout"` dengan nilai protokol non-OTLP.
</Note>

## Sinyal yang diekspor

| Sinyal      | Isinya                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrik** | Penghitung/histogram untuk penggunaan token, biaya, durasi eksekusi, pengalihan kegagalan, penggunaan skill, alur pesan, peristiwa Talk, jalur antrean, status/pemulihan sesi, eksekusi alat, eksekusi, memori, keaktifan, dan kesehatan eksportir. |
| **Jejak**  | Span untuk penggunaan model, panggilan model, siklus hidup harness, penggunaan skill, eksekusi alat, eksekusi, pemrosesan webhook/pesan, penyusunan konteks, dan perulangan alat.                                                      |
| **Log**    | Catatan `logging.file` terstruktur yang diekspor melalui OTLP atau JSONL stdout ketika `diagnostics.otel.logs` diaktifkan; isi log tidak disertakan kecuali perekaman konten diaktifkan secara eksplisit.                          |

Aktifkan atau nonaktifkan `traces`, `metrics`, dan `logs` secara terpisah. Jejak dan metrik
secara default aktif ketika `diagnostics.otel.enabled` bernilai true; log secara default nonaktif
dan hanya diekspor ketika `diagnostics.otel.logs` secara eksplisit bernilai `true`. Ekspor log
secara default menggunakan OTLP; tetapkan `diagnostics.otel.logsExporter` ke `stdout` untuk JSONL di
stdout, atau `both` untuk keduanya.

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
      protocol: "http/protobuf", // grpc menonaktifkan ekspor OTLP
      serviceName: "openclaw-gateway", // jika tidak ditetapkan, gunakan OTEL_SERVICE_NAME, lalu "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // pengambil sampel span akar, 0.0..1.0
      flushIntervalMs: 60000, // interval ekspor metrik (min. 1000 ms)
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

| Variabel                                                                                                          | Tujuan                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Nilai cadangan untuk `diagnostics.otel.endpoint` ketika kunci konfigurasi tidak ditetapkan.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Nilai cadangan titik akhir khusus sinyal yang digunakan ketika kunci konfigurasi `diagnostics.otel.*Endpoint` yang sesuai tidak ditetapkan. Konfigurasi khusus sinyal lebih diutamakan daripada variabel lingkungan khusus sinyal, dan variabel lingkungan khusus sinyal lebih diutamakan daripada titik akhir bersama.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Nilai cadangan untuk `diagnostics.otel.serviceName` ketika kunci konfigurasi tidak ditetapkan. Nama layanan default adalah `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Nilai cadangan untuk protokol wire ketika `diagnostics.otel.protocol` tidak ditetapkan. Hanya `http/protobuf` yang mengaktifkan ekspor.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Tetapkan ke `gen_ai_latest_experimental` untuk memancarkan bentuk span inferensi GenAI terbaru: nama span `{gen_ai.operation.name} {gen_ai.request.model}`, jenis span `CLIENT`, dan `gen_ai.provider.name` sebagai pengganti `gen_ai.system` lama. Metrik GenAI selalu menggunakan atribut berbatas dengan kardinalitas rendah. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Tetapkan ke `1` ketika preload atau proses host lain telah mendaftarkan SDK OpenTelemetry global. Plugin kemudian melewati siklus hidup NodeSDK miliknya sendiri, tetapi tetap menghubungkan pemroses diagnostik dan mematuhi `traces`/`metrics`/`logs`.                                                                                    |

## Privasi dan perekaman konten

Konten mentah model/alat **tidak** diekspor secara default. Span membawa pengenal
berbatas (saluran, penyedia, model, kategori kesalahan, ID permintaan berbasis hash saja,
sumber alat, pemilik alat, nama/sumber skill) dan tidak pernah menyertakan teks prompt,
teks respons, input alat, output alat, jalur berkas skill, atau kunci sesi.
Nilai yang menyerupai kunci sesi agen bercakupan (misalnya diawali dengan
`agent:`) diganti dengan `unknown` pada atribut berkardinalitas rendah. Catatan log OTLP
secara default mempertahankan tingkat keparahan, pencatat log, lokasi kode, konteks jejak tepercaya, dan
atribut yang telah disanitasi; isi pesan log mentah hanya diekspor
ketika `diagnostics.otel.captureContent` bernilai boolean `true`. Subkunci terperinci
`captureContent.*` tidak pernah mengaktifkan isi log. Metrik Talk hanya mengekspor
metadata peristiwa berbatas (mode, transport, penyedia, jenis peristiwa)—tanpa
transkrip, muatan audio, ID sesi, ID giliran, ID panggilan, ID ruang, atau
token serah-terima.

Permintaan model keluar dapat menyertakan header W3C `traceparent` yang hanya dibuat
dari konteks jejak diagnostik milik OpenClaw untuk panggilan model yang aktif.
Header `traceparent` yang sudah diberikan pemanggil akan diganti, sehingga plugin atau
opsi penyedia khusus tidak dapat memalsukan asal-usul jejak lintas layanan.

Tetapkan `diagnostics.otel.captureContent.*` ke `true` hanya ketika kolektor
dan kebijakan retensi Anda disetujui untuk teks prompt, respons, alat, atau
prompt sistem. Setiap subkunci bersifat independen:

- `inputMessages`—konten prompt pengguna.
- `outputMessages`—konten respons model.
- `toolInputs`—muatan argumen alat.
- `toolOutputs`—muatan hasil alat.
- `systemPrompt`—prompt sistem/pengembang yang telah disusun.
- `toolDefinitions`—nama, deskripsi, dan skema alat model.

Ketika subkunci mana pun diaktifkan, span model dan alat mendapatkan atribut
`openclaw.content.*` yang berbatas dan telah disunting hanya untuk kelas tersebut.

<Note>
Boolean `captureContent: true` mengaktifkan `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions`, dan isi log OTLP secara bersamaan, tetapi **tidak** mengaktifkan `systemPrompt`—tetapkan `captureContent.systemPrompt: true` secara eksplisit jika Anda juga memerlukan prompt sistem yang telah disusun.
</Note>

Konten `toolInputs`/`toolOutputs` direkam untuk eksekusi alat pada runtime agen
bawaan (`openclaw.content.tool_input` dan
`gen_ai.tool.call.arguments` pada span selesai/kesalahan;
`openclaw.content.tool_output` dan `gen_ai.tool.call.result` pada span selesai).
Nama `openclaw.content.*` tetap menjadi nama atribut OpenClaw yang stabil;
salinan `gen_ai.tool.call.*` mencerminkannya untuk penampil native semconv.
Panggilan alat harness eksternal (Codex, Claude CLI) memancarkan
span `tool.execution.*` tanpa muatan konten. Konten yang direkam berjalan melalui
saluran tepercaya khusus pemroses dan tidak pernah ditempatkan pada bus peristiwa diagnostik
publik.

## Pengambilan sampel dan pengosongan

- **Jejak:** `diagnostics.otel.sampleRate` menetapkan `TraceIdRatioBasedSampler`
  hanya pada span akar (`0.0` membuang semuanya, `1.0` menyimpan semuanya). Jika
  tidak ditetapkan, nilai bawaan OpenTelemetry SDK digunakan (selalu aktif).
- **Metrik:** `diagnostics.otel.flushIntervalMs` (dibatasi ke nilai minimum
  `1000`); jika tidak ditetapkan, nilai bawaan ekspor berkala SDK digunakan.
- **Log:** Log OTLP mengikuti `logging.level` (tingkat log berkas) dan menggunakan
  jalur penyamaran rekaman log diagnostik, bukan pemformatan konsol. Instalasi
  bervolume tinggi sebaiknya memilih pengambilan sampel/pemfilteran kolektor OTLP
  daripada pengambilan sampel lokal. Tetapkan `diagnostics.otel.logsExporter: "stdout"`
  jika platform Anda sudah mengirim stdout/stderr ke pemroses log dan Anda tidak
  memiliki kolektor log OTLP. Rekaman stdout berupa satu objek JSON per baris
  dengan `ts`, `signal`, `service.name`, tingkat keparahan, isi, atribut yang
  disamarkan, dan bidang jejak tepercaya jika tersedia.
- **Korelasi log berkas:** Log berkas JSONL menyertakan `traceId`, `spanId`,
  `parentSpanId`, dan `traceFlags` pada tingkat teratas ketika pemanggilan log
  membawa konteks jejak diagnostik yang valid, sehingga pemroses log dapat
  menghubungkan baris log lokal dengan span yang diekspor.
- **Korelasi permintaan:** Permintaan HTTP dan frame WebSocket Gateway membuat
  cakupan jejak permintaan internal. Log dan peristiwa diagnostik di dalam
  cakupan tersebut secara bawaan mewarisi jejak permintaan, sedangkan span
  eksekusi agen dan pemanggilan model dibuat sebagai anak agar header
  `traceparent` penyedia tetap berada pada jejak yang sama.
- **Korelasi pemanggilan model:** Span `openclaw.model.call` secara bawaan
  menyertakan ukuran komponen prompt yang aman dan atribut token per pemanggilan
  ketika hasil penyedia menampilkan penggunaan. `openclaw.model.usage` tetap
  menjadi span akuntansi tingkat eksekusi untuk biaya agregat, konteks, dan
  dasbor kanal, serta tetap berada pada jejak diagnostik yang sama ketika
  runtime yang memancarkannya memiliki konteks jejak tepercaya.

## Metrik yang diekspor

### Penggunaan model

- `openclaw.tokens` (penghitung, atribut: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (penghitung, atribut: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atribut: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metrik konvensi semantik GenAI, atribut: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, detik, metrik konvensi semantik GenAI, atribut: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opsional)
- `openclaw.model_call.duration_ms` (histogram, atribut: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, ditambah `openclaw.errorCategory` dan `openclaw.failureKind` pada kesalahan yang diklasifikasikan)
- `openclaw.model_call.request_bytes` (histogram, ukuran byte UTF-8 dari muatan permintaan model akhir; tanpa isi muatan mentah)
- `openclaw.model_call.response_bytes` (histogram, ukuran byte UTF-8 dari muatan potongan respons yang dialirkan; delta teks, pemikiran, dan pemanggilan alat berfrekuensi tinggi hanya menghitung byte `delta` inkremental; tanpa isi respons mentah)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, waktu berlalu sebelum peristiwa respons pertama yang dialirkan)
- `openclaw.model.failover` (penghitung, atribut: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (penghitung, atribut: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` opsional, `openclaw.toolName` opsional)

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
- `openclaw.session.stuck` (penghitung, atribut: `openclaw.state`; dipancarkan untuk pencatatan sesi kedaluwarsa yang dapat dipulihkan)
- `openclaw.session.stuck_age_ms` (histogram, atribut: `openclaw.state`; dipancarkan untuk pencatatan sesi kedaluwarsa yang dapat dipulihkan)
- `openclaw.session.turn.created` (penghitung, atribut: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (penghitung, atribut: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (penghitung, atribut: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, atribut: sama seperti penghitung pemulihan yang bersesuaian)
- `openclaw.run.attempt` (penghitung, atribut: `openclaw.attempt`)

### Telemetri keaktifan sesi

`diagnostics.stuckSessionWarnMs` adalah ambang usia tanpa kemajuan untuk
diagnostik keaktifan sesi. Sesi `processing` tidak bertambah usianya menuju
ambang ini selama OpenClaw mengamati kemajuan respons, alat, status, blok, atau
runtime ACP. Sinyal tetap aktif pengetikan tidak dihitung sebagai kemajuan,
sehingga model atau harness yang diam tetap dapat dideteksi.

OpenClaw mengklasifikasikan sesi berdasarkan pekerjaan yang masih dapat diamati:

- `session.long_running`: pekerjaan tertanam aktif, pemanggilan model, atau
  pemanggilan alat masih mengalami kemajuan. Pemanggilan model yang memiliki
  pemilik dan tetap diam setelah `diagnostics.stuckSessionWarnMs` juga
  dilaporkan sebagai berjalan lama sebelum `diagnostics.stuckSessionAbortMs`,
  sehingga penyedia model yang lambat atau tidak mengalirkan respons tidak
  tampak seperti sesi Gateway yang macet selama pembatalan masih dapat diamati.
- `session.stalled`: pekerjaan aktif ada, tetapi eksekusi aktif belum melaporkan
  kemajuan baru-baru ini. Pemanggilan model yang memiliki pemilik beralih dari
  `session.long_running` ke `session.stalled` saat atau setelah
  `diagnostics.stuckSessionAbortMs`; aktivitas model/alat kedaluwarsa tanpa
  pemilik tidak dianggap sebagai pekerjaan berjalan lama yang tidak berbahaya.
  Eksekusi tertanam yang macet awalnya tetap hanya diamati, lalu dibatalkan dan
  dikosongkan setelah `diagnostics.stuckSessionAbortMs` tanpa kemajuan agar
  giliran yang mengantre di belakang jalur dapat dilanjutkan. Jika tidak
  ditetapkan, ambang pembatalan secara bawaan menggunakan jendela diperpanjang
  yang lebih aman, yaitu setidaknya 5 menit dan 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: pencatatan sesi kedaluwarsa tanpa pekerjaan aktif, atau sesi
  antrean menganggur dengan aktivitas model/alat kedaluwarsa tanpa pemilik. Ini
  segera melepaskan jalur sesi yang terdampak setelah gerbang pemulihan lulus.

Pemulihan memancarkan peristiwa terstruktur `session.recovery.requested` dan
`session.recovery.completed`. Status sesi diagnostik ditandai menganggur hanya
setelah hasil pemulihan yang mengubah keadaan (`aborted` atau `released`) dan
hanya jika generasi pemrosesan yang sama masih berlaku.

Hanya `session.stuck` yang memancarkan penghitung `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms`, dan span `openclaw.session.stuck`.
Diagnostik `session.stuck` yang berulang mengurangi frekuensi selama sesi tetap
tidak berubah, sehingga dasbor sebaiknya memberikan peringatan saat terjadi
peningkatan berkelanjutan, bukan pada setiap detak Heartbeat. Untuk opsi
konfigurasi dan nilai bawaannya, lihat
[Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics).

Peringatan keaktifan juga memancarkan:

- `openclaw.liveness.warning` (penghitung, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, atribut: `openclaw.liveness.reason`)

### Siklus hidup harness

- `openclaw.harness.duration_ms` (histogram, atribut: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` pada kesalahan)

### Eksekusi alat dan deteksi perulangan

- `openclaw.tool.execution.duration_ms` (histogram, atribut: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, ditambah `openclaw.errorCategory` pada kesalahan)
- `openclaw.tool.execution.blocked` (penghitung, atribut: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (penghitung, atribut: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` opsional; dipancarkan ketika perulangan pemanggilan alat yang repetitif terdeteksi)

### Exec

- `openclaw.exec.duration_ms` (histogram, atribut: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internal diagnostik (memori, muatan, kesehatan pengekspor)

- `openclaw.payload.large` (penghitung, atribut: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, atribut: sama seperti `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (histogram, tanpa atribut; sampel memori proses)
- `openclaw.memory.pressure` (penghitung, atribut: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (penghitung, atribut: `openclaw.diagnostic.async_queue.drop_class`; pembuangan akibat tekanan balik antrean diagnostik internal)
- `openclaw.telemetry.exporter.events` (penghitung, atribut: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` opsional, `openclaw.errorCategory` opsional; telemetri mandiri siklus hidup/kegagalan pengekspor)

## Span yang diekspor

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` secara bawaan, atau `gen_ai.provider.name` ketika konvensi semantik GenAI terbaru diaktifkan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` secara bawaan, atau `gen_ai.provider.name` ketika konvensi semantik GenAI terbaru diaktifkan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type`, dan `openclaw.failureKind` opsional saat terjadi kesalahan
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (hanya ukuran komponen yang aman, tanpa teks prompt)
  - `openclaw.model_call.usage.*` dan `gen_ai.usage.*` ketika hasil panggilan model memuat penggunaan penyedia untuk panggilan individual tersebut
  - Peristiwa span `openclaw.provider.request` dengan atribut `openclaw.upstreamRequestIdHash` (dibatasi, berbasis hash) ketika hasil penyedia upstream mengekspos ID permintaan; ID mentah tidak pernah diekspor
  - Dengan `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, span panggilan model menggunakan nama span inferensi GenAI terbaru `{gen_ai.operation.name} {gen_ai.request.model}` dan jenis span `CLIENT`, bukan `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Saat selesai: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Saat terjadi kesalahan: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opsional
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, `gen_ai.tool.call.id` opsional, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - `openclaw.errorCategory`/`openclaw.errorCode` opsional saat terjadi kesalahan, `openclaw.deniedReason` dan `openclaw.outcome=blocked` ketika ditolak oleh kebijakan atau sandbox
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
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
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` opsional (tanpa pesan perulangan, parameter, atau keluaran alat)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms` opsional

Ketika pengambilan konten diaktifkan secara eksplisit, span model dan alat juga dapat
menyertakan atribut `openclaw.content.*` yang dibatasi dan disunting untuk kelas
konten tertentu yang Anda pilih.

## Katalog peristiwa diagnostik

Peristiwa di bawah ini mendukung metrik dan span di atas. Plugin juga dapat
berlangganan langsung ke peristiwa tersebut tanpa ekspor OTLP.

**Penggunaan model**

- `model.usage` - token, biaya, durasi, konteks, penyedia/model/saluran,
  ID sesi. `usage` adalah penghitungan penyedia/giliran untuk biaya dan telemetri;
  `context.used` adalah cuplikan prompt/konteks saat ini dan dapat lebih rendah daripada
  `usage.total` penyedia ketika input yang di-cache atau panggilan perulangan alat terlibat.

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
  siklus hidup per eksekusi untuk harness agen. Mencakup `harnessId`, `pluginId`
  opsional, penyedia/model/saluran, dan ID eksekusi. Penyelesaian menambahkan
  `durationMs`, `outcome`, `resultClassification` opsional, `yieldDetected`,
  dan jumlah `itemLifecycle`. Kesalahan menambahkan `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, dan
  `cleanupFailed` opsional.

**Eksekusi**

- `exec.process.completed` - hasil akhir terminal, durasi, target, mode, kode
  keluar, dan jenis kegagalan. Teks perintah dan direktori kerja tidak
  disertakan.
- `exec.approval.followup_suppressed` - tindak lanjut persetujuan yang kedaluwarsa dibuang
  setelah sesi terikat ulang. Mencakup `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` atau `gateway_preflight`),
  dan stempel waktu dispatcher. Kunci sesi, rute, dan teks perintah tidak
  disertakan.

## Tanpa pengekspor

Pertahankan ketersediaan peristiwa diagnostik bagi Plugin atau tujuan khusus tanpa menjalankan
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Untuk keluaran debug yang ditargetkan tanpa menaikkan `logging.level`, gunakan tanda diagnostik.
Tanda tidak peka huruf besar-kecil dan mendukung karakter pengganti (`telegram.*` atau
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Atau sebagai penggantian env sekali pakai:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Keluaran tanda dikirim ke berkas log standar (`logging.file`) dan tetap
disunting oleh `logging.redactSensitive`. Panduan lengkap:
[Tanda diagnostik](/id/diagnostics/flags).

## Menonaktifkan

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Atau jangan sertakan `diagnostics-otel` dalam `plugins.allow`, atau jalankan
`openclaw plugins disable diagnostics-otel`.

## Terkait

- [Pencatatan log](/id/logging) - log berkas, keluaran konsol, pemantauan CLI, dan tab Log di Control UI
- [Internal pencatatan log Gateway](/id/gateway/logging) - gaya log WS, prefiks subsistem, dan pengambilan konsol
- [Tanda diagnostik](/id/diagnostics/flags) - tanda log debug yang ditargetkan
- [Ekspor diagnostik](/id/gateway/diagnostics) - alat paket dukungan operator (terpisah dari ekspor OTEL)
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) - referensi lengkap bidang `diagnostics.*`
