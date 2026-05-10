---
read_when:
    - คุณต้องการเรียกใช้เอเจนต์หนึ่งเทิร์นจากสคริปต์ (เลือกส่งคำตอบกลับได้)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw agent` (ส่งหนึ่งรอบของเอเจนต์ผ่าน Gateway)
title: เอเจนต์
x-i18n:
    generated_at: "2026-05-10T19:28:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

เรียกใช้รอบการทำงานของเอเจนต์ผ่าน Gateway (ใช้ `--local` สำหรับแบบฝังตัว)
ใช้ `--agent <id>` เพื่อกำหนดเป้าหมายไปยังเอเจนต์ที่กำหนดค่าไว้โดยตรง

ส่งตัวเลือกเซสชันอย่างน้อยหนึ่งรายการ:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

ที่เกี่ยวข้อง:

- เครื่องมือส่งของเอเจนต์: [การส่งของเอเจนต์](/th/tools/agent-send)

## ตัวเลือก

- `-m, --message <text>`: เนื้อหาข้อความที่จำเป็น
- `-t, --to <dest>`: ผู้รับที่ใช้สำหรับอนุมานคีย์เซสชัน
- `--session-id <id>`: id เซสชันแบบระบุชัดเจน
- `--agent <id>`: id เอเจนต์; แทนที่การผูกการกำหนดเส้นทาง
- `--model <id>`: การแทนที่โมเดลสำหรับการรันนี้ (`provider/model` หรือ id โมเดล)
- `--thinking <level>`: ระดับการคิดของเอเจนต์ (`off`, `minimal`, `low`, `medium`, `high` รวมถึงระดับแบบกำหนดเองที่ผู้ให้บริการรองรับ เช่น `xhigh`, `adaptive` หรือ `max`)
- `--verbose <on|off>`: คงระดับ verbose ไว้สำหรับเซสชัน
- `--channel <channel>`: ช่องทางการส่ง; ละไว้เพื่อใช้ช่องทางเซสชันหลัก
- `--reply-to <target>`: การแทนที่เป้าหมายการส่ง
- `--reply-channel <channel>`: การแทนที่ช่องทางการส่ง
- `--reply-account <id>`: การแทนที่บัญชีการส่ง
- `--local`: รันเอเจนต์แบบฝังตัวโดยตรง (หลังจากโหลดรีจิสทรี Plugin ล่วงหน้า)
- `--deliver`: ส่งคำตอบกลับไปยังช่องทาง/เป้าหมายที่เลือก
- `--timeout <seconds>`: แทนที่เวลาหมดเวลาของเอเจนต์ (ค่าเริ่มต้น 600 หรือค่าคอนฟิก)
- `--json`: ส่งออก JSON

## ตัวอย่าง

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## หมายเหตุ

- โหมด Gateway จะถอยกลับไปใช้เอเจนต์แบบฝังตัวเมื่อคำขอ Gateway ล้มเหลว ใช้ `--local` เพื่อบังคับใช้การดำเนินการแบบฝังตัวตั้งแต่ต้น
- `--local` ยังคงโหลดรีจิสทรี Plugin ล่วงหน้าก่อน ดังนั้นผู้ให้บริการ เครื่องมือ และช่องทางที่ Plugin จัดหาให้ยังคงพร้อมใช้งานระหว่างการรันแบบฝังตัว
- `--local` และการรันแบบถอยกลับไปใช้แบบฝังตัวจะถูกถือเป็นการรันครั้งเดียว ทรัพยากร MCP loopback ที่รวมมา และเซสชัน Claude stdio แบบอุ่นเครื่องที่เปิดไว้สำหรับโปรเซสภายในนั้นจะถูกเลิกใช้หลังจากตอบกลับ เพื่อให้การเรียกใช้ด้วยสคริปต์ไม่คงโปรเซสลูกภายในไว้
- การรันที่อิง Gateway จะปล่อยให้ทรัพยากร MCP loopback ที่ Gateway เป็นเจ้าของอยู่ภายใต้โปรเซส Gateway ที่กำลังรันอยู่; ไคลเอนต์รุ่นเก่าอาจยังส่งแฟล็กล้างข้อมูลเดิม แต่ Gateway จะยอมรับเป็น no-op เพื่อความเข้ากันได้
- `--channel`, `--reply-channel` และ `--reply-account` มีผลต่อการส่งคำตอบ ไม่ใช่การกำหนดเส้นทางเซสชัน
- `--json` กัน stdout ไว้สำหรับการตอบกลับ JSON การวินิจฉัยจาก Gateway, Plugin และการถอยกลับแบบฝังตัวจะถูกส่งไปยัง stderr เพื่อให้สคริปต์สามารถแยกวิเคราะห์ stdout ได้โดยตรง
- JSON ของการถอยกลับแบบฝังตัวมี `meta.transport: "embedded"` และ `meta.fallbackFrom: "gateway"` เพื่อให้สคริปต์แยกแยะการรันแบบถอยกลับจากการรันผ่าน Gateway ได้
- หาก Gateway ยอมรับการรันเอเจนต์แต่ CLI หมดเวลาขณะรอคำตอบสุดท้าย การถอยกลับแบบฝังตัวจะใช้ id เซสชัน/การรัน `gateway-fallback-*` แบบระบุชัดเจนรายการใหม่ และรายงาน `meta.fallbackReason: "gateway_timeout"` พร้อมฟิลด์เซสชันของการถอยกลับ วิธีนี้หลีกเลี่ยงการแข่งขันกับล็อกทรานสคริปต์ที่ Gateway เป็นเจ้าของ หรือการแทนที่เซสชันการสนทนาที่ถูกกำหนดเส้นทางไว้เดิมอย่างเงียบ ๆ
- เมื่อคำสั่งนี้ทริกเกอร์การสร้าง `models.json` ใหม่ ข้อมูลรับรองผู้ให้บริการที่จัดการโดย SecretRef จะถูกบันทึกเป็นเครื่องหมายที่ไม่ใช่ความลับ (เช่น ชื่อตัวแปร env, `secretref-env:ENV_VAR_NAME` หรือ `secretref-managed`) ไม่ใช่ข้อความลับแบบ plaintext ที่ถูก resolve แล้ว
- การเขียนเครื่องหมายยึดแหล่งที่มาเป็นอำนาจหลัก: OpenClaw บันทึกเครื่องหมายจากสแนปชอตคอนฟิกต้นทางที่ใช้งานอยู่ ไม่ใช่จากค่าความลับรันไทม์ที่ถูก resolve แล้ว

## สถานะการส่ง JSON

เมื่อใช้ `--json --deliver` การตอบกลับ JSON ของ CLI อาจมี `deliveryStatus` ระดับบนสุด เพื่อให้สคริปต์แยกแยะการส่งที่ส่งสำเร็จ ถูกระงับ สำเร็จบางส่วน และล้มเหลวได้:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

`deliveryStatus.status` เป็นหนึ่งใน `sent`, `suppressed`, `partial_failed` หรือ `failed` `suppressed` หมายถึงการส่งถูกตั้งใจไม่ให้ส่ง เช่น hook ส่งข้อความยกเลิกการส่ง หรือไม่มีผลลัพธ์ที่มองเห็นได้; นี่ยังคงเป็นผลลัพธ์ปลายทางที่ไม่ต้องลองซ้ำ `partial_failed` หมายถึงมีการส่ง payload อย่างน้อยหนึ่งรายการก่อนที่ payload ถัดมาจะล้มเหลว `failed` หมายถึงไม่มีการส่งแบบ durable ใดเสร็จสมบูรณ์ หรือการตรวจสอบก่อนส่งล้มเหลว

การตอบกลับ CLI ที่อิง Gateway ยังรักษารูปแบบผลลัพธ์ Gateway ดิบไว้ด้วย โดยอ็อบเจ็กต์เดียวกันพร้อมใช้งานที่ `result.deliveryStatus`

ฟิลด์ทั่วไป:

- `requested`: เป็น `true` เสมอเมื่อมีอ็อบเจ็กต์นี้อยู่
- `attempted`: เป็น `true` หลังจากเส้นทางการส่งแบบ durable ทำงาน; เป็น `false` สำหรับความล้มเหลวในการตรวจสอบก่อนส่ง หรือไม่มี payload ที่มองเห็นได้
- `succeeded`: `true`, `false` หรือ `"partial"`; `"partial"` จับคู่กับ `status: "partial_failed"`
- `reason`: เหตุผลแบบ snake-case ตัวพิมพ์เล็กจากการส่งแบบ durable หรือการตรวจสอบก่อนส่ง เหตุผลที่รู้จักรวมถึง `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` และ `no_delivery_target`; การส่งแบบ durable ที่ล้มเหลวอาจรายงานขั้นตอนที่ล้มเหลวด้วย ให้ถือค่าที่ไม่รู้จักเป็นค่าทึบ เพราะชุดค่าสามารถขยายได้
- `resultCount`: จำนวนผลลัพธ์การส่งของช่องทางเมื่อมีให้ใช้งาน
- `sentBeforeError`: เป็น `true` เมื่อความล้มเหลวบางส่วนส่ง payload อย่างน้อยหนึ่งรายการก่อนเกิดข้อผิดพลาด
- `error`: บูลีน `true` สำหรับการส่งที่ล้มเหลวหรือสำเร็จบางส่วน
- `errorMessage`: รวมไว้เฉพาะเมื่อมีการบันทึกข้อความข้อผิดพลาดของการส่งพื้นฐาน ความล้มเหลวในการตรวจสอบก่อนส่งมี `error` และ `reason` แต่ไม่มี `errorMessage`
- `payloadOutcomes`: ผลลัพธ์ราย payload แบบไม่บังคับ พร้อม `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` หรือเมทาดาทา hook เมื่อมีให้ใช้งาน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [รันไทม์เอเจนต์](/th/concepts/agent)
