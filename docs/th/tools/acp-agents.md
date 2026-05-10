---
read_when:
    - การรันฮาร์เนสการเขียนโค้ดผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับการสนทนาบนช่องทางการรับส่งข้อความ
    - การผูกการสนทนาผ่านช่องทางข้อความกับเซสชัน ACP แบบถาวร
    - การแก้ไขปัญหาแบ็กเอนด์ ACP, การเชื่อมต่อ Plugin, หรือการส่งมอบผลลัพธ์การเติมข้อความ
    - การใช้งานคำสั่ง /acp จากแชต
sidebarTitle: ACP agents
summary: เรียกใช้ฮาร์เนสการเขียนโค้ดภายนอก (Claude Code, Cursor, Gemini CLI, Codex ACP แบบระบุชัดเจน, OpenClaw ACP, OpenCode) ผ่านแบ็กเอนด์ ACP
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-05-10T19:58:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

เซสชัน [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
ช่วยให้ OpenClaw เรียกใช้ฮาร์เนสการเขียนโค้ดภายนอก (เช่น Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI และฮาร์เนส ACPX อื่นๆ
ที่รองรับ) ผ่าน Plugin แบ็กเอนด์ ACP

การ spawn เซสชัน ACP แต่ละครั้งจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

<Note>
**ACP คือเส้นทางฮาร์เนสภายนอก ไม่ใช่เส้นทาง Codex เริ่มต้น** Plugin
แอปเซิร์ฟเวอร์ Codex แบบเนทีฟเป็นเจ้าของการควบคุม `/codex ...` และรันไทม์ฝังตัว
`openai/gpt-*` เริ่มต้นสำหรับเทิร์นของเอเจนต์ ส่วน ACP เป็นเจ้าของ
การควบคุม `/acp ...` และเซสชัน `sessions_spawn({ runtime: "acp" })`

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็นไคลเอนต์ MCP ภายนอก
โดยตรงไปยังบทสนทนาในแชนเนล OpenClaw ที่มีอยู่ ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน ACP
</Note>

## ฉันควรใช้หน้าไหน?

| คุณต้องการ…                                                                                     | ใช้สิ่งนี้                             | หมายเหตุ                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ผูกหรือควบคุม Codex ในบทสนทนาปัจจุบัน                                                         | `/codex bind`, `/codex threads`       | เส้นทางแอปเซิร์ฟเวอร์ Codex แบบเนทีฟเมื่อเปิดใช้งาน Plugin `codex`; รวมการตอบแชตที่ผูกไว้ การส่งต่อรูปภาพ โมเดล/เร็ว/สิทธิ์ หยุด และการควบคุมการชี้นำ ACP เป็นทางสำรองแบบชัดเจน |
| เรียกใช้ Claude Code, Gemini CLI, Codex ACP แบบชัดเจน หรือฮาร์เนสภายนอกอื่น _ผ่าน_ OpenClaw | หน้านี้                              | เซสชันที่ผูกกับแชต, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, งานเบื้องหลัง, การควบคุมรันไทม์                                                                                   |
| เปิดเผยเซสชัน OpenClaw Gateway _เป็น_ เซิร์ฟเวอร์ ACP สำหรับเอดิเตอร์หรือไคลเอนต์            | [`openclaw acp`](/th/cli/acp)            | โหมดบริดจ์ IDE/ไคลเอนต์คุย ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                                                                                            |
| นำ AI CLI ภายในเครื่องมาใช้ซ้ำเป็นโมเดลสำรองแบบข้อความเท่านั้น                                | [แบ็กเอนด์ CLI](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw ไม่มีการควบคุม ACP ไม่มีรันไทม์ฮาร์เนส                                                                                                                               |

## ใช้งานได้ทันทีหรือไม่?

ได้ หลังจากติดตั้ง Plugin รันไทม์ ACP อย่างเป็นทางการแล้ว:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ซอร์สเช็กเอาต์สามารถใช้ Plugin เวิร์กสเปซ `extensions/acpx` ภายในเครื่องได้หลังจาก
`pnpm install` เรียกใช้ `/acp doctor` เพื่อตรวจความพร้อม

OpenClaw จะสอนเอเจนต์เกี่ยวกับการ spawn ACP เฉพาะเมื่อ ACP **ใช้งานได้จริง**
เท่านั้น: ต้องเปิดใช้งาน ACP, ต้องไม่ปิดใช้งาน dispatch, เซสชันปัจจุบัน
ต้องไม่ถูกบล็อกโดย sandbox และต้องโหลดแบ็กเอนด์รันไทม์แล้ว หากไม่เป็นไปตาม
เงื่อนไขเหล่านั้น Skills ของ Plugin ACP และคำแนะนำ ACP ของ `sessions_spawn`
จะยังถูกซ่อนไว้ เพื่อให้เอเจนต์ไม่แนะนำแบ็กเอนด์ที่ใช้ไม่ได้

<AccordionGroup>
  <Accordion title="ข้อควรระวังในการรันครั้งแรก">
    - หากตั้งค่า `plugins.allow` ไว้ นั่นคือรายการ Plugin แบบจำกัด และ **ต้อง** รวม `acpx`; ไม่เช่นนั้นแบ็กเอนด์ ACP ที่ติดตั้งไว้จะถูกบล็อกโดยเจตนา และ `/acp doctor` จะรายงานว่ารายการ allowlist ขาดหาย
    - อะแดปเตอร์ Codex ACP ถูกจัดเตรียมพร้อมกับ Plugin `acpx` และเรียกใช้ภายในเครื่องเมื่อทำได้
    - Codex ACP ทำงานด้วย `CODEX_HOME` ที่แยกโดดเดี่ยว; OpenClaw คัดลอกเฉพาะรายการโปรเจกต์ที่เชื่อถือได้จากคอนฟิก Codex ของโฮสต์ และเชื่อถือเวิร์กสเปซที่ใช้งานอยู่ โดยปล่อยให้ auth, notifications และ hooks อยู่ในคอนฟิกของโฮสต์
    - อะแดปเตอร์ฮาร์เนสเป้าหมายอื่นอาจยังถูกดึงตามต้องการด้วย `npx` ในครั้งแรกที่คุณใช้งาน
    - auth ของผู้ขายยังต้องมีอยู่บนโฮสต์สำหรับฮาร์เนสนั้น
    - หากโฮสต์ไม่มี npm หรือการเข้าถึงเครือข่าย การดึงอะแดปเตอร์ครั้งแรกจะล้มเหลวจนกว่าจะอุ่นแคชไว้ล่วงหน้าหรือติดตั้งอะแดปเตอร์ด้วยวิธีอื่น

  </Accordion>
  <Accordion title="ข้อกำหนดเบื้องต้นของรันไทม์">
    ACP เรียกใช้กระบวนการฮาร์เนสภายนอกจริง OpenClaw เป็นเจ้าของการกำหนดเส้นทาง,
    สถานะงานเบื้องหลัง, การส่งมอบ, การผูก และนโยบาย; ฮาร์เนสเป็นเจ้าของ
    การเข้าสู่ระบบผู้ให้บริการ, แค็ตตาล็อกโมเดล, พฤติกรรมระบบไฟล์ และ
    เครื่องมือเนทีฟของตัวเอง

    ก่อนโทษ OpenClaw ให้ตรวจสอบว่า:

    - `/acp doctor` รายงานแบ็กเอนด์ที่เปิดใช้งานและสมบูรณ์
    - id เป้าหมายได้รับอนุญาตโดย `acp.allowedAgents` เมื่อมีการตั้งค่า allowlist นั้น
    - คำสั่งฮาร์เนสเริ่มทำงานบนโฮสต์ Gateway ได้
    - มี auth ของผู้ให้บริการสำหรับฮาร์เนสนั้น (`claude`, `codex`, `gemini`, `opencode`, `droid` ฯลฯ)
    - โมเดลที่เลือกมีอยู่สำหรับฮาร์เนสนั้น - id โมเดลไม่สามารถย้ายใช้ข้ามฮาร์เนสได้
    - `cwd` ที่ร้องขอมีอยู่และเข้าถึงได้ หรือไม่ต้องระบุ `cwd` แล้วปล่อยให้แบ็กเอนด์ใช้ค่าเริ่มต้นของตัวเอง
    - โหมดสิทธิ์ตรงกับงาน เซสชันที่ไม่โต้ตอบไม่สามารถคลิกพรอมป์สิทธิ์แบบเนทีฟได้ ดังนั้นงานเขียนโค้ดที่เน้นการเขียน/รันมักต้องใช้โปรไฟล์สิทธิ์ ACPX ที่ดำเนินต่อแบบ headless ได้

  </Accordion>
</AccordionGroup>

เครื่องมือ Plugin ของ OpenClaw และเครื่องมือ OpenClaw ในตัว **จะไม่** ถูกเปิดเผยให้
ฮาร์เนส ACP โดยค่าเริ่มต้น เปิดใช้บริดจ์ MCP แบบชัดเจนใน
[เอเจนต์ ACP - การตั้งค่า](/th/tools/acp-agents-setup) เฉพาะเมื่อฮาร์เนส
ควรเรียกเครื่องมือเหล่านั้นโดยตรง

## เป้าหมายฮาร์เนสที่รองรับ

เมื่อใช้แบ็กเอนด์ `acpx` ให้ใช้ id ฮาร์เนสเหล่านี้เป็นเป้าหมาย `/acp spawn <id>`
หรือ `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| id ฮาร์เนส | แบ็กเอนด์ทั่วไป                              | หมายเหตุ                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | อะแดปเตอร์ Claude Code ACP                    | ต้องมี auth ของ Claude Code บนโฮสต์                                              |
| `codex`    | อะแดปเตอร์ Codex ACP                          | ทางสำรอง ACP แบบชัดเจนเท่านั้นเมื่อ `/codex` แบบเนทีฟใช้งานไม่ได้หรือมีการร้องขอ ACP |
| `copilot`  | อะแดปเตอร์ GitHub Copilot ACP                 | ต้องมี auth ของ Copilot CLI/รันไทม์                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | แทนที่คำสั่ง acpx หากการติดตั้งภายในเครื่องเปิดเผย entrypoint ACP ที่แตกต่างกัน    |
| `droid`    | Factory Droid CLI                              | ต้องมี auth ของ Factory/Droid หรือ `FACTORY_API_KEY` ในสภาพแวดล้อมของฮาร์เนส        |
| `gemini`   | อะแดปเตอร์ Gemini CLI ACP                     | ต้องมี auth ของ Gemini CLI หรือการตั้งค่า API key                                          |
| `iflow`    | iFlow CLI                                      | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้งไว้                 |
| `kilocode` | Kilo Code CLI                                  | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้งไว้                 |
| `kimi`     | Kimi/Moonshot CLI                              | ต้องมี auth ของ Kimi/Moonshot บนโฮสต์                                            |
| `kiro`     | Kiro CLI                                       | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้งไว้                 |
| `opencode` | อะแดปเตอร์ OpenCode ACP                       | ต้องมี auth ของ OpenCode CLI/ผู้ให้บริการ                                                |
| `openclaw` | บริดจ์ OpenClaw Gateway ผ่าน `openclaw acp` | ช่วยให้ฮาร์เนสที่รู้จัก ACP คุยกลับไปยังเซสชัน OpenClaw Gateway ได้                 |
| `pi`       | รันไทม์ Pi/ฝังตัวของ OpenClaw                 | ใช้สำหรับการทดลองฮาร์เนสแบบเนทีฟของ OpenClaw                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | ต้องมี auth ที่เข้ากันได้กับ Qwen บนโฮสต์                                          |

สามารถกำหนดค่านามแฝงเอเจนต์ acpx แบบกำหนดเองใน acpx เองได้ แต่
นโยบาย OpenClaw ยังคงตรวจสอบ `acp.allowedAgents` และการแมป
`agents.list[].runtime.acp.agent` ใดๆ ก่อน dispatch

## คู่มือปฏิบัติสำหรับผู้ปฏิบัติการ

โฟลว์ `/acp` แบบเร็วจากแชต:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` หรือแบบชัดเจน
    `/acp spawn codex --bind here`
  </Step>
  <Step title="ทำงาน">
    ดำเนินต่อในบทสนทนาหรือเธรดที่ผูกไว้ (หรือระบุเป้าหมายเป็นคีย์เซสชัน
    อย่างชัดเจน)
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
    โดยไม่แทนที่บริบท: `/acp steer tighten logging and continue`
  </Step>
  <Step title="หยุด">
    `/acp cancel` (เทิร์นปัจจุบัน) หรือ `/acp close` (เซสชัน + การผูก)
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="รายละเอียดวงจรชีวิต">
    - Spawn สร้างหรือกลับมาใช้เซสชันรันไทม์ ACP, บันทึกเมตาดาตา ACP ในที่เก็บเซสชัน OpenClaw และอาจสร้างงานเบื้องหลังเมื่อการรันเป็นของพาเรนต์
    - เซสชัน ACP ที่เป็นของพาเรนต์จะถูกปฏิบัติเป็นงานเบื้องหลัง แม้เมื่อเซสชันรันไทม์เป็นแบบคงอยู่; การเสร็จสิ้นและการส่งมอบข้ามพื้นผิวจะผ่านตัวแจ้งเตือนงานพาเรนต์ แทนที่จะทำตัวเหมือนเซสชันแชตปกติที่ผู้ใช้เห็น
    - การบำรุงรักษางานจะปิดเซสชัน ACP แบบครั้งเดียวที่เป็นของพาเรนต์ซึ่งสิ้นสุดแล้วหรือกำพร้า เซสชัน ACP แบบคงอยู่จะถูกเก็บรักษาไว้ตราบเท่าที่ยังมีการผูกบทสนทนาที่ใช้งานอยู่; เซสชันแบบคงอยู่ที่เก่าและไม่มีการผูกที่ใช้งานอยู่จะถูกปิด เพื่อไม่ให้กลับมาใช้งานต่อแบบเงียบๆ หลังจากงานเจ้าของเสร็จแล้วหรือระเบียนงานหายไป
    - ข้อความติดตามผลที่ผูกไว้จะไปยังเซสชัน ACP โดยตรงจนกว่าการผูกจะถูกปิด เลิกโฟกัส รีเซ็ต หรือหมดอายุ
    - คำสั่ง Gateway จะอยู่ภายในเครื่อง `/acp ...`, `/status` และ `/unfocus` จะไม่ถูกส่งเป็นข้อความพรอมป์ปกติไปยังฮาร์เนส ACP ที่ผูกไว้
    - `cancel` ยกเลิกเทิร์นที่ใช้งานอยู่เมื่อแบ็กเอนด์รองรับการยกเลิก; ไม่ได้ลบการผูกหรือเมตาดาตาเซสชัน
    - `close` สิ้นสุดเซสชัน ACP จากมุมมองของ OpenClaw และลบการผูก ฮาร์เนสอาจยังเก็บประวัติอัปสตรีมของตัวเองไว้หากรองรับการกลับมาใช้งานต่อ
    - Plugin acpx ทำความสะอาดทรีกระบวนการ wrapper และอะแดปเตอร์ที่ OpenClaw เป็นเจ้าของหลังจาก `close` และเก็บกวาด orphan ACPX ที่ OpenClaw เป็นเจ้าของซึ่งค้างอยู่ระหว่างการเริ่มต้น Gateway
    - worker รันไทม์ที่ว่างอยู่มีสิทธิ์ถูกทำความสะอาดหลังจาก `acp.runtime.ttlMinutes`; เมตาดาตาเซสชันที่เก็บไว้ยังพร้อมใช้งานสำหรับ `/acp sessions`

  </Accordion>
  <Accordion title="กฎการกำหนดเส้นทาง Codex แบบเนทีฟ">
    ทริกเกอร์ภาษาธรรมชาติที่ควรกำหนดเส้นทางไปยัง **Plugin Codex แบบเนทีฟ**
    เมื่อเปิดใช้งาน:

    - "ผูกแชนเนล Discord นี้กับ Codex"
    - "แนบแชตนี้กับเธรด Codex `<id>`"
    - "แสดงเธรด Codex แล้วผูกอันนี้"

    การผูกบทสนทนา Codex แบบเนทีฟเป็นเส้นทางควบคุมแชทเริ่มต้น
    เครื่องมือแบบไดนามิกของ OpenClaw ยังคงเรียกใช้ผ่าน OpenClaw ขณะที่
    เครื่องมือเนทีฟของ Codex เช่น shell/apply-patch จะเรียกใช้ภายใน Codex
    สำหรับเหตุการณ์เครื่องมือเนทีฟของ Codex, OpenClaw จะแทรกรีเลย์ hook เนทีฟรายเทิร์น
    เพื่อให้ Plugin hooks สามารถบล็อก `before_tool_call`, สังเกต
    `after_tool_call`, และกำหนดเส้นทางเหตุการณ์ Codex `PermissionRequest`
    ผ่านการอนุมัติของ OpenClaw ได้ Codex `Stop` hooks จะถูกรีเลย์ไปยัง
    OpenClaw `before_agent_finalize` ซึ่ง Plugin สามารถขอให้ทำ
    model pass อีกครั้งก่อนที่ Codex จะสรุปคำตอบ รีเลย์นี้ยังคง
    ตั้งใจให้ระมัดระวัง: จะไม่แก้ไขอาร์กิวเมนต์ของเครื่องมือเนทีฟของ Codex
    หรือเขียนเรคคอร์ดเธรดของ Codex ใหม่ ใช้ ACP แบบชัดเจนเฉพาะ
    เมื่อคุณต้องการโมเดล runtime/session ของ ACP ขอบเขตการรองรับ Codex
    แบบฝังตัวมีเอกสารอยู่ใน
    [สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness-runtime#v1-support-contract)

  </Accordion>
  <Accordion title="ชีตสรุปการเลือกโมเดล / provider / runtime">
    - `openai-codex/*` - เส้นทางโมเดล Codex OAuth/subscription แบบเดิมที่ doctor ซ่อมให้
    - `openai/*` - runtime แบบฝังตัวของ app-server เนทีฟของ Codex สำหรับเทิร์นเอเจนต์ OpenAI
    - `/codex ...` - การควบคุมบทสนทนา Codex แบบเนทีฟ
    - `/acp ...` หรือ `runtime: "acp"` - การควบคุม ACP/acpx แบบชัดเจน

  </Accordion>
  <Accordion title="ทริกเกอร์ภาษาธรรมชาติสำหรับการกำหนดเส้นทาง ACP">
    ทริกเกอร์ที่ควรกำหนดเส้นทางไปยัง runtime ของ ACP:

    - "เรียกใช้สิ่งนี้เป็นเซสชัน Claude Code ACP แบบ one-shot แล้วสรุปผลลัพธ์"
    - "ใช้ Gemini CLI สำหรับงานนี้ในเธรด จากนั้นเก็บการติดตามผลไว้ในเธรดเดิม"
    - "เรียกใช้ Codex ผ่าน ACP ในเธรดเบื้องหลัง"

    OpenClaw เลือก `runtime: "acp"`, resolve harness `agentId`,
    ผูกกับบทสนทนาหรือเธรดปัจจุบันเมื่อรองรับ และ
    กำหนดเส้นทางการติดตามผลไปยังเซสชันนั้นจนกว่าจะปิด/หมดอายุ Codex จะ
    ตามเส้นทางนี้เฉพาะเมื่อระบุ ACP/acpx อย่างชัดเจน หรือ Plugin Codex
    แบบเนทีฟไม่พร้อมใช้งานสำหรับการดำเนินการที่ร้องขอ

    สำหรับ `sessions_spawn`, `runtime: "acp"` จะถูกประกาศเฉพาะเมื่อ ACP
    เปิดใช้งาน ผู้ร้องขอไม่ได้อยู่ใน sandbox และมี backend runtime ของ ACP
    โหลดอยู่ `acp.dispatch.enabled=false` จะหยุดการ dispatch เธรด ACP
    อัตโนมัติชั่วคราว แต่จะไม่ซ่อนหรือบล็อกการเรียก
    `sessions_spawn({ runtime: "acp" })` แบบชัดเจน โดยจะมุ่งไปยัง harness id ของ ACP เช่น `codex`,
    `claude`, `droid`, `gemini`, หรือ `opencode` อย่าส่ง id เอเจนต์
    config ปกติของ OpenClaw จาก `agents_list` เว้นแต่ entry นั้น
    จะกำหนดค่าอย่างชัดเจนด้วย `agents.list[].runtime.type="acp"`;
    มิฉะนั้นให้ใช้ runtime ของ sub-agent เริ่มต้น เมื่อเอเจนต์ OpenClaw
    ถูกกำหนดค่าด้วย `runtime.type="acp"`, OpenClaw จะใช้
    `runtime.acp.agent` เป็น harness id ชั้นใต้

  </Accordion>
</AccordionGroup>

## ACP เทียบกับ sub-agents

ใช้ ACP เมื่อคุณต้องการ runtime ของ harness ภายนอก ใช้ **app-server Codex
แบบเนทีฟ** สำหรับการผูก/ควบคุมบทสนทนา Codex เมื่อเปิดใช้งาน Plugin `codex`
ใช้ **sub-agents** เมื่อคุณต้องการงานที่ delegate แบบเนทีฟของ OpenClaw

| พื้นที่       | เซสชัน ACP                            | การเรียกใช้ sub-agent              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ของ ACP (เช่น acpx)    | runtime sub-agent เนทีฟของ OpenClaw |
| คีย์เซสชัน    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| คำสั่งหลัก    | `/acp ...`                            | `/subagents ...`                   |
| เครื่องมือ spawn | `sessions_spawn` พร้อม `runtime:"acp"` | `sessions_spawn` (runtime เริ่มต้น) |

ดูเพิ่มเติมที่ [Sub-agents](/th/tools/subagents)

## วิธีที่ ACP เรียกใช้ Claude Code

สำหรับ Claude Code ผ่าน ACP, stack คือ:

1. control plane ของเซสชัน OpenClaw ACP
2. Plugin runtime อย่างเป็นทางการ `@openclaw/acpx`
3. adapter Claude ACP
4. กลไก runtime/session ฝั่ง Claude

ACP Claude คือ **เซสชัน harness** ที่มีการควบคุม ACP, การ resume เซสชัน,
การติดตามงานเบื้องหลัง, และการผูกบทสนทนา/เธรดแบบไม่บังคับ

backend ของ CLI เป็น runtime fallback แบบ local เฉพาะข้อความที่แยกต่างหาก - ดู
[CLI Backends](/th/gateway/cli-backends)

สำหรับผู้ปฏิบัติงาน กฎเชิงปฏิบัติคือ:

- **ต้องการ `/acp spawn`, เซสชันที่ผูกได้, การควบคุม runtime, หรืองาน harness แบบ persistent ใช่ไหม** ใช้ ACP
- **ต้องการ fallback ข้อความ local แบบง่ายผ่าน CLI ดิบใช่ไหม** ใช้ backend ของ CLI

## เซสชันที่ผูกไว้

### โมเดลทางความคิด

- **พื้นผิวแชท** - ที่ที่ผู้คนคุยต่อกัน (ช่อง Discord, หัวข้อ Telegram, แชท iMessage)
- **เซสชัน ACP** - สถานะ runtime Codex/Claude/Gemini ที่คงทนซึ่ง OpenClaw กำหนดเส้นทางไปหา
- **เธรด/หัวข้อย่อย** - พื้นผิวการส่งข้อความเพิ่มเติมแบบไม่บังคับที่สร้างโดย `--thread ...` เท่านั้น
- **พื้นที่ทำงานของ runtime** - ตำแหน่งในระบบไฟล์ (`cwd`, repo checkout, backend workspace) ที่ harness เรียกใช้ ไม่ขึ้นกับพื้นผิวแชท

### การผูกกับบทสนทนาปัจจุบัน

`/acp spawn <harness> --bind here` จะ pin บทสนทนาปัจจุบันกับ
เซสชัน ACP ที่ spawn แล้ว - ไม่มีเธรดย่อย ใช้พื้นผิวแชทเดิม OpenClaw ยังคง
เป็นเจ้าของ transport, auth, safety, และ delivery ข้อความติดตามผลใน
บทสนทนานั้นจะกำหนดเส้นทางไปยังเซสชันเดิม; `/new` และ `/reset` จะ reset
เซสชันในตำแหน่งเดิม; `/acp close` จะลบการผูก

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
  <Accordion title="กฎการผูกและการใช้แบบเอกสิทธิ์">
    - `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้
    - `--bind here` ใช้ได้เฉพาะบน channel ที่ประกาศการรองรับการผูกกับบทสนทนาปัจจุบัน; มิฉะนั้น OpenClaw จะส่งข้อความไม่รองรับที่ชัดเจนกลับมา การผูกจะคงอยู่ข้ามการ restart ของ Gateway
    - บน Discord, `spawnSessions` จะ gate การสร้างเธรดย่อยสำหรับ `--thread auto|here` - ไม่ใช่ `--bind here`
    - หากคุณ spawn ไปยังเอเจนต์ ACP อื่นโดยไม่มี `--cwd`, OpenClaw จะรับช่วง workspace ของ **เอเจนต์เป้าหมาย** เป็นค่าเริ่มต้น path ที่รับช่วงมาแต่หายไป (`ENOENT`/`ENOTDIR`) จะ fallback ไปเป็นค่าเริ่มต้นของ backend; ข้อผิดพลาดการเข้าถึงอื่น (เช่น `EACCES`) จะแสดงเป็นข้อผิดพลาดการ spawn
    - คำสั่งจัดการ Gateway จะอยู่ local ในบทสนทนาที่ผูกไว้ - คำสั่ง `/acp ...` จะถูกจัดการโดย OpenClaw แม้เมื่อข้อความติดตามผลปกติถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้; `/status` และ `/unfocus` ก็จะอยู่ local เช่นกันเมื่อใดก็ตามที่การจัดการคำสั่งเปิดใช้งานสำหรับพื้นผิวนั้น

  </Accordion>
  <Accordion title="เซสชันที่ผูกกับเธรด">
    เมื่อเปิดใช้งานการผูกเธรดสำหรับ channel adapter:

    - OpenClaw ผูกเธรดกับเซสชัน ACP เป้าหมาย
    - ข้อความติดตามผลในเธรดนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้
    - เอาต์พุต ACP จะถูกส่งกลับไปยังเธรดเดิม
    - การ unfocus/close/archive/idle-timeout หรือการหมดอายุตาม max-age จะลบการผูก
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, และ `/unfocus` เป็นคำสั่ง Gateway ไม่ใช่ prompt ไปยัง ACP harness

    feature flags ที่จำเป็นสำหรับ ACP ที่ผูกกับเธรด:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` เปิดอยู่เป็นค่าเริ่มต้น (ตั้งเป็น `false` เพื่อหยุดการ dispatch เธรด ACP อัตโนมัติชั่วคราว; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงทำงาน)
    - เปิดใช้งานการ spawn เซสชันเธรดของ channel-adapter (ค่าเริ่มต้น: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    การรองรับการผูกเธรดขึ้นกับ adapter เฉพาะ หาก channel
    adapter ที่ใช้งานอยู่ไม่รองรับการผูกเธรด OpenClaw จะส่ง
    ข้อความไม่รองรับ/ไม่พร้อมใช้งานที่ชัดเจนกลับมา

  </Accordion>
  <Accordion title="channel ที่รองรับเธรด">
    - channel adapter ใดก็ตามที่เปิดเผยความสามารถการผูกเซสชัน/เธรด
    - การรองรับ built-in ปัจจุบัน: เธรด/ช่อง **Discord**, หัวข้อ **Telegram** (หัวข้อฟอรัมในกลุ่ม/supergroup และหัวข้อ DM)
    - Plugin channels สามารถเพิ่มการรองรับผ่านอินเทอร์เฟซการผูกเดียวกันได้

  </Accordion>
</AccordionGroup>

## การผูก channel แบบ persistent

สำหรับ workflow ที่ไม่ใช่ ephemeral ให้กำหนดค่าการผูก ACP แบบ persistent ใน
entry `bindings[]` ระดับบนสุด

### โมเดลการผูก

<ParamField path="bindings[].type" type='"acp"'>
  ทำเครื่องหมายการผูกบทสนทนา ACP แบบ persistent
</ParamField>
<ParamField path="bindings[].match" type="object">
  ระบุบทสนทนาเป้าหมาย รูปแบบต่อ channel:

- **ช่อง/เธรด Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **ช่อง/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"` แนะนำให้ใช้ Slack ids ที่เสถียร; การผูก channel ยัง match การตอบกลับภายในเธรดของ channel นั้นด้วย
- **หัวข้อฟอรัม Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/กลุ่ม iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` แนะนำให้ใช้ `chat_id:*` สำหรับการผูกกลุ่มที่เสถียร

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  id เอเจนต์ OpenClaw ที่เป็นเจ้าของ
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  การ override ACP แบบไม่บังคับ
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  label สำหรับผู้ปฏิบัติงานแบบไม่บังคับ
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  ไดเรกทอรีทำงานของ runtime แบบไม่บังคับ
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  การ override backend แบบไม่บังคับ
</ParamField>

### ค่าเริ่มต้นของ runtime ต่อเอเจนต์

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้นของ ACP หนึ่งครั้งต่อเอเจนต์:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id, เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ลำดับความสำคัญของ override สำหรับเซสชัน ACP ที่ผูกไว้:**

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

- OpenClaw ตรวจสอบให้แน่ใจว่าเซสชัน ACP ที่กำหนดค่าไว้มีอยู่ก่อนใช้งาน
- ข้อความในช่องทางหรือหัวข้อนั้นจะถูกส่งต่อไปยังเซสชัน ACP ที่กำหนดค่าไว้
- ในบทสนทนาที่ผูกไว้ `/new` และ `/reset` จะรีเซ็ตคีย์เซสชัน ACP เดิมในที่เดิม
- การผูกรันไทม์ชั่วคราว (เช่น ที่สร้างโดยโฟลว์ thread-focus) ยังมีผลเมื่อมีอยู่
- สำหรับการสร้าง ACP ข้ามเอเจนต์โดยไม่มี `cwd` ชัดเจน OpenClaw จะสืบทอดพื้นที่ทำงานของเอเจนต์เป้าหมายจากการกำหนดค่าเอเจนต์
- พาธพื้นที่ทำงานที่สืบทอดมาแต่ไม่มีอยู่จะย้อนกลับไปใช้ cwd เริ่มต้นของแบ็กเอนด์ ส่วนความล้มเหลวในการเข้าถึงที่ไม่ใช่กรณีไม่มีอยู่จะแสดงเป็นข้อผิดพลาดการสร้าง

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
    `thread: true` เพื่อคงบทสนทนาที่ผูกแบบถาวรไว้
    </Note>

  </Tab>
  <Tab title="From /acp command">
    ใช้ `/acp spawn` เพื่อให้โอเปอเรเตอร์ควบคุมจากแชตอย่างชัดเจน

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
  พรอมต์เริ่มต้นที่ส่งไปยังเซสชัน ACP
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ต้องเป็น `"acp"` สำหรับเซสชัน ACP
</ParamField>
<ParamField path="agentId" type="string">
  id ฮาร์เนสเป้าหมายของ ACP ย้อนกลับไปใช้ `acp.defaultAgent` หากตั้งค่าไว้
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  ขอให้ใช้โฟลว์การผูกเธรดเมื่อรองรับ
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` เป็นแบบครั้งเดียว ส่วน `"session"` เป็นแบบถาวร หาก `thread: true` และ
  ละเว้น `mode` OpenClaw อาจตั้งค่าเริ่มต้นเป็นพฤติกรรมถาวรตาม
  พาธรันไทม์ `mode: "session"` ต้องใช้ `thread: true`
</ParamField>
<ParamField path="cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์ที่ร้องขอ (ตรวจสอบโดยนโยบายแบ็กเอนด์/รันไทม์)
  หากละเว้น การสร้าง ACP จะสืบทอดพื้นที่ทำงานของเอเจนต์เป้าหมาย
  เมื่อมีการกำหนดค่าไว้ พาธที่สืบทอดมาแต่ไม่มีอยู่จะย้อนกลับไปใช้ค่าเริ่มต้นของแบ็กเอนด์
  ส่วนข้อผิดพลาดการเข้าถึงจริงจะถูกส่งกลับ
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับที่แสดงต่อโอเปอเรเตอร์ ซึ่งใช้ในข้อความเซสชัน/แบนเนอร์
</ParamField>
<ParamField path="resumeSessionId" type="string">
  กลับมาใช้เซสชัน ACP ที่มีอยู่แทนการสร้างเซสชันใหม่
  เอเจนต์จะเล่นประวัติบทสนทนาซ้ำผ่าน `session/load` ต้องใช้
  `runtime: "acp"`
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` จะสตรีมสรุปความคืบหน้ารัน ACP เริ่มต้นกลับไปยัง
  เซสชันผู้ร้องขอเป็นเหตุการณ์ระบบ การตอบกลับที่ยอมรับมี
  `streamLogPath` ซึ่งชี้ไปยังล็อก JSONL แบบจำกัดขอบเขตตามเซสชัน
  (`<sessionId>.acp-stream.jsonl`) ที่คุณสามารถ tail เพื่อดูประวัติการส่งต่อทั้งหมดได้
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ยกเลิกเทิร์นลูก ACP หลังผ่านไป N วินาที `0` จะคงเทิร์นไว้บน
  พาธไม่มีไทม์เอาต์ของ Gateway ค่าเดียวกันจะถูกใช้กับการรัน Gateway
  และรันไทม์ ACP เพื่อให้ฮาร์เนสที่ค้างหรือโควตาหมดไม่
  ครองเลนเอเจนต์แม่อย่างไม่มีกำหนด
</ParamField>
<ParamField path="model" type="string">
  การแทนที่โมเดลอย่างชัดเจนสำหรับเซสชันลูก ACP การสร้าง Codex ACP
  จะปรับ refs ของ OpenClaw Codex เช่น `openai-codex/gpt-5.4` ให้เป็นการกำหนดค่าเริ่มต้นของ Codex
  ACP ก่อน `session/new`; รูปแบบ slash เช่น
  `openai-codex/gpt-5.4/high` จะตั้งค่าระดับความพยายามในการให้เหตุผลของ Codex ACP ด้วย
  ฮาร์เนสอื่นต้องประกาศ ACP `models` และรองรับ
  `session/set_model`; มิฉะนั้น OpenClaw/acpx จะล้มเหลวอย่างชัดเจนแทนที่จะ
  ย้อนกลับไปใช้ค่าเริ่มต้นของเอเจนต์เป้าหมายแบบเงียบ ๆ
</ParamField>
<ParamField path="thinking" type="string">
  ระดับความพยายามด้านการคิด/การให้เหตุผลอย่างชัดเจน สำหรับ Codex ACP, `minimal` จะแมปเป็น
  ระดับต่ำ, `low`/`medium`/`high`/`xhigh` จะแมปตรงตัว และ `off`
  จะละเว้นการแทนที่ระดับความพยายามในการให้เหตุผลตอนเริ่มต้น
</ParamField>

## โหมดการผูกและเธรดของการสร้าง

<Tabs>
  <Tab title="--bind here|off">
    | โหมด   | พฤติกรรม                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | ผูกบทสนทนาที่ใช้งานอยู่ปัจจุบันในที่เดิม ล้มเหลวหากไม่มีบทสนทนาที่ใช้งานอยู่ |
    | `off`  | ไม่สร้างการผูกกับบทสนทนาปัจจุบัน                          |

    หมายเหตุ:

    - `--bind here` เป็นพาธโอเปอเรเตอร์ที่ง่ายที่สุดสำหรับ "ทำให้ช่องทางหรือแชตนี้มี Codex รองรับ"
    - `--bind here` ไม่สร้างเธรดลูก
    - `--bind here` ใช้ได้เฉพาะบนช่องทางที่เปิดเผยการรองรับการผูกบทสนทนาปัจจุบัน
    - ไม่สามารถรวม `--bind` และ `--thread` ในการเรียก `/acp spawn` เดียวกันได้

  </Tab>
  <Tab title="--thread auto|here|off">
    | โหมด   | พฤติกรรม                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | ในเธรดที่ใช้งานอยู่: ผูกเธรดนั้น นอกเธรด: สร้าง/ผูกเธรดลูกเมื่อรองรับ |
    | `here` | ต้องมีเธรดที่ใช้งานอยู่ปัจจุบัน ล้มเหลวหากไม่ได้อยู่ในเธรด                                                  |
    | `off`  | ไม่มีการผูก เซสชันเริ่มแบบไม่ผูก                                                                 |

    หมายเหตุ:

    - บนพื้นผิวการผูกที่ไม่ใช่เธรด พฤติกรรมเริ่มต้นจะมีผลเทียบเท่า `off`
    - การสร้างแบบผูกกับเธรดต้องมีการรองรับนโยบายช่องทาง:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - ใช้ `--bind here` เมื่อคุณต้องการตรึงบทสนทนาปัจจุบันโดยไม่สร้างเธรดลูก

  </Tab>
</Tabs>

## โมเดลการส่งมอบ

เซสชัน ACP อาจเป็นพื้นที่ทำงานเชิงโต้ตอบหรืองานเบื้องหลัง
ที่เอเจนต์แม่เป็นเจ้าของก็ได้ พาธการส่งมอบขึ้นอยู่กับรูปแบบนั้น

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    เซสชันเชิงโต้ตอบออกแบบมาเพื่อสนทนาต่อบนพื้นผิวแชต
    ที่มองเห็นได้:

    - `/acp spawn ... --bind here` ผูกบทสนทนาปัจจุบันเข้ากับเซสชัน ACP
    - `/acp spawn ... --thread ...` ผูกเธรด/หัวข้อของช่องทางเข้ากับเซสชัน ACP
    - `bindings[].type="acp"` แบบถาวรที่กำหนดค่าไว้จะส่งบทสนทนาที่ตรงกันไปยังเซสชัน ACP เดิม

    ข้อความติดตามผลในบทสนทนาที่ผูกไว้จะถูกส่งตรงไปยัง
    เซสชัน ACP และเอาต์พุต ACP จะถูกส่งกลับไปยัง
    ช่องทาง/เธรด/หัวข้อเดียวกันนั้น

    สิ่งที่ OpenClaw ส่งไปยังฮาร์เนส:

    - ข้อความติดตามผลแบบผูกตามปกติจะถูกส่งเป็นข้อความพรอมต์ พร้อมไฟล์แนบเฉพาะเมื่อฮาร์เนส/แบ็กเอนด์รองรับ
    - คำสั่งจัดการ `/acp` และคำสั่ง Gateway ภายในเครื่องจะถูกดักก่อนส่งไปยัง ACP
    - เหตุการณ์การเสร็จสิ้นที่รันไทม์สร้างขึ้นจะถูกทำให้เป็นรูปธรรมตามเป้าหมาย เอเจนต์ OpenClaw จะได้รับซอง runtime-context ภายในของ OpenClaw; ฮาร์เนส ACP ภายนอกจะได้รับพรอมต์แบบธรรมดาที่มีผลลัพธ์ลูกและคำสั่ง ซองดิบ `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ไม่ควรถูกส่งไปยังฮาร์เนสภายนอกหรือถูกคงไว้เป็นข้อความทรานสคริปต์ผู้ใช้ ACP
    - รายการทรานสคริปต์ ACP ใช้ข้อความทริกเกอร์ที่ผู้ใช้เห็นหรือพรอมต์การเสร็จสิ้นแบบธรรมดา เมตาดาต้าเหตุการณ์ภายในจะคงเป็นโครงสร้างใน OpenClaw เมื่อเป็นไปได้ และไม่ถูกถือว่าเป็นเนื้อหาแชตที่ผู้ใช้เขียน

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    เซสชัน ACP แบบครั้งเดียวที่ถูกสร้างโดยการรันของเอเจนต์อื่นเป็น
    ลูกเบื้องหลัง คล้ายกับเอเจนต์ย่อย:

    - เอเจนต์แม่ขอให้ทำงานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
    - ลูกจะรันในเซสชันฮาร์เนส ACP ของตัวเอง
    - เทิร์นลูกจะรันบนเลนเบื้องหลังเดียวกับที่ใช้โดยการสร้างเอเจนต์ย่อยแบบเนทีฟ ดังนั้นฮาร์เนส ACP ที่ช้าจะไม่บล็อกงานเซสชันหลักที่ไม่เกี่ยวข้อง
    - รายงานการเสร็จสิ้นกลับผ่านพาธประกาศการเสร็จสิ้นของงาน OpenClaw แปลงเมตาดาต้าการเสร็จสิ้นภายในเป็นพรอมต์ ACP แบบธรรมดาก่อนส่งไปยังฮาร์เนสภายนอก ดังนั้นฮาร์เนสจะไม่เห็นตัวทำเครื่องหมายบริบทรันไทม์ที่มีเฉพาะใน OpenClaw
    - เอเจนต์แม่จะเขียนผลลัพธ์ลูกใหม่ด้วยเสียงผู้ช่วยตามปกติเมื่อการตอบกลับที่ผู้ใช้เห็นมีประโยชน์

    อย่า**ถือว่าพาธนี้เป็นแชตแบบเพียร์ทูเพียร์ระหว่างเอเจนต์แม่
    และลูก** ลูกมีช่องทางการเสร็จสิ้นกลับไปยัง
    เอเจนต์แม่อยู่แล้ว

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` สามารถกำหนดเป้าหมายเป็นเซสชันอื่นหลังสร้างได้ สำหรับเซสชันเพียร์
    ตามปกติ OpenClaw ใช้พาธติดตามผลแบบเอเจนต์ถึงเอเจนต์ (A2A)
    หลังแทรกข้อความ:

    - รอการตอบกลับของเซสชันเป้าหมาย
    - เลือกให้ผู้ร้องขอและเป้าหมายแลกเปลี่ยนเทิร์นติดตามผลจำนวนจำกัดได้
    - ขอให้เป้าหมายสร้างข้อความประกาศ
    - ส่งประกาศนั้นไปยังช่องทางหรือเธรดที่มองเห็นได้

    พาธ A2A นั้นเป็นทางสำรองสำหรับการส่งแบบเพียร์เมื่อผู้ส่งต้องการ
    การติดตามผลที่มองเห็นได้ พาธนี้ยังคงเปิดใช้งานเมื่อเซสชันที่ไม่เกี่ยวข้อง
    สามารถเห็นและส่งข้อความถึงเป้าหมาย ACP ได้ เช่น ภายใต้การตั้งค่า
    `tools.sessions.visibility` แบบกว้าง

    OpenClaw จะข้ามการติดตามผล A2A เฉพาะเมื่อผู้ร้องขอเป็น
    เอเจนต์แม่ของลูก ACP แบบครั้งเดียวที่เอเจนต์แม่เป็นเจ้าของเอง ในกรณีนั้น
    การรัน A2A ทับบนการเสร็จสิ้นของงานสามารถปลุกเอเจนต์แม่ด้วย
    ผลลัพธ์ของลูก ส่งต่อการตอบกลับของเอเจนต์แม่กลับเข้าไปในลูก และ
    สร้างลูปสะท้อนแม่/ลูก ผลลัพธ์ `sessions_send` รายงาน
    `delivery.status="skipped"` สำหรับกรณีลูกที่เป็นเจ้าของนั้น เพราะ
    พาธการเสร็จสิ้นรับผิดชอบผลลัพธ์อยู่แล้ว

  </Accordion>
  <Accordion title="Resume an existing session">
    ใช้ `resumeSessionId` เพื่อดำเนินเซสชัน ACP ก่อนหน้าต่อแทน
    การเริ่มใหม่ เอเจนต์จะเล่นประวัติบทสนทนาซ้ำผ่าน
    `session/load` ดังนั้นจึงกลับมาพร้อมบริบทเต็มของสิ่งที่เกิดขึ้นก่อนหน้า

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    กรณีใช้งานทั่วไป:

    - ส่งต่อเซสชัน Codex จากแล็ปท็อปไปยังโทรศัพท์ของคุณ - บอกเอเจนต์ให้ทำต่อจากจุดที่คุณค้างไว้
    - ดำเนินเซสชันเขียนโค้ดที่คุณเริ่มแบบโต้ตอบใน CLI ต่อ โดยตอนนี้ทำแบบไม่มีส่วนหัวผ่านเอเจนต์ของคุณ
    - กลับมาทำงานที่ถูกขัดจังหวะโดยการรีสตาร์ต Gateway หรือไทม์เอาต์จากการไม่มีการใช้งาน

    หมายเหตุ:

    - `resumeSessionId` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; รันไทม์เอเจนต์ย่อยเริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `streamTo` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; รันไทม์เอเจนต์ย่อยเริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `resumeSessionId` เป็น id กลับมาใช้ต่อของ ACP/ฮาร์เนสแบบเฉพาะโฮสต์ ไม่ใช่คีย์เซสชันช่องทางของ OpenClaw; OpenClaw ยังคงตรวจสอบนโยบายการสร้าง ACP และนโยบายเอเจนต์เป้าหมายก่อนส่งต่อ ขณะที่แบ็กเอนด์ ACP หรือฮาร์เนสเป็นเจ้าของการอนุญาตสำหรับการโหลด id ต้นทางนั้น
    - `resumeSessionId` กู้คืนประวัติบทสนทนา ACP ต้นทาง; `thread` และ `mode` ยังมีผลตามปกติกับเซสชัน OpenClaw ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังต้องใช้ `thread: true`
    - เอเจนต์เป้าหมายต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
    - หากไม่พบ id เซสชัน การสร้างจะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน - ไม่มีการย้อนกลับไปยังเซสชันใหม่แบบเงียบ ๆ

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    หลังปรับใช้ Gateway ให้รันการตรวจสอบแบบ end-to-end สดแทน
    การเชื่อถือการทดสอบหน่วย:

    1. ตรวจสอบเวอร์ชัน Gateway และคอมมิตที่ปรับใช้แล้วบนโฮสต์เป้าหมาย
    2. เปิดเซสชันบริดจ์ ACPX ชั่วคราวไปยังเอเจนต์สด
    3. ขอให้เอเจนต์นั้นเรียก `sessions_spawn` ด้วย `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` และงาน `Reply with exactly LIVE-ACP-SPAWN-OK`
    4. ตรวจสอบ `accepted=yes`, `childSessionKey` จริง และไม่มีข้อผิดพลาดจากตัวตรวจสอบ
    5. ล้างเซสชันบริดจ์ชั่วคราว

    คงเกตไว้ที่ `mode: "run"` และข้าม `streamTo: "parent"` -
    เส้นทาง `mode: "session"` ที่ผูกกับเธรดและเส้นทางรีเลย์สตรีมเป็น
    รอบการผสานรวมที่สมบูรณ์กว่าแยกต่างหาก

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้กับแซนด์บ็อกซ์

เซสชัน ACP ปัจจุบันทำงานบนรันไทม์ของโฮสต์ **ไม่ใช่** ภายใน
แซนด์บ็อกซ์ของ OpenClaw

<Warning>
**ขอบเขตความปลอดภัย:**

- ฮาร์เนสภายนอกสามารถอ่าน/เขียนได้ตามสิทธิ์ CLI ของตัวเองและ `cwd` ที่เลือก
- นโยบายแซนด์บ็อกซ์ของ OpenClaw **ไม่ได้** ครอบการทำงานของฮาร์เนส ACP
- OpenClaw ยังคงบังคับใช้เกตฟีเจอร์ ACP, เอเจนต์ที่อนุญาต, ความเป็นเจ้าของเซสชัน, การผูกช่องทาง และนโยบายการส่งของ Gateway
- ใช้ `runtime: "subagent"` สำหรับงานแบบเนทีฟของ OpenClaw ที่บังคับใช้แซนด์บ็อกซ์

</Warning>

ข้อจำกัดปัจจุบัน:

- หากเซสชันผู้ร้องขออยู่ในแซนด์บ็อกซ์ การสปอว์น ACP จะถูกบล็อกทั้งสำหรับ `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
- `sessions_spawn` ที่มี `runtime: "acp"` ไม่รองรับ `sandbox: "require"`

## การระบุเป้าหมายเซสชัน

การดำเนินการ `/acp` ส่วนใหญ่รับเป้าหมายเซสชันแบบไม่บังคับ (`session-key`,
`session-id` หรือ `session-label`)

**ลำดับการระบุ:**

1. อาร์กิวเมนต์เป้าหมายที่ระบุโดยตรง (หรือ `--session` สำหรับ `/acp steer`)
   - ลองใช้คีย์
   - จากนั้นใช้รหัสเซสชันที่มีรูปแบบ UUID
   - จากนั้นใช้ป้ายกำกับ
2. การผูกเธรดปัจจุบัน (หากการสนทนา/เธรดนี้ผูกกับเซสชัน ACP)
3. ทางเลือกสำรองเป็นเซสชันผู้ร้องขอปัจจุบัน

ทั้งการผูกการสนทนาปัจจุบันและการผูกเธรดมีส่วนร่วมใน
ขั้นตอนที่ 2

หากระบุเป้าหมายไม่ได้ OpenClaw จะส่งคืนข้อผิดพลาดที่ชัดเจน
(`Unable to resolve session target: ...`)

## การควบคุม ACP

| คำสั่ง              | ทำอะไร                                              | ตัวอย่าง                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้างเซสชัน ACP; เลือกผูกปัจจุบันหรือผูกเธรดได้ | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิกเทิร์นที่กำลังดำเนินการสำหรับเซสชันเป้าหมาย                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่งนำทางไปยังเซสชันที่กำลังทำงาน                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิดเซสชันและยกเลิกการผูกเป้าหมายเธรด                  | `/acp close`                                                  |
| `/acp status`        | แสดงแบ็กเอนด์ โหมด สถานะ ตัวเลือกรันไทม์ และความสามารถ | `/acp status`                                                 |
| `/acp set-mode`      | ตั้งค่าโหมดรันไทม์สำหรับเซสชันเป้าหมาย                      | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนตัวเลือกคอนฟิกรันไทม์ทั่วไป                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่าการแทนที่ไดเรกทอรีทำงานของรันไทม์                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้งค่าโปรไฟล์นโยบายการอนุมัติ                              | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้งค่าหมดเวลารันไทม์ (วินาที)                            | `/acp timeout 120`                                            |
| `/acp model`         | ตั้งค่าการแทนที่โมเดลรันไทม์                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบการแทนที่ตัวเลือกรันไทม์ของเซสชัน                  | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการเซสชัน ACP ล่าสุดจากสโตร์                      | `/acp sessions`                                               |
| `/acp doctor`        | สุขภาพแบ็กเอนด์ ความสามารถ และการแก้ไขที่ทำได้           | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอนการติดตั้งและเปิดใช้งานที่กำหนดแน่นอน             | `/acp install`                                                |

`/acp status` แสดงตัวเลือกรันไทม์ที่มีผล รวมถึงตัวระบุเซสชันระดับรันไทม์และ
ระดับแบ็กเอนด์ ข้อผิดพลาดของการควบคุมที่ไม่รองรับจะแสดง
อย่างชัดเจนเมื่อแบ็กเอนด์ไม่มีความสามารถนั้น `/acp sessions` อ่าน
สโตร์สำหรับเซสชันที่ผูกอยู่ปัจจุบันหรือเซสชันผู้ร้องขอ; โทเค็นเป้าหมาย
(`session-key`, `session-id` หรือ `session-label`) จะถูกระบุผ่าน
การค้นพบเซสชัน Gateway รวมถึงรูท `session.store`
แบบกำหนดเองต่อเอเจนต์

### การแมปตัวเลือกรันไทม์

`/acp` มีคำสั่งอำนวยความสะดวกและตัวตั้งค่าทั่วไป การดำเนินการที่เทียบเท่ากัน:

| คำสั่ง                      | แมปไปยัง                              | หมายเหตุ                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | คีย์คอนฟิกรันไทม์ `model`           | สำหรับ Codex ACP, OpenClaw ทำให้ `openai-codex/<model>` เป็นรหัสโมเดลของอะแดปเตอร์ตามมาตรฐาน และแมป suffix การใช้เหตุผลแบบ slash เช่น `openai-codex/gpt-5.4/high` ไปยัง `reasoning_effort`                             |
| `/acp set thinking <level>`  | ตัวเลือกมาตรฐาน `thinking`          | OpenClaw ส่งค่าที่เทียบเท่าตามที่แบ็กเอนด์ประกาศเมื่อมี โดยเลือก `thinking` ก่อน จากนั้น `effort`, `reasoning_effort` หรือ `thought_level` สำหรับ Codex ACP อะแดปเตอร์จะแมปค่าไปยัง `reasoning_effort` |
| `/acp permissions <profile>` | ตัวเลือกมาตรฐาน `permissionProfile` | OpenClaw ส่งค่าที่เทียบเท่าตามที่แบ็กเอนด์ประกาศเมื่อมี เช่น `approval_policy`, `permission_profile`, `permissions` หรือ `permission_mode`                                                       |
| `/acp timeout <seconds>`     | ตัวเลือกมาตรฐาน `timeoutSeconds`    | OpenClaw ส่งค่าที่เทียบเท่าตามที่แบ็กเอนด์ประกาศเมื่อมี เช่น `timeout` หรือ `timeout_seconds`                                                                                                     |
| `/acp cwd <path>`            | การแทนที่ cwd ของรันไทม์                 | อัปเดตโดยตรง                                                                                                                                                                                             |
| `/acp set <key> <value>`     | ทั่วไป                              | `key=cwd` ใช้เส้นทางแทนที่ cwd                                                                                                                                                                      |
| `/acp reset-options`         | ล้างการแทนที่รันไทม์ทั้งหมด         | -                                                                                                                                                                                                          |

## ฮาร์เนส acpx, การตั้งค่า Plugin และสิทธิ์

สำหรับการกำหนดค่าฮาร์เนส acpx (นามแฝง Claude Code / Codex / Gemini CLI),
บริดจ์ MCP ของ plugin-tools และ OpenClaw-tools และโหมดสิทธิ์
ACP โปรดดู
[เอเจนต์ ACP - การตั้งค่า](/th/tools/acp-agents-setup)

## การแก้ไขปัญหา

| อาการ                                                                     | สาเหตุที่เป็นไปได้                                                                                                           | วิธีแก้                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin แบ็กเอนด์หายไป ถูกปิดใช้งาน หรือถูกบล็อกโดย `plugins.allow`                                                       | ติดตั้งและเปิดใช้งาน Plugin แบ็กเอนด์ ใส่ `acpx` ใน `plugins.allow` เมื่อมีการตั้งค่ารายการอนุญาตนั้น แล้วรัน `/acp doctor`                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ถูกปิดใช้งานทั่วทั้งระบบ                                                                                                 | ตั้งค่า `acp.enabled=true`                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | การส่งงานอัตโนมัติจากข้อความเธรดปกติถูกปิดใช้งาน                                                               | ตั้งค่า `acp.dispatch.enabled=true` เพื่อเปิดการกำหนดเส้นทางเธรดอัตโนมัติอีกครั้ง; การเรียก `sessions_spawn({ runtime: "acp" })` แบบระบุชัดเจนยังคงทำงาน                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | เอเจนต์ไม่อยู่ในรายการอนุญาต                                                                                                | ใช้ `agentId` ที่ได้รับอนุญาต หรืออัปเดต `acp.allowedAgents`                                                                                                                     |
| `/acp doctor` รายงานว่าแบ็กเอนด์ยังไม่พร้อมทันทีหลังเริ่มทำงาน                 | Plugin แบ็กเอนด์หายไป ถูกปิดใช้งาน ถูกบล็อกโดยนโยบายอนุญาต/ปฏิเสธ หรือไฟล์ปฏิบัติการที่กำหนดค่าไว้ไม่พร้อมใช้งาน        | ติดตั้ง/เปิดใช้งาน Plugin แบ็กเอนด์ รัน `/acp doctor` อีกครั้ง และตรวจสอบข้อผิดพลาดการติดตั้งแบ็กเอนด์หรือนโยบายหากยังไม่แข็งแรง                                           |
| ไม่พบคำสั่ง harness                                                   | Adapter CLI ไม่ได้ติดตั้ง, Plugin ภายนอกหายไป, หรือการดึง `npx` ครั้งแรกสำหรับอะแดปเตอร์ที่ไม่ใช่ Codex ล้มเหลว | รัน `/acp doctor`, ติดตั้ง/เตรียมอะแดปเตอร์ล่วงหน้าบนโฮสต์ Gateway, หรือกำหนดค่าคำสั่งเอเจนต์ acpx โดยตรง                                                      |
| harness แจ้งว่าไม่พบโมเดล                                            | รหัสโมเดลถูกต้องสำหรับผู้ให้บริการ/harness อื่น แต่ไม่ถูกต้องสำหรับเป้าหมาย ACP นี้                                                | ใช้โมเดลที่ harness นั้นแสดงไว้ กำหนดค่าโมเดลใน harness หรือไม่ต้องระบุค่าทับ                                                                            |
| harness แจ้งข้อผิดพลาดการยืนยันตัวตนของผู้ให้บริการ                                          | OpenClaw ทำงานปกติ แต่ CLI/ผู้ให้บริการเป้าหมายยังไม่ได้เข้าสู่ระบบ                                                     | เข้าสู่ระบบ หรือระบุคีย์ผู้ให้บริการที่จำเป็นในสภาพแวดล้อมของโฮสต์ Gateway                                                                                             |
| `Unable to resolve session target: ...`                                     | โทเค็นคีย์/รหัส/ป้ายกำกับไม่ถูกต้อง                                                                                                | รัน `/acp sessions`, คัดลอกคีย์/ป้ายกำกับให้ตรงทุกตัว แล้วลองอีกครั้ง                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มีการสนทนาที่ใช้งานอยู่และผูกได้                                                            | ย้ายไปยังแชต/ช่องเป้าหมายแล้วลองอีกครั้ง หรือใช้การ spawn แบบไม่ผูก                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | อะแดปเตอร์ไม่มีความสามารถในการผูก ACP กับการสนทนาปัจจุบัน                                                             | ใช้ `/acp spawn ... --thread ...` เมื่อรองรับ กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปยังช่องที่รองรับ                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | ใช้ `--thread here` นอกบริบทเธรด                                                                         | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off`                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | ผู้ใช้อื่นเป็นเจ้าของเป้าหมายการผูกที่ใช้งานอยู่                                                                           | ผูกใหม่ในฐานะเจ้าของ หรือใช้การสนทนาหรือเธรดอื่น                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | อะแดปเตอร์ไม่มีความสามารถในการผูกเธรด                                                                               | ใช้ `--thread off` หรือย้ายไปยังอะแดปเตอร์/ช่องที่รองรับ                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime อยู่ฝั่งโฮสต์; เซสชันผู้ร้องขออยู่ใน sandbox                                                              | ใช้ `runtime="subagent"` จากเซสชันใน sandbox หรือรัน ACP spawn จากเซสชันที่ไม่อยู่ใน sandbox                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | มีการร้องขอ `sandbox="require"` สำหรับ ACP runtime                                                                         | ใช้ `runtime="subagent"` สำหรับการ sandbox ที่จำเป็น หรือใช้ ACP พร้อม `sandbox="inherit"` จากเซสชันที่ไม่อยู่ใน sandbox                                                      |
| `Cannot apply --model ... did not advertise model support`                  | harness เป้าหมายไม่เปิดเผยการสลับโมเดล ACP แบบทั่วไป                                                        | ใช้ harness ที่ประกาศ ACP `models`/`session/set_model`, ใช้การอ้างอิงโมเดล ACP ของ Codex, หรือกำหนดค่าโมเดลโดยตรงใน harness หากมีแฟล็กเริ่มต้นของตัวเอง |
| ไม่มีเมทาดาทา ACP สำหรับเซสชันที่ผูกไว้                                      | เมทาดาทาเซสชัน ACP เก่าหรือถูกลบ                                                                                    | สร้างใหม่ด้วย `/acp spawn` แล้วผูกใหม่/โฟกัสเธรด                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` บล็อกการเขียน/การเรียกใช้ในเซสชัน ACP แบบไม่โต้ตอบ                                                    | ตั้งค่า `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ท Gateway ดู [การกำหนดค่าสิทธิ์](/th/tools/acp-agents-setup#permission-configuration) |
| เซสชัน ACP ล้มเหลวตั้งแต่ต้นโดยมีเอาต์พุตน้อย                                  | พรอมป์สิทธิ์ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions`                                        | ตรวจสอบบันทึก Gateway สำหรับ `AcpRuntimeError` สำหรับสิทธิ์เต็ม ให้ตั้งค่า `permissionMode=approve-all`; สำหรับการลดระดับอย่างราบรื่น ให้ตั้งค่า `nonInteractivePermissions=deny`        |
| เซสชัน ACP ค้างไม่สิ้นสุดหลังทำงานเสร็จ                       | กระบวนการ harness เสร็จแล้ว แต่เซสชัน ACP ไม่ได้รายงานการเสร็จสิ้น                                                    | อัปเดต OpenClaw; การล้างข้อมูล acpx ปัจจุบันจะเก็บกวาด wrapper และกระบวนการอะแดปเตอร์เก่าที่ OpenClaw เป็นเจ้าของเมื่อปิดและเมื่อ Gateway เริ่มทำงาน                                             |
| harness เห็น `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | envelope เหตุการณ์ภายในรั่วข้ามขอบเขต ACP                                                                | อัปเดต OpenClaw แล้วรัน flow การเสร็จสิ้นอีกครั้ง; harness ภายนอกควรได้รับเฉพาะพรอมป์การเสร็จสิ้นแบบธรรมดา                                                          |

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP - การตั้งค่า](/th/tools/acp-agents-setup)
- [ส่งเอเจนต์](/th/tools/agent-send)
- [แบ็กเอนด์ CLI](/th/gateway/cli-backends)
- [harness Codex](/th/plugins/codex-harness)
- [runtime ของ harness Codex](/th/plugins/codex-harness-runtime)
- [เครื่องมือ sandbox หลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (โหมดบริดจ์)](/th/cli/acp)
- [เอเจนต์ย่อย](/th/tools/subagents)
