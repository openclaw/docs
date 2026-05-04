---
read_when:
    - คุณต้องการงานเบื้องหลังหรืองานแบบขนานผ่านเอเจนต์
    - คุณกำลังเปลี่ยนแปลง sessions_spawn หรือนโยบายเครื่องมือของเอเจนต์ย่อย
    - คุณกำลังพัฒนาหรือแก้ไขปัญหาเซสชันเอเจนต์ย่อยที่ผูกกับเธรด
sidebarTitle: Sub-agents
summary: เริ่มการรันเอเจนต์เบื้องหลังแบบแยกส่วน ซึ่งประกาศผลลัพธ์กลับไปยังแชตของผู้ร้องขอ
title: เอเจนต์ย่อย
x-i18n:
    generated_at: "2026-05-04T07:07:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65d60bf6813d667b7311aa28109d4bd6be012a16e638c64cfff130831db88cd8
    source_path: tools/subagents.md
    workflow: 16
---

เอเจนต์ย่อยคือการรันเอเจนต์เบื้องหลังที่ถูกสร้างจากการรันเอเจนต์ที่มีอยู่
เอเจนต์ย่อยจะทำงานในเซสชันของตัวเอง (`agent:<agentId>:subagent:<uuid>`) และ
เมื่อเสร็จแล้วจะ **ประกาศ** ผลลัพธ์กลับไปยังช่องแชทของผู้ร้องขอ
การรันเอเจนต์ย่อยแต่ละครั้งจะถูกติดตามเป็น
[งานเบื้องหลัง](/th/automation/tasks)

เป้าหมายหลัก:

- ทำงาน "ค้นคว้า / งานยาว / เครื่องมือช้า" แบบขนานโดยไม่บล็อกการรันหลัก
- แยกเอเจนต์ย่อยโดยค่าเริ่มต้น (แยกเซสชัน + sandboxing ที่เลือกได้)
- ทำให้พื้นผิวเครื่องมือถูกใช้งานผิดได้ยาก: เอเจนต์ย่อยจะไม่ได้รับเครื่องมือเซสชันโดยค่าเริ่มต้น
- รองรับความลึกการซ้อนที่กำหนดค่าได้สำหรับรูปแบบ orchestrator

<Note>
**หมายเหตุเรื่องต้นทุน:** โดยค่าเริ่มต้น เอเจนต์ย่อยแต่ละตัวมีบริบทและการใช้โทเค็นของตัวเอง
สำหรับงานหนักหรืองานที่ทำซ้ำ ให้ตั้งโมเดลที่ถูกกว่าสำหรับเอเจนต์ย่อย
และให้เอเจนต์หลักใช้โมเดลคุณภาพสูงกว่า กำหนดค่าผ่าน
`agents.defaults.subagents.model` หรือการ override รายเอเจนต์ เมื่อเอเจนต์ลูก
    ต้องการทรานสคริปต์ปัจจุบันของผู้ร้องขอจริง ๆ เอเจนต์สามารถขอ
    `context: "fork"` สำหรับการ spawn ครั้งนั้นได้ เซสชันเอเจนต์ย่อยที่ผูกกับเธรดมีค่าเริ่มต้นเป็น
    `context: "fork"` เพราะจะแตกแขนงบทสนทนาปัจจุบันไปยังเธรดติดตามผล
</Note>

## คำสั่ง Slash

ใช้ `/subagents` เพื่อตรวจสอบหรือควบคุมการรันเอเจนต์ย่อยสำหรับ **เซสชันปัจจุบัน**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

ใช้ [`/steer <message>`](/th/tools/steer) ระดับบนสุดเพื่อบังคับทิศทางการรันที่ใช้งานอยู่ของเซสชันผู้ร้องขอปัจจุบัน ใช้ `/subagents steer <id|#> <message>` เมื่อเป้าหมายเป็นการรันลูก

`/subagents info` แสดงเมทาดาทาของการรัน (สถานะ, เวลา, id เซสชัน,
พาธทรานสคริปต์, การล้างข้อมูล) ใช้ `sessions_history` สำหรับมุมมองการเรียกคืนแบบจำกัดขอบเขต
และกรองความปลอดภัยแล้ว ตรวจสอบพาธทรานสคริปต์บนดิสก์เมื่อคุณ
ต้องการทรานสคริปต์เต็มดิบ

### การควบคุมการผูกเธรด

คำสั่งเหล่านี้ทำงานบนช่องทางที่รองรับการผูกเธรดแบบถาวร
ดู [ช่องทางที่รองรับเธรด](#thread-supporting-channels) ด้านล่าง

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### พฤติกรรมการ Spawn

`/subagents spawn` เริ่มเอเจนต์ย่อยเบื้องหลังในฐานะคำสั่งของผู้ใช้ (ไม่ใช่
relay ภายใน) และส่งอัปเดตการเสร็จสิ้นสุดท้ายหนึ่งครั้งกลับไปยัง
แชทของผู้ร้องขอเมื่อการรันเสร็จสิ้น

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - คำสั่ง spawn เป็นแบบไม่บล็อก และจะคืน id การรันทันที
    - เมื่อเสร็จสิ้น เอเจนต์ย่อยจะประกาศข้อความสรุป/ผลลัพธ์กลับไปยังช่องแชทของผู้ร้องขอ
    - การเสร็จสิ้นเป็นแบบ push-based เมื่อ spawn แล้ว อย่า poll `/subagents list`, `sessions_list`, หรือ `sessions_history` ในลูปเพียงเพื่อรอให้เสร็จ ให้ตรวจสอบสถานะเฉพาะเมื่อจำเป็นสำหรับการดีบักหรือการแทรกแซงเท่านั้น
    - เมื่อเสร็จสิ้น OpenClaw จะพยายามปิดแท็บเบราว์เซอร์/โปรเซสที่ติดตามไว้ซึ่งเปิดโดยเซสชันเอเจนต์ย่อยนั้น ก่อนที่โฟลว์การล้างข้อมูลของการประกาศจะดำเนินต่อ

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw จะลองส่งแบบ `agent` โดยตรงก่อนด้วยคีย์ idempotency ที่เสถียร
    - หากรอบการเสร็จสิ้นของเอเจนต์ผู้ร้องขอล้มเหลว ไม่มีเอาต์พุตที่มองเห็นได้ หรือคืน prefix ที่ไม่สมบูรณ์อย่างชัดเจนของผลลัพธ์ลูกที่จับไว้ OpenClaw จะ fallback ไปส่งการเสร็จสิ้นโดยตรงจากผลลัพธ์ลูกที่จับไว้
    - หากใช้การส่งโดยตรงไม่ได้ จะ fallback ไปยังการกำหนดเส้นทางผ่านคิว
    - หากการกำหนดเส้นทางผ่านคิวยังใช้ไม่ได้ การประกาศจะถูกลองซ้ำด้วย exponential backoff สั้น ๆ ก่อนยอมแพ้ขั้นสุดท้าย
    - การส่งการเสร็จสิ้นจะรักษาเส้นทางผู้ร้องขอที่ resolve แล้ว: เส้นทางการเสร็จสิ้นที่ผูกกับเธรดหรือผูกกับบทสนทนาจะชนะเมื่อพร้อมใช้งาน หากต้นทางการเสร็จสิ้นให้มาเฉพาะช่องทาง OpenClaw จะเติมเป้าหมาย/บัญชีที่ขาดจากเส้นทางที่ resolve แล้วของเซสชันผู้ร้องขอ (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งโดยตรงยังทำงานได้

  </Accordion>
  <Accordion title="Completion handoff metadata">
    การส่งมอบการเสร็จสิ้นให้เซสชันผู้ร้องขอเป็นบริบทภายในที่ runtime สร้างขึ้น
    (ไม่ใช่ข้อความที่ผู้ใช้เขียน) และประกอบด้วย:

    - `Result` — ข้อความตอบกลับ `assistant` ล่าสุดที่มองเห็นได้ มิฉะนั้นเป็นข้อความ tool/toolResult ล่าสุดที่ผ่านการทำให้ปลอดภัยแล้ว การรันที่ล้มเหลวแบบ terminal จะไม่นำข้อความตอบกลับที่จับไว้มาใช้ซ้ำ
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`
    - สถิติ runtime/โทเค็นแบบกระชับ
    - คำสั่งการส่งที่บอกเอเจนต์ผู้ร้องขอให้เขียนใหม่ด้วยเสียงผู้ช่วยปกติ (ไม่ส่งต่อเมทาดาทาภายในแบบดิบ)

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` และ `--thinking` override ค่าเริ่มต้นสำหรับการรันนั้นโดยเฉพาะ
    - ใช้ `info`/`log` เพื่อตรวจสอบรายละเอียดและเอาต์พุตหลังจากเสร็จสิ้น
    - `/subagents spawn` เป็นโหมด one-shot (`mode: "run"`) สำหรับเซสชันถาวรที่ผูกกับเธรด ให้ใช้ `sessions_spawn` พร้อม `thread: true` และ `mode: "session"`
    - สำหรับเซสชัน ACP harness (Claude Code, Gemini CLI, OpenCode หรือ Codex ACP/acpx ที่ระบุชัดเจน) ให้ใช้ `sessions_spawn` พร้อม `runtime: "acp"` เมื่อเครื่องมือประกาศ runtime นั้น ดู [โมเดลการส่งของ ACP](/th/tools/acp-agents#delivery-model) เมื่อดีบักการเสร็จสิ้นหรือลูปเอเจนต์ต่อเอเจนต์ เมื่อเปิดใช้งาน Plugin `codex` การควบคุมแชท/เธรด Codex ควรเลือกใช้ `/codex ...` แทน ACP เว้นแต่ผู้ใช้จะขอ ACP/acpx อย่างชัดเจน
    - OpenClaw ซ่อน `runtime: "acp"` จนกว่าจะเปิดใช้งาน ACP, ผู้ร้องขอไม่ได้อยู่ใน sandbox และมีการโหลด Plugin แบ็กเอนด์ เช่น `acpx` แล้ว `runtime: "acp"` คาดหวัง id ของ ACP harness ภายนอก หรือรายการ `agents.list[]` ที่มี `runtime.type="acp"`; ใช้ runtime เอเจนต์ย่อยเริ่มต้นสำหรับเอเจนต์ config ปกติของ OpenClaw จาก `agents_list`

  </Accordion>
</AccordionGroup>

## โหมดบริบท

เอเจนต์ย่อยแบบ native เริ่มแบบแยกเดี่ยว เว้นแต่ผู้เรียกจะขอ fork
ทรานสคริปต์ปัจจุบันอย่างชัดเจน

| โหมด       | ควรใช้เมื่อใด                                                                                                                         | พฤติกรรม                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | การค้นคว้าใหม่, การนำไปใช้ที่เป็นอิสระ, งานเครื่องมือช้า หรือสิ่งใดก็ตามที่สรุปงานในข้อความงานได้                           | สร้างทรานสคริปต์ลูกใหม่สะอาด นี่คือค่าเริ่มต้นและช่วยลดการใช้โทเค็น  |
| `fork`     | งานที่ขึ้นกับบทสนทนาปัจจุบัน, ผลลัพธ์เครื่องมือก่อนหน้า หรือคำสั่งที่มีรายละเอียดอ่อนซึ่งมีอยู่แล้วในทรานสคริปต์ของผู้ร้องขอ | แตกแขนงทรานสคริปต์ของผู้ร้องขอเข้าสู่เซสชันลูกก่อนที่ลูกจะเริ่ม |

ใช้ `fork` เท่าที่จำเป็น ใช้สำหรับการมอบหมายงานที่ไวต่อบริบท ไม่ใช่
สิ่งทดแทนการเขียนพรอมป์งานที่ชัดเจน

## เครื่องมือ: `sessions_spawn`

เริ่มการรันเอเจนต์ย่อยด้วย `deliver: false` บนเลน `subagent` ส่วนกลาง
จากนั้นรันขั้นตอนประกาศและโพสต์คำตอบประกาศไปยังช่องแชทของผู้ร้องขอ

ความพร้อมใช้งานขึ้นกับนโยบายเครื่องมือที่มีผลของผู้เรียก โปรไฟล์ `coding` และ
`full` เปิดเผย `sessions_spawn` โดยค่าเริ่มต้น โปรไฟล์ `messaging`
ไม่เปิดเผย ให้เพิ่ม `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` หรือใช้ `tools.profile: "coding"` สำหรับเอเจนต์ที่ควรมอบหมาย
งาน นโยบายช่องทาง/กลุ่ม, provider, sandbox และ allow/deny รายเอเจนต์ยังสามารถ
นำเครื่องมือออกหลังขั้นโปรไฟล์ได้ ใช้ `/tools` จากเซสชันเดียวกัน
เพื่อยืนยันรายการเครื่องมือที่มีผล

**ค่าเริ่มต้น:**

- **โมเดล:** สืบทอดจากผู้เรียก เว้นแต่คุณตั้ง `agents.defaults.subagents.model` (หรือ `agents.list[].subagents.model` รายเอเจนต์); `sessions_spawn.model` ที่ระบุชัดเจนยังคงชนะ
- **Thinking:** สืบทอดจากผู้เรียก เว้นแต่คุณตั้ง `agents.defaults.subagents.thinking` (หรือ `agents.list[].subagents.thinking` รายเอเจนต์); `sessions_spawn.thinking` ที่ระบุชัดเจนยังคงชนะ
- **ไทม์เอาต์การรัน:** หากละ `sessions_spawn.runTimeoutSeconds` ไว้ OpenClaw จะใช้ `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งค่า มิฉะนั้นจะ fallback เป็น `0` (ไม่มีไทม์เอาต์)

### พารามิเตอร์เครื่องมือ

<ParamField path="task" type="string" required>
  คำอธิบายงานสำหรับเอเจนต์ย่อย
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับที่มนุษย์อ่านได้ซึ่งเป็นทางเลือก
</ParamField>
<ParamField path="agentId" type="string">
  Spawn ภายใต้ id เอเจนต์อื่นเมื่อได้รับอนุญาตโดย `subagents.allowAgents`
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ใช้เฉพาะสำหรับ ACP harness ภายนอก (`claude`, `droid`, `gemini`, `opencode` หรือ Codex ACP/acpx ที่ขออย่างชัดเจน) และสำหรับรายการ `agents.list[]` ที่ `runtime.type` เป็น `acp`
</ParamField>
<ParamField path="resumeSessionId" type="string">
  เฉพาะ ACP เท่านั้น ดำเนินเซสชัน ACP harness ที่มีอยู่ต่อเมื่อ `runtime: "acp"`; ถูกละเว้นสำหรับการ spawn เอเจนต์ย่อยแบบ native
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  เฉพาะ ACP เท่านั้น สตรีมเอาต์พุตการรัน ACP ไปยังเซสชันแม่เมื่อ `runtime: "acp"`; ละไว้สำหรับการ spawn เอเจนต์ย่อยแบบ native
</ParamField>
<ParamField path="model" type="string">
  Override โมเดลเอเจนต์ย่อย ค่าที่ไม่ถูกต้องจะถูกข้ามและเอเจนต์ย่อยจะรันบนโมเดลเริ่มต้นพร้อมคำเตือนในผลลัพธ์เครื่องมือ
</ParamField>
<ParamField path="thinking" type="string">
  Override ระดับ thinking สำหรับการรันเอเจนต์ย่อย
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ค่าเริ่มต้นเป็น `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งค่า มิฉะนั้นเป็น `0` เมื่อตั้งค่าแล้ว การรันเอเจนต์ย่อยจะถูกยกเลิกหลังจาก N วินาที
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  เมื่อเป็น `true` จะขอการผูกเธรดของช่องทางสำหรับเซสชันเอเจนต์ย่อยนี้
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  หาก `thread: true` และละ `mode` ไว้ ค่าเริ่มต้นจะกลายเป็น `session` `mode: "session"` ต้องใช้ `thread: true`
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` จะเก็บถาวรทันทีหลังประกาศ (ยังคงเก็บทรานสคริปต์ไว้ผ่านการเปลี่ยนชื่อ)
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` ปฏิเสธการ spawn เว้นแต่ runtime ลูกเป้าหมายจะอยู่ใน sandbox
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` แตกแขนงทรานสคริปต์ปัจจุบันของผู้ร้องขอเข้าสู่เซสชันลูก เฉพาะเอเจนต์ย่อยแบบ native เท่านั้น การ spawn ที่ผูกกับเธรดมีค่าเริ่มต้นเป็น `fork`; การ spawn ที่ไม่ใช่เธรดมีค่าเริ่มต้นเป็น `isolated`
</ParamField>

<Warning>
`sessions_spawn` ไม่รับพารามิเตอร์การส่งผ่านช่องทาง (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) สำหรับการส่ง ให้ใช้
`message`/`sessions_send` จากการรันที่ spawn แล้ว
</Warning>

## เซสชันที่ผูกกับเธรด

เมื่อเปิดใช้งานการผูกเธรดสำหรับช่องทาง เอเจนต์ย่อยสามารถคงการผูก
กับเธรดไว้ เพื่อให้ข้อความผู้ใช้ติดตามผลในเธรดนั้นยังคงกำหนดเส้นทางไปยัง
เซสชันเอเจนต์ย่อยเดียวกัน

### ช่องทางที่รองรับเธรด

**Discord** เป็นช่องทางเดียวที่รองรับในขณะนี้ รองรับ
เซสชันเอเจนต์ย่อยที่ผูกกับเธรดแบบถาวร (`sessions_spawn` พร้อม
`thread: true`), การควบคุมเธรดด้วยตนเอง (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) และคีย์อะแดปเตอร์
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` และ
`channels.discord.threadBindings.spawnSessions`

### โฟลว์ด่วน

<Steps>
  <Step title="Spawn">
    `sessions_spawn` พร้อม `thread: true` (และเลือกใส่ `mode: "session"` ได้)
  </Step>
  <Step title="Bind">
    OpenClaw สร้างหรือผูกเธรดกับเป้าหมายเซสชันนั้นในช่องทางที่ใช้งานอยู่
  </Step>
  <Step title="Route follow-ups">
    การตอบกลับและข้อความติดตามผลในเธรดนั้นจะถูกส่งต่อไปยังเซสชันที่ผูกไว้
  </Step>
  <Step title="Inspect timeouts">
    ใช้ `/session idle` เพื่อตรวจสอบ/อัปเดตการเลิกโฟกัสอัตโนมัติเมื่อไม่มีความเคลื่อนไหว และ
    `/session max-age` เพื่อควบคุมขีดจำกัดสูงสุดแบบตายตัว
  </Step>
  <Step title="Detach">
    ใช้ `/unfocus` เพื่อแยกออกด้วยตนเอง
  </Step>
</Steps>

### การควบคุมด้วยตนเอง

| คำสั่ง             | ผลลัพธ์                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | ผูกเธรดปัจจุบัน (หรือสร้างใหม่) กับเป้าหมาย sub-agent/เซสชัน        |
| `/unfocus`         | ลบการผูกสำหรับเธรดที่ผูกอยู่ในปัจจุบัน                                |
| `/agents`          | แสดงรายการรันที่ใช้งานอยู่และสถานะการผูก (`thread:<id>` หรือ `unbound`) |
| `/session idle`    | ตรวจสอบ/อัปเดตการเลิกโฟกัสอัตโนมัติเมื่อว่าง (เฉพาะเธรดที่ผูกและโฟกัสอยู่) |
| `/session max-age` | ตรวจสอบ/อัปเดตขีดจำกัดสูงสุดแบบตายตัว (เฉพาะเธรดที่ผูกและโฟกัสอยู่) |

### สวิตช์การกำหนดค่า

- **ค่าเริ่มต้นส่วนกลาง:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- **คีย์สำหรับการเขียนทับตามช่องทางและการผูกอัตโนมัติเมื่อ spawn** ขึ้นอยู่กับ adapter แต่ละตัว ดู [ช่องทางที่รองรับเธรด](#thread-supporting-channels) ด้านบน

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) และ
[คำสั่ง Slash](/th/tools/slash-commands) สำหรับรายละเอียด adapter ปัจจุบัน

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  รายการ agent ids ที่สามารถกำหนดเป็นเป้าหมายผ่าน `agentId` แบบชัดเจน (`["*"]` อนุญาตทุกตัว) ค่าเริ่มต้น: เฉพาะเอเจนต์ผู้ร้องขอเท่านั้น หากคุณตั้งค่ารายการและยังต้องการให้ผู้ร้องขอ spawn ตัวเองด้วย `agentId` ให้ใส่ id ของผู้ร้องขอในรายการด้วย
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  allowlist ของเอเจนต์เป้าหมายเริ่มต้นที่ใช้เมื่อเอเจนต์ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  บล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน) การเขียนทับรายเอเจนต์: `agents.list[].subagents.requireAgentId`
</ParamField>

หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมาย
ที่จะรันแบบไม่อยู่ใน sandbox

### การค้นพบ

ใช้ `agents_list` เพื่อดูว่า agent ids ใดได้รับอนุญาตสำหรับ
`sessions_spawn` อยู่ในปัจจุบัน การตอบกลับจะรวมโมเดลที่มีผลจริงของแต่ละเอเจนต์ที่แสดง
และข้อมูลเมตารันไทม์แบบฝัง เพื่อให้ผู้เรียกแยกแยะ PI, Codex
app-server และ native runtimes อื่นที่กำหนดค่าไว้ได้

### การเก็บถาวรอัตโนมัติ

- เซสชัน sub-agent จะถูกเก็บถาวรโดยอัตโนมัติหลังจาก `agents.defaults.subagents.archiveAfterMinutes` (ค่าเริ่มต้น `60`)
- การเก็บถาวรใช้ `sessions.delete` และเปลี่ยนชื่อทรานสคริปต์เป็น `*.deleted.<timestamp>` (โฟลเดอร์เดียวกัน)
- `cleanup: "delete"` จะเก็บถาวรทันทีหลังจากประกาศ (ยังคงเก็บทรานสคริปต์ไว้ผ่านการเปลี่ยนชื่อ)
- การเก็บถาวรอัตโนมัติเป็นแบบ best-effort; ตัวจับเวลาที่ค้างอยู่จะหายไปหาก gateway รีสตาร์ท
- `runTimeoutSeconds` จะ **ไม่** เก็บถาวรอัตโนมัติ; มันหยุดเฉพาะการรันเท่านั้น เซสชันจะยังคงอยู่จนกว่าจะเก็บถาวรอัตโนมัติ
- การเก็บถาวรอัตโนมัติใช้กับเซสชัน depth-1 และ depth-2 เท่ากัน
- การล้างข้อมูลเบราว์เซอร์แยกจากการล้างข้อมูลการเก็บถาวร: แท็บ/โปรเซสของเบราว์เซอร์ที่ติดตามไว้จะถูกปิดแบบ best-effort เมื่อการรันเสร็จสิ้น แม้จะยังเก็บระเบียนทรานสคริปต์/เซสชันไว้ก็ตาม

## Sub-agents แบบซ้อน

โดยค่าเริ่มต้น sub-agents ไม่สามารถ spawn sub-agents ของตัวเองได้
(`maxSpawnDepth: 1`) ตั้งค่า `maxSpawnDepth: 2` เพื่อเปิดใช้งานการซ้อนหนึ่งระดับ
นั่นคือ **รูปแบบ orchestrator**: main → orchestrator sub-agent →
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

| ความลึก | รูปแบบคีย์เซสชัน                              | บทบาท                                            | Spawn ได้หรือไม่              |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | เอเจนต์หลัก                                    | เสมอ                         |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrator เมื่ออนุญาต depth 2) | เฉพาะเมื่อ `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (worker ปลายทาง)                | ไม่เคย                       |

### สายการประกาศ

ผลลัพธ์จะไหลย้อนกลับขึ้นมาตามสาย:

1. Worker depth-2 เสร็จสิ้น → ประกาศไปยัง parent ของตัวเอง (orchestrator depth-1)
2. Orchestrator depth-1 ได้รับประกาศ สังเคราะห์ผลลัพธ์ เสร็จสิ้น → ประกาศไปยัง main
3. เอเจนต์หลักได้รับประกาศและส่งต่อให้ผู้ใช้

แต่ละระดับจะเห็นเฉพาะประกาศจาก children โดยตรงของตัวเองเท่านั้น

<Note>
**แนวทางปฏิบัติด้านการดำเนินงาน:** เริ่มงาน child เพียงครั้งเดียวและรอเหตุการณ์เสร็จสิ้น
แทนการสร้างลูป polling รอบ `sessions_list`,
`sessions_history`, `/subagents list` หรือคำสั่ง `exec` sleep
`sessions_list` และ `/subagents list` จะรักษาความสัมพันธ์ child-session
ให้โฟกัสอยู่กับงานที่ live อยู่ — children ที่ live จะยังคงแนบอยู่, children ที่จบแล้วจะยัง
มองเห็นได้ในหน้าต่างล่าสุดช่วงสั้น ๆ และลิงก์ child แบบมีเฉพาะใน store ที่เก่าจะถูก
ละเว้นหลังจากพ้นหน้าต่างความสดใหม่ การทำเช่นนี้ป้องกันไม่ให้ข้อมูลเมตาเก่า `spawnedBy` /
`parentSessionKey` ชุบชีวิต ghost children หลังจาก
รีสตาร์ท หากเหตุการณ์เสร็จสิ้นของ child มาถึงหลังจากคุณส่ง
คำตอบสุดท้ายไปแล้ว follow-up ที่ถูกต้องคือโทเค็นเงียบตามตัวอักษร
`NO_REPLY` / `no_reply`
</Note>

### นโยบายเครื่องมือตามความลึก

- บทบาทและขอบเขตการควบคุมจะถูกเขียนลงในข้อมูลเมตาของเซสชันตอน spawn ซึ่งช่วยป้องกันไม่ให้คีย์เซสชันแบบแบนหรือที่กู้คืนมาได้รับสิทธิ์ orchestrator กลับมาโดยไม่ตั้งใจ
- **Depth 1 (orchestrator, เมื่อ `maxSpawnDepth >= 2`):** ได้รับ `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` เพื่อให้จัดการ children ของตัวเองได้ เครื่องมือ session/system อื่นยังคงถูกปฏิเสธ
- **Depth 1 (leaf, เมื่อ `maxSpawnDepth == 1`):** ไม่มีเครื่องมือเซสชัน (พฤติกรรมเริ่มต้นปัจจุบัน)
- **Depth 2 (leaf worker):** ไม่มีเครื่องมือเซสชัน — `sessions_spawn` จะถูกปฏิเสธเสมอที่ depth 2 ไม่สามารถ spawn children ต่อได้

### ขีดจำกัดการ spawn รายเอเจนต์

เซสชันเอเจนต์แต่ละรายการ (ที่ความลึกใดก็ได้) สามารถมี children ที่ใช้งานอยู่ได้สูงสุด `maxChildrenPerAgent`
(ค่าเริ่มต้น `5`) พร้อมกัน การตั้งค่านี้ป้องกัน fan-out ที่ควบคุมไม่ได้
จาก orchestrator เดียว

### การหยุดแบบ cascade

การหยุด orchestrator depth-1 จะหยุด children depth-2 ทั้งหมดของมันโดยอัตโนมัติ:

- `/stop` ในแชตหลักจะหยุดเอเจนต์ depth-1 ทั้งหมดและ cascade ไปยัง children depth-2 ของพวกเขา
- `/subagents kill <id>` หยุด sub-agent เฉพาะตัวและ cascade ไปยัง children ของมัน
- `/subagents kill all` หยุด sub-agents ทั้งหมดสำหรับผู้ร้องขอและ cascade

## การยืนยันตัวตน

การยืนยันตัวตนของ sub-agent จะ resolve ตาม **agent id** ไม่ใช่ตามประเภทเซสชัน:

- คีย์เซสชัน sub-agent คือ `agent:<agentId>:subagent:<uuid>`
- auth store โหลดจาก `agentDir` ของเอเจนต์นั้น
- auth profiles ของเอเจนต์หลักจะถูกผสานเข้ามาเป็น **fallback**; โปรไฟล์ของเอเจนต์จะเขียนทับโปรไฟล์หลักเมื่อมี conflict

การผสานเป็นแบบเพิ่มเข้ามา ดังนั้นโปรไฟล์หลักจะพร้อมใช้งานเป็น
fallback เสมอ ยังไม่รองรับ auth ที่แยกอย่างสมบูรณ์ต่อเอเจนต์

## การประกาศ

Sub-agents รายงานกลับผ่านขั้นตอนการประกาศ:

- ขั้นตอนการประกาศรันภายในเซสชัน sub-agent (ไม่ใช่เซสชันผู้ร้องขอ)
- หาก sub-agent ตอบกลับตรงกับ `ANNOUNCE_SKIP` จะไม่มีการโพสต์อะไร
- หากข้อความ assistant ล่าสุดเป็นโทเค็นเงียบตรงตามตัวอักษร `NO_REPLY` / `no_reply` เอาต์พุตประกาศจะถูกระงับแม้ก่อนหน้านี้จะมีความคืบหน้าที่มองเห็นได้

การส่งมอบขึ้นอยู่กับความลึกของผู้ร้องขอ:

- เซสชันผู้ร้องขอระดับบนสุดใช้การเรียก `agent` แบบ follow-up พร้อมการส่งมอบภายนอก (`deliver=true`)
- เซสชัน requester subagent แบบซ้อนจะได้รับการฉีด follow-up ภายใน (`deliver=false`) เพื่อให้ orchestrator สังเคราะห์ผลลัพธ์ child ภายในเซสชันได้
- หากเซสชัน nested requester subagent หายไป OpenClaw จะ fallback ไปยังผู้ร้องขอของเซสชันนั้นเมื่อมี

สำหรับเซสชันผู้ร้องขอระดับบนสุด การส่งมอบโดยตรงใน completion-mode จะ
resolve เส้นทาง conversation/thread ที่ผูกอยู่และ hook override ก่อน จากนั้นเติม
ฟิลด์ channel-target ที่ขาดจากเส้นทางที่จัดเก็บไว้ของเซสชันผู้ร้องขอ
ซึ่งทำให้ completion อยู่ในแชต/หัวข้อที่ถูกต้อง แม้ต้นทาง completion
จะระบุเฉพาะช่องทางก็ตาม

การรวบรวม completion ของ child จะถูกจำกัดขอบเขตไว้ที่การรันผู้ร้องขอปัจจุบันเมื่อ
สร้าง findings ของ nested completion เพื่อป้องกันไม่ให้เอาต์พุต child
จากการรันก่อนหน้าที่เก่ารั่วเข้ามาในประกาศปัจจุบัน การตอบกลับประกาศจะรักษา
การกำหนดเส้นทาง thread/topic เมื่อมีใน channel adapters

### บริบทการประกาศ

บริบทการประกาศจะถูกทำให้เป็นมาตรฐานเป็นบล็อกเหตุการณ์ภายในที่เสถียร:

| ฟิลด์          | แหล่งที่มา                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` หรือ `cron`                                                                                         |
| Session ids    | คีย์/id เซสชัน child                                                                                           |
| Type           | ประเภทประกาศ + ป้ายกำกับงาน                                                                                    |
| Status         | ได้มาจากผลลัพธ์รันไทม์ (`success`, `error`, `timeout` หรือ `unknown`) — **ไม่ได้** อนุมานจากข้อความโมเดล |
| Result content | ข้อความ assistant ล่าสุดที่มองเห็นได้ มิฉะนั้นคือข้อความ tool/toolResult ล่าสุดที่ผ่านการ sanitize แล้ว       |
| Follow-up      | คำสั่งที่อธิบายว่าเมื่อใดควรตอบกลับเทียบกับอยู่เงียบ                                                          |

การรัน terminal ที่ล้มเหลวจะรายงานสถานะความล้มเหลวโดยไม่ replay
ข้อความตอบกลับที่จับไว้ เมื่อ timeout หาก child ไปถึงแค่การเรียกเครื่องมือ
ประกาศสามารถยุบประวัตินั้นเป็นสรุปความคืบหน้าบางส่วนแบบสั้น
แทนการ replay เอาต์พุตเครื่องมือดิบ

### บรรทัดสถิติ

Payload ประกาศจะมีบรรทัดสถิติท้ายสุด (แม้เมื่อถูกครอบไว้):

- Runtime (เช่น `runtime 5m12s`)
- การใช้โทเค็น (input/output/total)
- ค่าใช้จ่ายโดยประมาณเมื่อกำหนดราคาของโมเดลไว้ (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` และเส้นทางทรานสคริปต์ เพื่อให้เอเจนต์หลักสามารถดึงประวัติผ่าน `sessions_history` หรือตรวจสอบไฟล์บนดิสก์ได้

ข้อมูลเมตาภายในมีไว้สำหรับ orchestration เท่านั้น; คำตอบที่ผู้ใช้เห็น
ควรถูกเขียนใหม่ด้วยน้ำเสียง assistant ปกติ

### เหตุผลที่ควรใช้ `sessions_history`

`sessions_history` เป็นเส้นทาง orchestration ที่ปลอดภัยกว่า:

- การเรียกคืนของ assistant จะถูกทำให้เป็นมาตรฐานก่อน: ลบ thinking tags; ลบโครง `<relevant-memories>` / `<relevant_memories>`; ลบบล็อก payload XML ของการเรียกเครื่องมือแบบ plain-text (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) รวมถึง payload ที่ถูกตัดทอนซึ่งไม่เคยปิดอย่างสมบูรณ์; ลบโครง tool-call/result ที่ถูกลดระดับและตัวทำเครื่องหมาย historical-context; ลบ model control tokens ที่รั่ว (`<|assistant|>`, ASCII `<|...|>` อื่น, full-width `<｜...｜>`); ลบ XML tool-call ของ MiniMax ที่ malformed
- ข้อความที่ดูเหมือน credential/token จะถูก redact
- บล็อกยาวสามารถถูกตัดทอนได้
- ประวัติขนาดใหญ่มากสามารถทิ้งแถวเก่ากว่า หรือแทนที่แถวที่ใหญ่เกินด้วย `[sessions_history omitted: message too large]`
- การตรวจสอบทรานสคริปต์ดิบบนดิสก์คือ fallback เมื่อคุณต้องการทรานสคริปต์แบบ byte-for-byte ครบถ้วน

## นโยบายเครื่องมือ

Sub-agent ใช้โปรไฟล์และไปป์ไลน์นโยบายเครื่องมือเดียวกับ agent หลักหรือ
agent เป้าหมายก่อน จากนั้น OpenClaw จะใช้ชั้นข้อจำกัดของ sub-agent

เมื่อไม่มี `tools.profile` ที่จำกัด sub-agent จะได้รับ **เครื่องมือทั้งหมด ยกเว้น
เครื่องมือ session** และเครื่องมือระบบ:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` ยังคงเป็นมุมมองการเรียกคืนที่มีขอบเขตและผ่านการทำให้ปลอดภัยแล้วในที่นี้ด้วย —
ไม่ใช่การดัมป์ transcript ดิบ

เมื่อ `maxSpawnDepth >= 2` sub-agent ตัว orchestrator ที่ depth-1 จะได้รับ
`sessions_spawn`, `subagents`, `sessions_list` และ
`sessions_history` เพิ่มเติม เพื่อให้สามารถจัดการลูกของตนได้

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` เป็นตัวกรอง allow-only ขั้นสุดท้าย มันสามารถจำกัด
ชุดเครื่องมือที่ resolve แล้วให้แคบลงได้ แต่ไม่สามารถ **เพิ่มกลับ** เครื่องมือที่ถูกนำออก
โดย `tools.profile` ได้ ตัวอย่างเช่น `tools.profile: "coding"` รวม
`web_search`/`web_fetch` แต่ไม่มีเครื่องมือ `browser` หากต้องการให้
sub-agent ในโปรไฟล์ coding ใช้การทำงานอัตโนมัติของ browser ให้เพิ่ม browser ใน
ขั้นโปรไฟล์:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

ใช้ `agents.list[].tools.alsoAllow: ["browser"]` แบบราย agent เมื่อมีเพียง
agent เดียวที่ควรได้รับการทำงานอัตโนมัติของ browser

## การทำงานพร้อมกัน

Sub-agent ใช้ lane คิวในโปรเซสโดยเฉพาะ:

- **ชื่อ lane:** `subagent`
- **การทำงานพร้อมกัน:** `agents.defaults.subagents.maxConcurrent` (ค่าเริ่มต้น `8`)

## Liveness และการกู้คืน

OpenClaw ไม่ถือว่าการไม่มี `endedAt` เป็นหลักฐานถาวรว่า
sub-agent ยังทำงานอยู่ run ที่ยังไม่สิ้นสุดซึ่งเก่ากว่าหน้าต่าง stale-run
จะหยุดถูกนับเป็น active/pending ใน `/subagents list`, สรุปสถานะ,
การ gating การเสร็จสิ้นของ descendant และการตรวจสอบ concurrency แบบราย session

หลังจาก Gateway restart แล้ว run ที่ restore กลับมาและยังไม่สิ้นสุดซึ่ง stale จะถูก prune เว้นแต่
child session ของมันถูกทำเครื่องหมาย `abortedLastRun: true` child session ที่
restart-aborted เหล่านั้นยังคงกู้คืนได้ผ่าน flow การกู้คืน orphan ของ sub-agent
ซึ่งส่งข้อความ resume สังเคราะห์ก่อนล้าง marker ที่ถูก aborted

การกู้คืนอัตโนมัติหลัง restart ถูกจำกัดแบบราย child session หาก child ของ
sub-agent เดียวกันถูกยอมรับสำหรับการกู้คืน orphan ซ้ำ ๆ ภายใน
หน้าต่าง rapid re-wedge OpenClaw จะคง recovery tombstone ไว้บน
session นั้น และหยุด auto-resume มันในการ restart ภายหลัง ให้รัน
`openclaw tasks maintenance --apply` เพื่อ reconcile ระเบียน task หรือ
`openclaw doctor --fix` เพื่อล้าง flag การกู้คืนที่ aborted และ stale บน
session ที่ถูก tombstone

<Note>
หากการ spawn sub-agent ล้มเหลวด้วย Gateway `PAIRING_REQUIRED` /
`scope-upgrade` ให้ตรวจสอบ RPC caller ก่อนแก้ไขสถานะ pairing
การประสานงาน `sessions_spawn` ภายในควรเชื่อมต่อเป็น
`client.id: "gateway-client"` พร้อม `client.mode: "backend"` ผ่าน
การ auth แบบ shared-token/password โดยตรงบน local loopback; เส้นทางนั้นไม่ขึ้นกับ
baseline scope ของอุปกรณ์ที่จับคู่แล้วของ CLI caller ระยะไกล,
`deviceIdentity` แบบระบุชัดเจน, เส้นทาง device-token แบบระบุชัดเจน และ client แบบ browser/node
ยังต้องได้รับการอนุมัติอุปกรณ์ตามปกติสำหรับการอัปเกรด scope
</Note>

## การหยุด

- การส่ง `/stop` ในแชตของ requester จะ abort session ของ requester และหยุด run ของ sub-agent ที่ active ทั้งหมดที่ spawn จาก session นั้น โดย cascade ไปยังลูกที่ซ้อนอยู่
- `/subagents kill <id>` หยุด sub-agent ที่ระบุและ cascade ไปยังลูกของมัน

## ข้อจำกัด

- การประกาศของ sub-agent เป็นแบบ **best-effort** หาก gateway restart งาน "announce back" ที่ค้างอยู่จะหายไป
- Sub-agent ยังใช้ทรัพยากรของโปรเซส gateway เดียวกันร่วมกัน ให้ถือว่า `maxConcurrent` เป็นวาล์วนิรภัย
- `sessions_spawn` เป็นแบบไม่ block เสมอ: มันส่งคืน `{ status: "accepted", runId, childSessionKey }` ทันที
- Context ของ sub-agent inject เฉพาะ `AGENTS.md` + `TOOLS.md` (ไม่มี `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` หรือ `BOOTSTRAP.md`)
- ความลึกการซ้อนสูงสุดคือ 5 (ช่วง `maxSpawnDepth`: 1–5) แนะนำให้ใช้ depth 2 สำหรับกรณีใช้งานส่วนใหญ่
- `maxChildrenPerAgent` จำกัดจำนวนลูกที่ active ต่อ session (ค่าเริ่มต้น `5`, ช่วง `1–20`)

## ที่เกี่ยวข้อง

- [ACP agents](/th/tools/acp-agents)
- [Agent send](/th/tools/agent-send)
- [Background tasks](/th/automation/tasks)
- [Multi-agent sandbox tools](/th/tools/multi-agent-sandbox-tools)
