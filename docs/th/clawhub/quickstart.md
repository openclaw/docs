---
read_when:
    - การใช้งาน ClawHub ครั้งแรก
    - การติดตั้ง Skills หรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้งาน ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-07-16T18:50:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub คือรีจิสทรีสำหรับ Skills และ Plugin ของ OpenClaw

ใช้ OpenClaw เมื่อติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของตนเอง หรือใช้
เวิร์กโฟลว์เฉพาะของรีจิสทรี

## ค้นหาและติดตั้ง Skill

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้ง Skill:

```bash
openclaw skills install @openclaw/demo
```

อัปเดต Skills ที่ติดตั้งไว้:

```bash
openclaw skills update --all
```

OpenClaw บันทึกแหล่งที่มาของ Skill เพื่อให้การอัปเดตในภายหลังยังคง
ค้นหาและดึงข้อมูลผ่าน ClawHub ได้

## ค้นหาและติดตั้ง Plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง Plugin ที่โฮสต์บน ClawHub โดยระบุแหล่งที่มาเป็น ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต Plugin ที่ติดตั้งไว้:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อต้องการให้ OpenClaw ค้นหาและดึงแพ็กเกจผ่าน
ClawHub แทน npm หรือแหล่งอื่น

## ลงชื่อเข้าใช้เพื่อเผยแพร่

ติดตั้ง CLI ของ ClawHub:

```bash
npm i -g clawhub
# หรือ
pnpm add -g clawhub
```

ลงชื่อเข้าใช้ด้วย GitHub:

```bash
clawhub login
clawhub whoami
```

สภาพแวดล้อมแบบไม่มีส่วนติดต่อผู้ใช้สามารถใช้โทเค็น API จากเว็บ UI ของ ClawHub:

```bash
clawhub login --token clh_...
```

## เผยแพร่ Skill

Skill คือโฟลเดอร์ที่ต้องมีไฟล์ `SKILL.md` และอาจมีไฟล์สนับสนุน
เพิ่มเติม

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

คำสั่งจะข้ามเนื้อหาที่ไม่มีการเปลี่ยนแปลง Skill ใหม่เริ่มต้นที่ `1.0.0`; การเปลี่ยนแปลงภายหลัง
จะเผยแพร่เวอร์ชันแพตช์ถัดไปโดยอัตโนมัติ ใช้ `--dry-run` เพื่อดูตัวอย่าง หรือ
`--version` เพื่อเลือกเวอร์ชันที่ระบุอย่างชัดเจน

ก่อนเผยแพร่ ให้ตรวจสอบข้อมูลเมตาใน `SKILL.md` ระบุ
ตัวแปรสภาพแวดล้อม เครื่องมือ และสิทธิ์ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่า
Skill ต้องใช้อะไรก่อนติดตั้ง ดู [รูปแบบ Skill](/th/clawhub/skill-format)

สำหรับรีโพซิทอรีที่มีหลาย Skills เวิร์กโฟลว์ GitHub ที่นำกลับมาใช้ใหม่ได้จะเรียก
`skill publish` สำหรับแต่ละโฟลเดอร์ Skill ระดับแรกภายใต้ `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## เผยแพร่ Plugin

เผยแพร่ Plugin จากโฟลเดอร์ในเครื่อง รีโพซิทอรี GitHub การอ้างอิง GitHub หรือ
ไฟล์เก็บถาวรที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่างข้อมูลเมตาของแพ็กเกจที่ค้นหาได้ ฟิลด์ความเข้ากันได้
การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่

Plugin ที่เป็นโค้ดต้องมีข้อมูลเมตาความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
ข้อมูลเมตา ลิงก์แหล่งที่มา เวอร์ชัน บันทึกการเปลี่ยนแปลง และสถานะการสแกน:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

รายการสาธารณะจะแสดงสถานะการสแกนล่าสุด รุ่นที่ถูกระงับหรือบล็อกโดย
การกลั่นกรองอาจถูกซ่อนจากส่วนค้นหาและติดตั้งจนกว่าปัญหาจะได้รับการแก้ไข
