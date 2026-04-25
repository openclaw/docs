---
read_when:
    - การตั้งค่า Zalo Personal สำหรับ OpenClaw
    - การดีบักการเข้าสู่ระบบหรือโฟลว์ข้อความของ Zalo ส่วนตัว
summary: การรองรับบัญชีส่วนตัว Zalo ผ่าน zca-js แบบเนทีฟ (การเข้าสู่ระบบด้วย QR), ความสามารถ และการกำหนดค่า
title: Zalo ส่วนตัว
x-i18n:
    generated_at: "2026-04-25T13:42:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

สถานะ: experimental การผสานรวมนี้ทำงานอัตโนมัติกับ **บัญชี Zalo ส่วนตัว** ผ่าน `zca-js` แบบเนทีฟภายใน OpenClaw

> **คำเตือน:** นี่เป็นการผสานรวมที่ไม่เป็นทางการและอาจส่งผลให้บัญชีถูกระงับ/แบน ใช้งานโดยยอมรับความเสี่ยงเอง

## Plugin ที่มาพร้อมกับระบบ

Zalo Personal มาพร้อมเป็น Plugin ที่รวมอยู่ใน OpenClaw รุ่นปัจจุบัน ดังนั้น
บิลด์แบบแพ็กเกจทั่วไปไม่จำเป็นต้องติดตั้งแยก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Zalo Personal
ให้ติดตั้งด้วยตนเอง:

- ติดตั้งผ่าน CLI: `openclaw plugins install @openclaw/zalouser`
- หรือจาก source checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- รายละเอียด: [Plugins](/th/tools/plugin)

ไม่จำเป็นต้องใช้ไบนารี CLI ภายนอก `zca`/`openzca`

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Plugin Zalo Personal พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. เข้าสู่ระบบ (QR บนเครื่อง Gateway):
   - `openclaw channels login --channel zalouser`
   - สแกน QR code ด้วยแอป Zalo บนมือถือ
3. เปิดใช้งานช่องทาง:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. รีสตาร์ต Gateway (หรือดำเนินการตั้งค่าให้เสร็จ)
5. การเข้าถึง DM ใช้ pairing เป็นค่าเริ่มต้น; อนุมัติรหัสการจับคู่เมื่อมีการติดต่อครั้งแรก

## มันคืออะไร

- ทำงานทั้งหมดในโปรเซสผ่าน `zca-js`
- ใช้ native event listener เพื่อรับข้อความขาเข้า
- ส่งคำตอบกลับโดยตรงผ่าน JS API (ข้อความ/สื่อ/ลิงก์)
- ออกแบบมาสำหรับกรณีใช้งานแบบ “บัญชีส่วนตัว” ที่ไม่มี Zalo Bot API ให้ใช้

## การตั้งชื่อ

รหัสช่องทางคือ `zalouser` เพื่อให้ชัดเจนว่านี่คือการทำงานอัตโนมัติกับ **บัญชีผู้ใช้ Zalo ส่วนตัว** (ไม่เป็นทางการ) เราสงวน `zalo` ไว้สำหรับการผสานรวม Zalo API แบบเป็นทางการในอนาคตที่อาจมีขึ้น

## การค้นหา ID (directory)

ใช้ directory CLI เพื่อค้นหา peer/group และ ID ของพวกเขา:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## ข้อจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นช่วงละประมาณ 2000 อักขระ (ข้อจำกัดของไคลเอนต์ Zalo)
- การสตรีมถูกบล็อกไว้เป็นค่าเริ่มต้น

## การควบคุมการเข้าถึง (DM)

`channels.zalouser.dmPolicy` รองรับ: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)

`channels.zalouser.allowFrom` รับทั้ง ID ผู้ใช้หรือชื่อ ระหว่างการตั้งค่า ชื่อจะถูก resolve เป็น ID โดยใช้การค้นหารายชื่อผู้ติดต่อในโปรเซสของ Plugin

อนุมัติผ่าน:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## การเข้าถึงกลุ่ม (ไม่บังคับ)

- ค่าเริ่มต้น: `channels.zalouser.groupPolicy = "open"` (อนุญาตกลุ่ม) ใช้ `channels.defaults.groupPolicy` เพื่อเขียนทับค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าไว้
- จำกัดเฉพาะ allowlist ด้วย:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (คีย์ควรเป็น ID กลุ่มที่คงที่; ชื่อจะถูก resolve เป็น ID ตอนเริ่มต้นเมื่อทำได้)
  - `channels.zalouser.groupAllowFrom` (ควบคุมว่าผู้ส่งคนใดในกลุ่มที่อนุญาตสามารถทริกเกอร์บอทได้)
- บล็อกทุกกลุ่ม: `channels.zalouser.groupPolicy = "disabled"`
- ตัวช่วยสร้างการกำหนดค่าสามารถถามรายการอนุญาตกลุ่มได้
- ตอนเริ่มต้น OpenClaw จะ resolve ชื่อกลุ่ม/ผู้ใช้ใน allowlist เป็น ID และบันทึก mapping ไว้ใน log
- การจับคู่ allowlist ของกลุ่มใช้ ID เท่านั้นเป็นค่าเริ่มต้น ชื่อที่ resolve ไม่ได้จะถูกละเว้นสำหรับการยืนยันสิทธิ์ เว้นแต่จะเปิด `channels.zalouser.dangerouslyAllowNameMatching: true`
- `channels.zalouser.dangerouslyAllowNameMatching: true` เป็นโหมด break-glass เพื่อความเข้ากันได้ที่เปิดการจับคู่ด้วยชื่อกลุ่มที่เปลี่ยนแปลงได้อีกครั้ง
- หากไม่ได้ตั้งค่า `groupAllowFrom` runtime จะ fallback ไปใช้ `allowFrom` สำหรับการตรวจสอบผู้ส่งในกลุ่ม
- การตรวจสอบผู้ส่งใช้กับทั้งข้อความกลุ่มปกติและคำสั่งควบคุม (เช่น `/new`, `/reset`)

ตัวอย่าง:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Mention gating ของกลุ่ม

- `channels.zalouser.groups.<group>.requireMention` ควบคุมว่าการตอบกลับในกลุ่มต้องมีการ mention หรือไม่
- ลำดับการ resolve: exact group id/name -> normalized group slug -> `*` -> ค่าเริ่มต้น (`true`)
- ใช้กับทั้งกลุ่มที่อยู่ใน allowlist และโหมดกลุ่มแบบ open
- การ quote ข้อความของบอทถือเป็นการ mention โดยนัยสำหรับการเปิดใช้งานในกลุ่ม
- คำสั่งควบคุมที่ได้รับอนุญาต (เช่น `/new`) สามารถข้าม mention gating ได้
- เมื่อข้อความกลุ่มถูกข้ามเพราะต้องมีการ mention, OpenClaw จะเก็บข้อความนั้นเป็นประวัติกลุ่มที่รอดำเนินการ และรวมไว้ในข้อความกลุ่มถัดไปที่ถูกประมวลผล
- ขีดจำกัดประวัติกลุ่มใช้ค่าเริ่มต้นจาก `messages.groupChat.historyLimit` (fallback `50`) คุณสามารถเขียนทับเป็นรายบัญชีได้ด้วย `channels.zalouser.historyLimit`

ตัวอย่าง:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## หลายบัญชี

บัญชีจะแมปกับโปรไฟล์ `zalouser` ในสถานะของ OpenClaw ตัวอย่าง:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## การพิมพ์ รีแอ็กชัน และการยืนยันการส่งถึง

- OpenClaw จะส่งเหตุการณ์การพิมพ์ก่อน dispatch การตอบกลับ (best-effort)
- รองรับ action รีแอ็กชันข้อความ `react` สำหรับ `zalouser` ใน channel actions
  - ใช้ `remove: true` เพื่อลบรีแอ็กชันอีโมจิเฉพาะออกจากข้อความ
  - ความหมายของรีแอ็กชัน: [Reactions](/th/tools/reactions)
- สำหรับข้อความขาเข้าที่มี metadata ของเหตุการณ์ OpenClaw จะส่งการยืนยันว่าได้รับส่งถึงแล้ว + อ่านแล้ว (best-effort)

## การแก้ไขปัญหา

**การเข้าสู่ระบบไม่ค้างอยู่:**

- `openclaw channels status --probe`
- เข้าสู่ระบบใหม่: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**ชื่อใน allowlist/group ไม่ถูก resolve:**

- ใช้ ID ตัวเลขใน `allowFrom`/`groupAllowFrom`/`groups` หรือใช้ชื่อเพื่อน/ชื่อกลุ่มที่ตรงกันทุกตัวอักษร

**อัปเกรดมาจากการตั้งค่าแบบใช้ CLI เก่า:**

- ลบสมมติฐานเดิมที่ต้องมีโปรเซส `zca` ภายนอก
- ตอนนี้ช่องทางนี้ทำงานเต็มรูปแบบภายใน OpenClaw โดยไม่ต้องใช้ไบนารี CLI ภายนอก

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและ mention gating
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้แข็งแกร่งขึ้น
