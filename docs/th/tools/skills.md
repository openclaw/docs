---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนกฎการควบคุมการเข้าถึง allowlist หรือกฎการโหลดของ Skill
    - การทำความเข้าใจลำดับความสำคัญและพฤติกรรม snapshot ของ Skill
sidebarTitle: Skills
summary: 'Skills: แบบ managed เทียบกับแบบ workspace, กฎการควบคุมการเข้าถึง, allowlist ของเอเจนต์ และการเชื่อมต่อคอนฟิก'
title: Skills
x-i18n:
    generated_at: "2026-04-26T11:44:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw ใช้โฟลเดอร์ Skill แบบเข้ากันได้กับ **[AgentSkills](https://agentskills.io)** เพื่อสอนเอเจนต์ให้ใช้เครื่องมือ แต่ละ Skill เป็นไดเรกทอรี
ที่มี `SKILL.md` พร้อม YAML frontmatter และคำแนะนำ OpenClaw
โหลดทั้ง Skills ที่มาพร้อมในชุดและ override แบบ local ที่เป็นตัวเลือก และกรองมัน
ตอนโหลดตามสภาพแวดล้อม คอนฟิก และการมีอยู่ของไบนารี

## ตำแหน่งและลำดับความสำคัญ

OpenClaw โหลด Skills จากแหล่งเหล่านี้ **โดยเรียงจากลำดับความสำคัญสูงสุดก่อน**:

| #   | แหล่งที่มา              | Path                             |
| --- | ----------------------- | -------------------------------- |
| 1   | Workspace Skills        | `<workspace>/skills`             |
| 2   | Project agent Skills    | `<workspace>/.agents/skills`     |
| 3   | Personal agent Skills   | `~/.agents/skills`               |
| 4   | Managed/local Skills    | `~/.openclaw/skills`             |
| 5   | Bundled Skills          | มาพร้อมกับการติดตั้ง            |
| 6   | Extra skill folders     | `skills.load.extraDirs` (คอนฟิก) |

หากชื่อ Skill ชนกัน แหล่งที่มีลำดับสูงกว่าจะชนะ

## Skills ต่อเอเจนต์เทียบกับ Skills แบบใช้ร่วมกัน

ในการตั้งค่าแบบ **Multi-Agent** เอเจนต์แต่ละตัวจะมี workspace ของตัวเอง:

| ขอบเขต              | Path                                        | มองเห็นได้โดย                  |
| -------------------- | ------------------------------------------- | ------------------------------ |
| ต่อเอเจนต์           | `<workspace>/skills`                        | เฉพาะเอเจนต์นั้น              |
| Project-agent        | `<workspace>/.agents/skills`                | เฉพาะเอเจนต์ของ workspace นั้น |
| Personal-agent       | `~/.agents/skills`                          | เอเจนต์ทุกตัวบนเครื่องนั้น     |
| Shared managed/local | `~/.openclaw/skills`                        | เอเจนต์ทุกตัวบนเครื่องนั้น     |
| Shared extra dirs    | `skills.load.extraDirs` (ลำดับต่ำสุด)       | เอเจนต์ทุกตัวบนเครื่องนั้น     |

ชื่อเดียวกันในหลายที่ → แหล่งที่มีลำดับสูงกว่าจะชนะ Workspace ชนะ
project-agent, ชนะ personal-agent, ชนะ managed/local, ชนะ bundled,
ชนะ extra dirs

## allowlist ของ Skill ต่อเอเจนต์

**ตำแหน่ง** ของ Skill และ **การมองเห็น** ของ Skill เป็นตัวควบคุมคนละส่วน
ตำแหน่ง/ลำดับความสำคัญเป็นตัวตัดสินว่าสำเนาไหนของ Skill ชื่อเดียวกันจะชนะ ส่วน
allowlist ของเอเจนต์เป็นตัวตัดสินว่าเอเจนต์จะใช้ Skill ใดได้จริง

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // รับช่วง github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
      { id: "locked-down", skills: [] }, // ไม่มี Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="กฎของ Allowlist">
    - ละเว้น `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดเป็นค่าเริ่มต้น
    - ละเว้น `agents.list[].skills` เพื่อรับช่วง `agents.defaults.skills`
    - ตั้ง `agents.list[].skills: []` หากไม่ต้องการ Skills
    - รายการ `agents.list[].skills` ที่ไม่ว่างจะเป็นชุด **สุดท้าย** สำหรับ
      เอเจนต์นั้น — จะไม่ merge กับค่าเริ่มต้น
    - allowlist ที่มีผลจริงจะถูกใช้กับทั้งการสร้าง prompt, การค้นพบคำสั่ง slash ของ Skill,
      การซิงก์ sandbox และ snapshot ของ Skill
  </Accordion>
</AccordionGroup>

## Plugins และ Skills

Plugins สามารถมาพร้อม Skills ของตัวเองได้โดยระบุไดเรกทอรี `skills` ใน
`openclaw.plugin.json` (path อ้างอิงจากรากของ Plugin) Skills ของ Plugin
จะถูกโหลดเมื่อเปิดใช้ Plugin นี่คือที่ที่เหมาะสมสำหรับคู่มือการใช้งานเฉพาะเครื่องมือ
ที่ยาวเกินไปสำหรับคำอธิบายของเครื่องมือ แต่ควรพร้อมใช้งานทุกครั้งที่ติดตั้ง Plugin แล้ว — ตัวอย่างเช่น browser
plugin มาพร้อม Skill `browser-automation` สำหรับควบคุมเบราว์เซอร์หลายขั้นตอน

ไดเรกทอรี Skill ของ Plugin จะถูกรวมเข้าใน path ลำดับต่ำเดียวกันกับ
`skills.load.extraDirs` ดังนั้น Skill ชื่อเดียวกันจาก bundled, managed, agent หรือ
workspace จะ override มันได้ คุณสามารถควบคุมการเข้าถึงมันผ่าน
`metadata.openclaw.requires.config` บนรายการคอนฟิกของ Plugin ได้

ดู [Plugins](/th/tools/plugin) สำหรับการค้นพบ/คอนฟิก และ [Tools](/th/tools) สำหรับ
พื้นผิวของเครื่องมือที่ Skills เหล่านั้นสอนใช้งาน

## Skill Workshop

Plugin **Skill Workshop** แบบทดลองและเป็นตัวเลือก สามารถสร้างหรืออัปเดต
workspace Skills จากขั้นตอนที่นำกลับมาใช้ใหม่ได้ซึ่งสังเกตได้ระหว่างการทำงานของเอเจนต์ โดย
ปิดอยู่เป็นค่าเริ่มต้น และต้องเปิดใช้อย่างชัดเจนผ่าน
`plugins.entries.skill-workshop`

Skill Workshop จะเขียนเฉพาะไปที่ `<workspace>/skills`, สแกน
เนื้อหาที่สร้างขึ้น รองรับการอนุมัติแบบ pending หรือการเขียนอัตโนมัติที่ปลอดภัย กักกันข้อเสนอที่ไม่ปลอดภัย และรีเฟรช snapshot ของ Skill หลังจากเขียนสำเร็จ เพื่อให้ Skill ใหม่พร้อมใช้งานได้โดยไม่ต้องรีสตาร์ต Gateway

ใช้สำหรับการแก้ไขเช่น _"ครั้งหน้า ให้ตรวจสอบการให้เครดิต GIF"_ หรือ
เวิร์กโฟลว์ที่ได้มาด้วยความยากลำบาก เช่น checklist สำหรับ QA ด้านสื่อ เริ่มด้วย pending
approval; ใช้การเขียนอัตโนมัติเฉพาะใน workspace ที่เชื่อถือได้หลังจากตรวจสอบ
ข้อเสนอแล้ว คู่มือฉบับเต็ม: [Skill Workshop plugin](/th/plugins/skill-workshop)

## ClawHub (ติดตั้งและซิงก์)

[ClawHub](https://clawhub.ai) คือ registry สาธารณะของ Skills สำหรับ OpenClaw
ใช้คำสั่ง `openclaw skills` แบบ native สำหรับค้นหา/ติดตั้ง/อัปเดต หรือใช้
CLI `clawhub` แยกต่างหากสำหรับเวิร์กโฟลว์ publish/sync คู่มือฉบับเต็ม:
[ClawHub](/th/tools/clawhub)

| การกระทำ                           | คำสั่ง                                 |
| ---------------------------------- | -------------------------------------- |
| ติดตั้ง Skill ลงใน workspace       | `openclaw skills install <skill-slug>` |
| อัปเดต Skills ที่ติดตั้งทั้งหมด    | `openclaw skills update --all`         |
| ซิงก์ (สแกน + publish การอัปเดต)   | `clawhub sync --all`                   |

`openclaw skills install` แบบ native จะติดตั้งลงในไดเรกทอรี
`skills/` ของ workspace ที่กำลังใช้งาน ส่วน CLI `clawhub` แยกต่างหากก็จะติดตั้งลงใน
`./skills` ภายใต้ไดเรกทอรีทำงานปัจจุบันของคุณด้วย (หรือ fallback ไปยัง
workspace ของ OpenClaw ที่ตั้งค่าไว้) OpenClaw จะตรวจพบสิ่งนี้เป็น
`<workspace>/skills` ในเซสชันถัดไป

## ความปลอดภัย

<Warning>
ให้ถือว่า Skill จากบุคคลที่สามเป็น **โค้ดที่ไม่น่าเชื่อถือ** อ่านมันก่อนเปิดใช้
ควรใช้การรันแบบ sandbox สำหรับอินพุตที่ไม่น่าเชื่อถือและเครื่องมือที่มีความเสี่ยง ดู
[Sandboxing](/th/gateway/sandboxing) สำหรับตัวควบคุมฝั่งเอเจนต์
</Warning>

- การค้นพบ Skill จาก workspace และ extra-dir จะยอมรับเฉพาะรากของ Skill และไฟล์ `SKILL.md` ที่ realpath ที่ resolve แล้ว ยังอยู่ภายในรากที่ตั้งค่าไว้เท่านั้น
- การติดตั้ง dependency ของ Skill ที่ทำผ่าน Gateway (`skills.install`, onboarding และ Skills settings UI) จะรันตัวสแกนโค้ดอันตรายที่มาพร้อมในตัวก่อนดำเนินการตาม metadata ของตัวติดตั้ง สิ่งที่พบระดับ `critical` จะถูกบล็อกเป็นค่าเริ่มต้น เว้นแต่ผู้เรียกจะตั้ง dangerous override อย่างชัดเจน; ส่วนสิ่งที่พบว่าน่าสงสัยยังคงแค่เตือนเท่านั้น
- `openclaw skills install <slug>` แตกต่างออกไป — คำสั่งนี้ดาวน์โหลดโฟลเดอร์ Skill จาก ClawHub ลงใน workspace และไม่ได้ใช้เส้นทาง metadata ของตัวติดตั้งที่กล่าวถึงข้างต้น
- `skills.entries.*.env` และ `skills.entries.*.apiKey` จะ inject secret เข้าไปในโพรเซสของ **โฮสต์** สำหรับเทิร์นของเอเจนต์นั้น (ไม่ใช่ sandbox) ต้องเก็บ secret ออกจาก prompt และ log

สำหรับ threat model และ checklist ที่กว้างกว่า ดู [ความปลอดภัย](/th/gateway/security)

## รูปแบบ `SKILL.md`

`SKILL.md` ต้องมีอย่างน้อย:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw ทำตามสเปก AgentSkills สำหรับ layout/intent parser ที่เอเจนต์ embedded ใช้
รองรับคีย์ frontmatter แบบ **บรรทัดเดียว** เท่านั้น;
`metadata` ควรเป็น **อ็อบเจ็กต์ JSON แบบบรรทัดเดียว** ใช้ `{baseDir}` ใน
คำแนะนำเพื่ออ้างอิง path ของโฟลเดอร์ Skill

### คีย์ frontmatter แบบเลือกได้

<ParamField path="homepage" type="string">
  URL ที่แสดงเป็น "Website" ใน Skills UI ของ macOS รองรับผ่าน `metadata.openclaw.homepage` ด้วย
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  เมื่อเป็น `true`, Skill จะถูกเปิดเผยเป็นคำสั่ง slash สำหรับผู้ใช้
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  เมื่อเป็น `true`, Skill จะถูกตัดออกจาก prompt ของโมเดล (แต่ยังคงเรียกใช้ได้ผ่านการเรียกโดยผู้ใช้)
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  เมื่อตั้งเป็น `tool`, คำสั่ง slash จะข้ามโมเดลและส่งต่อไปยังเครื่องมือโดยตรง
</ParamField>
<ParamField path="command-tool" type="string">
  ชื่อเครื่องมือที่จะเรียกเมื่อมีการตั้ง `command-dispatch: tool`
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  สำหรับการส่งต่อไปยังเครื่องมือ จะส่งต่อสตริง args ดิบไปยังเครื่องมือ (ไม่มีการ parse โดย core) เครื่องมือจะถูกเรียกด้วย `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
</ParamField>

## การควบคุมการเข้าถึง (ตัวกรองตอนโหลด)

OpenClaw กรอง Skills ตอนโหลดโดยใช้ `metadata` (JSON แบบบรรทัดเดียว):

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
  เมื่อเป็น `true`, จะรวม Skill นี้เสมอ (ข้าม gate อื่นทั้งหมด)
</ParamField>
<ParamField path="emoji" type="string">
  emoji แบบเลือกได้ที่ใช้โดย macOS Skills UI
</ParamField>
<ParamField path="homepage" type="string">
  URL แบบเลือกได้ที่แสดงเป็น "Website" ใน macOS Skills UI
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  รายการแพลตฟอร์มแบบเลือกได้ หากตั้งค่าไว้ Skill จะมีสิทธิ์ใช้งานเฉพาะบน OS เหล่านั้น
</ParamField>
<ParamField path="requires.bins" type="string[]">
  ทุกตัวต้องมีอยู่บน `PATH`
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  ต้องมีอย่างน้อยหนึ่งตัวบน `PATH`
</ParamField>
<ParamField path="requires.env" type="string[]">
  ต้องมี env var อยู่ หรือมีให้ผ่านคอนฟิก
</ParamField>
<ParamField path="requires.config" type="string[]">
  รายการ path ใน `openclaw.json` ที่ต้องมีค่า truthy
</ParamField>
<ParamField path="primaryEnv" type="string">
  ชื่อ env var ที่เชื่อมกับ `skills.entries.<name>.apiKey`
</ParamField>
<ParamField path="install" type="object[]">
  สเปกของตัวติดตั้งแบบเลือกได้ที่ใช้โดย macOS Skills UI (brew/node/go/uv/download)
</ParamField>

หากไม่มี `metadata.openclaw`, Skill จะมีสิทธิ์ใช้งานเสมอ (เว้นแต่
ถูกปิดในคอนฟิก หรือถูกบล็อกโดย `skills.allowBundled` สำหรับ bundled skills)

<Note>
บล็อก `metadata.clawdbot` แบบเก่ายังคงรองรับอยู่เมื่อ
ไม่มี `metadata.openclaw` ดังนั้น Skill ที่ติดตั้งไว้เก่ากว่ายังคงรักษา
dependency gate และคำใบ้ของตัวติดตั้งไว้ได้ แต่ Skill ใหม่และ Skill ที่อัปเดตแล้วควรใช้
`metadata.openclaw`
</Note>

### หมายเหตุเกี่ยวกับ sandboxing

- `requires.bins` จะถูกตรวจสอบบน **โฮสต์** ตอนโหลด Skill
- หากเอเจนต์อยู่ใน sandbox ไบนารีนั้นต้องมีอยู่ **ภายในคอนเทนเนอร์** ด้วย ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` (หรือใช้ image แบบกำหนดเอง) `setupCommand` จะรันหนึ่งครั้งหลังจากสร้างคอนเทนเนอร์ การติดตั้งแพ็กเกจยังต้องมี network egress, root FS ที่เขียนได้ และผู้ใช้ root ใน sandbox
- ตัวอย่าง: Skill `summarize` (`skills/summarize/SKILL.md`) ต้องมี CLI `summarize` อยู่ในคอนเทนเนอร์ sandbox จึงจะรันที่นั่นได้

### สเปกของตัวติดตั้ง

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
    - หากมีตัวติดตั้งหลายรายการ Gateway จะเลือกตัวเลือกที่เหมาะสมที่สุดเพียงตัวเดียว (ใช้ brew เมื่อมี ไม่เช่นนั้นใช้ node)
    - หากตัวติดตั้งทั้งหมดเป็น `download`, OpenClaw จะแสดงทุกรายการเพื่อให้คุณเห็นอาร์ติแฟกต์ที่มี
    - สเปกของตัวติดตั้งสามารถมี `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตัวเลือกตามแพลตฟอร์ม
    - การติดตั้งแบบ node จะยึดตาม `skills.install.nodeManager` ใน `openclaw.json` (ค่าเริ่มต้น: npm; ตัวเลือก: npm/pnpm/yarn/bun) ค่านี้มีผลเฉพาะกับการติดตั้ง Skill; ส่วน runtime ของ Gateway ควรยังคงเป็น Node — ไม่แนะนำ Bun สำหรับ WhatsApp/Telegram
    - การเลือกตัวติดตั้งแบบ Gateway-backed เป็นแบบอิงความชอบ: เมื่อสเปกการติดตั้งมีหลายชนิดผสมกัน OpenClaw จะเลือก Homebrew ก่อนเมื่อเปิดใช้ `skills.install.preferBrew` และมี `brew`, จากนั้น `uv`, จากนั้น node manager ที่ตั้งค่าไว้ แล้วจึงเป็น fallback อื่น เช่น `go` หรือ `download`
    - หากสเปกการติดตั้งทุกตัวเป็น `download`, OpenClaw จะเปิดเผยตัวเลือกดาวน์โหลดทั้งหมดแทนที่จะยุบเหลือ installer ที่ต้องการเพียงตัวเดียว
  </Accordion>
  <Accordion title="รายละเอียดต่อชนิดตัวติดตั้ง">
    - **การติดตั้งแบบ Go:** หากไม่มี `go` และมี `brew`, gateway จะติดตั้ง Go ผ่าน Homebrew ก่อน และตั้ง `GOBIN` ไปที่ `bin` ของ Homebrew เมื่อทำได้
    - **การติดตั้งแบบ Download:** `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (ค่าเริ่มต้น: auto เมื่อตรวจพบว่าเป็น archive), `stripComponents`, `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)
  </Accordion>
</AccordionGroup>

## การ override คอนฟิก

Skills แบบ bundled และแบบ managed สามารถเปิด/ปิดและป้อนค่า env
ผ่าน `skills.entries` ใน `~/.openclaw/openclaw.json` ได้:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // หรือสตริง plaintext
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
  `false` จะปิดใช้ Skill แม้ว่าจะเป็นแบบ bundled หรือติดตั้งไว้แล้วก็ตาม
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  ตัวช่วยแบบสะดวกสำหรับ Skill ที่ประกาศ `metadata.openclaw.primaryEnv` รองรับทั้ง plaintext หรือ SecretRef
</ParamField>
<ParamField path="env" type="Record<string, string>">
  จะถูก inject เฉพาะเมื่อยังไม่ได้ตั้งตัวแปรนั้นไว้ในโพรเซส
</ParamField>
<ParamField path="config" type="object">
  ถุงข้อมูลแบบเลือกได้สำหรับฟิลด์เฉพาะต่อ Skill คีย์แบบกำหนดเองต้องอยู่ในนี้
</ParamField>
<ParamField path="allowBundled" type="string[]">
  allowlist แบบเลือกได้สำหรับ **bundled** Skills เท่านั้น หากตั้งค่าไว้ จะมีสิทธิ์ใช้งานเฉพาะ bundled skills ที่อยู่ในรายการ (managed/workspace skills ไม่ได้รับผลกระทบ)
</ParamField>

หากชื่อ Skill มีขีดกลาง ให้ใส่เครื่องหมายอัญประกาศรอบคีย์ (JSON5 รองรับคีย์แบบมีอัญประกาศ) โดยค่าเริ่มต้นคีย์คอนฟิกจะตรงกับ **ชื่อ Skill** — หาก Skill
กำหนด `metadata.openclaw.skillKey`, ให้ใช้คีย์นั้นภายใต้ `skills.entries`

<Note>
สำหรับการสร้าง/แก้ไขภาพแบบมาตรฐานภายใน OpenClaw ให้ใช้
เครื่องมือหลัก `image_generate` ร่วมกับ `agents.defaults.imageGenerationModel` แทน
Skill แบบ bundled ตัวอย่าง Skill ที่นี่มีไว้สำหรับเวิร์กโฟลว์แบบกำหนดเองหรือจากบุคคลที่สาม สำหรับการวิเคราะห์ภาพแบบ native ให้ใช้เครื่องมือ `image` ร่วมกับ
`agents.defaults.imageModel` หากคุณเลือกโมเดลภาพเฉพาะ provider เช่น `openai/*`, `google/*`,
`fal/*` หรือเจ้าอื่น ให้เพิ่ม auth/API key ของ provider นั้นด้วย
</Note>

## การ inject สภาพแวดล้อม

เมื่อเริ่มการรันของเอเจนต์ OpenClaw จะ:

1. อ่าน metadata ของ Skill
2. ใช้ `skills.entries.<key>.env` และ `skills.entries.<key>.apiKey` กับ `process.env`
3. สร้าง system prompt ด้วย Skills ที่ **มีสิทธิ์ใช้งาน**
4. คืนค่าสภาพแวดล้อมเดิมหลังจบการรัน

การ inject สภาพแวดล้อมมี **ขอบเขตอยู่ที่การรันของเอเจนต์** ไม่ใช่
สภาพแวดล้อมของเชลล์แบบโกลบอล

สำหรับ backend `claude-cli` แบบ bundled, OpenClaw จะ materialize
snapshot ที่มีสิทธิ์ใช้งานชุดเดียวกันนั้นให้เป็น Claude Code plugin ชั่วคราว และส่งผ่าน
`--plugin-dir` จากนั้น Claude Code จะใช้ native skill resolver ของตัวเองได้ ขณะที่
OpenClaw ยังคงเป็นเจ้าของลำดับความสำคัญ allowlist ต่อเอเจนต์ gating และ
การ inject env/API key ของ `skills.entries.*` ส่วน CLI backend อื่นจะใช้เพียงแค็ตตาล็อกใน prompt เท่านั้น

## Snapshot และการรีเฟรช

OpenClaw จะทำ snapshot ของ Skills ที่มีสิทธิ์ใช้งาน **เมื่อเซสชันเริ่มต้น** และ
ใช้รายการนั้นซ้ำสำหรับเทิร์นถัด ๆ ไปในเซสชันเดียวกัน การเปลี่ยนแปลง Skills หรือคอนฟิกจะมีผลในเซสชันใหม่ครั้งถัดไป

Skills สามารถรีเฟรชระหว่างเซสชันได้ในสองกรณี:

- เปิดใช้งานตัวเฝ้าดู Skills
- มี remote node ใหม่ที่มีสิทธิ์ใช้งานปรากฏขึ้น

ให้มองสิ่งนี้เป็น **hot reload**: รายการที่รีเฟรชแล้วจะถูกหยิบมาใช้ใน
เทิร์นเอเจนต์ถัดไป หาก allowlist ที่มีผลจริงของเอเจนต์เปลี่ยนไปสำหรับเซสชันนั้น OpenClaw จะรีเฟรช snapshot เพื่อให้ Skills ที่มองเห็นได้ยังคงสอดคล้อง
กับเอเจนต์ปัจจุบัน

### ตัวเฝ้าดู Skills

โดยค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ Skill และกระตุ้น snapshot ของ Skills
เมื่อไฟล์ `SKILL.md` เปลี่ยนแปลง กำหนดค่าได้ภายใต้ `skills.load`:

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

### node macOS ระยะไกล (Linux gateway)

หาก Gateway รันอยู่บน Linux แต่มี **node macOS** เชื่อมต่ออยู่พร้อม
อนุญาต `system.run` (ค่าความปลอดภัยของ Exec approvals ไม่ได้ตั้งเป็น `deny`),
OpenClaw สามารถถือว่า Skills ที่รองรับเฉพาะ macOS มีสิทธิ์ใช้งานได้เมื่อ
ไบนารีที่จำเป็นมีอยู่บน node นั้น เอเจนต์ควรรัน Skills เหล่านั้น
ผ่านเครื่องมือ `exec` ด้วย `host=node`

สิ่งนี้อาศัยให้ node รายงานการรองรับคำสั่งของมัน และอาศัยการ probe ไบนารี
ผ่าน `system.which` หรือ `system.run` node ที่ออฟไลน์อยู่ **จะไม่** ทำให้ Skill
ที่ทำงานได้เฉพาะจากระยะไกลมองเห็นได้ หาก node ที่เชื่อมต่ออยู่หยุดตอบการ probe ไบนารี OpenClaw จะล้างผลจับคู่ไบนารีในแคชของมัน เพื่อไม่ให้เอเจนต์
เห็น Skills ที่ไม่สามารถรันได้จริงในขณะนั้นอีกต่อไป

## ผลกระทบต่อ Token

เมื่อ Skills มีสิทธิ์ใช้งาน OpenClaw จะ inject รายการ XML แบบย่อของ
Skills ที่มีอยู่เข้าไปใน system prompt (ผ่าน `formatSkillsForPrompt` ใน
`pi-coding-agent`) ต้นทุนนี้กำหนดได้แน่นอน:

- **ค่า overhead พื้นฐาน** (เฉพาะเมื่อมี Skill ≥1 รายการ): 195 อักขระ
- **ต่อหนึ่ง Skill:** 97 อักขระ + ความยาวของค่า `<name>`, `<description>` และ `<location>` ที่ผ่าน XML escape แล้ว

สูตร (จำนวนอักขระ):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

การ escape ของ XML จะขยาย `& < > " '` ให้เป็น entity (`&amp;`, `&lt;` ฯลฯ)
ทำให้ความยาวเพิ่มขึ้น จำนวน token จะแตกต่างกันตาม tokenizer ของโมเดล การประมาณแบบคร่าว ๆ
สไตล์ OpenAI คือ ~4 อักขระ/โทเค็น ดังนั้น **97 อักขระ ≈ 24 โทเค็น** ต่อ
Skill หนึ่งรายการ บวกกับความยาวจริงของฟิลด์ของคุณ

## วงจรชีวิตของ managed Skills

OpenClaw มาพร้อมชุดพื้นฐานของ Skills ในฐานะ **bundled skills** ที่มาพร้อมกับ
การติดตั้ง (แพ็กเกจ npm หรือ OpenClaw.app) ส่วน `~/.openclaw/skills` มีไว้สำหรับ
override ในเครื่อง — เช่น ปักหมุดหรือแพตช์ Skill โดยไม่ต้องเปลี่ยนสำเนา bundled เดิม ส่วน workspace skills เป็นของผู้ใช้และ override
ทั้งสองแบบเมื่อชื่อชนกัน

## กำลังมองหา Skills เพิ่มเติมอยู่หรือไม่?

ดูได้ที่ [https://clawhub.ai](https://clawhub.ai) schema ของคอนฟิกฉบับเต็ม:
[คอนฟิก Skills](/th/tools/skills-config)

## ที่เกี่ยวข้อง

- [ClawHub](/th/tools/clawhub) — registry สาธารณะของ Skills
- [การสร้าง Skills](/th/tools/creating-skills) — การสร้าง Skills แบบกำหนดเอง
- [Plugins](/th/tools/plugin) — ภาพรวมของระบบ Plugin
- [Skill Workshop plugin](/th/plugins/skill-workshop) — สร้าง Skills จากงานของเอเจนต์
- [คอนฟิก Skills](/th/tools/skills-config) — ข้อมูลอ้างอิงคอนฟิกของ Skill
- [คำสั่ง Slash](/th/tools/slash-commands) — คำสั่ง slash ที่มีทั้งหมด
