---
read_when:
    - คุณต้องการทำงานเบื้องหลังหรือทำงานแบบขนานผ่านเอเจนต์
    - คุณกำลังเปลี่ยนนโยบายของ sessions_spawn หรือเครื่องมือ sub-agent
    - คุณกำลังนำไปใช้หรือแก้ไขปัญหาเซสชันตัวแทนย่อยที่ผูกกับเธรด
sidebarTitle: Sub-agents
summary: สร้างการรันเอเจนต์เบื้องหลังแบบแยกอิสระที่ประกาศผลลัพธ์กลับไปยังแชตของผู้ร้องขอ
title: เอเจนต์ย่อย
x-i18n:
    generated_at: "2026-05-07T01:55:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 901311ae7766640ff6991f66a63070fddef47d79ef5385d2c1af84be34a5140e
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agents คือการรันเอเจนต์เบื้องหลังที่ถูกสร้างจากการรันเอเจนต์ที่มีอยู่
โดยจะรันในเซสชันของตัวเอง (`agent:<agentId>:subagent:<uuid>`) และ
เมื่อเสร็จแล้ว จะ**ประกาศ**ผลลัพธ์กลับไปยังช่องแชตของผู้ร้องขอ
การรัน sub-agent แต่ละครั้งจะถูกติดตามเป็น
[งานเบื้องหลัง](/th/automation/tasks)

สำหรับโมเดลความปลอดภัยเบื้องหลังการมอบหมายงาน โปรดดู
[ขอบเขตของ multi-agent และ sub-agent](/th/gateway/security#multi-agent-and-sub-agent-boundaries)
Sub-agents เป็นหน่วยการแยกการทำงานและเวิร์กโฟลว์ที่มีประโยชน์ แต่ไม่ใช่ขอบเขตการอนุญาตแบบ
multi-tenant ที่เป็นปรปักษ์ภายใน Gateway ที่ใช้ร่วมกันหนึ่งตัว

เป้าหมายหลัก:

- ทำให้งาน "วิจัย / งานยาว / เครื่องมือช้า" ทำงานแบบขนานได้โดยไม่บล็อกการรันหลัก
- แยก sub-agents ตามค่าเริ่มต้น (การแยกเซสชัน + การ sandbox แบบเลือกได้)
- ทำให้พื้นผิวเครื่องมือถูกใช้งานผิดได้ยาก: sub-agents จะ**ไม่ได้**รับเครื่องมือเซสชันตามค่าเริ่มต้น
- รองรับความลึกของการซ้อนที่กำหนดค่าได้สำหรับรูปแบบ orchestrator

<Note>
**หมายเหตุเรื่องต้นทุน:** sub-agent แต่ละตัวมีบริบทและการใช้โทเค็นของตัวเองตามค่าเริ่มต้น สำหรับงานหนักหรืองานที่ทำซ้ำ ให้ตั้งค่าโมเดลที่ถูกกว่าสำหรับ sub-agents และคงเอเจนต์หลักไว้บนโมเดลคุณภาพสูงกว่า กำหนดค่าผ่าน `agents.defaults.subagents.model` หรือการ override รายเอเจนต์ เมื่อ child ต้องใช้ transcript ปัจจุบันของผู้ร้องขอจริงๆ เอเจนต์สามารถร้องขอ `context: "fork"` สำหรับการ spawn ครั้งนั้นได้ เซสชัน subagent ที่ผูกกับเธรดมีค่าเริ่มต้นเป็น `context: "fork"` เพราะจะแตกแขนงการสนทนาปัจจุบันไปยังเธรดติดตามผล
</Note>

## คำสั่ง Slash

ใช้ `/subagents` เพื่อตรวจสอบหรือควบคุมการรัน sub-agent สำหรับ**เซสชันปัจจุบัน**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

ใช้ [`/steer <message>`](/th/tools/steer) ระดับบนสุดเพื่อ steer การรันที่ active ของเซสชันผู้ร้องขอปัจจุบัน ใช้ `/subagents steer <id|#> <message>` เมื่อเป้าหมายเป็นการรัน child

`/subagents info` แสดง metadata ของการรัน (สถานะ, timestamp, session id,
transcript path, cleanup) ใช้ `sessions_history` สำหรับมุมมอง recall ที่จำกัดขอบเขตและกรองด้านความปลอดภัยแล้ว ตรวจสอบ transcript path บนดิสก์เมื่อคุณต้องใช้ transcript ฉบับเต็มแบบดิบ

### การควบคุมการผูกเธรด

คำสั่งเหล่านี้ทำงานบนช่องที่รองรับการผูกเธรดแบบถาวร
ดู [ช่องที่รองรับเธรด](#thread-supporting-channels) ด้านล่าง

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### พฤติกรรมการ Spawn

`/subagents spawn` เริ่ม sub-agent เบื้องหลังเป็นคำสั่งของผู้ใช้ (ไม่ใช่ relay ภายใน) และส่งการอัปเดตการเสร็จสิ้นครั้งสุดท้ายกลับไปยังแชตของผู้ร้องขอเมื่อการรันเสร็จสิ้น

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - คำสั่ง spawn ไม่บล็อก และจะคืน run id ทันที
    - เมื่อเสร็จสิ้น sub-agent จะประกาศข้อความสรุป/ผลลัพธ์กลับไปยังช่องแชตของผู้ร้องขอ
    - การเสร็จสิ้นเป็นแบบ push-based เมื่อ spawn แล้ว อย่า poll `/subagents list`, `sessions_list` หรือ `sessions_history` เป็น loop เพียงเพื่อรอให้เสร็จ ตรวจสอบสถานะเฉพาะเมื่อจำเป็นสำหรับการ debug หรือ intervention เท่านั้น
    - เมื่อเสร็จสิ้น OpenClaw จะพยายามปิดแท็บเบราว์เซอร์/โปรเซสที่ติดตามไว้ซึ่งเปิดโดยเซสชัน sub-agent นั้น ก่อนที่ flow การ cleanup ของการประกาศจะดำเนินต่อ

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw จะลองส่งตรงแบบ `agent` ก่อนด้วย idempotency key ที่เสถียร
    - หาก turn การเสร็จสิ้นของ requester-agent ล้มเหลว ไม่สร้างเอาต์พุตที่มองเห็นได้ หรือคืน prefix ที่ไม่สมบูรณ์อย่างชัดเจนของผลลัพธ์ child ที่จับไว้ OpenClaw จะ fallback ไปส่งการเสร็จสิ้นโดยตรงจากผลลัพธ์ child ที่จับไว้
    - หากใช้การส่งตรงไม่ได้ จะ fallback ไปยังการ routing ผ่านคิว
    - หากยังไม่มีการ routing ผ่านคิว การประกาศจะถูก retry ด้วย exponential backoff สั้นๆ ก่อนยอมแพ้ในขั้นสุดท้าย
    - การส่งการเสร็จสิ้นจะรักษาเส้นทางผู้ร้องขอที่ resolve แล้ว: เส้นทางการเสร็จสิ้นที่ผูกกับเธรดหรือผูกกับการสนทนาจะชนะเมื่อมีให้ใช้ หากต้นทางการเสร็จสิ้นให้มาเพียงช่อง OpenClaw จะเติม target/account ที่ขาดจากเส้นทางที่ resolve แล้วของเซสชันผู้ร้องขอ (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งตรงยังทำงานได้

  </Accordion>
  <Accordion title="Completion handoff metadata">
    การ handoff การเสร็จสิ้นไปยังเซสชันผู้ร้องขอคือบริบทภายในที่ runtime สร้างขึ้น
    (ไม่ใช่ข้อความที่ผู้ใช้เขียน) และประกอบด้วย:

    - `Result` — ข้อความ reply ของ `assistant` ล่าสุดที่มองเห็นได้ มิฉะนั้นเป็นข้อความ tool/toolResult ล่าสุดที่ sanitize แล้ว การรันที่ล้มเหลวแบบสิ้นสุดจะไม่นำข้อความ reply ที่จับไว้มาใช้ซ้ำ
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`
    - สถิติ runtime/token แบบกะทัดรัด
    - คำสั่งการส่งมอบที่บอก requester agent ให้เขียนใหม่ด้วยเสียง assistant ปกติ (ไม่ส่งต่อ metadata ภายในแบบดิบ)

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` และ `--thinking` จะแทนที่ค่าเริ่มต้นสำหรับการรันนั้นโดยเฉพาะ
    - ใช้ `info`/`log` เพื่อตรวจสอบรายละเอียดและเอาต์พุตหลังจากเสร็จสิ้น
    - `/subagents spawn` เป็นโหมดแบบทำครั้งเดียว (`mode: "run"`) สำหรับเซสชันแบบถาวรที่ผูกกับเธรด ให้ใช้ `sessions_spawn` พร้อม `thread: true` และ `mode: "session"`
    - สำหรับเซสชันฮาร์เนส ACP (Claude Code, Gemini CLI, OpenCode หรือ Codex ACP/acpx ที่ระบุชัดเจน) ให้ใช้ `sessions_spawn` พร้อม `runtime: "acp"` เมื่อเครื่องมือประกาศว่ารองรับรันไทม์นั้น ดู [โมเดลการส่งมอบ ACP](/th/tools/acp-agents#delivery-model) เมื่อดีบักการทำให้เสร็จสมบูรณ์หรือลูประหว่างเอเจนต์ เมื่อเปิดใช้ plugin `codex` แล้ว การควบคุมแชต/เธรดของ Codex ควรเลือกใช้ `/codex ...` แทน ACP เว้นแต่ผู้ใช้จะขอ ACP/acpx อย่างชัดเจน
    - OpenClaw จะซ่อน `runtime: "acp"` จนกว่า ACP จะเปิดใช้แล้ว ผู้ร้องขอไม่ได้อยู่ใน sandbox และโหลด backend plugin เช่น `acpx` แล้ว `runtime: "acp"` คาดว่าจะได้รับไอดีฮาร์เนส ACP ภายนอก หรือรายการ `agents.list[]` ที่มี `runtime.type="acp"`; ใช้รันไทม์เอเจนต์ย่อยเริ่มต้นสำหรับเอเจนต์ config ของ OpenClaw ปกติจาก `agents_list`

  </Accordion>
</AccordionGroup>

## โหมดบริบท

เอเจนต์ย่อยแบบเนทีฟจะเริ่มแบบแยกโดดเดี่ยว เว้นแต่ผู้เรียกจะขอแยกกิ่ง
ทรานสคริปต์ปัจจุบันอย่างชัดเจน

| โหมด       | ควรใช้เมื่อใด                                                                                                                         | พฤติกรรม                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | งานค้นคว้าใหม่ การติดตั้งใช้งานแบบอิสระ งานเครื่องมือที่ช้า หรือสิ่งใดก็ตามที่สามารถสรุปในข้อความงานได้อย่างกระชับ                           | สร้างทรานสคริปต์ย่อยที่สะอาด นี่คือค่าเริ่มต้นและช่วยลดการใช้โทเค็น  |
| `fork`     | งานที่ขึ้นกับการสนทนาปัจจุบัน ผลลัพธ์จากเครื่องมือก่อนหน้า หรือคำสั่งที่ละเอียดอ่อนซึ่งมีอยู่แล้วในทรานสคริปต์ของผู้ร้องขอ | แยกกิ่งทรานสคริปต์ของผู้ร้องขอเข้าไปยังเซสชันย่อยก่อนที่เซสชันย่อยจะเริ่ม |

ใช้ `fork` อย่างประหยัด มีไว้สำหรับการมอบหมายงานที่ไวต่อบริบท ไม่ใช่
สิ่งทดแทนการเขียนพรอมป์งานที่ชัดเจน

## เครื่องมือ: `sessions_spawn`

เริ่มการรันเอเจนต์ย่อยด้วย `deliver: false` บนเลน `subagent` ส่วนกลาง
จากนั้นรันขั้นตอนประกาศและโพสต์คำตอบประกาศไปยังช่องแชตของผู้ร้องขอ

ความพร้อมใช้งานขึ้นกับนโยบายเครื่องมือที่มีผลของผู้เรียก โปรไฟล์ `coding` และ
`full` เปิดเผย `sessions_spawn` ตามค่าเริ่มต้น โปรไฟล์ `messaging`
ไม่เปิดเผย; เพิ่ม `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` หรือใช้ `tools.profile: "coding"` สำหรับเอเจนต์ที่ควรมอบหมาย
งาน นโยบายอนุญาต/ปฏิเสธตามช่อง/กลุ่ม ผู้ให้บริการ sandbox และต่อเอเจนต์
ยังสามารถนำเครื่องมือออกหลังขั้นตอนโปรไฟล์ได้ ใช้ `/tools` จากเซสชันเดียวกัน
เพื่อยืนยันรายการเครื่องมือที่มีผล

**ค่าเริ่มต้น:**

- **โมเดล:** สืบทอดจากผู้เรียก เว้นแต่คุณตั้งค่า `agents.defaults.subagents.model` (หรือ `agents.list[].subagents.model` ต่อเอเจนต์); `sessions_spawn.model` ที่ระบุชัดเจนยังคงชนะ
- **Thinking:** สืบทอดจากผู้เรียก เว้นแต่คุณตั้งค่า `agents.defaults.subagents.thinking` (หรือ `agents.list[].subagents.thinking` ต่อเอเจนต์); `sessions_spawn.thinking` ที่ระบุชัดเจนยังคงชนะ
- **หมดเวลาการรัน:** หากละ `sessions_spawn.runTimeoutSeconds` ไว้ OpenClaw จะใช้ `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งค่าไว้; มิฉะนั้นจะย้อนกลับไปใช้ `0` (ไม่มีการหมดเวลา)

### พารามิเตอร์เครื่องมือ

<ParamField path="task" type="string" required>
  คำอธิบายงานสำหรับเอเจนต์ย่อย
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับที่มนุษย์อ่านได้ ซึ่งไม่บังคับ
</ParamField>
<ParamField path="agentId" type="string">
  สร้างภายใต้ไอดีเอเจนต์อื่นเมื่อ `subagents.allowAgents` อนุญาต
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ใช้เฉพาะสำหรับฮาร์เนส ACP ภายนอก (`claude`, `droid`, `gemini`, `opencode` หรือ Codex ACP/acpx ที่ขออย่างชัดเจน) และสำหรับรายการ `agents.list[]` ที่ `runtime.type` เป็น `acp`
</ParamField>
<ParamField path="resumeSessionId" type="string">
  เฉพาะ ACP กลับมาทำงานต่อในเซสชันฮาร์เนส ACP ที่มีอยู่เมื่อ `runtime: "acp"`; จะถูกละเลยสำหรับการสร้างเอเจนต์ย่อยแบบเนทีฟ
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  เฉพาะ ACP สตรีมเอาต์พุตการรัน ACP ไปยังเซสชันแม่เมื่อ `runtime: "acp"`; ละไว้สำหรับการสร้างเอเจนต์ย่อยแบบเนทีฟ
</ParamField>
<ParamField path="model" type="string">
  แทนที่โมเดลของเอเจนต์ย่อย ค่าที่ไม่ถูกต้องจะถูกข้าม และเอเจนต์ย่อยจะรันบนโมเดลเริ่มต้นพร้อมคำเตือนในผลลัพธ์ของเครื่องมือ
</ParamField>
<ParamField path="thinking" type="string">
  แทนที่ระดับ thinking สำหรับการรันเอเจนต์ย่อย
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ค่าเริ่มต้นเป็น `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งค่าไว้ มิฉะนั้นเป็น `0` เมื่อตั้งค่าไว้ การรันเอเจนต์ย่อยจะถูกยกเลิกหลังจาก N วินาที
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  เมื่อเป็น `true` จะร้องขอการผูกเธรดของช่องสำหรับเซสชันเอเจนต์ย่อยนี้
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  หาก `thread: true` และละ `mode` ไว้ ค่าเริ่มต้นจะกลายเป็น `session` `mode: "session"` ต้องใช้ `thread: true`
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` จะเก็บถาวรทันทีหลังจากประกาศ (ยังคงเก็บทรานสคริปต์ผ่านการเปลี่ยนชื่อ)
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` จะปฏิเสธการสร้าง เว้นแต่รันไทม์ย่อยเป้าหมายจะอยู่ใน sandbox
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` แยกกิ่งทรานสคริปต์ปัจจุบันของผู้ร้องขอเข้าไปยังเซสชันย่อย เฉพาะเอเจนต์ย่อยแบบเนทีฟเท่านั้น การสร้างที่ผูกกับเธรดจะใช้ค่าเริ่มต้นเป็น `fork`; การสร้างที่ไม่ใช่เธรดจะใช้ค่าเริ่มต้นเป็น `isolated`
</ParamField>

<Warning>
`sessions_spawn` **ไม่** รับพารามิเตอร์การส่งมอบผ่านช่อง (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) สำหรับการส่งมอบ ให้ใช้
`message`/`sessions_send` จากการรันที่ถูกสร้างขึ้น
</Warning>

## เซสชันที่ผูกกับเธรด

เมื่อเปิดใช้การผูกเธรดสำหรับช่อง เอเจนต์ย่อยสามารถคงการผูกกับ
เธรดไว้ เพื่อให้ข้อความผู้ใช้ที่ตามมาในเธรดนั้นยังคงถูกส่งไปยัง
เซสชันเอเจนต์ย่อยเดียวกัน

### ช่องที่รองรับเธรด

**Discord** เป็นช่องเดียวที่รองรับในขณะนี้ รองรับ
เซสชันเอเจนต์ย่อยแบบถาวรที่ผูกกับเธรด (`sessions_spawn` พร้อม
`thread: true`), การควบคุมเธรดด้วยตนเอง (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) และคีย์อะแดปเตอร์
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` และ
`channels.discord.threadBindings.spawnSessions`

### ขั้นตอนด่วน

<Steps>
  <Step title="สร้าง">
    `sessions_spawn` พร้อม `thread: true` (และอาจมี `mode: "session"`).
  </Step>
  <Step title="ผูก">
    OpenClaw สร้างหรือผูกเธรดเข้ากับเป้าหมายเซสชันนั้นในช่องทางที่ใช้งานอยู่
  </Step>
  <Step title="กำหนดเส้นทางข้อความติดตาม">
    การตอบกลับและข้อความติดตามในเธรดนั้นจะถูกกำหนดเส้นทางไปยังเซสชันที่ผูกไว้
  </Step>
  <Step title="ตรวจสอบการหมดเวลา">
    ใช้ `/session idle` เพื่อตรวจสอบ/อัปเดตการยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งาน และ
    `/session max-age` เพื่อควบคุมเพดานเวลาสูงสุดแบบบังคับ
  </Step>
  <Step title="แยกออก">
    ใช้ `/unfocus` เพื่อแยกออกด้วยตนเอง
  </Step>
</Steps>

### การควบคุมด้วยตนเอง

| คำสั่ง             | ผลลัพธ์                                                              |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | ผูกเธรดปัจจุบัน (หรือสร้างเธรดใหม่) เข้ากับเป้าหมาย sub-agent/เซสชัน |
| `/unfocus`         | ลบการผูกสำหรับเธรดปัจจุบันที่ผูกไว้                                  |
| `/agents`          | แสดงรายการรันที่ใช้งานอยู่และสถานะการผูก (`thread:<id>` หรือ `unbound`) |
| `/session idle`    | ตรวจสอบ/อัปเดตการยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งาน (เฉพาะเธรดที่ผูกและถูกโฟกัสอยู่) |
| `/session max-age` | ตรวจสอบ/อัปเดตเพดานเวลาสูงสุดแบบบังคับ (เฉพาะเธรดที่ผูกและถูกโฟกัสอยู่) |

### สวิตช์การกำหนดค่า

- **ค่าเริ่มต้นส่วนกลาง:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **คีย์สำหรับการแทนที่ตามช่องทางและการผูกอัตโนมัติเมื่อ spawn** เป็นแบบเฉพาะ adapter ดู [ช่องทางที่รองรับเธรด](#thread-supporting-channels) ด้านบน

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) และ
[คำสั่ง Slash](/th/tools/slash-commands) สำหรับรายละเอียด adapter ปัจจุบัน

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  รายการ agent id ที่สามารถกำหนดเป็นเป้าหมายผ่าน `agentId` แบบระบุชัดเจน (`["*"]` อนุญาตได้ทุกตัว) ค่าเริ่มต้น: เฉพาะ agent ผู้ร้องขอเท่านั้น หากคุณตั้งค่ารายการและยังต้องการให้ผู้ร้องขอ spawn ตัวเองด้วย `agentId` ให้ใส่ id ของผู้ร้องขอไว้ในรายการด้วย
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  allowlist ของ agent เป้าหมายค่าเริ่มต้นที่ใช้เมื่อ agent ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  บล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน) การแทนที่ราย agent: `agents.list[].subagents.requireAgentId`
</ParamField>

หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมาย
ที่จะรันแบบไม่อยู่ใน sandbox

### การค้นพบ

ใช้ `agents_list` เพื่อดูว่า agent id ใดได้รับอนุญาตสำหรับ
`sessions_spawn` อยู่ในปัจจุบัน คำตอบจะรวม model ที่มีผลจริงของ agent แต่ละตัวที่ระบุไว้
และ metadata runtime ที่ฝังมา เพื่อให้ผู้เรียกสามารถแยกแยะ PI, app-server ของ Codex
และ runtime native อื่นๆ ที่กำหนดค่าไว้ได้

### การเก็บถาวรอัตโนมัติ

- เซสชัน sub-agent จะถูกเก็บถาวรโดยอัตโนมัติหลังจาก `agents.defaults.subagents.archiveAfterMinutes` (ค่าเริ่มต้น `60`)
- การเก็บถาวรใช้ `sessions.delete` และเปลี่ยนชื่อ transcript เป็น `*.deleted.<timestamp>` (โฟลเดอร์เดิม)
- `cleanup: "delete"` จะเก็บถาวรทันทีหลัง announce (ยังคงเก็บ transcript ไว้ผ่านการเปลี่ยนชื่อ)
- การเก็บถาวรอัตโนมัติเป็นแบบ best-effort; ตัวจับเวลาที่ค้างอยู่จะสูญหายหาก gateway รีสตาร์ท
- `runTimeoutSeconds` **ไม่** เก็บถาวรอัตโนมัติ; มันหยุดเฉพาะการรัน เซสชันจะยังคงอยู่จนกว่าจะถูกเก็บถาวรอัตโนมัติ
- การเก็บถาวรอัตโนมัติใช้กับเซสชัน depth-1 และ depth-2 เท่าๆ กัน
- การล้างข้อมูลเบราว์เซอร์แยกจากการล้างข้อมูล archive: แท็บ/โปรเซสเบราว์เซอร์ที่ติดตามไว้จะถูกปิดแบบ best-effort เมื่อการรันเสร็จ แม้ว่าจะยังเก็บระเบียน transcript/เซสชันไว้ก็ตาม

## sub-agent แบบซ้อน

ตามค่าเริ่มต้น sub-agent ไม่สามารถ spawn sub-agent ของตัวเองได้
(`maxSpawnDepth: 1`) ตั้งค่า `maxSpawnDepth: 2` เพื่อเปิดใช้การซ้อนได้หนึ่งระดับ
ซึ่งคือ **รูปแบบ orchestrator**: main → orchestrator sub-agent →
worker sub-sub-agents

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### ระดับความลึก

| ความลึก | รูปแบบคีย์เซสชัน                            | บทบาท                                        | Spawn ได้หรือไม่              |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | agent หลัก                                    | เสมอ                         |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrator เมื่ออนุญาต depth 2) | เฉพาะเมื่อ `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (leaf worker)                   | ไม่ได้เลย                    |

### ห่วงโซ่ announce

ผลลัพธ์ไหลย้อนขึ้นไปตามห่วงโซ่:

1. worker depth-2 เสร็จ → announce ไปยัง parent ของมัน (orchestrator depth-1)
2. orchestrator depth-1 ได้รับ announce, สังเคราะห์ผลลัพธ์, เสร็จ → announce ไปยัง main
3. agent หลักได้รับ announce และส่งต่อให้ผู้ใช้

แต่ละระดับจะเห็นเฉพาะ announce จาก child โดยตรงของตัวเองเท่านั้น

<Note>
**คำแนะนำด้านปฏิบัติการ:** เริ่มงาน child ครั้งเดียวและรอ event การเสร็จสิ้น
แทนการสร้างลูป polling รอบ `sessions_list`,
`sessions_history`, `/subagents list`, หรือคำสั่ง sleep ของ `exec`
`sessions_list` และ `/subagents list` จะรักษาความสัมพันธ์ของ child-session
ให้โฟกัสกับงานสด โดย child ที่ยังทำงานอยู่จะยังแนบไว้, child ที่สิ้นสุดแล้วจะยัง
มองเห็นได้ช่วงสั้นๆ ในหน้าต่างล่าสุด, และลิงก์ child แบบมีเฉพาะใน store ที่เก่าแล้วจะถูก
ละเว้นหลังพ้นหน้าต่าง freshness วิธีนี้ป้องกันไม่ให้ metadata `spawnedBy` /
`parentSessionKey` เก่าฟื้น child ที่ไม่มีอยู่จริงหลัง
รีสตาร์ท หาก event การเสร็จสิ้นของ child มาถึงหลังจากคุณส่ง
คำตอบสุดท้ายไปแล้ว follow-up ที่ถูกต้องคือ token เงียบที่ตรงเป๊ะ
`NO_REPLY` / `no_reply`
</Note>

### นโยบายเครื่องมือตามความลึก

- บทบาทและขอบเขตการควบคุมจะถูกเขียนลงใน metadata ของเซสชันตอน spawn วิธีนี้ป้องกันไม่ให้คีย์เซสชันแบบ flat หรือที่กู้คืนมาได้สิทธิ์ orchestrator กลับมาโดยไม่ตั้งใจ
- **Depth 1 (orchestrator, เมื่อ `maxSpawnDepth >= 2`):** ได้รับ `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` เพื่อให้จัดการ child ของตัวเองได้ เครื่องมือ session/system อื่นยังถูกปฏิเสธ
- **Depth 1 (leaf, เมื่อ `maxSpawnDepth == 1`):** ไม่มีเครื่องมือเซสชัน (พฤติกรรมค่าเริ่มต้นปัจจุบัน)
- **Depth 2 (leaf worker):** ไม่มีเครื่องมือเซสชัน — `sessions_spawn` ถูกปฏิเสธเสมอที่ depth 2 ไม่สามารถ spawn child ต่อได้

### ขีดจำกัดการ spawn ราย agent

แต่ละเซสชัน agent (ที่ความลึกใดก็ได้) สามารถมี child ที่ใช้งานอยู่ได้สูงสุด `maxChildrenPerAgent`
(ค่าเริ่มต้น `5`) ในเวลาเดียวกัน วิธีนี้ป้องกัน fan-out ที่ควบคุมไม่ได้
จาก orchestrator เดียว

### การหยุดแบบ cascade

การหยุด orchestrator depth-1 จะหยุด child depth-2 ทั้งหมดของมันโดยอัตโนมัติ:

- `/stop` ในแชทหลักหยุด agent depth-1 ทั้งหมดและ cascade ไปยัง child depth-2 ของพวกมัน
- `/subagents kill <id>` หยุด sub-agent ที่ระบุและ cascade ไปยัง child ของมัน
- `/subagents kill all` หยุด sub-agent ทั้งหมดสำหรับผู้ร้องขอและ cascade

## การยืนยันตัวตน

auth ของ sub-agent ถูก resolve ตาม **agent id** ไม่ใช่ตามประเภทเซสชัน:

- คีย์เซสชัน sub-agent คือ `agent:<agentId>:subagent:<uuid>`
- auth store ถูกโหลดจาก `agentDir` ของ agent นั้น
- โปรไฟล์ auth ของ agent หลักถูกผสานเข้ามาเป็น **fallback**; โปรไฟล์ของ agent จะแทนที่โปรไฟล์หลักเมื่อเกิดข้อขัดแย้ง

การผสานเป็นแบบเพิ่มเข้าไป ดังนั้นโปรไฟล์หลักจึงพร้อมใช้งานเป็น
fallback เสมอ auth ที่แยกโดดเดี่ยวเต็มรูปแบบราย agent ยังไม่รองรับ

## Announce

Sub-agent รายงานกลับผ่านขั้นตอน announce:

- ขั้นตอน announce รันภายในเซสชัน sub-agent (ไม่ใช่เซสชันผู้ร้องขอ)
- หาก sub-agent ตอบกลับตรงเป๊ะว่า `ANNOUNCE_SKIP` จะไม่มีอะไรถูกโพสต์
- หากข้อความ assistant ล่าสุดเป็น token เงียบที่ตรงเป๊ะ `NO_REPLY` / `no_reply` เอาต์พุต announce จะถูกระงับ แม้ว่าก่อนหน้านั้นจะมีความคืบหน้าที่มองเห็นได้ก็ตาม

การส่งขึ้นอยู่กับความลึกของผู้ร้องขอ:

- เซสชันผู้ร้องขอระดับบนสุดใช้การเรียก follow-up `agent` พร้อมการส่งภายนอก (`deliver=true`)
- เซสชัน requester subagent แบบซ้อนจะได้รับการฉีด follow-up ภายใน (`deliver=false`) เพื่อให้ orchestrator สังเคราะห์ผลลัพธ์ของ child ภายในเซสชันได้
- หากเซสชัน requester subagent แบบซ้อนหายไป OpenClaw จะ fallback ไปยัง requester ของเซสชันนั้นเมื่อมีให้ใช้

สำหรับเซสชันผู้ร้องขอระดับบนสุด การส่งโดยตรงแบบ completion-mode จะ
resolve เส้นทาง conversation/thread ที่ผูกไว้และการแทนที่ hook ก่อน จากนั้นจึงเติม
ฟิลด์ channel-target ที่ขาดหายจากเส้นทางที่เก็บไว้ของเซสชันผู้ร้องขอ
วิธีนี้ทำให้ completion อยู่ใน chat/topic ที่ถูกต้องแม้ว่า origin ของ completion
จะระบุเฉพาะช่องทางเท่านั้น

การรวม completion ของ child ถูกจำกัดขอบเขตไว้ที่การรันของผู้ร้องขอปัจจุบันเมื่อ
สร้าง finding ของ nested completion เพื่อป้องกันไม่ให้เอาต์พุต child จากรันก่อนหน้าที่เก่าแล้ว
รั่วเข้ามาใน announce ปัจจุบัน การตอบกลับ announce จะคง
การกำหนดเส้นทาง thread/topic ไว้เมื่อ channel adapter มีให้ใช้

### บริบท announce

บริบท announce ถูกทำให้เป็น event block ภายในที่เสถียร:

| ฟิลด์          | แหล่งที่มา                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| แหล่งที่มา     | `subagent` หรือ `cron`                                                                                          |
| Session ids    | คีย์/id เซสชัน child                                                                                          |
| ประเภท         | ประเภท announce + ป้ายกำกับงาน                                                                                 |
| สถานะ          | ได้มาจากผลลัพธ์ runtime (`success`, `error`, `timeout`, หรือ `unknown`) — **ไม่ได้** อนุมานจากข้อความ model |
| เนื้อหาผลลัพธ์ | ข้อความ assistant ล่าสุดที่มองเห็นได้ มิฉะนั้นเป็นข้อความ tool/toolResult ล่าสุดที่ผ่านการทำให้ปลอดภัยแล้ว    |
| Follow-up      | คำแนะนำที่อธิบายว่าเมื่อใดควรตอบกลับเทียบกับเงียบไว้                                                        |

รันที่ล้มเหลวแบบ terminal จะรายงานสถานะ failure โดยไม่เล่นซ้ำ
ข้อความตอบกลับที่จับไว้ เมื่อ timeout หาก child ไปได้เพียงผ่านการเรียก tool เท่านั้น announce
สามารถยุบ history นั้นเป็นสรุปความคืบหน้าบางส่วนสั้นๆ แทน
การเล่นซ้ำเอาต์พุต tool ดิบ

### บรรทัดสถิติ

payload ของ announce มีบรรทัดสถิติอยู่ท้ายสุด (แม้เมื่อถูก wrap):

- Runtime (เช่น `runtime 5m12s`)
- การใช้ token (input/output/total)
- ค่าใช้จ่ายโดยประมาณเมื่อมีการกำหนดราคา model (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, และเส้นทาง transcript เพื่อให้ agent หลักสามารถดึง history ผ่าน `sessions_history` หรือตรวจสอบไฟล์บนดิสก์ได้

metadata ภายในมีไว้สำหรับ orchestration เท่านั้น; การตอบกลับที่แสดงต่อผู้ใช้
ควรเขียนใหม่ด้วยน้ำเสียง assistant ปกติ

### ทำไมจึงควรใช้ `sessions_history`

`sessions_history` เป็นเส้นทาง orchestration ที่ปลอดภัยกว่า:

- การเรียกคืนของ assistant ถูก normalize ก่อน: ตัด thinking tags; ตัด scaffolding `<relevant-memories>` / `<relevant_memories>`; ตัดบล็อก payload XML ของ tool-call แบบข้อความล้วน (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) รวมถึง payload ที่ถูกตัดและไม่เคยปิดอย่างสมบูรณ์; ตัด scaffolding ของ tool-call/result ที่ถูก downgrade และ marker historical-context; ตัด token ควบคุม model ที่รั่ว (`<|assistant|>`, ASCII อื่นๆ แบบ `<|...|>`, full-width `<｜...｜>`); ตัด XML tool-call ของ MiniMax ที่ผิดรูป
- ข้อความที่คล้าย credential/token จะถูก redact
- บล็อกยาวๆ สามารถถูกตัดให้สั้นลง
- history ที่ใหญ่มากสามารถทิ้งแถวเก่ากว่า หรือแทนที่แถวที่ใหญ่เกินด้วย `[sessions_history omitted: message too large]`
- การตรวจสอบ transcript ดิบบนดิสก์เป็น fallback เมื่อคุณต้องการ transcript แบบครบทุก byte ตรงตามต้นฉบับ

## นโยบายเครื่องมือ

เอเจนต์ย่อยใช้โปรไฟล์และไปป์ไลน์นโยบายเครื่องมือเดียวกับเอเจนต์หลักหรือ
เอเจนต์เป้าหมายก่อน หลังจากนั้น OpenClaw จะใช้ชั้นข้อจำกัดของเอเจนต์ย่อย

เมื่อไม่มี `tools.profile` ที่จำกัด เอเจนต์ย่อยจะได้รับ **เครื่องมือทั้งหมด ยกเว้น
เครื่องมือเซสชัน** และเครื่องมือระบบ:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` ยังคงเป็นมุมมองการเรียกคืนข้อมูลที่มีขอบเขตและผ่านการทำให้ปลอดภัยที่นี่ด้วย —
ไม่ใช่การดัมพ์ทรานสคริปต์ดิบ

เมื่อ `maxSpawnDepth >= 2` เอเจนต์ย่อยตัวประสานงานที่ระดับความลึก 1 จะได้รับ
`sessions_spawn`, `subagents`, `sessions_list` และ
`sessions_history` เพิ่มเติม เพื่อให้จัดการลูกของตนได้

### แทนที่ผ่านการกำหนดค่า

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` เป็นตัวกรองแบบอนุญาตเท่านั้นขั้นสุดท้าย มันสามารถจำกัด
ชุดเครื่องมือที่แก้ไขแล้วให้แคบลงได้ แต่ไม่สามารถ **เพิ่มกลับ** เครื่องมือที่ถูกลบออก
โดย `tools.profile` ได้ ตัวอย่างเช่น `tools.profile: "coding"` รวม
`web_search`/`web_fetch` แต่ไม่รวมเครื่องมือ `browser` หากต้องการให้
เอเจนต์ย่อยโปรไฟล์ coding ใช้ระบบอัตโนมัติของเบราว์เซอร์ ให้เพิ่ม browser ที่
ขั้นโปรไฟล์:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

ใช้ `agents.list[].tools.alsoAllow: ["browser"]` แบบรายเอเจนต์เมื่อมีเพียง
เอเจนต์เดียวที่ควรได้รับระบบอัตโนมัติของเบราว์เซอร์

## ภาวะพร้อมกัน

เอเจนต์ย่อยใช้เลนคิวเฉพาะภายในกระบวนการ:

- **ชื่อเลน:** `subagent`
- **ภาวะพร้อมกัน:** `agents.defaults.subagents.maxConcurrent` (ค่าเริ่มต้น `8`)

## ความมีชีวิตและการกู้คืน

OpenClaw ไม่ถือว่าการไม่มี `endedAt` เป็นหลักฐานถาวรว่า
เอเจนต์ย่อยยังมีชีวิตอยู่ การรันที่ยังไม่สิ้นสุดซึ่งเก่ากว่าหน้าต่างการรันค้าง
จะหยุดถูกนับเป็น active/pending ใน `/subagents list`, สรุปสถานะ,
การกั้นการเสร็จสิ้นของลูกหลาน และการตรวจสอบภาวะพร้อมกันแบบรายเซสชัน

หลังจากรีสตาร์ต Gateway การรันที่กู้คืนมาและยังไม่สิ้นสุดซึ่งค้างจะถูกตัดทิ้ง เว้นแต่
เซสชันลูกจะถูกทำเครื่องหมาย `abortedLastRun: true` เซสชันลูกที่ถูกยกเลิกจากการรีสตาร์ตเหล่านั้น
ยังคงกู้คืนได้ผ่านโฟลว์กู้คืนเอเจนต์ย่อยกำพร้า ซึ่งจะส่งข้อความ resume สังเคราะห์ก่อน
ล้างเครื่องหมาย aborted

การกู้คืนอัตโนมัติหลังรีสตาร์ตถูกจำกัดแบบรายเซสชันลูก หากลูกของ
เอเจนต์ย่อยเดียวกันถูกยอมรับให้กู้คืนแบบกำพร้าซ้ำๆ ภายใน
หน้าต่าง rapid re-wedge OpenClaw จะคง tombstone การกู้คืนไว้ใน
เซสชันนั้น และหยุด auto-resume เซสชันนั้นในการรีสตาร์ตครั้งถัดไป รัน
`openclaw tasks maintenance --apply` เพื่อปรับระเบียนงานให้ตรงกัน หรือ
`openclaw doctor --fix` เพื่อล้างแฟล็กการกู้คืน aborted ที่ค้างอยู่บน
เซสชันที่มี tombstone

<Note>
หากการ spawn เอเจนต์ย่อยล้มเหลวด้วย Gateway `PAIRING_REQUIRED` /
`scope-upgrade` ให้ตรวจสอบผู้เรียก RPC ก่อนแก้ไขสถานะการจับคู่
การประสานงาน `sessions_spawn` ภายในควรเชื่อมต่อเป็น
`client.id: "gateway-client"` พร้อม `client.mode: "backend"` ผ่าน
การยืนยันตัวตนด้วย shared-token/password ทาง direct
local loopback เส้นทางนั้นไม่ขึ้นกับฐานขอบเขต paired-device ของ CLI
ผู้เรียกระยะไกล, `deviceIdentity` แบบระบุชัดเจน, เส้นทาง device-token แบบระบุชัดเจน
และไคลเอนต์ browser/node ยังคงต้องมีการอนุมัติอุปกรณ์ตามปกติสำหรับการอัปเกรดขอบเขต
</Note>

## การหยุด

- การส่ง `/stop` ในแชตของผู้ร้องขอจะยกเลิกเซสชันผู้ร้องขอและหยุดการรันเอเจนต์ย่อยที่ใช้งานอยู่ซึ่ง spawn จากเซสชันนั้น โดยส่งผลต่อเนื่องไปยังลูกที่ซ้อนกัน
- `/subagents kill <id>` หยุดเอเจนต์ย่อยที่ระบุและส่งผลต่อเนื่องไปยังลูกของเอเจนต์นั้น

## ข้อจำกัด

- การประกาศของเอเจนต์ย่อยเป็นแบบ **พยายามอย่างดีที่สุด** หาก Gateway รีสตาร์ต งาน "announce back" ที่ค้างอยู่จะสูญหาย
- เอเจนต์ย่อยยังคงใช้ทรัพยากรกระบวนการ Gateway เดียวกัน ให้ถือว่า `maxConcurrent` เป็นวาล์วนิรภัย
- `sessions_spawn` เป็นแบบไม่บล็อกเสมอ: จะคืนค่า `{ status: "accepted", runId, childSessionKey }` ทันที
- บริบทเอเจนต์ย่อยฉีดเฉพาะ `AGENTS.md` + `TOOLS.md` (ไม่มี `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` หรือ `BOOTSTRAP.md`)
- ระดับความลึกในการซ้อนสูงสุดคือ 5 (ช่วง `maxSpawnDepth`: 1–5) แนะนำให้ใช้ระดับความลึก 2 สำหรับกรณีการใช้งานส่วนใหญ่
- `maxChildrenPerAgent` จำกัดจำนวนลูกที่ใช้งานอยู่ต่อเซสชัน (ค่าเริ่มต้น `5`, ช่วง `1–20`)

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents)
- [ส่งเอเจนต์](/th/tools/agent-send)
- [งานเบื้องหลัง](/th/automation/tasks)
- [เครื่องมือ sandbox แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
