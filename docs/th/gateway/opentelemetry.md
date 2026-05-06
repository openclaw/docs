---
read_when:
    - คุณต้องการส่งข้อมูลการใช้งานโมเดลของ OpenClaw, โฟลว์ข้อความ, หรือเมตริกของเซสชันไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อเทรซ เมตริก หรือบันทึกเข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่น
    - คุณต้องใช้ชื่อเมตริก ชื่อสแปน หรือโครงสร้างแอตทริบิวต์ที่แน่นอนเพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry ใดก็ได้ผ่าน Plugin diagnostics-otel (OTLP/HTTP)
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T10:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกข้อมูลวินิจฉัยผ่าน Plugin ทางการ `diagnostics-otel`
โดยใช้ **OTLP/HTTP (protobuf)** collector หรือ backend ใดก็ตามที่รับ OTLP/HTTP
จะใช้งานได้โดยไม่ต้องเปลี่ยนโค้ด สำหรับ log ไฟล์ภายในเครื่องและวิธีอ่าน โปรดดู
[การบันทึก log](/th/logging).

## วิธีที่ทุกอย่างทำงานร่วมกัน

- **เหตุการณ์วินิจฉัย** คือ record แบบมีโครงสร้างภายใน process ที่ถูกส่งออกโดย
  Gateway และ Plugin ที่รวมมากับระบบ สำหรับการรันโมเดล, flow ของข้อความ, session, queue,
  และ exec.
- **Plugin `diagnostics-otel`** subscribe เหตุการณ์เหล่านั้นและส่งออกเป็น
  OpenTelemetry **metric**, **trace**, และ **log** ผ่าน OTLP/HTTP.
- **การเรียก provider** จะได้รับ header W3C `traceparent` จาก context ของ span
  การเรียกโมเดลที่ OpenClaw เชื่อถือ เมื่อ transport ของ provider รับ custom
  header ได้ context ของ trace ที่ Plugin ส่งออกจะไม่ถูก propagate.
- exporter จะ attach เฉพาะเมื่อทั้ง surface วินิจฉัยและ Plugin ถูกเปิดใช้งาน
  ดังนั้นค่าใช้จ่ายภายใน process จึงใกล้ศูนย์โดยค่าเริ่มต้น.

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
ปัจจุบัน `protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น `grpc` จะถูกละเว้น.
</Note>

## Signal ที่ส่งออก

| Signal      | สิ่งที่อยู่ภายใน                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | counter และ histogram สำหรับการใช้ token, cost, ระยะเวลาการรัน, flow ของข้อความ, เหตุการณ์ Talk, lane ของ queue, สถานะ/การกู้คืน session, exec, และแรงกดดันหน่วยความจำ. |
| **Traces**  | span สำหรับการใช้โมเดล, การเรียกโมเดล, lifecycle ของ harness, การดำเนินการ tool, exec, การประมวลผล webhook/ข้อความ, การประกอบ context, และ loop ของ tool.              |
| **Logs**    | record `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP เมื่อเปิดใช้งาน `diagnostics.otel.logs`.                                                           |

เปิดหรือปิด `traces`, `metrics`, และ `logs` ได้อย่างอิสระ ทั้งสามค่าเปิดเป็นค่าเริ่มต้น
เมื่อ `diagnostics.otel.enabled` เป็น true.

## อ้างอิงการตั้งค่า

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | override `diagnostics.otel.endpoint` หากค่ามี `/v1/traces`, `/v1/metrics`, หรือ `/v1/logs` อยู่แล้ว จะใช้ค่านั้นตามเดิม.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | override endpoint เฉพาะ signal ที่ใช้เมื่อยังไม่ได้ตั้งค่า config key `diagnostics.otel.*Endpoint` ที่ตรงกัน config เฉพาะ signal ชนะ env เฉพาะ signal ซึ่งชนะ endpoint ร่วม.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | override `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | override wire protocol (วันนี้รองรับเฉพาะ `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งเป็น `gen_ai_latest_experimental` เพื่อส่งออก attribute span GenAI รุ่นทดลองล่าสุด (`gen_ai.provider.name`) แทน `gen_ai.system` แบบ legacy metric GenAI จะใช้ attribute เชิงความหมายที่มีขอบเขตและ cardinality ต่ำเสมอไม่ว่าอย่างไรก็ตาม. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งเป็น `1` เมื่อ preload หรือ host process อื่นลงทะเบียน OpenTelemetry SDK แบบ global ไว้แล้ว จากนั้น Plugin จะข้าม lifecycle NodeSDK ของตัวเอง แต่ยังเชื่อม listener วินิจฉัยและเคารพ `traces`/`metrics`/`logs`.                |

## ความเป็นส่วนตัวและการ capture เนื้อหา

เนื้อหาดิบของโมเดล/tool จะ **ไม่** ถูกส่งออกโดยค่าเริ่มต้น span จะมีตัวระบุที่มีขอบเขต
(channel, provider, model, หมวดหมู่ error, request id แบบ hash เท่านั้น)
และจะไม่รวมข้อความ prompt, ข้อความตอบกลับ, input ของ tool, output ของ tool, หรือ
key ของ session.
metric ของ Talk ส่งออกเฉพาะ metadata เหตุการณ์ที่มีขอบเขต เช่น mode, transport,
provider, และประเภทเหตุการณ์ โดยจะไม่รวม transcript, payload เสียง,
session id, turn id, call id, room id, หรือ token สำหรับ handoff.

request โมเดลขาออกอาจรวม header W3C `traceparent` header นั้น
สร้างจาก context trace วินิจฉัยที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่ active เท่านั้น
header `traceparent` ที่ผู้เรียกส่งมาก่อนจะถูกแทนที่ ดังนั้น Plugin หรือ
ตัวเลือก provider แบบกำหนดเองจึงปลอม ancestry ของ trace ข้าม service ไม่ได้.

ตั้งค่า `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อ collector และ
นโยบาย retention ของคุณได้รับอนุมัติสำหรับข้อความ prompt, response, tool, หรือ
system-prompt แต่ละ subkey เป็น opt-in อย่างอิสระ:

- `inputMessages` - เนื้อหา prompt ของผู้ใช้.
- `outputMessages` - เนื้อหาคำตอบของโมเดล.
- `toolInputs` - payload argument ของ tool.
- `toolOutputs` - payload ผลลัพธ์ของ tool.
- `systemPrompt` - prompt system/developer ที่ประกอบแล้ว.

เมื่อเปิดใช้งาน subkey ใดก็ตาม span ของโมเดลและ tool จะได้รับ attribute
`openclaw.content.*` ที่มีขอบเขตและถูก redact สำหรับ class นั้นเท่านั้น.

## Sampling และ flushing

- **Traces:** `diagnostics.otel.sampleRate` (เฉพาะ root-span, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`).
- **Logs:** log OTLP เคารพ `logging.level` (ระดับ log ของไฟล์) โดยใช้ path การ redact
  log-record วินิจฉัย ไม่ใช่การจัดรูปแบบ console การติดตั้งที่มี volume สูง
  ควรใช้ sampling/filtering ของ collector OTLP แทน sampling ภายในเครื่อง.
- **การ correlate file-log:** log ไฟล์ JSONL รวม `traceId`,
  `spanId`, `parentSpanId`, และ `traceFlags` ระดับบนสุด เมื่อการเรียก log มี
  context trace วินิจฉัยที่ถูกต้อง ซึ่งช่วยให้ log processor เชื่อมบรรทัด log ภายในเครื่องกับ
  span ที่ส่งออกได้.
- **การ correlate request:** request HTTP ของ Gateway และ frame WebSocket สร้าง
  scope trace ของ request ภายใน log และเหตุการณ์วินิจฉัยใน scope นั้น
  จะสืบทอด trace ของ request โดยค่าเริ่มต้น ขณะที่ span การรัน agent และการเรียกโมเดล
  จะถูกสร้างเป็น child เพื่อให้ header `traceparent` ของ provider อยู่บน trace เดียวกัน.

## Metric ที่ส่งออก

### การใช้โมเดล

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metric ตาม semantic-conventions ของ GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, วินาที, metric ตาม semantic-conventions ของ GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` แบบ optional)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` บน error ที่ถูกจัดประเภท)
- `openclaw.model_call.request_bytes` (histogram, ขนาด byte UTF-8 ของ payload request โมเดลสุดท้าย; ไม่มีเนื้อหา payload ดิบ)
- `openclaw.model_call.response_bytes` (histogram, ขนาด byte UTF-8 ของเหตุการณ์ response โมเดลแบบ streamed; ไม่มีเนื้อหา response ดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, เวลาที่ผ่านไปก่อนเหตุการณ์ response แบบ streamed แรก)

### Flow ของข้อความ

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
- `openclaw.talk.event.duration_ms` (histogram, attrs: เหมือนกับ `openclaw.talk.event`; ส่งออกเมื่อเหตุการณ์ Talk รายงานระยะเวลา)
- `openclaw.talk.audio.bytes` (histogram, attrs: เหมือนกับ `openclaw.talk.event`; ส่งออกสำหรับเหตุการณ์ frame เสียง Talk ที่รายงานความยาว byte)

### Queue และ session

- `openclaw.queue.lane.enqueue` (ตัวนับ, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (ตัวนับ, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.queue.depth` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.lane` หรือ `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.session.state` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (ตัวนับ, แอตทริบิวต์: `openclaw.state`; ปล่อยออกมาเฉพาะสำหรับการทำบัญชีเซสชันค้างที่ไม่มีงานที่ทำงานอยู่)
- `openclaw.session.stuck_age_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.state`; ปล่อยออกมาเฉพาะสำหรับการทำบัญชีเซสชันค้างที่ไม่มีงานที่ทำงานอยู่)
- `openclaw.session.recovery.requested` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับตัวนับการกู้คืนที่ตรงกัน)
- `openclaw.run.attempt` (ตัวนับ, แอตทริบิวต์: `openclaw.attempt`)

### เทเลเมทรีความพร้อมทำงานของเซสชัน

`diagnostics.stuckSessionWarnMs` คือเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับการวินิจฉัย
ความพร้อมทำงานของเซสชัน เซสชัน `processing` จะไม่ถูกนับอายุเข้าสู่เกณฑ์นี้
ขณะที่ OpenClaw สังเกตเห็นความคืบหน้าของการตอบกลับ เครื่องมือ สถานะ บล็อก หรือรันไทม์ ACP
การส่ง keepalive ระหว่างพิมพ์ไม่นับเป็นความคืบหน้า ดังนั้นโมเดลหรือ harness ที่เงียบ
ยังสามารถถูกตรวจพบได้

OpenClaw จัดประเภทเซสชันตามงานที่ยังสังเกตเห็นได้:

- `session.long_running`: งานแบบฝังตัวที่ทำงานอยู่ การเรียกโมเดล หรือการเรียกเครื่องมือ
  ยังมีความคืบหน้าอยู่
- `session.stalled`: มีงานที่ทำงานอยู่ แต่ run ที่ทำงานอยู่ไม่ได้รายงาน
  ความคืบหน้าล่าสุด run แบบฝังตัวที่หยุดชะงักจะอยู่ในโหมดสังเกตอย่างเดียวในตอนแรก จากนั้น
  abort-drain หลัง `diagnostics.stuckSessionAbortMs` โดยไม่มีความคืบหน้า เพื่อให้ turn ที่อยู่ในคิว
  ด้านหลัง lane สามารถทำงานต่อได้ เมื่อไม่ได้ตั้งค่า เกณฑ์การ abort จะใช้ค่าเริ่มต้นเป็น
  หน้าต่างเวลาขยายที่ปลอดภัยกว่าอย่างน้อย 10 นาที และ 5 เท่าของ
  `diagnostics.stuckSessionWarnMs`
- `session.stuck`: การทำบัญชีเซสชันค้างที่ไม่มีงานที่ทำงานอยู่ การทำเช่นนี้จะปล่อย
  lane ของเซสชันที่ได้รับผลทันที

การกู้คืนจะปล่อยอีเวนต์ `session.recovery.requested` และ
`session.recovery.completed` แบบมีโครงสร้าง สถานะเซสชันวินิจฉัยจะถูกทำเครื่องหมายเป็น idle
เฉพาะหลังจากผลลัพธ์การกู้คืนที่เปลี่ยนแปลงสถานะ (`aborted` หรือ `released`) และเฉพาะเมื่อ
generation การประมวลผลเดียวกันยังเป็นปัจจุบันอยู่

มีเพียง `session.stuck` เท่านั้นที่ปล่อยตัวนับ `openclaw.session.stuck`,
ฮิสโตแกรม `openclaw.session.stuck_age_ms` และ span `openclaw.session.stuck`
การวินิจฉัย `session.stuck` ซ้ำจะ back off ขณะที่เซสชันยังคงไม่เปลี่ยนแปลง
ดังนั้นแดชบอร์ดควรแจ้งเตือนจากการเพิ่มขึ้นอย่างต่อเนื่อง แทนที่จะเป็นทุก
tick ของ Heartbeat สำหรับปุ่มปรับค่า config และค่าเริ่มต้น ดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics)

### วงจรชีวิตของ harness

- `openclaw.harness.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อเกิดข้อผิดพลาด)

### Exec

- `openclaw.exec.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### รายละเอียดภายในของการวินิจฉัย (หน่วยความจำและลูปเครื่องมือ)

- `openclaw.memory.heap_used_bytes` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ฮิสโตแกรม)
- `openclaw.memory.pressure` (ตัวนับ, แอตทริบิวต์: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (ตัวนับ, แอตทริบิวต์: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.toolName`, `openclaw.outcome`)

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
  - `openclaw.errorCategory` และ `openclaw.failureKind` ที่ไม่บังคับเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (แฮชที่มีขอบเขตและอิงตาม SHA ของ id คำขอของผู้ให้บริการต้นทาง; จะไม่ส่งออก id ดิบ)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - เมื่อเสร็จสมบูรณ์: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (ไม่มีเนื้อหา prompt, history, response หรือ session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ไม่มีข้อความในลูป, params หรือเอาต์พุตของเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

เมื่อเปิดใช้การจับเนื้อหาอย่างชัดเจน span ของโมเดลและเครื่องมือยังสามารถ
รวมแอตทริบิวต์ `openclaw.content.*` ที่มีขอบเขตและถูกปกปิดข้อมูล สำหรับคลาส
เนื้อหาเฉพาะที่คุณเลือกใช้ได้ด้วย

## แค็ตตาล็อกอีเวนต์วินิจฉัย

อีเวนต์ด้านล่างรองรับ metric และ span ด้านบน Plugins ยังสามารถ subscribe
กับอีเวนต์เหล่านี้โดยตรงได้โดยไม่ต้องส่งออก OTLP

**การใช้งานโมเดล**

- `model.usage` - โทเค็น, ค่าใช้จ่าย, ระยะเวลา, context, provider/model/channel,
  id เซสชัน `usage` คือบัญชีของ provider/turn สำหรับค่าใช้จ่ายและเทเลเมทรี;
  `context.used` คือสแนปช็อต prompt/context ปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการ เมื่อมีอินพุตที่แคชไว้หรือการเรียก tool-loop เข้ามาเกี่ยวข้อง

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
  วงจรชีวิตต่อ run สำหรับ harness ของเอเจนต์ รวม `harnessId`, `pluginId` ที่ไม่บังคับ,
  provider/model/channel และ run id เมื่อเสร็จสมบูรณ์จะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ที่ไม่บังคับ, `yieldDetected`,
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` ที่ไม่บังคับ

**Exec**

- `exec.process.completed` - ผลลัพธ์เทอร์มินัล, ระยะเวลา, เป้าหมาย, โหมด, exit
  code และชนิดความล้มเหลว ไม่รวมข้อความคำสั่งและไดเรกทอรีทำงาน

## เมื่อไม่มี exporter

คุณสามารถเก็บอีเวนต์วินิจฉัยไว้ให้ Plugins หรือ sink แบบกำหนดเองใช้งานได้โดยไม่ต้อง
เรียกใช้ `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุต debug แบบเจาะจงโดยไม่เพิ่ม `logging.level` ให้ใช้แฟล็ก diagnostics
แฟล็กไม่สนใจตัวพิมพ์เล็กใหญ่และรองรับ wildcard (เช่น `telegram.*` หรือ
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

หรือใช้เป็นการ override ด้วย env แบบครั้งเดียว:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

เอาต์พุตของแฟล็กจะไปยังไฟล์ log มาตรฐาน (`logging.file`) และยังคงถูก
ปกปิดข้อมูลโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[แฟล็ก Diagnostics](/th/diagnostics/flags)

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถไม่ใส่ `diagnostics-otel` ไว้ใน `plugins.allow` หรือเรียกใช้
`openclaw plugins disable diagnostics-otel` ได้

## ที่เกี่ยวข้อง

- [Logging](/th/logging) - ไฟล์ log, เอาต์พุตคอนโซล, การ tail ผ่าน CLI และแท็บ Logs ของ Control UI
- [รายละเอียดภายในของ Gateway logging](/th/gateway/logging) - รูปแบบ log ของ WS, prefix ของระบบย่อย และการจับคอนโซล
- [แฟล็ก Diagnostics](/th/diagnostics/flags) - แฟล็ก debug-log แบบเจาะจง
- [การส่งออก Diagnostics](/th/gateway/diagnostics) - เครื่องมือ support-bundle สำหรับผู้ปฏิบัติการ (แยกจากการส่งออก OTEL)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) - ข้อมูลอ้างอิงฟิลด์ `diagnostics.*` ฉบับเต็ม
