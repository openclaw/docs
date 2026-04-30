---
read_when:
    - การเรียกใช้ฮาร์เนสการเขียนโค้ดผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับการสนทนาบนช่องทางการรับส่งข้อความ
    - การผูกการสนทนาของช่องทางข้อความกับเซสชัน ACP แบบคงอยู่
    - การแก้ไขปัญหาแบ็กเอนด์ ACP, การเชื่อมต่อ Plugin หรือการส่งคำตอบที่เสร็จสมบูรณ์
    - การใช้งานคำสั่ง /acp จากแชต
sidebarTitle: ACP agents
summary: เรียกใช้ชุดควบคุมการเขียนโค้ดภายนอก (Claude Code, Cursor, Gemini CLI, Codex ACP แบบระบุชัด, OpenClaw ACP, OpenCode) ผ่านแบ็กเอนด์ ACP
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-04-30T10:18:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessions
ช่วยให้ OpenClaw เรียกใช้ชุดควบคุมการเขียนโค้ดภายนอก (เช่น Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI และชุดควบคุม
ACPX อื่นๆ ที่รองรับ) ผ่าน ACP backend plugin ได้

การ spawn ของแต่ละ ACP session จะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

<Note>
**ACP คือเส้นทางชุดควบคุมภายนอก ไม่ใช่เส้นทาง Codex เริ่มต้น** Plugin
native Codex app-server เป็นเจ้าของตัวควบคุม `/codex ...` และ embedded
runtime `agentRuntime.id: "codex"` ส่วน ACP เป็นเจ้าของตัวควบคุม
`/acp ...` และเซสชัน `sessions_spawn({ runtime: "acp" })`

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็นไคลเอนต์ MCP ภายนอก
โดยตรงกับการสนทนาในช่อง OpenClaw ที่มีอยู่ ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน ACP
</Note>

## ฉันควรใช้หน้าใด?

| คุณต้องการ…                                                                                    | ใช้สิ่งนี้                              | หมายเหตุ                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ผูกหรือควบคุม Codex ในการสนทนาปัจจุบัน                                               | `/codex bind`, `/codex threads`       | เส้นทาง native Codex app-server เมื่อเปิดใช้ Plugin `codex`; รวมถึงการตอบกลับแชตที่ผูกไว้, การส่งต่อรูปภาพ, model/fast/permissions, stop และตัวควบคุม steer ACP เป็น fallback แบบชัดเจน |
| เรียกใช้ Claude Code, Gemini CLI, Codex ACP แบบชัดเจน หรือชุดควบคุมภายนอกอื่น _ผ่าน_ OpenClaw | หน้านี้                             | เซสชันที่ผูกกับแชต, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, งานเบื้องหลัง, ตัวควบคุม runtime                                                                                   |
| เปิดเผย OpenClaw Gateway session _เป็น_ ACP server สำหรับ editor หรือ client                   | [`openclaw acp`](/th/cli/acp)            | โหมด bridge IDE/client คุย ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                                                                                            |
| ใช้ AI CLI ภายในเครื่องซ้ำเป็น fallback model แบบข้อความเท่านั้น                                              | [CLI Backends](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw, ไม่มีตัวควบคุม ACP, ไม่มี harness runtime                                                                                                                               |

## ใช้งานได้ทันทีหรือไม่?

โดยปกติใช่ การติดตั้งใหม่มาพร้อม runtime plugin `acpx` แบบ bundled ที่เปิดใช้
ตามค่าเริ่มต้น พร้อมไบนารี `acpx` ที่ปักเวอร์ชันไว้ภายใน Plugin ซึ่ง OpenClaw จะ probe
และ self-repair ตอนเริ่มต้น เรียกใช้ `/acp doctor` เพื่อตรวจความพร้อม

OpenClaw จะสอน agents เกี่ยวกับการ spawn ACP เฉพาะเมื่อ ACP **ใช้งานได้จริง**
เท่านั้น: ต้องเปิดใช้ ACP, dispatch ต้องไม่ถูกปิด, เซสชันปัจจุบันต้องไม่ถูกบล็อกโดย sandbox
และต้องโหลด runtime backend แล้ว หากไม่เป็นไปตามเงื่อนไขเหล่านี้ Skills ของ ACP plugin และ
คำแนะนำ ACP สำหรับ `sessions_spawn` จะยังถูกซ่อน เพื่อให้ agent ไม่แนะนำ
backend ที่ใช้งานไม่ได้

<AccordionGroup>
  <Accordion title="ข้อควรระวังในการรันครั้งแรก">
    - หากตั้งค่า `plugins.allow` ไว้ ค่านี้คือรายการ Plugin inventory แบบจำกัดสิทธิ์ และ **ต้อง** มี `acpx`; ไม่เช่นนั้นค่าเริ่มต้นแบบ bundled จะถูกบล็อกโดยเจตนา และ `/acp doctor` จะรายงานรายการ allowlist ที่ขาดไป
    - bundled Codex ACP adapter จะถูก staged พร้อม Plugin `acpx` และเรียกใช้ภายในเครื่องเมื่อเป็นไปได้
    - adapter ของ target harness อื่นอาจยังถูกดึงตามต้องการด้วย `npx` ในครั้งแรกที่คุณใช้
    - vendor auth ยังต้องมีอยู่บน host สำหรับ harness นั้น
    - หาก host ไม่มี npm หรือไม่มี network access การดึง adapter ครั้งแรกจะล้มเหลวจนกว่าจะ pre-warm cache หรือ install adapter ด้วยวิธีอื่น

  </Accordion>
  <Accordion title="ข้อกำหนดเบื้องต้นของ runtime">
    ACP เรียกใช้โปรเซส external harness จริง OpenClaw เป็นเจ้าของ routing,
    สถานะ background-task, delivery, bindings และ policy ส่วน harness
    เป็นเจ้าของ provider login, model catalog, พฤติกรรม filesystem และ
    native tools ของตัวเอง

    ก่อนโทษ OpenClaw ให้ตรวจสอบ:

    - `/acp doctor` รายงาน backend ที่เปิดใช้และสุขภาพดี
    - target id ได้รับอนุญาตโดย `acp.allowedAgents` เมื่อมีการตั้งค่า allowlist นั้น
    - คำสั่ง harness เริ่มทำงานบน Gateway host ได้
    - มี provider auth สำหรับ harness นั้น (`claude`, `codex`, `gemini`, `opencode`, `droid` ฯลฯ)
    - model ที่เลือกมีอยู่สำหรับ harness นั้น — model ids ไม่สามารถย้ายใช้ข้าม harness ได้
    - `cwd` ที่ร้องขอมีอยู่และเข้าถึงได้ หรือไม่ต้องระบุ `cwd` แล้วให้ backend ใช้ค่าเริ่มต้นของตัวเอง
    - permission mode ตรงกับงาน เซสชันแบบ non-interactive ไม่สามารถคลิก native permission prompts ได้ ดังนั้นรันการเขียนโค้ดที่เน้น write/exec มักต้องใช้ ACPX permission profile ที่ดำเนินต่อแบบ headless ได้

  </Accordion>
</AccordionGroup>

เครื่องมือ OpenClaw plugin และเครื่องมือ OpenClaw ในตัวจะ **ไม่** ถูกเปิดเผยให้
ACP harnesses ตามค่าเริ่มต้น เปิดใช้ MCP bridges แบบชัดเจนใน
[ACP agents — setup](/th/tools/acp-agents-setup) เฉพาะเมื่อ harness
ควรเรียกเครื่องมือเหล่านั้นโดยตรง

## target harness ที่รองรับ

เมื่อใช้ backend `acpx` แบบ bundled ให้ใช้ harness ids เหล่านี้เป็น target ของ `/acp spawn <id>`
หรือ `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness id | backend ทั่วไป                                | หมายเหตุ                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adapter                        | ต้องมี Claude Code auth บน host                                              |
| `codex`    | Codex ACP adapter                              | fallback ACP แบบชัดเจนเท่านั้นเมื่อ native `/codex` ใช้งานไม่ได้หรือมีการร้องขอ ACP |
| `copilot`  | GitHub Copilot ACP adapter                     | ต้องมี Copilot CLI/runtime auth                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Override คำสั่ง acpx หากการติดตั้งภายในเครื่องเปิดเผย ACP entrypoint ที่ต่างออกไป    |
| `droid`    | Factory Droid CLI                              | ต้องมี Factory/Droid auth หรือ `FACTORY_API_KEY` ในสภาพแวดล้อมของ harness        |
| `gemini`   | Gemini CLI ACP adapter                         | ต้องมี Gemini CLI auth หรือการตั้งค่า API key                                          |
| `iflow`    | iFlow CLI                                      | ความพร้อมของ adapter และการควบคุม model ขึ้นอยู่กับ CLI ที่ install ไว้                 |
| `kilocode` | Kilo Code CLI                                  | ความพร้อมของ adapter และการควบคุม model ขึ้นอยู่กับ CLI ที่ install ไว้                 |
| `kimi`     | Kimi/Moonshot CLI                              | ต้องมี Kimi/Moonshot auth บน host                                            |
| `kiro`     | Kiro CLI                                       | ความพร้อมของ adapter และการควบคุม model ขึ้นอยู่กับ CLI ที่ install ไว้                 |
| `opencode` | OpenCode ACP adapter                           | ต้องมี OpenCode CLI/provider auth                                                |
| `openclaw` | OpenClaw Gateway bridge ผ่าน `openclaw acp` | ช่วยให้ harness ที่รู้จัก ACP คุยกลับไปยัง OpenClaw Gateway session ได้                 |
| `pi`       | Pi/embedded OpenClaw runtime                   | ใช้สำหรับการทดลอง harness แบบ OpenClaw-native                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | ต้องมี auth ที่เข้ากันได้กับ Qwen บน host                                          |

สามารถกำหนดค่า alias ของ custom acpx agent ใน acpx เองได้ แต่ policy ของ OpenClaw
ยังตรวจสอบ `acp.allowedAgents` และการ mapping
`agents.list[].runtime.acp.agent` ใดๆ ก่อน dispatch

## คู่มือปฏิบัติสำหรับ operator

โฟลว์ `/acp` แบบรวดเร็วจากแชต:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` หรือ explicit
    `/acp spawn codex --bind here`
  </Step>
  <Step title="ทำงาน">
    ดำเนินต่อในการสนทนาหรือ thread ที่ผูกไว้ (หรือ target session
    key อย่างชัดเจน)
  </Step>
  <Step title="ตรวจสอบสถานะ">
    `/acp status`
  </Step>
  <Step title="ปรับแต่ง">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`
  </Step>
  <Step title="Steer">
    โดยไม่แทนที่ context: `/acp steer tighten logging and continue`
  </Step>
  <Step title="หยุด">
    `/acp cancel` (turn ปัจจุบัน) หรือ `/acp close` (session + bindings)
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="รายละเอียด lifecycle">
    - Spawn จะสร้างหรือ resume ACP runtime session, บันทึก metadata ของ ACP ใน OpenClaw session store และอาจสร้าง background task เมื่อ run นั้น parent-owned
    - ACP sessions แบบ parent-owned จะถูกปฏิบัติเป็นงานเบื้องหลัง แม้ runtime session จะเป็น persistent; completion และ cross-surface delivery จะผ่าน parent task notifier แทนการทำตัวเหมือน chat session ปกติที่ผู้ใช้เห็น
    - Task maintenance จะปิด terminal หรือ orphaned parent-owned one-shot ACP sessions ส่วน persistent ACP sessions จะถูกเก็บไว้ขณะที่ยังมี conversation binding ที่ active; stale persistent sessions ที่ไม่มี active binding จะถูกปิด เพื่อไม่ให้ถูก resume แบบเงียบๆ หลังงานเจ้าของเสร็จแล้วหรือ task record หายไป
    - ข้อความ follow-up ที่ผูกไว้จะส่งตรงไปยัง ACP session จนกว่า binding จะถูกปิด, unfocused, reset หรือหมดอายุ
    - Gateway commands จะอยู่ภายในเครื่อง `/acp ...`, `/status` และ `/unfocus` จะไม่ถูกส่งเป็น prompt text ปกติไปยัง ACP harness ที่ผูกไว้
    - `cancel` ยกเลิก turn ที่ active เมื่อ backend รองรับ cancellation; คำสั่งนี้ไม่ลบ binding หรือ session metadata
    - `close` สิ้นสุด ACP session จากมุมมองของ OpenClaw และลบ binding harness อาจยังเก็บ upstream history ของตัวเองไว้หากรองรับ resume
    - idle runtime workers มีสิทธิ์ถูก cleanup หลัง `acp.runtime.ttlMinutes`; stored session metadata ยังคงพร้อมใช้งานสำหรับ `/acp sessions`

  </Accordion>
  <Accordion title="กฎ routing ของ native Codex">
    trigger ภาษาธรรมชาติที่ควร route ไปยัง **native Codex
    plugin** เมื่อเปิดใช้:

    - "ผูกช่อง Discord นี้กับ Codex"
    - "แนบแชตนี้กับ Codex thread `<id>`"
    - "แสดง Codex threads แล้วผูก thread นี้"

    Native Codex conversation binding เป็นเส้นทางควบคุมแชตเริ่มต้น
    OpenClaw dynamic tools ยังคง execute ผ่าน OpenClaw ขณะที่
    Codex-native tools เช่น shell/apply-patch execute ภายใน Codex
    สำหรับ Codex-native tool events, OpenClaw จะ inject native
    hook relay ต่อ turn เพื่อให้ plugin hooks สามารถบล็อก `before_tool_call`, สังเกต
    `after_tool_call` และ route เหตุการณ์ Codex `PermissionRequest`
    ผ่านการ approvals ของ OpenClaw ได้ Codex `Stop` hooks จะถูก relay ไปยัง
    OpenClaw `before_agent_finalize` ซึ่ง plugins สามารถขอ model pass เพิ่มอีกหนึ่งครั้ง
    ก่อนที่ Codex จะ finalize คำตอบของตน relay ยังคงตั้งใจให้ conservative:
    ไม่ mutate arguments ของ Codex-native tool หรือ rewrite Codex thread records ใช้ ACP แบบชัดเจนเท่านั้น
    เมื่อคุณต้องการ ACP runtime/session model ขอบเขตการรองรับ embedded Codex
    มีบันทึกไว้ใน
    [สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="ชีตสรุปการเลือกโมเดล / ผู้ให้บริการ / รันไทม์">
    - `openai-codex/*` — เส้นทาง PI Codex OAuth/การสมัครใช้งาน
    - `openai/*` พร้อม `agentRuntime.id: "codex"` — รันไทม์แบบฝังในเซิร์ฟเวอร์แอป Codex ดั้งเดิม
    - `/codex ...` — การควบคุมการสนทนา Codex ดั้งเดิม
    - `/acp ...` หรือ `runtime: "acp"` — การควบคุม ACP/acpx แบบชัดเจน

  </Accordion>
  <Accordion title="ทริกเกอร์ภาษาธรรมชาติสำหรับการกำหนดเส้นทาง ACP">
    ทริกเกอร์ที่ควรกำหนดเส้นทางไปยังรันไทม์ ACP:

    - "เรียกใช้งานนี้เป็นเซสชัน Claude Code ACP แบบครั้งเดียว แล้วสรุปผลลัพธ์"
    - "ใช้ Gemini CLI สำหรับงานนี้ในเธรด จากนั้นเก็บการติดตามผลไว้ในเธรดเดียวกัน"
    - "เรียก Codex ผ่าน ACP ในเธรดเบื้องหลัง"

    OpenClaw เลือก `runtime: "acp"`, แก้ค่า harness `agentId`,
    ผูกกับการสนทนาหรือเธรดปัจจุบันเมื่อรองรับ และ
    กำหนดเส้นทางการติดตามผลไปยังเซสชันนั้นจนกว่าจะปิด/หมดอายุ Codex จะ
    ใช้เส้นทางนี้เฉพาะเมื่อ ACP/acpx ระบุไว้อย่างชัดเจน หรือ Plugin
    Codex ดั้งเดิมไม่พร้อมใช้งานสำหรับการดำเนินการที่ร้องขอ

    สำหรับ `sessions_spawn`, `runtime: "acp"` จะถูกประกาศเฉพาะเมื่อ ACP
    เปิดใช้งานอยู่ ผู้ร้องขอไม่ได้อยู่ในแซนด์บ็อกซ์ และมีการโหลดแบ็กเอนด์
    รันไทม์ ACP แล้ว `acp.dispatch.enabled=false` จะหยุดพักการส่งต่อ
    เธรด ACP อัตโนมัติ แต่ไม่ซ่อนหรือบล็อกการเรียก
    `sessions_spawn({ runtime: "acp" })` แบบชัดเจน โดยมีเป้าหมายเป็นรหัส harness ของ ACP เช่น `codex`,
    `claude`, `droid`, `gemini` หรือ `opencode` อย่าส่งรหัสเอเจนต์คอนฟิก
    OpenClaw ปกติจาก `agents_list` เว้นแต่รายการนั้นจะถูกกำหนดค่า
    ไว้อย่างชัดเจนด้วย `agents.list[].runtime.type="acp"`;
    มิฉะนั้นให้ใช้รันไทม์ซับเอเจนต์เริ่มต้น เมื่อเอเจนต์ OpenClaw
    ถูกกำหนดค่าด้วย `runtime.type="acp"`, OpenClaw จะใช้
    `runtime.acp.agent` เป็นรหัส harness พื้นฐาน

  </Accordion>
</AccordionGroup>

## ACP เทียบกับซับเอเจนต์

ใช้ ACP เมื่อคุณต้องการรันไทม์ harness ภายนอก ใช้ **เซิร์ฟเวอร์แอป
Codex ดั้งเดิม** สำหรับการผูก/ควบคุมการสนทนา Codex เมื่อเปิดใช้งาน
Plugin `codex` ใช้ **ซับเอเจนต์** เมื่อคุณต้องการการเรียกใช้งานแบบมอบหมาย
ที่เป็นของ OpenClaw โดยตรง

| พื้นที่          | เซสชัน ACP                           | การเรียกใช้ซับเอเจนต์                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| รันไทม์       | Plugin แบ็กเอนด์ ACP (เช่น acpx) | รันไทม์ซับเอเจนต์ดั้งเดิมของ OpenClaw  |
| คีย์เซสชัน   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| คำสั่งหลัก | `/acp ...`                            | `/subagents ...`                   |
| เครื่องมือสร้าง | `sessions_spawn` พร้อม `runtime:"acp"` | `sessions_spawn` (รันไทม์เริ่มต้น) |

ดูเพิ่มเติมที่ [ซับเอเจนต์](/th/tools/subagents)

## ACP เรียกใช้ Claude Code อย่างไร

สำหรับ Claude Code ผ่าน ACP สแตกคือ:

1. ระนาบควบคุมเซสชัน ACP ของ OpenClaw
2. Plugin รันไทม์ `acpx` ที่รวมมาให้
3. อะแดปเตอร์ Claude ACP
4. กลไกรันไทม์/เซสชันฝั่ง Claude

ACP Claude คือ **เซสชัน harness** พร้อมการควบคุม ACP, การกลับมาใช้เซสชันต่อ,
การติดตามงานเบื้องหลัง และการผูกการสนทนา/เธรดแบบเลือกได้

แบ็กเอนด์ CLI เป็นรันไทม์สำรองภายในแบบข้อความเท่านั้นที่แยกออกจากกัน — ดู
[แบ็กเอนด์ CLI](/th/gateway/cli-backends)

สำหรับผู้ปฏิบัติงาน กฎที่ใช้ได้จริงคือ:

- **ต้องการ `/acp spawn`, เซสชันที่ผูกได้, การควบคุมรันไทม์ หรืองาน harness แบบคงอยู่ใช่ไหม** ใช้ ACP
- **ต้องการการสำรองข้อความภายในแบบง่ายผ่าน CLI ดิบใช่ไหม** ใช้แบ็กเอนด์ CLI

## เซสชันที่ผูกไว้

### โมเดลทางความคิด

- **พื้นผิวแชต** — ที่ที่ผู้คนสนทนาต่อเนื่อง (ช่อง Discord, หัวข้อ Telegram, แชต iMessage)
- **เซสชัน ACP** — สถานะรันไทม์ Codex/Claude/Gemini ที่คงอยู่ ซึ่ง OpenClaw กำหนดเส้นทางไปหา
- **เธรด/หัวข้อลูก** — พื้นผิวการส่งข้อความเพิ่มเติมแบบเลือกได้ที่สร้างโดย `--thread ...` เท่านั้น
- **เวิร์กสเปซรันไทม์** — ตำแหน่งระบบไฟล์ (`cwd`, เช็กเอาต์รีโป, เวิร์กสเปซแบ็กเอนด์) ที่ harness ทำงานอยู่ เป็นอิสระจากพื้นผิวแชต

### การผูกการสนทนาปัจจุบัน

`/acp spawn <harness> --bind here` ตรึงการสนทนาปัจจุบันไว้กับ
เซสชัน ACP ที่สร้างขึ้น — ไม่มีเธรดลูก ใช้พื้นผิวแชตเดียวกัน OpenClaw ยังคง
เป็นเจ้าของการขนส่ง การยืนยันตัวตน ความปลอดภัย และการส่งมอบ ข้อความติดตามผลใน
การสนทนานั้นจะถูกกำหนดเส้นทางไปยังเซสชันเดียวกัน; `/new` และ `/reset` รีเซ็ต
เซสชันในที่เดิม; `/acp close` ลบการผูก

ตัวอย่าง:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="กฎการผูกและความเป็นเอกสิทธิ์">
    - `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้
    - `--bind here` ใช้ได้เฉพาะบนช่องทางที่ประกาศความสามารถการผูกการสนทนาปัจจุบัน; มิฉะนั้น OpenClaw จะส่งข้อความไม่รองรับที่ชัดเจนกลับมา การผูกจะคงอยู่ข้ามการรีสตาร์ต Gateway
    - บน Discord, `spawnAcpSessions` จำเป็นเฉพาะเมื่อ OpenClaw ต้องสร้างเธรดลูกสำหรับ `--thread auto|here` — ไม่ใช่สำหรับ `--bind here`
    - หากคุณสร้างไปยังเอเจนต์ ACP อื่นโดยไม่มี `--cwd`, OpenClaw จะสืบทอดเวิร์กสเปซของ **เอเจนต์เป้าหมาย** ตามค่าเริ่มต้น เส้นทางที่สืบทอดแล้วหายไป (`ENOENT`/`ENOTDIR`) จะย้อนกลับไปใช้ค่าเริ่มต้นของแบ็กเอนด์; ข้อผิดพลาดการเข้าถึงอื่น (เช่น `EACCES`) จะแสดงเป็นข้อผิดพลาดการสร้าง
    - คำสั่งจัดการ Gateway จะยังคงอยู่ภายในเครื่องในการสนทนาที่ผูกไว้ — คำสั่ง `/acp ...` จัดการโดย OpenClaw แม้เมื่อข้อความติดตามผลปกติถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้; `/status` และ `/unfocus` ก็ยังคงอยู่ภายในเครื่องเมื่อใดก็ตามที่การจัดการคำสั่งเปิดใช้งานสำหรับพื้นผิวนั้น

  </Accordion>
  <Accordion title="เซสชันที่ผูกกับเธรด">
    เมื่อเปิดใช้งานการผูกเธรดสำหรับอะแดปเตอร์ช่องทาง:

    - OpenClaw ผูกเธรดกับเซสชัน ACP เป้าหมาย
    - ข้อความติดตามผลในเธรดนั้นถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้
    - เอาต์พุต ACP ถูกส่งกลับไปยังเธรดเดียวกัน
    - การเลิกโฟกัส/ปิด/เก็บถาวร/หมดเวลาเมื่อไม่ใช้งาน หรือหมดอายุตามอายุสูงสุด จะลบการผูก
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` และ `/unfocus` เป็นคำสั่ง Gateway ไม่ใช่พรอมป์ไปยัง ACP harness

    แฟล็กฟีเจอร์ที่จำเป็นสำหรับ ACP ที่ผูกกับเธรด:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` เปิดไว้ตามค่าเริ่มต้น (ตั้งค่า `false` เพื่อหยุดพักการส่งต่อเธรด ACP อัตโนมัติ; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงทำงาน)
    - เปิดใช้งานแฟล็กการสร้างเธรด ACP ของอะแดปเตอร์ช่องทาง (เฉพาะอะแดปเตอร์):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    การรองรับการผูกเธรดขึ้นอยู่กับอะแดปเตอร์ หากอะแดปเตอร์ช่องทางที่ใช้งานอยู่
    ไม่รองรับการผูกเธรด OpenClaw จะส่งข้อความไม่รองรับ/ไม่พร้อมใช้งาน
    ที่ชัดเจนกลับมา

  </Accordion>
  <Accordion title="ช่องทางที่รองรับเธรด">
    - อะแดปเตอร์ช่องทางใดก็ตามที่เปิดเผยความสามารถการผูกเซสชัน/เธรด
    - การรองรับในตัวปัจจุบัน: เธรด/ช่อง **Discord**, หัวข้อ **Telegram** (หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป และหัวข้อ DM)
    - ช่องทาง Plugin สามารถเพิ่มการรองรับผ่านอินเทอร์เฟซการผูกเดียวกัน

  </Accordion>
</AccordionGroup>

## การผูกช่องทางแบบคงอยู่

สำหรับเวิร์กโฟลว์ที่ไม่ชั่วคราว ให้กำหนดค่าการผูก ACP แบบคงอยู่ใน
รายการระดับบน `bindings[]`

### โมเดลการผูก

<ParamField path="bindings[].type" type='"acp"'>
  ทำเครื่องหมายการผูกการสนทนา ACP แบบคงอยู่
</ParamField>
<ParamField path="bindings[].match" type="object">
  ระบุการสนทนาเป้าหมาย รูปแบบต่อช่องทาง:

- **ช่อง/เธรด Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **หัวข้อฟอรัม Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/กลุ่ม BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` แนะนำให้ใช้ `chat_id:*` หรือ `chat_identifier:*` สำหรับการผูกกลุ่มที่เสถียร
- **DM/กลุ่ม iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` แนะนำให้ใช้ `chat_id:*` สำหรับการผูกกลุ่มที่เสถียร

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  รหัสเอเจนต์ OpenClaw ที่เป็นเจ้าของ
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  การแทนที่ ACP แบบเลือกได้
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  ป้ายกำกับแบบเลือกได้สำหรับผู้ปฏิบัติงาน
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์แบบเลือกได้
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  การแทนที่แบ็กเอนด์แบบเลือกได้
</ParamField>

### ค่าเริ่มต้นรันไทม์ต่อเอเจนต์

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้น ACP หนึ่งครั้งต่อเอเจนต์:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (รหัส harness เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ลำดับความสำคัญของการแทนที่สำหรับเซสชัน ACP ที่ผูกไว้:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. ค่าเริ่มต้น ACP ระดับสากล (เช่น `acp.backend`)

### ตัวอย่าง

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### พฤติกรรม

- OpenClaw ตรวจสอบให้แน่ใจว่าเซสชัน ACP ที่กำหนดค่าไว้มีอยู่ก่อนใช้งาน
- ข้อความในช่องหรือหัวข้อนั้นถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่กำหนดค่าไว้
- ในการสนทนาที่ผูกไว้ `/new` และ `/reset` จะรีเซ็ตคีย์เซสชัน ACP เดียวกันในที่เดิม
- การผูกรันไทม์ชั่วคราว (เช่น ที่สร้างโดยโฟลว์การโฟกัสเธรด) ยังคงมีผลในที่ที่มีอยู่
- สำหรับการสร้าง ACP ข้ามเอเจนต์โดยไม่มี `cwd` อย่างชัดเจน OpenClaw จะสืบทอดเวิร์กสเปซเอเจนต์เป้าหมายจากคอนฟิกเอเจนต์
- เส้นทางเวิร์กสเปซที่สืบทอดแล้วหายไปจะย้อนกลับไปใช้ cwd เริ่มต้นของแบ็กเอนด์; ความล้มเหลวในการเข้าถึงที่ไม่ใช่การหายไปจะแสดงเป็นข้อผิดพลาดการสร้าง

## เริ่มเซสชัน ACP

สองวิธีในการเริ่มเซสชัน ACP:

<Tabs>
  <Tab title="จาก sessions_spawn">
    ใช้ `runtime: "acp"` เพื่อเริ่มเซสชัน ACP จากเทิร์นเอเจนต์หรือ
    การเรียกเครื่องมือ

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    ค่าเริ่มต้นของ `runtime` คือ `subagent` ดังนั้นให้ตั้งค่า `runtime: "acp"` อย่างชัดเจน
    สำหรับเซสชัน ACP หากละ `agentId` ไว้ OpenClaw จะใช้
    `acp.defaultAgent` เมื่อมีการกำหนดค่าไว้ `mode: "session"` ต้องใช้
    `thread: true` เพื่อคงการสนทนาที่ผูกไว้แบบถาวร
    </Note>

  </Tab>
  <Tab title="From /acp command">
    ใช้ `/acp spawn` เพื่อให้โอเปอเรเตอร์ควบคุมจากแชตได้อย่างชัดเจน

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    แฟล็กสำคัญ:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    ดู [คำสั่ง Slash](/th/tools/slash-commands)

  </Tab>
</Tabs>

### พารามิเตอร์ของ `sessions_spawn`

<ParamField path="task" type="string" required>
  พรอมป์เริ่มต้นที่ส่งไปยังเซสชัน ACP
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ต้องเป็น `"acp"` สำหรับเซสชัน ACP
</ParamField>
<ParamField path="agentId" type="string">
  ไอดี harness เป้าหมายของ ACP หากตั้งค่าไว้จะย้อนกลับไปใช้ `acp.defaultAgent`
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  ขอขั้นตอนการผูกเธรดเมื่อรองรับ
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` เป็นแบบครั้งเดียว ส่วน `"session"` เป็นแบบถาวร หากละ `mode` ไว้และตั้ง `thread: true`
  OpenClaw อาจใช้พฤติกรรมถาวรเป็นค่าเริ่มต้นตาม
  เส้นทาง runtime `mode: "session"` ต้องใช้ `thread: true`
</ParamField>
<ParamField path="cwd" type="string">
  ไดเรกทอรีทำงานของ runtime ที่ร้องขอ (ตรวจสอบโดยนโยบาย backend/runtime)
  หากละไว้ ACP spawn จะสืบทอด workspace ของเอเจนต์เป้าหมาย
  เมื่อกำหนดค่าไว้; path ที่สืบทอดแต่หายไปจะย้อนกลับไปใช้ค่าเริ่มต้นของ backend
  ขณะที่ข้อผิดพลาดการเข้าถึงจริงจะถูกส่งคืน
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับสำหรับโอเปอเรเตอร์ที่ใช้ในข้อความเซสชัน/แบนเนอร์
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ดำเนินเซสชัน ACP ที่มีอยู่ต่อแทนการสร้างใหม่
  เอเจนต์จะเล่นประวัติการสนทนาซ้ำผ่าน `session/load` ต้องใช้
  `runtime: "acp"`
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` สตรีมสรุปความคืบหน้าการรัน ACP เริ่มต้นกลับไปยัง
  เซสชันผู้ร้องขอในรูปแบบเหตุการณ์ระบบ คำตอบที่ยอมรับได้รวมถึง
  `streamLogPath` ที่ชี้ไปยังบันทึก JSONL ตามขอบเขตเซสชัน
  (`<sessionId>.acp-stream.jsonl`) ซึ่งคุณสามารถ tail เพื่อดูประวัติ relay ทั้งหมดได้
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ยกเลิกรอบของ ACP child หลังจาก N วินาที `0` จะคงรอบไว้บน
  เส้นทางไม่มี timeout ของ gateway ค่าเดียวกันนี้ถูกนำไปใช้กับการรัน Gateway
  และ ACP runtime เพื่อให้ harness ที่ค้างหรือโควตาหมดไม่
  ครอบครองเลนเอเจนต์ parent อย่างไม่มีกำหนด
</ParamField>
<ParamField path="model" type="string">
  การแทนที่โมเดลอย่างชัดเจนสำหรับเซสชัน ACP child การ spawn ของ Codex ACP
  จะ normalize ref ของ OpenClaw Codex เช่น `openai-codex/gpt-5.4` เป็น config
  เริ่มต้นของ Codex ACP ก่อน `session/new`; รูปแบบ slash เช่น
  `openai-codex/gpt-5.4/high` จะตั้งค่า reasoning effort ของ Codex ACP ด้วย
  harness อื่นต้องประกาศ ACP `models` และรองรับ
  `session/set_model`; มิฉะนั้น OpenClaw/acpx จะล้มเหลวอย่างชัดเจนแทนที่จะ
  ย้อนกลับไปใช้ค่าเริ่มต้นของเอเจนต์เป้าหมายแบบเงียบ ๆ
</ParamField>
<ParamField path="thinking" type="string">
  ระดับความพยายามในการคิด/ให้เหตุผลอย่างชัดเจน สำหรับ Codex ACP, `minimal` จะ map เป็น
  ความพยายามระดับต่ำ, `low`/`medium`/`high`/`xhigh` จะ map โดยตรง และ `off`
  จะละการแทนที่ reasoning-effort ตอนเริ่มต้น
</ParamField>

## โหมด bind และ thread ของ spawn

<Tabs>
  <Tab title="--bind here|off">
    | โหมด   | พฤติกรรม                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | ผูกการสนทนาที่ใช้งานอยู่ปัจจุบันไว้ตรงนี้; ล้มเหลวหากไม่มีรายการใดใช้งานอยู่ |
    | `off`  | ไม่สร้างการผูกการสนทนาปัจจุบัน                          |

    หมายเหตุ:

    - `--bind here` เป็นเส้นทางโอเปอเรเตอร์ที่ง่ายที่สุดสำหรับ "ทำให้ช่องหรือแชตนี้มี Codex หนุนหลัง"
    - `--bind here` ไม่สร้างเธรด child
    - `--bind here` ใช้ได้เฉพาะบนช่องที่เปิดเผยการรองรับการผูกการสนทนาปัจจุบัน
    - ไม่สามารถรวม `--bind` และ `--thread` ในคำสั่ง `/acp spawn` เดียวกันได้

  </Tab>
  <Tab title="--thread auto|here|off">
    | โหมด   | พฤติกรรม                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | เมื่ออยู่ในเธรดที่ใช้งานอยู่: ผูกเธรดนั้น เมื่ออยู่นอกเธรด: สร้าง/ผูกเธรด child เมื่อรองรับ |
    | `here` | ต้องมีเธรดที่ใช้งานอยู่ปัจจุบัน; ล้มเหลวหากไม่ได้อยู่ในเธรด                                                  |
    | `off`  | ไม่มีการผูก เซสชันเริ่มต้นแบบไม่ถูกผูก                                                                 |

    หมายเหตุ:

    - บนพื้นผิวการผูกที่ไม่ใช่เธรด พฤติกรรมเริ่มต้นมีผลเทียบเท่า `off`
    - การ spawn ที่ผูกกับเธรดต้องมีการรองรับจากนโยบายช่อง:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - ใช้ `--bind here` เมื่อคุณต้องการปักหมุดการสนทนาปัจจุบันโดยไม่สร้างเธรด child

  </Tab>
</Tabs>

## รูปแบบการส่งมอบ

เซสชัน ACP อาจเป็นได้ทั้ง workspace แบบโต้ตอบหรือ
งานเบื้องหลังที่ parent เป็นเจ้าของ เส้นทางการส่งมอบขึ้นอยู่กับรูปแบบนั้น

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    เซสชันแบบโต้ตอบมีไว้เพื่อคุยต่อบนพื้นผิวแชตที่มองเห็นได้:

    - `/acp spawn ... --bind here` ผูกการสนทนาปัจจุบันกับเซสชัน ACP
    - `/acp spawn ... --thread ...` ผูกเธรด/หัวข้อของช่องกับเซสชัน ACP
    - `bindings[].type="acp"` ที่กำหนดค่าแบบถาวรจะ route การสนทนาที่ตรงกันไปยังเซสชัน ACP เดียวกัน

    ข้อความต่อเนื่องในการสนทนาที่ผูกไว้จะ route โดยตรงไปยัง
    เซสชัน ACP และเอาต์พุต ACP จะถูกส่งกลับไปยัง
    ช่อง/เธรด/หัวข้อเดียวกันนั้น

    สิ่งที่ OpenClaw ส่งไปยัง harness:

    - follow-up ที่ผูกไว้ตามปกติจะถูกส่งเป็นข้อความพรอมป์ พร้อมไฟล์แนบเฉพาะเมื่อ harness/backend รองรับเท่านั้น
    - คำสั่งจัดการ `/acp` และคำสั่ง Gateway ภายในเครื่องจะถูกสกัดไว้ก่อนส่งไปยัง ACP
    - เหตุการณ์ completion ที่ runtime สร้างขึ้นจะถูก materialize ตามเป้าหมาย เอเจนต์ OpenClaw จะได้รับ envelope runtime-context ภายในของ OpenClaw; harness ACP ภายนอกจะได้รับพรอมป์ธรรมดาพร้อมผลลัพธ์ child และคำสั่ง envelope ดิบ `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ไม่ควรถูกส่งไปยัง harness ภายนอกหรือบันทึกถาวรเป็นข้อความ transcript ผู้ใช้ของ ACP
    - รายการ transcript ของ ACP ใช้ข้อความ trigger ที่ผู้ใช้เห็นหรือพรอมป์ completion แบบธรรมดา metadata เหตุการณ์ภายในจะคงอยู่แบบมีโครงสร้างใน OpenClaw เมื่อเป็นไปได้ และไม่ถูกถือว่าเป็นเนื้อหาแชตที่ผู้ใช้เขียน

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    เซสชัน ACP แบบครั้งเดียวที่ถูก spawn โดยการรันของเอเจนต์อื่นเป็น children
    เบื้องหลัง คล้ายกับ sub-agents:

    - parent ขอให้งานทำงานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
    - child ทำงานในเซสชัน harness ACP ของตัวเอง
    - รอบของ child ทำงานบนเลนเบื้องหลังเดียวกับที่ใช้โดยการ spawn sub-agent ดั้งเดิม ดังนั้น ACP harness ที่ช้าจะไม่บล็อกงาน main-session ที่ไม่เกี่ยวข้อง
    - completion จะรายงานกลับผ่านเส้นทางประกาศ task-completion OpenClaw จะแปลง metadata completion ภายในเป็นพรอมป์ ACP ธรรมดาก่อนส่งไปยัง harness ภายนอก ดังนั้น harness จะไม่เห็น marker runtime context ที่ใช้เฉพาะ OpenClaw
    - parent จะเขียนผลลัพธ์ของ child ใหม่ด้วยน้ำเสียง assistant ปกติเมื่อการตอบกลับที่ผู้ใช้เห็นมีประโยชน์

    อย่า treat เส้นทางนี้เป็นแชตแบบ peer-to-peer ระหว่าง parent
    และ child child มีช่องทาง completion กลับไปยัง
    parent อยู่แล้ว

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` สามารถกำหนดเป้าหมายไปยังเซสชันอื่นหลังจาก spawn ได้ สำหรับเซสชัน
    peer ตามปกติ OpenClaw ใช้เส้นทาง follow-up แบบ agent-to-agent (A2A)
    หลังจาก inject ข้อความแล้ว:

    - รอการตอบกลับของเซสชันเป้าหมาย
    - อาจให้ผู้ร้องขอและเป้าหมายแลกเปลี่ยน follow-up ในจำนวนรอบที่จำกัด
    - ขอให้เป้าหมายสร้างข้อความประกาศ
    - ส่งประกาศนั้นไปยังช่องหรือเธรดที่มองเห็นได้

    เส้นทาง A2A นั้นเป็น fallback สำหรับการส่งแบบ peer ที่ผู้ส่งต้องการ
    follow-up ที่มองเห็นได้ เส้นทางนี้ยังคงเปิดใช้งานเมื่อเซสชันที่ไม่เกี่ยวข้องสามารถ
    เห็นและส่งข้อความไปยังเป้าหมาย ACP ได้ เช่น ภายใต้การตั้งค่า
    `tools.sessions.visibility` แบบกว้าง

    OpenClaw จะข้าม follow-up ของ A2A เฉพาะเมื่อผู้ร้องขอเป็น
    parent ของ ACP child แบบครั้งเดียวที่ parent เป็นเจ้าของของตนเอง ในกรณีนั้น
    การรัน A2A ซ้อนบน task completion อาจปลุก parent ด้วย
    ผลลัพธ์ของ child, ส่งต่อคำตอบของ parent กลับเข้าไปใน child และ
    สร้างลูปสะท้อน parent/child ผลลัพธ์ของ `sessions_send` จะรายงาน
    `delivery.status="skipped"` สำหรับกรณี owned-child นั้น เพราะ
    เส้นทาง completion รับผิดชอบผลลัพธ์อยู่แล้ว

  </Accordion>
  <Accordion title="Resume an existing session">
    ใช้ `resumeSessionId` เพื่อดำเนินเซสชัน ACP ก่อนหน้าต่อแทนการ
    เริ่มใหม่ เอเจนต์จะเล่นประวัติการสนทนาซ้ำผ่าน
    `session/load` เพื่อให้ดำเนินต่อด้วยบริบททั้งหมดของสิ่งที่เกิดขึ้นก่อนหน้า

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    กรณีใช้งานทั่วไป:

    - ส่งต่อเซสชัน Codex จากแล็ปท็อปของคุณไปยังโทรศัพท์ของคุณ — บอกเอเจนต์ของคุณให้ทำต่อจากจุดที่คุณค้างไว้
    - ดำเนินเซสชันการเขียนโค้ดที่คุณเริ่มแบบโต้ตอบใน CLI ต่อ โดยตอนนี้ทำแบบ headless ผ่านเอเจนต์ของคุณ
    - ทำงานต่อจากงานที่ถูกขัดจังหวะโดยการรีสตาร์ต gateway หรือ idle timeout

    หมายเหตุ:

    - `resumeSessionId` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; runtime sub-agent เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `streamTo` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; runtime sub-agent เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `resumeSessionId` เป็นไอดี resume ของ ACP/harness ภายในโฮสต์ ไม่ใช่คีย์เซสชันช่องของ OpenClaw; OpenClaw ยังคงตรวจสอบนโยบาย ACP spawn และนโยบายเอเจนต์เป้าหมายก่อน dispatch ขณะที่ backend หรือ harness ของ ACP เป็นเจ้าของ authorization สำหรับการโหลดไอดี upstream นั้น
    - `resumeSessionId` กู้คืนประวัติการสนทนา ACP upstream; `thread` และ `mode` ยังคงใช้ตามปกติกับเซสชัน OpenClaw ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังคงต้องใช้ `thread: true`
    - เอเจนต์เป้าหมายต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
    - หากไม่พบไอดีเซสชัน การ spawn จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน — ไม่มีการ fallback แบบเงียบไปยังเซสชันใหม่

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    หลัง deploy gateway ให้รันการตรวจสอบแบบ end-to-end สดแทนการ
    เชื่อถือ unit tests:

    1. ตรวจสอบเวอร์ชัน gateway และ commit ที่ deploy แล้วบนโฮสต์เป้าหมาย
    2. เปิดเซสชัน bridge ACPX ชั่วคราวไปยังเอเจนต์สด
    3. ขอให้เอเจนต์นั้นเรียก `sessions_spawn` ด้วย `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` และ task `Reply with exactly LIVE-ACP-SPAWN-OK`
    4. ตรวจสอบ `accepted=yes`, `childSessionKey` จริง และไม่มีข้อผิดพลาด validator
    5. ล้างเซสชัน bridge ชั่วคราว

    คง gate ไว้ที่ `mode: "run"` และข้าม `streamTo: "parent"` —
    `mode: "session"` ที่ผูกกับเธรดและเส้นทาง stream-relay เป็นการทดสอบ
    integration ที่ละเอียดกว่าแยกต่างหาก

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้กับ Sandbox

เซสชัน ACP ปัจจุบันทำงานบน host runtime, **ไม่ใช่** ภายใน
sandbox ของ OpenClaw

<Warning>
**ขอบเขตความปลอดภัย:**

- ฮาร์เนสภายนอกสามารถอ่าน/เขียนได้ตามสิทธิ์ CLI ของตัวเองและ `cwd` ที่เลือกไว้
- นโยบาย sandbox ของ OpenClaw จะ **ไม่** ครอบการเรียกใช้งานฮาร์เนส ACP
- OpenClaw ยังคงบังคับใช้ feature gates ของ ACP, เอเจนต์ที่อนุญาต, ความเป็นเจ้าของเซสชัน, การผูกช่องทาง และนโยบายการส่งผ่าน Gateway
- ใช้ `runtime: "subagent"` สำหรับงานแบบ OpenClaw-native ที่บังคับใช้ sandbox

</Warning>

ข้อจำกัดปัจจุบัน:

- หากเซสชันผู้ร้องขออยู่ใน sandbox การ spawn ของ ACP จะถูกบล็อกสำหรับทั้ง `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
- `sessions_spawn` ที่ใช้ `runtime: "acp"` ไม่รองรับ `sandbox: "require"`

## การระบุเป้าหมายเซสชัน

การทำงาน `/acp` ส่วนใหญ่รับเป้าหมายเซสชันแบบไม่บังคับ (`session-key`,
`session-id` หรือ `session-label`)

**ลำดับการระบุ:**

1. อาร์กิวเมนต์เป้าหมายที่ระบุโดยตรง (หรือ `--session` สำหรับ `/acp steer`)
   - ลองใช้คีย์
   - จากนั้นลองใช้รหัสเซสชันที่มีรูปแบบเป็น UUID
   - จากนั้นลองใช้ป้ายกำกับ
2. การผูกกับเธรดปัจจุบัน (หากการสนทนา/เธรดนี้ผูกกับเซสชัน ACP)
3. การใช้เซสชันผู้ร้องขอปัจจุบันเป็นทางเลือกสำรอง

การผูกของการสนทนาปัจจุบันและการผูกของเธรดต่างก็เข้าร่วมใน
ขั้นตอนที่ 2

หากระบุเป้าหมายไม่ได้ OpenClaw จะส่งคืนข้อผิดพลาดที่ชัดเจน
(`Unable to resolve session target: ...`)

## การควบคุม ACP

| คำสั่ง               | สิ่งที่ทำ                                                 | ตัวอย่าง                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้างเซสชัน ACP; ผูกกับปัจจุบันหรือผูกกับเธรดได้ตามต้องการ | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิก turn ที่กำลังดำเนินอยู่สำหรับเซสชันเป้าหมาย        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่ง steer ไปยังเซสชันที่กำลังทำงาน                  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิดเซสชันและยกเลิกการผูกเป้าหมายเธรด                     | `/acp close`                                                  |
| `/acp status`        | แสดงแบ็กเอนด์, โหมด, สถานะ, ตัวเลือกรันไทม์ และความสามารถ | `/acp status`                                                 |
| `/acp set-mode`      | ตั้งค่าโหมดรันไทม์สำหรับเซสชันเป้าหมาย                   | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนตัวเลือกการกำหนดค่ารันไทม์ทั่วไป                    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่าการแทนที่ไดเรกทอรีทำงานของรันไทม์                 | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้งค่าโปรไฟล์นโยบายการอนุมัติ                            | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้งค่า timeout ของรันไทม์ (วินาที)                       | `/acp timeout 120`                                            |
| `/acp model`         | ตั้งค่าการแทนที่โมเดลของรันไทม์                           | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบการแทนที่ตัวเลือกรันไทม์ของเซสชัน                      | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการเซสชัน ACP ล่าสุดจาก store                      | `/acp sessions`                                               |
| `/acp doctor`        | ตรวจสุขภาพแบ็กเอนด์, ความสามารถ และวิธีแก้ไขที่นำไปทำได้ | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอนการติดตั้งและการเปิดใช้งานแบบกำหนดแน่นอน     | `/acp install`                                                |

`/acp status` แสดงตัวเลือกรันไทม์ที่มีผลจริง พร้อมตัวระบุเซสชันระดับรันไทม์และ
ระดับแบ็กเอนด์ ข้อผิดพลาดของการควบคุมที่ไม่รองรับจะแสดงอย่าง
ชัดเจนเมื่อแบ็กเอนด์ไม่มีความสามารถนั้น `/acp sessions` อ่าน
store สำหรับเซสชันที่ผูกอยู่ปัจจุบันหรือเซสชันผู้ร้องขอ; โทเค็นเป้าหมาย
(`session-key`, `session-id` หรือ `session-label`) จะถูกระบุผ่าน
การค้นพบเซสชัน Gateway รวมถึงราก `session.store` แบบกำหนดเองต่อเอเจนต์

### การแมปตัวเลือกรันไทม์

`/acp` มีคำสั่งอำนวยความสะดวกและตัวตั้งค่าทั่วไป การทำงานที่เทียบเท่ากัน:

| คำสั่ง                       | แมปไปยัง                              | หมายเหตุ                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | คีย์การกำหนดค่ารันไทม์ `model`       | สำหรับ Codex ACP, OpenClaw จะทำให้ `openai-codex/<model>` เป็นรหัสโมเดลของอะแดปเตอร์ และแมป suffix การให้เหตุผลแบบ slash เช่น `openai-codex/gpt-5.4/high` ไปยัง `reasoning_effort` |
| `/acp set thinking <level>`  | คีย์การกำหนดค่ารันไทม์ `thinking`    | สำหรับ Codex ACP, OpenClaw จะส่ง `reasoning_effort` ที่สอดคล้องกันเมื่ออะแดปเตอร์รองรับ                                                                                       |
| `/acp permissions <profile>` | คีย์การกำหนดค่ารันไทม์ `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | คีย์การกำหนดค่ารันไทม์ `timeout`     | —                                                                                                                                                                              |
| `/acp cwd <path>`            | การแทนที่ cwd ของรันไทม์             | อัปเดตโดยตรง                                                                                                                                                                  |
| `/acp set <key> <value>`     | ทั่วไป                                | `key=cwd` ใช้เส้นทางการแทนที่ cwd                                                                                                                                             |
| `/acp reset-options`         | ล้างการแทนที่รันไทม์ทั้งหมด          | —                                                                                                                                                                              |

## ฮาร์เนส acpx, การตั้งค่า Plugin และสิทธิ์

สำหรับการกำหนดค่าฮาร์เนส acpx (นามแฝง Claude Code / Codex / Gemini CLI),
บริดจ์ MCP ของ plugin-tools และ OpenClaw-tools และโหมดสิทธิ์ของ ACP
ดู
[เอเจนต์ ACP — การตั้งค่า](/th/tools/acp-agents-setup)

## การแก้ไขปัญหา

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ไข |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | Plugin แบ็กเอนด์หายไป ถูกปิดใช้งาน หรือถูกบล็อกโดย `plugins.allow` | ติดตั้งและเปิดใช้งาน Plugin แบ็กเอนด์ ใส่ `acpx` ใน `plugins.allow` เมื่อตั้งค่ารายการอนุญาตนั้นไว้ จากนั้นรัน `/acp doctor` |
| `ACP is disabled by policy (acp.enabled=false)` | ACP ถูกปิดใช้งานทั่วระบบ | ตั้งค่า `acp.enabled=true` |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | การ dispatch อัตโนมัติจากข้อความเธรดปกติถูกปิดใช้งาน | ตั้งค่า `acp.dispatch.enabled=true` เพื่อกลับมาใช้การกำหนดเส้นทางเธรดอัตโนมัติ; การเรียก `sessions_spawn({ runtime: "acp" })` โดยตรงยังใช้งานได้ |
| `ACP agent "<id>" is not allowed by policy` | เอเจนต์ไม่อยู่ในรายการอนุญาต | ใช้ `agentId` ที่อนุญาต หรืออัปเดต `acp.allowedAgents` |
| `/acp doctor` รายงานว่าแบ็กเอนด์ไม่พร้อมหลังเริ่มต้นทันที | การตรวจสอบ dependency ของ Plugin หรือการซ่อมแซมตัวเองยังทำงานอยู่ | รอสักครู่แล้วรัน `/acp doctor` อีกครั้ง; หากยังไม่สมบูรณ์ ให้ตรวจสอบข้อผิดพลาดการติดตั้งแบ็กเอนด์และนโยบายอนุญาต/ปฏิเสธ Plugin |
| ไม่พบคำสั่งฮาร์เนส | ไม่ได้ติดตั้ง CLI อะแดปเตอร์, dependency ของ Plugin ที่เตรียมไว้หายไป หรือการดึง `npx` ครั้งแรกสำหรับอะแดปเตอร์ที่ไม่ใช่ Codex ล้มเหลว | รัน `/acp doctor`, ซ่อมแซม dependency ของ Plugin, ติดตั้ง/วอร์มอัปอะแดปเตอร์บนโฮสต์ Gateway หรือกำหนดค่าคำสั่งเอเจนต์ acpx โดยตรง |
| ฮาร์เนสแจ้งว่าไม่พบโมเดล | id โมเดลใช้ได้กับผู้ให้บริการ/ฮาร์เนสอื่น แต่ไม่ใช่เป้าหมาย ACP นี้ | ใช้โมเดลที่ฮาร์เนสนั้นแสดงไว้ กำหนดค่าโมเดลในฮาร์เนส หรือไม่ระบุการ override |
| ข้อผิดพลาดการยืนยันตัวตนของผู้ขายจากฮาร์เนส | OpenClaw ทำงานปกติ แต่ CLI/ผู้ให้บริการเป้าหมายยังไม่ได้เข้าสู่ระบบ | เข้าสู่ระบบหรือระบุคีย์ผู้ให้บริการที่ต้องใช้ในสภาพแวดล้อมของโฮสต์ Gateway |
| `Unable to resolve session target: ...` | โทเค็นคีย์/id/ป้ายกำกับไม่ถูกต้อง | รัน `/acp sessions`, คัดลอกคีย์/ป้ายกำกับให้ตรง แล้วลองอีกครั้ง |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มีบทสนทนาที่ใช้งานอยู่และผูกได้ | ย้ายไปยังแชต/ช่องเป้าหมายแล้วลองอีกครั้ง หรือใช้การ spawn แบบไม่ผูก |
| `Conversation bindings are unavailable for <channel>.` | อะแดปเตอร์ไม่มีความสามารถในการผูก ACP กับบทสนทนาปัจจุบัน | ใช้ `/acp spawn ... --thread ...` เมื่อรองรับ กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปยังช่องที่รองรับ |
| `--thread here requires running /acp spawn inside an active ... thread` | ใช้ `--thread here` นอกบริบทเธรด | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off` |
| `Only <user-id> can rebind this channel/conversation/thread.` | ผู้ใช้อื่นเป็นเจ้าของเป้าหมายการผูกที่ใช้งานอยู่ | ผูกใหม่ในฐานะเจ้าของ หรือใช้บทสนทนาหรือเธรดอื่น |
| `Thread bindings are unavailable for <channel>.` | อะแดปเตอร์ไม่มีความสามารถในการผูกเธรด | ใช้ `--thread off` หรือย้ายไปยังอะแดปเตอร์/ช่องที่รองรับ |
| `Sandboxed sessions cannot spawn ACP sessions ...` | runtime ACP อยู่ฝั่งโฮสต์; เซสชันผู้ร้องขออยู่ในแซนด์บ็อกซ์ | ใช้ `runtime="subagent"` จากเซสชันที่อยู่ในแซนด์บ็อกซ์ หรือรัน ACP spawn จากเซสชันที่ไม่ได้อยู่ในแซนด์บ็อกซ์ |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | มีการร้องขอ `sandbox="require"` สำหรับ runtime ACP | ใช้ `runtime="subagent"` เมื่อต้องใช้แซนด์บ็อกซ์ หรือใช้ ACP กับ `sandbox="inherit"` จากเซสชันที่ไม่ได้อยู่ในแซนด์บ็อกซ์ |
| `Cannot apply --model ... did not advertise model support` | ฮาร์เนสเป้าหมายไม่ได้เปิดเผยการสลับโมเดล ACP แบบทั่วไป | ใช้ฮาร์เนสที่ประกาศ ACP `models`/`session/set_model`, ใช้การอ้างอิงโมเดล ACP ของ Codex หรือกำหนดค่าโมเดลโดยตรงในฮาร์เนสหากมีแฟล็กเริ่มต้นของตัวเอง |
| เมตาดาต้า ACP สำหรับเซสชันที่ผูกไว้หายไป | เมตาดาต้าเซสชัน ACP เก่าค้าง/ถูกลบ | สร้างใหม่ด้วย `/acp spawn` แล้วผูกใหม่/โฟกัสเธรด |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` บล็อกการเขียน/exec ในเซสชัน ACP แบบไม่โต้ตอบ | ตั้งค่า `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ต gateway ดู [การกำหนดค่าสิทธิ์](/th/tools/acp-agents-setup#permission-configuration) |
| เซสชัน ACP ล้มเหลวตั้งแต่ต้นโดยมีเอาต์พุตน้อย | พรอมป์สิทธิ์ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions` | ตรวจสอบบันทึก gateway สำหรับ `AcpRuntimeError` หากต้องการสิทธิ์เต็ม ให้ตั้งค่า `permissionMode=approve-all`; หากต้องการลดระดับอย่างนุ่มนวล ให้ตั้งค่า `nonInteractivePermissions=deny` |
| เซสชัน ACP ค้างไม่สิ้นสุดหลังทำงานเสร็จ | กระบวนการฮาร์เนสเสร็จสิ้นแล้ว แต่เซสชัน ACP ไม่ได้รายงานว่าเสร็จสมบูรณ์ | ตรวจสอบด้วย `ps aux \| grep acpx`; kill กระบวนการที่ค้างด้วยตนเอง |
| ฮาร์เนสเห็น `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` | ซองเหตุการณ์ภายในรั่วข้ามขอบเขต ACP | อัปเดต OpenClaw แล้วรันโฟลว์การเสร็จสิ้นอีกครั้ง; ฮาร์เนสภายนอกควรได้รับเฉพาะพรอมป์การเสร็จสิ้นแบบธรรมดาเท่านั้น |

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP — การตั้งค่า](/th/tools/acp-agents-setup)
- [ส่งเอเจนต์](/th/tools/agent-send)
- [แบ็กเอนด์ CLI](/th/gateway/cli-backends)
- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [เครื่องมือแซนด์บ็อกซ์หลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (โหมดบริดจ์)](/th/cli/acp)
- [เอเจนต์ย่อย](/th/tools/subagents)
