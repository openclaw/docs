---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่
summary: รูปแบบโฟลเดอร์ Skills, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด
x-i18n:
    generated_at: "2026-07-02T08:58:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบ Skill

## บนดิสก์

Skill คือโฟลเดอร์หนึ่งโฟลเดอร์

จำเป็น:

- `SKILL.md` (หรือ `skill.md`; รองรับ `skills.md` แบบเดิมด้วย)

ไม่บังคับ:

- ไฟล์สนับสนุนแบบ _ข้อความ_ ใดๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบการละเว้นสำหรับการเผยแพร่, แบบเดิมคือ `.clawdhubignore`)
- `.gitignore` (ใช้งานด้วยเช่นกัน)

## การนำเข้าจาก GitHub

ตัวนำเข้า GitHub บนเว็บเข้มงวดกว่าการเผยแพร่/ซิงก์ในเครื่อง โดยจะค้นพบเฉพาะไฟล์
`SKILL.md` หรือ `skills.md` แบบเดิมในที่เก็บสาธารณะ ที่ไม่ใช่ fork และเป็นของ
บัญชี GitHub ที่ลงชื่อเข้าใช้เท่านั้น ระบบจะไม่นำเข้าที่เก็บส่วนตัว, fork,
ที่เก็บที่ถูกเก็บถาวร/ปิดใช้งาน หรือที่เก็บสาธารณะของบุคคลที่สาม

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งของ workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter ที่ใส่หรือไม่ใส่ก็ได้
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่างการเผยแพร่
- `description` ใช้เป็นสรุป Skill ใน UI/การค้นหา

## เมทาดาทา Frontmatter

เมทาดาทา Skill ประกาศไว้ใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ของคุณ สิ่งนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่า Skill ของคุณต้องใช้อะไรบ้างเพื่อทำงาน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทารันไทม์ (`metadata.openclaw`)

ประกาศข้อกำหนดรันไทม์ของ Skill ของคุณไว้ใต้ `metadata.openclaw` (นามแฝง: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่ Skill จะทำงานได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทารายตัวแปร รวมถึงตัวแปรที่ไม่บังคับด้วย `required: false`

### รายการอ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่ง Skill ของคุณคาดว่าจะมี                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์ config ที่ Skill ของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | ตัวแปรสภาพแวดล้อมข้อมูลรับรองหลักสำหรับ Skill ของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` ที่ไม่บังคับ และ `description` ที่ไม่บังคับ ตั้งค่า `required: false` สำหรับตัวแปรสภาพแวดล้อมที่ไม่บังคับ |
| `always`           | `boolean`  | หากเป็น `true` Skill จะเปิดใช้งานเสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์การเรียกใช้ของ Skill                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับ Skill                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของ Skill                                                                                                         |
| `os`               | `string[]` | ข้อจำกัดระบบปฏิบัติการ (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependency (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Plugin ของ Nix (ดู README)                                                                                                                |
| `config`           | `object`   | สเปก config ของ Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

หาก Skill ของคุณต้องติดตั้ง dependency ให้ประกาศไว้ในอาร์เรย์ `install`:

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

ประกาศตัวแปรสภาพแวดล้อมที่ไม่บังคับไว้ใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการที่ไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่า Skill จะทำงานไม่ได้หากไม่มีตัวแปรเหล่านั้น

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

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่ Skill ของคุณประกาศตรงกับสิ่งที่มันทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะระบุว่าเมทาดาทาไม่ตรงกัน การรักษาการประกาศให้ถูกต้องช่วยให้ Skill ของคุณผ่านการตรวจทาน และช่วยให้ผู้ใช้เข้าใจว่ากำลังติดตั้งอะไร

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

การเผยแพร่ยอมรับเฉพาะไฟล์แบบ “ข้อความ” เท่านั้น

- รายการส่วนขยายที่อนุญาตอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด; ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ยอมรับเป็นข้อความ
- ชนิดเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือเป็นข้อความ; รวมถึงรายการอนุญาตขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาด bundle รวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` ได้สูงสุดประมาณ 40 ไฟล์ (ขีดจำกัดแบบพยายามให้ดีที่สุด)

## Slug

- ได้มาจากชื่อโฟลเดอร์ตามค่าเริ่มต้น
- scope ของแพ็กเกจต้องตรงกับ handle ผู้เผยแพร่ ClawHub ทุกตัวอักษร handle ผู้เผยแพร่ใช้ตัวอักษรพิมพ์เล็ก ตัวเลข ขีดกลาง จุด และขีดล่างได้; ต้องขึ้นต้นและลงท้ายด้วยตัวอักษรพิมพ์เล็กหรือตัวเลข
- slug ของแพ็กเกจต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การกำหนดเวอร์ชัน + แท็ก

- การเผยแพร่แต่ละครั้งจะสร้างเวอร์ชันใหม่ (semver)
- แท็กคือตัวชี้แบบสตริงไปยังเวอร์ชัน; มักใช้ `latest`

## ใบอนุญาต

- Skill ทั้งหมดที่เผยแพร่บน ClawHub ใช้ใบอนุญาต `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และแจกจ่าย Skill ที่เผยแพร่แล้วซ้ำได้ รวมถึงเชิงพาณิชย์
- ไม่จำเป็นต้องให้เครดิต
- อย่าเพิ่มข้อกำหนดใบอนุญาตที่ขัดแย้งกันใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ใบอนุญาตราย Skill

## Skill แบบชำระเงิน

- ClawHub ไม่รองรับ Skill แบบชำระเงิน การตั้งราคาราย Skill paywall หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาใน `SKILL.md`; เมทาดาทานี้ไม่ใช่ส่วนหนึ่งของรูปแบบ Skill และจะไม่ทำให้ Skill ที่เผยแพร่แล้วกลายเป็นแบบชำระเงิน
- หาก Skill ของคุณผสานกับบริการบุคคลที่สามแบบชำระเงิน ให้บันทึกค่าใช้จ่ายภายนอกและบัญชีที่จำเป็นไว้อย่างชัดเจนในคำแนะนำของ Skill และการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรที่ไม่บังคับ)
