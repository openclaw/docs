---
read_when:
    - คุณต้องการส่งเมตริกการใช้งานโมเดล ลำดับการไหลของข้อความ หรือเซสชันของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อเทรซ เมตริก หรือบันทึกเข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่นๆ
    - คุณต้องมีชื่อเมตริก ชื่อสแปน หรือโครงสร้างแอตทริบิวต์ที่ตรงกันทุกประการ เพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry หรือ JSONL บน stdout ผ่าน Plugin diagnostics-otel
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-07-19T07:10:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 95f62669cd8e26cf0e5e1bfd012321efe2f514efbcab6537186d5a83b22696c5
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกข้อมูลการวินิจฉัยผ่าน Plugin `diagnostics-otel` อย่างเป็นทางการ
โดยใช้ **OTLP/HTTP (protobuf)** นอกจากนี้ยังสามารถเขียนบันทึกเป็น JSONL ไปยัง stdout สำหรับ
ไปป์ไลน์บันทึกของคอนเทนเนอร์และแซนด์บ็อกซ์ได้ ตัวรวบรวมหรือแบ็กเอนด์ใดก็ตามที่รองรับ
OTLP/HTTP สามารถทำงานได้โดยไม่ต้องแก้ไขโค้ด สำหรับบันทึกไฟล์ภายในเครื่อง โปรดดู
[การบันทึก](/th/logging)

- **เหตุการณ์การวินิจฉัย** คือระเบียนแบบมีโครงสร้างภายในกระบวนการที่ส่งออกโดย
  Gateway และ Plugin ที่มาพร้อมกันสำหรับการเรียกใช้โมเดล โฟลว์ข้อความ เซสชัน คิว
  และการดำเนินการ
- **`diagnostics-otel`** สมัครรับเหตุการณ์เหล่านั้นและส่งออกเป็น
  **เมตริก**, **เทรซ** และ **บันทึก** ของ OpenTelemetry ผ่าน OTLP/HTTP และสามารถ
  มิเรอร์ระเบียนบันทึกไปยัง JSONL บน stdout
- **การเรียกผู้ให้บริการ** จะได้รับส่วนหัว W3C `traceparent` จากบริบทสแปน
  การเรียกโมเดลที่เชื่อถือได้ของ OpenClaw เมื่อทรานสปอร์ตของผู้ให้บริการรองรับส่วนหัว
  แบบกำหนดเอง บริบทเทรซที่ Plugin ส่งออกจะไม่ถูกส่งต่อ
- ตัวส่งออกจะเชื่อมต่อเฉพาะเมื่อเปิดใช้งานทั้งส่วนการวินิจฉัยและ Plugin
  ดังนั้นโดยค่าเริ่มต้นต้นทุนภายในกระบวนการจึงยังคงใกล้ศูนย์

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
`protocol` รองรับเฉพาะ `http/protobuf` เนื่องจาก `traces` และ `metrics` เปิดใช้งานเป็นค่าเริ่มต้น ค่าอื่นใด (รวมถึง `grpc`) จะยกเลิกการสมัครรับ diagnostics-otel ทั้งหมดพร้อมคำเตือน `unsupported protocol` ซึ่งจะหยุดการส่งออกบันทึกไปยัง stdout ด้วย ตั้งค่า `traces: false` และ `metrics: false` อย่างชัดเจน หากต้องการเฉพาะ `logsExporter: "stdout"` พร้อมค่าโปรโตคอลที่ไม่ใช่ OTLP
</Note>

## สัญญาณที่ส่งออก

| สัญญาณ      | ข้อมูลที่รวมอยู่                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **เมตริก** | ตัวนับ/ฮิสโตแกรมสำหรับการใช้โทเค็น ค่าใช้จ่าย ระยะเวลาการเรียกใช้ การสลับระบบเมื่อขัดข้อง การใช้ทักษะ โฟลว์ข้อความ เหตุการณ์ Talk เลนคิว สถานะ/การกู้คืนเซสชัน การดำเนินการเครื่องมือ การดำเนินการ หน่วยความจำ ความพร้อมทำงาน และสถานะของตัวส่งออก |
| **เทรซ**  | สแปนสำหรับการใช้งานโมเดล การเรียกโมเดล วงจรชีวิตของฮาร์เนส การใช้ทักษะ การดำเนินการเครื่องมือ การดำเนินการ การประมวลผล Webhook/ข้อความ การประกอบบริบท และลูปเครื่องมือ                                                      |
| **บันทึก**    | ระเบียน `logging.file` แบบมีโครงสร้างที่ส่งออกผ่าน OTLP หรือ JSONL บน stdout เมื่อเปิดใช้งาน `diagnostics.otel.logs`; เนื้อหาบันทึกจะถูกระงับไว้ เว้นแต่จะเปิดใช้งานการบันทึกเนื้อหาอย่างชัดเจน                          |

สลับ `traces`, `metrics` และ `logs` แยกจากกัน เทรซและเมตริก
จะเปิดเป็นค่าเริ่มต้นเมื่อ `diagnostics.otel.enabled` เป็น true ส่วนบันทึกจะปิดเป็นค่าเริ่มต้น
และส่งออกเฉพาะเมื่อ `diagnostics.otel.logs` เป็น `true` อย่างชัดเจน การส่งออกบันทึก
ใช้ OTLP เป็นค่าเริ่มต้น ตั้งค่า `diagnostics.otel.logsExporter` เป็น `stdout` สำหรับ JSONL บน
stdout หรือ `both` สำหรับทั้งสองแบบ

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
      serviceName: "openclaw-gateway", // หากไม่ได้ตั้งค่า จะใช้ OTEL_SERVICE_NAME และจากนั้นใช้ "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // ตัวสุ่มเลือกสแปนราก, 0.0..1.0
      flushIntervalMs: 60000, // ช่วงเวลาส่งออกเมตริก (ต่ำสุด 1000ms)
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | ค่าสำรองสำหรับ `diagnostics.otel.endpoint` เมื่อไม่ได้ตั้งค่าคีย์การกำหนดค่า                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | ค่าสำรองของปลายทางเฉพาะสัญญาณซึ่งใช้เมื่อไม่ได้ตั้งค่าคีย์การกำหนดค่า `diagnostics.otel.*Endpoint` ที่ตรงกัน การกำหนดค่าเฉพาะสัญญาณมีลำดับความสำคัญเหนือสภาพแวดล้อมเฉพาะสัญญาณ ซึ่งมีลำดับความสำคัญเหนือปลายทางที่ใช้ร่วมกัน                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | ค่าสำรองสำหรับ `diagnostics.otel.serviceName` เมื่อไม่ได้ตั้งค่าคีย์การกำหนดค่า ชื่อบริการเริ่มต้นคือ `openclaw`                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | ค่าสำรองสำหรับโปรโตคอลบนสายสื่อสารเมื่อไม่ได้ตั้งค่า `diagnostics.otel.protocol` เฉพาะ `http/protobuf` เท่านั้นที่เปิดใช้งานการส่งออก                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งค่าเป็น `gen_ai_latest_experimental` เพื่อส่งออกรูปแบบสแปนการอนุมาน GenAI ล่าสุด ได้แก่ ชื่อสแปน `{gen_ai.operation.name} {gen_ai.request.model}`, ชนิดสแปน `CLIENT` และ `gen_ai.provider.name` แทน `gen_ai.system` แบบเดิม เมตริก GenAI จะใช้แอตทริบิวต์ที่มีขอบเขตจำกัดและมีคาร์ดินาลิตีต่ำเสมอ |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งค่าเป็น `1` เมื่อพรีโหลดหรือกระบวนการโฮสต์อื่นลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น Plugin จะข้ามวงจรชีวิต NodeSDK ของตนเอง แต่ยังเชื่อมต่อตัวรับฟังการวินิจฉัยและปฏิบัติตาม `traces`/`metrics`/`logs`                                                                                    |

## ความเป็นส่วนตัวและการบันทึกเนื้อหา

โดยค่าเริ่มต้น ระบบจะ **ไม่** ส่งออกเนื้อหาดิบของโมเดล/เครื่องมือ สแปนจะมีตัวระบุ
ที่มีขอบเขตจำกัด (ช่องทาง ผู้ให้บริการ โมเดล หมวดหมู่ข้อผิดพลาด รหัสคำขอที่มีเฉพาะแฮช
แหล่งที่มาของเครื่องมือ เจ้าของเครื่องมือ ชื่อ/แหล่งที่มาของทักษะ) และจะไม่รวมข้อความพรอมต์
ข้อความตอบกลับ อินพุตเครื่องมือ เอาต์พุตเครื่องมือ พาธไฟล์ทักษะ หรือคีย์เซสชัน
ค่าที่มีลักษณะเหมือนคีย์เซสชันของเอเจนต์แบบมีขอบเขต (เช่น เริ่มต้นด้วย
`agent:`) จะถูกแทนที่ด้วย `unknown` ในแอตทริบิวต์ที่มีคาร์ดินาลิตีต่ำ โดยค่าเริ่มต้น ระเบียนบันทึก
OTLP จะเก็บระดับความรุนแรง ตัวบันทึก ตำแหน่งโค้ด บริบทเทรซที่เชื่อถือได้ และ
แอตทริบิวต์ที่ผ่านการทำให้ปลอดภัย ส่วนเนื้อหาข้อความบันทึกดิบจะถูกส่งออกเฉพาะ
เมื่อ `diagnostics.otel.captureContent` เป็นค่าบูลีน `true` คีย์ย่อยแบบละเอียด
`captureContent.*` จะไม่เปิดใช้งานเนื้อหาบันทึก เมตริก Talk ส่งออกเฉพาะ
ข้อมูลเมตาของเหตุการณ์ที่มีขอบเขตจำกัด (โหมด ทรานสปอร์ต ผู้ให้บริการ ประเภทเหตุการณ์) โดยไม่มี
บทถอดเสียง เพย์โหลดเสียง รหัสเซสชัน รหัสเทิร์น รหัสการโทร รหัสห้อง หรือ
โทเค็นส่งต่อ

คำขอโมเดลขาออกอาจมีส่วนหัว W3C `traceparent` ซึ่งสร้างขึ้นเฉพาะ
จากบริบทเทรซการวินิจฉัยที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่กำลังใช้งาน
ส่วนหัว `traceparent` ที่ผู้เรียกส่งมาอยู่แล้วจะถูกแทนที่ ดังนั้น Plugin หรือ
ตัวเลือกผู้ให้บริการแบบกำหนดเองจึงไม่สามารถปลอมแปลงสายสืบทอดเทรซข้ามบริการได้

ตั้งค่า `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อมีการอนุมัติตัวรวบรวม
และนโยบายการเก็บรักษาของคุณสำหรับข้อความพรอมต์ การตอบกลับ เครื่องมือ หรือ
พรอมต์ระบบแล้ว แต่ละคีย์ย่อยทำงานแยกจากกัน:

- `inputMessages` - เนื้อหาพรอมต์ของผู้ใช้
- `outputMessages` - เนื้อหาการตอบกลับของโมเดล
- `toolInputs` - เพย์โหลดอาร์กิวเมนต์ของเครื่องมือ
- `toolOutputs` - เพย์โหลดผลลัพธ์ของเครื่องมือ
- `systemPrompt` - พรอมต์ระบบ/นักพัฒนาที่ประกอบแล้ว
- `toolDefinitions` - ชื่อ คำอธิบาย และสคีมาของเครื่องมือโมเดล

เมื่อเปิดใช้งานคีย์ย่อยใดก็ตาม สแปนของโมเดลและเครื่องมือจะได้รับแอตทริบิวต์
`openclaw.content.*` ที่มีขอบเขตจำกัดและผ่านการปกปิดข้อมูลสำหรับคลาสนั้นเท่านั้น

<Note>
ค่าบูลีน `captureContent: true` เปิดใช้งาน `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` และเนื้อหาบันทึก OTLP พร้อมกัน แต่ **ไม่** เปิดใช้งาน `systemPrompt` ให้ตั้งค่า `captureContent.systemPrompt: true` อย่างชัดเจน หากต้องการพรอมต์ระบบที่ประกอบแล้วด้วย
</Note>

เนื้อหา `toolInputs`/`toolOutputs` จะถูกบันทึกสำหรับการดำเนินการเครื่องมือ
ของรันไทม์เอเจนต์ในตัว (`openclaw.content.tool_input` และ
`gen_ai.tool.call.arguments` ในสแปนที่เสร็จสมบูรณ์/มีข้อผิดพลาด;
`openclaw.content.tool_output` และ `gen_ai.tool.call.result` ในสแปนที่เสร็จสมบูรณ์)
ชื่อ `openclaw.content.*` ยังคงเป็นชื่อแอตทริบิวต์ OpenClaw ที่เสถียร
ส่วนสำเนา `gen_ai.tool.call.*` จะมิเรอร์ชื่อเหล่านั้นสำหรับโปรแกรมดูที่รองรับ semconv โดยตรง
การเรียกเครื่องมือของฮาร์เนสภายนอก (Codex, Claude CLI) จะส่งออก
สแปน `tool.execution.*` โดยไม่มีเพย์โหลดเนื้อหา เนื้อหาที่บันทึกจะส่งผ่าน
ช่องทางที่เชื่อถือได้และมีเฉพาะตัวรับฟังเท่านั้น และจะไม่ถูกวางบนบัสเหตุการณ์การวินิจฉัย
สาธารณะ

## การสุ่มตัวอย่างและการฟลัช

- **เทรซ:** `diagnostics.otel.sampleRate` ตั้งค่า `TraceIdRatioBasedSampler`
  เฉพาะบนสแปนราก (`0.0` ละทิ้งทั้งหมด, `1.0` เก็บทั้งหมด) หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นของ
  OpenTelemetry SDK (เปิดใช้งานเสมอ)
- **เมตริก:** `diagnostics.otel.flushIntervalMs` (จำกัดค่าต่ำสุดไว้ที่
  `1000`); หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นการส่งออกเป็นระยะของ SDK
- **บันทึก:** บันทึก OTLP ใช้ `logging.level` (ระดับบันทึกของไฟล์) และใช้
  เส้นทางการปกปิดข้อมูลระเบียนบันทึกการวินิจฉัย ไม่ใช่การจัดรูปแบบคอนโซล การติดตั้งที่มีปริมาณข้อมูลสูง
  ควรเลือกใช้การสุ่มตัวอย่าง/การกรองของตัวรวบรวม OTLP แทน
  การสุ่มตัวอย่างภายในเครื่อง ตั้งค่า `diagnostics.otel.logsExporter: "stdout"` เมื่อแพลตฟอร์มของคุณ
  ส่ง stdout/stderr ไปยังตัวประมวลผลบันทึกอยู่แล้ว และคุณไม่มีตัวรวบรวมบันทึก
  OTLP ระเบียน stdout เป็นออบเจ็กต์ JSON หนึ่งรายการต่อบรรทัด พร้อม `ts`, `signal`,
  `service.name`, ระดับความรุนแรง, เนื้อหา, แอตทริบิวต์ที่ปกปิดข้อมูลแล้ว และฟิลด์เทรซที่เชื่อถือได้
  เมื่อมี
- **การเชื่อมโยงบันทึกไฟล์:** บันทึกไฟล์ JSONL มี `traceId`,
  `spanId`, `parentSpanId` และ `traceFlags` ที่ระดับบนสุด เมื่อการเรียกบันทึกมี
  บริบทเทรซการวินิจฉัยที่ถูกต้อง ทำให้ตัวประมวลผลบันทึกเชื่อมโยงบรรทัดบันทึกภายในเครื่องกับ
  สแปนที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP และเฟรม WebSocket ของ Gateway สร้าง
  ขอบเขตเทรซคำขอภายใน โดยค่าเริ่มต้น บันทึกและเหตุการณ์การวินิจฉัยภายใน
  ขอบเขตดังกล่าวจะสืบทอดเทรซของคำขอ ขณะที่สแปนการรันเอเจนต์และการเรียกโมเดล
  จะถูกสร้างเป็นสแปนลูก เพื่อให้ส่วนหัว `traceparent` ของผู้ให้บริการอยู่บน
  เทรซเดียวกัน
- **การเชื่อมโยงการเรียกโมเดล:** สแปน `openclaw.model.call` มีขนาดองค์ประกอบพรอมต์
  ที่ปลอดภัยโดยค่าเริ่มต้น และมีแอตทริบิวต์โทเค็นต่อการเรียกเมื่อผลลัพธ์ของผู้ให้บริการ
  เปิดเผยข้อมูลการใช้งาน `openclaw.model.usage` ยังคงเป็นสแปนการบันทึกบัญชี
  ระดับการรันสำหรับต้นทุนรวม บริบท และแดชบอร์ดช่องทาง และ
  ยังคงอยู่บนเทรซการวินิจฉัยเดียวกันเมื่อรันไทม์ที่ส่งข้อมูลมีบริบทเทรซ
  ที่เชื่อถือได้

### หน่วยการสังเกตการเรียกโมเดล

ทุกสแปน `openclaw.model.call` ระบุว่าวงจรชีวิตของสแปนวัดสิ่งใดผ่าน
`openclaw.model_call.observation_unit`:

- `request` - คำขอโมเดล/ผู้ให้บริการที่สังเกตได้หนึ่งรายการ การเรียกโมเดลแบบฝังตัวดั้งเดิม
  ใช้หน่วยนี้ และตัวส่งออกจะถือว่าค่าที่ไม่มีเป็น `request` เพื่อ
  ความเข้ากันได้กับตัวส่งข้อมูลรุ่นเก่าหรือภายนอก
- `turn` - รอบการทำงาน CLI ของเอเจนต์แบบทึบหนึ่งรอบ ซึ่งอาจมีคำขอโมเดลที่ซ่อนอยู่
  การลองใหม่ งานเครื่องมือ หรืองานเบื้องหลัง การเรียก Claude Code CLI และ Codex app-server
  ใช้หน่วยนี้

ทั้งสองหน่วยยังคงเป็นสแปนการเรียกโมเดล เพื่อให้แบ็กเอนด์เทรซแสดงอินพุต
เอาต์พุต การใช้งาน และลำดับชั้นของโมเดลได้ สแปนคำขอใช้การดำเนินการ GenAI ที่ได้มาจาก API
(`chat`, `generate_content` หรือ `text_completion`) ขณะที่สแปนรอบการทำงานใช้
`gen_ai.operation.name = invoke_agent` ทั้งสองมีส่วนใน
`gen_ai.client.operation.duration` ซึ่งชื่อการดำเนินการจะแยก
เวลาแฝงของคำขอโดยตรงออกจากเวลาแฝงของรอบการทำงานทั้งหมด เมตริกการเรียกโมเดล OTEL ของ OpenClaw
ยังมี `openclaw.model_call.observation_unit`; เมตริกการเรียกโมเดล
Prometheus แสดงป้ายกำกับ `observation_unit` ที่เทียบเท่ากัน

### ความเที่ยงตรงของการเรียกโมเดล Claude Code CLI

รอบการทำงาน Claude Code CLI ส่งสแปน `openclaw.model.call`
สังเคราะห์ระดับรอบการทำงานหนึ่งสแปน สแปนเหล่านี้ไม่ใช่สแปนคำขอ HTTP ของ Anthropic โดยใช้ `openclaw.api =
claude-code`, `openclaw.model_call.observation_unit = turn` และระบุ
การดำเนินการเป็น `gen_ai.operation.name = invoke_agent` ทั้งยังระบุ
ขอบเขต CLI ของ OpenClaw ผ่าน
`openclaw.transport`:

- `stdio` - กระบวนการ Claude Code ภายในเครื่องแบบครั้งเดียว
- `stdio-live` - หนึ่งรอบการทำงานบนเซสชัน Claude stdio แบบถาวรที่มีการจัดการ
- `paired-node-cli` - การดำเนินการ Claude Code แบบครั้งเดียวที่มอบหมายให้
  Node ที่จับคู่ไว้

การวินิจฉัย Claude CLI จะถูกสร้างอินสแตนซ์เฉพาะขณะที่ตัวกระจายการวินิจฉัย
ของกระบวนการเปิดใช้งานอยู่ และมีตัวรับฟังเหตุการณ์ภายในหรือที่เชื่อถือได้แนบอยู่
เมื่อไม่มี Plugin สำหรับการสังเกตการณ์หรือตัวรับฟังอื่นทำงานอยู่ รอบการทำงาน Claude CLI จะข้าม
ลำดับชั้นเทรซสังเคราะห์ บัฟเฟอร์เนื้อหา และการบันทึกบัญชีไบต์ของสตรีม
การวินิจฉัย เมื่อเปิดใช้การบันทึกเนื้อหา ฟิลด์พรอมต์และพรอมต์ระบบ
จะถูกจำกัดไว้ที่ฟิลด์ละ 128 KiB; เอาต์พุตของผู้ช่วยถูกจำกัดไว้ที่ 128 KiB ใน
เอนเวโลปไม่เกิน 200 รายการ โดยสงวน 16 KiB และหนึ่งรายการสำหรับการตอบกลับสำรองสุดท้าย
ที่ผู้ใช้มองเห็น เครื่องหมายจะบันทึกการตัดทอนเมื่อถึงขีดจำกัด

OpenClaw กำหนดให้รอบการทำงาน Claude CLI ใช้ลำดับชั้นความเป็นเจ้าของเดียวกับที่ใช้โดย
รันไทม์เอเจนต์อื่น: `openclaw.harness.run` (`openclaw.harness.id = claude-cli`)
มี `openclaw.run` ซึ่งมีสแปน Claude `openclaw.model.call`
สแปนฮาร์เนสและสแปนการรันเป็นขอบเขตรอบการทำงานสังเคราะห์ของ OpenClaw ไม่ใช่
ระยะภายในของ Claude Code รอบการทำงานแบบครั้งเดียวและ stdio ที่มีการจัดการใช้
ลำดับชั้นเดียวกัน; การลองใหม่ด้วยเซสชันใหม่จริงจะสร้างสแปนลูกการเรียกโมเดลอีกสแปน
ภายในการรัน OpenClaw เดียวกัน

สแปนเริ่มเมื่อ OpenClaw รับรอบการทำงาน CLI ที่เตรียมไว้ และสิ้นสุดหลังจาก
รอบการทำงานนั้นสำเร็จหรือล้มเหลวเท่านั้น สำหรับเซสชันที่มีการจัดการ ผลลัพธ์สำเร็จชั่วคราว
จะไม่สิ้นสุดสแปนขณะที่ Claude รายงานเอเจนต์หรือลำดับงานเบื้องหลังที่ยังคงผลลัพธ์ไว้;
ผลลัพธ์สุดท้ายหลังระบายงานแล้วจึงจะสิ้นสุด การยกเลิก หมดเวลา กระบวนการล้มเหลว
เอาต์พุต/การแยกวิเคราะห์ล้มเหลว และความล้มเหลวอื่นของรอบการทำงาน จะสิ้นสุดสแปนเดียวกันด้วยข้อผิดพลาด

Claude Code รายงานการใช้งานต่อข้อความของผู้ช่วย และอาจรายงานการใช้งานสะสม
ในผลลัพธ์ปลายทางด้วย การบันทึกบัญชีการตอบกลับของ OpenClaw ยังคงใช้
ข้อความล่าสุดของผู้ช่วย เพื่อไม่ให้ความหมายของต้นทุนที่มีอยู่เปลี่ยนแปลง;
สแปนการเรียกโมเดลระดับรอบการทำงานใช้การใช้งานสะสมที่ปลายทางเมื่อมี
รวมถึงโทเค็นการอ่านแคชและการสร้างแคช

สำหรับสแปน CLI เหล่านี้ ฟิลด์ไบต์และเวลาจะอธิบายขอบเขต CLI ของ OpenClaw
ที่สังเกตได้:

- `openclaw.model_call.request_bytes` คือขนาด UTF-8 ของค่าพรอมต์
  ที่ส่งผ่าน stdin/argv แบบครั้งเดียว หรือเอนเวโลปผู้ใช้ JSONL ของ stdio ที่มีการจัดการ ซึ่ง
  ไม่ใช่ขนาดของคำขอโมเดลที่ซ่อนอยู่ของ Claude Code
- `openclaw.model_call.response_bytes` คือขนาด UTF-8 ของ stdout จาก Claude CLI
  ที่สังเกตได้ระหว่างรอบการทำงาน ซึ่งไม่ใช่ขนาดการตอบกลับ HTTP ของ Anthropic
- `openclaw.model_call.time_to_first_byte_ms` คือเวลาจนถึงเอาต์พุต stdout หรือ stderr
  จาก Claude CLI ที่สังเกตได้ครั้งแรก ซึ่งไม่ใช่ TTFB ของเครือข่าย

เมื่อเปิดใช้ฟิลด์ `captureContent` แบบละเอียดที่ตรงกัน สแปนจะส่งออก
พรอมต์ที่มีผลจริงซึ่ง OpenClaw ส่งให้ Claude Code, พรอมต์ระบบที่ OpenClaw ต่อท้าย และข้อความ/การให้เหตุผล/ข้อมูลระบุการเรียกเครื่องมือของผู้ช่วยที่มองเห็นได้ ผ่าน
`gen_ai.input.messages`, `gen_ai.output.messages` และ
`gen_ai.system_instructions` อาร์กิวเมนต์เครื่องมือ ลายเซ็นการคิดแบบทึบ และ
ผลลัพธ์เครื่องมือจะถูกละเว้นจากเอนเวโลปผู้ช่วย Claude OpenClaw ไม่
อ้างว่าสามารถเข้าถึงพรอมต์ระบบส่วนตัวของ Claude Code, เพย์โหลดคำขอที่ซ่อนอยู่ซึ่งกลับมาทำต่อหรือ
ผ่าน Compaction แล้ว, สคีมาเครื่องมือภายในดั้งเดิม, คำขอ HTTP ดิบของ Anthropic,
การลองใหม่ภายใน, รหัสคำขอต้นทาง หรือ TTFB ของเครือข่ายจริง เนื่องจาก
Claude Code ไม่เปิดเผยคำนิยามเครื่องมือดั้งเดิมที่มีผลจริงอย่างถูกต้อง
สแปนเหล่านี้จึงไม่เติมข้อมูล `gen_ai.tool.definitions`

สแปนเครื่องมือฮาร์เนส Claude ภายนอกยังคงมีเฉพาะเมตาดาต้า แม้เมื่อเปิดใช้
การบันทึกเนื้อหาเครื่องมือ เช่นเดียวกับสแปนโมเดลทุกสแปน เนื้อหา Claude CLI ที่บันทึกไว้ใช้
เส้นทางสำหรับตัวรับฟังที่เชื่อถือได้เท่านั้น และใช้การปกปิดข้อมูลกับขีดจำกัดขนาด
ที่มีอยู่ของตัวส่งออก; เนื้อหาจะปิดใช้งานโดยค่าเริ่มต้น

## เมตริกที่ส่งออก

### การใช้งานโมเดล

- `openclaw.tokens` (ตัวนับ, แอตทริบิวต์: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (ฮิสโตแกรม, เมตริกตามข้อกำหนดเชิงความหมายของ GenAI, แอตทริบิวต์: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (ฮิสโตแกรม, วินาที, เมตริกตามข้อกำหนดเชิงความหมายของ GenAI สำหรับคำขอโมเดลและรอบการทำงานของเอเจนต์สังเคราะห์; แอตทริบิวต์: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` ซึ่งไม่บังคับ; การสังเกตรอบการทำงานใช้ `gen_ai.operation.name = invoke_agent`)
- `openclaw.model_call.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit` รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` สำหรับข้อผิดพลาดที่จำแนกแล้ว)
- `openclaw.model_call.request_bytes` (ฮิสโตแกรม, ขนาดไบต์ UTF-8 ของเพย์โหลดคำขอโมเดลสุดท้าย; สำหรับ Claude Code CLI คืออินพุตพรอมต์/เอนเวโลปที่สังเกตได้ตามที่อธิบายไว้ข้างต้น; ไม่มีเนื้อหาเพย์โหลดดิบ)
- `openclaw.model_call.response_bytes` (ฮิสโตแกรม, ขนาดไบต์ UTF-8 ของเพย์โหลดส่วนการตอบกลับที่สตรีม; เดลตาข้อความ การคิด และการเรียกเครื่องมือที่มีความถี่สูงจะนับเฉพาะไบต์ `delta` ส่วนเพิ่ม; สำหรับ Claude Code CLI คือไบต์ stdout ที่สังเกตได้; ไม่มีเนื้อหาการตอบกลับดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (ฮิสโตแกรม, เวลาที่ผ่านไปก่อนเหตุการณ์การตอบกลับแบบสตรีมครั้งแรก; สำหรับ Claude Code CLI คือเอาต์พุต CLI ที่สังเกตได้ครั้งแรก ไม่ใช่ TTFB ของเครือข่าย)
- `openclaw.model.failover` (ตัวนับ, แอตทริบิวต์: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (ตัวนับ, แอตทริบิวต์: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` ซึ่งไม่บังคับ, `openclaw.toolName` ซึ่งไม่บังคับ)

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

### Talk

- `openclaw.talk.event` (ตัวนับ, แอตทริบิวต์: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับ `openclaw.talk.event`; ส่งออกเมื่อเหตุการณ์ Talk รายงานระยะเวลา)
- `openclaw.talk.audio.bytes` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับ `openclaw.talk.event`; ส่งออกสำหรับเหตุการณ์เฟรมเสียง Talk ที่รายงานความยาวเป็นไบต์)

### คิวและเซสชัน

- `openclaw.queue.lane.enqueue` (ตัวนับ, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (ตัวนับ, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.queue.depth` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.lane` หรือ `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.session.state` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (ตัวนับ, แอตทริบิวต์: `openclaw.state`; ปล่อยออกมาสำหรับข้อมูลบันทึกสถานะเซสชันที่ล้าสมัยและกู้คืนได้)
- `openclaw.session.stuck_age_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.state`; ปล่อยออกมาสำหรับข้อมูลบันทึกสถานะเซสชันที่ล้าสมัยและกู้คืนได้)
- `openclaw.session.turn.created` (ตัวนับ, แอตทริบิวต์: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับตัวนับการกู้คืนที่ตรงกัน)
- `openclaw.run.attempt` (ตัวนับ, แอตทริบิวต์: `openclaw.attempt`)

### เทเลเมทรีความพร้อมทำงานของเซสชัน

`diagnostics.stuckSessionWarnMs` คือเกณฑ์อายุที่ไม่มีความคืบหน้าสำหรับการวินิจฉัย
ความพร้อมทำงานของเซสชัน เซสชัน `processing` จะไม่นับอายุเข้าสู่
เกณฑ์นี้ขณะที่ OpenClaw ตรวจพบความคืบหน้าจากการตอบกลับ เครื่องมือ สถานะ บล็อก หรือรันไทม์
ACP สัญญาณคงการเชื่อมต่อจากการพิมพ์ไม่นับเป็นความคืบหน้า ดังนั้นจึงยังตรวจจับโมเดลหรือ
ฮาร์เนสที่เงียบได้

OpenClaw จำแนกเซสชันตามงานที่ยังสามารถสังเกตได้:

- `session.long_running`: งานแบบฝัง การเรียกโมเดล หรือการเรียกเครื่องมือที่ทำงานอยู่
  ยังคงมีความคืบหน้า การเรียกโมเดลที่มีเจ้าของซึ่งเงียบเกิน
  `diagnostics.stuckSessionWarnMs` จะรายงานเป็นการทำงานระยะยาวก่อนถึง
  `diagnostics.stuckSessionAbortMs` ด้วย เพื่อไม่ให้ผู้ให้บริการโมเดลที่ช้าหรือไม่สตรีม
  ดูเหมือนเป็นเซสชัน Gateway ที่หยุดชะงัก ขณะที่ยังสังเกตการยกเลิกได้
- `session.stalled`: มีงานที่ทำงานอยู่ แต่การทำงานที่ใช้งานอยู่ไม่ได้รายงาน
  ความคืบหน้าล่าสุด การเรียกโมเดลที่มีเจ้าของจะเปลี่ยนจาก `session.long_running` เป็น
  `session.stalled` เมื่อถึงหรือเกิน `diagnostics.stuckSessionAbortMs`; กิจกรรม
  โมเดล/เครื่องมือที่ล้าสมัยและไม่มีเจ้าของจะไม่ถือว่าเป็นงานระยะยาวที่ไม่เป็นอันตราย
  การทำงานแบบฝังที่หยุดชะงักจะอยู่ในโหมดสังเกตเท่านั้นในช่วงแรก จากนั้นจะยกเลิกและระบายงานหลังจาก
  `diagnostics.stuckSessionAbortMs` โดยไม่มีความคืบหน้า เพื่อให้เทิร์นที่รออยู่ด้านหลัง
  เลนสามารถทำงานต่อได้ เมื่อไม่ได้ตั้งค่า เกณฑ์การยกเลิกจะใช้ค่าเริ่มต้นเป็นช่วงขยายที่ปลอดภัยกว่า
  ซึ่งอย่างน้อย 5 นาทีและ 3 เท่าของ
  `diagnostics.stuckSessionWarnMs`
- `session.stuck`: ข้อมูลบันทึกสถานะเซสชันที่ล้าสมัยโดยไม่มีงานที่ทำงานอยู่ หรือเซสชัน
  ในคิวที่ไม่ได้ทำงานซึ่งมีกิจกรรมโมเดล/เครื่องมือที่ล้าสมัยและไม่มีเจ้าของ การดำเนินการนี้จะปล่อย
  เลนเซสชันที่ได้รับผลกระทบทันทีหลังจากผ่านเกตการกู้คืน

การกู้คืนจะปล่อยเหตุการณ์ `session.recovery.requested` และ
`session.recovery.completed` ที่มีโครงสร้าง สถานะเซสชันสำหรับการวินิจฉัยจะถูกทำเครื่องหมายว่าไม่ได้ทำงาน
เฉพาะหลังจากผลลัพธ์การกู้คืนที่มีการเปลี่ยนแปลง (`aborted` หรือ `released`) และเฉพาะเมื่อ
เจเนอเรชันการประมวลผลเดิมยังเป็นเจเนอเรชันปัจจุบัน

เฉพาะ `session.stuck` เท่านั้นที่ปล่อยตัวนับ `openclaw.session.stuck`,
ฮิสโตแกรม `openclaw.session.stuck_age_ms` และสแปน `openclaw.session.stuck`
การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะเพิ่มระยะเว้นขณะที่เซสชันยังคง
ไม่เปลี่ยนแปลง ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นอย่างต่อเนื่อง แทนที่จะเป็น
ทุกจังหวะ Heartbeat สำหรับตัวเลือกการกำหนดค่าและค่าเริ่มต้น โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics)

คำเตือนความพร้อมทำงานจะปล่อยรายการต่อไปนี้ด้วย:

- `openclaw.liveness.warning` (ตัวนับ, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)

### วงจรชีวิตของฮาร์เนส

- `openclaw.harness.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อเกิดข้อผิดพลาด)

### การเรียกใช้เครื่องมือและการตรวจจับลูป

- `openclaw.tool.execution.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind` รวมถึง `openclaw.errorCategory` เมื่อเกิดข้อผิดพลาด)
- `openclaw.tool.execution.blocked` (ตัวนับ, แอตทริบิวต์: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (ตัวนับ, แอตทริบิวต์: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` ซึ่งเป็นตัวเลือก; ปล่อยออกมาเมื่อตรวจพบลูปการเรียกเครื่องมือซ้ำ)

### Exec

- `openclaw.exec.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### กลไกภายในการวินิจฉัย (หน่วยความจำ เพย์โหลด และสถานะของตัวส่งออก)

- `openclaw.payload.large` (ตัวนับ, แอตทริบิวต์: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับ `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (ฮิสโตแกรม, ไม่มีแอตทริบิวต์; ตัวอย่างหน่วยความจำของกระบวนการ)
- `openclaw.memory.pressure` (ตัวนับ, แอตทริบิวต์: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (ตัวนับ, แอตทริบิวต์: `openclaw.diagnostic.async_queue.drop_class`; รายการที่ถูกทิ้งเนื่องจากแรงดันย้อนกลับของคิวการวินิจฉัยภายใน)
- `openclaw.telemetry.exporter.events` (ตัวนับ, แอตทริบิวต์: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` ซึ่งเป็นตัวเลือก, `openclaw.errorCategory` ซึ่งเป็นตัวเลือก; เทเลเมทรีตนเองของวงจรชีวิต/ความล้มเหลวของตัวส่งออก)

## สแปนที่ส่งออก

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (อินพุต/เอาต์พุต/การอ่านแคช/การเขียนแคช/ทั้งหมด)
  - `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้แบบแผนเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้แบบแผนเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit` (`request` หรือ `turn`)
  - `openclaw.errorCategory`, `error.type` และ `openclaw.failureKind` ซึ่งเป็นตัวเลือกเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (เฉพาะขนาดองค์ประกอบที่ปลอดภัย ไม่มีข้อความพรอมต์)
  - `openclaw.model_call.usage.*` และ `gen_ai.usage.*` เมื่อผลลัพธ์มีข้อมูลการใช้งานสำหรับคำขอนั้นหรือเทิร์นรวม
  - เหตุการณ์สแปน `openclaw.provider.request` พร้อมแอตทริบิวต์ `openclaw.upstreamRequestIdHash` (มีขอบเขตจำกัดและอิงแฮช) เมื่อผลลัพธ์จากผู้ให้บริการต้นทางเปิดเผยรหัสคำขอ; จะไม่มีการส่งออกรหัสดิบ
  - เมื่อใช้ `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` สแปนคำขอจะใช้ชื่อสแปนการอนุมาน GenAI ล่าสุด `{gen_ai.operation.name} {gen_ai.request.model}` สแปนเทิร์นใช้ `invoke_agent` เนื่องจาก OpenClaw ไม่อ้างชื่อเอเจนต์ดั้งเดิมจากขอบเขต CLI แบบทึบ ทั้งคู่ใช้ชนิดสแปน `CLIENT` แทน `openclaw.model.call`
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - เมื่อเสร็จสมบูรณ์: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - เมื่อเกิดข้อผิดพลาด: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` ซึ่งเป็นตัวเลือก
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, `gen_ai.tool.call.id` ซึ่งเป็นตัวเลือก, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - `openclaw.errorCategory`/`openclaw.errorCode` ซึ่งเป็นตัวเลือกเมื่อเกิดข้อผิดพลาด, `openclaw.deniedReason` และ `openclaw.outcome=blocked` เมื่อถูกปฏิเสธโดยนโยบายหรือแซนด์บ็อกซ์
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
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` ซึ่งเป็นตัวเลือก (ไม่มีข้อความลูป พารามิเตอร์ หรือเอาต์พุตเครื่องมือ)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms` ซึ่งเป็นตัวเลือก

เมื่อเปิดใช้งานการบันทึกเนื้อหาอย่างชัดเจน สแปนของโมเดลและเครื่องมือยังสามารถ
รวมแอตทริบิวต์ `openclaw.content.*` ที่มีขอบเขตจำกัดและปกปิดข้อมูลแล้ว สำหรับ
คลาสเนื้อหาเฉพาะที่เลือกใช้

## แค็ตตาล็อกเหตุการณ์การวินิจฉัย

เหตุการณ์ด้านล่างรองรับเมตริกและสแปนข้างต้น หรือพร้อมให้ Plugin
สมัครรับข้อมูลโดยตรง `run.progress` และ `run.execution_phase` เป็นสัญญาณวงจรชีวิต
แบบตรงเท่านั้น; Plugin diagnostics-otel จะไม่ส่งออกสัญญาณเหล่านี้เป็น
สัญญาณ OTLP แบบแยกเดี่ยว ชนิดเหตุการณ์และค่า `run.execution_phase.phase`
เป็นแบบเพิ่มเติม ผู้ใช้งาน TypeScript ควรเก็บสาขาเริ่มต้นไว้ แทนที่จะสันนิษฐานว่า
ยูเนียนใดยูเนียนหนึ่งจะครอบคลุมทั้งหมดอย่างถาวร

**การใช้งานโมเดล**

- `model.usage` - โทเค็น ค่าใช้จ่าย ระยะเวลา บริบท ผู้ให้บริการ/โมเดล/ช่องทาง
  รหัสเซสชัน `usage` คือการลงบัญชีของผู้ให้บริการ/เทิร์นสำหรับค่าใช้จ่ายและเทเลเมทรี;
  `context.used` คือสแนปช็อตพรอมต์/บริบทปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการ เมื่อมีอินพุตที่แคชไว้หรือการเรียกภายในลูปเครื่องมือ

**โฟลว์ข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `run.execution_phase` (หมุดหมายการเริ่มทำงานของตัวรันแบบฝังที่เป็นสาธารณะและเชื่อมโยงกับเซสชัน)
- `diagnostic.heartbeat` (ตัวนับรวม: Webhook/คิว/เซสชัน)

**วงจรชีวิตของฮาร์เนส**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  วงจรชีวิตต่อการรันสำหรับชุดเครื่องมือเอเจนต์ ประกอบด้วย `harnessId`, `pluginId`
  ที่ไม่บังคับ, ผู้ให้บริการ/โมเดล/ช่องทาง และรหัสการรัน เมื่อเสร็จสิ้นจะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ที่ไม่บังคับ, `yieldDetected`
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` ที่ไม่บังคับ

**การดำเนินการ**

- `exec.process.completed` - ผลลัพธ์ของเทอร์มินัล ระยะเวลา เป้าหมาย โหมด รหัส
  ออก และประเภทความล้มเหลว โดยไม่รวมข้อความคำสั่งและไดเรกทอรีทำงาน
- `exec.approval.followup_suppressed` - การติดตามผลการอนุมัติที่ล้าสมัยถูกละทิ้ง
  หลังจากเชื่อมโยงเซสชันใหม่ ประกอบด้วย `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` หรือ `gateway_preflight`)
  และการประทับเวลาของตัวส่งงาน โดยไม่รวมคีย์เซสชัน เส้นทาง และข้อความคำสั่ง

## เมื่อไม่มีตัวส่งออก

ทำให้อีเวนต์การวินิจฉัยพร้อมใช้งานสำหรับ Plugin หรือตัวรับข้อมูลแบบกำหนดเองโดยไม่ต้องเรียกใช้
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุตดีบักแบบเจาะจงโดยไม่เพิ่ม `logging.level` ให้ใช้แฟล็ก
การวินิจฉัย แฟล็กไม่คำนึงถึงตัวพิมพ์เล็กและใหญ่และรองรับไวลด์การ์ด (`telegram.*` หรือ
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

หรือใช้การแทนที่ด้วยตัวแปรสภาพแวดล้อมแบบครั้งเดียว:

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

หรือไม่นำ `diagnostics-otel` ไว้ใน `plugins.allow` หรือเรียกใช้
`openclaw plugins disable diagnostics-otel`

## ที่เกี่ยวข้อง

- [การบันทึก](/th/logging) - บันทึกในไฟล์ เอาต์พุตคอนโซล การติดตามผ่าน CLI และแท็บบันทึกของ Control UI
- [การทำงานภายในของการบันทึก Gateway](/th/gateway/logging) - รูปแบบบันทึก WS คำนำหน้าระบบย่อย และการบันทึกเอาต์พุตคอนโซล
- [แฟล็กการวินิจฉัย](/th/diagnostics/flags) - แฟล็กบันทึกดีบักแบบเจาะจง
- [การส่งออกข้อมูลการวินิจฉัย](/th/gateway/diagnostics) - เครื่องมือชุดข้อมูลสนับสนุนสำหรับผู้ปฏิบัติงาน (แยกจากการส่งออก OTEL)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) - ข้อมูลอ้างอิงฟิลด์ `diagnostics.*` ฉบับเต็ม
