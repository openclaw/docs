---
read_when:
    - Anda ingin mengirimkan metrik penggunaan model, alur pesan, atau sesi OpenClaw ke kolektor OpenTelemetry
    - Anda menghubungkan trace, metrik, atau log ke Grafana, Datadog, Honeycomb, New Relic, Tempo, atau backend OTLP lainnya
    - Anda memerlukan nama metrik, nama span, atau bentuk atribut yang tepat untuk membuat dasbor atau peringatan
summary: Ekspor diagnostik OpenClaw ke kolektor OpenTelemetry atau JSONL stdout melalui plugin diagnostics-otel
title: Ekspor OpenTelemetry
x-i18n:
    generated_at: "2026-07-20T03:53:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ed37f094c6c151379d8e0aaa2633b3ebebdb08b7dcbc9403c4bdeb6e5b8cf76
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw mengekspor diagnostik melalui plugin resmi `diagnostics-otel`
menggunakan **OTLP/HTTP (protobuf)**. Log juga dapat ditulis sebagai JSONL stdout untuk
pipeline log kontainer dan sandbox. Kolektor atau backend apa pun yang menerima
OTLP/HTTP dapat digunakan tanpa perubahan kode. Untuk log file lokal, lihat
[Logging](/id/logging).

- **Peristiwa diagnostik** adalah catatan terstruktur dalam proses yang dipancarkan oleh
  Gateway dan plugin bawaan untuk eksekusi model, alur pesan, sesi, antrean,
  dan exec.
- **`diagnostics-otel`** berlangganan peristiwa tersebut dan mengekspornya sebagai
  **metrik**, **trace**, dan **log** OpenTelemetry melalui OTLP/HTTP, serta dapat
  mencerminkan catatan log ke JSONL stdout.
- **Panggilan penyedia** menerima header W3C `traceparent` dari konteks
  span panggilan model tepercaya milik OpenClaw ketika transport penyedia menerima header
  khusus. Konteks trace yang dipancarkan plugin tidak disebarkan.
- Pengekspor hanya dipasang ketika permukaan diagnostik dan plugin
  sama-sama diaktifkan, sehingga biaya dalam proses secara default tetap mendekati nol.

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
`protocol` hanya mendukung `http/protobuf`. Karena `traces` dan `metrics` secara default diaktifkan, nilai lain apa pun (termasuk `grpc`) membatalkan seluruh langganan diagnostics-otel dengan peringatan `unsupported protocol`—hal ini juga menghentikan ekspor log stdout. Tetapkan `traces: false` dan `metrics: false` secara eksplisit jika Anda hanya menginginkan `logsExporter: "stdout"` dengan nilai protokol non-OTLP.
</Note>

## Sinyal yang diekspor

| Sinyal      | Isi                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrik** | Penghitung/histogram untuk penggunaan token, biaya, durasi eksekusi, failover, penggunaan skill, alur pesan, peristiwa Talk, jalur antrean, status/pemulihan sesi, eksekusi alat, exec, memori, keaktifan, dan kesehatan pengekspor. |
| **Trace**  | Span untuk penggunaan model, panggilan model, siklus hidup harness, penggunaan skill, eksekusi alat, exec, pemrosesan webhook/pesan, penyusunan konteks, dan perulangan alat.                                                      |
| **Log**    | Catatan `logging.file` terstruktur yang diekspor melalui OTLP atau JSONL stdout saat `diagnostics.otel.logs` diaktifkan; isi log tidak disertakan kecuali pengambilan konten diaktifkan secara eksplisit.                          |

Aktifkan atau nonaktifkan `traces`, `metrics`, dan `logs` secara terpisah. Trace dan metrik
secara default aktif saat `diagnostics.otel.enabled` bernilai true; log secara default nonaktif
dan hanya diekspor saat `diagnostics.otel.logs` secara eksplisit bernilai `true`. Ekspor log
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
      serviceName: "openclaw-gateway", // jika tidak ditetapkan, kembali ke OTEL_SERVICE_NAME, lalu "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | keduanya
      sampleRate: 0.2, // sampler span akar, 0.0..1.0
      flushIntervalMs: 60000, // interval ekspor metrik (min 1000ms)
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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Nilai cadangan endpoint khusus sinyal yang digunakan ketika kunci konfigurasi `diagnostics.otel.*Endpoint` yang sesuai tidak ditetapkan. Konfigurasi khusus sinyal mengungguli variabel lingkungan khusus sinyal, yang mengungguli endpoint bersama.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Nilai cadangan untuk `diagnostics.otel.serviceName` ketika kunci konfigurasi tidak ditetapkan. Nama layanan default adalah `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Nilai cadangan untuk protokol wire ketika `diagnostics.otel.protocol` tidak ditetapkan. Hanya `http/protobuf` yang mengaktifkan ekspor.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Tetapkan ke `gen_ai_latest_experimental` untuk memancarkan bentuk span inferensi GenAI terbaru: nama span `{gen_ai.operation.name} {gen_ai.request.model}`, jenis span `CLIENT`, dan `gen_ai.provider.name` sebagai pengganti `gen_ai.system` lama. Metrik GenAI selalu menggunakan atribut terbatas dengan kardinalitas rendah. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Tetapkan ke `1` ketika preload atau proses host lain telah mendaftarkan SDK OpenTelemetry global. Plugin kemudian melewati siklus hidup NodeSDK miliknya sendiri, tetapi tetap menghubungkan listener diagnostik dan mematuhi `traces`/`metrics`/`logs`.                                                                                    |

## Privasi dan pengambilan konten

Konten mentah model/alat secara default **tidak** diekspor. Span membawa
pengidentifikasi terbatas (saluran, penyedia, model, kategori kesalahan, ID permintaan khusus hash,
sumber alat, pemilik alat, nama/sumber skill) dan tidak pernah menyertakan teks prompt,
teks respons, input alat, output alat, jalur file skill, atau kunci sesi.
Nilai yang tampak seperti kunci sesi agen bercakupan (misalnya diawali dengan
`agent:`) diganti dengan `unknown` pada atribut berkardinalitas rendah. Catatan log OTLP
secara default mempertahankan tingkat keparahan, logger, lokasi kode, konteks trace tepercaya, dan
atribut yang telah disanitasi; isi pesan log mentah hanya diekspor
ketika `diagnostics.otel.captureContent` adalah boolean `true`. Subkunci terperinci
`captureContent.*` tidak pernah mengaktifkan isi log. Metrik Talk hanya mengekspor
metadata peristiwa terbatas (mode, transport, penyedia, jenis peristiwa)—tanpa
transkrip, muatan audio, ID sesi, ID giliran, ID panggilan, ID ruang, atau
token handoff.

Permintaan model keluar dapat menyertakan header W3C `traceparent` yang hanya dihasilkan
dari konteks trace diagnostik milik OpenClaw untuk panggilan model aktif.
Header `traceparent` yang sudah disediakan pemanggil akan diganti, sehingga plugin atau
opsi penyedia khusus tidak dapat memalsukan leluhur trace lintas layanan.

Tetapkan `diagnostics.otel.captureContent.*` ke `true` hanya ketika kolektor
dan kebijakan retensi Anda telah disetujui untuk teks prompt, respons, alat, atau
prompt sistem. Setiap subkunci bersifat independen:

- `inputMessages`—konten prompt pengguna.
- `outputMessages`—konten respons model.
- `toolInputs`—muatan argumen alat.
- `toolOutputs`—muatan hasil alat.
- `systemPrompt`—prompt sistem/developer yang telah disusun.
- `toolDefinitions`—nama, deskripsi, dan skema alat model.

Saat subkunci mana pun diaktifkan, span model dan alat mendapatkan atribut
`openclaw.content.*` terbatas yang telah disunting hanya untuk kelas tersebut.

<Note>
Boolean `captureContent: true` mengaktifkan `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions`, dan isi log OTLP secara bersamaan, tetapi **tidak** mengaktifkan `systemPrompt`—tetapkan `captureContent.systemPrompt: true` secara eksplisit jika Anda juga memerlukan prompt sistem yang telah disusun.
</Note>

Konten `toolInputs`/`toolOutputs` diambil untuk eksekusi alat
runtime agen bawaan (`openclaw.content.tool_input` dan
`gen_ai.tool.call.arguments` pada span selesai/kesalahan;
`openclaw.content.tool_output` dan `gen_ai.tool.call.result` pada span
selesai). Nama `openclaw.content.*` tetap menjadi nama atribut OpenClaw yang
stabil; salinan `gen_ai.tool.call.*` mencerminkannya untuk penampil semconv-native.
Panggilan alat harness eksternal (Codex, Claude CLI) memancarkan
span `tool.execution.*` tanpa muatan konten. Konten yang diambil melewati
saluran tepercaya khusus listener dan tidak pernah ditempatkan pada bus peristiwa diagnostik
publik.

## Sampling dan flushing

- **Jejak:** `diagnostics.otel.sampleRate` menetapkan `TraceIdRatioBasedSampler`
  hanya pada span akar (`0.0` membuang semuanya, `1.0` mempertahankan semuanya). Jika tidak ditetapkan, nilai
  default OpenTelemetry SDK digunakan (selalu aktif).
- **Metrik:** `diagnostics.otel.flushIntervalMs` (dibatasi ke nilai minimum
  `1000`); jika tidak ditetapkan, nilai default ekspor berkala SDK digunakan.
- **Log:** Log OTLP mengikuti `logging.level` (tingkat log file) dan menggunakan
  jalur redaksi rekaman log diagnostik, bukan pemformatan konsol. Instalasi
  dengan volume tinggi sebaiknya memilih pengambilan sampel/pemfilteran kolektor OTLP daripada pengambilan
  sampel lokal. Tetapkan `diagnostics.otel.logsExporter: "stdout"` jika platform Anda
  telah mengirim stdout/stderr ke pemroses log dan Anda tidak memiliki kolektor
  log OTLP. Rekaman stdout berupa satu objek JSON per baris dengan `ts`, `signal`,
  `service.name`, tingkat keparahan, isi, atribut yang telah disunting, serta kolom jejak
  tepercaya jika tersedia.
- **Korelasi log file:** Log file JSONL menyertakan `traceId`,
  `spanId`, `parentSpanId`, dan `traceFlags` pada tingkat teratas ketika pemanggilan log membawa
  konteks jejak diagnostik yang valid, sehingga pemroses log dapat menggabungkan baris log lokal dengan
  span yang diekspor.
- **Korelasi permintaan:** Permintaan HTTP Gateway dan frame WebSocket membuat
  cakupan jejak permintaan internal. Log dan peristiwa diagnostik di dalam
  cakupan tersebut secara default mewarisi jejak permintaan, sedangkan span eksekusi agen dan pemanggilan model
  dibuat sebagai turunannya agar header `traceparent` penyedia tetap berada pada
  jejak yang sama.
- **Korelasi pemanggilan model:** Span `openclaw.model.call` secara default menyertakan ukuran
  komponen prompt yang aman serta atribut token per pemanggilan ketika hasil penyedia
  mengekspos penggunaan. `openclaw.model.usage` tetap menjadi span akuntansi
  tingkat eksekusi untuk dasbor biaya agregat, konteks, dan kanal, serta
  tetap berada pada jejak diagnostik yang sama ketika runtime yang memancarkannya memiliki
  konteks jejak tepercaya.

### Unit observasi pemanggilan model

Setiap span `openclaw.model.call` mengidentifikasi hal yang diukur oleh siklus hidupnya melalui
`openclaw.model_call.observation_unit`:

- `request` - satu permintaan model/penyedia yang dapat diamati. Pemanggilan model
  tertanam native menggunakan unit ini, dan pengekspor memperlakukan nilai yang tidak ada sebagai `request` untuk
  kompatibilitas dengan pemancar lama atau eksternal.
- `turn` - satu giliran CLI agen buram yang dapat memuat permintaan model tersembunyi,
  percobaan ulang, pekerjaan alat, atau pekerjaan latar belakang. Pemanggilan Claude Code CLI dan server aplikasi Codex
  menggunakan unit ini.

Kedua unit tetap menjadi span pemanggilan model agar backend jejak dapat merender masukan model,
keluaran, penggunaan, dan hierarki. Span permintaan menggunakan operasi GenAI yang diturunkan dari API
(`chat`, `generate_content`, atau `text_completion`), sedangkan span giliran menggunakan
`gen_ai.operation.name = invoke_agent`. Keduanya berkontribusi pada
`gen_ai.client.operation.duration`, dengan nama operasi yang menjaga latensi
permintaan langsung tetap terpisah dari latensi giliran penuh. Metrik pemanggilan model OTEL OpenClaw
juga menyertakan `openclaw.model_call.observation_unit`; metrik pemanggilan model
Prometheus mengekspos label `observation_unit` yang setara.

### Fidelitas pemanggilan model Claude Code CLI

Giliran Claude Code CLI memancarkan satu span `openclaw.model.call`
sintetis tingkat giliran. Span ini bukan span permintaan HTTP Anthropic. Span ini menggunakan `openclaw.api =
claude-code`, `openclaw.model_call.observation_unit = turn`, dan mengidentifikasi
operasi sebagai `gen_ai.operation.name = invoke_agent`. Span ini mengidentifikasi
batas CLI OpenClaw melalui
`openclaw.transport`:

- `stdio` - proses Claude Code lokal sekali jalan.
- `stdio-live` - satu giliran pada sesi stdio Claude persisten yang dikelola.
- `paired-node-cli` - eksekusi Claude Code sekali jalan yang didelegasikan ke
  Node yang dipasangkan.

Diagnostik Claude CLI hanya dibuat selama dispatcher diagnostik proses
diaktifkan dan listener peristiwa internal atau tepercaya terpasang.
Jika tidak ada plugin observabilitas atau listener lain yang aktif, giliran Claude CLI melewati
hierarki jejak sintetis, buffer konten, dan penghitungan byte aliran
diagnostik. Saat pengambilan konten diaktifkan, kolom prompt dan prompt sistem
masing-masing dibatasi hingga 128 KiB; keluaran asisten dibatasi hingga 128 KiB dalam
maksimal 200 amplop, dengan 16 KiB dan satu item dicadangkan untuk respons fallback
terlihat terakhir. Sebuah penanda mencatat pemotongan ketika batas tercapai.

OpenClaw memberikan giliran Claude CLI hierarki kepemilikan yang sama dengan yang digunakan oleh runtime
agen lainnya: `openclaw.harness.run` (`openclaw.harness.id = claude-cli`)
memuat `openclaw.run`, yang memuat span `openclaw.model.call`
Claude. Span harness dan eksekusi adalah batas giliran OpenClaw sintetis, bukan
fase internal Claude Code. Giliran sekali jalan dan stdio terkelola menggunakan
hierarki yang sama; percobaan ulang sesi baru yang sebenarnya membuat turunan pemanggilan model lain di dalam
eksekusi OpenClaw yang sama.

Span dimulai ketika OpenClaw menerima giliran CLI yang telah disiapkan dan berakhir hanya setelah
giliran tersebut berhasil atau gagal. Untuk sesi terkelola, hasil keberhasilan sementara
tidak mengakhiri span selama Claude melaporkan agen latar belakang atau
alur kerja yang menahan hasil; hasil akhir setelah pengurasanlah yang mengakhirinya. Pembatalan, batas waktu, kegagalan proses,
kegagalan keluaran/penguraian, dan kegagalan giliran lainnya mengakhiri span yang sama dengan kesalahan.

Claude Code melaporkan penggunaan per pesan asisten dan juga dapat melaporkan penggunaan
kumulatif pada hasil terminalnya. Akuntansi balasan OpenClaw tetap menggunakan
pesan asisten terakhir agar semantik biaya yang ada tidak berubah; span
pemanggilan model tingkat giliran menggunakan penggunaan kumulatif terminal jika tersedia,
termasuk token pembacaan cache dan pembuatan cache.

Untuk span CLI ini, kolom byte dan waktu menjelaskan batas CLI OpenClaw
yang dapat diamati:

- `openclaw.model_call.request_bytes` adalah ukuran UTF-8 dari nilai prompt
  yang dikirim melalui stdin/argv sekali jalan, atau amplop pengguna JSONL stdio terkelola. Nilai ini
  bukan ukuran permintaan model tersembunyi Claude Code.
- `openclaw.model_call.response_bytes` adalah ukuran UTF-8 dari stdout Claude CLI
  yang diamati selama giliran. Nilai ini bukan ukuran respons HTTP Anthropic.
- `openclaw.model_call.time_to_first_byte_ms` adalah waktu hingga keluaran stdout atau stderr
  Claude CLI pertama yang dapat diamati. Nilai ini bukan TTFB jaringan.

Dengan kolom granular `captureContent` yang sesuai diaktifkan, span mengekspor
prompt efektif yang dikirim OpenClaw ke Claude Code, prompt sistem yang ditambahkan OpenClaw,
serta teks/penalaran/identitas pemanggilan alat asisten yang terlihat melalui
`gen_ai.input.messages`, `gen_ai.output.messages`, dan
`gen_ai.system_instructions`. Argumen alat, tanda tangan pemikiran buram, dan
hasil alat dihilangkan dari amplop asisten Claude. OpenClaw tidak
mengklaim akses ke prompt sistem privat Claude Code, payload permintaan tersembunyi yang dilanjutkan atau
dipadatkan, skema alat internal native, permintaan HTTP Anthropic mentah,
percobaan ulang internal, id permintaan upstream, atau TTFB jaringan yang sebenarnya. Karena
Claude Code tidak mengekspos definisi alat native efektifnya secara akurat,
span ini tidak mengisi `gen_ai.tool.definitions`.

Span alat harness Claude eksternal tetap hanya berisi metadata bahkan ketika pengambilan konten alat
diaktifkan. Seperti pada setiap span model, konten Claude CLI yang diambil menggunakan
jalur khusus listener tepercaya serta redaksi dan batas ukuran
pengekspor yang ada; konten tetap dinonaktifkan secara default.

## Metrik yang diekspor

### Penggunaan model

- `openclaw.tokens` (penghitung, atribut: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (penghitung, atribut: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atribut: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atribut: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metrik konvensi semantik GenAI, atribut: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, detik, metrik konvensi semantik GenAI untuk permintaan model dan giliran agen sintetis; atribut: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opsional; observasi giliran menggunakan `gen_ai.operation.name = invoke_agent`)
- `openclaw.model_call.duration_ms` (histogram, atribut: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit`, ditambah `openclaw.errorCategory` dan `openclaw.failureKind` pada kesalahan yang diklasifikasikan)
- `openclaw.model_call.request_bytes` (histogram, ukuran byte UTF-8 dari payload permintaan model akhir; untuk Claude Code CLI, masukan/amplop prompt yang dapat diamati sebagaimana dijelaskan di atas; tanpa konten payload mentah)
- `openclaw.model_call.response_bytes` (histogram, ukuran byte UTF-8 dari payload potongan respons yang dialirkan; delta teks, pemikiran, dan pemanggilan alat berfrekuensi tinggi hanya menghitung byte `delta` inkremental; untuk Claude Code CLI, byte stdout yang diamati; tanpa konten respons mentah)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, waktu berlalu sebelum peristiwa respons pertama yang dialirkan; untuk Claude Code CLI, keluaran CLI pertama yang dapat diamati, bukan TTFB jaringan)
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
- `openclaw.session.stuck` (penghitung, atribut: `openclaw.state`; dipancarkan untuk pembukuan sesi kedaluwarsa yang dapat dipulihkan)
- `openclaw.session.stuck_age_ms` (histogram, atribut: `openclaw.state`; dipancarkan untuk pembukuan sesi kedaluwarsa yang dapat dipulihkan)
- `openclaw.session.turn.created` (penghitung, atribut: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (penghitung, atribut: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (penghitung, atribut: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, atribut: sama seperti penghitung pemulihan yang sesuai)
- `openclaw.run.attempt` (penghitung, atribut: `openclaw.attempt`)

### Telemetri keaktifan sesi

Sesi `processing` tidak bertambah usianya menuju ambang keaktifan bawaan selama OpenClaw mengamati progres balasan, alat, status, blok, atau runtime ACP. Keepalive pengetikan tidak dihitung sebagai progres, sehingga model atau harness yang senyap tetap dapat dideteksi.

OpenClaw mengklasifikasikan sesi berdasarkan pekerjaan yang masih dapat diamatinya:

- `session.long_running`: pekerjaan tersemat aktif, panggilan model, atau panggilan alat
  masih menunjukkan progres. Panggilan model senyap yang memiliki pemilik juga dilaporkan sebagai berjalan lama sebelum ambang pembatalan bawaan, sehingga penyedia model yang lambat atau tidak melakukan streaming tidak tampak seperti sesi Gateway yang macet selama pembatalannya dapat diamati.
- `session.stalled`: terdapat pekerjaan aktif, tetapi proses aktif belum melaporkan
  progres terbaru. Panggilan model yang memiliki pemilik beralih dari `session.long_running` menjadi
  `session.stalled` pada atau setelah ambang pembatalan bawaan; aktivitas
  model/alat kedaluwarsa tanpa pemilik tidak diperlakukan sebagai pekerjaan berjalan lama yang tidak berbahaya.
  Proses tersemat yang macet pada awalnya tetap hanya diamati, lalu dibatalkan dan dikuras setelah
  ambang pembatalan tercapai tanpa progres agar giliran yang mengantre di belakang jalur tersebut dapat dilanjutkan.
- `session.stuck`: pembukuan sesi kedaluwarsa tanpa pekerjaan aktif, atau sesi
  antrean yang menganggur dengan aktivitas model/alat kedaluwarsa tanpa pemilik. Hal ini segera membebaskan
  jalur sesi yang terdampak setelah gerbang pemulihan berhasil dilewati.

Pemulihan memancarkan peristiwa `session.recovery.requested` dan
`session.recovery.completed` yang terstruktur. Status sesi diagnostik ditandai menganggur
hanya setelah hasil pemulihan yang mengubah keadaan (`aborted` atau `released`) dan hanya jika
generasi pemrosesan yang sama masih berlaku.

Hanya `session.stuck` yang memancarkan penghitung `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms`, dan span `openclaw.session.stuck`.
Diagnostik `session.stuck` yang berulang menerapkan backoff selama sesi tetap
tidak berubah, sehingga dasbor sebaiknya memberikan peringatan atas peningkatan berkelanjutan, bukan
setiap tick Heartbeat. Untuk opsi konfigurasi dan nilai default, lihat
[Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics).

Peringatan keaktifan juga memancarkan:

- `openclaw.liveness.warning` (penghitung, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, atribut: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, atribut: `openclaw.liveness.reason`)

### Siklus hidup harness

- `openclaw.harness.duration_ms` (histogram, atribut: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` saat terjadi kesalahan)

### Eksekusi alat dan deteksi perulangan

- `openclaw.tool.execution.duration_ms` (histogram, atribut: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, serta `openclaw.errorCategory` saat terjadi kesalahan)
- `openclaw.tool.execution.blocked` (penghitung, atribut: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (penghitung, atribut: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` opsional; dipancarkan ketika perulangan panggilan alat yang repetitif terdeteksi)

### Exec

- `openclaw.exec.duration_ms` (histogram, atribut: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internal diagnostik (memori, payload, kesehatan pengekspor)

- `openclaw.payload.large` (penghitung, atribut: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, atribut: sama seperti `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (histogram, tanpa atribut; sampel memori proses)
- `openclaw.memory.pressure` (penghitung, atribut: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (penghitung, atribut: `openclaw.diagnostic.async_queue.drop_class`; penghapusan akibat tekanan balik antrean diagnostik internal)
- `openclaw.telemetry.exporter.events` (penghitung, atribut: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` opsional, `openclaw.errorCategory` opsional; telemetri mandiri siklus hidup/kegagalan pengekspor)

## Span yang diekspor

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` secara default, atau `gen_ai.provider.name` ketika konvensi semantik GenAI terbaru diaktifkan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` secara default, atau `gen_ai.provider.name` ketika konvensi semantik GenAI terbaru diaktifkan
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit` (`request` atau `turn`)
  - `openclaw.errorCategory`, `error.type`, dan `openclaw.failureKind` opsional saat terjadi kesalahan
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (hanya ukuran komponen yang aman, tanpa teks prompt)
  - `openclaw.model_call.usage.*` dan `gen_ai.usage.*` ketika hasil memuat penggunaan untuk permintaan tersebut atau giliran agregat
  - Peristiwa span `openclaw.provider.request` dengan atribut `openclaw.upstreamRequestIdHash` (terbatas, berbasis hash) ketika hasil penyedia upstream mengekspos id permintaan; id mentah tidak pernah diekspor
  - Dengan `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, span permintaan menggunakan nama span inferensi GenAI terbaru `{gen_ai.operation.name} {gen_ai.request.model}`. Span giliran menggunakan `invoke_agent` karena OpenClaw tidak mengklaim nama agen native dari batas CLI yang tidak transparan. Keduanya menggunakan jenis span `CLIENT`, bukan `openclaw.model.call`.
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
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` opsional (tanpa pesan perulangan, parameter, atau output alat)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms` opsional

Ketika pengambilan konten diaktifkan secara eksplisit, span model dan alat juga dapat
menyertakan atribut `openclaw.content.*` yang terbatas dan disunting untuk kelas
konten tertentu yang Anda pilih.

## Katalog peristiwa diagnostik

Peristiwa di bawah ini mendukung metrik dan span di atas atau tersedia untuk langganan
Plugin secara langsung. `run.progress` dan `run.execution_phase` merupakan sinyal siklus hidup
khusus langsung; Plugin diagnostics-otel tidak mengekspornya sebagai
sinyal OTLP mandiri. Jenis peristiwa dan nilai `run.execution_phase.phase`
bersifat aditif. Konsumen TypeScript sebaiknya mempertahankan cabang default alih-alih menganggap
salah satu union akan selalu mencakup semua kemungkinan secara permanen.

**Penggunaan model**

- `model.usage` - token, biaya, durasi, konteks, penyedia/model/saluran,
  id sesi. `usage` merupakan penghitungan penyedia/giliran untuk biaya dan telemetri;
  `context.used` merupakan snapshot prompt/konteks saat ini dan dapat lebih rendah daripada
  `usage.total` penyedia ketika input yang di-cache atau panggilan perulangan alat terlibat.

**Alur pesan**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Antrean dan sesi**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `run.execution_phase` (milestone startup runner tersemat yang bersifat publik dan berkorelasi dengan sesi)
- `diagnostic.heartbeat` (penghitung agregat: Webhook/antrean/sesi)

**Siklus hidup harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  siklus hidup per proses untuk harness agen. Mencakup `harnessId`, `pluginId` opsional,
  penyedia/model/saluran, dan id proses. Penyelesaian menambahkan
  `durationMs`, `outcome`, `resultClassification` opsional, `yieldDetected`,
  dan jumlah `itemLifecycle`. Kesalahan menambahkan `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, dan
  `cleanupFailed` opsional.

**Exec**

- `exec.process.completed` - hasil terminal, durasi, target, mode, kode
  keluar, dan jenis kegagalan. Teks perintah dan direktori kerja tidak
  disertakan.
- `exec.approval.followup_suppressed` - tindak lanjut persetujuan kedaluwarsa dibuang
  setelah sesi terikat kembali. Mencakup `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` atau `gateway_preflight`),
  dan stempel waktu dispatcher. Kunci sesi, rute, dan teks perintah tidak
  disertakan.

## Tanpa pengekspor

Pertahankan ketersediaan peristiwa diagnostik bagi plugin atau tujuan khusus tanpa menjalankan
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Untuk keluaran debug yang ditargetkan tanpa menaikkan `logging.level`, gunakan
flag diagnostik. Flag tidak membedakan huruf besar dan kecil serta mendukung karakter pengganti (`telegram.*` atau
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

Keluaran flag masuk ke berkas log standar (`logging.file`) dan tetap
disunting oleh `logging.redactSensitive`. Panduan lengkap:
[Flag diagnostik](/id/diagnostics/flags).

## Menonaktifkan

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Atau jangan sertakan `diagnostics-otel` dalam `plugins.allow`, atau jalankan
`openclaw plugins disable diagnostics-otel`.

## Terkait

- [Pencatatan log](/id/logging) - log berkas, keluaran konsol, pemantauan CLI, dan tab Log UI Kontrol
- [Internal pencatatan log Gateway](/id/gateway/logging) - gaya log WS, awalan subsistem, dan penangkapan konsol
- [Flag diagnostik](/id/diagnostics/flags) - flag log debug yang ditargetkan
- [Ekspor diagnostik](/id/gateway/diagnostics) - alat bundel dukungan operator (terpisah dari ekspor OTEL)
- [Referensi konfigurasi](/id/gateway/configuration-reference#diagnostics) - referensi lengkap bidang `diagnostics.*`
