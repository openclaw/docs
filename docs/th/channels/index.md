---
read_when:
    - คุณต้องการเลือกช่องทางแชตสำหรับ OpenClaw
    - คุณต้องการภาพรวมโดยย่อของแพลตฟอร์มการรับส่งข้อความที่รองรับ
summary: แพลตฟอร์มการส่งข้อความที่ OpenClaw สามารถเชื่อมต่อได้
title: ช่องทางแชต
x-i18n:
    generated_at: "2026-07-16T18:43:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw สามารถพูดคุยกับคุณผ่านแอปแชตใดก็ได้ที่คุณใช้อยู่แล้ว แต่ละช่องทางเชื่อมต่อผ่าน Gateway
รองรับข้อความในทุกช่องทาง ส่วนสื่อและรีแอ็กชันจะแตกต่างกันไปตามช่องทาง

iMessage, Telegram และ UI ของ WebChat มาพร้อมกับการติดตั้งส่วนหลัก ช่องทางที่ระบุว่า
"Plugin อย่างเป็นทางการ" สามารถติดตั้งได้ด้วยคำสั่งเดียว (`openclaw plugins install @openclaw/<id>`)
หรือติดตั้งเมื่อต้องการระหว่าง `openclaw onboard` / `openclaw channels add` จากนั้นต้องรีสตาร์ท Gateway
ช่องทางที่เป็น "Plugin ภายนอก" ได้รับการดูแลภายนอกรีโพ OpenClaw

## ช่องทางที่รองรับ

- [Discord](/th/channels/discord) - Discord Bot API + Gateway; รองรับเซิร์ฟเวอร์ ช่อง และ DM (Plugin อย่างเป็นทางการ)
- [Feishu](/th/channels/feishu) - บอต Feishu/Lark ผ่าน WebSocket (Plugin อย่างเป็นทางการ)
- [Google Chat](/th/channels/googlechat) - แอป Google Chat API ผ่าน HTTP webhook (Plugin อย่างเป็นทางการ)
- [iMessage](/th/channels/imessage) - รวมอยู่ในส่วนหลัก การผสานรวมแบบเนทีฟกับ macOS ผ่านบริดจ์ `imsg` บน Mac ที่ลงชื่อเข้าใช้แล้ว (หรือใช้ตัวห่อหุ้ม SSH เมื่อ Gateway ทำงานอยู่ที่อื่น) รวมถึงการดำเนินการผ่าน API ส่วนตัวสำหรับการตอบกลับ tapback เอฟเฟกต์ ไฟล์แนบ และการจัดการกลุ่ม
- [IRC](/th/channels/irc) - เซิร์ฟเวอร์ IRC แบบดั้งเดิม; ช่อง + DM พร้อมการควบคุมการจับคู่/รายการอนุญาต (Plugin อย่างเป็นทางการ)
- [LINE](/th/channels/line) - บอต LINE Messaging API (Plugin อย่างเป็นทางการ)
- [Matrix](/th/channels/matrix) - โปรโตคอล Matrix (Plugin อย่างเป็นทางการ)
- [Mattermost](/th/channels/mattermost) - Bot API + WebSocket; ช่อง กลุ่ม และ DM (Plugin อย่างเป็นทางการ)
- [Microsoft Teams](/th/channels/msteams) - Bot Framework; รองรับระดับองค์กร (Plugin อย่างเป็นทางการ)
- [Nextcloud Talk](/th/channels/nextcloud-talk) - แชตที่โฮสต์เองผ่าน Nextcloud Talk (Plugin อย่างเป็นทางการ)
- [Nostr](/th/channels/nostr) - DM แบบกระจายศูนย์ผ่าน NIP-04 (Plugin อย่างเป็นทางการ)
- [QQ Bot](/th/channels/qqbot) - QQ Bot API; แชตส่วนตัว แชตกลุ่ม และสื่อสมบูรณ์ (Plugin อย่างเป็นทางการ)
- [Reef](/th/channels/reef) - การส่งข้อความระหว่าง OpenClaw ของแต่ละบุคคลแบบ claw-to-claw ที่มีการป้องกันและเข้ารหัสตั้งแต่ต้นทางถึงปลายทาง (Plugin ที่รวมมาให้)
- [Raft](/th/channels/raft) - บริดจ์ปลุกผ่าน Raft CLI สำหรับการทำงานร่วมกันระหว่างมนุษย์และเอเจนต์ (Plugin อย่างเป็นทางการ)
- [Signal](/th/channels/signal) - signal-cli; เน้นความเป็นส่วนตัว (Plugin อย่างเป็นทางการ)
- [Slack](/th/channels/slack) - Bolt SDK; แอปสำหรับเวิร์กสเปซ (Plugin อย่างเป็นทางการ)
- [SMS](/th/channels/sms) - SMS ที่ทำงานบน Twilio ผ่าน Webhook ของ Gateway (Plugin อย่างเป็นทางการ)
- [Synology Chat](/th/channels/synology-chat) - Synology NAS Chat ผ่าน Webhook ขาออกและขาเข้า (Plugin อย่างเป็นทางการ)
- [Telegram](/th/channels/telegram) - รวมอยู่ในส่วนหลัก Bot API ผ่าน grammY; รองรับกลุ่ม
- [Tlon](/th/channels/tlon) - โปรแกรมส่งข้อความที่ทำงานบน Urbit (Plugin อย่างเป็นทางการ)
- [Twitch](/th/channels/twitch) - แชต Twitch ผ่านการเชื่อมต่อ IRC (Plugin อย่างเป็นทางการ)
- [การโทรด้วยเสียง](/th/plugins/voice-call) - ระบบโทรศัพท์ผ่าน Plivo, Telnyx หรือ Twilio (Plugin อย่างเป็นทางการ)
- [WebChat](/th/web/webchat) - รวมอยู่ในส่วนหลัก UI ของ Gateway WebChat ผ่าน WebSocket
- [WeChat](/th/channels/wechat) - บอต Tencent iLink ผ่านการเข้าสู่ระบบด้วย QR; รองรับเฉพาะแชตส่วนตัว (Plugin ภายนอก)
- [WhatsApp](/th/channels/whatsapp) - ได้รับความนิยมสูงสุด; ใช้ Baileys และต้องจับคู่ด้วย QR (Plugin อย่างเป็นทางการ)
- [Yuanbao](/th/channels/yuanbao) - บอต Tencent Yuanbao (Plugin ภายนอก)
- [Zalo](/th/channels/zalo) - Zalo Bot API; โปรแกรมส่งข้อความยอดนิยมของเวียดนาม (Plugin อย่างเป็นทางการ)
- [Zalo ClawBot](/th/channels/zaloclawbot) - ผู้ช่วย Zalo ส่วนบุคคลผ่านการเข้าสู่ระบบด้วย QR; ผูกกับเจ้าของ (Plugin ภายนอก)
- [Zalo Personal](/th/channels/zalouser) - บัญชี Zalo ส่วนบุคคลผ่านการเข้าสู่ระบบด้วย QR (Plugin อย่างเป็นทางการ)

## หมายเหตุเกี่ยวกับการส่ง

- การตอบกลับของ Telegram ที่มีไวยากรณ์รูปภาพแบบ Markdown เช่น `![alt](url)`
  จะถูกแปลงเป็นการตอบกลับด้วยสื่อในเส้นทางส่งออกขั้นสุดท้ายเมื่อทำได้
- DM แบบหลายคนของ Slack จะถูกกำหนดเส้นทางเป็นแชตกลุ่ม ดังนั้นนโยบายกลุ่ม ลักษณะการทำงานของการกล่าวถึง
  และกฎของเซสชันกลุ่มจึงมีผลกับการสนทนา MPIM
- การตั้งค่า WhatsApp เป็นแบบติดตั้งเมื่อต้องการ: ขั้นตอนการเริ่มต้นใช้งานสามารถแสดงกระบวนการตั้งค่าได้ก่อน
  ที่จะติดตั้งแพ็กเกจ Plugin และ Gateway จะโหลด Plugin ภายนอกจาก
  ClawHub/npm เมื่อช่องทางนั้นทำงานจริงเท่านั้น
- ช่องทางที่ยอมรับข้อความขาเข้าที่เขียนโดยบอตสามารถใช้
  [การป้องกันลูปของบอต](/th/channels/bot-loop-protection) ร่วมกัน เพื่อป้องกันไม่ให้บอตเป็นคู่
  ตอบกลับกันอย่างไม่สิ้นสุด
- ห้องที่เปิดตลอดเวลาและรองรับสามารถใช้ [เหตุการณ์ห้องแบบแวดล้อม](/th/channels/ambient-room-events)
  เพื่อให้บทสนทนาในห้องที่ไม่ได้กล่าวถึงเอเจนต์กลายเป็นบริบทเงียบ เว้นแต่เอเจนต์จะส่งข้อความด้วย
  เครื่องมือ `message`

## หมายเหตุ

- ช่องทางต่าง ๆ สามารถทำงานพร้อมกันได้; กำหนดค่าหลายช่องทางแล้ว OpenClaw จะกำหนดเส้นทางตามแต่ละแชต
- โดยทั่วไป การตั้งค่าที่เร็วที่สุดคือ **Telegram** (โทเค็นบอตแบบง่าย ไม่ต้องติดตั้ง Plugin) ส่วน WhatsApp
  ต้องจับคู่ด้วย QR และจัดเก็บสถานะบนดิสก์มากกว่า
- ลักษณะการทำงานของกลุ่มแตกต่างกันไปตามช่องทาง; ดู [กลุ่ม](/th/channels/groups)
- มีการบังคับใช้การจับคู่ DM และรายการอนุญาตเพื่อความปลอดภัย; ดู [ความปลอดภัย](/th/gateway/security)
- การแก้ไขปัญหา: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- ผู้ให้บริการโมเดลมีเอกสารแยกต่างหาก; ดู [ผู้ให้บริการโมเดล](/th/providers/models)
