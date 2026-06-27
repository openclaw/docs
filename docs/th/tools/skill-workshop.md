---
read_when:
    - คุณต้องการให้เอเจนต์สร้างหรืออัปเดตทักษะจากแชต
    - คุณต้องตรวจทาน นำไปใช้ ปฏิเสธ หรือแยกกักฉบับร่าง Skills ที่สร้างขึ้น
    - คุณกำลังกำหนดค่าการอนุมัติ ความเป็นอิสระ พื้นที่จัดเก็บ หรือขีดจำกัดของ Skill Workshop
sidebarTitle: Skill Workshop
summary: สร้างและอัปเดต Skills ของเวิร์กสเปซผ่านการตรวจทาน Skill Workshop
title: เวิร์กช็อป Skills
x-i18n:
    generated_at: "2026-06-27T18:30:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

เวิร์กช็อปทักษะคือเส้นทางที่มีการกำกับดูแลของ OpenClaw สำหรับสร้างและอัปเดตทักษะในเวิร์กสเปซ

Agent และผู้ปฏิบัติงานจะไม่เขียนไฟล์ `SKILL.md` ที่ใช้งานอยู่โดยตรงผ่านเส้นทางนี้
พวกเขาจะสร้าง **ข้อเสนอ** ก่อน ข้อเสนอคือแบบร่างที่รอดำเนินการซึ่งมี
เนื้อหาทักษะที่เสนอ, การผูกเป้าหมาย, สถานะสแกนเนอร์, แฮช, เมตาดาต้าไฟล์สนับสนุน
และเมตาดาต้าย้อนกลับ ข้อเสนอจะกลายเป็นทักษะที่ใช้งานจริงก็ต่อเมื่อถูกนำไปใช้แล้วเท่านั้น

เวิร์กช็อปทักษะเขียนเฉพาะทักษะในเวิร์กสเปซเท่านั้น ไม่แก้ไขทักษะแบบบันเดิล,
Plugin, ClawHub, รากเพิ่มเติม, ที่มีการจัดการ, agent ส่วนตัว หรือระบบ

## วิธีการทำงาน

- **ข้อเสนอก่อน:** เนื้อหาทักษะที่สร้างขึ้นจะถูกเก็บเป็น `PROPOSAL.md` ไม่ใช่
  `SKILL.md`
- **การนำไปใช้เป็นการเขียนสดเพียงอย่างเดียว:** create, update และ revise จะไม่เปลี่ยน
  ทักษะที่ใช้งานอยู่
- **จำกัดขอบเขตที่เวิร์กสเปซ:** การสร้างจะกำหนดเป้าหมายไปที่ราก `skills/` ของเวิร์กสเปซ การอัปเดต
  อนุญาตเฉพาะทักษะในเวิร์กสเปซที่เขียนได้เท่านั้น
- **ไม่เขียนทับ:** การสร้างจะล้มเหลวหากทักษะเป้าหมายมีอยู่แล้ว
- **ผูกกับแฮช:** ข้อเสนออัปเดตจะผูกกับแฮชเป้าหมายปัจจุบัน และจะกลายเป็น
  ล้าสมัยหากทักษะที่ใช้งานจริงเปลี่ยนก่อนนำไปใช้
- **ผ่านเกณฑ์สแกนเนอร์:** การนำไปใช้จะรันการสแกนอีกครั้งก่อนเขียน
- **กู้คืนได้:** การนำไปใช้จะเขียนเมตาดาต้าย้อนกลับก่อนเปลี่ยนไฟล์ที่ใช้งานจริง
- **พื้นผิวที่สอดคล้องกัน:** แชท, CLI และ Gateway ทั้งหมดเรียกใช้บริการเวิร์กช็อปทักษะเดียวกัน

## วงจรชีวิต

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

เฉพาะข้อเสนอ `pending` เท่านั้นที่สามารถแก้ไข, นำไปใช้, ปฏิเสธ หรือกักกันได้

## แชท

ขอทักษะที่คุณต้องการจาก agent agent จะเรียก `skill_workshop` และ
ส่งคืน id ของข้อเสนอ

สร้าง:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

อัปเดตทักษะในเวิร์กสเปซที่มีอยู่:

```text
Update trip-planning to also check seat maps before booking.
```

ทำซ้ำกับข้อเสนอที่รอดำเนินการ:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

ตามค่าเริ่มต้น `apply`, `reject` และ `quarantine` ที่เริ่มโดย agent จะแสดง
พรอมต์อนุมัติก่อนรัน ตั้งค่า `skills.workshop.approvalPolicy` เป็น
`"auto"` เพื่อข้ามพรอมต์สำหรับสภาพแวดล้อมที่เชื่อถือได้

## CLI

สร้างข้อเสนอทักษะใหม่:

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

สร้างข้อเสนออัปเดตสำหรับทักษะในเวิร์กสเปซที่มีอยู่:

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

แสดงรายการและตรวจสอบ:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

แก้ไขก่อนอนุมัติ:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

ปิดข้อเสนอ:

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## เนื้อหาข้อเสนอ

ขณะรอดำเนินการ ข้อเสนอจะถูกเก็บเป็น `PROPOSAL.md` พร้อม frontmatter
เฉพาะข้อเสนอ:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

เมื่อนำไปใช้ เวิร์กช็อปทักษะจะเขียน `SKILL.md` ที่ใช้งานอยู่ และลบฟิลด์
เฉพาะข้อเสนอ: `status`, ข้อเสนอ `version` และข้อเสนอ `date`

## ไฟล์สนับสนุน

ใช้ `--proposal-dir` เมื่อทักษะที่เสนอจำเป็นต้องมีไฟล์ข้าง `PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

ไดเรกทอรีต้องมี `PROPOSAL.md` ไฟล์สนับสนุนต้องอยู่ภายใต้:

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

เวิร์กช็อปทักษะจะสแกน, แฮช และจัดเก็บไฟล์สนับสนุนพร้อมกับข้อเสนอ ไฟล์เหล่านี้
จะถูกเขียนข้าง `SKILL.md` ที่ใช้งานจริงเฉพาะเมื่อนำไปใช้เท่านั้น

พาธไฟล์สนับสนุนที่ถูกปฏิเสธรวมถึงพาธสัมบูรณ์, เซกเมนต์พาธที่ซ่อนอยู่, การไต่พาธ,
พาธที่ทับซ้อนกัน, ไฟล์ปฏิบัติการจากไดเรกทอรีข้อเสนอ,
ข้อความที่ไม่ใช่ UTF-8, ไบต์ null และไฟล์นอกโฟลเดอร์สนับสนุนมาตรฐาน

## เครื่องมือ Agent

โมเดลใช้ `skill_workshop`:

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

Agent ต้องใช้ `skill_workshop` สำหรับงานทักษะที่สร้างขึ้น พวกเขาต้องไม่สร้าง
หรือเปลี่ยนไฟล์ข้อเสนอผ่าน `write`, `edit`, `exec`, คำสั่ง shell หรือ
การดำเนินการระบบไฟล์โดยตรง

<Note>
`skill_workshop` เป็นเครื่องมือ agent ในตัวและรวมอยู่ใน
`tools.profile: "coding"` หากนโยบายที่เข้มงวดกว่าซ่อนไว้ ให้เพิ่ม
`skill_workshop` ในรายการ `tools.allow` ที่ใช้งานอยู่ หรือใช้
`tools.alsoAllow: ["skill_workshop"]` เมื่อขอบเขตใช้โปรไฟล์ที่ไม่มี
`tools.allow` อย่างชัดเจน การรันแบบ sandbox จะไม่สร้างเครื่องมือ
เวิร์กช็อปทักษะฝั่งโฮสต์ ดังนั้นให้รันการดำเนินการตรวจทานข้อเสนอจากเซสชัน
agent ฝั่งโฮสต์ปกติหรือ CLI
</Note>

## การอนุมัติและความเป็นอิสระ

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

- `autonomous.enabled`: อนุญาตให้ OpenClaw สร้างข้อเสนอที่รอดำเนินการจากสัญญาณ
  บทสนทนาที่คงทนหลังจากรอบที่สำเร็จ ค่าเริ่มต้น: `false`
- `allowSymlinkTargetWrites`: อนุญาตให้การนำไปใช้เขียนผ่าน symlink ทักษะในเวิร์กสเปซ
  ที่เป้าหมายจริงถูกระบุไว้ใน `skills.load.allowSymlinkTargets`
  ค่าเริ่มต้น: `false`
- `approvalPolicy: "pending"`: ต้องมีพรอมต์อนุมัติก่อน
  `apply`, `reject` หรือ `quarantine` ที่เริ่มโดย agent
- `approvalPolicy: "auto"`: ข้ามพรอมต์อนุมัตินั้น agent ยังต้อง
  เรียกการดำเนินการอยู่
- `maxPending`: จำกัดจำนวนข้อเสนอที่รอดำเนินการและถูกกักกันต่อเวิร์กสเปซ
- `maxSkillBytes`: จำกัดขนาดเนื้อหาข้อเสนอ ค่าเริ่มต้น: `40000`

คำอธิบายข้อเสนอถูกจำกัดไว้ที่ 160 ไบต์เสมอ

## เมธอด Gateway

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

เมธอดแบบอ่านอย่างเดียวต้องมี `operator.read` เมธอดที่เปลี่ยนแปลงต้องมี
`operator.admin`

## พื้นที่จัดเก็บ

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

ไดเรกทอรีสถานะเริ่มต้น: `~/.openclaw`

- `proposal.json`: ระเบียนข้อเสนอแบบมาตรฐาน
- `proposals.json`: ดัชนีรายการที่รวดเร็ว สร้างใหม่ได้จากโฟลเดอร์ข้อเสนอ
- `PROPOSAL.md`: ข้อเสนอทักษะที่รอดำเนินการ
- `rollback.json`: เมตาดาต้าการกู้คืนที่เขียนก่อนการนำไปใช้เปลี่ยนไฟล์ที่ใช้งานจริง

## ขีดจำกัด

- คำอธิบาย: 160 ไบต์
- เนื้อหาข้อเสนอ: `skills.workshop.maxSkillBytes` (ค่าเริ่มต้น 40,000)
- ไฟล์สนับสนุน: 64 ไฟล์ต่อข้อเสนอ
- ขนาดไฟล์สนับสนุน: ไฟล์ละ 256 KB, รวม 2 MB
- ข้อเสนอที่รอดำเนินการและถูกกักกัน: `skills.workshop.maxPending` ต่อเวิร์กสเปซ
  (ค่าเริ่มต้น 50)

## การแก้ไขปัญหา

| ปัญหา                                          | วิธีแก้ไข                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | ย่อ `description` ให้เหลือ 160 ไบต์หรือน้อยกว่า                                                                                                                                                            |
| `Skill proposal content is too large`          | ย่อเนื้อหาข้อเสนอ หรือเพิ่ม `skills.workshop.maxSkillBytes`                                                                                                                                               |
| `Target skill changed after proposal creation` | แก้ไขข้อเสนอให้ตรงกับเป้าหมายปัจจุบัน หรือสร้างข้อเสนอใหม่                                                                                                                                                |
| `Proposal scan failed`                         | ตรวจสอบผลการค้นพบของสแกนเนอร์ แล้วแก้ไขหรือกักกันข้อเสนอ                                                                                                                                                  |
| `untrusted symlink target`                     | กำหนดค่า `skills.load.allowSymlinkTargets` และเปิดใช้ `skills.workshop.allowSymlinkTargetWrites` เฉพาะสำหรับรากทักษะที่ใช้ร่วมกันโดยเจตนาเท่านั้น                                                        |
| `Support file paths must be under one of...`   | ย้ายไฟล์สนับสนุนไว้ภายใต้ `assets/`, `examples/`, `references/`, `scripts/` หรือ `templates/`                                                                                                             |
| ข้อเสนอไม่แสดงในรายการ                         | ตรวจสอบเวิร์กสเปซ `--agent` ที่เลือกและ `OPENCLAW_STATE_DIR`                                                                                                                                              |
| Agent ไม่สามารถเรียก `skill_workshop`          | ตรวจสอบนโยบายเครื่องมือที่ใช้งานอยู่และโหมดการรัน `coding` รวมเครื่องมือนี้ไว้แล้ว; นโยบาย `tools.allow` ที่จำกัดต้องระบุเครื่องมือนี้อย่างชัดเจน และการรันแบบ sandbox ต้องใช้เซสชัน agent ฝั่งโฮสต์ปกติหรือ CLI |

## ที่เกี่ยวข้อง

- [Skills](/th/tools/skills) สำหรับลำดับการโหลด, ลำดับความสำคัญ และการมองเห็น
- [การสร้างทักษะ](/th/tools/creating-skills) สำหรับพื้นฐาน `SKILL.md`
  ที่เขียนด้วยมือ
- [การกำหนดค่า Skills](/th/tools/skills-config) สำหรับสคีมา `skills.workshop` ฉบับเต็ม
- [CLI ของ Skills](/th/cli/skills) สำหรับคำสั่ง `openclaw skills`
