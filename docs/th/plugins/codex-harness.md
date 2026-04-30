---
read_when:
    - คุณต้องการใช้ฮาร์เนส app-server ของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่าชุดควบคุมของ Codex
    - คุณต้องการให้การปรับใช้แบบ Codex เท่านั้นล้มเหลว แทนที่จะย้อนกลับไปใช้ PI
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่รวมมาให้
title: ชุดควบคุม Codex
x-i18n:
    generated_at: "2026-04-30T10:05:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่มาพร้อมชุดติดตั้งทำให้ OpenClaw รันรอบการทำงานของเอเจนต์แบบฝังตัวผ่าน
app-server ของ Codex แทนฮาร์เนส PI ในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง: การค้นหาโมเดล
การกลับมาใช้งานเธรดเนทีฟ การทำ Compaction เนทีฟ และการดำเนินการผ่าน app-server
OpenClaw ยังคงเป็นเจ้าของช่องทางแชต ไฟล์เซสชัน การเลือกโมเดล เครื่องมือ
การอนุมัติ การส่งสื่อ และสำเนาทรานสคริปต์ที่มองเห็นได้

หากคุณกำลังพยายามทำความเข้าใจภาพรวม ให้เริ่มที่
[รันไทม์เอเจนต์](/th/concepts/agent-runtimes) สรุปสั้น ๆ คือ:
`openai/gpt-5.5` คือการอ้างอิงโมเดล, `codex` คือรันไทม์ และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## Plugin นี้เปลี่ยนอะไร

Plugin `codex` ที่มาพร้อมชุดติดตั้งเพิ่มความสามารถแยกกันหลายอย่าง:

| ความสามารถ                        | วิธีใช้งานของคุณ                                      | สิ่งที่ทำ                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| รันไทม์แบบฝังตัวเนทีฟ           | `agentRuntime.id: "codex"`                          | รันรอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่าน app-server ของ Codex                  |
| คำสั่งควบคุมแชตเนทีฟ      | `/codex bind`, `/codex resume`, `/codex steer`, ... | ผูกและควบคุมเธรด app-server ของ Codex จากการสนทนาในระบบส่งข้อความ    |
| ผู้ให้บริการ/แคตตาล็อก app-server ของ Codex | ภายในของ `codex` แสดงผ่านฮาร์เนส     | ทำให้รันไทม์ค้นหาและตรวจสอบโมเดล app-server ได้                     |
| เส้นทางการทำความเข้าใจสื่อของ Codex    | เส้นทางความเข้ากันได้ของโมเดลรูปภาพ `codex/*`           | รันรอบการทำงาน app-server ของ Codex แบบจำกัดขอบเขตสำหรับโมเดลทำความเข้าใจรูปภาพที่รองรับ |
| การส่งต่อ hook เนทีฟ                 | hook ของ Plugin รอบเหตุการณ์เนทีฟของ Codex             | ทำให้ OpenClaw สังเกต/บล็อกเหตุการณ์เครื่องมือ/การจบงานเนทีฟของ Codex ที่รองรับได้  |

การเปิดใช้ Plugin ทำให้ความสามารถเหล่านี้พร้อมใช้งาน แต่มัน **ไม่ได้**:

- เริ่มใช้ Codex สำหรับโมเดล OpenAI ทุกตัว
- แปลงการอ้างอิงโมเดล `openai-codex/*` เป็นรันไทม์เนทีฟ
- ทำให้ ACP/acpx เป็นเส้นทาง Codex เริ่มต้น
- สลับเซสชันเดิมที่บันทึกรันไทม์ PI ไว้แล้วแบบทันที
- แทนที่การส่งผ่านช่องทางของ OpenClaw, ไฟล์เซสชัน, การจัดเก็บ auth-profile หรือ
  การกำหนดเส้นทางข้อความ

Plugin เดียวกันนี้ยังเป็นเจ้าของพื้นผิวคำสั่งควบคุมแชตเนทีฟ `/codex` ด้วย หาก
เปิดใช้ Plugin และผู้ใช้ขอผูก กลับมาใช้ต่อ ควบคุม หยุด หรือตรวจสอบ
เธรด Codex จากแชต เอเจนต์ควรเลือกใช้ `/codex ...` แทน ACP โดย ACP ยังคงเป็น
ทางเลือกสำรองที่ชัดเจนเมื่อผู้ใช้ขอ ACP/acpx หรือกำลังทดสอบอะแดปเตอร์ ACP
ของ Codex

รอบการทำงานเนทีฟของ Codex ยังคงใช้ hook ของ Plugin ของ OpenClaw เป็นเลเยอร์ความเข้ากันได้สาธารณะ
สิ่งเหล่านี้คือ hook ของ OpenClaw ที่ทำงานในโปรเซส ไม่ใช่ hook คำสั่ง `hooks.json` ของ Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` สำหรับระเบียนทรานสคริปต์ที่ถูกมิเรอร์
- `before_agent_finalize` ผ่านการส่งต่อ `Stop` ของ Codex
- `agent_end`

Plugin ยังสามารถลงทะเบียนมิดเดิลแวร์ผลลัพธ์เครื่องมือที่เป็นกลางต่อรันไทม์ เพื่อเขียนผลลัพธ์เครื่องมือแบบไดนามิกของ
OpenClaw ใหม่ หลังจาก OpenClaw ดำเนินการเครื่องมือและก่อนส่งผลลัพธ์
กลับไปยัง Codex สิ่งนี้แยกจาก hook Plugin สาธารณะ
`tool_result_persist` ซึ่งแปลงการเขียนผลลัพธ์เครื่องมือในทรานสคริปต์ที่ OpenClaw เป็นเจ้าของ

สำหรับความหมายของ hook ของ Plugin เอง โปรดดู [hook ของ Plugin](/th/plugins/hooks)
และ [พฤติกรรม guard ของ Plugin](/th/tools/plugin)

ฮาร์เนสปิดอยู่ตามค่าเริ่มต้น คอนฟิกใหม่ควรเก็บการอ้างอิงโมเดล OpenAI
ตามรูปแบบมาตรฐานเป็น `openai/gpt-*` และบังคับอย่างชัดเจนด้วย
`agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` เมื่อต้องการ
การดำเนินการ app-server เนทีฟ การอ้างอิงโมเดล `codex/*` แบบเดิมยังคงเลือก
ฮาร์เนสโดยอัตโนมัติเพื่อความเข้ากันได้ แต่ prefix ผู้ให้บริการเดิมที่รองรับด้วยรันไทม์
จะไม่แสดงเป็นตัวเลือกโมเดล/ผู้ให้บริการปกติ

หากเปิดใช้ Plugin `codex` แต่โมเดลหลักยังคงเป็น
`openai-codex/*`, `openclaw doctor` จะเตือนแทนการเปลี่ยนเส้นทาง นี่เป็น
พฤติกรรมที่ตั้งใจ: `openai-codex/*` ยังคงเป็นเส้นทาง OAuth/การสมัครสมาชิกของ PI Codex และ
การดำเนินการ app-server เนทีฟยังคงเป็นตัวเลือกรันไทม์ที่ต้องระบุอย่างชัดเจน

## แผนที่เส้นทาง

ใช้ตารางนี้ก่อนเปลี่ยนคอนฟิก:

| พฤติกรรมที่ต้องการ                            | การอ้างอิงโมเดล                  | คอนฟิกรันไทม์                         | ข้อกำหนดของ Plugin          | ป้ายสถานะที่คาดหวัง          |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API ผ่านตัวรัน OpenClaw ปกติ   | `openai/gpt-*`             | ละไว้หรือ `runtime: "pi"`             | ผู้ให้บริการ OpenAI             | `Runtime: OpenClaw Pi Default` |
| OAuth/การสมัครสมาชิก Codex ผ่าน PI         | `openai-codex/gpt-*`       | ละไว้หรือ `runtime: "pi"`             | ผู้ให้บริการ OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| รอบการทำงานแบบฝังตัวของ app-server Codex เนทีฟ      | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| ผู้ให้บริการผสมพร้อมโหมดอัตโนมัติแบบระมัดระวัง | การอ้างอิงเฉพาะผู้ให้บริการ     | `agentRuntime.id: "auto"`              | รันไทม์ Plugin ทางเลือก    | ขึ้นอยู่กับรันไทม์ที่เลือก    |
| เซสชันอะแดปเตอร์ Codex ACP แบบชัดเจน          | ขึ้นอยู่กับพรอมป์/โมเดล ACP | `sessions_spawn` พร้อม `runtime: "acp"` | แบ็กเอนด์ `acpx` ที่สมบูรณ์      | สถานะงาน/เซสชัน ACP        |

จุดแยกสำคัญคือผู้ให้บริการเทียบกับรันไทม์:

- `openai-codex/*` ตอบว่า "PI ควรใช้เส้นทางผู้ให้บริการ/การยืนยันตัวตนใด?"
- `agentRuntime.id: "codex"` ตอบว่า "ลูปใดควรดำเนินการรอบแบบฝังตัวนี้?"
- `/codex ...` ตอบว่า "การสนทนา Codex เนทีฟใดที่แชตนี้ควรผูกหรือควบคุม?"
- ACP ตอบว่า "โปรเซสฮาร์เนสภายนอกใดที่ acpx ควรเปิด?"

## เลือก prefix โมเดลที่ถูกต้อง

เส้นทางตระกูล OpenAI แยกตาม prefix ใช้ `openai-codex/*` เมื่อคุณต้องการ
Codex OAuth ผ่าน PI; ใช้ `openai/*` เมื่อคุณต้องการเข้าถึง OpenAI API โดยตรง หรือ
เมื่อคุณกำลังบังคับใช้ฮาร์เนส app-server เนทีฟของ Codex:

| การอ้างอิงโมเดล                                     | เส้นทางรันไทม์                                 | ใช้เมื่อ                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | ผู้ให้บริการ OpenAI ผ่านระบบเชื่อมต่อ OpenClaw/PI | คุณต้องการเข้าถึง OpenAI Platform API โดยตรงในปัจจุบันด้วย `OPENAI_API_KEY` |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth ผ่าน OpenClaw/PI       | คุณต้องการการยืนยันตัวตนแบบการสมัครสมาชิก ChatGPT/Codex กับตัวรัน PI เริ่มต้น      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | ฮาร์เนส app-server ของ Codex                     | คุณต้องการการดำเนินการ app-server เนทีฟของ Codex สำหรับรอบการทำงานของเอเจนต์แบบฝังตัว   |

ปัจจุบัน GPT-5.5 เป็นแบบการสมัครสมาชิก/OAuth เท่านั้นใน OpenClaw ใช้
`openai-codex/gpt-5.5` สำหรับ PI OAuth หรือ `openai/gpt-5.5` พร้อมฮาร์เนส
app-server ของ Codex การเข้าถึงด้วยคีย์ API โดยตรงสำหรับ `openai/gpt-5.5` จะรองรับ
เมื่อ OpenAI เปิดใช้งาน GPT-5.5 บน API สาธารณะ

การอ้างอิง `codex/gpt-*` แบบเดิมยังคงยอมรับเป็น alias เพื่อความเข้ากันได้ การย้ายข้อมูล
ความเข้ากันได้ของ doctor จะเขียนการอ้างอิงรันไทม์หลักแบบเดิมใหม่เป็นการอ้างอิงโมเดล
ตามรูปแบบมาตรฐาน และบันทึกนโยบายรันไทม์แยกต่างหาก ขณะที่การอ้างอิงแบบเดิมที่ใช้เป็น fallback เท่านั้น
จะถูกปล่อยไว้ไม่เปลี่ยนแปลง เพราะรันไทม์ถูกคอนฟิกสำหรับคอนเทนเนอร์เอเจนต์ทั้งหมด
คอนฟิก PI Codex OAuth ใหม่ควรใช้ `openai-codex/gpt-*`; คอนฟิกฮาร์เนส
app-server เนทีฟใหม่ควรใช้ `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"`

`agents.defaults.imageModel` ใช้การแยก prefix แบบเดียวกัน ใช้
`openai-codex/gpt-*` เมื่อการทำความเข้าใจรูปภาพควรรันผ่านเส้นทางผู้ให้บริการ OpenAI
Codex OAuth ใช้ `codex/gpt-*` เมื่อการทำความเข้าใจรูปภาพควรรัน
ผ่านรอบการทำงาน app-server ของ Codex แบบจำกัดขอบเขต โมเดล app-server ของ Codex ต้อง
ประกาศการรองรับอินพุตรูปภาพ โมเดล Codex แบบข้อความเท่านั้นจะล้มเหลวก่อนที่รอบการทำงานสื่อ
จะเริ่มต้น

ใช้ `/status` เพื่อยืนยันฮาร์เนสที่มีผลสำหรับเซสชันปัจจุบัน หากการเลือก
น่าประหลาดใจ ให้เปิดการบันทึก debug สำหรับระบบย่อย `agents/harness`
และตรวจสอบระเบียนแบบมีโครงสร้าง `agent harness selected` ของ gateway ซึ่ง
รวม id ฮาร์เนสที่เลือก เหตุผลการเลือก นโยบายรันไทม์/fallback และ
ในโหมด `auto` ผลการรองรับของผู้สมัคร Plugin แต่ละตัว

### คำเตือนของ doctor หมายความว่าอะไร

`openclaw doctor` เตือนเมื่อสิ่งต่อไปนี้เป็นจริงทั้งหมด:

- เปิดใช้หรืออนุญาต Plugin `codex` ที่มาพร้อมชุดติดตั้ง
- โมเดลหลักของเอเจนต์เป็น `openai-codex/*`
- รันไทม์ที่มีผลของเอเจนต์นั้นไม่ใช่ `codex`

คำเตือนนั้นมีอยู่เพราะผู้ใช้มักคาดว่า "เปิดใช้ Plugin Codex" จะหมายถึง
"รันไทม์ app-server เนทีฟของ Codex" OpenClaw ไม่กระโดดข้ามขั้นแบบนั้น คำเตือน
หมายความว่า:

- **ไม่จำเป็นต้องเปลี่ยนแปลง** หากคุณตั้งใจใช้ ChatGPT/Codex OAuth ผ่าน PI
- เปลี่ยนโมเดลเป็น `openai/<model>` และตั้งค่า
  `agentRuntime.id: "codex"` หากคุณตั้งใจใช้การดำเนินการ app-server
  เนทีฟ
- เซสชันเดิมยังคงต้องใช้ `/new` หรือ `/reset` หลังจากเปลี่ยนรันไทม์
  เพราะการตรึงรันไทม์ของเซสชันมีผลคงอยู่

การเลือกฮาร์เนสไม่ใช่การควบคุมเซสชันแบบสด เมื่อรอบการทำงานแบบฝังตัวรัน
OpenClaw จะบันทึก id ฮาร์เนสที่เลือกไว้บนเซสชันนั้น และใช้ต่อไปสำหรับ
รอบการทำงานภายหลังใน id เซสชันเดียวกัน เปลี่ยนคอนฟิก `agentRuntime` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อคุณต้องการให้เซสชันในอนาคตใช้ฮาร์เนสอื่น;
ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับการสนทนาเดิม
ระหว่าง PI และ Codex วิธีนี้หลีกเลี่ยงการเล่นทรานสคริปต์เดียวกันซ้ำผ่าน
ระบบเซสชันเนทีฟสองระบบที่เข้ากันไม่ได้

เซสชันเดิมที่สร้างก่อนการตรึงฮาร์เนสจะถือว่าถูกตรึงกับ PI เมื่อมี
ประวัติทรานสคริปต์แล้ว ใช้ `/new` หรือ `/reset` เพื่อเลือกให้การสนทนานั้นใช้
Codex หลังจากเปลี่ยนคอนฟิก

`/status` แสดงรันไทม์โมเดลที่มีผล ฮาร์เนส PI เริ่มต้นปรากฏเป็น
`Runtime: OpenClaw Pi Default` และฮาร์เนส app-server ของ Codex ปรากฏเป็น
`Runtime: OpenAI Codex`

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` ที่มาพร้อมชุดติดตั้งพร้อมใช้งาน
- app-server ของ Codex `0.125.0` หรือใหม่กว่า Plugin ที่มาพร้อมชุดติดตั้งจัดการไบนารี
  app-server ของ Codex ที่เข้ากันได้ตามค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH` จึง
  ไม่ส่งผลต่อการเริ่มต้นฮาร์เนสปกติ
- การยืนยันตัวตนของ Codex พร้อมใช้งานสำหรับโปรเซส app-server หรือสำหรับสะพานการยืนยันตัวตน Codex
  ของ OpenClaw

Plugin จะบล็อก handshake ของ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน วิธีนี้ทำให้
OpenClaw อยู่บนพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้ว

สำหรับการทดสอบ smoke แบบ live และ Docker การยืนยันตัวตนมักมาจากบัญชี Codex CLI
หรือ auth profile `openai-codex` ของ OpenClaw การเปิด app-server แบบ stdio ในเครื่อง
ยังสามารถ fallback ไปยัง `CODEX_API_KEY` / `OPENAI_API_KEY` เมื่อไม่มีบัญชีได้

## คอนฟิกขั้นต่ำ

ใช้ `openai/gpt-5.5` เปิดใช้ Plugin ที่มาพร้อมชุดติดตั้ง และบังคับใช้ฮาร์เนส `codex`:

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

หากคอนฟิกของคุณใช้ `plugins.allow` ให้ใส่ `codex` ไว้ที่นั่นด้วย:

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

คอนฟิกเดิมที่ตั้งค่า `agents.defaults.model` หรือโมเดลของเอเจนต์เป็น
`codex/<model>` ยังคงเปิดใช้ Plugin `codex` ที่มาพร้อมชุดติดตั้งโดยอัตโนมัติ คอนฟิกใหม่ควร
เลือกใช้ `openai/<model>` พร้อมรายการ `agentRuntime` ที่ระบุอย่างชัดเจนด้านบน

## เพิ่ม Codex ควบคู่กับโมเดลอื่น

อย่าตั้งค่า `agentRuntime.id: "codex"` แบบทั่วทั้งระบบ หากเอเจนต์เดียวกันควรสลับได้อย่างอิสระ
ระหว่าง Codex และโมเดลผู้ให้บริการที่ไม่ใช่ Codex รันไทม์ที่บังคับใช้จะนำไปใช้กับทุก
รอบการทำงานแบบฝังตัวสำหรับเอเจนต์หรือเซสชันนั้น หากคุณเลือกโมเดล Anthropic ขณะที่
รันไทม์นั้นถูกบังคับอยู่ OpenClaw จะยังคงลองใช้ฮาร์เนส Codex และล้มเหลวแบบปิด
แทนการกำหนดเส้นทางรอบการทำงานนั้นผ่าน PI อย่างเงียบ ๆ

ใช้รูปแบบใดรูปแบบหนึ่งเหล่านี้แทน:

- วาง Codex ไว้บนเอเจนต์เฉพาะที่มี `agentRuntime.id: "codex"`
- คงเอเจนต์เริ่มต้นไว้ที่ `agentRuntime.id: "auto"` และใช้ทางเลือกสำรอง PI สำหรับการใช้งานผู้ให้บริการแบบผสมตามปกติ
- ใช้การอ้างอิงแบบเดิม `codex/*` เพื่อความเข้ากันได้เท่านั้น คอนฟิกใหม่ควรใช้ `openai/*` ร่วมกับนโยบายรันไทม์ Codex ที่ระบุชัดเจน

ตัวอย่างเช่น รูปแบบนี้คงเอเจนต์เริ่มต้นไว้กับการเลือกอัตโนมัติตามปกติ และเพิ่มเอเจนต์ Codex แยกต่างหาก:

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

ด้วยรูปแบบนี้:

- เอเจนต์เริ่มต้น `main` ใช้เส้นทางผู้ให้บริการปกติและทางเลือกสำรองความเข้ากันได้ของ PI
- เอเจนต์ `codex` ใช้ฮาร์เนส app-server ของ Codex
- หาก Codex ขาดหายหรือไม่รองรับสำหรับเอเจนต์ `codex` รอบการทำงานจะล้มเหลวแทนที่จะใช้ PI อย่างเงียบๆ

## การกำหนดเส้นทางคำสั่งของเอเจนต์

เอเจนต์ควรกำหนดเส้นทางคำขอของผู้ใช้ตามเจตนา ไม่ใช่จากคำว่า "Codex" เพียงอย่างเดียว:

| ผู้ใช้ขอให้...                                         | เอเจนต์ควรใช้...                              |
| -------------------------------------------------------- | ------------------------------------------------ |
| "ผูกแชตนี้กับ Codex"                                | `/codex bind`                                    |
| "กลับมาใช้เธรด Codex `<id>` ที่นี่"                        | `/codex resume <id>`                             |
| "แสดงเธรด Codex"                                     | `/codex threads`                                 |
| "ส่งรายงานสนับสนุนสำหรับการรัน Codex ที่มีปัญหา"              | `/diagnostics [note]`                            |
| "ส่งฟีดแบ็ก Codex สำหรับเธรดที่แนบมานี้เท่านั้น"      | `/codex diagnostics [note]`                      |
| "ใช้ Codex เป็นรันไทม์สำหรับเอเจนต์นี้"                | เปลี่ยนคอนฟิกเป็น `agentRuntime.id`               |
| "ใช้การสมัครสมาชิก ChatGPT/Codex ของฉันกับ OpenClaw ปกติ" | การอ้างอิงโมเดล `openai-codex/*`                      |
| "รัน Codex ผ่าน ACP/acpx"                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "เริ่ม Claude Code/Gemini/OpenCode/Cursor ในเธรด"   | ACP/acpx ไม่ใช่ `/codex` และไม่ใช่เอเจนต์ย่อยแบบเนทีฟ |

OpenClaw จะประกาศคำแนะนำการสปอว์น ACP ให้เอเจนต์เฉพาะเมื่อเปิดใช้งาน ACP,
สามารถจัดส่งได้ และมีแบ็กเอนด์รันไทม์ที่โหลดแล้วรองรับ หาก ACP ไม่พร้อมใช้งาน
พรอมป์ระบบและ Skills ของ Plugin ไม่ควรสอนเอเจนต์เกี่ยวกับการกำหนดเส้นทาง ACP

## การปรับใช้ที่ใช้ Codex เท่านั้น

บังคับใช้ฮาร์เนส Codex เมื่อคุณต้องพิสูจน์ว่าทุกรอบการทำงานของเอเจนต์ที่ฝังอยู่
ใช้ Codex รันไทม์ Plugin ที่ระบุชัดเจนมีค่าเริ่มต้นเป็นไม่มีทางเลือกสำรอง PI ดังนั้น
`fallback: "none"` จึงเป็นตัวเลือก แต่ก็มักมีประโยชน์ในฐานะเอกสารกำกับ:

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

การแทนที่ด้วยสภาพแวดล้อม:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่เนิ่นๆ หาก Plugin Codex ถูกปิดใช้งาน
app-server เก่าเกินไป หรือ app-server เริ่มทำงานไม่ได้ ตั้งค่า
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` เฉพาะเมื่อคุณตั้งใจให้ PI จัดการ
การเลือกฮาร์เนสที่ขาดหาย

## Codex รายเอเจนต์

คุณสามารถทำให้เอเจนต์หนึ่งใช้ Codex เท่านั้น ในขณะที่เอเจนต์เริ่มต้นยังคงใช้
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

ใช้คำสั่งเซสชันปกติเพื่อสลับเอเจนต์และโมเดล `/new` สร้างเซสชัน OpenClaw ใหม่
และฮาร์เนส Codex จะสร้างหรือกลับมาใช้เธรด app-server แบบ sidecar ตามต้องการ
`/reset` ล้างการผูกเซสชัน OpenClaw สำหรับเธรดนั้น และให้รอบการทำงานถัดไป
แก้รันฮาร์เนสจากคอนฟิกปัจจุบันอีกครั้ง

## การค้นพบโมเดล

โดยค่าเริ่มต้น Plugin Codex จะถาม app-server ถึงโมเดลที่พร้อมใช้งาน หาก
การค้นพบล้มเหลวหรือหมดเวลา จะใช้แค็ตตาล็อกทางเลือกสำรองที่รวมมาให้สำหรับ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

คุณสามารถปรับการค้นพบได้ที่ `plugins.entries.codex.config.discovery`:

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

ปิดใช้งานการค้นพบเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการตรวจสอบ Codex และยึดกับ
แค็ตตาล็อกทางเลือกสำรอง:

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

ไบนารีที่จัดการนี้ถูกประกาศเป็นการพึ่งพารันไทม์ Plugin ที่รวมมาให้ และถูกจัดเตรียม
พร้อมกับการพึ่งพาอื่นๆ ของ Plugin `codex` วิธีนี้ทำให้เวอร์ชัน app-server
ผูกกับ Plugin ที่รวมมาให้ แทนที่จะขึ้นกับ Codex CLI แยกต่างหากตัวใดก็ตามที่ติดตั้งอยู่ในเครื่อง
ตั้งค่า `appServer.command` เฉพาะเมื่อคุณตั้งใจรันไฟล์ปฏิบัติการอื่น

โดยค่าเริ่มต้น OpenClaw จะเริ่มเซสชันฮาร์เนส Codex ภายในเครื่องในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือท่าทีของผู้ปฏิบัติงานภายในเครื่องที่เชื่อถือได้ ซึ่งใช้
สำหรับ Heartbeat อัตโนมัติ: Codex สามารถใช้เครื่องมือเชลล์และเครือข่ายได้โดยไม่
หยุดที่พรอมป์อนุมัติแบบเนทีฟซึ่งไม่มีใครอยู่ตอบ

หากต้องการเลือกใช้การอนุมัติที่ Guardian ตรวจทานของ Codex ให้ตั้งค่า `appServer.mode:
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

โหมด Guardian ใช้เส้นทางอนุมัติแบบ auto-review เนทีฟของ Codex เมื่อ Codex ขอ
ออกจากแซนด์บ็อกซ์ เขียนนอกพื้นที่ทำงาน หรือเพิ่มสิทธิ์อย่างเช่นการเข้าถึงเครือข่าย
Codex จะส่งคำขออนุมัตินั้นไปยังผู้ตรวจทานแบบเนทีฟแทนพรอมป์ของมนุษย์
ผู้ตรวจทานจะใช้กรอบความเสี่ยงของ Codex และอนุมัติหรือปฏิเสธคำขอเฉพาะนั้น
ใช้ Guardian เมื่อคุณต้องการราวกั้นมากกว่าโหมด YOLO แต่ยังต้องให้เอเจนต์ที่ไม่มีคนเฝ้า
ทำงานต่อไปได้

พรีเซ็ต `guardian` ขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"`
ฟิลด์นโยบายแต่ละรายการยังคงแทนที่ `mode` ได้ ดังนั้นการปรับใช้ขั้นสูงจึงสามารถผสม
พรีเซ็ตกับตัวเลือกที่ระบุชัดเจนได้ ค่า reviewer แบบเก่า `guardian_subagent`
ยังคงยอมรับในฐานะนามแฝงเพื่อความเข้ากันได้ แต่คอนฟิกใหม่ควรใช้
`auto_review`

สำหรับ app-server ที่กำลังรันอยู่แล้ว ให้ใช้การขนส่ง WebSocket:

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

การเริ่ม app-server แบบ Stdio จะสืบทอดสภาพแวดล้อมของกระบวนการ OpenClaw โดยค่าเริ่มต้น
แต่ OpenClaw เป็นเจ้าของบริดจ์บัญชี app-server ของ Codex การยืนยันตัวตนถูกเลือกตาม
ลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน OpenClaw Codex ที่ระบุชัดเจนสำหรับเอเจนต์
2. บัญชีที่มีอยู่ของ app-server เช่น การลงชื่อเข้าใช้ ChatGPT ของ Codex CLI ภายในเครื่อง
3. สำหรับการเริ่ม app-server แบบ stdio ภายในเครื่องเท่านั้น ใช้ `CODEX_API_KEY` แล้วจึง
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server อยู่และยังต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw พบโปรไฟล์การยืนยันตัวตน Codex แบบการสมัครสมาชิก ChatGPT จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่ถูกสปอว์น
วิธีนี้ทำให้คีย์ API ระดับ Gateway ยังคงพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้รอบการทำงาน app-server เนทีฟของ Codex ถูกคิดเงินผ่าน API โดยไม่ตั้งใจ
โปรไฟล์คีย์ API ของ Codex ที่ระบุชัดเจนและทางเลือกสำรองคีย์ env สำหรับ stdio ภายในเครื่อง
ใช้การเข้าสู่ระบบ app-server แทนการสืบทอด env ของกระบวนการลูก การเชื่อมต่อ app-server
แบบ WebSocket จะไม่ได้รับทางเลือกสำรองคีย์ API จาก env ของ Gateway ให้ใช้โปรไฟล์
การยืนยันตัวตนที่ระบุชัดเจนหรือบัญชีของ app-server ระยะไกลเอง

หากการปรับใช้ต้องการการแยกสภาพแวดล้อมเพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นใน
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

`appServer.clearEnv` มีผลเฉพาะกับกระบวนการลูก app-server ของ Codex ที่ถูกสปอว์น

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์               | ค่าเริ่มต้น                                  | ความหมาย                                                                                                                             |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` จะ spawn Codex; `"websocket"` เชื่อมต่อกับ `url`.                                                                            |
| `command`           | ไบนารี Codex ที่มีการจัดการ                     | ไฟล์ปฏิบัติการสำหรับ stdio transport ปล่อยว่างไว้เพื่อใช้ไบนารีที่มีการจัดการ; ตั้งค่าเฉพาะเมื่อต้องการ override อย่างชัดเจนเท่านั้น                        |
| `args`              | `["app-server", "--listen", "stdio://"]` | อาร์กิวเมนต์สำหรับ stdio transport                                                                                                      |
| `url`               | ไม่ได้ตั้งค่า                                    | URL ของ WebSocket app-server                                                                                                           |
| `authToken`         | ไม่ได้ตั้งค่า                                    | Bearer token สำหรับ WebSocket transport                                                                                               |
| `headers`           | `{}`                                     | WebSocket headers เพิ่มเติม                                                                                                            |
| `clearEnv`          | `[]`                                     | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากกระบวนการ stdio app-server ที่ spawn ขึ้น หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว |
| `requestTimeoutMs`  | `60000`                                  | การหมดเวลาสำหรับการเรียก control-plane ของ app-server                                                                                         |
| `mode`              | `"yolo"`                                 | พรีเซ็ตสำหรับการดำเนินการแบบ YOLO หรือแบบ guardian-reviewed                                                                                     |
| `approvalPolicy`    | `"never"`                                | นโยบายการอนุมัติเนทีฟของ Codex ที่ส่งไปยัง thread start/resume/turn                                                                      |
| `sandbox`           | `"danger-full-access"`                   | โหมด sandbox เนทีฟของ Codex ที่ส่งไปยัง thread start/resume                                                                              |
| `approvalsReviewer` | `"user"`                                 | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจสอบพรอมป์การอนุมัติเนทีฟ `guardian_subagent` ยังคงเป็น alias แบบเดิม                        |
| `serviceTier`       | ไม่ได้ตั้งค่า                                    | service tier ของ Codex app-server ที่ไม่บังคับ: `"fast"`, `"flex"` หรือ `null` ค่าเดิมที่ไม่ถูกต้องจะถูกละเว้น                           |

การเรียก dynamic tool ที่ OpenClaw เป็นเจ้าของจะถูกจำกัดอย่างเป็นอิสระจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` แต่ละรายการต้องได้รับ
การตอบกลับจาก OpenClaw ภายใน 30 วินาที เมื่อหมดเวลา OpenClaw จะยกเลิกสัญญาณของ tool
ในที่ที่รองรับ และส่งคืนการตอบกลับ dynamic-tool ที่ล้มเหลวไปยัง Codex เพื่อให้
เทิร์นดำเนินต่อได้ แทนที่จะปล่อยให้ session ค้างอยู่ในสถานะ `processing`

หลังจาก OpenClaw ตอบกลับคำขอ app-server ของ Codex ที่อยู่ในขอบเขตเทิร์นแล้ว harness
ยังคาดหวังให้ Codex จบเทิร์นเนทีฟด้วย `turn/completed` ด้วย หาก
app-server เงียบไป 60 วินาทีหลังจากการตอบกลับนั้น OpenClaw จะพยายามอย่างดีที่สุด
เพื่อขัดจังหวะเทิร์นของ Codex บันทึกการหมดเวลาเพื่อการวินิจฉัย และปล่อย
lane ของ session OpenClaw เพื่อไม่ให้ข้อความแชทถัดไปถูกเข้าคิวอยู่หลัง
เทิร์นเนทีฟเก่าที่ค้างอยู่

override ผ่านสภาพแวดล้อมยังคงใช้งานได้สำหรับการทดสอบในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้ามไบนารีที่มีการจัดการเมื่อ
`appServer.command` ไม่ได้ตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกนำออกแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว Config เป็น
วิธีที่แนะนำสำหรับการปรับใช้ที่ทำซ้ำได้ เพราะจะเก็บพฤติกรรมของ plugin ไว้ใน
ไฟล์ที่ผ่านการตรวจสอบเดียวกันกับการตั้งค่า Codex harness ส่วนที่เหลือ

## การใช้คอมพิวเตอร์

การใช้คอมพิวเตอร์มีคู่มือการตั้งค่าแยกต่างหาก:
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use).

สรุปสั้น ๆ: OpenClaw ไม่ได้รวมแอปควบคุมเดสก์ท็อปไว้ใน vendor หรือดำเนินการ
กับเดสก์ท็อปเอง โดยจะเตรียม Codex app-server, ตรวจสอบว่า MCP server
`computer-use` พร้อมใช้งาน แล้วให้ Codex จัดการการเรียก MCP tool แบบเนทีฟ
ระหว่างเทิร์นในโหมด Codex

สำหรับการเข้าถึงไดรเวอร์ TryCua โดยตรงนอก flow ของ marketplace ของ Codex ให้ลงทะเบียน
`cua-driver mcp` ด้วย `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
ดู [การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use) สำหรับความแตกต่าง
ระหว่างการใช้คอมพิวเตอร์ที่ Codex เป็นเจ้าของกับการลงทะเบียน MCP โดยตรง

Config ขั้นต่ำ:

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

การใช้คอมพิวเตอร์ใช้ได้เฉพาะ macOS และอาจต้องมีสิทธิ์ของ OS ในเครื่องก่อนที่
Codex MCP server จะควบคุมแอปได้ หาก `computerUse.enabled` เป็น true และ MCP
server ไม่พร้อมใช้งาน เทิร์นในโหมด Codex จะล้มเหลวก่อนที่ thread จะเริ่ม แทนที่จะ
ทำงานต่ออย่างเงียบ ๆ โดยไม่มีเครื่องมือการใช้คอมพิวเตอร์แบบเนทีฟ ดู
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use) สำหรับตัวเลือก marketplace,
ข้อจำกัดของ catalog ระยะไกล, เหตุผลของสถานะ และการแก้ไขปัญหา

เมื่อ `computerUse.autoInstall` เป็น true OpenClaw สามารถลงทะเบียน marketplace
Codex Desktop มาตรฐานที่ bundled มาได้จาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` หาก Codex
ยังไม่ค้นพบ marketplace ในเครื่อง ใช้ `/new` หรือ `/reset` หลังจากเปลี่ยน
config ของ runtime หรือการใช้คอมพิวเตอร์ เพื่อไม่ให้ session ที่มีอยู่ยังคงใช้
PI เก่าหรือการผูกกับ thread ของ Codex เดิม

## สูตรที่ใช้บ่อย

Codex ในเครื่องด้วย stdio transport เริ่มต้น:

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

การอนุมัติ Codex แบบ guardian-reviewed:

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

app-server ระยะไกลพร้อม headers ที่ระบุชัดเจน:

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

การสลับโมเดลยังคงถูกควบคุมโดย OpenClaw เมื่อ session ของ OpenClaw ถูกแนบ
กับ thread Codex ที่มีอยู่ เทิร์นถัดไปจะส่งโมเดล OpenAI, provider,
นโยบายการอนุมัติ, sandbox และ service tier ที่เลือกอยู่ในขณะนั้นไปยัง
app-server อีกครั้ง การสลับจาก `openai/gpt-5.5` เป็น `openai/gpt-5.2` จะคง
การผูก thread ไว้ แต่ขอให้ Codex ดำเนินการต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

Plugin ที่ bundled มาจะลงทะเบียน `/codex` เป็นคำสั่ง slash ที่ได้รับอนุญาต คำสั่งนี้
เป็นแบบทั่วไปและทำงานได้บน channel ใดก็ตามที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` แสดงการเชื่อมต่อ app-server แบบสด, โมเดล, บัญชี, rate limits, MCP servers และ skills
- `/codex models` แสดงรายการโมเดล Codex app-server แบบสด
- `/codex threads [filter]` แสดงรายการ thread Codex ล่าสุด
- `/codex resume <thread-id>` แนบ session OpenClaw ปัจจุบันเข้ากับ thread Codex ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server compact thread ที่แนบอยู่
- `/codex review` เริ่มการ review แบบเนทีฟของ Codex สำหรับ thread ที่แนบอยู่
- `/codex diagnostics [note]` ถามก่อนส่ง feedback การวินิจฉัยของ Codex สำหรับ thread ที่แนบอยู่
- `/codex computer-use status` ตรวจสอบ Plugin การใช้คอมพิวเตอร์และ MCP server ที่กำหนดค่าไว้
- `/codex computer-use install` ติดตั้ง Plugin การใช้คอมพิวเตอร์ที่กำหนดค่าไว้และโหลด MCP servers ใหม่
- `/codex account` แสดงสถานะบัญชีและ rate-limit
- `/codex mcp` แสดงรายการสถานะ MCP server ของ Codex app-server
- `/codex skills` แสดงรายการ skills ของ Codex app-server

### workflow การดีบักที่ใช้บ่อย

เมื่อ agent ที่ใช้ Codex ทำสิ่งที่ไม่คาดคิดใน Telegram, Discord, Slack
หรือ channel อื่น ให้เริ่มจากบทสนทนาที่เกิดปัญหา:

1. เรียกใช้ `/diagnostics bad tool choice after image upload` หรือ note สั้น ๆ อื่น
   ที่อธิบายสิ่งที่คุณเห็น
2. อนุมัติคำขอ diagnostics หนึ่งครั้ง การอนุมัติจะสร้าง zip diagnostics ของ Gateway
   ในเครื่อง และเนื่องจาก session ใช้ Codex harness จึงส่ง
   feedback bundle ของ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
3. คัดลอกการตอบกลับ diagnostics ที่เสร็จสมบูรณ์ลงในรายงานบั๊กหรือ thread สนับสนุน
   ซึ่งรวมถึง path ของ bundle ในเครื่อง, สรุปความเป็นส่วนตัว, ids ของ session OpenClaw,
   ids ของ thread Codex และบรรทัด `Inspect locally` สำหรับแต่ละ thread Codex
4. หากคุณต้องการดีบักการรันด้วยตัวเอง ให้เรียกใช้คำสั่ง `Inspect locally`
   ที่พิมพ์ออกมาใน terminal คำสั่งจะมีลักษณะเช่น `codex resume <thread-id>` และเปิด
   thread Codex แบบเนทีฟ เพื่อให้คุณตรวจสอบบทสนทนา, ดำเนินการต่อในเครื่อง
   หรือถาม Codex ว่าทำไมจึงเลือก tool หรือ plan นั้น

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการ upload feedback ของ Codex
สำหรับ thread ที่แนบอยู่ในปัจจุบันโดยเฉพาะ โดยไม่รวม diagnostics bundle ของ
Gateway ของ OpenClaw แบบเต็ม สำหรับรายงานสนับสนุนส่วนใหญ่ `/diagnostics [note]` เป็น
จุดเริ่มต้นที่ดีกว่า เพราะเชื่อมสถานะ Gateway ในเครื่องและ ids ของ thread Codex
ไว้ด้วยกันในการตอบกลับเดียว ดู [การส่งออก Diagnostics](/th/gateway/diagnostics)
สำหรับโมเดลความเป็นส่วนตัวเต็มรูปแบบและพฤติกรรมใน group-chat

Core OpenClaw ยังเปิดเผย `/diagnostics [note]` เฉพาะ owner เป็นคำสั่ง diagnostics
ทั่วไปของ Gateway ด้วย พรอมป์การอนุมัติจะแสดงคำนำเกี่ยวกับข้อมูลละเอียดอ่อน,
ลิงก์ไปยัง [การส่งออก Diagnostics](/th/gateway/diagnostics) และร้องขอ
`openclaw gateway diagnostics export --json` ผ่านการอนุมัติ exec อย่างชัดเจน
ทุกครั้ง อย่าอนุมัติ diagnostics ด้วยกฎ allow-all หลังจากอนุมัติแล้ว
OpenClaw จะส่งรายงานที่ paste ได้พร้อม path ของ bundle ในเครื่องและสรุป
manifest เมื่อ session OpenClaw ที่ใช้งานอยู่ใช้ Codex harness การอนุมัติเดียวกันนั้น
ยังอนุญาตให้ส่ง feedback bundles ของ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI
ด้วย พรอมป์การอนุมัติจะบอกว่าจะส่ง feedback ของ Codex แต่
จะไม่แสดง ids ของ session หรือ thread Codex ก่อนการอนุมัติ

หาก `/diagnostics` ถูกเรียกโดย owner ใน group chat OpenClaw จะรักษา
channel ที่ใช้ร่วมกันให้สะอาด: group จะได้รับเฉพาะ notice สั้น ๆ ในขณะที่
คำนำ diagnostics, พรอมป์การอนุมัติ และ ids ของ session/thread Codex จะถูกส่งไปยัง
owner ผ่านเส้นทางการอนุมัติส่วนตัว หากไม่มีเส้นทาง owner ส่วนตัว
OpenClaw จะปฏิเสธคำขอจาก group และขอให้ owner เรียกใช้จาก DM.

การอัปโหลด Codex ที่อนุมัติแล้วจะเรียก Codex app-server `feedback/upload` และขอให้
app-server รวมบันทึกสำหรับแต่ละเธรดที่ระบุไว้และ subthread ของ Codex ที่ถูกสร้างขึ้น
เมื่อมีให้ใช้งาน การอัปโหลดจะผ่านเส้นทาง feedback ปกติของ Codex ไปยังเซิร์ฟเวอร์
OpenAI หาก feedback ของ Codex ถูกปิดใช้งานใน app-server นั้น คำสั่งจะส่งคืน
ข้อผิดพลาดของ app-server คำตอบ diagnostics ที่เสร็จสมบูรณ์จะแสดงรายการช่องทาง,
id เซสชัน OpenClaw, id เธรด Codex และคำสั่ง `codex resume <thread-id>`
แบบ local สำหรับเธรดที่ถูกส่ง หากคุณปฏิเสธหรือเพิกเฉยต่อการอนุมัติ
OpenClaw จะไม่พิมพ์ id ของ Codex เหล่านั้น การอัปโหลดนี้ไม่ได้แทนที่การส่งออก
diagnostics ของ Gateway แบบ local

`/codex resume` เขียนไฟล์ binding sidecar เดียวกับที่ harness ใช้สำหรับ
turn ปกติ ในข้อความถัดไป OpenClaw จะ resume เธรด Codex นั้น ส่งโมเดล
OpenClaw ที่เลือกอยู่ในขณะนั้นเข้าไปยัง app-server และเปิดใช้ประวัติแบบขยายต่อไป

### ตรวจสอบเธรด Codex จาก CLI

วิธีที่เร็วที่สุดในการทำความเข้าใจการรัน Codex ที่มีปัญหามักเป็นการเปิดเธรด
Codex ดั้งเดิมโดยตรง:

```sh
codex resume <thread-id>
```

ใช้สิ่งนี้เมื่อคุณสังเกตเห็นบั๊กในการสนทนาของช่องทาง และต้องการตรวจสอบ
เซสชัน Codex ที่มีปัญหา ดำเนินต่อแบบ local หรือถาม Codex ว่าทำไมจึงเลือก
tool หรือ reasoning แบบใดแบบหนึ่ง เส้นทางที่ง่ายที่สุดมักเป็นการรัน
`/diagnostics [note]` ก่อน: หลังจากคุณอนุมัติแล้ว รายงานที่เสร็จสมบูรณ์จะแสดงรายการ
เธรด Codex แต่ละรายการและพิมพ์คำสั่ง `Inspect locally` เช่น
`codex resume <thread-id>` คุณสามารถคัดลอกคำสั่งนั้นไปยังเทอร์มินัลได้โดยตรง

คุณยังสามารถรับ id เธรดจาก `/codex binding` สำหรับแชตปัจจุบัน หรือ
`/codex threads [filter]` สำหรับเธรด Codex app-server ล่าสุด แล้วรันคำสั่ง
`codex resume` เดียวกันใน shell ของคุณ

พื้นผิวคำสั่งต้องใช้ Codex app-server `0.125.0` หรือใหม่กว่า วิธีควบคุมแต่ละรายการ
จะถูกรายงานเป็น `unsupported by this Codex app-server` หาก app-server ในอนาคต
หรือแบบกำหนดเองไม่ได้เปิดเผยเมธอด JSON-RPC นั้น

## ขอบเขตของ hook

Codex harness มี hook สามชั้น:

| ชั้น                                  | เจ้าของ                   | วัตถุประสงค์                                                         |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin hooks                 | OpenClaw                 | ความเข้ากันได้ของผลิตภัณฑ์/Plugin ระหว่าง harness ของ PI และ Codex |
| Codex app-server extension middleware | OpenClaw bundled plugins | พฤติกรรม adapter ต่อ turn รอบเครื่องมือ dynamic ของ OpenClaw       |
| Codex native hooks                    | Codex                    | วงจรชีวิต Codex ระดับล่างและนโยบายเครื่องมือดั้งเดิมจาก config Codex |

OpenClaw ไม่ใช้ไฟล์ `hooks.json` ของ Codex ระดับโปรเจกต์หรือ global เพื่อกำหนดเส้นทาง
พฤติกรรม Plugin ของ OpenClaw สำหรับ bridge ของ native tool และ permission ที่รองรับ
OpenClaw จะ inject config Codex ต่อเธรดสำหรับ `PreToolUse`, `PostToolUse`,
`PermissionRequest` และ `Stop` hook อื่นของ Codex เช่น `SessionStart` และ
`UserPromptSubmit` ยังคงเป็นการควบคุมระดับ Codex และไม่ได้เปิดเผยเป็น
hook ของ Plugin OpenClaw ในสัญญา v1

สำหรับเครื่องมือ dynamic ของ OpenClaw นั้น OpenClaw จะดำเนินการ tool หลังจาก Codex ขอ
call ดังนั้น OpenClaw จึงเรียกใช้พฤติกรรม Plugin และ middleware ที่ตนเป็นเจ้าของใน
harness adapter สำหรับเครื่องมือ native ของ Codex นั้น Codex เป็นเจ้าของระเบียน tool
มาตรฐาน OpenClaw สามารถ mirror เหตุการณ์ที่เลือกได้ แต่ไม่สามารถเขียนเธรด Codex
ดั้งเดิมใหม่ได้ เว้นแต่ Codex จะเปิดเผยการดำเนินการนั้นผ่าน app-server หรือ callback
ของ native hook

การฉายภาพ Compaction และวงจรชีวิต LLM มาจากการแจ้งเตือนของ Codex app-server
และสถานะ adapter ของ OpenClaw ไม่ใช่คำสั่ง native hook ของ Codex เหตุการณ์
`before_compaction`, `after_compaction`, `llm_input` และ `llm_output` ของ OpenClaw
เป็นการสังเกตระดับ adapter ไม่ใช่การจับ payload ของคำขอภายในหรือ Compaction ของ
Codex แบบตรง byte-for-byte

การแจ้งเตือน Codex native `hook/started` และ `hook/completed` จาก app-server
จะถูกฉายเป็นเหตุการณ์ agent `codex_app_server.hook` สำหรับ trajectory และการดีบัก
สิ่งเหล่านี้ไม่ได้เรียกใช้ hook ของ Plugin OpenClaw

## สัญญาการรองรับ V1

โหมด Codex ไม่ใช่ PI ที่มี model call อื่นซ่อนอยู่ด้านล่าง Codex เป็นเจ้าของ
native model loop มากกว่า และ OpenClaw ปรับพื้นผิว Plugin และเซสชันของตน
รอบขอบเขตนั้น

รองรับใน Codex runtime v1:

| พื้นผิว                                      | การรองรับ                                | เหตุผล                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ลูปโมเดล OpenAI ผ่าน Codex                   | รองรับ                                  | Codex app-server เป็นเจ้าของ turn ของ OpenAI, native thread resume และ native tool continuation                                                                                                      |
| การกำหนดเส้นทางและการส่งมอบช่องทาง OpenClaw | รองรับ                                  | Telegram, Discord, Slack, WhatsApp, iMessage และช่องทางอื่นยังอยู่นอก model runtime                                                                                                                   |
| เครื่องมือ dynamic ของ OpenClaw              | รองรับ                                  | Codex ขอให้ OpenClaw ดำเนินการเครื่องมือเหล่านี้ ดังนั้น OpenClaw จึงยังอยู่ในเส้นทางการดำเนินการ                                                                                                  |
| Prompt และ context plugins                   | รองรับ                                  | OpenClaw สร้าง prompt overlay และฉาย context เข้าไปใน turn ของ Codex ก่อนเริ่มหรือ resume เธรด                                                                                                      |
| วงจรชีวิต context engine                     | รองรับ                                  | การ assemble, ingest หรือการบำรุงรักษาหลัง turn และการประสานงาน Compaction ของ context-engine จะรันสำหรับ turn ของ Codex                                                                            |
| Dynamic tool hooks                            | รองรับ                                  | `before_tool_call`, `after_tool_call` และ middleware ของ tool-result รันรอบเครื่องมือ dynamic ที่ OpenClaw เป็นเจ้าของ                                                                              |
| Lifecycle hooks                               | รองรับในฐานะการสังเกตของ adapter       | `llm_input`, `llm_output`, `agent_end`, `before_compaction` และ `after_compaction` ถูกเรียกด้วย payload โหมด Codex ที่ตรงไปตรงมา                                                                   |
| Final-answer revision gate                    | รองรับผ่าน native hook relay            | Codex `Stop` ถูก relay ไปยัง `before_agent_finalize`; `revise` ขอให้ Codex ทำ model pass อีกหนึ่งครั้งก่อน finalization                                                                             |
| การ block หรือสังเกต native shell, patch และ MCP | รองรับผ่าน native hook relay            | Codex `PreToolUse` และ `PostToolUse` ถูก relay สำหรับพื้นผิว native tool ที่ committed รวมถึง payload MCP บน Codex app-server `0.125.0` หรือใหม่กว่า รองรับการ block แต่ไม่รองรับการเขียน argument ใหม่ |
| Native permission policy                      | รองรับผ่าน native hook relay            | Codex `PermissionRequest` สามารถถูกส่งผ่านนโยบาย OpenClaw เมื่อ runtime เปิดเผย หาก OpenClaw ไม่ส่งคืนการตัดสินใจ Codex จะดำเนินต่อผ่าน guardian ปกติหรือเส้นทางอนุมัติของผู้ใช้                  |
| การจับ trajectory ของ app-server             | รองรับ                                  | OpenClaw บันทึกคำขอที่ส่งไปยัง app-server และการแจ้งเตือนจาก app-server ที่ได้รับ                                                                                                                    |

ไม่รองรับใน Codex runtime v1:

| พื้นผิว                                             | ขอบเขต V1                                                                                                                                      | เส้นทางในอนาคต                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| การเปลี่ยน argument ของ native tool                 | native pre-tool hooks ของ Codex สามารถ block ได้ แต่ OpenClaw ไม่เขียน argument ของ Codex-native tool ใหม่                                     | ต้องใช้การรองรับ hook/schema ของ Codex สำหรับ input เครื่องมือทดแทน                           |
| ประวัติ transcript ดั้งเดิมของ Codex ที่แก้ไขได้   | Codex เป็นเจ้าของประวัติเธรดดั้งเดิมแบบ canonical OpenClaw เป็นเจ้าของ mirror และสามารถฉาย context ในอนาคตได้ แต่ไม่ควรแก้ไข internals ที่ไม่รองรับ | เพิ่ม API ของ Codex app-server อย่างชัดเจน หากต้องทำ native thread surgery                    |
| `tool_result_persist` สำหรับระเบียน Codex-native tool | hook นั้น transform การเขียน transcript ที่ OpenClaw เป็นเจ้าของ ไม่ใช่ระเบียน Codex-native tool                                               | อาจ mirror ระเบียนที่ transform แล้วได้ แต่การเขียน canonical ใหม่ต้องใช้การรองรับจาก Codex |
| เมตาดาต้า native compaction แบบ rich               | OpenClaw สังเกตการเริ่มและเสร็จสิ้นของ Compaction แต่ไม่ได้รับรายการ kept/dropped ที่เสถียร, token delta หรือ summary payload                 | ต้องมีเหตุการณ์ Compaction ของ Codex ที่ richer                                               |
| การแทรกแซง Compaction                              | hook Compaction ปัจจุบันของ OpenClaw เป็นระดับการแจ้งเตือนในโหมด Codex                                                                         | เพิ่ม hook ก่อน/หลัง Compaction ของ Codex หาก plugins ต้อง veto หรือเขียน native compaction ใหม่ |
| การจับคำขอ model API แบบ byte-for-byte             | OpenClaw สามารถจับคำขอและการแจ้งเตือนของ app-server ได้ แต่ Codex core สร้างคำขอ OpenAI API สุดท้ายภายใน                                     | ต้องมีเหตุการณ์ trace คำขอโมเดลของ Codex หรือ debug API                                      |

## เครื่องมือ สื่อ และ Compaction

Codex harness เปลี่ยนเฉพาะตัว executor ของ agent ฝังตัวระดับล่างเท่านั้น

OpenClaw ยังคงสร้างรายการเครื่องมือและรับผลลัพธ์ dynamic tool จาก harness
ข้อความ รูปภาพ วิดีโอ เพลง TTS การอนุมัติ และ output ของ messaging-tool
ยังคงผ่านเส้นทางการส่งมอบปกติของ OpenClaw

native hook relay ถูกออกแบบให้เป็น generic โดยตั้งใจ แต่สัญญาการรองรับ v1
จำกัดอยู่ที่เส้นทาง Codex-native tool และ permission ที่ OpenClaw ทดสอบ ใน
Codex runtime สิ่งนั้นรวม payload ของ shell, patch และ MCP `PreToolUse`,
`PostToolUse` และ `PermissionRequest` อย่าสันนิษฐานว่าเหตุการณ์ hook ของ Codex
ทุกอย่างในอนาคตเป็นพื้นผิว Plugin ของ OpenClaw จนกว่าสัญญา runtime จะระบุไว้

สำหรับ `PermissionRequest` OpenClaw จะส่งคืนเฉพาะการตัดสินใจ allow หรือ deny
อย่างชัดเจนเมื่อนโยบายตัดสินใจ ผลลัพธ์แบบไม่มีการตัดสินใจไม่ใช่การ allow Codex
ถือว่าสิ่งนี้ไม่มีการตัดสินใจจาก hook และปล่อยผ่านไปยัง guardian ของตนเองหรือ
เส้นทางอนุมัติของผู้ใช้

การขออนุมัติ tool MCP ของ Codex จะถูกส่งผ่าน flow การอนุมัติ Plugin ของ OpenClaw
เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น `"mcp_tool_call"`
prompt ของ Codex `request_user_input` จะถูกส่งกลับไปยังแชตต้นทาง และข้อความ follow-up
ถัดไปในคิวจะตอบ native server request นั้น แทนที่จะถูกกำหนดเส้นทางเป็น context เพิ่มเติม
คำขอ MCP elicitation อื่นยังคง fail closed

คิวกำกับรันที่กำลังทำงานแมปกับ `turn/steer` ของ app-server ของ Codex ด้วยค่าเริ่มต้น `messages.queue.mode: "steer"` OpenClaw จะรวมข้อความแชทที่อยู่ในคิวตามช่วงเวลานิ่งที่กำหนดค่าไว้ แล้วส่งเป็นคำขอ `turn/steer` เดียวตามลำดับที่เข้ามา โหมด `queue` แบบเดิมจะส่งคำขอ `turn/steer` แยกกัน เทิร์นตรวจทานของ Codex และเทิร์น Compaction แบบแมนนวลอาจปฏิเสธการกำกับในเทิร์นเดียวกันได้ ซึ่งในกรณีนั้น OpenClaw จะใช้คิวติดตามผลเมื่อโหมดที่เลือกอนุญาตให้ใช้ fallback ดู [คิวการกำกับ](/th/concepts/queue-steering)

เมื่อโมเดลที่เลือกใช้ harness ของ Codex การ Compaction เธรดเนทีฟจะถูกมอบหมายให้ app-server ของ Codex OpenClaw เก็บสำเนาถอดความแบบมิเรอร์ไว้สำหรับประวัติช่องทาง การค้นหา `/new` `/reset` และการสลับโมเดลหรือ harness ในอนาคต มิเรอร์นี้รวมพรอมต์ของผู้ใช้ ข้อความสุดท้ายของผู้ช่วย และเรคคอร์ดการให้เหตุผลหรือแผนแบบเบาของ Codex เมื่อ app-server ส่งออกมา ในตอนนี้ OpenClaw บันทึกเฉพาะสัญญาณเริ่มต้นและเสร็จสิ้นของ Compaction เนทีฟเท่านั้น ยังไม่ได้เปิดเผยสรุป Compaction ที่มนุษย์อ่านได้ หรือรายการตรวจสอบย้อนหลังได้ว่า Codex เก็บรายการใดไว้หลัง Compaction

เนื่องจาก Codex เป็นเจ้าของเธรดเนทีฟตามหลักฐานอ้างอิง `tool_result_persist` จึงยังไม่เขียนเรคคอร์ดผลลัพธ์เครื่องมือแบบเนทีฟของ Codex ใหม่ในปัจจุบัน ค่านี้มีผลเฉพาะเมื่อ OpenClaw กำลังเขียนผลลัพธ์เครื่องมือของสำเนาถอดความเซสชันที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่ต้องใช้ PI รูปภาพ วิดีโอ เพลง PDF TTS และการทำความเข้าใจสื่อยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลที่ตรงกัน เช่น `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ `messages.tts`

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็นผู้ให้บริการ `/model` ปกติ:** นี่เป็นพฤติกรรมที่คาดไว้สำหรับการกำหนดค่าใหม่ เลือกโมเดล `openai/gpt-*` ที่มี `agentRuntime.id: "codex"` (หรืออ้างอิง `codex/*` แบบเดิม) เปิดใช้ `plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ไม่ได้ยกเว้น `codex`

**OpenClaw ใช้ PI แทน Codex:** `agentRuntime.id: "auto"` ยังสามารถใช้ PI เป็นแบ็กเอนด์ความเข้ากันได้เมื่อไม่มี harness ของ Codex รับรัน ตั้งค่า `agentRuntime.id: "codex"` เพื่อบังคับเลือก Codex ระหว่างทดสอบ ตอนนี้รันไทม์ Codex ที่ถูกบังคับจะล้มเหลวแทนที่จะ fallback ไปยัง PI เว้นแต่คุณจะตั้งค่า `agentRuntime.fallback: "pi"` อย่างชัดเจน เมื่อเลือก app-server ของ Codex แล้ว ความล้มเหลวของมันจะแสดงโดยตรงโดยไม่ต้องมีการกำหนดค่า fallback เพิ่มเติม

**app-server ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้ handshake ของ app-server รายงานเวอร์ชัน `0.125.0` หรือใหม่กว่า เวอร์ชัน prerelease ของเวอร์ชันเดียวกันหรือเวอร์ชันที่มีส่วนต่อท้าย build เช่น `0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะฐานขั้นต่ำของโปรโตคอลเสถียร `0.125.0` คือสิ่งที่ OpenClaw ทดสอบ

**การค้นหาโมเดลช้า:** ลดค่า `plugins.entries.codex.config.discovery.timeoutMs` หรือปิดใช้การค้นหา

**การขนส่ง WebSocket ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken` และให้แน่ใจว่า app-server ระยะไกลพูดโปรโตคอล app-server ของ Codex เวอร์ชันเดียวกัน

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นพฤติกรรมที่คาดไว้ เว้นแต่คุณบังคับ `agentRuntime.id: "codex"` สำหรับเอเจนต์นั้น หรือเลือกอ้างอิง `codex/*` แบบเดิม อ้างอิง `openai/gpt-*` ทั่วไปและอ้างอิงผู้ให้บริการอื่นจะยังอยู่บนเส้นทางผู้ให้บริการปกติในโหมด `auto` หากคุณบังคับ `agentRuntime.id: "codex"` ทุกเทิร์นแบบฝังสำหรับเอเจนต์นั้นต้องเป็นโมเดล OpenAI ที่ Codex รองรับ

**ติดตั้ง Computer Use แล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ `/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงาน `Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงอยู่ ให้รีสตาร์ท Gateway เพื่อล้างการลงทะเบียน native hook ที่ค้างอยู่ หาก `computer-use.list_apps` หมดเวลา ให้รีสตาร์ท Codex Computer Use หรือ Codex Desktop แล้วลองอีกครั้ง

## ที่เกี่ยวข้อง

- [Plugin harness ของเอเจนต์](/th/plugins/sdk-agent-harness)
- [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [สถานะ](/th/cli/status)
- [hook ของ Plugin](/th/plugins/hooks)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
