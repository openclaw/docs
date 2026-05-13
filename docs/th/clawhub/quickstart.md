---
read_when:
    - การใช้ ClawHub ครั้งแรก
    - การติดตั้งทักษะหรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้ ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-05-13T05:32:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Quickstart

ClawHub เป็น registry สำหรับ Skills และ Plugin ของ OpenClaw

ใช้ OpenClaw เมื่อคุณกำลังติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังเข้าสู่ระบบ เผยแพร่ จัดการรายการของคุณเอง หรือใช้
เวิร์กโฟลว์เฉพาะของ registry

## ค้นหาและติดตั้ง Skill

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้ง Skill:

```bash
openclaw skills install <skill-slug>
```

อัปเดต Skills ที่ติดตั้งไว้:

```bash
openclaw skills update --all
```

OpenClaw จะบันทึกว่า Skill มาจากที่ใด เพื่อให้การอัปเดตภายหลังยังคง
resolve ผ่าน ClawHub ได้ต่อไป

## ค้นหาและติดตั้ง Plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง Plugin ที่โฮสต์บน ClawHub พร้อมระบุแหล่งที่มาของ ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต Plugin ที่ติดตั้งไว้:

```bash
openclaw plugins update --all
```

ใช้ prefix `clawhub:` เมื่อคุณต้องการให้ OpenClaw resolve package ผ่าน
ClawHub แทน npm หรือแหล่งอื่น

## เข้าสู่ระบบเพื่อเผยแพร่

ติดตั้ง CLI ของ ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

เข้าสู่ระบบด้วย GitHub:

```bash
clawhub login
clawhub whoami
```

สภาพแวดล้อมแบบ headless สามารถใช้ API token จาก web UI ของ ClawHub ได้:

```bash
clawhub login --token clh_...
```

## เผยแพร่ Skill

Skill คือโฟลเดอร์ที่ต้องมีไฟล์ `SKILL.md` และอาจมีไฟล์สนับสนุนเพิ่มเติมได้

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

ก่อนเผยแพร่ ให้ตรวจสอบ metadata ใน `SKILL.md` ประกาศ
ตัวแปรสภาพแวดล้อม เครื่องมือ และสิทธิ์ที่ต้องใช้ เพื่อให้ผู้ใช้เข้าใจว่า
Skill ต้องการอะไรบ้างก่อนติดตั้ง ดู [รูปแบบ Skill](/th/clawhub/skill-format)

## เผยแพร่ Plugin

เผยแพร่ Plugin จากโฟลเดอร์ในเครื่อง, repo GitHub, ref ของ GitHub หรือ
archive ที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่าง metadata ของ package ที่ resolve แล้ว,
ช่องข้อมูลความเข้ากันได้, การระบุแหล่งที่มา และแผนการอัปโหลด โดยยังไม่เผยแพร่

Code Plugin ต้องมี metadata ความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ซิงค์ Skills ที่คุณดูแล

`sync` จะสแกนโฟลเดอร์ Skill และเผยแพร่ Skills ใหม่หรือที่มีการเปลี่ยนแปลงซึ่งยัง
ไม่ได้ซิงโครไนซ์ไว้

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

เมื่อคุณเข้าสู่ระบบแล้ว `sync` อาจส่ง snapshot การติดตั้งขั้นต่ำสำหรับ
จำนวนการติดตั้งแบบรวมด้วย ดู [Telemetry](/th/clawhub/telemetry) สำหรับสิ่งที่ถูกรายงาน
และวิธี opt out

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ใช้หน้าเว็บ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
metadata, ลิงก์แหล่งที่มา, เวอร์ชัน, changelog และสถานะการสแกน:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

รายการสาธารณะจะแสดงสถานะการสแกนล่าสุด Release ที่ถูก hold หรือถูก block โดย
การ moderation อาจถูกซ่อนจากพื้นผิวการค้นหาและติดตั้งจนกว่าจะได้รับการแก้ไข
