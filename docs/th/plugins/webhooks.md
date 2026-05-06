---
read_when:
    - คุณต้องการเรียกใช้หรือควบคุม TaskFlow จากระบบภายนอก
    - คุณกำลังกำหนดค่า Plugin webhooks ที่รวมมาให้
summary: 'Plugin Webhooks: ทางเข้า TaskFlow ที่ผ่านการยืนยันตัวตนสำหรับระบบอัตโนมัติภายนอกที่เชื่อถือได้'
title: Plugin สำหรับ Webhook
x-i18n:
    generated_at: "2026-05-06T18:00:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks เพิ่มเส้นทาง HTTP ที่ผ่านการยืนยันตัวตน ซึ่งผูกระบบอัตโนมัติภายนอกเข้ากับ OpenClaw TaskFlows

ใช้เมื่อคุณต้องการให้ระบบที่เชื่อถือได้ เช่น Zapier, n8n, งาน CI หรือบริการภายใน สร้างและขับเคลื่อน TaskFlows ที่มีการจัดการ โดยไม่ต้องเขียน Plugin แบบกำหนดเองก่อน

## ตำแหน่งที่รัน

Plugin Webhooks รันอยู่ภายในโปรเซส Gateway

หาก Gateway ของคุณรันบนเครื่องอื่น ให้ติดตั้งและกำหนดค่า Plugin บนโฮสต์ Gateway นั้น จากนั้นรีสตาร์ต Gateway

## กำหนดค่าเส้นทาง

ตั้งค่าคอนฟิกภายใต้ `plugins.entries.webhooks.config`:

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
- `controllerId`: id ของ controller สำหรับโฟลว์ที่มีการจัดการซึ่งสร้างขึ้น ไม่บังคับ
- `description`: หมายเหตุสำหรับผู้ปฏิบัติงาน ไม่บังคับ

อินพุต `secret` ที่รองรับ:

- สตริงธรรมดา
- SecretRef พร้อม `source: "env" | "file" | "exec"`

หากเส้นทางที่ใช้ secret ไม่สามารถแก้ค่า secret ได้เมื่อเริ่มต้น Plugin จะข้ามเส้นทางนั้นและบันทึกคำเตือนแทนการเปิด endpoint ที่เสีย

## โมเดลความปลอดภัย

แต่ละเส้นทางได้รับความไว้วางใจให้ดำเนินการด้วยสิทธิ์ TaskFlow ของ `sessionKey` ที่กำหนดค่าไว้

ซึ่งหมายความว่าเส้นทางสามารถตรวจสอบและแก้ไข TaskFlows ที่เซสชันนั้นเป็นเจ้าของได้ ดังนั้นคุณควร:

- ใช้ secret ที่รัดกุมและไม่ซ้ำกันต่อเส้นทาง
- เลือกใช้การอ้างอิง secret แทน secret แบบข้อความธรรมดาในบรรทัด
- ผูกเส้นทางเข้ากับเซสชันที่แคบที่สุดซึ่งเหมาะกับ workflow
- เปิดเผยเฉพาะ path ของ Webhook ที่คุณต้องการ

Plugin ใช้:

- การยืนยันตัวตนด้วย shared-secret
- ตัวป้องกันขนาด request body และ timeout
- การจำกัดอัตราแบบ fixed-window
- การจำกัด request ที่กำลังดำเนินอยู่
- การเข้าถึง TaskFlow ที่ผูกกับเจ้าของผ่าน `api.runtime.tasks.managedFlows.bindSession(...)`

## รูปแบบ request

ส่ง request แบบ `POST` พร้อม:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` หรือ `x-openclaw-webhook-secret: <secret>`

ตัวอย่าง:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## การดำเนินการที่รองรับ

ขณะนี้ Plugin รับค่า JSON `action` ต่อไปนี้:

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

runtime ที่อนุญาตคือ:

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

## รูปทรงของ response

response ที่สำเร็จจะส่งคืน:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

request ที่ถูกปฏิเสธจะส่งคืน:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin ตั้งใจล้าง metadata ของเจ้าของ/เซสชันออกจาก response ของ Webhook

## เอกสารที่เกี่ยวข้อง

- [SDK runtime ของ Plugin](/th/plugins/sdk-runtime)
- [ภาพรวม hooks และ webhooks](/th/automation/hooks)
- [Webhooks ของ CLI](/th/cli/webhooks)
