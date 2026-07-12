---
read_when:
    - การทำงานกับรีแอ็กชันในทุกช่องทาง
    - ทำความเข้าใจความแตกต่างของรีแอ็กชันอีโมจิในแต่ละแพลตฟอร์ม
summary: ความหมายของเครื่องมือแสดงปฏิกิริยาในทุกช่องทางที่รองรับ
title: รีแอ็กชัน
x-i18n:
    generated_at: "2026-07-12T16:47:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

เอเจนต์เพิ่มและลบรีแอ็กชันอีโมจิด้วยแอ็กชัน `react` ของเครื่องมือ `message`
ลักษณะการทำงานแตกต่างกันไปตามช่องทาง

## วิธีการทำงาน

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- ต้องระบุ `emoji` เมื่อเพิ่มรีแอ็กชัน
- ตั้งค่า `emoji` เป็นสตริงว่าง (`""`) เพื่อลบรีแอ็กชันของบอตบน
  ช่องทางที่รองรับ
- ตั้งค่า `remove: true` เพื่อลบอีโมจิที่ระบุเพียงรายการเดียว (ต้องระบุ
  `emoji` ที่ไม่ใช่ค่าว่าง)
- บนช่องทางที่มีรีแอ็กชันแสดงสถานะ การตั้งค่า `trackToolCalls: true` ในรีแอ็กชันจะช่วยให้
  รันไทม์นำข้อความที่มีรีแอ็กชันนั้นกลับมาใช้สำหรับรีแอ็กชันแสดงความคืบหน้าของเครื่องมือ
  ในลำดับถัดไประหว่างเทิร์นเดียวกัน

## ลักษณะการทำงานตามช่องทาง

<AccordionGroup>
  <Accordion title="Discord และ Slack">
    - `emoji` ว่างจะลบรีแอ็กชันทั้งหมดของบอตออกจากข้อความ
    - `remove: true` จะลบเฉพาะอีโมจิที่ระบุ

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - เพิ่มรีแอ็กชันได้เท่านั้น: ต้องระบุ `emoji` และต้องไม่เป็นค่าว่าง
    - การลบรีแอ็กชันยังไม่ได้เชื่อมต่อกับคำสั่งลบ ดังนั้น `remove: true` จะถูกปฏิเสธพร้อมข้อผิดพลาดที่ชัดเจน แทนที่จะไม่ดำเนินการโดยไม่แจ้งให้ทราบ
    - ต้องลงทะเบียนบอต Talk พร้อมฟีเจอร์ `reaction` (ดู [เอกสารช่องทาง Nextcloud Talk](/th/channels/nextcloud-talk))

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` ว่างจะลบรีแอ็กชันของบอต
    - `remove: true` จะลบรีแอ็กชันเช่นกัน แต่การตรวจสอบความถูกต้องของเครื่องมือยังคงกำหนดให้ `emoji` ต้องไม่เป็นค่าว่าง

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` ว่างจะลบรีแอ็กชันของบอต
    - `remove: true` จะถูกแปลงเป็นอีโมจิว่างภายในระบบ (แต่ยังคงต้องระบุ `emoji` ในการเรียกใช้เครื่องมือ)
    - WhatsApp มีช่องสำหรับรีแอ็กชันของบอตหนึ่งช่องต่อข้อความ การส่งรีแอ็กชันใหม่จะแทนที่รีแอ็กชันเดิม แทนที่จะซ้อนอีโมจิหลายรายการ

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - ต้องระบุ `emoji` ที่ไม่ใช่ค่าว่างทั้งในการเพิ่มและลบ
    - `remove: true` จะลบรีแอ็กชันอีโมจิที่ระบุ

  </Accordion>

  <Accordion title="Feishu/Lark">
    - ใช้แอ็กชัน `react` เดียวกันกับช่องทางอื่น (เพิ่ม/ลบ/แสดงรายการผ่านรหัสรีแอ็กชันของข้อความ) ไม่ได้ใช้เครื่องมือแยกต่างหาก
    - การเพิ่มต้องระบุ `emoji` ที่ไม่ใช่ค่าว่าง (แปลงเป็น `emoji_type` ของ Feishu เช่น `SMILE`, `THUMBSUP`, `HEART`)
    - `remove: true` ต้องระบุ `emoji` ที่ไม่ใช่ค่าว่าง และจะลบรีแอ็กชันของบอตเองที่ตรงกับประเภทอีโมจินั้น
    - `emoji` ว่างร่วมกับ `clearAll: true` จะลบรีแอ็กชันทั้งหมดของบอตออกจากข้อความ

  </Accordion>

  <Accordion title="Signal">
    - การแจ้งเตือนรีแอ็กชันขาเข้าควบคุมด้วย `channels.signal.reactionNotifications`: `"off"` ปิดการแจ้งเตือน, `"own"` (ค่าเริ่มต้น) สร้างอีเวนต์เมื่อผู้ใช้แสดงรีแอ็กชันต่อข้อความของบอต, `"all"` สร้างอีเวนต์สำหรับรีแอ็กชันทั้งหมด และ `"allowlist"` สร้างอีเวนต์เฉพาะผู้ส่งที่อยู่ใน `channels.signal.reactionAllowlist`

  </Accordion>

  <Accordion title="iMessage">
    - รีแอ็กชันขาออกเป็น Tapback ของ iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` และ `question`); `emoji` ต้องแมปกับชนิดใดชนิดหนึ่งเหล่านี้เพื่อเพิ่มรีแอ็กชัน
    - `remove: true` ที่ไม่มีชนิด Tapback ที่ระบบรู้จักจะลบ Tapback ทุกชนิด แต่หากมีชนิดที่ระบบรู้จัก จะลบเฉพาะชนิดนั้น

  </Accordion>
</AccordionGroup>

## ระดับรีแอ็กชัน

`reactionLevel` ของแต่ละช่องทางจะจำกัดความถี่ที่เอเจนต์ส่ง
รีแอ็กชันของตนเอง ค่าได้แก่ `off`, `ack`, `minimal` หรือ `extensive`

- [การแจ้งเตือนรีแอ็กชันของ Telegram](/th/channels/telegram#feature-reference) - `channels.telegram.reactionLevel` (ค่าเริ่มต้น `minimal`)
- [ระดับรีแอ็กชันของ WhatsApp](/th/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel` (ค่าเริ่มต้น `minimal`)
- [รีแอ็กชันของ Signal](/th/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel` (ค่าเริ่มต้น `minimal`)

## เนื้อหาที่เกี่ยวข้อง

- [การส่งของเอเจนต์](/th/tools/agent-send) - เครื่องมือ `message` ที่มี `react`
- [ช่องทาง](/th/channels) - การกำหนดค่าเฉพาะช่องทาง
