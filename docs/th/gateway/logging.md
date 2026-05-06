---
read_when:
    - การเปลี่ยนเอาต์พุตหรือรูปแบบของการบันทึกล็อก
    - การดีบักเอาต์พุตของ CLI หรือ Gateway
summary: พื้นผิวการบันทึกล็อก, ล็อกไฟล์, รูปแบบล็อก WS และการจัดรูปแบบคอนโซล
title: การบันทึกล็อกของ Gateway
x-i18n:
    generated_at: "2026-05-06T09:13:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 078b4196ef1c5af5f7f0a4253f704d90d474a3ff668ec555559cab56cbcb15c6
    source_path: gateway/logging.md
    workflow: 16
---

# การบันทึกล็อก

สำหรับภาพรวมที่ผู้ใช้เห็น (CLI + Control UI + การกำหนดค่า) โปรดดู [/logging](/th/logging)

OpenClaw มี "พื้นผิว" ของล็อกสองแบบ:

- **เอาต์พุตคอนโซล** (สิ่งที่คุณเห็นในเทอร์มินัล / Debug UI)
- **ล็อกไฟล์** (บรรทัด JSON) ที่เขียนโดย Gateway logger

เมื่อเริ่มต้น Gateway จะบันทึกโมเดลเอเจนต์เริ่มต้นที่ resolve แล้ว พร้อมกับ
ค่าเริ่มต้นของโหมดที่มีผลต่อเซสชันใหม่ เช่น:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` มาจากเอเจนต์เริ่มต้น, พารามิเตอร์โมเดล, หรือค่าเริ่มต้นเอเจนต์ส่วนกลาง;
เมื่อไม่ได้ตั้งค่าไว้ สรุปตอนเริ่มต้นจะแสดง `medium` ส่วน `fast` มาจาก
เอเจนต์เริ่มต้นหรือพารามิเตอร์ `fastMode` ของโมเดล

## Logger แบบไฟล์

- ไฟล์ล็อกแบบ rolling เริ่มต้นอยู่ใต้ `/tmp/openclaw/` (หนึ่งไฟล์ต่อวัน): `openclaw-YYYY-MM-DD.log`
  - วันที่ใช้ timezone ท้องถิ่นของโฮสต์ Gateway
- ไฟล์ล็อกที่ใช้งานอยู่จะ rotate ที่ `logging.maxFileBytes` (ค่าเริ่มต้น: 100 MB) โดยเก็บ
  archive ที่มีหมายเลขได้สูงสุดห้าไฟล์ และเขียนไฟล์ active ใหม่ต่อไป
- พาธไฟล์ล็อกและระดับสามารถกำหนดค่าได้ผ่าน `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

รูปแบบไฟล์คือ JSON object หนึ่งรายการต่อหนึ่งบรรทัด

แท็บ Logs ใน Control UI จะ tail ไฟล์นี้ผ่าน Gateway (`logs.tail`)
CLI ก็ทำแบบเดียวกันได้:

```bash
openclaw logs --follow
```

**Verbose เทียบกับระดับล็อก**

- **ล็อกไฟล์** ถูกควบคุมโดย `logging.level` เท่านั้น
- `--verbose` มีผลเฉพาะต่อ **ความละเอียดของคอนโซล** (และรูปแบบล็อก WS); มัน **ไม่**
  เพิ่มระดับล็อกของไฟล์
- หากต้องการบันทึกรายละเอียดที่มีเฉพาะ verbose ลงในล็อกไฟล์ ให้ตั้ง `logging.level` เป็น `debug` หรือ
  `trace`
- การบันทึกระดับ trace ยังรวมสรุป timing เชิงวินิจฉัยสำหรับ hot path บางรายการ
  เช่น การเตรียม factory ของเครื่องมือ Plugin โปรดดู
  [/tools/plugin#slow-plugin-tool-setup](/th/tools/plugin#slow-plugin-tool-setup)

## การจับคอนโซล

CLI จับ `console.log/info/warn/error/debug/trace` และเขียนลงในล็อกไฟล์
ขณะเดียวกันก็ยังพิมพ์ไปยัง stdout/stderr

คุณสามารถปรับความละเอียดของคอนโซลแยกต่างหากได้ผ่าน:

- `logging.consoleLevel` (ค่าเริ่มต้น `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## การปกปิดข้อมูล

OpenClaw สามารถ mask token ที่ละเอียดอ่อนก่อนที่เอาต์พุตล็อกหรือ transcript จะออกจาก
process ได้ นโยบายการปกปิดข้อมูลในล็อกนี้ถูกใช้กับคอนโซล, file-log, OTLP
log-record, และ text sink ของ session transcript ดังนั้นค่า secret ที่ตรงกันจะถูก
mask ก่อนที่บรรทัด JSONL หรือข้อความจะถูกเขียนลงดิสก์

- `logging.redactSensitive`: `off` | `tools` (ค่าเริ่มต้น: `tools`)
- `logging.redactPatterns`: อาร์เรย์ของสตริง regex (แทนที่ค่าเริ่มต้น)
  - ใช้สตริง regex ดิบ (auto `gi`) หรือ `/pattern/flags` หากคุณต้องการ flags แบบกำหนดเอง
  - ค่าที่ตรงกันจะถูก mask โดยเก็บ 6 ตัวแรก + 4 ตัวท้าย (ความยาว >= 18) มิฉะนั้นใช้ `***`
  - ค่าเริ่มต้นครอบคลุมการกำหนด key ทั่วไป, CLI flags, JSON fields, bearer headers, PEM blocks, token prefixes ยอดนิยม, และชื่อฟิลด์ credential การชำระเงิน เช่น หมายเลขบัตร, CVC/CVV, shared payment token, และ payment credential

ขอบเขตความปลอดภัยบางอย่างจะปกปิดข้อมูลเสมอไม่ว่า `logging.redactSensitive` จะเป็นค่าใด
ซึ่งรวมถึงเหตุการณ์ tool-call ของ Control UI, เอาต์พุตเครื่องมือ `sessions_history`,
diagnostics support exports, provider error observations, การแสดงคำสั่ง exec approval,
และล็อกโปรโตคอล Gateway WebSocket พื้นผิวเหล่านี้ยังอาจใช้
`logging.redactPatterns` เป็น pattern เพิ่มเติมได้ แต่ `redactSensitive: "off"`
จะไม่ทำให้พวกมันปล่อย secret ดิบออกมา

## ล็อก Gateway WebSocket

Gateway พิมพ์ล็อกโปรโตคอล WebSocket ในสองโหมด:

- **โหมดปกติ (ไม่มี `--verbose`)**: พิมพ์เฉพาะผลลัพธ์ RPC ที่ "น่าสนใจ":
  - ข้อผิดพลาด (`ok=false`)
  - การเรียกที่ช้า (threshold เริ่มต้น: `>= 50ms`)
  - ข้อผิดพลาดการ parse
- **โหมด Verbose (`--verbose`)**: พิมพ์ทราฟฟิก request/response ของ WS ทั้งหมด

### รูปแบบล็อก WS

`openclaw gateway` รองรับสวิตช์รูปแบบต่อ Gateway:

- `--ws-log auto` (ค่าเริ่มต้น): โหมดปกติถูกปรับให้เหมาะสม; โหมด verbose ใช้เอาต์พุตแบบ compact
- `--ws-log compact`: เอาต์พุตแบบ compact (request/response เป็นคู่) เมื่อ verbose
- `--ws-log full`: เอาต์พุตเต็มต่อ frame เมื่อ verbose
- `--compact`: alias สำหรับ `--ws-log compact`

ตัวอย่าง:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## การจัดรูปแบบคอนโซล (การบันทึกล็อกของ subsystem)

ตัวจัดรูปแบบคอนโซล **รับรู้ TTY** และพิมพ์บรรทัดที่มี prefix อย่างสม่ำเสมอ
Logger ของ subsystem ช่วยจัดกลุ่มเอาต์พุตและทำให้อ่านสแกนได้ง่าย

พฤติกรรม:

- **Prefix ของ subsystem** ในทุกบรรทัด (เช่น `[gateway]`, `[canvas]`, `[tailscale]`)
- **สีของ subsystem** (คงที่ต่อ subsystem) พร้อมการลงสีตามระดับ
- **ใช้สีเมื่อเอาต์พุตเป็น TTY หรือ environment ดูเหมือนเทอร์มินัลที่รองรับคุณสมบัติสูง** (`TERM`/`COLORTERM`/`TERM_PROGRAM`) และเคารพ `NO_COLOR`
- **Prefix ของ subsystem แบบย่อ**: ตัด `gateway/` + `channels/` ด้านหน้าออก เก็บ 2 segment ท้ายไว้ (เช่น `whatsapp/outbound`)
- **Sub-logger ตาม subsystem** (auto prefix + field แบบ structured `{ subsystem }`)
- **`logRaw()`** สำหรับเอาต์พุต QR/UX (ไม่มี prefix, ไม่มีการจัดรูปแบบ)
- **รูปแบบคอนโซล** (เช่น `pretty | compact | json`)
- **ระดับล็อกคอนโซล** แยกจากระดับล็อกไฟล์ (ไฟล์เก็บรายละเอียดเต็มเมื่อ `logging.level` ถูกตั้งเป็น `debug`/`trace`)
- **เนื้อหาข้อความ WhatsApp** ถูกบันทึกที่ `debug` (ใช้ `--verbose` เพื่อดู)

สิ่งนี้ทำให้ล็อกไฟล์เดิมคงที่ ขณะเดียวกันทำให้เอาต์พุตแบบโต้ตอบสแกนอ่านได้ง่าย

## ที่เกี่ยวข้อง

- [การบันทึกล็อก](/th/logging)
- [OpenTelemetry export](/th/gateway/opentelemetry)
- [Diagnostics export](/th/gateway/diagnostics)
