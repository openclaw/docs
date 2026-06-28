---
read_when:
    - คุณต้องการงานเบื้องหลังหรืองานแบบขนานผ่านเอเจนต์
    - คุณกำลังเปลี่ยน sessions_spawn หรือนโยบายเครื่องมือ sub-agent
    - คุณกำลังนำเซสชันเอเจนต์ย่อยที่ผูกกับเธรดไปใช้หรือแก้ไขปัญหา
sidebarTitle: Sub-agents
summary: สร้างการรันเอเจนต์เบื้องหลังแบบแยกเดี่ยวที่แจ้งผลลัพธ์กลับไปยังแชตของผู้ร้องขอ
title: เอเจนต์ย่อย
x-i18n:
    generated_at: "2026-06-28T00:14:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

ซับเอเจนต์คือการรันเอเจนต์เบื้องหลังที่ถูกสร้างจากการรันเอเจนต์ที่มีอยู่
ซับเอเจนต์ทำงานในเซสชันของตัวเอง (`agent:<agentId>:subagent:<uuid>`) และ
เมื่อเสร็จแล้วจะ **ประกาศ** ผลลัพธ์กลับไปยังช่องแชตของผู้ร้องขอ
การรันซับเอเจนต์แต่ละครั้งจะถูกติดตามเป็น
[งานเบื้องหลัง](/th/automation/tasks)

เป้าหมายหลัก:

- ทำให้งาน "วิจัย / งานยาว / เครื่องมือช้า" ทำงานแบบขนานโดยไม่บล็อกการรันหลัก
- แยกซับเอเจนต์ออกจากกันโดยค่าเริ่มต้น (การแยกเซสชัน + การทำ sandbox แบบเลือกได้)
- ทำให้พื้นผิวเครื่องมือใช้งานผิดได้ยาก: ซับเอเจนต์จะ **ไม่ได้** รับเครื่องมือของเซสชันโดยค่าเริ่มต้น
- รองรับความลึกของการซ้อนที่กำหนดค่าได้สำหรับรูปแบบ orchestrator

<Note>
**หมายเหตุเรื่องค่าใช้จ่าย:** โดยค่าเริ่มต้น ซับเอเจนต์แต่ละตัวมีบริบทและการใช้โทเค็นของตัวเอง
สำหรับงานหนักหรืองานซ้ำ ๆ ให้ตั้งค่าโมเดลที่ถูกกว่าสำหรับซับเอเจนต์
และคงเอเจนต์หลักไว้บนโมเดลที่มีคุณภาพสูงกว่า กำหนดค่าผ่าน
`agents.defaults.subagents.model` หรือการ override ต่อเอเจนต์ เมื่อ child
    ต้องการ transcript ปัจจุบันของผู้ร้องขอจริง ๆ เอเจนต์สามารถขอ
    `context: "fork"` ในการ spawn ครั้งนั้นได้ เซสชันซับเอเจนต์ที่ผูกกับเธรดมีค่าเริ่มต้น
    เป็น `context: "fork"` เพราะจะแตกแขนงบทสนทนาปัจจุบันไปเป็น
    เธรดติดตามผล
</Note>

## คำสั่ง Slash

ใช้ `/subagents` เพื่อตรวจสอบการรันซับเอเจนต์สำหรับ **เซสชันปัจจุบัน**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` แสดง metadata ของการรัน (สถานะ, timestamp, session id,
เส้นทาง transcript, การล้างข้อมูล) ใช้ `sessions_history` สำหรับมุมมองการเรียกคืนแบบจำกัดขอบเขต
และกรองความปลอดภัยแล้ว; ตรวจสอบเส้นทาง transcript บนดิสก์เมื่อคุณ
ต้องการ transcript ฉบับเต็มดิบ

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

เอเจนต์เริ่มซับเอเจนต์เบื้องหลังด้วย `sessions_spawn` การเสร็จสิ้นของซับเอเจนต์
จะส่งกลับเป็น event ภายในของเซสชันแม่; เอเจนต์แม่/ผู้ร้องขอจะตัดสินใจ
ว่าจำเป็นต้องมีการอัปเดตที่ผู้ใช้เห็นหรือไม่

<AccordionGroup>
  <Accordion title="การเสร็จสิ้นแบบไม่บล็อกและส่งแบบ push">
    - `sessions_spawn` ไม่บล็อก; จะคืน run id ทันที
    - เมื่อเสร็จสิ้น ซับเอเจนต์จะรายงานกลับไปยังเซสชันแม่/ผู้ร้องขอ
    - เทิร์นของเอเจนต์ที่ต้องการผลลัพธ์จาก child ควรเรียก `sessions_yield` หลังจาก spawn งานที่จำเป็นแล้ว ซึ่งจะจบเทิร์นปัจจุบันและให้ event การเสร็จสิ้นมาถึงเป็นข้อความถัดไปที่โมเดลมองเห็นได้
    - การเสร็จสิ้นเป็นแบบ push เมื่อ spawn แล้ว **อย่า** poll `/subagents list`, `sessions_list`, หรือ `sessions_history` ในลูปเพียงเพื่อรอให้เสร็จ; ตรวจสอบสถานะเฉพาะเมื่อต้องการสำหรับการมองเห็นเพื่อ debugging
    - เอาต์พุตของ child เป็นรายงาน/หลักฐานให้เอเจนต์ผู้ร้องขอสังเคราะห์ ไม่ใช่ข้อความคำสั่งที่ผู้ใช้เขียน และไม่สามารถ override นโยบายของระบบ, developer, หรือผู้ใช้ได้
    - เมื่อเสร็จสิ้น OpenClaw จะพยายามอย่างดีที่สุดเพื่อปิดแท็บเบราว์เซอร์/กระบวนการที่ติดตามไว้ซึ่งเปิดโดยเซสชันซับเอเจนต์นั้น ก่อนที่ flow การล้างข้อมูลประกาศจะดำเนินต่อ

  </Accordion>
  <Accordion title="การส่งมอบการเสร็จสิ้น">
    - OpenClaw ส่งการเสร็จสิ้นกลับไปยังเซสชันผู้ร้องขอผ่านเทิร์น `agent` พร้อมคีย์ idempotency ที่เสถียร
    - หากการรันของผู้ร้องขอยังทำงานอยู่ OpenClaw จะพยายามปลุก/นำทางการรันนั้นก่อนแทนที่จะเริ่มเส้นทางตอบกลับที่มองเห็นได้เส้นทางที่สอง
    - หากไม่สามารถปลุกผู้ร้องขอที่ยังทำงานอยู่ได้ OpenClaw จะ fallback ไปยังการ handoff ของเอเจนต์ผู้ร้องขอพร้อมบริบทการเสร็จสิ้นเดียวกัน แทนที่จะทิ้งการประกาศ
    - การ handoff ไปยังแม่ที่สำเร็จถือว่าการส่งมอบของซับเอเจนต์เสร็จสมบูรณ์ แม้เมื่อแม่ตัดสินใจว่าไม่จำเป็นต้องมีการอัปเดตที่ผู้ใช้เห็น
    - ซับเอเจนต์ native จะไม่ได้รับเครื่องมือข้อความ ซับเอเจนต์จะคืนข้อความ assistant ธรรมดาไปยังเอเจนต์แม่/ผู้ร้องขอ; การตอบกลับที่มนุษย์เห็นเป็นความรับผิดชอบของนโยบายการส่งมอบปกติของเอเจนต์แม่/ผู้ร้องขอ
    - หากไม่สามารถใช้การ handoff โดยตรงได้ จะ fallback ไปยังการ routing ผ่าน queue
    - หากการ routing ผ่าน queue ยังใช้ไม่ได้ การประกาศจะถูก retry ด้วย exponential backoff สั้น ๆ ก่อนยอมแพ้ขั้นสุดท้าย
    - การส่งมอบการเสร็จสิ้นจะคง route ของผู้ร้องขอที่ resolve แล้วไว้: route การเสร็จสิ้นที่ผูกกับเธรดหรือผูกกับบทสนทนาจะชนะเมื่อพร้อมใช้งาน; หากต้นทางการเสร็จสิ้นให้มาเฉพาะช่อง OpenClaw จะเติม target/account ที่ขาดหายจาก route ที่ resolve แล้วของเซสชันผู้ร้องขอ (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งมอบโดยตรงยังทำงานได้

  </Accordion>
  <Accordion title="Metadata การ handoff การเสร็จสิ้น">
    การ handoff การเสร็จสิ้นไปยังเซสชันผู้ร้องขอเป็นบริบทภายในที่ runtime สร้างขึ้น
    (ไม่ใช่ข้อความที่ผู้ใช้เขียน) และประกอบด้วย:

    - `Result` — ข้อความตอบกลับ `assistant` ล่าสุดที่มองเห็นได้จาก child เอาต์พุต Tool/toolResult จะไม่ถูกยกระดับเข้าไปในผลลัพธ์ของ child การรัน terminal ที่ล้มเหลวจะไม่ใช้ข้อความตอบกลับที่จับไว้ซ้ำ
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`
    - สถิติ runtime/token แบบย่อ
    - คำสั่ง review ที่บอกให้เอเจนต์ผู้ร้องขอตรวจสอบผลลัพธ์ก่อนตัดสินใจว่างานเดิมเสร็จแล้วหรือไม่
    - คำแนะนำ follow-up ที่บอกให้เอเจนต์ผู้ร้องขอดำเนินงานต่อหรือบันทึก follow-up เมื่อผลลัพธ์ของ child ยังเหลือการดำเนินการเพิ่มเติม
    - คำสั่งอัปเดตขั้นสุดท้ายสำหรับเส้นทางที่ไม่มีการดำเนินการเพิ่มเติม เขียนด้วยเสียง assistant ปกติโดยไม่ส่งต่อ metadata ภายในดิบ

  </Accordion>
  <Accordion title="โหมดและ runtime ACP">
    - `--model` และ `--thinking` override ค่าเริ่มต้นสำหรับการรันนั้นโดยเฉพาะ
    - ใช้ `info`/`log` เพื่อตรวจสอบรายละเอียดและเอาต์พุตหลังเสร็จสิ้น
    - สำหรับเซสชันถาวรที่ผูกกับเธรด ให้ใช้ `sessions_spawn` พร้อม `thread: true` และ `mode: "session"`
    - หากช่องของผู้ร้องขอไม่รองรับการผูกเธรด ให้ใช้ `mode: "run"` แทนการ retry ชุดค่าผสมที่ผูกกับเธรดซึ่งเป็นไปไม่ได้
    - สำหรับเซสชัน ACP harness (Claude Code, Gemini CLI, OpenCode, หรือ Codex ACP/acpx แบบชัดเจน) ให้ใช้ `sessions_spawn` พร้อม `runtime: "acp"` เมื่อเครื่องมือประกาศ runtime นั้น ดู [โมเดลการส่งมอบ ACP](/th/tools/acp-agents#delivery-model) เมื่อ debugging การเสร็จสิ้นหรือลูปเอเจนต์ต่อเอเจนต์ เมื่อเปิดใช้ Plugin `codex` การควบคุมแชต/เธรดของ Codex ควรใช้ `/codex ...` แทน ACP เว้นแต่ผู้ใช้จะขอ ACP/acpx อย่างชัดเจน
    - OpenClaw จะซ่อน `runtime: "acp"` จนกว่า ACP จะเปิดใช้งาน, ผู้ร้องขอไม่ได้ถูก sandbox, และมี backend Plugin เช่น `acpx` โหลดอยู่ `runtime: "acp"` คาดหวัง id ของ ACP harness ภายนอก หรือรายการ `agents.list[]` ที่มี `runtime.type="acp"`; ใช้ runtime ซับเอเจนต์เริ่มต้นสำหรับเอเจนต์ config ของ OpenClaw ปกติจาก `agents_list`

  </Accordion>
</AccordionGroup>

## โหมดบริบท

ซับเอเจนต์ native เริ่มแบบแยกออกจากกัน เว้นแต่ caller จะขอ fork
transcript ปัจจุบันอย่างชัดเจน

| โหมด       | ควรใช้เมื่อใด                                                                                                                         | พฤติกรรม                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | การวิจัยใหม่, การ implement อิสระ, งานเครื่องมือช้า, หรืออะไรก็ตามที่สามารถบรีฟในข้อความงานได้                           | สร้าง transcript ของ child ที่สะอาด นี่คือค่าเริ่มต้นและช่วยลดการใช้โทเค็น  |
| `fork`     | งานที่ขึ้นกับบทสนทนาปัจจุบัน, ผลลัพธ์เครื่องมือก่อนหน้า, หรือคำสั่งที่มี nuance ซึ่งมีอยู่แล้วใน transcript ของผู้ร้องขอ | แตกแขนง transcript ของผู้ร้องขอเข้าไปในเซสชัน child ก่อนที่ child จะเริ่ม |

ใช้ `fork` เท่าที่จำเป็น มีไว้สำหรับการมอบหมายที่ไวต่อบริบท ไม่ใช่
สิ่งทดแทนการเขียน prompt งานที่ชัดเจน

## เครื่องมือ: `sessions_spawn`

เริ่มการรันซับเอเจนต์ด้วย `deliver: false` บน lane `subagent` ส่วนกลาง
จากนั้นรันขั้นตอนประกาศและโพสต์การตอบกลับประกาศไปยังช่องแชตของผู้ร้องขอ

ความพร้อมใช้งานขึ้นกับนโยบายเครื่องมือที่มีผลของ caller โปรไฟล์ `coding` และ
`full` เปิดเผย `sessions_spawn` โดยค่าเริ่มต้น โปรไฟล์ `messaging`
ไม่เปิดเผย; เพิ่ม `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` หรือใช้ `tools.profile: "coding"` สำหรับเอเจนต์ที่ควรมอบหมาย
งาน นโยบาย allow/deny ของช่อง/กลุ่ม, provider, sandbox, และต่อเอเจนต์
ยังสามารถนำเครื่องมือออกหลังจากขั้นตอนโปรไฟล์ได้ ใช้ `/tools` จาก
เซสชันเดียวกันเพื่อยืนยันรายการเครื่องมือที่มีผล

**ค่าเริ่มต้น:**

- **โมเดล:** ซับเอเจนต์ native จะสืบทอดจาก caller เว้นแต่คุณตั้งค่า `agents.defaults.subagents.model` (หรือ `agents.list[].subagents.model` ต่อเอเจนต์) การ spawn runtime ACP ใช้โมเดลซับเอเจนต์ที่กำหนดค่าเดียวกันเมื่อมี; มิฉะนั้น ACP harness จะคงค่าเริ่มต้นของตัวเองไว้ `sessions_spawn.model` ที่ระบุชัดเจนยังคงชนะ
- **Thinking:** ซับเอเจนต์ native จะสืบทอดจาก caller เว้นแต่คุณตั้งค่า `agents.defaults.subagents.thinking` (หรือ `agents.list[].subagents.thinking` ต่อเอเจนต์) การ spawn runtime ACP ยังใช้ `agents.defaults.models["provider/model"].params.thinking` สำหรับโมเดลที่เลือกด้วย `sessions_spawn.thinking` ที่ระบุชัดเจนยังคงชนะ
- **timeout การรัน:** OpenClaw ใช้ `agents.defaults.subagents.runTimeoutSeconds` เมื่อถูกตั้งค่า; มิฉะนั้นจะ fallback เป็น `0` (ไม่มี timeout) `sessions_spawn` ไม่รับการ override timeout ต่อการเรียก
- **การส่งมอบงาน:** ซับเอเจนต์ native จะได้รับงานที่มอบหมายในข้อความ `[Subagent Task]` แรกที่มองเห็นได้ system prompt ของซับเอเจนต์มี rule ของ runtime และบริบทการ routing ไม่ใช่สำเนางานที่ซ่อนอยู่ซ้ำ

การ spawn ซับเอเจนต์ native ที่ยอมรับแล้วจะรวม metadata โมเดล child ที่ resolve แล้วใน
ผลลัพธ์ของเครื่องมือ: `resolvedModel` มี model ref ที่ใช้ และ
`resolvedProvider` มี provider prefix เมื่อ ref มี prefix

### โหมด prompt การมอบหมาย

`agents.defaults.subagents.delegationMode` ควบคุมเฉพาะคำแนะนำใน prompt; ไม่เปลี่ยนนโยบายเครื่องมือหรือบังคับการมอบหมาย

- `suggest` (ค่าเริ่มต้น): คงคำกระตุ้นใน prompt มาตรฐานให้ใช้ซับเอเจนต์สำหรับงานที่ใหญ่กว่าหรือช้ากว่า
- `prefer`: บอกเอเจนต์หลักให้ตอบสนองได้ต่อเนื่องและมอบหมายอะไรก็ตามที่ซับซ้อนกว่าการตอบโดยตรงผ่าน `sessions_spawn`

การ override ต่อเอเจนต์ใช้ `agents.list[].subagents.delegationMode`

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
  แฮนเดิลเสถียรที่ไม่บังคับสำหรับระบุลูกเฉพาะตัวในเอาต์พุตสถานะภายหลัง ต้องตรงกับ `[a-z][a-z0-9_-]{0,63}` และต้องไม่เป็นเป้าหมายที่สงวนไว้ เช่น `last` หรือ `all`
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับที่มนุษย์อ่านได้ซึ่งไม่บังคับ
</ParamField>
<ParamField path="agentId" type="string">
  สร้างภายใต้รหัสเอเจนต์อื่นที่กำหนดค่าไว้ เมื่อ `subagents.allowAgents` อนุญาต
</ParamField>
<ParamField path="cwd" type="string">
  ไดเรกทอรีทำงานของงานที่ไม่บังคับสำหรับการรันลูก Native sub-agents ยังคงโหลดไฟล์บูตสแตรปจากพื้นที่ทำงานของเอเจนต์เป้าหมาย; `cwd` เปลี่ยนเฉพาะตำแหน่งที่เครื่องมือรันไทม์และ CLI harness ทำงานที่มอบหมายเท่านั้น
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ใช้เฉพาะสำหรับ ACP harness ภายนอก (`claude`, `droid`, `gemini`, `opencode` หรือ Codex ACP/acpx ที่ร้องขออย่างชัดเจน) และสำหรับรายการ `agents.list[]` ที่มี `runtime.type` เป็น `acp`
</ParamField>
<ParamField path="resumeSessionId" type="string">
  เฉพาะ ACP เท่านั้น เริ่มเซสชัน ACP harness ที่มีอยู่ต่อเมื่อ `runtime: "acp"`; ถูกละเว้นสำหรับการสร้าง native sub-agent
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  เฉพาะ ACP เท่านั้น สตรีมเอาต์พุตการรัน ACP ไปยังเซสชันพาเรนต์เมื่อ `runtime: "acp"`; ละไว้สำหรับการสร้าง native sub-agent
</ParamField>
<ParamField path="model" type="string">
  แทนที่โมเดลของ sub-agent ค่าที่ไม่ถูกต้องจะถูกข้าม และ sub-agent จะรันบนโมเดลเริ่มต้นพร้อมคำเตือนในผลลัพธ์ของเครื่องมือ
</ParamField>
<ParamField path="thinking" type="string">
  แทนที่ระดับการคิดสำหรับการรัน sub-agent
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  เมื่อเป็น `true` จะร้องขอการผูกเธรดของช่องทางสำหรับเซสชัน sub-agent นี้
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  หากละ `thread: true` และ `mode` ไว้ ค่าเริ่มต้นจะกลายเป็น `session` `mode: "session"` ต้องมี `thread: true`
  หากการผูกเธรดไม่พร้อมใช้งานสำหรับช่องทางของผู้ร้องขอ ให้ใช้ `mode: "run"` แทน
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` เก็บถาวรทันทีหลังประกาศ (ยังคงเก็บทรานสคริปต์ไว้ผ่านการเปลี่ยนชื่อ)
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` ปฏิเสธการสร้าง เว้นแต่ว่า child runtime เป้าหมายจะอยู่ใน sandbox
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` แตกแขนงทรานสคริปต์ปัจจุบันของผู้ร้องขอเข้าไปในเซสชันลูก เฉพาะ native sub-agents เท่านั้น การสร้างแบบผูกเธรดมีค่าเริ่มต้นเป็น `fork`; การสร้างที่ไม่ใช่เธรดมีค่าเริ่มต้นเป็น `isolated`
</ParamField>

<Warning>
`sessions_spawn` **ไม่** รับพารามิเตอร์การส่งผ่านช่องทาง (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) Native sub-agents รายงาน
เทิร์นล่าสุดของ assistant กลับไปยังผู้ร้องขอ; การส่งภายนอกยังอยู่กับ
เอเจนต์พาเรนต์/ผู้ร้องขอ
</Warning>

### ชื่องานและการกำหนดเป้าหมาย

`taskName` เป็นแฮนเดิลที่โมเดลมองเห็นสำหรับการประสานงาน ไม่ใช่คีย์เซสชัน
ใช้สำหรับชื่อลูกที่เสถียร เช่น `review_subagents`,
`linux_validation` หรือ `docs_update` เมื่อผู้ประสานงานอาจต้องตรวจสอบ
ลูกนั้นในภายหลัง

การแก้เป้าหมายยอมรับ `taskName` ที่ตรงกันแบบ exact และ
คำนำหน้าที่ไม่กำกวม การจับคู่ถูกจำกัดขอบเขตไว้ในหน้าต่างเป้าหมายที่ใช้งานอยู่/ล่าสุดเดียวกัน
กับเป้าหมาย `/subagents` แบบมีหมายเลข ดังนั้นลูกที่เสร็จแล้วและเก่าจะไม่ทำให้
แฮนเดิลที่นำกลับมาใช้ใหม่กำกวม หากลูกที่ใช้งานอยู่หรือล่าสุดสองตัวใช้
`taskName` เดียวกัน เป้าหมายจะกำกวม; ให้ใช้ดัชนีรายการ คีย์เซสชัน หรือ
รหัสการรันแทน

เป้าหมายที่สงวนไว้ `last` และ `all` ไม่ใช่ค่า `taskName` ที่ถูกต้อง
เพราะมีความหมายด้านการควบคุมอยู่แล้ว

## เครื่องมือ: `sessions_yield`

จบเทิร์นโมเดลปัจจุบันและรอเหตุการณ์รันไทม์ โดยหลักคือ
เหตุการณ์การเสร็จสิ้นของ sub-agent ให้มาถึงเป็นข้อความถัดไป ใช้หลังจาก
สร้างงานลูกที่จำเป็น เมื่อผู้ร้องขอไม่สามารถสร้างคำตอบสุดท้าย
ได้จนกว่าการเสร็จสิ้นเหล่านั้นจะมาถึง

`sessions_yield` เป็น primitive สำหรับการรอ อย่าแทนที่ด้วยลูป polling
เหนือ `subagents`, `sessions_list`, `sessions_history`, shell
`sleep` หรือ process polling เพียงเพื่อจับการเสร็จสิ้นของลูก

ใช้ `sessions_yield` เฉพาะเมื่อรายการเครื่องมือที่มีผลของเซสชันมี
เครื่องมือนี้อยู่ โปรไฟล์เครื่องมือขั้นต่ำหรือแบบกำหนดเองบางรายการอาจเปิดเผย `sessions_spawn` และ
`subagents` โดยไม่เปิดเผย `sessions_yield`; ในกรณีนั้น อย่าประดิษฐ์
ลูป polling เพียงเพื่อรอการเสร็จสิ้น

เมื่อมีลูกที่ใช้งานอยู่ OpenClaw จะฉีดบล็อกพรอมป์
`Active Subagents` ขนาดกะทัดรัดที่รันไทม์สร้างขึ้นลงในเทิร์นปกติ เพื่อให้ผู้ร้องขอเห็น
เซสชันลูกปัจจุบัน รหัสการรัน สถานะ ป้ายกำกับ งาน และ
นามแฝง `taskName` ได้โดยไม่ต้อง polling ฟิลด์งานและป้ายกำกับใน
บล็อกนั้นถูก quote เป็นข้อมูล ไม่ใช่คำสั่ง เพราะอาจมีที่มาจาก
อาร์กิวเมนต์การสร้างที่ผู้ใช้/โมเดลให้มา

## เครื่องมือ: `subagents`

แสดงรายการการรัน sub-agent ที่สร้างขึ้นซึ่งเป็นของเซสชันผู้ร้องขอ ถูกจำกัดขอบเขต
ไว้ที่ผู้ร้องขอปัจจุบัน; ลูกจะเห็นได้เฉพาะลูกที่ตนควบคุมเองเท่านั้น

ใช้ `subagents` สำหรับสถานะแบบตามต้องการและการดีบัก ใช้ `sessions_yield` เพื่อ
รอเหตุการณ์การเสร็จสิ้น

## เซสชันที่ผูกกับเธรด

เมื่อเปิดใช้การผูกเธรดสำหรับช่องทาง sub-agent สามารถคงการผูก
กับเธรดได้ เพื่อให้ข้อความติดตามผลจากผู้ใช้ในเธรดนั้นยังคงถูกส่งต่อไปยัง
เซสชัน sub-agent เดิม

### ช่องทางที่รองรับเธรด

ช่องทางใดๆ ที่มีอะแดปเตอร์การผูกเซสชันสามารถรองรับ
เซสชัน subagent แบบผูกเธรดถาวร (`sessions_spawn` พร้อม `thread: true`)
อะแดปเตอร์ที่รวมมาในปัจจุบันประกอบด้วยเธรด Discord, เธรด Matrix,
หัวข้อฟอรัม Telegram และการผูกบทสนทนาปัจจุบันสำหรับ Feishu
ใช้คีย์คอนฟิก `threadBindings` รายช่องทางสำหรับการเปิดใช้,
timeout และ `spawnSessions`

### ลำดับการทำงานแบบย่อ

<Steps>
  <Step title="สร้าง">
    `sessions_spawn` พร้อม `thread: true` (และอาจมี `mode: "session"`)
  </Step>
  <Step title="ผูก">
    OpenClaw สร้างหรือผูกเธรดกับเป้าหมายเซสชันนั้นในช่องทางที่ใช้งานอยู่
  </Step>
  <Step title="ส่งต่อการติดตามผล">
    การตอบกลับและข้อความติดตามผลในเธรดนั้นจะถูกส่งต่อไปยังเซสชันที่ผูกไว้
  </Step>
  <Step title="ตรวจสอบ timeout">
    ใช้ `/session idle` เพื่อตรวจสอบ/อัปเดต auto-unfocus เมื่อไม่มีการใช้งาน และ
    `/session max-age` เพื่อควบคุมเพดานสูงสุดแบบแข็ง
  </Step>
  <Step title="แยกออก">
    ใช้ `/unfocus` เพื่อแยกออกด้วยตนเอง
  </Step>
</Steps>

### การควบคุมด้วยตนเอง

| คำสั่ง            | ผลลัพธ์                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | ผูกเธรดปัจจุบัน (หรือสร้างใหม่) กับเป้าหมาย sub-agent/เซสชัน |
| `/unfocus`         | ลบการผูกสำหรับเธรดที่ผูกอยู่ปัจจุบัน                       |
| `/agents`          | แสดงรายการการรันที่ใช้งานอยู่และสถานะการผูก (`thread:<id>` หรือ `unbound`)       |
| `/session idle`    | ตรวจสอบ/อัปเดต idle auto-unfocus (เฉพาะเธรดที่ผูกและโฟกัสอยู่)         |
| `/session max-age` | ตรวจสอบ/อัปเดตเพดานสูงสุดแบบแข็ง (เฉพาะเธรดที่ผูกและโฟกัสอยู่)                  |

### สวิตช์คอนฟิก

- **ค่าเริ่มต้นส่วนกลาง:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- **คีย์ override ของช่องทางและ spawn auto-bind** เป็นแบบเฉพาะอะแดปเตอร์ ดู [ช่องทางที่รองรับเธรด](#thread-supporting-channels) ด้านบน

ดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) และ
[คำสั่ง Slash](/th/tools/slash-commands) สำหรับรายละเอียดอะแดปเตอร์ปัจจุบัน

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  รายการรหัสเอเจนต์ที่กำหนดค่าไว้ซึ่งสามารถกำหนดเป้าหมายผ่าน `agentId` แบบชัดเจน (`["*"]` อนุญาตเป้าหมายที่กำหนดค่าไว้ใดๆ) ค่าเริ่มต้น: เฉพาะเอเจนต์ผู้ร้องขอ หากคุณตั้งค่ารายการและยังต้องการให้ผู้ร้องขอสร้างตัวเองด้วย `agentId` ให้รวมรหัสผู้ร้องขอไว้ในรายการ
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  allowlist เป้าหมายเอเจนต์ที่กำหนดค่าไว้แบบเริ่มต้น ซึ่งใช้เมื่อเอเจนต์ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตนเอง
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  บล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน) การแทนที่รายเอเจนต์: `agents.list[].subagents.requireAgentId`
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  timeout รายการละหนึ่งครั้งสำหรับความพยายามส่งประกาศ `agent` ของ gateway ค่าต้องเป็นจำนวนเต็มบวกในหน่วยมิลลิวินาที และถูกจำกัดไว้ที่ค่าสูงสุดของตัวจับเวลาที่ปลอดภัยสำหรับแพลตฟอร์ม การลองซ้ำชั่วคราวอาจทำให้เวลารอประกาศรวมยาวกว่า timeout ที่กำหนดไว้หนึ่งครั้ง
</ParamField>

หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมาย
ที่จะรันโดยไม่อยู่ใน sandbox

### การค้นพบ

ใช้ `agents_list` เพื่อดูว่ารหัสเอเจนต์ใดได้รับอนุญาตสำหรับ
`sessions_spawn` ในปัจจุบัน คำตอบมีโมเดลที่มีผลของเอเจนต์แต่ละตัวที่แสดงรายการ
และเมตาดาทารันไทม์ที่ฝังไว้ เพื่อให้ผู้เรียกแยกแยะ OpenClaw, Codex
app-server และ native runtimes อื่นๆ ที่กำหนดค่าไว้ได้

รายการ `allowAgents` ต้องชี้ไปยังรหัสเอเจนต์ที่กำหนดค่าไว้ใน `agents.list[]`
`["*"]` หมายถึงเอเจนต์เป้าหมายที่กำหนดค่าไว้ใดๆ รวมถึงผู้ร้องขอ หากคอนฟิกเอเจนต์
ถูกลบแต่รหัสยังคงอยู่ใน `allowAgents`, `sessions_spawn` จะปฏิเสธรหัสนั้น
และ `agents_list` จะละเว้นรหัสนั้น รัน `openclaw doctor --fix` เพื่อล้าง
รายการ allowlist ที่ค้างอยู่ หรือเพิ่มรายการ `agents.list[]` ขั้นต่ำเมื่อเป้าหมายควร
ยังคงสร้างได้ขณะสืบทอดค่าเริ่มต้น

### การเก็บถาวรอัตโนมัติ

- เซสชัน sub-agent จะถูกเก็บถาวรโดยอัตโนมัติหลัง `agents.defaults.subagents.archiveAfterMinutes` (ค่าเริ่มต้น `60`)
- การเก็บถาวรใช้ `sessions.delete` และเปลี่ยนชื่อทรานสคริปต์เป็น `*.deleted.<timestamp>` (โฟลเดอร์เดิม)
- `cleanup: "delete"` เก็บถาวรทันทีหลังประกาศ (ยังคงเก็บทรานสคริปต์ไว้ผ่านการเปลี่ยนชื่อ)
- การเก็บถาวรอัตโนมัติเป็นแบบ best-effort; ตัวจับเวลาที่ค้างอยู่จะหายไปหาก gateway รีสตาร์ท
- timeout การรันที่กำหนดค่าไว้ **ไม่** เก็บถาวรโดยอัตโนมัติ; เพียงหยุดการรันเท่านั้น เซสชันจะยังคงอยู่จนถึงการเก็บถาวรอัตโนมัติ
- การเก็บถาวรอัตโนมัติใช้เหมือนกันกับเซสชัน depth-1 และ depth-2
- การล้างเบราว์เซอร์แยกจากการล้างการเก็บถาวร: แท็บ/โปรเซสเบราว์เซอร์ที่ติดตามไว้จะถูกปิดแบบ best-effort เมื่อการรันเสร็จสิ้น แม้ว่าระเบียนทรานสคริปต์/เซสชันจะถูกเก็บไว้ก็ตาม

## Sub-agents แบบซ้อน

โดยค่าเริ่มต้น sub-agents ไม่สามารถสร้าง sub-agents ของตนเองได้
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

| ความลึก | รูปแบบคีย์เซสชัน                            | บทบาท                                          | สร้างได้หรือไม่                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | เอเจนต์หลัก                                    | เสมอ                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrator เมื่ออนุญาต depth 2) | เฉพาะเมื่อ `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (leaf worker)                   | ไม่เคย                        |

### สายการประกาศ

ผลลัพธ์ไหลย้อนกลับขึ้นไปตามสาย:

1. worker ระดับความลึก 2 เสร็จสิ้น → ประกาศไปยังพาเรนต์ของตน (ตัวประสานงานระดับความลึก 1)
2. ตัวประสานงานระดับความลึก 1 ได้รับการประกาศ สังเคราะห์ผลลัพธ์ เสร็จสิ้น → ประกาศไปยัง main
3. เอเจนต์ main ได้รับการประกาศและส่งต่อให้ผู้ใช้

แต่ละระดับจะเห็นเฉพาะการประกาศจากลูกโดยตรงของตนเท่านั้น

<Note>
**แนวทางการปฏิบัติงาน:** เริ่มงานลูกเพียงครั้งเดียวและรอเหตุการณ์เสร็จสิ้น
แทนการสร้างลูป polling รอบ `sessions_list`,
`sessions_history`, `/subagents list` หรือคำสั่ง sleep ของ `exec`
`sessions_list` และ `/subagents list` ทำให้ความสัมพันธ์ของเซสชันลูก
โฟกัสอยู่กับงานที่ยังทำงานอยู่ — ลูกที่ยังทำงานอยู่จะยังผูกอยู่ ลูกที่สิ้นสุดแล้วจะยัง
มองเห็นได้ในหน้าต่างล่าสุดช่วงสั้น ๆ และลิงก์ลูกที่มีเฉพาะใน store และล้าสมัยจะถูก
ละเว้นหลังพ้นหน้าต่างความสดใหม่ วิธีนี้ป้องกันไม่ให้ metadata เก่าอย่าง `spawnedBy` /
`parentSessionKey` ฟื้นลูกหลอนขึ้นมาหลัง
รีสตาร์ท หากเหตุการณ์เสร็จสิ้นของลูกมาถึงหลังจากคุณส่ง
คำตอบสุดท้ายไปแล้ว การติดตามผลที่ถูกต้องคือโทเคนเงียบแบบตรงตัว
`NO_REPLY` / `no_reply`
</Note>

### นโยบายเครื่องมือตามระดับความลึก

- บทบาทและขอบเขตการควบคุมจะถูกเขียนลงใน metadata ของเซสชันตอน spawn ซึ่งทำให้คีย์เซสชันแบบแบนหรือที่กู้คืนมาไม่เผลอได้สิทธิ์ตัวประสานงานกลับมา
- **ระดับความลึก 1 (ตัวประสานงาน เมื่อ `maxSpawnDepth >= 2`):** ได้รับ `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` เพื่อให้สามารถ spawn ลูกและตรวจสอบสถานะของลูกได้ เครื่องมือเซสชัน/ระบบอื่นยังคงถูกปฏิเสธ
- **ระดับความลึก 1 (leaf เมื่อ `maxSpawnDepth == 1`):** ไม่มีเครื่องมือเซสชัน (พฤติกรรมดีฟอลต์ปัจจุบัน)
- **ระดับความลึก 2 (worker ปลายทาง):** ไม่มีเครื่องมือเซสชัน — `sessions_spawn` จะถูกปฏิเสธเสมอที่ระดับความลึก 2 ไม่สามารถ spawn ลูกเพิ่มเติมได้

### ขีดจำกัดการ spawn ต่อเอเจนต์

แต่ละเซสชันเอเจนต์ (ในทุกระดับความลึก) สามารถมีลูกที่ active ได้สูงสุด `maxChildrenPerAgent`
(ดีฟอลต์ `5`) รายการพร้อมกัน วิธีนี้ป้องกัน fan-out ที่หลุดการควบคุม
จากตัวประสานงานเดียว

### การหยุดแบบ cascade

การหยุดตัวประสานงานระดับความลึก 1 จะหยุดลูกระดับความลึก 2
ทั้งหมดของมันโดยอัตโนมัติ:

- `/stop` ในแชต main จะหยุดเอเจนต์ระดับความลึก 1 ทั้งหมดและ cascade ไปยังลูกระดับความลึก 2 ของเอเจนต์เหล่านั้น

## การยืนยันตัวตน

auth ของเอเจนต์ย่อยถูก resolve ตาม **agent id** ไม่ใช่ตามชนิดเซสชัน:

- คีย์เซสชันเอเจนต์ย่อยคือ `agent:<agentId>:subagent:<uuid>`
- auth store ถูกโหลดจาก `agentDir` ของเอเจนต์นั้น
- โปรไฟล์ auth ของเอเจนต์ main จะถูก merge เข้ามาเป็น **fallback**; โปรไฟล์ของเอเจนต์จะ override โปรไฟล์ main เมื่อมี conflict

การ merge เป็นแบบเพิ่มเข้าไป ดังนั้นโปรไฟล์ main จะพร้อมใช้งานเป็น
fallback เสมอ ยังไม่รองรับ auth ที่แยกโดดเดี่ยวเต็มรูปแบบต่อเอเจนต์

## การประกาศ

เอเจนต์ย่อยรายงานกลับผ่านขั้นตอนประกาศ:

- ขั้นตอนประกาศทำงานภายในเซสชันเอเจนต์ย่อย (ไม่ใช่เซสชันผู้ร้องขอ)
- หากเอเจนต์ย่อยตอบกลับว่า `ANNOUNCE_SKIP` ตรงตัว จะไม่มีการโพสต์อะไร
- หากข้อความ assistant ล่าสุดเป็นโทเคนเงียบแบบตรงตัว `NO_REPLY` / `no_reply` output การประกาศจะถูกระงับ แม้ก่อนหน้านั้นจะมีความคืบหน้าที่มองเห็นได้ก็ตาม

การส่งขึ้นอยู่กับระดับความลึกของผู้ร้องขอ:

- เซสชันผู้ร้องขอระดับบนสุดใช้การเรียก `agent` แบบ follow-up พร้อมการส่งภายนอก (`deliver=true`)
- เซสชันเอเจนต์ย่อยผู้ร้องขอแบบซ้อนจะได้รับการฉีด follow-up ภายใน (`deliver=false`) เพื่อให้ตัวประสานงานสังเคราะห์ผลลัพธ์ของลูกภายในเซสชันได้
- หากเซสชันเอเจนต์ย่อยผู้ร้องขอแบบซ้อนหายไป OpenClaw จะ fallback ไปยังผู้ร้องขอของเซสชันนั้นเมื่อมีให้ใช้

สำหรับเซสชันผู้ร้องขอระดับบนสุด การส่งตรงในโหมดเสร็จสิ้นจะ
resolve route ของ conversation/thread ที่ผูกไว้และ hook override ก่อน จากนั้นเติม
ฟิลด์ channel-target ที่ขาดหายจาก route ที่จัดเก็บไว้ของเซสชันผู้ร้องขอ
วิธีนี้ทำให้ completion อยู่ในแชต/topic ที่ถูกต้อง แม้ต้นทาง completion
จะระบุเฉพาะ channel ก็ตาม

การรวบรวม completion ของลูกถูกจำกัดขอบเขตไว้กับ run ของผู้ร้องขอปัจจุบันเมื่อ
สร้าง finding ของ completion แบบซ้อน เพื่อป้องกันไม่ให้ output ของลูกจาก prior-run ที่ล้าสมัย
รั่วเข้ามาในการประกาศปัจจุบัน การตอบกลับ announce จะรักษา
routing ของ thread/topic เมื่อมีให้ใช้บน channel adapter

### บริบทการประกาศ

บริบทการประกาศถูก normalize เป็นบล็อกเหตุการณ์ภายในที่เสถียร:

| ฟิลด์          | แหล่งที่มา                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| แหล่งที่มา         | `subagent` หรือ `cron`                                                                                          |
| ID เซสชัน    | คีย์/ID เซสชันลูก                                                                                          |
| ชนิด           | ชนิดการประกาศ + ป้ายกำกับ task                                                                                    |
| สถานะ         | ได้มาจาก outcome ของ runtime (`success`, `error`, `timeout` หรือ `unknown`) — **ไม่ได้** อนุมานจากข้อความโมเดล |
| เนื้อหาผลลัพธ์ | ข้อความ assistant ล่าสุดที่มองเห็นได้จากลูก                                                                  |
| Follow-up      | คำสั่งที่อธิบายว่าเมื่อใดควรตอบกลับเทียบกับเงียบไว้                                                           |

run ที่ล้มเหลวแบบ terminal จะรายงานสถานะล้มเหลวโดยไม่ replay
ข้อความตอบกลับที่จับไว้ output ของ Tool/toolResult จะไม่ถูกยกระดับเป็นข้อความผลลัพธ์ของลูก

### บรรทัดสถิติ

payload การประกาศมีบรรทัดสถิติท้ายสุด (แม้เมื่อถูก wrap):

- Runtime (เช่น `runtime 5m12s`)
- การใช้โทเคน (input/output/total)
- ต้นทุนโดยประมาณเมื่อกำหนดราคาโมเดลไว้ (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` และ path ของ transcript เพื่อให้เอเจนต์ main fetch ประวัติผ่าน `sessions_history` หรือตรวจสอบไฟล์บนดิสก์ได้

metadata ภายในมีไว้สำหรับการประสานงานเท่านั้น การตอบกลับที่ผู้ใช้เห็น
ควรถูกเขียนใหม่ด้วยน้ำเสียง assistant ปกติ

### เหตุผลที่ควรใช้ `sessions_history`

`sessions_history` เป็นเส้นทางการประสานงานที่ปลอดภัยกว่า:

- recall ของ assistant ถูก normalize ก่อน: ตัด thinking tags ออก; ตัด scaffolding ของ `<relevant-memories>` / `<relevant_memories>` ออก; ตัดบล็อก payload XML ของ tool-call แบบ plain-text (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) ออก รวมถึง payload ที่ถูกตัดทอนและไม่เคยปิดอย่างถูกต้อง; ตัด scaffolding ของ tool-call/result ที่ถูก downgrade และ marker ของ historical-context ออก; ตัด control token ของโมเดลที่รั่วออกมา (`<|assistant|>`, ASCII อื่น ๆ แบบ `<|...|>`, full-width `<｜...｜>`) ออก; ตัด XML tool-call ของ MiniMax ที่ผิดรูปออก
- ข้อความที่คล้าย credential/token จะถูก redact
- บล็อกยาวสามารถถูกตัดทอนได้
- ประวัติที่ใหญ่มากสามารถ drop แถวเก่า หรือแทนที่แถวที่ใหญ่เกินด้วย `[sessions_history omitted: message too large]`
- ใช้ `nextOffset` เมื่อมี เพื่อ page ย้อนกลับผ่านหน้าต่าง transcript ที่เก่ากว่า
- การตรวจสอบ transcript ดิบในดิสก์เป็น fallback เมื่อคุณต้องการ transcript แบบ byte-for-byte ครบถ้วน

## นโยบายเครื่องมือ

เอเจนต์ย่อยใช้ profile และ pipeline นโยบายเครื่องมือเดียวกับพาเรนต์หรือ
เอเจนต์เป้าหมายก่อน หลังจากนั้น OpenClaw จะใช้เลเยอร์ข้อจำกัด
ของเอเจนต์ย่อย

เมื่อไม่มี `tools.profile` ที่จำกัด เอเจนต์ย่อยจะได้รับ **เครื่องมือทั้งหมด ยกเว้น
เครื่องมือ message, เครื่องมือเซสชัน และเครื่องมือระบบ**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` ยังคงเป็นมุมมอง recall ที่มีขอบเขตและผ่านการ sanitize ที่นี่เช่นกัน —
ไม่ใช่ dump transcript ดิบ

เมื่อ `maxSpawnDepth >= 2` เอเจนต์ย่อยตัวประสานงานระดับความลึก 1 จะได้รับ
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
ชุดเครื่องมือที่ resolve แล้วให้แคบลงได้ แต่ไม่สามารถ **เพิ่มกลับ** เครื่องมือที่ถูกลบออก
โดย `tools.profile` ได้ ตัวอย่างเช่น `tools.profile: "coding"` มี
`web_search`/`web_fetch` แต่ไม่มีเครื่องมือ `browser` เพื่อให้
เอเจนต์ย่อย coding-profile ใช้ browser automation ได้ ให้เพิ่ม browser ใน
ขั้น profile:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

ใช้ `agents.list[].tools.alsoAllow: ["browser"]` ต่อเอเจนต์ เมื่อมีเพียง
เอเจนต์เดียวที่ควรได้รับ browser automation

## Concurrency

เอเจนต์ย่อยใช้ lane คิวเฉพาะใน process:

- **ชื่อ lane:** `subagent`
- **Concurrency:** `agents.defaults.subagents.maxConcurrent` (ดีฟอลต์ `8`)

## Liveness และการกู้คืน

OpenClaw ไม่ถือว่าการไม่มี `endedAt` เป็นหลักฐานถาวรว่า
เอเจนต์ย่อยยังมีชีวิตอยู่ run ที่ยังไม่จบและเก่ากว่าหน้าต่าง stale-run
จะหยุดถูกนับเป็น active/pending ใน `/subagents list`, สรุปสถานะ,
gating ของ completion ของ descendant และการตรวจสอบ concurrency ต่อเซสชัน

หลังจาก gateway รีสตาร์ท run ที่กู้คืนมาและยังไม่จบซึ่งล้าสมัยจะถูก prune เว้นแต่ว่า
เซสชันลูกของ run นั้นถูกทำเครื่องหมาย `abortedLastRun: true`
เซสชันลูกที่ถูก abort จากการรีสตาร์ทเหล่านั้นยังคงกู้คืนได้ผ่าน flow การกู้คืน orphan ของเอเจนต์ย่อย
ซึ่งส่งข้อความ resume สังเคราะห์ก่อน
ล้าง marker aborted

การกู้คืนอัตโนมัติหลังรีสตาร์ทมีขอบเขตต่อเซสชันลูก หากลูกเอเจนต์ย่อยรายเดิม
ถูกยอมรับสำหรับการกู้คืน orphan ซ้ำ ๆ ภายใน
หน้าต่าง rapid re-wedge OpenClaw จะ persist tombstone การกู้คืนบน
เซสชันนั้นและหยุด auto-resume ในการรีสตาร์ทภายหลัง ให้รัน
`openclaw tasks maintenance --apply` เพื่อ reconcile record ของ task หรือ
`openclaw doctor --fix` เพื่อล้าง flag การกู้คืน aborted ที่ล้าสมัยบน
เซสชันที่ถูก tombstone

<Note>
หากการ spawn เอเจนต์ย่อยล้มเหลวด้วย Gateway `PAIRING_REQUIRED` /
`scope-upgrade` ให้ตรวจสอบ RPC caller ก่อนแก้ไขสถานะ pairing
การประสานงาน `sessions_spawn` ภายในจะ dispatch ใน process เมื่อ
caller กำลังทำงานอยู่ภายใน request context ของ gateway อยู่แล้ว ดังนั้นจึง
ไม่เปิด loopback WebSocket หรือพึ่งพา baseline scope ของ paired-device จาก CLI
caller ที่อยู่นอก process ของ gateway ยังคงใช้ WebSocket
fallback เป็น `client.id: "gateway-client"` พร้อม `client.mode: "backend"`
ผ่าน auth แบบ direct loopback shared-token/password caller ระยะไกล,
`deviceIdentity` แบบ explicit, path ของ device-token แบบ explicit และ client แบบ browser/node
ยังต้องได้รับการอนุมัติอุปกรณ์ตามปกติสำหรับ scope upgrade
</Note>

## การหยุด

- การส่ง `/stop` ในแชตผู้ร้องขอจะ abort เซสชันผู้ร้องขอและหยุด run ของเอเจนต์ย่อยที่ active ซึ่ง spawn จากเซสชันนั้น โดย cascade ไปยังลูกที่ซ้อนอยู่

## ข้อจำกัด

- การประกาศของเอเจนต์ย่อยเป็นแบบ **best-effort** หาก gateway รีสตาร์ท งาน "announce back" ที่ค้างอยู่จะสูญหาย
- เอเจนต์ย่อยยังคงแชร์ resource ของ process gateway เดียวกัน ให้ถือว่า `maxConcurrent` เป็น safety valve
- `sessions_spawn` เป็นแบบ non-blocking เสมอ: มันคืนค่า `{ status: "accepted", runId, childSessionKey }` ทันที
- บริบทของเอเจนต์ย่อยจะ inject เฉพาะ `AGENTS.md` และ `TOOLS.md` (ไม่มี `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` หรือ `BOOTSTRAP.md`) subagents แบบ Codex-native จะทำตามขอบเขตเดียวกัน: `TOOLS.md` จะอยู่ในคำสั่ง thread ของ Codex ที่สืบทอดมา ส่วนไฟล์ persona, identity และ user ที่เป็นของพาเรนต์เท่านั้นจะถูก inject เป็นคำสั่ง collaboration แบบจำกัดเฉพาะ turn เพื่อไม่ให้ลูก clone ไฟล์เหล่านั้น
- ระดับความลึกสูงสุดของการซ้อนคือ 5 (ช่วงของ `maxSpawnDepth`: 1–5) แนะนำระดับความลึก 2 สำหรับกรณีใช้งานส่วนใหญ่
- `maxChildrenPerAgent` จำกัดจำนวนลูกที่ active ต่อเซสชัน (ดีฟอลต์ `5`, ช่วง `1–20`)

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents)
- [การส่ง Agent](/th/tools/agent-send)
- [งานเบื้องหลัง](/th/automation/tasks)
- [เครื่องมือ sandbox แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
