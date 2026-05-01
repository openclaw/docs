---
read_when:
    - การเรียกใช้ชุดเครื่องมือเขียนโค้ดผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับการสนทนาบนช่องทางการรับส่งข้อความ
    - การผูกการสนทนาในช่องทางข้อความเข้ากับเซสชัน ACP แบบถาวร
    - การแก้ไขปัญหาแบ็กเอนด์ ACP, การเชื่อมต่อ Plugin, หรือการส่งมอบผลลัพธ์การเติมเต็ม
    - การใช้งานคำสั่ง /acp จากแชต
sidebarTitle: ACP agents
summary: เรียกใช้ระบบรองรับการเขียนโค้ดภายนอก (Claude Code, Cursor, Gemini CLI, Codex ACP แบบระบุชัดเจน, OpenClaw ACP, OpenCode) ผ่านแบ็กเอนด์ ACP
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-05-01T10:22:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb4164208571799f2d78d324f86c9b2fb72c60489ac2c367256f222495c74dbf
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessions
ช่วยให้ OpenClaw เรียกใช้ coding harnesses ภายนอก (เช่น Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI และ
ACPX harnesses อื่น ๆ ที่รองรับ) ผ่าน ACP backend plugin ได้

แต่ละครั้งที่ spawn ACP session จะถูกติดตามเป็น [background task](/th/automation/tasks)

<Note>
**ACP เป็นเส้นทาง external-harness ไม่ใช่เส้นทาง Codex เริ่มต้น** Plugin
native Codex app-server เป็นเจ้าของการควบคุม `/codex ...` และ runtime แบบฝัง
`agentRuntime.id: "codex"`; ACP เป็นเจ้าของการควบคุม
`/acp ...` และ session `sessions_spawn({ runtime: "acp" })`

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็น MCP client ภายนอก
โดยตรงกับการสนทนาในช่อง OpenClaw ที่มีอยู่ ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน ACP
</Note>

## ฉันควรใช้หน้าไหน?

| คุณต้องการ…                                                                                    | ใช้สิ่งนี้                              | หมายเหตุ                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ผูกหรือควบคุม Codex ในการสนทนาปัจจุบัน                                               | `/codex bind`, `/codex threads`       | เส้นทาง native Codex app-server เมื่อเปิดใช้ `codex` plugin; รวมถึงการตอบกลับแชตที่ผูกไว้ การส่งต่อรูปภาพ model/fast/permissions การหยุด และการควบคุมการชี้นำ ACP เป็น fallback แบบระบุชัดเจน |
| เรียกใช้ Claude Code, Gemini CLI, Codex ACP แบบระบุชัดเจน หรือ harness ภายนอกอื่น _ผ่าน_ OpenClaw | หน้านี้                             | Session ที่ผูกกับแชต, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, background tasks, runtime controls                                                                                   |
| เปิดเผย OpenClaw Gateway session _เป็น_ ACP server สำหรับ editor หรือ client                   | [`openclaw acp`](/th/cli/acp)            | โหมด bridge IDE/client สื่อสาร ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                                                                                            |
| ใช้ AI CLI ภายในเครื่องซ้ำเป็น fallback model แบบข้อความเท่านั้น                                              | [CLI Backends](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw ไม่มีการควบคุม ACP ไม่มี harness runtime                                                                                                                               |

## ใช้งานได้ทันทีไหม?

โดยทั่วไปได้ การติดตั้งใหม่มาพร้อมกับ `acpx` runtime plugin ที่ bundled มาและเปิดใช้
เป็นค่าเริ่มต้น พร้อม binary `acpx` ที่ pin อยู่ใน plugin-local ซึ่ง OpenClaw จะ probe
และ self-repair ทันทีหลังจาก Gateway HTTP listener พร้อมใช้งาน เรียกใช้
`/acp doctor` เพื่อตรวจสอบความพร้อม

OpenClaw จะสอน agents เกี่ยวกับการ spawn ACP เฉพาะเมื่อ ACP **ใช้งานได้จริง**
เท่านั้น: ต้องเปิดใช้ ACP, dispatch ต้องไม่ถูกปิด, session ปัจจุบันต้องไม่ถูก sandbox-blocked,
และต้องโหลด runtime backend แล้ว หากไม่ตรงตามเงื่อนไขเหล่านี้ ACP plugin skills และ
คำแนะนำ ACP ของ `sessions_spawn` จะถูกซ่อนไว้เพื่อไม่ให้ agent แนะนำ backend
ที่ไม่พร้อมใช้งาน

<AccordionGroup>
  <Accordion title="ข้อควรระวังในการรันครั้งแรก">
    - หากตั้งค่า `plugins.allow` ไว้ สิ่งนี้คือ plugin inventory แบบจำกัด และ **ต้อง** รวม `acpx`; ไม่เช่นนั้น bundled default จะถูกบล็อกโดยตั้งใจ และ `/acp doctor` จะรายงานรายการ allowlist ที่ขาดหาย
    - bundled Codex ACP adapter จะถูก staged พร้อมกับ `acpx` plugin และเรียกใช้ภายในเครื่องเมื่อทำได้
    - target harness adapters อื่น ๆ อาจยังถูกดึงมาเมื่อจำเป็นด้วย `npx` ในครั้งแรกที่คุณใช้
    - vendor auth ยังต้องมีอยู่บน host สำหรับ harness นั้น
    - หาก host ไม่มี npm หรือ network access การดึง adapter ครั้งแรกจะล้มเหลวจนกว่าจะ pre-warm cache หรือ install adapter ด้วยวิธีอื่น

  </Accordion>
  <Accordion title="ข้อกำหนดเบื้องต้นของ runtime">
    ACP เรียกใช้กระบวนการ external harness จริง OpenClaw เป็นเจ้าของ routing,
    background-task state, delivery, bindings และ policy; ส่วน harness
    เป็นเจ้าของ provider login, model catalog, filesystem behavior และ
    native tools ของตัวเอง

    ก่อนโทษ OpenClaw ให้ตรวจสอบ:

    - `/acp doctor` รายงาน backend ที่เปิดใช้และ healthy
    - target id ได้รับอนุญาตโดย `acp.allowedAgents` เมื่อมีการตั้ง allowlist นั้น
    - คำสั่ง harness เริ่มทำงานบน Gateway host ได้
    - มี provider auth สำหรับ harness นั้น (`claude`, `codex`, `gemini`, `opencode`, `droid` ฯลฯ)
    - model ที่เลือกมีอยู่สำหรับ harness นั้น — model ids ไม่สามารถใช้ข้าม harnesses ได้
    - `cwd` ที่ขอมีอยู่และเข้าถึงได้ หรือไม่ระบุ `cwd` แล้วให้ backend ใช้ค่าเริ่มต้นของตัวเอง
    - permission mode ตรงกับงาน Non-interactive sessions ไม่สามารถคลิก native permission prompts ได้ ดังนั้นการรัน coding ที่มีการเขียน/exec จำนวนมากมักต้องใช้ ACPX permission profile ที่ทำงานต่อแบบ headless ได้

  </Accordion>
</AccordionGroup>

เครื่องมือ OpenClaw plugin และเครื่องมือ OpenClaw ในตัวจะ **ไม่** ถูกเปิดเผยให้
ACP harnesses ตามค่าเริ่มต้น เปิดใช้ MCP bridges แบบระบุชัดเจนใน
[ACP agents — setup](/th/tools/acp-agents-setup) เฉพาะเมื่อ harness
ควรเรียกเครื่องมือเหล่านั้นโดยตรง

## target harness ที่รองรับ

ด้วย bundled `acpx` backend ให้ใช้ harness ids เหล่านี้เป็น target ของ `/acp spawn <id>`
หรือ `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness id | backend ทั่วไป                                | หมายเหตุ                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adapter                        | ต้องมี Claude Code auth บน host                                              |
| `codex`    | Codex ACP adapter                              | เป็น explicit ACP fallback เท่านั้นเมื่อ native `/codex` ไม่พร้อมใช้ หรือมีการขอใช้ ACP |
| `copilot`  | GitHub Copilot ACP adapter                     | ต้องมี Copilot CLI/runtime auth                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | override คำสั่ง acpx หาก local install เปิดเผย ACP entrypoint อื่น    |
| `droid`    | Factory Droid CLI                              | ต้องมี Factory/Droid auth หรือ `FACTORY_API_KEY` ใน environment ของ harness        |
| `gemini`   | Gemini CLI ACP adapter                         | ต้องมี Gemini CLI auth หรือการตั้งค่า API key                                          |
| `iflow`    | iFlow CLI                                      | ความพร้อมของ adapter และการควบคุม model ขึ้นกับ CLI ที่ติดตั้ง                 |
| `kilocode` | Kilo Code CLI                                  | ความพร้อมของ adapter และการควบคุม model ขึ้นกับ CLI ที่ติดตั้ง                 |
| `kimi`     | Kimi/Moonshot CLI                              | ต้องมี Kimi/Moonshot auth บน host                                            |
| `kiro`     | Kiro CLI                                       | ความพร้อมของ adapter และการควบคุม model ขึ้นกับ CLI ที่ติดตั้ง                 |
| `opencode` | OpenCode ACP adapter                           | ต้องมี OpenCode CLI/provider auth                                                |
| `openclaw` | OpenClaw Gateway bridge ผ่าน `openclaw acp` | ช่วยให้ harness ที่รองรับ ACP คุยกลับไปยัง OpenClaw Gateway session ได้                 |
| `pi`       | Pi/embedded OpenClaw runtime                   | ใช้สำหรับการทดลอง harness แบบ OpenClaw-native                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | ต้องมี auth ที่เข้ากันได้กับ Qwen บน host                                          |

สามารถกำหนด custom acpx agent aliases ใน acpx เองได้ แต่ policy ของ OpenClaw
ยังตรวจสอบ `acp.allowedAgents` และ mapping
`agents.list[].runtime.acp.agent` ใด ๆ ก่อน dispatch

## runbook สำหรับ operator

ลำดับ `/acp` แบบเร็วจากแชต:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` หรือระบุชัดเจน
    `/acp spawn codex --bind here`
  </Step>
  <Step title="ทำงาน">
    ดำเนินการต่อในการสนทนาหรือ thread ที่ผูกไว้ (หรือระบุเป้าหมายเป็น session
    key โดยตรง)
  </Step>
  <Step title="ตรวจสอบสถานะ">
    `/acp status`
  </Step>
  <Step title="ปรับแต่ง">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`
  </Step>
  <Step title="ชี้นำ">
    โดยไม่แทนที่ context: `/acp steer tighten logging and continue`
  </Step>
  <Step title="หยุด">
    `/acp cancel` (turn ปัจจุบัน) หรือ `/acp close` (session + bindings)
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="รายละเอียด lifecycle">
    - Spawn จะสร้างหรือ resume ACP runtime session, บันทึก ACP metadata ใน OpenClaw session store และอาจสร้าง background task เมื่อการรันเป็น parent-owned
    - parent-owned ACP sessions จะถูกมองเป็น background work แม้ runtime session จะเป็น persistent; completion และ cross-surface delivery จะผ่าน parent task notifier แทนที่จะทำตัวเหมือน user-facing chat session ปกติ
    - การบำรุงรักษา task จะปิด terminal หรือ orphaned parent-owned one-shot ACP sessions Persistent ACP sessions จะถูกเก็บไว้ขณะที่ยังมี active conversation binding; stale persistent sessions ที่ไม่มี active binding จะถูกปิดเพื่อไม่ให้ถูก resume อย่างเงียบ ๆ หลังจาก owning task เสร็จแล้วหรือ task record ของมันหายไป
    - ข้อความ follow-up ที่ผูกไว้จะส่งตรงไปยัง ACP session จนกว่า binding จะถูกปิด unfocused reset หรือหมดอายุ
    - Gateway commands จะยังอยู่ในเครื่อง `/acp ...`, `/status` และ `/unfocus` จะไม่ถูกส่งเป็น prompt text ปกติไปยัง ACP harness ที่ผูกไว้
    - `cancel` ยกเลิก active turn เมื่อ backend รองรับ cancellation; ไม่ได้ลบ binding หรือ session metadata
    - `close` สิ้นสุด ACP session จากมุมมองของ OpenClaw และลบ binding harness อาจยังเก็บ upstream history ของตัวเองไว้หากรองรับ resume
    - idle runtime workers มีสิทธิ์ถูก cleanup หลังจาก `acp.runtime.ttlMinutes`; stored session metadata จะยังพร้อมใช้งานสำหรับ `/acp sessions`

  </Accordion>
  <Accordion title="กฎ routing ของ native Codex">
    ทริกเกอร์ภาษาธรรมชาติที่ควร route ไปยัง **native Codex
    plugin** เมื่อเปิดใช้:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Native Codex conversation binding คือเส้นทาง chat-control เริ่มต้น
    OpenClaw dynamic tools ยัง execute ผ่าน OpenClaw ขณะที่
    Codex-native tools เช่น shell/apply-patch execute ภายใน Codex
    สำหรับ Codex-native tool events OpenClaw จะ inject native
    hook relay แบบต่อ turn เพื่อให้ plugin hooks สามารถ block `before_tool_call`, observe
    `after_tool_call` และ route Codex `PermissionRequest` events
    ผ่าน OpenClaw approvals ได้ Codex `Stop` hooks จะถูก relay ไปยัง
    OpenClaw `before_agent_finalize` ซึ่ง plugins สามารถขอ model pass เพิ่มอีกหนึ่งครั้ง
    ก่อนที่ Codex จะ finalize คำตอบ relay นี้ยังคงตั้งใจให้ conservative:
    ไม่ mutate arguments ของ Codex-native tool หรือ rewrite Codex thread records
    ใช้ ACP แบบระบุชัดเจนเฉพาะเมื่อคุณต้องการ ACP runtime/session model
    ขอบเขตการรองรับ embedded Codex มีเอกสารอยู่ใน
    [Codex harness v1 support contract](/th/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="ข้อมูลสรุปการเลือกโมเดล / ผู้ให้บริการ / รันไทม์">
    - `openai-codex/*` — เส้นทาง OAuth/การสมัครสมาชิกของ PI Codex
    - `openai/*` plus `agentRuntime.id: "codex"` — รันไทม์แบบฝังในแอปเซิร์ฟเวอร์ Codex แบบเนทีฟ
    - `/codex ...` — การควบคุมการสนทนา Codex แบบเนทีฟ
    - `/acp ...` or `runtime: "acp"` — การควบคุม ACP/acpx แบบชัดเจน

  </Accordion>
  <Accordion title="ทริกเกอร์ภาษาธรรมชาติสำหรับการกำหนดเส้นทาง ACP">
    ทริกเกอร์ที่ควรกำหนดเส้นทางไปยังรันไทม์ ACP:

    - "เรียกใช้งานสิ่งนี้เป็นเซสชัน Claude Code ACP แบบครั้งเดียว แล้วสรุปผลลัพธ์"
    - "ใช้ Gemini CLI สำหรับงานนี้ในเธรด แล้วคงการติดตามผลไว้ในเธรดเดียวกันนั้น"
    - "เรียกใช้ Codex ผ่าน ACP ในเธรดเบื้องหลัง"

    OpenClaw เลือก `runtime: "acp"`, แก้ค่า `agentId` ของฮาร์เนส,
    ผูกกับการสนทนาหรือเธรดปัจจุบันเมื่อรองรับ และ
    กำหนดเส้นทางข้อความติดตามผลไปยังเซสชันนั้นจนกว่าจะปิดหรือหมดอายุ Codex จะ
    ใช้เส้นทางนี้เฉพาะเมื่อระบุ ACP/acpx อย่างชัดเจน หรือเมื่อ Plugin
    Codex แบบเนทีฟไม่พร้อมใช้งานสำหรับการดำเนินการที่ร้องขอ

    สำหรับ `sessions_spawn` จะประกาศ `runtime: "acp"` เฉพาะเมื่อเปิดใช้ ACP,
    ผู้ร้องขอไม่ได้อยู่ในแซนด์บ็อกซ์ และมีการโหลดแบ็กเอนด์รันไทม์
    ACP แล้ว `acp.dispatch.enabled=false` จะหยุดการส่งเธรด ACP
    อัตโนมัติชั่วคราว แต่ไม่ซ่อนหรือบล็อกการเรียก
    `sessions_spawn({ runtime: "acp" })` แบบชัดเจน โดยกำหนดเป้าหมายเป็น id ฮาร์เนส ACP เช่น `codex`,
    `claude`, `droid`, `gemini` หรือ `opencode` อย่าส่ง id เอเจนต์
    คอนฟิก OpenClaw ปกติจาก `agents_list` เว้นแต่รายการนั้นจะ
    ถูกกำหนดค่าอย่างชัดเจนด้วย `agents.list[].runtime.type="acp"`;
    มิฉะนั้นให้ใช้รันไทม์ซับเอเจนต์เริ่มต้น เมื่อกำหนดค่าเอเจนต์ OpenClaw
    ด้วย `runtime.type="acp"`, OpenClaw จะใช้
    `runtime.acp.agent` เป็น id ฮาร์เนสพื้นฐาน

  </Accordion>
</AccordionGroup>

## ACP เทียบกับซับเอเจนต์

ใช้ ACP เมื่อต้องการรันไทม์ฮาร์เนสภายนอก ใช้ **แอปเซิร์ฟเวอร์ Codex
แบบเนทีฟ** สำหรับการผูก/ควบคุมการสนทนา Codex เมื่อเปิดใช้ Plugin `codex`
ใช้ **ซับเอเจนต์** เมื่อต้องการการเรียกใช้งานแบบมอบหมายที่เป็นเนทีฟของ OpenClaw

| พื้นที่          | เซสชัน ACP                           | การเรียกใช้ซับเอเจนต์                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| รันไทม์       | Plugin แบ็กเอนด์ ACP (เช่น acpx) | รันไทม์ซับเอเจนต์เนทีฟของ OpenClaw  |
| คีย์เซสชัน   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| คำสั่งหลัก | `/acp ...`                            | `/subagents ...`                   |
| เครื่องมือเริ่มงาน    | `sessions_spawn` กับ `runtime:"acp"` | `sessions_spawn` (รันไทม์เริ่มต้น) |

ดูเพิ่มเติมที่ [ซับเอเจนต์](/th/tools/subagents)

## วิธีที่ ACP เรียกใช้ Claude Code

สำหรับ Claude Code ผ่าน ACP สแต็กคือ:

1. ระนาบควบคุมเซสชัน ACP ของ OpenClaw
2. Plugin รันไทม์ `acpx` ที่รวมมาให้
3. อะแดปเตอร์ Claude ACP
4. กลไกรันไทม์/เซสชันฝั่ง Claude

ACP Claude คือ **เซสชันฮาร์เนส** ที่มีการควบคุม ACP, การดำเนินเซสชันต่อ,
การติดตามงานเบื้องหลัง และการผูกการสนทนา/เธรดที่เลือกได้

แบ็กเอนด์ CLI เป็นรันไทม์สำรองแบบโลคัลที่เป็นข้อความเท่านั้นแยกต่างหาก — ดู
[แบ็กเอนด์ CLI](/th/gateway/cli-backends)

สำหรับผู้ปฏิบัติงาน กฎที่ใช้จริงคือ:

- **ต้องการ `/acp spawn`, เซสชันที่ผูกได้, การควบคุมรันไทม์ หรืองานฮาร์เนสถาวรใช่ไหม** ใช้ ACP
- **ต้องการการสำรองข้อความโลคัลแบบง่ายผ่าน CLI ดิบใช่ไหม** ใช้แบ็กเอนด์ CLI

## เซสชันที่ผูกไว้

### แบบจำลองทางความคิด

- **พื้นผิวแชต** — ที่ที่ผู้คนสนทนาต่อเนื่อง (ช่อง Discord, หัวข้อ Telegram, แชต iMessage)
- **เซสชัน ACP** — สถานะรันไทม์ Codex/Claude/Gemini ที่คงทนซึ่ง OpenClaw กำหนดเส้นทางไปหา
- **เธรด/หัวข้อย่อย** — พื้นผิวการส่งข้อความเพิ่มเติมที่เลือกได้ ซึ่งสร้างโดย `--thread ...` เท่านั้น
- **เวิร์กสเปซรันไทม์** — ตำแหน่งระบบไฟล์ (`cwd`, repo checkout, backend workspace) ที่ฮาร์เนสทำงาน แยกอิสระจากพื้นผิวแชต

### การผูกการสนทนาปัจจุบัน

`/acp spawn <harness> --bind here` จะปักหมุดการสนทนาปัจจุบันไว้กับ
เซสชัน ACP ที่เริ่มขึ้น — ไม่มีเธรดย่อย ใช้พื้นผิวแชตเดิม OpenClaw ยังคง
เป็นเจ้าของการขนส่ง, การยืนยันตัวตน, ความปลอดภัย และการส่งมอบ ข้อความติดตามผลในการ
สนทนานั้นจะกำหนดเส้นทางไปยังเซสชันเดียวกัน; `/new` และ `/reset` รีเซ็ต
เซสชันในที่เดิม; `/acp close` เอาการผูกออก

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
  <Accordion title="กฎการผูกและความเฉพาะตัว">
    - `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้
    - `--bind here` ใช้ได้เฉพาะกับช่องที่ประกาศการรองรับการผูกการสนทนาปัจจุบัน; OpenClaw จะส่งข้อความที่ชัดเจนว่าไม่รองรับในกรณีอื่น การผูกจะคงอยู่ข้ามการรีสตาร์ต Gateway
    - บน Discord ต้องใช้ `spawnAcpSessions` เฉพาะเมื่อ OpenClaw ต้องสร้างเธรดย่อยสำหรับ `--thread auto|here` — ไม่ใช่สำหรับ `--bind here`
    - หากคุณเริ่มงานไปยังเอเจนต์ ACP อื่นโดยไม่มี `--cwd`, OpenClaw จะสืบทอดเวิร์กสเปซของ **เอเจนต์เป้าหมาย** ตามค่าเริ่มต้น พาธที่สืบทอดมาแล้วหายไป (`ENOENT`/`ENOTDIR`) จะถอยกลับไปใช้ค่าเริ่มต้นของแบ็กเอนด์; ข้อผิดพลาดการเข้าถึงอื่น (เช่น `EACCES`) จะแสดงเป็นข้อผิดพลาดการเริ่มงาน
    - คำสั่งจัดการ Gateway จะยังคงเป็นโลคัลในการสนทนาที่ผูกไว้ — คำสั่ง `/acp ...` ถูกจัดการโดย OpenClaw แม้เมื่อข้อความติดตามผลปกติถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้; `/status` และ `/unfocus` ก็ยังคงเป็นโลคัลเสมอเมื่อเปิดใช้การจัดการคำสั่งสำหรับพื้นผิวนั้น

  </Accordion>
  <Accordion title="เซสชันที่ผูกกับเธรด">
    เมื่อเปิดใช้การผูกเธรดสำหรับอะแดปเตอร์ช่อง:

    - OpenClaw ผูกเธรดเข้ากับเซสชัน ACP เป้าหมาย
    - ข้อความติดตามผลในเธรดนั้นจะกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้
    - เอาต์พุต ACP จะถูกส่งกลับไปยังเธรดเดียวกัน
    - การเลิกโฟกัส/ปิด/เก็บถาวร/หมดเวลาว่าง หรือการหมดอายุจากอายุสูงสุดจะเอาการผูกออก
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` และ `/unfocus` เป็นคำสั่ง Gateway ไม่ใช่พรอมป์ไปยังฮาร์เนส ACP

    แฟล็กฟีเจอร์ที่ต้องใช้สำหรับ ACP ที่ผูกกับเธรด:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` เปิดโดยค่าเริ่มต้น (ตั้งค่าเป็น `false` เพื่อหยุดการส่งเธรด ACP อัตโนมัติชั่วคราว; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงทำงาน)
    - เปิดใช้แฟล็กเริ่มเธรด ACP ของอะแดปเตอร์ช่อง (เฉพาะอะแดปเตอร์):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    การรองรับการผูกเธรดขึ้นอยู่กับอะแดปเตอร์ หากอะแดปเตอร์ช่อง
    ที่ใช้งานอยู่ไม่รองรับการผูกเธรด OpenClaw จะส่งข้อความ
    ไม่รองรับ/ไม่พร้อมใช้งานที่ชัดเจน

  </Accordion>
  <Accordion title="ช่องที่รองรับเธรด">
    - อะแดปเตอร์ช่องใดก็ได้ที่เปิดเผยความสามารถในการผูกเซสชัน/เธรด
    - การรองรับในตัวปัจจุบัน: เธรด/ช่อง **Discord**, หัวข้อ **Telegram** (หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ปและหัวข้อ DM)
    - ช่อง Plugin สามารถเพิ่มการรองรับผ่านอินเทอร์เฟซการผูกเดียวกันได้

  </Accordion>
</AccordionGroup>

## การผูกช่องแบบถาวร

สำหรับเวิร์กโฟลว์ที่ไม่ใช่ชั่วคราว ให้กำหนดค่าการผูก ACP แบบถาวรใน
รายการระดับบนสุด `bindings[]`

### โมเดลการผูก

<ParamField path="bindings[].type" type='"acp"'>
  ทำเครื่องหมายการผูกการสนทนา ACP แบบถาวร
</ParamField>
<ParamField path="bindings[].match" type="object">
  ระบุการสนทนาเป้าหมาย รูปแบบตามช่อง:

- **ช่อง/เธรด Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **หัวข้อฟอรัม Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/กลุ่ม BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` แนะนำให้ใช้ `chat_id:*` หรือ `chat_identifier:*` สำหรับการผูกกลุ่มที่เสถียร
- **DM/กลุ่ม iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` แนะนำให้ใช้ `chat_id:*` สำหรับการผูกกลุ่มที่เสถียร

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  id เอเจนต์ OpenClaw ที่เป็นเจ้าของ
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  การแทนที่ ACP ที่เลือกได้
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  ป้ายกำกับที่ผู้ปฏิบัติงานเห็นได้ ซึ่งเลือกได้
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์ที่เลือกได้
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  การแทนที่แบ็กเอนด์ที่เลือกได้
</ParamField>

### ค่าเริ่มต้นของรันไทม์ต่อเอเจนต์

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้น ACP หนึ่งครั้งต่อเอเจนต์:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id ฮาร์เนส เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ลำดับความสำคัญของการแทนที่สำหรับเซสชัน ACP ที่ผูกไว้:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. ค่าเริ่มต้น ACP ระดับโกลบอล (เช่น `acp.backend`)

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

- OpenClaw ทำให้แน่ใจว่าเซสชัน ACP ที่กำหนดค่าไว้มีอยู่ก่อนใช้งาน
- ข้อความในช่องหรือหัวข้อนั้นจะกำหนดเส้นทางไปยังเซสชัน ACP ที่กำหนดค่าไว้
- ในการสนทนาที่ผูกไว้ `/new` และ `/reset` จะรีเซ็ตคีย์เซสชัน ACP เดิมในที่เดิม
- การผูกรันไทม์ชั่วคราว (เช่น สร้างโดยโฟลว์โฟกัสเธรด) ยังคงมีผลเมื่อมีอยู่
- สำหรับการเริ่ม ACP ข้ามเอเจนต์โดยไม่มี `cwd` ที่ชัดเจน OpenClaw จะสืบทอดเวิร์กสเปซเอเจนต์เป้าหมายจากคอนฟิกเอเจนต์
- พาธเวิร์กสเปซที่สืบทอดมาแล้วหายไปจะถอยกลับไปใช้ cwd เริ่มต้นของแบ็กเอนด์; ความล้มเหลวในการเข้าถึงที่ไม่ใช่พาธหายไปจะแสดงเป็นข้อผิดพลาดการเริ่มงาน

## เริ่มเซสชัน ACP

มีสองวิธีในการเริ่มเซสชัน ACP:

<Tabs>
  <Tab title="จาก sessions_spawn">
    ใช้ `runtime: "acp"` เพื่อเริ่มเซสชัน ACP จากเทิร์นของเอเจนต์หรือ
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
    `runtime` มีค่าเริ่มต้นเป็น `subagent` ดังนั้นให้ตั้งค่า `runtime: "acp"` อย่างชัดเจน
    สำหรับเซสชัน ACP หากละ `agentId` ไว้ OpenClaw จะใช้
    `acp.defaultAgent` เมื่อมีการกำหนดค่าไว้ `mode: "session"` ต้องมี
    `thread: true` เพื่อคงการสนทนาที่ผูกไว้แบบถาวร
    </Note>

  </Tab>
  <Tab title="From /acp command">
    ใช้ `/acp spawn` เพื่อให้ผู้ปฏิบัติงานควบคุมจากแชทได้อย่างชัดเจน

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

### พารามิเตอร์ `sessions_spawn`

<ParamField path="task" type="string" required>
  พรอมป์เริ่มต้นที่ส่งไปยังเซสชัน ACP
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ต้องเป็น `"acp"` สำหรับเซสชัน ACP
</ParamField>
<ParamField path="agentId" type="string">
  รหัส harness เป้าหมายของ ACP หากตั้งค่าไว้ จะย้อนกลับไปใช้ `acp.defaultAgent`
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  ขอขั้นตอนการผูกเธรดในที่ที่รองรับ
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` เป็นแบบครั้งเดียว ส่วน `"session"` เป็นแบบถาวร หากมี `thread: true` และ
  ละ `mode` ไว้ OpenClaw อาจตั้งค่าเริ่มต้นเป็นพฤติกรรมแบบถาวรตาม
  เส้นทาง runtime `mode: "session"` ต้องมี `thread: true`
</ParamField>
<ParamField path="cwd" type="string">
  ไดเรกทอรีทำงานของ runtime ที่ร้องขอ (ตรวจสอบความถูกต้องโดยนโยบาย
  backend/runtime) หากละไว้ การ spawn ของ ACP จะสืบทอด workspace ของเอเจนต์เป้าหมาย
  เมื่อมีการกำหนดค่าไว้ เส้นทางที่สืบทอดซึ่งหายไปจะย้อนกลับไปใช้ค่าเริ่มต้นของ backend
  ส่วนข้อผิดพลาดการเข้าถึงจริงจะถูกส่งคืน
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับที่แสดงต่อผู้ปฏิบัติงาน ใช้ในข้อความเซสชัน/แบนเนอร์
</ParamField>
<ParamField path="resumeSessionId" type="string">
  กลับมาใช้เซสชัน ACP ที่มีอยู่แทนการสร้างเซสชันใหม่
  เอเจนต์จะเล่นประวัติการสนทนาซ้ำผ่าน `session/load` ต้องมี
  `runtime: "acp"`
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` สตรีมสรุปความคืบหน้าการรัน ACP เริ่มต้นกลับไปยัง
  เซสชันผู้ร้องขอเป็นเหตุการณ์ระบบ คำตอบที่ยอมรับมี
  `streamLogPath` ซึ่งชี้ไปยังบันทึก JSONL ที่กำหนดขอบเขตตามเซสชัน
  (`<sessionId>.acp-stream.jsonl`) ที่คุณสามารถ tail เพื่อดูประวัติการถ่ายทอดทั้งหมดได้
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ยกเลิก turn ของ ACP ลูกหลังจาก N วินาที `0` จะคง turn ไว้บน
  เส้นทางไม่มี timeout ของ Gateway ค่าเดียวกันนี้ถูกใช้กับการรัน Gateway
  และ runtime ของ ACP เพื่อให้ harness ที่ค้างหรือโควตาหมดไม่
  ครอบครองเลนของเอเจนต์แม่อย่างไม่มีกำหนด
</ParamField>
<ParamField path="model" type="string">
  การ override โมเดลอย่างชัดเจนสำหรับเซสชัน ACP ลูก การ spawn ของ Codex ACP
  จะ normalize ref ของ OpenClaw Codex เช่น `openai-codex/gpt-5.4` ไปเป็น config
  เริ่มต้นของ Codex ACP ก่อน `session/new`; รูปแบบ slash เช่น
  `openai-codex/gpt-5.4/high` จะตั้งค่า reasoning effort ของ Codex ACP ด้วย
  harness อื่นต้องประกาศ ACP `models` และรองรับ
  `session/set_model`; ไม่เช่นนั้น OpenClaw/acpx จะล้มเหลวอย่างชัดเจนแทนการ
  ย้อนกลับไปใช้ค่าเริ่มต้นของเอเจนต์เป้าหมายแบบเงียบ ๆ
</ParamField>
<ParamField path="thinking" type="string">
  thinking/reasoning effort อย่างชัดเจน สำหรับ Codex ACP, `minimal` จะ map ไปยัง
  effort ต่ำ, `low`/`medium`/`high`/`xhigh` จะ map โดยตรง และ `off`
  จะละการ override reasoning-effort ตอนเริ่มต้น
</ParamField>

## โหมด bind และ thread ของ Spawn

<Tabs>
  <Tab title="--bind here|off">
    | โหมด   | พฤติกรรม                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | ผูกการสนทนาที่ใช้งานอยู่ปัจจุบันไว้ที่เดิม ล้มเหลวหากไม่มีการสนทนาที่ใช้งานอยู่ |
    | `off`  | ไม่สร้างการผูกกับการสนทนาปัจจุบัน                          |

    หมายเหตุ:

    - `--bind here` เป็นเส้นทางผู้ปฏิบัติงานที่ง่ายที่สุดสำหรับ "ทำให้ช่องหรือแชทนี้มี Codex รองรับ"
    - `--bind here` ไม่สร้างเธรดลูก
    - `--bind here` ใช้ได้เฉพาะบนช่องที่เปิดเผยการรองรับการผูกการสนทนาปัจจุบัน
    - ไม่สามารถใช้ `--bind` และ `--thread` ร่วมกันในคำสั่ง `/acp spawn` เดียวกันได้

  </Tab>
  <Tab title="--thread auto|here|off">
    | โหมด   | พฤติกรรม                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | ในเธรดที่ใช้งานอยู่: ผูกเธรดนั้น นอกเธรด: สร้าง/ผูกเธรดลูกเมื่อรองรับ |
    | `here` | ต้องมีเธรดที่ใช้งานอยู่ปัจจุบัน ล้มเหลวหากไม่ได้อยู่ในเธรด                                                  |
    | `off`  | ไม่มีการผูก เซสชันเริ่มต้นแบบไม่ผูก                                                                 |

    หมายเหตุ:

    - บนพื้นผิวที่ไม่รองรับการผูกเธรด พฤติกรรมเริ่มต้นมีผลเทียบเท่า `off`
    - การ spawn ที่ผูกกับเธรดต้องมีการรองรับจากนโยบายช่อง:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - ใช้ `--bind here` เมื่อคุณต้องการตรึงการสนทนาปัจจุบันโดยไม่สร้างเธรดลูก

  </Tab>
</Tabs>

## รูปแบบการส่งมอบ

เซสชัน ACP อาจเป็น workspace แบบโต้ตอบหรือเป็นงานเบื้องหลัง
ที่เอเจนต์แม่เป็นเจ้าของก็ได้ เส้นทางการส่งมอบขึ้นอยู่กับรูปแบบนั้น

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    เซสชันแบบโต้ตอบมีไว้เพื่อสนทนาต่อบนพื้นผิวแชทที่มองเห็นได้:

    - `/acp spawn ... --bind here` ผูกการสนทนาปัจจุบันกับเซสชัน ACP
    - `/acp spawn ... --thread ...` ผูกเธรด/หัวข้อของช่องกับเซสชัน ACP
    - `bindings[].type="acp"` ที่กำหนดค่าแบบถาวรจะ route การสนทนาที่ตรงกันไปยังเซสชัน ACP เดียวกัน

    ข้อความติดตามผลในการสนทนาที่ผูกไว้จะ route โดยตรงไปยัง
    เซสชัน ACP และผลลัพธ์ ACP จะถูกส่งกลับไปยัง
    ช่อง/เธรด/หัวข้อเดียวกันนั้น

    สิ่งที่ OpenClaw ส่งไปยัง harness:

    - การติดตามผลที่ผูกไว้ตามปกติจะถูกส่งเป็นข้อความพรอมป์ พร้อมไฟล์แนบเฉพาะเมื่อ harness/backend รองรับเท่านั้น
    - คำสั่งจัดการ `/acp` และคำสั่ง Gateway ภายในเครื่องจะถูกดักก่อน dispatch ไปยัง ACP
    - เหตุการณ์ completion ที่สร้างโดย runtime จะถูกทำให้เป็นรูปธรรมต่อเป้าหมาย เอเจนต์ OpenClaw จะได้รับ envelope runtime-context ภายในของ OpenClaw; harness ACP ภายนอกจะได้รับพรอมป์แบบ plain พร้อมผลลัพธ์ลูกและคำสั่ง ไม่ควรส่ง envelope ดิบ `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ไปยัง harness ภายนอกหรือเก็บถาวรเป็นข้อความ transcript ผู้ใช้ของ ACP
    - รายการ transcript ของ ACP ใช้ข้อความ trigger ที่ผู้ใช้มองเห็นหรือพรอมป์ completion แบบ plain metadata เหตุการณ์ภายในจะคงอยู่ในรูปแบบ structured ใน OpenClaw เมื่อเป็นไปได้ และไม่ถูกถือว่าเป็นเนื้อหาแชทที่ผู้ใช้เขียน

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    เซสชัน ACP แบบครั้งเดียวที่ spawn โดยการรันของเอเจนต์อีกตัวเป็นลูก
    เบื้องหลัง คล้ายกับ sub-agent:

    - เอเจนต์แม่ของานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
    - ลูกทำงานในเซสชัน ACP harness ของตัวเอง
    - turn ของลูกทำงานบนเลนเบื้องหลังเดียวกับที่ใช้โดยการ spawn ของ sub-agent แบบ native ดังนั้น ACP harness ที่ช้าจะไม่บล็อกงาน main-session ที่ไม่เกี่ยวข้อง
    - รายงาน completion กลับผ่านเส้นทางประกาศ task-completion OpenClaw แปลง metadata completion ภายในเป็นพรอมป์ ACP แบบ plain ก่อนส่งไปยัง harness ภายนอก ดังนั้น harness จะไม่เห็น marker runtime context เฉพาะ OpenClaw
    - เอเจนต์แม่เขียนผลลัพธ์ของลูกใหม่ด้วยเสียงผู้ช่วยตามปกติเมื่อคำตอบที่แสดงต่อผู้ใช้มีประโยชน์

    **อย่า** ปฏิบัติต่อเส้นทางนี้เหมือนแชทแบบ peer-to-peer ระหว่างเอเจนต์แม่
    และลูก ลูกมีช่อง completion กลับไปยัง
    เอเจนต์แม่อยู่แล้ว

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` สามารถกำหนดเป้าหมายไปยังเซสชันอื่นหลังจาก spawn ได้ สำหรับเซสชัน
    peer ปกติ OpenClaw ใช้เส้นทางติดตามผลแบบ agent-to-agent (A2A)
    หลังจากฉีดข้อความ:

    - รอคำตอบจากเซสชันเป้าหมาย
    - เลือกให้ผู้ร้องขอและเป้าหมายแลกเปลี่ยน turn ติดตามผลในจำนวนที่จำกัดได้
    - ขอให้เป้าหมายสร้างข้อความประกาศ
    - ส่งประกาศนั้นไปยังช่องหรือเธรดที่มองเห็นได้

    เส้นทาง A2A นั้นเป็น fallback สำหรับการส่งแบบ peer ที่ผู้ส่งต้องการ
    การติดตามผลที่มองเห็นได้ เส้นทางนี้ยังคงเปิดใช้งานเมื่อเซสชันที่ไม่เกี่ยวข้องสามารถ
    เห็นและส่งข้อความถึงเป้าหมาย ACP ได้ เช่น ภายใต้การตั้งค่า
    `tools.sessions.visibility` แบบกว้าง

    OpenClaw จะข้ามการติดตามผล A2A เฉพาะเมื่อผู้ร้องขอเป็น
    เอเจนต์แม่ของ ACP ลูกแบบครั้งเดียวที่เอเจนต์แม่เป็นเจ้าของเอง ในกรณีนั้น
    การรัน A2A ทับบน task completion อาจปลุกเอเจนต์แม่ด้วย
    ผลลัพธ์ของลูก ส่งต่อคำตอบของเอเจนต์แม่กลับเข้าไปในลูก และ
    สร้างลูปสะท้อนระหว่างเอเจนต์แม่/ลูก ผลลัพธ์ `sessions_send` จะรายงาน
    `delivery.status="skipped"` สำหรับกรณีลูกที่เป็นเจ้าของนั้น เพราะเส้นทาง
    completion รับผิดชอบผลลัพธ์อยู่แล้ว

  </Accordion>
  <Accordion title="Resume an existing session">
    ใช้ `resumeSessionId` เพื่อดำเนินเซสชัน ACP ก่อนหน้าต่อแทน
    การเริ่มใหม่ เอเจนต์จะเล่นประวัติการสนทนาซ้ำผ่าน
    `session/load` จึงดำเนินต่อด้วยบริบทเต็มของสิ่งที่เกิดขึ้นก่อนหน้า

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    กรณีใช้งานทั่วไป:

    - ส่งต่อเซสชัน Codex จากแล็ปท็อปของคุณไปยังโทรศัพท์ของคุณ โดยบอกเอเจนต์ให้ทำต่อจากจุดที่คุณหยุดไว้
    - ดำเนินเซสชันเขียนโค้ดที่คุณเริ่มแบบโต้ตอบใน CLI ต่อ โดยตอนนี้ทำแบบ headless ผ่านเอเจนต์ของคุณ
    - กลับมาทำงานต่อหลังจากถูกขัดจังหวะโดยการ restart ของ gateway หรือ idle timeout

    หมายเหตุ:

    - `resumeSessionId` ใช้เฉพาะเมื่อ `runtime: "acp"`; runtime sub-agent เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `streamTo` ใช้เฉพาะเมื่อ `runtime: "acp"`; runtime sub-agent เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `resumeSessionId` เป็นรหัส resume ของ ACP/harness เฉพาะ host ไม่ใช่คีย์เซสชันช่องของ OpenClaw; OpenClaw ยังตรวจสอบนโยบายการ spawn ของ ACP และนโยบายเอเจนต์เป้าหมายก่อน dispatch ขณะที่ backend หรือ harness ของ ACP เป็นเจ้าของการอนุญาตสำหรับการโหลด id ต้นทางนั้น
    - `resumeSessionId` กู้คืนประวัติการสนทนา ACP ต้นทาง; `thread` และ `mode` ยังคงใช้ตามปกติกับเซสชัน OpenClaw ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังคงต้องมี `thread: true`
    - เอเจนต์เป้าหมายต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
    - หากไม่พบ id เซสชัน การ spawn จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน โดยไม่ fallback แบบเงียบ ๆ ไปยังเซสชันใหม่

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    หลัง deploy gateway ให้รันการตรวจสอบ end-to-end แบบ live แทนการ
    เชื่อถือ unit test เพียงอย่างเดียว:

    1. ตรวจสอบเวอร์ชัน gateway และ commit ที่ deploy แล้วบน host เป้าหมาย
    2. เปิดเซสชัน bridge ACPX ชั่วคราวไปยังเอเจนต์ live
    3. ขอให้เอเจนต์นั้นเรียก `sessions_spawn` ด้วย `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` และ task `Reply with exactly LIVE-ACP-SPAWN-OK`
    4. ตรวจสอบ `accepted=yes`, `childSessionKey` จริง และไม่มีข้อผิดพลาด validator
    5. ล้างเซสชัน bridge ชั่วคราว

    คง gate ไว้ที่ `mode: "run"` และข้าม `streamTo: "parent"` —
    `mode: "session"` ที่ผูกกับเธรดและเส้นทาง stream-relay เป็นการทดสอบ
    integration ที่สมบูรณ์กว่าซึ่งแยกต่างหาก

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้ของ Sandbox

ขณะนี้เซสชัน ACP ทำงานบน runtime ของ host, **ไม่ใช่** ภายใน
sandbox ของ OpenClaw

<Warning>
**ขอบเขตความปลอดภัย:**

- harness ภายนอกสามารถอ่าน/เขียนได้ตามสิทธิ์ CLI ของตัวเองและ `cwd` ที่เลือก
- นโยบายแซนด์บ็อกซ์ของ OpenClaw **ไม่** ครอบการดำเนินงานของ ACP harness
- OpenClaw ยังบังคับใช้ feature gate ของ ACP, agent ที่อนุญาต, ความเป็นเจ้าของเซสชัน, การผูกช่องทาง และนโยบายการส่งผ่าน Gateway
- ใช้ `runtime: "subagent"` สำหรับงาน OpenClaw-native ที่บังคับใช้แซนด์บ็อกซ์

</Warning>

ข้อจำกัดปัจจุบัน:

- หากเซสชันของผู้ร้องขออยู่ในแซนด์บ็อกซ์ การ spawn ACP จะถูกบล็อกทั้งสำหรับ `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
- `sessions_spawn` ที่มี `runtime: "acp"` ไม่รองรับ `sandbox: "require"`

## การระบุเป้าหมายเซสชัน

การกระทำ `/acp` ส่วนใหญ่รับเป้าหมายเซสชันแบบไม่บังคับ (`session-key`,
`session-id` หรือ `session-label`)

**ลำดับการระบุ:**

1. อาร์กิวเมนต์เป้าหมายที่ระบุชัดเจน (หรือ `--session` สำหรับ `/acp steer`)
   - ลองใช้ key
   - จากนั้นใช้ session id ที่มีรูปแบบ UUID
   - จากนั้นใช้ label
2. การผูกกับเธรดปัจจุบัน (หากการสนทนา/เธรดนี้ผูกกับเซสชัน ACP)
3. ใช้เซสชันผู้ร้องขอปัจจุบันเป็น fallback

การผูกการสนทนาปัจจุบันและการผูกเธรดต่างเข้าร่วมใน
ขั้นตอนที่ 2

หากระบุเป้าหมายไม่ได้ OpenClaw จะคืนข้อผิดพลาดที่ชัดเจน
(`Unable to resolve session target: ...`)

## การควบคุม ACP

| คำสั่ง               | สิ่งที่ทำ                                                  | ตัวอย่าง                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้างเซสชัน ACP; ผูกปัจจุบันหรือผูกเธรดได้ตามต้องการ       | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิก turn ที่กำลังทำงานสำหรับเซสชันเป้าหมาย              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่ง steer ไปยังเซสชันที่กำลังทำงาน                   | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิดเซสชันและยกเลิกการผูกเป้าหมายของเธรด                    | `/acp close`                                                  |
| `/acp status`        | แสดง backend, โหมด, สถานะ, ตัวเลือก runtime, ความสามารถ    | `/acp status`                                                 |
| `/acp set-mode`      | ตั้งค่าโหมด runtime สำหรับเซสชันเป้าหมาย                   | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนตัวเลือกการกำหนดค่า runtime ทั่วไป                    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่าการ override ไดเรกทอรีทำงานของ runtime              | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้งค่าโปรไฟล์นโยบายการอนุมัติ                             | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้งค่า timeout ของ runtime (วินาที)                       | `/acp timeout 120`                                            |
| `/acp model`         | ตั้งค่าการ override โมเดล runtime                          | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบการ override ตัวเลือก runtime ของเซสชัน                  | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการเซสชัน ACP ล่าสุดจาก store                       | `/acp sessions`                                               |
| `/acp doctor`        | สุขภาพ backend, ความสามารถ, วิธีแก้ไขที่ทำได้              | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอนติดตั้งและเปิดใช้งานแบบกำหนดแน่นอน             | `/acp install`                                                |

`/acp status` แสดงตัวเลือก runtime ที่มีผล รวมถึงตัวระบุเซสชันระดับ runtime และ
ระดับ backend ข้อผิดพลาดของการควบคุมที่ไม่รองรับจะแสดงอย่างชัดเจน
เมื่อ backend ไม่มีความสามารถนั้น `/acp sessions` อ่าน
store สำหรับเซสชันที่ผูกอยู่ปัจจุบันหรือเซสชันผู้ร้องขอ; token เป้าหมาย
(`session-key`, `session-id` หรือ `session-label`) จะถูกระบุผ่าน
การค้นพบเซสชันของ Gateway รวมถึง root ของ `session.store`
แบบกำหนดเองต่อ agent

### การแมปตัวเลือก Runtime

`/acp` มีคำสั่งอำนวยความสะดวกและ setter ทั่วไป การดำเนินการที่เทียบเท่า:

| คำสั่ง                       | แมปไปยัง                              | หมายเหตุ                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | คีย์ config runtime `model`           | สำหรับ Codex ACP, OpenClaw ทำให้ `openai-codex/<model>` เป็นมาตรฐานเป็น id โมเดลของ adapter และแมป suffix reasoning แบบ slash เช่น `openai-codex/gpt-5.4/high` ไปยัง `reasoning_effort` |
| `/acp set thinking <level>`  | คีย์ config runtime `thinking`        | สำหรับ Codex ACP, OpenClaw จะส่ง `reasoning_effort` ที่สอดคล้องกันเมื่อ adapter รองรับ                                                                                       |
| `/acp permissions <profile>` | คีย์ config runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | คีย์ config runtime `timeout`         | —                                                                                                                                                                              |
| `/acp cwd <path>`            | การ override cwd ของ runtime          | อัปเดตโดยตรง                                                                                                                                                                  |
| `/acp set <key> <value>`     | ทั่วไป                                | `key=cwd` ใช้ path override ของ cwd                                                                                                                                           |
| `/acp reset-options`         | ล้าง override runtime ทั้งหมด         | —                                                                                                                                                                              |

## acpx harness, การตั้งค่า Plugin และสิทธิ์

สำหรับการกำหนดค่า acpx harness (alias ของ Claude Code / Codex / Gemini CLI),
MCP bridge ของ plugin-tools และ OpenClaw-tools, และโหมดสิทธิ์
ACP โปรดดู
[agent ACP — การตั้งค่า](/th/tools/acp-agents-setup)

## การแก้ไขปัญหา

| อาการ                                                                     | สาเหตุที่เป็นไปได้                                                                                                           | วิธีแก้                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend plugin หายไป ถูกปิดใช้งาน หรือถูกบล็อกโดย `plugins.allow`                                                       | ติดตั้งและเปิดใช้งาน backend plugin, ใส่ `acpx` ใน `plugins.allow` เมื่อตั้งค่า allowlist นั้นไว้ แล้วรัน `/acp doctor`                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ถูกปิดใช้งานทั่วทั้งระบบ                                                                                                 | ตั้งค่า `acp.enabled=true`                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | การ dispatch อัตโนมัติจากข้อความใน thread ปกติถูกปิดใช้งาน                                                               | ตั้งค่า `acp.dispatch.enabled=true` เพื่อกลับมาใช้การกำหนดเส้นทาง thread อัตโนมัติ; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงใช้งานได้                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ไม่อยู่ใน allowlist                                                                                                | ใช้ `agentId` ที่ได้รับอนุญาต หรืออัปเดต `acp.allowedAgents`                                                                                                                     |
| `/acp doctor` รายงานว่า backend ยังไม่พร้อมทันทีหลังเริ่มต้นระบบ                 | การ probe dependency ของ Plugin หรือ self-repair ยังทำงานอยู่                                                               | รอสักครู่แล้วรัน `/acp doctor` อีกครั้ง; หากยังคงไม่ปกติ ให้ตรวจสอบข้อผิดพลาดการติดตั้ง backend และนโยบายอนุญาต/ปฏิเสธ Plugin                                             |
| ไม่พบคำสั่ง harness                                                   | Adapter CLI ไม่ได้ติดตั้ง, dependency ของ plugin ที่ staged ไว้หายไป หรือการ fetch `npx` ครั้งแรกสำหรับ adapter ที่ไม่ใช่ Codex ล้มเหลว | รัน `/acp doctor`, ซ่อมแซม dependency ของ Plugin, ติดตั้ง/prewarm adapter บนโฮสต์ Gateway หรือกำหนดค่าคำสั่ง acpx agent อย่างชัดเจน                          |
| model-not-found จาก harness                                            | model id ใช้ได้กับ provider/harness อื่น แต่ใช้ไม่ได้กับเป้าหมาย ACP นี้                                                | ใช้ model ที่ harness นั้นระบุไว้, กำหนดค่า model ใน harness หรือไม่ต้องระบุ override                                                                            |
| ข้อผิดพลาด vendor auth จาก harness                                          | OpenClaw ปกติ แต่ CLI/provider เป้าหมายยังไม่ได้เข้าสู่ระบบ                                                     | เข้าสู่ระบบหรือระบุ provider key ที่จำเป็นใน environment ของโฮสต์ Gateway                                                                                             |
| `Unable to resolve session target: ...`                                     | key/id/label token ไม่ถูกต้อง                                                                                                | รัน `/acp sessions`, คัดลอก key/label ให้ตรง แล้วลองใหม่                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มี conversation ที่ bind ได้ซึ่งกำลังใช้งานอยู่                                                            | ย้ายไปยัง chat/channel เป้าหมายแล้วลองใหม่ หรือใช้ spawn แบบ unbound                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter ไม่มีความสามารถ ACP binding สำหรับ current-conversation                                                             | ใช้ `/acp spawn ... --thread ...` ในที่ที่รองรับ, กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปยัง channel ที่รองรับ                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | ใช้ `--thread here` นอกบริบทของ thread                                                                         | ย้ายไปยัง thread เป้าหมาย หรือใช้ `--thread auto`/`off`                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | ผู้ใช้อื่นเป็นเจ้าของ active binding target                                                                           | Rebind ในฐานะเจ้าของ หรือใช้ conversation หรือ thread อื่น                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adapter ไม่มีความสามารถ thread binding                                                                               | ใช้ `--thread off` หรือย้ายไปยัง adapter/channel ที่รองรับ                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime อยู่ฝั่งโฮสต์; session ผู้ร้องขออยู่ใน sandbox                                                              | ใช้ `runtime="subagent"` จาก sandboxed sessions หรือรัน ACP spawn จาก session ที่ไม่อยู่ใน sandbox                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | มีการร้องขอ `sandbox="require"` สำหรับ ACP runtime                                                                         | ใช้ `runtime="subagent"` สำหรับ sandboxing ที่จำเป็น หรือใช้ ACP ด้วย `sandbox="inherit"` จาก session ที่ไม่อยู่ใน sandbox                                                      |
| `Cannot apply --model ... did not advertise model support`                  | harness เป้าหมายไม่ได้เปิดเผยการสลับ model แบบ ACP ทั่วไป                                                        | ใช้ harness ที่ประกาศ ACP `models`/`session/set_model`, ใช้ Codex ACP model refs หรือกำหนดค่า model โดยตรงใน harness หากมี startup flag ของตัวเอง |
| metadata ของ ACP สำหรับ bound session หายไป                                      | metadata ของ ACP session ค้างเก่าหรือถูกลบ                                                                                    | สร้างใหม่ด้วย `/acp spawn` แล้ว rebind/focus thread                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` บล็อกการเขียน/exec ใน ACP session แบบ non-interactive                                                    | ตั้งค่า `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ท gateway ดู [การกำหนดค่าสิทธิ์](/th/tools/acp-agents-setup#permission-configuration) |
| ACP session ล้มเหลวตั้งแต่ต้นโดยมี output น้อย                                  | permission prompts ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions`                                        | ตรวจสอบ gateway logs สำหรับ `AcpRuntimeError` สำหรับสิทธิ์เต็มรูปแบบ ให้ตั้งค่า `permissionMode=approve-all`; สำหรับ graceful degradation ให้ตั้งค่า `nonInteractivePermissions=deny`        |
| ACP session ค้างไม่สิ้นสุดหลังทำงานเสร็จ                       | กระบวนการ harness เสร็จแล้ว แต่ ACP session ไม่ได้รายงาน completion                                                    | ตรวจสอบด้วย `ps aux \| grep acpx`; kill stale processes ด้วยตนเอง                                                                                                       |
| Harness เห็น `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | internal event envelope รั่วข้ามขอบเขต ACP                                                                | อัปเดต OpenClaw แล้วรัน completion flow อีกครั้ง; external harnesses ควรได้รับเฉพาะ plain completion prompts เท่านั้น                                                          |

## ที่เกี่ยวข้อง

- [ACP agents — การตั้งค่า](/th/tools/acp-agents-setup)
- [Agent send](/th/tools/agent-send)
- [CLI Backends](/th/gateway/cli-backends)
- [Codex harness](/th/plugins/codex-harness)
- [เครื่องมือ sandbox สำหรับ multi-agent](/th/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (โหมด bridge)](/th/cli/acp)
- [Sub-agents](/th/tools/subagents)
