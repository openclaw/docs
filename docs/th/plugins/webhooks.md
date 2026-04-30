---
read_when:
    - คุณต้องการเรียกใช้หรือควบคุมการทำงานของ TaskFlows จากระบบภายนอก
    - คุณกำลังกำหนดค่า Plugin Webhook ที่รวมมาให้
summary: 'Plugin Webhooks: ช่องทางขาเข้า TaskFlow ที่ผ่านการยืนยันตัวตนสำหรับระบบอัตโนมัติภายนอกที่เชื่อถือได้'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-04-30T10:10:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhook (Plugin)

Plugin Webhooks เพิ่มเส้นทาง HTTP ที่ผ่านการยืนยันตัวตน ซึ่งผูกระบบอัตโนมัติภายนอกเข้ากับ OpenClaw TaskFlows

ใช้เมื่อคุณต้องการให้ระบบที่เชื่อถือได้ เช่น Zapier, n8n, งาน CI หรือบริการภายใน สร้างและขับเคลื่อน TaskFlows ที่มีการจัดการโดยไม่ต้องเขียน Plugin แบบกำหนดเองก่อน

## ทำงานที่ไหน

Plugin Webhooks ทำงานภายในกระบวนการ Gateway

หาก Gateway ของคุณทำงานบนเครื่องอื่น ให้ติดตั้งและกำหนดค่า Plugin บนโฮสต์ Gateway นั้น แล้วรีสตาร์ต Gateway

## กำหนดค่าเส้นทาง

ตั้งค่าการกำหนดค่าภายใต้ `plugins.entries.webhooks.config`:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

ฟิลด์ของเส้นทาง:

- `enabled`: ไม่บังคับ ค่าเริ่มต้นคือ `true`
- `path`: ไม่บังคับ ค่าเริ่มต้นคือ `/plugins/webhooks/<routeId>`
- `sessionKey`: เซสชันที่จำเป็น ซึ่งเป็นเจ้าของ TaskFlows ที่ผูกไว้
- `secret`: shared secret หรือ SecretRef ที่จำเป็น
- `controllerId`: id ของคอนโทรลเลอร์ที่ไม่บังคับ สำหรับโฟลว์ที่มีการจัดการซึ่งสร้างขึ้น
- `description`: บันทึกสำหรับผู้ปฏิบัติงานที่ไม่บังคับ

อินพุต `secret` ที่รองรับ:

- สตริงธรรมดา
- SecretRef พร้อม `source: "env" | "file" | "exec"`

หากเส้นทางที่ใช้ secret ไม่สามารถ resolve secret ได้ตอนเริ่มต้น Plugin จะข้ามเส้นทางนั้นและบันทึกคำเตือนแทนการเปิดเผย endpoint ที่เสีย

## โมเดลความปลอดภัย

แต่ละเส้นทางได้รับความไว้วางใจให้ดำเนินการด้วยสิทธิ์ TaskFlow ของ `sessionKey` ที่กำหนดค่าไว้

ซึ่งหมายความว่าเส้นทางสามารถตรวจสอบและเปลี่ยนแปลง TaskFlows ที่เซสชันนั้นเป็นเจ้าของได้ ดังนั้นคุณควร:

- ใช้ secret ที่แข็งแรงและไม่ซ้ำกันสำหรับแต่ละเส้นทาง
- เลือกใช้การอ้างอิง secret แทน secret แบบข้อความล้วนที่เขียนไว้โดยตรง
- ผูกเส้นทางกับเซสชันที่แคบที่สุดซึ่งเหมาะกับเวิร์กโฟลว์
- เปิดเผยเฉพาะเส้นทาง Webhook ที่คุณต้องใช้

Plugin ใช้:

- การยืนยันตัวตนด้วย shared-secret
- การป้องกันขนาดเนื้อหาคำขอและ timeout
- การจำกัดอัตราแบบ fixed-window
- การจำกัดคำขอที่กำลังดำเนินการ
- การเข้าถึง TaskFlow ที่ผูกกับเจ้าของผ่าน `api.runtime.tasks.managedFlows.bindSession(...)`

## รูปแบบคำขอ

ส่งคำขอ `POST` พร้อม:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` หรือ `x-openclaw-webhook-secret: <secret>`

ตัวอย่าง:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## แอ็กชันที่รองรับ

ปัจจุบัน Plugin ยอมรับค่า JSON `action` เหล่านี้:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

สร้าง TaskFlow ที่มีการจัดการสำหรับเซสชันที่ผูกกับเส้นทาง

ตัวอย่าง:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

สร้างงานลูกที่มีการจัดการภายใน TaskFlow ที่มีการจัดการซึ่งมีอยู่แล้ว

รันไทม์ที่อนุญาตคือ:

- `subagent`
- `acp`

ตัวอย่าง:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## รูปแบบการตอบกลับ

การตอบกลับที่สำเร็จจะส่งคืน:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

คำขอที่ถูกปฏิเสธจะส่งคืน:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin จงใจลบข้อมูลเมตาของเจ้าของ/เซสชันออกจากการตอบกลับ Webhook

## เอกสารที่เกี่ยวข้อง

- [SDK รันไทม์ของ Plugin](/th/plugins/sdk-runtime)
- [ภาพรวม hooks และ Webhook](/th/automation/hooks)
- [Webhook ของ CLI](/th/cli/webhooks)
