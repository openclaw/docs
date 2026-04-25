---
read_when:
    - คุณต้องการปรับแต่งข้อมูลรับรอง อุปกรณ์ หรือค่าเริ่มต้นของ Agent แบบโต้ตอบ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw configure` (พรอมป์การกำหนดค่าแบบโต้ตอบ)
title: Configure
x-i18n:
    generated_at: "2026-04-25T13:43:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

พรอมป์แบบโต้ตอบสำหรับตั้งค่าข้อมูลรับรอง อุปกรณ์ และค่าเริ่มต้นของ Agent

หมายเหตุ: ตอนนี้ส่วน **Model** มีการเลือกหลายรายการสำหรับ allowlist ของ
`agents.defaults.models` (สิ่งที่จะแสดงใน `/model` และตัวเลือกโมเดล)
ตัวเลือกการตั้งค่าระดับผู้ให้บริการจะรวมโมเดลที่เลือกเข้าไปใน allowlist ที่มีอยู่
แทนที่จะไปแทนที่ผู้ให้บริการอื่นที่ไม่เกี่ยวข้องซึ่งมีอยู่แล้วในการกำหนดค่า
การรันการยืนยันตัวตนของผู้ให้บริการซ้ำจาก configure จะคงค่า
`agents.defaults.model.primary` ที่มีอยู่ไว้; ใช้ `openclaw models auth login --provider <id> --set-default`
หรือ `openclaw models set <model>` เมื่อคุณตั้งใจจะเปลี่ยนโมเดลเริ่มต้น

เมื่อเริ่ม configure จากตัวเลือกการยืนยันตัวตนของผู้ให้บริการ ตัวเลือกโมเดลเริ่มต้นและ
allowlist จะให้ความสำคัญกับผู้ให้บริการนั้นโดยอัตโนมัติ สำหรับผู้ให้บริการที่เป็นคู่กัน เช่น
Volcengine/BytePlus การตั้งค่านี้ยังจะตรงกับตัวแปร coding-plan ของพวกมันด้วย
(`volcengine-plan/*`, `byteplus-plan/*`) หากตัวกรอง preferred-provider
ทำให้รายการว่าง configure จะ fallback ไปใช้ catalog ที่ไม่กรอง
แทนที่จะแสดงตัวเลือกว่างเปล่า

เคล็ดลับ: `openclaw config` โดยไม่มีคำสั่งย่อยจะเปิดวิซาร์ดเดียวกัน ใช้
`openclaw config get|set|unset` สำหรับการแก้ไขแบบไม่โต้ตอบ

สำหรับการค้นหาเว็บ `openclaw configure --section web` ให้คุณเลือกผู้ให้บริการ
และกำหนดค่าข้อมูลรับรองของผู้ให้บริการนั้น ผู้ให้บริการบางรายยังมีพรอมป์ติดตามเฉพาะผู้ให้บริการด้วย:

- **Grok** อาจมีตัวเลือกการตั้งค่า `x_search` แบบไม่บังคับโดยใช้ `XAI_API_KEY` เดียวกัน และ
  ให้คุณเลือกโมเดล `x_search`
- **Kimi** อาจถาม region ของ Moonshot API (`api.moonshot.ai` เทียบกับ
  `api.moonshot.cn`) และโมเดลค้นหาเว็บ Kimi เริ่มต้น

ที่เกี่ยวข้อง:

- เอกสารอ้างอิงการกำหนดค่า Gateway: [Configuration](/th/gateway/configuration)
- CLI ของ Config: [Config](/th/cli/config)

## ตัวเลือก

- `--section <section>`: ตัวกรอง section ที่ใช้ซ้ำได้

section ที่ใช้ได้:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

หมายเหตุ:

- การเลือกตำแหน่งที่ Gateway จะทำงานจะอัปเดต `gateway.mode` เสมอ คุณสามารถเลือก "Continue" โดยไม่เลือก section อื่นได้ หากต้องการเพียงเท่านั้น
- บริการที่เน้นช่องทาง (Slack/Discord/Matrix/Microsoft Teams) จะถาม allowlist ของ channel/room ระหว่างการตั้งค่า คุณสามารถป้อนชื่อหรือ ID ได้; วิซาร์ดจะ resolve ชื่อเป็น ID เมื่อทำได้
- หากคุณรันขั้นตอนติดตั้ง daemon การยืนยันตัวตนด้วยโทเค็นจะต้องมีโทเค็น และ `gateway.auth.token` ถูกจัดการด้วย SecretRef โดย configure จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่าโทเค็นข้อความล้วนที่ resolve แล้วลงใน metadata ของ environment สำหรับบริการ supervisor
- หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น และ SecretRef ของโทเค็นที่กำหนดค่าไว้ยัง resolve ไม่ได้ configure จะบล็อกการติดตั้ง daemon พร้อมคำแนะนำในการแก้ไขที่นำไปใช้ได้จริง
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` configure จะบล็อกการติดตั้ง daemon จนกว่าจะตั้งค่า mode อย่างชัดเจน

## ตัวอย่าง

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Configuration](/th/gateway/configuration)
