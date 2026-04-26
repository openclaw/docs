---
read_when:
    - คุณต้องอธิบายพื้นที่ทำงานของเอเจนต์หรือโครงสร้างไฟล์ของมัน
    - คุณต้องการสำรองหรือย้ายพื้นที่ทำงานของเอเจนต์
sidebarTitle: Agent workspace
summary: 'พื้นที่ทำงานของเอเจนต์: ตำแหน่ง โครงสร้าง และกลยุทธ์การสำรองข้อมูล'
title: พื้นที่ทำงานของเอเจนต์
x-i18n:
    generated_at: "2026-04-26T11:27:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

พื้นที่ทำงานคือบ้านของเอเจนต์ เป็นไดเรกทอรีทำงานเดียวที่ใช้สำหรับเครื่องมือไฟล์และสำหรับบริบทของพื้นที่ทำงาน ควรเก็บให้เป็นส่วนตัวและปฏิบัติต่อมันเสมือนเป็นความทรงจำ

สิ่งนี้แยกจาก `~/.openclaw/` ซึ่งใช้เก็บ config, credentials และ sessions

<Warning>
พื้นที่ทำงานคือ **cwd เริ่มต้น** ไม่ใช่ sandbox แบบตายตัว เครื่องมือจะ resolve พาธแบบ relative เทียบกับพื้นที่ทำงาน แต่พาธแบบ absolute ยังสามารถเข้าถึงตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกออกจากกัน ให้ใช้ [`agents.defaults.sandbox`](/th/gateway/sandboxing) (และ/หรือ config sandbox แยกรายเอเจนต์)

เมื่อเปิดใช้ sandboxing และ `workspaceAccess` ไม่ใช่ `"rw"` เครื่องมือจะทำงานภายในพื้นที่ทำงานแบบ sandbox ใต้ `~/.openclaw/sandboxes` ไม่ใช่พื้นที่ทำงานบนโฮสต์ของคุณ
</Warning>

## ตำแหน่งเริ่มต้น

- ค่าเริ่มต้น: `~/.openclaw/workspace`
- หากมีการตั้งค่า `OPENCLAW_PROFILE` และไม่ใช่ `"default"` ค่าเริ่มต้นจะกลายเป็น `~/.openclaw/workspace-<profile>`
- แทนที่ได้ใน `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` หรือ `openclaw setup` จะสร้างพื้นที่ทำงานและวางไฟล์ bootstrap เริ่มต้นให้ หากไฟล์เหล่านั้นยังไม่มีอยู่

<Note>
การคัดลอก seed ของ sandbox จะยอมรับเฉพาะไฟล์ปกติภายในพื้นที่ทำงานเท่านั้น; alias แบบ symlink/hardlink ที่ resolve ออกไปนอกพื้นที่ทำงานต้นทางจะถูกละเว้น
</Note>

หากคุณจัดการไฟล์ในพื้นที่ทำงานด้วยตัวเองอยู่แล้ว คุณสามารถปิดการสร้างไฟล์ bootstrap ได้:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## โฟลเดอร์พื้นที่ทำงานเพิ่มเติม

การติดตั้งรุ่นเก่าอาจเคยสร้าง `~/openclaw` ไว้ การคงไว้ซึ่งไดเรกทอรีพื้นที่ทำงานหลายแห่งอาจทำให้เกิดความสับสนเรื่อง auth หรือ state drift เพราะมีพื้นที่ทำงานที่ active ได้เพียงแห่งเดียวในแต่ละครั้ง

<Note>
**คำแนะนำ:** ควรมีพื้นที่ทำงานที่ active เพียงแห่งเดียว หากคุณไม่ได้ใช้โฟลเดอร์เพิ่มเติมเหล่านั้นแล้ว ให้เก็บถาวรหรือย้ายไปถังขยะ (เช่น `trash ~/openclaw`) หากคุณตั้งใจเก็บหลายพื้นที่ทำงานไว้ ให้ตรวจสอบว่า `agents.defaults.workspace` ชี้ไปยังพื้นที่ทำงานที่ active อยู่

`openclaw doctor` จะเตือนเมื่อพบไดเรกทอรีพื้นที่ทำงานเพิ่มเติม
</Note>

## แผนผังไฟล์ในพื้นที่ทำงาน

นี่คือไฟล์มาตรฐานที่ OpenClaw คาดว่าจะมีภายในพื้นที่ทำงาน:

<AccordionGroup>
  <Accordion title="AGENTS.md — คำแนะนำการปฏิบัติงาน">
    คำแนะนำการปฏิบัติงานสำหรับเอเจนต์และวิธีที่เอเจนต์ควรใช้ memory โหลดตอนเริ่มต้นของทุก session เหมาะสำหรับใส่กฎ ลำดับความสำคัญ และรายละเอียด “ควรมีพฤติกรรมอย่างไร”
  </Accordion>
  <Accordion title="SOUL.md — บุคลิกและน้ำเสียง">
    บุคลิก น้ำเสียง และขอบเขต โหลดทุก session ดูคู่มือได้ที่ [คู่มือบุคลิก SOUL.md](/th/concepts/soul)
  </Accordion>
  <Accordion title="USER.md — ผู้ใช้คือใคร">
    ผู้ใช้คือใครและควรพูดกับเขาอย่างไร โหลดทุก session
  </Accordion>
  <Accordion title="IDENTITY.md — ชื่อ บรรยากาศ และอีโมจิ">
    ชื่อ บรรยากาศ และอีโมจิของเอเจนต์ สร้าง/อัปเดตระหว่างพิธี bootstrap
  </Accordion>
  <Accordion title="TOOLS.md — ธรรมเนียมการใช้เครื่องมือในเครื่อง">
    บันทึกเกี่ยวกับเครื่องมือในเครื่องและธรรมเนียมของคุณ ไม่ได้ควบคุมความพร้อมใช้งานของเครื่องมือ; ใช้เป็นแนวทางเท่านั้น
  </Accordion>
  <Accordion title="HEARTBEAT.md — เช็กลิสต์ Heartbeat">
    เช็กลิสต์ขนาดเล็กแบบไม่บังคับสำหรับการรัน Heartbeat ควรสั้นเพื่อหลีกเลี่ยงการใช้โทเค็นมากเกินไป
  </Accordion>
  <Accordion title="BOOT.md — เช็กลิสต์เริ่มต้นระบบ">
    เช็กลิสต์เริ่มต้นระบบแบบไม่บังคับที่รันอัตโนมัติเมื่อรีสตาร์ต gateway (เมื่อเปิดใช้ [internal hooks](/th/automation/hooks)) ควรสั้น; ใช้เครื่องมือข้อความสำหรับการส่งข้อความขาออก
  </Accordion>
  <Accordion title="BOOTSTRAP.md — พิธีเริ่มต้นครั้งแรก">
    พิธีเริ่มต้นแบบครั้งเดียว สร้างเฉพาะสำหรับพื้นที่ทำงานใหม่เอี่ยมเท่านั้น ลบออกหลังจากทำพิธีเสร็จแล้ว
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — บันทึกความทรงจำรายวัน">
    บันทึกความทรงจำรายวัน (หนึ่งไฟล์ต่อวัน) แนะนำให้อ่านของวันนี้และเมื่อวานเมื่อเริ่ม session
  </Accordion>
  <Accordion title="MEMORY.md — ความทรงจำระยะยาวที่คัดสรรแล้ว (ไม่บังคับ)">
    ความทรงจำระยะยาวที่คัดสรรแล้ว โหลดเฉพาะใน session หลักแบบส่วนตัวเท่านั้น (ไม่ใช่บริบทร่วม/กลุ่ม) ดู [Memory](/th/concepts/memory) สำหรับเวิร์กโฟลว์และการ flush memory อัตโนมัติ
  </Accordion>
  <Accordion title="skills/ — Skills ของพื้นที่ทำงาน (ไม่บังคับ)">
    Skills เฉพาะพื้นที่ทำงาน เป็นตำแหน่ง Skills ที่มีลำดับความสำคัญสูงสุดสำหรับพื้นที่ทำงานนั้น จะแทนที่ project agent skills, personal agent skills, managed skills, bundled skills และ `skills.load.extraDirs` เมื่อชื่อชนกัน
  </Accordion>
  <Accordion title="canvas/ — ไฟล์ Canvas UI (ไม่บังคับ)">
    ไฟล์ Canvas UI สำหรับการแสดงผลของ Node (เช่น `canvas/index.html`)
  </Accordion>
</AccordionGroup>

<Note>
หากไฟล์ bootstrap ใดหายไป OpenClaw จะแทรกตัวบ่งชี้ “missing file” เข้าไปใน session และทำงานต่อ ไฟล์ bootstrap ขนาดใหญ่จะถูกตัดทอนเมื่อถูกแทรก; ปรับขีดจำกัดได้ด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และ `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) `openclaw setup` สามารถสร้างค่าเริ่มต้นที่หายไปใหม่ได้โดยไม่เขียนทับไฟล์ที่มีอยู่
</Note>

## สิ่งที่ไม่ได้อยู่ในพื้นที่ทำงาน

สิ่งเหล่านี้อยู่ภายใต้ `~/.openclaw/` และไม่ควรถูก commit เข้า repo ของพื้นที่ทำงาน:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (โปรไฟล์ auth ของโมเดล: OAuth + API keys)
- `~/.openclaw/credentials/` (สถานะ channel/provider พร้อมข้อมูลนำเข้า OAuth แบบเดิม)
- `~/.openclaw/agents/<agentId>/sessions/` (session transcripts + metadata)
- `~/.openclaw/skills/` (managed Skills)

หากคุณต้องการย้าย sessions หรือ config ให้คัดลอกแยกต่างหากและเก็บไว้นอก version control

## การสำรองด้วย Git (แนะนำ, แบบส่วนตัว)

ปฏิบัติต่อพื้นที่ทำงานเสมือนเป็นความทรงจำส่วนตัว เก็บไว้ใน repo git แบบ **private** เพื่อให้สำรองและกู้คืนได้

ให้รันขั้นตอนเหล่านี้บนเครื่องที่ Gateway ทำงานอยู่ (นั่นคือที่ที่พื้นที่ทำงานอยู่)

<Steps>
  <Step title="เริ่มต้น repo">
    หากติดตั้ง git ไว้ พื้นที่ทำงานใหม่เอี่ยมจะถูกเริ่มต้นให้อัตโนมัติ หากพื้นที่ทำงานนี้ยังไม่เป็น repo ให้รัน:

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
        1. สร้าง repository ใหม่แบบ **private** บน GitHub
        2. อย่าเริ่มต้นด้วย README (เพื่อหลีกเลี่ยง merge conflicts)
        3. คัดลอก HTTPS remote URL
        4. เพิ่ม remote และ push:

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
        1. สร้าง repository ใหม่แบบ **private** บน GitLab
        2. อย่าเริ่มต้นด้วย README (เพื่อหลีกเลี่ยง merge conflicts)
        3. คัดลอก HTTPS remote URL
        4. เพิ่ม remote และ push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="อัปเดตต่อเนื่อง">
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
แม้จะเป็น repo แบบ private ก็ควรหลีกเลี่ยงการเก็บ secrets ไว้ในพื้นที่ทำงาน:

- API keys, OAuth tokens, passwords หรือ credentials ส่วนตัว
- ทุกอย่างภายใต้ `~/.openclaw/`
- raw dumps ของแชตหรือไฟล์แนบที่มีความละเอียดอ่อน

หากจำเป็นต้องเก็บข้อมูลอ้างอิงที่ละเอียดอ่อน ให้ใช้ placeholders และเก็บ secret จริงไว้ที่อื่น (ตัวจัดการรหัสผ่าน, environment variables หรือ `~/.openclaw/`)
</Warning>

ตัวอย่างเริ่มต้นของ `.gitignore` ที่แนะนำ:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## การย้ายพื้นที่ทำงานไปยังเครื่องใหม่

<Steps>
  <Step title="โคลน repo">
    โคลน repo ไปยังพาธที่ต้องการ (ค่าเริ่มต้น `~/.openclaw/workspace`)
  </Step>
  <Step title="อัปเดต config">
    ตั้งค่า `agents.defaults.workspace` ให้เป็นพาธนั้นใน `~/.openclaw/openclaw.json`
  </Step>
  <Step title="วางไฟล์ที่ขาดหาย">
    รัน `openclaw setup --workspace <path>` เพื่อวางไฟล์ที่ขาดหาย
  </Step>
  <Step title="คัดลอก sessions (ไม่บังคับ)">
    หากคุณต้องการ sessions ให้คัดลอก `~/.openclaw/agents/<agentId>/sessions/` จากเครื่องเก่าแยกต่างหาก
  </Step>
</Steps>

## หมายเหตุขั้นสูง

- การกำหนดเส้นทางหลายเอเจนต์สามารถใช้พื้นที่ทำงานต่างกันสำหรับแต่ละเอเจนต์ได้ ดู [Channel routing](/th/channels/channel-routing) สำหรับการกำหนดค่าการกำหนดเส้นทาง
- หากเปิดใช้ `agents.defaults.sandbox` sessions ที่ไม่ใช่ session หลักอาจใช้พื้นที่ทำงาน sandbox แยกตาม session ภายใต้ `agents.defaults.sandbox.workspaceRoot`

## ที่เกี่ยวข้อง

- [Heartbeat](/th/gateway/heartbeat) — ไฟล์ HEARTBEAT.md ในพื้นที่ทำงาน
- [Sandboxing](/th/gateway/sandboxing) — การเข้าถึงพื้นที่ทำงานในสภาพแวดล้อมแบบ sandbox
- [Session](/th/concepts/session) — พาธที่เก็บ session
- [Standing orders](/th/automation/standing-orders) — คำสั่งถาวรในไฟล์พื้นที่ทำงาน
