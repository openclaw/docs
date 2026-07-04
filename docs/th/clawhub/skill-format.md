---
read_when:
    - การเผยแพร่ Skills
    - การแก้ไขข้อบกพร่องของความล้มเหลวในการเผยแพร่
summary: รูปแบบโฟลเดอร์ Skills, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด.
x-i18n:
    generated_at: "2026-07-04T04:11:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบสกิล

## บนดิสก์

สกิลคือโฟลเดอร์หนึ่ง

จำเป็น:

- `SKILL.md` (หรือ `skill.md`; ยังยอมรับ `skills.md` แบบเก่าด้วย)

ไม่บังคับ:

- ไฟล์สนับสนุนแบบ _ข้อความ_ ใดๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบการละเว้นสำหรับการเผยแพร่, `.clawdhubignore` แบบเก่า)
- `.gitignore` (ใช้ด้วยเช่นกัน)

## การนำเข้าจาก GitHub

ตัวนำเข้า GitHub บนเว็บเข้มงวดกว่าการเผยแพร่/ซิงก์ในเครื่อง โดยจะค้นพบเฉพาะไฟล์
`SKILL.md` หรือไฟล์ `skills.md` แบบเก่าในรีพอสาธารณะซึ่งไม่ใช่ fork และเป็นของ
บัญชี GitHub ที่ลงชื่อเข้าใช้เท่านั้น ระบบจะไม่นำเข้ารีโพส่วนตัว, fork,
รีโพที่ถูกเก็บถาวร/ปิดใช้งาน หรือรีโพสาธารณะของบุคคลที่สาม

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเก่า)

สถานะการติดตั้งใน workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเก่า)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่างการเผยแพร่
- `description` ใช้เป็นสรุปสกิลใน UI/การค้นหา

## เมทาดาทา Frontmatter

ประกาศเมทาดาทาสกิลใน YAML frontmatter ที่ด้านบนของ `SKILL.md` สิ่งนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่าสกิลของคุณต้องใช้อะไรจึงจะรันได้

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทารันไทม์ (`metadata.openclaw`)

ประกาศข้อกำหนดรันไทม์ของสกิลของคุณภายใต้ `metadata.openclaw` (นามแฝง: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่สกิลจะรันได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทารายตัวแปร รวมถึงตัวแปรที่ไม่บังคับด้วย `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่งสกิลของคุณคาดหวัง                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอยู่อย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | เส้นทางไฟล์ config ที่สกิลของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | ตัวแปรสภาพแวดล้อมสำหรับข้อมูลรับรองหลักของสกิลของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้งค่า `required: false` สำหรับตัวแปรสภาพแวดล้อมที่ไม่บังคับ |
| `always`           | `boolean`  | หากเป็น `true` สกิลจะเปิดใช้งานเสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์การเรียกใช้ของสกิล                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับสกิล                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของสกิล                                                                                                         |
| `os`               | `string[]` | ข้อจำกัด OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependency (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Plugin ของ Nix (ดู README)                                                                                                                |
| `config`           | `object`   | สเปก config ของ Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

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

### ตัวแปรสภาพแวดล้อมที่ไม่บังคับ

ประกาศตัวแปรสภาพแวดล้อมที่ไม่บังคับภายใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการที่ไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่าสกิลไม่สามารถรันได้หากไม่มีรายการเหล่านั้น

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

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่สกิลของคุณประกาศตรงกับสิ่งที่สกิลทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ภายใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะรายงานว่าเมทาดาทาไม่ตรงกัน การรักษาการประกาศให้ถูกต้องช่วยให้สกิลของคุณผ่านการรีวิว และช่วยให้ผู้ใช้เข้าใจว่าสิ่งที่กำลังติดตั้งคืออะไร

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

การเผยแพร่ยอมรับเฉพาะไฟล์แบบ “ข้อความ” เท่านั้น

- รายการนามสกุลที่อนุญาตอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด; ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ได้รับการยอมรับเป็นข้อความ
- ชนิดเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือว่าเป็นข้อความ; รวมถึงรายการอนุญาตขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาดบันเดิลรวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` สูงสุดประมาณ 40 ไฟล์ (จำกัดแบบพยายามให้ดีที่สุด)

## Slugs

- โดยค่าเริ่มต้นได้มาจากชื่อโฟลเดอร์
- scope ของแพ็กเกจต้องตรงกับ handle ของผู้เผยแพร่ ClawHub อย่างเคร่งครัด handle ของผู้เผยแพร่ใช้ตัวอักษรพิมพ์เล็ก, ตัวเลข, ขีดกลาง, จุด และขีดล่างได้; ต้องเริ่มต้นและลงท้ายด้วยตัวอักษรพิมพ์เล็กหรือตัวเลข
- slug ของแพ็กเกจต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การกำหนดเวอร์ชัน + แท็ก

- การเผยแพร่แต่ละครั้งสร้างเวอร์ชันใหม่ (semver)
- แท็กเป็นตัวชี้แบบสตริงไปยังเวอร์ชัน; มักใช้ `latest`

## ใบอนุญาต

- สกิลทั้งหมดที่เผยแพร่บน ClawHub ใช้ใบอนุญาต `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และแจกจ่ายสกิลที่เผยแพร่แล้วซ้ำได้ รวมถึงเชิงพาณิชย์
- ไม่จำเป็นต้องระบุแหล่งที่มา
- อย่าเพิ่มเงื่อนไขใบอนุญาตที่ขัดแย้งใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ใบอนุญาตรายสกิล

## สกิลแบบชำระเงิน

- ClawHub ไม่รองรับสกิลแบบชำระเงิน, การกำหนดราคารายสกิล, paywall หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาลงใน `SKILL.md`; มันไม่ใช่ส่วนหนึ่งของรูปแบบสกิลและจะไม่ทำให้สกิลที่เผยแพร่แล้วเป็นสกิลแบบชำระเงิน
- หากสกิลของคุณผสานรวมกับบริการบุคคลที่สามแบบชำระเงิน ให้บันทึกต้นทุนภายนอกและบัญชีที่จำเป็นไว้อย่างชัดเจนในคำแนะนำของสกิลและการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรที่ไม่บังคับ)
