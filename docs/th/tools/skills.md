---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนแปลงการควบคุมการเข้าถึง Skills, รายการอนุญาต หรือกฎการโหลด
    - ทำความเข้าใจลำดับความสำคัญของ Skills และพฤติกรรมของสแนปช็อต
sidebarTitle: Skills
summary: 'Skills: แบบจัดการเทียบกับพื้นที่ทำงาน, กฎการควบคุมเกต, รายการอนุญาตของเอเจนต์, และการเชื่อมต่อการกำหนดค่า'
title: Skills
x-i18n:
    generated_at: "2026-04-30T10:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw ใช้โฟลเดอร์ skill ที่**เข้ากันได้กับ [AgentSkills](https://agentskills.io)** เพื่อสอน agent ให้ใช้เครื่องมือ แต่ละ skill คือไดเรกทอรีที่มี `SKILL.md` พร้อม YAML frontmatter และคำแนะนำ OpenClaw โหลด skills ที่มาพร้อมแพ็กเกจรวมถึงการ override ภายในเครื่องแบบเลือกได้ และกรอง skills ตอนโหลดตามสภาพแวดล้อม config และการมีอยู่ของ binary

## ตำแหน่งและลำดับความสำคัญ

OpenClaw โหลด skills จากแหล่งต่อไปนี้ โดยเรียงจาก**ลำดับความสำคัญสูงสุดก่อน**:

| #   | แหล่งที่มา                | เส้นทาง                             |
| --- | --------------------- | -------------------------------- |
| 1   | Workspace skills      | `<workspace>/skills`             |
| 2   | Project agent skills  | `<workspace>/.agents/skills`     |
| 3   | Personal agent skills | `~/.agents/skills`               |
| 4   | Managed/local skills  | `~/.openclaw/skills`             |
| 5   | Bundled skills        | มาพร้อมกับการติดตั้ง         |
| 6   | โฟลเดอร์ skill เพิ่มเติม   | `skills.load.extraDirs` (config) |

หากชื่อ skill ชนกัน แหล่งที่มีลำดับความสำคัญสูงสุดจะชนะ

## Skills ต่อ agent เทียบกับ skills ที่ใช้ร่วมกัน

ในการตั้งค่าแบบ **multi-agent** แต่ละ agent มี workspace ของตัวเอง:

| ขอบเขต                | เส้นทาง                                        | มองเห็นได้โดย                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| ต่อ agent            | `<workspace>/skills`                        | เฉพาะ agent นั้น             |
| Project-agent        | `<workspace>/.agents/skills`                | เฉพาะ agent ของ workspace นั้น |
| Personal-agent       | `~/.agents/skills`                          | agent ทั้งหมดบนเครื่องนั้น  |
| Shared managed/local | `~/.openclaw/skills`                        | agent ทั้งหมดบนเครื่องนั้น  |
| Shared extra dirs    | `skills.load.extraDirs` (ลำดับความสำคัญต่ำสุด) | agent ทั้งหมดบนเครื่องนั้น  |

ชื่อเดียวกันในหลายตำแหน่ง → แหล่งที่มีลำดับความสำคัญสูงสุดชนะ Workspace ชนะ project-agent, ชนะ personal-agent, ชนะ managed/local, ชนะ bundled, ชนะ extra dirs

## รายการอนุญาต skill ของ agent

**ตำแหน่ง** ของ skill และ **การมองเห็น** ของ skill เป็นการควบคุมคนละส่วน ตำแหน่ง/ลำดับความสำคัญตัดสินว่าสำเนาใดของ skill ชื่อเดียวกันชนะ; รายการอนุญาตของ agent ตัดสินว่า agent ใช้ skills ใดได้จริง

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="กฎรายการอนุญาต">
    - ละ `agents.defaults.skills` เพื่อให้ใช้ skills ได้ไม่จำกัดโดยค่าเริ่มต้น
    - ละ `agents.list[].skills` เพื่อสืบทอด `agents.defaults.skills`
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี skills
    - รายการ `agents.list[].skills` ที่ไม่ว่างคือชุด**สุดท้าย**สำหรับ agent นั้น และจะไม่ merge กับค่าเริ่มต้น
    - รายการอนุญาตที่มีผลจะถูกใช้ครอบคลุมการสร้าง prompt, การค้นพบ skill slash-command, การ sync sandbox และ snapshot ของ skill

  </Accordion>
</AccordionGroup>

## Plugins และ skills

Plugins สามารถจัดส่ง skills ของตัวเองได้โดยระบุไดเรกทอรี `skills` ใน `openclaw.plugin.json` (เส้นทางสัมพันธ์กับ root ของ plugin) Plugin skills จะโหลดเมื่อเปิดใช้ plugin นี่คือตำแหน่งที่เหมาะสำหรับคู่มือการใช้งานเฉพาะเครื่องมือที่ยาวเกินไปสำหรับคำอธิบายเครื่องมือ แต่ควรพร้อมใช้งานทุกครั้งที่ติดตั้ง plugin เช่น browser plugin จัดส่ง skill `browser-automation` สำหรับการควบคุม browser แบบหลายขั้นตอน

ไดเรกทอรี Plugin skill จะถูก merge เข้าในเส้นทางลำดับความสำคัญต่ำเดียวกับ `skills.load.extraDirs` ดังนั้น bundled, managed, agent หรือ workspace skill ที่ชื่อเดียวกันจะ override สิ่งเหล่านี้ คุณสามารถ gate ได้ผ่าน `metadata.openclaw.requires.config` บน config entry ของ plugin

ดู [Plugins](/th/tools/plugin) สำหรับการค้นพบ/config และ [Tools](/th/tools) สำหรับพื้นผิวเครื่องมือที่ skills เหล่านั้นสอน

## Skill Workshop

Plugin **Skill Workshop** แบบทดลองและไม่บังคับสามารถสร้างหรืออัปเดต workspace skills จากขั้นตอนที่นำกลับมาใช้ซ้ำได้ซึ่งสังเกตพบระหว่างงานของ agent โดยปิดใช้เป็นค่าเริ่มต้น และต้องเปิดใช้อย่างชัดเจนผ่าน `plugins.entries.skill-workshop`

Skill Workshop เขียนเฉพาะไปที่ `<workspace>/skills`, สแกนเนื้อหาที่สร้างขึ้น, รองรับการรออนุมัติหรือการเขียนที่ปลอดภัยแบบอัตโนมัติ, กักกันข้อเสนอที่ไม่ปลอดภัย และรีเฟรช snapshot ของ skill หลังจากเขียนสำเร็จ เพื่อให้ skills ใหม่พร้อมใช้งานโดยไม่ต้อง restart Gateway

ใช้สำหรับการแก้ไข เช่น _"ครั้งหน้า ให้ตรวจสอบการระบุแหล่งที่มาของ GIF"_ หรือ workflow ที่ได้มาจากประสบการณ์จริง เช่น checklist QA สื่อ เริ่มด้วยการรออนุมัติ; ใช้การเขียนอัตโนมัติเฉพาะใน workspace ที่เชื่อถือได้หลังจากตรวจสอบข้อเสนอแล้ว คู่มือฉบับเต็ม: [Skill Workshop plugin](/th/plugins/skill-workshop)

## ClawHub (ติดตั้งและ sync)

[ClawHub](https://clawhub.ai) คือ registry skills สาธารณะสำหรับ OpenClaw ใช้คำสั่ง `openclaw skills` แบบ native เพื่อ discover/install/update หรือใช้ CLI `clawhub` แยกต่างหากสำหรับ workflow publish/sync คู่มือฉบับเต็ม: [ClawHub](/th/tools/clawhub)

| การดำเนินการ                             | คำสั่ง                                |
| ---------------------------------- | -------------------------------------- |
| ติดตั้ง skill ลงใน workspace | `openclaw skills install <skill-slug>` |
| อัปเดต skills ที่ติดตั้งทั้งหมด        | `openclaw skills update --all`         |
| Sync (สแกน + publish updates)      | `clawhub sync --all`                   |

`openclaw skills install` แบบ native จะติดตั้งลงในไดเรกทอรี `skills/` ของ workspace ที่ใช้งานอยู่ CLI `clawhub` แยกต่างหากก็ติดตั้งลงใน `./skills` ภายใต้ไดเรกทอรีทำงานปัจจุบันของคุณเช่นกัน (หรือ fallback ไปยัง workspace ของ OpenClaw ที่ config ไว้) OpenClaw จะรับสิ่งนั้นเป็น `<workspace>/skills` ใน session ถัดไป
รากของ skill ที่ config ไว้ยังรองรับระดับการจัดกลุ่มหนึ่งระดับ เช่น `skills/<group>/<skill>/SKILL.md` เพื่อให้เก็บ skills จากบุคคลที่สามที่เกี่ยวข้องไว้ใต้โฟลเดอร์ร่วมกันได้โดยไม่ต้องสแกนแบบ recursive กว้าง

หน้า skill ของ ClawHub แสดงสถานะการสแกนความปลอดภัยล่าสุดก่อนติดตั้ง พร้อมหน้ารายละเอียด scanner สำหรับ VirusTotal, ClawScan และ static analysis `openclaw skills install <slug>` ยังคงเป็นเฉพาะเส้นทางติดตั้งเท่านั้น; ผู้ publish กู้คืน false positives ผ่าน dashboard ของ ClawHub หรือ `clawhub skill rescan <slug>`

## ความปลอดภัย

<Warning>
ถือว่า skills จากบุคคลที่สามเป็น**โค้ดที่ไม่น่าเชื่อถือ** อ่านก่อนเปิดใช้ ควรใช้การรันใน sandbox สำหรับ input ที่ไม่น่าเชื่อถือและเครื่องมือที่มีความเสี่ยง ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการควบคุมฝั่ง agent
</Warning>

- การค้นพบ skill จาก workspace และ extra-dir ยอมรับเฉพาะรากของ skill และไฟล์ `SKILL.md` ที่ resolved realpath ยังคงอยู่ภายใน root ที่ config ไว้
- การติดตั้ง dependency ของ skill ที่รองรับโดย Gateway (`skills.install`, onboarding และ UI การตั้งค่า Skills) จะรัน dangerous-code scanner ในตัวก่อน execute metadata ของ installer findings ระดับ `critical` จะ block โดยค่าเริ่มต้น เว้นแต่ caller จะตั้งค่า dangerous override อย่างชัดเจน; findings ที่น่าสงสัยยังคงเป็นเพียงคำเตือนเท่านั้น
- `openclaw skills install <slug>` แตกต่างกัน โดยจะดาวน์โหลดโฟลเดอร์ skill ของ ClawHub ลงใน workspace และไม่ใช้เส้นทาง installer-metadata ข้างต้น
- `skills.entries.*.env` และ `skills.entries.*.apiKey` inject secrets เข้าใน process **host** สำหรับ turn ของ agent นั้น (ไม่ใช่ sandbox) อย่าให้ secrets อยู่ใน prompts และ logs

สำหรับ threat model และ checklists ที่กว้างขึ้น ดู [Security](/th/gateway/security)

## รูปแบบ SKILL.md

`SKILL.md` ต้องมีอย่างน้อย:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw ทำตาม spec ของ AgentSkills สำหรับ layout/intent parser ที่ agent แบบฝังใช้รองรับเฉพาะ key frontmatter แบบ**บรรทัดเดียว**เท่านั้น; `metadata` ควรเป็น **JSON object บรรทัดเดียว** ใช้ `{baseDir}` ในคำแนะนำเพื่ออ้างอิงเส้นทางโฟลเดอร์ skill

### คีย์ frontmatter ที่ไม่บังคับ

<ParamField path="homepage" type="string">
  URL ที่แสดงเป็น "เว็บไซต์" ใน UI Skills ของ macOS รองรับผ่าน `metadata.openclaw.homepage` ด้วย
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  เมื่อเป็น `true` skill จะแสดงเป็น slash command ของผู้ใช้
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  เมื่อเป็น `true` skill จะถูกตัดออกจาก prompt ของ model (ยังคงพร้อมใช้งานผ่านการเรียกใช้โดยผู้ใช้)
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  เมื่อตั้งค่าเป็น `tool` slash command จะข้าม model และ dispatch ตรงไปยังเครื่องมือ
</ParamField>
<ParamField path="command-tool" type="string">
  ชื่อเครื่องมือที่จะเรียกใช้เมื่อตั้งค่า `command-dispatch: tool`
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  สำหรับ tool dispatch จะส่งต่อสตริง args ดิบไปยังเครื่องมือ (ไม่มี core parsing) เครื่องมือจะถูกเรียกด้วย `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
</ParamField>

## การ gate (ตัวกรองตอนโหลด)

OpenClaw กรอง skills ตอนโหลดโดยใช้ `metadata` (JSON บรรทัดเดียว):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Fields ภายใต้ `metadata.openclaw`:

<ParamField path="always" type="boolean">
  เมื่อเป็น `true` จะรวม skill เสมอ (ข้าม gates อื่น)
</ParamField>
<ParamField path="emoji" type="string">
  emoji แบบไม่บังคับที่ใช้โดย UI Skills ของ macOS
</ParamField>
<ParamField path="homepage" type="string">
  URL แบบไม่บังคับที่แสดงเป็น "เว็บไซต์" ใน UI Skills ของ macOS
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  รายการ platforms แบบไม่บังคับ หากตั้งค่าไว้ skill จะ eligible เฉพาะบน OS เหล่านั้น
</ParamField>
<ParamField path="requires.bins" type="string[]">
  แต่ละรายการต้องมีอยู่บน `PATH`
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  ต้องมีอย่างน้อยหนึ่งรายการอยู่บน `PATH`
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env var ต้องมีอยู่หรือถูกระบุใน config
</ParamField>
<ParamField path="requires.config" type="string[]">
  รายการเส้นทาง `openclaw.json` ที่ต้องเป็น truthy
</ParamField>
<ParamField path="primaryEnv" type="string">
  ชื่อ Env var ที่เชื่อมโยงกับ `skills.entries.<name>.apiKey`
</ParamField>
<ParamField path="install" type="object[]">
  specs ของ installer แบบไม่บังคับที่ใช้โดย UI Skills ของ macOS (brew/node/go/uv/download)
</ParamField>

หากไม่มี `metadata.openclaw` อยู่ skill จะ eligible เสมอ (เว้นแต่ถูกปิดใช้ใน config หรือถูก block โดย `skills.allowBundled` สำหรับ bundled skills)

<Note>
บล็อก `metadata.clawdbot` แบบ legacy ยังยอมรับอยู่เมื่อไม่มี `metadata.openclaw` เพื่อให้ skills เก่าที่ติดตั้งไว้ยังคงรักษา dependency gates และ installer hints ไว้ Skills ใหม่และที่อัปเดตควรใช้ `metadata.openclaw`
</Note>

### หมายเหตุเกี่ยวกับ Sandboxing

- `requires.bins` ถูกตรวจสอบบน **host** ตอนโหลด skill
- หาก agent อยู่ใน sandbox binary ต้องมีอยู่**ภายใน container** ด้วย ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` (หรือ image ที่กำหนดเอง) `setupCommand` รันหนึ่งครั้งหลังจากสร้าง container แล้ว การติดตั้ง package ยังต้องใช้ network egress, root FS ที่เขียนได้ และ root user ใน sandbox
- ตัวอย่าง: skill `summarize` (`skills/summarize/SKILL.md`) ต้องมี CLI `summarize` ใน sandbox container เพื่อรันที่นั่น

### Specs ของ installer

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="กฎการเลือกตัวติดตั้ง">
    - หากมีตัวติดตั้งหลายรายการ Gateway จะเลือกตัวเลือกที่ต้องการเพียงรายการเดียว (`brew` เมื่อมีให้ใช้ มิฉะนั้นใช้ `node`)
    - หากตัวติดตั้งทั้งหมดเป็น `download` OpenClaw จะแสดงแต่ละรายการเพื่อให้คุณเห็นอาร์ติแฟกต์ที่มีให้ใช้
    - ข้อมูลจำเพาะของตัวติดตั้งสามารถมี `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตัวเลือกตามแพลตฟอร์ม
    - การติดตั้ง Node จะเคารพ `skills.install.nodeManager` ใน `openclaw.json` (ค่าเริ่มต้น: npm; ตัวเลือก: npm/pnpm/yarn/bun) สิ่งนี้มีผลเฉพาะกับการติดตั้ง skill เท่านั้น; รันไทม์ Gateway ควรยังคงเป็น Node - ไม่แนะนำให้ใช้ Bun สำหรับ WhatsApp/Telegram
    - การเลือกตัวติดตั้งที่รองรับโดย Gateway ขับเคลื่อนด้วยค่ากำหนด: เมื่อข้อมูลจำเพาะการติดตั้งผสมหลายชนิด OpenClaw จะชอบ Homebrew เมื่อเปิดใช้ `skills.install.preferBrew` และมี `brew` จากนั้นจึงเป็น `uv` จากนั้นจึงเป็นตัวจัดการ node ที่กำหนดค่าไว้ และต่อด้วยทางเลือกสำรองอื่น เช่น `go` หรือ `download`
    - หากข้อมูลจำเพาะการติดตั้งทุกอันเป็น `download` OpenClaw จะแสดงตัวเลือกดาวน์โหลดทั้งหมดแทนที่จะยุบเหลือตัวติดตั้งที่ต้องการเพียงตัวเดียว

  </Accordion>
  <Accordion title="รายละเอียดต่อชนิดตัวติดตั้ง">
    - **การติดตั้ง Go:** หากไม่มี `go` และมี `brew` ให้ใช้ Gateway จะติดตั้ง Go ผ่าน Homebrew ก่อน และตั้งค่า `GOBIN` เป็น `bin` ของ Homebrew เมื่อเป็นไปได้
    - **การติดตั้งแบบดาวน์โหลด:** `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (ค่าเริ่มต้น: อัตโนมัติเมื่อตรวจพบอาร์ไคฟ์), `stripComponents`, `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)

  </Accordion>
</AccordionGroup>

## การเขียนทับการกำหนดค่า

สามารถเปิด/ปิด Skills ที่บันเดิลมาและที่จัดการอยู่ รวมถึงระบุค่า env ได้
ภายใต้ `skills.entries` ใน `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` จะปิดใช้ skill แม้ว่าจะถูกบันเดิลหรือติดตั้งไว้แล้วก็ตาม
  skill `coding-agent` ที่บันเดิลมาเป็นแบบเลือกเปิดใช้: ตั้งค่า
  `skills.entries.coding-agent.enabled: true` ก่อนเปิดให้เอเจนต์ใช้งาน
  จากนั้นตรวจให้แน่ใจว่าได้ติดตั้งและยืนยันตัวตน `claude`, `codex`, `opencode` หรือ `pi`
  สำหรับ CLI ของตนเองแล้ว
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  ตัวช่วยอำนวยความสะดวกสำหรับ Skills ที่ประกาศ `metadata.openclaw.primaryEnv` รองรับข้อความธรรมดาหรือ SecretRef
</ParamField>
<ParamField path="env" type="Record<string, string>">
  ฉีดเข้าไปเฉพาะเมื่อยังไม่ได้ตั้งค่าตัวแปรในโปรเซส
</ParamField>
<ParamField path="config" type="object">
  ถุงข้อมูลเสริมสำหรับฟิลด์กำหนดเองราย skill คีย์กำหนดเองต้องอยู่ที่นี่
</ParamField>
<ParamField path="allowBundled" type="string[]">
  รายการอนุญาตเสริมสำหรับ Skills ที่ **บันเดิลมา** เท่านั้น หากตั้งค่าไว้ เฉพาะ Skills ที่บันเดิลมาในรายการนี้เท่านั้นที่มีสิทธิ์ใช้ได้ (Skills ที่จัดการอยู่/ใน workspace ไม่ได้รับผลกระทบ)
</ParamField>

หากชื่อ skill มีเครื่องหมายยัติภังค์ ให้ใส่คีย์ในเครื่องหมายคำพูด (JSON5 อนุญาต
คีย์ที่ใส่เครื่องหมายคำพูด) โดยค่าเริ่มต้น คีย์การกำหนดค่าจะตรงกับ **ชื่อ skill** -
หาก skill กำหนด `metadata.openclaw.skillKey` ให้ใช้คีย์นั้นภายใต้ `skills.entries`

<Note>
สำหรับการสร้าง/แก้ไขภาพสต็อกภายใน OpenClaw ให้ใช้เครื่องมือหลัก
`image_generate` พร้อม `agents.defaults.imageGenerationModel` แทน
skill ที่บันเดิลมา ตัวอย่าง skill ที่นี่มีไว้สำหรับเวิร์กโฟลว์แบบกำหนดเองหรือของบุคคลที่สาม
สำหรับการวิเคราะห์ภาพแบบเนทีฟ ให้ใช้เครื่องมือ `image` พร้อม
`agents.defaults.imageModel` หากคุณเลือก `openai/*`, `google/*`,
`fal/*` หรือโมเดลภาพเฉพาะผู้ให้บริการรายอื่น ให้เพิ่มคีย์ auth/API ของผู้ให้บริการนั้นด้วย
</Note>

## การฉีดสภาพแวดล้อม

เมื่อการรันเอเจนต์เริ่มต้น OpenClaw จะ:

1. อ่านเมทาดาทาของ skill
2. ใช้ `skills.entries.<key>.env` และ `skills.entries.<key>.apiKey` กับ `process.env`
3. สร้าง system prompt ด้วย Skills ที่ **มีสิทธิ์ใช้ได้**
4. คืนค่าสภาพแวดล้อมเดิมหลังจากการรันสิ้นสุด

การฉีดสภาพแวดล้อมมี **ขอบเขตเฉพาะการรันของเอเจนต์** ไม่ใช่สภาพแวดล้อมเชลล์
แบบทั่วทั้งระบบ

สำหรับแบ็กเอนด์ `claude-cli` ที่บันเดิลมา OpenClaw ยังสร้าง snapshot ที่มีสิทธิ์ใช้ได้ชุดเดียวกัน
เป็น Plugin Claude Code ชั่วคราว และส่งต่อด้วย
`--plugin-dir` จากนั้น Claude Code สามารถใช้ตัวแก้ skill แบบเนทีฟของตนได้ ในขณะที่
OpenClaw ยังคงเป็นเจ้าของลำดับความสำคัญ รายการอนุญาตรายเอเจนต์ การกั้นสิทธิ์ และ
การฉีด env/API key ของ `skills.entries.*` แบ็กเอนด์ CLI อื่นใช้เฉพาะ
แค็ตตาล็อก prompt เท่านั้น

## Snapshot และการรีเฟรช

OpenClaw จะ snapshot Skills ที่มีสิทธิ์ใช้ได้ **เมื่อ session เริ่มต้น** และ
นำรายการนั้นกลับมาใช้ซ้ำสำหรับเทิร์นถัดไปใน session เดียวกัน การเปลี่ยนแปลง
Skills หรือการกำหนดค่าจะมีผลใน session ใหม่ถัดไป

Skills สามารถรีเฟรชกลาง session ได้ในสองกรณี:

- เปิดใช้ตัวเฝ้าดู Skills
- remote node ใหม่ที่มีสิทธิ์ใช้ได้ปรากฏขึ้น

ให้คิดว่าสิ่งนี้เป็น **hot reload**: รายการที่รีเฟรชแล้วจะถูกนำไปใช้ใน
เทิร์นถัดไปของเอเจนต์ หากรายการอนุญาต skill ของเอเจนต์ที่มีผลเปลี่ยนแปลงสำหรับ
session นั้น OpenClaw จะรีเฟรช snapshot เพื่อให้ Skills ที่มองเห็นได้ยังคงสอดคล้อง
กับเอเจนต์ปัจจุบัน

### ตัวเฝ้าดู Skills

โดยค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ skill และเพิ่มเวอร์ชัน snapshot ของ Skills
เมื่อไฟล์ `SKILL.md` เปลี่ยนแปลง กำหนดค่าภายใต้ `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### node macOS ระยะไกล (Gateway Linux)

หาก Gateway ทำงานบน Linux แต่มี **node macOS** เชื่อมต่ออยู่โดยอนุญาต
`system.run` (ความปลอดภัยของการอนุมัติ Exec ไม่ได้ตั้งเป็น `deny`)
OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์ใช้ได้เมื่อมี
ไบนารีที่ต้องใช้บน node นั้น เอเจนต์ควรเรียกใช้ Skills เหล่านั้น
ผ่านเครื่องมือ `exec` พร้อม `host=node`

สิ่งนี้อาศัยการที่ node รายงานการรองรับคำสั่งของตน และการ probe bin
ผ่าน `system.which` หรือ `system.run` node ที่ออฟไลน์จะ **ไม่** ทำให้
Skills ที่ใช้ได้เฉพาะระยะไกลมองเห็นได้ หาก node ที่เชื่อมต่อหยุดตอบการ probe bin
OpenClaw จะล้างรายการ bin match ที่แคชไว้ เพื่อให้เอเจนต์ไม่เห็น
Skills ที่ไม่สามารถรันได้ในขณะนั้นอีกต่อไป

## ผลกระทบต่อโทเคน

เมื่อ Skills มีสิทธิ์ใช้ได้ OpenClaw จะฉีดรายการ XML แบบกะทัดรัดของ Skills ที่มีอยู่
เข้าไปใน system prompt (ผ่าน `formatSkillsForPrompt` ใน
`pi-coding-agent`) ค่าใช้จ่ายเป็นแบบกำหนดแน่นอน:

- **โอเวอร์เฮดพื้นฐาน** (เฉพาะเมื่อมี skill ≥1 รายการ): 195 อักขระ
- **ต่อ skill:** 97 อักขระ + ความยาวของค่า `<name>`, `<description>` และ `<location>` ที่ escape แบบ XML แล้ว

สูตร (อักขระ):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

การ escape แบบ XML จะขยาย `& < > " '` เป็น entity (`&amp;`, `&lt;` ฯลฯ)
ทำให้ความยาวเพิ่มขึ้น จำนวนโทเคนแตกต่างกันตาม tokenizer ของโมเดล โดยประมาณแบบ
OpenAI คือ ~4 อักขระ/โทเคน ดังนั้น **97 อักขระ ≈ 24 โทเคน** ต่อ
skill บวกความยาวจริงของฟิลด์ของคุณ

## วงจรชีวิตของ Skills ที่จัดการอยู่

OpenClaw มาพร้อมชุด Skills พื้นฐานในรูปแบบ **Skills ที่บันเดิลมา** พร้อมกับ
การติดตั้ง (แพ็กเกจ npm หรือ OpenClaw.app) `~/.openclaw/skills` มีไว้สำหรับ
การเขียนทับในเครื่อง เช่น การปักหมุดหรือแพตช์ skill โดยไม่เปลี่ยนแปลง
สำเนาที่บันเดิลมา Skills ใน workspace เป็นของผู้ใช้ และจะแทนที่
ทั้งสองแบบเมื่อชื่อชนกัน

## กำลังมองหา Skills เพิ่มเติม?

เรียกดู [https://clawhub.ai](https://clawhub.ai) สคีมาการกำหนดค่าแบบเต็ม:
[การกำหนดค่า Skills](/th/tools/skills-config)

## ที่เกี่ยวข้อง

- [ClawHub](/th/tools/clawhub) — รีจิสทรี Skills สาธารณะ
- [การสร้าง Skills](/th/tools/creating-skills) — การสร้าง Skills แบบกำหนดเอง
- [Plugins](/th/tools/plugin) — ภาพรวมระบบ Plugin
- [Plugin Skill Workshop](/th/plugins/skill-workshop) — สร้าง Skills จากงานของเอเจนต์
- [การกำหนดค่า Skills](/th/tools/skills-config) — เอกสารอ้างอิงการกำหนดค่า skill
- [คำสั่ง Slash](/th/tools/slash-commands) — คำสั่ง slash ทั้งหมดที่มีให้ใช้
