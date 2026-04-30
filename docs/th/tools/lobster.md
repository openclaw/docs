---
read_when:
    - คุณต้องการเวิร์กโฟลว์หลายขั้นตอนที่ให้ผลลัพธ์แน่นอนพร้อมการอนุมัติที่ชัดเจน
    - คุณต้องดำเนินเวิร์กโฟลว์ต่อโดยไม่เรียกใช้ขั้นตอนก่อนหน้านี้ซ้ำ
summary: รันไทม์เวิร์กโฟลว์แบบมีชนิดสำหรับ OpenClaw พร้อมเกตการอนุมัติที่สามารถกลับมาทำงานต่อได้.
title: ล็อบสเตอร์
x-i18n:
    generated_at: "2026-04-30T10:21:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 16
---

Lobster คือ workflow shell ที่ให้ OpenClaw รันลำดับเครื่องมือหลายขั้นตอนเป็นการดำเนินการเดียวที่กำหนดผลได้แน่นอน พร้อมจุดตรวจการอนุมัติที่ชัดเจน

Lobster เป็นเลเยอร์สำหรับเขียนงานหนึ่งชั้นเหนือการทำงานเบื้องหลังแบบแยกตัว สำหรับการจัด orchestration ของ flow ที่อยู่เหนือ task รายตัว โปรดดู [TaskFlow](/th/automation/taskflow) (`openclaw tasks flow`) สำหรับ ledger กิจกรรมของ task โปรดดู [`openclaw tasks`](/th/automation/tasks)

## Hook

ผู้ช่วยของคุณสามารถสร้างเครื่องมือที่ใช้จัดการตัวเองได้ ขอ workflow แล้วอีก 30 นาทีต่อมาคุณจะได้ CLI พร้อม pipelines ที่รันได้ในคำสั่งเดียว Lobster คือชิ้นส่วนที่ขาดไป: pipelines ที่กำหนดผลได้แน่นอน การอนุมัติที่ชัดเจน และสถานะที่กลับมาทำต่อได้

## ทำไม

ปัจจุบัน workflows ที่ซับซ้อนต้องใช้การเรียกเครื่องมือโต้ตอบไปมาหลายครั้ง แต่ละครั้งใช้ tokens และ LLM ต้องจัด orchestration ทุกขั้นตอน Lobster ย้าย orchestration นั้นไปไว้ใน runtime แบบมีชนิด:

- **เรียกครั้งเดียวแทนหลายครั้ง**: OpenClaw รันการเรียกเครื่องมือ Lobster เพียงครั้งเดียวและได้ผลลัพธ์แบบมีโครงสร้าง
- **มีการอนุมัติในตัว**: side effects (ส่งอีเมล โพสต์คอมเมนต์) จะหยุด workflow จนกว่าจะได้รับการอนุมัติอย่างชัดเจน
- **กลับมาทำต่อได้**: workflows ที่หยุดไว้จะคืน token; อนุมัติแล้วทำต่อได้โดยไม่ต้องรันทุกอย่างใหม่

## ทำไมใช้ DSL แทนโปรแกรมธรรมดา?

Lobster ถูกตั้งใจให้เล็ก เป้าหมายไม่ใช่ "ภาษาใหม่" แต่เป็น spec ของ pipeline ที่คาดการณ์ได้และเป็นมิตรกับ AI พร้อมการอนุมัติและ resume tokens เป็นความสามารถหลัก

- **approve/resume มีในตัว**: โปรแกรมปกติสามารถถามมนุษย์ได้ แต่ไม่สามารถ _หยุดชั่วคราวแล้วกลับมาทำต่อ_ ด้วย token ที่คงทนได้โดยที่คุณไม่สร้าง runtime นั้นเอง
- **ความกำหนดผลได้แน่นอน + การตรวจสอบย้อนหลัง**: Pipelines เป็นข้อมูล จึงง่ายต่อการ log, diff, replay และ review
- **พื้นผิวที่จำกัดสำหรับ AI**: grammar ขนาดเล็ก + JSON piping ลดเส้นทางโค้ดที่ “สร้างสรรค์” เกินไป และทำให้การตรวจสอบเป็นไปได้จริง
- **มีนโยบายความปลอดภัยในตัว**: timeouts, output caps, sandbox checks และ allowlists ถูกบังคับใช้โดย runtime ไม่ใช่แต่ละ script
- **ยังเขียนโปรแกรมได้**: แต่ละ step สามารถเรียก CLI หรือ script ใดก็ได้ หากคุณต้องการ JS/TS ให้ generate ไฟล์ `.lobster` จากโค้ด

## ทำงานอย่างไร

OpenClaw รัน Lobster workflows **ใน process** โดยใช้ runner แบบฝังตัว ไม่มีการ spawn subprocess ของ CLI ภายนอก; workflow engine ทำงานภายใน gateway process และคืน JSON envelope โดยตรง
หาก pipeline หยุดเพื่อรออนุมัติ เครื่องมือจะคืน `resumeToken` เพื่อให้คุณทำต่อภายหลังได้

## รูปแบบ: CLI ขนาดเล็ก + JSON pipes + การอนุมัติ

สร้างคำสั่งเล็ก ๆ ที่สื่อสารด้วย JSON แล้วเชื่อมต่อเข้าด้วยกันเป็นการเรียก Lobster ครั้งเดียว (ชื่อตัวอย่างคำสั่งด้านล่าง — เปลี่ยนเป็นของคุณเองได้)

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

หาก pipeline ขอการอนุมัติ ให้ resume ด้วย token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI กระตุ้น workflow; Lobster ดำเนินการตาม steps ประตูอนุมัติช่วยให้ side effects ชัดเจนและตรวจสอบย้อนหลังได้

ตัวอย่าง: map input items เป็น tool calls:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## ขั้นตอน LLM แบบ JSON เท่านั้น (llm-task)

สำหรับ workflows ที่ต้องมี **ขั้นตอน LLM แบบมีโครงสร้าง** ให้เปิดใช้เครื่องมือ Plugin เสริม
`llm-task` แล้วเรียกจาก Lobster วิธีนี้ช่วยให้ workflow
ยังคงกำหนดผลได้แน่นอน ในขณะที่ยังสามารถจำแนก/สรุป/ร่างข้อความด้วยโมเดลได้

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
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

ใช้ใน pipeline:

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

## ไฟล์ Workflow (.lobster)

Lobster สามารถรันไฟล์ workflow แบบ YAML/JSON ที่มีฟิลด์ `name`, `args`, `steps`, `env`, `condition` และ `approval` ในการเรียกเครื่องมือ OpenClaw ให้ตั้ง `pipeline` เป็น path ของไฟล์

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

- `stdin: $step.stdout` และ `stdin: $step.json` ส่ง output ของ step ก่อนหน้า
- `condition` (หรือ `when`) สามารถใช้ gate steps ตาม `$step.approved`

## ติดตั้ง Lobster

Lobster workflows ที่ bundled มาจะรันใน process; ไม่จำเป็นต้องมี binary `lobster` แยกต่างหาก runner แบบฝังตัวมาพร้อมกับ Plugin Lobster

หากคุณต้องการ standalone Lobster CLI สำหรับการพัฒนาหรือ pipelines ภายนอก ให้ติดตั้งจาก [Lobster repo](https://github.com/openclaw/lobster) และตรวจสอบให้แน่ใจว่า `lobster` อยู่บน `PATH`

## เปิดใช้เครื่องมือ

Lobster เป็นเครื่องมือ Plugin แบบ **เสริม** (ไม่ได้เปิดใช้เป็นค่าเริ่มต้น)

แนะนำ (เพิ่มแบบ additive, ปลอดภัย):

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
Allowlists เป็นแบบ opt-in สำหรับ Plugins เสริม หาก allowlist ของคุณระบุเฉพาะเครื่องมือ Plugin (เช่น `lobster`) OpenClaw จะยังเปิดใช้เครื่องมือ core ต่อไป หากต้องการจำกัดเครื่องมือ core ด้วย ให้ใส่เครื่องมือ core หรือ groups ที่คุณต้องการไว้ใน allowlist ด้วย
</Note>

## ตัวอย่าง: การคัดแยกอีเมล

ไม่มี Lobster:

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

มี Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

คืน JSON envelope (ตัดทอน):

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

ผู้ใช้อนุมัติ → resume:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

หนึ่ง workflow กำหนดผลได้แน่นอน ปลอดภัย

## พารามิเตอร์ของเครื่องมือ

### `run`

รัน pipeline ในโหมดเครื่องมือ

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

รันไฟล์ workflow พร้อม args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

ทำ workflow ที่หยุดไว้ต่อหลังการอนุมัติ

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### อินพุตเสริม

- `cwd`: working directory แบบ relative สำหรับ pipeline (ต้องอยู่ภายใน gateway working directory)
- `timeoutMs`: ยกเลิก workflow หากเกินระยะเวลานี้ (ค่าเริ่มต้น: 20000)
- `maxStdoutBytes`: ยกเลิก workflow หาก output เกินขนาดนี้ (ค่าเริ่มต้น: 512000)
- `argsJson`: สตริง JSON ที่ส่งให้ `lobster run --args-json` (เฉพาะไฟล์ workflow)

## Output envelope

Lobster คืน JSON envelope พร้อมหนึ่งในสามสถานะ:

- `ok` → เสร็จสมบูรณ์สำเร็จ
- `needs_approval` → หยุดชั่วคราว; ต้องใช้ `requiresApproval.resumeToken` เพื่อ resume
- `cancelled` → ถูกปฏิเสธหรือยกเลิกอย่างชัดเจน

เครื่องมือแสดง envelope ทั้งใน `content` (JSON ที่จัดรูปแบบให้อ่านง่าย) และ `details` (object ดิบ)

## การอนุมัติ

หากมี `requiresApproval` ให้ตรวจ prompt แล้วตัดสินใจ:

- `approve: true` → resume และดำเนิน side effects ต่อ
- `approve: false` → ยกเลิกและ finalize workflow

ใช้ `approve --preview-from-stdin --limit N` เพื่อแนบ JSON preview กับคำขออนุมัติโดยไม่ต้องใช้ jq/heredoc glue แบบกำหนดเอง Resume tokens ตอนนี้มีขนาดกะทัดรัด: Lobster เก็บสถานะ resume ของ workflow ไว้ใต้ state dir ของตัวเองและส่งคืน token key ขนาดเล็ก

## OpenProse

OpenProse ทำงานร่วมกับ Lobster ได้ดี: ใช้ `/prose` เพื่อจัด orchestration การเตรียมงานหลาย agent แล้วรัน Lobster pipeline สำหรับการอนุมัติที่กำหนดผลได้แน่นอน หากโปรแกรม Prose ต้องใช้ Lobster ให้ allow เครื่องมือ `lobster` สำหรับ sub-agents ผ่าน `tools.subagents.tools` ดู [OpenProse](/th/prose)

## ความปลอดภัย

- **เฉพาะ local ใน process เท่านั้น** — workflows ดำเนินการภายใน gateway process; ไม่มี network calls จากตัว Plugin เอง
- **ไม่มี secrets** — Lobster ไม่จัดการ OAuth; แต่เรียกเครื่องมือ OpenClaw ที่จัดการสิ่งนั้น
- **รับรู้ sandbox** — ปิดใช้งานเมื่อ context ของเครื่องมืออยู่ใน sandbox
- **เสริมความแข็งแรงแล้ว** — timeouts และ output caps ถูกบังคับใช้โดย runner แบบฝังตัว

## การแก้ไขปัญหา

- **`lobster timed out`** → เพิ่ม `timeoutMs` หรือแยก pipeline ที่ยาวออก
- **`lobster output exceeded maxStdoutBytes`** → เพิ่ม `maxStdoutBytes` หรือลดขนาด output
- **`lobster returned invalid JSON`** → ตรวจสอบให้แน่ใจว่า pipeline รันในโหมดเครื่องมือและพิมพ์เฉพาะ JSON
- **`lobster failed`** → ตรวจ gateway logs สำหรับรายละเอียดข้อผิดพลาดของ runner แบบฝังตัว

## เรียนรู้เพิ่มเติม

- [Plugins](/th/tools/plugin)
- [การสร้างเครื่องมือ Plugin](/th/plugins/building-plugins#registering-agent-tools)

## กรณีศึกษา: workflows ของชุมชน

ตัวอย่างสาธารณะหนึ่งรายการ: CLI แบบ “second brain” + Lobster pipelines ที่จัดการ Markdown vaults สามชุด (ส่วนตัว, คู่ชีวิต, แชร์ร่วมกัน) CLI ส่งออก JSON สำหรับสถิติ รายการ inbox และ stale scans; Lobster เชื่อมคำสั่งเหล่านั้นเป็น workflows เช่น `weekly-review`, `inbox-triage`, `memory-consolidation` และ `shared-task-sync` โดยแต่ละ workflow มีประตูอนุมัติ AI จัดการการใช้วิจารณญาณ (การจัดหมวดหมู่) เมื่อพร้อมใช้งาน และ fallback เป็นกฎที่กำหนดผลได้แน่นอนเมื่อไม่พร้อม

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ที่เกี่ยวข้อง

- [Automation และ Tasks](/th/automation) — การตั้งเวลา Lobster workflows
- [ภาพรวม Automation](/th/automation) — กลไก automation ทั้งหมด
- [ภาพรวม Tools](/th/tools) — เครื่องมือ agent ทั้งหมดที่พร้อมใช้งาน
