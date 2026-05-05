---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่จัดเก็บไว้และดูกิจกรรมล่าสุด
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่จัดเก็บไว้ + การใช้งาน)
title: เซสชัน
x-i18n:
    generated_at: "2026-05-05T08:25:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

แสดงรายการเซสชันการสนทนาที่จัดเก็บไว้

รายการเซสชันไม่ใช่การตรวจสอบความพร้อมใช้งานแบบสดของแชนเนล/ผู้ให้บริการ รายการเหล่านี้แสดงแถวการสนทนาที่คงอยู่จากที่เก็บเซสชัน Discord, Slack, Telegram หรือแชนเนลอื่นที่เงียบอยู่สามารถเชื่อมต่อใหม่ได้สำเร็จโดยไม่สร้างแถวเซสชันใหม่จนกว่าจะมีการประมวลผลข้อความ ใช้ `openclaw channels status --probe`, `openclaw status --deep` หรือ `openclaw health --verbose` เมื่อต้องการการเชื่อมต่อแชนเนลแบบสด

การตอบกลับของ `openclaw sessions` และ Gateway `sessions.list` ถูกจำกัดขอบเขตตามค่าเริ่มต้น เพื่อไม่ให้ที่เก็บขนาดใหญ่ที่ใช้งานยาวนานผูกขาดโปรเซส CLI หรือ event loop ของ Gateway โดยค่าเริ่มต้น CLI จะคืนค่าเซสชันล่าสุด 100 รายการ ส่ง `--limit <n>` สำหรับหน้าต่างที่เล็กลง/ใหญ่ขึ้น หรือ `--limit all` เมื่อคุณตั้งใจต้องการที่เก็บทั้งหมด การตอบกลับแบบ JSON จะรวม `totalCount`, `limitApplied` และ `hasMore` เมื่อผู้เรียกต้องการแสดงว่ายังมีแถวเพิ่มเติมอยู่

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

- ค่าเริ่มต้น: ที่เก็บเอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้
- `--verbose`: การบันทึกล็อกแบบละเอียด
- `--agent <id>`: ที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: รวมที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เส้นทางที่เก็บแบบระบุชัดเจน (ไม่สามารถใช้ร่วมกับ `--agent` หรือ `--all-agents`)
- `--limit <n|all>`: จำนวนแถวสูงสุดที่จะส่งออก (ค่าเริ่มต้น `100`; `all` คืนค่าการส่งออกทั้งหมด)

ส่งออกบันเดิล trajectory สำหรับเซสชันที่จัดเก็บไว้:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

นี่คือเส้นทางคำสั่งที่คำสั่งสแลช `/export-trajectory` ใช้หลังจากเจ้าของอนุมัติคำขอ exec แล้ว ไดเรกทอรีเอาต์พุตจะถูกแปลงเส้นทางให้อยู่ภายใน `.openclaw/trajectory-exports/` ใต้เวิร์กสเปซที่เลือกเสมอ

`openclaw sessions --all-agents` อ่านที่เก็บเอเจนต์ที่กำหนดค่าไว้ การค้นพบเซสชันของ Gateway และ ACP มีขอบเขตกว้างกว่า: ยังรวมที่เก็บที่มีเฉพาะบนดิสก์ซึ่งพบใต้ราก `agents/` ค่าเริ่มต้น หรือราก `session.store` แบบเทมเพลต ที่เก็บที่ค้นพบเหล่านั้นต้องแปลงเส้นทางไปเป็นไฟล์ `sessions.json` ปกติภายในรากเอเจนต์; symlink และเส้นทางที่อยู่นอกรากจะถูกข้าม

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

เรียกใช้การบำรุงรักษาตอนนี้ (แทนที่จะรอรอบการเขียนถัดไป):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` ใช้การตั้งค่า `session.maintenance` จากคอนฟิก:

- หมายเหตุขอบเขต: `openclaw sessions cleanup` บำรุงรักษาที่เก็บเซสชัน บันทึกถอดความ และ sidecar ของ trajectory โดยจะไม่ตัดแต่งล็อกการรัน Cron (`cron/runs/<jobId>.jsonl`) ซึ่งจัดการโดย `cron.runLog.maxBytes` และ `cron.runLog.keepLines` ใน [การกำหนดค่า Cron](/th/automation/cron-jobs#configuration) และอธิบายไว้ใน [การบำรุงรักษา Cron](/th/automation/cron-jobs#maintenance)
- การล้างข้อมูลยังตัดแต่งบันทึกถอดความหลักที่ไม่มีการอ้างอิง จุดตรวจ Compaction และ sidecar ของ trajectory ที่เก่ากว่า `session.maintenance.pruneAfter`; ไฟล์ที่ยังถูกอ้างอิงโดย `sessions.json` จะถูกเก็บรักษาไว้

- `--dry-run`: ดูตัวอย่างจำนวนรายการที่จะถูกตัดแต่ง/จำกัดโดยไม่เขียนข้อมูล
  - ในโหมดข้อความ dry-run จะพิมพ์ตารางการดำเนินการรายเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) เพื่อให้คุณเห็นว่าสิ่งใดจะถูกเก็บไว้เทียบกับถูกลบออก
- `--enforce`: ใช้การบำรุงรักษาแม้เมื่อ `session.maintenance.mode` เป็น `warn`
- `--fix-missing`: ลบรายการที่ไฟล์บันทึกถอดความหายไป แม้ว่าตามปกติรายการเหล่านั้นจะยังไม่ถูกคัดออกด้วยอายุ/จำนวนก็ตาม
- `--active-key <key>`: ปกป้องคีย์ที่ใช้งานอยู่เฉพาะรายการจากการขับออกตามงบดิสก์ ตัวชี้การสนทนาภายนอกแบบคงทน เช่น เซสชันกลุ่มและเซสชันแชตที่จำกัดขอบเขตตามเธรด จะถูกเก็บไว้โดยการบำรุงรักษาตามอายุ/จำนวน/งบดิสก์เช่นกัน
- `--agent <id>`: เรียกใช้การล้างข้อมูลสำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: เรียกใช้การล้างข้อมูลสำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เรียกใช้กับไฟล์ `sessions.json` เฉพาะรายการ
- `--json`: พิมพ์สรุป JSON เมื่อใช้กับ `--all-agents` เอาต์พุตจะรวมสรุปหนึ่งรายการต่อที่เก็บ

เมื่อเข้าถึง Gateway ได้ การล้างข้อมูลแบบไม่ใช่ dry-run สำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้จะถูกส่งผ่าน Gateway เพื่อให้ใช้ตัวเขียนที่เก็บเซสชันเดียวกับทราฟฟิกรันไทม์ ใช้ `--store <path>` สำหรับการซ่อมแซมไฟล์ที่เก็บแบบออฟไลน์อย่างชัดเจน

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

- คอนฟิกเซสชัน: [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#session)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจัดการเซสชัน](/th/concepts/session)
