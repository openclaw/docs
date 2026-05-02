---
read_when:
    - คุณต้องการเลือกช่องทางแชทสำหรับ OpenClaw
    - คุณต้องการภาพรวมอย่างรวดเร็วของแพลตฟอร์มการรับส่งข้อความที่รองรับ
summary: แพลตฟอร์มรับส่งข้อความที่ OpenClaw สามารถเชื่อมต่อได้
title: ช่องทางแชต
x-i18n:
    generated_at: "2026-05-02T10:07:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw สามารถคุยกับคุณได้บนแอปแชตใดก็ได้ที่คุณใช้อยู่แล้ว แต่ละช่องทางเชื่อมต่อผ่าน Gateway
รองรับข้อความทุกที่ ส่วนสื่อและรีแอ็กชันจะแตกต่างกันไปตามช่องทาง

## หมายเหตุการส่งข้อความ

- การตอบกลับของ Telegram ที่มีไวยากรณ์รูปภาพแบบ markdown เช่น `![alt](url)`
  จะถูกแปลงเป็นการตอบกลับแบบสื่อในเส้นทางขาออกสุดท้ายเมื่อทำได้
- DM แบบหลายคนของ Slack จะถูกจัดเส้นทางเป็นแชตกลุ่ม ดังนั้นนโยบายกลุ่ม พฤติกรรมการกล่าวถึง
  และกฎของเซสชันกลุ่มจะมีผลกับการสนทนา MPIM
- การตั้งค่า WhatsApp เป็นแบบติดตั้งเมื่อต้องใช้: การเริ่มต้นใช้งานสามารถแสดงขั้นตอนการตั้งค่าก่อน
  ติดตั้งแพ็กเกจ Plugin ได้ และ Gateway จะโหลด runtime ของ WhatsApp
  เฉพาะเมื่อช่องทางนั้นใช้งานอยู่จริง

## ช่องทางที่รองรับ

- [BlueBubbles](/th/channels/bluebubbles) — **แนะนำสำหรับ iMessage**; ใช้ REST API ของเซิร์ฟเวอร์ BlueBubbles บน macOS พร้อมรองรับคุณสมบัติครบถ้วน (Plugin ที่มาพร้อมชุดติดตั้ง; แก้ไข ยกเลิกการส่ง เอฟเฟกต์ รีแอ็กชัน การจัดการกลุ่ม — ขณะนี้การแก้ไขยังเสียบน macOS 26 Tahoe)
- [Discord](/th/channels/discord) — Discord Bot API + Gateway; รองรับเซิร์ฟเวอร์ ช่องทาง และ DM
- [Feishu](/th/channels/feishu) — บอต Feishu/Lark ผ่าน WebSocket (Plugin ที่มาพร้อมชุดติดตั้ง)
- [Google Chat](/th/channels/googlechat) — แอป Google Chat API ผ่าน HTTP webhook (Plugin ที่ดาวน์โหลดได้)
- [iMessage (รุ่นเดิม)](/th/channels/imessage) — การผสานรวมกับ macOS แบบเดิมผ่าน imsg CLI (เลิกแนะนำแล้ว ให้ใช้ BlueBubbles สำหรับการตั้งค่าใหม่)
- [IRC](/th/channels/irc) — เซิร์ฟเวอร์ IRC แบบคลาสสิก; ช่องทาง + DM พร้อมการจับคู่/การควบคุมรายการอนุญาต
- [LINE](/th/channels/line) — บอต LINE Messaging API (Plugin ที่ดาวน์โหลดได้)
- [Matrix](/th/channels/matrix) — โปรโตคอล Matrix (Plugin ที่ดาวน์โหลดได้)
- [Mattermost](/th/channels/mattermost) — Bot API + WebSocket; ช่องทาง กลุ่ม DM (Plugin ที่ดาวน์โหลดได้)
- [Microsoft Teams](/th/channels/msteams) — Bot Framework; รองรับองค์กร (Plugin ที่มาพร้อมชุดติดตั้ง)
- [Nextcloud Talk](/th/channels/nextcloud-talk) — แชตที่โฮสต์เองผ่าน Nextcloud Talk (Plugin ที่มาพร้อมชุดติดตั้ง)
- [Nostr](/th/channels/nostr) — DM แบบกระจายศูนย์ผ่าน NIP-04 (Plugin ที่มาพร้อมชุดติดตั้ง)
- [QQ Bot](/th/channels/qqbot) — QQ Bot API; แชตส่วนตัว แชตกลุ่ม และสื่อสมบูรณ์ (Plugin ที่มาพร้อมชุดติดตั้ง)
- [Signal](/th/channels/signal) — signal-cli; เน้นความเป็นส่วนตัว
- [Slack](/th/channels/slack) — Bolt SDK; แอปสำหรับเวิร์กสเปซ
- [Synology Chat](/th/channels/synology-chat) — Synology NAS Chat ผ่าน webhook ขาออก+ขาเข้า (Plugin ที่มาพร้อมชุดติดตั้ง)
- [Telegram](/th/channels/telegram) — Bot API ผ่าน grammY; รองรับกลุ่ม
- [Tlon](/th/channels/tlon) — เมสเซนเจอร์ที่อิงกับ Urbit (Plugin ที่มาพร้อมชุดติดตั้ง)
- [Twitch](/th/channels/twitch) — แชต Twitch ผ่านการเชื่อมต่อ IRC (Plugin ที่มาพร้อมชุดติดตั้ง)
- [Voice Call](/th/plugins/voice-call) — โทรศัพท์ผ่าน Plivo หรือ Twilio (Plugin, ติดตั้งแยกต่างหาก)
- [WebChat](/th/web/webchat) — UI WebChat ของ Gateway ผ่าน WebSocket
- [WeChat](/th/channels/wechat) — Plugin Tencent iLink Bot ผ่านการเข้าสู่ระบบด้วย QR; เฉพาะแชตส่วนตัว (Plugin ภายนอก)
- [WhatsApp](/th/channels/whatsapp) — ได้รับความนิยมมากที่สุด; ใช้ Baileys และต้องจับคู่ด้วย QR
- [Yuanbao](/th/channels/yuanbao) — บอต Tencent Yuanbao (Plugin ภายนอก)
- [Zalo](/th/channels/zalo) — Zalo Bot API; เมสเซนเจอร์ยอดนิยมของเวียดนาม (Plugin ที่มาพร้อมชุดติดตั้ง)
- [Zalo Personal](/th/channels/zalouser) — บัญชีส่วนตัว Zalo ผ่านการเข้าสู่ระบบด้วย QR (Plugin ที่มาพร้อมชุดติดตั้ง)

## หมายเหตุ

- ช่องทางสามารถทำงานพร้อมกันได้; ตั้งค่าหลายช่องทาง แล้ว OpenClaw จะจัดเส้นทางตามแต่ละแชต
- การตั้งค่าที่เร็วที่สุดโดยทั่วไปคือ **Telegram** (โทเค็นบอตแบบเรียบง่าย) WhatsApp ต้องจับคู่ด้วย QR และ
  เก็บสถานะไว้บนดิสก์มากกว่า
- พฤติกรรมกลุ่มจะแตกต่างกันไปตามช่องทาง; ดู [กลุ่ม](/th/channels/groups)
- การจับคู่ DM และรายการอนุญาตถูกบังคับใช้เพื่อความปลอดภัย; ดู [ความปลอดภัย](/th/gateway/security)
- การแก้ไขปัญหา: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- ผู้ให้บริการโมเดลมีเอกสารแยกต่างหาก; ดู [ผู้ให้บริการโมเดล](/th/providers/models)
