---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่จัดเก็บไว้และดูกิจกรรมล่าสุด
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่จัดเก็บไว้ + การใช้งาน)
title: เซสชัน
x-i18n:
    generated_at: "2026-07-04T20:46:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

แสดงรายการเซสชันการสนทนาที่จัดเก็บไว้

รายการเซสชันไม่ใช่การตรวจสอบความพร้อมใช้งานของช่องทาง/ผู้ให้บริการ แต่จะแสดงแถวการสนทนาที่คงอยู่จากที่เก็บเซสชัน ช่องทาง Discord, Slack, Telegram หรือช่องทางอื่นที่ไม่มีความเคลื่อนไหวสามารถเชื่อมต่อใหม่ได้สำเร็จโดยไม่สร้างแถวเซสชันใหม่จนกว่าจะมีการประมวลผลข้อความ ใช้ `openclaw channels status --probe`, `openclaw status --deep` หรือ `openclaw health --verbose` เมื่อต้องการการเชื่อมต่อช่องทางแบบสด

การตอบกลับของ `openclaw sessions` และ Gateway `sessions.list` ถูกจำกัดขอบเขตโดยค่าเริ่มต้น เพื่อไม่ให้ที่เก็บขนาดใหญ่ที่ใช้งานมายาวนานผูกขาดกระบวนการ CLI หรือ event loop ของ Gateway โดยค่าเริ่มต้น CLI จะส่งคืนเซสชันใหม่ล่าสุด 100 รายการ ส่ง `--limit <n>` เพื่อกำหนดหน้าต่างที่เล็กลง/ใหญ่ขึ้น หรือ `--limit all` เมื่อคุณตั้งใจต้องการที่เก็บทั้งหมด การตอบกลับ JSON จะมี `totalCount`, `limitApplied` และ `hasMore` เมื่อผู้เรียกต้องแสดงว่ายังมีแถวเพิ่มเติมอยู่

ไคลเอนต์ RPC สามารถส่ง `configuredAgentsOnly: true` เพื่อคงแหล่งค้นพบแบบรวมที่กว้างไว้ แต่ส่งคืนเฉพาะแถวของเอเจนต์ที่มีอยู่ในค่ากำหนดปัจจุบัน Control UI ใช้โหมดนั้นโดยค่าเริ่มต้น เพื่อไม่ให้ที่เก็บเอเจนต์ที่ถูกลบหรือมีอยู่เฉพาะบนดิสก์กลับมาปรากฏในมุมมอง Sessions

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
- `--verbose`: การบันทึกรายละเอียดแบบละเอียด
- `--agent <id>`: ที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: รวมที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: พาธที่เก็บแบบระบุชัดเจน (ใช้ร่วมกับ `--agent` หรือ `--all-agents` ไม่ได้)
- `--limit <n|all>`: จำนวนแถวสูงสุดที่จะส่งออก (ค่าเริ่มต้น `100`; `all` คืนค่าการส่งออกแบบเต็ม)

ติดตามความคืบหน้า trajectory ที่มนุษย์อ่านได้สำหรับเซสชันที่จัดเก็บไว้:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` แสดงผลเหตุการณ์ trajectory JSONL ล่าสุดเป็นบรรทัดความคืบหน้าแบบกะทัดรัด หากไม่มี `--session-key` จะติดตามเซสชันที่กำลังทำงานก่อน แล้วจึงเป็นเซสชันที่จัดเก็บล่าสุด `--tail <count>` ควบคุมจำนวนเหตุการณ์ที่มีอยู่ซึ่งจะพิมพ์ก่อนโหมดติดตาม ค่าเริ่มต้นคือ `80` และ `0` จะเริ่มที่ท้ายสุดปัจจุบัน `--follow` จะเฝ้าดูไฟล์ trajectory ที่เลือกต่อไป รวมถึงไฟล์ที่ย้ายตำแหน่งซึ่งอ้างอิงโดย `<session>.trajectory-path.json`

มุมมองความคืบหน้าตั้งใจให้ระมัดระวัง: จะไม่พิมพ์ข้อความพรอมป์ อาร์กิวเมนต์ของเครื่องมือ และเนื้อหาผลลัพธ์ของเครื่องมือ การเรียกเครื่องมือจะแสดงชื่อเครื่องมือพร้อม `{...redacted...}`; ผลลัพธ์เครื่องมือจะแสดงสถานะ เช่น `ok`, `error` หรือ `done`; บรรทัดการทำให้โมเดลเสร็จสมบูรณ์จะแสดงผู้ให้บริการ/โมเดลและสถานะปลายทาง

ส่งออกชุด trajectory สำหรับเซสชันที่จัดเก็บไว้:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

นี่คือพาธคำสั่งที่คำสั่ง slash `/export-trajectory` ใช้หลังจากเจ้าของอนุมัติคำขอ exec แล้ว ไดเรกทอรีผลลัพธ์จะถูก resolve ภายใน `.openclaw/trajectory-exports/` ภายใต้เวิร์กสเปซที่เลือกเสมอ

`openclaw sessions --all-agents` อ่านที่เก็บเอเจนต์ที่กำหนดค่าไว้ การค้นพบเซสชันของ Gateway และ ACP กว้างกว่า: จะรวมที่เก็บที่มีอยู่เฉพาะบนดิสก์ซึ่งพบใต้รูท `agents/` เริ่มต้นหรือรูท `session.store` แบบเทมเพลตด้วย ที่เก็บที่ค้นพบเหล่านั้นต้อง resolve เป็นไฟล์ `sessions.json` ปกติภายในรูทเอเจนต์; symlink และพาธนอกรูทจะถูกข้าม

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
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` ใช้การตั้งค่า `session.maintenance` จากค่ากำหนด:

- หมายเหตุขอบเขต: `openclaw sessions cleanup` ดูแลที่เก็บเซสชัน transcript และไฟล์ข้างเคียง trajectory โดยไม่ตัดประวัติการรัน cron ซึ่งจัดการโดย `cron.runLog.keepLines` ใน [การกำหนดค่า Cron](/th/automation/cron-jobs#configuration) และอธิบายใน [การบำรุงรักษา Cron](/th/automation/cron-jobs#maintenance)
- การล้างข้อมูลยังตัด transcript หลักที่ไม่มีการอ้างอิง checkpoint ของ Compaction และไฟล์ข้างเคียง trajectory ที่เก่ากว่า `session.maintenance.pruneAfter`; ไฟล์ที่ยังถูกอ้างอิงโดย `sessions.json` จะถูกเก็บไว้
- การล้างข้อมูลรายงานการล้าง probe ของการรันโมเดล Gateway อายุสั้นแยกต่างหากเป็น `modelRunPruned` รายการนี้จะตรงกับคีย์แบบ explicit ที่เข้มงวดซึ่งมีรูปแบบเหมือน `agent:*:explicit:model-run-<uuid>` เท่านั้น การคงไว้แบบคงที่คือ `24h` แต่มีการควบคุมด้วยแรงกดดัน: จะลบแถว probe ที่ค้างก็ต่อเมื่อถึงแรงกดดันจากการบำรุงรักษา/เพดานจำนวนรายการเซสชัน เมื่อทำงาน การล้าง model-run จะเกิดขึ้นก่อนการล้างรายการค้างแบบรวมและการจำกัดเพดาน

- `--dry-run`: แสดงตัวอย่างจำนวนรายการที่จะถูกตัด/จำกัดเพดานโดยไม่เขียน
  - ในโหมดข้อความ dry-run จะพิมพ์ตารางการดำเนินการต่อเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) พร้อมสรุปที่จัดกลุ่มตามป้ายกำกับเซสชัน เพื่อให้คุณเห็นว่าสิ่งใดจะถูกเก็บไว้เทียบกับถูกลบออก
- `--enforce`: ใช้การบำรุงรักษาแม้เมื่อ `session.maintenance.mode` เป็น `warn`
- `--fix-missing`: ลบรายการที่ไฟล์ transcript หายไปหรือมีเฉพาะส่วนหัว/ว่างเปล่า แม้ว่าปกติแล้วยังไม่ควรถูกนำออกด้วยอายุ/จำนวนก็ตาม
- `--fix-dm-scope`: เมื่อ `session.dmScope` เป็น `main` ให้เลิกใช้แถว direct-DM ที่คีย์ตาม peer ซึ่งค้างจากการกำหนดเส้นทาง `per-peer`, `per-channel-peer` หรือ `per-account-channel-peer` ก่อนหน้า ใช้ `--dry-run` ก่อน; การใช้การล้างข้อมูลจะลบแถวเหล่านั้นออกจาก `sessions.json` และเก็บ transcript ของแถวเหล่านั้นไว้เป็น archive ที่ถูกลบ
- `--active-key <key>`: ป้องกันคีย์ที่ใช้งานอยู่เฉพาะจากการไล่ออกตามงบประมาณดิสก์ ตัวชี้การสนทนาภายนอกแบบคงทน เช่น เซสชันกลุ่มและเซสชันแชตที่มีขอบเขตตามเธรด จะถูกเก็บไว้โดยการบำรุงรักษาตามอายุ/จำนวน/งบประมาณดิสก์ด้วย
- `--agent <id>`: เรียกใช้การล้างข้อมูลสำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
- `--all-agents`: เรียกใช้การล้างข้อมูลสำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้ทั้งหมด
- `--store <path>`: เรียกใช้กับไฟล์ `sessions.json` เฉพาะ
- `--json`: พิมพ์สรุป JSON เมื่อใช้ `--all-agents` ผลลัพธ์จะมีสรุปหนึ่งรายการต่อที่เก็บ

เมื่อ Gateway เข้าถึงได้ การล้างข้อมูลแบบไม่ใช่ dry-run สำหรับที่เก็บเอเจนต์ที่กำหนดค่าไว้จะถูกส่งผ่าน Gateway เพื่อให้ใช้ตัวเขียนที่เก็บเซสชันเดียวกับทราฟฟิกรันไทม์ ใช้ `--store <path>` สำหรับการซ่อมแซมไฟล์ที่เก็บแบบออฟไลน์โดยระบุชัดเจน

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

## ทำ Compaction ให้เซสชัน

เรียกคืนงบประมาณบริบทสำหรับเซสชันที่ติดขัดหรือมีขนาดใหญ่เกินไป `openclaw sessions compact <key>` เป็น wrapper ชั้นหนึ่งรอบ Gateway RPC `sessions.compact` และต้องใช้ Gateway ที่กำลังทำงานอยู่

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- หากไม่มี `--max-lines` Gateway จะให้ LLM สรุป transcript CLI จะไม่กำหนดเส้นตายของไคลเอนต์โดยค่าเริ่มต้น; Gateway เป็นเจ้าของวงจรชีวิต Compaction ที่กำหนดค่าไว้
- เมื่อใช้ `--max-lines <n>` จะตัดให้เหลือบรรทัด transcript `n` บรรทัดสุดท้าย และ archive transcript ก่อนหน้าเป็นไฟล์ข้างเคียง `.bak`
- `--agent <id>`: เอเจนต์ที่เป็นเจ้าของเซสชัน; จำเป็นสำหรับคีย์ `global`
- `--url` / `--token` / `--password`: ค่าทับการเชื่อมต่อ Gateway
- `--timeout <ms>`: timeout RPC ฝั่งไคลเอนต์แบบไม่บังคับในหน่วยมิลลิวินาที
- `--json`: พิมพ์ payload RPC ดิบ

คำสั่งจะออกด้วยสถานะไม่ใช่ศูนย์เมื่อ Gateway รายงานว่า Compaction ล้มเหลวหรือเข้าถึงไม่ได้ ดังนั้น cron และสคริปต์จะไม่เข้าใจผิดว่า no-op แบบเงียบสำเร็จแล้ว

> หมายเหตุ: `openclaw agent --message '/compact ...'` **ไม่ใช่** พาธ Compaction คำสั่ง slash จาก CLI จะถูกปฏิเสธโดยการตรวจสอบผู้ส่งที่ได้รับอนุญาต; การเรียกใช้นั้นจะออกด้วยสถานะไม่ใช่ศูนย์พร้อมคำแนะนำที่ชี้มาที่นี่ แทนที่จะ no-op อย่างเงียบๆ

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` ยอมรับ:

| ฟิลด์      | ชนิด        | จำเป็น | คำอธิบาย                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | ใช่      | คีย์เซสชันที่จะทำ Compaction (เช่น `agent:main:main`)    |
| `agentId`  | string      | ไม่       | id เอเจนต์ที่เป็นเจ้าของเซสชัน (สำหรับคีย์ `global`)        |
| `maxLines` | integer ≥ 1 | ไม่       | ตัดให้เหลือ N บรรทัดสุดท้ายแทนการสรุปโดย LLM |

ตัวอย่างการตอบกลับการสรุปโดย LLM:

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

- ค่ากำหนดเซสชัน: [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#session)
- [เอกสารอ้างอิง CLI](/th/cli)
- [การจัดการเซสชัน](/th/concepts/session)
