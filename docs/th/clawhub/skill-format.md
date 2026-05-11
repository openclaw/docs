---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่/ซิงก์
summary: รูปแบบโฟลเดอร์ Skill, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด
x-i18n:
    generated_at: "2026-05-11T22:19:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบ Skill

## บนดิสก์

สกิลคือโฟลเดอร์หนึ่ง

จำเป็น:

- `SKILL.md` (หรือ `skill.md`)

ไม่บังคับ:

- ไฟล์ _แบบข้อความ_ สำหรับสนับสนุนใด ๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบการละเว้นสำหรับ publish/sync, `.clawdhubignore` เดิม)
- `.gitignore` (รองรับด้วยเช่นกัน)

เมทาดาทาการติดตั้งภายในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` เดิม)

สถานะการติดตั้งในไดเรกทอรีทำงาน (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` เดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่าง publish
- `description` ใช้เป็นสรุปของสกิลใน UI/การค้นหา

## เมทาดาทา Frontmatter

เมทาดาทา Skill ประกาศใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ซึ่งบอก registry (และการวิเคราะห์ความปลอดภัย) ว่าสกิลของคุณต้องใช้อะไรจึงจะรันได้

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทารันไทม์ (`metadata.openclaw`)

ประกาศข้อกำหนดรันไทม์ของสกิลใต้ `metadata.openclaw` (นามแฝง: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่สกิลจะรันได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทารายตัวแปร รวมถึงตัวแปรแบบไม่บังคับที่มี `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่งสกิลของคุณคาดว่าจะมี                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์ config ที่สกิลของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | ตัวแปรสภาพแวดล้อมสำหรับข้อมูลรับรองหลักของสกิลคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้ง `required: false` สำหรับตัวแปรสภาพแวดล้อมแบบไม่บังคับ |
| `always`           | `boolean`  | ถ้าเป็น `true` สกิลจะเปิดใช้งานเสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์การเรียกใช้ของสกิล                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับสกิล                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของสกิล                                                                                                         |
| `os`               | `string[]` | ข้อจำกัดของ OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependency (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Plugin ของ Nix (ดู README)                                                                                                                |
| `config`           | `object`   | สเปก config ของ Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

หากสกิลของคุณต้องติดตั้ง dependency ให้ประกาศในอาร์เรย์ `install`:

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

ประกาศตัวแปรสภาพแวดล้อมแบบไม่บังคับใต้ `metadata.openclaw.envVars` และตั้ง `required: false` อย่าเพิ่มรายการแบบไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่าสกิลจะรันไม่ได้หากไม่มีตัวแปรเหล่านั้น

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

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่สกิลของคุณประกาศตรงกับสิ่งที่สกิลทำจริง หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะระบุว่าเมทาดาทาไม่ตรงกัน การประกาศให้ถูกต้องช่วยให้สกิลของคุณผ่านการรีวิว และช่วยให้ผู้ใช้เข้าใจว่ากำลังติดตั้งอะไร

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

publish รับเฉพาะไฟล์ “แบบข้อความ” เท่านั้น

- รายการอนุญาตของนามสกุลอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` รองรับในฐานะข้อความ
- ชนิดเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือว่าเป็นข้อความ รวมถึงรายการอนุญาตขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาดบันเดิลรวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` ได้สูงสุดประมาณ 40 ไฟล์ (จำกัดแบบ best-effort)

## Slugs

- โดยค่าเริ่มต้นได้มาจากชื่อโฟลเดอร์
- ต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ URL: `^[a-z0-9][a-z0-9-]*$`

## การกำหนดเวอร์ชัน + แท็ก

- การ publish แต่ละครั้งจะสร้างเวอร์ชันใหม่ (semver)
- แท็กเป็นตัวชี้แบบสตริงไปยังเวอร์ชันหนึ่ง โดยทั่วไปใช้ `latest`

## ใบอนุญาต

- Skills ทั้งหมดที่ publish บน ClawHub ใช้ใบอนุญาต `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และเผยแพร่ Skills ที่ publish แล้วต่อได้ รวมถึงใช้ในเชิงพาณิชย์
- ไม่จำเป็นต้องระบุแหล่งที่มา
- อย่าเพิ่มเงื่อนไขใบอนุญาตที่ขัดแย้งใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ใบอนุญาตรายสกิล

## Skills แบบชำระเงิน

- ClawHub ไม่รองรับ Skills แบบชำระเงิน การตั้งราคารายสกิล paywall หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาใน `SKILL.md`; สิ่งนี้ไม่ใช่ส่วนหนึ่งของรูปแบบสกิล และจะไม่ทำให้สกิลที่ publish แล้วกลายเป็นแบบชำระเงิน
- หากสกิลของคุณผสานรวมกับบริการภายนอกแบบชำระเงิน ให้ระบุค่าใช้จ่ายภายนอกและบัญชีที่จำเป็นอย่างชัดเจนในคำแนะนำของสกิลและการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรแบบไม่บังคับ)
