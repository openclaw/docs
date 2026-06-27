---
read_when:
    - การทำงานกับการแสดงความรู้สึกในทุกช่องทาง
    - ทำความเข้าใจว่ารีแอ็กชันอีโมจิแตกต่างกันอย่างไรในแต่ละแพลตฟอร์ม
summary: ความหมายของเครื่องมือแสดงปฏิกิริยาในทุกช่องทางที่รองรับ
title: การแสดงความรู้สึก
x-i18n:
    generated_at: "2026-06-27T18:30:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

เอเจนต์สามารถเพิ่มและลบรีแอ็กชันอีโมจิบนข้อความได้โดยใช้เครื่องมือ `message`
พร้อมแอ็กชัน `react` พฤติกรรมของรีแอ็กชันแตกต่างกันไปตามช่องทางและทรานสปอร์ต

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
- ตั้งค่า `remove: true` เพื่อลบอีโมจิที่ระบุ (ต้องมี `emoji` ที่ไม่ว่าง)
- ในช่องทางที่รองรับรีแอ็กชันสถานะ การตั้งค่า `trackToolCalls: true` บน
  รีแอ็กชันจะทำให้รันไทม์ใช้ข้อความที่มีรีแอ็กชันนั้นสำหรับรีแอ็กชันความคืบหน้า
  ของเครื่องมือถัดไปในเทิร์นเดียวกัน

## พฤติกรรมของช่องทาง

<AccordionGroup>
  <Accordion title="Discord และ Slack">
    - `emoji` ว่างจะลบรีแอ็กชันทั้งหมดของบอตบนข้อความ
    - `remove: true` จะลบเฉพาะอีโมจิที่ระบุ

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` ว่างจะลบรีแอ็กชันของแอปบนข้อความ
    - `remove: true` จะลบเฉพาะอีโมจิที่ระบุ

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - เพิ่มรีแอ็กชันเท่านั้น: ต้องระบุ `emoji` และต้องไม่ว่าง
    - ยังไม่รองรับการลบรีแอ็กชัน; การเรียกที่มี `remove: true` (หรือ `emoji` ว่าง) จะถูกปฏิเสธพร้อมข้อผิดพลาดที่ชัดเจน แทนที่จะไม่ทำอะไรแบบเงียบ ๆ
    - ต้องลงทะเบียนบอต Talk พร้อมฟีเจอร์ `reaction` (ดู [เอกสารช่องทาง Nextcloud Talk](/th/channels/nextcloud-talk))

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` ว่างจะลบรีแอ็กชันของบอต
    - `remove: true` จะลบรีแอ็กชันเช่นกัน แต่ยังต้องมี `emoji` ที่ไม่ว่างสำหรับการตรวจสอบเครื่องมือ

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` ว่างจะลบรีแอ็กชันของบอต
    - `remove: true` จะแมปเป็นอีโมจิว่างภายใน (ยังต้องระบุ `emoji` ในการเรียกเครื่องมือ)
    - WhatsApp มีช่องรีแอ็กชันของบอตหนึ่งช่องต่อข้อความ; การอัปเดตรีแอ็กชันสถานะจะแทนที่ช่องนั้น แทนที่จะซ้อนอีโมจิหลายรายการ

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - ต้องมี `emoji` ที่ไม่ว่าง
    - `remove: true` จะลบรีแอ็กชันอีโมจิที่ระบุนั้น

  </Accordion>

  <Accordion title="Feishu/Lark">
    - ใช้เครื่องมือ `feishu_reaction` พร้อมแอ็กชัน `add`, `remove` และ `list`
    - การเพิ่ม/ลบต้องใช้ `emoji_type`; การลบต้องใช้ `reaction_id` ด้วย

  </Accordion>

  <Accordion title="Signal">
    - การแจ้งเตือนรีแอ็กชันขาเข้าถูกควบคุมโดย `channels.signal.reactionNotifications`: `"off"` จะปิดใช้งาน, `"own"` (ค่าเริ่มต้น) จะปล่อยเหตุการณ์เมื่อผู้ใช้ตอบสนองต่อข้อความของบอต และ `"all"` จะปล่อยเหตุการณ์สำหรับรีแอ็กชันทั้งหมด

  </Accordion>

  <Accordion title="iMessage">
    - รีแอ็กชันขาออกคือ iMessage tapbacks (`love`, `like`, `dislike`, `laugh`, `emphasize` และ `question`)
    - การแจ้งเตือน tapback ขาเข้าถูกควบคุมโดย `channels.imessage.reactionNotifications`: `"off"` จะปิดใช้งาน, `"own"` (ค่าเริ่มต้น) จะปล่อยเหตุการณ์เมื่อผู้ใช้ตอบสนองต่อข้อความที่บอตเขียน และ `"all"` จะปล่อยเหตุการณ์สำหรับ tapback ทั้งหมดจากผู้ส่งที่ได้รับอนุญาต

  </Accordion>
</AccordionGroup>

## ระดับรีแอ็กชัน

การกำหนดค่า `reactionLevel` ต่อช่องทางควบคุมว่าเอเจนต์ใช้รีแอ็กชันอย่างกว้างขวางเพียงใด โดยทั่วไปค่าจะเป็น `off`, `ack`, `minimal` หรือ `extensive`

- [Telegram reactionLevel](/th/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/th/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

ตั้งค่า `reactionLevel` บนแต่ละช่องทางเพื่อปรับว่าเอเจนต์ตอบสนองต่อข้อความบนแต่ละแพลตฟอร์มอย่างแข็งขันเพียงใด

## ที่เกี่ยวข้อง

- [Agent Send](/th/tools/agent-send) — เครื่องมือ `message` ที่รวม `react`
- [ช่องทาง](/th/channels) — การกำหนดค่าเฉพาะช่องทาง
