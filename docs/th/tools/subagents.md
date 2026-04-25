---
read_when:
    - คุณต้องการงานเบื้องหลัง/งานขนานผ่าน agent
    - คุณกำลังเปลี่ยน `sessions_spawn` หรือนโยบาย tool ของ sub-agent
    - คุณกำลังพัฒนาหรือแก้ปัญหาเซสชัน subagent ที่ผูกกับ thread
summary: 'Sub-agents: การสร้างการรัน agent แบบแยกอิสระที่ประกาศผลลัพธ์กลับไปยังแชตของผู้ร้องขอ'
title: Sub-agents
x-i18n:
    generated_at: "2026-04-25T14:01:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: b262edf46b9c823dcf0ad6514e560d2d1a718e9081015ea8bb5c081206b88fce
    source_path: tools/subagents.md
    workflow: 15
---

Sub-agents คือการรัน agent แบบเบื้องหลังที่ถูกสร้างจากการรัน agent ที่มีอยู่เดิม โดยจะรันอยู่ในเซสชันของตัวเอง (`agent:<agentId>:subagent:<uuid>`) และเมื่อเสร็จแล้วจะ **ประกาศ** ผลลัพธ์กลับไปยังแชตแชนเนลของผู้ร้องขอ การรัน sub-agent แต่ละครั้งจะถูกติดตามในฐานะ [background task](/th/automation/tasks)

## คำสั่ง Slash

ใช้ `/subagents` เพื่อตรวจสอบหรือควบคุมการรัน sub-agent สำหรับ **เซสชันปัจจุบัน**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

ตัวควบคุมการผูกกับ thread:

คำสั่งเหล่านี้ทำงานได้บน channels ที่รองรับการผูกกับ thread แบบคงอยู่ ดู **channels ที่รองรับ thread** ด้านล่าง

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` จะแสดงเมทาดาทาของการรัน (สถานะ เวลา session id พาธของทรานสคริปต์ การ cleanup)
ใช้ `sessions_history` สำหรับมุมมองการเรียกคืนแบบจำกัดขอบเขตและผ่านตัวกรองความปลอดภัย; ให้ตรวจสอบ
พาธของทรานสคริปต์บนดิสก์เมื่อคุณต้องการทรานสคริปต์ดิบแบบเต็ม

### พฤติกรรมการ spawn

`/subagents spawn` จะเริ่ม sub-agent แบบเบื้องหลังในฐานะคำสั่งของผู้ใช้ ไม่ใช่ internal relay และจะส่งอัปเดตการเสร็จสิ้นเพียงหนึ่งครั้งกลับไปยังแชตของผู้ร้องขอเมื่อการรันเสร็จสิ้น

- คำสั่ง spawn ไม่บล็อก; มันจะคืน run id ทันที
- เมื่อเสร็จสิ้น sub-agent จะประกาศข้อความสรุป/ผลลัพธ์กลับไปยังแชตแชนเนลของผู้ร้องขอ
- การส่งมอบเมื่อเสร็จสิ้นเป็นแบบ push เมื่อ spawn แล้ว อย่า poll `/subagents list`,
  `sessions_list` หรือ `sessions_history` เป็นลูปเพียงเพื่อรอให้มัน
  เสร็จสิ้น ให้ตรวจสอบสถานะเฉพาะเมื่อจำเป็นสำหรับการดีบักหรือการแทรกแซง
- เมื่อเสร็จสิ้น OpenClaw จะพยายามแบบ best-effort ปิด browser tabs/processes ที่ติดตามไว้ซึ่งเปิดโดยเซสชัน sub-agent นั้น ก่อนที่ flow การ cleanup หลังประกาศจะดำเนินต่อ
- สำหรับการ spawn ด้วยตนเอง การส่งมอบมีความทนทาน:
  - OpenClaw จะลองส่งแบบ `agent` โดยตรงก่อน พร้อม idempotency key ที่คงที่
  - หากการส่งแบบตรงล้มเหลว จะ fallback ไปใช้ queue routing
  - หาก queue routing ยังใช้งานไม่ได้ การประกาศจะถูก retry ด้วย exponential backoff แบบสั้นก่อนยอมแพ้ในที่สุด
- การส่งมอบเมื่อเสร็จสิ้นจะคงเส้นทางของผู้ร้องขอที่ resolve ได้ไว้:
  - เส้นทางการเสร็จสิ้นที่ผูกกับ thread หรือบทสนทนาจะมีลำดับความสำคัญเมื่อมี
  - หาก origin ของการเสร็จสิ้นมีเพียง channel OpenClaw จะเติม target/account ที่ขาดหายจากเส้นทางที่ resolve แล้วของเซสชันผู้ร้องขอ (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งแบบตรงยังทำงานได้
- การส่งมอบผลลัพธ์กลับไปยังเซสชันของผู้ร้องขอเป็นบริบทภายในที่สร้างขึ้นขณะรัน (ไม่ใช่ข้อความที่ผู้ใช้เขียน) และประกอบด้วย:
  - `Result` (ข้อความตอบกลับ `assistant` ล่าสุดที่มองเห็นได้ มิฉะนั้นจะใช้ข้อความ `tool`/`toolResult` ล่าสุดที่ sanitize แล้ว; การรันที่ล้มเหลวในตอนจบจะไม่ใช้ข้อความตอบกลับที่จับไว้ซ้ำ)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - สถิติ runtime/token แบบย่อ
  - คำสั่งการส่งมอบที่บอก requester agent ให้เขียนใหม่ด้วยน้ำเสียง assistant ปกติ (ไม่ส่งต่อเมทาดาทาภายในดิบ ๆ)
- `--model` และ `--thinking` จะ override ค่าเริ่มต้นสำหรับการรันนั้นโดยเฉพาะ
- ใช้ `info`/`log` เพื่อตรวจสอบรายละเอียดและเอาต์พุตหลังเสร็จสิ้น
- `/subagents spawn` เป็นโหมดแบบครั้งเดียว (`mode: "run"`) สำหรับเซสชันที่ผูกกับ thread แบบคงอยู่ ให้ใช้ `sessions_spawn` พร้อม `thread: true` และ `mode: "session"`
- สำหรับเซสชัน ACP harness (Codex, Claude Code, Gemini CLI) ให้ใช้ `sessions_spawn` พร้อม `runtime: "acp"` และดู [ACP Agents](/th/tools/acp-agents) โดยเฉพาะ [ACP delivery model](/th/tools/acp-agents#delivery-model) เมื่อต้องดีบักการส่งมอบตอนเสร็จสิ้นหรือ agent-to-agent loops

เป้าหมายหลัก:

- ทำงาน "วิจัย / งานยาว / tool ช้า" แบบขนานโดยไม่บล็อกการรันหลัก
- ทำให้ sub-agents แยกจากกันโดยค่าเริ่มต้น (แยกเซสชัน + sandboxing เพิ่มเติมถ้ามี)
- ทำให้พื้นผิวของ tool ใช้ผิดได้ยาก: sub-agents จะ **ไม่ได้รับ** session tools โดยค่าเริ่มต้น
- รองรับความลึกของการซ้อนที่กำหนดค่าได้สำหรับรูปแบบ orchestrator

หมายเหตุด้านต้นทุน: sub-agent แต่ละตัวมี **บริบทและการใช้โทเค็นของตัวเอง**
โดยค่าเริ่มต้น สำหรับงานหนักหรืองานที่ทำซ้ำบ่อย ให้ตั้งโมเดลที่ถูกกว่าสำหรับ sub-agents และคง
agent หลักของคุณไว้บนโมเดลที่มีคุณภาพสูงกว่า คุณสามารถกำหนดค่านี้ผ่าน `agents.defaults.subagents.model` หรือ
overrides ต่อ agent ได้ เมื่อ child ต้องการทรานสคริปต์ปัจจุบันของผู้ร้องขอจริง ๆ agent สามารถขอ
`context: "fork"` ในการ spawn นั้นครั้งเดียวได้

## โหมดของบริบท

sub-agents แบบ native จะเริ่มแบบแยกอิสระ เว้นแต่ผู้เรียกจะขอให้ fork
ทรานสคริปต์ปัจจุบันอย่างชัดเจน

| โหมด       | ควรใช้เมื่อใด                                                                                                                      | พฤติกรรม                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `isolated` | งานวิจัยใหม่ การลงมือทำแบบอิสระ งานที่ใช้ tool ช้า หรืออะไรก็ตามที่สามารถอธิบายให้เข้าใจได้อย่างกระชับในข้อความของงาน         | สร้างทรานสคริปต์ของ child ที่สะอาด นี่คือค่าเริ่มต้นและช่วยลดการใช้โทเค็น |
| `fork`     | งานที่ขึ้นกับบทสนทนาปัจจุบัน ผลลัพธ์จาก tool ก่อนหน้า หรือคำสั่งที่มีความละเอียดอ่อนซึ่งมีอยู่แล้วในทรานสคริปต์ของผู้ร้องขอ | แตกกิ่งทรานสคริปต์ของผู้ร้องขอไปยังเซสชัน child ก่อนที่ child จะเริ่มต้น     |

ใช้ `fork` เท่าที่จำเป็น มันมีไว้สำหรับการมอบหมายงานที่ไวต่อบริบท ไม่ใช่ใช้แทน
การเขียน task prompt ให้ชัดเจน

## Tool

ใช้ `sessions_spawn`:

- เริ่มการรัน sub-agent (`deliver: false`, global lane: `subagent`)
- จากนั้นรันขั้นตอนประกาศ และโพสต์คำตอบประกาศกลับไปยังแชตแชนเนลของผู้ร้องขอ
- โมเดลค่าเริ่มต้น: สืบทอดจากผู้เรียก เว้นแต่คุณจะตั้ง `agents.defaults.subagents.model` (หรือ `agents.list[].subagents.model` ต่อ agent); ค่า `sessions_spawn.model` แบบ explicit ยังคงมีลำดับความสำคัญสูงกว่า
- thinking ค่าเริ่มต้น: สืบทอดจากผู้เรียก เว้นแต่คุณจะตั้ง `agents.defaults.subagents.thinking` (หรือ `agents.list[].subagents.thinking` ต่อ agent); ค่า `sessions_spawn.thinking` แบบ explicit ยังคงมีลำดับความสำคัญสูงกว่า
- timeout ค่าเริ่มต้นของการรัน: หากละเว้น `sessions_spawn.runTimeoutSeconds` OpenClaw จะใช้ `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งค่า; มิฉะนั้นจะ fallback เป็น `0` (ไม่มี timeout)

พารามิเตอร์ของ tool:

- `task` (จำเป็น)
- `label?` (ไม่บังคับ)
- `agentId?` (ไม่บังคับ; spawn ภายใต้ agent id อื่นหากได้รับอนุญาต)
- `model?` (ไม่บังคับ; override โมเดลของ sub-agent; ค่าที่ไม่ถูกต้องจะถูกข้ามและ sub-agent จะรันบนโมเดลค่าเริ่มต้นพร้อมคำเตือนในผลลัพธ์ของ tool)
- `thinking?` (ไม่บังคับ; override ระดับ thinking สำหรับการรัน sub-agent)
- `runTimeoutSeconds?` (ค่าเริ่มต้นคือ `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งค่า มิฉะนั้น `0`; เมื่อมีการตั้งค่า การรัน sub-agent จะถูกยกเลิกหลัง N วินาที)
- `thread?` (ค่าเริ่มต้น `false`; เมื่อเป็น `true` จะร้องขอการผูกกับ thread ของ channel สำหรับเซสชัน sub-agent นี้)
- `mode?` (`run|session`)
  - ค่าเริ่มต้นคือ `run`
  - หาก `thread: true` และไม่ได้ระบุ `mode` ค่าเริ่มต้นจะกลายเป็น `session`
  - `mode: "session"` ต้องใช้ร่วมกับ `thread: true`
- `cleanup?` (`delete|keep`, ค่าเริ่มต้น `keep`)
- `sandbox?` (`inherit|require`, ค่าเริ่มต้น `inherit`; `require` จะปฏิเสธการ spawn เว้นแต่ runtime ของ child เป้าหมายจะอยู่ใน sandbox)
- `context?` (`isolated|fork`, ค่าเริ่มต้น `isolated`; สำหรับ native sub-agents เท่านั้น)
  - `isolated` สร้างทรานสคริปต์ child ที่สะอาด และเป็นค่าเริ่มต้น
  - `fork` แตกกิ่งทรานสคริปต์ปัจจุบันของผู้ร้องขอไปยังเซสชัน child เพื่อให้ child เริ่มต้นด้วยบริบทบทสนทนาเดียวกัน
  - ใช้ `fork` เฉพาะเมื่อ child ต้องการทรานสคริปต์ปัจจุบัน สำหรับงานที่มีขอบเขต ให้ละเว้น `context`
- `sessions_spawn` **ไม่** รองรับพารามิเตอร์การส่งมอบระดับ channel (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`) สำหรับการส่งมอบ ให้ใช้ `message`/`sessions_send` จากการรันที่ถูก spawn แทน

## เซสชันที่ผูกกับ thread

เมื่อเปิดใช้ thread bindings สำหรับ channel ใดแล้ว sub-agent จะสามารถคงการผูกกับ thread ได้ เพื่อให้ข้อความติดตามจากผู้ใช้ใน thread นั้นยังคงถูกกำหนดเส้นทางไปยังเซสชัน sub-agent เดิม

### channels ที่รองรับ thread

- Discord (ปัจจุบันเป็น channel เดียวที่รองรับ): รองรับเซสชัน subagent แบบ persistent thread-bound (`sessions_spawn` พร้อม `thread: true`), การควบคุม thread ด้วยตนเอง (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) และ adapter keys `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` และ `channels.discord.threadBindings.spawnSubagentSessions`

ลำดับการทำงานอย่างย่อ:

1. spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และจะใส่ `mode: "session"` ก็ได้)
2. OpenClaw จะสร้างหรือผูก thread เข้ากับเป้าหมายเซสชันนั้นใน channel ที่ใช้งานอยู่
3. การตอบกลับและข้อความติดตามใน thread นั้นจะถูกกำหนดเส้นทางไปยังเซสชันที่ผูกไว้
4. ใช้ `/session idle` เพื่อตรวจสอบ/อัปเดตการยกเลิกการโฟกัสอัตโนมัติจากการไม่ใช้งาน และใช้ `/session max-age` เพื่อควบคุม hard cap
5. ใช้ `/unfocus` เพื่อถอดการผูกด้วยตนเอง

การควบคุมด้วยตนเอง:

- `/focus <target>` จะผูก thread ปัจจุบัน (หรือสร้างใหม่) เข้ากับเป้าหมาย sub-agent/session
- `/unfocus` จะลบการผูกสำหรับ thread ที่ผูกอยู่ในปัจจุบัน
- `/agents` จะแสดงรายการการรันที่ใช้งานอยู่และสถานะการผูก (`thread:<id>` หรือ `unbound`)
- `/session idle` และ `/session max-age` ใช้งานได้เฉพาะกับ thread ที่ถูกโฟกัสและผูกไว้

สวิตช์ config:

- ค่าเริ่มต้นแบบ global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- คีย์ override ต่อ channel และคีย์ auto-bind ตอน spawn จะขึ้นกับ adapter ดู **channels ที่รองรับ thread** ด้านบน

ดู [Configuration Reference](/th/gateway/configuration-reference) และ [Slash commands](/th/tools/slash-commands) สำหรับรายละเอียด adapter ปัจจุบัน

Allowlist:

- `agents.list[].subagents.allowAgents`: รายการ agent ids ที่สามารถกำหนดเป้าหมายผ่าน `agentId` ได้ (`["*"]` เพื่ออนุญาตทั้งหมด) ค่าเริ่มต้น: อนุญาตเฉพาะ requester agent
- `agents.defaults.subagents.allowAgents`: target-agent allowlist ค่าเริ่มต้นที่ใช้เมื่อ requester agent ไม่ได้ตั้ง `subagents.allowAgents` ของตัวเอง
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันของ requester อยู่ใน sandbox `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันโดยไม่มี sandbox
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละเว้น `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน) ค่าเริ่มต้น: false

การค้นหา:

- ใช้ `agents_list` เพื่อดูว่า agent ids ใดได้รับอนุญาตในปัจจุบันสำหรับ `sessions_spawn`

การเก็บถาวรอัตโนมัติ:

- เซสชัน sub-agent จะถูกเก็บถาวรโดยอัตโนมัติหลัง `agents.defaults.subagents.archiveAfterMinutes` (ค่าเริ่มต้น: 60)
- การเก็บถาวรใช้ `sessions.delete` และเปลี่ยนชื่อทรานสคริปต์เป็น `*.deleted.<timestamp>` (โฟลเดอร์เดียวกัน)
- `cleanup: "delete"` จะเก็บถาวรทันทีหลังประกาศ (แต่ยังคงเก็บทรานสคริปต์ไว้ผ่านการเปลี่ยนชื่อ)
- การเก็บถาวรอัตโนมัติเป็นแบบ best-effort; ตัวจับเวลาที่รออยู่จะหายไปหาก gateway รีสตาร์ต
- `runTimeoutSeconds` **ไม่** เก็บถาวรอัตโนมัติ; มันเพียงหยุดการรัน เซสชันยังคงอยู่จนกว่าจะถูกเก็บถาวรอัตโนมัติ
- การเก็บถาวรอัตโนมัติใช้เหมือนกันทั้งเซสชันความลึกระดับ 1 และระดับ 2
- การ cleanup ของเบราว์เซอร์แยกจากการ cleanup แบบเก็บถาวร: browser tabs/processes ที่ติดตามไว้จะถูกพยายามปิดแบบ best-effort เมื่อการรันเสร็จสิ้น แม้ว่าจะยังคงเก็บทรานสคริปต์/ระเบียนเซสชันไว้ก็ตาม

## sub-agents แบบซ้อนกัน

โดยค่าเริ่มต้น sub-agents ไม่สามารถ spawn sub-agents ของตัวเองได้ (`maxSpawnDepth: 1`) คุณสามารถเปิดให้ซ้อนกันได้หนึ่งระดับโดยตั้งค่า `maxSpawnDepth: 2` ซึ่งจะอนุญาต **รูปแบบ orchestrator**: main → orchestrator sub-agent → worker sub-sub-agents

### วิธีเปิดใช้งาน

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // อนุญาตให้ sub-agents spawn children ได้ (ค่าเริ่มต้น: 1)
        maxChildrenPerAgent: 5, // จำนวน children ที่ active สูงสุดต่อหนึ่ง agent session (ค่าเริ่มต้น: 5)
        maxConcurrent: 8, // เพดาน concurrency lane แบบ global (ค่าเริ่มต้น: 8)
        runTimeoutSeconds: 900, // timeout ค่าเริ่มต้นสำหรับ sessions_spawn เมื่อไม่ระบุ (0 = ไม่มี timeout)
      },
    },
  },
}
```

### ระดับความลึก

| ความลึก | รูปแบบ session key                           | บทบาท                                         | spawn ได้หรือไม่              |
| ------- | -------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0       | `agent:<id>:main`                            | agent หลัก                                    | ได้เสมอ                       |
| 1       | `agent:<id>:subagent:<uuid>`                 | Sub-agent (เป็น orchestrator เมื่ออนุญาต depth 2) | ได้เฉพาะเมื่อ `maxSpawnDepth >= 2` |
| 2       | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (worker ปลายทาง)                | ไม่ได้                        |

### ห่วงโซ่การประกาศ

ผลลัพธ์จะไหลย้อนกลับตามลำดับ:

1. worker ระดับความลึก 2 เสร็จสิ้น → ประกาศไปยัง parent ของมัน (orchestrator ระดับความลึก 1)
2. orchestrator ระดับความลึก 1 รับการประกาศ สังเคราะห์ผลลัพธ์ แล้วเสร็จสิ้น → ประกาศไปยัง main
3. agent หลักรับการประกาศและส่งมอบให้ผู้ใช้

แต่ละระดับจะเห็นเฉพาะประกาศจาก children โดยตรงของตัวเองเท่านั้น

คำแนะนำเชิงปฏิบัติการ:

- เริ่มงานของ child หนึ่งครั้งแล้วรอ completion events แทนการสร้าง poll
  loops รอบ `sessions_list`, `sessions_history`, `/subagents list` หรือ
  คำสั่ง `exec` ที่มี `sleep`
- `sessions_list` และ `/subagents list` จะคงความสัมพันธ์ของ child-session
  ให้โฟกัสกับงานที่ยังทำอยู่: children ที่ยัง active จะยังคงผูกอยู่ children ที่จบแล้วจะยังมองเห็นได้ใน
  ช่วง recent window สั้น ๆ และลิงก์ child แบบ store-only ที่ stale จะถูกละเลยหลังพ้น freshness window ซึ่งป้องกันไม่ให้เมทาดาทา `spawnedBy` / `parentSessionKey`
  เก่าทำให้เกิด ghost children กลับมาอีกหลังการรีสตาร์ต
- หาก completion event ของ child มาถึงหลังจากที่คุณส่งคำตอบสุดท้ายไปแล้ว
  การตอบสนองต่อที่ถูกต้องคือ silent token แบบตรงตัว `NO_REPLY` / `no_reply`

### นโยบาย tool ตามระดับความลึก

- บทบาทและขอบเขตการควบคุมจะถูกเขียนลงในเมทาดาทาของเซสชันตั้งแต่ตอน spawn ซึ่งช่วยป้องกันไม่ให้ session keys แบบแบนหรือที่ถูกกู้คืนกลับมาได้สิทธิ์ orchestrator โดยไม่ตั้งใจ
- **ระดับความลึก 1 (orchestrator, เมื่อ `maxSpawnDepth >= 2`)**: จะได้รับ `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` เพื่อจัดการ children ของตัวเอง ส่วน session/system tools อื่น ๆ ยังคงถูกปฏิเสธ
- **ระดับความลึก 1 (leaf, เมื่อ `maxSpawnDepth == 1`)**: ไม่มี session tools (เป็นพฤติกรรมค่าเริ่มต้นปัจจุบัน)
- **ระดับความลึก 2 (leaf worker)**: ไม่มี session tools — `sessions_spawn` จะถูกปฏิเสธเสมอที่ระดับความลึก 2 ไม่สามารถ spawn children เพิ่มเติมได้

### ขีดจำกัดการ spawn ต่อ agent

แต่ละ agent session (ไม่ว่าที่ระดับความลึกใด) สามารถมี children ที่ active ได้สูงสุด `maxChildrenPerAgent` (ค่าเริ่มต้น: 5) ในเวลาเดียวกัน ซึ่งช่วยป้องกันการแตกแขนงเกินควบคุมจาก orchestrator ตัวเดียว

### Cascade stop

การหยุด orchestrator ระดับความลึก 1 จะหยุด children ระดับความลึก 2 ทั้งหมดโดยอัตโนมัติ:

- `/stop` ในแชตหลักจะหยุด agents ระดับความลึก 1 ทั้งหมด และ cascade ไปยัง children ระดับความลึก 2 ของพวกมัน
- `/subagents kill <id>` จะหยุด sub-agent เฉพาะตัว และ cascade ไปยัง children ของมัน
- `/subagents kill all` จะหยุด sub-agents ทั้งหมดของผู้ร้องขอ และ cascade ต่อไป

## การยืนยันตัวตน

การยืนยันตัวตนของ sub-agent จะ resolve ตาม **agent id** ไม่ใช่ตามประเภทเซสชัน:

- session key ของ sub-agent คือ `agent:<agentId>:subagent:<uuid>`
- auth store จะถูกโหลดจาก `agentDir` ของ agent นั้น
- auth profiles ของ agent หลักจะถูก merge เข้ามาเป็น **fallback**; agent profiles จะ override main profiles หากมีความขัดแย้ง

หมายเหตุ: การ merge เป็นแบบเพิ่มเข้าไป ดังนั้น main profiles จะพร้อมใช้งานเป็น fallback เสมอ การแยก auth อย่างสมบูรณ์ต่อ agent ยังไม่รองรับในตอนนี้

## การประกาศ

Sub-agents รายงานกลับผ่านขั้นตอนการประกาศ:

- ขั้นตอนการประกาศจะรันภายในเซสชันของ sub-agent (ไม่ใช่เซสชันของผู้ร้องขอ)
- หาก sub-agent ตอบกลับเป็น `ANNOUNCE_SKIP` แบบตรงตัว ระบบจะไม่โพสต์อะไร
- หากข้อความ assistant ล่าสุดเป็น silent token แบบตรงตัว `NO_REPLY` / `no_reply`
  เอาต์พุตของการประกาศจะถูกระงับ แม้ว่าก่อนหน้านั้นจะมีความคืบหน้าที่มองเห็นได้ก็ตาม
- มิฉะนั้น การส่งมอบจะขึ้นกับระดับความลึกของผู้ร้องขอ:
  - เซสชันผู้ร้องขอระดับบนสุดจะใช้การเรียก `agent` ติดตามผลพร้อมการส่งมอบภายนอก (`deliver=true`)
  - เซสชัน requester subagent แบบซ้อนกันจะได้รับการ inject ติดตามผลภายใน (`deliver=false`) เพื่อให้ orchestrator สังเคราะห์ผลลัพธ์ของ child ภายในเซสชันได้
  - หากเซสชัน requester subagent แบบซ้อนกันหายไป OpenClaw จะ fallback ไปยัง requester ของเซสชันนั้นเมื่อมี
- สำหรับเซสชันผู้ร้องขอระดับบนสุด การส่งมอบแบบ direct ในโหมด completion จะ resolve เส้นทาง conversation/thread ที่ผูกไว้และ hook override ก่อน จากนั้นจึงเติมฟิลด์เป้าหมายของ channel ที่ขาดหายจากเส้นทางที่เก็บไว้ของเซสชัน requester ซึ่งช่วยให้การส่งมอบ completion ไปยังแชต/หัวข้อที่ถูกต้องยังคงทำงาน แม้ origin ของ completion จะระบุเพียง channel เท่านั้น
- การรวมผล completion ของ child จะถูกจำกัดอยู่ที่ requester run ปัจจุบันเมื่อสร้าง nested completion findings เพื่อป้องกันไม่ให้เอาต์พุตของ child จาก run เก่าที่ stale รั่วเข้ามาใน announce ปัจจุบัน
- การตอบกลับแบบประกาศจะคงการกำหนดเส้นทางตาม thread/topic เมื่อมีบน channel adapters
- บริบทของ announce จะถูก normalize เป็นบล็อก internal event ที่เสถียร:
  - แหล่งที่มา (`subagent` หรือ `cron`)
  - child session key/id
  - ประเภท announce + task label
  - บรรทัดสถานะที่ derive จากผลลัพธ์ของ runtime (`success`, `error`, `timeout` หรือ `unknown`)
  - เนื้อหาผลลัพธ์ที่เลือกจากข้อความ assistant ล่าสุดที่มองเห็นได้ มิฉะนั้นจะใช้ข้อความ `tool`/`toolResult` ล่าสุดที่ sanitize แล้ว; การรันที่ล้มเหลวในตอนจบจะรายงานสถานะล้มเหลวโดยไม่ replay ข้อความตอบกลับที่จับไว้
  - คำสั่งติดตามผลที่อธิบายว่าเมื่อใดควรตอบกลับหรือคงความเงียบ
- `Status` จะไม่ถูกอนุมานจากเอาต์พุตของโมเดล; มันมาจากสัญญาณผลลัพธ์ของ runtime
- เมื่อ timeout หาก child ผ่านมาได้แค่ขั้น tool calls การประกาศอาจย่อประวัตินั้นเป็นสรุปความคืบหน้าบางส่วนแบบสั้น แทนที่จะ replay เอาต์พุตดิบของ tool

payload ของ announce จะมีบรรทัดสถิติที่ท้ายสุดเสมอ (แม้จะถูกห่อไว้):

- Runtime (เช่น `runtime 5m12s`)
- การใช้โทเค็น (input/output/total)
- ต้นทุนโดยประมาณเมื่อมีการกำหนดราคาโมเดลไว้ (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` และพาธของทรานสคริปต์ (เพื่อให้ agent หลักสามารถดึงประวัติผ่าน `sessions_history` หรือตรวจสอบไฟล์บนดิสก์ได้)
- เมทาดาทาภายในมีไว้เพื่อ orchestration เท่านั้น; คำตอบที่ผู้ใช้มองเห็นควรถูกเขียนใหม่ด้วยน้ำเสียง assistant ปกติ

`sessions_history` คือเส้นทาง orchestration ที่ปลอดภัยกว่า:

- การเรียกคืนของ assistant จะถูก normalize ก่อน:
  - แท็ก thinking จะถูกลบออก
  - บล็อกโครง `<relevant-memories>` / `<relevant_memories>` จะถูกลบออก
  - บล็อก payload XML ของ tool-call แบบ plain-text เช่น `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` และ
    `<function_calls>...</function_calls>` จะถูกลบออก รวมถึง payloads ที่ถูกตัดทอน
    และไม่เคยปิดอย่างสมบูรณ์
  - โครง tool-call/result ที่ถูกลดระดับและตัวทำเครื่องหมาย historical-context จะถูกลบออก
  - model control tokens ที่รั่วออกมา เช่น `<|assistant|>`, โทเค็น ASCII
    อื่น ๆ รูปแบบ `<|...|>` และรูปแบบ full-width `<｜...｜>` จะถูกลบออก
  - MiniMax tool-call XML ที่ผิดรูปจะถูกลบออก
- ข้อความที่ดูเหมือนข้อมูลรับรอง/โทเค็นจะถูกปกปิด
- บล็อกยาวอาจถูกตัดทอน
- ประวัติที่ใหญ่มากอาจทิ้งแถวเก่า หรือแทนที่แถวที่ใหญ่เกินไปด้วย
  `[sessions_history omitted: message too large]`
- การตรวจสอบทรานสคริปต์ดิบบนดิสก์คือทางเลือกสุดท้ายเมื่อคุณต้องการทรานสคริปต์เต็มแบบ byte-for-byte

## นโยบาย Tool (tools ของ sub-agent)

โดยค่าเริ่มต้น sub-agents จะได้ **ทุก tool ยกเว้น session tools** และ system tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` ยังคงเป็นมุมมองการเรียกคืนแบบมีขอบเขตและผ่านการ sanitize ที่นี่ด้วย; มัน
ไม่ใช่การ dump ทรานสคริปต์ดิบ

เมื่อ `maxSpawnDepth >= 2`, sub-agents แบบ orchestrator ที่ระดับความลึก 1 จะได้รับ `sessions_spawn`, `subagents`, `sessions_list` และ `sessions_history` เพิ่มเติม เพื่อให้จัดการ children ของตัวเองได้

override ผ่าน config:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny ชนะเสมอ
        deny: ["gateway", "cron"],
        // หากตั้ง allow ไว้ จะกลายเป็น allow-only (deny ยังคงชนะ)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrency

Sub-agents ใช้ queue lane ภายในโปรเซสแบบเฉพาะ:

- ชื่อ lane: `subagent`
- Concurrency: `agents.defaults.subagents.maxConcurrent` (ค่าเริ่มต้น `8`)

## Liveness และการกู้คืน

OpenClaw ไม่ถือว่าการไม่มี `endedAt` เป็นหลักฐานถาวรว่ามี sub-agent
ยังมีชีวิตอยู่ การรันที่ไม่สิ้นสุดซึ่งเก่ากว่า stale-run window จะหยุดถูกนับเป็น
active/pending ใน `/subagents list`, สรุปสถานะ, descendant completion
gating และการตรวจสอบ concurrency ต่อเซสชัน

หลัง gateway รีสตาร์ต การรันที่ stale และยังไม่สิ้นสุดซึ่งถูกกู้คืนมาจะถูก prune เว้นแต่
เซสชัน child จะถูกทำเครื่องหมาย `abortedLastRun: true` เซสชัน child ที่ถูกยกเลิกจากการรีสตาร์ต
เหล่านั้นยังคงกู้คืนได้ผ่าน flow การกู้คืน orphan ของ sub-agent ซึ่ง
จะส่งข้อความ resume แบบสังเคราะห์ก่อน แล้วจึงล้างตัวทำเครื่องหมาย aborted

## การหยุด

- การส่ง `/stop` ในแชตของผู้ร้องขอจะยกเลิกเซสชันของผู้ร้องขอและหยุดการรัน sub-agent ที่ active ทั้งหมดที่ spawn จากมัน พร้อม cascade ไปยัง children แบบซ้อน
- `/subagents kill <id>` จะหยุด sub-agent เฉพาะตัวและ cascade ไปยัง children ของมัน

## ข้อจำกัด

- การประกาศของ sub-agent เป็นแบบ **best-effort** หาก gateway รีสตาร์ต งาน "ประกาศกลับ" ที่รออยู่จะหายไป
- Sub-agents ยังคงแชร์ทรัพยากรของโปรเซส gateway เดียวกัน; ให้ถือว่า `maxConcurrent` เป็นวาล์วความปลอดภัย
- `sessions_spawn` จะไม่บล็อกเสมอ: มันจะคืน `{ status: "accepted", runId, childSessionKey }` ทันที
- บริบทของ sub-agent จะ inject เฉพาะ `AGENTS.md` + `TOOLS.md` (ไม่มี `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` หรือ `BOOTSTRAP.md`)
- ความลึกของการซ้อนสูงสุดคือ 5 (`maxSpawnDepth` ช่วง: 1–5) โดยแนะนำ depth 2 สำหรับกรณีใช้งานส่วนใหญ่
- `maxChildrenPerAgent` จำกัดจำนวน children ที่ active ต่อหนึ่งเซสชัน (ค่าเริ่มต้น: 5 ช่วง: 1–20)

## ที่เกี่ยวข้อง

- [ACP agents](/th/tools/acp-agents)
- [Multi-agent sandbox tools](/th/tools/multi-agent-sandbox-tools)
- [Agent send](/th/tools/agent-send)
