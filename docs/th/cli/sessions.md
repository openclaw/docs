---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่จัดเก็บไว้และดูกิจกรรมล่าสุด
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่จัดเก็บไว้ + การใช้งาน)
title: เซสชัน
x-i18n:
    generated_at: "2026-06-27T17:23:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

แสดงรายการเซสชันการสนทนาที่จัดเก็บไว้

รายการเซสชันไม่ใช่การตรวจสอบความพร้อมใช้งานของช่องทาง/ผู้ให้บริการ รายการเหล่านี้แสดงแถวการสนทนาที่คงอยู่จากที่เก็บเซสชัน ช่องทาง Discord, Slack, Telegram หรือช่องทางอื่นที่เงียบอยู่สามารถเชื่อมต่อใหม่ได้สำเร็จโดยไม่สร้างแถวเซสชันใหม่จนกว่าจะมีการประมวลผลข้อความ ใช้ `openclaw channels status --probe`, `openclaw status --deep` หรือ `openclaw health --verbose` เมื่อต้องการการเชื่อมต่อช่องทางแบบสด

การตอบกลับของ `openclaw sessions` และ Gateway `sessions.list` ถูกจำกัดขอบเขตโดยค่าเริ่มต้น เพื่อไม่ให้ที่เก็บขนาดใหญ่ที่มีอายุยาวนานผูกขาดกระบวนการ CLI หรือ event loop ของ Gateway โดยค่าเริ่มต้น CLI จะคืนค่าเซสชันใหม่ล่าสุด 100 รายการ ส่ง `--limit <n>` สำหรับหน้าต่างที่เล็กลง/ใหญ่ขึ้น หรือ `--limit all` เมื่อคุณตั้งใจต้องการที่เก็บทั้งหมด การตอบกลับ JSON มี `totalCount`, `limitApplied` และ `hasMore` เมื่อผู้เรียกต้องการแสดงว่ายังมีแถวเพิ่มเติมอยู่

ไคลเอนต์ RPC สามารถส่ง `configuredAgentsOnly: true` เพื่อคงแหล่งค้นหารวมแบบกว้างไว้ แต่คืนค่าเฉพาะแถวของเอเจนต์ที่มีอยู่ใน config ปัจจุบัน Control UI ใช้โหมดนั้นเป็นค่าเริ่มต้น เพื่อไม่ให้ที่เก็บเอเจนต์ที่ถูกลบหรือมีอยู่เฉพาะบนดิสก์ปรากฏซ้ำในมุมมอง Sessions

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
- `--verbose`: การบันทึกแบบละเอียด
- `--agent <id>`: ที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: รวมที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: พาธที่เก็บแบบเจาะจง (ไม่สามารถใช้ร่วมกับ `--agent` หรือ `--all-agents`)
- `--limit <n|all>`: จำนวนแถวสูงสุดที่จะแสดงผล (ค่าเริ่มต้น `100`; `all` คืนค่าการแสดงผลทั้งหมด)

ติดตามความคืบหน้าของ trajectory สำหรับเซสชันที่จัดเก็บไว้ในรูปแบบที่มนุษย์อ่านได้:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` แสดงผลเหตุการณ์ trajectory JSONL ล่าสุดเป็นบรรทัดความคืบหน้าแบบกระชับ หากไม่มี `--session-key` จะติดตามเซสชันที่กำลังทำงานก่อน แล้วจึงเป็นเซสชันที่จัดเก็บล่าสุด `--tail <count>` ควบคุมจำนวนเหตุการณ์ที่มีอยู่ซึ่งจะพิมพ์ก่อนโหมดติดตาม ค่าเริ่มต้นคือ `80` และ `0` เริ่มที่ท้ายปัจจุบัน `--follow` จะเฝ้าดูไฟล์ trajectory ที่เลือกต่อไป รวมถึงไฟล์ที่ถูกย้ายตำแหน่งซึ่งอ้างอิงโดย `<session>.trajectory-path.json`

มุมมองความคืบหน้าถูกออกแบบให้รอบคอบโดยตั้งใจ: จะไม่พิมพ์ข้อความพรอมป์ อาร์กิวเมนต์ของเครื่องมือ และเนื้อหาผลลัพธ์ของเครื่องมือ การเรียกเครื่องมือจะแสดงชื่อเครื่องมือพร้อม `{...redacted...}`; ผลลัพธ์ของเครื่องมือจะแสดงสถานะ เช่น `ok`, `error` หรือ `done`; บรรทัดการเติมเต็มของโมเดลจะแสดงผู้ให้บริการ/โมเดลและสถานะสิ้นสุด

ส่งออกบันเดิล trajectory สำหรับเซสชันที่จัดเก็บไว้:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

นี่คือพาธคำสั่งที่ใช้โดยคำสั่ง slash `/export-trajectory` หลังจากเจ้าของอนุมัติคำขอ exec แล้ว ไดเรกทอรีเอาต์พุตจะถูก resolve ภายใน `.openclaw/trajectory-exports/` ใต้เวิร์กสเปซที่เลือกเสมอ

`openclaw sessions --all-agents` อ่านที่เก็บเอเจนต์ที่กำหนดค่าไว้ การค้นหาเซสชันของ Gateway และ ACP กว้างกว่า: ยังรวมที่เก็บที่มีอยู่เฉพาะบนดิสก์ซึ่งพบใต้รูท `agents/` ค่าเริ่มต้น หรือรูท `session.store` แบบเทมเพลตด้วย ที่เก็บที่ค้นพบเหล่านั้นต้อง resolve เป็นไฟล์ `sessions.json` ปกติภายในรูทเอเจนต์; symlink และพาธที่อยู่นอกรูทจะถูกข้าม

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
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` ใช้การตั้งค่า `session.maintenance` จาก config:

- หมายเหตุขอบเขต: `openclaw sessions cleanup` บำรุงรักษาที่เก็บเซสชัน transcript และ trajectory sidecar ไม่ได้ตัดประวัติการรัน cron ซึ่งจัดการโดย `cron.runLog.keepLines` ใน [การกำหนดค่า Cron](/th/automation/cron-jobs#configuration) และอธิบายใน [การบำรุงรักษา Cron](/th/automation/cron-jobs#maintenance)
- การล้างข้อมูลยังตัด transcript หลัก, checkpoint ของ Compaction และ trajectory sidecar ที่ไม่มีการอ้างอิงและเก่ากว่า `session.maintenance.pruneAfter`; ไฟล์ที่ยังถูกอ้างอิงโดย `sessions.json` จะถูกเก็บไว้
- การล้างข้อมูลรายงานการล้าง probe ของการรันโมเดล Gateway อายุสั้นแยกต่างหากเป็น `modelRunPruned` สิ่งนี้จะตรงกับเฉพาะคีย์แบบชัดเจนที่เข้มงวดซึ่งมีรูปแบบเป็น `agent:*:explicit:model-run-<uuid>` การเก็บรักษาแบบคงที่คือ `24h` แต่มี gate ตามแรงกดดัน: จะลบแถว probe ที่ล้าสมัยเฉพาะเมื่อถึงแรงกดดันด้านการบำรุงรักษา/ขีดจำกัดของรายการเซสชันเท่านั้น เมื่อทำงาน การล้างข้อมูล model-run จะเกิดก่อนการล้างข้อมูลล้าสมัยทั่วทั้งระบบและการจำกัดจำนวน

- `--dry-run`: ดูตัวอย่างจำนวนรายการที่จะถูกตัด/จำกัดโดยไม่เขียนข้อมูล
  - ในโหมดข้อความ dry-run จะพิมพ์ตารางการกระทำรายเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) พร้อมสรุปที่จัดกลุ่มตามป้ายกำกับเซสชัน เพื่อให้คุณเห็นว่าอะไรจะถูกเก็บไว้เทียบกับถูกลบ
- `--enforce`: ใช้การบำรุงรักษาแม้เมื่อ `session.maintenance.mode` เป็น `warn`
- `--fix-missing`: ลบรายการที่ไฟล์ transcript หายไป หรือมีเฉพาะ header/ว่าง แม้ปกติยังไม่ถึงเกณฑ์อายุ/จำนวนที่จะถูกนำออก
- `--fix-dm-scope`: เมื่อ `session.dmScope` เป็น `main` ให้ retire แถว direct-DM ที่ใช้คีย์ peer ที่ล้าสมัยซึ่งหลงเหลือจากการกำหนดเส้นทาง `per-peer`, `per-channel-peer` หรือ `per-account-channel-peer` ก่อนหน้า ใช้ `--dry-run` ก่อน; การใช้การล้างข้อมูลจะลบแถวเหล่านั้นออกจาก `sessions.json` และเก็บ transcript ของแถวเหล่านั้นไว้เป็น archive ที่ถูกลบ
- `--active-key <key>`: ปกป้องคีย์ที่ใช้งานอยู่แบบเจาะจงจากการถูกขับออกเนื่องจากงบดิสก์ ตัวชี้การสนทนาภายนอกแบบคงทน เช่น เซสชันกลุ่มและเซสชันแชทที่ผูกกับ thread จะถูกเก็บไว้โดยการบำรุงรักษาตามอายุ/จำนวน/งบดิสก์เช่นกัน
- `--agent <id>`: เรียกใช้การล้างข้อมูลสำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: เรียกใช้การล้างข้อมูลสำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เรียกใช้กับไฟล์ `sessions.json` ที่เจาะจง
- `--json`: พิมพ์สรุป JSON เมื่อใช้ `--all-agents` เอาต์พุตจะมีสรุปหนึ่งรายการต่อที่เก็บ

เมื่อสามารถเข้าถึง Gateway ได้ การล้างข้อมูลแบบไม่ใช่ dry-run สำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้จะถูกส่งผ่าน Gateway เพื่อให้ใช้ตัวเขียนที่เก็บเซสชันเดียวกับทราฟฟิก runtime ใช้ `--store <path>` สำหรับการซ่อมแซมไฟล์ที่เก็บแบบออฟไลน์โดยเจาะจง

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

## Compact เซสชัน

เรียกคืนงบประมาณบริบทสำหรับเซสชันที่ค้างหรือมีขนาดใหญ่เกินไป `openclaw sessions compact <key>` เป็น wrapper ชั้นหนึ่งรอบ Gateway RPC `sessions.compact` และต้องมี Gateway ที่กำลังทำงานอยู่

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- หากไม่มี `--max-lines` Gateway จะให้ LLM สรุป transcript ซึ่งอาจช้า ดังนั้นค่าเริ่มต้นของ `--timeout` คือ `180000` ms
- เมื่อใช้ `--max-lines <n>` จะตัดให้เหลือ transcript `n` บรรทัดสุดท้าย และ archive transcript ก่อนหน้าเป็น sidecar `.bak`
- `--agent <id>`: เอเจนต์ที่เป็นเจ้าของเซสชัน; จำเป็นสำหรับคีย์ `global`
- `--url` / `--token` / `--password`: override การเชื่อมต่อ Gateway
- `--timeout <ms>`: timeout ของ RPC เป็นมิลลิวินาที
- `--json`: พิมพ์ payload RPC ดิบ

คำสั่งจะออกด้วยสถานะไม่เป็นศูนย์เมื่อ Gateway รายงานว่า Compaction ล้มเหลวหรือไม่สามารถเข้าถึงได้ เพื่อให้ cron และสคริปต์ไม่เข้าใจผิดว่า no-op ที่เงียบคือความสำเร็จ

> หมายเหตุ: `openclaw agent --message '/compact ...'` **ไม่ใช่** พาธ Compaction คำสั่ง slash จาก CLI จะถูกปฏิเสธโดยการตรวจสอบผู้ส่งที่ได้รับอนุญาต; การเรียกใช้นั้นจะออกด้วยสถานะไม่เป็นศูนย์พร้อมคำแนะนำที่ชี้มาที่นี่ แทนที่จะ no-op อย่างเงียบๆ

### RPC `sessions.compact`

`openclaw gateway call sessions.compact --params '<json>'` รับค่า:

| ฟิลด์ | ชนิด | จำเป็น | คำอธิบาย |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key` | สตริง | ใช่ | คีย์เซสชันที่จะ compact (เช่น `agent:main:main`) |
| `agentId` | สตริง | ไม่ | id เอเจนต์ที่เป็นเจ้าของเซสชัน (สำหรับคีย์ `global`) |
| `maxLines` | จำนวนเต็ม ≥ 1 | ไม่ | ตัดให้เหลือ N บรรทัดสุดท้ายแทนการสรุปด้วย LLM |

ตัวอย่างการตอบกลับการสรุปด้วย LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

ตัวอย่างการตอบกลับการตัด (`--max-lines 200`):

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

- Config เซสชัน: [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#session)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจัดการเซสชัน](/th/concepts/session)
