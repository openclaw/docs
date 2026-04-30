---
read_when:
    - คุณต้องการเลือกช่องทางแชทสำหรับ OpenClaw
    - คุณต้องการดูภาพรวมอย่างรวดเร็วของแพลตฟอร์มการรับส่งข้อความที่รองรับ
summary: แพลตฟอร์มรับส่งข้อความที่ OpenClaw สามารถเชื่อมต่อได้
title: ช่องทางแชท
x-i18n:
    generated_at: "2026-04-30T09:36:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw สามารถคุยกับคุณบนแอปแชตใดก็ได้ที่คุณใช้อยู่แล้ว แต่ละช่องทางเชื่อมต่อผ่าน Gateway
รองรับข้อความในทุกที่ ส่วนสื่อและรีแอ็กชันจะแตกต่างกันไปตามช่องทาง

## หมายเหตุการส่ง

- การตอบกลับของ Telegram ที่มีไวยากรณ์รูปภาพแบบ markdown เช่น `![alt](url)`
  จะถูกแปลงเป็นการตอบกลับแบบสื่อในเส้นทางขาออกขั้นสุดท้ายเมื่อทำได้
- DM หลายคนของ Slack จะถูกกำหนดเส้นทางเป็นแชตกลุ่ม ดังนั้นนโยบายกลุ่ม พฤติกรรมการกล่าวถึง
  และกฎเซสชันกลุ่มจะมีผลกับการสนทนา MPIM
- การตั้งค่า WhatsApp เป็นแบบติดตั้งเมื่อต้องการ: onboarding สามารถแสดงโฟลว์การตั้งค่าก่อน
  ที่ runtime dependencies ของ Baileys จะถูกจัดเตรียม และ Gateway จะโหลด runtime ของ WhatsApp
  เฉพาะเมื่อช่องทางนั้นเปิดใช้งานจริงเท่านั้น

## ช่องทางที่รองรับ

- [BlueBubbles](/th/channels/bluebubbles) — **แนะนำสำหรับ iMessage**; ใช้ REST API ของเซิร์ฟเวอร์ BlueBubbles บน macOS พร้อมการรองรับฟีเจอร์เต็มรูปแบบ (Plugin ที่รวมมาให้; แก้ไข, ยกเลิกส่ง, เอฟเฟกต์, รีแอ็กชัน, การจัดการกลุ่ม — ขณะนี้การแก้ไขเสียอยู่บน macOS 26 Tahoe)
- [Discord](/th/channels/discord) — Discord Bot API + Gateway; รองรับเซิร์ฟเวอร์ ช่องทาง และ DM
- [Feishu](/th/channels/feishu) — บอต Feishu/Lark ผ่าน WebSocket (Plugin ที่รวมมาให้)
- [Google Chat](/th/channels/googlechat) — แอป Google Chat API ผ่าน HTTP Webhook
- [iMessage (legacy)](/th/channels/imessage) — การผสานรวม macOS แบบเดิมผ่าน imsg CLI (เลิกใช้แล้ว ใช้ BlueBubbles สำหรับการตั้งค่าใหม่)
- [IRC](/th/channels/irc) — เซิร์ฟเวอร์ IRC แบบคลาสสิก; ช่องทาง + DM พร้อมการควบคุมการจับคู่/allowlist
- [LINE](/th/channels/line) — บอต LINE Messaging API (Plugin ที่รวมมาให้)
- [Matrix](/th/channels/matrix) — โปรโตคอล Matrix (Plugin ที่รวมมาให้)
- [Mattermost](/th/channels/mattermost) — Bot API + WebSocket; ช่องทาง กลุ่ม DM (Plugin ที่รวมมาให้)
- [Microsoft Teams](/th/channels/msteams) — Bot Framework; รองรับองค์กร (Plugin ที่รวมมาให้)
- [Nextcloud Talk](/th/channels/nextcloud-talk) — แชตแบบโฮสต์เองผ่าน Nextcloud Talk (Plugin ที่รวมมาให้)
- [Nostr](/th/channels/nostr) — DM แบบกระจายศูนย์ผ่าน NIP-04 (Plugin ที่รวมมาให้)
- [QQ Bot](/th/channels/qqbot) — QQ Bot API; แชตส่วนตัว แชตกลุ่ม และสื่อแบบ rich media (Plugin ที่รวมมาให้)
- [Signal](/th/channels/signal) — signal-cli; เน้นความเป็นส่วนตัว
- [Slack](/th/channels/slack) — Bolt SDK; แอปสำหรับ workspace
- [Synology Chat](/th/channels/synology-chat) — Synology NAS Chat ผ่าน Webhook ขาออก+ขาเข้า (Plugin ที่รวมมาให้)
- [Telegram](/th/channels/telegram) — Bot API ผ่าน grammY; รองรับกลุ่ม
- [Tlon](/th/channels/tlon) — เมสเซนเจอร์ที่อิง Urbit (Plugin ที่รวมมาให้)
- [Twitch](/th/channels/twitch) — แชต Twitch ผ่านการเชื่อมต่อ IRC (Plugin ที่รวมมาให้)
- [Voice Call](/th/plugins/voice-call) — โทรศัพท์ผ่าน Plivo หรือ Twilio (Plugin ที่ติดตั้งแยกต่างหาก)
- [WebChat](/th/web/webchat) — UI ของ Gateway WebChat ผ่าน WebSocket
- [WeChat](/th/channels/wechat) — Plugin Tencent iLink Bot ผ่านการเข้าสู่ระบบด้วย QR; แชตส่วนตัวเท่านั้น (Plugin ภายนอก)
- [WhatsApp](/th/channels/whatsapp) — ได้รับความนิยมมากที่สุด; ใช้ Baileys และต้องจับคู่ด้วย QR
- [Yuanbao](/th/channels/yuanbao) — บอต Tencent Yuanbao (Plugin ภายนอก)
- [Zalo](/th/channels/zalo) — Zalo Bot API; เมสเซนเจอร์ยอดนิยมของเวียดนาม (Plugin ที่รวมมาให้)
- [Zalo Personal](/th/channels/zalouser) — บัญชีส่วนตัว Zalo ผ่านการเข้าสู่ระบบด้วย QR (Plugin ที่รวมมาให้)

## หมายเหตุ

- ช่องทางต่าง ๆ สามารถทำงานพร้อมกันได้; ตั้งค่าหลายช่องทาง แล้ว OpenClaw จะกำหนดเส้นทางตามแชต
- การตั้งค่าที่เร็วที่สุดโดยทั่วไปคือ **Telegram** (โทเค็นบอตแบบง่าย) WhatsApp ต้องจับคู่ด้วย QR และ
  จัดเก็บสถานะบนดิสก์มากกว่า
- พฤติกรรมกลุ่มแตกต่างกันไปตามช่องทาง; ดู [กลุ่ม](/th/channels/groups)
- การจับคู่ DM และ allowlist ถูกบังคับใช้เพื่อความปลอดภัย; ดู [ความปลอดภัย](/th/gateway/security)
- การแก้ไขปัญหา: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- ผู้ให้บริการโมเดลมีเอกสารแยกต่างหาก; ดู [ผู้ให้บริการโมเดล](/th/providers/models)
