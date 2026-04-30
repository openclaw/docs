---
read_when:
    - คุณต้องการส่งข้อมูลการใช้งานโมเดลของ OpenClaw, โฟลว์ข้อความ หรือเมตริกเซสชันไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อเทรซ เมตริก หรือบันทึกเข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่น
    - คุณจำเป็นต้องใช้ชื่อเมตริก ชื่อ span หรือรูปแบบแอตทริบิวต์ที่แน่นอน เพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry ใดก็ได้ผ่าน Plugin diagnostics-otel (OTLP/HTTP)
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-04-30T09:54:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9d06589d281223ebb57e76f6f19441d30c138b9f7b0636198ab7bae5fad3c8a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกการวินิจฉัยผ่าน Plugin `diagnostics-otel` ที่มาพร้อมชุด
โดยใช้ **OTLP/HTTP (protobuf)** ตัวรวบรวมหรือแบ็กเอนด์ใดก็ตามที่รับ OTLP/HTTP
จะทำงานได้โดยไม่ต้องแก้โค้ด สำหรับบันทึกไฟล์ในเครื่องและวิธีอ่าน โปรดดู
[การบันทึก](/th/logging)

## การทำงานร่วมกัน

- **เหตุการณ์การวินิจฉัย** คือเรกคอร์ดแบบมีโครงสร้างภายในกระบวนการที่ปล่อยโดย
  Gateway และ Plugin ที่มาพร้อมชุดสำหรับการรันโมเดล โฟลว์ข้อความ เซสชัน คิว
  และการ exec
- **Plugin `diagnostics-otel`** สมัครรับเหตุการณ์เหล่านั้นและส่งออกเป็น
  OpenTelemetry **เมตริก**, **เทรซ**, และ **ล็อก** ผ่าน OTLP/HTTP
- **การเรียกผู้ให้บริการ** จะได้รับส่วนหัว W3C `traceparent` จากบริบทสแปนการเรียกโมเดลที่เชื่อถือได้ของ OpenClaw
  เมื่อทรานสปอร์ตของผู้ให้บริการรับส่วนหัวแบบกำหนดเอง บริบทเทรซที่ Plugin ปล่อยออกมาจะไม่ถูกเผยแพร่ต่อ
- ตัวส่งออกจะแนบตัวเองเฉพาะเมื่อทั้งพื้นผิวการวินิจฉัยและ Plugin
  เปิดใช้งานอยู่ ดังนั้นต้นทุนภายในกระบวนการจึงแทบเป็นศูนย์โดยค่าเริ่มต้น

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

คุณยังสามารถเปิดใช้งาน Plugin จาก CLI ได้ด้วย:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
ขณะนี้ `protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น `grpc` จะถูกละเว้น
</Note>

## สัญญาณที่ส่งออก

| สัญญาณ      | สิ่งที่อยู่ในนั้น                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **เมตริก** | ตัวนับและฮิสโตแกรมสำหรับการใช้โทเค็น ค่าใช้จ่าย ระยะเวลาการรัน โฟลว์ข้อความ เลนคิว สถานะเซสชัน exec และแรงกดดันหน่วยความจำ          |
| **เทรซ**  | สแปนสำหรับการใช้โมเดล การเรียกโมเดล วงจรชีวิตของฮาร์เนส การเรียกใช้เครื่องมือ exec การประมวลผล Webhook/ข้อความ การประกอบบริบท และลูปเครื่องมือ |
| **ล็อก**    | เรกคอร์ด `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP เมื่อเปิดใช้งาน `diagnostics.otel.logs`                                              |

สลับ `traces`, `metrics`, และ `logs` แยกกันได้ ทั้งสามค่าเปิดโดยค่าเริ่มต้น
เมื่อ `diagnostics.otel.enabled` เป็นจริง

## อ้างอิงการกำหนดค่า

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | การแทนที่ปลายทางเฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์กำหนดค่า `diagnostics.otel.*Endpoint` ที่ตรงกัน ค่ากำหนดเฉพาะสัญญาณชนะ env เฉพาะสัญญาณ ซึ่งชนะปลายทางร่วม                                     |
| `OTEL_SERVICE_NAME`                                                                                               | แทนที่ `diagnostics.otel.serviceName`                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | แทนที่โปรโตคอลบนสายสื่อสาร (วันนี้รองรับเฉพาะ `http/protobuf`)                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งเป็น `gen_ai_latest_experimental` เพื่อปล่อยแอตทริบิวต์สแปน GenAI รุ่นทดลองล่าสุด (`gen_ai.provider.name`) แทน `gen_ai.system` แบบเดิม เมตริก GenAI จะใช้แอตทริบิวต์เชิงความหมายแบบจำกัดและมีคาร์ดินาลิตีต่ำเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งเป็น `1` เมื่อพรีโหลดหรือกระบวนการโฮสต์อื่นได้ลงทะเบียน SDK OpenTelemetry แบบโกลบอลไว้แล้ว จากนั้น Plugin จะข้ามวงจรชีวิต NodeSDK ของตัวเอง แต่ยังคงต่อสายตัวรับฟังการวินิจฉัยและเคารพ `traces`/`metrics`/`logs`                |

## ความเป็นส่วนตัวและการจับเนื้อหา

เนื้อหาดิบของโมเดล/เครื่องมือจะ **ไม่** ถูกส่งออกโดยค่าเริ่มต้น สแปนพา
ตัวระบุแบบจำกัด (ช่องทาง ผู้ให้บริการ โมเดล หมวดหมู่ข้อผิดพลาด id คำขอแบบแฮชเท่านั้น)
และไม่รวมข้อความ prompt ข้อความตอบกลับ อินพุตเครื่องมือ เอาต์พุตเครื่องมือ หรือ
คีย์เซสชัน

คำขอโมเดลขาออกอาจมีส่วนหัว W3C `traceparent` ส่วนหัวนั้น
สร้างจากบริบทเทรซการวินิจฉัยที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่ใช้งานอยู่เท่านั้น
ส่วนหัว `traceparent` ที่ผู้เรียกส่งมาเดิมจะถูกแทนที่ ดังนั้น Plugin หรือ
ตัวเลือกผู้ให้บริการแบบกำหนดเองจึงไม่สามารถปลอมแปลงเชื้อสายเทรซข้ามบริการได้

ตั้ง `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อคอลเลกเตอร์และ
นโยบายการเก็บรักษาของคุณได้รับอนุมัติสำหรับข้อความ prompt, response, tool หรือ system-prompt
คีย์ย่อยแต่ละคีย์ต้องเลือกเปิดแยกกัน:

- `inputMessages` — เนื้อหา prompt ของผู้ใช้
- `outputMessages` — เนื้อหาคำตอบของโมเดล
- `toolInputs` — เพย์โหลดอาร์กิวเมนต์ของเครื่องมือ
- `toolOutputs` — เพย์โหลดผลลัพธ์ของเครื่องมือ
- `systemPrompt` — prompt ระบบ/ผู้พัฒนาที่ประกอบแล้ว

เมื่อเปิดใช้งานคีย์ย่อยใดก็ตาม สแปนโมเดลและเครื่องมือจะได้รับแอตทริบิวต์
`openclaw.content.*` แบบจำกัดและลบข้อมูลอ่อนไหวสำหรับคลาสนั้นเท่านั้น

## การสุ่มตัวอย่างและการฟลัช

- **เทรซ:** `diagnostics.otel.sampleRate` (เฉพาะสแปนราก, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด)
- **เมตริก:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`)
- **ล็อก:** ล็อก OTLP เคารพ `logging.level` (ระดับล็อกไฟล์) โดยใช้เส้นทางการลบข้อมูลอ่อนไหวของ log-record การวินิจฉัย ไม่ใช่การจัดรูปแบบคอนโซล การติดตั้งที่มีปริมาณสูงควรเลือกใช้การสุ่มตัวอย่าง/การกรองของคอลเลกเตอร์ OTLP แทนการสุ่มตัวอย่างในเครื่อง
- **การเชื่อมโยงล็อกไฟล์:** ล็อกไฟล์ JSONL มี `traceId`,
  `spanId`, `parentSpanId`, และ `traceFlags` ระดับบนสุดเมื่อการเรียกล็อกพาบริบทเทรซการวินิจฉัยที่ถูกต้อง
  ซึ่งช่วยให้ตัวประมวลผลล็อกเชื่อมบรรทัดล็อกในเครื่องกับสแปนที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP ของ Gateway และเฟรม WebSocket จะสร้าง
  ขอบเขตเทรซคำขอภายใน ล็อกและเหตุการณ์การวินิจฉัยภายในขอบเขตนั้น
  จะสืบทอดเทรซคำขอโดยค่าเริ่มต้น ขณะที่สแปนการรันเอเจนต์และการเรียกโมเดล
  จะถูกสร้างเป็นลูก เพื่อให้ส่วนหัว `traceparent` ของผู้ให้บริการอยู่บนเทรซเดียวกัน

## เมตริกที่ส่งออก

### การใช้โมเดล

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconds, GenAI semantic-conventions metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` and `openclaw.failureKind` on classified errors)
- `openclaw.model_call.request_bytes` (histogram, ขนาดไบต์ UTF-8 ของเพย์โหลดคำขอโมเดลสุดท้าย; ไม่มีเนื้อหาเพย์โหลดดิบ)
- `openclaw.model_call.response_bytes` (histogram, ขนาดไบต์ UTF-8 ของเหตุการณ์คำตอบโมเดลแบบสตรีม; ไม่มีเนื้อหาคำตอบดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, เวลาที่ผ่านไปก่อนเหตุการณ์คำตอบแบบสตรีมแรก)

### โฟลว์ข้อความ

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

### วงจรชีวิตของฮาร์เนส

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อมีข้อผิดพลาด)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### ภายในของการวินิจฉัย (หน่วยความจำและลูปเครื่องมือ)

- `openclaw.memory.heap_used_bytes` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ฮิสโตแกรม)
- `openclaw.memory.pressure` (ตัวนับ, แอตทริบิวต์: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (ตัวนับ, แอตทริบิวต์: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.toolName`, `openclaw.outcome`)

## span ที่ส่งออก

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อตกลงเชิงความหมาย GenAI รุ่นล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อตกลงเชิงความหมาย GenAI รุ่นล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` และ `openclaw.failureKind` ที่เป็นตัวเลือกเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (แฮชแบบจำกัดขอบเขตที่อิง SHA ของ ID คำขอจากผู้ให้บริการ upstream; ไม่มีการส่งออก ID ดิบ)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - เมื่อเสร็จสิ้น: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - เมื่อเกิดข้อผิดพลาด: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` ที่เป็นตัวเลือก
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (ไม่มีเนื้อหาพรอมต์ ประวัติ การตอบกลับ หรือคีย์เซสชัน)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ไม่มีข้อความลูป พารามิเตอร์ หรือเอาต์พุตเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

เมื่อเปิดใช้การจับเนื้อหาอย่างชัดเจน span ของโมเดลและเครื่องมือยังสามารถ
รวมแอตทริบิวต์ `openclaw.content.*` ที่จำกัดขอบเขตและปกปิดข้อมูลแล้วสำหรับ
คลาสเนื้อหาเฉพาะที่คุณเลือกใช้ได้ด้วย

## แค็ตตาล็อกเหตุการณ์การวินิจฉัย

เหตุการณ์ด้านล่างรองรับเมตริกและ span ข้างต้น Plugin ยังสามารถสมัครรับ
เหตุการณ์เหล่านี้ได้โดยตรงโดยไม่ต้องส่งออก OTLP

**การใช้งานโมเดล**

- `model.usage` — โทเค็น ต้นทุน ระยะเวลา บริบท ผู้ให้บริการ/โมเดล/ช่องทาง
  ID เซสชัน `usage` คือการคิดบัญชีระดับผู้ให้บริการ/รอบสนทนาสำหรับต้นทุนและ telemetry;
  `context.used` คือสแนปช็อตพรอมต์/บริบทปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการเมื่อมีอินพุตที่แคชไว้หรือมีการเรียก tool-loop เข้ามาเกี่ยวข้อง

**โฟลว์ข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (ตัวนับแบบรวม: webhooks/queue/session)

**วงจรชีวิตของ harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  วงจรชีวิตต่อการรันสำหรับ agent harness รวม `harnessId`, `pluginId` ที่เป็นตัวเลือก,
  ผู้ให้บริการ/โมเดล/ช่องทาง และ ID การรัน เมื่อเสร็จสิ้นจะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ที่เป็นตัวเลือก, `yieldDetected`,
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, และ
  `cleanupFailed` ที่เป็นตัวเลือก

**Exec**

- `exec.process.completed` — ผลลัพธ์ปลายทาง ระยะเวลา เป้าหมาย โหมด exit
  code และ failure kind ไม่มีการรวมข้อความคำสั่งและไดเรกทอรีทำงาน

## เมื่อไม่มี exporter

คุณสามารถคงเหตุการณ์การวินิจฉัยให้ Plugin หรือ sink แบบกำหนดเองใช้ได้โดยไม่ต้อง
รัน `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุต debug แบบเจาะจงโดยไม่เพิ่ม `logging.level` ให้ใช้แฟล็กการวินิจฉัย
แฟล็กไม่สนตัวพิมพ์เล็กใหญ่และรองรับไวลด์การ์ด (เช่น `telegram.*` หรือ
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

เอาต์พุตของแฟล็กจะไปยังไฟล์ log มาตรฐาน (`logging.file`) และยังคงถูก
ปกปิดข้อมูลโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[แฟล็กการวินิจฉัย](/th/diagnostics/flags)

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถไม่ใส่ `diagnostics-otel` ใน `plugins.allow` หรือรัน
`openclaw plugins disable diagnostics-otel` ได้

## ที่เกี่ยวข้อง

- [การบันทึก log](/th/logging) — log ไฟล์, เอาต์พุตคอนโซล, การ tail จาก CLI และแท็บ Logs ของ Control UI
- [รายละเอียดภายในของการบันทึก log ของ Gateway](/th/gateway/logging) — สไตล์ log ของ WS, prefix ของระบบย่อย และการจับคอนโซล
- [แฟล็กการวินิจฉัย](/th/diagnostics/flags) — แฟล็ก debug-log แบบเจาะจง
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) — เครื่องมือ support-bundle สำหรับผู้ปฏิบัติงาน (แยกจากการส่งออก OTEL)
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) — เอกสารอ้างอิงฟิลด์ `diagnostics.*` ฉบับเต็ม
