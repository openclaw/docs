---
read_when:
    - คุณต้องใช้บันทึกดีบักแบบเจาะจงโดยไม่เพิ่มระดับการบันทึกโดยรวม
    - คุณจำเป็นต้องเก็บบันทึกเฉพาะระบบย่อยเพื่อใช้ในการสนับสนุน
summary: แฟล็กการวินิจฉัยสำหรับบันทึกการดีบักแบบเจาะจง
title: แฟล็กการวินิจฉัย
x-i18n:
    generated_at: "2026-06-27T17:31:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

แฟล็กการวินิจฉัยช่วยให้คุณเปิดใช้บันทึกดีบักแบบเจาะจงได้โดยไม่ต้องเปิดการบันทึกแบบละเอียดทั่วทั้งระบบ แฟล็กเป็นแบบ opt-in และจะไม่มีผล เว้นแต่ระบบย่อยจะตรวจสอบแฟล็กเหล่านั้น

## วิธีการทำงาน

- แฟล็กเป็นสตริง (ไม่สนใจตัวพิมพ์ใหญ่เล็ก)
- คุณสามารถเปิดใช้แฟล็กใน config หรือผ่านการ override ด้วย env ได้
- รองรับ wildcard:
  - `telegram.*` ตรงกับ `telegram.http`
  - `*` เปิดใช้แฟล็กทั้งหมด

## เปิดใช้ผ่าน config

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

หลายแฟล็ก:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

รีสตาร์ต Gateway หลังจากเปลี่ยนแฟล็ก

## Env override (ครั้งเดียว)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

ปิดใช้แฟล็กทั้งหมด:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` เป็นการ override เพื่อปิดใช้ในระดับโปรเซส: จะปิดใช้
แฟล็กจากทั้ง env และ config สำหรับโปรเซสนั้น

## แฟล็กการทำ profiling

แฟล็ก profiler เปิดใช้ span การจับเวลาแบบเจาะจงโดยไม่เพิ่มระดับการบันทึก
โดยรวม แฟล็กเหล่านี้ปิดอยู่ตามค่าเริ่มต้น

เปิดใช้ span ทั้งหมดที่มี profiler เป็น gate สำหรับการรัน Gateway หนึ่งครั้ง:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

เปิดใช้เฉพาะ span ของ profiler สำหรับการ dispatch การตอบกลับ:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

เปิดใช้เฉพาะ span ของ profiler สำหรับการเริ่มต้น app-server/tool/thread ของ Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

เปิดใช้แฟล็ก profiler จาก config:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

รีสตาร์ต Gateway หลังจากเปลี่ยนแฟล็กใน config หากต้องการปิดใช้แฟล็ก profiler
ให้ลบแฟล็กนั้นออกจาก `diagnostics.flags` แล้วรีสตาร์ต หากต้องการปิดใช้แฟล็ก
diagnostics ทุกตัวชั่วคราว แม้ config จะเปิดใช้แฟล็ก profiler อยู่ ให้เริ่มโปรเซสด้วย:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## อาร์ติแฟกต์ Timeline

แฟล็ก `timeline` จะเขียนเหตุการณ์การจับเวลาแบบมีโครงสร้างสำหรับการเริ่มต้นและรันไทม์
สำหรับ QA harness ภายนอก:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

คุณยังสามารถเปิดใช้ใน config ได้ด้วย:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

พาธไฟล์ timeline ยังคงมาจาก
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` เมื่อเปิดใช้ `timeline` จาก
config เท่านั้น span ของการโหลด config ช่วงแรกสุดจะไม่ถูกส่งออก เพราะ OpenClaw
ยังไม่ได้อ่าน config; span การเริ่มต้นถัดไปจะใช้แฟล็กจาก config

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` และ
`OPENCLAW_DIAGNOSTICS=*` จะเปิดใช้ timeline ด้วย เพราะค่าเหล่านี้เปิดใช้แฟล็ก
diagnostics ทุกตัว แนะนำให้ใช้ `timeline` เมื่อคุณต้องการเฉพาะอาร์ติแฟกต์การจับเวลา
JSONL เท่านั้น

เรคคอร์ด timeline ใช้ envelope `openclaw.diagnostics.v1` เหตุการณ์อาจมี
รหัสโปรเซส ชื่อเฟส ชื่อ span ระยะเวลา plugin ids จำนวน dependency
ตัวอย่างความล่าช้าของ event-loop ชื่อการดำเนินการของ provider สถานะออกของ child-process
และชื่อ/ข้อความข้อผิดพลาดตอนเริ่มต้น ให้ถือว่าไฟล์ timeline เป็นอาร์ติแฟกต์ diagnostics
ในเครื่อง ตรวจทานก่อนแชร์ออกนอกเครื่องของคุณ

## บันทึกไปที่ใด

แฟล็กจะส่งบันทึกไปยังไฟล์บันทึก diagnostics มาตรฐาน โดยค่าเริ่มต้น:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

หากคุณตั้งค่า `logging.file` ให้ใช้พาธนั้นแทน บันทึกเป็น JSONL (หนึ่ง JSON object ต่อบรรทัด) การปกปิดข้อมูลยังคงใช้ตาม `logging.redactSensitive`

## ดึงบันทึก

เลือกไฟล์บันทึกล่าสุด:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

กรอง diagnostics ของ Telegram HTTP:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

กรอง diagnostics ของ Brave Search HTTP:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

หรือ tail ระหว่างทำซ้ำปัญหา:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

สำหรับ Gateway ระยะไกล คุณยังสามารถใช้ `openclaw logs --follow` ได้ด้วย (ดู [/cli/logs](/th/cli/logs))

## หมายเหตุ

- หากตั้งค่า `logging.level` สูงกว่า `warn` บันทึกเหล่านี้อาจถูกระงับ ค่าเริ่มต้น `info` ใช้ได้
- `brave.http` บันทึก URL/พารามิเตอร์ query ของคำขอ Brave Search, สถานะ/เวลาตอบกลับ และเหตุการณ์ cache hit/miss/write โดยจะไม่บันทึก API keys หรือ response bodies แต่คำค้นหาอาจเป็นข้อมูลละเอียดอ่อนได้
- เปิดใช้แฟล็กทิ้งไว้ได้อย่างปลอดภัย แฟล็กจะมีผลเฉพาะกับปริมาณบันทึกของระบบย่อยนั้นเท่านั้น
- ใช้ [/logging](/th/logging) เพื่อเปลี่ยนปลายทาง ระดับ และการปกปิดข้อมูลของบันทึก

## ที่เกี่ยวข้อง

- [การวินิจฉัย Gateway](/th/gateway/diagnostics)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
