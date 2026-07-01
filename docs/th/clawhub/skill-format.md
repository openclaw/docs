---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่
summary: รูปแบบโฟลเดอร์ Skill, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด
x-i18n:
    generated_at: "2026-07-01T08:42:12Z"
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

- ไฟล์สนับสนุนที่เป็น _ข้อความ_ ใดก็ได้ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (แพตเทิร์นสำหรับละเว้นตอนเผยแพร่, `.clawdhubignore` แบบเดิม)
- `.gitignore` (มีผลเช่นกัน)

## การนำเข้าจาก GitHub

ตัวนำเข้า GitHub บนเว็บเข้มงวดกว่าการ publish/sync แบบ local โดยจะค้นพบเฉพาะไฟล์
`SKILL.md` หรือ `skills.md` แบบเดิมในรีโพสาธารณะที่ไม่ใช่ fork และเป็นของ
บัญชี GitHub ที่ลงชื่อเข้าใช้เท่านั้น ไม่ได้นำเข้ารีโพส่วนตัว, fork,
รีโพที่ถูก archive/disabled หรือรีโพสาธารณะของบุคคลที่สาม

เมตาดาต้าการติดตั้งแบบ local (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งใน workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์ดึงเมตาดาต้าจาก frontmatter ระหว่างการเผยแพร่
- `description` ใช้เป็นสรุป Skill ใน UI/การค้นหา

## เมตาดาต้า Frontmatter

เมตาดาต้า Skill ประกาศใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ของคุณ สิ่งนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่า Skill ของคุณต้องใช้อะไรในการรัน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมตาดาต้ารันไทม์ (`metadata.openclaw`)

ประกาศข้อกำหนดรันไทม์ของ Skill ใต้ `metadata.openclaw` (นามแฝง: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อน Skill จะรันได้ ใช้ `envVars` เมื่อคุณต้องการเมตาดาต้ารายตัวแปร รวมถึงตัวแปรแบบไม่บังคับที่มี `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| Field              | Type       | Description                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่ง Skill ของคุณคาดหวัง                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งครบทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอยู่อย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์ config ที่ Skill ของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | ตัวแปรสภาพแวดล้อม credential หลักสำหรับ Skill ของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมที่มี `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้งค่า `required: false` สำหรับตัวแปรสภาพแวดล้อมแบบไม่บังคับ |
| `always`           | `boolean`  | ถ้าเป็น `true` Skill จะ active เสมอ (ไม่ต้องติดตั้งแบบ explicit)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์ invocation ของ Skill                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับ Skill                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของ Skill                                                                                                         |
| `os`               | `string[]` | ข้อจำกัด OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependencies (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Plugin Nix (ดู README)                                                                                                                |
| `config`           | `object`   | สเปก config ของ Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

หาก Skill ของคุณต้องติดตั้ง dependencies ให้ประกาศไว้ในอาร์เรย์ `install`:

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

ประกาศตัวแปรสภาพแวดล้อมแบบไม่บังคับใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการแบบไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่า Skill จะรันไม่ได้หากไม่มีตัวแปรเหล่านั้น

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

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่ Skill ของคุณประกาศตรงกับสิ่งที่มันทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะระบุว่าเมตาดาต้าไม่ตรงกัน การรักษาคำประกาศให้ถูกต้องช่วยให้ Skill ของคุณผ่านการรีวิว และช่วยให้ผู้ใช้เข้าใจว่ากำลังติดตั้งอะไร

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

publish ยอมรับเฉพาะไฟล์ที่เป็น “ข้อความ”

- allowlist ของนามสกุลอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด; ยอมรับไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` เป็นข้อความ
- Content types ที่ขึ้นต้นด้วย `text/` จะถูกถือว่าเป็นข้อความ; รวมถึง allowlist ขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาด bundle รวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` ได้สูงสุดประมาณ 40 ไฟล์ (ขีดจำกัดแบบพยายามให้ดีที่สุด)

## Slugs

- โดยค่าเริ่มต้น derive จากชื่อโฟลเดอร์
- Package scopes ต้องตรงกับ handle ของผู้เผยแพร่ ClawHub ทุกตัวอักษร Publisher handles ใช้อักษรตัวพิมพ์เล็ก ตัวเลข ยัติภังค์ จุด และขีดล่างได้ และต้องเริ่มต้นและลงท้ายด้วยอักษรตัวพิมพ์เล็กหรือตัวเลข
- Package slugs ต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การกำหนดเวอร์ชัน + tags

- การเผยแพร่แต่ละครั้งสร้างเวอร์ชันใหม่ (semver)
- Tags คือพอยน์เตอร์แบบสตริงไปยังเวอร์ชัน; ใช้ `latest` กันทั่วไป

## License

- Skill ทั้งหมดที่เผยแพร่บน ClawHub อยู่ภายใต้ license `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และแจกจ่าย Skill ที่เผยแพร่แล้วได้ รวมถึงเพื่อการค้า
- ไม่จำเป็นต้องให้ attribution
- อย่าเพิ่มเงื่อนไข license ที่ขัดแย้งกันใน `SKILL.md`; ClawHub ไม่รองรับการ override license ราย Skill

## Skill แบบชำระเงิน

- ClawHub ไม่รองรับ Skill แบบชำระเงิน, การตั้งราคาราย Skill, paywalls หรือการแบ่งรายได้
- อย่าเพิ่มเมตาดาต้าราคาใน `SKILL.md`; สิ่งนี้ไม่ใช่ส่วนหนึ่งของรูปแบบ Skill และจะไม่ทำให้ Skill ที่เผยแพร่แล้วกลายเป็นแบบชำระเงิน
- หาก Skill ของคุณผสานกับบริการบุคคลที่สามแบบชำระเงิน ให้บันทึกค่าใช้จ่ายภายนอกและบัญชีที่จำเป็นไว้อย่างชัดเจนในคำแนะนำของ Skill และการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรแบบไม่บังคับ)
