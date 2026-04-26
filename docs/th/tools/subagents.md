---
read_when:
    - คุณต้องการงานเบื้องหลังหรือแบบขนานผ่านเอเจนต์
    - คุณกำลังเปลี่ยน `sessions_spawn` หรือนโยบายเครื่องมือของ Sub-agent
    - คุณกำลังติดตั้งใช้งานหรือแก้ไขปัญหาเซสชัน Sub-agent ที่ผูกกับเธรด
sidebarTitle: Sub-agents
summary: สร้างการรันเอเจนต์เบื้องหลังแบบแยกส่วนที่ประกาศผลลัพธ์กลับมายังแชตของผู้ร้องขอ
title: Sub-agents
x-i18n:
    generated_at: "2026-04-26T11:44:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

Sub-agents คือการรันเอเจนต์เบื้องหลังที่ถูก spawn มาจากการรันเอเจนต์ที่มีอยู่
โดยจะรันในเซสชันของตัวเอง (`agent:<agentId>:subagent:<uuid>`) และ
เมื่อเสร็จสิ้นแล้ว จะ **ประกาศ** ผลลัพธ์กลับไปยังช่องแชตของผู้ร้องขอ
การรัน Sub-agent แต่ละครั้งจะถูกติดตามเป็น
[งานเบื้องหลัง](/th/automation/tasks)

เป้าหมายหลัก:

- ทำงานแบบขนานสำหรับงาน "ค้นคว้า / งานยาว / เครื่องมือช้า" โดยไม่บล็อกการรันหลัก
- แยก Sub-agent ออกจากกันเป็นค่าเริ่มต้น (การแยกเซสชัน + sandbox แบบเลือกได้)
- ทำให้พื้นผิวของเครื่องมือถูกนำไปใช้ผิดได้ยาก: Sub-agent จะ **ไม่ได้** รับเครื่องมือเซสชันโดยค่าเริ่มต้น
- รองรับความลึกของการซ้อนที่กำหนดค่าได้สำหรับรูปแบบ orchestrator

<Note>
**หมายเหตุเรื่องต้นทุน:** Sub-agent แต่ละตัวมีบริบทและการใช้โทเค็นของตัวเอง
เป็นค่าเริ่มต้น สำหรับงานหนักหรืองานที่ทำซ้ำบ่อย ให้ตั้งโมเดลที่ถูกกว่าสำหรับ Sub-agent
และคงโมเดลหลักของคุณไว้ที่คุณภาพสูงกว่า กำหนดค่าได้ผ่าน
`agents.defaults.subagents.model` หรือ override รายเอเจนต์ เมื่อลูกจำเป็นต้องใช้ transcript ปัจจุบันของผู้ร้องขอจริง ๆ เอเจนต์สามารถร้องขอ
`context: "fork"` ได้เฉพาะตอน spawn นั้น
</Note>

## คำสั่ง Slash

ใช้ `/subagents` เพื่อตรวจสอบหรือควบคุมการรัน Sub-agent สำหรับ
**เซสชันปัจจุบัน**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` จะแสดงเมทาดาทาของการรัน (สถานะ, timestamp, session id,
เส้นทาง transcript, cleanup) ใช้ `sessions_history` เพื่อดูมุมมอง recall ที่มีขอบเขต
และผ่านตัวกรองความปลอดภัย; ตรวจสอบเส้นทาง transcript บนดิสก์เมื่อคุณ
ต้องการ transcript ดิบแบบเต็ม

### ตัวควบคุมการผูกกับเธรด

คำสั่งเหล่านี้ทำงานบนช่องทางที่รองรับการผูกกับเธรดแบบถาวร
ดู [ช่องทางที่รองรับเธรด](#thread-supporting-channels) ด้านล่าง

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### พฤติกรรมการ Spawn

`/subagents spawn` จะเริ่ม Sub-agent เบื้องหลังเป็นคำสั่งผู้ใช้ (ไม่ใช่
internal relay) และส่งอัปเดตการเสร็จสิ้นครั้งสุดท้ายหนึ่งครั้งกลับไปยัง
แชตของผู้ร้องขอเมื่อการรันเสร็จสิ้น

<AccordionGroup>
  <Accordion title="การเสร็จสิ้นแบบไม่บล็อกและอิงการ push">
    - คำสั่ง spawn ไม่บล็อก; จะคืน run id ทันที
    - เมื่อเสร็จสิ้น Sub-agent จะประกาศข้อความสรุป/ผลลัพธ์กลับไปยังช่องแชตของผู้ร้องขอ
    - การส่งผลเมื่อเสร็จสิ้นเป็นแบบ push เมื่อ spawn แล้ว **อย่า** poll `/subagents list`, `sessions_list` หรือ `sessions_history` เป็นลูปเพียงเพื่อรอให้เสร็จ; ตรวจสอบสถานะเฉพาะเมื่อจำเป็นสำหรับการดีบักหรือการแทรกแซง
    - เมื่อเสร็จสิ้น OpenClaw จะพยายามอย่างดีที่สุดในการปิดแท็บเบราว์เซอร์/โปรเซสที่ติดตามไว้ซึ่งเปิดโดยเซสชัน Sub-agent นั้น ก่อนที่โฟลว์ cleanup สำหรับการประกาศจะดำเนินต่อ
  </Accordion>
  <Accordion title="ความทนทานของการส่งผลสำหรับการ spawn แบบแมนนวล">
    - OpenClaw จะพยายามส่งตรงแบบ `agent` ก่อนโดยใช้ idempotency key ที่คงที่
    - หากการส่งตรงล้มเหลว จะ fallback ไปยังการกำหนดเส้นทางผ่านคิว
    - หากยังไม่สามารถใช้การกำหนดเส้นทางผ่านคิวได้ ระบบจะลองส่งประกาศใหม่ด้วย exponential backoff แบบสั้นก่อนยอมแพ้ขั้นสุดท้าย
    - การส่งผลเมื่อเสร็จสิ้นจะคงเส้นทางของผู้ร้องขอที่ถูก resolve แล้ว: เส้นทางการเสร็จสิ้นแบบผูกกับเธรดหรือผูกกับบทสนทนาจะมีสิทธิ์ก่อนเมื่อมีอยู่; หากต้นทางของการเสร็จสิ้นให้มาเพียงช่องทาง OpenClaw จะเติม target/account ที่ขาดหายไปจากเส้นทางที่ resolve แล้วของเซสชันผู้ร้องขอ (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งตรงยังทำงานได้
  </Accordion>
  <Accordion title="เมทาดาทาการส่งต่องานเมื่อเสร็จสิ้น">
    การส่งต่องานเมื่อเสร็จสิ้นกลับไปยังเซสชันของผู้ร้องขอเป็นบริบทภายในที่สร้างขึ้นระหว่างรันไทม์
    (ไม่ใช่ข้อความที่ผู้ใช้เขียน) และประกอบด้วย:

    - `Result` — ข้อความตอบกลับ `assistant` ล่าสุดที่มองเห็นได้ หรือไม่เช่นนั้นคือข้อความ `tool/toolResult` ล่าสุดที่ผ่านการทำให้ปลอดภัยแล้ว การรันที่ล้มเหลวแบบ terminal จะไม่นำข้อความตอบกลับที่จับไว้กลับมาใช้
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`
    - สถิติรันไทม์/โทเค็นแบบย่อ
    - คำสั่งการส่งต่อที่บอกเอเจนต์ผู้ร้องขอให้เรียบเรียงใหม่ด้วยน้ำเสียงผู้ช่วยตามปกติ (ไม่ใช่ส่งต่อเมทาดาทาภายในดิบ ๆ)

  </Accordion>
  <Accordion title="โหมดและรันไทม์ ACP">
    - `--model` และ `--thinking` จะ override ค่าเริ่มต้นสำหรับการรันนั้นโดยเฉพาะ
    - ใช้ `info`/`log` เพื่อตรวจสอบรายละเอียดและเอาต์พุตหลังเสร็จสิ้น
    - `/subagents spawn` เป็นโหมด one-shot (`mode: "run"`) สำหรับเซสชันแบบถาวรที่ผูกกับเธรด ให้ใช้ `sessions_spawn` พร้อม `thread: true` และ `mode: "session"`
    - สำหรับเซสชัน ACP harness (Claude Code, Gemini CLI, OpenCode หรือ Codex ACP/acpx แบบระบุชัดเจน) ให้ใช้ `sessions_spawn` พร้อม `runtime: "acp"` เมื่อเครื่องมือประกาศรองรับรันไทม์นั้น ดู [รูปแบบการส่งของ ACP](/th/tools/acp-agents#delivery-model) เมื่อดีบักการเสร็จสิ้นหรือการวนลูประหว่างเอเจนต์ เมื่อเปิดใช้ Plugin `codex` แล้ว การควบคุมแชต/เธรดของ Codex ควรใช้ `/codex ...` มากกว่า ACP เว้นแต่ผู้ใช้จะร้องขอ ACP/acpx อย่างชัดเจน
    - OpenClaw จะซ่อน `runtime: "acp"` จนกว่าจะเปิดใช้ ACP, ผู้ร้องขอไม่ได้อยู่ใน sandbox และมีการโหลด backend Plugin เช่น `acpx` อยู่ `runtime: "acp"` คาดหวัง external ACP harness id หรือรายการ `agents.list[]` ที่มี `runtime.type="acp"`; ใช้รันไทม์ Sub-agent เริ่มต้นสำหรับเอเจนต์ config ปกติของ OpenClaw จาก `agents_list`
  </Accordion>
</AccordionGroup>

## โหมดบริบท

Sub-agent แบบเนทีฟจะเริ่มอย่างแยกขาดโดยค่าเริ่มต้น เว้นแต่ผู้เรียกจะร้องขอให้ fork
transcript ปัจจุบันอย่างชัดเจน

| โหมด       | ใช้เมื่อใด                                                                                                                               | พฤติกรรม                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | การค้นคว้าใหม่ การติดตั้งใช้งานแบบอิสระ งานเครื่องมือช้า หรือสิ่งใดก็ตามที่สามารถสรุปโจทย์ได้ในข้อความงาน                               | สร้าง transcript ลูกใหม่ที่สะอาด นี่คือค่าเริ่มต้นและช่วยให้การใช้โทเค็นต่ำลง |
| `fork`     | งานที่ขึ้นอยู่กับบทสนทนาปัจจุบัน ผลลัพธ์จากเครื่องมือก่อนหน้า หรือคำสั่งที่มีนัยละเอียดอ่อนซึ่งมีอยู่แล้วใน transcript ของผู้ร้องขอ | แตกแขนง transcript ของผู้ร้องขอไปยังเซสชันลูกก่อนที่เซสชันลูกจะเริ่ม             |

ใช้ `fork` เท่าที่จำเป็น มันมีไว้สำหรับการมอบหมายงานที่ไวต่อบริบท ไม่ใช่
ใช้แทนการเขียน task prompt ให้ชัดเจน

## เครื่องมือ: `sessions_spawn`

เริ่มการรัน Sub-agent ด้วย `deliver: false` บน lane `subagent` แบบ global
จากนั้นจึงรันขั้นตอนประกาศและโพสต์คำตอบประกาศกลับไปยังช่องแชต
ของผู้ร้องขอ

**ค่าเริ่มต้น:**

- **โมเดล:** สืบทอดจากผู้เรียก เว้นแต่คุณจะตั้ง `agents.defaults.subagents.model` (หรือ `agents.list[].subagents.model` รายเอเจนต์); ค่า `sessions_spawn.model` แบบระบุชัดจะยังมีสิทธิ์เหนือกว่า
- **Thinking:** สืบทอดจากผู้เรียก เว้นแต่คุณจะตั้ง `agents.defaults.subagents.thinking` (หรือ `agents.list[].subagents.thinking` รายเอเจนต์); ค่า `sessions_spawn.thinking` แบบระบุชัดจะยังมีสิทธิ์เหนือกว่า
- **หมดเวลาการรัน:** หากไม่ระบุ `sessions_spawn.runTimeoutSeconds` OpenClaw จะใช้ `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งค่า; มิฉะนั้นจะ fallback ไปที่ `0` (ไม่มีการหมดเวลา)

### พารามิเตอร์ของเครื่องมือ

<ParamField path="task" type="string" required>
  คำอธิบายงานสำหรับ Sub-agent
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับที่มนุษย์อ่านเข้าใจได้แบบไม่บังคับ
</ParamField>
<ParamField path="agentId" type="string">
  Spawn ภายใต้ agent id อื่นเมื่อได้รับอนุญาตโดย `subagents.allowAgents`
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ใช้เฉพาะสำหรับ external ACP harness (`claude`, `droid`, `gemini`, `opencode` หรือ Codex ACP/acpx ที่ร้องขออย่างชัดเจน) และสำหรับรายการ `agents.list[]` ที่ `runtime.type` เป็น `acp`
</ParamField>
<ParamField path="model" type="string">
  override โมเดลของ Sub-agent ค่าที่ไม่ถูกต้องจะถูกข้าม และ Sub-agent จะรันด้วยโมเดลเริ่มต้นพร้อมคำเตือนในผลลัพธ์ของเครื่องมือ
</ParamField>
<ParamField path="thinking" type="string">
  override ระดับ thinking สำหรับการรัน Sub-agent
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ค่าเริ่มต้นคือ `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งค่า มิฉะนั้นเป็น `0` เมื่อตั้งค่าไว้ การรัน Sub-agent จะถูกยกเลิกหลังผ่านไป N วินาที
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  เมื่อเป็น `true` จะร้องขอการผูกกับเธรดของช่องทางสำหรับเซสชัน Sub-agent นี้
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  หาก `thread: true` และไม่ระบุ `mode` ค่าเริ่มต้นจะกลายเป็น `session` `mode: "session"` ต้องใช้ `thread: true`
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` จะเก็บเข้าคลังทันทีหลังประกาศ (ยังคงเก็บ transcript ไว้ผ่านการเปลี่ยนชื่อ)
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` จะปฏิเสธการ spawn เว้นแต่รันไทม์ลูกเป้าหมายจะอยู่ใน sandbox
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` จะแตก transcript ปัจจุบันของผู้ร้องขอไปยังเซสชันลูก Native Sub-agent เท่านั้น ใช้ `fork` เฉพาะเมื่อเด็กต้องการ transcript ปัจจุบัน
</ParamField>

<Warning>
`sessions_spawn` **ไม่** รับพารามิเตอร์การส่งแบบ channel (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) สำหรับการส่ง ให้ใช้
`message`/`sessions_send` จากการรันที่ถูก spawn
</Warning>

## เซสชันที่ผูกกับเธรด

เมื่อเปิดใช้การผูกกับเธรดสำหรับช่องทางหนึ่ง Sub-agent สามารถคงการผูกกับ
เธรดไว้ได้ เพื่อให้ข้อความติดตามผลของผู้ใช้ในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยัง
เซสชัน Sub-agent เดิม

### ช่องทางที่รองรับเธรด

ปัจจุบัน **Discord** เป็นช่องทางเดียวที่รองรับ โดยรองรับ
เซสชัน Sub-agent แบบถาวรที่ผูกกับเธรด (`sessions_spawn` พร้อม
`thread: true`), ตัวควบคุมเธรดแบบแมนนวล (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) และคีย์ของ adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` และ
`channels.discord.threadBindings.spawnSubagentSessions`

### โฟลว์แบบรวดเร็ว

<Steps>
  <Step title="Spawn">
    `sessions_spawn` พร้อม `thread: true` (และอาจมี `mode: "session"`)
  </Step>
  <Step title="Bind">
    OpenClaw จะสร้างหรือผูกเธรดเข้ากับเป้าหมายเซสชันนั้นในช่องทางที่ใช้งานอยู่
  </Step>
  <Step title="กำหนดเส้นทางข้อความติดตามผล">
    การตอบกลับและข้อความติดตามผลในเธรดนั้นจะถูกกำหนดเส้นทางไปยังเซสชันที่ผูกไว้
  </Step>
  <Step title="ตรวจสอบการหมดเวลา">
    ใช้ `/session idle` เพื่อตรวจสอบ/อัปเดตการยกเลิกการโฟกัสอัตโนมัติเมื่อไม่มีการใช้งาน และ
    `/session max-age` เพื่อควบคุม hard cap
  </Step>
  <Step title="ยกการผูก">
    ใช้ `/unfocus` เพื่อยกการผูกด้วยตนเอง
  </Step>
</Steps>

### ตัวควบคุมแบบแมนนวล

| คำสั่ง             | ผลลัพธ์                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| `/focus <target>`  | ผูกเธรดปัจจุบัน (หรือสร้างเธรดใหม่) เข้ากับเป้าหมาย Sub-agent/เซสชัน |
| `/unfocus`         | ลบการผูกของเธรดปัจจุบันที่ผูกอยู่                                      |
| `/agents`          | แสดงรายการการรันที่ใช้งานอยู่และสถานะการผูก (`thread:<id>` หรือ `unbound`) |
| `/session idle`    | ตรวจสอบ/อัปเดตการยกเลิกการโฟกัสอัตโนมัติเมื่อไม่มีการใช้งาน (เฉพาะเธรดที่ผูกและถูกโฟกัส) |
| `/session max-age` | ตรวจสอบ/อัปเดต hard cap (เฉพาะเธรดที่ผูกและถูกโฟกัส)                  |

### สวิตช์การกำหนดค่า

- **ค่าเริ่มต้นแบบ global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- **คีย์ override รายช่องทางและการผูกอัตโนมัติเมื่อ spawn** เป็นแบบเฉพาะ adapter ดู [ช่องทางที่รองรับเธรด](#thread-supporting-channels) ด้านบน

ดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) และ
[คำสั่ง Slash](/th/tools/slash-commands) สำหรับรายละเอียดของ adapter ปัจจุบัน

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  รายการ agent id ที่สามารถกำหนดเป้าหมายผ่าน `agentId` ได้ (`["*"]` อนุญาตทั้งหมด) ค่าเริ่มต้น: เฉพาะเอเจนต์ของผู้ร้องขอเท่านั้น
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  allowlist ของเอเจนต์เป้าหมายเริ่มต้นที่ใช้เมื่อเอเจนต์ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  บล็อกการเรียก `sessions_spawn` ที่ละเว้น `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน) Override รายเอเจนต์: `agents.list[].subagents.requireAgentId`
</ParamField>

หากเซสชันของผู้ร้องขออยู่ใน sandbox `sessions_spawn` จะปฏิเสธเป้าหมาย
ที่จะรันแบบไม่อยู่ใน sandbox

### การค้นพบ

ใช้ `agents_list` เพื่อดูว่า agent id ใดบ้างที่ปัจจุบันได้รับอนุญาตสำหรับ
`sessions_spawn` การตอบกลับจะรวมโมเดลที่มีผลจริงของเอเจนต์แต่ละตัวที่แสดงอยู่
และเมทาดาทารันไทม์ที่ฝังไว้ เพื่อให้ผู้เรียกแยกความแตกต่างระหว่าง PI, Codex
app-server และรันไทม์เนทีฟอื่น ๆ ที่กำหนดค่าไว้

### การเก็บเข้าคลังอัตโนมัติ

- เซสชัน Sub-agent จะถูกเก็บเข้าคลังโดยอัตโนมัติหลัง `agents.defaults.subagents.archiveAfterMinutes` (ค่าเริ่มต้น `60`)
- การเก็บเข้าคลังใช้ `sessions.delete` และเปลี่ยนชื่อ transcript เป็น `*.deleted.<timestamp>` (โฟลเดอร์เดิม)
- `cleanup: "delete"` จะเก็บเข้าคลังทันทีหลังประกาศ (ยังคงเก็บ transcript ไว้ผ่านการเปลี่ยนชื่อ)
- การเก็บเข้าคลังอัตโนมัติเป็นแบบ best-effort; ตัวตั้งเวลาที่ค้างอยู่จะหายไปหาก gateway รีสตาร์ต
- `runTimeoutSeconds` **จะไม่** เก็บเข้าคลังอัตโนมัติ; มันเพียงหยุดการรัน เซสชันจะยังคงอยู่จนกว่าจะถึงการเก็บเข้าคลังอัตโนมัติ
- การเก็บเข้าคลังอัตโนมัติใช้เหมือนกันทั้งกับเซสชันระดับความลึก 1 และระดับความลึก 2
- การ cleanup เบราว์เซอร์แยกจากการ cleanup แบบเก็บเข้าคลัง: แท็บ/โปรเซสของเบราว์เซอร์ที่ติดตามไว้จะถูกพยายามปิดเมื่อการรันเสร็จ แม้ว่าจะยังเก็บ transcript/ระเบียนเซสชันไว้ก็ตาม

## Sub-agent แบบซ้อน

ตามค่าเริ่มต้น Sub-agent จะไม่สามารถ spawn Sub-agent ของตัวเองได้
(`maxSpawnDepth: 1`) ตั้งค่า `maxSpawnDepth: 2` เพื่อเปิดใช้งานการซ้อน
หนึ่งระดับ — **รูปแบบ orchestrator**: main → orchestrator Sub-agent →
worker Sub-sub-agent

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // อนุญาตให้ Sub-agent spawn ลูกได้ (ค่าเริ่มต้น: 1)
        maxChildrenPerAgent: 5, // จำนวนลูกที่ active สูงสุดต่อเซสชันเอเจนต์ (ค่าเริ่มต้น: 5)
        maxConcurrent: 8, // เพดาน concurrency ของ lane แบบ global (ค่าเริ่มต้น: 8)
        runTimeoutSeconds: 900, // ค่า timeout เริ่มต้นสำหรับ sessions_spawn เมื่อไม่ระบุ (0 = ไม่มี timeout)
      },
    },
  },
}
```

### ระดับความลึก

| ความลึก | รูปแบบ session key                          | บทบาท                                        | Spawn ได้หรือไม่              |
| ------- | ------------------------------------------- | -------------------------------------------- | ----------------------------- |
| 0       | `agent:<id>:main`                           | เอเจนต์หลัก                                  | ได้เสมอ                       |
| 1       | `agent:<id>:subagent:<uuid>`                | Sub-agent (เป็น orchestrator เมื่ออนุญาต depth 2) | ได้เฉพาะเมื่อ `maxSpawnDepth >= 2` |
| 2       | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (worker ปลายทาง)               | ไม่ได้เลย                     |

### ลำดับการประกาศ

ผลลัพธ์จะไหลย้อนกลับขึ้นมาตามลำดับ:

1. worker ระดับความลึก 2 เสร็จสิ้น → ประกาศไปยัง parent ของมัน (orchestrator ระดับความลึก 1)
2. orchestrator ระดับความลึก 1 ได้รับการประกาศ สังเคราะห์ผลลัพธ์ แล้วเสร็จสิ้น → ประกาศไปยัง main
3. เอเจนต์หลักได้รับการประกาศและส่งต่อให้ผู้ใช้

แต่ละระดับจะเห็นเฉพาะการประกาศจากลูกโดยตรงของตัวเองเท่านั้น

<Note>
**คำแนะนำด้านการปฏิบัติการ:** เริ่มงานของลูกครั้งเดียวแล้วรอ event การเสร็จสิ้น
แทนที่จะสร้างลูป poll รอบ `sessions_list`,
`sessions_history`, `/subagents list` หรือคำสั่ง `exec` sleep
`sessions_list` และ `/subagents list` จะคงความสัมพันธ์ของ child-session
ให้มุ่งเน้นที่งานที่ยังมีชีวิตอยู่ — ลูกที่ยังทำงานจะยังคงผูกอยู่ ลูกที่จบแล้วจะยังคงมองเห็นได้
ในช่วงเวลาล่าสุดแบบสั้น ๆ และลิงก์ลูกแบบ store-only ที่ล้าสมัยจะถูก
ละเว้นหลังผ่านหน้าต่างความใหม่ของมัน วิธีนี้ป้องกันไม่ให้เมทาดาทา `spawnedBy` /
`parentSessionKey` แบบเก่าปลุก child ผีให้กลับมาอีกหลังการรีสตาร์ต
หาก event การเสร็จสิ้นของลูกมาถึงหลังจากที่คุณส่งคำตอบสุดท้ายไปแล้ว การติดตามผลที่ถูกต้องคือโทเค็นเงียบแบบตรงตัว
`NO_REPLY` / `no_reply`
</Note>

### นโยบายเครื่องมือตามความลึก

- บทบาทและขอบเขตการควบคุมจะถูกเขียนลงในเมทาดาทาเซสชันตอน spawn ซึ่งช่วยป้องกันไม่ให้ session key แบบแบนหรือที่ถูกกู้คืนกลับมาได้รับสิทธิ์แบบ orchestrator โดยไม่ตั้งใจ
- **ความลึก 1 (orchestrator เมื่อ `maxSpawnDepth >= 2`):** ได้รับ `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` เพื่อให้จัดการลูกของตัวเองได้ เครื่องมือ session/system อื่น ๆ จะยังถูกปฏิเสธ
- **ความลึก 1 (leaf เมื่อ `maxSpawnDepth == 1`):** ไม่มีเครื่องมือเซสชัน (พฤติกรรมเริ่มต้นปัจจุบัน)
- **ความลึก 2 (leaf worker):** ไม่มีเครื่องมือเซสชัน — `sessions_spawn` จะถูกปฏิเสธเสมอที่ความลึก 2 ไม่สามารถ spawn ลูกต่อไปได้

### ขีดจำกัดการ Spawn รายเอเจนต์

เซสชันเอเจนต์แต่ละตัว (ที่ความลึกใดก็ได้) สามารถมีลูกที่ active ได้มากที่สุด
`maxChildrenPerAgent` (ค่าเริ่มต้น `5`) ในเวลาเดียวกัน วิธีนี้ป้องกันการ fan-out แบบหลุดการควบคุม
จาก orchestrator ตัวเดียว

### การหยุดแบบลูกโซ่

การหยุด orchestrator ระดับความลึก 1 จะหยุดลูกระดับความลึก 2 ทั้งหมดของมันโดยอัตโนมัติ:

- `/stop` ในแชตหลักจะหยุดเอเจนต์ระดับความลึก 1 ทั้งหมดและส่งผลต่อเนื่องไปยังลูกระดับความลึก 2 ของพวกมัน
- `/subagents kill <id>` จะหยุด Sub-agent ที่ระบุและส่งผลต่อเนื่องไปยังลูกของมัน
- `/subagents kill all` จะหยุด Sub-agent ทั้งหมดสำหรับผู้ร้องขอและส่งผลต่อเนื่อง

## การยืนยันตัวตน

auth ของ Sub-agent จะถูก resolve ตาม **agent id** ไม่ใช่ตามชนิดเซสชัน:

- session key ของ Sub-agent คือ `agent:<agentId>:subagent:<uuid>`
- auth store จะถูกโหลดจาก `agentDir` ของเอเจนต์นั้น
- auth profile ของเอเจนต์หลักจะถูกรวมเข้ามาเป็น **fallback**; profile ของเอเจนต์จะมีสิทธิ์เหนือ profile ของ main เมื่อมีข้อขัดแย้ง

การ merge เป็นแบบ additive ดังนั้น profile ของ main จึงพร้อมใช้งานเป็น
fallback เสมอ ปัจจุบันยังไม่รองรับ auth ที่แยกขาดอย่างสมบูรณ์ต่อเอเจนต์

## การประกาศ

Sub-agent จะรายงานกลับผ่านขั้นตอนประกาศ:

- ขั้นตอนประกาศจะรันภายในเซสชัน Sub-agent (ไม่ใช่เซสชันของผู้ร้องขอ)
- หาก Sub-agent ตอบกลับเป็น `ANNOUNCE_SKIP` แบบตรงตัว จะไม่มีการโพสต์อะไร
- หากข้อความ assistant ล่าสุดคือโทเค็นเงียบแบบตรงตัว `NO_REPLY` / `no_reply` เอาต์พุตการประกาศจะถูกระงับ แม้ว่าก่อนหน้านี้จะมีความคืบหน้าที่มองเห็นได้ก็ตาม

การส่งขึ้นอยู่กับความลึกของผู้ร้องขอ:

- เซสชันผู้ร้องขอระดับบนสุดจะใช้การเรียก `agent` ติดตามผลพร้อมการส่งภายนอก (`deliver=true`)
- เซสชัน Sub-agent ของผู้ร้องขอแบบซ้อนจะได้รับการ inject ติดตามผลภายใน (`deliver=false`) เพื่อให้ orchestrator สังเคราะห์ผลลัพธ์ของลูกภายในเซสชัน
- หากเซสชัน Sub-agent ของผู้ร้องขอแบบซ้อนหายไป OpenClaw จะ fallback ไปยังผู้ร้องขอของเซสชันนั้นเมื่อมีข้อมูล

สำหรับเซสชันผู้ร้องขอระดับบนสุด การส่งตรงในโหมดเสร็จสิ้นจะ
resolve เส้นทางบทสนทนา/เธรดที่ถูกผูกไว้และ hook override ก่อน จากนั้นจึงเติม
ฟิลด์เป้าหมายของช่องทางที่หายไปจากเส้นทางที่เก็บไว้ของเซสชันผู้ร้องขอ
วิธีนี้ช่วยให้การเสร็จสิ้นคงอยู่ในแชต/หัวข้อที่ถูกต้อง แม้ว่าแหล่งกำเนิดการเสร็จสิ้น
จะระบุเพียงช่องทางเท่านั้น

การรวมผลลัพธ์การเสร็จสิ้นของลูกจะถูกจำกัดอยู่ในขอบเขตของการรันผู้ร้องขอปัจจุบัน
เมื่อสร้างผลการเสร็จสิ้นแบบซ้อน เพื่อป้องกันไม่ให้เอาต์พุตลูกจากการรันก่อนหน้าที่ล้าสมัย
รั่วเข้าสู่การประกาศปัจจุบัน คำตอบประกาศจะคงการกำหนดเส้นทางตามเธรด/หัวข้อไว้
เมื่อมีให้ใช้งานบน adapter ของช่องทาง

### บริบทการประกาศ

บริบทการประกาศถูกทำให้เป็นมาตรฐานเป็นบล็อก event ภายในที่คงที่:

| ฟิลด์          | แหล่งที่มา                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| Source          | `subagent` หรือ `cron`                                                                                     |
| Session ids     | session key/id ของลูก                                                                                       |
| Type            | ชนิดการประกาศ + ป้ายงาน                                                                                     |
| Status          | ได้มาจากผลลัพธ์ของรันไทม์ (`success`, `error`, `timeout` หรือ `unknown`) — **ไม่ได้** อนุมานจากข้อความของโมเดล |
| Result content  | ข้อความ assistant ล่าสุดที่มองเห็นได้ หรือไม่เช่นนั้นคือข้อความ `tool/toolResult` ล่าสุดที่ผ่านการทำให้ปลอดภัย |
| Follow-up       | คำสั่งที่อธิบายว่าเมื่อใดควรตอบกลับและเมื่อใดควรเงียบ                                                    |

การรันที่ล้มเหลวแบบ terminal จะรายงานสถานะล้มเหลวโดยไม่ replay
ข้อความตอบกลับที่จับไว้ เมื่อ timeout หากลูกไปถึงเพียงขั้นตอนการเรียกเครื่องมือ การประกาศ
สามารถย่อประวัตินั้นเป็นสรุปความคืบหน้าบางส่วนแบบสั้นได้
แทนที่จะ replay เอาต์พุตเครื่องมือดิบ

### บรรทัดสถิติ

payload ของการประกาศจะมีบรรทัดสถิติอยู่ท้ายเสมอ (แม้เมื่อถูกห่อไว้):

- รันไทม์ (เช่น `runtime 5m12s`)
- การใช้โทเค็น (input/output/total)
- ต้นทุนโดยประมาณเมื่อมีการกำหนดราคาโมเดลไว้ (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` และเส้นทาง transcript เพื่อให้เอเจนต์หลักดึงประวัติผ่าน `sessions_history` หรือตรวจสอบไฟล์บนดิสก์ได้

เมทาดาทาภายในมีไว้สำหรับ orchestration เท่านั้น; คำตอบที่แสดงต่อผู้ใช้
ควรเรียบเรียงใหม่ด้วยน้ำเสียงผู้ช่วยตามปกติ

### ทำไมจึงควรใช้ `sessions_history`

`sessions_history` เป็นเส้นทาง orchestration ที่ปลอดภัยกว่า:

- การเรียกคืนฝั่ง assistant จะถูกทำให้เป็นมาตรฐานก่อน: ลบแท็ก thinking; ลบ scaffolding ของ `<relevant-memories>` / `<relevant_memories>`; ลบบล็อก payload XML ของการเรียกเครื่องมือแบบข้อความล้วน (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) รวมถึง payload ที่ถูกตัดทอนซึ่งไม่เคยปิดอย่างสมบูรณ์; ลบ scaffolding ของการเรียกเครื่องมือ/ผลลัพธ์ที่ถูกลดระดับแล้วและ marker ของ historical-context; ลบโทเค็นควบคุมโมเดลที่รั่ว (`<|assistant|>`, ASCII `<|...|>` อื่น ๆ, ฟูลวิธ `<｜...｜>`); ลบ XML การเรียกเครื่องมือของ MiniMax ที่ผิดรูปแบบ
- ข้อความที่คล้ายข้อมูลรับรอง/โทเค็นจะถูกปิดบัง
- บล็อกยาวอาจถูกตัดทอน
- ประวัติที่ใหญ่มากอาจทิ้งแถวเก่า หรือแทนที่แถวที่ใหญ่เกินด้วย `[sessions_history omitted: message too large]`
- การตรวจสอบ transcript ดิบบนดิสก์เป็น fallback เมื่อคุณต้องการ transcript แบบครบทุกไบต์

## นโยบายเครื่องมือ

Sub-agent ใช้โปรไฟล์และ pipeline ของนโยบายเครื่องมือแบบเดียวกับ parent หรือ
เอเจนต์เป้าหมายก่อน หลังจากนั้น OpenClaw จะใช้ชั้นข้อจำกัดของ Sub-agent

เมื่อไม่มี `tools.profile` ที่เข้มงวด Sub-agent จะได้ **ทุกเครื่องมือยกเว้น
เครื่องมือเซสชัน** และเครื่องมือระบบ:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` ที่นี่ยังคงเป็นมุมมอง recall ที่มีขอบเขตและผ่านการทำให้ปลอดภัยด้วย — มัน
ไม่ใช่ transcript ดิบทั้งหมด

เมื่อ `maxSpawnDepth >= 2`, Sub-agent แบบ orchestrator ที่ความลึก 1
จะได้รับ `sessions_spawn`, `subagents`, `sessions_list` และ
`sessions_history` เพิ่มเติม เพื่อให้จัดการลูกของตัวเองได้

### Override ผ่าน config

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
        // deny มีสิทธิ์เหนือกว่า
        deny: ["gateway", "cron"],
        // หากตั้ง allow จะกลายเป็น allow-only (deny ยังมีสิทธิ์เหนือกว่า)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` เป็นตัวกรอง allow-only ขั้นสุดท้าย มันสามารถจำกัด
ชุดเครื่องมือที่ resolve แล้วให้แคบลงได้ แต่ไม่สามารถ **เพิ่มคืน**
เครื่องมือที่ถูกลบออกโดย `tools.profile` ได้ ตัวอย่างเช่น `tools.profile: "coding"` รวม
`web_search`/`web_fetch` แต่ไม่รวมเครื่องมือ `browser` หากต้องการให้
Sub-agent ในโปรไฟล์ coding ใช้ automation ของเบราว์เซอร์ได้ ให้เพิ่ม browser ตั้งแต่
ขั้นตอนโปรไฟล์:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

ใช้ `agents.list[].tools.alsoAllow: ["browser"]` รายเอเจนต์ เมื่อมีเพียงเอเจนต์เดียว
ที่ควรได้ automation ของเบราว์เซอร์

## Concurrency

Sub-agent ใช้ lane คิวภายในโปรเซสโดยเฉพาะ:

- **ชื่อลีน:** `subagent`
- **Concurrency:** `agents.defaults.subagents.maxConcurrent` (ค่าเริ่มต้น `8`)

## Liveness และการกู้คืน

OpenClaw ไม่ถือว่าการไม่มี `endedAt` เป็นหลักฐานถาวรว่ายังมี
Sub-agent ที่มีชีวิตอยู่ การรันที่ยังไม่สิ้นสุดซึ่งเก่าเกินหน้าต่าง stale-run
จะหยุดถูกนับเป็น active/pending ใน `/subagents list`, สรุปสถานะ,
การกั้นการเสร็จสิ้นของ descendant และการตรวจสอบ concurrency รายเซสชัน

หลังจาก gateway รีสตาร์ต การรันที่ถูกกู้คืนมาและล้าสมัยซึ่งยังไม่สิ้นสุดจะถูก prune เว้นแต่
child session นั้นจะถูกทำเครื่องหมาย `abortedLastRun: true`
เซสชันลูกที่ถูกยกเลิกจากการรีสตาร์ตเหล่านั้นยังคงกู้คืนได้ผ่านโฟลว์กู้คืน orphan ของ Sub-agent ซึ่งจะส่งข้อความ resume แบบสังเคราะห์ก่อนล้างเครื่องหมาย aborted

<Note>
หากการ spawn Sub-agent ล้มเหลวด้วย Gateway `PAIRING_REQUIRED` /
`scope-upgrade` ให้ตรวจสอบตัวเรียก RPC ก่อนแก้ไขสถานะการจับคู่
การประสานงาน `sessions_spawn` ภายในควรเชื่อมต่อเป็น
`client.id: "gateway-client"` พร้อม `client.mode: "backend"` ผ่าน auth แบบ direct
loopback shared-token/password; เส้นทางนี้ไม่ขึ้นอยู่กับ baseline ขอบเขตของอุปกรณ์ที่จับคู่ของ CLI
ตัวเรียกระยะไกล, `deviceIdentity` แบบระบุชัด, เส้นทาง device-token แบบระบุชัด และไคลเอนต์ browser/node
ยังคงต้องได้รับการอนุมัติอุปกรณ์ตามปกติสำหรับการอัปเกรดขอบเขต
</Note>

## การหยุด

- การส่ง `/stop` ในแชตของผู้ร้องขอจะยกเลิกเซสชันของผู้ร้องขอและหยุดการรัน Sub-agent ที่ยัง active ซึ่งถูก spawn จากมัน พร้อมส่งผลต่อเนื่องไปยังลูกแบบซ้อน
- `/subagents kill <id>` จะหยุด Sub-agent ที่ระบุและส่งผลต่อเนื่องไปยังลูกของมัน

## ข้อจำกัด

- การประกาศกลับของ Sub-agent เป็นแบบ **best-effort** หาก gateway รีสตาร์ต งาน "ประกาศกลับ" ที่ค้างอยู่จะสูญหาย
- Sub-agent ยังคงใช้ทรัพยากรร่วมกันของโปรเซส gateway เดียวกัน; ให้ถือว่า `maxConcurrent` เป็นวาล์วนิรภัย
- `sessions_spawn` จะไม่บล็อกเสมอ: มันคืน `{ status: "accepted", runId, childSessionKey }` ทันที
- บริบทของ Sub-agent จะ inject เฉพาะ `AGENTS.md` + `TOOLS.md` (ไม่มี `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` หรือ `BOOTSTRAP.md`)
- ความลึกการซ้อนสูงสุดคือ 5 (`maxSpawnDepth` ช่วงค่า: 1–5) แนะนำให้ใช้ความลึก 2 สำหรับกรณีใช้งานส่วนใหญ่
- `maxChildrenPerAgent` จำกัดจำนวนลูกที่ active ต่อเซสชัน (ค่าเริ่มต้น `5`, ช่วงค่า `1–20`)

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents)
- [Agent send](/th/tools/agent-send)
- [งานเบื้องหลัง](/th/automation/tasks)
- [เครื่องมือ sandbox แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
