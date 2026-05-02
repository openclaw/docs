---
read_when:
    - การตั้งค่า Zalo Personal สำหรับ OpenClaw
    - การดีบักการเข้าสู่ระบบหรือโฟลว์ข้อความของ Zalo Personal
summary: การรองรับบัญชีส่วนบุคคลของ Zalo ผ่าน zca-js แบบเนทีฟ (การเข้าสู่ระบบด้วย QR), ความสามารถ และการกำหนดค่า
title: Zalo ส่วนตัว
x-i18n:
    generated_at: "2026-05-02T22:17:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

สถานะ: ทดลอง การผสานรวมนี้ทำให้ **บัญชี Zalo ส่วนบุคคล** ทำงานอัตโนมัติผ่าน `zca-js` แบบเนทีฟภายใน OpenClaw

<Warning>
นี่เป็นการผสานรวมแบบไม่เป็นทางการ และอาจทำให้บัญชีถูกระงับหรือแบนได้ ใช้งานโดยยอมรับความเสี่ยงเอง
</Warning>

## Plugin ที่บันเดิลมาให้

Zalo Personal จัดส่งเป็น Plugin ที่บันเดิลมาให้ใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจปกติ
จึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Zalo Personal
ให้ติดตั้งแพ็กเกจ npm โดยตรง:

- ติดตั้งผ่าน CLI: `openclaw plugins install @openclaw/zalouser`
- เวอร์ชันที่ปักไว้: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- หรือจากซอร์ส checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- รายละเอียด: [Plugins](/th/tools/plugin)

ไม่จำเป็นต้องมีไบนารี CLI ภายนอก `zca`/`openzca`

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบว่า Plugin Zalo Personal พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันบันเดิลมาให้อยู่แล้ว
   - การติดตั้งรุ่นเก่าหรือแบบกำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. เข้าสู่ระบบ (QR บนเครื่อง Gateway):
   - `openclaw channels login --channel zalouser`
   - สแกนรหัส QR ด้วยแอปมือถือ Zalo
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

4. รีสตาร์ต Gateway (หรือทำการตั้งค่าให้เสร็จ)
5. การเข้าถึง DM มีค่าเริ่มต้นเป็นการจับคู่ อนุมัติรหัสจับคู่ในการติดต่อครั้งแรก

## สิ่งนี้คืออะไร

- ทำงานทั้งหมดในโปรเซสผ่าน `zca-js`
- ใช้ตัวฟังเหตุการณ์แบบเนทีฟเพื่อรับข้อความขาเข้า
- ส่งคำตอบโดยตรงผ่าน JS API (ข้อความ/สื่อ/ลิงก์)
- ออกแบบมาสำหรับกรณีใช้งาน “บัญชีส่วนบุคคล” ที่ Zalo Bot API ไม่พร้อมใช้งาน

## การตั้งชื่อ

รหัสช่องทางคือ `zalouser` เพื่อระบุให้ชัดเจนว่าสิ่งนี้ทำให้ **บัญชีผู้ใช้ Zalo ส่วนบุคคล** ทำงานอัตโนมัติ (ไม่เป็นทางการ) เราสงวน `zalo` ไว้สำหรับการผสานรวม Zalo API อย่างเป็นทางการที่อาจมีในอนาคต

## การค้นหา ID (ไดเรกทอรี)

ใช้ CLI ไดเรกทอรีเพื่อค้นหาเพียร์/กลุ่มและ ID ของรายการเหล่านั้น:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## ขีดจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นชิ้นประมาณ 2000 อักขระ (ขีดจำกัดของไคลเอนต์ Zalo)
- การสตรีมถูกบล็อกเป็นค่าเริ่มต้น

## การควบคุมการเข้าถึง (DM)

`channels.zalouser.dmPolicy` รองรับ: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)

`channels.zalouser.allowFrom` รับ ID ผู้ใช้หรือชื่อ ระหว่างการตั้งค่า ชื่อจะถูกแปลงเป็น ID โดยใช้การค้นหารายชื่อติดต่อในโปรเซสของ Plugin

อนุมัติผ่าน:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## การเข้าถึงกลุ่ม (ไม่บังคับ)

- ค่าเริ่มต้น: `channels.zalouser.groupPolicy = "open"` (อนุญาตกลุ่ม) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- จำกัดเป็น allowlist ด้วย:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (คีย์ควรเป็น ID กลุ่มที่เสถียร ชื่อจะถูกแปลงเป็น ID เมื่อเริ่มต้นระบบเมื่อทำได้)
  - `channels.zalouser.groupAllowFrom` (ควบคุมว่าผู้ส่งรายใดในกลุ่มที่อนุญาตสามารถทริกเกอร์บอตได้)
- บล็อกทุกกลุ่ม: `channels.zalouser.groupPolicy = "disabled"`
- วิซาร์ดกำหนดค่าสามารถแจ้งให้ตั้งค่า allowlist ของกลุ่มได้
- เมื่อเริ่มต้นระบบ OpenClaw จะแปลงชื่อกลุ่ม/ผู้ใช้ใน allowlist เป็น ID และบันทึกการแมปลงในล็อก
- การจับคู่ allowlist ของกลุ่มใช้เฉพาะ ID เป็นค่าเริ่มต้น ชื่อที่แปลงไม่ได้จะถูกละเว้นสำหรับการยืนยันสิทธิ์ เว้นแต่จะเปิดใช้งาน `channels.zalouser.dangerouslyAllowNameMatching: true`
- `channels.zalouser.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้สำหรับกรณีฉุกเฉินที่เปิดการจับคู่ชื่อกลุ่มที่เปลี่ยนแปลงได้อีกครั้ง
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

### การควบคุมการกล่าวถึงในกลุ่ม

- `channels.zalouser.groups.<group>.requireMention` ควบคุมว่าคำตอบในกลุ่มต้องมีการกล่าวถึงหรือไม่
- ลำดับการแปลง: ID/ชื่อกลุ่มแบบตรงกันพอดี -> slug กลุ่มที่ normalize แล้ว -> `*` -> ค่าเริ่มต้น (`true`)
- สิ่งนี้ใช้กับทั้งกลุ่มใน allowlist และโหมดกลุ่มแบบเปิด
- การอ้างอิงข้อความของบอตนับเป็นการกล่าวถึงโดยนัยสำหรับการเปิดใช้งานในกลุ่ม
- คำสั่งควบคุมที่ได้รับอนุญาต (เช่น `/new`) สามารถข้ามการควบคุมการกล่าวถึงได้
- เมื่อข้อความกลุ่มถูกข้ามเพราะต้องมีการกล่าวถึง OpenClaw จะจัดเก็บเป็นประวัติกลุ่มที่รอดำเนินการและรวมไว้ในข้อความกลุ่มครั้งถัดไปที่ถูกประมวลผล
- ขีดจำกัดประวัติกลุ่มมีค่าเริ่มต้นเป็น `messages.groupChat.historyLimit` (fallback `50`) คุณสามารถแทนที่รายบัญชีได้ด้วย `channels.zalouser.historyLimit`

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

## การพิมพ์อยู่ รีแอ็กชัน และการยืนยันการส่งมอบ

- OpenClaw ส่งเหตุการณ์การพิมพ์อยู่ก่อนส่งคำตอบ (พยายามให้ดีที่สุด)
- รองรับการกระทำรีแอ็กชันข้อความ `react` สำหรับ `zalouser` ในการกระทำของช่องทาง
  - ใช้ `remove: true` เพื่อลบอีโมจิรีแอ็กชันที่ระบุออกจากข้อความ
  - ความหมายของรีแอ็กชัน: [รีแอ็กชัน](/th/tools/reactions)
- สำหรับข้อความขาเข้าที่มีข้อมูลเมตาเหตุการณ์ OpenClaw จะส่งการยืนยัน delivered + seen (พยายามให้ดีที่สุด)

## การแก้ไขปัญหา

**เข้าสู่ระบบแล้วไม่คงอยู่:**

- `openclaw channels status --probe`
- เข้าสู่ระบบใหม่: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**ไม่สามารถแปลงชื่อใน allowlist/กลุ่มได้:**

- ใช้ ID ตัวเลขใน `allowFrom`/`groupAllowFrom`/`groups` หรือใช้ชื่อเพื่อน/กลุ่มแบบตรงกันพอดี

**อัปเกรดมาจากการตั้งค่าเก่าที่ใช้ CLI:**

- ลบสมมติฐานเกี่ยวกับโปรเซส `zca` ภายนอกเก่าออก
- ตอนนี้ช่องทางทำงานภายใน OpenClaw อย่างสมบูรณ์โดยไม่ต้องใช้ไบนารี CLI ภายนอก

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันสิทธิ์ DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
