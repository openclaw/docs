---
read_when:
    - คุณกำลังสร้างทักษะแบบกำหนดเองใหม่ในพื้นที่ทำงานของคุณ
    - คุณต้องมีเวิร์กโฟลว์เริ่มต้นแบบรวดเร็วสำหรับ Skills ที่อิงตาม SKILL.md
summary: สร้างและทดสอบ Skills ประจำพื้นที่ทำงานแบบกำหนดเองด้วย SKILL.md
title: การสร้าง Skills
x-i18n:
    generated_at: "2026-05-10T19:59:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a468a0b21f4e43542b175b8acb8ad8b19dbbea06ce8e0b97c48206bf88a661c5
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills สอน agent ว่าควรใช้เครื่องมืออย่างไรและเมื่อใด skill แต่ละรายการคือไดเรกทอรี
ที่มีไฟล์ `SKILL.md` พร้อม YAML frontmatter และคำแนะนำแบบ markdown

สำหรับวิธีโหลดและจัดลำดับความสำคัญของ Skills โปรดดู [Skills](/th/tools/skills)

## สร้าง skill แรกของคุณ

<Steps>
  <Step title="สร้างไดเรกทอรีของ skill">
    Skills อยู่ใน workspace ของคุณ สร้างโฟลเดอร์ใหม่:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="เขียน SKILL.md">
    สร้าง `SKILL.md` ภายในไดเรกทอรีนั้น frontmatter จะกำหนด metadata
    และเนื้อหา markdown จะมีคำแนะนำสำหรับ agent

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    ใช้รูปแบบ hyphen-case ด้วยตัวอักษรพิมพ์เล็ก ตัวเลข และยัติภังค์สำหรับ
    `name` ของ skill ให้ชื่อโฟลเดอร์และ `name` ใน frontmatter ตรงกัน

  </Step>

  <Step title="เพิ่มเครื่องมือ (ไม่บังคับ)">
    คุณสามารถกำหนด schema ของเครื่องมือแบบกำหนดเองใน frontmatter หรือสั่งให้ agent
    ใช้เครื่องมือระบบที่มีอยู่ (เช่น `exec` หรือ `browser`) Skills ยังสามารถ
    มากับ plugins พร้อมกับเครื่องมือที่มันจัดทำเอกสารประกอบได้ด้วย

  </Step>

  <Step title="โหลด skill">
    เริ่มเซสชันใหม่เพื่อให้ OpenClaw ตรวจพบ skill:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    ตรวจสอบว่าโหลด skill แล้ว:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="ทดสอบ">
    ส่งข้อความที่ควรกระตุ้น skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    หรือเพียงแค่แชทกับ agent แล้วขอคำทักทาย

  </Step>
</Steps>

## ข้อมูลอ้างอิง metadata ของ skill

YAML frontmatter รองรับฟิลด์เหล่านี้:

| ฟิลด์                               | จำเป็น | คำอธิบาย                                                    |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | ใช่      | ตัวระบุเฉพาะที่ใช้ตัวอักษรพิมพ์เล็ก ตัวเลข และยัติภังค์ |
| `description`                       | ใช่      | คำอธิบายหนึ่งบรรทัดที่แสดงให้ agent เห็น                        |
| `metadata.openclaw.os`              | ไม่       | ตัวกรอง OS (`["darwin"]`, `["linux"]` ฯลฯ)                    |
| `metadata.openclaw.requires.bins`   | ไม่       | ไบนารีที่จำเป็นต้องมีบน PATH                                      |
| `metadata.openclaw.requires.config` | ไม่       | คีย์ config ที่จำเป็น                                           |

## แนวทางปฏิบัติที่ดี

- **กระชับ** — สั่ง model ว่าต้องทำ _อะไร_ ไม่ใช่ว่าต้องเป็น AI อย่างไร
- **ความปลอดภัยมาก่อน** — หาก skill ของคุณใช้ `exec` ให้แน่ใจว่า prompt ไม่อนุญาตให้มีการแทรกคำสั่งโดยอำเภอใจจากอินพุตที่ไม่น่าเชื่อถือ
- **ทดสอบในเครื่อง** — ใช้ `openclaw agent --message "..."` เพื่อทดสอบก่อนแชร์
- **ใช้ ClawHub** — เรียกดูและร่วมเพิ่ม skills ได้ที่ [ClawHub](https://clawhub.ai)

## Skills อยู่ที่ไหน

| ตำแหน่ง                        | ลำดับความสำคัญ | ขอบเขต                 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | สูงสุด    | ต่อ agent             |
| `\<workspace\>/.agents/skills/` | สูง       | agent ต่อ workspace   |
| `~/.agents/skills/`             | ปานกลาง     | โปรไฟล์ agent ที่แชร์  |
| `~/.openclaw/skills/`           | ปานกลาง     | แชร์ (agent ทั้งหมด)   |
| รวมมาในชุด (มาพร้อมกับ OpenClaw) | ต่ำ        | ทั่วทั้งระบบ                |
| `skills.load.extraDirs`         | ต่ำสุด     | โฟลเดอร์ที่แชร์แบบกำหนดเอง |

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง Skills](/th/tools/skills) — กฎการโหลด ลำดับความสำคัญ และการ gating
- [config ของ Skills](/th/tools/skills-config) — schema ของ config `skills.*`
- [ClawHub](/th/clawhub) — registry สาธารณะของ skill
- [การสร้าง Plugins](/th/plugins/building-plugins) — plugins สามารถมาพร้อมกับ skills ได้
