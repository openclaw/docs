---
read_when:
    - ใช้งาน ClawHub ครั้งแรก
    - การติดตั้งทักษะหรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้ ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ skills หรือ plugins'
x-i18n:
    generated_at: "2026-07-04T04:11:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub เป็นรีจิสทรีสำหรับ OpenClaw Skills และ Plugin.

ใช้ OpenClaw เมื่อคุณติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังเข้าสู่ระบบ เผยแพร่ จัดการรายการของคุณเอง หรือใช้
เวิร์กโฟลว์เฉพาะรีจิสทรี.

## ค้นหาและติดตั้ง Skill

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้ง Skill:

```bash
openclaw skills install @openclaw/demo
```

อัปเดต Skills ที่ติดตั้งแล้ว:

```bash
openclaw skills update --all
```

OpenClaw จะบันทึกว่า Skill มาจากที่ใด เพื่อให้การอัปเดตในภายหลังยังสามารถ
แก้การอ้างอิงผ่าน ClawHub ต่อไปได้.

## ค้นหาและติดตั้ง Plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง Plugin ที่โฮสต์บน ClawHub โดยระบุแหล่งที่มา ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต Plugin ที่ติดตั้งแล้ว:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อต้องการให้ OpenClaw แก้การอ้างอิงแพ็กเกจผ่าน
ClawHub แทน npm หรือแหล่งอื่น.

## เข้าสู่ระบบเพื่อเผยแพร่

ติดตั้ง ClawHub CLI:

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

สภาพแวดล้อมแบบไม่มีหน้าจอสามารถใช้โทเค็น API จาก ClawHub web UI ได้:

```bash
clawhub login --token clh_...
```

## เผยแพร่ Skill

Skill คือโฟลเดอร์ที่ต้องมีไฟล์ `SKILL.md` และอาจมีไฟล์สนับสนุนเพิ่มเติมได้.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

คำสั่งจะข้ามเนื้อหาที่ไม่เปลี่ยนแปลง Skills ใหม่เริ่มที่ `1.0.0`; การเปลี่ยนแปลงภายหลัง
จะเผยแพร่เวอร์ชันแพตช์ถัดไปโดยอัตโนมัติ ใช้ `--dry-run` เพื่อดูตัวอย่าง หรือ
`--version` เพื่อเลือกเวอร์ชันอย่างชัดเจน.

ก่อนเผยแพร่ ให้ตรวจสอบเมตาดาต้าใน `SKILL.md` ประกาศ
ตัวแปรสภาพแวดล้อม เครื่องมือ และสิทธิ์ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่า
Skill ต้องการอะไรบ้างก่อนติดตั้ง ดู [รูปแบบ Skill](/th/clawhub/skill-format).

สำหรับรีโพซิทอรีที่มีหลาย Skills เวิร์กโฟลว์ GitHub ที่ใช้ซ้ำได้จะเรียก
`skill publish` สำหรับแต่ละโฟลเดอร์ Skill โดยตรงภายใต้ `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## เผยแพร่ Plugin

เผยแพร่ Plugin จากโฟลเดอร์ในเครื่อง, รีโพ GitHub, GitHub ref หรือ
อาร์ไคฟ์ที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่างเมตาดาต้าแพ็กเกจที่แก้การอ้างอิงแล้ว,
ฟิลด์ความเข้ากันได้, การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่.

Code Plugin ต้องมีเมตาดาต้าความเข้ากันได้ของ OpenClaw ใน `package.json`,
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`.

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
เมตาดาต้า ลิงก์แหล่งที่มา เวอร์ชัน บันทึกการเปลี่ยนแปลง และสถานะการสแกน:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

รายการสาธารณะจะแสดงสถานะการสแกนล่าสุด รีลีสที่ถูกพักไว้หรือถูกบล็อกโดย
การกลั่นกรองอาจถูกซ่อนจากพื้นผิวการค้นหาและติดตั้งจนกว่าจะได้รับการแก้ไข.
