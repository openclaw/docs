---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนการควบคุมการใช้งานทักษะ รายการอนุญาต หรือกฎการโหลด
    - ทำความเข้าใจลำดับความสำคัญของ Skills และพฤติกรรมของสแนปชอต
sidebarTitle: Skills
summary: Skills สอนเอเจนต์ของคุณให้รู้วิธีใช้เครื่องมือ เรียนรู้วิธีโหลด วิธีทำงานของลำดับความสำคัญ และวิธีกำหนดค่า gating, allowlists และการฉีด environment
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:55:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills คือไฟล์คำสั่งแบบ markdown ที่สอน agent ว่าควรใช้เครื่องมืออย่างไรและเมื่อใด แต่ละ Skill อยู่ในไดเรกทอรีที่มีไฟล์ `SKILL.md` พร้อม YAML frontmatter และเนื้อหา markdown OpenClaw โหลด Skills ที่ bundled มา รวมถึง override ภายในเครื่อง และกรองในช่วงโหลดตาม environment, config และการมีอยู่ของ binary

<CardGroup cols={2}>
  <Card title="Creating skills" href="/th/tools/creating-skills" icon="hammer">
    สร้างและทดสอบ Skill แบบกำหนดเองตั้งแต่ต้น
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    ตรวจทานและอนุมัติข้อเสนอ Skill ที่ agent ร่างไว้
  </Card>
  <Card title="Skills config" href="/th/tools/skills-config" icon="gear">
    schema config `skills.*` แบบครบถ้วนและ allowlist ของ agent
  </Card>
  <Card title="ClawHub" href="/th/clawhub" icon="cloud">
    เรียกดูและติดตั้ง Skills จากชุมชน
  </Card>
</CardGroup>

## ลำดับการโหลด

OpenClaw โหลดจากแหล่งเหล่านี้ โดยเรียงจาก **ลำดับความสำคัญสูงสุดก่อน** เมื่อชื่อ Skill เดียวกันปรากฏหลายที่ แหล่งที่มีลำดับความสำคัญสูงสุดจะชนะ

| Priority    | Source                 | Path                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — highest | Skills ของ workspace   | `<workspace>/skills`                    |
| 2           | Skills ของ project agent | `<workspace>/.agents/skills`          |
| 3           | Skills ของ personal agent | `~/.agents/skills`                    |
| 4           | Skills ที่จัดการ / ภายในเครื่อง | `~/.openclaw/skills`           |
| 5           | Skills ที่ bundled มา  | มาพร้อมกับการติดตั้ง                   |
| 6 — lowest  | ไดเรกทอรีเพิ่มเติม     | `skills.load.extraDirs` + plugin skills |

รากของ Skill รองรับ layout แบบจัดกลุ่ม OpenClaw จะค้นพบ Skill ทุกครั้งที่
`SKILL.md` ปรากฏที่ใดก็ตามภายใต้รากที่กำหนดค่าไว้:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

เส้นทางโฟลเดอร์ใช้เพื่อจัดระเบียบเท่านั้น ชื่อของ Skill, slash command และคีย์
allowlist ทั้งหมดมาจากฟิลด์ frontmatter `name` (หรือชื่อไดเรกทอรีเมื่อไม่มี
`name`)

<Note>
  ไดเรกทอรีดั้งเดิม `$CODEX_HOME/skills` ของ Codex CLI **ไม่ใช่** ราก Skill
  ของ OpenClaw ใช้ `openclaw migrate plan codex` เพื่อทำ inventory ของ Skills
  เหล่านั้น จากนั้นใช้ `openclaw migrate codex` เพื่อคัดลอกเข้า workspace
  OpenClaw ของคุณ
</Note>

## Skills แบบต่อ agent เทียบกับแบบใช้ร่วมกัน

ในการตั้งค่าแบบหลาย agent แต่ละ agent มี workspace ของตัวเอง ใช้เส้นทางที่ตรงกับ
การมองเห็นที่คุณต้องการ:

| Scope          | Path                         | Visible to                  |
| -------------- | ---------------------------- | --------------------------- |
| ต่อ agent      | `<workspace>/skills`         | เฉพาะ agent นั้น           |
| Project-agent  | `<workspace>/.agents/skills` | เฉพาะ agent ของ workspace นั้น |
| Personal-agent | `~/.agents/skills`           | agent ทั้งหมดบนเครื่องนี้  |
| Shared managed | `~/.openclaw/skills`         | agent ทั้งหมดบนเครื่องนี้  |
| Extra dirs     | `skills.load.extraDirs`      | agent ทั้งหมดบนเครื่องนี้  |

## Allowlist ของ agent

**ตำแหน่ง** ของ Skill (ลำดับความสำคัญ) และ **การมองเห็น** ของ Skill (agent ใดใช้ได้)
เป็นตัวควบคุมคนละส่วน ใช้ allowlist เพื่อจำกัดว่า agent จะเห็น Skills ใด
โดยไม่ขึ้นกับว่าถูกโหลดมาจากที่ใด

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist rules">
    - ละ `agents.defaults.skills` เพื่อให้ Skills ทั้งหมดไม่ถูกจำกัดโดยค่าเริ่มต้น
    - ละ `agents.list[].skills` เพื่อสืบทอด `agents.defaults.skills`
    - ตั้ง `agents.list[].skills: []` เพื่อไม่เปิดเผย Skills ใดให้ agent นั้น
    - รายการ `agents.list[].skills` ที่ไม่ว่างคือชุด **สุดท้าย** — จะไม่
      merge กับค่าเริ่มต้น
    - allowlist ที่มีผลจะใช้ครอบคลุมการสร้าง prompt, การค้นพบ slash-command,
      sandbox sync และ snapshot ของ Skill
    - นี่ไม่ใช่ขอบเขตการอนุญาตของ host shell หาก agent เดียวกันสามารถใช้
      `exec` ได้ ให้จำกัด shell นั้นแยกต่างหากด้วย sandboxing, การแยก OS-user,
      deny/allowlist ของ exec และ credentials ต่อ resource
  </Accordion>
</AccordionGroup>

## Plugin และ Skills

Plugin สามารถจัดส่ง Skills ของตัวเองได้โดยระบุไดเรกทอรี `skills` ใน
`openclaw.plugin.json` (เส้นทางสัมพันธ์กับรากของ plugin) Skills ของ Plugin จะโหลด
เมื่อเปิดใช้ plugin เช่น browser plugin จัดส่ง Skill `browser-automation`
สำหรับการควบคุม browser หลายขั้นตอน

ไดเรกทอรี Skill ของ Plugin จะ merge ที่ระดับลำดับความสำคัญต่ำเดียวกับ
`skills.load.extraDirs` ดังนั้น Skill ที่ bundled มา, managed, agent หรือ workspace
ที่มีชื่อเดียวกันจะ override สิ่งเหล่านี้ จำกัดการใช้งานผ่าน
`metadata.openclaw.requires.config` บน entry config ของ plugin

ดู [Plugin](/th/tools/plugin) และ [เครื่องมือ](/th/tools) สำหรับระบบ plugin แบบครบถ้วน

## เวิร์กช็อป Skill

[เวิร์กช็อป Skill](/th/tools/skill-workshop) คือคิวข้อเสนอระหว่าง agent กับไฟล์ Skill
ที่ใช้งานอยู่ของคุณ เมื่อ agent พบงานที่นำกลับมาใช้ซ้ำได้ จะร่างข้อเสนอแทนการเขียน
ลง `SKILL.md` โดยตรง คุณตรวจทานและอนุมัติก่อนมีการเปลี่ยนแปลงใด ๆ

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

ดู [เวิร์กช็อป Skill](/th/tools/skill-workshop) สำหรับ lifecycle, เอกสารอ้างอิง CLI
และการกำหนดค่าแบบครบถ้วน

## การติดตั้งจาก ClawHub

[ClawHub](https://clawhub.ai) คือ registry Skills สาธารณะ ใช้คำสั่ง
`openclaw skills` สำหรับติดตั้งและอัปเดต หรือใช้ CLI `clawhub` สำหรับเผยแพร่และ sync

| Action                             | Command                                                |
| ---------------------------------- | ------------------------------------------------------ |
| ติดตั้ง Skill เข้า workspace       | `openclaw skills install @owner/<slug>`                |
| ติดตั้งจาก Git repository          | `openclaw skills install git:owner/repo@ref`           |
| ติดตั้งไดเรกทอรี Skill ภายในเครื่อง | `openclaw skills install ./path/to/skill --as my-tool` |
| ติดตั้งให้ agent ภายในเครื่องทั้งหมด | `openclaw skills install @owner/<slug> --global`     |
| อัปเดต Skills ทั้งหมดใน workspace | `openclaw skills update --all`                         |
| อัปเดต Skill แบบ shared managed    | `openclaw skills update @owner/<slug> --global`        |
| อัปเดต Skills แบบ shared managed ทั้งหมด | `openclaw skills update --all --global`          |
| ตรวจสอบ trust envelope ของ Skill   | `openclaw skills verify @owner/<slug>`                 |
| พิมพ์ Skill Card ที่สร้างขึ้น      | `openclaw skills verify @owner/<slug> --card`          |
| เผยแพร่ / sync ผ่าน ClawHub CLI    | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    โดยค่าเริ่มต้น `openclaw skills install` จะติดตั้งลงในไดเรกทอรี `skills/`
    ของ workspace ที่ใช้งานอยู่ เพิ่ม `--global` เพื่อติดตั้งลงในไดเรกทอรี
    `~/.openclaw/skills` แบบใช้ร่วมกัน ซึ่ง agent ภายในเครื่องทั้งหมดมองเห็นได้
    เว้นแต่ allowlist ของ agent จะจำกัดให้แคบลง

    การติดตั้งจาก Git และภายในเครื่องคาดหวัง `SKILL.md` ที่รากของแหล่งที่มา slug
    มาจาก frontmatter `name` ของ `SKILL.md` เมื่อถูกต้อง จากนั้นจึง fallback
    ไปเป็นชื่อไดเรกทอรีหรือ repository ใช้ `--as <slug>` เพื่อ override
    `openclaw skills update` ติดตามเฉพาะการติดตั้งจาก ClawHub — ติดตั้งแหล่งที่มา
    Git หรือภายในเครื่องใหม่เพื่อ refresh

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` ขอ trust envelope
    `clawhub.skill.verify.v1` ของ Skill จาก ClawHub Skills จาก ClawHub ที่ติดตั้งแล้ว
    จะตรวจสอบเทียบกับ version และ registry ที่บันทึกไว้ใน `.clawhub/origin.json`
    bare slugs ยังคงยอมรับได้สำหรับ Skills ที่ติดตั้งอยู่แล้วหรือไม่กำกวม แต่
    refs ที่ระบุ owner จะหลีกเลี่ยงความกำกวมของ publisher

    หน้า Skill ของ ClawHub แสดงสถานะ security scan ล่าสุดก่อนติดตั้ง พร้อมหน้ารายละเอียด
    สำหรับ VirusTotal, ClawScan และ static analysis คำสั่งจะ exit แบบ non-zero
    เมื่อ ClawHub ทำเครื่องหมายว่าการตรวจสอบล้มเหลว Publishers กู้คืน false positives
    ผ่าน dashboard ของ ClawHub หรือ `clawhub skill rescan @owner/<slug>`

  </Accordion>
  <Accordion title="Private archive installs">
    Gateway clients ที่ต้องการการส่งมอบที่ไม่ใช่ ClawHub สามารถ stage zip skill archive
    ด้วย `skills.upload.begin`, `skills.upload.chunk` และ `skills.upload.commit`
    จากนั้นติดตั้งด้วย `skills.install({ source: "upload", ... })` เส้นทางนี้ปิดอยู่
    โดยค่าเริ่มต้น และต้องใช้ `skills.install.allowUploadedArchives: true` ใน
    `openclaw.json` การติดตั้งจาก ClawHub ตามปกติไม่จำเป็นต้องใช้การตั้งค่านั้น
  </Accordion>
</AccordionGroup>

## ความปลอดภัย

<Warning>
  ปฏิบัติต่อ Skills ของบุคคลที่สามเป็น **โค้ดที่ไม่น่าเชื่อถือ** อ่านก่อนเปิดใช้
  แนะนำให้ใช้การรันแบบ sandboxed สำหรับ input ที่ไม่น่าเชื่อถือและเครื่องมือที่มีความเสี่ยง
  ดู [Sandboxing](/th/gateway/sandboxing) สำหรับตัวควบคุมฝั่ง agent
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    การค้นพบ Skill ของ workspace, project-agent และ extra-dir ยอมรับเฉพาะราก Skill
    ที่ realpath ที่ resolve แล้วคงอยู่ภายในรากที่กำหนดค่าไว้ เว้นแต่
    `skills.load.allowSymlinkTargets` จะ trust รากเป้าหมายอย่างชัดเจน
    เวิร์กช็อป Skill เขียนผ่านเป้าหมายที่ trust เหล่านั้นเท่านั้นเมื่อเปิดใช้
    `skills.workshop.allowSymlinkTargetWrites`
    `~/.openclaw/skills` แบบ managed และ `~/.agents/skills` แบบ personal อาจมี
    โฟลเดอร์ Skill ที่เป็น symlink ได้ แต่ realpath ของ `SKILL.md` ทุกไฟล์ยังต้อง
    คงอยู่ภายในไดเรกทอรี Skill ที่ resolve แล้วของตัวเอง
  </Accordion>
  <Accordion title="Operator install policy">
    กำหนดค่า `security.installPolicy` เพื่อรันคำสั่งนโยบายภายในเครื่องที่ trust ก่อนที่
    การติดตั้ง Skill จะดำเนินต่อ นโยบายจะได้รับ metadata และเส้นทางแหล่งที่มาที่ staged
    ใช้กับเส้นทาง ClawHub, uploaded, Git, local, update และ dependency-installer
    และจะ fail closed เมื่อคำสั่งไม่สามารถส่งคืนการตัดสินใจที่ถูกต้องได้
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` และ `skills.entries.*.apiKey` inject secrets เข้าใน process
    **host** สำหรับ turn ของ agent นั้นเท่านั้น — ไม่ใช่เข้าไปใน sandbox เก็บ secrets
    ออกจาก prompts และ logs
  </Accordion>
</AccordionGroup>

สำหรับ threat model และ security checklists ที่กว้างขึ้น ดู
[ความปลอดภัย](/th/gateway/security)

## รูปแบบ SKILL.md

ทุก Skill ต้องมีอย่างน้อย `name` และ `description` ใน frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw ทำตาม spec [AgentSkills](https://agentskills.io) parser ของ frontmatter
  รองรับ **คีย์แบบบรรทัดเดียวเท่านั้น** — `metadata` ต้องเป็น JSON object บรรทัดเดียว
  ใช้ `{baseDir}` ในเนื้อหาเพื่ออ้างอิงเส้นทางโฟลเดอร์ Skill
</Note>

### คีย์ frontmatter ที่เลือกใช้ได้

<ParamField path="homepage" type="string">
  URL ที่แสดงเป็น "Website" ใน UI Skills ของ macOS รองรับผ่าน
  `metadata.openclaw.homepage` ด้วย
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  เมื่อเป็น `true` Skill จะถูกเปิดเผยเป็น slash command ที่ผู้ใช้เรียกใช้ได้
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  เมื่อเป็น `true` OpenClaw จะไม่นำคำสั่งของ Skill ใส่ใน prompt ปกติของ agent
  Skill ยังคงพร้อมใช้งานเป็น slash command เมื่อ `user-invocable` เป็น `true` ด้วย
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  เมื่อตั้งเป็น `tool` slash command จะข้าม model และ dispatch ไปยังเครื่องมือที่ลงทะเบียนไว้โดยตรง
</ParamField>

<ParamField path="command-tool" type="string">
  ชื่อเครื่องมือที่จะเรียกใช้เมื่อตั้งค่า `command-dispatch: tool`
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  สำหรับการส่งต่อเครื่องมือ ให้ส่งต่อสตริงอาร์กิวเมนต์ดิบไปยังเครื่องมือโดยไม่มี
  การแยกวิเคราะห์จากแกนหลัก เครื่องมือจะได้รับ
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
</ParamField>

## การควบคุมสิทธิ์

OpenClaw กรอง Skills ตอนโหลดโดยใช้ `metadata.openclaw` (JSON แบบบรรทัดเดียว
ใน frontmatter) Skill ที่ไม่มีบล็อก `metadata.openclaw` จะมีสิทธิ์ใช้งานเสมอ
เว้นแต่จะถูกปิดใช้งานอย่างชัดเจน

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

<ParamField path="always" type="boolean">
  เมื่อเป็น `true` ให้รวม Skill เสมอและข้าม gate อื่นทั้งหมด
</ParamField>

<ParamField path="emoji" type="string">
  อีโมจิเสริมที่แสดงใน UI Skills ของ macOS
</ParamField>

<ParamField path="homepage" type="string">
  URL เสริมที่แสดงเป็น "เว็บไซต์" ใน UI Skills ของ macOS
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  ตัวกรองแพลตฟอร์ม เมื่อตั้งค่าแล้ว Skill จะมีสิทธิ์ใช้ได้เฉพาะบน OS ที่ระบุ
</ParamField>

<ParamField path="requires.bins" type="string[]">
  ไบนารีแต่ละตัวต้องมีอยู่บน `PATH`
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  ต้องมีไบนารีอย่างน้อยหนึ่งตัวอยู่บน `PATH`
</ParamField>

<ParamField path="requires.env" type="string[]">
  ตัวแปร env แต่ละตัวต้องมีอยู่ใน process หรือถูกระบุผ่าน config
</ParamField>

<ParamField path="requires.config" type="string[]">
  แต่ละพาธของ `openclaw.json` ต้องมีค่า truthy
</ParamField>

<ParamField path="primaryEnv" type="string">
  ชื่อตัวแปร env ที่เชื่อมโยงกับ `skills.entries.<name>.apiKey`
</ParamField>

<ParamField path="install" type="object[]">
  สเปกตัวติดตั้งเสริมที่ใช้โดย UI Skills ของ macOS (brew / node / go / uv / download)
</ParamField>

<Note>
  บล็อก `metadata.clawdbot` แบบเดิมยังคงยอมรับได้เมื่อไม่มี
  `metadata.openclaw` ดังนั้น Skills ที่ติดตั้งไว้รุ่นเก่าจะยังคงเก็บ
  gate ของ dependency และคำใบ้ตัวติดตั้งไว้ Skill ใหม่ควรใช้
  `metadata.openclaw`
</Note>

### สเปกตัวติดตั้ง

สเปกตัวติดตั้งบอก UI Skills ของ macOS ว่าจะติดตั้ง dependency อย่างไร:

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
    - เมื่อมีตัวติดตั้งหลายรายการ Gateway จะเลือกตัวเลือกที่ต้องการหนึ่งรายการ
      (brew เมื่อใช้ได้ มิฉะนั้นใช้ node)
    - หากตัวติดตั้งทั้งหมดเป็น `download` OpenClaw จะแสดงแต่ละรายการเพื่อให้คุณ
      เห็น artifact ทั้งหมดที่มี
    - สเปกสามารถมี `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตามแพลตฟอร์ม
    - การติดตั้ง Node จะเคารพ `skills.install.nodeManager` ใน `openclaw.json`
      (ค่าเริ่มต้น: npm; ตัวเลือก: npm / pnpm / yarn / bun) สิ่งนี้มีผลเฉพาะกับการติดตั้ง Skill
      เท่านั้น; runtime ของ Gateway ควรยังคงเป็น Node
    - ลำดับความต้องการตัวติดตั้งของ Gateway: Homebrew → uv → ตัวจัดการ node ที่กำหนดค่าไว้ →
      go → download
  </Accordion>
  <Accordion title="รายละเอียดตามตัวติดตั้ง">
    - **Homebrew:** OpenClaw จะไม่ติดตั้ง Homebrew โดยอัตโนมัติหรือแปลงสูตร brew
      เป็นคำสั่งแพ็กเกจของระบบ ในคอนเทนเนอร์ Linux ที่ไม่มี
      `brew` ตัวติดตั้งที่ใช้ brew เท่านั้นจะถูกซ่อน; ใช้อิมเมจแบบกำหนดเองหรือติดตั้ง
      dependency ด้วยตนเอง
    - **Go:** หากไม่มี `go` และมี `brew` Gateway จะติดตั้ง
      Go ผ่าน Homebrew ก่อนและตั้งค่า `GOBIN` เป็น `bin` ของ Homebrew
    - **Download:** `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (ค่าเริ่มต้น: auto เมื่อตรวจพบ archive), `stripComponents`,
      `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)
  </Accordion>
  <Accordion title="หมายเหตุเรื่อง sandboxing">
    `requires.bins` จะถูกตรวจสอบบน **host** ตอนโหลด Skill หาก agent
    ทำงานใน sandbox ไบนารีต้องมีอยู่ **ภายในคอนเทนเนอร์** ด้วย
    ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` หรืออิมเมจแบบกำหนดเอง
    `setupCommand` ทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์และต้องมี
    network egress, root FS ที่เขียนได้ และผู้ใช้ root ใน sandbox
  </Accordion>
</AccordionGroup>

## การ override config

สลับและกำหนดค่า Skills ที่ bundled หรือ managed ภายใต้ `skills.entries` ใน
`~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
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
  `false` จะปิดใช้งาน Skill แม้จะถูก bundled หรือติดตั้งแล้วก็ตาม Skill แบบ bundled
  `coding-agent` เป็นแบบ opt-in — ตั้งค่า `skills.entries.coding-agent.enabled: true`
  และตรวจให้แน่ใจว่ามีการติดตั้งและยืนยันตัวตน `claude`, `codex`, `opencode`
  หรือ CLI อื่นที่รองรับแล้วอย่างใดอย่างหนึ่ง
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  ฟิลด์อำนวยความสะดวกสำหรับ Skills ที่ประกาศ `metadata.openclaw.primaryEnv`
  รองรับสตริง plaintext หรือออบเจกต์ SecretRef
</ParamField>

<ParamField path="env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมที่ inject สำหรับการรัน agent จะ inject เฉพาะเมื่อ
  ตัวแปรยังไม่ได้ตั้งค่าใน process
</ParamField>

<ParamField path="config" type="object">
  ชุดข้อมูลเสริมสำหรับฟิลด์การกำหนดค่าแบบกำหนดเองราย Skill
</ParamField>

<ParamField path="allowBundled" type="string[]">
  allowlist เสริมสำหรับ Skills แบบ **bundled** เท่านั้น เมื่อตั้งค่าแล้ว เฉพาะ Skills แบบ bundled
  ในรายการเท่านั้นที่จะมีสิทธิ์ Skills แบบ managed และ workspace จะไม่ได้รับผลกระทบ
</ParamField>

<Note>
  คีย์ config จะตรงกับ **ชื่อ Skill** โดยค่าเริ่มต้น หาก Skill กำหนด
  `metadata.openclaw.skillKey` ให้ใช้คีย์นั้นภายใต้ `skills.entries` ใส่เครื่องหมายคำพูดให้
  ชื่อที่มีขีดกลาง: JSON5 อนุญาตให้ใช้คีย์ที่มีเครื่องหมายคำพูด
</Note>

## การ inject สภาพแวดล้อม

เมื่อการรัน agent เริ่มต้น OpenClaw จะ:

<Steps>
  <Step title="อ่าน metadata ของ Skill">
    OpenClaw จะแก้รายการ Skill ที่มีผลสำหรับ agent โดยใช้กฎการควบคุมสิทธิ์
    allowlist และ config overrides
  </Step>
  <Step title="inject env และ API keys">
    `skills.entries.<key>.env` และ `skills.entries.<key>.apiKey` จะถูกนำไปใช้กับ
    `process.env` ตลอดช่วงเวลาของการรัน
  </Step>
  <Step title="สร้าง system prompt">
    Skills ที่มีสิทธิ์จะถูกคอมไพล์เป็นบล็อก XML แบบกะทัดรัดและ inject เข้าไปใน
    system prompt
  </Step>
  <Step title="คืนค่าสภาพแวดล้อม">
    หลังการรันจบลง สภาพแวดล้อมเดิมจะถูกกู้คืน
  </Step>
</Steps>

<Warning>
  การ inject env ถูกจำกัดขอบเขตไว้ที่การรัน agent บน **host** ไม่ใช่ sandbox ภายใน
  sandbox, `env` และ `apiKey` จะไม่มีผล ดู
  [Skills config](/th/tools/skills-config#sandboxed-skills-and-env-vars) สำหรับวิธี
  ส่ง secrets เข้าไปในการรันแบบ sandboxed
</Warning>

สำหรับ backend `claude-cli` แบบ bundled OpenClaw จะ materialize snapshot ของ Skill
ที่มีสิทธิ์เดียวกันเป็น Plugin Claude Code ชั่วคราวและส่งผ่าน
`--plugin-dir` backend CLI อื่นใช้เฉพาะ catalog ของ prompt

## Snapshots และการ refresh

OpenClaw จะ snapshot Skills ที่มีสิทธิ์ **เมื่อ session เริ่มต้น** และใช้
รายการนั้นซ้ำสำหรับ turn ถัดไปทั้งหมดใน session การเปลี่ยนแปลง Skills หรือ config จะ
มีผลใน session ใหม่ครั้งถัดไป

Skills จะ refresh กลาง session ในสองกรณี:

- ตัวเฝ้าดู Skills ตรวจพบการเปลี่ยนแปลง `SKILL.md`
- remote node ใหม่ที่มีสิทธิ์เชื่อมต่อเข้ามา

รายการที่ refresh แล้วจะถูกใช้ใน turn ถัดไปของ agent หาก allowlist ของ agent ที่มีผล
เปลี่ยนแปลง OpenClaw จะ refresh snapshot เพื่อให้ Skills ที่มองเห็นสอดคล้องกัน

<AccordionGroup>
  <Accordion title="ตัวเฝ้าดู Skills">
    โดยค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ Skill และ bump snapshot เมื่อ
    ไฟล์ `SKILL.md` เปลี่ยนแปลง กำหนดค่าภายใต้ `skills.load`:

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

    ใช้ `allowSymlinkTargets` สำหรับ layout ที่ symlink โดยตั้งใจ ซึ่ง symlink
    root ของ Skill ชี้ออกไปนอก root ที่กำหนดค่าไว้ เช่น
    `<workspace>/skills/manager -> ~/Projects/manager/skills`
    เปิดใช้ `skills.workshop.allowSymlinkTargetWrites` เฉพาะเมื่อ Skill Workshop
    ควรนำ proposal ไปใช้ผ่านพาธ symlink ที่เชื่อถือเหล่านั้นด้วย

  </Accordion>
  <Accordion title="remote node ของ macOS (Linux gateway)">
    หาก Gateway ทำงานบน Linux แต่มี **node ของ macOS** เชื่อมต่ออยู่พร้อมกับ
    `system.run` ที่อนุญาต OpenClaw สามารถถือว่า Skills เฉพาะ macOS มีสิทธิ์ได้เมื่อ
    ไบนารีที่จำเป็นมีอยู่บน node นั้น agent ควรรัน Skills เหล่านั้น
    ผ่านเครื่องมือ `exec` ด้วย `host=node`

    node ที่ offline จะ **ไม่** ทำให้ Skills แบบ remote-only มองเห็นได้ หาก node หยุด
    ตอบ bin probes OpenClaw จะล้าง bin matches ที่ cache ไว้ของ node นั้น

  </Accordion>
</AccordionGroup>

## ผลกระทบต่อ token

เมื่อ Skills มีสิทธิ์ OpenClaw จะ inject บล็อก XML แบบกะทัดรัดเข้าไปใน system
prompt ค่าใช้จ่ายเป็นแบบ deterministic:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **overhead พื้นฐาน** (เฉพาะเมื่อมี Skill ≥ 1 รายการ): ~195 ตัวอักษร
- **ต่อ Skill:** ~97 ตัวอักษร + ความยาวฟิลด์ `name`, `description`, และ `location` ของคุณ
- การ escape XML จะขยาย `& < > " '` เป็น entities ทำให้เพิ่มขึ้นอีกไม่กี่ตัวอักษรต่อครั้งที่พบ
- ที่ประมาณ ~4 ตัวอักษร/token, 97 ตัวอักษร ≈ 24 token ต่อ Skill ก่อนรวมความยาวฟิลด์

เขียน description ให้สั้นและสื่อความหมายเพื่อลด overhead ของ prompt

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้าง Skills" href="/th/tools/creating-skills" icon="hammer">
    คู่มือทีละขั้นตอนสำหรับการเขียน Skill แบบกำหนดเอง
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    คิว proposal สำหรับ Skills ที่ agent ร่างขึ้น
  </Card>
  <Card title="Skills config" href="/th/tools/skills-config" icon="gear">
    schema config `skills.*` ฉบับเต็มและ allowlist ของ agent
  </Card>
  <Card title="Slash commands" href="/th/tools/slash-commands" icon="terminal">
    วิธีลงทะเบียนและ route slash commands ของ Skill
  </Card>
  <Card title="ClawHub" href="/th/clawhub" icon="cloud">
    เรียกดูและเผยแพร่ Skills บน public registry
  </Card>
  <Card title="Plugins" href="/th/tools/plugin" icon="plug">
    Plugins สามารถส่งมอบ Skills ควบคู่กับเครื่องมือที่เอกสารอธิบายได้
  </Card>
</CardGroup>
