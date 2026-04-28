---
read_when:
- You want agents to turn corrections or reusable procedures into workspace skills
- คุณกำลังกำหนดค่าหน่วยความจำเชิงขั้นตอนของ Skills
- คุณกำลังดีบักพฤติกรรมของเครื่องมือ `skill_workshop`
- คุณกำลังตัดสินใจว่าจะเปิดใช้การสร้าง Skills อัตโนมัติหรือไม่
summary: การบันทึกขั้นตอนที่นำกลับมาใช้ซ้ำได้แบบทดลองเป็น Skills ใน workspace พร้อมการตรวจทาน,
  การอนุมัติ, การกักกัน และการรีเฟรช Skill แบบทันที
title: Plugin เวิร์กช็อป Skills
x-i18n:
  generated_at: '2026-04-24T09:26:32Z'
  model: gpt-5.4
  provider: openai
  source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
  source_path: plugins/skill-workshop.md
  workflow: 15
---

Skill Workshop เป็นฟีเจอร์ **experimental** โดยปิดใช้งานตามค่าเริ่มต้น heuristics สำหรับการ capture
และ reviewer prompts อาจเปลี่ยนได้ระหว่างแต่ละรุ่น และการเขียนอัตโนมัติควรถูกใช้เฉพาะใน workspaces ที่เชื่อถือได้เท่านั้น หลังจากตรวจสอบเอาต์พุตในโหมด pending ก่อนแล้ว

Skill Workshop คือหน่วยความจำเชิงขั้นตอนสำหรับ Skills ใน workspace มันช่วยให้เอเจนต์เปลี่ยน
เวิร์กโฟลว์ที่นำกลับมาใช้ซ้ำได้, การแก้ไขจากผู้ใช้, วิธีแก้ปัญหาที่ได้มายาก และปัญหาที่เกิดซ้ำ
ให้กลายเป็นไฟล์ `SKILL.md` ภายใต้:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

สิ่งนี้แตกต่างจากหน่วยความจำระยะยาว:

- **Memory** เก็บข้อเท็จจริง, ความชอบ, entities และบริบทในอดีต
- **Skills** เก็บขั้นตอนที่นำกลับมาใช้ซ้ำได้ซึ่งเอเจนต์ควรทำตามในงานถัดไป
- **Skill Workshop** คือสะพานจากเทิร์นที่มีประโยชน์ไปสู่ workspace skill แบบถาวร
  พร้อมการตรวจสอบด้านความปลอดภัยและการอนุมัติแบบไม่บังคับ

Skill Workshop มีประโยชน์เมื่อเอเจนต์เรียนรู้ขั้นตอน เช่น:

- วิธีตรวจสอบความถูกต้องของ animated GIF assets จากภายนอก
- วิธีแทนที่ screenshot assets และตรวจสอบขนาด
- วิธีรัน QA scenario แบบเฉพาะรีโป
- วิธีดีบัก provider failure ที่เกิดซ้ำ
- วิธีซ่อม workflow note แบบโลคัลที่ล้าสมัย

ไม่ได้มีไว้สำหรับ:

- ข้อเท็จจริงอย่าง “ผู้ใช้ชอบสีน้ำเงิน”
- หน่วยความจำเชิงอัตชีวประวัติแบบกว้าง
- การเก็บ transcript แบบดิบ
- secrets, credentials หรือข้อความ prompt ที่ซ่อนอยู่
- คำสั่งใช้ครั้งเดียวที่ไม่น่าจะเกิดซ้ำ

## สถานะเริ่มต้น

bundled plugin นี้เป็นแบบ **experimental** และ **ปิดใช้งานตามค่าเริ่มต้น** เว้นแต่จะมี
การเปิดใช้งานอย่างชัดเจนใน `plugins.entries.skill-workshop`

manifest ของ Plugin ไม่ได้ตั้ง `enabledByDefault: true` ค่าเริ่มต้น `enabled: true`
ภายใน config schema ของ Plugin จะมีผลก็ต่อเมื่อ plugin entry นั้น
ถูกเลือกและโหลดแล้วเท่านั้น

Experimental หมายความว่า:

- plugin ได้รับการรองรับมากพอสำหรับการทดสอบและ dogfooding แบบ opt-in
- ที่เก็บ proposals, thresholds ของ reviewer และ heuristics การ capture อาจพัฒนาเปลี่ยนแปลงได้
- pending approval คือโหมดเริ่มต้นที่แนะนำ
- auto apply มีไว้สำหรับการตั้งค่าแบบส่วนตัว/เวิร์กสเปซที่เชื่อถือได้ ไม่ใช่สำหรับสภาพแวดล้อมที่แชร์กันหรือมีอินพุตไม่เป็นมิตรจำนวนมาก

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

เมื่อใช้ config นี้:

- เครื่องมือ `skill_workshop` จะพร้อมใช้งาน
- การแก้ไขแบบนำกลับมาใช้ซ้ำได้อย่างชัดเจนจะถูกเข้าคิวเป็น pending proposals
- reviewer passes แบบอิง threshold สามารถเสนอการอัปเดต Skill ได้
- จะยังไม่มีไฟล์ Skill ถูกเขียนจนกว่าจะมีการ apply pending proposal

ใช้การเขียนอัตโนมัติเฉพาะใน workspaces ที่เชื่อถือได้:

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

`approvalPolicy: "auto"` ยังคงใช้ scanner และเส้นทาง quarantine เดียวกัน มันจะ
ไม่ apply proposals ที่มี critical findings

## การกำหนดค่า

| คีย์ | ค่าเริ่มต้น | ช่วง / ค่า | ความหมาย |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled` | `true` | boolean | เปิดใช้งาน Plugin หลังจาก plugin entry ถูกโหลดแล้ว |
| `autoCapture` | `true` | boolean | เปิดใช้งานการ capture/review หลังจบเทิร์นของเอเจนต์ที่สำเร็จ |
| `approvalPolicy` | `"pending"` | `"pending"`, `"auto"` | เข้าคิว proposals หรือเขียน safe proposals โดยอัตโนมัติ |
| `reviewMode` | `"hybrid"` | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | เลือก explicit correction capture, LLM reviewer, ทั้งคู่ หรือไม่ใช้เลย |
| `reviewInterval` | `15` | `1..200` | รัน reviewer หลังจากครบจำนวน successful turns นี้ |
| `reviewMinToolCalls` | `8` | `1..500` | รัน reviewer หลังจากสังเกตเห็นการเรียกเครื่องมือครบจำนวนนี้ |
| `reviewTimeoutMs` | `45000` | `5000..180000` | Timeout สำหรับ embedded reviewer run |
| `maxPending` | `50` | `1..200` | จำนวน pending/quarantined proposals สูงสุดที่เก็บต่อ workspace |
| `maxSkillBytes` | `40000` | `1024..200000` | ขนาดสูงสุดของ skill/support file ที่สร้างขึ้น |

profiles ที่แนะนำ:

```json5
// Conservative: ใช้เฉพาะเครื่องมือแบบ explicit, ไม่มี automatic capture
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture อัตโนมัติ แต่ต้องอนุมัติก่อน
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: เขียน safe proposals ทันที
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: ไม่มี reviewer LLM call, ใช้เฉพาะ explicit correction phrases
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## เส้นทางการ capture

Skill Workshop มี 3 เส้นทางการ capture

### Tool suggestions

โมเดลสามารถเรียก `skill_workshop` ได้โดยตรงเมื่อเห็นขั้นตอนที่นำกลับมาใช้ซ้ำได้
หรือเมื่อผู้ใช้ขอให้มันบันทึก/อัปเดต Skill

นี่คือเส้นทางที่ explicit ที่สุด และทำงานได้แม้ตั้ง `autoCapture: false`

### Heuristic capture

เมื่อเปิดใช้ `autoCapture` และ `reviewMode` เป็น `heuristic` หรือ `hybrid`,
plugin จะสแกน successful turns เพื่อหาวลีแก้ไขจากผู้ใช้อย่างชัดเจน:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

heuristic จะสร้าง proposal จากคำสั่งของผู้ใช้ล่าสุดที่ตรงเงื่อนไข มันใช้ topic hints เพื่อเลือกชื่อ Skill สำหรับเวิร์กโฟลว์ที่พบบ่อย:

- งาน animated GIF -> `animated-gif-workflow`
- งาน screenshot หรือ asset -> `screenshot-asset-workflow`
- งาน QA หรือ scenario -> `qa-scenario-workflow`
- งาน GitHub PR -> `github-pr-workflow`
- fallback -> `learned-workflows`

Heuristic capture ถูกตั้งใจให้แคบ มันมีไว้สำหรับการแก้ไขที่ชัดเจนและบันทึกกระบวนการที่ทำซ้ำได้ ไม่ใช่สำหรับการสรุป transcript แบบทั่วไป

### LLM reviewer

เมื่อเปิดใช้ `autoCapture` และ `reviewMode` เป็น `llm` หรือ `hybrid`, plugin
จะรัน embedded reviewer แบบกระชับเมื่อถึง thresholds ที่กำหนด

reviewer จะได้รับ:

- ข้อความ transcript ล่าสุด โดยจำกัดไว้ที่ 12,000 อักขระท้ายสุด
- workspace skills ที่มีอยู่แล้วสูงสุด 12 รายการ
- สูงสุด 2,000 อักขระจากแต่ละ skill ที่มีอยู่
- คำสั่งแบบ JSON-only

reviewer นี้ไม่มีเครื่องมือ:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

reviewer จะคืนค่าเป็น `{ "action": "none" }` หรือหนึ่ง proposal ฟิลด์ `action` คือ `create`, `append` หรือ `replace` — ควรเลือก `append`/`replace` เมื่อมี skill ที่เกี่ยวข้องอยู่แล้ว; ใช้ `create` เฉพาะเมื่อไม่มี skill ที่มีอยู่ตัวใดเหมาะสม

ตัวอย่าง `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "เวิร์กโฟลว์การยอมรับสื่อแอนิเมชันที่ใช้ซ้ำได้",
  "description": "ตรวจสอบสื่อแอนิเมชันจากภายนอกก่อนใช้งานในผลิตภัณฑ์",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` จะเพิ่ม `section` + `body` ส่วน `replace` จะสลับ `oldText` เป็น `newText` ใน skill ที่ระบุชื่อ

## วงจรชีวิตของ Proposal

ทุกการอัปเดตที่ถูกสร้างจะกลายเป็น proposal ที่มี:

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

สถานะของ proposal:

- `pending` - รอการอนุมัติ
- `applied` - ถูกเขียนลง `<workspace>/skills`
- `rejected` - ถูกปฏิเสธโดยผู้ปฏิบัติงาน/โมเดล
- `quarantined` - ถูกบล็อกโดย scanner findings ระดับ critical

สถานะจะถูกเก็บแยกตาม workspace ภายใต้ state directory ของ Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

pending และ quarantined proposals จะถูก deduplicate ตามชื่อ skill และ
payload ของการเปลี่ยนแปลง ที่เก็บจะคง pending/quarantined proposals ที่ใหม่ที่สุดไว้
ไม่เกิน `maxPending`

## ข้อมูลอ้างอิงของเครื่องมือ

plugin นี้ลงทะเบียน agent tool หนึ่งตัว:

```text
skill_workshop
```

### `status`

นับ proposals ตามสถานะสำหรับ workspace ที่ใช้งานอยู่

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

แสดงรายการ pending proposals

```json
{ "action": "list_pending" }
```

หากต้องการแสดงสถานะอื่น:

```json
{ "action": "list_pending", "status": "applied" }
```

ค่า `status` ที่ใช้ได้:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

แสดงรายการ proposals ที่ถูกกักกัน

```json
{ "action": "list_quarantine" }
```

ใช้สิ่งนี้เมื่อ automatic capture ดูเหมือนไม่ทำอะไรเลย และ logs กล่าวถึง
`skill-workshop: quarantined <skill>`

### `inspect`

ดึง proposal ตาม id

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

สร้าง proposal โดยเมื่อใช้ `approvalPolicy: "pending"` (ค่าเริ่มต้น) คำสั่งนี้จะเข้าคิวแทนการเขียน

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "ผู้ใช้ได้กำหนดกฎการตรวจสอบ GIF ที่ใช้ซ้ำได้ไว้แล้ว",
  "description": "ตรวจสอบ animated GIF assets ก่อนนำไปใช้",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="บังคับเขียนแบบปลอดภัย (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "ตรวจสอบ animated GIF assets ก่อนนำไปใช้",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="บังคับให้เป็น pending ภายใต้นโยบาย auto (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "เวิร์กโฟลว์สำหรับการแทนที่ screenshot",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="ต่อท้ายใน section ที่ระบุชื่อ">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "เวิร์กโฟลว์ของ QA scenario",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="แทนที่ข้อความแบบตรงตัว">

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

apply pending proposal

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` จะปฏิเสธ proposals ที่ถูกกักกัน:

```text
quarantined proposal cannot be applied
```

### `reject`

ทำเครื่องหมาย proposal ว่าถูกปฏิเสธ

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

เขียนไฟล์สนับสนุนภายในไดเรกทอรีของ skill ที่มีอยู่แล้วหรือ skill ที่เสนอไว้

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

ไฟล์สนับสนุนจะอยู่ในขอบเขตของ workspace, มีการตรวจสอบ path, จำกัดขนาดไบต์ด้วย
`maxSkillBytes`, ถูกสแกน และเขียนแบบอะตอมิก

## การเขียน Skill

Skill Workshop จะเขียนเฉพาะภายใต้:

```text
<workspace>/skills/<normalized-skill-name>/
```

ชื่อ Skill จะถูก normalize ดังนี้:

- เปลี่ยนเป็นตัวพิมพ์เล็ก
- ชุดอักขระที่ไม่ใช่ `[a-z0-9_-]` จะกลายเป็น `-`
- ลบอักขระที่ไม่ใช่ตัวอักษรหรือตัวเลขที่ต้นและท้าย
- ความยาวสูงสุด 80 อักขระ
- ชื่อสุดท้ายต้องตรงกับ `[a-z0-9][a-z0-9_-]{1,79}`

สำหรับ `create`:

- หาก skill ยังไม่มีอยู่ Skill Workshop จะเขียน `SKILL.md` ใหม่
- หากมีอยู่แล้ว Skill Workshop จะต่อท้าย body ลงใน `## Workflow`

สำหรับ `append`:

- หาก skill มีอยู่แล้ว Skill Workshop จะต่อท้ายใน section ที่ร้องขอ
- หากยังไม่มี Skill Workshop จะสร้าง skill ขั้นต่ำก่อนแล้วค่อยต่อท้าย

สำหรับ `replace`:

- skill ต้องมีอยู่แล้ว
- `oldText` ต้องมีอยู่แบบตรงตัว
- จะมีการแทนที่เฉพาะ exact match แรกเท่านั้น

การเขียนทั้งหมดเป็นแบบอะตอมิก และจะรีเฟรช in-memory skills snapshot ทันที
ดังนั้น skill ใหม่หรือที่อัปเดตแล้วจึงมองเห็นได้โดยไม่ต้องรีสตาร์ต Gateway

## โมเดลความปลอดภัย

Skill Workshop มี safety scanner สำหรับเนื้อหา `SKILL.md` ที่ถูกสร้างและ support
files

critical findings จะกักกัน proposals:

| Rule id | บล็อกเนื้อหาที่... |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | บอกให้เอเจนต์เพิกเฉยต่อคำสั่งก่อนหน้าหรือคำสั่งที่มีลำดับสูงกว่า |
| `prompt-injection-system` | อ้างถึง system prompts, developer messages หรือ hidden instructions |
| `prompt-injection-tool` | กระตุ้นให้ข้ามการอนุญาต/การอนุมัติของเครื่องมือ |
| `shell-pipe-to-shell` | มี `curl`/`wget` ที่ pipe เข้า `sh`, `bash` หรือ `zsh` |
| `secret-exfiltration` | ดูเหมือนจะส่งข้อมูล env/process env ออกทางเครือข่าย |

warn findings จะถูกเก็บไว้ แต่จะไม่บล็อกด้วยตัวเอง:

| Rule id | เตือนเมื่อพบ... |
| -------------------- | -------------------------------- |
| `destructive-delete` | คำสั่งสไตล์ `rm -rf` แบบกว้าง |
| `unsafe-permissions` | การใช้สิทธิ์แบบ `chmod 777` |

proposals ที่ถูกกักกัน:

- จะเก็บ `scanFindings`
- จะเก็บ `quarantineReason`
- จะปรากฏใน `list_quarantine`
- ไม่สามารถ apply ผ่าน `apply` ได้

หากต้องการกู้คืนจาก proposal ที่ถูกกักกัน ให้สร้าง proposal ใหม่ที่ปลอดภัยโดยเอา
เนื้อหาที่ไม่ปลอดภัยออก ห้ามแก้ไฟล์ JSON ใน store ด้วยมือ

## คำแนะนำในพรอมป์ต์

เมื่อเปิดใช้งาน Skill Workshop จะฉีดส่วนของพรอมป์ต์สั้น ๆ ที่บอกให้เอเจนต์
ใช้ `skill_workshop` สำหรับหน่วยความจำเชิงขั้นตอนแบบถาวร

คำแนะนำนี้เน้นที่:

- ขั้นตอน ไม่ใช่ข้อเท็จจริง/ความชอบ
- การแก้ไขจากผู้ใช้
- ขั้นตอนที่ประสบความสำเร็จและไม่ชัดเจน
- ปัญหาที่เกิดซ้ำ
- การซ่อม skill ที่เก่า/บาง/ผิดผ่าน append/replace
- การบันทึกขั้นตอนที่นำกลับมาใช้ซ้ำได้หลังจากวนลูปเครื่องมือนานหรือหลังแก้ปัญหายากสำเร็จ
- ข้อความของ Skill แบบสั้นและเป็นคำสั่ง
- ห้าม dump transcript

ข้อความของโหมดการเขียนจะเปลี่ยนตาม `approvalPolicy`:

- โหมด pending: เข้าคิว suggestions; apply หลังได้รับการอนุมัติอย่างชัดเจนเท่านั้น
- โหมด auto: apply การอัปเดต workspace-skill ที่ปลอดภัยเมื่อชัดเจนว่านำกลับมาใช้ซ้ำได้

## ต้นทุนและลักษณะการทำงานขณะรันไทม์

heuristic capture ไม่เรียกใช้โมเดล

LLM review ใช้ embedded run บน active/default agent model มันทำงานแบบอิง threshold จึงไม่รันทุกเทิร์นตามค่าเริ่มต้น

reviewer:

- ใช้บริบท provider/model ที่กำหนดค่าไว้เดียวกันเมื่อมี
- fallback ไปยัง runtime agent defaults
- มี `reviewTimeoutMs`
- ใช้ bootstrap context แบบเบา
- ไม่มีเครื่องมือ
- ไม่เขียนอะไรโดยตรง
- สามารถปล่อยได้เพียง proposal ที่ต้องผ่าน scanner ปกติ และ
  เส้นทาง approval/quarantine

หาก reviewer ล้มเหลว, timeout หรือคืน JSON ไม่ถูกต้อง Plugin จะ log
ข้อความเตือน/ดีบักและข้าม review pass นั้น

## รูปแบบการใช้งาน

ใช้ Skill Workshop เมื่อผู้ใช้พูดว่า:

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

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

- มีลักษณะเป็น transcript
- ไม่อยู่ในรูปแบบคำสั่ง
- มีรายละเอียดใช้ครั้งเดียวที่รบกวน
- ไม่ได้บอกเอเจนต์ตัวถัดไปว่าต้องทำอะไร

## การดีบัก

ตรวจสอบว่า Plugin ถูกโหลดหรือไม่:

```bash
openclaw plugins list --enabled
```

ตรวจสอบจำนวน proposals จากบริบท agent/tool:

```json
{ "action": "status" }
```

ตรวจสอบ pending proposals:

```json
{ "action": "list_pending" }
```

ตรวจสอบ proposals ที่ถูกกักกัน:

```json
{ "action": "list_quarantine" }
```

อาการที่พบบ่อย:

| อาการ | สาเหตุที่เป็นไปได้ | สิ่งที่ต้องตรวจสอบ |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| เครื่องมือใช้งานไม่ได้ | ไม่ได้เปิดใช้ plugin entry | `plugins.entries.skill-workshop.enabled` และ `openclaw plugins list` |
| ไม่มี automatic proposal ปรากฏ | `autoCapture: false`, `reviewMode: "off"` หรือ thresholds ยังไม่ถึง | Config, proposal status, Gateway logs |
| heuristic ไม่จับ | ถ้อยคำของผู้ใช้ไม่ตรงกับ correction patterns | ใช้ `skill_workshop.suggest` แบบ explicit หรือเปิด LLM reviewer |
| reviewer ไม่สร้าง proposal | reviewer คืน `none`, JSON ไม่ถูกต้อง หรือ timeout | Gateway logs, `reviewTimeoutMs`, thresholds |
| proposal ยังไม่ถูก apply | `approvalPolicy: "pending"` | `list_pending` แล้วค่อย `apply` |
| proposal หายจาก pending | มีการใช้ proposal ซ้ำ, ถูก pruning ตาม max pending หรือถูก applied/rejected/quarantined | `status`, `list_pending` พร้อม status filters, `list_quarantine` |
| มีไฟล์ Skill อยู่แล้วแต่โมเดลไม่เห็น | skill snapshot ไม่ได้รีเฟรช หรือ skill gating ตัดออก | สถานะ `openclaw skills` และ eligibility ของ workspace skill |

logs ที่เกี่ยวข้อง:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA scenarios

QA scenarios ที่อิงกับรีโป:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

รัน deterministic coverage:

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

reviewer scenario แยกออกมาต่างหากโดยตั้งใจ เพราะมันเปิดใช้
`reviewMode: "llm"` และทดสอบ embedded reviewer pass

## เมื่อใดไม่ควรเปิด auto apply

หลีกเลี่ยง `approvalPolicy: "auto"` เมื่อ:

- workspace มีขั้นตอนที่อ่อนไหว
- เอเจนต์กำลังทำงานกับอินพุตที่ไม่เชื่อถือได้
- Skills ถูกแชร์ข้ามทีมกว้าง
- คุณยังปรับแต่ง prompts หรือ scanner rules อยู่
- โมเดลต้องจัดการเนื้อหาเว็บ/อีเมลที่ไม่เป็นมิตรบ่อยครั้ง

ให้ใช้โหมด pending ก่อน ค่อยสลับเป็นโหมด auto เมื่อคุณตรวจสอบชนิดของ
skills ที่เอเจนต์เสนอใน workspace นั้นแล้ว

## เอกสารที่เกี่ยวข้อง

- [Skills](/th/tools/skills)
- [Plugins](/th/tools/plugin)
- [Testing](/th/reference/test)
