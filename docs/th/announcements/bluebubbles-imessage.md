---
read_when:
    - คุณเคยใช้ช่องทาง BlueBubbles แบบเก่าและต้องการย้ายไปใช้ iMessage
    - คุณกำลังเลือกการตั้งค่า iMessage ที่ OpenClaw รองรับ
    - คุณต้องการคำอธิบายสั้น ๆ เกี่ยวกับการนำ BlueBubbles ออก
summary: การรองรับ BlueBubbles ถูกนำออกจาก OpenClaw แล้ว สำหรับการตั้งค่า iMessage ใหม่และที่ย้ายมา ให้ใช้ Plugin iMessage ที่รวมมาพร้อมกับ imsg
title: การนำ BlueBubbles ออกและเส้นทาง iMessage ผ่าน imsg
x-i18n:
    generated_at: "2026-07-12T15:44:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# การนำ BlueBubbles ออกและเส้นทาง iMessage ผ่าน imsg

OpenClaw ไม่ได้จัดส่งช่องทาง BlueBubbles อีกต่อไป การรองรับ iMessage ทำงานผ่าน Plugin `imessage` ที่รวมมาให้ โดย Gateway จะเรียกใช้ [`imsg`](https://github.com/steipete/imsg) เป็นโพรเซสลูกในเครื่องหรือผ่านตัวห่อหุ้ม SSH และสื่อสารด้วย JSON-RPC ผ่าน stdin/stdout ไม่มีเซิร์ฟเวอร์ ไม่มี Webhook และไม่มีพอร์ต

หากการกำหนดค่าของคุณยังมี `channels.bluebubbles` ให้ย้ายไปใช้ `channels.imessage` URL เอกสารเดิม `/channels/bluebubbles` จะเปลี่ยนเส้นทางไปยัง [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) ซึ่งมีตารางแปลงการกำหนดค่าฉบับเต็มและรายการตรวจสอบสำหรับการสลับระบบ

## สิ่งที่เปลี่ยนแปลง

- เส้นทาง iMessage ที่รองรับไม่มีเซิร์ฟเวอร์ HTTP ของ BlueBubbles, เส้นทาง Webhook, รหัสผ่าน REST หรือรันไทม์ Plugin ของ BlueBubbles
- OpenClaw อ่านและเฝ้าติดตาม Messages ผ่าน `imsg` บน Mac ที่ลงชื่อเข้าใช้ Messages.app อยู่
- การส่ง การรับ ประวัติ และสื่อพื้นฐานใช้ส่วนเชื่อมต่อ `imsg` ตามปกติและสิทธิ์ของ macOS
- การดำเนินการขั้นสูง (การตอบกลับแบบเธรด, tapbacks, การแก้ไข, การยกเลิกส่ง, เอฟเฟกต์, การแจ้งว่าอ่านแล้ว, ตัวบ่งชี้การพิมพ์ และการจัดการกลุ่ม) ต้องใช้บริดจ์ API ส่วนตัว โดยเรียกใช้ `imsg launch` ซึ่งต้องปิดใช้งาน SIP
- Gateway บน Linux และ Windows ยังคงใช้ iMessage ได้โดยกำหนด `channels.imessage.cliPath` ให้ชี้ไปยังตัวห่อหุ้ม SSH ที่เรียกใช้ `imsg` บน Mac ที่ลงชื่อเข้าใช้อยู่

## สิ่งที่ต้องทำ

1. ติดตั้งและตรวจสอบ `imsg` บน Mac ที่ใช้ Messages:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. ให้สิทธิ์ Full Disk Access และ Automation แก่บริบทของโพรเซสที่เรียกใช้ `imsg` และ OpenClaw

3. แปลงการกำหนดค่าเดิม:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. รีสตาร์ต Gateway และตรวจสอบ:

   ```bash
   openclaw channels status --probe
   ```

5. ทดสอบข้อความส่วนตัว กลุ่ม ไฟล์แนบ และการดำเนินการผ่าน API ส่วนตัวที่คุณพึ่งพา ก่อนลบเซิร์ฟเวอร์ BlueBubbles เดิม

## หมายเหตุเกี่ยวกับการย้ายระบบ

- `channels.bluebubbles.serverUrl` และ `channels.bluebubbles.password` ไม่มีค่าที่เทียบเท่าใน iMessage เนื่องจากไม่มีเซิร์ฟเวอร์ให้เชื่อมต่อหรือยืนยันตัวตน
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` และ `actions.*` ยังคงมีความหมายเดิมภายใต้ `channels.imessage`
- `channels.imessage.includeAttachments` ยังคงปิดอยู่โดยค่าเริ่มต้น ให้ตั้งค่าอย่างชัดเจนหากคุณต้องการให้รูปภาพ บันทึกเสียง วิดีโอ หรือไฟล์ขาเข้าถึงเอเจนต์
- เมื่อใช้ `groupPolicy: "allowlist"` ให้คัดลอกบล็อก `groups` เดิม รวมถึงรายการไวลด์การ์ด `"*"` หากมี รายการอนุญาตผู้ส่งของกลุ่มและรีจิสทรีกลุ่มเป็นด่านตรวจสอบแยกกัน บล็อก `groups` ที่มีรายการแต่ไม่มี `chat_id` ที่ตรงกัน (หรือไม่มี `"*"`) จะทิ้งข้อความขณะรันไทม์ และบล็อก `groups` ที่ว่างจะบันทึกคำเตือนเมื่อเริ่มต้นระบบ แม้ว่าการกรองผู้ส่งจะยังคงปล่อยให้ข้อความผ่านก็ตาม
- การผูก ACP ที่ใช้ `match.channel: "bluebubbles"` ต้องเปลี่ยนเป็น `"imessage"`
- คีย์เซสชัน BlueBubbles เดิมจะไม่กลายเป็นคีย์เซสชัน iMessage การอนุมัติการจับคู่จะอิงตามตัวระบุผู้ส่ง ดังนั้นรายการ `allowFrom` ที่คัดลอกมาจะยังคงใช้งานได้ แต่ประวัติการสนทนาภายใต้คีย์เซสชัน BlueBubbles จะไม่ถูกย้ายตามมา

## ดูเพิ่มเติม

- [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles)
- [iMessage](/th/channels/imessage)
- [ข้อมูลอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
