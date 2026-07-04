---
read_when:
    - การเผยแพร่ Skills
    - การดีบักความล้มเหลวในการเผยแพร่
summary: รูปแบบโฟลเดอร์ Skill, ไฟล์ที่จำเป็น, ประเภทไฟล์ที่อนุญาต, ขีดจำกัด
x-i18n:
    generated_at: "2026-07-04T15:39:21Z"
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

- ไฟล์ _แบบข้อความ_ สำหรับสนับสนุนใด ๆ (ดู “ไฟล์ที่อนุญาต”)
- `.clawhubignore` (แพตเทิร์นละเว้นสำหรับการเผยแพร่, `.clawdhubignore` แบบเดิม)
- `.gitignore` (ใช้งานด้วยเช่นกัน)

## การนำเข้าจาก GitHub

ตัวนำเข้า GitHub บนเว็บเข้มงวดกว่าการเผยแพร่/ซิงค์ในเครื่อง โดยจะค้นพบเฉพาะไฟล์
`SKILL.md` หรือไฟล์ `skills.md` แบบเดิมในคลังสาธารณะที่ไม่ใช่ฟอร์กและเป็นของ
บัญชี GitHub ที่ลงชื่อเข้าใช้เท่านั้น โดยจะไม่นำเข้าคลังส่วนตัว ฟอร์ก
คลังที่ถูกเก็บถาวร/ปิดใช้งาน หรือคลังสาธารณะของบุคคลที่สาม

เมทาดาทาการติดตั้งในเครื่อง (เขียนโดย CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` แบบเดิม)

สถานะการติดตั้งใน workdir (เขียนโดย CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)

## `SKILL.md`

- Markdown พร้อม YAML frontmatter แบบไม่บังคับ
- เซิร์ฟเวอร์จะดึงเมทาดาทาจาก frontmatter ระหว่างการเผยแพร่
- `description` ใช้เป็นสรุปทักษะใน UI/การค้นหา

## เมทาดาทา Frontmatter

เมทาดาทาของทักษะประกาศไว้ใน YAML frontmatter ที่ด้านบนของ `SKILL.md` ซึ่งบอกรีจิสทรี (และการวิเคราะห์ความปลอดภัย) ว่าทักษะของคุณต้องมีอะไรจึงจะทำงานได้

### Frontmatter พื้นฐาน

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### เมทาดาทารันไทม์ (`metadata.openclaw`)

ประกาศข้อกำหนดรันไทม์ของทักษะใต้ `metadata.openclaw` (นามแฝง: `metadata.clawdbot`, `metadata.clawdis`)

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

ใช้ `requires.env` สำหรับตัวแปรสภาพแวดล้อมที่ต้องมีอยู่ก่อนที่ทักษะจะทำงานได้ ใช้ `envVars` เมื่อต้องการเมทาดาทาแยกตามตัวแปร รวมถึงตัวแปรแบบไม่บังคับที่มี `required: false`

### อ้างอิงฟิลด์ทั้งหมด

| ฟิลด์              | ประเภท       | คำอธิบาย                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | ตัวแปรสภาพแวดล้อมที่จำเป็นซึ่งทักษะของคุณคาดว่าจะมี                                                                                           |
| `requires.bins`    | `string[]` | ไบนารี CLI ที่ต้องติดตั้งทั้งหมด                                                                                                     |
| `requires.anyBins` | `string[]` | ไบนารี CLI ที่ต้องมีอย่างน้อยหนึ่งรายการ                                                                                                  |
| `requires.config`  | `string[]` | เส้นทางไฟล์คอนฟิกที่ทักษะของคุณอ่าน                                                                                                          |
| `primaryEnv`       | `string`   | ตัวแปรสภาพแวดล้อมข้อมูลรับรองหลักสำหรับทักษะของคุณ                                                                                                  |
| `envVars`          | `array`    | การประกาศตัวแปรสภาพแวดล้อมพร้อม `name`, `required` แบบไม่บังคับ และ `description` แบบไม่บังคับ ตั้งค่า `required: false` สำหรับตัวแปรสภาพแวดล้อมแบบไม่บังคับ |
| `always`           | `boolean`  | หากเป็น `true` ทักษะจะทำงานอยู่เสมอ (ไม่ต้องติดตั้งอย่างชัดเจน)                                                                              |
| `skillKey`         | `string`   | แทนที่คีย์สำหรับเรียกใช้ทักษะ                                                                                                         |
| `emoji`            | `string`   | อีโมจิที่แสดงสำหรับทักษะ                                                                                                                 |
| `homepage`         | `string`   | URL ไปยังโฮมเพจหรือเอกสารของทักษะ                                                                                                         |
| `os`               | `string[]` | ข้อจำกัด OS (เช่น `["macos"]`, `["linux"]`)                                                                                             |
| `install`          | `array`    | ข้อกำหนดการติดตั้งสำหรับการพึ่งพา (ดูด้านล่าง)                                                                                                  |
| `nix`              | `object`   | ข้อกำหนด Plugin ของ Nix (ดู README)                                                                                                                |
| `config`           | `object`   | ข้อกำหนดคอนฟิก Clawdbot (ดู README)                                                                                                           |

### ข้อกำหนดการติดตั้ง

หากทักษะของคุณต้องติดตั้งการพึ่งพา ให้ประกาศไว้ในอาร์เรย์ `install`:

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

ประกาศตัวแปรสภาพแวดล้อมแบบไม่บังคับใต้ `metadata.openclaw.envVars` และตั้งค่า `required: false` อย่าเพิ่มรายการแบบไม่บังคับลงใน `requires.env` เพราะ `requires.env` หมายความว่าทักษะจะทำงานไม่ได้หากไม่มีรายการเหล่านั้น

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

### เหตุผลที่สิ่งนี้สำคัญ

การวิเคราะห์ความปลอดภัยของ ClawHub จะตรวจสอบว่าสิ่งที่ทักษะของคุณประกาศตรงกับสิ่งที่มันทำจริงหรือไม่ หากโค้ดของคุณอ้างอิง `TODOIST_API_KEY` แต่ frontmatter ของคุณไม่ได้ประกาศไว้ใต้ `requires.env`, `primaryEnv` หรือ `envVars` การวิเคราะห์จะระบุว่าเมทาดาทาไม่ตรงกัน การรักษาการประกาศให้ถูกต้องช่วยให้ทักษะของคุณผ่านการตรวจสอบ และช่วยให้ผู้ใช้เข้าใจว่ากำลังติดตั้งอะไร

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

การเผยแพร่จะยอมรับเฉพาะไฟล์ “แบบข้อความ” เท่านั้น

- รายการอนุญาตส่วนขยายอยู่ใน `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`)
- ไฟล์สคริปต์ยังคงถูกสแกนหลังอัปโหลด; ไฟล์ PowerShell `.ps1`, `.psm1` และ `.psd1` ได้รับการยอมรับเป็นข้อความ
- ชนิดเนื้อหาที่ขึ้นต้นด้วย `text/` จะถือเป็นข้อความ; รวมถึงรายการอนุญาตขนาดเล็ก (JSON/YAML/TOML/JS/TS/Markdown/SVG)

ขีดจำกัด (ฝั่งเซิร์ฟเวอร์):

- ขนาดบันเดิลรวม: 50MB
- ข้อความสำหรับฝังรวม `SKILL.md` + ไฟล์ที่ไม่ใช่ `.md` สูงสุดประมาณ 40 ไฟล์ (จำกัดแบบพยายามอย่างดีที่สุด)

## Slugs

- โดยค่าเริ่มต้นจะได้มาจากชื่อโฟลเดอร์
- สโคปแพ็กเกจต้องตรงกับแฮนเดิลผู้เผยแพร่ ClawHub ทุกประการ แฮนเดิลผู้เผยแพร่ใช้ตัวอักษรพิมพ์เล็ก ตัวเลข ขีดกลาง จุด และขีดล่างได้; ต้องขึ้นต้นและลงท้ายด้วยตัวอักษรพิมพ์เล็กหรือตัวเลข
- Slug ของแพ็กเกจต้องเป็นตัวพิมพ์เล็กและปลอดภัยสำหรับ npm เช่น `@example.tools/demo-plugin` หรือ `demo-plugin`

## การกำหนดเวอร์ชัน + แท็ก

- การเผยแพร่แต่ละครั้งจะสร้างเวอร์ชันใหม่ (semver)
- แท็กเป็นตัวชี้แบบสตริงไปยังเวอร์ชัน; มักใช้ `latest`

## ใบอนุญาต

- ทักษะทั้งหมดที่เผยแพร่บน ClawHub ได้รับอนุญาตภายใต้ `MIT-0`
- ทุกคนสามารถใช้ แก้ไข และแจกจ่ายทักษะที่เผยแพร่แล้วได้ รวมถึงเพื่อการค้า
- ไม่จำเป็นต้องให้เครดิต
- อย่าเพิ่มเงื่อนไขใบอนุญาตที่ขัดแย้งใน `SKILL.md`; ClawHub ไม่รองรับการแทนที่ใบอนุญาตรายทักษะ

## ทักษะแบบชำระเงิน

- ClawHub ไม่รองรับทักษะแบบชำระเงิน การกำหนดราคารายทักษะ เพย์วอลล์ หรือการแบ่งรายได้
- อย่าเพิ่มเมทาดาทาราคาลงใน `SKILL.md`; เมทาดาทานี้ไม่ใช่ส่วนหนึ่งของรูปแบบทักษะ และจะไม่ทำให้ทักษะที่เผยแพร่เป็นแบบชำระเงิน
- หากทักษะของคุณผสานรวมกับบริการบุคคลที่สามแบบชำระเงิน ให้บันทึกค่าใช้จ่ายภายนอกและบัญชีที่จำเป็นอย่างชัดเจนในคำแนะนำของทักษะและการประกาศตัวแปรสภาพแวดล้อม (`requires.env` สำหรับตัวแปรที่จำเป็น หรือ `envVars` พร้อม `required: false` สำหรับตัวแปรแบบไม่บังคับ)
