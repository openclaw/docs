---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่/ซิงก์
summary: รูปแบบโฟลเดอร์ Skills, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด.
x-i18n:
    generated_at: "2026-05-12T08:44:48Z"
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

- ไฟล์ _แบบข้อความ_ สำหรับสนับสนุนใดๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบที่ต้องเพิกเฉยสำหรับการเผยแพร่/ซิงก์, `.clawdhubignore` แบบเดิม)
- `.gitignore` (รองรับเช่นกัน)

เมตาดาต้าการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งของ workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์ดึงเมตาดาต้าจาก frontmatter ระหว่างเผยแพร่
- `description` ใช้เป็นสรุปของ skill ใน UI/การค้นหา

## เมตาดาต้า Frontmatter

ประกาศเมตาดาต้า Skill ใน YAML frontmatter ที่ด้านบนของ `SKILL.md` สิ่งนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่า skill ของคุณต้องใช้อะไรเพื่อรัน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมตาดาต้ารันไทม์ (`metadata.openclaw`)

ประกาศข้อกำหนดรันไทม์ของ skill ใต้ `metadata.openclaw` (นามแฝง: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่ skill จะรันได้ ใช้ `envVars` เมื่อคุณต้องการเมตาดาต้ารายตัวแปร รวมถึงตัวแปรไม่บังคับที่มี `required: false`

### เอกสารอ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่ง skill ของคุณคาดว่าจะมี                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอยู่อย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์ config ที่ skill ของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | env var ข้อมูลรับรองหลักสำหรับ skill ของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้ง `required: false` สำหรับ env vars ที่ไม่บังคับ |
| `always`           | `boolean`  | หากเป็น `true` skill จะทำงานเสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์การเรียกใช้ของ skill                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับ skill                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังโฮมเพจหรือเอกสารของ skill                                                                                                         |
| `os`               | `string[]` | ข้อจำกัด OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependencies (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Plugin Nix (ดู README)                                                                                                                |
| `config`           | `object`   | สเปก config ของ Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

หาก skill ของคุณต้องติดตั้ง dependencies ให้ประกาศไว้ในอาร์เรย์ `install`:

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

### ตัวแปรสภาพแวดล้อมแบบไม่บังคับ

ประกาศตัวแปรสภาพแวดล้อมแบบไม่บังคับใต้ `metadata.openclaw.envVars` และตั้ง `required: false` อย่าเพิ่มรายการไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่า skill จะรันไม่ได้หากไม่มีรายการเหล่านั้น

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

### เหตุใดสิ่งนี้จึงสำคัญ

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่ skill ของคุณประกาศตรงกับสิ่งที่มันทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะตั้งค่าสถานะว่าเมตาดาต้าไม่ตรงกัน การรักษาการประกาศให้ถูกต้องช่วยให้ skill ของคุณผ่านการรีวิว และช่วยให้ผู้ใช้เข้าใจว่ากำลังติดตั้งอะไร

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

- รายการนามสกุลที่อนุญาตอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ได้รับการยอมรับเป็นข้อความ
- ชนิดเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือว่าเป็นข้อความ รวมถึงรายการอนุญาตขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาด bundle รวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` สูงสุดประมาณ 40 ไฟล์ (ขีดจำกัดแบบพยายามดีที่สุด)

## Slugs

- โดยค่าเริ่มต้นได้มาจากชื่อโฟลเดอร์
- ต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ URL: `^[a-z0-9][a-z0-9-]*$`

## การกำหนดเวอร์ชัน + แท็ก

- การเผยแพร่แต่ละครั้งจะสร้างเวอร์ชันใหม่ (semver)
- แท็กเป็นพอยน์เตอร์สตริงไปยังเวอร์ชันหนึ่ง โดยมักใช้ `latest`

## ใบอนุญาต

- Skills ทั้งหมดที่เผยแพร่บน ClawHub ได้รับอนุญาตภายใต้ `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และแจกจ่าย skill ที่เผยแพร่แล้ว รวมถึงเชิงพาณิชย์
- ไม่จำเป็นต้องระบุแหล่งที่มา
- อย่าเพิ่มเงื่อนไขใบอนุญาตที่ขัดแย้งใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ใบอนุญาตราย skill

## Skills แบบชำระเงิน

- ClawHub ไม่รองรับ Skills แบบชำระเงิน การตั้งราคาราย skill เพย์วอลล์ หรือการแบ่งรายได้
- อย่าเพิ่มเมตาดาต้าราคาใน `SKILL.md`; เมตาดาต้านี้ไม่ใช่ส่วนหนึ่งของรูปแบบ skill และจะไม่ทำให้ skill ที่เผยแพร่เป็นแบบชำระเงิน
- หาก skill ของคุณเชื่อมต่อกับบริการบุคคลที่สามแบบชำระเงิน ให้บันทึกต้นทุนภายนอกและบัญชีที่จำเป็นไว้อย่างชัดเจนในคำแนะนำของ skill และการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรที่ไม่บังคับ)
