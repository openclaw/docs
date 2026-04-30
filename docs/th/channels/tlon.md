---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Tlon/Urbit
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของ Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-30T09:39:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon เป็นเมสเซนเจอร์แบบกระจายศูนย์ที่สร้างบน Urbit OpenClaw เชื่อมต่อกับ Urbit ship ของคุณและสามารถ
ตอบกลับ DM และข้อความแชตกลุ่มได้ โดยค่าเริ่มต้น การตอบกลับในกลุ่มต้องมีการ @ mention และสามารถ
จำกัดเพิ่มเติมผ่าน allowlist ได้

สถานะ: Plugin ที่บันเดิลมา รองรับ DM, การ mention ในกลุ่ม, การตอบกลับในเธรด, การจัดรูปแบบ rich text และ
การอัปโหลดรูปภาพ ยังไม่รองรับ reaction และ poll

## Plugin ที่บันเดิลมา

Tlon มาพร้อมเป็น Plugin ที่บันเดิลมาใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจปกติ
ไม่จำเป็นต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Tlon ให้ติดตั้ง
แพ็กเกจ npm ปัจจุบันเมื่อมีการเผยแพร่:

ติดตั้งผ่าน CLI (npm registry เมื่อมีแพ็กเกจปัจจุบัน):

```bash
openclaw plugins install @openclaw/tlon
```

หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้แล้ว ให้ใช้บิลด์ OpenClaw
แบบแพ็กเกจปัจจุบันหรือพาธ checkout ภายในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm
ที่ใหม่กว่า

checkout ภายในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

รายละเอียด: [Plugin](/th/tools/plugin)

## การตั้งค่า

1. ตรวจสอบให้แน่ใจว่า Plugin Tlon พร้อมใช้งาน
   - OpenClaw รุ่นปัจจุบันแบบแพ็กเกจได้บันเดิลไว้แล้ว
   - การติดตั้งรุ่นเก่าหรือแบบกำหนดเองสามารถเพิ่มด้วยตนเองได้โดยใช้คำสั่งด้านบน
2. รวบรวม URL ของ ship และรหัสเข้าสู่ระบบ
3. กำหนดค่า `channels.tlon`
4. รีสตาร์ท Gateway
5. ส่ง DM ไปยังบอทหรือ mention บอทในช่องกลุ่ม

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

## ship ส่วนตัว/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อก hostname และช่วง IP ส่วนตัว/ภายในเพื่อป้องกัน SSRF
หาก ship ของคุณกำลังรันอยู่บนเครือข่ายส่วนตัว (localhost, LAN IP หรือ hostname ภายใน)
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

สิ่งนี้ใช้กับ URL เช่น:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ เปิดใช้งานเฉพาะเมื่อคุณเชื่อถือเครือข่ายภายในเครื่องของคุณเท่านั้น การตั้งค่านี้จะปิดการป้องกัน SSRF
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

allowlist สำหรับ DM (ว่าง = ไม่อนุญาต DM ใช้ `ownerShip` สำหรับ flow การอนุมัติ):

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

owner ship จะได้รับอนุญาต **โดยอัตโนมัติทุกที่** — คำเชิญ DM จะถูกยอมรับอัตโนมัติและ
ข้อความในช่องจะได้รับอนุญาตเสมอ คุณไม่จำเป็นต้องเพิ่ม owner ลงใน `dmAllowlist` หรือ
`defaultAuthorizedShips`

เมื่อตั้งค่าแล้ว owner จะได้รับการแจ้งเตือน DM สำหรับ:

- คำขอ DM จาก ship ที่ไม่อยู่ใน allowlist
- การ mention ในช่องที่ไม่มีการอนุญาต
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

ยอมรับคำเชิญกลุ่มอัตโนมัติ:

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

ใช้สิ่งเหล่านี้กับ `openclaw message send` หรือการส่งมอบผ่าน cron:

- DM: `~sampel-palnet` หรือ `dm/~sampel-palnet`
- กลุ่ม: `chat/~host-ship/channel` หรือ `group:~host-ship/channel`

## Skill ที่บันเดิลมา

Plugin Tlon มี Skill ที่บันเดิลมา ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
ซึ่งให้การเข้าถึงการดำเนินการของ Tlon ผ่าน CLI:

- **ผู้ติดต่อ**: รับ/อัปเดตโปรไฟล์, แสดงรายชื่อผู้ติดต่อ
- **ช่อง**: แสดงรายการ, สร้าง, โพสต์ข้อความ, ดึงประวัติ
- **กลุ่ม**: แสดงรายการ, สร้าง, จัดการสมาชิก
- **DM**: ส่งข้อความ, reaction ต่อข้อความ
- **Reaction**: เพิ่ม/ลบ emoji reaction ในโพสต์และ DM
- **การตั้งค่า**: จัดการสิทธิ์ Plugin ผ่านคำสั่ง slash

Skill จะพร้อมใช้งานโดยอัตโนมัติเมื่อ Plugin ถูกติดตั้ง

## ความสามารถ

| ฟีเจอร์         | สถานะ                                  |
| --------------- | --------------------------------------- |
| ข้อความโดยตรง | ✅ รองรับ                            |
| กลุ่ม/ช่อง | ✅ รองรับ (ต้อง mention โดยค่าเริ่มต้น) |
| เธรด         | ✅ รองรับ (ตอบกลับอัตโนมัติในเธรด)   |
| Rich text       | ✅ Markdown ถูกแปลงเป็นรูปแบบ Tlon    |
| รูปภาพ          | ✅ อัปโหลดไปยังพื้นที่จัดเก็บของ Tlon             |
| Reaction       | ✅ ผ่าน [Skill ที่บันเดิลมา](#bundled-skill)  |
| Poll           | ❌ ยังไม่รองรับ                    |
| คำสั่ง native | ✅ รองรับ (เฉพาะ owner โดยค่าเริ่มต้น)    |

## การแก้ไขปัญหา

รันลำดับนี้ก่อน:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

ความล้มเหลวที่พบบ่อย:

- **DM ถูกละเว้น**: ผู้ส่งไม่อยู่ใน `dmAllowlist` และไม่ได้กำหนดค่า `ownerShip` สำหรับ flow การอนุมัติ
- **ข้อความกลุ่มถูกละเว้น**: ไม่พบช่องหรือผู้ส่งไม่ได้รับอนุญาต
- **ข้อผิดพลาดการเชื่อมต่อ**: ตรวจสอบว่า URL ของ ship เข้าถึงได้; เปิดใช้ `allowPrivateNetwork` สำหรับ ship ภายในเครื่อง
- **ข้อผิดพลาด Auth**: ตรวจสอบว่ารหัสเข้าสู่ระบบเป็นรหัสปัจจุบัน (รหัสจะหมุนเวียน)

## ข้อมูลอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือก provider:

- `channels.tlon.enabled`: เปิด/ปิดการเริ่มต้นช่อง
- `channels.tlon.ship`: ชื่อ Urbit ship ของบอท (เช่น `~sampel-palnet`)
- `channels.tlon.url`: URL ของ ship (เช่น `https://sampel-palnet.tlon.network`)
- `channels.tlon.code`: รหัสเข้าสู่ระบบของ ship
- `channels.tlon.allowPrivateNetwork`: อนุญาต URL localhost/LAN (ข้าม SSRF)
- `channels.tlon.ownerShip`: owner ship สำหรับระบบการอนุมัติ (ได้รับอนุญาตเสมอ)
- `channels.tlon.dmAllowlist`: ship ที่ได้รับอนุญาตให้ DM (ว่าง = ไม่มี)
- `channels.tlon.autoAcceptDmInvites`: ยอมรับ DM จาก ship ใน allowlist โดยอัตโนมัติ
- `channels.tlon.autoAcceptGroupInvites`: ยอมรับคำเชิญกลุ่มทั้งหมดโดยอัตโนมัติ
- `channels.tlon.autoDiscoverChannels`: ค้นหาช่องกลุ่มอัตโนมัติ (ค่าเริ่มต้น: true)
- `channels.tlon.groupChannels`: channel nests ที่ปักหมุดด้วยตนเอง
- `channels.tlon.defaultAuthorizedShips`: ship ที่ได้รับอนุญาตสำหรับทุกช่อง
- `channels.tlon.authorization.channelRules`: กฎ auth ต่อช่อง
- `channels.tlon.showModelSignature`: เพิ่มชื่อโมเดลต่อท้ายข้อความ

## หมายเหตุ

- การตอบกลับในกลุ่มต้องมีการ mention (เช่น `~your-bot-ship`) เพื่อให้ตอบกลับ
- การตอบกลับในเธรด: หากข้อความขาเข้าอยู่ในเธรด OpenClaw จะตอบกลับในเธรด
- Rich text: การจัดรูปแบบ Markdown (ตัวหนา, ตัวเอียง, code, headers, lists) จะถูกแปลงเป็นรูปแบบ native ของ Tlon
- รูปภาพ: URL จะถูกอัปโหลดไปยังพื้นที่จัดเก็บของ Tlon และฝังเป็นบล็อกรูปภาพ

## ที่เกี่ยวข้อง

- [ภาพรวมช่อง](/th/channels) — ช่องทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการต้อง mention
- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
