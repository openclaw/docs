---
read_when:
    - กำลังทำงานกับฟีเจอร์หรือ Webhook ของ Zalo
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของ Zalo bot
title: Zalo
x-i18n:
    generated_at: "2026-04-25T13:42:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

สถานะ: experimental รองรับ DM ส่วน [Capabilities](#capabilities) ด้านล่างสะท้อนพฤติกรรมปัจจุบันของ Marketplace bot

## Plugin ที่รวมมาให้

Zalo มาพร้อมเป็น Plugin ที่รวมมาให้ใน OpenClaw รุ่นปัจจุบัน ดังนั้น
build แบบแพ็กเกจปกติไม่ต้องติดตั้งแยก

หากคุณใช้รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Zalo ให้ติดตั้งด้วยตนเอง:

- ติดตั้งผ่าน CLI: `openclaw plugins install @openclaw/zalo`
- หรือจาก source checkout: `openclaw plugins install ./path/to/local/zalo-plugin`
- รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าแบบรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Plugin Zalo พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมมาให้อยู่แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้เองด้วยคำสั่งด้านบน
2. ตั้งค่าโทเค็น:
   - Env: `ZALO_BOT_TOKEN=...`
   - หรือ config: `channels.zalo.accounts.default.botToken: "..."`
3. รีสตาร์ต gateway (หรือทำขั้นตอนตั้งค่าให้เสร็จ)
4. การเข้าถึง DM ใช้ pairing เป็นค่าเริ่มต้น; อนุมัติรหัส pairing เมื่อมีการติดต่อครั้งแรก

การกำหนดค่าขั้นต่ำ:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## มันคืออะไร

Zalo เป็นแอปรับส่งข้อความที่เน้นตลาดเวียดนาม; Bot API ของมันช่วยให้ Gateway รันบอตสำหรับการสนทนาแบบ 1:1 ได้
เหมาะสำหรับงานซัพพอร์ตหรือการแจ้งเตือนในกรณีที่คุณต้องการการกำหนดเส้นทางกลับไปยัง Zalo อย่างแน่นอน

หน้านี้สะท้อนพฤติกรรมปัจจุบันของ OpenClaw สำหรับ **Zalo Bot Creator / Marketplace bots**
ส่วน **Zalo Official Account (OA) bots** เป็นผลิตภัณฑ์อีกพื้นผิวหนึ่งของ Zalo และอาจทำงานแตกต่างออกไป

- ช่องทาง Zalo Bot API ที่ Gateway เป็นผู้ถือครอง
- การกำหนดเส้นทางแบบแน่นอน: การตอบกลับจะส่งกลับไปยัง Zalo; model จะไม่เป็นผู้เลือกช่องทาง
- DM ใช้เซสชันหลักของเอเจนต์ร่วมกัน
- ส่วน [Capabilities](#capabilities) ด้านล่างแสดงการรองรับ Marketplace bot ในปัจจุบัน

## การตั้งค่า (เส้นทางด่วน)

### 1) สร้างโทเค็นบอต (Zalo Bot Platform)

1. ไปที่ [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) และลงชื่อเข้าใช้
2. สร้างบอตใหม่และกำหนดค่าการตั้งค่าของมัน
3. คัดลอกโทเค็นบอตแบบเต็ม (โดยทั่วไปคือ `numeric_id:secret`) สำหรับ Marketplace bots โทเค็นรันไทม์ที่ใช้งานได้อาจปรากฏในข้อความต้อนรับของบอตหลังสร้างเสร็จ

### 2) กำหนดค่าโทเค็น (env หรือ config)

ตัวอย่าง:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

หากในภายหลังคุณย้ายไปใช้พื้นผิวบอต Zalo ที่รองรับกลุ่ม คุณสามารถเพิ่ม config เฉพาะกลุ่ม เช่น `groupPolicy` และ `groupAllowFrom` ได้อย่างชัดเจน สำหรับพฤติกรรม Marketplace bot ปัจจุบัน ดู [Capabilities](#capabilities)

ตัวเลือก env: `ZALO_BOT_TOKEN=...` (ใช้ได้กับบัญชีค่าเริ่มต้นเท่านั้น)

รองรับหลายบัญชี: ใช้ `channels.zalo.accounts` พร้อมโทเค็นรายบัญชีและ `name` แบบไม่บังคับ

3. รีสตาร์ต gateway Zalo จะเริ่มทำงานเมื่อ resolve โทเค็นได้แล้ว (จาก env หรือ config)
4. การเข้าถึง DM ใช้ pairing เป็นค่าเริ่มต้น อนุมัติรหัสเมื่อมีการติดต่อบอตครั้งแรก

## วิธีการทำงาน (พฤติกรรม)

- ข้อความขาเข้าจะถูกทำให้เป็นมาตรฐานเข้าสู่ shared channel envelope พร้อม placeholder ของสื่อ
- การตอบกลับจะถูกกำหนดเส้นทางกลับไปยังแชต Zalo เดิมเสมอ
- ใช้ long-polling เป็นค่าเริ่มต้น; มีโหมด Webhook ผ่าน `channels.zalo.webhookUrl`

## ข้อจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นช่วงละ 2000 อักขระ (ขีดจำกัดของ Zalo API)
- การดาวน์โหลด/อัปโหลดสื่อถูกจำกัดด้วย `channels.zalo.mediaMaxMb` (ค่าเริ่มต้น 5)
- การสตรีมถูกบล็อกเป็นค่าเริ่มต้น เนื่องจากข้อจำกัด 2000 อักขระทำให้การสตรีมมีประโยชน์น้อยลง

## การควบคุมการเข้าถึง (DM)

### การเข้าถึง DM

- ค่าเริ่มต้น: `channels.zalo.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing; ข้อความจะถูกละเลยจนกว่าจะได้รับการอนุมัติ (รหัสหมดอายุภายใน 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing เป็นการแลกเปลี่ยนโทเค็นแบบค่าเริ่มต้น รายละเอียด: [Pairing](/th/channels/pairing)
- `channels.zalo.allowFrom` รับ user ID แบบตัวเลข (ไม่มีการค้นหาจาก username)

## การควบคุมการเข้าถึง (Groups)

สำหรับ **Zalo Bot Creator / Marketplace bots** การรองรับกลุ่มยังไม่พร้อมใช้งานจริง เนื่องจากไม่สามารถเพิ่มบอตเข้าไปในกลุ่มได้เลย

นั่นหมายความว่าคีย์ config ที่เกี่ยวกับกลุ่มด้านล่างมีอยู่ใน schema แต่ไม่สามารถใช้งานได้สำหรับ Marketplace bots:

- `channels.zalo.groupPolicy` ควบคุมการจัดการข้อความขาเข้าของกลุ่ม: `open | allowlist | disabled`
- `channels.zalo.groupAllowFrom` จำกัดว่า sender ID ใดบ้างที่สามารถเรียกใช้บอตในกลุ่มได้
- หากไม่ได้ตั้งค่า `groupAllowFrom` Zalo จะ fallback ไปใช้ `allowFrom` สำหรับการตรวจสอบผู้ส่ง
- หมายเหตุด้านรันไทม์: หากไม่มี `channels.zalo` เลย รันไทม์จะยัง fallback เป็น `groupPolicy="allowlist"` เพื่อความปลอดภัย

ค่าของ group policy (เมื่อพื้นผิวบอตของคุณรองรับการเข้าถึงกลุ่ม) คือ:

- `groupPolicy: "disabled"` — บล็อกข้อความกลุ่มทั้งหมด
- `groupPolicy: "open"` — อนุญาตสมาชิกกลุ่มทุกคน (ต้องมี mention)
- `groupPolicy: "allowlist"` — ค่าเริ่มต้นแบบ fail-closed; อนุญาตเฉพาะผู้ส่งที่อยู่ในรายการเท่านั้น

หากคุณใช้พื้นผิวผลิตภัณฑ์บอต Zalo แบบอื่นและได้ยืนยันแล้วว่าพฤติกรรมกลุ่มใช้งานได้จริง ให้บันทึกเอกสารแยกต่างหากแทนที่จะสมมติว่าเหมือนกับโฟลว์ของ Marketplace bot

## Long-polling เทียบกับ Webhook

- ค่าเริ่มต้น: long-polling (ไม่ต้องใช้ URL สาธารณะ)
- โหมด Webhook: ตั้งค่า `channels.zalo.webhookUrl` และ `channels.zalo.webhookSecret`
  - webhook secret ต้องมีความยาว 8-256 อักขระ
  - URL ของ Webhook ต้องใช้ HTTPS
  - Zalo ส่ง event พร้อม header `X-Bot-Api-Secret-Token` เพื่อใช้ตรวจสอบ
  - HTTP ของ Gateway จะจัดการคำขอ Webhook ที่ `channels.zalo.webhookPath` (ค่าเริ่มต้นคือ path ของ webhook URL)
  - คำขอต้องใช้ `Content-Type: application/json` (หรือ media type แบบ `+json`)
  - event ซ้ำ (`event_name + message_id`) จะถูกละเลยภายในช่วง replay window สั้น ๆ
  - ทราฟฟิกแบบ burst จะถูกจำกัดอัตราต่อ path/source และอาจตอบกลับเป็น HTTP 429

**หมายเหตุ:** ตามเอกสารของ Zalo API นั้น getUpdates (polling) และ webhook ใช้งานร่วมกันไม่ได้

## ประเภทข้อความที่รองรับ

สำหรับภาพรวมการรองรับแบบรวดเร็ว ดู [Capabilities](#capabilities) หมายเหตุด้านล่างจะเพิ่มรายละเอียดในจุดที่พฤติกรรมต้องการบริบทเพิ่มเติม

- **ข้อความตัวอักษร**: รองรับเต็มรูปแบบพร้อมการแบ่งช่วง 2000 อักขระ
- **URL แบบข้อความล้วนในข้อความ**: ทำงานเหมือนข้อความปกติ
- **ตัวอย่างลิงก์ / rich link cards**: ดูสถานะของ Marketplace bot ใน [Capabilities](#capabilities); ไม่สามารถกระตุ้นให้ตอบกลับได้อย่างเชื่อถือได้
- **ข้อความรูปภาพ**: ดูสถานะของ Marketplace bot ใน [Capabilities](#capabilities); การจัดการรูปภาพขาเข้าไม่น่าเชื่อถือ (มีตัวบ่งชี้ว่ากำลังพิมพ์แต่ไม่มีการตอบกลับสุดท้าย)
- **Stickers**: ดูสถานะของ Marketplace bot ใน [Capabilities](#capabilities)
- **voice notes / ไฟล์เสียง / วิดีโอ / ไฟล์แนบทั่วไป**: ดูสถานะของ Marketplace bot ใน [Capabilities](#capabilities)
- **ประเภทที่ไม่รองรับ**: จะถูกบันทึกล็อกไว้ (เช่น ข้อความจากผู้ใช้ที่ได้รับการป้องกัน)

## Capabilities

ตารางนี้สรุปพฤติกรรมปัจจุบันของ **Zalo Bot Creator / Marketplace bot** ใน OpenClaw

| ฟีเจอร์                     | สถานะ                                  |
| --------------------------- | -------------------------------------- |
| ข้อความส่วนตัว             | ✅ รองรับ                              |
| Groups                      | ❌ ไม่พร้อมใช้งานสำหรับ Marketplace bots |
| สื่อ (รูปภาพขาเข้า)        | ⚠️ จำกัด / ควรตรวจสอบในสภาพแวดล้อมของคุณ |
| สื่อ (รูปภาพขาออก)         | ⚠️ ยังไม่ได้ทดสอบซ้ำสำหรับ Marketplace bots |
| URL แบบข้อความล้วนในข้อความ | ✅ รองรับ                              |
| Link previews               | ⚠️ ไม่น่าเชื่อถือสำหรับ Marketplace bots |
| Reactions                   | ❌ ไม่รองรับ                           |
| Stickers                    | ⚠️ เอเจนต์ไม่ตอบกลับสำหรับ Marketplace bots |
| Voice notes / audio / video | ⚠️ เอเจนต์ไม่ตอบกลับสำหรับ Marketplace bots |
| File attachments            | ⚠️ เอเจนต์ไม่ตอบกลับสำหรับ Marketplace bots |
| Threads                     | ❌ ไม่รองรับ                           |
| Polls                       | ❌ ไม่รองรับ                           |
| คำสั่ง native               | ❌ ไม่รองรับ                           |
| Streaming                   | ⚠️ ถูกบล็อก (ขีดจำกัด 2000 อักขระ)      |

## เป้าหมายการส่งข้อความ (CLI/cron)

- ใช้ chat id เป็นเป้าหมาย
- ตัวอย่าง: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## การแก้ปัญหา

**บอตไม่ตอบสนอง:**

- ตรวจสอบว่าโทเค็นใช้ได้: `openclaw channels status --probe`
- ยืนยันว่าผู้ส่งได้รับอนุมัติแล้ว (pairing หรือ allowFrom)
- ตรวจสอบล็อก gateway: `openclaw logs --follow`

**Webhook ไม่ได้รับ event:**

- ตรวจสอบว่า URL ของ Webhook ใช้ HTTPS
- ยืนยันว่า secret token มีความยาว 8-256 อักขระ
- ยืนยันว่าเอ็นด์พอยต์ HTTP ของ gateway เข้าถึงได้ใน path ที่กำหนด
- ตรวจสอบว่าไม่ได้รัน getUpdates polling อยู่ (ทั้งสองอย่างใช้งานร่วมกันไม่ได้)

## เอกสารอ้างอิงการกำหนดค่า (Zalo)

การกำหนดค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

คีย์ top-level แบบแบน (`channels.zalo.botToken`, `channels.zalo.dmPolicy` และอื่น ๆ ที่คล้ายกัน) เป็นรูปแบบย่อเดิมสำหรับบัญชีเดียว สำหรับ config ใหม่ ควรใช้ `channels.zalo.accounts.<id>.*` เอกสารนี้ยังแสดงทั้งสองรูปแบบไว้เพราะยังมีอยู่ใน schema

ตัวเลือก provider:

- `channels.zalo.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.zalo.botToken`: โทเค็นบอตจาก Zalo Bot Platform
- `channels.zalo.tokenFile`: อ่านโทเค็นจาก path ของไฟล์ปกติ ไม่รองรับ symlink
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.zalo.allowFrom`: allowlist ของ DM (user IDs) ค่า `open` ต้องใช้ `"*"` ตัวช่วยตั้งค่าจะถามหา ID แบบตัวเลข
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist) มีอยู่ใน config; ดู [Capabilities](#capabilities) และ [Access control (Groups)](#access-control-groups) สำหรับพฤติกรรม Marketplace bot ปัจจุบัน
- `channels.zalo.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม (user IDs) จะ fallback ไปใช้ `allowFrom` หากไม่ได้ตั้งค่า
- `channels.zalo.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออก (MB, ค่าเริ่มต้น 5)
- `channels.zalo.webhookUrl`: เปิดใช้โหมด Webhook (ต้องใช้ HTTPS)
- `channels.zalo.webhookSecret`: webhook secret (8-256 อักขระ)
- `channels.zalo.webhookPath`: path ของ Webhook บนเซิร์ฟเวอร์ HTTP ของ gateway
- `channels.zalo.proxy`: proxy URL สำหรับคำขอ API

ตัวเลือกหลายบัญชี:

- `channels.zalo.accounts.<id>.botToken`: โทเค็นรายบัญชี
- `channels.zalo.accounts.<id>.tokenFile`: ไฟล์โทเค็นปกติรายบัญชี ไม่รองรับ symlink
- `channels.zalo.accounts.<id>.name`: ชื่อที่แสดง
- `channels.zalo.accounts.<id>.enabled`: เปิด/ปิดบัญชี
- `channels.zalo.accounts.<id>.dmPolicy`: นโยบาย DM รายบัญชี
- `channels.zalo.accounts.<id>.allowFrom`: allowlist รายบัญชี
- `channels.zalo.accounts.<id>.groupPolicy`: group policy รายบัญชี มีอยู่ใน config; ดู [Capabilities](#capabilities) และ [Access control (Groups)](#access-control-groups) สำหรับพฤติกรรม Marketplace bot ปัจจุบัน
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่มรายบัญชี
- `channels.zalo.accounts.<id>.webhookUrl`: URL ของ Webhook รายบัญชี
- `channels.zalo.accounts.<id>.webhookSecret`: webhook secret รายบัญชี
- `channels.zalo.accounts.<id>.webhookPath`: path ของ Webhook รายบัญชี
- `channels.zalo.accounts.<id>.proxy`: proxy URL รายบัญชี

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์ pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการบังคับ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้ปลอดภัยยิ่งขึ้น
