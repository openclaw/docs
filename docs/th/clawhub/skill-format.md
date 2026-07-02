---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่
summary: รูปแบบโฟลเดอร์ Skill, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด.
x-i18n:
    generated_at: "2026-07-02T22:53:12Z"
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

- ไฟล์สนับสนุนใด ๆ ที่เป็น _ข้อความ_ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (แพตเทิร์นละเว้นสำหรับการเผยแพร่, `.clawdhubignore` แบบเดิม)
- `.gitignore` (ใช้ด้วยเช่นกัน)

## การนำเข้าจาก GitHub

ตัวนำเข้า GitHub บนเว็บเข้มงวดกว่าการ publish/sync ภายในเครื่อง โดยจะค้นพบเฉพาะ
ไฟล์ `SKILL.md` หรือ `skills.md` แบบเดิมใน repository สาธารณะซึ่งไม่ใช่ fork ที่เป็นของ
บัญชี GitHub ที่ลงชื่อเข้าใช้เท่านั้น และจะไม่นำเข้า repository ส่วนตัว, fork,
repository ที่ถูก archived/disabled หรือ repository สาธารณะของบุคคลที่สาม

เมทาดาทาการติดตั้งภายในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งใน workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์จะดึงเมทาดาทาจาก frontmatter ระหว่างการเผยแพร่
- `description` ใช้เป็นสรุปของ skill ใน UI/การค้นหา

## เมทาดาทา Frontmatter

เมทาดาทาของ Skill ถูกประกาศใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ของคุณ ข้อมูลนี้บอก registry (และการวิเคราะห์ความปลอดภัย) ว่า skill ของคุณต้องใช้อะไรเพื่อรัน

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: สรุปสั้น ๆ ว่า skill นี้ทำอะไร
version: 1.0.0
---
```

### เมทาดาทา Runtime (`metadata.openclaw`)

ประกาศข้อกำหนด runtime ของ skill ใต้ `metadata.openclaw` (นามแฝง: `metadata.clawdbot`, `metadata.clawdis`)

```yaml
---
name: my-skill
description: จัดการงานผ่าน Todoist API
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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่ skill จะรันได้ ใช้ `envVars` เมื่อคุณต้องการเมทาดาทารายตัวแปร รวมถึงตัวแปรไม่บังคับที่มี `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่ง skill ของคุณคาดหวัง                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | พาธไฟล์ config ที่ skill ของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | env var สำหรับข้อมูลรับรองหลักของ skill ของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้งค่า `required: false` สำหรับ env var ที่ไม่บังคับ |
| `always`           | `boolean`  | ถ้าเป็น `true` skill จะ active เสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์การเรียกใช้ของ skill                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับ skill                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังหน้าแรกหรือเอกสารของ skill                                                                                                         |
| `os`               | `string[]` | ข้อจำกัด OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | สเปกการติดตั้งสำหรับ dependency (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | สเปก Nix plugin (ดู README)                                                                                                                |
| `config`           | `object`   | สเปก config ของ Clawdbot (ดู README)                                                                                                           |

### สเปกการติดตั้ง

ถ้า skill ของคุณต้องติดตั้ง dependency ให้ประกาศในอาร์เรย์ `install`:

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

ประกาศตัวแปรสภาพแวดล้อมไม่บังคับใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่า skill จะรันไม่ได้หากไม่มีรายการเหล่านั้น

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: โทเค็น Todoist API ที่ใช้สำหรับคำขอที่ผ่านการยืนยันตัวตน
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID โปรเจกต์เริ่มต้นแบบไม่บังคับเมื่อผู้ใช้ไม่ได้ระบุ
```

### ทำไมสิ่งนี้จึงสำคัญ

การวิเคราะห์ความปลอดภัยของ ClawHub จะตรวจสอบว่าสิ่งที่ skill ของคุณประกาศตรงกับสิ่งที่ skill ทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะตั้งค่าสถานะว่าเมทาดาทาไม่ตรงกัน การรักษาการประกาศให้ถูกต้องช่วยให้ skill ของคุณผ่านการตรวจสอบ และช่วยให้ผู้ใช้เข้าใจว่ากำลังติดตั้งอะไร

### ตัวอย่าง: frontmatter แบบสมบูรณ์

```yaml
---
name: todoist-cli
description: จัดการงาน โปรเจกต์ และป้ายกำกับของ Todoist จากบรรทัดคำสั่ง
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
        description: โทเค็น Todoist API
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID โปรเจกต์เริ่มต้นแบบไม่บังคับ
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## ไฟล์ที่อนุญาต

publish ยอมรับเฉพาะไฟล์ที่เป็น “ข้อความ” เท่านั้น

- allowlist ของ extension อยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด; ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ถูกยอมรับเป็นข้อความ
- ประเภทเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือเป็นข้อความ; รวมถึง allowlist ขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาด bundle รวม: 50MB
- ข้อความ embedding รวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` สูงสุดประมาณ 40 ไฟล์ (เพดานแบบ best-effort)

## Slug

- ได้มาจากชื่อโฟลเดอร์ตามค่าเริ่มต้น
- ขอบเขต package ต้องตรงกับ handle ผู้เผยแพร่ ClawHub ทุกตัวอักษร handle ผู้เผยแพร่สามารถใช้อักษรตัวพิมพ์เล็ก ตัวเลข ขีดกลาง จุด และขีดล่างได้ และต้องเริ่มและลงท้ายด้วยอักษรตัวพิมพ์เล็กหรือตัวเลข
- slug ของ package ต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การกำหนดเวอร์ชัน + tag

- การ publish แต่ละครั้งจะสร้างเวอร์ชันใหม่ (semver)
- Tag เป็นตัวชี้แบบสตริงไปยังเวอร์ชันหนึ่ง; โดยทั่วไปใช้ `latest`

## ใบอนุญาต

- skills ทั้งหมดที่เผยแพร่บน ClawHub อยู่ภายใต้ใบอนุญาต `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และแจกจ่าย skill ที่เผยแพร่แล้วซ้ำได้ รวมถึงในเชิงพาณิชย์
- ไม่จำเป็นต้องระบุที่มา
- อย่าเพิ่มเงื่อนไขใบอนุญาตที่ขัดแย้งใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ใบอนุญาตแยกราย skill

## Skill แบบชำระเงิน

- ClawHub ไม่รองรับ skill แบบชำระเงิน การตั้งราคาแยกราย skill, paywall หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาใน `SKILL.md`; สิ่งนี้ไม่ใช่ส่วนหนึ่งของรูปแบบ skill และจะไม่ทำให้ skill ที่เผยแพร่กลายเป็นแบบชำระเงิน
- หาก skill ของคุณผสานรวมกับบริการบุคคลที่สามแบบชำระเงิน ให้บันทึกต้นทุนภายนอกและบัญชีที่จำเป็นไว้อย่างชัดเจนในคำแนะนำของ skill และการประกาศ env (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรไม่บังคับ)
