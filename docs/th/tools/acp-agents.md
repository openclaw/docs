---
read_when:
    - การเรียกใช้ฮาร์เนสการเขียนโค้ดผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับการสนทนาบนช่องทางการรับส่งข้อความ
    - การผูกการสนทนาในช่องทางข้อความเข้ากับเซสชัน ACP แบบคงอยู่
    - การแก้ไขปัญหาแบ็กเอนด์ ACP, การเชื่อมต่อ Plugin หรือการส่งมอบผลลัพธ์การเติมข้อความให้สมบูรณ์
    - การเรียกใช้คำสั่ง /acp จากแชต
sidebarTitle: ACP agents
summary: เรียกใช้ฮาร์เนสการเขียนโค้ดภายนอก (Claude Code, Cursor, Gemini CLI, Codex ACP แบบระบุชัดเจน, OpenClaw ACP, OpenCode) ผ่านแบ็กเอนด์ ACP
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-05-02T10:30:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

เซสชัน [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
ช่วยให้ OpenClaw เรียกใช้ฮาร์เนสเขียนโค้ดภายนอก (เช่น Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI และฮาร์เนส
ACPX อื่นที่รองรับ) ผ่าน Plugin แบ็กเอนด์ ACP ได้

การสร้างเซสชัน ACP แต่ละครั้งจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

<Note>
**ACP คือเส้นทางฮาร์เนสภายนอก ไม่ใช่เส้นทาง Codex เริ่มต้น** Plugin
เซิร์ฟเวอร์แอป Codex แบบเนทีฟเป็นเจ้าของตัวควบคุม `/codex ...` และรันไทม์
แบบฝัง `agentRuntime.id: "codex"`; ACP เป็นเจ้าของตัวควบคุม
`/acp ...` และเซสชัน `sessions_spawn({ runtime: "acp" })`

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็นไคลเอนต์ MCP ภายนอก
โดยตรงไปยังบทสนทนาช่องทาง OpenClaw ที่มีอยู่ ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน ACP
</Note>

## ฉันต้องการหน้าใด?

| คุณต้องการ…                                                                                         | ใช้สิ่งนี้                              | หมายเหตุ                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ผูกหรือควบคุม Codex ในบทสนทนาปัจจุบัน                                                               | `/codex bind`, `/codex threads`         | เส้นทางเซิร์ฟเวอร์แอป Codex แบบเนทีฟเมื่อเปิดใช้ Plugin `codex`; รวมการตอบกลับแชตที่ผูกไว้ การส่งต่อรูปภาพ โมเดล/เร็ว/สิทธิ์ หยุด และตัวควบคุมการชี้นำ ACP เป็นทางสำรองที่ระบุชัดเจน |
| เรียกใช้ Claude Code, Gemini CLI, Codex ACP แบบระบุชัดเจน หรือฮาร์เนสภายนอกอื่น _ผ่าน_ OpenClaw     | หน้านี้                                 | เซสชันที่ผูกกับแชต, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, งานเบื้องหลัง, ตัวควบคุมรันไทม์                                                                                                  |
| เปิดเผยเซสชัน OpenClaw Gateway _เป็น_ เซิร์ฟเวอร์ ACP สำหรับเอดิเตอร์หรือไคลเอนต์                    | [`openclaw acp`](/th/cli/acp)              | โหมดบริดจ์ IDE/ไคลเอนต์คุย ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                                                                                                        |
| ใช้ AI CLI ภายในเครื่องซ้ำเป็นโมเดลสำรองแบบข้อความเท่านั้น                                           | [แบ็กเอนด์ CLI](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw ไม่มีตัวควบคุม ACP ไม่มีรันไทม์ฮาร์เนส                                                                                                                            |

## ใช้งานได้ทันทีหรือไม่?

ได้ หลังจากติดตั้ง Plugin รันไทม์ ACP อย่างเป็นทางการ:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ซอร์สเช็กเอาต์สามารถใช้ Plugin เวิร์กสเปซ `extensions/acpx` ภายในเครื่องได้หลังจาก
`pnpm install` เรียกใช้ `/acp doctor` เพื่อตรวจสอบความพร้อม

OpenClaw จะสอนเอเจนต์เกี่ยวกับการสร้าง ACP เฉพาะเมื่อ ACP **ใช้งานได้จริง**:
ต้องเปิดใช้ ACP, การดิสแพตช์ต้องไม่ถูกปิด, เซสชันปัจจุบันต้องไม่ถูกบล็อกด้วยแซนด์บ็อกซ์
และต้องโหลดแบ็กเอนด์รันไทม์แล้ว หากไม่ตรงตามเงื่อนไขเหล่านี้ Skills ของ Plugin ACP และ
คำแนะนำ ACP สำหรับ `sessions_spawn` จะยังถูกซ่อน เพื่อไม่ให้เอเจนต์แนะนำแบ็กเอนด์ที่ใช้งานไม่ได้

<AccordionGroup>
  <Accordion title="ข้อควรระวังในการเรียกใช้ครั้งแรก">
    - หากตั้งค่า `plugins.allow` ไว้ นั่นคือคลังรายการ Plugin แบบจำกัด และ **ต้อง** รวม `acpx`; มิฉะนั้นแบ็กเอนด์ ACP ที่ติดตั้งไว้จะถูกบล็อกโดยเจตนา และ `/acp doctor` จะรายงานรายการ allowlist ที่ขาดหาย
    - อะแดปเตอร์ Codex ACP ถูกจัดเตรียมมาพร้อมกับ Plugin `acpx` และจะเปิดใช้ภายในเครื่องเมื่อเป็นไปได้
    - อะแดปเตอร์ฮาร์เนสเป้าหมายอื่นอาจยังถูกดึงมาตามต้องการด้วย `npx` ในครั้งแรกที่คุณใช้
    - การยืนยันตัวตนของผู้ขายยังต้องมีอยู่บนโฮสต์สำหรับฮาร์เนสนั้น
    - หากโฮสต์ไม่มี npm หรือการเข้าถึงเครือข่าย การดึงอะแดปเตอร์ในการเรียกใช้ครั้งแรกจะล้มเหลวจนกว่าจะอุ่นแคชล่วงหน้าหรือติดตั้งอะแดปเตอร์ด้วยวิธีอื่น

  </Accordion>
  <Accordion title="ข้อกำหนดเบื้องต้นของรันไทม์">
    ACP เปิดใช้กระบวนการฮาร์เนสภายนอกจริง OpenClaw เป็นเจ้าของการกำหนดเส้นทาง
    สถานะงานเบื้องหลัง การส่งมอบ การผูก และนโยบาย; ฮาร์เนสเป็นเจ้าของการเข้าสู่ระบบผู้ให้บริการ
    แค็ตตาล็อกโมเดล พฤติกรรมระบบไฟล์ และเครื่องมือเนทีฟของตนเอง

    ก่อนโทษ OpenClaw ให้ตรวจสอบว่า:

    - `/acp doctor` รายงานแบ็กเอนด์ที่เปิดใช้และมีสุขภาพดี
    - id เป้าหมายได้รับอนุญาตโดย `acp.allowedAgents` เมื่อมีการตั้งค่า allowlist นั้น
    - คำสั่งฮาร์เนสเริ่มทำงานบนโฮสต์ Gateway ได้
    - มีการยืนยันตัวตนของผู้ให้บริการสำหรับฮาร์เนสนั้น (`claude`, `codex`, `gemini`, `opencode`, `droid` ฯลฯ)
    - โมเดลที่เลือกมีอยู่สำหรับฮาร์เนสนั้น — id โมเดลไม่สามารถใช้ข้ามฮาร์เนสได้
    - `cwd` ที่ร้องขอมีอยู่และเข้าถึงได้ หรือไม่ระบุ `cwd` แล้วให้แบ็กเอนด์ใช้ค่าเริ่มต้นของตน
    - โหมดสิทธิ์ตรงกับงาน เซสชันแบบไม่โต้ตอบคลิกพรอมป์สิทธิ์เนทีฟไม่ได้ ดังนั้นการรันเขียนโค้ดที่เน้นเขียน/ดำเนินการมักต้องใช้โปรไฟล์สิทธิ์ ACPX ที่เดินหน้าต่อแบบไม่มีหัวได้

  </Accordion>
</AccordionGroup>

เครื่องมือ Plugin ของ OpenClaw และเครื่องมือ OpenClaw ในตัว **จะไม่** ถูกเปิดเผยต่อ
ฮาร์เนส ACP โดยค่าเริ่มต้น เปิดใช้บริดจ์ MCP แบบระบุชัดเจนใน
[เอเจนต์ ACP — การตั้งค่า](/th/tools/acp-agents-setup) เฉพาะเมื่อฮาร์เนส
ควรเรียกเครื่องมือเหล่านั้นโดยตรง

## เป้าหมายฮาร์เนสที่รองรับ

ด้วยแบ็กเอนด์ `acpx` ให้ใช้ id ฮาร์เนสเหล่านี้เป็นเป้าหมาย `/acp spawn <id>`
หรือ `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| id ฮาร์เนส | แบ็กเอนด์ทั่วไป                               | หมายเหตุ                                                                                   |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `claude`   | อะแดปเตอร์ Claude Code ACP                    | ต้องมีการยืนยันตัวตน Claude Code บนโฮสต์                                                   |
| `codex`    | อะแดปเตอร์ Codex ACP                          | ทางสำรอง ACP แบบระบุชัดเจนเท่านั้น เมื่อใช้ `/codex` แบบเนทีฟไม่ได้หรือมีการร้องขอ ACP |
| `copilot`  | อะแดปเตอร์ GitHub Copilot ACP                 | ต้องมีการยืนยันตัวตน Copilot CLI/รันไทม์                                                   |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | แทนที่คำสั่ง acpx หากการติดตั้งภายในเครื่องเปิดเผยจุดเข้า ACP ที่แตกต่างกัน             |
| `droid`    | Factory Droid CLI                              | ต้องมีการยืนยันตัวตน Factory/Droid หรือ `FACTORY_API_KEY` ในสภาพแวดล้อมของฮาร์เนส        |
| `gemini`   | อะแดปเตอร์ Gemini CLI ACP                     | ต้องมีการยืนยันตัวตน Gemini CLI หรือการตั้งค่า API key                                    |
| `iflow`    | iFlow CLI                                      | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                  |
| `kilocode` | Kilo Code CLI                                  | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                  |
| `kimi`     | Kimi/Moonshot CLI                              | ต้องมีการยืนยันตัวตน Kimi/Moonshot บนโฮสต์                                                 |
| `kiro`     | Kiro CLI                                       | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                  |
| `opencode` | อะแดปเตอร์ OpenCode ACP                       | ต้องมีการยืนยันตัวตน OpenCode CLI/ผู้ให้บริการ                                            |
| `openclaw` | บริดจ์ OpenClaw Gateway ผ่าน `openclaw acp`   | ทำให้ฮาร์เนสที่รองรับ ACP คุยกลับไปยังเซสชัน OpenClaw Gateway ได้                       |
| `pi`       | Pi/รันไทม์ OpenClaw แบบฝัง                    | ใช้สำหรับการทดลองฮาร์เนสแบบเนทีฟของ OpenClaw                                              |
| `qwen`     | Qwen Code / Qwen CLI                           | ต้องมีการยืนยันตัวตนที่เข้ากันได้กับ Qwen บนโฮสต์                                        |

สามารถกำหนดค่าเอเลียสเอเจนต์ acpx แบบกำหนดเองใน acpx เองได้ แต่นโยบาย OpenClaw
ยังคงตรวจสอบ `acp.allowedAgents` และการแมป
`agents.list[].runtime.acp.agent` ใด ๆ ก่อนดิสแพตช์

## คู่มือปฏิบัติสำหรับผู้ปฏิบัติการ

โฟลว์ `/acp` อย่างรวดเร็วจากแชต:

<Steps>
  <Step title="สร้าง">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` หรือระบุชัดเจนเป็น
    `/acp spawn codex --bind here`
  </Step>
  <Step title="ทำงาน">
    ดำเนินการต่อในบทสนทนาหรือเธรดที่ผูกไว้ (หรือระบุเป้าหมายคีย์เซสชันอย่างชัดเจน)
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
    - การสร้างจะสร้างหรือกลับมาใช้เซสชันรันไทม์ ACP ต่อ บันทึกเมตาดาตา ACP ในที่เก็บเซสชัน OpenClaw และอาจสร้างงานเบื้องหลังเมื่อรันนั้นมีพาเรนต์เป็นเจ้าของ
    - เซสชัน ACP ที่พาเรนต์เป็นเจ้าของจะถูกมองเป็นงานเบื้องหลัง แม้เมื่อเซสชันรันไทม์เป็นแบบคงอยู่; การเสร็จสิ้นและการส่งมอบข้ามพื้นผิวจะผ่านตัวแจ้งงานพาเรนต์ แทนที่จะทำตัวเหมือนเซสชันแชตปกติที่ผู้ใช้เห็น
    - การบำรุงรักษางานจะปิดเซสชัน ACP แบบครั้งเดียวที่พาเรนต์เป็นเจ้าของซึ่งสิ้นสุดแล้วหรือกำพร้า เซสชัน ACP แบบคงอยู่จะถูกเก็บไว้ขณะที่ยังมีการผูกบทสนทนาที่ใช้งานอยู่; เซสชันแบบคงอยู่ที่ค้างโดยไม่มีการผูกที่ใช้งานอยู่จะถูกปิด เพื่อไม่ให้กลับมาใช้ต่ออย่างเงียบ ๆ หลังจากงานที่เป็นเจ้าของเสร็จแล้วหรือเรคคอร์ดงานหายไป
    - ข้อความติดตามผลที่ผูกไว้จะไปยังเซสชัน ACP โดยตรงจนกว่าการผูกจะถูกปิด เลิกโฟกัส รีเซ็ต หรือหมดอายุ
    - คำสั่ง Gateway อยู่ภายในเครื่อง `/acp ...`, `/status` และ `/unfocus` จะไม่ถูกส่งเป็นข้อความพรอมป์ปกติไปยังฮาร์เนส ACP ที่ผูกไว้
    - `cancel` ยกเลิกเทิร์นที่ใช้งานอยู่เมื่อแบ็กเอนด์รองรับการยกเลิก; ไม่ได้ลบการผูกหรือเมตาดาตาเซสชัน
    - `close` สิ้นสุดเซสชัน ACP จากมุมมองของ OpenClaw และลบการผูก ฮาร์เนสอาจยังเก็บประวัติอัปสตรีมของตนเองไว้หากรองรับการกลับมาใช้ต่อ
    - เวิร์กเกอร์รันไทม์ที่ไม่ได้ใช้งานมีสิทธิ์ถูกล้างหลังจาก `acp.runtime.ttlMinutes`; เมตาดาตาเซสชันที่จัดเก็บไว้ยังพร้อมใช้งานสำหรับ `/acp sessions`

  </Accordion>
  <Accordion title="กฎการกำหนดเส้นทาง Codex แบบเนทีฟ">
    ตัวกระตุ้นภาษาธรรมชาติที่ควรกำหนดเส้นทางไปยัง **Plugin Codex แบบเนทีฟ**
    เมื่อเปิดใช้:

    - "ผูกช่อง Discord นี้กับ Codex"
    - "แนบแชตนี้กับเธรด Codex `<id>`"
    - "แสดงเธรด Codex แล้วผูกอันนี้"

    การผูกบทสนทนา Codex แบบเนทีฟเป็นเส้นทางควบคุมแชตเริ่มต้น
    เครื่องมือไดนามิกของ OpenClaw ยังคงดำเนินการผ่าน OpenClaw ขณะที่
    เครื่องมือเนทีฟของ Codex เช่น shell/apply-patch ดำเนินการภายใน Codex
    สำหรับเหตุการณ์เครื่องมือเนทีฟของ Codex, OpenClaw จะแทรกรีเลย์ฮุกเนทีฟต่อเทิร์น
    เพื่อให้ฮุก Plugin บล็อก `before_tool_call`, สังเกต
    `after_tool_call` และกำหนดเส้นทางเหตุการณ์ Codex `PermissionRequest`
    ผ่านการอนุมัติของ OpenClaw ได้ ฮุก Codex `Stop` จะถูกรีเลย์ไปยัง
    OpenClaw `before_agent_finalize` ซึ่ง Plugin สามารถร้องขอการส่งโมเดลอีกครั้ง
    ก่อนที่ Codex จะสรุปคำตอบของตน รีเลย์นี้ยังคงตั้งใจให้อนุรักษนิยม:
    ไม่เปลี่ยนอาร์กิวเมนต์เครื่องมือเนทีฟของ Codex หรือเขียนเรคคอร์ดเธรด Codex ใหม่
    ใช้ ACP แบบระบุชัดเจนเฉพาะเมื่อคุณต้องการโมเดลรันไทม์/เซสชัน ACP
    ขอบเขตการรองรับ Codex แบบฝังมีเอกสารไว้ใน
    [สัญญาการรองรับฮาร์เนส Codex v1](/th/plugins/codex-harness#v1-support-contract)

  </Accordion>
  <Accordion title="สรุปย่อการเลือกโมเดล / ผู้ให้บริการ / รันไทม์">
    - `openai-codex/*` — เส้นทาง PI Codex OAuth/การสมัครสมาชิก
    - `openai/*` plus `agentRuntime.id: "codex"` — รันไทม์แบบฝังของเซิร์ฟเวอร์แอป Codex ดั้งเดิม
    - `/codex ...` — การควบคุมการสนทนา Codex ดั้งเดิม
    - `/acp ...` or `runtime: "acp"` — การควบคุม ACP/acpx แบบชัดเจน

  </Accordion>
  <Accordion title="ทริกเกอร์ภาษาธรรมชาติสำหรับการกำหนดเส้นทาง ACP">
    ทริกเกอร์ที่ควรกำหนดเส้นทางไปยังรันไทม์ ACP:

    - "เรียกใช้งานนี้เป็นเซสชัน Claude Code ACP แบบครั้งเดียว แล้วสรุปผลลัพธ์"
    - "ใช้ Gemini CLI สำหรับงานนี้ในเธรด แล้วเก็บการติดตามผลไว้ในเธรดเดียวกันนั้น"
    - "เรียกใช้ Codex ผ่าน ACP ในเธรดเบื้องหลัง"

    OpenClaw เลือก `runtime: "acp"`, resolve harness `agentId`,
    ผูกกับการสนทนาหรือเธรดปัจจุบันเมื่อรองรับ และ
    กำหนดเส้นทางการติดตามผลไปยังเซสชันนั้นจนกว่าจะปิด/หมดอายุ Codex จะ
    ใช้เส้นทางนี้เฉพาะเมื่อระบุ ACP/acpx อย่างชัดเจน หรือ Plugin Codex
    ดั้งเดิมไม่พร้อมใช้งานสำหรับการดำเนินการที่ร้องขอ

    สำหรับ `sessions_spawn`, `runtime: "acp"` จะถูกประกาศเฉพาะเมื่อเปิดใช้งาน ACP,
    ผู้ร้องขอไม่ได้อยู่ใน sandbox และมีการโหลด backend รันไทม์ ACP แล้ว
    `acp.dispatch.enabled=false` จะหยุดการ dispatch เธรด ACP อัตโนมัติชั่วคราว
    แต่จะไม่ซ่อนหรือบล็อกการเรียก
    `sessions_spawn({ runtime: "acp" })` แบบชัดเจน โดยจะกำหนดเป้าหมายไปยัง id ของ ACP harness เช่น `codex`,
    `claude`, `droid`, `gemini`, หรือ `opencode` อย่าส่ง id ของ agent config
    OpenClaw ปกติจาก `agents_list` เว้นแต่ว่ารายการนั้นจะถูกกำหนดค่า
    อย่างชัดเจนด้วย `agents.list[].runtime.type="acp"`;
    มิฉะนั้นให้ใช้รันไทม์ sub-agent เริ่มต้น เมื่อ agent ของ OpenClaw
    ถูกกำหนดค่าด้วย `runtime.type="acp"`, OpenClaw จะใช้
    `runtime.acp.agent` เป็น id ของ harness ชั้นใต้

  </Accordion>
</AccordionGroup>

## ACP เทียบกับ sub-agents

ใช้ ACP เมื่อคุณต้องการรันไทม์ harness ภายนอก ใช้ **เซิร์ฟเวอร์แอป Codex
ดั้งเดิม** สำหรับการผูก/ควบคุมการสนทนา Codex เมื่อเปิดใช้งาน Plugin `codex`
ใช้ **sub-agents** เมื่อคุณต้องการการเรียกใช้งานแบบมอบหมายที่เป็นแบบดั้งเดิมของ OpenClaw

| พื้นที่       | เซสชัน ACP                            | การเรียกใช้ sub-agent               |
| ------------- | ------------------------------------- | ---------------------------------- |
| รันไทม์       | Plugin backend ACP (เช่น acpx)        | รันไทม์ sub-agent ดั้งเดิมของ OpenClaw |
| คีย์เซสชัน    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| คำสั่งหลัก    | `/acp ...`                            | `/subagents ...`                   |
| เครื่องมือ spawn | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn` (รันไทม์เริ่มต้น) |

ดูเพิ่มเติมที่ [Sub-agents](/th/tools/subagents)

## วิธีที่ ACP เรียกใช้ Claude Code

สำหรับ Claude Code ผ่าน ACP, stack คือ:

1. control plane เซสชัน ACP ของ OpenClaw
2. Plugin รันไทม์ `@openclaw/acpx` อย่างเป็นทางการ
3. อะแดปเตอร์ Claude ACP
4. กลไกรันไทม์/เซสชันฝั่ง Claude

ACP Claude เป็น **เซสชัน harness** ที่มีการควบคุม ACP, การ resume เซสชัน,
การติดตามงานเบื้องหลัง และการผูกการสนทนา/เธรดแบบเลือกได้

backend CLI เป็นรันไทม์สำรองในเครื่องแบบข้อความล้วนที่แยกต่างหาก — ดู
[CLI Backends](/th/gateway/cli-backends)

สำหรับผู้ปฏิบัติการ กฎเชิงปฏิบัติคือ:

- **ต้องการ `/acp spawn`, เซสชันที่ผูกได้, การควบคุมรันไทม์ หรืองาน harness แบบคงอยู่?** ใช้ ACP
- **ต้องการ fallback ข้อความในเครื่องแบบง่ายผ่าน CLI ดิบ?** ใช้ backend CLI

## เซสชันที่ผูกไว้

### โมเดลทางความคิด

- **พื้นผิวแชต** — ที่ที่ผู้คนสนทนาต่อเนื่อง (ช่อง Discord, หัวข้อ Telegram, แชต iMessage)
- **เซสชัน ACP** — สถานะรันไทม์ Codex/Claude/Gemini ที่คงทนซึ่ง OpenClaw กำหนดเส้นทางไปหา
- **เธรด/หัวข้อลูก** — พื้นผิวการรับส่งข้อความเพิ่มเติมแบบเลือกได้ที่สร้างโดย `--thread ...` เท่านั้น
- **workspace รันไทม์** — ตำแหน่งระบบไฟล์ (`cwd`, repo checkout, workspace backend) ที่ harness ทำงาน เป็นอิสระจากพื้นผิวแชต

### การผูกกับการสนทนาปัจจุบัน

`/acp spawn <harness> --bind here` จะ pin การสนทนาปัจจุบันเข้ากับ
เซสชัน ACP ที่ spawn — ไม่มีเธรดลูก ใช้พื้นผิวแชตเดิม OpenClaw ยังคง
เป็นเจ้าของ transport, auth, safety และ delivery ข้อความติดตามผลใน
การสนทนานั้นจะถูกกำหนดเส้นทางไปยังเซสชันเดียวกัน; `/new` และ `/reset` reset
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
  <Accordion title="กฎการผูกและความเป็นเอกเทศ">
    - `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้
    - `--bind here` ใช้ได้เฉพาะกับ channels ที่ประกาศความสามารถในการผูกการสนทนาปัจจุบัน; มิฉะนั้น OpenClaw จะส่งข้อความไม่รองรับที่ชัดเจน การผูกจะคงอยู่ข้ามการ restart Gateway
    - บน Discord, `spawnSessions` ควบคุมการสร้างเธรดลูกสำหรับ `--thread auto|here` — ไม่ใช่ `--bind here`
    - หากคุณ spawn ไปยัง agent ACP อื่นโดยไม่มี `--cwd`, OpenClaw จะรับ workspace ของ **agent เป้าหมาย** ตามค่าเริ่มต้น path ที่รับมาแล้วขาดหาย (`ENOENT`/`ENOTDIR`) จะ fallback ไปยังค่าเริ่มต้นของ backend; ข้อผิดพลาดการเข้าถึงอื่นๆ (เช่น `EACCES`) จะแสดงเป็นข้อผิดพลาดการ spawn
    - คำสั่งจัดการ Gateway จะยังคงอยู่ในเครื่องในบทสนทนาที่ผูกไว้ — คำสั่ง `/acp ...` จะถูกจัดการโดย OpenClaw แม้ว่าข้อความติดตามผลปกติจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้; `/status` และ `/unfocus` จะยังคงอยู่ในเครื่องด้วยเมื่อเปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

  </Accordion>
  <Accordion title="เซสชันที่ผูกกับเธรด">
    เมื่อเปิดใช้งานการผูกเธรดสำหรับอะแดปเตอร์ channel:

    - OpenClaw ผูกเธรดกับเซสชัน ACP เป้าหมาย
    - ข้อความติดตามผลในเธรดนั้นถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้
    - เอาต์พุต ACP ถูกส่งกลับไปยังเธรดเดียวกัน
    - unfocus/close/archive/idle-timeout หรือการหมดอายุ max-age จะลบการผูก
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, และ `/unfocus` เป็นคำสั่ง Gateway ไม่ใช่ prompt ไปยัง ACP harness

    feature flags ที่จำเป็นสำหรับ ACP ที่ผูกกับเธรด:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` เปิดอยู่ตามค่าเริ่มต้น (ตั้งเป็น `false` เพื่อหยุดการ dispatch เธรด ACP อัตโนมัติชั่วคราว; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงทำงาน)
    - เปิดใช้งานการ spawn เซสชันเธรดของ channel-adapter (ค่าเริ่มต้น: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    การรองรับการผูกเธรดขึ้นกับอะแดปเตอร์แต่ละตัว หากอะแดปเตอร์ channel
    ที่ใช้งานอยู่ไม่รองรับการผูกเธรด OpenClaw จะส่งข้อความ
    ไม่รองรับ/ไม่พร้อมใช้งานที่ชัดเจน

  </Accordion>
  <Accordion title="channels ที่รองรับเธรด">
    - อะแดปเตอร์ channel ใดๆ ที่เปิดเผยความสามารถในการผูกเซสชัน/เธรด
    - การรองรับในตัวปัจจุบัน: เธรด/ช่องของ **Discord**, หัวข้อของ **Telegram** (หัวข้อฟอรัมในกลุ่ม/supergroup และหัวข้อ DM)
    - Plugin channels สามารถเพิ่มการรองรับผ่านอินเทอร์เฟซการผูกเดียวกัน

  </Accordion>
</AccordionGroup>

## การผูก channel แบบคงอยู่

สำหรับเวิร์กโฟลว์ที่ไม่ใช่แบบชั่วคราว ให้กำหนดค่าการผูก ACP แบบคงอยู่ใน
รายการระดับบนสุด `bindings[]`

### โมเดลการผูก

<ParamField path="bindings[].type" type='"acp"'>
  ทำเครื่องหมายการผูกการสนทนา ACP แบบคงอยู่
</ParamField>
<ParamField path="bindings[].match" type="object">
  ระบุการสนทนาเป้าหมาย รูปแบบแยกตาม channel:

- **ช่อง/เธรด Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **หัวข้อฟอรัม Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/กลุ่ม BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` แนะนำให้ใช้ `chat_id:*` หรือ `chat_identifier:*` สำหรับการผูกกลุ่มที่เสถียร
- **DM/กลุ่ม iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` แนะนำให้ใช้ `chat_id:*` สำหรับการผูกกลุ่มที่เสถียร

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  id ของ agent OpenClaw ที่เป็นเจ้าของ
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  การ override ACP แบบเลือกได้
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  label แบบเลือกได้ที่แสดงต่อผู้ปฏิบัติการ
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์แบบเลือกได้
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  การ override backend แบบเลือกได้
</ParamField>

### ค่าเริ่มต้นของรันไทม์ต่อ agent

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้น ACP หนึ่งครั้งต่อ agent:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id ของ harness เช่น `codex` หรือ `claude`)
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

### พฤติกรรม

- OpenClaw ตรวจสอบให้แน่ใจว่าเซสชัน ACP ที่กำหนดค่าไว้มีอยู่ก่อนใช้งาน
- ข้อความใน channel หรือหัวข้อนั้นถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่กำหนดค่าไว้
- ในบทสนทนาที่ผูกไว้, `/new` และ `/reset` reset คีย์เซสชัน ACP เดิมในที่เดิม
- การผูกรันไทม์ชั่วคราว (เช่น ที่สร้างโดยโฟลว์ thread-focus) ยังคงมีผลเมื่อมีอยู่
- สำหรับการ spawn ACP ข้าม agent โดยไม่มี `cwd` ชัดเจน OpenClaw จะรับ workspace ของ agent เป้าหมายจาก config agent
- path workspace ที่รับมาแล้วขาดหายจะ fallback ไปยัง cwd เริ่มต้นของ backend; ความล้มเหลวในการเข้าถึงที่ไม่ใช่การขาดหายจะแสดงเป็นข้อผิดพลาดการ spawn

## เริ่มเซสชัน ACP

มีสองวิธีในการเริ่มเซสชัน ACP:

<Tabs>
  <Tab title="จาก sessions_spawn">
    ใช้ `runtime: "acp"` เพื่อเริ่มเซสชัน ACP จาก turn ของ agent หรือ
    การเรียก tool

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
    `thread: true` เพื่อเก็บการสนทนาที่ผูกไว้แบบถาวร
    </Note>

  </Tab>
  <Tab title="From /acp command">
    ใช้ `/acp spawn` เพื่อให้ผู้ปฏิบัติงานควบคุมจากแชตได้อย่างชัดเจน

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
  พรอมต์เริ่มต้นที่ส่งไปยังเซสชัน ACP
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ต้องเป็น `"acp"` สำหรับเซสชัน ACP
</ParamField>
<ParamField path="agentId" type="string">
  รหัสฮาร์เนสเป้าหมาย ACP หากตั้งค่าไว้ จะถอยไปใช้ `acp.defaultAgent`
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  ขอขั้นตอนการผูกเธรดในที่ที่รองรับ
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` เป็นแบบครั้งเดียว ส่วน `"session"` เป็นแบบถาวร หากมี `thread: true` และ
  ละ `mode` ไว้ OpenClaw อาจใช้ค่าเริ่มต้นเป็นลักษณะถาวรตาม
  เส้นทางรันไทม์ `mode: "session"` ต้องมี `thread: true`
</ParamField>
<ParamField path="cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์ที่ร้องขอ (ตรวจสอบโดยนโยบายแบ็กเอนด์/รันไทม์)
  หากละไว้ การสร้าง ACP จะสืบทอดเวิร์กสเปซของตัวแทนเป้าหมาย
  เมื่อมีการกำหนดค่าไว้ พาธที่สืบทอดแต่ไม่มีอยู่จะถอยไปใช้ค่าเริ่มต้นของแบ็กเอนด์
  ขณะที่ข้อผิดพลาดการเข้าถึงจริงจะถูกส่งกลับ
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับที่แสดงต่อผู้ปฏิบัติงาน ซึ่งใช้ในข้อความเซสชัน/แบนเนอร์
</ParamField>
<ParamField path="resumeSessionId" type="string">
  กลับมาใช้เซสชัน ACP ที่มีอยู่แทนการสร้างเซสชันใหม่
  ตัวแทนจะเล่นประวัติการสนทนาซ้ำผ่าน `session/load` ต้องมี
  `runtime: "acp"`
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` สตรีมสรุปความคืบหน้าการรัน ACP เริ่มต้นกลับไปยัง
  เซสชันผู้ร้องขอในรูปแบบเหตุการณ์ระบบ การตอบสนองที่ยอมรับได้รวมถึง
  `streamLogPath` ที่ชี้ไปยังบันทึก JSONL ที่มีขอบเขตตามเซสชัน
  (`<sessionId>.acp-stream.jsonl`) ซึ่งคุณสามารถติดตามเพื่อดูประวัติการถ่ายทอดทั้งหมดได้
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ยกเลิกเทิร์นลูก ACP หลังจาก N วินาที `0` จะคงเทิร์นไว้บน
  เส้นทางไม่จำกัดเวลาของ Gateway ค่าเดียวกันนี้จะถูกใช้กับการรันของ Gateway
  และรันไทม์ ACP เพื่อไม่ให้ฮาร์เนสที่ค้างหรือใช้โควตาหมด
  ครอบครองเลนตัวแทนแม่อย่างไม่มีกำหนด
</ParamField>
<ParamField path="model" type="string">
  การแทนที่โมเดลอย่างชัดเจนสำหรับเซสชันลูก ACP การสร้าง Codex ACP
  จะปรับ refs ของ OpenClaw Codex เช่น `openai-codex/gpt-5.4` ให้เป็นค่ากำหนดเริ่มต้นของ Codex
  ACP ก่อน `session/new`; รูปแบบ slash เช่น
  `openai-codex/gpt-5.4/high` จะตั้งค่าระดับความพยายามในการให้เหตุผลของ Codex ACP ด้วย
  ฮาร์เนสอื่นต้องประกาศ ACP `models` และรองรับ
  `session/set_model`; มิฉะนั้น OpenClaw/acpx จะล้มเหลวอย่างชัดเจนแทนการ
  ถอยกลับไปใช้ค่าเริ่มต้นของตัวแทนเป้าหมายอย่างเงียบ ๆ
</ParamField>
<ParamField path="thinking" type="string">
  ระดับความพยายามในการคิด/ให้เหตุผลอย่างชัดเจน สำหรับ Codex ACP, `minimal` จะแมปเป็น
  ความพยายามต่ำ, `low`/`medium`/`high`/`xhigh` จะแมปโดยตรง และ `off`
  จะละการแทนที่การเริ่มต้นของระดับความพยายามในการให้เหตุผล
</ParamField>

## โหมดการผูกและเธรดของการสร้าง

<Tabs>
  <Tab title="--bind here|off">
    | โหมด   | พฤติกรรม                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | ผูกการสนทนาที่ใช้งานอยู่ปัจจุบันในตำแหน่งเดิม; ล้มเหลวหากไม่มีการสนทนาที่ใช้งานอยู่ |
    | `off`  | ไม่สร้างการผูกกับการสนทนาปัจจุบัน                          |

    หมายเหตุ:

    - `--bind here` เป็นเส้นทางผู้ปฏิบัติงานที่ง่ายที่สุดสำหรับ "ทำให้ช่องหรือแชตนี้มี Codex รองรับ"
    - `--bind here` ไม่สร้างเธรดลูก
    - `--bind here` ใช้ได้เฉพาะบนช่องที่เปิดเผยการรองรับการผูกการสนทนาปัจจุบัน
    - ไม่สามารถรวม `--bind` และ `--thread` ในการเรียก `/acp spawn` เดียวกันได้

  </Tab>
  <Tab title="--thread auto|here|off">
    | โหมด   | พฤติกรรม                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | เมื่ออยู่ในเธรดที่ใช้งานอยู่: ผูกเธรดนั้น นอกเธรด: สร้าง/ผูกเธรดลูกเมื่อรองรับ |
    | `here` | ต้องมีเธรดที่ใช้งานอยู่ปัจจุบัน; ล้มเหลวหากไม่ได้อยู่ในเธรด                                                  |
    | `off`  | ไม่มีการผูก เซสชันเริ่มต้นแบบไม่ถูกผูก                                                                 |

    หมายเหตุ:

    - บนพื้นผิวที่ไม่รองรับการผูกเธรด พฤติกรรมเริ่มต้นจะเทียบเท่า `off`
    - การสร้างแบบผูกกับเธรดต้องการการรองรับจากนโยบายช่อง:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - ใช้ `--bind here` เมื่อต้องการตรึงการสนทนาปัจจุบันโดยไม่สร้างเธรดลูก

  </Tab>
</Tabs>

## โมเดลการส่งมอบ

เซสชัน ACP อาจเป็นเวิร์กสเปซแบบโต้ตอบหรือ
งานเบื้องหลังที่แม่เป็นเจ้าของก็ได้ เส้นทางการส่งมอบขึ้นอยู่กับรูปแบบนั้น

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    เซสชันแบบโต้ตอบมีไว้เพื่อคุยต่อบนพื้นผิวแชตที่มองเห็นได้:

    - `/acp spawn ... --bind here` ผูกการสนทนาปัจจุบันเข้ากับเซสชัน ACP
    - `/acp spawn ... --thread ...` ผูกเธรด/หัวข้อของช่องเข้ากับเซสชัน ACP
    - `bindings[].type="acp"` ที่กำหนดค่าแบบถาวรจะกำหนดเส้นทางการสนทนาที่ตรงกันไปยังเซสชัน ACP เดียวกัน

    ข้อความติดตามผลในการสนทนาที่ผูกไว้จะถูกกำหนดเส้นทางโดยตรงไปยัง
    เซสชัน ACP และเอาต์พุต ACP จะถูกส่งกลับไปยัง
    ช่อง/เธรด/หัวข้อเดียวกันนั้น

    สิ่งที่ OpenClaw ส่งไปยังฮาร์เนส:

    - การติดตามผลที่ผูกไว้ตามปกติจะถูกส่งเป็นข้อความพรอมต์ พร้อมไฟล์แนบเฉพาะเมื่อฮาร์เนส/แบ็กเอนด์รองรับ
    - คำสั่งจัดการ `/acp` และคำสั่ง Gateway ภายในเครื่องจะถูกดักไว้ก่อนส่งต่อไปยัง ACP
    - เหตุการณ์การเสร็จสิ้นที่สร้างโดยรันไทม์จะถูกทำให้เป็นรูปธรรมตามเป้าหมาย ตัวแทน OpenClaw จะได้รับซองบริบทภายในของรันไทม์ OpenClaw; ฮาร์เนส ACP ภายนอกจะได้รับพรอมต์ธรรมดาพร้อมผลลัพธ์ลูกและคำสั่ง ซองดิบ `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ไม่ควรถูกส่งไปยังฮาร์เนสภายนอกหรือคงอยู่เป็นข้อความทรานสคริปต์ผู้ใช้ ACP
    - รายการทรานสคริปต์ ACP ใช้ข้อความทริกเกอร์ที่ผู้ใช้เห็นหรือพรอมต์การเสร็จสิ้นธรรมดา เมทาดาทาเหตุการณ์ภายในจะคงเป็นโครงสร้างใน OpenClaw เมื่อเป็นไปได้ และไม่ถือเป็นเนื้อหาแชตที่ผู้ใช้เขียน

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    เซสชัน ACP แบบครั้งเดียวที่สร้างโดยการรันของตัวแทนอื่นเป็นลูกเบื้องหลัง
    คล้ายกับตัวแทนย่อย:

    - แม่ขอให้ทำงานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
    - ลูกทำงานในเซสชันฮาร์เนส ACP ของตัวเอง
    - เทิร์นลูกทำงานบนเลนเบื้องหลังเดียวกับที่ใช้โดยการสร้างตัวแทนย่อยแบบเนทีฟ ดังนั้นฮาร์เนส ACP ที่ช้าจะไม่บล็อกงานเซสชันหลักอื่นที่ไม่เกี่ยวข้อง
    - รายงานการเสร็จสิ้นกลับผ่านเส้นทางประกาศการเสร็จสิ้นของงาน OpenClaw แปลงเมทาดาทาการเสร็จสิ้นภายในเป็นพรอมต์ ACP ธรรมดาก่อนส่งไปยังฮาร์เนสภายนอก เพื่อให้ฮาร์เนสไม่เห็นตัวทำเครื่องหมายบริบทรันไทม์เฉพาะ OpenClaw
    - แม่เขียนผลลัพธ์ลูกใหม่ด้วยเสียงผู้ช่วยตามปกติเมื่อคำตอบที่แสดงต่อผู้ใช้มีประโยชน์

    **อย่า** ถือว่าเส้นทางนี้เป็นแชตแบบเพียร์ทูเพียร์ระหว่างแม่
    กับลูก ลูกมีช่องทางการเสร็จสิ้นกลับไปยัง
    แม่อยู่แล้ว

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` สามารถกำหนดเป้าหมายไปยังอีกเซสชันหลังสร้างได้ สำหรับเซสชันเพียร์ทั่วไป
    OpenClaw ใช้เส้นทางติดตามผลแบบตัวแทนถึงตัวแทน (A2A)
    หลังจากแทรกข้อความ:

    - รอการตอบกลับจากเซสชันเป้าหมาย
    - อนุญาตให้ผู้ร้องขอและเป้าหมายแลกเปลี่ยนเทิร์นติดตามผลจำนวนจำกัดได้ตามต้องการ
    - ขอให้เป้าหมายสร้างข้อความประกาศ
    - ส่งประกาศนั้นไปยังช่องหรือเธรดที่มองเห็นได้

    เส้นทาง A2A นั้นเป็นทางสำรองสำหรับการส่งแบบเพียร์เมื่อผู้ส่งต้องการ
    การติดตามผลที่มองเห็นได้ เส้นทางนี้ยังเปิดใช้งานเมื่อเซสชันที่ไม่เกี่ยวข้อง
    สามารถเห็นและส่งข้อความถึงเป้าหมาย ACP ได้ เช่น ภายใต้การตั้งค่า
    `tools.sessions.visibility` แบบกว้าง

    OpenClaw จะข้ามการติดตามผล A2A เฉพาะเมื่อผู้ร้องขอเป็น
    แม่ของลูก ACP แบบครั้งเดียวที่แม่เป็นเจ้าของเอง ในกรณีนั้น
    การรัน A2A ทับบนการเสร็จสิ้นของงานอาจปลุกแม่ด้วย
    ผลลัพธ์ของลูก ส่งต่อคำตอบของแม่กลับเข้าไปในลูก และ
    สร้างลูปสะท้อนแม่/ลูก ผลลัพธ์ `sessions_send` รายงาน
    `delivery.status="skipped"` สำหรับกรณีลูกที่เป็นเจ้าของนั้น เพราะเส้นทาง
    การเสร็จสิ้นรับผิดชอบผลลัพธ์อยู่แล้ว

  </Accordion>
  <Accordion title="Resume an existing session">
    ใช้ `resumeSessionId` เพื่อดำเนินเซสชัน ACP ก่อนหน้าต่อแทนการ
    เริ่มใหม่ ตัวแทนจะเล่นประวัติการสนทนาซ้ำผ่าน
    `session/load` จึงกลับมาทำต่อพร้อมบริบทเต็มของสิ่งที่เกิดขึ้นก่อนหน้า

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    กรณีใช้งานทั่วไป:

    - ส่งต่อเซสชัน Codex จากแล็ปท็อปไปยังโทรศัพท์ของคุณ — บอกให้ตัวแทนทำต่อจากจุดที่คุณค้างไว้
    - ดำเนินเซสชันเขียนโค้ดที่คุณเริ่มแบบโต้ตอบใน CLI ต่อ โดยตอนนี้รันแบบไม่มีส่วนหัวผ่านตัวแทนของคุณ
    - กลับมาทำงานที่ถูกขัดจังหวะจากการรีสตาร์ต Gateway หรือการหมดเวลาจากความไม่ใช้งาน

    หมายเหตุ:

    - `resumeSessionId` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; รันไทม์ตัวแทนย่อยเริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `streamTo` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; รันไทม์ตัวแทนย่อยเริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `resumeSessionId` เป็นรหัสกลับมาใช้ต่อของ ACP/ฮาร์เนสภายในโฮสต์ ไม่ใช่คีย์เซสชันช่องของ OpenClaw; OpenClaw ยังคงตรวจนโยบายการสร้าง ACP และนโยบายตัวแทนเป้าหมายก่อนส่งต่อ ขณะที่แบ็กเอนด์หรือฮาร์เนส ACP เป็นเจ้าของการอนุญาตสำหรับการโหลดรหัสต้นทางนั้น
    - `resumeSessionId` กู้คืนประวัติการสนทนา ACP ต้นทาง; `thread` และ `mode` ยังคงใช้ตามปกติกับเซสชัน OpenClaw ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังต้องมี `thread: true`
    - ตัวแทนเป้าหมายต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
    - หากไม่พบรหัสเซสชัน การสร้างจะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน — ไม่มีการถอยไปสร้างเซสชันใหม่อย่างเงียบ ๆ

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    หลังจาก deploy Gateway แล้ว ให้รันการตรวจสอบสดแบบครบวงจรแทนการ
    เชื่อเพียง unit test:

    1. ตรวจสอบเวอร์ชัน Gateway ที่ deploy แล้วและ commit บนโฮสต์เป้าหมาย
    2. เปิดเซสชันบริดจ์ ACPX ชั่วคราวไปยังตัวแทนสด
    3. ขอให้ตัวแทนนั้นเรียก `sessions_spawn` ด้วย `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` และงาน `Reply with exactly LIVE-ACP-SPAWN-OK`
    4. ตรวจสอบ `accepted=yes`, `childSessionKey` จริง และไม่มีข้อผิดพลาดจากตัวตรวจสอบ
    5. ล้างเซสชันบริดจ์ชั่วคราว

    คงเกตไว้ที่ `mode: "run"` และข้าม `streamTo: "parent"` —
    `mode: "session"` ที่ผูกกับเธรดและเส้นทางถ่ายทอดสตรีมเป็น
    การผ่านการบูรณาการที่สมบูรณ์กว่าและแยกต่างหาก

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้ของ sandbox

ปัจจุบันเซสชัน ACP ทำงานบนรันไทม์ของโฮสต์ **ไม่ใช่** ภายใน
sandbox ของ OpenClaw

<Warning>
**ขอบเขตความปลอดภัย:**

- ฮาร์เนสภายนอกสามารถอ่าน/เขียนตามสิทธิ์ CLI ของตัวเองและ `cwd` ที่เลือกไว้
- นโยบาย sandbox ของ OpenClaw **ไม่** ครอบการเรียกใช้ฮาร์เนส ACP
- OpenClaw ยังบังคับใช้ feature gates ของ ACP, เอเจนต์ที่อนุญาต, ความเป็นเจ้าของเซสชัน, การผูกช่องทาง และนโยบายการส่งของ Gateway
- ใช้ `runtime: "subagent"` สำหรับงานแบบ OpenClaw-native ที่บังคับใช้ sandbox

</Warning>

ข้อจำกัดปัจจุบัน:

- หากเซสชันผู้ร้องขออยู่ใน sandbox การ spawn ACP จะถูกบล็อกทั้งสำหรับ `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
- `sessions_spawn` ที่มี `runtime: "acp"` ไม่รองรับ `sandbox: "require"`

## การระบุเป้าหมายเซสชัน

การกระทำ `/acp` ส่วนใหญ่รับเป้าหมายเซสชันแบบไม่บังคับ (`session-key`,
`session-id` หรือ `session-label`)

**ลำดับการระบุ:**

1. อาร์กิวเมนต์เป้าหมายที่ระบุชัดเจน (หรือ `--session` สำหรับ `/acp steer`)
   - ลองใช้คีย์
   - จากนั้นใช้ id เซสชันที่มีรูปแบบ UUID
   - จากนั้นใช้ label
2. การผูกเธรดปัจจุบัน (หากบทสนทนา/เธรดนี้ถูกผูกกับเซสชัน ACP)
3. ใช้เซสชันผู้ร้องขอปัจจุบันเป็นทางเลือกสำรอง

ทั้งการผูกบทสนทนาปัจจุบันและการผูกเธรดต่างมีส่วนใน
ขั้นตอนที่ 2

หากระบุเป้าหมายไม่ได้ OpenClaw จะส่งคืนข้อผิดพลาดที่ชัดเจน
(`Unable to resolve session target: ...`)

## การควบคุม ACP

| คำสั่ง               | ทำอะไร                                                    | ตัวอย่าง                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้างเซสชัน ACP; อาจผูกปัจจุบันหรือผูกเธรดได้            | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิกเทิร์นที่กำลังทำงานสำหรับเซสชันเป้าหมาย            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่ง steer ไปยังเซสชันที่กำลังทำงาน                 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิดเซสชันและยกเลิกการผูกเป้าหมายเธรด                    | `/acp close`                                                  |
| `/acp status`        | แสดงแบ็กเอนด์, โหมด, สถานะ, ตัวเลือกรันไทม์, ความสามารถ | `/acp status`                                                 |
| `/acp set-mode`      | ตั้งค่าโหมดรันไทม์สำหรับเซสชันเป้าหมาย                  | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนตัวเลือกการกำหนดค่ารันไทม์ทั่วไป                   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่าการแทนที่ไดเรกทอรีทำงานของรันไทม์                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้งค่าโปรไฟล์นโยบายการอนุมัติ                          | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้งค่าหมดเวลารันไทม์ (วินาที)                          | `/acp timeout 120`                                            |
| `/acp model`         | ตั้งค่าการแทนที่โมเดลรันไทม์                            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบการแทนที่ตัวเลือกรันไทม์ของเซสชัน                     | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการเซสชัน ACP ล่าสุดจาก store                    | `/acp sessions`                                               |
| `/acp doctor`        | สุขภาพแบ็กเอนด์, ความสามารถ, วิธีแก้ไขที่ลงมือทำได้    | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอนติดตั้งและเปิดใช้งานแบบกำหนดแน่นอน          | `/acp install`                                                |

`/acp status` แสดงตัวเลือกรันไทม์ที่มีผล พร้อมตัวระบุเซสชันระดับรันไทม์และ
ระดับแบ็กเอนด์ ข้อผิดพลาดเกี่ยวกับการควบคุมที่ไม่รองรับจะแสดงอย่าง
ชัดเจนเมื่อแบ็กเอนด์ไม่มีความสามารถนั้น `/acp sessions` อ่าน
store สำหรับเซสชันที่ผูกปัจจุบันหรือเซสชันผู้ร้องขอ; โทเค็นเป้าหมาย
(`session-key`, `session-id` หรือ `session-label`) จะถูกระบุผ่าน
การค้นหาเซสชันของ Gateway รวมถึงราก `session.store` แบบกำหนดเองต่อเอเจนต์

### การแมปตัวเลือกรันไทม์

`/acp` มีคำสั่งอำนวยความสะดวกและ setter ทั่วไป การดำเนินการที่เทียบเท่า:

| คำสั่ง                       | แมปไปยัง                             | หมายเหตุ                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | คีย์การกำหนดค่ารันไทม์ `model`      | สำหรับ Codex ACP, OpenClaw จะแปลง `openai-codex/<model>` ให้เป็น id โมเดลของอะแดปเตอร์ และแมป suffix reasoning แบบสแลช เช่น `openai-codex/gpt-5.4/high` ไปยัง `reasoning_effort` |
| `/acp set thinking <level>`  | คีย์การกำหนดค่ารันไทม์ `thinking`   | สำหรับ Codex ACP, OpenClaw จะส่ง `reasoning_effort` ที่สอดคล้องกันเมื่ออะแดปเตอร์รองรับ                                                                                      |
| `/acp permissions <profile>` | คีย์การกำหนดค่ารันไทม์ `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | คีย์การกำหนดค่ารันไทม์ `timeout`    | —                                                                                                                                                                              |
| `/acp cwd <path>`            | การแทนที่ cwd ของรันไทม์             | อัปเดตโดยตรง                                                                                                                                                                  |
| `/acp set <key> <value>`     | ทั่วไป                               | `key=cwd` ใช้เส้นทางการแทนที่ cwd                                                                                                                                             |
| `/acp reset-options`         | ล้างการแทนที่รันไทม์ทั้งหมด         | —                                                                                                                                                                              |

## ฮาร์เนส acpx, การตั้งค่า Plugin และสิทธิ์

สำหรับการกำหนดค่าฮาร์เนส acpx (aliases ของ Claude Code / Codex / Gemini CLI),
บริดจ์ MCP ของ plugin-tools และ OpenClaw-tools และโหมดสิทธิ์ของ ACP
ดู
[เอเจนต์ ACP — การตั้งค่า](/th/tools/acp-agents-setup)

## การแก้ไขปัญหา

| อาการ                                                                       | สาเหตุที่เป็นไปได้                                                                                                      | วิธีแก้ไข                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin แบ็กเอนด์หายไป ถูกปิดใช้งาน หรือถูกบล็อกโดย `plugins.allow`.                                                     | ติดตั้งและเปิดใช้งาน Plugin แบ็กเอนด์ ใส่ `acpx` ใน `plugins.allow` เมื่อตั้งค่า allowlist นั้นไว้ แล้วเรียกใช้ `/acp doctor`.                                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ถูกปิดใช้งานทั่วทั้งระบบ.                                                                                          | ตั้งค่า `acp.enabled=true`.                                                                                                                                               |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | การ dispatch อัตโนมัติจากข้อความเธรดปกติถูกปิดใช้งาน.                                                                  | ตั้งค่า `acp.dispatch.enabled=true` เพื่อเปิดใช้การกำหนดเส้นทางเธรดอัตโนมัติอีกครั้ง; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงทำงาน.                      |
| `ACP agent "<id>" is not allowed by policy`                                 | เอเจนต์ไม่อยู่ใน allowlist.                                                                                             | ใช้ `agentId` ที่อนุญาต หรืออัปเดต `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Plugin แบ็กเอนด์หายไป ถูกปิดใช้งาน ถูกบล็อกโดยนโยบาย allow/deny หรือ executable ที่กำหนดค่าไว้ไม่พร้อมใช้งาน.             | ติดตั้ง/เปิดใช้งาน Plugin แบ็กเอนด์ เรียก `/acp doctor` อีกครั้ง และตรวจสอบข้อผิดพลาดการติดตั้งแบ็กเอนด์หรือนโยบายหากยังไม่ healthy.                                       |
| ไม่พบคำสั่งฮาร์เนส                                                          | Adapter CLI ไม่ได้ติดตั้ง, Plugin ภายนอกหายไป หรือการดึง `npx` ครั้งแรกสำหรับอะแดปเตอร์ที่ไม่ใช่ Codex ล้มเหลว.             | เรียกใช้ `/acp doctor`, ติดตั้ง/พรีวอร์มอะแดปเตอร์บนโฮสต์ Gateway หรือกำหนดค่าคำสั่งเอเจนต์ acpx อย่างชัดเจน.                                                             |
| Model-not-found จากฮาร์เนส                                                   | id ของโมเดลถูกต้องสำหรับผู้ให้บริการ/ฮาร์เนสอื่น แต่ไม่ใช่เป้าหมาย ACP นี้.                                             | ใช้โมเดลที่ฮาร์เนสนั้นแสดงรายการไว้ กำหนดค่าโมเดลในฮาร์เนส หรือละเว้น override.                                                                                            |
| ข้อผิดพลาด auth ของผู้ขายจากฮาร์เนส                                         | OpenClaw healthy แล้ว แต่ CLI/ผู้ให้บริการเป้าหมายยังไม่ได้เข้าสู่ระบบ.                                                  | เข้าสู่ระบบหรือระบุคีย์ผู้ให้บริการที่จำเป็นในสภาพแวดล้อมของโฮสต์ Gateway.                                                                                                  |
| `Unable to resolve session target: ...`                                     | คีย์/id/โทเค็นป้ายกำกับไม่ถูกต้อง.                                                                                      | เรียกใช้ `/acp sessions`, คัดลอกคีย์/ป้ายกำกับที่ตรงกัน แล้วลองอีกครั้ง.                                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มีการสนทนาที่ active และ bind ได้.                                                              | ย้ายไปยังแชต/ช่องเป้าหมายแล้วลองอีกครั้ง หรือใช้ spawn แบบไม่ bind.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | อะแดปเตอร์ไม่มีความสามารถ ACP binding สำหรับการสนทนาปัจจุบัน.                                                          | ใช้ `/acp spawn ... --thread ...` เมื่อรองรับ กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปยังช่องที่รองรับ.                                                                  |
| `--thread here requires running /acp spawn inside an active ... thread`     | ใช้ `--thread here` นอกบริบทเธรด.                                                                                       | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off`.                                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`               | ผู้ใช้อื่นเป็นเจ้าของเป้าหมาย binding ที่ active อยู่.                                                                  | rebind ในฐานะเจ้าของ หรือใช้การสนทนาหรือเธรดอื่น.                                                                                                                          |
| `Thread bindings are unavailable for <channel>.`                            | อะแดปเตอร์ไม่มีความสามารถ thread binding.                                                                               | ใช้ `--thread off` หรือย้ายไปยังอะแดปเตอร์/ช่องที่รองรับ.                                                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime อยู่ฝั่งโฮสต์; เซสชัน requester อยู่ใน sandbox.                                                             | ใช้ `runtime="subagent"` จากเซสชัน sandboxed หรือเรียก ACP spawn จากเซสชันที่ไม่อยู่ใน sandbox.                                                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ขอ `sandbox="require"` สำหรับ ACP runtime.                                                                              | ใช้ `runtime="subagent"` สำหรับ sandboxing ที่จำเป็น หรือใช้ ACP พร้อม `sandbox="inherit"` จากเซสชันที่ไม่อยู่ใน sandbox.                                                     |
| `Cannot apply --model ... did not advertise model support`                  | ฮาร์เนสเป้าหมายไม่ได้เปิดเผยการสลับโมเดล ACP แบบทั่วไป.                                                                 | ใช้ฮาร์เนสที่โฆษณา ACP `models`/`session/set_model`, ใช้ refs โมเดล Codex ACP หรือกำหนดค่าโมเดลโดยตรงในฮาร์เนสหากมีแฟล็ก startup ของตัวเอง.                                |
| เมทาดาทา ACP สำหรับเซสชันที่ bind หายไป                                     | เมทาดาทาเซสชัน ACP เก่าค้าง/ถูกลบ.                                                                                      | สร้างใหม่ด้วย `/acp spawn` แล้ว rebind/focus เธรด.                                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` บล็อกการเขียน/exec ในเซสชัน ACP แบบ non-interactive.                                                   | ตั้งค่า `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ต gateway ดู [การกำหนดค่าสิทธิ์](/th/tools/acp-agents-setup#permission-configuration).     |
| เซสชัน ACP ล้มเหลวตั้งแต่ต้นโดยมี output น้อย                               | พรอมป์สิทธิ์ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions`.                                                   | ตรวจสอบบันทึก gateway สำหรับ `AcpRuntimeError`. สำหรับสิทธิ์เต็ม ให้ตั้งค่า `permissionMode=approve-all`; สำหรับการลดระดับอย่างนุ่มนวล ให้ตั้งค่า `nonInteractivePermissions=deny`. |
| เซสชัน ACP ค้างไม่มีกำหนดหลังทำงานเสร็จ                                     | กระบวนการฮาร์เนสเสร็จแล้ว แต่เซสชัน ACP ไม่ได้รายงานว่าเสร็จสมบูรณ์.                                                    | เฝ้าดูด้วย `ps aux \| grep acpx`; kill กระบวนการที่ค้างด้วยตนเอง.                                                                                                         |
| ฮาร์เนสเห็น `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                         | ซอง event ภายในรั่วข้ามขอบเขต ACP.                                                                                     | อัปเดต OpenClaw แล้วเรียก completion flow อีกครั้ง; ฮาร์เนสภายนอกควรได้รับเฉพาะพรอมป์ completion แบบ plain เท่านั้น.                                                        |

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP — การตั้งค่า](/th/tools/acp-agents-setup)
- [ส่งเอเจนต์](/th/tools/agent-send)
- [แบ็กเอนด์ CLI](/th/gateway/cli-backends)
- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [เครื่องมือ sandbox สำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (โหมด bridge)](/th/cli/acp)
- [เอเจนต์ย่อย](/th/tools/subagents)
