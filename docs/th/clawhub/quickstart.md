---
read_when:
    - ใช้งาน ClawHub ครั้งแรก
    - การติดตั้ง Skills หรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้ ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-05-12T23:29:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub คือรีจิสทรีสำหรับ Skills และ Plugin ของ OpenClaw

ใช้ OpenClaw เมื่อคุณติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้
เวิร์กโฟลว์เฉพาะของรีจิสทรี

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

OpenClaw จะบันทึกว่า Skills มาจากที่ใด เพื่อให้การอัปเดตภายหลังยังคง
แก้ข้อมูลผ่าน ClawHub ได้

## ค้นหาและติดตั้ง Plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง Plugin ที่โฮสต์บน ClawHub ด้วยแหล่งที่มา ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต Plugin ที่ติดตั้งแล้ว:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ OpenClaw แก้ข้อมูลแพ็กเกจผ่าน
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

สภาพแวดล้อมแบบไม่มีหน้าจอสามารถใช้โทเค็น API จาก UI เว็บของ ClawHub:

```bash
clawhub login --token clh_...
```

## เผยแพร่ Skills

Skills คือโฟลเดอร์ที่ต้องมีไฟล์ `SKILL.md` และอาจมีไฟล์สนับสนุนเพิ่มเติม

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

ก่อนเผยแพร่ ให้ตรวจสอบเมทาดาทาใน `SKILL.md` ระบุตัวแปรสภาพแวดล้อม
เครื่องมือ และสิทธิ์ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่า Skills ต้องการอะไร
ก่อนติดตั้ง ดู [รูปแบบ Skills](/th/clawhub/skill-format)

## เผยแพร่ Plugin

เผยแพร่ Plugin จากโฟลเดอร์ในเครื่อง, repo GitHub, ref ของ GitHub หรือ
อาร์ไคฟ์ที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่างเมทาดาทาของแพ็กเกจที่แก้ข้อมูลแล้ว ฟิลด์ความเข้ากันได้
การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่จริง

Plugin โค้ดต้องมีเมทาดาทาความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ซิงค์ Skills ที่คุณดูแล

`sync` จะสแกนโฟลเดอร์ Skills และเผยแพร่ Skills ใหม่หรือที่เปลี่ยนแปลงซึ่งยังไม่ได้
ซิงโครไนซ์

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

เมื่อคุณลงชื่อเข้าใช้แล้ว `sync` อาจส่งสแนปช็อตการติดตั้งแบบขั้นต่ำเพื่อ
จำนวนการติดตั้งรวม ดู [โทรมาตร](/th/clawhub/telemetry) สำหรับสิ่งที่ถูกรายงาน
และวิธีเลือกไม่เข้าร่วม

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
เมทาดาทา ลิงก์แหล่งที่มา เวอร์ชัน บันทึกการเปลี่ยนแปลง และสถานะการสแกน:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

รายการสาธารณะจะแสดงสถานะการสแกนล่าสุด รีลีสที่ถูกพักไว้หรือถูกบล็อกโดย
การกลั่นกรองอาจถูกซ่อนจากพื้นที่ค้นหาและติดตั้งจนกว่าจะได้รับการแก้ไข
