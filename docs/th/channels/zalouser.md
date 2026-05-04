---
read_when:
    - การตั้งค่า Zalo Personal สำหรับ OpenClaw
    - การดีบักการเข้าสู่ระบบหรือโฟลว์ข้อความของ Zalo Personal
summary: การรองรับบัญชีส่วนบุคคลของ Zalo ผ่าน zca-js แบบเนทีฟ (การเข้าสู่ระบบด้วย QR), ความสามารถ และการกำหนดค่า
title: Zalo ส่วนบุคคล
x-i18n:
    generated_at: "2026-05-04T18:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6d27f0ca502e6426abe21d609efd0a168a0b6b0fafe8d52d59f1a717da1ed5
    source_path: channels/zalouser.md
    workflow: 16
---

สถานะ: ทดลอง การผสานการทำงานนี้ทำให้ **บัญชี Zalo ส่วนตัว** ทำงานอัตโนมัติผ่าน `zca-js` แบบเนทีฟภายใน OpenClaw

<Warning>
นี่เป็นการผสานการทำงานที่ไม่เป็นทางการและอาจทำให้บัญชีถูกระงับหรือถูกแบนได้ ใช้งานโดยยอมรับความเสี่ยงเอง
</Warning>

## Plugin ที่บันเดิลมา

Zalo Personal มาพร้อมเป็น Plugin ที่บันเดิลมาใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจปกติ
จึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Zalo Personal
ให้ติดตั้งแพ็กเกจ npm โดยตรง:

- ติดตั้งผ่าน CLI: `openclaw plugins install @openclaw/zalouser`
- เวอร์ชันที่ปักหมุด: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- หรือจากเช็กเอาต์ซอร์ส: `openclaw plugins install ./path/to/local/zalouser-plugin`
- รายละเอียด: [Plugin](/th/tools/plugin)

ไม่จำเป็นต้องมีไบนารี CLI ภายนอก `zca`/`openzca`

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบว่า Plugin Zalo Personal พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันบันเดิลไว้แล้ว
   - การติดตั้งเก่ากว่าหรือแบบกำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. เข้าสู่ระบบ (QR บนเครื่อง Gateway):
   - `openclaw channels login --channel zalouser`
   - สแกนคิวอาร์โค้ดด้วยแอปมือถือ Zalo
3. เปิดใช้ช่องทาง:

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
5. การเข้าถึง DM ใช้ค่าเริ่มต้นเป็นการจับคู่ อนุมัติรหัสจับคู่เมื่อมีการติดต่อครั้งแรก

## คืออะไร

- ทำงานทั้งหมดภายในโปรเซสผ่าน `zca-js`
- ใช้ตัวรับฟังเหตุการณ์แบบเนทีฟเพื่อรับข้อความขาเข้า
- ส่งคำตอบโดยตรงผ่าน JS API (ข้อความ/สื่อ/ลิงก์)
- ออกแบบมาสำหรับกรณีใช้งาน “บัญชีส่วนตัว” ที่ Zalo Bot API ไม่พร้อมใช้งาน

## การตั้งชื่อ

รหัสช่องทางคือ `zalouser` เพื่อระบุอย่างชัดเจนว่าสิ่งนี้ทำให้ **บัญชีผู้ใช้ Zalo ส่วนตัว** ทำงานอัตโนมัติ (ไม่เป็นทางการ) เราสงวน `zalo` ไว้สำหรับการผสานการทำงานกับ Zalo API อย่างเป็นทางการที่อาจมีในอนาคต

## การค้นหา ID (ไดเรกทอรี)

ใช้ CLI ไดเรกทอรีเพื่อค้นหาเพียร์/กลุ่มและ ID ของรายการเหล่านั้น:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## ข้อจำกัด

- ข้อความขาออกถูกแบ่งเป็นชิ้นประมาณ 2000 อักขระ (ข้อจำกัดของไคลเอนต์ Zalo)
- การสตรีมถูกบล็อกตามค่าเริ่มต้น

## การควบคุมการเข้าถึง (DM)

`channels.zalouser.dmPolicy` รองรับ: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)

`channels.zalouser.allowFrom` ควรใช้ ID ผู้ใช้ Zalo ที่เสถียร ระหว่างการตั้งค่าแบบโต้ตอบ ชื่อที่ป้อนสามารถแปลงเป็น ID ได้โดยใช้การค้นหารายชื่อติดต่อภายในโปรเซสของ Plugin

หากชื่อดิบยังอยู่ในการกำหนดค่า ตอนเริ่มต้นระบบจะแปลงชื่อเฉพาะเมื่อเปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true` เท่านั้น หากไม่มีการเลือกใช้นี้ การตรวจสอบผู้ส่งขณะรันไทม์จะใช้เฉพาะ ID และชื่อดิบจะถูกละเว้นสำหรับการอนุญาต

อนุมัติผ่าน:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## การเข้าถึงกลุ่ม (ไม่บังคับ)

- ค่าเริ่มต้น: `channels.zalouser.groupPolicy = "open"` (อนุญาตกลุ่ม) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อยังไม่ได้ตั้งค่า
- จำกัดไว้ที่รายการอนุญาตด้วย:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (คีย์ควรเป็น ID กลุ่มที่เสถียร ชื่อจะถูกแปลงเป็น ID ตอนเริ่มต้นเท่านั้นเมื่อเปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (ควบคุมว่าผู้ส่งใดในกลุ่มที่อนุญาตสามารถเรียกบอตได้)
- บล็อกทุกกลุ่ม: `channels.zalouser.groupPolicy = "disabled"`
- วิซาร์ดกำหนดค่าสามารถถามรายการอนุญาตของกลุ่มได้
- ตอนเริ่มต้น OpenClaw จะแปลงชื่อกลุ่ม/ผู้ใช้ในรายการอนุญาตเป็น ID และบันทึกการแมปเฉพาะเมื่อเปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`
- การจับคู่รายการอนุญาตของกลุ่มใช้เฉพาะ ID ตามค่าเริ่มต้น ชื่อที่แปลงไม่ได้จะถูกละเว้นสำหรับการตรวจสอบสิทธิ์ เว้นแต่เปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`
- `channels.zalouser.dangerouslyAllowNameMatching: true` คือโหมดความเข้ากันได้แบบ break-glass ที่เปิดการแปลงชื่อตอนเริ่มต้นที่เปลี่ยนแปลงได้และการจับคู่ชื่อกลุ่มขณะรันไทม์อีกครั้ง
- หากไม่ได้ตั้งค่า `groupAllowFrom` รันไทม์จะย้อนกลับไปใช้ `allowFrom` สำหรับการตรวจสอบผู้ส่งในกลุ่ม
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

### การกั้นด้วยการเมนชันในกลุ่ม

- `channels.zalouser.groups.<group>.requireMention` ควบคุมว่าการตอบกลับในกลุ่มต้องมีการเมนชันหรือไม่
- ลำดับการแปลง: ID/ชื่อกลุ่มแบบตรงกันทุกประการ -> สลักกลุ่มที่ทำให้เป็นมาตรฐานแล้ว -> `*` -> ค่าเริ่มต้น (`true`)
- สิ่งนี้ใช้กับทั้งกลุ่มที่อยู่ในรายการอนุญาตและโหมดกลุ่มแบบเปิด
- การอ้างอิงข้อความของบอตนับเป็นการเมนชันโดยนัยสำหรับการเปิดใช้งานในกลุ่ม
- คำสั่งควบคุมที่ได้รับอนุญาต (เช่น `/new`) สามารถข้ามการกั้นด้วยการเมนชันได้
- เมื่อข้ามข้อความกลุ่มเพราะต้องมีการเมนชัน OpenClaw จะเก็บไว้เป็นประวัติกลุ่มที่รอดำเนินการและรวมไว้ในข้อความกลุ่มถัดไปที่ประมวลผล
- ขีดจำกัดประวัติกลุ่มใช้ค่าเริ่มต้นเป็น `messages.groupChat.historyLimit` (สำรองเป็น `50`) คุณสามารถแทนที่ต่อบัญชีได้ด้วย `channels.zalouser.historyLimit`

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

บัญชีถูกแมปกับโปรไฟล์ `zalouser` ในสถานะ OpenClaw ตัวอย่าง:

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

## การพิมพ์ การตอบสนอง และการยืนยันการส่ง

- OpenClaw ส่งเหตุการณ์การพิมพ์ก่อนส่งคำตอบ (พยายามให้ดีที่สุด)
- รองรับการดำเนินการตอบสนองต่อข้อความ `react` สำหรับ `zalouser` ในการดำเนินการของช่องทาง
  - ใช้ `remove: true` เพื่อลบอีโมจิตอบสนองเฉพาะจากข้อความ
  - ความหมายของการตอบสนอง: [การตอบสนอง](/th/tools/reactions)
- สำหรับข้อความขาเข้าที่มีเมทาดาทาเหตุการณ์ OpenClaw จะส่งการยืนยันส่งถึงแล้ว + เห็นแล้ว (พยายามให้ดีที่สุด)

## การแก้ไขปัญหา

**เข้าสู่ระบบแล้วไม่คงอยู่:**

- `openclaw channels status --probe`
- เข้าสู่ระบบใหม่: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**แก้ชื่อในรายการอนุญาต/กลุ่มไม่ได้:**

- ใช้ ID แบบตัวเลขใน `allowFrom`/`groupAllowFrom` และ ID กลุ่มที่เสถียรใน `groups` หากคุณตั้งใจต้องใช้ชื่อเพื่อน/กลุ่มที่ตรงกันทุกประการ ให้เปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`

**อัปเกรดจากการตั้งค่าแบบเก่าที่ใช้ CLI:**

- ลบสมมติฐานเกี่ยวกับโปรเซส `zca` ภายนอกแบบเก่า
- ตอนนี้ช่องทางทำงานทั้งหมดภายใน OpenClaw โดยไม่มีไบนารี CLI ภายนอก

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกั้นด้วยการเมนชัน
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
