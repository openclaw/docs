---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่จัดเก็บไว้และดูกิจกรรมล่าสุด
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่จัดเก็บไว้ + การใช้งาน)
title: เซสชัน
x-i18n:
    generated_at: "2026-04-30T09:44:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

แสดงรายการเซสชันการสนทนาที่จัดเก็บไว้

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

การเลือกขอบเขต:

- ค่าเริ่มต้น: ที่เก็บเอเจนต์เริ่มต้นที่กำหนดค่าไว้
- `--verbose`: การบันทึกรายละเอียดแบบละเอียด
- `--agent <id>`: ที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: รวมที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เส้นทางที่เก็บแบบระบุชัดเจน (ใช้ร่วมกับ `--agent` หรือ `--all-agents` ไม่ได้)

ส่งออกบันเดิล trajectory สำหรับเซสชันที่จัดเก็บไว้:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

นี่คือเส้นทางคำสั่งที่คำสั่ง slash `/export-trajectory` ใช้หลังจาก
เจ้าของอนุมัติคำขอ exec แล้ว ไดเรกทอรีเอาต์พุตจะถูก resolve
ภายใน `.openclaw/trajectory-exports/` ใต้ workspace ที่เลือกเสมอ

`openclaw sessions --all-agents` อ่านที่เก็บเอเจนต์ที่กำหนดค่าไว้ การค้นพบเซสชันของ Gateway และ ACP
มีขอบเขตกว้างกว่า: รวมถึงที่เก็บแบบมีเฉพาะบนดิสก์ที่พบใต้
ราก `agents/` เริ่มต้นหรือราก `session.store` แบบเทมเพลตด้วย ที่เก็บ
ที่ค้นพบเหล่านั้นต้อง resolve เป็นไฟล์ `sessions.json` ปกติภายใน
รากของเอเจนต์; symlink และเส้นทางที่อยู่นอกรากจะถูกข้าม

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

## การบำรุงรักษา Cleanup

เรียกใช้การบำรุงรักษาตอนนี้ (แทนการรอรอบการเขียนถัดไป):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` ใช้การตั้งค่า `session.maintenance` จาก config:

- หมายเหตุเกี่ยวกับขอบเขต: `openclaw sessions cleanup` บำรุงรักษาที่เก็บเซสชัน ทรานสคริปต์ และ sidecar ของ trajectory โดยจะไม่ตัดแต่งบันทึกการรัน Cron (`cron/runs/<jobId>.jsonl`) ซึ่งจัดการโดย `cron.runLog.maxBytes` และ `cron.runLog.keepLines` ใน [การกำหนดค่า Cron](/th/automation/cron-jobs#configuration) และอธิบายไว้ใน [การบำรุงรักษา Cron](/th/automation/cron-jobs#maintenance)

- `--dry-run`: แสดงตัวอย่างจำนวนรายการที่จะถูกตัดแต่ง/จำกัดโดยไม่เขียนข้อมูล
  - ในโหมดข้อความ dry-run จะแสดงตารางการดำเนินการต่อเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) เพื่อให้คุณดูได้ว่าอะไรจะถูกเก็บไว้เทียบกับถูกลบออก
- `--enforce`: ใช้การบำรุงรักษาแม้เมื่อ `session.maintenance.mode` เป็น `warn`
- `--fix-missing`: ลบรายการที่ไม่มีไฟล์ทรานสคริปต์ แม้ว่าปกติแล้วยังไม่ควรถูกนำออกด้วยอายุ/จำนวนก็ตาม
- `--active-key <key>`: ปกป้องคีย์ที่ใช้งานอยู่ที่ระบุจากการถูกขับออกด้วยงบดิสก์
- `--agent <id>`: เรียก cleanup สำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: เรียก cleanup สำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เรียกกับไฟล์ `sessions.json` ที่ระบุ
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

- Config ของเซสชัน: [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#session)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจัดการเซสชัน](/th/concepts/session)
