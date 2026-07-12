---
read_when:
    - คุณต้องการเรียกใช้หรือเขียนไฟล์เวิร์กโฟลว์ .prose
    - คุณต้องการเปิดใช้งาน Plugin OpenProse
    - คุณต้องเข้าใจว่า OpenProse จับคู่กับองค์ประกอบพื้นฐานของ OpenClaw อย่างไร
sidebarTitle: OpenProse
summary: OpenProse เป็นรูปแบบเวิร์กโฟลว์ที่เน้น Markdown เป็นหลักสำหรับเซสชัน AI แบบหลายเอเจนต์ ใน OpenClaw รูปแบบนี้มาพร้อมกับ Plugin ซึ่งมีคำสั่งแบบทับ `/prose` และชุด Skills
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T16:37:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse เป็นรูปแบบเวิร์กโฟลว์แบบพกพาที่ใช้ Markdown เป็นหลัก สำหรับประสานการทำงานของเซสชัน AI
ใน OpenClaw รูปแบบนี้มาพร้อมในฐานะ Plugin ซึ่งติดตั้งชุด Skills ของ OpenProse
และคำสั่งแบบสแลช `/prose` โปรแกรมจะอยู่ในไฟล์ `.prose` และสามารถ
สร้างเอเจนต์ย่อยหลายตัวพร้อมควบคุมลำดับการทำงานอย่างชัดเจน

<CardGroup cols={3}>
  <Card title="ติดตั้ง" icon="download" href="#install">
    เปิดใช้งาน Plugin OpenProse แล้วรีสตาร์ท Gateway
  </Card>
  <Card title="เรียกใช้โปรแกรม" icon="play" href="#slash-command">
    ใช้ `/prose run` เพื่อเรียกใช้ไฟล์ `.prose` หรือโปรแกรมระยะไกล
  </Card>
  <Card title="เขียนโปรแกรม" icon="pencil" href="#example-parallel-research-and-synthesis">
    สร้างเวิร์กโฟลว์แบบหลายเอเจนต์ที่มีขั้นตอนแบบขนานและตามลำดับ
  </Card>
</CardGroup>

## ติดตั้ง

<Steps>
  <Step title="เปิดใช้งาน Plugin">
    OpenProse รวมมาให้แล้วแต่ปิดใช้งานไว้โดยค่าเริ่มต้น เปิดใช้งานด้วยคำสั่ง:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="รีสตาร์ท Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="ตรวจสอบ">
    ```bash
    openclaw plugins list | grep prose
    ```

    คุณควรเห็นว่า `open-prose` เปิดใช้งานอยู่ ขณะนี้คำสั่ง Skills `/prose`
    พร้อมใช้งานในแชตแล้ว

  </Step>
</Steps>

จากสำเนาที่เช็กเอาต์ของรีโพซิทอรี คุณสามารถติดตั้ง Plugin ได้โดยตรง:
`openclaw plugins install ./extensions/open-prose`

## คำสั่งแบบสแลช

OpenProse ลงทะเบียน `/prose` เป็นคำสั่ง Skills ที่ผู้ใช้เรียกใช้งานได้:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` จะถูกแปลงเป็น `https://p.prose.md/<handle>/<slug>`
URL โดยตรงจะถูกดึงมาโดยไม่มีการเปลี่ยนแปลงด้วยเครื่องมือ `web_fetch`

การเรียกใช้โปรแกรมระยะไกลในระดับบนสุดต้องระบุอย่างชัดเจน ส่วนการนำเข้าระยะไกลภายในโปรแกรม `.prose`
เป็นการขึ้นต่อกันของโค้ดแบบส่งต่อ: ก่อนที่ OpenProse จะดึงเป้าหมาย `use` ระยะไกลใด ๆ
ระบบจะแสดงรายการนำเข้าที่แปลงแล้วและกำหนดให้ผู้ควบคุมตอบว่า
`approve remote prose imports` ตรงตามนี้ทุกประการสำหรับการเรียกใช้ครั้งนั้น

## ความสามารถ

- การวิจัยและสังเคราะห์ผลแบบหลายเอเจนต์ พร้อมการทำงานแบบขนานที่กำหนดไว้อย่างชัดเจน
- เวิร์กโฟลว์ที่ทำซ้ำได้และปลอดภัยด้วยการอนุมัติ (การตรวจสอบโค้ด การคัดแยกเหตุการณ์ และไปป์ไลน์เนื้อหา)
- โปรแกรม `.prose` ที่นำกลับมาใช้ซ้ำได้และเรียกใช้ข้ามรันไทม์เอเจนต์ที่รองรับ

## ตัวอย่าง: การวิจัยและสังเคราะห์ผลแบบขนาน

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
  context: { findings, draft }
```

## การเชื่อมโยงกับรันไทม์ OpenClaw

โปรแกรม OpenProse เชื่อมโยงกับองค์ประกอบพื้นฐานของ OpenClaw ดังนี้:

| แนวคิดของ OpenProse       | เครื่องมือ OpenClaw                                |
| ------------------------- | ----------------------------------------------- |
| สร้างเซสชัน / เครื่องมือ Task | `sessions_spawn`                                |
| อ่าน / เขียนไฟล์          | `read` / `write`                                |
| ดึงข้อมูลจากเว็บ           | `web_fetch` (`exec` + curl เมื่อต้องใช้ POST) |

<Warning>
  หากรายการเครื่องมือที่อนุญาตของคุณบล็อก `sessions_spawn`, `read`, `write` หรือ
  `web_fetch` โปรแกรม OpenProse จะทำงานล้มเหลว โปรดตรวจสอบ
  [การกำหนดค่ารายการเครื่องมือที่อนุญาต](/th/gateway/config-tools)
</Warning>

## ตำแหน่งไฟล์

OpenProse เก็บสถานะไว้ภายใต้ `.prose/` ในพื้นที่ทำงานของคุณ:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

เอเจนต์ถาวรระดับผู้ใช้ (ใช้ร่วมกันระหว่างโปรเจกต์) อยู่ที่:

```text
~/.prose/agents/
```

## แบ็กเอนด์สถานะ

<AccordionGroup>
  <Accordion title="ระบบไฟล์ (ค่าเริ่มต้น)">
    สถานะจะถูกเขียนไปยัง `.prose/runs/...` ในพื้นที่ทำงาน โดยไม่ต้องใช้
    ส่วนประกอบที่ต้องพึ่งพาเพิ่มเติม
  </Accordion>
  <Accordion title="ในบริบท">
    เก็บสถานะชั่วคราวไว้ในหน้าต่างบริบท โดยเลือกด้วย `--in-context`
    เหมาะสำหรับโปรแกรมขนาดเล็กที่ทำงานในระยะเวลาสั้น
  </Accordion>
  <Accordion title="sqlite (ทดลอง)">
    เลือกด้วย `--state=sqlite` ต้องมีไบนารี `sqlite3` อยู่ใน `PATH`
    (จะกลับไปใช้ระบบไฟล์เมื่อไม่พบ) โดยสถานะจะอยู่ใน
    `.prose/runs/{id}/state.db`
  </Accordion>
  <Accordion title="postgres (ทดลอง)">
    เลือกด้วย `--state=postgres` ต้องมี `psql` และสตริงการเชื่อมต่อใน
    `OPENPROSE_POSTGRES_URL` (ตั้งค่าใน `.prose/.env`)

    <Warning>
      ข้อมูลประจำตัว Postgres จะถูกส่งไปยังบันทึกของเอเจนต์ย่อย ใช้ฐานข้อมูลเฉพาะ
      ที่มีสิทธิ์เท่าที่จำเป็นเท่านั้น
    </Warning>

  </Accordion>
</AccordionGroup>

## ความปลอดภัย

ปฏิบัติต่อไฟล์ `.prose` เสมือนเป็นโค้ด ตรวจสอบไฟล์ก่อนเรียกใช้ รวมถึง
การนำเข้า `use` ระยะไกล คำขอ `/prose run https://...` ระดับบนสุดต้องระบุอย่างชัดเจน แต่
การนำเข้าระยะไกลแบบส่งต่อต้องได้รับการอนุมัติสำหรับการเรียกใช้แต่ละครั้งก่อนที่จะถูกดึงหรือ
ดำเนินการ ใช้รายการเครื่องมือที่อนุญาตและด่านอนุมัติของ OpenClaw เพื่อควบคุม
ผลกระทบข้างเคียง สำหรับเวิร์กโฟลว์ที่ให้ผลลัพธ์แน่นอนและควบคุมด้วยการอนุมัติ โปรดเปรียบเทียบกับ
[Lobster](/th/tools/lobster)

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ข้อมูลอ้างอิง Skills" href="/th/tools/skills" icon="puzzle-piece">
    วิธีโหลดชุด Skills ของ OpenProse และด่านควบคุมที่ใช้
  </Card>
  <Card title="เอเจนต์ย่อย" href="/th/tools/subagents" icon="users">
    เลเยอร์ประสานงานแบบหลายเอเจนต์ที่มีมาให้ใน OpenClaw
  </Card>
  <Card title="การแปลงข้อความเป็นเสียงพูด" href="/th/tools/tts" icon="volume-high">
    เพิ่มเอาต์พุตเสียงให้กับเวิร์กโฟลว์ของคุณ
  </Card>
  <Card title="คำสั่งแบบสแลช" href="/th/tools/slash-commands" icon="terminal">
    คำสั่งแชตทั้งหมดที่พร้อมใช้งาน รวมถึง /prose
  </Card>
</CardGroup>

เว็บไซต์อย่างเป็นทางการ: [https://www.prose.md](https://www.prose.md)
