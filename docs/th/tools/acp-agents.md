---
read_when:
    - การเรียกใช้ฮาร์เนสการเขียนโค้ดผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับการสนทนาบนช่องทางการส่งข้อความ
    - การผูกการสนทนาของช่องทางข้อความเข้ากับเซสชัน ACP แบบถาวร
    - การแก้ไขปัญหาแบ็กเอนด์ ACP, การเชื่อมต่อ Plugin หรือการส่งผลลัพธ์การตอบกลับ
    - การใช้งานคำสั่ง /acp จากแชต
sidebarTitle: ACP agents
summary: เรียกใช้ฮาร์เนสการเขียนโค้ดภายนอก (Claude Code, Cursor, Gemini CLI, Codex ACP แบบระบุชัดเจน, OpenClaw ACP, OpenCode) ผ่านแบ็กเอนด์ ACP
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-05-06T09:32:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
    source_path: tools/acp-agents.md
    workflow: 16
---

[โปรโตคอลไคลเอนต์เอเจนต์ (ACP)](https://agentclientprotocol.com/) เซสชัน
ช่วยให้ OpenClaw รันตัวรันเขียนโค้ดภายนอก (เช่น Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI และตัวรัน
ACPX อื่น ๆ ที่รองรับ) ผ่าน Plugin แบ็กเอนด์ ACP

การสปอว์นเซสชัน ACP แต่ละครั้งจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

<Note>
**ACP คือเส้นทางตัวรันภายนอก ไม่ใช่เส้นทาง Codex เริ่มต้น** Plugin
แอปเซิร์ฟเวอร์ Codex แบบเนทีฟเป็นเจ้าของคำสั่งควบคุม `/codex ...` และรันไทม์ฝังตัว
`agentRuntime.id: "codex"`; ACP เป็นเจ้าของคำสั่งควบคุม
`/acp ...` และเซสชัน `sessions_spawn({ runtime: "acp" })`

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็นไคลเอนต์ MCP ภายนอก
โดยตรงไปยังบทสนทนาช่องทาง OpenClaw ที่มีอยู่ ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน ACP
</Note>

## ฉันควรใช้หน้าไหน?

| คุณต้องการ…                                                                                    | ใช้สิ่งนี้                              | หมายเหตุ                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ผูกหรือควบคุม Codex ในบทสนทนาปัจจุบัน                                               | `/codex bind`, `/codex threads`       | เส้นทางแอปเซิร์ฟเวอร์ Codex แบบเนทีฟเมื่อเปิดใช้ Plugin `codex`; รวมการตอบกลับแชตที่ผูกไว้, การส่งต่อรูปภาพ, รุ่น/เร็ว/สิทธิ์, หยุด และการควบคุมนำทาง ACP เป็นทางสำรองที่ต้องเลือกอย่างชัดเจน |
| รัน Claude Code, Gemini CLI, Codex ACP แบบชัดเจน หรือตัวรันภายนอกอื่น _ผ่าน_ OpenClaw | หน้านี้                             | เซสชันที่ผูกกับแชต, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, งานเบื้องหลัง, การควบคุมรันไทม์                                                                                   |
| เปิดเผยเซสชัน OpenClaw Gateway _เป็น_ เซิร์ฟเวอร์ ACP สำหรับเอดิเตอร์หรือไคลเอนต์                   | [`openclaw acp`](/th/cli/acp)            | โหมดบริดจ์ IDE/ไคลเอนต์พูด ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                                                                                            |
| ใช้ AI CLI ภายในเครื่องซ้ำเป็นโมเดลสำรองแบบข้อความเท่านั้น                                              | [แบ็กเอนด์ CLI](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw ไม่มีคำสั่งควบคุม ACP ไม่มีรันไทม์ตัวรัน                                                                                                                               |

## ใช้งานได้ทันทีหรือไม่?

ได้ หลังจากติดตั้ง Plugin รันไทม์ ACP อย่างเป็นทางการ:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

เช็กเอาต์ซอร์สสามารถใช้ Plugin เวิร์กสเปซภายในเครื่อง `extensions/acpx` ได้หลังจาก
`pnpm install` รัน `/acp doctor` เพื่อตรวจความพร้อม

OpenClaw จะสอนเอเจนต์เกี่ยวกับการสปอว์น ACP เฉพาะเมื่อ ACP **ใช้งานได้จริง**
เท่านั้น: ต้องเปิดใช้ ACP, ดิสแพตช์ต้องไม่ถูกปิด, เซสชันปัจจุบันต้องไม่ถูกบล็อกด้วยแซนด์บ็อกซ์
และต้องโหลดแบ็กเอนด์รันไทม์แล้ว หากไม่ตรงตามเงื่อนไขเหล่านั้น Skills ของ Plugin ACP และ
คำแนะนำ ACP สำหรับ `sessions_spawn` จะยังถูกซ่อน เพื่อให้เอเจนต์ไม่เสนอแบ็กเอนด์
ที่ไม่พร้อมใช้งาน

<AccordionGroup>
  <Accordion title="ข้อควรระวังในการรันครั้งแรก">
    - หากตั้งค่า `plugins.allow` ไว้ รายการนี้คือบัญชีรายการ Plugin แบบจำกัด และ **ต้อง** รวม `acpx`; มิฉะนั้นแบ็กเอนด์ ACP ที่ติดตั้งไว้จะถูกบล็อกโดยตั้งใจ และ `/acp doctor` จะรายงานรายการ allowlist ที่ขาดไป
    - อะแดปเตอร์ Codex ACP ถูกจัดเตรียมมากับ Plugin `acpx` และจะเปิดใช้ภายในเครื่องเมื่อทำได้
    - อะแดปเตอร์ตัวรันเป้าหมายอื่นอาจยังถูกดึงตามต้องการด้วย `npx` ในครั้งแรกที่คุณใช้งาน
    - การยืนยันตัวตนของผู้ให้บริการยังต้องมีอยู่บนโฮสต์สำหรับตัวรันนั้น
    - หากโฮสต์ไม่มี npm หรือการเข้าถึงเครือข่าย การดึงอะแดปเตอร์ครั้งแรกจะล้มเหลวจนกว่าจะอุ่นแคชไว้ล่วงหน้าหรือติดตั้งอะแดปเตอร์ด้วยวิธีอื่น

  </Accordion>
  <Accordion title="ข้อกำหนดเบื้องต้นของรันไทม์">
    ACP เปิดใช้กระบวนการตัวรันภายนอกจริง OpenClaw เป็นเจ้าของการกำหนดเส้นทาง,
    สถานะงานเบื้องหลัง, การส่งมอบ, การผูก และนโยบาย; ตัวรันเป็นเจ้าของ
    การเข้าสู่ระบบผู้ให้บริการ, แค็ตตาล็อกโมเดล, พฤติกรรมระบบไฟล์ และ
    เครื่องมือเนทีฟของตัวเอง

    ก่อนโทษ OpenClaw ให้ตรวจสอบว่า:

    - `/acp doctor` รายงานแบ็กเอนด์ที่เปิดใช้และสุขภาพดี
    - อนุญาต id เป้าหมายโดย `acp.allowedAgents` เมื่อมีการตั้งค่า allowlist นั้น
    - คำสั่งตัวรันสามารถเริ่มบนโฮสต์ Gateway ได้
    - มีการยืนยันตัวตนผู้ให้บริการสำหรับตัวรันนั้น (`claude`, `codex`, `gemini`, `opencode`, `droid` และอื่น ๆ)
    - โมเดลที่เลือกมีอยู่สำหรับตัวรันนั้น - id โมเดลไม่สามารถใช้ข้ามตัวรันได้
    - `cwd` ที่ร้องขอมีอยู่และเข้าถึงได้ หรือไม่ต้องระบุ `cwd` แล้วให้แบ็กเอนด์ใช้ค่าเริ่มต้นของตัวเอง
    - โหมดสิทธิ์ตรงกับงาน เซสชันแบบไม่โต้ตอบไม่สามารถคลิกพรอมป์สิทธิ์แบบเนทีฟได้ ดังนั้นงานเขียนโค้ดที่เน้นเขียน/เรียกใช้มักต้องใช้โปรไฟล์สิทธิ์ ACPX ที่ดำเนินต่อแบบไม่มีหน้าจอได้

  </Accordion>
</AccordionGroup>

เครื่องมือ Plugin ของ OpenClaw และเครื่องมือ OpenClaw ในตัว **จะไม่** ถูกเปิดเผยให้
ตัวรัน ACP ตามค่าเริ่มต้น เปิดใช้บริดจ์ MCP แบบชัดเจนใน
[เอเจนต์ ACP - การตั้งค่า](/th/tools/acp-agents-setup) เฉพาะเมื่อตัวรัน
ควรเรียกเครื่องมือเหล่านั้นโดยตรง

## เป้าหมายตัวรันที่รองรับ

เมื่อใช้แบ็กเอนด์ `acpx` ให้ใช้ id ตัวรันเหล่านี้เป็นเป้าหมาย `/acp spawn <id>`
หรือ `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| id ตัวรัน | แบ็กเอนด์ทั่วไป                                | หมายเหตุ                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | อะแดปเตอร์ Claude Code ACP                        | ต้องมีการยืนยันตัวตน Claude Code บนโฮสต์                                              |
| `codex`    | อะแดปเตอร์ Codex ACP                              | เป็นทางสำรอง ACP แบบชัดเจนเท่านั้นเมื่อ `/codex` แบบเนทีฟไม่พร้อมใช้งานหรือมีการร้องขอ ACP |
| `copilot`  | อะแดปเตอร์ GitHub Copilot ACP                     | ต้องมีการยืนยันตัวตน Copilot CLI/รันไทม์                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | แทนที่คำสั่ง acpx หากการติดตั้งภายในเครื่องเปิดเผยจุดเริ่มต้น ACP ที่ต่างออกไป    |
| `droid`    | Factory Droid CLI                              | ต้องมีการยืนยันตัวตน Factory/Droid หรือ `FACTORY_API_KEY` ในสภาพแวดล้อมของตัวรัน        |
| `gemini`   | อะแดปเตอร์ Gemini CLI ACP                         | ต้องมีการยืนยันตัวตน Gemini CLI หรือการตั้งค่าคีย์ API                                          |
| `iflow`    | iFlow CLI                                      | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `kilocode` | Kilo Code CLI                                  | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `kimi`     | Kimi/Moonshot CLI                              | ต้องมีการยืนยันตัวตน Kimi/Moonshot บนโฮสต์                                            |
| `kiro`     | Kiro CLI                                       | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `opencode` | อะแดปเตอร์ OpenCode ACP                           | ต้องมีการยืนยันตัวตน OpenCode CLI/ผู้ให้บริการ                                                |
| `openclaw` | บริดจ์ OpenClaw Gateway ผ่าน `openclaw acp` | ทำให้ตัวรันที่เข้าใจ ACP พูดกลับไปยังเซสชัน OpenClaw Gateway ได้                 |
| `pi`       | รันไทม์ Pi/OpenClaw แบบฝังตัว                   | ใช้สำหรับการทดลองตัวรันแบบเนทีฟของ OpenClaw                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | ต้องมีการยืนยันตัวตนที่เข้ากันได้กับ Qwen บนโฮสต์                                          |

สามารถกำหนดค่าเอเลียสเอเจนต์ acpx แบบกำหนดเองใน acpx เองได้ แต่นโยบาย OpenClaw
ยังคงตรวจสอบ `acp.allowedAgents` และการแมป
`agents.list[].runtime.acp.agent` ใด ๆ ก่อนดิสแพตช์

## คู่มือปฏิบัติสำหรับโอเปอเรเตอร์

โฟลว์ `/acp` แบบเร็วจากแชต:

<Steps>
  <Step title="สปอว์น">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` หรือแบบชัดเจน
    `/acp spawn codex --bind here`
  </Step>
  <Step title="ทำงาน">
    ดำเนินต่อในบทสนทนาหรือเธรดที่ผูกไว้ (หรือระบุคีย์เซสชันเป้าหมาย
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
  <Step title="นำทาง">
    โดยไม่แทนที่บริบท: `/acp steer tighten logging and continue`
  </Step>
  <Step title="หยุด">
    `/acp cancel` (เทิร์นปัจจุบัน) หรือ `/acp close` (เซสชัน + การผูก)
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="รายละเอียดวงจรชีวิต">
    - การสปอว์นจะสร้างหรือดำเนินเซสชันรันไทม์ ACP ต่อ, บันทึกเมทาดาทา ACP ในที่เก็บเซสชัน OpenClaw และอาจสร้างงานเบื้องหลังเมื่อการรันเป็นของพาเรนต์
    - เซสชัน ACP ที่เป็นของพาเรนต์จะถูกปฏิบัติเป็นงานเบื้องหลัง แม้เมื่อเซสชันรันไทม์เป็นแบบคงอยู่; การเสร็จสิ้นและการส่งมอบข้ามพื้นผิวจะผ่านตัวแจ้งงานพาเรนต์ แทนที่จะทำตัวเหมือนเซสชันแชตที่แสดงต่อผู้ใช้ตามปกติ
    - การบำรุงรักษางานจะปิดเซสชัน ACP แบบครั้งเดียวที่สิ้นสุดแล้วหรือกำพร้าและเป็นของพาเรนต์ เซสชัน ACP แบบคงอยู่จะถูกเก็บไว้ขณะที่ยังมีการผูกบทสนทนาที่ใช้งานอยู่; เซสชันแบบคงอยู่ที่ค้างโดยไม่มีการผูกที่ใช้งานอยู่จะถูกปิด เพื่อไม่ให้ดำเนินต่อแบบเงียบ ๆ หลังจากงานเจ้าของเสร็จแล้วหรือระเบียนงานหายไป
    - ข้อความติดตามผลที่ผูกไว้จะไปยังเซสชัน ACP โดยตรงจนกว่าการผูกจะถูกปิด, เลิกโฟกัส, รีเซ็ต หรือหมดอายุ
    - คำสั่ง Gateway ยังคงอยู่ภายในเครื่อง `/acp ...`, `/status` และ `/unfocus` จะไม่ถูกส่งเป็นข้อความพรอมป์ปกติไปยังตัวรัน ACP ที่ผูกไว้
    - `cancel` ยกเลิกเทิร์นที่ใช้งานอยู่เมื่อแบ็กเอนด์รองรับการยกเลิก; ไม่ได้ลบการผูกหรือเมทาดาทาเซสชัน
    - `close` สิ้นสุดเซสชัน ACP จากมุมมองของ OpenClaw และลบการผูก ตัวรันอาจยังเก็บประวัติต้นทางของตัวเองไว้หากรองรับการดำเนินต่อ
    - เวิร์กเกอร์รันไทม์ที่ไม่ได้ใช้งานมีสิทธิ์ถูกล้างหลังจาก `acp.runtime.ttlMinutes`; เมทาดาทาเซสชันที่จัดเก็บไว้ยังคงพร้อมใช้งานสำหรับ `/acp sessions`

  </Accordion>
  <Accordion title="กฎการกำหนดเส้นทาง Codex แบบเนทีฟ">
    ทริกเกอร์ภาษาธรรมชาติที่ควรกำหนดเส้นทางไปยัง **Plugin Codex แบบเนทีฟ**
    เมื่อเปิดใช้งาน:

    - "ผูกช่อง Discord นี้กับ Codex"
    - "แนบแชตนี้กับเธรด Codex `<id>`"
    - "แสดงเธรด Codex แล้วผูกอันนี้"

    การผูกบทสนทนา Codex แบบเนทีฟคือเส้นทางควบคุมแชตเริ่มต้น
    เครื่องมือไดนามิก OpenClaw ยังคงเรียกใช้ผ่าน OpenClaw ขณะที่
    เครื่องมือแบบเนทีฟของ Codex เช่น shell/apply-patch จะเรียกใช้ภายใน Codex
    สำหรับอีเวนต์เครื่องมือแบบเนทีฟของ Codex, OpenClaw จะแทรกตัวส่งต่อ hook แบบเนทีฟรายเทิร์น
    เพื่อให้ Plugin hooks สามารถบล็อก `before_tool_call`, สังเกต
    `after_tool_call` และกำหนดเส้นทางอีเวนต์ `PermissionRequest` ของ Codex
    ผ่านการอนุมัติของ OpenClaw hook `Stop` ของ Codex จะถูกส่งต่อไปยัง
    `before_agent_finalize` ของ OpenClaw ซึ่ง Plugin สามารถขอรอบโมเดลเพิ่มอีกหนึ่งครั้ง
    ก่อนที่ Codex จะสรุปคำตอบ การส่งต่อยังคงตั้งใจให้ระมัดระวัง:
    ไม่แก้ไขอาร์กิวเมนต์เครื่องมือแบบเนทีฟของ Codex หรือเขียนระเบียนเธรด Codex ใหม่
    ใช้ ACP แบบชัดเจนเฉพาะเมื่อคุณต้องการโมเดลรันไทม์/เซสชันของ ACP
    ขอบเขตการรองรับ Codex แบบฝังตัวมีเอกสารอยู่ใน
    [สัญญาการรองรับตัวรัน Codex v1](/th/plugins/codex-harness#v1-support-contract)

  </Accordion>
  <Accordion title="ชีตสรุปการเลือกโมเดล / ผู้ให้บริการ / รันไทม์">
    - `openai-codex/*` - เส้นทาง PI Codex OAuth/การสมัครใช้งาน
    - `openai/*` บวกกับ `agentRuntime.id: "codex"` - รันไทม์ฝังตัวของเซิร์ฟเวอร์แอป Codex แบบเนทีฟ
    - `/codex ...` - การควบคุมบทสนทนา Codex แบบเนทีฟ
    - `/acp ...` หรือ `runtime: "acp"` - การควบคุม ACP/acpx แบบชัดเจน

  </Accordion>
  <Accordion title="ทริกเกอร์ภาษาธรรมชาติสำหรับการกำหนดเส้นทาง ACP">
    ทริกเกอร์ที่ควรกำหนดเส้นทางไปยังรันไทม์ ACP:

    - "เรียกใช้งานนี้เป็นเซสชัน Claude Code ACP แบบครั้งเดียว แล้วสรุปผลลัพธ์"
    - "ใช้ Gemini CLI สำหรับงานนี้ในเธรด แล้วเก็บการติดตามผลไว้ในเธรดเดียวกัน"
    - "เรียกใช้ Codex ผ่าน ACP ในเธรดเบื้องหลัง"

    OpenClaw เลือก `runtime: "acp"` แก้ค่า harness `agentId`
    ผูกกับบทสนทนาหรือเธรดปัจจุบันเมื่อรองรับ และ
    กำหนดเส้นทางการติดตามผลไปยังเซสชันนั้นจนกว่าจะปิด/หมดอายุ Codex จะ
    ใช้เส้นทางนี้เฉพาะเมื่อ ACP/acpx ถูกระบุอย่างชัดเจน หรือ Plugin Codex
    แบบเนทีฟไม่พร้อมใช้งานสำหรับการดำเนินการที่ร้องขอ

    สำหรับ `sessions_spawn`, `runtime: "acp"` จะถูกประกาศเฉพาะเมื่อเปิดใช้ ACP
    ผู้ร้องขอไม่ได้อยู่ใน sandbox และโหลด backend รันไทม์ ACP แล้ว
    `acp.dispatch.enabled=false` จะหยุดการ dispatch เธรด ACP อัตโนมัติ
    ชั่วคราว แต่จะไม่ซ่อนหรือบล็อกการเรียก
    `sessions_spawn({ runtime: "acp" })` แบบชัดเจน โดยมีเป้าหมายเป็น id ของ ACP harness เช่น `codex`,
    `claude`, `droid`, `gemini` หรือ `opencode` อย่าส่ง id เอเจนต์ config
    OpenClaw ปกติจาก `agents_list` เว้นแต่รายการนั้นจะถูกกำหนดค่า
    อย่างชัดเจนด้วย `agents.list[].runtime.type="acp"`;
    ไม่เช่นนั้นให้ใช้รันไทม์ sub-agent เริ่มต้น เมื่อเอเจนต์ OpenClaw
    ถูกกำหนดค่าด้วย `runtime.type="acp"` OpenClaw จะใช้
    `runtime.acp.agent` เป็น id ของ harness พื้นฐาน

  </Accordion>
</AccordionGroup>

## ACP เทียบกับ sub-agents

ใช้ ACP เมื่อคุณต้องการรันไทม์ harness ภายนอก ใช้ **เซิร์ฟเวอร์แอป Codex
แบบเนทีฟ** สำหรับการผูก/ควบคุมบทสนทนา Codex เมื่อเปิดใช้ Plugin `codex`
ใช้ **sub-agents** เมื่อคุณต้องการการรันแบบมอบหมายงานที่เป็นเนทีฟของ OpenClaw

| พื้นที่          | เซสชัน ACP                           | การรัน sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| รันไทม์       | Plugin backend ACP (เช่น acpx) | รันไทม์ sub-agent แบบเนทีฟของ OpenClaw  |
| คีย์เซสชัน   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| คำสั่งหลัก | `/acp ...`                            | `/subagents ...`                   |
| เครื่องมือ spawn    | `sessions_spawn` พร้อม `runtime:"acp"` | `sessions_spawn` (รันไทม์เริ่มต้น) |

ดูเพิ่มเติมที่ [Sub-agents](/th/tools/subagents)

## วิธีที่ ACP เรียกใช้ Claude Code

สำหรับ Claude Code ผ่าน ACP, stack คือ:

1. ระนาบควบคุมเซสชัน ACP ของ OpenClaw
2. Plugin รันไทม์ `@openclaw/acpx` อย่างเป็นทางการ
3. อะแดปเตอร์ Claude ACP
4. กลไกรันไทม์/เซสชันฝั่ง Claude

ACP Claude เป็น **เซสชัน harness** ที่มีการควบคุม ACP, การทำงานต่อของเซสชัน,
การติดตามงานเบื้องหลัง และการผูกบทสนทนา/เธรดที่เป็นตัวเลือก

backend CLI เป็นรันไทม์ fallback ในเครื่องแบบข้อความเท่านั้นที่แยกต่างหาก - ดู
[backend CLI](/th/gateway/cli-backends)

สำหรับผู้ปฏิบัติงาน กฎเชิงปฏิบัติคือ:

- **ต้องการ `/acp spawn`, เซสชันที่ผูกได้, การควบคุมรันไทม์ หรืองาน harness ที่คงอยู่ถาวร?** ใช้ ACP
- **ต้องการ fallback ข้อความในเครื่องแบบง่ายผ่าน CLI ดิบ?** ใช้ backend CLI

## เซสชันที่ถูกผูก

### แบบจำลองทางความคิด

- **พื้นผิวแชต** - ที่ที่ผู้คนคุยต่อกัน (ช่อง Discord, หัวข้อ Telegram, แชต iMessage)
- **เซสชัน ACP** - สถานะรันไทม์ Codex/Claude/Gemini ที่คงทนซึ่ง OpenClaw กำหนดเส้นทางไปหา
- **เธรด/หัวข้อลูก** - พื้นผิวการส่งข้อความเสริมที่เป็นตัวเลือก ซึ่งสร้างโดย `--thread ...` เท่านั้น
- **พื้นที่ทำงานรันไทม์** - ตำแหน่งระบบไฟล์ (`cwd`, repo checkout, พื้นที่ทำงาน backend) ที่ harness รัน เป็นอิสระจากพื้นผิวแชต

### การผูกบทสนทนาปัจจุบัน

`/acp spawn <harness> --bind here` ปักหมุดบทสนทนาปัจจุบันกับ
เซสชัน ACP ที่ spawn แล้ว - ไม่มีเธรดลูก พื้นผิวแชตเดิม OpenClaw ยังคง
เป็นเจ้าของ transport, auth, ความปลอดภัย และการส่งมอบ ข้อความติดตามผลใน
บทสนทนานั้นจะถูกกำหนดเส้นทางไปยังเซสชันเดียวกัน; `/new` และ `/reset` รีเซ็ต
เซสชันในตำแหน่งเดิม; `/acp close` ลบการผูกออก

ตัวอย่าง:

```text
/codex bind                                              # การผูก Codex แบบเนทีฟ กำหนดเส้นทางข้อความในอนาคตมาที่นี่
/codex model gpt-5.4                                     # ปรับแต่งเธรด Codex แบบเนทีฟที่ถูกผูก
/codex stop                                              # ควบคุม turn Codex แบบเนทีฟที่กำลังทำงาน
/acp spawn codex --bind here                             # fallback ACP แบบชัดเจนสำหรับ Codex
/acp spawn codex --thread auto                           # อาจสร้างเธรด/หัวข้อลูกและผูกที่นั่น
/acp spawn codex --bind here --cwd /workspace/repo       # การผูกแชตเดิม Codex รันใน /workspace/repo
```

<AccordionGroup>
  <Accordion title="กฎการผูกและความเป็นเอกสิทธิ์">
    - `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้
    - `--bind here` ทำงานเฉพาะบนช่องทางที่ประกาศความสามารถการผูกบทสนทนาปัจจุบัน; มิฉะนั้น OpenClaw จะส่งคืนข้อความไม่รองรับที่ชัดเจน การผูกคงอยู่ข้ามการรีสตาร์ต Gateway
    - บน Discord, `spawnSessions` ควบคุมการสร้างเธรดลูกสำหรับ `--thread auto|here` - ไม่ใช่ `--bind here`
    - หากคุณ spawn ไปยังเอเจนต์ ACP อื่นโดยไม่มี `--cwd`, OpenClaw จะสืบทอดพื้นที่ทำงานของ **เอเจนต์เป้าหมาย** โดยค่าเริ่มต้น เส้นทางที่สืบทอดมาซึ่งหายไป (`ENOENT`/`ENOTDIR`) จะ fallback ไปยังค่าเริ่มต้นของ backend; ข้อผิดพลาดการเข้าถึงอื่น ๆ (เช่น `EACCES`) จะแสดงเป็นข้อผิดพลาดการ spawn
    - คำสั่งจัดการ Gateway จะยังคงอยู่ในเครื่องภายในบทสนทนาที่ถูกผูก - คำสั่ง `/acp ...` ถูกจัดการโดย OpenClaw แม้เมื่อข้อความติดตามผลปกติถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ถูกผูก; `/status` และ `/unfocus` ก็ยังอยู่ในเครื่องเช่นกันเมื่อเปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

  </Accordion>
  <Accordion title="เซสชันที่ผูกกับเธรด">
    เมื่อเปิดใช้งานการผูกเธรดสำหรับอะแดปเตอร์ช่องทาง:

    - OpenClaw ผูกเธรดกับเซสชัน ACP เป้าหมาย
    - ข้อความติดตามผลในเธรดนั้นถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ถูกผูก
    - เอาต์พุต ACP ถูกส่งกลับไปยังเธรดเดียวกัน
    - Unfocus/close/archive/idle-timeout หรือการหมดอายุ max-age จะลบการผูกออก
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` และ `/unfocus` เป็นคำสั่ง Gateway ไม่ใช่พรอมป์ไปยัง ACP harness

    feature flag ที่จำเป็นสำหรับ ACP ที่ผูกกับเธรด:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` เปิดอยู่โดยค่าเริ่มต้น (ตั้งค่า `false` เพื่อหยุดการ dispatch เธรด ACP อัตโนมัติชั่วคราว; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงทำงาน)
    - เปิดใช้การ spawn เซสชันเธรดของอะแดปเตอร์ช่องทาง (ค่าเริ่มต้น: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    การรองรับการผูกเธรดขึ้นอยู่กับอะแดปเตอร์ หากอะแดปเตอร์ช่องทางที่ใช้งานอยู่
    ไม่รองรับการผูกเธรด OpenClaw จะส่งคืนข้อความ
    ไม่รองรับ/ไม่พร้อมใช้งานที่ชัดเจน

  </Accordion>
  <Accordion title="ช่องทางที่รองรับเธรด">
    - อะแดปเตอร์ช่องทางใด ๆ ที่เปิดเผยความสามารถการผูกเซสชัน/เธรด
    - การรองรับในตัวปัจจุบัน: เธรด/ช่อง **Discord**, หัวข้อ **Telegram** (หัวข้อฟอรัมในกลุ่ม/supergroup และหัวข้อ DM)
    - ช่องทาง Plugin สามารถเพิ่มการรองรับผ่านอินเทอร์เฟซการผูกเดียวกัน

  </Accordion>
</AccordionGroup>

## การผูกช่องทางแบบถาวร

สำหรับ workflow ที่ไม่ใช่แบบชั่วคราว ให้กำหนดค่าการผูก ACP แบบถาวรใน
รายการ `bindings[]` ระดับบนสุด

### โมเดลการผูก

<ParamField path="bindings[].type" type='"acp"'>
  ทำเครื่องหมายการผูกบทสนทนา ACP แบบถาวร
</ParamField>
<ParamField path="bindings[].match" type="object">
  ระบุบทสนทนาเป้าหมาย รูปแบบตามช่องทาง:

- **ช่อง/เธรด Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **หัวข้อฟอรัม Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/กลุ่ม BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` แนะนำให้ใช้ `chat_id:*` หรือ `chat_identifier:*` สำหรับการผูกกลุ่มที่เสถียร
- **DM/กลุ่ม iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` แนะนำให้ใช้ `chat_id:*` สำหรับการผูกกลุ่มที่เสถียร

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  id เอเจนต์ OpenClaw ที่เป็นเจ้าของ
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  การ override ACP ที่เป็นตัวเลือก
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  ป้ายกำกับที่แสดงต่อผู้ปฏิบัติงาน เป็นตัวเลือก
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์ เป็นตัวเลือก
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  การ override backend เป็นตัวเลือก
</ParamField>

### ค่าเริ่มต้นรันไทม์ต่อเอเจนต์

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้น ACP หนึ่งครั้งต่อเอเจนต์:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ลำดับความสำคัญของการ override สำหรับเซสชันที่ผูกกับ ACP:**

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
- ข้อความในช่องหรือหัวข้อนั้นถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่กำหนดค่าไว้
- ในบทสนทนาที่ถูกผูก `/new` และ `/reset` จะรีเซ็ตคีย์เซสชัน ACP เดิมในตำแหน่งเดิม
- การผูกรันไทม์ชั่วคราว (เช่น ที่สร้างโดย flow การ focus เธรด) ยังคงใช้เมื่อมีอยู่
- สำหรับการ spawn ACP ข้ามเอเจนต์โดยไม่มี `cwd` ที่ชัดเจน OpenClaw จะสืบทอดพื้นที่ทำงานของเอเจนต์เป้าหมายจาก config เอเจนต์
- เส้นทางพื้นที่ทำงานที่สืบทอดมาและหายไปจะ fallback ไปยัง cwd เริ่มต้นของ backend; ความล้มเหลวในการเข้าถึงที่ไม่ได้เกิดจากการหายไปจะแสดงเป็นข้อผิดพลาดการ spawn

## เริ่มเซสชัน ACP

สองวิธีในการเริ่มเซสชัน ACP:

<Tabs>
  <Tab title="จาก sessions_spawn">
    ใช้ `runtime: "acp"` เพื่อเริ่มเซสชัน ACP จาก turn ของเอเจนต์หรือ
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
    สำหรับเซสชัน ACP หากละเว้น `agentId` OpenClaw จะใช้
    `acp.defaultAgent` เมื่อมีการกำหนดค่าไว้ `mode: "session"` ต้องใช้
    `thread: true` เพื่อคงการสนทนาที่ผูกไว้อย่างต่อเนื่อง
    </Note>

  </Tab>
  <Tab title="From /acp command">
    ใช้ `/acp spawn` เพื่อให้ผู้ปฏิบัติการควบคุมจากแชตได้อย่างชัดเจน

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

    ดู [คำสั่งแบบ Slash](/th/tools/slash-commands)

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
  id ของ harness เป้าหมาย ACP ใช้ `acp.defaultAgent` เป็นค่า fallback หากตั้งค่าไว้
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  ขอ flow การผูกเธรดเมื่อรองรับ
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` เป็นแบบทำครั้งเดียว; `"session"` เป็นแบบต่อเนื่อง หาก `thread: true` และ
  ละเว้น `mode` OpenClaw อาจใช้ค่าเริ่มต้นเป็นพฤติกรรมแบบต่อเนื่องตาม
  เส้นทาง runtime `mode: "session"` ต้องใช้ `thread: true`
</ParamField>
<ParamField path="cwd" type="string">
  ไดเรกทอรีทำงานของ runtime ที่ร้องขอ (ตรวจสอบโดยนโยบาย backend/runtime)
  หากละเว้น ACP spawn จะสืบทอด workspace ของเอเจนต์เป้าหมาย
  เมื่อมีการกำหนดค่าไว้; เส้นทางที่สืบทอดมาแต่หายไปจะ fallback ไปยังค่าเริ่มต้นของ backend
  ส่วนข้อผิดพลาดการเข้าถึงจริงจะถูกส่งกลับ
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับสำหรับผู้ปฏิบัติการที่ใช้ในข้อความเซสชัน/แบนเนอร์
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ทำงานต่อจากเซสชัน ACP ที่มีอยู่แทนการสร้างใหม่
  เอเจนต์จะเล่นประวัติการสนทนาซ้ำผ่าน `session/load` ต้องใช้
  `runtime: "acp"`
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` สตรีมสรุปความคืบหน้าการรัน ACP เริ่มต้นกลับไปยัง
  เซสชันผู้ร้องขอเป็นเหตุการณ์ระบบ คำตอบที่ยอมรับได้รวมถึง
  `streamLogPath` ที่ชี้ไปยังล็อก JSONL เฉพาะเซสชัน
  (`<sessionId>.acp-stream.jsonl`) ซึ่งคุณสามารถ tail เพื่อดูประวัติ relay ทั้งหมดได้
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ยุติ turn ของลูก ACP หลังผ่านไป N วินาที `0` จะคง turn ไว้บน
  เส้นทางไม่มี timeout ของ gateway ค่าเดียวกันจะถูกใช้กับการรัน Gateway
  และ runtime ACP เพื่อไม่ให้ harness ที่ค้างหรือ quota หมด
  ครอบครองเลนของเอเจนต์แม่อย่างไม่มีกำหนด
</ParamField>
<ParamField path="model" type="string">
  การ override โมเดลอย่างชัดเจนสำหรับเซสชันลูก ACP การ spawn ของ Codex ACP
  จะ normalize ref ของ OpenClaw Codex เช่น `openai-codex/gpt-5.4` เป็น config
  เริ่มต้นของ Codex ACP ก่อน `session/new`; รูปแบบ slash เช่น
  `openai-codex/gpt-5.4/high` จะตั้งค่า reasoning effort ของ Codex ACP ด้วย
  harness อื่นต้องประกาศ ACP `models` และรองรับ
  `session/set_model`; มิฉะนั้น OpenClaw/acpx จะล้มเหลวอย่างชัดเจนแทนที่จะ
  fallback กลับไปยังค่าเริ่มต้นของเอเจนต์เป้าหมายอย่างเงียบ ๆ
</ParamField>
<ParamField path="thinking" type="string">
  thinking/reasoning effort ที่ระบุอย่างชัดเจน สำหรับ Codex ACP, `minimal` map ไปยัง
  effort ต่ำ, `low`/`medium`/`high`/`xhigh` map โดยตรง และ `off`
  จะละเว้นการ override reasoning-effort ตอนเริ่มต้น
</ParamField>

## โหมดการผูกและเธรดของ spawn

<Tabs>
  <Tab title="--bind here|off">
    | โหมด   | พฤติกรรม                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | ผูกการสนทนาที่ใช้งานอยู่ในปัจจุบันไว้ที่เดิม; ล้มเหลวหากไม่มีรายการใดใช้งานอยู่ |
    | `off`  | ไม่สร้างการผูกการสนทนาปัจจุบัน                          |

    หมายเหตุ:

    - `--bind here` เป็นเส้นทางผู้ปฏิบัติการที่ง่ายที่สุดสำหรับ "ทำให้ช่องหรือแชตนี้รองรับ Codex"
    - `--bind here` ไม่สร้างเธรดลูก
    - `--bind here` ใช้ได้เฉพาะบนช่องที่เปิดเผยการรองรับการผูกการสนทนาปัจจุบัน
    - ไม่สามารถใช้ `--bind` และ `--thread` ร่วมกันในการเรียก `/acp spawn` ครั้งเดียวกันได้

  </Tab>
  <Tab title="--thread auto|here|off">
    | โหมด   | พฤติกรรม                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | ในเธรดที่ใช้งานอยู่: ผูกเธรดนั้น นอกเธรด: สร้าง/ผูกเธรดลูกเมื่อรองรับ |
    | `here` | ต้องมีเธรดปัจจุบันที่ใช้งานอยู่; ล้มเหลวหากไม่ได้อยู่ในเธรด                                                  |
    | `off`  | ไม่มีการผูก เซสชันเริ่มโดยไม่ถูกผูก                                                                 |

    หมายเหตุ:

    - บนพื้นผิวที่ไม่รองรับการผูกเธรด พฤติกรรมเริ่มต้นจะเทียบเท่ากับ `off`
    - spawn แบบผูกเธรดต้องมีการรองรับจากนโยบายช่อง:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - ใช้ `--bind here` เมื่อคุณต้องการตรึงการสนทนาปัจจุบันโดยไม่สร้างเธรดลูก

  </Tab>
</Tabs>

## รูปแบบการส่งมอบ

เซสชัน ACP อาจเป็น workspace แบบโต้ตอบหรือ
งานเบื้องหลังที่แม่เป็นเจ้าของ เส้นทางการส่งมอบขึ้นอยู่กับรูปแบบนั้น

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    เซสชันแบบโต้ตอบมีไว้เพื่อสนทนาต่อบนพื้นผิวแชตที่มองเห็นได้:

    - `/acp spawn ... --bind here` ผูกการสนทนาปัจจุบันกับเซสชัน ACP
    - `/acp spawn ... --thread ...` ผูกเธรด/หัวข้อของช่องกับเซสชัน ACP
    - `bindings[].type="acp"` ที่กำหนดค่าแบบต่อเนื่องจะ route การสนทนาที่ตรงกันไปยังเซสชัน ACP เดียวกัน

    ข้อความติดตามผลในการสนทนาที่ผูกไว้จะถูก route โดยตรงไปยัง
    เซสชัน ACP และผลลัพธ์ ACP จะถูกส่งกลับไปยัง
    ช่อง/เธรด/หัวข้อเดียวกัน

    สิ่งที่ OpenClaw ส่งไปยัง harness:

    - follow-up ที่ผูกไว้ตามปกติจะถูกส่งเป็นข้อความพรอมป์ พร้อมไฟล์แนบเฉพาะเมื่อ harness/backend รองรับเท่านั้น
    - คำสั่งจัดการ `/acp` และคำสั่ง Gateway ภายในจะถูกดักก่อน dispatch ไปยัง ACP
    - เหตุการณ์การทำงานเสร็จที่ runtime สร้างขึ้นจะถูก materialize ตามเป้าหมาย เอเจนต์ OpenClaw จะได้รับ envelope runtime-context ภายในของ OpenClaw; harness ACP ภายนอกจะได้รับพรอมป์ธรรมดาพร้อมผลลัพธ์ลูกและคำสั่ง envelope ดิบ `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ไม่ควรถูกส่งไปยัง harness ภายนอกหรือ persist เป็นข้อความ transcript ของผู้ใช้ ACP
    - รายการ transcript ของ ACP ใช้ข้อความ trigger ที่ผู้ใช้มองเห็นหรือพรอมป์การทำงานเสร็จแบบธรรมดา metadata เหตุการณ์ภายในจะยังคงเป็นแบบ structured ใน OpenClaw เมื่อทำได้ และไม่ถือเป็นเนื้อหาแชตที่ผู้ใช้เขียน

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    เซสชัน ACP แบบทำครั้งเดียวที่ spawn โดยการรันของเอเจนต์อื่นเป็นลูก
    เบื้องหลัง คล้ายกับ sub-agents:

    - แม่ขอให้งานทำงานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
    - ลูกทำงานในเซสชัน ACP harness ของตนเอง
    - turn ของลูกทำงานบนเลนเบื้องหลังเดียวกับที่ใช้โดยการ spawn sub-agent แบบ native ดังนั้น ACP harness ที่ช้าจะไม่บล็อกงานของ main-session ที่ไม่เกี่ยวข้อง
    - รายงานการทำงานเสร็จกลับผ่านเส้นทางประกาศ task-completion OpenClaw แปลง metadata การทำงานเสร็จภายในเป็นพรอมป์ ACP ธรรมดาก่อนส่งไปยัง harness ภายนอก ดังนั้น harness จะไม่เห็น marker runtime context เฉพาะ OpenClaw
    - แม่เขียนผลลัพธ์ลูกใหม่ด้วยเสียง assistant ปกติเมื่อคำตอบสำหรับผู้ใช้มีประโยชน์

    อย่า **ถือว่า** เส้นทางนี้เป็นแชตแบบ peer-to-peer ระหว่างแม่
    และลูก ลูกมีช่องทางการทำงานเสร็จกลับไปยัง
    แม่อยู่แล้ว

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` สามารถกำหนดเป้าหมายไปยังเซสชันอื่นหลัง spawn ได้ สำหรับเซสชัน
    peer ปกติ OpenClaw ใช้เส้นทาง follow-up แบบ agent-to-agent (A2A)
    หลังจาก inject ข้อความ:

    - รอคำตอบของเซสชันเป้าหมาย
    - เลือกให้ผู้ร้องขอและเป้าหมายแลกเปลี่ยน turn ติดตามผลได้ในจำนวนที่จำกัด
    - ขอให้เป้าหมายสร้างข้อความประกาศ
    - ส่งประกาศนั้นไปยังช่องหรือเธรดที่มองเห็นได้

    เส้นทาง A2A นั้นเป็น fallback สำหรับการส่งแบบ peer ที่ผู้ส่งต้องการ
    follow-up ที่มองเห็นได้ เส้นทางนี้ยังคงเปิดใช้เมื่อเซสชันที่ไม่เกี่ยวข้องสามารถ
    เห็นและส่งข้อความถึงเป้าหมาย ACP ได้ เช่นภายใต้การตั้งค่า
    `tools.sessions.visibility` แบบกว้าง

    OpenClaw จะข้าม A2A follow-up เฉพาะเมื่อผู้ร้องขอเป็น
    แม่ของลูก ACP แบบทำครั้งเดียวที่แม่เป็นเจ้าของของตนเอง ในกรณีนั้น
    การรัน A2A ทับบน task completion สามารถปลุกแม่ด้วย
    ผลลัพธ์ของลูก ส่งต่อคำตอบของแม่กลับเข้าไปในลูก และ
    สร้าง echo loop ระหว่างแม่/ลูก ผลลัพธ์ `sessions_send` รายงาน
    `delivery.status="skipped"` สำหรับกรณี owned-child นั้น เพราะ
    เส้นทางการทำงานเสร็จรับผิดชอบผลลัพธ์อยู่แล้ว

  </Accordion>
  <Accordion title="Resume an existing session">
    ใช้ `resumeSessionId` เพื่อดำเนินเซสชัน ACP ก่อนหน้าต่อแทน
    การเริ่มใหม่ เอเจนต์จะเล่นประวัติการสนทนาซ้ำผ่าน
    `session/load` จึงเริ่มต่อด้วยบริบทเต็มของสิ่งที่เกิดขึ้นก่อนหน้า

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    กรณีใช้งานทั่วไป:

    - ส่งต่อเซสชัน Codex จากแล็ปท็อปไปยังโทรศัพท์ของคุณ - บอกเอเจนต์ของคุณให้เริ่มต่อจากจุดที่คุณค้างไว้
    - ดำเนินเซสชันเขียนโค้ดที่คุณเริ่มแบบโต้ตอบใน CLI ต่อ โดยตอนนี้ทำแบบ headless ผ่านเอเจนต์ของคุณ
    - ทำงานต่อจากงานที่ถูกขัดจังหวะโดยการรีสตาร์ต gateway หรือ idle timeout

    หมายเหตุ:

    - `resumeSessionId` ใช้เฉพาะเมื่อ `runtime: "acp"`; runtime sub-agent เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `streamTo` ใช้เฉพาะเมื่อ `runtime: "acp"`; runtime sub-agent เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `resumeSessionId` เป็น id resume ของ ACP/harness แบบ host-local ไม่ใช่คีย์เซสชันช่องของ OpenClaw; OpenClaw ยังตรวจสอบนโยบาย ACP spawn และนโยบายเอเจนต์เป้าหมายก่อน dispatch ขณะที่ backend หรือ harness ACP เป็นเจ้าของการอนุญาตสำหรับโหลด id ต้นทางนั้น
    - `resumeSessionId` คืนค่าประวัติการสนทนา ACP ต้นทาง; `thread` และ `mode` ยังใช้ตามปกติกับเซสชัน OpenClaw ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังคงต้องใช้ `thread: true`
    - เอเจนต์เป้าหมายต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
    - หากไม่พบ session id การ spawn จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน - ไม่มี fallback ไปยังเซสชันใหม่อย่างเงียบ ๆ

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    หลัง deploy gateway ให้รันการตรวจสอบ end-to-end แบบ live แทนการ
    เชื่อถือ unit test:

    1. ตรวจสอบเวอร์ชันและ commit ของ gateway ที่ deploy บน host เป้าหมาย
    2. เปิดเซสชัน bridge ACPX ชั่วคราวไปยังเอเจนต์ live
    3. ขอให้เอเจนต์นั้นเรียก `sessions_spawn` ด้วย `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` และ task `Reply with exactly LIVE-ACP-SPAWN-OK`
    4. ตรวจสอบ `accepted=yes`, `childSessionKey` จริง และไม่มีข้อผิดพลาด validator
    5. ล้างเซสชัน bridge ชั่วคราว

    คง gate ไว้ที่ `mode: "run"` และข้าม `streamTo: "parent"` -
    `mode: "session"` แบบผูกเธรดและเส้นทาง stream-relay เป็น
    integration pass ที่สมบูรณ์กว่าและแยกต่างหาก

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้ของ sandbox

ขณะนี้เซสชัน ACP ทำงานบน runtime ของ host **ไม่ใช่** ภายใน
sandbox ของ OpenClaw

<Warning>
**ขอบเขตความปลอดภัย:**

- harness ภายนอกสามารถอ่าน/เขียนได้ตามสิทธิ์ CLI ของตัวเองและ `cwd` ที่เลือก
- นโยบายแซนด์บ็อกซ์ของ OpenClaw **ไม่ได้** ครอบการดำเนินการของ ACP harness
- OpenClaw ยังคงบังคับใช้ feature gates ของ ACP, เอเจนต์ที่อนุญาต, ความเป็นเจ้าของเซสชัน, การผูกช่องทาง และนโยบายการส่งมอบของ Gateway
- ใช้ `runtime: "subagent"` สำหรับงานแบบเนทีฟของ OpenClaw ที่ถูกบังคับใช้แซนด์บ็อกซ์

</Warning>

ข้อจำกัดปัจจุบัน:

- หากเซสชันของผู้ร้องขออยู่ในแซนด์บ็อกซ์ การ spawn ของ ACP จะถูกบล็อกสำหรับทั้ง `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
- `sessions_spawn` ที่ใช้ `runtime: "acp"` ไม่รองรับ `sandbox: "require"`

## การระบุเป้าหมายเซสชัน

การทำงาน `/acp` ส่วนใหญ่รับเป้าหมายเซสชันที่ไม่บังคับได้ (`session-key`,
`session-id` หรือ `session-label`)

**ลำดับการระบุ:**

1. อาร์กิวเมนต์เป้าหมายที่ระบุชัดเจน (หรือ `--session` สำหรับ `/acp steer`)
   - ลองใช้ key
   - จากนั้นใช้ session id ที่มีรูปแบบ UUID
   - จากนั้นใช้ label
2. การผูกเธรดปัจจุบัน (หากการสนทนา/เธรดนี้ถูกผูกกับเซสชัน ACP)
3. ทางเลือกสำรองเป็นเซสชันของผู้ร้องขอปัจจุบัน

การผูกการสนทนาปัจจุบันและการผูกเธรดเข้าร่วมใน
ขั้นตอนที่ 2 ทั้งคู่

หากระบุเป้าหมายไม่ได้ OpenClaw จะคืนข้อผิดพลาดที่ชัดเจน
(`Unable to resolve session target: ...`)

## การควบคุม ACP

| คำสั่ง               | สิ่งที่ทำ                                                | ตัวอย่าง                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้างเซสชัน ACP; เลือกผูกปัจจุบันหรือผูกเธรดได้          | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิกเทิร์นที่กำลังดำเนินอยู่สำหรับเซสชันเป้าหมาย       | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่งนำทางไปยังเซสชันที่กำลังทำงาน                   | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิดเซสชันและเลิกผูกเป้าหมายเธรด                          | `/acp close`                                                  |
| `/acp status`        | แสดง backend, โหมด, สถานะ, ตัวเลือกรันไทม์, capability  | `/acp status`                                                 |
| `/acp set-mode`      | ตั้งค่าโหมดรันไทม์สำหรับเซสชันเป้าหมาย                  | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนตัวเลือกการกำหนดค่ารันไทม์ทั่วไป                   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่าการแทนที่ไดเรกทอรีทำงานของรันไทม์                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้งค่าโปรไฟล์นโยบายการอนุมัติ                           | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้งค่า timeout ของรันไทม์ (วินาที)                     | `/acp timeout 120`                                            |
| `/acp model`         | ตั้งค่าการแทนที่โมเดลรันไทม์                             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบการแทนที่ตัวเลือกรันไทม์ของเซสชัน                     | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการเซสชัน ACP ล่าสุดจาก store                    | `/acp sessions`                                               |
| `/acp doctor`        | สุขภาพ backend, capability, วิธีแก้ที่ทำได้              | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอนการติดตั้งและเปิดใช้แบบกำหนดแน่นอน          | `/acp install`                                                |

`/acp status` แสดงตัวเลือกรันไทม์ที่มีผล รวมถึงตัวระบุเซสชันระดับรันไทม์และ
ระดับ backend ข้อผิดพลาดของการควบคุมที่ไม่รองรับจะแสดงอย่างชัดเจน
เมื่อ backend ไม่มี capability `/acp sessions` อ่าน
store สำหรับเซสชันที่ผูกอยู่ปัจจุบันหรือเซสชันของผู้ร้องขอ; โทเค็นเป้าหมาย
(`session-key`, `session-id` หรือ `session-label`) จะถูกระบุผ่าน
การค้นพบเซสชันของ Gateway รวมถึงราก `session.store`
แบบกำหนดเองต่อเอเจนต์

### การแมปตัวเลือกรันไทม์

`/acp` มีคำสั่งอำนวยความสะดวกและตัวตั้งค่าทั่วไป การดำเนินการที่เทียบเท่า:

| คำสั่ง                      | แมปไปยัง                             | หมายเหตุ                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | คีย์การกำหนดค่ารันไทม์ `model`      | สำหรับ Codex ACP, OpenClaw จะปรับ `openai-codex/<model>` ให้เป็น id โมเดลของ adapter และแมป suffix reasoning แบบ slash เช่น `openai-codex/gpt-5.4/high` ไปยัง `reasoning_effort` |
| `/acp set thinking <level>`  | คีย์การกำหนดค่ารันไทม์ `thinking`   | สำหรับ Codex ACP, OpenClaw จะส่ง `reasoning_effort` ที่สอดคล้องกันเมื่อ adapter รองรับ                                                                                         |
| `/acp permissions <profile>` | คีย์การกำหนดค่ารันไทม์ `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | คีย์การกำหนดค่ารันไทม์ `timeout`    | -                                                                                                                                                                              |
| `/acp cwd <path>`            | การแทนที่ cwd ของรันไทม์            | อัปเดตโดยตรง                                                                                                                                                                  |
| `/acp set <key> <value>`     | ทั่วไป                               | `key=cwd` ใช้พาธการแทนที่ cwd                                                                                                                                                 |
| `/acp reset-options`         | ล้างการแทนที่รันไทม์ทั้งหมด         | -                                                                                                                                                                              |

## acpx harness, การตั้งค่า Plugin และสิทธิ์

สำหรับการกำหนดค่า acpx harness (นามแฝง Claude Code / Codex / Gemini CLI),
บริดจ์ MCP ของ plugin-tools และ OpenClaw-tools และ
โหมดสิทธิ์ ACP โปรดดู
[ACP agents - การตั้งค่า](/th/tools/acp-agents-setup)

## การแก้ไขปัญหา

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | Plugin แบ็กเอนด์หายไป ถูกปิดใช้งาน หรือถูกบล็อกโดย `plugins.allow` | ติดตั้งและเปิดใช้งาน Plugin แบ็กเอนด์ ใส่ `acpx` ใน `plugins.allow` เมื่อตั้งค่า allowlist นั้นไว้ แล้วเรียกใช้ `/acp doctor` |
| `ACP is disabled by policy (acp.enabled=false)` | ACP ถูกปิดใช้งานแบบโกลบอล | ตั้งค่า `acp.enabled=true` |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | การ dispatch อัตโนมัติจากข้อความเธรดปกติถูกปิดใช้งาน | ตั้งค่า `acp.dispatch.enabled=true` เพื่อกลับมาใช้การกำหนดเส้นทางเธรดอัตโนมัติ การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงทำงาน |
| `ACP agent "<id>" is not allowed by policy` | เอเจนต์ไม่อยู่ใน allowlist | ใช้ `agentId` ที่อนุญาต หรืออัปเดต `acp.allowedAgents` |
| `/acp doctor` รายงานว่าแบ็กเอนด์ยังไม่พร้อมทันทีหลังเริ่มทำงาน | Plugin แบ็กเอนด์หายไป ถูกปิดใช้งาน ถูกบล็อกโดยนโยบายอนุญาต/ปฏิเสธ หรือไฟล์ปฏิบัติการที่กำหนดค่าไว้ไม่พร้อมใช้งาน | ติดตั้ง/เปิดใช้งาน Plugin แบ็กเอนด์ เรียก `/acp doctor` อีกครั้ง และตรวจสอบข้อผิดพลาดการติดตั้งแบ็กเอนด์หรือนโยบายหากยังไม่สมบูรณ์ |
| ไม่พบคำสั่งฮาร์เนส | ยังไม่ได้ติดตั้ง CLI ของอะแดปเตอร์, Plugin ภายนอกหายไป หรือการดึง `npx` ครั้งแรกสำหรับอะแดปเตอร์ที่ไม่ใช่ Codex ล้มเหลว | เรียกใช้ `/acp doctor` ติดตั้ง/อุ่นเครื่องอะแดปเตอร์บนโฮสต์ Gateway หรือกำหนดคำสั่งเอเจนต์ acpx อย่างชัดเจน |
| ฮาร์เนสแจ้งว่าไม่พบโมเดล | id โมเดลใช้ได้กับ provider/ฮาร์เนสอื่น แต่ใช้กับเป้าหมาย ACP นี้ไม่ได้ | ใช้โมเดลที่ฮาร์เนสนั้นแสดงไว้ กำหนดค่าโมเดลในฮาร์เนส หรือละเว้น override |
| ข้อผิดพลาดการยืนยันตัวตนของผู้ขายจากฮาร์เนส | OpenClaw ทำงานปกติ แต่ CLI/provider เป้าหมายยังไม่ได้เข้าสู่ระบบ | เข้าสู่ระบบหรือระบุคีย์ provider ที่จำเป็นในสภาพแวดล้อมโฮสต์ Gateway |
| `Unable to resolve session target: ...` | คีย์/id/โทเค็นป้ายกำกับไม่ถูกต้อง | เรียก `/acp sessions` คัดลอกคีย์/ป้ายกำกับที่ตรงกัน แล้วลองใหม่ |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มีการสนทนาที่ใช้งานอยู่และผูกได้ | ย้ายไปยังแชต/ช่องเป้าหมายแล้วลองใหม่ หรือใช้การ spawn แบบไม่ผูก |
| `Conversation bindings are unavailable for <channel>.` | อะแดปเตอร์ไม่มีความสามารถในการผูก ACP กับการสนทนาปัจจุบัน | ใช้ `/acp spawn ... --thread ...` เมื่อรองรับ กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปยังช่องที่รองรับ |
| `--thread here requires running /acp spawn inside an active ... thread` | ใช้ `--thread here` นอกบริบทเธรด | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off` |
| `Only <user-id> can rebind this channel/conversation/thread.` | ผู้ใช้อื่นเป็นเจ้าของเป้าหมายการผูกที่ใช้งานอยู่ | ผูกใหม่ในฐานะเจ้าของ หรือใช้การสนทนาหรือเธรดอื่น |
| `Thread bindings are unavailable for <channel>.` | อะแดปเตอร์ไม่มีความสามารถในการผูกเธรด | ใช้ `--thread off` หรือย้ายไปยังอะแดปเตอร์/ช่องที่รองรับ |
| `Sandboxed sessions cannot spawn ACP sessions ...` | รันไทม์ ACP อยู่ฝั่งโฮสต์ แต่เซสชันผู้ร้องขออยู่ในแซนด์บ็อกซ์ | ใช้ `runtime="subagent"` จากเซสชันแซนด์บ็อกซ์ หรือเรียก ACP spawn จากเซสชันที่ไม่อยู่ในแซนด์บ็อกซ์ |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | มีการขอ `sandbox="require"` สำหรับรันไทม์ ACP | ใช้ `runtime="subagent"` เมื่อต้องบังคับใช้แซนด์บ็อกซ์ หรือใช้ ACP พร้อม `sandbox="inherit"` จากเซสชันที่ไม่อยู่ในแซนด์บ็อกซ์ |
| `Cannot apply --model ... did not advertise model support` | ฮาร์เนสเป้าหมายไม่ได้เปิดเผยการสลับโมเดล ACP แบบทั่วไป | ใช้ฮาร์เนสที่ประกาศ ACP `models`/`session/set_model` ใช้การอ้างอิงโมเดล ACP ของ Codex หรือกำหนดค่าโมเดลโดยตรงในฮาร์เนสหากมีแฟล็กเริ่มต้นของตัวเอง |
| เมทาดาทา ACP สำหรับเซสชันที่ผูกไว้หายไป | เมทาดาทาเซสชัน ACP ค้าง/ถูกลบ | สร้างใหม่ด้วย `/acp spawn` แล้วผูกใหม่/โฟกัสเธรด |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` บล็อกการเขียน/exec ในเซสชัน ACP แบบไม่โต้ตอบ | ตั้งค่า `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ต gateway ดู [การกำหนดค่าสิทธิ์](/th/tools/acp-agents-setup#permission-configuration) |
| เซสชัน ACP ล้มเหลวตั้งแต่ต้นโดยมีเอาต์พุตน้อย | พรอมป์สิทธิ์ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions` | ตรวจสอบบันทึก gateway สำหรับ `AcpRuntimeError` หากต้องการสิทธิ์เต็ม ให้ตั้งค่า `permissionMode=approve-all`; หากต้องการลดระดับอย่างราบรื่น ให้ตั้งค่า `nonInteractivePermissions=deny` |
| เซสชัน ACP ค้างไม่สิ้นสุดหลังทำงานเสร็จ | โปรเซสฮาร์เนสจบแล้ว แต่เซสชัน ACP ไม่ได้รายงานว่าเสร็จสมบูรณ์ | ตรวจสอบด้วย `ps aux \| grep acpx`; kill โปรเซสที่ค้างด้วยตนเอง |
| ฮาร์เนสเห็น `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` | ซองเหตุการณ์ภายในรั่วข้ามขอบเขต ACP | อัปเดต OpenClaw แล้วเรียกโฟลว์การทำให้เสร็จสมบูรณ์อีกครั้ง ฮาร์เนสภายนอกควรได้รับเฉพาะพรอมป์การทำให้เสร็จสมบูรณ์แบบข้อความธรรมดาเท่านั้น |

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP - การตั้งค่า](/th/tools/acp-agents-setup)
- [ส่งเอเจนต์](/th/tools/agent-send)
- [แบ็กเอนด์ CLI](/th/gateway/cli-backends)
- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [เครื่องมือแซนด์บ็อกซ์แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (โหมด bridge)](/th/cli/acp)
- [เอเจนต์ย่อย](/th/tools/subagents)
