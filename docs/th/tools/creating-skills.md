---
read_when:
    - คุณกำลังสร้าง Skill แบบกำหนดเองใหม่
    - คุณต้องการเวิร์กโฟลว์เริ่มต้นแบบรวดเร็วสำหรับ Skills ที่ใช้ SKILL.md เป็นพื้นฐาน
    - คุณต้องการใช้ Skill Workshop เพื่อเสนอ Skills สำหรับให้เอเจนต์ตรวจสอบ
sidebarTitle: Creating skills
summary: สร้าง ทดสอบ และเผยแพร่ Skills สำหรับพื้นที่ทำงานแบบกำหนดเองด้วย SKILL.md สำหรับเอเจนต์ OpenClaw ของคุณ
title: การสร้าง Skills
x-i18n:
    generated_at: "2026-07-12T16:46:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills สอนเอเจนต์ว่าควรใช้เครื่องมืออย่างไรและเมื่อใด แต่ละทักษะเป็นไดเรกทอรี
ที่มีไฟล์ `SKILL.md` พร้อม YAML frontmatter และคำแนะนำแบบ Markdown
OpenClaw โหลดทักษะจากตำแหน่งรากหลายแห่งตาม[ลำดับความสำคัญ](/th/tools/skills#loading-order)ที่กำหนดไว้

## สร้างทักษะแรกของคุณ

<Steps>
  <Step title="สร้างไดเรกทอรีของทักษะ">
    Skills อยู่ในโฟลเดอร์ `skills/` ของเวิร์กสเปซคุณ:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    คุณสามารถจัดกลุ่มทักษะไว้ในโฟลเดอร์ย่อยเพื่อให้เป็นระเบียบได้ โดยชื่อทักษะยังคง
    กำหนดจาก frontmatter ใน `SKILL.md` ไม่ใช่พาธของโฟลเดอร์:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="เขียน SKILL.md">
    frontmatter กำหนดข้อมูลเมตา ส่วนเนื้อหากำหนดคำแนะนำสำหรับเอเจนต์

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    กฎการตั้งชื่อ:
    - ใช้ตัวอักษรพิมพ์เล็ก ตัวเลข และขีดกลางสำหรับ `name`
    - ตั้งชื่อไดเรกทอรีและ `name` ใน frontmatter ให้ตรงกัน
    - `description` จะแสดงต่อเอเจนต์และในผลการค้นหาคำสั่งแบบเครื่องหมายทับ —
      เขียนให้อยู่ในบรรทัดเดียวและมีความยาวไม่เกิน 160 อักขระ

  </Step>

  <Step title="ตรวจสอบว่าโหลดทักษะแล้ว">
    ```bash
    openclaw skills list
    ```

    โดยค่าเริ่มต้น OpenClaw จะเฝ้าติดตามไฟล์ `SKILL.md` ภายใต้ตำแหน่งรากของ Skills หาก
    ปิดตัวเฝ้าติดตามไว้หรือคุณกำลังใช้งานเซสชันเดิมต่อ ให้เริ่มเซสชัน
    ใหม่เพื่อให้เอเจนต์ได้รับรายการที่อัปเดตแล้ว:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="ทดสอบ">
    ```bash
    openclaw agent --message "give me a greeting"
    ```

    หรือเปิดแชตแล้วถามเอเจนต์โดยตรง ใช้ `/skill hello-world` เพื่อ
    เรียกใช้โดยระบุชื่ออย่างชัดเจน

  </Step>
</Steps>

## ข้อมูลอ้างอิง SKILL.md

### ฟิลด์ที่จำเป็น

| ฟิลด์        | คำอธิบาย                                                        |
| ------------- | --------------------------------------------------------------- |
| `name`        | slug ที่ไม่ซ้ำกัน โดยใช้ตัวอักษรพิมพ์เล็ก ตัวเลข และขีดกลาง      |
| `description` | คำอธิบายหนึ่งบรรทัดที่แสดงต่อเอเจนต์และในผลลัพธ์การค้นหา         |

### คีย์ frontmatter ที่ไม่บังคับ

| ฟิลด์                      | ค่าเริ่มต้น | คำอธิบาย                                                                           |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `user-invocable`           | `true`      | เปิดให้ทักษะใช้งานเป็นคำสั่งแบบเครื่องหมายทับสำหรับผู้ใช้                          |
| `disable-model-invocation` | `false`     | ไม่นำทักษะไปใส่ในพรอมต์ระบบของเอเจนต์ (ยังเรียกใช้ผ่าน `/skill` ได้)               |
| `command-dispatch`         | —           | ตั้งเป็น `tool` เพื่อส่งคำสั่งแบบเครื่องหมายทับไปยังเครื่องมือโดยตรง โดยข้ามโมเดล |
| `command-tool`             | —           | ชื่อเครื่องมือที่จะเรียกใช้เมื่อตั้งค่า `command-dispatch: tool`                   |
| `command-arg-mode`         | `raw`       | สำหรับการส่งไปยังเครื่องมือ จะส่งต่อสตริงอาร์กิวเมนต์ดิบไปยังเครื่องมือ            |
| `homepage`                 | —           | URL ที่แสดงเป็น "Website" ใน UI ของ Skills บน macOS                                |

สำหรับฟิลด์เงื่อนไขการเปิดใช้งาน (`requires.bins`, `requires.env` เป็นต้น) โปรดดู
[Skills — เงื่อนไขการเปิดใช้งาน](/th/tools/skills#gating)

### การใช้ `{baseDir}`

อ้างอิงไฟล์ภายในไดเรกทอรีของทักษะโดยไม่ต้องกำหนดพาธตายตัว โดย
เอเจนต์จะแปลง `{baseDir}` เทียบกับไดเรกทอรีของทักษะนั้นเอง:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## การเพิ่มการเปิดใช้งานแบบมีเงื่อนไข

กำหนดเงื่อนไขให้ทักษะโหลดเฉพาะเมื่อมีการอ้างอิงที่จำเป็นพร้อมใช้งาน:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="ตัวเลือกเงื่อนไขการเปิดใช้งาน">
    | คีย์ | คำอธิบาย |
    | --- | --- |
    | `requires.bins` | ไบนารีทั้งหมดต้องมีอยู่ใน `PATH` |
    | `requires.anyBins` | ต้องมีไบนารีอย่างน้อยหนึ่งรายการอยู่ใน `PATH` |
    | `requires.env` | ตัวแปรสภาพแวดล้อมแต่ละรายการต้องมีอยู่ในโปรเซสหรือการกำหนดค่า |
    | `requires.config` | พาธ `openclaw.json` แต่ละรายการต้องมีค่าเป็นจริง |
    | `os` | ตัวกรองแพลตฟอร์ม: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | ตั้งเป็น `true` เพื่อข้ามเงื่อนไขทั้งหมดและรวมทักษะไว้เสมอ |

    ข้อมูลอ้างอิงฉบับเต็ม: [Skills — เงื่อนไขการเปิดใช้งาน](/th/tools/skills#gating)

  </Accordion>
  <Accordion title="ตัวแปรสภาพแวดล้อมและคีย์ API">
    เชื่อมโยงคีย์ API กับรายการทักษะใน `openclaw.json`:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    คีย์จะถูกฉีดเข้าไปในโปรเซสโฮสต์เฉพาะรอบการทำงานนั้นของเอเจนต์เท่านั้น
    คีย์จะไม่ถูกส่งเข้าแซนด์บ็อกซ์ โปรดดู
    [ตัวแปรสภาพแวดล้อมในแซนด์บ็อกซ์](/th/tools/skills-config#sandboxed-skills-and-env-vars)

  </Accordion>
</AccordionGroup>

## เสนอผ่าน Skill Workshop

สำหรับทักษะที่เอเจนต์ร่างขึ้น หรือเมื่อคุณต้องการให้ผู้ดูแลตรวจสอบก่อนนำทักษะ
ไปใช้งานจริง ให้ใช้ข้อเสนอของ [Skill Workshop](/th/tools/skill-workshop) แทนการเขียน
`SKILL.md` โดยตรง

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

ใช้ `--proposal-dir` เมื่อข้อเสนอมีไฟล์สนับสนุน:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

ไดเรกทอรีต้องมี `PROPOSAL.md` อยู่ที่ราก ไฟล์สนับสนุนให้อยู่ภายใต้
`assets/`, `examples/`, `references/`, `scripts/` หรือ `templates/`

หลังการตรวจสอบ:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

โปรดดูวงจรชีวิตข้อเสนอฉบับเต็มที่ [Skill Workshop](/th/tools/skill-workshop)

## การเผยแพร่ไปยัง ClawHub

<Steps>
  <Step title="ตรวจสอบว่า SKILL.md ของคุณครบถ้วน">
    ตรวจสอบว่าได้ตั้งค่า `name`, `description` และฟิลด์เงื่อนไขการเปิดใช้งาน
    `metadata.openclaw` ที่เกี่ยวข้องแล้ว เพิ่ม URL `homepage` หากคุณมีหน้าโครงการ
  </Step>
  <Step title="ติดตั้ง ClawHub CLI แบบสแตนด์อโลนและเข้าสู่ระบบ">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="เผยแพร่">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    เพิ่ม `--version <version>` หรือ `--owner <owner>` เพื่อแทนที่เวอร์ชันที่อนุมาน
    หรือเผยแพร่ภายใต้เจ้าของที่ระบุ โปรดดู
    [ClawHub — การเผยแพร่](/th/clawhub/publishing) และ
    [ClawHub CLI](/th/clawhub/cli) สำหรับขั้นตอนทั้งหมด ขอบเขตของเจ้าของ และคำสั่ง
    บำรุงรักษาอื่น ๆ (`clawhub sync`, `clawhub skill rename`, ...)

  </Step>
</Steps>

## แนวทางปฏิบัติที่ดี

<Tip>
  - **เขียนให้กระชับ** — บอกโมเดลว่า *ต้องทำอะไร* ไม่ใช่ว่าต้องเป็น AI อย่างไร
  - **ให้ความปลอดภัยมาก่อน** — หากทักษะของคุณใช้ `exec` ให้ตรวจสอบว่าพรอมต์ไม่อนุญาต
    ให้ข้อมูลอินพุตที่ไม่น่าเชื่อถือฉีดคำสั่งใด ๆ ได้
  - **ทดสอบในเครื่อง** — ใช้ `openclaw agent --message "..."` ก่อนแบ่งปัน
  - **ใช้ ClawHub** — เลือกดูทักษะจากชุมชนที่ [clawhub.ai](https://clawhub.ai)
    ก่อนสร้างขึ้นใหม่ตั้งแต่ต้น
</Tip>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ข้อมูลอ้างอิง Skills" href="/th/tools/skills" icon="puzzle-piece">
    ลำดับการโหลด เงื่อนไขการเปิดใช้งาน รายการอนุญาต และรูปแบบ SKILL.md
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    คิวข้อเสนอสำหรับทักษะที่เอเจนต์ร่างขึ้น
  </Card>
  <Card title="การกำหนดค่า Skills" href="/th/tools/skills-config" icon="gear">
    สคีมาการกำหนดค่า `skills.*` ฉบับเต็ม
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    เลือกดูและเผยแพร่ทักษะในรีจิสทรีสาธารณะ
  </Card>
  <Card title="การสร้าง Plugin" href="/th/plugins/building-plugins" icon="plug">
    Plugin สามารถจัดส่งทักษะพร้อมกับเครื่องมือที่ทักษะเหล่านั้นจัดทำเอกสารประกอบ
  </Card>
</CardGroup>
