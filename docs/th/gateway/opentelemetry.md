---
read_when:
    - คุณต้องการส่งข้อมูลการใช้งานโมเดลของ OpenClaw, โฟลว์ข้อความ หรือเมตริกเซสชันไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อเทรซ เมตริก หรือบันทึกล็อกเข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่น
    - คุณต้องใช้ชื่อเมตริก ชื่อสแปน หรือโครงสร้างของแอตทริบิวต์ที่แน่นอน เพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry ใดก็ได้ผ่าน Plugin diagnostics-otel (OTLP/HTTP)
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T20:44:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3287540a32b9b8400f227ab9400073e8145af89e5246e6af06945a96b751826f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออก diagnostics ผ่าน Plugin ทางการ `diagnostics-otel`
โดยใช้ **OTLP/HTTP (protobuf)** ตัว collector หรือ backend ใด ๆ ที่รับ OTLP/HTTP
จะทำงานได้โดยไม่ต้องแก้โค้ด สำหรับล็อกไฟล์ภายในเครื่องและวิธีอ่าน โปรดดู
[การบันทึกล็อก](/th/logging)

## การทำงานร่วมกัน

- **เหตุการณ์ diagnostics** คือเรกคอร์ดแบบมีโครงสร้างภายในโปรเซสที่ปล่อยโดย
  Gateway และ Plugin ที่บันเดิลมาสำหรับการรันโมเดล โฟลว์ข้อความ เซสชัน คิว
  และ exec
- **Plugin `diagnostics-otel`** สมัครรับเหตุการณ์เหล่านั้นและส่งออกเป็น
  OpenTelemetry **เมตริก**, **เทรซ**, และ **ล็อก** ผ่าน OTLP/HTTP
- **การเรียก provider** จะได้รับส่วนหัว W3C `traceparent` จากบริบท span
  การเรียกโมเดลที่เชื่อถือได้ของ OpenClaw เมื่อ transport ของ provider รับส่วนหัวที่กำหนดเองได้
  บริบทเทรซที่ Plugin ปล่อยออกมาจะไม่ถูกส่งต่อ
- exporter จะเชื่อมต่อเฉพาะเมื่อทั้งพื้นผิว diagnostics และ Plugin
  ถูกเปิดใช้ ดังนั้นค่าใช้จ่ายภายในโปรเซสจึงอยู่ใกล้ศูนย์โดยค่าเริ่มต้น

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

คุณยังเปิดใช้ Plugin จาก CLI ได้ด้วย:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` รองรับเฉพาะ `http/protobuf` ในปัจจุบัน `grpc` จะถูกละเว้น
</Note>

## สัญญาณที่ส่งออก

| สัญญาณ      | สิ่งที่อยู่ในนั้น                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **เมตริก** | counter และ histogram สำหรับการใช้โทเค็น ค่าใช้จ่าย ระยะเวลารัน โฟลว์ข้อความ เลนคิว สถานะเซสชัน exec และแรงกดดันหน่วยความจำ          |
| **เทรซ**  | span สำหรับการใช้โมเดล การเรียกโมเดล วงจรชีวิต harness การรันเครื่องมือ exec การประมวลผล webhook/ข้อความ การประกอบบริบท และลูปเครื่องมือ |
| **ล็อก**    | เรกคอร์ด `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP เมื่อเปิดใช้ `diagnostics.otel.logs`                                              |

สลับเปิดปิด `traces`, `metrics`, และ `logs` แยกจากกันได้ ทั้งสามอย่างเปิดเป็นค่าเริ่มต้น
เมื่อ `diagnostics.otel.enabled` เป็น true

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | แทนที่ `diagnostics.otel.endpoint` หากค่านั้นมี `/v1/traces`, `/v1/metrics`, หรือ `/v1/logs` อยู่แล้ว จะใช้ตามนั้น                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | การแทนที่ endpoint เฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์ config `diagnostics.otel.*Endpoint` ที่ตรงกัน config เฉพาะสัญญาณมีลำดับความสำคัญเหนือ env เฉพาะสัญญาณ ซึ่งมีลำดับความสำคัญเหนือ endpoint ที่ใช้ร่วมกัน                                     |
| `OTEL_SERVICE_NAME`                                                                                               | แทนที่ `diagnostics.otel.serviceName`                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | แทนที่โปรโตคอลบนสายสื่อสาร (วันนี้รองรับเฉพาะ `http/protobuf`)                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งเป็น `gen_ai_latest_experimental` เพื่อปล่อยแอตทริบิวต์ span GenAI แบบทดลองล่าสุด (`gen_ai.provider.name`) แทน `gen_ai.system` แบบเดิม เมตริก GenAI ใช้แอตทริบิวต์เชิง semantic ที่มีขอบเขตและ cardinality ต่ำเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งเป็น `1` เมื่อ preload หรือโปรเซส host อื่นลงทะเบียน global OpenTelemetry SDK ไว้แล้ว จากนั้น Plugin จะข้ามวงจรชีวิต NodeSDK ของตัวเอง แต่ยังเชื่อม listener diagnostics และเคารพ `traces`/`metrics`/`logs`                |

## ความเป็นส่วนตัวและการจับเนื้อหา

เนื้อหาโมเดล/เครื่องมือดิบจะ **ไม่** ถูกส่งออกโดยค่าเริ่มต้น span จะพาเฉพาะ
ตัวระบุที่มีขอบเขต (channel, provider, model, error category, request id แบบ hash-only)
และไม่รวมข้อความ prompt, ข้อความ response, input ของเครื่องมือ, output ของเครื่องมือ หรือ
คีย์เซสชัน

คำขอโมเดลขาออกอาจมีส่วนหัว W3C `traceparent` ส่วนหัวนั้นจะถูกสร้าง
จากบริบทเทรซ diagnostics ที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่ทำงานอยู่เท่านั้น
ส่วนหัว `traceparent` ที่ผู้เรียกส่งมาเดิมจะถูกแทนที่ ดังนั้น Plugin หรือ
ตัวเลือก provider แบบกำหนดเองจะปลอมแปลงลำดับสายเทรซข้ามบริการไม่ได้

ตั้งค่า `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อ collector และ
นโยบายการเก็บรักษาของคุณได้รับอนุมัติสำหรับข้อความ prompt, response, tool หรือ system-prompt
แต่ละ subkey ต้อง opt-in แยกกัน:

- `inputMessages` — เนื้อหา prompt ของผู้ใช้
- `outputMessages` — เนื้อหา response ของโมเดล
- `toolInputs` — payload อาร์กิวเมนต์ของเครื่องมือ
- `toolOutputs` — payload ผลลัพธ์ของเครื่องมือ
- `systemPrompt` — prompt system/developer ที่ประกอบแล้ว

เมื่อเปิดใช้ subkey ใด ๆ span ของโมเดลและเครื่องมือจะได้รับแอตทริบิวต์
`openclaw.content.*` ที่มีขอบเขตและถูก redact แล้วสำหรับคลาสนั้นเท่านั้น

## การสุ่มตัวอย่างและการ flush

- **เทรซ:** `diagnostics.otel.sampleRate` (เฉพาะ root-span, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด)
- **เมตริก:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`)
- **ล็อก:** ล็อก OTLP เคารพ `logging.level` (ระดับล็อกไฟล์) โดยใช้เส้นทาง
  การ redact เรกคอร์ดล็อก diagnostics ไม่ใช่การจัดรูปแบบคอนโซล การติดตั้งปริมาณสูง
  ควรใช้การสุ่มตัวอย่าง/การกรองของ OTLP collector แทนการสุ่มตัวอย่างภายในเครื่อง
- **การเชื่อมโยงล็อกไฟล์:** ล็อกไฟล์ JSONL มี `traceId`,
  `spanId`, `parentSpanId`, และ `traceFlags` ระดับบนสุดเมื่อการเรียกล็อกมี
  บริบทเทรซ diagnostics ที่ถูกต้อง ซึ่งช่วยให้ตัวประมวลผลล็อกเชื่อมบรรทัดล็อกภายในเครื่องกับ
  span ที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP ของ Gateway และเฟรม WebSocket สร้าง
  ขอบเขตเทรซคำขอภายใน ล็อกและเหตุการณ์ diagnostics ภายในขอบเขตนั้น
  จะสืบทอดเทรซคำขอตามค่าเริ่มต้น ขณะที่ span ของการรันเอเจนต์และการเรียกโมเดล
  ถูกสร้างเป็นลูก เพื่อให้ส่วนหัว `traceparent` ของ provider อยู่บนเทรซเดียวกัน

## เมตริกที่ส่งออก

### การใช้โมเดล

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, เมตริกตาม semantic-conventions ของ GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, วินาที, เมตริกตาม semantic-conventions ของ GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` แบบเลือกได้)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, พร้อม `openclaw.errorCategory` และ `openclaw.failureKind` บนข้อผิดพลาดที่จัดประเภทแล้ว)
- `openclaw.model_call.request_bytes` (histogram, ขนาดไบต์ UTF-8 ของ payload คำขอโมเดลสุดท้าย; ไม่มีเนื้อหา payload ดิบ)
- `openclaw.model_call.response_bytes` (histogram, ขนาดไบต์ UTF-8 ของเหตุการณ์ response โมเดลแบบสตรีม; ไม่มีเนื้อหา response ดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, เวลาที่ผ่านไปก่อนเหตุการณ์ response แบบสตรีมรายการแรก)

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
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; ปล่อยเฉพาะสำหรับการบันทึกบัญชีเซสชันเก่าที่ไม่มีงานที่ทำงานอยู่)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; ปล่อยเฉพาะสำหรับการบันทึกบัญชีเซสชันเก่าที่ไม่มีงานที่ทำงานอยู่)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### เทเลเมทรีความมีชีวิตของเซสชัน

`diagnostics.stuckSessionWarnMs` คือเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับ diagnostics
ความมีชีวิตของเซสชัน เซสชัน `processing` จะไม่สะสมอายุเข้าหาเกณฑ์นี้
ขณะที่ OpenClaw สังเกตเห็นความคืบหน้าของ reply, tool, status, block หรือ ACP runtime
การ typing keepalive จะไม่นับเป็นความคืบหน้า ดังนั้นโมเดลหรือ harness ที่เงียบ
ยังคงถูกตรวจพบได้

OpenClaw จัดประเภทเซสชันตามงานที่ยังสังเกตเห็นได้:

- `session.long_running`: งานแบบฝังตัวที่กำลังทำงานอยู่ การเรียกโมเดล หรือการเรียกเครื่องมือยังคงมีความคืบหน้า
- `session.stalled`: มีงานที่กำลังทำงานอยู่ แต่รันที่กำลังทำงานไม่ได้รายงานความคืบหน้าล่าสุด
- `session.stuck`: การบันทึกสถานะเซสชันที่ค้างและไม่มีงานที่กำลังทำงานอยู่ นี่เป็นการจัดประเภทความพร้อมทำงานเพียงแบบเดียวที่ปล่อยเลนเซสชันที่ได้รับผลกระทบ

เฉพาะ `session.stuck` เท่านั้นที่ปล่อยตัวนับ `openclaw.session.stuck`, ฮิสโตแกรม
`openclaw.session.stuck_age_ms` และ span `openclaw.session.stuck`
การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะถอยระยะห่างออกไปขณะที่เซสชันยังไม่เปลี่ยนแปลง ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นอย่างต่อเนื่อง แทนที่จะแจ้งเตือนทุก heartbeat tick สำหรับปุ่มปรับแต่งค่า config และค่าเริ่มต้น โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics)

### วงจรชีวิตของ harness

- `openclaw.harness.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อเกิดข้อผิดพลาด)

### Exec

- `openclaw.exec.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### รายละเอียดภายในของการวินิจฉัย (หน่วยความจำและลูปเครื่องมือ)

- `openclaw.memory.heap_used_bytes` (ฮิสโตแกรม, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ฮิสโตแกรม)
- `openclaw.memory.pressure` (ตัวนับ, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (ตัวนับ, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.toolName`, `openclaw.outcome`)

## span ที่ส่งออก

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อตกลงเชิงความหมายของ GenAI เวอร์ชันล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อตกลงเชิงความหมายของ GenAI เวอร์ชันล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` และ `openclaw.failureKind` แบบไม่บังคับเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (แฮชแบบมีขอบเขตที่อิง SHA ของ id คำขอจากผู้ให้บริการต้นทาง; ไม่มีการส่งออก id ดิบ)
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ไม่มีข้อความลูป, params หรือเอาต์พุตเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

เมื่อเปิดใช้งานการจับเนื้อหาไว้อย่างชัดเจน span ของโมเดลและเครื่องมือยังสามารถรวมแอตทริบิวต์ `openclaw.content.*` แบบมีขอบเขตและผ่านการปกปิดข้อมูล สำหรับคลาสเนื้อหาเฉพาะที่คุณเลือกใช้ได้ด้วย

## แคตตาล็อกเหตุการณ์การวินิจฉัย

เหตุการณ์ด้านล่างรองรับเมตริกและ span ข้างต้น Plugin ต่างๆ ยังสามารถสมัครรับเหตุการณ์เหล่านี้ได้โดยตรงโดยไม่ต้องส่งออก OTLP

**การใช้งานโมเดล**

- `model.usage` — โทเค็น ต้นทุน ระยะเวลา context ผู้ให้บริการ/โมเดล/ช่องทาง และ session ids `usage` คือการคิดบัญชีของผู้ให้บริการ/เทิร์นสำหรับต้นทุนและ telemetry; `context.used` คือ snapshot ของ prompt/context ปัจจุบัน และอาจต่ำกว่า `usage.total` ของผู้ให้บริการเมื่อมี cached input หรือการเรียก tool-loop เข้ามาเกี่ยวข้อง

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  วงจรชีวิตต่อรันสำหรับ agent harness รวม `harnessId`, `pluginId` แบบไม่บังคับ, ผู้ให้บริการ/โมเดล/ช่องทาง และ run id เมื่อเสร็จสมบูรณ์จะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` แบบไม่บังคับ, `yieldDetected`
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` แบบไม่บังคับ

**Exec**

- `exec.process.completed` — ผลลัพธ์ปลายทาง ระยะเวลา เป้าหมาย โหมด exit
  code และชนิดความล้มเหลว ไม่มีการรวมข้อความคำสั่งและไดเรกทอรีทำงาน

## ไม่มี exporter

คุณสามารถทำให้เหตุการณ์การวินิจฉัยพร้อมใช้งานสำหรับ Plugin หรือ sink แบบกำหนดเองได้โดยไม่ต้องรัน `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุตดีบักแบบเจาะจงโดยไม่ต้องเพิ่ม `logging.level` ให้ใช้ flags การวินิจฉัย Flags ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่และรองรับ wildcard (เช่น `telegram.*` หรือ
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

หรือเป็นการ override ผ่าน env แบบครั้งเดียว:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

เอาต์พุตของ flag จะไปที่ไฟล์บันทึกมาตรฐาน (`logging.file`) และยังคงถูกปกปิดข้อมูลโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[flags การวินิจฉัย](/th/diagnostics/flags)

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถไม่ใส่ `diagnostics-otel` ไว้ใน `plugins.allow` หรือรัน
`openclaw plugins disable diagnostics-otel` ได้

## ที่เกี่ยวข้อง

- [การบันทึก](/th/logging) — บันทึกไฟล์ เอาต์พุตคอนโซล การ tail ผ่าน CLI และแท็บบันทึกของ Control UI
- [รายละเอียดภายในของการบันทึก Gateway](/th/gateway/logging) — รูปแบบบันทึก WS, prefix ของระบบย่อย และการจับคอนโซล
- [flags การวินิจฉัย](/th/diagnostics/flags) — flags บันทึกดีบักแบบเจาะจง
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) — เครื่องมือ support-bundle สำหรับผู้ปฏิบัติงาน (แยกจากการส่งออก OTEL)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) — ข้อมูลอ้างอิงฟิลด์ `diagnostics.*` แบบครบถ้วน
