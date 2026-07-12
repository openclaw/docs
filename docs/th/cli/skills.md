---
read_when:
    - คุณต้องการดูว่ามี Skills ใดพร้อมใช้งานและพร้อมทำงานบ้าง
    - คุณต้องการค้นหา ClawHub หรือติดตั้ง Skills จาก ClawHub, Git หรือไดเรกทอรีภายในเครื่อง
    - คุณต้องการตรวจสอบ Skills ของ ClawHub ด้วย ClawHub
    - คุณต้องการแก้ไขข้อบกพร่องของไบนารี ตัวแปรสภาพแวดล้อม หรือการกำหนดค่าที่ขาดหายไปสำหรับ Skills
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw skills` (ค้นหา/ติดตั้ง/อัปเดต/ตรวจสอบความถูกต้อง/แสดงรายการ/ดูข้อมูล/ตรวจเช็ก/เวิร์กช็อป)
title: Skills
x-i18n:
    generated_at: "2026-07-12T16:03:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

ตรวจสอบ Skills ภายในเครื่อง ค้นหา ClawHub ติดตั้ง Skills จาก ClawHub/Git/ไดเรกทอรีภายในเครื่อง ตรวจสอบยืนยัน Skills ของ ClawHub และอัปเดตการติดตั้งที่ติดตามโดย ClawHub

เนื้อหาที่เกี่ยวข้อง:

- ระบบ Skills: [Skills](/th/tools/skills)
- เวิร์กชอป Skills: [เวิร์กชอป Skills](/th/tools/skill-workshop)
- การกำหนดค่า Skills: [การกำหนดค่า Skills](/th/tools/skills-config)
- การติดตั้งจาก ClawHub: [ClawHub](/th/clawhub/cli)

## คำสั่ง

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update` และ `verify` ใช้ ClawHub โดยตรง `install @owner/<slug>` ติดตั้ง Skill จาก ClawHub, `install git:owner/repo[@ref]` โคลน Skill จาก Git และ `install ./path` คัดลอกไดเรกทอรี Skill ภายในเครื่อง โดยค่าเริ่มต้น `install`, `update` และ `verify` จะกำหนดเป้าหมายไปที่ไดเรกทอรี `skills/` ของพื้นที่ทำงานที่ใช้งานอยู่ เมื่อใช้ `--global` จะกำหนดเป้าหมายไปที่ไดเรกทอรี Skills ที่มีการจัดการร่วมกัน ส่วน `list`/`info`/`check` ยังคงตรวจสอบ Skills ภายในเครื่องที่พื้นที่ทำงานและการกำหนดค่าปัจจุบันมองเห็นได้ คำสั่งที่อิงพื้นที่ทำงานจะระบุพื้นที่ทำงานเป้าหมายจาก `--agent <id>` ก่อน จากนั้นใช้ไดเรกทอรีทำงานปัจจุบันหากอยู่ภายในพื้นที่ทำงานของเอเจนต์ที่กำหนดค่าไว้ และสุดท้ายจึงใช้เอเจนต์เริ่มต้น

การติดตั้งจาก Git และไดเรกทอรีภายในเครื่องกำหนดให้มี `SKILL.md` ที่รากของแหล่งที่มา slug สำหรับการติดตั้งจะมาจาก `name` ใน frontmatter ของ `SKILL.md` หากค่าถูกต้อง จากนั้นจึงใช้ชื่อไดเรกทอรีต้นทางหรือชื่อที่เก็บ ใช้ `--as <slug>` เพื่อแทนที่ค่านี้ `--version` ใช้ได้เฉพาะกับ ClawHub เท่านั้น การติดตั้ง Skill ไม่รองรับข้อกำหนดแพ็กเกจ npm หรือพาธ zip/ไฟล์เก็บถาวร และ `openclaw skills update` จะอัปเดตเฉพาะการติดตั้งที่ติดตามโดย ClawHub เท่านั้น

การติดตั้งการขึ้นต่อกันของ Skill ที่อิง Gateway ซึ่งถูกเรียกใช้จากการเริ่มต้นใช้งานหรือการตั้งค่า Skills จะใช้พาธคำขอ `skills.install` แยกต่างหาก

หมายเหตุ:

| แฟล็ก/ลักษณะการทำงาน                    | คำอธิบาย                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | คำค้นหาเป็นตัวเลือก หากละไว้จะเรียกดูฟีดการค้นหาเริ่มต้นของ ClawHub                                                                                                                                                                                                                |
| `search --limit <n>`             | จำกัดจำนวนผลลัพธ์ที่ส่งกลับ                                                                                                                                                                                                                                                            |
| `install git:owner/repo[@ref]`   | ติดตั้ง Skill จาก Git การอ้างอิงสาขาสามารถมีเครื่องหมายทับได้ เช่น `git:owner/repo@feature/foo`                                                                                                                                                                                      |
| `install ./path/to/skill`        | ติดตั้งไดเรกทอรีภายในเครื่องที่รากมี `SKILL.md`                                                                                                                                                                                                                        |
| `install --as <slug>`            | แทนที่ slug ที่อนุมานสำหรับการติดตั้งจาก Git และไดเรกทอรีภายในเครื่อง                                                                                                                                                                                                                 |
| `install --version <version>`    | ใช้ได้เฉพาะกับการอ้างอิง Skill ของ ClawHub                                                                                                                                                                                                                                               |
| `install --force`                | เขียนทับโฟลเดอร์ Skill ที่มีอยู่ในพื้นที่ทำงานสำหรับ slug เดียวกัน                                                                                                                                                                                                                  |
| `install/update --force-install` | ติดตั้ง Skill ของ ClawHub ที่อิง GitHub ซึ่งอยู่ระหว่างรอดำเนินการ ก่อนที่การสแกนของ ClawHub จะเสร็จสมบูรณ์                                                                                                                                                                                                   |
| `--global`                       | กำหนดเป้าหมายไปที่ไดเรกทอรี Skills ที่มีการจัดการร่วมกัน ไม่สามารถใช้ร่วมกับ `--agent <id>`                                                                                                                                                                                                  |
| `--agent <id>`                   | กำหนดเป้าหมายไปยังพื้นที่ทำงานของเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ และแทนที่การอนุมานจากไดเรกทอรีทำงานปัจจุบัน                                                                                                                                                                                            |
| `update @owner/<slug>`           | อัปเดต Skill ที่ติดตามอยู่หนึ่งรายการ เพิ่ม `--global` เพื่อกำหนดเป้าหมายไปยังไดเรกทอรี Skills ที่มีการจัดการร่วมกันแทนพื้นที่ทำงาน                                                                                                                                                            |
| `update --all`                   | อัปเดตการติดตั้ง ClawHub ที่ติดตามอยู่ในพื้นที่ทำงานที่เลือก หรือในไดเรกทอรี Skills ที่มีการจัดการร่วมกันเมื่อใช้ `--global`                                                                                                                                                               |
| `verify @owner/<slug>`           | แสดงเอนเวโลป JSON `clawhub.skill.verify.v1` ของ ClawHub โดยค่าเริ่มต้น ไม่มีแฟล็ก `--json` เนื่องจาก JSON เป็นค่าเริ่มต้นอยู่แล้ว รองรับ slug ที่ไม่มีชื่อเจ้าของเพื่อความเข้ากันได้เมื่อ Skill ติดตั้งอยู่แล้วหรือไม่มีความกำกวม การอ้างอิงที่ระบุเจ้าของช่วยหลีกเลี่ยงความกำกวมของผู้เผยแพร่ |
| แหล่งที่มาของ `verify`              | เมื่อ ClawHub ส่งคืนแหล่งที่มาที่เซิร์ฟเวอร์ระบุให้ JSON ของการตรวจสอบยืนยันจะรวม `openclaw.verifiedSourceUrl` ที่ตรึงกับคอมมิตด้วย URL แหล่งที่มาที่ไม่พร้อมใช้งานหรือประกาศเองจะคงอยู่เฉพาะในเอนเวโลปแหล่งที่มาดิบและจะไม่ได้รับการเลื่อนสถานะ                                           |
| ตัวเลือกเวอร์ชันของ `verify`        | `verify` ใช้ `.clawhub/origin.json` สำหรับ Skills ของ ClawHub ที่ติดตั้งแล้ว จึงตรวจสอบยืนยันเวอร์ชันที่ติดตั้งเทียบกับรีจิสทรีต้นทาง `--version` และ `--tag` จะแทนที่ตัวเลือกเวอร์ชัน แต่ยังคงใช้รีจิสทรีที่ติดตั้งนั้นเมื่อมีข้อมูลเมตาต้นทาง                    |
| `verify --card`                  | แสดง Markdown ของการ์ด Skill ที่สร้างขึ้นแทน JSON ออกจากโปรแกรมด้วยสถานะไม่เป็นศูนย์เมื่อ ClawHub ส่งคืน `ok: false` หรือ `decision: "fail"` ลายเซ็นที่ไม่ได้ลงนามมีไว้ให้ข้อมูล เว้นแต่นโยบายของ ClawHub จะเปลี่ยนแปลง                                                                             |
| ลายนิ้วมือการ์ด Skill           | บันเดิล ClawHub ที่ติดตั้งแล้วสามารถรวม `skill-card.md` ที่สร้างขึ้นได้ OpenClaw ถือว่าการตรวจสอบยืนยันเป็นการตัดสินใจของเซิร์ฟเวอร์ ClawHub และจะไม่ปฏิเสธ Skill ที่ติดตั้งแล้วเพียงเพราะการ์ดที่สร้างขึ้นนั้นทำให้ลายนิ้วมือของบันเดิลเปลี่ยนแปลง                                              |
| `check --agent <id>`             | ตรวจสอบพื้นที่ทำงานของเอเจนต์ที่เลือก และรายงานว่า Skills ที่พร้อมใช้งานรายการใดที่มองเห็นได้จริงในพรอมต์หรือพื้นผิวคำสั่งของเอเจนต์นั้น                                                                                                                                              |
| `list`                           | การทำงานเริ่มต้นเมื่อไม่ได้ระบุคำสั่งย่อย                                                                                                                                                                                                                                    |
| เอาต์พุต `list`/`info`/`check`     | เอาต์พุตที่เรนเดอร์แล้วจะส่งไปยัง stdout เมื่อใช้ `--json` เพย์โหลดที่เครื่องอ่านได้จะยังคงอยู่ที่ stdout สำหรับไพป์และสคริปต์                                                                                                                                                                |

การติดตั้งและอัปเดต Skills ชุมชนจาก ClawHub จะตรวจสอบความน่าเชื่อถือก่อนดาวน์โหลด รุ่นไฟล์เก็บถาวรของชุมชนที่มีการกำหนดเวอร์ชันจะใช้ข้อมูลเมตาความน่าเชื่อถือของรุ่นที่ตรงกันทุกประการ Skills จาก GitHub ที่อิงตัวแก้ไขจะใช้ตัวแก้ไขการติดตั้งของ ClawHub เพื่อบังคับใช้นโยบายการสแกนและการบังคับติดตั้งก่อนส่งคืนคอมมิตที่ตรึงไว้ ใช้ `--force-install` เพื่อติดตั้ง Skill ที่อิง GitHub ซึ่งอยู่ระหว่างรอดำเนินการก่อนการสแกนนั้นจะเสร็จสมบูรณ์ รุ่นชุมชนที่เป็นอันตรายหรือถูกบล็อกจะถูกปฏิเสธ รุ่นชุมชนที่มีความเสี่ยงต้องได้รับการตรวจสอบและใช้ `--acknowledge-clawhub-risk` เมื่อคำสั่งแบบไม่โต้ตอบควรดำเนินการต่อหลังการตรวจสอบนั้น ผู้เผยแพร่ Skill อย่างเป็นทางการของ ClawHub และแหล่งที่มา Skill ที่รวมมากับ OpenClaw จะข้ามพรอมต์ความน่าเชื่อถือของรุ่นนี้

## เวิร์กชอป Skill

`openclaw skills workshop` จัดการข้อเสนอ Skill ที่อยู่ระหว่างรอดำเนินการในพื้นที่ทำงานที่เลือก ข้อเสนอจะยังไม่เป็น Skills ที่ใช้งานอยู่จนกว่าจะนำไปใช้ สำหรับพื้นที่จัดเก็บข้อเสนอ มาตรการป้องกันไฟล์สนับสนุน เมธอดของ Gateway และนโยบายการอนุมัติ โปรดดู [เวิร์กชอป Skill](/th/tools/skill-workshop)

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "รายการตรวจสอบ QA ที่ทำซ้ำได้" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "รายการตรวจสอบ QA ที่ทำซ้ำได้" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "ซ้ำ"
openclaw skills workshop quarantine <proposal-id> --reason "ต้องผ่านการตรวจสอบด้านความปลอดภัย"
```

`propose-create`, `propose-update` และ `revise` ยังรองรับ `--goal <text>`
และ `--evidence <text>` เพื่อบันทึกแรงจูงใจและหมายเหตุประกอบของข้อเสนอ
ควบคู่กับเนื้อหา `--proposal`/`--proposal-dir`

## เนื้อหาที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Skills](/th/tools/skills)
