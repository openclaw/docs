---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่/ซิงค์
summary: รูปแบบโฟลเดอร์ Skill, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด.
x-i18n:
    generated_at: "2026-05-10T19:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบ Skill

## บนดิสก์

Skill คือโฟลเดอร์หนึ่ง

จำเป็น:

- `SKILL.md` (หรือ `skill.md`)

ไม่บังคับ:

- ไฟล์ _แบบข้อความ_ ที่รองรับ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบการละเว้นสำหรับเผยแพร่/ซิงค์, `.clawdhubignore` แบบเดิม)
- `.gitignore` (รองรับเช่นกัน)

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งในไดเรกทอรีทำงาน (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter ที่ไม่บังคับ
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่างเผยแพร่
- `description` ใช้เป็นสรุป Skill ใน UI/การค้นหา

## เมทาดาทา Frontmatter

เมทาดาทา Skill ประกาศใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ของคุณ สิ่งนี้บอกรีจิสทรี (และการวิเคราะห์ความปลอดภัย) ว่า Skill ของคุณต้องใช้อะไรในการรัน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทารันไทม์ (`metadata.openclaw`)

ประกาศข้อกำหนดรันไทม์ของ Skill ใต้ `metadata.openclaw` (ชื่อแทน: `metadata.clawdbot`, `metadata.clawdis`)

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่ Skill จะรันได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทารายตัวแปร รวมถึงตัวแปรที่ไม่บังคับด้วย `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ชนิด       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่ง Skill ของคุณคาดหวัง                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์ config ที่ Skill ของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | ตัวแปรสภาพแวดล้อมข้อมูลรับรองหลักสำหรับ Skill ของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมที่มี `name`, `required` ที่ไม่บังคับ และ `description` ที่ไม่บังคับ ตั้งค่า `required: false` สำหรับตัวแปรสภาพแวดล้อมที่ไม่บังคับ |
| `always`           | `boolean`  | หากเป็น `true` Skill จะทำงานอยู่เสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | เขียนทับคีย์เรียกใช้ของ Skill                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับ Skill                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของ Skill                                                                                                         |
| `os`               | `string[]` | ข้อจำกัดระบบปฏิบัติการ (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | ข้อมูลจำเพาะการติดตั้งสำหรับการขึ้นต่อกัน (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | ข้อมูลจำเพาะ Plugin ของ Nix (ดู README)                                                                                                                |
| `config`           | `object`   | ข้อมูลจำเพาะ config ของ Clawdbot (ดู README)                                                                                                           |

### ข้อมูลจำเพาะการติดตั้ง

หาก Skill ของคุณต้องติดตั้งการขึ้นต่อกัน ให้ประกาศในอาร์เรย์ `install`:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

ชนิดการติดตั้งที่รองรับ: `brew`, `node`, `go`, `uv`

### ตัวแปรสภาพแวดล้อมที่ไม่บังคับ

ประกาศตัวแปรสภาพแวดล้อมที่ไม่บังคับใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการที่ไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่า Skill จะรันไม่ได้หากไม่มีตัวแปรเหล่านั้น

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### เหตุใดเรื่องนี้จึงสำคัญ

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่ Skill ของคุณประกาศตรงกับสิ่งที่มันทำจริง หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะทำเครื่องหมายว่าเมทาดาทาไม่ตรงกัน การรักษาการประกาศให้ถูกต้องช่วยให้ Skill ของคุณผ่านการตรวจทาน และช่วยให้ผู้ใช้เข้าใจสิ่งที่พวกเขากำลังติดตั้ง

### ตัวอย่าง: frontmatter แบบสมบูรณ์

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## ไฟล์ที่อนุญาต

การเผยแพร่ยอมรับเฉพาะไฟล์ “แบบข้อความ” เท่านั้น

- รายการอนุญาตของนามสกุลอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ได้รับการยอมรับเป็นข้อความ
- ชนิดเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือว่าเป็นข้อความ พร้อมรายการอนุญาตขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาดบันเดิลรวม: 50MB
- ข้อความสำหรับฝังรวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` สูงสุดประมาณ 40 ไฟล์ (ขีดจำกัดแบบพยายามให้ดีที่สุด)

## สลัก

- ได้มาจากชื่อโฟลเดอร์โดยค่าเริ่มต้น
- ต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ URL: `^[a-z0-9][a-z0-9-]*$`

## การกำหนดเวอร์ชัน + แท็ก

- การเผยแพร่แต่ละครั้งสร้างเวอร์ชันใหม่ (semver)
- แท็กเป็นตัวชี้แบบสตริงไปยังเวอร์ชันหนึ่ง โดยทั่วไปใช้ `latest`

## ใบอนุญาต

- Skills ทั้งหมดที่เผยแพร่บน ClawHub อยู่ภายใต้ใบอนุญาต `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และแจกจ่าย Skills ที่เผยแพร่แล้วได้ รวมถึงเชิงพาณิชย์
- ไม่จำเป็นต้องระบุแหล่งที่มา
- อย่าเพิ่มเงื่อนไขใบอนุญาตที่ขัดแย้งใน `SKILL.md`; ClawHub ไม่รองรับการเขียนทับใบอนุญาตราย Skill

## Skills แบบชำระเงิน

- ClawHub ไม่รองรับ Skills แบบชำระเงิน การตั้งราคาราย Skill เพย์วอลล์ หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาใน `SKILL.md`; สิ่งนี้ไม่ใช่ส่วนหนึ่งของรูปแบบ Skill และจะไม่ทำให้ Skill ที่เผยแพร่แล้วกลายเป็นแบบชำระเงิน
- หาก Skill ของคุณเชื่อมต่อกับบริการบุคคลที่สามแบบชำระเงิน ให้บันทึกต้นทุนภายนอกและบัญชีที่จำเป็นอย่างชัดเจนในคำแนะนำของ Skill และการประกาศสภาพแวดล้อม (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรที่ไม่บังคับ)
