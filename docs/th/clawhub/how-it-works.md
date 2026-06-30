---
read_when:
    - ทำความเข้าใจรายการ เวอร์ชัน การติดตั้ง การเผยแพร่ และการกลั่นกรอง
summary: วิธีการทำงานของรายการ ClawHub, เวอร์ชัน, การติดตั้ง, การเผยแพร่, การสแกน และการอัปเดต.
x-i18n:
    generated_at: "2026-06-30T14:29:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# วิธีการทำงานของ ClawHub

ClawHub คือชั้น registry สำหรับ Skills และ Plugin ของ OpenClaw โดยให้ผู้ใช้มี
พื้นที่สำหรับค้นหาแพ็กเกจ ให้ผู้เผยแพร่มีพื้นที่สำหรับปล่อยเวอร์ชัน และให้
OpenClaw มี metadata เพียงพอสำหรับติดตั้งและอัปเดตแพ็กเกจเหล่านั้นอย่างปลอดภัย

## ระเบียน registry

รายการสาธารณะแต่ละรายการคือระเบียน registry ที่มี:

- เจ้าของและ slug หรือชื่อแพ็กเกจ
- เวอร์ชันที่เผยแพร่แล้วอย่างน้อยหนึ่งเวอร์ชัน
- metadata, สรุป, ไฟล์, และการระบุแหล่งที่มา
- ข้อมูล changelog และแท็ก เช่น `latest`
- สัญญาณการดาวน์โหลด การติดตั้ง และดาว
- สถานะการสแกนความปลอดภัยและการดูแลเนื้อหา

หน้ารายการคือที่ canonical สำหรับให้ผู้ใช้ตรวจสอบว่า Skills หรือ
Plugin อ้างว่าจะทำอะไรก่อนติดตั้ง

## Skills

Skills คือชุดข้อความที่มีเวอร์ชัน โดยมีศูนย์กลางอยู่ที่ `SKILL.md` และสามารถมี
ไฟล์สนับสนุน ตัวอย่าง เทมเพลต และสคริปต์ได้

ClawHub อ่าน frontmatter ของ `SKILL.md` เพื่อทำความเข้าใจชื่อ Skills,
คำอธิบาย, requirements, environment variables, และ metadata metadata ที่ถูกต้อง
มีความสำคัญ เพราะช่วยให้ผู้ใช้ตัดสินใจว่าจะติดตั้ง Skills หรือไม่ และช่วยให้
การสแกนอัตโนมัติตรวจพบความไม่ตรงกันระหว่างพฤติกรรมที่ประกาศไว้กับพฤติกรรมที่สังเกตได้

ดู [รูปแบบ Skills](/th/clawhub/skill-format)

## Plugin

Plugin คือส่วนขยายของ OpenClaw ที่ถูกจัดแพ็กเกจ ClawHub จัดเก็บ metadata ของแพ็กเกจ,
ข้อมูล compatibility, ลิงก์ source, artifacts, และระเบียนเวอร์ชัน

เมื่อ OpenClaw ติดตั้ง Plugin จาก ClawHub ระบบจะตรวจสอบ metadata compatibility
ที่ประกาศไว้ก่อนติดตั้ง ระเบียนแพ็กเกจสามารถมี API compatibility,
เวอร์ชัน Gateway ขั้นต่ำ, host targets, ข้อกำหนด environment, และ artifact
digests

ใช้แหล่งติดตั้ง ClawHub อย่างชัดเจนเมื่อต้องการให้ registry เป็น
source of truth:

```bash
openclaw plugins install clawhub:<package>
```

## การเผยแพร่

การเผยแพร่จะสร้างระเบียนเวอร์ชันใหม่ที่เปลี่ยนแปลงไม่ได้ ผู้เผยแพร่ใช้ CLI
`clawhub` สำหรับเวิร์กโฟลว์ registry ที่ต้องยืนยันตัวตน:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ dry runs เพื่อดูตัวอย่าง payload ที่ resolve แล้วก่อนอัปโหลด จากนั้นหน้าสาธารณะจะ
แสดง metadata ที่เผยแพร่แล้ว, ไฟล์, การระบุแหล่งที่มา, และสถานะการสแกน

## การติดตั้งและการอัปเดต

คำสั่งติดตั้งของ OpenClaw ใช้ ClawHub เป็นแหล่งแพ็กเกจ:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw บันทึก metadata ของแหล่งติดตั้ง เพื่อให้การอัปเดตสามารถ resolve
แพ็กเกจ registry เดิมได้ในภายหลัง CLI ของ ClawHub ยังรองรับเวิร์กโฟลว์ติดตั้งและ
อัปเดต Skills โดยตรงสำหรับผู้ใช้ที่ต้องการโฟลเดอร์ Skills ที่จัดการโดย registry
นอก workspace ของ OpenClaw แบบเต็ม

## สถานะความปลอดภัย

ClawHub เปิดให้เผยแพร่ได้ แต่ release ยังคงต้องผ่าน upload gates,
การตรวจสอบอัตโนมัติ, รายงานจากผู้ใช้, และการดำเนินการของผู้ดูแล

หน้าสาธารณะแสดงสรุปการสแกนเมื่อมี เนื้อหาที่ถูกระงับ ซ่อน
หรือบล็อก อาจหายไปจากการค้นหาสาธารณะและโฟลว์ติดตั้ง ขณะที่ยังคง
มองเห็นได้สำหรับเจ้าของเพื่อใช้วินิจฉัยปัญหา

ดู [ความปลอดภัย](/clawhub/security), [การตรวจสอบความปลอดภัย](/clawhub/security-audits),
[การดูแลเนื้อหาและความปลอดภัยของบัญชี](/th/clawhub/moderation), และ
[การใช้งานที่ยอมรับได้](/clawhub/acceptable-usage)

## การเข้าถึง API

ClawHub เปิดเผย API แบบอ่านสาธารณะสำหรับ discovery, search, รายละเอียดแพ็กเกจ, และ
downloads แค็ตตาล็อกของบุคคลที่สามอาจใช้ API เหล่านี้ได้เมื่อเชื่อมโยงกลับไปยัง
รายการ ClawHub แบบ canonical, เคารพ rate limits, และหลีกเลี่ยงการสื่อว่าได้รับการรับรอง

ดู [API สาธารณะ](/clawhub/api) และ [HTTP API](/clawhub/http-api)
