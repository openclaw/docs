---
read_when:
    - คุณต้องการให้เอเจนต์แปลงการแก้ไขหรือขั้นตอนที่นำกลับมาใช้ซ้ำได้ให้เป็น Skills ของเวิร์กสเปซ
    - คุณกำลังกำหนดค่าหน่วยความจำทักษะเชิงกระบวนการ
    - คุณกำลังดีบักพฤติกรรมของเครื่องมือ skill_workshop
    - คุณกำลังตัดสินใจว่าจะเปิดใช้การสร้าง Skills อัตโนมัติหรือไม่
summary: การบันทึกขั้นตอนที่นำกลับมาใช้ซ้ำได้ในเชิงทดลองเป็น Skills ของเวิร์กสเปซ พร้อมการตรวจทาน การอนุมัติ การกักกัน และการรีเฟรช Skills แบบทันที
title: Plugin เวิร์กช็อปทักษะ
x-i18n:
    generated_at: "2026-05-07T13:24:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop เป็นฟีเจอร์**ทดลอง** ฟีเจอร์นี้ปิดใช้งานตามค่าเริ่มต้น heuristics สำหรับการจับข้อมูลและพรอมป์ของผู้ตรวจทานอาจเปลี่ยนระหว่างรุ่นได้ และควรใช้การเขียนอัตโนมัติเฉพาะใน workspace ที่เชื่อถือได้หลังจากตรวจสอบผลลัพธ์ในโหมด pending ก่อนเท่านั้น

Skill Workshop คือหน่วยความจำเชิงขั้นตอนสำหรับ Skills ใน workspace ช่วยให้ agent แปลง workflow ที่ใช้ซ้ำได้ การแก้ไขจากผู้ใช้ วิธีแก้ที่ได้มาด้วยความยากลำบาก และข้อผิดพลาดที่เกิดซ้ำ ให้เป็นไฟล์ `SKILL.md` ภายใต้:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

สิ่งนี้แตกต่างจากหน่วยความจำระยะยาว:

- **หน่วยความจำ** เก็บข้อเท็จจริง ความชอบ เอนทิตี และบริบทในอดีต
- **Skills** เก็บขั้นตอนที่ใช้ซ้ำได้ซึ่ง agent ควรทำตามในงานในอนาคต
- **Skill Workshop** เป็นสะพานจากรอบการทำงานที่มีประโยชน์ไปสู่ skill ของ workspace ที่คงทน พร้อมการตรวจสอบความปลอดภัยและการอนุมัติแบบเลือกได้

Skill Workshop มีประโยชน์เมื่อ agent เรียนรู้ขั้นตอน เช่น:

- วิธีตรวจสอบ asset GIF แบบเคลื่อนไหวที่มาจากแหล่งภายนอก
- วิธีแทนที่ asset ภาพหน้าจอและตรวจสอบขนาด
- วิธีเรียกใช้สถานการณ์ QA เฉพาะ repo
- วิธีดีบักความล้มเหลวของ provider ที่เกิดซ้ำ
- วิธีซ่อมบันทึก workflow ในเครื่องที่ล้าสมัย

ไม่ได้มีไว้สำหรับ:

- ข้อเท็จจริงอย่าง “ผู้ใช้ชอบสีน้ำเงิน”
- หน่วยความจำอัตชีวประวัติแบบกว้าง
- การเก็บถาวร transcript ดิบ
- secret, credential หรือข้อความพรอมป์ที่ซ่อนอยู่
- คำสั่งแบบใช้ครั้งเดียวที่ไม่เกิดซ้ำ

## สถานะเริ่มต้น

Plugin ที่มาพร้อมระบบเป็นฟีเจอร์**ทดลอง**และ**ปิดใช้งานตามค่าเริ่มต้น** เว้นแต่จะเปิดใช้อย่างชัดเจนใน `plugins.entries.skill-workshop`

manifest ของ Plugin ไม่ได้ตั้งค่า `enabledByDefault: true` ค่าเริ่มต้น `enabled: true` ภายใน schema config ของ Plugin จะมีผลเฉพาะหลังจากเลือกและโหลด entry ของ Plugin แล้วเท่านั้น

ทดลองหมายความว่า:

- Plugin ได้รับการรองรับมากพอสำหรับการทดสอบแบบ opt-in และการใช้งานภายใน
- พื้นที่จัดเก็บ proposal, threshold ของผู้ตรวจทาน และ heuristics สำหรับการจับข้อมูลสามารถพัฒนาเปลี่ยนแปลงได้
- การอนุมัติแบบ pending เป็นโหมดเริ่มต้นที่แนะนำ
- auto apply มีไว้สำหรับการตั้งค่าส่วนตัวหรือ workspace ที่เชื่อถือได้ ไม่ใช่สภาพแวดล้อมที่ใช้ร่วมกันหรือมี input จำนวนมากที่ไม่น่าเชื่อถือ

## เปิดใช้งาน

config ขั้นต่ำที่ปลอดภัย:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

ด้วย config นี้:

- เครื่องมือ `skill_workshop` พร้อมใช้งาน
- การแก้ไขที่ใช้ซ้ำได้อย่างชัดเจนจะถูกจัดคิวเป็น proposal แบบ pending
- การตรวจทานตาม threshold สามารถเสนอการอัปเดต skill ได้
- จะไม่มีการเขียนไฟล์ skill จนกว่า proposal แบบ pending จะถูกนำไปใช้

ใช้การเขียนอัตโนมัติเฉพาะใน workspace ที่เชื่อถือได้:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` ยังคงใช้ scanner และเส้นทาง quarantine เดียวกัน โดยจะไม่นำ proposal ที่มี finding ระดับ critical ไปใช้

## การกำหนดค่า

| Key                  | ค่าเริ่มต้น | ช่วง / ค่า                                   | ความหมาย                                                               |
| -------------------- | ----------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | เปิดใช้ Plugin หลังจากโหลด entry ของ Plugin แล้ว                      |
| `autoCapture`        | `true`      | boolean                                     | เปิดใช้การจับข้อมูล/ตรวจทานหลังจบรอบเมื่อ agent ทำงานสำเร็จ          |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | จัดคิว proposal หรือเขียน proposal ที่ปลอดภัยโดยอัตโนมัติ             |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | เลือกการจับการแก้ไขที่ชัดเจน ผู้ตรวจทาน LLM ทั้งสองอย่าง หรือไม่ใช้เลย |
| `reviewInterval`     | `15`        | `1..200`                                    | เรียกใช้ผู้ตรวจทานหลังจากรอบที่สำเร็จจำนวนเท่านี้                    |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | เรียกใช้ผู้ตรวจทานหลังจากพบการเรียก tool จำนวนเท่านี้                 |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | timeout สำหรับการเรียกใช้ผู้ตรวจทานแบบฝังตัว                          |
| `maxPending`         | `50`        | `1..200`                                    | จำนวน proposal แบบ pending/quarantined สูงสุดที่เก็บไว้ต่อ workspace  |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | ขนาดไฟล์ skill/support ที่สร้างได้สูงสุด                              |

โปรไฟล์ที่แนะนำ:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## เส้นทางการจับข้อมูล

Skill Workshop มีเส้นทางการจับข้อมูลสามแบบ

### คำแนะนำจากเครื่องมือ

โมเดลสามารถเรียก `skill_workshop` ได้โดยตรงเมื่อพบขั้นตอนที่ใช้ซ้ำได้ หรือเมื่อผู้ใช้ขอให้บันทึก/อัปเดต skill

นี่คือเส้นทางที่ชัดเจนที่สุดและทำงานได้แม้ใช้ `autoCapture: false`

### การจับข้อมูลด้วย heuristic

เมื่อเปิดใช้ `autoCapture` และ `reviewMode` เป็น `heuristic` หรือ `hybrid` Plugin จะสแกนรอบที่สำเร็จเพื่อหาวลีการแก้ไขจากผู้ใช้ที่ชัดเจน:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

heuristic จะสร้าง proposal จากคำสั่งผู้ใช้ล่าสุดที่ตรงกัน โดยใช้ hint ของหัวข้อเพื่อเลือกชื่อ skill สำหรับ workflow ทั่วไป:

- งาน GIF แบบเคลื่อนไหว -> `animated-gif-workflow`
- งานภาพหน้าจอหรือ asset -> `screenshot-asset-workflow`
- งาน QA หรือสถานการณ์ -> `qa-scenario-workflow`
- งาน GitHub PR -> `github-pr-workflow`
- fallback -> `learned-workflows`

การจับข้อมูลด้วย heuristic ตั้งใจให้มีขอบเขตแคบ มีไว้สำหรับการแก้ไขที่ชัดเจนและบันทึกกระบวนการที่ทำซ้ำได้ ไม่ใช่สำหรับการสรุป transcript ทั่วไป

### ผู้ตรวจทาน LLM

เมื่อเปิดใช้ `autoCapture` และ `reviewMode` เป็น `llm` หรือ `hybrid` Plugin จะเรียกใช้ผู้ตรวจทานแบบฝังตัวที่กระชับหลังจากถึง threshold

ผู้ตรวจทานจะได้รับ:

- ข้อความ transcript ล่าสุด จำกัดไว้ที่ 12,000 อักขระสุดท้าย
- Skills ของ workspace ที่มีอยู่สูงสุด 12 รายการ
- อักขระสูงสุด 2,000 ตัวจากแต่ละ skill ที่มีอยู่
- คำสั่งแบบ JSON เท่านั้น

ผู้ตรวจทานไม่มีเครื่องมือ:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

ผู้ตรวจทานจะคืนค่าเป็น `{ "action": "none" }` หรือ proposal หนึ่งรายการ ฟิลด์ `action` คือ `create`, `append` หรือ `replace` - ควรใช้ `append`/`replace` เมื่อมี skill ที่เกี่ยวข้องอยู่แล้ว ใช้ `create` เฉพาะเมื่อไม่มี skill ที่มีอยู่ที่เหมาะสม

ตัวอย่าง `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` จะเพิ่ม `section` + `body` ส่วน `replace` จะแทนที่ `oldText` ด้วย `newText` ใน skill ที่ระบุชื่อ

## วงจรชีวิตของ proposal

การอัปเดตที่สร้างขึ้นทุกครั้งจะกลายเป็น proposal พร้อมด้วย:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` แบบเลือกได้
- `sessionId` แบบเลือกได้
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` หรือ `reviewer`
- `status`
- `change`
- `scanFindings` แบบเลือกได้
- `quarantineReason` แบบเลือกได้

สถานะของ proposal:

- `pending` - รอการอนุมัติ
- `applied` - เขียนไปยัง `<workspace>/skills`
- `rejected` - ถูกปฏิเสธโดย operator/model
- `quarantined` - ถูกบล็อกโดย finding ระดับ critical จาก scanner

สถานะถูกจัดเก็บแยกตามพื้นที่ทำงานภายใต้ไดเรกทอรีสถานะของ Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

ข้อเสนอที่รอดำเนินการและถูกกักกันจะถูกลบรายการซ้ำตามชื่อ Skills และเพย์โหลดการเปลี่ยนแปลง ที่เก็บจะเก็บข้อเสนอที่รอดำเนินการ/ถูกกักกันที่ใหม่ที่สุดไว้สูงสุดไม่เกิน
`maxPending`

## ข้อมูลอ้างอิงเครื่องมือ

Plugin ลงทะเบียนเครื่องมือตัวแทนหนึ่งรายการ:

```text
skill_workshop
```

### `status`

นับข้อเสนอตามสถานะสำหรับพื้นที่ทำงานที่ใช้งานอยู่

```json
{ "action": "status" }
```

รูปแบบผลลัพธ์:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

แสดงรายการข้อเสนอที่รอดำเนินการ

```json
{ "action": "list_pending" }
```

หากต้องการแสดงรายการสถานะอื่น:

```json
{ "action": "list_pending", "status": "applied" }
```

ค่า `status` ที่ใช้ได้:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

แสดงรายการข้อเสนอที่ถูกกักกัน

```json
{ "action": "list_quarantine" }
```

ใช้สิ่งนี้เมื่อการจับภาพอัตโนมัติดูเหมือนไม่ทำอะไรเลย และบันทึกกล่าวถึง
`skill-workshop: quarantined <skill>`

### `inspect`

ดึงข้อเสนอตาม id

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

สร้างข้อเสนอ เมื่อใช้ `approvalPolicy: "pending"` (ค่าเริ่มต้น) รายการนี้จะเข้าคิวแทนการเขียน

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Request immediate write in auto mode (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

เมื่อใช้ `approvalPolicy: "pending"` แม้ `apply: true` ก็ยังเข้าคิวข้อเสนอ ตรวจสอบก่อน แล้วจึงใช้
การดำเนินการ `apply` หลังได้รับการอนุมัติ

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Append to a named section">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Replace exact text">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

ใช้ข้อเสนอที่รอดำเนินการ

เมื่อใช้ `approvalPolicy: "pending"` การดำเนินการนี้จะขอการอนุมัติจากผู้ปฏิบัติงานก่อนเขียน
Skills ของพื้นที่ทำงาน

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` จะปฏิเสธข้อเสนอที่ถูกกักกัน:

```text
quarantined proposal cannot be applied
```

### `reject`

ทำเครื่องหมายข้อเสนอว่าถูกปฏิเสธ

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

เขียนไฟล์สนับสนุนภายในไดเรกทอรี Skills ที่มีอยู่หรือที่เสนอ

ไดเรกทอรีสนับสนุนระดับบนสุดที่อนุญาต:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

ตัวอย่าง:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

ไฟล์สนับสนุนมีขอบเขตตามเวิร์กสเปซ ตรวจสอบพาธ จำกัดไบต์ด้วย
`maxSkillBytes` สแกน และเขียนแบบอะตอมมิก

## การเขียน Skill

Skill Workshop เขียนเฉพาะภายใต้:

```text
<workspace>/skills/<normalized-skill-name>/
```

ชื่อ Skill จะถูกทำให้อยู่ในรูปแบบมาตรฐาน:

- แปลงเป็นตัวพิมพ์เล็ก
- ช่วงของอักขระที่ไม่ใช่ `[a-z0-9_-]` จะกลายเป็น `-`
- อักขระที่ไม่ใช่ตัวอักษรและตัวเลขที่ต้น/ท้ายจะถูกลบออก
- ความยาวสูงสุดคือ 80 อักขระ
- ชื่อสุดท้ายต้องตรงกับ `[a-z0-9][a-z0-9_-]{1,79}`

สำหรับ `create`:

- หาก Skill ยังไม่มีอยู่ Skill Workshop จะเขียน `SKILL.md` ใหม่
- หากมีอยู่แล้ว Skill Workshop จะต่อท้ายเนื้อหาไปที่ `## Workflow`

สำหรับ `append`:

- หาก Skill มีอยู่ Skill Workshop จะต่อท้ายในส่วนที่ร้องขอ
- หากไม่มีอยู่ Skill Workshop จะสร้าง Skill ขั้นต่ำแล้วต่อท้าย

สำหรับ `replace`:

- Skill ต้องมีอยู่แล้ว
- ต้องมี `oldText` อยู่ตรงกันแบบสมบูรณ์
- แทนที่เฉพาะรายการแรกที่ตรงกันแบบสมบูรณ์เท่านั้น

การเขียนทั้งหมดเป็นแบบอะตอมมิกและรีเฟรชสแนปช็อต Skills ในหน่วยความจำทันที เพื่อให้
Skill ใหม่หรือที่อัปเดตแล้วสามารถมองเห็นได้โดยไม่ต้องรีสตาร์ท Gateway

## โมเดลความปลอดภัย

Skill Workshop มีตัวสแกนความปลอดภัยสำหรับเนื้อหา `SKILL.md` และไฟล์สนับสนุน
ที่สร้างขึ้น

ผลการตรวจพบระดับวิกฤตจะกักกันข้อเสนอ:

| รหัสกฎ                                | บล็อกเนื้อหาที่...                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | บอกให้เอเจนต์ละเว้นคำสั่งก่อนหน้า/คำสั่งที่มีลำดับสูงกว่า                   |
| `prompt-injection-system`              | อ้างถึงพรอมป์ระบบ ข้อความนักพัฒนา หรือคำสั่งที่ซ่อนอยู่ |
| `prompt-injection-tool`                | สนับสนุนให้เลี่ยงสิทธิ์/การอนุมัติของเครื่องมือ                         |
| `shell-pipe-to-shell`                  | รวม `curl`/`wget` ที่ไพป์เข้า `sh`, `bash`, หรือ `zsh`              |
| `secret-exfiltration`                  | ดูเหมือนส่งข้อมูล env/process env ผ่านเครือข่าย                 |

ผลการเตือนจะถูกเก็บไว้ แต่ไม่บล็อกด้วยตัวเอง:

| รหัสกฎ              | เตือนเมื่อ...                      |
| -------------------- | -------------------------------- |
| `destructive-delete` | คำสั่งลักษณะ `rm -rf` แบบกว้าง    |
| `unsafe-permissions` | การใช้สิทธิ์ลักษณะ `chmod 777` |

ข้อเสนอที่ถูกกักกัน:

- เก็บ `scanFindings`
- เก็บ `quarantineReason`
- ปรากฏใน `list_quarantine`
- ไม่สามารถนำไปใช้ผ่าน `apply`

ในการกู้คืนจากข้อเสนอที่ถูกกักกัน ให้สร้างข้อเสนอใหม่ที่ปลอดภัยโดยลบ
เนื้อหาที่ไม่ปลอดภัยออก อย่าแก้ไข JSON ของสโตร์ด้วยมือ

## แนวทางพรอมป์

เมื่อเปิดใช้งาน Skill Workshop จะแทรกส่วนพรอมป์สั้นๆ ที่บอกเอเจนต์
ให้ใช้ `skill_workshop` สำหรับหน่วยความจำขั้นตอนที่คงทน

แนวทางนี้เน้น:

- ขั้นตอน ไม่ใช่ข้อเท็จจริง/ความชอบ
- การแก้ไขจากผู้ใช้
- ขั้นตอนที่สำเร็จซึ่งไม่ชัดเจน
- ข้อผิดพลาดที่เกิดซ้ำ
- การซ่อม Skill ที่ล้าสมัย/บาง/ผิด ผ่าน append/replace
- การบันทึกขั้นตอนที่นำกลับมาใช้ได้หลังจากลูปเครื่องมือยาวๆ หรือการแก้ไขที่ยาก
- ข้อความ Skill แบบคำสั่งสั้นๆ
- ไม่มีการดัมป์ทรานสคริปต์

ข้อความโหมดการเขียนจะเปลี่ยนตาม `approvalPolicy`:

- โหมด pending: เข้าคิวคำแนะนำ ใช้ `apply` หลังได้รับการอนุมัติอย่างชัดเจน
- โหมด auto: นำการอัปเดต workspace-skill ที่ปลอดภัยไปใช้ เว้นแต่ `apply: false` จะเข้าคิวแทน

## ค่าใช้จ่ายและพฤติกรรมรันไทม์

การจับข้อมูลแบบฮิวริสติกไม่เรียกใช้โมเดล

การตรวจทานด้วย LLM ใช้การรันแบบฝังบนโมเดลเอเจนต์ที่ใช้งานอยู่/ค่าเริ่มต้น เป็นแบบ
อิงเกณฑ์ ดังนั้นโดยค่าเริ่มต้นจะไม่รันทุกเทิร์น

ผู้ตรวจทาน:

- ใช้บริบท provider/model ที่กำหนดค่าเดียวกันเมื่อมี
- ถอยกลับไปใช้ค่าเริ่มต้นของเอเจนต์รันไทม์
- มี `reviewTimeoutMs`
- ใช้บริบทเริ่มต้นแบบเบา
- ไม่มีเครื่องมือ
- ไม่เขียนอะไรโดยตรง
- ทำได้เพียงปล่อยข้อเสนอที่ผ่านตัวสแกนปกติและเส้นทาง
  การอนุมัติ/กักกัน

หากผู้ตรวจทานล้มเหลว หมดเวลา หรือส่งคืน JSON ที่ไม่ถูกต้อง Plugin จะบันทึก
ข้อความ warning/debug และข้ามรอบการตรวจทานนั้น

## รูปแบบการใช้งาน

ใช้ Skill Workshop เมื่อผู้ใช้พูดว่า:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

ข้อความ Skill ที่ดี:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

ข้อความ Skill ที่ไม่ดี:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

เหตุผลที่ไม่ควรบันทึกเวอร์ชันที่ไม่ดี:

- มีรูปแบบเหมือนทรานสคริปต์
- ไม่ใช่คำสั่ง
- มีรายละเอียดเฉพาะครั้งที่เป็นเสียงรบกวน
- ไม่ได้บอกเอเจนต์ถัดไปว่าต้องทำอะไร

## การดีบัก

ตรวจสอบว่า Plugin โหลดอยู่หรือไม่:

```bash
openclaw plugins list --enabled
```

ตรวจสอบจำนวนข้อเสนอจากบริบทเอเจนต์/เครื่องมือ:

```json
{ "action": "status" }
```

ตรวจสอบข้อเสนอที่รอดำเนินการ:

```json
{ "action": "list_pending" }
```

ตรวจสอบข้อเสนอที่ถูกกักกัน:

```json
{ "action": "list_quarantine" }
```

อาการที่พบบ่อย:

| อาการ                               | สาเหตุที่เป็นไปได้                                                                        | ตรวจสอบ                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| เครื่องมือไม่พร้อมใช้งาน                   | รายการ Plugin ไม่ได้เปิดใช้งาน                                                         | `plugins.entries.skill-workshop.enabled` และ `openclaw plugins list` |
| ไม่มีข้อเสนออัตโนมัติปรากฏ         | `autoCapture: false`, `reviewMode: "off"`, หรือไม่ผ่านเกณฑ์                    | การกำหนดค่า สถานะข้อเสนอ บันทึก Gateway                                |
| ฮิวริสติกไม่ได้จับข้อมูล             | ถ้อยคำของผู้ใช้ไม่ตรงกับรูปแบบการแก้ไข                                      | ใช้ `skill_workshop.suggest` อย่างชัดเจน หรือเปิดใช้ผู้ตรวจทาน LLM         |
| ผู้ตรวจทานไม่ได้สร้างข้อเสนอ    | ผู้ตรวจทานส่งคืน `none`, JSON ไม่ถูกต้อง, หรือหมดเวลา                                | บันทึก Gateway, `reviewTimeoutMs`, เกณฑ์                          |
| ข้อเสนอไม่ถูกนำไปใช้               | `approvalPolicy: "pending"`                                                         | `list_pending` แล้วจึง `apply`                                         |
| ข้อเสนอหายไปจากรายการรอดำเนินการ     | ใช้ข้อเสนอซ้ำ ตัดรายการรอดำเนินการสูงสุด หรือถูกนำไปใช้/ปฏิเสธ/กักกันแล้ว | `status`, `list_pending` พร้อมตัวกรองสถานะ, `list_quarantine`      |
| มีไฟล์ Skill อยู่แต่โมเดลมองไม่เห็น | สแนปช็อต Skill ไม่ได้รีเฟรช หรือการ gating ของ Skill ตัดออก                            | สถานะ `openclaw skills` และสิทธิ์ของ workspace skill             |

บันทึกที่เกี่ยวข้อง:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## สถานการณ์ QA

สถานการณ์ QA ที่อิง repo:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

รันความครอบคลุมแบบกำหนดผลได้:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

รันความครอบคลุมของผู้ตรวจทาน:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

สถานการณ์ของผู้ตรวจทานถูกแยกไว้โดยตั้งใจ เพราะเปิดใช้งาน
`reviewMode: "llm"` และทดสอบรอบผู้ตรวจทานแบบฝัง

## เมื่อไม่ควรเปิดใช้งานการนำไปใช้อัตโนมัติ

หลีกเลี่ยง `approvalPolicy: "auto"` เมื่อ:

- เวิร์กสเปซมีขั้นตอนที่ละเอียดอ่อน
- เอเจนต์กำลังทำงานกับอินพุตที่ไม่น่าเชื่อถือ
- Skills ถูกแชร์ในทีมขนาดใหญ่
- คุณยังปรับพรอมป์หรือกฎสแกนเนอร์อยู่
- โมเดลจัดการเนื้อหาเว็บ/อีเมลที่เป็นภัยบ่อยครั้ง

ใช้โหมด pending ก่อน สลับเป็นโหมด auto เฉพาะหลังจากตรวจทานประเภทของ
Skills ที่เอเจนต์เสนอในเวิร์กสเปซนั้นแล้ว

## เอกสารที่เกี่ยวข้อง

- [Skills](/th/tools/skills)
- [Plugins](/th/tools/plugin)
- [การทดสอบ](/th/reference/test)
