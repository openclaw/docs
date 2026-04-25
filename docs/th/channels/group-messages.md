---
read_when:
    - การเปลี่ยนกฎข้อความกลุ่มหรือการกล่าวถึง
summary: พฤติกรรมและการกำหนดค่าสำหรับการจัดการข้อความกลุ่ม WhatsApp (`mentionPatterns` ใช้ร่วมกันในทุกส่วนการทำงาน)
title: ข้อความกลุ่ม
x-i18n:
    generated_at: "2026-04-25T13:41:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

พฤติกรรมและการกำหนดค่าสำหรับการจัดการข้อความกลุ่ม WhatsApp (ปัจจุบัน `mentionPatterns` ใช้ร่วมกันในทุกส่วนการทำงาน)

เป้าหมาย: ให้ Clawd อยู่ในกลุ่ม WhatsApp ได้ ปลุกขึ้นมาทำงานเฉพาะเมื่อมีการเรียกหา และแยกเธรดนั้นออกจากเซสชัน DM ส่วนตัว

หมายเหตุ: ขณะนี้ `agents.list[].groupChat.mentionPatterns` ถูกใช้โดย Telegram/Discord/Slack/iMessage ด้วยเช่นกัน; เอกสารนี้มุ่งเน้นที่พฤติกรรมเฉพาะของ WhatsApp สำหรับการตั้งค่าหลายเอเจนต์ ให้ตั้ง `agents.list[].groupChat.mentionPatterns` แยกตามเอเจนต์ (หรือใช้ `messages.groupChat.mentionPatterns` เป็นค่ากลับไประดับส่วนกลาง)

## การติดตั้งใช้งานปัจจุบัน (2025-12-03)

- โหมดการเปิดใช้งาน: `mention` (ค่าเริ่มต้น) หรือ `always` `mention` ต้องมีการเรียกหา (การ @-mention จริงของ WhatsApp ผ่าน `mentionedJids`, รูปแบบ regex ที่ปลอดภัย หรือหมายเลข E.164 ของบอทที่ปรากฏที่ใดก็ได้ในข้อความ) `always` จะปลุกเอเจนต์ในทุกข้อความ แต่เอเจนต์ควรตอบกลับเฉพาะเมื่อสามารถเพิ่มคุณค่าที่มีความหมายได้เท่านั้น; มิฉะนั้นจะส่งโทเค็นเงียบแบบตรงตัว `NO_REPLY` / `no_reply` ค่าเริ่มต้นตั้งได้ใน config (`channels.whatsapp.groups`) และ override รายกลุ่มได้ผ่าน `/activation` เมื่อมีการตั้ง `channels.whatsapp.groups` ระบบจะใช้เป็น allowlist ของกลุ่มด้วย (ใส่ `"*"` เพื่ออนุญาตทุกกลุ่ม)
- นโยบายกลุ่ม: `channels.whatsapp.groupPolicy` ควบคุมว่าจะยอมรับข้อความกลุ่มหรือไม่ (`open|disabled|allowlist`) `allowlist` ใช้ `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` ที่ระบุชัดเจน) ค่าเริ่มต้นคือ `allowlist` (บล็อกไว้จนกว่าคุณจะเพิ่มผู้ส่ง)
- เซสชันรายกลุ่ม: คีย์เซสชันมีรูปแบบ `agent:<agentId>:whatsapp:group:<jid>` ดังนั้นคำสั่งอย่าง `/verbose on`, `/trace on` หรือ `/think high` (ส่งเป็นข้อความเดี่ยว) จะมีผลเฉพาะกับกลุ่มนั้น; สถานะ DM ส่วนตัวจะไม่ถูกแตะต้อง Heartbeat จะถูกข้ามสำหรับเธรดกลุ่ม
- การแทรกบริบท: ข้อความกลุ่มแบบ **pending-only** (ค่าเริ่มต้น 50 ข้อความ) ที่ _ไม่ได้_ ทำให้เกิดการรัน จะถูกเติมนำหน้าไว้ใต้ `[Chat messages since your last reply - for context]` โดยมีบรรทัดที่เป็นตัวกระตุ้นอยู่ใต้ `[Current message - respond to this]` ข้อความที่มีอยู่ในเซสชันแล้วจะไม่ถูกแทรกซ้ำ
- การแสดงผู้ส่ง: ตอนนี้ทุกชุดข้อความของกลุ่มจะลงท้ายด้วย `[from: Sender Name (+E164)]` เพื่อให้ Pi รู้ว่าใครกำลังพูด
- ข้อความชั่วคราว/view-once: เราจะแกะห่อสิ่งเหล่านี้ก่อนดึงข้อความ/mentions ออกมา ดังนั้นการเรียกหาภายในข้อความเหล่านี้ยังคงกระตุ้นได้
- system prompt ของกลุ่ม: ในเทิร์นแรกของเซสชันกลุ่ม (และทุกครั้งที่ `/activation` เปลี่ยนโหมด) เราจะแทรกข้อความสั้น ๆ เข้าไปใน system prompt เช่น `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` หากไม่มี metadata เราจะยังคงบอกเอเจนต์ว่านี่คือแชตกลุ่ม

## ตัวอย่าง Config (WhatsApp)

เพิ่มบล็อก `groupChat` ลงใน `~/.openclaw/openclaw.json` เพื่อให้การเรียกหาด้วยชื่อที่แสดงผลทำงานได้ แม้ WhatsApp จะลบ `@` ที่มองเห็นได้ออกจากเนื้อความข้อความ:

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

- regex จะไม่สนตัวพิมพ์เล็กใหญ่ และใช้ข้อป้องกัน safe-regex เดียวกันกับพื้นผิว regex อื่น ๆ ของ config; รูปแบบที่ไม่ถูกต้องและ nested repetition ที่ไม่ปลอดภัยจะถูกละเลย
- WhatsApp ยังคงส่ง mentions แบบ canonical ผ่าน `mentionedJids` เมื่อมีคนแตะรายชื่อติดต่อ ดังนั้น fallback ด้วยหมายเลขจึงแทบไม่จำเป็น แต่ก็เป็นตัวช่วยสำรองที่มีประโยชน์

### คำสั่งการเปิดใช้งาน (เฉพาะ owner)

ใช้คำสั่งในแชตกลุ่ม:

- `/activation mention`
- `/activation always`

มีเพียงหมายเลข owner เท่านั้น (จาก `channels.whatsapp.allowFrom` หรือ E.164 ของบอทเองหากไม่ได้ตั้งค่าไว้) ที่สามารถเปลี่ยนค่านี้ได้ ส่ง `/status` เป็นข้อความเดี่ยวในกลุ่มเพื่อดูโหมดการเปิดใช้งานปัจจุบัน

## วิธีใช้งาน

1. เพิ่มบัญชี WhatsApp ของคุณ (บัญชีที่รัน OpenClaw) เข้าไปในกลุ่ม
2. พิมพ์ `@openclaw …` (หรือใส่หมายเลข) จะมีเพียงผู้ส่งที่อยู่ใน allowlist เท่านั้นที่กระตุ้นได้ เว้นแต่คุณจะตั้ง `groupPolicy: "open"`
3. prompt ของเอเจนต์จะมีบริบทกลุ่มล่าสุดพร้อมตัวทำเครื่องหมาย `[from: …]` ที่ต่อท้าย เพื่อให้ตอบหาคนที่ถูกต้องได้
4. คำสั่งระดับเซสชัน (`/verbose on`, `/trace on`, `/think high`, `/new` หรือ `/reset`, `/compact`) จะมีผลเฉพาะกับเซสชันของกลุ่มนั้น; ส่งเป็นข้อความเดี่ยวเพื่อให้ระบบลงทะเบียน เซสชัน DM ส่วนตัวของคุณจะยังคงแยกอิสระ

## การทดสอบ / การตรวจสอบยืนยัน

- การทดสอบแบบ manual smoke:
  - ส่งการเรียกหา `@openclaw` ในกลุ่ม และยืนยันว่ามีการตอบกลับที่อ้างอิงชื่อผู้ส่ง
  - ส่งการเรียกหาครั้งที่สอง และตรวจสอบว่าบล็อกประวัติถูกใส่เข้ามา จากนั้นถูกล้างในเทิร์นถัดไป
- ตรวจสอบบันทึก Gateway (รันด้วย `--verbose`) เพื่อดูรายการ `inbound web message` ที่แสดง `from: <groupJid>` และส่วนต่อท้าย `[from: …]`

## ข้อควรทราบที่ทราบอยู่แล้ว

- Heartbeat จะถูกข้ามสำหรับกลุ่มโดยตั้งใจ เพื่อหลีกเลี่ยงการกระจายข้อความที่รบกวน
- การระงับ echo ใช้สตริงของชุดข้อความรวม; หากคุณส่งข้อความเดียวกันสองครั้งโดยไม่มี mentions จะมีเพียงครั้งแรกเท่านั้นที่ได้รับการตอบกลับ
- รายการใน session store จะปรากฏเป็น `agent:<agentId>:whatsapp:group:<jid>` ใน session store (`~/.openclaw/agents/<agentId>/sessions/sessions.json` โดยค่าเริ่มต้น); หากไม่มีรายการ ก็หมายความเพียงว่ากลุ่มนั้นยังไม่เคยกระตุ้นให้เกิดการรัน
- ตัวแสดงสถานะการพิมพ์ในกลุ่มจะเป็นไปตาม `agents.defaults.typingMode` (ค่าเริ่มต้น: `message` เมื่อไม่มีการ mention)

## ที่เกี่ยวข้อง

- [Groups](/th/channels/groups)
- [Channel routing](/th/channels/channel-routing)
- [Broadcast groups](/th/channels/broadcast-groups)
