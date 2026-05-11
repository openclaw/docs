---
read_when:
    - ใช้งาน ClawHub เป็นครั้งแรก
    - การติดตั้ง Skills หรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้ ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-05-11T22:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub คือรีจิสทรีสำหรับ Skills และ Plugin ของ OpenClaw

ใช้ OpenClaw เมื่อคุณติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้เวิร์กโฟลว์เฉพาะของรีจิสทรี

## ค้นหาและติดตั้ง Skills

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้ง Skills:

```bash
openclaw skills install <skill-slug>
```

อัปเดต Skills ที่ติดตั้งแล้ว:

```bash
openclaw skills update --all
```

OpenClaw บันทึกว่า Skills มาจากที่ใด เพื่อให้การอัปเดตในภายหลังยังสามารถ
แก้ไขแหล่งที่มาผ่าน ClawHub ต่อไปได้

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

ใช้คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ OpenClaw แก้ไขแพ็กเกจผ่าน
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

สภาพแวดล้อมแบบ headless สามารถใช้โทเค็น API จาก UI เว็บของ ClawHub ได้:

```bash
clawhub login --token clh_...
```

## เผยแพร่ Skills

Skills คือโฟลเดอร์ที่ต้องมีไฟล์ `SKILL.md` และอาจมีไฟล์สนับสนุนเพิ่มเติมได้

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

ก่อนเผยแพร่ ให้ตรวจสอบเมตาดาต้าใน `SKILL.md` ระบุตัวแปรสภาพแวดล้อม
เครื่องมือ และสิทธิ์ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่า Skills ต้องใช้อะไร
ก่อนติดตั้ง ดู [รูปแบบ Skills](/th/clawhub/skill-format)

## เผยแพร่ Plugin

เผยแพร่ Plugin จากโฟลเดอร์ภายในเครื่อง รีโป GitHub, ref ของ GitHub หรือ
อาร์ไคฟ์ที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่างเมตาดาต้าแพ็กเกจที่แก้ไขแล้ว ฟิลด์ความเข้ากันได้
การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่จริง

Code Plugin ต้องมีเมตาดาต้าความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ซิงค์ Skills ที่คุณดูแล

`sync` จะสแกนโฟลเดอร์ Skills และเผยแพร่ Skills ใหม่หรือที่มีการเปลี่ยนแปลงซึ่งยังไม่ได้
ซิงโครไนซ์ไว้

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

เมื่อคุณลงชื่อเข้าใช้แล้ว `sync` อาจส่งสแนปช็อตการติดตั้งแบบย่อสำหรับ
จำนวนการติดตั้งรวมด้วย ดู [Telemetry](/th/clawhub/telemetry) สำหรับสิ่งที่ถูกรายงาน
และวิธีปิดไม่เข้าร่วม

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บ ClawHub หรือคำสั่งรายละเอียดใน CLI เพื่อตรวจสอบ
เมตาดาต้า ลิงก์แหล่งที่มา เวอร์ชัน changelog และสถานะการสแกน:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

รายการสาธารณะแสดงสถานะการสแกนล่าสุด รุ่นเผยแพร่ที่ถูกพักหรือถูกบล็อกโดย
การกลั่นกรองอาจถูกซ่อนจากพื้นผิวการค้นหาและการติดตั้งจนกว่าจะได้รับการแก้ไข
