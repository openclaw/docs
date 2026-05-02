---
read_when:
    - การแก้ไขข้อความพรอมป์ระบบ รายการเครื่องมือ หรือส่วนเวลา/Heartbeat
    - การเปลี่ยนพฤติกรรมการบูตสแตรปเวิร์กสเปซหรือการแทรก Skills
summary: พรอมต์ระบบของ OpenClaw มีอะไรบ้างและถูกประกอบขึ้นอย่างไร
title: พรอมต์ระบบ
x-i18n:
    generated_at: "2026-05-02T23:39:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw สร้าง system prompt แบบกำหนดเองสำหรับการรัน agent ทุกครั้ง prompt นี้เป็น **ของ OpenClaw** และไม่ได้ใช้ prompt เริ่มต้นของ pi-coding-agent

prompt ถูกประกอบโดย OpenClaw และฉีดเข้าไปในการรัน agent แต่ละครั้ง

Provider plugins สามารถเพิ่มคำแนะนำ prompt ที่รับรู้แคชได้โดยไม่ต้องแทนที่
prompt ทั้งหมดที่ OpenClaw เป็นเจ้าของ รันไทม์ของ provider สามารถ:

- แทนที่ชุด core section ที่มีชื่อจำนวนเล็กน้อย (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ฉีด **stable prefix** เหนือขอบเขต prompt cache
- ฉีด **dynamic suffix** ใต้ขอบเขต prompt cache

ใช้ contribution ที่ provider เป็นเจ้าของสำหรับการปรับแต่งเฉพาะตระกูลโมเดล เก็บการกลายพันธุ์ของ prompt แบบเดิม
`before_prompt_build` ไว้สำหรับความเข้ากันได้หรือการเปลี่ยนแปลง prompt แบบ global จริง ๆ
ไม่ใช่พฤติกรรมปกติของ provider

overlay ของตระกูล OpenAI GPT-5 ทำให้กฎการดำเนินการหลักมีขนาดเล็ก และเพิ่ม
คำแนะนำเฉพาะโมเดลสำหรับการล็อก persona, ผลลัพธ์ที่กระชับ, วินัยการใช้เครื่องมือ,
การค้นหาแบบขนาน, ความครอบคลุมของ deliverable, การตรวจสอบ, บริบทที่ขาดหาย และ
สุขอนามัยของเครื่องมือเทอร์มินัล

## โครงสร้าง

prompt ถูกทำให้กระชับโดยตั้งใจและใช้ section คงที่:

- **เครื่องมือ**: ตัวเตือนแหล่งความจริงของ structured-tool พร้อมคำแนะนำการใช้เครื่องมือของรันไทม์
- **อคติในการดำเนินการ**: คำแนะนำการทำงานต่อให้จบแบบกระชับ: ดำเนินการในเทิร์นกับ
  คำขอที่ทำได้, ทำต่อจนเสร็จหรือถูกบล็อก, กู้คืนจากผลลัพธ์เครื่องมือที่อ่อน,
  ตรวจสถานะที่เปลี่ยนแปลงได้แบบสด, และตรวจสอบก่อนสรุปสุดท้าย
- **ความปลอดภัย**: ตัวเตือน guardrail สั้น ๆ เพื่อหลีกเลี่ยงพฤติกรรมแสวงหาอำนาจหรือการเลี่ยงการกำกับดูแล
- **Skills** (เมื่อพร้อมใช้งาน): บอกโมเดลว่าจะโหลดคำสั่งของ skill ตามต้องการอย่างไร
- **การอัปเดตตัวเองของ OpenClaw**: วิธีตรวจ config อย่างปลอดภัยด้วย
  `config.schema.lookup`, patch config ด้วย `config.patch`, แทนที่ config ทั้งหมด
  ด้วย `config.apply`, และรัน `update.run` เฉพาะเมื่อผู้ใช้ขออย่างชัดเจนเท่านั้น
  เครื่องมือ `gateway` สำหรับเจ้าของเท่านั้นยังปฏิเสธการเขียนใหม่
  `tools.exec.ask` / `tools.exec.security` รวมถึง alias เดิม `tools.bash.*`
  ที่ normalize ไปยัง exec paths ที่ได้รับการปกป้องเหล่านั้น
- **พื้นที่ทำงาน**: ไดเรกทอรีทำงาน (`agents.defaults.workspace`)
- **เอกสาร**: path ในเครื่องไปยังเอกสาร OpenClaw (repo หรือ npm package) และควรอ่านเมื่อใด
- **ไฟล์พื้นที่ทำงาน (ฉีดเข้าไป)**: ระบุว่า bootstrap files ถูกรวมไว้ด้านล่าง
- **Sandbox** (เมื่อเปิดใช้): ระบุรันไทม์ที่ถูก sandbox, sandbox paths, และมี elevated exec หรือไม่
- **วันที่และเวลาปัจจุบัน**: เวลาท้องถิ่นของผู้ใช้, timezone, และรูปแบบเวลา
- **แท็กตอบกลับ**: syntax ของแท็กตอบกลับแบบเลือกใช้สำหรับ providers ที่รองรับ
- **Heartbeats**: prompt ของ Heartbeat และพฤติกรรม ack เมื่อเปิดใช้ Heartbeat สำหรับ agent เริ่มต้น
- **รันไทม์**: host, OS, node, model, repo root (เมื่อตรวจพบ), ระดับ thinking (หนึ่งบรรทัด)
- **การให้เหตุผล**: ระดับการมองเห็นปัจจุบัน + คำใบ้ toggle /reasoning

OpenClaw เก็บเนื้อหาเสถียรขนาดใหญ่ รวมถึง **บริบทโครงการ** ไว้เหนือ
ขอบเขต prompt cache ภายใน section ของ channel/session ที่ผันผวน เช่น
คำแนะนำการฝัง Control UI, **การส่งข้อความ**, **เสียง**, **บริบทแชตกลุ่ม**,
**ปฏิกิริยา**, **Heartbeats**, และ **รันไทม์** จะถูกต่อท้ายใต้ขอบเขตนั้น
เพื่อให้ local backends ที่มี prefix caches สามารถใช้ prefix พื้นที่ทำงานที่เสถียรซ้ำ
ข้ามเทิร์นของ channel ได้ คำอธิบายเครื่องมือก็ควรหลีกเลี่ยงการฝังชื่อ channel ปัจจุบันเช่นกัน
เมื่อ schema ที่ยอมรับมีรายละเอียดรันไทม์นั้นอยู่แล้ว

section เครื่องมือยังรวมคำแนะนำรันไทม์สำหรับงานที่ใช้เวลานาน:

- ใช้ cron สำหรับการติดตามผลในอนาคต (`check back later`, reminders, งานที่เกิดซ้ำ)
  แทน `exec` sleep loops, กลเม็ดหน่วงเวลา `yieldMs`, หรือการ polling `process`
  ซ้ำ ๆ
- ใช้ `exec` / `process` เฉพาะสำหรับคำสั่งที่เริ่มตอนนี้และทำงานต่อ
  ในพื้นหลัง
- เมื่อเปิดใช้การปลุกเมื่อเสร็จสิ้นอัตโนมัติ ให้เริ่มคำสั่งเพียงครั้งเดียวและพึ่งพา
  เส้นทาง wake แบบ push-based เมื่อมี output หรือ fail
- ใช้ `process` สำหรับ logs, status, input, หรือการแทรกแซง เมื่อคุณต้อง
  ตรวจคำสั่งที่กำลังทำงานอยู่
- หากงานใหญ่กว่า ให้เลือกใช้ `sessions_spawn`; การเสร็จสิ้นของ sub-agent เป็นแบบ
  push-based และประกาศกลับไปยังผู้ขอโดยอัตโนมัติ
- อย่า poll `subagents list` / `sessions_list` ใน loop เพียงเพื่อรอ
  การเสร็จสิ้น

เมื่อเปิดใช้เครื่องมือทดลอง `update_plan` section เครื่องมือยังบอกให้
โมเดลใช้เฉพาะกับงานหลายขั้นตอนที่ไม่ง่าย, คง step ที่เป็น
`in_progress` ไว้ให้มีเพียงหนึ่งเดียว, และหลีกเลี่ยงการทำซ้ำแผนทั้งหมดหลังการอัปเดตแต่ละครั้ง

guardrails ด้านความปลอดภัยใน system prompt เป็นคำแนะนำเท่านั้น สิ่งเหล่านี้ชี้นำพฤติกรรมโมเดลแต่ไม่ได้บังคับใช้นโยบาย ใช้ tool policy, exec approvals, sandboxing, และ channel allowlists สำหรับการบังคับใช้จริง; operators สามารถปิดใช้งานสิ่งเหล่านี้ได้ตามการออกแบบ

บน channels ที่มี approval cards/buttons แบบ native ตอนนี้ runtime prompt บอกให้
agent พึ่งพา approval UI แบบ native นั้นก่อน ควรใส่คำสั่ง manual
`/approve` เฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่า chat approvals ใช้งานไม่ได้หรือ
manual approval เป็นเส้นทางเดียวเท่านั้น

## โหมด prompt

OpenClaw สามารถ render system prompts ที่เล็กลงสำหรับ sub-agents ได้ รันไทม์ตั้งค่า
`promptMode` สำหรับการรันแต่ละครั้ง (ไม่ใช่ config ที่ผู้ใช้เห็น):

- `full` (ค่าเริ่มต้น): รวมทุก section ด้านบน
- `minimal`: ใช้สำหรับ sub-agents; ละเว้น **Skills**, **การเรียกคืนหน่วยความจำ**, **การอัปเดตตัวเองของ OpenClaw**,
  **alias ของโมเดล**, **ตัวตนผู้ใช้**, **แท็กตอบกลับ**,
  **การส่งข้อความ**, **การตอบกลับแบบเงียบ**, และ **Heartbeats** เครื่องมือ, **ความปลอดภัย**,
  พื้นที่ทำงาน, Sandbox, วันที่และเวลาปัจจุบัน (เมื่อทราบ), รันไทม์, และบริบทที่ฉีดเข้าไป
  ยังพร้อมใช้งาน
- `none`: ส่งคืนเฉพาะบรรทัด identity พื้นฐาน

เมื่อ `promptMode=minimal` prompts ที่ฉีดเพิ่มจะถูกติดป้ายว่า **บริบท Subagent**
แทน **บริบทแชตกลุ่ม**

สำหรับการรัน auto-reply ของ channel OpenClaw สามารถละเว้น section **การตอบกลับแบบเงียบ**
ทั่วไปได้ เมื่อบริบท direct/group chat มีพฤติกรรม `NO_REPLY` เฉพาะการสนทนาที่ resolve แล้วอยู่แล้ว
สิ่งนี้หลีกเลี่ยงการทำซ้ำกลไก token ทั้งใน global system prompt และบริบท channel

## snapshots ของ prompt

OpenClaw เก็บ prompt snapshots ที่ commit แล้วสำหรับ happy path ของรันไทม์ Codex ไว้ใต้
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` snapshots เหล่านี้ render
params ของ thread/turn จาก app-server ที่เลือก พร้อม stack ของ layer prompt ที่ผูกกับโมเดลซึ่ง reconstruct แล้ว
สำหรับ Telegram direct, Discord group, และเทิร์น heartbeat stack นั้น
รวม fixture prompt ของโมเดล Codex `gpt-5.5` ที่ปักหมุดไว้ ซึ่งสร้างจาก
รูปแบบ model catalog/cache ของ Codex, ข้อความ developer permission happy-path ของ Codex,
คำสั่ง developer ของ OpenClaw, input ของเทิร์นผู้ใช้, และการอ้างอิงถึง
tool specs แบบ dynamic

รีเฟรช fixture prompt ของโมเดล Codex ที่ปักหมุดไว้ด้วย
`pnpm prompt:snapshots:sync-codex-model` ตามค่าเริ่มต้น script จะค้นหา
runtime cache ของ Codex ที่ `$CODEX_HOME/models_cache.json`, จากนั้น
`~/.codex/models_cache.json`, และจึงค่อย fallback ไปยัง convention ของ checkout Codex ของ maintainer
ที่ `~/code/codex/codex-rs/models-manager/models.json` หากไม่มี
source เหล่านั้นเลย คำสั่งจะ exit โดยไม่เปลี่ยน fixture ที่ commit แล้ว
ส่ง `--catalog <path>` เพื่อรีเฟรชจากไฟล์ `models_cache.json`
หรือ `models.json` เฉพาะเจาะจง

snapshots เหล่านี้ยังไม่ใช่ raw OpenAI request capture แบบ byte-for-byte Codex
สามารถเพิ่ม workspace context ที่รันไทม์เป็นเจ้าของ เช่น `AGENTS.md`, environment
context, memories, app/plugin instructions, และ collaboration-mode instructions
ในอนาคต ภายในรันไทม์ Codex หลังจาก OpenClaw ส่ง thread และ turn
params แล้ว

สร้างใหม่ด้วย `pnpm prompt:snapshots:gen` และตรวจ drift ด้วย
`pnpm prompt:snapshots:check` CI รันการตรวจ drift ใน additional
boundary shard เพื่อให้การเปลี่ยนแปลง prompt และการอัปเดต snapshot อยู่ใน PR เดียวกัน

## การฉีด bootstrap ของพื้นที่ทำงาน

Bootstrap files ถูก trim และต่อท้ายใต้ **บริบทโครงการ** เพื่อให้โมเดลเห็นบริบท identity และ profile โดยไม่ต้องอ่านอย่างชัดเจน:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (เฉพาะบนพื้นที่ทำงานใหม่เอี่ยม)
- `MEMORY.md` เมื่อมีอยู่

ไฟล์ทั้งหมดเหล่านี้ถูก **ฉีดเข้าไปใน context window** ทุกเทิร์น เว้นแต่
gate เฉพาะไฟล์จะมีผล `HEARTBEAT.md` จะถูกละเว้นในการรันปกติเมื่อ
ปิดใช้ Heartbeat สำหรับ agent เริ่มต้น หรือ
`agents.defaults.heartbeat.includeSystemPromptSection` เป็น false เก็บไฟล์ที่ฉีดเข้าไป
ให้กระชับ โดยเฉพาะ `MEMORY.md` ซึ่งอาจเติบโตตามเวลาและนำไปสู่
การใช้ context สูงเกินคาดและ Compaction ที่ถี่ขึ้น

เมื่อ session ทำงานบน harness Codex แบบ native Codex จะโหลด `AGENTS.md`
ผ่านการค้นหา project-doc ของตัวเอง OpenClaw ยัง resolve
bootstrap files ที่เหลือและส่งต่อเป็นคำสั่ง config ของ Codex ดังนั้น `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, และ
`MEMORY.md` จึงคงบทบาท workspace-context เดิมไว้โดยไม่ทำซ้ำ
`AGENTS.md`

<Note>
ไฟล์รายวัน `memory/*.md` **ไม่ใช่** ส่วนหนึ่งของบริบทโครงการ bootstrap ปกติ ในเทิร์นทั่วไป ไฟล์เหล่านี้ถูกเข้าถึงตามต้องการผ่านเครื่องมือ `memory_search` และ `memory_get` ดังนั้นจึงไม่นับรวมใน context window เว้นแต่โมเดลจะอ่านอย่างชัดเจน เทิร์น `/new` และ `/reset` แบบเปล่าเป็นข้อยกเว้น: รันไทม์สามารถ prepend หน่วยความจำรายวันที่ผ่านมาไม่นานเป็นบล็อก startup-context แบบครั้งเดียวสำหรับเทิร์นแรกนั้นได้
</Note>

ไฟล์ขนาดใหญ่ถูกตัดทอนพร้อม marker ขนาดสูงสุดต่อไฟล์ควบคุมโดย
`agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) เนื้อหา bootstrap ที่ฉีดเข้าไปทั้งหมด
ข้ามไฟล์ถูกจำกัดโดย `agents.defaults.bootstrapTotalMaxChars`
(ค่าเริ่มต้น: 60000) ไฟล์ที่หายไปจะฉีด marker ไฟล์หายแบบสั้น เมื่อเกิดการตัดทอน
OpenClaw สามารถฉีดบล็อกคำเตือนในบริบทโครงการได้; ควบคุมสิ่งนี้ด้วย
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
ค่าเริ่มต้น: `once`)

session ของ sub-agent ฉีดเฉพาะ `AGENTS.md` และ `TOOLS.md` (bootstrap files อื่น
ถูกกรองออกเพื่อให้บริบทของ sub-agent มีขนาดเล็ก)

internal hooks สามารถ intercept ขั้นตอนนี้ผ่าน `agent:bootstrap` เพื่อ mutate หรือแทนที่
bootstrap files ที่ฉีดเข้าไป (เช่น สลับ `SOUL.md` เป็น persona สำรอง)

หากคุณต้องการทำให้ agent ฟังดู generic น้อยลง ให้เริ่มจาก
[คู่มือบุคลิกภาพ SOUL.md](/th/concepts/soul)

หากต้องการตรวจว่าไฟล์ที่ฉีดเข้าไปแต่ละไฟล์มีส่วนร่วมมากเท่าใด (raw เทียบกับ injected, การตัดทอน, รวมถึง overhead ของ tool schema) ให้ใช้ `/context list` หรือ `/context detail` ดู [บริบท](/th/concepts/context)

## การจัดการเวลา

system prompt รวม section **วันที่และเวลาปัจจุบัน** โดยเฉพาะเมื่อทราบ
timezone ของผู้ใช้ เพื่อให้ prompt cache-stable ตอนนี้จึงรวมเฉพาะ
**time zone** (ไม่มีนาฬิกา dynamic หรือรูปแบบเวลา)

ใช้ `session_status` เมื่อ agent ต้องการเวลาปัจจุบัน; status card
มีบรรทัด timestamp เครื่องมือเดียวกันยังสามารถตั้งค่า model
override ต่อ session ได้แบบเลือกใช้ (`model=default` จะล้างค่า)

กำหนดค่าด้วย:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

ดู [วันที่และเวลา](/th/date-time) สำหรับรายละเอียดพฤติกรรมทั้งหมด

## Skills

เมื่อมี skills ที่เข้าเกณฑ์ OpenClaw จะฉีด **available skills list** แบบกระชับ
(`formatSkillsForPrompt`) ซึ่งรวม **file path** สำหรับแต่ละ skill
prompt สั่งให้โมเดลใช้ `read` เพื่อโหลด SKILL.md ที่ตำแหน่งที่ระบุ
(workspace, managed, หรือ bundled) หากไม่มี skills ที่เข้าเกณฑ์
section Skills จะถูกละเว้น

eligibility รวมถึง gates ของ metadata ของ skill, การตรวจ runtime environment/config,
และ effective agent skill allowlist เมื่อกำหนดค่า `agents.defaults.skills` หรือ
`agents.list[].skills`

skills ที่ bundle มากับ Plugin จะเข้าเกณฑ์เฉพาะเมื่อ Plugin เจ้าของถูกเปิดใช้เท่านั้น
สิ่งนี้ช่วยให้ tool plugins เปิดเผยคู่มือการปฏิบัติงานที่ลึกขึ้นโดยไม่ต้องฝัง
คำแนะนำทั้งหมดนั้นลงในคำอธิบายเครื่องมือทุกตัวโดยตรง

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

สิ่งนี้ทำให้ base prompt มีขนาดเล็ก ขณะยังเปิดใช้การใช้ skill แบบเจาะจงได้

งบประมาณของ skills list เป็นของ subsystem skills:

- ค่าเริ่มต้น global: `skills.limits.maxSkillsPromptChars`
- override ต่อ agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

ข้อความตัดตอนของรันไทม์ทั่วไปแบบมีขอบเขตใช้ surface อื่น:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

การแบ่งเช่นนี้ทำให้การกำหนดขนาดของ Skills แยกจากการกำหนดขนาดการอ่าน/การฉีดใน runtime เช่น `memory_get`, ผลลัพธ์เครื่องมือแบบสด, และการรีเฟรช AGENTS.md หลัง Compaction

## เอกสารประกอบ

พรอมต์ระบบมีส่วน **เอกสารประกอบ** เมื่อมีเอกสารภายในเครื่อง ส่วนนี้จะชี้ไปยังไดเรกทอรีเอกสาร OpenClaw ภายในเครื่อง (`docs/` ใน Git checkout หรือเอกสารในแพ็กเกจ npm ที่รวมมา) หากไม่มีเอกสารภายในเครื่อง จะใช้
[https://docs.openclaw.ai](https://docs.openclaw.ai) แทน

ส่วนเดียวกันนี้ยังรวมตำแหน่งซอร์สของ OpenClaw ด้วย Git checkouts จะแสดงรากซอร์สภายในเครื่องเพื่อให้เอเจนต์ตรวจสอบโค้ดได้โดยตรง การติดตั้งแพ็กเกจจะรวม URL ซอร์ส GitHub และบอกให้เอเจนต์ตรวจสอบซอร์สที่นั่นเมื่อเอกสารไม่ครบถ้วนหรือล้าสมัย พรอมต์ยังระบุมิเรอร์เอกสารสาธารณะ, Discord ชุมชน, และ ClawHub
([https://clawhub.ai](https://clawhub.ai)) สำหรับการค้นพบ Skills โดยบอกให้โมเดลอ่านเอกสารก่อนสำหรับพฤติกรรม คำสั่ง การกำหนดค่า หรือสถาปัตยกรรมของ OpenClaw และให้เรียกใช้ `openclaw status` เองเมื่อทำได้ (ถามผู้ใช้เฉพาะเมื่อไม่มีสิทธิ์เข้าถึง) สำหรับการกำหนดค่าโดยเฉพาะ จะชี้เอเจนต์ไปยังการกระทำเครื่องมือ `gateway`
`config.schema.lookup` เพื่อดูเอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำ จากนั้นจึงไปยัง
`docs/gateway/configuration.md` และ `docs/gateway/configuration-reference.md`
สำหรับคำแนะนำที่กว้างขึ้น

## ที่เกี่ยวข้อง

- [runtime ของเอเจนต์](/th/concepts/agent)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [เครื่องมือบริบท](/th/concepts/context-engine)
