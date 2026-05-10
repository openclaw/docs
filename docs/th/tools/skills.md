---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนการควบคุมการเข้าถึง Skills, รายการอนุญาต หรือกฎการโหลด
    - ทำความเข้าใจลำดับความสำคัญของ Skills และพฤติกรรมสแนปชอต
sidebarTitle: Skills
summary: 'Skills: แบบจัดการโดยระบบกับแบบพื้นที่ทำงาน, กฎการควบคุม, รายการอนุญาตของเอเจนต์ และการเชื่อมต่อ config'
title: Skills
x-i18n:
    generated_at: "2026-05-10T20:01:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw ใช้โฟลเดอร์ skill ที่ **เข้ากันได้กับ [AgentSkills](https://agentskills.io)** เพื่อสอนให้ agent รู้วิธีใช้เครื่องมือ แต่ละ skill คือไดเรกทอรีที่มี `SKILL.md` พร้อม YAML frontmatter และคำแนะนำ OpenClaw โหลด skills ที่มาพร้อมระบบรวมถึงการ override แบบ local ที่เลือกได้ และกรอง skills เหล่านั้นในเวลาที่โหลดตาม environment, config และการมีอยู่ของ binary

## ตำแหน่งและลำดับความสำคัญ

OpenClaw โหลด skills จากแหล่งเหล่านี้ โดยเรียงจาก **ลำดับความสำคัญสูงสุดก่อน**:

| #   | แหล่งที่มา                | Path                             |
| --- | --------------------- | -------------------------------- |
| 1   | Workspace skills      | `<workspace>/skills`             |
| 2   | Project agent skills  | `<workspace>/.agents/skills`     |
| 3   | Personal agent skills | `~/.agents/skills`               |
| 4   | Managed/local skills  | `~/.openclaw/skills`             |
| 5   | Bundled skills        | มาพร้อมกับการติดตั้ง         |
| 6   | โฟลเดอร์ skill เพิ่มเติม   | `skills.load.extraDirs` (config) |

หากชื่อ skill ซ้ำกัน แหล่งที่มีลำดับความสำคัญสูงสุดจะเป็นฝ่ายชนะ

ไดเรกทอรี `$CODEX_HOME/skills` ดั้งเดิมของ Codex CLI ไม่ใช่หนึ่งในราก skill ของ OpenClaw เหล่านี้ ในโหมด Codex harness การเปิด local app-server จะใช้ Codex homes แบบแยกเฉพาะต่อ agent ดังนั้น skills ส่วนตัวของ Codex CLI จะไม่ถูกโหลดโดยอัตโนมัติ ใช้ `openclaw migrate codex --dry-run` เพื่อทำ inventory และใช้ `openclaw migrate codex` เพื่อเลือกไดเรกทอรี skill ด้วย prompt checkbox แบบโต้ตอบก่อนคัดลอกเข้าไปยัง workspace ของ OpenClaw agent ปัจจุบัน สำหรับการรันแบบไม่โต้ตอบ ให้ระบุ `--skill <name>` ซ้ำสำหรับ skills ที่ต้องการคัดลอกให้ตรงชื่อ

## Skills แบบต่อ agent เทียบกับแบบแชร์

ในการตั้งค่า **multi-agent** แต่ละ agent มี workspace ของตัวเอง:

| ขอบเขต                | Path                                        | มองเห็นได้โดย                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| ต่อ agent            | `<workspace>/skills`                        | เฉพาะ agent นั้น             |
| Project-agent        | `<workspace>/.agents/skills`                | เฉพาะ agent ของ workspace นั้น |
| Personal-agent       | `~/.agents/skills`                          | ทุก agents บนเครื่องนั้น  |
| Shared managed/local | `~/.openclaw/skills`                        | ทุก agents บนเครื่องนั้น  |
| Shared extra dirs    | `skills.load.extraDirs` (ลำดับความสำคัญต่ำสุด) | ทุก agents บนเครื่องนั้น  |

ชื่อเดียวกันในหลายตำแหน่ง → แหล่งที่มีลำดับความสำคัญสูงสุดชนะ Workspace ชนะ project-agent, ชนะ personal-agent, ชนะ managed/local, ชนะ bundled, ชนะ extra dirs

## allowlists ของ agent skill

**ตำแหน่ง** ของ skill และ **การมองเห็น** ของ skill เป็นการควบคุมคนละส่วน
ตำแหน่ง/ลำดับความสำคัญตัดสินว่าสำเนาใดของ skill ชื่อเดียวกันจะชนะ ส่วน allowlists ของ agent ตัดสินว่า agent สามารถใช้ skills ใดได้จริง

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
    - ละ `agents.defaults.skills` เพื่อให้ skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
    - ละ `agents.list[].skills` เพื่อสืบทอด `agents.defaults.skills`
    - ตั้ง `agents.list[].skills: []` เพื่อไม่ให้มี skills
    - รายการ `agents.list[].skills` ที่ไม่ว่างคือชุด **สุดท้าย** สำหรับ agent นั้น - ไม่ merge กับ defaults
    - allowlist ที่มีผลจะถูกใช้กับการสร้าง prompt, การค้นหา slash-command ของ skill, การ sync sandbox และ snapshots ของ skill

  </Accordion>
</AccordionGroup>

## Plugins และ skills

Plugins สามารถส่ง skills ของตัวเองมาพร้อมระบบได้โดยระบุไดเรกทอรี `skills` ใน `openclaw.plugin.json` (paths สัมพัทธ์กับรากของ plugin) Plugin skills จะโหลดเมื่อเปิดใช้งาน plugin นี่คือตำแหน่งที่เหมาะสำหรับคู่มือการใช้งานเฉพาะเครื่องมือที่ยาวเกินกว่าจะอยู่ในคำอธิบายเครื่องมือ แต่ควรพร้อมใช้งานเมื่อ plugin ถูกติดตั้ง เช่น browser plugin มาพร้อม skill `browser-automation` สำหรับการควบคุม browser หลายขั้นตอน

ไดเรกทอรี skill ของ Plugin จะถูก merge เข้าไปใน path ลำดับความสำคัญต่ำเดียวกับ `skills.load.extraDirs` ดังนั้น bundled, managed, agent หรือ workspace skill ที่มีชื่อเดียวกันจะ override ไดเรกทอรีเหล่านั้น คุณสามารถ gate ได้ผ่าน `metadata.openclaw.requires.config` ในรายการ config ของ plugin

ดู [Plugins](/th/tools/plugin) สำหรับ discovery/config และ [Tools](/th/tools) สำหรับพื้นผิวเครื่องมือที่ skills เหล่านั้นสอน

## Skill Workshop

Plugin **Skill Workshop** แบบเลือกใช้และยังเป็นการทดลอง สามารถสร้างหรืออัปเดต workspace skills จากขั้นตอนที่นำกลับมาใช้ซ้ำซึ่งสังเกตได้ระหว่างงานของ agent โดยปิดใช้งานเป็นค่าเริ่มต้น และต้องเปิดใช้งานอย่างชัดเจนผ่าน `plugins.entries.skill-workshop`

Skill Workshop เขียนเฉพาะไปยัง `<workspace>/skills`, สแกนเนื้อหาที่สร้างขึ้น, รองรับการรออนุมัติหรือการเขียนแบบปลอดภัยอัตโนมัติ, กักกันข้อเสนอที่ไม่ปลอดภัย และ refresh snapshot ของ skill หลังจากเขียนสำเร็จ เพื่อให้ skills ใหม่พร้อมใช้งานโดยไม่ต้อง restart Gateway

ใช้สำหรับการแก้ไข เช่น _"ครั้งหน้า ให้ตรวจสอบ attribution ของ GIF"_ หรือ workflow ที่ได้มาจากประสบการณ์จริง เช่น checklist สำหรับ QA สื่อ เริ่มจากการรออนุมัติ ใช้การเขียนอัตโนมัติเฉพาะใน workspaces ที่เชื่อถือได้หลังจากตรวจสอบข้อเสนอแล้ว คู่มือฉบับเต็ม: [Skill Workshop plugin](/th/plugins/skill-workshop)

## ClawHub (ติดตั้งและ sync)

[ClawHub](https://clawhub.ai) คือ registry skills สาธารณะสำหรับ OpenClaw ใช้คำสั่ง `openclaw skills` ดั้งเดิมสำหรับ discover/install/update หรือใช้ CLI `clawhub` แยกต่างหากสำหรับ workflow publish/sync คู่มือฉบับเต็ม: [ClawHub](/th/clawhub)

| การดำเนินการ                             | คำสั่ง                                |
| ---------------------------------- | -------------------------------------- |
| ติดตั้ง skill เข้า workspace | `openclaw skills install <skill-slug>` |
| อัปเดต skills ที่ติดตั้งทั้งหมด        | `openclaw skills update --all`         |
| Sync (สแกน + publish updates)      | `clawhub sync --all`                   |

`openclaw skills install` แบบดั้งเดิมจะติดตั้งเข้าไดเรกทอรี `skills/` ของ workspace ที่ใช้งานอยู่ CLI `clawhub` แยกต่างหากก็ติดตั้งเข้า `./skills` ใต้ไดเรกทอรีทำงานปัจจุบันของคุณด้วย (หรือ fallback ไปยัง workspace ของ OpenClaw ที่ config ไว้) OpenClaw จะรับสิ่งนั้นเป็น `<workspace>/skills` ใน session ถัดไป
ราก skill ที่ config ไว้ยังรองรับระดับการจัดกลุ่มหนึ่งระดับ เช่น `skills/<group>/<skill>/SKILL.md` เพื่อให้เก็บ skills บุคคลที่สามที่เกี่ยวข้องไว้ใต้โฟลเดอร์ร่วมกันได้โดยไม่ต้องสแกนแบบ recursive กว้าง ๆ

Gateway clients ที่ต้องการการส่งมอบแบบ private ที่ไม่ใช่ ClawHub สามารถ stage archive skill แบบ zip ด้วย `skills.upload.begin`, `skills.upload.chunk` และ `skills.upload.commit` แล้วติดตั้ง upload ที่ commit แล้วด้วย `skills.install({ source: "upload", uploadId, slug, force?, sha256? })` นี่คือ path การ upload สำหรับ admin อย่างชัดเจนสำหรับ clients ที่เชื่อถือได้ ไม่ใช่ flow การติดตั้ง `openclaw skills install <slug>` หรือ ClawHub ตามปกติ โดยปิดเป็นค่าเริ่มต้นและทำงานเฉพาะเมื่อตั้งค่า `skills.install.allowUploadedArchives: true` ใน `openclaw.json` เท่านั้น โหมด upload ยังคงติดตั้งเข้าไดเรกทอรี `skills/<slug>` ของ workspace agent ค่าเริ่มต้น ชื่อโฟลเดอร์ภายใน archive จะถูกละเว้นสำหรับเป้าหมายติดตั้งสุดท้าย

หน้า skill ของ ClawHub แสดงสถานะสแกนความปลอดภัยล่าสุดก่อนติดตั้ง พร้อมหน้ารายละเอียด scanner สำหรับ VirusTotal, ClawScan และ static analysis
`openclaw skills install <slug>` ยังคงเป็นเพียง path การติดตั้งเท่านั้น publishers กู้คืน false positives ผ่าน dashboard ของ ClawHub หรือ `clawhub skill rescan <slug>`

## ความปลอดภัย

<Warning>
ปฏิบัติต่อ skills บุคคลที่สามเป็น **โค้ดที่ไม่น่าเชื่อถือ** อ่านก่อนเปิดใช้งาน
ควรใช้การรันแบบ sandboxed สำหรับ inputs ที่ไม่น่าเชื่อถือและเครื่องมือที่มีความเสี่ยง ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการควบคุมฝั่ง agent
</Warning>

- การค้นหา skill จาก workspace และ extra-dir ยอมรับเฉพาะราก skill และไฟล์ `SKILL.md` ที่ resolved realpath ยังคงอยู่ภายในรากที่ config ไว้
- การติดตั้ง archive private ของ Gateway ปิดเป็นค่าเริ่มต้น เมื่อเปิดใช้งานอย่างชัดเจน จะต้องมี committed zip upload ที่มี `SKILL.md` และใช้การป้องกันเดียวกับการติดตั้ง skill ของ ClawHub ได้แก่ archive extraction, path traversal, symlink, force และ rollback โดยถูก gate ด้วย `skills.install.allowUploadedArchives`; การติดตั้ง ClawHub ปกติไม่ต้องใช้การตั้งค่านั้น
- การติดตั้ง dependency ของ skill ที่หนุนโดย Gateway (`skills.install`, onboarding และ UI การตั้งค่า Skills) จะรัน dangerous-code scanner ในตัวก่อน execute installer metadata findings ระดับ `critical` จะ block เป็นค่าเริ่มต้น เว้นแต่ caller จะตั้ง dangerous override อย่างชัดเจน findings ที่น่าสงสัยยังคงเตือนเท่านั้น
- `openclaw skills install <slug>` แตกต่างออกไป - คำสั่งนี้ดาวน์โหลดโฟลเดอร์ skill จาก ClawHub เข้า workspace และไม่ได้ใช้ path installer-metadata ข้างต้น
- `skills.entries.*.env` และ `skills.entries.*.apiKey` inject secrets เข้าไปใน process **host** สำหรับ agent turn นั้น (ไม่ใช่ sandbox) เก็บ secrets ออกจาก prompts และ logs

สำหรับ threat model และ checklists ที่กว้างขึ้น ดู [Security](/th/gateway/security)

## รูปแบบ SKILL.md

`SKILL.md` ต้องมีอย่างน้อย:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw ปฏิบัติตามสเปก AgentSkills สำหรับ layout/intent parser ที่ใช้โดย embedded agent รองรับเฉพาะคีย์ frontmatter แบบ **บรรทัดเดียว** เท่านั้น
`metadata` ควรเป็น **ออบเจ็กต์ JSON บรรทัดเดียว** ใช้ `{baseDir}` ในคำแนะนำเพื่ออ้างอิง path ของโฟลเดอร์ skill

### คีย์ frontmatter ที่เลือกใช้ได้

<ParamField path="homepage" type="string">
  URL ที่แสดงเป็น "Website" ใน macOS Skills UI รองรับผ่าน `metadata.openclaw.homepage` ด้วย
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  เมื่อเป็น `true` skill จะถูกแสดงเป็น slash command สำหรับผู้ใช้
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  เมื่อเป็น `true` OpenClaw จะไม่นำคำแนะนำของ skill ใส่ใน prompt ปกติของ agent
  skill ยังคงติดตั้งอยู่และยังสามารถรันอย่างชัดเจนเป็น slash command ได้เมื่อ `user-invocable` เป็น `true` ด้วย
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  เมื่อตั้งเป็น `tool` slash command จะข้าม model และ dispatch ไปยัง tool โดยตรง
</ParamField>
<ParamField path="command-tool" type="string">
  ชื่อ tool ที่จะ invoke เมื่อตั้งค่า `command-dispatch: tool`
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  สำหรับ tool dispatch จะ forward สตริง args ดิบไปยัง tool (ไม่มีการ parse โดย core) tool จะถูก invoke ด้วย `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
</ParamField>

## Gating (filters ขณะโหลด)

OpenClaw กรอง skills ขณะโหลดโดยใช้ `metadata` (JSON บรรทัดเดียว):

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

ฟิลด์ใต้ `metadata.openclaw`:

<ParamField path="always" type="boolean">
  เมื่อเป็น `true` ให้รวม skill เสมอ (ข้าม gate อื่น)
</ParamField>
<ParamField path="emoji" type="string">
  อีโมจิเสริมที่ใช้โดย UI Skills ของ macOS
</ParamField>
<ParamField path="homepage" type="string">
  URL เสริมที่แสดงเป็น "เว็บไซต์" ใน UI Skills ของ macOS
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  รายการแพลตฟอร์มเสริม หากตั้งค่าไว้ skill จะมีสิทธิ์ใช้งานเฉพาะบน OS เหล่านั้นเท่านั้น
</ParamField>
<ParamField path="requires.bins" type="string[]">
  แต่ละรายการต้องมีอยู่บน `PATH`
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  ต้องมีอย่างน้อยหนึ่งรายการอยู่บน `PATH`
</ParamField>
<ParamField path="requires.env" type="string[]">
  ตัวแปร env ต้องมีอยู่หรือถูกระบุไว้ในการกำหนดค่า
</ParamField>
<ParamField path="requires.config" type="string[]">
  รายการพาธ `openclaw.json` ที่ต้องมีค่า truthy
</ParamField>
<ParamField path="primaryEnv" type="string">
  ชื่อตัวแปร env ที่เชื่อมโยงกับ `skills.entries.<name>.apiKey`
</ParamField>
<ParamField path="install" type="object[]">
  ข้อกำหนดตัวติดตั้งเสริมที่ใช้โดย UI Skills ของ macOS (brew/node/go/uv/download)
</ParamField>

หากไม่มี `metadata.openclaw` skill จะมีสิทธิ์ใช้งานเสมอ (เว้นแต่
ถูกปิดใช้งานในการกำหนดค่าหรือถูกบล็อกโดย `skills.allowBundled` สำหรับ skills ที่ bundled)

<Note>
บล็อก `metadata.clawdbot` แบบเดิมยังคงยอมรับเมื่อไม่มี
`metadata.openclaw` ดังนั้น skills ที่ติดตั้งไว้เก่าจะยังคง gate การพึ่งพาและคำใบ้ตัวติดตั้งของตนไว้
Skills ใหม่และที่อัปเดตควรใช้
`metadata.openclaw`
</Note>

### หมายเหตุเกี่ยวกับ sandboxing

- `requires.bins` จะถูกตรวจบน **host** ในเวลาที่โหลด skill
- หาก agent อยู่ใน sandbox ไบนารีต้องมีอยู่ **ภายใน container** ด้วย ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` (หรือ image แบบกำหนดเอง) `setupCommand` จะรันหนึ่งครั้งหลังจากสร้าง container การติดตั้งแพ็กเกจยังต้องมี network egress, root FS ที่เขียนได้ และผู้ใช้ root ใน sandbox ด้วย
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
  <Accordion title="กฎการเลือกตัวติดตั้ง">
    - หากระบุตัวติดตั้งหลายตัว Gateway จะเลือกตัวเลือกที่ต้องการเพียงตัวเดียว (brew เมื่อพร้อมใช้งาน มิฉะนั้นใช้ node)
    - หากตัวติดตั้งทั้งหมดเป็น `download` OpenClaw จะแสดงแต่ละรายการเพื่อให้คุณเห็น artifacts ที่พร้อมใช้งาน
    - ข้อกำหนดตัวติดตั้งสามารถมี `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตัวเลือกตามแพลตฟอร์ม
    - การติดตั้ง Node จะทำตาม `skills.install.nodeManager` ใน `openclaw.json` (ค่าเริ่มต้น: npm; ตัวเลือก: npm/pnpm/yarn/bun) สิ่งนี้มีผลเฉพาะกับการติดตั้ง skill เท่านั้น; runtime ของ Gateway ควรยังคงเป็น Node - ไม่แนะนำให้ใช้ Bun สำหรับ WhatsApp/Telegram
    - การเลือกตัวติดตั้งที่รองรับโดย Gateway ขับเคลื่อนด้วยความชอบ: เมื่อข้อกำหนดการติดตั้งผสมหลายชนิด OpenClaw จะเลือก Homebrew ก่อนเมื่อเปิดใช้ `skills.install.preferBrew` และมี `brew` อยู่ จากนั้น `uv` จากนั้นตัวจัดการ node ที่กำหนดค่าไว้ จากนั้น fallback อื่นอย่าง `go` หรือ `download`
    - หากข้อกำหนดการติดตั้งทุกตัวเป็น `download` OpenClaw จะแสดงตัวเลือกดาวน์โหลดทั้งหมดแทนการยุบเหลือตัวติดตั้งที่ต้องการเพียงตัวเดียว

  </Accordion>
  <Accordion title="รายละเอียดรายตัวติดตั้ง">
    - **การติดตั้ง Go:** หากไม่มี `go` และมี `brew` อยู่ Gateway จะติดตั้ง Go ผ่าน Homebrew ก่อน และตั้ง `GOBIN` เป็น `bin` ของ Homebrew เมื่อทำได้
    - **การติดตั้งแบบดาวน์โหลด:** `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (ค่าเริ่มต้น: อัตโนมัติเมื่อตรวจพบ archive), `stripComponents`, `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)

  </Accordion>
</AccordionGroup>

## การ override การกำหนดค่า

Skills ที่ bundled และ managed สามารถสลับเปิดปิดและระบุค่า env ได้
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
  `false` จะปิดใช้งาน skill แม้ว่าจะ bundled หรือติดตั้งแล้วก็ตาม
  skill `coding-agent` ที่ bundled เป็นแบบ opt-in: ตั้ง
  `skills.entries.coding-agent.enabled: true` ก่อนเปิดเผยให้ agents ใช้
  จากนั้นตรวจให้แน่ใจว่า `claude`, `codex`, `opencode` หรือ `pi` ตัวใดตัวหนึ่งติดตั้งแล้วและ
  authenticated สำหรับ CLI ของตนเองแล้ว
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  ทางลัดสำหรับ skills ที่ประกาศ `metadata.openclaw.primaryEnv` รองรับ plaintext หรือ SecretRef
</ParamField>
<ParamField path="env" type="Record<string, string>">
  inject เฉพาะเมื่อยังไม่ได้ตั้งค่าตัวแปรไว้ใน process
</ParamField>
<ParamField path="config" type="object">
  ถุงข้อมูลเสริมสำหรับฟิลด์กำหนดเองราย skill คีย์กำหนดเองต้องอยู่ที่นี่
</ParamField>
<ParamField path="allowBundled" type="string[]">
  allowlist เสริมสำหรับ skills ที่ **bundled** เท่านั้น หากตั้งค่าไว้ เฉพาะ skills ที่ bundled ในรายการเท่านั้นที่จะมีสิทธิ์ใช้งาน (skills ที่ managed/workspace ไม่ได้รับผลกระทบ)
</ParamField>

หากชื่อ skill มีขีดกลาง ให้ใส่ key ในเครื่องหมายคำพูด (JSON5 อนุญาต
keys ที่ใส่เครื่องหมายคำพูด) โดยค่าเริ่มต้น key การกำหนดค่าจะตรงกับ **ชื่อ skill** - หาก skill
กำหนด `metadata.openclaw.skillKey` ให้ใช้ key นั้นภายใต้ `skills.entries`

<Note>
สำหรับการสร้าง/แก้ไขรูปภาพ stock ภายใน OpenClaw ให้ใช้เครื่องมือ core
`image_generate` ร่วมกับ `agents.defaults.imageGenerationModel` แทน
skill ที่ bundled ตัวอย่าง skill ที่นี่มีไว้สำหรับ workflow แบบกำหนดเองหรือของ third-party
สำหรับการวิเคราะห์รูปภาพแบบ native ให้ใช้เครื่องมือ `image` ร่วมกับ
`agents.defaults.imageModel` หากคุณเลือก `openai/*`, `google/*`,
`fal/*` หรือโมเดลรูปภาพเฉพาะ provider อื่น ให้เพิ่ม auth/API key ของ provider นั้นด้วย
</Note>

## การ inject สภาพแวดล้อม

เมื่อ agent run เริ่มต้น OpenClaw จะ:

1. อ่าน metadata ของ skill
2. ใช้ `skills.entries.<key>.env` และ `skills.entries.<key>.apiKey` กับ `process.env`
3. สร้าง system prompt ด้วย skills ที่ **eligible**
4. คืนค่าสภาพแวดล้อมเดิมหลังจาก run สิ้นสุด

การ inject สภาพแวดล้อมถูก **จำกัดขอบเขตไว้ที่ agent run** ไม่ใช่สภาพแวดล้อม shell
แบบ global

สำหรับ backend `claude-cli` ที่ bundled OpenClaw ยัง materialize snapshot ที่ eligible เดียวกัน
เป็น plugin Claude Code ชั่วคราว และส่งผ่าน
`--plugin-dir` จากนั้น Claude Code สามารถใช้ native skill resolver ของตนได้ ขณะที่
OpenClaw ยังคงเป็นเจ้าของลำดับความสำคัญ, allowlists ราย agent, gating และ
การ inject env/API key ของ `skills.entries.*` backend CLI อื่นใช้เฉพาะ
catalog ใน prompt เท่านั้น

## Snapshots และ refresh

OpenClaw จะ snapshot skills ที่ eligible **เมื่อ session เริ่มต้น** และ
ใช้รายการนั้นซ้ำสำหรับ turn ถัดไปใน session เดียวกัน การเปลี่ยนแปลง
skills หรือ config จะมีผลใน session ใหม่ถัดไป

Skills สามารถ refresh ระหว่าง session ได้ในสองกรณี:

- เปิดใช้ watcher ของ skills
- มี remote node ใหม่ที่ eligible ปรากฏขึ้น

ให้มองสิ่งนี้เป็น **hot reload**: รายการที่ refresh แล้วจะถูกนำไปใช้ใน
turn ถัดไปของ agent หาก allowlist skill ของ agent ที่มีผลเปลี่ยนแปลงสำหรับ
session นั้น OpenClaw จะ refresh snapshot เพื่อให้ skills ที่มองเห็นยังคงสอดคล้อง
กับ agent ปัจจุบัน

### Watcher ของ Skills

โดยค่าเริ่มต้น OpenClaw จะ watch โฟลเดอร์ skill และ bump snapshot ของ skills
เมื่อไฟล์ `SKILL.md` เปลี่ยน กำหนดค่าภายใต้ `skills.load`:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

ใช้ `allowSymlinkTargets` สำหรับ layout repo พี่น้องที่ตั้งใจไว้ ซึ่ง root skill built-in
มี symlink เช่น
`~/.agents/skills/manager -> ~/Projects/manager/skills` รายการ target จะ
ถูกจับคู่หลังจาก realpath resolution และควรคงให้แคบไว้

### Remote macOS nodes (Gateway Linux)

หาก Gateway รันบน Linux แต่มี **macOS node** เชื่อมต่ออยู่พร้อมอนุญาต
`system.run` (ความปลอดภัยของ Exec approvals ไม่ได้ตั้งเป็น `deny`),
OpenClaw สามารถถือว่า skills สำหรับ macOS เท่านั้นมีสิทธิ์ใช้งานเมื่อมี
ไบนารีที่จำเป็นอยู่บน node นั้น agent ควรเรียกใช้ skills เหล่านั้น
ผ่านเครื่องมือ `exec` พร้อม `host=node`

สิ่งนี้พึ่งพา node ที่รายงานการรองรับ command ของตน และการ probe bin
ผ่าน `system.which` หรือ `system.run` nodes ที่ offline จะ **ไม่** ทำให้
skills แบบ remote-only มองเห็นได้ หาก node ที่เชื่อมต่ออยู่หยุดตอบ bin
probes OpenClaw จะล้าง bin matches ที่ cache ไว้ เพื่อให้ agents ไม่เห็น
skills ที่ไม่สามารถรันได้ในปัจจุบันอีกต่อไป

## ผลกระทบต่อ token

เมื่อ skills มีสิทธิ์ใช้งาน OpenClaw จะ inject รายการ XML แบบกะทัดรัดของ skills
ที่พร้อมใช้งานลงใน system prompt (ผ่าน `formatSkillsForPrompt` ใน
`pi-coding-agent`) ค่าใช้จ่ายเป็นแบบ deterministic:

- **ค่า overhead ฐาน** (เฉพาะเมื่อมี skill ≥1): 195 ตัวอักษร
- **ต่อ skill:** 97 ตัวอักษร + ความยาวของค่า `<name>`, `<description>` และ `<location>` ที่ escape เป็น XML แล้ว

สูตร (ตัวอักษร):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

การ escape XML จะขยาย `& < > " '` เป็น entities (`&amp;`, `&lt;` เป็นต้น)
ทำให้ความยาวเพิ่มขึ้น จำนวน token แตกต่างกันตาม tokenizer ของโมเดล การประเมินแบบ
OpenAI โดยคร่าวคือ ~4 ตัวอักษร/token ดังนั้น **97 ตัวอักษร ≈ 24 tokens** ต่อ
skill บวกความยาวจริงของฟิลด์ของคุณ

## วงจรชีวิตของ managed skills

OpenClaw จัดส่งชุด skills พื้นฐานเป็น **skills ที่ bundled** พร้อมการ
ติดตั้ง (แพ็กเกจ npm หรือ OpenClaw.app) `~/.openclaw/skills` มีไว้สำหรับ
local overrides - เช่น การ pin หรือ patch skill โดยไม่
เปลี่ยนสำเนาที่ bundled skills ใน workspace เป็นของผู้ใช้และ override
ทั้งสองเมื่อชื่อขัดแย้งกัน

## กำลังมองหา skills เพิ่มเติมอยู่หรือไม่?

เรียกดู [https://clawhub.ai](https://clawhub.ai) schema การกำหนดค่าแบบเต็ม:
[การกำหนดค่า Skills](/th/tools/skills-config)

## ที่เกี่ยวข้อง

- [ClawHub](/th/clawhub) - registry skills สาธารณะ
- [การสร้าง skills](/th/tools/creating-skills) - การสร้าง skills แบบกำหนดเอง
- [Plugins](/th/tools/plugin) - ภาพรวมระบบ plugin
- [Plugin Skill Workshop](/th/plugins/skill-workshop) - สร้าง skills จากงานของ agent
- [การกำหนดค่า Skills](/th/tools/skills-config) - reference การกำหนดค่า skill
- [คำสั่ง slash](/th/tools/slash-commands) - คำสั่ง slash ทั้งหมดที่พร้อมใช้งาน
