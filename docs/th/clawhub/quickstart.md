---
read_when:
    - ใช้งาน ClawHub ครั้งแรก
    - การติดตั้ง Skills หรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้ ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-05-12T12:49:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub เป็น registry สำหรับ OpenClaw skills และ plugins

ใช้ OpenClaw เมื่อคุณกำลังติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ `clawhub` CLI
เมื่อคุณกำลังลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้เวิร์กโฟลว์เฉพาะ
registry

## ค้นหาและติดตั้ง skill

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้ง skill:

```bash
openclaw skills install <skill-slug>
```

อัปเดต skills ที่ติดตั้งแล้ว:

```bash
openclaw skills update --all
```

OpenClaw บันทึกว่า skill มาจากที่ใด เพื่อให้การอัปเดตภายหลังยังสามารถ
แก้ resolve ผ่าน ClawHub ได้ต่อไป

## ค้นหาและติดตั้ง plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง plugin ที่โฮสต์บน ClawHub ด้วยแหล่งที่มา ClawHub ที่ระบุชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต plugins ที่ติดตั้งแล้ว:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ OpenClaw resolve package ผ่าน
ClawHub แทน npm หรือแหล่งอื่น

## ลงชื่อเข้าใช้เพื่อเผยแพร่

ติดตั้ง ClawHub CLI:

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

สภาพแวดล้อมแบบ headless สามารถใช้ API token จาก ClawHub web UI ได้:

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
ก่อนติดตั้ง ดู [รูปแบบ Skill](/th/clawhub/skill-format)

## เผยแพร่ plugin

เผยแพร่ plugin จากโฟลเดอร์ภายในเครื่อง, GitHub repo, GitHub ref หรือ
archive ที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่าง package metadata ที่ resolve แล้ว,
compatibility fields, source attribution และแผนการอัปโหลดโดยไม่เผยแพร่จริง

Code plugins ต้องมี OpenClaw compatibility metadata ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ซิงค์ skills ที่คุณดูแล

`sync` จะสแกนโฟลเดอร์ skill และเผยแพร่ skills ใหม่หรือที่มีการเปลี่ยนแปลง
ซึ่งยังไม่ได้ซิงโครไนซ์

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

เมื่อคุณลงชื่อเข้าใช้แล้ว `sync` อาจส่ง minimal install snapshot สำหรับ
aggregate install counts ด้วย ดู [Telemetry](/th/clawhub/telemetry) เพื่อดูว่ามีการรายงานอะไร
และวิธี opt out

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บ ClawHub หรือคำสั่ง CLI detail เพื่อตรวจสอบ
metadata, source links, versions, changelogs และ scan status:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

รายการสาธารณะจะแสดงสถานะการสแกนล่าสุด releases ที่ถูกพักไว้หรือถูกบล็อกโดย
moderation อาจถูกซ่อนจากพื้นผิวการค้นหาและติดตั้งจนกว่าจะได้รับการแก้ไข
