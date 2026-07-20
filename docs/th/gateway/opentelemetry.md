---
read_when:
    - คุณต้องการส่งเมตริกการใช้งานโมเดล โฟลว์ข้อความ หรือเซสชันของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry
    - คุณกำลังเชื่อมต่อเทรซ เมตริก หรือบันทึกเข้ากับ Grafana, Datadog, Honeycomb, New Relic, Tempo หรือแบ็กเอนด์ OTLP อื่นๆ
    - คุณต้องมีชื่อเมตริก ชื่อสแปน หรือโครงสร้างแอตทริบิวต์ที่แน่นอนเพื่อสร้างแดชบอร์ดหรือการแจ้งเตือน
summary: ส่งออกข้อมูลวินิจฉัยของ OpenClaw ไปยังตัวรวบรวม OpenTelemetry หรือ JSONL ทาง stdout ผ่าน Plugin diagnostics-otel
title: การส่งออก OpenTelemetry
x-i18n:
    generated_at: "2026-07-20T06:00:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ed37f094c6c151379d8e0aaa2633b3ebebdb08b7dcbc9403c4bdeb6e5b8cf76
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw ส่งออกข้อมูลวินิจฉัยผ่าน plugin `diagnostics-otel` อย่างเป็นทางการ
โดยใช้ **OTLP/HTTP (protobuf)** นอกจากนี้ยังสามารถเขียนบันทึกเป็น stdout JSONL สำหรับ
ไปป์ไลน์บันทึกของคอนเทนเนอร์และแซนด์บ็อกซ์ได้ ตัวรวบรวมหรือแบ็กเอนด์ใดก็ตามที่รองรับ
OTLP/HTTP สามารถใช้งานได้โดยไม่ต้องแก้ไขโค้ด สำหรับบันทึกไฟล์ภายในเครื่อง โปรดดู
[การบันทึก](/th/logging)

- **เหตุการณ์วินิจฉัย** คือระเบียนที่มีโครงสร้างภายในกระบวนการ ซึ่งปล่อยโดย
  Gateway และ plugin ที่รวมมาให้ สำหรับการเรียกใช้โมเดล โฟลว์ข้อความ เซสชัน คิว
  และการเรียกใช้คำสั่ง
- **`diagnostics-otel`** สมัครรับเหตุการณ์เหล่านั้นและส่งออกเป็น
  **เมตริก**, **เทรซ** และ **บันทึก** ของ OpenTelemetry ผ่าน OTLP/HTTP และสามารถ
  ทำสำเนาระเบียนบันทึกไปยัง stdout JSONL ได้
- **การเรียกผู้ให้บริการ** จะได้รับส่วนหัว W3C `traceparent` จากบริบทสแปน
  การเรียกโมเดลที่เชื่อถือได้ของ OpenClaw เมื่อการรับส่งข้อมูลของผู้ให้บริการรองรับส่วนหัว
  ที่กำหนดเอง บริบทเทรซที่ปล่อยโดย plugin จะไม่ถูกส่งต่อ
- ตัวส่งออกจะเชื่อมต่อเฉพาะเมื่อเปิดใช้งานทั้งพื้นผิวการวินิจฉัยและ plugin
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

หรือเปิดใช้งาน plugin จาก CLI: `openclaw plugins enable diagnostics-otel`

<Note>
`protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น เนื่องจาก `traces` และ `metrics` เปิดใช้งานโดยค่าเริ่มต้น ค่าอื่นใด (รวมถึง `grpc`) จะยกเลิกการสมัครรับ diagnostics-otel ทั้งหมดพร้อมคำเตือน `unsupported protocol` ซึ่งจะหยุดการส่งออกบันทึก stdout ด้วย ตั้งค่า `traces: false` และ `metrics: false` อย่างชัดเจน หากต้องการเฉพาะ `logsExporter: "stdout"` ที่มีค่าโปรโตคอลซึ่งไม่ใช่ OTLP
</Note>

## สัญญาณที่ส่งออก

| สัญญาณ      | เนื้อหาที่รวมอยู่                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **เมตริก** | ตัวนับ/ฮิสโตแกรมสำหรับการใช้โทเค็น ค่าใช้จ่าย ระยะเวลาการเรียกใช้ การสลับไปใช้ระบบสำรอง การใช้ Skills โฟลว์ข้อความ เหตุการณ์ Talk เลนคิว สถานะ/การกู้คืนเซสชัน การเรียกใช้เครื่องมือ การเรียกใช้คำสั่ง หน่วยความจำ ความพร้อมทำงาน และสถานะตัวส่งออก |
| **เทรซ**  | สแปนสำหรับการใช้โมเดล การเรียกโมเดล วงจรชีวิตของฮาร์เนส การใช้ Skills การเรียกใช้เครื่องมือ การเรียกใช้คำสั่ง การประมวลผล Webhook/ข้อความ การประกอบบริบท และลูปเครื่องมือ                                                      |
| **บันทึก**    | ระเบียน `logging.file` ที่มีโครงสร้าง ซึ่งส่งออกผ่าน OTLP หรือ stdout JSONL เมื่อเปิดใช้งาน `diagnostics.otel.logs`; เนื้อหาหลักของบันทึกจะถูกระงับ เว้นแต่จะเปิดใช้งานการบันทึกเนื้อหาไว้อย่างชัดเจน                          |

สลับ `traces`, `metrics` และ `logs` แยกกันได้ เทรซและเมตริก
จะเปิดตามค่าเริ่มต้นเมื่อ `diagnostics.otel.enabled` เป็น true ส่วนบันทึกจะปิดตามค่าเริ่มต้น
และส่งออกเฉพาะเมื่อ `diagnostics.otel.logs` เป็น `true` อย่างชัดเจน การส่งออกบันทึก
ใช้ OTLP โดยค่าเริ่มต้น ตั้งค่า `diagnostics.otel.logsExporter` เป็น `stdout` สำหรับ JSONL บน
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
      serviceName: "openclaw-gateway", // หากไม่ได้ตั้งค่า จะใช้ OTEL_SERVICE_NAME แล้วจึงใช้ "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | ทั้งสอง
      sampleRate: 0.2, // ตัวสุ่มตัวอย่างสแปนราก 0.0..1.0
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | ค่าสำรองสำหรับ `diagnostics.otel.endpoint` เมื่อไม่ได้ตั้งค่าคีย์การกำหนดค่า                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | ค่าสำรองปลายทางเฉพาะสัญญาณ ซึ่งใช้เมื่อไม่ได้ตั้งค่าคีย์การกำหนดค่า `diagnostics.otel.*Endpoint` ที่ตรงกัน การกำหนดค่าเฉพาะสัญญาณมีลำดับความสำคัญเหนือสภาพแวดล้อมเฉพาะสัญญาณ และสภาพแวดล้อมเฉพาะสัญญาณมีลำดับความสำคัญเหนือปลายทางที่ใช้ร่วมกัน                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | ค่าสำรองสำหรับ `diagnostics.otel.serviceName` เมื่อไม่ได้ตั้งค่าคีย์การกำหนดค่า ชื่อบริการเริ่มต้นคือ `openclaw`                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | ค่าสำรองสำหรับโปรโตคอลบนสายเมื่อไม่ได้ตั้งค่า `diagnostics.otel.protocol` มีเพียง `http/protobuf` เท่านั้นที่เปิดใช้งานการส่งออก                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | ตั้งค่าเป็น `gen_ai_latest_experimental` เพื่อปล่อยรูปแบบสแปนการอนุมาน GenAI ล่าสุด ได้แก่ ชื่อสแปน `{gen_ai.operation.name} {gen_ai.request.model}`, ชนิดสแปน `CLIENT` และ `gen_ai.provider.name` แทน `gen_ai.system` แบบเดิม เมตริก GenAI จะใช้แอตทริบิวต์ที่มีขอบเขตและคาร์ดินาลิตีต่ำเสมอไม่ว่าจะตั้งค่าอย่างไร |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | ตั้งค่าเป็น `1` เมื่อพรีโหลดหรือกระบวนการโฮสต์อื่นได้ลงทะเบียน OpenTelemetry SDK ส่วนกลางแล้ว จากนั้น plugin จะข้ามวงจรชีวิต NodeSDK ของตนเอง แต่ยังคงเชื่อมโยงตัวฟังการวินิจฉัยและเคารพ `traces`/`metrics`/`logs`                                                                                    |

## ความเป็นส่วนตัวและการบันทึกเนื้อหา

โดยค่าเริ่มต้นจะ**ไม่**ส่งออกเนื้อหาดิบของโมเดล/เครื่องมือ สแปนจะมีตัวระบุ
ที่มีขอบเขต (ช่องทาง ผู้ให้บริการ โมเดล หมวดหมู่ข้อผิดพลาด รหัสคำขอที่เป็นแฮชเท่านั้น
แหล่งที่มาของเครื่องมือ เจ้าของเครื่องมือ ชื่อ/แหล่งที่มาของ Skills) และจะไม่รวมข้อความพรอมต์
ข้อความตอบกลับ อินพุตเครื่องมือ เอาต์พุตเครื่องมือ พาธไฟล์ Skills หรือคีย์เซสชัน
ค่าที่มีลักษณะเหมือนคีย์เซสชันของเอเจนต์ที่มีขอบเขต (เช่น ขึ้นต้นด้วย
`agent:`) จะถูกแทนที่ด้วย `unknown` ในแอตทริบิวต์คาร์ดินาลิตีต่ำ ระเบียนบันทึก
OTLP จะเก็บระดับความรุนแรง ตัวบันทึก ตำแหน่งโค้ด บริบทเทรซที่เชื่อถือได้ และ
แอตทริบิวต์ที่ผ่านการทำให้ปลอดภัยไว้โดยค่าเริ่มต้น ส่วนเนื้อหาหลักของข้อความบันทึกดิบจะส่งออกเฉพาะ
เมื่อ `diagnostics.otel.captureContent` เป็นค่าบูลีน `true` คีย์ย่อยแบบละเอียด
`captureContent.*` จะไม่เปิดใช้งานเนื้อหาหลักของบันทึก เมตริก Talk จะส่งออกเฉพาะ
เมทาดาทาเหตุการณ์ที่มีขอบเขต (โหมด การรับส่งข้อมูล ผู้ให้บริการ ประเภทเหตุการณ์) โดยไม่มี
บทถอดเสียง เพย์โหลดเสียง รหัสเซสชัน รหัสเทิร์น รหัสการโทร รหัสห้อง หรือ
โทเค็นส่งต่อ

คำขอโมเดลขาออกอาจรวมส่วนหัว W3C `traceparent` ที่สร้างขึ้นเฉพาะ
จากบริบทเทรซการวินิจฉัยที่ OpenClaw เป็นเจ้าของสำหรับการเรียกโมเดลที่กำลังทำงาน
ส่วนหัว `traceparent` ที่ผู้เรียกส่งมาอยู่แล้วจะถูกแทนที่ ดังนั้น plugin หรือ
ตัวเลือกผู้ให้บริการที่กำหนดเองจึงไม่สามารถปลอมแปลงลำดับบรรพบุรุษของเทรซข้ามบริการได้

ตั้งค่า `diagnostics.otel.captureContent.*` เป็น `true` เฉพาะเมื่อตัวรวบรวม
และนโยบายการเก็บรักษาของคุณได้รับอนุมัติสำหรับข้อความพรอมต์ การตอบกลับ เครื่องมือ หรือ
พรอมต์ระบบแล้ว คีย์ย่อยแต่ละรายการทำงานแยกกัน:

- `inputMessages` - เนื้อหาพรอมต์ของผู้ใช้
- `outputMessages` - เนื้อหาการตอบกลับของโมเดล
- `toolInputs` - เพย์โหลดอาร์กิวเมนต์ของเครื่องมือ
- `toolOutputs` - เพย์โหลดผลลัพธ์ของเครื่องมือ
- `systemPrompt` - พรอมต์ระบบ/นักพัฒนาที่ประกอบแล้ว
- `toolDefinitions` - ชื่อ คำอธิบาย และสคีมาของเครื่องมือโมเดล

เมื่อเปิดใช้งานคีย์ย่อยใดก็ตาม สแปนของโมเดลและเครื่องมือจะได้รับแอตทริบิวต์
`openclaw.content.*` ที่มีขอบเขตและผ่านการปกปิดข้อมูลเฉพาะสำหรับคลาสนั้น

<Note>
ค่าบูลีน `captureContent: true` จะเปิดใช้งาน `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` และเนื้อหาหลักของบันทึก OTLP พร้อมกัน แต่**ไม่**เปิดใช้งาน `systemPrompt` ให้ตั้งค่า `captureContent.systemPrompt: true` อย่างชัดเจนหากต้องการพรอมต์ระบบที่ประกอบแล้วด้วย
</Note>

เนื้อหา `toolInputs`/`toolOutputs` จะถูกบันทึกสำหรับการเรียกใช้เครื่องมือ
ของรันไทม์เอเจนต์ในตัว (`openclaw.content.tool_input` และ
`gen_ai.tool.call.arguments` บนสแปนที่เสร็จสมบูรณ์/เกิดข้อผิดพลาด;
`openclaw.content.tool_output` และ `gen_ai.tool.call.result` บนสแปนที่เสร็จสมบูรณ์)
ชื่อ `openclaw.content.*` ยังคงเป็นชื่อแอตทริบิวต์ OpenClaw ที่เสถียร
ส่วนสำเนา `gen_ai.tool.call.*` จะทำสำเนาชื่อเหล่านั้นสำหรับโปรแกรมดูที่ใช้ semconv โดยตรง
การเรียกเครื่องมือของฮาร์เนสภายนอก (Codex, Claude CLI) จะปล่อย
สแปน `tool.execution.*` โดยไม่มีเพย์โหลดเนื้อหา เนื้อหาที่บันทึกจะเดินทางผ่าน
ช่องทางที่เชื่อถือได้และรับฟังได้เท่านั้น และจะไม่ถูกวางบนบัสเหตุการณ์วินิจฉัยสาธารณะ
โดยเด็ดขาด

## การสุ่มตัวอย่างและการล้างข้อมูล

- **เทรซ:** `diagnostics.otel.sampleRate` กำหนด `TraceIdRatioBasedSampler`
  เฉพาะบนสแปนรากเท่านั้น (`0.0` ละทิ้งทั้งหมด, `1.0` เก็บทั้งหมด) หากไม่กำหนด จะใช้ค่าเริ่มต้นของ
  OpenTelemetry SDK (เปิดตลอดเวลา)
- **เมตริก:** `diagnostics.otel.flushIntervalMs` (จำกัดค่าต่ำสุดไว้ที่
  `1000`); หากไม่กำหนด จะใช้ค่าเริ่มต้นสำหรับการส่งออกเป็นระยะของ SDK
- **บันทึก:** บันทึก OTLP ใช้ `logging.level` (ระดับบันทึกของไฟล์) และใช้เส้นทางการปกปิดข้อมูลระเบียนบันทึก
  สำหรับการวินิจฉัย ไม่ใช่การจัดรูปแบบคอนโซล การติดตั้งที่มีปริมาณข้อมูลสูง
  ควรเลือกใช้การสุ่มตัวอย่าง/การกรองของตัวรวบรวม OTLP แทนการ
  สุ่มตัวอย่างภายในเครื่อง ตั้งค่า `diagnostics.otel.logsExporter: "stdout"` เมื่อแพลตฟอร์มของคุณ
  ส่ง stdout/stderr ไปยังตัวประมวลผลบันทึกอยู่แล้ว และคุณไม่มีตัวรวบรวม
  บันทึก OTLP ระเบียน stdout เป็นออบเจ็กต์ JSON หนึ่งรายการต่อบรรทัด โดยมี `ts`, `signal`,
  `service.name`, ระดับความรุนแรง, เนื้อหา, แอตทริบิวต์ที่ปกปิดข้อมูลแล้ว และฟิลด์เทรซ
  ที่เชื่อถือได้เมื่อมี
- **การเชื่อมโยงบันทึกไฟล์:** บันทึกไฟล์ JSONL มี `traceId`,
  `spanId`, `parentSpanId` และ `traceFlags` ที่ระดับบนสุด เมื่อการเรียกบันทึกมีบริบทเทรซ
  สำหรับการวินิจฉัยที่ถูกต้อง ทำให้ตัวประมวลผลบันทึกเชื่อมบรรทัดบันทึกภายในเครื่องกับ
  สแปนที่ส่งออกได้
- **การเชื่อมโยงคำขอ:** คำขอ HTTP และเฟรม WebSocket ของ Gateway จะสร้าง
  ขอบเขตเทรซคำขอภายใน บันทึกและเหตุการณ์วินิจฉัยภายใน
  ขอบเขตนั้นจะสืบทอดเทรซคำขอตามค่าเริ่มต้น ส่วนสแปนการเรียกใช้เอเจนต์และการเรียกโมเดล
  จะถูกสร้างเป็นสแปนลูก เพื่อให้ส่วนหัว `traceparent` ของผู้ให้บริการอยู่ใน
  เทรซเดียวกัน
- **การเชื่อมโยงการเรียกโมเดล:** สแปน `openclaw.model.call` มีขนาดคอมโพเนนต์
  พรอมต์ที่ปลอดภัยตามค่าเริ่มต้น และแอตทริบิวต์โทเค็นต่อการเรียกเมื่อผลลัพธ์จากผู้ให้บริการ
  เปิดเผยข้อมูลการใช้งาน `openclaw.model.usage` ยังคงเป็นสแปนการคำนวณบัญชี
  ระดับการเรียกใช้สำหรับแดชบอร์ดต้นทุนรวม บริบท และช่องทาง และ
  ยังคงอยู่ในเทรซการวินิจฉัยเดียวกันเมื่อรันไทม์ที่ปล่อยข้อมูลมีบริบทเทรซ
  ที่เชื่อถือได้

### หน่วยการสังเกตการเรียกโมเดล

ทุกสแปน `openclaw.model.call` ระบุว่าวงจรชีวิตของสแปนวัดสิ่งใดผ่าน
`openclaw.model_call.observation_unit`:

- `request` - คำขอโมเดล/ผู้ให้บริการที่สังเกตได้หนึ่งรายการ การเรียกโมเดลแบบฝังตัวเนทีฟ
  ใช้หน่วยนี้ และตัวส่งออกจะถือว่าค่าที่ขาดหายเป็น `request` เพื่อ
  ให้เข้ากันได้กับตัวปล่อยข้อมูลรุ่นเก่าหรือจากภายนอก
- `turn` - หนึ่งรอบการทำงานของ CLI เอเจนต์แบบทึบ ซึ่งอาจมีคำขอโมเดลที่ซ่อนอยู่
  การลองใหม่ งานเครื่องมือ หรืองานเบื้องหลัง การเรียก Claude Code CLI และ Codex app-server
  ใช้หน่วยนี้

ทั้งสองหน่วยยังคงเป็นสแปนการเรียกโมเดล เพื่อให้แบ็กเอนด์เทรซแสดงอินพุต
เอาต์พุต การใช้งาน และลำดับชั้นของโมเดลได้ สแปนคำขอใช้การดำเนินการ GenAI ที่ได้จาก API
(`chat`, `generate_content` หรือ `text_completion`) ส่วนสแปนรอบการทำงานใช้
`gen_ai.operation.name = invoke_agent` ทั้งสองมีส่วนร่วมใน
`gen_ai.client.operation.duration` โดยชื่อการดำเนินการจะแยกเวลาแฝงของ
คำขอโดยตรงออกจากเวลาแฝงของทั้งรอบการทำงาน เมตริกการเรียกโมเดล OTEL ของ OpenClaw
ยังมี `openclaw.model_call.observation_unit`; เมตริกการเรียกโมเดลของ Prometheus
เปิดเผยป้ายกำกับ `observation_unit` ที่เทียบเท่ากัน

### ความเที่ยงตรงของการเรียกโมเดล Claude Code CLI

รอบการทำงานของ Claude Code CLI ปล่อยสแปน `openclaw.model.call` สังเคราะห์
ระดับรอบการทำงานหนึ่งสแปน สแปนเหล่านี้ไม่ใช่สแปนคำขอ HTTP ของ Anthropic โดยใช้ `openclaw.api =
claude-code`, `openclaw.model_call.observation_unit = turn` และระบุ
การดำเนินการเป็น `gen_ai.operation.name = invoke_agent` พร้อมระบุ
ขอบเขต CLI ของ OpenClaw ผ่าน
`openclaw.transport`:

- `stdio` - กระบวนการ Claude Code ภายในเครื่องแบบครั้งเดียว
- `stdio-live` - หนึ่งรอบการทำงานในเซสชัน Claude stdio แบบถาวรที่มีการจัดการ
- `paired-node-cli` - การเรียกใช้ Claude Code แบบครั้งเดียวที่มอบหมายให้ Node
  ที่จับคู่ไว้

ระบบวินิจฉัย Claude CLI จะถูกสร้างขึ้นเฉพาะขณะที่ตัวกระจายเหตุการณ์วินิจฉัย
ของกระบวนการเปิดใช้งานอยู่ และมีตัวรับฟังเหตุการณ์ภายในหรือที่เชื่อถือได้แนบอยู่
หากไม่มี Plugin สำหรับความสามารถในการสังเกตหรือไม่มีตัวรับฟังอื่นทำงานอยู่ รอบการทำงานของ Claude CLI จะข้าม
ลำดับชั้นเทรซสังเคราะห์ บัฟเฟอร์เนื้อหา และการคำนวณจำนวนไบต์ของสตรีม
การวินิจฉัย เมื่อเปิดใช้การบันทึกเนื้อหา ฟิลด์พรอมต์และพรอมต์ระบบ
จะถูกจำกัดไว้ที่ฟิลด์ละ 128 KiB; เอาต์พุตผู้ช่วยถูกจำกัดไว้ที่ 128 KiB จาก
เอนเวโลปไม่เกิน 200 รายการ โดยสงวน 16 KiB และหนึ่งรายการไว้สำหรับการตอบกลับสำรอง
สุดท้ายที่มองเห็นได้ เครื่องหมายจะบันทึกการตัดทอนเมื่อถึงขีดจำกัด

OpenClaw กำหนดลำดับชั้นความเป็นเจ้าของให้รอบการทำงานของ Claude CLI แบบเดียวกับที่ใช้โดย
รันไทม์เอเจนต์อื่น: `openclaw.harness.run` (`openclaw.harness.id = claude-cli`)
มี `openclaw.run` ซึ่งมีสแปน `openclaw.model.call` ของ Claude
แฮร์เนสและสแปนการเรียกใช้เป็นขอบเขตรอบการทำงานสังเคราะห์ของ OpenClaw ไม่ใช่
เฟสภายในของ Claude Code รอบการทำงานแบบครั้งเดียวและแบบ stdio ที่มีการจัดการใช้
ลำดับชั้นเดียวกัน; การลองใหม่ด้วยเซสชันใหม่จริงจะสร้างสแปนลูกการเรียกโมเดลอีกหนึ่งสแปนภายใน
การเรียกใช้ OpenClaw เดิม

สแปนเริ่มเมื่อ OpenClaw รับรอบการทำงาน CLI ที่เตรียมไว้ และสิ้นสุดหลังจาก
รอบการทำงานนั้นสำเร็จหรือล้มเหลวเท่านั้น สำหรับเซสชันที่มีการจัดการ ผลลัพธ์สำเร็จชั่วคราว
จะไม่สิ้นสุดสแปนขณะที่ Claude รายงานเอเจนต์เบื้องหลังหรือ
เวิร์กโฟลว์ที่ยังคงเก็บผลลัพธ์ไว้; ผลลัพธ์สุดท้ายหลังระบายงานจึงจะสิ้นสุดสแปน การยกเลิก การหมดเวลา ความล้มเหลวของกระบวนการ
ความล้มเหลวของเอาต์พุต/การแยกวิเคราะห์ และความล้มเหลวอื่นของรอบการทำงาน จะสิ้นสุดสแปนเดียวกันด้วยข้อผิดพลาด

Claude Code รายงานการใช้งานต่อข้อความผู้ช่วย และอาจรายงานการใช้งาน
สะสมในผลลัพธ์ปลายทางด้วย การคำนวณบัญชีการตอบกลับของ OpenClaw ยังคงใช้
ข้อความผู้ช่วยล่าสุด เพื่อไม่ให้ความหมายด้านต้นทุนเดิมเปลี่ยนแปลง;
สแปนการเรียกโมเดลระดับรอบการทำงานใช้การใช้งานสะสมจากผลลัพธ์ปลายทางเมื่อมี
รวมถึงโทเค็นการอ่านแคชและการสร้างแคช

สำหรับสแปน CLI เหล่านี้ ฟิลด์ไบต์และเวลาจะอธิบายขอบเขต CLI ของ OpenClaw
ที่สังเกตได้:

- `openclaw.model_call.request_bytes` คือขนาด UTF-8 ของค่าพรอมต์
  ที่ส่งผ่าน stdin/argv แบบครั้งเดียว หรือเอนเวโลปผู้ใช้ JSONL ของ stdio ที่มีการจัดการ ซึ่ง
  ไม่ใช่ขนาดของคำขอโมเดลที่ซ่อนอยู่ของ Claude Code
- `openclaw.model_call.response_bytes` คือขนาด UTF-8 ของ stdout จาก Claude CLI
  ที่สังเกตได้ระหว่างรอบการทำงาน ซึ่งไม่ใช่ขนาดการตอบกลับ HTTP ของ Anthropic
- `openclaw.model_call.time_to_first_byte_ms` คือระยะเวลาจนถึงเอาต์พุต stdout หรือ stderr
  แรกจาก Claude CLI ที่สังเกตได้ ซึ่งไม่ใช่ TTFB ของเครือข่าย

เมื่อเปิดใช้ฟิลด์ `captureContent` แบบละเอียดที่ตรงกัน สแปนจะส่งออก
พรอมต์จริงที่ OpenClaw ส่งให้ Claude Code, พรอมต์ระบบที่ OpenClaw ต่อท้าย และข้อความ/การให้เหตุผล/ข้อมูลระบุตัวตนการเรียกเครื่องมือ
ของผู้ช่วยที่มองเห็นได้ ผ่าน
`gen_ai.input.messages`, `gen_ai.output.messages` และ
`gen_ai.system_instructions` อาร์กิวเมนต์เครื่องมือ ลายเซ็นการคิดแบบทึบ และ
ผลลัพธ์เครื่องมือจะถูกละเว้นจากเอนเวโลปผู้ช่วย Claude OpenClaw ไม่
อ้างว่าสามารถเข้าถึงพรอมต์ระบบส่วนตัวของ Claude Code, เพย์โหลดคำขอที่ซ่อนอยู่ซึ่งกลับมาทำต่อหรือ
ผ่าน Compaction แล้ว, สคีมาเครื่องมือภายในแบบเนทีฟ, คำขอ HTTP ดิบของ Anthropic,
การลองใหม่ภายใน, รหัสคำขอจากต้นทาง หรือ TTFB เครือข่ายจริง เนื่องจาก
Claude Code ไม่เปิดเผยข้อกำหนดเครื่องมือเนทีฟที่มีผลจริงอย่างแม่นยำ
สแปนเหล่านี้จึงไม่เติมข้อมูลใน `gen_ai.tool.definitions`

สแปนเครื่องมือของแฮร์เนส Claude ภายนอกยังคงมีเฉพาะเมทาดาทา แม้เปิดใช้
การบันทึกเนื้อหาเครื่องมือ เช่นเดียวกับทุกสแปนโมเดล เนื้อหา Claude CLI ที่บันทึกไว้ใช้
เส้นทางเฉพาะตัวรับฟังที่เชื่อถือได้ ตลอดจนการปกปิดข้อมูลและขีดจำกัดขนาด
ที่มีอยู่ของตัวส่งออก; เนื้อหายังคงปิดอยู่ตามค่าเริ่มต้น

## เมตริกที่ส่งออก

### การใช้งานโมเดล

- `openclaw.tokens` (ตัวนับ, แอตทริบิวต์: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (ตัวนับ, แอตทริบิวต์: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (ฮิสโตแกรม, เมตริกตามข้อตกลงเชิงความหมาย GenAI, แอตทริบิวต์: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (ฮิสโตแกรม, วินาที, เมตริกตามข้อตกลงเชิงความหมาย GenAI สำหรับคำขอโมเดลและรอบการทำงานเอเจนต์สังเคราะห์; แอตทริบิวต์: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` ที่ไม่บังคับ; การสังเกตรอบการทำงานใช้ `gen_ai.operation.name = invoke_agent`)
- `openclaw.model_call.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit` รวมถึง `openclaw.errorCategory` และ `openclaw.failureKind` สำหรับข้อผิดพลาดที่จำแนกแล้ว)
- `openclaw.model_call.request_bytes` (ฮิสโตแกรม, ขนาดไบต์ UTF-8 ของเพย์โหลดคำขอโมเดลสุดท้าย; สำหรับ Claude Code CLI คืออินพุตพรอมต์/เอนเวโลปที่สังเกตได้ตามที่อธิบายไว้ข้างต้น; ไม่มีเนื้อหาเพย์โหลดดิบ)
- `openclaw.model_call.response_bytes` (ฮิสโตแกรม, ขนาดไบต์ UTF-8 ของเพย์โหลดส่วนย่อยการตอบกลับแบบสตรีม; เดลตาข้อความ การคิด และการเรียกเครื่องมือที่มีความถี่สูงจะนับเฉพาะไบต์ `delta` ส่วนเพิ่ม; สำหรับ Claude Code CLI คือไบต์ stdout ที่สังเกตได้; ไม่มีเนื้อหาการตอบกลับดิบ)
- `openclaw.model_call.time_to_first_byte_ms` (ฮิสโตแกรม, เวลาที่ผ่านไปก่อนเหตุการณ์การตอบกลับแบบสตรีมครั้งแรก; สำหรับ Claude Code CLI คือเอาต์พุต CLI แรกที่สังเกตได้แทน TTFB ของเครือข่าย)
- `openclaw.model.failover` (ตัวนับ, แอตทริบิวต์: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (ตัวนับ, แอตทริบิวต์: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` ที่ไม่บังคับ, `openclaw.toolName` ที่ไม่บังคับ)

### การไหลของข้อความ

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
- `openclaw.talk.audio.bytes` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับ `openclaw.talk.event`; ปล่อยสำหรับเหตุการณ์เฟรมเสียงของการสนทนาที่รายงานความยาวเป็นไบต์)

### คิวและเซสชัน

- `openclaw.queue.lane.enqueue` (ตัวนับ, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (ตัวนับ, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.queue.depth` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.lane` หรือ `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.lane`)
- `openclaw.session.state` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (ตัวนับ, แอตทริบิวต์: `openclaw.state`; ปล่อยออกมาสำหรับการเก็บบัญชีเซสชันที่ล้าสมัยซึ่งกู้คืนได้)
- `openclaw.session.stuck_age_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.state`; ปล่อยออกมาสำหรับการเก็บบัญชีเซสชันที่ล้าสมัยซึ่งกู้คืนได้)
- `openclaw.session.turn.created` (ตัวนับ, แอตทริบิวต์: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (ตัวนับ, แอตทริบิวต์: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับตัวนับการกู้คืนที่ตรงกัน)
- `openclaw.run.attempt` (ตัวนับ, แอตทริบิวต์: `openclaw.attempt`)

### เทเลเมทรีความพร้อมใช้งานของเซสชัน

เซสชัน `processing` จะไม่สะสมอายุไปสู่เกณฑ์ความพร้อมใช้งานในตัว ขณะที่ OpenClaw สังเกตเห็นความคืบหน้าของการตอบกลับ เครื่องมือ สถานะ บล็อก หรือรันไทม์ ACP การส่งสัญญาณรักษาสถานะขณะพิมพ์ไม่นับเป็นความคืบหน้า จึงยังตรวจพบโมเดลหรือฮาร์เนสที่เงียบได้

OpenClaw จำแนกเซสชันตามงานที่ยังสังเกตเห็นได้:

- `session.long_running`: งานแบบฝังที่ทำงานอยู่ การเรียกโมเดล หรือการเรียกเครื่องมือ
  ยังคงมีความคืบหน้า การเรียกโมเดลแบบเงียบที่มีเจ้าของยังถูกรายงานว่าใช้เวลานานก่อนถึงเกณฑ์ยกเลิกในตัว เพื่อให้ผู้ให้บริการโมเดลที่ช้าหรือไม่สตรีมไม่ดูเหมือนเซสชัน Gateway ที่หยุดค้าง ขณะที่ยังสังเกตการยกเลิกได้
- `session.stalled`: มีงานที่ทำงานอยู่ แต่การทำงานที่ใช้งานอยู่ไม่ได้รายงาน
  ความคืบหน้าล่าสุด การเรียกโมเดลที่มีเจ้าของจะเปลี่ยนจาก `session.long_running` เป็น
  `session.stalled` เมื่อถึงหรือหลังเกณฑ์ยกเลิกในตัว กิจกรรม
  ของโมเดล/เครื่องมือที่ล้าสมัยและไม่มีเจ้าของจะไม่ถือเป็นงานที่ใช้เวลานานโดยไม่เป็นอันตราย
  การทำงานแบบฝังที่หยุดค้างจะอยู่ในสถานะสังเกตการณ์อย่างเดียวในตอนแรก จากนั้นจึงยกเลิกและระบายงานหลังจาก
  ถึงเกณฑ์ยกเลิกโดยไม่มีความคืบหน้า เพื่อให้เทิร์นที่รอคิวอยู่ด้านหลังเลนกลับมาทำงานต่อได้
- `session.stuck`: การเก็บบัญชีเซสชันที่ล้าสมัยโดยไม่มีงานที่ทำงานอยู่ หรือเซสชัน
  ที่เข้าคิวและไม่ได้ใช้งานซึ่งมีกิจกรรมโมเดล/เครื่องมือที่ล้าสมัยและไม่มีเจ้าของ การดำเนินการนี้จะปล่อย
  เลนเซสชันที่ได้รับผลกระทบทันทีหลังผ่านเกตการกู้คืน

การกู้คืนจะปล่อยเหตุการณ์ `session.recovery.requested` และ
`session.recovery.completed` ที่มีโครงสร้าง สถานะเซสชันสำหรับการวินิจฉัยจะถูกทำเครื่องหมายว่าไม่ได้ใช้งาน
เฉพาะหลังผลลัพธ์การกู้คืนที่เปลี่ยนแปลงสถานะ (`aborted` หรือ `released`) และเฉพาะเมื่อ
รุ่นการประมวลผลเดียวกันยังคงเป็นรุ่นปัจจุบัน

เฉพาะ `session.stuck` เท่านั้นที่ปล่อยตัวนับ `openclaw.session.stuck`,
ฮิสโตแกรม `openclaw.session.stuck_age_ms` และ
สแปน `openclaw.session.stuck` การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะเพิ่มช่วงหน่วงขณะที่เซสชันยังคง
ไม่เปลี่ยนแปลง ดังนั้นแดชบอร์ดควรแจ้งเตือนเมื่อมีการเพิ่มขึ้นอย่างต่อเนื่อง แทนที่จะเป็น
ทุกจังหวะ Heartbeat สำหรับตัวเลือกการกำหนดค่าและค่าเริ่มต้น โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics)

คำเตือนความพร้อมใช้งานยังปล่อย:

- `openclaw.liveness.warning` (ตัวนับ, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.liveness.reason`)

### วงจรชีวิตของฮาร์เนส

- `openclaw.harness.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` เมื่อเกิดข้อผิดพลาด)

### การดำเนินการเครื่องมือและการตรวจจับลูป

- `openclaw.tool.execution.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind` และ `openclaw.errorCategory` เมื่อเกิดข้อผิดพลาด)
- `openclaw.tool.execution.blocked` (ตัวนับ, แอตทริบิวต์: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (ตัวนับ, แอตทริบิวต์: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` ซึ่งเป็นตัวเลือก; ปล่อยออกมาเมื่อตรวจพบลูปการเรียกเครื่องมือซ้ำ)

### Exec

- `openclaw.exec.duration_ms` (ฮิสโตแกรม, แอตทริบิวต์: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### ส่วนภายในของการวินิจฉัย (หน่วยความจำ เพย์โหลด สถานะของตัวส่งออก)

- `openclaw.payload.large` (ตัวนับ, แอตทริบิวต์: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (ฮิสโตแกรม, แอตทริบิวต์: เหมือนกับ `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (ฮิสโตแกรม, ไม่มีแอตทริบิวต์; ตัวอย่างหน่วยความจำของกระบวนการ)
- `openclaw.memory.pressure` (ตัวนับ, แอตทริบิวต์: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (ตัวนับ, แอตทริบิวต์: `openclaw.diagnostic.async_queue.drop_class`; การทิ้งข้อมูลเนื่องจากแรงดันย้อนกลับของคิววินิจฉัยภายใน)
- `openclaw.telemetry.exporter.events` (ตัวนับ, แอตทริบิวต์: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` ซึ่งเป็นตัวเลือก, `openclaw.errorCategory` ซึ่งเป็นตัวเลือก; เทเลเมทรีตนเองของวงจรชีวิต/ความล้มเหลวของตัวส่งออก)

## สแปนที่ส่งออก

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (อินพุต/เอาต์พุต/การอ่านแคช/การเขียนแคช/รวม)
  - `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อกำหนดเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` โดยค่าเริ่มต้น หรือ `gen_ai.provider.name` เมื่อเลือกใช้ข้อกำหนดเชิงความหมาย GenAI ล่าสุด
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit` (`request` หรือ `turn`)
  - `openclaw.errorCategory`, `error.type` และ `openclaw.failureKind` ซึ่งเป็นตัวเลือกเมื่อเกิดข้อผิดพลาด
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (เฉพาะขนาดคอมโพเนนต์ที่ปลอดภัย ไม่มีข้อความพรอมต์)
  - `openclaw.model_call.usage.*` และ `gen_ai.usage.*` เมื่อผลลัพธ์มีข้อมูลการใช้งานสำหรับคำขอนั้นหรือเทิร์นแบบรวม
  - เหตุการณ์สแปน `openclaw.provider.request` พร้อมแอตทริบิวต์ `openclaw.upstreamRequestIdHash` (มีขอบเขตจำกัดและอิงแฮช) เมื่อผลลัพธ์จากผู้ให้บริการต้นทางเปิดเผยรหัสคำขอ โดยจะไม่มีการส่งออกรหัสดิบ
  - เมื่อใช้ `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` สแปนคำขอจะใช้ชื่อสแปนการอนุมาน GenAI ล่าสุด `{gen_ai.operation.name} {gen_ai.request.model}` สแปนเทิร์นใช้ `invoke_agent` เนื่องจาก OpenClaw ไม่อ้างชื่อเอเจนต์ดั้งเดิมจากขอบเขต CLI ที่ไม่โปร่งใส ทั้งสองใช้ชนิดสแปน `CLIENT` แทน `openclaw.model.call`
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
รวมแอตทริบิวต์ `openclaw.content.*` ที่มีขอบเขตจำกัดและปกปิดข้อมูล สำหรับคลาส
เนื้อหาเฉพาะที่เลือกใช้

## แค็ตตาล็อกเหตุการณ์วินิจฉัย

เหตุการณ์ด้านล่างรองรับเมตริกและสแปนด้านบน หรือพร้อมใช้งานสำหรับการสมัครรับข้อมูลโดยตรง
ของ Plugin `run.progress` และ `run.execution_phase` เป็นสัญญาณวงจรชีวิต
สำหรับการใช้งานโดยตรงเท่านั้น โดย Plugin diagnostics-otel จะไม่ส่งออกเป็น
สัญญาณ OTLP แบบแยกเดี่ยว ชนิดเหตุการณ์และค่า `run.execution_phase.phase` สามารถ
เพิ่มเติมได้ ผู้ใช้ TypeScript ควรคงสาขาเริ่มต้นไว้ แทนที่จะถือว่า
ยูเนียนใดยูเนียนหนึ่งจะครอบคลุมทั้งหมดอย่างถาวร

**การใช้งานโมเดล**

- `model.usage` - โทเค็น ค่าใช้จ่าย ระยะเวลา บริบท ผู้ให้บริการ/โมเดล/ช่องทาง
  และรหัสเซสชัน `usage` คือการลงบัญชีระดับผู้ให้บริการ/เทิร์นสำหรับค่าใช้จ่ายและเทเลเมทรี
  ส่วน `context.used` คือสแนปช็อตพรอมต์/บริบทปัจจุบัน และอาจต่ำกว่า
  `usage.total` ของผู้ให้บริการ เมื่อมีอินพุตที่แคชไว้หรือการเรียกในลูปเครื่องมือ

**โฟลว์ข้อความ**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**คิวและเซสชัน**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `run.execution_phase` (ไมล์สโตนการเริ่มต้นตัวรันแบบฝังที่เป็นสาธารณะและเชื่อมโยงกับเซสชัน)
- `diagnostic.heartbeat` (ตัวนับแบบรวม: Webhook/คิว/เซสชัน)

**วงจรชีวิตของฮาร์เนส**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  วงจรชีวิตต่อการทำงานสำหรับฮาร์เนสของเอเจนต์ รวม `harnessId`, `pluginId`
  ซึ่งเป็นตัวเลือก, ผู้ให้บริการ/โมเดล/ช่องทาง และรหัสการทำงาน เมื่อเสร็จสมบูรณ์จะเพิ่ม
  `durationMs`, `outcome`, `resultClassification` ซึ่งเป็นตัวเลือก, `yieldDetected`
  และจำนวน `itemLifecycle` ข้อผิดพลาดจะเพิ่ม `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` และ
  `cleanupFailed` ซึ่งเป็นตัวเลือก

**Exec**

- `exec.process.completed` - ผลลัพธ์ของเทอร์มินัล ระยะเวลา เป้าหมาย โหมด รหัส
  การออก และประเภทความล้มเหลว ไม่รวมข้อความคำสั่งและไดเรกทอรี
  ทำงาน
- `exec.approval.followup_suppressed` - ละทิ้งการติดตามผลการอนุมัติที่ล้าสมัย
  หลังจากเซสชันเชื่อมโยงใหม่ รวม `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` หรือ `gateway_preflight`)
  และการประทับเวลาของตัวกระจายงาน ไม่รวมคีย์เซสชัน เส้นทาง และข้อความคำสั่ง

## เมื่อไม่มีตัวส่งออก

ทำให้อีเวนต์การวินิจฉัยพร้อมใช้งานสำหรับ Plugin หรือปลายทางแบบกำหนดเองโดยไม่ต้องเรียกใช้
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับเอาต์พุตการดีบักแบบเจาะจงโดยไม่เพิ่ม `logging.level` ให้ใช้แฟล็ก
การวินิจฉัย แฟล็กไม่คำนึงถึงตัวพิมพ์เล็ก-ใหญ่และรองรับไวลด์การ์ด (`telegram.*` หรือ
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

หรือใช้การเขียนทับด้วยตัวแปรสภาพแวดล้อมแบบครั้งเดียว:

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

- [การบันทึก](/th/logging) - บันทึกในไฟล์ เอาต์พุตคอนโซล การติดตามแบบต่อเนื่องด้วย CLI และแท็บ Logs ของ Control UI
- [การทำงานภายในของการบันทึก Gateway](/th/gateway/logging) - รูปแบบบันทึก WS คำนำหน้าระบบย่อย และการจับเอาต์พุตคอนโซล
- [แฟล็กการวินิจฉัย](/th/diagnostics/flags) - แฟล็กบันทึกการดีบักแบบเจาะจง
- [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics) - เครื่องมือชุดข้อมูลสนับสนุนสำหรับผู้ดูแลระบบ (แยกจากการส่งออก OTEL)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#diagnostics) - ข้อมูลอ้างอิงฟิลด์ `diagnostics.*` ฉบับเต็ม
