---
read_when:
    - คุณต้องการส่งการใช้งานโมเดล การไหลของข้อความ หรือเมตริกของเซสชันของ OpenClaw ไปยัง OpenTelemetry collector
    - คุณกำลังเชื่อม traces, metrics หรือ logs เข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่น ๆ
    - คุณต้องการชื่อเมตริก ชื่อ span หรือรูปแบบแอตทริบิวต์ที่แน่นอนเพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลวินิจฉัยของ OpenClaw ไปยัง OpenTelemetry collector ใดก็ได้ผ่าน Plugin diagnostics-otel (OTLP/HTTP)
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T11:30:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw ส่งออกข้อมูลวินิจฉัยผ่าน Plugin `diagnostics-otel` ที่รวมมาให้
โดยใช้ **OTLP/HTTP (protobuf)** collector หรือแบ็กเอนด์ใด ๆ ที่รองรับ OTLP/HTTP
สามารถใช้งานได้โดยไม่ต้องแก้โค้ด สำหรับไฟล์ล็อกในเครื่องและวิธีอ่าน ดู
[การบันทึกล็อก](/th/logging)

## วิธีที่ส่วนต่าง ๆ ทำงานร่วมกัน

- **เหตุการณ์วินิจฉัย** คือเรกคอร์ดเชิงโครงสร้างภายในโปรเซสที่ถูกปล่อยออกโดย
  Gateway และ Plugin ที่รวมมาให้ สำหรับ model run, การไหลของข้อความ, sessions, queues
  และ exec
- **Plugin `diagnostics-otel`** จะ subscribe กับเหตุการณ์เหล่านั้นและส่งออกเป็น
  OpenTelemetry **metrics**, **traces** และ **logs** ผ่าน OTLP/HTTP
- **การเรียก provider** จะได้รับ header `traceparent` แบบ W3C จาก
  บริบท span ของ model-call ที่เชื่อถือได้ของ OpenClaw เมื่อ transport ของ provider รองรับ custom
  headers บริบท trace ที่ปล่อยออกโดย Plugin จะไม่ถูกส่งต่อ
- Exporter จะถูกแนบก็ต่อเมื่อเปิดใช้ทั้งพื้นผิววินิจฉัยและ Plugin เท่านั้น
  ดังนั้นต้นทุนภายในโปรเซสจึงเกือบเป็นศูนย์ตามค่าเริ่มต้น

## เริ่มต้นอย่างรวดเร็ว

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

คุณยังสามารถเปิดใช้ Plugin จาก CLI ได้:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
ขณะนี้ `protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น `grpc` จะถูกละเลย
</Note>

## สัญญาณที่ถูกส่งออก

| สัญญาณ      | สิ่งที่บรรจุอยู่ภายใน                                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Counter และ histogram สำหรับการใช้โทเค็น, ค่าใช้จ่าย, ระยะเวลาการรัน, การไหลของข้อความ, queue lanes, สถานะเซสชัน, exec และแรงกดดันด้านหน่วยความจำ |
| **Traces**  | Span สำหรับ model usage, model calls, วงจรชีวิตของ harness, การรันเครื่องมือ, exec, การประมวลผล webhook/message, การประกอบบริบท และ tool loops |
| **Logs**    | เรกคอร์ด `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP เมื่อเปิดใช้ `diagnostics.otel.logs`                                             |

คุณสามารถสลับ `traces`, `metrics` และ `logs` ได้อย่างอิสระ ทั้งสามอย่างมีค่าเริ่มต้นเป็นเปิด
เมื่อ `diagnostics.otel.enabled` เป็น true

## เอกสารอ้างอิงการกำหนดค่า

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
      protocol: "http/protobuf", // grpc จะถูกละเลย
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // ตัวสุ่มตัวอย่าง root-span, 0.0..1.0
      flushIntervalMs: 60000, // ช่วงเวลาส่งออก metrics (ขั้นต่ำ 1000ms)
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

| ตัวแปร                                                                                                           | วัตถุประสงค์                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                    | ใช้แทน `diagnostics.otel.endpoint` หากค่ามี `/v1/traces`, `/v1/metrics` หรือ `/v1/logs` อยู่แล้ว จะใช้ค่านั้นตามเดิม                                                                                                                   |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | ใช้แทนปลายทางเฉพาะสัญญาณ เมื่อคีย์ config `diagnostics.otel.*Endpoint` ที่ตรงกันไม่ได้ถูกตั้งไว้ config เฉพาะสัญญาณจะมีสิทธิ์เหนือกว่า env เฉพาะสัญญาณ ซึ่งจะมีสิทธิ์เหนือกว่าปลายทางรวม                                                |
| `OTEL_SERVICE_NAME`                                                                                              | ใช้แทน `diagnostics.otel.serviceName`                                                                                                                                                                                                      |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                    | ใช้แทน wire protocol (ปัจจุบันยอมรับเฉพาะ `http/protobuf`)                                                                                                                                                                                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                  | ตั้งค่าเป็น `gen_ai_latest_experimental` เพื่อปล่อยแอตทริบิวต์ span ของ GenAI แบบทดลองล่าสุด (`gen_ai.provider.name`) แทน `gen_ai.system` แบบเดิม เมตริกของ GenAI จะใช้ semantic attribute ที่มี cardinality ต่ำและมีขอบเขตจำกัดเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                        | ตั้งค่าเป็น `1` เมื่อ preload หรือโฮสต์โปรเซสอื่นได้ลงทะเบียน OpenTelemetry SDK แบบ global ไว้แล้ว Plugin จะข้ามวงจรชีวิต NodeSDK ของตัวเอง แต่ยังคงเชื่อม listener ของการวินิจฉัยและเคารพ `traces`/`metrics`/`logs`                |

## ความเป็นส่วนตัวและการเก็บเนื้อหา

เนื้อหา model/tool แบบดิบจะ **ไม่** ถูกส่งออกตามค่าเริ่มต้น Span จะมีตัวระบุที่มีขอบเขตจำกัด
(channel, provider, model, หมวดหมู่ข้อผิดพลาด, request id แบบแฮชเท่านั้น)
และจะไม่มีทั้งข้อความ prompt, ข้อความคำตอบ, อินพุตของเครื่องมือ, เอาต์พุตของเครื่องมือ หรือ
session key

คำขอ model ขาออกอาจมี header `traceparent` แบบ W3C header นี้
จะถูกสร้างจากบริบท trace วินิจฉัยที่เป็นของ OpenClaw เท่านั้นสำหรับ model
call ที่กำลังทำงาน header `traceparent` ที่ผู้เรียกส่งมาอยู่แล้วจะถูกแทนที่ ดังนั้น Plugin หรือ
ตัวเลือก provider แบบกำหนดเองจึงไม่สามารถปลอม ancestry ของ trace ข้ามบริการได้

ตั้งค่า `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อ collector และ
นโยบายการเก็บรักษาของคุณได้รับการอนุมัติสำหรับข้อความ prompt, response, tool หรือ system-prompt
แต่ละคีย์ย่อยเป็นแบบเลือกเปิดใช้อย่างอิสระ:

- `inputMessages` — เนื้อหา prompt ของผู้ใช้
- `outputMessages` — เนื้อหาคำตอบของโมเดล
- `toolInputs` — payload อาร์กิวเมนต์ของเครื่องมือ
- `toolOutputs` — payload ผลลัพธ์ของเครื่องมือ
- `systemPrompt` — prompt system/developer ที่ประกอบแล้ว

เมื่อมีการเปิดใช้คีย์ย่อยใด ๆ span ของ model และ tool จะได้รับแอตทริบิวต์
`openclaw.content.*` ที่มีขอบเขตจำกัดและผ่านการปกปิดข้อมูลแล้วสำหรับคลาสนั้นเท่านั้น

## การสุ่มตัวอย่างและการ flush

- **Traces:** `diagnostics.otel.sampleRate` (เฉพาะ root-span, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด)
- **Metrics:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`)
- **Logs:** OTLP logs เคารพ `logging.level` (ระดับของไฟล์ล็อก) การปกปิดข้อมูลของคอนโซล
  ไม่มีผลกับ OTLP logs การติดตั้งที่มีปริมาณสูงควร
  เลือกใช้ sampling/filtering ที่ OTLP collector มากกว่าการสุ่มตัวอย่างในเครื่อง

## เมตริกที่ถูกส่งออก

### การใช้งานโมเดล

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, เมตริก semantic-conventions ของ GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, วินาที, เมตริก semantic-conventions ของ GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` แบบไม่บังคับ)

### การไหลของข้อความ

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### คิวและเซสชัน

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` หรือ `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### วงจรชีวิตของ Harness

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อเกิดข้อผิดพลาด)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### ส่วนภายในของการวินิจฉัย (หน่วยความจำและ tool loop)

- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Span ที่ถูกส่งออก

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (`input`/`output`/`cache_read`/`cache_write`/`total`)
  - `gen_ai.system` ตามค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อมีการเลือกใช้ GenAI semantic conventions เวอร์ชันล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` ตามค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อมีการเลือกใช้ GenAI semantic conventions เวอร์ชันล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (แฮชแบบมีขอบเขตโดยอิง SHA ของ request id จาก provider ต้นทาง; จะไม่ส่งออก id ดิบ)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - เมื่อเสร็จสมบูรณ์: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - เมื่อเกิดข้อผิดพลาด: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` แบบไม่บังคับ
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (ไม่มีเนื้อหา prompt, history, response หรือ session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ไม่มีข้อความของลูป, params หรือเอาต์พุตของเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

เมื่อมีการเปิดใช้การเก็บเนื้อหาอย่างชัดเจน span ของ model และ tool สามารถ
รวมแอตทริบิวต์ `openclaw.content.*` แบบมีขอบเขตและผ่านการปกปิดข้อมูลแล้วสำหรับ
คลาสเนื้อหาเฉพาะที่คุณเลือกเปิดใช้ได้ด้วย

## แค็ตตาล็อกเหตุการณ์วินิจฉัย

เหตุการณ์ด้านล่างนี้เป็นพื้นฐานของเมตริกและ span ข้างต้น Plugin ยังสามารถ subscribe
ไปยังเหตุการณ์เหล่านี้โดยตรงได้โดยไม่ต้องส่งออก OTLP

**การใช้งานโมเดล**

- `model.usage` — โทเค็น ค่าใช้จ่าย ระยะเวลา บริบท provider/model/channel
  และ session ids `usage` คือการคำนวณตาม provider/turn สำหรับค่าใช้จ่ายและ telemetry;
  `context.used` คือ snapshot ของ prompt/context ปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของ provider เมื่อมี cached input หรือมีการเรียก tool-loop เข้ามาเกี่ยวข้อง

**การไหลของข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (ตัวนับแบบรวม: webhooks/queue/session)

**วงจรชีวิตของ Harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  วงจรชีวิตรายครั้งรันสำหรับ agent harness ประกอบด้วย `harnessId`, `pluginId`
  แบบไม่บังคับ, provider/model/channel และ run id เมื่อเสร็จสมบูรณ์จะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` แบบไม่บังคับ, `yieldDetected`
  และจำนวน `itemLifecycle` เมื่อเกิดข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` แบบไม่บังคับ

**Exec**

- `exec.process.completed` — ผลลัพธ์ปลายทาง ระยะเวลา เป้าหมาย โหมด exit
  code และชนิดของความล้มเหลว จะไม่รวมข้อความคำสั่งและ working directory

## โดยไม่ใช้ exporter

คุณสามารถคงเหตุการณ์วินิจฉัยไว้ให้ Plugin หรือ sink แบบกำหนดเองใช้งานได้โดยไม่ต้อง
รัน `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุตดีบักแบบเจาะจงโดยไม่ต้องยกระดับ `logging.level` ให้ใช้
แฟล็กวินิจฉัย แฟล็กไม่สนตัวพิมพ์ใหญ่เล็กและรองรับ wildcard (เช่น `telegram.*` หรือ
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

หรือใช้เป็นการแทนที่ผ่าน env แบบครั้งเดียว:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

เอาต์พุตของแฟล็กจะไปยังไฟล์ล็อกมาตรฐาน (`logging.file`) และยังคง
ถูกปกปิดข้อมูลโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[แฟล็กวินิจฉัย](/th/diagnostics/flags)

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถไม่ใส่ `diagnostics-otel` ไว้ใน `plugins.allow` หรือรัน
`openclaw plugins disable diagnostics-otel`

## ที่เกี่ยวข้อง

- [การบันทึกล็อก](/th/logging) — ไฟล์ล็อก เอาต์พุตคอนโซล การ tail ผ่าน CLI และแท็บ Logs ของ Control UI
- [ส่วนภายในของการบันทึกล็อกของ Gateway](/th/gateway/logging) — รูปแบบล็อก WS, prefix ของ subsystem และการดักจับคอนโซล
- [แฟล็กวินิจฉัย](/th/diagnostics/flags) — แฟล็กล็อกดีบักแบบเจาะจง
- [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics) — เครื่องมือ support-bundle สำหรับโอเปอเรเตอร์ (แยกจากการส่งออก OTEL)
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) — เอกสารอ้างอิงฟิลด์ `diagnostics.*` แบบเต็ม
