---
read_when:
    - การแก้ไขข้อความ system prompt, รายการเครื่องมือ หรือส่วนเวลา/Heartbeat
    - การเปลี่ยนพฤติกรรม bootstrap ของ workspace หรือการ inject Skills
summary: system prompt ของ OpenClaw มีอะไรบ้าง และประกอบขึ้นอย่างไร
title: system prompt
x-i18n:
    generated_at: "2026-04-26T11:28:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a4dc6dfb412d62f7c81875f1bebfb21fdae432e28cc7473e1ce8f93380f93b
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw จะสร้าง system prompt แบบกำหนดเองสำหรับทุกการรันของเอเจนต์ prompt นี้เป็นของ OpenClaw **โดยตรง** และไม่ได้ใช้ prompt เริ่มต้นของ pi-coding-agent

prompt จะถูกประกอบโดย OpenClaw และ inject เข้าไปในการรันของเอเจนต์แต่ละครั้ง

Provider Plugins สามารถเพิ่มคำแนะนำสำหรับ prompt ที่รองรับ cache ได้โดยไม่ต้องแทนที่ prompt ทั้งหมดที่ OpenClaw เป็นเจ้าของ โดยรันไทม์ของ provider สามารถ:

- แทนที่ core sections แบบมีชื่อจำนวนเล็กน้อย (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inject **stable prefix** เหนือขอบเขตของ prompt cache
- inject **dynamic suffix** ใต้ขอบเขตของ prompt cache

ใช้ส่วนที่ provider เป็นเจ้าของสำหรับการปรับแต่งเฉพาะตระกูลโมเดล เก็บการแก้ไข prompt แบบ legacy `before_prompt_build` ไว้เพื่อความเข้ากันได้หรือสำหรับการเปลี่ยน prompt แบบ global จริง ๆ ไม่ใช่สำหรับพฤติกรรมปกติของ provider

overlay ของตระกูล OpenAI GPT-5 จะคงกฎการทำงานหลักให้มีขนาดเล็ก และเพิ่มคำแนะนำเฉพาะโมเดลสำหรับ persona latching, เอาต์พุตแบบกระชับ, วินัยในการใช้เครื่องมือ, การค้นหาแบบขนาน, ความครบถ้วนของสิ่งที่ต้องส่งมอบ, การตรวจสอบ, บริบทที่ขาดหาย และสุขอนามัยในการใช้ terminal tool

## โครงสร้าง

prompt ถูกออกแบบให้กระชับโดยตั้งใจ และใช้ sections แบบคงที่:

- **Tooling**: การเตือนว่า structured-tool คือแหล่งข้อมูลจริงหลัก พร้อมคำแนะนำการใช้เครื่องมือในรันไทม์
- **Execution Bias**: คำแนะนำการเดินงานต่อแบบกระชับ: ลงมือทำกับคำขอที่ทำได้ภายใน turn นี้, ทำต่อจนเสร็จหรือติดขัด, ฟื้นตัวจากผลลัพธ์เครื่องมือที่อ่อน, ตรวจสอบ state ที่เปลี่ยนแปลงได้จากของจริง และตรวจสอบก่อนสรุปผล
- **Safety**: คำเตือน guardrail แบบสั้นเพื่อหลีกเลี่ยงพฤติกรรมแสวงหาอำนาจหรือการหลบเลี่ยงการกำกับดูแล
- **Skills** (เมื่อมี): บอกโมเดลว่าจะโหลดคำแนะนำของ skill ตามต้องการอย่างไร
- **OpenClaw Self-Update**: วิธีตรวจสอบ config อย่างปลอดภัยด้วย
  `config.schema.lookup`, แพตช์ config ด้วย `config.patch`, แทนที่
  config ทั้งหมดด้วย `config.apply` และรัน `update.run` เฉพาะเมื่อผู้ใช้ร้องขออย่างชัดเจน owner-only `gateway` tool ยังปฏิเสธการเขียนทับ
  `tools.exec.ask` / `tools.exec.security` รวมถึง aliases แบบ legacy `tools.bash.*`
  ที่ถูก normalize ไปยังเส้นทาง exec ที่ได้รับการปกป้องเหล่านั้น
- **Workspace**: ไดเรกทอรีทำงาน (`agents.defaults.workspace`)
- **Documentation**: พาธในเครื่องของเอกสาร OpenClaw (repo หรือ npm package) และเวลาที่ควรอ่าน
- **Workspace Files (injected)**: ระบุว่าไฟล์ bootstrap ถูกใส่ไว้ด้านล่าง
- **Sandbox** (เมื่อเปิดใช้): ระบุรันไทม์แบบ sandboxed, พาธของ sandbox และมี elevated exec หรือไม่
- **Current Date & Time**: เวลาท้องถิ่นของผู้ใช้ เขตเวลา และรูปแบบเวลา
- **Reply Tags**: รูปแบบไวยากรณ์ของ reply tag แบบเลือกได้สำหรับ providers ที่รองรับ
- **Heartbeats**: prompt ของ Heartbeat และพฤติกรรม ack เมื่อเปิดใช้ Heartbeat สำหรับเอเจนต์เริ่มต้น
- **Runtime**: host, OS, node, model, repo root (เมื่อตรวจพบ), ระดับการคิด (หนึ่งบรรทัด)
- **Reasoning**: ระดับการมองเห็นปัจจุบัน + คำแนะนำการสลับ `/reasoning`

ส่วน Tooling ยังมีคำแนะนำในรันไทม์สำหรับงานที่ใช้เวลานานด้วย:

- ใช้ Cron สำหรับการติดตามผลในอนาคต (`check back later`, การเตือนความจำ, งานที่เกิดซ้ำ)
  แทนการใช้ลูป sleep ของ `exec`, กลเม็ดหน่วง `yieldMs` หรือการ polling
  `process` ซ้ำ ๆ
- ใช้ `exec` / `process` เฉพาะกับคำสั่งที่เริ่มตอนนี้และยังคงทำงานต่ออยู่
  ในพื้นหลัง
- เมื่อเปิดใช้ automatic completion wake ให้เริ่มคำสั่งเพียงครั้งเดียว และอาศัย
  เส้นทาง wake แบบ push เมื่อมันส่งเอาต์พุตออกมาหรือล้มเหลว
- ใช้ `process` สำหรับ logs, status, input หรือการแทรกแซงเมื่อคุณต้องการ
  ตรวจสอบคำสั่งที่กำลังทำงานอยู่
- หากงานมีขนาดใหญ่กว่า ให้ใช้ `sessions_spawn`; การเสร็จสิ้นของ sub-agent เป็นแบบ
  push-based และจะประกาศกลับไปยังผู้ร้องขอโดยอัตโนมัติ
- อย่า poll `subagents list` / `sessions_list` เป็นลูปเพียงเพื่อรอ
  การเสร็จสิ้น

เมื่อเปิดใช้ `update_plan` tool แบบทดลอง ส่วน Tooling จะบอกโมเดลด้วยว่า
ให้ใช้เฉพาะกับงานหลายขั้นตอนที่ไม่ใช่งานง่าย ๆ, ให้มีเพียงหนึ่งขั้นตอน
`in_progress` เท่านั้น และหลีกเลี่ยงการทำซ้ำแผนทั้งหมดหลังการอัปเดตแต่ละครั้ง

Safety guardrails ใน system prompt เป็นเพียงคำแนะนำเท่านั้น มันช่วยชี้นำพฤติกรรมของโมเดล แต่ไม่ได้บังคับใช้นโยบาย ใช้ tool policy, exec approvals, sandboxing และ channel allowlists สำหรับการบังคับใช้จริง; ผู้ดูแลระบบสามารถปิดสิ่งเหล่านี้ได้ตามการออกแบบ

บน channels ที่มีการ์ด/ปุ่มอนุมัติแบบเนทีฟ prompt ของรันไทม์จะแจ้งเอเจนต์ให้พึ่งพา approval UI แบบเนทีฟนั้นก่อน ควรใส่คำสั่ง `/approve` แบบแมนนวลก็ต่อเมื่อผลลัพธ์ของเครื่องมือระบุว่า chat approvals ใช้งานไม่ได้ หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียว

## โหมดของ prompt

OpenClaw สามารถเรนเดอร์ system prompts ที่เล็กลงสำหรับ sub-agents ได้ รันไทม์จะตั้งค่า
`promptMode` สำหรับแต่ละการรัน (ไม่ใช่ config ที่ผู้ใช้มองเห็นได้):

- `full` (ค่าเริ่มต้น): มีทุก sections ข้างต้น
- `minimal`: ใช้สำหรับ sub-agents; ตัด **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** และ **Heartbeats** ออก ส่วน Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (เมื่อทราบ), Runtime และ injected
  context ยังคงมีให้ใช้
- `none`: คืนค่าเพียงบรรทัดตัวตนพื้นฐาน

เมื่อ `promptMode=minimal`, prompts ที่ inject เพิ่มเติมจะถูกติดป้ายเป็น **Subagent
Context** แทน **Group Chat Context**

## การ inject bootstrap ของ workspace

ไฟล์ bootstrap จะถูกตัดให้สั้นและต่อท้ายภายใต้ **Project Context** เพื่อให้โมเดลเห็นบริบทของตัวตนและโปรไฟล์โดยไม่ต้องอ่านแบบ explicit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (เฉพาะใน workspaces ที่เพิ่งสร้างใหม่)
- `MEMORY.md` เมื่อมีอยู่

ไฟล์ทั้งหมดเหล่านี้จะถูก **inject เข้าไปใน context window** ทุก turn เว้นแต่จะมีเงื่อนไขเฉพาะไฟล์ `HEARTBEAT.md` จะถูกละไว้ในการรันปกติเมื่อปิดใช้ Heartbeat สำหรับเอเจนต์เริ่มต้น หรือ
`agents.defaults.heartbeat.includeSystemPromptSection` เป็น false ควรทำให้ไฟล์ที่ inject กระชับ — โดยเฉพาะ `MEMORY.md` ซึ่งอาจเติบโตขึ้นตามเวลาและนำไปสู่การใช้ context สูงกว่าที่คาด และเกิด Compaction บ่อยขึ้น

> **หมายเหตุ:** ไฟล์รายวัน `memory/*.md` **ไม่** เป็นส่วนหนึ่งของ bootstrap
> Project Context ปกติ ใน turn ปกติ ไฟล์เหล่านี้จะถูกเข้าถึงตามต้องการผ่าน
> เครื่องมือ `memory_search` และ `memory_get` ดังนั้นจะไม่นับรวมใน
> context window เว้นแต่โมเดลจะอ่านอย่างชัดเจน turn แบบ `/new` และ
> `/reset` ล้วนเป็นข้อยกเว้น: รันไทม์สามารถเติม daily memory ล่าสุดไว้ด้านหน้า
> เป็นบล็อก startup-context แบบใช้ครั้งเดียวสำหรับ turn แรกนั้น

ไฟล์ขนาดใหญ่จะถูกตัดพร้อม marker ขนาดสูงสุดต่อไฟล์ควบคุมด้วย
`agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) เนื้อหา bootstrap ที่ inject ทั้งหมดข้ามหลายไฟล์ถูกจำกัดด้วย `agents.defaults.bootstrapTotalMaxChars`
(ค่าเริ่มต้น: 60000) ไฟล์ที่หายไปจะ inject marker สั้น ๆ ว่าไฟล์หายไป เมื่อเกิดการตัดทอน OpenClaw สามารถ inject บล็อกคำเตือนใน Project Context ได้; ควบคุมด้วย
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
ค่าเริ่มต้น: `once`)

เซสชันของ sub-agent จะ inject เฉพาะ `AGENTS.md` และ `TOOLS.md` (ไฟล์ bootstrap อื่น
จะถูกกรองออกเพื่อให้ context ของ sub-agent มีขนาดเล็ก)

hooks ภายในสามารถดักขั้นตอนนี้ผ่าน `agent:bootstrap` เพื่อเปลี่ยนแปลงหรือแทนที่
ไฟล์ bootstrap ที่ inject (เช่น สลับ `SOUL.md` เป็น persona แบบอื่น)

หากคุณต้องการให้เอเจนต์ฟังดูทั่วไปน้อยลง ให้เริ่มจาก
[คู่มือบุคลิก SOUL.md](/th/concepts/soul)

หากต้องการตรวจสอบว่าไฟล์ที่ inject แต่ละไฟล์มีส่วนอย่างไรบ้าง (raw เทียบกับ injected, การตัดทอน รวมถึง overhead ของ schema ของเครื่องมือ) ให้ใช้ `/context list` หรือ `/context detail` ดู [Context](/th/concepts/context)

## การจัดการเวลา

system prompt จะมีส่วน **Current Date & Time** โดยเฉพาะเมื่อทราบเขตเวลาของ
ผู้ใช้ เพื่อให้ prompt cache คงเสถียร ตอนนี้ส่วนนี้จะมีเฉพาะ **เขตเวลา**
(ไม่มีนาฬิกาแบบไดนามิกหรือรูปแบบเวลา)

ใช้ `session_status` เมื่อเอเจนต์ต้องการเวลาปัจจุบัน; การ์ดสถานะ
มีบรรทัด timestamp อยู่ด้วย เครื่องมือเดียวกันนี้ยังสามารถตั้ง model override ต่อเซสชันได้แบบเลือกได้ (`model=default` ใช้ล้างค่า)

กำหนดค่าด้วย:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

ดู [วันที่และเวลา](/th/date-time) สำหรับรายละเอียดพฤติกรรมทั้งหมด

## Skills

เมื่อมี Skills ที่เข้าเกณฑ์ OpenClaw จะ inject **available skills list** แบบกระชับ
(`formatSkillsForPrompt`) ซึ่งรวม **พาธไฟล์** ของแต่ละ skill ไว้ด้วย prompt
จะสั่งให้โมเดลใช้ `read` เพื่อโหลด SKILL.md จากตำแหน่งที่ระบุไว้ (workspace, managed หรือ bundled) หากไม่มี Skills ที่เข้าเกณฑ์ ส่วน Skills จะถูกละไว้

คุณสมบัติการเข้าเกณฑ์รวมถึง metadata gates ของ skill, การตรวจสอบสภาพแวดล้อม/การกำหนดค่าของรันไทม์ และ allowlist ของ skill ที่มีผลจริงเมื่อกำหนด
`agents.defaults.skills` หรือ `agents.list[].skills`

Skills ที่มากับ Plugin จะเข้าเกณฑ์ได้ก็ต่อเมื่อ Plugin เจ้าของถูกเปิดใช้งานอยู่
สิ่งนี้ช่วยให้ tool plugins เปิดเผยคู่มือการใช้งานเชิงลึกได้ โดยไม่ต้องฝังคำแนะนำนั้นทั้งหมดลงในคำอธิบายของเครื่องมือทุกครั้งโดยตรง

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

สิ่งนี้ช่วยให้ prompt หลักมีขนาดเล็ก ขณะเดียวกันก็ยังเปิดให้ใช้ Skills แบบเจาะจงได้

งบประมาณของรายการ skills เป็นของระบบย่อย Skills:

- ค่าเริ่มต้นแบบ global: `skills.limits.maxSkillsPromptChars`
- การ override ต่อเอเจนต์: `agents.list[].skillsLimits.maxSkillsPromptChars`

ข้อความ excerpt แบบมีขอบเขตของรันไทม์ทั่วไปใช้พื้นผิวอีกชุดหนึ่ง:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

การแยกนี้ช่วยให้การกำหนดขนาดของ Skills แยกจากการกำหนดขนาดของการอ่าน/การ inject ในรันไทม์ เช่น
`memory_get`, ผลลัพธ์เครื่องมือแบบ live และการรีเฟรช AGENTS.md หลัง Compaction

## Documentation

system prompt จะมีส่วน **Documentation** เมื่อมีเอกสารในเครื่อง มันจะชี้ไปยังไดเรกทอรีเอกสาร OpenClaw ในเครื่อง (`docs/` ใน Git checkout หรือเอกสารที่มากับ npm
package) หากไม่มีเอกสารในเครื่อง จะ fallback ไปยัง
[https://docs.openclaw.ai](https://docs.openclaw.ai)

ส่วนเดียวกันนี้ยังรวมตำแหน่งซอร์สของ OpenClaw ด้วย Git checkouts จะเปิดเผย local
source root เพื่อให้เอเจนต์ตรวจสอบโค้ดได้โดยตรง ส่วน package installs จะใส่ GitHub
source URL และบอกให้เอเจนต์ไปตรวจสอบซอร์สที่นั่นเมื่อเอกสารไม่ครบหรือเก่า
prompt ยังระบุ public docs mirror, community Discord และ ClawHub
([https://clawhub.ai](https://clawhub.ai)) สำหรับการค้นหา Skills ด้วย มันบอกโมเดลให้
ดูเอกสารก่อนเสมอสำหรับพฤติกรรม คำสั่ง การกำหนดค่า หรือสถาปัตยกรรมของ OpenClaw และให้
รัน `openclaw status` เองเมื่อทำได้ (ถามผู้ใช้เฉพาะเมื่อมันเข้าถึงไม่ได้)
สำหรับการกำหนดค่าโดยเฉพาะ มันชี้ให้เอเจนต์ไปที่ action ของ `gateway` tool
`config.schema.lookup` เพื่อดูเอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำ จากนั้นไปยัง
`docs/gateway/configuration.md` และ `docs/gateway/configuration-reference.md`
สำหรับคำแนะนำในภาพกว้าง

## ที่เกี่ยวข้อง

- [รันไทม์ของเอเจนต์](/th/concepts/agent)
- [Workspace ของเอเจนต์](/th/concepts/agent-workspace)
- [เอนจิน Context](/th/concepts/context-engine)
