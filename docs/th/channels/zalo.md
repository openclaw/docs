---
read_when:
    - การทำงานกับฟีเจอร์หรือ Webhook ของ Zalo
summary: สถานะการรองรับบอต Zalo ความสามารถ และการกำหนดค่า
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
---

สถานะ: ทดลอง รองรับ DM แล้ว ส่วน [ความสามารถ](#capabilities) ด้านล่างสะท้อนพฤติกรรมปัจจุบันของบอต Marketplace

## Plugin ที่รวมมาด้วย

Zalo มาพร้อมเป็น Plugin ที่รวมอยู่แล้วใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แพ็กเกจปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Zalo ให้ติดตั้งแพ็กเกจ npm โดยตรง:

- ติดตั้งผ่าน CLI: `openclaw plugins install @openclaw/zalo`
- เวอร์ชันที่ปักหมุด: `openclaw plugins install @openclaw/zalo@2026.5.2`
- หรือจากซอร์ส checkout: `openclaw plugins install ./path/to/local/zalo-plugin`
- รายละเอียด: [Plugins](/th/tools/plugin)

## ตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบว่า Plugin Zalo พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมไว้แล้ว
   - การติดตั้งรุ่นเก่า/แบบกำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. ตั้งค่าโทเค็น:
   - Env: `ZALO_BOT_TOKEN=...`
   - หรือ config: `channels.zalo.accounts.default.botToken: "..."`.
3. รีสตาร์ท gateway (หรือทำการตั้งค่าให้เสร็จ)
4. การเข้าถึง DM ใช้การจับคู่เป็นค่าเริ่มต้น อนุมัติรหัสจับคู่เมื่อมีการติดต่อครั้งแรก

config ขั้นต่ำ:

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

## คืออะไร

Zalo เป็นแอปส่งข้อความที่เน้นเวียดนามเป็นหลัก Bot API ของ Zalo ช่วยให้ Gateway รันบอตสำหรับการสนทนาแบบ 1:1 ได้
เหมาะกับงานสนับสนุนหรือการแจ้งเตือนที่คุณต้องการให้เส้นทางกลับไปยัง Zalo แบบกำหนดแน่นอน

หน้านี้สะท้อนพฤติกรรมปัจจุบันของ OpenClaw สำหรับ **Zalo Bot Creator / บอต Marketplace**
**บอต Zalo Official Account (OA)** เป็นพื้นผิวผลิตภัณฑ์ Zalo อีกแบบหนึ่งและอาจมีพฤติกรรมต่างกัน

- ช่องทาง Zalo Bot API ที่ Gateway เป็นเจ้าของ
- การกำหนดเส้นทางแบบแน่นอน: การตอบกลับกลับไปที่ Zalo เสมอ โมเดลไม่เลือกช่องทางเอง
- DM ใช้เซสชันหลักของ agent ร่วมกัน
- ส่วน [ความสามารถ](#capabilities) ด้านล่างแสดงการรองรับปัจจุบันของบอต Marketplace

## ตั้งค่า (เส้นทางเร็ว)

### 1) สร้างโทเค็นบอต (Zalo Bot Platform)

1. ไปที่ [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) แล้วลงชื่อเข้าใช้
2. สร้างบอตใหม่และกำหนดการตั้งค่า
3. คัดลอกโทเค็นบอตแบบเต็ม (โดยทั่วไปคือ `numeric_id:secret`) สำหรับบอต Marketplace โทเค็น runtime ที่ใช้งานได้อาจปรากฏในข้อความต้อนรับของบอตหลังสร้าง

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

หากภายหลังคุณย้ายไปยังพื้นผิวบอต Zalo ที่มีกลุ่มให้ใช้งาน คุณสามารถเพิ่ม config เฉพาะกลุ่ม เช่น `groupPolicy` และ `groupAllowFrom` ได้อย่างชัดเจน สำหรับพฤติกรรมบอต Marketplace ปัจจุบัน โปรดดู [ความสามารถ](#capabilities)

ตัวเลือก env: `ZALO_BOT_TOKEN=...` (ใช้ได้เฉพาะบัญชี default)

การรองรับหลายบัญชี: ใช้ `channels.zalo.accounts` พร้อมโทเค็นแยกต่อบัญชีและ `name` ที่ไม่บังคับ

3. รีสตาร์ท gateway Zalo จะเริ่มทำงานเมื่อ resolve โทเค็นได้แล้ว (env หรือ config)
4. การเข้าถึง DM ใช้การจับคู่เป็นค่าเริ่มต้น อนุมัติรหัสเมื่อมีการติดต่อบอตครั้งแรก

## ทำงานอย่างไร (พฤติกรรม)

- ข้อความขาเข้าจะถูกปรับให้อยู่ใน envelope ช่องทางที่ใช้ร่วมกันพร้อม placeholder สำหรับสื่อ
- การตอบกลับจะถูกส่งกลับไปยังแชต Zalo เดิมเสมอ
- ใช้ long-polling เป็นค่าเริ่มต้น มีโหมด webhook พร้อมใช้งานด้วย `channels.zalo.webhookUrl`

## ข้อจำกัด

- ข้อความขาออกถูกแบ่งเป็นชิ้นละ 2000 อักขระ (ข้อจำกัดของ Zalo API)
- การดาวน์โหลด/อัปโหลดสื่อถูกจำกัดด้วย `channels.zalo.mediaMaxMb` (ค่าเริ่มต้น 5)
- การสตรีมถูกบล็อกเป็นค่าเริ่มต้น เนื่องจากข้อจำกัด 2000 อักขระทำให้การสตรีมมีประโยชน์น้อยลง

## การควบคุมการเข้าถึง (DM)

### การเข้าถึง DM

- ค่าเริ่มต้น: `channels.zalo.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ ข้อความจะถูกละเว้นจนกว่าจะได้รับอนุมัติ (รหัสหมดอายุหลัง 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- การจับคู่เป็นการแลกเปลี่ยนโทเค็นค่าเริ่มต้น รายละเอียด: [Pairing](/th/channels/pairing)
- `channels.zalo.allowFrom` รับ ID ผู้ใช้แบบตัวเลข (ไม่มีการค้นหาชื่อผู้ใช้)

## การควบคุมการเข้าถึง (กลุ่ม)

สำหรับ **Zalo Bot Creator / บอต Marketplace** การรองรับกลุ่มยังใช้งานจริงไม่ได้ เพราะไม่สามารถเพิ่มบอตเข้ากลุ่มได้เลย

หมายความว่า key config ที่เกี่ยวกับกลุ่มด้านล่างมีอยู่ใน schema แต่ไม่สามารถใช้กับบอต Marketplace ได้:

- `channels.zalo.groupPolicy` ควบคุมการจัดการขาเข้าของกลุ่ม: `open | allowlist | disabled`
- `channels.zalo.groupAllowFrom` จำกัดว่า ID ผู้ส่งใดสามารถเรียกใช้บอตในกลุ่มได้
- หากไม่ได้ตั้งค่า `groupAllowFrom` Zalo จะ fallback ไปใช้ `allowFrom` สำหรับการตรวจสอบผู้ส่ง
- หมายเหตุ runtime: หากไม่มี `channels.zalo` เลย runtime ยัง fallback ไปที่ `groupPolicy="allowlist"` เพื่อความปลอดภัย

ค่าของนโยบายกลุ่ม (เมื่อพื้นผิวบอตของคุณมีการเข้าถึงกลุ่มให้ใช้งาน) คือ:

- `groupPolicy: "disabled"` — บล็อกข้อความกลุ่มทั้งหมด
- `groupPolicy: "open"` — อนุญาตสมาชิกกลุ่มใดก็ได้ (ต้องผ่าน mention gate)
- `groupPolicy: "allowlist"` — ค่าเริ่มต้นแบบปิดเมื่อไม่ผ่านเงื่อนไข รับเฉพาะผู้ส่งที่อนุญาตเท่านั้น

หากคุณใช้พื้นผิวผลิตภัณฑ์บอต Zalo แบบอื่นและตรวจสอบแล้วว่าพฤติกรรมกลุ่มทำงานได้ ให้บันทึกแยกต่างหากแทนการสมมติว่าตรงกับ flow ของบอต Marketplace

## Long-polling เทียบกับ webhook

- ค่าเริ่มต้น: long-polling (ไม่ต้องมี URL สาธารณะ)
- โหมด webhook: ตั้งค่า `channels.zalo.webhookUrl` และ `channels.zalo.webhookSecret`
  - webhook secret ต้องมี 8-256 อักขระ
  - Webhook URL ต้องใช้ HTTPS
  - Zalo ส่ง event พร้อม header `X-Bot-Api-Secret-Token` สำหรับการตรวจสอบ
  - HTTP ของ Gateway จัดการคำขอ webhook ที่ `channels.zalo.webhookPath` (ค่าเริ่มต้นคือ path ของ webhook URL)
  - คำขอต้องใช้ `Content-Type: application/json` (หรือ media type แบบ `+json`)
  - event ซ้ำ (`event_name + message_id`) จะถูกละเว้นในช่วง replay window สั้น ๆ
  - ทราฟฟิกแบบ burst ถูก rate-limit ต่อ path/source และอาจส่งคืน HTTP 429

**หมายเหตุ:** getUpdates (polling) และ webhook ใช้ร่วมกันไม่ได้ต่อเอกสาร Zalo API

## ประเภทข้อความที่รองรับ

สำหรับภาพรวมการรองรับอย่างรวดเร็ว โปรดดู [ความสามารถ](#capabilities) หมายเหตุด้านล่างเพิ่มรายละเอียดในจุดที่พฤติกรรมต้องการบริบทเพิ่มเติม

- **ข้อความตัวอักษร**: รองรับเต็มรูปแบบพร้อมการแบ่งชิ้นที่ 2000 อักขระ
- **URL ธรรมดาในข้อความ**: ทำงานเหมือนข้อความ input ปกติ
- **ตัวอย่างลิงก์ / rich link cards**: ดูสถานะบอต Marketplace ใน [ความสามารถ](#capabilities) สิ่งเหล่านี้ไม่ได้ trigger การตอบกลับอย่างน่าเชื่อถือ
- **ข้อความรูปภาพ**: ดูสถานะบอต Marketplace ใน [ความสามารถ](#capabilities) การจัดการรูปภาพขาเข้าไม่น่าเชื่อถือ (แสดงตัวบ่งชี้กำลังพิมพ์โดยไม่มีการตอบกลับสุดท้าย)
- **สติกเกอร์**: ดูสถานะบอต Marketplace ใน [ความสามารถ](#capabilities)
- **บันทึกเสียง / ไฟล์เสียง / วิดีโอ / ไฟล์แนบทั่วไป**: ดูสถานะบอต Marketplace ใน [ความสามารถ](#capabilities)
- **ประเภทที่ไม่รองรับ**: ถูกบันทึกใน log (เช่น ข้อความจากผู้ใช้ที่ได้รับการป้องกัน)

## ความสามารถ

ตารางนี้สรุปพฤติกรรมปัจจุบันของ **Zalo Bot Creator / บอต Marketplace** ใน OpenClaw

| ฟีเจอร์                     | สถานะ                                  |
| --------------------------- | --------------------------------------- |
| ข้อความโดยตรง              | ✅ รองรับ                            |
| กลุ่ม                      | ❌ ไม่พร้อมใช้งานสำหรับบอต Marketplace   |
| สื่อ (รูปภาพขาเข้า)      | ⚠️ จำกัด / ตรวจสอบในสภาพแวดล้อมของคุณ |
| สื่อ (รูปภาพขาออก)     | ⚠️ ยังไม่ได้ทดสอบซ้ำสำหรับบอต Marketplace   |
| URL ธรรมดาในข้อความ          | ✅ รองรับ                            |
| ตัวอย่างลิงก์               | ⚠️ ไม่น่าเชื่อถือสำหรับบอต Marketplace      |
| รีแอ็กชัน                   | ❌ ไม่รองรับ                        |
| สติกเกอร์                    | ⚠️ ไม่มีการตอบกลับจาก agent สำหรับบอต Marketplace  |
| บันทึกเสียง / เสียง / วิดีโอ | ⚠️ ไม่มีการตอบกลับจาก agent สำหรับบอต Marketplace  |
| ไฟล์แนบ            | ⚠️ ไม่มีการตอบกลับจาก agent สำหรับบอต Marketplace  |
| เธรด                     | ❌ ไม่รองรับ                        |
| โพล                       | ❌ ไม่รองรับ                        |
| คำสั่งเนทีฟ             | ❌ ไม่รองรับ                        |
| การสตรีม                   | ⚠️ ถูกบล็อก (ข้อจำกัด 2000 อักขระ)            |

## เป้าหมายการส่ง (CLI/Cron)

- ใช้ chat id เป็นเป้าหมาย
- ตัวอย่าง: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## การแก้ไขปัญหา

**บอตไม่ตอบสนอง:**

- ตรวจสอบว่าโทเค็นถูกต้อง: `openclaw channels status --probe`
- ตรวจสอบว่าผู้ส่งได้รับอนุมัติแล้ว (pairing หรือ allowFrom)
- ตรวจสอบ log ของ gateway: `openclaw logs --follow`

**Webhook ไม่ได้รับ event:**

- ตรวจสอบให้แน่ใจว่า webhook URL ใช้ HTTPS
- ตรวจสอบว่า secret token มี 8-256 อักขระ
- ยืนยันว่า endpoint HTTP ของ gateway เข้าถึงได้บน path ที่กำหนดค่าไว้
- ตรวจสอบว่า getUpdates polling ไม่ได้กำลังทำงานอยู่ (ทั้งสองใช้ร่วมกันไม่ได้)

## อ้างอิงการกำหนดค่า (Zalo)

การกำหนดค่าเต็ม: [Configuration](/th/gateway/configuration)

key ระดับบนแบบ flat (`channels.zalo.botToken`, `channels.zalo.dmPolicy` และรายการที่คล้ายกัน) เป็น shorthand บัญชีเดียวแบบ legacy สำหรับ config ใหม่ แนะนำให้ใช้ `channels.zalo.accounts.<id>.*` ทั้งสองรูปแบบยังคงบันทึกไว้ที่นี่เพราะมีอยู่ใน schema

ตัวเลือก provider:

- `channels.zalo.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.zalo.botToken`: โทเค็นบอตจาก Zalo Bot Platform
- `channels.zalo.tokenFile`: อ่านโทเค็นจาก path ไฟล์ปกติ Symlink จะถูกปฏิเสธ
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.zalo.allowFrom`: allowlist สำหรับ DM (ID ผู้ใช้) `open` ต้องใช้ `"*"` wizard จะถามหา ID แบบตัวเลข
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist) มีอยู่ใน config; ดู [ความสามารถ](#capabilities) และ [การควบคุมการเข้าถึง (กลุ่ม)](#access-control-groups) สำหรับพฤติกรรมบอต Marketplace ปัจจุบัน
- `channels.zalo.groupAllowFrom`: allowlist ผู้ส่งในกลุ่ม (ID ผู้ใช้) fallback ไปใช้ `allowFrom` เมื่อไม่ได้ตั้งค่า
- `channels.zalo.mediaMaxMb`: เพดานสื่อขาเข้า/ขาออก (MB, ค่าเริ่มต้น 5)
- `channels.zalo.webhookUrl`: เปิดใช้งานโหมด webhook (ต้องใช้ HTTPS)
- `channels.zalo.webhookSecret`: webhook secret (8-256 อักขระ)
- `channels.zalo.webhookPath`: path webhook บนเซิร์ฟเวอร์ HTTP ของ gateway
- `channels.zalo.proxy`: URL proxy สำหรับคำขอ API

ตัวเลือกหลายบัญชี:

- `channels.zalo.accounts.<id>.botToken`: โทเค็นต่อบัญชี
- `channels.zalo.accounts.<id>.tokenFile`: ไฟล์โทเค็นปกติต่อบัญชี Symlink จะถูกปฏิเสธ
- `channels.zalo.accounts.<id>.name`: ชื่อที่แสดง
- `channels.zalo.accounts.<id>.enabled`: เปิด/ปิดบัญชี
- `channels.zalo.accounts.<id>.dmPolicy`: นโยบาย DM ต่อบัญชี
- `channels.zalo.accounts.<id>.allowFrom`: allowlist ต่อบัญชี
- `channels.zalo.accounts.<id>.groupPolicy`: นโยบายกลุ่มต่อบัญชี มีอยู่ใน config; ดู [ความสามารถ](#capabilities) และ [การควบคุมการเข้าถึง (กลุ่ม)](#access-control-groups) สำหรับพฤติกรรมบอต Marketplace ปัจจุบัน
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist ผู้ส่งในกลุ่มต่อบัญชี
- `channels.zalo.accounts.<id>.webhookUrl`: URL webhook ต่อบัญชี
- `channels.zalo.accounts.<id>.webhookSecret`: webhook secret ต่อบัญชี
- `channels.zalo.accounts.<id>.webhookPath`: path webhook ต่อบัญชี
- `channels.zalo.accounts.<id>.proxy`: URL proxy ต่อบัญชี

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและ mention gating
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
