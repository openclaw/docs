---
read_when:
    - คุณต้องการเรียกใช้หรือเขียนไฟล์เวิร์กโฟลว์ .prose
    - คุณต้องการเปิดใช้งาน Plugin OpenProse
    - คุณต้องเข้าใจว่า OpenProse จับคู่กับองค์ประกอบพื้นฐานของ OpenClaw อย่างไร
sidebarTitle: OpenProse
summary: OpenProse เป็นรูปแบบเวิร์กโฟลว์ที่ให้ความสำคัญกับ Markdown เป็นหลักสำหรับเซสชัน AI แบบหลายเอเจนต์ ใน OpenClaw จะจัดส่งเป็น Plugin พร้อมคำสั่ง slash `/prose` และแพ็ก Skills
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:10:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse เป็นรูปแบบเวิร์กโฟลว์แบบพกพาที่ให้ Markdown เป็นหลักสำหรับจัดการเซสชัน AI ใน OpenClaw รูปแบบนี้มาพร้อมเป็น Plugin ที่ติดตั้งแพ็ก Skills ของ OpenProse และคำสั่งสแลช `/prose` โปรแกรมอยู่ในไฟล์ `.prose` และสามารถสร้าง sub-agent หลายตัวพร้อมการควบคุมโฟลว์ที่ชัดเจนได้

<CardGroup cols={3}>
  <Card title="Install" icon="download" href="#install">
    เปิดใช้งาน Plugin OpenProse และรีสตาร์ต Gateway
  </Card>
  <Card title="Run a program" icon="play" href="#slash-command">
    ใช้ `/prose run` เพื่อเรียกใช้ไฟล์ `.prose` หรือโปรแกรมระยะไกล
  </Card>
  <Card title="Write programs" icon="pencil" href="#example">
    เขียนเวิร์กโฟลว์แบบหลายเอเจนต์ด้วยขั้นตอนแบบขนานและแบบลำดับ
  </Card>
</CardGroup>

## ติดตั้ง

<Steps>
  <Step title="Enable the plugin">
    Plugin ที่มาพร้อมระบบจะถูกปิดใช้งานโดยค่าเริ่มต้น เปิดใช้งาน OpenProse:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verify">
    ```bash
    openclaw plugins list | grep prose
    ```

    คุณควรเห็นว่า `open-prose` เปิดใช้งานอยู่ ตอนนี้คำสั่ง Skills `/prose`
    พร้อมใช้งานในแชตแล้ว

  </Step>
</Steps>

สำหรับเช็กเอาต์ในเครื่อง: `openclaw plugins install ./path/to/local/open-prose-plugin`

## คำสั่งสแลช

OpenProse ลงทะเบียน `/prose` เป็นคำสั่ง Skills ที่ผู้ใช้เรียกใช้ได้:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` จะแปลงเป็น `https://p.prose.md/<handle>/<slug>` URL โดยตรงจะถูกดึงมาตามที่ระบุโดยใช้เครื่องมือ `web_fetch`

การรันระยะไกลระดับบนสุดเป็นการกระทำที่ชัดเจน การนำเข้าระยะไกลภายในโปรแกรม `.prose` เป็น dependency ของโค้ดแบบส่งต่อ: ก่อนที่ OpenProse จะดึงเป้าหมาย `use` ระยะไกลใดๆ ระบบจะแสดงรายการนำเข้าที่ resolve แล้ว และกำหนดให้ผู้ควบคุมตอบกลับตรงตามนี้เท่านั้น `approve remote prose imports` สำหรับการรันนั้น

## ทำอะไรได้บ้าง

- การวิจัยและสังเคราะห์แบบหลายเอเจนต์พร้อมการทำงานขนานที่ชัดเจน
- เวิร์กโฟลว์ที่ทำซ้ำได้และปลอดภัยด้วยการอนุมัติ เช่น รีวิวโค้ด คัดแยกเหตุการณ์ ไปป์ไลน์เนื้อหา
- โปรแกรม `.prose` ที่นำกลับมาใช้ซ้ำได้และเรียกใช้ข้ามรันไทม์เอเจนต์ที่รองรับ

## ตัวอย่าง: การวิจัยและสังเคราะห์แบบขนาน

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

## การแมปรันไทม์ของ OpenClaw

โปรแกรม OpenProse แมปเข้ากับ primitive ของ OpenClaw:

| แนวคิดของ OpenProse       | เครื่องมือ OpenClaw |
| ------------------------- | ---------------- |
| สร้างเซสชัน / เครื่องมือ Task | `sessions_spawn` |
| อ่าน / เขียนไฟล์         | `read` / `write` |
| ดึงข้อมูลเว็บ                 | `web_fetch`      |

<Warning>
  หาก allowlist ของเครื่องมือบล็อก `sessions_spawn`, `read`, `write` หรือ
  `web_fetch` โปรแกรม OpenProse จะล้มเหลว ตรวจสอบ
  [การกำหนดค่า allowlist ของเครื่องมือ](/th/gateway/config-tools)
</Warning>

## ตำแหน่งไฟล์

OpenProse เก็บสถานะไว้ใต้ `.prose/` ในเวิร์กสเปซของคุณ:

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

เอเจนต์ถาวรระดับผู้ใช้อยู่ที่:

```text
~/.prose/agents/
```

## แบ็กเอนด์สถานะ

<AccordionGroup>
  <Accordion title="filesystem (default)">
    สถานะจะถูกเขียนไปยัง `.prose/runs/...` ในเวิร์กสเปซ ไม่ต้องใช้
    dependency เพิ่มเติม
  </Accordion>
  <Accordion title="in-context">
    สถานะชั่วคราวที่เก็บไว้ในหน้าต่างบริบท เหมาะสำหรับโปรแกรมขนาดเล็กที่มีอายุสั้น
  </Accordion>
  <Accordion title="sqlite (experimental)">
    ต้องมีไบนารี `sqlite3` บน `PATH`
  </Accordion>
  <Accordion title="postgres (experimental)">
    ต้องมี `psql` และสตริงการเชื่อมต่อ

    <Warning>
      ข้อมูลรับรอง Postgres จะไหลเข้าไปในล็อกของ sub-agent ใช้ฐานข้อมูลเฉพาะที่มีสิทธิ์น้อยที่สุด
    </Warning>

  </Accordion>
</AccordionGroup>

## ความปลอดภัย

ปฏิบัติกับไฟล์ `.prose` เหมือนโค้ด รีวิวก่อนรัน รวมถึงการนำเข้า `use` ระยะไกล คำขอ `/prose run https://...` ระดับบนสุดเป็นการกระทำที่ชัดเจน แต่การนำเข้าระยะไกลแบบส่งต่อต้องได้รับการอนุมัติต่อการรันก่อนที่จะถูกดึงหรือดำเนินการ ใช้ allowlist ของเครื่องมือ OpenClaw และด่านอนุมัติเพื่อควบคุมผลข้างเคียง สำหรับเวิร์กโฟลว์ที่กำหนดผลลัพธ์ได้และมีด่านอนุมัติ ให้เปรียบเทียบกับ [Lobster](/th/tools/lobster)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Skills reference" href="/th/tools/skills" icon="puzzle-piece">
    วิธีที่แพ็ก Skills ของ OpenProse โหลด และด่านใดที่มีผลบังคับใช้
  </Card>
  <Card title="Subagents" href="/th/tools/subagents" icon="users">
    เลเยอร์ประสานงานหลายเอเจนต์แบบเนทีฟของ OpenClaw
  </Card>
  <Card title="Text-to-speech" href="/th/tools/tts" icon="volume-high">
    เพิ่มเอาต์พุตเสียงให้กับเวิร์กโฟลว์ของคุณ
  </Card>
  <Card title="Slash commands" href="/th/tools/slash-commands" icon="terminal">
    คำสั่งแชตทั้งหมดที่พร้อมใช้งาน รวมถึง /prose
  </Card>
</CardGroup>

เว็บไซต์ทางการ: [https://www.prose.md](https://www.prose.md)
