---
read_when:
    - คุณต้องใช้ล็อกดีบักแบบเจาะจง โดยไม่เพิ่มระดับการบันทึกล็อกทั่วทั้งระบบ
    - คุณต้องเก็บบันทึกล็อกเฉพาะระบบย่อยเพื่อส่งให้ฝ่ายสนับสนุน
summary: แฟล็กการวินิจฉัยสำหรับบันทึกการดีบักแบบเจาะจง
title: แฟล็กการวินิจฉัย
x-i18n:
    generated_at: "2026-04-30T09:49:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

แฟล็กการวินิจฉัยช่วยให้คุณเปิดใช้บันทึกดีบักเฉพาะจุดได้โดยไม่ต้องเปิดการบันทึกแบบละเอียดทุกที่ แฟล็กเป็นแบบเลือกใช้ และจะไม่มีผลเว้นแต่ระบบย่อยจะตรวจสอบแฟล็กเหล่านั้น

## วิธีการทำงาน

- แฟล็กเป็นสตริง (ไม่คำนึงถึงตัวพิมพ์ใหญ่-เล็ก)
- คุณสามารถเปิดใช้แฟล็กใน config หรือผ่านการแทนที่ด้วย env ได้
- รองรับไวลด์การ์ด:
  - `telegram.*` ตรงกับ `telegram.http`
  - `*` เปิดใช้ทุกแฟล็ก

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
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

รีสตาร์ต gateway หลังจากเปลี่ยนแฟล็ก

## การแทนที่ด้วย env (ครั้งเดียว)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

ปิดใช้ทุกแฟล็ก:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## อาร์ติแฟกต์ไทม์ไลน์

แฟล็ก `timeline` จะเขียนเหตุการณ์เวลาเริ่มต้นและรันไทม์แบบมีโครงสร้างสำหรับ
ชุดทดสอบ QA ภายนอก:

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

พาธไฟล์ไทม์ไลน์ยังคงมาจาก
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` เมื่อเปิดใช้ `timeline` จาก
config เท่านั้น ช่วงการโหลด config ที่เร็วที่สุดจะไม่ถูกปล่อยออกมา เพราะ OpenClaw ยัง
ไม่ได้อ่าน config; ช่วงการเริ่มต้นถัดมาจะใช้แฟล็กจาก config

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` และ
`OPENCLAW_DIAGNOSTICS=*` จะเปิดใช้ไทม์ไลน์ด้วย เพราะค่าเหล่านี้เปิดใช้ทุก
แฟล็กการวินิจฉัย ควรใช้ `timeline` เมื่อคุณต้องการเฉพาะอาร์ติแฟกต์เวลา
JSONL

เรคคอร์ดไทม์ไลน์ใช้เอนเวโลป `openclaw.diagnostics.v1` เหตุการณ์อาจรวมถึง
รหัสโปรเซส ชื่อเฟส ชื่อช่วง ระยะเวลา รหัส Plugin จำนวน dependency
ตัวอย่างความหน่วงของ event loop ชื่อการทำงานของ provider สถานะการออกของ child process
และชื่อ/ข้อความข้อผิดพลาดระหว่างเริ่มต้น ให้ถือว่าไฟล์ไทม์ไลน์เป็นอาร์ติแฟกต์การวินิจฉัย
ในเครื่อง; ตรวจสอบก่อนแชร์ออกนอกเครื่องของคุณ

## ตำแหน่งของบันทึก

แฟล็กจะปล่อยบันทึกไปยังไฟล์บันทึกการวินิจฉัยมาตรฐาน โดยค่าเริ่มต้น:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

หากคุณตั้งค่า `logging.file` ให้ใช้พาธนั้นแทน บันทึกเป็น JSONL (หนึ่งออบเจ็กต์ JSON ต่อบรรทัด) การปกปิดข้อมูลยังคงใช้ตาม `logging.redactSensitive`

## แยกบันทึกออกมา

เลือกไฟล์บันทึกล่าสุด:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

กรองการวินิจฉัย HTTP ของ Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

หรือ tail ระหว่างทำซ้ำปัญหา:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

สำหรับ gateway ระยะไกล คุณยังสามารถใช้ `openclaw logs --follow` ได้ (ดู [/cli/logs](/th/cli/logs))

## หมายเหตุ

- หาก `logging.level` ถูกตั้งสูงกว่า `warn` บันทึกเหล่านี้อาจถูกระงับ ค่าเริ่มต้น `info` ใช้ได้ดี
- ปล่อยให้แฟล็กเปิดไว้ได้อย่างปลอดภัย; แฟล็กมีผลต่อปริมาณบันทึกของระบบย่อยที่ระบุเท่านั้น
- ใช้ [/logging](/th/logging) เพื่อเปลี่ยนปลายทาง ระดับ และการปกปิดข้อมูลของบันทึก

## ที่เกี่ยวข้อง

- [การวินิจฉัย Gateway](/th/gateway/diagnostics)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
