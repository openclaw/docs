---
read_when:
    - คุณต้องการทริกเกอร์หรือควบคุม TaskFlow จากระบบภายนอก
    - คุณกำลังกำหนดค่า Plugin Webhook ที่มาพร้อมกับระบบ
summary: 'Plugin Webhooks: ช่องทางรับข้อมูลเข้า TaskFlow ที่ผ่านการยืนยันตัวตนสำหรับระบบอัตโนมัติภายนอกที่เชื่อถือได้'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-07-12T16:37:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks เพิ่มเส้นทาง HTTP ที่มีการยืนยันตัวตน เพื่อให้ระบบภายนอกที่เชื่อถือได้
(Zapier, n8n, งาน CI, บริการภายใน) สามารถสร้างและควบคุม
TaskFlow ของ OpenClaw ที่มีการจัดการผ่าน HTTP ได้ โดยไม่ต้องเขียน Plugin แบบกำหนดเอง

Plugin ทำงานภายในโปรเซส Gateway สำหรับ Gateway ระยะไกล ให้ติดตั้งและ
กำหนดค่าบนโฮสต์นั้น แล้วเริ่ม Gateway ใหม่ เมื่อเริ่มต้นจะไม่มีการกำหนดค่าเส้นทางใด
ดังนั้นจะไม่ดำเนินการใดๆ จนกว่าคุณจะเพิ่มเส้นทางอย่างน้อยหนึ่งรายการ

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
              description: "สะพานเชื่อม TaskFlow ของ Zapier",
            },
          },
        },
      },
    },
  },
}
```

ฟิลด์ของเส้นทาง:

| ฟิลด์         | จำเป็น | ค่าเริ่มต้น                  | หมายเหตุ                                             |
| ------------- | ------ | ---------------------------- | ---------------------------------------------------- |
| `enabled`      | ไม่   | `true`                       |                                                      |
| `path`         | ไม่   | `/plugins/webhooks/<routeId>` | ต้องไม่ซ้ำกันในทุกเส้นทาง                            |
| `sessionKey`   | ใช่   | -                            | เซสชันที่เป็นเจ้าของ TaskFlow ที่ผูกไว้              |
| `secret`       | ใช่   | -                            | สตริงข้อความธรรมดาหรือ SecretRef (ด้านล่าง)          |
| `controllerId` | ไม่   | `webhooks/<routeId>`         | ใช้เป็นตัวควบคุมเริ่มต้นของ `create_flow`            |
| `description`  | ไม่   | -                            | หมายเหตุสำหรับผู้ปฏิบัติงานเท่านั้น                  |

`secret` รองรับสตริงข้อความธรรมดาหรือ SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`

ทุกเส้นทางที่กำหนดค่าจะได้รับการลงทะเบียนเมื่อเริ่มต้น ไม่ว่าค่าลับของเส้นทางนั้น
จะสามารถแปลงค่าได้ในขณะนั้นหรือไม่ ค่าลับที่ไม่สามารถแปลงค่าได้จะไม่ปิดใช้งานหรือข้าม
เส้นทาง โดยคำขอไปยังเส้นทางนั้นจะไม่ผ่านการยืนยันตัวตน (`401`) จนกว่าจะสามารถ
แปลงค่าลับได้ ค่า SecretRef จะได้รับการแปลงค่าใหม่ในทุกคำขอ ดังนั้นการหมุนเวียน
ค่าลับต้นทาง (ตัวแปรสภาพแวดล้อม ไฟล์ หรือเอาต์พุตจาก exec) จะมีผลโดยไม่ต้อง
เริ่ม Gateway ใหม่

## โมเดลความปลอดภัย

แต่ละเส้นทางดำเนินการด้วยสิทธิ์ TaskFlow ของ `sessionKey` ที่กำหนดค่าไว้ โดยสามารถ
ตรวจสอบและแก้ไข TaskFlow ใดๆ ที่เซสชันนั้นเป็นเจ้าของได้ การเข้าถึง TaskFlow
จะดำเนินการผ่าน `api.runtime.tasks.managedFlows.bindSession(...)` เสมอ ดังนั้น
เส้นทางจึงไม่สามารถดำเนินการนอกเซสชันที่ผูกไว้ได้ เพื่อลดขอบเขตผลกระทบ:

- ใช้ค่าลับที่รัดกุมและไม่ซ้ำกันสำหรับแต่ละเส้นทาง
- เลือกใช้ SecretRef แทนค่าลับข้อความธรรมดาแบบอินไลน์
- ผูกเส้นทางกับเซสชันที่มีขอบเขตแคบที่สุดซึ่งเหมาะกับเวิร์กโฟลว์
- เปิดเผยเฉพาะพาธ Webhook ที่จำเป็นเท่านั้น

ลำดับการประมวลผลคำขอสำหรับแต่ละพาธ: ตรวจสอบเมธอด HTTP (เฉพาะ `POST`) และ
`Content-Type: application/json` จากนั้นจำกัดอัตราแบบช่วงเวลาคงที่ (120
คำขอต่อช่วงเวลา 60 วินาทีต่อคีย์พาธ+IP ไคลเอนต์ โดยติดตามได้สูงสุด
4,096 คีย์) จากนั้นจำกัดคำขอที่กำลังประมวลผล (8 คำขอพร้อมกันต่อคีย์ โดยติดตามได้
สูงสุด 4,096 คีย์) จากนั้นยืนยันตัวตนด้วยค่าลับที่ใช้ร่วมกัน แล้วจึงอ่านเนื้อหา JSON
ที่จำกัดขนาด 256 KB / เวลา 15 วินาที คำขอที่ไม่ผ่านการตรวจสอบในขั้นก่อนหน้า
จะไม่ไปถึงขั้นตอนถัดไป

## รูปแบบคำขอ

ส่งคำขอ `POST` พร้อม `Content-Type: application/json` และระบุ
`Authorization: Bearer <secret>` หรือ `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## การดำเนินการที่รองรับ

| การดำเนินการ      | วัตถุประสงค์                                                                 |
| ----------------- | ----------------------------------------------------------------------------- |
| `create_flow`      | สร้าง TaskFlow ที่มีการจัดการสำหรับเซสชันของเส้นทาง                          |
| `get_flow`         | ดึงข้อมูล TaskFlow หนึ่งรายการตามรหัส                                         |
| `list_flows`       | แสดงรายการ TaskFlow สำหรับเซสชันของเส้นทาง                                   |
| `find_latest_flow` | ดึงข้อมูล TaskFlow ที่อัปเดตล่าสุด                                            |
| `resolve_flow`     | ระบุ TaskFlow ด้วยโทเค็นแบบทึบ                                                |
| `get_task_summary` | ดึงข้อมูลสรุปงานของ TaskFlow                                                  |
| `set_waiting`      | ทำเครื่องหมายว่า TaskFlow กำลังรอ พร้อมข้อมูลสถานะ/การรอที่ระบุหรือไม่ก็ได้   |
| `resume_flow`      | ดำเนิน TaskFlow ที่กำลังรอ/ถูกบล็อกต่อ                                        |
| `finish_flow`      | ทำเครื่องหมายว่า TaskFlow เสร็จสิ้น                                           |
| `fail_flow`        | ทำเครื่องหมายว่า TaskFlow ล้มเหลว                                             |
| `request_cancel`   | ขอให้ยกเลิกแบบร่วมมือ                                                         |
| `cancel_flow`      | ยกเลิก TaskFlow (อาจส่งคืน `202` หากงานลูกยังทำงานอยู่)                       |
| `run_task`         | สร้างงานลูกที่มีการจัดการภายใน TaskFlow ที่มีอยู่                             |

การดำเนินการที่แก้ไขข้อมูล (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) ต้องระบุ `flowId` และ `expectedRevision` สำหรับการควบคุม
ภาวะพร้อมกันแบบมองโลกในแง่ดี หากรีวิชันล้าสมัย ระบบจะส่งคืน `409 revision_conflict`

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

ค่า `runtime` ที่อนุญาต: `subagent`, `acp` โดย `startedAt`, `lastEventAt` และ
`progressSummary` ใช้ได้เฉพาะเมื่อ `status` เป็น `"running"` เท่านั้น การส่งค่าเหล่านี้
พร้อมสถานะอื่นจะส่งคืน `400 invalid_request`

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

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

มุมมองโฟลว์และงานจะไม่มีข้อมูลเมตาของเจ้าของ/เซสชัน ดังนั้นการตอบกลับจึงไม่สามารถ
เปิดเผย `sessionKey` ที่ผูกกับเส้นทางได้ ค่า `code` ประกอบด้วย `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected` และ
รหัสสำรองเฉพาะการดำเนินการ (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`) เมื่อการแก้ไขข้อมูลถูกปฏิเสธด้วยเหตุผล
ที่ไม่ครอบคลุมโดยรหัสที่ระบุชื่อไว้ข้างต้น

## ที่เกี่ยวข้อง

- [Hooks](/th/automation/hooks) - ฮุกภายในที่ขับเคลื่อนด้วยเหตุการณ์ เทียบกับสะพานเชื่อม TaskFlow ที่ใช้ HTTP นี้
- [Webhook ของ Gateway (การกำหนดค่า `hooks.*`)](/th/automation/cron-jobs#webhooks) - ความสามารถของปลายทาง HTTP ทั่วไปของ Gateway ที่แยกต่างหาก และไม่ใช่เส้นทางเดียวกับของ Plugin นี้
- [SDK รันไทม์ของ Plugin](/th/plugins/sdk-runtime)
- [Webhook ของ CLI](/th/cli/webhooks)
