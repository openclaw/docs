---
read_when:
    - การแก้ไขข้อความพรอมต์ระบบ รายการเครื่องมือ หรือส่วนเวลา/Heartbeat
    - การเปลี่ยนพฤติกรรมการบูตสแตรปพื้นที่ทำงานหรือการฉีด Skills
summary: พรอมป์ระบบของ OpenClaw ประกอบด้วยอะไรและถูกประกอบขึ้นอย่างไร
title: พรอมต์ระบบ
x-i18n:
    generated_at: "2026-05-02T20:43:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw สร้าง system prompt แบบกำหนดเองสำหรับการรัน agent ทุกครั้ง prompt นี้เป็นของ **OpenClaw** และไม่ได้ใช้ prompt เริ่มต้นของ pi-coding-agent

prompt จะถูกประกอบโดย OpenClaw และฉีดเข้าไปในการรัน agent แต่ละครั้ง

provider plugins สามารถเพิ่มคำแนะนำ prompt ที่รู้จัก cache ได้โดยไม่ต้องแทนที่
prompt เต็มที่เป็นของ OpenClaw runtime ของ provider สามารถ:

- แทนที่ชุดเล็กของ core sections ที่มีชื่อ (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ฉีด **stable prefix** เหนือขอบเขต prompt cache
- ฉีด **dynamic suffix** ใต้ขอบเขต prompt cache

ใช้ contribution ที่ provider เป็นเจ้าของสำหรับการปรับแต่งเฉพาะตระกูลโมเดล เก็บการกลายพันธุ์ prompt แบบเดิม
`before_prompt_build` ไว้เพื่อความเข้ากันได้หรือการเปลี่ยนแปลง prompt แบบทั่วทั้งระบบจริง ๆ
ไม่ใช่พฤติกรรม provider ปกติ

overlay ของตระกูล OpenAI GPT-5 ทำให้กฎการทำงานหลักเล็กลงและเพิ่ม
คำแนะนำเฉพาะโมเดลสำหรับการยึด persona, output ที่กระชับ, วินัยการใช้ tool,
การ lookup แบบขนาน, ความครอบคลุมของ deliverable, การตรวจสอบ, context ที่ขาดหาย, และ
สุขอนามัยของ terminal-tool

## โครงสร้าง

prompt ถูกออกแบบให้กระชับและใช้ส่วนคงที่:

- **Tooling**: คำเตือน structured-tool ว่าเป็นแหล่งความจริง พร้อมคำแนะนำ runtime สำหรับการใช้ tool
- **Execution Bias**: คำแนะนำ follow-through แบบกระชับ: ลงมือในเทิร์นสำหรับ
  คำขอที่ทำได้ทันที, ทำต่อจนเสร็จหรือถูกบล็อก, กู้คืนจากผลลัพธ์ tool ที่อ่อน,
  ตรวจสอบสถานะที่เปลี่ยนได้แบบสด, และตรวจสอบก่อน finalizing
- **Safety**: คำเตือน guardrail สั้น ๆ เพื่อหลีกเลี่ยงพฤติกรรมแสวงหาอำนาจหรือการเลี่ยงการกำกับดูแล
- **Skills** (เมื่อมี): บอกโมเดลว่าจะโหลดคำแนะนำ skill ตามต้องการอย่างไร
- **OpenClaw Self-Update**: วิธีตรวจ config อย่างปลอดภัยด้วย
  `config.schema.lookup`, patch config ด้วย `config.patch`, แทนที่ config ทั้งหมด
  ด้วย `config.apply`, และรัน `update.run` เฉพาะเมื่อผู้ใช้ขออย่างชัดเจนเท่านั้น
  tool `gateway` สำหรับ owner-only ยังปฏิเสธการเขียนใหม่
  `tools.exec.ask` / `tools.exec.security` รวมถึง alias เดิม `tools.bash.*`
  ที่ normalize ไปยัง exec paths ที่ป้องกันไว้เหล่านั้น
- **Workspace**: working directory (`agents.defaults.workspace`)
- **Documentation**: path ภายในเครื่องไปยังเอกสาร OpenClaw (repo หรือ npm package) และควรอ่านเมื่อใด
- **Workspace Files (injected)**: ระบุว่า bootstrap files ถูกรวมไว้ด้านล่าง
- **Sandbox** (เมื่อเปิดใช้): ระบุ runtime แบบ sandboxed, sandbox paths, และว่า elevated exec ใช้งานได้หรือไม่
- **Current Date & Time**: เวลาท้องถิ่นของผู้ใช้, timezone, และรูปแบบเวลา
- **Reply Tags**: syntax ของ reply tag ที่เป็นตัวเลือกสำหรับ provider ที่รองรับ
- **Heartbeats**: prompt ของ heartbeat และพฤติกรรม ack เมื่อ heartbeats เปิดใช้สำหรับ agent เริ่มต้น
- **Runtime**: host, OS, node, model, repo root (เมื่อตรวจพบ), thinking level (หนึ่งบรรทัด)
- **Reasoning**: ระดับ visibility ปัจจุบัน + คำใบ้ toggle /reasoning

OpenClaw เก็บเนื้อหาคงที่ขนาดใหญ่ รวมถึง **Project Context** ไว้เหนือ
ขอบเขต prompt cache ภายใน ส่วน channel/session ที่เปลี่ยนแปลงได้ เช่น
คำแนะนำ embed ของ Control UI, **Messaging**, **Voice**, **Group Chat Context**,
**Reactions**, **Heartbeats**, และ **Runtime** จะถูกต่อท้ายใต้ขอบเขตนั้น
เพื่อให้ local backends ที่มี prefix caches สามารถใช้ stable workspace prefix ซ้ำ
ข้าม channel turns ได้ คำอธิบาย tool ก็ควรหลีกเลี่ยงการฝังชื่อ channel ปัจจุบันเช่นกัน
เมื่อ schema ที่รับอยู่มีรายละเอียด runtime นั้นอยู่แล้ว

ส่วน Tooling ยังมีคำแนะนำ runtime สำหรับงานที่รันนาน:

- ใช้ cron สำหรับการติดตามผลในอนาคต (`check back later`, reminders, recurring work)
  แทน `exec` sleep loops, กลวิธี delay ของ `yieldMs`, หรือการ polling `process`
  ซ้ำ ๆ
- ใช้ `exec` / `process` เฉพาะกับคำสั่งที่เริ่มตอนนี้และทำงานต่อ
  ในเบื้องหลัง
- เมื่อเปิด automatic completion wake ให้เริ่มคำสั่งครั้งเดียวและพึ่งพา
  เส้นทาง wake แบบ push-based เมื่อมี output หรือเกิด failure
- ใช้ `process` สำหรับ logs, status, input, หรือ intervention เมื่อคุณต้อง
  ตรวจคำสั่งที่กำลังรันอยู่
- หากงานใหญ่กว่า ให้เลือกใช้ `sessions_spawn`; การเสร็จของ sub-agent เป็นแบบ
  push-based และ auto-announces กลับไปยัง requester
- อย่า poll `subagents list` / `sessions_list` ใน loop เพียงเพื่อรอ
  completion

เมื่อเปิดใช้ tool ทดลอง `update_plan` ส่วน Tooling ยังบอก
โมเดลให้ใช้เฉพาะกับงานหลายขั้นตอนที่ไม่ trivial, รักษา step
`in_progress` ไว้ให้มีพอดีหนึ่งรายการ, และหลีกเลี่ยงการทำซ้ำแผนทั้งหมดหลังการอัปเดตแต่ละครั้ง

Safety guardrails ใน system prompt เป็นคำแนะนำ พวกมันนำทางพฤติกรรมของโมเดลแต่ไม่ได้บังคับใช้นโยบาย ใช้ tool policy, exec approvals, sandboxing, และ channel allowlists สำหรับการบังคับใช้ที่แข็งแรง; operators สามารถปิดสิ่งเหล่านี้ได้ตามการออกแบบ

บน channels ที่มี approval cards/buttons แบบ native ตอนนี้ runtime prompt บอกให้
agent พึ่งพา approval UI แบบ native นั้นก่อน ควรรวมคำสั่ง manual
`/approve` เฉพาะเมื่อผลลัพธ์ tool บอกว่า chat approvals ไม่พร้อมใช้งานหรือ
manual approval เป็นทางเดียวเท่านั้น

## โหมด prompt

OpenClaw สามารถ render system prompts ที่เล็กลงสำหรับ sub-agents ได้ runtime ตั้งค่า
`promptMode` สำหรับแต่ละ run (ไม่ใช่ config ที่ผู้ใช้เห็น):

- `full` (ค่าเริ่มต้น): รวมทุกส่วนด้านบน
- `minimal`: ใช้สำหรับ sub-agents; ละเว้น **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, และ **Heartbeats** Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (เมื่อทราบ), Runtime, และ context ที่ฉีดเข้าไป
  ยังคงพร้อมใช้งาน
- `none`: ส่งคืนเฉพาะบรรทัด identity พื้นฐาน

เมื่อ `promptMode=minimal` prompts ที่ฉีดเพิ่มจะถูกติดป้ายเป็น **Subagent
Context** แทน **Group Chat Context**

สำหรับ channel auto-reply runs OpenClaw สามารถละเว้นส่วน **Silent Replies**
ทั่วไปได้เมื่อ direct/group chat context มีพฤติกรรม
`NO_REPLY` เฉพาะบทสนทนาที่ resolve แล้วอยู่แล้ว วิธีนี้หลีกเลี่ยงการทำซ้ำกลไก token
ทั้งใน global system prompt และ channel context

## Prompt snapshots

OpenClaw เก็บ prompt snapshots สำหรับ happy-path ที่ commit แล้วสำหรับ runtime Codex/message-tool
ไว้ใต้ `test/fixtures/agents/prompt-snapshots/happy-path/` snapshots เหล่านี้ render
คำแนะนำ developer ของ Codex app-server ที่ OpenClaw เป็นเจ้าของ, params การเริ่ม/กลับมาทำต่อของ thread ที่เลือก,
input ของผู้ใช้ใน turn, และ dynamic tool specs สำหรับ Telegram direct,
Discord group, และ heartbeat turns system prompt พื้นฐานของ Codex ที่ซ่อนอยู่และ
คำแนะนำ collaboration-mode ของ Codex ตามขอบเขต turn เป็นของ runtime Codex
และไม่ได้ถูก render โดย OpenClaw

สร้างใหม่ด้วย `pnpm prompt:snapshots:gen` และตรวจ drift ด้วย
`pnpm prompt:snapshots:check`

## การฉีด bootstrap ของ workspace

Bootstrap files จะถูกตัดให้สั้นและต่อท้ายใต้ **Project Context** เพื่อให้โมเดลเห็น identity และ profile context โดยไม่ต้องอ่านอย่างชัดเจน:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (เฉพาะ workspaces ใหม่เอี่ยม)
- `MEMORY.md` เมื่อมีอยู่

ไฟล์ทั้งหมดเหล่านี้ถูก **ฉีดเข้าไปใน context window** ทุก turn เว้นแต่
จะมี gate เฉพาะไฟล์ใช้อยู่ `HEARTBEAT.md` จะถูกละเว้นใน runs ปกติเมื่อ
heartbeats ถูกปิดสำหรับ agent เริ่มต้นหรือ
`agents.defaults.heartbeat.includeSystemPromptSection` เป็น false รักษาไฟล์ที่ฉีด
ให้กระชับ — โดยเฉพาะ `MEMORY.md` ซึ่งสามารถโตขึ้นเรื่อย ๆ และนำไปสู่
การใช้ context สูงเกินคาดและ compaction ที่ถี่ขึ้น

<Note>
ไฟล์รายวัน `memory/*.md` **ไม่ได้** เป็นส่วนหนึ่งของ bootstrap Project Context ปกติ ใน turns ทั่วไปไฟล์เหล่านี้ถูกเข้าถึงตามต้องการผ่าน tools `memory_search` และ `memory_get` ดังนั้นจึงไม่นับรวมใน context window เว้นแต่โมเดลจะอ่านอย่างชัดเจน turns แบบ bare `/new` และ `/reset` เป็นข้อยกเว้น: runtime สามารถ prepend daily memory ล่าสุดเป็น startup-context block แบบ one-shot สำหรับ turn แรกนั้นได้
</Note>

ไฟล์ขนาดใหญ่จะถูก truncate พร้อม marker ขนาดสูงสุดต่อไฟล์ควบคุมโดย
`agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) เนื้อหา bootstrap ที่ฉีดทั้งหมด
ข้ามไฟล์ถูกจำกัดโดย `agents.defaults.bootstrapTotalMaxChars`
(ค่าเริ่มต้น: 60000) ไฟล์ที่หายไปจะฉีด marker สั้น ๆ ว่า missing-file เมื่อเกิด truncation
OpenClaw สามารถฉีด warning block ใน Project Context ได้; ควบคุมสิ่งนี้ด้วย
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
ค่าเริ่มต้น: `once`)

Sub-agent sessions จะฉีดเฉพาะ `AGENTS.md` และ `TOOLS.md` (bootstrap files อื่น
ถูกกรองออกเพื่อให้ context ของ sub-agent เล็กลง)

Internal hooks สามารถ intercept ขั้นตอนนี้ผ่าน `agent:bootstrap` เพื่อ mutate หรือแทนที่
bootstrap files ที่ฉีดเข้าไป (เช่น สลับ `SOUL.md` เป็น persona สำรอง)

หากคุณต้องการทำให้ agent ฟังดู generic น้อยลง ให้เริ่มจาก
[คู่มือบุคลิกภาพ SOUL.md](/th/concepts/soul)

หากต้องการตรวจว่าไฟล์ที่ฉีดแต่ละไฟล์มีส่วนร่วมมากแค่ไหน (raw เทียบกับ injected, truncation, รวมถึง tool schema overhead) ให้ใช้ `/context list` หรือ `/context detail` ดู [Context](/th/concepts/context)

## การจัดการเวลา

system prompt มีส่วน **Current Date & Time** โดยเฉพาะเมื่อทราบ
timezone ของผู้ใช้ เพื่อให้ prompt cache-stable ตอนนี้จึงรวมเฉพาะ
**time zone** (ไม่มี clock แบบ dynamic หรือรูปแบบเวลา)

ใช้ `session_status` เมื่อ agent ต้องการเวลาปัจจุบัน; status card
มีบรรทัด timestamp tool เดียวกันนี้สามารถตั้งค่า model override ต่อ session ได้
แบบเลือกได้ (`model=default` จะล้างค่า)

กำหนดค่าด้วย:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

ดูรายละเอียดพฤติกรรมทั้งหมดที่ [วันที่และเวลา](/th/date-time)

## Skills

เมื่อมี skills ที่ eligible อยู่ OpenClaw จะฉีด **available skills list** แบบกระชับ
(`formatSkillsForPrompt`) ซึ่งรวม **file path** สำหรับแต่ละ skill
prompt สั่งให้โมเดลใช้ `read` เพื่อโหลด SKILL.md ที่
ตำแหน่งที่ระบุ (workspace, managed, หรือ bundled) หากไม่มี skills ที่ eligible
ส่วน Skills จะถูกละเว้น

Eligibility รวมถึง gates ของ skill metadata, การตรวจ environment/config ของ runtime,
และ allowlist ของ agent skill ที่มีผลเมื่อกำหนดค่า `agents.defaults.skills` หรือ
`agents.list[].skills`

Plugin-bundled skills จะ eligible เฉพาะเมื่อ plugin เจ้าของถูกเปิดใช้งาน
สิ่งนี้ทำให้ tool plugins เปิดเผยคู่มือการปฏิบัติงานที่ลึกขึ้นได้โดยไม่ต้องฝังทั้งหมดของ
คำแนะนำนั้นลงในคำอธิบาย tool ทุกอันโดยตรง

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

วิธีนี้ทำให้ base prompt เล็กอยู่เสมอขณะยังเปิดใช้ skill usage แบบตรงเป้าหมายได้

งบประมาณของ skills list เป็นของ subsystem skills:

- ค่าเริ่มต้นทั่วระบบ: `skills.limits.maxSkillsPromptChars`
- override ต่อ agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

runtime excerpts แบบ generic bounded ใช้พื้นผิวอื่น:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

การแยกนี้ทำให้การกำหนดขนาดของ skills แยกจากการกำหนดขนาดการอ่าน/ฉีดของ runtime เช่น
`memory_get`, live tool results, และการ refresh AGENTS.md หลัง compaction

## Documentation

system prompt มีส่วน **Documentation** เมื่อมีเอกสารในเครื่อง จะ
ชี้ไปที่ directory เอกสาร OpenClaw ภายในเครื่อง (`docs/` ใน Git checkout หรือเอกสาร npm
package ที่ bundled มา) หากเอกสารในเครื่องไม่พร้อมใช้งาน จะ fallback ไปที่
[https://docs.openclaw.ai](https://docs.openclaw.ai)

ส่วนเดียวกันนี้ยังรวมตำแหน่ง source ของ OpenClaw ด้วย Git checkouts เปิดเผย local
source root เพื่อให้ agent ตรวจ code ได้โดยตรง Package installs รวม GitHub
source URL และบอกให้ agent review source ที่นั่นเมื่อเอกสารไม่สมบูรณ์หรือ
ล้าสมัย prompt ยังระบุ public docs mirror, community Discord, และ ClawHub
([https://clawhub.ai](https://clawhub.ai)) สำหรับการค้นพบ skills อีกด้วย และบอกให้โมเดล
ปรึกษา docs ก่อนสำหรับพฤติกรรม, คำสั่ง, configuration, หรือ architecture ของ OpenClaw และให้
รัน `openclaw status` เองเมื่อทำได้ (ถามผู้ใช้เฉพาะเมื่อไม่มีสิทธิ์เข้าถึง)
สำหรับ configuration โดยเฉพาะ จะชี้ agents ไปยัง action ของ tool `gateway`
`config.schema.lookup` สำหรับเอกสารและข้อจำกัดระดับ field ที่แม่นยำ จากนั้นไปยัง
`docs/gateway/configuration.md` และ `docs/gateway/configuration-reference.md`
สำหรับคำแนะนำที่กว้างขึ้น

## ที่เกี่ยวข้อง

- [รันไทม์ของเอเจนต์](/th/concepts/agent)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [เอนจินบริบท](/th/concepts/context-engine)
