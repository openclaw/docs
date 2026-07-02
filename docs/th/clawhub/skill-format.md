---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่
summary: รูปแบบโฟลเดอร์ของ Skills, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด
x-i18n:
    generated_at: "2026-07-02T17:49:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบ Skill

## บนดิสก์

Skills คือโฟลเดอร์หนึ่ง

จำเป็นต้องมี:

- `SKILL.md` (หรือ `skill.md`; ยังยอมรับ `skills.md` แบบเก่าอยู่)

ไม่บังคับ:

- ไฟล์สนับสนุนชนิด _ข้อความ_ ใดๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบที่ละเว้นสำหรับการเผยแพร่, `.clawdhubignore` แบบเก่า)
- `.gitignore` (รองรับเช่นกัน)

## การนำเข้าจาก GitHub

ตัวนำเข้า GitHub บนเว็บเข้มงวดกว่าการเผยแพร่/ซิงก์ในเครื่อง ตัวนำเข้าจะค้นพบเฉพาะไฟล์
`SKILL.md` หรือ `skills.md` แบบเก่าใน repository สาธารณะที่ไม่ใช่ fork และเป็นของ
บัญชี GitHub ที่ลงชื่อเข้าใช้เท่านั้น ตัวนำเข้าจะไม่นำเข้า repository ส่วนตัว, fork,
repository ที่ถูกเก็บถาวร/ปิดใช้งาน หรือ repository สาธารณะของบุคคลที่สาม

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเก่า)

สถานะการติดตั้งใน workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเก่า)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่างการเผยแพร่
- `description` ใช้เป็นสรุป Skills ใน UI/การค้นหา

## เมทาดาทา Frontmatter

ประกาศเมทาดาทา Skills ใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ของคุณ สิ่งนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่า Skills ของคุณต้องใช้อะไรจึงจะทำงานได้

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทา Runtime (`metadata.openclaw`)

ประกาศข้อกำหนด runtime ของ Skills ภายใต้ `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับ environment variable ที่ต้องมีอยู่ก่อนที่ Skills จะทำงานได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทารายตัวแปร รวมถึงตัวแปรไม่บังคับที่มี `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ชนิด       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Environment variable ที่จำเป็นซึ่ง Skills ของคุณคาดว่าจะมี                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์ config ที่ Skills ของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | env var credential หลักสำหรับ Skills ของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศ environment variable พร้อม `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้งค่า `required: false` สำหรับ env var ที่ไม่บังคับ |
| `always`           | `boolean`  | หากเป็น `true` Skills จะทำงานอยู่เสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์เรียกใช้ของ Skills                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับ Skills                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของ Skills                                                                                                         |
| `os`               | `string[]` | ข้อจำกัด OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependency (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Plugin Nix (ดู README)                                                                                                                |
| `config`           | `object`   | สเปก config ของ Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

หาก Skills ของคุณต้องติดตั้ง dependency ให้ประกาศไว้ใน array `install`:

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

### Environment variable แบบไม่บังคับ

ประกาศ environment variable แบบไม่บังคับภายใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการแบบไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่า Skills จะทำงานไม่ได้หากไม่มีรายการเหล่านั้น

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

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่ Skills ของคุณประกาศตรงกับสิ่งที่ Skills ทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ไม่ได้ประกาศไว้ภายใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะระบุว่าเมทาดาทาไม่ตรงกัน การรักษาการประกาศให้ถูกต้องช่วยให้ Skills ของคุณผ่านการตรวจสอบ และช่วยให้ผู้ใช้เข้าใจว่าพวกเขากำลังติดตั้งอะไร

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

การเผยแพร่ยอมรับเฉพาะไฟล์ชนิด “ข้อความ”

- allowlist ของนามสกุลอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด; ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ได้รับการยอมรับเป็นข้อความ
- Content type ที่ขึ้นต้นด้วย `text/` จะถูกถือเป็นข้อความ; รวมถึง allowlist ขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาด bundle รวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` ได้สูงสุดประมาณ 40 ไฟล์ (จำกัดแบบ best-effort)

## Slug

- โดยค่าเริ่มต้นได้มาจากชื่อโฟลเดอร์
- Package scope ต้องตรงกับ handle ผู้เผยแพร่ของ ClawHub ทุกประการ handle ผู้เผยแพร่ใช้ตัวอักษรพิมพ์เล็ก ตัวเลข ยัติภังค์ จุด และขีดล่างได้; ต้องขึ้นต้นและลงท้ายด้วยตัวอักษรพิมพ์เล็กหรือตัวเลข
- Package slug ต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การกำหนดเวอร์ชัน + แท็ก

- การเผยแพร่แต่ละครั้งจะสร้างเวอร์ชันใหม่ (semver)
- แท็กคือ pointer แบบสตริงไปยังเวอร์ชัน; มักใช้ `latest`

## สัญญาอนุญาต

- Skills ทั้งหมดที่เผยแพร่บน ClawHub อยู่ภายใต้สัญญาอนุญาต `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และแจกจ่าย Skills ที่เผยแพร่แล้ว รวมถึงเพื่อการค้า
- ไม่จำเป็นต้องระบุแหล่งที่มา
- อย่าเพิ่มเงื่อนไขสัญญาอนุญาตที่ขัดแย้งใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่สัญญาอนุญาตราย Skills

## Skills แบบชำระเงิน

- ClawHub ไม่รองรับ Skills แบบชำระเงิน การตั้งราคาราย Skills paywall หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาลงใน `SKILL.md`; สิ่งนี้ไม่ใช่ส่วนหนึ่งของรูปแบบ Skills และจะไม่ทำให้ Skills ที่เผยแพร่แล้วกลายเป็นแบบชำระเงิน
- หาก Skills ของคุณผสานรวมกับบริการบุคคลที่สามแบบชำระเงิน ให้จัดทำเอกสารค่าใช้จ่ายภายนอกและบัญชีที่จำเป็นอย่างชัดเจนในคำแนะนำของ Skills และการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรที่ไม่บังคับ)
