---
read_when:
    - คุณต้องการส่งข้อมูลการใช้งานโมเดลของ OpenClaw โฟลว์ข้อความ หรือเมตริกเซสชันไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อเทรซ เมตริก หรือล็อกเข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่นๆ
    - คุณจำเป็นต้องใช้ชื่อเมตริก ชื่อสแปน หรือโครงสร้างแอตทริบิวต์ที่ถูกต้องตรงกันทุกประการ เพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry หรือ JSONL ทาง stdout ผ่าน Plugin diagnostics-otel
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-07-12T16:11:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกข้อมูลวินิจฉัยผ่าน Plugin อย่างเป็นทางการ `diagnostics-otel`
โดยใช้ **OTLP/HTTP (protobuf)** นอกจากนี้ยังสามารถเขียนบันทึกเป็น JSONL ไปยัง stdout
สำหรับไปป์ไลน์บันทึกของคอนเทนเนอร์และแซนด์บ็อกซ์ได้ ตัวรวบรวมหรือแบ็กเอนด์ใด ๆ ที่รองรับ
OTLP/HTTP สามารถใช้งานได้โดยไม่ต้องแก้ไขโค้ด สำหรับบันทึกไฟล์ภายในเครื่อง โปรดดู
[การบันทึก](/th/logging)

- **เหตุการณ์วินิจฉัย** คือระเบียนแบบมีโครงสร้างภายในโปรเซสที่ Gateway และ Plugin
  ที่รวมมาให้ปล่อยออกมาสำหรับการเรียกใช้โมเดล โฟลว์ข้อความ เซสชัน คิว
  และการดำเนินการคำสั่ง
- **`diagnostics-otel`** สมัครรับเหตุการณ์เหล่านั้นและส่งออกเป็น
  **เมตริก**, **เทรซ** และ **บันทึก** ของ OpenTelemetry ผ่าน OTLP/HTTP และสามารถ
  ทำสำเนาระเบียนบันทึกไปยัง stdout ในรูปแบบ JSONL ได้
- **การเรียกผู้ให้บริการ** จะได้รับส่วนหัว W3C `traceparent` จากบริบทสแปน
  การเรียกโมเดลที่เชื่อถือได้ของ OpenClaw เมื่อทรานสปอร์ตของผู้ให้บริการรองรับส่วนหัว
  แบบกำหนดเอง บริบทเทรซที่ Plugin ปล่อยออกมาจะไม่ถูกส่งต่อ
- ตัวส่งออกจะเชื่อมต่อเฉพาะเมื่อเปิดใช้งานทั้งส่วนการวินิจฉัยและ Plugin
  ดังนั้นโดยค่าเริ่มต้น ต้นทุนภายในโปรเซสจึงเกือบเป็นศูนย์

## เริ่มต้นอย่างรวดเร็ว

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

หรือเปิดใช้งาน Plugin จาก CLI: `openclaw plugins enable diagnostics-otel`

<Note>
`protocol` รองรับเฉพาะ `http/protobuf` เนื่องจาก `traces` และ `metrics` เปิดใช้งานโดยค่าเริ่มต้น ค่าอื่นใด (รวมถึง `grpc`) จะยกเลิกการสมัครรับข้อมูล diagnostics-otel ทั้งหมดพร้อมคำเตือน `unsupported protocol` ซึ่งจะหยุดการส่งออกบันทึกไปยัง stdout ด้วย หากคุณต้องการเพียง `logsExporter: "stdout"` โดยใช้ค่าโปรโตคอลที่ไม่ใช่ OTLP ให้กำหนด `traces: false` และ `metrics: false` อย่างชัดเจน
</Note>

## สัญญาณที่ส่งออก

| สัญญาณ      | ข้อมูลที่อยู่ในสัญญาณ                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **เมตริก** | ตัวนับ/ฮิสโตแกรมสำหรับการใช้โทเค็น ค่าใช้จ่าย ระยะเวลาการเรียกใช้ การสลับไปใช้ระบบสำรอง การใช้สกิล โฟลว์ข้อความ เหตุการณ์การสนทนา เลนคิว สถานะ/การกู้คืนเซสชัน การเรียกใช้เครื่องมือ การดำเนินการคำสั่ง หน่วยความจำ สถานะการทำงาน และสถานะตัวส่งออก |
| **เทรซ**  | สแปนสำหรับการใช้โมเดล การเรียกโมเดล วงจรชีวิตของฮาร์เนส การใช้สกิล การเรียกใช้เครื่องมือ การดำเนินการคำสั่ง การประมวลผล Webhook/ข้อความ การประกอบบริบท และลูปเครื่องมือ                                                      |
| **บันทึก**    | ระเบียน `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP หรือ stdout JSONL เมื่อเปิดใช้งาน `diagnostics.otel.logs` โดยจะไม่ส่งออกเนื้อหาบันทึก เว้นแต่เปิดใช้งานการเก็บเนื้อหาอย่างชัดเจน                          |

เปิดหรือปิด `traces`, `metrics` และ `logs` แยกจากกันได้ เทรซและเมตริก
จะเปิดโดยค่าเริ่มต้นเมื่อ `diagnostics.otel.enabled` เป็น true ส่วนบันทึกจะปิด
โดยค่าเริ่มต้นและส่งออกเฉพาะเมื่อกำหนด `diagnostics.otel.logs` เป็น `true`
อย่างชัดเจน การส่งออกบันทึกใช้ OTLP โดยค่าเริ่มต้น ให้กำหนด
`diagnostics.otel.logsExporter` เป็น `stdout` สำหรับ JSONL บน stdout หรือ
`both` สำหรับทั้งสองแบบ

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
      protocol: "http/protobuf", // grpc ปิดใช้งานการส่งออก OTLP
      serviceName: "openclaw-gateway", // หากไม่ได้กำหนด จะใช้ OTEL_SERVICE_NAME แล้วจึงใช้ "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // ตัวสุ่มตัวอย่างสแปนราก, 0.0..1.0
      flushIntervalMs: 60000, // ช่วงเวลาส่งออกเมตริก (ขั้นต่ำ 1000ms)
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

| ตัวแปร                                                                                                          | วัตถุประสงค์                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | ค่าสำรองสำหรับ `diagnostics.otel.endpoint` เมื่อไม่ได้กำหนดคีย์การกำหนดค่า                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | ค่าสำรองของปลายทางเฉพาะสัญญาณที่ใช้เมื่อไม่ได้กำหนดคีย์การกำหนดค่า `diagnostics.otel.*Endpoint` ที่ตรงกัน การกำหนดค่าเฉพาะสัญญาณมีลำดับความสำคัญเหนือ env เฉพาะสัญญาณ และ env เฉพาะสัญญาณมีลำดับความสำคัญเหนือปลายทางที่ใช้ร่วมกัน                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | ค่าสำรองสำหรับ `diagnostics.otel.serviceName` เมื่อไม่ได้กำหนดคีย์การกำหนดค่า ชื่อบริการเริ่มต้นคือ `openclaw`                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | ค่าสำรองสำหรับโปรโตคอลระดับสายสื่อสารเมื่อไม่ได้กำหนด `diagnostics.otel.protocol` เฉพาะ `http/protobuf` เท่านั้นที่เปิดใช้งานการส่งออก                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | กำหนดเป็น `gen_ai_latest_experimental` เพื่อปล่อยโครงสร้างสแปนการอนุมาน GenAI ล่าสุด ได้แก่ ชื่อสแปน `{gen_ai.operation.name} {gen_ai.request.model}`, ชนิดสแปน `CLIENT` และ `gen_ai.provider.name` แทน `gen_ai.system` แบบเดิม เมตริก GenAI จะใช้แอตทริบิวต์แบบจำกัดและมีคาร์ดินัลลิตีต่ำเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | กำหนดเป็น `1` เมื่อพรีโหลดหรือโปรเซสโฮสต์อื่นได้ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น Plugin จะข้ามวงจรชีวิต NodeSDK ของตนเอง แต่ยังคงเชื่อมต่อตัวรับฟังข้อมูลวินิจฉัยและปฏิบัติตาม `traces`/`metrics`/`logs`                                                                                    |

## ความเป็นส่วนตัวและการเก็บเนื้อหา

โดยค่าเริ่มต้น จะ**ไม่**ส่งออกเนื้อหาดิบของโมเดล/เครื่องมือ สแปนจะมีเฉพาะ
ตัวระบุแบบจำกัด (ช่องทาง ผู้ให้บริการ โมเดล หมวดหมู่ข้อผิดพลาด รหัสคำขอแบบแฮชเท่านั้น
แหล่งที่มาของเครื่องมือ เจ้าของเครื่องมือ ชื่อ/แหล่งที่มาของสกิล) และจะไม่มีข้อความพรอมต์
ข้อความตอบกลับ อินพุตเครื่องมือ เอาต์พุตเครื่องมือ พาธไฟล์สกิล หรือคีย์เซสชัน
ค่าที่มีลักษณะเหมือนคีย์เซสชันของเอเจนต์แบบมีขอบเขต (เช่น ขึ้นต้นด้วย
`agent:`) จะถูกแทนที่ด้วย `unknown` ในแอตทริบิวต์ที่มีคาร์ดินัลลิตีต่ำ โดยค่าเริ่มต้น
ระเบียนบันทึก OTLP จะเก็บระดับความรุนแรง ตัวบันทึก ตำแหน่งโค้ด บริบทเทรซ
ที่เชื่อถือได้ และแอตทริบิวต์ที่ผ่านการกรองแล้ว ส่วนเนื้อหาข้อความบันทึกดิบจะถูกส่งออก
เฉพาะเมื่อ `diagnostics.otel.captureContent` เป็นค่าบูลีน `true` เท่านั้น คีย์ย่อย
`captureContent.*` แบบละเอียดจะไม่เปิดใช้งานเนื้อหาบันทึก เมตริกการสนทนาจะส่งออก
เฉพาะข้อมูลเมตาของเหตุการณ์แบบจำกัด (โหมด ทรานสปอร์ต ผู้ให้บริการ ประเภทเหตุการณ์)
โดยไม่มีบทถอดเสียง เพย์โหลดเสียง รหัสเซสชัน รหัสเทิร์น รหัสการเรียก รหัสห้อง
หรือโทเค็นการส่งต่อ

คำขอโมเดลขาออกอาจมีส่วนหัว W3C `traceparent` ที่สร้างขึ้นเฉพาะ
จากบริบทเทรซการวินิจฉัยที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่ทำงานอยู่
ส่วนหัว `traceparent` ที่ผู้เรียกกำหนดไว้จะถูกแทนที่ ดังนั้น Plugin หรือ
ตัวเลือกผู้ให้บริการแบบกำหนดเองจึงไม่สามารถปลอมแปลงลำดับบรรพบุรุษของเทรซข้ามบริการได้

กำหนด `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อตัวรวบรวม
และนโยบายการเก็บรักษาของคุณได้รับอนุมัติให้จัดเก็บข้อความพรอมต์ การตอบกลับ เครื่องมือ
หรือพรอมต์ระบบ แต่ละคีย์ย่อยทำงานแยกจากกัน:

- `inputMessages` - เนื้อหาพรอมต์ของผู้ใช้
- `outputMessages` - เนื้อหาการตอบกลับของโมเดล
- `toolInputs` - เพย์โหลดอาร์กิวเมนต์ของเครื่องมือ
- `toolOutputs` - เพย์โหลดผลลัพธ์ของเครื่องมือ
- `systemPrompt` - พรอมต์ระบบ/นักพัฒนาที่ประกอบเสร็จแล้ว
- `toolDefinitions` - ชื่อ คำอธิบาย และสคีมาของเครื่องมือสำหรับโมเดล

เมื่อเปิดใช้งานคีย์ย่อยใด ๆ สแปนของโมเดลและเครื่องมือจะได้รับแอตทริบิวต์
`openclaw.content.*` ที่มีขอบเขตจำกัดและผ่านการปกปิดข้อมูล เฉพาะสำหรับคลาสนั้น

<Note>
ค่าบูลีน `captureContent: true` จะเปิดใช้งาน `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` และเนื้อหาบันทึก OTLP พร้อมกัน แต่**ไม่**เปิดใช้งาน `systemPrompt` หากคุณต้องการพรอมต์ระบบที่ประกอบเสร็จแล้วด้วย ให้กำหนด `captureContent.systemPrompt: true` อย่างชัดเจน
</Note>

เนื้อหา `toolInputs`/`toolOutputs` จะถูกเก็บสำหรับการเรียกใช้เครื่องมือของ
รันไทม์เอเจนต์ในตัว (`openclaw.content.tool_input` และ
`gen_ai.tool.call.arguments` บนสแปนที่เสร็จสมบูรณ์/เกิดข้อผิดพลาด
`openclaw.content.tool_output` และ `gen_ai.tool.call.result` บนสแปน
ที่เสร็จสมบูรณ์) ชื่อ `openclaw.content.*` ยังคงเป็นชื่อแอตทริบิวต์ OpenClaw
ที่เสถียร ส่วนสำเนา `gen_ai.tool.call.*` สะท้อนค่าเดียวกันสำหรับโปรแกรมดู
ที่รองรับ semconv โดยตรง การเรียกเครื่องมือของฮาร์เนสภายนอก (Codex, Claude CLI)
จะปล่อยสแปน `tool.execution.*` โดยไม่มีเพย์โหลดเนื้อหา เนื้อหาที่เก็บจะเดินทางผ่าน
ช่องทางที่เชื่อถือได้และมีไว้สำหรับตัวรับฟังเท่านั้น และจะไม่ถูกวางบนบัสเหตุการณ์
วินิจฉัยสาธารณะ

## การสุ่มตัวอย่างและการฟลัช

- **เทรซ:** `diagnostics.otel.sampleRate` กำหนด `TraceIdRatioBasedSampler`
  เฉพาะในสแปนราก (`0.0` ทิ้งทั้งหมด, `1.0` เก็บทั้งหมด) หากไม่กำหนดจะใช้ค่าเริ่มต้น
  ของ OpenTelemetry SDK (เปิดใช้งานเสมอ)
- **เมตริก:** `diagnostics.otel.flushIntervalMs` (จำกัดค่าต่ำสุดไว้ที่
  `1000`); หากไม่กำหนดจะใช้ค่าเริ่มต้นของการส่งออกเป็นระยะของ SDK
- **บันทึก:** บันทึก OTLP ใช้ `logging.level` (ระดับบันทึกของไฟล์) และใช้เส้นทาง
  การปกปิดข้อมูลของระเบียนบันทึกการวินิจฉัย ไม่ใช่การจัดรูปแบบคอนโซล การติดตั้งที่มีปริมาณสูง
  ควรเลือกใช้การสุ่มตัวอย่าง/การกรองของตัวรวบรวม OTLP แทนการสุ่มตัวอย่าง
  ภายในเครื่อง ตั้งค่า `diagnostics.otel.logsExporter: "stdout"` เมื่อแพลตฟอร์มของคุณ
  ส่ง stdout/stderr ไปยังตัวประมวลผลบันทึกอยู่แล้วและคุณไม่มีตัวรวบรวมบันทึก
  OTLP ระเบียน stdout เป็นออบเจ็กต์ JSON หนึ่งรายการต่อบรรทัด โดยมี `ts`, `signal`,
  `service.name`, ระดับความรุนแรง, เนื้อหา, แอตทริบิวต์ที่ปกปิดข้อมูลแล้ว และฟิลด์เทรซ
  ที่เชื่อถือได้เมื่อมี
- **การเชื่อมโยงบันทึกไฟล์:** บันทึกไฟล์ JSONL มี `traceId`,
  `spanId`, `parentSpanId` และ `traceFlags` ที่ระดับบนสุด เมื่อการเรียกบันทึกมีบริบท
  เทรซการวินิจฉัยที่ถูกต้อง ซึ่งช่วยให้ตัวประมวลผลบันทึกเชื่อมบรรทัดบันทึกภายในเครื่องกับ
  สแปนที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP และเฟรม WebSocket ของ Gateway จะสร้าง
  ขอบเขตเทรซคำขอภายใน โดยค่าเริ่มต้น บันทึกและเหตุการณ์การวินิจฉัยภายใน
  ขอบเขตนั้นจะสืบทอดเทรซคำขอ ขณะที่สแปนการทำงานของเอเจนต์และการเรียกโมเดล
  จะถูกสร้างเป็นลูก เพื่อให้ส่วนหัว `traceparent` ของผู้ให้บริการอยู่ใน
  เทรซเดียวกัน
- **การเชื่อมโยงการเรียกโมเดล:** สแปน `openclaw.model.call` มีขนาดคอมโพเนนต์
  พรอมต์ที่ปลอดภัยโดยค่าเริ่มต้น และมีแอตทริบิวต์โทเค็นต่อการเรียกเมื่อผลลัพธ์จากผู้ให้บริการ
  เปิดเผยข้อมูลการใช้งาน `openclaw.model.usage` ยังคงเป็นสแปนการบัญชี
  ระดับการทำงานสำหรับต้นทุนรวม บริบท และแดชบอร์ดช่องทาง และยังคงอยู่ใน
  เทรซการวินิจฉัยเดียวกันเมื่อรันไทม์ที่ปล่อยข้อมูลมีบริบทเทรซที่เชื่อถือได้

## เมตริกที่ส่งออก

### การใช้งานโมเดล

- `openclaw.tokens` (ตัวนับ, แอตทริบิวต์: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (ฮิสโตแกรม, เมตริกตามข้อกำหนดเชิงความหมายของ GenAI, แอตทริบิวต์: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (ฮิสโตแกรม, วินาที, เมตริกตามข้อกำหนดเชิงความหมายของ GenAI, แอตทริบิวต์: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` ซึ่งเป็นตัวเลือก)
- `openclaw.model_call.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport` รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` สำหรับข้อผิดพลาดที่ได้รับการจำแนก)
- `openclaw.model_call.request_bytes` (ฮิสโตแกรม, ขนาดไบต์ UTF-8 ของเพย์โหลดคำขอโมเดลสุดท้าย; ไม่มีเนื้อหาเพย์โหลดดิบ)
- `openclaw.model_call.response_bytes` (ฮิสโตแกรม, ขนาดไบต์ UTF-8 ของเพย์โหลดชิ้นส่วนการตอบกลับแบบสตรีม; เดลตาของข้อความ การคิด และการเรียกเครื่องมือที่มีความถี่สูงจะนับเฉพาะไบต์ `delta` ส่วนเพิ่ม; ไม่มีเนื้อหาการตอบกลับดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (ฮิสโตแกรม, เวลาที่ผ่านไปก่อนเหตุการณ์การตอบกลับแบบสตรีมครั้งแรก)
- `openclaw.model.failover` (ตัวนับ, แอตทริบิวต์: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (ตัวนับ, แอตทริบิวต์: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` ซึ่งเป็นตัวเลือก, `openclaw.toolName` ซึ่งเป็นตัวเลือก)

### ลำดับการไหลของข้อความ

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

### การสนทนา

- `openclaw.talk.event` (ตัวนับ, แอตทริบิวต์: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับ `openclaw.talk.event`; ปล่อยเมื่อเหตุการณ์การสนทนารายงานระยะเวลา)
- `openclaw.talk.audio.bytes` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับ `openclaw.talk.event`; ปล่อยสำหรับเหตุการณ์เฟรมเสียงการสนทนาที่รายงานความยาวเป็นไบต์)

### คิวและเซสชัน

- `openclaw.queue.lane.enqueue` (ตัวนับ, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (ตัวนับ, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.queue.depth` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.lane` หรือ `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.session.state` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (ตัวนับ, แอตทริบิวต์: `openclaw.state`; ปล่อยสำหรับข้อมูลบันทึกสถานะเซสชันที่ล้าสมัยและกู้คืนได้)
- `openclaw.session.stuck_age_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.state`; ปล่อยสำหรับข้อมูลบันทึกสถานะเซสชันที่ล้าสมัยและกู้คืนได้)
- `openclaw.session.turn.created` (ตัวนับ, แอตทริบิวต์: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับตัวนับการกู้คืนที่ตรงกัน)
- `openclaw.run.attempt` (ตัวนับ, แอตทริบิวต์: `openclaw.attempt`)

### เทเลเมทรีความพร้อมทำงานของเซสชัน

`diagnostics.stuckSessionWarnMs` คือเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับการวินิจฉัย
ความพร้อมทำงานของเซสชัน เซสชัน `processing` จะไม่นับอายุเข้าใกล้
เกณฑ์นี้ขณะที่ OpenClaw สังเกตเห็นความคืบหน้าของการตอบกลับ เครื่องมือ สถานะ บล็อก หรือรันไทม์
ACP การส่งสัญญาณคงสถานะการพิมพ์ไม่นับเป็นความคืบหน้า ดังนั้นจึงยังตรวจพบโมเดลหรือ
ชุดควบคุมที่เงียบอยู่ได้

OpenClaw จำแนกเซสชันตามงานที่ยังสามารถสังเกตได้:

- `session.long_running`: งานฝังตัวที่ทำงานอยู่ การเรียกโมเดล หรือการเรียกเครื่องมือ
  ยังคงมีความคืบหน้า การเรียกโมเดลที่มีเจ้าของและยังคงเงียบเกิน
  `diagnostics.stuckSessionWarnMs` จะถูกรายงานว่าใช้เวลานานก่อนถึง
  `diagnostics.stuckSessionAbortMs` เช่นกัน เพื่อให้ผู้ให้บริการโมเดลที่ช้าหรือไม่ใช้สตรีม
  ไม่ดูเหมือนเซสชัน Gateway ที่หยุดชะงัก ขณะที่ยังสามารถสังเกตการยกเลิกได้
- `session.stalled`: มีงานที่ทำงานอยู่ แต่การทำงานที่ใช้งานอยู่ไม่ได้รายงาน
  ความคืบหน้าล่าสุด การเรียกโมเดลที่มีเจ้าของจะเปลี่ยนจาก `session.long_running` เป็น
  `session.stalled` เมื่อถึงหรือหลัง `diagnostics.stuckSessionAbortMs`; กิจกรรม
  โมเดล/เครื่องมือที่ล้าสมัยและไม่มีเจ้าของจะไม่ถูกมองว่าเป็นงานที่ใช้เวลานานโดยไม่เป็นอันตราย
  ในตอนแรก การทำงานฝังตัวที่หยุดชะงักจะอยู่ในโหมดสังเกตเท่านั้น จากนั้นจะยกเลิกและระบายงานหลัง
  `diagnostics.stuckSessionAbortMs` หากไม่มีความคืบหน้า เพื่อให้เทิร์นที่รออยู่
  ด้านหลังในเลนสามารถทำงานต่อได้ หากไม่กำหนด เกณฑ์การยกเลิกจะใช้ค่าเริ่มต้นเป็นช่วงเวลา
  ขยายที่ปลอดภัยกว่า ซึ่งมีค่าอย่างน้อย 5 นาทีและ 3 เท่าของ
  `diagnostics.stuckSessionWarnMs`
- `session.stuck`: ข้อมูลบันทึกสถานะเซสชันล้าสมัยโดยไม่มีงานที่ทำงานอยู่ หรือเซสชัน
  ในคิวที่ว่างอยู่ซึ่งมีกิจกรรมโมเดล/เครื่องมือที่ล้าสมัยและไม่มีเจ้าของ การดำเนินการนี้จะปล่อย
  เลนของเซสชันที่ได้รับผลกระทบทันทีหลังผ่านเกตการกู้คืน

การกู้คืนจะปล่อยเหตุการณ์ `session.recovery.requested` และ
`session.recovery.completed` แบบมีโครงสร้าง สถานะเซสชันการวินิจฉัยจะถูกทำเครื่องหมายว่าว่าง
หลังจากผลลัพธ์การกู้คืนที่เปลี่ยนแปลงสถานะ (`aborted` หรือ `released`) เท่านั้น และต่อเมื่อ
รุ่นการประมวลผลเดิมยังคงเป็นรุ่นปัจจุบัน

เฉพาะ `session.stuck` เท่านั้นที่ปล่อยตัวนับ `openclaw.session.stuck`,
ฮิสโตแกรม `openclaw.session.stuck_age_ms` และสแปน `openclaw.session.stuck`
การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะเว้นช่วงเพิ่มขึ้นขณะที่เซสชันยังคง
ไม่เปลี่ยนแปลง ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นอย่างต่อเนื่อง แทนที่จะเป็น
ทุกจังหวะ Heartbeat สำหรับตัวเลือกการกำหนดค่าและค่าเริ่มต้น โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics)

คำเตือนความพร้อมทำงานยังปล่อยข้อมูลต่อไปนี้:

- `openclaw.liveness.warning` (ตัวนับ, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)

### วงจรชีวิตของชุดควบคุม

- `openclaw.harness.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อเกิดข้อผิดพลาด)

### การดำเนินการเครื่องมือและการตรวจจับลูป

- `openclaw.tool.execution.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind` รวมถึง `openclaw.errorCategory` เมื่อเกิดข้อผิดพลาด)
- `openclaw.tool.execution.blocked` (ตัวนับ, แอตทริบิวต์: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (ตัวนับ, แอตทริบิวต์: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` ซึ่งเป็นตัวเลือก; ปล่อยเมื่อตรวจพบลูปการเรียกเครื่องมือซ้ำ)

### การดำเนินคำสั่ง

- `openclaw.exec.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### กลไกภายในของการวินิจฉัย (หน่วยความจำ เพย์โหลด และสถานะของตัวส่งออก)

- `openclaw.payload.large` (ตัวนับ, แอตทริบิวต์: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับ `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (ฮิสโตแกรม, ไม่มีแอตทริบิวต์; ตัวอย่างหน่วยความจำของกระบวนการ)
- `openclaw.memory.pressure` (ตัวนับ, แอตทริบิวต์: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (ตัวนับ, แอตทริบิวต์: `openclaw.diagnostic.async_queue.drop_class`; รายการที่ถูกทิ้งเนื่องจากแรงดันย้อนกลับของคิวการวินิจฉัยภายใน)
- `openclaw.telemetry.exporter.events` (ตัวนับ, แอตทริบิวต์: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` ซึ่งเป็นตัวเลือก, `openclaw.errorCategory` ซึ่งเป็นตัวเลือก; เทเลเมทรีภายในสำหรับวงจรชีวิต/ความล้มเหลวของตัวส่งออก)

## สแปนที่ส่งออก

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - ใช้ `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้แบบแผนเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - ใช้ `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้แบบแผนเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` และ `openclaw.failureKind` ซึ่งเป็นค่าที่ไม่บังคับเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (เฉพาะขนาดขององค์ประกอบที่ปลอดภัย ไม่มีข้อความพรอมต์)
  - `openclaw.model_call.usage.*` และ `gen_ai.usage.*` เมื่อผลลัพธ์ของการเรียกโมเดลมีข้อมูลการใช้งานจากผู้ให้บริการสำหรับการเรียกครั้งนั้น
  - เหตุการณ์ Span `openclaw.provider.request` พร้อมแอตทริบิวต์ `openclaw.upstreamRequestIdHash` (จำกัดขนาดและอิงแฮช) เมื่อผลลัพธ์จากผู้ให้บริการต้นทางเปิดเผยรหัสคำขอ โดยจะไม่ส่งออกรหัสดิบเด็ดขาด
  - เมื่อใช้ `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` Span การเรียกโมเดลจะใช้ชื่อ Span การอนุมาน GenAI ล่าสุด `{gen_ai.operation.name} {gen_ai.request.model}` และชนิด Span `CLIENT` แทน `openclaw.model.call`
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - เมื่อเสร็จสิ้น: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - เมื่อเกิดข้อผิดพลาด: `openclaw.harness.phase`, `openclaw.errorCategory`, และ `openclaw.harness.cleanup_failed` ซึ่งเป็นค่าที่ไม่บังคับ
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, `gen_ai.tool.call.id` ซึ่งเป็นค่าที่ไม่บังคับ, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - `openclaw.errorCategory`/`openclaw.errorCode` ซึ่งเป็นค่าที่ไม่บังคับเมื่อเกิดข้อผิดพลาด และ `openclaw.deniedReason` กับ `openclaw.outcome=blocked` เมื่อถูกปฏิเสธโดยนโยบายหรือแซนด์บ็อกซ์
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (ไม่มีเนื้อหาพรอมต์ ประวัติ การตอบกลับ หรือคีย์เซสชัน)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` ซึ่งเป็นค่าที่ไม่บังคับ (ไม่มีข้อความของลูป พารามิเตอร์ หรือผลลัพธ์จากเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, และ `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms` ซึ่งเป็นค่าที่ไม่บังคับ

เมื่อเปิดใช้การบันทึกเนื้อหาอย่างชัดเจน Span ของโมเดลและเครื่องมือยังสามารถ
มีแอตทริบิวต์ `openclaw.content.*` ที่จำกัดขนาดและปกปิดข้อมูลแล้ว สำหรับ
คลาสเนื้อหาเฉพาะที่คุณเลือกใช้

## แค็ตตาล็อกเหตุการณ์การวินิจฉัย

เหตุการณ์ด้านล่างรองรับเมตริกและ Span ข้างต้น นอกจากนี้ Plugin ยังสามารถ
สมัครรับเหตุการณ์เหล่านี้โดยตรงได้โดยไม่ต้องส่งออกผ่าน OTLP

**การใช้งานโมเดล**

- `model.usage` - โทเค็น ค่าใช้จ่าย ระยะเวลา บริบท ผู้ให้บริการ/โมเดล/ช่องทาง
  และรหัสเซสชัน `usage` คือการคิดบัญชีของผู้ให้บริการ/รอบสนทนาสำหรับค่าใช้จ่ายและเทเลเมทรี
  ส่วน `context.used` คือสแนปช็อตพรอมต์/บริบทปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการเมื่อมีอินพุตที่แคชไว้หรือการเรียกในลูปเครื่องมือ

**โฟลว์ข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (ตัวนับแบบรวม: Webhook/คิว/เซสชัน)

**วงจรการทำงานของฮาร์เนส**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  วงจรการทำงานต่อการรันของฮาร์เนสเอเจนต์ ประกอบด้วย `harnessId`, `pluginId`
  ซึ่งเป็นค่าที่ไม่บังคับ, ผู้ให้บริการ/โมเดล/ช่องทาง และรหัสการรัน เมื่อเสร็จสิ้นจะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ซึ่งเป็นค่าที่ไม่บังคับ, `yieldDetected`
  และจำนวน `itemLifecycle` ส่วนข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` ซึ่งเป็นค่าที่ไม่บังคับ

**การดำเนินการคำสั่ง**

- `exec.process.completed` - ผลลัพธ์สุดท้าย ระยะเวลา เป้าหมาย โหมด โค้ด
  ทางออก และประเภทความล้มเหลว โดยไม่รวมข้อความคำสั่งและไดเรกทอรีทำงาน
- `exec.approval.followup_suppressed` - ยกเลิกการติดตามผลการอนุมัติที่ล้าสมัย
  หลังจากเซสชันเชื่อมโยงใหม่ ประกอบด้วย `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` หรือ `gateway_preflight`)
  และการประทับเวลาของตัวแจกจ่าย โดยไม่รวมคีย์เซสชัน เส้นทาง และข้อความคำสั่ง

## เมื่อไม่มีตัวส่งออก

ทำให้เหตุการณ์การวินิจฉัยพร้อมใช้งานสำหรับ Plugin หรือตัวรับข้อมูลแบบกำหนดเองโดยไม่ต้องเรียกใช้
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุตการดีบักแบบเจาะจงโดยไม่ต้องเพิ่ม `logging.level` ให้ใช้แฟล็ก
การวินิจฉัย แฟล็กไม่คำนึงถึงตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ และรองรับไวลด์การ์ด (`telegram.*` หรือ
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

หรือใช้เป็นการแทนที่ผ่านตัวแปรสภาพแวดล้อมเพียงครั้งเดียว:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

เอาต์พุตของแฟล็กจะถูกส่งไปยังไฟล์บันทึกมาตรฐาน (`logging.file`) และยังคง
ถูกปกปิดข้อมูลโดย `logging.redactSensitive` คู่มือฉบับเต็ม:
[แฟล็กการวินิจฉัย](/th/diagnostics/flags)

## ปิดใช้งาน

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

หรือไม่ต้องใส่ `diagnostics-otel` ใน `plugins.allow` หรือเรียกใช้
`openclaw plugins disable diagnostics-otel`

## ที่เกี่ยวข้อง

- [การบันทึก](/th/logging) - บันทึกไฟล์ เอาต์พุตคอนโซล การติดตามผ่าน CLI และแท็บบันทึกใน Control UI
- [กลไกการบันทึกภายในของ Gateway](/th/gateway/logging) - รูปแบบบันทึก WS คำนำหน้าระบบย่อย และการบันทึกคอนโซล
- [แฟล็กการวินิจฉัย](/th/diagnostics/flags) - แฟล็กบันทึกการดีบักแบบเจาะจง
- [การส่งออกข้อมูลการวินิจฉัย](/th/gateway/diagnostics) - เครื่องมือชุดข้อมูลสนับสนุนสำหรับผู้ดูแลระบบ (แยกจากการส่งออก OTEL)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) - ข้อมูลอ้างอิงฉบับเต็มของฟิลด์ `diagnostics.*`
