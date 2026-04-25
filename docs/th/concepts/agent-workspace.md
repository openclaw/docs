---
read_when:
    - คุณต้องอธิบายพื้นที่ทำงานของ agent หรือโครงสร้างไฟล์ของมัน
    - คุณต้องการสำรองหรือย้ายพื้นที่ทำงานของ agent
summary: 'พื้นที่ทำงานของ agent: ตำแหน่ง โครงสร้าง และกลยุทธ์การสำรองข้อมูล'
title: พื้นที่ทำงานของ agent
x-i18n:
    generated_at: "2026-04-25T13:45:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f9531dbd0f7d0c297f448a5e37f413bae48d75068f15ac88b6fdf7f153c974
    source_path: concepts/agent-workspace.md
    workflow: 15
---

พื้นที่ทำงานคือบ้านของ agent เป็นไดเรกทอรีทำงานเพียงแห่งเดียวที่ใช้สำหรับ file tools และสำหรับบริบทของ workspace ให้เก็บเป็นส่วนตัวและถือว่าเป็นความทรงจำ

สิ่งนี้แยกจาก `~/.openclaw/` ซึ่งเก็บ config, credentials และ sessions

**สำคัญ:** workspace คือ **cwd ค่าเริ่มต้น** ไม่ใช่ sandbox แบบบังคับ เครื่องมือจะ resolve relative paths โดยอิงจาก workspace แต่ absolute paths ยังสามารถเข้าถึงตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิด sandboxing หากคุณต้องการการแยกออกจากกัน ให้ใช้ [`agents.defaults.sandbox`](/th/gateway/sandboxing) (และ/หรือ config sandbox แยกตาม agent) เมื่อเปิด sandboxing และ `workspaceAccess` ไม่ใช่ `"rw"` เครื่องมือจะทำงานภายใน sandbox workspace ใต้ `~/.openclaw/sandboxes` ไม่ใช่ host workspace ของคุณ

## ตำแหน่งเริ่มต้น

- ค่าเริ่มต้น: `~/.openclaw/workspace`
- หากตั้ง `OPENCLAW_PROFILE` และค่าไม่ใช่ `"default"` ค่าเริ่มต้นจะกลายเป็น
  `~/.openclaw/workspace-<profile>`
- override ได้ใน `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` หรือ `openclaw setup` จะสร้าง
workspace และวาง bootstrap files ให้หากยังไม่มี
การคัดลอก sandbox seed จะยอมรับเฉพาะไฟล์ปกติภายใน workspace เท่านั้น; alias แบบ symlink/hardlink
ที่ resolve ออกไปนอก source workspace จะถูกละเลย

หากคุณจัดการไฟล์ใน workspace เองอยู่แล้ว คุณสามารถปิดการสร้าง
bootstrap files ได้:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## โฟลเดอร์ workspace เพิ่มเติม

การติดตั้งรุ่นเก่าอาจเคยสร้าง `~/openclaw`
การมีหลายไดเรกทอรี workspace พร้อมกันอาจทำให้เกิด auth หรือ state drift ที่สับสนได้ เพราะจะมีเพียง workspace เดียวเท่านั้นที่ active อยู่ในแต่ละครั้ง

**คำแนะนำ:** ให้มี active workspace เพียงแห่งเดียว หากคุณไม่ได้ใช้
โฟลเดอร์เพิ่มเติมเหล่านั้นแล้ว ให้เก็บถาวรหรือนำไปไว้ในถังขยะ (เช่น `trash ~/openclaw`)
หากคุณตั้งใจเก็บหลาย workspace ไว้ ตรวจสอบให้แน่ใจว่า
`agents.defaults.workspace` ชี้ไปยัง workspace ที่ active อยู่

`openclaw doctor` จะเตือนเมื่อพบไดเรกทอรี workspace เพิ่มเติม

## แผนผังไฟล์ใน workspace (แต่ละไฟล์มีความหมายอย่างไร)

ต่อไปนี้คือไฟล์มาตรฐานที่ OpenClaw คาดว่าจะพบภายใน workspace:

- `AGENTS.md`
  - คำสั่งการทำงานสำหรับ agent และวิธีที่ควรใช้ memory
  - โหลดเมื่อเริ่มทุก session
  - เหมาะสำหรับใส่กฎ ลำดับความสำคัญ และรายละเอียด “ควรทำตัวอย่างไร”

- `SOUL.md`
  - บุคลิก น้ำเสียง และขอบเขต
  - โหลดทุก session
  - คู่มือ: [คู่มือบุคลิก SOUL.md](/th/concepts/soul)

- `USER.md`
  - ผู้ใช้คือใคร และควรเรียกเขาอย่างไร
  - โหลดทุก session

- `IDENTITY.md`
  - ชื่อ สไตล์ และอีโมจิของ agent
  - สร้าง/อัปเดตระหว่าง bootstrap ritual

- `TOOLS.md`
  - บันทึกเกี่ยวกับเครื่องมือและธรรมเนียมการใช้งานในเครื่องของคุณ
  - ไม่ได้ควบคุมความพร้อมใช้งานของเครื่องมือ; เป็นเพียงคำแนะนำเท่านั้น

- `HEARTBEAT.md`
  - เช็กลิสต์ขนาดเล็กแบบไม่บังคับสำหรับการรัน Heartbeat
  - ควรสั้นเพื่อหลีกเลี่ยงการสิ้นเปลืองโทเค็น

- `BOOT.md`
  - เช็กลิสต์เริ่มต้นระบบแบบไม่บังคับที่รันอัตโนมัติเมื่อ Gateway รีสตาร์ต (เมื่อเปิดใช้ [internal hooks](/th/automation/hooks))
  - ควรสั้น; ใช้ message tool สำหรับการส่งข้อความขาออก

- `BOOTSTRAP.md`
  - ritual แบบครั้งเดียวสำหรับการรันครั้งแรก
  - สร้างเฉพาะสำหรับ workspace ใหม่เอี่ยม
  - ลบได้หลัง ritual เสร็จสมบูรณ์

- `memory/YYYY-MM-DD.md`
  - บันทึกความทรงจำรายวัน (หนึ่งไฟล์ต่อวัน)
  - แนะนำให้อ่านของวันนี้ + เมื่อวานตอนเริ่ม session

- `MEMORY.md` (ไม่บังคับ)
  - ความทรงจำระยะยาวที่คัดสรรแล้ว
  - ให้โหลดเฉพาะในเซสชันหลักแบบส่วนตัวเท่านั้น (ไม่ใช่บริบทที่แชร์/กลุ่ม)

ดู [Memory](/th/concepts/memory) สำหรับ workflow และการ flush memory อัตโนมัติ

- `skills/` (ไม่บังคับ)
  - Skills เฉพาะของ workspace
  - เป็นตำแหน่ง Skills ที่มีลำดับความสำคัญสูงสุดสำหรับ workspace นั้น
  - override project agent skills, personal agent skills, managed skills, bundled skills และ `skills.load.extraDirs` เมื่อชื่อซ้ำกัน

- `canvas/` (ไม่บังคับ)
  - ไฟล์ Canvas UI สำหรับการแสดงผลของ node (เช่น `canvas/index.html`)

หาก bootstrap file ใดหายไป OpenClaw จะใส่ตัวทำเครื่องหมาย “missing file” เข้าไปใน
session และทำงานต่อไป bootstrap files ขนาดใหญ่จะถูกตัดทอนเมื่อแทรกเข้าไป;
ปรับขีดจำกัดได้ด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และ
`agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000)
`openclaw setup` สามารถสร้างค่าเริ่มต้นที่หายไปขึ้นใหม่ได้โดยไม่เขียนทับ
ไฟล์ที่มีอยู่

## สิ่งที่ไม่ได้อยู่ใน workspace

สิ่งเหล่านี้อยู่ภายใต้ `~/.openclaw/` และ **ไม่ควร** commit เข้า repo ของ workspace:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (โปรไฟล์การยืนยันตัวตนของโมเดล: OAuth + API keys)
- `~/.openclaw/credentials/` (สถานะของช่องทาง/ผู้ให้บริการ พร้อมข้อมูลนำเข้า OAuth แบบเดิม)
- `~/.openclaw/agents/<agentId>/sessions/` (transcripts + metadata ของ session)
- `~/.openclaw/skills/` (managed Skills)

หากคุณต้องย้าย sessions หรือ config ให้คัดลอกแยกต่างหากและเก็บไว้
นอก version control

## การสำรองด้วย Git (แนะนำ, แบบส่วนตัว)

ให้ถือว่า workspace เป็นความทรงจำส่วนตัว นำมันใส่ไว้ใน repo git แบบ **private**
เพื่อให้มีการสำรองข้อมูลและกู้คืนได้

ให้รันขั้นตอนเหล่านี้บนเครื่องที่ Gateway ทำงานอยู่ (นั่นคือที่ที่
workspace อยู่)

### 1) เริ่มต้น repo

หากติดตั้ง git ไว้แล้ว workspace ใหม่เอี่ยมจะถูกเริ่มต้นให้อัตโนมัติ หาก
workspace นี้ยังไม่ใช่ repo ให้รัน:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) เพิ่ม remote แบบ private (ตัวเลือกที่เหมาะกับผู้เริ่มต้น)

ตัวเลือก A: GitHub web UI

1. สร้าง repository ใหม่แบบ **private** บน GitHub
2. อย่าเริ่มต้นด้วย README (เพื่อหลีกเลี่ยง merge conflicts)
3. คัดลอก HTTPS remote URL
4. เพิ่ม remote และ push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

ตัวเลือก B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

ตัวเลือก C: GitLab web UI

1. สร้าง repository ใหม่แบบ **private** บน GitLab
2. อย่าเริ่มต้นด้วย README (เพื่อหลีกเลี่ยง merge conflicts)
3. คัดลอก HTTPS remote URL
4. เพิ่ม remote และ push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) การอัปเดตอย่างต่อเนื่อง

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## อย่า commit ซีเคร็ต

แม้จะอยู่ใน repo แบบ private ก็ควรหลีกเลี่ยงการเก็บซีเคร็ตไว้ใน workspace:

- API keys, OAuth tokens, รหัสผ่าน หรือข้อมูลรับรองส่วนตัว
- ทุกอย่างภายใต้ `~/.openclaw/`
- ข้อมูลดิบของแชตหรือไฟล์แนบที่อ่อนไหว

หากจำเป็นต้องเก็บการอ้างอิงที่อ่อนไหว ให้ใช้ placeholders และเก็บซีเคร็ตจริงไว้ที่อื่น
(password manager, environment variables หรือ `~/.openclaw/`)

ตัวอย่างเริ่มต้นของ `.gitignore` ที่แนะนำ:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## การย้าย workspace ไปยังเครื่องใหม่

1. clone repo ไปยังพาธที่ต้องการ (ค่าเริ่มต้น `~/.openclaw/workspace`)
2. ตั้งค่า `agents.defaults.workspace` ให้ชี้ไปยังพาธนั้นใน `~/.openclaw/openclaw.json`
3. รัน `openclaw setup --workspace <path>` เพื่อวางไฟล์ที่ยังขาดอยู่
4. หากต้องการ sessions ให้คัดลอก `~/.openclaw/agents/<agentId>/sessions/` จาก
   เครื่องเก่าแยกต่างหาก

## หมายเหตุขั้นสูง

- การกำหนดเส้นทางแบบหลาย agent สามารถใช้ workspace คนละชุดต่อ agent ได้ ดู
  [Channel routing](/th/channels/channel-routing) สำหรับการตั้งค่าการกำหนดเส้นทาง
- หากเปิด `agents.defaults.sandbox` เซสชันที่ไม่ใช่ main สามารถใช้ sandbox
  workspace แยกตาม session ภายใต้ `agents.defaults.sandbox.workspaceRoot`

## ที่เกี่ยวข้อง

- [คำสั่งถาวร](/th/automation/standing-orders) — คำสั่งถาวรในไฟล์ workspace
- [Heartbeat](/th/gateway/heartbeat) — ไฟล์ `HEARTBEAT.md` ใน workspace
- [Session](/th/concepts/session) — พาธที่เก็บ session
- [Sandboxing](/th/gateway/sandboxing) — การเข้าถึง workspace ในสภาพแวดล้อมแบบ sandboxed
