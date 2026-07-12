---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนการควบคุมการเข้าถึง Skills, รายการที่อนุญาต หรือกฎการโหลด
    - ทำความเข้าใจลำดับความสำคัญของ Skills และพฤติกรรมของสแนปช็อต
sidebarTitle: Skills
summary: Skills สอนเอเจนต์ของคุณให้รู้วิธีใช้เครื่องมือ เรียนรู้วิธีโหลด Skills การทำงานของลำดับความสำคัญ และวิธีกำหนดค่าเกต รายการที่อนุญาต และการแทรกตัวแปรสภาพแวดล้อม
title: Skills
x-i18n:
    generated_at: "2026-07-12T16:50:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills คือไฟล์คำสั่งแบบ Markdown ที่สอนเอเจนต์ว่าควรใช้เครื่องมืออย่างไรและเมื่อใด
แต่ละ Skills อยู่ในไดเรกทอรีที่มีไฟล์ `SKILL.md` พร้อม frontmatter แบบ YAML
และเนื้อหาแบบ Markdown OpenClaw โหลด Skills ที่มาพร้อมระบบรวมถึงการกำหนดทับในเครื่อง
จากนั้นกรองขณะโหลดตามสภาพแวดล้อม การกำหนดค่า และการมีอยู่ของไบนารี

<CardGroup cols={2}>
  <Card title="การสร้าง Skills" href="/th/tools/creating-skills" icon="hammer">
    สร้างและทดสอบ Skills แบบกำหนดเองตั้งแต่ต้น
  </Card>
  <Card title="เวิร์กช็อป Skills" href="/th/tools/skill-workshop" icon="flask">
    ตรวจสอบและอนุมัติข้อเสนอ Skills ที่เอเจนต์ร่างขึ้น
  </Card>
  <Card title="การกำหนดค่า Skills" href="/th/tools/skills-config" icon="gear">
    สคีมาการกำหนดค่า `skills.*` ฉบับเต็มและรายการอนุญาตของเอเจนต์
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    เรียกดูและติดตั้ง Skills จากชุมชน
  </Card>
</CardGroup>

## ลำดับการโหลด

OpenClaw โหลดจากแหล่งต่อไปนี้โดยเรียงจาก **ลำดับความสำคัญสูงสุดก่อน**
เมื่อชื่อ Skills เดียวกันปรากฏในหลายตำแหน่ง แหล่งที่มีลำดับความสำคัญสูงสุดจะถูกใช้

| ลำดับความสำคัญ | แหล่งที่มา                  | พาธ                                    |
| --------------- | --------------------------- | --------------------------------------- |
| 1 — สูงสุด      | Skills ของเวิร์กสเปซ        | `<workspace>/skills`                    |
| 2               | Skills ของเอเจนต์โครงการ    | `<workspace>/.agents/skills`            |
| 3               | Skills ส่วนตัวของเอเจนต์    | `~/.agents/skills`                      |
| 4               | Skills ที่จัดการ / ในเครื่อง | `~/.openclaw/skills`                    |
| 5               | Skills ที่มาพร้อมระบบ       | จัดส่งมาพร้อมการติดตั้ง                 |
| 6 — ต่ำสุด      | ไดเรกทอรีเพิ่มเติม          | `skills.load.extraDirs` + Skills ของ Plugin |

รากของ Skills รองรับโครงสร้างแบบจัดกลุ่ม OpenClaw จะค้นพบ Skills เมื่อใดก็ตามที่
`SKILL.md` ปรากฏที่ตำแหน่งใด ๆ ภายใต้รากที่กำหนดค่าไว้ (ลึกได้สูงสุด 6 ระดับ):

```text
<workspace>/skills/research/SKILL.md          ✓ พบในชื่อ "research"
<workspace>/skills/personal/research/SKILL.md ✓ พบในชื่อ "research" เช่นกัน
```

พาธโฟลเดอร์มีไว้เพื่อจัดระเบียบเท่านั้น ชื่อและคำสั่งแบบทับของ Skills
มาจากฟิลด์ `name` ใน frontmatter (หรือชื่อไดเรกทอรีเมื่อไม่มี `name`)
รายการอนุญาตของเอเจนต์ (ด้านล่าง) จะจับคู่กับ `name` นี้เช่นกัน

<Note>
  ไดเรกทอรี `$CODEX_HOME/skills` ดั้งเดิมของ Codex CLI **ไม่ใช่** ราก Skills
  ของ OpenClaw ใช้ `openclaw migrate plan codex` เพื่อจัดทำรายการ Skills เหล่านั้น
  จากนั้นใช้ `openclaw migrate codex` เพื่อคัดลอกไปยังเวิร์กสเปซ OpenClaw ของคุณ
</Note>

## Skills ที่โฮสต์บน Node

Node แบบไม่มีส่วนติดต่อผู้ใช้ที่เชื่อมต่ออยู่สามารถเผยแพร่ Skills ที่ติดตั้งในไดเรกทอรี
Skills ของ OpenClaw ที่ใช้งานอยู่ได้ (`~/.openclaw/skills` โดยค่าเริ่มต้น;
การกำหนดทับด้วยสภาพแวดล้อมของโปรไฟล์มีผล) Skills เหล่านี้จะปรากฏในรายการ Skills
ปกติของเอเจนต์ขณะที่ Node เชื่อมต่ออยู่ และหายไปเมื่อตัดการเชื่อมต่อ หากชื่อชนกัน
Skills ในเครื่องหรือ Skills ของ Gateway จะคงชื่อเดิมไว้ ส่วน Skills ของ Node
จะได้รับชื่อที่มีคำนำหน้า Node แบบกำหนดได้แน่นอน สำหรับ Skills ที่โฮสต์บน Node v1
ชื่อไดเรกทอรีต้องตรงกับฟิลด์ `name` ใน frontmatter ของ Skills

รายการ Skills จะมีตัวระบุตำแหน่ง Node รวมอยู่ด้วย ไฟล์ การอ้างอิงแบบสัมพัทธ์
และไบนารีของรายการนั้นอยู่บน Node ดังนั้นให้โหลดและเรียกใช้ด้วย
`exec host=node node=<node-id>` รีสตาร์ตโฮสต์ Node หลังจากเปลี่ยนไฟล์ Skills
ดู [Node](/th/nodes#node-hosted-skills) สำหรับการจับคู่และสวิตช์ปิดใช้งาน

## Skills แบบต่อเอเจนต์เทียบกับแบบใช้ร่วมกัน

ในการตั้งค่าแบบหลายเอเจนต์ แต่ละเอเจนต์มีเวิร์กสเปซของตนเอง
ใช้พาธที่ตรงกับขอบเขตการมองเห็นที่คุณต้องการ:

| ขอบเขต                  | พาธ                         | มองเห็นได้โดย                         |
| ----------------------- | ---------------------------- | ------------------------------------- |
| ต่อเอเจนต์              | `<workspace>/skills`         | เฉพาะเอเจนต์นั้น                      |
| เอเจนต์ของโครงการ       | `<workspace>/.agents/skills` | เฉพาะเอเจนต์ของเวิร์กสเปซนั้น         |
| เอเจนต์ส่วนตัว          | `~/.agents/skills`           | เอเจนต์ทั้งหมดบนเครื่องนี้            |
| ที่จัดการและใช้ร่วมกัน   | `~/.openclaw/skills`         | เอเจนต์ทั้งหมดบนเครื่องนี้            |
| ไดเรกทอรีเพิ่มเติม      | `skills.load.extraDirs`      | เอเจนต์ทั้งหมดบนเครื่องนี้            |

## รายการอนุญาตของเอเจนต์

**ตำแหน่ง** ของ Skills (ลำดับความสำคัญ) และ **ขอบเขตการมองเห็น** ของ Skills
(เอเจนต์ใดสามารถใช้ได้) เป็นการควบคุมที่แยกจากกัน ใช้รายการอนุญาตเพื่อจำกัดว่า
เอเจนต์จะเห็น Skills ใดบ้าง โดยไม่ขึ้นกับว่าโหลดมาจากที่ใด

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // เกณฑ์พื้นฐานที่ใช้ร่วมกัน
    },
    list: [
      { id: "writer" }, // สืบทอด github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้นทั้งหมด
      { id: "locked-down", skills: [] }, // ไม่มี Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="กฎของรายการอนุญาต">
    - ละ `agents.defaults.skills` เพื่อไม่จำกัด Skills ทั้งหมดตามค่าเริ่มต้น
    - ละ `agents.list[].skills` เพื่อสืบทอด `agents.defaults.skills`
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่เปิดเผย Skills ใดแก่เอเจนต์นั้น
    - รายการ `agents.list[].skills` ที่ไม่ว่างคือชุด **สุดท้าย** — โดยจะไม่
      ผสานกับค่าเริ่มต้น
    - รายการอนุญาตที่มีผลจะใช้กับการสร้างพรอมต์ การค้นหาคำสั่งแบบทับ
      การซิงค์แซนด์บ็อกซ์ และสแนปช็อต Skills
    - นี่ไม่ใช่ขอบเขตการอนุญาตสำหรับเชลล์ของโฮสต์ หากเอเจนต์เดียวกันสามารถ
      ใช้ `exec` ได้ ให้จำกัดเชลล์นั้นแยกต่างหากด้วยแซนด์บ็อกซ์
      การแยกผู้ใช้ระบบปฏิบัติการ รายการปฏิเสธ/อนุญาตของ exec
      และข้อมูลรับรองแยกตามทรัพยากร
  </Accordion>
</AccordionGroup>

## Plugin และ Skills

Plugin สามารถจัดส่ง Skills ของตนเองได้โดยระบุไดเรกทอรี `skills` ใน
`openclaw.plugin.json` (พาธสัมพัทธ์จากรากของ Plugin) Skills ของ Plugin
จะโหลดเมื่อเปิดใช้งาน Plugin เช่น Plugin เบราว์เซอร์จัดส่ง Skills
`browser-automation` สำหรับการควบคุมเบราว์เซอร์แบบหลายขั้นตอน

ไดเรกทอรี Skills ของ Plugin จะถูกรวมในระดับลำดับความสำคัญต่ำเดียวกับ
`skills.load.extraDirs` ดังนั้น Skills ที่มีชื่อเดียวกันจากระบบ จากส่วนที่จัดการ
จากเอเจนต์ หรือจากเวิร์กสเปซจะแทนที่ Skills เหล่านี้ กำหนดเงื่อนไขคุณสมบัติของ
Skills ใน Plugin ผ่าน `metadata.openclaw.requires` ใน frontmatter
เช่นเดียวกับ Skills อื่น

ดูระบบ Plugin ฉบับเต็มได้ที่ [Plugin](/th/tools/plugin) และ [เครื่องมือ](/th/tools)

## เวิร์กช็อป Skills

[เวิร์กช็อป Skills](/th/tools/skill-workshop) คือคิวข้อเสนอระหว่างเอเจนต์กับไฟล์ Skills
ที่ใช้งานอยู่ เมื่อเอเจนต์พบงานที่นำกลับมาใช้ซ้ำได้ เอเจนต์จะร่างข้อเสนอแทนการเขียน
ลงใน `SKILL.md` โดยตรง คุณต้องตรวจสอบและอนุมัติก่อนที่จะมีการเปลี่ยนแปลงใด ๆ

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

ดูวงจรการทำงานทั้งหมด เอกสารอ้างอิง CLI และการกำหนดค่าได้ที่
[เวิร์กช็อป Skills](/th/tools/skill-workshop)

## การติดตั้งจาก ClawHub

[ClawHub](https://clawhub.ai) คือรีจิสทรี Skills สาธารณะ ใช้คำสั่ง
`openclaw skills` สำหรับการติดตั้งและอัปเดต หรือใช้ CLI `clawhub`
สำหรับการเผยแพร่และซิงค์

| การดำเนินการ                              | คำสั่ง                                                 |
| ------------------------------------------ | ------------------------------------------------------ |
| ติดตั้ง Skills ลงในเวิร์กสเปซ             | `openclaw skills install @owner/<slug>`                |
| ติดตั้งจากรีโพซิทอรี Git                   | `openclaw skills install git:owner/repo@ref`           |
| ติดตั้งไดเรกทอรี Skills ในเครื่อง          | `openclaw skills install ./path/to/skill --as my-tool` |
| ติดตั้งสำหรับเอเจนต์ในเครื่องทั้งหมด       | `openclaw skills install @owner/<slug> --global`       |
| อัปเดต Skills ของเวิร์กสเปซทั้งหมด         | `openclaw skills update --all`                         |
| อัปเดต Skills ที่จัดการและใช้ร่วมกัน       | `openclaw skills update @owner/<slug> --global`        |
| อัปเดต Skills ที่จัดการและใช้ร่วมกันทั้งหมด | `openclaw skills update --all --global`                |
| ตรวจสอบขอบเขตความน่าเชื่อถือของ Skills     | `openclaw skills verify @owner/<slug>`                 |
| พิมพ์การ์ด Skills ที่สร้างขึ้น              | `openclaw skills verify @owner/<slug> --card`          |
| เผยแพร่ / ซิงค์ผ่าน CLI ของ ClawHub        | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="รายละเอียดการติดตั้ง">
    โดยค่าเริ่มต้น `openclaw skills install` จะติดตั้งลงในไดเรกทอรี `skills/`
    ของเวิร์กสเปซที่ใช้งานอยู่ เพิ่ม `--global` เพื่อติดตั้งลงในไดเรกทอรี
    `~/.openclaw/skills` ที่ใช้ร่วมกัน ซึ่งเอเจนต์ในเครื่องทั้งหมดมองเห็นได้
    เว้นแต่รายการอนุญาตของเอเจนต์จะจำกัดขอบเขตให้แคบลง

    การติดตั้งจาก Git และจากเครื่องคาดว่าจะพบ `SKILL.md` ที่รากของแหล่งต้นทาง
    slug มาจาก `name` ใน frontmatter ของ `SKILL.md` เมื่อค่าถูกต้อง
    มิฉะนั้นจะใช้ชื่อไดเรกทอรีหรือรีโพซิทอรี ใช้ `--as <slug>` เพื่อกำหนดทับ
    `openclaw skills update` ติดตามเฉพาะการติดตั้งจาก ClawHub — ให้ติดตั้ง
    แหล่งที่มาจาก Git หรือในเครื่องใหม่เพื่อรีเฟรช

  </Accordion>
  <Accordion title="การตรวจสอบและการสแกนความปลอดภัย">
    `openclaw skills verify @owner/<slug>` ขอขอบเขตความน่าเชื่อถือ
    `clawhub.skill.verify.v1` ของ Skills จาก ClawHub โดย Skills จาก ClawHub
    ที่ติดตั้งแล้วจะตรวจสอบเทียบกับเวอร์ชันและรีจิสทรีที่บันทึกใน
    `.clawhub/origin.json` slug ที่ไม่มีชื่อเจ้าของยังคงใช้ได้สำหรับ Skills
    ที่ติดตั้งอยู่แล้วหรือ Skills ที่ระบุได้อย่างไม่กำกวม แต่การอ้างอิงแบบระบุเจ้าของ
    ช่วยหลีกเลี่ยงความกำกวมของผู้เผยแพร่

    หน้า Skills ของ ClawHub แสดงสถานะการสแกนความปลอดภัยล่าสุดก่อนติดตั้ง
    พร้อมหน้ารายละเอียดสำหรับ VirusTotal, ClawScan และการวิเคราะห์แบบสถิต
    คำสั่งจะออกด้วยรหัสที่ไม่ใช่ศูนย์เมื่อ ClawHub ระบุว่าการตรวจสอบล้มเหลว
    ผู้เผยแพร่สามารถแก้ไขผลบวกลวงผ่านแดชบอร์ด ClawHub หรือ
    `clawhub skill rescan @owner/<slug>`

  </Accordion>
  <Accordion title="การติดตั้งจากไฟล์เก็บถาวรส่วนตัว">
    ไคลเอนต์ Gateway ที่ต้องการส่งมอบโดยไม่ผ่าน ClawHub สามารถจัดเตรียม
    ไฟล์เก็บถาวร Skills แบบ zip ด้วย `skills.upload.begin`,
    `skills.upload.chunk` และ `skills.upload.commit` แล้วติดตั้งด้วย
    `skills.install({ source: "upload", ... })` พาธนี้ปิดใช้งานโดยค่าเริ่มต้น
    และต้องกำหนด `skills.install.allowUploadedArchives: true` ใน
    `openclaw.json` การติดตั้ง ClawHub ตามปกติไม่จำเป็นต้องใช้การตั้งค่านี้
  </Accordion>
</AccordionGroup>

## ความปลอดภัย

<Warning>
  ให้ถือว่า Skills จากบุคคลที่สามเป็น **โค้ดที่ไม่น่าเชื่อถือ**
  อ่านโค้ดก่อนเปิดใช้งาน เลือกใช้การทำงานในแซนด์บ็อกซ์สำหรับอินพุตที่ไม่น่าเชื่อถือ
  และเครื่องมือที่มีความเสี่ยง ดูการควบคุมฝั่งเอเจนต์ที่
  [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing)
</Warning>

<AccordionGroup>
  <Accordion title="การจำกัดพาธ">
    การค้นหา Skills จากเวิร์กสเปซ เอเจนต์ของโครงการ และไดเรกทอรีเพิ่มเติม
    จะยอมรับเฉพาะราก Skills ที่ realpath ซึ่งแก้ไขแล้วอยู่ภายในรากที่กำหนดค่าไว้
    เว้นแต่ `skills.load.allowSymlinkTargets` จะเชื่อถือรากเป้าหมายอย่างชัดเจน
    เวิร์กช็อป Skills จะเขียนผ่านเป้าหมายที่เชื่อถือเหล่านั้นเฉพาะเมื่อเปิดใช้งาน
    `skills.workshop.allowSymlinkTargetWrites`
    ไดเรกทอรีที่จัดการ `~/.openclaw/skills` และไดเรกทอรีส่วนตัว
    `~/.agents/skills` อาจมีโฟลเดอร์ Skills ที่เป็นลิงก์เชิงสัญลักษณ์
    แต่ realpath ของ `SKILL.md` ทุกไฟล์ยังคงต้องอยู่ภายในไดเรกทอรี Skills
    ที่แก้ไขแล้วของตน
  </Accordion>
  <Accordion title="นโยบายการติดตั้งของผู้ดำเนินการ">
    กำหนดค่า `security.installPolicy` เพื่อเรียกใช้คำสั่งนโยบายในเครื่องที่เชื่อถือได้
    ก่อนดำเนินการติดตั้ง Skills ต่อ นโยบายจะได้รับข้อมูลเมตาและพาธแหล่งต้นทาง
    ที่จัดเตรียมไว้ ใช้กับพาธ ClawHub การอัปโหลด Git ในเครื่อง การอัปเดต
    และตัวติดตั้งการขึ้นต่อกัน และจะปฏิเสธโดยค่าเริ่มต้นเมื่อคำสั่งไม่สามารถ
    ส่งคืนผลการตัดสินใจที่ถูกต้องได้
  </Accordion>
  <Accordion title="ขอบเขตการแทรกข้อมูลลับ">
    `skills.entries.*.env` และ `skills.entries.*.apiKey` แทรกข้อมูลลับลงใน
    โปรเซสของ **โฮสต์** เฉพาะรอบการทำงานของเอเจนต์นั้น — ไม่ได้แทรกลงใน
    แซนด์บ็อกซ์ อย่าใส่ข้อมูลลับในพรอมต์และบันทึก
  </Accordion>
</AccordionGroup>

สำหรับโมเดลภัยคุกคามและรายการตรวจสอบความปลอดภัยที่ครอบคลุมยิ่งขึ้น โปรดดู
[ความปลอดภัย](/th/gateway/security)

## รูปแบบ SKILL.md

Skills ทุกชุดต้องมี `name` และ `description` ใน frontmatter เป็นอย่างน้อย:

```markdown
---
name: image-lab
description: สร้างหรือแก้ไขรูปภาพผ่านเวิร์กโฟลว์รูปภาพที่รองรับโดยผู้ให้บริการ
---

เมื่อผู้ใช้ขอให้สร้างรูปภาพ ให้ใช้เครื่องมือ `image_generate`...
```

<Note>
  OpenClaw ปฏิบัติตามข้อกำหนด [AgentSkills](https://agentskills.io) โดยจะแยกวิเคราะห์ frontmatter
  เป็น YAML ก่อน หากไม่สำเร็จ จะใช้ตัวแยกวิเคราะห์ที่รองรับเฉพาะบรรทัดเดียว
  เป็นทางเลือกสำรอง บล็อก `metadata` แบบซ้อน (รวมถึงการแมป YAML หลายบรรทัด)
  จะถูกแปลงเป็นสตริง JSON แบบแบนและแยกวิเคราะห์อีกครั้งเป็น JSON5 ดังนั้นรูปแบบบล็อกที่แสดง
  ในหัวข้อ [การควบคุมสิทธิ์](#gating) จึงใช้งานได้ ใช้ `{baseDir}` ในเนื้อหาเพื่ออ้างอิง
  พาธของโฟลเดอร์ Skills
</Note>

### คีย์ frontmatter ที่ไม่บังคับ

<ParamField path="homepage" type="string">
  URL ที่แสดงเป็น "Website" ใน UI Skills ของ macOS นอกจากนี้ยังกำหนดผ่าน
  `metadata.openclaw.homepage` ได้ด้วย
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  เมื่อเป็น `true` Skills จะถูกเปิดให้เรียกใช้โดยผู้ใช้ผ่านคำสั่งแบบสแลช
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  เมื่อเป็น `true` OpenClaw จะไม่นำคำสั่งของ Skills ไปรวมไว้ในพรอมต์ปกติ
  ของเอเจนต์ โดย Skills จะยังคงใช้งานเป็นคำสั่งแบบสแลชได้เมื่อ `user-invocable`
  เป็น `true` ด้วย
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  เมื่อตั้งค่าเป็น `tool` คำสั่งแบบสแลชจะข้ามโมเดลและส่งต่อ
  ไปยังเครื่องมือที่ลงทะเบียนไว้โดยตรง
</ParamField>

<ParamField path="command-tool" type="string">
  ชื่อเครื่องมือที่จะเรียกใช้เมื่อตั้งค่า `command-dispatch: tool`
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  สำหรับการส่งต่อไปยังเครื่องมือ ระบบจะส่งสตริงอาร์กิวเมนต์ดิบไปยังเครื่องมือโดยไม่มี
  การแยกวิเคราะห์จากแกนหลัก เครื่องมือจะได้รับ
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
</ParamField>

## การควบคุมสิทธิ์

OpenClaw กรอง Skills ขณะโหลดโดยใช้ `metadata.openclaw` (ออบเจ็กต์ JSON5
ที่ฝังอยู่ใน frontmatter โปรดดูหมายเหตุการแยกวิเคราะห์ด้านบน) Skills ที่ไม่มี
บล็อก `metadata.openclaw` จะมีสิทธิ์ใช้งานเสมอ เว้นแต่จะถูกปิดใช้งานอย่างชัดเจน

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
  เมื่อเป็น `true` ให้รวม Skills ไว้เสมอและข้ามเงื่อนไขควบคุมอื่นทั้งหมด
</ParamField>

<ParamField path="emoji" type="string">
  อีโมจิที่ไม่บังคับซึ่งแสดงใน UI Skills ของ macOS
</ParamField>

<ParamField path="homepage" type="string">
  URL ที่ไม่บังคับซึ่งแสดงเป็น "Website" ใน UI Skills ของ macOS
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  ตัวกรองแพลตฟอร์ม เมื่อตั้งค่าแล้ว Skills จะมีสิทธิ์ใช้งานเฉพาะบนระบบปฏิบัติการที่ระบุ
</ParamField>

<ParamField path="requires.bins" type="string[]">
  ไบนารีแต่ละรายการต้องมีอยู่ใน `PATH`
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  ต้องมีไบนารีอย่างน้อยหนึ่งรายการอยู่ใน `PATH`
</ParamField>

<ParamField path="requires.env" type="string[]">
  ตัวแปรสภาพแวดล้อมแต่ละตัวต้องมีอยู่ในโปรเซสหรือระบุผ่านการกำหนดค่า
</ParamField>

<ParamField path="requires.config" type="string[]">
  แต่ละพาธใน `openclaw.json` ต้องมีค่าเป็นจริง
</ParamField>

<ParamField path="primaryEnv" type="string">
  ชื่อตัวแปรสภาพแวดล้อมที่เชื่อมโยงกับ `skills.entries.<name>.apiKey`
</ParamField>

<ParamField path="install" type="object[]">
  ข้อกำหนดตัวติดตั้งที่ไม่บังคับซึ่ง UI Skills ของ macOS ใช้ (brew / node / go / uv / download)
</ParamField>

<Note>
  บล็อก `metadata.clawdbot` แบบเดิมยังคงได้รับการยอมรับเมื่อไม่มี
  `metadata.openclaw` เพื่อให้ Skills รุ่นเก่าที่ติดตั้งไว้ยังคงใช้
  เงื่อนไขการขึ้นต่อกันและคำแนะนำตัวติดตั้งได้ Skills ใหม่ควรใช้
  `metadata.openclaw`
</Note>

### ข้อกำหนดตัวติดตั้ง

ข้อกำหนดตัวติดตั้งระบุวิธีที่ UI Skills ของ macOS ใช้ติดตั้งการขึ้นต่อกัน:

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
    - เมื่อระบุตัวติดตั้งหลายรายการ Gateway จะเลือกตัวเลือกที่ต้องการ
      หนึ่งรายการ (ใช้ brew เมื่อพร้อมใช้งาน มิฉะนั้นใช้ node)
    - หากตัวติดตั้งทั้งหมดเป็น `download` OpenClaw จะแสดงแต่ละรายการเพื่อให้คุณ
      เห็นอาร์ติแฟกต์ทั้งหมดที่พร้อมใช้งาน
    - ข้อกำหนดสามารถมี `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตามแพลตฟอร์ม
    - การติดตั้งด้วย Node จะใช้ `skills.install.nodeManager` ใน `openclaw.json`
      (ค่าเริ่มต้น: npm; ตัวเลือก: npm / pnpm / yarn / bun) การตั้งค่านี้มีผลเฉพาะต่อ
      การติดตั้ง Skills เท่านั้น รันไทม์ Gateway ควรยังคงเป็น Node
    - ลำดับความสำคัญของตัวติดตั้ง Gateway: Homebrew → uv → ตัวจัดการ node ที่กำหนดค่าไว้ →
      go → download
  </Accordion>
  <Accordion title="รายละเอียดของตัวติดตั้งแต่ละประเภท">
    - **Homebrew:** OpenClaw จะไม่ติดตั้ง Homebrew โดยอัตโนมัติหรือแปลงสูตร brew
      เป็นคำสั่งแพ็กเกจของระบบ ในคอนเทนเนอร์ Linux ที่ไม่มี
      `brew` ตัวติดตั้งที่รองรับเฉพาะ brew จะถูกซ่อน ให้ใช้อิมเมจที่กำหนดเองหรือติดตั้ง
      การขึ้นต่อกันด้วยตนเอง
    - **Go:** OpenClaw ต้องใช้ Go 1.21 หรือใหม่กว่าสำหรับการติดตั้ง Skills อัตโนมัติ
      หากไม่มี `go` และ Homebrew พร้อมใช้งาน OpenClaw จะติดตั้ง Go ผ่าน
      Homebrew ก่อน ส่วนบน Linux ที่ไม่มี Homebrew จะใช้ `apt-get`
      ด้วยผู้ใช้ root หรือผ่าน `sudo` ที่ไม่ต้องใช้รหัสผ่านแทนได้ เมื่อแพ็กเกจ `golang-go`
      ที่รีเฟรชแล้วมีเวอร์ชันขั้นต่ำตามที่กำหนด การเรียก `go install` จริงสำหรับ
      การขึ้นต่อกันจะติดตั้งไปยังไดเรกทอรี bin เฉพาะที่ OpenClaw จัดการเสมอ
      (`bin` ของ Homebrew สำหรับการติดตั้งใหม่ มิฉะนั้นเป็น `~/.local/bin`) แทน
      `GOBIN` ที่คุณกำหนดค่าไว้ โดยระบบจะอ่านตัวแปรสภาพแวดล้อม `GOBIN`, `GOPATH` และ `GOTOOLCHAIN`
      ของคุณ แต่จะไม่เขียนทับค่าเหล่านั้น
    - **ดาวน์โหลด:** `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (ค่าเริ่มต้น: อัตโนมัติเมื่อตรวจพบไฟล์บีบอัด), `stripComponents`,
      `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)
  </Accordion>
  <Accordion title="หมายเหตุเกี่ยวกับแซนด์บ็อกซ์">
    ระบบตรวจสอบ `requires.bins` บน **โฮสต์** ขณะโหลด Skills หากเอเจนต์
    ทำงานในแซนด์บ็อกซ์ ไบนารีนั้นต้องมีอยู่ **ภายในคอนเทนเนอร์** ด้วย
    ให้ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` หรือใช้อิมเมจ
    ที่กำหนดเอง `setupCommand` จะทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์ และต้องมี
    การเชื่อมต่อเครือข่ายขาออก ระบบไฟล์รากที่เขียนได้ และผู้ใช้ root ในแซนด์บ็อกซ์
  </Accordion>
</AccordionGroup>

## การเขียนทับการกำหนดค่า

สลับสถานะและกำหนดค่า Skills ที่รวมมาด้วยหรือได้รับการจัดการภายใต้ `skills.entries` ใน
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
  `false` จะปิดใช้งาน Skills แม้ว่าจะรวมมาด้วยหรือติดตั้งแล้วก็ตาม Skills
  `coding-agent` ที่รวมมาด้วยต้องเลือกเปิดใช้งาน โดยตั้งค่า
  `skills.entries.coding-agent.enabled: true` และตรวจสอบให้แน่ใจว่าได้ติดตั้งและยืนยันตัวตน
  CLI ที่รองรับอย่างใดอย่างหนึ่ง เช่น `claude`, `codex`, `opencode` หรือรายการอื่นแล้ว
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  ฟิลด์อำนวยความสะดวกสำหรับ Skills ที่ประกาศ `metadata.openclaw.primaryEnv`
  รองรับสตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef
</ParamField>

<ParamField path="env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมที่แทรกสำหรับการทำงานของเอเจนต์ จะแทรกเฉพาะเมื่อ
  ยังไม่ได้ตั้งค่าตัวแปรนั้นในโปรเซส
</ParamField>

<ParamField path="config" type="object">
  ชุดข้อมูลที่ไม่บังคับสำหรับฟิลด์การกำหนดค่าเฉพาะของแต่ละ Skills
</ParamField>

<ParamField path="allowBundled" type="string[]">
  รายการอนุญาตที่ไม่บังคับสำหรับ Skills ที่ **รวมมาด้วย** เท่านั้น เมื่อตั้งค่าแล้ว เฉพาะ Skills ที่รวมมาด้วย
  และอยู่ในรายการเท่านั้นที่มีสิทธิ์ใช้งาน Skills ที่ได้รับการจัดการและ Skills ในเวิร์กสเปซจะไม่ได้รับผลกระทบ
</ParamField>

<Note>
  ตามค่าเริ่มต้น คีย์การกำหนดค่าจะตรงกับ **ชื่อ Skills** หาก Skills กำหนด
  `metadata.openclaw.skillKey` ให้ใช้คีย์นั้นภายใต้ `skills.entries` แทน
  ชื่อที่มีเครื่องหมายยัติภังค์ต้องใส่เครื่องหมายคำพูด เนื่องจาก JSON5 รองรับคีย์ที่ใส่เครื่องหมายคำพูด
</Note>

## การแทรกตัวแปรสภาพแวดล้อม

เมื่อการทำงานของเอเจนต์เริ่มต้น OpenClaw จะดำเนินการดังนี้:

<Steps>
  <Step title="อ่านข้อมูลเมตาของ Skills">
    OpenClaw จะคำนวณรายการ Skills ที่มีผลสำหรับเอเจนต์ โดยใช้กฎการควบคุมสิทธิ์
    รายการอนุญาต และการเขียนทับการกำหนดค่า
  </Step>
  <Step title="แทรกตัวแปรสภาพแวดล้อมและคีย์ API">
    ระบบจะใช้ `skills.entries.<key>.env` และ `skills.entries.<key>.apiKey` กับ
    `process.env` ตลอดระยะเวลาการทำงาน
  </Step>
  <Step title="สร้างพรอมต์ระบบ">
    Skills ที่มีสิทธิ์ใช้งานจะถูกคอมไพล์เป็นบล็อก XML แบบกะทัดรัดและแทรกลงใน
    พรอมต์ระบบ
  </Step>
  <Step title="คืนค่าสภาพแวดล้อม">
    หลังจากการทำงานสิ้นสุด ระบบจะคืนค่าสภาพแวดล้อมเดิม
  </Step>
</Steps>

<Warning>
  การแทรกตัวแปรสภาพแวดล้อมมีขอบเขตเฉพาะการทำงานของเอเจนต์บน **โฮสต์** ไม่ใช่แซนด์บ็อกซ์ ภายใน
  แซนด์บ็อกซ์ `env` และ `apiKey` จะไม่มีผล โปรดดู
  [การกำหนดค่า Skills](/th/tools/skills-config#sandboxed-skills-and-env-vars) สำหรับวิธี
  ส่งข้อมูลลับเข้าสู่การทำงานแบบแซนด์บ็อกซ์
</Warning>

สำหรับแบ็กเอนด์ `claude-cli` ที่รวมมาด้วย OpenClaw จะสร้างสแนปชอต Skills
ที่มีสิทธิ์ใช้งานชุดเดียวกันเป็น Plugin ชั่วคราวของ Claude Code และส่งผ่าน
`--plugin-dir` ด้วย แบ็กเอนด์ CLI อื่นจะใช้เฉพาะแค็ตตาล็อกพรอมต์

## สแนปชอตและการรีเฟรช

OpenClaw จะบันทึกสแนปชอตของ Skills ที่มีสิทธิ์ใช้งาน **เมื่อเซสชันเริ่มต้น** และนำ
รายการนั้นกลับมาใช้ในทุกเทิร์นถัดไปของเซสชัน การเปลี่ยนแปลง Skills หรือการกำหนดค่า
จะมีผลในเซสชันใหม่ครั้งถัดไป

Skills จะรีเฟรชระหว่างเซสชันในสองกรณี:

- ตัวเฝ้าดู Skills ตรวจพบการเปลี่ยนแปลงของ `SKILL.md`
- Node ระยะไกลใหม่ที่มีสิทธิ์ใช้งานเชื่อมต่อเข้ามา

ระบบจะใช้รายการที่รีเฟรชแล้วในเทิร์นถัดไปของเอเจนต์ หากรายการอนุญาตที่มีผลของเอเจนต์
เปลี่ยนแปลง OpenClaw จะรีเฟรชสแนปชอตเพื่อให้ Skills ที่มองเห็นยังคงสอดคล้องกัน

<AccordionGroup>
  <Accordion title="ตัวเฝ้าดู Skills">
    ตามค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ Skills และเพิ่มรุ่นของสแนปชอตเมื่อ
    ไฟล์ `SKILL.md` เปลี่ยนแปลง กำหนดค่าภายใต้ `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    ใช้ `allowSymlinkTargets` สำหรับโครงสร้างที่ตั้งใจใช้ลิงก์สัญลักษณ์ ซึ่งลิงก์สัญลักษณ์ของราก Skills
    ชี้ออกไปนอกไดเรกทอรีรากที่กำหนดค่าไว้ ตัวอย่างเช่น
    `<workspace>/skills/manager -> ~/Projects/manager/skills`
    เปิดใช้ `skills.workshop.allowSymlinkTargetWrites` เฉพาะเมื่อ Skill Workshop
    ควรนำข้อเสนอไปใช้ผ่านพาธลิงก์สัญลักษณ์ที่เชื่อถือได้เหล่านั้นด้วย

  </Accordion>
  <Accordion title="Node macOS ระยะไกล (Gateway บน Linux)">
    หาก Gateway ทำงานบน Linux แต่มี **Node macOS** เชื่อมต่ออยู่โดยอนุญาต
    `system.run` OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์ใช้งานได้ เมื่อ
    ไบนารีที่จำเป็นมีอยู่บน Node นั้น เอเจนต์ควรเรียกใช้ Skills เหล่านั้น
    ผ่านเครื่องมือ `exec` โดยกำหนด `host=node`

    Node ที่ออฟไลน์จะ **ไม่** ทำให้ Skills ที่ใช้ได้เฉพาะระยะไกลปรากฏขึ้น หาก Node หยุด
    ตอบการตรวจสอบไบนารี OpenClaw จะล้างผลการจับคู่ไบนารีที่แคชไว้ของ Node นั้น

  </Accordion>
</AccordionGroup>

## ผลกระทบต่อโทเค็น

เมื่อ Skills มีสิทธิ์ใช้งาน OpenClaw จะแทรกบล็อก XML แบบกะทัดรัดลงในพรอมต์
ระบบ ค่าใช้จ่ายสามารถคำนวณได้แน่นอนและเพิ่มขึ้นเชิงเส้นต่อ Skills:

- **ค่าใช้จ่ายพื้นฐาน** (เฉพาะเมื่อมี Skills ที่มีสิทธิ์ใช้งานอย่างน้อย 1 รายการ): บล็อกคงที่ที่มีข้อความ
  เกริ่นนำและตัวครอบ `<available_skills>`
- **ต่อ Skills หนึ่งรายการ:** ประมาณ 97 อักขระ + ความยาวของฟิลด์ `name`, `description` และ `location`
  ของคุณ
- การหลีกอักขระ XML จะแปลง `& < > " '` เป็นเอนทิตี ทำให้เพิ่มขึ้นอีกสองสามอักขระต่อ
  การปรากฏแต่ละครั้ง
- ที่ประมาณ 4 อักขระ/โทเค็น 97 อักขระ ≈ 24 โทเค็นต่อ Skills หนึ่งรายการ ก่อนรวมความยาวของฟิลด์

หากบล็อกที่เรนเดอร์จะเกินงบประมาณพรอมป์ที่กำหนดไว้
(`skills.limits.maxSkillsPromptChars`) OpenClaw จะเก็บข้อมูลระบุตัวตนของ Skills
(ชื่อ ตำแหน่ง และเวอร์ชัน) ไว้ให้ได้มากที่สุดเท่าที่รูปแบบย่อซึ่งไม่มีคำอธิบายจะรองรับ
จากนั้นจะใช้งบประมาณที่เหลือสำหรับคำอธิบายแบบย่อ หากไม่มีงบประมาณเหลือสำหรับ
คำอธิบาย ระบบจะละคำอธิบายไว้ พรอมป์จะมีหมายเหตุที่ชี้ไปยัง
`openclaw skills check` เมื่อจำเป็นต้องใช้การจัดรูปแบบแบบย่อหรือตัดทอนรายการ

เขียนคำอธิบายให้สั้นและสื่อความหมายเพื่อลดภาระของพรอมป์

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้าง Skills" href="/th/tools/creating-skills" icon="hammer">
    คู่มือทีละขั้นตอนสำหรับการสร้าง Skill แบบกำหนดเอง
  </Card>
  <Card title="เวิร์กช็อป Skills" href="/th/tools/skill-workshop" icon="flask">
    คิวข้อเสนอสำหรับ Skills ที่เอเจนต์ร่างขึ้น
  </Card>
  <Card title="การกำหนดค่า Skills" href="/th/tools/skills-config" icon="gear">
    สคีมาการกำหนดค่า `skills.*` ฉบับเต็มและรายการอนุญาตของเอเจนต์
  </Card>
  <Card title="คำสั่งสแลช" href="/th/tools/slash-commands" icon="terminal">
    วิธีลงทะเบียนและกำหนดเส้นทางคำสั่งสแลชของ Skill
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    เรียกดูและเผยแพร่ Skills บนรีจิสทรีสาธารณะ
  </Card>
  <Card title="Plugins" href="/th/tools/plugin" icon="plug">
    Plugins สามารถจัดส่ง Skills ควบคู่ไปกับเครื่องมือที่อธิบายไว้ในเอกสาร
  </Card>
</CardGroup>
