---
read_when:
    - ใช้งาน ClawHub ครั้งแรก
    - การติดตั้ง Skills หรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มต้นใช้งาน ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-05-12T08:44:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Quickstart

ClawHub คือรีจิสทรีสำหรับทักษะและปลั๊กอินของ OpenClaw

ใช้ OpenClaw เมื่อติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้เวิร์กโฟลว์เฉพาะของรีจิสทรี

## ค้นหาและติดตั้งทักษะ

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้งทักษะ:

```bash
openclaw skills install <skill-slug>
```

อัปเดตทักษะที่ติดตั้งไว้:

```bash
openclaw skills update --all
```

OpenClaw บันทึกไว้ว่าทักษะมาจากที่ใด เพื่อให้การอัปเดตภายหลังยังคง
แก้หาผ่าน ClawHub ได้

## ค้นหาและติดตั้งปลั๊กอิน

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้งปลั๊กอินที่โฮสต์บน ClawHub ด้วยแหล่งที่มา ClawHub ที่ระบุชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดตปลั๊กอินที่ติดตั้งไว้:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ OpenClaw แก้หาแพ็กเกจผ่าน
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

สภาพแวดล้อมแบบไม่มีส่วนติดต่อสามารถใช้โทเค็น API จาก UI เว็บของ ClawHub ได้:

```bash
clawhub login --token clh_...
```

## เผยแพร่ทักษะ

ทักษะคือโฟลเดอร์ที่ต้องมีไฟล์ `SKILL.md` และอาจมีไฟล์สนับสนุนเพิ่มเติมได้

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

ก่อนเผยแพร่ ให้ตรวจสอบเมทาดาทาใน `SKILL.md` ระบุตัวแปรสภาพแวดล้อม
เครื่องมือ และสิทธิ์ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่าทักษะต้องใช้อะไรก่อนติดตั้ง
ดู [รูปแบบทักษะ](/th/clawhub/skill-format)

## เผยแพร่ปลั๊กอิน

เผยแพร่ปลั๊กอินจากโฟลเดอร์ในเครื่อง รีโป GitHub, ref ของ GitHub หรือ
อาร์ไคฟ์ที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่างเมทาดาทาแพ็กเกจที่แก้หาได้ ฟิลด์ความเข้ากันได้
การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่จริง

ปลั๊กอินโค้ดต้องมีเมทาดาทาความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ซิงค์ทักษะที่คุณดูแล

`sync` จะสแกนโฟลเดอร์ทักษะและเผยแพร่ทักษะใหม่หรือทักษะที่เปลี่ยนแปลงซึ่งยังไม่ได้
ซิงโครไนซ์

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

เมื่อคุณลงชื่อเข้าใช้แล้ว `sync` อาจส่งสแนปช็อตการติดตั้งแบบขั้นต่ำสำหรับ
จำนวนการติดตั้งรวมด้วย ดู [Telemetry](/th/clawhub/telemetry) เพื่อดูว่ามีการรายงานอะไร
และวิธีเลือกไม่เข้าร่วม

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
เมทาดาทา ลิงก์แหล่งที่มา เวอร์ชัน บันทึกการเปลี่ยนแปลง และสถานะการสแกน:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

รายการสาธารณะแสดงสถานะการสแกนล่าสุด รุ่นที่ถูกพักไว้หรือถูกบล็อกโดย
การกลั่นกรองอาจถูกซ่อนจากพื้นที่ค้นหาและติดตั้งจนกว่าจะได้รับการแก้ไข
