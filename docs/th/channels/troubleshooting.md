---
read_when:
    - ทรานสปอร์ตของช่องทางระบุว่าเชื่อมต่อแล้ว แต่การตอบกลับล้มเหลว
    - คุณต้องตรวจสอบเฉพาะช่องทางก่อนอ่านเอกสารเชิงลึกของผู้ให้บริการ
summary: การแก้ไขปัญหาระดับช่องทางอย่างรวดเร็ว พร้อมสัญญาณบ่งชี้ความล้มเหลวและวิธีแก้ไขของแต่ละช่องทาง
title: การแก้ไขปัญหาช่องทาง
x-i18n:
    generated_at: "2026-04-30T09:40:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

ใช้หน้านี้เมื่อ channel เชื่อมต่อแล้ว แต่ลักษณะการทำงานไม่ถูกต้อง

## ลำดับคำสั่ง

รันคำสั่งเหล่านี้ตามลำดับก่อน:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

ค่าพื้นฐานที่ปกติ:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, หรือ `admin-capable`
- การตรวจสอบ channel แสดงว่า transport เชื่อมต่อแล้ว และเมื่อรองรับ จะแสดง `works` หรือ `audit ok`

## WhatsApp

### สัญญาณความล้มเหลวของ WhatsApp

| อาการ | การตรวจสอบที่เร็วที่สุด | วิธีแก้ |
| ------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| เชื่อมต่อแล้วแต่ไม่มีการตอบกลับ DM | `openclaw pairing list whatsapp` | อนุมัติผู้ส่ง หรือเปลี่ยนนโยบาย/allowlist ของ DM |
| ข้อความกลุ่มถูกละเว้น | ตรวจสอบ `requireMention` + รูปแบบการ mention ใน config | mention บอต หรือผ่อนคลายนโยบายการ mention สำหรับกลุ่มนั้น |
| การเข้าสู่ระบบด้วย QR หมดเวลาด้วย 408 | ตรวจสอบ env `HTTPS_PROXY` / `HTTP_PROXY` ของ gateway | ตั้งค่า proxy ที่เข้าถึงได้ ใช้ `NO_PROXY` เฉพาะสำหรับการ bypass |
| การตัดการเชื่อมต่อ/วนเข้าสู่ระบบใหม่แบบสุ่ม | `openclaw channels status --probe` + logs | การ reconnect ล่าสุดจะถูกทำเครื่องหมายแม้ตอนนี้จะเชื่อมต่ออยู่ ดู logs, รีสตาร์ท gateway แล้ว relink หากยังคง flapping ต่อไป |

การแก้ปัญหาแบบเต็ม: [การแก้ปัญหา WhatsApp](/th/channels/whatsapp#troubleshooting)

## Telegram

### สัญญาณความล้มเหลวของ Telegram

| อาการ | การตรวจสอบที่เร็วที่สุด | วิธีแก้ |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` แต่ไม่มี flow ตอบกลับที่ใช้งานได้ | `openclaw pairing list telegram` | อนุมัติ pairing หรือเปลี่ยนนโยบาย DM |
| บอตออนไลน์แต่กลุ่มยังเงียบ | ตรวจสอบข้อกำหนดการ mention และโหมดความเป็นส่วนตัวของบอต | ปิดโหมดความเป็นส่วนตัวเพื่อให้มองเห็นในกลุ่ม หรือ mention บอต |
| ส่งล้มเหลวพร้อมข้อผิดพลาดเครือข่าย | ตรวจสอบ logs สำหรับความล้มเหลวในการเรียก Telegram API | แก้ DNS/IPv6/proxy routing ไปยัง `api.telegram.org` |
| ตอนเริ่มต้นรายงานว่า `getMe returned 401` | ตรวจสอบแหล่งที่มาของ token ที่กำหนดค่าไว้ | คัดลอกใหม่หรือสร้าง token ของ BotFather ใหม่ แล้วอัปเดต `botToken`, `tokenFile`, หรือ default-account `TELEGRAM_BOT_TOKEN` |
| Polling ค้างหรือ reconnect ช้า | `openclaw logs --follow` สำหรับ diagnostics ของ polling | อัปเกรด หากการรีสตาร์ทเป็นผลบวกลวง ให้ปรับ `pollingStallThresholdMs` การค้างต่อเนื่องยังคงชี้ไปที่ proxy/DNS/IPv6 |
| `setMyCommands` ถูกปฏิเสธตอนเริ่มต้น | ตรวจสอบ logs สำหรับ `BOT_COMMANDS_TOO_MUCH` | ลดคำสั่ง Telegram ของ plugin/skill/custom หรือปิด native menus |
| อัปเกรดแล้ว allowlist บล็อกคุณ | `openclaw security audit` และ allowlists ใน config | รัน `openclaw doctor --fix` หรือแทนที่ `@username` ด้วย ID ผู้ส่งแบบตัวเลข |

การแก้ปัญหาแบบเต็ม: [การแก้ปัญหา Telegram](/th/channels/telegram#troubleshooting)

## Discord

### สัญญาณความล้มเหลวของ Discord

| อาการ | การตรวจสอบที่เร็วที่สุด | วิธีแก้ |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| บอตออนไลน์แต่ไม่มีการตอบกลับใน guild | `openclaw channels status --probe` | อนุญาต guild/channel และตรวจสอบ message content intent |
| ข้อความกลุ่มถูกละเว้น | ตรวจสอบ logs สำหรับการ drop จาก mention gating | mention บอต หรือกำหนด `requireMention: false` ของ guild/channel |
| ไม่มีการตอบกลับ DM | `openclaw pairing list discord` | อนุมัติ DM pairing หรือปรับนโยบาย DM |

การแก้ปัญหาแบบเต็ม: [การแก้ปัญหา Discord](/th/channels/discord#troubleshooting)

## Slack

### สัญญาณความล้มเหลวของ Slack

| อาการ | การตรวจสอบที่เร็วที่สุด | วิธีแก้ |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode เชื่อมต่อแล้วแต่ไม่มีการตอบสนอง | `openclaw channels status --probe` | ตรวจสอบ app token + bot token และ scopes ที่จำเป็น เฝ้าดู `botTokenStatus` / `appTokenStatus = configured_unavailable` บนการตั้งค่าที่รองรับด้วย SecretRef |
| DM ถูกบล็อก | `openclaw pairing list slack` | อนุมัติ pairing หรือผ่อนคลายนโยบาย DM |
| ข้อความใน channel ถูกละเว้น | ตรวจสอบ `groupPolicy` และ channel allowlist | อนุญาต channel หรือเปลี่ยนนโยบายเป็น `open` |

การแก้ปัญหาแบบเต็ม: [การแก้ปัญหา Slack](/th/channels/slack#troubleshooting)

## iMessage และ BlueBubbles

### สัญญาณความล้มเหลวของ iMessage และ BlueBubbles

| อาการ | การตรวจสอบที่เร็วที่สุด | วิธีแก้ |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| ไม่มี event ขาเข้า | ตรวจสอบการเข้าถึง webhook/server และสิทธิ์ของแอป | แก้ URL ของ webhook หรือสถานะ server ของ BlueBubbles |
| ส่งได้แต่รับไม่ได้บน macOS | ตรวจสอบสิทธิ์ความเป็นส่วนตัวของ macOS สำหรับ automation ของ Messages | ให้สิทธิ์ TCC ใหม่ แล้วรีสตาร์ทกระบวนการ channel |
| ผู้ส่ง DM ถูกบล็อก | `openclaw pairing list imessage` หรือ `openclaw pairing list bluebubbles` | อนุมัติ pairing หรืออัปเดต allowlist |

การแก้ปัญหาแบบเต็ม:

- [การแก้ปัญหา iMessage](/th/channels/imessage#troubleshooting)
- [การแก้ปัญหา BlueBubbles](/th/channels/bluebubbles#troubleshooting)

## Signal

### สัญญาณความล้มเหลวของ Signal

| อาการ | การตรวจสอบที่เร็วที่สุด | วิธีแก้ |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Daemon เข้าถึงได้แต่บอตเงียบ | `openclaw channels status --probe` | ตรวจสอบ URL/account ของ daemon `signal-cli` และ receive mode |
| DM ถูกบล็อก | `openclaw pairing list signal` | อนุมัติผู้ส่ง หรือปรับนโยบาย DM |
| การตอบกลับกลุ่มไม่ถูก trigger | ตรวจสอบ group allowlist และรูปแบบการ mention | เพิ่มผู้ส่ง/กลุ่ม หรือผ่อนคลาย gating |

การแก้ปัญหาแบบเต็ม: [การแก้ปัญหา Signal](/th/channels/signal#troubleshooting)

## QQ Bot

### สัญญาณความล้มเหลวของ QQ Bot

| อาการ | การตรวจสอบที่เร็วที่สุด | วิธีแก้ |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| บอตตอบว่า "ไปดาวอังคารแล้ว" | ตรวจสอบ `appId` และ `clientSecret` ใน config | ตั้งค่า credentials หรือรีสตาร์ท gateway |
| ไม่มีข้อความขาเข้า | `openclaw channels status --probe` | ตรวจสอบ credentials บน QQ Open Platform |
| เสียงไม่ได้รับการถอดความ | ตรวจสอบ config ของผู้ให้บริการ STT | กำหนดค่า `channels.qqbot.stt` หรือ `tools.media.audio` |
| ข้อความเชิงรุกไม่มาถึง | ตรวจสอบข้อกำหนดการโต้ตอบของแพลตฟอร์ม QQ | QQ อาจบล็อกข้อความที่บอตเริ่มก่อน หากไม่มีการโต้ตอบล่าสุด |

การแก้ปัญหาแบบเต็ม: [การแก้ปัญหา QQ Bot](/th/channels/qqbot#troubleshooting)

## Matrix

### สัญญาณความล้มเหลวของ Matrix

| อาการ | การตรวจสอบที่เร็วที่สุด | วิธีแก้ |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| เข้าสู่ระบบแล้วแต่ละเว้นข้อความใน room | `openclaw channels status --probe` | ตรวจสอบ `groupPolicy`, room allowlist และ mention gating |
| DM ไม่ถูกประมวลผล | `openclaw pairing list matrix` | อนุมัติผู้ส่ง หรือปรับนโยบาย DM |
| rooms ที่เข้ารหัสล้มเหลว | `openclaw matrix verify status` | ยืนยันอุปกรณ์อีกครั้ง แล้วตรวจสอบ `openclaw matrix verify backup status` |
| การ restore backup ค้างอยู่/เสียหาย | `openclaw matrix verify backup status` | รัน `openclaw matrix verify backup restore` หรือรันใหม่พร้อม recovery key |
| Cross-signing/bootstrap ดูผิดปกติ | `openclaw matrix verify bootstrap` | ซ่อม secret storage, cross-signing และสถานะ backup ในรอบเดียว |

การตั้งค่าและ config แบบเต็ม: [Matrix](/th/channels/matrix)

## ที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Channel routing](/th/channels/channel-routing)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
