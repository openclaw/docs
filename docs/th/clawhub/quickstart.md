---
read_when:
    - ใช้งาน ClawHub ครั้งแรก
    - การติดตั้ง Skills หรือ Plugin จากรีจิสทรี
    - การเผยแพร่ไปยัง ClawHub
summary: 'เริ่มต้นใช้งาน ClawHub: ค้นหา ติดตั้ง อัปเดต และเผยแพร่ Skills หรือ Plugin'
x-i18n:
    generated_at: "2026-06-28T05:07:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# เริ่มต้นอย่างรวดเร็ว

ClawHub คือ registry สำหรับ Skills และ plugins ของ OpenClaw

ใช้ OpenClaw เมื่อคุณกำลังติดตั้งสิ่งต่าง ๆ ลงใน OpenClaw ใช้ CLI `clawhub`
เมื่อคุณกำลังลงชื่อเข้าใช้ เผยแพร่ จัดการรายการของคุณเอง หรือใช้เวิร์กโฟลว์เฉพาะของ registry

## ค้นหาและติดตั้ง skill

ค้นหาจาก OpenClaw:

```bash
openclaw skills search "calendar"
```

ติดตั้ง skill:

```bash
openclaw skills install @openclaw/demo
```

อัปเดต Skills ที่ติดตั้งไว้:

```bash
openclaw skills update --all
```

OpenClaw บันทึกว่า skill มาจากที่ใด เพื่อให้การอัปเดตภายหลังยังคง
resolve ผ่าน ClawHub ได้

## ค้นหาและติดตั้ง plugin

ค้นหาจาก OpenClaw:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง plugin ที่โฮสต์บน ClawHub ด้วยแหล่งที่มา ClawHub ที่ระบุชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

อัปเดต plugins ที่ติดตั้งไว้:

```bash
openclaw plugins update --all
```

ใช้คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ OpenClaw resolve แพ็กเกจผ่าน
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

สภาพแวดล้อมแบบ headless สามารถใช้โทเค็น API จาก UI เว็บของ ClawHub ได้:

```bash
clawhub login --token clh_...
```

## เผยแพร่ skill

skill คือโฟลเดอร์ที่มีไฟล์ `SKILL.md` ที่จำเป็น และอาจมีไฟล์สนับสนุนเพิ่มเติม

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

คำสั่งจะข้ามเนื้อหาที่ไม่เปลี่ยนแปลง Skills ใหม่เริ่มที่ `1.0.0`; การเปลี่ยนแปลงภายหลัง
จะเผยแพร่เวอร์ชัน patch ถัดไปโดยอัตโนมัติ ใช้ `--dry-run` เพื่อดูตัวอย่าง หรือ
`--version` เพื่อเลือกเวอร์ชันที่ระบุชัดเจน

ก่อนเผยแพร่ ให้ตรวจสอบ metadata ใน `SKILL.md` ระบุ environment variables,
tools และ permissions ที่จำเป็น เพื่อให้ผู้ใช้เข้าใจว่า skill ต้องใช้อะไร
ก่อนติดตั้ง ดู [รูปแบบ Skill](/th/clawhub/skill-format)

สำหรับ repositories ที่มีหลาย Skills เวิร์กโฟลว์ GitHub ที่ใช้ซ้ำได้จะเรียก
`skill publish` สำหรับโฟลเดอร์ skill แต่ละโฟลเดอร์ที่อยู่ใต้ `skills/` โดยตรง:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## เผยแพร่ plugin

เผยแพร่ plugin จากโฟลเดอร์ในเครื่อง, GitHub repo, GitHub ref หรือ
archive ที่มีอยู่:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ใช้ `--dry-run` ก่อนเพื่อดูตัวอย่าง metadata ของแพ็กเกจที่ resolve แล้ว, ฟิลด์ความเข้ากันได้,
การระบุแหล่งที่มา และแผนการอัปโหลดโดยไม่เผยแพร่

code plugins ต้องมี metadata ความเข้ากันได้กับ OpenClaw ใน `package.json`
รวมถึง `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`

## ตรวจสอบก่อนติดตั้ง

ก่อนติดตั้ง ใช้หน้าเว็บ ClawHub หรือคำสั่งรายละเอียดของ CLI เพื่อตรวจสอบ
metadata, ลิงก์แหล่งที่มา, เวอร์ชัน, changelogs และสถานะการสแกน:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

รายการสาธารณะแสดงสถานะการสแกนล่าสุด Releases ที่ถูกพักไว้หรือถูกบล็อกโดย
moderation อาจถูกซ่อนจากพื้นผิวการค้นหาและติดตั้งจนกว่าจะได้รับการแก้ไข
