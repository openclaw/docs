---
read_when:
    - คุณต้องการดูว่า Skills ใดพร้อมใช้งานและพร้อมเรียกใช้
    - คุณต้องการค้นหา ClawHub หรือติดตั้ง Skills จาก ClawHub, Git หรือไดเรกทอรีภายในเครื่อง
    - คุณต้องการตรวจสอบ Skills ของ ClawHub ด้วย ClawHub
    - คุณต้องการดีบักไบนารี/env/config ที่ขาดหายสำหรับ Skills
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw skills` (search/install/update/verify/list/info/check/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:23:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

ตรวจสอบ Skills ในเครื่อง, ค้นหา ClawHub, ติดตั้ง Skills จากไดเรกทอรี ClawHub/Git/ในเครื่อง, ตรวจสอบ Skills ของ ClawHub และอัปเดตการติดตั้งที่ติดตามโดย ClawHub

ที่เกี่ยวข้อง:

- ระบบ Skills: [Skills](/th/tools/skills)
- เวิร์กช็อป Skill: [เวิร์กช็อป Skill](/th/tools/skill-workshop)
- การกำหนดค่า Skills: [การกำหนดค่า Skills](/th/tools/skills-config)
- การติดตั้ง ClawHub: [ClawHub](/th/clawhub/cli)

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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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

`search`, `update` และ `verify` ใช้ ClawHub โดยตรง `install @owner/<slug>`
ติดตั้ง Skill จาก ClawHub, `install git:owner/repo[@ref]` โคลน Skill จาก Git และ
`install ./path` คัดลอกไดเรกทอรี Skill ในเครื่อง โดยค่าเริ่มต้น `install`, `update`
และ `verify` จะกำหนดเป้าหมายไปยังไดเรกทอรี `skills/` ของพื้นที่ทำงานที่ใช้งานอยู่; เมื่อใช้ `--global`
จะกำหนดเป้าหมายไปยังไดเรกทอรี Skills ที่จัดการร่วมกัน `list`/`info`/`check` ยัง
ตรวจสอบ Skills ในเครื่องที่พื้นที่ทำงานและการกำหนดค่าปัจจุบันมองเห็นได้
คำสั่งที่อิงพื้นที่ทำงานจะระบุพื้นที่ทำงานเป้าหมายจาก `--agent <id>` จากนั้น
ใช้ไดเรกทอรีทำงานปัจจุบันเมื่ออยู่ภายในพื้นที่ทำงานของเอเจนต์ที่กำหนดค่าไว้
จากนั้นจึงใช้เอเจนต์เริ่มต้น

การติดตั้งจาก Git และไดเรกทอรีในเครื่องคาดหวังให้มี `SKILL.md` ที่รากของแหล่งที่มา
slug สำหรับการติดตั้งมาจาก frontmatter `name` ใน `SKILL.md` เมื่อถูกต้อง จากนั้นจึงใช้
ชื่อไดเรกทอรีหรือ repository ต้นทาง; ใช้ `--as <slug>` เพื่อเขียนทับค่านี้ `--version`
ใช้ได้เฉพาะกับ ClawHub เท่านั้น การติดตั้ง Skill ไม่รองรับสเปกแพ็กเกจ npm หรือพาธ zip/archive
และ `openclaw skills update` จะอัปเดตเฉพาะการติดตั้งที่ติดตามโดย ClawHub เท่านั้น

การติดตั้ง dependency ของ Skill ที่อิง Gateway ซึ่งถูกเรียกจาก onboarding หรือการตั้งค่า Skills
จะใช้พาธคำขอ `skills.install` แยกต่างหากแทน

หมายเหตุ:

- `search [query...]` รับ query เพิ่มเติมได้; ละไว้เพื่อเรียกดูฟีดค้นหา ClawHub เริ่มต้น
- `search --limit <n>` จำกัดจำนวนผลลัพธ์ที่ส่งคืน
- `install git:owner/repo[@ref]` ติดตั้ง Skill จาก Git อ้างอิง branch อาจมี
  เครื่องหมายทับ เช่น `git:owner/repo@feature/foo`
- `install ./path/to/skill` ติดตั้งไดเรกทอรีในเครื่องที่รากมี
  `SKILL.md`
- `install --as <slug>` เขียนทับ slug ที่อนุมานสำหรับการติดตั้งจาก Git และไดเรกทอรีในเครื่อง
- `install --version <version>` ใช้กับอ้างอิง Skill ของ ClawHub เท่านั้น
- `install --force` เขียนทับโฟลเดอร์ Skill ในพื้นที่ทำงานที่มีอยู่สำหรับ
  slug เดียวกัน
- การติดตั้งและอัปเดต Skill ชุมชนจาก ClawHub จะตรวจสอบความน่าเชื่อถือก่อนดาวน์โหลด
  รุ่น archive ชุมชนที่ระบุเวอร์ชันใช้ metadata ความน่าเชื่อถือแบบ exact-release
  Skills บน GitHub ที่อิง resolver อาศัย install resolver ของ ClawHub เพื่อบังคับใช้
  นโยบายการสแกนและการติดตั้งแบบบังคับก่อนส่งคืน commit ที่ปักหมุดไว้ รุ่นชุมชนที่เป็นอันตรายหรือ
  ถูกบล็อกจะถูกปฏิเสธ รุ่นชุมชนที่มีความเสี่ยงต้องผ่าน
  การตรวจทานและใช้ `--acknowledge-clawhub-risk` เมื่อคำสั่งแบบ non-interactive ควร
  ดำเนินต่อหลังการตรวจทานนั้น ผู้เผยแพร่ Skill อย่างเป็นทางการของ ClawHub และแหล่ง Skill
  ที่ bundled มากับ OpenClaw จะข้าม prompt ความน่าเชื่อถือของ release นี้
- `--global` กำหนดเป้าหมายไปยังไดเรกทอรี Skills ที่จัดการร่วมกัน และไม่สามารถใช้ร่วมกับ
  `--agent <id>` ได้
- `--agent <id>` กำหนดเป้าหมายไปยังพื้นที่ทำงานของเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ และเขียนทับการอนุมานจาก
  ไดเรกทอรีทำงานปัจจุบัน
- `update @owner/<slug>` อัปเดต Skill ที่ติดตามรายการเดียว เพิ่ม `--global` เพื่อ
  กำหนดเป้าหมายไปยังไดเรกทอรี Skills ที่จัดการร่วมกันแทนพื้นที่ทำงาน
- `update --all` อัปเดตการติดตั้ง ClawHub ที่ติดตามในพื้นที่ทำงานที่เลือก หรือ
  ในไดเรกทอรี Skills ที่จัดการร่วมกันเมื่อใช้ร่วมกับ `--global`
- `verify @owner/<slug>` พิมพ์ envelope JSON `clawhub.skill.verify.v1` ของ ClawHub
  โดยค่าเริ่มต้น ไม่มี flag `--json` เพราะ JSON เป็นค่าเริ่มต้นอยู่แล้ว
  bare slug ยังคงยอมรับเพื่อความเข้ากันได้เมื่อ Skill
  ติดตั้งอยู่แล้วหรือไม่กำกวม แต่อ้างอิงที่ระบุ owner จะหลีกเลี่ยง
  ความกำกวมของผู้เผยแพร่
- เมื่อ ClawHub ส่งคืน provenance ของแหล่งที่มาที่ server resolve แล้ว verify JSON จะ
  รวม `openclaw.verifiedSourceUrl` ที่ปักหมุด commit ไว้ด้วย URL แหล่งที่มาที่ไม่พร้อมใช้งานหรือ
  self-declared จะอยู่เฉพาะใน raw provenance envelope และจะไม่
  ถูกโปรโมต
- `verify` ใช้ `.clawhub/origin.json` สำหรับ Skills ของ ClawHub ที่ติดตั้งแล้ว ดังนั้นจึง
  ตรวจสอบเวอร์ชันที่ติดตั้งกับ registry ที่เป็นแหล่งที่มาของมัน `--version`
  และ `--tag` เขียนทับตัวเลือกเวอร์ชัน แต่ยังคงใช้ registry ที่ติดตั้งนั้น
  เมื่อมี origin metadata
- `verify --card` พิมพ์ Skill Card Markdown ที่สร้างขึ้นแทน JSON
  คำสั่งจะออกด้วยสถานะ non-zero เมื่อ ClawHub ส่งคืน `ok: false` หรือ `decision: "fail"`;
  ลายเซ็นที่ไม่ได้ลงนามเป็นข้อมูลประกอบ เว้นแต่นโยบายของ ClawHub จะเปลี่ยน
- bundle ของ ClawHub ที่ติดตั้งแล้วอาจมี `skill-card.md` ที่สร้างขึ้น OpenClaw
  ถือว่าการตรวจสอบเป็นการตัดสินใจของเซิร์ฟเวอร์ ClawHub และจะไม่ปฏิเสธ
  Skill ที่ติดตั้งแล้วเพียงเพราะ card ที่สร้างขึ้นนั้นเปลี่ยน
  fingerprint ของ bundle
- `check --agent <id>` ตรวจสอบพื้นที่ทำงานของเอเจนต์ที่เลือก และรายงานว่า
  Skills ที่พร้อมใช้งานรายการใดมองเห็นได้จริงใน prompt หรือ command surface ของเอเจนต์นั้น
- `list` เป็นการกระทำเริ่มต้นเมื่อไม่ได้ระบุ subcommand
- `list`, `info` และ `check` เขียนผลลัพธ์ที่ render แล้วไปยัง stdout เมื่อใช้
  `--json` หมายความว่า payload ที่ machine-readable จะยังอยู่บน stdout สำหรับ pipe
  และสคริปต์

## เวิร์กช็อป Skill

`openclaw skills workshop` จัดการข้อเสนอ Skill ที่รอดำเนินการในพื้นที่ทำงานที่เลือก
ข้อเสนอไม่ใช่ Skills ที่ใช้งานอยู่จนกว่าจะถูกนำไปใช้ สำหรับที่จัดเก็บข้อเสนอ
การป้องกันไฟล์สนับสนุน, เมธอด Gateway และนโยบายการอนุมัติ โปรดดู
[เวิร์กช็อป Skill](/th/tools/skill-workshop)

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Skills](/th/tools/skills)
