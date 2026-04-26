---
read_when:
    - คุณต้องการภาพรวมการบันทึก Log ของ OpenClaw ที่เป็นมิตรกับผู้เริ่มต้น
    - คุณต้องการกำหนดค่าระดับ log รูปแบบ หรือการปิดข้อมูลสำคัญ
    - คุณกำลังแก้ปัญหาและต้องการค้นหา log อย่างรวดเร็ว
summary: ไฟล์ log เอาต์พุตคอนโซล การติดตามผ่าน CLI และแท็บ Log ใน Control UI
title: การบันทึก Log
x-i18n:
    generated_at: "2026-04-26T11:35:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

OpenClaw มีพื้นผิว log หลักอยู่สองแบบ:

- **ไฟล์ log** (JSON lines) ที่ Gateway เขียนไว้
- **เอาต์พุตคอนโซล** ที่แสดงในเทอร์มินัลและ Gateway Debug UI

แท็บ **Logs** ใน Control UI จะ tail ไฟล์ log ของ gateway หน้านี้อธิบายว่า
log อยู่ที่ใด วิธีอ่าน และวิธีกำหนดค่าระดับ log และรูปแบบต่าง ๆ

## ตำแหน่งที่เก็บ log

โดยค่าเริ่มต้น Gateway จะเขียนไฟล์ log แบบหมุนเวียนไว้ที่:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

วันที่ใช้ timezone ท้องถิ่นของโฮสต์ gateway

แต่ละไฟล์จะถูกหมุนเมื่อมีขนาดถึง `logging.maxFileBytes` (ค่าเริ่มต้น: 100 MB)
OpenClaw จะเก็บไฟล์ archive แบบมีหมายเลขไว้ข้างไฟล์ที่กำลังใช้งานสูงสุดห้าไฟล์ เช่น
`openclaw-YYYY-MM-DD.1.log` และจะเขียนต่อไปยังไฟล์ active ใหม่ แทนที่จะ
ระงับข้อมูลวินิจฉัย

คุณสามารถ override ได้ใน `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## วิธีอ่าน log

### CLI: tail แบบ live (แนะนำ)

ใช้ CLI เพื่อ tail ไฟล์ log ของ gateway ผ่าน RPC:

```bash
openclaw logs --follow
```

ตัวเลือกที่มีประโยชน์ในปัจจุบัน:

- `--local-time`: แสดง timestamp ใน timezone ท้องถิ่นของคุณ
- `--url <url>` / `--token <token>` / `--timeout <ms>`: แฟล็กมาตรฐานของ Gateway RPC
- `--expect-final`: แฟล็กรอการตอบกลับสุดท้ายของ RPC แบบ agent-backed (รองรับที่นี่ผ่าน shared client layer)

โหมดเอาต์พุต:

- **เซสชัน TTY**: บรรทัด log แบบมีโครงสร้าง สวยงาม และมีสี
- **เซสชัน non-TTY**: ข้อความล้วน
- `--json`: JSON แบบคั่นด้วยบรรทัด (หนึ่งเหตุการณ์ log ต่อหนึ่งบรรทัด)
- `--plain`: บังคับใช้ข้อความล้วนในเซสชัน TTY
- `--no-color`: ปิดสี ANSI

เมื่อคุณส่ง `--url` แบบชัดเจน CLI จะไม่ใช้ข้อมูลรับรองจากคอนฟิกหรือ
สภาพแวดล้อมโดยอัตโนมัติ; ให้ระบุ `--token` เองหาก Gateway เป้าหมาย
ต้องการ auth

ในโหมด JSON, CLI จะส่งอ็อบเจ็กต์ที่ติดแท็ก `type`:

- `meta`: metadata ของสตรีม (ไฟล์, cursor, ขนาด)
- `log`: รายการ log ที่แยกวิเคราะห์แล้ว
- `notice`: ข้อความแจ้งเกี่ยวกับการตัดทอน / การหมุนไฟล์
- `raw`: บรรทัด log ที่แยกวิเคราะห์ไม่ได้

หาก Gateway แบบ local loopback ขอการจับคู่ `openclaw logs` จะ fallback ไปใช้
ไฟล์ log ในเครื่องที่ตั้งค่าไว้โดยอัตโนมัติ เป้าหมายที่ระบุ `--url` แบบชัดเจนจะ
ไม่ใช้ fallback นี้

หากเข้าถึง Gateway ไม่ได้ CLI จะพิมพ์คำแนะนำสั้น ๆ ให้รัน:

```bash
openclaw doctor
```

### Control UI (เว็บ)

แท็บ **Logs** ของ Control UI จะ tail ไฟล์เดียวกันผ่าน `logs.tail`
ดู [/web/control-ui](/th/web/control-ui) สำหรับวิธีเปิดใช้งาน

### log เฉพาะ channel

หากต้องการกรองกิจกรรมของ channel (WhatsApp/Telegram/ฯลฯ) ให้ใช้:

```bash
openclaw channels logs --channel whatsapp
```

## รูปแบบ log

### ไฟล์ log (JSONL)

แต่ละบรรทัดในไฟล์ log เป็นอ็อบเจ็กต์ JSON หนึ่งรายการ CLI และ Control UI จะ parse
รายการเหล่านี้เพื่อแสดงผลแบบมีโครงสร้าง (เวลา ระดับ subsystem ข้อความ)

### เอาต์พุตคอนโซล

log ของคอนโซลจะ **รับรู้ TTY** และจัดรูปแบบเพื่อให้อ่านง่าย:

- prefix ของ subsystem (เช่น `gateway/channels/whatsapp`)
- สีตามระดับ (info/warn/error)
- โหมด compact หรือ JSON แบบเลือกได้

การจัดรูปแบบคอนโซลควบคุมโดย `logging.consoleStyle`

### log WebSocket ของ Gateway

`openclaw gateway` ยังมีการบันทึก log ของโปรโตคอล WebSocket สำหรับทราฟฟิก RPC:

- โหมดปกติ: แสดงเฉพาะผลลัพธ์ที่น่าสนใจ (ข้อผิดพลาด, parse error, การเรียกที่ช้า)
- `--verbose`: แสดงทราฟฟิก request/response ทั้งหมด
- `--ws-log auto|compact|full`: เลือกรูปแบบการแสดงแบบ verbose
- `--compact`: alias ของ `--ws-log compact`

ตัวอย่าง:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## การกำหนดค่าการบันทึก log

การตั้งค่าการบันทึก log ทั้งหมดอยู่ภายใต้ `logging` ใน `~/.openclaw/openclaw.json`

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

- `logging.level`: ระดับของ **ไฟล์ log** (JSONL)
- `logging.consoleLevel`: ระดับความละเอียดของ **คอนโซล**

คุณสามารถ override ทั้งสองค่านี้ผ่านตัวแปรแวดล้อม **`OPENCLAW_LOG_LEVEL`** ได้ (เช่น `OPENCLAW_LOG_LEVEL=debug`) ตัวแปร env จะมีสิทธิ์เหนือกว่าไฟล์คอนฟิก ดังนั้นคุณจึงเพิ่มระดับความละเอียดสำหรับการรันครั้งเดียวได้โดยไม่ต้องแก้ `openclaw.json` นอกจากนี้ยังส่งตัวเลือก CLI ส่วนกลาง **`--log-level <level>`** ได้ด้วย (เช่น `openclaw --log-level debug gateway run`) ซึ่งจะ override ตัวแปรแวดล้อมสำหรับคำสั่งนั้น

`--verbose` มีผลเฉพาะกับเอาต์พุตคอนโซลและความละเอียดของ WS log; ไม่เปลี่ยน
ระดับของไฟล์ log

### รูปแบบคอนโซล

`logging.consoleStyle`:

- `pretty`: เป็นมิตรกับมนุษย์ มีสี และมี timestamp
- `compact`: เอาต์พุตกระชับกว่า (เหมาะกับเซสชันยาว)
- `json`: JSON ต่อบรรทัด (สำหรับตัวประมวลผล log)

### การปิดข้อมูลสำคัญ

สรุปจากเครื่องมือสามารถปิดข้อมูลโทเค็นสำคัญก่อนถึงคอนโซลได้:

- `logging.redactSensitive`: `off` | `tools` (ค่าเริ่มต้น: `tools`)
- `logging.redactPatterns`: รายการสตริง regex เพื่อ override ชุดค่าเริ่มต้น

การปิดข้อมูลสำคัญจะมีผลที่ปลายทางของการบันทึกสำหรับ **เอาต์พุตคอนโซล**, **ข้อมูลวินิจฉัยคอนโซลที่ถูกส่งผ่าน stderr** และ **ไฟล์ log** ไฟล์ log ยังคงเป็น JSONL แต่ค่าความลับที่ตรงกับเงื่อนไขจะถูกปิดบังก่อนเขียนลงดิสก์

## Diagnostics และ OpenTelemetry

Diagnostics คือเหตุการณ์แบบมีโครงสร้างที่เครื่องอ่านได้ สำหรับการรันโมเดลและ
telemetry ของการไหลของข้อความ (webhook, การเข้าคิว, สถานะเซสชัน) โดย **ไม่**
ได้มาแทน log — แต่ใช้ป้อนข้อมูลให้ metrics, traces และ exporters เหตุการณ์จะถูกส่งออก
ในโพรเซสอยู่แล้ว ไม่ว่าคุณจะ export หรือไม่ก็ตาม

มีสองพื้นผิวที่อยู่ใกล้กัน:

- **การ export OpenTelemetry** — ส่ง metrics, traces และ logs ผ่าน OTLP/HTTP ไปยัง
  collector หรือ backend ที่เข้ากันได้กับ OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo ฯลฯ) การตั้งค่าเต็ม รูปรายการสัญญาณ
  ชื่อ metric/span ตัวแปร env และโมเดลความเป็นส่วนตัวอยู่ในหน้าเฉพาะ:
  [การ export OpenTelemetry](/th/gateway/opentelemetry)
- **แฟล็ก Diagnostics** — แฟล็ก debug-log แบบเจาะจงที่ส่ง log เพิ่มเติมไปยัง
  `logging.file` โดยไม่ต้องยกระดับ `logging.level` แฟล็กไม่สนตัวพิมพ์เล็กใหญ่
  และรองรับ wildcard (`telegram.*`, `*`) กำหนดค่าภายใต้ `diagnostics.flags`
  หรือผ่านการ override ด้วย env `OPENCLAW_DIAGNOSTICS=...` ดูคู่มือเต็ม:
  [แฟล็ก Diagnostics](/th/diagnostics/flags)

หากต้องการเปิดใช้เหตุการณ์ diagnostics สำหรับ Plugin หรือปลายทางแบบกำหนดเองโดยไม่ใช้ OTLP export:

```json5
{
  diagnostics: { enabled: true },
}
```

สำหรับการ export OTLP ไปยัง collector ดู [การ export OpenTelemetry](/th/gateway/opentelemetry)

## เคล็ดลับการแก้ปัญหา

- **เข้าถึง Gateway ไม่ได้?** ให้รัน `openclaw doctor` ก่อน
- **log ว่าง?** ตรวจสอบว่า Gateway กำลังทำงานและกำลังเขียนไปยัง path ของไฟล์
  ใน `logging.file`
- **ต้องการรายละเอียดมากขึ้น?** ตั้ง `logging.level` เป็น `debug` หรือ `trace` แล้วลองใหม่

## ที่เกี่ยวข้อง

- [การ export OpenTelemetry](/th/gateway/opentelemetry) — การ export OTLP/HTTP, แค็ตตาล็อก metric/span, โมเดลความเป็นส่วนตัว
- [แฟล็ก Diagnostics](/th/diagnostics/flags) — แฟล็ก debug-log แบบเจาะจง
- [รายละเอียดภายในของการบันทึก log ของ Gateway](/th/gateway/logging) — รูปแบบ WS log, prefix ของ subsystem และการจับเอาต์พุตคอนโซล
- [ข้อมูลอ้างอิงการตั้งค่า](/th/gateway/configuration-reference#diagnostics) — ข้อมูลอ้างอิงฟิลด์ `diagnostics.*` แบบเต็ม
