---
read_when:
    - การแก้ไขข้อความพรอมป์ระบบ รายการเครื่องมือ หรือส่วนเวลา/Heartbeat
    - การเปลี่ยนลักษณะการทำงานของการบูตสแตรปพื้นที่ทำงานหรือการฉีด Skills
summary: พรอมต์ระบบของ OpenClaw ประกอบด้วยอะไรและถูกประกอบขึ้นอย่างไร
title: พรอมป์ระบบ
x-i18n:
    generated_at: "2026-05-03T21:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw สร้างพรอมป์ระบบแบบกำหนดเองสำหรับการรัน agent ทุกครั้ง พรอมป์นี้เป็น **ของ OpenClaw** และไม่ใช้พรอมป์เริ่มต้นของ pi-coding-agent

พรอมป์ถูกประกอบโดย OpenClaw และฉีดเข้าไปในการรัน agent แต่ละครั้ง

Plugin ของผู้ให้บริการสามารถเพิ่มคำแนะนำพรอมป์ที่รับรู้แคชได้โดยไม่แทนที่
พรอมป์เต็มรูปแบบที่เป็นของ OpenClaw runtime ของผู้ให้บริการสามารถ:

- แทนที่ส่วน core ที่มีชื่อไว้ชุดเล็ก ๆ (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ฉีด **คำนำหน้าที่เสถียร** เหนือขอบเขตแคชพรอมป์
- ฉีด **คำต่อท้ายแบบไดนามิก** ใต้ขอบเขตแคชพรอมป์

ใช้ contribution ที่ผู้ให้บริการเป็นเจ้าของสำหรับการปรับแต่งเฉพาะตระกูลโมเดล เก็บการกลายพันธุ์พรอมป์แบบเดิม
`before_prompt_build` ไว้สำหรับความเข้ากันได้หรือการเปลี่ยนแปลงพรอมป์
แบบทั่วทั้งระบบจริง ๆ ไม่ใช่พฤติกรรมปกติของผู้ให้บริการ

โอเวอร์เลย์ตระกูล OpenAI GPT-5 ทำให้กฎการทำงาน core มีขนาดเล็กและเพิ่ม
คำแนะนำเฉพาะโมเดลสำหรับการยึด persona, output ที่กระชับ, วินัยการใช้ tool,
การค้นหาแบบขนาน, ความครอบคลุมของ deliverable, การตรวจสอบยืนยัน, บริบทที่ขาดหาย และ
สุขอนามัยของ terminal-tool

## โครงสร้าง

พรอมป์ตั้งใจให้กระชับและใช้ส่วนที่คงที่:

- **Tooling**: คำเตือนแหล่งจริงของ structured-tool พร้อมคำแนะนำการใช้ tool ของ runtime
- **Execution Bias**: คำแนะนำ follow-through แบบกระชับ: ลงมือภายใน turn กับ
  คำขอที่ดำเนินการได้, ทำต่อจนเสร็จหรือถูกบล็อก, กู้คืนจากผล tool
  ที่อ่อน, ตรวจสอบสถานะที่เปลี่ยนแปลงได้แบบ live, และตรวจสอบยืนยันก่อนสรุป final
- **Safety**: คำเตือน guardrail สั้น ๆ เพื่อหลีกเลี่ยงพฤติกรรมแสวงหาอำนาจหรือการเลี่ยงการกำกับดูแล
- **Skills** (เมื่อมี): บอกโมเดลว่าจะโหลดคำสั่ง skill ตามต้องการอย่างไร
- **OpenClaw Self-Update**: วิธีตรวจสอบ config อย่างปลอดภัยด้วย
  `config.schema.lookup`, patch config ด้วย `config.patch`, แทนที่ config ทั้งหมด
  ด้วย `config.apply`, และรัน `update.run` เฉพาะเมื่อผู้ใช้ร้องขออย่างชัดเจน
  เท่านั้น tool `gateway` แบบ owner-only ยังปฏิเสธการเขียนทับ
  `tools.exec.ask` / `tools.exec.security` รวมถึง alias แบบเดิม `tools.bash.*`
  ที่ normalize ไปยัง exec paths ที่ได้รับการป้องกันเหล่านั้น
- **Workspace**: ไดเรกทอรีทำงาน (`agents.defaults.workspace`)
- **Documentation**: path ภายในเครื่องไปยังเอกสาร OpenClaw (repo หรือแพ็กเกจ npm) และควรอ่านเมื่อใด
- **Workspace Files (injected)**: ระบุว่า bootstrap files ถูกรวมไว้ด้านล่าง
- **Sandbox** (เมื่อเปิดใช้งาน): ระบุ sandboxed runtime, sandbox paths, และมี elevated exec หรือไม่
- **Current Date & Time**: เวลาท้องถิ่นของผู้ใช้, timezone, และรูปแบบเวลา
- **Reply Tags**: syntax ของ reply tag แบบ optional สำหรับผู้ให้บริการที่รองรับ
- **Heartbeats**: พรอมป์ Heartbeat และพฤติกรรม ack เมื่อเปิดใช้งาน Heartbeat สำหรับ agent เริ่มต้น
- **Runtime**: host, OS, node, model, repo root (เมื่อตรวจพบ), ระดับ thinking (หนึ่งบรรทัด)
- **Reasoning**: ระดับ visibility ปัจจุบัน + hint toggle /reasoning

OpenClaw เก็บเนื้อหาขนาดใหญ่ที่เสถียร รวมถึง **Project Context** ไว้เหนือ
ขอบเขตแคชพรอมป์ภายใน ส่วน channel/session ที่เปลี่ยนแปลงบ่อย เช่น
คำแนะนำ Control UI embed, **Messaging**, **Voice**, **Group Chat Context**,
**Reactions**, **Heartbeats**, และ **Runtime** จะถูกต่อท้ายใต้ขอบเขตนั้น
เพื่อให้ backend ภายในเครื่องที่มี prefix caches สามารถใช้คำนำหน้า workspace ที่เสถียร
ซ้ำได้ข้าม channel turns คำอธิบาย tool ก็ควรหลีกเลี่ยงการฝังชื่อ
channel ปัจจุบันเช่นกัน เมื่อ schema ที่ยอมรับได้มีรายละเอียด runtime นั้นอยู่แล้ว

ส่วน Tooling ยังรวมคำแนะนำ runtime สำหรับงานที่ใช้เวลานาน:

- ใช้ cron สำหรับการติดตามผลในอนาคต (`check back later`, reminders, recurring work)
  แทน `exec` sleep loops, เทคนิคหน่วงเวลา `yieldMs`, หรือการ polling `process`
  ซ้ำ ๆ
- ใช้ `exec` / `process` เฉพาะสำหรับคำสั่งที่เริ่มตอนนี้และทำงานต่อ
  ในเบื้องหลัง
- เมื่อเปิดใช้งาน automatic completion wake ให้เริ่มคำสั่งหนึ่งครั้งและพึ่งพา
  path wake แบบ push-based เมื่อมี output หรือ fail
- ใช้ `process` สำหรับ logs, status, input, หรือ intervention เมื่อคุณต้อง
  ตรวจสอบคำสั่งที่กำลังทำงาน
- หากงานมีขนาดใหญ่กว่า ให้เลือกใช้ `sessions_spawn`; การเสร็จของ sub-agent เป็น
  แบบ push-based และประกาศกลับไปยัง requester โดยอัตโนมัติ
- อย่า poll `subagents list` / `sessions_list` ใน loop เพียงเพื่อรอ
  completion

เมื่อเปิดใช้งาน tool ทดลอง `update_plan` แล้ว Tooling ยังบอกให้
โมเดลใช้เฉพาะงานหลายขั้นตอนที่ไม่ง่าย, คง step `in_progress` ไว้ให้มีเพียงหนึ่งรายการ
และหลีกเลี่ยงการทำซ้ำแผนทั้งหมดหลังการอัปเดตแต่ละครั้ง

Safety guardrails ในพรอมป์ระบบเป็นคำแนะนำเท่านั้น สิ่งเหล่านี้ชี้นำพฤติกรรมของโมเดลแต่ไม่ได้บังคับใช้นโยบาย ใช้ tool policy, exec approvals, sandboxing, และ channel allowlists สำหรับการบังคับใช้จริง; operator สามารถปิดสิ่งเหล่านี้ได้โดยเจตนา

บน channel ที่มี approval cards/buttons แบบ native ตอนนี้พรอมป์ runtime บอกให้
agent พึ่งพา UI approval แบบ native นั้นก่อน ควรรวมคำสั่งแบบ manual
`/approve` เฉพาะเมื่อผล tool บอกว่า chat approvals ไม่พร้อมใช้งานหรือ
manual approval เป็น path เดียวเท่านั้น

## โหมดพรอมป์

OpenClaw สามารถ render พรอมป์ระบบที่เล็กลงสำหรับ sub-agents runtime ตั้งค่า
`promptMode` สำหรับแต่ละ run (ไม่ใช่ config ที่แสดงต่อผู้ใช้):

- `full` (ค่าเริ่มต้น): รวมทุกส่วนด้านบน
- `minimal`: ใช้สำหรับ sub-agents; ละเว้น **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, และ **Heartbeats** Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (เมื่อทราบ), Runtime, และ injected
  context ยังคงพร้อมใช้งาน
- `none`: ส่งคืนเฉพาะบรรทัด base identity

เมื่อ `promptMode=minimal` พรอมป์ที่ฉีดเพิ่มจะมีป้ายกำกับเป็น **Subagent
Context** แทน **Group Chat Context**

สำหรับการรัน auto-reply ของ channel OpenClaw สามารถละเว้นส่วน **Silent Replies**
แบบทั่วไปได้ เมื่อบริบท direct/group chat มีพฤติกรรม `NO_REPLY`
เฉพาะบทสนทนาที่ resolve แล้วอยู่แล้ว วิธีนี้หลีกเลี่ยงการทำซ้ำกลไก token
ทั้งในพรอมป์ระบบ global และบริบท channel

## สแนปช็อตพรอมป์

OpenClaw เก็บสแนปช็อตพรอมป์ที่ commit แล้วสำหรับ happy path ของ runtime Codex ไว้ใต้
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` สแนปช็อตเหล่านี้ render
พารามิเตอร์ thread/turn ของ app-server ที่เลือกไว้ พร้อม stack ของชั้นพรอมป์ที่ผูกกับโมเดล
ซึ่ง reconstruct สำหรับ Telegram direct, Discord group, และ heartbeat turns stack นั้น
รวม fixture พรอมป์โมเดล Codex `gpt-5.5` ที่ pin ไว้ซึ่งสร้างจากรูปทรง
model catalog/cache ของ Codex, ข้อความ developer permission happy-path ของ Codex,
คำสั่ง developer ของ OpenClaw, คำสั่ง collaboration-mode ที่ scoped ตาม turn
เมื่อ OpenClaw จัดให้, input ของ user turn, และการอ้างอิงถึง dynamic tool
specs

รีเฟรช fixture พรอมป์โมเดล Codex ที่ pin ไว้ด้วย
`pnpm prompt:snapshots:sync-codex-model` โดยค่าเริ่มต้น script จะหา
runtime cache ของ Codex ที่ `$CODEX_HOME/models_cache.json`, จากนั้น
`~/.codex/models_cache.json`, และหลังจากนั้นจึง fallback ไปยัง convention ของ checkout Codex
สำหรับ maintainer ที่ `~/code/codex/codex-rs/models-manager/models.json` หาก
ไม่มี source เหล่านี้อยู่ คำสั่งจะ exit โดยไม่เปลี่ยน fixture ที่ commit แล้ว
ส่ง `--catalog <path>` เพื่อรีเฟรชจากไฟล์ `models_cache.json`
หรือ `models.json` ที่ระบุ

สแนปช็อตเหล่านี้ยังไม่ใช่การจับ raw OpenAI request แบบ byte-for-byte Codex
สามารถเพิ่ม workspace context ที่ runtime เป็นเจ้าของ เช่น `AGENTS.md`, environment
context, memories, คำสั่ง app/plugin, และคำสั่ง collaboration-mode Default
ในตัว ภายใน runtime Codex หลังจาก OpenClaw ส่ง
พารามิเตอร์ thread และ turn แล้ว

Regenerate ด้วย `pnpm prompt:snapshots:gen` และตรวจสอบ drift ด้วย
`pnpm prompt:snapshots:check` CI รัน drift check ใน additional
boundary shard เพื่อให้การเปลี่ยนแปลงพรอมป์และการอัปเดตสแนปช็อตผูกกับ PR เดียวกัน

## การฉีด bootstrap ของ workspace

Bootstrap files ถูก trim และต่อท้ายใต้ **Project Context** เพื่อให้โมเดลเห็นบริบท identity และ profile โดยไม่ต้องอ่านอย่างชัดเจน:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (เฉพาะ workspace ที่สร้างใหม่)
- `MEMORY.md` เมื่อมี

ไฟล์ทั้งหมดเหล่านี้ถูก **ฉีดเข้าไปใน context window** ในทุก turn เว้นแต่
จะมี gate เฉพาะไฟล์ใช้อยู่ `HEARTBEAT.md` จะถูกละเว้นในการรันปกติเมื่อ
ปิดใช้งาน Heartbeat สำหรับ agent เริ่มต้น หรือ
`agents.defaults.heartbeat.includeSystemPromptSection` เป็น false รักษาไฟล์ที่ฉีดให้กระชับ
โดยเฉพาะ `MEMORY.md` ซึ่งสามารถโตขึ้นตามเวลาและนำไปสู่
การใช้บริบทสูงโดยไม่คาดคิดและ Compaction ที่ถี่ขึ้น

เมื่อ session รันบน native Codex harness, Codex จะโหลด `AGENTS.md`
ผ่าน project-doc discovery ของตัวเอง OpenClaw ยังคง resolve bootstrap files
ที่เหลือและ forward เป็นคำสั่ง config ของ Codex ดังนั้น `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, และ
`MEMORY.md` จึงยังคงมีบทบาท workspace-context เดิมโดยไม่ทำซ้ำ
`AGENTS.md`

<Note>
ไฟล์รายวัน `memory/*.md` **ไม่ใช่** ส่วนหนึ่งของ Project Context สำหรับ bootstrap ปกติ ใน turn ทั่วไปไฟล์เหล่านี้ถูกเข้าถึงตามต้องการผ่าน tools `memory_search` และ `memory_get` ดังนั้นจึงไม่นับรวมใน context window เว้นแต่โมเดลจะอ่านโดยชัดเจน turn แบบ bare `/new` และ `/reset` เป็นข้อยกเว้น: runtime สามารถ prepend daily memory ล่าสุดเป็นบล็อก startup-context แบบครั้งเดียวสำหรับ turn แรกนั้น
</Note>

ไฟล์ขนาดใหญ่จะถูกตัดทอนพร้อม marker ขนาดสูงสุดต่อไฟล์ถูกควบคุมโดย
`agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) เนื้อหา bootstrap ที่ฉีดทั้งหมด
ข้ามไฟล์ถูกจำกัดโดย `agents.defaults.bootstrapTotalMaxChars`
(ค่าเริ่มต้น: 60000) ไฟล์ที่หายไปจะฉีด marker สั้น ๆ ว่าไฟล์หายไป เมื่อเกิดการตัดทอน
OpenClaw สามารถฉีดบล็อกคำเตือนใน Project Context; ควบคุมสิ่งนี้ด้วย
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
ค่าเริ่มต้น: `once`)

Session ของ sub-agent จะฉีดเฉพาะ `AGENTS.md` และ `TOOLS.md` (bootstrap files อื่น
ถูกกรองออกเพื่อรักษาบริบท sub-agent ให้เล็ก)

Internal hooks สามารถ intercept ขั้นตอนนี้ผ่าน `agent:bootstrap` เพื่อ mutate หรือ replace
bootstrap files ที่ฉีด (เช่น สลับ `SOUL.md` เป็น persona ทางเลือก)

หากคุณต้องการทำให้ agent ฟังดู generic น้อยลง ให้เริ่มด้วย
[คู่มือบุคลิกภาพ SOUL.md](/th/concepts/soul)

หากต้องการตรวจสอบว่าไฟล์ที่ฉีดแต่ละไฟล์มี contribution เท่าใด (raw เทียบกับ injected, truncation, รวมถึง overhead ของ tool schema) ให้ใช้ `/context list` หรือ `/context detail` ดู [Context](/th/concepts/context)

## การจัดการเวลา

พรอมป์ระบบมีส่วน **Current Date & Time** เฉพาะเมื่อทราบ
timezone ของผู้ใช้ เพื่อให้พรอมป์ cache-stable ตอนนี้จึงรวมเฉพาะ
**time zone** (ไม่มี dynamic clock หรือ time format)

ใช้ `session_status` เมื่อ agent ต้องการเวลาปัจจุบัน; status card
มีบรรทัด timestamp tool เดียวกันยังสามารถตั้ง per-session model
override ได้แบบ optional (`model=default` จะล้างค่า)

กำหนดค่าด้วย:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

ดู [Date & Time](/th/date-time) สำหรับรายละเอียดพฤติกรรมทั้งหมด

## Skills

เมื่อมี skills ที่ eligible OpenClaw จะฉีด **available skills list** แบบกระชับ
(`formatSkillsForPrompt`) ที่รวม **file path** สำหรับแต่ละ skill พรอมป์
สั่งให้โมเดลใช้ `read` เพื่อโหลด SKILL.md ที่ตำแหน่งที่ระบุ
(workspace, managed, หรือ bundled) หากไม่มี skills ที่ eligible ส่วน
Skills จะถูกละเว้น

Eligibility รวมถึง gates ของ skill metadata, การตรวจสอบ runtime environment/config,
และ agent skill allowlist ที่มีผลเมื่อกำหนดค่า `agents.defaults.skills` หรือ
`agents.list[].skills`

Skills ที่ bundled มากับ Plugin จะ eligible เฉพาะเมื่อ Plugin เจ้าของเปิดใช้งานอยู่
สิ่งนี้ช่วยให้ tool plugins เปิดเผย operating guides ที่ลึกขึ้นได้โดยไม่ฝัง
คำแนะนำทั้งหมดนั้นโดยตรงในทุกคำอธิบาย tool

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

วิธีนี้ทำให้ base prompt มีขนาดเล็กในขณะที่ยังเปิดใช้งานการใช้ skill แบบ targeted

งบประมาณ skills list เป็นของระบบย่อย skills:

- ค่าเริ่มต้น global: `skills.limits.maxSkillsPromptChars`
- override ต่อ agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

ข้อความตัดตอนของรันไทม์แบบมีขอบเขตทั่วไปใช้พื้นผิวที่ต่างกัน:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

การแยกนี้ทำให้การกำหนดขนาดของ Skills แยกจากการกำหนดขนาดสำหรับการอ่าน/การฉีดข้อมูลของรันไทม์ เช่น `memory_get`, ผลลัพธ์ของเครื่องมือสด และการรีเฟรช AGENTS.md หลัง Compaction

## เอกสารประกอบ

พรอมป์ระบบมีส่วน **เอกสารประกอบ** เมื่อมีเอกสารในเครื่องพร้อมใช้งาน ส่วนนี้จะชี้ไปยังไดเรกทอรีเอกสาร OpenClaw ในเครื่อง (`docs/` ใน Git checkout หรือเอกสารที่มาพร้อมกับแพ็กเกจ npm) หากเอกสารในเครื่องไม่พร้อมใช้งาน ระบบจะย้อนกลับไปใช้
[https://docs.openclaw.ai](https://docs.openclaw.ai)

ส่วนเดียวกันนี้ยังรวมตำแหน่งซอร์สของ OpenClaw ด้วย Git checkout จะแสดงรูทซอร์สในเครื่องเพื่อให้เอเจนต์ตรวจสอบโค้ดได้โดยตรง การติดตั้งแบบแพ็กเกจจะรวม URL ซอร์ส GitHub และบอกให้เอเจนต์ตรวจสอบซอร์สที่นั่นเมื่อเอกสารไม่สมบูรณ์หรือล้าสมัย พรอมป์ยังระบุถึงมิเรอร์เอกสารสาธารณะ, Discord ชุมชน และ ClawHub
([https://clawhub.ai](https://clawhub.ai)) สำหรับการค้นหา Skills โดยจะบอกโมเดลให้ปรึกษาเอกสารก่อนสำหรับพฤติกรรม คำสั่ง การกำหนดค่า หรือสถาปัตยกรรมของ OpenClaw และให้รัน `openclaw status` ด้วยตนเองเมื่อเป็นไปได้ (ถามผู้ใช้เฉพาะเมื่อไม่มีสิทธิ์เข้าถึง) สำหรับการกำหนดค่าโดยเฉพาะ จะชี้เอเจนต์ไปยังการดำเนินการเครื่องมือ `gateway` ชื่อ
`config.schema.lookup` เพื่อดูเอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำ จากนั้นไปที่
`docs/gateway/configuration.md` และ `docs/gateway/configuration-reference.md`
เพื่อคำแนะนำที่กว้างขึ้น

## ที่เกี่ยวข้อง

- [รันไทม์เอเจนต์](/th/concepts/agent)
- [พื้นที่ทำงานเอเจนต์](/th/concepts/agent-workspace)
- [เอนจินบริบท](/th/concepts/context-engine)
