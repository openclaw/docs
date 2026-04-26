---
read_when:
    - การรันชุดเครื่องมือเขียนโค้ดผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับบทสนทนาบนช่องทางการส่งข้อความ
    - การผูกบทสนทนาบนช่องทางข้อความเข้ากับเซสชัน ACP แบบคงอยู่
    - การแก้ไขปัญหาแบ็กเอนด์ ACP การเชื่อมต่อ Plugin หรือการส่งคำตอบให้เสร็จสมบูรณ์
    - การใช้งานคำสั่ง `/acp` จากแชต
sidebarTitle: ACP agents
summary: รันชุดเครื่องมือเขียนโค้ดภายนอก (Claude Code, Cursor, Gemini CLI, explicit Codex ACP, OpenClaw ACP, OpenCode) ผ่านแบ็กเอนด์ ACP
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-04-26T11:42:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

เซสชัน [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
ช่วยให้ OpenClaw สามารถรันชุดเครื่องมือเขียนโค้ดภายนอก (เช่น Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI และ
ชุดเครื่องมือ ACPX อื่น ๆ ที่รองรับ) ผ่าน Plugin แบ็กเอนด์ ACP ได้

การ spawn ของแต่ละเซสชัน ACP จะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

<Note>
**ACP คือเส้นทางสำหรับชุดเครื่องมือภายนอก ไม่ใช่เส้นทาง Codex เริ่มต้น** โดย
Plugin native Codex app-server เป็นเจ้าของคำสั่งควบคุม `/codex ...` และ
รันไทม์แบบฝังตัว `agentRuntime.id: "codex"` ส่วน ACP เป็นเจ้าของ
คำสั่งควบคุม `/acp ...` และเซสชัน `sessions_spawn({ runtime: "acp" })`

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็น external MCP client
โดยตรงกับบทสนทนาช่องทาง OpenClaw ที่มีอยู่ ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน ACP
</Note>

## ฉันต้องการหน้าไหน?

| คุณต้องการ…                                                                                    | ใช้สิ่งนี้                              | หมายเหตุ                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ผูกหรือควบคุม Codex ในบทสนทนาปัจจุบัน                                               | `/codex bind`, `/codex threads`       | เส้นทาง native Codex app-server เมื่อเปิดใช้ Plugin `codex`; รวมการตอบกลับแชตแบบผูก, การส่งต่อภาพ, model/fast/permissions, stop และการควบคุมการชี้นำ ACP เป็นทางสำรองแบบ explicit |
| รัน Claude Code, Gemini CLI, explicit Codex ACP หรือชุดเครื่องมือภายนอกอื่น _ผ่าน_ OpenClaw | หน้านี้                             | เซสชันที่ผูกกับแชต, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, งานเบื้องหลัง, การควบคุมรันไทม์                                                                                   |
| เปิดเผยเซสชัน OpenClaw Gateway _ในฐานะ_ เซิร์ฟเวอร์ ACP สำหรับ editor หรือ client                   | [`openclaw acp`](/th/cli/acp)            | โหมด bridge IDE/client พูด ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                                                                                            |
| ใช้ AI CLI ในเครื่องซ้ำเป็นโมเดลสำรองแบบข้อความล้วน                                              | [CLI Backends](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw ไม่มีการควบคุม ACP และไม่มีรันไทม์ของชุดเครื่องมือ                                                                                                                               |

## ใช้งานได้ทันทีเลยไหม?

โดยทั่วไปใช่ การติดตั้งใหม่จะมาพร้อม Plugin รันไทม์ `acpx` แบบ bundled ที่เปิดใช้
โดยค่าเริ่มต้น พร้อมไบนารี `acpx` ที่ปักหมุดแบบ local ต่อ Plugin ซึ่ง OpenClaw จะตรวจสอบ
และซ่อมแซมตัวเองเมื่อเริ่มต้น รัน `/acp doctor` เพื่อตรวจสอบความพร้อม

OpenClaw จะสอนเอเจนต์เกี่ยวกับการ spawn ACP ก็ต่อเมื่อ ACP **ใช้งานได้จริง**
เท่านั้น: ACP ต้องเปิดใช้งานอยู่, dispatch ต้องไม่ถูกปิดใช้งาน, เซสชันปัจจุบันต้องไม่ถูก
sandbox บล็อก และต้องมีการโหลดแบ็กเอนด์รันไทม์อยู่ หากไม่ตรงตามเงื่อนไขเหล่านี้
Skills ของ Plugin ACP และคำแนะนำ ACP สำหรับ `sessions_spawn`
จะยังคงถูกซ่อน เพื่อไม่ให้เอเจนต์แนะนำแบ็กเอนด์ที่ใช้งานไม่ได้

<AccordionGroup>
  <Accordion title="ข้อควรระวังในการรันครั้งแรก">
    - หากมีการตั้งค่า `plugins.allow` ระบบจะถือว่าเป็นรายการ Plugin แบบจำกัด และ **ต้อง** มี `acpx` อยู่ด้วย; มิฉะนั้นค่าเริ่มต้นแบบ bundled จะถูกบล็อกโดยตั้งใจ และ `/acp doctor` จะรายงานว่าขาดรายการใน allowlist
    - ตัวแปลงชุดเครื่องมือเป้าหมาย (Codex, Claude ฯลฯ) อาจถูกดึงตามต้องการด้วย `npx` ในครั้งแรกที่คุณใช้งาน
    - การยืนยันตัวตนของผู้ให้บริการยังคงต้องมีอยู่บนโฮสต์สำหรับชุดเครื่องมือนั้น
    - หากโฮสต์ไม่มี npm หรือไม่มีการเข้าถึงเครือข่าย การดึงตัวแปลงในครั้งแรกจะล้มเหลวจนกว่าจะวอร์มแคชล่วงหน้า หรือติดตั้งตัวแปลงด้วยวิธีอื่น
  </Accordion>
  <Accordion title="ข้อกำหนดเบื้องต้นของรันไทม์">
    ACP จะเปิดกระบวนการของชุดเครื่องมือภายนอกจริง OpenClaw เป็นเจ้าของการกำหนดเส้นทาง,
    สถานะงานเบื้องหลัง, การส่งมอบ, การผูก และนโยบาย; ส่วนชุดเครื่องมือเป็นเจ้าของ
    การล็อกอินผู้ให้บริการ, แค็ตตาล็อกโมเดล, พฤติกรรมของ filesystem และ
    เครื่องมือ native ของมันเอง

    ก่อนจะโทษ OpenClaw ให้ตรวจสอบว่า:

    - `/acp doctor` รายงานว่าแบ็กเอนด์เปิดใช้งานและสุขภาพดี
    - target id ได้รับอนุญาตโดย `acp.allowedAgents` เมื่อมีการตั้งค่า allowlist นั้น
    - คำสั่งของชุดเครื่องมือสามารถเริ่มทำงานบนโฮสต์ Gateway ได้
    - มี provider auth สำหรับชุดเครื่องมือนั้น (`claude`, `codex`, `gemini`, `opencode`, `droid` ฯลฯ)
    - มีโมเดลที่เลือกอยู่สำหรับชุดเครื่องมือนั้น — model ids ไม่สามารถใช้ข้ามชุดเครื่องมือกันได้
    - `cwd` ที่ร้องขอมีอยู่จริงและเข้าถึงได้ หรือไม่ต้องระบุ `cwd` แล้วปล่อยให้แบ็กเอนด์ใช้ค่าเริ่มต้นของมัน
    - โหมดสิทธิ์ตรงกับลักษณะงาน เซสชันแบบไม่โต้ตอบไม่สามารถคลิก native permission prompts ได้ ดังนั้นงานเขียนโค้ดที่เน้นการเขียน/รันคำสั่งจำนวนมากมักต้องใช้โปรไฟล์สิทธิ์ ACPX ที่ดำเนินต่อแบบ headless ได้

  </Accordion>
</AccordionGroup>

เครื่องมือของ OpenClaw Plugin และเครื่องมือ OpenClaw ในตัวจะ **ไม่** ถูกเปิดเผยให้
ชุดเครื่องมือ ACP โดยค่าเริ่มต้น ให้เปิด MCP bridges แบบ explicit ใน
[เอเจนต์ ACP — การตั้งค่า](/th/tools/acp-agents-setup) เฉพาะเมื่อชุดเครื่องมือ
ควรเรียกใช้เครื่องมือเหล่านั้นโดยตรง

## เป้าหมายชุดเครื่องมือที่รองรับ

เมื่อใช้แบ็กเอนด์ `acpx` แบบ bundled ให้ใช้ harness ids เหล่านี้กับ `/acp spawn <id>`
หรือเป็นเป้าหมาย `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness id | แบ็กเอนด์ทั่วไป                                | หมายเหตุ                                                                               |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adapter                        | ต้องมีการยืนยันตัวตน Claude Code บนโฮสต์                                              |
| `codex`    | Codex ACP adapter                              | เป็น explicit ACP fallback เท่านั้นเมื่อ native `/codex` ใช้งานไม่ได้หรือมีการร้องขอ ACP |
| `copilot`  | GitHub Copilot ACP adapter                     | ต้องมีการยืนยันตัวตน Copilot CLI/runtime                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | override คำสั่ง acpx หากการติดตั้งในเครื่องเปิดเผย ACP entrypoint ที่ต่างออกไป    |
| `droid`    | Factory Droid CLI                              | ต้องมีการยืนยันตัวตน Factory/Droid หรือ `FACTORY_API_KEY` ในสภาพแวดล้อมของชุดเครื่องมือ        |
| `gemini`   | Gemini CLI ACP adapter                         | ต้องมีการยืนยันตัวตน Gemini CLI หรือการตั้งค่า API key                                          |
| `iflow`    | iFlow CLI                                      | การมีอยู่ของ adapter และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `kilocode` | Kilo Code CLI                                  | การมีอยู่ของ adapter และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `kimi`     | Kimi/Moonshot CLI                              | ต้องมีการยืนยันตัวตน Kimi/Moonshot บนโฮสต์                                            |
| `kiro`     | Kiro CLI                                       | การมีอยู่ของ adapter และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `opencode` | OpenCode ACP adapter                           | ต้องมี OpenCode CLI/provider auth                                                |
| `openclaw` | OpenClaw Gateway bridge ผ่าน `openclaw acp` | ทำให้ชุดเครื่องมือที่รองรับ ACP สามารถคุยกลับไปยังเซสชัน OpenClaw Gateway ได้                 |
| `pi`       | Pi/รันไทม์ OpenClaw แบบฝังตัว                   | ใช้สำหรับการทดลองชุดเครื่องมือแบบ native ของ OpenClaw                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | ต้องมีการยืนยันตัวตนที่เข้ากันได้กับ Qwen บนโฮสต์                                          |

alias ของ acpx agent แบบกำหนดเองสามารถตั้งค่าได้ใน acpx เอง แต่ OpenClaw
ยังคงตรวจสอบนโยบายผ่าน `acp.allowedAgents` และ
mapping ของ `agents.list[].runtime.acp.agent` ก่อน dispatch

## คู่มือปฏิบัติการสำหรับผู้ดูแล

โฟลว์ `/acp` แบบรวดเร็วจากแชต:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` หรือ
    `/acp spawn codex --bind here` แบบ explicit
  </Step>
  <Step title="ทำงาน">
    ทำงานต่อในบทสนทนาหรือ thread ที่ผูกไว้ (หรือระบุ
    session key โดยตรง)
  </Step>
  <Step title="ตรวจสอบสถานะ">
    `/acp status`
  </Step>
  <Step title="ปรับแต่ง">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="ชี้นำ">
    โดยไม่แทนที่บริบท: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="หยุด">
    `/acp cancel` (เทิร์นปัจจุบัน) หรือ `/acp close` (เซสชัน + การผูก)
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="รายละเอียดวงจรชีวิต">
    - การ spawn จะสร้างหรือเรียกใช้ต่อเซสชันรันไทม์ ACP, บันทึก metadata ของ ACP ใน OpenClaw session store และอาจสร้างงานเบื้องหลังเมื่อการรันนั้นเป็นของ parent
    - ข้อความติดตามผลที่ผูกไว้จะถูกส่งตรงไปยังเซสชัน ACP จนกว่าการผูกจะถูกปิด, unfocus, reset หรือหมดอายุ
    - คำสั่ง Gateway จะอยู่ภายในเครื่อง `/acp ...`, `/status` และ `/unfocus` จะไม่ถูกส่งเป็นข้อความ prompt ปกติไปยังชุดเครื่องมือ ACP ที่ถูกผูกไว้
    - `cancel` จะยกเลิกเทิร์นที่กำลังทำงานอยู่เมื่อแบ็กเอนด์รองรับการยกเลิก; มันจะไม่ลบการผูกหรือ metadata ของเซสชัน
    - `close` จะสิ้นสุดเซสชัน ACP จากมุมมองของ OpenClaw และลบการผูก ชุดเครื่องมืออาจยังเก็บประวัติ upstream ของตัวเองไว้หากรองรับ resume
    - worker ของรันไทม์ที่ idle มีสิทธิ์ถูกล้างหลัง `acp.runtime.ttlMinutes`; metadata ของเซสชันที่เก็บไว้ยังคงใช้ได้กับ `/acp sessions`
  </Accordion>
  <Accordion title="กฎการกำหนดเส้นทาง Native Codex">
    ทริกเกอร์ภาษาธรรมชาติที่ควรถูกกำหนดเส้นทางไปยัง **Plugin native Codex**
    เมื่อมีการเปิดใช้งาน:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    การผูกบทสนทนา native Codex คือเส้นทางควบคุมแชตเริ่มต้น
    เครื่องมือไดนามิกของ OpenClaw ยังคงทำงานผ่าน OpenClaw ขณะที่
    เครื่องมือ native ของ Codex เช่น shell/apply-patch จะทำงานภายใน Codex
    สำหรับเหตุการณ์เครื่องมือ native ของ Codex นั้น OpenClaw จะฉีด
    native hook relay แบบต่อเทิร์น เพื่อให้ plugin hooks สามารถบล็อก `before_tool_call`, สังเกต
    `after_tool_call` และกำหนดเส้นทางเหตุการณ์ Codex `PermissionRequest`
    ผ่านระบบอนุมัติของ OpenClaw ได้ hook `Stop` ของ Codex จะถูกส่งต่อไปยัง
    OpenClaw `before_agent_finalize` ซึ่ง Plugins สามารถร้องขอให้มีการผ่านโมเดล
    เพิ่มอีกหนึ่งรอบก่อนที่ Codex จะสรุปคำตอบ relay นี้ยังคงตั้งใจให้อนุรักษ์นิยม:
    มันจะไม่แก้ไข arguments ของเครื่องมือ native ของ Codex หรือเขียนทับ Codex thread records
    ใช้ ACP แบบ explicit เฉพาะเมื่อคุณต้องการโมเดลรันไทม์/เซสชันของ ACP เท่านั้น
    ขอบเขตการรองรับ Codex แบบฝังตัวมีเอกสารอยู่ใน
    [สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

  </Accordion>
  <Accordion title="ชีตสรุปการเลือกโมเดล / ผู้ให้บริการ / รันไทม์">
    - `openai-codex/*` — เส้นทาง PI Codex OAuth/subscription
    - `openai/*` พร้อม `agentRuntime.id: "codex"` — รันไทม์แบบฝังตัวของ native Codex app-server
    - `/codex ...` — การควบคุมบทสนทนา native Codex
    - `/acp ...` หรือ `runtime: "acp"` — การควบคุม ACP/acpx แบบ explicit
  </Accordion>
  <Accordion title="ทริกเกอร์ภาษาธรรมชาติสำหรับการกำหนดเส้นทาง ACP">
    ทริกเกอร์ที่ควรถูกกำหนดเส้นทางไปยังรันไทม์ ACP:

    - "Run this as a one-shot Claude Code ACP session and summarize the result."
    - "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
    - "Run Codex through ACP in a background thread."

    OpenClaw จะเลือก `runtime: "acp"` แก้ค่า `agentId` ของชุดเครื่องมือ
ผูกกับบทสนทนาหรือ thread ปัจจุบันเมื่อรองรับ และ
กำหนดเส้นทางข้อความติดตามผลไปยังเซสชันนั้นจนกว่าจะปิด/หมดอายุ Codex จะ
ใช้เส้นทางนี้ก็ต่อเมื่อมีการระบุ ACP/acpx อย่าง explicit หรือ
Plugin native Codex ไม่พร้อมใช้งานสำหรับการดำเนินการที่ร้องขอ

สำหรับ `sessions_spawn` จะมีการประกาศ `runtime: "acp"` เฉพาะเมื่อ ACP
เปิดใช้งานอยู่, ผู้ร้องขอไม่ได้อยู่ใน sandbox และมีการโหลดแบ็กเอนด์รันไทม์ ACP
แล้ว โดยจะกำหนดเป้าหมายไปยัง ACP harness ids เช่น `codex`,
`claude`, `droid`, `gemini` หรือ `opencode` อย่าส่ง OpenClaw config agent id
ปกติจาก `agents_list` เว้นแต่รายการนั้นจะถูกกำหนดไว้อย่าง explicit ด้วย
`agents.list[].runtime.type="acp"`; มิฉะนั้นให้ใช้รันไทม์ sub-agent เริ่มต้น เมื่อ OpenClaw agent
ถูกกำหนดค่าด้วย `runtime.type="acp"` OpenClaw จะใช้
`runtime.acp.agent` เป็น harness id พื้นฐาน

  </Accordion>
</AccordionGroup>

## ACP เทียบกับ sub-agents

ใช้ ACP เมื่อคุณต้องการรันไทม์ของชุดเครื่องมือภายนอก ใช้ **native Codex
app-server** สำหรับการผูก/ควบคุมบทสนทนา Codex เมื่อเปิดใช้ Plugin `codex`
และใช้ **sub-agents** เมื่อคุณต้องการ
การรันแบบมอบหมายงานที่เป็น native ของ OpenClaw

| พื้นที่          | เซสชัน ACP                           | การรัน sub-agent                      |
| ---------------- | ------------------------------------- | ------------------------------------- |
| รันไทม์          | Plugin แบ็กเอนด์ ACP (เช่น acpx)      | รันไทม์ sub-agent แบบ native ของ OpenClaw  |
| Session key      | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`     |
| คำสั่งหลัก       | `/acp ...`                            | `/subagents ...`                      |
| เครื่องมือ spawn | `sessions_spawn` พร้อม `runtime:"acp"` | `sessions_spawn` (รันไทม์เริ่มต้น) |

ดูเพิ่มเติมที่ [Sub-agents](/th/tools/subagents)

## วิธีที่ ACP รัน Claude Code

สำหรับ Claude Code ผ่าน ACP สแตกมีดังนี้:

1. OpenClaw ACP session control plane
2. Plugin รันไทม์ `acpx` แบบ bundled
3. Claude ACP adapter
4. กลไกรันไทม์/เซสชันฝั่ง Claude

ACP Claude เป็น **เซสชันของชุดเครื่องมือ** ที่มีการควบคุม ACP, การ resume เซสชัน,
การติดตามงานเบื้องหลัง และการผูกบทสนทนา/เธรดแบบเลือกได้

CLI backends เป็นรันไทม์สำรองในเครื่องแบบข้อความล้วนที่แยกออกจากกัน — ดู
[CLI Backends](/th/gateway/cli-backends)

สำหรับผู้ปฏิบัติงาน กฎเชิงปฏิบัติคือ:

- **ต้องการ `/acp spawn`, เซสชันที่ผูกได้, การควบคุมรันไทม์ หรืองานของชุดเครื่องมือแบบคงอยู่ใช่ไหม?** ใช้ ACP
- **ต้องการทางสำรองข้อความล้วนในเครื่องผ่าน CLI ดิบอย่างง่ายใช่ไหม?** ใช้ CLI backends

## เซสชันที่ผูกไว้

### โมเดลความเข้าใจ

- **พื้นผิวแชต** — ที่ที่ผู้คนพูดคุยต่อกัน (ช่อง Discord, หัวข้อ Telegram, แชต iMessage)
- **เซสชัน ACP** — สถานะรันไทม์ Codex/Claude/Gemini แบบคงทนที่ OpenClaw กำหนดเส้นทางไปหา
- **เธรด/หัวข้อย่อย** — พื้นผิวข้อความเพิ่มเติมแบบเลือกได้ ซึ่งสร้างขึ้นเมื่อใช้ `--thread ...` เท่านั้น
- **workspace ของรันไทม์** — ตำแหน่ง filesystem (`cwd`, repo checkout, backend workspace) ที่ชุดเครื่องมือทำงานอยู่ ซึ่งแยกจากพื้นผิวแชต

### การผูกกับบทสนทนาปัจจุบัน

`/acp spawn <harness> --bind here` จะปักหมุดบทสนทนาปัจจุบันเข้ากับ
เซสชัน ACP ที่ถูก spawn — ไม่มี child thread ใช้พื้นผิวแชตเดิม OpenClaw จะยังคง
เป็นเจ้าของ transport, auth, safety และการส่งมอบ ข้อความติดตามผลใน
บทสนทนานั้นจะถูกกำหนดเส้นทางไปยังเซสชันเดิม; `/new` และ `/reset` จะรีเซ็ต
เซสชันเดิมในตำแหน่งเดิม; `/acp close` จะลบการผูก

ตัวอย่าง:

```text
/codex bind                                              # native Codex bind, กำหนดเส้นทางข้อความในอนาคตมาที่นี่
/codex model gpt-5.4                                     # ปรับแต่งเธรด native Codex ที่ผูกไว้
/codex stop                                              # ควบคุมเทิร์น native Codex ที่กำลังทำงาน
/acp spawn codex --bind here                             # explicit ACP fallback สำหรับ Codex
/acp spawn codex --thread auto                           # อาจสร้าง child thread/topic และผูกไว้ที่นั่น
/acp spawn codex --bind here --cwd /workspace/repo       # ผูกกับแชตเดิม แต่ Codex ทำงานใน /workspace/repo
```

<AccordionGroup>
  <Accordion title="กฎการผูกและความเป็นเอกสิทธิ์">
    - `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้
    - `--bind here` ใช้งานได้เฉพาะบนช่องทางที่ประกาศว่ารองรับการผูกกับบทสนทนาปัจจุบัน; มิฉะนั้น OpenClaw จะส่งข้อความแจ้งชัดเจนว่าไม่รองรับ การผูกจะคงอยู่ข้ามการรีสตาร์ต Gateway
    - บน Discord ต้องใช้ `spawnAcpSessions` เฉพาะเมื่อ OpenClaw จำเป็นต้องสร้าง child thread สำหรับ `--thread auto|here` — ไม่จำเป็นสำหรับ `--bind here`
    - หากคุณ spawn ไปยัง ACP agent อื่นโดยไม่ระบุ `--cwd` OpenClaw จะสืบทอด workspace **ของ target agent** โดยค่าเริ่มต้น หากเส้นทางที่สืบทอดมาไม่มีอยู่ (`ENOENT`/`ENOTDIR`) ระบบจะ fallback ไปยังค่าเริ่มต้นของแบ็กเอนด์; แต่ข้อผิดพลาดการเข้าถึงประเภทอื่น (เช่น `EACCES`) จะถูกแสดงเป็น spawn errors
    - คำสั่งจัดการ Gateway จะคงอยู่ภายในเครื่องในบทสนทนาที่ผูกไว้ — คำสั่ง `/acp ...` จะถูกจัดการโดย OpenClaw แม้ว่าข้อความติดตามผลปกติจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้; `/status` และ `/unfocus` ก็จะคงอยู่ภายในเครื่องเช่นกันเมื่อเปิดใช้การจัดการคำสั่งสำหรับพื้นผิวนั้น
  </Accordion>
  <Accordion title="เซสชันที่ผูกกับเธรด">
    เมื่อเปิดใช้การผูกเธรดสำหรับ channel adapter:

    - OpenClaw จะผูกเธรดเข้ากับเซสชัน ACP เป้าหมาย
    - ข้อความติดตามผลในเธรดนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้
    - เอาต์พุต ACP จะถูกส่งกลับมายังเธรดเดิม
    - การ unfocus/close/archive/idle-timeout หรือการหมดอายุ max-age จะลบการผูก
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` และ `/unfocus` เป็นคำสั่ง Gateway ไม่ใช่ prompt ที่ส่งไปยังชุดเครื่องมือ ACP

    feature flags ที่จำเป็นสำหรับ ACP แบบผูกกับเธรด:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` เปิดอยู่โดยค่าเริ่มต้น (ตั้งเป็น `false` เพื่อพักการ dispatch ACP)
    - เปิดใช้แฟลก ACP thread-spawn ของ channel-adapter (เฉพาะ adapter):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    การรองรับการผูกเธรดขึ้นอยู่กับ adapter หาก channel
    adapter ที่ใช้งานอยู่ไม่รองรับการผูกเธรด OpenClaw จะส่งข้อความ
    ชัดเจนว่าไม่รองรับ/ไม่พร้อมใช้งาน

  </Accordion>
  <Accordion title="ช่องทางที่รองรับเธรด">
    - channel adapter ใด ๆ ที่เปิดเผยความสามารถในการผูก session/thread
    - การรองรับในตัวปัจจุบัน: เธรด/ช่อง **Discord**, หัวข้อ **Telegram** (forum topics ในกลุ่ม/ซูเปอร์กรุ๊ป และหัวข้อ DM)
    - ช่องทาง Plugin สามารถเพิ่มการรองรับได้ผ่านอินเทอร์เฟซการผูกแบบเดียวกัน
  </Accordion>
</AccordionGroup>

## การผูกช่องทางแบบคงอยู่

สำหรับเวิร์กโฟลว์ที่ไม่ชั่วคราว ให้กำหนดค่าการผูก ACP แบบคงอยู่ใน
รายการ `bindings[]` ระดับบนสุด

### โมเดลการผูก

<ParamField path="bindings[].type" type='"acp"'>
  ระบุว่าเป็นการผูกบทสนทนา ACP แบบคงอยู่
</ParamField>
<ParamField path="bindings[].match" type="object">
  ระบุบทสนทนาเป้าหมาย รูปแบบของแต่ละช่องทางมีดังนี้:

- **ช่อง/เธรด Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **หัวข้อฟอรัม Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/กลุ่ม BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` ควรใช้ `chat_id:*` หรือ `chat_identifier:*` สำหรับการผูกกลุ่มที่เสถียร
- **DM/กลุ่ม iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` ควรใช้ `chat_id:*` สำหรับการผูกกลุ่มที่เสถียร
  </ParamField>
  <ParamField path="bindings[].agentId" type="string">
  agent id ของ OpenClaw ที่เป็นเจ้าของ
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  การ override ACP แบบเลือกได้
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  ป้ายกำกับสำหรับผู้ปฏิบัติงานแบบเลือกได้
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์แบบเลือกได้
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  การ override แบ็กเอนด์แบบเลือกได้
  </ParamField>

### ค่าเริ่มต้นของรันไทม์ต่อ agent

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้นของ ACP หนึ่งครั้งต่อ agent:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ลำดับความสำคัญของการ override สำหรับเซสชัน ACP ที่ผูกไว้:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. ค่าเริ่มต้น ACP แบบ global (เช่น `acp.backend`)

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

- OpenClaw จะตรวจสอบให้แน่ใจว่าเซสชัน ACP ที่กำหนดค่าไว้มีอยู่ก่อนใช้งาน
- ข้อความในช่องหรือหัวข้อนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่กำหนดไว้
- ในบทสนทนาที่ผูกไว้ `/new` และ `/reset` จะรีเซ็ต session key ของ ACP เดิมในตำแหน่งเดิม
- การผูกรันไทม์ชั่วคราว (เช่น ที่สร้างโดยโฟลว์ thread-focus) จะยังคงมีผลเมื่อมีอยู่
- สำหรับ ACP spawn ข้าม agent ที่ไม่มี `cwd` แบบ explicit นั้น OpenClaw จะสืบทอด workspace ของ target agent จากการตั้งค่า agent
- หากเส้นทาง workspace ที่สืบทอดมาไม่มีอยู่ ระบบจะ fallback ไปยัง cwd ค่าเริ่มต้นของแบ็กเอนด์; แต่หากเป็นความล้มเหลวในการเข้าถึงที่ไม่ได้เกิดจากการหายไปของเส้นทาง จะถูกแสดงเป็น spawn errors

## เริ่มเซสชัน ACP

มี 2 วิธีในการเริ่มเซสชัน ACP:

<Tabs>
  <Tab title="จาก sessions_spawn">
    ใช้ `runtime: "acp"` เพื่อเริ่มเซสชัน ACP จาก agent turn หรือ
    tool call

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
    ค่าเริ่มต้นของ `runtime` คือ `subagent` ดังนั้นให้ตั้ง `runtime: "acp"` อย่าง explicit
    สำหรับเซสชัน ACP หากละ `agentId` ไว้ OpenClaw จะใช้
    `acp.defaultAgent` เมื่อมีการกำหนดค่าไว้ `mode: "session"` ต้องใช้ร่วมกับ
    `thread: true` เพื่อคงบทสนทนาที่ผูกไว้อย่างต่อเนื่อง
    </Note>

  </Tab>
  <Tab title="จากคำสั่ง /acp">
    ใช้ `/acp spawn` เพื่อควบคุมแบบ explicit จากแชต

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    แฟลกสำคัญ:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    ดู [Slash commands](/th/tools/slash-commands)

  </Tab>
</Tabs>

### พารามิเตอร์ `sessions_spawn`

<ParamField path="task" type="string" required>
  prompt เริ่มต้นที่ส่งไปยังเซสชัน ACP
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ต้องเป็น `"acp"` สำหรับเซสชัน ACP
</ParamField>
<ParamField path="agentId" type="string">
  ACP target harness id จะ fallback ไปใช้ `acp.defaultAgent` หากมีการตั้งค่าไว้
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  ขอใช้โฟลว์การผูกกับเธรดเมื่อมีการรองรับ
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` คือ one-shot; `"session"` คือแบบคงอยู่ หาก `thread: true` และ
  ไม่ได้ระบุ `mode` OpenClaw อาจใช้พฤติกรรมแบบคงอยู่โดยค่าเริ่มต้นตาม
  เส้นทางรันไทม์ `mode: "session"` ต้องใช้ `thread: true`
</ParamField>
<ParamField path="cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์ที่ร้องขอ (ตรวจสอบตามนโยบายของแบ็กเอนด์/รันไทม์)
  หากไม่ระบุ ACP spawn จะสืบทอด workspace ของ target agent
  เมื่อมีการกำหนดค่าไว้; หากเส้นทางที่สืบทอดมาไม่มีอยู่จะ fallback ไปยังค่าเริ่มต้นของแบ็กเอนด์
  ส่วนข้อผิดพลาดการเข้าถึงจริงจะถูกส่งกลับ
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับสำหรับผู้ปฏิบัติงานที่ใช้ในข้อความ session/banner
</ParamField>
<ParamField path="resumeSessionId" type="string">
  เรียกใช้ต่อเซสชัน ACP ที่มีอยู่แทนการสร้างเซสชันใหม่
  agent จะ replay ประวัติบทสนทนาของตนผ่าน `session/load` ต้องใช้
  `runtime: "acp"`
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` จะสตรีมสรุปความคืบหน้าของการรัน ACP เริ่มต้นกลับไปยัง
  requester session ในรูปแบบ system events คำตอบที่ยอมรับได้อาจมี
  `streamLogPath` ซึ่งชี้ไปยัง JSONL log แบบผูกกับเซสชัน
  (`<sessionId>.acp-stream.jsonl`) ที่คุณสามารถ tail เพื่อดูประวัติ relay เต็มรูปแบบ
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ยกเลิก ACP child turn หลังผ่านไป N วินาที `0` จะคงเทิร์นนั้นไว้บน
  เส้นทาง no-timeout ของ gateway ค่าเดียวกันนี้จะถูกใช้กับทั้ง Gateway
  run และ ACP runtime เพื่อไม่ให้ชุดเครื่องมือที่ค้างหรือใช้ quota หมด
  ยึดครอง lane ของ parent agent อย่างไม่มีกำหนด
</ParamField>
<ParamField path="model" type="string">
  การ override โมเดลแบบ explicit สำหรับ ACP child session การ spawn แบบ Codex ACP
  จะ normalize OpenClaw Codex refs เช่น `openai-codex/gpt-5.4` ไปเป็น Codex
  ACP startup config ก่อน `session/new`; รูปแบบที่มี slash เช่น
  `openai-codex/gpt-5.4/high` จะตั้งค่า Codex ACP reasoning effort ด้วย
  ชุดเครื่องมืออื่นต้องประกาศ ACP `models` และรองรับ
  `session/set_model`; มิฉะนั้น OpenClaw/acpx จะล้มเหลวอย่างชัดเจนแทนที่จะ
  fallback ไปใช้ค่าเริ่มต้นของ target agent แบบเงียบ ๆ
</ParamField>
<ParamField path="thinking" type="string">
  ระดับ effort ของ thinking/reasoning แบบ explicit สำหรับ Codex ACP, `minimal` จะ map ไปเป็น
  effort ต่ำ, `low`/`medium`/`high`/`xhigh` จะ map ตรงตัว และ `off`
  จะละการ override reasoning-effort ตอนเริ่มต้น
</ParamField>

## โหมด bind และ thread ของการ spawn

<Tabs>
  <Tab title="--bind here|off">
    | โหมด   | พฤติกรรม                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | ผูกกับบทสนทนาที่ใช้งานอยู่ในปัจจุบัน ณ ตำแหน่งเดิม; หากไม่มีบทสนทนาที่ใช้งานอยู่จะล้มเหลว |
    | `off`  | ไม่สร้างการผูกกับบทสนทนาปัจจุบัน                          |

    หมายเหตุ:

    - `--bind here` คือเส้นทางที่ง่ายที่สุดสำหรับผู้ปฏิบัติงานในกรณี "ทำให้ช่องหรือแชตนี้มี Codex รองรับ"
    - `--bind here` จะไม่สร้าง child thread
    - `--bind here` ใช้งานได้เฉพาะบนช่องทางที่เปิดเผยการรองรับการผูกกับบทสนทนาปัจจุบัน
    - `--bind` และ `--thread` ไม่สามารถใช้ร่วมกันในคำสั่ง `/acp spawn` เดียวกันได้

  </Tab>
  <Tab title="--thread auto|here|off">
    | โหมด   | พฤติกรรม                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | หากอยู่ในเธรดที่ใช้งานอยู่: ผูกกับเธรดนั้น หากอยู่นอกเธรด: สร้าง/ผูก child thread เมื่อรองรับ |
    | `here` | ต้องอยู่ใน active thread ปัจจุบัน; หากไม่อยู่จะล้มเหลว                                                  |
    | `off`  | ไม่มีการผูก เซสชันจะเริ่มแบบไม่ผูก                                                                 |

    หมายเหตุ:

    - บนพื้นผิวที่ไม่รองรับการผูกกับเธรด พฤติกรรมเริ่มต้นจะเทียบเท่ากับ `off`
    - การ spawn แบบผูกกับเธรดต้องรองรับโดยนโยบายของช่องทาง:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - ใช้ `--bind here` เมื่อคุณต้องการปักหมุดบทสนทนาปัจจุบันโดยไม่สร้าง child thread

  </Tab>
</Tabs>

## โมเดลการส่งมอบ

เซสชัน ACP อาจเป็นได้ทั้ง workspace แบบโต้ตอบหรือ
งานเบื้องหลังที่ parent เป็นเจ้าของ เส้นทางการส่งมอบขึ้นอยู่กับรูปแบบนั้น

<AccordionGroup>
  <Accordion title="เซสชัน ACP แบบโต้ตอบ">
    เซสชันแบบโต้ตอบมีไว้เพื่อพูดคุยต่อบน
    พื้นผิวแชตที่มองเห็นได้:

    - `/acp spawn ... --bind here` จะผูกบทสนทนาปัจจุบันเข้ากับเซสชัน ACP
    - `/acp spawn ... --thread ...` จะผูก channel thread/topic เข้ากับเซสชัน ACP
    - `bindings[].type="acp"` แบบคงอยู่ที่กำหนดค่าไว้ จะกำหนดเส้นทางบทสนทนาที่ตรงกันไปยังเซสชัน ACP เดิม

    ข้อความติดตามผลในบทสนทนาที่ผูกไว้จะถูกกำหนดเส้นทางตรงไปยัง
    เซสชัน ACP และเอาต์พุต ACP จะถูกส่งกลับมายัง
    channel/thread/topic เดิมนั้น

    สิ่งที่ OpenClaw ส่งไปยังชุดเครื่องมือ:

    - ข้อความติดตามผลปกติที่ผูกไว้จะถูกส่งเป็นข้อความ prompt พร้อมไฟล์แนบเฉพาะเมื่อชุดเครื่องมือ/แบ็กเอนด์รองรับ
    - คำสั่งจัดการ `/acp` และคำสั่ง Gateway ภายในเครื่องจะถูกดักก่อน ACP dispatch
    - เหตุการณ์ completion ที่รันไทม์สร้างขึ้นจะถูก materialize ตามเป้าหมาย OpenClaw agents จะได้รับ envelope ของ runtime-context ภายในของ OpenClaw; ส่วนชุดเครื่องมือ ACP ภายนอกจะได้รับ prompt แบบธรรมดาพร้อมผลลัพธ์ของ child และคำสั่ง ข้อความ envelope ดิบ `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ต้องไม่ถูกส่งไปยังชุดเครื่องมือภายนอกหรือถูกเก็บเป็นข้อความ user transcript ของ ACP
    - รายการ transcript ของ ACP จะใช้ข้อความ trigger ที่ผู้ใช้เห็นหรือ plain completion prompt metadata ของเหตุการณ์ภายในจะคงเป็นข้อมูลแบบมีโครงสร้างใน OpenClaw เมื่อเป็นไปได้ และไม่ถือว่าเป็นเนื้อหาแชตที่ผู้ใช้เขียนขึ้น

  </Accordion>
  <Accordion title="เซสชัน ACP แบบ one-shot ที่ parent เป็นเจ้าของ">
    เซสชัน ACP แบบ one-shot ที่ถูก spawn โดยการรันของอีก agent หนึ่งเป็น
    child แบบเบื้องหลัง คล้ายกับ sub-agents:

    - parent ขอให้งานทำงานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
    - child รันในเซสชันของชุดเครื่องมือ ACP ของตนเอง
    - child turns จะรันบน background lane เดียวกับที่ใช้โดย native sub-agent spawns ดังนั้นชุดเครื่องมือ ACP ที่ช้าจะไม่บล็อกงานหลักของเซสชันอื่นที่ไม่เกี่ยวข้อง
    - การเสร็จสมบูรณ์จะถูกรายงานกลับผ่านเส้นทางประกาศ task-completion OpenClaw จะแปลง metadata ภายในของ completion ให้เป็น ACP prompt แบบธรรมดาก่อนส่งไปยังชุดเครื่องมือภายนอก ดังนั้นชุดเครื่องมือจะไม่เห็นตัวทำเครื่องหมาย runtime context ที่มีเฉพาะ OpenClaw
    - parent จะเขียนผลลัพธ์ของ child ใหม่ในน้ำเสียง assistant ปกติเมื่อมีประโยชน์ที่จะตอบกลับให้ผู้ใช้เห็น

    **อย่า** มองเส้นทางนี้เป็นแชตแบบ peer-to-peer ระหว่าง parent
    และ child เพราะ child มีช่องทาง completion กลับไปยัง
    parent อยู่แล้ว

  </Accordion>
  <Accordion title="sessions_send และการส่งมอบแบบ A2A">
    `sessions_send` สามารถกำหนดเป้าหมายไปยังอีกเซสชันหนึ่งหลังการ spawn ได้ สำหรับ
    peer sessions ปกติ OpenClaw จะใช้เส้นทางติดตามผลแบบ agent-to-agent (A2A)
    หลังจาก inject ข้อความแล้ว:

    - รอคำตอบจากเซสชันเป้าหมาย
    - อนุญาตให้ requester และ target แลกเปลี่ยนข้อความติดตามผลได้แบบจำกัดจำนวนเทิร์นตามต้องการ
    - ขอให้ target สร้างข้อความประกาศ
    - ส่งประกาศนั้นไปยังช่องหรือเธรดที่มองเห็นได้

    เส้นทาง A2A นั้นเป็น fallback สำหรับ peer sends ที่ผู้ส่งต้องการ
    การติดตามผลที่มองเห็นได้ โดยยังคงเปิดใช้อยู่เมื่อเซสชันที่ไม่เกี่ยวข้องสามารถ
    มองเห็นและส่งข้อความไปยังเป้าหมาย ACP ได้ เช่น ภายใต้การตั้งค่า
    `tools.sessions.visibility` แบบกว้าง

    OpenClaw จะข้ามการติดตามผลแบบ A2A เฉพาะเมื่อ requester คือ
    parent ของ child ACP แบบ one-shot ที่ parent เป็นเจ้าของของตนเอง ในกรณีนั้น
    การรัน A2A ซ้อนทับบน task completion อาจปลุก parent ด้วย
    ผลลัพธ์ของ child ส่งต่อคำตอบของ parent กลับเข้าไปยัง child และ
    ก่อให้เกิดลูป echo ระหว่าง parent/child ได้ ผลลัพธ์ของ `sessions_send`
    จะรายงาน `delivery.status="skipped"` สำหรับกรณี owned-child นี้
    เพราะเส้นทาง completion รับผิดชอบผลลัพธ์อยู่แล้ว

  </Accordion>
  <Accordion title="เรียกใช้ต่อเซสชันที่มีอยู่">
    ใช้ `resumeSessionId` เพื่อทำงานต่อจากเซสชัน ACP ก่อนหน้าแทนการ
    เริ่มใหม่ agent จะ replay ประวัติบทสนทนาของตนผ่าน
    `session/load` จึงสามารถทำงานต่อด้วยบริบทเต็มของสิ่งที่เกิดขึ้นก่อนหน้าได้

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    กรณีใช้งานทั่วไป:

    - ส่งต่องานเซสชัน Codex จากแล็ปท็อปไปยังโทรศัพท์ของคุณ — บอก agent ให้ทำงานต่อจากจุดเดิม
    - ทำงานต่อจากเซสชันการเขียนโค้ดที่เริ่มไว้แบบโต้ตอบใน CLI แล้วเปลี่ยนมาทำต่อแบบ headless ผ่าน agent
    - ทำงานต่อจากงานที่ถูกขัดจังหวะด้วยการรีสตาร์ต gateway หรือ idle timeout

    หมายเหตุ:

    - `resumeSessionId` ต้องใช้ `runtime: "acp"` — จะคืนข้อผิดพลาดหากใช้กับรันไทม์ sub-agent
    - `resumeSessionId` จะกู้คืนประวัติบทสนทนา ACP ต้นทาง; ส่วน `thread` และ `mode` ยังมีผลตามปกติกับเซสชัน OpenClaw ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังคงต้องใช้ `thread: true`
    - target agent ต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
    - หากไม่พบ session id การ spawn จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน — ไม่มีการ fallback แบบเงียบ ๆ ไปยังเซสชันใหม่

  </Accordion>
  <Accordion title="Smoke test หลัง deploy">
    หลัง deploy gateway ให้รันการตรวจสอบแบบ live end-to-end แทน
    การเชื่อถือแค่ unit tests:

    1. ตรวจสอบเวอร์ชันและ commit ของ gateway ที่ deploy แล้วบนโฮสต์เป้าหมาย
    2. เปิดเซสชัน bridge ของ ACPX ชั่วคราวไปยัง live agent
    3. ขอให้ agent นั้นเรียก `sessions_spawn` ด้วย `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` และ task `Reply with exactly LIVE-ACP-SPAWN-OK`
    4. ตรวจสอบ `accepted=yes`, มี `childSessionKey` จริง และไม่มี validator error
    5. ล้างเซสชัน bridge ชั่วคราว

    ให้คง gate ไว้ที่ `mode: "run"` และข้าม `streamTo: "parent"` —
    เส้นทาง `mode: "session"` แบบผูกกับเธรดและ stream-relay เป็น
    การทดสอบการผสานรวมที่ลึกและสมบูรณ์ยิ่งกว่าซึ่งแยกต่างหาก

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้กับ Sandbox

ปัจจุบันเซสชัน ACP จะรันบนรันไทม์ของโฮสต์ **ไม่ใช่** ภายใน
sandbox ของ OpenClaw

<Warning>
**ขอบเขตความปลอดภัย:**

- ชุดเครื่องมือภายนอกสามารถอ่าน/เขียนได้ตามสิทธิ์ของ CLI ของตัวเองและ `cwd` ที่เลือก
- นโยบาย sandbox ของ OpenClaw **ไม่** ครอบการทำงานของชุดเครื่องมือ ACP
- OpenClaw ยังคงบังคับใช้ ACP feature gates, allowed agents, session ownership, channel bindings และนโยบายการส่งมอบของ Gateway
- ใช้ `runtime: "subagent"` สำหรับงาน native ของ OpenClaw ที่ต้องบังคับใช้ sandbox
  </Warning>

ข้อจำกัดปัจจุบัน:

- หาก requester session อยู่ใน sandbox การ spawn ACP จะถูกบล็อกทั้งสำหรับ `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
- `sessions_spawn` ที่ใช้ `runtime: "acp"` ไม่รองรับ `sandbox: "require"`

## การแก้เป้าหมายเซสชัน

การกระทำ `/acp` ส่วนใหญ่รองรับการระบุเป้าหมายเซสชันแบบเลือกได้ (`session-key`,
`session-id` หรือ `session-label`)

**ลำดับการแก้ค่า:**

1. อาร์กิวเมนต์เป้าหมายแบบ explicit (หรือ `--session` สำหรับ `/acp steer`)
   - ลองเป็น key ก่อน
   - จากนั้นเป็น session id รูปแบบ UUID
   - จากนั้นเป็น label
2. การผูกเธรดปัจจุบัน (หากบทสนทนา/เธรดนี้ถูกผูกกับเซสชัน ACP)
3. fallback ไปยัง requester session ปัจจุบัน

ทั้ง current-conversation bindings และ thread bindings ต่างมีส่วนร่วมใน
ขั้นตอนที่ 2

หากไม่สามารถแก้ค่าเป้าหมายได้ OpenClaw จะคืนข้อผิดพลาดที่ชัดเจน
(`Unable to resolve session target: ...`)

## การควบคุม ACP

| คำสั่ง              | สิ่งที่คำสั่งทำ                                              | ตัวอย่าง                                                       |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `/acp spawn`         | สร้างเซสชัน ACP; ผูกกับบทสนทนาปัจจุบันหรือผูกกับเธรดแบบเลือกได้ | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิกเทิร์นที่กำลังทำงานของเซสชันเป้าหมาย                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่งชี้นำไปยังเซสชันที่กำลังทำงานอยู่                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิดเซสชันและยกเลิกการผูกกับเป้าหมายเธรด                  | `/acp close`                                                  |
| `/acp status`        | แสดงแบ็กเอนด์ โหมด สถานะ ตัวเลือกรันไทม์ และความสามารถ | `/acp status`                                                 |
| `/acp set-mode`      | ตั้งค่าโหมดรันไทม์สำหรับเซสชันเป้าหมาย                      | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนค่าตัวเลือกการกำหนดค่ารันไทม์แบบทั่วไป                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่า override ไดเรกทอรีทำงานของรันไทม์                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้งค่าโปรไฟล์นโยบายการอนุมัติ                              | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้งค่า timeout ของรันไทม์ (วินาที)                            | `/acp timeout 120`                                            |
| `/acp model`         | ตั้งค่า override โมเดลของรันไทม์                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบ overrides ของตัวเลือกรันไทม์ของเซสชัน                  | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการเซสชัน ACP ล่าสุดจาก store                      | `/acp sessions`                                               |
| `/acp doctor`        | สุขภาพของแบ็กเอนด์ ความสามารถ และแนวทางแก้ไขที่นำไปใช้ได้จริง           | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอนการติดตั้งและเปิดใช้งานแบบกำหนดแน่นอน             | `/acp install`                                                |

`/acp status` จะแสดงตัวเลือกรันไทม์ที่มีผลจริง พร้อมทั้ง session identifiers
ทั้งระดับรันไทม์และระดับแบ็กเอนด์ ข้อผิดพลาดประเภท unsupported-control จะถูกแสดง
อย่างชัดเจนเมื่อแบ็กเอนด์ขาดความสามารถนั้น `/acp sessions` จะอ่านจาก
store สำหรับเซสชันที่ผูกอยู่ปัจจุบันหรือ requester session โดย target tokens
(`session-key`, `session-id` หรือ `session-label`) จะถูกแก้ค่าผ่าน
การค้นหาเซสชันของ gateway รวมถึง `session.store`
roots แบบกำหนดเองต่อ agent

### การแมปตัวเลือกรันไทม์

`/acp` มีทั้งคำสั่งอำนวยความสะดวกและตัวตั้งค่าแบบทั่วไป การดำเนินการที่เทียบเท่ากัน:

| คำสั่ง                      | แมปไปยัง                              | หมายเหตุ                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtime config key `model`           | สำหรับ Codex ACP, OpenClaw จะ normalize `openai-codex/<model>` ไปเป็น adapter model id และ map suffix ของ reasoning แบบ slash เช่น `openai-codex/gpt-5.4/high` ไปยัง `reasoning_effort` |
| `/acp set thinking <level>`  | runtime config key `thinking`        | สำหรับ Codex ACP, OpenClaw จะส่ง `reasoning_effort` ที่สอดคล้องกันเมื่อ adapter รองรับ                                                                             |
| `/acp permissions <profile>` | runtime config key `approval_policy` | —                                                                                                                                                                                 |
| `/acp timeout <seconds>`     | runtime config key `timeout`         | —                                                                                                                                                                                 |
| `/acp cwd <path>`            | runtime cwd override                 | อัปเดตโดยตรง                                                                                                                                                                 |
| `/acp set <key> <value>`     | ทั่วไป                              | `key=cwd` จะใช้เส้นทาง override ของ cwd                                                                                                                                          |
| `/acp reset-options`         | ล้าง runtime overrides ทั้งหมด         | —                                                                                                                                                                                 |

## ชุดเครื่องมือ acpx, การตั้งค่า Plugin และสิทธิ์

สำหรับการกำหนดค่าชุดเครื่องมือ acpx (aliases ของ Claude Code / Codex / Gemini CLI),
MCP bridges ของเครื่องมือ Plugin และเครื่องมือ OpenClaw รวมถึงโหมดสิทธิ์ของ ACP
โปรดดู
[เอเจนต์ ACP — การตั้งค่า](/th/tools/acp-agents-setup)

## การแก้ไขปัญหา

| อาการ                                                                     | สาเหตุที่น่าจะเป็น                                                                    | วิธีแก้                                                                                                                                                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                   | แบ็กเอนด์ Plugin ไม่มีอยู่ ถูกปิดใช้งาน หรือถูกบล็อกโดย `plugins.allow`                | ติดตั้งและเปิดใช้แบ็กเอนด์ Plugin ใส่ `acpx` ลงใน `plugins.allow` เมื่อมีการตั้งค่า allowlist นี้ แล้วรัน `/acp doctor`                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                           | ACP ถูกปิดใช้งานทั้งระบบ                                                          | ตั้งค่า `acp.enabled=true`                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`         | ปิดการ dispatch จากข้อความเธรดปกติ                                  | ตั้งค่า `acp.dispatch.enabled=true`                                                                                                                                         |
| `ACP agent "<id>" is not allowed by policy`                               | agent ไม่อยู่ใน allowlist                                                         | ใช้ `agentId` ที่ได้รับอนุญาต หรืออัปเดต `acp.allowedAgents`                                                                                                                     |
| `/acp doctor` รายงานว่าแบ็กเอนด์ยังไม่พร้อมทันทีหลังเริ่มต้นระบบ                 | การตรวจสอบ dependency หรือการซ่อมแซมตัวเองของ Plugin ยังทำงานอยู่                        | รอสักครู่แล้วรัน `/acp doctor` ใหม่; หากยังไม่พร้อมใช้งาน ให้ตรวจสอบข้อผิดพลาดการติดตั้งแบ็กเอนด์และนโยบาย allow/deny ของ Plugin                                             |
| ไม่พบคำสั่งของชุดเครื่องมือ                                                   | ยังไม่ได้ติดตั้ง adapter CLI หรือการดึงด้วย `npx` ในครั้งแรกล้มเหลว                   | ติดตั้ง/วอร์ม adapter ล่วงหน้าบนโฮสต์ Gateway หรือกำหนดคำสั่ง acpx agent อย่าง explicit                                                                         |
| model-not-found จากชุดเครื่องมือ                                            | model id ใช้ได้กับผู้ให้บริการ/ชุดเครื่องมืออื่น แต่ใช้ไม่ได้กับเป้าหมาย ACP นี้         | ใช้โมเดลที่ชุดเครื่องมือนั้นแสดงไว้ กำหนดค่าโมเดลในชุดเครื่องมือ หรือไม่ต้องใช้ override                                                                            |
| ข้อผิดพลาด vendor auth จากชุดเครื่องมือ                                          | OpenClaw ปกติดี แต่ CLI/ผู้ให้บริการเป้าหมายยังไม่ได้ล็อกอิน              | ล็อกอินหรือระบุ provider key ที่จำเป็นในสภาพแวดล้อมของโฮสต์ Gateway                                                                                             |
| `Unable to resolve session target: ...`                                   | token ของ key/id/label ไม่ถูกต้อง                                                         | รัน `/acp sessions` คัดลอก key/label ที่ตรงกัน แล้วลองใหม่                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มีบทสนทนาที่ผูกได้และกำลังใช้งานอยู่                     | ย้ายไปที่แชต/ช่องเป้าหมายแล้วลองใหม่ หรือใช้การ spawn แบบไม่ผูก                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                    | adapter ไม่มีความสามารถในการผูก ACP กับบทสนทนาปัจจุบัน                      | ใช้ `/acp spawn ... --thread ...` เมื่อรองรับ กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปยังช่องทางที่รองรับ                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`   | ใช้ `--thread here` นอกบริบทของเธรด                                  | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off`                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`             | มีผู้ใช้อื่นเป็นเจ้าของเป้าหมายการผูกที่กำลังใช้งานอยู่                                    | ผูกใหม่ในฐานะเจ้าของ หรือใช้บทสนทนาหรือเธรดอื่น                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                          | adapter ไม่มีความสามารถในการผูกกับเธรด                                        | ใช้ `--thread off` หรือย้ายไปยัง adapter/ช่องทางที่รองรับ                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                        | รันไทม์ ACP อยู่ฝั่งโฮสต์; requester session อยู่ใน sandbox                       | ใช้ `runtime="subagent"` จากเซสชันที่อยู่ใน sandbox หรือรัน ACP spawn จากเซสชันที่ไม่ได้อยู่ใน sandbox                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`   | มีการร้องขอ `sandbox="require"` สำหรับรันไทม์ ACP                                  | ใช้ `runtime="subagent"` สำหรับการบังคับใช้ sandbox หรือใช้ ACP กับ `sandbox="inherit"` จากเซสชันที่ไม่ได้อยู่ใน sandbox                                                      |
| `Cannot apply --model ... did not advertise model support`                | ชุดเครื่องมือเป้าหมายไม่ได้เปิดเผยการสลับโมเดล ACP แบบทั่วไป                 | ใช้ชุดเครื่องมือที่ประกาศ ACP `models`/`session/set_model` ใช้ Codex ACP model refs หรือกำหนดค่าโมเดลโดยตรงในชุดเครื่องมือหากมี startup flag ของตัวเอง |
| ไม่มี ACP metadata สำหรับเซสชันที่ผูกไว้                                      | ACP session metadata เก่าหรือถูกลบไปแล้ว                                             | สร้างใหม่ด้วย `/acp spawn` จากนั้นผูกหรือโฟกัสเธรดใหม่                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`  | `permissionMode` บล็อกการเขียน/การรันคำสั่งในเซสชัน ACP แบบไม่โต้ตอบ             | ตั้งค่า `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ต gateway ดู [การกำหนดค่าสิทธิ์](/th/tools/acp-agents-setup#permission-configuration) |
| เซสชัน ACP ล้มเหลวตั้งแต่ต้นโดยแทบไม่มีเอาต์พุต                                  | permission prompts ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions` | ตรวจสอบ gateway logs เพื่อหา `AcpRuntimeError` หากต้องการสิทธิ์เต็ม ให้ตั้ง `permissionMode=approve-all`; หากต้องการลดระดับอย่างนุ่มนวล ให้ตั้ง `nonInteractivePermissions=deny`        |
| เซสชัน ACP ค้างไม่สิ้นสุดหลังทำงานเสร็จ                       | process ของชุดเครื่องมือจบแล้ว แต่เซสชัน ACP ไม่ได้รายงานการเสร็จสมบูรณ์             | ตรวจสอบด้วย `ps aux \| grep acpx`; ฆ่า process ที่ค้างด้วยตนเอง                                                                                                       |
| ชุดเครื่องมือเห็น `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                  | internal event envelope รั่วข้ามขอบเขต ACP                         | อัปเดต OpenClaw แล้วรันโฟลว์ completion ใหม่; ชุดเครื่องมือภายนอกควรได้รับเฉพาะ completion prompts แบบธรรมดาเท่านั้น                                                          |

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP — การตั้งค่า](/th/tools/acp-agents-setup)
- [การส่งของเอเจนต์](/th/tools/agent-send)
- [CLI Backends](/th/gateway/cli-backends)
- [Codex harness](/th/plugins/codex-harness)
- [เครื่องมือ sandbox แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (โหมด bridge)](/th/cli/acp)
- [Sub-agents](/th/tools/subagents)
