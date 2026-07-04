---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่
summary: รูปแบบโฟลเดอร์ Skill, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด.
x-i18n:
    generated_at: "2026-07-04T18:25:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบทักษะ

## บนดิสก์

ทักษะคือโฟลเดอร์หนึ่งโฟลเดอร์

จำเป็น:

- `SKILL.md` (หรือ `skill.md`; ยอมรับ `skills.md` แบบเดิมด้วย)

ไม่บังคับ:

- ไฟล์สนับสนุนที่เป็น _ข้อความ_ ใด ๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบการละเว้นสำหรับการเผยแพร่, แบบเดิมคือ `.clawdhubignore`)
- `.gitignore` (ได้รับการใช้งานด้วย)

## การนำเข้าจาก GitHub

ตัวนำเข้า GitHub บนเว็บเข้มงวดกว่าการเผยแพร่/ซิงก์ในเครื่อง ตัวนำเข้าจะค้นพบเฉพาะ
ไฟล์ `SKILL.md` หรือ `skills.md` แบบเดิมในคลังสาธารณะที่ไม่ใช่ fork และเป็นของ
บัญชี GitHub ที่ลงชื่อเข้าใช้อยู่เท่านั้น ตัวนำเข้าไม่นำเข้าคลังส่วนตัว, fork,
คลังที่ถูกเก็บถาวร/ปิดใช้งาน, หรือคลังสาธารณะของบุคคลที่สาม

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (แบบเดิมคือ `.clawdhub`)

สถานะการติดตั้งใน workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (แบบเดิมคือ `.clawdhub`)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่างการเผยแพร่
- `description` ใช้เป็นสรุปทักษะใน UI/การค้นหา

## เมทาดาทา Frontmatter

เมทาดาทาของทักษะประกาศใน YAML frontmatter ที่ด้านบนของ `SKILL.md` สิ่งนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่าทักษะของคุณต้องใช้อะไรเพื่อรัน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทา runtime (`metadata.openclaw`)

ประกาศข้อกำหนด runtime ของทักษะไว้ใต้ `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่ทักษะจะรันได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทาแยกตามตัวแปร รวมถึงตัวแปรไม่บังคับที่มี `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่งทักษะของคุณคาดว่าจะมี                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ทั้งหมดต้องติดตั้งไว้                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | เส้นทางไฟล์ config ที่ทักษะของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | ตัวแปรสภาพแวดล้อมของข้อมูลรับรองหลักสำหรับทักษะของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` แบบไม่บังคับ, และ `description` แบบไม่บังคับ ตั้งค่า `required: false` สำหรับตัวแปรสภาพแวดล้อมไม่บังคับ |
| `always`           | `boolean`  | หากเป็น `true` ทักษะจะ active เสมอ (ไม่ต้องติดตั้งโดยชัดแจ้ง)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์สำหรับเรียกใช้ทักษะ                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับทักษะ                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของทักษะ                                                                                                         |
| `os`               | `string[]` | ข้อจำกัดของ OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependency (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Nix Plugin (ดู README)                                                                                                                |
| `config`           | `object`   | สเปก config ของ Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

หากทักษะของคุณต้องติดตั้ง dependency ให้ประกาศไว้ในอาร์เรย์ `install`:

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

### ตัวแปรสภาพแวดล้อมไม่บังคับ

ประกาศตัวแปรสภาพแวดล้อมไม่บังคับใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่าทักษะจะรันไม่ได้หากไม่มีรายการเหล่านั้น

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

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่ทักษะของคุณประกาศตรงกับสิ่งที่ทักษะทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ใต้ `requires.env`, `primaryEnv`, หรือ `envVars` การวิเคราะห์จะระบุว่าเมทาดาทาไม่ตรงกัน การทำให้การประกาศถูกต้องช่วยให้ทักษะของคุณผ่านการตรวจสอบ และช่วยให้ผู้ใช้เข้าใจว่าพวกเขากำลังติดตั้งอะไร

### ตัวอย่าง: frontmatter ที่สมบูรณ์

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
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด; ไฟล์ PowerShell `.ps1`, `.psm1`, และ `.psd1` ได้รับการยอมรับเป็นข้อความ
- ชนิดเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือว่าเป็นข้อความ; รวมถึง allowlist ขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาดบันเดิลรวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` ได้สูงสุดประมาณ 40 ไฟล์ (ขีดจำกัดแบบพยายามให้ดีที่สุด)

## Slug

- โดยค่าเริ่มต้นได้มาจากชื่อโฟลเดอร์
- scope ของแพ็กเกจต้องตรงกับ handle ของผู้เผยแพร่ ClawHub ทุกประการ handle ของผู้เผยแพร่ใช้ตัวอักษรพิมพ์เล็ก, ตัวเลข, ยัติภังค์, จุด, และขีดล่างได้; ต้องขึ้นต้นและลงท้ายด้วยตัวอักษรพิมพ์เล็กหรือตัวเลข
- slug ของแพ็กเกจต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การจัดเวอร์ชัน + แท็ก

- การเผยแพร่แต่ละครั้งจะสร้างเวอร์ชันใหม่ (semver)
- แท็กเป็นตัวชี้แบบสตริงไปยังเวอร์ชัน; โดยทั่วไปใช้ `latest`

## ใบอนุญาต

- ทักษะทั้งหมดที่เผยแพร่บน ClawHub อยู่ภายใต้ใบอนุญาต `MIT-0`
- ทุกคนสามารถใช้, แก้ไข, และแจกจ่ายทักษะที่เผยแพร่แล้ว รวมถึงเพื่อการค้า
- ไม่จำเป็นต้องให้เครดิต
- อย่าเพิ่มเงื่อนไขใบอนุญาตที่ขัดแย้งกันใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ใบอนุญาตแยกตามทักษะ

## ทักษะแบบชำระเงิน

- ClawHub ไม่รองรับทักษะแบบชำระเงิน, การตั้งราคาแยกตามทักษะ, paywall, หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาการตั้งราคาใน `SKILL.md`; สิ่งนั้นไม่ใช่ส่วนหนึ่งของรูปแบบทักษะและจะไม่ทำให้ทักษะที่เผยแพร่แล้วกลายเป็นแบบชำระเงิน
- หากทักษะของคุณผสานกับบริการภายนอกแบบชำระเงิน ให้บันทึกค่าใช้จ่ายภายนอกและบัญชีที่จำเป็นอย่างชัดเจนในคำแนะนำของทักษะและการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรไม่บังคับ)
