---
read_when:
    - คุณต้องอธิบาย workspace ของ agent หรือโครงสร้างไฟล์ของมัน
    - คุณต้องการสำรองข้อมูลหรือย้ายพื้นที่ทำงานของเอเจนต์
sidebarTitle: Agent workspace
summary: 'พื้นที่ทำงานของเอเจนต์: ตำแหน่ง เค้าโครง และกลยุทธ์การสำรองข้อมูล'
title: พื้นที่ทำงานของเอเจนต์
x-i18n:
    generated_at: "2026-06-27T17:25:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

เวิร์กสเปซคือบ้านของเอเจนต์ เป็นไดเรกทอรีทำงานเดียวที่ใช้สำหรับเครื่องมือไฟล์และบริบทเวิร์กสเปซ เก็บไว้เป็นส่วนตัวและปฏิบัติต่อมันเหมือนเป็นหน่วยความจำ

สิ่งนี้แยกจาก `~/.openclaw/` ซึ่งใช้เก็บการกำหนดค่า ข้อมูลประจำตัว และเซสชัน

<Warning>
เวิร์กสเปซคือ **cwd เริ่มต้น** ไม่ใช่ sandbox แบบแข็ง เครื่องมือจะ resolve พาธแบบสัมพัทธ์เทียบกับเวิร์กสเปซ แต่พาธแบบสัมบูรณ์ยังสามารถเข้าถึงตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกส่วน ให้ใช้ [`agents.defaults.sandbox`](/th/gateway/sandboxing) (และ/หรือการกำหนดค่า sandbox รายเอเจนต์)

เมื่อเปิดใช้ sandboxing และ `workspaceAccess` ไม่ใช่ `"rw"` เครื่องมือจะทำงานภายในเวิร์กสเปซ sandbox ใต้ `~/.openclaw/sandboxes` ไม่ใช่เวิร์กสเปซบนโฮสต์ของคุณ
</Warning>

## ตำแหน่งเริ่มต้น

- ค่าเริ่มต้น: `~/.openclaw/workspace`
- หากตั้งค่า `OPENCLAW_PROFILE` และไม่ใช่ `"default"` ค่าเริ่มต้นจะกลายเป็น `~/.openclaw/workspace-<profile>`
- override ใน `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` หรือ `openclaw setup` จะสร้างเวิร์กสเปซและเติมไฟล์ bootstrap หากยังไม่มี

<Note>
การคัดลอก seed ของ sandbox รับเฉพาะไฟล์ปกติภายในเวิร์กสเปซเท่านั้น alias แบบ symlink/hardlink ที่ resolve ออกนอกเวิร์กสเปซต้นทางจะถูกละเว้น
</Note>

หากคุณจัดการไฟล์เวิร์กสเปซเองอยู่แล้ว คุณสามารถปิดการสร้างไฟล์ bootstrap ได้:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## โฟลเดอร์เวิร์กสเปซเพิ่มเติม

การติดตั้งรุ่นเก่าอาจสร้าง `~/openclaw` ไว้ การเก็บไดเรกทอรีเวิร์กสเปซหลายชุดไว้พร้อมกันอาจทำให้ auth หรือ state drift สับสนได้ เพราะมีเวิร์กสเปซที่ใช้งานอยู่ได้ครั้งละหนึ่งชุดเท่านั้น

<Note>
**คำแนะนำ:** เก็บเวิร์กสเปซที่ใช้งานอยู่เพียงชุดเดียว หากคุณไม่ใช้โฟลเดอร์เพิ่มเติมแล้ว ให้ archive หรือย้ายไป Trash (เช่น `trash ~/openclaw`) หากคุณตั้งใจเก็บหลายเวิร์กสเปซ ให้ตรวจสอบว่า `agents.defaults.workspace` ชี้ไปยังชุดที่ใช้งานอยู่

`openclaw doctor` จะแจ้งเตือนเมื่อตรวจพบไดเรกทอรีเวิร์กสเปซเพิ่มเติม
</Note>

## แผนผังไฟล์เวิร์กสเปซ

ไฟล์เหล่านี้คือไฟล์มาตรฐานที่ OpenClaw คาดว่าจะอยู่ภายในเวิร์กสเปซ:

<AccordionGroup>
  <Accordion title="AGENTS.md - คำสั่งการทำงาน">
    คำสั่งการทำงานสำหรับเอเจนต์และวิธีที่ควรใช้หน่วยความจำ โหลดเมื่อเริ่มทุกเซสชัน เหมาะสำหรับกฎ ลำดับความสำคัญ และรายละเอียด "วิธีปฏิบัติตัว"
  </Accordion>
  <Accordion title="SOUL.md - บุคลิกและน้ำเสียง">
    บุคลิก น้ำเสียง และขอบเขต โหลดทุกเซสชัน คู่มือ: [คู่มือบุคลิก SOUL.md](/th/concepts/soul)
  </Accordion>
  <Accordion title="USER.md - ผู้ใช้คือใคร">
    ผู้ใช้คือใครและควรเรียกผู้ใช้อย่างไร โหลดทุกเซสชัน
  </Accordion>
  <Accordion title="IDENTITY.md - ชื่อ สไตล์ อีโมจิ">
    ชื่อ สไตล์ และอีโมจิของเอเจนต์ สร้าง/อัปเดตระหว่างพิธี bootstrap
  </Accordion>
  <Accordion title="TOOLS.md - แบบแผนเครื่องมือ local">
    หมายเหตุเกี่ยวกับเครื่องมือ local และแบบแผนของคุณ ไม่ได้ควบคุมความพร้อมใช้งานของเครื่องมือ เป็นเพียงคำแนะนำเท่านั้น
  </Accordion>
  <Accordion title="HEARTBEAT.md - เช็กลิสต์ Heartbeat">
    เช็กลิสต์ขนาดเล็กแบบไม่บังคับสำหรับการรัน Heartbeat เขียนให้สั้นเพื่อหลีกเลี่ยงการใช้โทเค็นมากเกินไป
  </Accordion>
  <Accordion title="BOOT.md - เช็กลิสต์เริ่มต้น">
    เช็กลิสต์เริ่มต้นแบบไม่บังคับที่รันอัตโนมัติเมื่อ Gateway restart (เมื่อเปิดใช้ [internal hooks](/th/automation/hooks)) เขียนให้สั้น ใช้เครื่องมือ message สำหรับการส่งออกขาออก
  </Accordion>
  <Accordion title="BOOTSTRAP.md - พิธีรันครั้งแรก">
    พิธีรันครั้งแรกแบบครั้งเดียว สร้างเฉพาะสำหรับเวิร์กสเปซใหม่เอี่ยมเท่านั้น ลบออกหลังพิธีเสร็จสมบูรณ์
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - บันทึกหน่วยความจำรายวัน">
    บันทึกหน่วยความจำรายวัน (หนึ่งไฟล์ต่อวัน) แนะนำให้อ่านวันนี้ + เมื่อวานเมื่อเริ่มเซสชัน
  </Accordion>
  <Accordion title="MEMORY.md - หน่วยความจำระยะยาวที่คัดสรรแล้ว (ไม่บังคับ)">
    หน่วยความจำระยะยาวที่คัดสรรแล้ว: ข้อเท็จจริงที่คงทน การตั้งค่า การตัดสินใจ และสรุปสั้น ๆ เก็บบันทึกรายละเอียดไว้ใน `memory/YYYY-MM-DD.md` เพื่อให้เครื่องมือหน่วยความจำดึงมาใช้ได้ตามต้องการโดยไม่ต้อง inject เข้าไปในทุก prompt โหลด `MEMORY.md` เฉพาะในเซสชันหลักที่เป็นส่วนตัวเท่านั้น (ไม่ใช่บริบทที่แชร์/กลุ่ม) ดู [หน่วยความจำ](/th/concepts/memory) สำหรับ workflow และการ flush หน่วยความจำอัตโนมัติ
  </Accordion>
  <Accordion title="skills/ - Skills ของเวิร์กสเปซ (ไม่บังคับ)">
    Skills เฉพาะเวิร์กสเปซ ตำแหน่ง Skills ที่มีลำดับความสำคัญสูงสุดสำหรับเวิร์กสเปซนั้น override Skills ของเอเจนต์ในโปรเจกต์, Skills ของเอเจนต์ส่วนตัว, Skills ที่จัดการแล้ว, Skills ที่ bundled มา และ `skills.load.extraDirs` เมื่อชื่อซ้ำกัน
  </Accordion>
  <Accordion title="canvas/ - ไฟล์ Canvas UI (ไม่บังคับ)">
    ไฟล์ Canvas UI สำหรับการแสดงผล node (เช่น `canvas/index.html`)
  </Accordion>
</AccordionGroup>

<Note>
หากไฟล์ bootstrap ใดหายไป OpenClaw จะ inject marker "ไฟล์หายไป" เข้าไปในเซสชันและทำงานต่อ ไฟล์ bootstrap ขนาดใหญ่จะถูกตัดทอนเมื่อ inject ปรับขีดจำกัดได้ด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 20000) และ `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) `openclaw setup` สามารถสร้างค่าเริ่มต้นที่หายไปใหม่ได้โดยไม่เขียนทับไฟล์ที่มีอยู่
</Note>

## สิ่งที่ไม่ได้อยู่ในเวิร์กสเปซ

สิ่งเหล่านี้อยู่ใต้ `~/.openclaw/` และไม่ควร commit เข้า repo เวิร์กสเปซ:

- `~/.openclaw/openclaw.json` (การกำหนดค่า)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (โปรไฟล์ auth ของโมเดล: OAuth + API keys)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (บัญชี runtime ของ Codex รายเอเจนต์ การกำหนดค่า Skills, plugins และ native thread state)
- `~/.openclaw/credentials/` (state ของ channel/provider รวมถึงข้อมูล import OAuth legacy)
- `~/.openclaw/agents/<agentId>/sessions/` (transcript ของเซสชัน + metadata)
- `~/.openclaw/skills/` (Skills ที่จัดการแล้ว)

หากคุณต้อง migrate เซสชันหรือการกำหนดค่า ให้คัดลอกแยกต่างหากและเก็บออกจาก version control

## การสำรองข้อมูลด้วย Git (แนะนำ, เป็นส่วนตัว)

ปฏิบัติต่อเวิร์กสเปซเหมือนหน่วยความจำส่วนตัว ใส่ไว้ใน git repo แบบ **private** เพื่อให้มีการสำรองและกู้คืนได้

รันขั้นตอนเหล่านี้บนเครื่องที่ Gateway ทำงานอยู่ (ซึ่งเป็นที่ที่เวิร์กสเปซอยู่)

<Steps>
  <Step title="Initialize repo">
    หากติดตั้ง git ไว้ เวิร์กสเปซใหม่เอี่ยมจะถูก initialize อัตโนมัติ หากเวิร์กสเปซนี้ยังไม่เป็น repo ให้รัน:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="เพิ่ม private remote">
    <Tabs>
      <Tab title="เว็บ UI ของ GitHub">
        1. สร้าง repository แบบ **private** ใหม่บน GitHub
        2. อย่า initialize ด้วย README (เพื่อหลีกเลี่ยง merge conflicts)
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
      <Tab title="เว็บ UI ของ GitLab">
        1. สร้าง repository แบบ **private** ใหม่บน GitLab
        2. อย่า initialize ด้วย README (เพื่อหลีกเลี่ยง merge conflicts)
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

## อย่า commit ความลับ

<Warning>
แม้อยู่ใน repo แบบ private ให้หลีกเลี่ยงการเก็บความลับไว้ในเวิร์กสเปซ:

- API keys, OAuth tokens, รหัสผ่าน หรือข้อมูลประจำตัวส่วนตัว
- สิ่งใดก็ตามใต้ `~/.openclaw/`
- raw dumps ของแชตหรือไฟล์แนบที่ละเอียดอ่อน

หากคุณจำเป็นต้องเก็บข้อมูลอ้างอิงที่ละเอียดอ่อน ให้ใช้ placeholder และเก็บความลับจริงไว้ที่อื่น (password manager, environment variables หรือ `~/.openclaw/`)
</Warning>

ตัวเริ่มต้น `.gitignore` ที่แนะนำ:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## การย้ายเวิร์กสเปซไปยังเครื่องใหม่

<Steps>
  <Step title="Clone repo">
    Clone repo ไปยังพาธที่ต้องการ (ค่าเริ่มต้น `~/.openclaw/workspace`)
  </Step>
  <Step title="อัปเดตการกำหนดค่า">
    ตั้งค่า `agents.defaults.workspace` เป็นพาธนั้นใน `~/.openclaw/openclaw.json`
  </Step>
  <Step title="Seed ไฟล์ที่หายไป">
    รัน `openclaw setup --workspace <path>` เพื่อ seed ไฟล์ใด ๆ ที่หายไป
  </Step>
  <Step title="คัดลอกเซสชัน (ไม่บังคับ)">
    หากคุณต้องการเซสชัน ให้คัดลอก `~/.openclaw/agents/<agentId>/sessions/` จากเครื่องเก่าแยกต่างหาก
  </Step>
</Steps>

## หมายเหตุขั้นสูง

- การกำหนดเส้นทางแบบหลายเอเจนต์สามารถใช้เวิร์กสเปซต่างกันต่อเอเจนต์ได้ ดู [การกำหนดเส้นทาง channel](/th/channels/channel-routing) สำหรับการกำหนดค่า routing
- หากเปิดใช้ `agents.defaults.sandbox` เซสชันที่ไม่ใช่ main สามารถใช้เวิร์กสเปซ sandbox รายเซสชันใต้ `agents.defaults.sandbox.workspaceRoot`

## ที่เกี่ยวข้อง

- [Heartbeat](/th/gateway/heartbeat) - ไฟล์เวิร์กสเปซ HEARTBEAT.md
- [Sandboxing](/th/gateway/sandboxing) - การเข้าถึงเวิร์กสเปซในสภาพแวดล้อมแบบ sandbox
- [เซสชัน](/th/concepts/session) - พาธจัดเก็บเซสชัน
- [Standing orders](/th/automation/standing-orders) - คำสั่งถาวรในไฟล์เวิร์กสเปซ
