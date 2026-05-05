---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่จัดเก็บไว้และดูกิจกรรมล่าสุด
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่บันทึกไว้ + วิธีใช้)
title: เซสชัน
x-i18n:
    generated_at: "2026-05-05T01:44:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

แสดงรายการเซสชันการสนทนาที่จัดเก็บไว้

รายการเซสชันไม่ใช่การตรวจสอบความพร้อมใช้งานของช่องทาง/ผู้ให้บริการ รายการเหล่านี้แสดงแถวการสนทนาที่คงอยู่จากที่เก็บเซสชัน ช่องทาง Discord, Slack, Telegram หรือช่องทางอื่นที่เงียบอยู่สามารถเชื่อมต่อใหม่ได้สำเร็จโดยไม่สร้างแถวเซสชันใหม่จนกว่าจะมีการประมวลผลข้อความ ใช้ `openclaw channels status --probe`, `openclaw status --deep` หรือ `openclaw health --verbose` เมื่อคุณต้องการการเชื่อมต่อช่องทางแบบสด

การตอบกลับของ `openclaw sessions` และ Gateway `sessions.list` ถูกจำกัดขอบเขตโดยค่าเริ่มต้น เพื่อให้ที่เก็บขนาดใหญ่ที่ใช้งานมานานไม่ผูกขาดกระบวนการ CLI หรือ event loop ของ Gateway โดยค่าเริ่มต้น CLI จะคืนค่าเซสชันล่าสุด 100 รายการ ส่ง `--limit <n>` สำหรับช่วงที่เล็กลง/ใหญ่ขึ้น หรือ `--limit all` เมื่อคุณตั้งใจต้องการที่เก็บทั้งหมด การตอบกลับ JSON จะรวม `totalCount`, `limitApplied` และ `hasMore` เมื่อผู้เรียกต้องแสดงว่ายังมีแถวเพิ่มเติมอยู่

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

การเลือกขอบเขต:

- ค่าเริ่มต้น: ที่เก็บเอเจนต์เริ่มต้นที่กำหนดค่าไว้
- `--verbose`: การบันทึกแบบละเอียด
- `--agent <id>`: ที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: รวมที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: พาธที่เก็บแบบระบุชัดเจน (ใช้ร่วมกับ `--agent` หรือ `--all-agents` ไม่ได้)
- `--limit <n|all>`: จำนวนแถวสูงสุดที่จะแสดงผล (ค่าเริ่มต้น `100`; `all` คืนค่าการแสดงผลทั้งหมด)

ส่งออกบันเดิล trajectory สำหรับเซสชันที่จัดเก็บไว้:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

นี่คือเส้นทางคำสั่งที่คำสั่ง slash `/export-trajectory` ใช้หลังจากเจ้าของอนุมัติคำขอ exec แล้ว ไดเรกทอรีเอาต์พุตจะถูก resolve ภายใน `.openclaw/trajectory-exports/` ภายใต้ workspace ที่เลือกเสมอ

`openclaw sessions --all-agents` อ่านที่เก็บเอเจนต์ที่กำหนดค่าไว้ การค้นพบเซสชันของ Gateway และ ACP กว้างกว่า: ยังรวมถึงที่เก็บบนดิสก์เท่านั้นที่พบภายใต้ root เริ่มต้น `agents/` หรือ root `session.store` แบบเทมเพลต ที่เก็บที่ค้นพบเหล่านั้นต้อง resolve เป็นไฟล์ `sessions.json` ปกติภายใน root ของเอเจนต์; symlink และพาธที่อยู่นอก root จะถูกข้าม

ตัวอย่าง JSON:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## การบำรุงรักษาการล้างข้อมูล

เรียกใช้การบำรุงรักษาทันที (แทนที่จะรอรอบการเขียนถัดไป):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` ใช้การตั้งค่า `session.maintenance` จาก config:

- หมายเหตุขอบเขต: `openclaw sessions cleanup` ดูแลรักษาที่เก็บเซสชัน transcript และ sidecar ของ trajectory โดยจะไม่ prune บันทึกการเรียกใช้ Cron (`cron/runs/<jobId>.jsonl`) ซึ่งจัดการโดย `cron.runLog.maxBytes` และ `cron.runLog.keepLines` ใน [การกำหนดค่า Cron](/th/automation/cron-jobs#configuration) และอธิบายไว้ใน [การบำรุงรักษา Cron](/th/automation/cron-jobs#maintenance)

- `--dry-run`: แสดงตัวอย่างจำนวนรายการที่จะถูก prune/จำกัดโดยไม่เขียนข้อมูล
  - ในโหมดข้อความ dry-run จะแสดงตารางการดำเนินการต่อเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) เพื่อให้คุณเห็นว่าสิ่งใดจะถูกเก็บไว้เทียบกับถูกลบออก
- `--enforce`: ใช้การบำรุงรักษาแม้เมื่อ `session.maintenance.mode` เป็น `warn`
- `--fix-missing`: ลบรายการที่ไฟล์ transcript หายไป แม้โดยปกติรายการเหล่านั้นยังไม่ควรถูกนำออกตามอายุ/จำนวน
- `--active-key <key>`: ป้องกันคีย์ที่ใช้งานอยู่เฉพาะจากการขับออกตามงบดิสก์ ตัวชี้การสนทนาภายนอกแบบคงทน เช่น เซสชันกลุ่มและเซสชันแชตตามขอบเขตเธรด จะถูกเก็บไว้โดยการบำรุงรักษาตามอายุ/จำนวน/งบดิสก์เช่นกัน
- `--agent <id>`: เรียกใช้การล้างข้อมูลสำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: เรียกใช้การล้างข้อมูลสำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เรียกใช้กับไฟล์ `sessions.json` ที่ระบุ
- `--json`: พิมพ์สรุป JSON เมื่อใช้กับ `--all-agents` เอาต์พุตจะรวมสรุปหนึ่งรายการต่อที่เก็บ

เมื่อ Gateway เข้าถึงได้ การล้างข้อมูลที่ไม่ใช่ dry-run สำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้จะถูกส่งผ่าน Gateway เพื่อให้ใช้ตัวเขียนที่เก็บเซสชันเดียวกับทราฟฟิกรันไทม์ ใช้ `--store <path>` สำหรับการซ่อมแซมไฟล์ที่เก็บแบบออฟไลน์อย่างชัดเจน

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

ที่เกี่ยวข้อง:

- การกำหนดค่าเซสชัน: [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#session)

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การจัดการเซสชัน](/th/concepts/session)
