---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนแปลงการควบคุมการเข้าถึง Skills, รายการอนุญาต หรือกฎการโหลด
    - ทำความเข้าใจลำดับความสำคัญของ Skills และพฤติกรรมของสแนปช็อต
sidebarTitle: Skills
summary: 'Skills: แบบจัดการกับพื้นที่ทำงาน, กฎการผ่านเกณฑ์, รายการอนุญาตของเอเจนต์ และการเชื่อมโยงค่ากำหนด'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw ใช้โฟลเดอร์ Skills ที่**เข้ากันได้กับ [AgentSkills](https://agentskills.io)** เพื่อสอน agent ให้ใช้เครื่องมือ แต่ละ skill คือไดเรกทอรีที่มี `SKILL.md` พร้อม YAML frontmatter และคำแนะนำ OpenClaw โหลด Skills ที่มาพร้อมระบบรวมถึง local overrides ที่เลือกใช้ได้ และกรองสิ่งเหล่านี้ในช่วงโหลดตาม environment, config และการมีอยู่ของ binary

## ตำแหน่งและลำดับความสำคัญ

OpenClaw โหลด Skills จากแหล่งต่อไปนี้ โดยเรียงจาก**ลำดับความสำคัญสูงสุดก่อน**:

| #   | แหล่งที่มา             | พาธ                             |
| --- | ---------------------- | -------------------------------- |
| 1   | Workspace skills       | `<workspace>/skills`             |
| 2   | Project agent skills   | `<workspace>/.agents/skills`     |
| 3   | Personal agent skills  | `~/.agents/skills`               |
| 4   | Managed/local skills   | `~/.openclaw/skills`             |
| 5   | Bundled skills         | มาพร้อมกับการติดตั้ง             |
| 6   | โฟลเดอร์ Skills เพิ่มเติม | `skills.load.extraDirs` (config) |

หากชื่อ skill ซ้ำกัน แหล่งที่มีลำดับความสำคัญสูงสุดจะชนะ

ไดเรกทอรี `$CODEX_HOME/skills` ดั้งเดิมของ Codex CLI ไม่ใช่หนึ่งใน root ของ OpenClaw Skills เหล่านี้ ในโหมด Codex harness การเปิด local app-server จะใช้ Codex homes ที่แยกเฉพาะต่อ agent ดังนั้น Skills ส่วนตัวของ Codex CLI จะไม่ถูกโหลดโดยอัตโนมัติ ใช้ `openclaw migrate codex --dry-run` เพื่อทำรายการ และใช้ `openclaw migrate codex` เพื่อเลือกไดเรกทอรี Skills ด้วย checkbox prompt แบบโต้ตอบก่อนคัดลอกเข้าสู่ workspace ของ OpenClaw agent ปัจจุบัน สำหรับการรันแบบไม่โต้ตอบ ให้ใส่ `--skill <name>` ซ้ำสำหรับ Skills ที่ต้องการคัดลอกอย่างเจาะจง

## Skills เฉพาะต่อ agent เทียบกับ Skills ที่ใช้ร่วมกัน

ในการตั้งค่าแบบ **multi-agent** แต่ละ agent จะมี workspace ของตัวเอง:

| ขอบเขต               | พาธ                                        | มองเห็นได้สำหรับ             |
| -------------------- | ------------------------------------------- | ----------------------------- |
| ต่อ agent            | `<workspace>/skills`                        | เฉพาะ agent นั้นเท่านั้น     |
| Project-agent        | `<workspace>/.agents/skills`                | เฉพาะ agent ของ workspace นั้น |
| Personal-agent       | `~/.agents/skills`                          | agent ทั้งหมดบนเครื่องนั้น   |
| Shared managed/local | `~/.openclaw/skills`                        | agent ทั้งหมดบนเครื่องนั้น   |
| Shared extra dirs    | `skills.load.extraDirs` (ลำดับความสำคัญต่ำสุด) | agent ทั้งหมดบนเครื่องนั้น   |

ชื่อเดียวกันในหลายตำแหน่ง → แหล่งที่มีลำดับความสำคัญสูงสุดจะชนะ Workspace ชนะ project-agent, ชนะ personal-agent, ชนะ managed/local, ชนะ bundled, ชนะ extra dirs

## allowlists ของ agent skill

**ตำแหน่ง**ของ skill และ**การมองเห็น**ของ skill เป็นการควบคุมคนละส่วน Location/precedence ตัดสินว่าสำเนาใดของ skill ชื่อเดียวกันจะชนะ ส่วน allowlists ของ agent ตัดสินว่า agent สามารถใช้ Skills ใดได้จริง

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
  <Accordion title="กฎ allowlist">
    - ละ `agents.defaults.skills` เพื่อให้ค่าเริ่มต้นใช้ Skills ได้แบบไม่จำกัด
    - ละ `agents.list[].skills` เพื่อสืบทอด `agents.defaults.skills`
    - ตั้ง `agents.list[].skills: []` เพื่อไม่ให้มี Skills
    - รายการ `agents.list[].skills` ที่ไม่ว่างคือชุด**สุดท้าย**สำหรับ agent นั้น โดยจะไม่ merge กับ defaults
    - allowlist ที่มีผลจะถูกใช้ครอบคลุมทั้งการสร้าง prompt, การค้นพบ slash-command ของ skill, sandbox sync และ skill snapshots

  </Accordion>
</AccordionGroup>

## Plugins และ Skills

Plugins สามารถมาพร้อม Skills ของตัวเองได้โดยระบุไดเรกทอรี `skills` ใน `openclaw.plugin.json` (พาธสัมพันธ์กับ root ของ Plugin) Plugin Skills จะโหลดเมื่อ Plugin ถูกเปิดใช้งาน นี่คือที่ที่เหมาะสำหรับคู่มือการใช้งานเฉพาะเครื่องมือที่ยาวเกินไปสำหรับคำอธิบายเครื่องมือ แต่ควรพร้อมใช้งานเมื่อใดก็ตามที่ Plugin ถูกติดตั้ง เช่น browser Plugin มาพร้อม skill `browser-automation` สำหรับการควบคุมเบราว์เซอร์หลายขั้นตอน

ไดเรกทอรี Plugin skill จะถูก merge เข้าในพาธลำดับความสำคัญต่ำเดียวกับ `skills.load.extraDirs` ดังนั้น bundled, managed, agent หรือ workspace skill ที่มีชื่อเดียวกันจะ override สิ่งเหล่านี้ คุณสามารถ gate สิ่งเหล่านี้ผ่าน `metadata.openclaw.requires.config` บน config entry ของ Plugin ได้

ดู [Plugins](/th/tools/plugin) สำหรับ discovery/config และ [Tools](/th/tools) สำหรับพื้นผิวเครื่องมือที่ Skills เหล่านั้นสอน

## Skill Workshop

Plugin **Skill Workshop** ที่เป็นตัวเลือกและอยู่ในขั้นทดลองสามารถสร้างหรืออัปเดต workspace Skills จากขั้นตอนที่ใช้ซ้ำได้ซึ่งสังเกตพบระหว่างการทำงานของ agent โดยค่าเริ่มต้นจะถูกปิดใช้งานและต้องเปิดใช้งานอย่างชัดเจนผ่าน `plugins.entries.skill-workshop`

Skill Workshop เขียนเฉพาะไปยัง `<workspace>/skills`, สแกนเนื้อหาที่สร้างขึ้น, รองรับ pending approval หรือการเขียนที่ปลอดภัยแบบอัตโนมัติ, กักกันข้อเสนอที่ไม่ปลอดภัย และ refresh skill snapshot หลังจากเขียนสำเร็จ เพื่อให้ Skills ใหม่พร้อมใช้งานโดยไม่ต้อง restart Gateway

ใช้สำหรับการแก้ไข เช่น _"ครั้งหน้า ให้ตรวจสอบที่มาของ GIF"_ หรือ workflow ที่ได้มาจากประสบการณ์จริง เช่น checklist สำหรับ media QA เริ่มด้วย pending approval; ใช้การเขียนอัตโนมัติเฉพาะใน workspace ที่เชื่อถือได้หลังจากตรวจสอบข้อเสนอแล้ว คู่มือฉบับเต็ม: [Skill Workshop plugin](/th/plugins/skill-workshop)

## ClawHub (ติดตั้งและซิงค์)

[ClawHub](https://clawhub.ai) คือ registry สาธารณะของ Skills สำหรับ OpenClaw ใช้คำสั่ง `openclaw skills` ดั้งเดิมสำหรับ discover/install/update หรือใช้ CLI `clawhub` แยกต่างหากสำหรับ workflow publish/sync คู่มือฉบับเต็ม: [ClawHub](/th/tools/clawhub)

| การดำเนินการ                         | คำสั่ง                                 |
| ------------------------------------ | -------------------------------------- |
| ติดตั้ง skill เข้าสู่ workspace      | `openclaw skills install <skill-slug>` |
| อัปเดต Skills ที่ติดตั้งทั้งหมด      | `openclaw skills update --all`         |
| ซิงค์ (สแกน + publish updates)       | `clawhub sync --all`                   |

`openclaw skills install` ดั้งเดิมจะติดตั้งลงในไดเรกทอรี `skills/` ของ workspace ที่ใช้งานอยู่ CLI `clawhub` แยกต่างหากจะติดตั้งลงใน `./skills` ภายใต้ current working directory ของคุณด้วย (หรือ fallback ไปยัง workspace ของ OpenClaw ที่กำหนดค่าไว้) OpenClaw จะรับสิ่งนั้นเป็น `<workspace>/skills` ใน session ถัดไป
root ของ Skills ที่กำหนดค่าไว้ยังรองรับระดับการจัดกลุ่มหนึ่งระดับ เช่น `skills/<group>/<skill>/SKILL.md` เพื่อให้ Skills จาก third-party ที่เกี่ยวข้องถูกเก็บไว้ภายใต้โฟลเดอร์ร่วมกันได้โดยไม่ต้องสแกนแบบ recursive กว้าง

หน้า skill ของ ClawHub แสดงสถานะการสแกนความปลอดภัยล่าสุดก่อนติดตั้ง พร้อมหน้ารายละเอียด scanner สำหรับ VirusTotal, ClawScan และ static analysis `openclaw skills install <slug>` ยังคงเป็นเพียงพาธสำหรับติดตั้งเท่านั้น ส่วน publishers กู้คืน false positives ผ่าน dashboard ของ ClawHub หรือ `clawhub skill rescan <slug>`

## ความปลอดภัย

<Warning>
ถือว่า third-party Skills เป็น**โค้ดที่ไม่น่าเชื่อถือ** อ่านก่อนเปิดใช้งาน ควรใช้การรันแบบ sandbox สำหรับอินพุตที่ไม่น่าเชื่อถือและเครื่องมือที่มีความเสี่ยง ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการควบคุมฝั่ง agent
</Warning>

- การค้นพบ Skills ใน workspace และ extra-dir รับเฉพาะ skill roots และไฟล์ `SKILL.md` ที่ resolved realpath ยังคงอยู่ภายใน root ที่กำหนดค่าไว้
- การติดตั้ง dependency ของ skill ที่อาศัย Gateway (`skills.install`, onboarding และ UI การตั้งค่า Skills) จะรัน dangerous-code scanner ในตัวก่อนดำเนินการ metadata ของ installer findings ระดับ `critical` จะบล็อกโดยค่าเริ่มต้น เว้นแต่ caller จะตั้ง dangerous override อย่างชัดเจน; findings ที่น่าสงสัยยังคงเตือนเท่านั้น
- `openclaw skills install <slug>` แตกต่างออกไป โดยจะดาวน์โหลดโฟลเดอร์ skill ของ ClawHub เข้า workspace และไม่ใช้พาธ installer-metadata ข้างต้น
- `skills.entries.*.env` และ `skills.entries.*.apiKey` inject secrets เข้าไปใน process ของ **host** สำหรับ agent turn นั้น (ไม่ใช่ sandbox) เก็บ secrets ให้อยู่นอก prompts และ logs

สำหรับ threat model และ checklists ที่กว้างขึ้น ดู [Security](/th/gateway/security)

## รูปแบบ SKILL.md

`SKILL.md` ต้องมีอย่างน้อย:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw ทำตามสเปก AgentSkills สำหรับ layout/intent parser ที่ใช้โดย embedded agent รองรับเฉพาะ frontmatter keys แบบ**บรรทัดเดียว**เท่านั้น; `metadata` ควรเป็น**วัตถุ JSON บรรทัดเดียว** ใช้ `{baseDir}` ในคำแนะนำเพื่ออ้างอิงพาธโฟลเดอร์ skill

### frontmatter keys ที่เลือกใช้ได้

<ParamField path="homepage" type="string">
  URL ที่แสดงเป็น "เว็บไซต์" ใน UI macOS Skills รองรับผ่าน `metadata.openclaw.homepage` ด้วย
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  เมื่อเป็น `true` skill จะถูกแสดงเป็น slash command ของผู้ใช้
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  เมื่อเป็น `true` skill จะถูกตัดออกจาก model prompt (ยังคงพร้อมใช้งานผ่านการเรียกใช้โดยผู้ใช้)
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  เมื่อตั้งเป็น `tool` slash command จะข้าม model และ dispatch ไปยังเครื่องมือโดยตรง
</ParamField>
<ParamField path="command-tool" type="string">
  ชื่อเครื่องมือที่จะเรียกใช้เมื่อตั้งค่า `command-dispatch: tool`
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  สำหรับ tool dispatch จะส่งต่อสตริง args ดิบไปยังเครื่องมือ (ไม่มี core parsing) เครื่องมือจะถูกเรียกด้วย `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
</ParamField>

## Gating (load-time filters)

OpenClaw กรอง Skills ในช่วงโหลดโดยใช้ `metadata` (JSON บรรทัดเดียว):

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
  emoji ทางเลือกที่ใช้โดย UI macOS Skills
</ParamField>
<ParamField path="homepage" type="string">
  URL ทางเลือกที่แสดงเป็น "เว็บไซต์" ใน UI macOS Skills
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  รายการ platforms ทางเลือก หากตั้งค่าไว้ skill จะมีสิทธิ์ใช้งานเฉพาะบน OS เหล่านั้น
</ParamField>
<ParamField path="requires.bins" type="string[]">
  แต่ละรายการต้องมีอยู่บน `PATH`
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  อย่างน้อยหนึ่งรายการต้องมีอยู่บน `PATH`
</ParamField>
<ParamField path="requires.env" type="string[]">
  env var ต้องมีอยู่หรือถูกระบุไว้ใน config
</ParamField>
<ParamField path="requires.config" type="string[]">
  รายการพาธ `openclaw.json` ที่ต้องมีค่า truthy
</ParamField>
<ParamField path="primaryEnv" type="string">
  ชื่อ env var ที่เชื่อมโยงกับ `skills.entries.<name>.apiKey`
</ParamField>
<ParamField path="install" type="object[]">
  สเปก installer ทางเลือกที่ใช้โดย UI macOS Skills (brew/node/go/uv/download)
</ParamField>

หากไม่มี `metadata.openclaw` skill จะมีสิทธิ์ใช้งานเสมอ (เว้นแต่ถูกปิดใช้งานใน config หรือถูกบล็อกโดย `skills.allowBundled` สำหรับ bundled skills)

<Note>
บล็อก `metadata.clawdbot` แบบเดิมยังคงยอมรับเมื่อไม่มี `metadata.openclaw` เพื่อให้ Skills เก่าที่ติดตั้งไว้ยังคงรักษา dependency gates และ installer hints ของตนไว้ Skills ใหม่และที่อัปเดตควรใช้ `metadata.openclaw`
</Note>

### หมายเหตุเกี่ยวกับ Sandboxing

- `requires.bins` จะถูกตรวจบน **host** ในช่วงโหลด skill
- หาก agent ถูก sandbox, binary ต้องมีอยู่**ภายใน container** ด้วย ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` (หรือ custom image) `setupCommand` จะรันหนึ่งครั้งหลังจาก container ถูกสร้างขึ้น Package installs ต้องมี network egress, root FS ที่เขียนได้ และ root user ใน sandbox ด้วย
- ตัวอย่าง: skill `summarize` (`skills/summarize/SKILL.md`) ต้องมี CLI `summarize` ใน sandbox container เพื่อรันที่นั่น

### สเปก installer

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
    - หากมีตัวติดตั้งหลายรายการ Gateway จะเลือกตัวเลือกที่ต้องการเพียงรายการเดียว (`brew` เมื่อใช้งานได้ มิฉะนั้นใช้ `node`)
    - หากตัวติดตั้งทั้งหมดเป็น `download` OpenClaw จะแสดงแต่ละรายการเพื่อให้คุณเห็นอาร์ติแฟกต์ที่มีให้ใช้
    - สเปกตัวติดตั้งสามารถใส่ `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตัวเลือกตามแพลตฟอร์มได้
    - การติดตั้งด้วย Node จะใช้ `skills.install.nodeManager` ใน `openclaw.json` (ค่าเริ่มต้น: npm; ตัวเลือก: npm/pnpm/yarn/bun) ค่านี้มีผลเฉพาะกับการติดตั้ง Skills เท่านั้น; รันไทม์ของ Gateway ยังควรเป็น Node — ไม่แนะนำให้ใช้ Bun สำหรับ WhatsApp/Telegram
    - การเลือกตัวติดตั้งที่รองรับโดย Gateway ขับเคลื่อนด้วยค่ากำหนด: เมื่อสเปกการติดตั้งผสมหลายชนิด OpenClaw จะเลือก Homebrew ก่อนเมื่อเปิดใช้ `skills.install.preferBrew` และมี `brew` อยู่ จากนั้นเลือก `uv` จากนั้นตัวจัดการ Node ที่กำหนดค่าไว้ แล้วจึงใช้ทางสำรองอื่น เช่น `go` หรือ `download`
    - หากสเปกการติดตั้งทุกตัวเป็น `download` OpenClaw จะแสดงตัวเลือกดาวน์โหลดทั้งหมดแทนที่จะยุบเหลือเพียงตัวติดตั้งที่ต้องการหนึ่งรายการ

  </Accordion>
  <Accordion title="รายละเอียดแยกตามตัวติดตั้ง">
    - **การติดตั้ง Go:** หากไม่มี `go` และมี `brew` อยู่ Gateway จะติดตั้ง Go ผ่าน Homebrew ก่อน และตั้งค่า `GOBIN` เป็น `bin` ของ Homebrew เมื่อทำได้
    - **การติดตั้งแบบดาวน์โหลด:** `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (ค่าเริ่มต้น: อัตโนมัติเมื่อตรวจพบไฟล์เก็บถาวร), `stripComponents`, `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)

  </Accordion>
</AccordionGroup>

## การแทนที่ค่าคอนฟิก

Skills ที่บันเดิลมาและที่จัดการโดยระบบสามารถเปิด/ปิดและใส่ค่า env ได้
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
  `false` จะปิดใช้ Skill แม้ว่าจะถูกบันเดิลมาหรือติดตั้งไว้แล้วก็ตาม
  Skill `coding-agent` ที่บันเดิลมาเป็นแบบต้องเลือกใช้เอง: ตั้งค่า
  `skills.entries.coding-agent.enabled: true` ก่อนเปิดเผยให้เอเจนต์เห็น
  จากนั้นตรวจสอบให้แน่ใจว่ามีการติดตั้งและยืนยันตัวตน CLI ของตัวเองสำหรับหนึ่งใน `claude`, `codex`, `opencode`, หรือ `pi` แล้ว
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  ความสะดวกสำหรับ Skills ที่ประกาศ `metadata.openclaw.primaryEnv` รองรับข้อความธรรมดาหรือ SecretRef
</ParamField>
<ParamField path="env" type="Record<string, string>">
  ฉีดค่าเฉพาะเมื่อยังไม่ได้ตั้งค่าตัวแปรนั้นในโปรเซส
</ParamField>
<ParamField path="config" type="object">
  ถุงค่าเพิ่มเติมสำหรับฟิลด์เฉพาะ Skill แบบกำหนดเอง คีย์แบบกำหนดเองต้องอยู่ที่นี่
</ParamField>
<ParamField path="allowBundled" type="string[]">
  รายการอนุญาตแบบไม่บังคับสำหรับ Skills ที่ **บันเดิลมา** เท่านั้น หากตั้งค่าไว้ จะมีเฉพาะ Skills ที่บันเดิลมาในรายการเท่านั้นที่มีสิทธิ์ใช้งาน (ไม่กระทบ Skills ที่จัดการโดยระบบ/ในเวิร์กสเปซ)
</ParamField>

หากชื่อ Skill มีขีดกลาง ให้ใส่เครื่องหมายคำพูดให้คีย์ (JSON5 อนุญาตให้ใช้
คีย์ที่อยู่ในเครื่องหมายคำพูดได้) โดยค่าเริ่มต้น คีย์คอนฟิกจะตรงกับ **ชื่อ Skill** — หาก Skill
กำหนด `metadata.openclaw.skillKey` ให้ใช้คีย์นั้นภายใต้ `skills.entries`

<Note>
สำหรับการสร้าง/แก้ไขภาพสต็อกภายใน OpenClaw ให้ใช้เครื่องมือหลัก
`image_generate` พร้อม `agents.defaults.imageGenerationModel` แทน
Skill ที่บันเดิลมา ตัวอย่าง Skill ที่นี่มีไว้สำหรับเวิร์กโฟลว์แบบกำหนดเองหรือของบุคคลที่สาม
สำหรับการวิเคราะห์ภาพแบบเนทีฟ ให้ใช้เครื่องมือ `image` พร้อม
`agents.defaults.imageModel` หากคุณเลือก `openai/*`, `google/*`,
`fal/*`, หรือโมเดลภาพเฉพาะผู้ให้บริการอื่น ให้เพิ่มคีย์ยืนยันตัวตน/API ของผู้ให้บริการนั้นด้วย
</Note>

## การฉีดสภาพแวดล้อม

เมื่อการรันเอเจนต์เริ่มต้น OpenClaw จะ:

1. อ่านเมทาดาทาของ Skill
2. นำ `skills.entries.<key>.env` และ `skills.entries.<key>.apiKey` ไปใช้กับ `process.env`
3. สร้างพรอมต์ระบบด้วย Skills ที่ **มีสิทธิ์ใช้งาน**
4. คืนค่าสภาพแวดล้อมเดิมหลังจากการรันสิ้นสุด

การฉีดสภาพแวดล้อมมี **ขอบเขตเฉพาะการรันของเอเจนต์** ไม่ใช่สภาพแวดล้อมของเชลล์ทั่วระบบ

สำหรับแบ็กเอนด์ `claude-cli` ที่บันเดิลมา OpenClaw ยังทำให้สแนปช็อตที่มีสิทธิ์ใช้งานเดียวกัน
กลายเป็น Plugin ชั่วคราวของ Claude Code และส่งต่อด้วย
`--plugin-dir` จากนั้น Claude Code สามารถใช้ตัวแก้ Skill แบบเนทีฟของตัวเองได้ ในขณะที่
OpenClaw ยังคงเป็นเจ้าของลำดับความสำคัญ รายการอนุญาตต่อเอเจนต์ การกั้นสิทธิ์ และ
การฉีดค่า env/API key ของ `skills.entries.*` แบ็กเอนด์ CLI อื่นจะใช้เฉพาะ
แคตตาล็อกพรอมต์เท่านั้น

## สแนปช็อตและการรีเฟรช

OpenClaw จะสแนปช็อต Skills ที่มีสิทธิ์ใช้งาน **เมื่อเซสชันเริ่มต้น** และ
นำรายการนั้นกลับมาใช้ซ้ำสำหรับเทิร์นถัดไปในเซสชันเดียวกัน การเปลี่ยนแปลงต่อ
Skills หรือคอนฟิกจะมีผลในเซสชันใหม่ครั้งถัดไป

Skills สามารถรีเฟรชกลางเซสชันได้ในสองกรณี:

- เปิดใช้งานตัวเฝ้าดู Skills
- โหนดระยะไกลใหม่ที่มีสิทธิ์ใช้งานปรากฏขึ้น

ให้คิดว่านี่เป็น **hot reload**: รายการที่รีเฟรชจะถูกหยิบใช้ใน
เทิร์นถัดไปของเอเจนต์ หากรายการอนุญาต Skill ของเอเจนต์ที่มีผลเปลี่ยนไปสำหรับ
เซสชันนั้น OpenClaw จะรีเฟรชสแนปช็อตเพื่อให้ Skills ที่มองเห็นสอดคล้อง
กับเอเจนต์ปัจจุบัน

### ตัวเฝ้าดู Skills

โดยค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ Skill และเพิ่มเวอร์ชันสแนปช็อตของ Skills
เมื่อไฟล์ `SKILL.md` เปลี่ยน กำหนดค่าภายใต้ `skills.load`:

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

หาก Gateway ทำงานบน Linux แต่มี **โหนด macOS** เชื่อมต่ออยู่พร้อม
อนุญาต `system.run` (ความปลอดภัยการอนุมัติ Exec ไม่ได้ตั้งเป็น `deny`)
OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์ใช้งานเมื่อมี
ไบนารีที่จำเป็นอยู่บนโหนดนั้น เอเจนต์ควรเรียกใช้ Skills เหล่านั้น
ผ่านเครื่องมือ `exec` ด้วย `host=node`

สิ่งนี้อาศัยการที่โหนดรายงานการรองรับคำสั่งของตน และอาศัยการตรวจสอบ bin
ผ่าน `system.which` หรือ `system.run` โหนดออฟไลน์ **ไม่** ทำให้
Skills ที่ใช้ได้เฉพาะระยะไกลมองเห็นได้ หากโหนดที่เชื่อมต่ออยู่หยุดตอบการตรวจสอบ bin
OpenClaw จะล้างรายการ bin ที่ตรงกันในแคช เพื่อให้เอเจนต์ไม่เห็น
Skills ที่ไม่สามารถรันที่นั่นได้ในขณะนี้อีกต่อไป

## ผลกระทบต่อโทเค็น

เมื่อ Skills มีสิทธิ์ใช้งาน OpenClaw จะฉีดรายการ XML แบบกะทัดรัดของ
Skills ที่มีให้ใช้เข้าไปในพรอมต์ระบบ (ผ่าน `formatSkillsForPrompt` ใน
`pi-coding-agent`) ค่าใช้จ่ายเป็นแบบกำหนดแน่นอน:

- **โอเวอร์เฮดพื้นฐาน** (เฉพาะเมื่อมี Skill ≥1 รายการ): 195 อักขระ
- **ต่อ Skill:** 97 อักขระ + ความยาวของค่า `<name>`, `<description>`, และ `<location>` ที่ผ่านการ XML-escape แล้ว

สูตร (อักขระ):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

การ escape XML จะขยาย `& < > " '` เป็นเอนทิตี (`&amp;`, `&lt;`, ฯลฯ)
ทำให้ความยาวเพิ่มขึ้น จำนวนโทเค็นแตกต่างกันตาม tokenizer ของโมเดล ค่าประมาณคร่าว ๆ
แบบ OpenAI คือ ~4 อักขระ/โทเค็น ดังนั้น **97 อักขระ ≈ 24 โทเค็น** ต่อ
Skill บวกกับความยาวฟิลด์จริงของคุณ

## วงจรชีวิตของ Skills ที่จัดการโดยระบบ

OpenClaw มาพร้อมชุด Skills พื้นฐานเป็น **Skills ที่บันเดิลมา** พร้อมการ
ติดตั้ง (แพ็กเกจ npm หรือ OpenClaw.app) `~/.openclaw/skills` มีไว้สำหรับ
การแทนที่ในเครื่อง — ตัวอย่างเช่น การปักหมุดหรือแพตช์ Skill โดยไม่
เปลี่ยนสำเนาที่บันเดิลมา Skills ในเวิร์กสเปซเป็นของผู้ใช้และจะแทนที่
ทั้งสองอย่างเมื่อชื่อชนกัน

## กำลังมองหา Skills เพิ่มเติมอยู่หรือไม่

เรียกดู [https://clawhub.ai](https://clawhub.ai) สคีมาคอนฟิกเต็ม:
[คอนฟิก Skills](/th/tools/skills-config)

## ที่เกี่ยวข้อง

- [ClawHub](/th/tools/clawhub) — รีจิสทรี Skills สาธารณะ
- [การสร้าง Skills](/th/tools/creating-skills) — การสร้าง Skills แบบกำหนดเอง
- [Plugins](/th/tools/plugin) — ภาพรวมระบบ Plugin
- [Plugin Skill Workshop](/th/plugins/skill-workshop) — สร้าง Skills จากงานของเอเจนต์
- [คอนฟิก Skills](/th/tools/skills-config) — เอกสารอ้างอิงการกำหนดค่า Skill
- [คำสั่งสแลช](/th/tools/slash-commands) — คำสั่งสแลชทั้งหมดที่มีให้ใช้
