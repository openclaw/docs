---
read_when:
    - คุณต้องการเลือกช่องทางแชทสำหรับ OpenClaw
    - คุณต้องการภาพรวมอย่างรวดเร็วของแพลตฟอร์มรับส่งข้อความที่รองรับ
summary: แพลตฟอร์มการส่งข้อความที่ OpenClaw สามารถเชื่อมต่อได้
title: ช่องแชท
x-i18n:
    generated_at: "2026-06-27T17:10:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw สามารถคุยกับคุณบนแอปแชตใดก็ได้ที่คุณใช้อยู่แล้ว แต่ละช่องทางเชื่อมต่อผ่าน Gateway
รองรับข้อความในทุกที่ ส่วนสื่อและการแสดงปฏิกิริยาจะแตกต่างกันไปตามช่องทาง

## หมายเหตุการส่งข้อความ

- การตอบกลับใน Telegram ที่มีไวยากรณ์รูปภาพแบบ markdown เช่น `![alt](url)`
  จะถูกแปลงเป็นการตอบกลับแบบสื่อบนเส้นทางส่งออกขั้นสุดท้ายเมื่อทำได้
- DM แบบหลายคนใน Slack จะถูกกำหนดเส้นทางเป็นแชตกลุ่ม ดังนั้นนโยบายกลุ่ม พฤติกรรมการกล่าวถึง
  และกฎเซสชันกลุ่มจะมีผลกับการสนทนา MPIM
- การตั้งค่า WhatsApp เป็นแบบติดตั้งเมื่อต้องการ: การเริ่มใช้งานสามารถแสดงขั้นตอนการตั้งค่าก่อน
  ติดตั้งแพ็กเกจ Plugin ได้ และ Gateway จะโหลด Plugin ภายนอกจาก
  ClawHub/npm เฉพาะเมื่อช่องทางนั้นใช้งานอยู่จริงเท่านั้น
- ช่องทางที่ยอมรับข้อความขาเข้าที่บอตเป็นผู้เขียนสามารถใช้
  [การป้องกันลูปของบอต](/th/channels/bot-loop-protection) ร่วมกัน เพื่อป้องกันไม่ให้บอตคู่หนึ่ง
  ตอบกลับกันเองอย่างไม่สิ้นสุด
- ห้องแบบเปิดตลอดที่รองรับสามารถใช้ [เหตุการณ์ห้องแวดล้อม](/th/channels/ambient-room-events)
  เพื่อให้บทสนทนาในห้องที่ไม่ได้กล่าวถึงกลายเป็นบริบทเงียบ เว้นแต่เอเจนต์จะส่งด้วย
  เครื่องมือ `message`

## ช่องทางที่รองรับ

- [Discord](/th/channels/discord) - Discord Bot API + Gateway; รองรับเซิร์ฟเวอร์ ช่องทาง และ DM
- [Feishu](/th/channels/feishu) - บอต Feishu/Lark ผ่าน WebSocket (Plugin ที่รวมมาในแพ็กเกจ)
- [Google Chat](/th/channels/googlechat) - แอป Google Chat API ผ่าน HTTP Webhook (Plugin ที่ดาวน์โหลดได้)
- [iMessage](/th/channels/imessage) - การผสานรวม macOS แบบเนทีฟผ่านบริดจ์ `imsg` บน Mac ที่ลงชื่อเข้าใช้แล้ว (หรือ SSH wrapper เมื่อ Gateway ทำงานที่อื่น) รวมถึงการดำเนินการผ่าน API ส่วนตัวสำหรับการตอบกลับ tapback เอฟเฟกต์ ไฟล์แนบ และการจัดการกลุ่ม แนะนำสำหรับการตั้งค่า iMessage ใหม่ของ OpenClaw เมื่อสิทธิ์โฮสต์และการเข้าถึง Messages เหมาะสม
- [IRC](/th/channels/irc) - เซิร์ฟเวอร์ IRC แบบคลาสสิก; ช่องทาง + DM พร้อมการควบคุมการจับคู่/รายการอนุญาต
- [LINE](/th/channels/line) - บอต LINE Messaging API (Plugin ที่ดาวน์โหลดได้)
- [Matrix](/th/channels/matrix) - โปรโตคอล Matrix (Plugin ที่ดาวน์โหลดได้)
- [Mattermost](/th/channels/mattermost) - Bot API + WebSocket; ช่องทาง กลุ่ม DM (Plugin ที่ดาวน์โหลดได้)
- [Microsoft Teams](/th/channels/msteams) - Bot Framework; รองรับระดับองค์กร (Plugin ที่รวมมาในแพ็กเกจ)
- [Nextcloud Talk](/th/channels/nextcloud-talk) - แชตแบบโฮสต์เองผ่าน Nextcloud Talk (Plugin ที่รวมมาในแพ็กเกจ)
- [Nostr](/th/channels/nostr) - DM แบบกระจายศูนย์ผ่าน NIP-04 (Plugin ที่รวมมาในแพ็กเกจ)
- [QQ Bot](/th/channels/qqbot) - QQ Bot API; แชตส่วนตัว แชตกลุ่ม และสื่อสมบูรณ์ (Plugin ที่รวมมาในแพ็กเกจ)
- [Raft](/th/channels/raft) - บริดจ์ปลุก Raft CLI สำหรับการทำงานร่วมกันระหว่างมนุษย์และเอเจนต์ (Plugin ภายนอก)
- [Signal](/th/channels/signal) - signal-cli; เน้นความเป็นส่วนตัว
- [Slack](/th/channels/slack) - Bolt SDK; แอปพื้นที่ทำงาน
- [SMS](/th/channels/sms) - SMS ที่รองรับด้วย Twilio ผ่าน Gateway Webhook (Plugin ทางการ)
- [Synology Chat](/th/channels/synology-chat) - Synology NAS Chat ผ่าน Webhook ขาออก+ขาเข้า (Plugin ที่รวมมาในแพ็กเกจ)
- [Telegram](/th/channels/telegram) - Bot API ผ่าน grammY; รองรับกลุ่ม
- [Tlon](/th/channels/tlon) - เมสเซนเจอร์ที่ใช้ Urbit (Plugin ที่รวมมาในแพ็กเกจ)
- [Twitch](/th/channels/twitch) - แชต Twitch ผ่านการเชื่อมต่อ IRC (Plugin ที่รวมมาในแพ็กเกจ)
- [Voice Call](/th/plugins/voice-call) - โทรศัพท์ผ่าน Plivo หรือ Twilio (Plugin, ติดตั้งแยกต่างหาก)
- [WebChat](/th/web/webchat) - UI WebChat ของ Gateway ผ่าน WebSocket
- [WeChat](/th/channels/wechat) - Plugin Tencent iLink Bot ผ่านการเข้าสู่ระบบด้วย QR; เฉพาะแชตส่วนตัวเท่านั้น (Plugin ภายนอก)
- [WhatsApp](/th/channels/whatsapp) - ได้รับความนิยมมากที่สุด; ใช้ Baileys และต้องจับคู่ด้วย QR
- [Yuanbao](/th/channels/yuanbao) - บอต Tencent Yuanbao (Plugin ภายนอก)
- [Zalo](/th/channels/zalo) - Zalo Bot API; เมสเซนเจอร์ยอดนิยมของเวียดนาม (Plugin ที่รวมมาในแพ็กเกจ)
- [Zalo ClawBot](/th/channels/zaloclawbot) - ผู้ช่วย Zalo ส่วนบุคคลผ่านการเข้าสู่ระบบด้วย QR; ผูกกับเจ้าของ (Plugin ภายนอก)
- [Zalo Personal](/th/channels/zalouser) - บัญชีส่วนบุคคลของ Zalo ผ่านการเข้าสู่ระบบด้วย QR (Plugin ที่รวมมาในแพ็กเกจ)

## หมายเหตุ

- ช่องทางต่าง ๆ สามารถทำงานพร้อมกันได้; กำหนดค่าหลายช่องทางแล้ว OpenClaw จะกำหนดเส้นทางตามแต่ละแชต
- การตั้งค่าที่เร็วที่สุดมักเป็น **Telegram** (โทเค็นบอตแบบง่าย) WhatsApp ต้องจับคู่ด้วย QR และ
  จัดเก็บสถานะบนดิสก์มากกว่า
- พฤติกรรมกลุ่มแตกต่างกันไปตามช่องทาง; ดู [กลุ่ม](/th/channels/groups)
- การจับคู่ DM และรายการอนุญาตถูกบังคับใช้เพื่อความปลอดภัย; ดู [ความปลอดภัย](/th/gateway/security)
- การแก้ไขปัญหา: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- ผู้ให้บริการโมเดลมีเอกสารแยกต่างหาก; ดู [ผู้ให้บริการโมเดล](/th/providers/models)
