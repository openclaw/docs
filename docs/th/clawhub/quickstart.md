---
read_when:
    - ใช้ ClawHub เป็นครั้งแรก
    - การติดตั้งทักษะหรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มต้นใช้งาน ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-07-01T08:41:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub คือรีจิสทรีสำหรับสกิลและ Plugin ของ OpenClaw

ใช้ OpenClaw เมื่อคุณติดตั้งสิ่งต่างๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้
เวิร์กโฟลว์เฉพาะของรีจิสทรี

## ค้นหาและติดตั้งสกิล

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้งสกิล:

```bash
openclaw skills install @openclaw/demo
```

อัปเดตสกิลที่ติดตั้งแล้ว:

```bash
openclaw skills update --all
```

OpenClaw บันทึกว่าสกิลมาจากที่ใด เพื่อให้การอัปเดตภายหลังสามารถ
แก้ไขผ่าน ClawHub ต่อไปได้

## ค้นหาและติดตั้ง Plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง Plugin ที่โฮสต์บน ClawHub พร้อมแหล่งที่มา ClawHub แบบระบุชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต Plugin ที่ติดตั้งแล้ว:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ OpenClaw แก้ไขแพ็กเกจผ่าน
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

สภาพแวดล้อมแบบไม่มีส่วนติดต่อผู้ใช้สามารถใช้โทเค็น API จาก UI เว็บของ ClawHub:

```bash
clawhub login --token clh_...
```

## เผยแพร่สกิล

สกิลคือโฟลเดอร์ที่มีไฟล์ `SKILL.md` ซึ่งจำเป็นต้องมี และอาจมีไฟล์สนับสนุน
เพิ่มเติมได้

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

คำสั่งจะข้ามเนื้อหาที่ไม่มีการเปลี่ยนแปลง สกิลใหม่เริ่มที่ `1.0.0`; การเปลี่ยนแปลงภายหลัง
จะเผยแพร่เวอร์ชันแพตช์ถัดไปโดยอัตโนมัติ ใช้ `--dry-run` เพื่อดูตัวอย่าง หรือ
`--version` เพื่อเลือกเวอร์ชันแบบระบุชัดเจน

ก่อนเผยแพร่ ให้ตรวจสอบเมทาดาทาใน `SKILL.md` ประกาศ
ตัวแปรสภาพแวดล้อม เครื่องมือ และสิทธิ์ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่าสกิล
ต้องใช้อะไรก่อนติดตั้ง ดู [รูปแบบสกิล](/th/clawhub/skill-format)

สำหรับรีโพซิทอรีที่มีหลายสกิล เวิร์กโฟลว์ GitHub ที่ใช้ซ้ำได้จะเรียก
`skill publish` สำหรับแต่ละโฟลเดอร์สกิลโดยตรงภายใต้ `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## เผยแพร่ Plugin

เผยแพร่ Plugin จากโฟลเดอร์ในเครื่อง รีโพซิทอรี GitHub, GitHub ref หรือ
ไฟล์เก็บถาวรที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่างเมทาดาทาแพ็กเกจที่แก้ไขแล้ว ฟิลด์ความเข้ากันได้
การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่

Code Plugin ต้องมีเมทาดาทาความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
เมทาดาทา ลิงก์แหล่งที่มา เวอร์ชัน บันทึกการเปลี่ยนแปลง และสถานะการสแกน:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

รายการสาธารณะแสดงสถานะการสแกนล่าสุด รุ่นเผยแพร่ที่ถูกระงับหรือบล็อกโดย
การกลั่นกรองอาจถูกซ่อนจากพื้นผิวการค้นหาและการติดตั้งจนกว่าจะได้รับการแก้ไข
