---
read_when:
    - การแก้ไขข้อความ system prompt, รายการเครื่องมือ หรือส่วนเวลา/Heartbeat
    - การเปลี่ยน bootstrap ของเวิร์กสเปซหรือพฤติกรรมการ inject Skills
summary: สิ่งที่อยู่ใน system prompt ของ OpenClaw และวิธีที่ระบบประกอบมันขึ้นมา
title: system prompt
x-i18n:
    generated_at: "2026-04-25T13:46:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a0717788885521848e3ef9508e3eb5bc5a8ad39f183f0ab2ce0d4cb971cb2df
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw จะสร้าง system prompt แบบกำหนดเองสำหรับการรันของ Agent ทุกครั้ง prompt นี้ **เป็นของ OpenClaw** และไม่ได้ใช้ prompt เริ่มต้นของ pi-coding-agent

prompt จะถูกประกอบโดย OpenClaw และ inject เข้าไปในการรันของ Agent แต่ละครั้ง

Plugin ของผู้ให้บริการสามารถเพิ่มคำแนะนำสำหรับ prompt ที่รองรับแคชได้โดยไม่ต้องแทนที่
prompt แบบเต็มที่ OpenClaw เป็นเจ้าของ โดย runtime ของผู้ให้บริการสามารถ:

- แทนที่ core section ที่มีชื่ออยู่ชุดเล็ก ๆ (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inject **stable prefix** เหนือขอบเขต prompt cache
- inject **dynamic suffix** ใต้ขอบเขต prompt cache

ใช้การเพิ่มเนื้อหาที่ผู้ให้บริการเป็นเจ้าของสำหรับการปรับแต่งเฉพาะตระกูลโมเดล ให้คง
การกลายพันธุ์ prompt แบบเดิมผ่าน `before_prompt_build` ไว้เพื่อความเข้ากันได้
หรือสำหรับการเปลี่ยนแปลง prompt ระดับ global จริง ๆ ไม่ใช่พฤติกรรมของผู้ให้บริการตามปกติ

overlay ของตระกูล OpenAI GPT-5 จะคงกฎ execution หลักให้มีขนาดเล็ก และเพิ่ม
คำแนะนำเฉพาะโมเดลสำหรับการยึด persona, เอาต์พุตที่กระชับ, วินัยในการใช้เครื่องมือ,
การค้นหาแบบขนาน, ความครบถ้วนของสิ่งส่งมอบ, การตรวจสอบความถูกต้อง, บริบทที่ขาดหาย และ
สุขอนามัยของเครื่องมือ terminal

## โครงสร้าง

prompt ถูกออกแบบให้กะทัดรัดโดยเจตนา และใช้ส่วนคงที่:

- **Tooling**: การเตือนว่าข้อมูลอ้างอิงที่ถูกต้องคือ structured-tool พร้อมคำแนะนำ runtime สำหรับการใช้เครื่องมือ
- **Execution Bias**: คำแนะนำแบบย่อเกี่ยวกับการทำงานให้ครบ: ลงมือในเทิร์นปัจจุบันกับคำขอที่ดำเนินการได้, ทำต่อจนเสร็จหรือจนติดขัด, กู้คืนเมื่อผลลัพธ์จากเครื่องมืออ่อนแอ, ตรวจสอบสถานะที่เปลี่ยนแปลงได้แบบสด และตรวจสอบก่อนสรุป
- **Safety**: ข้อเตือนสั้น ๆ เรื่อง guardrail เพื่อหลีกเลี่ยงพฤติกรรมแสวงหาอำนาจหรือหลีกเลี่ยงการกำกับดูแล
- **Skills** (เมื่อมี): บอกโมเดลว่าจะโหลดคำสั่งของ skill ตามต้องการอย่างไร
- **OpenClaw Self-Update**: วิธีตรวจสอบ config อย่างปลอดภัยด้วย
  `config.schema.lookup`, แพตช์ config ด้วย `config.patch`, แทนที่
  config ทั้งหมดด้วย `config.apply`, และรัน `update.run` เฉพาะเมื่อผู้ใช้
  ร้องขออย่างชัดเจน เครื่องมือ `gateway` ที่ใช้ได้เฉพาะ owner ยังปฏิเสธการเขียนทับ
  `tools.exec.ask` / `tools.exec.security` รวมถึง alias แบบเดิม `tools.bash.*`
  ที่ normalize ไปยังพาธ exec ที่ได้รับการปกป้องเหล่านั้น
- **Workspace**: ไดเรกทอรีทำงาน (`agents.defaults.workspace`)
- **Documentation**: พาธภายในเครื่องไปยังเอกสารของ OpenClaw (repo หรือ npm package) และเวลาที่ควรอ่าน
- **Workspace Files (injected)**: ระบุว่าไฟล์ bootstrap ถูกรวมไว้ด้านล่าง
- **Sandbox** (เมื่อเปิดใช้): ระบุ runtime แบบ sandboxed, พาธ sandbox และมี elevated exec หรือไม่
- **Current Date & Time**: เวลาท้องถิ่นของผู้ใช้, timezone และรูปแบบเวลา
- **Reply Tags**: ไวยากรณ์ reply tag แบบไม่บังคับสำหรับผู้ให้บริการที่รองรับ
- **Heartbeats**: prompt ของ Heartbeat และพฤติกรรม ack เมื่อเปิดใช้ Heartbeat สำหรับ Agent เริ่มต้น
- **Runtime**: โฮสต์, OS, node, โมเดล, รูท repo (เมื่อตรวจพบ), ระดับการคิด (หนึ่งบรรทัด)
- **Reasoning**: ระดับการมองเห็นปัจจุบัน + คำใบ้การสลับ /reasoning

ส่วน Tooling ยังมีคำแนะนำ runtime สำหรับงานที่ใช้เวลานาน:

- ใช้ Cron สำหรับการติดตามในอนาคต (`check back later`, การเตือน, งานที่เกิดซ้ำ)
  แทนลูป sleep ของ `exec`, เทคนิคหน่วง `yieldMs`, หรือการ polling `process`
  ซ้ำ ๆ
- ใช้ `exec` / `process` เฉพาะกับคำสั่งที่ต้องเริ่มตอนนี้และทำงานต่อใน
  background
- เมื่อเปิดใช้ automatic completion wake ให้เริ่มคำสั่งเพียงครั้งเดียวและอาศัย
  เส้นทาง wake แบบ push เมื่อมันส่งเอาต์พุตหรือเกิดความล้มเหลว
- ใช้ `process` สำหรับ log, สถานะ, อินพุต หรือการแทรกแซง เมื่อคุณต้องการ
  ตรวจสอบคำสั่งที่กำลังรัน
- หากงานมีขนาดใหญ่กว่า ให้เลือก `sessions_spawn`; การเสร็จสิ้นของ sub-agent เป็น
  แบบ push-based และประกาศกลับไปยังผู้ร้องขอโดยอัตโนมัติ
- อย่า polling `subagents list` / `sessions_list` เป็นลูปเพียงเพื่อรอ
  การเสร็จสิ้น

เมื่อเปิดใช้เครื่องมือทดลอง `update_plan`, Tooling จะบอกโมเดลด้วยว่า
ให้ใช้เฉพาะกับงานหลายขั้นตอนที่ไม่ง่ายนัก, รักษาให้มีเพียงหนึ่งขั้นที่เป็น
`in_progress` และหลีกเลี่ยงการทำซ้ำแผนทั้งหมดหลังการอัปเดตแต่ละครั้ง

guardrail ด้าน Safety ใน system prompt เป็นเพียงคำแนะนำ พวกมันชี้นำพฤติกรรมของโมเดลแต่ไม่บังคับใช้นโยบาย ใช้นโยบายเครื่องมือ, exec approvals, sandboxing และ allowlist ของช่องทางสำหรับการบังคับใช้แบบเข้มงวด; ผู้ดูแลระบบสามารถปิดสิ่งเหล่านี้ได้ตามการออกแบบ

บนช่องทางที่มี approval card/button แบบเนทีฟ prompt ของ runtime จะบอกเอเจนต์ให้พึ่ง
UI การอนุมัติแบบเนทีฟนั้นก่อน ควรใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อ
ผลลัพธ์ของเครื่องมือบอกว่าไม่มี chat approval หรือเส้นทางเดียวคือการอนุมัติแบบ manual

## โหมด prompt

OpenClaw สามารถเรนเดอร์ system prompt ที่เล็กลงสำหรับ sub-agent ได้ runtime จะตั้งค่า
`promptMode` สำหรับการรันแต่ละครั้ง (ไม่ใช่ config ที่ผู้ใช้เห็น):

- `full` (ค่าเริ่มต้น): รวมทุกส่วนข้างต้น
- `minimal`: ใช้สำหรับ sub-agent; ตัด **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** และ **Heartbeats** ออก Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (เมื่อทราบ), Runtime และบริบทที่ inject
  ไว้ยังคงใช้งานได้
- `none`: คืนค่าเฉพาะบรรทัด identity พื้นฐาน

เมื่อ `promptMode=minimal`, prompt เพิ่มเติมที่ inject จะมีป้ายกำกับเป็น **Subagent
Context** แทน **Group Chat Context**

## การ inject bootstrap ของเวิร์กสเปซ

ไฟล์ bootstrap จะถูกตัดแต่งและต่อท้ายใต้ **Project Context** เพื่อให้โมเดลเห็นบริบท identity และโปรไฟล์โดยไม่ต้องอ่านอย่างชัดเจน:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (เฉพาะในเวิร์กสเปซใหม่เอี่ยม)
- `MEMORY.md` เมื่อมีอยู่

ไฟล์ทั้งหมดเหล่านี้จะถูก **inject เข้าไปใน context window** ทุกเทิร์น เว้นแต่
จะมีเงื่อนไขเฉพาะไฟล์ `HEARTBEAT.md` จะถูกละเว้นในการรันปกติเมื่อ
ปิดใช้ Heartbeat สำหรับ Agent เริ่มต้น หรือ
`agents.defaults.heartbeat.includeSystemPromptSection` เป็น false ให้เก็บ
ไฟล์ที่ inject ไว้ให้กระชับ — โดยเฉพาะ `MEMORY.md` ซึ่งอาจโตขึ้นตามเวลาและทำให้
การใช้บริบทสูงขึ้นอย่างไม่คาดคิดและเกิด Compaction บ่อยขึ้น

> **หมายเหตุ:** ไฟล์รายวัน `memory/*.md` **ไม่ใช่** ส่วนหนึ่งของ bootstrap
> Project Context ปกติ ในเทิร์นทั่วไปจะเข้าถึงตามต้องการผ่าน
> เครื่องมือ `memory_search` และ `memory_get` ดังนั้นจึงไม่นับรวมใน
> context window เว้นแต่ว่าโมเดลจะอ่านมันอย่างชัดเจน เทิร์น `/new` และ
> `/reset` แบบเปล่าคือข้อยกเว้น: runtime สามารถเติมหน่วยความจำรายวันล่าสุด
> ไว้ข้างหน้าในฐานะบล็อก startup-context แบบใช้ครั้งเดียวสำหรับเทิร์นแรกนั้น

ไฟล์ขนาดใหญ่จะถูกตัดทอนพร้อม marker ขนาดสูงสุดต่อไฟล์ควบคุมโดย
`agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) เนื้อหา bootstrap ที่ inject
รวมกันข้ามไฟล์ทั้งหมดถูกจำกัดด้วย `agents.defaults.bootstrapTotalMaxChars`
(ค่าเริ่มต้น: 60000) ไฟล์ที่ไม่มีอยู่จะ inject marker สั้น ๆ ว่าไฟล์หายไป เมื่อเกิดการตัดทอน
OpenClaw สามารถ inject บล็อกคำเตือนใน Project Context ได้; ควบคุมสิ่งนี้ด้วย
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
ค่าเริ่มต้น: `once`)

เซสชันของ sub-agent จะ inject เฉพาะ `AGENTS.md` และ `TOOLS.md` (ไฟล์ bootstrap อื่น
จะถูกกรองออกเพื่อให้บริบทของ sub-agent มีขนาดเล็ก)

hook ภายในสามารถดักขั้นตอนนี้ผ่าน `agent:bootstrap` เพื่อกลายพันธุ์หรือแทนที่
ไฟล์ bootstrap ที่ inject (ตัวอย่างเช่น สลับ `SOUL.md` เป็น persona ทางเลือก)

หากคุณต้องการให้เอเจนต์ฟังดูทั่วไปน้อยลง ให้เริ่มจาก
[SOUL.md Personality Guide](/th/concepts/soul)

หากต้องการตรวจสอบว่าไฟล์ที่ inject แต่ละไฟล์มีส่วนร่วมมากน้อยเพียงใด (ดิบเทียบกับที่ inject, การตัดทอน รวมถึง overhead ของ schema เครื่องมือ) ให้ใช้ `/context list` หรือ `/context detail` ดู [Context](/th/concepts/context)

## การจัดการเวลา

system prompt จะมีส่วน **Current Date & Time** โดยเฉพาะเมื่อทราบ timezone ของผู้ใช้ เพื่อให้ prompt cache คงที่ ตอนนี้ส่วนนี้จะมีเฉพาะ **time zone** (ไม่มีนาฬิกาแบบ dynamic หรือรูปแบบเวลา)

ใช้ `session_status` เมื่อเอเจนต์ต้องการเวลาปัจจุบัน; status card จะมีบรรทัด timestamp อยู่ด้วย เครื่องมือเดียวกันนี้ยังสามารถตั้งค่า model override รายเซสชันได้แบบไม่บังคับ (`model=default` จะล้างค่า)

กำหนดค่าด้วย:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

ดู [Date & Time](/th/date-time) สำหรับรายละเอียดพฤติกรรมแบบเต็ม

## Skills

เมื่อมี Skills ที่เข้าเกณฑ์ OpenClaw จะ inject **รายการ Skills ที่พร้อมใช้งาน**
แบบย่อ (`formatSkillsForPrompt`) ซึ่งรวม **พาธไฟล์** สำหรับแต่ละ skill prompt จะ
สั่งโมเดลให้ใช้ `read` เพื่อโหลด SKILL.md จากตำแหน่งที่แสดงไว้ (เวิร์กสเปซ, แบบ managed หรือแบบ bundled) หากไม่มี skill ที่เข้าเกณฑ์ ส่วน Skills จะถูกละเว้น

การเข้าเกณฑ์รวมถึง gate จาก metadata ของ skill, การตรวจสอบ environment/config ของ runtime และ allowlist ของ skill ที่มีผลกับ Agent เมื่อมีการกำหนด `agents.defaults.skills` หรือ
`agents.list[].skills`

Skills ที่มาพร้อม Plugin จะเข้าเกณฑ์ก็ต่อเมื่อ Plugin เจ้าของถูกเปิดใช้งาน
วิธีนี้ทำให้ Plugin เครื่องมือสามารถเปิดเผยคู่มือการใช้งานเชิงลึกมากขึ้นโดยไม่ต้องฝัง
คำแนะนำทั้งหมดนั้นลงในคำอธิบายของเครื่องมือทุกครั้งโดยตรง

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

สิ่งนี้ทำให้ prompt พื้นฐานยังมีขนาดเล็ก ขณะเดียวกันก็ยังเปิดให้ใช้ skill แบบเจาะจงได้

งบประมาณของรายการ skills เป็นของระบบ skills:

- ค่าเริ่มต้นแบบ global: `skills.limits.maxSkillsPromptChars`
- การเขียนทับราย Agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

excerpt runtime แบบมีขอบเขตทั่วไปใช้พื้นผิวอีกชุดหนึ่ง:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

การแยกนี้ทำให้การกำหนดขนาดของ skills แยกจากการกำหนดขนาด read/injection ของ runtime เช่น
`memory_get`, ผลลัพธ์ของเครื่องมือแบบ live และการรีเฟรช AGENTS.md หลัง Compaction

## Documentation

system prompt มีส่วน **Documentation** เมื่อมี docs ภายในเครื่อง ส่วนนี้จะ
ชี้ไปยังไดเรกทอรี docs ของ OpenClaw ในเครื่อง (`docs/` ใน Git checkout หรือ docs ที่มาพร้อม npm
package) หากไม่มี docs ในเครื่อง ระบบจะ fallback ไปที่
[https://docs.openclaw.ai](https://docs.openclaw.ai)

ส่วนเดียวกันนี้ยังรวมตำแหน่ง source ของ OpenClaw ด้วย Git checkout จะเปิดเผย
รูท source ในเครื่อง เพื่อให้เอเจนต์ตรวจสอบโค้ดได้โดยตรง การติดตั้งแบบ package จะมี URL
source บน GitHub และบอกเอเจนต์ให้ตรวจสอบ source ที่นั่นเมื่อ docs ไม่ครบถ้วนหรือ
ล้าสมัย prompt ยังระบุ docs mirror สาธารณะ, Discord ของชุมชน และ ClawHub
([https://clawhub.ai](https://clawhub.ai)) สำหรับการค้นหา Skills ด้วย มันจะบอกโมเดลให้
ปรึกษา docs ก่อนสำหรับพฤติกรรม คำสั่ง การกำหนดค่า หรือสถาปัตยกรรมของ OpenClaw และให้
รัน `openclaw status` เองเมื่อเป็นไปได้ (ถามผู้ใช้เฉพาะเมื่อไม่มีสิทธิ์เข้าถึง)

## ที่เกี่ยวข้อง

- [Agent runtime](/th/concepts/agent)
- [Agent workspace](/th/concepts/agent-workspace)
- [Context engine](/th/concepts/context-engine)
