---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่บันทึกไว้และดูกิจกรรมล่าสุด
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่จัดเก็บไว้ + การใช้งาน)
title: เซสชัน
x-i18n:
    generated_at: "2026-05-02T10:12:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c7f0d521756ace4af05451b925256f89661bf971533541764c128e2be9d6431
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

แสดงรายการเซสชันการสนทนาที่จัดเก็บไว้

รายการเซสชันไม่ใช่การตรวจสอบความพร้อมใช้งานของแชนเนล/ผู้ให้บริการ รายการเหล่านี้แสดงแถวการสนทนาที่คงไว้จากที่เก็บเซสชัน แชนเนล Discord, Slack, Telegram หรือแชนเนลอื่นที่เงียบอยู่สามารถเชื่อมต่อใหม่ได้สำเร็จโดยไม่สร้างแถวเซสชันใหม่ จนกว่าจะมีการประมวลผลข้อความ ใช้ `openclaw channels status --probe`, `openclaw status --deep` หรือ `openclaw health --verbose` เมื่อคุณต้องการการเชื่อมต่อแชนเนลแบบสด

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

การเลือกขอบเขต:

- ค่าเริ่มต้น: ที่เก็บของเอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้
- `--verbose`: การบันทึกโดยละเอียด
- `--agent <id>`: ที่เก็บของเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: รวมที่เก็บของเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: พาธที่เก็บแบบระบุชัดเจน (ไม่สามารถใช้ร่วมกับ `--agent` หรือ `--all-agents` ได้)

ส่งออกบันเดิลทราเจกทอรีสำหรับเซสชันที่จัดเก็บไว้:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

นี่คือพาธคำสั่งที่คำสั่งสแลช `/export-trajectory` ใช้หลังจากเจ้าของอนุมัติคำขอ exec แล้ว ไดเรกทอรีเอาต์พุตจะถูกแก้พาธภายใน `.openclaw/trajectory-exports/` ภายใต้พื้นที่ทำงานที่เลือกเสมอ

`openclaw sessions --all-agents` อ่านที่เก็บของเอเจนต์ที่กำหนดค่าไว้ การค้นพบเซสชันของ Gateway และ ACP มีขอบเขตกว้างกว่า: ยังรวมที่เก็บที่มีอยู่เฉพาะบนดิสก์ซึ่งพบภายใต้ราก `agents/` ค่าเริ่มต้น หรือราก `session.store` แบบเทมเพลตด้วย ที่เก็บที่ค้นพบเหล่านั้นต้องแก้พาธไปยังไฟล์ `sessions.json` ปกติภายในรากของเอเจนต์; ซิมลิงก์และพาธที่อยู่นอกรากจะถูกข้าม

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
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## การบำรุงรักษาการล้างข้อมูล

เรียกใช้การบำรุงรักษาตอนนี้ (แทนการรอรอบการเขียนถัดไป):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` ใช้การตั้งค่า `session.maintenance` จากการกำหนดค่า:

- หมายเหตุขอบเขต: `openclaw sessions cleanup` บำรุงรักษาที่เก็บเซสชัน ทรานสคริปต์ และไฟล์ข้างเคียงของทราเจกทอรี โดยไม่ตัดแต่งบันทึกการเรียกใช้ cron (`cron/runs/<jobId>.jsonl`) ซึ่งจัดการโดย `cron.runLog.maxBytes` และ `cron.runLog.keepLines` ใน [การกำหนดค่า Cron](/th/automation/cron-jobs#configuration) และอธิบายไว้ใน [การบำรุงรักษา Cron](/th/automation/cron-jobs#maintenance)

- `--dry-run`: แสดงตัวอย่างจำนวนรายการที่จะถูกตัดแต่ง/จำกัดโดยไม่เขียนข้อมูล
  - ในโหมดข้อความ dry-run จะพิมพ์ตารางการดำเนินการรายเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) เพื่อให้คุณเห็นว่าอะไรจะถูกเก็บไว้เทียบกับถูกนำออก
- `--enforce`: ใช้การบำรุงรักษาแม้เมื่อ `session.maintenance.mode` เป็น `warn`
- `--fix-missing`: นำรายการที่ไฟล์ทรานสคริปต์หายไปออก แม้ว่าปกติแล้วรายการเหล่านั้นจะยังไม่ถูกคัดออกด้วยอายุ/จำนวนก็ตาม
- `--active-key <key>`: ปกป้องคีย์ที่ใช้งานอยู่ที่ระบุจากการขับออกตามงบดิสก์ พอยน์เตอร์การสนทนาภายนอกแบบคงทน เช่น เซสชันกลุ่มและเซสชันแชตที่จำกัดขอบเขตตามเธรด จะถูกเก็บไว้โดยการบำรุงรักษาตามอายุ/จำนวน/งบดิสก์ด้วย
- `--agent <id>`: เรียกใช้การล้างข้อมูลสำหรับที่เก็บของเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: เรียกใช้การล้างข้อมูลสำหรับที่เก็บของเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เรียกใช้กับไฟล์ `sessions.json` ที่ระบุ
- `--json`: พิมพ์สรุป JSON เมื่อใช้กับ `--all-agents` เอาต์พุตจะรวมสรุปหนึ่งรายการต่อที่เก็บ

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

- การกำหนดค่าเซสชัน: [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#session)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจัดการเซสชัน](/th/concepts/session)
