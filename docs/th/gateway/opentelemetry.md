---
read_when:
    - คุณต้องการส่งข้อมูลการใช้งานโมเดลของ OpenClaw, โฟลว์ข้อความ หรือเมตริกของเซสชันไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อเทรซ เมตริก หรือล็อกเข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่น
    - คุณต้องทราบชื่อเมตริก ชื่อสแปน หรือรูปแบบแอตทริบิวต์ที่แน่นอน เพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลการวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry ใด ๆ ผ่าน Plugin diagnostics-otel (OTLP/HTTP)
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-05-03T21:32:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8091aa633a3e10593681f94913a858587a5dc69d9947e0c0d4132f6e897b00b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกการวินิจฉัยผ่าน Plugin ทางการ `diagnostics-otel`
โดยใช้ **OTLP/HTTP (protobuf)** collector หรือ backend ใดก็ตามที่รับ OTLP/HTTP
จะทำงานได้โดยไม่ต้องเปลี่ยนโค้ด สำหรับล็อกไฟล์ภายในเครื่องและวิธีอ่าน โปรดดู
[การบันทึกล็อก](/th/logging)

## การทำงานร่วมกัน

- **เหตุการณ์การวินิจฉัย** คือเรคคอร์ดแบบมีโครงสร้างภายในโปรเซสที่ส่งออกโดย
  Gateway และ Plugin ที่บันเดิลมา สำหรับการรันโมเดล การไหลของข้อความ เซสชัน คิว
  และ exec
- **Plugin `diagnostics-otel`** สมัครรับเหตุการณ์เหล่านั้นและส่งออกเป็น
  OpenTelemetry **เมตริก**, **เทรซ** และ **ล็อก** ผ่าน OTLP/HTTP
- **การเรียก provider** จะได้รับ header W3C `traceparent` จากบริบท span ของการเรียกโมเดลที่ OpenClaw
  เชื่อถือ เมื่อ transport ของ provider รับ header แบบกำหนดเองได้
  บริบทเทรซที่ส่งออกโดย Plugin จะไม่ถูกเผยแพร่ต่อ
- exporter จะเชื่อมต่อเฉพาะเมื่อทั้งพื้นผิวการวินิจฉัยและ Plugin
  ถูกเปิดใช้งาน ดังนั้นค่าใช้จ่ายภายในโปรเซสจึงเกือบเป็นศูนย์โดยค่าเริ่มต้น

## เริ่มต้นอย่างรวดเร็ว

สำหรับการติดตั้งแบบแพ็กเกจ ให้ติดตั้ง Plugin ก่อน:

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

คุณยังสามารถเปิดใช้งาน Plugin จาก CLI ได้:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
ขณะนี้ `protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น `grpc` จะถูกละเว้น
</Note>

## สัญญาณที่ส่งออก

| สัญญาณ      | สิ่งที่อยู่ในนั้น                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **เมตริก** | counter และ histogram สำหรับการใช้โทเค็น ต้นทุน ระยะเวลาการรัน การไหลของข้อความ เลนคิว สถานะเซสชัน exec และแรงกดดันหน่วยความจำ          |
| **เทรซ**  | span สำหรับการใช้โมเดล การเรียกโมเดล วงจรชีวิตของ harness การเรียกใช้เครื่องมือ exec การประมวลผล webhook/ข้อความ การประกอบบริบท และลูปเครื่องมือ |
| **ล็อก**    | เรคคอร์ด `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP เมื่อเปิดใช้งาน `diagnostics.otel.logs`                                              |

สลับเปิดปิด `traces`, `metrics` และ `logs` ได้อย่างอิสระ ทั้งสามอย่างเปิดไว้เป็นค่าเริ่มต้น
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | แทนที่ `diagnostics.otel.endpoint` หากค่ามี `/v1/traces`, `/v1/metrics` หรือ `/v1/logs` อยู่แล้ว จะใช้ค่านั้นตามเดิม                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | การแทนที่ endpoint เฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์กำหนดค่า `diagnostics.otel.*Endpoint` ที่ตรงกัน การกำหนดค่าเฉพาะสัญญาณมีลำดับความสำคัญเหนือ env เฉพาะสัญญาณ ซึ่งมีลำดับความสำคัญเหนือ endpoint ที่ใช้ร่วมกัน                                     |
| `OTEL_SERVICE_NAME`                                                                                               | แทนที่ `diagnostics.otel.serviceName`                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | แทนที่โปรโตคอลบนสายสื่อสาร (ปัจจุบันใช้เฉพาะ `http/protobuf` เท่านั้น)                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งเป็น `gen_ai_latest_experimental` เพื่อส่งออกแอตทริบิวต์ span GenAI เชิงทดลองล่าสุด (`gen_ai.provider.name`) แทน `gen_ai.system` แบบเดิม เมตริก GenAI ใช้แอตทริบิวต์เชิงความหมายที่มีขอบเขตและ cardinality ต่ำเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งเป็น `1` เมื่อ preload หรือโปรเซส host อื่นลงทะเบียน OpenTelemetry SDK แบบ global ไว้แล้ว จากนั้น Plugin จะข้ามวงจรชีวิต NodeSDK ของตัวเอง แต่ยังคงเชื่อม listener การวินิจฉัยและเคารพ `traces`/`metrics`/`logs`                |

## ความเป็นส่วนตัวและการจับเนื้อหา

เนื้อหาดิบของโมเดล/เครื่องมือจะ **ไม่** ถูกส่งออกโดยค่าเริ่มต้น span มีเฉพาะ
ตัวระบุที่มีขอบเขต (ช่องทาง, provider, โมเดล, หมวดหมู่ข้อผิดพลาด, request id แบบ hash เท่านั้น)
และจะไม่รวมข้อความ prompt, ข้อความตอบกลับ, อินพุตเครื่องมือ, เอาต์พุตเครื่องมือ หรือ
คีย์เซสชัน

คำขอโมเดลขาออกอาจมี header W3C `traceparent` header นี้
สร้างจากบริบทเทรซการวินิจฉัยที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่ทำงานอยู่เท่านั้น
header `traceparent` ที่ผู้เรียกส่งมาเดิมจะถูกแทนที่ ดังนั้น Plugin หรือ
ตัวเลือก provider แบบกำหนดเองจึงไม่สามารถปลอม ancestry ของเทรซข้ามบริการได้

ตั้งค่า `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อ collector และ
นโยบายการเก็บรักษาของคุณได้รับอนุมัติสำหรับข้อความ prompt, คำตอบ, เครื่องมือ หรือ system-prompt
แต่ละคีย์ย่อยต้องเลือกเปิดแยกกัน:

- `inputMessages` — เนื้อหา prompt ของผู้ใช้
- `outputMessages` — เนื้อหาคำตอบของโมเดล
- `toolInputs` — payload อาร์กิวเมนต์เครื่องมือ
- `toolOutputs` — payload ผลลัพธ์เครื่องมือ
- `systemPrompt` — prompt ระบบ/ผู้พัฒนาที่ประกอบแล้ว

เมื่อเปิดใช้งานคีย์ย่อยใดก็ตาม span ของโมเดลและเครื่องมือจะได้รับแอตทริบิวต์
`openclaw.content.*` ที่มีขอบเขตและถูก redacted สำหรับคลาสนั้นเท่านั้น

## การสุ่มตัวอย่างและการ flush

- **เทรซ:** `diagnostics.otel.sampleRate` (เฉพาะ root-span, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด)
- **เมตริก:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`)
- **ล็อก:** ล็อก OTLP เคารพ `logging.level` (ระดับล็อกไฟล์) โดยใช้
  เส้นทาง redaction ของเรคคอร์ดล็อกการวินิจฉัย ไม่ใช่การจัดรูปแบบคอนโซล การติดตั้งที่มีปริมาณสูง
  ควรใช้การสุ่มตัวอย่าง/การกรองของ OTLP collector แทนการสุ่มตัวอย่างภายในเครื่อง
- **การเชื่อมโยงล็อกไฟล์:** ล็อกไฟล์ JSONL จะมี `traceId`,
  `spanId`, `parentSpanId` และ `traceFlags` ระดับบนสุด เมื่อการเรียกล็อกมี
  บริบทเทรซการวินิจฉัยที่ถูกต้อง ซึ่งช่วยให้ตัวประมวลผลล็อกเชื่อมบรรทัดล็อกภายในเครื่องกับ
  span ที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP ของ Gateway และเฟรม WebSocket จะสร้าง
  scope เทรซคำขอภายใน ล็อกและเหตุการณ์การวินิจฉัยภายใน scope นั้น
  จะสืบทอดเทรซคำขอโดยค่าเริ่มต้น ขณะที่ span ของการรัน agent และการเรียกโมเดล
  จะถูกสร้างเป็นลูก เพื่อให้ header `traceparent` ของ provider อยู่บนเทรซเดียวกัน

## เมตริกที่ส่งออก

### การใช้โมเดล

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, เมตริกตามข้อตกลงเชิงความหมายของ GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, วินาที, เมตริกตามข้อตกลงเชิงความหมายของ GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` แบบไม่บังคับ)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` บนข้อผิดพลาดที่จัดประเภทแล้ว)
- `openclaw.model_call.request_bytes` (histogram, ขนาด byte UTF-8 ของ payload คำขอโมเดลสุดท้าย; ไม่มีเนื้อหา payload ดิบ)
- `openclaw.model_call.response_bytes` (histogram, ขนาด byte UTF-8 ของเหตุการณ์คำตอบโมเดลแบบ streamed; ไม่มีเนื้อหาคำตอบดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, เวลาที่ผ่านไปก่อนเหตุการณ์คำตอบแบบ streamed แรก)

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
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; ส่งออกเฉพาะสำหรับการทำบัญชีเซสชันค้างที่ไม่มีงานทำงานอยู่)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; ส่งออกเฉพาะสำหรับการทำบัญชีเซสชันค้างที่ไม่มีงานทำงานอยู่)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### เทเลเมทรีความมีชีวิตของเซสชัน

`diagnostics.stuckSessionWarnMs` คือเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับการวินิจฉัย
ความมีชีวิตของเซสชัน เซสชัน `processing` จะไม่นับอายุไปสู่เกณฑ์นี้
ขณะที่ OpenClaw สังเกตเห็นความคืบหน้าของ reply, tool, status, block หรือ ACP runtime
typing keepalive จะไม่นับเป็นความคืบหน้า ดังนั้นโมเดลหรือ harness ที่เงียบอยู่
ยังคงถูกตรวจพบได้

OpenClaw จัดประเภทเซสชันตามงานที่ยังสังเกตเห็นได้:

- `session.long_running`: งานแบบฝังตัวที่ทำงานอยู่ การเรียกโมเดล หรือการเรียกเครื่องมือ
  ยังมีความคืบหน้าอยู่.
- `session.stalled`: มีงานที่ทำงานอยู่ แต่การรันที่ทำงานอยู่นั้นไม่ได้รายงาน
  ความคืบหน้าล่าสุด. การรันแบบฝังตัวที่หยุดชะงักจะอยู่ในโหมดสังเกตการณ์เท่านั้นก่อน จากนั้น
  จะทำ abort-drain หลังผ่านไปอย่างน้อย 10 นาทีและ 5 เท่าของ `diagnostics.stuckSessionWarnMs`
  โดยไม่มีความคืบหน้า เพื่อให้เทิร์นที่อยู่ในคิวด้านหลังเลนนั้นกลับมาทำงานต่อได้.
- `session.stuck`: การบันทึกสถานะเซสชันที่ค้างและไม่มีงานที่ทำงานอยู่. สิ่งนี้จะปล่อย
  เลนเซสชันที่ได้รับผลกระทบทันที.

มีเพียง `session.stuck` เท่านั้นที่ปล่อยตัวนับ `openclaw.session.stuck`,
ฮิสโตแกรม `openclaw.session.stuck_age_ms` และสแปน `openclaw.session.stuck`.
การวินิจฉัย `session.stuck` ซ้ำจะถอยช่วงเวลาระหว่างการรายงานขณะที่เซสชันยังคง
ไม่เปลี่ยนแปลง ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นต่อเนื่อง แทนที่จะเตือนทุก
จังหวะ Heartbeat. สำหรับปุ่มปรับแต่งการกำหนดค่าและค่าเริ่มต้น โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics).

### วงจรชีวิตของฮาร์เนส

- `openclaw.harness.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อเกิดข้อผิดพลาด)

### การดำเนินการคำสั่ง

- `openclaw.exec.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### กลไกภายในของการวินิจฉัย (หน่วยความจำและลูปเครื่องมือ)

- `openclaw.memory.heap_used_bytes` (ฮิสโตแกรม, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ฮิสโตแกรม)
- `openclaw.memory.pressure` (ตัวนับ, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (ตัวนับ, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.toolName`, `openclaw.outcome`)

## สแปนที่ส่งออก

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อตกลงเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อตกลงเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` และ `openclaw.failureKind` ที่ไม่บังคับ เมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (แฮชแบบจำกัดขอบเขตที่ใช้ SHA ของรหัสคำขอผู้ให้บริการต้นทาง; จะไม่ส่งออกรหัสดิบ)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - เมื่อเสร็จสิ้น: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - เมื่อเกิดข้อผิดพลาด: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` ที่ไม่บังคับ
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

เมื่อเปิดใช้งานการจับเนื้อหาอย่างชัดเจน สแปนของโมเดลและเครื่องมือยังสามารถ
รวมแอตทริบิวต์ `openclaw.content.*` ที่จำกัดขอบเขตและปกปิดข้อมูลแล้ว สำหรับคลาส
เนื้อหาเฉพาะที่คุณเลือกใช้.

## แค็ตตาล็อกเหตุการณ์การวินิจฉัย

เหตุการณ์ด้านล่างรองรับเมตริกและสแปนข้างต้น. Plugin ยังสามารถสมัครรับ
เหตุการณ์เหล่านี้โดยตรงได้โดยไม่ต้องส่งออก OTLP.

**การใช้งานโมเดล**

- `model.usage` — โทเค็น ต้นทุน ระยะเวลา บริบท ผู้ให้บริการ/โมเดล/ช่องทาง
  รหัสเซสชัน. `usage` คือการบัญชีระดับผู้ให้บริการ/เทิร์นสำหรับต้นทุนและเทเลเมทรี;
  `context.used` คือสแนปช็อตพรอมต์/บริบทปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการเมื่อมีอินพุตที่แคชไว้หรือการเรียกลูปเครื่องมือเข้ามาเกี่ยวข้อง.

**โฟลว์ข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (ตัวนับรวม: webhooks/queue/session)

**วงจรชีวิตของฮาร์เนส**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  วงจรชีวิตต่อการรันสำหรับฮาร์เนสของเอเจนต์. รวม `harnessId`, `pluginId`
  ที่ไม่บังคับ ผู้ให้บริการ/โมเดล/ช่องทาง และรหัสการรัน. เมื่อเสร็จสิ้นจะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ที่ไม่บังคับ, `yieldDetected`,
  และจำนวน `itemLifecycle`. ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` ที่ไม่บังคับ.

**การดำเนินการคำสั่ง**

- `exec.process.completed` — ผลลัพธ์ปลายทาง ระยะเวลา เป้าหมาย โหมด รหัสออก
  และชนิดความล้มเหลว. จะไม่รวมข้อความคำสั่งและไดเรกทอรีทำงาน.

## เมื่อไม่มีตัวส่งออก

คุณสามารถทำให้เหตุการณ์การวินิจฉัยพร้อมใช้งานสำหรับ Plugin หรือ sink แบบกำหนดเองได้โดยไม่ต้อง
รัน `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุตดีบักแบบเจาะจงโดยไม่ต้องเพิ่ม `logging.level` ให้ใช้แฟล็กการวินิจฉัย.
แฟล็กไม่สนใจตัวพิมพ์เล็กใหญ่และรองรับไวลด์การ์ด (เช่น `telegram.*` หรือ
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

หรือใช้เป็นการ override ผ่าน env แบบครั้งเดียว:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

เอาต์พุตของแฟล็กจะไปที่ไฟล์บันทึกมาตรฐาน (`logging.file`) และยังคงถูก
ปกปิดข้อมูลโดย `logging.redactSensitive`. คู่มือฉบับเต็ม:
[แฟล็กการวินิจฉัย](/th/diagnostics/flags).

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถไม่นำ `diagnostics-otel` ใส่ใน `plugins.allow` หรือรัน
`openclaw plugins disable diagnostics-otel`.

## ที่เกี่ยวข้อง

- [การบันทึก](/th/logging) — บันทึกไฟล์ เอาต์พุตคอนโซล การ tail ผ่าน CLI และแท็บบันทึกของ Control UI
- [กลไกภายในของการบันทึก Gateway](/th/gateway/logging) — รูปแบบบันทึก WS คำนำหน้าระบบย่อย และการจับคอนโซล
- [แฟล็กการวินิจฉัย](/th/diagnostics/flags) — แฟล็กบันทึกดีบักแบบเจาะจง
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) — เครื่องมือ support-bundle สำหรับผู้ปฏิบัติการ (แยกจากการส่งออก OTEL)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) — ข้อมูลอ้างอิงฟิลด์ `diagnostics.*` แบบครบถ้วน
