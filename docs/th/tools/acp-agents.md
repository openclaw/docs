---
read_when:
    - การรันฮาร์เนสการเขียนโค้ดผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับการสนทนาบนช่องทางการรับส่งข้อความ
    - การผูกการสนทนาในช่องทางข้อความเข้ากับเซสชัน ACP แบบถาวร
    - การแก้ไขปัญหาแบ็กเอนด์ ACP การเชื่อมต่อ Plugin หรือการส่งผลลัพธ์ให้เสร็จสมบูรณ์
    - ใช้งานคำสั่ง /acp จากแชต
sidebarTitle: ACP agents
summary: เรียกใช้ฮาร์เนสการเขียนโค้ดภายนอก (Claude Code, Cursor, Gemini CLI, Codex ACP แบบระบุชัดเจน, OpenClaw ACP, OpenCode) ผ่านแบ็กเอนด์ ACP
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-06-30T14:35:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

เซสชัน [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
ช่วยให้ OpenClaw เรียกใช้ฮาร์เนสเขียนโค้ดภายนอก (เช่น Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI และฮาร์เนส
ACPX อื่นที่รองรับ) ผ่าน Plugin แบ็กเอนด์ ACP

การ spawn เซสชัน ACP แต่ละครั้งจะถูกติดตามเป็น [งานพื้นหลัง](/th/automation/tasks)

<Note>
**ACP คือเส้นทางฮาร์เนสภายนอก ไม่ใช่เส้นทาง Codex เริ่มต้น** Plugin
native Codex app-server เป็นเจ้าของตัวควบคุม `/codex ...` และรันไทม์ฝังตัว
`openai/gpt-*` เริ่มต้นสำหรับรอบการทำงานของเอเจนต์ ส่วน ACP เป็นเจ้าของ
ตัวควบคุม `/acp ...` และเซสชัน `sessions_spawn({ runtime: "acp" })`

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็นไคลเอนต์ MCP ภายนอก
โดยตรงกับบทสนทนาช่อง OpenClaw ที่มีอยู่ ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน ACP
</Note>

## ฉันควรใช้หน้าใด?

| คุณต้องการ…                                                                                    | ใช้สิ่งนี้                              | หมายเหตุ                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ผูกหรือควบคุม Codex ในบทสนทนาปัจจุบัน                                               | `/codex bind`, `/codex threads`       | เส้นทาง native Codex app-server เมื่อเปิดใช้ Plugin `codex`; รวมถึงการตอบกลับแชทที่ผูกไว้, การส่งต่อรูปภาพ, model/fast/permissions, stop และตัวควบคุม steer โดย ACP เป็น fallback ที่ระบุชัดเจน |
| เรียกใช้ Claude Code, Gemini CLI, Codex ACP ที่ระบุชัดเจน หรือฮาร์เนสภายนอกอื่น _ผ่าน_ OpenClaw | หน้านี้                             | เซสชันที่ผูกกับแชท, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, งานพื้นหลัง, ตัวควบคุมรันไทม์                                                                                   |
| เปิดเผยเซสชัน OpenClaw Gateway _เป็น_ เซิร์ฟเวอร์ ACP สำหรับเอดิเตอร์หรือไคลเอนต์                   | [`openclaw acp`](/th/cli/acp)            | โหมดบริดจ์ IDE/ไคลเอนต์คุย ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                                                                                            |
| นำ AI CLI ภายในเครื่องกลับมาใช้เป็นโมเดล fallback แบบข้อความเท่านั้น                                              | [แบ็กเอนด์ CLI](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw ไม่มีตัวควบคุม ACP ไม่มีรันไทม์ฮาร์เนส                                                                                                                               |

## ใช้งานได้ทันทีหรือไม่?

ได้ หลังติดตั้ง Plugin รันไทม์ ACP อย่างเป็นทางการ:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ซอร์ส checkout สามารถใช้ Plugin workspace ภายในเครื่อง `extensions/acpx` ได้หลังจาก
`pnpm install` เรียกใช้ `/acp doctor` เพื่อตรวจความพร้อม

OpenClaw จะสอนเอเจนต์เกี่ยวกับการ spawn ACP เฉพาะเมื่อ ACP **ใช้งานได้จริง**
เท่านั้น: ต้องเปิดใช้ ACP, dispatch ต้องไม่ถูกปิด, เซสชันปัจจุบันต้องไม่ถูกบล็อกด้วย sandbox
และต้องโหลดแบ็กเอนด์รันไทม์แล้ว หากเงื่อนไขเหล่านี้ไม่ครบ Skills ของ Plugin ACP และ
คำแนะนำ ACP ของ `sessions_spawn` จะยังถูกซ่อนไว้ เพื่อไม่ให้เอเจนต์แนะนำแบ็กเอนด์ที่ใช้งานไม่ได้

<AccordionGroup>
  <Accordion title="ข้อควรระวังในการรันครั้งแรก">
    - หากตั้งค่า `plugins.allow` ไว้ นั่นคือรายการ Plugin ที่จำกัดและ **ต้อง** รวม `acpx`; มิฉะนั้นแบ็กเอนด์ ACP ที่ติดตั้งจะถูกบล็อกโดยตั้งใจ และ `/acp doctor` จะรายงานรายการ allowlist ที่หายไป
    - อะแดปเตอร์ Codex ACP ถูกจัดเตรียมไว้พร้อมกับ Plugin `acpx` และจะเปิดใช้ภายในเครื่องเมื่อเป็นไปได้
    - Codex ACP ทำงานด้วย `CODEX_HOME` ที่แยกออกมา; OpenClaw คัดลอกรายการโปรเจกต์ที่เชื่อถือได้พร้อม config การกำหนดเส้นทางโมเดล/ผู้ให้บริการที่ปลอดภัยจาก config Codex ของโฮสต์ ส่วน auth, notifications และ hooks จะยังอยู่ใน config ของโฮสต์
    - อะแดปเตอร์ฮาร์เนสเป้าหมายอื่นอาจยังถูกดึงมาเมื่อต้องการด้วย `npx` ในครั้งแรกที่คุณใช้
    - auth ของผู้ขายยังต้องมีอยู่บนโฮสต์สำหรับฮาร์เนสนั้น
    - หากโฮสต์ไม่มี npm หรือการเข้าถึงเครือข่าย การดึงอะแดปเตอร์ในการรันครั้งแรกจะล้มเหลวจนกว่าจะ pre-warm แคชหรือติดตั้งอะแดปเตอร์ด้วยวิธีอื่น

  </Accordion>
  <Accordion title="ข้อกำหนดเบื้องต้นของรันไทม์">
    ACP เปิดโปรเซสฮาร์เนสภายนอกจริง OpenClaw เป็นเจ้าของการกำหนดเส้นทาง,
    สถานะงานพื้นหลัง, การส่งมอบ, bindings และนโยบาย ส่วนฮาร์เนส
    เป็นเจ้าของการเข้าสู่ระบบผู้ให้บริการ, แคตตาล็อกโมเดล, พฤติกรรมของระบบไฟล์ และ
    เครื่องมือ native ของตนเอง

    ก่อนโทษ OpenClaw ให้ตรวจสอบว่า:

    - `/acp doctor` รายงานแบ็กเอนด์ที่เปิดใช้และสมบูรณ์
    - id เป้าหมายได้รับอนุญาตโดย `acp.allowedAgents` เมื่อมีการตั้ง allowlist นั้น
    - คำสั่งฮาร์เนสสามารถเริ่มบนโฮสต์ Gateway ได้
    - มี auth ของผู้ให้บริการสำหรับฮาร์เนสนั้น (`claude`, `codex`, `gemini`, `opencode`, `droid` ฯลฯ)
    - โมเดลที่เลือกมีอยู่สำหรับฮาร์เนสนั้น - id โมเดลไม่สามารถใช้ข้ามฮาร์เนสได้
    - `cwd` ที่ร้องขอมีอยู่และเข้าถึงได้ หรือไม่ต้องระบุ `cwd` แล้วให้แบ็กเอนด์ใช้ค่าเริ่มต้นของตน
    - โหมดสิทธิ์ตรงกับงาน เซสชันที่ไม่โต้ตอบไม่สามารถคลิก prompt สิทธิ์ native ได้ ดังนั้นการรันเขียนโค้ดที่เน้น write/exec มักต้องใช้โปรไฟล์สิทธิ์ ACPX ที่สามารถดำเนินต่อแบบ headless ได้

  </Accordion>
</AccordionGroup>

เครื่องมือ Plugin ของ OpenClaw และเครื่องมือ OpenClaw ในตัวจะ **ไม่** ถูกเปิดเผยต่อ
ฮาร์เนส ACP โดยค่าเริ่มต้น เปิดใช้บริดจ์ MCP ที่ระบุชัดเจนใน
[เอเจนต์ ACP - การตั้งค่า](/th/tools/acp-agents-setup) เฉพาะเมื่อฮาร์เนส
ควรเรียกเครื่องมือเหล่านั้นโดยตรง

## เป้าหมายฮาร์เนสที่รองรับ

เมื่อใช้แบ็กเอนด์ `acpx` ให้ใช้ id ฮาร์เนสเหล่านี้เป็นเป้าหมาย `/acp spawn <id>`
หรือ `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| id ฮาร์เนส | แบ็กเอนด์ทั่วไป                                | หมายเหตุ                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | อะแดปเตอร์ Claude Code ACP                        | ต้องมี auth ของ Claude Code บนโฮสต์                                              |
| `codex`    | อะแดปเตอร์ Codex ACP                              | fallback ACP ที่ระบุชัดเจนเท่านั้นเมื่อ native `/codex` ไม่พร้อมใช้งานหรือมีการร้องขอ ACP |
| `copilot`  | อะแดปเตอร์ GitHub Copilot ACP                     | ต้องมี auth ของ Copilot CLI/รันไทม์                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Override คำสั่ง acpx หากการติดตั้งภายในเครื่องเปิดเผย ACP entrypoint อื่น    |
| `droid`    | Factory Droid CLI                              | ต้องมี auth ของ Factory/Droid หรือ `FACTORY_API_KEY` ในสภาพแวดล้อมของฮาร์เนส        |
| `gemini`   | อะแดปเตอร์ Gemini CLI ACP                         | ต้องมี auth ของ Gemini CLI หรือการตั้งค่า API key                                          |
| `iflow`    | iFlow CLI                                      | ความพร้อมของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `kilocode` | Kilo Code CLI                                  | ความพร้อมของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `kimi`     | Kimi/Moonshot CLI                              | ต้องมี auth ของ Kimi/Moonshot บนโฮสต์                                            |
| `kiro`     | Kiro CLI                                       | ความพร้อมของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `opencode` | อะแดปเตอร์ OpenCode ACP                           | ต้องมี auth ของ OpenCode CLI/ผู้ให้บริการ                                                |
| `openclaw` | บริดจ์ OpenClaw Gateway ผ่าน `openclaw acp` | ช่วยให้ฮาร์เนสที่รองรับ ACP คุยกลับมายังเซสชัน OpenClaw Gateway                 |
| `qwen`     | Qwen Code / Qwen CLI                           | ต้องมี auth ที่เข้ากันได้กับ Qwen บนโฮสต์                                          |

สามารถกำหนด alias เอเจนต์ acpx แบบกำหนดเองได้ใน acpx เอง แต่นโยบาย OpenClaw
ยังคงตรวจ `acp.allowedAgents` และ mapping
`agents.list[].runtime.acp.agent` ใดๆ ก่อน dispatch

## คู่มือปฏิบัติงานสำหรับโอเปอเรเตอร์

โฟลว์ `/acp` แบบเร็วจากแชท:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` หรือ
    `/acp spawn codex --bind here` แบบระบุชัดเจน
  </Step>
  <Step title="ทำงาน">
    ดำเนินต่อในบทสนทนาหรือเธรดที่ผูกไว้ (หรือระบุคีย์เซสชันโดยตรง)
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
    โดยไม่แทนที่บริบท: `/acp steer tighten logging and continue`
  </Step>
  <Step title="หยุด">
    `/acp cancel` (รอบปัจจุบัน) หรือ `/acp close` (เซสชัน + bindings)
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="รายละเอียดวงจรชีวิต">
    - Spawn จะสร้างหรือกลับมาใช้เซสชันรันไทม์ ACP ต่อ บันทึกเมตาดาต้า ACP ในที่เก็บเซสชัน OpenClaw และอาจสร้างงานพื้นหลังเมื่อการรันเป็นแบบ parent-owned
    - เซสชัน ACP แบบ parent-owned จะถือเป็นงานพื้นหลังแม้เมื่อเซสชันรันไทม์เป็นแบบ persistent; การเสร็จสิ้นและการส่งมอบข้าม surface จะผ่านตัวแจ้งเตือนงาน parent แทนที่จะทำตัวเหมือนเซสชันแชทปกติที่ผู้ใช้เห็น
    - การบำรุงรักษางานจะปิดเซสชัน ACP one-shot แบบ parent-owned ที่อยู่ในสถานะ terminal หรือ orphaned เซสชัน ACP แบบ persistent จะถูกเก็บไว้ตราบใดที่ยังมี binding บทสนทนาที่ใช้งานอยู่; เซสชัน persistent ที่ค้างโดยไม่มี binding ที่ใช้งานอยู่จะถูกปิดเพื่อไม่ให้กลับมาใช้ต่ออย่างเงียบๆ หลังงานเจ้าของเสร็จแล้วหรือระเบียนงานหายไป
    - ข้อความติดตามผลที่ผูกไว้จะส่งตรงไปยังเซสชัน ACP จนกว่า binding จะถูกปิด, unfocus, reset หรือหมดอายุ
    - คำสั่ง Gateway จะอยู่ภายในเครื่อง `/acp ...`, `/status` และ `/unfocus` จะไม่ถูกส่งเป็นข้อความ prompt ปกติไปยังฮาร์เนส ACP ที่ผูกไว้
    - `cancel` จะยกเลิกรอบที่ทำงานอยู่เมื่อแบ็กเอนด์รองรับการยกเลิก; คำสั่งนี้ไม่ลบ binding หรือเมตาดาต้าเซสชัน
    - `close` จบเซสชัน ACP จากมุมมองของ OpenClaw และลบ binding ฮาร์เนสอาจยังเก็บประวัติ upstream ของตนเองไว้หากรองรับการ resume
    - Plugin acpx จะล้าง process tree ของ wrapper และอะแดปเตอร์ที่ OpenClaw เป็นเจ้าของหลัง `close` และเก็บกวาด orphan ACPX ที่ OpenClaw เป็นเจ้าของและค้างอยู่ระหว่างการเริ่มต้น Gateway
    - worker รันไทม์ที่ไม่ได้ใช้งานมีสิทธิ์ถูกล้างหลัง `acp.runtime.ttlMinutes`; เมตาดาต้าเซสชันที่เก็บไว้ยังพร้อมใช้งานสำหรับ `/acp sessions`

  </Accordion>
  <Accordion title="กฎการกำหนดเส้นทาง native Codex">
    ทริกเกอร์ภาษาธรรมชาติที่ควรกำหนดเส้นทางไปยัง **Plugin native Codex**
    เมื่อเปิดใช้:

    - "ผูกช่อง Discord นี้กับ Codex"
    - "แนบแชทนี้กับเธรด Codex `<id>`"
    - "แสดงเธรด Codex แล้วผูกอันนี้"

    การผูกบทสนทนา Codex แบบเนทีฟคือเส้นทางควบคุมแชทเริ่มต้น
    เครื่องมือแบบไดนามิกของ OpenClaw ยังคงทำงานผ่าน OpenClaw ขณะที่
    เครื่องมือเนทีฟของ Codex เช่น shell/apply-patch ทำงานภายใน Codex
    สำหรับเหตุการณ์เครื่องมือเนทีฟของ Codex, OpenClaw จะแทรกรีเลย์ฮุกเนทีฟรายเทิร์น
    เพื่อให้ฮุกของ Plugin สามารถบล็อก `before_tool_call`, สังเกต
    `after_tool_call`, และกำหนดเส้นทางเหตุการณ์ `PermissionRequest` ของ Codex
    ผ่านการอนุมัติของ OpenClaw ฮุก `Stop` ของ Codex จะถูกรีเลย์ไปยัง
    `before_agent_finalize` ของ OpenClaw ซึ่ง Plugin สามารถขอให้โมเดลทำงานอีกหนึ่งรอบ
    ก่อนที่ Codex จะสรุปคำตอบ รีเลย์นี้ยังคงตั้งใจให้เป็นแบบอนุรักษนิยม:
    มันไม่แก้ไขอาร์กิวเมนต์เครื่องมือเนทีฟของ Codex
    หรือเขียนเรคอร์ดเธรดของ Codex ใหม่ ใช้ ACP แบบชัดเจนเท่านั้น
    เมื่อคุณต้องการโมเดลรันไทม์/เซสชันของ ACP ขอบเขตการรองรับ Codex แบบฝัง
    มีเอกสารอยู่ใน
    [สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness-runtime#v1-support-contract)

  </Accordion>
  <Accordion title="ชีตสรุปการเลือกโมเดล / ผู้ให้บริการ / รันไทม์">
    - refs โมเดล Codex แบบเดิม - เส้นทางโมเดล OAuth/การสมัครใช้งาน Codex แบบเดิมที่ doctor ซ่อมแซม
    - `openai/*` - รันไทม์เนทีฟ Codex app-server แบบฝังสำหรับเทิร์นเอเจนต์ OpenAI
    - `/codex ...` - การควบคุมบทสนทนา Codex แบบเนทีฟ
    - `/acp ...` หรือ `runtime: "acp"` - การควบคุม ACP/acpx แบบชัดเจน

  </Accordion>
  <Accordion title="ทริกเกอร์ภาษาธรรมชาติสำหรับการกำหนดเส้นทาง ACP">
    ทริกเกอร์ที่ควรกำหนดเส้นทางไปยังรันไทม์ ACP:

    - "เรียกใช้งานสิ่งนี้เป็นเซสชัน Claude Code ACP แบบครั้งเดียว แล้วสรุปผลลัพธ์"
    - "ใช้ Gemini CLI สำหรับงานนี้ในเธรด แล้วคงการติดตามผลไว้ในเธรดเดียวกัน"
    - "เรียก Codex ผ่าน ACP ในเธรดเบื้องหลัง"

    OpenClaw เลือก `runtime: "acp"`, แก้ค่า `agentId` ของ harness,
    ผูกกับบทสนทนาหรือเธรดปัจจุบันเมื่อรองรับ, และ
    กำหนดเส้นทางการติดตามผลไปยังเซสชันนั้นจนกว่าจะปิด/หมดอายุ Codex จะ
    ใช้เส้นทางนี้ก็ต่อเมื่อระบุ ACP/acpx อย่างชัดเจน หรือ Plugin Codex แบบเนทีฟ
    ไม่พร้อมใช้งานสำหรับการดำเนินการที่ร้องขอ

    สำหรับ `sessions_spawn`, จะประกาศ `runtime: "acp"` เฉพาะเมื่อ ACP
    เปิดใช้งานอยู่, ผู้ร้องขอไม่ได้อยู่ในแซนด์บ็อกซ์, และโหลดแบ็กเอนด์รันไทม์ ACP
    แล้ว `acp.dispatch.enabled=false` จะหยุดการส่งต่อเธรด ACP อัตโนมัติชั่วคราว
    แต่จะไม่ซ่อนหรือบล็อกการเรียก
    `sessions_spawn({ runtime: "acp" })` แบบชัดเจน เป้าหมายคือ id ของ ACP harness เช่น `codex`,
    `claude`, `droid`, `gemini`, หรือ `opencode` อย่าส่ง id เอเจนต์ config ปกติของ
    OpenClaw จาก `agents_list` เว้นแต่รายการนั้นจะถูก
    กำหนดค่าไว้อย่างชัดเจนด้วย `agents.list[].runtime.type="acp"`;
    มิฉะนั้นให้ใช้รันไทม์ซับเอเจนต์เริ่มต้น เมื่อเอเจนต์ OpenClaw
    ถูกกำหนดค่าด้วย `runtime.type="acp"`, OpenClaw จะใช้
    `runtime.acp.agent` เป็น id ของ harness พื้นฐาน

  </Accordion>
</AccordionGroup>

## ACP เทียบกับซับเอเจนต์

ใช้ ACP เมื่อคุณต้องการรันไทม์ harness ภายนอก ใช้ **Codex
app-server แบบเนทีฟ** สำหรับการผูก/ควบคุมบทสนทนา Codex เมื่อเปิดใช้งาน Plugin `codex`
ใช้ **ซับเอเจนต์** เมื่อคุณต้องการรันแบบมอบหมายงานที่เป็นเนทีฟของ OpenClaw

| พื้นที่          | เซสชัน ACP                           | การรันซับเอเจนต์                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| รันไทม์       | Plugin แบ็กเอนด์ ACP (เช่น acpx) | รันไทม์ซับเอเจนต์เนทีฟของ OpenClaw  |
| คีย์เซสชัน   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| คำสั่งหลัก | `/acp ...`                            | `/subagents ...`                   |
| เครื่องมือ spawn    | `sessions_spawn` พร้อม `runtime:"acp"` | `sessions_spawn` (รันไทม์เริ่มต้น) |

ดูเพิ่มเติมที่ [ซับเอเจนต์](/th/tools/subagents)

## วิธีที่ ACP เรียกใช้ Claude Code

สำหรับ Claude Code ผ่าน ACP, สแต็กคือ:

1. แผงควบคุมเซสชัน ACP ของ OpenClaw
2. Plugin รันไทม์ `@openclaw/acpx` อย่างเป็นทางการ
3. อะแดปเตอร์ Claude ACP
4. กลไกรันไทม์/เซสชันฝั่ง Claude

ACP Claude คือ **เซสชัน harness** ที่มีการควบคุม ACP, การกลับมาใช้เซสชันต่อ,
การติดตามงานเบื้องหลัง, และการผูกบทสนทนา/เธรดแบบไม่บังคับ

แบ็กเอนด์ CLI เป็นรันไทม์สำรอง local แบบข้อความเท่านั้นที่แยกต่างหาก - ดู
[แบ็กเอนด์ CLI](/th/gateway/cli-backends)

สำหรับผู้ปฏิบัติการ กฎเชิงปฏิบัติคือ:

- **ต้องการ `/acp spawn`, เซสชันที่ผูกได้, การควบคุมรันไทม์, หรืองาน harness แบบถาวรใช่ไหม** ใช้ ACP
- **ต้องการตัวสำรองข้อความ local แบบง่ายผ่าน CLI ดิบใช่ไหม** ใช้แบ็กเอนด์ CLI

## เซสชันที่ถูกผูก

### แบบจำลองทางความคิด

- **พื้นผิวแชท** - ที่ที่ผู้คนคุยต่อกัน (ช่อง Discord, หัวข้อ Telegram, แชท iMessage)
- **เซสชัน ACP** - สถานะรันไทม์ Codex/Claude/Gemini ที่คงทนซึ่ง OpenClaw กำหนดเส้นทางไปหา
- **เธรด/หัวข้อย่อย** - พื้นผิวการส่งข้อความเพิ่มเติมแบบไม่บังคับที่สร้างโดย `--thread ...` เท่านั้น
- **เวิร์กสเปซรันไทม์** - ตำแหน่งระบบไฟล์ (`cwd`, repo checkout, เวิร์กสเปซแบ็กเอนด์) ที่ harness ทำงาน เป็นอิสระจากพื้นผิวแชท

### การผูกกับบทสนทนาปัจจุบัน

`/acp spawn <harness> --bind here` ปักหมุดบทสนทนาปัจจุบันเข้ากับ
เซสชัน ACP ที่ spawn ขึ้นมา - ไม่มีเธรดย่อย, ใช้พื้นผิวแชทเดิม OpenClaw ยังคง
เป็นเจ้าของการขนส่ง, การยืนยันตัวตน, ความปลอดภัย, และการส่งมอบ ข้อความติดตามผลใน
บทสนทนานั้นจะถูกกำหนดเส้นทางไปยังเซสชันเดียวกัน; `/new` และ `/reset` รีเซ็ต
เซสชันตรงที่เดิม; `/acp close` ลบการผูก

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
    - `--bind here` ใช้ได้เฉพาะบนช่องที่ประกาศความสามารถในการผูกกับบทสนทนาปัจจุบัน; มิฉะนั้น OpenClaw จะส่งข้อความไม่รองรับที่ชัดเจนกลับมา การผูกจะคงอยู่ข้ามการรีสตาร์ท Gateway
    - บน Discord, `spawnSessions` ควบคุมการสร้างเธรดย่อยสำหรับ `--thread auto|here` - ไม่ใช่ `--bind here`
    - หากคุณ spawn ไปยังเอเจนต์ ACP อื่นโดยไม่มี `--cwd`, OpenClaw จะรับช่วงเวิร์กสเปซของ **เอเจนต์เป้าหมาย** เป็นค่าเริ่มต้น พาธที่รับช่วงมาแต่หายไป (`ENOENT`/`ENOTDIR`) จะถอยกลับไปใช้ค่าเริ่มต้นของแบ็กเอนด์; ข้อผิดพลาดการเข้าถึงอื่น ๆ (เช่น `EACCES`) จะแสดงเป็นข้อผิดพลาดการ spawn
    - คำสั่งจัดการ Gateway ยังคงเป็น local ในบทสนทนาที่ถูกผูก - คำสั่ง `/acp ...` จะถูกจัดการโดย OpenClaw แม้เมื่อข้อความติดตามผลปกติถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ถูกผูก; `/status` และ `/unfocus` ก็ยังคงเป็น local ทุกครั้งที่เปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

  </Accordion>
  <Accordion title="เซสชันที่ผูกกับเธรด">
    เมื่อเปิดใช้งานการผูกเธรดสำหรับอะแดปเตอร์ช่อง:

    - OpenClaw ผูกเธรดกับเซสชัน ACP เป้าหมาย
    - ข้อความติดตามผลในเธรดนั้นถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ถูกผูก
    - เอาต์พุต ACP ถูกส่งกลับไปยังเธรดเดียวกัน
    - การ unfocus/close/archive/idle-timeout หรือการหมดอายุ max-age จะลบการผูก
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, และ `/unfocus` เป็นคำสั่ง Gateway ไม่ใช่พรอมป์ไปยัง ACP harness

    แฟล็กฟีเจอร์ที่จำเป็นสำหรับ ACP ที่ผูกกับเธรด:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` เปิดอยู่เป็นค่าเริ่มต้น (ตั้งเป็น `false` เพื่อหยุดการส่งต่อเธรด ACP อัตโนมัติชั่วคราว; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงทำงาน)
    - เปิดใช้งานการ spawn เซสชันเธรดของอะแดปเตอร์ช่อง (ค่าเริ่มต้น: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    การรองรับการผูกเธรดขึ้นอยู่กับอะแดปเตอร์ หากอะแดปเตอร์ช่องที่ใช้งานอยู่
    ไม่รองรับการผูกเธรด, OpenClaw จะส่งข้อความไม่รองรับ/ไม่พร้อมใช้งาน
    ที่ชัดเจนกลับมา

  </Accordion>
  <Accordion title="ช่องที่รองรับเธรด">
    - อะแดปเตอร์ช่องใด ๆ ที่เปิดเผยความสามารถในการผูกเซสชัน/เธรด
    - การรองรับในตัวปัจจุบัน: เธรด/ช่อง **Discord**, หัวข้อ **Telegram** (หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ปและหัวข้อ DM)
    - ช่องของ Plugin สามารถเพิ่มการรองรับผ่านอินเทอร์เฟซการผูกเดียวกัน

  </Accordion>
</AccordionGroup>

## การผูกช่องแบบถาวร

สำหรับเวิร์กโฟลว์ที่ไม่ใช่แบบชั่วคราว ให้กำหนดค่าการผูก ACP แบบถาวรใน
รายการ `bindings[]` ระดับบนสุด

### โมเดลการผูก

<ParamField path="bindings[].type" type='"acp"'>
  ทำเครื่องหมายการผูกบทสนทนา ACP แบบถาวร
</ParamField>
<ParamField path="bindings[].match" type="object">
  ระบุบทสนทนาเป้าหมาย รูปทรงตามช่อง:

- **ช่อง/เธรด Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **ช่อง/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"` ควรใช้ id Slack ที่เสถียร; การผูกช่องจะจับคู่กับการตอบกลับภายในเธรดของช่องนั้นด้วย
- **หัวข้อฟอรัม Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/กลุ่ม WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"` ใช้หมายเลข E.164 เช่น `+15555550123` สำหรับแชทโดยตรง และ JID กลุ่ม WhatsApp เช่น `120363424282127706@g.us` สำหรับกลุ่ม
- **DM/กลุ่ม iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` ควรใช้ `chat_id:*` สำหรับการผูกกลุ่มที่เสถียร

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  id เอเจนต์ OpenClaw ที่เป็นเจ้าของ
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  การ override ACP แบบไม่บังคับ
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  ป้ายกำกับที่แสดงต่อผู้ปฏิบัติการแบบไม่บังคับ
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์แบบไม่บังคับ
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  การ override แบ็กเอนด์แบบไม่บังคับ
</ParamField>

### ค่าเริ่มต้นรันไทม์ต่อเอเจนต์

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้น ACP หนึ่งครั้งต่อเอเจนต์:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ลำดับความสำคัญของการ override สำหรับเซสชัน ACP ที่ถูกผูก:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. ค่าเริ่มต้น ACP ส่วนกลาง (เช่น `acp.backend`)

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

### ลักษณะการทำงาน

- OpenClaw ตรวจสอบให้แน่ใจว่าเซสชัน ACP ที่กำหนดค่าไว้มีอยู่หลังการรับเข้าที่เฉพาะเจาะจงตามช่องทางและก่อนใช้งาน
- ข้อความในช่องทาง หัวข้อ หรือแชตนั้นจะถูกส่งต่อไปยังเซสชัน ACP ที่กำหนดค่าไว้
- การผูก ACP ที่กำหนดค่าไว้เป็นเจ้าของเส้นทางเซสชันของตัวเอง การกระจายออกอากาศของช่องทางไม่แทนที่เซสชัน ACP ที่กำหนดค่าไว้สำหรับการผูกที่ตรงกัน
- ในการสนทนาที่ผูกไว้ `/new` และ `/reset` จะรีเซ็ตคีย์เซสชัน ACP เดิมในตำแหน่งเดิม
- การผูกรันไทม์ชั่วคราว (เช่น ที่สร้างโดยโฟลว์โฟกัสเธรด) ยังคงมีผลเมื่อมีอยู่
- สำหรับการ spawn ACP ข้ามเอเจนต์ที่ไม่มี `cwd` ชัดเจน OpenClaw จะสืบทอดเวิร์กสเปซของเอเจนต์เป้าหมายจากการกำหนดค่าเอเจนต์
- พาธเวิร์กสเปซที่สืบทอดแล้วหายไปจะถอยกลับไปใช้ cwd เริ่มต้นของแบ็กเอนด์ ส่วนความล้มเหลวในการเข้าถึงที่ไม่ได้หายไปจะแสดงเป็นข้อผิดพลาดการ spawn

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
    `runtime` มีค่าเริ่มต้นเป็น `subagent` ดังนั้นให้ตั้งค่า `runtime: "acp"` อย่างชัดเจน
    สำหรับเซสชัน ACP หากละเว้น `agentId` OpenClaw จะใช้
    `acp.defaultAgent` เมื่อมีการกำหนดค่าไว้ `mode: "session"` ต้องใช้
    `thread: true` เพื่อคงการสนทนาที่ผูกไว้แบบถาวร
    </Note>

  </Tab>
  <Tab title="From /acp command">
    ใช้ `/acp spawn` เพื่อให้ผู้ปฏิบัติงานควบคุมจากแชตอย่างชัดเจน

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    แฟล็กหลัก:

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
  id ของ harness เป้าหมาย ACP ถอยกลับไปใช้ `acp.defaultAgent` หากตั้งค่าไว้
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  ขอใช้โฟลว์การผูกเธรดเมื่อรองรับ
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` เป็นแบบครั้งเดียว ส่วน `"session"` เป็นแบบถาวร หาก `thread: true` และ
  ละเว้น `mode` OpenClaw อาจตั้งค่าเริ่มต้นเป็นพฤติกรรมแบบถาวรตาม
  พาธรันไทม์ `mode: "session"` ต้องใช้ `thread: true`
</ParamField>
<ParamField path="cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์ที่ร้องขอ (ตรวจสอบความถูกต้องโดยนโยบาย
  แบ็กเอนด์/รันไทม์) หากละเว้น การ spawn ACP จะสืบทอดเวิร์กสเปซของเอเจนต์เป้าหมาย
  เมื่อมีการกำหนดค่าไว้ พาธที่สืบทอดแล้วหายไปจะถอยกลับไปใช้ค่าเริ่มต้นของแบ็กเอนด์
  ขณะที่ข้อผิดพลาดการเข้าถึงจริงจะถูกส่งคืน
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับที่แสดงต่อผู้ปฏิบัติงานซึ่งใช้ในข้อความเซสชัน/แบนเนอร์
</ParamField>
<ParamField path="resumeSessionId" type="string">
  กลับมาใช้เซสชัน ACP ที่มีอยู่แทนการสร้างใหม่ เอเจนต์จะเล่นประวัติการสนทนาซ้ำผ่าน `session/load`
  ต้องใช้ `runtime: "acp"`
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` สตรีมสรุปความคืบหน้าการรัน ACP เริ่มต้นกลับไปยังเซสชันผู้ร้องขอ
  เป็นเหตุการณ์ระบบ การตอบสนองที่ยอมรับได้รวมถึง `streamLogPath` ที่ชี้ไปยังบันทึก JSONL
  ตามขอบเขตเซสชัน (`<sessionId>.acp-stream.jsonl`) ที่คุณสามารถ tail เพื่อดูประวัติการส่งต่อทั้งหมด
  สตรีมความคืบหน้าของพาเรนต์จะแสดงคำบรรยายของผู้ช่วยและความคืบหน้าสถานะ ACP
  โดยค่าเริ่มต้น เว้นแต่ `streaming.progress.commentary=false` Discord ยังตั้งค่าเริ่มต้น
  พรีวิวของพาเรนต์เป็นโหมดความคืบหน้าเมื่อไม่มีการกำหนดค่าโหมดสตรีมไว้ด้วย ความคืบหน้าสถานะ
  ยังคงเคารพ `acp.stream.tagVisibility` ดังนั้นแท็กเช่น `plan`
  จะยังคงถูกซ่อนไว้ เว้นแต่เปิดใช้อย่างชัดเจน
</ParamField>

การรัน ACP `sessions_spawn` ใช้ `agents.defaults.subagents.runTimeoutSeconds` เป็น
ขีดจำกัดเทิร์นลูกเริ่มต้น เครื่องมือนี้ไม่ยอมรับการแทนที่ไทม์เอาต์แบบรายครั้ง

<ParamField path="model" type="string">
  การแทนที่โมเดลอย่างชัดเจนสำหรับเซสชันลูก ACP การ spawn Codex ACP
  จะทำให้ ref ของ OpenAI เช่น `openai/gpt-5.4` เป็นปกติไปเป็นการกำหนดค่าเริ่มต้น
  ของ Codex ACP ก่อน `session/new`; รูปแบบ Slash เช่น `openai/gpt-5.4/high`
  ยังตั้งค่าความพยายามการให้เหตุผลของ Codex ACP ด้วย
  เมื่อละเว้น `sessions_spawn({ runtime: "acp" })` จะใช้ค่าเริ่มต้นโมเดล
  ของเอเจนต์ย่อยที่มีอยู่ (`agents.defaults.subagents.model` หรือ
  `agents.list[].subagents.model`) เมื่อกำหนดค่าไว้ มิฉะนั้นจะให้
  harness ACP ใช้โมเดลเริ่มต้นของตัวเอง
  harness อื่นต้องประกาศ ACP `models` และรองรับ
  `session/set_model`; มิฉะนั้น OpenClaw/acpx จะล้มเหลวอย่างชัดเจนแทนที่จะ
  ถอยกลับไปใช้ค่าเริ่มต้นของเอเจนต์เป้าหมายอย่างเงียบ ๆ
</ParamField>
<ParamField path="thinking" type="string">
  ความพยายามการคิด/การให้เหตุผลอย่างชัดเจน สำหรับ Codex ACP, `minimal` จะแมปไปยัง
  ความพยายามต่ำ, `low`/`medium`/`high`/`xhigh` จะแมปโดยตรง และ `off`
  จะละเว้นการแทนที่การเริ่มต้น reasoning-effort
  เมื่อละเว้น การ spawn ACP จะใช้ค่าเริ่มต้นการคิดของเอเจนต์ย่อยที่มีอยู่และ
  `agents.defaults.models["provider/model"].params.thinking` ต่อโมเดล
  สำหรับโมเดลที่เลือก
</ParamField>

## โหมดการผูกและเธรดของการ spawn

<Tabs>
  <Tab title="--bind here|off">
    | โหมด   | ลักษณะการทำงาน                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | ผูกการสนทนาที่ใช้งานอยู่ปัจจุบันในตำแหน่งเดิม ล้มเหลวหากไม่มีการสนทนาที่ใช้งานอยู่ |
    | `off`  | ไม่สร้างการผูกการสนทนาปัจจุบัน                          |

    หมายเหตุ:

    - `--bind here` เป็นพาธผู้ปฏิบัติงานที่ง่ายที่สุดสำหรับ "ทำให้ช่องทางหรือแชตนี้มี Codex รองรับ"
    - `--bind here` ไม่สร้างเธรดลูก
    - `--bind here` ใช้ได้เฉพาะบนช่องทางที่เปิดเผยการรองรับการผูกการสนทนาปัจจุบัน
    - `--bind` และ `--thread` ไม่สามารถใช้ร่วมกันในการเรียก `/acp spawn` เดียวกัน

  </Tab>
  <Tab title="--thread auto|here|off">
    | โหมด   | ลักษณะการทำงาน                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | ในเธรดที่ใช้งานอยู่: ผูกเธรดนั้น นอกเธรด: สร้าง/ผูกเธรดลูกเมื่อรองรับ |
    | `here` | ต้องมีเธรดที่ใช้งานอยู่ปัจจุบัน ล้มเหลวหากไม่ได้อยู่ในเธรดหนึ่ง                                                  |
    | `off`  | ไม่มีการผูก เซสชันเริ่มแบบไม่ผูก                                                                 |

    หมายเหตุ:

    - บนพื้นผิวการผูกที่ไม่ใช่เธรด พฤติกรรมเริ่มต้นเท่ากับ `off` โดยผลลัพธ์
    - การ spawn ที่ผูกกับเธรดต้องรองรับโดยนโยบายช่องทาง:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - ใช้ `--bind here` เมื่อคุณต้องการปักหมุดการสนทนาปัจจุบันโดยไม่สร้างเธรดลูก

  </Tab>
</Tabs>

## โมเดลการส่งมอบ

เซสชัน ACP อาจเป็นเวิร์กสเปซแบบโต้ตอบหรือ
งานเบื้องหลังที่พาเรนต์เป็นเจ้าของ พาธการส่งมอบขึ้นอยู่กับรูปแบบนั้น

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    เซสชันแบบโต้ตอบมีไว้เพื่อสนทนาต่อบนพื้นผิวแชตที่มองเห็นได้:

    - `/acp spawn ... --bind here` ผูกการสนทนาปัจจุบันกับเซสชัน ACP
    - `/acp spawn ... --thread ...` ผูกเธรด/หัวข้อของช่องทางกับเซสชัน ACP
    - `bindings[].type="acp"` แบบถาวรที่กำหนดค่าไว้จะส่งต่อการสนทนาที่ตรงกันไปยังเซสชัน ACP เดิม

    ข้อความติดตามผลในการสนทนาที่ผูกไว้จะถูกส่งตรงไปยัง
    เซสชัน ACP และเอาต์พุต ACP จะถูกส่งกลับไปยัง
    ช่องทาง/เธรด/หัวข้อเดิมนั้น

    สิ่งที่ OpenClaw ส่งไปยัง harness:

    - การติดตามผลแบบผูกตามปกติจะถูกส่งเป็นข้อความพรอมป์ พร้อมไฟล์แนบเฉพาะเมื่อ harness/แบ็กเอนด์รองรับ
    - คำสั่งจัดการ `/acp` และคำสั่ง Gateway ในเครื่องจะถูกสกัดก่อนส่งต่อไปยัง ACP
    - เหตุการณ์เสร็จสิ้นที่รันไทม์สร้างขึ้นจะถูก materialize ตามเป้าหมาย เอเจนต์ OpenClaw จะได้รับ envelope runtime-context ภายในของ OpenClaw ส่วน harness ACP ภายนอกจะได้รับพรอมป์ธรรมดาพร้อมผลลัพธ์ลูกและคำสั่ง envelope ดิบ `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ไม่ควรถูกส่งไปยัง harness ภายนอกหรือคงอยู่เป็นข้อความถอดความผู้ใช้ ACP
    - รายการถอดความ ACP ใช้ข้อความ trigger ที่ผู้ใช้มองเห็นหรือพรอมป์เสร็จสิ้นแบบธรรมดา เมตาดาต้าเหตุการณ์ภายในยังคงมีโครงสร้างใน OpenClaw เท่าที่เป็นไปได้ และไม่ถูกถือเป็นเนื้อหาแชตที่ผู้ใช้เขียน

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    เซสชัน ACP แบบครั้งเดียวที่ถูก spawn โดยการรันของเอเจนต์อื่นเป็นลูกเบื้องหลัง
    คล้ายกับเอเจนต์ย่อย:

    - พาเรนต์ขอให้ทำงานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
    - ลูกจะรันในเซสชัน harness ACP ของตัวเอง
    - เทิร์นลูกจะรันบนเลนเบื้องหลังเดียวกับที่ใช้โดยการ spawn เอเจนต์ย่อยแบบเนทีฟ ดังนั้น harness ACP ที่ช้าจะไม่บล็อกงานของเซสชันหลักที่ไม่เกี่ยวข้อง
    - รายงานการเสร็จสิ้นกลับผ่านพาธประกาศการทำงานเสร็จ OpenClaw แปลงเมตาดาต้าการเสร็จสิ้นภายในเป็นพรอมป์ ACP ธรรมดาก่อนส่งไปยัง harness ภายนอก ดังนั้น harness จะไม่เห็นมาร์กเกอร์บริบทรันไทม์เฉพาะ OpenClaw
    - พาเรนต์เขียนผลลัพธ์ลูกใหม่ด้วยเสียงผู้ช่วยตามปกติเมื่อการตอบกลับที่ผู้ใช้เห็นมีประโยชน์

    อย่าถือว่าพาธนี้เป็นแชตแบบเพียร์ทูเพียร์ระหว่างพาเรนต์
    และลูก ลูกมีช่องทางการเสร็จสิ้นกลับไปยัง
    พาเรนต์อยู่แล้ว

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` สามารถกำหนดเป้าหมายไปยังเซสชันอื่นหลังการ spawn สำหรับเซสชัน
    เพียร์ตามปกติ OpenClaw ใช้พาธติดตามผลแบบ agent-to-agent (A2A)
    หลังจากแทรกข้อความ:

    - รอการตอบกลับของเซสชันเป้าหมาย
    - อนุญาตให้ผู้ร้องขอและเป้าหมายแลกเปลี่ยนเทิร์นติดตามผลในจำนวนที่จำกัดได้ตามต้องการ
    - ขอให้เป้าหมายสร้างข้อความประกาศ
    - ส่งประกาศนั้นไปยังช่องทางหรือเธรดที่มองเห็นได้

    พาธ A2A นั้นเป็น fallback สำหรับการส่งแบบเพียร์เมื่อผู้ส่งต้องการ
    การติดตามผลที่มองเห็นได้ พาธนี้ยังคงเปิดใช้งานเมื่อเซสชันที่ไม่เกี่ยวข้องสามารถ
    เห็นและส่งข้อความถึงเป้าหมาย ACP ได้ เช่น ภายใต้การตั้งค่า
    `tools.sessions.visibility` แบบกว้าง

    OpenClaw จะข้ามการติดตามผล A2A เฉพาะเมื่อผู้ร้องขอเป็น
    พาเรนต์ของ ACP child แบบ one-shot ที่พาเรนต์ของตนเองเป็นเจ้าของ ในกรณีนั้น
    การเรียกใช้ A2A ซ้อนบนการทำงานของ task ที่เสร็จแล้วอาจปลุกพาเรนต์ด้วย
    ผลลัพธ์ของ child, ส่งต่อคำตอบของพาเรนต์กลับเข้าไปใน child, และ
    สร้างลูปสะท้อนพาเรนต์/child ได้ ผลลัพธ์ `sessions_send` รายงาน
    `delivery.status="skipped"` สำหรับกรณี owned-child นั้น เพราะเส้นทาง
    completion รับผิดชอบผลลัพธ์อยู่แล้ว

  </Accordion>
  <Accordion title="กลับมาใช้ session ที่มีอยู่ต่อ">
    ใช้ `resumeSessionId` เพื่อดำเนินการต่อจาก ACP session ก่อนหน้าแทนการ
    เริ่มใหม่ agent จะเล่นซ้ำประวัติการสนทนาผ่าน
    `session/load` จึงกลับมาทำงานต่อด้วยบริบทเต็มของสิ่งที่เกิดขึ้นก่อนหน้า

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    กรณีใช้งานทั่วไป:

    - ส่งต่อ Codex session จากแล็ปท็อปไปยังโทรศัพท์ของคุณ - บอก agent ให้ทำต่อจากจุดที่คุณค้างไว้
    - ดำเนิน coding session ที่คุณเริ่มแบบโต้ตอบใน CLI ต่อ โดยตอนนี้ทำแบบ headless ผ่าน agent ของคุณ
    - กลับมาทำงานที่ถูกขัดจังหวะจากการรีสตาร์ต gateway หรือ idle timeout

    หมายเหตุ:

    - `resumeSessionId` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; runtime sub-agent เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `streamTo` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; runtime sub-agent เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `resumeSessionId` คือ id สำหรับ resume ของ ACP/harness แบบ host-local ไม่ใช่คีย์ session ของช่องทาง OpenClaw; OpenClaw ยังคงตรวจสอบนโยบายการ spawn ของ ACP และนโยบาย target agent ก่อน dispatch ขณะที่ backend หรือ harness ของ ACP เป็นเจ้าของการอนุญาตสำหรับการโหลด upstream id นั้น
    - `resumeSessionId` กู้คืนประวัติการสนทนา ACP ฝั่ง upstream; `thread` และ `mode` ยังใช้ตามปกติกับ OpenClaw session ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังคงต้องใช้ `thread: true`
    - target agent ต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
    - หากไม่พบ session id การ spawn จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน - ไม่มีการ fallback แบบเงียบไปยัง session ใหม่

  </Accordion>
  <Accordion title="การทดสอบ smoke หลัง deploy">
    หลัง deploy gateway ให้รันการตรวจสอบ end-to-end แบบ live แทนการ
    เชื่อถือ unit test:

    1. ตรวจสอบเวอร์ชัน gateway และ commit ที่ deploy แล้วบน host เป้าหมาย
    2. เปิด ACPX bridge session ชั่วคราวไปยัง agent แบบ live
    3. ขอให้ agent นั้นเรียก `sessions_spawn` ด้วย `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, และ task `Reply with exactly LIVE-ACP-SPAWN-OK`
    4. ตรวจสอบ `accepted=yes`, `childSessionKey` จริง, และไม่มีข้อผิดพลาดจาก validator
    5. ล้าง bridge session ชั่วคราว

    คง gate ไว้ที่ `mode: "run"` และข้าม `streamTo: "parent"` -
    `mode: "session"` ที่ผูกกับ thread และเส้นทาง stream-relay เป็นการทดสอบ
    integration pass ที่สมบูรณ์กว่าแยกต่างหาก

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้ของ sandbox

ขณะนี้ ACP sessions ทำงานบน runtime ของ host, **ไม่ใช่** ภายใน
sandbox ของ OpenClaw

<Warning>
**ขอบเขตความปลอดภัย:**

- harness ภายนอกสามารถอ่าน/เขียนได้ตามสิทธิ์ CLI ของตนเองและ `cwd` ที่เลือก
- นโยบาย sandbox ของ OpenClaw **ไม่** ครอบการรัน ACP harness
- OpenClaw ยังคงบังคับใช้ feature gates ของ ACP, agents ที่อนุญาต, ความเป็นเจ้าของ session, การผูกช่องทาง, และนโยบายการส่งของ Gateway
- ใช้ `runtime: "subagent"` สำหรับงานแบบ OpenClaw-native ที่บังคับใช้ sandbox

</Warning>

ข้อจำกัดปัจจุบัน:

- หาก requester session อยู่ใน sandbox การ spawn ของ ACP จะถูกบล็อกทั้งสำหรับ `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
- `sessions_spawn` ที่ใช้ `runtime: "acp"` ไม่รองรับ `sandbox: "require"`

## การ resolve target ของ session

การกระทำ `/acp` ส่วนใหญ่รับ target session แบบเลือกได้ (`session-key`,
`session-id`, หรือ `session-label`)

**ลำดับการ resolve:**

1. อาร์กิวเมนต์ target ที่ระบุชัดเจน (หรือ `--session` สำหรับ `/acp steer`)
   - ลองใช้ key
   - จากนั้นใช้ session id ที่มีรูปแบบ UUID
   - จากนั้นใช้ label
2. การผูก thread ปัจจุบัน (หาก conversation/thread นี้ผูกกับ ACP session)
3. fallback เป็น requester session ปัจจุบัน

ทั้งการผูก current-conversation และการผูก thread เข้าร่วมใน
ขั้นตอนที่ 2

หาก resolve target ไม่ได้ OpenClaw จะส่งคืนข้อผิดพลาดที่ชัดเจน
(`Unable to resolve session target: ...`)

## การควบคุม ACP

| คำสั่ง               | สิ่งที่ทำ                                                   | ตัวอย่าง                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้าง ACP session; เลือก bind ปัจจุบันหรือ bind thread ได้ | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิก turn ที่กำลังดำเนินอยู่สำหรับ target session        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่ง steer ไปยัง session ที่กำลังทำงาน                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิด session และยกเลิกการผูก target ของ thread             | `/acp close`                                                  |
| `/acp status`        | แสดง backend, mode, state, runtime options, capabilities  | `/acp status`                                                 |
| `/acp set-mode`      | ตั้ง runtime mode สำหรับ target session                   | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนตัวเลือก config ของ runtime แบบทั่วไป                 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้ง override working directory ของ runtime               | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้ง approval policy profile                              | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้ง runtime timeout (วินาที)                              | `/acp timeout 120`                                            |
| `/acp model`         | ตั้ง override model ของ runtime                           | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบ override ตัวเลือก runtime ของ session                  | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการ ACP sessions ล่าสุดจาก store                   | `/acp sessions`                                               |
| `/acp doctor`        | สุขภาพ backend, capabilities, และการแก้ไขที่ทำได้จริง       | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอนการติดตั้งและเปิดใช้งานแบบ deterministic       | `/acp install`                                                |

การควบคุม runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model`, และ `reset-options`) ต้องใช้
owner identity จากช่องทางภายนอกและ `operator.admin` จาก Gateway
clients ภายใน ผู้ส่งที่ไม่ใช่เจ้าของแต่ได้รับอนุญาตยังคงใช้ `sessions`, `doctor`,
`install`, และ `help` ได้

`/acp status` แสดงตัวเลือก runtime ที่มีผลจริง พร้อม identifier ของ session
ระดับ runtime และระดับ backend ข้อผิดพลาดของ control ที่ไม่รองรับจะแสดง
อย่างชัดเจนเมื่อ backend ไม่มี capability นั้น `/acp sessions` อ่าน
store สำหรับ session ที่ผูกอยู่ในปัจจุบันหรือ requester session; token ของ target
(`session-key`, `session-id`, หรือ `session-label`) resolve ผ่าน
gateway session discovery รวมถึงราก `session.store` แบบ custom ต่อ agent

### การแมป runtime options

`/acp` มีคำสั่งอำนวยความสะดวกและ setter แบบทั่วไป การดำเนินการ
ที่เทียบเท่า:

| คำสั่ง                       | แมปไปยัง                              | หมายเหตุ                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtime config key `model`           | สำหรับ Codex ACP, OpenClaw normalize `openai/<model>` เป็น adapter model id และแมป suffix reasoning แบบ slash เช่น `openai/gpt-5.4/high` ไปยัง `reasoning_effort`                                         |
| `/acp set thinking <level>`  | canonical option `thinking`          | OpenClaw ส่งค่าที่เทียบเท่าซึ่ง backend โฆษณาไว้เมื่อมี โดยเลือก `thinking` ก่อน จากนั้น `effort`, `reasoning_effort`, หรือ `thought_level` สำหรับ Codex ACP, adapter จะแมปค่าไปยัง `reasoning_effort` |
| `/acp permissions <profile>` | canonical option `permissionProfile` | OpenClaw ส่งค่าที่เทียบเท่าซึ่ง backend โฆษณาไว้เมื่อมี เช่น `approval_policy`, `permission_profile`, `permissions`, หรือ `permission_mode`                                                       |
| `/acp timeout <seconds>`     | canonical option `timeoutSeconds`    | OpenClaw ส่งค่าที่เทียบเท่าซึ่ง backend โฆษณาไว้เมื่อมี เช่น `timeout` หรือ `timeout_seconds`                                                                                                     |
| `/acp cwd <path>`            | runtime cwd override                 | อัปเดตโดยตรง                                                                                                                                                                                             |
| `/acp set <key> <value>`     | generic                              | `key=cwd` ใช้เส้นทาง cwd override                                                                                                                                                                      |
| `/acp reset-options`         | ล้าง runtime overrides ทั้งหมด       | -                                                                                                                                                                                                          |

## acpx harness, การตั้งค่า plugin, และสิทธิ์

สำหรับการกำหนดค่า acpx harness (alias ของ Claude Code / Codex / Gemini CLI),
MCP bridges ของ plugin-tools และ OpenClaw-tools, และโหมดสิทธิ์ของ ACP
ดูที่
[ACP agents - setup](/th/tools/acp-agents-setup)

## การแก้ไขปัญหา

| อาการ                                                                     | สาเหตุที่เป็นไปได้                                                                                                           | วิธีแก้                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin แบ็กเอนด์หายไป ถูกปิดใช้งาน หรือถูกบล็อกโดย `plugins.allow`                                                       | ติดตั้งและเปิดใช้งาน Plugin แบ็กเอนด์ ใส่ `acpx` ใน `plugins.allow` เมื่อมีการตั้งค่ารายการอนุญาตนั้น จากนั้นรัน `/acp doctor`                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ถูกปิดใช้งานทั่วทั้งระบบ                                                                                                 | ตั้งค่า `acp.enabled=true`                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | การส่งต่ออัตโนมัติจากข้อความเธรดปกติถูกปิดใช้งาน                                                               | ตั้งค่า `acp.dispatch.enabled=true` เพื่อกลับมาใช้การกำหนดเส้นทางเธรดอัตโนมัติอีกครั้ง; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงใช้งานได้                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | เอเจนต์ไม่ได้อยู่ในรายการอนุญาต                                                                                                | ใช้ `agentId` ที่อนุญาต หรืออัปเดต `acp.allowedAgents`                                                                                                                     |
| `/acp doctor` รายงานว่าแบ็กเอนด์ไม่พร้อมทันทีหลังเริ่มต้น                 | Plugin แบ็กเอนด์หายไป ถูกปิดใช้งาน ถูกบล็อกโดยนโยบายอนุญาต/ปฏิเสธ หรือไฟล์ปฏิบัติการที่กำหนดค่าไว้ใช้งานไม่ได้        | ติดตั้ง/เปิดใช้งาน Plugin แบ็กเอนด์ รัน `/acp doctor` อีกครั้ง และตรวจสอบข้อผิดพลาดการติดตั้งแบ็กเอนด์หรือนโยบายหากยังคงไม่สมบูรณ์                                           |
| ไม่พบคำสั่งฮาร์เนส                                                   | ยังไม่ได้ติดตั้ง CLI ของอะแดปเตอร์, Plugin ภายนอกหายไป หรือการดึง `npx` ครั้งแรกสำหรับอะแดปเตอร์ที่ไม่ใช่ Codex ล้มเหลว | รัน `/acp doctor`, ติดตั้ง/อุ่นเครื่องอะแดปเตอร์บนโฮสต์ Gateway หรือกำหนดค่าคำสั่งเอเจนต์ acpx อย่างชัดเจน                                                      |
| ฮาร์เนสแจ้งว่าไม่พบโมเดล                                            | รหัสโมเดลถูกต้องสำหรับผู้ให้บริการ/ฮาร์เนสอื่น แต่ไม่ถูกต้องสำหรับเป้าหมาย ACP นี้                                                | ใช้โมเดลที่ฮาร์เนสนั้นแสดงรายการไว้ กำหนดค่าโมเดลในฮาร์เนส หรือไม่ใส่การ override                                                                            |
| ฮาร์เนสแจ้งข้อผิดพลาดการยืนยันตัวตนของผู้ขาย                                          | OpenClaw สมบูรณ์ แต่ CLI/ผู้ให้บริการเป้าหมายยังไม่ได้เข้าสู่ระบบ                                                     | เข้าสู่ระบบหรือระบุคีย์ผู้ให้บริการที่จำเป็นในสภาพแวดล้อมของโฮสต์ Gateway                                                                                             |
| `Unable to resolve session target: ...`                                     | คีย์/รหัส/โทเค็นป้ายกำกับไม่ถูกต้อง                                                                                                | รัน `/acp sessions`, คัดลอกคีย์/ป้ายกำกับที่ตรงกัน แล้วลองอีกครั้ง                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มีการสนทนาที่ใช้งานอยู่และผูกได้                                                            | ย้ายไปยังแชต/ช่องเป้าหมายแล้วลองอีกครั้ง หรือใช้การ spawn แบบไม่ผูก                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | อะแดปเตอร์ไม่มีความสามารถในการผูก ACP กับการสนทนาปัจจุบัน                                                             | ใช้ `/acp spawn ... --thread ...` เมื่อรองรับ กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปยังช่องที่รองรับ                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | ใช้ `--thread here` นอกบริบทเธรด                                                                         | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off`                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | ผู้ใช้อื่นเป็นเจ้าของเป้าหมายการผูกที่ใช้งานอยู่                                                                           | ผูกใหม่ในฐานะเจ้าของ หรือใช้การสนทนาหรือเธรดอื่น                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | อะแดปเตอร์ไม่มีความสามารถในการผูกเธรด                                                                               | ใช้ `--thread off` หรือย้ายไปยังอะแดปเตอร์/ช่องที่รองรับ                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | รันไทม์ ACP อยู่ฝั่งโฮสต์; เซสชันผู้ร้องขออยู่ในแซนด์บ็อกซ์                                                              | ใช้ `runtime="subagent"` จากเซสชันที่อยู่ในแซนด์บ็อกซ์ หรือรัน ACP spawn จากเซสชันที่ไม่ได้อยู่ในแซนด์บ็อกซ์                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | มีการร้องขอ `sandbox="require"` สำหรับรันไทม์ ACP                                                                         | ใช้ `runtime="subagent"` สำหรับการบังคับใช้แซนด์บ็อกซ์ หรือใช้ ACP พร้อม `sandbox="inherit"` จากเซสชันที่ไม่ได้อยู่ในแซนด์บ็อกซ์                                                      |
| `Cannot apply --model ... did not advertise model support`                  | ฮาร์เนสเป้าหมายไม่เปิดเผยการสลับโมเดล ACP ทั่วไป                                                        | ใช้ฮาร์เนสที่ประกาศ ACP `models`/`session/set_model`, ใช้การอ้างอิงโมเดล ACP ของ Codex หรือกำหนดค่าโมเดลโดยตรงในฮาร์เนสหากมีแฟล็กเริ่มต้นของตนเอง |
| เมทาดาทา ACP สำหรับเซสชันที่ผูกไว้หายไป                                      | เมทาดาทาเซสชัน ACP เก่าหรือถูกลบ                                                                                    | สร้างใหม่ด้วย `/acp spawn` จากนั้นผูกใหม่/โฟกัสเธรด                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` บล็อกการเขียน/exec ในเซสชัน ACP แบบไม่โต้ตอบ                                                    | ตั้งค่า `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ท Gateway ดู [การกำหนดค่าสิทธิ์](/th/tools/acp-agents-setup#permission-configuration) |
| เซสชัน ACP ล้มเหลวตั้งแต่ต้นโดยมีเอาต์พุตน้อย                                  | พรอมป์สิทธิ์ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions`                                        | ตรวจสอบบันทึก Gateway สำหรับ `AcpRuntimeError` สำหรับสิทธิ์เต็มรูปแบบ ให้ตั้งค่า `permissionMode=approve-all`; สำหรับการลดระดับอย่างนุ่มนวล ให้ตั้งค่า `nonInteractivePermissions=deny`        |
| เซสชัน ACP ค้างไม่สิ้นสุดหลังทำงานเสร็จ                       | กระบวนการฮาร์เนสเสร็จสิ้นแล้ว แต่เซสชัน ACP ไม่ได้รายงานการเสร็จสิ้น                                                    | อัปเดต OpenClaw; การล้างข้อมูล acpx ปัจจุบันจะเก็บกวาดกระบวนการ wrapper และอะแดปเตอร์ที่ค้างและเป็นของ OpenClaw เมื่อปิดและเมื่อ Gateway เริ่มต้น                                             |
| ฮาร์เนสเห็น `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | ซองเหตุการณ์ภายในรั่วข้ามขอบเขต ACP                                                                | อัปเดต OpenClaw แล้วรันโฟลว์การเสร็จสิ้นอีกครั้ง; ฮาร์เนสภายนอกควรได้รับเฉพาะพรอมป์การเสร็จสิ้นแบบธรรมดา                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` เป็นของ
รีเลย์ hook ดั้งเดิมของ Codex ไม่ใช่ ACP/acpx ในแชต Codex ที่ผูกไว้ ให้เริ่ม
เซสชันใหม่ด้วย `/new` หรือ `/reset`; หากใช้งานได้หนึ่งครั้งแล้วกลับมาเกิดอีกในการเรียกเครื่องมือ
ดั้งเดิมครั้งถัดไป ให้รีสตาร์ท app-server ของ Codex หรือ OpenClaw Gateway แทนการ
ทำ `/new` ซ้ำ ดู [การแก้ปัญหาฮาร์เนส Codex](/th/plugins/codex-harness#troubleshooting)
</Note>

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP - การตั้งค่า](/th/tools/acp-agents-setup)
- [ส่งเอเจนต์](/th/tools/agent-send)
- [แบ็กเอนด์ CLI](/th/gateway/cli-backends)
- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [รันไทม์ฮาร์เนส Codex](/th/plugins/codex-harness-runtime)
- [เครื่องมือแซนด์บ็อกซ์แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (โหมดบริดจ์)](/th/cli/acp)
- [เอเจนต์ย่อย](/th/tools/subagents)
