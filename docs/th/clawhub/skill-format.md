---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่
summary: รูปแบบโฟลเดอร์ Skill, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด.
x-i18n:
    generated_at: "2026-06-30T22:38:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบสกิล

## บนดิสก์

สกิลคือโฟลเดอร์หนึ่งโฟลเดอร์

จำเป็น:

- `SKILL.md` (หรือ `skill.md`; รองรับ `skills.md` แบบเดิมด้วย)

ไม่บังคับ:

- ไฟล์ _แบบข้อความ_ สำหรับสนับสนุนใด ๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบที่ต้องละเว้นสำหรับการเผยแพร่, แบบเดิมคือ `.clawdhubignore`)
- `.gitignore` (จะถูกใช้งานด้วย)

## การนำเข้าจาก GitHub

ตัวนำเข้า GitHub บนเว็บเข้มงวดกว่าการเผยแพร่/ซิงก์ในเครื่อง โดยจะค้นพบเฉพาะไฟล์
`SKILL.md` หรือ `skills.md` แบบเดิมในคลังสาธารณะที่ไม่ใช่ฟอร์ก และเป็นของ
บัญชี GitHub ที่เข้าสู่ระบบอยู่เท่านั้น โดยจะไม่นำเข้าคลังส่วนตัว ฟอร์ก
คลังที่ถูกเก็บถาวร/ปิดใช้งาน หรือคลังสาธารณะของบุคคลที่สาม

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งของ workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่างการเผยแพร่
- `description` ถูกใช้เป็นสรุปของสกิลใน UI/การค้นหา

## เมทาดาทา Frontmatter

เมทาดาทาของสกิลประกาศใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ของคุณ สิ่งนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่าสกิลของคุณต้องใช้อะไรเพื่อทำงาน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทารันไทม์ (`metadata.openclaw`)

ประกาศข้อกำหนดรันไทม์ของสกิลภายใต้ `metadata.openclaw` (ชื่อแฝง: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนสกิลจึงจะทำงานได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทารายตัวแปร รวมถึงตัวแปรที่ไม่บังคับซึ่งมี `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่งสกิลของคุณคาดหวัง                                                                                            |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์กำหนดค่าที่สกิลของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | ตัวแปรสภาพแวดล้อมข้อมูลประจำตัวหลักสำหรับสกิลของคุณ                                                                                                  |
| `envVars`          | `array`    | ประกาศตัวแปรสภาพแวดล้อมที่มี `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้งค่า `required: false` สำหรับตัวแปรสภาพแวดล้อมแบบไม่บังคับ |
| `always`           | `boolean`  | หากเป็น `true` สกิลจะทำงานอยู่เสมอ (ไม่จำเป็นต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์การเรียกใช้งานของสกิล                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับสกิล                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของสกิล                                                                                                         |
| `os`               | `string[]` | ข้อจำกัดระบบปฏิบัติการ (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | ข้อกำหนดการติดตั้งสำหรับ dependency (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | ข้อกำหนด Plugin ของ Nix (ดู README)                                                                                                                |
| `config`           | `object`   | ข้อกำหนดการกำหนดค่าของ Clawdbot (ดู README)                                                                                                           |

### ข้อกำหนดการติดตั้ง

หากสกิลของคุณต้องติดตั้ง dependency ให้ประกาศไว้ในอาร์เรย์ `install`:

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

ประกาศตัวแปรสภาพแวดล้อมแบบไม่บังคับภายใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการแบบไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่าสกิลไม่สามารถทำงานได้หากไม่มีตัวแปรเหล่านั้น

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

### ทำไมเรื่องนี้จึงสำคัญ

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่สกิลของคุณประกาศตรงกับสิ่งที่สกิลทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ภายใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะระบุว่าเมทาดาทาไม่ตรงกัน การรักษาประกาศให้ถูกต้องช่วยให้สกิลของคุณผ่านการตรวจทาน และช่วยให้ผู้ใช้เข้าใจว่ากำลังติดตั้งอะไร

### ตัวอย่าง: frontmatter แบบครบถ้วน

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

- รายการส่วนขยายที่อนุญาตอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด; ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ถูกยอมรับเป็นข้อความ
- ชนิดเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือว่าเป็นข้อความ; รวมถึงรายการอนุญาตขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาดบันเดิลรวม: 50MB
- ข้อความสำหรับฝังรวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` สูงสุดประมาณ 40 ไฟล์ (ขีดจำกัดแบบพยายามให้ดีที่สุด)

## Slug

- โดยค่าเริ่มต้นจะได้มาจากชื่อโฟลเดอร์
- Scope ของแพ็กเกจต้องตรงกับ handle ผู้เผยแพร่ของ ClawHub ทุกตัวอักษร handle ผู้เผยแพร่ใช้ได้กับตัวอักษรพิมพ์เล็ก ตัวเลข ขีดกลาง จุด และขีดล่าง; ต้องขึ้นต้นและลงท้ายด้วยตัวอักษรพิมพ์เล็กหรือตัวเลข
- Slug ของแพ็กเกจต้องเป็นตัวพิมพ์เล็กและปลอดภัยตามรูปแบบ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การกำหนดเวอร์ชัน + แท็ก

- การเผยแพร่แต่ละครั้งสร้างเวอร์ชันใหม่ (semver)
- แท็กเป็นตัวชี้แบบสตริงไปยังเวอร์ชันหนึ่ง; มักใช้ `latest`

## ใบอนุญาต

- สกิลทั้งหมดที่เผยแพร่บน ClawHub อยู่ภายใต้ใบอนุญาต `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และเผยแพร่สกิลที่เผยแพร่แล้วต่อได้ รวมถึงใช้เชิงพาณิชย์
- ไม่จำเป็นต้องให้เครดิต
- อย่าเพิ่มข้อกำหนดใบอนุญาตที่ขัดแย้งใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ใบอนุญาตรายสกิล

## สกิลแบบชำระเงิน

- ClawHub ไม่รองรับสกิลแบบชำระเงิน การตั้งราคารายสกิล paywall หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาลงใน `SKILL.md`; สิ่งนี้ไม่ใช่ส่วนหนึ่งของรูปแบบสกิล และจะไม่ทำให้สกิลที่เผยแพร่แล้วกลายเป็นแบบชำระเงิน
- หากสกิลของคุณผสานรวมกับบริการบุคคลที่สามแบบชำระเงิน ให้ระบุค่าใช้จ่ายภายนอกและบัญชีที่ต้องใช้อย่างชัดเจนในคำแนะนำของสกิลและการประกาศตัวแปรสภาพแวดล้อม (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรแบบไม่บังคับ)
