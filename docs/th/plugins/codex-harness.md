---
read_when:
    - คุณต้องการใช้ชุดทดสอบ app-server ของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่าฮาร์เนสของ Codex
    - คุณต้องการให้การปรับใช้เฉพาะ Codex ล้มเหลวแทนที่จะถอยกลับไปใช้ PI
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่บันเดิลมา
title: ฮาร์เนส Codex
x-i18n:
    generated_at: "2026-05-05T01:49:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่มาพร้อมชุดช่วยให้ OpenClaw รันเทิร์นของ agent แบบฝังตัวผ่าน
app-server ของ Codex แทน harness PI ในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชัน agent ระดับล่าง ได้แก่
การค้นหาโมเดล การ resume thread แบบ native, compaction แบบ native และการดำเนินการผ่าน app-server
OpenClaw ยังคงเป็นเจ้าของช่องทางแชต ไฟล์เซสชัน การเลือกโมเดล เครื่องมือ
การอนุมัติ การส่งสื่อ และมิเรอร์ transcript ที่มองเห็นได้

เมื่อเทิร์นแชตต้นทางรันผ่าน harness ของ Codex การตอบกลับที่มองเห็นได้จะใช้ค่าเริ่มต้น
เป็นเครื่องมือ `message` ของ OpenClaw หาก deployment ยังไม่ได้กำหนดค่า
`messages.visibleReplies` ไว้อย่างชัดเจน agent ยังสามารถจบเทิร์น Codex ของตัวเองแบบส่วนตัวได้
มันจะโพสต์ไปยังช่องทางก็ต่อเมื่อเรียก `message(action="send")` เท่านั้น ตั้งค่า
`messages.visibleReplies: "automatic"` เพื่อให้การตอบกลับสุดท้ายของ direct-chat อยู่บน
เส้นทางการส่งอัตโนมัติแบบเดิม

เทิร์น Heartbeat ของ Codex ยังได้รับเครื่องมือ `heartbeat_respond` ตามค่าเริ่มต้นด้วย เพื่อให้
agent สามารถบันทึกได้ว่าการปลุกควรเงียบต่อไปหรือแจ้งเตือน โดยไม่ต้องเข้ารหัส
โฟลว์ควบคุมนั้นไว้ในข้อความสุดท้าย

คำแนะนำ initiative เฉพาะ Heartbeat จะถูกส่งเป็นคำสั่ง developer แบบโหมดการทำงานร่วมกันของ Codex
บนเทิร์น Heartbeat นั้นเอง เทิร์นแชตปกติจะคืนค่า
โหมด Codex Default แทนการพกแนวคิดของ Heartbeat ไว้ใน
runtime prompt ปกติ

หากคุณกำลังพยายามทำความเข้าใจภาพรวม ให้เริ่มจาก
[Agent runtimes](/th/concepts/agent-runtimes) สรุปสั้น ๆ คือ:
`openai/gpt-5.5` คือ model ref, `codex` คือ runtime และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## การกำหนดค่าแบบรวดเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ "Codex ใน OpenClaw" ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
การสมัครสมาชิก ChatGPT/Codex จากนั้นรันเทิร์น agent แบบฝังตัวผ่าน runtime
app-server แบบ native ของ Codex ค่า model ref ยังคงเป็น canonical เป็น
`openai/gpt-*`; การยืนยันตัวตนของ subscription มาจากบัญชี/โปรไฟล์ Codex ไม่ใช่
จาก prefix โมเดล `openai-codex/*`

ก่อนอื่นลงชื่อเข้าใช้ด้วย Codex OAuth หากยังไม่ได้ทำ:

```bash
openclaw models auth login --provider openai-codex
```

จากนั้นเปิดใช้ Plugin `codex` ที่มาพร้อมชุดและบังคับใช้ runtime ของ Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

หาก config ของคุณใช้ `plugins.allow` ให้ใส่ `codex` ไว้ที่นั่นด้วย:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

อย่าใช้ `openai-codex/gpt-*` เมื่อคุณหมายถึง runtime Codex แบบ native prefix นั้น
คือเส้นทาง "Codex OAuth ผ่าน PI" แบบชัดเจน การเปลี่ยนแปลง config มีผลกับเซสชันใหม่หรือ
เซสชันที่ reset แล้ว; เซสชันที่มีอยู่จะเก็บ runtime ที่บันทึกไว้ของตัวเอง

## Plugin นี้เปลี่ยนอะไร

Plugin `codex` ที่มาพร้อมชุดเพิ่มความสามารถหลายอย่างที่แยกจากกัน:

| ความสามารถ                        | วิธีใช้งานของคุณ                                      | สิ่งที่ทำ                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime แบบฝังตัว native           | `agentRuntime.id: "codex"`                          | รันเทิร์น agent แบบฝังตัวของ OpenClaw ผ่าน app-server ของ Codex                  |
| คำสั่งควบคุมแชต native      | `/codex bind`, `/codex resume`, `/codex steer`, ... | ผูกและควบคุม thread app-server ของ Codex จากบทสนทนาในระบบส่งข้อความ    |
| Provider/catalog ของ app-server Codex | ภายใน `codex` ซึ่งแสดงผ่าน harness     | ให้ runtime ค้นหาและตรวจสอบโมเดล app-server ได้                     |
| เส้นทางการเข้าใจสื่อของ Codex    | เส้นทางความเข้ากันได้ของโมเดลรูปภาพ `codex/*`           | รันเทิร์น app-server ของ Codex แบบจำกัดขอบเขตสำหรับโมเดลเข้าใจรูปภาพที่รองรับ |
| การ relay hook แบบ native                 | Hook ของ Plugin รอบเหตุการณ์ native ของ Codex             | ให้ OpenClaw สังเกต/บล็อกเหตุการณ์เครื่องมือ/การ finalize แบบ native ของ Codex ที่รองรับได้  |

การเปิดใช้ Plugin ทำให้ความสามารถเหล่านั้นพร้อมใช้งาน แต่ **ไม่ได้**:

- เริ่มใช้ Codex กับโมเดล OpenAI ทุกตัว
- แปลง model ref `openai-codex/*` เป็น runtime แบบ native
- ทำให้ ACP/acpx เป็นเส้นทาง Codex เริ่มต้น
- hot-switch เซสชันที่มีอยู่ซึ่งบันทึก runtime PI ไว้แล้ว
- แทนที่การส่งผ่านช่องทางของ OpenClaw, ไฟล์เซสชัน, พื้นที่เก็บ auth-profile หรือ
  การ route ข้อความ

Plugin เดียวกันยังเป็นเจ้าของพื้นผิวคำสั่งควบคุมแชต `/codex` แบบ native ด้วย หาก
Plugin เปิดใช้อยู่และผู้ใช้ขอ bind, resume, steer, stop หรือตรวจสอบ
thread ของ Codex จากแชต agent ควรเลือกใช้ `/codex ...` แทน ACP ACP ยังคง
เป็น fallback แบบชัดเจนเมื่อผู้ใช้ขอ ACP/acpx หรือกำลังทดสอบ adapter ACP
ของ Codex

เทิร์น Codex แบบ native ยังคง hook ของ Plugin OpenClaw เป็นเลเยอร์ความเข้ากันได้สาธารณะ
สิ่งเหล่านี้คือ hook ของ OpenClaw ในกระบวนการ ไม่ใช่ hook คำสั่ง `hooks.json` ของ Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` สำหรับระเบียน transcript ที่มิเรอร์
- `before_agent_finalize` ผ่าน relay `Stop` ของ Codex
- `agent_end`

Plugin ยังสามารถลงทะเบียน middleware ผลลัพธ์เครื่องมือแบบ runtime-neutral เพื่อเขียนใหม่
ผลลัพธ์เครื่องมือแบบไดนามิกของ OpenClaw หลังจาก OpenClaw ดำเนินการเครื่องมือและก่อนที่
ผลลัพธ์จะถูกส่งคืนให้ Codex สิ่งนี้แยกจาก hook Plugin สาธารณะ
`tool_result_persist` ซึ่งแปลงการเขียนผลลัพธ์เครื่องมือของ transcript
ที่ OpenClaw เป็นเจ้าของ

สำหรับ semantics ของ hook Plugin เอง โปรดดู [Plugin hooks](/th/plugins/hooks)
และ [Plugin guard behavior](/th/tools/plugin)

Harness ปิดอยู่ตามค่าเริ่มต้น Config ใหม่ควรเก็บ model ref ของ OpenAI ให้เป็น
canonical เป็น `openai/gpt-*` และบังคับใช้
`agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` อย่างชัดเจนเมื่อ
ต้องการการดำเนินการผ่าน app-server แบบ native model ref `codex/*` แบบ legacy ยังคง auto-select
harness เพื่อความเข้ากันได้ แต่ prefix provider แบบ legacy ที่มี runtime รองรับจะ
ไม่แสดงเป็นตัวเลือกโมเดล/provider ปกติ

หากเปิดใช้ Plugin `codex` แต่โมเดลหลักยังเป็น
`openai-codex/*`, `openclaw doctor` จะเตือนแทนการเปลี่ยนเส้นทาง นั่นเป็น
ความตั้งใจ: `openai-codex/*` ยังคงเป็นเส้นทาง PI Codex OAuth/subscription และ
การดำเนินการผ่าน app-server แบบ native ยังคงเป็นตัวเลือก runtime ที่ชัดเจน

## แผนที่เส้นทาง

ใช้ตารางนี้ก่อนเปลี่ยน config:

| พฤติกรรมที่ต้องการ                                     | Model ref                  | Config runtime                         | เส้นทาง auth/profile           | ป้ายสถานะที่คาดหวัง          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| การสมัครสมาชิก ChatGPT/Codex พร้อม runtime Codex แบบ native | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth หรือบัญชี Codex | `Runtime: OpenAI Codex`        |
| OpenAI API ผ่าน runner ปกติของ OpenClaw            | `openai/gpt-*`             | ไม่ระบุ หรือ `runtime: "pi"`             | คีย์ OpenAI API               | `Runtime: OpenClaw Pi Default` |
| การสมัครสมาชิก ChatGPT/Codex ผ่าน PI                | `openai-codex/gpt-*`       | ไม่ระบุ หรือ `runtime: "pi"`             | OpenAI Codex OAuth provider  | `Runtime: OpenClaw Pi Default` |
| Provider แบบผสมพร้อมโหมด auto ที่ระมัดระวัง          | ref เฉพาะ provider     | `agentRuntime.id: "auto"`              | ตาม provider ที่เลือก        | ขึ้นอยู่กับ runtime ที่เลือก    |
| เซสชัน adapter Codex ACP แบบชัดเจน                   | ขึ้นอยู่กับ prompt/model ของ ACP | `sessions_spawn` พร้อม `runtime: "acp"` | การยืนยันตัวตน backend ACP             | สถานะ task/session ของ ACP        |

จุดแบ่งสำคัญคือ provider เทียบกับ runtime:

- `openai-codex/*` ตอบคำถามว่า "PI ควรใช้เส้นทาง provider/auth ใด?"
- `agentRuntime.id: "codex"` ตอบคำถามว่า "loop ใดควรดำเนินการ
  เทิร์นแบบฝังตัวนี้?"
- `/codex ...` ตอบคำถามว่า "บทสนทนา Codex แบบ native ใดที่แชตนี้ควร bind
  หรือควบคุม?"
- ACP ตอบคำถามว่า "กระบวนการ harness ภายนอกใดที่ acpx ควร launch?"

## เลือก prefix โมเดลที่ถูกต้อง

เส้นทางตระกูล OpenAI ขึ้นกับ prefix สำหรับการตั้งค่าทั่วไปแบบ subscription ร่วมกับ
runtime Codex แบบ native ให้ใช้ `openai/*` พร้อม `agentRuntime.id: "codex"`
ใช้ `openai-codex/*` เฉพาะเมื่อคุณตั้งใจต้องการ Codex OAuth ผ่าน PI:

| Model ref                                     | เส้นทาง runtime                                 | ใช้เมื่อ                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI provider ผ่าน plumbing ของ OpenClaw/PI | คุณต้องการการเข้าถึง OpenAI Platform API โดยตรงในปัจจุบันด้วย `OPENAI_API_KEY` |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth ผ่าน OpenClaw/PI       | คุณต้องการการยืนยันตัวตนด้วย subscription ChatGPT/Codex กับ runner PI เริ่มต้น      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server ของ Codex                     | คุณต้องการการยืนยันตัวตนด้วย subscription ChatGPT/Codex พร้อมการดำเนินการ Codex แบบ native     |

GPT-5.5 สามารถปรากฏได้ทั้งบนเส้นทางคีย์ API ของ OpenAI โดยตรงและเส้นทาง subscription ของ Codex
เมื่อบัญชีของคุณเปิดให้ใช้ ใช้ `openai/gpt-5.5` พร้อม harness app-server ของ Codex
สำหรับ runtime Codex แบบ native, `openai-codex/gpt-5.5` สำหรับ PI OAuth หรือ
`openai/gpt-5.5` โดยไม่มีการ override runtime Codex สำหรับทราฟฟิกคีย์ API โดยตรง

Ref `codex/gpt-*` แบบ legacy ยังคงรับเป็น alias เพื่อความเข้ากันได้ การ migration
ความเข้ากันได้ของ doctor จะเขียน ref runtime หลักแบบ legacy เป็น model
ref แบบ canonical และบันทึกนโยบาย runtime แยกไว้ต่างหาก ส่วน ref legacy ที่เป็น fallback-only
จะถูกปล่อยไว้ไม่เปลี่ยนแปลง เพราะ runtime ถูกกำหนดค่าสำหรับ container agent ทั้งหมด
Config PI Codex OAuth ใหม่ควรใช้ `openai-codex/gpt-*`; config harness
app-server แบบ native ใหม่ควรใช้ `openai/gpt-*` ร่วมกับ
`agentRuntime.id: "codex"`

`agents.defaults.imageModel` ทำตามการแบ่ง prefix เดียวกัน ใช้
`openai-codex/gpt-*` เมื่อการเข้าใจรูปภาพควรรันผ่านเส้นทาง provider OpenAI
Codex OAuth ใช้ `codex/gpt-*` เมื่อการเข้าใจรูปภาพควรรัน
ผ่านเทิร์น app-server ของ Codex แบบจำกัดขอบเขต โมเดล app-server ของ Codex ต้อง
ประกาศการรองรับ input รูปภาพ; โมเดล Codex แบบ text-only จะล้มเหลวก่อนที่เทิร์นสื่อ
จะเริ่ม

ใช้ `/status` เพื่อยืนยัน harness ที่มีผลสำหรับเซสชันปัจจุบัน หากการเลือก
ดูน่าประหลาดใจ ให้เปิดใช้ debug logging สำหรับ subsystem `agents/harness`
และตรวจดูระเบียน structured `agent harness selected` ของ Gateway ซึ่ง
มี id ของ harness ที่เลือก เหตุผลการเลือก นโยบาย runtime/fallback และ,
ในโหมด `auto`, ผลการรองรับของ candidate Plugin แต่ละตัว

### คำเตือน doctor หมายถึงอะไร

`openclaw doctor` เตือนเมื่อทุกข้อต่อไปนี้เป็นจริง:

- Plugin `codex` ที่มาพร้อมชุดเปิดใช้หรืออนุญาตอยู่
- โมเดลหลักของ agent เป็น `openai-codex/*`
- runtime ที่มีผลของ agent นั้นไม่ใช่ `codex`

คำเตือนนั้นมีอยู่เพราะผู้ใช้มักคาดว่า "เปิดใช้ Plugin Codex" จะหมายถึง
"runtime app-server ของ Codex แบบ native" OpenClaw ไม่ได้อนุมานเช่นนั้น คำเตือน
หมายถึง:

- **ไม่จำเป็นต้องเปลี่ยนแปลง** หากคุณตั้งใจใช้ ChatGPT/Codex OAuth ผ่าน PI
- เปลี่ยนโมเดลเป็น `openai/<model>` และตั้งค่า
  `agentRuntime.id: "codex"` หากคุณตั้งใจใช้การดำเนินการผ่าน app-server
  แบบ native
- เซสชันที่มีอยู่ยังต้องใช้ `/new` หรือ `/reset` หลังเปลี่ยน runtime
  เพราะ pin runtime ของเซสชันเป็นแบบ sticky

การเลือก harness ไม่ใช่การควบคุมเซสชันแบบ live เมื่อเทิร์นแบบฝังตัวรัน
OpenClaw จะบันทึก id ของ harness ที่เลือกไว้บนเซสชันนั้น และใช้ต่อไปสำหรับ
เทิร์นภายหลังใน id เซสชันเดียวกัน เปลี่ยน config `agentRuntime` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อคุณต้องการให้เซสชันในอนาคตใช้ harness อื่น;
ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับบทสนทนาที่มีอยู่
ระหว่าง PI และ Codex วิธีนี้หลีกเลี่ยงการ replay transcript เดียวผ่าน
ระบบเซสชัน native สองระบบที่ไม่เข้ากัน

เซสชันเดิมที่สร้างก่อนมีการ pin harness จะถือว่าถูก pin กับ PI เมื่อมี
ประวัติ transcript แล้ว ใช้ `/new` หรือ `/reset` เพื่อเลือกให้บทสนทนานั้นใช้
Codex หลังจากเปลี่ยน config

`/status` แสดง model runtime ที่มีผลอยู่ harness PI ค่าเริ่มต้นจะแสดงเป็น
`Runtime: OpenClaw Pi Default` และ harness app-server ของ Codex จะแสดงเป็น
`Runtime: OpenAI Codex`

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` ซึ่งรวมมาให้พร้อมใช้งาน
- Codex app-server `0.125.0` หรือใหม่กว่า โดยค่าเริ่มต้น Plugin ที่รวมมาให้จะจัดการ
  binary ของ Codex app-server ที่เข้ากันได้ ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH`
  จะไม่กระทบการเริ่มต้น harness ตามปกติ
- มี auth ของ Codex ให้กับโปรเซส app-server หรือให้กับสะพาน auth ของ Codex ใน
  OpenClaw การเริ่ม app-server แบบ local จะใช้ Codex home ที่ OpenClaw จัดการให้สำหรับแต่ละ
  agent และใช้ `HOME` ของ child ที่แยกไว้ ดังนั้นโดยค่าเริ่มต้นจะไม่อ่านบัญชี
  `~/.codex`, Skills, Plugin, config, สถานะ thread หรือ
  `$HOME/.agents/skills` แบบเนทีฟส่วนตัวของคุณ

Plugin จะบล็อก handshake ของ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน ซึ่งช่วยให้
OpenClaw อยู่บนพื้นผิว protocol ที่ผ่านการทดสอบแล้ว

สำหรับการทดสอบ smoke แบบ live และ Docker โดยปกติ auth จะมาจากบัญชี Codex CLI
หรือโปรไฟล์ auth `openai-codex` ของ OpenClaw การเริ่ม stdio app-server แบบ local
ยังสามารถ fallback ไปใช้ `CODEX_API_KEY` / `OPENAI_API_KEY` ได้เมื่อไม่มีบัญชีอยู่

## ไฟล์ bootstrap ของ workspace

Codex จัดการ `AGENTS.md` เองผ่านการค้นพบ project-doc แบบเนทีฟ OpenClaw
จะไม่เขียนไฟล์ project-doc ของ Codex แบบสังเคราะห์ หรือพึ่งพาชื่อไฟล์ fallback
ของ Codex สำหรับไฟล์ persona เพราะ fallback ของ Codex จะใช้เฉพาะเมื่อไม่มี
`AGENTS.md`

เพื่อให้ workspace ของ OpenClaw มีความสอดคล้องกัน harness ของ Codex จะ resolve
ไฟล์ bootstrap อื่นๆ (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` และ `MEMORY.md` เมื่อมีอยู่) แล้วส่งต่อผ่านคำสั่ง config ของ Codex
บน `thread/start` และ `thread/resume` วิธีนี้ทำให้ context persona/profile ของ workspace
เช่น `SOUL.md` ยังคงมองเห็นได้โดยไม่ต้องทำซ้ำ `AGENTS.md`

## เพิ่ม Codex ควบคู่กับโมเดลอื่น

อย่าตั้ง `agentRuntime.id: "codex"` แบบ global หาก agent เดียวกันควรสลับได้อย่างอิสระ
ระหว่าง Codex กับโมเดล provider ที่ไม่ใช่ Codex runtime ที่ถูกบังคับจะมีผลกับทุก
turn ที่ฝังอยู่สำหรับ agent หรือเซสชันนั้น หากคุณเลือกโมเดล Anthropic ขณะที่
runtime นั้นถูกบังคับ OpenClaw จะยังคงลองใช้ harness ของ Codex และ fail closed
แทนที่จะ route turn นั้นผ่าน PI แบบเงียบๆ

ให้ใช้รูปแบบใดรูปแบบหนึ่งเหล่านี้แทน:

- วาง Codex ไว้บน agent เฉพาะด้วย `agentRuntime.id: "codex"`
- ให้ agent ค่าเริ่มต้นอยู่บน `agentRuntime.id: "auto"` และใช้ PI fallback สำหรับการใช้งาน
  provider ผสมตามปกติ
- ใช้ ref แบบเดิม `codex/*` เพื่อความเข้ากันได้เท่านั้น config ใหม่ควรใช้
  `openai/*` พร้อมนโยบาย runtime ของ Codex ที่ระบุชัดเจน

ตัวอย่างนี้ทำให้ agent ค่าเริ่มต้นใช้การเลือกอัตโนมัติตามปกติ และเพิ่ม agent
Codex แยกต่างหาก:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

ด้วยรูปแบบนี้:

- agent `main` ค่าเริ่มต้นใช้ path ของ provider ตามปกติและ PI compatibility fallback
- agent `codex` ใช้ harness ของ Codex app-server
- หาก Codex หายไปหรือไม่รองรับสำหรับ agent `codex` turn จะล้มเหลว
  แทนที่จะใช้ PI แบบเงียบๆ

## การ route คำสั่งของ agent

Agent ควร route คำขอของผู้ใช้ตามเจตนา ไม่ใช่ตามคำว่า "Codex" เพียงอย่างเดียว:

| ผู้ใช้ขอให้...                                         | Agent ควรใช้...                                  |
| ------------------------------------------------------ | ------------------------------------------------ |
| "ผูกแชตนี้กับ Codex"                                  | `/codex bind`                                    |
| "Resume thread Codex `<id>` ที่นี่"                   | `/codex resume <id>`                             |
| "แสดง thread ของ Codex"                               | `/codex threads`                                 |
| "ยื่นรายงาน support สำหรับการรัน Codex ที่ผิดพลาด"    | `/diagnostics [note]`                            |
| "ส่ง feedback ของ Codex เฉพาะ thread ที่แนบมานี้"     | `/codex diagnostics [note]`                      |
| "ใช้ subscription ChatGPT/Codex ของฉันกับ runtime Codex" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "ใช้ subscription ChatGPT/Codex ของฉันผ่าน PI"        | `openai-codex/*` model refs                      |
| "รัน Codex ผ่าน ACP/acpx"                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "เริ่ม Claude Code/Gemini/OpenCode/Cursor ใน thread"  | ACP/acpx, ไม่ใช่ `/codex` และไม่ใช่ sub-agent แบบเนทีฟ |

OpenClaw จะโฆษณาคำแนะนำการ spawn ของ ACP ให้ agent เฉพาะเมื่อ ACP เปิดใช้งานอยู่,
dispatch ได้ และมี runtime backend ที่โหลดแล้วรองรับอยู่ หาก ACP ไม่พร้อมใช้งาน
system prompt และ Skills ของ Plugin ไม่ควรสอน agent เกี่ยวกับการ route ของ ACP

## การ deploy แบบ Codex เท่านั้น

บังคับใช้ harness ของ Codex เมื่อคุณต้องพิสูจน์ว่า agent turn ที่ฝังอยู่ทุก turn
ใช้ Codex runtime ของ Plugin ที่ระบุชัดเจนจะ fail closed และจะไม่ถูก retry ผ่าน PI
แบบเงียบๆ:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

การ override ด้วย environment:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Plugin Codex ถูกปิดใช้งาน,
app-server เก่าเกินไป หรือ app-server ไม่สามารถเริ่มได้

## Codex ต่อ agent

คุณสามารถทำให้ agent หนึ่งเป็น Codex-only ในขณะที่ agent ค่าเริ่มต้นยังคงใช้
auto-selection ตามปกติ:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

ใช้คำสั่งเซสชันตามปกติเพื่อสลับ agent และโมเดล `/new` สร้างเซสชัน OpenClaw ใหม่
และ harness ของ Codex จะสร้างหรือ resume thread app-server sidecar ของตัวเองตามจำเป็น
`/reset` ล้างการผูกเซสชัน OpenClaw สำหรับ thread นั้น และให้ turn ถัดไป resolve
harness จาก config ปัจจุบันอีกครั้ง

## การค้นพบโมเดล

โดยค่าเริ่มต้น Plugin Codex จะถาม app-server เพื่อดูโมเดลที่พร้อมใช้งาน หาก
การค้นพบล้มเหลวหรือหมดเวลา จะใช้ catalog fallback ที่รวมมาให้สำหรับ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

คุณสามารถปรับการค้นพบได้ภายใต้ `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

ปิดการค้นพบเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการ probe Codex และยึดตาม
catalog fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## การเชื่อมต่อ app-server และนโยบาย

โดยค่าเริ่มต้น Plugin จะเริ่ม binary Codex ที่ OpenClaw จัดการไว้ในเครื่องด้วย:

```bash
codex app-server --listen stdio://
```

binary ที่จัดการไว้จะถูกส่งมาพร้อม package Plugin `codex` วิธีนี้ทำให้เวอร์ชัน
app-server ผูกกับ Plugin ที่รวมมาให้ แทนที่จะขึ้นกับ Codex CLI แยกต่างหากใดๆ
ที่บังเอิญติดตั้งอยู่ในเครื่อง ตั้งค่า `appServer.command` เฉพาะเมื่อคุณตั้งใจ
จะรัน executable อื่น

โดยค่าเริ่มต้น OpenClaw จะเริ่มเซสชัน harness Codex แบบ local ในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือ posture ของ operator ในเครื่องที่เชื่อถือได้
ซึ่งใช้สำหรับ Heartbeat อัตโนมัติ: Codex สามารถใช้ shell และเครื่องมือ network
ได้โดยไม่หยุดรอ prompt อนุมัติแบบเนทีฟที่ไม่มีใครอยู่ตอบ

หากต้องการเลือกใช้ approval ที่ Codex guardian review ให้ตั้ง `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

โหมด Guardian ใช้ path approval แบบ auto-review เนทีฟของ Codex เมื่อ Codex ขอออกจาก
sandbox, เขียนนอก workspace หรือเพิ่ม permission เช่นการเข้าถึง network Codex จะ route
คำขออนุมัตินั้นไปยัง reviewer แบบเนทีฟแทน prompt มนุษย์ reviewer จะใช้ risk framework
ของ Codex และอนุมัติหรือปฏิเสธคำขอนั้นโดยเฉพาะ ใช้ Guardian เมื่อคุณต้องการ guardrail
มากกว่าโหมด YOLO แต่ยังต้องการให้ agent ที่ไม่มีคนเฝ้าทำงานต่อไปได้

preset `guardian` ขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"`
field นโยบายรายตัวยังคง override `mode` ได้ ดังนั้นการ deploy ขั้นสูงสามารถผสม
preset กับตัวเลือกที่ระบุชัดเจนได้ ค่า reviewer เดิม `guardian_subagent` ยังคงยอมรับ
เป็น alias เพื่อความเข้ากันได้ แต่ config ใหม่ควรใช้ `auto_review`

สำหรับ app-server ที่รันอยู่แล้ว ให้ใช้ transport แบบ WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

โดยค่าเริ่มต้น การเริ่ม stdio app-server จะสืบทอด environment ของโปรเซส OpenClaw
แต่ OpenClaw เป็นเจ้าของสะพานบัญชี Codex app-server และตั้งทั้ง
`CODEX_HOME` และ `HOME` เป็นไดเรกทอรีต่อ agent ภายใต้ state ของ OpenClaw agent นั้น
ตัวโหลด skill ของ Codex เองอ่าน `$CODEX_HOME/skills` และ
`$HOME/.agents/skills` ดังนั้นค่าทั้งสองจึงถูกแยกไว้สำหรับการเริ่ม app-server
แบบ local วิธีนี้ทำให้ Skills, Plugin, config, บัญชี และสถานะ thread แบบ Codex-native
อยู่ในขอบเขตของ OpenClaw agent แทนที่จะรั่วไหลมาจาก Codex CLI home ส่วนตัวของ operator

Plugin ของ OpenClaw และ snapshot ของ Skills ของ OpenClaw ยังคงไหลผ่าน registry
Plugin และตัวโหลด skill ของ OpenClaw เอง asset ส่วนตัวของ Codex CLI จะไม่ไหลผ่าน
หากคุณมี Skills หรือ Plugin ของ Codex CLI ที่มีประโยชน์และควรกลายเป็นส่วนหนึ่งของ
OpenClaw agent ให้ทำ inventory อย่างชัดเจน:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

provider migration ของ Codex จะคัดลอก Skills เข้าไปใน workspace ของ OpenClaw agent
ปัจจุบัน ส่วน Plugin, hook และไฟล์ config แบบเนทีฟของ Codex จะถูกรายงานหรือ archive
ไว้สำหรับการตรวจสอบด้วยตนเอง แทนที่จะถูกเปิดใช้งานโดยอัตโนมัติ เพราะสิ่งเหล่านี้
สามารถ execute คำสั่ง, expose MCP server หรือมี credential ติดมาด้วย

Auth จะถูกเลือกตามลำดับนี้:

1. โปรไฟล์ auth Codex ของ OpenClaw ที่ระบุชัดเจนสำหรับ agent
2. บัญชีที่มีอยู่ของ app-server ใน Codex home ของ agent นั้น
3. สำหรับการเริ่ม stdio app-server แบบ local เท่านั้น ใช้ `CODEX_API_KEY` แล้วตามด้วย
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server และยังต้องใช้ auth ของ OpenAI

เมื่อ OpenClaw เห็นโปรไฟล์ auth ของ Codex แบบ ChatGPT subscription จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากโปรเซส child ของ Codex ที่ spawn ขึ้นมา
วิธีนี้ทำให้ API key ระดับ Gateway ยังพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI
โดยตรง โดยไม่ทำให้ turn ของ Codex app-server แบบเนทีฟถูกคิดเงินผ่าน API โดยไม่ตั้งใจ
โปรไฟล์ Codex API-key ที่ระบุชัดเจนและ fallback env-key ของ stdio แบบ local ใช้การ login
ของ app-server แทน env ของ child-process ที่สืบทอดมา การเชื่อมต่อ WebSocket app-server
จะไม่ได้รับ fallback API-key env ของ Gateway ให้ใช้โปรไฟล์ auth ที่ระบุชัดเจน
หรือบัญชีของ remote app-server เอง

หากการ deploy ต้องการการแยก environment เพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นลงใน
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` มีผลเฉพาะกับโปรเซสลูกของเซิร์ฟเวอร์แอป Codex ที่ถูกสร้างขึ้นเท่านั้น

เครื่องมือแบบไดนามิกของ Codex ใช้โปรไฟล์ `native-first` เป็นค่าเริ่มต้น ในโหมดนั้น
OpenClaw จะไม่เปิดเผยเครื่องมือแบบไดนามิกที่ซ้ำกับการทำงานในเวิร์กสเปซแบบเนทีฟของ Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` และ
`update_plan` เครื่องมือผสานรวมของ OpenClaw เช่น การส่งข้อความ เซสชัน สื่อ
cron เบราว์เซอร์ nodes, gateway, `heartbeat_respond` และ `web_search` ยังคง
พร้อมใช้งาน

ฟิลด์ระดับบนสุดของ Plugin Codex ที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น          | ความหมาย                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | ใช้ `"openclaw-compat"` เพื่อเปิดเผยชุดเครื่องมือแบบไดนามิกของ OpenClaw ทั้งหมดให้กับเซิร์ฟเวอร์แอป Codex |
| `codexDynamicToolsExclude` | `[]`             | ชื่อเครื่องมือแบบไดนามิกของ OpenClaw เพิ่มเติมที่จะละไว้จากเทิร์นของเซิร์ฟเวอร์แอป Codex               |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์               | ค่าเริ่มต้น                                  | ความหมาย                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` สร้าง Codex; `"websocket"` เชื่อมต่อกับ `url`                                                                                                                                                                             |
| `command`           | ไบนารี Codex ที่จัดการให้                     | ไฟล์ปฏิบัติการสำหรับทรานสปอร์ต stdio ปล่อยว่างไว้เพื่อใช้ไบนารีที่จัดการให้; ตั้งค่าเฉพาะเมื่อต้องการแทนที่อย่างชัดเจน                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | อาร์กิวเมนต์สำหรับทรานสปอร์ต stdio                                                                                                                                                                                                       |
| `url`               | ไม่ได้ตั้งค่า                                    | URL ของเซิร์ฟเวอร์แอป WebSocket                                                                                                                                                                                                            |
| `authToken`         | ไม่ได้ตั้งค่า                                    | โทเคน Bearer สำหรับทรานสปอร์ต WebSocket                                                                                                                                                                                                |
| `headers`           | `{}`                                     | ส่วนหัว WebSocket เพิ่มเติม                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากโปรเซสเซิร์ฟเวอร์แอป stdio ที่ถูกสร้าง หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว `CODEX_HOME` และ `HOME` ถูกสงวนไว้สำหรับการแยก Codex ต่อเอเจนต์ของ OpenClaw เมื่อเปิดใช้งานภายในเครื่อง |
| `requestTimeoutMs`  | `60000`                                  | เวลาหมดอายุสำหรับการเรียก control-plane ของเซิร์ฟเวอร์แอป                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | พรีเซ็ตสำหรับการดำเนินการแบบ YOLO หรือแบบที่ guardian ตรวจสอบแล้ว                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | นโยบายการอนุมัติแบบเนทีฟของ Codex ที่ส่งไปยังการเริ่ม/ดำเนินต่อ/เทิร์นของเธรด                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | โหมดแซนด์บ็อกซ์แบบเนทีฟของ Codex ที่ส่งไปยังการเริ่ม/ดำเนินต่อของเธรด                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจสอบพรอมป์การอนุมัติแบบเนทีฟ `guardian_subagent` ยังคงเป็นนามแฝงแบบเดิม                                                                                                                         |
| `serviceTier`       | ไม่ได้ตั้งค่า                                    | ระดับบริการของเซิร์ฟเวอร์แอป Codex ที่เป็นทางเลือก: `"fast"`, `"flex"` หรือ `null` ค่าเดิมที่ไม่ถูกต้องจะถูกละเลย                                                                                                                            |

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกต่างหากจาก
`appServer.requestTimeoutMs`: คำขอ `item/tool/call` ของ Codex แต่ละรายการต้องได้รับ
การตอบกลับจาก OpenClaw ภายใน 30 วินาที เมื่อหมดเวลา OpenClaw จะยกเลิกสัญญาณเครื่องมือ
ในจุดที่รองรับ และส่งคืนการตอบกลับเครื่องมือแบบไดนามิกที่ล้มเหลวไปยัง Codex เพื่อให้
เทิร์นสามารถดำเนินต่อได้ แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`

หลังจาก OpenClaw ตอบกลับคำขอเซิร์ฟเวอร์แอประดับเทิร์นของ Codex แล้ว harness
ยังคาดว่า Codex จะจบเทิร์นเนทีฟด้วย `turn/completed` ด้วย หากเซิร์ฟเวอร์แอป
เงียบไป 60 วินาทีหลังจากการตอบกลับนั้น OpenClaw จะพยายามขัดจังหวะเทิร์นของ Codex
อย่างเต็มที่เท่าที่ทำได้ บันทึกการหมดเวลาเพื่อการวินิจฉัย และปล่อย lane ของเซสชัน
OpenClaw เพื่อไม่ให้ข้อความแชตถัดไปถูกเข้าคิวอยู่หลังเทิร์นเนทีฟที่ค้างอยู่

การแทนที่ด้วยสภาพแวดล้อมยังคงพร้อมใช้งานสำหรับการทดสอบภายในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ข้ามไบนารีที่จัดการให้เมื่อ
`appServer.command` ไม่ได้ตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือใช้
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบภายในเครื่องแบบครั้งเดียว ควรใช้ config
สำหรับการปรับใช้ที่ทำซ้ำได้ เพราะจะเก็บพฤติกรรมของ plugin ไว้ในไฟล์ที่ผ่านการตรวจสอบเดียวกัน
กับการตั้งค่า harness ของ Codex ส่วนที่เหลือ

## การใช้คอมพิวเตอร์

การใช้คอมพิวเตอร์มีคู่มือการตั้งค่าของตัวเอง:
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use)

สรุปสั้น ๆ: OpenClaw ไม่รวมแอปควบคุมเดสก์ท็อปไว้ในซอร์สหรือดำเนินการเดสก์ท็อปเอง
แต่จะเตรียมเซิร์ฟเวอร์แอป Codex ตรวจสอบว่าเซิร์ฟเวอร์ MCP
`computer-use` พร้อมใช้งาน จากนั้นให้ Codex จัดการการเรียกเครื่องมือ MCP แบบเนทีฟ
ระหว่างเทิร์นในโหมด Codex

สำหรับการเข้าถึงไดรเวอร์ TryCua โดยตรงนอกโฟลว์ marketplace ของ Codex ให้ลงทะเบียน
`cua-driver mcp` ด้วย `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`
ดู [การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use) สำหรับความแตกต่าง
ระหว่างการใช้คอมพิวเตอร์ที่ Codex เป็นเจ้าของกับการลงทะเบียน MCP โดยตรง

config ขั้นต่ำ:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

การตั้งค่าสามารถตรวจสอบหรือติดตั้งได้จากพื้นผิวคำสั่ง:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

การใช้คอมพิวเตอร์ใช้ได้เฉพาะ macOS และอาจต้องมีสิทธิ์ของระบบปฏิบัติการภายในเครื่องก่อนที่
เซิร์ฟเวอร์ MCP ของ Codex จะควบคุมแอปได้ หาก `computerUse.enabled` เป็น true และเซิร์ฟเวอร์ MCP
ไม่พร้อมใช้งาน เทิร์นในโหมด Codex จะล้มเหลวก่อนที่เธรดจะเริ่ม แทนที่จะทำงานแบบเงียบ ๆ
โดยไม่มีเครื่องมือการใช้คอมพิวเตอร์แบบเนทีฟ ดู
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use) สำหรับตัวเลือก marketplace,
ขีดจำกัดของแค็ตตาล็อกระยะไกล เหตุผลของสถานะ และการแก้ไขปัญหา

เมื่อ `computerUse.autoInstall` เป็น true OpenClaw สามารถลงทะเบียน marketplace
Codex Desktop มาตรฐานที่รวมมาให้จาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ได้ หาก Codex
ยังไม่พบ marketplace ภายในเครื่อง ใช้ `/new` หรือ `/reset` หลังจากเปลี่ยน runtime
หรือ config การใช้คอมพิวเตอร์ เพื่อไม่ให้เซสชันที่มีอยู่ยังคงใช้การผูก PI หรือเธรด Codex เก่า

## สูตรที่ใช้บ่อย

Codex ภายในเครื่องพร้อมทรานสปอร์ต stdio ค่าเริ่มต้น:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

การตรวจสอบ harness เฉพาะ Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

การอนุมัติของ Codex ที่ guardian ตรวจสอบแล้ว:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

เซิร์ฟเวอร์แอประยะไกลพร้อมส่วนหัวที่ระบุชัดเจน:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

การสลับโมเดลยังคงควบคุมโดย OpenClaw เมื่อเซสชัน OpenClaw แนบอยู่กับเธรด Codex
ที่มีอยู่ เทิร์นถัดไปจะส่งโมเดล OpenAI, provider, นโยบายการอนุมัติ, แซนด์บ็อกซ์
และระดับบริการที่เลือกอยู่ในปัจจุบันไปยังเซิร์ฟเวอร์แอปอีกครั้ง การสลับจาก
`openai/gpt-5.5` เป็น `openai/gpt-5.2` จะคงการผูกเธรดไว้ แต่ขอให้ Codex
ดำเนินการต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

Plugin ที่รวมมาให้จะลงทะเบียน `/codex` เป็นคำสั่งสแลชที่ได้รับอนุญาต คำสั่งนี้
เป็นแบบทั่วไปและทำงานได้บนทุกช่องทางที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` แสดงการเชื่อมต่อเซิร์ฟเวอร์แอปแบบสด โมเดล บัญชี ขีดจำกัดอัตรา เซิร์ฟเวอร์ MCP และ Skills
- `/codex models` แสดงรายการโมเดลเซิร์ฟเวอร์แอป Codex แบบสด
- `/codex threads [filter]` แสดงรายการเธรด Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันเข้ากับเธรด Codex ที่มีอยู่
- `/codex compact` ขอให้เซิร์ฟเวอร์แอป Codex ทำ Compaction เธรดที่แนบอยู่
- `/codex review` เริ่มการตรวจทานเนทีฟของ Codex สำหรับเธรดที่แนบอยู่
- `/codex diagnostics [note]` ขออนุญาตก่อนส่งความคิดเห็นการวินิจฉัยของ Codex สำหรับเธรดที่แนบอยู่
- `/codex computer-use status` ตรวจสอบ Plugin Computer Use และเซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้
- `/codex computer-use install` ติดตั้ง Plugin Computer Use ที่กำหนดค่าไว้และโหลดเซิร์ฟเวอร์ MCP ใหม่
- `/codex account` แสดงสถานะบัญชีและขีดจำกัดอัตรา
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของเซิร์ฟเวอร์แอป Codex
- `/codex skills` แสดงรายการ Skills ของเซิร์ฟเวอร์แอป Codex

เมื่อ Codex รายงานความล้มเหลวจากขีดจำกัดการใช้งาน OpenClaw จะรวมเวลารีเซ็ต
เซิร์ฟเวอร์แอปครั้งถัดไปไว้ด้วยเมื่อ Codex ให้ข้อมูลนี้มา ใช้ `/codex account` ในบทสนทนาเดียวกัน
เพื่อตรวจสอบบัญชีปัจจุบันและหน้าต่างขีดจำกัดอัตรา

### เวิร์กโฟลว์การดีบักทั่วไป

เมื่อเอเจนต์ที่ใช้ Codex ทำสิ่งที่ไม่คาดคิดใน Telegram, Discord, Slack
หรือช่องทางอื่น ให้เริ่มจากบทสนทนาที่เกิดปัญหา:

1. เรียกใช้ `/diagnostics bad tool choice after image upload` หรือหมายเหตุสั้น ๆ อื่น
   ที่อธิบายสิ่งที่คุณเห็น
2. อนุมัติคำขอการวินิจฉัยหนึ่งครั้ง การอนุมัติจะสร้างไฟล์ zip การวินิจฉัยของ Gateway
   ในเครื่อง และเนื่องจากเซสชันใช้ฮาร์เนส Codex จึงยัง
   ส่งชุดความคิดเห็น Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
3. คัดลอกคำตอบการวินิจฉัยที่เสร็จสมบูรณ์ไปยังรายงานบั๊กหรือเธรดสนับสนุน
   คำตอบนี้มีพาธบันเดิลในเครื่อง สรุปความเป็นส่วนตัว รหัสเซสชัน OpenClaw
   รหัสเธรด Codex และบรรทัด `Inspect locally` สำหรับแต่ละเธรด Codex
4. หากคุณต้องการดีบักการรันด้วยตนเอง ให้เรียกใช้คำสั่ง `Inspect locally`
   ที่พิมพ์ไว้ในเทอร์มินัล คำสั่งจะมีลักษณะเหมือน `codex resume <thread-id>` และเปิด
   เธรด Codex เนทีฟเพื่อให้คุณตรวจสอบบทสนทนา ดำเนินการต่อในเครื่อง
   หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือแผนนั้น

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลดความคิดเห็น Codex
สำหรับเธรดที่แนบอยู่ในปัจจุบันโดยเฉพาะ โดยไม่รวมบันเดิลการวินิจฉัย Gateway
ของ OpenClaw ทั้งหมด สำหรับรายงานสนับสนุนส่วนใหญ่ `/diagnostics [note]` คือ
จุดเริ่มต้นที่ดีกว่า เพราะผูกสถานะ Gateway ในเครื่องและรหัสเธรด Codex
ไว้ด้วยกันในคำตอบเดียว ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics)
สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรมแชตกลุ่มทั้งหมด

แกนหลักของ OpenClaw ยังเปิดให้เจ้าของเท่านั้นใช้ `/diagnostics [note]` เป็นคำสั่งการวินิจฉัย
Gateway ทั่วไป พรอมป์การอนุมัติจะแสดงคำนำเกี่ยวกับข้อมูลละเอียดอ่อน
ลิงก์ไปยัง [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) และขอ
`openclaw gateway diagnostics export --json` ผ่านการอนุมัติการดำเนินการแบบชัดเจน
ทุกครั้ง อย่าอนุมัติการวินิจฉัยด้วยกฎอนุญาตทั้งหมด หลังการอนุมัติ
OpenClaw จะส่งรายงานที่วางต่อได้พร้อมพาธบันเดิลในเครื่องและสรุป
แมนิเฟสต์ เมื่อเซสชัน OpenClaw ที่ใช้งานอยู่ใช้ฮาร์เนส Codex
การอนุมัติเดียวกันนั้นยังอนุญาตให้ส่งชุดความคิดเห็น Codex ที่เกี่ยวข้องไปยัง
เซิร์ฟเวอร์ OpenAI ด้วย พรอมป์การอนุมัติระบุว่าจะส่งความคิดเห็น Codex แต่
จะไม่แสดงรหัสเซสชันหรือรหัสเธรด Codex ก่อนการอนุมัติ

หากเจ้าของเรียกใช้ `/diagnostics` ในแชตกลุ่ม OpenClaw จะรักษาความเรียบร้อยของ
ช่องทางที่ใช้ร่วมกัน: กลุ่มจะได้รับเพียงประกาศสั้น ๆ ส่วน
คำนำการวินิจฉัย พรอมป์การอนุมัติ และรหัสเซสชัน/เธรด Codex จะถูกส่งไปยัง
เจ้าของผ่านเส้นทางอนุมัติส่วนตัว หากไม่มีเส้นทางเจ้าของส่วนตัว
OpenClaw จะปฏิเสธคำขอจากกลุ่มและขอให้เจ้าของเรียกใช้จาก DM

การอัปโหลด Codex ที่ได้รับอนุมัติจะเรียกเซิร์ฟเวอร์แอป Codex `feedback/upload` และขอให้
เซิร์ฟเวอร์แอปรวมบันทึกสำหรับแต่ละเธรดที่ระบุและเธรดย่อย Codex ที่สร้างขึ้น
เมื่อมี การอัปโหลดจะผ่านเส้นทางความคิดเห็นปกติของ Codex ไปยังเซิร์ฟเวอร์ OpenAI;
หากความคิดเห็น Codex ถูกปิดใช้งานในเซิร์ฟเวอร์แอปนั้น คำสั่งจะส่งคืน
ข้อผิดพลาดของเซิร์ฟเวอร์แอป คำตอบการวินิจฉัยที่เสร็จสมบูรณ์จะแสดงรายการช่องทาง
รหัสเซสชัน OpenClaw รหัสเธรด Codex และคำสั่ง `codex resume <thread-id>`
ในเครื่องสำหรับเธรดที่ถูกส่ง หากคุณปฏิเสธหรือเพิกเฉยต่อการอนุมัติ
OpenClaw จะไม่พิมพ์รหัส Codex เหล่านั้น การอัปโหลดนี้ไม่ได้แทนที่การส่งออก
การวินิจฉัย Gateway ในเครื่อง

`/codex resume` เขียนไฟล์ผูกโยงข้างเคียงเดียวกับที่ฮาร์เนสใช้สำหรับ
เทิร์นปกติ ในข้อความถัดไป OpenClaw จะกลับไปใช้เธรด Codex นั้น ส่ง
โมเดล OpenClaw ที่เลือกอยู่ในปัจจุบันเข้าไปในเซิร์ฟเวอร์แอป และเปิดใช้งาน
ประวัติแบบขยายต่อไป

### ตรวจสอบเธรด Codex จาก CLI

วิธีที่เร็วที่สุดในการทำความเข้าใจการรัน Codex ที่ผิดพลาดมักคือการเปิดเธรด Codex
เนทีฟโดยตรง:

```sh
codex resume <thread-id>
```

ใช้คำสั่งนี้เมื่อคุณสังเกตเห็นบั๊กในบทสนทนาช่องทางและต้องการตรวจสอบ
เซสชัน Codex ที่มีปัญหา ดำเนินการต่อในเครื่อง หรือถาม Codex ว่าทำไมจึงเลือก
เครื่องมือหรือแนวทางการให้เหตุผลนั้น เส้นทางที่ง่ายที่สุดโดยปกติคือเรียกใช้
`/diagnostics [note]` ก่อน: หลังจากคุณอนุมัติแล้ว รายงานที่เสร็จสมบูรณ์จะแสดงรายการ
แต่ละเธรด Codex และพิมพ์คำสั่ง `Inspect locally` เช่น
`codex resume <thread-id>` คุณสามารถคัดลอกคำสั่งนั้นไปยังเทอร์มินัลได้โดยตรง

คุณยังสามารถรับรหัสเธรดจาก `/codex binding` สำหรับแชตปัจจุบัน หรือ
`/codex threads [filter]` สำหรับเธรดเซิร์ฟเวอร์แอป Codex ล่าสุด แล้วเรียกใช้คำสั่ง
`codex resume` เดียวกันในเชลล์ของคุณ

พื้นผิวคำสั่งต้องใช้เซิร์ฟเวอร์แอป Codex `0.125.0` หรือใหม่กว่า เมธอดควบคุม
แต่ละรายการจะถูกรายงานเป็น `unsupported by this Codex app-server` หาก
เซิร์ฟเวอร์แอปในอนาคตหรือแบบกำหนดเองไม่เปิดเผยเมธอด JSON-RPC นั้น

## ขอบเขตของฮุก

ฮาร์เนส Codex มีเลเยอร์ฮุกสามชั้น:

| เลเยอร์                                 | เจ้าของ                    | วัตถุประสงค์                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| ฮุก Plugin ของ OpenClaw                 | OpenClaw                 | ความเข้ากันได้ของผลิตภัณฑ์/Plugin ระหว่างฮาร์เนส PI และ Codex         |
| มิดเดิลแวร์ส่วนขยายของเซิร์ฟเวอร์แอป Codex | Plugin ที่มาพร้อม OpenClaw | พฤติกรรมอะแดปเตอร์ต่อเทิร์นรอบเครื่องมือไดนามิกของ OpenClaw            |
| ฮุกเนทีฟของ Codex                    | Codex                    | วงจรชีวิต Codex ระดับต่ำและนโยบายเครื่องมือเนทีฟจากการกำหนดค่า Codex |

OpenClaw ไม่ใช้ไฟล์ `hooks.json` ของโปรเจกต์หรือส่วนกลางของ Codex เพื่อกำหนดเส้นทาง
พฤติกรรม Plugin ของ OpenClaw สำหรับเครื่องมือเนทีฟและบริดจ์สิทธิ์ที่รองรับ
OpenClaw จะแทรกการกำหนดค่า Codex รายเธรดสำหรับ `PreToolUse`, `PostToolUse`,
`PermissionRequest` และ `Stop` ฮุก Codex อื่น ๆ เช่น `SessionStart` และ
`UserPromptSubmit` ยังคงเป็นตัวควบคุมระดับ Codex; สิ่งเหล่านี้ไม่ได้ถูกเปิดเผยเป็น
ฮุก Plugin ของ OpenClaw ในสัญญา v1

สำหรับเครื่องมือไดนามิกของ OpenClaw OpenClaw จะดำเนินการเครื่องมือหลังจาก Codex ขอ
การเรียก ดังนั้น OpenClaw จึงเรียกพฤติกรรม Plugin และมิดเดิลแวร์ที่ตนเป็นเจ้าของใน
อะแดปเตอร์ฮาร์เนส สำหรับเครื่องมือเนทีฟของ Codex Codex เป็นเจ้าของบันทึกเครื่องมือ
ตามหลัก OpenClaw สามารถมิเรอร์เหตุการณ์ที่เลือกได้ แต่ไม่สามารถเขียนเธรด Codex
เนทีฟใหม่ เว้นแต่ Codex จะเปิดเผยการดำเนินการนั้นผ่านเซิร์ฟเวอร์แอปหรือคอลแบ็ก
ฮุกเนทีฟ

การฉายภาพ Compaction และวงจรชีวิต LLM มาจากการแจ้งเตือนของเซิร์ฟเวอร์แอป Codex
และสถานะอะแดปเตอร์ OpenClaw ไม่ใช่คำสั่งฮุกเนทีฟของ Codex
เหตุการณ์ `before_compaction`, `after_compaction`, `llm_input` และ
`llm_output` ของ OpenClaw เป็นการสังเกตระดับอะแดปเตอร์ ไม่ใช่การจับข้อมูลแบบ
ตรงทุกไบต์ของคำขอภายในหรือเพย์โหลด Compaction ของ Codex

การแจ้งเตือนเซิร์ฟเวอร์แอป `hook/started` และ `hook/completed` เนทีฟของ Codex
จะถูกฉายเป็นเหตุการณ์เอเจนต์ `codex_app_server.hook` สำหรับเส้นทางการทำงานและการดีบัก
สิ่งเหล่านี้ไม่เรียกฮุก Plugin ของ OpenClaw

## สัญญาการรองรับ V1

โหมด Codex ไม่ใช่ PI ที่มีการเรียกโมเดลคนละแบบอยู่ข้างใต้ Codex เป็นเจ้าของส่วนที่มากกว่า
ของลูปโมเดลเนทีฟ และ OpenClaw ปรับพื้นผิว Plugin และเซสชันของตน
รอบขอบเขตนั้น

รองรับในรันไทม์ Codex v1:

| พื้นผิว                                       | การรองรับ                                 | เหตุผล                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ลูปโมเดล OpenAI ผ่าน Codex               | รองรับ                               | เซิร์ฟเวอร์แอป Codex เป็นเจ้าของเทิร์น OpenAI การกลับไปใช้เธรดเนทีฟ และการดำเนินการเครื่องมือเนทีฟต่อ                                                                                                            |
| การกำหนดเส้นทางและการส่งมอบช่องทางของ OpenClaw         | รองรับ                               | Telegram, Discord, Slack, WhatsApp, iMessage และช่องทางอื่น ๆ อยู่ภายนอกรันไทม์โมเดล                                                                                                      |
| เครื่องมือไดนามิกของ OpenClaw                        | รองรับ                               | Codex ขอให้ OpenClaw ดำเนินการเครื่องมือเหล่านี้ ดังนั้น OpenClaw จึงยังอยู่ในเส้นทางการดำเนินการ                                                                                                                  |
| Plugin พรอมป์และบริบท                    | รองรับ                               | OpenClaw สร้างโอเวอร์เลย์พรอมป์และฉายบริบทเข้าไปในเทิร์น Codex ก่อนเริ่มหรือกลับไปใช้เธรด                                                                                      |
| วงจรชีวิตเอนจินบริบท                      | รองรับ                               | การประกอบ การนำเข้าหรือการบำรุงรักษาหลังเทิร์น และการประสานงาน Compaction ของเอนจินบริบทจะทำงานสำหรับเทิร์น Codex                                                                                           |
| ฮุกเครื่องมือไดนามิก                            | รองรับ                               | `before_tool_call`, `after_tool_call` และมิดเดิลแวร์ผลลัพธ์เครื่องมือทำงานรอบเครื่องมือไดนามิกที่ OpenClaw เป็นเจ้าของ                                                                                            |
| ฮุกวงจรชีวิต                               | รองรับในฐานะการสังเกตของอะแดปเตอร์       | `llm_input`, `llm_output`, `agent_end`, `before_compaction` และ `after_compaction` ทำงานพร้อมเพย์โหลดโหมด Codex ที่ตรงไปตรงมา                                                                             |
| เกตการแก้ไขคำตอบสุดท้าย                    | รองรับผ่านรีเลย์ฮุกเนทีฟ | Codex `Stop` ถูกรีเลย์ไปยัง `before_agent_finalize`; `revise` ขอให้ Codex ทำโมเดลพาสอีกครั้งก่อนการสรุปผล                                                                                  |
| เชลล์เนทีฟ แพตช์ และการบล็อกหรือสังเกต MCP | รองรับผ่านรีเลย์ฮุกเนทีฟ | Codex `PreToolUse` และ `PostToolUse` ถูกรีเลย์สำหรับพื้นผิวเครื่องมือเนทีฟที่ยืนยันแล้ว รวมถึงเพย์โหลด MCP บนเซิร์ฟเวอร์แอป Codex `0.125.0` หรือใหม่กว่า รองรับการบล็อก แต่ไม่รองรับการเขียนอาร์กิวเมนต์ใหม่ |
| นโยบายสิทธิ์เนทีฟ                      | รองรับผ่านรีเลย์ฮุกเนทีฟ | Codex `PermissionRequest` สามารถกำหนดเส้นทางผ่านนโยบาย OpenClaw ได้เมื่อรันไทม์เปิดเผย หาก OpenClaw ไม่ส่งคืนการตัดสินใจ Codex จะดำเนินต่อผ่านผู้พิทักษ์ปกติหรือเส้นทางอนุมัติของผู้ใช้     |
| การจับเส้นทางการทำงานของเซิร์ฟเวอร์แอป                 | รองรับ                               | OpenClaw บันทึกคำขอที่ส่งไปยังเซิร์ฟเวอร์แอปและการแจ้งเตือนจากเซิร์ฟเวอร์แอปที่ได้รับ                                                                                                      |

ไม่รองรับในรันไทม์ Codex v1:

| พื้นผิว                                             | ขอบเขต V1                                                                                                                                     | เส้นทางในอนาคต                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| การกลายพันธุ์อาร์กิวเมนต์ของเครื่องมือ native                       | ฮุกก่อนใช้เครื่องมือแบบ native ของ Codex สามารถบล็อกได้ แต่ OpenClaw ไม่เขียนอาร์กิวเมนต์เครื่องมือ native ของ Codex ใหม่                                               | ต้องมีการรองรับฮุก/สคีมาของ Codex สำหรับอินพุตเครื่องมือทดแทน                            |
| ประวัติทรานสคริปต์ native ของ Codex ที่แก้ไขได้            | Codex เป็นเจ้าของประวัติเธรด native ที่เป็นต้นฉบับ canonical OpenClaw เป็นเจ้าของสำเนาสะท้อนและสามารถฉายบริบทในอนาคตได้ แต่ไม่ควรกลายพันธุ์ internals ที่ไม่รองรับ | เพิ่ม API ของ Codex app-server อย่างชัดเจน หากจำเป็นต้องผ่าตัดเธรด native                    |
| `tool_result_persist` สำหรับเรคคอร์ดเครื่องมือ native ของ Codex | ฮุกนั้นแปลงการเขียนทรานสคริปต์ที่ OpenClaw เป็นเจ้าของ ไม่ใช่เรคคอร์ดเครื่องมือ native ของ Codex                                                           | อาจสะท้อนเรคคอร์ดที่แปลงแล้วได้ แต่การเขียน canonical ใหม่ต้องมีการรองรับจาก Codex              |
| เมทาดาทาการ Compaction native แบบสมบูรณ์                     | OpenClaw สังเกตเห็นการเริ่มและการเสร็จสิ้น Compaction แต่ไม่ได้รับรายการ kept/dropped ที่เสถียร, token delta หรือ payload สรุป            | ต้องมีเหตุการณ์ Compaction ของ Codex ที่สมบูรณ์กว่า                                                     |
| การแทรกแซง Compaction                             | ฮุก Compaction ของ OpenClaw ปัจจุบันอยู่ระดับการแจ้งเตือนในโหมด Codex                                                                         | เพิ่มฮุกก่อน/หลัง Compaction ของ Codex หาก plugins ต้อง veto หรือเขียน Compaction native ใหม่ |
| การจับคำขอ model API แบบ byte-for-byte             | OpenClaw สามารถจับคำขอและการแจ้งเตือนของ app-server ได้ แต่แกน Codex สร้างคำขอ OpenAI API สุดท้ายภายใน                      | ต้องมีเหตุการณ์ tracing คำขอโมเดลของ Codex หรือ API ดีบัก                                   |

## เครื่องมือ สื่อ และ Compaction

ฮาร์เนส Codex เปลี่ยนเฉพาะ executor ของเอเจนต์ฝังตัวระดับต่ำเท่านั้น

OpenClaw ยังคงสร้างรายการเครื่องมือและรับผลลัพธ์เครื่องมือแบบไดนามิกจาก
ฮาร์เนส ข้อความ รูปภาพ วิดีโอ เพลง TTS การอนุมัติ และเอาต์พุตของเครื่องมือส่งข้อความ
ยังคงดำเนินผ่านเส้นทางการส่งมอบปกติของ OpenClaw

รีเลย์ฮุก native ตั้งใจให้เป็นแบบ generic แต่สัญญาการรองรับ v1
จำกัดอยู่ที่เส้นทางเครื่องมือและสิทธิ์ native ของ Codex ที่ OpenClaw ทดสอบ ใน
รันไทม์ Codex นั่นรวมถึง payloads ของเชลล์, แพตช์ และ MCP `PreToolUse`,
`PostToolUse` และ `PermissionRequest` อย่าสันนิษฐานว่าทุกเหตุการณ์ฮุก Codex
ในอนาคตเป็นพื้นผิว Plugin ของ OpenClaw จนกว่าสัญญารันไทม์จะระบุชื่อ
เหตุการณ์นั้น

สำหรับ `PermissionRequest` OpenClaw จะส่งคืนการตัดสินใจ allow หรือ deny ที่ชัดเจน
เฉพาะเมื่อ policy ตัดสินใจ ผลลัพธ์ไม่มีการตัดสินใจไม่ใช่ allow Codex ถือว่านั่นเป็น
ไม่มีการตัดสินใจจากฮุก และส่งต่อไปยัง guardian ของตนเองหรือเส้นทางขออนุมัติจากผู้ใช้

การขออนุมัติเครื่องมือ MCP ของ Codex ถูกส่งผ่านโฟลว์การอนุมัติ Plugin ของ OpenClaw
เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"` พรอมป์ `request_user_input` ของ Codex ถูกส่งกลับไปยัง
แชตต้นทาง และข้อความติดตามผลถัดไปในคิวจะตอบคำขอ native server นั้น
แทนที่จะถูกนำทางเป็นบริบทเพิ่มเติม คำขอ elicitation MCP อื่นๆ ยังคง fail closed

การนำทางคิว active-run แมปกับ `turn/steer` ของ Codex app-server ด้วย
ค่าเริ่มต้น `messages.queue.mode: "steer"` OpenClaw จะรวมข้อความแชตในคิว
สำหรับช่วงเวลาสงบที่กำหนดค่าไว้ และส่งเป็นคำขอ `turn/steer` เดียวตาม
ลำดับที่มาถึง โหมด `queue` แบบ legacy จะส่งคำขอ `turn/steer` แยกกัน Codex
review และเทิร์น Compaction แบบ manual อาจปฏิเสธ same-turn steering ซึ่งในกรณีนั้น
OpenClaw จะใช้ followup queue เมื่อโหมดที่เลือกอนุญาต fallback ดู
[คิวการนำทาง](/th/concepts/queue-steering)

เมื่อโมเดลที่เลือกใช้ฮาร์เนส Codex การ Compaction เธรด native จะถูก
มอบหมายให้ Codex app-server OpenClaw เก็บสำเนาสะท้อนทรานสคริปต์สำหรับประวัติ
ช่องทาง การค้นหา `/new`, `/reset` และการสลับโมเดลหรือฮาร์เนสในอนาคต
สำเนาสะท้อนมีพรอมป์ของผู้ใช้ ข้อความสุดท้ายของผู้ช่วย และเรคคอร์ด reasoning หรือแผนของ Codex
แบบเบาเมื่อ app-server ส่งออกมา ปัจจุบัน OpenClaw บันทึกเฉพาะ
สัญญาณการเริ่มและการเสร็จสิ้น Compaction native ยังไม่ได้เปิดเผย
สรุป Compaction ที่มนุษย์อ่านได้ หรือรายการตรวจสอบได้ว่า Codex
เก็บรายการใดไว้หลัง Compaction

เนื่องจาก Codex เป็นเจ้าของเธรด native ที่เป็น canonical `tool_result_persist` จึงยังไม่
เขียนเรคคอร์ดผลลัพธ์เครื่องมือ native ของ Codex ใหม่ในตอนนี้ มันจะใช้เฉพาะเมื่อ
OpenClaw กำลังเขียนผลลัพธ์เครื่องมือของทรานสคริปต์เซสชันที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่ต้องใช้ PI รูปภาพ วิดีโอ เพลง PDF, TTS และ
การทำความเข้าใจสื่อยังคงใช้การตั้งค่า provider/model ที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็นผู้ให้บริการ `/model` ปกติ:** นั่นเป็นสิ่งที่คาดไว้สำหรับ
การกำหนดค่าใหม่ เลือกโมเดล `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"` (หรือ ref `codex/*` แบบ legacy), เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ไม่ได้ยกเว้น
`codex`

**OpenClaw ใช้ PI แทน Codex:** `agentRuntime.id: "auto"` ยังสามารถใช้ PI เป็น
แบ็กเอนด์ความเข้ากันได้เมื่อไม่มีฮาร์เนส Codex ใดรับ run นั้น ตั้งค่า
`agentRuntime.id: "codex"` เพื่อบังคับการเลือก Codex ระหว่างทดสอบ
รันไทม์ Codex ที่ถูกบังคับจะล้มเหลวแทนที่จะ fallback ไปที่ PI เมื่อ Codex app-server
ถูกเลือกแล้ว ความล้มเหลวของมันจะแสดงโดยตรง

**app-server ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้ handshake ของ app-server
รายงานเวอร์ชัน `0.125.0` หรือใหม่กว่า prerelease เวอร์ชันเดียวกันหรือเวอร์ชันที่มี suffix build
เช่น `0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ
floor โปรโตคอล stable `0.125.0` คือสิ่งที่ OpenClaw ทดสอบ

**การค้นพบโมเดลช้า:** ลด `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิดการค้นพบ

**การขนส่ง WebSocket ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`,
และตรวจสอบว่า app-server ระยะไกลพูดโปรโตคอล Codex app-server เวอร์ชันเดียวกัน

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นั่นเป็นสิ่งที่คาดไว้ เว้นแต่คุณจะบังคับ
`agentRuntime.id: "codex"` สำหรับเอเจนต์นั้น หรือเลือก ref `codex/*`
แบบ legacy ref `openai/gpt-*` แบบปกติและ ref ของ provider อื่นๆ จะยังอยู่บน
เส้นทาง provider ปกติในโหมด `auto` หากคุณบังคับ `agentRuntime.id: "codex"` ทุกเทิร์นที่ฝังตัว
สำหรับเอเจนต์นั้นต้องเป็นโมเดล OpenAI ที่ Codex รองรับ

**Computer Use ติดตั้งแล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงาน
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงอยู่ ให้รีสตาร์ต
gateway เพื่อล้างการลงทะเบียนฮุก native ที่ค้างอยู่ หาก `computer-use.list_apps`
หมดเวลา ให้รีสตาร์ต Codex Computer Use หรือ Codex Desktop แล้วลองอีกครั้ง

## ที่เกี่ยวข้อง

- [Plugins ฮาร์เนสเอเจนต์](/th/plugins/sdk-agent-harness)
- [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [สถานะ](/th/cli/status)
- [ฮุก Plugin](/th/plugins/hooks)
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
