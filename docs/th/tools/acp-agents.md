---
read_when:
    - การรัน coding harnesses ผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับการสนทนาบนช่องทางการรับส่งข้อความ
    - การผูกการสนทนาในช่องทางข้อความเข้ากับเซสชัน ACP แบบถาวร
    - การแก้ไขปัญหาแบ็กเอนด์ ACP, การเชื่อมต่อ Plugin, หรือการส่งผลลัพธ์การเติมเต็ม
    - การใช้งานคำสั่ง /acp จากแชต
sidebarTitle: ACP agents
summary: เรียกใช้ฮาร์เนสการเขียนโค้ดภายนอก (Claude Code, Cursor, Gemini CLI, Codex ACP แบบระบุชัดเจน, OpenClaw ACP, OpenCode) ผ่านแบ็กเอนด์ ACP
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-06-27T18:25:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

  เซสชัน [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
  ช่วยให้ OpenClaw เรียกใช้ชุดทดสอบการเขียนโค้ดภายนอก (เช่น Claude Code,
  Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI และชุดทดสอบ ACPX
  อื่นๆ ที่รองรับ) ผ่าน Plugin แบ็กเอนด์ ACP ได้

  การ spawn เซสชัน ACP แต่ละครั้งจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

  <Note>
  **ACP คือเส้นทางสำหรับชุดทดสอบภายนอก ไม่ใช่เส้นทาง Codex เริ่มต้น** Plugin
  แอปเซิร์ฟเวอร์ Codex แบบ native เป็นเจ้าของการควบคุม `/codex ...` และรันไทม์แบบฝัง
  `openai/gpt-*` เริ่มต้นสำหรับรอบการทำงานของเอเจนต์ ส่วน ACP เป็นเจ้าของ
  การควบคุม `/acp ...` และเซสชัน `sessions_spawn({ runtime: "acp" })`

  หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็นไคลเอนต์ MCP ภายนอก
  ไปยังบทสนทนาช่องทาง OpenClaw ที่มีอยู่โดยตรง ให้ใช้
  [`openclaw mcp serve`](/th/cli/mcp) แทน ACP
  </Note>

  ## ฉันควรใช้หน้าไหน?

  | คุณต้องการ…                                                                                    | ใช้สิ่งนี้                              | หมายเหตุ                                                                                                                                                                                         |
  | ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | ผูกหรือควบคุม Codex ในบทสนทนาปัจจุบัน                                               | `/codex bind`, `/codex threads`       | เส้นทางแอปเซิร์ฟเวอร์ Codex แบบ native เมื่อเปิดใช้ Plugin `codex`; รวมถึงการตอบกลับแชตที่ผูกไว้ การส่งต่อรูปภาพ model/fast/permissions การหยุด และการควบคุมการชี้นำ ACP เป็นทางเลือกสำรองแบบชัดเจน |
  | เรียกใช้ Claude Code, Gemini CLI, Codex ACP แบบชัดเจน หรือชุดทดสอบภายนอกอื่น _ผ่าน_ OpenClaw | หน้านี้                             | เซสชันที่ผูกกับแชต, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, งานเบื้องหลัง, การควบคุมรันไทม์                                                                                   |
  | เปิดเผยเซสชัน OpenClaw Gateway _เป็น_ เซิร์ฟเวอร์ ACP สำหรับเอดิเตอร์หรือไคลเอนต์                   | [`openclaw acp`](/th/cli/acp)            | โหมดบริดจ์ IDE/ไคลเอนต์สื่อสาร ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                                                                                            |
  | ใช้ AI CLI ภายในเครื่องซ้ำเป็นโมเดลสำรองแบบข้อความเท่านั้น                                              | [แบ็กเอนด์ CLI](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw ไม่มีการควบคุม ACP ไม่มีรันไทม์ชุดทดสอบ                                                                                                                               |

  ## ใช้งานได้ทันทีหรือไม่?

  ได้ หลังจากติดตั้ง Plugin รันไทม์ ACP อย่างเป็นทางการ:

  ```bash
  openclaw plugins install @openclaw/acpx
  openclaw config set plugins.entries.acpx.enabled true
  ```

  เช็กเอาต์ซอร์สสามารถใช้ Plugin เวิร์กสเปซภายในเครื่อง `extensions/acpx` ได้หลังจาก
  `pnpm install` เรียกใช้ `/acp doctor` เพื่อตรวจสอบความพร้อม

  OpenClaw จะสอนเอเจนต์เกี่ยวกับการ spawn ด้วย ACP เฉพาะเมื่อ ACP **ใช้งานได้จริง**
  เท่านั้น: ต้องเปิดใช้ ACP, dispatch ต้องไม่ถูกปิดใช้งาน, เซสชันปัจจุบันต้องไม่ถูก
  sandbox บล็อก และต้องโหลดแบ็กเอนด์รันไทม์แล้ว หากไม่เป็นไปตามเงื่อนไขเหล่านี้
  Skills ของ Plugin ACP และคำแนะนำ ACP สำหรับ `sessions_spawn` จะยังถูกซ่อนไว้
  เพื่อไม่ให้เอเจนต์แนะนำแบ็กเอนด์ที่ไม่พร้อมใช้งาน

  <AccordionGroup>
  <Accordion title="ข้อควรระวังในการใช้งานครั้งแรก">
    - หากตั้งค่า `plugins.allow` ไว้ ค่านี้คือรายการ Plugin แบบจำกัด และ **ต้อง** รวม `acpx`; มิฉะนั้นแบ็กเอนด์ ACP ที่ติดตั้งไว้จะถูกบล็อกโดยตั้งใจ และ `/acp doctor` จะรายงานรายการ allowlist ที่ขาดหายไป
    - อะแดปเตอร์ Codex ACP ถูกจัดเตรียมพร้อมกับ Plugin `acpx` และจะถูกเปิดใช้งานภายในเครื่องเมื่อเป็นไปได้
    - Codex ACP ทำงานด้วย `CODEX_HOME` ที่แยกออกมา; OpenClaw คัดลอกรายการโปรเจกต์ที่เชื่อถือได้พร้อมการกำหนดค่าการกำหนดเส้นทาง model/provider ที่ปลอดภัยจากการกำหนดค่า Codex ของโฮสต์ ขณะที่ auth, notifications และ hooks ยังคงอยู่ในการกำหนดค่าของโฮสต์
    - อะแดปเตอร์ชุดทดสอบเป้าหมายอื่นๆ อาจยังถูกดึงมาเมื่อจำเป็นด้วย `npx` ในครั้งแรกที่คุณใช้งาน
    - การยืนยันตัวตนของผู้ขายยังต้องมีอยู่บนโฮสต์สำหรับชุดทดสอบนั้น
    - หากโฮสต์ไม่มี npm หรือการเข้าถึงเครือข่าย การดึงอะแดปเตอร์ครั้งแรกจะล้มเหลวจนกว่าจะเตรียมแคชไว้ล่วงหน้า หรือติดตั้งอะแดปเตอร์ด้วยวิธีอื่น

  </Accordion>
  <Accordion title="ข้อกำหนดเบื้องต้นของรันไทม์">
    ACP เปิดใช้โปรเซสชุดทดสอบภายนอกจริง OpenClaw เป็นเจ้าของการกำหนดเส้นทาง
    สถานะงานเบื้องหลัง การส่งมอบ การผูก และนโยบาย ส่วนชุดทดสอบ
    เป็นเจ้าของการเข้าสู่ระบบ provider แค็ตตาล็อกโมเดล พฤติกรรมของระบบไฟล์ และ
    เครื่องมือ native ของตนเอง

    ก่อนโทษ OpenClaw ให้ตรวจสอบว่า:

    - `/acp doctor` รายงานว่าแบ็กเอนด์เปิดใช้งานอยู่และอยู่ในสถานะปกติ
    - id เป้าหมายได้รับอนุญาตโดย `acp.allowedAgents` เมื่อตั้งค่ารายการอนุญาตนั้นไว้
    - คำสั่งฮาร์เนสสามารถเริ่มทำงานบนโฮสต์ Gateway ได้
    - มีการยืนยันตัวตนของผู้ให้บริการสำหรับฮาร์เนสนั้น (`claude`, `codex`, `gemini`, `opencode`, `droid` ฯลฯ)
    - โมเดลที่เลือกมีอยู่สำหรับฮาร์เนสนั้น - id ของโมเดลไม่สามารถใช้ข้ามฮาร์เนสได้
    - `cwd` ที่ร้องขอมีอยู่และเข้าถึงได้ หรือไม่ต้องระบุ `cwd` แล้วให้แบ็กเอนด์ใช้ค่าเริ่มต้นของตัวเอง
    - โหมดสิทธิ์ตรงกับงาน เซสชันแบบไม่โต้ตอบไม่สามารถคลิกพรอมป์สิทธิ์ดั้งเดิมได้ ดังนั้นงานเขียนโค้ดที่เน้นการเขียน/รันคำสั่งมักต้องใช้โปรไฟล์สิทธิ์ ACPX ที่ดำเนินต่อแบบ headless ได้

  </Accordion>
</AccordionGroup>

เครื่องมือ Plugin ของ OpenClaw และเครื่องมือ OpenClaw ในตัว **จะไม่** ถูกเปิดเผยให้
ฮาร์เนส ACP ตามค่าเริ่มต้น เปิดใช้บริดจ์ MCP แบบชัดเจนใน
[เอเจนต์ ACP - การตั้งค่า](/th/tools/acp-agents-setup) เฉพาะเมื่อฮาร์เนส
ควรเรียกใช้เครื่องมือเหล่านั้นโดยตรงเท่านั้น

## เป้าหมายฮาร์เนสที่รองรับ

เมื่อใช้แบ็กเอนด์ `acpx` ให้ใช้ id ฮาร์เนสเหล่านี้เป็นเป้าหมายของ `/acp spawn <id>`
หรือ `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| id ฮาร์เนส | แบ็กเอนด์ทั่วไป                                | หมายเหตุ                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | อะแดปเตอร์ Claude Code ACP                        | ต้องมีการยืนยันตัวตน Claude Code บนโฮสต์                                              |
| `codex`    | อะแดปเตอร์ Codex ACP                              | เป็น fallback ACP แบบชัดเจนเฉพาะเมื่อ `/codex` ดั้งเดิมไม่พร้อมใช้งานหรือมีการร้องขอ ACP |
| `copilot`  | อะแดปเตอร์ GitHub Copilot ACP                     | ต้องมีการยืนยันตัวตน Copilot CLI/runtime                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | แทนที่คำสั่ง acpx หากการติดตั้งในเครื่องเปิดเผย entrypoint ของ ACP ที่ต่างออกไป    |
| `droid`    | Factory Droid CLI                              | ต้องมีการยืนยันตัวตน Factory/Droid หรือ `FACTORY_API_KEY` ในสภาพแวดล้อมฮาร์เนส        |
| `gemini`   | อะแดปเตอร์ Gemini CLI ACP                         | ต้องมีการยืนยันตัวตน Gemini CLI หรือการตั้งค่า API key                                          |
| `iflow`    | iFlow CLI                                      | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `kilocode` | Kilo Code CLI                                  | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `kimi`     | Kimi/Moonshot CLI                              | ต้องมีการยืนยันตัวตน Kimi/Moonshot บนโฮสต์                                            |
| `kiro`     | Kiro CLI                                       | ความพร้อมใช้งานของอะแดปเตอร์และการควบคุมโมเดลขึ้นอยู่กับ CLI ที่ติดตั้ง                 |
| `opencode` | อะแดปเตอร์ OpenCode ACP                           | ต้องมีการยืนยันตัวตน OpenCode CLI/ผู้ให้บริการ                                                |
| `openclaw` | บริดจ์ OpenClaw Gateway ผ่าน `openclaw acp` | ให้ฮาร์เนสที่รองรับ ACP คุยกลับไปยังเซสชัน OpenClaw Gateway ได้                 |
| `qwen`     | Qwen Code / Qwen CLI                           | ต้องมีการยืนยันตัวตนที่เข้ากันได้กับ Qwen บนโฮสต์                                          |

สามารถกำหนดค่านามแฝงเอเจนต์ acpx แบบกำหนดเองใน acpx เองได้ แต่
นโยบาย OpenClaw ยังคงตรวจสอบ `acp.allowedAgents` และการแมป
`agents.list[].runtime.acp.agent` ใด ๆ ก่อน dispatch

## คู่มือปฏิบัติการสำหรับผู้ปฏิบัติงาน

โฟลว์ `/acp` แบบรวดเร็วจากแชต:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` หรือระบุชัดเจน
    `/acp spawn codex --bind here`
  </Step>
  <Step title="ทำงาน">
    ดำเนินต่อในบทสนทนาหรือเธรดที่ผูกไว้ (หรือระบุคีย์เซสชันอย่างชัดเจน)
  </Step>
  <Step title="ตรวจสอบสถานะ">
    `/acp status`
  </Step>
  <Step title="ปรับแต่ง">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`
  </Step>
  <Step title="บังคับทิศทาง">
    โดยไม่แทนที่บริบท: `/acp steer tighten logging and continue`
  </Step>
  <Step title="หยุด">
    `/acp cancel` (เทิร์นปัจจุบัน) หรือ `/acp close` (เซสชัน + การผูก)
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="รายละเอียดวงจรชีวิต">
    - Spawn สร้างหรือดำเนินเซสชัน runtime ของ ACP ต่อ บันทึกเมทาดาทา ACP ในที่เก็บเซสชัน OpenClaw และอาจสร้างงานเบื้องหลังเมื่อรันนั้นมี parent เป็นเจ้าของ
    - เซสชัน ACP ที่ parent เป็นเจ้าของจะถูกถือว่าเป็นงานเบื้องหลัง แม้เมื่อเซสชัน runtime เป็นแบบคงอยู่ก็ตาม การเสร็จสิ้นและการส่งข้ามพื้นผิวจะผ่านตัวแจ้งเตือนงานของ parent แทนที่จะทำตัวเหมือนเซสชันแชตปกติที่ผู้ใช้เห็น
    - การบำรุงรักษางานจะปิดเซสชัน ACP แบบ one-shot ที่ parent เป็นเจ้าของซึ่งสิ้นสุดแล้วหรือกำพร้า เซสชัน ACP แบบคงอยู่จะถูกเก็บไว้ตราบใดที่ยังมีการผูกบทสนทนาที่ใช้งานอยู่ เซสชันแบบคงอยู่ที่ค้างอยู่โดยไม่มีการผูกที่ใช้งานอยู่จะถูกปิด เพื่อไม่ให้กลับมาดำเนินต่ออย่างเงียบ ๆ หลังจากงานที่เป็นเจ้าของเสร็จสิ้นแล้วหรือระเบียนงานหายไป
    - ข้อความติดตามผลที่ผูกไว้จะไปยังเซสชัน ACP โดยตรงจนกว่าการผูกจะถูกปิด เลิกโฟกัส รีเซ็ต หรือหมดอายุ
    - คำสั่ง Gateway จะอยู่ในเครื่องเสมอ `/acp ...`, `/status` และ `/unfocus` จะไม่ถูกส่งเป็นข้อความพรอมป์ปกติไปยังฮาร์เนส ACP ที่ผูกไว้
    - `cancel` ยกเลิกเทิร์นที่ใช้งานอยู่เมื่อแบ็กเอนด์รองรับการยกเลิก แต่ไม่ได้ลบการผูกหรือเมทาดาทาเซสชัน
    - `close` จบเซสชัน ACP จากมุมมองของ OpenClaw และลบการผูก ฮาร์เนสอาจยังเก็บประวัติ upstream ของตัวเองไว้หากรองรับการดำเนินต่อ
    - Plugin acpx ทำความสะอาดต้นไม้โปรเซส wrapper และอะแดปเตอร์ที่ OpenClaw เป็นเจ้าของหลังจาก `close` และเก็บกวาด orphan ACPX ที่ OpenClaw เป็นเจ้าของและค้างอยู่ระหว่างการเริ่มต้น Gateway
    - worker runtime ที่ไม่ได้ใช้งานมีสิทธิ์ถูกทำความสะอาดหลังจาก `acp.runtime.ttlMinutes`; เมทาดาทาเซสชันที่จัดเก็บไว้ยังคงพร้อมใช้งานสำหรับ `/acp sessions`

  </Accordion>
  <Accordion title="กฎการกำหนดเส้นทาง Codex ดั้งเดิม">
    ตัวกระตุ้นภาษาธรรมชาติที่ควรกำหนดเส้นทางไปยัง **Plugin Codex
    ดั้งเดิม** เมื่อเปิดใช้งานอยู่:

    - "ผูกช่อง Discord นี้กับ Codex"
    - "แนบแชตนี้เข้ากับเธรด Codex `<id>`"
    - "แสดงเธรด Codex แล้วผูกเธรดนี้"

    การผูกการสนทนา Codex แบบเนทีฟเป็นเส้นทางควบคุมแชทเริ่มต้น
    เครื่องมือแบบไดนามิกของ OpenClaw ยังคงดำเนินการผ่าน OpenClaw ขณะที่
    เครื่องมือเนทีฟของ Codex เช่น shell/apply-patch ดำเนินการภายใน Codex
    สำหรับเหตุการณ์เครื่องมือเนทีฟของ Codex OpenClaw จะแทรกรีเลย์ฮุกเนทีฟ
    ต่อหนึ่งเทิร์น เพื่อให้ฮุกของ Plugin สามารถบล็อก `before_tool_call`, สังเกต
    `after_tool_call`, และกำหนดเส้นทางเหตุการณ์ `PermissionRequest` ของ Codex
    ผ่านการอนุมัติของ OpenClaw ฮุก `Stop` ของ Codex จะถูกรีเลย์ไปยัง
    `before_agent_finalize` ของ OpenClaw ซึ่ง Plugin สามารถขอให้โมเดลทำงานอีก
    หนึ่งรอบก่อนที่ Codex จะสรุปคำตอบ รีเลย์นี้ยังคงตั้งใจให้ระมัดระวัง:
    ไม่เปลี่ยนอาร์กิวเมนต์ของเครื่องมือเนทีฟของ Codex หรือเขียนระเบียนเธรดของ Codex ใหม่ ใช้ ACP แบบชัดเจนเฉพาะ
    เมื่อต้องการโมเดลรันไทม์/เซสชันของ ACP เท่านั้น ขอบเขตการรองรับ Codex
    แบบฝังตัวมีเอกสารอยู่ใน
    [สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="ชีตสรุปการเลือกโมเดล / ผู้ให้บริการ / รันไทม์">
    - การอ้างอิงโมเดล Codex เดิม - เส้นทางโมเดล OAuth/การสมัครสมาชิก Codex เดิมที่ซ่อมแซมโดย doctor
    - `openai/*` - รันไทม์ app-server ฝังตัวของ Codex แบบเนทีฟสำหรับเทิร์นเอเจนต์ OpenAI
    - `/codex ...` - การควบคุมการสนทนา Codex แบบเนทีฟ
    - `/acp ...` หรือ `runtime: "acp"` - การควบคุม ACP/acpx แบบชัดเจน

  </Accordion>
  <Accordion title="ทริกเกอร์ภาษาธรรมชาติสำหรับการกำหนดเส้นทาง ACP">
    ทริกเกอร์ที่ควรกำหนดเส้นทางไปยังรันไทม์ ACP:

    - "เรียกใช้สิ่งนี้เป็นเซสชัน Claude Code ACP แบบครั้งเดียว แล้วสรุปผลลัพธ์"
    - "ใช้ Gemini CLI สำหรับงานนี้ในเธรด แล้วเก็บการติดตามผลไว้ในเธรดเดียวกันนั้น"
    - "เรียกใช้ Codex ผ่าน ACP ในเธรดเบื้องหลัง"

    OpenClaw เลือก `runtime: "acp"`, resolve `agentId` ของ harness,
    ผูกกับการสนทนาหรือเธรดปัจจุบันเมื่อรองรับ และ
    กำหนดเส้นทางการติดตามผลไปยังเซสชันนั้นจนกว่าจะปิด/หมดอายุ Codex จะ
    ไปตามเส้นทางนี้เฉพาะเมื่อมีการระบุ ACP/acpx อย่างชัดเจน หรือ Plugin Codex
    แบบเนทีฟไม่พร้อมใช้งานสำหรับการดำเนินการที่ร้องขอ

    สำหรับ `sessions_spawn` จะโฆษณา `runtime: "acp"` เฉพาะเมื่อ ACP
    เปิดใช้งานอยู่ ผู้ร้องขอไม่ได้อยู่ใน sandbox และโหลดแบ็กเอนด์รันไทม์
    ACP แล้ว `acp.dispatch.enabled=false` จะหยุดการ dispatch เธรด ACP
    อัตโนมัติชั่วคราว แต่ไม่ซ่อนหรือบล็อกการเรียก
    `sessions_spawn({ runtime: "acp" })` แบบชัดเจน ซึ่งกำหนดเป้าหมายไปยัง id ของ ACP harness เช่น `codex`,
    `claude`, `droid`, `gemini`, หรือ `opencode` อย่าส่ง id เอเจนต์
    config ปกติของ OpenClaw จาก `agents_list` เว้นแต่รายการนั้นจะ
    ถูกกำหนดค่าอย่างชัดเจนด้วย `agents.list[].runtime.type="acp"`;
    มิฉะนั้นให้ใช้รันไทม์ sub-agent เริ่มต้น เมื่อเอเจนต์ OpenClaw
    ถูกกำหนดค่าด้วย `runtime.type="acp"` OpenClaw จะใช้
    `runtime.acp.agent` เป็น id ของ harness พื้นฐาน

  </Accordion>
</AccordionGroup>

## ACP เทียบกับ sub-agents

ใช้ ACP เมื่อต้องการรันไทม์ harness ภายนอก ใช้ **app-server Codex
แบบเนทีฟ** สำหรับการผูก/ควบคุมการสนทนา Codex เมื่อเปิดใช้งาน Plugin `codex`
ใช้ **sub-agents** เมื่อต้องการรันที่มอบหมายแบบเนทีฟของ OpenClaw

| พื้นที่          | เซสชัน ACP                           | การรัน sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| รันไทม์       | Plugin แบ็กเอนด์ ACP (เช่น acpx) | รันไทม์ sub-agent เนทีฟของ OpenClaw  |
| คีย์เซสชัน   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| คำสั่งหลัก | `/acp ...`                            | `/subagents ...`                   |
| เครื่องมือ spawn    | `sessions_spawn` พร้อม `runtime:"acp"` | `sessions_spawn` (รันไทม์เริ่มต้น) |

ดูเพิ่มเติมที่ [Sub-agents](/th/tools/subagents)

## วิธีที่ ACP รัน Claude Code

สำหรับ Claude Code ผ่าน ACP สแตกคือ:

1. control plane ของเซสชัน ACP ของ OpenClaw
2. Plugin รันไทม์ `@openclaw/acpx` อย่างเป็นทางการ
3. อะแดปเตอร์ Claude ACP
4. กลไกรันไทม์/เซสชันฝั่ง Claude

ACP Claude คือ **เซสชัน harness** ที่มีการควบคุม ACP, การกลับมาใช้เซสชันต่อ,
การติดตามงานเบื้องหลัง และการผูกการสนทนา/เธรดแบบเลือกได้

แบ็กเอนด์ CLI เป็นรันไทม์ fallback ภายในแบบข้อความล้วนที่แยกต่างหาก - ดู
[แบ็กเอนด์ CLI](/th/gateway/cli-backends)

สำหรับผู้ปฏิบัติงาน กฎที่ใช้ได้จริงคือ:

- **ต้องการ `/acp spawn`, เซสชันที่ผูกได้, การควบคุมรันไทม์ หรืองาน harness แบบถาวรใช่ไหม** ใช้ ACP
- **ต้องการ fallback ข้อความภายในแบบง่ายผ่าน CLI ดิบใช่ไหม** ใช้แบ็กเอนด์ CLI

## เซสชันที่ผูกไว้

### โมเดลทางความคิด

- **พื้นผิวแชท** - ที่ที่ผู้คนสนทนาต่อเนื่อง (ช่อง Discord, หัวข้อ Telegram, แชท iMessage)
- **เซสชัน ACP** - สถานะรันไทม์ Codex/Claude/Gemini แบบทนทานที่ OpenClaw กำหนดเส้นทางไปยัง
- **เธรด/หัวข้อลูก** - พื้นผิวรับส่งข้อความเพิ่มเติมที่เป็นตัวเลือก ซึ่งสร้างโดย `--thread ...` เท่านั้น
- **พื้นที่ทำงานรันไทม์** - ตำแหน่งระบบไฟล์ (`cwd`, repo checkout, พื้นที่ทำงานแบ็กเอนด์) ที่ harness รันอยู่ เป็นอิสระจากพื้นผิวแชท

### การผูกกับการสนทนาปัจจุบัน

`/acp spawn <harness> --bind here` ปักหมุดการสนทนาปัจจุบันกับ
เซสชัน ACP ที่ spawn แล้ว - ไม่มีเธรดลูก ใช้พื้นผิวแชทเดิม OpenClaw ยังคง
เป็นเจ้าของ transport, auth, safety, และ delivery ข้อความติดตามผลในการ
สนทนานั้นจะถูกกำหนดเส้นทางไปยังเซสชันเดียวกัน; `/new` และ `/reset` รีเซ็ต
เซสชันในที่เดิม; `/acp close` ลบการผูก

ตัวอย่าง:

```text
/codex bind                                              # ผูก Codex แบบเนทีฟ กำหนดเส้นทางข้อความอนาคตมาที่นี่
/codex model gpt-5.4                                     # ปรับแต่งเธรด Codex แบบเนทีฟที่ผูกไว้
/codex stop                                              # ควบคุมเทิร์น Codex แบบเนทีฟที่ใช้งานอยู่
/acp spawn codex --bind here                             # fallback ACP แบบชัดเจนสำหรับ Codex
/acp spawn codex --thread auto                           # อาจสร้างเธรด/หัวข้อลูกและผูกที่นั่น
/acp spawn codex --bind here --cwd /workspace/repo       # การผูกแชทเดิม Codex รันใน /workspace/repo
```

<AccordionGroup>
  <Accordion title="กฎการผูกและความเป็นเอกสิทธิ์">
    - `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้
    - `--bind here` ทำงานเฉพาะกับช่องที่ประกาศการรองรับการผูกการสนทนาปัจจุบัน; มิฉะนั้น OpenClaw จะส่งข้อความไม่รองรับที่ชัดเจน การผูกคงอยู่ข้ามการรีสตาร์ท Gateway
    - บน Discord, `spawnSessions` ควบคุมการสร้างเธรดลูกสำหรับ `--thread auto|here` - ไม่ใช่ `--bind here`
    - หากคุณ spawn ไปยังเอเจนต์ ACP อื่นโดยไม่มี `--cwd` OpenClaw จะสืบทอดพื้นที่ทำงานของ **เอเจนต์เป้าหมาย** โดยค่าเริ่มต้น พาธที่สืบทอดซึ่งหายไป (`ENOENT`/`ENOTDIR`) จะ fallback ไปยังค่าเริ่มต้นของแบ็กเอนด์; ข้อผิดพลาดการเข้าถึงอื่น ๆ (เช่น `EACCES`) จะแสดงเป็นข้อผิดพลาดการ spawn
    - คำสั่งจัดการ Gateway ยังคงเป็น local ในการสนทนาที่ผูกไว้ - คำสั่ง `/acp ...` จะถูกจัดการโดย OpenClaw แม้เมื่อข้อความติดตามผลปกติถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้; `/status` และ `/unfocus` ยังอยู่ local เมื่อใดก็ตามที่เปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

  </Accordion>
  <Accordion title="เซสชันที่ผูกกับเธรด">
    เมื่อเปิดใช้งานการผูกเธรดสำหรับอะแดปเตอร์ช่อง:

    - OpenClaw ผูกเธรดกับเซสชัน ACP เป้าหมาย
    - ข้อความติดตามผลในเธรดนั้นถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้
    - เอาต์พุต ACP ถูกส่งกลับไปยังเธรดเดียวกัน
    - การ unfocus/ปิด/archive/หมดเวลา idle หรือการหมดอายุ max-age จะลบการผูก
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, และ `/unfocus` เป็นคำสั่ง Gateway ไม่ใช่ prompt ไปยัง ACP harness

    feature flag ที่จำเป็นสำหรับ ACP ที่ผูกกับเธรด:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` เปิดอยู่โดยค่าเริ่มต้น (ตั้งค่า `false` เพื่อหยุดการ dispatch เธรด ACP อัตโนมัติชั่วคราว; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงทำงาน)
    - เปิดใช้งานการ spawn เซสชันเธรดของ channel-adapter (ค่าเริ่มต้น: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    การรองรับการผูกเธรดขึ้นอยู่กับอะแดปเตอร์ หากอะแดปเตอร์ช่องที่ใช้งานอยู่
    ไม่รองรับการผูกเธรด OpenClaw จะส่งข้อความไม่รองรับ/ไม่พร้อมใช้งาน
    ที่ชัดเจน

  </Accordion>
  <Accordion title="ช่องที่รองรับเธรด">
    - อะแดปเตอร์ช่องใด ๆ ที่เปิดเผยความสามารถการผูกเซสชัน/เธรด
    - การรองรับในตัวปัจจุบัน: เธรด/ช่อง **Discord**, หัวข้อ **Telegram** (หัวข้อฟอรัมในกลุ่ม/supergroups และหัวข้อ DM)
    - ช่อง Plugin สามารถเพิ่มการรองรับผ่านอินเทอร์เฟซการผูกเดียวกัน

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
  ระบุการสนทนาเป้าหมาย รูปแบบต่อช่อง:

- **ช่อง/เธรด Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **ช่อง/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"` แนะนำให้ใช้ id Slack ที่เสถียร; การผูกช่องยังตรงกับการตอบกลับภายในเธรดของช่องนั้นด้วย
- **หัวข้อฟอรัม Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/กลุ่ม WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"` ใช้หมายเลข E.164 เช่น `+15555550123` สำหรับแชทโดยตรง และ JID กลุ่ม WhatsApp เช่น `120363424282127706@g.us` สำหรับกลุ่ม
- **DM/กลุ่ม iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"` แนะนำให้ใช้ `chat_id:*` สำหรับการผูกกลุ่มที่เสถียร

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  id เอเจนต์ OpenClaw ที่เป็นเจ้าของ
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  การ override ACP แบบเลือกได้
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  ป้ายกำกับแบบเลือกได้ที่แสดงต่อผู้ปฏิบัติงาน
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์แบบเลือกได้
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  การ override แบ็กเอนด์แบบเลือกได้
</ParamField>

### ค่าเริ่มต้นรันไทม์ต่อเอเจนต์

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้น ACP หนึ่งครั้งต่อเอเจนต์:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ลำดับความสำคัญของการ override สำหรับเซสชัน ACP ที่ผูกไว้:**

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

- OpenClaw รับประกันว่าเซสชัน ACP ที่กำหนดค่าไว้มีอยู่หลังจากการอนุญาตเข้าใช้งานเฉพาะช่องทางและก่อนใช้งาน
- ข้อความในช่องทาง หัวข้อ หรือแชตนั้นจะถูกส่งต่อไปยังเซสชัน ACP ที่กำหนดค่าไว้
- การผูก ACP ที่กำหนดค่าไว้เป็นเจ้าของเส้นทางเซสชันของตนเอง การกระจายแบบ fan-out ของช่องทางจะไม่แทนที่เซสชัน ACP ที่กำหนดค่าไว้สำหรับการผูกที่ตรงกัน
- ในบทสนทนาที่ผูกไว้ `/new` และ `/reset` จะรีเซ็ตคีย์เซสชัน ACP เดิมในตำแหน่งเดิม
- การผูกรันไทม์ชั่วคราว (เช่น ที่สร้างโดยโฟลว์ thread-focus) ยังคงมีผลเมื่อมีอยู่
- สำหรับการสร้าง ACP ข้ามเอเจนต์โดยไม่มี `cwd` ที่ระบุชัดเจน OpenClaw จะสืบทอดพื้นที่ทำงานของเอเจนต์เป้าหมายจากการกำหนดค่าเอเจนต์
- เส้นทางพื้นที่ทำงานที่สืบทอดแต่หายไปจะถอยกลับไปใช้ cwd เริ่มต้นของแบ็กเอนด์ ส่วนความล้มเหลวในการเข้าถึงที่ไม่ได้หายไปจะแสดงเป็นข้อผิดพลาดการสร้าง

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
    `acp.defaultAgent` เมื่อกำหนดค่าไว้ `mode: "session"` ต้องมี
    `thread: true` เพื่อคงบทสนทนาที่ผูกไว้แบบถาวร
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
  id ของฮาร์เนส ACP เป้าหมาย ถอยกลับไปใช้ `acp.defaultAgent` หากตั้งค่าไว้
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  ขอใช้โฟลว์การผูกเธรดเมื่อรองรับ
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` เป็นแบบครั้งเดียว ส่วน `"session"` เป็นแบบถาวร หากมี `thread: true` และ
  ละเว้น `mode` OpenClaw อาจใช้ค่าเริ่มต้นเป็นลักษณะการทำงานแบบถาวรตาม
  เส้นทางรันไทม์ `mode: "session"` ต้องมี `thread: true`
</ParamField>
<ParamField path="cwd" type="string">
  ไดเรกทอรีทำงานของรันไทม์ที่ร้องขอ (ตรวจสอบความถูกต้องโดยนโยบาย
  แบ็กเอนด์/รันไทม์) หากละเว้น การสร้าง ACP จะสืบทอดพื้นที่ทำงานของเอเจนต์เป้าหมาย
  เมื่อกำหนดค่าไว้ เส้นทางที่สืบทอดแต่หายไปจะถอยกลับไปใช้ค่าเริ่มต้น
  ของแบ็กเอนด์ ส่วนข้อผิดพลาดการเข้าถึงจริงจะถูกส่งกลับ
</ParamField>
<ParamField path="label" type="string">
  ป้ายกำกับที่แสดงต่อผู้ปฏิบัติการซึ่งใช้ในข้อความเซสชัน/แบนเนอร์
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ดำเนินเซสชัน ACP ที่มีอยู่ต่อแทนการสร้างเซสชันใหม่ เอเจนต์
  จะเล่นประวัติบทสนทนาซ้ำผ่าน `session/load` ต้องมี
  `runtime: "acp"`
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` จะสตรีมสรุปความคืบหน้าการรัน ACP เริ่มต้นกลับไปยัง
  เซสชันผู้ร้องขอในรูปแบบเหตุการณ์ระบบ การตอบกลับที่ยอมรับรวมถึง
  `streamLogPath` ซึ่งชี้ไปยังบันทึก JSONL ตามขอบเขตเซสชัน
  (`<sessionId>.acp-stream.jsonl`) ที่คุณสามารถ tail เพื่อดูประวัติการถ่ายทอดทั้งหมดได้
  สตรีมความคืบหน้าของพาเรนต์จะแสดงคำอธิบายจากผู้ช่วยและความคืบหน้าสถานะ ACP
  เป็นค่าเริ่มต้น เว้นแต่ `streaming.progress.commentary=false` Discord ยังตั้งค่าเริ่มต้น
  ของตัวอย่างพาเรนต์เป็นโหมดความคืบหน้าเมื่อไม่ได้กำหนดค่าโหมดสตรีม สถานะ
  ความคืบหน้ายังคงเคารพ `acp.stream.tagVisibility` ดังนั้นแท็กเช่น `plan`
  จะยังคงถูกซ่อนเว้นแต่เปิดใช้อย่างชัดเจน
</ParamField>

การรัน `sessions_spawn` ของ ACP ใช้ `agents.defaults.subagents.runTimeoutSeconds` เป็น
ขีดจำกัดเทิร์นลูกเริ่มต้น เครื่องมือนี้ไม่รับการแทนที่ timeout
แบบต่อการเรียก

<ParamField path="model" type="string">
  การแทนที่โมเดลอย่างชัดเจนสำหรับเซสชันลูก ACP การสร้าง Codex ACP
  จะปรับ OpenAI refs เช่น `openai/gpt-5.4` ให้เป็นการกำหนดค่าเริ่มต้นของ Codex ACP
  ก่อน `session/new`; รูปแบบ Slash เช่น `openai/gpt-5.4/high`
  จะตั้งค่า reasoning effort ของ Codex ACP ด้วย
  เมื่อละเว้น `sessions_spawn({ runtime: "acp" })` จะใช้ค่าเริ่มต้น
  ของโมเดล subagent ที่มีอยู่ (`agents.defaults.subagents.model` หรือ
  `agents.list[].subagents.model`) เมื่อกำหนดค่าไว้ มิฉะนั้นจะปล่อยให้
  ฮาร์เนส ACP ใช้โมเดลเริ่มต้นของตนเอง
  ฮาร์เนสอื่นต้องประกาศ ACP `models` และรองรับ
  `session/set_model`; มิฉะนั้น OpenClaw/acpx จะล้มเหลวอย่างชัดเจนแทนที่จะ
  ถอยกลับไปใช้ค่าเริ่มต้นของเอเจนต์เป้าหมายอย่างเงียบ ๆ
</ParamField>
<ParamField path="thinking" type="string">
  ความพยายามด้านการคิด/การให้เหตุผลที่ระบุอย่างชัดเจน สำหรับ Codex ACP, `minimal` จะแมปเป็น
  ความพยายามต่ำ, `low`/`medium`/`high`/`xhigh` จะแมปโดยตรง และ `off`
  จะละเว้นการแทนที่ reasoning-effort ตอนเริ่มต้น
  เมื่อละเว้น การสร้าง ACP จะใช้ค่าเริ่มต้นการคิดของ subagent ที่มีอยู่ และ
  `agents.defaults.models["provider/model"].params.thinking` ตามโมเดลที่เลือก
</ParamField>

## โหมดการผูกและเธรดสำหรับการสร้าง

<Tabs>
  <Tab title="--bind here|off">
    | โหมด   | ลักษณะการทำงาน                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | ผูกบทสนทนาที่ใช้งานอยู่ปัจจุบันในตำแหน่งเดิม ล้มเหลวหากไม่มีบทสนทนาใดใช้งานอยู่ |
    | `off`  | ไม่สร้างการผูกบทสนทนาปัจจุบัน                          |

    หมายเหตุ:

    - `--bind here` เป็นเส้นทางผู้ปฏิบัติการที่ง่ายที่สุดสำหรับ "ทำให้ช่องทางหรือแชตนี้มี Codex รองรับ"
    - `--bind here` ไม่สร้างเธรดลูก
    - `--bind here` ใช้ได้เฉพาะบนช่องทางที่เปิดเผยการรองรับการผูกบทสนทนาปัจจุบัน
    - ไม่สามารถใช้ `--bind` และ `--thread` ร่วมกันในการเรียก `/acp spawn` เดียวกัน

  </Tab>
  <Tab title="--thread auto|here|off">
    | โหมด   | ลักษณะการทำงาน                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | ในเธรดที่ใช้งานอยู่: ผูกเธรดนั้น นอกเธรด: สร้าง/ผูกเธรดลูกเมื่อรองรับ |
    | `here` | ต้องมีเธรดที่ใช้งานอยู่ปัจจุบัน ล้มเหลวหากไม่ได้อยู่ในเธรดหนึ่ง                                                  |
    | `off`  | ไม่มีการผูก เซสชันเริ่มแบบไม่ผูก                                                                 |

    หมายเหตุ:

    - บนพื้นผิวที่ไม่รองรับการผูกเธรด ลักษณะการทำงานเริ่มต้นจะเทียบเท่ากับ `off`
    - การสร้างที่ผูกกับเธรดต้องมีการรองรับนโยบายช่องทาง:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - ใช้ `--bind here` เมื่อคุณต้องการปักหมุดบทสนทนาปัจจุบันโดยไม่สร้างเธรดลูก

  </Tab>
</Tabs>

## โมเดลการส่งมอบ

เซสชัน ACP สามารถเป็นได้ทั้งพื้นที่ทำงานแบบโต้ตอบหรือ
งานเบื้องหลังที่พาเรนต์เป็นเจ้าของ เส้นทางการส่งมอบขึ้นอยู่กับรูปแบบนั้น

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    เซสชันแบบโต้ตอบมีไว้เพื่อสนทนาต่อบนพื้นผิวแชต
    ที่มองเห็นได้:

    - `/acp spawn ... --bind here` ผูกบทสนทนาปัจจุบันกับเซสชัน ACP
    - `/acp spawn ... --thread ...` ผูกเธรด/หัวข้อของช่องทางกับเซสชัน ACP
    - `bindings[].type="acp"` ที่กำหนดค่าไว้แบบถาวรจะกำหนดเส้นทางบทสนทนาที่ตรงกันไปยังเซสชัน ACP เดิม

    ข้อความติดตามผลในบทสนทนาที่ผูกไว้จะถูกส่งตรงไปยัง
    เซสชัน ACP และเอาต์พุต ACP จะถูกส่งกลับไปยัง
    ช่องทาง/เธรด/หัวข้อเดียวกันนั้น

    สิ่งที่ OpenClaw ส่งไปยังฮาร์เนส:

    - การติดตามผลที่ผูกตามปกติจะถูกส่งเป็นข้อความพรอมป์ พร้อมไฟล์แนบเฉพาะเมื่อฮาร์เนส/แบ็กเอนด์รองรับเท่านั้น
    - คำสั่งจัดการ `/acp` และคำสั่ง Gateway ภายในจะถูกดักก่อนส่งต่อไปยัง ACP
    - เหตุการณ์เสร็จสิ้นที่สร้างโดยรันไทม์จะถูกทำให้เป็นรูปธรรมตามเป้าหมาย เอเจนต์ OpenClaw จะได้รับซอง runtime-context ภายในของ OpenClaw; ฮาร์เนส ACP ภายนอกจะได้รับพรอมป์ธรรมดาพร้อมผลลัพธ์ลูกและคำสั่ง ซองดิบ `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ไม่ควรถูกส่งไปยังฮาร์เนสภายนอกหรือถูกคงอยู่เป็นข้อความทรานสคริปต์ผู้ใช้ ACP
    - รายการทรานสคริปต์ ACP ใช้ข้อความทริกเกอร์ที่ผู้ใช้เห็นหรือพรอมป์การเสร็จสิ้นแบบธรรมดา เมตาดาตาเหตุการณ์ภายในยังคงมีโครงสร้างใน OpenClaw เมื่อทำได้ และไม่ถือเป็นเนื้อหาแชตที่ผู้ใช้เขียน

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    เซสชัน ACP แบบครั้งเดียวที่ถูกสร้างโดยการรันของเอเจนต์อีกตัวเป็นลูก
    เบื้องหลัง คล้ายกับ sub-agent:

    - พาเรนต์ขอให้ทำงานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
    - ลูกทำงานในเซสชันฮาร์เนส ACP ของตนเอง
    - เทิร์นลูกทำงานบนเลนเบื้องหลังเดียวกับที่ใช้โดยการสร้าง sub-agent แบบเนทีฟ ดังนั้นฮาร์เนส ACP ที่ช้าจะไม่บล็อกงานเซสชันหลักที่ไม่เกี่ยวข้อง
    - รายงานการเสร็จสิ้นกลับผ่านเส้นทางประกาศ task-completion OpenClaw แปลงเมตาดาตาการเสร็จสิ้นภายในเป็นพรอมป์ ACP แบบธรรมดาก่อนส่งไปยังฮาร์เนสภายนอก ดังนั้นฮาร์เนสจะไม่เห็นเครื่องหมายบริบทรันไทม์ที่มีเฉพาะ OpenClaw
    - พาเรนต์เขียนผลลัพธ์ลูกใหม่ด้วยเสียงผู้ช่วยตามปกติเมื่อการตอบกลับที่ผู้ใช้เห็นมีประโยชน์

    **อย่า** ถือว่าเส้นทางนี้เป็นแชตแบบเพียร์ทูเพียร์ระหว่างพาเรนต์
    และลูก ลูกมีช่องทางการเสร็จสิ้นกลับไปยัง
    พาเรนต์อยู่แล้ว

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` สามารถกำหนดเป้าหมายไปยังเซสชันอื่นหลังจากสร้างแล้ว สำหรับเซสชัน
    เพียร์ปกติ OpenClaw ใช้เส้นทางติดตามผล agent-to-agent (A2A)
    หลังจากฉีดข้อความ:

    - รอการตอบกลับของเซสชันเป้าหมาย
    - อนุญาตให้ผู้ร้องขอและเป้าหมายแลกเปลี่ยนเทิร์นติดตามผลในจำนวนจำกัดได้ตามต้องการ
    - ขอให้เป้าหมายสร้างข้อความประกาศ
    - ส่งประกาศนั้นไปยังช่องทางหรือเธรดที่มองเห็นได้

    เส้นทาง A2A นั้นเป็น fallback สำหรับการส่งแบบเพียร์ที่ผู้ส่งต้องการ
    การติดตามผลที่มองเห็นได้ โดยยังคงเปิดใช้งานเมื่อเซสชันที่ไม่เกี่ยวข้อง
    สามารถเห็นและส่งข้อความหาเป้าหมาย ACP ได้ เช่น ภายใต้การตั้งค่า
    `tools.sessions.visibility` แบบกว้าง

    OpenClaw จะข้ามการติดตามผลแบบ A2A เฉพาะเมื่อผู้ร้องขอเป็น
    parent ของ ACP child แบบ one-shot ที่ parent ของตนเป็นเจ้าของ ในกรณีนั้น
    การเรียกใช้ A2A ทับบนการทำงานของ task ที่เสร็จแล้วอาจปลุก parent ด้วย
    ผลลัพธ์ของ child, ส่งต่อคำตอบของ parent กลับเข้าไปใน child, และ
    สร้างลูปสะท้อนกลับ parent/child ได้ ผลลัพธ์ `sessions_send` รายงาน
    `delivery.status="skipped"` สำหรับกรณี owned-child นั้น เพราะเส้นทาง
    completion รับผิดชอบผลลัพธ์อยู่แล้ว

  </Accordion>
  <Accordion title="ดำเนินเซสชันที่มีอยู่ต่อ">
    ใช้ `resumeSessionId` เพื่อดำเนิน ACP session ก่อนหน้าต่อแทนการ
    เริ่มใหม่ Agent จะเล่นประวัติการสนทนาของตนซ้ำผ่าน
    `session/load` จึงกลับมาทำงานพร้อมบริบทเต็มของสิ่งที่เกิดขึ้นก่อนหน้า

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    กรณีใช้งานทั่วไป:

    - ส่งต่อ Codex session จากแล็ปท็อปของคุณไปยังโทรศัพท์ของคุณ - บอก Agent ของคุณให้ทำต่อจากจุดที่คุณค้างไว้
    - ดำเนิน coding session ที่คุณเริ่มแบบโต้ตอบใน CLI ต่อ โดยตอนนี้ให้ทำแบบ headless ผ่าน Agent ของคุณ
    - ทำงานต่อจากจุดที่ถูกขัดจังหวะโดยการรีสตาร์ท Gateway หรือ idle timeout

    หมายเหตุ:

    - `resumeSessionId` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; sub-agent runtime เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `streamTo` ใช้ได้เฉพาะเมื่อ `runtime: "acp"`; sub-agent runtime เริ่มต้นจะละเว้นฟิลด์เฉพาะ ACP นี้
    - `resumeSessionId` เป็น host-local ACP/harness resume id ไม่ใช่คีย์ channel session ของ OpenClaw; OpenClaw ยังคงตรวจสอบนโยบาย ACP spawn และนโยบาย target agent ก่อน dispatch ขณะที่ ACP backend หรือ harness เป็นเจ้าของ authorization สำหรับการโหลด upstream id นั้น
    - `resumeSessionId` กู้คืนประวัติการสนทนา ACP upstream; `thread` และ `mode` ยังคงใช้กับ OpenClaw session ใหม่ที่คุณกำลังสร้างตามปกติ ดังนั้น `mode: "session"` ยังต้องใช้ `thread: true`
    - target agent ต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
    - หากไม่พบ session id การ spawn จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน - ไม่มี silent fallback ไปยัง session ใหม่

  </Accordion>
  <Accordion title="Smoke test หลัง deploy">
    หลัง deploy Gateway ให้รันการตรวจสอบ end-to-end แบบ live แทนการ
    เชื่อถือ unit tests:

    1. ตรวจสอบเวอร์ชัน Gateway ที่ deploy แล้วและ commit บน target host
    2. เปิด ACPX bridge session ชั่วคราวไปยัง Agent แบบ live
    3. ขอให้ Agent นั้นเรียก `sessions_spawn` ด้วย `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, และ task `Reply with exactly LIVE-ACP-SPAWN-OK`
    4. ตรวจสอบ `accepted=yes`, `childSessionKey` จริง, และไม่มี validator error
    5. ล้าง bridge session ชั่วคราว

    คง gate ไว้ที่ `mode: "run"` และข้าม `streamTo: "parent"` -
    `mode: "session"` ที่ผูกกับ thread และเส้นทาง stream-relay เป็น
    integration pass ที่ครบถ้วนกว่าอีกชุดหนึ่ง

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้กับ Sandbox

ACP sessions ปัจจุบันรันบน host runtime, **ไม่ใช่** ภายใน
OpenClaw sandbox

<Warning>
**ขอบเขตความปลอดภัย:**

- harness ภายนอกสามารถอ่าน/เขียนได้ตามสิทธิ์ CLI ของตนเองและ `cwd` ที่เลือก
- นโยบาย sandbox ของ OpenClaw **ไม่ได้** ครอบ ACP harness execution
- OpenClaw ยังคงบังคับใช้ ACP feature gates, allowed agents, session ownership, channel bindings, และนโยบายการส่งของ Gateway
- ใช้ `runtime: "subagent"` สำหรับงานแบบ OpenClaw-native ที่บังคับใช้ sandbox

</Warning>

ข้อจำกัดปัจจุบัน:

- หาก requester session ถูก sandbox, ACP spawns จะถูกบล็อกสำหรับทั้ง `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
- `sessions_spawn` ที่มี `runtime: "acp"` ไม่รองรับ `sandbox: "require"`

## การระบุเป้าหมาย Session

การกระทำ `/acp` ส่วนใหญ่รับ session target แบบไม่บังคับ (`session-key`,
`session-id`, หรือ `session-label`)

**ลำดับการระบุ:**

1. อาร์กิวเมนต์ target ที่ระบุชัดเจน (หรือ `--session` สำหรับ `/acp steer`)
   - ลอง key
   - จากนั้นลอง session id ที่มีรูปแบบ UUID
   - จากนั้นลอง label
2. current thread binding (หาก conversation/thread นี้ถูกผูกกับ ACP session)
3. current requester session fallback

current-conversation bindings และ thread bindings ต่างก็เข้าร่วมใน
ขั้นตอนที่ 2

หากระบุ target ไม่ได้ OpenClaw จะคืนข้อผิดพลาดที่ชัดเจน
(`Unable to resolve session target: ...`)

## ตัวควบคุม ACP

| คำสั่ง              | สิ่งที่ทำ                                              | ตัวอย่าง                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้าง ACP session; ผูกกับ current หรือ thread bind ได้ตามต้องการ | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิก turn ที่กำลังดำเนินอยู่สำหรับ target session                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่ง steer ไปยัง session ที่กำลังรัน                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิด session และยกเลิกการผูก thread targets                  | `/acp close`                                                  |
| `/acp status`        | แสดง backend, mode, state, runtime options, capabilities | `/acp status`                                                 |
| `/acp set-mode`      | ตั้ง runtime mode สำหรับ target session                      | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนตัวเลือก runtime config ทั่วไป                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่า override ของ runtime working directory                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้ง approval policy profile                              | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้ง runtime timeout (วินาที)                            | `/acp timeout 120`                                            |
| `/acp model`         | ตั้ง runtime model override                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบ session runtime option overrides                  | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการ ACP sessions ล่าสุดจาก store                      | `/acp sessions`                                               |
| `/acp doctor`        | สุขภาพ backend, capabilities, การแก้ไขที่ทำได้           | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอน install และ enable แบบ deterministic             | `/acp install`                                                |

`/acp status` แสดง runtime options ที่มีผล รวมถึงตัวระบุ session
ระดับ runtime และระดับ backend ข้อผิดพลาด unsupported-control จะแสดง
อย่างชัดเจนเมื่อ backend ไม่มี capability นั้น `/acp sessions` อ่าน
store สำหรับ session ที่ bound ปัจจุบันหรือ requester session; target tokens
(`session-key`, `session-id`, หรือ `session-label`) จะถูกระบุผ่าน
gateway session discovery รวมถึง custom per-agent `session.store`
roots

### การแมป Runtime options

`/acp` มีคำสั่งอำนวยความสะดวกและ setter ทั่วไป การดำเนินการที่เทียบเท่า:

| คำสั่ง                      | แมปไปยัง                              | หมายเหตุ                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtime config key `model`           | สำหรับ Codex ACP, OpenClaw normalize `openai/<model>` เป็น adapter model id และแมป slash reasoning suffixes เช่น `openai/gpt-5.4/high` เป็น `reasoning_effort`                                         |
| `/acp set thinking <level>`  | canonical option `thinking`          | OpenClaw ส่งค่าที่เทียบเท่าซึ่ง backend โฆษณาไว้เมื่อมี โดยเลือก `thinking` ก่อน จากนั้น `effort`, `reasoning_effort`, หรือ `thought_level` สำหรับ Codex ACP, adapter จะแมปค่าเป็น `reasoning_effort` |
| `/acp permissions <profile>` | canonical option `permissionProfile` | OpenClaw ส่งค่าที่เทียบเท่าซึ่ง backend โฆษณาไว้เมื่อมี เช่น `approval_policy`, `permission_profile`, `permissions`, หรือ `permission_mode`                                                       |
| `/acp timeout <seconds>`     | canonical option `timeoutSeconds`    | OpenClaw ส่งค่าที่เทียบเท่าซึ่ง backend โฆษณาไว้เมื่อมี เช่น `timeout` หรือ `timeout_seconds`                                                                                                     |
| `/acp cwd <path>`            | runtime cwd override                 | อัปเดตโดยตรง                                                                                                                                                                                             |
| `/acp set <key> <value>`     | generic                              | `key=cwd` ใช้เส้นทาง cwd override                                                                                                                                                                      |
| `/acp reset-options`         | ล้าง runtime overrides ทั้งหมด         | -                                                                                                                                                                                                          |

## acpx harness, การตั้งค่า Plugin, และสิทธิ์

สำหรับการกำหนดค่า acpx harness (Claude Code / Codex / Gemini CLI
aliases), MCP bridges ของ plugin-tools และ OpenClaw-tools, และ ACP
permission modes โปรดดู
[ACP agents - การตั้งค่า](/th/tools/acp-agents-setup)

## การแก้ไขปัญหา

| อาการ                                                                     | สาเหตุที่เป็นไปได้                                                                                                           | วิธีแก้ไข                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin แบ็กเอนด์ขาดหาย ถูกปิดใช้งาน หรือถูกบล็อกโดย `plugins.allow`                                                       | ติดตั้งและเปิดใช้งาน Plugin แบ็กเอนด์ ใส่ `acpx` ใน `plugins.allow` เมื่อมีการตั้งค่ารายการอนุญาตนั้น แล้วเรียกใช้ `/acp doctor`                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ถูกปิดใช้งานแบบรวมศูนย์                                                                                                 | ตั้งค่า `acp.enabled=true`                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | การส่งต่ออัตโนมัติจากข้อความเธรดปกติถูกปิดใช้งาน                                                               | ตั้งค่า `acp.dispatch.enabled=true` เพื่อกลับมาใช้การกำหนดเส้นทางเธรดอัตโนมัติ; การเรียก `sessions_spawn({ runtime: "acp" })` แบบชัดเจนยังคงทำงาน                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ไม่อยู่ในรายการอนุญาต                                                                                                | ใช้ `agentId` ที่อนุญาต หรืออัปเดต `acp.allowedAgents`                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Plugin แบ็กเอนด์ขาดหาย ถูกปิดใช้งาน ถูกบล็อกโดยนโยบายอนุญาต/ปฏิเสธ หรือไฟล์ปฏิบัติการที่กำหนดค่าไว้ไม่พร้อมใช้งาน        | ติดตั้ง/เปิดใช้งาน Plugin แบ็กเอนด์ เรียก `/acp doctor` อีกครั้ง และตรวจสอบข้อผิดพลาดการติดตั้งแบ็กเอนด์หรือนโยบายหากยังไม่สมบูรณ์                                           |
| Harness command not found                                                   | Adapter CLI ไม่ได้ติดตั้ง, Plugin ภายนอกขาดหาย หรือการดึง `npx` ครั้งแรกสำหรับ adapter ที่ไม่ใช่ Codex ล้มเหลว | เรียก `/acp doctor`, ติดตั้ง/อุ่น adapter ไว้ล่วงหน้าบนโฮสต์ Gateway หรือกำหนดค่าคำสั่ง agent ของ acpx อย่างชัดเจน                                                      |
| Model-not-found from the harness                                            | รหัสโมเดลใช้ได้กับผู้ให้บริการ/harness อื่น แต่ไม่ใช่เป้าหมาย ACP นี้                                                | ใช้โมเดลที่ harness นั้นแสดงไว้ กำหนดค่าโมเดลใน harness หรือไม่ใส่การ override                                                                            |
| Vendor auth error from the harness                                          | OpenClaw ปกติดี แต่ CLI/ผู้ให้บริการเป้าหมายยังไม่ได้เข้าสู่ระบบ                                                     | เข้าสู่ระบบหรือระบุคีย์ผู้ให้บริการที่จำเป็นในสภาพแวดล้อมของโฮสต์ Gateway                                                                                             |
| `Unable to resolve session target: ...`                                     | โทเค็น key/id/label ไม่ถูกต้อง                                                                                                | เรียก `/acp sessions`, คัดลอก key/label ที่ตรงกัน แล้วลองใหม่                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มีการสนทนาที่ผูกได้ซึ่งกำลังทำงานอยู่                                                            | ย้ายไปยังแชต/ช่องเป้าหมายแล้วลองใหม่ หรือใช้การ spawn แบบไม่ผูก                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter ไม่มีความสามารถ ACP binding สำหรับการสนทนาปัจจุบัน                                                             | ใช้ `/acp spawn ... --thread ...` ในที่ที่รองรับ กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปยังช่องที่รองรับ                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | ใช้ `--thread here` นอกบริบทเธรด                                                                         | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off`                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | ผู้ใช้อื่นเป็นเจ้าของเป้าหมาย binding ที่ใช้งานอยู่                                                                           | ผูกใหม่ในฐานะเจ้าของ หรือใช้การสนทนาหรือเธรดอื่น                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adapter ไม่มีความสามารถ thread binding                                                                               | ใช้ `--thread off` หรือย้ายไปยัง adapter/ช่องที่รองรับ                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ของ ACP อยู่ฝั่งโฮสต์; เซสชันผู้ร้องขออยู่ใน sandbox                                                              | ใช้ `runtime="subagent"` จากเซสชันที่อยู่ใน sandbox หรือเรียก ACP spawn จากเซสชันที่ไม่อยู่ใน sandbox                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | มีการร้องขอ `sandbox="require"` สำหรับ Runtime ของ ACP                                                                         | ใช้ `runtime="subagent"` เมื่อต้องการ sandboxing หรือใช้ ACP กับ `sandbox="inherit"` จากเซสชันที่ไม่อยู่ใน sandbox                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Harness เป้าหมายไม่ได้เปิดเผยการสลับโมเดล ACP แบบทั่วไป                                                        | ใช้ harness ที่ประกาศ ACP `models`/`session/set_model`, ใช้ model refs ของ Codex ACP หรือกำหนดค่าโมเดลโดยตรงใน harness หากมี flag เริ่มต้นของตัวเอง |
| Missing ACP metadata for bound session                                      | Metadata เซสชัน ACP ค้าง/ถูกลบ                                                                                    | สร้างใหม่ด้วย `/acp spawn` แล้ว rebind/focus เธรด                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` บล็อกการเขียน/exec ในเซสชัน ACP แบบไม่โต้ตอบ                                                    | ตั้งค่า `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ต gateway ดู [การกำหนดค่าสิทธิ์](/th/tools/acp-agents-setup#permission-configuration) |
| ACP session fails early with little output                                  | Permission prompts ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions`                                        | ตรวจสอบ log ของ gateway สำหรับ `AcpRuntimeError` สำหรับสิทธิ์เต็ม ให้ตั้งค่า `permissionMode=approve-all`; สำหรับการลดระดับอย่างนุ่มนวล ให้ตั้งค่า `nonInteractivePermissions=deny`        |
| ACP session stalls indefinitely after completing work                       | กระบวนการ harness เสร็จแล้ว แต่เซสชัน ACP ไม่ได้รายงานว่าเสร็จสมบูรณ์                                                    | อัปเดต OpenClaw; cleanup ของ acpx ปัจจุบันจะเก็บกวาด wrapper ที่ OpenClaw เป็นเจ้าของและกระบวนการ adapter ที่ค้างเมื่อปิดและเมื่อ Gateway เริ่มทำงาน                                             |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | ซองเหตุการณ์ภายในรั่วข้ามขอบเขต ACP                                                                | อัปเดต OpenClaw แล้วเรียก flow การเสร็จสมบูรณ์อีกครั้ง; harness ภายนอกควรได้รับเฉพาะพรอมป์การเสร็จสมบูรณ์แบบ plain                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` เป็นของ
relay ของ native Codex hook ไม่ใช่ ACP/acpx ในแชต Codex ที่ผูกไว้ ให้เริ่ม
เซสชันใหม่ด้วย `/new` หรือ `/reset`; หากใช้งานได้ครั้งหนึ่งแล้วกลับมาเกิดอีกในการเรียก
native tool ครั้งถัดไป ให้รีสตาร์ต Codex app-server หรือ OpenClaw Gateway แทนการ
เรียก `/new` ซ้ำ ดู [การแก้ไขปัญหา Codex harness](/th/plugins/codex-harness#troubleshooting)
</Note>

## ที่เกี่ยวข้อง

- [การตั้งค่า agent ACP](/th/tools/acp-agents-setup)
- [ส่ง Agent](/th/tools/agent-send)
- [แบ็กเอนด์ CLI](/th/gateway/cli-backends)
- [Codex harness](/th/plugins/codex-harness)
- [Runtime ของ Codex harness](/th/plugins/codex-harness-runtime)
- [เครื่องมือ sandbox หลาย agent](/th/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (โหมด bridge)](/th/cli/acp)
- [Sub-agents](/th/tools/subagents)
