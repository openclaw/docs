---
read_when:
    - ใช้งาน ClawHub ครั้งแรก
    - การติดตั้ง Skill หรือ Plugin จาก registry
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้ ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-07-02T22:53:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub คือรีจิสทรีสำหรับทักษะและปลั๊กอินของ OpenClaw.

ใช้ OpenClaw เมื่อคุณกำลังติดตั้งสิ่งต่างๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้เวิร์กโฟลว์เฉพาะรีจิสทรี

## ค้นหาและติดตั้งทักษะ

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้งทักษะ:

```bash
openclaw skills install @openclaw/demo
```

อัปเดตทักษะที่ติดตั้งไว้:

```bash
openclaw skills update --all
```

OpenClaw จะบันทึกว่าทักษะมาจากที่ใด เพื่อให้การอัปเดตภายหลังสามารถดำเนินการต่อ
ผ่าน ClawHub ได้

## ค้นหาและติดตั้งปลั๊กอิน

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้งปลั๊กอินที่โฮสต์บน ClawHub โดยระบุแหล่งที่มาของ ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดตปลั๊กอินที่ติดตั้งไว้:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ OpenClaw แก้ชื่อแพ็กเกจผ่าน
ClawHub แทน npm หรือแหล่งที่มาอื่น

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

## เผยแพร่ทักษะ

ทักษะคือโฟลเดอร์ที่มีไฟล์ `SKILL.md` ที่จำเป็น และอาจมีไฟล์สนับสนุนเพิ่มเติม

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

คำสั่งจะข้ามเนื้อหาที่ไม่เปลี่ยนแปลง ทักษะใหม่เริ่มที่ `1.0.0`; การเปลี่ยนแปลงภายหลัง
จะเผยแพร่เวอร์ชันแพตช์ถัดไปโดยอัตโนมัติ ใช้ `--dry-run` เพื่อดูตัวอย่าง หรือ
`--version` เพื่อเลือกเวอร์ชันอย่างชัดเจน

ก่อนเผยแพร่ ให้ตรวจสอบเมทาดาทาใน `SKILL.md` ประกาศตัวแปรสภาพแวดล้อม เครื่องมือ
และสิทธิ์ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่าทักษะต้องการอะไรบ้างก่อนติดตั้ง ดู [รูปแบบทักษะ](/th/clawhub/skill-format)

สำหรับรีโพซิทอรีที่มีหลายทักษะ เวิร์กโฟลว์ GitHub ที่ใช้ซ้ำได้จะเรียก
`skill publish` สำหรับแต่ละโฟลเดอร์ทักษะโดยตรงภายใต้ `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## เผยแพร่ปลั๊กอิน

เผยแพร่ปลั๊กอินจากโฟลเดอร์ในเครื่อง รีโพ GitHub, ref ของ GitHub หรือไฟล์เก็บถาวรที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่างเมทาดาทาแพ็กเกจที่แก้ได้ ฟิลด์ความเข้ากันได้
การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่

ปลั๊กอินโค้ดต้องมีเมทาดาทาความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
เมทาดาทา ลิงก์แหล่งที่มา เวอร์ชัน บันทึกการเปลี่ยนแปลง และสถานะการสแกน:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

รายการสาธารณะจะแสดงสถานะการสแกนล่าสุด รุ่นเผยแพร่ที่ถูกระงับหรือถูกบล็อกโดย
การดูแลเนื้อหาอาจถูกซ่อนจากพื้นผิวการค้นหาและการติดตั้งจนกว่าจะได้รับการแก้ไข
