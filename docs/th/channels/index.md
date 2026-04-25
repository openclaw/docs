---
read_when:
    - คุณต้องการเลือกช่องทางแชตสำหรับ OpenClaw
    - คุณต้องการภาพรวมอย่างรวดเร็วของแพลตฟอร์มรับส่งข้อความที่รองรับ
summary: แพลตฟอร์มรับส่งข้อความที่ OpenClaw สามารถเชื่อมต่อได้
title: ช่องทางแชต
x-i18n:
    generated_at: "2026-04-25T13:41:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

OpenClaw สามารถคุยกับคุณได้บนแอปแชตใดก็ได้ที่คุณใช้อยู่แล้ว แต่ละช่องทางเชื่อมต่อผ่าน Gateway
รองรับข้อความตัวอักษรทุกช่องทาง ส่วนสื่อและการตอบสนองจะแตกต่างกันไปตามแต่ละช่องทาง

## หมายเหตุเกี่ยวกับการส่งข้อความ

- การตอบกลับใน Telegram ที่มีไวยากรณ์ภาพแบบ markdown เช่น `![alt](url)` จะถูกแปลงเป็นการตอบกลับแบบสื่อในเส้นทางขาออกสุดท้ายเมื่อเป็นไปได้
- DM แบบหลายคนใน Slack จะถูกส่งต่อเป็นแชตกลุ่ม ดังนั้นนโยบายกลุ่ม พฤติกรรมของการ mention และกฎของเซสชันกลุ่มจะมีผลกับการสนทนา MPIM
- การตั้งค่า WhatsApp เป็นแบบติดตั้งเมื่อมีการใช้งาน: ขั้นตอนเริ่มต้นใช้งานอาจแสดงโฟลว์การตั้งค่าก่อนที่ dependency ของรันไทม์ Baileys จะถูกเตรียมไว้ และ Gateway จะโหลดรันไทม์ของ WhatsApp ก็ต่อเมื่อช่องทางนั้นถูกใช้งานจริงเท่านั้น

## ช่องทางที่รองรับ

- [BlueBubbles](/th/channels/bluebubbles) — **แนะนำสำหรับ iMessage**; ใช้ REST API ของเซิร์ฟเวอร์ BlueBubbles บน macOS พร้อมการรองรับฟีเจอร์ครบถ้วน (Plugin ที่รวมมาให้; แก้ไข ยกเลิกส่ง เอฟเฟกต์ รีแอ็กชัน การจัดการกลุ่ม — การแก้ไขยังใช้งานไม่ได้บน macOS 26 Tahoe ในขณะนี้)
- [Discord](/th/channels/discord) — Discord Bot API + Gateway; รองรับเซิร์ฟเวอร์ ช่อง และ DM
- [Feishu](/th/channels/feishu) — บอต Feishu/Lark ผ่าน WebSocket (Plugin ที่รวมมาให้)
- [Google Chat](/th/channels/googlechat) — แอป Google Chat API ผ่าน HTTP webhook
- [iMessage (legacy)](/th/channels/imessage) — การเชื่อมต่อ macOS แบบเดิมผ่าน imsg CLI (เลิกใช้งานแล้ว สำหรับการตั้งค่าใหม่ให้ใช้ BlueBubbles)
- [IRC](/th/channels/irc) — เซิร์ฟเวอร์ IRC แบบดั้งเดิม; ช่อง + DM พร้อมตัวควบคุมการจับคู่/allowlist
- [LINE](/th/channels/line) — บอต LINE Messaging API (Plugin ที่รวมมาให้)
- [Matrix](/th/channels/matrix) — โปรโตคอล Matrix (Plugin ที่รวมมาให้)
- [Mattermost](/th/channels/mattermost) — Bot API + WebSocket; ช่อง กลุ่ม DM (Plugin ที่รวมมาให้)
- [Microsoft Teams](/th/channels/msteams) — Bot Framework; รองรับระดับองค์กร (Plugin ที่รวมมาให้)
- [Nextcloud Talk](/th/channels/nextcloud-talk) — แชตที่โฮสต์เองผ่าน Nextcloud Talk (Plugin ที่รวมมาให้)
- [Nostr](/th/channels/nostr) — DM แบบกระจายศูนย์ผ่าน NIP-04 (Plugin ที่รวมมาให้)
- [QQ Bot](/th/channels/qqbot) — QQ Bot API; แชตส่วนตัว แชตกลุ่ม และสื่อแบบสมบูรณ์ (Plugin ที่รวมมาให้)
- [Signal](/th/channels/signal) — signal-cli; เน้นความเป็นส่วนตัว
- [Slack](/th/channels/slack) — Bolt SDK; แอปสำหรับ workspace
- [Synology Chat](/th/channels/synology-chat) — Synology NAS Chat ผ่าน Webhook ขาออก+ขาเข้า (Plugin ที่รวมมาให้)
- [Telegram](/th/channels/telegram) — Bot API ผ่าน grammY; รองรับกลุ่ม
- [Tlon](/th/channels/tlon) — เมสเซนเจอร์ที่ใช้ Urbit (Plugin ที่รวมมาให้)
- [Twitch](/th/channels/twitch) — แชต Twitch ผ่านการเชื่อมต่อ IRC (Plugin ที่รวมมาให้)
- [Voice Call](/th/plugins/voice-call) — โทรศัพท์ผ่าน Plivo หรือ Twilio (Plugin ติดตั้งแยกต่างหาก)
- [WebChat](/th/web/webchat) — UI ของ Gateway WebChat ผ่าน WebSocket
- [WeChat](/th/channels/wechat) — Plugin บอต Tencent iLink ผ่านการเข้าสู่ระบบด้วย QR; รองรับเฉพาะแชตส่วนตัว (Plugin ภายนอก)
- [WhatsApp](/th/channels/whatsapp) — ได้รับความนิยมมากที่สุด; ใช้ Baileys และต้องจับคู่ด้วย QR
- [Zalo](/th/channels/zalo) — Zalo Bot API; เมสเซนเจอร์ยอดนิยมของเวียดนาม (Plugin ที่รวมมาให้)
- [Zalo Personal](/th/channels/zalouser) — บัญชีส่วนตัว Zalo ผ่านการเข้าสู่ระบบด้วย QR (Plugin ที่รวมมาให้)

## หมายเหตุ

- ช่องทางสามารถทำงานพร้อมกันได้; ตั้งค่าหลายช่องทางได้ และ OpenClaw จะกำหนดเส้นทางตามแต่ละแชต
- การตั้งค่าที่เร็วที่สุดมักจะเป็น **Telegram** (โทเค็นบอตแบบง่าย) ส่วน WhatsApp ต้องจับคู่ด้วย QR และจัดเก็บสถานะไว้บนดิสก์มากกว่า
- พฤติกรรมของกลุ่มแตกต่างกันไปตามแต่ละช่องทาง; ดู [Groups](/th/channels/groups)
- มีการบังคับใช้การจับคู่ DM และ allowlist เพื่อความปลอดภัย; ดู [Security](/th/gateway/security)
- การแก้ปัญหา: [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting)
- ผู้ให้บริการ model มีเอกสารแยกต่างหาก; ดู [Model Providers](/th/providers/models)
