---
read_when:
    - คุณต้องการเวิร์กโฟลว์หลายขั้นตอนที่กำหนดผลลัพธ์ได้แน่นอน พร้อมการอนุมัติอย่างชัดเจน
    - คุณต้องดำเนินเวิร์กโฟลว์ต่อโดยไม่เรียกใช้ขั้นตอนก่อนหน้าอีกครั้ง
summary: รันไทม์เวิร์กโฟลว์แบบมีชนิดสำหรับ OpenClaw พร้อมเกตการอนุมัติที่กลับมาทำต่อได้
title: กุ้งมังกร
x-i18n:
    generated_at: "2026-05-06T09:34:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster คือเชลล์เวิร์กโฟลว์ที่ให้ OpenClaw รันลำดับเครื่องมือหลายขั้นตอนเป็นการดำเนินการเดียวที่กำหนดแน่นอน พร้อมจุดตรวจสอบการอนุมัติที่ชัดเจน

Lobster คือชั้นการเขียนงานที่อยู่เหนือการทำงานเบื้องหลังแบบแยกออก สำหรับการจัดลำดับโฟลว์ที่อยู่เหนือแต่ละงาน โปรดดู [Task Flow](/th/automation/taskflow) (`openclaw tasks flow`) สำหรับบัญชีกิจกรรมของงาน โปรดดู [`openclaw tasks`](/th/automation/tasks)

## ฮุก

ผู้ช่วยของคุณสามารถสร้างเครื่องมือที่จัดการตัวมันเองได้ ขอเวิร์กโฟลว์หนึ่งรายการ แล้วอีก 30 นาทีต่อมาคุณจะมี CLI พร้อมไพป์ไลน์ที่รันได้ในการเรียกครั้งเดียว Lobster คือชิ้นส่วนที่ขาดหาย: ไพป์ไลน์ที่กำหนดแน่นอน การอนุมัติที่ชัดเจน และสถานะที่กลับมาทำต่อได้

## เหตุผล

ปัจจุบัน เวิร์กโฟลว์ที่ซับซ้อนต้องใช้การเรียกเครื่องมือโต้ตอบไปมาหลายครั้ง แต่ละครั้งมีต้นทุนเป็นโทเค็น และ LLM ต้องจัดลำดับทุกขั้นตอน Lobster ย้ายการจัดลำดับนั้นเข้าไปในรันไทม์แบบมีชนิดข้อมูล:

- **เรียกครั้งเดียวแทนหลายครั้ง**: OpenClaw รันการเรียกเครื่องมือ Lobster เพียงครั้งเดียวและรับผลลัพธ์แบบมีโครงสร้าง
- **มีการอนุมัติในตัว**: ผลข้างเคียง (ส่งอีเมล โพสต์ความคิดเห็น) จะหยุดเวิร์กโฟลว์ไว้จนกว่าจะได้รับการอนุมัติอย่างชัดเจน
- **กลับมาทำต่อได้**: เวิร์กโฟลว์ที่หยุดไว้จะคืนโทเค็น อนุมัติแล้วกลับมาทำต่อได้โดยไม่ต้องรันทุกอย่างซ้ำ

## ทำไมต้องใช้ DSL แทนโปรแกรมธรรมดา?

Lobster ตั้งใจให้มีขนาดเล็ก เป้าหมายไม่ใช่ "ภาษาใหม่" แต่เป็นสเปกไพป์ไลน์ที่คาดเดาได้ เป็นมิตรกับ AI พร้อมการอนุมัติและโทเค็นสำหรับกลับมาทำต่อเป็นคุณสมบัติหลัก

- **อนุมัติ/กลับมาทำต่อมีในตัว**: โปรแกรมปกติสามารถถามมนุษย์ได้ แต่ไม่สามารถ _หยุดชั่วคราวแล้วกลับมาทำต่อ_ ด้วยโทเค็นที่คงทนได้ เว้นแต่คุณจะสร้างรันไทม์นั้นเอง
- **ความกำหนดแน่นอน + ตรวจสอบย้อนหลังได้**: ไพป์ไลน์เป็นข้อมูล จึงบันทึก เปรียบเทียบ เล่นซ้ำ และตรวจทานได้ง่าย
- **พื้นผิวที่จำกัดสำหรับ AI**: ไวยากรณ์ขนาดเล็ก + การส่งผ่าน JSON ลดเส้นทางโค้ดแบบ "สร้างสรรค์" และทำให้การตรวจสอบเป็นไปได้จริง
- **นโยบายความปลอดภัยฝังอยู่ในตัว**: การหมดเวลา เพดานเอาต์พุต การตรวจสอบแซนด์บ็อกซ์ และ allowlist ถูกบังคับใช้โดยรันไทม์ ไม่ใช่โดยสคริปต์แต่ละตัว
- **ยังเขียนโปรแกรมได้**: แต่ละขั้นตอนเรียก CLI หรือสคริปต์ใดก็ได้ หากต้องการ JS/TS ให้สร้างไฟล์ `.lobster` จากโค้ด

## วิธีการทำงาน

OpenClaw รันเวิร์กโฟลว์ Lobster **ในโปรเซส** โดยใช้รันเนอร์แบบฝัง ไม่มีการสร้างซับโปรเซส CLI ภายนอก กลไกเวิร์กโฟลว์ทำงานภายในโปรเซส Gateway และคืน JSON envelope โดยตรง
หากไพป์ไลน์หยุดเพื่อรอการอนุมัติ เครื่องมือจะคืน `resumeToken` เพื่อให้คุณดำเนินการต่อภายหลังได้

## รูปแบบ: CLI ขนาดเล็ก + ไปป์ JSON + การอนุมัติ

สร้างคำสั่งขนาดเล็กที่สื่อสารด้วย JSON แล้วเชื่อมต่อเป็นการเรียก Lobster ครั้งเดียว (ชื่อคำสั่งตัวอย่างด้านล่าง - เปลี่ยนเป็นของคุณเองได้)

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

หากไพป์ไลน์ขอการอนุมัติ ให้กลับมาทำต่อด้วยโทเค็น:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI เรียกใช้เวิร์กโฟลว์; Lobster ดำเนินการตามขั้นตอนต่าง ๆ เกตการอนุมัติทำให้ผลข้างเคียงชัดเจนและตรวจสอบย้อนหลังได้

ตัวอย่าง: แมปรายการอินพุตเป็นการเรียกเครื่องมือ:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## ขั้นตอน LLM แบบ JSON เท่านั้น (llm-task)

สำหรับเวิร์กโฟลว์ที่ต้องมี **ขั้นตอน LLM แบบมีโครงสร้าง** ให้เปิดใช้เครื่องมือ Plugin เสริม
`llm-task` แล้วเรียกจาก Lobster วิธีนี้ทำให้เวิร์กโฟลว์ยังคงกำหนดแน่นอน
ขณะเดียวกันยังให้คุณจัดประเภท/สรุป/ร่างด้วยโมเดลได้

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

ใช้ในไพป์ไลน์:

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

Lobster สามารถรันไฟล์เวิร์กโฟลว์ YAML/JSON ที่มีฟิลด์ `name`, `args`, `steps`, `env`, `condition` และ `approval` ได้ ในการเรียกเครื่องมือ OpenClaw ให้ตั้งค่า `pipeline` เป็นพาธของไฟล์

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

- `stdin: $step.stdout` และ `stdin: $step.json` ส่งเอาต์พุตของขั้นตอนก่อนหน้า
- `condition` (หรือ `when`) สามารถใช้เป็นเกตให้ขั้นตอนทำงานตาม `$step.approved`

## ติดตั้ง Lobster

เวิร์กโฟลว์ Lobster ที่มาพร้อมระบบจะรันในโปรเซส ไม่จำเป็นต้องมีไบนารี `lobster` แยกต่างหาก รันเนอร์แบบฝังมาพร้อมกับ Plugin Lobster

หากต้องการ CLI Lobster แบบสแตนด์อโลนสำหรับการพัฒนาหรือไพป์ไลน์ภายนอก ให้ติดตั้งจาก [repo ของ Lobster](https://github.com/openclaw/lobster) และตรวจสอบให้แน่ใจว่า `lobster` อยู่บน `PATH`

## เปิดใช้เครื่องมือ

Lobster เป็นเครื่องมือ Plugin **เสริม** (ไม่ได้เปิดใช้โดยค่าเริ่มต้น)

แนะนำ (เพิ่มแบบเสริม ปลอดภัย):

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
allowlist เป็นแบบเลือกเปิดสำหรับ Plugin เสริม `alsoAllow` เปิดใช้เฉพาะเครื่องมือ Plugin เสริมตามชื่อที่ระบุ โดยยังคงชุดเครื่องมือแกนหลักตามปกติไว้ หากต้องการจำกัดเครื่องมือแกนหลัก ให้ใช้ `tools.allow` กับเครื่องมือหรือกลุ่มแกนหลักที่คุณต้องการ
</Note>

## ตัวอย่าง: การคัดแยกอีเมล

หากไม่มี Lobster:

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

เมื่อใช้ Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

คืน JSON envelope (ตัดทอนแล้ว):

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

ผู้ใช้อนุมัติ → กลับมาทำต่อ:

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

รันไพป์ไลน์ในโหมดเครื่องมือ

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

ดำเนินเวิร์กโฟลว์ที่หยุดไว้ต่อหลังการอนุมัติ

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### อินพุตเสริม

- `cwd`: ไดเรกทอรีทำงานแบบสัมพัทธ์สำหรับไพป์ไลน์ (ต้องอยู่ภายในไดเรกทอรีทำงานของ Gateway)
- `timeoutMs`: ยกเลิกเวิร์กโฟลว์หากใช้เวลานานเกินระยะเวลานี้ (ค่าเริ่มต้น: 20000)
- `maxStdoutBytes`: ยกเลิกเวิร์กโฟลว์หากเอาต์พุตเกินขนาดนี้ (ค่าเริ่มต้น: 512000)
- `argsJson`: สตริง JSON ที่ส่งให้ `lobster run --args-json` (ใช้กับไฟล์เวิร์กโฟลว์เท่านั้น)

## Output envelope

Lobster คืน JSON envelope พร้อมหนึ่งในสามสถานะ:

- `ok` → เสร็จสิ้นสำเร็จ
- `needs_approval` → หยุดชั่วคราว; ต้องมี `requiresApproval.resumeToken` เพื่อกลับมาทำต่อ
- `cancelled` → ถูกปฏิเสธหรือยกเลิกอย่างชัดเจน

เครื่องมือแสดง envelope ทั้งใน `content` (JSON ที่จัดรูปแบบให้อ่านง่าย) และ `details` (ออบเจกต์ดิบ)

## การอนุมัติ

หากมี `requiresApproval` ให้ตรวจสอบพรอมป์แล้วตัดสินใจ:

- `approve: true` → กลับมาทำต่อและดำเนินผลข้างเคียงต่อไป
- `approve: false` → ยกเลิกและจบเวิร์กโฟลว์

ใช้ `approve --preview-from-stdin --limit N` เพื่อแนบตัวอย่าง JSON เข้ากับคำขออนุมัติโดยไม่ต้องใช้กาว custom jq/heredoc โทเค็นสำหรับกลับมาทำต่อตอนนี้มีขนาดกะทัดรัด: Lobster เก็บสถานะการกลับมาทำต่อของเวิร์กโฟลว์ไว้ใต้ไดเรกทอรีสถานะของมัน และส่งคืนคีย์โทเค็นขนาดเล็ก

## OpenProse

OpenProse ทำงานร่วมกับ Lobster ได้ดี: ใช้ `/prose` เพื่อจัดลำดับการเตรียมงานแบบหลาย agent จากนั้นรันไพป์ไลน์ Lobster สำหรับการอนุมัติที่กำหนดแน่นอน หากโปรแกรม Prose ต้องใช้ Lobster ให้อนุญาตเครื่องมือ `lobster` สำหรับ sub-agent ผ่าน `tools.subagents.tools` ดู [OpenProse](/th/prose)

## ความปลอดภัย

- **เฉพาะ local in-process เท่านั้น** - เวิร์กโฟลว์ทำงานภายในโปรเซส Gateway; ไม่มีการเรียกเครือข่ายจากตัว Plugin เอง
- **ไม่มีความลับ** - Lobster ไม่จัดการ OAuth; มันเรียกเครื่องมือ OpenClaw ที่จัดการสิ่งนั้น
- **รับรู้แซนด์บ็อกซ์** - ปิดใช้งานเมื่อบริบทของเครื่องมืออยู่ในแซนด์บ็อกซ์
- **เสริมความแข็งแกร่งแล้ว** - การหมดเวลาและเพดานเอาต์พุตถูกบังคับใช้โดยรันเนอร์แบบฝัง

## การแก้ไขปัญหา

- **`lobster timed out`** → เพิ่ม `timeoutMs` หรือแยกไพป์ไลน์ยาวออกเป็นส่วน ๆ
- **`lobster output exceeded maxStdoutBytes`** → เพิ่ม `maxStdoutBytes` หรือลดขนาดเอาต์พุต
- **`lobster returned invalid JSON`** → ตรวจสอบให้แน่ใจว่าไพป์ไลน์รันในโหมดเครื่องมือและพิมพ์เฉพาะ JSON
- **`lobster failed`** → ตรวจสอบล็อก Gateway เพื่อดูรายละเอียดข้อผิดพลาดของรันเนอร์แบบฝัง

## เรียนรู้เพิ่มเติม

- [Plugins](/th/tools/plugin)
- [การเขียนเครื่องมือ Plugin](/th/plugins/building-plugins#registering-agent-tools)

## กรณีศึกษา: เวิร์กโฟลว์ชุมชน

ตัวอย่างสาธารณะหนึ่งรายการ: CLI "second brain" + ไพป์ไลน์ Lobster ที่จัดการคลัง Markdown สามคลัง (ส่วนตัว คู่ชีวิต ใช้ร่วมกัน) CLI ส่งออก JSON สำหรับสถิติ รายการกล่องขาเข้า และการสแกนรายการค้างนาน; Lobster เชื่อมคำสั่งเหล่านั้นเป็นเวิร์กโฟลว์ เช่น `weekly-review`, `inbox-triage`, `memory-consolidation` และ `shared-task-sync` โดยแต่ละรายการมีเกตการอนุมัติ AI จัดการการตัดสิน (การจัดหมวดหมู่) เมื่อพร้อมใช้งาน และถอยกลับไปใช้กฎที่กำหนดแน่นอนเมื่อไม่พร้อม

- เธรด: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) - การจัดกำหนดการเวิร์กโฟลว์ Lobster
- [ภาพรวมระบบอัตโนมัติ](/th/automation) - กลไกอัตโนมัติทั้งหมด
- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือ agent ทั้งหมดที่มีให้ใช้
