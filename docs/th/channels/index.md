---
read_when:
    - คุณต้องการเลือกช่องทางแชตสำหรับ OpenClaw
    - คุณต้องการภาพรวมอย่างรวดเร็วของแพลตฟอร์มการส่งข้อความที่รองรับ
summary: แพลตฟอร์มรับส่งข้อความที่ OpenClaw สามารถเชื่อมต่อได้
title: ช่องทางแชท
x-i18n:
    generated_at: "2026-05-06T09:03:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw สามารถคุยกับคุณบนแอปแชทใดก็ได้ที่คุณใช้อยู่แล้ว ช่องทางแต่ละช่องเชื่อมต่อผ่าน Gateway
รองรับข้อความในทุกช่องทาง; สื่อและรีแอ็กชันจะแตกต่างกันไปตามช่องทาง

## หมายเหตุการส่งมอบ

- การตอบกลับของ Telegram ที่มีไวยากรณ์รูปภาพแบบ markdown เช่น `![alt](url)`
  จะถูกแปลงเป็นการตอบกลับแบบสื่อในเส้นทางขาออกสุดท้ายเมื่อทำได้
- DM แบบหลายคนของ Slack จะถูกกำหนดเส้นทางเป็นแชทกลุ่ม ดังนั้นนโยบายกลุ่ม พฤติกรรมการกล่าวถึง
  และกฎเซสชันกลุ่มจะมีผลกับการสนทนา MPIM
- การตั้งค่า WhatsApp เป็นแบบติดตั้งเมื่อต้องใช้: ขั้นตอนเริ่มต้นสามารถแสดงลำดับการตั้งค่าก่อน
  ติดตั้งแพ็กเกจ Plugin ได้ และ Gateway จะโหลดรันไทม์ของ WhatsApp
  เฉพาะเมื่อช่องทางนั้นเปิดใช้งานจริง

## ช่องทางที่รองรับ

- [BlueBubbles](/th/channels/bluebubbles) - **แนะนำสำหรับ iMessage**; ใช้ REST API ของเซิร์ฟเวอร์ BlueBubbles macOS พร้อมการรองรับฟีเจอร์เต็มรูปแบบ (Plugin ที่รวมมาให้; แก้ไข, ยกเลิกการส่ง, เอฟเฟกต์, รีแอ็กชัน, การจัดการกลุ่ม - ขณะนี้การแก้ไขเสียอยู่บน macOS 26 Tahoe)
- [Discord](/th/channels/discord) - Discord Bot API + Gateway; รองรับเซิร์ฟเวอร์ ช่องทาง และ DM
- [Feishu](/th/channels/feishu) - บอต Feishu/Lark ผ่าน WebSocket (Plugin ที่รวมมาให้)
- [Google Chat](/th/channels/googlechat) - แอป Google Chat API ผ่าน HTTP Webhook (Plugin ที่ดาวน์โหลดได้)
- [iMessage (legacy)](/th/channels/imessage) - การผสานรวม macOS แบบเดิมผ่าน imsg CLI (เลิกใช้แล้ว ใช้ BlueBubbles สำหรับการตั้งค่าใหม่)
- [IRC](/th/channels/irc) - เซิร์ฟเวอร์ IRC แบบคลาสสิก; ช่องทาง + DM พร้อมการควบคุมการจับคู่/allowlist
- [LINE](/th/channels/line) - บอต LINE Messaging API (Plugin ที่ดาวน์โหลดได้)
- [Matrix](/th/channels/matrix) - โปรโตคอล Matrix (Plugin ที่ดาวน์โหลดได้)
- [Mattermost](/th/channels/mattermost) - Bot API + WebSocket; ช่องทาง กลุ่ม DM (Plugin ที่ดาวน์โหลดได้)
- [Microsoft Teams](/th/channels/msteams) - Bot Framework; รองรับระดับองค์กร (Plugin ที่รวมมาให้)
- [Nextcloud Talk](/th/channels/nextcloud-talk) - แชทแบบโฮสต์เองผ่าน Nextcloud Talk (Plugin ที่รวมมาให้)
- [Nostr](/th/channels/nostr) - DM แบบกระจายศูนย์ผ่าน NIP-04 (Plugin ที่รวมมาให้)
- [QQ Bot](/th/channels/qqbot) - QQ Bot API; แชทส่วนตัว แชทกลุ่ม และสื่อสมบูรณ์ (Plugin ที่รวมมาให้)
- [Signal](/th/channels/signal) - signal-cli; เน้นความเป็นส่วนตัว
- [Slack](/th/channels/slack) - Bolt SDK; แอปเวิร์กสเปซ
- [Synology Chat](/th/channels/synology-chat) - Synology NAS Chat ผ่าน Webhook ขาออก+ขาเข้า (Plugin ที่รวมมาให้)
- [Telegram](/th/channels/telegram) - Bot API ผ่าน grammY; รองรับกลุ่ม
- [Tlon](/th/channels/tlon) - เมสเซนเจอร์บน Urbit (Plugin ที่รวมมาให้)
- [Twitch](/th/channels/twitch) - แชท Twitch ผ่านการเชื่อมต่อ IRC (Plugin ที่รวมมาให้)
- [Voice Call](/th/plugins/voice-call) - โทรศัพท์ผ่าน Plivo หรือ Twilio (Plugin ติดตั้งแยกต่างหาก)
- [WebChat](/th/web/webchat) - UI Gateway WebChat ผ่าน WebSocket
- [WeChat](/th/channels/wechat) - Plugin Tencent iLink Bot ผ่านการเข้าสู่ระบบด้วย QR; เฉพาะแชทส่วนตัวเท่านั้น (Plugin ภายนอก)
- [WhatsApp](/th/channels/whatsapp) - ยอดนิยมที่สุด; ใช้ Baileys และต้องจับคู่ด้วย QR
- [Yuanbao](/th/channels/yuanbao) - บอต Tencent Yuanbao (Plugin ภายนอก)
- [Zalo](/th/channels/zalo) - Zalo Bot API; เมสเซนเจอร์ยอดนิยมของเวียดนาม (Plugin ที่รวมมาให้)
- [Zalo Personal](/th/channels/zalouser) - บัญชีส่วนตัว Zalo ผ่านการเข้าสู่ระบบด้วย QR (Plugin ที่รวมมาให้)

## หมายเหตุ

- ช่องทางสามารถทำงานพร้อมกันได้; กำหนดค่าหลายช่องทางแล้ว OpenClaw จะกำหนดเส้นทางตามแต่ละแชท
- การตั้งค่าที่เร็วที่สุดโดยทั่วไปคือ **Telegram** (โทเค็นบอตแบบง่าย) WhatsApp ต้องจับคู่ด้วย QR และ
  เก็บสถานะบนดิสก์มากกว่า
- พฤติกรรมของกลุ่มแตกต่างกันไปตามช่องทาง; ดู [กลุ่ม](/th/channels/groups)
- การจับคู่ DM และ allowlist จะถูกบังคับใช้เพื่อความปลอดภัย; ดู [ความปลอดภัย](/th/gateway/security)
- การแก้ไขปัญหา: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- ผู้ให้บริการโมเดลมีเอกสารแยกต่างหาก; ดู [ผู้ให้บริการโมเดล](/th/providers/models)
