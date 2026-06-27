---
read_when:
    - คุณกำลังสร้าง Skills แบบกำหนดเองใหม่
    - คุณต้องมีเวิร์กโฟลว์เริ่มต้นอย่างรวดเร็วสำหรับ Skills ที่อิงตาม SKILL.md
    - คุณต้องการใช้ Skill Workshop เพื่อเสนอทักษะสำหรับการตรวจทานโดยเอเจนต์
sidebarTitle: Creating skills
summary: สร้าง ทดสอบ และเผยแพร่ Skills สำหรับเวิร์กสเปซ `SKILL.md` แบบกำหนดเองให้กับเอเจนต์ OpenClaw ของคุณ
title: การสร้าง Skills
x-i18n:
    generated_at: "2026-06-27T18:26:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills สอนเอเจนต์ว่าจะใช้เครื่องมืออย่างไรและเมื่อใด แต่ละ skill เป็นไดเรกทอรี
ที่มีไฟล์ `SKILL.md` พร้อม YAML frontmatter และคำแนะนำแบบ markdown
OpenClaw โหลด skills จากหลาย root ตาม[ลำดับความสำคัญ](/th/tools/skills#loading-order)ที่กำหนดไว้

## สร้าง skill แรกของคุณ

<Steps>
  <Step title="Create the skill directory">
    Skills อยู่ในโฟลเดอร์ `skills/` ของ workspace ของคุณ สร้างไดเรกทอรีสำหรับ
    skill ใหม่ของคุณ:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    คุณสามารถจัดกลุ่ม skills ในโฟลเดอร์ย่อยเพื่อจัดระเบียบได้ — skill ยังคง
    ถูกตั้งชื่อตาม frontmatter ของ `SKILL.md` ไม่ใช่ path ของโฟลเดอร์:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    สร้าง `SKILL.md` ภายในไดเรกทอรี frontmatter กำหนด metadata;
    body ให้คำแนะนำแก่เอเจนต์

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
    - รักษาชื่อไดเรกทอรีและ `name` ใน frontmatter ให้สอดคล้องกัน
    - `description` จะแสดงให้เอเจนต์เห็นและใน slash-command discovery —
      ให้เป็นบรรทัดเดียวและไม่เกิน 160 อักขระ

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    โดยค่าเริ่มต้น OpenClaw จะเฝ้าดูไฟล์ `SKILL.md` ใต้ skills roots หาก
    watcher ถูกปิดใช้งานหรือคุณกำลังดำเนินการต่อใน session เดิม ให้เริ่ม
    session ใหม่เพื่อให้เอเจนต์ได้รับรายการที่รีเฟรชแล้ว:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    ส่งข้อความที่ควรกระตุ้น skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    หรือเปิด chat แล้วถามเอเจนต์โดยตรง ใช้ `/skill hello-world` เพื่อ
    เรียกใช้อย่างชัดเจนตามชื่อ

  </Step>
</Steps>

## เอกสารอ้างอิง SKILL.md

### ฟิลด์ที่จำเป็น

| ฟิลด์         | คำอธิบาย                                                     |
| ------------- | --------------------------------------------------------------- |
| `name`        | slug ที่ไม่ซ้ำ โดยใช้ตัวอักษรพิมพ์เล็ก ตัวเลข และขีดกลาง        |
| `description` | คำอธิบายบรรทัดเดียวที่แสดงให้เอเจนต์เห็นและในผลลัพธ์ discovery |

### คีย์ frontmatter ที่ไม่บังคับ

| ฟิลด์                      | ค่าเริ่มต้น | คำอธิบาย                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | เปิดเผย skill เป็น slash command สำหรับผู้ใช้                                         |
| `disable-model-invocation` | `false` | ไม่ใส่ skill ใน system prompt ของเอเจนต์ (ยังคงรันผ่าน `/skill`)        |
| `command-dispatch`         | —       | ตั้งเป็น `tool` เพื่อ route slash command ไปยังเครื่องมือโดยตรง โดยข้ามโมเดล |
| `command-tool`             | —       | ชื่อเครื่องมือที่จะเรียกใช้เมื่อมีการตั้งค่า `command-dispatch: tool`                         |
| `command-arg-mode`         | `raw`   | สำหรับ tool dispatch ส่งต่อสตริง args ดิบไปยังเครื่องมือ                      |
| `homepage`                 | —       | URL ที่แสดงเป็น "เว็บไซต์" ใน macOS Skills UI                                    |

สำหรับฟิลด์ gating (`requires.bins`, `requires.env` และอื่นๆ) โปรดดู
[Skills — Gating](/th/tools/skills#gating)

### การใช้ `{baseDir}`

ใช้ `{baseDir}` ใน body ของ skill เพื่ออ้างอิงไฟล์ภายในไดเรกทอรีของ skill
โดยไม่ต้อง hardcode path:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## การเพิ่มการเปิดใช้งานแบบมีเงื่อนไข

ตั้ง gate ให้ skill ของคุณเพื่อให้โหลดเฉพาะเมื่อ dependencies พร้อมใช้งาน:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | คีย์ | คำอธิบาย |
    | --- | --- |
    | `requires.bins` | binary ทั้งหมดต้องมีอยู่บน `PATH` |
    | `requires.anyBins` | ต้องมี binary อย่างน้อยหนึ่งรายการบน `PATH` |
    | `requires.env` | env var แต่ละตัวต้องมีอยู่ใน process หรือ config |
    | `requires.config` | path ของ `openclaw.json` แต่ละรายการต้องเป็น truthy |
    | `os` | ตัวกรอง platform: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | ตั้งเป็น `true` เพื่อข้าม gates ทั้งหมดและรวม skill ไว้เสมอ |

    เอกสารอ้างอิงฉบับเต็ม: [Skills — Gating](/th/tools/skills#gating)

  </Accordion>
  <Accordion title="Environment and API keys">
    เชื่อม API key เข้ากับรายการ skill ใน `openclaw.json`:

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

    key จะถูกฉีดเข้าไปใน host process สำหรับ agent turn นั้นเท่านั้น
    key จะไม่ไปถึง sandbox — โปรดดู
    [sandboxed env vars](/th/tools/skills-config#sandboxed-skills-and-env-vars)

  </Accordion>
</AccordionGroup>

## เสนอผ่าน Skill Workshop

สำหรับ skills ที่เอเจนต์ร่างขึ้น หรือเมื่อคุณต้องการให้ operator review ก่อนที่ skill จะ
ใช้งานจริง ให้ใช้ proposals ของ [Skill Workshop](/th/tools/skill-workshop) แทนการเขียน
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

ใช้ `--proposal-dir` เมื่อ proposal มีไฟล์สนับสนุน:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

ไดเรกทอรีต้องมี `PROPOSAL.md` ไฟล์สนับสนุนสามารถอยู่ใน `assets/`,
`examples/`, `references/`, `scripts/` หรือ `templates/`

หลัง review:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

ดู [Skill Workshop](/th/tools/skill-workshop) สำหรับ lifecycle ของ proposal ฉบับเต็ม

## การเผยแพร่ไปยัง ClawHub

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    ตรวจสอบให้แน่ใจว่าได้ตั้งค่า `name`, `description` และฟิลด์ gating ของ `metadata.openclaw`
    ทั้งหมดแล้ว เพิ่ม URL `homepage` หากคุณมีหน้าโปรเจกต์
  </Step>
  <Step title="Install the ClawHub skill">
    skill ของ ClawHub จัดทำเอกสารรูปแบบคำสั่ง publish ปัจจุบันและ metadata
    ที่จำเป็น:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publish">
    ```bash
    clawhub publish
    ```

    ดู [ClawHub — Publishing](/th/clawhub/publishing) สำหรับ flow ฉบับเต็ม

  </Step>
</Steps>

## แนวปฏิบัติที่ดีที่สุด

<Tip>
  - **กระชับ** — สั่งโมเดลว่าให้ทำ *อะไร* ไม่ใช่ว่าจะเป็น AI อย่างไร
  - **ความปลอดภัยมาก่อน** — หาก skill ของคุณใช้ `exec` ตรวจสอบให้แน่ใจว่า prompts ไม่อนุญาตให้มี
    arbitrary command injection จาก input ที่ไม่น่าเชื่อถือ
  - **ทดสอบในเครื่อง** — ใช้ `openclaw agent --message "..."` ก่อนแชร์
  - **ใช้ ClawHub** — เรียกดู community skills ที่ [clawhub.ai](https://clawhub.ai)
    ก่อนสร้างใหม่ตั้งแต่ต้น
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Skills reference" href="/th/tools/skills" icon="puzzle-piece">
    ลำดับการโหลด, gating, allowlists และรูปแบบ SKILL.md
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    คิว proposal สำหรับ skills ที่เอเจนต์ร่างขึ้น
  </Card>
  <Card title="Skills config" href="/th/tools/skills-config" icon="gear">
    schema config `skills.*` ฉบับเต็ม
  </Card>
  <Card title="ClawHub" href="/th/clawhub" icon="cloud">
    เรียกดูและเผยแพร่ skills บน public registry
  </Card>
  <Card title="Building plugins" href="/th/plugins/building-plugins" icon="plug">
    Plugins สามารถจัดส่ง skills ควบคู่กับเครื่องมือที่เอกสารอธิบายได้
  </Card>
</CardGroup>
