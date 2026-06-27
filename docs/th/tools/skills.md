---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนการควบคุมการใช้ Skills, รายการอนุญาต หรือกฎการโหลด
    - ทำความเข้าใจลำดับความสำคัญของ Skills และพฤติกรรมของสแนปชอต
sidebarTitle: Skills
summary: Skills สอนเอเจนต์ของคุณให้ใช้เครื่องมือได้ เรียนรู้วิธีโหลด Skills วิธีการทำงานของลำดับความสำคัญ และวิธีกำหนดค่าการควบคุมการเปิดใช้งาน รายการอนุญาต และการฉีดค่าสภาพแวดล้อม
title: Skills
x-i18n:
    generated_at: "2026-06-27T18:31:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills คือไฟล์คำสั่งแบบ markdown ที่สอนเอเจนต์ว่าควรใช้เครื่องมืออย่างไรและเมื่อใด แต่ละ Skills อยู่ในไดเรกทอรีที่มีไฟล์ `SKILL.md` พร้อม YAML frontmatter และเนื้อหาแบบ markdown OpenClaw โหลด Skills ที่มาพร้อมระบบรวมถึงการแทนที่ภายในเครื่อง และกรองตอนโหลดตามสภาพแวดล้อม การกำหนดค่า และการมีอยู่ของไบนารี

<CardGroup cols={2}>
  <Card title="Creating skills" href="/th/tools/creating-skills" icon="hammer">
    สร้างและทดสอบ Skills แบบกำหนดเองตั้งแต่ต้น
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    ตรวจสอบและอนุมัติข้อเสนอ Skills ที่เอเจนต์ร่างไว้
  </Card>
  <Card title="Skills config" href="/th/tools/skills-config" icon="gear">
    สคีมาการกำหนดค่า `skills.*` แบบครบถ้วนและ allowlist ของเอเจนต์
  </Card>
  <Card title="ClawHub" href="/th/clawhub" icon="cloud">
    เรียกดูและติดตั้ง Skills จากชุมชน
  </Card>
</CardGroup>

## ลำดับการโหลด

OpenClaw โหลดจากแหล่งต่อไปนี้ โดยเรียงจาก **ลำดับความสำคัญสูงสุดก่อน** เมื่อชื่อ Skills เดียวกันปรากฏในหลายที่ แหล่งที่มีลำดับสูงสุดจะชนะ

| ลำดับความสำคัญ | แหล่งที่มา | เส้นทาง |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — สูงสุด | Skills ของเวิร์กสเปซ | `<workspace>/skills` |
| 2 | Skills ของเอเจนต์โปรเจกต์ | `<workspace>/.agents/skills` |
| 3 | Skills ของเอเจนต์ส่วนตัว | `~/.agents/skills` |
| 4 | Skills ที่จัดการ / ภายในเครื่อง | `~/.openclaw/skills` |
| 5 | Skills ที่มาพร้อมระบบ | มาพร้อมกับการติดตั้ง |
| 6 — ต่ำสุด | ไดเรกทอรีเพิ่มเติม | `skills.load.extraDirs` + Skills ของ Plugin |

รากของ Skills รองรับเลย์เอาต์แบบจัดกลุ่ม OpenClaw จะค้นพบ Skills เมื่อใดก็ตามที่ `SKILL.md` ปรากฏอยู่ที่ใดก็ได้ภายใต้รากที่กำหนดค่าไว้:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

เส้นทางโฟลเดอร์มีไว้เพื่อการจัดระเบียบเท่านั้น ชื่อของ Skills, คำสั่งแบบ slash command และคีย์ allowlist ทั้งหมดมาจากฟิลด์ frontmatter `name` (หรือชื่อไดเรกทอรีเมื่อไม่มี `name`)

<Note>
  ไดเรกทอรีดั้งเดิม `$CODEX_HOME/skills` ของ Codex CLI **ไม่ใช่** ราก Skills ของ OpenClaw ใช้ `openclaw migrate plan codex` เพื่อทำบัญชี Skills เหล่านั้น จากนั้นใช้ `openclaw migrate codex` เพื่อคัดลอกเข้าสู่เวิร์กสเปซ OpenClaw ของคุณ
</Note>

## Skills ต่อเอเจนต์เทียบกับ Skills ที่ใช้ร่วมกัน

ในการตั้งค่าแบบหลายเอเจนต์ แต่ละเอเจนต์มีเวิร์กสเปซของตัวเอง ใช้เส้นทางที่ตรงกับการมองเห็นที่คุณต้องการ:

| ขอบเขต | เส้นทาง | มองเห็นได้โดย |
| -------------- | ---------------------------- | --------------------------- |
| ต่อเอเจนต์ | `<workspace>/skills` | เฉพาะเอเจนต์นั้น |
| เอเจนต์โปรเจกต์ | `<workspace>/.agents/skills` | เฉพาะเอเจนต์ของเวิร์กสเปซนั้น |
| เอเจนต์ส่วนตัว | `~/.agents/skills` | เอเจนต์ทั้งหมดบนเครื่องนี้ |
| ที่จัดการร่วมกัน | `~/.openclaw/skills` | เอเจนต์ทั้งหมดบนเครื่องนี้ |
| ไดเรกทอรีเพิ่มเติม | `skills.load.extraDirs` | เอเจนต์ทั้งหมดบนเครื่องนี้ |

## Allowlist ของเอเจนต์

**ตำแหน่ง** ของ Skills (ลำดับความสำคัญ) และ **การมองเห็น** ของ Skills (เอเจนต์ใดใช้ได้) เป็นการควบคุมคนละส่วน ใช้ allowlist เพื่อจำกัดว่าเอเจนต์จะเห็น Skills ใด โดยไม่ขึ้นกับว่าถูกโหลดมาจากที่ใด

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
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่เปิดเผย Skills ใด ๆ สำหรับเอเจนต์นั้น
    - รายการ `agents.list[].skills` ที่ไม่ว่างคือชุด **สุดท้าย** — จะไม่ผสานกับค่าเริ่มต้น
    - allowlist ที่มีผลจะใช้ครอบคลุมการสร้างพรอมป์ การค้นพบ slash command การซิงค์ sandbox และสแนปช็อต Skills
  </Accordion>
</AccordionGroup>

## Plugins และ Skills

Plugin สามารถมาพร้อม Skills ของตัวเองได้โดยระบุไดเรกทอรี `skills` ใน `openclaw.plugin.json` (เส้นทางสัมพัทธ์กับรากของ Plugin) Skills ของ Plugin จะโหลดเมื่อเปิดใช้งาน Plugin เช่น Plugin เบราว์เซอร์มาพร้อม Skills `browser-automation` สำหรับการควบคุมเบราว์เซอร์หลายขั้นตอน

ไดเรกทอรี Skills ของ Plugin จะผสานในระดับลำดับความสำคัญต่ำเดียวกับ `skills.load.extraDirs` ดังนั้น Skills ที่มาพร้อมระบบ ที่จัดการ เอเจนต์ หรือเวิร์กสเปซซึ่งมีชื่อเดียวกันจะแทนที่ ใช้ `metadata.openclaw.requires.config` บนรายการกำหนดค่าของ Plugin เพื่อควบคุมเงื่อนไข

ดู [Plugins](/th/tools/plugin) และ [Tools](/th/tools) สำหรับระบบ Plugin แบบครบถ้วน

## เวิร์กชอป Skills

[เวิร์กชอป Skills](/th/tools/skill-workshop) คือคิวข้อเสนอระหว่างเอเจนต์กับไฟล์ Skills ที่ใช้งานอยู่ของคุณ เมื่อเอเจนต์พบงานที่นำกลับมาใช้ซ้ำได้ เอเจนต์จะร่างข้อเสนอแทนการเขียนลง `SKILL.md` โดยตรง คุณตรวจสอบและอนุมัติก่อนที่จะมีการเปลี่ยนแปลงใด ๆ

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

ดู [เวิร์กชอป Skills](/th/tools/skill-workshop) สำหรับวงจรการทำงานแบบครบถ้วน ข้อมูลอ้างอิง CLI และการกำหนดค่า

## การติดตั้งจาก ClawHub

[ClawHub](https://clawhub.ai) คือรีจิสทรี Skills สาธารณะ ใช้คำสั่ง `openclaw skills` สำหรับติดตั้งและอัปเดต หรือใช้ CLI `clawhub` สำหรับเผยแพร่และซิงค์

| การดำเนินการ | คำสั่ง |
| ---------------------------------- | ------------------------------------------------------ |
| ติดตั้ง Skills ลงในเวิร์กสเปซ | `openclaw skills install @owner/<slug>` |
| ติดตั้งจาก Git repository | `openclaw skills install git:owner/repo@ref` |
| ติดตั้งไดเรกทอรี Skills ภายในเครื่อง | `openclaw skills install ./path/to/skill --as my-tool` |
| ติดตั้งสำหรับเอเจนต์ภายในเครื่องทั้งหมด | `openclaw skills install @owner/<slug> --global` |
| อัปเดต Skills ของเวิร์กสเปซทั้งหมด | `openclaw skills update --all` |
| อัปเดต Skills ที่จัดการร่วมกัน | `openclaw skills update @owner/<slug> --global` |
| อัปเดต Skills ที่จัดการร่วมกันทั้งหมด | `openclaw skills update --all --global` |
| ตรวจสอบ trust envelope ของ Skills | `openclaw skills verify @owner/<slug>` |
| พิมพ์ Skill Card ที่สร้างขึ้น | `openclaw skills verify @owner/<slug> --card` |
| เผยแพร่ / ซิงค์ผ่าน ClawHub CLI | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="รายละเอียดการติดตั้ง">
    โดยค่าเริ่มต้น `openclaw skills install` จะติดตั้งลงในไดเรกทอรี `skills/` ของเวิร์กสเปซที่ใช้งานอยู่ เพิ่ม `--global` เพื่อติดตั้งลงในไดเรกทอรีที่ใช้ร่วมกัน `~/.openclaw/skills` ซึ่งเอเจนต์ภายในเครื่องทั้งหมดมองเห็นได้ เว้นแต่ allowlist ของเอเจนต์จะจำกัดให้แคบลง

    การติดตั้งจาก Git และภายในเครื่องคาดหวังให้มี `SKILL.md` อยู่ที่รากต้นทาง slug มาจาก frontmatter `name` ของ `SKILL.md` เมื่อถูกต้อง จากนั้นจึง fallback เป็นชื่อไดเรกทอรีหรือ repository ใช้ `--as <slug>` เพื่อแทนที่
    `openclaw skills update` ติดตามเฉพาะการติดตั้งจาก ClawHub — ติดตั้งต้นทาง Git หรือภายในเครื่องใหม่เพื่อรีเฟรช

  </Accordion>
  <Accordion title="การตรวจสอบและการสแกนความปลอดภัย">
    `openclaw skills verify @owner/<slug>` ขอ trust envelope `clawhub.skill.verify.v1` ของ Skills จาก ClawHub Skills จาก ClawHub ที่ติดตั้งแล้วจะตรวจสอบเทียบกับเวอร์ชันและรีจิสทรีที่บันทึกไว้ใน `.clawhub/origin.json`
    bare slug ยังคงยอมรับได้สำหรับ Skills ที่ติดตั้งอยู่แล้วหรือไม่กำกวม แต่ refs แบบระบุเจ้าของช่วยหลีกเลี่ยงความกำกวมของผู้เผยแพร่

    หน้า Skills ของ ClawHub แสดงสถานะการสแกนความปลอดภัยล่าสุดก่อนติดตั้ง พร้อมหน้ารายละเอียดสำหรับ VirusTotal, ClawScan และการวิเคราะห์แบบ static คำสั่งจะออกด้วยสถานะ non-zero เมื่อ ClawHub ทำเครื่องหมายว่าการตรวจสอบล้มเหลว ผู้เผยแพร่กู้คืนผลบวกลวงได้ผ่านแดชบอร์ด ClawHub หรือ `clawhub skill rescan @owner/<slug>`

  </Accordion>
  <Accordion title="การติดตั้ง archive ส่วนตัว">
    ไคลเอนต์ Gateway ที่ต้องการการส่งมอบที่ไม่ใช่ ClawHub สามารถจัดเตรียม zip archive ของ Skills ด้วย `skills.upload.begin`, `skills.upload.chunk` และ `skills.upload.commit` จากนั้นติดตั้งด้วย `skills.install({ source: "upload", ... })` เส้นทางนี้ปิดอยู่โดยค่าเริ่มต้นและต้องใช้ `skills.install.allowUploadedArchives: true` ใน `openclaw.json` การติดตั้ง ClawHub ปกติไม่จำเป็นต้องใช้การตั้งค่านั้น
  </Accordion>
</AccordionGroup>

## ความปลอดภัย

<Warning>
  ปฏิบัติต่อ Skills ของบุคคลที่สามเป็น **โค้ดที่ไม่น่าเชื่อถือ** อ่านก่อนเปิดใช้งาน
  แนะนำให้ใช้การรันแบบ sandbox สำหรับอินพุตที่ไม่น่าเชื่อถือและเครื่องมือที่มีความเสี่ยง ดู
  [Sandboxing](/th/gateway/sandboxing) สำหรับการควบคุมฝั่งเอเจนต์
</Warning>

<AccordionGroup>
  <Accordion title="การจำกัดขอบเขตเส้นทาง">
    การค้นพบ Skills ของเวิร์กสเปซ เอเจนต์โปรเจกต์ และไดเรกทอรีเพิ่มเติมจะยอมรับเฉพาะราก Skills ที่ realpath ที่ resolve แล้วอยู่ภายในรากที่กำหนดค่าไว้ เว้นแต่ `skills.load.allowSymlinkTargets` จะเชื่อถือรากเป้าหมายอย่างชัดเจน
    เวิร์กชอป Skills จะเขียนผ่านเป้าหมายที่เชื่อถือเหล่านั้นเท่านั้นเมื่อเปิดใช้งาน `skills.workshop.allowSymlinkTargetWrites`
    ไดเรกทอรีที่จัดการ `~/.openclaw/skills` และไดเรกทอรีส่วนตัว `~/.agents/skills` อาจมีโฟลเดอร์ Skills ที่เป็น symlink ได้ แต่ realpath ของ `SKILL.md` ทุกไฟล์ยังต้องอยู่ภายในไดเรกทอรี Skills ที่ resolve แล้วของตัวเอง
  </Accordion>
  <Accordion title="นโยบายการติดตั้งของผู้ปฏิบัติงาน">
    กำหนดค่า `security.installPolicy` เพื่อรันคำสั่งนโยบายภายในเครื่องที่เชื่อถือได้ก่อนให้การติดตั้ง Skills ดำเนินต่อ นโยบายจะได้รับ metadata และเส้นทางต้นทางที่จัดเตรียมไว้ ใช้กับเส้นทาง ClawHub, uploaded, Git, local, update และ dependency-installer และจะ fail closed เมื่อคำสั่งไม่สามารถส่งคืนการตัดสินใจที่ถูกต้องได้
  </Accordion>
  <Accordion title="ขอบเขตการฉีด secret">
    `skills.entries.*.env` และ `skills.entries.*.apiKey` ฉีด secret เข้าไปในกระบวนการ **host** สำหรับเทิร์นของเอเจนต์นั้นเท่านั้น — ไม่ใช่เข้าไปใน sandbox เก็บ secret ออกจากพรอมป์และล็อก
  </Accordion>
</AccordionGroup>

สำหรับ threat model และเช็กลิสต์ความปลอดภัยที่กว้างขึ้น ดู
[ความปลอดภัย](/th/gateway/security)

## รูปแบบ SKILL.md

Skills ทุกตัวต้องมีอย่างน้อย `name` และ `description` ใน frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw ทำตามสเปก [AgentSkills](https://agentskills.io) ตัวแยกวิเคราะห์ frontmatter รองรับ **คีย์บรรทัดเดียวเท่านั้น** — `metadata` ต้องเป็นออบเจ็กต์ JSON แบบบรรทัดเดียว ใช้ `{baseDir}` ในเนื้อหาเพื่ออ้างอิงเส้นทางโฟลเดอร์ของ Skills
</Note>

### คีย์ frontmatter เพิ่มเติม

<ParamField path="homepage" type="string">
  URL ที่แสดงเป็น "เว็บไซต์" ใน UI Skills ของ macOS รองรับผ่าน `metadata.openclaw.homepage` ด้วย
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  เมื่อเป็น `true` Skills จะถูกเปิดเผยเป็น slash command ที่ผู้ใช้เรียกได้
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  เมื่อเป็น `true` OpenClaw จะไม่นำคำสั่งของ Skills เข้าไปในพรอมป์ปกติของเอเจนต์ Skills ยังใช้เป็น slash command ได้เมื่อ `user-invocable` เป็น `true` ด้วย
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  เมื่อตั้งค่าเป็น `tool` slash command จะข้ามโมเดลและ dispatch โดยตรงไปยังเครื่องมือที่ลงทะเบียนไว้
</ParamField>

<ParamField path="command-tool" type="string">
  ชื่อเครื่องมือที่จะเรียกใช้เมื่อตั้งค่า `command-dispatch: tool`
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  สำหรับ tool dispatch จะส่งต่อสตริง args ดิบไปยังเครื่องมือโดยไม่มีการ parse จาก core เครื่องมือจะได้รับ
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
</ParamField>

## การควบคุมเงื่อนไข

OpenClaw กรองทักษะตอนโหลดโดยใช้ `metadata.openclaw` (JSON บรรทัดเดียวใน frontmatter) ทักษะที่ไม่มีบล็อก `metadata.openclaw` จะมีสิทธิ์ใช้งานเสมอ เว้นแต่จะถูกปิดใช้งานอย่างชัดเจน

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
  เมื่อเป็น `true` ให้รวมทักษะนี้เสมอและข้ามเกตอื่นทั้งหมด
</ParamField>

<ParamField path="emoji" type="string">
  อีโมจิเสริมที่แสดงใน UI Skills ของ macOS
</ParamField>

<ParamField path="homepage" type="string">
  URL เสริมที่แสดงเป็น "Website" ใน UI Skills ของ macOS
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  ตัวกรองแพลตฟอร์ม เมื่อตั้งค่าแล้ว ทักษะนี้จะมีสิทธิ์ใช้งานเฉพาะบน OS ที่ระบุไว้เท่านั้น
</ParamField>

<ParamField path="requires.bins" type="string[]">
  ไบนารีแต่ละรายการต้องมีอยู่บน `PATH`
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  ต้องมีไบนารีอย่างน้อยหนึ่งรายการอยู่บน `PATH`
</ParamField>

<ParamField path="requires.env" type="string[]">
  ตัวแปรสภาพแวดล้อมแต่ละรายการต้องมีอยู่ในโปรเซสหรือระบุผ่านการกำหนดค่า
</ParamField>

<ParamField path="requires.config" type="string[]">
  พาธ `openclaw.json` แต่ละรายการต้องเป็นค่าจริง
</ParamField>

<ParamField path="primaryEnv" type="string">
  ชื่อตัวแปรสภาพแวดล้อมที่เชื่อมโยงกับ `skills.entries.<name>.apiKey`
</ParamField>

<ParamField path="install" type="object[]">
  ข้อกำหนดตัวติดตั้งเสริมที่ UI Skills ของ macOS ใช้ (brew / node / go / uv / download)
</ParamField>

<Note>
  บล็อกเดิม `metadata.clawdbot` ยังรองรับอยู่เมื่อไม่มี
  `metadata.openclaw` ดังนั้นทักษะเก่าที่ติดตั้งไว้จะยังคงเกตการพึ่งพา
  และคำใบ้ตัวติดตั้งไว้ ทักษะใหม่ควรใช้
  `metadata.openclaw`
</Note>

### ข้อกำหนดตัวติดตั้ง

ข้อกำหนดตัวติดตั้งบอก UI Skills ของ macOS ว่าจะติดตั้ง dependency อย่างไร:

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
      (brew เมื่อใช้ได้ มิฉะนั้นใช้ node)
    - หากตัวติดตั้งทั้งหมดเป็น `download` OpenClaw จะแสดงแต่ละรายการเพื่อให้คุณ
      เห็น artifact ทั้งหมดที่มี
    - ข้อกำหนดสามารถใส่ `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตามแพลตฟอร์มได้
    - การติดตั้งผ่าน Node จะเคารพ `skills.install.nodeManager` ใน `openclaw.json`
      (ค่าเริ่มต้น: npm; ตัวเลือก: npm / pnpm / yarn / bun) ค่านี้มีผลเฉพาะกับการติดตั้งทักษะ
      เท่านั้น; รันไทม์ของ Gateway ควรยังคงเป็น Node
    - ลำดับความต้องการตัวติดตั้งของ Gateway: Homebrew → uv → ตัวจัดการ node ที่กำหนดค่าไว้ →
      go → download
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw จะไม่ติดตั้ง Homebrew อัตโนมัติหรือแปลงสูตร brew
      เป็นคำสั่งแพ็กเกจของระบบ ในคอนเทนเนอร์ Linux ที่ไม่มี
      `brew` ตัวติดตั้งที่มีเฉพาะ brew จะถูกซ่อน; ใช้อิมเมจแบบกำหนดเองหรือติดตั้ง
      dependency ด้วยตนเอง
    - **Go:** หากไม่มี `go` และมี `brew` Gateway จะติดตั้ง
      Go ผ่าน Homebrew ก่อนและตั้งค่า `GOBIN` เป็น `bin` ของ Homebrew
    - **Download:** `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (ค่าเริ่มต้น: อัตโนมัติเมื่อตรวจพบ archive), `stripComponents`,
      `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` จะถูกตรวจสอบบน **โฮสต์** ตอนโหลดทักษะ หากเอเจนต์
    ทำงานใน sandbox ไบนารีนั้นต้องมีอยู่ **ภายในคอนเทนเนอร์** ด้วย
    ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` หรืออิมเมจแบบกำหนดเอง
    `setupCommand` ทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์ และต้องมี
    network egress, root FS ที่เขียนได้ และผู้ใช้ root ใน sandbox
  </Accordion>
</AccordionGroup>

## การ override การกำหนดค่า

สลับและกำหนดค่าทักษะที่บันเดิลมาหรือจัดการไว้ภายใต้ `skills.entries` ใน
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
  `false` จะปิดใช้งานทักษะแม้ว่าจะถูกบันเดิลมาหรือติดตั้งแล้วก็ตาม ทักษะบันเดิล `coding-agent`
  เป็นแบบ opt-in — ตั้งค่า `skills.entries.coding-agent.enabled: true`
  และตรวจสอบให้แน่ใจว่ามีการติดตั้งและยืนยันตัวตน CLI ที่รองรับอย่างใดอย่างหนึ่ง เช่น
  `claude`, `codex`, `opencode` หรือ CLI อื่นที่รองรับแล้ว
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  ฟิลด์อำนวยความสะดวกสำหรับทักษะที่ประกาศ `metadata.openclaw.primaryEnv`
  รองรับสตริงข้อความล้วนหรืออ็อบเจกต์ SecretRef
</ParamField>

<ParamField path="env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมที่ฉีดเข้าไปสำหรับการรันเอเจนต์ จะฉีดเฉพาะเมื่อ
  ยังไม่ได้ตั้งค่าตัวแปรนั้นในโปรเซส
</ParamField>

<ParamField path="config" type="object">
  ถุงข้อมูลเสริมสำหรับฟิลด์การกำหนดค่าแบบกำหนดเองรายทักษะ
</ParamField>

<ParamField path="allowBundled" type="string[]">
  allowlist เสริมสำหรับทักษะที่ **บันเดิลมา** เท่านั้น เมื่อตั้งค่าแล้ว เฉพาะทักษะบันเดิล
  ที่อยู่ในรายการเท่านั้นจึงจะมีสิทธิ์ใช้งาน ทักษะแบบจัดการและทักษะใน workspace จะไม่ได้รับผลกระทบ
</ParamField>

<Note>
  คีย์การกำหนดค่าจะตรงกับ **ชื่อทักษะ** โดยค่าเริ่มต้น หากทักษะกำหนด
  `metadata.openclaw.skillKey` ให้ใช้คีย์นั้นภายใต้ `skills.entries` ใส่เครื่องหมายอัญประกาศ
  ให้ชื่อที่มีขีดกลาง: JSON5 อนุญาตให้ใช้คีย์ที่มีเครื่องหมายอัญประกาศได้
</Note>

## การฉีดสภาพแวดล้อม

เมื่อการรันเอเจนต์เริ่มต้น OpenClaw จะ:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw แก้รายการทักษะที่มีผลสำหรับเอเจนต์ โดยใช้กฎเกต
    allowlist และการ override การกำหนดค่า
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` และ `skills.entries.<key>.apiKey` จะถูกนำไปใช้กับ
    `process.env` ตลอดระยะเวลาการรัน
  </Step>
  <Step title="Builds the system prompt">
    ทักษะที่มีสิทธิ์ใช้งานจะถูกรวบรวมเป็นบล็อก XML ขนาดกะทัดรัดและฉีดเข้าไปใน
    system prompt
  </Step>
  <Step title="Restores the environment">
    หลังจากการรันสิ้นสุด สภาพแวดล้อมเดิมจะถูกคืนค่า
  </Step>
</Steps>

<Warning>
  การฉีด env ถูกจำกัดขอบเขตไว้ที่การรันเอเจนต์บน **โฮสต์** ไม่ใช่ sandbox ภายใน
  sandbox, `env` และ `apiKey` จะไม่มีผล ดู
  [การกำหนดค่า Skills](/th/tools/skills-config#sandboxed-skills-and-env-vars) สำหรับวิธี
  ส่ง secret เข้าไปในการรันแบบ sandbox
</Warning>

สำหรับ backend `claude-cli` ที่บันเดิลมา OpenClaw จะ materialize snapshot
ทักษะที่มีสิทธิ์ใช้งานชุดเดียวกันเป็น Plugin ชั่วคราวของ Claude Code และส่งผ่าน
`--plugin-dir` ด้วย ส่วน backend CLI อื่นใช้เฉพาะแค็ตตาล็อก prompt

## Snapshot และการ refresh

OpenClaw จะ snapshot ทักษะที่มีสิทธิ์ใช้งาน **เมื่อ session เริ่มต้น** และนำรายการนั้น
กลับมาใช้สำหรับ turn ถัดไปทั้งหมดใน session การเปลี่ยนแปลงทักษะหรือการกำหนดค่าจะ
มีผลใน session ใหม่ถัดไป

Skills จะ refresh กลาง session ในสองกรณี:

- watcher ของ Skills ตรวจพบการเปลี่ยนแปลง `SKILL.md`
- โหนดระยะไกลใหม่ที่มีสิทธิ์ใช้งานเชื่อมต่อเข้ามา

รายการที่ refresh แล้วจะถูกนำไปใช้ใน turn ถัดไปของเอเจนต์ หาก allowlist ของเอเจนต์ที่มีผล
เปลี่ยนแปลง OpenClaw จะ refresh snapshot เพื่อให้ทักษะที่มองเห็นสอดคล้องกัน

<AccordionGroup>
  <Accordion title="Skills watcher">
    โดยค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ทักษะและ bump snapshot เมื่อ
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

    ใช้ `allowSymlinkTargets` สำหรับเลย์เอาต์ symlink ที่ตั้งใจไว้ ซึ่ง symlink ของรากทักษะ
    ชี้ออกนอก root ที่กำหนดค่าไว้ เช่น
    `<workspace>/skills/manager -> ~/Projects/manager/skills`
    เปิดใช้ `skills.workshop.allowSymlinkTargetWrites` เฉพาะเมื่อ Skill Workshop
    ควรใช้ข้อเสนอผ่านพาธ symlink ที่เชื่อถือได้เหล่านั้นด้วย

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    หาก Gateway ทำงานบน Linux แต่มี **โหนด macOS** เชื่อมต่ออยู่โดยอนุญาต
    `system.run` OpenClaw สามารถถือว่าทักษะเฉพาะ macOS มีสิทธิ์ใช้งานได้เมื่อ
    ไบนารีที่ต้องการมีอยู่บนโหนดนั้น เอเจนต์ควรรันทักษะเหล่านั้น
    ผ่านเครื่องมือ `exec` ด้วย `host=node`

    โหนดออฟไลน์จะ **ไม่** ทำให้ทักษะเฉพาะระยะไกลมองเห็นได้ หากโหนดหยุด
    ตอบ bin probe OpenClaw จะล้าง bin match ที่แคชไว้ของโหนดนั้น

  </Accordion>
</AccordionGroup>

## ผลกระทบต่อ token

เมื่อทักษะมีสิทธิ์ใช้งาน OpenClaw จะฉีดบล็อก XML ขนาดกะทัดรัดเข้าไปใน system
prompt ค่าใช้จ่ายเป็นแบบกำหนดได้แน่นอน:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **overhead ฐาน** (เฉพาะเมื่อมีทักษะ ≥ 1 รายการ): ประมาณ 195 อักขระ
- **ต่อทักษะ:** ประมาณ 97 อักขระ + ความยาวฟิลด์ `name`, `description` และ `location` ของคุณ
- การ escape XML จะขยาย `& < > " '` เป็น entity เพิ่มอักขระอีกเล็กน้อยต่อครั้งที่พบ
- ที่ประมาณ 4 อักขระ/token, 97 อักขระ ≈ 24 token ต่อทักษะก่อนนับความยาวฟิลด์

เขียน description ให้สั้นและสื่อความหมายเพื่อลด overhead ของ prompt

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Creating skills" href="/th/tools/creating-skills" icon="hammer">
    คู่มือทีละขั้นตอนสำหรับการเขียนทักษะแบบกำหนดเอง
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    คิวข้อเสนอสำหรับทักษะที่เอเจนต์ร่างขึ้น
  </Card>
  <Card title="Skills config" href="/th/tools/skills-config" icon="gear">
    สคีมาการกำหนดค่า `skills.*` แบบเต็มและ allowlist ของเอเจนต์
  </Card>
  <Card title="Slash commands" href="/th/tools/slash-commands" icon="terminal">
    วิธีลงทะเบียนและกำหนดเส้นทาง slash command ของทักษะ
  </Card>
  <Card title="ClawHub" href="/th/clawhub" icon="cloud">
    เรียกดูและเผยแพร่ทักษะบน registry สาธารณะ
  </Card>
  <Card title="Plugins" href="/th/tools/plugin" icon="plug">
    Plugins สามารถจัดส่งทักษะควบคู่กับเครื่องมือที่เอกสารของพวกเขาอธิบายไว้
  </Card>
</CardGroup>
