---
read_when:
    - การทำงานกับรีแอ็กชันในทุกช่องทาง
    - ทำความเข้าใจว่ารีแอ็กชันอีโมจิแตกต่างกันอย่างไรในแต่ละแพลตฟอร์ม
summary: ความหมายการทำงานของเครื่องมือแสดงปฏิกิริยาในทุกช่องทางที่รองรับ
title: การแสดงความรู้สึก
x-i18n:
    generated_at: "2026-05-03T21:39:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

ตัวแทนสามารถเพิ่มและลบรีแอ็กชันอีโมจิบนข้อความได้โดยใช้เครื่องมือ `message`
พร้อมแอ็กชัน `react` พฤติกรรมของรีแอ็กชันแตกต่างกันตามช่องทางและการขนส่ง

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
- ตั้งค่า `remove: true` เพื่อลบอีโมจิที่เฉพาะเจาะจง (ต้องมี `emoji` ที่ไม่ว่าง)
- ในช่องทางที่รองรับรีแอ็กชันสถานะ การตั้งค่า `trackToolCalls: true` บน
  รีแอ็กชันจะทำให้รันไทม์ใช้ข้อความที่ถูกรีแอ็กต์นั้นสำหรับรีแอ็กชันความคืบหน้าของเครื่องมือในภายหลัง
  ระหว่างเทิร์นเดียวกัน

## พฤติกรรมของช่องทาง

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - `emoji` ว่างจะลบรีแอ็กชันทั้งหมดของบอตบนข้อความ
    - `remove: true` จะลบเฉพาะอีโมจิที่ระบุ

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` ว่างจะลบรีแอ็กชันของแอปบนข้อความ
    - `remove: true` จะลบเฉพาะอีโมจิที่ระบุ

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` ว่างจะลบรีแอ็กชันของบอต
    - `remove: true` จะลบรีแอ็กชันเช่นกัน แต่ยังต้องมี `emoji` ที่ไม่ว่างเพื่อการตรวจสอบความถูกต้องของเครื่องมือ

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` ว่างจะลบรีแอ็กชันของบอต
    - `remove: true` จะถูกแมปเป็นอีโมจิว่างภายใน (ยังต้องระบุ `emoji` ในการเรียกใช้เครื่องมือ)

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - ต้องมี `emoji` ที่ไม่ว่าง
    - `remove: true` จะลบรีแอ็กชันอีโมจินั้นโดยเฉพาะ

  </Accordion>

  <Accordion title="Feishu/Lark">
    - ใช้เครื่องมือ `feishu_reaction` พร้อมแอ็กชัน `add`, `remove` และ `list`
    - การเพิ่ม/ลบต้องมี `emoji_type`; การลบต้องมี `reaction_id` ด้วย

  </Accordion>

  <Accordion title="Signal">
    - การแจ้งเตือนรีแอ็กชันขาเข้าถูกควบคุมโดย `channels.signal.reactionNotifications`: `"off"` จะปิดใช้งาน, `"own"` (ค่าเริ่มต้น) จะส่งเหตุการณ์เมื่อผู้ใช้รีแอ็กต์ต่อข้อความของบอต และ `"all"` จะส่งเหตุการณ์สำหรับรีแอ็กชันทั้งหมด

  </Accordion>
</AccordionGroup>

## ระดับรีแอ็กชัน

การกำหนดค่า `reactionLevel` รายช่องทางควบคุมว่าตัวแทนใช้รีแอ็กชันกว้างเพียงใด โดยทั่วไปค่าจะเป็น `off`, `ack`, `minimal` หรือ `extensive`

- [Telegram reactionLevel](/th/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/th/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

ตั้งค่า `reactionLevel` บนช่องทางแต่ละรายการเพื่อปรับว่าตัวแทนรีแอ็กต์ต่อข้อความบนแต่ละแพลตฟอร์มอย่างแข็งขันเพียงใด

## ที่เกี่ยวข้อง

- [Agent Send](/th/tools/agent-send) — เครื่องมือ `message` ที่รวม `react`
- [ช่องทาง](/th/channels) — การกำหนดค่าเฉพาะช่องทาง
