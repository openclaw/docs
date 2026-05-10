---
read_when:
    - คุณต้องการเลือกช่องทางแชทสำหรับ OpenClaw
    - คุณต้องการภาพรวมอย่างรวดเร็วของแพลตฟอร์มการรับส่งข้อความที่รองรับ
summary: แพลตฟอร์มการรับส่งข้อความที่ OpenClaw สามารถเชื่อมต่อได้
title: ช่องทางแชท
x-i18n:
    generated_at: "2026-05-10T19:22:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

OpenClaw สามารถคุยกับคุณบนแอปแชตใดก็ได้ที่คุณใช้อยู่แล้ว แต่ละช่องทางเชื่อมต่อผ่าน Gateway
รองรับข้อความได้ทุกที่ ส่วนสื่อและรีแอ็กชันจะแตกต่างกันไปตามช่องทาง

## หมายเหตุการส่งข้อความ

- คำตอบของ Telegram ที่มีไวยากรณ์รูปภาพแบบ Markdown เช่น `![alt](url)`
  จะถูกแปลงเป็นคำตอบแบบสื่อในเส้นทางขาออกสุดท้ายเมื่อทำได้
- DM แบบหลายคนของ Slack จะถูกกำหนดเส้นทางเป็นแชตกลุ่ม ดังนั้นนโยบายกลุ่ม พฤติกรรมการกล่าวถึง
  และกฎเซสชันกลุ่มจึงมีผลกับการสนทนา MPIM
- การตั้งค่า WhatsApp เป็นแบบติดตั้งเมื่อจำเป็น: การเริ่มต้นใช้งานสามารถแสดงขั้นตอนการตั้งค่าก่อน
  ที่แพ็กเกจ Plugin จะถูกติดตั้ง และ Gateway จะโหลดรันไทม์ของ WhatsApp
  เฉพาะเมื่อช่องทางนั้นเปิดใช้งานจริง

## ช่องทางที่รองรับ

- [Discord](/th/channels/discord) - Discord Bot API + Gateway; รองรับเซิร์ฟเวอร์ ช่องทาง และ DM
- [Feishu](/th/channels/feishu) - บอต Feishu/Lark ผ่าน WebSocket (Plugin ที่รวมมาให้)
- [Google Chat](/th/channels/googlechat) - แอป Google Chat API ผ่าน HTTP Webhook (Plugin ที่ดาวน์โหลดได้)
- [iMessage](/th/channels/imessage) - การผสานรวมแบบเนทีฟของ macOS ผ่านบริดจ์ `imsg` บน Mac ที่ลงชื่อเข้าใช้แล้ว (หรือ SSH wrapper เมื่อ Gateway ทำงานที่อื่น) รวมถึงการดำเนินการผ่าน API ส่วนตัวสำหรับการตอบกลับ tapback เอฟเฟกต์ ไฟล์แนบ และการจัดการกลุ่ม เหมาะสำหรับการตั้งค่า iMessage ใหม่ของ OpenClaw เมื่อสิทธิ์ของโฮสต์และการเข้าถึง Messages เหมาะสม
- [IRC](/th/channels/irc) - เซิร์ฟเวอร์ IRC แบบคลาสสิก; ช่องทาง + DM พร้อมตัวควบคุมการจับคู่/allowlist
- [LINE](/th/channels/line) - บอต LINE Messaging API (Plugin ที่ดาวน์โหลดได้)
- [Matrix](/th/channels/matrix) - โปรโตคอล Matrix (Plugin ที่ดาวน์โหลดได้)
- [Mattermost](/th/channels/mattermost) - Bot API + WebSocket; ช่องทาง กลุ่ม DM (Plugin ที่ดาวน์โหลดได้)
- [Microsoft Teams](/th/channels/msteams) - Bot Framework; รองรับองค์กร (Plugin ที่รวมมาให้)
- [Nextcloud Talk](/th/channels/nextcloud-talk) - แชตแบบโฮสต์เองผ่าน Nextcloud Talk (Plugin ที่รวมมาให้)
- [Nostr](/th/channels/nostr) - DM แบบกระจายศูนย์ผ่าน NIP-04 (Plugin ที่รวมมาให้)
- [QQ Bot](/th/channels/qqbot) - QQ Bot API; แชตส่วนตัว แชตกลุ่ม และสื่อสมบูรณ์ (Plugin ที่รวมมาให้)
- [Signal](/th/channels/signal) - signal-cli; เน้นความเป็นส่วนตัว
- [Slack](/th/channels/slack) - Bolt SDK; แอปพื้นที่ทำงาน
- [Synology Chat](/th/channels/synology-chat) - Synology NAS Chat ผ่าน Webhook ขาออก+ขาเข้า (Plugin ที่รวมมาให้)
- [Telegram](/th/channels/telegram) - Bot API ผ่าน grammY; รองรับกลุ่ม
- [Tlon](/th/channels/tlon) - เมสเซนเจอร์ที่ใช้ Urbit (Plugin ที่รวมมาให้)
- [Twitch](/th/channels/twitch) - แชต Twitch ผ่านการเชื่อมต่อ IRC (Plugin ที่รวมมาให้)
- [Voice Call](/th/plugins/voice-call) - โทรศัพท์ผ่าน Plivo หรือ Twilio (Plugin ติดตั้งแยกต่างหาก)
- [WebChat](/th/web/webchat) - UI Gateway WebChat ผ่าน WebSocket
- [WeChat](/th/channels/wechat) - Plugin Tencent iLink Bot ผ่านการเข้าสู่ระบบด้วย QR; เฉพาะแชตส่วนตัวเท่านั้น (Plugin ภายนอก)
- [WhatsApp](/th/channels/whatsapp) - ได้รับความนิยมมากที่สุด; ใช้ Baileys และต้องจับคู่ด้วย QR
- [Yuanbao](/th/channels/yuanbao) - บอต Tencent Yuanbao (Plugin ภายนอก)
- [Zalo](/th/channels/zalo) - Zalo Bot API; เมสเซนเจอร์ยอดนิยมของเวียดนาม (Plugin ที่รวมมาให้)
- [Zalo Personal](/th/channels/zalouser) - บัญชีส่วนตัว Zalo ผ่านการเข้าสู่ระบบด้วย QR (Plugin ที่รวมมาให้)

## หมายเหตุ

- ช่องทางสามารถทำงานพร้อมกันได้; ตั้งค่าหลายช่องทาง แล้ว OpenClaw จะกำหนดเส้นทางตามแต่ละแชต
- การตั้งค่าที่เร็วที่สุดมักเป็น **Telegram** (โทเค็นบอตแบบง่าย) WhatsApp ต้องจับคู่ด้วย QR และ
  เก็บสถานะบนดิสก์มากกว่า
- พฤติกรรมกลุ่มแตกต่างกันไปตามช่องทาง; ดู [กลุ่ม](/th/channels/groups)
- การจับคู่ DM และ allowlist ถูกบังคับใช้เพื่อความปลอดภัย; ดู [ความปลอดภัย](/th/gateway/security)
- การแก้ไขปัญหา: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- ผู้ให้บริการโมเดลมีเอกสารแยกต่างหาก; ดู [ผู้ให้บริการโมเดล](/th/providers/models)
