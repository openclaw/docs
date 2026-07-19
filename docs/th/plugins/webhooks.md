---
read_when:
    - คุณต้องการทริกเกอร์หรือขับเคลื่อน TaskFlow จากระบบภายนอก
    - คุณกำลังกำหนดค่า Plugin Webhook ที่รวมมาให้
summary: 'Plugin Webhooks: ช่องทางรับข้อมูล TaskFlow ที่ผ่านการยืนยันตัวตนสำหรับระบบอัตโนมัติภายนอกที่เชื่อถือได้'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-07-19T07:25:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77e455450d6183635c76a1e8002feeb287deb4ff242dbd555ef9d0f2b21ce5f6
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhook เพิ่มเส้นทาง HTTP ที่มีการยืนยันตัวตน เพื่อให้ระบบภายนอกที่เชื่อถือได้
(Zapier, n8n, งาน CI, บริการภายใน) สามารถสร้างและขับเคลื่อน
TaskFlow ของ OpenClaw ที่มีการจัดการผ่าน HTTP โดยไม่ต้องเขียน Plugin แบบกำหนดเอง

Plugin ทำงานภายในกระบวนการ Gateway สำหรับ Gateway ระยะไกล ให้ติดตั้งและ
กำหนดค่าบนโฮสต์นั้น แล้วรีสตาร์ต Gateway โดยค่าเริ่มต้นไม่มีการกำหนดค่าเส้นทาง
ดังนั้นจึงไม่ทำงานจนกว่าจะเพิ่มอย่างน้อยหนึ่งเส้นทาง

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
              description: "บริดจ์ TaskFlow ของ Zapier",
            },
          },
        },
      },
    },
  },
}
```

ฟิลด์ของเส้นทาง:

| ฟิลด์          | จำเป็น | ค่าเริ่มต้น                       | หมายเหตุ                                         |
| -------------- | -------- | ----------------------------- | --------------------------------------------- |
| `enabled`      | ไม่       | `true`                        |                                               |
| `path`         | ไม่       | `/plugins/webhooks/<routeId>` | ต้องไม่ซ้ำกันในทุกเส้นทาง                 |
| `sessionKey`   | ใช่      | -                             | เซสชันที่เป็นเจ้าของ TaskFlow ที่ผูกไว้        |
| `secret`       | ใช่      | -                             | สตริงธรรมดาหรือ SecretRef (ด้านล่าง)          |
| `controllerId` | ไม่       | `webhooks/<routeId>`          | ใช้เป็นตัวควบคุม `create_flow` เริ่มต้น |
| `description`  | ไม่       | -                             | หมายเหตุสำหรับผู้ปฏิบัติงานเท่านั้น           |

`secret` รองรับสตริงธรรมดาหรือ SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`

SecretRef จะถูกแปลงค่าในสแนปช็อตการกำหนดค่าเริ่มต้นของ Gateway เมื่อไม่สามารถ
แปลงค่าข้อมูลลับของเส้นทางหนึ่งได้ Gateway จะยังคงทำงาน และเส้นทางนั้นจะยังคง
ลงทะเบียนอยู่แต่ไม่ทำงาน: คำขอจะได้รับข้อผิดพลาดการยืนยันตัวตนแบบทั่วไป (`401`)
เส้นทางอื่นยังคงพร้อมใช้งาน แก้ไขแหล่งที่มาของ SecretRef แล้วโหลดใหม่หรือรีสตาร์ต
Gateway เพื่อเปิดใช้งานสแนปช็อตใหม่ ระบบจะไม่แปลงค่า SecretRef
บนเส้นทางคำขอสาธารณะโดยเด็ดขาด

## โมเดลความปลอดภัย

แต่ละเส้นทางดำเนินการด้วยสิทธิ์ TaskFlow ของ `sessionKey` ที่กำหนดค่าไว้:
สามารถตรวจสอบและแก้ไข TaskFlow ใด ๆ ที่เซสชันนั้นเป็นเจ้าของได้ การเข้าถึง TaskFlow
จะผ่าน `api.runtime.tasks.managedFlows.bindSession(...)` เสมอ ดังนั้น
เส้นทางจึงไม่สามารถดำเนินการนอกเซสชันที่ผูกไว้ได้ เพื่อลดขอบเขตผลกระทบ:

- ใช้ข้อมูลลับที่รัดกุมและไม่ซ้ำกันสำหรับแต่ละเส้นทาง
- เลือกใช้ SecretRef แทนข้อมูลลับข้อความธรรมดาแบบอินไลน์
- ผูกเส้นทางกับเซสชันที่มีขอบเขตแคบที่สุดซึ่งเหมาะกับเวิร์กโฟลว์
- เปิดเผยเฉพาะพาธ Webhook ที่จำเป็น

ลำดับการจัดการคำขอสำหรับแต่ละพาธ: ตรวจสอบเมธอด HTTP (เฉพาะ `POST`)
และ `Content-Type: application/json` จากนั้นจำกัดอัตราแบบกรอบเวลาคงที่ (120
คำขอต่อกรอบเวลา 60 วินาทีสำหรับแต่ละคีย์พาธ+IP ไคลเอนต์ โดยติดตามได้สูงสุด
4,096 คีย์) จากนั้นจำกัดคำขอที่กำลังประมวลผล (8 คำขอพร้อมกันต่อคีย์ โดยติดตามได้สูงสุด
4,096 คีย์) จากนั้นยืนยันตัวตนด้วยข้อมูลลับที่ใช้ร่วมกัน แล้วอ่านเนื้อหา JSON ขนาด 256 KB /
ภายใน 15 วินาที คำขอที่ไม่ผ่านการตรวจสอบก่อนหน้าจะไม่เข้าสู่ขั้นตอนถัดไป

## รูปแบบคำขอ

ส่งคำขอ `POST` พร้อม `Content-Type: application/json` และ
`Authorization: Bearer <secret>` หรือ `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"ตรวจสอบคิวขาเข้า"}'
```

## การดำเนินการที่รองรับ

| การดำเนินการ             | วัตถุประสงค์                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | สร้าง TaskFlow ที่มีการจัดการสำหรับเซสชันของเส้นทาง                 |
| `get_flow`         | ดึง TaskFlow หนึ่งรายการตาม ID                                          |
| `list_flows`       | แสดงรายการ TaskFlow สำหรับเซสชันของเส้นทาง                            |
| `find_latest_flow` | ดึง TaskFlow ที่อัปเดตล่าสุด                          |
| `resolve_flow`     | ค้นหา TaskFlow ด้วยโทเค็นทึบแสง                                |
| `get_task_summary` | ดึงข้อมูลสรุปงานของ TaskFlow                             |
| `set_waiting`      | ทำเครื่องหมาย TaskFlow ว่ากำลังรอ พร้อมข้อมูลสถานะ/การรอซึ่งระบุหรือไม่ก็ได้            |
| `resume_flow`      | ดำเนิน TaskFlow ที่กำลังรอ/ถูกบล็อกต่อ                                 |
| `finish_flow`      | ทำเครื่องหมาย TaskFlow ว่าเสร็จสิ้น                                          |
| `fail_flow`        | ทำเครื่องหมาย TaskFlow ว่าล้มเหลว                                            |
| `request_cancel`   | ร้องขอการยกเลิกแบบร่วมมือกัน                                  |
| `cancel_flow`      | ยกเลิก TaskFlow (อาจส่งคืน `202` หากงานลูกยังทำงานอยู่) |
| `run_task`         | สร้างงานลูกที่มีการจัดการภายใน TaskFlow ที่มีอยู่           |

การดำเนินการที่แก้ไขข้อมูล (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) ต้องใช้ `flowId` และ `expectedRevision` สำหรับการควบคุม
ภาวะพร้อมกันเชิงคาดการณ์ หากรีวิชันล้าสมัยจะส่งคืน `409 revision_conflict`

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "ตรวจสอบคิวขาเข้า",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

ค่า `runtime` ที่อนุญาต: `subagent`, `acp` ส่วน `startedAt`, `lastEventAt` และ
`progressSummary` ใช้ได้เฉพาะเมื่อ `status` เป็น `"running"` เท่านั้น การส่งค่าเหล่านี้
พร้อมสถานะอื่นจะส่งคืน `400 invalid_request`

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "ตรวจสอบชุดข้อความถัดไป"
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
  "error": "ไม่พบ TaskFlow",
  "result": {}
}
```

มุมมองโฟลว์และงานจะไม่มีเมทาดาทาของเจ้าของ/เซสชัน ดังนั้นการตอบกลับจึงไม่สามารถ
เปิดเผย `sessionKey` ที่ผูกกับเส้นทางได้ ค่า `code` ได้แก่ `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected` และ
รหัสสำรองเฉพาะการดำเนินการ (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`) เมื่อการแก้ไขข้อมูลถูกปฏิเสธด้วย
เหตุผลที่ไม่ครอบคลุมโดยรหัสที่ระบุชื่อไว้ข้างต้น

## เนื้อหาที่เกี่ยวข้อง

- [Hooks](/th/automation/hooks) - Hook ภายในที่ขับเคลื่อนด้วยเหตุการณ์ เทียบกับบริดจ์ TaskFlow ที่ใช้ HTTP นี้
- [Webhook ของ Gateway (การกำหนดค่า `hooks.*`)](/th/automation/cron-jobs#webhooks) - ฟีเจอร์ปลายทาง HTTP ทั่วไปของ Gateway ที่แยกต่างหาก ไม่ใช่เส้นทางของ Plugin นี้
- [SDK รันไทม์ของ Plugin](/th/plugins/sdk-runtime)
- [Webhook ของ CLI](/th/cli/webhooks)
