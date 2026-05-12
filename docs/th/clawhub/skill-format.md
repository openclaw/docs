---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่/การซิงค์
summary: รูปแบบโฟลเดอร์สกิล, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด.
x-i18n:
    generated_at: "2026-05-12T23:29:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบ Skill

## บนดิสก์

skill คือโฟลเดอร์หนึ่ง

จำเป็น:

- `SKILL.md` (หรือ `skill.md`)

ไม่บังคับ:

- ไฟล์ _แบบข้อความ_ ใดๆ ที่รองรับ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบที่ให้ละเว้นสำหรับ publish/sync, เดิมคือ `.clawdhubignore`)
- `.gitignore` (รองรับเช่นกัน)

เมตาดาต้าการติดตั้งแบบโลคัล (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (เดิมคือ `.clawdhub`)

สถานะการติดตั้งใน workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (เดิมคือ `.clawdhub`)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter ที่เป็นตัวเลือก
- เซิร์ฟเวอร์จะดึงเมตาดาต้าจาก frontmatter ระหว่างการ publish
- `description` ใช้เป็นสรุปของ skill ใน UI/การค้นหา

## เมตาดาต้า Frontmatter

เมตาดาต้า Skill ประกาศใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ของคุณ ซึ่งบอก registry (และการวิเคราะห์ความปลอดภัย) ว่า skill ของคุณต้องใช้อะไรจึงจะรันได้

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมตาดาต้า Runtime (`metadata.openclaw`)

ประกาศข้อกำหนด runtime ของ skill ใต้ `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่ skill จะรันได้ ใช้ `envVars` เมื่อคุณต้องการเมตาดาต้ารายตัวแปร รวมถึงตัวแปรที่เป็นตัวเลือกพร้อม `required: false`

### อ้างอิงฟิลด์ฉบับเต็ม

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่ง skill ของคุณคาดว่าจะมี                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์ config ที่ skill ของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | env var ข้อมูลรับรองหลักสำหรับ skill ของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` ที่เป็นตัวเลือก และ `description` ที่เป็นตัวเลือก ตั้งค่า `required: false` สำหรับ env vars ที่เป็นตัวเลือก |
| `always`           | `boolean`  | หากเป็น `true` skill จะ active เสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่ invocation key ของ skill                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับ skill                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของ skill                                                                                                         |
| `os`               | `string[]` | ข้อจำกัด OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependencies (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Plugin ของ Nix (ดู README)                                                                                                                |
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

### ตัวแปรสภาพแวดล้อมที่เป็นตัวเลือก

ประกาศตัวแปรสภาพแวดล้อมที่เป็นตัวเลือกใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการที่เป็นตัวเลือกใน `requires.env` เพราะ `requires.env` หมายความว่า skill จะรันไม่ได้หากไม่มีรายการเหล่านั้น

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

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่ skill ของคุณประกาศตรงกับสิ่งที่มันทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะ flag ว่าเมตาดาต้าไม่ตรงกัน การรักษาการประกาศให้ถูกต้องช่วยให้ skill ของคุณผ่านการรีวิว และช่วยให้ผู้ใช้เข้าใจว่ากำลังติดตั้งอะไร

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

publish จะยอมรับเฉพาะไฟล์ “แบบข้อความ” เท่านั้น

- allowlist ของนามสกุลอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` จะถูกยอมรับเป็นข้อความ
- Content type ที่ขึ้นต้นด้วย `text/` จะถือเป็นข้อความ รวมถึง allowlist ขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาด bundle รวม: 50MB
- ข้อความ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` ได้สูงสุดประมาณ 40 ไฟล์ (ขีดจำกัดแบบ best-effort)

## Slugs

- โดยค่าเริ่มต้นจะได้มาจากชื่อโฟลเดอร์
- ต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ URL: `^[a-z0-9][a-z0-9-]*$`

## Versioning + tags

- การ publish แต่ละครั้งจะสร้างเวอร์ชันใหม่ (semver)
- Tags คือพอยน์เตอร์แบบสตริงไปยังเวอร์ชันหนึ่ง โดยทั่วไปใช้ `latest`

## License

- skill ทั้งหมดที่ publish บน ClawHub อยู่ภายใต้ไลเซนส์ `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และเผยแพร่ skill ที่ publish แล้วต่อได้ รวมถึงเพื่อการค้า
- ไม่จำเป็นต้องแสดงที่มา
- อย่าเพิ่มเงื่อนไขไลเซนส์ที่ขัดแย้งกันใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ไลเซนส์ราย skill

## Paid skills

- ClawHub ไม่รองรับ skill แบบเสียเงิน การตั้งราคาราย skill paywalls หรือ revenue sharing
- อย่าเพิ่มเมตาดาต้าราคาใน `SKILL.md`; สิ่งนี้ไม่ใช่ส่วนหนึ่งของรูปแบบ skill และจะไม่ทำให้ skill ที่ publish แล้วกลายเป็น skill แบบเสียเงิน
- หาก skill ของคุณผสานรวมกับบริการภายนอกแบบเสียเงิน ให้บันทึกต้นทุนภายนอกและบัญชีที่จำเป็นอย่างชัดเจนในคำแนะนำของ skill และการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรที่เป็นตัวเลือก)
