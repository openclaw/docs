---
read_when:
    - คุณต้องการเรียกใช้เอเจนต์หนึ่งรอบจากสคริปต์ (และอาจส่งการตอบกลับด้วย)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw agent` (ส่งการโต้ตอบของเอเจนต์หนึ่งรอบผ่าน Gateway)
title: เอเจนต์
x-i18n:
    generated_at: "2026-07-12T15:59:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

เรียกใช้ Agent หนึ่งรอบผ่าน Gateway หากคำขอไปยัง Gateway ล้มเหลว ระบบจะถอยกลับไปใช้ Agent แบบฝังตัว หรือส่ง `--local` เพื่อบังคับใช้การทำงานแบบฝังตัวตั้งแต่ต้น

ส่งตัวเลือกระบุเซสชันอย่างน้อยหนึ่งรายการ ได้แก่ `--to`, `--session-key`, `--session-id` หรือ `--agent`

ที่เกี่ยวข้อง: [เครื่องมือส่งของ Agent](/th/tools/agent-send)

## ตัวเลือก

- `-m, --message <text>`: เนื้อหาข้อความ
- `--message-file <path>`: อ่านเนื้อหาข้อความจากไฟล์ UTF-8
- `-t, --to <dest>`: ผู้รับที่ใช้สร้างคีย์เซสชัน
- `--session-key <key>`: คีย์เซสชันที่ระบุอย่างชัดเจนเพื่อใช้กำหนดเส้นทาง
- `--session-id <id>`: รหัสเซสชันที่ระบุอย่างชัดเจน
- `--agent <id>`: รหัส Agent ซึ่งมีลำดับความสำคัญเหนือการผูกการกำหนดเส้นทาง
- `--model <id>`: แทนที่โมเดลสำหรับการเรียกใช้ครั้งนี้ (`provider/model` หรือรหัสโมเดล)
- `--thinking <level>`: ระดับการคิดของ Agent (`off`, `minimal`, `low`, `medium`, `high` รวมถึงระดับกำหนดเองที่ผู้ให้บริการรองรับ เช่น `xhigh`, `adaptive` หรือ `max`)
- `--verbose <on|off>`: บันทึกระดับความละเอียดสำหรับเซสชัน
- `--channel <channel>`: ช่องทางการส่ง หากละไว้จะใช้ช่องทางของเซสชันหลัก
- `--reply-to <target>`: แทนที่เป้าหมายการส่ง
- `--reply-channel <channel>`: แทนที่ช่องทางการส่ง
- `--reply-account <id>`: แทนที่บัญชีที่ใช้ส่ง
- `--local`: เรียกใช้ Agent แบบฝังตัวโดยตรง (หลังโหลดรีจิสทรี Plugin ล่วงหน้า)
- `--deliver`: ส่งคำตอบกลับไปยังช่องทาง/เป้าหมายที่เลือก
- `--timeout <seconds>`: แทนที่ระยะหมดเวลาของ Agent (ค่าเริ่มต้น 600 หรือ `agents.defaults.timeoutSeconds`); `0` ปิดการหมดเวลา
- `--json`: แสดงผลเป็น JSON

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

- ส่ง `--message` หรือ `--message-file` เพียงหนึ่งรายการเท่านั้น `--message-file` จะตัด BOM UTF-8 ที่อยู่ต้นไฟล์และคงเนื้อหาหลายบรรทัดไว้ โดยจะปฏิเสธไฟล์ที่ไม่ใช่ UTF-8 ที่ถูกต้อง
- คำสั่งแบบเครื่องหมายทับ (เช่น `/compact`) ไม่สามารถเรียกใช้ผ่าน `--message` ได้ CLI จะปฏิเสธและชี้ไปยังคำสั่งเฉพาะโดยตรงแทน (`openclaw sessions compact <key>` สำหรับ Compaction)
- การเรียกใช้ด้วย `--local` และการถอยกลับไปใช้แบบฝังตัวเป็นการทำงานครั้งเดียว: ทรัพยากร MCP local loopback ที่รวมมาให้และเซสชัน stdio ของ Claude แบบอุ่นที่เปิดสำหรับการเรียกใช้นั้นจะถูกยุติหลังจากได้รับคำตอบ เพื่อให้การเรียกใช้จากสคริปต์ไม่ทิ้งโปรเซสลูกในเครื่องไว้ ส่วนการเรียกใช้ที่ทำงานผ่าน Gateway จะเก็บทรัพยากร MCP loopback ที่ Gateway เป็นเจ้าของไว้ภายใต้โปรเซส Gateway ที่กำลังทำงาน
- เมื่อใช้ `--agent`, `--channel` และ `--to` ร่วมกัน การกำหนดเส้นทางเซสชันจะเป็นไปตามผู้รับมาตรฐานของช่องทางและ `session.dmScope` ช่องทางที่มีข้อมูลประจำตัวผู้รับสำหรับส่งออกเท่านั้นที่เสถียร จะใช้เซสชันที่ผู้ให้บริการเป็นเจ้าของซึ่งแยกออกจากเซสชันหลักของ Agent ส่วน `--reply-channel` และ `--reply-account` มีผลต่อการส่งเท่านั้น
- `--session-key` เลือกคีย์เซสชันที่ระบุอย่างชัดเจน คีย์ที่ขึ้นต้นด้วย Agent ต้องใช้รูปแบบ `agent:<agent-id>:<session-key>` และเมื่อระบุทั้งสองรายการ `--agent` ต้องตรงกับรหัส Agent ในคีย์ คีย์เปล่าที่ไม่ใช่ค่าพิเศษจะถูกจำกัดขอบเขตตาม `--agent` เมื่อระบุ หรือใช้ Agent เริ่มต้นที่กำหนดค่าไว้ในกรณีอื่น ตัวอย่างเช่น `--agent ops --session-key incident-42` จะกำหนดเส้นทางไปยัง `agent:ops:incident-42` คีย์ตามตัวอักษร `global` และ `unknown` จะไม่มีขอบเขตเฉพาะเฉพาะเมื่อไม่ได้ระบุ `--agent` เท่านั้น
- `--json` สงวน stdout ไว้สำหรับการตอบกลับ JSON ส่วนข้อมูลวินิจฉัยจาก Gateway, Plugin และการถอยกลับไปใช้แบบฝังตัวจะส่งไปยัง stderr เพื่อให้สคริปต์แยกวิเคราะห์ stdout ได้โดยตรง
- JSON จากการถอยกลับไปใช้แบบฝังตัวจะมี `meta.transport: "embedded"` และ `meta.fallbackFrom: "gateway"` เพื่อให้สคริปต์ตรวจพบการเรียกใช้แบบถอยกลับได้
- หาก Gateway ยอมรับการเรียกใช้ แต่ CLI หมดเวลาขณะรอคำตอบสุดท้าย การถอยกลับไปใช้แบบฝังตัวจะใช้รหัสเซสชัน/การเรียกใช้ `gateway-fallback-*` ใหม่ และรายงาน `meta.fallbackReason: "gateway_timeout"` พร้อมฟิลด์เซสชันสำหรับการถอยกลับ แทนที่จะแย่งใช้ทรานสคริปต์ที่ Gateway เป็นเจ้าของหรือแทนที่เซสชันเดิมโดยไม่แจ้ง
- `SIGTERM`/`SIGINT` จะขัดจังหวะคำขอที่ทำงานผ่าน Gateway ซึ่งกำลังรออยู่ หาก Gateway ยอมรับการเรียกใช้แล้ว CLI จะส่ง `chat.abort` สำหรับรหัสการเรียกใช้นั้นก่อนออกด้วย การเรียกใช้ด้วย `--local` และการถอยกลับไปใช้แบบฝังตัวจะได้รับสัญญาณเดียวกัน แต่จะไม่ส่ง `chat.abort` หากคีย์ภายในสำหรับป้องกันการเรียกใช้ซ้ำมีการเรียกใช้ที่ทำงานอยู่สำหรับเซสชันนี้แล้ว การตอบกลับจะรายงาน `status: "in_flight"` และ CLI ที่ไม่ใช่ JSON จะแสดงข้อมูลวินิจฉัยทาง stderr แทนคำตอบว่าง สำหรับตัวครอบ cron/systemd ภายนอก ให้มีการบังคับยุติเป็นมาตรการสำรอง เช่น `timeout -k 60 600 openclaw agent ...` เพื่อให้ตัวควบคุมสามารถเก็บกวาดโปรเซสได้หากไม่สามารถรอให้การปิดระบบเสร็จสิ้น
- เมื่อคำสั่งนี้กระตุ้นให้สร้าง `models.json` ใหม่ ข้อมูลรับรองของผู้ให้บริการที่จัดการด้วย SecretRef จะถูกบันทึกเป็นเครื่องหมายที่ไม่ใช่ความลับ (เช่น ชื่อตัวแปรสภาพแวดล้อม, `secretref-env:ENV_VAR_NAME` หรือ `secretref-managed`) โดยจะไม่บันทึกข้อความลับแบบข้อความธรรมดาที่ผ่านการแก้ค่าแล้ว การเขียนเครื่องหมายมาจากสแนปช็อตการกำหนดค่าต้นทางที่ใช้งานอยู่ ไม่ใช่จากค่าความลับของรันไทม์ที่ผ่านการแก้ค่าแล้ว

## สถานะการส่ง JSON

เมื่อใช้ `--json --deliver` การตอบกลับ JSON ของ CLI จะมี `deliveryStatus` ระดับบนสุด เพื่อให้สคริปต์แยกแยะการส่งที่สำเร็จ ถูกระงับ สำเร็จบางส่วน และล้มเหลวได้:

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

การตอบกลับ CLI ที่ทำงานผ่าน Gateway จะคงรูปแบบผลลัพธ์ดิบจาก Gateway ไว้ที่ `result.deliveryStatus` ด้วย

`deliveryStatus.status` เป็นค่าใดค่าหนึ่งต่อไปนี้:

| สถานะ           | ความหมาย                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sent`           | การส่งเสร็จสมบูรณ์                                                                                                                        |
| `suppressed`     | ตั้งใจไม่ส่ง (เช่น ฮุกการส่งข้อความยกเลิก หรือไม่มีผลลัพธ์ที่มองเห็นได้) เป็นสถานะสิ้นสุดและจะไม่ลองใหม่ |
| `partial_failed` | ส่งเพย์โหลดอย่างน้อยหนึ่งรายการสำเร็จก่อนที่เพย์โหลดรายการถัดมาจะล้มเหลว                                                                                   |
| `failed`         | ไม่มีการส่งถาวรที่เสร็จสมบูรณ์ หรือการตรวจสอบก่อนส่งล้มเหลว                                                                                   |

ฟิลด์ทั่วไป:

- `requested`: เป็น `true` เสมอเมื่อมีออบเจ็กต์นี้
- `attempted`: เป็น `true` เมื่อเส้นทางการส่งถาวรทำงานแล้ว และเป็น `false` สำหรับความล้มเหลวก่อนส่งหรือเมื่อไม่มีเพย์โหลดที่มองเห็นได้
- `succeeded`: เป็น `true`, `false` หรือ `"partial"` โดย `"partial"` ใช้คู่กับ `status: "partial_failed"`
- `reason`: เหตุผลรูปแบบตัวพิมพ์เล็กคั่นด้วยขีดล่างจากการส่งถาวรหรือการตรวจสอบก่อนส่ง ค่าที่ทราบ ได้แก่ `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` และ `no_delivery_target` ส่วนการส่งถาวรที่ล้มเหลวอาจรายงานขั้นตอนที่ล้มเหลวด้วย ให้ถือว่าค่าที่ไม่รู้จักเป็นข้อมูลทึบแสง เนื่องจากชุดค่านี้อาจเพิ่มขึ้นได้
- `resultCount`: จำนวนผลลัพธ์การส่งผ่านช่องทาง เมื่อมีข้อมูล
- `sentBeforeError`: เป็น `true` เมื่อความล้มเหลวบางส่วนส่งเพย์โหลดอย่างน้อยหนึ่งรายการก่อนเกิดข้อผิดพลาด
- `error`: เป็น `true` สำหรับการส่งที่ล้มเหลวหรือล้มเหลวบางส่วน
- `errorMessage`: มีเฉพาะเมื่อบันทึกข้อความข้อผิดพลาดพื้นฐานของการส่งได้ ความล้มเหลวก่อนส่งจะมี `error`/`reason` แต่ไม่มี `errorMessage`
- `payloadOutcomes`: ผลลัพธ์รายเพย์โหลดที่เป็นทางเลือก ซึ่งอาจมี `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` หรือเมทาดาทาของฮุกเมื่อมีข้อมูล

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [รันไทม์ของ Agent](/th/concepts/agent)
