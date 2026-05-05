---
read_when:
    - คุณต้องการส่งข้อมูลการใช้งานโมเดลของ OpenClaw โฟลว์ข้อความ หรือเมตริกเซสชันไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อเทรซ เมตริก หรือบันทึกเข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่น
    - คุณต้องมีชื่อเมตริก ชื่อสแปน หรือรูปแบบของแอตทริบิวต์ที่แน่นอน เพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลการวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry ใดก็ได้ผ่าน Plugin diagnostics-otel (OTLP/HTTP)
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-05-05T06:17:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5030b8b16624f114e31838d3a055c24e8a23a6c77d63495a445cb9f2e227b6a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกข้อมูลวินิจฉัยผ่าน Plugin ทางการ `diagnostics-otel`
โดยใช้ **OTLP/HTTP (protobuf)** Collector หรือแบ็กเอนด์ใดก็ตามที่รองรับ OTLP/HTTP
จะใช้งานได้โดยไม่ต้องเปลี่ยนโค้ด สำหรับบันทึกไฟล์ในเครื่องและวิธีอ่าน โปรดดู
[การบันทึก](/th/logging)

## ภาพรวมการทำงานร่วมกัน

- **เหตุการณ์วินิจฉัย** คือเรคคอร์ดแบบมีโครงสร้างภายในโปรเซสที่ถูกปล่อยโดย
  Gateway และ Plugin ที่มาพร้อมชุดสำหรับการรันโมเดล โฟลว์ข้อความ เซสชัน คิว
  และ exec
- **Plugin `diagnostics-otel`** สมัครรับเหตุการณ์เหล่านั้นและส่งออกเป็น
  OpenTelemetry **metrics**, **traces** และ **logs** ผ่าน OTLP/HTTP
- **การเรียกผู้ให้บริการ** จะได้รับส่วนหัว W3C `traceparent` จากบริบท span
  การเรียกโมเดลที่เชื่อถือได้ของ OpenClaw เมื่อทรานสปอร์ตของผู้ให้บริการรองรับ
  ส่วนหัวกำหนดเอง บริบท trace ที่ Plugin ปล่อยออกมาจะไม่ถูกส่งต่อ
- Exporter จะแนบเฉพาะเมื่อทั้งพื้นผิววินิจฉัยและ Plugin ถูกเปิดใช้งาน
  ดังนั้นต้นทุนภายในโปรเซสจึงเกือบเป็นศูนย์โดยค่าเริ่มต้น

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

| สัญญาณ      | สิ่งที่อยู่ในสัญญาณ                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | ตัวนับและฮิสโตแกรมสำหรับการใช้โทเคน ต้นทุน ระยะเวลาการรัน โฟลว์ข้อความ เลนคิว สถานะเซสชัน exec และแรงกดดันหน่วยความจำ          |
| **Traces**  | Span สำหรับการใช้โมเดล การเรียกโมเดล วงจรชีวิต harness การรันเครื่องมือ exec การประมวลผล Webhook/ข้อความ การประกอบบริบท และลูปเครื่องมือ |
| **Logs**    | เรคคอร์ด `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP เมื่อเปิดใช้งาน `diagnostics.otel.logs`                                              |

สลับเปิดปิด `traces`, `metrics` และ `logs` ได้แยกกัน ทั้งสามอย่างเปิดโดยค่าเริ่มต้น
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | แทนที่ `diagnostics.otel.endpoint` หากค่ามี `/v1/traces`, `/v1/metrics` หรือ `/v1/logs` อยู่แล้ว จะใช้ค่านั้นตามเดิม                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | การแทนที่ปลายทางเฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์กำหนดค่า `diagnostics.otel.*Endpoint` ที่ตรงกัน การกำหนดค่าเฉพาะสัญญาณมีลำดับสูงกว่า env เฉพาะสัญญาณ ซึ่งมีลำดับสูงกว่าปลายทางร่วม                                     |
| `OTEL_SERVICE_NAME`                                                                                               | แทนที่ `diagnostics.otel.serviceName`                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | แทนที่ wire protocol (ปัจจุบันยอมรับเฉพาะ `http/protobuf`)                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งเป็น `gen_ai_latest_experimental` เพื่อปล่อยแอตทริบิวต์ span GenAI รุ่นทดลองล่าสุด (`gen_ai.provider.name`) แทน `gen_ai.system` แบบเดิม Metrics ของ GenAI จะใช้แอตทริบิวต์ semantic แบบจำกัดและมีคาร์ดินาลิตีต่ำเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งเป็น `1` เมื่อ preload หรือโปรเซสโฮสต์อื่นลงทะเบียน OpenTelemetry SDK แบบโกลบอลไว้แล้ว จากนั้น Plugin จะข้ามวงจรชีวิต NodeSDK ของตัวเอง แต่ยังคงต่อสาย listener วินิจฉัยและเคารพ `traces`/`metrics`/`logs`                |

## ความเป็นส่วนตัวและการจับเนื้อหา

เนื้อหาโมเดล/เครื่องมือดิบจะ **ไม่** ถูกส่งออกโดยค่าเริ่มต้น Span จะมีตัวระบุ
แบบจำกัดขอบเขต (ช่องทาง ผู้ให้บริการ โมเดล หมวดหมู่ข้อผิดพลาด ID คำขอแบบมีเฉพาะแฮช)
และจะไม่รวมข้อความ prompt ข้อความตอบกลับ อินพุตเครื่องมือ เอาต์พุตเครื่องมือ หรือ
คีย์เซสชัน

คำขอโมเดลขาออกอาจมีส่วนหัว W3C `traceparent` ส่วนหัวนั้นจะถูกสร้างจากบริบท
trace วินิจฉัยที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่ใช้งานอยู่เท่านั้น
ส่วนหัว `traceparent` ที่ผู้เรียกส่งมาเดิมจะถูกแทนที่ ดังนั้น Plugin หรือ
ตัวเลือกผู้ให้บริการแบบกำหนดเองจึงไม่สามารถปลอมลำดับบรรพบุรุษของ trace ข้ามบริการได้

ตั้งค่า `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อ Collector และ
นโยบายการเก็บรักษาของคุณได้รับอนุมัติสำหรับข้อความ prompt การตอบกลับ เครื่องมือ
หรือ system-prompt แล้ว แต่ละคีย์ย่อยเป็นการเลือกเปิดใช้แยกกัน:

- `inputMessages` — เนื้อหา prompt ของผู้ใช้
- `outputMessages` — เนื้อหาการตอบกลับของโมเดล
- `toolInputs` — payload อาร์กิวเมนต์เครื่องมือ
- `toolOutputs` — payload ผลลัพธ์เครื่องมือ
- `systemPrompt` — prompt ระบบ/นักพัฒนาที่ประกอบแล้ว

เมื่อเปิดใช้งานคีย์ย่อยใดก็ตาม Span ของโมเดลและเครื่องมือจะได้รับแอตทริบิวต์
`openclaw.content.*` แบบจำกัดขอบเขตและถูกปกปิดสำหรับคลาสนั้นเท่านั้น

## การสุ่มตัวอย่างและการ flush

- **Traces:** `diagnostics.otel.sampleRate` (เฉพาะ root-span, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด)
- **Metrics:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`)
- **Logs:** บันทึก OTLP เคารพ `logging.level` (ระดับบันทึกไฟล์) ใช้เส้นทางการปกปิด
  เรคคอร์ดบันทึกวินิจฉัย ไม่ใช่การจัดรูปแบบคอนโซล การติดตั้งที่มีปริมาณสูง
  ควรใช้การสุ่มตัวอย่าง/การกรองของ OTLP Collector แทนการสุ่มตัวอย่างในเครื่อง
- **การเชื่อมโยงบันทึกไฟล์:** บันทึกไฟล์ JSONL มี `traceId`, `spanId`,
  `parentSpanId` และ `traceFlags` ระดับบนสุดเมื่อการเรียกบันทึกมีบริบท trace
  วินิจฉัยที่ถูกต้อง ซึ่งช่วยให้ตัวประมวลผลบันทึกเชื่อมบรรทัดบันทึกในเครื่องกับ
  Span ที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP ของ Gateway และเฟรม WebSocket จะสร้างขอบเขต
  trace คำขอภายใน บันทึกและเหตุการณ์วินิจฉัยภายในขอบเขตนั้นจะสืบทอด trace คำขอ
  โดยค่าเริ่มต้น ขณะที่ Span การรัน agent และการเรียกโมเดลจะถูกสร้างเป็นลูก
  เพื่อให้ส่วนหัว `traceparent` ของผู้ให้บริการอยู่บน trace เดียวกัน

## Metrics ที่ส่งออก

### การใช้โมเดล

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, Metrics ตาม semantic conventions ของ GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, วินาที, Metrics ตาม semantic conventions ของ GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` เมื่อเป็นข้อผิดพลาดที่จัดประเภทแล้ว)
- `openclaw.model_call.request_bytes` (histogram, ขนาดไบต์ UTF-8 ของ payload คำขอโมเดลสุดท้าย; ไม่มีเนื้อหา payload ดิบ)
- `openclaw.model_call.response_bytes` (histogram, ขนาดไบต์ UTF-8 ของเหตุการณ์การตอบกลับโมเดลแบบสตรีม; ไม่มีเนื้อหาการตอบกลับดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, เวลาที่ผ่านไปก่อนเหตุการณ์การตอบกลับแบบสตรีมแรก)

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
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; ปล่อยเฉพาะสำหรับการทำบัญชีเซสชันค้างที่ไม่มีงานกำลังทำงานอยู่)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; ปล่อยเฉพาะสำหรับการทำบัญชีเซสชันค้างที่ไม่มีงานกำลังทำงานอยู่)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### เทเลเมทรีความมีชีวิตของเซสชัน

`diagnostics.stuckSessionWarnMs` คือค่าเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับการวินิจฉัย
ความมีชีวิตของเซสชัน เซสชัน `processing` จะไม่ถูกนับอายุเข้าสู่เกณฑ์นี้
ขณะที่ OpenClaw สังเกตเห็นความคืบหน้าของ reply, tool, status, block หรือ ACP runtime
การส่ง typing keepalive จะไม่นับเป็นความคืบหน้า ดังนั้นโมเดลหรือ harness ที่เงียบ
ยังคงถูกตรวจพบได้

OpenClaw จัดประเภทเซสชันตามงานที่ยังสังเกตเห็นได้:

- `session.long_running`: งานฝังตัวที่ใช้งานอยู่ การเรียกโมเดล หรือการเรียกเครื่องมือ
  ยังคงมีความคืบหน้าอยู่
- `session.stalled`: มีงานที่ใช้งานอยู่ แต่รันที่ใช้งานอยู่ไม่ได้รายงาน
  ความคืบหน้าล่าสุด รันฝังตัวที่ชะงักจะยังคงเป็นแบบสังเกตการณ์เท่านั้นในตอนแรก จากนั้น
  abort-drain หลังจาก `diagnostics.stuckSessionAbortMs` โดยไม่มีความคืบหน้า เพื่อให้เทิร์นที่รอคิว
  อยู่หลังเลนกลับมาทำงานต่อได้ เมื่อไม่ได้ตั้งค่า เกณฑ์การยกเลิกจะใช้ค่าเริ่มต้นเป็น
  ช่วงเวลาขยายที่ปลอดภัยกว่าอย่างน้อย 10 นาที และ 5 เท่าของ
  `diagnostics.stuckSessionWarnMs`
- `session.stuck`: การบันทึกสถานะเซสชันที่ค้างเก่าโดยไม่มีงานที่ใช้งานอยู่ รายการนี้จะปล่อย
  เลนเซสชันที่ได้รับผลกระทบทันที

การกู้คืนจะปล่อยอีเวนต์ `session.recovery.requested` และ
`session.recovery.completed` แบบมีโครงสร้าง สถานะเซสชันสำหรับการวินิจฉัยจะถูกทำเครื่องหมายว่า idle
หลังจากผลลัพธ์การกู้คืนที่เปลี่ยนแปลงสถานะ (`aborted` หรือ `released`) เท่านั้น และเฉพาะเมื่อ
รุ่นการประมวลผลเดียวกันยังคงเป็นรุ่นปัจจุบัน

เฉพาะ `session.stuck` เท่านั้นที่ปล่อยเคาน์เตอร์ `openclaw.session.stuck`,
ฮิสโตแกรม `openclaw.session.stuck_age_ms` และสแปน `openclaw.session.stuck`
การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะถอยระยะห่างออกไปขณะที่เซสชันยังคง
ไม่เปลี่ยนแปลง ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นต่อเนื่อง แทนที่จะแจ้งเตือนทุก
จังหวะ Heartbeat สำหรับปุ่มปรับแต่งการกำหนดค่าและค่าเริ่มต้น โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics)

### วงจรชีวิตของ harness

- `openclaw.harness.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อมีข้อผิดพลาด)

### Exec

- `openclaw.exec.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### กลไกภายในการวินิจฉัย (หน่วยความจำและลูปเครื่องมือ)

- `openclaw.memory.heap_used_bytes` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ฮิสโตแกรม)
- `openclaw.memory.pressure` (เคาน์เตอร์, แอตทริบิวต์: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (เคาน์เตอร์, แอตทริบิวต์: `openclaw.toolName`, `openclaw.outcome`)
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
  - `openclaw.errorCategory` และ `openclaw.failureKind` ที่ไม่บังคับ เมื่อมีข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (แฮชแบบจำกัดขอบเขตที่อิง SHA ของรหัสคำขอจากผู้ให้บริการต้นทาง; จะไม่ส่งออกรหัสดิบ)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - เมื่อเสร็จสมบูรณ์: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - เมื่อมีข้อผิดพลาด: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` ที่ไม่บังคับ
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

เมื่อเปิดใช้การจับเนื้อหาไว้อย่างชัดเจน สแปนของโมเดลและเครื่องมือยังสามารถ
รวมแอตทริบิวต์ `openclaw.content.*` แบบจำกัดขอบเขตและปกปิดข้อมูล สำหรับคลาสเนื้อหาเฉพาะ
ที่คุณเลือกใช้ได้ด้วย

## แคตตาล็อกอีเวนต์การวินิจฉัย

อีเวนต์ด้านล่างรองรับเมตริกและสแปนข้างต้น Plugin ยังสามารถสมัครรับ
อีเวนต์เหล่านี้ได้โดยตรงโดยไม่ต้องส่งออก OTLP

**การใช้งานโมเดล**

- `model.usage` — โทเค็น ค่าใช้จ่าย ระยะเวลา บริบท ผู้ให้บริการ/โมเดล/ช่องทาง
  รหัสเซสชัน `usage` คือการคิดบัญชีของผู้ให้บริการ/เทิร์นสำหรับค่าใช้จ่ายและเทเลเมทรี;
  `context.used` คือสแนปช็อตพรอมป์/บริบทปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการเมื่อมีอินพุตที่แคชไว้หรือการเรียกแบบลูปเครื่องมือเกี่ยวข้อง

**โฟลว์ข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (เคาน์เตอร์รวม: webhooks/queue/session)

**วงจรชีวิตของ harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  วงจรชีวิตรายรันสำหรับ agent harness รวม `harnessId`, `pluginId` ที่ไม่บังคับ
  ผู้ให้บริการ/โมเดล/ช่องทาง และรหัสรัน เมื่อเสร็จสมบูรณ์จะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ที่ไม่บังคับ, `yieldDetected`,
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` ที่ไม่บังคับ

**Exec**

- `exec.process.completed` — ผลลัพธ์ปลายทาง ระยะเวลา เป้าหมาย โหมด รหัสออก
  และชนิดความล้มเหลว จะไม่รวมข้อความคำสั่งและไดเรกทอรีทำงาน

## เมื่อไม่มี exporter

คุณสามารถทำให้อีเวนต์การวินิจฉัยพร้อมใช้งานสำหรับ Plugin หรือ sink แบบกำหนดเองได้โดยไม่ต้อง
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

หรือเป็นการแทนที่ด้วย env แบบครั้งเดียว:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

เอาต์พุตของแฟล็กจะไปยังไฟล์บันทึกมาตรฐาน (`logging.file`) และยังคงถูก
ปกปิดข้อมูลโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[แฟล็กการวินิจฉัย](/th/diagnostics/flags)

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถไม่ใส่ `diagnostics-otel` ไว้ใน `plugins.allow` หรือรัน
`openclaw plugins disable diagnostics-otel`

## ที่เกี่ยวข้อง

- [การบันทึก](/th/logging) — บันทึกไฟล์ เอาต์พุตคอนโซล การติดตามผ่าน CLI และแท็บ Logs ของ Control UI
- [กลไกภายในของการบันทึก Gateway](/th/gateway/logging) — สไตล์บันทึก WS คำนำหน้าระบบย่อย และการจับคอนโซล
- [แฟล็กการวินิจฉัย](/th/diagnostics/flags) — แฟล็กบันทึกดีบักแบบเจาะจง
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) — เครื่องมือ support-bundle สำหรับผู้ปฏิบัติงาน (แยกจากการส่งออก OTEL)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) — ข้อมูลอ้างอิงฟิลด์ `diagnostics.*` แบบครบถ้วน
