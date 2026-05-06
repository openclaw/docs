---
read_when:
    - คุณต้องการให้เอเจนต์เปลี่ยนการแก้ไขหรือขั้นตอนที่นำกลับมาใช้ซ้ำได้ให้เป็น Skills ของเวิร์กสเปซ
    - คุณกำลังกำหนดค่าหน่วยความจำทักษะเชิงกระบวนการ
    - คุณกำลังดีบักลักษณะการทำงานของเครื่องมือ skill_workshop
    - คุณกำลังตัดสินใจว่าจะเปิดใช้งานการสร้างทักษะโดยอัตโนมัติหรือไม่
summary: การบันทึกขั้นตอนที่นำกลับมาใช้ซ้ำได้แบบทดลองเป็น Skills ของ workspace พร้อมการตรวจทาน การอนุมัติ การกักกัน และการรีเฟรช Skills แบบทันที
title: Plugin เวิร์กช็อป Skill
x-i18n:
    generated_at: "2026-05-06T09:26:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

เวิร์กช็อป Skills เป็นฟีเจอร์ **ทดลอง** โดยปิดใช้งานเป็นค่าเริ่มต้น ฮิวริสติกการจับข้อมูล
และพรอมป์ผู้ตรวจทานอาจเปลี่ยนแปลงระหว่างรุ่น และควรใช้การเขียนอัตโนมัติ
เฉพาะในพื้นที่ทำงานที่เชื่อถือได้ หลังจากตรวจทานเอาต์พุตโหมดรอดำเนินการ
ก่อนแล้วเท่านั้น.

เวิร์กช็อป Skills คือหน่วยความจำเชิงขั้นตอนสำหรับ Skills ของพื้นที่ทำงาน ซึ่งช่วยให้เอเจนต์เปลี่ยน
เวิร์กโฟลว์ที่ใช้ซ้ำได้ การแก้ไขจากผู้ใช้ วิธีแก้ปัญหาที่ได้มาอย่างยากลำบาก และข้อผิดพลาดที่เกิดซ้ำ
ให้เป็นไฟล์ `SKILL.md` ภายใต้:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

สิ่งนี้แตกต่างจากหน่วยความจำระยะยาว:

- **หน่วยความจำ** จัดเก็บข้อเท็จจริง ความชอบ เอนทิตี และบริบทที่ผ่านมา.
- **Skills** จัดเก็บขั้นตอนที่ใช้ซ้ำได้ซึ่งเอเจนต์ควรปฏิบัติตามในงานอนาคต.
- **เวิร์กช็อป Skills** เป็นสะพานจากรอบการทำงานที่มีประโยชน์ไปสู่ Skill ของพื้นที่ทำงาน
  ที่คงทน พร้อมการตรวจสอบความปลอดภัยและการอนุมัติแบบไม่บังคับ.

เวิร์กช็อป Skills มีประโยชน์เมื่อเอเจนต์เรียนรู้ขั้นตอน เช่น:

- วิธีตรวจสอบแอสเซ็ต GIF แบบเคลื่อนไหวที่มาจากแหล่งภายนอก
- วิธีแทนที่แอสเซ็ตภาพหน้าจอและตรวจสอบขนาด
- วิธีเรียกใช้สถานการณ์ QA เฉพาะของรีโพ
- วิธีดีบักความล้มเหลวของผู้ให้บริการที่เกิดซ้ำ
- วิธีซ่อมแซมบันทึกเวิร์กโฟลว์ภายในเครื่องที่ล้าสมัย

ไม่ได้ออกแบบมาสำหรับ:

- ข้อเท็จจริง เช่น "ผู้ใช้ชอบสีน้ำเงิน"
- หน่วยความจำอัตชีวประวัติแบบกว้าง
- การเก็บถาวรทรานสคริปต์ดิบ
- ความลับ ข้อมูลรับรอง หรือข้อความพรอมป์ที่ซ่อนอยู่
- คำสั่งแบบใช้ครั้งเดียวที่ไม่เกิดซ้ำ

## สถานะเริ่มต้น

Plugin ที่รวมมาเป็นฟีเจอร์ **ทดลอง** และ **ปิดใช้งานเป็นค่าเริ่มต้น** เว้นแต่จะ
เปิดใช้งานอย่างชัดเจนใน `plugins.entries.skill-workshop`.

แมนิเฟสต์ของ Plugin ไม่ได้ตั้งค่า `enabledByDefault: true` ค่าเริ่มต้น `enabled: true`
ภายในสคีมาการกำหนดค่าของ Plugin จะมีผลเฉพาะหลังจากเลือกและโหลดรายการ Plugin แล้วเท่านั้น.

ทดลอง หมายความว่า:

- Plugin ได้รับการสนับสนุนเพียงพอสำหรับการทดสอบแบบเลือกใช้และการใช้งานจริงภายใน
- การจัดเก็บข้อเสนอ เกณฑ์ผู้ตรวจทาน และฮิวริสติกการจับข้อมูลสามารถพัฒนาได้
- การอนุมัติแบบรอดำเนินการเป็นโหมดเริ่มต้นที่แนะนำ
- การใช้โดยอัตโนมัติเหมาะสำหรับการตั้งค่าส่วนบุคคล/พื้นที่ทำงานที่เชื่อถือได้ ไม่ใช่สภาพแวดล้อมแบบแชร์หรือเป็นปฏิปักษ์
  ที่มีอินพุตจำนวนมาก

## เปิดใช้งาน

การกำหนดค่าที่ปลอดภัยขั้นต่ำ:

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

ด้วยการกำหนดค่านี้:

- เครื่องมือ `skill_workshop` พร้อมใช้งาน
- การแก้ไขที่ใช้ซ้ำได้อย่างชัดเจนจะถูกจัดคิวเป็นข้อเสนอที่รอดำเนินการ
- รอบผ่านของผู้ตรวจทานตามเกณฑ์สามารถเสนอการอัปเดต Skill ได้
- ไม่มีการเขียนไฟล์ Skill จนกว่าจะนำข้อเสนอที่รอดำเนินการไปใช้

ใช้การเขียนอัตโนมัติเฉพาะในพื้นที่ทำงานที่เชื่อถือได้:

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

`approvalPolicy: "auto"` ยังคงใช้สแกนเนอร์และเส้นทางกักกันเดียวกัน โดย
จะไม่นำข้อเสนอที่มีผลการตรวจพบระดับวิกฤตไปใช้.

## การกำหนดค่า

| คีย์                  | ค่าเริ่มต้น     | ช่วง / ค่า                              | ความหมาย                                                              |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | บูลีน                                     | เปิดใช้งาน Plugin หลังจากโหลดรายการ Plugin แล้ว.                 |
| `autoCapture`        | `true`      | บูลีน                                     | เปิดใช้งานการจับข้อมูล/ตรวจทานหลังจบรอบการทำงานเมื่อเอเจนต์ทำงานสำเร็จ.          |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | จัดคิวข้อเสนอหรือเขียนข้อเสนอที่ปลอดภัยโดยอัตโนมัติ.               |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | เลือกการจับการแก้ไขอย่างชัดเจน ผู้ตรวจทาน LLM ทั้งสองอย่าง หรือไม่ใช้เลย. |
| `reviewInterval`     | `15`        | `1..200`                                    | เรียกใช้ผู้ตรวจทานหลังจากรอบการทำงานที่สำเร็จจำนวนนี้.                       |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | เรียกใช้ผู้ตรวจทานหลังจากสังเกตการเรียกใช้เครื่องมือจำนวนนี้.                    |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | ระยะหมดเวลาสำหรับการเรียกใช้ผู้ตรวจทานแบบฝัง.                               |
| `maxPending`         | `50`        | `1..200`                                    | จำนวนสูงสุดของข้อเสนอที่รอดำเนินการ/ถูกกักกันที่เก็บต่อพื้นที่ทำงาน.                |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | ขนาดสูงสุดของไฟล์ Skill/ไฟล์สนับสนุนที่สร้างขึ้น.                               |

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

เวิร์กช็อป Skills มีเส้นทางการจับข้อมูลสามแบบ.

### คำแนะนำจากเครื่องมือ

โมเดลสามารถเรียก `skill_workshop` โดยตรงเมื่อพบขั้นตอนที่ใช้ซ้ำได้
หรือเมื่อผู้ใช้ขอให้บันทึก/อัปเดต Skill.

นี่คือเส้นทางที่ชัดเจนที่สุดและทำงานได้แม้มี `autoCapture: false`.

### การจับข้อมูลด้วยฮิวริสติก

เมื่อเปิดใช้งาน `autoCapture` และ `reviewMode` เป็น `heuristic` หรือ `hybrid`
Plugin จะสแกนรอบการทำงานที่สำเร็จเพื่อหาวลีการแก้ไขจากผู้ใช้ที่ชัดเจน:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

ฮิวริสติกจะสร้างข้อเสนอจากคำสั่งผู้ใช้ล่าสุดที่ตรงกัน โดย
ใช้คำใบ้หัวข้อเพื่อเลือกชื่อ Skill สำหรับเวิร์กโฟลว์ทั่วไป:

- งาน GIF แบบเคลื่อนไหว -> `animated-gif-workflow`
- งานภาพหน้าจอหรือแอสเซ็ต -> `screenshot-asset-workflow`
- งาน QA หรือสถานการณ์ -> `qa-scenario-workflow`
- งาน GitHub PR -> `github-pr-workflow`
- ทางเลือกสำรอง -> `learned-workflows`

การจับข้อมูลด้วยฮิวริสติกถูกตั้งใจให้แคบ เหมาะสำหรับการแก้ไขที่ชัดเจนและ
บันทึกกระบวนการที่ทำซ้ำได้ ไม่ใช่สำหรับการสรุปทรานสคริปต์ทั่วไป.

### ผู้ตรวจทาน LLM

เมื่อเปิดใช้งาน `autoCapture` และ `reviewMode` เป็น `llm` หรือ `hybrid` Plugin
จะเรียกใช้ผู้ตรวจทานแบบฝังขนาดกะทัดรัดหลังจากถึงเกณฑ์.

ผู้ตรวจทานได้รับ:

- ข้อความทรานสคริปต์ล่าสุด โดยจำกัดที่ 12,000 อักขระล่าสุด
- Skills ของพื้นที่ทำงานที่มีอยู่สูงสุด 12 รายการ
- สูงสุด 2,000 อักขระจาก Skill ที่มีอยู่แต่ละรายการ
- คำสั่งแบบ JSON เท่านั้น

ผู้ตรวจทานไม่มีเครื่องมือ:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

ผู้ตรวจทานจะส่งคืน `{ "action": "none" }` หรือข้อเสนอหนึ่งรายการ ฟิลด์ `action` คือ `create`, `append` หรือ `replace` - ควรเลือก `append`/`replace` เมื่อมี Skill ที่เกี่ยวข้องอยู่แล้ว ใช้ `create` เฉพาะเมื่อไม่มี Skill ที่มีอยู่เหมาะสม.

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

`append` เพิ่ม `section` + `body` ส่วน `replace` สลับ `oldText` เป็น `newText` ใน Skill ที่ระบุชื่อ.

## วงจรชีวิตของข้อเสนอ

ทุกการอัปเดตที่สร้างขึ้นจะกลายเป็นข้อเสนอที่มี:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` แบบไม่บังคับ
- `sessionId` แบบไม่บังคับ
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` หรือ `reviewer`
- `status`
- `change`
- `scanFindings` แบบไม่บังคับ
- `quarantineReason` แบบไม่บังคับ

สถานะข้อเสนอ:

- `pending` - รอการอนุมัติ
- `applied` - เขียนไปยัง `<workspace>/skills` แล้ว
- `rejected` - ถูกปฏิเสธโดยผู้ปฏิบัติงาน/โมเดล
- `quarantined` - ถูกบล็อกโดยผลการตรวจพบระดับวิกฤตของสแกนเนอร์

สถานะถูกจัดเก็บแยกตาม workspace ภายใต้ไดเรกทอรีสถานะของ Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

ข้อเสนอที่รอดำเนินการและถูกกักกันจะถูกลบรายการซ้ำตามชื่อ skill และ payload
การเปลี่ยนแปลง store จะเก็บข้อเสนอที่รอดำเนินการ/ถูกกักกันล่าสุดได้สูงสุดถึง
`maxPending`

## เอกสารอ้างอิงเครื่องมือ

Plugin ลงทะเบียนเครื่องมือ agent หนึ่งรายการ:

```text
skill_workshop
```

### `status`

นับข้อเสนอตามสถานะสำหรับ workspace ที่ใช้งานอยู่

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

ใช้รายการนี้เมื่อการจับอัตโนมัติดูเหมือนไม่ทำงาน และบันทึกกล่าวถึง
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
  <Accordion title="Force a safe write (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

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

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` ปฏิเสธข้อเสนอที่ถูกกักกัน:

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

เขียนไฟล์สนับสนุนภายในไดเรกทอรี skill ที่มีอยู่แล้วหรือถูกเสนอ

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

ไฟล์สนับสนุนมีขอบเขตตาม workspace, ตรวจสอบ path แล้ว, จำกัด byte ด้วย
`maxSkillBytes`, ถูกสแกน และเขียนแบบอะตอมมิก

## การเขียน Skill

Skill Workshop เขียนเฉพาะภายใต้:

```text
<workspace>/skills/<normalized-skill-name>/
```

ชื่อ Skill จะถูกทำให้เป็นมาตรฐาน:

- แปลงเป็นตัวพิมพ์เล็ก
- ชุดอักขระที่ไม่ใช่ `[a-z0-9_-]` จะกลายเป็น `-`
- ลบอักขระที่ไม่ใช่ตัวอักษรและตัวเลขที่อยู่ต้น/ท้าย
- ความยาวสูงสุดคือ 80 อักขระ
- ชื่อสุดท้ายต้องตรงกับ `[a-z0-9][a-z0-9_-]{1,79}`

สำหรับ `create`:

- หาก Skill ไม่มีอยู่ Skill Workshop จะเขียน `SKILL.md` ใหม่
- หากมีอยู่แล้ว Skill Workshop จะผนวก body ต่อท้าย `## Workflow`

สำหรับ `append`:

- หาก Skill มีอยู่ Skill Workshop จะผนวกเข้ากับ section ที่ร้องขอ
- หากไม่มีอยู่ Skill Workshop จะสร้าง Skill ขั้นต่ำแล้วจึงผนวก

สำหรับ `replace`:

- Skill ต้องมีอยู่แล้ว
- ต้องมี `oldText` อยู่ตรงกันทุกประการ
- แทนที่เฉพาะรายการแรกที่ตรงกันทุกประการเท่านั้น

การเขียนทั้งหมดเป็นแบบอะตอมมิกและรีเฟรช snapshot ของ Skills ในหน่วยความจำทันที ดังนั้น
Skill ใหม่หรือที่อัปเดตแล้วจึงสามารถปรากฏให้เห็นได้โดยไม่ต้องรีสตาร์ท Gateway

## โมเดลความปลอดภัย

Skill Workshop มีตัวสแกนความปลอดภัยสำหรับเนื้อหา `SKILL.md` ที่สร้างขึ้นและไฟล์สนับสนุน

ข้อค้นพบระดับวิกฤตจะกักกัน proposal:

| Rule id                                | บล็อกเนื้อหาที่...                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | บอก agent ให้เพิกเฉยต่อคำสั่งก่อนหน้าหรือคำสั่งลำดับสูงกว่า                   |
| `prompt-injection-system`              | อ้างถึง system prompts, developer messages หรือคำสั่งที่ซ่อนอยู่ |
| `prompt-injection-tool`                | สนับสนุนการเลี่ยง permission/approval ของเครื่องมือ                         |
| `shell-pipe-to-shell`                  | มี `curl`/`wget` ที่ pipe เข้า `sh`, `bash` หรือ `zsh`              |
| `secret-exfiltration`                  | ดูเหมือนส่งข้อมูล env/process env ผ่านเครือข่าย                 |

ข้อค้นพบระดับเตือนจะถูกเก็บไว้แต่ไม่ได้บล็อกด้วยตัวเอง:

| Rule id              | เตือนเมื่อ...                      |
| -------------------- | -------------------------------- |
| `destructive-delete` | คำสั่งแบบ `rm -rf` ที่กว้างเกินไป    |
| `unsafe-permissions` | การใช้ permission แบบ `chmod 777` |

Proposal ที่ถูกกักกัน:

- เก็บ `scanFindings`
- เก็บ `quarantineReason`
- ปรากฏใน `list_quarantine`
- ไม่สามารถนำไปใช้ผ่าน `apply`

หากต้องการกู้คืนจาก proposal ที่ถูกกักกัน ให้สร้าง proposal ใหม่ที่ปลอดภัยโดยลบ
เนื้อหาที่ไม่ปลอดภัยออก อย่าแก้ไข JSON ของ store ด้วยมือ

## คำแนะนำสำหรับ prompt

เมื่อเปิดใช้งาน Skill Workshop จะฉีด section prompt สั้น ๆ ที่บอก agent
ให้ใช้ `skill_workshop` สำหรับ procedural memory ที่คงทน

คำแนะนำจะเน้น:

- ขั้นตอน ไม่ใช่ข้อเท็จจริง/ความชอบ
- การแก้ไขจากผู้ใช้
- ขั้นตอนที่สำเร็จและไม่ชัดเจน
- จุดผิดพลาดที่เกิดซ้ำ
- การซ่อม Skill ที่ล้าสมัย/บาง/ผิดผ่าน append/replace
- การบันทึกขั้นตอนที่ใช้ซ้ำได้หลังจาก tool loop ยาว ๆ หรือการแก้ปัญหายาก
- ข้อความ Skill แบบคำสั่งสั้น ๆ
- ไม่มีการ dump transcript

ข้อความโหมดการเขียนจะเปลี่ยนตาม `approvalPolicy`:

- โหมด pending: เข้าคิวข้อเสนอแนะ; apply เฉพาะหลังจากได้รับ approval อย่างชัดเจน
- โหมด auto: apply การอัปเดต workspace-skill ที่ปลอดภัยเมื่อเห็นชัดว่านำกลับมาใช้ซ้ำได้

## ค่าใช้จ่ายและพฤติกรรมขณะทำงาน

Heuristic capture ไม่เรียก model

LLM review ใช้ embedded run บน model ของ agent ที่ active/default โดยเป็นแบบ
threshold-based จึงไม่ได้รันทุก turn ตามค่าเริ่มต้น

Reviewer:

- ใช้ context ของ provider/model ที่ตั้งค่าเดียวกันเมื่อมี
- fallback ไปยังค่าเริ่มต้นของ runtime agent
- มี `reviewTimeoutMs`
- ใช้ bootstrap context แบบเบา
- ไม่มี tools
- ไม่เขียนสิ่งใดโดยตรง
- ทำได้เพียง emit proposal ที่ผ่านเส้นทาง scanner และ
  approval/quarantine ปกติ

หาก reviewer ล้มเหลว, timeout หรือคืนค่า JSON ที่ไม่ถูกต้อง Plugin จะบันทึก
ข้อความ warning/debug และข้าม review pass นั้น

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

- มีรูปแบบเหมือน transcript
- ไม่ใช่รูปแบบคำสั่ง
- มีรายละเอียดเฉพาะครั้งที่เป็น noise
- ไม่ได้บอก agent ถัดไปว่าต้องทำอะไร

## การดีบัก

ตรวจสอบว่า Plugin โหลดแล้วหรือไม่:

```bash
openclaw plugins list --enabled
```

ตรวจสอบจำนวน proposal จาก context ของ agent/tool:

```json
{ "action": "status" }
```

ตรวจสอบ proposal ที่รออยู่:

```json
{ "action": "list_pending" }
```

ตรวจสอบ proposal ที่ถูกกักกัน:

```json
{ "action": "list_quarantine" }
```

อาการที่พบบ่อย:

| อาการ                               | สาเหตุที่เป็นไปได้                                                                        | ตรวจสอบ                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ไม่มี tool ให้ใช้งาน                   | รายการ Plugin ไม่ได้เปิดใช้งาน                                                         | `plugins.entries.skill-workshop.enabled` และ `openclaw plugins list` |
| ไม่มี proposal อัตโนมัติปรากฏ         | `autoCapture: false`, `reviewMode: "off"` หรือไม่ถึง threshold                    | Config, สถานะ proposal, log ของ Gateway                                |
| Heuristic ไม่ capture             | ถ้อยคำของผู้ใช้ไม่ตรงกับ pattern การแก้ไข                                      | ใช้ `skill_workshop.suggest` อย่างชัดเจนหรือเปิดใช้งาน LLM reviewer         |
| Reviewer ไม่สร้าง proposal    | Reviewer คืนค่า `none`, JSON ไม่ถูกต้อง หรือ timeout                                | log ของ Gateway, `reviewTimeoutMs`, threshold                          |
| Proposal ไม่ถูก apply               | `approvalPolicy: "pending"`                                                         | `list_pending` แล้วจึง `apply`                                         |
| Proposal หายไปจาก pending     | ใช้ proposal ซ้ำ, pruning เพราะ pending เกินค่าสูงสุด หรือถูก apply/reject/quarantine แล้ว | `status`, `list_pending` พร้อมตัวกรองสถานะ, `list_quarantine`      |
| มีไฟล์ Skill แต่ model มองไม่เห็น | snapshot ของ Skill ไม่ได้รีเฟรช หรือ skill gating ตัดออก                            | สถานะ `openclaw skills` และ eligibility ของ workspace skill             |

Log ที่เกี่ยวข้อง:

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

รัน coverage แบบ deterministic:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

รัน reviewer coverage:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

สถานการณ์ reviewer ถูกแยกไว้โดยเจตนา เพราะเปิดใช้งาน
`reviewMode: "llm"` และทดสอบ embedded reviewer pass

## เมื่อไม่ควรเปิดใช้งาน auto apply

หลีกเลี่ยง `approvalPolicy: "auto"` เมื่อ:

- workspace มีขั้นตอนที่ละเอียดอ่อน
- agent กำลังทำงานกับ input ที่ไม่น่าเชื่อถือ
- Skills ถูกแชร์ในทีมขนาดใหญ่
- คุณยังปรับ prompt หรือกฎ scanner อยู่
- model จัดการเนื้อหาเว็บ/อีเมลที่เป็นอันตรายอยู่บ่อยครั้ง

ใช้โหมด pending ก่อน เปลี่ยนเป็นโหมด auto เฉพาะหลังจากตรวจสอบประเภทของ
Skills ที่ agent เสนอใน workspace นั้นแล้ว

## เอกสารที่เกี่ยวข้อง

- [Skills](/th/tools/skills)
- [Plugins](/th/tools/plugin)
- [การทดสอบ](/th/reference/test)
