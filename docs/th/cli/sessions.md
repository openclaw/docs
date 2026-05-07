---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่จัดเก็บไว้และดูกิจกรรมล่าสุด
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่บันทึกไว้ + การใช้งาน)
title: เซสชัน
x-i18n:
    generated_at: "2026-05-07T13:14:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

แสดงรายการเซสชันการสนทนาที่จัดเก็บไว้

รายการเซสชันไม่ใช่การตรวจสอบความพร้อมใช้งานของช่องทาง/ผู้ให้บริการ รายการเหล่านี้แสดงแถวการสนทนาที่บันทึกถาวรจากแหล่งจัดเก็บเซสชัน ช่องทาง Discord, Slack, Telegram หรือช่องทางอื่นที่เงียบอยู่สามารถเชื่อมต่อใหม่ได้สำเร็จโดยไม่สร้างแถวเซสชันใหม่จนกว่าจะมีการประมวลผลข้อความ ใช้ `openclaw channels status --probe`, `openclaw status --deep` หรือ `openclaw health --verbose` เมื่อต้องการการเชื่อมต่อช่องทางแบบสด

คำตอบของ `openclaw sessions` และ Gateway `sessions.list` จะถูกจำกัดขอบเขตตามค่าเริ่มต้น เพื่อให้แหล่งจัดเก็บขนาดใหญ่ที่ใช้งานมานานไม่ผูกขาดโปรเซส CLI หรือลูปเหตุการณ์ของ Gateway ตามค่าเริ่มต้น CLI จะคืนค่าเซสชันใหม่ล่าสุด 100 รายการ ส่ง `--limit <n>` สำหรับช่วงที่เล็กลง/ใหญ่ขึ้น หรือ `--limit all` เมื่อคุณต้องการแหล่งจัดเก็บทั้งหมดโดยตั้งใจ คำตอบ JSON จะมี `totalCount`, `limitApplied` และ `hasMore` เมื่อผู้เรียกต้องการแสดงว่ายังมีแถวเพิ่มเติมอยู่

ไคลเอนต์ RPC สามารถส่ง `configuredAgentsOnly: true` เพื่อคงแหล่งค้นพบแบบรวมที่กว้างไว้ แต่คืนค่าเฉพาะแถวของเอเจนต์ที่มีอยู่ในค่ากำหนดปัจจุบัน Control UI ใช้โหมดนั้นตามค่าเริ่มต้น เพื่อไม่ให้แหล่งจัดเก็บเอเจนต์ที่ถูกลบแล้วหรือมีอยู่เฉพาะบนดิสก์กลับมาแสดงในมุมมอง Sessions

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

- ค่าเริ่มต้น: แหล่งจัดเก็บของเอเจนต์เริ่มต้นที่กำหนดค่าไว้
- `--verbose`: การบันทึกแบบละเอียด
- `--agent <id>`: แหล่งจัดเก็บของเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: รวมแหล่งจัดเก็บของเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เส้นทางแหล่งจัดเก็บแบบระบุชัดเจน (ไม่สามารถใช้ร่วมกับ `--agent` หรือ `--all-agents`)
- `--limit <n|all>`: จำนวนแถวสูงสุดที่จะส่งออก (ค่าเริ่มต้น `100`; `all` จะคืนค่าการส่งออกทั้งหมด)

ส่งออกบันเดิลทราเจกทอรีสำหรับเซสชันที่จัดเก็บไว้:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

นี่คือเส้นทางคำสั่งที่คำสั่งสแลช `/export-trajectory` ใช้หลังจากเจ้าของอนุมัติคำขอ exec แล้ว ไดเรกทอรีผลลัพธ์จะถูกแก้ไขเส้นทางให้อยู่ภายใน `.openclaw/trajectory-exports/` ใต้เวิร์กสเปซที่เลือกเสมอ

`openclaw sessions --all-agents` อ่านแหล่งจัดเก็บของเอเจนต์ที่กำหนดค่าไว้ การค้นพบเซสชันของ Gateway และ ACP กว้างกว่า: ยังรวมแหล่งจัดเก็บที่มีอยู่เฉพาะบนดิสก์ซึ่งพบใต้ราก `agents/` เริ่มต้น หรือราก `session.store` แบบเทมเพลต แหล่งจัดเก็บที่ค้นพบเหล่านั้นต้องแก้ไขเส้นทางเป็นไฟล์ `sessions.json` ปกติภายในรากของเอเจนต์; symlink และเส้นทางที่อยู่นอกรากจะถูกข้าม

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

เรียกใช้การบำรุงรักษาตอนนี้ (แทนการรอรอบการเขียนถัดไป):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` ใช้การตั้งค่า `session.maintenance` จากค่ากำหนด:

- หมายเหตุขอบเขต: `openclaw sessions cleanup` บำรุงรักษาแหล่งจัดเก็บเซสชัน ทรานสคริปต์ และ sidecar ของทราเจกทอรี โดยจะไม่ตัดบันทึกการรัน cron (`cron/runs/<jobId>.jsonl`) ซึ่งจัดการโดย `cron.runLog.maxBytes` และ `cron.runLog.keepLines` ใน [ค่ากำหนด Cron](/th/automation/cron-jobs#configuration) และอธิบายใน [การบำรุงรักษา Cron](/th/automation/cron-jobs#maintenance)
- การล้างข้อมูลยังตัดทรานสคริปต์หลักที่ไม่มีการอ้างอิง เช็กพอยต์ Compaction และ sidecar ของทราเจกทอรีที่เก่ากว่า `session.maintenance.pruneAfter`; ไฟล์ที่ยังถูกอ้างอิงโดย `sessions.json` จะถูกเก็บไว้

- `--dry-run`: ดูตัวอย่างว่ามีกี่รายการที่จะถูกตัด/จำกัดโดยไม่เขียนข้อมูล
  - ในโหมดข้อความ dry-run จะพิมพ์ตารางการดำเนินการรายเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) เพื่อให้คุณเห็นว่าสิ่งใดจะถูกเก็บไว้เทียบกับถูกนำออก
- `--enforce`: ใช้การบำรุงรักษาแม้เมื่อ `session.maintenance.mode` เป็น `warn`
- `--fix-missing`: ลบรายการที่ไฟล์ทรานสคริปต์หายไป แม้โดยปกติรายการเหล่านั้นจะยังไม่ถูกคัดออกตามอายุ/จำนวน
- `--fix-dm-scope`: เมื่อ `session.dmScope` เป็น `main` ให้เลิกใช้แถว direct-DM ที่คีย์ตามเพียร์ซึ่งค้างอยู่จากการกำหนดเส้นทางแบบ `per-peer`, `per-channel-peer` หรือ `per-account-channel-peer` ก่อนหน้านี้ ใช้ `--dry-run` ก่อน; การใช้การล้างข้อมูลจะนำแถวเหล่านั้นออกจาก `sessions.json` และเก็บทรานสคริปต์ของแถวเหล่านั้นเป็นไฟล์เก็บถาวรที่ถูกลบแล้ว
- `--active-key <key>`: ปกป้องคีย์ที่ใช้งานอยู่เฉพาะจากการขับออกตามงบดิสก์ ตัวชี้การสนทนาภายนอกแบบทนทาน เช่น เซสชันกลุ่มและเซสชันแชตที่มีขอบเขตตามเธรด จะถูกเก็บไว้โดยการบำรุงรักษาตามอายุ/จำนวน/งบดิสก์เช่นกัน
- `--agent <id>`: เรียกใช้การล้างข้อมูลสำหรับแหล่งจัดเก็บของเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: เรียกใช้การล้างข้อมูลสำหรับแหล่งจัดเก็บของเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เรียกใช้กับไฟล์ `sessions.json` ที่ระบุ
- `--json`: พิมพ์สรุป JSON เมื่อใช้กับ `--all-agents` ผลลัพธ์จะรวมสรุปหนึ่งรายการต่อแหล่งจัดเก็บ

เมื่อเข้าถึง Gateway ได้ การล้างข้อมูลที่ไม่ใช่ dry-run สำหรับแหล่งจัดเก็บของเอเจนต์ที่กำหนดค่าไว้จะถูกส่งผ่าน Gateway เพื่อให้ใช้ตัวเขียนแหล่งจัดเก็บเซสชันเดียวกับทราฟฟิกรันไทม์ ใช้ `--store <path>` สำหรับการซ่อมแซมไฟล์แหล่งจัดเก็บแบบออฟไลน์ที่ระบุชัดเจน

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
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

ที่เกี่ยวข้อง:

- ค่ากำหนดเซสชัน: [ข้อมูลอ้างอิงค่ากำหนด](/th/gateway/config-agents#session)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจัดการเซสชัน](/th/concepts/session)
