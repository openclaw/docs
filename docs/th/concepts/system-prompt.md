---
read_when:
    - การแก้ไขข้อความพรอมป์ระบบ รายการเครื่องมือ หรือส่วนเวลา/Heartbeat
    - การเปลี่ยนพฤติกรรมการบูตสแตรปพื้นที่ทำงานหรือการแทรก Skills
summary: พรอมป์ต์ระบบของ OpenClaw ประกอบด้วยอะไรและถูกรวบรวมขึ้นอย่างไร
title: พรอมต์ระบบ
x-i18n:
    generated_at: "2026-05-06T09:10:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw สร้าง system prompt แบบกำหนดเองสำหรับการรัน agent ทุกครั้ง prompt นี้เป็นของ **OpenClaw** และไม่ได้ใช้ prompt เริ่มต้นของ pi-coding-agent

prompt จะถูกประกอบโดย OpenClaw และฉีดเข้าไปในการรัน agent แต่ละครั้ง

Plugin ผู้ให้บริการสามารถร่วมเพิ่มคำแนะนำ prompt ที่คำนึงถึงแคชได้โดยไม่ต้องแทนที่
prompt ทั้งหมดที่ OpenClaw เป็นเจ้าของ runtime ของผู้ให้บริการสามารถ:

- แทนที่ส่วนหลักที่มีชื่อไว้ชุดเล็ก ๆ (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ฉีด **prefix ที่เสถียร** ไว้เหนือขอบเขตแคช prompt
- ฉีด **suffix แบบไดนามิก** ไว้ใต้ขอบเขตแคช prompt

ใช้ส่วนร่วมที่ผู้ให้บริการเป็นเจ้าของสำหรับการปรับแต่งเฉพาะตระกูลโมเดล เก็บการกลายพันธุ์ prompt แบบเดิม
`before_prompt_build` ไว้สำหรับความเข้ากันได้หรือการเปลี่ยนแปลง prompt
ระดับสากลจริง ๆ ไม่ใช่พฤติกรรมปกติของผู้ให้บริการ

โอเวอร์เลย์ตระกูล OpenAI GPT-5 ทำให้กฎการดำเนินการหลักมีขนาดเล็กและเพิ่ม
คำแนะนำเฉพาะโมเดลสำหรับการยึด persona, การส่งออกที่กระชับ, วินัยในการใช้เครื่องมือ,
การค้นหาแบบขนาน, ความครอบคลุมของ deliverable, การยืนยัน, บริบทที่ขาดหายไป และ
สุขอนามัยของเครื่องมือเทอร์มินัล

## โครงสร้าง

prompt ถูกออกแบบให้กะทัดรัดและใช้ส่วนตายตัว:

- **เครื่องมือ**: ตัวเตือนแหล่งความจริงของ structured-tool พร้อมคำแนะนำการใช้เครื่องมือขณะ runtime
- **อคติในการดำเนินการ**: คำแนะนำการทำงานต่อจนจบแบบกะทัดรัด: ลงมือในเทิร์นกับ
  คำขอที่ดำเนินการได้ ทำต่อจนเสร็จหรือถูกบล็อก กู้คืนจากผลลัพธ์เครื่องมือที่อ่อน
  ตรวจสอบสถานะที่เปลี่ยนแปลงได้แบบสด และยืนยันก่อนสรุป
- **ความปลอดภัย**: ตัวเตือน guardrail สั้น ๆ เพื่อหลีกเลี่ยงพฤติกรรมแสวงหาอำนาจหรือการเลี่ยงการกำกับดูแล
- **Skills** (เมื่อพร้อมใช้งาน): บอกโมเดลว่าจะโหลดคำสั่ง skill ตามต้องการอย่างไร
- **OpenClaw Self-Update**: วิธีตรวจสอบ config อย่างปลอดภัยด้วย
  `config.schema.lookup`, patch config ด้วย `config.patch`, แทนที่ config ทั้งหมด
  ด้วย `config.apply`, และรัน `update.run` เฉพาะเมื่อผู้ใช้ร้องขออย่างชัดเจน
  เท่านั้น เครื่องมือ `gateway` สำหรับ owner เท่านั้นยังปฏิเสธการเขียนใหม่
  `tools.exec.ask` / `tools.exec.security` รวมถึง alias เดิม `tools.bash.*`
  ที่ normalize เป็น path exec ที่ได้รับการป้องกันเหล่านั้น
- **Workspace**: ไดเรกทอรีทำงาน (`agents.defaults.workspace`)
- **เอกสาร**: path ภายในเครื่องไปยังเอกสาร OpenClaw (repo หรือ npm package) และควรอ่านเมื่อใด
- **ไฟล์ Workspace (ฉีดเข้าไป)**: ระบุว่าไฟล์ bootstrap ถูกรวมไว้ด้านล่าง
- **Sandbox** (เมื่อเปิดใช้งาน): ระบุ runtime ที่อยู่ใน sandbox, path ของ sandbox และ exec แบบยกระดับพร้อมใช้งานหรือไม่
- **วันที่และเวลาปัจจุบัน**: เฉพาะเขตเวลา (เสถียรต่อแคช; นาฬิกาสดมาจาก `session_status`)
- **แท็กตอบกลับ**: ไวยากรณ์แท็กตอบกลับแบบเลือกได้สำหรับผู้ให้บริการที่รองรับ
- **Heartbeats**: prompt ของ heartbeat และพฤติกรรม ack เมื่อเปิดใช้ heartbeats สำหรับ agent เริ่มต้น
- **Runtime**: host, OS, node, model, repo root (เมื่อตรวจพบ), ระดับ thinking (หนึ่งบรรทัด)
- **การใช้เหตุผล**: ระดับการมองเห็นปัจจุบัน + คำแนะนำ toggle /reasoning

OpenClaw เก็บเนื้อหาเสถียรขนาดใหญ่ รวมถึง **Project Context** ไว้เหนือ
ขอบเขตแคช prompt ภายใน ส่วน channel/session ที่เปลี่ยนแปลงง่าย เช่น
คำแนะนำการฝัง Control UI, **Messaging**, **Voice**, **Group Chat Context**,
**Reactions**, **Heartbeats**, และ **Runtime** จะถูกต่อท้ายไว้ใต้ขอบเขตนั้น
เพื่อให้ backend ภายในเครื่องที่มี prefix cache สามารถใช้ prefix workspace ที่เสถียรซ้ำ
ข้ามเทิร์นของช่องทางได้ คำอธิบายเครื่องมือก็ควรหลีกเลี่ยงการฝังชื่อช่องทางปัจจุบันเช่นกัน
เมื่อ schema ที่ยอมรับมีรายละเอียด runtime นั้นอยู่แล้ว

ส่วน Tooling ยังมีคำแนะนำ runtime สำหรับงานที่ใช้เวลานาน:

- ใช้ cron สำหรับการติดตามผลในอนาคต (`check back later`, การเตือน, งานที่เกิดซ้ำ)
  แทน loop sleep ของ `exec`, กลเม็ดหน่วงเวลา `yieldMs`, หรือการ polling `process`
  ซ้ำ ๆ
- ใช้ `exec` / `process` เฉพาะกับคำสั่งที่เริ่มตอนนี้และรันต่อ
  ในเบื้องหลัง
- เมื่อเปิดใช้งานการ wake เมื่อเสร็จอัตโนมัติ ให้เริ่มคำสั่งครั้งเดียวและพึ่งพา
  path wake แบบ push-based เมื่อมี output หรือเกิด failure
- ใช้ `process` สำหรับ log, status, input หรือ intervention เมื่อคุณต้อง
  ตรวจสอบคำสั่งที่กำลังรันอยู่
- หากงานมีขนาดใหญ่กว่า ให้เลือกใช้ `sessions_spawn`; การเสร็จสิ้นของ sub-agent เป็นแบบ
  push-based และประกาศกลับไปยังผู้ร้องขอโดยอัตโนมัติ
- อย่า polling `subagents list` / `sessions_list` ใน loop เพียงเพื่อรอ
  ให้เสร็จสิ้น

เมื่อเปิดใช้งานเครื่องมือทดลอง `update_plan` ส่วน Tooling ยังบอกให้
โมเดลใช้เครื่องมือนี้เฉพาะกับงานหลายขั้นตอนที่ไม่เล็กน้อย คงไว้ให้มีขั้นตอน
`in_progress` เพียงหนึ่งรายการพอดี และหลีกเลี่ยงการทำซ้ำแผนทั้งหมดหลังการอัปเดตแต่ละครั้ง

guardrail ด้านความปลอดภัยใน system prompt เป็นคำแนะนำ คำแนะนำเหล่านี้ชี้นำพฤติกรรมของโมเดลแต่ไม่ได้บังคับใช้นโยบาย ใช้นโยบายเครื่องมือ, การอนุมัติ exec, sandboxing และ allowlist ของช่องทางสำหรับการบังคับใช้ที่เข้มงวด; operator สามารถปิดสิ่งเหล่านี้ได้ตามการออกแบบ

ในช่องทางที่มีการ์ด/ปุ่มอนุมัติ native prompt runtime ตอนนี้บอกให้
agent พึ่งพา UI อนุมัติ native นั้นก่อน ควรรวมคำสั่ง
`/approve` แบบ manual เฉพาะเมื่อผลลัพธ์เครื่องมือบอกว่าการอนุมัติผ่าน chat ไม่พร้อมใช้งานหรือ
การอนุมัติแบบ manual เป็น path เดียวเท่านั้น

## โหมด prompt

OpenClaw สามารถ render system prompt ที่เล็กลงสำหรับ sub-agent ได้ runtime ตั้งค่า
`promptMode` สำหรับการรันแต่ละครั้ง (ไม่ใช่ config ที่แสดงต่อผู้ใช้):

- `full` (ค่าเริ่มต้น): รวมทุกส่วนข้างต้น
- `minimal`: ใช้สำหรับ sub-agent; ละเว้น **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, และ **Heartbeats** Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (เมื่อทราบ), Runtime และบริบทที่ฉีดเข้าไป
  ยังคงพร้อมใช้งาน
- `none`: คืนเฉพาะบรรทัด identity พื้นฐาน

เมื่อ `promptMode=minimal`, prompt ที่ฉีดเพิ่มจะติดป้าย **Subagent
Context** แทน **Group Chat Context**

สำหรับการรันตอบกลับอัตโนมัติของช่องทาง OpenClaw สามารถละเว้นส่วน **Silent Replies**
ทั่วไปเมื่อบริบท direct/group chat มีพฤติกรรม `NO_REPLY`
เฉพาะบทสนทนาที่ resolve แล้วอยู่แล้ว สิ่งนี้หลีกเลี่ยงการทำซ้ำกลไก token
ทั้งใน system prompt ส่วนกลางและบริบทช่องทาง

## snapshot ของ prompt

OpenClaw เก็บ snapshot prompt ที่ commit แล้วสำหรับ happy path ของ runtime Codex ไว้ใต้
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` snapshot เหล่านี้ render
params ของ thread/turn ของ app-server ที่เลือกไว้ รวมถึง stack ชั้น prompt ที่ผูกกับโมเดลซึ่ง reconstruct แล้ว
สำหรับเทิร์น Telegram direct, Discord group และ heartbeat stack นั้น
มี fixture prompt โมเดล Codex `gpt-5.5` ที่ pin ไว้ซึ่งสร้างจาก
รูปทรง catalog/cache ของโมเดล Codex, ข้อความ developer สำหรับ permission happy-path ของ Codex,
คำสั่ง developer ของ OpenClaw, คำสั่ง collaboration-mode ที่จำกัดขอบเขตตามเทิร์น
เมื่อ OpenClaw จัดเตรียมให้, input เทิร์นของผู้ใช้ และการอ้างอิงถึง spec เครื่องมือแบบไดนามิก

รีเฟรช fixture prompt โมเดล Codex ที่ pin ไว้ด้วย
`pnpm prompt:snapshots:sync-codex-model` โดยค่าเริ่มต้น script จะมองหา
cache runtime ของ Codex ที่ `$CODEX_HOME/models_cache.json`, จากนั้น
`~/.codex/models_cache.json`, แล้วจึง fallback ไปยัง convention checkout Codex ของ maintainer
ที่ `~/code/codex/codex-rs/models-manager/models.json` หากไม่มี
แหล่งข้อมูลเหล่านั้นอยู่ คำสั่งจะออกโดยไม่เปลี่ยน fixture ที่ commit แล้ว
ส่ง `--catalog <path>` เพื่อรีเฟรชจากไฟล์ `models_cache.json`
หรือ `models.json` ที่เฉพาะเจาะจง

snapshot เหล่านี้ยังไม่ใช่การ capture คำขอ OpenAI ดิบแบบ byte-for-byte Codex
สามารถเพิ่มบริบท workspace ที่ runtime เป็นเจ้าของ เช่น `AGENTS.md`, environment
context, memories, คำสั่ง app/plugin และคำสั่ง collaboration-mode เริ่มต้น
ในตัว ภายใน runtime Codex หลังจาก OpenClaw ส่ง params ของ thread และ turn แล้ว

สร้างใหม่ด้วย `pnpm prompt:snapshots:gen` และตรวจ drift ด้วย
`pnpm prompt:snapshots:check` CI รันการตรวจ drift ใน shard ขอบเขตเพิ่มเติม
เพื่อให้การเปลี่ยน prompt และการอัปเดต snapshot ผูกอยู่กับ PR เดียวกัน

## การฉีด bootstrap ของ Workspace

ไฟล์ bootstrap จะถูกตัดแต่งและต่อท้ายใต้ **Project Context** เพื่อให้โมเดลเห็นบริบท identity และ profile โดยไม่ต้องอ่านอย่างชัดเจน:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (เฉพาะ workspace ที่สร้างใหม่เท่านั้น)
- `MEMORY.md` เมื่อมีอยู่

ไฟล์ทั้งหมดนี้ถูก **ฉีดเข้าไปใน context window** ทุกเทิร์น เว้นแต่
จะมี gate เฉพาะไฟล์บังคับใช้ `HEARTBEAT.md` จะถูกละเว้นในการรันปกติเมื่อ
ปิด heartbeats สำหรับ agent เริ่มต้น หรือ
`agents.defaults.heartbeat.includeSystemPromptSection` เป็น false ทำให้ไฟล์ที่ฉีดเข้าไป
กระชับ โดยเฉพาะ `MEMORY.md` ซึ่งอาจโตขึ้นเมื่อเวลาผ่านไปและทำให้
การใช้ context สูงเกินคาดและเกิด Compaction บ่อยขึ้น

เมื่อ session รันบน harness native ของ Codex, Codex จะโหลด `AGENTS.md`
ผ่านการค้นพบ project-doc ของตัวเอง OpenClaw ยังคง resolve ไฟล์
bootstrap ที่เหลือและ forward เป็นคำสั่ง config ของ Codex ดังนั้น `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, และ
`MEMORY.md` จึงยังคงมีบทบาท workspace-context เดิมโดยไม่ทำซ้ำ
`AGENTS.md`

<Note>
ไฟล์รายวัน `memory/*.md` **ไม่ใช่** ส่วนหนึ่งของ Project Context bootstrap ปกติ ในเทิร์นทั่วไป ไฟล์เหล่านี้ถูกเข้าถึงตามต้องการผ่านเครื่องมือ `memory_search` และ `memory_get` ดังนั้นจึงไม่นับต่อ context window เว้นแต่ว่าโมเดลจะอ่านอย่างชัดเจน เทิร์น `/new` และ `/reset` แบบเปล่าเป็นข้อยกเว้น: runtime สามารถ prepend หน่วยความจำรายวันล่าสุดเป็นบล็อก startup-context แบบครั้งเดียวสำหรับเทิร์นแรกนั้นได้
</Note>

ไฟล์ขนาดใหญ่จะถูกตัดทอนพร้อม marker ขนาดสูงสุดต่อไฟล์ถูกควบคุมโดย
`agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) เนื้อหา bootstrap ที่ฉีดทั้งหมด
ข้ามไฟล์ถูกจำกัดโดย `agents.defaults.bootstrapTotalMaxChars`
(ค่าเริ่มต้น: 60000) ไฟล์ที่หายไปจะฉีด marker ไฟล์หายสั้น ๆ เมื่อเกิดการตัดทอน
OpenClaw สามารถฉีดข้อความเตือน system-prompt แบบกระชับได้; ควบคุมสิ่งนี้ด้วย
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
ค่าเริ่มต้น: `once`) จำนวนดิบ/ที่ฉีดแบบละเอียดจะยังอยู่ใน diagnostics เช่น
`/context`, `/status`, doctor และ logs

session ของ sub-agent จะฉีดเฉพาะ `AGENTS.md` และ `TOOLS.md` (ไฟล์ bootstrap อื่น
ถูกกรองออกเพื่อให้บริบทของ sub-agent เล็กลง)

hook ภายในสามารถ intercept ขั้นตอนนี้ผ่าน `agent:bootstrap` เพื่อ mutate หรือ replace
ไฟล์ bootstrap ที่ฉีดเข้าไป (เช่น สลับ `SOUL.md` เป็น persona ทางเลือก)

หากคุณต้องการทำให้ agent ฟังดูทั่วไปน้อยลง ให้เริ่มที่
[คู่มือบุคลิกภาพ SOUL.md](/th/concepts/soul)

หากต้องการตรวจสอบว่าไฟล์ที่ฉีดแต่ละไฟล์มีส่วนร่วมมากเท่าใด (raw vs injected, truncation รวมถึง overhead ของ tool schema) ให้ใช้ `/context list` หรือ `/context detail` ดู [Context](/th/concepts/context)

## การจัดการเวลา

system prompt มีส่วน **วันที่และเวลาปัจจุบัน** โดยเฉพาะเมื่อทราบ
เขตเวลาของผู้ใช้ เพื่อให้ prompt เสถียรต่อแคช ตอนนี้จึงรวมเฉพาะ
**เขตเวลา** (ไม่มีนาฬิกาหรือรูปแบบเวลาแบบไดนามิก)

ใช้ `session_status` เมื่อ agent ต้องการเวลาปัจจุบัน; status card
มีบรรทัด timestamp เครื่องมือเดียวกันสามารถตั้งค่า override โมเดลต่อ session
แบบเลือกได้ (`model=default` จะล้างค่า)

กำหนดค่าด้วย:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

ดูรายละเอียดพฤติกรรมทั้งหมดที่ [วันที่และเวลา](/th/date-time)

## Skills

เมื่อมี skills ที่เข้าเกณฑ์ OpenClaw จะฉีด **รายการ skills ที่พร้อมใช้งาน** แบบกะทัดรัด
(`formatSkillsForPrompt`) ซึ่งมี **path ไฟล์** สำหรับแต่ละ skill
prompt สั่งให้โมเดลใช้ `read` เพื่อโหลด SKILL.md ที่ตำแหน่งที่ระบุ
(workspace, managed หรือ bundled) หากไม่มี skills ที่เข้าเกณฑ์
ส่วน Skills จะถูกละเว้น

คุณสมบัติที่เข้าเกณฑ์รวมถึง gate metadata ของ skill, การตรวจ runtime environment/config,
และ allowlist skill ของ agent ที่มีผลเมื่อกำหนดค่า `agents.defaults.skills` หรือ
`agents.list[].skills`

skills ที่ bundled มากับ Plugin จะเข้าเกณฑ์เฉพาะเมื่อ Plugin เจ้าของเปิดใช้งานอยู่
สิ่งนี้ช่วยให้ Plugin เครื่องมือเปิดเผยคู่มือการปฏิบัติงานที่ลึกขึ้นได้โดยไม่ต้องฝัง
คำแนะนำทั้งหมดนั้นลงในคำอธิบายเครื่องมือทุกครั้งโดยตรง

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

สิ่งนี้ทำให้ prompt พื้นฐานมีขนาดเล็กพร้อมยังคงเปิดใช้การใช้ skill แบบตรงเป้าหมายได้

งบประมาณรายการ Skills เป็นของระบบย่อย Skills:

- ค่าเริ่มต้นส่วนกลาง: `skills.limits.maxSkillsPromptChars`
- การแทนที่ราย agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

ข้อความตัดตอนของรันไทม์แบบจำกัดทั่วไปใช้พื้นผิวอีกแบบหนึ่ง:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

การแยกนี้ทำให้การกำหนดขนาด Skills แยกจากการกำหนดขนาดการอ่าน/การฉีดข้อมูลของรันไทม์ เช่น `memory_get`, ผลลัพธ์เครื่องมือแบบสด และการรีเฟรช AGENTS.md หลัง Compaction

## เอกสารประกอบ

พรอมป์ระบบมีส่วน **เอกสารประกอบ** เมื่อมีเอกสารในเครื่อง ส่วนนี้จะชี้ไปยังไดเรกทอรีเอกสาร OpenClaw ในเครื่อง (`docs/` ใน Git checkout หรือเอกสารแพ็กเกจ npm ที่รวมมา) หากไม่มีเอกสารในเครื่อง ระบบจะถอยกลับไปใช้ [https://docs.openclaw.ai](https://docs.openclaw.ai)

ส่วนเดียวกันนี้ยังรวมตำแหน่งซอร์สของ OpenClaw ด้วย Git checkouts จะแสดงรากซอร์สในเครื่องเพื่อให้ agent ตรวจสอบโค้ดได้โดยตรง การติดตั้งจากแพ็กเกจจะรวม URL ซอร์ส GitHub และบอกให้ agent ตรวจสอบซอร์สที่นั่นเมื่อเอกสารไม่ครบถ้วนหรือล้าสมัย พรอมป์ยังระบุถึงมิเรอร์เอกสารสาธารณะ, Discord ชุมชน และ ClawHub ([https://clawhub.ai](https://clawhub.ai)) สำหรับการค้นพบ Skills โดยบอกโมเดลให้ปรึกษาเอกสารก่อนสำหรับพฤติกรรม คำสั่ง การกำหนดค่า หรือสถาปัตยกรรมของ OpenClaw และให้รัน `openclaw status` เองเมื่อทำได้ (ถามผู้ใช้เฉพาะเมื่อไม่มีสิทธิ์เข้าถึง) สำหรับการกำหนดค่าโดยเฉพาะ จะชี้ agent ไปยังการกระทำเครื่องมือ `gateway` ชื่อ `config.schema.lookup` เพื่อดูเอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำ จากนั้นไปที่ `docs/gateway/configuration.md` และ `docs/gateway/configuration-reference.md` เพื่อดูคำแนะนำที่กว้างขึ้น

## ที่เกี่ยวข้อง

- [รันไทม์ของ agent](/th/concepts/agent)
- [เวิร์กสเปซของ agent](/th/concepts/agent-workspace)
- [เอนจินบริบท](/th/concepts/context-engine)
