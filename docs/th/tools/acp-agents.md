---
read_when:
    - การเรียกใช้ชุดควบคุมการเขียนโค้ดผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับการสนทนาบนช่องทางการส่งข้อความ
    - การผูกการสนทนาในช่องทางข้อความเข้ากับเซสชัน ACP ที่คงอยู่ถาวร
    - การแก้ไขปัญหาแบ็กเอนด์ ACP, การเชื่อมต่อ Plugin หรือการส่งมอบผลลัพธ์ที่เสร็จสมบูรณ์
    - การใช้งานคำสั่ง /acp จากแชต
sidebarTitle: ACP agents
summary: เรียกใช้ฮาร์เนสการเขียนโค้ดภายนอก (Claude Code, Cursor, Gemini CLI, Codex ACP แบบระบุชัดเจน, OpenClaw ACP, OpenCode) ผ่านแบ็กเอนด์ ACP
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-05-07T13:27:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

[เซสชัน Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
ทำให้ OpenClaw เรียกใช้ harness สำหรับเขียนโค้ดภายนอกได้ (เช่น Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI และ harness
ACPX อื่นๆ ที่รองรับ) ผ่าน Plugin backend ของ ACP

การ spawn เซสชัน ACP แต่ละครั้งจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

<Note>
**ACP คือเส้นทางสำหรับ external-harness ไม่ใช่เส้นทาง Codex เริ่มต้น** Plugin
native Codex app-server เป็นเจ้าของการควบคุม `/codex ...` และ runtime แบบฝัง
`agentRuntime.id: "codex"` ส่วน ACP เป็นเจ้าของการควบคุม
`/acp ...` และเซสชัน `sessions_spawn({ runtime: "acp" })`

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็นไคลเอนต์ MCP ภายนอก
โดยตรงกับการสนทนาช่องทาง OpenClaw ที่มีอยู่ ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน ACP
</Note>

## ฉันต้องการหน้าใด?

| คุณต้องการ…                                                                                    | ใช้สิ่งนี้                              | หมายเหตุ                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ผูกหรือควบคุม Codex ในการสนทนาปัจจุบัน                                               | `/codex bind`, `/codex threads`       | เส้นทาง native Codex app-server เมื่อเปิดใช้ Plugin `codex`; รวมถึงการตอบกลับแชทที่ผูกไว้ การส่งต่อรูปภาพ model/fast/permissions การหยุด และการควบคุมทิศทาง ACP เป็น fallback แบบชัดเจน |
| เรียกใช้ Claude Code, Gemini CLI, Codex ACP แบบชัดเจน หรือ harness ภายนอกอื่น _ผ่าน_ OpenClaw | หน้านี้                             | เซสชันที่ผูกกับแชท, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, งานเบื้องหลัง, การควบคุม runtime                                                                                   |
| เปิดเผยเซสชัน OpenClaw Gateway _เป็น_ เซิร์ฟเวอร์ ACP สำหรับ editor หรือไคลเอนต์                   | [`openclaw acp`](/th/cli/acp)            | โหมด bridge IDE/ไคลเอนต์คุย ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                                                                                            |
| นำ AI CLI ภายในเครื่องมาใช้ซ้ำเป็น fallback model แบบข้อความเท่านั้น                                              | [CLI Backends](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw ไม่มีการควบคุม ACP ไม่มี runtime ของ harness                                                                                                                               |

## ใช้งานได้ทันทีหรือไม่?

ได้ หลังจากติดตั้ง Plugin runtime ACP อย่างเป็นทางการแล้ว:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

source checkout สามารถใช้ Plugin workspace `extensions/acpx` ภายในเครื่องได้หลังจาก
`pnpm install` เรียกใช้ `/acp doctor` เพื่อตรวจสอบความพร้อม

OpenClaw จะสอน agent เกี่ยวกับการ spawn ACP เฉพาะเมื่อ ACP
**ใช้งานได้จริง** เท่านั้น: ต้องเปิดใช้ ACP, dispatch ต้องไม่ถูกปิดใช้งาน,
เซสชันปัจจุบันต้องไม่ถูก sandbox บล็อก และต้องโหลด runtime backend แล้ว
หากไม่เป็นไปตามเงื่อนไขเหล่านี้ Skills ของ Plugin ACP และคำแนะนำ ACP สำหรับ
`sessions_spawn` จะยังถูกซ่อนไว้ เพื่อไม่ให้ agent แนะนำ backend
ที่ไม่พร้อมใช้งาน

<AccordionGroup>
  <Accordion title="ข้อควรระวังในการเรียกใช้ครั้งแรก">
    - หากตั้งค่า `plugins.allow` ไว้ ค่านั้นคือ inventory ของ Plugin แบบจำกัด และ **ต้อง** มี `acpx`; มิฉะนั้น backend ACP ที่ติดตั้งไว้จะถูกบล็อกโดยตั้งใจ และ `/acp doctor` จะรายงานรายการ allowlist ที่ขาดอยู่
    - adapter Codex ACP ถูกจัดเตรียมมากับ Plugin `acpx` และเปิดใช้ภายในเครื่องเมื่อเป็นไปได้
    - Codex ACP ทำงานด้วย `CODEX_HOME` ที่แยกออกมา; OpenClaw จะคัดลอกเฉพาะรายการโปรเจกต์ที่เชื่อถือได้จาก config Codex ของโฮสต์ และเชื่อถือ workspace ที่ใช้งานอยู่ โดยปล่อย auth, notifications และ hooks ไว้บน config ของโฮสต์
    - adapter ของ harness เป้าหมายอื่นอาจยังถูกดึงมาตามต้องการด้วย `npx` ในครั้งแรกที่คุณใช้
    - auth ของผู้ให้บริการยังต้องมีอยู่บนโฮสต์สำหรับ harness นั้น
    - หากโฮสต์ไม่มี npm หรือการเข้าถึงเครือข่าย การดึง adapter ในครั้งแรกจะล้มเหลวจนกว่าจะ pre-warm cache หรือติดตั้ง adapter ด้วยวิธีอื่น

  </Accordion>
  <Accordion title="ข้อกำหนดเบื้องต้นของ runtime">
    ACP จะเปิด process ของ harness ภายนอกจริง OpenClaw เป็นเจ้าของ routing,
    สถานะงานเบื้องหลัง, การส่งมอบ, bindings และ policy; harness
    เป็นเจ้าของ provider login, model catalog, พฤติกรรม filesystem และ
    เครื่องมือ native ของตัวเอง

    ก่อนโทษ OpenClaw ให้ตรวจสอบว่า:

    - `/acp doctor` รายงาน backend ที่เปิดใช้และทำงานดีแล้ว
    - target id ได้รับอนุญาตโดย `acp.allowedAgents` เมื่อมีการตั้งค่า allowlist นั้น
    - คำสั่ง harness สามารถเริ่มบนโฮสต์ Gateway ได้
    - มี provider auth สำหรับ harness นั้น (`claude`, `codex`, `gemini`, `opencode`, `droid` ฯลฯ)
    - model ที่เลือกมีอยู่สำหรับ harness นั้น - model id ไม่สามารถย้ายข้าม harness ได้
    - `cwd` ที่ร้องขอมีอยู่และเข้าถึงได้ หรือไม่ต้องระบุ `cwd` แล้วให้ backend ใช้ค่าเริ่มต้นของตัวเอง
    - โหมด permission ตรงกับงาน เซสชันแบบไม่โต้ตอบไม่สามารถคลิก native permission prompt ได้ ดังนั้นงานเขียนโค้ดที่เน้น write/exec มักต้องใช้โปรไฟล์ permission ACPX ที่ดำเนินต่อแบบ headless ได้

  </Accordion>
</AccordionGroup>

เครื่องมือ Plugin ของ OpenClaw และเครื่องมือ OpenClaw ในตัว **จะไม่** ถูกเปิดเผยให้
harness ACP โดยค่าเริ่มต้น เปิดใช้ bridge MCP แบบชัดเจนใน
[agent ACP - การตั้งค่า](/th/tools/acp-agents-setup) เฉพาะเมื่อ harness
ควรเรียกเครื่องมือเหล่านั้นโดยตรง

## เป้าหมาย harness ที่รองรับ

เมื่อใช้ backend `acpx` ให้ใช้ harness id เหล่านี้เป็นเป้าหมาย `/acp spawn <id>`
หรือ `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness id | Backend ทั่วไป                                | หมายเหตุ                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | ต้องมี auth Claude Code บนโฮสต์                                              |
| `codex`    | Adapter Codex ACP                              | fallback ACP แบบชัดเจนเท่านั้นเมื่อ native `/codex` ไม่พร้อมใช้งาน หรือมีการร้องขอ ACP |
| `copilot`  | Adapter GitHub Copilot ACP                     | ต้องมี auth Copilot CLI/runtime                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | override คำสั่ง acpx หากการติดตั้งภายในเครื่องเปิดเผย ACP entrypoint อื่น    |
| `droid`    | Factory Droid CLI                              | ต้องมี auth Factory/Droid หรือ `FACTORY_API_KEY` ในสภาพแวดล้อมของ harness        |
| `gemini`   | Adapter Gemini CLI ACP                         | ต้องมี auth Gemini CLI หรือการตั้งค่า API key                                          |
| `iflow`    | iFlow CLI                                      | ความพร้อมของ adapter และการควบคุม model ขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `kilocode` | Kilo Code CLI                                  | ความพร้อมของ adapter และการควบคุม model ขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `kimi`     | Kimi/Moonshot CLI                              | ต้องมี auth Kimi/Moonshot บนโฮสต์                                            |
| `kiro`     | Kiro CLI                                       | ความพร้อมของ adapter และการควบคุม model ขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `opencode` | Adapter OpenCode ACP                           | ต้องมี auth OpenCode CLI/provider                                                |
| `openclaw` | bridge OpenClaw Gateway ผ่าน `openclaw acp` | ช่วยให้ harness ที่รองรับ ACP คุยกลับมายังเซสชัน OpenClaw Gateway ได้                 |
| `pi`       | Pi/runtime OpenClaw แบบฝัง                   | ใช้สำหรับการทดลอง harness แบบ OpenClaw-native                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | ต้องมี auth ที่เข้ากันได้กับ Qwen บนโฮสต์                                          |

alias agent acpx แบบกำหนดเองสามารถตั้งค่าใน acpx เองได้ แต่ policy ของ OpenClaw
ยังคงตรวจสอบ `acp.allowedAgents` และ mapping
`agents.list[].runtime.acp.agent` ใดๆ ก่อน dispatch

## Runbook สำหรับ operator

flow `/acp` แบบเร็วจากแชท:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` หรือระบุชัดเจน
    `/acp spawn codex --bind here`
  </Step>
  <Step title="ทำงาน">
    ดำเนินต่อในการสนทนาหรือ thread ที่ผูกไว้ (หรือระบุ session
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
  <Step title="กำกับทิศทาง">
    โดยไม่แทนที่ context: `/acp steer tighten logging and continue`
  </Step>
  <Step title="หยุด">
    `/acp cancel` (turn ปัจจุบัน) หรือ `/acp close` (เซสชัน + bindings)
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="รายละเอียด lifecycle">
    - การ spawn จะสร้างหรือ resume เซสชัน runtime ACP, บันทึก metadata ACP ใน session store ของ OpenClaw และอาจสร้างงานเบื้องหลังเมื่อ run นั้นมี parent เป็นเจ้าของ
    - เซสชัน ACP ที่มี parent เป็นเจ้าของจะถูกถือเป็นงานเบื้องหลัง แม้ว่าเซสชัน runtime จะเป็น persistent ก็ตาม; completion และการส่งมอบข้าม surface จะผ่าน parent task notifier แทนการทำตัวเหมือนเซสชันแชทปกติที่ผู้ใช้เห็น
    - การบำรุงรักษา task จะปิดเซสชัน ACP แบบ one-shot ที่มี parent เป็นเจ้าของซึ่งจบแล้วหรือกำพร้า เซสชัน ACP แบบ persistent จะถูกรักษาไว้ในขณะที่ยังมี binding การสนทนาที่ active; เซสชัน persistent ที่ค้างอยู่โดยไม่มี binding ที่ active จะถูกปิด เพื่อไม่ให้ถูก resume เงียบๆ หลังจาก task เจ้าของเสร็จแล้วหรือ record ของ task หายไป
    - ข้อความ follow-up ที่ผูกไว้จะไปยังเซสชัน ACP โดยตรงจนกว่า binding จะถูกปิด, unfocused, reset หรือหมดอายุ
    - คำสั่ง Gateway จะอยู่ภายในเครื่อง `/acp ...`, `/status` และ `/unfocus` จะไม่ถูกส่งเป็นข้อความ prompt ปกติไปยัง harness ACP ที่ผูกไว้
    - `cancel` จะยกเลิก turn ที่ active เมื่อ backend รองรับ cancellation; ไม่ได้ลบ binding หรือ metadata ของเซสชัน
    - `close` จบเซสชัน ACP จากมุมมองของ OpenClaw และลบ binding harness อาจยังคงเก็บ history upstream ของตัวเองไว้ หากรองรับ resume
    - Plugin acpx จะล้าง process tree ของ wrapper และ adapter ที่ OpenClaw เป็นเจ้าของหลังจาก `close` และ reap orphan ACPX ที่ OpenClaw เป็นเจ้าของซึ่งค้างอยู่ระหว่างการเริ่มต้น Gateway
    - runtime worker ที่ idle มีสิทธิ์ถูกล้างหลังจาก `acp.runtime.ttlMinutes`; metadata เซสชันที่เก็บไว้ยังพร้อมใช้งานสำหรับ `/acp sessions`

  </Accordion>
  <Accordion title="กฎ routing ของ native Codex">
    trigger ภาษาธรรมชาติที่ควร route ไปยัง **Plugin native Codex**
    เมื่อเปิดใช้งาน:

    - "ผูกช่อง Discord นี้กับ Codex"
    - "แนบแชทนี้กับ thread Codex `<id>`"
    - "แสดง thread Codex แล้วผูกอันนี้"

    การผูกบทสนทนา Codex แบบเนทีฟคือเส้นทางควบคุมแชทเริ่มต้น
    เครื่องมือไดนามิกของ OpenClaw ยังคงดำเนินการผ่าน OpenClaw ส่วน
    เครื่องมือแบบเนทีฟของ Codex เช่น shell/apply-patch จะดำเนินการภายใน Codex
    สำหรับอีเวนต์เครื่องมือแบบเนทีฟของ Codex นั้น OpenClaw จะฉีดรีเลย์
    native hook แบบต่อรอบ เพื่อให้ plugin hooks สามารถบล็อก `before_tool_call`, สังเกต
    `after_tool_call`, และส่งต่ออีเวนต์ Codex `PermissionRequest`
    ผ่านการอนุมัติของ OpenClaw ได้ Codex `Stop` hooks จะถูกรีเลย์ไปยัง
    OpenClaw `before_agent_finalize` ซึ่ง plugins สามารถขอให้โมเดลทำงานเพิ่มอีกหนึ่ง
    รอบก่อนที่ Codex จะสรุปคำตอบของตน รีเลย์นี้ยังคงตั้งใจให้ระมัดระวัง:
    จะไม่แก้ไขอาร์กิวเมนต์ของเครื่องมือแบบเนทีฟของ Codex
    หรือเขียนระเบียนเธรดของ Codex ใหม่ ใช้ ACP แบบชัดเจนเฉพาะ
    เมื่อต้องการโมเดล runtime/session ของ ACP เท่านั้น ขอบเขตการรองรับ Codex
    แบบฝังตัวได้รับการบันทึกไว้ใน
    [สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

  </Accordion>
  <Accordion title="ชีตสรุปการเลือกโมเดล / provider / runtime">
    - `openai-codex/*` - เส้นทางโมเดล Codex OAuth/subscription แบบเดิมที่ซ่อมแซมโดย doctor
    - `openai/*` - runtime แบบฝังตัวของ app-server Codex เนทีฟสำหรับรอบเอเจนต์ OpenAI
    - `/codex ...` - การควบคุมบทสนทนา Codex แบบเนทีฟ
    - `/acp ...` หรือ `runtime: "acp"` - การควบคุม ACP/acpx แบบชัดเจน

  </Accordion>
  <Accordion title="ตัวกระตุ้นภาษาธรรมชาติสำหรับการกำหนดเส้นทาง ACP">
    ตัวกระตุ้นที่ควรส่งไปยัง runtime ของ ACP:

    - "รันสิ่งนี้เป็นเซสชัน Claude Code ACP แบบครั้งเดียว แล้วสรุปผลลัพธ์"
    - "ใช้ Gemini CLI สำหรับงานนี้ในเธรด แล้วคงการติดตามผลไว้ในเธรดเดียวกันนั้น"
    - "รัน Codex ผ่าน ACP ในเธรดเบื้องหลัง"

    OpenClaw เลือก `runtime: "acp"`, resolve `agentId` ของ harness,
    ผูกกับบทสนทนาหรือเธรดปัจจุบันเมื่อรองรับ และ
    ส่งการติดตามผลไปยังเซสชันนั้นจนกว่าจะปิด/หมดอายุ Codex จะ
    ใช้เส้นทางนี้เฉพาะเมื่อระบุ ACP/acpx อย่างชัดเจน หรือ Plugin Codex แบบเนทีฟ
    ไม่พร้อมใช้งานสำหรับการดำเนินการที่ร้องขอเท่านั้น

    สำหรับ `sessions_spawn` จะประกาศ `runtime: "acp"` เฉพาะเมื่อ ACP
    เปิดใช้งาน ผู้ร้องขอไม่ได้อยู่ใน sandbox และมีการโหลด backend runtime
    ของ ACP แล้ว `acp.dispatch.enabled=false` จะหยุดการ dispatch เธรด ACP
    อัตโนมัติชั่วคราว แต่จะไม่ซ่อนหรือบล็อกการเรียก
    `sessions_spawn({ runtime: "acp" })` แบบชัดเจน โดยมีเป้าหมายเป็น ACP harness ids เช่น `codex`,
    `claude`, `droid`, `gemini` หรือ `opencode` อย่าส่งผ่าน agent id การกำหนดค่า
    OpenClaw ปกติจาก `agents_list` เว้นแต่รายการนั้นจะได้รับการกำหนดค่า
    อย่างชัดเจนด้วย `agents.list[].runtime.type="acp"`;
    มิฉะนั้นให้ใช้ runtime sub-agent เริ่มต้น เมื่อเอเจนต์ OpenClaw
    ถูกกำหนดค่าด้วย `runtime.type="acp"` OpenClaw จะใช้
    `runtime.acp.agent` เป็น harness id พื้นฐาน

  </Accordion>
</AccordionGroup>

## ACP เทียบกับ sub-agents

ใช้ ACP เมื่อต้องการ runtime harness ภายนอก ใช้ **app-server Codex
แบบเนทีฟ** สำหรับการผูก/ควบคุมบทสนทนา Codex เมื่อเปิดใช้งาน Plugin `codex`
ใช้ **sub-agents** เมื่อต้องการงาน delegated แบบเนทีฟของ OpenClaw

| พื้นที่          | เซสชัน ACP                           | การรัน sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (เช่น acpx) | runtime sub-agent เนทีฟของ OpenClaw  |
| คีย์เซสชัน   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| คำสั่งหลัก | `/acp ...`                            | `/subagents ...`                   |
| เครื่องมือ spawn    | `sessions_spawn` พร้อม `runtime:"acp"` | `sessions_spawn` (runtime เริ่มต้น) |

ดูเพิ่มเติมที่ [Sub-agents](/th/tools/subagents)

## วิธีที่ ACP รัน Claude Code

สำหรับ Claude Code ผ่าน ACP สแต็กคือ:

1. control plane เซสชัน ACP ของ OpenClaw
2. Plugin runtime `@openclaw/acpx` อย่างเป็นทางการ
3. adapter Claude ACP
4. กลไก runtime/session ฝั่ง Claude

ACP Claude คือ **เซสชัน harness** ที่มีการควบคุม ACP, การ resume เซสชัน,
การติดตามงานเบื้องหลัง และการผูกบทสนทนา/เธรดแบบเลือกได้

backend CLI เป็น runtime fallback แบบ local ข้อความเท่านั้นที่แยกต่างหาก - ดู
[backend CLI](/th/gateway/cli-backends)

สำหรับผู้ปฏิบัติการ กฎที่ใช้จริงคือ:

- **ต้องการ `/acp spawn`, เซสชันที่ผูกได้, การควบคุม runtime, หรืองาน harness แบบคงอยู่หรือไม่** ใช้ ACP
- **ต้องการ fallback ข้อความ local แบบง่ายผ่าน CLI ดิบหรือไม่** ใช้ backend CLI

## เซสชันที่ผูกไว้

### แบบจำลองทางความคิด

- **พื้นผิวแชท** - ที่ที่ผู้คนยังคุยกันต่อ (ช่อง Discord, หัวข้อ Telegram, แชท iMessage)
- **เซสชัน ACP** - สถานะ runtime Codex/Claude/Gemini ที่คงทนซึ่ง OpenClaw ส่งไปหา
- **เธรด/หัวข้อย่อย** - พื้นผิวการส่งข้อความเพิ่มเติมแบบเลือกได้ที่สร้างโดย `--thread ...` เท่านั้น
- **พื้นที่ทำงาน runtime** - ตำแหน่งระบบไฟล์ (`cwd`, repo checkout, พื้นที่ทำงาน backend) ที่ harness ทำงานอยู่ เป็นอิสระจากพื้นผิวแชท

### การผูกกับบทสนทนาปัจจุบัน

`/acp spawn <harness> --bind here` ปักหมุดบทสนทนาปัจจุบันไว้กับ
เซสชัน ACP ที่ spawn แล้ว - ไม่มีเธรดย่อย ใช้พื้นผิวแชทเดิม OpenClaw ยังคง
เป็นเจ้าของ transport, auth, safety และ delivery ข้อความติดตามผลใน
บทสนทนานั้นจะส่งไปยังเซสชันเดียวกัน; `/new` และ `/reset` จะรีเซ็ต
เซสชันในตำแหน่งเดิม; `/acp close` จะลบการผูก

ตัวอย่าง:

```text
/codex bind                                              # ผูก Codex แบบเนทีฟ แล้วส่งข้อความในอนาคตมาที่นี่
/codex model gpt-5.4                                     # ปรับเธรด Codex แบบเนทีฟที่ผูกไว้
/codex stop                                              # ควบคุมรอบ Codex แบบเนทีฟที่ใช้งานอยู่
/acp spawn codex --bind here                             # fallback ACP แบบชัดเจนสำหรับ Codex
/acp spawn codex --thread auto                           # อาจสร้างเธรด/หัวข้อย่อยและผูกที่นั่น
/acp spawn codex --bind here --cwd /workspace/repo       # การผูกแชทเดิม โดย Codex รันใน /workspace/repo
```

<AccordionGroup>
  <Accordion title="กฎการผูกและความเป็นเอกเทศ">
    - `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้
    - `--bind here` ใช้ได้เฉพาะในช่องทางที่ประกาศความสามารถการผูกบทสนทนาปัจจุบัน; มิฉะนั้น OpenClaw จะส่งคืนข้อความว่าไม่รองรับอย่างชัดเจน การผูกยังคงอยู่ข้ามการรีสตาร์ท Gateway
    - บน Discord, `spawnSessions` ควบคุมการสร้างเธรดย่อยสำหรับ `--thread auto|here` - ไม่ใช่ `--bind here`
    - หากคุณ spawn ไปยังเอเจนต์ ACP อื่นโดยไม่มี `--cwd` OpenClaw จะสืบทอดพื้นที่ทำงานของ **เอเจนต์เป้าหมาย** ตามค่าเริ่มต้น พาธที่สืบทอดแต่ขาดหายไป (`ENOENT`/`ENOTDIR`) จะ fallback ไปยังค่าเริ่มต้นของ backend; ข้อผิดพลาดการเข้าถึงอื่น (เช่น `EACCES`) จะแสดงเป็นข้อผิดพลาดการ spawn
    - คำสั่งจัดการ Gateway จะยังคงอยู่ใน local สำหรับบทสนทนาที่ผูกไว้ - คำสั่ง `/acp ...` จัดการโดย OpenClaw แม้เมื่อข้อความติดตามผลปกติถูกส่งไปยังเซสชัน ACP ที่ผูกไว้; `/status` และ `/unfocus` ก็ยังคงอยู่ใน local เมื่อใดก็ตามที่เปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

  </Accordion>
  <Accordion title="เซสชันที่ผูกกับเธรด">
    เมื่อเปิดใช้งานการผูกเธรดสำหรับ channel adapter:

    - OpenClaw ผูกเธรดเข้ากับเซสชัน ACP เป้าหมาย
    - ข้อความติดตามผลในเธรดนั้นจะส่งไปยังเซสชัน ACP ที่ผูกไว้
    - เอาต์พุต ACP จะถูกส่งกลับไปยังเธรดเดียวกัน
    - Unfocus/close/archive/idle-timeout หรือการหมดอายุจาก max-age จะลบการผูก
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` และ `/unfocus` เป็นคำสั่ง Gateway ไม่ใช่ prompt ไปยัง ACP harness

    feature flags ที่ต้องใช้สำหรับ ACP ที่ผูกกับเธรด:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` เปิดอยู่ตามค่าเริ่มต้น (ตั้งค่า `false` เพื่อหยุดการ dispatch เธรด ACP อัตโนมัติชั่วคราว; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังทำงานได้)
    - เปิดใช้งานการ spawn เซสชันเธรดของ channel-adapter (ค่าเริ่มต้น: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    การรองรับการผูกเธรดขึ้นกับ adapter แต่ละตัว หาก channel
    adapter ที่ใช้งานอยู่ไม่รองรับการผูกเธรด OpenClaw จะส่งคืน
    ข้อความว่าไม่รองรับ/ไม่พร้อมใช้งานอย่างชัดเจน

  </Accordion>
  <Accordion title="ช่องทางที่รองรับเธรด">
    - channel adapter ใด ๆ ที่เปิดเผยความสามารถการผูกเซสชัน/เธรด
    - การรองรับในตัวปัจจุบัน: เธรด/ช่องของ **Discord**, หัวข้อของ **Telegram** (หัวข้อฟอรัมในกลุ่ม/supergroups และหัวข้อ DM)
    - ช่องทาง Plugin สามารถเพิ่มการรองรับผ่านอินเทอร์เฟซการผูกเดียวกัน

  </Accordion>
</AccordionGroup>

## การผูกช่องทางแบบคงอยู่

สำหรับ workflow ที่ไม่ใช่แบบชั่วคราว ให้กำหนดค่าการผูก ACP แบบคงอยู่ใน
รายการระดับบนสุด `bindings[]`

### โมเดลการผูก

<ParamField path="bindings[].type" type='"acp"'>
  ทำเครื่องหมายการผูกบทสนทนา ACP แบบคงอยู่
</ParamField>
<ParamField path="bindings[].match" type="object">
  ระบุบทสนทนาเป้าหมาย รูปแบบตามช่องทาง:

- **ช่อง/เธรด Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **หัวข้อฟอรัม Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/group:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` ควรใช้ `chat_id:*` หรือ `chat_identifier:*` สำหรับการผูกกลุ่มที่เสถียร
- **iMessage DM/group:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` ควรใช้ `chat_id:*` สำหรับการผูกกลุ่มที่เสถียร

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  id ของเอเจนต์ OpenClaw ที่เป็นเจ้าของ
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  override ACP แบบเลือกได้
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  ป้ายกำกับแบบเลือกได้ที่แสดงต่อผู้ปฏิบัติการ
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  ไดเรกทอรีทำงานของ runtime แบบเลือกได้
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  override backend แบบเลือกได้
</ParamField>

### ค่าเริ่มต้น runtime ต่อเอเจนต์

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้น ACP หนึ่งครั้งต่อเอเจนต์:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ลำดับความสำคัญของ override สำหรับเซสชัน ACP ที่ผูกไว้:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. ค่าเริ่มต้น ACP ระดับ global (เช่น `acp.backend`)

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
- ข้อความในช่องหรือหัวข้อนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่กำหนดค่าไว้
- ในการสนทนาที่ผูกไว้ `/new` และ `/reset` จะรีเซ็ตคีย์เซสชัน ACP เดิมในตำแหน่งเดิม
- การผูกชั่วคราวขณะรันไทม์ (เช่น ที่สร้างโดยโฟลว์ thread-focus) ยังคงมีผลในจุดที่มีอยู่
- สำหรับการสปอว์น ACP ข้ามเอเจนต์โดยไม่มี `cwd` ที่ระบุชัดเจน OpenClaw จะสืบทอดเวิร์กสเปซของเอเจนต์เป้าหมายจากการกำหนดค่าเอเจนต์
- พาธเวิร์กสเปซที่สืบทอดมาซึ่งหายไปจะ fallback ไปยัง cwd เริ่มต้นของแบ็กเอนด์ ส่วนความล้มเหลวในการเข้าถึงที่ไม่ได้หายไปจะแสดงเป็นข้อผิดพลาดการสปอว์น

## เริ่มเซสชัน ACP

มีสองวิธีในการเริ่มเซสชัน ACP:

<Tabs>
  <Tab title="From sessions_spawn">
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
    ค่าเริ่มต้นของ `runtime` คือ `subagent` ดังนั้นให้ตั้ง `runtime: "acp"` อย่างชัดเจน
    สำหรับเซสชัน ACP หากละเว้น `agentId` OpenClaw จะใช้
    `acp.defaultAgent` เมื่อมีการกำหนดค่าไว้ `mode: "session"` ต้องใช้
    `thread: true` เพื่อคงการสนทนาที่ผูกไว้แบบถาวร
    </Note>

  </Tab>
  <Tab title="From /acp command">
    ใช้ `/acp spawn` เพื่อให้ผู้ปฏิบัติการควบคุมจากแชตอย่างชัดเจน

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

    ดู [คำสั่งสแลช](/th/tools/slash-commands)

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
  รหัสฮาร์เนสเป้าหมาย ACP จะ fallback ไปที่ `acp.defaultAgent` หากตั้งค่าไว้
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  ขอใช้โฟลว์การผูกเธรดเมื่อรองรับ
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` เป็นแบบครั้งเดียว; `"session"` เป็นแบบถาวร หาก `thread: true` และ
  ละเว้น `mode` OpenClaw อาจตั้งค่าเริ่มต้นเป็นพฤติกรรมแบบถาวรตาม
  พาธรันไทม์ `mode: "session"` ต้องใช้ `thread: true`
</ParamField>
<ParamField path="cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์ที่ร้องขอ (ตรวจสอบความถูกต้องโดยนโยบายแบ็กเอนด์/รันไทม์)
  หากละเว้น การสปอว์น ACP จะสืบทอดเวิร์กสเปซของเอเจนต์เป้าหมาย
  เมื่อมีการกำหนดค่าไว้; พาธที่สืบทอดมาซึ่งหายไปจะ fallback ไปยังค่าเริ่มต้น
  ของแบ็กเอนด์ ส่วนข้อผิดพลาดการเข้าถึงจริงจะถูกส่งกลับ
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับที่ผู้ปฏิบัติการเห็น ซึ่งใช้ในข้อความเซสชัน/แบนเนอร์
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ดำเนินเซสชัน ACP ที่มีอยู่ต่อแทนการสร้างเซสชันใหม่
  เอเจนต์จะเล่นประวัติการสนทนาซ้ำผ่าน `session/load` ต้องใช้
  `runtime: "acp"`
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` สตรีมสรุปความคืบหน้าการรัน ACP เริ่มต้นกลับไปยัง
  เซสชันผู้ร้องขอเป็นเหตุการณ์ระบบ การตอบกลับที่ยอมรับรวมถึง
  `streamLogPath` ที่ชี้ไปยังล็อก JSONL เฉพาะเซสชัน
  (`<sessionId>.acp-stream.jsonl`) ซึ่งคุณสามารถ tail เพื่อติดตามประวัติการ relay ทั้งหมดได้
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ยกเลิกเทิร์นย่อย ACP หลังจาก N วินาที `0` จะคงเทิร์นไว้บน
  พาธไม่มีหมดเวลาของ Gateway ค่าเดียวกันนี้ถูกใช้กับการรัน Gateway
  และรันไทม์ ACP เพื่อไม่ให้ฮาร์เนสที่ค้าง/โควตาหมด
  ครองเลนของเอเจนต์แม่อย่างไม่มีกำหนด
</ParamField>
<ParamField path="model" type="string">
  การ override โมเดลอย่างชัดเจนสำหรับเซสชันย่อย ACP การสปอว์น Codex ACP
  จะ normalize ref ของ OpenClaw Codex เช่น `openai-codex/gpt-5.4` ไปเป็นการกำหนดค่าเริ่มต้น
  ของ Codex ACP ก่อน `session/new`; รูปแบบสแลช เช่น
  `openai-codex/gpt-5.4/high` จะตั้งค่าความพยายามด้าน reasoning ของ Codex ACP ด้วย
  ฮาร์เนสอื่นต้องประกาศ ACP `models` และรองรับ
  `session/set_model`; มิฉะนั้น OpenClaw/acpx จะล้มเหลวอย่างชัดเจนแทนที่จะ
  fallback ไปยังค่าเริ่มต้นของเอเจนต์เป้าหมายอย่างเงียบ ๆ
</ParamField>
<ParamField path="thinking" type="string">
  ความพยายามด้าน thinking/reasoning ที่ระบุชัดเจน สำหรับ Codex ACP, `minimal` จะแมปเป็น
  ความพยายามต่ำ, `low`/`medium`/`high`/`xhigh` จะแมปโดยตรง และ `off`
  จะละเว้นการ override การเริ่มต้น reasoning-effort
</ParamField>

## โหมดการผูกและเธรดของการสปอว์น

<Tabs>
  <Tab title="--bind here|off">
    | โหมด   | พฤติกรรม                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | ผูกการสนทนาที่ใช้งานอยู่ปัจจุบันไว้ในตำแหน่งเดิม; ล้มเหลวหากไม่มีการสนทนาที่ใช้งานอยู่ |
    | `off`  | ไม่สร้างการผูกกับการสนทนาปัจจุบัน                          |

    หมายเหตุ:

    - `--bind here` เป็นพาธผู้ปฏิบัติการที่ง่ายที่สุดสำหรับ "ทำให้ช่องหรือแชตนี้รองรับโดย Codex"
    - `--bind here` ไม่สร้างเธรดย่อย
    - `--bind here` ใช้ได้เฉพาะในช่องที่เปิดเผยการรองรับการผูกการสนทนาปัจจุบัน
    - ไม่สามารถรวม `--bind` และ `--thread` ในการเรียก `/acp spawn` เดียวกันได้

  </Tab>
  <Tab title="--thread auto|here|off">
    | โหมด   | พฤติกรรม                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | ในเธรดที่ใช้งานอยู่: ผูกเธรดนั้น นอกเธรด: สร้าง/ผูกเธรดย่อยเมื่อรองรับ |
    | `here` | ต้องมีเธรดที่ใช้งานอยู่ปัจจุบัน; ล้มเหลวหากไม่ได้อยู่ในเธรดหนึ่ง                                                  |
    | `off`  | ไม่มีการผูก เซสชันเริ่มแบบไม่ถูกผูก                                                                 |

    หมายเหตุ:

    - บนพื้นผิวการผูกที่ไม่ใช่เธรด พฤติกรรมเริ่มต้นมีผลเทียบเท่ากับ `off`
    - การสปอว์นแบบผูกเธรดต้องมีการรองรับนโยบายช่อง:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - ใช้ `--bind here` เมื่อคุณต้องการปักหมุดการสนทนาปัจจุบันโดยไม่สร้างเธรดย่อย

  </Tab>
</Tabs>

## โมเดลการส่งมอบ

เซสชัน ACP อาจเป็นได้ทั้งเวิร์กสเปซแบบโต้ตอบหรือ
งานเบื้องหลังที่เอเจนต์แม่เป็นเจ้าของ พาธการส่งมอบขึ้นอยู่กับรูปแบบนั้น

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    เซสชันแบบโต้ตอบมีไว้เพื่อสนทนาต่อบนพื้นผิวแชตที่มองเห็นได้:

    - `/acp spawn ... --bind here` ผูกการสนทนาปัจจุบันกับเซสชัน ACP
    - `/acp spawn ... --thread ...` ผูกเธรด/หัวข้อของช่องกับเซสชัน ACP
    - `bindings[].type="acp"` ที่กำหนดค่าแบบถาวรจะกำหนดเส้นทางการสนทนาที่ตรงกันไปยังเซสชัน ACP เดิม

    ข้อความติดตามผลในการสนทนาที่ผูกไว้จะถูกกำหนดเส้นทางตรงไปยัง
    เซสชัน ACP และผลลัพธ์ ACP จะถูกส่งกลับไปยัง
    ช่อง/เธรด/หัวข้อเดียวกันนั้น

    สิ่งที่ OpenClaw ส่งไปยังฮาร์เนส:

    - การติดตามผลปกติที่ผูกไว้จะถูกส่งเป็นข้อความพรอมป์ พร้อมไฟล์แนบเฉพาะเมื่อฮาร์เนส/แบ็กเอนด์รองรับเท่านั้น
    - คำสั่งจัดการ `/acp` และคำสั่ง Gateway ภายในเครื่องจะถูกดักไว้ก่อน dispatch ไปยัง ACP
    - เหตุการณ์การเสร็จสิ้นที่รันไทม์สร้างขึ้นจะถูกทำให้เป็นรูปธรรมตามเป้าหมาย เอเจนต์ OpenClaw จะได้รับ envelope runtime-context ภายในของ OpenClaw; ฮาร์เนส ACP ภายนอกจะได้รับพรอมป์ปกติพร้อมผลลัพธ์ย่อยและคำสั่ง envelope ดิบ `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ไม่ควรถูกส่งไปยังฮาร์เนสภายนอกหรือถูกเก็บไว้เป็นข้อความ transcript ผู้ใช้ของ ACP
    - รายการ transcript ของ ACP ใช้ข้อความทริกเกอร์ที่ผู้ใช้เห็นหรือพรอมป์การเสร็จสิ้นแบบปกติ เมทาดาทาเหตุการณ์ภายในยังคงเป็นโครงสร้างใน OpenClaw เมื่อเป็นไปได้ และไม่ถูกปฏิบัติเป็นเนื้อหาแชตที่ผู้ใช้เขียน

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    เซสชัน ACP แบบครั้งเดียวที่ถูกสปอว์นโดยการรันของเอเจนต์อื่นเป็นลูกเบื้องหลัง
    คล้ายกับ sub-agents:

    - เอเจนต์แม่ขอให้ทำงานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
    - เซสชันลูกทำงานในเซสชันฮาร์เนส ACP ของตัวเอง
    - เทิร์นลูกทำงานบนเลนเบื้องหลังเดียวกับที่ใช้โดยการสปอว์น sub-agent แบบเนทีฟ ดังนั้นฮาร์เนส ACP ที่ช้าจะไม่บล็อกงาน main-session อื่นที่ไม่เกี่ยวข้อง
    - รายงานการเสร็จสิ้นจะกลับผ่านพาธประกาศ task-completion OpenClaw แปลงเมทาดาทาการเสร็จสิ้นภายในเป็นพรอมป์ ACP แบบปกติก่อนส่งไปยังฮาร์เนสภายนอก เพื่อไม่ให้ฮาร์เนสเห็นตัวทำเครื่องหมายบริบทรันไทม์เฉพาะ OpenClaw
    - เอเจนต์แม่จะเขียนผลลัพธ์ลูกใหม่ด้วยเสียงผู้ช่วยปกติเมื่อการตอบกลับที่ผู้ใช้เห็นมีประโยชน์

    **อย่า** ปฏิบัติต่อพาธนี้เป็นแชตแบบ peer-to-peer ระหว่างเอเจนต์แม่
    และลูก ลูกมีช่องทางการเสร็จสิ้นกลับไปยัง
    เอเจนต์แม่อยู่แล้ว

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` สามารถกำหนดเป้าหมายไปยังเซสชันอื่นหลังสปอว์นได้ สำหรับเซสชัน
    peer ปกติ OpenClaw ใช้พาธติดตามผลแบบ agent-to-agent (A2A)
    หลังจากฉีดข้อความแล้ว:

    - รอการตอบกลับของเซสชันเป้าหมาย
    - อนุญาตให้ผู้ร้องขอและเป้าหมายแลกเปลี่ยนเทิร์นติดตามผลในจำนวนจำกัดตามต้องการ
    - ขอให้เป้าหมายสร้างข้อความประกาศ
    - ส่งประกาศนั้นไปยังช่องหรือเธรดที่มองเห็นได้

    พาธ A2A นั้นเป็น fallback สำหรับการส่งแบบ peer เมื่อผู้ส่งต้องการ
    การติดตามผลที่มองเห็นได้ พาธนี้ยังคงเปิดใช้เมื่อเซสชันที่ไม่เกี่ยวข้องสามารถ
    เห็นและส่งข้อความถึงเป้าหมาย ACP ได้ เช่น ภายใต้การตั้งค่า
    `tools.sessions.visibility` แบบกว้าง

    OpenClaw จะข้ามการติดตามผล A2A เฉพาะเมื่อผู้ร้องขอเป็น
    เอเจนต์แม่ของลูก ACP แบบครั้งเดียวที่เอเจนต์แม่เป็นเจ้าของเอง ในกรณีนั้น
    การรัน A2A ทับบน task completion อาจปลุกเอเจนต์แม่ด้วย
    ผลลัพธ์ของลูก ส่งต่อคำตอบของเอเจนต์แม่กลับเข้าไปในลูก และ
    สร้างลูปสะท้อนระหว่างแม่/ลูก ผลลัพธ์ `sessions_send` จะรายงาน
    `delivery.status="skipped"` สำหรับกรณีลูกที่เป็นเจ้าของนั้น เพราะ
    พาธการเสร็จสิ้นรับผิดชอบผลลัพธ์อยู่แล้ว

  </Accordion>
  <Accordion title="Resume an existing session">
    ใช้ `resumeSessionId` เพื่อดำเนินเซสชัน ACP ก่อนหน้าต่อแทนการ
    เริ่มใหม่ เอเจนต์จะเล่นประวัติการสนทนาซ้ำผ่าน
    `session/load` จึงดำเนินต่อด้วยบริบทเต็มของสิ่งที่เกิดขึ้นก่อนหน้า

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    กรณีใช้งานทั่วไป:

    - ส่งต่อเซสชัน Codex จากแล็ปท็อปไปยังโทรศัพท์ของคุณ - บอกเอเจนต์ให้ดำเนินต่อจากจุดที่คุณค้างไว้
    - ดำเนินเซสชันเขียนโค้ดที่คุณเริ่มแบบโต้ตอบใน CLI ต่อ โดยตอนนี้ทำแบบ headless ผ่านเอเจนต์ของคุณ
    - รับช่วงงานที่ถูกขัดจังหวะจากการรีสตาร์ท gateway หรือ idle timeout

    หมายเหตุ:

    - `resumeSessionId` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; รันไทม์ sub-agent เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `streamTo` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; รันไทม์ sub-agent เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `resumeSessionId` เป็นรหัสดำเนินต่อของ ACP/ฮาร์เนสเฉพาะโฮสต์ ไม่ใช่คีย์เซสชันช่องของ OpenClaw; OpenClaw ยังตรวจสอบนโยบายการสปอว์น ACP และนโยบายเอเจนต์เป้าหมายก่อน dispatch ขณะที่แบ็กเอนด์ ACP หรือฮาร์เนสเป็นเจ้าของการอนุญาตสำหรับการโหลดรหัส upstream นั้น
    - `resumeSessionId` กู้คืนประวัติการสนทนา ACP upstream; `thread` และ `mode` ยังคงใช้ตามปกติกับเซสชัน OpenClaw ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังต้องใช้ `thread: true`
    - เอเจนต์เป้าหมายต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
    - หากไม่พบรหัสเซสชัน การสปอว์นจะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน - ไม่มีการ fallback อย่างเงียบ ๆ ไปยังเซสชันใหม่

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    หลังจาก deploy gateway ให้รันการตรวจสอบสดแบบ end-to-end แทนการ
    เชื่อถือ unit test:

    1. ตรวจสอบเวอร์ชันและคอมมิตของ Gateway ที่ปรับใช้แล้วบนโฮสต์เป้าหมาย
    2. เปิดเซสชันบริดจ์ ACPX ชั่วคราวไปยังเอเจนต์จริง
    3. ขอให้เอเจนต์นั้นเรียก `sessions_spawn` ด้วย `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` และงาน `Reply with exactly LIVE-ACP-SPAWN-OK`
    4. ตรวจสอบ `accepted=yes`, `childSessionKey` จริง และไม่มีข้อผิดพลาดจากตัวตรวจสอบความถูกต้อง
    5. ล้างเซสชันบริดจ์ชั่วคราว

    ให้ gate คงอยู่ที่ `mode: "run"` และข้าม `streamTo: "parent"` -
    `mode: "session"` แบบผูกกับเธรดและเส้นทาง stream-relay เป็น
    รอบการตรวจสอบการผสานรวมที่สมบูรณ์กว่าแยกต่างหาก

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้กับ sandbox

ขณะนี้เซสชัน ACP ทำงานบนรันไทม์ของโฮสต์ **ไม่ใช่** ภายใน
sandbox ของ OpenClaw

<Warning>
**ขอบเขตความปลอดภัย:**

- harness ภายนอกสามารถอ่าน/เขียนได้ตามสิทธิ์ CLI ของตัวเองและ `cwd` ที่เลือก
- นโยบาย sandbox ของ OpenClaw **ไม่** ครอบการดำเนินการ harness ของ ACP
- OpenClaw ยังคงบังคับใช้ feature gate ของ ACP, เอเจนต์ที่อนุญาต, ความเป็นเจ้าของเซสชัน, การผูกช่องทาง และนโยบายการส่งมอบของ Gateway
- ใช้ `runtime: "subagent"` สำหรับงานแบบ OpenClaw-native ที่บังคับใช้ sandbox

</Warning>

ข้อจำกัดปัจจุบัน:

- หากเซสชันผู้ร้องขออยู่ใน sandbox การ spawn ACP จะถูกบล็อกทั้งสำหรับ `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
- `sessions_spawn` ด้วย `runtime: "acp"` ไม่รองรับ `sandbox: "require"`

## การระบุเป้าหมายเซสชัน

การดำเนินการ `/acp` ส่วนใหญ่รับเป้าหมายเซสชันที่ไม่บังคับ (`session-key`,
`session-id` หรือ `session-label`)

**ลำดับการระบุ:**

1. อาร์กิวเมนต์เป้าหมายที่ระบุชัดเจน (หรือ `--session` สำหรับ `/acp steer`)
   - ลองใช้ key
   - จากนั้นใช้ session id ที่มีรูปแบบ UUID
   - จากนั้นใช้ label
2. การผูกเธรดปัจจุบัน (หากการสนทนา/เธรดนี้ผูกกับเซสชัน ACP)
3. ทางเลือกสำรองเป็นเซสชันผู้ร้องขอปัจจุบัน

ทั้งการผูกการสนทนาปัจจุบันและการผูกเธรดต่างมีส่วนใน
ขั้นตอนที่ 2

หากระบุเป้าหมายไม่ได้ OpenClaw จะส่งคืนข้อผิดพลาดที่ชัดเจน
(`Unable to resolve session target: ...`)

## การควบคุม ACP

| คำสั่ง              | สิ่งที่ทำ                                              | ตัวอย่าง                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้างเซสชัน ACP; ผูกกับปัจจุบันหรือผูกเธรดได้ตามต้องการ | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิก turn ที่กำลังดำเนินอยู่สำหรับเซสชันเป้าหมาย | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่ง steer ไปยังเซสชันที่กำลังทำงาน | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิดเซสชันและยกเลิกการผูกเป้าหมายเธรด | `/acp close`                                                  |
| `/acp status`        | แสดง backend, mode, state, ตัวเลือกรันไทม์, ความสามารถ | `/acp status`                                                 |
| `/acp set-mode`      | ตั้งค่าโหมดรันไทม์สำหรับเซสชันเป้าหมาย | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนตัวเลือก config รันไทม์ทั่วไป | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่าการ override ไดเรกทอรีทำงานของรันไทม์ | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้งค่าโปรไฟล์นโยบายการอนุมัติ | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้งค่า timeout ของรันไทม์ (วินาที) | `/acp timeout 120`                                            |
| `/acp model`         | ตั้งค่าการ override โมเดลรันไทม์ | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบการ override ตัวเลือกรันไทม์ของเซสชัน | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการเซสชัน ACP ล่าสุดจาก store | `/acp sessions`                                               |
| `/acp doctor`        | สุขภาพ backend, ความสามารถ, วิธีแก้ไขที่ดำเนินการได้ | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอนติดตั้งและเปิดใช้งานที่กำหนดได้แน่นอน | `/acp install`                                                |

`/acp status` แสดงตัวเลือกรันไทม์ที่มีผล พร้อมตัวระบุเซสชันระดับรันไทม์และ
ระดับ backend ข้อผิดพลาดจากการควบคุมที่ไม่รองรับจะแสดง
อย่างชัดเจนเมื่อ backend ไม่มีความสามารถนั้น `/acp sessions` อ่าน
store สำหรับเซสชันที่ผูกอยู่ปัจจุบันหรือเซสชันผู้ร้องขอ; โทเค็นเป้าหมาย
(`session-key`, `session-id` หรือ `session-label`) จะถูกระบุผ่าน
การค้นพบเซสชันของ Gateway รวมถึง root ของ `session.store`
แบบกำหนดเองต่อเอเจนต์

### การแมปตัวเลือกรันไทม์

`/acp` มีคำสั่งอำนวยความสะดวกและตัวตั้งค่าทั่วไป การดำเนินการที่เทียบเท่า:

| คำสั่ง                      | แมปไปยัง                              | หมายเหตุ                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | key config รันไทม์ `model`           | สำหรับ Codex ACP, OpenClaw จะปรับ `openai-codex/<model>` ให้เป็น model id ของ adapter และแมป suffix reasoning แบบ slash เช่น `openai-codex/gpt-5.4/high` ไปยัง `reasoning_effort` |
| `/acp set thinking <level>`  | key config รันไทม์ `thinking`        | สำหรับ Codex ACP, OpenClaw จะส่ง `reasoning_effort` ที่สอดคล้องกันเมื่อ adapter รองรับ                                                                                             |
| `/acp permissions <profile>` | key config รันไทม์ `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | key config รันไทม์ `timeout`         | -                                                                                                                                                                              |
| `/acp cwd <path>`            | การ override cwd ของรันไทม์                 | อัปเดตโดยตรง                                                                                                                                                                 |
| `/acp set <key> <value>`     | ทั่วไป                              | `key=cwd` ใช้เส้นทาง override ของ cwd                                                                                                                                          |
| `/acp reset-options`         | ล้างการ override รันไทม์ทั้งหมด         | -                                                                                                                                                                              |

## acpx harness, การตั้งค่า Plugin และสิทธิ์

สำหรับการกำหนดค่า acpx harness (alias ของ Claude Code / Codex / Gemini CLI),
บริดจ์ MCP ของ plugin-tools และ OpenClaw-tools และโหมดสิทธิ์
ACP ดูที่
[เอเจนต์ ACP - การตั้งค่า](/th/tools/acp-agents-setup)

## การแก้ไขปัญหา

| อาการ                                                                       | สาเหตุที่เป็นไปได้                                                                                                     | วิธีแก้ไข                                                                                                                                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin แบ็กเอนด์หายไป ถูกปิดใช้งาน หรือถูกบล็อกโดย `plugins.allow`                                                   | ติดตั้งและเปิดใช้งาน Plugin แบ็กเอนด์ ใส่ `acpx` ใน `plugins.allow` เมื่อตั้งค่า allowlist นั้นไว้ จากนั้นเรียกใช้ `/acp doctor`                                      |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ถูกปิดใช้งานทั่วระบบ                                                                                              | ตั้งค่า `acp.enabled=true`                                                                                                                                               |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | การ dispatch อัตโนมัติจากข้อความเธรดปกติถูกปิดใช้งาน                                                                  | ตั้งค่า `acp.dispatch.enabled=true` เพื่อกลับมาใช้การกำหนดเส้นทางเธรดอัตโนมัติอีกครั้ง; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงใช้งานได้        |
| `ACP agent "<id>" is not allowed by policy`                                 | เอเจนต์ไม่อยู่ใน allowlist                                                                                             | ใช้ `agentId` ที่อนุญาต หรืออัปเดต `acp.allowedAgents`                                                                                                                   |
| `/acp doctor` รายงานว่าแบ็กเอนด์ยังไม่พร้อมหลังเริ่มต้นระบบทันที          | Plugin แบ็กเอนด์หายไป ถูกปิดใช้งาน ถูกบล็อกโดยนโยบาย allow/deny หรือไฟล์ปฏิบัติการที่กำหนดค่าไว้ไม่พร้อมใช้งาน     | ติดตั้ง/เปิดใช้งาน Plugin แบ็กเอนด์ เรียกใช้ `/acp doctor` อีกครั้ง และตรวจสอบข้อผิดพลาดของการติดตั้งแบ็กเอนด์หรือนโยบายหากยังคงไม่สมบูรณ์                         |
| ไม่พบคำสั่งฮาร์เนส                                                         | Adapter CLI ไม่ได้ติดตั้ง, Plugin ภายนอกหายไป หรือการดึง `npx` ในการเรียกใช้ครั้งแรกสำหรับอะแดปเตอร์ที่ไม่ใช่ Codex ล้มเหลว | เรียกใช้ `/acp doctor`, ติดตั้ง/อุ่นเครื่องอะแดปเตอร์บนโฮสต์ Gateway หรือกำหนดค่าคำสั่งเอเจนต์ acpx อย่างชัดเจน                                                       |
| ฮาร์เนสแจ้งว่าไม่พบโมเดล                                                   | id โมเดลถูกต้องสำหรับผู้ให้บริการ/ฮาร์เนสอื่น แต่ไม่ใช่เป้าหมาย ACP นี้                                             | ใช้โมเดลที่ฮาร์เนสนั้นแสดงไว้ กำหนดค่าโมเดลในฮาร์เนส หรือละเว้นการ override                                                                                             |
| ข้อผิดพลาดการยืนยันตัวตนของผู้จำหน่ายจากฮาร์เนส                            | OpenClaw ปกติ แต่ CLI/ผู้ให้บริการเป้าหมายยังไม่ได้เข้าสู่ระบบ                                                       | เข้าสู่ระบบหรือระบุคีย์ผู้ให้บริการที่จำเป็นในสภาพแวดล้อมของโฮสต์ Gateway                                                                                                |
| `Unable to resolve session target: ...`                                     | โทเค็น key/id/label ไม่ถูกต้อง                                                                                        | เรียกใช้ `/acp sessions`, คัดลอก key/label ที่ตรงกันทุกตัวอักษร แล้วลองอีกครั้ง                                                                                          |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มีการสนทนาที่ใช้งานอยู่และผูกได้                                                              | ย้ายไปยังแชต/ช่องเป้าหมายแล้วลองอีกครั้ง หรือใช้การ spawn แบบไม่ผูก                                                                                                      |
| `Conversation bindings are unavailable for <channel>.`                      | อะแดปเตอร์ไม่มีความสามารถการผูก ACP กับการสนทนาปัจจุบัน                                                              | ใช้ `/acp spawn ... --thread ...` เมื่อรองรับ กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปยังช่องที่รองรับ                                                               |
| `--thread here requires running /acp spawn inside an active ... thread`     | ใช้ `--thread here` นอกบริบทเธรด                                                                                       | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off`                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | ผู้ใช้อื่นเป็นเจ้าของเป้าหมายการผูกที่ใช้งานอยู่                                                                      | ผูกใหม่ในฐานะเจ้าของ หรือใช้การสนทนาหรือเธรดอื่น                                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | อะแดปเตอร์ไม่มีความสามารถการผูกเธรด                                                                                   | ใช้ `--thread off` หรือย้ายไปยังอะแดปเตอร์/ช่องที่รองรับ                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | runtime ACP อยู่ฝั่งโฮสต์; เซสชันผู้ร้องขออยู่ใน sandbox                                                             | ใช้ `runtime="subagent"` จากเซสชันที่อยู่ใน sandbox หรือเรียก ACP spawn จากเซสชันที่ไม่ได้อยู่ใน sandbox                                                                |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | มีการขอ `sandbox="require"` สำหรับ runtime ACP                                                                        | ใช้ `runtime="subagent"` สำหรับการ sandbox ที่จำเป็น หรือใช้ ACP กับ `sandbox="inherit"` จากเซสชันที่ไม่ได้อยู่ใน sandbox                                               |
| `Cannot apply --model ... did not advertise model support`                  | ฮาร์เนสเป้าหมายไม่ได้เปิดเผยการสลับโมเดล ACP แบบทั่วไป                                                               | ใช้ฮาร์เนสที่ประกาศ ACP `models`/`session/set_model`, ใช้ refs โมเดล Codex ACP หรือกำหนดค่าโมเดลในฮาร์เนสโดยตรงหากมีแฟล็กเริ่มต้นของตัวเอง                           |
| เมทาดาทา ACP หายไปสำหรับเซสชันที่ผูกไว้                                    | เมทาดาทาเซสชัน ACP เก่าหรือถูกลบ                                                                                      | สร้างใหม่ด้วย `/acp spawn` จากนั้นผูกใหม่/โฟกัสเธรด                                                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` บล็อกการเขียน/exec ในเซสชัน ACP แบบ non-interactive                                                 | ตั้งค่า `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ต gateway ดู [การกำหนดค่าสิทธิ์](/th/tools/acp-agents-setup#permission-configuration) |
| เซสชัน ACP ล้มเหลวตั้งแต่ต้นโดยมีเอาต์พุตน้อยมาก                           | พรอมต์สิทธิ์ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions`                                                  | ตรวจสอบบันทึก gateway สำหรับ `AcpRuntimeError` หากต้องการสิทธิ์เต็ม ให้ตั้งค่า `permissionMode=approve-all`; หากต้องการลดระดับอย่างนุ่มนวล ให้ตั้งค่า `nonInteractivePermissions=deny` |
| เซสชัน ACP ค้างไม่สิ้นสุดหลังทำงานเสร็จ                                    | โปรเซสฮาร์เนสเสร็จสิ้นแล้ว แต่เซสชัน ACP ไม่ได้รายงานว่าเสร็จสิ้น                                                    | อัปเดต OpenClaw; การล้างข้อมูล acpx ปัจจุบันจะเก็บกวาดโปรเซส wrapper และอะแดปเตอร์เก่าที่ OpenClaw เป็นเจ้าของเมื่อปิดและเมื่อ Gateway เริ่มต้น                       |
| ฮาร์เนสเห็น `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                         | ซองเหตุการณ์ภายในรั่วข้ามขอบเขต ACP                                                                                   | อัปเดต OpenClaw แล้วเรียก flow การทำงานให้เสร็จสิ้นอีกครั้ง; ฮาร์เนสภายนอกควรได้รับเฉพาะพรอมต์การทำงานเสร็จสิ้นแบบข้อความธรรมดา                                      |

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP - การตั้งค่า](/th/tools/acp-agents-setup)
- [ส่งไปยังเอเจนต์](/th/tools/agent-send)
- [แบ็กเอนด์ CLI](/th/gateway/cli-backends)
- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [เครื่องมือ sandbox แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (โหมด bridge)](/th/cli/acp)
- [เอเจนต์ย่อย](/th/tools/subagents)
