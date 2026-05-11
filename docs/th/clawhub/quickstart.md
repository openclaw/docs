---
read_when:
    - การใช้งาน ClawHub ครั้งแรก
    - การติดตั้ง Skills หรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้งาน ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin.'
x-i18n:
    generated_at: "2026-05-11T20:25:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub คือ registry สำหรับ Skills และ Plugin ของ OpenClaw

ใช้ OpenClaw เมื่อคุณกำลังติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้
เวิร์กโฟลว์เฉพาะของ registry

## ค้นหาและติดตั้ง skill

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้ง skill:

```bash
openclaw skills install <skill-slug>
```

อัปเดต Skills ที่ติดตั้งแล้ว:

```bash
openclaw skills update --all
```

OpenClaw บันทึกว่า skill มาจากที่ใด เพื่อให้การอัปเดตภายหลังยังคง
resolve ผ่าน ClawHub ได้

## ค้นหาและติดตั้ง Plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง Plugin ที่โฮสต์บน ClawHub โดยระบุแหล่งที่มาของ ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต Plugin ที่ติดตั้งแล้ว:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ OpenClaw resolve package ผ่าน
ClawHub แทน npm หรือแหล่งอื่น

## ลงชื่อเข้าใช้เพื่อเผยแพร่

ติดตั้ง CLI ของ ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

ลงชื่อเข้าใช้ด้วย GitHub:

```bash
clawhub login
clawhub whoami
```

สภาพแวดล้อมแบบ headless สามารถใช้ API token จาก UI เว็บของ ClawHub:

```bash
clawhub login --token clh_...
```

## เผยแพร่ skill

skill คือโฟลเดอร์ที่ต้องมีไฟล์ `SKILL.md` และอาจมีไฟล์สนับสนุนเพิ่มเติมได้

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

ก่อนเผยแพร่ ให้ตรวจสอบ metadata ใน `SKILL.md` ระบุ environment variables,
tools และ permissions ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่า skill ต้องการอะไร
ก่อนติดตั้ง ดู [รูปแบบ skill](/th/clawhub/skill-format)

## เผยแพร่ Plugin

เผยแพร่ Plugin จากโฟลเดอร์ในเครื่อง, repo GitHub, ref ของ GitHub หรือ
archive ที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่าง metadata ของ package ที่ resolve แล้ว,
ฟิลด์ compatibility, การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่จริง

Code plugins ต้องมี metadata ความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ซิงค์ Skills ที่คุณดูแล

`sync` จะสแกนโฟลเดอร์ skill และเผยแพร่ skill ใหม่หรือ skill ที่เปลี่ยนแปลง
ซึ่งยังไม่ได้ซิงโครไนซ์

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

เมื่อคุณลงชื่อเข้าใช้แล้ว `sync` อาจส่ง snapshot การติดตั้งแบบย่อสำหรับ
จำนวนการติดตั้งรวมด้วย ดู [Telemetry](/th/clawhub/telemetry) เพื่อดูว่ามีการรายงานอะไร
และวิธี opt out

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ใช้เว็บเพจของ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
metadata, ลิงก์แหล่งที่มา, เวอร์ชัน, changelogs และสถานะการสแกน:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

รายการสาธารณะจะแสดงสถานะการสแกนล่าสุด release ที่ถูกระงับหรือถูกบล็อกโดย
moderation อาจถูกซ่อนจาก search และ install surfaces จนกว่าจะได้รับการแก้ไข
