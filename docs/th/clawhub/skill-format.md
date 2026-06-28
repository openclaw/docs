---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่
summary: รูปแบบโฟลเดอร์ Skills, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด
x-i18n:
    generated_at: "2026-06-28T07:42:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# รูปแบบทักษะ

## บนดิสก์

ทักษะคือโฟลเดอร์หนึ่ง

จำเป็น:

- `SKILL.md` (หรือ `skill.md`; ยอมรับ `skills.md` แบบเดิมด้วย)

ไม่บังคับ:

- ไฟล์สนับสนุนแบบ_อิงข้อความ_ใด ๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (รูปแบบการละเว้นสำหรับการเผยแพร่, `.clawdhubignore` แบบเดิม)
- `.gitignore` (รองรับด้วยเช่นกัน)

## การนำเข้าจาก GitHub

ตัวนำเข้า GitHub บนเว็บเข้มงวดกว่าการ publish/sync ในเครื่อง โดยจะค้นพบเฉพาะไฟล์
`SKILL.md` หรือ `skills.md` แบบเดิมในคลังสาธารณะที่ไม่ใช่ fork และเป็นของ
บัญชี GitHub ที่ลงชื่อเข้าใช้เท่านั้น ไม่ได้นำเข้าคลังส่วนตัว, fork,
คลังที่ถูกเก็บถาวร/ปิดใช้งาน หรือคลังสาธารณะของบุคคลที่สาม

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งใน workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter ที่มีหรือไม่มีก็ได้
- เซิร์ฟเวอร์ดึงเมทาดาทาจาก frontmatter ระหว่างการเผยแพร่
- `description` ใช้เป็นสรุปทักษะใน UI/การค้นหา

## เมทาดาทา Frontmatter

เมทาดาทาของทักษะประกาศไว้ใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ของคุณ ส่วนนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่าทักษะของคุณต้องใช้อะไรในการทำงาน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทา Runtime (`metadata.openclaw`)

ประกาศข้อกำหนด runtime ของทักษะภายใต้ `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่ทักษะจะทำงานได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทารายตัวแปร รวมถึงตัวแปรที่ไม่บังคับซึ่งมี `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่งทักษะของคุณคาดว่าจะมี                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งครบทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอยู่อย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์ config ที่ทักษะของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | env var หลักสำหรับข้อมูลรับรองของทักษะของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` ที่ไม่บังคับ และ `description` ที่ไม่บังคับ ตั้ง `required: false` สำหรับ env var ที่ไม่บังคับ |
| `always`           | `boolean`  | ถ้าเป็น `true` ทักษะจะทำงานอยู่เสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์การเรียกใช้งานของทักษะ                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับทักษะ                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของทักษะ                                                                                                         |
| `os`               | `string[]` | ข้อจำกัด OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependency (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Plugin ของ Nix (ดู README)                                                                                                                |
| `config`           | `object`   | สเปก config ของ Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

ถ้าทักษะของคุณต้องติดตั้ง dependency ให้ประกาศไว้ในอาร์เรย์ `install`:

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

ประกาศตัวแปรสภาพแวดล้อมที่ไม่บังคับภายใต้ `metadata.openclaw.envVars` และตั้ง `required: false` อย่าเพิ่มรายการที่ไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่าทักษะไม่สามารถทำงานได้หากไม่มีรายการเหล่านั้น

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

การวิเคราะห์ความปลอดภัยของ ClawHub ตรวจสอบว่าสิ่งที่ทักษะของคุณประกาศตรงกับสิ่งที่ทักษะทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ภายใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะระบุว่าเมทาดาทาไม่ตรงกัน การรักษาให้การประกาศถูกต้องช่วยให้ทักษะของคุณผ่านการรีวิว และช่วยให้ผู้ใช้เข้าใจว่าพวกเขากำลังติดตั้งอะไร

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

publish ยอมรับเฉพาะไฟล์แบบ “อิงข้อความ” เท่านั้น

- allowlist ของนามสกุลอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด; ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ได้รับการยอมรับเป็นข้อความ
- ประเภทเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือเป็นข้อความ พร้อม allowlist ขนาดเล็กเพิ่มเติม (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาด bundle รวม: 50MB
- ข้อความสำหรับ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` ได้สูงสุดประมาณ 40 ไฟล์ (จำกัดแบบพยายามอย่างดีที่สุด)

## Slugs

- โดยค่าเริ่มต้น สร้างจากชื่อโฟลเดอร์
- scope ของแพ็กเกจต้องตรงกับ handle ผู้เผยแพร่ ClawHub ทุกประการ handle ผู้เผยแพร่ใช้ตัวอักษรพิมพ์เล็ก, ตัวเลข, ขีดกลาง, จุด และขีดล่างได้ และต้องขึ้นต้นและลงท้ายด้วยตัวอักษรพิมพ์เล็กหรือตัวเลข
- slug ของแพ็กเกจต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การกำหนดเวอร์ชัน + แท็ก

- การเผยแพร่แต่ละครั้งสร้างเวอร์ชันใหม่ (semver)
- แท็กคือ pointer แบบสตริงไปยังเวอร์ชัน; มักใช้ `latest`

## ใบอนุญาต

- ทักษะทั้งหมดที่เผยแพร่บน ClawHub อยู่ภายใต้ใบอนุญาต `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และแจกจ่ายทักษะที่เผยแพร่แล้วต่อได้ รวมถึงเพื่อการค้า
- ไม่จำเป็นต้องระบุแหล่งที่มา
- อย่าเพิ่มเงื่อนไขใบอนุญาตที่ขัดแย้งใน `SKILL.md`; ClawHub ไม่รองรับการ override ใบอนุญาตรายทักษะ

## ทักษะแบบชำระเงิน

- ClawHub ไม่รองรับทักษะแบบชำระเงิน การกำหนดราคารายทักษะ paywall หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาใน `SKILL.md`; นั่นไม่ใช่ส่วนหนึ่งของรูปแบบทักษะ และจะไม่ทำให้ทักษะที่เผยแพร่แล้วเป็นทักษะแบบชำระเงิน
- หากทักษะของคุณผสานรวมกับบริการบุคคลที่สามแบบชำระเงิน ให้ระบุค่าใช้จ่ายภายนอกและบัญชีที่ต้องใช้ให้ชัดเจนในคำแนะนำของทักษะและการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรที่ไม่บังคับ)
