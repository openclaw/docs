---
read_when:
    - ใช้งาน ClawHub ครั้งแรก
    - การติดตั้ง skill หรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้ ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-07-02T17:49:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub คือ registry สำหรับ OpenClaw Skills และ Plugin

ใช้ OpenClaw เมื่อคุณกำลังติดตั้งสิ่งต่าง ๆ เข้าใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้เวิร์กโฟลว์
เฉพาะของ registry

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

OpenClaw บันทึกว่า Skill มาจากที่ใด เพื่อให้การอัปเดตภายหลังยังสามารถ
resolve ผ่าน ClawHub ต่อไปได้

## ค้นหาและติดตั้ง Plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง Plugin ที่โฮสต์บน ClawHub ด้วยแหล่ง ClawHub ที่ระบุชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต Plugin ที่ติดตั้งแล้ว:

```bash
openclaw plugins update --all
```

ใช้ prefix `clawhub:` เมื่อคุณต้องการให้ OpenClaw resolve แพ็กเกจผ่าน
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

สภาพแวดล้อมแบบไม่มีส่วนติดต่อผู้ใช้สามารถใช้โทเค็น API จาก UI เว็บของ ClawHub:

```bash
clawhub login --token clh_...
```

## เผยแพร่ Skill

Skill คือโฟลเดอร์ที่ต้องมีไฟล์ `SKILL.md` และอาจมีไฟล์สนับสนุนเพิ่มเติมได้

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

คำสั่งนี้จะข้ามเนื้อหาที่ไม่เปลี่ยนแปลง Skills ใหม่เริ่มที่ `1.0.0`; การเปลี่ยนแปลงภายหลัง
จะเผยแพร่เวอร์ชัน patch ถัดไปโดยอัตโนมัติ ใช้ `--dry-run` เพื่อดูตัวอย่าง หรือ
`--version` เพื่อเลือกเวอร์ชันที่ระบุชัดเจน

ก่อนเผยแพร่ ให้ตรวจสอบ metadata ใน `SKILL.md` ระบุตัวแปรสภาพแวดล้อม
เครื่องมือ และสิทธิ์ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่า Skill ต้องการอะไร
ก่อนติดตั้ง ดู [รูปแบบ Skill](/th/clawhub/skill-format)

สำหรับ repository ที่มีหลาย Skills เวิร์กโฟลว์ GitHub ที่ใช้ซ้ำได้จะเรียก
`skill publish` สำหรับโฟลเดอร์ Skill ระดับแรกแต่ละโฟลเดอร์ภายใต้ `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## เผยแพร่ Plugin

เผยแพร่ Plugin จากโฟลเดอร์ในเครื่อง, GitHub repo, GitHub ref หรือ
archive ที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่าง metadata ของแพ็กเกจที่ resolve แล้ว
ฟิลด์ compatibility การระบุแหล่งที่มา และแผนการอัปโหลด โดยไม่เผยแพร่จริง

Code Plugin ต้องมี metadata ความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บ ClawHub หรือคำสั่ง CLI สำหรับรายละเอียด เพื่อตรวจสอบ
metadata, ลิงก์แหล่งที่มา, เวอร์ชัน, changelog และสถานะการสแกน:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

รายการสาธารณะจะแสดงสถานะการสแกนล่าสุด release ที่ถูกพักไว้หรือถูกบล็อกโดย
การกลั่นกรองอาจถูกซ่อนจากพื้นผิวการค้นหาและติดตั้งจนกว่าจะแก้ไขแล้ว
