---
read_when:
    - คุณต้องการส่งข้อมูลการใช้งานโมเดลของ OpenClaw, การไหลของข้อความ หรือเมตริกเซสชันไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อเทรซ เมตริก หรือบันทึกเข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่น
    - คุณต้องมีชื่อเมตริก ชื่อสแปน หรือโครงสร้างแอตทริบิวต์ที่แน่นอนเพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry ใดก็ได้ผ่าน Plugin diagnostics-otel (OTLP/HTTP)
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T09:14:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d52e5072fcdb097a3dce36a13d9470cea8c169d2af49998cd727814013c411e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกข้อมูลวินิจฉัยผ่าน plugin ทางการ `diagnostics-otel`
โดยใช้ **OTLP/HTTP (protobuf)** ตัวเก็บรวบรวมหรือ backend ใดก็ตามที่รองรับ OTLP/HTTP
จะใช้งานได้โดยไม่ต้องแก้โค้ด สำหรับ log ไฟล์ในเครื่องและวิธีอ่าน โปรดดู
[การบันทึก](/th/logging).

## การทำงานร่วมกัน

- **เหตุการณ์วินิจฉัย** คือระเบียนในกระบวนการที่มีโครงสร้าง ซึ่ง Gateway
  และ plugin ที่มาพร้อมระบบส่งออกสำหรับการรันโมเดล, flow ของข้อความ, session, queue,
  และ exec.
- **plugin `diagnostics-otel`** สมัครรับเหตุการณ์เหล่านั้นและส่งออกเป็น
  OpenTelemetry **metric**, **trace**, และ **log** ผ่าน OTLP/HTTP.
- **การเรียก provider** จะได้รับ header W3C `traceparent` จาก context ของ span
  การเรียกโมเดลที่เชื่อถือได้ของ OpenClaw เมื่อ transport ของ provider รองรับ header
  แบบกำหนดเอง context ของ trace ที่ plugin ส่งออกจะไม่ถูกเผยแพร่ต่อ
- exporter จะเชื่อมต่อเฉพาะเมื่อเปิดทั้งพื้นผิว diagnostics และ plugin
  ดังนั้นค่าใช้จ่ายในกระบวนการจึงใกล้ศูนย์โดยค่าเริ่มต้น

## เริ่มใช้งานอย่างรวดเร็ว

สำหรับการติดตั้งแบบแพ็กเกจ ให้ติดตั้ง plugin ก่อน:

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

คุณยังสามารถเปิดใช้ plugin จาก CLI ได้ด้วย:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
ปัจจุบัน `protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น `grpc` จะถูกละเว้น
</Note>

## สัญญาณที่ส่งออก

| สัญญาณ      | สิ่งที่อยู่ในนั้น                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metric** | counter และ histogram สำหรับการใช้ token, cost, ระยะเวลาการรัน, flow ของข้อความ, queue lane, สถานะ session, exec, และแรงกดดันด้านหน่วยความจำ          |
| **Trace**  | span สำหรับการใช้โมเดล, การเรียกโมเดล, lifecycle ของ harness, การเรียกใช้ tool, exec, การประมวลผล webhook/ข้อความ, การประกอบ context, และ loop ของ tool |
| **Log**    | ระเบียน `logging.file` ที่มีโครงสร้างซึ่งส่งออกผ่าน OTLP เมื่อเปิดใช้ `diagnostics.otel.logs`                                              |

สลับเปิดปิด `traces`, `metrics`, และ `logs` ได้อย่างอิสระ ทั้งสามอย่างเปิดอยู่โดยค่าเริ่มต้น
เมื่อ `diagnostics.otel.enabled` เป็น true

## ข้อมูลอ้างอิงการกำหนดค่า

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

### ตัวแปรสภาพแวดล้อม

| ตัวแปร                                                                                                          | วัตถุประสงค์                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | แทนที่ `diagnostics.otel.endpoint` หากค่ามี `/v1/traces`, `/v1/metrics`, หรือ `/v1/logs` อยู่แล้ว จะใช้ค่านั้นตามเดิม                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | การแทนที่ endpoint เฉพาะสัญญาณ ซึ่งใช้เมื่อไม่ได้ตั้งค่า key config `diagnostics.otel.*Endpoint` ที่ตรงกัน config เฉพาะสัญญาณชนะ env เฉพาะสัญญาณ และ env เฉพาะสัญญาณชนะ endpoint ที่ใช้ร่วมกัน                                     |
| `OTEL_SERVICE_NAME`                                                                                               | แทนที่ `diagnostics.otel.serviceName`                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | แทนที่ wire protocol (ปัจจุบันยอมรับเฉพาะ `http/protobuf`)                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งเป็น `gen_ai_latest_experimental` เพื่อส่งออก attribute ของ span GenAI แบบทดลองล่าสุด (`gen_ai.provider.name`) แทน `gen_ai.system` แบบเดิม metric ของ GenAI จะใช้ semantic attribute ที่มี cardinality ต่ำและมีขอบเขตเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งเป็น `1` เมื่อ preload อื่นหรือ process host ได้ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น plugin จะข้าม lifecycle NodeSDK ของตัวเอง แต่ยังคงเชื่อม listener วินิจฉัยและเคารพ `traces`/`metrics`/`logs`                |

## ความเป็นส่วนตัวและการจับเนื้อหา

เนื้อหาดิบของโมเดล/tool จะ **ไม่** ถูกส่งออกโดยค่าเริ่มต้น span จะมี identifier
ที่มีขอบเขต (channel, provider, model, หมวดหมู่ error, request id แบบ hash-only)
และไม่รวมข้อความ prompt, ข้อความ response, input ของ tool, output ของ tool,
หรือ key ของ session

คำขอโมเดลขาออกอาจมี header W3C `traceparent` header นั้น
สร้างจาก context ของ trace วินิจฉัยที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่ใช้งานอยู่เท่านั้น
header `traceparent` ที่ผู้เรียกส่งมาอยู่แล้วจะถูกแทนที่ ดังนั้น plugin หรือ
ตัวเลือก provider แบบกำหนดเองจึงไม่สามารถปลอม ancestry ของ trace ข้ามบริการได้

ตั้งค่า `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อ collector และ
นโยบาย retention ของคุณได้รับอนุมัติสำหรับข้อความ prompt, response, tool, หรือ system-prompt
แล้วเท่านั้น subkey แต่ละรายการต้องเลือกเปิดใช้อย่างอิสระ:

- `inputMessages` - เนื้อหา prompt ของผู้ใช้
- `outputMessages` - เนื้อหา response ของโมเดล
- `toolInputs` - payload ของ argument ของ tool
- `toolOutputs` - payload ของผลลัพธ์จาก tool
- `systemPrompt` - prompt ของ system/developer ที่ประกอบแล้ว

เมื่อเปิดใช้ subkey ใดก็ตาม span ของโมเดลและ tool จะได้รับ attribute
`openclaw.content.*` ที่มีขอบเขตและถูก redact สำหรับคลาสนั้นเท่านั้น

## การ sampling และการ flush

- **Trace:** `diagnostics.otel.sampleRate` (เฉพาะ root-span, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด)
- **Metric:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`)
- **Log:** log OTLP เคารพ `logging.level` (ระดับ log ไฟล์) ใช้เส้นทาง redaction
  ของระเบียน log วินิจฉัย ไม่ใช่การจัดรูปแบบ console การติดตั้งที่มีปริมาณสูง
  ควรใช้ sampling/filtering ของ OTLP collector แทน local sampling
- **ความสัมพันธ์กับ file-log:** log ไฟล์ JSONL รวม `traceId`,
  `spanId`, `parentSpanId`, และ `traceFlags` ระดับบนสุดเมื่อการเรียก log มี
  context ของ trace วินิจฉัยที่ถูกต้อง ซึ่งช่วยให้ตัวประมวลผล log เชื่อมบรรทัด log ในเครื่องกับ
  span ที่ส่งออกได้
- **ความสัมพันธ์ของคำขอ:** คำขอ HTTP ของ Gateway และ frame ของ WebSocket จะสร้าง
  scope ของ trace คำขอภายใน log และเหตุการณ์วินิจฉัยภายใน scope นั้น
  จะรับ trace ของคำขอโดยค่าเริ่มต้น ขณะที่ span ของการรัน agent และการเรียกโมเดล
  จะถูกสร้างเป็น child เพื่อให้ header `traceparent` ของ provider อยู่บน trace เดียวกัน

## Metric ที่ส่งออก

### การใช้โมเดล

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metric ตาม semantic conventions ของ GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, วินาที, metric ตาม semantic conventions ของ GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` บน error ที่จัดประเภทแล้ว)
- `openclaw.model_call.request_bytes` (histogram, ขนาด byte UTF-8 ของ payload คำขอโมเดลสุดท้าย; ไม่มีเนื้อหา payload ดิบ)
- `openclaw.model_call.response_bytes` (histogram, ขนาด byte UTF-8 ของเหตุการณ์ response โมเดลแบบสตรีม; ไม่มีเนื้อหา response ดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, เวลาที่ผ่านไปก่อนเหตุการณ์ response แบบสตรีมแรก)

### Flow ของข้อความ

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Queue และ session

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` หรือ `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; ส่งออกเฉพาะสำหรับ bookkeeping ของ session ที่เก่าและไม่มีงานที่ active)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; ส่งออกเฉพาะสำหรับ bookkeeping ของ session ที่เก่าและไม่มีงานที่ active)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Telemetry ความมีชีวิตของ session

`diagnostics.stuckSessionWarnMs` คือเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับ diagnostics
ความมีชีวิตของ session session ที่เป็น `processing` จะไม่นับอายุเข้าหาเกณฑ์นี้
ขณะที่ OpenClaw สังเกตเห็นความคืบหน้าของ reply, tool, status, block, หรือ ACP runtime
การพิมพ์ keepalive จะไม่นับเป็นความคืบหน้า ดังนั้นโมเดลหรือ harness ที่เงียบ
ยังคงถูกตรวจพบได้

OpenClaw จัดประเภท session ตามงานที่ยังสังเกตเห็นได้:

- `session.long_running`: งานแบบฝังตัวที่ทำงานอยู่ การเรียกโมเดล หรือการเรียกเครื่องมือยังคงมีความคืบหน้าอยู่
- `session.stalled`: มีงานที่ทำงานอยู่ แต่รันที่ทำงานอยู่ไม่ได้รายงานความคืบหน้าล่าสุด รันแบบฝังตัวที่ชะงักจะคงเป็นแบบสังเกตการณ์เท่านั้นในตอนแรก จากนั้นจะ abort-drain หลังจาก `diagnostics.stuckSessionAbortMs` โดยไม่มีความคืบหน้า เพื่อให้เทิร์นที่เข้าคิวอยู่หลังเลนนั้นกลับมาทำงานต่อได้ เมื่อไม่ได้ตั้งค่าไว้ เกณฑ์การยกเลิกจะใช้ค่าเริ่มต้นเป็นช่วงเวลาขยายที่ปลอดภัยกว่าอย่างน้อย 10 นาที และ 5 เท่าของ `diagnostics.stuckSessionWarnMs`
- `session.stuck`: บัญชีสถานะเซสชันค้างเก่าที่ไม่มีงานที่ทำงานอยู่ การดำเนินการนี้จะปล่อยเลนเซสชันที่ได้รับผลกระทบทันที

การกู้คืนจะปล่อยเหตุการณ์ `session.recovery.requested` และ
`session.recovery.completed` แบบมีโครงสร้าง สถานะเซสชันสำหรับการวินิจฉัยจะถูกทำเครื่องหมายว่าว่าง
เฉพาะหลังผลลัพธ์การกู้คืนที่เปลี่ยนแปลงสถานะ (`aborted` หรือ `released`) และเฉพาะเมื่อ
processing generation เดิมยังเป็นปัจจุบันอยู่เท่านั้น

เฉพาะ `session.stuck` เท่านั้นที่ปล่อยตัวนับ `openclaw.session.stuck`,
ฮิสโตแกรม `openclaw.session.stuck_age_ms` และ span `openclaw.session.stuck`
การวินิจฉัย `session.stuck` ซ้ำ ๆ จะถอยระยะขณะที่เซสชันยังไม่เปลี่ยนแปลง
ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นต่อเนื่อง แทนที่จะแจ้งทุก
Heartbeat tick สำหรับปุ่มปรับแต่งค่า config และค่าเริ่มต้น โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics)

### วงจรชีวิตของ harness

- `openclaw.harness.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อเกิดข้อผิดพลาด)

### Exec

- `openclaw.exec.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### ภายในระบบการวินิจฉัย (หน่วยความจำและ tool loop)

- `openclaw.memory.heap_used_bytes` (ฮิสโตแกรม, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ฮิสโตแกรม)
- `openclaw.memory.pressure` (ตัวนับ, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (ตัวนับ, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Span ที่ส่งออก

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` ตามค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ GenAI semantic conventions ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` ตามค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ GenAI semantic conventions ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` และ `openclaw.failureKind` ที่ไม่บังคับเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (แฮชแบบมีขอบเขตที่อิง SHA ของ id คำขอของผู้ให้บริการต้นทาง; จะไม่ส่งออก id ดิบ)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - เมื่อเสร็จสิ้น: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - เมื่อเกิดข้อผิดพลาด: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` ที่ไม่บังคับ
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (ไม่มี prompt, history, response หรือเนื้อหา session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ไม่มีข้อความ loop, params หรือเอาต์พุตของเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

เมื่อเปิดใช้การจับเนื้อหาอย่างชัดเจน span ของโมเดลและเครื่องมือยังสามารถ
รวมแอตทริบิวต์ `openclaw.content.*` แบบมีขอบเขตและถูกปกปิดข้อมูลสำหรับ
คลาสเนื้อหาเฉพาะที่คุณเลือกใช้ได้ด้วย

## แค็ตตาล็อกเหตุการณ์การวินิจฉัย

เหตุการณ์ด้านล่างรองรับ metrics และ spans ข้างต้น Plugin ยังสามารถสมัครรับ
เหตุการณ์เหล่านี้โดยตรงได้โดยไม่ต้องส่งออก OTLP

**การใช้งานโมเดล**

- `model.usage` - โทเค็น ค่าใช้จ่าย ระยะเวลา context ผู้ให้บริการ/โมเดล/channel
  id เซสชัน `usage` คือบัญชีระดับผู้ให้บริการ/เทิร์นสำหรับค่าใช้จ่ายและ telemetry;
  `context.used` คือสแนปช็อต prompt/context ปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการเมื่อมี cached input หรือการเรียก tool-loop เข้ามาเกี่ยวข้อง

**โฟลว์ข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (ตัวนับรวม: webhooks/queue/session)

**วงจรชีวิตของ harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  วงจรชีวิตต่อรันสำหรับ agent harness รวม `harnessId`, `pluginId` ที่ไม่บังคับ
  ผู้ให้บริการ/โมเดล/channel และ run id เมื่อเสร็จสิ้นจะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ที่ไม่บังคับ, `yieldDetected`,
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` ที่ไม่บังคับ

**Exec**

- `exec.process.completed` - ผลลัพธ์ปลายทาง ระยะเวลา เป้าหมาย โหมด exit
  code และชนิดความล้มเหลว จะไม่รวมข้อความคำสั่งและไดเรกทอรีทำงาน

## เมื่อไม่มี exporter

คุณสามารถทำให้เหตุการณ์การวินิจฉัยพร้อมใช้งานสำหรับ Plugin หรือ sink แบบกำหนดเองได้โดยไม่ต้อง
รัน `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุตดีบักแบบเจาะจงโดยไม่เพิ่ม `logging.level` ให้ใช้ flags
การวินิจฉัย Flags ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่และรองรับ wildcard (เช่น `telegram.*` หรือ
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

หรือเป็น env override แบบใช้ครั้งเดียว:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

เอาต์พุตของ flag จะไปยังไฟล์ล็อกมาตรฐาน (`logging.file`) และยังคง
ถูกปกปิดข้อมูลโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[Diagnostics flags](/th/diagnostics/flags)

## ปิดใช้

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถไม่ใส่ `diagnostics-otel` ไว้ใน `plugins.allow` หรือรัน
`openclaw plugins disable diagnostics-otel`

## ที่เกี่ยวข้อง

- [Logging](/th/logging) - ล็อกไฟล์ เอาต์พุตคอนโซล การ tail ผ่าน CLI และแท็บ Logs ของ Control UI
- [รายละเอียดภายในของ Gateway logging](/th/gateway/logging) - รูปแบบล็อก WS, prefix ของ subsystem และการจับคอนโซล
- [Diagnostics flags](/th/diagnostics/flags) - flags สำหรับ debug-log แบบเจาะจง
- [Diagnostics export](/th/gateway/diagnostics) - เครื่องมือ support-bundle สำหรับผู้ปฏิบัติงาน (แยกจากการส่งออก OTEL)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) - ข้อมูลอ้างอิงฟิลด์ `diagnostics.*` ฉบับเต็ม
