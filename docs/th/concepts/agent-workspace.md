---
read_when:
    - คุณต้องอธิบายพื้นที่ทำงานของเอเจนต์หรือโครงสร้างไฟล์ของพื้นที่ทำงาน
    - คุณต้องการสำรองข้อมูลหรือย้ายพื้นที่ทำงานของเอเจนต์
sidebarTitle: Agent workspace
summary: 'พื้นที่ทำงานของเอเจนต์: ตำแหน่งที่ตั้ง โครงสร้าง และกลยุทธ์การสำรองข้อมูล'
title: พื้นที่ทำงานของเอเจนต์
x-i18n:
    generated_at: "2026-04-30T20:05:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

พื้นที่ทำงานคือบ้านของเอเจนต์ เป็นไดเรกทอรีทำงานเดียวที่ใช้สำหรับเครื่องมือไฟล์และบริบทของพื้นที่ทำงาน เก็บไว้เป็นส่วนตัวและถือว่าเป็นหน่วยความจำ

ส่วนนี้แยกจาก `~/.openclaw/` ซึ่งจัดเก็บการกำหนดค่า ข้อมูลประจำตัว และเซสชัน

<Warning>
พื้นที่ทำงานคือ **cwd เริ่มต้น** ไม่ใช่ sandbox แบบแข็ง เครื่องมือจะแก้ไขพาธสัมพัทธ์โดยอ้างอิงจากพื้นที่ทำงาน แต่พาธแบบสัมบูรณ์ยังสามารถเข้าถึงตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกสภาพแวดล้อม ให้ใช้ [`agents.defaults.sandbox`](/th/gateway/sandboxing) (และ/หรือการกำหนดค่า sandbox รายเอเจนต์)

เมื่อเปิดใช้ sandboxing และ `workspaceAccess` ไม่ใช่ `"rw"` เครื่องมือจะทำงานภายในพื้นที่ทำงาน sandbox ภายใต้ `~/.openclaw/sandboxes` ไม่ใช่พื้นที่ทำงานบนโฮสต์ของคุณ
</Warning>

## ตำแหน่งเริ่มต้น

- ค่าเริ่มต้น: `~/.openclaw/workspace`
- หากตั้งค่า `OPENCLAW_PROFILE` และไม่ใช่ `"default"` ค่าเริ่มต้นจะกลายเป็น `~/.openclaw/workspace-<profile>`
- เขียนทับใน `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` หรือ `openclaw setup` จะสร้างพื้นที่ทำงานและเติมไฟล์บูตสแตรปตั้งต้นหากยังไม่มี

<Note>
สำเนา seed ของ sandbox รับเฉพาะไฟล์ปกติที่อยู่ภายในพื้นที่ทำงานเท่านั้น; alias แบบ symlink/hardlink ที่ชี้ออกไปนอกพื้นที่ทำงานต้นทางจะถูกละเว้น
</Note>

หากคุณจัดการไฟล์พื้นที่ทำงานเองอยู่แล้ว คุณสามารถปิดการสร้างไฟล์บูตสแตรปได้:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## โฟลเดอร์พื้นที่ทำงานเพิ่มเติม

การติดตั้งรุ่นเก่าอาจสร้าง `~/openclaw` ไว้ การเก็บไดเรกทอรีพื้นที่ทำงานหลายชุดไว้อาจทำให้การยืนยันตัวตนหรือสถานะคลาดเคลื่อนจนน่าสับสน เพราะมีพื้นที่ทำงานที่ใช้งานอยู่ได้ครั้งละหนึ่งชุดเท่านั้น

<Note>
**คำแนะนำ:** เก็บพื้นที่ทำงานที่ใช้งานอยู่เพียงชุดเดียว หากคุณไม่ใช้โฟลเดอร์เพิ่มเติมแล้ว ให้เก็บถาวรหรือย้ายไปถังขยะ (เช่น `trash ~/openclaw`) หากคุณตั้งใจเก็บหลายพื้นที่ทำงานไว้ ตรวจสอบให้แน่ใจว่า `agents.defaults.workspace` ชี้ไปยังชุดที่ใช้งานอยู่

`openclaw doctor` จะแจ้งเตือนเมื่อตรวจพบไดเรกทอรีพื้นที่ทำงานเพิ่มเติม
</Note>

## แผนผังไฟล์พื้นที่ทำงาน

ต่อไปนี้คือไฟล์มาตรฐานที่ OpenClaw คาดว่าจะมีอยู่ในพื้นที่ทำงาน:

<AccordionGroup>
  <Accordion title="AGENTS.md — คำสั่งการทำงาน">
    คำสั่งการทำงานสำหรับเอเจนต์และวิธีที่ควรใช้หน่วยความจำ โหลดเมื่อเริ่มทุกเซสชัน เหมาะสำหรับกฎ ลำดับความสำคัญ และรายละเอียด "วิธีปฏิบัติตัว"
  </Accordion>
  <Accordion title="SOUL.md — บุคลิกและน้ำเสียง">
    บุคลิก น้ำเสียง และขอบเขต โหลดทุกเซสชัน คู่มือ: [คู่มือบุคลิกภาพ SOUL.md](/th/concepts/soul)
  </Accordion>
  <Accordion title="USER.md — ผู้ใช้คือใคร">
    ผู้ใช้คือใครและควรเรียกอย่างไร โหลดทุกเซสชัน
  </Accordion>
  <Accordion title="IDENTITY.md — ชื่อ บรรยากาศ อีโมจิ">
    ชื่อ บรรยากาศ และอีโมจิของเอเจนต์ สร้าง/อัปเดตระหว่างพิธีบูตสแตรป
  </Accordion>
  <Accordion title="TOOLS.md — แบบแผนเครื่องมือในเครื่อง">
    หมายเหตุเกี่ยวกับเครื่องมือในเครื่องและแบบแผนของคุณ ไม่ได้ควบคุมความพร้อมใช้งานของเครื่องมือ; เป็นเพียงคำแนะนำ
  </Accordion>
  <Accordion title="HEARTBEAT.md — รายการตรวจสอบ Heartbeat">
    รายการตรวจสอบขนาดเล็กเสริมสำหรับการรัน Heartbeat ทำให้สั้นเพื่อหลีกเลี่ยงการใช้โทเค็นมากเกินไป
  </Accordion>
  <Accordion title="BOOT.md — รายการตรวจสอบการเริ่มต้น">
    รายการตรวจสอบการเริ่มต้นเสริมที่รันอัตโนมัติเมื่อ Gateway รีสตาร์ต (เมื่อเปิดใช้ [internal hooks](/th/automation/hooks)) ทำให้สั้น; ใช้เครื่องมือข้อความสำหรับการส่งออกไปภายนอก
  </Accordion>
  <Accordion title="BOOTSTRAP.md — พิธีการรันครั้งแรก">
    พิธีการรันครั้งแรกแบบครั้งเดียว สร้างเฉพาะสำหรับพื้นที่ทำงานใหม่เท่านั้น ลบออกหลังจากพิธีเสร็จสิ้น
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — บันทึกหน่วยความจำรายวัน">
    บันทึกหน่วยความจำรายวัน (หนึ่งไฟล์ต่อวัน) แนะนำให้อ่านวันนี้ + เมื่อวานเมื่อเริ่มเซสชัน
  </Accordion>
  <Accordion title="MEMORY.md — หน่วยความจำระยะยาวที่คัดสรรแล้ว (ไม่บังคับ)">
    หน่วยความจำระยะยาวที่คัดสรรแล้ว โหลดเฉพาะในเซสชันหลักแบบส่วนตัว (ไม่ใช่บริบทที่แชร์/กลุ่ม) ดู [หน่วยความจำ](/th/concepts/memory) สำหรับเวิร์กโฟลว์และการล้างหน่วยความจำอัตโนมัติ
  </Accordion>
  <Accordion title="skills/ — Skills ของพื้นที่ทำงาน (ไม่บังคับ)">
    Skills เฉพาะพื้นที่ทำงาน ตำแหน่ง Skills ที่มีลำดับความสำคัญสูงสุดสำหรับพื้นที่ทำงานนั้น เขียนทับ Skills ของเอเจนต์โปรเจกต์, Skills ของเอเจนต์ส่วนตัว, Skills ที่จัดการ, Skills ที่มาพร้อมระบบ และ `skills.load.extraDirs` เมื่อชื่อชนกัน
  </Accordion>
  <Accordion title="canvas/ — ไฟล์ UI ของ Canvas (ไม่บังคับ)">
    ไฟล์ UI ของ Canvas สำหรับการแสดงผล Node (เช่น `canvas/index.html`)
  </Accordion>
</AccordionGroup>

<Note>
หากไฟล์บูตสแตรปใดหายไป OpenClaw จะฉีด marker "ไฟล์หาย" เข้าไปในเซสชันและดำเนินการต่อ ไฟล์บูตสแตรปขนาดใหญ่จะถูกตัดทอนเมื่อฉีดเข้าไป; ปรับขีดจำกัดด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และ `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) `openclaw setup` สามารถสร้างค่าเริ่มต้นที่หายไปใหม่ได้โดยไม่เขียนทับไฟล์ที่มีอยู่
</Note>

## สิ่งที่ไม่ได้อยู่ในพื้นที่ทำงาน

รายการเหล่านี้อยู่ภายใต้ `~/.openclaw/` และไม่ควร commit ลง repo พื้นที่ทำงาน:

- `~/.openclaw/openclaw.json` (การกำหนดค่า)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (โปรไฟล์การยืนยันตัวตนของโมเดล: OAuth + API keys)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (บัญชีรันไทม์ Codex รายเอเจนต์ การกำหนดค่า Skills, plugins และสถานะเธรดแบบ native)
- `~/.openclaw/credentials/` (สถานะช่องทาง/ผู้ให้บริการ พร้อมข้อมูลนำเข้า OAuth แบบเดิม)
- `~/.openclaw/agents/<agentId>/sessions/` (ทรานสคริปต์เซสชัน + เมตาดาทา)
- `~/.openclaw/skills/` (Skills ที่จัดการ)

หากคุณต้องการย้ายเซสชันหรือการกำหนดค่า ให้คัดลอกแยกต่างหากและเก็บออกจากระบบควบคุมเวอร์ชัน

## การสำรองข้อมูลด้วย Git (แนะนำ, ส่วนตัว)

ถือว่าพื้นที่ทำงานเป็นหน่วยความจำส่วนตัว ใส่ไว้ใน git repo แบบ **ส่วนตัว** เพื่อให้สำรองข้อมูลและกู้คืนได้

รันขั้นตอนเหล่านี้บนเครื่องที่ Gateway ทำงานอยู่ (ซึ่งเป็นที่อยู่ของพื้นที่ทำงาน)

<Steps>
  <Step title="เริ่มต้น repo">
    หากติดตั้ง git แล้ว พื้นที่ทำงานใหม่เอี่ยมจะถูกเริ่มต้นโดยอัตโนมัติ หากพื้นที่ทำงานนี้ยังไม่เป็น repo ให้รัน:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="เพิ่ม remote ส่วนตัว">
    <Tabs>
      <Tab title="GitHub web UI">
        1. สร้าง repository **ส่วนตัว** ใหม่บน GitHub
        2. อย่าเริ่มต้นด้วย README (เพื่อหลีกเลี่ยง merge conflict)
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
        1. สร้าง repository **ส่วนตัว** ใหม่บน GitLab
        2. อย่าเริ่มต้นด้วย README (เพื่อหลีกเลี่ยง merge conflict)
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
แม้ใน repo ส่วนตัว ให้หลีกเลี่ยงการจัดเก็บ secrets ในพื้นที่ทำงาน:

- API keys, OAuth tokens, passwords หรือข้อมูลประจำตัวส่วนตัว
- ทุกอย่างภายใต้ `~/.openclaw/`
- raw dumps ของแชทหรือไฟล์แนบที่ละเอียดอ่อน

หากคุณจำเป็นต้องจัดเก็บการอ้างอิงที่ละเอียดอ่อน ให้ใช้ placeholders และเก็บ secret จริงไว้ที่อื่น (password manager, environment variables หรือ `~/.openclaw/`)
</Warning>

ค่าเริ่มต้น `.gitignore` ที่แนะนำ:

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
    Clone repo ไปยังพาธที่ต้องการ (ค่าเริ่มต้น `~/.openclaw/workspace`)
  </Step>
  <Step title="อัปเดตการกำหนดค่า">
    ตั้งค่า `agents.defaults.workspace` เป็นพาธนั้นใน `~/.openclaw/openclaw.json`
  </Step>
  <Step title="เติมไฟล์ที่หายไป">
    รัน `openclaw setup --workspace <path>` เพื่อเติมไฟล์ที่หายไป
  </Step>
  <Step title="คัดลอกเซสชัน (ไม่บังคับ)">
    หากคุณต้องการเซสชัน ให้คัดลอก `~/.openclaw/agents/<agentId>/sessions/` จากเครื่องเก่าแยกต่างหาก
  </Step>
</Steps>

## หมายเหตุขั้นสูง

- การกำหนดเส้นทางแบบหลายเอเจนต์สามารถใช้พื้นที่ทำงานต่างกันสำหรับแต่ละเอเจนต์ได้ ดู [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) สำหรับการกำหนดค่าการกำหนดเส้นทาง
- หากเปิดใช้ `agents.defaults.sandbox` เซสชันที่ไม่ใช่หลักสามารถใช้พื้นที่ทำงาน sandbox รายเซสชันภายใต้ `agents.defaults.sandbox.workspaceRoot`

## ที่เกี่ยวข้อง

- [Heartbeat](/th/gateway/heartbeat) — ไฟล์พื้นที่ทำงาน HEARTBEAT.md
- [Sandboxing](/th/gateway/sandboxing) — การเข้าถึงพื้นที่ทำงานในสภาพแวดล้อมที่ใช้ sandbox
- [เซสชัน](/th/concepts/session) — พาธการจัดเก็บเซสชัน
- [คำสั่งถาวร](/th/automation/standing-orders) — คำสั่งแบบคงอยู่ในไฟล์พื้นที่ทำงาน
