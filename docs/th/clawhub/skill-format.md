---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่/ซิงค์
summary: รูปแบบโฟลเดอร์ Skill, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด.
x-i18n:
    generated_at: "2026-05-13T05:33:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบสกิล

## บนดิสก์

สกิลคือโฟลเดอร์หนึ่ง

จำเป็นต้องมี:

- `SKILL.md` (หรือ `skill.md`)

ไม่บังคับ:

- ไฟล์สนับสนุนแบบ _ข้อความ_ ใดๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบที่ต้องละเว้นสำหรับ publish/sync, `.clawdhubignore` แบบเดิม)
- `.gitignore` (รองรับเช่นกัน)

เมตาดาต้าการติดตั้งภายในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งในไดเรกทอรีทำงาน (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์จะดึงเมตาดาต้าจาก frontmatter ระหว่าง publish
- `description` ใช้เป็นสรุปของสกิลใน UI/การค้นหา

## เมตาดาต้า Frontmatter

เมตาดาต้าสกิลประกาศใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ของคุณ ข้อมูลนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่าสกิลของคุณต้องใช้อะไรในการทำงาน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมตาดาต้า Runtime (`metadata.openclaw`)

ประกาศข้อกำหนด runtime ของสกิลใต้ `metadata.openclaw` (นามแฝง: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่สกิลจะทำงานได้ ใช้ `envVars` เมื่อคุณต้องการเมตาดาต้ารายตัวแปร รวมถึงตัวแปรที่ไม่บังคับพร้อม `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ชนิด       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมจำเป็นที่สกิลของคุณคาดว่าจะมี                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์คอนฟิกที่สกิลของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | ตัวแปรสภาพแวดล้อมสำหรับข้อมูลรับรองหลักของสกิลของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้ง `required: false` สำหรับตัวแปรสภาพแวดล้อมที่ไม่บังคับ |
| `always`           | `boolean`  | หากเป็น `true` สกิลจะทำงานเสมอ (ไม่จำเป็นต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์เรียกใช้งานของสกิล                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับสกิล                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของสกิล                                                                                                         |
| `os`               | `string[]` | ข้อจำกัดระบบปฏิบัติการ (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependencies (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Plugin ของ Nix (ดู README)                                                                                                                |
| `config`           | `object`   | สเปกคอนฟิก Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

หากสกิลของคุณต้องติดตั้ง dependencies ให้ประกาศไว้ในอาร์เรย์ `install`:

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

ประกาศตัวแปรสภาพแวดล้อมที่ไม่บังคับใต้ `metadata.openclaw.envVars` และตั้ง `required: false` อย่าเพิ่มรายการที่ไม่บังคับใน `requires.env` เพราะ `requires.env` หมายความว่าสกิลไม่สามารถทำงานได้หากไม่มีรายการเหล่านั้น

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

การวิเคราะห์ความปลอดภัยของ ClawHub จะตรวจสอบว่าสิ่งที่สกิลของคุณประกาศตรงกับสิ่งที่สกิลทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะรายงานว่าเมตาดาต้าไม่ตรงกัน การประกาศให้ถูกต้องช่วยให้สกิลของคุณผ่านการตรวจทาน และช่วยให้ผู้ใช้เข้าใจสิ่งที่กำลังติดตั้ง

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

publish รับเฉพาะไฟล์แบบ “ข้อความ” เท่านั้น

- รายการอนุญาตของนามสกุลอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` จะถูกรับเป็นข้อความ
- Content type ที่ขึ้นต้นด้วย `text/` จะถือว่าเป็นข้อความ รวมถึงรายการอนุญาตขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาดบันเดิลรวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` สูงสุดประมาณ 40 ไฟล์ (จำกัดแบบพยายามอย่างดีที่สุด)

## Slugs

- โดยค่าเริ่มต้น สร้างจากชื่อโฟลเดอร์
- ต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ URL: `^[a-z0-9][a-z0-9-]*$`

## การกำหนดเวอร์ชัน + แท็ก

- การ publish แต่ละครั้งจะสร้างเวอร์ชันใหม่ (semver)
- แท็กเป็นพอยน์เตอร์แบบสตริงไปยังเวอร์ชันหนึ่ง โดยทั่วไปใช้ `latest`

## ใบอนุญาต

- สกิลทั้งหมดที่ publish บน ClawHub อยู่ภายใต้ใบอนุญาต `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และแจกจ่ายสกิลที่เผยแพร่แล้ว รวมถึงเชิงพาณิชย์
- ไม่จำเป็นต้องระบุที่มา
- อย่าเพิ่มเงื่อนไขใบอนุญาตที่ขัดแย้งกันใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ใบอนุญาตรายสกิล

## สกิลแบบชำระเงิน

- ClawHub ไม่รองรับสกิลแบบชำระเงิน การกำหนดราคารายสกิล เพย์วอลล์ หรือการแบ่งรายได้
- อย่าเพิ่มเมตาดาต้าราคาใน `SKILL.md`; สิ่งนี้ไม่ใช่ส่วนหนึ่งของรูปแบบสกิล และจะไม่ทำให้สกิลที่ publish แล้วเป็นสกิลแบบชำระเงิน
- หากสกิลของคุณผสานการทำงานกับบริการบุคคลที่สามแบบชำระเงิน ให้บันทึกต้นทุนภายนอกและบัญชีที่จำเป็นอย่างชัดเจนในคำแนะนำของสกิลและการประกาศ env (`requires.env` สำหรับตัวแปรจำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรที่ไม่บังคับ)
