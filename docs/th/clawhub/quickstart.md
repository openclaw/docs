---
read_when:
    - ใช้งาน ClawHub ครั้งแรก
    - การติดตั้ง Skills หรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มใช้ ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-07-03T01:06:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub คือรีจิสทรีสำหรับ Skills และ plugins ของ OpenClaw

ใช้ OpenClaw เมื่อคุณกำลังติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้
เวิร์กโฟลว์เฉพาะของรีจิสทรี

## ค้นหาและติดตั้งทักษะ

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้งทักษะ:

```bash
openclaw skills install @openclaw/demo
```

อัปเดตทักษะที่ติดตั้งแล้ว:

```bash
openclaw skills update --all
```

OpenClaw บันทึกว่าทักษะมาจากที่ใด เพื่อให้การอัปเดตภายหลังยังสามารถ
แก้ไขผ่าน ClawHub ต่อไปได้

## ค้นหาและติดตั้ง plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง plugin ที่โฮสต์บน ClawHub โดยระบุแหล่งที่มา ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต plugins ที่ติดตั้งแล้ว:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ OpenClaw แก้ไข package ผ่าน
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

สภาพแวดล้อมแบบไม่มีหน้าจอสามารถใช้โทเค็น API จาก UI เว็บของ ClawHub ได้:

```bash
clawhub login --token clh_...
```

## เผยแพร่ทักษะ

ทักษะคือโฟลเดอร์ที่ต้องมีไฟล์ `SKILL.md` และอาจมีไฟล์สนับสนุนเพิ่มเติม

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

คำสั่งนี้จะข้ามเนื้อหาที่ไม่มีการเปลี่ยนแปลง ทักษะใหม่เริ่มที่ `1.0.0`; การเปลี่ยนแปลงภายหลัง
จะเผยแพร่เป็นเวอร์ชัน patch ถัดไปโดยอัตโนมัติ ใช้ `--dry-run` เพื่อดูตัวอย่าง หรือ
`--version` เพื่อเลือกเวอร์ชันที่ชัดเจน

ก่อนเผยแพร่ ให้ตรวจสอบ metadata ใน `SKILL.md` ระบุ
ตัวแปรสภาพแวดล้อม เครื่องมือ และสิทธิ์ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่า
ทักษะต้องการอะไรบ้างก่อนติดตั้ง ดู [รูปแบบทักษะ](/th/clawhub/skill-format)

สำหรับ repository ที่มีหลายทักษะ เวิร์กโฟลว์ GitHub ที่ใช้ซ้ำได้จะเรียก
`skill publish` สำหรับแต่ละโฟลเดอร์ทักษะโดยตรงภายใต้ `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## เผยแพร่ plugin

เผยแพร่ plugin จากโฟลเดอร์ภายในเครื่อง, repo GitHub, ref ของ GitHub หรือ
archive ที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่าง metadata ของ package ที่แก้ไขแล้ว ฟิลด์ความเข้ากันได้
การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่จริง

Code plugins ต้องมี metadata ความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ให้ใช้หน้าเว็บ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
metadata, ลิงก์แหล่งที่มา, เวอร์ชัน, changelog และสถานะการสแกน:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

รายการสาธารณะแสดงสถานะการสแกนล่าสุด release ที่ถูกพักไว้หรือถูกบล็อกโดย
การตรวจสอบเนื้อหาอาจถูกซ่อนจากพื้นผิวการค้นหาและการติดตั้งจนกว่าจะได้รับการแก้ไข
