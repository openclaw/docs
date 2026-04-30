---
read_when:
    - การทำงานกับรีแอ็กชันในทุกช่องทาง
    - ทำความเข้าใจว่ารีแอ็กชันอีโมจิแตกต่างกันอย่างไรในแต่ละแพลตฟอร์ม
summary: ความหมายเชิงพฤติกรรมของเครื่องมือแสดงปฏิกิริยาในทุกช่องทางที่รองรับ
title: ปฏิกิริยา
x-i18n:
    generated_at: "2026-04-30T10:21:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

เอเจนต์สามารถเพิ่มและลบรีแอ็กชันอีโมจิบนข้อความได้โดยใช้เครื่องมือ `message`
พร้อมแอ็กชัน `react` พฤติกรรมของรีแอ็กชันจะแตกต่างกันไปตามช่องทางและการส่งผ่านข้อมูล

## วิธีการทำงาน

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- ต้องระบุ `emoji` เมื่อเพิ่มรีแอ็กชัน
- ตั้งค่า `emoji` เป็นสตริงว่าง (`""`) เพื่อลบรีแอ็กชันของบอต
- ตั้งค่า `remove: true` เพื่อลบอีโมจิที่ระบุ (ต้องใช้ `emoji` ที่ไม่ว่าง)

## พฤติกรรมตามช่องทาง

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - `emoji` ที่ว่างจะลบรีแอ็กชันทั้งหมดของบอตบนข้อความ
    - `remove: true` จะลบเฉพาะอีโมจิที่ระบุ

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` ที่ว่างจะลบรีแอ็กชันของแอปบนข้อความ
    - `remove: true` จะลบเฉพาะอีโมจิที่ระบุ

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` ที่ว่างจะลบรีแอ็กชันของบอต
    - `remove: true` จะลบรีแอ็กชันเช่นกัน แต่ยังต้องใช้ `emoji` ที่ไม่ว่างเพื่อให้ผ่านการตรวจสอบความถูกต้องของเครื่องมือ

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` ที่ว่างจะลบรีแอ็กชันของบอต
    - `remove: true` จะถูกแมปเป็นอีโมจิว่างภายใน (ยังต้องระบุ `emoji` ในการเรียกเครื่องมือ)

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - ต้องใช้ `emoji` ที่ไม่ว่าง
    - `remove: true` จะลบรีแอ็กชันอีโมจินั้นโดยเฉพาะ

  </Accordion>

  <Accordion title="Feishu/Lark">
    - ใช้เครื่องมือ `feishu_reaction` พร้อมแอ็กชัน `add`, `remove` และ `list`
    - การเพิ่ม/ลบต้องใช้ `emoji_type`; การลบยังต้องใช้ `reaction_id` ด้วย

  </Accordion>

  <Accordion title="Signal">
    - การแจ้งเตือนรีแอ็กชันขาเข้าถูกควบคุมโดย `channels.signal.reactionNotifications`: `"off"` จะปิดใช้งาน, `"own"` (ค่าเริ่มต้น) จะส่งอีเวนต์เมื่อผู้ใช้รีแอ็กชันต่อข้อความของบอต และ `"all"` จะส่งอีเวนต์สำหรับรีแอ็กชันทั้งหมด

  </Accordion>
</AccordionGroup>

## ระดับรีแอ็กชัน

การตั้งค่า `reactionLevel` รายช่องทางควบคุมว่าเอเจนต์ใช้รีแอ็กชันกว้างเพียงใด โดยทั่วไปค่าจะเป็น `off`, `ack`, `minimal` หรือ `extensive`

- [Telegram reactionLevel](/th/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/th/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

ตั้งค่า `reactionLevel` ในแต่ละช่องทางเพื่อปรับว่าเอเจนต์จะรีแอ็กชันต่อข้อความบนแต่ละแพลตฟอร์มอย่างกระตือรือร้นเพียงใด

## ที่เกี่ยวข้อง

- [Agent Send](/th/tools/agent-send) — เครื่องมือ `message` ที่มี `react`
- [Channels](/th/channels) — การตั้งค่าเฉพาะช่องทาง
