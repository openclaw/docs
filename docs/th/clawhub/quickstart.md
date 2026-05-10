---
read_when:
    - ใช้ ClawHub ครั้งแรก
    - การติดตั้ง Skills หรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้งาน ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-05-10T19:26:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub คือรีจิสทรีสำหรับ Skills และ Plugin ของ OpenClaw

ใช้ OpenClaw เมื่อคุณกำลังติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้
เวิร์กโฟลว์เฉพาะของรีจิสทรี

## ค้นหาและติดตั้ง skill

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้ง skill:

```bash
openclaw skills install <skill-slug>
```

อัปเดต skills ที่ติดตั้งไว้:

```bash
openclaw skills update --all
```

OpenClaw บันทึกว่า skill มาจากที่ใด เพื่อให้การอัปเดตในภายหลังยังคง
resolve ผ่าน ClawHub ได้

## ค้นหาและติดตั้ง plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง plugin ที่โฮสต์บน ClawHub โดยระบุแหล่ง ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต plugins ที่ติดตั้งไว้:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ OpenClaw resolve แพ็กเกจผ่าน
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

สภาพแวดล้อมแบบไม่มีหน้าจอสามารถใช้โทเค็น API จาก UI เว็บของ ClawHub ได้:

```bash
clawhub login --token clh_...
```

## เผยแพร่ skill

skill คือโฟลเดอร์ที่มีไฟล์ `SKILL.md` ที่จำเป็น และอาจมีไฟล์สนับสนุนเพิ่มเติม

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

ก่อนเผยแพร่ ให้ตรวจสอบเมทาดาทาใน `SKILL.md` ระบุตัวแปรสภาพแวดล้อม
เครื่องมือ และสิทธิ์ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่า skill ต้องการอะไร
ก่อนติดตั้ง ดู [รูปแบบ skill](/th/clawhub/skill-format)

## เผยแพร่ plugin

เผยแพร่ plugin จากโฟลเดอร์ภายในเครื่อง repo GitHub, ref ของ GitHub หรือ
ไฟล์เก็บถาวรที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อน เพื่อดูตัวอย่างเมทาดาทาแพ็กเกจที่ resolve แล้ว
ฟิลด์ความเข้ากันได้ การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่จริง

code plugins ต้องมีเมทาดาทาความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ซิงค์ skills ที่คุณดูแล

`sync` จะสแกนโฟลเดอร์ skill และเผยแพร่ skills ใหม่หรือที่มีการเปลี่ยนแปลง
ซึ่งยังไม่ได้ซิงโครไนซ์ไว้

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

เมื่อคุณลงชื่อเข้าใช้แล้ว `sync` อาจส่งสแนปช็อตการติดตั้งขั้นต่ำเพื่อ
นับจำนวนการติดตั้งโดยรวมด้วย ดู [Telemetry](/th/clawhub/telemetry) สำหรับสิ่งที่รายงาน
และวิธีเลือกไม่เข้าร่วม

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บของ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
เมทาดาทา ลิงก์แหล่งที่มา เวอร์ชัน changelogs และสถานะการสแกน:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

รายการสาธารณะแสดงสถานะการสแกนล่าสุด รุ่นที่ถูกระงับหรือบล็อกโดย
การดูแลอาจถูกซ่อนจากพื้นผิวการค้นหาและติดตั้งจนกว่าจะได้รับการแก้ไข
