---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนกฎการควบคุมหรือกฎการโหลดของ Skills
summary: 'Skills: แบบจัดการโดยระบบเทียบกับแบบ workspace, กฎการควบคุม และการเชื่อมต่อ config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-25T14:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw ใช้โฟลเดอร์ Skills ที่เข้ากันได้กับ **[AgentSkills](https://agentskills.io)** เพื่อสอน agent ให้รู้วิธีใช้เครื่องมือ แต่ละ skill เป็นไดเรกทอรีที่มี `SKILL.md` พร้อม YAML frontmatter และคำสั่ง OpenClaw จะโหลด **bundled skills** พร้อม local overrides แบบไม่บังคับ และกรองตอนโหลดตาม environment, config และการมีอยู่ของ binary

## ตำแหน่งและลำดับความสำคัญ

OpenClaw โหลด Skills จากแหล่งต่อไปนี้:

1. **โฟลเดอร์ skill เพิ่มเติม**: กำหนดผ่าน `skills.load.extraDirs`
2. **bundled skills**: มาพร้อมกับการติดตั้ง (แพ็กเกจ npm หรือ OpenClaw.app)
3. **managed/local skills**: `~/.openclaw/skills`
4. **personal agent skills**: `~/.agents/skills`
5. **project agent skills**: `<workspace>/.agents/skills`
6. **workspace skills**: `<workspace>/skills`

หากชื่อ skill ชนกัน ลำดับความสำคัญคือ:

`<workspace>/skills` (สูงสุด) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled skills → `skills.load.extraDirs` (ต่ำสุด)

## Skills แยกตาม agent เทียบกับ Skills ที่ใช้ร่วมกัน

ในการตั้งค่าแบบ **multi-agent** แต่ละ agent จะมี workspace ของตัวเอง ซึ่งหมายความว่า:

- **Per-agent skills** อยู่ใน `<workspace>/skills` สำหรับ agent นั้นเท่านั้น
- **Project agent skills** อยู่ใน `<workspace>/.agents/skills` และมีผลกับ
  workspace นั้นก่อนโฟลเดอร์ `skills/` ปกติของ workspace
- **Personal agent skills** อยู่ใน `~/.agents/skills` และมีผลข้าม
  workspaces บนเครื่องนั้น
- **Shared skills** อยู่ใน `~/.openclaw/skills` (managed/local) และมองเห็นได้
  สำหรับ **ทุก agents** บนเครื่องเดียวกัน
- **Shared folders** ยังสามารถเพิ่มได้ผ่าน `skills.load.extraDirs` (ลำดับความสำคัญต่ำสุด)
  หากคุณต้องการชุด Skills กลางที่ใช้โดยหลาย agents

หากมี skill ชื่อเดียวกันอยู่มากกว่าหนึ่งที่ จะใช้ลำดับความสำคัญปกติ:
workspace ชนะก่อน จากนั้น project agent skills แล้ว personal agent skills
จากนั้น managed/local แล้ว bundled แล้วจึง extra dirs

## allowlists ของ Agent skill

**ตำแหน่ง** ของ skill และ **การมองเห็น** ของ skill เป็นการควบคุมคนละส่วน

- ตำแหน่ง/ลำดับความสำคัญ ใช้ตัดสินว่า skill ชื่อเดียวกันชุดใดจะชนะ
- allowlists ของ agent ใช้ตัดสินว่า skill ที่มองเห็นได้ตัวใดที่ agent สามารถใช้ได้จริง

ใช้ `agents.defaults.skills` สำหรับ baseline ที่ใช้ร่วมกัน แล้ว override แยกตาม agent ด้วย
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // สืบทอด github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ defaults
      { id: "locked-down", skills: [] }, // ไม่มี skills
    ],
  },
}
```

กฎ:

- ละ `agents.defaults.skills` หากต้องการให้ skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- ละ `agents.list[].skills` เพื่อสืบทอด `agents.defaults.skills`
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับ agent นั้น;
  จะไม่ merge กับ defaults

OpenClaw ใช้ชุด agent skill ที่มีผลจริงกับการสร้าง prompt การค้นหา skill slash-command การซิงก์ sandbox และ snapshots ของ skill

## Plugins + Skills

Plugins สามารถมาพร้อม Skills ของตัวเองได้โดยระบุไดเรกทอรี `skills` ใน
`openclaw.plugin.json` (เป็นพาธสัมพัทธ์จากรากของ plugin) Plugin skills จะถูกโหลดเมื่อ plugin ถูกเปิดใช้ นี่คือตำแหน่งที่เหมาะสมสำหรับคู่มือการใช้งานเฉพาะเครื่องมือที่ยาวเกินกว่าจะใส่ในคำอธิบายเครื่องมือ แต่ควรพร้อมใช้ทุกครั้งที่ติดตั้ง plugin; ตัวอย่างเช่น browser plugin มาพร้อม skill
`browser-automation` สำหรับการควบคุมเบราว์เซอร์หลายขั้นตอน ปัจจุบันไดเรกทอรีเหล่านั้นจะถูกรวมเข้าในพาธลำดับความสำคัญต่ำเดียวกันกับ
`skills.load.extraDirs` ดังนั้น skill ชื่อเดียวกันที่เป็น bundled, managed, agent หรือ workspace จะ override ได้
คุณสามารถควบคุมมันได้ผ่าน `metadata.openclaw.requires.config` บนรายการ config ของ plugin
ดู [Plugins](/th/tools/plugin) สำหรับการค้นหา/การกำหนดค่า และ [Tools](/th/tools) สำหรับ
พื้นผิวเครื่องมือที่ Skills เหล่านั้นสอน

## Skill Workshop

Plugin Skill Workshop แบบทดลองและไม่บังคับ สามารถสร้างหรืออัปเดต workspace
skills จากขั้นตอนที่นำกลับมาใช้ซ้ำได้ซึ่งตรวจพบระหว่างงานของ agent โดยถูกปิดไว้ตามค่าเริ่มต้นและต้องเปิดใช้อย่างชัดเจนผ่าน
`plugins.entries.skill-workshop`

Skill Workshop จะเขียนเฉพาะไปยัง `<workspace>/skills` สแกนเนื้อหาที่สร้างขึ้น
รองรับการอนุมัติแบบรอดำเนินการหรือการเขียนอัตโนมัติแบบปลอดภัย กักกัน
ข้อเสนอที่ไม่ปลอดภัย และรีเฟรช snapshot ของ skill หลังจากเขียนสำเร็จ เพื่อให้ skills ใหม่พร้อมใช้งานได้โดยไม่ต้องรีสตาร์ท Gateway

ใช้เมื่อคุณต้องการให้การแก้ไข เช่น “ครั้งหน้าให้ตรวจสอบ attribution ของ GIF” หรือเวิร์กโฟลว์ที่ได้มาด้วยความพยายาม เช่นเช็กลิสต์ media QA กลายเป็นคำสั่งเชิงขั้นตอนแบบถาวร เริ่มด้วยโหมด pending approval; ใช้การเขียนอัตโนมัติเฉพาะใน workspaces ที่เชื่อถือได้หลังจากตรวจสอบข้อเสนอแล้ว คู่มือฉบับเต็ม:
[Plugin Skill Workshop](/th/plugins/skill-workshop)

## ClawHub (ติดตั้ง + ซิงก์)

ClawHub คือรีจิสทรีสาธารณะของ Skills สำหรับ OpenClaw เรียกดูได้ที่
[https://clawhub.ai](https://clawhub.ai) ใช้คำสั่ง `openclaw skills`
แบบเนทีฟเพื่อค้นหา/ติดตั้ง/อัปเดต skills หรือใช้ CLI `clawhub` แยกต่างหากเมื่อคุณต้องการเวิร์กโฟลว์ publish/sync
คู่มือฉบับเต็ม: [ClawHub](/th/tools/clawhub)

เวิร์กโฟลว์ทั่วไป:

- ติดตั้ง skill ลงใน workspace ของคุณ:
  - `openclaw skills install <skill-slug>`
- อัปเดต skills ที่ติดตั้งทั้งหมด:
  - `openclaw skills update --all`
- ซิงก์ (สแกน + publish การอัปเดต):
  - `clawhub sync --all`

`openclaw skills install` แบบเนทีฟจะติดตั้งลงในไดเรกทอรี `skills/` ของ workspace ที่ใช้งานอยู่ ส่วน CLI `clawhub` แยกต่างหากก็จะติดตั้งลงใน `./skills` ใต้ไดเรกทอรีทำงานปัจจุบันของคุณ (หรือ fallback ไปยัง workspace OpenClaw ที่ตั้งค่าไว้)
OpenClaw จะรับสิ่งนี้เป็น `<workspace>/skills` ในเซสชันถัดไป

## หมายเหตุด้านความปลอดภัย

- ให้ถือว่า third-party skills เป็น **โค้ดที่ไม่น่าเชื่อถือ** อ่านก่อนเปิดใช้
- ควรใช้การรันแบบ sandboxed สำหรับอินพุตที่ไม่น่าเชื่อถือและเครื่องมือที่มีความเสี่ยง ดู [Sandboxing](/th/gateway/sandboxing)
- การค้นหา skill ของ workspace และ extra-dir จะยอมรับเฉพาะ skill roots และไฟล์ `SKILL.md` ที่ realpath ที่ resolve แล้ว ยังคงอยู่ภายใน root ที่กำหนดค่าไว้
- การติดตั้ง dependency ของ skill ที่มี Gateway อยู่เบื้องหลัง (`skills.install`, onboarding และ Skills settings UI) จะรัน dangerous-code scanner ในตัวก่อนดำเนินการ metadata ของ installer การพบระดับ `critical` จะถูกบล็อกโดยค่าเริ่มต้น เว้นแต่ผู้เรียกจะตั้ง dangerous override อย่างชัดเจน; การพบที่น่าสงสัยยังคงเป็นเพียงคำเตือนเท่านั้น
- `openclaw skills install <slug>` แตกต่างออกไป: มันดาวน์โหลดโฟลเดอร์ skill จาก ClawHub ลงใน workspace และไม่ใช้เส้นทาง installer-metadata ข้างต้น
- `skills.entries.*.env` และ `skills.entries.*.apiKey` จะฉีด secrets เข้าไปในโปรเซสของ **host**
  สำหรับ agent turn นั้น (ไม่ใช่ sandbox) เก็บ secrets ให้พ้นจาก prompts และ logs
- สำหรับ threat model และเช็กลิสต์ที่กว้างกว่า ดู [Security](/th/gateway/security)

## รูปแบบ (AgentSkills + ใช้ร่วมกับ Pi ได้)

`SKILL.md` ต้องมีอย่างน้อย:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

หมายเหตุ:

- เราปฏิบัติตามสเปก AgentSkills สำหรับโครงสร้าง/เจตนา
- parser ที่ agent แบบฝังตัวใช้รองรับ frontmatter แบบ **คีย์บรรทัดเดียว** เท่านั้น
- `metadata` ควรเป็น **ออบเจ็กต์ JSON บรรทัดเดียว**
- ใช้ `{baseDir}` ในคำสั่งเพื่ออ้างอิงพาธโฟลเดอร์ของ skill
- คีย์ frontmatter แบบไม่บังคับ:
  - `homepage` — URL ที่แสดงเป็น “Website” ใน macOS Skills UI (รองรับผ่าน `metadata.openclaw.homepage` ด้วย)
  - `user-invocable` — `true|false` (ค่าเริ่มต้น: `true`) เมื่อเป็น `true` skill จะถูกเปิดเผยเป็น user slash command
  - `disable-model-invocation` — `true|false` (ค่าเริ่มต้น: `false`) เมื่อเป็น `true` skill จะถูกตัดออกจาก model prompt (แต่ยังใช้ได้ผ่านการเรียกโดยผู้ใช้)
  - `command-dispatch` — `tool` (ไม่บังคับ) เมื่อกำหนดเป็น `tool` slash command จะข้าม model และ dispatch ไปยัง tool โดยตรง
  - `command-tool` — ชื่อ tool ที่จะเรียกเมื่อกำหนด `command-dispatch: tool`
  - `command-arg-mode` — `raw` (ค่าเริ่มต้น) สำหรับการ dispatch ไปยัง tool จะส่งต่อสตริง args แบบดิบไปยัง tool (ไม่มี core parsing)

    tool จะถูกเรียกด้วย params:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`

## Gating (ตัวกรองตอนโหลด)

OpenClaw จะ **กรอง Skills ตอนโหลด** โดยใช้ `metadata` (JSON บรรทัดเดียว):

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

- `always: true` — รวม skill นี้เสมอ (ข้าม gates อื่น)
- `emoji` — emoji แบบไม่บังคับที่ใช้โดย macOS Skills UI
- `homepage` — URL แบบไม่บังคับที่แสดงเป็น “Website” ใน macOS Skills UI
- `os` — รายการแพลตฟอร์มแบบไม่บังคับ (`darwin`, `linux`, `win32`) หากกำหนดไว้ skill จะใช้ได้เฉพาะบน OS เหล่านั้น
- `requires.bins` — รายการ; แต่ละตัวต้องมีอยู่บน `PATH`
- `requires.anyBins` — รายการ; อย่างน้อยหนึ่งตัวต้องมีอยู่บน `PATH`
- `requires.env` — รายการ; ตัวแปร env ต้องมีอยู่ **หรือ** ถูกระบุผ่าน config
- `requires.config` — รายการของพาธ `openclaw.json` ที่ต้องเป็น truthy
- `primaryEnv` — ชื่อตัวแปร env ที่สัมพันธ์กับ `skills.entries.<name>.apiKey`
- `install` — อาร์เรย์ของ installer specs แบบไม่บังคับที่ใช้โดย macOS Skills UI (brew/node/go/uv/download)

บล็อก `metadata.clawdbot` แบบเดิมยังคงยอมรับได้เมื่อ
ไม่มี `metadata.openclaw` ดังนั้น skills ที่ติดตั้งรุ่นเก่าจะยังคงใช้ dependency
gates และ installer hints ได้ Skills ใหม่และ Skills ที่อัปเดตแล้วควรใช้
`metadata.openclaw`

หมายเหตุเกี่ยวกับ sandboxing:

- `requires.bins` จะถูกตรวจสอบบน **host** ตอนโหลด skill
- หาก agent ถูก sandboxed binary นั้นก็ต้องมีอยู่ **ภายใน container** ด้วย
  ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` (หรือใช้ image แบบกำหนดเอง)
  `setupCommand` จะรันหนึ่งครั้งหลังจากสร้าง container แล้ว
  การติดตั้งแพ็กเกจยังต้องการ network egress, root FS ที่เขียนได้ และผู้ใช้ root ใน sandbox
  ตัวอย่าง: skill `summarize` (`skills/summarize/SKILL.md`) ต้องมี CLI `summarize`
  อยู่ใน sandbox container เพื่อให้รันที่นั่นได้

ตัวอย่าง installer:

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

หมายเหตุ:

- หากมี installer หลายตัว gateway จะเลือกตัวเลือกที่ต้องการเพียง **หนึ่ง** ตัว (brew หากมี ไม่เช่นนั้นใช้ node)
- หาก installer ทั้งหมดเป็น `download` OpenClaw จะแสดงทุกรายการเพื่อให้คุณเห็น artifacts ที่มี
- Installer specs สามารถมี `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตัวเลือกตามแพลตฟอร์ม
- การติดตั้งแบบ Node จะใช้ `skills.install.nodeManager` ใน `openclaw.json` (ค่าเริ่มต้น: npm; ตัวเลือก: npm/pnpm/yarn/bun)
  สิ่งนี้มีผลเฉพาะกับ **การติดตั้ง skill**; runtime ของ Gateway ยังคงควรเป็น Node
  (ไม่แนะนำ Bun สำหรับ WhatsApp/Telegram)
- การเลือก installer ที่มี Gateway อยู่เบื้องหลังขับเคลื่อนด้วย preference ไม่ใช่เฉพาะ node:
  เมื่อ install specs มีหลาย kind ปะปนกัน OpenClaw จะให้ Homebrew มาก่อนเมื่อ
  เปิด `skills.install.preferBrew` และมี `brew` จากนั้นเป็น `uv` แล้วจึงใช้
  node manager ที่กำหนดค่าไว้ แล้วค่อยเป็น fallbacks อื่น เช่น `go` หรือ `download`
- หาก install spec ทุกตัวเป็น `download` OpenClaw จะแสดงตัวเลือกดาวน์โหลดทั้งหมด
  แทนที่จะยุบเหลือ installer ตัวเดียวที่ต้องการ
- การติดตั้งแบบ Go: หากไม่มี `go` และมี `brew` gateway จะติดตั้ง Go ผ่าน Homebrew ก่อน และตั้ง `GOBIN` ไปที่ `bin` ของ Homebrew เมื่อทำได้
- การติดตั้งแบบ Download: `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (ค่าเริ่มต้น: อัตโนมัติเมื่อพบ archive), `stripComponents`, `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)

หากไม่มี `metadata.openclaw` skill จะถือว่าใช้ได้เสมอ (เว้นแต่
จะถูกปิดใน config หรือถูกบล็อกด้วย `skills.allowBundled` สำหรับ bundled skills)

## การ override config (`~/.openclaw/openclaw.json`)

bundled/managed skills สามารถเปิดปิดและรับค่า env ได้:

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

หมายเหตุ: หากชื่อ skill มีเครื่องหมายขีดกลาง ให้ใส่เครื่องหมายอัญประกาศรอบคีย์ (JSON5 อนุญาตคีย์ที่ใส่เครื่องหมายอัญประกาศได้)

หากคุณต้องการการสร้าง/แก้ไขรูปภาพแบบมาตรฐานภายใน OpenClaw เอง ให้ใช้
เครื่องมือหลัก `image_generate` กับ `agents.defaults.imageGenerationModel` แทน
bundled skill ตัวอย่าง Skills ที่นี่มีไว้สำหรับเวิร์กโฟลว์แบบกำหนดเองหรือของ third-party

สำหรับการวิเคราะห์รูปภาพแบบเนทีฟ ให้ใช้เครื่องมือ `image` กับ `agents.defaults.imageModel`
สำหรับการสร้าง/แก้ไขรูปภาพแบบเนทีฟ ให้ใช้ `image_generate` กับ
`agents.defaults.imageGenerationModel` หากคุณเลือก `openai/*`, `google/*`,
`fal/*` หรือโมเดลรูปภาพเฉพาะ provider อื่น ๆ ให้เพิ่ม auth/API
key ของ provider นั้นด้วย

คีย์ config จะตรงกับ **ชื่อ skill** โดยค่าเริ่มต้น หาก skill กำหนด
`metadata.openclaw.skillKey` ให้ใช้คีย์นั้นภายใต้ `skills.entries`

กฎ:

- `enabled: false` จะปิดใช้งาน skill แม้ว่าจะเป็น bundled/installed ก็ตาม
- `env`: จะถูก inject **เฉพาะเมื่อ** ตัวแปรนั้นยังไม่ได้ถูกตั้งค่าไว้ใน process
- `apiKey`: ตัวช่วยสำหรับ skills ที่ประกาศ `metadata.openclaw.primaryEnv`
  รองรับสตริง plaintext หรือออบเจ็กต์ SecretRef (`{ source, provider, id }`)
- `config`: ถุงข้อมูลแบบไม่บังคับสำหรับฟิลด์เฉพาะ skill แบบกำหนดเอง; คีย์แบบกำหนดเองต้องอยู่ที่นี่
- `allowBundled`: allowlist แบบไม่บังคับสำหรับ **bundled** skills เท่านั้น หากกำหนดไว้
  จะมีสิทธิ์เฉพาะ bundled skills ที่อยู่ในรายการเท่านั้น (managed/workspace skills ไม่ได้รับผลกระทบ)

## การ inject environment (ต่อการรัน agent)

เมื่อการรัน agent เริ่มขึ้น OpenClaw จะ:

1. อ่าน metadata ของ skill
2. ใช้ `skills.entries.<key>.env` หรือ `skills.entries.<key>.apiKey` กับ
   `process.env`
3. สร้าง system prompt ด้วย skills ที่ **มีสิทธิ์ใช้งาน**
4. กู้คืน environment เดิมหลังจากการรันสิ้นสุด

สิ่งนี้มี **ขอบเขตอยู่ที่การรัน agent** ไม่ใช่ global shell environment

สำหรับ backend `claude-cli` ที่รวมมาในระบบ OpenClaw ยังทำให้ snapshot ที่มีสิทธิ์ใช้งานเดียวกันนี้เป็น Claude Code plugin ชั่วคราว และส่งผ่านด้วย
`--plugin-dir` จากนั้น Claude Code จึงสามารถใช้ตัว resolve skill แบบเนทีฟของมันได้ ขณะที่ OpenClaw ยังคงเป็นผู้ควบคุมลำดับความสำคัญ per-agent allowlists gating และการ inject env/API key ของ `skills.entries.*`
ส่วน CLI backends อื่นจะใช้เพียงแค็ตตาล็อกใน prompt เท่านั้น

## Session snapshot (ประสิทธิภาพ)

OpenClaw จะทำ snapshot ของ skills ที่มีสิทธิ์ใช้งาน **เมื่อเซสชันเริ่มต้น** และใช้รายการนั้นซ้ำสำหรับ turns ถัดไปในเซสชันเดียวกัน การเปลี่ยนแปลง skills หรือ config จะมีผลในเซสชันใหม่ถัดไป

Skills ยังสามารถรีเฟรชระหว่างเซสชันได้เมื่อเปิดใช้ skills watcher หรือเมื่อมี remote node ใหม่ที่มีสิทธิ์ใช้งานปรากฏขึ้น (ดูด้านล่าง) ให้คิดว่านี่คือ **hot reload**: รายการที่รีเฟรชแล้วจะถูกนำไปใช้ใน agent turn ถัดไป

หาก effective agent skill allowlist เปลี่ยนแปลงสำหรับเซสชันนั้น OpenClaw จะ
รีเฟรช snapshot เพื่อให้ skills ที่มองเห็นได้ยังคงสอดคล้องกับ agent ปัจจุบัน

## macOS nodes ระยะไกล (Linux gateway)

หาก Gateway รันอยู่บน Linux แต่มี **macOS node** เชื่อมต่ออยู่ **โดยอนุญาต `system.run`** (การรักษาความปลอดภัยของ Exec approvals ไม่ได้ตั้งเป็น `deny`) OpenClaw สามารถถือว่า skills ที่ใช้ได้เฉพาะบน macOS มีสิทธิ์ใช้งานได้ เมื่อ binaries ที่จำเป็นมีอยู่บน node นั้น agent ควรเรียกใช้ skills เหล่านั้นผ่านเครื่องมือ `exec` โดยใช้ `host=node`

สิ่งนี้อาศัยการที่ node รายงานการรองรับคำสั่งของตัวเองและการตรวจสอบ bin ผ่าน `system.run` หาก macOS node ออฟไลน์ในภายหลัง skills จะยังคงมองเห็นได้; การเรียกใช้อาจล้มเหลวจนกว่า node จะเชื่อมต่อใหม่

## Skills watcher (รีเฟรชอัตโนมัติ)

โดยค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ skill และเพิ่มเวอร์ชัน snapshot ของ skills เมื่อไฟล์ `SKILL.md` เปลี่ยนแปลง กำหนดค่านี้ภายใต้ `skills.load`:

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

## ผลกระทบต่อโทเค็น (รายการ skills)

เมื่อ skills มีสิทธิ์ใช้งาน OpenClaw จะ inject รายการ XML แบบกะทัดรัดของ skills ที่ใช้ได้ลงใน system prompt (ผ่าน `formatSkillsForPrompt` ใน `pi-coding-agent`) ค่าใช้จ่ายเป็นแบบ deterministic:

- **Base overhead (เฉพาะเมื่อมี ≥1 skill):** 195 อักขระ
- **ต่อ skill:** 97 อักขระ + ความยาวของค่า `<name>`, `<description>` และ `<location>` ที่ผ่านการ escape แบบ XML แล้ว

สูตร (อักขระ):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

หมายเหตุ:

- การ escape แบบ XML จะขยาย `& < > " '` เป็น entities (`&amp;`, `&lt;` ฯลฯ) ทำให้ความยาวเพิ่มขึ้น
- จำนวนโทเค็นจะแตกต่างกันไปตาม tokenizer ของโมเดล การประมาณแบบคร่าว ๆ สไตล์ OpenAI คือ ~4 อักขระ/โทเค็น ดังนั้น **97 อักขระ ≈ 24 โทเค็น** ต่อ skill บวกความยาวจริงของฟิลด์ของคุณ

## วงจรชีวิตของ managed skills

OpenClaw มาพร้อมชุด Skills พื้นฐานเป็น **bundled skills** ซึ่งเป็นส่วนหนึ่งของการติดตั้ง (แพ็กเกจ npm หรือ OpenClaw.app) `~/.openclaw/skills` มีไว้สำหรับ
local overrides (เช่น pin/patch skill โดยไม่เปลี่ยน bundled
copy) workspace skills เป็นของผู้ใช้และจะ override ทั้งสองแบบเมื่อชื่อชนกัน

## ข้อมูลอ้างอิง config

ดู [Skills config](/th/tools/skills-config) สำหรับ schema การกำหนดค่าแบบเต็ม

## กำลังมองหา Skills เพิ่มเติมอยู่หรือไม่?

เรียกดูได้ที่ [https://clawhub.ai](https://clawhub.ai)

---

## ที่เกี่ยวข้อง

- [การสร้าง Skills](/th/tools/creating-skills) — การสร้าง Skills แบบกำหนดเอง
- [Skills Config](/th/tools/skills-config) — ข้อมูลอ้างอิงการกำหนดค่า skill
- [Slash Commands](/th/tools/slash-commands) — slash commands ที่ใช้ได้ทั้งหมด
- [Plugins](/th/tools/plugin) — ภาพรวมของระบบ plugin
