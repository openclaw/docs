---
read_when:
    - คุณต้องการเวิร์กโฟลว์หลายขั้นตอนที่กำหนดผลได้แน่นอนพร้อมการอนุมัติที่ชัดเจน
    - คุณต้องกลับมาดำเนินเวิร์กโฟลว์ต่อโดยไม่ต้องเรียกใช้ขั้นตอนก่อนหน้าซ้ำ
summary: รันไทม์เวิร์กโฟลว์แบบมีชนิดสำหรับ OpenClaw พร้อมจุดตรวจการอนุมัติที่กลับมาดำเนินการต่อได้.
title: กุ้งมังกร
x-i18n:
    generated_at: "2026-05-07T13:27:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster เป็นเชลล์เวิร์กโฟลว์ที่ให้ OpenClaw เรียกใช้ลำดับเครื่องมือหลายขั้นตอนเป็นการดำเนินการเดียวที่กำหนดผลได้แน่นอน พร้อมจุดตรวจการอนุมัติที่ชัดเจน.

Lobster เป็นชั้นการเขียนที่อยู่เหนือกว่างานเบื้องหลังแบบแยกออกหนึ่งชั้น. สำหรับการจัดลำดับโฟลว์เหนือกว่างานแต่ละรายการ โปรดดู [โฟลว์งาน](/th/automation/taskflow) (`openclaw tasks flow`). สำหรับบันทึกกิจกรรมงาน โปรดดู [`openclaw tasks`](/th/automation/tasks).

## Hook

ผู้ช่วยของคุณสามารถสร้างเครื่องมือที่ใช้จัดการตัวเองได้. ขอเวิร์กโฟลว์หนึ่งรายการ แล้วอีก 30 นาทีต่อมาคุณจะได้ CLI พร้อมไปป์ไลน์ที่ทำงานเป็นการเรียกครั้งเดียว. Lobster คือชิ้นส่วนที่ขาดหายไป: ไปป์ไลน์ที่กำหนดผลได้แน่นอน, การอนุมัติที่ชัดเจน, และสถานะที่ดำเนินต่อได้.

## ทำไม

ปัจจุบัน เวิร์กโฟลว์ที่ซับซ้อนต้องใช้การเรียกเครื่องมือโต้ตอบไปมาหลายครั้ง. การเรียกแต่ละครั้งใช้โทเค็น และ LLM ต้องจัดลำดับทุกขั้นตอน. Lobster ย้ายการจัดลำดับนั้นเข้าไปในรันไทม์ที่มีชนิดข้อมูล:

- **เรียกครั้งเดียวแทนหลายครั้ง**: OpenClaw เรียกเครื่องมือ Lobster ครั้งเดียวและได้ผลลัพธ์แบบมีโครงสร้าง.
- **มีการอนุมัติในตัว**: ผลข้างเคียง (ส่งอีเมล, โพสต์ความคิดเห็น) จะหยุดเวิร์กโฟลว์ไว้จนกว่าจะได้รับการอนุมัติอย่างชัดเจน.
- **ดำเนินต่อได้**: เวิร์กโฟลว์ที่หยุดไว้จะส่งคืนโทเค็น; อนุมัติแล้วดำเนินต่อได้โดยไม่ต้องเรียกทุกอย่างใหม่.

## ทำไมใช้ DSL แทนโปรแกรมทั่วไป?

Lobster ถูกตั้งใจให้ออกมาเล็ก. เป้าหมายไม่ใช่ "ภาษาใหม่" แต่เป็นสเปกไปป์ไลน์ที่คาดการณ์ได้และเป็นมิตรกับ AI พร้อมการอนุมัติและโทเค็นดำเนินต่อเป็นองค์ประกอบหลัก.

- **การอนุมัติ/ดำเนินต่อมีในตัว**: โปรแกรมปกติสามารถถามมนุษย์ได้ แต่ไม่สามารถ _หยุดพักและดำเนินต่อ_ ด้วยโทเค็นที่คงทนโดยที่คุณไม่ต้องสร้างรันไทม์นั้นเอง.
- **กำหนดผลได้แน่นอน + ตรวจสอบย้อนหลังได้**: ไปป์ไลน์เป็นข้อมูล จึงบันทึก, เปรียบเทียบความแตกต่าง, เล่นซ้ำ, และตรวจทานได้ง่าย.
- **พื้นผิวที่จำกัดสำหรับ AI**: ไวยากรณ์ขนาดเล็ก + การส่งต่อข้อมูลแบบ JSON ผ่านไปป์ช่วยลดเส้นทางโค้ดที่คาดเดายากและทำให้การตรวจสอบความถูกต้องทำได้จริง.
- **นโยบายความปลอดภัยฝังอยู่ในตัว**: การหมดเวลา, เพดานเอาต์พุต, การตรวจสอบแซนด์บ็อกซ์, และรายการอนุญาตถูกบังคับใช้โดยรันไทม์ ไม่ใช่โดยแต่ละสคริปต์.
- **ยังเขียนโปรแกรมได้**: แต่ละขั้นตอนเรียก CLI หรือสคริปต์ใดก็ได้. ถ้าคุณต้องการ JS/TS ให้สร้างไฟล์ `.lobster` จากโค้ด.

## ทำงานอย่างไร

OpenClaw เรียกใช้เวิร์กโฟลว์ Lobster **ในโปรเซส** ด้วยรันเนอร์แบบฝังตัว. ไม่มีการสร้าง subprocess CLI ภายนอก; เอนจินเวิร์กโฟลว์ทำงานภายในกระบวนการ Gateway และส่งคืนซองข้อมูล JSON โดยตรง.
ถ้าไปป์ไลน์หยุดพักเพื่อขออนุมัติ เครื่องมือจะส่งคืน `resumeToken` เพื่อให้คุณดำเนินต่อภายหลังได้.

## รูปแบบ: CLI ขนาดเล็ก + ไปป์ JSON + การอนุมัติ

สร้างคำสั่งขนาดเล็กที่สื่อสารด้วย JSON แล้วเชื่อมเข้าด้วยกันเป็นการเรียก Lobster ครั้งเดียว. (ชื่อคำสั่งตัวอย่างด้านล่าง - เปลี่ยนเป็นของคุณเอง.)

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

ถ้าไปป์ไลน์ขออนุมัติ ให้ดำเนินต่อด้วยโทเค็น:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI ทริกเกอร์เวิร์กโฟลว์; Lobster ดำเนินขั้นตอนต่างๆ. ด่านอนุมัติทำให้ผลข้างเคียงชัดเจนและตรวจสอบย้อนหลังได้.

ตัวอย่าง: จับคู่รายการอินพุตเป็นการเรียกเครื่องมือ:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## ขั้นตอน LLM แบบใช้ JSON เท่านั้น (llm-task)

สำหรับเวิร์กโฟลว์ที่ต้องมี **ขั้นตอน LLM แบบมีโครงสร้าง** ให้เปิดใช้เครื่องมือ Plugin ทางเลือก
`llm-task` แล้วเรียกจาก Lobster. วิธีนี้ทำให้เวิร์กโฟลว์
กำหนดผลได้แน่นอน ในขณะที่ยังให้คุณจัดประเภท/สรุป/ร่างด้วยโมเดลได้.

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

### ข้อจำกัดสำคัญ: Lobster แบบฝังตัว เทียบกับ `openclaw.invoke`

Plugin Lobster ที่รวมมาจะเรียกใช้เวิร์กโฟลว์ **ในโปรเซส** ภายใน Gateway. ในโหมดฝังตัวนั้น `openclaw.invoke` จะ **ไม่** สืบทอด URL/คอนเท็กซ์การตรวจสอบสิทธิ์ของ Gateway สำหรับการเรียกเครื่องมือ OpenClaw CLI แบบซ้อนโดยอัตโนมัติ.

นั่นหมายความว่ารูปแบบนี้ **ยังไม่น่าเชื่อถือในรันเนอร์แบบฝังตัวในปัจจุบัน**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

ใช้ตัวอย่างด้านล่างเฉพาะเมื่อเรียกใช้ **Lobster CLI แบบสแตนด์อโลน** ในสภาพแวดล้อมที่ `openclaw.invoke` ถูกกำหนดค่าด้วยคอนเท็กซ์ Gateway/การตรวจสอบสิทธิ์ที่ถูกต้องอยู่แล้ว.

ใช้ในไปป์ไลน์ Lobster CLI แบบสแตนด์อโลน:

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

ถ้าคุณกำลังใช้ Plugin Lobster แบบฝังตัวในปัจจุบัน ให้เลือกอย่างใดอย่างหนึ่ง:

- เรียกเครื่องมือ `llm-task` โดยตรงนอก Lobster, หรือ
- ใช้ขั้นตอนที่ไม่ใช่ `openclaw.invoke` ภายในไปป์ไลน์ Lobster จนกว่าจะเพิ่มบริดจ์แบบฝังตัวที่รองรับแล้ว.

ดูรายละเอียดและตัวเลือกการกำหนดค่าได้ที่ [งาน LLM](/th/tools/llm-task).

## ไฟล์เวิร์กโฟลว์ (.lobster)

Lobster สามารถเรียกใช้ไฟล์เวิร์กโฟลว์ YAML/JSON ที่มีฟิลด์ `name`, `args`, `steps`, `env`, `condition`, และ `approval`. ในการเรียกเครื่องมือ OpenClaw ให้ตั้ง `pipeline` เป็นพาธไฟล์.

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

- `stdin: $step.stdout` และ `stdin: $step.json` ส่งเอาต์พุตของขั้นตอนก่อนหน้า.
- `condition` (หรือ `when`) สามารถใช้เป็นด่านให้ขั้นตอนทำงานตาม `$step.approved`.

## ติดตั้ง Lobster

เวิร์กโฟลว์ Lobster ที่รวมมาจะทำงานในโปรเซส; ไม่จำเป็นต้องมีไบนารี `lobster` แยกต่างหาก. รันเนอร์แบบฝังตัวมาพร้อมกับ Plugin Lobster.

ถ้าคุณต้องใช้ Lobster CLI แบบสแตนด์อโลนสำหรับการพัฒนาหรือไปป์ไลน์ภายนอก ให้ติดตั้งจาก [รีโป Lobster](https://github.com/openclaw/lobster) และตรวจให้แน่ใจว่า `lobster` อยู่ใน `PATH`.

## เปิดใช้เครื่องมือ

Lobster เป็นเครื่องมือ Plugin **ทางเลือก** (ไม่ได้เปิดใช้โดยค่าเริ่มต้น).

แนะนำ (เพิ่มเข้าไป, ปลอดภัย):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

หรือกำหนดต่อเอเจนต์:

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

หลีกเลี่ยงการใช้ `tools.allow: ["lobster"]` เว้นแต่คุณตั้งใจจะทำงานในโหมดรายการอนุญาตแบบจำกัด.

<Note>
รายการอนุญาตเป็นแบบเลือกใช้สำหรับ Plugin ทางเลือก. `alsoAllow` เปิดใช้เฉพาะเครื่องมือ Plugin ทางเลือกที่ระบุชื่อไว้ ขณะยังคงชุดเครื่องมือหลักตามปกติ. หากต้องการจำกัดเครื่องมือหลัก ให้ใช้ `tools.allow` กับเครื่องมือหรือกลุ่มหลักที่คุณต้องการ.
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

เมื่อใช้ Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

ส่งคืนซองข้อมูล JSON (ตัดทอนแล้ว):

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

ผู้ใช้อนุมัติ → ดำเนินต่อ:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

เวิร์กโฟลว์เดียว. กำหนดผลได้แน่นอน. ปลอดภัย.

## พารามิเตอร์เครื่องมือ

### `run`

เรียกใช้ไปป์ไลน์ในโหมดเครื่องมือ.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

เรียกใช้ไฟล์เวิร์กโฟลว์พร้อมอาร์กิวเมนต์:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

ดำเนินเวิร์กโฟลว์ที่หยุดไว้ต่อหลังการอนุมัติ.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### อินพุตทางเลือก

- `cwd`: ไดเรกทอรีทำงานแบบสัมพัทธ์สำหรับไปป์ไลน์ (ต้องอยู่ภายในไดเรกทอรีทำงานของ Gateway).
- `timeoutMs`: ยกเลิกเวิร์กโฟลว์หากเกินระยะเวลานี้ (ค่าเริ่มต้น: 20000).
- `maxStdoutBytes`: ยกเลิกเวิร์กโฟลว์หากเอาต์พุตเกินขนาดนี้ (ค่าเริ่มต้น: 512000).
- `argsJson`: สตริง JSON ที่ส่งให้ `lobster run --args-json` (สำหรับไฟล์เวิร์กโฟลว์เท่านั้น).

## ซองข้อมูลเอาต์พุต

Lobster ส่งคืนซองข้อมูล JSON ที่มีหนึ่งในสามสถานะ:

- `ok` → เสร็จสำเร็จ
- `needs_approval` → หยุดพัก; ต้องใช้ `requiresApproval.resumeToken` เพื่อดำเนินต่อ
- `cancelled` → ถูกปฏิเสธหรือยกเลิกอย่างชัดเจน

เครื่องมือแสดงซองข้อมูลทั้งใน `content` (JSON ที่จัดให้อ่านง่าย) และ `details` (อ็อบเจ็กต์ดิบ).

## การอนุมัติ

ถ้ามี `requiresApproval` ให้ตรวจข้อความแจ้งและตัดสินใจ:

- `approve: true` → ดำเนินต่อและทำผลข้างเคียงต่อไป
- `approve: false` → ยกเลิกและสรุปเวิร์กโฟลว์ให้เสร็จสิ้น

ใช้ `approve --preview-from-stdin --limit N` เพื่อแนบตัวอย่าง JSON เข้ากับคำขออนุมัติโดยไม่ต้องใช้การต่อประกอบ `jq`/heredoc แบบกำหนดเอง. ตอนนี้โทเค็นดำเนินต่อมีขนาดกะทัดรัด: Lobster เก็บสถานะดำเนินต่อของเวิร์กโฟลว์ไว้ใต้ไดเรกทอรีสถานะของตัวเองและส่งคืนคีย์โทเค็นขนาดเล็ก.

## OpenProse

OpenProse ทำงานเข้าคู่กับ Lobster ได้ดี: ใช้ `/prose` เพื่อจัดลำดับการเตรียมงานหลายเอเจนต์ แล้วเรียกไปป์ไลน์ Lobster สำหรับการอนุมัติที่กำหนดผลได้แน่นอน. ถ้าโปรแกรม Prose ต้องใช้ Lobster ให้อนุญาตเครื่องมือ `lobster` สำหรับเอเจนต์ย่อยผ่าน `tools.subagents.tools`. ดู [OpenProse](/th/prose).

## ความปลอดภัย

- **เฉพาะในโปรเซสแบบภายในเครื่องเท่านั้น** - เวิร์กโฟลว์ทำงานภายในกระบวนการ Gateway; ไม่มีการเรียกเครือข่ายจากตัว Plugin เอง.
- **ไม่มีข้อมูลลับ** - Lobster ไม่ได้จัดการ OAuth; มันเรียกเครื่องมือ OpenClaw ที่ทำเรื่องนั้น.
- **รับรู้แซนด์บ็อกซ์** - ปิดใช้งานเมื่อคอนเท็กซ์เครื่องมืออยู่ในแซนด์บ็อกซ์.
- **เสริมความแข็งแรง** - การหมดเวลาและเพดานเอาต์พุตถูกบังคับใช้โดยรันเนอร์แบบฝังตัว.

## การแก้ปัญหา

- **`lobster timed out`** → เพิ่ม `timeoutMs` หรือแยกไปป์ไลน์ยาวออกเป็นส่วนๆ.
- **`lobster output exceeded maxStdoutBytes`** → เพิ่ม `maxStdoutBytes` หรือลดขนาดเอาต์พุต.
- **`lobster returned invalid JSON`** → ตรวจให้แน่ใจว่าไปป์ไลน์ทำงานในโหมดเครื่องมือและพิมพ์เฉพาะ JSON.
- **`lobster failed`** → ตรวจบันทึกของ Gateway เพื่อดูรายละเอียดข้อผิดพลาดจากรันเนอร์แบบฝังตัว.

## เรียนรู้เพิ่มเติม

- [Plugin](/th/tools/plugin)
- [การเขียนเครื่องมือ Plugin](/th/plugins/building-plugins#registering-agent-tools)

## กรณีศึกษา: เวิร์กโฟลว์จากชุมชน

ตัวอย่างสาธารณะหนึ่งรายการ: CLI "สมองที่สอง" + ไปป์ไลน์ Lobster ที่จัดการคลัง Markdown สามคลัง (ส่วนตัว, ของคู่, ใช้ร่วมกัน). CLI ปล่อย JSON สำหรับสถิติ, รายการกล่องขาเข้า, และการสแกนสิ่งที่ค้างเก่า; Lobster เชื่อมคำสั่งเหล่านั้นเป็นเวิร์กโฟลว์ เช่น `weekly-review`, `inbox-triage`, `memory-consolidation`, และ `shared-task-sync` โดยแต่ละรายการมีด่านอนุมัติ. AI จัดการการตัดสินใจ (การจัดประเภท) เมื่อพร้อมใช้งาน และถอยกลับไปใช้กฎที่กำหนดผลได้แน่นอนเมื่อไม่พร้อมใช้งาน.

- เธรด: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- รีโป: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) - การจัดกำหนดการเวิร์กโฟลว์ Lobster
- [ภาพรวมระบบอัตโนมัติ](/th/automation) - กลไกระบบอัตโนมัติทั้งหมด
- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือเอเจนต์ที่มีทั้งหมด
