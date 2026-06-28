---
read_when:
    - การเผยแพร่ Skills
    - การแก้ไขข้อผิดพลาดเมื่อการเผยแพร่ล้มเหลว
summary: รูปแบบโฟลเดอร์ Skill, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด.
x-i18n:
    generated_at: "2026-06-28T05:08:02Z"
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

- `SKILL.md` (หรือ `skill.md`; รองรับ `skills.md` แบบเดิมด้วย)

ไม่บังคับ:

- ไฟล์สนับสนุนที่เป็น _ข้อความ_ ใดๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (แพตเทิร์นที่ให้ละเว้นสำหรับการเผยแพร่, `.clawdhubignore` แบบเดิม)
- `.gitignore` (ใช้งานด้วยเช่นกัน)

## การนำเข้าจาก GitHub

ตัวนำเข้า GitHub บนเว็บเข้มงวดกว่าการ publish/sync ในเครื่อง โดยจะค้นพบเฉพาะ
ไฟล์ `SKILL.md` หรือ `skills.md` แบบเดิมในรีพอสาธารณะที่ไม่ใช่ fork และเป็นของ
บัญชี GitHub ที่ลงชื่อเข้าใช้เท่านั้น ไม่ได้นำเข้า repo ส่วนตัว, fork,
repo ที่ถูกเก็บถาวร/ปิดใช้งาน หรือ repo สาธารณะของบุคคลที่สาม

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งของ workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่างการเผยแพร่
- `description` ใช้เป็นสรุปสกิลใน UI/การค้นหา

## เมทาดาทา Frontmatter

เมทาดาทาของสกิลประกาศใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ของคุณ สิ่งนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่าสกิลของคุณต้องใช้อะไรจึงจะทำงานได้

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทา Runtime (`metadata.openclaw`)

ประกาศข้อกำหนด runtime ของสกิลภายใต้ `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่สกิลจะทำงานได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทาต่อแต่ละตัวแปร รวมถึงตัวแปรแบบไม่บังคับที่มี `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่งสกิลของคุณคาดว่าจะมี                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งครบทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์ config ที่สกิลของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | env var ข้อมูลรับรองหลักสำหรับสกิลของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้ง `required: false` สำหรับ env var แบบไม่บังคับ |
| `always`           | `boolean`  | หากเป็น `true` สกิลจะ active เสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่ invocation key ของสกิล                                                                                                         |
| `emoji`            | `string`   | emoji ที่แสดงสำหรับสกิล                                                                                                                 |
| `homepage`         | `string`   | URL ไปยัง homepage หรือเอกสารของสกิล                                                                                                         |
| `os`               | `string[]` | ข้อจำกัด OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependencies (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Plugin ของ Nix (ดู README)                                                                                                                |
| `config`           | `object`   | สเปก config ของ Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

หากสกิลของคุณต้องติดตั้ง dependencies ให้ประกาศไว้ใน array `install`:

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

ประกาศตัวแปรสภาพแวดล้อมแบบไม่บังคับภายใต้ `metadata.openclaw.envVars` และตั้ง `required: false` อย่าเพิ่มรายการแบบไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่าสกิลจะทำงานไม่ได้หากไม่มีรายการเหล่านั้น

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

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่สกิลของคุณประกาศตรงกับสิ่งที่สกิลทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ภายใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะ flag ว่าเมทาดาทาไม่ตรงกัน การรักษาการประกาศให้ถูกต้องช่วยให้สกิลของคุณผ่านการ review และช่วยให้ผู้ใช้เข้าใจว่ากำลังติดตั้งอะไร

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

การเผยแพร่ยอมรับเฉพาะไฟล์ที่เป็น “ข้อความ” เท่านั้น

- allowlist ของนามสกุลอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังจากอัปโหลด; ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ได้รับการยอมรับเป็นข้อความ
- content type ที่ขึ้นต้นด้วย `text/` จะถือว่าเป็นข้อความ; รวมถึง allowlist ขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาด bundle รวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` สูงสุดประมาณ 40 ไฟล์ (ขีดจำกัดแบบพยายามให้ดีที่สุด)

## Slug

- โดยค่าเริ่มต้น derive จากชื่อโฟลเดอร์
- scope ของ package ต้องตรงกับ handle ผู้เผยแพร่ ClawHub ทุกประการ handle ผู้เผยแพร่ใช้ตัวอักษรพิมพ์เล็ก ตัวเลข ยัติภังค์ จุด และขีดล่างได้; ต้องขึ้นต้นและลงท้ายด้วยตัวอักษรพิมพ์เล็กหรือตัวเลข
- slug ของ package ต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การกำหนดเวอร์ชัน + tags

- การเผยแพร่แต่ละครั้งสร้างเวอร์ชันใหม่ (semver)
- Tags เป็น pointer แบบ string ไปยังเวอร์ชัน; โดยทั่วไปใช้ `latest`

## License

- สกิลทั้งหมดที่เผยแพร่บน ClawHub อยู่ภายใต้ license `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และเผยแพร่สกิลที่เผยแพร่แล้วซ้ำได้ รวมถึงเชิงพาณิชย์
- ไม่จำเป็นต้องแสดง attribution
- อย่าเพิ่มข้อกำหนด license ที่ขัดแย้งกันใน `SKILL.md`; ClawHub ไม่รองรับการ override license ต่อสกิล

## สกิลแบบชำระเงิน

- ClawHub ไม่รองรับสกิลแบบชำระเงิน การตั้งราคาต่อสกิล paywall หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาใน `SKILL.md`; มันไม่ใช่ส่วนหนึ่งของรูปแบบสกิลและจะไม่ทำให้สกิลที่เผยแพร่เป็นแบบชำระเงิน
- หากสกิลของคุณผสานกับบริการบุคคลที่สามแบบชำระเงิน ให้ระบุต้นทุนภายนอกและบัญชีที่จำเป็นอย่างชัดเจนในคำแนะนำของสกิลและการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรแบบไม่บังคับ)
