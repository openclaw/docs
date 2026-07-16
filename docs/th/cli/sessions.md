---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่จัดเก็บไว้และดูกิจกรรมล่าสุด
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่จัดเก็บไว้และการใช้งาน)
title: เซสชัน
x-i18n:
    generated_at: "2026-07-16T18:57:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

แสดงรายการเซสชันการสนทนาที่จัดเก็บไว้

รายการเซสชันไม่ใช่การตรวจสอบว่าสถานะแชนเนล/ผู้ให้บริการยังทำงานอยู่ รายการเหล่านี้แสดงแถว
การสนทนาที่คงอยู่จากที่เก็บเซสชัน Discord, Slack, Telegram หรือ
แชนเนลอื่นที่ไม่มีความเคลื่อนไหวสามารถเชื่อมต่อใหม่ได้สำเร็จโดยไม่สร้างแถวเซสชันใหม่
จนกว่าจะประมวลผลข้อความ ใช้ `openclaw channels status --probe`,
`openclaw status --deep` หรือ `openclaw health --verbose` เมื่อต้องการตรวจสอบ
การเชื่อมต่อแชนเนลแบบสด

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

แฟล็ก:

| แฟล็ก                 | คำอธิบาย                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | ที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ (ค่าเริ่มต้น: เอเจนต์เริ่มต้นที่กำหนดค่าไว้)        |
| `--all-agents`       | รวมที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด                                 |
| `--store <path>`     | พาธที่เก็บแบบระบุชัดเจน (ใช้ร่วมกับ `--agent` หรือ `--all-agents` ไม่ได้) |
| `--active <minutes>` | แสดงเฉพาะเซสชันที่อัปเดตภายใน N นาทีที่ผ่านมา                  |
| `--limit <n\|all>`   | จำนวนแถวสูงสุดที่จะส่งออก (ค่าเริ่มต้น `100`; `all` คืนค่าการส่งออกทั้งหมด)        |
| `--json`             | เอาต์พุตที่เครื่องอ่านได้                                               |
| `--verbose`          | การบันทึกล็อกแบบละเอียด                                                       |

`openclaw sessions` และ RPC `sessions.list` ของ Gateway มีขอบเขตจำกัดโดยค่าเริ่มต้น
เพื่อไม่ให้ที่เก็บขนาดใหญ่ซึ่งใช้งานมายาวนานผูกขาดโพรเซส CLI หรือลูปเหตุการณ์ของ
Gateway โดยค่าเริ่มต้น CLI จะส่งคืน 100 เซสชันล่าสุด ส่ง `--limit <n>`
เพื่อกำหนดช่วงให้เล็กลง/ใหญ่ขึ้น หรือ `--limit all` เมื่อตั้งใจต้องการ
ที่เก็บทั้งหมด การตอบกลับ JSON จะมี `totalCount`, `limitApplied` และ `hasMore`
เมื่อผู้เรียกต้องแสดงว่ายังมีแถวเพิ่มเติม

ไคลเอนต์ RPC สามารถส่ง `configuredAgentsOnly: true` เพื่อคงแหล่งการค้นหาแบบรวม
ที่ครอบคลุม แต่ส่งคืนเฉพาะแถวของเอเจนต์ที่มีอยู่ในการกำหนดค่าปัจจุบัน
Control UI ใช้โหมดนี้เป็นค่าเริ่มต้น เพื่อไม่ให้ที่เก็บเอเจนต์ที่ถูกลบหรือมีอยู่เฉพาะบนดิสก์
ปรากฏขึ้นอีกครั้งในมุมมองเซสชัน

`--all-agents` อ่านที่เก็บเอเจนต์ที่กำหนดค่าไว้ การค้นหาเซสชันของ Gateway และ ACP
ครอบคลุมกว่า โดยรวมที่เก็บ SQLite ที่แก้พาธจาก
รูทเอเจนต์ที่กำหนดค่าไว้หรือรูทเทมเพลต `session.store` ด้วย พาธตัวเลือกแบบเก่า
ต้องแก้พาธให้อยู่ภายในรูทเอเจนต์ โดยจะข้าม symlink และพาธที่อยู่นอกรูท

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## ติดตามความคืบหน้าของวิถีการทำงาน

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` แสดงเหตุการณ์วิถีการทำงานของรันไทม์ล่าสุดเป็นบรรทัด
ความคืบหน้าแบบกระชับ หากไม่มี `--session-key` ระบบจะติดตามเซสชันที่กำลังทำงานก่อน แล้วจึง
ติดตามเซสชันล่าสุดที่จัดเก็บไว้ `--tail <count>` ควบคุมจำนวนเหตุการณ์ที่มีอยู่
ซึ่งจะแสดงก่อนโหมดติดตาม ค่าเริ่มต้นคือ `80` และ `0` จะเริ่มจากจุดสิ้นสุดปัจจุบัน
`--follow` เฝ้าดูเซสชันที่เลือกซึ่งใช้ SQLite หรือไฟล์
วิถีการทำงานแบบเก่าที่ระบุไว้อย่างชัดเจนต่อไป

มุมมองความคืบหน้าจงใจแสดงข้อมูลอย่างระมัดระวัง โดยจะไม่แสดงข้อความพรอมต์ อาร์กิวเมนต์ของเครื่องมือ
และเนื้อหาผลลัพธ์ของเครื่องมือ การเรียกเครื่องมือจะแสดงชื่อเครื่องมือพร้อม
`{...redacted...}`; ผลลัพธ์ของเครื่องมือจะแสดงสถานะ เช่น `ok`, `error` หรือ `done`;
บรรทัดการทำงานเสร็จสิ้นของโมเดลจะแสดงผู้ให้บริการ/โมเดลและสถานะสุดท้าย

## ส่งออกบันเดิลวิถีการทำงาน

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

นี่คือพาธคำสั่งที่คำสั่งแบบสแลช `/export-trajectory` ใช้หลังจาก
เจ้าของอนุมัติคำขอดำเนินการ ระบบจะแก้พาธไดเรกทอรีเอาต์พุตให้อยู่
ภายใน `.openclaw/trajectory-exports/` ภายใต้เวิร์กสเปซที่เลือกเสมอ

## การบำรุงรักษาเพื่อล้างข้อมูล

เรียกใช้การบำรุงรักษาทันทีแทนการรอรอบการเขียนถัดไป:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` ใช้การตั้งค่า `session.maintenance` จากการกำหนดค่า
([ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#session)):

- หมายเหตุเกี่ยวกับขอบเขต: `openclaw sessions cleanup` บำรุงรักษาที่เก็บเซสชัน
  บันทึกบทสนทนา แถววิถีการทำงาน และไฟล์ประกอบวิถีการทำงานแบบเก่า แต่ไม่
  ตัดประวัติการรัน Cron ซึ่งจะเก็บ 2000 แถวล่าสุดต่องานโดยอัตโนมัติ
  ([การกำหนดค่า Cron](/th/automation/cron-jobs#configuration))
- การล้างข้อมูลยังตัดอาร์ติแฟกต์บันทึกบทสนทนาแบบเก่า/ที่เก็บถาวรซึ่งไม่มีการอ้างอิง
  จุดตรวจสอบ Compaction และไฟล์ประกอบวิถีการทำงานที่เก่ากว่า
  `session.maintenance.pruneAfter`; อาร์ติแฟกต์ที่ยังมีการอ้างอิงจากแถวเซสชัน
  SQLite จะได้รับการเก็บรักษาไว้
- การล้างข้อมูลรายงานการล้างโพรบการรันโมเดลของ Gateway ที่มีอายุสั้นแยกต่างหากเป็น
  `modelRunPruned` โดยจะจับคู่เฉพาะคีย์ที่ระบุชัดเจนอย่างเข้มงวดซึ่งมีรูปแบบ
  `agent:*:explicit:model-run-<uuid>` ระยะเวลาการเก็บรักษาคงที่ที่ `24h` และ
  ถูกควบคุมด้วยแรงกดดัน โดยจะลบแถวโพรบที่ค้างเก่าเฉพาะเมื่อถึงแรงกดดันจาก
  การบำรุงรักษา/ขีดจำกัดรายการเซสชัน เมื่อทำงาน การล้างการรันโมเดล
  จะเกิดขึ้นก่อนการล้างรายการค้างเก่าทั่วระบบและการจำกัดจำนวน

แฟล็ก:

| แฟล็ก                 | คำอธิบาย                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | แสดงตัวอย่างจำนวนรายการที่จะถูกตัด/จำกัดโดยไม่เขียนข้อมูล ในโหมดข้อความ จะแสดงตารางการดำเนินการต่อเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) พร้อมสรุปที่จัดกลุ่มตามป้ายกำกับเซสชัน                                                                                                       |
| `--enforce`          | ใช้การบำรุงรักษาแม้เมื่อ `session.maintenance.mode` เป็น `warn`                                                                                                                                                                                                                                          |
| `--fix-missing`      | ลบรายการแบบเก่าที่อาร์ติแฟกต์บันทึกบทสนทนาที่เก็บถาวรหายไป หรือมีเฉพาะส่วนหัว/ว่างเปล่า แม้รายการเหล่านั้นจะยังไม่ถูกคัดออกตามอายุ/จำนวนตามปกติ                                                                                                                                                             |
| `--fix-dm-scope`     | เมื่อ `session.dmScope` เป็น `main` ให้เลิกใช้งานแถวข้อความส่วนตัวโดยตรงที่ใช้คีย์คู่สนทนาและค้างอยู่จากการกำหนดเส้นทาง `per-peer`, `per-channel-peer` หรือ `per-account-channel-peer` ก่อนหน้า ใช้ `--dry-run` ก่อน การนำไปใช้จะลบแถวเหล่านั้นออกจาก SQLite และเก็บรักษาอาร์ติแฟกต์บันทึกบทสนทนาแบบเก่าไว้เป็นที่เก็บถาวรที่ถูกลบ |
| `--active-key <key>` | ปกป้องคีย์ที่ใช้งานอยู่รายการหนึ่งจากการขับออกเนื่องจากงบประมาณดิสก์ ตัวชี้การสนทนาภายนอกแบบคงทน เช่น เซสชันกลุ่มและเซสชันแชตที่กำหนดขอบเขตตามเธรด จะถูกเก็บไว้โดยการบำรุงรักษาตามอายุ/จำนวน/งบประมาณดิสก์ด้วย                                                                                               |
| `--agent <id>`       | เรียกใช้การล้างข้อมูลสำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ                                                                                                                                                                                                                                                                |
| `--all-agents`       | เรียกใช้การล้างข้อมูลสำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด                                                                                                                                                                                                                                                               |
| `--store <path>`     | เรียกใช้กับพาธตัวเลือกที่เก็บแบบเก่าที่ระบุ                                                                                                                                                                                                                                                         |
| `--json`             | แสดงสรุป JSON เมื่อใช้ร่วมกับ `--all-agents` เอาต์พุตจะมีสรุปหนึ่งรายการต่อที่เก็บ                                                                                                                                                                                                                          |

เมื่อเข้าถึง Gateway ได้ การล้างข้อมูลที่ไม่ใช่การทดลองรันสำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้
จะถูกส่งผ่าน Gateway เพื่อให้ใช้ตัวเขียนที่เก็บเซสชันเดียวกับทราฟฟิกรันไทม์
ใช้ `--store <path>` สำหรับการซ่อมแซมแบบออฟไลน์ที่ระบุชัดเจนของตัวเลือกที่เก็บแบบเก่า

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

## กระชับเซสชัน

เรียกคืนงบประมาณบริบทสำหรับเซสชันที่ติดขัดหรือมีขนาดใหญ่เกินไป `openclaw sessions
compact <key>` เป็นตัวห่อหุ้มหลักของ RPC `sessions.compact`
ของ Gateway และต้องมี Gateway ที่กำลังทำงาน

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- หากไม่มี `--max-lines` Gateway จะใช้ LLM สรุปบันทึกบทสนทนา โดยค่าเริ่มต้น CLI
  จะไม่กำหนดเส้นตายของไคลเอนต์ ส่วน Gateway เป็นเจ้าของวงจรชีวิต
  Compaction ที่กำหนดค่าไว้
- เมื่อมี `--max-lines <n>` ระบบจะตัดให้เหลือ `n` บรรทัดสุดท้ายของบันทึกบทสนทนา และ
  เก็บบันทึกบทสนทนาก่อนหน้าไว้เป็นไฟล์ประกอบ `.bak`
- `--agent <id>`: เอเจนต์ที่เป็นเจ้าของเซสชัน จำเป็นสำหรับคีย์ `global`
- `--url` / `--token` / `--password`: ค่าที่ใช้แทนการเชื่อมต่อ Gateway
- `--timeout <ms>`: ระยะหมดเวลาของ RPC ฝั่งไคลเอนต์ที่เลือกกำหนดได้ หน่วยเป็นมิลลิวินาที
- `--json`: แสดงเพย์โหลด RPC ดิบ

คำสั่งจะจบการทำงานด้วยรหัสที่ไม่ใช่ศูนย์เมื่อ Gateway รายงานว่า Compaction ล้มเหลวหรือไม่สามารถเข้าถึงได้ เพื่อให้ Cron และสคริปต์ไม่เข้าใจผิดว่าการไม่ดำเนินการใด ๆ แบบเงียบ ๆ คือความสำเร็จ

<Note>
`openclaw agent --message '/compact ...'` **ไม่ใช่** เส้นทางสำหรับ Compaction คำสั่งแบบเครื่องหมายทับจาก CLI จะถูกปฏิเสธโดยการตรวจสอบผู้ส่งที่ได้รับอนุญาต การเรียกใช้นั้นจะจบการทำงานด้วยรหัสที่ไม่ใช่ศูนย์ พร้อมคำแนะนำที่ชี้มายังส่วนนี้แทนการไม่ดำเนินการใด ๆ แบบเงียบ ๆ
</Note>

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` ยอมรับ:

| ฟิลด์      | ชนิด        | จำเป็น | คำอธิบาย                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | ใช่      | คีย์เซสชันที่จะทำ Compaction (ตัวอย่างเช่น `agent:main:main`)    |
| `agentId`  | string      | ไม่       | รหัสเอเจนต์ที่เป็นเจ้าของเซสชัน (สำหรับคีย์ `global`)        |
| `maxLines` | integer ≥ 1 | ไม่       | ตัดให้เหลือ N บรรทัดสุดท้ายแทนการสรุปโดย LLM |

ตัวอย่างการตอบกลับจากการสรุปโดย LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

ตัวอย่างการตอบกลับจากการตัดทอน (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## ที่เกี่ยวข้อง

- [การกำหนดค่าเซสชัน](/th/gateway/config-agents#session)
- [การจัดการเซสชัน](/th/concepts/session)
- [Compaction](/th/concepts/compaction)
- [เอกสารอ้างอิง CLI](/th/cli)
