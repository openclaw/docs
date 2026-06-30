---
read_when:
    - คุณต้องการปรับแต่งข้อมูลประจำตัว อุปกรณ์ หรือค่าเริ่มต้นของเอเจนต์แบบโต้ตอบ
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw configure` (พรอมป์การกำหนดค่าแบบโต้ตอบ)
title: กำหนดค่า
x-i18n:
    generated_at: "2026-06-30T22:38:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

พรอมต์แบบโต้ตอบสำหรับการเปลี่ยนแปลงเฉพาะจุดกับการตั้งค่าที่มีอยู่: ข้อมูลรับรอง อุปกรณ์ ค่าเริ่มต้นของเอเจนต์ Gateway ช่องทาง Plugin, Skills และการตรวจสอบสถานะ

ใช้ `openclaw onboard` หรือ `openclaw setup` สำหรับขั้นตอนเริ่มใช้งานครั้งแรกแบบมีคำแนะนำครบถ้วน, `openclaw setup --baseline` สำหรับ config/workspace พื้นฐานเท่านั้น และ `openclaw channels add` เมื่อคุณต้องตั้งค่าบัญชีช่องทางเท่านั้น

<Note>
ส่วน **โมเดล** มีตัวเลือกหลายรายการสำหรับรายการที่อนุญาต `agents.defaults.models` (สิ่งที่แสดงใน `/model` และตัวเลือกโมเดล) ตัวเลือกการตั้งค่าที่จำกัดตามผู้ให้บริการจะผสานโมเดลที่เลือกไว้เข้ากับรายการที่อนุญาตเดิม แทนที่จะแทนที่ผู้ให้บริการอื่นที่ไม่เกี่ยวข้องซึ่งมีอยู่แล้วใน config

การเรียกใช้การยืนยันตัวตนของผู้ให้บริการซ้ำจาก configure จะเก็บค่า `agents.defaults.model.primary` ที่มีอยู่ไว้ แม้ในกรณีที่ขั้นตอนยืนยันตัวตนของผู้ให้บริการส่งคืนแพตช์ config พร้อมโมเดลค่าเริ่มต้นที่แนะนำเอง นั่นหมายความว่าการเพิ่มหรือยืนยันตัวตน xAI, OpenRouter หรือผู้ให้บริการอื่นอีกครั้งควรทำให้โมเดลใหม่พร้อมใช้งานโดยไม่เข้ามาแทนที่โมเดลหลักปัจจุบันของคุณ ใช้ `openclaw models auth login --provider <id> --set-default` หรือ `openclaw models set <model>` เมื่อคุณต้องการเปลี่ยนโมเดลค่าเริ่มต้นโดยตั้งใจ
</Note>

เมื่อ configure เริ่มจากตัวเลือกการยืนยันตัวตนของผู้ให้บริการ ตัวเลือกโมเดลค่าเริ่มต้นและรายการที่อนุญาตจะเลือกผู้ให้บริการนั้นโดยอัตโนมัติ สำหรับผู้ให้บริการแบบจับคู่ เช่น Volcengine และ BytePlus การตั้งค่าเดียวกันยังจับคู่กับตัวแปร coding-plan ของผู้ให้บริการเหล่านั้นด้วย (`volcengine-plan/*`, `byteplus-plan/*`) หากตัวกรองผู้ให้บริการที่ต้องการทำให้ได้รายการว่าง configure จะย้อนกลับไปใช้แคตตาล็อกที่ไม่ถูกกรองแทนการแสดงตัวเลือกว่างเปล่า

<Tip>
`openclaw config` ที่ไม่มีคำสั่งย่อยจะเปิดวิซาร์ดเดียวกัน ใช้ `openclaw config get|set|unset` สำหรับการแก้ไขแบบไม่โต้ตอบ
</Tip>

สำหรับการค้นหาเว็บ `openclaw configure --section web` ให้คุณเลือกผู้ให้บริการ
และกำหนดค่าข้อมูลรับรองของผู้ให้บริการนั้น ผู้ให้บริการบางรายยังแสดงพรอมต์ติดตามผล
เฉพาะผู้ให้บริการด้วย:

- **Grok** สามารถเสนอการตั้งค่า `x_search` แบบไม่บังคับด้วยโปรไฟล์ xAI OAuth เดียวกัน
  หรือคีย์ API และให้คุณเลือกโมเดล `x_search`
- **Kimi** สามารถถามภูมิภาค API ของ Moonshot (`api.moonshot.ai` เทียบกับ
  `api.moonshot.cn`) และโมเดลค้นหาเว็บ Kimi ค่าเริ่มต้น

ที่เกี่ยวข้อง:

- ข้อมูลอ้างอิงการกำหนดค่า Gateway: [การกำหนดค่า](/th/gateway/configuration)
- CLI สำหรับ config: [Config](/th/cli/config)

## ตัวเลือก

- `--section <section>`: ตัวกรองส่วนที่ระบุซ้ำได้

ส่วนที่ใช้ได้:

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

- วิซาร์ดเต็มรูปแบบและส่วนที่เกี่ยวข้องกับ Gateway จะถามว่า Gateway ทำงานที่ใดและอัปเดต `gateway.mode` ตัวกรองส่วนที่ไม่มี `gateway`, `daemon` หรือ `health` จะไปยังการตั้งค่าที่ร้องขอโดยตรง
- หลังจากเขียน config ภายในเครื่อง configure จะติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งเลือกไว้เมื่อเส้นทางการตั้งค่าที่เลือกต้องใช้ Plugin เหล่านั้น config ของ Gateway ระยะไกลจะไม่ติดตั้งแพ็กเกจ Plugin ภายในเครื่อง
- บริการที่เน้นช่องทาง (Slack/Discord/Matrix/Microsoft Teams) จะแจ้งให้ระบุรายการช่องทาง/ห้องที่อนุญาตระหว่างการตั้งค่า คุณสามารถป้อนชื่อหรือ ID ได้ วิซาร์ดจะแปลงชื่อเป็น ID เมื่อทำได้
- หากคุณเรียกใช้ขั้นตอนติดตั้ง daemon การยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น และ `gateway.auth.token` ถูกจัดการโดย SecretRef, configure จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่าโทเค็นแบบข้อความธรรมดาที่ resolve แล้วลงใน metadata สภาพแวดล้อมของบริการ supervisor
- หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยังไม่ถูก resolve, configure จะบล็อกการติดตั้ง daemon พร้อมคำแนะนำการแก้ไขที่นำไปปฏิบัติได้
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แล้ว และไม่ได้ตั้งค่า `gateway.auth.mode`, configure จะบล็อกการติดตั้ง daemon จนกว่าจะตั้งค่า mode อย่างชัดเจน

## ตัวอย่าง

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การกำหนดค่า](/th/gateway/configuration)
