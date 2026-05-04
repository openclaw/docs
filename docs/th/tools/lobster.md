---
read_when:
    - คุณต้องการกระบวนการทำงานหลายขั้นตอนที่กำหนดผลลัพธ์ได้แน่นอนพร้อมการอนุมัติอย่างชัดเจน
    - คุณต้องดำเนินเวิร์กโฟลว์ต่อโดยไม่เรียกใช้ขั้นตอนก่อนหน้านี้ซ้ำ
summary: รันไทม์เวิร์กโฟลว์แบบกำหนดชนิดข้อมูลสำหรับ OpenClaw พร้อมเกตการอนุมัติที่กลับมาทำงานต่อได้
title: กุ้งมังกร
x-i18n:
    generated_at: "2026-05-04T02:27:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

Lobster เป็นเชลล์เวิร์กโฟลว์ที่ให้ OpenClaw เรียกใช้ลำดับเครื่องมือหลายขั้นตอนเป็นการดำเนินการเดียวที่กำหนดแน่นอน พร้อมจุดตรวจสอบการอนุมัติอย่างชัดเจน

Lobster เป็นเลเยอร์การเขียนหนึ่งระดับเหนือกว่างานเบื้องหลังแบบแยกตัว สำหรับการจัดการลำดับโฟลว์เหนือกว่างานรายตัว โปรดดู [Task Flow](/th/automation/taskflow) (`openclaw tasks flow`) สำหรับบัญชีแยกประเภทกิจกรรมของงาน โปรดดู [`openclaw tasks`](/th/automation/tasks)

## Hook

ผู้ช่วยของคุณสามารถสร้างเครื่องมือที่จัดการตัวมันเองได้ ขอเวิร์กโฟลว์ แล้ว 30 นาทีต่อมาคุณจะมี CLI พร้อมไปป์ไลน์ที่รันเป็นการเรียกครั้งเดียว Lobster คือชิ้นส่วนที่ขาดไป: ไปป์ไลน์ที่กำหนดแน่นอน การอนุมัติที่ชัดเจน และสถานะที่กลับมาทำต่อได้

## ทำไม

ปัจจุบัน เวิร์กโฟลว์ที่ซับซ้อนต้องใช้การเรียกเครื่องมือโต้ตอบกลับไปกลับมาหลายครั้ง แต่ละครั้งมีค่าใช้จ่ายเป็นโทเค็น และ LLM ต้องจัดลำดับทุกขั้นตอน Lobster ย้ายการจัดลำดับนั้นเข้าไปในรันไทม์ที่มีชนิดข้อมูล:

- **เรียกครั้งเดียวแทนหลายครั้ง**: OpenClaw เรียกเครื่องมือ Lobster หนึ่งครั้งและได้ผลลัพธ์แบบมีโครงสร้าง
- **มีการอนุมัติในตัว**: ผลข้างเคียง (ส่งอีเมล โพสต์ความคิดเห็น) จะหยุดเวิร์กโฟลว์จนกว่าจะได้รับการอนุมัติอย่างชัดเจน
- **กลับมาทำต่อได้**: เวิร์กโฟลว์ที่หยุดจะคืนโทเค็น อนุมัติแล้วทำต่อได้โดยไม่ต้องรันทุกอย่างใหม่

## ทำไมต้องใช้ DSL แทนโปรแกรมธรรมดา?

Lobster ตั้งใจให้มีขนาดเล็ก เป้าหมายไม่ใช่ "ภาษาใหม่" แต่เป็นสเปกไปป์ไลน์ที่คาดการณ์ได้ เป็นมิตรกับ AI พร้อมการอนุมัติและโทเค็นสำหรับกลับมาทำต่อเป็นฟีเจอร์หลัก

- **การอนุมัติ/กลับมาทำต่อมีในตัว**: โปรแกรมปกติสามารถขอให้มนุษย์ยืนยันได้ แต่ไม่สามารถ _หยุดชั่วคราวและกลับมาทำต่อ_ ด้วยโทเค็นที่คงทนโดยที่คุณไม่ต้องสร้างรันไทม์นั้นเอง
- **ความกำหนดแน่นอน + ตรวจสอบย้อนหลังได้**: ไปป์ไลน์เป็นข้อมูล จึงบันทึก diff เล่นซ้ำ และตรวจทานได้ง่าย
- **พื้นผิวที่จำกัดสำหรับ AI**: ไวยากรณ์ขนาดเล็ก + การส่งผ่าน JSON ลดเส้นทางโค้ดที่ “สร้างสรรค์” และทำให้การตรวจสอบความถูกต้องเป็นไปได้จริง
- **มีนโยบายความปลอดภัยในตัว**: ไทม์เอาต์ เพดานเอาต์พุต การตรวจสอบ sandbox และ allowlist ถูกบังคับใช้โดยรันไทม์ ไม่ใช่โดยแต่ละสคริปต์
- **ยังเขียนโปรแกรมได้**: แต่ละขั้นตอนสามารถเรียก CLI หรือสคริปต์ใดก็ได้ หากต้องการ JS/TS ให้สร้างไฟล์ `.lobster` จากโค้ด

## วิธีทำงาน

OpenClaw รันเวิร์กโฟลว์ Lobster **ในโปรเซส** โดยใช้รันเนอร์แบบฝัง ไม่มีการ spawn ซับโปรเซส CLI ภายนอก เครื่องยนต์เวิร์กโฟลว์ทำงานภายในโปรเซส Gateway และคืนซอง JSON โดยตรง
หากไปป์ไลน์หยุดเพื่อรออนุมัติ เครื่องมือจะคืน `resumeToken` เพื่อให้คุณทำต่อภายหลังได้

## รูปแบบ: CLI ขนาดเล็ก + ท่อ JSON + การอนุมัติ

สร้างคำสั่งขนาดเล็กที่สื่อสารด้วย JSON แล้วเชื่อมต่อเป็นการเรียก Lobster ครั้งเดียว (ชื่อตัวอย่างคำสั่งด้านล่าง — เปลี่ยนเป็นของคุณเอง)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

หากไปป์ไลน์ขอการอนุมัติ ให้ทำต่อด้วยโทเค็น:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI เริ่มเวิร์กโฟลว์; Lobster ดำเนินการตามขั้นตอน ประตูการอนุมัติทำให้ผลข้างเคียงชัดเจนและตรวจสอบย้อนหลังได้

ตัวอย่าง: แมปรายการอินพุตเป็นการเรียกเครื่องมือ:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## ขั้นตอน LLM เฉพาะ JSON (llm-task)

สำหรับเวิร์กโฟลว์ที่ต้องใช้ **ขั้นตอน LLM แบบมีโครงสร้าง** ให้เปิดใช้เครื่องมือ Plugin
`llm-task` ที่เป็นทางเลือก และเรียกจาก Lobster วิธีนี้ทำให้เวิร์กโฟลว์
ยังคงกำหนดแน่นอน ขณะยังให้คุณจัดประเภท/สรุป/ร่างด้วยโมเดลได้

เปิดใช้เครื่องมือ:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

ใช้ในไปป์ไลน์:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

ดูรายละเอียดและตัวเลือกการกำหนดค่าได้ที่ [LLM Task](/th/tools/llm-task)

## ไฟล์เวิร์กโฟลว์ (.lobster)

Lobster สามารถรันไฟล์เวิร์กโฟลว์ YAML/JSON ที่มีฟิลด์ `name`, `args`, `steps`, `env`, `condition` และ `approval` ได้ ในการเรียกเครื่องมือ OpenClaw ให้ตั้ง `pipeline` เป็นพาธไฟล์

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

หมายเหตุ:

- `stdin: $step.stdout` และ `stdin: $step.json` ส่งต่อเอาต์พุตของขั้นตอนก่อนหน้า
- `condition` (หรือ `when`) สามารถกั้นขั้นตอนตาม `$step.approved`

## ติดตั้ง Lobster

เวิร์กโฟลว์ Lobster ที่ bundled จะรันในโปรเซส ไม่จำเป็นต้องมีไบนารี `lobster` แยกต่างหาก รันเนอร์แบบฝังมาพร้อมกับ Plugin Lobster

หากคุณต้องการ CLI Lobster แบบ standalone สำหรับการพัฒนาหรือไปป์ไลน์ภายนอก ให้ติดตั้งจาก [Lobster repo](https://github.com/openclaw/lobster) และตรวจสอบให้แน่ใจว่า `lobster` อยู่บน `PATH`

## เปิดใช้เครื่องมือ

Lobster เป็นเครื่องมือ Plugin **ทางเลือก** (ไม่ได้เปิดใช้โดยค่าเริ่มต้น)

แนะนำ (แบบเพิ่มเข้าไป ปลอดภัย):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

หรือกำหนดต่อ agent:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

หลีกเลี่ยงการใช้ `tools.allow: ["lobster"]` เว้นแต่คุณตั้งใจจะรันในโหมด allowlist แบบจำกัด

<Note>
allowlist เป็นแบบ opt-in สำหรับ Plugin ทางเลือก `alsoAllow` เปิดใช้เฉพาะเครื่องมือ Plugin ทางเลือกที่ระบุชื่อไว้ ขณะยังคงชุดเครื่องมือ core ปกติไว้ หากต้องการจำกัดเครื่องมือ core ให้ใช้ `tools.allow` กับเครื่องมือหรือกลุ่ม core ที่คุณต้องการ
</Note>

## ตัวอย่าง: การคัดแยกอีเมล

เมื่อไม่มี Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

เมื่อมี Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

คืนซอง JSON (ตัดทอน):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

ผู้ใช้อนุมัติ → ทำต่อ:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

เวิร์กโฟลว์เดียว กำหนดแน่นอน ปลอดภัย

## พารามิเตอร์เครื่องมือ

### `run`

รันไปป์ไลน์ในโหมดเครื่องมือ

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

รันไฟล์เวิร์กโฟลว์พร้อมอาร์กิวเมนต์:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

ทำต่อเวิร์กโฟลว์ที่หยุดหลังการอนุมัติ

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### อินพุตทางเลือก

- `cwd`: ไดเรกทอรีทำงานแบบสัมพัทธ์สำหรับไปป์ไลน์ (ต้องอยู่ภายในไดเรกทอรีทำงานของ gateway)
- `timeoutMs`: ยกเลิกเวิร์กโฟลว์หากใช้เวลาเกินระยะเวลานี้ (ค่าเริ่มต้น: 20000)
- `maxStdoutBytes`: ยกเลิกเวิร์กโฟลว์หากเอาต์พุตเกินขนาดนี้ (ค่าเริ่มต้น: 512000)
- `argsJson`: สตริง JSON ที่ส่งให้ `lobster run --args-json` (เฉพาะไฟล์เวิร์กโฟลว์)

## ซองเอาต์พุต

Lobster คืนซอง JSON ที่มีหนึ่งในสามสถานะ:

- `ok` → เสร็จสมบูรณ์สำเร็จ
- `needs_approval` → หยุดชั่วคราว; ต้องใช้ `requiresApproval.resumeToken` เพื่อทำต่อ
- `cancelled` → ถูกปฏิเสธหรือยกเลิกอย่างชัดเจน

เครื่องมือแสดงซองทั้งใน `content` (JSON ที่จัดรูปแบบแล้ว) และ `details` (ออบเจ็กต์ดิบ)

## การอนุมัติ

หากมี `requiresApproval` ให้ตรวจ prompt และตัดสินใจ:

- `approve: true` → ทำต่อและดำเนินผลข้างเคียงต่อ
- `approve: false` → ยกเลิกและจบเวิร์กโฟลว์

ใช้ `approve --preview-from-stdin --limit N` เพื่อแนบตัวอย่าง JSON ไปกับคำขออนุมัติโดยไม่ต้องใช้ jq/heredoc glue แบบกำหนดเอง ตอนนี้โทเค็นสำหรับกลับมาทำต่อมีขนาดกะทัดรัด: Lobster เก็บสถานะการกลับมาทำต่อของเวิร์กโฟลว์ไว้ใต้ไดเรกทอรีสถานะของตนและคืนคีย์โทเค็นขนาดเล็ก

## OpenProse

OpenProse ทำงานร่วมกับ Lobster ได้ดี: ใช้ `/prose` เพื่อจัดลำดับการเตรียมงานแบบหลาย agent แล้วรันไปป์ไลน์ Lobster สำหรับการอนุมัติที่กำหนดแน่นอน หากโปรแกรม Prose ต้องใช้ Lobster ให้อนุญาตเครื่องมือ `lobster` สำหรับ sub-agents ผ่าน `tools.subagents.tools` ดู [OpenProse](/th/prose)

## ความปลอดภัย

- **เฉพาะในโปรเซสภายในเครื่อง** — เวิร์กโฟลว์ทำงานภายในโปรเซส gateway; ไม่มีการเรียกเครือข่ายจาก Plugin เอง
- **ไม่มี secret** — Lobster ไม่จัดการ OAuth; มันเรียกเครื่องมือ OpenClaw ที่จัดการสิ่งนั้น
- **รับรู้ sandbox** — ปิดใช้งานเมื่อบริบทเครื่องมืออยู่ใน sandbox
- **เสริมความแข็งแรงแล้ว** — ไทม์เอาต์และเพดานเอาต์พุตถูกบังคับใช้โดยรันเนอร์แบบฝัง

## การแก้ไขปัญหา

- **`lobster timed out`** → เพิ่ม `timeoutMs` หรือแยกไปป์ไลน์ยาวออกเป็นส่วน
- **`lobster output exceeded maxStdoutBytes`** → เพิ่ม `maxStdoutBytes` หรือลดขนาดเอาต์พุต
- **`lobster returned invalid JSON`** → ตรวจสอบให้แน่ใจว่าไปป์ไลน์รันในโหมดเครื่องมือและพิมพ์เฉพาะ JSON
- **`lobster failed`** → ตรวจสอบบันทึก gateway สำหรับรายละเอียดข้อผิดพลาดของรันเนอร์แบบฝัง

## เรียนรู้เพิ่มเติม

- [Plugins](/th/tools/plugin)
- [การเขียนเครื่องมือ Plugin](/th/plugins/building-plugins#registering-agent-tools)

## กรณีศึกษา: เวิร์กโฟลว์ชุมชน

ตัวอย่างสาธารณะหนึ่งรายการ: CLI “สมองที่สอง” + ไปป์ไลน์ Lobster ที่จัดการ vault Markdown สามชุด (ส่วนตัว คู่ชีวิต แชร์ร่วมกัน) CLI ส่งออก JSON สำหรับสถิติ รายการ inbox และการสแกนรายการค้างเก่า; Lobster เชื่อมคำสั่งเหล่านั้นเป็นเวิร์กโฟลว์ เช่น `weekly-review`, `inbox-triage`, `memory-consolidation` และ `shared-task-sync` โดยแต่ละรายการมีประตูการอนุมัติ AI รับหน้าที่ตัดสิน (การจัดประเภท) เมื่อพร้อมใช้งาน และถอยกลับไปใช้กฎที่กำหนดแน่นอนเมื่อไม่พร้อม

- เธรด: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ที่เกี่ยวข้อง

- [Automation & Tasks](/th/automation) — การกำหนดเวลารันเวิร์กโฟลว์ Lobster
- [ภาพรวม Automation](/th/automation) — กลไก Automation ทั้งหมด
- [ภาพรวม Tools](/th/tools) — เครื่องมือ agent ทั้งหมดที่พร้อมใช้งาน
