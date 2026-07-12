---
read_when:
    - คุณต้องการเลือกช่องทางแชตสำหรับ OpenClaw
    - คุณต้องการภาพรวมโดยย่อของแพลตฟอร์มรับส่งข้อความที่รองรับ
summary: แพลตฟอร์มรับส่งข้อความที่ OpenClaw สามารถเชื่อมต่อได้
title: ช่องทางแชต
x-i18n:
    generated_at: "2026-07-12T15:52:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw สามารถพูดคุยกับคุณผ่านแอปแชตใดก็ตามที่คุณใช้อยู่แล้ว แต่ละช่องทางเชื่อมต่อผ่าน Gateway
ทุกช่องทางรองรับข้อความ ส่วนสื่อและรีแอ็กชันจะแตกต่างกันไปตามช่องทาง

iMessage, Telegram และ UI ของ WebChat มาพร้อมกับการติดตั้งหลัก ช่องทางที่ระบุว่า
"Plugin อย่างเป็นทางการ" สามารถติดตั้งได้ด้วยคำสั่งเดียว (`openclaw plugins install @openclaw/<id>`)
หรือติดตั้งเมื่อต้องการระหว่าง `openclaw onboard` / `openclaw channels add` จากนั้นต้องรีสตาร์ต
Gateway ช่องทางที่ระบุว่า "Plugin ภายนอก" ได้รับการดูแลนอก repo ของ OpenClaw

## ช่องทางที่รองรับ

- [Discord](/th/channels/discord) - Discord Bot API + Gateway รองรับเซิร์ฟเวอร์ ช่อง และข้อความส่วนตัว (Plugin อย่างเป็นทางการ)
- [Feishu](/th/channels/feishu) - บอต Feishu/Lark ผ่าน WebSocket (Plugin อย่างเป็นทางการ)
- [Google Chat](/th/channels/googlechat) - แอป Google Chat API ผ่าน Webhook แบบ HTTP (Plugin อย่างเป็นทางการ)
- [iMessage](/th/channels/imessage) - รวมอยู่ในส่วนหลัก การผสานรวมกับ macOS โดยตรงผ่านบริดจ์ `imsg` บน Mac ที่ลงชื่อเข้าใช้แล้ว (หรือใช้ตัวครอบ SSH เมื่อ Gateway ทำงานอยู่ที่อื่น) รวมถึงการดำเนินการผ่าน API ส่วนตัวสำหรับการตอบกลับ แทปแบ็ก เอฟเฟกต์ ไฟล์แนบ และการจัดการกลุ่ม
- [IRC](/th/channels/irc) - เซิร์ฟเวอร์ IRC แบบดั้งเดิม รองรับช่องและข้อความส่วนตัว พร้อมการควบคุมด้วยการจับคู่/รายการอนุญาต (Plugin อย่างเป็นทางการ)
- [LINE](/th/channels/line) - บอต LINE Messaging API (Plugin อย่างเป็นทางการ)
- [Matrix](/th/channels/matrix) - โปรโตคอล Matrix (Plugin อย่างเป็นทางการ)
- [Mattermost](/th/channels/mattermost) - Bot API + WebSocket รองรับช่อง กลุ่ม และข้อความส่วนตัว (Plugin อย่างเป็นทางการ)
- [Microsoft Teams](/th/channels/msteams) - Bot Framework รองรับการใช้งานระดับองค์กร (Plugin อย่างเป็นทางการ)
- [Nextcloud Talk](/th/channels/nextcloud-talk) - แชตที่โฮสต์เองผ่าน Nextcloud Talk (Plugin อย่างเป็นทางการ)
- [Nostr](/th/channels/nostr) - ข้อความส่วนตัวแบบกระจายศูนย์ผ่าน NIP-04 (Plugin อย่างเป็นทางการ)
- [QQ Bot](/th/channels/qqbot) - QQ Bot API รองรับแชตส่วนตัว แชตกลุ่ม และสื่อหลากหลายรูปแบบ (Plugin อย่างเป็นทางการ)
- [Raft](/th/channels/raft) - บริดจ์ปลุกผ่าน Raft CLI สำหรับการทำงานร่วมกันระหว่างมนุษย์และเอเจนต์ (Plugin อย่างเป็นทางการ)
- [Signal](/th/channels/signal) - signal-cli เน้นความเป็นส่วนตัว (Plugin อย่างเป็นทางการ)
- [Slack](/th/channels/slack) - Bolt SDK สำหรับแอปในพื้นที่ทำงาน (Plugin อย่างเป็นทางการ)
- [SMS](/th/channels/sms) - SMS ที่ให้บริการโดย Twilio ผ่าน Webhook ของ Gateway (Plugin อย่างเป็นทางการ)
- [Synology Chat](/th/channels/synology-chat) - Synology NAS Chat ผ่าน Webhook ขาออกและขาเข้า (Plugin อย่างเป็นทางการ)
- [Telegram](/th/channels/telegram) - รวมอยู่ในส่วนหลัก ใช้ Bot API ผ่าน grammY และรองรับกลุ่ม
- [Tlon](/th/channels/tlon) - โปรแกรมรับส่งข้อความที่ทำงานบน Urbit (Plugin อย่างเป็นทางการ)
- [Twitch](/th/channels/twitch) - แชต Twitch ผ่านการเชื่อมต่อ IRC (Plugin อย่างเป็นทางการ)
- [การโทรด้วยเสียง](/th/plugins/voice-call) - ระบบโทรศัพท์ผ่าน Plivo, Telnyx หรือ Twilio (Plugin อย่างเป็นทางการ)
- [WebChat](/th/web/webchat) - รวมอยู่ในส่วนหลัก UI ของ Gateway WebChat ผ่าน WebSocket
- [WeChat](/th/channels/wechat) - บอต Tencent iLink ผ่านการเข้าสู่ระบบด้วยคิวอาร์โค้ด รองรับเฉพาะแชตส่วนตัว (Plugin ภายนอก)
- [WhatsApp](/th/channels/whatsapp) - ได้รับความนิยมสูงสุด ใช้ Baileys และต้องจับคู่ด้วยคิวอาร์โค้ด (Plugin อย่างเป็นทางการ)
- [Yuanbao](/th/channels/yuanbao) - บอต Tencent Yuanbao (Plugin ภายนอก)
- [Zalo](/th/channels/zalo) - Zalo Bot API โปรแกรมรับส่งข้อความยอดนิยมของเวียดนาม (Plugin อย่างเป็นทางการ)
- [Zalo ClawBot](/th/channels/zaloclawbot) - ผู้ช่วย Zalo ส่วนตัวผ่านการเข้าสู่ระบบด้วยคิวอาร์โค้ด โดยผูกกับเจ้าของ (Plugin ภายนอก)
- [Zalo Personal](/th/channels/zalouser) - บัญชีส่วนตัวของ Zalo ผ่านการเข้าสู่ระบบด้วยคิวอาร์โค้ด (Plugin อย่างเป็นทางการ)

## หมายเหตุเกี่ยวกับการส่ง

- การตอบกลับใน Telegram ที่มีไวยากรณ์รูปภาพแบบ markdown เช่น `![alt](url)`
  จะถูกแปลงเป็นการตอบกลับด้วยสื่อในเส้นทางส่งออกขั้นสุดท้ายเมื่อสามารถทำได้
- ข้อความส่วนตัวแบบหลายคนใน Slack จะถูกกำหนดเส้นทางเป็นแชตกลุ่ม ดังนั้นนโยบายกลุ่ม พฤติกรรม
  การกล่าวถึง และกฎของเซสชันกลุ่มจึงมีผลกับการสนทนา MPIM
- การตั้งค่า WhatsApp เป็นแบบติดตั้งเมื่อต้องการ ขั้นตอนเริ่มต้นใช้งานสามารถแสดงกระบวนการตั้งค่าได้ก่อน
  ติดตั้งแพ็กเกจ Plugin และ Gateway จะโหลด Plugin ภายนอกจาก
  ClawHub/npm เฉพาะเมื่อช่องทางนั้นทำงานอยู่จริง
- ช่องทางที่ยอมรับข้อความขาเข้าซึ่งสร้างโดยบอตสามารถใช้
  [การป้องกันลูปของบอต](/th/channels/bot-loop-protection) ร่วมกัน เพื่อป้องกันไม่ให้บอตสองตัว
  ตอบโต้กันอย่างไม่สิ้นสุด
- ห้องที่รองรับการทำงานตลอดเวลาสามารถใช้ [เหตุการณ์ห้องแวดล้อม](/th/channels/ambient-room-events)
  เพื่อให้บทสนทนาในห้องที่ไม่ได้กล่าวถึงเอเจนต์กลายเป็นบริบทเงียบ เว้นแต่เอเจนต์จะส่งข้อความด้วย
  เครื่องมือ `message`

## หมายเหตุ

- ช่องทางสามารถทำงานพร้อมกันได้ กำหนดค่าหลายช่องทางแล้ว OpenClaw จะกำหนดเส้นทางตามแต่ละแชต
- วิธีตั้งค่าที่เร็วที่สุดมักเป็น **Telegram** (ใช้โทเค็นบอตแบบง่ายและไม่ต้องติดตั้ง Plugin) ส่วน WhatsApp
  ต้องจับคู่ด้วยคิวอาร์โค้ดและจัดเก็บสถานะบนดิสก์มากกว่า
- พฤติกรรมของกลุ่มแตกต่างกันไปตามช่องทาง โปรดดู [กลุ่ม](/th/channels/groups)
- มีการบังคับใช้การจับคู่ข้อความส่วนตัวและรายการอนุญาตเพื่อความปลอดภัย โปรดดู [ความปลอดภัย](/th/gateway/security)
- การแก้ไขปัญหา: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- ผู้ให้บริการโมเดลมีเอกสารแยกต่างหาก โปรดดู [ผู้ให้บริการโมเดล](/th/providers/models)
