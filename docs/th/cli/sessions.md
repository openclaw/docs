---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่จัดเก็บไว้และดูกิจกรรมล่าสุด
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่จัดเก็บไว้ + การใช้งาน)
title: เซสชัน
x-i18n:
    generated_at: "2026-05-02T20:42:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c9ec3ca55f7c5b6217b481e9da62f5416df73e69405a0dc15e77d2afeac723f
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

แสดงรายการเซสชันการสนทนาที่จัดเก็บไว้

รายการเซสชันไม่ใช่การตรวจสอบว่าช่องทาง/ผู้ให้บริการยังเชื่อมต่ออยู่หรือไม่ รายการเหล่านี้แสดงแถวการสนทนาที่บันทึกถาวรจากที่จัดเก็บเซสชัน ช่องทาง Discord, Slack, Telegram หรือช่องทางอื่นที่เงียบอยู่สามารถเชื่อมต่อใหม่ได้สำเร็จโดยไม่สร้างแถวเซสชันใหม่จนกว่าจะมีการประมวลผลข้อความ ใช้ `openclaw channels status --probe`, `openclaw status --deep` หรือ `openclaw health --verbose` เมื่อคุณต้องการตรวจสอบการเชื่อมต่อช่องทางแบบสด

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

การเลือกขอบเขต:

- ค่าเริ่มต้น: ที่จัดเก็บเอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้
- `--verbose`: การบันทึกรายละเอียด
- `--agent <id>`: ที่จัดเก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: รวมที่จัดเก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เส้นทางที่จัดเก็บแบบระบุชัดเจน (ไม่สามารถใช้ร่วมกับ `--agent` หรือ `--all-agents` ได้)

ส่งออกชุด trajectory สำหรับเซสชันที่จัดเก็บไว้:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

นี่คือเส้นทางคำสั่งที่คำสั่ง slash `/export-trajectory` ใช้หลังจากเจ้าของอนุมัติคำขอ exec แล้ว ไดเรกทอรีเอาต์พุตจะถูกแก้เส้นทางภายใน `.openclaw/trajectory-exports/` ภายใต้เวิร์กสเปซที่เลือกเสมอ

`openclaw sessions --all-agents` อ่านที่จัดเก็บเอเจนต์ที่กำหนดค่าไว้ การค้นหาเซสชันของ Gateway และ ACP มีขอบเขตกว้างกว่า: ยังรวมถึงที่จัดเก็บที่มีอยู่เฉพาะบนดิสก์ซึ่งพบภายใต้ราก `agents/` ค่าเริ่มต้น หรือราก `session.store` แบบเทมเพลต ที่จัดเก็บที่ค้นพบเหล่านั้นต้องแก้เส้นทางเป็นไฟล์ `sessions.json` ปกติภายในรากของเอเจนต์; symlink และเส้นทางที่อยู่นอกรากจะถูกข้าม

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

## การบำรุงรักษาเพื่อล้างข้อมูล

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

- หมายเหตุเรื่องขอบเขต: `openclaw sessions cleanup` ดูแลที่จัดเก็บเซสชัน transcript และ sidecar ของ trajectory โดยไม่ตัดทอนบันทึกการรัน Cron (`cron/runs/<jobId>.jsonl`) ซึ่งจัดการโดย `cron.runLog.maxBytes` และ `cron.runLog.keepLines` ใน [การกำหนดค่า Cron](/th/automation/cron-jobs#configuration) และอธิบายใน [การบำรุงรักษา Cron](/th/automation/cron-jobs#maintenance)

- `--dry-run`: ดูตัวอย่างจำนวนรายการที่จะถูกตัดทอน/จำกัดจำนวนโดยไม่เขียนข้อมูล
  - ในโหมดข้อความ dry-run จะพิมพ์ตารางการดำเนินการรายเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) เพื่อให้คุณเห็นว่าอะไรจะถูกเก็บไว้เทียบกับลบออก
- `--enforce`: ใช้การบำรุงรักษาแม้เมื่อ `session.maintenance.mode` เป็น `warn`
- `--fix-missing`: ลบรายการที่ไม่มีไฟล์ transcript แม้ว่าปกติรายการเหล่านั้นจะยังไม่ถูกคัดออกตามอายุ/จำนวนก็ตาม
- `--active-key <key>`: ป้องกันคีย์ที่ใช้งานอยู่รายการใดรายการหนึ่งจากการถูกขับออกเพราะงบดิสก์ ตัวชี้การสนทนาภายนอกแบบคงทน เช่น เซสชันกลุ่มและเซสชันแชตที่ผูกกับเธรด จะถูกเก็บไว้โดยการบำรุงรักษาตามอายุ/จำนวน/งบดิสก์เช่นกัน
- `--agent <id>`: เรียกใช้การล้างข้อมูลสำหรับที่จัดเก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: เรียกใช้การล้างข้อมูลสำหรับที่จัดเก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เรียกใช้กับไฟล์ `sessions.json` ที่ระบุ
- `--json`: พิมพ์สรุป JSON เมื่อใช้ร่วมกับ `--all-agents` เอาต์พุตจะรวมสรุปหนึ่งรายการต่อที่จัดเก็บ

เมื่อ Gateway เข้าถึงได้ การล้างข้อมูลแบบไม่ใช่ dry-run สำหรับที่จัดเก็บเอเจนต์ที่กำหนดค่าไว้จะถูกส่งผ่าน Gateway เพื่อให้ใช้ตัวเขียนที่จัดเก็บเซสชันเดียวกับทราฟฟิกรันไทม์ ใช้ `--store <path>` สำหรับการซ่อมแซมไฟล์ที่จัดเก็บแบบออฟไลน์อย่างชัดเจน

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
