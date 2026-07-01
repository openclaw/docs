---
read_when:
    - คุณต้องการส่งเมตริกการใช้งานโมเดลของ OpenClaw, โฟลว์ข้อความ หรือเซสชัน ไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อ traces, metrics หรือ logs เข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่นๆ
    - คุณต้องใช้ชื่อเมตริก ชื่อ span หรือรูปแบบแอตทริบิวต์ที่แน่นอนเพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกการวินิจฉัยของ OpenClaw ไปยัง OpenTelemetry collectors หรือ stdout JSONL ผ่าน diagnostics-otel plugin
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-07-01T08:46:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกข้อมูลวินิจฉัยผ่าน Plugin อย่างเป็นทางการ `diagnostics-otel`
โดยใช้ **OTLP/HTTP (protobuf)** นอกจากนี้ยังเขียน log เป็น stdout JSONL ได้สำหรับ
pipeline log ของ container และ sandbox collector หรือ backend ใด ๆ ที่รองรับ
OTLP/HTTP จะใช้งานได้โดยไม่ต้องแก้โค้ด สำหรับ log ไฟล์ภายในเครื่องและวิธีอ่าน
ดู [Logging](/th/logging)

## ภาพรวมการทำงานร่วมกัน

- **เหตุการณ์วินิจฉัย** คือ record แบบมีโครงสร้างภายใน process ที่ปล่อยโดย
  Gateway และ plugin ที่รวมมากับระบบสำหรับ model run, message flow, session, queue,
  และ exec
- **Plugin `diagnostics-otel`** subscribe เหตุการณ์เหล่านั้นและส่งออกเป็น
  OpenTelemetry **metric**, **trace**, และ **log** ผ่าน OTLP/HTTP และยังสามารถ
  mirror record log วินิจฉัยไปยัง stdout JSONL ได้ด้วย
- **การเรียก provider** จะได้รับ header W3C `traceparent` จาก span context ของ
  การเรียก model ที่ OpenClaw เชื่อถือ เมื่อ transport ของ provider รองรับ
  header แบบกำหนดเอง trace context ที่ปล่อยจาก Plugin จะไม่ถูกส่งต่อ
- exporter จะ attach เฉพาะเมื่อทั้งพื้นผิว diagnostics และ Plugin เปิดใช้งานอยู่
  ดังนั้นค่าใช้จ่ายภายใน process จึงใกล้ศูนย์โดยปริยาย

## เริ่มต้นอย่างรวดเร็ว

สำหรับการติดตั้งแบบ packaged ให้ติดตั้ง Plugin ก่อน:

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

| สัญญาณ      | สิ่งที่อยู่ในนั้น                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metric** | counter และ histogram สำหรับการใช้ token, ต้นทุน, ระยะเวลา run, failover, การใช้ skill, message flow, เหตุการณ์ Talk, lane ของ queue, สถานะ/การกู้คืน session, การ execute tool, payload ที่ใหญ่เกินไป, exec, และแรงกดดันหน่วยความจำ |
| **Trace**  | span สำหรับการใช้ model, การเรียก model, lifecycle ของ harness, การใช้ skill, การ execute tool, exec, การประมวลผล webhook/message, การประกอบ context, และ loop ของ tool                                                            |
| **Log**    | record `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP หรือ stdout JSONL เมื่อเปิดใช้งาน `diagnostics.otel.logs`; body ของ log จะถูกกันไว้ เว้นแต่จะเปิดใช้งานการจับเนื้อหาอย่างชัดเจน                                |

สลับเปิดปิด `traces`, `metrics`, และ `logs` ได้อิสระ Trace และ metric
เปิดโดยปริยายเมื่อ `diagnostics.otel.enabled` เป็น true Log ปิดโดยปริยายและ
จะส่งออกเฉพาะเมื่อ `diagnostics.otel.logs` เป็น `true` อย่างชัดเจน ค่าเริ่มต้นของ
การส่งออก log คือ OTLP; ตั้ง `diagnostics.otel.logsExporter` เป็น `stdout` สำหรับ
JSONL บน stdout หรือ `both` เพื่อส่ง record log วินิจฉัยแต่ละรายการไปยัง OTLP และ stdout

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
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | override protocol บน wire (ปัจจุบันรองรับเฉพาะ `http/protobuf`)                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งเป็น `gen_ai_latest_experimental` เพื่อปล่อย span shape การ inference ของ GenAI แบบทดลองล่าสุด รวมถึงชื่อ span `{gen_ai.operation.name} {gen_ai.request.model}`, span kind `CLIENT`, และ `gen_ai.provider.name` แทน `gen_ai.system` แบบเดิม metric ของ GenAI ใช้ semantic attribute ที่จำกัดและมี cardinality ต่ำเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งเป็น `1` เมื่อ preload อื่นหรือ process host ได้ลงทะเบียน OpenTelemetry SDK ระดับ global ไว้แล้ว จากนั้น Plugin จะข้าม lifecycle NodeSDK ของตัวเอง แต่ยังคงต่อ diagnostic listener และเคารพ `traces`/`metrics`/`logs`                                                                                                                    |

## ความเป็นส่วนตัวและการจับเนื้อหา

เนื้อหา model/tool แบบดิบจะ **ไม่** ถูกส่งออกโดยปริยาย Span จะพกพา
identifier ที่จำกัดขอบเขต (channel, provider, model, หมวดหมู่ข้อผิดพลาด, request id
แบบ hash เท่านั้น, แหล่งที่มาของ tool, เจ้าของ tool, และชื่อ/แหล่งที่มาของ skill) และจะไม่รวม
ข้อความ prompt, ข้อความ response, input ของ tool, output ของ tool, path ไฟล์ skill, หรือ key ของ session
record log OTLP จะเก็บ severity, logger, ตำแหน่งโค้ด, trace context ที่เชื่อถือ,
และ attribute ที่ sanitize แล้วโดยปริยาย แต่ body ข้อความ log ดิบจะถูกส่งออก
เฉพาะเมื่อ `diagnostics.otel.captureContent` ตั้งเป็น boolean `true` เท่านั้น subkey แบบละเอียด
`captureContent.*` จะไม่เปิดใช้งาน body ของ log label ที่ดูเหมือน
key ของ scoped agent session จะถูกแทนที่ด้วย `unknown`
metric ของ Talk จะส่งออกเฉพาะ metadata เหตุการณ์ที่จำกัดขอบเขต เช่น mode, transport,
provider, และประเภทเหตุการณ์ โดยไม่รวม transcript, payload เสียง,
session id, turn id, call id, room id, หรือ token สำหรับ handoff

request ไปยัง model ภายนอกอาจมี header W3C `traceparent` header นี้จะ
สร้างจาก diagnostic trace context ที่ OpenClaw เป็นเจ้าของสำหรับการเรียก model ที่ใช้งานอยู่เท่านั้น
header `traceparent` ที่ผู้เรียกส่งมาเดิมจะถูกแทนที่ ดังนั้น Plugin หรือ
option ของ provider แบบกำหนดเองจึงปลอมแปลงสายบรรพบุรุษ trace ข้ามบริการไม่ได้

ตั้ง `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อ collector และ
นโยบายการเก็บรักษาของคุณได้รับอนุมัติสำหรับข้อความ prompt, response, tool หรือ system-prompt
แล้ว subkey แต่ละรายการเป็น opt-in แยกกัน:

- `inputMessages` - เนื้อหา prompt ของผู้ใช้
- `outputMessages` - เนื้อหา response ของ model
- `toolInputs` - payload argument ของ tool
- `toolOutputs` - payload result ของ tool
- `systemPrompt` - system/developer prompt ที่ประกอบแล้ว
- `toolDefinitions` - ชื่อ คำอธิบาย และ schema ของ model tool

เมื่อเปิดใช้งาน subkey ใด ๆ span ของ model และ tool จะได้รับ attribute
`openclaw.content.*` ที่จำกัดขอบเขตและ redact แล้วเฉพาะสำหรับ class นั้น ใช้ boolean
`captureContent: true` เฉพาะสำหรับการจับ diagnostics แบบกว้างที่ body ข้อความ log ของ OTLP
ได้รับอนุมัติให้ส่งออกด้วย

เนื้อหา `toolInputs`/`toolOutputs` จะถูกจับสำหรับการ execute tool ของ runtime agent ในตัว
(`openclaw.content.tool_input` บน span ที่ completed/error,
`openclaw.content.tool_output` บน span ที่ completed) การเรียก tool ของ harness ภายนอก
(Codex, Claude CLI) จะปล่อย span `tool.execution.*` โดยไม่มี payload เนื้อหา
เนื้อหาที่จับได้เดินทางบน channel ที่เชื่อถือและเป็น listener-only และจะไม่ถูกวาง
บน event bus diagnostics สาธารณะ

## การ sampling และการ flush

- **เทรซ:** `diagnostics.otel.sampleRate` (เฉพาะ root-span, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด)
- **เมตริก:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`)
- **บันทึก:** บันทึก OTLP เคารพ `logging.level` (ระดับบันทึกไฟล์) โดยใช้เส้นทางการปกปิดข้อมูลของระเบียนบันทึกเชิงวินิจฉัย
  ไม่ใช่การจัดรูปแบบคอนโซล การติดตั้งที่มีปริมาณสูงควรใช้การสุ่มตัวอย่าง/การกรองของ
  OTLP collector แทนการสุ่มตัวอย่างในเครื่อง
  ตั้งค่า `diagnostics.otel.logsExporter: "stdout"` เมื่อแพลตฟอร์มของคุณส่ง
  stdout/stderr ไปยังตัวประมวลผลบันทึกอยู่แล้ว และคุณไม่มี OTLP logs
  collector ระเบียน stdout เป็นออบเจ็กต์ JSON หนึ่งรายการต่อบรรทัด โดยมี `ts`, `signal`,
  `service.name`, severity, body, แอตทริบิวต์ที่ถูกปกปิดข้อมูลแล้ว และฟิลด์เทรซที่เชื่อถือได้
  เมื่อมีให้ใช้งาน
- **การเชื่อมโยงกับบันทึกไฟล์:** บันทึกไฟล์ JSONL รวม `traceId`,
  `spanId`, `parentSpanId` และ `traceFlags` ระดับบนสุด เมื่อการเรียกบันทึกมี
  บริบทเทรซเชิงวินิจฉัยที่ถูกต้อง ซึ่งช่วยให้ตัวประมวลผลบันทึกเชื่อมบรรทัดบันทึกในเครื่องกับ
  span ที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP ของ Gateway และเฟรม WebSocket สร้าง
  ขอบเขตเทรซคำขอภายใน บันทึกและเหตุการณ์เชิงวินิจฉัยภายในขอบเขตนั้น
  จะสืบทอดเทรซคำขอตามค่าเริ่มต้น ขณะที่ span ของการรันเอเจนต์และการเรียกโมเดลจะ
  ถูกสร้างเป็นลูก เพื่อให้ส่วนหัว `traceparent` ของผู้ให้บริการยังอยู่บนเทรซเดียวกัน
- **การเชื่อมโยงการเรียกโมเดล:** span `openclaw.model.call` รวมขนาดของคอมโพเนนต์พรอมป์ที่ปลอดภัย
  ตามค่าเริ่มต้น และรวมแอตทริบิวต์โทเคนรายครั้งเมื่อผลลัพธ์จากผู้ให้บริการเปิดเผยการใช้งาน
  `openclaw.model.usage` ยังคงเป็น span การบัญชีระดับการรันสำหรับค่าใช้จ่ายรวม
  บริบท และแดชบอร์ดช่องทาง โดยจะอยู่บนเทรซเชิงวินิจฉัยเดียวกัน
  เมื่อรันไทม์ที่ส่งออกมีบริบทเทรซที่เชื่อถือได้

## เมตริกที่ส่งออก

### การใช้งานโมเดล

- `openclaw.tokens` (ตัวนับ, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (ฮิสโตแกรม, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (ฮิสโตแกรม, เมตริกตามแบบแผนเชิงความหมายของ GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (ฮิสโตแกรม, วินาที, เมตริกตามแบบแผนเชิงความหมายของ GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` ที่เป็นทางเลือก)
- `openclaw.model_call.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` เมื่อเกิดข้อผิดพลาดที่จัดประเภทแล้ว)
- `openclaw.model_call.request_bytes` (ฮิสโตแกรม, ขนาดเป็นไบต์ UTF-8 ของเพย์โหลดคำขอโมเดลสุดท้าย; ไม่มีเนื้อหาเพย์โหลดดิบ)
- `openclaw.model_call.response_bytes` (ฮิสโตแกรม, ขนาดเป็นไบต์ UTF-8 ของเพย์โหลดชิ้นส่วนการตอบกลับแบบสตรีม; ข้อความความถี่สูง, thinking และเดลตาการเรียกเครื่องมือ นับเฉพาะไบต์ `delta` ที่เพิ่มขึ้น; ไม่มีเนื้อหาการตอบกลับดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (ฮิสโตแกรม, เวลาที่ผ่านไปก่อนเหตุการณ์การตอบกลับแบบสตรีมครั้งแรก)
- `openclaw.model.failover` (ตัวนับ, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (ตัวนับ, attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` ที่เป็นทางเลือก, `openclaw.toolName` ที่เป็นทางเลือก)

### การไหลของข้อความ

- `openclaw.webhook.received` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (ตัวนับ, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### การพูดคุย

- `openclaw.talk.event` (ตัวนับ, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (ฮิสโตแกรม, attrs: เหมือนกับ `openclaw.talk.event`; ส่งออกเมื่อเหตุการณ์ Talk รายงานระยะเวลา)
- `openclaw.talk.audio.bytes` (ฮิสโตแกรม, attrs: เหมือนกับ `openclaw.talk.event`; ส่งออกสำหรับเหตุการณ์เฟรมเสียง Talk ที่รายงานความยาวเป็นไบต์)

### คิวและเซสชัน

- `openclaw.queue.lane.enqueue` (ตัวนับ, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (ตัวนับ, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (ฮิสโตแกรม, attrs: `openclaw.lane` หรือ `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (ฮิสโตแกรม, attrs: `openclaw.lane`)
- `openclaw.session.state` (ตัวนับ, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (ตัวนับ, attrs: `openclaw.state`; ส่งออกสำหรับข้อมูลการจัดทำบัญชีเซสชันเก่าค้างที่กู้คืนได้)
- `openclaw.session.stuck_age_ms` (ฮิสโตแกรม, attrs: `openclaw.state`; ส่งออกสำหรับข้อมูลการจัดทำบัญชีเซสชันเก่าค้างที่กู้คืนได้)
- `openclaw.session.turn.created` (ตัวนับ, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (ตัวนับ, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (ตัวนับ, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (ฮิสโตแกรม, attrs: เหมือนกับตัวนับการกู้คืนที่ตรงกัน)
- `openclaw.run.attempt` (ตัวนับ, attrs: `openclaw.attempt`)

### เทเลเมทรีความมีชีวิตของเซสชัน

`diagnostics.stuckSessionWarnMs` คือเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับการวินิจฉัย
ความมีชีวิตของเซสชัน เซสชัน `processing` จะไม่นับอายุไปสู่เกณฑ์นี้
ขณะที่ OpenClaw สังเกตเห็นความคืบหน้าของรันไทม์ในรูปแบบการตอบกลับ เครื่องมือ สถานะ บล็อก หรือ ACP
การ keepalive ขณะพิมพ์จะไม่นับเป็นความคืบหน้า ดังนั้นโมเดลหรือฮาร์เนสที่เงียบ
ยังคงถูกตรวจพบได้

OpenClaw จัดประเภทเซสชันตามงานที่ยังสังเกตเห็นได้:

- `session.long_running`: งานฝังตัวที่ทำงานอยู่ การเรียกโมเดล หรือการเรียกเครื่องมือ
  ยังคงมีความคืบหน้า การเรียกโมเดลที่มีเจ้าของซึ่งเงียบเกิน
  `diagnostics.stuckSessionWarnMs` จะรายงานเป็นงานที่ใช้เวลานานก่อน
  `diagnostics.stuckSessionAbortMs` ด้วย เพื่อให้ผู้ให้บริการโมเดลที่ช้าหรือไม่สตรีม
  ไม่ดูเหมือนเซสชัน Gateway ที่หยุดชะงัก ขณะที่ยังสังเกตการยกเลิกได้
- `session.stalled`: มีงานที่ทำงานอยู่ แต่การรันที่ทำงานอยู่ยังไม่ได้รายงาน
  ความคืบหน้าล่าสุด การเรียกโมเดลที่มีเจ้าของจะเปลี่ยนจาก `session.long_running` เป็น
  `session.stalled` เมื่อถึงหรือหลัง `diagnostics.stuckSessionAbortMs`; กิจกรรมโมเดล/เครื่องมือเก่าค้างที่ไม่มีเจ้าของ
  จะไม่ถือเป็นงานที่ใช้เวลานานแบบไม่เป็นอันตราย
  การรันฝังตัวที่หยุดชะงักจะอยู่ในสถานะสังเกตอย่างเดียวในตอนแรก จากนั้นจึงยกเลิกและระบายหลัง
  `diagnostics.stuckSessionAbortMs` โดยไม่มีความคืบหน้า เพื่อให้เทิร์นที่รอคิวอยู่ด้านหลัง
  เลนสามารถทำงานต่อได้ เมื่อไม่ได้ตั้งค่า เกณฑ์การยกเลิกจะใช้ค่าเริ่มต้นเป็นหน้าต่างขยายที่ปลอดภัยกว่า
  อย่างน้อย 5 นาทีและ 3 เท่าของ
  `diagnostics.stuckSessionWarnMs`
- `session.stuck`: การจัดทำบัญชีเซสชันเก่าค้างโดยไม่มีงานที่ทำงานอยู่ หรือเซสชันที่รอคิวและไม่ได้ใช้งาน
  พร้อมกิจกรรมโมเดล/เครื่องมือเก่าค้างที่ไม่มีเจ้าของ ซึ่งจะปล่อย
  เลนเซสชันที่ได้รับผลกระทบทันทีหลังจากผ่านเงื่อนไขการกู้คืน

การกู้คืนส่งออกเหตุการณ์ `session.recovery.requested` และ
`session.recovery.completed` แบบมีโครงสร้าง สถานะเซสชันเชิงวินิจฉัยจะถูกทำเครื่องหมายเป็น idle
หลังจากผลลัพธ์การกู้คืนที่เปลี่ยนแปลงสถานะ (`aborted` หรือ `released`) เท่านั้น และก็ต่อเมื่อ
generation ของการประมวลผลเดียวกันยังเป็นปัจจุบัน

เฉพาะ `session.stuck` เท่านั้นที่ส่งออกตัวนับ `openclaw.session.stuck`,
ฮิสโตแกรม `openclaw.session.stuck_age_ms` และ span `openclaw.session.stuck`
การวินิจฉัย `session.stuck` ซ้ำจะถอยระยะขณะที่เซสชันยังไม่เปลี่ยนแปลง
ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นต่อเนื่อง ไม่ใช่ทุก
tick ของ heartbeat สำหรับตัวเลือกการตั้งค่าและค่าเริ่มต้น ดู
[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics)

คำเตือนความมีชีวิตยังส่งออก:

- `openclaw.liveness.warning` (ตัวนับ, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (ฮิสโตแกรม, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (ฮิสโตแกรม, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (ฮิสโตแกรม, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (ฮิสโตแกรม, attrs: `openclaw.liveness.reason`)

### วงจรชีวิตฮาร์เนส

- `openclaw.harness.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อเกิดข้อผิดพลาด)

### การดำเนินการเครื่องมือ

- `openclaw.tool.execution.duration_ms` (ฮิสโตแกรม, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, รวมถึง `openclaw.errorCategory` เมื่อเกิดข้อผิดพลาด)
- `openclaw.tool.execution.blocked` (ตัวนับ, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### รายละเอียดภายในของการวินิจฉัย (หน่วยความจำและลูปเครื่องมือ)

- `openclaw.payload.large` (ตัวนับ, attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (ฮิสโตแกรม, attrs: เหมือนกับ `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (ฮิสโตแกรม, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ฮิสโตแกรม)
- `openclaw.memory.pressure` (ตัวนับ, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (ตัวนับ, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (ฮิสโตแกรม, attrs: `openclaw.toolName`, `openclaw.outcome`)

## span ที่ส่งออก

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
  - `openclaw.errorCategory` และ `openclaw.failureKind` ที่เป็นตัวเลือกเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (เฉพาะขนาดขององค์ประกอบที่ปลอดภัย ไม่มีข้อความพรอมป์)
  - `openclaw.model_call.usage.*` และ `gen_ai.usage.*` เมื่อผลลัพธ์ model-call มีข้อมูลการใช้งานของ provider สำหรับการเรียกนั้นโดยเฉพาะ
  - `openclaw.provider.request_id_hash` (แฮชแบบมีขอบเขตที่ใช้ SHA ของรหัสคำขอ provider ต้นทาง; ไม่มีการส่งออกรหัสดิบ)
  - เมื่อใช้ `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` ช่วง model-call จะใช้ชื่อช่วงการอนุมาน GenAI ล่าสุด `{gen_ai.operation.name} {gen_ai.request.model}` และชนิดช่วง `CLIENT` แทน `openclaw.model.call`
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - เมื่อเสร็จสิ้น: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (ไม่มีพรอมป์ ประวัติ การตอบกลับ หรือเนื้อหาคีย์ของเซสชัน)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ไม่มีข้อความลูป พารามิเตอร์ หรือเอาต์พุตของเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

เมื่อเปิดใช้งานการจับเนื้อหาอย่างชัดเจน ช่วงของโมเดลและเครื่องมือยังสามารถ
รวมแอตทริบิวต์ `openclaw.content.*` แบบมีขอบเขตและปกปิดข้อมูล สำหรับคลาส
เนื้อหาเฉพาะที่คุณเลือกใช้

## แค็ตตาล็อกเหตุการณ์วินิจฉัย

เหตุการณ์ด้านล่างรองรับเมตริกและช่วงข้างต้น Plugin ยังสามารถสมัครรับ
เหตุการณ์เหล่านี้โดยตรงได้โดยไม่ต้องส่งออก OTLP

**การใช้งานโมเดล**

- `model.usage` - โทเค็น ค่าใช้จ่าย ระยะเวลา คอนเท็กซ์ provider/model/channel
  รหัสเซสชัน `usage` คือการคำนวณบัญชีของ provider/turn สำหรับค่าใช้จ่ายและเทเลเมทรี;
  `context.used` คือสแนปช็อตพรอมป์/คอนเท็กซ์ปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของ provider เมื่อมีอินพุตที่แคชไว้หรือการเรียก tool-loop เข้ามาเกี่ยวข้อง

**โฟลว์ข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (ตัวนับแบบรวม: Webhook/คิว/เซสชัน)

**วงจรชีวิตของ Harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  วงจรชีวิตต่อการรันสำหรับ agent harness รวม `harnessId`, `pluginId` ที่เป็นตัวเลือก,
  provider/model/channel และรหัสการรัน เมื่อเสร็จสิ้นจะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ที่เป็นตัวเลือก, `yieldDetected`,
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` ที่เป็นตัวเลือก

**Exec**

- `exec.process.completed` - ผลลัพธ์ปลายทาง ระยะเวลา เป้าหมาย โหมด รหัสออก
  และชนิดความล้มเหลว ไม่มีการรวมข้อความคำสั่งและไดเรกทอรีทำงาน
- `exec.approval.followup_suppressed` - การติดตามผลการอนุมัติที่ล้าสมัยถูกทิ้งหลังจาก
  เซสชันเด้งกลับ รวม `approvalId`, `reason` (`session_rebound`),
  `phase` (`direct_delivery` หรือ `gateway_preflight`) และประทับเวลาของ dispatcher
  ไม่มีการรวมคีย์เซสชัน เส้นทาง และข้อความคำสั่ง

## เมื่อไม่มี exporter

คุณสามารถทำให้เหตุการณ์วินิจฉัยพร้อมใช้งานสำหรับ Plugin หรือ sink แบบกำหนดเองได้โดยไม่ต้อง
รัน `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุตดีบักแบบเจาะจงโดยไม่เพิ่ม `logging.level` ให้ใช้แฟล็กวินิจฉัย
แฟล็กไม่คำนึงถึงตัวพิมพ์เล็กใหญ่และรองรับไวลด์การ์ด (เช่น `telegram.*` หรือ
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

หรือเป็นการ override env แบบครั้งเดียว:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

เอาต์พุตของแฟล็กจะไปที่ไฟล์บันทึกมาตรฐาน (`logging.file`) และยังคงถูก
ปกปิดโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[แฟล็กวินิจฉัย](/th/diagnostics/flags)

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถเว้น `diagnostics-otel` ออกจาก `plugins.allow` หรือรัน
`openclaw plugins disable diagnostics-otel`

## ที่เกี่ยวข้อง

- [Logging](/th/logging) - บันทึกไฟล์ เอาต์พุตคอนโซล การ tail ผ่าน CLI และแท็บบันทึกใน Control UI
- [ส่วนภายในของการบันทึก Gateway](/th/gateway/logging) - รูปแบบบันทึก WS, คำนำหน้าระบบย่อย และการจับคอนโซล
- [แฟล็กวินิจฉัย](/th/diagnostics/flags) - แฟล็กบันทึกดีบักแบบเจาะจง
- [การส่งออกวินิจฉัย](/th/gateway/diagnostics) - เครื่องมือ support-bundle สำหรับผู้ดูแลระบบ (แยกจากการส่งออก OTEL)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) - ข้อมูลอ้างอิงฟิลด์ `diagnostics.*` ฉบับเต็ม
