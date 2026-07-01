---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่
summary: รูปแบบโฟลเดอร์ Skills, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด
x-i18n:
    generated_at: "2026-07-01T20:38:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบ Skill

## บนดิสก์

Skill คือโฟลเดอร์หนึ่ง

จำเป็น:

- `SKILL.md` (หรือ `skill.md`; รองรับ `skills.md` แบบเดิมด้วย)

ไม่บังคับ:

- ไฟล์สนับสนุนแบบ _ข้อความ_ ใดๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบการละเว้นสำหรับการเผยแพร่, `.clawdhubignore` แบบเดิม)
- `.gitignore` (มีผลเช่นกัน)

## การนำเข้าจาก GitHub

ตัวนำเข้า GitHub บนเว็บเข้มงวดกว่าการเผยแพร่/ซิงก์ในเครื่อง โดยจะค้นพบเฉพาะไฟล์
`SKILL.md` หรือ `skills.md` แบบเดิมใน repository สาธารณะที่ไม่ใช่ fork และเป็นของ
บัญชี GitHub ที่ลงชื่อเข้าใช้เท่านั้น โดยจะไม่นำเข้า repository ส่วนตัว, fork,
repository ที่ถูกเก็บถาวร/ปิดใช้งาน หรือ repository สาธารณะของบุคคลที่สาม

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งใน workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่างการเผยแพร่
- `description` ใช้เป็นสรุปของ Skill ใน UI/การค้นหา

## เมทาดาทา Frontmatter

ประกาศเมทาดาทาของ Skill ใน YAML frontmatter ที่ด้านบนของ `SKILL.md` สิ่งนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่า Skill ของคุณต้องใช้อะไรในการรัน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทารันไทม์ (`metadata.openclaw`)

ประกาศข้อกำหนดรันไทม์ของ Skill ภายใต้ `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่ Skill จะรันได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทาต่อแต่ละตัวแปร รวมถึงตัวแปรแบบไม่บังคับที่มี `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่ง Skill ของคุณคาดว่าจะมี                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งครบทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอยู่อย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | path ไฟล์ config ที่ Skill ของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | env var หลักสำหรับ credential ของ Skill ของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้งค่า `required: false` สำหรับ env var แบบไม่บังคับ |
| `always`           | `boolean`  | ถ้าเป็น `true` Skill จะ active เสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่ invocation key ของ Skill                                                                                                         |
| `emoji`            | `string`   | emoji ที่แสดงสำหรับ Skill                                                                                                                 |
| `homepage`         | `string`   | URL ไปยัง homepage หรือ docs ของ Skill                                                                                                         |
| `os`               | `string[]` | ข้อจำกัด OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | ข้อกำหนดการติดตั้งสำหรับ dependency (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | ข้อกำหนด Plugin ของ Nix (ดู README)                                                                                                                |
| `config`           | `object`   | ข้อกำหนด config ของ Clawdbot (ดู README)                                                                                                           |

### ข้อกำหนดการติดตั้ง

หาก Skill ของคุณต้องติดตั้ง dependency ให้ประกาศใน array `install`:

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

ประกาศตัวแปรสภาพแวดล้อมแบบไม่บังคับภายใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการแบบไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่า Skill จะรันไม่ได้หากไม่มีรายการเหล่านั้น

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

### เหตุใดเรื่องนี้จึงสำคัญ

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่ Skill ของคุณประกาศตรงกับสิ่งที่ทำจริงหรือไม่ หาก code ของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ภายใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะ flag ว่าเมทาดาทาไม่ตรงกัน การรักษาการประกาศให้ถูกต้องช่วยให้ Skill ของคุณผ่านการ review และช่วยให้ผู้ใช้เข้าใจว่ากำลังติดตั้งอะไร

### ตัวอย่าง: frontmatter ที่ครบถ้วน

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

- allowlist ของ extension อยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์ script ยังคงถูกสแกนหลังอัปโหลด; ยอมรับไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` เป็นข้อความ
- content type ที่ขึ้นต้นด้วย `text/` จะถูกถือว่าเป็นข้อความ; บวกกับ allowlist ขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาด bundle รวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` สูงสุดประมาณ 40 ไฟล์ (จำกัดแบบ best-effort)

## Slug

- ได้มาจากชื่อโฟลเดอร์โดยค่าเริ่มต้น
- package scope ต้องตรงกับ handle ผู้เผยแพร่ ClawHub ทุกตัวอักษร handle ผู้เผยแพร่ใช้ตัวอักษรพิมพ์เล็ก ตัวเลข ยัติภังค์ จุด และ underscore ได้ และต้องเริ่มต้นและลงท้ายด้วยตัวอักษรพิมพ์เล็กหรือตัวเลข
- package slug ต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การกำหนดเวอร์ชัน + tag

- การเผยแพร่แต่ละครั้งสร้างเวอร์ชันใหม่ (semver)
- tag เป็น pointer แบบ string ไปยังเวอร์ชัน; มักใช้ `latest`

## License

- Skill ทั้งหมดที่เผยแพร่บน ClawHub มี license ภายใต้ `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และเผยแพร่ Skill ที่เผยแพร่แล้วต่อได้ รวมถึงเชิงพาณิชย์
- ไม่จำเป็นต้องให้เครดิต
- อย่าเพิ่มเงื่อนไข license ที่ขัดแย้งกันใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ license ราย Skill

## Skill แบบชำระเงิน

- ClawHub ไม่รองรับ Skill แบบชำระเงิน, การตั้งราคาราย Skill, paywall หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาใน `SKILL.md`; สิ่งนี้ไม่ใช่ส่วนหนึ่งของรูปแบบ Skill และจะไม่ทำให้ Skill ที่เผยแพร่แล้วกลายเป็นแบบชำระเงิน
- หาก Skill ของคุณผสานกับบริการบุคคลที่สามแบบชำระเงิน ให้ระบุค่าใช้จ่ายภายนอกและบัญชีที่จำเป็นอย่างชัดเจนในคำแนะนำ Skill และการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรแบบไม่บังคับ)
