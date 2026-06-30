---
read_when:
    - คุณต้องการส่งการใช้งานโมเดล OpenClaw, โฟลว์ข้อความ หรือเมตริกเซสชันไปยัง OpenTelemetry collector
    - คุณกำลังเชื่อมต่อ traces, metrics หรือ logs เข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่นๆ
    - คุณต้องใช้ชื่อเมตริก ชื่อสแปน หรือรูปแบบแอตทริบิวต์ที่แน่นอน เพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกการวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry หรือ stdout JSONL ผ่าน Plugin diagnostics-otel
title: ส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T14:34:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกการวินิจฉัยผ่าน Plugin ทางการ `diagnostics-otel`
โดยใช้ **OTLP/HTTP (protobuf)** นอกจากนี้ยังสามารถเขียนล็อกเป็น stdout JSONL
สำหรับไปป์ไลน์ล็อกของคอนเทนเนอร์และแซนด์บ็อกซ์ได้ด้วย คอลเลกเตอร์หรือแบ็กเอนด์ใด ๆ ที่รับ
OTLP/HTTP สามารถทำงานได้โดยไม่ต้องเปลี่ยนโค้ด สำหรับล็อกไฟล์ภายในเครื่องและวิธีอ่านล็อกเหล่านั้น
ดู [การบันทึกล็อก](/th/logging)

## ภาพรวมการทำงานร่วมกัน

- **เหตุการณ์การวินิจฉัย** คือระเบียนแบบมีโครงสร้างภายในโปรเซสที่ปล่อยออกมาโดย
  Gateway และ Plugin ที่มาพร้อมชุด สำหรับการรันโมเดล ลำดับการไหลของข้อความ เซสชัน คิว
  และ exec
- **Plugin `diagnostics-otel`** สมัครรับเหตุการณ์เหล่านั้นและส่งออกเป็น
  **เมตริก**, **เทรซ** และ **ล็อก** ของ OpenTelemetry ผ่าน OTLP/HTTP และยังสามารถ
  มิเรอร์ระเบียนล็อกการวินิจฉัยไปยัง stdout JSONL ได้ด้วย
- **การเรียกผู้ให้บริการ** จะได้รับเฮดเดอร์ W3C `traceparent` จากบริบทสแปนการเรียกโมเดล
  ที่ OpenClaw เชื่อถือ เมื่อทรานสปอร์ตของผู้ให้บริการยอมรับเฮดเดอร์แบบกำหนดเอง
  บริบทเทรซที่ปล่อยโดย Plugin จะไม่ถูกส่งต่อ
- ตัวส่งออกจะเชื่อมต่อเฉพาะเมื่อเปิดใช้ทั้งพื้นผิวการวินิจฉัยและ Plugin แล้วเท่านั้น
  ดังนั้นค่าใช้จ่ายภายในโปรเซสจึงคงอยู่ใกล้ศูนย์โดยค่าเริ่มต้น

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

คุณยังสามารถเปิดใช้ Plugin จาก CLI ได้ด้วย:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
ปัจจุบัน `protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น `grpc` จะถูกละเว้น
</Note>

## สัญญาณที่ส่งออก

| สัญญาณ      | สิ่งที่อยู่ในสัญญาณ                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **เมตริก** | ตัวนับและฮิสโตแกรมสำหรับการใช้โทเค็น ต้นทุน ระยะเวลาการรัน เฟลโอเวอร์ การใช้ skill ลำดับการไหลของข้อความ เหตุการณ์ Talk เลนคิว สถานะ/การกู้คืนเซสชัน การดำเนินการเครื่องมือ เพย์โหลดขนาดใหญ่เกินไป exec และแรงกดดันหน่วยความจำ |
| **เทรซ**  | สแปนสำหรับการใช้โมเดล การเรียกโมเดล วงจรชีวิตของฮาร์เนส การใช้ skill การดำเนินการเครื่องมือ exec การประมวลผล webhook/ข้อความ การประกอบบริบท และลูปเครื่องมือ                                                            |
| **ล็อก**    | ระเบียน `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP หรือ stdout JSONL เมื่อเปิดใช้ `diagnostics.otel.logs`; เนื้อหาล็อกจะถูกระงับไว้ เว้นแต่จะเปิดใช้การจับเนื้อหาอย่างชัดเจน                                |

สลับเปิดปิด `traces`, `metrics` และ `logs` ได้อย่างอิสระ เทรซและเมตริก
เปิดอยู่โดยค่าเริ่มต้นเมื่อ `diagnostics.otel.enabled` เป็นจริง ล็อกปิดอยู่โดยค่าเริ่มต้นและ
จะส่งออกเฉพาะเมื่อ `diagnostics.otel.logs` เป็น `true` อย่างชัดเจน การส่งออกล็อก
มีค่าเริ่มต้นเป็น OTLP; ตั้ง `diagnostics.otel.logsExporter` เป็น `stdout` สำหรับ JSONL บน
stdout หรือ `both` เพื่อส่งระเบียนล็อกการวินิจฉัยแต่ละรายการไปยัง OTLP และ stdout

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | แทนที่ `diagnostics.otel.endpoint` หากค่ามี `/v1/traces`, `/v1/metrics` หรือ `/v1/logs` อยู่แล้ว จะใช้ค่านั้นตามเดิม                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | การแทนที่ปลายทางเฉพาะสัญญาณ ซึ่งใช้เมื่อไม่ได้ตั้งค่าคีย์การกำหนดค่า `diagnostics.otel.*Endpoint` ที่ตรงกัน การกำหนดค่าเฉพาะสัญญาณชนะ env เฉพาะสัญญาณ และ env เฉพาะสัญญาณชนะปลายทางที่ใช้ร่วมกัน                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | แทนที่ `diagnostics.otel.serviceName`                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | แทนที่โปรโตคอลบนสายสื่อสาร (วันนี้ยอมรับเฉพาะ `http/protobuf`)                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งเป็น `gen_ai_latest_experimental` เพื่อปล่อยรูปทรงสแปนการอนุมาน GenAI แบบทดลองล่าสุด รวมถึงชื่อสแปน `{gen_ai.operation.name} {gen_ai.request.model}`, ชนิดสแปน `CLIENT` และ `gen_ai.provider.name` แทน `gen_ai.system` แบบเดิม เมตริก GenAI ใช้แอตทริบิวต์เชิงความหมายที่มีขอบเขตและคาร์ดินัลลิตีต่ำเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งเป็น `1` เมื่อพรีโหลดหรือโปรเซสโฮสต์อื่นลงทะเบียน OpenTelemetry SDK แบบโกลบอลไว้แล้ว จากนั้น Plugin จะข้ามวงจรชีวิต NodeSDK ของตัวเอง แต่ยังคงเชื่อมตัวฟังการวินิจฉัยและเคารพ `traces`/`metrics`/`logs`                                                                                                                    |

## ความเป็นส่วนตัวและการจับเนื้อหา

เนื้อหาดิบของโมเดล/เครื่องมือ **ไม่** ถูกส่งออกโดยค่าเริ่มต้น สแปนมีตัวระบุ
ที่มีขอบเขต (ช่องทาง ผู้ให้บริการ โมเดล หมวดหมู่ข้อผิดพลาด รหัสคำขอแบบแฮชเท่านั้น
แหล่งที่มาของเครื่องมือ เจ้าของเครื่องมือ และชื่อ/แหล่งที่มาของ skill) และจะไม่รวมข้อความพรอมป์
ข้อความตอบกลับ อินพุตเครื่องมือ เอาต์พุตเครื่องมือ พาธไฟล์ skill หรือคีย์เซสชัน
ระเบียนล็อก OTLP เก็บระดับความรุนแรง logger ตำแหน่งโค้ด บริบทเทรซที่เชื่อถือ
และแอตทริบิวต์ที่ล้างข้อมูลแล้วโดยค่าเริ่มต้น แต่เนื้อหาข้อความล็อกดิบจะถูกส่งออก
เฉพาะเมื่อ `diagnostics.otel.captureContent` ตั้งเป็นบูลีน `true` เท่านั้น คีย์ย่อยแบบละเอียด
`captureContent.*` จะไม่เปิดใช้เนื้อหาข้อความล็อก ป้ายกำกับที่ดูเหมือน
คีย์เซสชันเอเจนต์แบบมีขอบเขตจะถูกแทนที่ด้วย `unknown`
เมตริก Talk ส่งออกเฉพาะเมตาดาต้าเหตุการณ์ที่มีขอบเขต เช่น โหมด ทรานสปอร์ต
ผู้ให้บริการ และชนิดเหตุการณ์ ไม่รวมทรานสคริปต์ เพย์โหลดเสียง
รหัสเซสชัน รหัสเทิร์น รหัสการโทร รหัสห้อง หรือโทเค็นส่งต่อ

คำขอโมเดลขาออกอาจมีเฮดเดอร์ W3C `traceparent` เฮดเดอร์นั้น
สร้างจากบริบทเทรซการวินิจฉัยที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่ใช้งานอยู่เท่านั้น
เฮดเดอร์ `traceparent` ที่ผู้เรียกส่งมาอยู่แล้วจะถูกแทนที่ ดังนั้น Plugin หรือ
ตัวเลือกผู้ให้บริการแบบกำหนดเองจึงไม่สามารถปลอมสายบรรพบุรุษของเทรซข้ามบริการได้

ตั้ง `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อคอลเลกเตอร์และ
นโยบายการเก็บรักษาของคุณได้รับอนุมัติสำหรับข้อความพรอมป์ คำตอบ เครื่องมือ หรือ system-prompt
แล้วเท่านั้น แต่ละคีย์ย่อยเป็นการเลือกใช้แยกกัน:

- `inputMessages` - เนื้อหาพรอมป์ของผู้ใช้
- `outputMessages` - เนื้อหาคำตอบของโมเดล
- `toolInputs` - เพย์โหลดอาร์กิวเมนต์ของเครื่องมือ
- `toolOutputs` - เพย์โหลดผลลัพธ์ของเครื่องมือ
- `systemPrompt` - พรอมป์ระบบ/ผู้พัฒนาที่ประกอบแล้ว
- `toolDefinitions` - ชื่อ คำอธิบาย และสคีมาของเครื่องมือโมเดล

เมื่อเปิดใช้คีย์ย่อยใด ๆ สแปนของโมเดลและเครื่องมือจะได้รับแอตทริบิวต์
`openclaw.content.*` ที่มีขอบเขตและแก้ไขข้อมูลออกแล้วสำหรับคลาสนั้นเท่านั้น ใช้บูลีน
`captureContent: true` เฉพาะสำหรับการจับการวินิจฉัยแบบกว้างที่ได้รับอนุมัติให้ส่งออก
เนื้อหาข้อความล็อก OTLP ด้วย

เนื้อหา `toolInputs`/`toolOutputs` จะถูกจับสำหรับการดำเนินการเครื่องมือของรันไทม์เอเจนต์ในตัว
(`openclaw.content.tool_input` บนสแปนที่เสร็จสมบูรณ์/ผิดพลาด,
`openclaw.content.tool_output` บนสแปนที่เสร็จสมบูรณ์) การเรียกเครื่องมือของฮาร์เนสภายนอก
(Codex, Claude CLI) ปล่อยสแปน `tool.execution.*` โดยไม่มีเพย์โหลดเนื้อหา
เนื้อหาที่จับไว้เดินทางบนช่องทางที่เชื่อถือและมีเฉพาะตัวฟังเท่านั้น และจะไม่ถูกวาง
บนบัสเหตุการณ์การวินิจฉัยสาธารณะ

## การสุ่มตัวอย่างและการฟลัช

- **เทรซ:** `diagnostics.otel.sampleRate` (เฉพาะ root-span เท่านั้น, `0.0` ทิ้งทั้งหมด,
  `1.0` เก็บทั้งหมด)
- **เมตริก:** `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ `1000`)
- **บันทึก:** บันทึก OTLP เคารพ `logging.level` (ระดับบันทึกไฟล์) โดยใช้เส้นทางการปกปิดข้อมูล log-record สำหรับการวินิจฉัย ไม่ใช่การจัดรูปแบบคอนโซล การติดตั้งที่มีปริมาณสูงควรเลือกใช้การสุ่มตัวอย่าง/การกรองของ OTLP collector แทนการสุ่มตัวอย่างภายในเครื่อง
  ตั้งค่า `diagnostics.otel.logsExporter: "stdout"` เมื่อแพลตฟอร์มของคุณส่ง stdout/stderr ไปยังตัวประมวลผลบันทึกอยู่แล้ว และคุณไม่มี OTLP logs
  collector ระเบียน stdout เป็นออบเจ็กต์ JSON หนึ่งรายการต่อบรรทัด พร้อม `ts`, `signal`,
  `service.name`, severity, body, แอตทริบิวต์ที่ถูกปกปิดข้อมูล และฟิลด์เทรซที่เชื่อถือได้
  เมื่อมี
- **การเชื่อมโยงบันทึกไฟล์:** บันทึกไฟล์ JSONL มี `traceId`,
  `spanId`, `parentSpanId` และ `traceFlags` ระดับบนสุด เมื่อการเรียกบันทึกมีบริบทเทรซการวินิจฉัยที่ถูกต้อง ซึ่งช่วยให้ตัวประมวลผลบันทึกเชื่อมบรรทัดบันทึกภายในเครื่องกับ span ที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP ของ Gateway และเฟรม WebSocket สร้างขอบเขตเทรซคำขอภายใน บันทึกและเหตุการณ์การวินิจฉัยภายในขอบเขตนั้นจะรับเทรซคำขอโดยค่าเริ่มต้น ขณะที่ span ของการรันเอเจนต์และการเรียกโมเดลจะถูกสร้างเป็นลูก เพื่อให้ส่วนหัว `traceparent` ของผู้ให้บริการยังคงอยู่บนเทรซเดียวกัน
- **การเชื่อมโยงการเรียกโมเดล:** span `openclaw.model.call` รวมขนาดคอมโพเนนต์พรอมป์ที่ปลอดภัยโดยค่าเริ่มต้น และรวมแอตทริบิวต์โทเคนรายครั้งเมื่อผลลัพธ์จากผู้ให้บริการเปิดเผย usage `openclaw.model.usage` ยังคงเป็น span การนับบัญชีระดับการรันสำหรับค่าใช้จ่ายรวม บริบท และแดชบอร์ดช่องทาง โดยจะอยู่บนเทรซการวินิจฉัยเดียวกันเมื่อ runtime ที่ส่งออกมีบริบทเทรซที่เชื่อถือได้

## เมตริกที่ส่งออก

### การใช้งานโมเดล

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, เมตริกตามข้อตกลงเชิงความหมายของ GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, วินาที, เมตริกตามข้อตกลงเชิงความหมายของ GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` แบบไม่บังคับ)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport` รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` เมื่อเป็นข้อผิดพลาดที่จัดประเภทแล้ว)
- `openclaw.model_call.request_bytes` (histogram, ขนาดไบต์ UTF-8 ของเพย์โหลดคำขอโมเดลสุดท้าย; ไม่มีเนื้อหาเพย์โหลดดิบ)
- `openclaw.model_call.response_bytes` (histogram, ขนาดไบต์ UTF-8 ของเพย์โหลดชังก์การตอบกลับแบบสตรีม; เดลตาข้อความ ความคิด และการเรียกเครื่องมือที่มีความถี่สูงนับเฉพาะไบต์ `delta` ที่เพิ่มขึ้นเท่านั้น; ไม่มีเนื้อหาการตอบกลับดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, เวลาที่ผ่านไปก่อนเหตุการณ์การตอบกลับแบบสตรีมแรก)
- `openclaw.model.failover` (counter, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (counter, attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` แบบไม่บังคับ, `openclaw.toolName` แบบไม่บังคับ)

### โฟลว์ข้อความ

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Talk

- `openclaw.talk.event` (counter, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, attrs: เหมือนกับ `openclaw.talk.event`; ส่งออกเมื่อเหตุการณ์ Talk รายงานระยะเวลา)
- `openclaw.talk.audio.bytes` (histogram, attrs: เหมือนกับ `openclaw.talk.event`; ส่งออกสำหรับเหตุการณ์เฟรมเสียง Talk ที่รายงานความยาวไบต์)

### คิวและเซสชัน

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` หรือ `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; ส่งออกสำหรับการทำบัญชีเซสชันค้างเก่าที่กู้คืนได้)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; ส่งออกสำหรับการทำบัญชีเซสชันค้างเก่าที่กู้คืนได้)
- `openclaw.session.turn.created` (counter, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (counter, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (counter, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, attrs: เหมือนกับ recovery counter ที่ตรงกัน)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### เทเลเมทรีความมีชีวิตของเซสชัน

`diagnostics.stuckSessionWarnMs` คือเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับการวินิจฉัยความมีชีวิตของเซสชัน เซสชัน `processing` จะไม่นับอายุเข้าสู่เกณฑ์นี้ขณะที่ OpenClaw สังเกตเห็นความคืบหน้าของ runtime ในรูปแบบการตอบกลับ เครื่องมือ สถานะ บล็อก หรือ ACP
Typing keepalives ไม่นับเป็นความคืบหน้า ดังนั้นโมเดลหรือ harness ที่เงียบยังคงถูกตรวจพบได้

OpenClaw จัดประเภทเซสชันตามงานที่ยังสังเกตเห็นได้:

- `session.long_running`: งานฝังตัวที่ทำงานอยู่ การเรียกโมเดล หรือการเรียกเครื่องมือยังคงมีความคืบหน้า การเรียกโมเดลที่มีเจ้าของซึ่งเงียบเกิน
  `diagnostics.stuckSessionWarnMs` จะรายงานเป็น long-running ก่อน
  `diagnostics.stuckSessionAbortMs` เช่นกัน เพื่อให้ผู้ให้บริการโมเดลที่ช้าหรือไม่สตรีมไม่ดูเหมือนเซสชัน Gateway ที่หยุดชะงัก ตราบใดที่ยังสังเกตการยกเลิกได้
- `session.stalled`: มีงานที่ทำงานอยู่ แต่การรันที่ทำงานอยู่ไม่ได้รายงานความคืบหน้าล่าสุด การเรียกโมเดลที่มีเจ้าของจะเปลี่ยนจาก `session.long_running` เป็น
  `session.stalled` เมื่อถึงหรือหลัง `diagnostics.stuckSessionAbortMs`; กิจกรรมโมเดล/เครื่องมือเก่าที่ไม่มีเจ้าของจะไม่ถูกถือว่าเป็นงาน long-running ที่ไม่เป็นอันตราย
  การรันฝังตัวที่ stalled จะอยู่ในโหมด observe-only ในตอนแรก จากนั้น abort-drain หลัง
  `diagnostics.stuckSessionAbortMs` โดยไม่มีความคืบหน้า เพื่อให้ turn ที่อยู่หลัง lane ในคิวกลับมาทำงานต่อได้ เมื่อไม่ได้ตั้งค่า เกณฑ์การยกเลิกจะใช้ค่าเริ่มต้นเป็นหน้าต่างเวลาขยายที่ปลอดภัยกว่าอย่างน้อย 5 นาที และ 3x
  `diagnostics.stuckSessionWarnMs`
- `session.stuck`: การทำบัญชีเซสชันค้างเก่าที่ไม่มีงานที่ทำงานอยู่ หรือเซสชันที่อยู่ในคิวแต่ idle พร้อมกิจกรรมโมเดล/เครื่องมือเก่าที่ไม่มีเจ้าของ สิ่งนี้จะปล่อย lane ของเซสชันที่ได้รับผลกระทบทันทีหลังจากผ่านเกตการกู้คืน

การกู้คืนส่งออกเหตุการณ์ `session.recovery.requested` และ
`session.recovery.completed` แบบมีโครงสร้าง สถานะเซสชันการวินิจฉัยจะถูกทำเครื่องหมายเป็น idle
เฉพาะหลังผลลัพธ์การกู้คืนที่เปลี่ยนแปลงสถานะ (`aborted` หรือ `released`) และเฉพาะเมื่อ generation การประมวลผลเดียวกันยังคงเป็นปัจจุบัน

เฉพาะ `session.stuck` เท่านั้นที่ส่งออก counter `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms` และ span `openclaw.session.stuck`
การวินิจฉัย `session.stuck` ซ้ำจะ back off ขณะที่เซสชันยังไม่เปลี่ยนแปลง ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นอย่างต่อเนื่อง แทนที่จะเตือนทุก Heartbeat tick สำหรับ knob การกำหนดค่าและค่าเริ่มต้น โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics)

คำเตือนความมีชีวิตยังส่งออก:

- `openclaw.liveness.warning` (counter, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, attrs: `openclaw.liveness.reason`)

### วงจรชีวิตของ harness

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อเกิดข้อผิดพลาด)

### การดำเนินการเครื่องมือ

- `openclaw.tool.execution.duration_ms` (histogram, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind` รวมถึง `openclaw.errorCategory` เมื่อเกิดข้อผิดพลาด)
- `openclaw.tool.execution.blocked` (counter, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### ภายในของการวินิจฉัย (หน่วยความจำและลูปเครื่องมือ)

- `openclaw.payload.large` (counter, attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, attrs: เหมือนกับ `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## span ที่ส่งออก

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
  - `openclaw.errorCategory` และ `openclaw.failureKind` ที่เป็นทางเลือกเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (เฉพาะขนาดขององค์ประกอบที่ปลอดภัย ไม่มีข้อความพรอมป์)
  - `openclaw.model_call.usage.*` และ `gen_ai.usage.*` เมื่อผลลัพธ์ model-call มีข้อมูลการใช้งานจากผู้ให้บริการสำหรับการเรียกนั้นโดยเฉพาะ
  - `openclaw.provider.request_id_hash` (แฮชแบบมีขอบเขตที่อิง SHA ของรหัสคำขอจากผู้ให้บริการต้นทาง; ไม่มีการส่งออก id ดิบ)
  - เมื่อใช้ `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` สแปน model-call จะใช้ชื่อสแปนการอนุมาน GenAI ล่าสุด `{gen_ai.operation.name} {gen_ai.request.model}` และชนิดสแปน `CLIENT` แทน `openclaw.model.call`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (ไม่มีเนื้อหาพรอมป์ ประวัติ การตอบกลับ หรือคีย์เซสชัน)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ไม่มีข้อความลูป พารามิเตอร์ หรือเอาต์พุตของเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

เมื่อเปิดใช้งานการจับเนื้อหาอย่างชัดเจน สแปนของโมเดลและเครื่องมือยังสามารถ
รวมแอตทริบิวต์ `openclaw.content.*` แบบมีขอบเขตและถูกปกปิด สำหรับคลาสเนื้อหาเฉพาะ
ที่คุณเลือกใช้ได้ด้วย

## แค็ตตาล็อกเหตุการณ์วินิจฉัย

เหตุการณ์ด้านล่างรองรับเมตริกและสแปนข้างต้น Plugin ยังสามารถสมัครรับ
เหตุการณ์เหล่านี้โดยตรงได้โดยไม่ต้องส่งออก OTLP

**การใช้งานโมเดล**

- `model.usage` - โทเค็น ค่าใช้จ่าย ระยะเวลา บริบท ผู้ให้บริการ/โมเดล/ช่องทาง
  รหัสเซสชัน `usage` คือการคิดบัญชีฝั่งผู้ให้บริการ/รอบสำหรับค่าใช้จ่ายและ telemetry;
  `context.used` คือสแนปช็อตพรอมป์/บริบทปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการเมื่อเกี่ยวข้องกับอินพุตที่แคชไว้หรือการเรียก tool-loop

**โฟลว์ข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (ตัวนับแบบรวม: webhooks/queue/session)

**วงจรชีวิต Harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  วงจรชีวิตต่อการรันสำหรับเอเจนต์ harness รวม `harnessId`, `pluginId` ที่เป็นทางเลือก,
  ผู้ให้บริการ/โมเดล/ช่องทาง และรหัสการรัน เมื่อเสร็จสิ้นจะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ที่เป็นทางเลือก, `yieldDetected`,
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` ที่เป็นทางเลือก

**Exec**

- `exec.process.completed` - ผลลัพธ์สุดท้าย ระยะเวลา เป้าหมาย โหมด รหัสออก
  และชนิดความล้มเหลว ไม่มีการรวมข้อความคำสั่งและไดเรกทอรีทำงาน

## เมื่อไม่มี exporter

คุณสามารถคงเหตุการณ์วินิจฉัยให้พร้อมใช้งานสำหรับ Plugin หรือ sink แบบกำหนดเองได้โดยไม่ต้อง
รัน `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุตดีบักแบบเจาะจงโดยไม่เพิ่ม `logging.level` ให้ใช้แฟล็ก diagnostics
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

เอาต์พุตแฟล็กจะไปยังไฟล์บันทึกมาตรฐาน (`logging.file`) และยังคงถูก
ปกปิดโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[แฟล็ก Diagnostics](/th/diagnostics/flags)

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

คุณยังสามารถไม่ใส่ `diagnostics-otel` ใน `plugins.allow` หรือรัน
`openclaw plugins disable diagnostics-otel`

## ที่เกี่ยวข้อง

- [Logging](/th/logging) - บันทึกไฟล์ เอาต์พุตคอนโซล การ tail ผ่าน CLI และแท็บ Logs ของ Control UI
- [ภายในของการบันทึก Gateway](/th/gateway/logging) - รูปแบบบันทึก WS, คำนำหน้าระบบย่อย และการจับคอนโซล
- [แฟล็ก Diagnostics](/th/diagnostics/flags) - แฟล็กบันทึกดีบักแบบเจาะจง
- [การส่งออก Diagnostics](/th/gateway/diagnostics) - เครื่องมือ support-bundle สำหรับผู้ปฏิบัติงาน (แยกจากการส่งออก OTEL)
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) - เอกสารอ้างอิงฟิลด์ `diagnostics.*` ทั้งหมด
