---
read_when:
    - คุณต้องการภาพรวมการบันทึกล็อกที่เป็นมิตรกับผู้เริ่มต้น
    - คุณต้องการกำหนดค่าระดับหรือรูปแบบของล็อก
    - คุณกำลังแก้ไขปัญหาและต้องการค้นหาล็อกอย่างรวดเร็ว
summary: 'ภาพรวมการบันทึกล็อก: ไฟล์ล็อก, เอาต์พุตคอนโซล, การ tail ผ่าน CLI และ Control UI'
title: ภาพรวมการบันทึกล็อก
x-i18n:
    generated_at: "2026-04-25T13:50:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# การบันทึกล็อก

OpenClaw มีพื้นผิวหลักสำหรับล็อกอยู่สองแบบ:

- **ไฟล์ล็อก** (JSON lines) ที่ Gateway เขียน
- **เอาต์พุตคอนโซล** ที่แสดงในเทอร์มินัลและใน Gateway Debug UI

แท็บ **Logs** ของ Control UI จะ tail ไฟล์ล็อกของ gateway หน้านี้อธิบายว่าล็อกอยู่ที่ไหน
อ่านอย่างไร และกำหนดค่าระดับและรูปแบบของล็อกอย่างไร

## ตำแหน่งที่เก็บล็อก

โดยค่าเริ่มต้น Gateway จะเขียน rolling log file ไว้ที่:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

วันที่จะอิงตามเขตเวลาท้องถิ่นของโฮสต์ที่รัน gateway

คุณสามารถ override ได้ใน `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## วิธีอ่านล็อก

### CLI: tail แบบสด (แนะนำ)

ใช้ CLI เพื่อ tail ไฟล์ล็อกของ gateway ผ่าน RPC:

```bash
openclaw logs --follow
```

ตัวเลือกที่มีประโยชน์ในปัจจุบัน:

- `--local-time`: แสดง timestamps ตามเขตเวลาท้องถิ่นของคุณ
- `--url <url>` / `--token <token>` / `--timeout <ms>`: แฟล็ก Gateway RPC มาตรฐาน
- `--expect-final`: แฟล็กรอ final-response ของ RPC ที่รองรับด้วย agent (รองรับที่นี่ผ่าน shared client layer)

โหมดเอาต์พุต:

- **TTY sessions**: บรรทัดล็อกแบบ structured ที่สวยงามและมีสี
- **Non-TTY sessions**: plain text
- `--json`: JSON แบบหนึ่งเหตุการณ์ต่อหนึ่งบรรทัด
- `--plain`: บังคับใช้ plain text ใน TTY sessions
- `--no-color`: ปิดสี ANSI

เมื่อคุณส่ง `--url` มาอย่างชัดเจน CLI จะไม่ใช้คอนฟิกหรือ
credentials จาก environment โดยอัตโนมัติ; ให้ใส่ `--token` เองหาก Gateway เป้าหมาย
ต้องการ auth

ในโหมด JSON CLI จะส่งออบเจ็กต์ที่มีแท็ก `type`:

- `meta`: ข้อมูลเมตาของสตรีม (file, cursor, size)
- `log`: รายการล็อกที่ parse แล้ว
- `notice`: ข้อสังเกตเรื่อง truncation / rotation
- `raw`: บรรทัดล็อกที่ยังไม่ได้ parse

หาก Gateway บน local loopback ขอ pairing, `openclaw logs` จะ fallback ไปยัง
ไฟล์ล็อกภายในเครื่องที่กำหนดค่าไว้โดยอัตโนมัติ เป้าหมาย `--url` ที่ระบุชัดเจนจะไม่ใช้ fallback นี้

หาก Gateway เข้าถึงไม่ได้ CLI จะแสดงคำแนะนำสั้นๆ ให้รัน:

```bash
openclaw doctor
```

### Control UI (เว็บ)

แท็บ **Logs** ของ Control UI จะ tail ไฟล์เดียวกันผ่าน `logs.tail`
ดู [/web/control-ui](/th/web/control-ui) สำหรับวิธีเปิดใช้งาน

### ล็อกเฉพาะช่องทาง

หากต้องการกรองกิจกรรมของช่องทาง (WhatsApp/Telegram/ฯลฯ) ให้ใช้:

```bash
openclaw channels logs --channel whatsapp
```

## รูปแบบล็อก

### ไฟล์ล็อก (JSONL)

แต่ละบรรทัดในไฟล์ล็อกเป็น JSON object โดย CLI และ Control UI จะ parse
entries เหล่านี้เพื่อเรนเดอร์เอาต์พุตแบบ structured (เวลา ระดับ subsystem ข้อความ)

### เอาต์พุตคอนโซล

ล็อกของคอนโซลจะ **รับรู้ TTY** และจัดรูปแบบเพื่อให้อ่านง่าย:

- คำนำหน้า subsystem (เช่น `gateway/channels/whatsapp`)
- สีตามระดับ (info/warn/error)
- โหมด compact หรือ JSON แบบทางเลือก

การจัดรูปแบบคอนโซลถูกควบคุมโดย `logging.consoleStyle`

### ล็อก WebSocket ของ Gateway

`openclaw gateway` ยังมีการบันทึกล็อกของโปรโตคอล WebSocket สำหรับทราฟฟิก RPC:

- โหมดปกติ: แสดงเฉพาะผลลัพธ์ที่น่าสนใจ (errors, parse errors, slow calls)
- `--verbose`: แสดงทราฟฟิก request/response ทั้งหมด
- `--ws-log auto|compact|full`: เลือกรูปแบบการเรนเดอร์แบบ verbose
- `--compact`: alias ของ `--ws-log compact`

ตัวอย่าง:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## การกำหนดค่าการบันทึกล็อก

การกำหนดค่าล็อกทั้งหมดอยู่ภายใต้ `logging` ใน `~/.openclaw/openclaw.json`

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### ระดับล็อก

- `logging.level`: ระดับของ **ไฟล์ล็อก** (JSONL)
- `logging.consoleLevel`: ระดับความละเอียดของ **คอนโซล**

คุณสามารถ override ทั้งสองค่าได้ผ่านตัวแปรสภาพแวดล้อม **`OPENCLAW_LOG_LEVEL`** (เช่น `OPENCLAW_LOG_LEVEL=debug`) โดย env var จะมีลำดับความสำคัญเหนือไฟล์คอนฟิก ดังนั้นคุณจึงเพิ่มความละเอียดสำหรับการรันครั้งเดียวได้โดยไม่ต้องแก้ `openclaw.json` นอกจากนี้ยังสามารถส่งตัวเลือก CLI แบบ global **`--log-level <level>`** ได้ด้วย (เช่น `openclaw --log-level debug gateway run`) ซึ่งจะ override ตัวแปรสภาพแวดล้อมสำหรับคำสั่งนั้น

`--verbose` มีผลเฉพาะกับเอาต์พุตคอนโซลและความละเอียดของ WS log เท่านั้น; ไม่ได้เปลี่ยน
ระดับของไฟล์ล็อก

### รูปแบบคอนโซล

`logging.consoleStyle`:

- `pretty`: เป็นมิตรกับมนุษย์ มีสี และมี timestamps
- `compact`: เอาต์พุตกระชับขึ้น (เหมาะที่สุดสำหรับเซสชันยาว)
- `json`: JSON ต่อหนึ่งบรรทัด (สำหรับตัวประมวลผลล็อก)

### การปิดทับข้อมูลสำคัญ

สรุปของ tool สามารถปิดทับ tokens ที่ละเอียดอ่อนได้ก่อนจะแสดงบนคอนโซล:

- `logging.redactSensitive`: `off` | `tools` (ค่าเริ่มต้น: `tools`)
- `logging.redactPatterns`: รายการสตริง regex เพื่อ override ชุดเริ่มต้น

การปิดทับมีผลกับ **เอาต์พุตคอนโซลเท่านั้น** และไม่เปลี่ยนแปลงไฟล์ล็อก

## Diagnostics + OpenTelemetry

Diagnostics คือเหตุการณ์แบบ structured ที่เครื่องอ่านได้สำหรับการรันโมเดล **และ**
telemetry ของการไหลของข้อความ (webhooks, queueing, สถานะ session) โดย **ไม่ได้**
มาแทนที่ล็อก แต่มีไว้เพื่อส่งต่อไปยัง metrics, traces และ exporters อื่นๆ

เหตุการณ์ diagnostics จะถูกปล่อยออกมาภายใน process แต่ exporters จะเชื่อมต่อก็ต่อเมื่อ
เปิดใช้ diagnostics + exporter plugin แล้วเท่านั้น

### OpenTelemetry เทียบกับ OTLP

- **OpenTelemetry (OTel)**: data model + SDKs สำหรับ traces, metrics และ logs
- **OTLP**: wire protocol ที่ใช้ส่งออกข้อมูล OTel ไปยัง collector/backend
- ปัจจุบัน OpenClaw ส่งออกผ่าน **OTLP/HTTP (protobuf)**

### Signals ที่ส่งออก

- **Metrics**: counters + histograms (การใช้ token, การไหลของข้อความ, queueing)
- **Traces**: spans สำหรับการใช้งานโมเดล + การประมวลผล webhook/message
- **Logs**: ส่งออกผ่าน OTLP เมื่อเปิด `diagnostics.otel.logs` ปริมาณล็อก
  อาจสูงได้; ควรคำนึงถึง `logging.level` และตัวกรองของ exporter

### แค็ตตาล็อกเหตุการณ์ Diagnostic

การใช้โมเดล:

- `model.usage`: tokens, cost, duration, context, provider/model/channel, session ids

การไหลของข้อความ:

- `webhook.received`: webhook ingress ต่อช่องทาง
- `webhook.processed`: webhook ที่จัดการแล้ว + duration
- `webhook.error`: ข้อผิดพลาดของ webhook handler
- `message.queued`: ข้อความถูกเข้าคิวเพื่อประมวลผล
- `message.processed`: ผลลัพธ์ + duration + optional error
- `message.delivery.started`: เริ่มความพยายามส่งข้อความขาออก
- `message.delivery.completed`: จบความพยายามส่งข้อความขาออก + duration/result count
- `message.delivery.error`: ความพยายามส่งข้อความขาออกล้มเหลว + duration/bounded error category

คิว + session:

- `queue.lane.enqueue`: การ enqueue ของ command queue lane + depth
- `queue.lane.dequeue`: การ dequeue ของ command queue lane + wait time
- `session.state`: การเปลี่ยนสถานะ session + reason
- `session.stuck`: คำเตือนว่า session ค้าง + age
- `run.attempt`: ข้อมูลเมตาการ retry/attempt ของการรัน
- `diagnostic.heartbeat`: ตัวนับรวม (webhooks/queue/session)

Exec:

- `exec.process.completed`: ผลลัพธ์ของ terminal exec process, duration, target, mode,
  exit code และ failure kind โดยจะไม่รวมข้อความคำสั่งและ working directories

### เปิดใช้ diagnostics (ไม่มี exporter)

ใช้วิธีนี้หากคุณต้องการให้เหตุการณ์ diagnostics พร้อมใช้งานกับ plugins หรือ custom sinks:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### แฟล็ก diagnostics (ล็อกแบบเจาะจง)

ใช้แฟล็กเพื่อเปิดใช้ targeted debug logs เพิ่มเติมโดยไม่ต้องเพิ่ม `logging.level`
แฟล็กไม่แยกตัวพิมพ์เล็กใหญ่และรองรับ wildcards (เช่น `telegram.*` หรือ `*`)

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

override ผ่าน env (ครั้งเดียว):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

หมายเหตุ:

- ล็อกจาก flag จะไปยังไฟล์ล็อกมาตรฐาน (ไฟล์เดียวกับ `logging.file`)
- เอาต์พุตยังคงถูกปิดทับตาม `logging.redactSensitive`
- คู่มือฉบับเต็ม: [/diagnostics/flags](/th/diagnostics/flags)

### ส่งออกไปยัง OpenTelemetry

สามารถส่งออก diagnostics ผ่าน Plugin `diagnostics-otel` (OTLP/HTTP) ได้ วิธีนี้
ทำงานได้กับ OpenTelemetry collector/backend ใดก็ได้ที่รองรับ OTLP/HTTP

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

หมายเหตุ:

- คุณสามารถเปิดใช้ Plugin ได้ด้วย `openclaw plugins enable diagnostics-otel`
- ปัจจุบัน `protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น ส่วน `grpc` จะถูกละเลย
- Metrics มีการใช้ token, cost, context size, run duration และตัวนับ/ฮิสโตแกรมของ message-flow
  (webhooks, queueing, สถานะ session, queue depth/wait)
- Traces/metrics เปิดหรือปิดได้ด้วย `traces` / `metrics` (ค่าเริ่มต้น: เปิด) โดย Traces
  รวม model usage spans และ webhook/message processing spans เมื่อเปิดใช้
- โดยค่าเริ่มต้นจะไม่ส่งออก raw model/tool content ใช้
  `diagnostics.otel.captureContent` เฉพาะเมื่อ collector และนโยบายการเก็บรักษาของคุณ
  ได้รับการอนุมัติสำหรับข้อความ prompt, response, tool หรือ system prompt
- ตั้งค่า `headers` เมื่อ collector ของคุณต้องการ auth
- ตัวแปรสภาพแวดล้อมที่รองรับ: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`
- ตั้งค่า `OPENCLAW_OTEL_PRELOADED=1` เมื่อมี preload อื่นหรือ host process
  ลงทะเบียน global OpenTelemetry SDK ไว้แล้ว ในโหมดนี้ Plugin จะไม่เริ่ม
  หรือปิด SDK ของตัวเอง แต่จะยังเชื่อม listeners ของ OpenClaw diagnostic และ
  ใช้ค่า `diagnostics.otel.traces`, `metrics` และ `logs`

### Metrics ที่ส่งออก (ชื่อ + ชนิด)

การใช้โมเดล:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

การไหลของข้อความ:

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

คิว + sessions:

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` หรือ
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Spans ที่ส่งออก (ชื่อ + key attributes)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (`input`/`output`/`cache_read`/`cache_write`/`total`)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

เมื่อมีการเปิดใช้ content capture อย่างชัดเจน model/tool spans ยังสามารถมี
attributes แบบ `openclaw.content.*` ที่ถูกจำกัดขอบเขตและปิดทับแล้ว สำหรับคลาสเนื้อหาเฉพาะที่คุณเลือกเปิดใช้

### Sampling + flushing

- Trace sampling: `diagnostics.otel.sampleRate` (0.0–1.0, เฉพาะ root spans)
- ช่วงเวลาการส่งออก metrics: `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ 1000ms)

### หมายเหตุเกี่ยวกับโปรโตคอล

- endpoints แบบ OTLP/HTTP สามารถตั้งค่าได้ผ่าน `diagnostics.otel.endpoint` หรือ
  `OTEL_EXPORTER_OTLP_ENDPOINT`
- หาก endpoint มี `/v1/traces` หรือ `/v1/metrics` อยู่แล้ว จะใช้ตามนั้นโดยตรง
- หาก endpoint มี `/v1/logs` อยู่แล้ว จะใช้ตามนั้นโดยตรงสำหรับ logs
- `OPENCLAW_OTEL_PRELOADED=1` จะใช้ OpenTelemetry SDK ที่ลงทะเบียนจากภายนอกซ้ำ
  สำหรับ traces/metrics แทนการเริ่ม NodeSDK ที่เป็นของ Plugin เอง
- `diagnostics.otel.logs` จะเปิดใช้การส่งออก OTLP log สำหรับเอาต์พุตของ logger หลัก

### พฤติกรรมของการส่งออกล็อก

- OTLP logs ใช้ structured records เดียวกับที่เขียนลง `logging.file`
- เคารพ `logging.level` (ระดับของไฟล์ล็อก) การปิดทับบนคอนโซลจะ **ไม่** มีผล
  กับ OTLP logs
- การติดตั้งที่มีปริมาณสูงควรเลือกใช้ sampling/filtering ที่ OTLP collector

## เคล็ดลับการแก้ไขปัญหา

- **Gateway เข้าถึงไม่ได้?** ให้รัน `openclaw doctor` ก่อน
- **ล็อกว่าง?** ตรวจสอบว่า Gateway กำลังทำงานและเขียนลงพาธไฟล์
  ที่ระบุใน `logging.file`
- **ต้องการรายละเอียดเพิ่ม?** ตั้ง `logging.level` เป็น `debug` หรือ `trace` แล้วลองใหม่

## ที่เกี่ยวข้อง

- [Gateway Logging Internals](/th/gateway/logging) — รูปแบบ WS log, คำนำหน้า subsystem และการเก็บเอาต์พุตคอนโซล
- [Diagnostics](/th/gateway/configuration-reference#diagnostics) — การส่งออก OpenTelemetry และคอนฟิก cache trace
