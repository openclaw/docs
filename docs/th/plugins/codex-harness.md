---
read_when:
    - คุณต้องการใช้ชุด harness สำหรับ app-server ของ Codex ที่มาพร้อมกัน
    - คุณต้องการตัวอย่างการกำหนดค่าชุดควบคุมของ Codex
    - คุณต้องการให้การปรับใช้ที่ใช้ Codex เท่านั้นล้มเหลวแทนที่จะย้อนกลับไปใช้ PI
summary: รันรอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านชุดควบคุม app-server ของ Codex ที่รวมมาให้
title: ฮาร์เนส Codex
x-i18n:
    generated_at: "2026-05-02T23:39:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ffa0cbb28422b2ed8d7c0eef6ee0222072c523d170b4b33597bb37bd3fa9700
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่มาพร้อมชุดติดตั้งช่วยให้ OpenClaw เรียกใช้รอบการทำงานของเอเจนต์แบบฝังผ่าน
app-server ของ Codex แทน harness PI ในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับต่ำ: การค้นหาโมเดล,
การกลับมาใช้เธรดเดิมแบบเนทีฟ, Compaction แบบเนทีฟ และการทำงานผ่าน app-server
OpenClaw ยังคงเป็นเจ้าของช่องแชต, ไฟล์เซสชัน, การเลือกโมเดล, เครื่องมือ,
การอนุมัติ, การส่งสื่อ และสำเนาทรานสคริปต์ที่มองเห็นได้

เมื่อรอบแชตต้นทางทำงานผ่าน harness ของ Codex การตอบกลับที่มองเห็นได้จะใช้ค่าเริ่มต้น
เป็นเครื่องมือ `message` ของ OpenClaw หากการปรับใช้งานยังไม่ได้กำหนดค่า
`messages.visibleReplies` ไว้อย่างชัดเจน เอเจนต์ยังคงจบรอบ Codex ของตนแบบส่วนตัวได้;
เอเจนต์จะโพสต์ไปยังช่องทางก็ต่อเมื่อเรียก `message(action="send")` เท่านั้น ตั้งค่า
`messages.visibleReplies: "automatic"` เพื่อให้การตอบกลับสุดท้ายในแชตโดยตรงยังคงอยู่บน
เส้นทางการส่งแบบอัตโนมัติดั้งเดิม

รอบ Heartbeat ของ Codex จะได้รับเครื่องมือ `heartbeat_respond` ตามค่าเริ่มต้นด้วย ดังนั้น
เอเจนต์จึงบันทึกได้ว่าการปลุกควรเงียบต่อไปหรือแจ้งเตือน โดยไม่ต้องเข้ารหัสโฟลว์ควบคุมนั้น
ไว้ในข้อความสุดท้าย

หากคุณกำลังพยายามทำความเข้าใจภาพรวม ให้เริ่มจาก
[รันไทม์เอเจนต์](/th/concepts/agent-runtimes) เวอร์ชันสั้นคือ:
`openai/gpt-5.5` คือการอ้างอิงโมเดล, `codex` คือรันไทม์ และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## การตั้งค่าด่วน

ผู้ใช้ส่วนใหญ่ที่ต้องการ "Codex ใน OpenClaw" ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
การสมัครใช้งาน ChatGPT/Codex แล้วเรียกใช้รอบเอเจนต์แบบฝังผ่านรันไทม์
app-server ของ Codex แบบเนทีฟ การอ้างอิงโมเดลยังคงอยู่ในรูปแบบ canonical เป็น
`openai/gpt-*`; การยืนยันตัวตนแบบสมัครใช้งานมาจากบัญชี/โปรไฟล์ Codex ไม่ใช่
จาก prefix โมเดล `openai-codex/*`

ก่อนอื่นให้ลงชื่อเข้าใช้ด้วย Codex OAuth หากคุณยังไม่ได้ทำ:

```bash
openclaw models auth login --provider openai-codex
```

จากนั้นเปิดใช้ Plugin `codex` ที่มาพร้อมชุดติดตั้งและบังคับใช้รันไทม์ Codex:

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
        fallback: "none",
      },
    },
  },
}
```

หากการตั้งค่าของคุณใช้ `plugins.allow` ให้ใส่ `codex` ไว้ที่นั่นด้วย:

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

อย่าใช้ `openai-codex/gpt-*` เมื่อคุณหมายถึงรันไทม์ Codex แบบเนทีฟ prefix นั้น
เป็นเส้นทาง "Codex OAuth ผ่าน PI" อย่างชัดเจน การเปลี่ยนแปลงการตั้งค่ามีผลกับเซสชันใหม่
หรือเซสชันที่รีเซ็ตแล้ว; เซสชันที่มีอยู่จะเก็บรันไทม์ที่บันทึกไว้ของตน

## Plugin นี้เปลี่ยนอะไร

Plugin `codex` ที่มาพร้อมชุดติดตั้งเพิ่มความสามารถแยกกันหลายอย่าง:

| ความสามารถ                        | วิธีใช้                                      | สิ่งที่ทำ                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| รันไทม์แบบฝังเนทีฟ           | `agentRuntime.id: "codex"`                          | เรียกใช้รอบเอเจนต์แบบฝังของ OpenClaw ผ่าน app-server ของ Codex                  |
| คำสั่งควบคุมแชตแบบเนทีฟ      | `/codex bind`, `/codex resume`, `/codex steer`, ... | ผูกและควบคุมเธรด app-server ของ Codex จากการสนทนาผ่านระบบส่งข้อความ    |
| ผู้ให้บริการ/แค็ตตาล็อก app-server ของ Codex | ภายใน `codex`, แสดงผ่าน harness     | ให้รันไทม์ค้นหาและตรวจสอบโมเดล app-server                     |
| เส้นทางทำความเข้าใจสื่อของ Codex    | เส้นทางความเข้ากันได้ของโมเดลภาพ `codex/*`           | เรียกใช้รอบ app-server ของ Codex แบบจำกัดสำหรับโมเดลทำความเข้าใจภาพที่รองรับ |
| รีเลย์ hook แบบเนทีฟ                 | Hook ของ Plugin รอบเหตุการณ์เนทีฟของ Codex             | ให้ OpenClaw สังเกต/บล็อกเหตุการณ์เครื่องมือ/การจบงานแบบเนทีฟของ Codex ที่รองรับ  |

การเปิดใช้ Plugin ทำให้ความสามารถเหล่านี้พร้อมใช้งาน แต่ **ไม่ได้**:

- เริ่มใช้ Codex กับทุกโมเดล OpenAI
- แปลงการอ้างอิงโมเดล `openai-codex/*` ให้เป็นรันไทม์เนทีฟ
- ทำให้ ACP/acpx เป็นเส้นทาง Codex เริ่มต้น
- สลับเซสชันที่มีอยู่ซึ่งบันทึกรันไทม์ PI แล้วแบบทันที
- แทนที่การส่งผ่านช่องทางของ OpenClaw, ไฟล์เซสชัน, พื้นที่เก็บโปรไฟล์ยืนยันตัวตน หรือ
  การกำหนดเส้นทางข้อความ

Plugin เดียวกันยังเป็นเจ้าของพื้นผิวคำสั่งควบคุมแชต `/codex` แบบเนทีฟด้วย หาก
เปิดใช้ Plugin แล้วผู้ใช้ขอให้ผูก, กลับมาใช้ต่อ, ควบคุมทิศทาง, หยุด หรือตรวจสอบ
เธรด Codex จากแชต เอเจนต์ควรเลือกใช้ `/codex ...` แทน ACP โดย ACP ยังคงเป็น
ทางเลือกสำรองที่ชัดเจนเมื่อผู้ใช้ขอ ACP/acpx หรือกำลังทดสอบอะแดปเตอร์ ACP
ของ Codex

รอบ Codex แบบเนทีฟยังคงใช้ hook ของ Plugin ของ OpenClaw เป็นเลเยอร์ความเข้ากันได้สาธารณะ
สิ่งเหล่านี้คือ hook ของ OpenClaw แบบในกระบวนการ ไม่ใช่ hook คำสั่ง `hooks.json` ของ Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` สำหรับเรคคอร์ดทรานสคริปต์ที่ทำสำเนา
- `before_agent_finalize` ผ่านรีเลย์ `Stop` ของ Codex
- `agent_end`

Plugin ยังสามารถลงทะเบียนมิดเดิลแวร์ผลลัพธ์เครื่องมือที่ไม่ผูกกับรันไทม์ เพื่อเขียนใหม่
ผลลัพธ์เครื่องมือแบบไดนามิกของ OpenClaw หลังจาก OpenClaw ดำเนินการเครื่องมือแล้วและก่อนที่
ผลลัพธ์จะถูกส่งกลับไปยัง Codex สิ่งนี้แยกจาก hook ของ Plugin สาธารณะ
`tool_result_persist` ซึ่งแปลงการเขียนผลลัพธ์เครื่องมือในทรานสคริปต์ที่ OpenClaw เป็นเจ้าของ

สำหรับความหมายของ hook ของ Plugin เอง โปรดดู [hook ของ Plugin](/th/plugins/hooks)
และ [พฤติกรรม guard ของ Plugin](/th/tools/plugin)

harness ปิดไว้ตามค่าเริ่มต้น การตั้งค่าใหม่ควรเก็บการอ้างอิงโมเดล OpenAI
ให้เป็น canonical ในรูปแบบ `openai/gpt-*` และบังคับใช้
`agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` อย่างชัดเจนเมื่อ
ต้องการการทำงานผ่าน app-server แบบเนทีฟ การอ้างอิงโมเดลดั้งเดิม `codex/*` ยังคงเลือก
harness อัตโนมัติเพื่อความเข้ากันได้ แต่ prefix ผู้ให้บริการดั้งเดิมที่มีรันไทม์รองรับ
จะไม่แสดงเป็นตัวเลือกโมเดล/ผู้ให้บริการปกติ

หากเปิดใช้ Plugin `codex` แล้วแต่โมเดลหลักยังเป็น
`openai-codex/*`, `openclaw doctor` จะเตือนแทนที่จะเปลี่ยนเส้นทาง นี่เป็น
ความตั้งใจ: `openai-codex/*` ยังคงเป็นเส้นทาง PI Codex OAuth/การสมัครใช้งาน และ
การทำงานผ่าน app-server แบบเนทีฟยังเป็นตัวเลือกรันไทม์ที่ต้องระบุอย่างชัดเจน

## แผนที่เส้นทาง

ใช้ตารางนี้ก่อนเปลี่ยนการตั้งค่า:

| พฤติกรรมที่ต้องการ                                     | การอ้างอิงโมเดล                  | การตั้งค่ารันไทม์                         | เส้นทางยืนยันตัวตน/โปรไฟล์           | ป้ายสถานะที่คาดหวัง          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| การสมัครใช้งาน ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth หรือบัญชี Codex | `Runtime: OpenAI Codex`        |
| OpenAI API ผ่านตัวรัน OpenClaw ปกติ            | `openai/gpt-*`             | ละไว้หรือ `runtime: "pi"`             | คีย์ OpenAI API               | `Runtime: OpenClaw Pi Default` |
| การสมัครใช้งาน ChatGPT/Codex ผ่าน PI                | `openai-codex/gpt-*`       | ละไว้หรือ `runtime: "pi"`             | ผู้ให้บริการ OpenAI Codex OAuth  | `Runtime: OpenClaw Pi Default` |
| ผู้ให้บริการผสมกับโหมดอัตโนมัติแบบระมัดระวัง          | การอ้างอิงเฉพาะผู้ให้บริการ     | `agentRuntime.id: "auto"`              | ตามผู้ให้บริการที่เลือก        | ขึ้นอยู่กับรันไทม์ที่เลือก    |
| เซสชันอะแดปเตอร์ Codex ACP แบบชัดเจน                   | ขึ้นกับพรอมป์/โมเดล ACP | `sessions_spawn` พร้อม `runtime: "acp"` | การยืนยันตัวตนแบ็กเอนด์ ACP             | สถานะงาน/เซสชัน ACP        |

จุดแบ่งสำคัญคือผู้ให้บริการเทียบกับรันไทม์:

- `openai-codex/*` ตอบว่า "PI ควรใช้เส้นทางผู้ให้บริการ/การยืนยันตัวตนใด?"
- `agentRuntime.id: "codex"` ตอบว่า "ลูปใดควรดำเนินการ
  รอบแบบฝังนี้?"
- `/codex ...` ตอบว่า "การสนทนา Codex แบบเนทีฟใดควรให้แชตนี้ผูก
  หรือควบคุม?"
- ACP ตอบว่า "acpx ควรเปิดใช้กระบวนการ harness ภายนอกใด?"

## เลือก prefix โมเดลให้ถูกต้อง

เส้นทางตระกูล OpenAI เจาะจงตาม prefix สำหรับการตั้งค่าทั่วไปแบบสมัครใช้งานพร้อม
รันไทม์ Codex แบบเนทีฟ ให้ใช้ `openai/*` กับ `agentRuntime.id: "codex"`
ใช้ `openai-codex/*` เฉพาะเมื่อคุณตั้งใจต้องการ Codex OAuth ผ่าน PI:

| การอ้างอิงโมเดล                                     | เส้นทางรันไทม์                                 | ใช้เมื่อ                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | ผู้ให้บริการ OpenAI ผ่านกลไก OpenClaw/PI | คุณต้องการเข้าถึง OpenAI Platform API โดยตรงในปัจจุบันด้วย `OPENAI_API_KEY` |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth ผ่าน OpenClaw/PI       | คุณต้องการการยืนยันตัวตนแบบสมัครใช้งาน ChatGPT/Codex ด้วยตัวรัน PI เริ่มต้น      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | harness app-server ของ Codex                     | คุณต้องการการยืนยันตัวตนแบบสมัครใช้งาน ChatGPT/Codex ด้วยการทำงาน Codex แบบเนทีฟ     |

GPT-5.5 สามารถปรากฏได้ทั้งบนเส้นทางคีย์ API ของ OpenAI โดยตรงและเส้นทางการสมัครใช้งาน
Codex เมื่อบัญชีของคุณเปิดให้ใช้ ใช้ `openai/gpt-5.5` กับ harness app-server
ของ Codex สำหรับรันไทม์ Codex แบบเนทีฟ, ใช้ `openai-codex/gpt-5.5` สำหรับ PI OAuth หรือ
ใช้ `openai/gpt-5.5` โดยไม่มีการแทนที่รันไทม์ Codex สำหรับทราฟฟิกคีย์ API โดยตรง

การอ้างอิงดั้งเดิม `codex/gpt-*` ยังคงยอมรับเป็น alias เพื่อความเข้ากันได้ การย้ายข้อมูล
ความเข้ากันได้ของ doctor จะเขียนการอ้างอิงรันไทม์หลักดั้งเดิมใหม่เป็นการอ้างอิงโมเดล
แบบ canonical และบันทึกนโยบายรันไทม์แยกต่างหาก ขณะที่การอ้างอิงดั้งเดิมที่ใช้เฉพาะ fallback
จะคงเดิม เพราะรันไทม์ถูกกำหนดค่าสำหรับคอนเทนเนอร์เอเจนต์ทั้งหมด การตั้งค่า PI Codex OAuth
ใหม่ควรใช้ `openai-codex/gpt-*`; การตั้งค่า harness app-server แบบเนทีฟใหม่
ควรใช้ `openai/gpt-*` พร้อม `agentRuntime.id: "codex"`

`agents.defaults.imageModel` ใช้การแบ่ง prefix แบบเดียวกัน ใช้
`openai-codex/gpt-*` เมื่อการทำความเข้าใจภาพควรทำงานผ่านเส้นทางผู้ให้บริการ
OpenAI Codex OAuth ใช้ `codex/gpt-*` เมื่อการทำความเข้าใจภาพควรทำงาน
ผ่านรอบ app-server ของ Codex แบบจำกัด โมเดล app-server ของ Codex ต้อง
ประกาศการรองรับอินพุตภาพ; โมเดล Codex แบบข้อความเท่านั้นจะล้มเหลวก่อนที่รอบสื่อ
จะเริ่ม

ใช้ `/status` เพื่อยืนยัน harness ที่มีผลสำหรับเซสชันปัจจุบัน หากการเลือก
ผิดคาด ให้เปิดใช้การบันทึกดีบักสำหรับระบบย่อย `agents/harness` และตรวจสอบเรคคอร์ดแบบมีโครงสร้าง
`agent harness selected` ของ gateway เรคคอร์ดนี้มี id ของ harness ที่เลือก, เหตุผลการเลือก,
นโยบายรันไทม์/fallback และในโหมด `auto` ผลลัพธ์การรองรับของผู้สมัคร Plugin แต่ละรายการ

### คำเตือนของ doctor หมายถึงอะไร

`openclaw doctor` จะแจ้งเตือนเมื่อทั้งหมดนี้เป็นจริง:

- Plugin `codex` ที่มาพร้อมชุดติดตั้งเปิดใช้หรืออนุญาตไว้
- โมเดลหลักของเอเจนต์เป็น `openai-codex/*`
- รันไทม์ที่มีผลของเอเจนต์นั้นไม่ใช่ `codex`

คำเตือนนั้นมีอยู่เพราะผู้ใช้มักคาดว่า "เปิดใช้ Plugin Codex" จะหมายถึง
"รันไทม์ app-server ของ Codex แบบเนทีฟ" OpenClaw ไม่สรุปข้ามไปแบบนั้น คำเตือน
หมายถึง:

- **ไม่ต้องเปลี่ยนแปลงอะไร** หากคุณตั้งใจใช้ ChatGPT/Codex OAuth ผ่าน PI
- เปลี่ยนโมเดลเป็น `openai/<model>` และตั้งค่า
  `agentRuntime.id: "codex"` หากคุณตั้งใจใช้การทำงานผ่าน app-server
  แบบเนทีฟ
- เซสชันที่มีอยู่ยังต้องใช้ `/new` หรือ `/reset` หลังจากเปลี่ยนรันไทม์
  เพราะการปักหมุดรันไทม์ของเซสชันมีความคงอยู่

การเลือก harness ไม่ใช่การควบคุมเซสชันแบบสด เมื่อรอบแบบฝังทำงาน
OpenClaw จะบันทึก id ของ harness ที่เลือกไว้ในเซสชันนั้นและใช้ต่อไปสำหรับ
รอบภายหลังใน id เซสชันเดียวกัน เปลี่ยนการตั้งค่า `agentRuntime` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อคุณต้องการให้เซสชันในอนาคตใช้ harness อื่น;
ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับการสนทนาที่มีอยู่
ระหว่าง PI และ Codex วิธีนี้หลีกเลี่ยงการเล่นทรานสคริปต์เดียวกันซ้ำผ่าน
ระบบเซสชันเนทีฟสองระบบที่เข้ากันไม่ได้

เซสชันดั้งเดิมที่สร้างก่อนมีการปักหมุด harness จะถือว่าปักหมุดกับ PI เมื่อ
มีประวัติทรานสคริปต์แล้ว ใช้ `/new` หรือ `/reset` เพื่อเลือกให้การสนทนานั้น
เข้าสู่ Codex หลังจากเปลี่ยนการตั้งค่า

`/status` แสดงรันไทม์โมเดลที่มีผลอยู่ ฮาร์เนส Pi เริ่มต้นจะแสดงเป็น
`Runtime: OpenClaw Pi Default` และฮาร์เนส app-server ของ Codex จะแสดงเป็น
`Runtime: OpenAI Codex`

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` แบบรวมมาให้พร้อมใช้งาน
- Codex app-server `0.125.0` หรือใหม่กว่า โดยค่าเริ่มต้น Plugin ที่รวมมาจะจัดการไบนารี
  Codex app-server ที่เข้ากันได้ ดังนั้นคำสั่ง `codex` ภายในเครื่องบน `PATH` จะไม่ส่งผลต่อ
  การเริ่มต้นฮาร์เนสตามปกติ
- มีการยืนยันตัวตน Codex ให้กระบวนการ app-server หรือให้บริดจ์การยืนยันตัวตน Codex
  ของ OpenClaw การเริ่ม app-server แบบภายในเครื่องใช้โฮม Codex ที่ OpenClaw จัดการให้สำหรับแต่ละ
  เอเจนต์และ `HOME` ลูกที่แยกขาดจากกัน ดังนั้นโดยค่าเริ่มต้นจึงไม่อ่านบัญชี
  `~/.codex` ส่วนตัว Skills, plugins, config, สถานะเธรด หรือ
  `$HOME/.agents/skills` ดั้งเดิมของคุณ

Plugin จะบล็อกการจับมือกับ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน ซึ่งช่วยให้
OpenClaw อยู่บนพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้ว

สำหรับการทดสอบ smoke แบบ live และ Docker โดยปกติการยืนยันตัวตนจะมาจากบัญชี Codex CLI
หรือโปรไฟล์การยืนยันตัวตน `openai-codex` ของ OpenClaw การเริ่ม app-server แบบ stdio ภายในเครื่อง
ยังสามารถถอยกลับไปใช้ `CODEX_API_KEY` / `OPENAI_API_KEY` ได้เมื่อไม่มีบัญชีอยู่

## ไฟล์บูตสแตรปของพื้นที่ทำงาน

Codex จัดการ `AGENTS.md` เองผ่านการค้นพบเอกสารโปรเจ็กต์แบบดั้งเดิม OpenClaw
ไม่เขียนไฟล์เอกสารโปรเจ็กต์ Codex สังเคราะห์หรือพึ่งพาชื่อไฟล์สำรองของ Codex
สำหรับไฟล์ persona เพราะกลไกสำรองของ Codex ใช้เฉพาะเมื่อ
`AGENTS.md` หายไปเท่านั้น

เพื่อให้พื้นที่ทำงาน OpenClaw มีความสอดคล้องกัน ฮาร์เนส Codex จะ resolve ไฟล์บูตสแตรปอื่นๆ
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` และ `MEMORY.md` เมื่อมีอยู่) แล้วส่งต่อผ่านคำสั่ง config ของ Codex
บน `thread/start` และ `thread/resume` ซึ่งช่วยให้บริบท persona/profile ของพื้นที่ทำงานอย่าง
`SOUL.md` และไฟล์ที่เกี่ยวข้องยังมองเห็นได้โดยไม่ต้องทำสำเนา `AGENTS.md`

## เพิ่ม Codex ควบคู่กับโมเดลอื่น

อย่าตั้ง `agentRuntime.id: "codex"` แบบส่วนกลาง หากเอเจนต์เดียวกันควรสลับได้อย่างอิสระ
ระหว่าง Codex กับโมเดล provider ที่ไม่ใช่ Codex รันไทม์ที่บังคับใช้จะมีผลกับทุก
เทิร์นแบบฝังสำหรับเอเจนต์หรือเซสชันนั้น หากคุณเลือกโมเดล Anthropic ขณะที่
บังคับรันไทม์นั้นอยู่ OpenClaw จะยังพยายามใช้ฮาร์เนส Codex และปิดแบบล้มเหลว
แทนที่จะ route เทิร์นนั้นผ่าน Pi อย่างเงียบๆ

ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้แทน:

- วาง Codex ไว้บนเอเจนต์เฉพาะด้วย `agentRuntime.id: "codex"`
- เก็บเอเจนต์เริ่มต้นไว้ที่ `agentRuntime.id: "auto"` และใช้ Pi fallback สำหรับการใช้งาน provider แบบผสมตามปกติ
- ใช้ refs แบบ legacy `codex/*` เพื่อความเข้ากันได้เท่านั้น config ใหม่ควรเลือกใช้
  `openai/*` พร้อมนโยบายรันไทม์ Codex ที่ระบุชัดเจน

ตัวอย่างเช่น รูปแบบนี้จะเก็บเอเจนต์เริ่มต้นไว้บนการเลือกอัตโนมัติตามปกติ และ
เพิ่มเอเจนต์ Codex แยกต่างหาก:

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
        fallback: "pi",
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

เมื่อใช้รูปแบบนี้:

- เอเจนต์ `main` เริ่มต้นใช้เส้นทาง provider ตามปกติและ Pi compatibility fallback
- เอเจนต์ `codex` ใช้ฮาร์เนส Codex app-server
- หาก Codex หายไปหรือไม่รองรับสำหรับเอเจนต์ `codex` เทิร์นจะล้มเหลว
  แทนที่จะใช้ Pi อย่างเงียบๆ

## การ route คำสั่งของเอเจนต์

เอเจนต์ควร route คำขอของผู้ใช้ตามเจตนา ไม่ใช่ตามคำว่า "Codex" เพียงอย่างเดียว:

| ผู้ใช้ขอ...                                           | เอเจนต์ควรใช้...                                  |
| ------------------------------------------------------ | ------------------------------------------------ |
| "ผูกแชตนี้กับ Codex"                                  | `/codex bind`                                    |
| "กลับมาใช้เธรด Codex `<id>` ที่นี่"                    | `/codex resume <id>`                             |
| "แสดงเธรด Codex"                                      | `/codex threads`                                 |
| "ส่งรายงาน support สำหรับการรัน Codex ที่ผิดพลาด"      | `/diagnostics [note]`                            |
| "ส่ง feedback ของ Codex เฉพาะสำหรับเธรดที่แนบนี้เท่านั้น" | `/codex diagnostics [note]`                      |
| "ใช้การสมัครสมาชิก ChatGPT/Codex ของฉันกับรันไทม์ Codex" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "ใช้การสมัครสมาชิก ChatGPT/Codex ของฉันผ่าน Pi"        | `openai-codex/*` model refs                      |
| "รัน Codex ผ่าน ACP/acpx"                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "เริ่ม Claude Code/Gemini/OpenCode/Cursor ในเธรด"      | ACP/acpx ไม่ใช่ `/codex` และไม่ใช่ sub-agents แบบดั้งเดิม |

OpenClaw จะประกาศคำแนะนำการ spawn ของ ACP ให้เอเจนต์เฉพาะเมื่อ ACP เปิดใช้งานอยู่
dispatch ได้ และมี runtime backend ที่โหลดไว้รองรับ หาก ACP ไม่พร้อมใช้งาน
system prompt และ Skills ของ Plugin ไม่ควรสอนเอเจนต์เกี่ยวกับการ route ของ ACP

## การดีพลอยแบบ Codex เท่านั้น

บังคับใช้ฮาร์เนส Codex เมื่อคุณต้องพิสูจน์ว่าทุกเทิร์นของเอเจนต์แบบฝัง
ใช้ Codex รันไทม์ Plugin ที่ระบุชัดเจนจะมีค่าเริ่มต้นเป็นไม่มี Pi fallback ดังนั้น
`fallback: "none"` จึงเป็นค่าเลือกได้ แต่มักมีประโยชน์ในฐานะเอกสารประกอบ:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

การ override ด้วย environment:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Plugin Codex ปิดใช้งานอยู่
app-server เก่าเกินไป หรือ app-server เริ่มไม่ได้ ตั้งค่า
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` เฉพาะเมื่อคุณตั้งใจให้ Pi จัดการ
การเลือกฮาร์เนสที่หายไป

## Codex ต่อเอเจนต์

คุณสามารถทำให้เอเจนต์หนึ่งเป็น Codex-only ได้ ขณะที่เอเจนต์เริ่มต้นยังคงใช้
การเลือกอัตโนมัติตามปกติ:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

ใช้คำสั่งเซสชันตามปกติเพื่อสลับเอเจนต์และโมเดล `/new` จะสร้าง
เซสชัน OpenClaw ใหม่ และฮาร์เนส Codex จะสร้างหรือกลับมาใช้เธรด sidecar app-server
ตามต้องการ `/reset` จะล้างการผูกเซสชัน OpenClaw สำหรับเธรดนั้น
และให้เทิร์นถัดไป resolve ฮาร์เนสจาก config ปัจจุบันอีกครั้ง

## การค้นหาโมเดล

โดยค่าเริ่มต้น Plugin Codex จะถาม app-server เพื่อดูโมเดลที่พร้อมใช้งาน หาก
การค้นหาล้มเหลวหรือหมดเวลา จะใช้แคตตาล็อก fallback ที่รวมมาให้สำหรับ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

คุณสามารถปรับแต่งการค้นหาได้ที่ `plugins.entries.codex.config.discovery`:

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

ปิดการค้นหาเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการ probe Codex และยึดตาม
แคตตาล็อก fallback:

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

## การเชื่อมต่อและนโยบายของ app-server

โดยค่าเริ่มต้น Plugin จะเริ่มไบนารี Codex ที่ OpenClaw จัดการไว้ภายในเครื่องด้วย:

```bash
codex app-server --listen stdio://
```

ไบนารีที่จัดการนี้ถูกจัดส่งมาพร้อมแพ็กเกจ Plugin `codex` ซึ่งทำให้เวอร์ชัน
app-server ผูกกับ Plugin ที่รวมมา แทนที่จะขึ้นกับ Codex CLI แยกต่างหาก
ที่บังเอิญติดตั้งอยู่ในเครื่อง ตั้งค่า `appServer.command` เฉพาะเมื่อ
คุณตั้งใจรัน executable อื่น

โดยค่าเริ่มต้น OpenClaw จะเริ่มเซสชันฮาร์เนส Codex ภายในเครื่องในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือท่าทีของผู้ปฏิบัติการภายในเครื่องที่เชื่อถือได้ซึ่งใช้
สำหรับ Heartbeat อัตโนมัติ: Codex สามารถใช้เครื่องมือ shell และ network ได้โดยไม่
หยุดที่ prompt การอนุมัติแบบดั้งเดิมซึ่งไม่มีใครอยู่ตอบ

หากต้องการ opt in ให้ใช้การอนุมัติที่ Codex guardian ตรวจทาน ให้ตั้งค่า `appServer.mode:
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

โหมด Guardian ใช้เส้นทางการอนุมัติ auto-review แบบดั้งเดิมของ Codex เมื่อ Codex ขอ
ออกจาก sandbox เขียนนอกพื้นที่ทำงาน หรือเพิ่มสิทธิ์อย่างการเข้าถึง network
Codex จะ route คำขออนุมัตินั้นไปยังผู้ตรวจทานแบบดั้งเดิมแทน prompt ของมนุษย์
ผู้ตรวจทานจะใช้กรอบความเสี่ยงของ Codex และอนุมัติหรือปฏิเสธ
คำขอเฉพาะนั้น ใช้ Guardian เมื่อคุณต้องการ guardrails มากกว่าโหมด YOLO
แต่ยังต้องการให้เอเจนต์ที่ไม่มีคนเฝ้าทำงานต่อไปได้

preset `guardian` จะขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"`
ฟิลด์นโยบายรายตัวยังคง override `mode` ได้ ดังนั้นการดีพลอยขั้นสูงสามารถผสม
preset กับตัวเลือกที่ระบุชัดเจนได้ ค่า reviewer แบบเก่า `guardian_subagent`
ยังยอมรับเป็น alias เพื่อความเข้ากันได้ แต่ config ใหม่ควรใช้
`auto_review`

สำหรับ app-server ที่รันอยู่แล้ว ให้ใช้ WebSocket transport:

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

การเริ่ม app-server แบบ stdio จะสืบทอด process environment ของ OpenClaw โดยค่าเริ่มต้น
แต่ OpenClaw เป็นเจ้าของบริดจ์บัญชี Codex app-server และตั้งทั้ง
`CODEX_HOME` และ `HOME` เป็นไดเรกทอรีต่อเอเจนต์ภายใต้สถานะ OpenClaw
ของเอเจนต์นั้น ตัวโหลด skill ของ Codex เองอ่าน `$CODEX_HOME/skills` และ
`$HOME/.agents/skills` ดังนั้นค่าทั้งสองจึงถูกแยกสำหรับการเริ่ม app-server
ภายในเครื่อง ซึ่งทำให้ skills, plugins, config, accounts และสถานะเธรดแบบ Codex-native
ถูกจำกัดอยู่กับเอเจนต์ OpenClaw แทนที่จะรั่วเข้ามาจากโฮม Codex CLI ส่วนตัว
ของผู้ปฏิบัติการ

Plugins ของ OpenClaw และ snapshots ของ Skills ของ OpenClaw ยังคงไหลผ่าน
plugin registry และ skill loader ของ OpenClaw เอง สินทรัพย์ Codex CLI ส่วนตัวจะไม่ไหลผ่าน
หากคุณมี Skills หรือ plugins ของ Codex CLI ที่มีประโยชน์และควรกลายเป็นส่วนหนึ่งของเอเจนต์ OpenClaw
ให้ทำ inventory อย่างชัดเจน:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

provider การย้าย Codex จะคัดลอก Skills เข้าไปในพื้นที่ทำงานของเอเจนต์ OpenClaw ปัจจุบัน
plugins, hooks และไฟล์ config แบบดั้งเดิมของ Codex จะถูกรายงานหรือเก็บถาวร
เพื่อให้ตรวจทานด้วยตนเอง แทนที่จะเปิดใช้งานโดยอัตโนมัติ เพราะสิ่งเหล่านี้สามารถ
รันคำสั่ง เปิดเผย MCP servers หรือพก credentials ได้

การยืนยันตัวตนถูกเลือกตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน Codex ของ OpenClaw ที่ระบุชัดเจนสำหรับเอเจนต์
2. บัญชีที่มีอยู่ของ app-server ในโฮม Codex ของเอเจนต์นั้น
3. สำหรับการเริ่ม app-server แบบ stdio ภายในเครื่องเท่านั้น ใช้ `CODEX_API_KEY` แล้วตามด้วย
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server อยู่และยังต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw เห็นโปรไฟล์การยืนยันตัวตน Codex แบบการสมัครสมาชิก ChatGPT มันจะนำ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่ spawn ขึ้น
ซึ่งทำให้ API keys ระดับ Gateway ยังพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้เทิร์น native Codex app-server ถูกคิดค่าบริการผ่าน API โดยไม่ตั้งใจ
โปรไฟล์ Codex API-key ที่ระบุชัดเจนและ fallback env-key สำหรับ stdio ภายในเครื่องจะใช้การล็อกอิน
app-server แทน env ที่สืบทอดจาก child-process การเชื่อมต่อ WebSocket app-server
จะไม่ได้รับ fallback ของ Gateway env API-key ให้ใช้โปรไฟล์การยืนยันตัวตนที่ระบุชัดเจนหรือ
บัญชีของ remote app-server เอง

หากการดีพลอยต้องการการแยก environment เพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นไปยัง
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

`appServer.clearEnv` มีผลเฉพาะกับโปรเซสลูก Codex app-server ที่ถูกสร้างขึ้นเท่านั้น

เครื่องมือไดนามิกของ Codex ใช้โปรไฟล์ `native-first` เป็นค่าเริ่มต้น ในโหมดนั้น
OpenClaw จะไม่เปิดเผยเครื่องมือไดนามิกที่ซ้ำกับการดำเนินการเวิร์กสเปซแบบเนทีฟของ Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` และ
`update_plan` เครื่องมือผสานรวมของ OpenClaw เช่น การส่งข้อความ, เซสชัน, สื่อ,
cron, เบราว์เซอร์, โหนด, Gateway, `heartbeat_respond` และ `web_search` ยังคง
พร้อมใช้งาน

ฟิลด์ Plugin Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น          | ความหมาย                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | ใช้ `"openclaw-compat"` เพื่อเปิดเผยชุดเครื่องมือไดนามิกทั้งหมดของ OpenClaw ให้กับ Codex app-server |
| `codexDynamicToolsExclude` | `[]`             | ชื่อเครื่องมือไดนามิกของ OpenClaw เพิ่มเติมที่จะละเว้นจากเทิร์นของ Codex app-server               |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์               | ค่าเริ่มต้น                                  | ความหมาย                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` สร้าง Codex; `"websocket"` เชื่อมต่อกับ `url`                                                                                                                                                                             |
| `command`           | ไบนารี Codex ที่จัดการให้                     | ไฟล์ปฏิบัติการสำหรับทรานสปอร์ต stdio ปล่อยไว้ไม่ตั้งค่าเพื่อใช้ไบนารีที่จัดการให้ ตั้งค่าเฉพาะเมื่อต้องการแทนที่อย่างชัดเจน                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | อาร์กิวเมนต์สำหรับทรานสปอร์ต stdio                                                                                                                                                                                                       |
| `url`               | ไม่ได้ตั้งค่า                                    | URL ของ WebSocket app-server                                                                                                                                                                                                            |
| `authToken`         | ไม่ได้ตั้งค่า                                    | โทเคน Bearer สำหรับทรานสปอร์ต WebSocket                                                                                                                                                                                                |
| `headers`           | `{}`                                     | ส่วนหัว WebSocket เพิ่มเติม                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่จะถูกลบออกจากโปรเซส stdio app-server ที่ถูกสร้างขึ้น หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว `CODEX_HOME` และ `HOME` ถูกสงวนไว้สำหรับการแยก Codex รายเอเจนต์ของ OpenClaw บนการเปิดใช้งานแบบ local |
| `requestTimeoutMs`  | `60000`                                  | เวลาหมดเวลาสำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | พรีเซ็ตสำหรับการดำเนินการแบบ YOLO หรือแบบผ่านการตรวจทานโดย guardian                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | นโยบายอนุมัติแบบเนทีฟของ Codex ที่ส่งไปยังการเริ่ม/กลับมาทำต่อ/เทิร์นของเธรด                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | โหมด sandbox แบบเนทีฟของ Codex ที่ส่งไปยังการเริ่ม/กลับมาทำต่อของเธรด                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทานพรอมป์อนุมัติแบบเนทีฟ `guardian_subagent` ยังคงเป็นนามแฝงแบบเดิม                                                                                                                         |
| `serviceTier`       | ไม่ได้ตั้งค่า                                    | ระดับบริการ Codex app-server แบบไม่บังคับ: `"fast"`, `"flex"` หรือ `null` ค่าเดิมที่ไม่ถูกต้องจะถูกละเว้น                                                                                                                            |

การเรียกเครื่องมือไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกต่างหากจาก
`appServer.requestTimeoutMs`: คำขอ `item/tool/call` ของ Codex แต่ละรายการต้องได้รับ
คำตอบจาก OpenClaw ภายใน 30 วินาที เมื่อหมดเวลา OpenClaw จะยกเลิกสัญญาณเครื่องมือ
เมื่อรองรับ และส่งคืนคำตอบเครื่องมือไดนามิกที่ล้มเหลวให้ Codex เพื่อให้เทิร์น
ดำเนินต่อได้ แทนที่จะปล่อยให้เซสชันอยู่ในสถานะ `processing`

หลังจาก OpenClaw ตอบกลับคำขอ app-server ที่มีขอบเขตตามเทิร์นของ Codex แล้ว harness
ยังคาดว่า Codex จะจบเทิร์นแบบเนทีฟด้วย `turn/completed` ด้วย หาก app-server
เงียบไป 60 วินาทีหลังจากคำตอบนั้น OpenClaw จะพยายามขัดจังหวะเทิร์นของ Codex
บันทึกเวลาหมดเวลาเพื่อการวินิจฉัย และปล่อยเลนเซสชันของ OpenClaw เพื่อไม่ให้
ข้อความแชตต่อเนื่องถูกเข้าคิวอยู่หลังเทิร์นเนทีฟที่ค้างอยู่

การแทนที่สภาพแวดล้อมยังคงพร้อมใช้งานสำหรับการทดสอบแบบ local:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ข้ามไบนารีที่จัดการให้เมื่อ
`appServer.command` ไม่ได้ตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือใช้
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบแบบ local เฉพาะครั้ง การตั้งค่า
เป็นวิธีที่แนะนำสำหรับการปรับใช้ที่ทำซ้ำได้ เพราะทำให้พฤติกรรมของ Plugin อยู่ใน
ไฟล์ที่ผ่านการตรวจทานเดียวกันกับการตั้งค่า Codex harness ส่วนที่เหลือ

## การใช้งานคอมพิวเตอร์

การใช้งานคอมพิวเตอร์ครอบคลุมอยู่ในคู่มือการตั้งค่าของตัวเอง:
[การใช้งานคอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use)

สรุปสั้น ๆ: OpenClaw ไม่ได้รวมแอปควบคุมเดสก์ท็อปไว้ในตัวหรือดำเนินการเดสก์ท็อปเอง
OpenClaw เตรียม Codex app-server ตรวจสอบว่าเซิร์ฟเวอร์ MCP `computer-use`
พร้อมใช้งาน จากนั้นให้ Codex จัดการการเรียกเครื่องมือ MCP แบบเนทีฟระหว่างเทิร์น
โหมด Codex

สำหรับการเข้าถึงไดรเวอร์ TryCua โดยตรงนอกโฟลว์ marketplace ของ Codex ให้ลงทะเบียน
`cua-driver mcp` ด้วย `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`
ดู [การใช้งานคอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use) สำหรับความแตกต่าง
ระหว่างการใช้งานคอมพิวเตอร์ที่ Codex เป็นเจ้าของกับการลงทะเบียน MCP โดยตรง

การตั้งค่าขั้นต่ำ:

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
        fallback: "none",
      },
    },
  },
}
```

สามารถตรวจสอบหรือติดตั้งการตั้งค่าได้จากพื้นผิวคำสั่ง:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use ใช้ได้เฉพาะบน macOS และอาจต้องใช้สิทธิ์ OS ในเครื่องก่อนที่
เซิร์ฟเวอร์ Codex MCP จะควบคุมแอปได้ หาก `computerUse.enabled` เป็น true และเซิร์ฟเวอร์ MCP
ไม่พร้อมใช้งาน เทิร์นในโหมด Codex จะล้มเหลวก่อนที่เธรดจะเริ่ม แทนที่จะทำงานต่อแบบเงียบๆ
โดยไม่มีเครื่องมือ Computer Use แบบเนทีฟ ดู
[Codex Computer Use](/th/plugins/codex-computer-use) สำหรับตัวเลือก Marketplace,
ข้อจำกัดของแค็ตตาล็อกระยะไกล เหตุผลของสถานะ และการแก้ไขปัญหา

เมื่อ `computerUse.autoInstall` เป็น true, OpenClaw สามารถลงทะเบียน Marketplace
Codex Desktop มาตรฐานที่บันเดิลมาจาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` หาก Codex
ยังไม่พบ Marketplace ในเครื่อง ใช้ `/new` หรือ `/reset` หลังจาก
เปลี่ยนการกำหนดค่ารันไทม์หรือ Computer Use เพื่อให้เซสชันเดิมไม่คงการผูกเธรด
PI หรือ Codex แบบเก่าไว้

## สูตรทั่วไป

Codex ในเครื่องพร้อมทรานสปอร์ต stdio เริ่มต้น:

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

การตรวจสอบฮาร์เนสเฉพาะ Codex:

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

การอนุมัติ Codex ที่ตรวจทานโดย Guardian:

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

app-server ระยะไกลพร้อมเฮดเดอร์ที่ระบุอย่างชัดเจน:

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

การสลับโมเดลยังคงอยู่ภายใต้การควบคุมของ OpenClaw เมื่อเซสชัน OpenClaw ถูกแนบ
กับเธรด Codex ที่มีอยู่ เทิร์นถัดไปจะส่งโมเดล OpenAI ที่เลือกอยู่ในปัจจุบัน
ผู้ให้บริการ นโยบายการอนุมัติ แซนด์บ็อกซ์ และระดับบริการไปยัง
app-server อีกครั้ง การสลับจาก `openai/gpt-5.5` เป็น `openai/gpt-5.2` จะคงการผูก
เธรดไว้ แต่ขอให้ Codex ดำเนินการต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

Plugin ที่รวมมาในชุดจะลงทะเบียน `/codex` เป็นคำสั่ง slash ที่ได้รับอนุญาต คำสั่งนี้เป็น
แบบทั่วไปและทำงานได้กับทุกช่องทางที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบทั่วไป:

- `/codex status` แสดงการเชื่อมต่อ app-server แบบสด, โมเดล, บัญชี, ขีดจำกัดอัตรา, เซิร์ฟเวอร์ MCP และ Skills
- `/codex models` แสดงรายการโมเดล Codex app-server แบบสด
- `/codex threads [filter]` แสดงรายการเธรด Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันเข้ากับเธรด Codex ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server ทำ Compaction เธรดที่แนบอยู่
- `/codex review` เริ่มการรีวิวเนทีฟของ Codex สำหรับเธรดที่แนบอยู่
- `/codex diagnostics [note]` ขออนุมัติก่อนส่งข้อเสนอแนะการวินิจฉัยของ Codex สำหรับเธรดที่แนบอยู่
- `/codex computer-use status` ตรวจสอบ Plugin Computer Use และเซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้
- `/codex computer-use install` ติดตั้ง Plugin Computer Use ที่กำหนดค่าไว้และโหลดเซิร์ฟเวอร์ MCP ใหม่
- `/codex account` แสดงสถานะบัญชีและขีดจำกัดอัตรา
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของ Codex app-server
- `/codex skills` แสดงรายการ Skills ของ Codex app-server

### เวิร์กโฟลว์การดีบักทั่วไป

เมื่อ agent ที่ใช้ Codex เป็นฐานทำสิ่งที่ไม่คาดคิดใน Telegram, Discord, Slack,
หรือช่องทางอื่น ให้เริ่มจากบทสนทนาที่เกิดปัญหา:

1. เรียกใช้ `/diagnostics bad tool choice after image upload` หรือบันทึกสั้นอื่น
   ที่อธิบายสิ่งที่คุณเห็น
2. อนุมัติคำขอการวินิจฉัยหนึ่งครั้ง การอนุมัติจะสร้างไฟล์ zip การวินิจฉัยของ Gateway
   ในเครื่อง และเนื่องจากเซสชันกำลังใช้ฮาร์เนส Codex จึงยังส่งชุดข้อเสนอแนะ Codex
   ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
3. คัดลอกคำตอบการวินิจฉัยที่เสร็จแล้วไปยังรายงานบั๊กหรือเธรดสนับสนุน
   ซึ่งมีพาธชุดข้อมูลในเครื่อง, สรุปความเป็นส่วนตัว, รหัสเซสชัน OpenClaw,
   รหัสเธรด Codex และบรรทัด `Inspect locally` สำหรับแต่ละเธรด Codex
4. หากคุณต้องการดีบักการรันด้วยตนเอง ให้เรียกใช้คำสั่ง `Inspect locally`
   ที่พิมพ์ออกมาในเทอร์มินัล คำสั่งจะมีลักษณะคล้าย `codex resume <thread-id>` และเปิด
   เธรด Codex แบบเนทีฟเพื่อให้คุณตรวจสอบบทสนทนา, ดำเนินการต่อในเครื่อง,
   หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือแผนนั้น

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลดข้อเสนอแนะ Codex
สำหรับเธรดที่แนบอยู่ในปัจจุบันโดยเฉพาะ โดยไม่ต้องมีชุดการวินิจฉัย Gateway
ของ OpenClaw แบบเต็ม สำหรับรายงานสนับสนุนส่วนใหญ่ `/diagnostics [note]` คือ
จุดเริ่มต้นที่ดีกว่า เพราะผูกสถานะ Gateway ในเครื่องและรหัสเธรด Codex
เข้าด้วยกันในคำตอบเดียว ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics)
สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรมแชตกลุ่มแบบเต็ม

แกนหลักของ OpenClaw ยังเปิดเผย `/diagnostics [note]` เฉพาะเจ้าของเป็นคำสั่ง
การวินิจฉัย Gateway ทั่วไปด้วย พรอมต์อนุมัติจะแสดงคำนำเกี่ยวกับข้อมูลที่ละเอียดอ่อน,
ลิงก์ไปยัง [Diagnostics Export](/th/gateway/diagnostics) และร้องขอ
`openclaw gateway diagnostics export --json` ผ่านการอนุมัติการรันอย่างชัดเจน
ทุกครั้ง อย่าอนุมัติการวินิจฉัยด้วยกฎอนุญาตทั้งหมด หลังอนุมัติแล้ว
OpenClaw จะส่งรายงานที่นำไปวางได้ พร้อมพาธชุดข้อมูลในเครื่องและสรุป manifest
เมื่อเซสชัน OpenClaw ที่ใช้งานอยู่กำลังใช้ฮาร์เนส Codex การอนุมัติเดียวกันนั้น
ยังอนุญาตให้ส่งชุดข้อเสนอแนะ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
พรอมต์อนุมัติจะแจ้งว่าจะส่งข้อเสนอแนะ Codex แต่จะไม่แสดงรหัสเซสชันหรือรหัสเธรด
Codex ก่อนอนุมัติ

หากเจ้าของเรียกใช้ `/diagnostics` ในแชตกลุ่ม OpenClaw จะรักษาความสะอาดของ
ช่องทางที่แชร์: กลุ่มจะได้รับเพียงประกาศสั้น ๆ ขณะที่คำนำการวินิจฉัย,
พรอมต์อนุมัติ และรหัสเซสชัน/เธรด Codex จะถูกส่งถึงเจ้าของผ่านเส้นทางอนุมัติส่วนตัว
หากไม่มีเส้นทางเจ้าของแบบส่วนตัว OpenClaw จะปฏิเสธคำขอจากกลุ่มและขอให้เจ้าของ
เรียกใช้จาก DM

การอัปโหลด Codex ที่อนุมัติแล้วจะเรียก Codex app-server `feedback/upload` และขอให้
app-server รวมบันทึกสำหรับแต่ละเธรดที่ระบุและเธรดย่อย Codex ที่ถูกสร้างขึ้นเมื่อมี
การอัปโหลดจะผ่านเส้นทางข้อเสนอแนะปกติของ Codex ไปยังเซิร์ฟเวอร์ OpenAI
หากข้อเสนอแนะ Codex ถูกปิดใช้งานใน app-server นั้น คำสั่งจะส่งคืนข้อผิดพลาด
ของ app-server คำตอบการวินิจฉัยที่เสร็จแล้วจะแสดงรายการช่องทาง,
รหัสเซสชัน OpenClaw, รหัสเธรด Codex และคำสั่ง `codex resume <thread-id>`
ในเครื่องสำหรับเธรดที่ถูกส่ง หากคุณปฏิเสธหรือเพิกเฉยต่อการอนุมัติ OpenClaw
จะไม่พิมพ์รหัส Codex เหล่านั้น การอัปโหลดนี้ไม่ได้แทนที่การส่งออกการวินิจฉัย
Gateway ในเครื่อง

`/codex resume` เขียนไฟล์การผูก sidecar เดียวกับที่ฮาร์เนสใช้สำหรับเทิร์นปกติ
ในข้อความถัดไป OpenClaw จะกลับไปทำงานต่อในเธรด Codex นั้น, ส่งโมเดล OpenClaw
ที่เลือกอยู่ในปัจจุบันเข้าไปใน app-server และเปิดใช้ประวัติแบบขยายต่อไป

### ตรวจสอบเธรด Codex จาก CLI

วิธีที่เร็วที่สุดในการเข้าใจการรัน Codex ที่ผิดพลาดมักเป็นการเปิดเธรด Codex
แบบเนทีฟโดยตรง:

```sh
codex resume <thread-id>
```

ใช้สิ่งนี้เมื่อคุณสังเกตเห็นบั๊กในบทสนทนาบนช่องทางและต้องการตรวจสอบเซสชัน Codex
ที่มีปัญหา, ดำเนินการต่อในเครื่อง หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือ
หรือแนวคิดการให้เหตุผลนั้น เส้นทางที่ง่ายที่สุดมักเป็นการเรียกใช้
`/diagnostics [note]` ก่อน: หลังจากคุณอนุมัติ รายงานที่เสร็จแล้วจะแสดงรายการ
แต่ละเธรด Codex และพิมพ์คำสั่ง `Inspect locally` เช่น
`codex resume <thread-id>` คุณสามารถคัดลอกคำสั่งนั้นเข้าเทอร์มินัลได้โดยตรง

คุณยังสามารถรับรหัสเธรดจาก `/codex binding` สำหรับแชตปัจจุบัน หรือ
`/codex threads [filter]` สำหรับเธรด Codex app-server ล่าสุด แล้วเรียกใช้คำสั่ง
`codex resume` เดียวกันในเชลล์ของคุณ

พื้นผิวคำสั่งต้องใช้ Codex app-server `0.125.0` หรือใหม่กว่า วิธีควบคุมแต่ละรายการ
จะถูกรายงานเป็น `unsupported by this Codex app-server` หาก app-server ในอนาคต
หรือแบบกำหนดเองไม่ได้เปิดเผยเมธอด JSON-RPC นั้น

## ขอบเขตของ hook

ฮาร์เนส Codex มีเลเยอร์ hook สามชั้น:

| เลเยอร์                                | เจ้าของ                  | วัตถุประสงค์                                                         |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| hook ของ Plugin OpenClaw              | OpenClaw                 | ความเข้ากันได้ของผลิตภัณฑ์/Plugin ระหว่างฮาร์เนส PI และ Codex      |
| มิดเดิลแวร์ส่วนขยาย Codex app-server | Plugin ที่ bundled มากับ OpenClaw | พฤติกรรมอะแดปเตอร์ต่อเทิร์นรอบเครื่องมือไดนามิกของ OpenClaw |
| hook เนทีฟของ Codex                   | Codex                    | วงจรชีวิต Codex ระดับต่ำและนโยบายเครื่องมือเนทีฟจากการกำหนดค่า Codex |

OpenClaw ไม่ใช้ไฟล์ `hooks.json` ระดับโปรเจกต์หรือระดับโกลบอลของ Codex เพื่อกำหนดเส้นทาง
พฤติกรรม Plugin OpenClaw สำหรับบริดจ์เครื่องมือเนทีฟและสิทธิ์ที่รองรับ
OpenClaw จะฉีดการกำหนดค่า Codex ต่อเธรดสำหรับ `PreToolUse`, `PostToolUse`,
`PermissionRequest` และ `Stop` hook อื่นของ Codex เช่น `SessionStart` และ
`UserPromptSubmit` ยังคงเป็นการควบคุมระดับ Codex; ไม่ได้ถูกเปิดเผยเป็น hook
ของ Plugin OpenClaw ในสัญญา v1

สำหรับเครื่องมือไดนามิกของ OpenClaw, OpenClaw จะรันเครื่องมือหลังจาก Codex ขอให้เรียกใช้
ดังนั้น OpenClaw จึงยิงพฤติกรรม Plugin และมิดเดิลแวร์ที่ตนเป็นเจ้าของในอะแดปเตอร์ฮาร์เนส
สำหรับเครื่องมือเนทีฟของ Codex, Codex เป็นเจ้าของระเบียนเครื่องมือที่เป็นมาตรฐาน
OpenClaw สามารถสะท้อนเหตุการณ์บางรายการได้ แต่ไม่สามารถเขียนเธรด Codex แบบเนทีฟใหม่
เว้นแต่ Codex จะเปิดเผยการดำเนินการนั้นผ่าน app-server หรือ callback ของ hook เนทีฟ

การฉายภาพ Compaction และวงจรชีวิต LLM มาจากการแจ้งเตือนของ Codex app-server
และสถานะอะแดปเตอร์ OpenClaw ไม่ใช่คำสั่ง hook เนทีฟของ Codex
เหตุการณ์ `before_compaction`, `after_compaction`, `llm_input` และ
`llm_output` ของ OpenClaw เป็นการสังเกตระดับอะแดปเตอร์ ไม่ใช่การจับข้อมูลแบบ
ไบต์ต่อไบต์ของคำขอภายในหรือ payload Compaction ของ Codex

การแจ้งเตือน app-server `hook/started` และ `hook/completed` เนทีฟของ Codex
ถูกฉายเป็นเหตุการณ์ agent `codex_app_server.hook` สำหรับ trajectory และการดีบัก
การแจ้งเตือนเหล่านี้ไม่เรียก hook ของ Plugin OpenClaw

## สัญญาการรองรับ V1

โหมด Codex ไม่ใช่ PI ที่มีการเรียกโมเดลคนละแบบอยู่ข้างใต้ Codex เป็นเจ้าของ
ลูปโมเดลเนทีฟมากกว่า และ OpenClaw ปรับพื้นผิว Plugin และเซสชันของตนรอบขอบเขตนั้น

รองรับใน runtime Codex v1:

| พื้นผิว                                       | การรองรับ                               | เหตุผล                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ลูปโมเดล OpenAI ผ่าน Codex                   | รองรับ                                  | Codex app-server เป็นเจ้าของเทิร์น OpenAI, การกลับไปทำงานต่อของเธรดเนทีฟ และการดำเนินเครื่องมือเนทีฟต่อ                                                                                                            |
| การกำหนดเส้นทางและการส่งมอบช่องทาง OpenClaw | รองรับ                                  | Telegram, Discord, Slack, WhatsApp, iMessage และช่องทางอื่นยังคงอยู่นอก runtime ของโมเดล                                                                                                      |
| เครื่องมือไดนามิก OpenClaw                   | รองรับ                                  | Codex ขอให้ OpenClaw รันเครื่องมือเหล่านี้ ดังนั้น OpenClaw จึงยังอยู่ในเส้นทางการรัน                                                                                                                  |
| Plugin พรอมต์และบริบท                        | รองรับ                                  | OpenClaw สร้างการซ้อนทับพรอมต์และฉายบริบทเข้าไปในเทิร์น Codex ก่อนเริ่มหรือกลับไปทำงานต่อในเธรด                                                                                      |
| วงจรชีวิตของเอนจินบริบท                      | รองรับ                                  | การประกอบ, การนำเข้าหรือการบำรุงรักษาหลังเทิร์น และการประสานงาน Compaction ของเอนจินบริบททำงานสำหรับเทิร์น Codex                                                                                           |
| hook ของเครื่องมือไดนามิก                    | รองรับ                                  | `before_tool_call`, `after_tool_call` และมิดเดิลแวร์ผลลัพธ์เครื่องมือทำงานรอบเครื่องมือไดนามิกที่ OpenClaw เป็นเจ้าของ                                                                                            |
| hook วงจรชีวิต                               | รองรับในฐานะการสังเกตของอะแดปเตอร์     | `llm_input`, `llm_output`, `agent_end`, `before_compaction` และ `after_compaction` จะถูกยิงด้วย payload โหมด Codex ที่ตรงไปตรงมา                                                                             |
| ประตูแก้ไขคำตอบสุดท้าย                       | รองรับผ่านรีเลย์ hook เนทีฟ             | Codex `Stop` ถูกรีเลย์ไปยัง `before_agent_finalize`; `revise` ขอให้ Codex ทำโมเดลพาสอีกครั้งก่อนการสรุปผล                                                                                  |
| การบล็อกหรือสังเกต shell, patch และ MCP เนทีฟ | รองรับผ่านรีเลย์ hook เนทีฟ             | Codex `PreToolUse` และ `PostToolUse` ถูกรีเลย์สำหรับพื้นผิวเครื่องมือเนทีฟที่ committed แล้ว รวมถึง payload MCP บน Codex app-server `0.125.0` หรือใหม่กว่า รองรับการบล็อก; ไม่รองรับการเขียนอาร์กิวเมนต์ใหม่ |
| นโยบายสิทธิ์เนทีฟ                            | รองรับผ่านรีเลย์ hook เนทีฟ             | Codex `PermissionRequest` สามารถถูกกำหนดเส้นทางผ่านนโยบาย OpenClaw เมื่อ runtime เปิดเผย หาก OpenClaw ไม่ส่งคืนการตัดสินใจ Codex จะดำเนินต่อผ่าน guardian ปกติหรือเส้นทางอนุมัติของผู้ใช้     |
| การจับ trajectory ของ app-server              | รองรับ                                  | OpenClaw บันทึกคำขอที่ส่งไปยัง app-server และการแจ้งเตือนจาก app-server ที่ได้รับ                                                                                                      |

ไม่รองรับใน runtime Codex v1:

| พื้นผิว                                             | ขอบเขต V1                                                                                                                                     | เส้นทางในอนาคต                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| การเปลี่ยนแปลงอาร์กิวเมนต์ของเครื่องมือแบบเนทีฟ                       | ฮุกก่อนใช้เครื่องมือแบบเนทีฟของ Codex สามารถบล็อกได้ แต่ OpenClaw ไม่เขียนอาร์กิวเมนต์เครื่องมือเนทีฟของ Codex ใหม่                                               | ต้องมีการรองรับฮุก/สคีมาของ Codex สำหรับอินพุตเครื่องมือทดแทน                            |
| ประวัติ transcript แบบเนทีฟของ Codex ที่แก้ไขได้            | Codex เป็นเจ้าของประวัติ thread เนทีฟหลัก OpenClaw เป็นเจ้าของสำเนาสะท้อนและสามารถฉาย context ในอนาคตได้ แต่ไม่ควรเปลี่ยนแปลง internals ที่ไม่รองรับ | เพิ่ม API ของ Codex app-server แบบชัดเจนหากจำเป็นต้องผ่าตัด thread เนทีฟ                    |
| `tool_result_persist` สำหรับเรคคอร์ดเครื่องมือเนทีฟของ Codex | ฮุกนั้นแปลงการเขียน transcript ที่ OpenClaw เป็นเจ้าของ ไม่ใช่เรคคอร์ดเครื่องมือเนทีฟของ Codex                                                           | อาจสะท้อนเรคคอร์ดที่แปลงแล้วได้ แต่การเขียนหลักใหม่ต้องมีการรองรับจาก Codex              |
| เมตาดาตา Compaction แบบเนทีฟที่สมบูรณ์                     | OpenClaw สังเกตการเริ่มต้นและการเสร็จสิ้นของ Compaction แต่ไม่ได้รับรายการที่คงไว้/ทิ้งที่เสถียร token delta หรือ payload สรุป            | ต้องมีอีเวนต์ Compaction ของ Codex ที่สมบูรณ์ขึ้น                                                     |
| การแทรกแซง Compaction                             | ฮุก Compaction ปัจจุบันของ OpenClaw อยู่ในระดับการแจ้งเตือนเมื่ออยู่ในโหมด Codex                                                                         | เพิ่มฮุกก่อน/หลัง Compaction ของ Codex หาก plugins ต้อง veto หรือเขียน Compaction เนทีฟใหม่ |
| การจับคำขอ model API แบบ byte-for-byte             | OpenClaw สามารถจับคำขอและการแจ้งเตือนของ app-server ได้ แต่ core ของ Codex สร้างคำขอ OpenAI API ขั้นสุดท้ายภายในเอง                      | ต้องมีอีเวนต์ tracing คำขอโมเดลของ Codex หรือ debug API                                   |

## เครื่องมือ สื่อ และ Compaction

harness ของ Codex เปลี่ยนเฉพาะตัวดำเนินการเอเจนต์แบบฝังระดับต่ำเท่านั้น

OpenClaw ยังสร้างรายการเครื่องมือและรับผลลัพธ์เครื่องมือแบบไดนามิกจาก
harness ข้อความ รูปภาพ วิดีโอ เพลง TTS การอนุมัติ และเอาต์พุตของเครื่องมือส่งข้อความ
ยังดำเนินผ่านเส้นทางส่งมอบปกติของ OpenClaw

native hook relay ตั้งใจให้เป็นแบบทั่วไป แต่สัญญาการรองรับ v1
จำกัดอยู่ที่เส้นทางเครื่องมือเนทีฟของ Codex และสิทธิ์ที่ OpenClaw ทดสอบ ใน
runtime ของ Codex ซึ่งรวมถึง payload ของ shell, patch และ MCP `PreToolUse`,
`PostToolUse` และ `PermissionRequest` อย่าสันนิษฐานว่าอีเวนต์ฮุกของ Codex
ในอนาคตทุกตัวเป็นพื้นผิว Plugin ของ OpenClaw จนกว่า runtime contract จะระบุชื่อ
ไว้

สำหรับ `PermissionRequest` OpenClaw จะคืนเฉพาะการตัดสินใจอนุญาตหรือปฏิเสธอย่างชัดเจน
เมื่อ policy ตัดสินแล้ว ผลลัพธ์แบบไม่มีการตัดสินใจไม่ใช่การอนุญาต Codex ถือว่าเป็นการไม่มี
การตัดสินใจจากฮุกและปล่อยให้ไหลต่อไปยัง guardian ของตัวเองหรือเส้นทางอนุมัติจากผู้ใช้

การขออนุมัติเครื่องมือ MCP ของ Codex จะถูกส่งผ่าน flow การอนุมัติ Plugin ของ OpenClaw
เมื่อ Codex ระบุ `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"` prompt ของ Codex `request_user_input` จะถูกส่งกลับไปยัง
แชตต้นทาง และข้อความติดตามผลถัดไปในคิวจะตอบคำขอ server เนทีฟนั้น
แทนที่จะถูกนำทางเป็น context เพิ่มเติม คำขอ elicitation ของ MCP อื่นๆ
จะยัง fail closed

การนำทางคิวของรันที่กำลังทำงานอยู่ map ไปยัง Codex app-server `turn/steer` ด้วย
ค่าเริ่มต้น `messages.queue.mode: "steer"` OpenClaw จะรวมข้อความแชตในคิว
สำหรับช่วง quiet window ที่กำหนดค่าไว้ และส่งเป็นคำขอ `turn/steer` เดียว
ตามลำดับที่มาถึง โหมดเดิม `queue` จะส่งคำขอ `turn/steer` แยกกัน การ turn
ของ Codex review และ manual compaction สามารถปฏิเสธการนำทางใน turn เดียวกันได้ ซึ่งในกรณีนั้น
OpenClaw จะใช้คิว followup เมื่อโหมดที่เลือกอนุญาต fallback ดู
[คิวการนำทาง](/th/concepts/queue-steering)

เมื่อโมเดลที่เลือกใช้ harness ของ Codex Compaction ของ thread เนทีฟจะถูก
มอบหมายให้ Codex app-server OpenClaw เก็บสำเนาสะท้อน transcript สำหรับประวัติช่องทาง
การค้นหา `/new`, `/reset` และการสลับโมเดลหรือ harness ในอนาคต
สำเนาสะท้อนประกอบด้วย prompt ของผู้ใช้ ข้อความผู้ช่วยขั้นสุดท้าย และเรคคอร์ด reasoning
หรือ plan ของ Codex แบบเบาเมื่อ app-server ส่งออกมา ในวันนี้ OpenClaw
บันทึกเฉพาะสัญญาณเริ่มต้นและเสร็จสิ้นของ Compaction แบบเนทีฟเท่านั้น ยังไม่เปิดเผย
สรุป Compaction ที่มนุษย์อ่านได้ หรือรายการที่ตรวจสอบย้อนหลังได้ว่า Codex
คง entry ใดไว้หลัง Compaction

เนื่องจาก Codex เป็นเจ้าของ thread เนทีฟหลัก `tool_result_persist` จึงยังไม่
เขียนเรคคอร์ดผลลัพธ์เครื่องมือเนทีฟของ Codex ใหม่ในปัจจุบัน มันจะใช้เฉพาะเมื่อ
OpenClaw กำลังเขียนผลลัพธ์เครื่องมือของ session transcript ที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่ต้องใช้ PI รูปภาพ วิดีโอ เพลง PDF, TTS และการทำความเข้าใจสื่อ
ยังใช้การตั้งค่า provider/model ที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็น provider `/model` ปกติ:** นี่เป็นสิ่งที่คาดไว้สำหรับ
config ใหม่ เลือกโมเดล `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"` (หรือ ref เดิม `codex/*`) เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ไม่ได้ exclude
`codex`

**OpenClaw ใช้ PI แทน Codex:** `agentRuntime.id: "auto"` ยังสามารถใช้ PI เป็น
backend ความเข้ากันได้เมื่อไม่มี harness ของ Codex รับรันนั้น ตั้งค่า
`agentRuntime.id: "codex"` เพื่อบังคับการเลือก Codex ระหว่างทดสอบ
runtime Codex ที่ถูกบังคับตอนนี้จะล้มเหลวแทนที่จะ fallback ไป PI เว้นแต่คุณจะ
ตั้งค่า `agentRuntime.fallback: "pi"` อย่างชัดเจน เมื่อเลือก Codex app-server
แล้ว ความล้มเหลวของมันจะแสดงโดยตรงโดยไม่มี config fallback เพิ่มเติม

**app-server ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้ handshake ของ app-server
รายงานเวอร์ชัน `0.125.0` หรือใหม่กว่า prerelease เวอร์ชันเดียวกันหรือเวอร์ชันที่ต่อท้าย build
เช่น `0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ
stable protocol floor `0.125.0` คือสิ่งที่ OpenClaw ทดสอบ

**การค้นหาโมเดลช้า:** ลดค่า `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิด discovery

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`
และตรวจสอบว่า app-server ระยะไกลพูด protocol เวอร์ชันเดียวกันของ Codex app-server

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นสิ่งที่คาดไว้ เว้นแต่คุณจะบังคับ
`agentRuntime.id: "codex"` สำหรับเอเจนต์นั้นหรือเลือก ref เดิม
`codex/*` ref ธรรมดา `openai/gpt-*` และ provider อื่นๆ จะอยู่บนเส้นทาง
provider ปกติในโหมด `auto` หากคุณบังคับ `agentRuntime.id: "codex"` ทุก embedded
turn สำหรับเอเจนต์นั้นต้องเป็นโมเดล OpenAI ที่ Codex รองรับ

**ติดตั้ง Computer Use แล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จาก session ใหม่ หากเครื่องมือรายงาน
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงอยู่ ให้รีสตาร์ต
Gateway เพื่อล้างการลงทะเบียน native hook ที่ค้างอยู่ หาก `computer-use.list_apps`
หมดเวลา ให้รีสตาร์ต Codex Computer Use หรือ Codex Desktop แล้วลองอีกครั้ง

## ที่เกี่ยวข้อง

- [Plugins harness เอเจนต์](/th/plugins/sdk-agent-harness)
- [Runtime ของเอเจนต์](/th/concepts/agent-runtimes)
- [Provider โมเดล](/th/concepts/model-providers)
- [Provider OpenAI](/th/providers/openai)
- [สถานะ](/th/cli/status)
- [ฮุก Plugin](/th/plugins/hooks)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
