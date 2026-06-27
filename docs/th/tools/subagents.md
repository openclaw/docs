---
read_when:
    - คุณต้องการให้งานทำงานเบื้องหลังหรือทำงานแบบขนานผ่านเอเจนต์
    - คุณกำลังเปลี่ยนนโยบายเครื่องมือ sessions_spawn หรือ sub-agent
    - คุณกำลังใช้งานหรือแก้ไขปัญหาเซสชัน subagent ที่ผูกกับเธรด
sidebarTitle: Sub-agents
summary: สร้างการรันเอเจนต์เบื้องหลังแบบแยกส่วน ซึ่งประกาศผลลัพธ์กลับไปยังแชทของผู้ร้องขอ
title: เอเจนต์ย่อย
x-i18n:
    generated_at: "2026-06-27T18:31:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

เอเจนต์ย่อยคือการรันเอเจนต์เบื้องหลังที่ถูกสร้างจากการรันเอเจนต์ที่มีอยู่
เอเจนต์ย่อยจะรันในเซสชันของตัวเอง (`agent:<agentId>:subagent:<uuid>`) และ
เมื่อเสร็จแล้วจะ **ประกาศ** ผลลัพธ์กลับไปยังช่องแชทของผู้ร้องขอ
การรันเอเจนต์ย่อยแต่ละครั้งจะถูกติดตามเป็น
[งานเบื้องหลัง](/th/automation/tasks)

เป้าหมายหลัก:

- ทำให้งาน "ค้นคว้า / งานยาว / เครื่องมือที่ช้า" รันขนานได้โดยไม่บล็อกการรันหลัก
- แยกเอเจนต์ย่อยออกจากกันตามค่าเริ่มต้น (การแยกเซสชัน + การ sandbox แบบเลือกได้)
- ทำให้พื้นผิวเครื่องมือใช้งานผิดได้ยาก: เอเจนต์ย่อยจะ **ไม่ได้** รับเครื่องมือเซสชันตามค่าเริ่มต้น
- รองรับความลึกของการซ้อนที่กำหนดค่าได้สำหรับรูปแบบ orchestrator

<Note>
**หมายเหตุเรื่องค่าใช้จ่าย:** เอเจนต์ย่อยแต่ละตัวมีบริบทและการใช้โทเค็นของตัวเองตามค่าเริ่มต้น
สำหรับงานหนักหรืองานซ้ำ ๆ ให้ตั้งค่าโมเดลที่ถูกกว่าสำหรับเอเจนต์ย่อย
และให้เอเจนต์หลักใช้โมเดลคุณภาพสูงกว่า กำหนดค่าผ่าน
`agents.defaults.subagents.model` หรือการ override รายเอเจนต์ เมื่อเอเจนต์ลูก
    จำเป็นต้องใช้ transcript ปัจจุบันของผู้ร้องขอจริง ๆ เอเจนต์สามารถขอ
    `context: "fork"` สำหรับการ spawn ครั้งนั้นได้ เซสชันเอเจนต์ย่อยที่ผูกกับเธรดมีค่าเริ่มต้น
    เป็น `context: "fork"` เพราะจะแตกแขนงการสนทนาปัจจุบันไปเป็น
    เธรดติดตามผล
</Note>

## คำสั่ง Slash

ใช้ `/subagents` เพื่อตรวจสอบการรันเอเจนต์ย่อยสำหรับ **เซสชันปัจจุบัน**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` แสดง metadata ของการรัน (สถานะ, timestamps, session id,
เส้นทาง transcript, cleanup) ใช้ `sessions_history` สำหรับมุมมองการเรียกคืนแบบจำกัดขอบเขต
และผ่านตัวกรองความปลอดภัย ตรวจสอบเส้นทาง transcript บนดิสก์เมื่อคุณ
ต้องการ transcript ฉบับเต็มดิบ

### ตัวควบคุมการผูกเธรด

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

เอเจนต์เริ่มเอเจนต์ย่อยเบื้องหลังด้วย `sessions_spawn` การเสร็จสิ้นของเอเจนต์ย่อย
จะส่งกลับมาเป็น event ภายในเซสชันหลัก เอเจนต์หลัก/ผู้ร้องขอจะตัดสินใจว่า
จำเป็นต้องอัปเดตให้ผู้ใช้เห็นหรือไม่

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - `sessions_spawn` ไม่บล็อก; จะส่งคืน run id ทันที
    - เมื่อเสร็จสิ้น เอเจนต์ย่อยจะรายงานกลับไปยังเซสชันหลัก/ผู้ร้องขอ
    - เทิร์นของเอเจนต์ที่ต้องใช้ผลลัพธ์จากลูกควรเรียก `sessions_yield` หลังจาก spawn งานที่จำเป็นแล้ว การทำเช่นนี้จะจบเทิร์นปัจจุบันและให้ event การเสร็จสิ้นเข้ามาเป็นข้อความถัดไปที่โมเดลมองเห็นได้
    - การเสร็จสิ้นเป็นแบบ push-based เมื่อ spawn แล้ว **อย่า** poll `/subagents list`, `sessions_list`, หรือ `sessions_history` วนซ้ำเพียงเพื่อรอให้งานเสร็จ ให้ตรวจสอบสถานะเฉพาะเมื่อต้องการมองเห็นเพื่อดีบักเท่านั้น
    - เอาต์พุตของลูกเป็นรายงาน/หลักฐานสำหรับให้เอเจนต์ผู้ร้องขอสังเคราะห์ ไม่ใช่ข้อความคำสั่งที่ผู้ใช้เขียน และไม่สามารถ override นโยบาย system, developer, หรือ user ได้
    - เมื่อเสร็จสิ้น OpenClaw จะพยายามแบบ best-effort เพื่อปิดแท็บเบราว์เซอร์/โปรเซสที่ติดตามไว้ซึ่งเปิดโดยเซสชันเอเจนต์ย่อยนั้น ก่อนที่ flow การ cleanup ของ announce จะดำเนินต่อ

  </Accordion>
  <Accordion title="Completion delivery">
    - OpenClaw ส่งการเสร็จสิ้นกลับไปยังเซสชันผู้ร้องขอผ่านเทิร์น `agent` พร้อมคีย์ idempotency ที่เสถียร
    - หากการรันของผู้ร้องขอยัง active อยู่ OpenClaw จะพยายาม wake/steer การรันนั้นก่อน แทนที่จะเริ่มเส้นทาง reply ที่มองเห็นได้เส้นทางที่สอง
    - หากไม่สามารถ wake ผู้ร้องขอที่ active อยู่ได้ OpenClaw จะ fallback ไปยัง handoff ของเอเจนต์ผู้ร้องขอด้วยบริบทการเสร็จสิ้นเดียวกันแทนการทิ้ง announce
    - handoff หลักที่สำเร็จจะทำให้การส่งมอบเอเจนต์ย่อยเสร็จสิ้น แม้ว่า parent จะตัดสินใจว่าไม่จำเป็นต้องอัปเดตให้ผู้ใช้เห็นก็ตาม
    - เอเจนต์ย่อย native จะไม่ได้รับเครื่องมือข้อความ เอเจนต์เหล่านี้ส่งคืนข้อความ assistant ธรรมดาให้เอเจนต์หลัก/ผู้ร้องขอ การตอบกลับที่มนุษย์เห็นอยู่ภายใต้นโยบายการส่งมอบปกติของเอเจนต์หลัก/ผู้ร้องขอ
    - หากไม่สามารถใช้ handoff โดยตรงได้ จะ fallback ไปยังการ routing ผ่าน queue
    - หากยังไม่มีการ routing ผ่าน queue จะ retry announce ด้วย exponential backoff สั้น ๆ ก่อนยอมแพ้ขั้นสุดท้าย
    - การส่งมอบการเสร็จสิ้นจะเก็บเส้นทางผู้ร้องขอที่ resolve แล้วไว้: เส้นทางการเสร็จสิ้นที่ผูกกับเธรดหรือผูกกับการสนทนาจะชนะเมื่อมีให้ใช้ หากต้นทางการเสร็จสิ้นให้มาเพียงช่อง OpenClaw จะเติม target/account ที่ขาดจากเส้นทางที่ resolve แล้วของเซสชันผู้ร้องขอ (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งมอบโดยตรงยังทำงานได้

  </Accordion>
  <Accordion title="Completion handoff metadata">
    handoff การเสร็จสิ้นไปยังเซสชันผู้ร้องขอเป็นบริบทภายในที่ runtime สร้างขึ้น
    (ไม่ใช่ข้อความที่ผู้ใช้เขียน) และประกอบด้วย:

    - `Result` — ข้อความ reply `assistant` ล่าสุดที่มองเห็นได้จากลูก เอาต์พุต Tool/toolResult จะไม่ถูกยกระดับเข้าไปในผลลัพธ์ของลูก การรันที่ล้มเหลวแบบ terminal จะไม่ reuse ข้อความ reply ที่จับไว้
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`
    - สถิติ runtime/token แบบย่อ
    - คำสั่งรีวิวที่บอกเอเจนต์ผู้ร้องขอให้ตรวจสอบผลลัพธ์ก่อนตัดสินว่างานเดิมเสร็จแล้วหรือไม่
    - คำแนะนำติดตามผลที่บอกเอเจนต์ผู้ร้องขอให้ทำงานต่อหรือบันทึก follow-up เมื่อผลลัพธ์ของลูกยังเหลือสิ่งที่ต้องทำเพิ่มเติม
    - คำสั่งอัปเดตสุดท้ายสำหรับเส้นทางที่ไม่มีการกระทำเพิ่มเติม เขียนด้วยเสียง assistant ปกติโดยไม่ส่งต่อ metadata ภายในแบบดิบ

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` และ `--thinking` override ค่าเริ่มต้นสำหรับการรันนั้นโดยเฉพาะ
    - ใช้ `info`/`log` เพื่อตรวจสอบรายละเอียดและเอาต์พุตหลังเสร็จสิ้น
    - สำหรับเซสชันถาวรที่ผูกกับเธรด ให้ใช้ `sessions_spawn` พร้อม `thread: true` และ `mode: "session"`
    - หากช่องผู้ร้องขอไม่รองรับการผูกเธรด ให้ใช้ `mode: "run"` แทนการ retry ชุดค่าที่ผูกกับเธรดซึ่งเป็นไปไม่ได้
    - สำหรับเซสชัน harness ACP (Claude Code, Gemini CLI, OpenCode, หรือ Codex ACP/acpx แบบระบุชัด) ให้ใช้ `sessions_spawn` พร้อม `runtime: "acp"` เมื่อเครื่องมือประกาศ runtime นั้น ดู [โมเดลการส่งมอบ ACP](/th/tools/acp-agents#delivery-model) เมื่อดีบักการเสร็จสิ้นหรือ loop ระหว่างเอเจนต์ เมื่อเปิดใช้ Plugin `codex` แล้ว การควบคุมแชท/เธรด Codex ควรเลือกใช้ `/codex ...` มากกว่า ACP เว้นแต่ผู้ใช้จะขอ ACP/acpx อย่างชัดเจน
    - OpenClaw ซ่อน `runtime: "acp"` จนกว่า ACP จะเปิดใช้งาน ผู้ร้องขอไม่ได้ถูก sandbox และมีการโหลด Plugin backend เช่น `acpx` แล้ว `runtime: "acp"` คาดหวัง id ของ ACP harness ภายนอก หรือ entry `agents.list[]` ที่มี `runtime.type="acp"`; ใช้ runtime เอเจนต์ย่อยค่าเริ่มต้นสำหรับเอเจนต์ config ปกติของ OpenClaw จาก `agents_list`

  </Accordion>
</AccordionGroup>

## โหมดบริบท

เอเจนต์ย่อย native เริ่มแบบแยกออกจากกัน เว้นแต่ caller จะขอ fork
transcript ปัจจุบันอย่างชัดเจน

| โหมด       | ควรใช้เมื่อใด                                                                                                                         | พฤติกรรม                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | การค้นคว้าใหม่, การ implement ที่เป็นอิสระ, งานเครื่องมือที่ช้า, หรือสิ่งใดก็ตามที่สรุปในข้อความงานได้อย่างกระชับ                           | สร้าง transcript ลูกที่สะอาด นี่คือค่าเริ่มต้นและช่วยลดการใช้โทเค็น  |
| `fork`     | งานที่ขึ้นกับการสนทนาปัจจุบัน, ผลลัพธ์เครื่องมือก่อนหน้า, หรือคำสั่งที่มีรายละเอียดเฉพาะซึ่งมีอยู่แล้วใน transcript ของผู้ร้องขอ | แตกแขนง transcript ของผู้ร้องขอเข้าไปในเซสชันลูกก่อนที่ลูกจะเริ่ม |

ใช้ `fork` อย่างประหยัด มีไว้สำหรับการมอบหมายงานที่อ่อนไหวต่อบริบท ไม่ใช่
สิ่งทดแทนการเขียน prompt งานที่ชัดเจน

## เครื่องมือ: `sessions_spawn`

เริ่มการรันเอเจนต์ย่อยด้วย `deliver: false` บน lane `subagent` ส่วนกลาง
จากนั้นรันขั้นตอน announce และโพสต์ reply ของ announce ไปยังช่องแชท
ของผู้ร้องขอ

ความพร้อมใช้งานขึ้นกับนโยบายเครื่องมือที่มีผลของ caller โปรไฟล์ `coding` และ
`full` เปิดเผย `sessions_spawn` ตามค่าเริ่มต้น โปรไฟล์ `messaging`
ไม่เปิดเผย ให้เพิ่ม `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` หรือใช้ `tools.profile: "coding"` สำหรับเอเจนต์ที่ควรมอบหมาย
งาน นโยบาย allow/deny ของช่อง/กลุ่ม, provider, sandbox และรายเอเจนต์ยังสามารถ
ลบเครื่องมือหลังขั้นตอนโปรไฟล์ได้ ใช้ `/tools` จากเซสชันเดียวกัน
เพื่อยืนยันรายการเครื่องมือที่มีผลจริง

**ค่าเริ่มต้น:**

- **โมเดล:** เอเจนต์ย่อย native สืบทอดจาก caller เว้นแต่คุณจะตั้งค่า `agents.defaults.subagents.model` (หรือ `agents.list[].subagents.model` รายเอเจนต์) การ spawn runtime ACP ใช้โมเดล subagent ที่กำหนดค่าเดียวกันเมื่อมีอยู่ มิฉะนั้น ACP harness จะคงค่าเริ่มต้นของตัวเองไว้ `sessions_spawn.model` ที่ระบุชัดยังคงชนะ
- **Thinking:** เอเจนต์ย่อย native สืบทอดจาก caller เว้นแต่คุณจะตั้งค่า `agents.defaults.subagents.thinking` (หรือ `agents.list[].subagents.thinking` รายเอเจนต์) การ spawn runtime ACP ยังใช้ `agents.defaults.models["provider/model"].params.thinking` สำหรับโมเดลที่เลือกด้วย `sessions_spawn.thinking` ที่ระบุชัดยังคงชนะ
- **Run timeout:** OpenClaw ใช้ `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งค่า มิฉะนั้นจะ fallback เป็น `0` (ไม่มี timeout) `sessions_spawn` ไม่รับ timeout override รายการเรียก
- **การส่งมอบงาน:** เอเจนต์ย่อย native ได้รับงานที่มอบหมายในข้อความ `[Subagent Task]` แรกที่มองเห็นได้ system prompt ของเอเจนต์ย่อยมี runtime rules และบริบทการ routing ไม่ใช่สำเนาของงานที่ซ่อนไว้อีกชุดหนึ่ง

การ spawn เอเจนต์ย่อย native ที่ยอมรับแล้วจะรวม metadata โมเดลลูกที่ resolve แล้วไว้ใน
ผลลัพธ์ของเครื่องมือ: `resolvedModel` มี model ref ที่ใช้ และ
`resolvedProvider` มี provider prefix เมื่อ ref มี prefix

### โหมด prompt การมอบหมายงาน

`agents.defaults.subagents.delegationMode` ควบคุมเฉพาะคำแนะนำของ prompt เท่านั้น; ไม่ได้เปลี่ยนนโยบายเครื่องมือหรือบังคับการมอบหมายงาน

- `suggest` (ค่าเริ่มต้น): คงคำกระตุ้นมาตรฐานใน prompt ให้ใช้เอเจนต์ย่อยสำหรับงานที่ใหญ่กว่าหรือช้ากว่า
- `prefer`: บอกเอเจนต์หลักให้ตอบสนองได้ต่อเนื่องและมอบหมายสิ่งที่ซับซ้อนกว่าการตอบกลับโดยตรงผ่าน `sessions_spawn`

การ override รายเอเจนต์ใช้ `agents.list[].subagents.delegationMode`

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### พารามิเตอร์เครื่องมือ

<ParamField path="task" type="string" required>
  คำอธิบายงานสำหรับ sub-agent
</ParamField>
<ParamField path="taskName" type="string">
  แฮนเดิลเสถียรแบบไม่บังคับสำหรับระบุ child ที่เฉพาะเจาะจงในผลลัพธ์สถานะภายหลัง ต้องตรงกับ `[a-z][a-z0-9_-]{0,63}` และต้องไม่เป็นเป้าหมายที่สงวนไว้ เช่น `last` หรือ `all`
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับแบบมนุษย์อ่านได้ที่ไม่บังคับ
</ParamField>
<ParamField path="agentId" type="string">
  Spawn ภายใต้ id ของ agent ที่กำหนดค่าไว้อื่นเมื่อ `subagents.allowAgents` อนุญาต
</ParamField>
<ParamField path="cwd" type="string">
  ไดเรกทอรีทำงานของงานแบบไม่บังคับสำหรับการรัน child Native sub-agents ยังคงโหลดไฟล์ bootstrap จากพื้นที่ทำงานของ agent เป้าหมาย; `cwd` เปลี่ยนเฉพาะตำแหน่งที่เครื่องมือ runtime และ CLI harnesses ทำงานที่มอบหมาย
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ใช้เฉพาะสำหรับ ACP harnesses ภายนอก (`claude`, `droid`, `gemini`, `opencode` หรือ Codex ACP/acpx ที่ร้องขออย่างชัดเจน) และสำหรับรายการ `agents.list[]` ที่ `runtime.type` เป็น `acp`
</ParamField>
<ParamField path="resumeSessionId" type="string">
  เฉพาะ ACP เท่านั้น ดำเนินการต่อเซสชัน ACP harness ที่มีอยู่เมื่อ `runtime: "acp"`; ถูกละเว้นสำหรับการ Spawn native sub-agent
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  เฉพาะ ACP เท่านั้น สตรีมผลลัพธ์การรัน ACP ไปยังเซสชัน parent เมื่อ `runtime: "acp"`; ละไว้สำหรับการ Spawn native sub-agent
</ParamField>
<ParamField path="model" type="string">
  แทนที่โมเดลของ sub-agent ค่าที่ไม่ถูกต้องจะถูกข้าม และ sub-agent จะรันบนโมเดลเริ่มต้นพร้อมคำเตือนในผลลัพธ์ของเครื่องมือ
</ParamField>
<ParamField path="thinking" type="string">
  แทนที่ระดับการคิดสำหรับการรัน sub-agent
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  เมื่อเป็น `true` จะร้องขอการผูก channel thread สำหรับเซสชัน sub-agent นี้
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  ถ้า `thread: true` และละ `mode` ค่าเริ่มต้นจะกลายเป็น `session` `mode: "session"` ต้องใช้ `thread: true`
  หากการผูก thread ไม่พร้อมใช้งานสำหรับช่องทางของผู้ร้องขอ ให้ใช้ `mode: "run"` แทน
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` จะเก็บถาวรทันทีหลังประกาศ (ยังคงเก็บ transcript ไว้ผ่านการเปลี่ยนชื่อ)
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` ปฏิเสธการ Spawn เว้นแต่ runtime ของ child เป้าหมายจะอยู่ใน sandbox
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` แตกแขนง transcript ปัจจุบันของผู้ร้องขอเข้าสู่เซสชัน child เฉพาะ native sub-agents เท่านั้น การ Spawn ที่ผูกกับ thread ใช้ค่าเริ่มต้นเป็น `fork`; การ Spawn ที่ไม่ใช้ thread ใช้ค่าเริ่มต้นเป็น `isolated`
</ParamField>

<Warning>
`sessions_spawn` **ไม่** รับพารามิเตอร์การส่งผ่านช่องทาง (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) Native sub-agents จะรายงาน
assistant turn ล่าสุดกลับไปยังผู้ร้องขอ; การส่งภายนอกยังคงอยู่กับ
agent parent/ผู้ร้องขอ
</Warning>

### ชื่องานและการกำหนดเป้าหมาย

`taskName` เป็นแฮนเดิลที่โมเดลมองเห็นสำหรับ orchestration ไม่ใช่คีย์เซสชัน
ใช้สำหรับชื่อ child ที่เสถียร เช่น `review_subagents`,
`linux_validation` หรือ `docs_update` เมื่อ coordinator อาจต้องตรวจสอบ
child นั้นภายหลัง

การแก้ไขเป้าหมายยอมรับการตรงกับ `taskName` แบบเป๊ะและ prefix
ที่ไม่กำกวม การจับคู่ถูกจำกัดขอบเขตไว้ในหน้าต่างเป้าหมายที่ active/recent เดียวกัน
กับที่ใช้โดยเป้าหมาย `/subagents` แบบมีหมายเลข ดังนั้น child ที่เสร็จสิ้นและเก่า
จะไม่ทำให้แฮนเดิลที่นำกลับมาใช้ใหม่กำกวม หาก child ที่ active หรือ recent สองรายการ
ใช้ `taskName` เดียวกัน เป้าหมายจะกำกวม; ให้ใช้ดัชนีรายการ คีย์เซสชัน หรือ
run id แทน

เป้าหมายที่สงวนไว้ `last` และ `all` ไม่ใช่ค่า `taskName` ที่ถูกต้อง
เพราะมีความหมายในการควบคุมอยู่แล้ว

## เครื่องมือ: `sessions_yield`

สิ้นสุด model turn ปัจจุบันและรอเหตุการณ์ runtime โดยหลักคือ
เหตุการณ์การเสร็จสิ้นของ sub-agent ให้มาถึงเป็นข้อความถัดไป ใช้หลังจาก
Spawn งาน child ที่จำเป็น เมื่อผู้ร้องขอไม่สามารถสร้างคำตอบสุดท้าย
ได้จนกว่าการเสร็จสิ้นเหล่านั้นจะมาถึง

`sessions_yield` คือ primitive สำหรับการรอ อย่าแทนที่ด้วย polling
loops ผ่าน `subagents`, `sessions_list`, `sessions_history`, shell
`sleep` หรือการ polling process เพียงเพื่อตรวจจับการเสร็จสิ้นของ child

ใช้ `sessions_yield` เฉพาะเมื่อรายการเครื่องมือที่มีผลของเซสชันมี
เครื่องมือนี้อยู่ โปรไฟล์เครื่องมือแบบ minimal หรือ custom บางรายการอาจเปิดเผย `sessions_spawn` และ
`subagents` โดยไม่เปิดเผย `sessions_yield`; ในกรณีนั้น อย่าประดิษฐ์
polling loop เพียงเพื่อรอการเสร็จสิ้น

เมื่อมี active children อยู่ OpenClaw จะแทรกบล็อก prompt `Active Subagents`
ขนาดกะทัดรัดที่ runtime สร้างขึ้นเข้าไปใน turn ปกติ เพื่อให้ผู้ร้องขอเห็น
เซสชัน child ปัจจุบัน, run ids, สถานะ, ป้ายกำกับ, งาน และ
alias ของ `taskName` โดยไม่ต้อง polling ฟิลด์ task และ label ใน
บล็อกนั้นถูก quote เป็นข้อมูล ไม่ใช่คำสั่ง เพราะอาจมีต้นทาง
จากอาร์กิวเมนต์ spawn ที่ผู้ใช้/โมเดลให้มา

## เครื่องมือ: `subagents`

แสดงรายการการรัน sub-agent ที่ Spawn แล้วซึ่งเซสชันผู้ร้องขอเป็นเจ้าของ ถูกจำกัดขอบเขต
ไว้ที่ผู้ร้องขอปัจจุบัน; child จะเห็นได้เฉพาะ children ที่ตนควบคุมเองเท่านั้น

ใช้ `subagents` สำหรับสถานะแบบตามต้องการและการดีบัก ใช้ `sessions_yield` เพื่อ
รอเหตุการณ์การเสร็จสิ้น

## เซสชันที่ผูกกับ thread

เมื่อเปิดใช้การผูก thread สำหรับช่องทาง sub-agent สามารถคงการผูก
กับ thread เพื่อให้ข้อความติดตามผลของผู้ใช้ใน thread นั้นยังคงถูก route ไปยัง
เซสชัน sub-agent เดิม

### ช่องทางที่รองรับ thread

ช่องทางใดก็ตามที่มี session-binding adapter สามารถรองรับเซสชัน subagent
แบบ persistent ที่ผูกกับ thread (`sessions_spawn` พร้อม `thread: true`)
อะแดปเตอร์ที่ bundled อยู่ในปัจจุบันรวมถึง Discord threads, Matrix threads,
หัวข้อฟอรัม Telegram และการผูกบทสนทนาปัจจุบันสำหรับ Feishu
ใช้คีย์ config `threadBindings` รายช่องทางสำหรับการเปิดใช้,
timeouts และ `spawnSessions`

### โฟลว์ด่วน

<Steps>
  <Step title="Spawn">
    `sessions_spawn` พร้อม `thread: true` (และไม่บังคับ `mode: "session"`)
  </Step>
  <Step title="ผูก">
    OpenClaw สร้างหรือผูก thread กับเป้าหมายเซสชันนั้นในช่องทางที่ active
  </Step>
  <Step title="Route การติดตามผล">
    การตอบกลับและข้อความติดตามผลใน thread นั้นจะ route ไปยังเซสชันที่ผูกไว้
  </Step>
  <Step title="ตรวจสอบ timeouts">
    ใช้ `/session idle` เพื่อตรวจสอบ/อัปเดต inactivity auto-unfocus และ
    `/session max-age` เพื่อควบคุม hard cap
  </Step>
  <Step title="แยกออก">
    ใช้ `/unfocus` เพื่อแยกออกด้วยตนเอง
  </Step>
</Steps>

### การควบคุมด้วยตนเอง

| คำสั่ง            | ผลลัพธ์                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | ผูก thread ปัจจุบัน (หรือสร้างหนึ่งรายการ) กับเป้าหมาย sub-agent/session |
| `/unfocus`         | ลบการผูกสำหรับ thread ปัจจุบันที่ถูกผูกไว้                       |
| `/agents`          | แสดงรายการการรันที่ active และสถานะการผูก (`thread:<id>` หรือ `unbound`)       |
| `/session idle`    | ตรวจสอบ/อัปเดต idle auto-unfocus (เฉพาะ focused bound threads)         |
| `/session max-age` | ตรวจสอบ/อัปเดต hard cap (เฉพาะ focused bound threads)                  |

### สวิตช์ Config

- **ค่าเริ่มต้นส่วนกลาง:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- **คีย์การแทนที่ช่องทางและ spawn auto-bind** เป็นแบบเฉพาะอะแดปเตอร์ ดู [ช่องทางที่รองรับ thread](#thread-supporting-channels) ด้านบน

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) และ
[คำสั่ง Slash](/th/tools/slash-commands) สำหรับรายละเอียดอะแดปเตอร์ปัจจุบัน

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  รายการ id ของ agent ที่กำหนดค่าไว้ซึ่งสามารถกำหนดเป้าหมายผ่าน `agentId` แบบชัดเจน (`["*"]` อนุญาตเป้าหมายที่กำหนดค่าไว้ใดก็ได้) ค่าเริ่มต้น: เฉพาะ agent ผู้ร้องขอ หากคุณตั้งค่ารายการและยังต้องการให้ผู้ร้องขอ Spawn ตัวเองด้วย `agentId` ให้รวม id ของผู้ร้องขอไว้ในรายการ
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  allowlist ของ target-agent ที่กำหนดค่าไว้ตามค่าเริ่มต้น ซึ่งใช้เมื่อ agent ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตนเอง
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  บล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับการเลือกโปรไฟล์อย่างชัดเจน) การแทนที่ราย agent: `agents.list[].subagents.requireAgentId`
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  timeout รายการเรียกสำหรับความพยายามส่งประกาศ `agent` ของ gateway ค่าเป็นจำนวนเต็มบวกหน่วยมิลลิวินาที และถูก clamp ให้ไม่เกินค่าสูงสุดของ timer ที่ปลอดภัยตามแพลตฟอร์ม การ retry แบบ transient อาจทำให้เวลารอประกาศรวมยาวนานกว่า timeout ที่กำหนดค่าไว้หนึ่งครั้ง
</ParamField>

หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมาย
ที่จะรันโดยไม่อยู่ใน sandbox

### Discovery

ใช้ `agents_list` เพื่อดูว่า agent ids ใดได้รับอนุญาตในปัจจุบันสำหรับ
`sessions_spawn` คำตอบรวมโมเดลที่มีผลของ agent แต่ละรายการที่แสดง
และ metadata ของ runtime ที่ฝังไว้ เพื่อให้ผู้เรียกแยกความแตกต่างระหว่าง OpenClaw, Codex
app-server และ native runtimes อื่นที่กำหนดค่าไว้ได้

รายการ `allowAgents` ต้องชี้ไปยัง agent ids ที่กำหนดค่าไว้ใน `agents.list[]`
`["*"]` หมายถึง target agent ที่กำหนดค่าไว้ใดก็ได้รวมถึงผู้ร้องขอ หาก config ของ agent
ถูกลบแต่ id ของมันยังอยู่ใน `allowAgents`, `sessions_spawn` จะปฏิเสธ id นั้น
และ `agents_list` จะละเว้น ใช้ `openclaw doctor --fix` เพื่อล้าง
รายการ allowlist ที่เก่าแล้ว หรือเพิ่มรายการ `agents.list[]` แบบ minimal เมื่อเป้าหมายควร
ยังคง Spawn ได้ขณะสืบทอดค่าเริ่มต้น

### Auto-archive

- เซสชัน sub-agent จะถูกเก็บถาวรโดยอัตโนมัติหลังจาก `agents.defaults.subagents.archiveAfterMinutes` (ค่าเริ่มต้น `60`)
- การเก็บถาวรใช้ `sessions.delete` และเปลี่ยนชื่อ transcript เป็น `*.deleted.<timestamp>` (โฟลเดอร์เดียวกัน)
- `cleanup: "delete"` จะเก็บถาวรทันทีหลังประกาศ (ยังคงเก็บ transcript ไว้ผ่านการเปลี่ยนชื่อ)
- Auto-archive เป็นแบบ best-effort; timers ที่ค้างอยู่จะหายไปหาก gateway รีสตาร์ท
- Timeouts ของการรันที่กำหนดค่าไว้ **ไม่** auto-archive; จะหยุดเฉพาะการรันเท่านั้น เซสชันยังคงอยู่จนกว่าจะ auto-archive
- Auto-archive ใช้กับเซสชัน depth-1 และ depth-2 อย่างเท่าเทียมกัน
- การล้าง browser แยกจากการล้าง archive: แท็บ/กระบวนการ browser ที่ติดตามไว้จะถูกปิดแบบ best-effort เมื่อการรันเสร็จสิ้น แม้จะเก็บระเบียน transcript/session ไว้ก็ตาม

## Nested sub-agents

ตามค่าเริ่มต้น sub-agents ไม่สามารถ Spawn sub-agents ของตนเองได้
(`maxSpawnDepth: 1`) ตั้งค่า `maxSpawnDepth: 2` เพื่อเปิดใช้การซ้อนหนึ่งระดับ
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
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### ระดับความลึก

| ความลึก | รูปแบบคีย์เซสชัน                            | บทบาท                                          | Spawn ได้หรือไม่                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Main agent                                    | เสมอ                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrator เมื่ออนุญาต depth 2) | เฉพาะเมื่อ `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (leaf worker)                   | ไม่เคย                        |

### สายประกาศ

ผลลัพธ์ไหลย้อนกลับขึ้นไปตามสาย:

1. เวิร์กเกอร์ระดับความลึก 2 เสร็จสิ้น → ประกาศไปยังแม่ของตัวเอง (ออร์เคสเตรเตอร์ระดับความลึก 1)
2. ออร์เคสเตรเตอร์ระดับความลึก 1 ได้รับประกาศ สังเคราะห์ผลลัพธ์ เสร็จสิ้น → ประกาศไปยังหลัก
3. เอเจนต์หลักได้รับประกาศและส่งต่อไปยังผู้ใช้

แต่ละระดับจะเห็นเฉพาะประกาศจากลูกโดยตรงของตัวเองเท่านั้น

<Note>
**แนวทางปฏิบัติการ:** เริ่มงานลูกหนึ่งครั้งและรอเหตุการณ์เสร็จสิ้น
แทนการสร้างลูปโพลรอบ `sessions_list`,
`sessions_history`, `/subagents list` หรือคำสั่ง `exec` sleep
`sessions_list` และ `/subagents list` ทำให้ความสัมพันธ์ของเซสชันลูก
มุ่งเน้นที่งานที่ยังทำงานอยู่ — ลูกที่ยังทำงานจะยังคงแนบอยู่ ลูกที่สิ้นสุดแล้วจะยัง
มองเห็นได้ในหน้าต่างล่าสุดช่วงสั้น ๆ และลิงก์ลูกแบบอยู่เฉพาะในสโตร์ที่ล้าสมัยจะถูก
เพิกเฉยหลังพ้นหน้าต่างความสดใหม่ วิธีนี้ป้องกันไม่ให้เมทาดาทา `spawnedBy` /
`parentSessionKey` เก่าฟื้นลูกลวงขึ้นมาหลัง
รีสตาร์ต หากเหตุการณ์เสร็จสิ้นของลูกมาถึงหลังจากคุณส่ง
คำตอบสุดท้ายไปแล้ว การติดตามผลที่ถูกต้องคือโทเค็นเงียบตรงตัว
`NO_REPLY` / `no_reply`
</Note>

### นโยบายเครื่องมือตามระดับความลึก

- บทบาทและขอบเขตการควบคุมถูกเขียนลงในเมทาดาทาเซสชันตอน spawn วิธีนี้ป้องกันไม่ให้คีย์เซสชันแบบแบนหรือที่กู้คืนมากลับได้สิทธิ์ออร์เคสเตรเตอร์โดยไม่ตั้งใจ
- **ระดับความลึก 1 (ออร์เคสเตรเตอร์ เมื่อ `maxSpawnDepth >= 2`):** ได้รับ `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` เพื่อให้ spawn ลูกและตรวจสอบสถานะได้ เครื่องมือเซสชัน/ระบบอื่นยังคงถูกปฏิเสธ
- **ระดับความลึก 1 (ลีฟ เมื่อ `maxSpawnDepth == 1`):** ไม่มีเครื่องมือเซสชัน (พฤติกรรมเริ่มต้นปัจจุบัน)
- **ระดับความลึก 2 (เวิร์กเกอร์ลีฟ):** ไม่มีเครื่องมือเซสชัน — `sessions_spawn` ถูกปฏิเสธเสมอที่ระดับความลึก 2 ไม่สามารถ spawn ลูกต่อได้

### ขีดจำกัดการ spawn ต่อเอเจนต์

แต่ละเซสชันเอเจนต์ (ที่ระดับความลึกใดก็ได้) มีลูกที่ทำงานอยู่พร้อมกันได้ไม่เกิน `maxChildrenPerAgent`
(ค่าเริ่มต้น `5`) วิธีนี้ป้องกัน fan-out ที่ควบคุมไม่ได้
จากออร์เคสเตรเตอร์ตัวเดียว

### การหยุดแบบ cascade

การหยุดออร์เคสเตรเตอร์ระดับความลึก 1 จะหยุดลูกระดับความลึก 2
ทั้งหมดของมันโดยอัตโนมัติ:

- `/stop` ในแชตหลักจะหยุดเอเจนต์ระดับความลึก 1 ทั้งหมดและ cascade ไปยังลูกระดับความลึก 2 ของพวกมัน

## การยืนยันตัวตน

การยืนยันตัวตนของซับเอเจนต์ถูก resolve ด้วย **รหัสเอเจนต์** ไม่ใช่ด้วยประเภทเซสชัน:

- คีย์เซสชันซับเอเจนต์คือ `agent:<agentId>:subagent:<uuid>`
- สโตร์การยืนยันตัวตนถูกโหลดจาก `agentDir` ของเอเจนต์นั้น
- โปรไฟล์การยืนยันตัวตนของเอเจนต์หลักจะถูกผสานเข้ามาเป็น **fallback**; โปรไฟล์เอเจนต์จะแทนที่โปรไฟล์หลักเมื่อขัดแย้งกัน

การผสานเป็นแบบเพิ่มเข้าไป ดังนั้นโปรไฟล์หลักจึงพร้อมใช้งานเป็น
fallback เสมอ ยังไม่รองรับการแยกการยืนยันตัวตนต่อเอเจนต์อย่างสมบูรณ์

## การประกาศ

ซับเอเจนต์รายงานกลับผ่านขั้นตอนการประกาศ:

- ขั้นตอนการประกาศทำงานภายในเซสชันซับเอเจนต์ (ไม่ใช่เซสชันผู้ร้องขอ)
- หากซับเอเจนต์ตอบตรงตัวว่า `ANNOUNCE_SKIP` จะไม่มีการโพสต์อะไร
- หากข้อความผู้ช่วยล่าสุดเป็นโทเค็นเงียบตรงตัว `NO_REPLY` / `no_reply` เอาต์พุตประกาศจะถูกระงับแม้ว่าก่อนหน้านั้นจะมีความคืบหน้าที่มองเห็นได้ก็ตาม

การส่งมอบขึ้นอยู่กับระดับความลึกของผู้ร้องขอ:

- เซสชันผู้ร้องขอระดับบนสุดใช้การเรียก `agent` แบบติดตามผลพร้อมการส่งมอบภายนอก (`deliver=true`)
- เซสชันซับเอเจนต์ผู้ร้องขอแบบซ้อนจะได้รับการฉีดติดตามผลภายใน (`deliver=false`) เพื่อให้ออร์เคสเตรเตอร์สังเคราะห์ผลลัพธ์ของลูกภายในเซสชันได้
- หากเซสชันซับเอเจนต์ผู้ร้องขอแบบซ้อนหายไป OpenClaw จะ fallback ไปยังผู้ร้องขอของเซสชันนั้นเมื่อมี

สำหรับเซสชันผู้ร้องขอระดับบนสุด การส่งมอบตรงในโหมดเสร็จสิ้นจะ
resolve เส้นทางบทสนทนา/เธรดที่ผูกไว้และ hook override ก่อน จากนั้นจึงเติม
ฟิลด์ channel-target ที่ขาดจากเส้นทางที่เก็บไว้ของเซสชันผู้ร้องขอ
วิธีนี้ทำให้การเสร็จสิ้นอยู่ในแชต/หัวข้อที่ถูกต้องแม้เมื่อจุดกำเนิดการเสร็จสิ้น
ระบุเพียงช่องทางเท่านั้น

การรวมผลการเสร็จสิ้นของลูกถูกจำกัดขอบเขตไว้ที่ run ผู้ร้องขอปัจจุบันเมื่อ
สร้างผลการค้นพบการเสร็จสิ้นแบบซ้อน เพื่อป้องกันไม่ให้เอาต์พุตลูกจาก run ก่อนหน้า
ที่ล้าสมัยรั่วเข้าไปในประกาศปัจจุบัน การตอบประกาศจะรักษา
การกำหนดเส้นทางเธรด/หัวข้อเมื่อมีให้ใช้บน channel adapter

### บริบทประกาศ

บริบทประกาศถูก normalize เป็นบล็อกเหตุการณ์ภายในที่เสถียร:

| ฟิลด์          | แหล่งที่มา                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| แหล่งที่มา         | `subagent` หรือ `cron`                                                                                          |
| รหัสเซสชัน    | คีย์/รหัสเซสชันลูก                                                                                          |
| ประเภท           | ประเภทประกาศ + ป้ายกำกับงาน                                                                                    |
| สถานะ         | ได้มาจากผลลัพธ์ runtime (`success`, `error`, `timeout` หรือ `unknown`) — **ไม่ได้** อนุมานจากข้อความโมเดล |
| เนื้อหาผลลัพธ์ | ข้อความผู้ช่วยล่าสุดที่มองเห็นได้จากลูก                                                                  |
| การติดตามผล      | คำสั่งที่อธิบายว่าเมื่อใดควรตอบเทียบกับคงความเงียบ                                                           |

Run ที่ล้มเหลวในสถานะปลายทางจะรายงานสถานะล้มเหลวโดยไม่ replay
ข้อความตอบที่จับไว้ เอาต์พุต Tool/toolResult จะไม่ถูกเลื่อนขึ้นเป็นข้อความผลลัพธ์ลูก

### บรรทัดสถิติ

เพย์โหลดประกาศมีบรรทัดสถิติที่ท้ายสุด (แม้เมื่อถูก wrap):

- Runtime (เช่น `runtime 5m12s`)
- การใช้โทเค็น (input/output/total)
- ค่าใช้จ่ายโดยประมาณเมื่อกำหนดราคาโมเดลไว้ (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` และพาธ transcript เพื่อให้เอเจนต์หลักดึงประวัติผ่าน `sessions_history` หรือตรวจสอบไฟล์บนดิสก์ได้

เมทาดาทาภายในมีไว้สำหรับ orchestration เท่านั้น; คำตอบที่ผู้ใช้เห็น
ควรถูกเขียนใหม่ด้วยเสียงผู้ช่วยตามปกติ

### เหตุผลที่ควรใช้ `sessions_history`

`sessions_history` เป็นเส้นทาง orchestration ที่ปลอดภัยกว่า:

- การจำคืนของผู้ช่วยถูก normalize ก่อน: ตัดแท็ก thinking ออก; ตัด scaffolding `<relevant-memories>` / `<relevant_memories>` ออก; ตัดบล็อกเพย์โหลด XML ของ tool-call แบบข้อความล้วน (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) ออก รวมถึงเพย์โหลดที่ถูกตัดทอนและไม่ปิดอย่างสะอาด; ตัด scaffolding ของ tool-call/result ที่ถูกลดระดับและเครื่องหมายบริบทประวัติออก; ตัดโทเค็นควบคุมโมเดลที่รั่ว (`<|assistant|>`, ASCII อื่น ๆ แบบ `<|...|>`, แบบเต็มความกว้าง `<｜...｜>`) ออก; ตัด XML tool-call ของ MiniMax ที่ผิดรูปออก
- ข้อความที่มีลักษณะเหมือนข้อมูลประจำตัว/โทเค็นจะถูก redacted
- บล็อกยาวสามารถถูกตัดทอนได้
- ประวัติที่ใหญ่มากสามารถทิ้งแถวเก่ากว่า หรือแทนที่แถวที่ใหญ่เกินด้วย `[sessions_history omitted: message too large]`
- การตรวจสอบ transcript ดิบบนดิสก์เป็น fallback เมื่อคุณต้องการ transcript แบบครบทุกไบต์

## นโยบายเครื่องมือ

ซับเอเจนต์ใช้โปรไฟล์และไปป์ไลน์นโยบายเครื่องมือเดียวกันกับแม่หรือ
เอเจนต์เป้าหมายก่อน หลังจากนั้น OpenClaw จะใช้ชั้นข้อจำกัด
ของซับเอเจนต์

เมื่อไม่มี `tools.profile` ที่จำกัด ซับเอเจนต์จะได้ **เครื่องมือทั้งหมด ยกเว้น
เครื่องมือข้อความ เครื่องมือเซสชัน และเครื่องมือระบบ**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` ยังคงเป็นมุมมองการจำคืนที่มีขอบเขตและผ่านการ sanitize ที่นี่ด้วย —
ไม่ใช่การ dump transcript ดิบ

เมื่อ `maxSpawnDepth >= 2` ซับเอเจนต์ออร์เคสเตรเตอร์ระดับความลึก 1 จะได้รับ
`sessions_spawn`, `subagents`, `sessions_list` และ
`sessions_history` เพิ่มเติม เพื่อให้จัดการลูกของตัวเองได้

### Override ผ่านการกำหนดค่า

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
ชุดเครื่องมือที่ resolve แล้วให้แคบลงได้ แต่ไม่สามารถ **เพิ่มกลับ** เครื่องมือที่ถูกลบ
โดย `tools.profile` ได้ ตัวอย่างเช่น `tools.profile: "coding"` มี
`web_search`/`web_fetch` แต่ไม่มีเครื่องมือ `browser` หากต้องการให้
ซับเอเจนต์โปรไฟล์ coding ใช้ browser automation ให้เพิ่ม browser ใน
ขั้นโปรไฟล์:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

ใช้ `agents.list[].tools.alsoAllow: ["browser"]` ต่อเอเจนต์ เมื่อมีเพียง
เอเจนต์เดียวที่ควรได้ browser automation

## ภาวะพร้อมกัน

ซับเอเจนต์ใช้ lane คิวเฉพาะภายในกระบวนการ:

- **ชื่อ lane:** `subagent`
- **ภาวะพร้อมกัน:** `agents.defaults.subagents.maxConcurrent` (ค่าเริ่มต้น `8`)

## ความมีชีวิตและการกู้คืน

OpenClaw ไม่ถือว่าการไม่มี `endedAt` เป็นหลักฐานถาวรว่า
ซับเอเจนต์ยังมีชีวิตอยู่ Run ที่ยังไม่สิ้นสุดและเก่ากว่าหน้าต่าง stale-run
จะหยุดนับเป็น active/pending ใน `/subagents list`, สรุปสถานะ,
การกั้นการเสร็จสิ้นของลูกหลาน และการตรวจสอบภาวะพร้อมกันต่อเซสชัน

หลังจาก Gateway รีสตาร์ต run ที่กู้คืนมาและยังไม่สิ้นสุดแต่ล้าสมัยจะถูก prune เว้นแต่
เซสชันลูกของมันถูกทำเครื่องหมาย `abortedLastRun: true` เซสชันลูกที่
ถูก abort จากการรีสตาร์ตเหล่านั้นยังคงกู้คืนได้ผ่านโฟลว์กู้คืน orphan ของซับเอเจนต์
ซึ่งส่งข้อความ resume สังเคราะห์ก่อน
ล้างเครื่องหมาย aborted

การกู้คืนอัตโนมัติหลังรีสตาร์ตถูกจำกัดขอบเขตต่อเซสชันลูก หากซับเอเจนต์
ลูกตัวเดิมถูกยอมรับสำหรับการกู้คืน orphan ซ้ำ ๆ ภายใน
หน้าต่าง rapid re-wedge OpenClaw จะคง tombstone การกู้คืนไว้บน
เซสชันนั้นและหยุด auto-resume มันในการรีสตาร์ตภายหลัง เรียกใช้
`openclaw tasks maintenance --apply` เพื่อ reconcile ระเบียนงาน หรือ
`openclaw doctor --fix` เพื่อล้างแฟล็กการกู้คืน aborted ที่ล้าสมัยบน
เซสชันที่ถูก tombstone

<Note>
หากการ spawn ซับเอเจนต์ล้มเหลวด้วย Gateway `PAIRING_REQUIRED` /
`scope-upgrade` ให้ตรวจสอบผู้เรียก RPC ก่อนแก้ไขสถานะการจับคู่
การประสานงาน `sessions_spawn` ภายใน dispatch ในกระบวนการเมื่อ
ผู้เรียกกำลังทำงานอยู่ภายในบริบทคำขอ gateway อยู่แล้ว ดังนั้นจึง
ไม่เปิด WebSocket แบบ loopback หรือพึ่งพา baseline ขอบเขตอุปกรณ์ที่จับคู่แล้วของ CLI
ผู้เรียกนอกกระบวนการ gateway ยังคงใช้ fallback WebSocket
เป็น `client.id: "gateway-client"` พร้อม `client.mode: "backend"`
ผ่านการยืนยันตัวตนด้วย shared-token/password แบบ loopback โดยตรง ผู้เรียกระยะไกล,
`deviceIdentity` ที่ระบุชัดเจน, พาธ device-token ที่ระบุชัดเจน และไคลเอนต์ browser/node
ยังคงต้องการการอนุมัติอุปกรณ์ตามปกติสำหรับการอัปเกรดขอบเขต
</Note>

## การหยุด

- การส่ง `/stop` ในแชตผู้ร้องขอจะ abort เซสชันผู้ร้องขอและหยุด run ซับเอเจนต์ที่ทำงานอยู่ซึ่ง spawn จากเซสชันนั้น โดย cascade ไปยังลูกแบบซ้อน

## ข้อจำกัด

- การประกาศของซับเอเจนต์เป็นแบบ **best-effort** หาก gateway รีสตาร์ต งาน "ประกาศกลับ" ที่ค้างอยู่จะสูญหาย
- ซับเอเจนต์ยังคงใช้ทรัพยากรกระบวนการ gateway เดียวกัน; ให้ถือว่า `maxConcurrent` เป็นวาล์วนิรภัย
- `sessions_spawn` เป็นแบบ non-blocking เสมอ: มันคืนค่า `{ status: "accepted", runId, childSessionKey }` ทันที
- บริบทซับเอเจนต์ฉีดเฉพาะ `AGENTS.md` และ `TOOLS.md` (ไม่มี `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` หรือ `BOOTSTRAP.md`) ซับเอเจนต์แบบ Codex-native ใช้ขอบเขตเดียวกัน: `TOOLS.md` อยู่ในคำสั่งเธรด Codex ที่สืบทอดมา ขณะที่ไฟล์ persona, identity และ user ที่มีเฉพาะแม่จะถูกฉีดเป็นคำสั่งการทำงานร่วมกันระดับ turn เพื่อไม่ให้ลูก clone ไฟล์เหล่านั้น
- ระดับความลึกการซ้อนสูงสุดคือ 5 (ช่วง `maxSpawnDepth`: 1–5) แนะนำให้ใช้ระดับความลึก 2 สำหรับกรณีใช้งานส่วนใหญ่
- `maxChildrenPerAgent` จำกัดลูกที่ทำงานอยู่ต่อเซสชัน (ค่าเริ่มต้น `5`, ช่วง `1–20`)

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents)
- [ส่งเอเจนต์](/th/tools/agent-send)
- [งานเบื้องหลัง](/th/automation/tasks)
- [เครื่องมือแซนด์บ็อกซ์หลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
