---
read_when:
- Working on reactions in any channel
- การทำความเข้าใจว่าการรีแอ็กด้วยอีโมจิแตกต่างกันอย่างไรในแต่ละแพลตฟอร์ม
summary: semantics ของเครื่องมือรีแอ็กชันข้ามทุกช่องทางที่รองรับ
title: รีแอ็กชัน
x-i18n:
  generated_at: '2026-04-24T09:38:16Z'
  model: gpt-5.4
  provider: openai
  source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
  source_path: tools/reactions.md
  workflow: 15
---

เอเจนต์สามารถเพิ่มและลบรีแอ็กชันอีโมจิบนข้อความได้โดยใช้เครื่องมือ `message`
ร่วมกับ action `react` พฤติกรรมของรีแอ็กชันจะแตกต่างกันไปตามแต่ละช่องทาง

## วิธีการทำงาน

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` จำเป็นเมื่อเพิ่มรีแอ็กชัน
- ตั้ง `emoji` เป็นสตริงว่าง (`""`) เพื่อลบรีแอ็กชันของบอต
- ตั้ง `remove: true` เพื่อลบอีโมจิที่ระบุ (ต้องใช้ `emoji` ที่ไม่ว่าง)

## พฤติกรรมตามช่องทาง

<AccordionGroup>
  <Accordion title="Discord และ Slack">
    - `emoji` ว่างจะลบรีแอ็กชันทั้งหมดของบอตบนข้อความนั้น
    - `remove: true` จะลบเฉพาะอีโมจิที่ระบุ
  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` ว่างจะลบรีแอ็กชันของแอปบนข้อความนั้น
    - `remove: true` จะลบเฉพาะอีโมจิที่ระบุ
  </Accordion>

  <Accordion title="Telegram">
    - `emoji` ว่างจะลบรีแอ็กชันของบอต
    - `remove: true` ก็ใช้ลบรีแอ็กชันเช่นกัน แต่ยังต้องใช้ `emoji` ที่ไม่ว่างสำหรับการตรวจสอบของเครื่องมือ
  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` ว่างจะลบรีแอ็กชันของบอต
    - `remove: true` จะถูกแมปภายในให้เป็นอีโมจิว่าง (แต่ยังต้องมี `emoji` ในการเรียกเครื่องมือ)
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - ต้องใช้ `emoji` ที่ไม่ว่าง
    - `remove: true` จะลบรีแอ็กชันของอีโมจินั้นโดยเฉพาะ
  </Accordion>

  <Accordion title="Feishu/Lark">
    - ใช้เครื่องมือ `feishu_reaction` พร้อม action `add`, `remove` และ `list`
    - การเพิ่ม/ลบต้องใช้ `emoji_type`; ส่วนการลบยังต้องใช้ `reaction_id` ด้วย
  </Accordion>

  <Accordion title="Signal">
    - การแจ้งเตือนรีแอ็กชันขาเข้าถูกควบคุมโดย `channels.signal.reactionNotifications`: `"off"` จะปิด, `"own"` (ค่าปริยาย) จะปล่อย event เมื่อผู้ใช้รีแอ็กกับข้อความของบอต และ `"all"` จะปล่อย event สำหรับรีแอ็กชันทั้งหมด
  </Accordion>
</AccordionGroup>

## ระดับรีแอ็กชัน

คอนฟิก `reactionLevel` รายช่องทางจะควบคุมว่าเอเจนต์ใช้รีแอ็กชันในวงกว้างแค่ไหน โดยค่าทั่วไปคือ `off`, `ack`, `minimal` หรือ `extensive`

- [Telegram reactionLevel](/th/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/th/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

ตั้ง `reactionLevel` บนแต่ละช่องทางเพื่อปรับว่าเอเจนต์จะรีแอ็กกับข้อความบนแต่ละแพลตฟอร์มอย่างกระตือรือร้นเพียงใด

## ที่เกี่ยวข้อง

- [Agent Send](/th/tools/agent-send) — เครื่องมือ `message` ที่รวม `react` ไว้
- [Channels](/th/channels) — การกำหนดค่าเฉพาะของแต่ละช่องทาง
