---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนการควบคุมการเปิดใช้งาน Skills, รายการอนุญาต หรือกฎการโหลด
    - การทำความเข้าใจลำดับความสำคัญของ Skills และลักษณะการทำงานของสแนปช็อต
sidebarTitle: Skills
summary: 'Skills: แบบจัดการเทียบกับพื้นที่ทำงาน, กฎการควบคุม, รายการอนุญาตของเอเจนต์ และการเชื่อมต่อ config'
title: Skills
x-i18n:
    generated_at: "2026-05-02T21:01:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw ใช้โฟลเดอร์ Skills ที่ **เข้ากันได้กับ [AgentSkills](https://agentskills.io)** เพื่อสอน agent ให้ใช้เครื่องมือต่าง ๆ แต่ละ skill คือไดเรกทอรีที่มี `SKILL.md` พร้อม YAML frontmatter และคำสั่งการใช้งาน OpenClaw โหลด Skills ที่มาพร้อมระบบ รวมถึง local overrides ที่เลือกใช้ได้ และกรองตอนโหลดตาม environment, config และการมีอยู่ของ binary

## ตำแหน่งและลำดับความสำคัญ

OpenClaw โหลด Skills จากแหล่งเหล่านี้ โดยเรียงจาก **ลำดับความสำคัญสูงสุดก่อน**:

| #   | แหล่งที่มา              | พาธ                             |
| --- | ----------------------- | -------------------------------- |
| 1   | Workspace skills        | `<workspace>/skills`             |
| 2   | Project agent skills    | `<workspace>/.agents/skills`     |
| 3   | Personal agent skills   | `~/.agents/skills`               |
| 4   | Managed/local skills    | `~/.openclaw/skills`             |
| 5   | Bundled skills          | มาพร้อมกับการติดตั้ง            |
| 6   | โฟลเดอร์ skill เพิ่มเติม | `skills.load.extraDirs` (config) |

หากชื่อ skill ชนกัน แหล่งที่มีลำดับความสำคัญสูงสุดจะชนะ

ไดเรกทอรี `$CODEX_HOME/skills` ดั้งเดิมของ Codex CLI ไม่ใช่หนึ่งในรากของ Skills ของ OpenClaw เหล่านี้ ในโหมด Codex harness การเปิด local app-server จะใช้ Codex home แยกตาม agent ดังนั้น Skills ส่วนตัวของ Codex CLI จะไม่ถูกโหลดโดยนัย ใช้ `openclaw migrate codex --dry-run` เพื่อทำรายการ และใช้ `openclaw migrate codex` เพื่อเลือกไดเรกทอรี skill ด้วยพรอมป์ checkbox แบบโต้ตอบ ก่อนคัดลอกเข้า workspace ของ OpenClaw agent ปัจจุบัน สำหรับการรันแบบไม่โต้ตอบ ให้ระบุ `--skill <name>` ซ้ำสำหรับ Skills ที่ต้องการคัดลอกแบบตรงชื่อ

## Skills ต่อ agent เทียบกับ Skills ที่ใช้ร่วมกัน

ในการตั้งค่าแบบ **multi-agent** agent แต่ละตัวมี workspace ของตัวเอง:

| ขอบเขต              | พาธ                                        | มองเห็นได้โดย                 |
| -------------------- | ------------------------------------------- | ----------------------------- |
| ต่อ agent            | `<workspace>/skills`                        | เฉพาะ agent นั้น              |
| Project-agent        | `<workspace>/.agents/skills`                | เฉพาะ agent ของ workspace นั้น |
| Personal-agent       | `~/.agents/skills`                          | agent ทั้งหมดบนเครื่องนั้น    |
| Shared managed/local | `~/.openclaw/skills`                        | agent ทั้งหมดบนเครื่องนั้น    |
| Shared extra dirs    | `skills.load.extraDirs` (ลำดับต่ำสุด)       | agent ทั้งหมดบนเครื่องนั้น    |

ชื่อเดียวกันในหลายตำแหน่ง → แหล่งที่มีลำดับความสำคัญสูงสุดจะชนะ Workspace ชนะ project-agent, ชนะ personal-agent, ชนะ managed/local, ชนะ bundled, ชนะ extra dirs

## allowlists ของ agent skill

**ตำแหน่ง** ของ skill และ **การมองเห็น** ของ skill เป็นการควบคุมคนละส่วนกัน ตำแหน่ง/ลำดับความสำคัญตัดสินว่าสำเนาใดของ skill ชื่อเดียวกันจะชนะ ส่วน allowlists ของ agent ตัดสินว่า agent สามารถใช้ Skills ใดได้จริง

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
  <Accordion title="กฎของ allowlist">
    - ละ `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
    - ละ `agents.list[].skills` เพื่อสืบทอด `agents.defaults.skills`
    - ตั้ง `agents.list[].skills: []` เพื่อไม่ให้มี Skills
    - รายการ `agents.list[].skills` ที่ไม่ว่างคือชุด **สุดท้าย** สำหรับ agent นั้น โดยจะไม่รวมกับค่าเริ่มต้น
    - allowlist ที่มีผลบังคับใช้จะถูกใช้กับการสร้าง prompt, การค้นหา slash-command ของ skill, การ sync sandbox และ snapshots ของ skill

  </Accordion>
</AccordionGroup>

## Plugins และ Skills

Plugins สามารถส่ง Skills ของตัวเองมาด้วยได้โดยระบุไดเรกทอรี `skills` ใน `openclaw.plugin.json` (พาธอิงจากรากของ Plugin) Plugin skills จะโหลดเมื่อ Plugin เปิดใช้งาน นี่คือที่ที่เหมาะสำหรับคู่มือการใช้งานเฉพาะเครื่องมือที่ยาวเกินไปสำหรับคำอธิบายเครื่องมือ แต่ควรพร้อมใช้งานทุกครั้งที่ติดตั้ง Plugin ตัวอย่างเช่น Plugin เบราว์เซอร์มี skill `browser-automation` สำหรับการควบคุมเบราว์เซอร์หลายขั้นตอน

ไดเรกทอรี Plugin skill จะถูกรวมเข้าในพาธลำดับความสำคัญต่ำเดียวกับ `skills.load.extraDirs` ดังนั้น bundled, managed, agent หรือ workspace skill ที่มีชื่อเดียวกันจะ override ได้ คุณสามารถ gate ได้ผ่าน `metadata.openclaw.requires.config` บนรายการ config ของ Plugin

ดู [Plugins](/th/tools/plugin) สำหรับการค้นหา/config และ [Tools](/th/tools) สำหรับพื้นผิวเครื่องมือที่ Skills เหล่านั้นสอน

## Skill Workshop

Plugin **Skill Workshop** แบบทดลองและเลือกใช้ได้ สามารถสร้างหรืออัปเดต workspace skills จากขั้นตอนที่ใช้ซ้ำได้ซึ่งสังเกตได้ระหว่างการทำงานของ agent โดยปิดใช้งานเป็นค่าเริ่มต้น และต้องเปิดใช้งานอย่างชัดเจนผ่าน `plugins.entries.skill-workshop`

Skill Workshop เขียนเฉพาะไปยัง `<workspace>/skills`, สแกนเนื้อหาที่สร้างขึ้น, รองรับการอนุมัติที่ค้างอยู่หรือการเขียนอัตโนมัติที่ปลอดภัย, กักกันข้อเสนอที่ไม่ปลอดภัย และรีเฟรช snapshot ของ skill หลังเขียนสำเร็จ เพื่อให้ Skills ใหม่พร้อมใช้งานโดยไม่ต้องรีสตาร์ท Gateway

ใช้สำหรับการแก้ไข เช่น _"ครั้งหน้า ให้ตรวจสอบ attribution ของ GIF"_ หรือ workflow ที่ได้มาจากประสบการณ์จริง เช่น checklist สำหรับ QA สื่อ เริ่มด้วยการอนุมัติที่ค้างอยู่ ใช้การเขียนอัตโนมัติเฉพาะใน workspace ที่เชื่อถือได้หลังจากตรวจทานข้อเสนอแล้ว คู่มือฉบับเต็ม: [Plugin Skill Workshop](/th/plugins/skill-workshop)

## ClawHub (ติดตั้งและ sync)

[ClawHub](https://clawhub.ai) คือ registry Skills สาธารณะสำหรับ OpenClaw ใช้คำสั่ง `openclaw skills` ดั้งเดิมสำหรับการค้นหา/ติดตั้ง/อัปเดต หรือใช้ CLI `clawhub` แยกต่างหากสำหรับ workflow เผยแพร่/sync คู่มือฉบับเต็ม: [ClawHub](/th/tools/clawhub)

| การกระทำ                         | คำสั่ง                                |
| ---------------------------------- | -------------------------------------- |
| ติดตั้ง skill เข้า workspace       | `openclaw skills install <skill-slug>` |
| อัปเดต Skills ที่ติดตั้งทั้งหมด    | `openclaw skills update --all`         |
| Sync (สแกน + เผยแพร่อัปเดต)        | `clawhub sync --all`                   |

`openclaw skills install` ดั้งเดิมจะติดตั้งลงในไดเรกทอรี `skills/` ของ workspace ที่ใช้งานอยู่ CLI `clawhub` ที่แยกต่างหากจะติดตั้งลงใน `./skills` ภายใต้ไดเรกทอรีทำงานปัจจุบันของคุณด้วย (หรือ fallback ไปยัง workspace ของ OpenClaw ที่กำหนดค่าไว้) OpenClaw จะรับสิ่งนั้นเป็น `<workspace>/skills` ในเซสชันถัดไป ราก skill ที่กำหนดค่าไว้ยังรองรับระดับการจัดกลุ่มหนึ่งระดับ เช่น `skills/<group>/<skill>/SKILL.md` เพื่อให้เก็บ Skills จาก third-party ที่เกี่ยวข้องไว้ใต้โฟลเดอร์ร่วมได้โดยไม่ต้องสแกนแบบ recursive กว้าง

หน้า skill ของ ClawHub แสดงสถานะการสแกนความปลอดภัยล่าสุดก่อนติดตั้ง พร้อมหน้ารายละเอียด scanner สำหรับ VirusTotal, ClawScan และ static analysis `openclaw skills install <slug>` ยังคงเป็นเฉพาะพาธติดตั้งเท่านั้น ผู้เผยแพร่กู้คืน false positives ได้ผ่าน dashboard ของ ClawHub หรือ `clawhub skill rescan <slug>`

## ความปลอดภัย

<Warning>
ปฏิบัติต่อ Skills จาก third-party เป็น **โค้ดที่ไม่เชื่อถือ** อ่านก่อนเปิดใช้งาน ควรใช้การรันแบบ sandboxed สำหรับ input ที่ไม่เชื่อถือและเครื่องมือที่มีความเสี่ยง ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการควบคุมฝั่ง agent
</Warning>

- การค้นหา workspace และ extra-dir skill จะยอมรับเฉพาะราก skill และไฟล์ `SKILL.md` ที่ realpath ที่ resolve แล้วอยู่ภายในรากที่กำหนดค่าไว้เท่านั้น
- การติดตั้ง dependency ของ skill ที่มี Gateway รองรับ (`skills.install`, onboarding และ UI การตั้งค่า Skills) จะรัน scanner dangerous-code ที่มีในระบบก่อนเรียกใช้ metadata ของ installer findings ระดับ `critical` จะบล็อกโดยค่าเริ่มต้น เว้นแต่ caller จะตั้ง dangerous override อย่างชัดเจน findings ที่น่าสงสัยยังคงเพียงเตือนเท่านั้น
- `openclaw skills install <slug>` แตกต่างออกไป โดยจะดาวน์โหลดโฟลเดอร์ skill ของ ClawHub ลงใน workspace และไม่ใช้พาธ installer-metadata ข้างต้น
- `skills.entries.*.env` และ `skills.entries.*.apiKey` inject secrets เข้าใน process ของ **host** สำหรับ turn ของ agent นั้น (ไม่ใช่ sandbox) อย่าให้ secrets อยู่ใน prompts และ logs

สำหรับ threat model และ checklists ที่กว้างขึ้น ดู [Security](/th/gateway/security)

## รูปแบบ SKILL.md

`SKILL.md` ต้องมีอย่างน้อย:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw ทำตาม spec ของ AgentSkills สำหรับ layout/intent parser ที่ใช้โดย agent แบบฝังรองรับเฉพาะคีย์ frontmatter แบบ **บรรทัดเดียว** เท่านั้น `metadata` ควรเป็น **ออบเจ็กต์ JSON บรรทัดเดียว** ใช้ `{baseDir}` ในคำสั่งการใช้งานเพื่ออ้างอิงพาธโฟลเดอร์ skill

### คีย์ frontmatter ที่เลือกใช้ได้

<ParamField path="homepage" type="string">
  URL ที่แสดงเป็น "เว็บไซต์" ใน UI Skills ของ macOS รองรับผ่าน `metadata.openclaw.homepage` ด้วย
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  เมื่อเป็น `true` skill จะถูกเปิดเผยเป็น slash command ของผู้ใช้
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  เมื่อเป็น `true` OpenClaw จะไม่นำคำสั่งการใช้งานของ skill ใส่ใน prompt ปกติของ agent skill ยังคงติดตั้งอยู่ และยังสามารถรันอย่างชัดเจนเป็น slash command ได้เมื่อ `user-invocable` เป็น `true` ด้วย
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  เมื่อตั้งเป็น `tool` slash command จะข้าม model และ dispatch ไปยังเครื่องมือโดยตรง
</ParamField>
<ParamField path="command-tool" type="string">
  ชื่อเครื่องมือที่จะเรียกใช้เมื่อตั้ง `command-dispatch: tool`
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  สำหรับ tool dispatch จะส่งต่อสตริง args ดิบไปยังเครื่องมือ (ไม่มีการ parse ใน core) เครื่องมือจะถูกเรียกด้วย `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
</ParamField>

## Gating (ตัวกรองตอนโหลด)

OpenClaw กรอง Skills ตอนโหลดโดยใช้ `metadata` (JSON บรรทัดเดียว):

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

ฟิลด์ภายใต้ `metadata.openclaw`:

<ParamField path="always" type="boolean">
  เมื่อเป็น `true` ให้รวม skill เสมอ (ข้าม gates อื่น)
</ParamField>
<ParamField path="emoji" type="string">
  emoji ที่เลือกใช้ได้สำหรับ UI Skills ของ macOS
</ParamField>
<ParamField path="homepage" type="string">
  URL ที่เลือกใช้ได้ซึ่งแสดงเป็น "เว็บไซต์" ใน UI Skills ของ macOS
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  รายการแพลตฟอร์มที่เลือกใช้ได้ หากตั้งค่าไว้ skill จะมีสิทธิ์ใช้ได้เฉพาะบน OSes เหล่านั้น
</ParamField>
<ParamField path="requires.bins" type="string[]">
  แต่ละรายการต้องมีอยู่บน `PATH`
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  อย่างน้อยหนึ่งรายการต้องมีอยู่บน `PATH`
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env var ต้องมีอยู่หรือถูกระบุใน config
</ParamField>
<ParamField path="requires.config" type="string[]">
  รายการพาธ `openclaw.json` ที่ต้องเป็น truthy
</ParamField>
<ParamField path="primaryEnv" type="string">
  ชื่อ Env var ที่เชื่อมโยงกับ `skills.entries.<name>.apiKey`
</ParamField>
<ParamField path="install" type="object[]">
  spec ของ installer ที่เลือกใช้ได้สำหรับ UI Skills ของ macOS (brew/node/go/uv/download)
</ParamField>

หากไม่มี `metadata.openclaw` skill จะมีสิทธิ์ใช้ได้เสมอ (เว้นแต่ถูกปิดใน config หรือถูกบล็อกโดย `skills.allowBundled` สำหรับ bundled skills)

<Note>
บล็อก `metadata.clawdbot` แบบ legacy ยังคงถูกยอมรับเมื่อไม่มี `metadata.openclaw` ดังนั้น Skills ที่ติดตั้งรุ่นเก่าจะยังคงมี dependency gates และ installer hints อยู่ Skills ใหม่และที่อัปเดตควรใช้ `metadata.openclaw`
</Note>

### หมายเหตุเกี่ยวกับ Sandboxing

- `requires.bins` ถูกตรวจบน **host** ตอนโหลด skill
- หาก agent อยู่ใน sandbox binary ต้องมีอยู่ **ภายใน container** ด้วย ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` (หรือ image แบบกำหนดเอง) `setupCommand` รันหนึ่งครั้งหลังสร้าง container แล้ว การติดตั้ง package ยังต้องมี network egress, root FS ที่เขียนได้ และ root user ใน sandbox
- ตัวอย่าง: skill `summarize` (`skills/summarize/SKILL.md`) ต้องมี CLI `summarize` ใน sandbox container เพื่อรันที่นั่น

### ข้อกำหนดตัวติดตั้ง

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
  <Accordion title="Installer selection rules">
    - หากมีตัวติดตั้งหลายรายการ Gateway จะเลือกตัวเลือกที่ต้องการเพียงรายการเดียว (`brew` เมื่อใช้ได้ มิฉะนั้นใช้ `node`)
    - หากตัวติดตั้งทั้งหมดเป็น `download` OpenClaw จะแสดงแต่ละรายการเพื่อให้คุณเห็นอาร์ติแฟกต์ที่มีอยู่
    - ข้อกำหนดตัวติดตั้งสามารถใส่ `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตัวเลือกตามแพลตฟอร์มได้
    - การติดตั้ง Node จะเคารพ `skills.install.nodeManager` ใน `openclaw.json` (ค่าเริ่มต้น: npm; ตัวเลือก: npm/pnpm/yarn/bun) การตั้งค่านี้มีผลกับการติดตั้ง Skills เท่านั้น; รันไทม์ของ Gateway ยังควรเป็น Node — ไม่แนะนำให้ใช้ Bun สำหรับ WhatsApp/Telegram
    - การเลือกตัวติดตั้งที่มี Gateway รองรับจะขับเคลื่อนด้วยลำดับความสำคัญ: เมื่อข้อกำหนดการติดตั้งผสมหลายชนิด OpenClaw จะเลือก Homebrew ก่อนเมื่อเปิดใช้ `skills.install.preferBrew` และมี `brew` อยู่ จากนั้นเลือก `uv` จากนั้นเลือกตัวจัดการ node ที่กำหนดค่าไว้ แล้วจึงใช้ทางเลือกสำรองอื่น เช่น `go` หรือ `download`
    - หากข้อกำหนดการติดตั้งทุกตัวเป็น `download` OpenClaw จะแสดงตัวเลือกดาวน์โหลดทั้งหมดแทนที่จะยุบเหลือเพียงตัวติดตั้งที่ต้องการรายการเดียว

  </Accordion>
  <Accordion title="Per-installer details">
    - **การติดตั้ง Go:** หากไม่มี `go` และมี `brew` อยู่ Gateway จะติดตั้ง Go ผ่าน Homebrew ก่อน และตั้งค่า `GOBIN` เป็น `bin` ของ Homebrew เมื่อทำได้
    - **การติดตั้งแบบดาวน์โหลด:** `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (ค่าเริ่มต้น: อัตโนมัติเมื่อตรวจพบ archive), `stripComponents`, `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)

  </Accordion>
</AccordionGroup>

## การแทนที่การกำหนดค่า

Skills ที่มาพร้อมแพ็กเกจและที่จัดการอยู่สามารถเปิดปิดและระบุค่า env ได้
ใต้ `skills.entries` ใน `~/.openclaw/openclaw.json`:

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
  `false` จะปิดใช้ Skill แม้ว่าจะมาพร้อมแพ็กเกจหรือติดตั้งไว้แล้วก็ตาม
  Skill `coding-agent` ที่มาพร้อมแพ็กเกจเป็นแบบเลือกเปิดใช้: ตั้งค่า
  `skills.entries.coding-agent.enabled: true` ก่อนเผยแพร่ให้เอเจนต์เห็น
  จากนั้นตรวจสอบให้แน่ใจว่าได้ติดตั้ง `claude`, `codex`, `opencode` หรือ `pi`
  อย่างใดอย่างหนึ่ง และยืนยันตัวตนสำหรับ CLI ของตัวเองแล้ว
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  ตัวช่วยอำนวยความสะดวกสำหรับ Skills ที่ประกาศ `metadata.openclaw.primaryEnv` รองรับข้อความธรรมดาหรือ SecretRef
</ParamField>
<ParamField path="env" type="Record<string, string>">
  ฉีดค่าเฉพาะเมื่อยังไม่ได้ตั้งค่าตัวแปรนั้นในโปรเซส
</ParamField>
<ParamField path="config" type="object">
  ถุงตัวเลือกเสริมสำหรับฟิลด์กำหนดเองราย Skill คีย์กำหนดเองต้องอยู่ที่นี่
</ParamField>
<ParamField path="allowBundled" type="string[]">
  รายการอนุญาตเสริมสำหรับ Skills ที่ **มาพร้อมแพ็กเกจ** เท่านั้น หากตั้งค่าไว้ เฉพาะ Skills ที่มาพร้อมแพ็กเกจในรายการเท่านั้นที่มีสิทธิ์ใช้งาน (Skills ที่จัดการอยู่/ใน workspace ไม่ได้รับผลกระทบ)
</ParamField>

หากชื่อ Skill มีเครื่องหมายยัติภังค์ ให้ใส่คีย์ในเครื่องหมายคำพูด (JSON5 อนุญาต
คีย์ที่ใส่เครื่องหมายคำพูด) โดยค่าเริ่มต้น คีย์กำหนดค่าจะตรงกับ **ชื่อ Skill** — หาก Skill
กำหนด `metadata.openclaw.skillKey` ให้ใช้คีย์นั้นใต้ `skills.entries`

<Note>
สำหรับการสร้าง/แก้ไขรูปภาพสต็อกภายใน OpenClaw ให้ใช้เครื่องมือหลัก
`image_generate` พร้อม `agents.defaults.imageGenerationModel` แทน
Skill ที่มาพร้อมแพ็กเกจ ตัวอย่าง Skill ที่นี่มีไว้สำหรับเวิร์กโฟลว์กำหนดเองหรือของบุคคลที่สาม
สำหรับการวิเคราะห์รูปภาพแบบเนทีฟ ให้ใช้เครื่องมือ `image` พร้อม
`agents.defaults.imageModel` หากคุณเลือก `openai/*`, `google/*`,
`fal/*` หรือโมเดลรูปภาพเฉพาะผู้ให้บริการรายอื่น ให้เพิ่มคีย์ auth/API ของผู้ให้บริการนั้นด้วย
</Note>

## การฉีดสภาพแวดล้อม

เมื่อการรันเอเจนต์เริ่มขึ้น OpenClaw จะ:

1. อ่านเมทาดาทา Skill
2. นำ `skills.entries.<key>.env` และ `skills.entries.<key>.apiKey` ไปใช้กับ `process.env`
3. สร้างพรอมป์ระบบด้วย Skills ที่ **มีสิทธิ์ใช้งาน**
4. กู้คืนสภาพแวดล้อมเดิมหลังการรันสิ้นสุด

การฉีดสภาพแวดล้อมถูก **จำกัดขอบเขตไว้ที่การรันเอเจนต์** ไม่ใช่สภาพแวดล้อม shell
แบบทั่วโลก

สำหรับ backend `claude-cli` ที่มาพร้อมแพ็กเกจ OpenClaw ยังสร้าง snapshot เดียวกันที่มีสิทธิ์ใช้งาน
เป็น Plugin Claude Code ชั่วคราวและส่งผ่านด้วย
`--plugin-dir` จากนั้น Claude Code จะใช้ตัวแก้ Skill แบบเนทีฟของตัวเองได้ ขณะที่
OpenClaw ยังเป็นเจ้าของลำดับความสำคัญ รายการอนุญาตรายเอเจนต์ การกำกับสิทธิ์ และ
การฉีด env/API key ของ `skills.entries.*` backend CLI อื่นใช้เฉพาะแคตตาล็อก
พรอมป์เท่านั้น

## Snapshot และการรีเฟรช

OpenClaw จะ snapshot Skills ที่มีสิทธิ์ใช้งาน **เมื่อเซสชันเริ่มต้น** และ
ใช้รายการนั้นซ้ำสำหรับเทิร์นถัดไปในเซสชันเดียวกัน การเปลี่ยนแปลงใน
Skills หรือการกำหนดค่าจะมีผลในเซสชันใหม่ครั้งถัดไป

Skills สามารถรีเฟรชระหว่างเซสชันได้ในสองกรณี:

- ตัวเฝ้าดู Skills เปิดใช้งานอยู่
- มีโหนดระยะไกลใหม่ที่มีสิทธิ์ใช้งานปรากฏขึ้น

ให้คิดว่านี่เป็น **hot reload**: รายการที่รีเฟรชแล้วจะถูกใช้ใน
เทิร์นเอเจนต์ถัดไป หากรายการอนุญาต Skill ของเอเจนต์ที่มีผลเปลี่ยนแปลงสำหรับ
เซสชันนั้น OpenClaw จะรีเฟรช snapshot เพื่อให้ Skills ที่มองเห็นได้สอดคล้อง
กับเอเจนต์ปัจจุบัน

### ตัวเฝ้าดู Skills

โดยค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ Skill และเพิ่มรุ่น snapshot ของ Skills
เมื่อไฟล์ `SKILL.md` เปลี่ยนแปลง กำหนดค่าใต้ `skills.load`:

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

### โหนด macOS ระยะไกล (Linux gateway)

หาก Gateway รันบน Linux แต่มี **โหนด macOS** เชื่อมต่ออยู่พร้อมอนุญาต
`system.run` (ความปลอดภัยของการอนุมัติ Exec ไม่ได้ตั้งเป็น `deny`)
OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์ใช้งานเมื่อมี
ไบนารีที่ต้องใช้บนโหนดนั้น เอเจนต์ควรเรียกใช้ Skills เหล่านั้น
ผ่านเครื่องมือ `exec` ด้วย `host=node`

สิ่งนี้อาศัยการที่โหนดรายงานการรองรับคำสั่งของตนและการ probe bin
ผ่าน `system.which` หรือ `system.run` โหนดออฟไลน์จะ **ไม่** ทำให้
Skills ที่ใช้ได้เฉพาะระยะไกลมองเห็นได้ หากโหนดที่เชื่อมต่อหยุดตอบการ probe bin
OpenClaw จะล้างรายการ bin ที่ตรงกันในแคช เพื่อให้เอเจนต์ไม่เห็น
Skills ที่ไม่สามารถรันที่นั่นได้ในขณะนี้อีกต่อไป

## ผลกระทบต่อโทเค็น

เมื่อ Skills มีสิทธิ์ใช้งาน OpenClaw จะฉีดรายการ XML ขนาดกะทัดรัดของ Skills
ที่มีอยู่เข้าไปในพรอมป์ระบบ (ผ่าน `formatSkillsForPrompt` ใน
`pi-coding-agent`) ต้นทุนเป็นแบบกำหนดแน่นอน:

- **ค่าใช้จ่ายพื้นฐาน** (เฉพาะเมื่อมี Skill ≥1 รายการ): 195 อักขระ
- **ต่อ Skill:** 97 อักขระ + ความยาวของค่า `<name>`, `<description>` และ `<location>` ที่ escape เป็น XML แล้ว

สูตร (อักขระ):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

การ escape XML จะขยาย `& < > " '` เป็น entities (`&amp;`, `&lt;` ฯลฯ)
ทำให้ความยาวเพิ่มขึ้น จำนวนโทเค็นแตกต่างกันตาม tokenizer ของโมเดล การประมาณแบบคร่าว ๆ
สไตล์ OpenAI คือ ~4 อักขระ/โทเค็น ดังนั้น **97 อักขระ ≈ 24 โทเค็น** ต่อ
Skill บวกความยาวฟิลด์จริงของคุณ

## วงจรชีวิตของ Skills ที่จัดการอยู่

OpenClaw จัดส่งชุด Skills พื้นฐานเป็น **Skills ที่มาพร้อมแพ็กเกจ** พร้อมกับการติดตั้ง
(แพ็กเกจ npm หรือ OpenClaw.app) `~/.openclaw/skills` มีไว้สำหรับ
การแทนที่ภายในเครื่อง — ตัวอย่างเช่น การ pin หรือ patch Skill โดยไม่
เปลี่ยนสำเนาที่มาพร้อมแพ็กเกจ Skills ใน workspace เป็นของผู้ใช้และแทนที่
ทั้งสองแบบเมื่อชื่อขัดแย้งกัน

## กำลังมองหา Skills เพิ่มเติมหรือไม่?

เรียกดู [https://clawhub.ai](https://clawhub.ai) สคีมาการกำหนดค่าแบบเต็ม:
[การกำหนดค่า Skills](/th/tools/skills-config)

## ที่เกี่ยวข้อง

- [ClawHub](/th/tools/clawhub) — รีจิสทรี Skills สาธารณะ
- [การสร้าง Skills](/th/tools/creating-skills) — การสร้าง Skills แบบกำหนดเอง
- [Plugins](/th/tools/plugin) — ภาพรวมระบบ Plugin
- [Plugin Skill Workshop](/th/plugins/skill-workshop) — สร้าง Skills จากงานของเอเจนต์
- [การกำหนดค่า Skills](/th/tools/skills-config) — เอกสารอ้างอิงการกำหนดค่า Skill
- [คำสั่ง Slash](/th/tools/slash-commands) — คำสั่ง Slash ทั้งหมดที่มีอยู่
