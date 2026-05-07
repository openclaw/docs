---
read_when:
    - คุณต้องการเลือกช่องทางแชทสำหรับ OpenClaw
    - คุณต้องการภาพรวมโดยย่อของแพลตฟอร์มการส่งข้อความที่รองรับ
summary: แพลตฟอร์มรับส่งข้อความที่ OpenClaw สามารถเชื่อมต่อได้
title: ช่องทางแชท
x-i18n:
    generated_at: "2026-05-07T01:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw สามารถพูดคุยกับคุณบนแอปแชตใดก็ได้ที่คุณใช้อยู่แล้ว แต่ละช่องทางเชื่อมต่อผ่าน Gateway
รองรับข้อความได้ทุกที่ ส่วนสื่อและการแสดงความรู้สึกจะแตกต่างกันไปตามช่องทาง

## หมายเหตุการส่งมอบ

- การตอบกลับของ Telegram ที่มีไวยากรณ์รูปภาพแบบ markdown เช่น `![alt](url)`
  จะถูกแปลงเป็นการตอบกลับแบบสื่อในเส้นทางขาออกขั้นสุดท้ายเมื่อทำได้
- DM แบบหลายคนของ Slack จะถูกกำหนดเส้นทางเป็นแชตกลุ่ม ดังนั้นนโยบายกลุ่ม พฤติกรรมการกล่าวถึง
  และกฎเซสชันกลุ่มจะมีผลกับการสนทนา MPIM
- การตั้งค่า WhatsApp เป็นแบบติดตั้งเมื่อต้องใช้: ขั้นตอน onboarding สามารถแสดงขั้นตอนการตั้งค่าก่อน
  ติดตั้งแพ็กเกจ Plugin ได้ และ Gateway จะโหลดรันไทม์ของ WhatsApp
  เฉพาะเมื่อช่องทางนั้นใช้งานจริงเท่านั้น

## ช่องทางที่รองรับ

- [BlueBubbles](/th/channels/bluebubbles) - บริดจ์ iMessage รุ่นเดิมผ่าน REST API ของเซิร์ฟเวอร์ BlueBubbles บน macOS; เลิกแนะนำสำหรับการตั้งค่า OpenClaw ใหม่แล้ว แต่ยังรองรับสำหรับการกำหนดค่าที่มีอยู่และการทำงาน private-API ที่สมบูรณ์กว่า
- [Discord](/th/channels/discord) - Discord Bot API + Gateway; รองรับเซิร์ฟเวอร์ ช่องทาง และ DM
- [Feishu](/th/channels/feishu) - บอต Feishu/Lark ผ่าน WebSocket (Plugin ที่รวมมาให้)
- [Google Chat](/th/channels/googlechat) - แอป Google Chat API ผ่าน HTTP webhook (Plugin ที่ดาวน์โหลดได้)
- [iMessage](/th/channels/imessage) - การผสานรวม macOS แบบเนทีฟผ่าน imsg CLI; แนะนำสำหรับการตั้งค่า iMessage ใหม่ของ OpenClaw เมื่อสิทธิ์บนโฮสต์และการเข้าถึง Messages เหมาะสม
- [IRC](/th/channels/irc) - เซิร์ฟเวอร์ IRC แบบดั้งเดิม; ช่องทาง + DM พร้อมการควบคุมการจับคู่/allowlist
- [LINE](/th/channels/line) - บอต LINE Messaging API (Plugin ที่ดาวน์โหลดได้)
- [Matrix](/th/channels/matrix) - โปรโตคอล Matrix (Plugin ที่ดาวน์โหลดได้)
- [Mattermost](/th/channels/mattermost) - Bot API + WebSocket; ช่องทาง กลุ่ม DM (Plugin ที่ดาวน์โหลดได้)
- [Microsoft Teams](/th/channels/msteams) - Bot Framework; รองรับองค์กร (Plugin ที่รวมมาให้)
- [Nextcloud Talk](/th/channels/nextcloud-talk) - แชตแบบโฮสต์เองผ่าน Nextcloud Talk (Plugin ที่รวมมาให้)
- [Nostr](/th/channels/nostr) - DM แบบกระจายศูนย์ผ่าน NIP-04 (Plugin ที่รวมมาให้)
- [QQ Bot](/th/channels/qqbot) - QQ Bot API; แชตส่วนตัว แชตกลุ่ม และสื่อสมบูรณ์ (Plugin ที่รวมมาให้)
- [Signal](/th/channels/signal) - signal-cli; เน้นความเป็นส่วนตัว
- [Slack](/th/channels/slack) - Bolt SDK; แอปเวิร์กสเปซ
- [Synology Chat](/th/channels/synology-chat) - Synology NAS Chat ผ่าน webhook ขาออก+ขาเข้า (Plugin ที่รวมมาให้)
- [Telegram](/th/channels/telegram) - Bot API ผ่าน grammY; รองรับกลุ่ม
- [Tlon](/th/channels/tlon) - เมสเซนเจอร์ที่อิง Urbit (Plugin ที่รวมมาให้)
- [Twitch](/th/channels/twitch) - แชต Twitch ผ่านการเชื่อมต่อ IRC (Plugin ที่รวมมาให้)
- [Voice Call](/th/plugins/voice-call) - โทรศัพท์ผ่าน Plivo หรือ Twilio (Plugin, ติดตั้งแยกต่างหาก)
- [WebChat](/th/web/webchat) - UI WebChat ของ Gateway ผ่าน WebSocket
- [WeChat](/th/channels/wechat) - Plugin Tencent iLink Bot ผ่านการเข้าสู่ระบบด้วย QR; เฉพาะแชตส่วนตัวเท่านั้น (Plugin ภายนอก)
- [WhatsApp](/th/channels/whatsapp) - ได้รับความนิยมสูงสุด; ใช้ Baileys และต้องจับคู่ด้วย QR
- [Yuanbao](/th/channels/yuanbao) - บอต Tencent Yuanbao (Plugin ภายนอก)
- [Zalo](/th/channels/zalo) - Zalo Bot API; เมสเซนเจอร์ยอดนิยมของเวียดนาม (Plugin ที่รวมมาให้)
- [Zalo Personal](/th/channels/zalouser) - บัญชีส่วนตัว Zalo ผ่านการเข้าสู่ระบบด้วย QR (Plugin ที่รวมมาให้)

## หมายเหตุ

- ช่องทางสามารถทำงานพร้อมกันได้; กำหนดค่าหลายช่องทาง แล้ว OpenClaw จะกำหนดเส้นทางตามแต่ละแชต
- การตั้งค่าที่เร็วที่สุดมักเป็น **Telegram** (โทเคนบอตอย่างง่าย) WhatsApp ต้องจับคู่ด้วย QR และ
  เก็บสถานะบนดิสก์มากกว่า
- พฤติกรรมกลุ่มแตกต่างกันไปตามช่องทาง; ดู [กลุ่ม](/th/channels/groups)
- มีการบังคับใช้การจับคู่ DM และ allowlist เพื่อความปลอดภัย; ดู [ความปลอดภัย](/th/gateway/security)
- การแก้ไขปัญหา: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- ผู้ให้บริการโมเดลมีเอกสารแยกต่างหาก; ดู [ผู้ให้บริการโมเดล](/th/providers/models)
