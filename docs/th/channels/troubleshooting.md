---
read_when:
    - ทรานสปอร์ตของช่องทางระบุว่าเชื่อมต่อแล้ว แต่การตอบกลับล้มเหลว
    - คุณต้องตรวจสอบเฉพาะช่องทางก่อนลงลึกในเอกสารของผู้ให้บริการ
summary: การแก้ปัญหาระดับช่องทางอย่างรวดเร็ว พร้อมลักษณะความล้มเหลวและวิธีแก้ไขสำหรับแต่ละช่องทาง
title: การแก้ไขปัญหาช่องทาง
x-i18n:
    generated_at: "2026-05-05T08:25:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
    source_path: channels/troubleshooting.md
    workflow: 16
---

ใช้หน้านี้เมื่อช่องทางเชื่อมต่อได้แต่พฤติกรรมไม่ถูกต้อง

## ลำดับคำสั่ง

เรียกใช้คำสั่งเหล่านี้ตามลำดับก่อน:

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
- การ probe ช่องทางแสดงว่า transport เชื่อมต่อแล้ว และเมื่อรองรับ จะแสดง `works` หรือ `audit ok`

## WhatsApp

### รูปแบบความล้มเหลวของ WhatsApp

| อาการ                                | การตรวจสอบที่เร็วที่สุด                            | วิธีแก้                                                                                                                               |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| เชื่อมต่อแล้วแต่ไม่มีการตอบกลับข้อความส่วนตัว | `openclaw pairing list whatsapp`                    | อนุมัติผู้ส่งหรือเปลี่ยนนโยบายข้อความส่วนตัว/รายการอนุญาต                                                                           |
| ข้อความกลุ่มถูกละเลย                | ตรวจสอบ `requireMention` + รูปแบบการ mention ใน config | mention บอทหรือผ่อนปรนนโยบายการ mention สำหรับกลุ่มนั้น                                                                              |
| การเข้าสู่ระบบด้วย QR หมดเวลาด้วย 408 | ตรวจสอบ env `HTTPS_PROXY` / `HTTP_PROXY` ของ Gateway | ตั้งค่า proxy ที่เข้าถึงได้ ใช้ `NO_PROXY` เฉพาะสำหรับการข้าม proxy                                                                  |
| ตัดการเชื่อมต่อ/เข้าสู่ระบบใหม่แบบสุ่มวนซ้ำ | `openclaw channels status --probe` + logs           | การ reconnect ล่าสุดจะถูกทำเครื่องหมายแม้ขณะนี้จะเชื่อมต่ออยู่ ดู logs, restart Gateway, แล้ว relink หากยังคงสลับสถานะต่อเนื่อง |
| การตอบกลับมาช้าเป็นวินาที/นาที      | `openclaw doctor --fix`                             | Doctor จะหยุดไคลเอนต์ TUI ในเครื่องที่ตรวจยืนยันแล้วว่า stale เมื่อไคลเอนต์เหล่านั้นทำให้ event loop ของ Gateway แย่ลง          |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา WhatsApp](/th/channels/whatsapp#troubleshooting)

## Telegram

### รูปแบบความล้มเหลวของ Telegram

| อาการ                                 | การตรวจสอบที่เร็วที่สุด                         | วิธีแก้                                                                                                                              |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/start` แต่ไม่มีลำดับการตอบกลับที่ใช้งานได้ | `openclaw pairing list telegram`                 | อนุมัติการ pairing หรือเปลี่ยนนโยบายข้อความส่วนตัว                                                                                  |
| บอทออนไลน์แต่กลุ่มยังเงียบ           | ตรวจสอบข้อกำหนดการ mention และโหมดความเป็นส่วนตัวของบอท | ปิดโหมดความเป็นส่วนตัวเพื่อให้เห็นข้อความกลุ่ม หรือ mention บอท                                                                      |
| การส่งล้มเหลวพร้อมข้อผิดพลาดเครือข่าย | ตรวจ logs สำหรับความล้มเหลวของการเรียก Telegram API | แก้ไขการกำหนดเส้นทาง DNS/IPv6/proxy ไปยัง `api.telegram.org`                                                                         |
| ตอนเริ่มทำงานรายงาน `getMe returned 401` | ตรวจสอบแหล่ง token ที่กำหนดค่าไว้              | คัดลอกใหม่หรือสร้าง token ของ BotFather ใหม่ แล้วอัปเดต `botToken`, `tokenFile`, หรือ default-account `TELEGRAM_BOT_TOKEN`        |
| Polling ค้างหรือ reconnect ช้า        | `openclaw logs --follow` สำหรับ diagnostics ของ polling | อัปเกรด หากการ restart เป็น false positives ให้ปรับ `pollingStallThresholdMs` อาการค้างต่อเนื่องยังชี้ไปที่ proxy/DNS/IPv6 |
| `setMyCommands` ถูกปฏิเสธตอนเริ่มทำงาน | ตรวจ logs สำหรับ `BOT_COMMANDS_TOO_MUCH`         | ลดจำนวนคำสั่ง Telegram จาก Plugin/Skill/custom หรือปิด native menus                                                                  |
| อัปเกรดแล้วรายการอนุญาตบล็อกคุณ      | `openclaw security audit` และ allowlists ใน config | เรียกใช้ `openclaw doctor --fix` หรือแทนที่ `@username` ด้วย ID ผู้ส่งแบบตัวเลข                                                     |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา Telegram](/th/channels/telegram#troubleshooting)

## Discord

### รูปแบบความล้มเหลวของ Discord

| อาการ                                      | การตรวจสอบที่เร็วที่สุด                                               | วิธีแก้                                                                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| บอทออนไลน์แต่ไม่มีการตอบกลับใน guild       | `openclaw channels status --probe`                                     | อนุญาต guild/channel และตรวจสอบ message content intent                                                                                                                       |
| ข้อความกลุ่มถูกละเลย                       | ตรวจ logs สำหรับการตัดทิ้งจาก mention gating                          | mention บอทหรือตั้งค่า guild/channel `requireMention: false`                                                                                                                 |
| มีการพิมพ์/ใช้ token แต่ไม่มีข้อความ Discord | Session log แสดงข้อความ assistant พร้อม `didSendViaMessagingTool: false` | โมเดลตอบแบบส่วนตัวแทนที่จะเรียก message tool ใช้โมเดลที่เชื่อถือได้สำหรับ tool-call หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อโพสต์อัตโนมัติ |
| ข้อความส่วนตัวไม่ตอบกลับ                   | `openclaw pairing list discord`                                        | อนุมัติการ pairing ข้อความส่วนตัวหรือปรับนโยบายข้อความส่วนตัว                                                                                                               |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา Discord](/th/channels/discord#troubleshooting)

## Slack

### รูปแบบความล้มเหลวของ Slack

| อาการ                                   | การตรวจสอบที่เร็วที่สุด                 | วิธีแก้                                                                                                                                                    |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| socket mode เชื่อมต่อแล้วแต่ไม่มีการตอบสนอง | `openclaw channels status --probe`        | ตรวจสอบ app token + bot token และ scopes ที่จำเป็น เฝ้าดู `botTokenStatus` / `appTokenStatus = configured_unavailable` ในการตั้งค่าที่ใช้ SecretRef |
| ข้อความส่วนตัวถูกบล็อก                 | `openclaw pairing list slack`             | อนุมัติการ pairing หรือผ่อนปรนนโยบายข้อความส่วนตัว                                                                                                         |
| ข้อความใน channel ถูกละเลย             | ตรวจสอบ `groupPolicy` และรายการอนุญาตของ channel | อนุญาต channel หรือเปลี่ยนนโยบายเป็น `open`                                                                                                                |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา Slack](/th/channels/slack#troubleshooting)

## iMessage และ BlueBubbles

### รูปแบบความล้มเหลวของ iMessage และ BlueBubbles

| อาการ                              | การตรวจสอบที่เร็วที่สุด                                             | วิธีแก้                                                   |
| -------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| ไม่มีเหตุการณ์ขาเข้า               | ตรวจสอบการเข้าถึงได้ของ webhook/server และสิทธิ์ของแอป                 | แก้ไข webhook URL หรือสถานะ server ของ BlueBubbles       |
| ส่งได้แต่รับไม่ได้บน macOS         | ตรวจสอบสิทธิ์ความเป็นส่วนตัวของ macOS สำหรับ Messages automation       | ให้สิทธิ์ TCC ใหม่และ restart โปรเซสของช่องทาง           |
| ผู้ส่งข้อความส่วนตัวถูกบล็อก       | `openclaw pairing list imessage` หรือ `openclaw pairing list bluebubbles` | อนุมัติการ pairing หรืออัปเดตรายการอนุญาต                 |

การแก้ไขปัญหาแบบเต็ม:

- [การแก้ไขปัญหา iMessage](/th/channels/imessage#troubleshooting)
- [การแก้ไขปัญหา BlueBubbles](/th/channels/bluebubbles#troubleshooting)

## Signal

### รูปแบบความล้มเหลวของ Signal

| อาการ                              | การตรวจสอบที่เร็วที่สุด                 | วิธีแก้                                                      |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| daemon เข้าถึงได้แต่บอทเงียบ      | `openclaw channels status --probe`         | ตรวจสอบ URL/account ของ daemon `signal-cli` และโหมดรับข้อความ |
| ข้อความส่วนตัวถูกบล็อก            | `openclaw pairing list signal`             | อนุมัติผู้ส่งหรือปรับนโยบายข้อความส่วนตัว                    |
| การตอบกลับในกลุ่มไม่ถูก trigger   | ตรวจสอบรายการอนุญาตของกลุ่มและรูปแบบการ mention | เพิ่มผู้ส่ง/กลุ่ม หรือผ่อนปรน gating                         |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา Signal](/th/channels/signal#troubleshooting)

## QQ Bot

### รูปแบบความล้มเหลวของ QQ Bot

| อาการ                              | การตรวจสอบที่เร็วที่สุด                    | วิธีแก้                                                             |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| บอทตอบว่า "gone to Mars"         | ตรวจสอบ `appId` และ `clientSecret` ใน config | ตั้งค่า credentials หรือ restart Gateway                            |
| ไม่มีข้อความขาเข้า                | `openclaw channels status --probe`          | ตรวจสอบ credentials บน QQ Open Platform                             |
| เสียงไม่ได้ถูกถอดความ             | ตรวจสอบ config ของผู้ให้บริการ STT          | กำหนดค่า `channels.qqbot.stt` หรือ `tools.media.audio`              |
| ข้อความเชิงรุกไม่มาถึง            | ตรวจสอบข้อกำหนดการโต้ตอบของแพลตฟอร์ม QQ     | QQ อาจบล็อกข้อความที่บอทเริ่มส่งเองหากไม่มีการโต้ตอบล่าสุด          |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา QQ Bot](/th/channels/qqbot#troubleshooting)

## Matrix

### รูปแบบความล้มเหลวของ Matrix

| อาการ                                 | การตรวจสอบที่เร็วที่สุด                 | วิธีแก้                                                                       |
| ----------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| เข้าสู่ระบบแล้วแต่ละเลยข้อความในห้อง | `openclaw channels status --probe`     | ตรวจสอบ `groupPolicy`, รายการอนุญาตของห้อง และ mention gating                |
| ข้อความส่วนตัวไม่ถูกประมวลผล         | `openclaw pairing list matrix`         | อนุมัติผู้ส่งหรือปรับนโยบายข้อความส่วนตัว                                     |
| ห้องที่เข้ารหัสล้มเหลว               | `openclaw matrix verify status`        | ยืนยันอุปกรณ์อีกครั้ง แล้วตรวจสอบ `openclaw matrix verify backup status`     |
| การ restore backup ค้าง/เสีย         | `openclaw matrix verify backup status` | เรียกใช้ `openclaw matrix verify backup restore` หรือเรียกใหม่ด้วย recovery key |
| cross-signing/bootstrap ดูผิดปกติ    | `openclaw matrix verify bootstrap`     | ซ่อมแซม secret storage, cross-signing และสถานะ backup ในรอบเดียว             |

การตั้งค่าและ config แบบเต็ม: [Matrix](/th/channels/matrix)

## ที่เกี่ยวข้อง

- [การ Pairing](/th/channels/pairing)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
