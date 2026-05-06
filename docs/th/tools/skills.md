---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนการควบคุมการเปิดใช้ Skills รายการอนุญาต หรือกฎการโหลด
    - ทำความเข้าใจลำดับความสำคัญของ Skills และลักษณะการทำงานของสแนปชอต
sidebarTitle: Skills
summary: 'Skills: แบบมีการจัดการเทียบกับแบบพื้นที่ทำงาน, กฎการควบคุม, รายการอนุญาตของเอเจนต์, และการเชื่อมโยงการกำหนดค่า'
title: Skills
x-i18n:
    generated_at: "2026-05-06T09:35:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw ใช้โฟลเดอร์ skill ที่**เข้ากันได้กับ [AgentSkills](https://agentskills.io)** เพื่อสอนเอเจนต์ให้ใช้เครื่องมือ แต่ละ skill คือไดเรกทอรีที่มี `SKILL.md` พร้อม YAML frontmatter และคำแนะนำ OpenClaw โหลด skill ที่รวมมาในตัวพร้อมกับการแทนที่ภายในเครื่องแบบเลือกได้ และกรอง skill เหล่านั้นตอนโหลดตามสภาพแวดล้อม การกำหนดค่า และการมีอยู่ของไบนารี

## ตำแหน่งและลำดับความสำคัญ

OpenClaw โหลด skill จากแหล่งเหล่านี้ โดยเรียงจาก**ลำดับความสำคัญสูงสุดก่อน**:

| #   | แหล่งที่มา                 | เส้นทาง                           |
| --- | -------------------------- | --------------------------------- |
| 1   | skill ของ workspace        | `<workspace>/skills`              |
| 2   | skill ของเอเจนต์โปรเจกต์  | `<workspace>/.agents/skills`      |
| 3   | skill ของเอเจนต์ส่วนตัว   | `~/.agents/skills`                |
| 4   | skill ที่จัดการ/ในเครื่อง | `~/.openclaw/skills`              |
| 5   | skill ที่รวมมาในตัว        | มาพร้อมกับการติดตั้ง             |
| 6   | โฟลเดอร์ skill เพิ่มเติม  | `skills.load.extraDirs` (config)  |

ถ้าชื่อ skill ชนกัน แหล่งที่มาที่มีลำดับสูงสุดจะชนะ

ไดเรกทอรี native `$CODEX_HOME/skills` ของ Codex CLI ไม่ใช่หนึ่งใน root ของ skill ของ OpenClaw เหล่านี้ ในโหมด Codex harness การเปิด app-server ภายในเครื่องใช้ Codex home แยกตามเอเจนต์แต่ละตัว ดังนั้น skill ส่วนตัวของ Codex CLI จะไม่ถูกโหลดโดยนัย ใช้ `openclaw migrate codex --dry-run` เพื่อทำรายการ และใช้ `openclaw migrate codex` เพื่อเลือกไดเรกทอรี skill ด้วยพรอมป์ checkbox แบบโต้ตอบก่อนคัดลอกเข้า workspace เอเจนต์ OpenClaw ปัจจุบัน สำหรับการรันแบบไม่โต้ตอบ ให้ใช้ `--skill <name>` ซ้ำสำหรับ skill ที่ต้องการคัดลอกแบบระบุชื่อแน่นอน

## skill ต่อเอเจนต์เทียบกับ skill ที่ใช้ร่วมกัน

ในการตั้งค่าแบบ**หลายเอเจนต์** แต่ละเอเจนต์มี workspace ของตัวเอง:

| ขอบเขต                | เส้นทาง                                      | มองเห็นได้โดย                 |
| --------------------- | ------------------------------------------- | ----------------------------- |
| ต่อเอเจนต์            | `<workspace>/skills`                        | เฉพาะเอเจนต์นั้น              |
| เอเจนต์โปรเจกต์       | `<workspace>/.agents/skills`                | เฉพาะเอเจนต์ของ workspace นั้น |
| เอเจนต์ส่วนตัว        | `~/.agents/skills`                          | เอเจนต์ทั้งหมดบนเครื่องนั้น   |
| ที่จัดการ/ในเครื่องร่วมกัน | `~/.openclaw/skills`                        | เอเจนต์ทั้งหมดบนเครื่องนั้น   |
| extra dirs ที่ใช้ร่วมกัน | `skills.load.extraDirs` (ลำดับต่ำสุด)       | เอเจนต์ทั้งหมดบนเครื่องนั้น   |

ชื่อเดียวกันในหลายตำแหน่ง → แหล่งที่มาที่มีลำดับสูงสุดจะชนะ Workspace ชนะเอเจนต์โปรเจกต์ ชนะเอเจนต์ส่วนตัว ชนะที่จัดการ/ในเครื่อง ชนะที่รวมมาในตัว ชนะ extra dirs

## allowlist ของ skill สำหรับเอเจนต์

**ตำแหน่ง**ของ skill และ**การมองเห็น**ของ skill เป็นการควบคุมคนละส่วน ตำแหน่ง/ลำดับความสำคัญตัดสินว่าสำเนาใดของ skill ชื่อเดียวกันจะชนะ ส่วน allowlist ของเอเจนต์ตัดสินว่าเอเจนต์สามารถใช้ skill ใดได้จริง

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
    - ละ `agents.defaults.skills` เพื่อให้ใช้ skill ได้ไม่จำกัดตามค่าเริ่มต้น
    - ละ `agents.list[].skills` เพื่อสืบทอด `agents.defaults.skills`
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี skill
    - รายการ `agents.list[].skills` ที่ไม่ว่างคือชุด**สุดท้าย**สำหรับเอเจนต์นั้น - จะไม่ผสานกับค่าเริ่มต้น
    - allowlist ที่มีผลจะถูกใช้ครอบคลุมการสร้างพรอมป์ การค้นพบ slash-command ของ skill การซิงก์ sandbox และ snapshot ของ skill

  </Accordion>
</AccordionGroup>

## Plugins และ skill

Plugins สามารถจัดส่ง skill ของตัวเองได้โดยระบุไดเรกทอรี `skills` ใน `openclaw.plugin.json` (เส้นทางสัมพัทธ์จาก root ของ plugin) skill ของ plugin จะโหลดเมื่อเปิดใช้ plugin นี่เป็นตำแหน่งที่เหมาะสำหรับคู่มือการใช้งานเฉพาะเครื่องมือที่ยาวเกินกว่าจะใส่ในคำอธิบายเครื่องมือ แต่ควรพร้อมใช้งานเมื่อใดก็ตามที่ติดตั้ง plugin เช่น plugin เบราว์เซอร์จัดส่ง skill `browser-automation` สำหรับการควบคุมเบราว์เซอร์หลายขั้นตอน

ไดเรกทอรี skill ของ plugin จะถูกผสานเข้าในเส้นทางลำดับต่ำเดียวกับ `skills.load.extraDirs` ดังนั้น skill ที่ชื่อเดียวกันจากที่รวมมาในตัว ที่จัดการ เอเจนต์ หรือ workspace จะแทนที่ได้ คุณสามารถ gate skill เหล่านี้ผ่าน `metadata.openclaw.requires.config` ในรายการ config ของ plugin ได้

ดู [Plugins](/th/tools/plugin) สำหรับการค้นพบ/config และ [เครื่องมือ](/th/tools) สำหรับพื้นผิวเครื่องมือที่ skill เหล่านั้นสอน

## Skill Workshop

plugin **Skill Workshop** แบบเลือกใช้และยังอยู่ในขั้นทดลอง สามารถสร้างหรืออัปเดต skill ของ workspace จากขั้นตอนที่ใช้ซ้ำได้ซึ่งสังเกตพบระหว่างการทำงานของเอเจนต์ plugin นี้ถูกปิดไว้ตามค่าเริ่มต้นและต้องเปิดใช้อย่างชัดเจนผ่าน `plugins.entries.skill-workshop`

Skill Workshop เขียนเฉพาะไปยัง `<workspace>/skills` สแกนเนื้อหาที่สร้างขึ้น รองรับการรออนุมัติหรือการเขียนที่ปลอดภัยแบบอัตโนมัติ กักข้อเสนอที่ไม่ปลอดภัย และรีเฟรช snapshot ของ skill หลังจากเขียนสำเร็จเพื่อให้ skill ใหม่พร้อมใช้งานได้โดยไม่ต้องรีสตาร์ท Gateway

ใช้สำหรับการแก้ไข เช่น _"ครั้งหน้า ให้ตรวจสอบการระบุแหล่งที่มาของ GIF"_ หรือ workflow ที่ได้มาจากประสบการณ์จริง เช่น checklist QA สื่อ เริ่มด้วยการรออนุมัติ ใช้การเขียนอัตโนมัติเฉพาะใน workspace ที่เชื่อถือได้หลังจากตรวจทานข้อเสนอแล้ว คู่มือฉบับเต็ม: [plugin Skill Workshop](/th/plugins/skill-workshop)

## ClawHub (ติดตั้งและซิงก์)

[ClawHub](https://clawhub.ai) คือ registry skill สาธารณะสำหรับ OpenClaw ใช้คำสั่ง native `openclaw skills` สำหรับการค้นหา/ติดตั้ง/อัปเดต หรือใช้ CLI `clawhub` แยกต่างหากสำหรับ workflow การเผยแพร่/ซิงก์ คู่มือฉบับเต็ม: [ClawHub](/th/tools/clawhub)

| การดำเนินการ                         | คำสั่ง                                 |
| ------------------------------------- | -------------------------------------- |
| ติดตั้ง skill เข้า workspace          | `openclaw skills install <skill-slug>` |
| อัปเดต skill ที่ติดตั้งทั้งหมด        | `openclaw skills update --all`         |
| ซิงก์ (สแกน + เผยแพร่การอัปเดต)      | `clawhub sync --all`                   |

`openclaw skills install` แบบ native จะติดตั้งเข้าไดเรกทอรี `skills/` ของ workspace ที่ใช้งานอยู่ CLI `clawhub` แยกต่างหากก็ติดตั้งเข้า `./skills` ใต้ไดเรกทอรีทำงานปัจจุบันของคุณด้วย (หรือ fallback ไปยัง workspace ของ OpenClaw ที่กำหนดค่าไว้) OpenClaw จะรับสิ่งนั้นเป็น `<workspace>/skills` ในเซสชันถัดไป root ของ skill ที่กำหนดค่าไว้ยังรองรับการจัดกลุ่มหนึ่งระดับ เช่น `skills/<group>/<skill>/SKILL.md` เพื่อให้ skill ของบุคคลที่สามที่เกี่ยวข้องกันถูกเก็บไว้ใต้โฟลเดอร์ร่วมโดยไม่ต้องสแกนแบบ recursive กว้าง

หน้า skill ของ ClawHub แสดงสถานะการสแกนความปลอดภัยล่าสุดก่อนติดตั้ง พร้อมหน้ารายละเอียด scanner สำหรับ VirusTotal, ClawScan และการวิเคราะห์แบบ static `openclaw skills install <slug>` ยังคงเป็นเพียงเส้นทางการติดตั้งเท่านั้น ผู้เผยแพร่กู้คืน false positive ผ่านแดชบอร์ด ClawHub หรือ `clawhub skill rescan <slug>`

## ความปลอดภัย

<Warning>
ปฏิบัติต่อ skill ของบุคคลที่สามเสมือนเป็น**โค้ดที่ไม่น่าเชื่อถือ** อ่านก่อนเปิดใช้ แนะนำให้ใช้การรันแบบ sandbox สำหรับอินพุตที่ไม่น่าเชื่อถือและเครื่องมือที่มีความเสี่ยง ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการควบคุมฝั่งเอเจนต์
</Warning>

- การค้นพบ skill จาก workspace และ extra-dir ยอมรับเฉพาะ root ของ skill และไฟล์ `SKILL.md` ที่ realpath หลัง resolve ยังคงอยู่ภายใน root ที่กำหนดค่าไว้
- การติดตั้ง dependency ของ skill ที่รองรับโดย Gateway (`skills.install`, onboarding และ UI การตั้งค่า Skills) จะรัน scanner โค้ดอันตรายที่มีมาในตัวก่อนดำเนินการ metadata ของ installer รายการที่พบระดับ `critical` จะบล็อกตามค่าเริ่มต้น เว้นแต่ caller จะตั้งค่า dangerous override อย่างชัดเจน รายการที่น่าสงสัยยังคงเป็นเพียงคำเตือน
- `openclaw skills install <slug>` แตกต่างออกไป - คำสั่งนี้ดาวน์โหลดโฟลเดอร์ skill จาก ClawHub เข้า workspace และไม่ใช้เส้นทาง installer-metadata ข้างต้น
- `skills.entries.*.env` และ `skills.entries.*.apiKey` inject secret เข้า process ของ**โฮสต์**สำหรับ turn ของเอเจนต์นั้น (ไม่ใช่ sandbox) เก็บ secret ออกจากพรอมป์และ log

สำหรับ threat model และ checklist ที่กว้างขึ้น ดู [ความปลอดภัย](/th/gateway/security)

## รูปแบบ SKILL.md

`SKILL.md` ต้องมีอย่างน้อย:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw ทำตามสเปก AgentSkills สำหรับ layout/intent parser ที่เอเจนต์ฝังตัวใช้รองรับเฉพาะ key ของ frontmatter แบบ**บรรทัดเดียว**เท่านั้น `metadata` ควรเป็น**อ็อบเจ็กต์ JSON บรรทัดเดียว** ใช้ `{baseDir}` ในคำแนะนำเพื่ออ้างอิงเส้นทางโฟลเดอร์ skill

### key frontmatter แบบเลือกได้

<ParamField path="homepage" type="string">
  URL ที่แสดงเป็น "เว็บไซต์" ใน UI Skills ของ macOS รองรับผ่าน `metadata.openclaw.homepage` ด้วย
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  เมื่อเป็น `true` skill จะถูกแสดงเป็น slash command สำหรับผู้ใช้
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  เมื่อเป็น `true` OpenClaw จะไม่ใส่คำแนะนำของ skill ไว้ในพรอมป์ปกติของเอเจนต์ skill ยังคงถูกติดตั้งและยังคงรันอย่างชัดเจนเป็น slash command ได้เมื่อ `user-invocable` เป็น `true` ด้วย
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  เมื่อตั้งค่าเป็น `tool` slash command จะข้ามโมเดลและ dispatch ไปยังเครื่องมือโดยตรง
</ParamField>
<ParamField path="command-tool" type="string">
  ชื่อเครื่องมือที่จะเรียกใช้เมื่อตั้งค่า `command-dispatch: tool`
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  สำหรับการ dispatch เครื่องมือ ส่งต่อสตริง args ดิบไปยังเครื่องมือ (ไม่มีการ parse โดย core) เครื่องมือจะถูกเรียกด้วย `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
</ParamField>

## การ gate (filter ตอนโหลด)

OpenClaw กรอง skill ตอนโหลดโดยใช้ `metadata` (JSON บรรทัดเดียว):

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
  emoji แบบเลือกได้ที่ UI Skills ของ macOS ใช้
</ParamField>
<ParamField path="homepage" type="string">
  URL แบบเลือกได้ที่แสดงเป็น "เว็บไซต์" ใน UI Skills ของ macOS
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  รายการแพลตฟอร์มแบบเลือกได้ ถ้าตั้งค่าไว้ skill จะมีสิทธิ์ใช้งานเฉพาะบน OS เหล่านั้น
</ParamField>
<ParamField path="requires.bins" type="string[]">
  แต่ละรายการต้องมีอยู่บน `PATH`
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  ต้องมีอย่างน้อยหนึ่งรายการอยู่บน `PATH`
</ParamField>
<ParamField path="requires.env" type="string[]">
  env var ต้องมีอยู่หรือถูกระบุใน config
</ParamField>
<ParamField path="requires.config" type="string[]">
  รายการเส้นทาง `openclaw.json` ที่ต้องมีค่า truthy
</ParamField>
<ParamField path="primaryEnv" type="string">
  ชื่อ env var ที่เชื่อมโยงกับ `skills.entries.<name>.apiKey`
</ParamField>
<ParamField path="install" type="object[]">
  สเปก installer แบบเลือกได้ที่ UI Skills ของ macOS ใช้ (brew/node/go/uv/download)
</ParamField>

ถ้าไม่มี `metadata.openclaw` skill จะมีสิทธิ์ใช้งานเสมอ (เว้นแต่ถูกปิดใน config หรือถูกบล็อกโดย `skills.allowBundled` สำหรับ skill ที่รวมมาในตัว)

<Note>
บล็อก legacy `metadata.clawdbot` ยังได้รับการยอมรับเมื่อไม่มี `metadata.openclaw` ดังนั้น skill รุ่นเก่าที่ติดตั้งไว้จะยังคงเก็บ gate dependency และ hint ของ installer ไว้ skill ใหม่และ skill ที่อัปเดตควรใช้ `metadata.openclaw`
</Note>

### หมายเหตุเกี่ยวกับ sandboxing

- `requires.bins` ถูกตรวจบน**โฮสต์**ตอนโหลด skill
- ถ้าเอเจนต์อยู่ใน sandbox ไบนารีต้องมีอยู่**ภายในคอนเทนเนอร์**ด้วย ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` (หรือ image แบบกำหนดเอง) `setupCommand` รันหนึ่งครั้งหลังจากสร้างคอนเทนเนอร์แล้ว การติดตั้ง package ยังต้องมี network egress, root FS ที่เขียนได้ และผู้ใช้ root ใน sandbox
- ตัวอย่าง: skill `summarize` (`skills/summarize/SKILL.md`) ต้องมี CLI `summarize` ในคอนเทนเนอร์ sandbox เพื่อให้รันที่นั่นได้

### ข้อกำหนดของตัวติดตั้ง

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
    - หากมีตัวติดตั้งหลายรายการ Gateway จะเลือกตัวเลือกที่ต้องการเพียงรายการเดียว (`brew` เมื่อพร้อมใช้งาน มิฉะนั้นใช้ `node`)
    - หากตัวติดตั้งทั้งหมดเป็น `download` OpenClaw จะแสดงแต่ละรายการเพื่อให้คุณเห็นอาร์ทิแฟกต์ที่พร้อมใช้งาน
    - ข้อกำหนดของตัวติดตั้งสามารถมี `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตัวเลือกตามแพลตฟอร์มได้
    - การติดตั้ง Node จะเคารพ `skills.install.nodeManager` ใน `openclaw.json` (ค่าเริ่มต้น: npm; ตัวเลือก: npm/pnpm/yarn/bun) ค่านี้มีผลเฉพาะกับการติดตั้ง skill เท่านั้น; รันไทม์ของ Gateway ควรยังคงเป็น Node - ไม่แนะนำให้ใช้ Bun สำหรับ WhatsApp/Telegram
    - การเลือกตัวติดตั้งที่รองรับโดย Gateway ขับเคลื่อนด้วยค่ากำหนด: เมื่อข้อกำหนดการติดตั้งมีชนิดผสมกัน OpenClaw จะเลือก Homebrew ก่อนเมื่อเปิดใช้ `skills.install.preferBrew` และมี `brew` จากนั้นเลือก `uv` จากนั้นเลือกตัวจัดการ node ที่กำหนดค่าไว้ แล้วจึงเลือกตัวเลือกสำรองอื่น เช่น `go` หรือ `download`
    - หากข้อกำหนดการติดตั้งทุกรายการเป็น `download` OpenClaw จะแสดงตัวเลือกดาวน์โหลดทั้งหมดแทนการยุบเหลือเพียงตัวติดตั้งที่ต้องการรายการเดียว

  </Accordion>
  <Accordion title="รายละเอียดรายตัวติดตั้ง">
    - **การติดตั้ง Go:** หากไม่มี `go` และมี `brew` พร้อมใช้งาน Gateway จะติดตั้ง Go ผ่าน Homebrew ก่อน และตั้งค่า `GOBIN` เป็น `bin` ของ Homebrew เมื่อทำได้
    - **การติดตั้งแบบดาวน์โหลด:** `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (ค่าเริ่มต้น: อัตโนมัติเมื่อตรวจพบไฟล์ archive), `stripComponents`, `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)

  </Accordion>
</AccordionGroup>

## การแทนที่ค่า Config

skill ที่มาพร้อมชุดติดตั้งและที่จัดการอยู่สามารถเปิดหรือปิด และระบุค่า env ได้
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
  `false` จะปิดใช้งาน skill แม้ว่าจะมาพร้อมชุดติดตั้งหรือติดตั้งไว้แล้วก็ตาม
  skill `coding-agent` ที่มาพร้อมชุดติดตั้งเป็นแบบเลือกใช้: ตั้งค่า
  `skills.entries.coding-agent.enabled: true` ก่อนเปิดให้ agent ใช้งาน
  จากนั้นตรวจสอบให้แน่ใจว่าได้ติดตั้งและยืนยันตัวตน `claude`, `codex`, `opencode` หรือ `pi`
  ตัวใดตัวหนึ่งสำหรับ CLI ของตัวเองแล้ว
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  ความสะดวกสำหรับ skill ที่ประกาศ `metadata.openclaw.primaryEnv` รองรับข้อความธรรมดาหรือ SecretRef
</ParamField>
<ParamField path="env" type="Record<string, string>">
  ฉีดค่าเฉพาะเมื่อตัวแปรยังไม่ได้ถูกตั้งค่าไว้ในโปรเซส
</ParamField>
<ParamField path="config" type="object">
  ถุงข้อมูลเสริมสำหรับฟิลด์ที่กำหนดเองราย skill คีย์ที่กำหนดเองต้องอยู่ที่นี่
</ParamField>
<ParamField path="allowBundled" type="string[]">
  allowlist เสริมสำหรับ skill ที่ **มาพร้อมชุดติดตั้ง** เท่านั้น หากตั้งค่าไว้ เฉพาะ skill ที่มาพร้อมชุดติดตั้งในรายการเท่านั้นที่จะมีสิทธิ์ใช้งาน (skill ที่จัดการอยู่/ใน workspace จะไม่ได้รับผลกระทบ)
</ParamField>

หากชื่อ skill มีเครื่องหมายยัติภังค์ ให้ใส่ key ในเครื่องหมายอัญประกาศ (JSON5 อนุญาตให้ใช้
key ที่มีเครื่องหมายอัญประกาศได้) โดยค่าเริ่มต้น key ของ Config จะตรงกับ **ชื่อ skill** - หาก skill
กำหนด `metadata.openclaw.skillKey` ให้ใช้ key นั้นภายใต้ `skills.entries`

<Note>
สำหรับการสร้าง/แก้ไขภาพสต็อกภายใน OpenClaw ให้ใช้เครื่องมือหลัก
`image_generate` พร้อม `agents.defaults.imageGenerationModel` แทน
skill ที่มาพร้อมชุดติดตั้ง ตัวอย่าง skill ที่นี่มีไว้สำหรับ workflow แบบกำหนดเองหรือของบุคคลที่สาม
สำหรับการวิเคราะห์ภาพแบบเนทีฟ ให้ใช้เครื่องมือ `image` พร้อม
`agents.defaults.imageModel` หากคุณเลือก `openai/*`, `google/*`,
`fal/*` หรือโมเดลภาพเฉพาะ provider อื่น ให้เพิ่ม auth/API key ของ provider นั้นด้วย
</Note>

## การฉีด Environment

เมื่อการรัน agent เริ่มต้น OpenClaw จะ:

1. อ่าน metadata ของ skill
2. ใช้ `skills.entries.<key>.env` และ `skills.entries.<key>.apiKey` กับ `process.env`
3. สร้าง system prompt พร้อม skill ที่ **มีสิทธิ์ใช้งาน**
4. กู้คืน environment เดิมหลังจากการรันสิ้นสุด

การฉีด Environment **ถูกจำกัดขอบเขตไว้ที่การรัน agent** ไม่ใช่ environment ของ shell
แบบ global

สำหรับ backend `claude-cli` ที่มาพร้อมชุดติดตั้ง OpenClaw ยังสร้าง snapshot ที่มีสิทธิ์ใช้งานชุดเดียวกัน
เป็น Plugin Claude Code ชั่วคราว และส่งผ่านด้วย
`--plugin-dir` จากนั้น Claude Code สามารถใช้ตัวแก้ skill แบบเนทีฟของตัวเองได้ ในขณะที่
OpenClaw ยังคงเป็นเจ้าของลำดับความสำคัญ, allowlist ราย agent, gating และ
การฉีด env/API key ของ `skills.entries.*` backend CLI อื่นใช้เฉพาะ
catalog ของ prompt เท่านั้น

## Snapshot และการรีเฟรช

OpenClaw จะ snapshot skill ที่มีสิทธิ์ใช้งาน **เมื่อ session เริ่มต้น**
และนำรายการนั้นกลับมาใช้สำหรับ turn ถัดไปใน session เดียวกัน การเปลี่ยนแปลง
skill หรือ config จะมีผลใน session ใหม่ครั้งถัดไป

Skills สามารถรีเฟรชกลาง session ได้ในสองกรณี:

- เปิดใช้งานตัวเฝ้าดู Skills
- มี remote node ใหม่ที่มีสิทธิ์ใช้งานปรากฏขึ้น

ให้คิดว่าสิ่งนี้เป็น **hot reload**: รายการที่รีเฟรชจะถูกนำไปใช้ใน
turn ถัดไปของ agent หาก allowlist ของ skill สำหรับ agent ที่มีผลเปลี่ยนไปใน
session นั้น OpenClaw จะรีเฟรช snapshot เพื่อให้ skill ที่มองเห็นได้สอดคล้อง
กับ agent ปัจจุบัน

### ตัวเฝ้าดู Skills

โดยค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ skill และเพิ่มเวอร์ชัน snapshot ของ skills
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

### node macOS ระยะไกล (Linux gateway)

หาก Gateway ทำงานบน Linux แต่มี **node macOS** เชื่อมต่ออยู่โดยอนุญาต
`system.run` (ความปลอดภัย Exec approvals ไม่ได้ตั้งเป็น `deny`)
OpenClaw สามารถถือว่า skill เฉพาะ macOS มีสิทธิ์ใช้งานได้เมื่อมี
binary ที่จำเป็นอยู่บน node นั้น agent ควรเรียกใช้ skill เหล่านั้น
ผ่านเครื่องมือ `exec` พร้อม `host=node`

สิ่งนี้อาศัยการที่ node รายงานการรองรับคำสั่งของตัวเอง และการ probe bin
ผ่าน `system.which` หรือ `system.run` node ที่ offline จะ **ไม่** ทำให้
skill ที่ใช้ได้เฉพาะระยะไกลมองเห็นได้ หาก node ที่เชื่อมต่ออยู่หยุดตอบการ probe bin
OpenClaw จะล้างรายการ bin match ที่ cache ไว้ เพื่อให้ agent ไม่เห็น
skill ที่ไม่สามารถรันที่นั่นได้ในขณะนี้อีกต่อไป

## ผลกระทบต่อ token

เมื่อ skill มีสิทธิ์ใช้งาน OpenClaw จะฉีดรายการ XML ขนาดกะทัดรัดของ skill ที่พร้อมใช้งาน
เข้าไปใน system prompt (ผ่าน `formatSkillsForPrompt` ใน
`pi-coding-agent`) ค่าใช้จ่ายเป็นแบบกำหนดแน่นอน:

- **overhead พื้นฐาน** (เฉพาะเมื่อมี skill ≥1 รายการ): 195 อักขระ
- **ต่อ skill:** 97 อักขระ + ความยาวของค่า `<name>`, `<description>` และ `<location>` ที่ escape แบบ XML แล้ว

สูตร (อักขระ):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

การ escape XML จะขยาย `& < > " '` เป็น entity (`&amp;`, `&lt;` ฯลฯ)
ทำให้ความยาวเพิ่มขึ้น จำนวน token แตกต่างกันตาม tokenizer ของโมเดล โดยประมาณแบบ
OpenAI คือ ~4 อักขระ/token ดังนั้น **97 อักขระ ≈ 24 token** ต่อ
skill บวกกับความยาวฟิลด์จริงของคุณ

## วงจรชีวิตของ skill ที่จัดการอยู่

OpenClaw มาพร้อมชุด skill พื้นฐานเป็น **skill ที่มาพร้อมชุดติดตั้ง** พร้อมกับ
การติดตั้ง (แพ็กเกจ npm หรือ OpenClaw.app) `~/.openclaw/skills` มีไว้สำหรับ
การแทนที่ในเครื่อง - ตัวอย่างเช่น การ pin หรือ patch skill โดยไม่
เปลี่ยนสำเนาที่มาพร้อมชุดติดตั้ง skill ใน workspace เป็นของผู้ใช้และจะแทนที่
ทั้งสองแบบเมื่อชื่อซ้ำกัน

## กำลังมองหา skill เพิ่มเติม?

เรียกดู [https://clawhub.ai](https://clawhub.ai) schema การกำหนดค่าแบบเต็ม:
[Config ของ Skills](/th/tools/skills-config)

## ที่เกี่ยวข้อง

- [ClawHub](/th/tools/clawhub) - registry สาธารณะของ skills
- [การสร้าง skills](/th/tools/creating-skills) - การสร้าง skill แบบกำหนดเอง
- [Plugins](/th/tools/plugin) - ภาพรวมระบบ Plugin
- [Plugin Skill Workshop](/th/plugins/skill-workshop) - สร้าง skill จากงานของ agent
- [Config ของ Skills](/th/tools/skills-config) - เอกสารอ้างอิงการกำหนดค่า skill
- [คำสั่ง slash](/th/tools/slash-commands) - คำสั่ง slash ทั้งหมดที่พร้อมใช้งาน
