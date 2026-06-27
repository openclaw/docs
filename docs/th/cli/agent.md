---
read_when:
    - คุณต้องการรันเทิร์นของเอเจนต์หนึ่งครั้งจากสคริปต์ (ส่งคำตอบกลับได้ตามต้องการ)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw agent` (ส่งหนึ่งรอบของเอเจนต์ผ่าน Gateway)
title: Agent
x-i18n:
    generated_at: "2026-06-27T17:19:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

เรียกใช้รอบการทำงานของเอเจนต์ผ่าน Gateway (ใช้ `--local` สำหรับแบบฝังตัว)
ใช้ `--agent <id>` เพื่อกำหนดเป้าหมายไปยังเอเจนต์ที่กำหนดค่าไว้โดยตรง

ส่งตัวเลือกเซสชันอย่างน้อยหนึ่งรายการ:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

ที่เกี่ยวข้อง:

- เครื่องมือส่งเอเจนต์: [ส่งเอเจนต์](/th/tools/agent-send)

## ตัวเลือก

- `-m, --message <text>`: เนื้อหาข้อความ
- `--message-file <path>`: อ่านเนื้อหาข้อความจากไฟล์ UTF-8
- `-t, --to <dest>`: ผู้รับที่ใช้เพื่อสร้างคีย์เซสชัน
- `--session-key <key>`: คีย์เซสชันแบบระบุชัดเจนสำหรับใช้กำหนดเส้นทาง
- `--session-id <id>`: รหัสเซสชันแบบระบุชัดเจน
- `--agent <id>`: รหัสเอเจนต์; แทนที่การผูกการกำหนดเส้นทาง
- `--model <id>`: แทนที่โมเดลสำหรับการรันนี้ (`provider/model` หรือรหัสโมเดล)
- `--thinking <level>`: ระดับการคิดของเอเจนต์ (`off`, `minimal`, `low`, `medium`, `high` รวมถึงระดับกำหนดเองที่ผู้ให้บริการรองรับ เช่น `xhigh`, `adaptive` หรือ `max`)
- `--verbose <on|off>`: บันทึกระดับ verbose สำหรับเซสชัน
- `--channel <channel>`: ช่องทางการส่ง; เว้นไว้เพื่อใช้ช่องทางเซสชันหลัก
- `--reply-to <target>`: แทนที่เป้าหมายการส่ง
- `--reply-channel <channel>`: แทนที่ช่องทางการส่ง
- `--reply-account <id>`: แทนที่บัญชีการส่ง
- `--local`: รันเอเจนต์แบบฝังตัวโดยตรง (หลังจากโหลดรีจิสทรี Plugin ล่วงหน้า)
- `--deliver`: ส่งคำตอบกลับไปยังช่องทาง/เป้าหมายที่เลือก
- `--timeout <seconds>`: แทนที่เวลาหมดเวลาของเอเจนต์ (ค่าเริ่มต้น 600 หรือค่าจากการกำหนดค่า)
- `--json`: ส่งออก JSON

## ตัวอย่าง

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## หมายเหตุ

- ส่ง `--message` หรือ `--message-file` เพียงอย่างใดอย่างหนึ่งเท่านั้น `--message-file` จะรักษาเนื้อหาไฟล์หลายบรรทัดหลังจากลบ UTF-8 BOM ที่อาจมีอยู่ และปฏิเสธไฟล์ที่ไม่ใช่ UTF-8 ที่ถูกต้อง
- โหมด Gateway จะถอยกลับไปใช้เอเจนต์แบบฝังตัวเมื่อคำขอ Gateway ล้มเหลว ใช้ `--local` เพื่อบังคับให้ดำเนินการแบบฝังตัวตั้งแต่ต้น
- `--local` ยังคงโหลดรีจิสทรี Plugin ล่วงหน้าก่อน ดังนั้นผู้ให้บริการ เครื่องมือ และช่องทางที่ Plugin จัดเตรียมไว้จะยังพร้อมใช้งานระหว่างการรันแบบฝังตัว
- การรัน `--local` และการรันสำรองแบบฝังตัวจะถือเป็นการรันครั้งเดียว ทรัพยากร MCP loopback ที่มาพร้อมชุด และเซสชัน Claude stdio แบบอุ่นที่เปิดไว้สำหรับกระบวนการภายในนั้นจะถูกเลิกใช้หลังจากตอบกลับ เพื่อให้การเรียกใช้จากสคริปต์ไม่คงกระบวนการลูกภายในไว้
- การรันที่อิง Gateway จะคงทรัพยากร MCP loopback ที่ Gateway เป็นเจ้าของไว้ภายใต้กระบวนการ Gateway ที่กำลังทำงานอยู่; ไคลเอนต์รุ่นเก่าอาจยังส่งแฟล็กล้างข้อมูลแบบเดิม แต่ Gateway จะยอมรับเป็น no-op เพื่อความเข้ากันได้
- `--channel`, `--reply-channel` และ `--reply-account` มีผลต่อการส่งคำตอบ ไม่ใช่การกำหนดเส้นทางเซสชัน
- `--session-key` เลือกคีย์เซสชันแบบระบุชัดเจน คีย์ที่มีคำนำหน้าเอเจนต์ต้องใช้ `agent:<agent-id>:<session-key>` และ `--agent` ต้องตรงกับรหัสเอเจนต์ของคีย์เมื่อระบุทั้งคู่ คีย์เปล่าแบบไม่ใช่ sentinel จะถูกจำกัดขอบเขตไปยัง `--agent` เมื่อระบุ หรือไปยังเอเจนต์เริ่มต้นที่กำหนดค่าไว้หากไม่ได้ระบุ ตัวอย่างเช่น `--agent ops --session-key incident-42` จะกำหนดเส้นทางไปยัง `agent:ops:incident-42` ค่า literal `global` และ `unknown` จะยังคงไม่ถูกจำกัดขอบเขตเฉพาะเมื่อไม่ได้ระบุ `--agent`; ในกรณีนั้น การถอยกลับแบบฝังตัวและความเป็นเจ้าของ store จะใช้เอเจนต์เริ่มต้นที่กำหนดค่าไว้
- `--json` สงวน stdout ไว้สำหรับการตอบสนอง JSON การวินิจฉัยของ Gateway, Plugin และการถอยกลับแบบฝังตัวจะถูกส่งไปยัง stderr เพื่อให้สคริปต์สามารถแยกวิเคราะห์ stdout ได้โดยตรง
- JSON จากการถอยกลับแบบฝังตัวมี `meta.transport: "embedded"` และ `meta.fallbackFrom: "gateway"` เพื่อให้สคริปต์แยกการรันแบบถอยกลับออกจากการรันผ่าน Gateway ได้
- หาก Gateway ยอมรับการรันเอเจนต์ แต่ CLI หมดเวลารอคำตอบสุดท้าย การถอยกลับแบบฝังตัวจะใช้รหัสเซสชัน/รันแบบระบุชัดเจนใหม่ `gateway-fallback-*` และรายงาน `meta.fallbackReason: "gateway_timeout"` พร้อมฟิลด์เซสชันสำรอง วิธีนี้หลีกเลี่ยงการแข่งกับล็อกทรานสคริปต์ที่ Gateway เป็นเจ้าของ หรือการแทนที่เซสชันสนทนาที่ถูกกำหนดเส้นทางเดิมอย่างเงียบ ๆ
- สำหรับการรันที่อิง Gateway, `SIGTERM` และ `SIGINT` จะขัดจังหวะคำขอ CLI ที่กำลังรออยู่ หาก Gateway ยอมรับการรันแล้ว CLI จะส่ง `chat.abort` สำหรับรหัสการรันที่ยอมรับนั้นก่อนออกด้วย การรัน `--local` ภายในและการรันสำรองแบบฝังตัวจะได้รับสัญญาณยกเลิกเดียวกัน แต่จะไม่ส่ง `chat.abort` หาก `--run-id` ซ้ำไปถึง Gateway ขณะที่การรันเอเจนต์เดิมยังทำงานอยู่ การตอบสนองซ้ำจะรายงาน `status: "in_flight"` และ CLI แบบไม่ใช่ JSON จะพิมพ์การวินิจฉัยไปยัง stderr แทนคำตอบว่าง สำหรับ wrapper ภายนอกแบบ Cron/systemd ให้คงตัวค้ำประกันการ kill แบบแข็งภายนอกไว้ เช่น `timeout -k 60 600 openclaw agent ...` เพื่อให้ supervisor ยังสามารถเก็บกระบวนการได้หากการปิดระบบไม่สามารถระบายงานให้เสร็จได้
- เมื่อคำสั่งนี้ทริกเกอร์การสร้าง `models.json` ใหม่ ข้อมูลรับรองผู้ให้บริการที่จัดการโดย SecretRef จะถูกบันทึกเป็นมาร์กเกอร์ที่ไม่ใช่ความลับ (เช่น ชื่อตัวแปร env, `secretref-env:ENV_VAR_NAME` หรือ `secretref-managed`) ไม่ใช่ข้อความลับแบบ plaintext ที่ถูก resolve แล้ว
- การเขียนมาร์กเกอร์ยึดต้นทางเป็น authoritative: OpenClaw บันทึกมาร์กเกอร์จากสแนปช็อตการกำหนดค่าต้นทางที่ใช้งานอยู่ ไม่ใช่จากค่าความลับของรันไทม์ที่ถูก resolve แล้ว

## สถานะการส่ง JSON

เมื่อใช้ `--json --deliver` การตอบสนอง JSON ของ CLI อาจมี `deliveryStatus` ระดับบนสุดเพื่อให้สคริปต์แยกการส่งที่สำเร็จ ถูกระงับ สำเร็จบางส่วน และล้มเหลวได้:

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

`deliveryStatus.status` เป็นหนึ่งใน `sent`, `suppressed`, `partial_failed` หรือ `failed` `suppressed` หมายถึงตั้งใจไม่ส่งการส่งมอบ เช่น hook การส่งข้อความยกเลิกไว้ หรือไม่มีผลลัพธ์ที่มองเห็นได้; ยังคงเป็นผลลัพธ์ปลายทางแบบไม่ลองซ้ำ `partial_failed` หมายถึงมีการส่ง payload อย่างน้อยหนึ่งรายการก่อนที่ payload ภายหลังจะล้มเหลว `failed` หมายถึงไม่มีการส่งที่คงทนเสร็จสมบูรณ์ หรือ preflight การส่งล้มเหลว

การตอบสนอง CLI ที่อิง Gateway ยังรักษารูปแบบผลลัพธ์ดิบของ Gateway ไว้ด้วย โดยออบเจ็กต์เดียวกันพร้อมใช้งานที่ `result.deliveryStatus`

ฟิลด์ทั่วไป:

- `requested`: เป็น `true` เสมอเมื่อมีออบเจ็กต์นี้
- `attempted`: เป็น `true` หลังจากพาธการส่งที่คงทนทำงานแล้ว; เป็น `false` สำหรับความล้มเหลวของ preflight หรือเมื่อไม่มี payload ที่มองเห็นได้
- `succeeded`: `true`, `false` หรือ `"partial"`; `"partial"` จับคู่กับ `status: "partial_failed"`
- `reason`: เหตุผลแบบ snake-case ตัวพิมพ์เล็กจากการส่งที่คงทนหรือการตรวจสอบ preflight เหตุผลที่รู้จักได้แก่ `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` และ `no_delivery_target`; การส่งที่คงทนซึ่งล้มเหลวอาจรายงานขั้นตอนที่ล้มเหลวด้วย ให้ถือค่าที่ไม่รู้จักเป็นทึบแสง เพราะชุดค่านี้อาจขยายได้
- `resultCount`: จำนวนผลลัพธ์การส่งของช่องทางเมื่อมีให้ใช้
- `sentBeforeError`: เป็น `true` เมื่อความล้มเหลวบางส่วนส่ง payload อย่างน้อยหนึ่งรายการก่อนเกิดข้อผิดพลาด
- `error`: บูลีน `true` สำหรับการส่งที่ล้มเหลวหรือสำเร็จบางส่วน
- `errorMessage`: รวมไว้เฉพาะเมื่อจับข้อความข้อผิดพลาดการส่งที่อยู่เบื้องล่างได้ ความล้มเหลวของ preflight จะมี `error` และ `reason` แต่ไม่มี `errorMessage`
- `payloadOutcomes`: ผลลัพธ์ต่อ payload แบบไม่บังคับ พร้อม `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` หรือเมทาดาทา hook เมื่อมีให้ใช้

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [รันไทม์เอเจนต์](/th/concepts/agent)
