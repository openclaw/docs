---
read_when:
    - การเปลี่ยนเอาต์พุตหรือรูปแบบการบันทึกล็อก
    - การดีบักเอาต์พุต CLI หรือ Gateway
summary: จุดแสดงผลล็อก, ไฟล์ล็อก, รูปแบบล็อก WS และการจัดรูปแบบคอนโซล
title: การบันทึกล็อกของ Gateway
x-i18n:
    generated_at: "2026-05-06T10:30:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16bce5763754d13f855a46777b4c3cc7a7c966e35e0cd08a15f359fd22623bcb
    source_path: gateway/logging.md
    workflow: 16
---

# การบันทึกล็อก

สำหรับภาพรวมที่ผู้ใช้เห็น (CLI + Control UI + การตั้งค่า) โปรดดู [/logging](/th/logging)

OpenClaw มี “พื้นผิว” ล็อกสองแบบ:

- **เอาต์พุตคอนโซล** (สิ่งที่คุณเห็นในเทอร์มินัล / Debug UI)
- **ล็อกไฟล์** (บรรทัด JSON) ที่เขียนโดยตัวบันทึกล็อกของ Gateway

เมื่อเริ่มต้น Gateway จะบันทึกโมเดลเอเจนต์เริ่มต้นที่ resolve แล้ว พร้อมกับ
ค่าเริ่มต้นของโหมดที่มีผลต่อเซสชันใหม่ ตัวอย่างเช่น:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` มาจากเอเจนต์เริ่มต้น, พารามิเตอร์โมเดล หรือค่าเริ่มต้นเอเจนต์ส่วนกลาง;
เมื่อไม่ได้ตั้งค่า สรุปตอนเริ่มต้นจะแสดง `medium` `fast` มาจากเอเจนต์เริ่มต้น
หรือพารามิเตอร์ `fastMode` ของโมเดล

## ตัวบันทึกล็อกแบบไฟล์

- ไฟล์ล็อกแบบหมุนเวียนเริ่มต้นอยู่ใต้ `/tmp/openclaw/` (หนึ่งไฟล์ต่อวัน): `openclaw-YYYY-MM-DD.log`
  - วันที่ใช้เขตเวลาท้องถิ่นของโฮสต์ Gateway
- ไฟล์ล็อกที่ใช้งานอยู่จะ rotate ที่ `logging.maxFileBytes` (ค่าเริ่มต้น: 100 MB) โดยเก็บ
  ไฟล์ archive แบบมีหมายเลขไว้สูงสุดห้าไฟล์ และเขียนต่อไปยังไฟล์ active ใหม่
- เส้นทางไฟล์ล็อกและระดับสามารถตั้งค่าได้ผ่าน `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

รูปแบบไฟล์คือ JSON object หนึ่งรายการต่อหนึ่งบรรทัด

เส้นทางโค้ดของการคุย, เสียงแบบเรียลไทม์ และห้องที่จัดการอยู่ใช้ตัวบันทึกล็อกไฟล์ร่วมกันสำหรับ
ระเบียนวงจรชีวิตแบบมีขอบเขต ระเบียนเหล่านี้มีไว้สำหรับการดีบักเชิงปฏิบัติการ
และการส่งออกล็อก OTLP; ข้อความ transcript, payload เสียง, turn id, call id และ
provider item id จะไม่ถูกคัดลอกลงในระเบียนล็อก

แท็บ Logs ของ Control UI tail ไฟล์นี้ผ่าน Gateway (`logs.tail`)
CLI ทำแบบเดียวกันได้:

```bash
openclaw logs --follow
```

**Verbose เทียบกับระดับล็อก**

- **ล็อกไฟล์** ถูกควบคุมโดย `logging.level` เท่านั้น
- `--verbose` มีผลเฉพาะต่อ **ความละเอียดของคอนโซล** (และรูปแบบล็อก WS); ไม่ได้
  เพิ่มระดับล็อกไฟล์
- หากต้องการบันทึกรายละเอียดที่เห็นเฉพาะ verbose ลงในล็อกไฟล์ ให้ตั้ง `logging.level` เป็น `debug` หรือ
  `trace`
- การบันทึกล็อกระดับ trace ยังรวมสรุป timing เชิงวินิจฉัยสำหรับเส้นทางที่ร้อนบางส่วน
  เช่น การเตรียม factory เครื่องมือ Plugin โปรดดู
  [/tools/plugin#slow-plugin-tool-setup](/th/tools/plugin#slow-plugin-tool-setup)

## การจับคอนโซล

CLI จับ `console.log/info/warn/error/debug/trace` และเขียนลงในล็อกไฟล์
พร้อมกับยังคงพิมพ์ไปที่ stdout/stderr

คุณสามารถปรับความละเอียดของคอนโซลแยกต่างหากได้ผ่าน:

- `logging.consoleLevel` (ค่าเริ่มต้น `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## การปกปิดข้อมูล

OpenClaw สามารถ mask token ที่อ่อนไหวก่อนที่เอาต์พุตล็อกหรือ transcript จะออกจาก
process ได้ นโยบายการปกปิดข้อมูลของการบันทึกล็อกนี้ถูกใช้กับ console, file-log, ระเบียนล็อก OTLP
และปลายทางข้อความ transcript ของเซสชัน ดังนั้นค่าความลับที่ตรงกันจะถูก
mask ก่อนที่บรรทัด JSONL หรือข้อความจะถูกเขียนลงดิสก์

- `logging.redactSensitive`: `off` | `tools` (ค่าเริ่มต้น: `tools`)
- `logging.redactPatterns`: array ของสตริง regex (แทนที่ค่าเริ่มต้น)
  - ใช้สตริง regex แบบดิบ (auto `gi`) หรือ `/pattern/flags` หากคุณต้องใช้ flags แบบกำหนดเอง
  - รายการที่ match จะถูก mask โดยเก็บ 6 ตัวแรก + 4 ตัวท้าย (ความยาว >= 18) มิฉะนั้นใช้ `***`
  - ค่าเริ่มต้นครอบคลุมการกำหนด key ทั่วไป, CLI flags, ฟิลด์ JSON, bearer headers, PEM blocks, คำนำหน้า token ที่นิยมใช้ และชื่อฟิลด์ข้อมูลรับรองการชำระเงิน เช่น หมายเลขบัตร, CVC/CVV, token การชำระเงินที่ใช้ร่วมกัน และข้อมูลรับรองการชำระเงิน

ขอบเขตความปลอดภัยบางส่วนจะปกปิดข้อมูลเสมอโดยไม่ขึ้นกับ `logging.redactSensitive`
ซึ่งรวมถึงอีเวนต์ tool-call ของ Control UI, เอาต์พุตเครื่องมือ `sessions_history`,
การส่งออกการสนับสนุนเชิงวินิจฉัย, การสังเกตข้อผิดพลาดของ provider, การแสดงคำสั่งอนุมัติ exec
และล็อกโปรโตคอล WebSocket ของ Gateway พื้นผิวเหล่านี้อาจยังใช้
`logging.redactPatterns` เป็น patterns เพิ่มเติมได้ แต่ `redactSensitive: "off"`
ไม่ได้ทำให้มันปล่อย secret แบบดิบออกมา

## ล็อก WebSocket ของ Gateway

Gateway พิมพ์ล็อกโปรโตคอล WebSocket ในสองโหมด:

- **โหมดปกติ (ไม่มี `--verbose`)**: พิมพ์เฉพาะผลลัพธ์ RPC ที่ “น่าสนใจ”:
  - ข้อผิดพลาด (`ok=false`)
  - การเรียกที่ช้า (เกณฑ์เริ่มต้น: `>= 50ms`)
  - ข้อผิดพลาดการ parse
- **โหมด verbose (`--verbose`)**: พิมพ์ทราฟฟิกคำขอ/คำตอบ WS ทั้งหมด

### รูปแบบล็อก WS

`openclaw gateway` รองรับสวิตช์รูปแบบต่อ Gateway:

- `--ws-log auto` (ค่าเริ่มต้น): โหมดปกติถูกปรับให้เหมาะสม; โหมด verbose ใช้เอาต์พุตแบบ compact
- `--ws-log compact`: เอาต์พุตแบบ compact (จับคู่คำขอ/คำตอบ) เมื่อ verbose
- `--ws-log full`: เอาต์พุตเต็มแบบต่อ frame เมื่อ verbose
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

ตัวจัดรูปแบบคอนโซล **รับรู้ TTY** และพิมพ์บรรทัดที่สม่ำเสมอพร้อม prefix
ตัวบันทึกล็อกของ subsystem ช่วยให้เอาต์พุตถูกจัดกลุ่มและอ่านกวาดตาได้ง่าย

พฤติกรรม:

- **prefix ของ subsystem** ในทุกบรรทัด (เช่น `[gateway]`, `[canvas]`, `[tailscale]`)
- **สีของ subsystem** (คงที่ต่อ subsystem) พร้อมการลงสีระดับ
- **ใช้สีเมื่อเอาต์พุตเป็น TTY หรือ environment ดูเหมือนเทอร์มินัลที่รองรับความสามารถสูง** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), เคารพ `NO_COLOR`
- **prefix ของ subsystem แบบย่อ**: ตัด `gateway/` + `channels/` นำหน้าออก, เก็บ 2 segment สุดท้ายไว้ (เช่น `whatsapp/outbound`)
- **sub-loggers ตาม subsystem** (prefix อัตโนมัติ + ฟิลด์แบบมีโครงสร้าง `{ subsystem }`)
- **`logRaw()`** สำหรับเอาต์พุต QR/UX (ไม่มี prefix, ไม่มีการจัดรูปแบบ)
- **รูปแบบคอนโซล** (เช่น `pretty | compact | json`)
- **ระดับล็อกคอนโซล** แยกจากระดับล็อกไฟล์ (ไฟล์เก็บรายละเอียดเต็มเมื่อ `logging.level` ถูกตั้งเป็น `debug`/`trace`)
- **เนื้อหาข้อความ WhatsApp** ถูกบันทึกที่ `debug` (ใช้ `--verbose` เพื่อดู)

สิ่งนี้ทำให้ล็อกไฟล์เดิมคงที่ ขณะทำให้เอาต์พุตแบบโต้ตอบอ่านกวาดตาได้ง่าย

## ที่เกี่ยวข้อง

- [การบันทึกล็อก](/th/logging)
- [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics)
