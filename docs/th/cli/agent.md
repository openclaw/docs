---
read_when:
    - คุณต้องการรันหนึ่งเทิร์นของเอเจนต์จากสคริปต์ (และเลือกได้ว่าจะส่งคำตอบกลับหรือไม่)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw agent` (ส่งหนึ่งเทิร์นของเอเจนต์ผ่าน Gateway)
title: เอเจนต์
x-i18n:
    generated_at: "2026-04-25T13:43:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

รันหนึ่งเทิร์นของเอเจนต์ผ่าน Gateway (ใช้ `--local` สำหรับแบบฝังในตัว)
ใช้ `--agent <id>` เพื่อระบุเอเจนต์ที่กำหนดค่าไว้โดยตรง

ต้องส่งตัวเลือกตัวระบุเซสชันอย่างน้อยหนึ่งรายการ:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

ที่เกี่ยวข้อง:

- เครื่องมือส่งเอเจนต์: [Agent send](/th/tools/agent-send)

## ตัวเลือก

- `-m, --message <text>`: เนื้อหาข้อความที่ต้องระบุ
- `-t, --to <dest>`: ผู้รับที่ใช้เพื่อสร้างคีย์เซสชัน
- `--session-id <id>`: session id แบบระบุชัดเจน
- `--agent <id>`: agent id; จะแทนที่การผูกการกำหนดเส้นทาง
- `--thinking <level>`: ระดับการคิดของเอเจนต์ (`off`, `minimal`, `low`, `medium`, `high` รวมถึงระดับกำหนดเองที่ provider รองรับ เช่น `xhigh`, `adaptive` หรือ `max`)
- `--verbose <on|off>`: คงค่าระดับ verbose ไว้สำหรับเซสชัน
- `--channel <channel>`: ช่องทางการส่ง; หากไม่ระบุจะใช้ช่องทางหลักของเซสชัน
- `--reply-to <target>`: แทนที่เป้าหมายการส่งคำตอบ
- `--reply-channel <channel>`: แทนที่ช่องทางการส่งคำตอบ
- `--reply-account <id>`: แทนที่บัญชีสำหรับการส่งคำตอบ
- `--local`: รันเอเจนต์แบบฝังในตัวโดยตรง (หลัง preload รีจิสทรี Plugin)
- `--deliver`: ส่งคำตอบกลับไปยังช่องทาง/เป้าหมายที่เลือก
- `--timeout <seconds>`: แทนที่ระยะหมดเวลาของเอเจนต์ (ค่าเริ่มต้น 600 หรือค่าจาก config)
- `--json`: แสดงผลเป็น JSON

## ตัวอย่าง

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## หมายเหตุ

- โหมด Gateway จะ fallback ไปใช้เอเจนต์แบบฝังในตัวเมื่อคำขอ Gateway ล้มเหลว ใช้ `--local` เพื่อบังคับการทำงานแบบฝังในตัวตั้งแต่ต้น
- `--local` จะยัง preload รีจิสทรี Plugin ก่อน ดังนั้น provider, tools และช่องทางที่ Plugin จัดให้ยังคงพร้อมใช้งานระหว่างการรันแบบฝังในตัว
- การเรียกใช้ `openclaw agent` แต่ละครั้งจะถือเป็นการรันแบบ one-shot เซิร์ฟเวอร์ MCP ที่มากับระบบหรือที่ผู้ใช้กำหนดค่าไว้ซึ่งถูกเปิดสำหรับการรันนั้นจะถูกยุติหลังตอบกลับ แม้ว่าคำสั่งจะใช้เส้นทาง Gateway ก็ตาม ดังนั้นโปรเซสลูก stdio MCP จะไม่คงอยู่ระหว่างการเรียกใช้จากสคริปต์แต่ละครั้ง
- `--channel`, `--reply-channel` และ `--reply-account` มีผลต่อการส่งคำตอบกลับ ไม่ใช่การกำหนดเส้นทางเซสชัน
- `--json` จะสงวน stdout ไว้สำหรับการตอบกลับแบบ JSON ส่วนข้อมูลวินิจฉัยจาก Gateway, Plugin และ embedded-fallback จะถูกส่งไปยัง stderr เพื่อให้สคริปต์สามารถแยกวิเคราะห์ stdout ได้โดยตรง
- เมื่อคำสั่งนี้กระตุ้นให้เกิดการสร้าง `models.json` ใหม่ ข้อมูลรับรอง provider ที่จัดการด้วย SecretRef จะถูกบันทึกเป็นตัวบ่งชี้ที่ไม่เป็นความลับ (เช่น ชื่อ env var, `secretref-env:ENV_VAR_NAME` หรือ `secretref-managed`) ไม่ใช่ข้อความล้วนของความลับที่ถูก resolve แล้ว
- การเขียนตัวบ่งชี้จะยึดแหล่งที่มาเป็นหลัก: OpenClaw จะบันทึกตัวบ่งชี้จากสแนปชอต config ของแหล่งที่มาที่กำลังใช้งาน ไม่ใช่จากค่าความลับรันไทม์ที่ถูก resolve แล้ว

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [รันไทม์เอเจนต์](/th/concepts/agent)
