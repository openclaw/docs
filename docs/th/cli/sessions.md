---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่บันทึกไว้และดูกิจกรรมล่าสุด
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่จัดเก็บไว้ + การใช้งาน)
title: เซสชัน
x-i18n:
    generated_at: "2026-05-04T07:02:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

แสดงรายการเซสชันการสนทนาที่จัดเก็บไว้

รายการเซสชันไม่ใช่การตรวจสอบความพร้อมใช้งานของช่องทาง/ผู้ให้บริการ รายการเหล่านี้แสดงแถวการสนทนาที่คงอยู่จาก session stores ช่องทาง Discord, Slack, Telegram หรือช่องทางอื่นที่เงียบอยู่สามารถเชื่อมต่อใหม่ได้สำเร็จโดยไม่สร้างแถวเซสชันใหม่จนกว่าจะมีการประมวลผลข้อความ ใช้ `openclaw channels status --probe`, `openclaw status --deep` หรือ `openclaw health --verbose` เมื่อต้องการการเชื่อมต่อช่องทางแบบสด

การตอบกลับ `sessions.list` ของ Gateway ถูกจำกัดขอบเขตโดยค่าเริ่มต้น เพื่อให้ store ขนาดใหญ่ที่ใช้งานยาวนานไม่ผูกขาด event loop ของ Gateway ส่ง `limit` ที่เป็นค่าบวกอย่างชัดเจนจาก RPC clients เมื่อต้องการกรอบผลลัพธ์ที่ต่างออกไป การตอบกลับจะมี `totalCount`, `limitApplied` และ `hasMore` เมื่อผู้เรียกต้องแสดงว่ายังมีแถวเพิ่มเติมอยู่

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

การเลือกขอบเขต:

- ค่าเริ่มต้น: store ของ agent เริ่มต้นที่กำหนดค่าไว้
- `--verbose`: การบันทึก log แบบละเอียด
- `--agent <id>`: store ของ agent ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: รวม store ของ agent ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เส้นทาง store ที่ระบุอย่างชัดเจน (ใช้ร่วมกับ `--agent` หรือ `--all-agents` ไม่ได้)

ส่งออก trajectory bundle สำหรับเซสชันที่จัดเก็บไว้:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

นี่คือเส้นทางคำสั่งที่คำสั่ง slash `/export-trajectory` ใช้หลังจาก owner อนุมัติคำขอ exec แล้ว ไดเรกทอรีเอาต์พุตจะถูก resolve ภายใน `.openclaw/trajectory-exports/` ใต้ workspace ที่เลือกเสมอ

`openclaw sessions --all-agents` อ่าน store ของ agent ที่กำหนดค่าไว้ การค้นหาเซสชันของ Gateway และ ACP กว้างกว่า: ยังรวม store ที่มีเฉพาะบนดิสก์ซึ่งพบใต้ root เริ่มต้น `agents/` หรือ root `session.store` ที่ใช้ template ได้ด้วย store ที่ค้นพบเหล่านั้นต้อง resolve เป็นไฟล์ `sessions.json` ปกติภายใน root ของ agent; symlink และเส้นทางนอก root จะถูกข้าม

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

- หมายเหตุเกี่ยวกับขอบเขต: `openclaw sessions cleanup` บำรุงรักษา session stores, transcripts และ trajectory sidecars คำสั่งนี้ไม่ตัดแต่ง cron run logs (`cron/runs/<jobId>.jsonl`) ซึ่งจัดการโดย `cron.runLog.maxBytes` และ `cron.runLog.keepLines` ใน [การกำหนดค่า Cron](/th/automation/cron-jobs#configuration) และอธิบายไว้ใน [การบำรุงรักษา Cron](/th/automation/cron-jobs#maintenance)

- `--dry-run`: แสดงตัวอย่างจำนวนรายการที่จะถูกตัดแต่ง/จำกัดโดยไม่เขียนข้อมูล
  - ในโหมดข้อความ dry-run จะพิมพ์ตารางการดำเนินการต่อเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) เพื่อให้คุณเห็นว่าสิ่งใดจะถูกเก็บไว้เทียบกับถูกลบออก
- `--enforce`: ใช้การบำรุงรักษาแม้ว่า `session.maintenance.mode` จะเป็น `warn`
- `--fix-missing`: ลบรายการที่ไม่มีไฟล์ transcript แม้ว่าปกติแล้วรายการเหล่านั้นจะยังไม่หมดอายุตามอายุ/จำนวนก็ตาม
- `--active-key <key>`: ป้องกัน active key ที่ระบุจากการถูกขับออกเพราะงบดิสก์ ตัวชี้การสนทนาภายนอกแบบถาวร เช่น เซสชันกลุ่มและเซสชันแชทที่ผูกกับ thread จะถูกเก็บไว้โดยการบำรุงรักษาตามอายุ/จำนวน/งบดิสก์เช่นกัน
- `--agent <id>`: เรียกใช้การล้างข้อมูลสำหรับ store ของ agent ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: เรียกใช้การล้างข้อมูลสำหรับ store ของ agent ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เรียกใช้กับไฟล์ `sessions.json` ที่ระบุ
- `--json`: พิมพ์สรุป JSON เมื่อใช้ร่วมกับ `--all-agents` เอาต์พุตจะรวมสรุปหนึ่งรายการต่อ store

เมื่อ Gateway เข้าถึงได้ การล้างข้อมูลแบบไม่ใช่ dry-run สำหรับ store ของ agent ที่กำหนดค่าไว้จะถูกส่งผ่าน Gateway เพื่อให้ใช้ตัวเขียน session-store เดียวกับ traffic ขณะ runtime ใช้ `--store <path>` สำหรับการซ่อมแซมไฟล์ store แบบ offline ที่ระบุอย่างชัดเจน

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
