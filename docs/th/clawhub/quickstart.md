---
read_when:
    - ใช้ ClawHub เป็นครั้งแรก
    - การติดตั้ง Skills หรือ Plugin จาก registry
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้ ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-07-01T15:33:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub คือรีจิสทรีสำหรับ OpenClaw Skills และ Plugin

ใช้ OpenClaw เมื่อคุณกำลังติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้
เวิร์กโฟลว์เฉพาะของรีจิสทรี

## ค้นหาและติดตั้ง Skills

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้ง Skills:

```bash
openclaw skills install @openclaw/demo
```

อัปเดต Skills ที่ติดตั้งไว้:

```bash
openclaw skills update --all
```

OpenClaw จะบันทึกว่า Skills มาจากที่ใด เพื่อให้การอัปเดตภายหลังยังคง
แก้ตำแหน่งผ่าน ClawHub ได้ต่อไป

## ค้นหาและติดตั้ง Plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง Plugin ที่โฮสต์บน ClawHub โดยระบุแหล่งที่มา ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต Plugin ที่ติดตั้งไว้:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ OpenClaw แก้ตำแหน่งแพ็กเกจผ่าน
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

สภาพแวดล้อมแบบไม่มีส่วนติดต่อผู้ใช้สามารถใช้ API token จาก UI เว็บของ ClawHub:

```bash
clawhub login --token clh_...
```

## เผยแพร่ Skills

Skills คือโฟลเดอร์ที่ต้องมีไฟล์ `SKILL.md` และอาจมีไฟล์สนับสนุนเพิ่มเติมได้

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

คำสั่งนี้จะข้ามเนื้อหาที่ไม่มีการเปลี่ยนแปลง Skills ใหม่จะเริ่มที่ `1.0.0`;
การเปลี่ยนแปลงภายหลังจะเผยแพร่เวอร์ชันแพตช์ถัดไปโดยอัตโนมัติ ใช้ `--dry-run`
เพื่อดูตัวอย่าง หรือใช้ `--version` เพื่อเลือกเวอร์ชันอย่างชัดเจน

ก่อนเผยแพร่ ให้ตรวจสอบเมตาดาต้าใน `SKILL.md` ประกาศตัวแปรสภาพแวดล้อม
เครื่องมือ และสิทธิ์ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่า Skills ต้องการอะไร
ก่อนที่พวกเขาจะติดตั้ง ดู [รูปแบบ Skills](/th/clawhub/skill-format)

สำหรับรีโพซิทอรีที่มี Skills หลายรายการ เวิร์กโฟลว์ GitHub ที่ใช้ซ้ำได้จะเรียก
`skill publish` สำหรับแต่ละโฟลเดอร์ Skills ระดับถัดไปโดยตรงภายใต้ `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## เผยแพร่ Plugin

เผยแพร่ Plugin จากโฟลเดอร์ในเครื่อง รีโพซิทอรี GitHub, GitHub ref หรือ
อาร์ไคฟ์ที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่างเมตาดาต้าแพ็กเกจที่แก้ตำแหน่งแล้ว
ฟิลด์ความเข้ากันได้ การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่จริง

Code Plugin ต้องมีเมตาดาต้าความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
เมตาดาต้า ลิงก์แหล่งที่มา เวอร์ชัน บันทึกการเปลี่ยนแปลง และสถานะการสแกน:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

รายการสาธารณะจะแสดงสถานะการสแกนล่าสุด รุ่นที่ถูกพักหรือถูกบล็อกโดย
การกลั่นกรองอาจถูกซ่อนจากพื้นผิวการค้นหาและการติดตั้งจนกว่าจะได้รับการแก้ไข
