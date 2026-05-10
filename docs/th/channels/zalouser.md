---
read_when:
    - การตั้งค่า Zalo Personal สำหรับ OpenClaw
    - การดีบักการเข้าสู่ระบบหรือโฟลว์ข้อความของ Zalo Personal
summary: การรองรับบัญชีส่วนตัวของ Zalo ผ่าน zca-js แบบเนทีฟ (การเข้าสู่ระบบด้วย QR), ความสามารถ และการกำหนดค่า
title: Zalo ส่วนบุคคล
x-i18n:
    generated_at: "2026-05-10T19:24:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

สถานะ: ทดลอง การผสานการทำงานนี้ทำให้ **บัญชี Zalo ส่วนตัว** ทำงานอัตโนมัติผ่าน `zca-js` แบบเนทีฟภายใน OpenClaw

<Warning>
นี่เป็นการผสานการทำงานที่ไม่เป็นทางการ และอาจทำให้บัญชีถูกระงับหรือถูกแบน ใช้งานโดยยอมรับความเสี่ยงเอง
</Warning>

## Plugin ที่รวมมาให้

Zalo Personal จัดส่งเป็น Plugin ที่รวมมาให้ใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจปกติ
จึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Zalo Personal
ให้ติดตั้งแพ็กเกจ npm โดยตรง:

- ติดตั้งผ่าน CLI: `openclaw plugins install @openclaw/zalouser`
- เวอร์ชันที่ปักหมุด: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- หรือจากซอร์สที่เช็กเอาต์ไว้: `openclaw plugins install ./path/to/local/zalouser-plugin`
- รายละเอียด: [Plugin](/th/tools/plugin)

ไม่จำเป็นต้องมีไบนารี CLI ภายนอก `zca`/`openzca`

## การตั้งค่าอย่างรวดเร็ว (ผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Plugin Zalo Personal พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมไว้แล้ว
   - การติดตั้งเก่ากว่า/แบบกำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. เข้าสู่ระบบ (QR บนเครื่อง Gateway):
   - `openclaw channels login --channel zalouser`
   - สแกนโค้ด QR ด้วยแอปมือถือ Zalo
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
5. ค่าเริ่มต้นของการเข้าถึงข้อความโดยตรงคือการจับคู่ อนุมัติรหัสจับคู่เมื่อมีการติดต่อครั้งแรก

## คืออะไร

- ทำงานทั้งหมดในโปรเซสผ่าน `zca-js`
- ใช้ตัวรับฟังเหตุการณ์แบบเนทีฟเพื่อรับข้อความขาเข้า
- ส่งคำตอบโดยตรงผ่าน JS API (ข้อความ/สื่อ/ลิงก์)
- ออกแบบมาสำหรับกรณีใช้งานแบบ "บัญชีส่วนตัว" ที่ Zalo Bot API ไม่พร้อมใช้งาน

## การตั้งชื่อ

รหัสช่องทางคือ `zalouser` เพื่อระบุอย่างชัดเจนว่านี่ทำให้ **บัญชีผู้ใช้ Zalo ส่วนตัว** ทำงานอัตโนมัติ (ไม่เป็นทางการ) เราสงวน `zalo` ไว้สำหรับการผสานการทำงานกับ Zalo API อย่างเป็นทางการที่อาจมีในอนาคต

## การค้นหา ID (ไดเรกทอรี)

ใช้ CLI ไดเรกทอรีเพื่อค้นหาเพียร์/กลุ่มและ ID ของรายการเหล่านั้น:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## ข้อจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นส่วนละประมาณ 2000 อักขระ (ข้อจำกัดของไคลเอนต์ Zalo)
- การสตรีมถูกบล็อกตามค่าเริ่มต้น

## การควบคุมการเข้าถึง (ข้อความโดยตรง)

`channels.zalouser.dmPolicy` รองรับ: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)

`channels.zalouser.allowFrom` ควรใช้ ID ผู้ใช้ Zalo ที่เสถียร และยังสามารถอ้างอิงกลุ่มการเข้าถึงผู้ส่งแบบคงที่ได้ด้วย (`accessGroup:<name>`) ระหว่างการตั้งค่าแบบโต้ตอบ ชื่อที่ป้อนสามารถถูกแก้ไขเป็น ID ได้โดยใช้การค้นหารายชื่อติดต่อในโปรเซสของ Plugin

หากชื่อดิบยังคงอยู่ในคอนฟิก การเริ่มต้นระบบจะแก้ไขชื่อนั้นก็ต่อเมื่อเปิดใช้งาน `channels.zalouser.dangerouslyAllowNameMatching: true` หากไม่ได้เลือกใช้อย่างชัดเจน การตรวจสอบผู้ส่งขณะรันไทม์จะใช้เฉพาะ ID และชื่อดิบจะถูกละเว้นสำหรับการอนุญาต

อนุมัติผ่าน:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## การเข้าถึงกลุ่ม (ไม่บังคับ)

- ค่าเริ่มต้น: `channels.zalouser.groupPolicy = "open"` (อนุญาตกลุ่ม) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- จำกัดเป็นรายการที่อนุญาตด้วย:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (คีย์ควรเป็น ID กลุ่มที่เสถียร ชื่อจะถูกแก้ไขเป็น ID เมื่อเริ่มต้นระบบเท่านั้นเมื่อเปิดใช้งาน `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (ควบคุมว่าผู้ส่งรายใดในกลุ่มที่อนุญาตสามารถเรียกบอตได้ กลุ่มการเข้าถึงผู้ส่งแบบคงที่สามารถอ้างอิงด้วย `accessGroup:<name>`)
- บล็อกทุกกลุ่ม: `channels.zalouser.groupPolicy = "disabled"`
- วิซาร์ดกำหนดค่าสามารถถามรายการกลุ่มที่อนุญาตได้
- เมื่อเริ่มต้นระบบ OpenClaw จะแก้ไขชื่อกลุ่ม/ผู้ใช้ในรายการที่อนุญาตให้เป็น ID และบันทึกการแมปเฉพาะเมื่อเปิดใช้งาน `channels.zalouser.dangerouslyAllowNameMatching: true`
- การจับคู่รายการกลุ่มที่อนุญาตใช้เฉพาะ ID ตามค่าเริ่มต้น ชื่อที่แก้ไขไม่ได้จะถูกละเว้นสำหรับการยืนยันสิทธิ์ เว้นแต่จะเปิดใช้งาน `channels.zalouser.dangerouslyAllowNameMatching: true`
- `channels.zalouser.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้สำหรับกรณีฉุกเฉินที่เปิดใช้การแก้ไขชื่อเมื่อเริ่มต้นระบบที่เปลี่ยนแปลงได้และการจับคู่ชื่อกลุ่มขณะรันไทม์อีกครั้ง
- หากไม่ได้ตั้งค่า `groupAllowFrom` รันไทม์จะถอยกลับไปใช้ `allowFrom` สำหรับการตรวจสอบผู้ส่งในกลุ่ม
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

### การกั้นด้วยการกล่าวถึงในกลุ่ม

- `channels.zalouser.groups.<group>.requireMention` ควบคุมว่าการตอบกลับในกลุ่มต้องมีการกล่าวถึงหรือไม่
- ลำดับการแก้ไข: ID/ชื่อกลุ่มตรงกันแบบเป๊ะ -> slug กลุ่มที่ปรับให้เป็นมาตรฐาน -> `*` -> ค่าเริ่มต้น (`true`)
- ใช้กับทั้งกลุ่มในรายการที่อนุญาตและโหมดกลุ่มแบบเปิด
- การอ้างข้อความของบอตนับเป็นการกล่าวถึงโดยนัยสำหรับการเปิดใช้งานกลุ่ม
- คำสั่งควบคุมที่ได้รับอนุญาต (เช่น `/new`) สามารถข้ามการกั้นด้วยการกล่าวถึงได้
- เมื่อข้อความกลุ่มถูกข้ามเพราะต้องมีการกล่าวถึง OpenClaw จะจัดเก็บไว้เป็นประวัติกลุ่มที่รอดำเนินการ และรวมไว้ในข้อความกลุ่มถัดไปที่ถูกประมวลผล
- ค่าเริ่มต้นของขีดจำกัดประวัติกลุ่มคือ `messages.groupChat.historyLimit` (ค่าถอยกลับ `50`) คุณสามารถแทนที่เป็นรายบัญชีด้วย `channels.zalouser.historyLimit`

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

บัญชีจะถูกแมปกับโปรไฟล์ `zalouser` ในสถานะของ OpenClaw ตัวอย่าง:

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

## การพิมพ์ การโต้ตอบ และการรับทราบการส่งมอบ

- OpenClaw ส่งเหตุการณ์การพิมพ์ก่อนส่งคำตอบ (พยายามอย่างดีที่สุด)
- รองรับการกระทำโต้ตอบข้อความ `react` สำหรับ `zalouser` ในการกระทำของช่องทาง
  - ใช้ `remove: true` เพื่อลบอีโมจิการโต้ตอบที่ระบุออกจากข้อความ
  - ความหมายของการโต้ตอบ: [การโต้ตอบ](/th/tools/reactions)
- สำหรับข้อความขาเข้าที่มีเมทาดาทาเหตุการณ์ OpenClaw จะส่งการรับทราบว่าส่งถึงแล้ว + เห็นแล้ว (พยายามอย่างดีที่สุด)

## การแก้ไขปัญหา

**เข้าสู่ระบบแล้วสถานะไม่คงอยู่:**

- `openclaw channels status --probe`
- เข้าสู่ระบบใหม่: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**ชื่อในรายการที่อนุญาต/ชื่อกลุ่มไม่ถูกแก้ไข:**

- ใช้ ID ตัวเลขใน `allowFrom`/`groupAllowFrom` และ ID กลุ่มที่เสถียรใน `groups` หากคุณตั้งใจต้องใช้ชื่อเพื่อน/กลุ่มที่ตรงกันแบบเป๊ะ ให้เปิดใช้งาน `channels.zalouser.dangerouslyAllowNameMatching: true`

**อัปเกรดจากการตั้งค่าแบบใช้ CLI เก่า:**

- ลบสมมติฐานเดิมเกี่ยวกับโปรเซส `zca` ภายนอกออก
- ตอนนี้ช่องทางทำงานทั้งหมดใน OpenClaw โดยไม่มีไบนารี CLI ภายนอก

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนข้อความโดยตรงและโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกั้นด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
