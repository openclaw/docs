---
read_when:
    - กำลังทำงานกับฟีเจอร์ช่องทาง Tlon/Urbit
summary: สถานะการรองรับ Tlon/Urbit ความสามารถ และการกำหนดค่า
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon เป็นเมสเซนเจอร์แบบกระจายศูนย์ที่สร้างบน Urbit OpenClaw เชื่อมต่อกับ Urbit ship ของคุณและสามารถ
ตอบ DM และข้อความแชทกลุ่มได้ โดยค่าเริ่มต้น การตอบกลับในกลุ่มต้องมีการกล่าวถึงด้วย @ และสามารถ
จำกัดเพิ่มเติมผ่าน allowlist ได้

สถานะ: Plugin ที่รวมมาในแพ็กเกจ รองรับ DM, การกล่าวถึงในกลุ่ม, การตอบกลับในเธรด, การจัดรูปแบบ rich text และ
การอัปโหลดรูปภาพ ยังไม่รองรับรีแอ็กชันและโพล

## Plugin ที่รวมมาในแพ็กเกจ

Tlon มาพร้อมเป็น Plugin ที่รวมมาในแพ็กเกจใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจตามปกติ
จึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Tlon ให้ติดตั้ง
แพ็กเกจ npm ปัจจุบัน:

ติดตั้งผ่าน CLI (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

ใช้แพ็กเกจเปล่าเพื่อให้ตามแท็กรุ่นทางการปัจจุบัน ปักหมุดเวอร์ชันที่แน่นอน
เฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่า

1. ตรวจสอบว่า Plugin Tlon พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมมาให้อยู่แล้ว
   - การติดตั้งรุ่นเก่า/แบบกำหนดเองสามารถเพิ่มด้วยตนเองได้ด้วยคำสั่งด้านบน
2. รวบรวม URL ของ ship และโค้ดเข้าสู่ระบบ
3. กำหนดค่า `channels.tlon`
4. รีสตาร์ท Gateway
5. DM บอทหรือกล่าวถึงบอทในช่องกลุ่ม

การกำหนดค่าขั้นต่ำ (บัญชีเดียว):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Ship ส่วนตัว/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อกชื่อโฮสต์และช่วง IP ส่วนตัว/ภายในเพื่อป้องกัน SSRF
หาก ship ของคุณรันอยู่บนเครือข่ายส่วนตัว (localhost, LAN IP หรือชื่อโฮสต์ภายใน)
คุณต้องเลือกเปิดใช้งานอย่างชัดเจน:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

การตั้งค่านี้ใช้กับ URL เช่น:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ เปิดใช้งานเฉพาะเมื่อคุณเชื่อถือเครือข่ายภายในของคุณเท่านั้น การตั้งค่านี้จะปิดการป้องกัน SSRF
สำหรับคำขอไปยัง URL ของ ship ของคุณ

## ช่องกลุ่ม

การค้นหาอัตโนมัติเปิดใช้งานโดยค่าเริ่มต้น คุณยังสามารถปักหมุดช่องด้วยตนเองได้:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

ปิดใช้งานการค้นหาอัตโนมัติ:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## การควบคุมการเข้าถึง

allowlist สำหรับ DM (ว่าง = ไม่อนุญาต DM ให้ใช้ `ownerShip` สำหรับโฟลว์การอนุมัติ):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

การอนุญาตกลุ่ม (จำกัดโดยค่าเริ่มต้น):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## ระบบเจ้าของและการอนุมัติ

ตั้งค่า owner ship เพื่อรับคำขออนุมัติเมื่อผู้ใช้ที่ไม่ได้รับอนุญาตพยายามโต้ตอบ:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

owner ship จะได้รับอนุญาต **โดยอัตโนมัติทุกที่** — คำเชิญ DM จะถูกยอมรับอัตโนมัติ และ
ข้อความในช่องจะได้รับอนุญาตเสมอ คุณไม่จำเป็นต้องเพิ่มเจ้าของลงใน `dmAllowlist` หรือ
`defaultAuthorizedShips`

เมื่อตั้งค่าแล้ว เจ้าของจะได้รับการแจ้งเตือนทาง DM สำหรับ:

- คำขอ DM จาก ship ที่ไม่อยู่ใน allowlist
- การกล่าวถึงในช่องที่ไม่มีการอนุญาต
- คำขอเชิญเข้ากลุ่ม

## การตั้งค่าการยอมรับอัตโนมัติ

ยอมรับคำเชิญ DM อัตโนมัติ (สำหรับ ship ใน dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

ยอมรับคำเชิญเข้ากลุ่มอัตโนมัติ:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## เป้าหมายการส่งมอบ (CLI/cron)

ใช้สิ่งเหล่านี้กับ `openclaw message send` หรือการส่งมอบด้วย cron:

- DM: `~sampel-palnet` หรือ `dm/~sampel-palnet`
- กลุ่ม: `chat/~host-ship/channel` หรือ `group:~host-ship/channel`

## Skills ที่รวมมาในแพ็กเกจ

Plugin Tlon รวม Skills ที่มาพร้อมแพ็กเกจ ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
ซึ่งให้การเข้าถึงการทำงานของ Tlon ผ่าน CLI:

- **ผู้ติดต่อ**: รับ/อัปเดตโปรไฟล์, แสดงรายการผู้ติดต่อ
- **ช่อง**: แสดงรายการ, สร้าง, โพสต์ข้อความ, ดึงประวัติ
- **กลุ่ม**: แสดงรายการ, สร้าง, จัดการสมาชิก
- **DM**: ส่งข้อความ, รีแอ็กต์ต่อข้อความ
- **รีแอ็กชัน**: เพิ่ม/ลบรีแอ็กชันอีโมจิในโพสต์และ DM
- **การตั้งค่า**: จัดการสิทธิ์ Plugin ผ่านคำสั่ง slash

Skills จะพร้อมใช้งานโดยอัตโนมัติเมื่อติดตั้ง Plugin แล้ว

## ความสามารถ

| ฟีเจอร์         | สถานะ                                  |
| --------------- | --------------------------------------- |
| ข้อความโดยตรง | ✅ รองรับ                            |
| กลุ่ม/ช่อง | ✅ รองรับ (ต้องกล่าวถึงโดยค่าเริ่มต้น) |
| เธรด         | ✅ รองรับ (ตอบกลับอัตโนมัติในเธรด)   |
| Rich text       | ✅ แปลง Markdown เป็นรูปแบบ Tlon    |
| รูปภาพ          | ✅ อัปโหลดไปยังพื้นที่จัดเก็บของ Tlon             |
| รีแอ็กชัน       | ✅ ผ่าน [Skills ที่รวมมาในแพ็กเกจ](#bundled-skill)  |
| โพล           | ❌ ยังไม่รองรับ                    |
| คำสั่งเนทีฟ | ✅ รองรับ (เฉพาะเจ้าของโดยค่าเริ่มต้น)    |

## การแก้ไขปัญหา

รันขั้นตอนต่อไปนี้ก่อน:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

ข้อผิดพลาดที่พบบ่อย:

- **DM ถูกละเว้น**: ผู้ส่งไม่อยู่ใน `dmAllowlist` และไม่ได้กำหนดค่า `ownerShip` สำหรับโฟลว์การอนุมัติ
- **ข้อความกลุ่มถูกละเว้น**: ไม่พบช่องหรือผู้ส่งไม่ได้รับอนุญาต
- **ข้อผิดพลาดการเชื่อมต่อ**: ตรวจสอบว่าเข้าถึง URL ของ ship ได้; เปิดใช้ `allowPrivateNetwork` สำหรับ ship ในเครื่อง
- **ข้อผิดพลาดการยืนยันตัวตน**: ตรวจสอบว่าโค้ดเข้าสู่ระบบยังเป็นปัจจุบัน (โค้ดจะหมุนเวียน)

## อ้างอิงการกำหนดค่า

การกำหนดค่าฉบับเต็ม: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกผู้ให้บริการ:

- `channels.tlon.enabled`: เปิด/ปิดการเริ่มต้นช่อง
- `channels.tlon.ship`: ชื่อ Urbit ship ของบอท (เช่น `~sampel-palnet`)
- `channels.tlon.url`: URL ของ ship (เช่น `https://sampel-palnet.tlon.network`)
- `channels.tlon.code`: โค้ดเข้าสู่ระบบของ ship
- `channels.tlon.allowPrivateNetwork`: อนุญาต URL localhost/LAN (บายพาส SSRF)
- `channels.tlon.ownerShip`: owner ship สำหรับระบบการอนุมัติ (ได้รับอนุญาตเสมอ)
- `channels.tlon.dmAllowlist`: ship ที่อนุญาตให้ DM (ว่าง = ไม่มี)
- `channels.tlon.autoAcceptDmInvites`: ยอมรับ DM จาก ship ที่อยู่ใน allowlist โดยอัตโนมัติ
- `channels.tlon.autoAcceptGroupInvites`: ยอมรับคำเชิญเข้ากลุ่มทั้งหมดโดยอัตโนมัติ
- `channels.tlon.autoDiscoverChannels`: ค้นหาช่องกลุ่มโดยอัตโนมัติ (ค่าเริ่มต้น: true)
- `channels.tlon.groupChannels`: channel nest ที่ปักหมุดด้วยตนเอง
- `channels.tlon.defaultAuthorizedShips`: ship ที่ได้รับอนุญาตสำหรับทุกช่อง
- `channels.tlon.authorization.channelRules`: กฎการยืนยันสิทธิ์รายช่อง
- `channels.tlon.showModelSignature`: ต่อท้ายชื่อโมเดลในข้อความ

## หมายเหตุ

- การตอบกลับในกลุ่มต้องมีการกล่าวถึง (เช่น `~your-bot-ship`) เพื่อให้ตอบกลับ
- การตอบกลับในเธรด: หากข้อความขาเข้าอยู่ในเธรด OpenClaw จะตอบกลับในเธรด
- Rich text: การจัดรูปแบบ Markdown (ตัวหนา, ตัวเอียง, โค้ด, หัวเรื่อง, รายการ) จะถูกแปลงเป็นรูปแบบเนทีฟของ Tlon
- รูปภาพ: URL จะถูกอัปโหลดไปยังพื้นที่จัดเก็บของ Tlon และฝังเป็นบล็อกรูปภาพ

## ที่เกี่ยวข้อง

- [ภาพรวมช่อง](/th/channels) — ช่องทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนและโฟลว์การจับคู่ผ่าน DM
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการกำกับด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
