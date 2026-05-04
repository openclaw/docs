---
read_when:
    - กำลังทำงานเกี่ยวกับฟีเจอร์ช่องทาง Tlon/Urbit
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของ Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-04T02:22:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1718044541b431ff2437508e7e6659c14206f4aa84ab8b207e0d791dea2a48c5
    source_path: channels/tlon.md
    workflow: 16
---

Tlon เป็นเมสเซนเจอร์แบบกระจายศูนย์ที่สร้างบน Urbit OpenClaw เชื่อมต่อกับ Urbit ship ของคุณและสามารถ
ตอบกลับ DM และข้อความแชทกลุ่มได้ การตอบกลับกลุ่มต้องมีการกล่าวถึงด้วย @ ตามค่าเริ่มต้น และสามารถ
จำกัดเพิ่มเติมผ่าน allowlist ได้

สถานะ: Plugin ที่รวมมาให้แล้ว รองรับ DM, การกล่าวถึงในกลุ่ม, การตอบกลับในเธรด, การจัดรูปแบบข้อความแบบ rich text และ
การอัปโหลดรูปภาพแล้ว ยังไม่รองรับ reactions และ polls

## Plugin ที่รวมมาให้แล้ว

Tlon มาพร้อมเป็น Plugin ที่รวมมาให้แล้วใน OpenClaw รุ่นปัจจุบัน ดังนั้น build แบบแพ็กเกจปกติ
จึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้ build เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Tlon ให้ติดตั้ง
แพ็กเกจ npm ปัจจุบัน:

ติดตั้งผ่าน CLI (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

ใช้แพ็กเกจแบบไม่ระบุเวอร์ชันเพื่อให้ตามแท็กรุ่นทางการปัจจุบัน ระบุ
เวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

การ checkout ภายในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่า

1. ตรวจสอบว่า Tlon Plugin พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมไว้ให้แล้ว
   - การติดตั้งเก่ากว่า/แบบกำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. รวบรวม URL ของ ship และรหัสเข้าสู่ระบบของคุณ
3. กำหนดค่า `channels.tlon`
4. รีสตาร์ท gateway
5. DM ไปยังบอตหรือกล่าวถึงบอตในช่องกลุ่ม

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

ตามค่าเริ่มต้น OpenClaw จะบล็อก hostname และช่วง IP ส่วนตัว/ภายในเพื่อป้องกัน SSRF
หาก ship ของคุณทำงานอยู่บนเครือข่ายส่วนตัว (localhost, IP ของ LAN หรือ hostname ภายใน)
คุณต้องเลือกเปิดใช้อย่างชัดเจน:

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

⚠️ เปิดใช้งานเฉพาะเมื่อคุณไว้วางใจเครือข่ายภายในของคุณเท่านั้น การตั้งค่านี้จะปิดการป้องกัน SSRF
สำหรับคำขอไปยัง URL ของ ship ของคุณ

## ช่องกลุ่ม

การค้นหาอัตโนมัติเปิดใช้งานตามค่าเริ่มต้น คุณยังสามารถปักหมุดช่องด้วยตนเองได้:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

ปิดการค้นหาอัตโนมัติ:

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

allowlist สำหรับ DM (ว่าง = ไม่อนุญาต DM, ใช้ `ownerShip` สำหรับขั้นตอนการอนุมัติ):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

การอนุญาตของกลุ่ม (จำกัดตามค่าเริ่มต้น):

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

## เจ้าของและระบบอนุมัติ

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

owner ship จะ **ได้รับอนุญาตโดยอัตโนมัติทุกที่** — คำเชิญ DM จะถูกยอมรับอัตโนมัติ และ
ข้อความในช่องจะได้รับอนุญาตเสมอ คุณไม่จำเป็นต้องเพิ่มเจ้าของใน `dmAllowlist` หรือ
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

ยอมรับคำเชิญเข้ากลุ่มอัตโนมัติจาก ship ที่เชื่อถือได้:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

`autoAcceptGroupInvites` จะปฏิเสธโดยอัตโนมัติเมื่อ `groupInviteAllowlist` ว่าง ตั้งค่า
allowlist เป็น ship ที่ควรยอมรับคำเชิญเข้ากลุ่มโดยอัตโนมัติ

## เป้าหมายการส่ง (CLI/cron)

ใช้สิ่งเหล่านี้กับ `openclaw message send` หรือการส่งผ่าน cron:

- DM: `~sampel-palnet` หรือ `dm/~sampel-palnet`
- กลุ่ม: `chat/~host-ship/channel` หรือ `group:~host-ship/channel`

## Skill ที่รวมมาให้แล้ว

Tlon Plugin มี Skill ที่รวมมาให้แล้ว ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
ซึ่งให้การเข้าถึงการทำงานของ Tlon ผ่าน CLI:

- **รายชื่อผู้ติดต่อ**: รับ/อัปเดตโปรไฟล์, แสดงรายชื่อผู้ติดต่อ
- **ช่อง**: แสดงรายการ, สร้าง, โพสต์ข้อความ, ดึงประวัติ
- **กลุ่ม**: แสดงรายการ, สร้าง, จัดการสมาชิก
- **DM**: ส่งข้อความ, react ต่อข้อความ
- **Reactions**: เพิ่ม/ลบ emoji reactions ในโพสต์และ DM
- **การตั้งค่า**: จัดการสิทธิ์ Plugin ผ่านคำสั่ง slash

Skill จะพร้อมใช้งานโดยอัตโนมัติเมื่อ Plugin ได้รับการติดตั้ง

## ความสามารถ

| ฟีเจอร์         | สถานะ                                  |
| --------------- | --------------------------------------- |
| ข้อความโดยตรง | ✅ รองรับ                            |
| กลุ่ม/ช่อง | ✅ รองรับ (ต้องมีการกล่าวถึงตามค่าเริ่มต้น) |
| เธรด         | ✅ รองรับ (ตอบกลับอัตโนมัติในเธรด)   |
| Rich text       | ✅ แปลง Markdown เป็นรูปแบบ Tlon    |
| รูปภาพ          | ✅ อัปโหลดไปยังพื้นที่จัดเก็บของ Tlon             |
| Reactions       | ✅ ผ่าน [Skill ที่รวมมาให้แล้ว](#bundled-skill)  |
| Polls           | ❌ ยังไม่รองรับ                    |
| คำสั่งเนทีฟ | ✅ รองรับ (เฉพาะเจ้าของตามค่าเริ่มต้น)    |

## การแก้ไขปัญหา

รันลำดับนี้ก่อน:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

ความล้มเหลวที่พบบ่อย:

- **DM ถูกละเว้น**: ผู้ส่งไม่อยู่ใน `dmAllowlist` และไม่ได้กำหนดค่า `ownerShip` สำหรับขั้นตอนการอนุมัติ
- **ข้อความกลุ่มถูกละเว้น**: ไม่พบช่องหรือผู้ส่งไม่ได้รับอนุญาต
- **ข้อผิดพลาดการเชื่อมต่อ**: ตรวจสอบว่า URL ของ ship เข้าถึงได้; เปิดใช้ `allowPrivateNetwork` สำหรับ ship ภายในเครื่อง
- **ข้อผิดพลาดการยืนยันตัวตน**: ตรวจสอบว่ารหัสเข้าสู่ระบบเป็นปัจจุบัน (รหัสจะหมุนเวียน)

## อ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกผู้ให้บริการ:

- `channels.tlon.enabled`: เปิด/ปิดการเริ่มต้นช่อง
- `channels.tlon.ship`: ชื่อ Urbit ship ของบอต (เช่น `~sampel-palnet`)
- `channels.tlon.url`: URL ของ ship (เช่น `https://sampel-palnet.tlon.network`)
- `channels.tlon.code`: รหัสเข้าสู่ระบบของ ship
- `channels.tlon.allowPrivateNetwork`: อนุญาต URL localhost/LAN (ข้าม SSRF)
- `channels.tlon.ownerShip`: owner ship สำหรับระบบอนุมัติ (ได้รับอนุญาตเสมอ)
- `channels.tlon.dmAllowlist`: ship ที่ได้รับอนุญาตให้ DM (ว่าง = ไม่มี)
- `channels.tlon.autoAcceptDmInvites`: ยอมรับ DM อัตโนมัติจาก ship ที่อยู่ใน allowlist
- `channels.tlon.autoAcceptGroupInvites`: ยอมรับคำเชิญเข้ากลุ่มอัตโนมัติจาก ship ที่อยู่ใน allowlist
- `channels.tlon.groupInviteAllowlist`: ship ที่คำเชิญเข้ากลุ่มอาจได้รับการยอมรับอัตโนมัติ
- `channels.tlon.autoDiscoverChannels`: ค้นหาช่องกลุ่มอัตโนมัติ (ค่าเริ่มต้น: true)
- `channels.tlon.groupChannels`: nest ของช่องที่ปักหมุดด้วยตนเอง
- `channels.tlon.defaultAuthorizedShips`: ship ที่ได้รับอนุญาตสำหรับทุกช่อง
- `channels.tlon.authorization.channelRules`: กฎการยืนยันสิทธิ์รายช่อง
- `channels.tlon.showModelSignature`: ต่อท้ายชื่อโมเดลในข้อความ

## หมายเหตุ

- การตอบกลับกลุ่มต้องมีการกล่าวถึง (เช่น `~your-bot-ship`) เพื่อให้ตอบกลับ
- การตอบกลับเธรด: หากข้อความขาเข้าอยู่ในเธรด OpenClaw จะตอบกลับในเธรด
- Rich text: การจัดรูปแบบ Markdown (ตัวหนา, ตัวเอียง, code, headers, lists) จะถูกแปลงเป็นรูปแบบเนทีฟของ Tlon
- รูปภาพ: URL จะถูกอัปโหลดไปยังพื้นที่จัดเก็บของ Tlon และฝังเป็นบล็อกรูปภาพ

## ที่เกี่ยวข้อง

- [ภาพรวมช่อง](/th/channels) — ช่องที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
