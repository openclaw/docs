---
read_when:
    - คุณต้องการภาพรวมการบันทึกล็อกของ OpenClaw ที่เข้าใจง่ายสำหรับผู้เริ่มต้น
    - คุณต้องการกำหนดค่าระดับการบันทึก รูปแบบ หรือการปกปิดข้อมูล
    - คุณกำลังแก้ไขปัญหาและต้องการค้นหาล็อกอย่างรวดเร็ว
summary: ไฟล์บันทึก เอาต์พุตคอนโซล การ tail ของ CLI และแท็บบันทึกของ UI ควบคุม
title: การบันทึกล็อก
x-i18n:
    generated_at: "2026-05-06T09:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: abcdfeb0f9fbd13715762a1829198d0285738855c50f2ee531cab1e989d936b1
    source_path: logging.md
    workflow: 16
---

OpenClaw มีพื้นผิว log หลักสองแบบ:

- **file log** (JSON lines) ที่เขียนโดย Gateway
- **console output** ที่แสดงใน terminal และ Gateway Debug UI

แท็บ **Logs** ของ Control UI จะ tail file log ของ gateway หน้านี้อธิบายว่า
log อยู่ที่ใด วิธีอ่าน log และวิธีกำหนดระดับกับรูปแบบของ log

## ตำแหน่งที่เก็บ log

โดยค่าเริ่มต้น Gateway จะเขียน rolling log file ไว้ใต้:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

วันที่ใช้ timezone ภายในเครื่องของ gateway host

แต่ละไฟล์จะ rotate เมื่อมีขนาดถึง `logging.maxFileBytes` (ค่าเริ่มต้น: 100 MB)
OpenClaw จะเก็บ archive แบบมีหมายเลขไว้สูงสุดห้าไฟล์ข้างไฟล์ที่กำลังใช้งาน เช่น
`openclaw-YYYY-MM-DD.1.log` และจะเขียนต่อไปยัง active log ไฟล์ใหม่แทนที่จะ
ระงับ diagnostics

คุณสามารถ override สิ่งนี้ได้ใน `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## วิธีอ่าน log

### CLI: tail แบบสด (แนะนำ)

ใช้ CLI เพื่อ tail gateway log file ผ่าน RPC:

```bash
openclaw logs --follow
```

ตัวเลือกปัจจุบันที่มีประโยชน์:

- `--local-time`: แสดง timestamp ใน timezone ภายในเครื่องของคุณ
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag มาตรฐานของ Gateway RPC
- `--expect-final`: flag รอ final-response ของ RPC ที่มี agent อยู่เบื้องหลัง (รับที่นี่ผ่าน shared client layer)

โหมด output:

- **TTY sessions**: log line แบบสวยงาม มีสี และมีโครงสร้าง
- **Non-TTY sessions**: plain text
- `--json`: JSON แบบ line-delimited (หนึ่ง log event ต่อหนึ่งบรรทัด)
- `--plain`: บังคับใช้ plain text ใน TTY sessions
- `--no-color`: ปิดใช้ ANSI colors

เมื่อคุณส่ง `--url` แบบ explicit CLI จะไม่ auto-apply config หรือ
environment credentials; ให้ใส่ `--token` เองถ้า Gateway เป้าหมาย
ต้องใช้ auth

ในโหมด JSON CLI จะ emit object ที่ tag ด้วย `type`:

- `meta`: metadata ของ stream (file, cursor, size)
- `log`: รายการ log ที่ parse แล้ว
- `notice`: hint เกี่ยวกับ truncation / rotation
- `raw`: log line ที่ parse ไม่ได้

ถ้า Gateway แบบ implicit local loopback ขอ pairing, ปิดระหว่าง connect,
หรือ timeout ก่อนที่ `logs.tail` จะตอบ `openclaw logs` จะ fallback ไปยัง
gateway file log ที่กำหนดค่าไว้โดยอัตโนมัติ เป้าหมาย `--url` แบบ explicit
จะไม่ใช้ fallback นี้

ถ้า Gateway ติดต่อไม่ได้ CLI จะพิมพ์ hint สั้น ๆ ให้รัน:

```bash
openclaw doctor
```

### Control UI (web)

แท็บ **Logs** ของ Control UI tail ไฟล์เดียวกันโดยใช้ `logs.tail`
ดู [Control UI](/th/web/control-ui) สำหรับวิธีเปิด

### Log เฉพาะ channel

หากต้องการ filter activity ของ channel (WhatsApp/Telegram/ฯลฯ) ให้ใช้:

```bash
openclaw channels logs --channel whatsapp
```

## รูปแบบ log

### File logs (JSONL)

แต่ละบรรทัดใน log file คือ JSON object CLI และ Control UI จะ parse
entry เหล่านี้เพื่อ render output แบบมีโครงสร้าง (time, level, subsystem, message)

record ของ file-log JSONL ยังมี top-level field ที่ filter ด้วยเครื่องได้เมื่อ
มีข้อมูล:

- `hostname`: ชื่อ gateway host
- `message`: ข้อความ log แบบ flattened สำหรับ full-text search
- `agent_id`: id ของ agent ที่ active เมื่อ log call มี agent context
- `session_id`: id/key ของ session ที่ active เมื่อ log call มี session context
- `channel`: channel ที่ active เมื่อ log call มี channel context

OpenClaw จะเก็บ structured log arguments เดิมไว้ข้าง field เหล่านี้
เพื่อให้ parser ที่มีอยู่ซึ่งอ่าน key argument แบบมีหมายเลขของ tslog ยังทำงานได้

### Console output

Console logs **รับรู้ TTY** และจัดรูปแบบให้อ่านง่าย:

- prefix ของ subsystem (เช่น `gateway/channels/whatsapp`)
- การใส่สีตาม level (info/warn/error)
- โหมด compact หรือ JSON แบบ optional

การจัดรูปแบบ console ควบคุมโดย `logging.consoleStyle`

### Gateway WebSocket logs

`openclaw gateway` ยังมี WebSocket protocol logging สำหรับ RPC traffic:

- โหมดปกติ: เฉพาะ result ที่น่าสนใจ (error, parse error, call ที่ช้า)
- `--verbose`: request/response traffic ทั้งหมด
- `--ws-log auto|compact|full`: เลือก verbose rendering style
- `--compact`: alias สำหรับ `--ws-log compact`

ตัวอย่าง:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## การกำหนดค่า logging

การกำหนดค่า logging ทั้งหมดอยู่ใต้ `logging` ใน `~/.openclaw/openclaw.json`

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

### ระดับ log

- `logging.level`: ระดับของ **file logs** (JSONL)
- `logging.consoleLevel`: ระดับ verbosity ของ **console**

คุณสามารถ override ทั้งสองค่าได้ผ่าน environment variable **`OPENCLAW_LOG_LEVEL`** (เช่น `OPENCLAW_LOG_LEVEL=debug`) env var จะมี precedence เหนือ config file ดังนั้นคุณจึงเพิ่ม verbosity สำหรับการรันครั้งเดียวได้โดยไม่ต้องแก้ `openclaw.json` คุณยังสามารถส่ง global CLI option **`--log-level <level>`** (ตัวอย่างเช่น `openclaw --log-level debug gateway run`) ซึ่งจะ override environment variable สำหรับ command นั้น

`--verbose` มีผลเฉพาะ console output และ WS log verbosity; ไม่ได้เปลี่ยน
ระดับ file log

### การเชื่อมโยง trace

File logs เป็น JSONL เมื่อ log call มี diagnostic trace context ที่ถูกต้อง
OpenClaw จะเขียน trace fields เป็น top-level JSON keys (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) เพื่อให้ external log processor เชื่อมโยงบรรทัดนั้น
กับ OTEL spans และการ propagate `traceparent` ของ provider ได้

Gateway HTTP requests และ Gateway WebSocket frames จะสร้าง internal request
trace scope Log และ diagnostic event ที่ emit ภายใน async scope นั้นจะสืบทอด
request trace เมื่อไม่ได้ส่ง explicit trace context เข้ามา Agent run และ
model-call traces จะกลายเป็น child ของ active request trace ดังนั้น local logs,
diagnostic snapshots, OTEL spans และ header `traceparent` ของ trusted provider
จึงสามารถเชื่อมกันด้วย `traceId` โดยไม่ต้อง log request หรือ model content ดิบ

### ขนาดและ timing ของ model call

Model-call diagnostics บันทึกการวัด request/response แบบมีขอบเขตโดยไม่
capturing prompt หรือ response content ดิบ:

- `requestPayloadBytes`: ขนาด byte แบบ UTF-8 ของ payload request สุดท้ายของ model
- `responseStreamBytes`: ขนาด byte แบบ UTF-8 ของ streamed model response events
- `timeToFirstByteMs`: เวลาที่ผ่านไปก่อน streamed response event แรก
- `durationMs`: ระยะเวลารวมของ model-call

field เหล่านี้ใช้ได้กับ diagnostic snapshots, model-call Plugin hooks และ
OTEL model-call spans/metrics เมื่อเปิดใช้ diagnostics export

### Console styles

`logging.consoleStyle`:

- `pretty`: เป็นมิตรต่อมนุษย์ มีสี และมี timestamp
- `compact`: output กระชับขึ้น (ดีที่สุดสำหรับ session ยาว)
- `json`: JSON ต่อบรรทัด (สำหรับ log processor)

### Redaction

OpenClaw สามารถ redact token ที่ sensitive ก่อนที่ token เหล่านั้นจะไปถึง console output, file logs,
OTLP log records, persisted session transcript text หรือ Control UI tool
event payloads (tool start args, partial/final result payloads, derived
exec output และ patch summaries):

- `logging.redactSensitive`: `off` | `tools` (ค่าเริ่มต้น: `tools`)
- `logging.redactPatterns`: list ของ regex string เพื่อ override default set Custom patterns จะ apply ทับ built-in defaults สำหรับ Control UI tool payloads ดังนั้นการเพิ่ม pattern จะไม่ลดความเข้มงวดของ redaction สำหรับค่าที่ default จับได้อยู่แล้ว

File logs และ session transcripts ยังคงเป็น JSONL แต่ค่าลับที่ match จะถูก
mask ก่อนที่บรรทัดหรือ message จะถูกเขียนลง disk Redaction เป็นแบบ best-effort:
ใช้กับ message content และ log strings ที่มี text ไม่ใช่ทุก
identifier หรือ binary payload field

built-in defaults ครอบคลุม API credentials ทั่วไปและชื่อ field ของ payment-credential
เช่น card number, CVC/CVV, shared payment token และ payment credential
เมื่อปรากฏเป็น JSON fields, URL parameters, CLI flags หรือ assignments

`logging.redactSensitive: "off"` ปิดเฉพาะ policy log/transcript ทั่วไปนี้
OpenClaw ยังคง redact safety-boundary payloads ที่สามารถแสดงให้ UI
clients, support bundles, diagnostics observers, approval prompts หรือ agent
tools ได้ ตัวอย่างรวมถึง Control UI tool-call events, `sessions_history` output,
diagnostics support exports, provider error observations, exec approval command
display และ Gateway WebSocket protocol logs Custom `logging.redactPatterns`
ยังสามารถเพิ่ม pattern เฉพาะโปรเจกต์บนพื้นผิวเหล่านั้นได้

## Diagnostics และ OpenTelemetry

Diagnostics คือ event แบบมีโครงสร้างที่เครื่องอ่านได้สำหรับ model runs และ
message-flow telemetry (webhook, queueing, session state) สิ่งเหล่านี้ **ไม่**
แทนที่ log แต่จะ feed metrics, traces และ exporters Event จะถูก emit
ใน process ไม่ว่าคุณจะ export หรือไม่ก็ตาม

พื้นผิวที่อยู่ใกล้กันสองอย่าง:

- **OpenTelemetry export** — ส่ง metrics, traces และ logs ผ่าน OTLP/HTTP ไปยัง
  collector หรือ backend ที่เข้ากันได้กับ OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo ฯลฯ) การกำหนดค่าเต็ม, signal catalog,
  ชื่อ metric/span, env vars และ privacy model อยู่ในหน้าเฉพาะ:
  [OpenTelemetry export](/th/gateway/opentelemetry)
- **Diagnostics flags** — flag debug-log แบบเจาะจงที่ route log เพิ่มเติมไปยัง
  `logging.file` โดยไม่เพิ่ม `logging.level` Flag ไม่แยกตัวพิมพ์ใหญ่เล็ก
  และรองรับ wildcard (`telegram.*`, `*`) กำหนดค่าใต้ `diagnostics.flags`
  หรือผ่าน env override `OPENCLAW_DIAGNOSTICS=...` คู่มือฉบับเต็ม:
  [Diagnostics flags](/th/diagnostics/flags)

หากต้องการเปิดใช้ diagnostics events สำหรับ Plugin หรือ custom sinks โดยไม่มี OTLP export:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับ OTLP export ไปยัง collector ดู [OpenTelemetry export](/th/gateway/opentelemetry)

## เคล็ดลับการแก้ปัญหา

- **ติดต่อ Gateway ไม่ได้?** รัน `openclaw doctor` ก่อน
- **Log ว่างเปล่า?** ตรวจสอบว่า Gateway กำลังทำงานและเขียนไปยัง file path
  ใน `logging.file`
- **ต้องการรายละเอียดมากขึ้น?** ตั้ง `logging.level` เป็น `debug` หรือ `trace` แล้วลองอีกครั้ง

## ที่เกี่ยวข้อง

- [OpenTelemetry export](/th/gateway/opentelemetry) — OTLP/HTTP export, metric/span catalog, privacy model
- [Diagnostics flags](/th/diagnostics/flags) — flag debug-log แบบเจาะจง
- [Gateway logging internals](/th/gateway/logging) — WS log styles, prefix ของ subsystem และ console capture
- [Configuration reference](/th/gateway/configuration-reference#diagnostics) — field reference ฉบับเต็มของ `diagnostics.*`
