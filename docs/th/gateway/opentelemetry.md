---
read_when:
    - คุณต้องการส่งการใช้งานโมเดล OpenClaw, โฟลว์ข้อความ หรือเมตริกเซสชันไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อ traces, metrics หรือ logs เข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่นๆ
    - คุณต้องใช้ชื่อเมตริก ชื่อ span หรือรูปแบบ attribute ที่แน่นอนเพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry หรือ stdout JSONL ผ่าน Plugin diagnostics-otel
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-06-27T17:36:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกข้อมูลวินิจฉัยผ่าน Plugin ทางการ `diagnostics-otel`
โดยใช้ **OTLP/HTTP (protobuf)** นอกจากนี้ยังสามารถเขียน log เป็น stdout JSONL
สำหรับ pipeline log ของ container และ sandbox ได้ด้วย collector หรือ backend ใด ๆ ที่รับ
OTLP/HTTP สามารถใช้งานได้โดยไม่ต้องเปลี่ยนโค้ด สำหรับ log ไฟล์ในเครื่องและวิธีอ่าน
ดู [การบันทึก log](/th/logging)

## การทำงานร่วมกัน

- **เหตุการณ์วินิจฉัย** คือระเบียนแบบมีโครงสร้างภายใน process ที่ Gateway
  และ Plugin ที่มากับชุดส่งออกสำหรับการรันโมเดล, message flow, session, queue,
  และ exec
- **Plugin `diagnostics-otel`** subscribe เหตุการณ์เหล่านั้นและส่งออกเป็น
  OpenTelemetry **metrics**, **traces**, และ **logs** ผ่าน OTLP/HTTP และยังสามารถ
  mirror ระเบียน diagnostic log ไปยัง stdout JSONL ได้ด้วย
- **การเรียก provider** จะได้รับ header W3C `traceparent` จาก span context
  ของการเรียกโมเดลที่ OpenClaw ไว้วางใจ เมื่อ transport ของ provider รับ header
  แบบกำหนดเองได้ trace context ที่ Plugin ส่งออกจะไม่ถูก propagate
- exporter จะ attach เฉพาะเมื่อทั้ง diagnostics surface และ Plugin เปิดใช้งานอยู่
  ดังนั้นค่าใช้จ่ายภายใน process จึงใกล้ศูนย์โดยค่าเริ่มต้น

## เริ่มต้นอย่างรวดเร็ว

สำหรับการติดตั้งแบบ package ให้ติดตั้ง Plugin ก่อน:

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

คุณยังสามารถเปิดใช้งาน Plugin จาก CLI ได้ด้วย:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
ปัจจุบัน `protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น `grpc` จะถูกละเว้น
</Note>

## สัญญาณที่ส่งออก

| สัญญาณ      | สิ่งที่อยู่ในสัญญาณ                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | counter และ histogram สำหรับการใช้ token, ค่าใช้จ่าย, ระยะเวลาการรัน, failover, การใช้ skill, message flow, เหตุการณ์ Talk, lane ของ queue, สถานะ/การกู้คืน session, การรัน tool, payload ที่มีขนาดใหญ่เกินไป, exec, และแรงกดดันหน่วยความจำ |
| **Traces**  | span สำหรับการใช้โมเดล, การเรียกโมเดล, lifecycle ของ harness, การใช้ skill, การรัน tool, exec, การประมวลผล webhook/message, การประกอบ context, และ loop ของ tool                                                            |
| **Logs**    | ระเบียน `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP หรือ stdout JSONL เมื่อเปิดใช้ `diagnostics.otel.logs`; เนื้อหา log จะถูกกันไว้ เว้นแต่จะเปิดใช้การจับเนื้อหาอย่างชัดเจน                                |

สลับเปิดปิด `traces`, `metrics`, และ `logs` ได้แยกจากกัน Traces และ metrics
เปิดอยู่โดยค่าเริ่มต้นเมื่อ `diagnostics.otel.enabled` เป็น true Logs ปิดอยู่โดยค่าเริ่มต้น
และจะส่งออกเฉพาะเมื่อ `diagnostics.otel.logs` เป็น `true` อย่างชัดเจน การส่งออก log
ใช้ OTLP โดยค่าเริ่มต้น; ตั้งค่า `diagnostics.otel.logsExporter` เป็น `stdout` สำหรับ JSONL บน
stdout หรือ `both` เพื่อส่งระเบียน diagnostic log แต่ละรายการไปยังทั้ง OTLP และ stdout

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
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
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

### ตัวแปรสภาพแวดล้อม

| ตัวแปร                                                                                                          | วัตถุประสงค์                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | override `diagnostics.otel.endpoint` หากค่ามี `/v1/traces`, `/v1/metrics`, หรือ `/v1/logs` อยู่แล้ว จะใช้ค่านั้นตามเดิม                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | endpoint override เฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่า config key `diagnostics.otel.*Endpoint` ที่ตรงกัน config เฉพาะสัญญาณมีลำดับความสำคัญเหนือ env เฉพาะสัญญาณ และ env เฉพาะสัญญาณมีลำดับความสำคัญเหนือ endpoint ร่วม                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | override `diagnostics.otel.serviceName`                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | override wire protocol (ปัจจุบันรองรับเฉพาะ `http/protobuf`)                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งเป็น `gen_ai_latest_experimental` เพื่อส่งออก span shape การอนุมาน GenAI แบบทดลองล่าสุด รวมถึงชื่อ span `{gen_ai.operation.name} {gen_ai.request.model}`, span kind `CLIENT`, และ `gen_ai.provider.name` แทน `gen_ai.system` แบบเดิม metric ของ GenAI ใช้ semantic attribute ที่มีขอบเขตและ cardinality ต่ำเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งเป็น `1` เมื่อ preload อื่นหรือ host process ได้ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว Plugin จะข้าม lifecycle ของ NodeSDK ของตัวเอง แต่ยังคง wire diagnostic listener และเคารพ `traces`/`metrics`/`logs`                                                                                                                    |

## ความเป็นส่วนตัวและการจับเนื้อหา

เนื้อหาโมเดล/tool แบบดิบจะ **ไม่** ถูกส่งออกโดยค่าเริ่มต้น Span จะมี identifier
ที่มีขอบเขต (channel, provider, model, หมวดหมู่ error, request id แบบ hash-only,
แหล่งที่มาของ tool, เจ้าของ tool, และชื่อ/แหล่งที่มาของ skill) และจะไม่รวม prompt text,
response text, tool input, tool output, path ไฟล์ของ skill, หรือ session key
ระเบียน log ของ OTLP จะเก็บ severity, logger, ตำแหน่งโค้ด, trace context ที่ไว้วางใจได้,
และ attribute ที่ sanitize แล้วโดยค่าเริ่มต้น แต่เนื้อหา message body ของ log แบบดิบจะถูกส่งออก
เฉพาะเมื่อ `diagnostics.otel.captureContent` ถูกตั้งเป็น boolean `true` เท่านั้น subkey แบบละเอียด
`captureContent.*` จะไม่เปิดใช้ log body label ที่ดูเหมือน scoped agent session key
จะถูกแทนที่ด้วย `unknown`
metric ของ Talk ส่งออกเฉพาะ metadata เหตุการณ์ที่มีขอบเขต เช่น mode, transport,
provider, และ event type โดยไม่รวม transcript, audio payload,
session id, turn id, call id, room id, หรือ handoff token

คำขอโมเดลขาออกอาจมี header W3C `traceparent` header นั้นจะถูกสร้าง
จาก diagnostic trace context ที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่ active เท่านั้น
header `traceparent` ที่ caller ส่งมาเดิมจะถูกแทนที่ ดังนั้น Plugin หรือ
option ของ provider แบบกำหนดเองจะปลอมแปลง ancestry ของ trace ข้าม service ไม่ได้

ตั้งค่า `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อ collector และ
นโยบายการเก็บรักษาของคุณได้รับอนุมัติสำหรับ prompt, response, tool, หรือ system-prompt
text แล้ว subkey แต่ละรายการเป็นแบบ opt-in แยกจากกัน:

- `inputMessages` - เนื้อหา prompt ของผู้ใช้
- `outputMessages` - เนื้อหา response ของโมเดล
- `toolInputs` - payload argument ของ tool
- `toolOutputs` - payload ผลลัพธ์ของ tool
- `systemPrompt` - prompt system/developer ที่ประกอบแล้ว
- `toolDefinitions` - ชื่อ tool, คำอธิบาย, และ schema ของโมเดล

เมื่อเปิดใช้ subkey ใด ๆ span ของโมเดลและ tool จะได้รับ attribute
`openclaw.content.*` ที่มีขอบเขตและ redact แล้วสำหรับ class นั้นเท่านั้น ใช้ boolean
`captureContent: true` เฉพาะสำหรับการจับ diagnostics แบบกว้างที่ message body ของ OTLP log
ได้รับอนุมัติให้ส่งออกด้วย

เนื้อหา `toolInputs`/`toolOutputs` จะถูกจับสำหรับการรัน tool ของ agent runtime
ในตัว (`openclaw.content.tool_input` บน span ที่ completed/error,
`openclaw.content.tool_output` บน span ที่ completed) การเรียก tool ของ harness ภายนอก
(Codex, Claude CLI) จะส่ง span `tool.execution.*` โดยไม่มี content payload
เนื้อหาที่จับได้จะเดินทางบน channel ที่ไว้วางใจได้และเป็น listener-only และจะไม่ถูกวาง
บน diagnostic event bus สาธารณะ

## การสุ่มตัวอย่างและการ flush

- **Traces:** `diagnostics.otel.sampleRate` (เฉพาะ root-span, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด)
- **Metrics:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`)
- **Logs:** OTLP logs เคารพ `logging.level` (file log level) โดยใช้
  path การ redact ของ diagnostic log-record ไม่ใช่การจัดรูปแบบ console การติดตั้งที่มี volume สูง
  ควรใช้การ sampling/filtering ที่ OTLP collector มากกว่าการ sampling ในเครื่อง
  ตั้งค่า `diagnostics.otel.logsExporter: "stdout"` เมื่อแพลตฟอร์มของคุณ
  ส่ง stdout/stderr ไปยัง log processor อยู่แล้วและคุณไม่มี OTLP logs
  collector ระเบียน stdout เป็น JSON object หนึ่งรายการต่อบรรทัด พร้อม `ts`, `signal`,
  `service.name`, severity, body, attribute ที่ redact แล้ว, และ field trace ที่ไว้วางใจได้
  เมื่อมีให้ใช้
- **การเชื่อมโยง file-log:** JSONL file logs มี `traceId`,
  `spanId`, `parentSpanId`, และ `traceFlags` ระดับบนสุดเมื่อการเรียก log มี
  diagnostic trace context ที่ถูกต้อง ทำให้ log processor join บรรทัด log ในเครื่องกับ
  span ที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP ของ Gateway และ WebSocket frame จะสร้าง
  internal request trace scope Log และ diagnostic event ภายใน scope นั้น
  จะสืบทอด request trace โดยค่าเริ่มต้น ขณะที่ span ของ agent run และ model-call
  ถูกสร้างเป็น child เพื่อให้ header `traceparent` ของ provider อยู่บน trace เดียวกัน

## metric ที่ส่งออก

### การใช้โมเดล

- `openclaw.tokens` (ตัวนับ, แอตทริบิวต์: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (ฮิสโตแกรม, เมตริกตาม semantic conventions ของ GenAI, แอตทริบิวต์: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (ฮิสโตแกรม, วินาที, เมตริกตาม semantic conventions ของ GenAI, แอตทริบิวต์: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` แบบไม่บังคับ)
- `openclaw.model_call.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` บนข้อผิดพลาดที่จัดประเภทแล้ว)
- `openclaw.model_call.request_bytes` (ฮิสโตแกรม, ขนาดไบต์ UTF-8 ของเพย์โหลดคำขอโมเดลสุดท้าย; ไม่มีเนื้อหาเพย์โหลดดิบ)
- `openclaw.model_call.response_bytes` (ฮิสโตแกรม, ขนาดไบต์ UTF-8 ของเพย์โหลดชังก์การตอบกลับแบบสตรีม; ข้อความความถี่สูง, การคิด, และเดลตาของการเรียกเครื่องมือจะนับเฉพาะไบต์ `delta` ที่เพิ่มขึ้น; ไม่มีเนื้อหาการตอบกลับดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (ฮิสโตแกรม, เวลาที่ผ่านไปก่อนเหตุการณ์การตอบกลับแบบสตรีมแรก)
- `openclaw.model.failover` (ตัวนับ, แอตทริบิวต์: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (ตัวนับ, แอตทริบิวต์: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` แบบไม่บังคับ, `openclaw.toolName` แบบไม่บังคับ)

### โฟลว์ข้อความ

- `openclaw.webhook.received` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### การพูดคุย

- `openclaw.talk.event` (ตัวนับ, แอตทริบิวต์: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับ `openclaw.talk.event`; ปล่อยออกมาเมื่อเหตุการณ์การพูดคุยรายงานระยะเวลา)
- `openclaw.talk.audio.bytes` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับ `openclaw.talk.event`; ปล่อยออกมาสำหรับเหตุการณ์เฟรมเสียงการพูดคุยที่รายงานความยาวไบต์)

### คิวและเซสชัน

- `openclaw.queue.lane.enqueue` (ตัวนับ, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (ตัวนับ, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.queue.depth` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.lane` หรือ `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.session.state` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (ตัวนับ, แอตทริบิวต์: `openclaw.state`; ปล่อยออกมาสำหรับการทำบัญชีเซสชันเก่าที่กู้คืนได้)
- `openclaw.session.stuck_age_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.state`; ปล่อยออกมาสำหรับการทำบัญชีเซสชันเก่าที่กู้คืนได้)
- `openclaw.session.turn.created` (ตัวนับ, แอตทริบิวต์: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับตัวนับการกู้คืนที่ตรงกัน)
- `openclaw.run.attempt` (ตัวนับ, แอตทริบิวต์: `openclaw.attempt`)

### เทเลเมทรีความมีชีวิตของเซสชัน

`diagnostics.stuckSessionWarnMs` คือเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับการวินิจฉัยความมีชีวิตของเซสชัน เซสชัน `processing` จะไม่นับอายุเข้าหาเกณฑ์นี้ขณะที่ OpenClaw สังเกตเห็นความคืบหน้าของการตอบกลับ, เครื่องมือ, สถานะ, บล็อก หรือรันไทม์ ACP การส่งสัญญาณว่ายังพิมพ์อยู่ไม่นับเป็นความคืบหน้า ดังนั้นโมเดลหรือฮาร์เนสที่เงียบยังคงตรวจพบได้

OpenClaw จัดประเภทเซสชันตามงานที่ยังสามารถสังเกตเห็นได้:

- `session.long_running`: งานแบบฝังตัวที่ใช้งานอยู่, การเรียกโมเดล หรือการเรียกเครื่องมือยังคงคืบหน้าอยู่ การเรียกโมเดลที่มีเจ้าของซึ่งเงียบนานเกิน `diagnostics.stuckSessionWarnMs` จะรายงานเป็นงานที่ใช้เวลานานก่อน `diagnostics.stuckSessionAbortMs` ด้วย เพื่อให้ผู้ให้บริการโมเดลที่ช้าหรือไม่สตรีมไม่ดูเหมือนเซสชัน Gateway ที่ค้างขณะที่ยังสามารถสังเกตการยกเลิกได้
- `session.stalled`: มีงานที่ใช้งานอยู่ แต่การรันที่ใช้งานอยู่ไม่ได้รายงานความคืบหน้าล่าสุด การเรียกโมเดลที่มีเจ้าของจะเปลี่ยนจาก `session.long_running` เป็น `session.stalled` ที่หรือหลัง `diagnostics.stuckSessionAbortMs`; กิจกรรมโมเดล/เครื่องมือเก่าที่ไม่มีเจ้าของจะไม่ถือว่าเป็นงานที่ใช้เวลานานซึ่งไม่มีอันตราย การรันแบบฝังตัวที่ค้างจะอยู่ในโหมดสังเกตอย่างเดียวในตอนแรก จากนั้นยกเลิกและระบายหลัง `diagnostics.stuckSessionAbortMs` โดยไม่มีความคืบหน้า เพื่อให้เทิร์นที่อยู่ในคิวด้านหลัง lane กลับมาทำงานต่อได้ เมื่อไม่ได้ตั้งค่า เกณฑ์การยกเลิกจะใช้ค่าเริ่มต้นเป็นหน้าต่างเวลาขยายที่ปลอดภัยกว่าอย่างน้อย 5 นาทีและ 3 เท่าของ `diagnostics.stuckSessionWarnMs`
- `session.stuck`: การทำบัญชีเซสชันเก่าโดยไม่มีงานที่ใช้งานอยู่ หรือเซสชันในคิวที่ว่างพร้อมกิจกรรมโมเดล/เครื่องมือเก่าที่ไม่มีเจ้าของ การทำเช่นนี้จะปล่อย lane ของเซสชันที่ได้รับผลกระทบทันทีหลังจากผ่านเกตการกู้คืน

การกู้คืนจะปล่อยเหตุการณ์ `session.recovery.requested` และ `session.recovery.completed` แบบมีโครงสร้าง สถานะเซสชันสำหรับการวินิจฉัยจะถูกทำเครื่องหมายว่าว่างเฉพาะหลังผลลัพธ์การกู้คืนที่มีการเปลี่ยนแปลง (`aborted` หรือ `released`) และเฉพาะเมื่อ generation การประมวลผลเดียวกันยังคงเป็นปัจจุบัน

เฉพาะ `session.stuck` เท่านั้นที่ปล่อยตัวนับ `openclaw.session.stuck`, ฮิสโตแกรม `openclaw.session.stuck_age_ms` และ span `openclaw.session.stuck` การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะถอยช่วงขณะที่เซสชันยังไม่เปลี่ยนแปลง ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นอย่างต่อเนื่อง แทนที่จะแจ้งทุก tick ของ Heartbeat สำหรับ knob การกำหนดค่าและค่าเริ่มต้น โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics)

คำเตือนความมีชีวิตยังปล่อย:

- `openclaw.liveness.warning` (ตัวนับ, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)

### วงจรชีวิตของฮาร์เนส

- `openclaw.harness.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` บนข้อผิดพลาด)

### การดำเนินการของเครื่องมือ

- `openclaw.tool.execution.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, รวมถึง `openclaw.errorCategory` บนข้อผิดพลาด)
- `openclaw.tool.execution.blocked` (ตัวนับ, แอตทริบิวต์: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### การดำเนินคำสั่ง

- `openclaw.exec.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### ภายในของการวินิจฉัย (หน่วยความจำและลูปเครื่องมือ)

- `openclaw.payload.large` (ตัวนับ, แอตทริบิวต์: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับ `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ฮิสโตแกรม)
- `openclaw.memory.pressure` (ตัวนับ, แอตทริบิวต์: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (ตัวนับ, แอตทริบิวต์: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.toolName`, `openclaw.outcome`)

## span ที่ส่งออก

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` ตามค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้แบบแผนเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` ตามค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้แบบแผนเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` และ `openclaw.failureKind` ที่เป็นทางเลือกเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (แฮชแบบมีขอบเขตที่อิง SHA ของ id คำขอผู้ให้บริการต้นทาง; ไม่ส่งออก id ดิบ)
  - เมื่อใช้ `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` สแปนการเรียกโมเดลจะใช้ชื่อสแปนการอนุมาน GenAI ล่าสุด `{gen_ai.operation.name} {gen_ai.request.model}` และชนิดสแปน `CLIENT` แทน `openclaw.model.call`
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - เมื่อเสร็จสิ้น: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - เมื่อเกิดข้อผิดพลาด: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` ที่เป็นทางเลือก
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ไม่มีข้อความลูป, params หรือเอาต์พุตเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

เมื่อเปิดใช้งานการจับเนื้อหาอย่างชัดเจน สแปนของโมเดลและเครื่องมือยังสามารถ
รวมแอตทริบิวต์ `openclaw.content.*` แบบมีขอบเขตและปกปิดข้อมูล สำหรับคลาส
เนื้อหาเฉพาะที่คุณเลือกใช้ได้ด้วย

## แค็ตตาล็อกเหตุการณ์วินิจฉัย

เหตุการณ์ด้านล่างรองรับเมตริกและสแปนข้างต้น Plugin ยังสามารถสมัครรับ
เหตุการณ์เหล่านี้โดยตรงได้โดยไม่ต้องส่งออก OTLP

**การใช้งานโมเดล**

- `model.usage` - โทเค็น, ค่าใช้จ่าย, ระยะเวลา, บริบท, ผู้ให้บริการ/โมเดล/ช่องทาง,
  id เซสชัน `usage` คือบัญชีระดับผู้ให้บริการ/เทิร์นสำหรับค่าใช้จ่ายและเทเลเมทรี;
  `context.used` คือสแนปชอต prompt/บริบทปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการเมื่อมีอินพุตที่แคชไว้หรือการเรียก tool-loop เข้ามาเกี่ยวข้อง

**โฟลว์ข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (ตัวนับรวม: webhooks/queue/session)

**วงจรชีวิต Harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  วงจรชีวิตต่อการรันสำหรับ agent harness รวม `harnessId`, `pluginId` ที่เป็นทางเลือก,
  ผู้ให้บริการ/โมเดล/ช่องทาง และ run id การเสร็จสิ้นจะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ที่เป็นทางเลือก, `yieldDetected`,
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` ที่เป็นทางเลือก

**Exec**

- `exec.process.completed` - ผลลัพธ์ปลายทาง, ระยะเวลา, เป้าหมาย, โหมด, exit
  code และชนิดความล้มเหลว ไม่รวมข้อความคำสั่งและไดเรกทอรีทำงาน

## เมื่อไม่มี exporter

คุณสามารถทำให้เหตุการณ์วินิจฉัยพร้อมใช้งานสำหรับ Plugin หรือ sink แบบกำหนดเองได้โดยไม่ต้อง
รัน `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุต debug แบบเจาะจงโดยไม่เพิ่ม `logging.level` ให้ใช้ flag วินิจฉัย
flag ไม่แยกตัวพิมพ์เล็กใหญ่และรองรับ wildcard (เช่น `telegram.*` หรือ
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

เอาต์พุต flag จะไปยังไฟล์ log มาตรฐาน (`logging.file`) และยังคง
ถูกปกปิดข้อมูลโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[flag วินิจฉัย](/th/diagnostics/flags)

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถไม่ใส่ `diagnostics-otel` ใน `plugins.allow` หรือรัน
`openclaw plugins disable diagnostics-otel`

## ที่เกี่ยวข้อง

- [Logging](/th/logging) - log ไฟล์, เอาต์พุตคอนโซล, การ tail จาก CLI และแท็บ Logs ใน Control UI
- [รายละเอียดภายในของการบันทึก Gateway](/th/gateway/logging) - รูปแบบ log ของ WS, prefix ของระบบย่อย และการจับคอนโซล
- [flag วินิจฉัย](/th/diagnostics/flags) - flag สำหรับ debug-log แบบเจาะจง
- [การส่งออกวินิจฉัย](/th/gateway/diagnostics) - เครื่องมือ support-bundle สำหรับผู้ปฏิบัติงาน (แยกจากการส่งออก OTEL)
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) - เอกสารอ้างอิงฟิลด์ `diagnostics.*` ฉบับเต็ม
