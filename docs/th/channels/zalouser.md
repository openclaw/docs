---
read_when:
    - การตั้งค่า Zalo Personal สำหรับ OpenClaw
    - การดีบักโฟลว์การเข้าสู่ระบบหรือโฟลว์ข้อความของ Zalo Personal
summary: การรองรับบัญชีส่วนตัว Zalo ผ่าน zca-js แบบเนทีฟ (การเข้าสู่ระบบด้วย QR), ความสามารถ และการกำหนดค่า
title: Zalo ส่วนตัว
x-i18n:
    generated_at: "2026-05-06T17:52:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

สถานะ: ทดลอง การผสานรวมนี้ทำงานอัตโนมัติกับ **บัญชี Zalo ส่วนตัว** ผ่าน `zca-js` แบบเนทีฟภายใน OpenClaw

<Warning>
นี่เป็นการผสานรวมที่ไม่เป็นทางการและอาจทำให้บัญชีถูกระงับหรือถูกแบนได้ ใช้งานโดยยอมรับความเสี่ยงเอง
</Warning>

## Plugin ที่รวมมาให้

Zalo Personal มาพร้อมเป็น Plugin ที่รวมมาให้ในรุ่น OpenClaw ปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจปกติ
ไม่จำเป็นต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Zalo Personal
ให้ติดตั้งแพ็กเกจ npm โดยตรง:

- ติดตั้งผ่าน CLI: `openclaw plugins install @openclaw/zalouser`
- เวอร์ชันที่ปักไว้: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- หรือจาก source checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- รายละเอียด: [Plugins](/th/tools/plugin)

ไม่ต้องใช้ไบนารี CLI ภายนอก `zca`/`openzca`

## การตั้งค่าอย่างรวดเร็ว (ผู้เริ่มต้น)

1. ตรวจสอบว่า Plugin Zalo Personal พร้อมใช้งาน
   - รุ่น OpenClaw แบบแพ็กเกจปัจจุบันรวมไว้แล้ว
   - การติดตั้งเก่ากว่า/แบบกำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. เข้าสู่ระบบ (QR บนเครื่อง Gateway):
   - `openclaw channels login --channel zalouser`
   - สแกนรหัส QR ด้วยแอป Zalo บนมือถือ
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

4. รีสตาร์ท Gateway (หรือทำการตั้งค่าให้เสร็จ)
5. การเข้าถึง DM มีค่าเริ่มต้นเป็นการจับคู่ อนุมัติรหัสจับคู่เมื่อมีการติดต่อครั้งแรก

## คืออะไร

- ทำงานทั้งหมดภายในโปรเซสผ่าน `zca-js`
- ใช้ event listeners แบบเนทีฟเพื่อรับข้อความขาเข้า
- ส่งการตอบกลับโดยตรงผ่าน JS API (ข้อความ/สื่อ/ลิงก์)
- ออกแบบมาสำหรับกรณีใช้งานแบบ "บัญชีส่วนตัว" เมื่อ Zalo Bot API ไม่พร้อมใช้งาน

## การตั้งชื่อ

รหัสช่องทางคือ `zalouser` เพื่อระบุให้ชัดเจนว่าสิ่งนี้ทำงานอัตโนมัติกับ **บัญชีผู้ใช้ Zalo ส่วนตัว** (ไม่เป็นทางการ) เราสงวน `zalo` ไว้สำหรับการผสานรวม Zalo API อย่างเป็นทางการที่อาจมีในอนาคต

## การค้นหา ID (ไดเรกทอรี)

ใช้ CLI ไดเรกทอรีเพื่อค้นหาเพียร์/กลุ่มและ ID ของพวกเขา:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## ข้อจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นช่วงละประมาณ 2000 อักขระ (ข้อจำกัดของไคลเอนต์ Zalo)
- การสตรีมถูกบล็อกโดยค่าเริ่มต้น

## การควบคุมการเข้าถึง (DM)

`channels.zalouser.dmPolicy` รองรับ: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)

`channels.zalouser.allowFrom` ควรใช้ ID ผู้ใช้ Zalo ที่เสถียร ระหว่างการตั้งค่าแบบโต้ตอบ ชื่อที่ป้อนสามารถ resolve เป็น ID ได้โดยใช้การค้นหารายชื่อติดต่อภายในโปรเซสของ Plugin

หากชื่อดิบยังคงอยู่ในคอนฟิก การเริ่มต้นระบบจะ resolve เฉพาะเมื่อเปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true` หากไม่มีการเลือกใช้นั้น การตรวจสอบผู้ส่งขณะรันไทม์จะใช้เฉพาะ ID และจะละเว้นชื่อดิบสำหรับการอนุญาต

อนุมัติผ่าน:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## การเข้าถึงกลุ่ม (ไม่บังคับ)

- ค่าเริ่มต้น: `channels.zalouser.groupPolicy = "open"` (อนุญาตกลุ่ม) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- จำกัดให้ใช้ allowlist ด้วย:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (คีย์ควรเป็น ID กลุ่มที่เสถียร ชื่อจะถูก resolve เป็น ID ตอนเริ่มต้นระบบเฉพาะเมื่อเปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (ควบคุมว่าผู้ส่งใดในกลุ่มที่อนุญาตสามารถทริกเกอร์บอทได้)
- บล็อกทุกกลุ่ม: `channels.zalouser.groupPolicy = "disabled"`
- วิซาร์ดการกำหนดค่าสามารถถามรายการ allowlist ของกลุ่มได้
- ตอนเริ่มต้นระบบ OpenClaw จะ resolve ชื่อกลุ่ม/ผู้ใช้ใน allowlists เป็น ID และบันทึก mapping เฉพาะเมื่อเปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`
- การจับคู่ allowlist ของกลุ่มใช้เฉพาะ ID โดยค่าเริ่มต้น ชื่อที่ resolve ไม่ได้จะถูกละเว้นสำหรับการยืนยันสิทธิ์ เว้นแต่จะเปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`
- `channels.zalouser.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้แบบ break-glass ที่เปิดการ resolve ชื่อที่เปลี่ยนแปลงได้ตอนเริ่มต้นระบบและการจับคู่ชื่อกลุ่มขณะรันไทม์อีกครั้ง
- หากไม่ได้ตั้งค่า `groupAllowFrom` รันไทม์จะ fallback ไปใช้ `allowFrom` สำหรับการตรวจสอบผู้ส่งในกลุ่ม
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

### การกั้นการกล่าวถึงในกลุ่ม

- `channels.zalouser.groups.<group>.requireMention` ควบคุมว่าการตอบกลับในกลุ่มต้องมีการกล่าวถึงหรือไม่
- ลำดับการ resolve: ID/ชื่อกลุ่มแบบตรงกัน -> slug กลุ่มที่ normalized -> `*` -> ค่าเริ่มต้น (`true`)
- สิ่งนี้ใช้กับทั้งกลุ่มใน allowlist และโหมดกลุ่มแบบเปิด
- การ quote ข้อความของบอทนับเป็นการกล่าวถึงโดยนัยสำหรับการเปิดใช้งานกลุ่ม
- คำสั่งควบคุมที่ได้รับอนุญาต (เช่น `/new`) สามารถข้ามการกั้นการกล่าวถึงได้
- เมื่อข้ามข้อความกลุ่มเพราะต้องมีการกล่าวถึง OpenClaw จะเก็บไว้เป็นประวัติกลุ่มที่รอดำเนินการและรวมไว้ในข้อความกลุ่มถัดไปที่ถูกประมวลผล
- ขีดจำกัดประวัติกลุ่มมีค่าเริ่มต้นเป็น `messages.groupChat.historyLimit` (fallback `50`) คุณสามารถแทนที่ต่อบัญชีได้ด้วย `channels.zalouser.historyLimit`

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

บัญชีจะ map ไปยังโปรไฟล์ `zalouser` ในสถานะของ OpenClaw ตัวอย่าง:

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

## การพิมพ์ ปฏิกิริยา และการยืนยันการส่งมอบ

- OpenClaw ส่งอีเวนต์การพิมพ์ก่อนส่งการตอบกลับ (แบบ best-effort)
- รองรับแอ็กชันปฏิกิริยาข้อความ `react` สำหรับ `zalouser` ในแอ็กชันของช่องทาง
  - ใช้ `remove: true` เพื่อลบอีโมจิปฏิกิริยาเฉพาะจากข้อความ
  - semantics ของปฏิกิริยา: [ปฏิกิริยา](/th/tools/reactions)
- สำหรับข้อความขาเข้าที่มีเมตาดาต้าอีเวนต์ OpenClaw จะส่งการยืนยัน delivered + seen (แบบ best-effort)

## การแก้ไขปัญหา

**การเข้าสู่ระบบไม่คงอยู่:**

- `openclaw channels status --probe`
- เข้าสู่ระบบใหม่: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**ชื่อ allowlist/กลุ่ม resolve ไม่ได้:**

- ใช้ ID แบบตัวเลขใน `allowFrom`/`groupAllowFrom` และ ID กลุ่มที่เสถียรใน `groups` หากคุณตั้งใจต้องใช้ชื่อเพื่อน/กลุ่มแบบตรงกัน ให้เปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`

**อัปเกรดมาจากการตั้งค่าแบบ CLI เดิม:**

- ลบสมมติฐานเกี่ยวกับโปรเซส `zca` ภายนอกเก่าออก
- ตอนนี้ช่องทางทำงานทั้งหมดใน OpenClaw โดยไม่มีไบนารี CLI ภายนอก

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการกั้นการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
