---
read_when:
    - คุณต้องอธิบายพื้นที่ทำงานของเอเจนต์หรือโครงสร้างไฟล์ของพื้นที่นั้น
    - คุณต้องการสำรองข้อมูลหรือย้ายพื้นที่ทำงานของเอเจนต์
sidebarTitle: Agent workspace
summary: 'พื้นที่ทำงานของเอเจนต์: ตำแหน่งที่ตั้ง โครงสร้าง และกลยุทธ์การสำรองข้อมูล'
title: พื้นที่ทำงานของเอเจนต์
x-i18n:
    generated_at: "2026-05-10T19:32:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

พื้นที่ทำงานคือบ้านของเอเจนต์ เป็นไดเรกทอรีทำงานเดียวที่ใช้สำหรับเครื่องมือไฟล์และบริบทพื้นที่ทำงาน เก็บไว้เป็นส่วนตัวและปฏิบัติต่อมันเหมือนหน่วยความจำ

สิ่งนี้แยกจาก `~/.openclaw/` ซึ่งใช้เก็บการกำหนดค่า ข้อมูลประจำตัว และเซสชัน

<Warning>
พื้นที่ทำงานคือ **cwd เริ่มต้น** ไม่ใช่แซนด์บ็อกซ์แบบบังคับ เครื่องมือจะแปลงพาธแบบสัมพัทธ์โดยอิงกับพื้นที่ทำงาน แต่พาธแบบสัมบูรณ์ยังสามารถเข้าถึงที่อื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้แซนด์บ็อกซ์ หากคุณต้องการการแยกสภาพแวดล้อม ให้ใช้ [`agents.defaults.sandbox`](/th/gateway/sandboxing) (และ/หรือการกำหนดค่าแซนด์บ็อกซ์รายเอเจนต์)

เมื่อเปิดใช้แซนด์บ็อกซ์และ `workspaceAccess` ไม่ใช่ `"rw"` เครื่องมือจะทำงานภายในพื้นที่ทำงานแซนด์บ็อกซ์ใต้ `~/.openclaw/sandboxes` ไม่ใช่พื้นที่ทำงานบนโฮสต์ของคุณ
</Warning>

## ตำแหน่งเริ่มต้น

- ค่าเริ่มต้น: `~/.openclaw/workspace`
- หากตั้งค่า `OPENCLAW_PROFILE` และไม่ใช่ `"default"` ค่าเริ่มต้นจะกลายเป็น `~/.openclaw/workspace-<profile>`
- แทนที่ใน `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` หรือ `openclaw setup` จะสร้างพื้นที่ทำงานและใส่ไฟล์บูตสแตรปเริ่มต้นให้ หากไฟล์เหล่านั้นหายไป

<Note>
การคัดลอก seed สำหรับแซนด์บ็อกซ์ยอมรับเฉพาะไฟล์ปกติที่อยู่ในพื้นที่ทำงานเท่านั้น นามแฝงแบบ symlink/hardlink ที่แปลงแล้วชี้ออกนอกพื้นที่ทำงานต้นทางจะถูกละเว้น
</Note>

หากคุณจัดการไฟล์พื้นที่ทำงานด้วยตัวเองอยู่แล้ว คุณสามารถปิดการสร้างไฟล์บูตสแตรปได้:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## โฟลเดอร์พื้นที่ทำงานเพิ่มเติม

การติดตั้งเก่าอาจเคยสร้าง `~/openclaw` ไว้ การเก็บไดเรกทอรีพื้นที่ทำงานหลายชุดไว้อาจทำให้ข้อมูลยืนยันตัวตนหรือสถานะคลาดเคลื่อนจนสับสนได้ เพราะมีพื้นที่ทำงานที่ใช้งานอยู่ได้เพียงชุดเดียวในแต่ละครั้ง

<Note>
**คำแนะนำ:** เก็บพื้นที่ทำงานที่ใช้งานอยู่เพียงชุดเดียว หากคุณไม่ได้ใช้โฟลเดอร์เพิ่มเติมแล้ว ให้เก็บถาวรหรือย้ายไปถังขยะ (เช่น `trash ~/openclaw`) หากคุณตั้งใจเก็บพื้นที่ทำงานหลายชุด ตรวจสอบให้แน่ใจว่า `agents.defaults.workspace` ชี้ไปยังชุดที่ใช้งานอยู่

`openclaw doctor` จะเตือนเมื่อตรวจพบไดเรกทอรีพื้นที่ทำงานเพิ่มเติม
</Note>

## แผนผังไฟล์พื้นที่ทำงาน

ต่อไปนี้คือไฟล์มาตรฐานที่ OpenClaw คาดว่าจะพบภายในพื้นที่ทำงาน:

<AccordionGroup>
  <Accordion title="AGENTS.md - คำสั่งการปฏิบัติงาน">
    คำสั่งการปฏิบัติงานสำหรับเอเจนต์และวิธีที่เอเจนต์ควรใช้หน่วยความจำ โหลดเมื่อเริ่มทุกเซสชัน เหมาะสำหรับกฎ ลำดับความสำคัญ และรายละเอียด "วิธีปฏิบัติตัว"
  </Accordion>
  <Accordion title="SOUL.md - บุคลิกและโทน">
    บุคลิก โทน และขอบเขต โหลดทุกเซสชัน คู่มือ: [คู่มือบุคลิกภาพ SOUL.md](/th/concepts/soul)
  </Accordion>
  <Accordion title="USER.md - ผู้ใช้คือใคร">
    ผู้ใช้คือใครและควรเรียกพวกเขาอย่างไร โหลดทุกเซสชัน
  </Accordion>
  <Accordion title="IDENTITY.md - ชื่อ บรรยากาศ อีโมจิ">
    ชื่อ บรรยากาศ และอีโมจิของเอเจนต์ สร้าง/อัปเดตระหว่างพิธีบูตสแตรป
  </Accordion>
  <Accordion title="TOOLS.md - ข้อตกลงของเครื่องมือโลคัล">
    หมายเหตุเกี่ยวกับเครื่องมือและข้อตกลงโลคัลของคุณ ไม่ได้ควบคุมความพร้อมใช้งานของเครื่องมือ เป็นเพียงคำแนะนำเท่านั้น
  </Accordion>
  <Accordion title="HEARTBEAT.md - เช็กลิสต์ Heartbeat">
    เช็กลิสต์ขนาดเล็กที่เป็นทางเลือกสำหรับการรัน Heartbeat ควรทำให้สั้นเพื่อหลีกเลี่ยงการใช้โทเค็นมากเกินไป
  </Accordion>
  <Accordion title="BOOT.md - เช็กลิสต์เริ่มต้น">
    เช็กลิสต์เริ่มต้นที่เป็นทางเลือก ซึ่งรันอัตโนมัติเมื่อ Gateway รีสตาร์ต (เมื่อเปิดใช้ [ฮุกภายใน](/th/automation/hooks)) ควรทำให้สั้น ใช้เครื่องมือข้อความสำหรับการส่งออก
  </Accordion>
  <Accordion title="BOOTSTRAP.md - พิธีรันครั้งแรก">
    พิธีรันครั้งแรกแบบครั้งเดียว สร้างเฉพาะสำหรับพื้นที่ทำงานใหม่เอี่ยม ลบทิ้งหลังจากพิธีเสร็จสมบูรณ์
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - บันทึกหน่วยความจำรายวัน">
    บันทึกหน่วยความจำรายวัน (หนึ่งไฟล์ต่อวัน) แนะนำให้อ่านของวันนี้ + เมื่อวานเมื่อเริ่มเซสชัน
  </Accordion>
  <Accordion title="MEMORY.md - หน่วยความจำระยะยาวที่คัดสรรแล้ว (ทางเลือก)">
    หน่วยความจำระยะยาวที่คัดสรรแล้ว: ข้อเท็จจริงที่คงทน ความชอบ การตัดสินใจ และสรุปสั้น ๆ เก็บบันทึกรายละเอียดไว้ใน `memory/YYYY-MM-DD.md` เพื่อให้เครื่องมือหน่วยความจำดึงมาใช้เมื่อต้องการได้ โดยไม่ต้องแทรกเข้าไปในทุก prompt โหลด `MEMORY.md` เฉพาะในเซสชันหลักแบบส่วนตัวเท่านั้น (ไม่ใช่บริบทที่แชร์/กลุ่ม) ดู [หน่วยความจำ](/th/concepts/memory) สำหรับเวิร์กโฟลว์และการล้างหน่วยความจำอัตโนมัติ
  </Accordion>
  <Accordion title="skills/ - Skills ของพื้นที่ทำงาน (ทางเลือก)">
    Skills เฉพาะพื้นที่ทำงาน ตำแหน่ง Skill ที่มีลำดับความสำคัญสูงสุดสำหรับพื้นที่ทำงานนั้น แทนที่ Skills ของเอเจนต์โปรเจกต์, Skills ของเอเจนต์ส่วนตัว, Skills ที่จัดการ, Skills ที่บันเดิลมา และ `skills.load.extraDirs` เมื่อชื่อชนกัน
  </Accordion>
  <Accordion title="canvas/ - ไฟล์ Canvas UI (ทางเลือก)">
    ไฟล์ Canvas UI สำหรับการแสดงผลโหนด (เช่น `canvas/index.html`)
  </Accordion>
</AccordionGroup>

<Note>
หากไฟล์บูตสแตรปใดหายไป OpenClaw จะแทรกเครื่องหมาย "ไฟล์หายไป" เข้าไปในเซสชันและทำงานต่อ ไฟล์บูตสแตรปขนาดใหญ่จะถูกตัดทอนเมื่อแทรก ปรับขีดจำกัดได้ด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และ `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) `openclaw setup` สามารถสร้างค่าเริ่มต้นที่หายไปใหม่ได้โดยไม่เขียนทับไฟล์ที่มีอยู่
</Note>

## สิ่งที่ไม่ได้อยู่ในพื้นที่ทำงาน

สิ่งเหล่านี้อยู่ใต้ `~/.openclaw/` และไม่ควร commit ไปยัง repo ของพื้นที่ทำงาน:

- `~/.openclaw/openclaw.json` (การกำหนดค่า)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (โปรไฟล์การยืนยันตัวตนของโมเดล: OAuth + API keys)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (บัญชีรันไทม์ Codex รายเอเจนต์ การกำหนดค่า Skills, plugins และสถานะเธรด native)
- `~/.openclaw/credentials/` (สถานะช่องทาง/ผู้ให้บริการ รวมถึงข้อมูลนำเข้า OAuth เดิม)
- `~/.openclaw/agents/<agentId>/sessions/` (ทรานสคริปต์เซสชัน + เมทาดาตา)
- `~/.openclaw/skills/` (Skills ที่จัดการ)

หากคุณต้องย้ายเซสชันหรือการกำหนดค่า ให้คัดลอกแยกต่างหากและเก็บไว้นอกการควบคุมเวอร์ชัน

## การสำรองข้อมูลด้วย Git (แนะนำ, ส่วนตัว)

ปฏิบัติต่อพื้นที่ทำงานเหมือนหน่วยความจำส่วนตัว ใส่ไว้ใน repo git แบบ **ส่วนตัว** เพื่อให้มีข้อมูลสำรองและกู้คืนได้

รันขั้นตอนเหล่านี้บนเครื่องที่ Gateway รันอยู่ (ซึ่งเป็นที่ที่พื้นที่ทำงานอยู่)

<Steps>
  <Step title="เริ่มต้น repo">
    หากติดตั้ง git แล้ว พื้นที่ทำงานใหม่เอี่ยมจะถูกเริ่มต้นโดยอัตโนมัติ หากพื้นที่ทำงานนี้ยังไม่ใช่ repo ให้รัน:

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
        1. สร้าง repository **ส่วนตัว** ใหม่บน GitLab
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
แม้จะอยู่ใน repo ส่วนตัว ให้หลีกเลี่ยงการเก็บความลับไว้ในพื้นที่ทำงาน:

- API keys, OAuth tokens, รหัสผ่าน หรือข้อมูลประจำตัวส่วนตัว
- ทุกอย่างภายใต้ `~/.openclaw/`
- ดัมพ์ดิบของแชตหรือไฟล์แนบที่ละเอียดอ่อน

หากคุณต้องเก็บการอ้างอิงที่ละเอียดอ่อน ให้ใช้ placeholder และเก็บความลับจริงไว้ที่อื่น (ตัวจัดการรหัสผ่าน ตัวแปรสภาพแวดล้อม หรือ `~/.openclaw/`)
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
    Clone repo ไปยังพาธที่ต้องการ (ค่าเริ่มต้น `~/.openclaw/workspace`)
  </Step>
  <Step title="อัปเดตการกำหนดค่า">
    ตั้งค่า `agents.defaults.workspace` เป็นพาธนั้นใน `~/.openclaw/openclaw.json`
  </Step>
  <Step title="Seed ไฟล์ที่หายไป">
    รัน `openclaw setup --workspace <path>` เพื่อ seed ไฟล์ที่หายไป
  </Step>
  <Step title="คัดลอกเซสชัน (ทางเลือก)">
    หากคุณต้องใช้เซสชัน ให้คัดลอก `~/.openclaw/agents/<agentId>/sessions/` จากเครื่องเก่าแยกต่างหาก
  </Step>
</Steps>

## หมายเหตุขั้นสูง

- การกำหนดเส้นทางแบบหลายเอเจนต์สามารถใช้พื้นที่ทำงานที่ต่างกันต่อเอเจนต์ได้ ดู [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) สำหรับการกำหนดค่าการกำหนดเส้นทาง
- หากเปิดใช้ `agents.defaults.sandbox` เซสชันที่ไม่ใช่ main สามารถใช้พื้นที่ทำงานแซนด์บ็อกซ์รายเซสชันใต้ `agents.defaults.sandbox.workspaceRoot`

## ที่เกี่ยวข้อง

- [Heartbeat](/th/gateway/heartbeat) - ไฟล์พื้นที่ทำงาน HEARTBEAT.md
- [แซนด์บ็อกซ์](/th/gateway/sandboxing) - การเข้าถึงพื้นที่ทำงานในสภาพแวดล้อมที่เป็นแซนด์บ็อกซ์
- [เซสชัน](/th/concepts/session) - พาธที่เก็บเซสชัน
- [คำสั่งประจำ](/th/automation/standing-orders) - คำสั่งถาวรในไฟล์พื้นที่ทำงาน
