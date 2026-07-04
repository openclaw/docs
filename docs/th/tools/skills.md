---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนแปลงเงื่อนไขการเปิดใช้ Skills, รายการอนุญาต หรือกฎการโหลด
    - ทำความเข้าใจลำดับความสำคัญของ Skills และพฤติกรรมของสแนปชอต
sidebarTitle: Skills
summary: Skills สอน agent ของคุณให้ใช้เครื่องมือ เรียนรู้วิธีโหลด วิธีการทำงานของลำดับความสำคัญ และวิธีกำหนดค่า gating, allowlists และการฉีดสภาพแวดล้อม
title: Skills
x-i18n:
    generated_at: "2026-07-04T15:44:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills คือไฟล์คำสั่งแบบ markdown ที่สอนตัวแทนว่าควรใช้เครื่องมืออย่างไรและเมื่อใด แต่ละทักษะอยู่ในไดเรกทอรีที่มีไฟล์ `SKILL.md` พร้อม YAML frontmatter และเนื้อหา markdown OpenClaw โหลด Skills ที่มาพร้อมระบบรวมถึงการ override ในเครื่อง แล้วกรองในเวลาโหลดตามสภาพแวดล้อม การกำหนดค่า และการมีอยู่ของไบนารี

<CardGroup cols={2}>
  <Card title="Creating skills" href="/th/tools/creating-skills" icon="hammer">
    สร้างและทดสอบทักษะกำหนดเองตั้งแต่ต้น
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    ตรวจทานและอนุมัติข้อเสนอทักษะที่ตัวแทนร่างไว้
  </Card>
  <Card title="Skills config" href="/th/tools/skills-config" icon="gear">
    สคีมาการกำหนดค่า `skills.*` แบบเต็มและรายการอนุญาตของตัวแทน
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    เรียกดูและติดตั้ง Skills จากชุมชน
  </Card>
</CardGroup>

## ลำดับการโหลด

OpenClaw โหลดจากแหล่งเหล่านี้ โดยเรียงจาก **ลำดับความสำคัญสูงสุดก่อน** เมื่อชื่อทักษะเดียวกันปรากฏในหลายตำแหน่ง แหล่งที่มีลำดับความสำคัญสูงสุดจะชนะ

| ลำดับความสำคัญ | แหล่งที่มา                 | พาธ                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — สูงสุด | Skills ของเวิร์กสเปซ       | `<workspace>/skills`                    |
| 2           | Skills ของตัวแทนโปรเจกต์   | `<workspace>/.agents/skills`            |
| 3           | Skills ของตัวแทนส่วนตัว  | `~/.agents/skills`                      |
| 4           | Skills ที่จัดการ / ในเครื่อง | `~/.openclaw/skills`                    |
| 5           | Skills ที่มาพร้อมระบบ         | มาพร้อมกับการติดตั้ง                |
| 6 — ต่ำสุด  | ไดเรกทอรีเพิ่มเติม      | `skills.load.extraDirs` + Skills ของ Plugin |

รากของทักษะรองรับเลย์เอาต์แบบจัดกลุ่ม OpenClaw จะค้นพบทักษะเมื่อพบ `SKILL.md` ที่ใดก็ตามใต้รากที่กำหนดค่าไว้:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

พาธโฟลเดอร์มีไว้เพื่อจัดระเบียบเท่านั้น ชื่อทักษะ คำสั่ง slash และคีย์รายการอนุญาตทั้งหมดมาจากฟิลด์ frontmatter `name` (หรือชื่อไดเรกทอรีเมื่อไม่มี `name`)

<Note>
  ไดเรกทอรี `$CODEX_HOME/skills` แบบ native ของ Codex CLI **ไม่ใช่** รากทักษะของ OpenClaw ใช้ `openclaw migrate plan codex` เพื่อทำรายการ Skills เหล่านั้น จากนั้นใช้ `openclaw migrate codex` เพื่อคัดลอกเข้าสู่เวิร์กสเปซ OpenClaw ของคุณ
</Note>

## Skills ต่อหนึ่งตัวแทนเทียบกับ Skills ที่ใช้ร่วมกัน

ในการตั้งค่าแบบหลายตัวแทน ตัวแทนแต่ละตัวมีเวิร์กสเปซของตัวเอง ใช้พาธที่ตรงกับการมองเห็นที่คุณต้องการ:

| ขอบเขต          | พาธ                         | มองเห็นได้โดย                  |
| -------------- | ---------------------------- | --------------------------- |
| ต่อหนึ่งตัวแทน      | `<workspace>/skills`         | เฉพาะตัวแทนนั้น             |
| ตัวแทนโปรเจกต์  | `<workspace>/.agents/skills` | เฉพาะตัวแทนของเวิร์กสเปซนั้น |
| ตัวแทนส่วนตัว | `~/.agents/skills`           | ตัวแทนทั้งหมดบนเครื่องนี้  |
| ที่จัดการร่วมกัน | `~/.openclaw/skills`         | ตัวแทนทั้งหมดบนเครื่องนี้  |
| ไดเรกทอรีเพิ่มเติม     | `skills.load.extraDirs`      | ตัวแทนทั้งหมดบนเครื่องนี้  |

## รายการอนุญาตของตัวแทน

**ตำแหน่ง** ของทักษะ (ลำดับความสำคัญ) และ **การมองเห็น** ของทักษะ (ตัวแทนใดใช้ได้) เป็นการควบคุมคนละส่วน ใช้รายการอนุญาตเพื่อจำกัดว่าตัวแทนจะเห็น Skills ใด โดยไม่ขึ้นกับว่าถูกโหลดมาจากที่ใด

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
    - ละเว้น `agents.defaults.skills` เพื่อปล่อยให้ Skills ทั้งหมดไม่ถูกจำกัดโดยค่าเริ่มต้น
    - ละเว้น `agents.list[].skills` เพื่อสืบทอด `agents.defaults.skills`
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่เปิดเผย Skills ใดให้ตัวแทนนั้น
    - รายการ `agents.list[].skills` ที่ไม่ว่างคือชุด **สุดท้าย** — จะไม่รวมกับค่าเริ่มต้น
    - รายการอนุญาตที่มีผลบังคับใช้ครอบคลุมการสร้างพรอมป์ การค้นพบคำสั่ง slash การซิงก์ sandbox และสแนปชอตทักษะ
    - นี่ไม่ใช่ขอบเขตการอนุญาตของเชลล์โฮสต์ หากตัวแทนเดียวกันใช้ `exec` ได้ ให้จำกัดเชลล์นั้นแยกต่างหากด้วย sandboxing, การแยกผู้ใช้ OS, รายการปฏิเสธ/อนุญาตของ exec และข้อมูลรับรองต่อทรัพยากร

  </Accordion>
</AccordionGroup>

## Plugin และ Skills

Plugin สามารถมาพร้อม Skills ของตัวเองได้โดยระบุไดเรกทอรี `skills` ใน `openclaw.plugin.json` (พาธสัมพันธ์กับรากของ Plugin) Skills ของ Plugin จะโหลดเมื่อเปิดใช้งาน Plugin — ตัวอย่างเช่น Plugin เบราว์เซอร์มาพร้อมทักษะ `browser-automation` สำหรับการควบคุมเบราว์เซอร์หลายขั้นตอน

ไดเรกทอรีทักษะของ Plugin จะถูกรวมในระดับลำดับความสำคัญต่ำเดียวกับ `skills.load.extraDirs` ดังนั้นทักษะที่ชื่อเดียวกันจาก bundled, managed, agent หรือ workspace จะ override ทักษะเหล่านั้น ควบคุมผ่าน `metadata.openclaw.requires.config` ในรายการกำหนดค่าของ Plugin

ดู [Plugins](/th/tools/plugin) และ [Tools](/th/tools) สำหรับระบบ Plugin แบบเต็ม

## Skill Workshop

[Skill Workshop](/th/tools/skill-workshop) คือคิวข้อเสนอระหว่างตัวแทนกับไฟล์ทักษะที่ใช้งานอยู่ของคุณ เมื่อตัวแทนพบงานที่นำกลับมาใช้ซ้ำได้ ตัวแทนจะร่างข้อเสนอแทนการเขียนลง `SKILL.md` โดยตรง คุณตรวจทานและอนุมัติก่อนมีการเปลี่ยนแปลงใด ๆ

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

ดู [Skill Workshop](/th/tools/skill-workshop) สำหรับวงจรชีวิตแบบเต็ม เอกสารอ้างอิง CLI และการกำหนดค่า

## การติดตั้งจาก ClawHub

[ClawHub](https://clawhub.ai) คือรีจิสทรี Skills สาธารณะ ใช้คำสั่ง `openclaw skills` สำหรับการติดตั้งและอัปเดต หรือใช้ CLI `clawhub` สำหรับการเผยแพร่และซิงก์

| การดำเนินการ                             | คำสั่ง                                                |
| ---------------------------------- | ------------------------------------------------------ |
| ติดตั้งทักษะลงในเวิร์กสเปซ | `openclaw skills install @owner/<slug>`                |
| ติดตั้งจากรีโพซิทอรี Git      | `openclaw skills install git:owner/repo@ref`           |
| ติดตั้งไดเรกทอรีทักษะในเครื่อง    | `openclaw skills install ./path/to/skill --as my-tool` |
| ติดตั้งสำหรับตัวแทนในเครื่องทั้งหมด       | `openclaw skills install @owner/<slug> --global`       |
| อัปเดต Skills ทั้งหมดในเวิร์กสเปซ        | `openclaw skills update --all`                         |
| อัปเดตทักษะที่จัดการร่วมกัน      | `openclaw skills update @owner/<slug> --global`        |
| อัปเดต Skills ที่จัดการร่วมกันทั้งหมด   | `openclaw skills update --all --global`                |
| ตรวจสอบ trust envelope ของทักษะ    | `openclaw skills verify @owner/<slug>`                 |
| พิมพ์ Skill Card ที่สร้างขึ้น     | `openclaw skills verify @owner/<slug> --card`          |
| เผยแพร่ / ซิงก์ผ่าน ClawHub CLI     | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    โดยค่าเริ่มต้น `openclaw skills install` จะติดตั้งลงในไดเรกทอรี `skills/` ของเวิร์กสเปซที่ใช้งานอยู่ เพิ่ม `--global` เพื่อติดตั้งลงในไดเรกทอรี `~/.openclaw/skills` ที่ใช้ร่วมกัน ซึ่งตัวแทนในเครื่องทั้งหมดมองเห็นได้ เว้นแต่รายการอนุญาตของตัวแทนจะจำกัดให้แคบลง

    การติดตั้งจาก Git และในเครื่องคาดว่าจะมี `SKILL.md` ที่รากของแหล่งที่มา slug มาจาก frontmatter `name` ของ `SKILL.md` เมื่อถูกต้อง จากนั้นจึง fallback ไปยังชื่อไดเรกทอรีหรือรีโพซิทอรี ใช้ `--as <slug>` เพื่อ override `openclaw skills update` ติดตามเฉพาะการติดตั้งจาก ClawHub — ให้ติดตั้งแหล่ง Git หรือในเครื่องใหม่เพื่อรีเฟรช

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` ขอ trust envelope `clawhub.skill.verify.v1` ของทักษะจาก ClawHub Skills จาก ClawHub ที่ติดตั้งแล้วจะตรวจสอบกับเวอร์ชันและรีจิสทรีที่บันทึกไว้ใน `.clawhub/origin.json` slug แบบไม่มี owner ยังรองรับสำหรับ Skills ที่ติดตั้งอยู่เดิมหรือไม่กำกวม แต่ ref ที่ระบุ owner ช่วยหลีกเลี่ยงความกำกวมของผู้เผยแพร่

    หน้า Skills ของ ClawHub แสดงสถานะการสแกนความปลอดภัยล่าสุดก่อนติดตั้ง พร้อมหน้ารายละเอียดสำหรับ VirusTotal, ClawScan และการวิเคราะห์แบบสถิต คำสั่งจะออกด้วยสถานะไม่เป็นศูนย์เมื่อ ClawHub ทำเครื่องหมายว่าการตรวจสอบล้มเหลว ผู้เผยแพร่สามารถกู้คืน false positive ผ่านแดชบอร์ด ClawHub หรือ `clawhub skill rescan @owner/<slug>`

  </Accordion>
  <Accordion title="Private archive installs">
    ไคลเอนต์ Gateway ที่ต้องการส่งมอบแบบไม่ผ่าน ClawHub สามารถจัดเตรียมไฟล์ zip archive ของทักษะด้วย `skills.upload.begin`, `skills.upload.chunk` และ `skills.upload.commit` แล้วติดตั้งด้วย `skills.install({ source: "upload", ... })` เส้นทางนี้ปิดอยู่โดยค่าเริ่มต้นและต้องตั้งค่า `skills.install.allowUploadedArchives: true` ใน `openclaw.json` การติดตั้งจาก ClawHub ตามปกติไม่จำเป็นต้องใช้การตั้งค่านั้น
  </Accordion>
</AccordionGroup>

## ความปลอดภัย

<Warning>
  ปฏิบัติต่อ Skills จากบุคคลที่สามเป็น **โค้ดที่ไม่น่าเชื่อถือ** อ่านก่อนเปิดใช้งาน แนะนำให้รันใน sandbox สำหรับอินพุตที่ไม่น่าเชื่อถือและเครื่องมือที่มีความเสี่ยง ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการควบคุมฝั่งตัวแทน
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    การค้นพบทักษะของ workspace, project-agent และ extra-dir ยอมรับเฉพาะรากทักษะที่ realpath ที่ resolve แล้วอยู่ภายในรากที่กำหนดค่าไว้ เว้นแต่ `skills.load.allowSymlinkTargets` จะเชื่อถือรากเป้าหมายอย่างชัดเจน Skill Workshop เขียนผ่านเป้าหมายที่เชื่อถือเหล่านั้นเฉพาะเมื่อเปิดใช้ `skills.workshop.allowSymlinkTargetWrites`
    `~/.openclaw/skills` แบบ managed และ `~/.agents/skills` แบบ personal อาจมีโฟลเดอร์ทักษะที่เป็น symlink ได้ แต่ realpath ของ `SKILL.md` ทุกไฟล์ยังต้องอยู่ภายในไดเรกทอรีทักษะที่ resolve แล้วของตน
  </Accordion>
  <Accordion title="Operator install policy">
    กำหนดค่า `security.installPolicy` เพื่อรันคำสั่งนโยบายในเครื่องที่เชื่อถือได้ก่อนให้การติดตั้งทักษะดำเนินต่อ นโยบายจะได้รับ metadata และพาธแหล่งที่มาที่ staging แล้ว ใช้กับเส้นทาง ClawHub, uploaded, Git, local, update และ dependency-installer และจะ fail closed เมื่อคำสั่งไม่สามารถคืนการตัดสินใจที่ถูกต้องได้
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` และ `skills.entries.*.apiKey` inject secret เข้าไปในกระบวนการ **host** สำหรับรอบของตัวแทนนั้นเท่านั้น — ไม่ได้ inject เข้า sandbox เก็บ secret ให้อยู่นอกพรอมป์และล็อก
  </Accordion>
</AccordionGroup>

สำหรับ threat model และเช็กลิสต์ความปลอดภัยที่กว้างขึ้น ดู [Security](/th/gateway/security)

## รูปแบบ SKILL.md

ทุกทักษะต้องมี `name` และ `description` ใน frontmatter เป็นอย่างน้อย:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw ทำตามสเปก [AgentSkills](https://agentskills.io) parser ของ frontmatter รองรับ **คีย์แบบบรรทัดเดียวเท่านั้น** — `metadata` ต้องเป็นออบเจ็กต์ JSON แบบบรรทัดเดียว ใช้ `{baseDir}` ในเนื้อหาเพื่ออ้างอิงพาธโฟลเดอร์ของทักษะ
</Note>

### คีย์ frontmatter ที่ไม่บังคับ

<ParamField path="homepage" type="string">
  URL ที่แสดงเป็น "Website" ใน UI Skills ของ macOS รองรับผ่าน `metadata.openclaw.homepage` ด้วย
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  เมื่อเป็น `true` ทักษะจะถูกเปิดเผยเป็นคำสั่ง slash ที่ผู้ใช้เรียกใช้ได้
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  เมื่อเป็น `true` OpenClaw จะไม่ใส่คำสั่งของทักษะไว้ในพรอมป์ปกติของตัวแทน ทักษะยังพร้อมใช้งานเป็นคำสั่ง slash เมื่อ `user-invocable` เป็น `true` ด้วย
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  เมื่อตั้งค่าเป็น `tool` คำสั่ง slash จะข้ามโมเดลและ dispatch ไปยังเครื่องมือที่ลงทะเบียนไว้โดยตรง
</ParamField>

<ParamField path="command-tool" type="string">
  ชื่อเครื่องมือที่จะเรียกใช้เมื่อมีการตั้งค่า `command-dispatch: tool`
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  สำหรับการส่งต่อเครื่องมือ ให้ส่งสตริงอาร์กิวเมนต์ดิบไปยังเครื่องมือโดยไม่มี
  การแยกวิเคราะห์จากแกนหลัก เครื่องมือจะได้รับ
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## การคัดกรอง

OpenClaw กรอง Skills ขณะโหลดโดยใช้ `metadata.openclaw` (JSON บรรทัดเดียว
ใน frontmatter) Skills ที่ไม่มีบล็อก `metadata.openclaw` จะมีสิทธิ์เสมอ
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
  เมื่อเป็น `true` ให้รวม Skills นี้เสมอและข้ามเกตอื่นทั้งหมด
</ParamField>

<ParamField path="emoji" type="string">
  อีโมจิเสริมที่แสดงใน UI Skills ของ macOS
</ParamField>

<ParamField path="homepage" type="string">
  URL เสริมที่แสดงเป็น "Website" ใน UI Skills ของ macOS
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  ตัวกรองแพลตฟอร์ม เมื่อตั้งค่าไว้ Skills นี้จะมีสิทธิ์เฉพาะบน OS ที่ระบุเท่านั้น
</ParamField>

<ParamField path="requires.bins" type="string[]">
  ไบนารีแต่ละตัวต้องมีอยู่บน `PATH`
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  ต้องมีไบนารีอย่างน้อยหนึ่งตัวอยู่บน `PATH`
</ParamField>

<ParamField path="requires.env" type="string[]">
  ตัวแปรสภาพแวดล้อมแต่ละตัวต้องมีอยู่ในโปรเซสหรือถูกระบุผ่าน config
</ParamField>

<ParamField path="requires.config" type="string[]">
  path ของ `openclaw.json` แต่ละรายการต้องมีค่าเป็น truthy
</ParamField>

<ParamField path="primaryEnv" type="string">
  ชื่อตัวแปรสภาพแวดล้อมที่เชื่อมโยงกับ `skills.entries.<name>.apiKey`
</ParamField>

<ParamField path="install" type="object[]">
  สเปกตัวติดตั้งเสริมที่ UI Skills ของ macOS ใช้ (brew / node / go / uv / download)
</ParamField>

<Note>
  บล็อก `metadata.clawdbot` แบบเดิมยังคงยอมรับเมื่อไม่มี
  `metadata.openclaw` ดังนั้น Skills รุ่นเก่าที่ติดตั้งไว้จะยังคงเกต
  dependency และคำใบ้ตัวติดตั้งของตนไว้ Skills ใหม่ควรใช้
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
  <Accordion title="Installer selection rules">
    - เมื่อมีตัวติดตั้งหลายรายการ Gateway จะเลือกตัวเลือกที่ต้องการหนึ่งรายการ
      (brew เมื่อพร้อมใช้งาน มิฉะนั้นใช้ node)
    - หากตัวติดตั้งทั้งหมดเป็น `download` OpenClaw จะแสดงแต่ละรายการเพื่อให้คุณ
      เห็น artifacts ที่มีทั้งหมด
    - สเปกสามารถมี `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตามแพลตฟอร์มได้
    - การติดตั้ง Node จะเคารพ `skills.install.nodeManager` ใน `openclaw.json`
      (ค่าเริ่มต้น: npm; ตัวเลือก: npm / pnpm / yarn / bun) สิ่งนี้มีผลเฉพาะกับการติดตั้ง Skills
      เท่านั้น; runtime ของ Gateway ยังควรเป็น Node
    - ลำดับความต้องการของตัวติดตั้ง Gateway: Homebrew → uv → node manager ที่กำหนดค่าไว้ →
      go → download
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw ไม่ติดตั้ง Homebrew อัตโนมัติหรือแปลงสูตร brew
      เป็นคำสั่งแพ็กเกจของระบบ ในคอนเทนเนอร์ Linux ที่ไม่มี
      `brew` ตัวติดตั้งแบบ brew-only จะถูกซ่อน; ใช้อิมเมจแบบกำหนดเองหรือติดตั้ง
      dependency ด้วยตนเอง
    - **Go:** OpenClaw ต้องใช้ Go 1.21 หรือใหม่กว่าสำหรับการติดตั้ง Skills อัตโนมัติและ
      จะรักษาการตั้งค่า `GOBIN`, `GOPATH` และ `GOTOOLCHAIN` ที่มีอยู่ไว้ หาก
      toolchain ที่กำหนดค่าไว้ไม่สามารถตอบสนองเวอร์ชัน Go ที่โมดูลต้องการได้
      onboarding จะจัด Skills ไว้กับข้อกำหนดเบื้องต้นของ Go แบบทำเองหลังความพยายามติดตั้ง
      หากไม่มี `go` และ Homebrew พร้อมใช้งาน OpenClaw จะติดตั้ง
      Go ผ่าน Homebrew ก่อนและตั้งค่า `GOBIN` เป็น `bin` ของ Homebrew บน Linux
      OpenClaw สามารถใช้ `apt-get` แทนในฐานะ root หรือผ่าน `sudo` แบบไม่ต้องใช้รหัสผ่าน
      เมื่อ candidate `golang-go` ที่รีเฟรชแล้วตรงตามเวอร์ชันขั้นต่ำ
    - **Download:** `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (ค่าเริ่มต้น: auto เมื่อตรวจพบ archive), `stripComponents`,
      `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` จะถูกตรวจบน **host** ในเวลาที่โหลด Skills หาก agent
    ทำงานใน sandbox ไบนารีนั้นต้องมีอยู่ **ภายในคอนเทนเนอร์** ด้วย
    ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` หรืออิมเมจ
    แบบกำหนดเอง `setupCommand` จะทำงานหนึ่งครั้งหลังจากสร้างคอนเทนเนอร์และต้องใช้
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
  `false` จะปิดใช้งาน Skills แม้จะ bundled หรือติดตั้งไว้แล้ว Skills แบบ bundled
  `coding-agent` เป็นแบบ opt-in — ตั้งค่า `skills.entries.coding-agent.enabled: true`
  และตรวจให้แน่ใจว่าได้ติดตั้งและยืนยันตัวตน CLI ที่รองรับอย่างใดอย่างหนึ่ง เช่น
  `claude`, `codex`, `opencode` หรือ CLI อื่นแล้ว
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  ฟิลด์อำนวยความสะดวกสำหรับ Skills ที่ประกาศ `metadata.openclaw.primaryEnv`
  รองรับสตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef
</ParamField>

<ParamField path="env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมที่ฉีดเข้าไปสำหรับการรัน agent จะฉีดเฉพาะเมื่อ
  ตัวแปรยังไม่ได้ตั้งค่าไว้ในโปรเซส
</ParamField>

<ParamField path="config" type="object">
  bag เสริมสำหรับฟิลด์การกำหนดค่าเฉพาะ Skills แบบกำหนดเอง
</ParamField>

<ParamField path="allowBundled" type="string[]">
  allowlist เสริมสำหรับ Skills แบบ **bundled** เท่านั้น เมื่อตั้งค่าแล้ว เฉพาะ Skills แบบ bundled
  ที่อยู่ในรายการเท่านั้นที่จะมีสิทธิ์ Skills แบบ managed และ workspace จะไม่ได้รับผลกระทบ
</ParamField>

<Note>
  คีย์ config จะตรงกับ **ชื่อ Skills** โดยค่าเริ่มต้น หาก Skills กำหนด
  `metadata.openclaw.skillKey` ให้ใช้คีย์นั้นภายใต้ `skills.entries` ใส่เครื่องหมายคำพูดให้
  ชื่อที่มีขีดกลาง: JSON5 อนุญาตให้ใช้คีย์ที่อยู่ในเครื่องหมายคำพูด
</Note>

## การฉีดสภาพแวดล้อม

เมื่อการรัน agent เริ่มต้น OpenClaw จะ:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw จะแก้รายการ Skills ที่มีผลสำหรับ agent โดยใช้กฎการคัดกรอง
    allowlists และ config overrides
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` และ `skills.entries.<key>.apiKey` จะถูกนำไปใช้กับ
    `process.env` ตลอดระยะเวลาของการรัน
  </Step>
  <Step title="Builds the system prompt">
    Skills ที่เข้าเกณฑ์จะถูกคอมไพล์เป็นบล็อก XML แบบกะทัดรัดและฉีดเข้าไปใน
    system prompt
  </Step>
  <Step title="Restores the environment">
    หลังการรันสิ้นสุด สภาพแวดล้อมเดิมจะถูกคืนค่า
  </Step>
</Steps>

<Warning>
  การฉีด env ถูกจำกัดขอบเขตไว้ที่การรัน agent บน **host** ไม่ใช่ sandbox ภายใน
  sandbox, `env` และ `apiKey` จะไม่มีผล ดู
  [Skills config](/th/tools/skills-config#sandboxed-skills-and-env-vars) สำหรับวิธี
  ส่ง secrets เข้าไปในการรันแบบ sandbox
</Warning>

สำหรับ backend แบบ bundled `claude-cli` OpenClaw จะ materialize snapshot
Skills ที่เข้าเกณฑ์เดียวกันเป็น Plugin Claude Code ชั่วคราวและส่งผ่าน
`--plugin-dir` ด้วย backend CLI อื่นจะใช้เฉพาะ prompt catalog เท่านั้น

## Snapshots และ refresh

OpenClaw จะ snapshot Skills ที่เข้าเกณฑ์ **เมื่อ session เริ่มต้น** และนำ
รายการนั้นกลับมาใช้ซ้ำสำหรับ turn ถัดไปทั้งหมดใน session การเปลี่ยนแปลง Skills หรือ config จะ
มีผลใน session ใหม่ถัดไป

Skills จะ refresh กลาง session ในสองกรณี:

- watcher ของ Skills ตรวจพบการเปลี่ยนแปลง `SKILL.md`
- remote node ใหม่ที่มีสิทธิ์เชื่อมต่อเข้ามา

รายการที่ refresh แล้วจะถูกใช้ใน turn ถัดไปของ agent หาก allowlist ของ agent ที่มีผล
เปลี่ยนไป OpenClaw จะ refresh snapshot เพื่อให้ Skills ที่มองเห็นได้
สอดคล้องกัน

<AccordionGroup>
  <Accordion title="Skills watcher">
    โดยค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ Skills และ bump snapshot เมื่อ
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

    ใช้ `allowSymlinkTargets` สำหรับเลย์เอาต์ symlink ที่ตั้งใจไว้ซึ่ง symlink
    root ของ Skills ชี้ออกนอก root ที่กำหนดค่าไว้ ตัวอย่างเช่น
    `<workspace>/skills/manager -> ~/Projects/manager/skills`
    เปิดใช้ `skills.workshop.allowSymlinkTargetWrites` เฉพาะเมื่อ Skill Workshop
    ควรนำข้อเสนอไปใช้ผ่าน path symlink ที่เชื่อถือได้เหล่านั้นด้วย

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    หาก Gateway ทำงานบน Linux แต่มี **macOS node** เชื่อมต่ออยู่พร้อม
    อนุญาต `system.run` OpenClaw สามารถถือว่า Skills ที่มีเฉพาะบน macOS มีสิทธิ์ได้เมื่อ
    มีไบนารีที่ต้องการอยู่บน node นั้น agent ควรรัน Skills เหล่านั้น
    ผ่านเครื่องมือ `exec` พร้อม `host=node`

    node ที่ offline จะ **ไม่** ทำให้ Skills ที่มีเฉพาะระยะไกลมองเห็นได้ หาก node หยุด
    ตอบ bin probes OpenClaw จะล้าง bin matches ที่ cache ไว้ของ node นั้น

  </Accordion>
</AccordionGroup>

## ผลกระทบต่อ token

เมื่อ Skills มีสิทธิ์ OpenClaw จะฉีดบล็อก XML แบบกะทัดรัดเข้าไปใน system
prompt ค่าใช้จ่ายเป็นแบบ deterministic:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **overhead พื้นฐาน** (เฉพาะเมื่อมี Skills ≥ 1): ~195 อักขระ
- **ต่อ Skills:** ~97 อักขระ + ความยาวฟิลด์ `name`, `description` และ `location` ของคุณ
- การ escape XML จะขยาย `& < > " '` เป็น entities ทำให้เพิ่มอักขระสองสามตัวต่อครั้งที่พบ
- ที่ประมาณ ~4 อักขระ/token, 97 อักขระ ≈ 24 tokens ต่อ Skills ก่อนรวมความยาวฟิลด์

เขียนคำอธิบายให้สั้นและสื่อความหมายเพื่อลด overhead ของ prompt

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Creating skills" href="/th/tools/creating-skills" icon="hammer">
    คู่มือทีละขั้นตอนสำหรับการเขียน Skills แบบกำหนดเอง
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    คิวข้อเสนอสำหรับ Skills ที่ agent ร่างขึ้น
  </Card>
  <Card title="Skills config" href="/th/tools/skills-config" icon="gear">
    schema config `skills.*` ฉบับเต็มและ allowlists ของ agent
  </Card>
  <Card title="Slash commands" href="/th/tools/slash-commands" icon="terminal">
    วิธีลงทะเบียนและ route slash commands ของ Skills
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    เรียกดูและเผยแพร่ Skills บน registry สาธารณะ
  </Card>
  <Card title="Plugins" href="/th/tools/plugin" icon="plug">
    Plugin สามารถจัดส่ง Skills ควบคู่กับเครื่องมือที่ตนจัดทำเอกสาร
  </Card>
</CardGroup>
