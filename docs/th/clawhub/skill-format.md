---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่/ซิงค์
summary: รูปแบบโฟลเดอร์ Skill, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ข้อจำกัด
x-i18n:
    generated_at: "2026-05-13T04:18:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบ skill

## บนดิสก์

skill คือโฟลเดอร์หนึ่ง

จำเป็น:

- `SKILL.md` (หรือ `skill.md`)

ไม่บังคับ:

- ไฟล์ _แบบข้อความ_ ที่รองรับใดๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบการละเว้นสำหรับ publish/sync, `.clawdhubignore` แบบเดิม)
- `.gitignore` (รองรับด้วยเช่นกัน)

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งในไดเรกทอรีทำงาน (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter ที่ไม่บังคับ
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่างการ publish
- `description` ใช้เป็นสรุปของ skill ใน UI/การค้นหา

## เมทาดาทา Frontmatter

เมทาดาทาของ skill จะประกาศใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ของคุณ ส่วนนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่า skill ของคุณต้องใช้อะไรในการทำงาน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทารันไทม์ (`metadata.openclaw`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่ skill จะทำงานได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทาต่อแต่ละตัวแปร รวมถึงตัวแปรที่ไม่บังคับด้วย `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่ง skill ของคุณคาดหวัง                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอยู่อย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์คอนฟิกที่ skill ของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | ตัวแปรสภาพแวดล้อมของข้อมูลรับรองหลักสำหรับ skill ของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` ที่ไม่บังคับ และ `description` ที่ไม่บังคับ ตั้งค่า `required: false` สำหรับตัวแปรสภาพแวดล้อมที่ไม่บังคับ |
| `always`           | `boolean`  | หากเป็น `true` skill จะทำงานอยู่เสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์การเรียกใช้ของ skill                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับ skill                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของ skill                                                                                                         |
| `os`               | `string[]` | ข้อจำกัดของระบบปฏิบัติการ (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | ข้อกำหนดการติดตั้งสำหรับ dependency (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | ข้อกำหนด Nix Plugin (ดู README)                                                                                                                |
| `config`           | `object`   | ข้อกำหนดคอนฟิก Clawdbot (ดู README)                                                                                                           |

### ข้อกำหนดการติดตั้ง

หาก skill ของคุณต้องติดตั้ง dependency ให้ประกาศไว้ในอาร์เรย์ `install`:

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

ประกาศตัวแปรสภาพแวดล้อมที่ไม่บังคับใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการที่ไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่า skill จะทำงานไม่ได้หากไม่มีตัวแปรเหล่านั้น

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

### เหตุผลที่เรื่องนี้สำคัญ

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่ skill ของคุณประกาศตรงกับสิ่งที่มันทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะรายงานว่าเมทาดาทาไม่ตรงกัน การรักษาการประกาศให้ถูกต้องช่วยให้ skill ของคุณผ่านการตรวจสอบและช่วยให้ผู้ใช้เข้าใจว่าสิ่งที่พวกเขากำลังติดตั้งคืออะไร

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

publish ยอมรับเฉพาะไฟล์ “แบบข้อความ” เท่านั้น

- รายการอนุญาตของนามสกุลอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ได้รับการยอมรับเป็นข้อความ
- ประเภทเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือว่าเป็นข้อความ รวมถึงรายการอนุญาตขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาด bundle รวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` สูงสุดประมาณ 40 ไฟล์ (จำกัดแบบพยายามให้ดีที่สุด)

## Slugs

- ได้มาจากชื่อโฟลเดอร์โดยค่าเริ่มต้น
- ต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ URL: `^[a-z0-9][a-z0-9-]*$`

## การกำหนดเวอร์ชัน + แท็ก

- การ publish แต่ละครั้งจะสร้างเวอร์ชันใหม่ (semver)
- แท็กเป็นตัวชี้แบบสตริงไปยังเวอร์ชันหนึ่ง โดยทั่วไปใช้ `latest`

## ใบอนุญาต

- skill ทั้งหมดที่ publish บน ClawHub อยู่ภายใต้ใบอนุญาต `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และแจกจ่าย skill ที่ publish แล้วต่อได้ รวมถึงเพื่อการค้า
- ไม่จำเป็นต้องแสดงที่มา
- อย่าเพิ่มเงื่อนไขใบอนุญาตที่ขัดแย้งกันใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ใบอนุญาตต่อ skill

## skill แบบชำระเงิน

- ClawHub ไม่รองรับ skill แบบชำระเงิน การกำหนดราคาต่อ skill paywall หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาใน `SKILL.md`; มันไม่ใช่ส่วนหนึ่งของรูปแบบ skill และจะไม่ทำให้ skill ที่ publish แล้วกลายเป็นแบบชำระเงิน
- หาก skill ของคุณผสานรวมกับบริการภายนอกแบบชำระเงิน ให้ระบุค่าใช้จ่ายภายนอกและบัญชีที่ต้องใช้อย่างชัดเจนในคำแนะนำของ skill และการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรที่ไม่บังคับ)
