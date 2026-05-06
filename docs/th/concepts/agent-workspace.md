---
read_when:
    - คุณต้องอธิบายพื้นที่ทำงานของเอเจนต์หรือโครงสร้างไฟล์ของพื้นที่นั้น
    - คุณต้องการสำรองข้อมูลหรือย้ายพื้นที่ทำงานของเอเจนต์
sidebarTitle: Agent workspace
summary: 'พื้นที่ทำงานของเอเจนต์: ตำแหน่งที่ตั้ง โครงสร้าง และกลยุทธ์การสำรองข้อมูล'
title: พื้นที่ทำงานของเอเจนต์
x-i18n:
    generated_at: "2026-05-06T09:07:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5c4c55f3cda5dcf6b763f8e59fa926283cee18270a58dbd62593947a55e67c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

พื้นที่ทำงานคือบ้านของเอเจนต์ เป็นไดเรกทอรีทำงานเดียวที่ใช้สำหรับเครื่องมือไฟล์และบริบทของพื้นที่ทำงาน เก็บไว้เป็นส่วนตัวและปฏิบัติต่อมันเหมือนเป็นหน่วยความจำ

สิ่งนี้แยกจาก `~/.openclaw/` ซึ่งเก็บ config, credentials และ sessions

<Warning>
พื้นที่ทำงานคือ **cwd เริ่มต้น** ไม่ใช่แซนด์บ็อกซ์แบบบังคับตายตัว เครื่องมือจะแก้ relative paths โดยอิงจากพื้นที่ทำงาน แต่ absolute paths ยังสามารถเข้าถึงตำแหน่งอื่นบน host ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกใช้งาน ให้ใช้ [`agents.defaults.sandbox`](/th/gateway/sandboxing) (และ/หรือ config แซนด์บ็อกซ์รายเอเจนต์)

เมื่อเปิดใช้ sandboxing และ `workspaceAccess` ไม่ใช่ `"rw"` เครื่องมือจะทำงานภายในพื้นที่ทำงานแบบแซนด์บ็อกซ์ใต้ `~/.openclaw/sandboxes` ไม่ใช่พื้นที่ทำงานบน host ของคุณ
</Warning>

## ตำแหน่งเริ่มต้น

- ค่าเริ่มต้น: `~/.openclaw/workspace`
- หากตั้งค่า `OPENCLAW_PROFILE` และไม่ใช่ `"default"` ค่าเริ่มต้นจะกลายเป็น `~/.openclaw/workspace-<profile>`
- Override ใน `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` หรือ `openclaw setup` จะสร้างพื้นที่ทำงานและเติมไฟล์ bootstrap หากไฟล์เหล่านั้นหายไป

<Note>
สำเนา seed ของแซนด์บ็อกซ์รับเฉพาะไฟล์ปกติที่อยู่ภายในพื้นที่ทำงานเท่านั้น symlink/hardlink alias ที่ resolve ออกไปนอกพื้นที่ทำงานต้นทางจะถูกละเว้น
</Note>

หากคุณจัดการไฟล์พื้นที่ทำงานเองอยู่แล้ว คุณสามารถปิดการสร้างไฟล์ bootstrap ได้:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## โฟลเดอร์พื้นที่ทำงานเพิ่มเติม

การติดตั้งเก่าอาจเคยสร้าง `~/openclaw` ไว้ การเก็บไดเรกทอรีพื้นที่ทำงานไว้หลายแห่งอาจทำให้ auth หรือ state drift สับสนได้ เพราะมีพื้นที่ทำงานที่ active ได้เพียงหนึ่งแห่งในแต่ละครั้ง

<Note>
**คำแนะนำ:** เก็บพื้นที่ทำงานที่ active ไว้เพียงแห่งเดียว หากคุณไม่ใช้โฟลเดอร์เพิ่มเติมแล้ว ให้ archive หรือย้ายไป Trash (เช่น `trash ~/openclaw`) หากคุณตั้งใจเก็บพื้นที่ทำงานหลายแห่งไว้ ให้ตรวจสอบว่า `agents.defaults.workspace` ชี้ไปยังพื้นที่ทำงานที่ active อยู่

`openclaw doctor` จะเตือนเมื่อตรวจพบไดเรกทอรีพื้นที่ทำงานเพิ่มเติม
</Note>

## แผนผังไฟล์พื้นที่ทำงาน

ต่อไปนี้คือไฟล์มาตรฐานที่ OpenClaw คาดว่าจะพบในพื้นที่ทำงาน:

<AccordionGroup>
  <Accordion title="AGENTS.md - คำสั่งการทำงาน">
    คำสั่งการทำงานสำหรับเอเจนต์และวิธีที่ควรใช้หน่วยความจำ โหลดเมื่อเริ่มทุก session เหมาะสำหรับกฎ ลำดับความสำคัญ และรายละเอียด "วิธีปฏิบัติตัว"
  </Accordion>
  <Accordion title="SOUL.md - บุคลิกและน้ำเสียง">
    บุคลิก น้ำเสียง และขอบเขต โหลดทุก session คู่มือ: [คู่มือบุคลิกภาพ SOUL.md](/th/concepts/soul)
  </Accordion>
  <Accordion title="USER.md - ผู้ใช้คือใคร">
    ผู้ใช้คือใครและควรเรียกพวกเขาอย่างไร โหลดทุก session
  </Accordion>
  <Accordion title="IDENTITY.md - ชื่อ vibe และ emoji">
    ชื่อ vibe และ emoji ของเอเจนต์ สร้าง/อัปเดตระหว่างพิธี bootstrap
  </Accordion>
  <Accordion title="TOOLS.md - ข้อตกลงเครื่องมือภายในเครื่อง">
    หมายเหตุเกี่ยวกับเครื่องมือภายในเครื่องและข้อตกลงของคุณ ไม่ได้ควบคุมความพร้อมใช้งานของเครื่องมือ เป็นเพียงคำแนะนำเท่านั้น
  </Accordion>
  <Accordion title="HEARTBEAT.md - checklist ของ heartbeat">
    checklist ขนาดเล็กทางเลือกสำหรับการรัน heartbeat ควรทำให้สั้นเพื่อหลีกเลี่ยงการใช้ token มากเกินไป
  </Accordion>
  <Accordion title="BOOT.md - checklist การเริ่มต้น">
    checklist การเริ่มต้นทางเลือกที่รันอัตโนมัติเมื่อ Gateway restart (เมื่อเปิดใช้ [internal hooks](/th/automation/hooks)) ควรทำให้สั้น ใช้เครื่องมือ message สำหรับการส่งออกไปภายนอก
  </Accordion>
  <Accordion title="BOOTSTRAP.md - พิธีการรันครั้งแรก">
    พิธีการรันครั้งแรกแบบครั้งเดียว สร้างเฉพาะสำหรับพื้นที่ทำงานใหม่เอี่ยมเท่านั้น ลบออกหลังจากพิธีเสร็จสมบูรณ์
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - บันทึกหน่วยความจำรายวัน">
    บันทึกหน่วยความจำรายวัน (หนึ่งไฟล์ต่อวัน) แนะนำให้อ่านวันนี้ + เมื่อวานเมื่อเริ่ม session
  </Accordion>
  <Accordion title="MEMORY.md - หน่วยความจำระยะยาวที่คัดสรรแล้ว (ทางเลือก)">
    หน่วยความจำระยะยาวที่คัดสรรแล้ว โหลดเฉพาะใน session หลักแบบส่วนตัว (ไม่ใช่บริบท shared/group) ดู [Memory](/th/concepts/memory) สำหรับ workflow และการ flush หน่วยความจำอัตโนมัติ
  </Accordion>
  <Accordion title="skills/ - Skills ของพื้นที่ทำงาน (ทางเลือก)">
    Skills เฉพาะพื้นที่ทำงาน ตำแหน่ง skill ที่มีลำดับความสำคัญสูงสุดสำหรับพื้นที่ทำงานนั้น Override Skills ของเอเจนต์โปรเจกต์, Skills ของเอเจนต์ส่วนตัว, Skills ที่จัดการแล้ว, Skills ที่ bundled และ `skills.load.extraDirs` เมื่อชื่อชนกัน
  </Accordion>
  <Accordion title="canvas/ - ไฟล์ Canvas UI (ทางเลือก)">
    ไฟล์ Canvas UI สำหรับการแสดงผล node (เช่น `canvas/index.html`)
  </Accordion>
</AccordionGroup>

<Note>
หากไฟล์ bootstrap ใดหายไป OpenClaw จะแทรก marker "missing file" เข้าไปใน session แล้วทำงานต่อ ไฟล์ bootstrap ขนาดใหญ่จะถูก truncate เมื่อแทรก ปรับขีดจำกัดได้ด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และ `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) `openclaw setup` สามารถสร้างค่าเริ่มต้นที่หายไปใหม่ได้โดยไม่เขียนทับไฟล์ที่มีอยู่
</Note>

## สิ่งที่ไม่ได้อยู่ในพื้นที่ทำงาน

สิ่งเหล่านี้อยู่ใต้ `~/.openclaw/` และไม่ควร commit ไปยัง repo พื้นที่ทำงาน:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (โปรไฟล์ auth ของโมเดล: OAuth + API keys)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (บัญชี runtime, config, Skills, plugins และ native thread state ของ Codex รายเอเจนต์)
- `~/.openclaw/credentials/` (state ของช่องทาง/ผู้ให้บริการ รวมถึงข้อมูลนำเข้า OAuth แบบ legacy)
- `~/.openclaw/agents/<agentId>/sessions/` (transcripts ของ session + metadata)
- `~/.openclaw/skills/` (Skills ที่จัดการแล้ว)

หากคุณต้องย้าย sessions หรือ config ให้คัดลอกแยกต่างหากและเก็บไว้นอก version control

## สำรองด้วย Git (แนะนำ, ส่วนตัว)

ปฏิบัติต่อพื้นที่ทำงานเป็นหน่วยความจำส่วนตัว ใส่ไว้ใน git repo แบบ **private** เพื่อให้มีการสำรองและกู้คืนได้

รันขั้นตอนเหล่านี้บนเครื่องที่ Gateway ทำงานอยู่ (ซึ่งเป็นที่ที่พื้นที่ทำงานอยู่)

<Steps>
  <Step title="เริ่มต้น repo">
    หากติดตั้ง git แล้ว พื้นที่ทำงานใหม่เอี่ยมจะถูก initialize อัตโนมัติ หากพื้นที่ทำงานนี้ยังไม่ใช่ repo ให้รัน:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="เพิ่ม remote แบบ private">
    <Tabs>
      <Tab title="GitHub web UI">
        1. สร้าง repository **private** ใหม่บน GitHub
        2. อย่า initialize ด้วย README (เพื่อหลีกเลี่ยง merge conflicts)
        3. คัดลอก HTTPS remote URL
        4. เพิ่ม remote แล้ว push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. สร้าง repository **private** ใหม่บน GitLab
        2. อย่า initialize ด้วย README (เพื่อหลีกเลี่ยง merge conflicts)
        3. คัดลอก HTTPS remote URL
        4. เพิ่ม remote แล้ว push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="การอัปเดตต่อเนื่อง">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## อย่า commit secrets

<Warning>
แม้ใน repo แบบ private ให้หลีกเลี่ยงการเก็บ secrets ในพื้นที่ทำงาน:

- API keys, OAuth tokens, passwords หรือ credentials ส่วนตัว
- ทุกอย่างใต้ `~/.openclaw/`
- raw dumps ของแชตหรือ attachments ที่ละเอียดอ่อน

หากคุณจำเป็นต้องเก็บ references ที่ละเอียดอ่อน ให้ใช้ placeholders และเก็บ secret จริงไว้ที่อื่น (password manager, environment variables หรือ `~/.openclaw/`)
</Warning>

ตัวอย่างเริ่มต้น `.gitignore` ที่แนะนำ:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## การย้ายพื้นที่ทำงานไปยังเครื่องใหม่

<Steps>
  <Step title="Clone repo">
    Clone repo ไปยัง path ที่ต้องการ (ค่าเริ่มต้น `~/.openclaw/workspace`)
  </Step>
  <Step title="อัปเดต config">
    ตั้งค่า `agents.defaults.workspace` เป็น path นั้นใน `~/.openclaw/openclaw.json`
  </Step>
  <Step title="เติมไฟล์ที่หายไป">
    รัน `openclaw setup --workspace <path>` เพื่อ seed ไฟล์ใดก็ตามที่หายไป
  </Step>
  <Step title="คัดลอก sessions (ทางเลือก)">
    หากคุณต้องการ sessions ให้คัดลอก `~/.openclaw/agents/<agentId>/sessions/` จากเครื่องเก่าแยกต่างหาก
  </Step>
</Steps>

## หมายเหตุขั้นสูง

- การ routing แบบหลายเอเจนต์สามารถใช้พื้นที่ทำงานที่ต่างกันต่อเอเจนต์ได้ ดู [Channel routing](/th/channels/channel-routing) สำหรับ config การ routing
- หากเปิดใช้ `agents.defaults.sandbox` session ที่ไม่ใช่ main สามารถใช้พื้นที่ทำงานแซนด์บ็อกซ์ราย session ใต้ `agents.defaults.sandbox.workspaceRoot`

## ที่เกี่ยวข้อง

- [Heartbeat](/th/gateway/heartbeat) - ไฟล์พื้นที่ทำงาน HEARTBEAT.md
- [Sandboxing](/th/gateway/sandboxing) - การเข้าถึงพื้นที่ทำงานในสภาพแวดล้อมแบบแซนด์บ็อกซ์
- [Session](/th/concepts/session) - paths การจัดเก็บ session
- [Standing orders](/th/automation/standing-orders) - คำสั่งถาวรในไฟล์พื้นที่ทำงาน
