---
read_when:
    - การเปลี่ยนกฎสำหรับข้อความในกลุ่มหรือการกล่าวถึง
summary: พฤติกรรมและการกำหนดค่าสำหรับการจัดการข้อความกลุ่ม WhatsApp (mentionPatterns ใช้ร่วมกันข้ามพื้นผิวการใช้งาน)
title: ข้อความกลุ่ม
x-i18n:
    generated_at: "2026-04-30T09:36:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

เป้าหมาย: ให้ Clawd อยู่ในกลุ่ม WhatsApp, ตื่นขึ้นเฉพาะเมื่อถูกเรียก, และแยกเธรดนั้นออกจากเซสชัน DM ส่วนตัว

<Note>
`agents.list[].groupChat.mentionPatterns` ยังใช้โดย Telegram, Discord, Slack, และ iMessage ด้วย เอกสารนี้เน้นพฤติกรรมเฉพาะของ WhatsApp สำหรับการตั้งค่าหลายเอเจนต์ ให้ตั้งค่า `agents.list[].groupChat.mentionPatterns` ต่อเอเจนต์ หรือใช้ `messages.groupChat.mentionPatterns` เป็นค่าสำรองส่วนกลาง
</Note>

## การใช้งานปัจจุบัน (2025-12-03)

- โหมดการเปิดใช้งาน: `mention` (ค่าเริ่มต้น) หรือ `always` `mention` ต้องมีการเรียก (WhatsApp @-mentions จริงผ่าน `mentionedJids`, รูปแบบ regex ที่ปลอดภัย, หรือ E.164 ของบอตที่อยู่ส่วนใดก็ได้ในข้อความ) `always` จะปลุกเอเจนต์ในทุกข้อความ แต่ควรตอบเฉพาะเมื่อสามารถเพิ่มคุณค่าได้อย่างมีความหมาย มิฉะนั้นจะส่งคืนโทเค็นเงียบแบบตรงตัว `NO_REPLY` / `no_reply` สามารถตั้งค่าเริ่มต้นใน config (`channels.whatsapp.groups`) และ override รายกลุ่มผ่าน `/activation` ได้ เมื่อกำหนด `channels.whatsapp.groups` แล้ว ค่านี้ยังทำหน้าที่เป็น allowlist ของกลุ่มด้วย (ใส่ `"*"` เพื่ออนุญาตทั้งหมด)
- นโยบายกลุ่ม: `channels.whatsapp.groupPolicy` ควบคุมว่าจะรับข้อความกลุ่มหรือไม่ (`open|disabled|allowlist`) `allowlist` ใช้ `channels.whatsapp.groupAllowFrom` (ค่าสำรอง: `channels.whatsapp.allowFrom` ที่ระบุไว้ชัดเจน) ค่าเริ่มต้นคือ `allowlist` (ถูกบล็อกจนกว่าคุณจะเพิ่มผู้ส่ง)
- เซสชันรายกลุ่ม: คีย์เซสชันมีลักษณะเป็น `agent:<agentId>:whatsapp:group:<jid>` ดังนั้นคำสั่งอย่าง `/verbose on`, `/trace on`, หรือ `/think high` (ส่งเป็นข้อความเดี่ยว) จะถูกจำกัดขอบเขตไว้ที่กลุ่มนั้น สถานะ DM ส่วนตัวจะไม่ถูกแตะต้อง Heartbeat จะถูกข้ามสำหรับเธรดกลุ่ม
- การแทรกบริบท: ข้อความกลุ่มแบบ **pending-only** (ค่าเริ่มต้น 50) ที่ _ไม่ได้_ ทริกเกอร์การรัน จะถูกเติมคำนำหน้าไว้ใต้ `[Chat messages since your last reply - for context]` โดยบรรทัดที่ทริกเกอร์อยู่ใต้ `[Current message - respond to this]` ข้อความที่มีอยู่แล้วในเซสชันจะไม่ถูกแทรกซ้ำ
- การแสดงผู้ส่ง: ทุก batch ของกลุ่มตอนนี้จบด้วย `[from: Sender Name (+E164)]` เพื่อให้ Pi รู้ว่าใครกำลังพูด
- ชั่วคราว/ดูครั้งเดียว: เราแกะข้อมูลเหล่านั้นก่อนดึงข้อความ/การกล่าวถึง ดังนั้นการเรียกที่อยู่ข้างในยังคงทริกเกอร์ได้
- พรอมป์ระบบของกลุ่ม: ใน turn แรกของเซสชันกลุ่ม (และเมื่อใดก็ตามที่ `/activation` เปลี่ยนโหมด) เราจะแทรกข้อความสั้น ๆ ลงในพรอมป์ระบบ เช่น `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` หากไม่มี metadata เราจะยังบอกเอเจนต์ว่าเป็นแชตกลุ่ม

## ตัวอย่าง config (WhatsApp)

เพิ่มบล็อก `groupChat` ลงใน `~/.openclaw/openclaw.json` เพื่อให้การเรียกด้วยชื่อที่แสดงทำงานได้ แม้ WhatsApp จะตัด `@` ที่มองเห็นได้ออกจากเนื้อความ:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

หมายเหตุ:

- regex ไม่สนใจตัวพิมพ์เล็กใหญ่ และใช้ guardrails แบบ safe-regex เดียวกับพื้นผิว regex config อื่น ๆ รูปแบบที่ไม่ถูกต้องและการทำซ้ำซ้อนแบบไม่ปลอดภัยจะถูกละเว้น
- WhatsApp ยังคงส่งการกล่าวถึงแบบ canonical ผ่าน `mentionedJids` เมื่อมีคนแตะรายชื่อติดต่อ ดังนั้นค่าสำรองด้วยหมายเลขจึงแทบไม่จำเป็น แต่เป็นตาข่ายนิรภัยที่มีประโยชน์

### คำสั่งเปิดใช้งาน (เฉพาะเจ้าของ)

ใช้คำสั่งแชตกลุ่ม:

- `/activation mention`
- `/activation always`

เฉพาะหมายเลขของเจ้าของ (จาก `channels.whatsapp.allowFrom`, หรือ E.164 ของบอตเองเมื่อไม่ได้ตั้งค่า) เท่านั้นที่เปลี่ยนค่านี้ได้ ส่ง `/status` เป็นข้อความเดี่ยวในกลุ่มเพื่อดูโหมดการเปิดใช้งานปัจจุบัน

## วิธีใช้

1. เพิ่มบัญชี WhatsApp ของคุณ (บัญชีที่รัน OpenClaw) เข้าไปในกลุ่ม
2. พิมพ์ `@openclaw …` (หรือใส่หมายเลข) เฉพาะผู้ส่งใน allowlist เท่านั้นที่ทริกเกอร์ได้ เว้นแต่คุณจะตั้งค่า `groupPolicy: "open"`
3. พรอมป์ของเอเจนต์จะรวมบริบทกลุ่มล่าสุดพร้อม marker ต่อท้าย `[from: …]` เพื่อให้ตอบถึงคนที่ถูกต้องได้
4. คำสั่งระดับเซสชัน (`/verbose on`, `/trace on`, `/think high`, `/new` หรือ `/reset`, `/compact`) ใช้กับเซสชันของกลุ่มนั้นเท่านั้น ส่งคำสั่งเหล่านี้เป็นข้อความเดี่ยวเพื่อให้ลงทะเบียน เซสชัน DM ส่วนตัวของคุณยังคงแยกอิสระ

## การทดสอบ / การตรวจสอบ

- การทดสอบ smoke แบบแมนนวล:
  - ส่งการเรียก `@openclaw` ในกลุ่ม และยืนยันว่ามีคำตอบที่อ้างถึงชื่อผู้ส่ง
  - ส่งการเรียกครั้งที่สอง และตรวจสอบว่ามีการรวมบล็อกประวัติ จากนั้นถูกล้างใน turn ถัดไป
- ตรวจสอบ log ของ Gateway (รันด้วย `--verbose`) เพื่อดูรายการ `inbound web message` ที่แสดง `from: <groupJid>` และ suffix `[from: …]`

## ข้อควรพิจารณาที่ทราบ

- Heartbeat ถูกข้ามสำหรับกลุ่มโดยเจตนาเพื่อหลีกเลี่ยงการกระจายข้อความที่รบกวน
- การกด echo ใช้สตริง batch ที่รวมกัน หากคุณส่งข้อความเหมือนกันสองครั้งโดยไม่มีการกล่าวถึง เฉพาะครั้งแรกเท่านั้นที่จะได้รับการตอบกลับ
- รายการใน session store จะปรากฏเป็น `agent:<agentId>:whatsapp:group:<jid>` ใน session store (`~/.openclaw/agents/<agentId>/sessions/sessions.json` ตามค่าเริ่มต้น); รายการที่หายไปหมายถึงกลุ่มยังไม่เคยทริกเกอร์การรันเท่านั้น
- ตัวบ่งชี้การพิมพ์ในกลุ่มทำตาม `agents.defaults.typingMode` เมื่อคำตอบที่มองเห็นได้ใช้โหมดเริ่มต้นแบบ message-tool-only การพิมพ์จะเริ่มทันทีตามค่าเริ่มต้น เพื่อให้สมาชิกกลุ่มเห็นว่าเอเจนต์กำลังทำงานอยู่ แม้จะไม่มีการโพสต์คำตอบสุดท้ายอัตโนมัติก็ตาม การตั้งค่า typing-mode ที่ระบุชัดเจนยังคงมีผลเหนือกว่า

## ที่เกี่ยวข้อง

- [กลุ่ม](/th/channels/groups)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [กลุ่มออกอากาศ](/th/channels/broadcast-groups)
