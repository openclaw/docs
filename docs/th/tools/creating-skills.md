---
read_when:
    - คุณกำลังสร้างทักษะแบบกำหนดเองใหม่ในพื้นที่ทำงานของคุณ
    - คุณต้องมีเวิร์กโฟลว์เริ่มต้นอย่างรวดเร็วสำหรับ Skills ที่อิงตาม SKILL.md
summary: สร้างและทดสอบ Skills แบบกำหนดเองสำหรับพื้นที่ทำงานด้วย SKILL.md
title: การสร้าง Skills
x-i18n:
    generated_at: "2026-04-30T10:19:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills สอนเอเจนต์ว่าควรใช้เครื่องมืออย่างไรและเมื่อใด แต่ละทักษะคือไดเรกทอรี
ที่มีไฟล์ `SKILL.md` พร้อม YAML frontmatter และคำแนะนำแบบ markdown

สำหรับวิธีโหลดและจัดลำดับความสำคัญของทักษะ โปรดดู [Skills](/th/tools/skills)

## สร้างทักษะแรกของคุณ

<Steps>
  <Step title="สร้างไดเรกทอรีทักษะ">
    Skills อยู่ในเวิร์กสเปซของคุณ สร้างโฟลเดอร์ใหม่:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="เขียน SKILL.md">
    สร้าง `SKILL.md` ภายในไดเรกทอรีนั้น frontmatter กำหนดเมทาดาทา
    และเนื้อหา markdown มีคำแนะนำสำหรับเอเจนต์

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    ใช้รูปแบบ hyphen-case ด้วยตัวพิมพ์เล็ก ตัวเลข และขีดกลางสำหรับ `name`
    ของทักษะ ให้ชื่อโฟลเดอร์และ `name` ใน frontmatter ตรงกัน

  </Step>

  <Step title="เพิ่มเครื่องมือ (ไม่บังคับ)">
    คุณสามารถกำหนดสคีมาของเครื่องมือแบบกำหนดเองใน frontmatter หรือสั่งให้เอเจนต์
    ใช้เครื่องมือระบบที่มีอยู่ (เช่น `exec` หรือ `browser`) ได้ Skills ยังสามารถ
    จัดส่งอยู่ภายใน plugins ควบคู่กับเครื่องมือที่เอกสารนั้นอธิบายได้ด้วย

  </Step>

  <Step title="โหลดทักษะ">
    เริ่มเซสชันใหม่เพื่อให้ OpenClaw ตรวจพบทักษะ:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    ตรวจสอบว่าโหลดทักษะแล้ว:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="ทดสอบ">
    ส่งข้อความที่ควรทริกเกอร์ทักษะ:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    หรือเพียงแชตกับเอเจนต์และขอคำทักทาย

  </Step>
</Steps>

## อ้างอิงเมทาดาทาของทักษะ

YAML frontmatter รองรับฟิลด์เหล่านี้:

| ฟิลด์                               | จำเป็น | คำอธิบาย                                                    |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | ใช่      | ตัวระบุไม่ซ้ำที่ใช้ตัวพิมพ์เล็ก ตัวเลข และขีดกลาง |
| `description`                       | ใช่      | คำอธิบายบรรทัดเดียวที่แสดงให้เอเจนต์เห็น                        |
| `metadata.openclaw.os`              | ไม่       | ตัวกรอง OS (`["darwin"]`, `["linux"]` เป็นต้น)                    |
| `metadata.openclaw.requires.bins`   | ไม่       | ไบนารีที่จำเป็นบน PATH                                      |
| `metadata.openclaw.requires.config` | ไม่       | คีย์ config ที่จำเป็น                                           |

## แนวทางปฏิบัติที่ดีที่สุด

- **กระชับ** — สั่งโมเดลว่าต้องทำ _อะไร_ ไม่ใช่ว่าต้องเป็น AI อย่างไร
- **ความปลอดภัยมาก่อน** — หากทักษะของคุณใช้ `exec` ให้แน่ใจว่าพรอมป์ไม่เปิดให้มีการแทรกคำสั่งตามอำเภอใจจากอินพุตที่ไม่น่าเชื่อถือ
- **ทดสอบในเครื่อง** — ใช้ `openclaw agent --message "..."` เพื่อทดสอบก่อนแชร์
- **ใช้ ClawHub** — เรียกดูและร่วมส่งทักษะได้ที่ [ClawHub](https://clawhub.ai)

## ตำแหน่งที่เก็บทักษะ

| ตำแหน่ง                        | ลำดับความสำคัญ | ขอบเขต                 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | สูงสุด    | ต่อเอเจนต์             |
| `\<workspace\>/.agents/skills/` | สูง       | เอเจนต์ต่อเวิร์กสเปซ   |
| `~/.agents/skills/`             | ปานกลาง     | โปรไฟล์เอเจนต์ที่ใช้ร่วมกัน  |
| `~/.openclaw/skills/`           | ปานกลาง     | ใช้ร่วมกัน (ทุกเอเจนต์)   |
| ที่มาพร้อมแพ็กเกจ (จัดส่งพร้อม OpenClaw) | ต่ำ        | ทั่วโลก                |
| `skills.load.extraDirs`         | ต่ำสุด     | โฟลเดอร์ที่ใช้ร่วมกันแบบกำหนดเอง |

## ที่เกี่ยวข้อง

- [อ้างอิง Skills](/th/tools/skills) — การโหลด ลำดับความสำคัญ และกฎการ gate
- [การกำหนดค่า Skills](/th/tools/skills-config) — สคีมา config ของ `skills.*`
- [ClawHub](/th/tools/clawhub) — รีจิสทรีทักษะสาธารณะ
- [การสร้าง Plugins](/th/plugins/building-plugins) — plugins สามารถจัดส่งทักษะได้
