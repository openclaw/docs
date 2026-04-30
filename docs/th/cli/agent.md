---
read_when:
    - คุณต้องการเรียกใช้งานเอเจนต์หนึ่งรอบจากสคริปต์ (เลือกส่งคำตอบได้)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw agent` (ส่งหนึ่งเทิร์นของเอเจนต์ผ่าน Gateway)
title: เอเจนต์
x-i18n:
    generated_at: "2026-04-30T09:40:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
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

- เครื่องมือส่งเอเจนต์: [ส่งเอเจนต์](/th/tools/agent-send)

## ตัวเลือก

- `-m, --message <text>`: เนื้อหาข้อความที่จำเป็น
- `-t, --to <dest>`: ผู้รับที่ใช้เพื่อสร้างคีย์เซสชัน
- `--session-id <id>`: รหัสเซสชันแบบระบุชัดเจน
- `--agent <id>`: รหัสเอเจนต์; แทนที่การผูกการกำหนดเส้นทาง
- `--model <id>`: แทนที่โมเดลสำหรับการเรียกใช้นี้ (`provider/model` หรือรหัสโมเดล)
- `--thinking <level>`: ระดับการคิดของเอเจนต์ (`off`, `minimal`, `low`, `medium`, `high` รวมถึงระดับกำหนดเองที่ผู้ให้บริการรองรับ เช่น `xhigh`, `adaptive` หรือ `max`)
- `--verbose <on|off>`: คงระดับ verbose ไว้สำหรับเซสชัน
- `--channel <channel>`: ช่องทางการส่ง; ละไว้เพื่อใช้ช่องทางเซสชันหลัก
- `--reply-to <target>`: แทนที่เป้าหมายการส่ง
- `--reply-channel <channel>`: แทนที่ช่องทางการส่ง
- `--reply-account <id>`: แทนที่บัญชีการส่ง
- `--local`: เรียกใช้เอเจนต์แบบฝังตัวโดยตรง (หลังจากโหลดรีจิสทรี Plugin ล่วงหน้า)
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

- โหมด Gateway จะย้อนกลับไปใช้เอเจนต์แบบฝังตัวเมื่อคำขอ Gateway ล้มเหลว ใช้ `--local` เพื่อบังคับใช้การดำเนินการแบบฝังตัวตั้งแต่แรก
- `--local` ยังโหลดรีจิสทรี Plugin ล่วงหน้าก่อน ดังนั้นผู้ให้บริการ เครื่องมือ และช่องทางที่ Plugin จัดเตรียมให้จะยังพร้อมใช้งานระหว่างการเรียกใช้แบบฝังตัว
- การเรียกใช้ `--local` และการเรียกใช้สำรองแบบฝังตัวจะถือเป็นการเรียกใช้ครั้งเดียว ทรัพยากร loopback ของ MCP ที่รวมมาให้ และเซสชัน stdio ของ Claude แบบอุ่นเครื่องที่เปิดไว้สำหรับโปรเซส local นั้นจะถูกเลิกใช้หลังจากตอบกลับแล้ว ดังนั้นการเรียกใช้ผ่านสคริปต์จะไม่คงโปรเซสลูกในเครื่องไว้
- การเรียกใช้ที่อิง Gateway จะคงทรัพยากร loopback ของ MCP ที่ Gateway เป็นเจ้าของไว้ภายใต้โปรเซส Gateway ที่กำลังทำงานอยู่; ไคลเอนต์รุ่นเก่าอาจยังส่งแฟล็ก cleanup แบบเดิม แต่ Gateway ยอมรับแฟล็กนั้นเป็น no-op เพื่อความเข้ากันได้
- `--channel`, `--reply-channel` และ `--reply-account` มีผลต่อการส่งคำตอบ ไม่ใช่การกำหนดเส้นทางเซสชัน
- `--json` สงวน stdout ไว้สำหรับการตอบกลับ JSON การวินิจฉัยจาก Gateway, Plugin และ embedded-fallback จะถูกส่งไปยัง stderr เพื่อให้สคริปต์แยกวิเคราะห์ stdout ได้โดยตรง
- JSON ของ embedded fallback มี `meta.transport: "embedded"` และ `meta.fallbackFrom: "gateway"` เพื่อให้สคริปต์แยกการเรียกใช้สำรองออกจากการเรียกใช้ Gateway ได้
- หาก Gateway ยอมรับการเรียกใช้เอเจนต์ แต่ CLI หมดเวลารอคำตอบสุดท้าย embedded fallback จะใช้รหัสเซสชัน/การเรียกใช้ `gateway-fallback-*` แบบระบุชัดเจนที่สร้างใหม่ และรายงาน `meta.fallbackReason: "gateway_timeout"` พร้อมฟิลด์เซสชันสำรอง วิธีนี้หลีกเลี่ยงการแข่งกับการล็อกทรานสคริปต์ที่ Gateway เป็นเจ้าของ หรือการแทนที่เซสชันสนทนาที่กำหนดเส้นทางไว้เดิมโดยเงียบ ๆ
- เมื่อคำสั่งนี้ทริกเกอร์การสร้าง `models.json` ใหม่ ข้อมูลประจำตัวของผู้ให้บริการที่จัดการด้วย SecretRef จะถูกคงไว้เป็นมาร์กเกอร์ที่ไม่ใช่ความลับ (เช่น ชื่อตัวแปรสภาพแวดล้อม, `secretref-env:ENV_VAR_NAME` หรือ `secretref-managed`) ไม่ใช่ข้อความลับแบบ plaintext ที่ถูกแก้ค่าแล้ว
- การเขียนมาร์กเกอร์ถือแหล่งที่มาเป็นอำนาจกำหนด: OpenClaw จะคงมาร์กเกอร์จากสแนปชอตคอนฟิกแหล่งที่มาที่ใช้งานอยู่ ไม่ใช่จากค่าความลับรันไทม์ที่ถูกแก้ค่าแล้ว

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [รันไทม์เอเจนต์](/th/concepts/agent)
