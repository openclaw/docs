---
read_when:
    - Anda ingin mengirim penggunaan model OpenClaw, alur pesan, atau metrik sesi ke kolektor OpenTelemetry
    - Anda menghubungkan jejak, metrik, atau log ke Grafana, Datadog, Honeycomb, New Relic, Tempo, atau penerima OTLP lainnya
    - Anda memerlukan nama metrik, nama span, atau bentuk atribut yang tepat untuk membuat dasbor atau peringatan
summary: Ekspor diagnostik OpenClaw ke kolektor OpenTelemetry apa pun melalui Plugin diagnostics-otel (OTLP/HTTP)
title: Ekspor OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T09:37:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw mengekspor diagnostik melalui Plugin resmi `diagnostics-otel`
menggunakan **OTLP/HTTP (protobuf)**. Kolektor atau backend apa pun yang menerima OTLP/HTTP
berfungsi tanpa perubahan kode. Untuk log file lokal dan cara membacanya, lihat
[Logging](/id/logging).

## Cara semuanya terhubung

- **Peristiwa diagnostik** adalah rekaman terstruktur dalam proses yang dipancarkan oleh
  Gateway dan Plugin bawaan untuk eksekusi model, alur pesan, sesi, antrean,
  dan exec.
- **Plugin `diagnostics-otel`** berlangganan ke peristiwa tersebut dan mengekspornya sebagai
  **metrik**, **trace**, dan **log** OpenTelemetry melalui OTLP/HTTP.
- **Panggilan penyedia** menerima header W3C `traceparent` dari konteks span panggilan model
  tepercaya milik OpenClaw ketika transport penyedia menerima header kustom.
  Konteks trace yang dipancarkan Plugin tidak dipropagasikan.
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

| Sinyal      | Isi di dalamnya                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrik** | Counter dan histogram untuk penggunaan token, biaya, durasi eksekusi, alur pesan, peristiwa Talk, jalur antrean, status/pemulihan sesi, exec, dan tekanan memori. |
| **Trace**  | Span untuk penggunaan model, panggilan model, siklus hidup harness, eksekusi alat, exec, pemrosesan webhook/pesan, penyusunan konteks, dan loop alat.              |
| **Log**    | Rekaman `logging.file` terstruktur yang diekspor melalui OTLP ketika `diagnostics.otel.logs` diaktifkan.                                                           |

Aktifkan/nonaktifkan `traces`, `metrics`, dan `logs` secara independen. Ketiganya aktif secara default
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Mengganti `diagnostics.otel.endpoint`. Jika nilainya sudah berisi `/v1/traces`, `/v1/metrics`, atau `/v1/logs`, nilai tersebut digunakan apa adanya.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Penggantian endpoint khusus sinyal yang digunakan ketika kunci konfigurasi `diagnostics.otel.*Endpoint` yang sesuai belum diatur. Konfigurasi khusus sinyal mengungguli env khusus sinyal, yang mengungguli endpoint bersama.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Mengganti `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Mengganti protokol wire (hanya `http/protobuf` yang dihormati saat ini).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Atur ke `gen_ai_latest_experimental` untuk memancarkan atribut span GenAI eksperimental terbaru (`gen_ai.provider.name`) alih-alih `gen_ai.system` lama. Metrik GenAI selalu menggunakan atribut semantik berbatas dan berkardinalitas rendah. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Atur ke `1` ketika preload atau proses host lain sudah mendaftarkan SDK OpenTelemetry global. Plugin kemudian melewati siklus hidup NodeSDK miliknya sendiri tetapi tetap memasang listener diagnostik dan menghormati `traces`/`metrics`/`logs`.                |

## Privasi dan pengambilan konten

Konten mentah model/alat **tidak** diekspor secara default. Span membawa
pengidentifikasi berbatas (channel, penyedia, model, kategori error, id permintaan hanya hash)
dan tidak pernah menyertakan teks prompt, teks respons, input alat, output alat, atau
kunci sesi.
Metrik Talk hanya mengekspor metadata peristiwa berbatas seperti mode, transport,
penyedia, dan jenis peristiwa. Metrik tersebut tidak menyertakan transkrip, payload audio,
id sesi, id giliran, id panggilan, id ruang, atau token handoff.

Permintaan model keluar dapat menyertakan header W3C `traceparent`. Header tersebut
dibuat hanya dari konteks trace diagnostik milik OpenClaw untuk panggilan model aktif.
Header `traceparent` yang sudah dipasok pemanggil diganti, sehingga Plugin atau
opsi penyedia kustom tidak dapat memalsukan asal-usul trace lintas layanan.

Atur `diagnostics.otel.captureContent.*` ke `true` hanya ketika kolektor dan
kebijakan retensi Anda disetujui untuk teks prompt, respons, alat, atau system-prompt.
Setiap subkunci bersifat ikut serta secara independen:

- `inputMessages` - konten prompt pengguna.
- `outputMessages` - konten respons model.
- `toolInputs` - payload argumen alat.
- `toolOutputs` - payload hasil alat.
- `systemPrompt` - prompt sistem/developer yang dirangkai.

Ketika salah satu subkunci diaktifkan, span model dan alat mendapatkan atribut
`openclaw.content.*` berbatas dan disunting hanya untuk kelas tersebut.

## Sampling dan flushing

- **Trace:** `diagnostics.otel.sampleRate` (hanya root-span, `0.0` membuang semua,
  `1.0` menyimpan semua).
- **Metrik:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Log:** Log OTLP menghormati `logging.level` (level log file). Log tersebut menggunakan
  jalur redaksi rekaman log diagnostik, bukan pemformatan konsol. Instalasi bervolume tinggi
  sebaiknya memilih sampling/filtering kolektor OTLP dibanding sampling lokal.
- **Korelasi log file:** Log file JSONL menyertakan `traceId`,
  `spanId`, `parentSpanId`, dan `traceFlags` tingkat atas ketika panggilan log membawa
  konteks trace diagnostik yang valid, sehingga pemroses log dapat menggabungkan baris log lokal dengan
  span yang diekspor.
- **Korelasi permintaan:** Permintaan HTTP Gateway dan frame WebSocket membuat
  cakupan trace permintaan internal. Log dan peristiwa diagnostik di dalam cakupan tersebut
  mewarisi trace permintaan secara default, sementara span eksekusi agen dan panggilan model
  dibuat sebagai anak sehingga header `traceparent` penyedia tetap berada pada trace yang sama.

## Metrik yang diekspor

### Penggunaan model

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metrik konvensi semantik GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, detik, metrik konvensi semantik GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opsional `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` dan `openclaw.failureKind` pada error yang diklasifikasikan)
- `openclaw.model_call.request_bytes` (histogram, ukuran byte UTF-8 dari payload permintaan model final; tanpa konten payload mentah)
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

### Talk

- `openclaw.talk.event` (counter, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, attrs: sama seperti `openclaw.talk.event`; dipancarkan ketika peristiwa Talk melaporkan durasi)
- `openclaw.talk.audio.bytes` (histogram, attrs: sama seperti `openclaw.talk.event`; dipancarkan untuk peristiwa frame audio Talk yang melaporkan panjang byte)

### Antrean dan sesi

- `openclaw.queue.lane.enqueue` (penghitung, atribut: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (penghitung, atribut: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atribut: `openclaw.lane` atau `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atribut: `openclaw.lane`)
- `openclaw.session.state` (penghitung, atribut: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (penghitung, atribut: `openclaw.state`; dipancarkan hanya untuk pencatatan sesi usang tanpa pekerjaan aktif)
- `openclaw.session.stuck_age_ms` (histogram, atribut: `openclaw.state`; dipancarkan hanya untuk pencatatan sesi usang tanpa pekerjaan aktif)
- `openclaw.session.recovery.requested` (penghitung, atribut: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (penghitung, atribut: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, atribut: sama seperti penghitung pemulihan yang cocok)
- `openclaw.run.attempt` (penghitung, atribut: `openclaw.attempt`)

### Telemetri keaktifan sesi

`diagnostics.stuckSessionWarnMs` adalah ambang usia tanpa progres untuk diagnostik keaktifan sesi. Sesi `processing` tidak bertambah usianya menuju ambang ini saat OpenClaw mengamati progres runtime balasan, alat, status, blok, atau ACP. Keepalive pengetikan tidak dihitung sebagai progres, sehingga model atau harness yang senyap tetap dapat dideteksi.

OpenClaw mengklasifikasikan sesi berdasarkan pekerjaan yang masih dapat diamatinya:

- `session.long_running`: pekerjaan tertanam aktif, panggilan model, atau panggilan alat masih membuat progres.
- `session.stalled`: pekerjaan aktif ada, tetapi run aktif belum melaporkan progres terbaru. Run tertanam yang macet pada awalnya tetap hanya diamati, lalu abort-drain setelah `diagnostics.stuckSessionAbortMs` tanpa progres agar giliran antrean di belakang lane dapat dilanjutkan. Jika tidak disetel, ambang pembatalan default ke jendela diperpanjang yang lebih aman, yaitu setidaknya 10 menit dan 5x `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: pencatatan sesi usang tanpa pekerjaan aktif. Ini segera melepaskan lane sesi yang terdampak.

Pemulihan memancarkan peristiwa `session.recovery.requested` dan `session.recovery.completed` terstruktur. Status sesi diagnostik ditandai idle hanya setelah hasil pemulihan yang mengubah status (`aborted` atau `released`) dan hanya jika generasi processing yang sama masih berlaku saat ini.

Hanya `session.stuck` yang memancarkan penghitung `openclaw.session.stuck`, histogram `openclaw.session.stuck_age_ms`, dan span `openclaw.session.stuck`. Diagnostik `session.stuck` berulang melakukan backoff saat sesi tetap tidak berubah, sehingga dasbor sebaiknya memberi peringatan pada peningkatan yang berkelanjutan, bukan pada setiap tick Heartbeat. Untuk knob konfigurasi dan default, lihat [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics).

### Siklus hidup harness

- `openclaw.harness.duration_ms` (histogram, atribut: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` pada error)

### Exec

- `openclaw.exec.duration_ms` (histogram, atribut: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internal diagnostik (memori dan loop alat)

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
  - `openclaw.errorCategory` dan `openclaw.failureKind` opsional pada error
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hash terbatas berbasis SHA dari id permintaan penyedia upstream; id mentah tidak diekspor)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Saat selesai: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Saat error: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opsional
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

Saat penangkapan konten diaktifkan secara eksplisit, span model dan alat juga dapat menyertakan atribut `openclaw.content.*` yang terbatas dan disamarkan untuk kelas konten spesifik yang Anda ikutsertakan.

## Katalog peristiwa diagnostik

Peristiwa di bawah ini mendukung metrik dan span di atas. Plugin juga dapat berlangganan langsung ke peristiwa tersebut tanpa ekspor OTLP.

**Penggunaan model**

- `model.usage` - token, biaya, durasi, konteks, penyedia/model/channel, id sesi. `usage` adalah akuntansi penyedia/giliran untuk biaya dan telemetri; `context.used` adalah snapshot prompt/konteks saat ini dan dapat lebih rendah daripada `usage.total` penyedia saat input yang di-cache atau panggilan loop alat terlibat.

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - siklus hidup per run untuk harness agen. Mencakup `harnessId`, `pluginId` opsional, penyedia/model/channel, dan id run. Penyelesaian menambahkan `durationMs`, `outcome`, `resultClassification` opsional, `yieldDetected`, dan jumlah `itemLifecycle`. Error menambahkan `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, dan `cleanupFailed` opsional.

**Exec**

- `exec.process.completed` - hasil terminal, durasi, target, mode, kode keluar, dan jenis kegagalan. Teks perintah dan direktori kerja tidak disertakan.

## Tanpa exporter

Anda dapat menjaga peristiwa diagnostik tetap tersedia untuk Plugin atau sink khusus tanpa menjalankan `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Untuk keluaran debug tertarget tanpa menaikkan `logging.level`, gunakan flag diagnostik. Flag tidak peka huruf besar/kecil dan mendukung wildcard (misalnya `telegram.*` atau `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Atau sebagai override env sekali pakai:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Keluaran flag masuk ke file log standar (`logging.file`) dan tetap disamarkan oleh `logging.redactSensitive`. Panduan lengkap: [Flag diagnostik](/id/diagnostics/flags).

## Nonaktifkan

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Anda juga dapat mengeluarkan `diagnostics-otel` dari `plugins.allow`, atau menjalankan `openclaw plugins disable diagnostics-otel`.

## Terkait

- [Logging](/id/logging) - log file, keluaran konsol, tailing CLI, dan tab Log Control UI
- [Internal logging Gateway](/id/gateway/logging) - gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Flag diagnostik](/id/diagnostics/flags) - flag log debug tertarget
- [Ekspor diagnostik](/id/gateway/diagnostics) - alat support-bundle operator (terpisah dari ekspor OTEL)
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) - referensi lengkap field `diagnostics.*`
