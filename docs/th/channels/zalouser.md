---
read_when:
    - การตั้งค่า Zalo Personal สำหรับ OpenClaw
    - การดีบักการเข้าสู่ระบบหรือโฟลว์ข้อความของ Zalo Personal
summary: รองรับบัญชีส่วนตัว Zalo ผ่าน zca-js แบบเนทีฟ (เข้าสู่ระบบด้วย QR), ความสามารถ และการกำหนดค่า
title: Zalo ส่วนตัว
x-i18n:
    generated_at: "2026-06-27T17:14:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

สถานะ: ทดลอง การผสานการทำงานนี้ทำให้ **บัญชี Zalo ส่วนบุคคล** ทำงานอัตโนมัติผ่าน `zca-js` แบบเนทีฟภายใน OpenClaw

<Warning>
นี่เป็นการผสานการทำงานอย่างไม่เป็นทางการ และอาจทำให้บัญชีถูกระงับหรือถูกแบนได้ ใช้งานโดยยอมรับความเสี่ยงเอง
</Warning>

## Plugin ที่มาพร้อมชุดติดตั้ง

Zalo Personal จัดส่งเป็น Plugin ที่มาพร้อมชุดติดตั้งใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจปกติ
จึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Zalo Personal
ให้ติดตั้งแพ็กเกจ npm โดยตรง:

- ติดตั้งผ่าน CLI: `openclaw plugins install @openclaw/zalouser`
- เวอร์ชันที่ปักหมุดไว้: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- หรือจากเช็กเอาต์ซอร์ส: `openclaw plugins install ./path/to/local/zalouser-plugin`
- รายละเอียด: [Plugin](/th/tools/plugin)

ไม่จำเป็นต้องมีไบนารี CLI ภายนอก `zca`/`openzca`

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Plugin Zalo Personal พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมไว้แล้ว
   - การติดตั้งเก่า/แบบกำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
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

4. รีสตาร์ท Gateway (หรือทำการตั้งค่าให้เสร็จ)
5. การเข้าถึง DM มีค่าเริ่มต้นเป็นการจับคู่ อนุมัติรหัสจับคู่เมื่อมีการติดต่อครั้งแรก

## คืออะไร

- ทำงานทั้งหมดภายในโปรเซสผ่าน `zca-js`
- ใช้ตัวรับฟังอีเวนต์แบบเนทีฟเพื่อรับข้อความขาเข้า
- ส่งคำตอบโดยตรงผ่าน JS API (ข้อความ/สื่อ/ลิงก์)
- ออกแบบมาสำหรับกรณีใช้งานแบบ "บัญชีส่วนบุคคล" ที่ Zalo Bot API ไม่พร้อมใช้งาน

## การตั้งชื่อ

รหัสช่องทางคือ `zalouser` เพื่อระบุให้ชัดเจนว่านี่ทำให้ **บัญชีผู้ใช้ Zalo ส่วนบุคคล** ทำงานอัตโนมัติ (ไม่เป็นทางการ) เราสงวน `zalo` ไว้สำหรับการผสานการทำงานกับ Zalo API อย่างเป็นทางการที่อาจมีในอนาคต

## การหา ID (ไดเรกทอรี)

ใช้ CLI ไดเรกทอรีเพื่อค้นหาเพียร์/กลุ่มและ ID ของรายการเหล่านั้น:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## ข้อจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นชิ้นขนาดประมาณ 2000 อักขระ (ข้อจำกัดของไคลเอนต์ Zalo)
- การสตรีมถูกบล็อกตามค่าเริ่มต้น

## การควบคุมการเข้าถึง (DM)

`channels.zalouser.dmPolicy` รองรับ: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)

`channels.zalouser.allowFrom` ควรใช้ ID ผู้ใช้ Zalo ที่เสถียร และยังสามารถอ้างอิงกลุ่มการเข้าถึงผู้ส่งแบบคงที่ได้ด้วย (`accessGroup:<name>`) ระหว่างการตั้งค่าแบบโต้ตอบ ชื่อที่ป้อนสามารถถูกแปลงเป็น ID ได้โดยใช้การค้นหาผู้ติดต่อภายในโปรเซสของ Plugin

หากชื่อดิบยังคงอยู่ในคอนฟิก การเริ่มต้นระบบจะแปลงชื่อนั้นเฉพาะเมื่อเปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true` เท่านั้น หากไม่มีการเลือกเปิดใช้นี้ การตรวจสอบผู้ส่งขณะรันไทม์จะใช้เฉพาะ ID และชื่อดิบจะถูกละเว้นสำหรับการอนุญาต

อนุมัติผ่าน:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## การเข้าถึงกลุ่ม (ไม่บังคับ)

- ค่าเริ่มต้น: `channels.zalouser.groupPolicy = "open"` (อนุญาตกลุ่ม) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- จำกัดไว้เฉพาะ allowlist ด้วย:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (คีย์ควรเป็น ID กลุ่มที่เสถียร ชื่อจะถูกแปลงเป็น ID เมื่อเริ่มต้นระบบเฉพาะเมื่อเปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (ควบคุมว่าผู้ส่งใดในกลุ่มที่อนุญาตสามารถทริกเกอร์บอตได้ กลุ่มการเข้าถึงผู้ส่งแบบคงที่สามารถอ้างอิงด้วย `accessGroup:<name>`)
- บล็อกกลุ่มทั้งหมด: `channels.zalouser.groupPolicy = "disabled"`
- ตัวช่วยตั้งค่าสามารถถามหา allowlist ของกลุ่มได้
- เมื่อเริ่มต้นระบบ OpenClaw จะแปลงชื่อกลุ่ม/ผู้ใช้ใน allowlist เป็น ID และบันทึกการแมปเฉพาะเมื่อเปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`
- การจับคู่ allowlist ของกลุ่มใช้เฉพาะ ID ตามค่าเริ่มต้น ชื่อที่แปลงไม่ได้จะถูกละเว้นสำหรับการยืนยันสิทธิ์ เว้นแต่จะเปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`
- `channels.zalouser.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้แบบฉุกเฉินที่เปิดใช้การแปลงชื่อเมื่อเริ่มต้นระบบที่เปลี่ยนแปลงได้และการจับคู่ชื่อกลุ่มขณะรันไทม์อีกครั้ง
- หากไม่ได้ตั้งค่า `groupAllowFrom` รันไทม์จะย้อนกลับไปใช้ `allowFrom` สำหรับการตรวจสอบผู้ส่งในกลุ่ม
- การตรวจสอบผู้ส่งมีผลกับทั้งข้อความกลุ่มปกติและคำสั่งควบคุม (เช่น `/new`, `/reset`)

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

- `channels.zalouser.groups.<group>.requireMention` ควบคุมว่าคำตอบในกลุ่มต้องมีการกล่าวถึงหรือไม่
- ลำดับการแปลง: ID/ชื่อกลุ่มแบบตรงกันทุกตัว -> slug กลุ่มที่ทำให้เป็นมาตรฐาน -> `*` -> ค่าเริ่มต้น (`true`)
- มีผลทั้งกับกลุ่มใน allowlist และโหมดกลุ่มแบบเปิด
- การอ้างข้อความของบอตนับเป็นการกล่าวถึงโดยนัยสำหรับการเปิดใช้งานกลุ่ม
- คำสั่งควบคุมที่ได้รับอนุญาต (เช่น `/new`) สามารถข้ามการกั้นด้วยการกล่าวถึงได้
- เมื่อข้อความกลุ่มถูกข้ามเพราะต้องมีการกล่าวถึง OpenClaw จะจัดเก็บไว้เป็นประวัติกลุ่มที่รอดำเนินการและรวมไว้ในข้อความกลุ่มถัดไปที่ถูกประมวลผล
- ขีดจำกัดประวัติกลุ่มมีค่าเริ่มต้นเป็น `messages.groupChat.historyLimit` (fallback `50`) คุณสามารถแทนที่เป็นรายบัญชีด้วย `channels.zalouser.historyLimit`

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

บัญชีแมปกับโปรไฟล์ `zalouser` ในสถานะ OpenClaw ตัวอย่าง:

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

## ตัวแปรสภาพแวดล้อม

Plugin Zalo Personal ยังสามารถอ่านการเลือกโปรไฟล์จากตัวแปรสภาพแวดล้อมได้ด้วย:

- `ZALOUSER_PROFILE`: ชื่อโปรไฟล์ที่จะใช้เมื่อไม่ได้ตั้งค่า `profile` ในคอนฟิกช่องทางหรือบัญชี
- `ZCA_PROFILE`: ชื่อโปรไฟล์ fallback แบบเดิม ใช้เฉพาะเมื่อไม่ได้ตั้งค่า `ZALOUSER_PROFILE`

ชื่อโปรไฟล์จะเลือกข้อมูลรับรองการเข้าสู่ระบบ Zalo ที่บันทึกไว้ในสถานะ OpenClaw ลำดับการแปลงคือ:

1. `profile` แบบชัดเจนในคอนฟิก
2. `ZALOUSER_PROFILE`
3. `ZCA_PROFILE`
4. ID บัญชีสำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น หรือ `default` สำหรับบัญชีค่าเริ่มต้น

สำหรับการตั้งค่าหลายบัญชี ควรตั้งค่า `profile` ในแต่ละบัญชีในคอนฟิก เพื่อให้
ตัวแปรสภาพแวดล้อมเพียงตัวเดียวไม่ทำให้หลายบัญชีใช้เซสชันการเข้าสู่ระบบเดียวกันร่วมกัน

## การพิมพ์ ปฏิกิริยา และการยืนยันการส่ง

- OpenClaw ส่งอีเวนต์การพิมพ์ก่อนส่งคำตอบ (พยายามอย่างดีที่สุด)
- รองรับแอ็กชันปฏิกิริยาข้อความ `react` สำหรับ `zalouser` ในแอ็กชันช่องทาง
  - ใช้ `remove: true` เพื่อลบอีโมจิปฏิกิริยาเฉพาะรายการออกจากข้อความ
  - ความหมายของปฏิกิริยา: [ปฏิกิริยา](/th/tools/reactions)
- สำหรับข้อความขาเข้าที่มีเมทาดาทาอีเวนต์ OpenClaw จะส่งการยืนยัน delivered + seen (พยายามอย่างดีที่สุด)

## การแก้ไขปัญหา

**การเข้าสู่ระบบไม่คงอยู่:**

- `openclaw channels status --probe`
- เข้าสู่ระบบอีกครั้ง: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**ชื่อใน allowlist/กลุ่มไม่ถูกแปลง:**

- ใช้ ID แบบตัวเลขใน `allowFrom`/`groupAllowFrom` และ ID กลุ่มที่เสถียรใน `groups` หากคุณตั้งใจต้องใช้ชื่อเพื่อน/กลุ่มแบบตรงกันทุกตัว ให้เปิดใช้ `channels.zalouser.dangerouslyAllowNameMatching: true`

**อัปเกรดจากการตั้งค่าแบบ CLI เก่า:**

- ลบสมมติฐานเกี่ยวกับโปรเซสภายนอก `zca` เก่าออก
- ตอนนี้ช่องทางทำงานเต็มรูปแบบใน OpenClaw โดยไม่ต้องใช้ไบนารี CLI ภายนอก

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการกั้นด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
