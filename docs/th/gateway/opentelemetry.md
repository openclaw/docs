---
read_when:
    - คุณต้องการส่งข้อมูลการใช้งานโมเดลของ OpenClaw, โฟลว์ข้อความ หรือเมตริกเซสชันไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อเทรซ เมตริก หรือบันทึกเข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่น
    - คุณต้องใช้ชื่อเมตริก ชื่อสแปน หรือรูปแบบแอตทริบิวต์ที่ถูกต้องแม่นยำเพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลวินิจฉัยของ OpenClaw ไปยังคอลเลกเตอร์ OpenTelemetry ใดก็ได้ผ่าน Plugin diagnostics-otel (OTLP/HTTP)
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-05-04T02:25:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b5be99b29fe5f13132b03cfeaf3ce978ee16f29e307aa76769bc414b5ca35f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออก diagnostics ผ่าน Plugin ทางการ `diagnostics-otel`
โดยใช้ **OTLP/HTTP (protobuf)** ตัวเก็บรวบรวมหรือ backend ใดๆ ที่รองรับ OTLP/HTTP
จะทำงานได้โดยไม่ต้องแก้โค้ด สำหรับล็อกไฟล์ภายในเครื่องและวิธีอ่าน โปรดดู
[การบันทึกล็อก](/th/logging)

## ส่วนต่างๆ ทำงานร่วมกันอย่างไร

- **เหตุการณ์ diagnostics** คือเรคคอร์ดแบบมีโครงสร้างภายในโปรเซสที่ส่งออกโดย
  Gateway และ Plugin ที่มาพร้อมกัน สำหรับการรันโมเดล, โฟลว์ข้อความ, เซสชัน, คิว,
  และ exec
- **Plugin `diagnostics-otel`** สมัครรับเหตุการณ์เหล่านั้นและส่งออกเป็น
  **เมตริก**, **เทรซ**, และ **ล็อก** ของ OpenTelemetry ผ่าน OTLP/HTTP
- **การเรียก provider** จะได้รับส่วนหัว W3C `traceparent` จากบริบท span การเรียกโมเดลที่เชื่อถือได้ของ OpenClaw
  เมื่อ transport ของ provider รองรับส่วนหัวแบบกำหนดเอง บริบทเทรซที่ Plugin ส่งออกจะไม่ถูกส่งต่อ
- exporter จะผูกต่อเมื่อทั้งพื้นผิว diagnostics และ Plugin
  เปิดใช้งานอยู่เท่านั้น ดังนั้นค่าใช้จ่ายภายในโปรเซสจึงอยู่ใกล้ศูนย์ตามค่าเริ่มต้น

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

คุณยังเปิดใช้งาน Plugin จาก CLI ได้ด้วย:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
ปัจจุบัน `protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น `grpc` จะถูกละเว้น
</Note>

## สัญญาณที่ส่งออก

| สัญญาณ      | สิ่งที่อยู่ในนั้น                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **เมตริก** | ตัวนับและฮิสโตแกรมสำหรับการใช้โทเค็น, ต้นทุน, ระยะเวลาการรัน, โฟลว์ข้อความ, เลนคิว, สถานะเซสชัน, exec, และแรงกดดันหน่วยความจำ          |
| **เทรซ**  | Span สำหรับการใช้โมเดล, การเรียกโมเดล, วงจรชีวิต harness, การเรียกใช้เครื่องมือ, exec, การประมวลผล webhook/ข้อความ, การประกอบบริบท, และลูปเครื่องมือ |
| **ล็อก**    | เรคคอร์ด `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP เมื่อเปิดใช้ `diagnostics.otel.logs`                                              |

สลับเปิดปิด `traces`, `metrics`, และ `logs` ได้อย่างอิสระ ทั้งสามอย่างเปิดไว้ตามค่าเริ่มต้น
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | แทนที่ `diagnostics.otel.endpoint` หากค่านี้มี `/v1/traces`, `/v1/metrics`, หรือ `/v1/logs` อยู่แล้ว จะใช้ค่านั้นตามเดิม                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | การแทนที่ endpoint เฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์กำหนดค่า `diagnostics.otel.*Endpoint` ที่ตรงกัน การกำหนดค่าเฉพาะสัญญาณมีสิทธิเหนือ env เฉพาะสัญญาณ ซึ่งมีสิทธิเหนือ endpoint ที่ใช้ร่วมกัน                                     |
| `OTEL_SERVICE_NAME`                                                                                               | แทนที่ `diagnostics.otel.serviceName`                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | แทนที่โปรโตคอลบนสายสัญญาณ (ปัจจุบันรองรับเฉพาะ `http/protobuf`)                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งเป็น `gen_ai_latest_experimental` เพื่อส่งออกแอตทริบิวต์ span ของ GenAI รุ่นทดลองล่าสุด (`gen_ai.provider.name`) แทน `gen_ai.system` แบบเดิม เมตริก GenAI จะใช้แอตทริบิวต์เชิงความหมายที่มีขอบเขตและมีคาร์ดินาลิตีต่ำเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งเป็น `1` เมื่อ preload หรือโปรเซสโฮสต์อื่นได้ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น Plugin จะข้ามวงจรชีวิต NodeSDK ของตัวเอง แต่ยังคงเชื่อม listener diagnostics และเคารพ `traces`/`metrics`/`logs`                |

## ความเป็นส่วนตัวและการจับเนื้อหา

เนื้อหาดิบของโมเดล/เครื่องมือจะ **ไม่** ถูกส่งออกตามค่าเริ่มต้น Span จะมีตัวระบุ
แบบมีขอบเขต (ช่องทาง, provider, โมเดล, หมวดหมู่ข้อผิดพลาด, id คำขอแบบ hash-only)
และจะไม่รวมข้อความ prompt, ข้อความตอบกลับ, อินพุตเครื่องมือ, เอาต์พุตเครื่องมือ, หรือ
คีย์เซสชัน

คำขอโมเดลขาออกอาจมีส่วนหัว W3C `traceparent` ส่วนหัวนั้นจะถูกสร้างจาก
บริบทเทรซ diagnostics ที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่ใช้งานอยู่เท่านั้น
ส่วนหัว `traceparent` ที่ผู้เรียกส่งมาเดิมจะถูกแทนที่ ดังนั้น Plugin หรือ
ตัวเลือก provider แบบกำหนดเองจะปลอมแปลงสายบรรพบุรุษเทรซข้ามบริการไม่ได้

ตั้งค่า `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อ collector และ
นโยบายการเก็บรักษาของคุณได้รับอนุมัติสำหรับข้อความ prompt, คำตอบ, เครื่องมือ, หรือ system-prompt
แต่ละคีย์ย่อยเป็นแบบ opt-in แยกกัน:

- `inputMessages` — เนื้อหา prompt ของผู้ใช้
- `outputMessages` — เนื้อหาคำตอบของโมเดล
- `toolInputs` — payload อาร์กิวเมนต์ของเครื่องมือ
- `toolOutputs` — payload ผลลัพธ์ของเครื่องมือ
- `systemPrompt` — prompt ระบบ/นักพัฒนาที่ประกอบแล้ว

เมื่อเปิดใช้งานคีย์ย่อยใดๆ Span ของโมเดลและเครื่องมือจะได้รับแอตทริบิวต์
`openclaw.content.*` แบบมีขอบเขตและผ่านการปกปิด สำหรับคลาสนั้นเท่านั้น

## การสุ่มตัวอย่างและการ flush

- **เทรซ:** `diagnostics.otel.sampleRate` (เฉพาะ root-span, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด)
- **เมตริก:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`)
- **ล็อก:** ล็อก OTLP เคารพ `logging.level` (ระดับล็อกไฟล์) โดยใช้เส้นทางปกปิดเรคคอร์ดล็อก
  diagnostics ไม่ใช่การจัดรูปแบบคอนโซล การติดตั้งที่มีปริมาณสูง
  ควรใช้การสุ่มตัวอย่าง/กรองที่ OTLP collector มากกว่าการสุ่มตัวอย่างในเครื่อง
- **การเชื่อมโยงกับ file-log:** ล็อกไฟล์ JSONL จะมี `traceId`,
  `spanId`, `parentSpanId`, และ `traceFlags` ระดับบนสุดเมื่อการเรียกล็อกมี
  บริบทเทรซ diagnostics ที่ถูกต้อง ทำให้ตัวประมวลผลล็อกเชื่อมบรรทัดล็อกในเครื่องกับ
  Span ที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP ของ Gateway และเฟรม WebSocket จะสร้าง
  ขอบเขตเทรซคำขอภายใน ล็อกและเหตุการณ์ diagnostics ภายในขอบเขตนั้น
  จะสืบทอดเทรซคำขอตามค่าเริ่มต้น ขณะที่ Span การรันเอเจนต์และการเรียกโมเดล
  จะถูกสร้างเป็นลูก เพื่อให้ส่วนหัว `traceparent` ของ provider อยู่ในเทรซเดียวกัน

## เมตริกที่ส่งออก

### การใช้โมเดล

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, เมตริก GenAI semantic-conventions, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, วินาที, เมตริก GenAI semantic-conventions, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` แบบไม่บังคับ)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` เมื่อเป็นข้อผิดพลาดที่จัดประเภทแล้ว)
- `openclaw.model_call.request_bytes` (histogram, ขนาดไบต์ UTF-8 ของ payload คำขอโมเดลสุดท้าย; ไม่มีเนื้อหา payload ดิบ)
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
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; ส่งออกเฉพาะสำหรับการบันทึกสถานะเซสชันค้างที่ไม่มีงานทำงานอยู่)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; ส่งออกเฉพาะสำหรับการบันทึกสถานะเซสชันค้างที่ไม่มีงานทำงานอยู่)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Telemetry ความมีชีวิตของเซสชัน

`diagnostics.stuckSessionWarnMs` คือเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับ diagnostics
ความมีชีวิตของเซสชัน เซสชัน `processing` จะไม่นับอายุเข้าสู่เกณฑ์นี้
ขณะที่ OpenClaw สังเกตเห็นความคืบหน้า runtime ของการตอบกลับ, เครื่องมือ, สถานะ, บล็อก, หรือ ACP
การส่ง keepalive ขณะพิมพ์จะไม่นับเป็นความคืบหน้า ดังนั้นโมเดลหรือ harness ที่เงียบ
ยังคงถูกตรวจจับได้

OpenClaw จัดประเภทเซสชันตามงานที่ยังสังเกตเห็นได้:

- `session.long_running`: งานฝังตัวที่ยังทำงานอยู่ การเรียกโมเดล หรือการเรียกเครื่องมือยังคง
  มีความคืบหน้า
- `session.stalled`: มีงานที่ยังทำงานอยู่ แต่รันที่ทำงานอยู่ไม่ได้รายงาน
  ความคืบหน้าล่าสุด รันฝังตัวที่ชะงักจะยังอยู่ในโหมดสังเกตการณ์เท่านั้นในตอนแรก จากนั้น
  จะยกเลิกและระบายคิวหลังผ่านไปอย่างน้อย 10 นาทีและ 5 เท่าของ `diagnostics.stuckSessionWarnMs`
  โดยไม่มีความคืบหน้า เพื่อให้เทิร์นที่เข้าคิวอยู่หลังเลนนั้นกลับมาทำงานต่อได้
- `session.stuck`: บัญชีสถานะเซสชันที่ค้างเก่าโดยไม่มีงานที่ทำงานอยู่ กรณีนี้จะปล่อย
  เลนเซสชันที่ได้รับผลกระทบทันที

เฉพาะ `session.stuck` เท่านั้นที่ส่งออกตัวนับ `openclaw.session.stuck`,
ฮิสโตแกรม `openclaw.session.stuck_age_ms` และ
สแปน `openclaw.session.stuck` การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะเว้นระยะถอยหลังขณะที่เซสชันยังคง
ไม่เปลี่ยนแปลง ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นอย่างต่อเนื่อง แทนที่จะเตือนทุก
จังหวะ Heartbeat สำหรับปุ่มปรับการกำหนดค่าและค่าเริ่มต้น โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics)

### วงจรชีวิตของฮาร์เนส

- `openclaw.harness.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อเกิดข้อผิดพลาด)

### Exec

- `openclaw.exec.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### ภายในของการวินิจฉัย (หน่วยความจำและลูปเครื่องมือ)

- `openclaw.memory.heap_used_bytes` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ฮิสโตแกรม)
- `openclaw.memory.pressure` (ตัวนับ, แอตทริบิวต์: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (ตัวนับ, แอตทริบิวต์: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.toolName`, `openclaw.outcome`)

## สแปนที่ส่งออก

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` เป็นค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อตกลงเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` เป็นค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อตกลงเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` และ `openclaw.failureKind` ที่เป็นตัวเลือกเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (แฮชที่มีขอบเขตและอิงตาม SHA ของรหัสคำขอผู้ให้บริการต้นทาง; ไม่มีการส่งออกรหัสดิบ)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - เมื่อเสร็จสมบูรณ์: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - เมื่อเกิดข้อผิดพลาด: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` ที่เป็นตัวเลือก
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (ไม่มีเนื้อหาพรอมป์ ประวัติ การตอบกลับ หรือคีย์เซสชัน)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ไม่มีข้อความลูป พารามิเตอร์ หรือเอาต์พุตเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

เมื่อเปิดใช้การจับเนื้อหาอย่างชัดเจน สแปนของโมเดลและเครื่องมือยังสามารถ
รวมแอตทริบิวต์ `openclaw.content.*` ที่มีขอบเขตและผ่านการปกปิดข้อมูล สำหรับ
คลาสเนื้อหาเฉพาะที่คุณเลือกใช้

## แค็ตตาล็อกเหตุการณ์วินิจฉัย

เหตุการณ์ด้านล่างรองรับเมตริกและสแปนข้างต้น Plugin ยังสามารถสมัครรับ
เหตุการณ์เหล่านี้โดยตรงได้โดยไม่ต้องส่งออก OTLP

**การใช้งานโมเดล**

- `model.usage` — โทเค็น ค่าใช้จ่าย ระยะเวลา บริบท ผู้ให้บริการ/โมเดล/ช่องทาง
  รหัสเซสชัน `usage` คือบัญชีระดับผู้ให้บริการ/เทิร์นสำหรับค่าใช้จ่ายและเทเลเมทรี;
  `context.used` คือสแนปช็อตพรอมป์/บริบทปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการเมื่อมีอินพุตที่แคชไว้หรือการเรียกลูปเครื่องมือเข้ามาเกี่ยวข้อง

**โฟลว์ข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (ตัวนับรวม: Webhook/คิว/เซสชัน)

**วงจรชีวิตของฮาร์เนส**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  วงจรชีวิตต่อรันสำหรับฮาร์เนสของเอเจนต์ รวม `harnessId`, `pluginId` ที่เป็นตัวเลือก
  ผู้ให้บริการ/โมเดล/ช่องทาง และรหัสรัน การเสร็จสมบูรณ์จะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ที่เป็นตัวเลือก, `yieldDetected`,
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` ที่เป็นตัวเลือก

**Exec**

- `exec.process.completed` — ผลลัพธ์ปลายทาง ระยะเวลา เป้าหมาย โหมด รหัสออก
  และชนิดความล้มเหลว ไม่รวมข้อความคำสั่งและไดเรกทอรีทำงาน

## ไม่มีตัวส่งออก

คุณสามารถทำให้เหตุการณ์วินิจฉัยพร้อมใช้งานสำหรับ Plugin หรือปลายทางแบบกำหนดเองได้โดยไม่ต้อง
รัน `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุตดีบักแบบเจาะจงโดยไม่เพิ่ม `logging.level` ให้ใช้แฟล็กการวินิจฉัย
แฟล็กไม่คำนึงถึงตัวพิมพ์เล็กใหญ่และรองรับไวลด์การ์ด (เช่น `telegram.*` หรือ
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

หรือใช้เป็นการ override env แบบครั้งเดียว:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

เอาต์พุตแฟล็กจะไปยังไฟล์บันทึกมาตรฐาน (`logging.file`) และยังคง
ถูกปกปิดข้อมูลโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[แฟล็กการวินิจฉัย](/th/diagnostics/flags)

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถไม่ใส่ `diagnostics-otel` ไว้ใน `plugins.allow` หรือรัน
`openclaw plugins disable diagnostics-otel` ได้

## ที่เกี่ยวข้อง

- [การบันทึก](/th/logging) — บันทึกไฟล์ เอาต์พุตคอนโซล การ tail จาก CLI และแท็บ Logs ของ Control UI
- [ภายในของการบันทึก Gateway](/th/gateway/logging) — รูปแบบบันทึก WS คำนำหน้าระบบย่อย และการจับคอนโซล
- [แฟล็กการวินิจฉัย](/th/diagnostics/flags) — แฟล็กบันทึกดีบักแบบเจาะจง
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) — เครื่องมือบันเดิลสนับสนุนสำหรับผู้ปฏิบัติงาน (แยกจากการส่งออก OTEL)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) — ข้อมูลอ้างอิงฟิลด์ `diagnostics.*` ฉบับเต็ม
