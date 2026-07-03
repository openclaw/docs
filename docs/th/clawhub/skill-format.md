---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่
summary: รูปแบบโฟลเดอร์ Skills, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด
x-i18n:
    generated_at: "2026-07-03T10:03:08Z"
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

จำเป็นต้องมี:

- `SKILL.md` (หรือ `skill.md`; รองรับ `skills.md` แบบเดิมด้วย)

ไม่บังคับ:

- ไฟล์สนับสนุน _แบบข้อความ_ ใดๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบการละเว้นสำหรับการเผยแพร่, แบบเดิมคือ `.clawdhubignore`)
- `.gitignore` (มีผลเช่นกัน)

## การนำเข้าจาก GitHub

ตัวนำเข้าจาก GitHub บนเว็บเข้มงวดกว่าการเผยแพร่/ซิงก์ในเครื่อง โดยจะค้นพบเฉพาะไฟล์
`SKILL.md` หรือ `skills.md` แบบเดิม ในรีโพสาธารณะที่ไม่ใช่ fork และเป็นของ
บัญชี GitHub ที่ลงชื่อเข้าใช้เท่านั้น ไม่ได้นำเข้ารีโพส่วนตัว, fork,
รีโพที่เก็บถาวร/ปิดใช้งานแล้ว หรือรีโพสาธารณะของบุคคลที่สาม

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งใน workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่างเผยแพร่
- `description` ใช้เป็นสรุปของ skill ใน UI/การค้นหา

## เมทาดาทา Frontmatter

เมทาดาทา Skill ประกาศไว้ใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ซึ่งบอก registry (และการวิเคราะห์ความปลอดภัย) ว่า skill ของคุณต้องใช้อะไรในการทำงาน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทารันไทม์ (`metadata.openclaw`)

ประกาศข้อกำหนดรันไทม์ของ skill ภายใต้ `metadata.openclaw` (นามแฝง: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่ skill จะทำงานได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทารายตัวแปร รวมถึงตัวแปรที่ไม่บังคับพร้อม `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่ง skill ของคุณคาดหวัง                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งครบทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์ config ที่ skill ของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | ตัวแปรสภาพแวดล้อมของข้อมูลรับรองหลักสำหรับ skill ของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้งค่า `required: false` สำหรับตัวแปรสภาพแวดล้อมที่ไม่บังคับ |
| `always`           | `boolean`  | ถ้าเป็น `true` skill จะทำงานอยู่เสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | เขียนทับคีย์การเรียกใช้ของ skill                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับ skill                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของ skill                                                                                                         |
| `os`               | `string[]` | ข้อจำกัด OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependency (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Plugin ของ Nix (ดู README)                                                                                                                |
| `config`           | `object`   | สเปก config ของ Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

หาก skill ของคุณต้องติดตั้ง dependency ให้ประกาศไว้ในอาร์เรย์ `install`:

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

ประกาศตัวแปรสภาพแวดล้อมที่ไม่บังคับภายใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการที่ไม่บังคับเข้าไปใน `requires.env` เพราะ `requires.env` หมายความว่า skill จะทำงานไม่ได้หากไม่มีตัวแปรเหล่านั้น

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

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่ skill ของคุณประกาศตรงกับสิ่งที่ skill ทำจริง หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ภายใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะระบุว่าเมทาดาทาไม่ตรงกัน การรักษาประกาศให้ถูกต้องช่วยให้ skill ของคุณผ่านการตรวจสอบ และช่วยให้ผู้ใช้เข้าใจว่ากำลังติดตั้งอะไร

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

การเผยแพร่ยอมรับเฉพาะไฟล์ “แบบข้อความ” เท่านั้น

- รายการนามสกุลที่อนุญาตอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด; ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ได้รับการยอมรับเป็นข้อความ
- ประเภทเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือเป็นข้อความ; รวมถึงรายการอนุญาตขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาดบันเดิลรวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` สูงสุดประมาณ 40 ไฟล์ (ขีดจำกัดแบบพยายามให้ดีที่สุด)

## Slugs

- โดยค่าเริ่มต้นได้มาจากชื่อโฟลเดอร์
- scope ของแพ็กเกจต้องตรงกับ handle ผู้เผยแพร่ของ ClawHub ทุกตัวอักษร handle ผู้เผยแพร่ใช้ตัวอักษรพิมพ์เล็ก ตัวเลข ขีดกลาง จุด และขีดล่างได้; ต้องขึ้นต้นและลงท้ายด้วยตัวอักษรพิมพ์เล็กหรือตัวเลข
- slug ของแพ็กเกจต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การกำหนดเวอร์ชัน + แท็ก

- การเผยแพร่แต่ละครั้งสร้างเวอร์ชันใหม่ (semver)
- แท็กคือพอยน์เตอร์แบบสตริงไปยังเวอร์ชัน; นิยมใช้ `latest`

## ใบอนุญาต

- Skills ทั้งหมดที่เผยแพร่บน ClawHub อยู่ภายใต้ใบอนุญาต `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และเผยแพร่ Skills ที่เผยแพร่แล้วต่อได้ รวมถึงใช้เชิงพาณิชย์
- ไม่จำเป็นต้องให้เครดิต
- อย่าเพิ่มเงื่อนไขใบอนุญาตที่ขัดแย้งใน `SKILL.md`; ClawHub ไม่รองรับการเขียนทับใบอนุญาตราย skill

## Skills แบบชำระเงิน

- ClawHub ไม่รองรับ Skills แบบชำระเงิน การตั้งราคาราย skill paywall หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาใน `SKILL.md`; ไม่ใช่ส่วนหนึ่งของรูปแบบ skill และจะไม่ทำให้ skill ที่เผยแพร่กลายเป็นแบบชำระเงิน
- หาก skill ของคุณผสานกับบริการบุคคลที่สามแบบชำระเงิน ให้บันทึกต้นทุนภายนอกและบัญชีที่จำเป็นไว้อย่างชัดเจนในคำแนะนำของ skill และการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรที่ไม่บังคับ)
