---
read_when:
    - คุณต้องการส่งการใช้งานโมเดลของ OpenClaw, โฟลว์ข้อความ หรือเมตริกเซสชันไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อเทรซ เมตริก หรือล็อกเข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่น
    - คุณต้องใช้ชื่อเมตริก ชื่อสแปน หรือรูปแบบแอตทริบิวต์ที่แน่นอนเพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry ใดก็ได้ผ่าน Plugin diagnostics-otel (OTLP/HTTP)
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T10:17:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0aed4ca8818d3bd1f5461fb58fbbe5c0d3ed1262cac506c60ee326800d98e1b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกข้อมูลวินิจฉัยผ่าน Plugin `diagnostics-otel` อย่างเป็นทางการ
โดยใช้ **OTLP/HTTP (protobuf)** ตัวรวบรวมหรือแบ็กเอนด์ใดก็ตามที่รับ OTLP/HTTP
จะทำงานได้โดยไม่ต้องเปลี่ยนโค้ด สำหรับล็อกไฟล์ในเครื่องและวิธีอ่าน โปรดดู
[การบันทึกล็อก](/th/logging)

## การทำงานร่วมกัน

- **เหตุการณ์วินิจฉัย** คือระเบียนที่มีโครงสร้างภายในกระบวนการ ซึ่งส่งออกโดย
  Gateway และ Plugin ที่รวมมาให้ สำหรับการรันโมเดล การไหลของข้อความ เซสชัน คิว
  และการดำเนินการคำสั่ง
- **Plugin `diagnostics-otel`** สมัครรับเหตุการณ์เหล่านั้นและส่งออกเป็น
  OpenTelemetry **เมตริก**, **trace**, และ **ล็อก** ผ่าน OTLP/HTTP
- **การเรียกผู้ให้บริการ** จะได้รับส่วนหัว W3C `traceparent` จากบริบท span
  การเรียกโมเดลที่เชื่อถือได้ของ OpenClaw เมื่อการขนส่งของผู้ให้บริการรองรับ
  ส่วนหัวแบบกำหนดเอง บริบท trace ที่ Plugin ส่งออกจะไม่ถูกส่งต่อ
- ตัวส่งออกจะแนบเฉพาะเมื่อทั้งพื้นผิววินิจฉัยและ Plugin เปิดใช้งานอยู่
  ดังนั้นค่าใช้จ่ายภายในกระบวนการจึงยังคงใกล้ศูนย์โดยค่าเริ่มต้น

## เริ่มต้นอย่างรวดเร็ว

สำหรับการติดตั้งแบบแพ็กเกจ ให้ติดตั้ง Plugin ก่อน:

```bash
openclaw plugins install @openclaw/diagnostics-otel
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
| **เมตริก** | ตัวนับและฮิสโตแกรมสำหรับการใช้โทเค็น ค่าใช้จ่าย ระยะเวลาการรัน การไหลของข้อความ เลนคิว สถานะเซสชัน การดำเนินการคำสั่ง และแรงกดดันหน่วยความจำ          |
| **Trace**  | Span สำหรับการใช้โมเดล การเรียกโมเดล วงจรชีวิตของฮาร์เนส การดำเนินการเครื่องมือ การดำเนินการคำสั่ง การประมวลผล Webhook/ข้อความ การประกอบบริบท และลูปเครื่องมือ |
| **ล็อก**    | ระเบียน `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP เมื่อเปิดใช้งาน `diagnostics.otel.logs`                                              |

สลับ `traces`, `metrics`, และ `logs` ได้อย่างอิสระ ทั้งสามรายการเปิดโดยค่าเริ่มต้น
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | เขียนทับ `diagnostics.otel.endpoint` หากค่ามี `/v1/traces`, `/v1/metrics`, หรือ `/v1/logs` อยู่แล้ว จะใช้ค่านั้นตามเดิม                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | การเขียนทับปลายทางเฉพาะสัญญาณที่ใช้เมื่อยังไม่ได้ตั้งค่าคีย์กำหนดค่า `diagnostics.otel.*Endpoint` ที่ตรงกัน การกำหนดค่าเฉพาะสัญญาณมีลำดับเหนือ env เฉพาะสัญญาณ ซึ่งมีลำดับเหนือปลายทางที่ใช้ร่วมกัน                                     |
| `OTEL_SERVICE_NAME`                                                                                               | เขียนทับ `diagnostics.otel.serviceName`                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | เขียนทับโปรโตคอลบนสายส่งข้อมูล (วันนี้รองรับเฉพาะ `http/protobuf`)                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งเป็น `gen_ai_latest_experimental` เพื่อส่งออกแอตทริบิวต์ span GenAI รุ่นทดลองล่าสุด (`gen_ai.provider.name`) แทน `gen_ai.system` แบบเดิม เมตริก GenAI ใช้แอตทริบิวต์เชิงความหมายที่มีขอบเขตและมีคาร์ดินัลลิตีต่ำเสมอ ไม่ว่าอย่างไรก็ตาม |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งเป็น `1` เมื่อ preload อื่นหรือกระบวนการโฮสต์ได้ลงทะเบียน SDK OpenTelemetry ส่วนกลางไว้แล้ว จากนั้น Plugin จะข้ามวงจรชีวิต NodeSDK ของตนเอง แต่ยังคงเชื่อม listener วินิจฉัยและเคารพ `traces`/`metrics`/`logs`                |

## ความเป็นส่วนตัวและการจับเนื้อหา

เนื้อหาดิบของโมเดล/เครื่องมือจะ **ไม่** ถูกส่งออกโดยค่าเริ่มต้น Span จะมีตัวระบุ
แบบมีขอบเขต (ช่องทาง ผู้ให้บริการ โมเดล หมวดหมู่ข้อผิดพลาด รหัสคำขอแบบแฮชเท่านั้น)
และจะไม่มีข้อความพรอมป์ ข้อความตอบกลับ อินพุตเครื่องมือ เอาต์พุตเครื่องมือ หรือ
คีย์เซสชัน

คำขอโมเดลขาออกอาจมีส่วนหัว W3C `traceparent` ส่วนหัวนั้นสร้างจากบริบท trace
วินิจฉัยที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่กำลังทำงานอยู่เท่านั้น
ส่วนหัว `traceparent` ที่ผู้เรียกส่งมาเดิมจะถูกแทนที่ ดังนั้น Plugin หรือ
ตัวเลือกผู้ให้บริการแบบกำหนดเองจึงไม่สามารถปลอมบรรพบุรุษ trace ข้ามบริการได้

ตั้ง `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อ collector และ
นโยบายการเก็บรักษาของคุณได้รับอนุมัติสำหรับข้อความพรอมป์ คำตอบ เครื่องมือ หรือ
พรอมป์ระบบ แต่ละคีย์ย่อยเป็นการเลือกเปิดใช้งานแยกกัน:

- `inputMessages` — เนื้อหาพรอมป์ของผู้ใช้
- `outputMessages` — เนื้อหาคำตอบของโมเดล
- `toolInputs` — เพย์โหลดอาร์กิวเมนต์ของเครื่องมือ
- `toolOutputs` — เพย์โหลดผลลัพธ์ของเครื่องมือ
- `systemPrompt` — พรอมป์ระบบ/นักพัฒนาที่ประกอบแล้ว

เมื่อเปิดใช้งานคีย์ย่อยใดก็ตาม span ของโมเดลและเครื่องมือจะได้รับแอตทริบิวต์
`openclaw.content.*` แบบมีขอบเขตและผ่านการปกปิด สำหรับคลาสนั้นเท่านั้น

## การสุ่มตัวอย่างและการล้างบัฟเฟอร์

- **Trace:** `diagnostics.otel.sampleRate` (เฉพาะ root-span, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด)
- **เมตริก:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`)
- **ล็อก:** ล็อก OTLP เคารพ `logging.level` (ระดับล็อกไฟล์) โดยใช้เส้นทางการปกปิด
  ระเบียนล็อกวินิจฉัย ไม่ใช่การจัดรูปแบบคอนโซล การติดตั้งที่มีปริมาณสูง
  ควรใช้การสุ่มตัวอย่าง/การกรองของ OTLP collector มากกว่าการสุ่มตัวอย่างในเครื่อง
- **การเชื่อมโยงล็อกไฟล์:** ล็อกไฟล์ JSONL มี `traceId`, `spanId`,
  `parentSpanId`, และ `traceFlags` ระดับบนสุด เมื่อการเรียกล็อกมีบริบท trace
  วินิจฉัยที่ถูกต้อง ซึ่งช่วยให้ตัวประมวลผลล็อกเชื่อมบรรทัดล็อกในเครื่องกับ
  span ที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP ของ Gateway และเฟรม WebSocket จะสร้าง
  ขอบเขต trace คำขอภายใน ล็อกและเหตุการณ์วินิจฉัยภายในขอบเขตนั้นจะสืบทอด trace
  ของคำขอโดยค่าเริ่มต้น ขณะที่ span ของการรัน agent และการเรียกโมเดลจะถูกสร้าง
  เป็นลูก เพื่อให้ส่วนหัว `traceparent` ของผู้ให้บริการยังคงอยู่บน trace เดียวกัน

## เมตริกที่ส่งออก

### การใช้โมเดล

- `openclaw.tokens` (ตัวนับ, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (ฮิสโตแกรม, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (ฮิสโตแกรม, เมตริกตามแบบแผนเชิงความหมาย GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (ฮิสโตแกรม, วินาที, เมตริกตามแบบแผนเชิงความหมาย GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` แบบไม่บังคับ)
- `openclaw.model_call.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` เมื่อเป็นข้อผิดพลาดที่จัดประเภทแล้ว)
- `openclaw.model_call.request_bytes` (ฮิสโตแกรม, ขนาดไบต์ UTF-8 ของเพย์โหลดคำขอโมเดลสุดท้าย; ไม่มีเนื้อหาเพย์โหลดดิบ)
- `openclaw.model_call.response_bytes` (ฮิสโตแกรม, ขนาดไบต์ UTF-8 ของเหตุการณ์คำตอบโมเดลแบบสตรีม; ไม่มีเนื้อหาคำตอบดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (ฮิสโตแกรม, เวลาที่ผ่านไปก่อนเหตุการณ์คำตอบแบบสตรีมครั้งแรก)

### การไหลของข้อความ

- `openclaw.webhook.received` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### คิวและเซสชัน

- `openclaw.queue.lane.enqueue` (ตัวนับ, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (ตัวนับ, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (ฮิสโตแกรม, attrs: `openclaw.lane` หรือ `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (ฮิสโตแกรม, attrs: `openclaw.lane`)
- `openclaw.session.state` (ตัวนับ, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (ตัวนับ, attrs: `openclaw.state`; ส่งออกเฉพาะสำหรับการทำบัญชีเซสชันค้างที่ไม่มีงานทำงานอยู่)
- `openclaw.session.stuck_age_ms` (ฮิสโตแกรม, attrs: `openclaw.state`; ส่งออกเฉพาะสำหรับการทำบัญชีเซสชันค้างที่ไม่มีงานทำงานอยู่)
- `openclaw.run.attempt` (ตัวนับ, attrs: `openclaw.attempt`)

### เทเลเมทรีความมีชีวิตของเซสชัน

`diagnostics.stuckSessionWarnMs` คือเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับการวินิจฉัย
ความมีชีวิตของเซสชัน เซสชัน `processing` จะไม่นับอายุเข้าสู่เกณฑ์นี้
ขณะที่ OpenClaw สังเกตเห็นความคืบหน้าของคำตอบ เครื่องมือ สถานะ บล็อก หรือ
รันไทม์ ACP การส่งสัญญาณ keepalive ว่ากำลังพิมพ์จะไม่นับเป็นความคืบหน้า
ดังนั้นโมเดลหรือฮาร์เนสที่เงียบจึงยังตรวจพบได้

OpenClaw จัดประเภทเซสชันตามงานที่ยังสังเกตเห็นได้:

- `session.long_running`: งานแบบฝังตัวที่ทำงานอยู่ การเรียกโมเดล หรือการเรียกเครื่องมือ
  ยังมีความคืบหน้าอยู่
- `session.stalled`: มีงานที่ทำงานอยู่ แต่รันที่ทำงานอยู่ไม่ได้รายงาน
  ความคืบหน้าล่าสุด
- `session.stuck`: ข้อมูลการติดตามเซสชันที่ล้าสมัยโดยไม่มีงานที่ทำงานอยู่ นี่คือ
  การจัดประเภทความพร้อมทำงานเพียงแบบเดียวที่ปล่อยเลนเซสชันที่ได้รับผลกระทบ

มีเพียง `session.stuck` เท่านั้นที่ปล่อยตัวนับ `openclaw.session.stuck`,
ฮิสโตแกรม `openclaw.session.stuck_age_ms` และ span `openclaw.session.stuck`
การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะถอยระยะขณะที่เซสชันยังคง
ไม่เปลี่ยนแปลง ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นอย่างต่อเนื่องแทนที่จะเป็นทุก
จังหวะ Heartbeat สำหรับปุ่มปรับค่า config และค่าเริ่มต้น โปรดดู
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

## Span ที่ส่งออก

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` ตามค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อตกลงเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` ตามค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อตกลงเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` และ `openclaw.failureKind` แบบไม่บังคับเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (แฮชแบบจำกัดขนาดที่ใช้ SHA ของ id คำขอของผู้ให้บริการต้นทาง; id ดิบจะไม่ถูกส่งออก)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (ไม่มี prompt, history, response หรือเนื้อหา session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ไม่มีข้อความลูป params หรือเอาต์พุตเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

เมื่อเปิดใช้การจับเนื้อหาอย่างชัดเจน span ของโมเดลและเครื่องมือยังสามารถ
รวมแอตทริบิวต์ `openclaw.content.*` ที่ถูกจำกัดขนาดและแก้ไขข้อมูลอ่อนไหวแล้ว สำหรับคลาส
เนื้อหาเฉพาะที่คุณเลือกใช้

## แค็ตตาล็อกเหตุการณ์การวินิจฉัย

เหตุการณ์ด้านล่างรองรับ metrics และ span ข้างต้น Plugin ยังสามารถสมัครรับ
เหตุการณ์เหล่านี้โดยตรงได้โดยไม่ต้องส่งออก OTLP

**การใช้งานโมเดล**

- `model.usage` — โทเคน ค่าใช้จ่าย ระยะเวลา คอนเท็กซ์ ผู้ให้บริการ/โมเดล/ช่องทาง
  id เซสชัน `usage` คือการบัญชีตามผู้ให้บริการ/turn สำหรับค่าใช้จ่ายและ telemetry;
  `context.used` คือสแนปช็อต prompt/context ปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการเมื่อเกี่ยวข้องกับอินพุตที่แคชไว้หรือการเรียก tool-loop

**การไหลของข้อความ**

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
  วงจรชีวิตต่อรันสำหรับ agent harness รวม `harnessId`, `pluginId` แบบไม่บังคับ,
  ผู้ให้บริการ/โมเดล/ช่องทาง และ id รัน เมื่อเสร็จสมบูรณ์จะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` แบบไม่บังคับ, `yieldDetected`,
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` แบบไม่บังคับ

**Exec**

- `exec.process.completed` — ผลลัพธ์ปลายทาง ระยะเวลา เป้าหมาย โหมด exit
  code และชนิดความล้มเหลว ไม่รวมข้อความคำสั่งและไดเรกทอรีทำงาน

## โดยไม่มี exporter

คุณสามารถทำให้เหตุการณ์การวินิจฉัยพร้อมใช้งานสำหรับ Plugin หรือ sink แบบกำหนดเองได้โดยไม่ต้อง
เรียกใช้ `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุตดีบักแบบเจาะจงโดยไม่เพิ่ม `logging.level` ให้ใช้แฟล็กการวินิจฉัย
แฟล็กไม่สนตัวพิมพ์เล็กใหญ่และรองรับไวลด์การ์ด (เช่น `telegram.*` หรือ
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

หรือเป็นการ override env แบบใช้ครั้งเดียว:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

เอาต์พุตแฟล็กจะไปยังไฟล์บันทึกมาตรฐาน (`logging.file`) และยังคง
ถูกแก้ไขข้อมูลอ่อนไหวโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[แฟล็กการวินิจฉัย](/th/diagnostics/flags)

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถไม่ใส่ `diagnostics-otel` ไว้ใน `plugins.allow` หรือเรียกใช้
`openclaw plugins disable diagnostics-otel`

## ที่เกี่ยวข้อง

- [การบันทึก](/th/logging) — บันทึกไฟล์ เอาต์พุตคอนโซล การ tail ผ่าน CLI และแท็บบันทึกของ Control UI
- [รายละเอียดภายในของการบันทึก Gateway](/th/gateway/logging) — รูปแบบบันทึก WS, prefix ของระบบย่อย และการจับคอนโซล
- [แฟล็กการวินิจฉัย](/th/diagnostics/flags) — แฟล็กบันทึกดีบักแบบเจาะจง
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) — เครื่องมือ support-bundle สำหรับผู้ปฏิบัติงาน (แยกจากการส่งออก OTEL)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) — ข้อมูลอ้างอิงฟิลด์ `diagnostics.*` แบบครบถ้วน
