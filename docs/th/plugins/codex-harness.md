---
read_when:
    - คุณต้องการใช้ฮาร์เนส app-server ของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่าชุดควบคุมของ Codex
    - คุณต้องการให้การปรับใช้ที่ใช้เฉพาะ Codex ล้มเหลว แทนที่จะย้อนกลับไปใช้ PI
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่รวมมาให้
title: ฮาร์เนสของ Codex
x-i18n:
    generated_at: "2026-05-03T10:14:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83cb442bb2b87fdfe530619e8951bc8f4f5a7d3bfd68ca49eeb16bbdd8b189b4
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่รวมมาให้ช่วยให้ OpenClaw รันเทิร์นของเอเจนต์แบบฝังตัวผ่าน
เซิร์ฟเวอร์แอปของ Codex แทนฮาร์เนส PI ในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง ได้แก่
การค้นหาโมเดล การกลับไปใช้เธรดเดิมแบบเนทีฟ Compaction แบบเนทีฟ และการดำเนินการบนเซิร์ฟเวอร์แอป
OpenClaw ยังคงเป็นเจ้าของช่องทางแชท ไฟล์เซสชัน การเลือกโมเดล เครื่องมือ
การอนุมัติ การส่งสื่อ และมิเรอร์ทรานสคริปต์ที่มองเห็นได้

เมื่อเทิร์นแชทต้นทางรันผ่านฮาร์เนส Codex การตอบกลับที่มองเห็นได้จะใช้ค่าเริ่มต้นเป็น
เครื่องมือ `message` ของ OpenClaw หากการปรับใช้ไม่ได้กำหนดค่า
`messages.visibleReplies` ไว้อย่างชัดเจน เอเจนต์ยังสามารถจบเทิร์น Codex แบบส่วนตัวได้
โดยจะโพสต์ไปยังช่องทางก็ต่อเมื่อเรียก `message(action="send")` เท่านั้น ตั้งค่า
`messages.visibleReplies: "automatic"` เพื่อให้การตอบกลับสุดท้ายในแชทโดยตรงยังอยู่บน
เส้นทางการส่งอัตโนมัติแบบเดิม

เทิร์น Heartbeat ของ Codex ยังได้รับเครื่องมือ `heartbeat_respond` เป็นค่าเริ่มต้นด้วย เพื่อให้
เอเจนต์สามารถบันทึกได้ว่าการปลุกควรเงียบไว้หรือแจ้งเตือน โดยไม่ต้องเข้ารหัส
โฟลว์ควบคุมนั้นไว้ในข้อความสุดท้าย

หากคุณกำลังพยายามทำความเข้าใจภาพรวม ให้เริ่มที่
[รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) สรุปสั้น ๆ คือ:
`openai/gpt-5.5` คือการอ้างอิงโมเดล, `codex` คือรันไทม์ และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## การกำหนดค่าแบบเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ "Codex ใน OpenClaw" ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
การสมัครสมาชิก ChatGPT/Codex แล้วรันเทิร์นเอเจนต์แบบฝังตัวผ่านรันไทม์
เซิร์ฟเวอร์แอปของ Codex แบบเนทีฟ การอ้างอิงโมเดลยังคงอยู่ในรูปมาตรฐานเป็น
`openai/gpt-*`; การยืนยันตัวตนของการสมัครสมาชิกมาจากบัญชี/โปรไฟล์ Codex ไม่ใช่
จากคำนำหน้าโมเดล `openai-codex/*`

ก่อนอื่นให้ลงชื่อเข้าใช้ด้วย Codex OAuth หากยังไม่ได้ทำ:

```bash
openclaw models auth login --provider openai-codex
```

จากนั้นเปิดใช้ Plugin `codex` ที่รวมมาให้และบังคับใช้รันไทม์ Codex:

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

หากการกำหนดค่าของคุณใช้ `plugins.allow` ให้ใส่ `codex` ไว้ตรงนั้นด้วย:

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

อย่าใช้ `openai-codex/gpt-*` เมื่อคุณหมายถึงรันไทม์ Codex แบบเนทีฟ คำนำหน้านั้น
คือเส้นทาง "Codex OAuth ผ่าน PI" แบบชัดเจน การเปลี่ยนแปลงการกำหนดค่ามีผลกับเซสชันใหม่หรือ
เซสชันที่รีเซ็ตแล้ว เซสชันที่มีอยู่จะคงรันไทม์ที่บันทึกไว้

## สิ่งที่ Plugin นี้เปลี่ยนแปลง

Plugin `codex` ที่รวมมาให้เพิ่มความสามารถแยกกันหลายอย่าง:

| ความสามารถ                        | วิธีใช้                                      | สิ่งที่ทำ                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| รันไทม์แบบฝังตัวเนทีฟ           | `agentRuntime.id: "codex"`                          | รันเทิร์นเอเจนต์แบบฝังตัวของ OpenClaw ผ่านเซิร์ฟเวอร์แอปของ Codex                  |
| คำสั่งควบคุมแชทแบบเนทีฟ      | `/codex bind`, `/codex resume`, `/codex steer`, ... | ผูกและควบคุมเธรดเซิร์ฟเวอร์แอปของ Codex จากการสนทนาในระบบส่งข้อความ    |
| ผู้ให้บริการ/แคตตาล็อกเซิร์ฟเวอร์แอปของ Codex | `codex` internals, surfaced through the harness     | ให้รันไทม์ค้นหาและตรวจสอบโมเดลเซิร์ฟเวอร์แอป                     |
| เส้นทางการเข้าใจสื่อของ Codex    | `codex/*` image-model compatibility paths           | รันเทิร์นเซิร์ฟเวอร์แอปของ Codex แบบมีขอบเขตสำหรับโมเดลเข้าใจภาพที่รองรับ |
| รีเลย์ฮุกแบบเนทีฟ                 | Plugin hooks around Codex-native events             | ให้ OpenClaw สังเกต/บล็อกเหตุการณ์เครื่องมือ/การจบงานแบบเนทีฟของ Codex ที่รองรับ  |

การเปิดใช้ Plugin ทำให้ความสามารถเหล่านั้นพร้อมใช้งาน แต่จะ **ไม่**:

- เริ่มใช้ Codex สำหรับทุกโมเดล OpenAI
- แปลงการอ้างอิงโมเดล `openai-codex/*` ให้เป็นรันไทม์แบบเนทีฟ
- ทำให้ ACP/acpx เป็นเส้นทาง Codex ค่าเริ่มต้น
- สลับร้อนเซสชันที่มีอยู่ซึ่งบันทึกรันไทม์ PI ไว้แล้ว
- แทนที่การส่งผ่านช่องทางของ OpenClaw, ไฟล์เซสชัน, ที่เก็บโปรไฟล์การยืนยันตัวตน หรือ
  การกำหนดเส้นทางข้อความ

Plugin เดียวกันนี้ยังเป็นเจ้าของพื้นผิวคำสั่งควบคุมแชท `/codex` แบบเนทีฟด้วย หาก
Plugin เปิดใช้งานอยู่และผู้ใช้ขอให้ผูก กลับไปใช้ ควบคุมทิศทาง หยุด หรือตรวจสอบ
เธรด Codex จากแชท เอเจนต์ควรเลือกใช้ `/codex ...` แทน ACP โดย ACP ยังคงเป็น
ทางสำรองแบบชัดเจนเมื่อผู้ใช้ขอ ACP/acpx หรือกำลังทดสอบอะแดปเตอร์ ACP
ของ Codex

เทิร์น Codex แบบเนทีฟยังคงใช้ฮุกของ Plugin ใน OpenClaw เป็นชั้นความเข้ากันได้สาธารณะ
สิ่งเหล่านี้คือฮุก OpenClaw ในโปรเซส ไม่ใช่ฮุกคำสั่ง `hooks.json` ของ Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` สำหรับเรคคอร์ดทรานสคริปต์ที่มิเรอร์
- `before_agent_finalize` ผ่านรีเลย์ `Stop` ของ Codex
- `agent_end`

Plugin ยังสามารถลงทะเบียนมิดเดิลแวร์ผลลัพธ์เครื่องมือที่เป็นกลางต่อรันไทม์ เพื่อเขียนใหม่
ผลลัพธ์เครื่องมือแบบไดนามิกของ OpenClaw หลังจาก OpenClaw ดำเนินการเครื่องมือและก่อนที่
ผลลัพธ์จะถูกส่งกลับไปยัง Codex สิ่งนี้แยกจากฮุก Plugin สาธารณะ
`tool_result_persist` ซึ่งแปลงการเขียนผลลัพธ์เครื่องมือในทรานสคริปต์ที่ OpenClaw เป็นเจ้าของ

สำหรับความหมายของฮุก Plugin เอง ดู [ฮุกของ Plugin](/th/plugins/hooks)
และ [พฤติกรรมการป้องกันของ Plugin](/th/tools/plugin)

ฮาร์เนสปิดอยู่โดยค่าเริ่มต้น การกำหนดค่าใหม่ควรเก็บการอ้างอิงโมเดล OpenAI
ให้อยู่ในรูปมาตรฐานเป็น `openai/gpt-*` และบังคับใช้
`agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` อย่างชัดเจนเมื่อ
ต้องการการดำเนินการบนเซิร์ฟเวอร์แอปแบบเนทีฟ การอ้างอิงโมเดล `codex/*` แบบเดิมยังคงเลือก
ฮาร์เนสอัตโนมัติเพื่อความเข้ากันได้ แต่คำนำหน้าผู้ให้บริการเดิมที่มีรันไทม์รองรับ
จะไม่แสดงเป็นตัวเลือกโมเดล/ผู้ให้บริการปกติ

หาก Plugin `codex` เปิดใช้งานอยู่แต่โมเดลหลักยังเป็น
`openai-codex/*`, `openclaw doctor` จะเตือนแทนการเปลี่ยนเส้นทาง นั่นเป็น
พฤติกรรมที่ตั้งใจไว้: `openai-codex/*` ยังคงเป็นเส้นทาง PI Codex OAuth/การสมัครสมาชิก และ
การดำเนินการบนเซิร์ฟเวอร์แอปแบบเนทีฟยังคงเป็นตัวเลือกรันไทม์ที่ต้องระบุชัดเจน

## แผนผังเส้นทาง

ใช้ตารางนี้ก่อนเปลี่ยนการกำหนดค่า:

| พฤติกรรมที่ต้องการ                                     | การอ้างอิงโมเดล                  | การกำหนดค่ารันไทม์                         | เส้นทางการยืนยันตัวตน/โปรไฟล์           | ป้ายสถานะที่คาดหวัง          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth หรือบัญชี Codex | `Runtime: OpenAI Codex`        |
| OpenAI API ผ่านรันเนอร์ OpenClaw ปกติ            | `openai/gpt-*`             | ละไว้หรือ `runtime: "pi"`             | คีย์ OpenAI API               | `Runtime: OpenClaw Pi Default` |
| การสมัครสมาชิก ChatGPT/Codex ผ่าน PI                | `openai-codex/gpt-*`       | ละไว้หรือ `runtime: "pi"`             | ผู้ให้บริการ OpenAI Codex OAuth  | `Runtime: OpenClaw Pi Default` |
| ผู้ให้บริการแบบผสมพร้อมโหมดอัตโนมัติแบบระมัดระวัง          | การอ้างอิงเฉพาะผู้ให้บริการ     | `agentRuntime.id: "auto"`              | ตามผู้ให้บริการที่เลือก        | ขึ้นอยู่กับรันไทม์ที่เลือก    |
| เซสชันอะแดปเตอร์ ACP ของ Codex แบบระบุชัดเจน                   | ขึ้นอยู่กับพรอมป์/โมเดล ACP | `sessions_spawn` พร้อม `runtime: "acp"` | การยืนยันตัวตนของแบ็กเอนด์ ACP             | สถานะงาน/เซสชัน ACP        |

จุดแบ่งสำคัญคือผู้ให้บริการกับรันไทม์:

- `openai-codex/*` ตอบคำถามว่า "PI ควรใช้เส้นทางผู้ให้บริการ/การยืนยันตัวตนใด"
- `agentRuntime.id: "codex"` ตอบคำถามว่า "ลูปใดควรดำเนินการเทิร์นแบบฝังตัวนี้"
- `/codex ...` ตอบคำถามว่า "การสนทนา Codex แบบเนทีฟใดที่แชทนี้ควรผูก
  หรือควบคุม"
- ACP ตอบคำถามว่า "โปรเซสฮาร์เนสภายนอกใดที่ acpx ควรเปิดใช้"

## เลือกคำนำหน้าโมเดลให้ถูกต้อง

เส้นทางตระกูล OpenAI ขึ้นกับคำนำหน้า สำหรับการตั้งค่าทั่วไปที่ใช้การสมัครสมาชิกพร้อม
รันไทม์ Codex แบบเนทีฟ ให้ใช้ `openai/*` พร้อม `agentRuntime.id: "codex"`
ใช้ `openai-codex/*` เฉพาะเมื่อคุณตั้งใจต้องการ Codex OAuth ผ่าน PI:

| การอ้างอิงโมเดล                                     | เส้นทางรันไทม์                                 | ใช้เมื่อ                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | ผู้ให้บริการ OpenAI ผ่านระบบเชื่อมต่อ OpenClaw/PI | คุณต้องการเข้าถึง OpenAI Platform API โดยตรงในปัจจุบันด้วย `OPENAI_API_KEY` |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth ผ่าน OpenClaw/PI       | คุณต้องการการยืนยันตัวตนของการสมัครสมาชิก ChatGPT/Codex ด้วยรันเนอร์ PI ค่าเริ่มต้น      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | ฮาร์เนสเซิร์ฟเวอร์แอปของ Codex                     | คุณต้องการการยืนยันตัวตนของการสมัครสมาชิก ChatGPT/Codex พร้อมการดำเนินการ Codex แบบเนทีฟ     |

GPT-5.5 อาจปรากฏได้ทั้งบนเส้นทางคีย์ OpenAI API โดยตรงและเส้นทางการสมัครสมาชิก Codex
เมื่อบัญชีของคุณเปิดเผยเส้นทางเหล่านั้น ใช้ `openai/gpt-5.5` พร้อมฮาร์เนสเซิร์ฟเวอร์แอป
ของ Codex สำหรับรันไทม์ Codex แบบเนทีฟ, `openai-codex/gpt-5.5` สำหรับ PI OAuth หรือ
`openai/gpt-5.5` โดยไม่มีการ override รันไทม์ Codex สำหรับทราฟฟิกคีย์ API โดยตรง

การอ้างอิง `codex/gpt-*` แบบเดิมยังคงยอมรับเป็นนามแฝงเพื่อความเข้ากันได้ การย้ายข้อมูล
เพื่อความเข้ากันได้ของ doctor จะเขียนการอ้างอิงรันไทม์หลักเดิมใหม่เป็นการอ้างอิงโมเดล
แบบมาตรฐานและบันทึกนโยบายรันไทม์แยกต่างหาก ขณะที่การอ้างอิงเดิมที่ใช้เฉพาะทางสำรอง
จะถูกปล่อยไว้ไม่เปลี่ยนแปลง เพราะรันไทม์ถูกกำหนดค่าสำหรับคอนเทนเนอร์เอเจนต์ทั้งหมด
การกำหนดค่า PI Codex OAuth ใหม่ควรใช้ `openai-codex/gpt-*`; การกำหนดค่าฮาร์เนส
เซิร์ฟเวอร์แอปแบบเนทีฟใหม่ควรใช้ `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"`

`agents.defaults.imageModel` ใช้การแยกตามคำนำหน้าแบบเดียวกัน ใช้
`openai-codex/gpt-*` เมื่อการเข้าใจภาพควรรันผ่านเส้นทางผู้ให้บริการ OpenAI
Codex OAuth ใช้ `codex/gpt-*` เมื่อการเข้าใจภาพควรรันผ่านเทิร์นเซิร์ฟเวอร์แอป
ของ Codex แบบมีขอบเขต โมเดลเซิร์ฟเวอร์แอปของ Codex ต้องประกาศว่ารองรับอินพุตภาพ;
โมเดล Codex แบบข้อความเท่านั้นจะล้มเหลวก่อนเทิร์นสื่อเริ่มต้น

ใช้ `/status` เพื่อยืนยันฮาร์เนสที่มีผลสำหรับเซสชันปัจจุบัน หากการเลือกดูน่าแปลกใจ
ให้เปิดใช้ล็อกดีบักสำหรับระบบย่อย `agents/harness`
และตรวจสอบเรคคอร์ด `agent harness selected` แบบมีโครงสร้างของ Gateway เรคคอร์ดนี้
รวมรหัสฮาร์เนสที่เลือก เหตุผลการเลือก นโยบายรันไทม์/ทางสำรอง และ
ในโหมด `auto` ผลลัพธ์การรองรับของตัวเลือก Plugin แต่ละรายการ

### คำเตือนจาก doctor หมายถึงอะไร

`openclaw doctor` จะเตือนเมื่อทั้งหมดต่อไปนี้เป็นจริง:

- Plugin `codex` ที่รวมมาให้ถูกเปิดใช้งานหรืออนุญาต
- โมเดลหลักของเอเจนต์เป็น `openai-codex/*`
- รันไทม์ที่มีผลของเอเจนต์นั้นไม่ใช่ `codex`

คำเตือนนั้นมีอยู่เพราะผู้ใช้มักคาดว่า "เปิดใช้ Plugin Codex" จะหมายถึง
"รันไทม์เซิร์ฟเวอร์แอป Codex แบบเนทีฟ" OpenClaw ไม่ได้สรุปข้ามขั้นแบบนั้น คำเตือน
หมายความว่า:

- **ไม่จำเป็นต้องเปลี่ยนแปลง** หากคุณตั้งใจใช้ ChatGPT/Codex OAuth ผ่าน PI
- เปลี่ยนโมเดลเป็น `openai/<model>` และตั้งค่า
  `agentRuntime.id: "codex"` หากคุณตั้งใจใช้การดำเนินการบนเซิร์ฟเวอร์แอป
  แบบเนทีฟ
- เซสชันที่มีอยู่ยังต้องใช้ `/new` หรือ `/reset` หลังจากเปลี่ยนรันไทม์
  เพราะการตรึงรันไทม์ของเซสชันจะคงอยู่

การเลือกฮาร์เนสไม่ใช่ตัวควบคุมเซสชันสด เมื่อเทิร์นแบบฝังตัวรัน
OpenClaw จะบันทึกรหัสฮาร์เนสที่เลือกไว้บนเซสชันนั้นและใช้ต่อไปสำหรับ
เทิร์นถัดไปในรหัสเซสชันเดียวกัน เปลี่ยนการกำหนดค่า `agentRuntime` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อคุณต้องการให้เซสชันในอนาคตใช้ฮาร์เนสอื่น;
ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับการสนทนาที่มีอยู่
ระหว่าง PI และ Codex วิธีนี้หลีกเลี่ยงการเล่นทรานสคริปต์เดียวซ้ำผ่าน
ระบบเซสชันเนทีฟสองระบบที่เข้ากันไม่ได้

เซสชันเดิมที่สร้างก่อนมีการตรึงฮาร์เนสจะถือว่าถูกตรึงกับ PI เมื่อมี
ประวัติทรานสคริปต์แล้ว ใช้ `/new` หรือ `/reset` เพื่อนำการสนทนานั้นเข้าสู่
Codex หลังจากเปลี่ยนการกำหนดค่า

`/status` แสดง runtime ของโมเดลที่มีผลใช้งานอยู่ harness เริ่มต้นของ PI จะแสดงเป็น
`Runtime: OpenClaw Pi Default` และ harness ของ Codex app-server จะแสดงเป็น
`Runtime: OpenAI Codex`

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` ที่มาพร้อมชุดติดตั้งพร้อมใช้งาน
- Codex app-server `0.125.0` หรือใหม่กว่า โดยค่าเริ่มต้น Plugin ที่มาพร้อมชุดติดตั้งจะจัดการไบนารี Codex app-server ที่เข้ากันได้ ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH` จะไม่กระทบการเริ่มต้น harness ตามปกติ
- มีการยืนยันตัวตน Codex ให้กระบวนการ app-server หรือให้บริดจ์การยืนยันตัวตน Codex ของ OpenClaw การเปิด app-server ภายในเครื่องจะใช้โฮม Codex ที่ OpenClaw จัดการให้แต่ละ agent และ `HOME` ของกระบวนการลูกที่แยกไว้ต่างหาก ดังนั้นโดยค่าเริ่มต้นจะไม่อ่านบัญชี `~/.codex` ส่วนตัว, skills, plugins, config, thread state หรือ `$HOME/.agents/skills` แบบเนทีฟของคุณ

Plugin จะบล็อกการ handshake ของ app-server ที่เก่าเกินไปหรือไม่มีเวอร์ชัน วิธีนี้ทำให้
OpenClaw อยู่บนพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้ว

สำหรับการทดสอบ smoke แบบ live และ Docker การยืนยันตัวตนมักมาจากบัญชี Codex CLI
หรือโปรไฟล์การยืนยันตัวตน `openai-codex` ของ OpenClaw การเปิด stdio app-server ในเครื่องยังสามารถ fallback ไปที่ `CODEX_API_KEY` / `OPENAI_API_KEY` ได้เมื่อไม่มีบัญชีอยู่

## ไฟล์เริ่มต้น workspace

Codex จัดการ `AGENTS.md` ด้วยตัวเองผ่านการค้นหาเอกสารโปรเจกต์แบบเนทีฟ OpenClaw
จะไม่เขียนไฟล์เอกสารโปรเจกต์ Codex สังเคราะห์ หรือพึ่งพาชื่อไฟล์ fallback ของ Codex
สำหรับไฟล์ persona เพราะ fallback ของ Codex ใช้เฉพาะเมื่อไม่มี `AGENTS.md`

เพื่อให้ workspace ของ OpenClaw มี parity กัน harness ของ Codex จะ resolve ไฟล์เริ่มต้นอื่น ๆ
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` และ `MEMORY.md` เมื่อมีอยู่) แล้วส่งต่อผ่านคำสั่ง config ของ Codex
บน `thread/start` และ `thread/resume` วิธีนี้ทำให้ `SOUL.md` และ context persona/profile
ของ workspace ที่เกี่ยวข้องมองเห็นได้โดยไม่ต้องทำซ้ำ `AGENTS.md`

## เพิ่ม Codex คู่กับโมเดลอื่น

อย่าตั้ง `agentRuntime.id: "codex"` แบบ global หาก agent เดียวกันควรสลับได้อย่างอิสระระหว่าง Codex กับโมเดล provider ที่ไม่ใช่ Codex runtime ที่ถูกบังคับใช้จะใช้กับทุก turn ที่ฝังอยู่สำหรับ agent หรือ session นั้น หากคุณเลือกโมเดล Anthropic ขณะ runtime นั้นถูกบังคับใช้ OpenClaw จะยังคงลองใช้ harness ของ Codex และปิดด้วยความล้มเหลว แทนที่จะ route turn นั้นผ่าน PI อย่างเงียบ ๆ

ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้แทน:

- วาง Codex ไว้บน agent เฉพาะด้วย `agentRuntime.id: "codex"`
- คง agent เริ่มต้นไว้บน `agentRuntime.id: "auto"` และใช้ PI fallback สำหรับการใช้งาน provider แบบผสมตามปกติ
- ใช้ ref แบบ legacy `codex/*` เพื่อความเข้ากันได้เท่านั้น config ใหม่ควรใช้ `openai/*` ร่วมกับนโยบาย runtime Codex ที่ชัดเจน

ตัวอย่างนี้คง agent เริ่มต้นไว้บนการเลือกอัตโนมัติปกติ และเพิ่ม agent Codex แยกต่างหาก:

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

- agent เริ่มต้น `main` ใช้เส้นทาง provider ปกติและ fallback ความเข้ากันได้ของ PI
- agent `codex` ใช้ harness ของ Codex app-server
- หาก Codex ขาดหายหรือไม่รองรับสำหรับ agent `codex` turn จะล้มเหลวแทนที่จะใช้ PI อย่างเงียบ ๆ

## การ route คำสั่งของ agent

Agents ควร route คำขอผู้ใช้ตามเจตนา ไม่ใช่จากคำว่า "Codex" เพียงอย่างเดียว:

| ผู้ใช้ขอให้...                                       | Agent ควรใช้...                              |
| ------------------------------------------------------ | ------------------------------------------------ |
| "ผูกแชตนี้กับ Codex"                              | `/codex bind`                                    |
| "resume thread Codex `<id>` ที่นี่"                      | `/codex resume <id>`                             |
| "แสดง thread ของ Codex"                                   | `/codex threads`                                 |
| "ส่งรายงาน support สำหรับการรัน Codex ที่มีปัญหา"            | `/diagnostics [note]`                            |
| "ส่ง feedback ของ Codex สำหรับ thread ที่แนบมานี้เท่านั้น"    | `/codex diagnostics [note]`                      |
| "ใช้ subscription ChatGPT/Codex ของฉันกับ runtime Codex" | `openai/*` บวก `agentRuntime.id: "codex"`       |
| "ใช้ subscription ChatGPT/Codex ของฉันผ่าน PI"         | ref โมเดล `openai-codex/*`                      |
| "รัน Codex ผ่าน ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "เริ่ม Claude Code/Gemini/OpenCode/Cursor ใน thread" | ACP/acpx ไม่ใช่ `/codex` และไม่ใช่ sub-agent แบบเนทีฟ |

OpenClaw จะโฆษณาคำแนะนำการ spawn ของ ACP ให้ agents เฉพาะเมื่อ ACP เปิดใช้งาน,
dispatch ได้ และมี runtime backend ที่โหลดแล้วรองรับ หาก ACP ไม่พร้อมใช้งาน
system prompt และ Skills ของ Plugin ไม่ควรสอน agent เกี่ยวกับการ route ผ่าน ACP

## การ deploy แบบ Codex-only

บังคับใช้ harness ของ Codex เมื่อคุณต้องการพิสูจน์ว่า turn ของ embedded agent ทุกครั้ง
ใช้ Codex runtime ของ Plugin ที่ระบุชัดเจนจะปิดด้วยความล้มเหลว และจะไม่ retry ผ่าน PI อย่างเงียบ ๆ:

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

override ด้วย environment:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Plugin Codex ถูกปิดใช้งาน,
app-server เก่าเกินไป หรือ app-server เริ่มทำงานไม่ได้

## Codex ราย agent

คุณสามารถทำให้ agent หนึ่งเป็น Codex-only ขณะที่ agent เริ่มต้นยังคงใช้
auto-selection ปกติได้:

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

ใช้คำสั่ง session ปกติเพื่อสลับ agents และโมเดล `/new` สร้าง session OpenClaw ใหม่
และ harness ของ Codex จะสร้างหรือ resume thread app-server sidecar ตามต้องการ
`/reset` ล้างการผูก session OpenClaw สำหรับ thread นั้น และให้ turn ถัดไป resolve harness จาก config ปัจจุบันอีกครั้ง

## การค้นหาโมเดล

โดยค่าเริ่มต้น Plugin Codex จะถาม app-server สำหรับโมเดลที่มีให้ใช้งาน หาก
discovery ล้มเหลวหรือหมดเวลา ระบบจะใช้แคตตาล็อก fallback ที่มาพร้อมชุดติดตั้งสำหรับ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

คุณสามารถปรับ discovery ได้ใต้ `plugins.entries.codex.config.discovery`:

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

ปิด discovery เมื่อคุณต้องการให้ startup หลีกเลี่ยงการ probe Codex และยึดตาม
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

ไบนารีที่จัดการไว้นั้นจัดส่งมากับแพ็กเกจ Plugin `codex` วิธีนี้ทำให้เวอร์ชัน
app-server ผูกกับ Plugin ที่มาพร้อมชุดติดตั้ง แทนที่จะขึ้นกับ Codex CLI แยกต่างหากตัวใดก็ตามที่ติดตั้งอยู่ในเครื่อง ตั้งค่า `appServer.command` เฉพาะเมื่อคุณตั้งใจจะรัน executable อื่น

โดยค่าเริ่มต้น OpenClaw เริ่ม session harness Codex ภายในเครื่องในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือ posture ของ operator ภายในเครื่องที่เชื่อถือได้ ซึ่งใช้สำหรับ Heartbeat อัตโนมัติ: Codex สามารถใช้ shell และเครื่องมือเครือข่ายได้โดยไม่หยุดรอ native approval prompt ที่ไม่มีใครอยู่ตอบ

หากต้องการ opt in ไปใช้ approval ที่ Codex guardian review ให้ตั้ง `appServer.mode:
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

โหมด Guardian ใช้เส้นทาง approval แบบ auto-review เนทีฟของ Codex เมื่อ Codex ขอออกจาก sandbox, เขียนนอก workspace หรือเพิ่ม permission เช่นการเข้าถึงเครือข่าย Codex จะ route คำขอ approval นั้นไปยัง reviewer เนทีฟแทน human prompt reviewer จะใช้กรอบความเสี่ยงของ Codex แล้ว approve หรือ deny คำขอนั้นโดยเฉพาะ ใช้ Guardian เมื่อคุณต้องการ guardrails มากกว่าโหมด YOLO แต่ยังต้องให้ agents ที่ไม่มีคนดูแลเดินหน้าทำงานได้

preset `guardian` ขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"`
ฟิลด์นโยบายรายตัวยัง override `mode` ได้ ดังนั้นการ deploy ขั้นสูงสามารถผสม
preset กับตัวเลือกที่ระบุชัดเจนได้ ค่า reviewer แบบเก่า `guardian_subagent`
ยังรับเป็น alias เพื่อความเข้ากันได้ แต่ config ใหม่ควรใช้ `auto_review`

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

การเปิด stdio app-server จะสืบทอด environment ของกระบวนการ OpenClaw โดยค่าเริ่มต้น
แต่ OpenClaw เป็นเจ้าของบริดจ์บัญชี Codex app-server และตั้งทั้ง
`CODEX_HOME` และ `HOME` เป็นไดเรกทอรีราย agent ใต้ state ของ OpenClaw ของ agent นั้น ตัวโหลด Skills ของ Codex เองจะอ่าน `$CODEX_HOME/skills` และ
`$HOME/.agents/skills` ดังนั้นค่าทั้งสองจึงถูกแยกไว้สำหรับการเปิด app-server ภายในเครื่อง วิธีนี้ทำให้ Skills, plugins, config, accounts และ thread state แบบเนทีฟของ Codex อยู่ใน scope ของ OpenClaw agent แทนที่จะรั่วไหลมาจากโฮม Codex CLI ส่วนตัวของ operator

Plugins ของ OpenClaw และ snapshot ของ Skills ของ OpenClaw ยังไหลผ่าน registry ของ Plugin และตัวโหลด Skills ของ OpenClaw เอง asset ของ Codex CLI ส่วนตัวจะไม่ไหลผ่าน หากคุณมี Skills หรือ plugins ของ Codex CLI ที่เป็นประโยชน์และควรเป็นส่วนหนึ่งของ OpenClaw agent ให้ inventory อย่างชัดเจน:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

provider สำหรับ migration ของ Codex จะคัดลอก Skills เข้าไปใน workspace ของ OpenClaw agent ปัจจุบัน Plugins, hooks และไฟล์ config แบบเนทีฟของ Codex จะถูกรายงานหรือ archive เพื่อ review ด้วยตนเองแทนที่จะเปิดใช้งานโดยอัตโนมัติ เพราะสิ่งเหล่านี้สามารถ execute commands, expose MCP servers หรือพก credentials ได้

การยืนยันตัวตนจะถูกเลือกตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน Codex ของ OpenClaw ที่ระบุชัดเจนสำหรับ agent
2. บัญชีที่มีอยู่ของ app-server ในโฮม Codex ของ agent นั้น
3. สำหรับการเปิด stdio app-server ภายในเครื่องเท่านั้น, `CODEX_API_KEY` แล้วตามด้วย
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server อยู่และยังต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw เห็นโปรไฟล์การยืนยันตัวตน Codex แบบ subscription ของ ChatGPT ระบบจะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่ spawn ขึ้น วิธีนี้ทำให้ API keys ระดับ Gateway พร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้ turn ของ native Codex app-server ถูกคิดค่าใช้จ่ายผ่าน API โดยไม่ตั้งใจ
โปรไฟล์ Codex แบบ API-key ที่ระบุชัดเจนและ fallback env-key ของ local stdio จะใช้การ login ของ app-server แทน env ที่สืบทอดจาก child-process การเชื่อมต่อ WebSocket app-server
จะไม่ได้รับ fallback API-key จาก env ของ Gateway ให้ใช้โปรไฟล์การยืนยันตัวตนที่ระบุชัดเจนหรือบัญชีของ remote app-server เอง

หากการ deploy ต้องการการแยก environment เพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นใน
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

`appServer.clearEnv` มีผลเฉพาะกับกระบวนการลูก Codex app-server ที่ถูก spawn เท่านั้น

เครื่องมือแบบไดนามิกของ Codex ใช้โปรไฟล์ `native-first` เป็นค่าเริ่มต้น ในโหมดนั้น
OpenClaw จะไม่เปิดเผยเครื่องมือแบบไดนามิกที่ซ้ำกับการดำเนินการใน workspace
แบบ native ของ Codex ได้แก่ `read`, `write`, `edit`, `apply_patch`, `exec`, `process` และ
`update_plan` เครื่องมือผสานรวมของ OpenClaw เช่น การส่งข้อความ, sessions, สื่อ,
Cron, เบราว์เซอร์, Node, Gateway, `heartbeat_respond` และ `web_search` ยังคง
พร้อมใช้งาน

ฟิลด์ Plugin ของ Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น          | ความหมาย                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | ใช้ `"openclaw-compat"` เพื่อเปิดเผยชุดเครื่องมือแบบไดนามิกทั้งหมดของ OpenClaw ให้กับ Codex app-server |
| `codexDynamicToolsExclude` | `[]`             | ชื่อเครื่องมือแบบไดนามิกเพิ่มเติมของ OpenClaw ที่จะละเว้นจาก turn ของ Codex app-server               |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์               | ค่าเริ่มต้น                                  | ความหมาย                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` จะ spawn Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                             |
| `command`           | ไบนารี Codex ที่จัดการให้                     | executable สำหรับ stdio transport ปล่อยว่างไว้เพื่อใช้ไบนารีที่จัดการให้; ตั้งค่าเฉพาะเมื่อต้องการ override อย่างชัดเจน                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | อาร์กิวเมนต์สำหรับ stdio transport                                                                                                                                                                                                       |
| `url`               | ไม่ได้ตั้งค่า                                    | URL ของ WebSocket app-server                                                                                                                                                                                                            |
| `authToken`         | ไม่ได้ตั้งค่า                                    | Bearer token สำหรับ WebSocket transport                                                                                                                                                                                                |
| `headers`           | `{}`                                     | header เพิ่มเติมของ WebSocket                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่จะถูกลบออกจากกระบวนการ stdio app-server ที่ถูก spawn หลังจาก OpenClaw สร้างสภาพแวดล้อมที่รับสืบทอดมาแล้ว `CODEX_HOME` และ `HOME` ถูกสงวนไว้สำหรับการแยก Codex ต่อ agent ของ OpenClaw เมื่อ launch แบบ local |
| `requestTimeoutMs`  | `60000`                                  | timeout สำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | preset สำหรับการดำเนินการแบบ YOLO หรือที่ผ่านการตรวจทานโดย guardian                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | นโยบายการอนุมัติ native ของ Codex ที่ส่งไปยังการเริ่ม/resume/turn ของ thread                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | โหมด sandbox native ของ Codex ที่ส่งไปยังการเริ่ม/resume ของ thread                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทาน prompt การอนุมัติ native `guardian_subagent` ยังคงเป็น alias แบบ legacy                                                                                                                         |
| `serviceTier`       | ไม่ได้ตั้งค่า                                    | service tier ของ Codex app-server ที่เลือกได้: `"fast"`, `"flex"` หรือ `null` ค่า legacy ที่ไม่ถูกต้องจะถูกละเว้น                                                                                                                            |

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกจาก
`appServer.requestTimeoutMs`: คำขอ `item/tool/call` ของ Codex แต่ละรายการต้องได้รับ
การตอบกลับจาก OpenClaw ภายใน 30 วินาที เมื่อ timeout OpenClaw จะ abort สัญญาณ
เครื่องมือในจุดที่รองรับ และส่งคืนคำตอบเครื่องมือแบบไดนามิกที่ล้มเหลวให้ Codex เพื่อให้
turn ดำเนินต่อได้ แทนที่จะปล่อย session ไว้ในสถานะ `processing`

หลังจาก OpenClaw ตอบกลับคำขอ app-server ในขอบเขต turn ของ Codex แล้ว harness
ยังคาดหวังให้ Codex จบ turn native ด้วย `turn/completed` ด้วย หาก app-server
เงียบไป 60 วินาทีหลังจากคำตอบนั้น OpenClaw จะพยายาม interrupt turn ของ Codex
ตามความสามารถที่ทำได้ บันทึก diagnostic timeout และปล่อย lane ของ session
OpenClaw เพื่อไม่ให้ข้อความ chat ถัดไปถูกคิวไว้หลัง turn native ที่ค้างอยู่

override สภาพแวดล้อมยังคงพร้อมใช้งานสำหรับการทดสอบแบบ local:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้ามไบนารีที่จัดการให้เมื่อ
`appServer.command` ไม่ได้ตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกนำออกแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือใช้
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบ local แบบเฉพาะครั้ง ควรใช้ config
สำหรับ deployment ที่ทำซ้ำได้ เพราะทำให้พฤติกรรมของ Plugin อยู่ในไฟล์ที่ตรวจทานเดียวกันกับ
การตั้งค่า Codex harness ส่วนที่เหลือ

## การใช้คอมพิวเตอร์

การใช้คอมพิวเตอร์มีคู่มือตั้งค่าแยกต่างหาก:
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use)

สรุปสั้น ๆ: OpenClaw ไม่ vendor แอปควบคุมเดสก์ท็อปหรือดำเนินการบนเดสก์ท็อปเอง
แต่จะเตรียม Codex app-server ตรวจสอบว่า MCP server `computer-use`
พร้อมใช้งาน แล้วให้ Codex จัดการการเรียกเครื่องมือ MCP แบบ native ระหว่าง turn
ในโหมด Codex

สำหรับการเข้าถึง TryCua driver โดยตรงนอก flow ของ marketplace ของ Codex ให้ลงทะเบียน
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

สามารถตรวจสอบหรือติดตั้งการตั้งค่าได้จากพื้นผิวคำสั่ง:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

การใช้คอมพิวเตอร์ใช้ได้เฉพาะ macOS และอาจต้องการสิทธิ์ OS แบบ local ก่อนที่
Codex MCP server จะควบคุมแอปได้ หาก `computerUse.enabled` เป็น true และ MCP
server ไม่พร้อมใช้งาน turn ในโหมด Codex จะล้มเหลวก่อนเริ่ม thread แทนที่จะ
ทำงานต่อแบบเงียบ ๆ โดยไม่มีเครื่องมือการใช้คอมพิวเตอร์แบบ native ดู
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use) สำหรับตัวเลือก marketplace,
ข้อจำกัดของ catalog ระยะไกล, เหตุผลของสถานะ และการแก้ไขปัญหา

เมื่อ `computerUse.autoInstall` เป็น true OpenClaw สามารถลงทะเบียน marketplace
มาตรฐานของ Codex Desktop ที่ bundled มาจาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` หาก Codex
ยังไม่พบ marketplace แบบ local ใช้ `/new` หรือ `/reset` หลังจากเปลี่ยน runtime
หรือ config ของการใช้คอมพิวเตอร์ เพื่อไม่ให้ session ที่มีอยู่ยังเก็บ binding ของ PI
หรือ thread ของ Codex เก่าไว้

## สูตรทั่วไป

Codex แบบ local ด้วย stdio transport ค่าเริ่มต้น:

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

การอนุมัติ Codex ที่ตรวจทานโดย guardian:

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

app-server ระยะไกลพร้อม header ที่ระบุชัดเจน:

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

การสลับโมเดลยังคงควบคุมโดย OpenClaw เมื่อ session ของ OpenClaw แนบกับ
thread ของ Codex ที่มีอยู่ turn ถัดไปจะส่งโมเดล OpenAI, provider, นโยบายการอนุมัติ,
sandbox และ service tier ที่เลือกอยู่ในขณะนั้นไปยัง app-server อีกครั้ง การสลับจาก
`openai/gpt-5.5` เป็น `openai/gpt-5.2` จะคง binding ของ thread ไว้ แต่ขอให้
Codex ดำเนินการต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

Plugin ที่ bundled มาจะลงทะเบียน `/codex` เป็นคำสั่ง slash ที่ได้รับอนุญาต
คำสั่งนี้เป็นแบบทั่วไปและทำงานได้บนทุก channel ที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบทั่วไป:

- `/codex status` แสดงการเชื่อมต่อ app-server แบบ live, โมเดล, บัญชี, rate limit, MCP server และ Skills
- `/codex models` แสดงรายการโมเดล Codex app-server แบบ live
- `/codex threads [filter]` แสดงรายการ thread ล่าสุดของ Codex
- `/codex resume <thread-id>` แนบ session ปัจจุบันของ OpenClaw กับ thread ของ Codex ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server compact thread ที่แนบอยู่
- `/codex review` เริ่มการตรวจทาน native ของ Codex สำหรับ thread ที่แนบอยู่
- `/codex diagnostics [note]` ขออนุญาตก่อนส่ง feedback diagnostics ของ Codex สำหรับ thread ที่แนบอยู่
- `/codex computer-use status` ตรวจสอบ Plugin การใช้คอมพิวเตอร์และ MCP server ที่กำหนดค่าไว้
- `/codex computer-use install` ติดตั้ง Plugin การใช้คอมพิวเตอร์ที่กำหนดค่าไว้และ reload MCP server
- `/codex account` แสดงสถานะบัญชีและ rate-limit
- `/codex mcp` แสดงรายการสถานะ MCP server ของ Codex app-server
- `/codex skills` แสดงรายการ Skills ของ Codex app-server

### workflow การดีบักทั่วไป

เมื่อ agent ที่รองรับด้วย Codex ทำบางอย่างที่ไม่คาดคิดใน Telegram, Discord, Slack,
หรือ channel อื่น ให้เริ่มจากบทสนทนาที่เกิดปัญหา:

1. เรียกใช้ `/diagnostics bad tool choice after image upload` หรือโน้ตสั้นอื่น
   ที่อธิบายสิ่งที่คุณเห็น
2. อนุมัติคำขอ diagnostics หนึ่งครั้ง การอนุมัติจะสร้างไฟล์ zip diagnostics ของ Gateway
   ในเครื่อง และเนื่องจากเซสชันกำลังใช้ Codex harness จึงยัง
   ส่งชุด feedback ของ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
3. คัดลอกการตอบกลับ diagnostics ที่เสร็จแล้วไปยังรายงานบั๊กหรือเธรด support
   โดยจะมีพาธ bundle ในเครื่อง, สรุปความเป็นส่วนตัว, id เซสชัน OpenClaw,
   id เธรด Codex และบรรทัด `Inspect locally` สำหรับแต่ละเธรด Codex
4. หากคุณต้องการดีบักการรันด้วยตนเอง ให้รันคำสั่ง `Inspect locally`
   ที่พิมพ์ออกมาในเทอร์มินัล คำสั่งจะมีลักษณะเหมือน `codex resume <thread-id>` และเปิด
   เธรด Codex แบบ native เพื่อให้คุณตรวจสอบบทสนทนา, ทำต่อในเครื่อง,
   หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือแผนนั้น

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลด feedback ของ Codex
สำหรับเธรดที่แนบอยู่ปัจจุบันโดยเฉพาะ โดยไม่มี bundle diagnostics ของ OpenClaw
Gateway แบบเต็ม สำหรับรายงาน support ส่วนใหญ่ `/diagnostics [note]` เป็น
จุดเริ่มต้นที่ดีกว่า เพราะเชื่อมโยงสถานะ Gateway ในเครื่องและ id เธรด Codex
ไว้ด้วยกันในการตอบกลับเดียว ดู [การส่งออก Diagnostics](/th/gateway/diagnostics)
สำหรับโมเดลความเป็นส่วนตัวฉบับเต็มและพฤติกรรมในแชตกลุ่ม

OpenClaw หลักยังเปิดให้ใช้ `/diagnostics [note]` เฉพาะ owner ในฐานะคำสั่ง
diagnostics ทั่วไปของ Gateway ด้วย prompt การอนุมัติจะแสดงคำนำเกี่ยวกับข้อมูลละเอียดอ่อน,
ลิงก์ไปยัง [การส่งออก Diagnostics](/th/gateway/diagnostics), และขอเรียก
`openclaw gateway diagnostics export --json` ผ่านการอนุมัติ exec อย่างชัดเจน
ทุกครั้ง อย่าอนุมัติ diagnostics ด้วยกฎ allow-all หลังอนุมัติแล้ว
OpenClaw จะส่งรายงานที่วางต่อได้ พร้อมพาธ bundle ในเครื่องและสรุป manifest
เมื่อเซสชัน OpenClaw ที่ใช้งานอยู่กำลังใช้ Codex harness การอนุมัติเดียวกันนั้น
ยังอนุญาตให้ส่ง bundle feedback ของ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
prompt การอนุมัติจะแจ้งว่าจะส่ง feedback ของ Codex แต่จะไม่แสดง id เซสชัน
หรือเธรด Codex ก่อนอนุมัติ

หาก owner เรียกใช้ `/diagnostics` ในแชตกลุ่ม OpenClaw จะรักษาช่องทางที่แชร์ไว้ให้สะอาด:
กลุ่มจะได้รับเพียงประกาศสั้น ๆ ขณะที่คำนำ diagnostics, prompt การอนุมัติ,
และ id เซสชัน/เธรด Codex จะถูกส่งไปยัง owner ผ่านเส้นทางการอนุมัติส่วนตัว
หากไม่มีเส้นทาง owner ส่วนตัว OpenClaw จะปฏิเสธคำขอจากกลุ่มและขอให้ owner
รันจาก DM

การอัปโหลด Codex ที่ได้รับอนุมัติจะเรียก Codex app-server `feedback/upload` และขอให้
app-server รวม log สำหรับแต่ละเธรดที่ระบุและ subthread ของ Codex ที่ถูก spawn
เมื่อมีให้ใช้งาน การอัปโหลดจะผ่านเส้นทาง feedback ปกติของ Codex ไปยังเซิร์ฟเวอร์
OpenAI; หากปิด feedback ของ Codex ใน app-server นั้น คำสั่งจะส่งคืนข้อผิดพลาด
ของ app-server การตอบกลับ diagnostics ที่เสร็จแล้วจะแสดงรายการช่องทาง,
id เซสชัน OpenClaw, id เธรด Codex, และคำสั่ง `codex resume <thread-id>`
ในเครื่องสำหรับเธรดที่ถูกส่ง หากคุณปฏิเสธหรือเพิกเฉยต่อการอนุมัติ
OpenClaw จะไม่พิมพ์ id Codex เหล่านั้น การอัปโหลดนี้ไม่ได้แทนที่
การส่งออก diagnostics ของ Gateway ในเครื่อง

`/codex resume` เขียนไฟล์ binding sidecar เดียวกับที่ harness ใช้สำหรับ
turn ปกติ ในข้อความถัดไป OpenClaw จะ resume เธรด Codex นั้น, ส่งโมเดล OpenClaw
ที่เลือกอยู่ปัจจุบันเข้า app-server, และคงการเปิดใช้ประวัติแบบขยายไว้

### ตรวจสอบเธรด Codex จาก CLI

วิธีที่เร็วที่สุดในการทำความเข้าใจการรัน Codex ที่ผิดพลาดมักเป็นการเปิดเธรด Codex
แบบ native โดยตรง:

```sh
codex resume <thread-id>
```

ใช้วิธีนี้เมื่อคุณพบข้อบกพร่องในบทสนทนาของช่องทางและต้องการตรวจสอบเซสชัน Codex
ที่มีปัญหา, ทำต่อในเครื่อง, หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือ reasoning
แบบนั้น เส้นทางที่ง่ายที่สุดมักเป็นการรัน `/diagnostics [note]` ก่อน:
หลังจากคุณอนุมัติ รายงานที่เสร็จแล้วจะแสดงรายการแต่ละเธรด Codex และพิมพ์คำสั่ง
`Inspect locally` เช่น `codex resume <thread-id>` คุณสามารถคัดลอกคำสั่งนั้น
ลงในเทอร์มินัลได้โดยตรง

คุณยังสามารถรับ thread id จาก `/codex binding` สำหรับแชตปัจจุบันหรือ
`/codex threads [filter]` สำหรับเธรด Codex app-server ล่าสุด แล้วรันคำสั่ง
`codex resume` เดียวกันในเชลล์ของคุณ

พื้นผิวคำสั่งต้องใช้ Codex app-server `0.125.0` หรือใหม่กว่า เมธอดควบคุมแต่ละรายการ
จะถูกรายงานว่า `unsupported by this Codex app-server` หาก app-server ในอนาคต
หรือแบบกำหนดเองไม่ได้เปิดเผยเมธอด JSON-RPC นั้น

## ขอบเขต Hook

Codex harness มี hook สามชั้น:

| ชั้น                                  | Owner                    | วัตถุประสงค์                                                        |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| hook ของ Plugin OpenClaw              | OpenClaw                 | ความเข้ากันได้ของผลิตภัณฑ์/Plugin ข้าม PI และ Codex harness        |
| middleware ส่วนขยาย Codex app-server  | Plugin ที่ bundled กับ OpenClaw | พฤติกรรม adapter ราย turn รอบเครื่องมือ dynamic ของ OpenClaw       |
| hook native ของ Codex                 | Codex                    | lifecycle ระดับต่ำของ Codex และนโยบายเครื่องมือ native จาก config ของ Codex |

OpenClaw ไม่ใช้ไฟล์ Codex `hooks.json` ระดับโปรเจกต์หรือ global เพื่อ route
พฤติกรรม Plugin ของ OpenClaw สำหรับ bridge เครื่องมือ native และ permission ที่รองรับ
OpenClaw จะ inject config Codex รายเธรดสำหรับ `PreToolUse`, `PostToolUse`,
`PermissionRequest`, และ `Stop` hook อื่นของ Codex เช่น `SessionStart` และ
`UserPromptSubmit` ยังคงเป็นการควบคุมระดับ Codex; hook เหล่านี้ไม่ได้ถูกเปิดเผยเป็น
hook ของ Plugin OpenClaw ในสัญญา v1

สำหรับเครื่องมือ dynamic ของ OpenClaw OpenClaw จะเรียกใช้เครื่องมือหลังจาก Codex ขอ
call ดังนั้น OpenClaw จึง fire พฤติกรรม Plugin และ middleware ที่ตนเป็นเจ้าของใน
harness adapter สำหรับเครื่องมือ native ของ Codex นั้น Codex เป็นเจ้าของบันทึกเครื่องมือ
ที่เป็น canonical OpenClaw สามารถ mirror event บางส่วนได้ แต่ไม่สามารถเขียนเธรด Codex
แบบ native ใหม่ได้ เว้นแต่ Codex จะเปิดเผย operation นั้นผ่าน app-server หรือ callback
ของ hook native

การฉายภาพ Compaction และ lifecycle ของ LLM มาจาก notification ของ Codex app-server
และสถานะ adapter ของ OpenClaw ไม่ใช่คำสั่ง hook native ของ Codex event
`before_compaction`, `after_compaction`, `llm_input`, และ `llm_output` ของ OpenClaw
เป็น observation ระดับ adapter ไม่ใช่การจับ payload คำขอภายในหรือ Compaction ของ Codex
แบบ byte-for-byte

notification `hook/started` และ `hook/completed` ของ app-server ที่เป็น native ของ Codex
จะถูกฉายเป็น event agent `codex_app_server.hook` สำหรับ trajectory และการดีบัก
สิ่งเหล่านี้จะไม่เรียก hook ของ Plugin OpenClaw

## สัญญาการรองรับ V1

โหมด Codex ไม่ใช่ PI ที่มีการเรียกโมเดลแบบอื่นอยู่ข้างใต้ Codex เป็นเจ้าของ native model loop
มากกว่า และ OpenClaw จะปรับพื้นผิว Plugin และเซสชันของตนรอบขอบเขตนั้น

รองรับใน Codex runtime v1:

| พื้นผิว                                       | การรองรับ                                | เหตุผล                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI model loop ผ่าน Codex                  | รองรับ                                  | Codex app-server เป็นเจ้าของ turn ของ OpenAI, การ resume เธรด native, และการทำต่อของเครื่องมือ native                                                                                           |
| การ route และ delivery ช่องทาง OpenClaw       | รองรับ                                  | Telegram, Discord, Slack, WhatsApp, iMessage, และช่องทางอื่นยังอยู่นอก model runtime                                                                                                                |
| เครื่องมือ dynamic ของ OpenClaw               | รองรับ                                  | Codex ขอให้ OpenClaw เรียกใช้เครื่องมือเหล่านี้ ดังนั้น OpenClaw จึงยังอยู่ในเส้นทาง execution                                                                                                     |
| Prompt และ context plugins                    | รองรับ                                  | OpenClaw สร้าง prompt overlay และฉาย context เข้า turn ของ Codex ก่อนเริ่มหรือ resume เธรด                                                                                                         |
| lifecycle ของ context engine                  | รองรับ                                  | Assemble, ingest หรือ maintenance หลัง turn, และการประสานงาน Compaction ของ context-engine รันสำหรับ turn ของ Codex                                                                               |
| hook ของเครื่องมือ dynamic                    | รองรับ                                  | `before_tool_call`, `after_tool_call`, และ middleware ของผลลัพธ์เครื่องมือรันรอบเครื่องมือ dynamic ที่ OpenClaw เป็นเจ้าของ                                                                      |
| lifecycle hooks                               | รองรับในฐานะ observation ของ adapter    | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, และ `after_compaction` fire พร้อม payload โหมด Codex ที่ตรงไปตรงมา                                                                  |
| gate การแก้ไขคำตอบสุดท้าย                    | รองรับผ่าน native hook relay            | Codex `Stop` ถูก relay ไปยัง `before_agent_finalize`; `revise` ขอให้ Codex ทำ model pass เพิ่มอีกครั้งก่อน finalization                                                                           |
| block หรือ observe shell, patch, และ MCP native | รองรับผ่าน native hook relay            | Codex `PreToolUse` และ `PostToolUse` ถูก relay สำหรับพื้นผิวเครื่องมือ native ที่ committed รวมถึง payload MCP บน Codex app-server `0.125.0` หรือใหม่กว่า รองรับการบล็อก; ไม่รองรับการเขียน argument ใหม่ |
| นโยบาย permission native                      | รองรับผ่าน native hook relay            | Codex `PermissionRequest` สามารถ route ผ่านนโยบาย OpenClaw เมื่อ runtime เปิดเผย หาก OpenClaw ไม่ส่ง decision กลับ Codex จะดำเนินต่อผ่าน guardian หรือเส้นทางการอนุมัติของผู้ใช้ตามปกติ         |
| การจับ trajectory ของ app-server              | รองรับ                                  | OpenClaw บันทึกคำขอที่ส่งไปยัง app-server และ notification ของ app-server ที่ได้รับ                                                                                                                |

ไม่รองรับใน Codex runtime v1:

| พื้นผิว                                             | ขอบเขต V1                                                                                                                                     | เส้นทางในอนาคต                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| การแก้ไขอาร์กิวเมนต์ของเครื่องมือเนทีฟ                       | ฮุกก่อนใช้เครื่องมือเนทีฟของ Codex สามารถบล็อกได้ แต่ OpenClaw จะไม่เขียนอาร์กิวเมนต์เครื่องมือเนทีฟของ Codex ใหม่                                               | ต้องมีการรองรับฮุก/สคีมาของ Codex สำหรับการแทนที่อินพุตเครื่องมือ                            |
| ประวัติทรานสคริปต์เนทีฟของ Codex ที่แก้ไขได้            | Codex เป็นเจ้าของประวัติเธรดเนทีฟที่เป็นแหล่งอ้างอิงหลัก OpenClaw เป็นเจ้าของสำเนาเงาและสามารถฉายบริบทในอนาคตได้ แต่ไม่ควรแก้ไขภายในที่ไม่รองรับ | เพิ่ม API ของเซิร์ฟเวอร์แอป Codex อย่างชัดเจน หากจำเป็นต้องผ่าตัดเธรดเนทีฟ                    |
| `tool_result_persist` สำหรับเรคคอร์ดเครื่องมือเนทีฟของ Codex | ฮุกนั้นแปลงการเขียนทรานสคริปต์ที่ OpenClaw เป็นเจ้าของ ไม่ใช่เรคคอร์ดเครื่องมือเนทีฟของ Codex                                                           | อาจมิเรอร์เรคคอร์ดที่แปลงแล้วได้ แต่การเขียนแหล่งอ้างอิงหลักใหม่ต้องอาศัยการรองรับจาก Codex              |
| เมตาดาต้า Compaction เนทีฟแบบสมบูรณ์                     | OpenClaw สังเกตการเริ่มและการเสร็จสิ้นของ Compaction แต่ไม่ได้รับรายการ kept/dropped, เดลต้าโทเค็น หรือเพย์โหลดสรุปที่เสถียร            | ต้องมีอีเวนต์ Compaction ของ Codex ที่สมบูรณ์กว่า                                                     |
| การแทรกแซง Compaction                             | ฮุก Compaction ของ OpenClaw ปัจจุบันอยู่ระดับการแจ้งเตือนในโหมด Codex                                                                         | เพิ่มฮุกก่อน/หลัง Compaction ของ Codex หาก Plugin จำเป็นต้องยับยั้งหรือเขียน Compaction เนทีฟใหม่ |
| การจับคำขอ API โมเดลแบบตรงทุกไบต์             | OpenClaw สามารถจับคำขอและการแจ้งเตือนของเซิร์ฟเวอร์แอปได้ แต่แกน Codex สร้างคำขอ OpenAI API สุดท้ายภายใน                      | ต้องมีอีเวนต์ติดตามคำขอโมเดลของ Codex หรือ API ดีบัก                                   |

## เครื่องมือ สื่อ และ Compaction

ฮาร์เนส Codex เปลี่ยนเฉพาะตัวดำเนินการเอเจนต์แบบฝังระดับล่างเท่านั้น

OpenClaw ยังคงสร้างรายการเครื่องมือและรับผลลัพธ์เครื่องมือแบบไดนามิกจาก
ฮาร์เนส ข้อความ รูปภาพ วิดีโอ เพลง TTS การอนุมัติ และเอาต์พุตของเครื่องมือส่งข้อความ
ยังคงผ่านเส้นทางการส่งมอบปกติของ OpenClaw

รีเลย์ฮุกเนทีฟตั้งใจให้เป็นแบบทั่วไป แต่สัญญาการรองรับ v1
จำกัดอยู่ที่เส้นทางเครื่องมือและสิทธิ์เนทีฟของ Codex ที่ OpenClaw ทดสอบ ใน
รันไทม์ Codex นั่นรวมถึงเพย์โหลด shell, patch และ MCP `PreToolUse`,
`PostToolUse` และ `PermissionRequest` อย่าสันนิษฐานว่าอีเวนต์ฮุก Codex ในอนาคตทุกชนิด
เป็นพื้นผิว Plugin ของ OpenClaw จนกว่าสัญญารันไทม์จะระบุชื่อ
อีเวนต์นั้น

สำหรับ `PermissionRequest` OpenClaw จะส่งคืนการตัดสินใจอนุญาตหรือปฏิเสธอย่างชัดเจน
เฉพาะเมื่อ policy ตัดสินใจแล้วเท่านั้น ผลลัพธ์แบบไม่มีการตัดสินใจไม่ใช่การอนุญาต Codex ถือว่าเป็นการไม่มี
การตัดสินใจจากฮุก และปล่อยให้ไหลต่อไปยังเส้นทาง guardian หรือการอนุมัติจากผู้ใช้ของตัวเอง

การขออนุมัติเครื่องมือ MCP ของ Codex จะถูกส่งผ่านโฟลว์การอนุมัติ Plugin
ของ OpenClaw เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"` พรอมป์ `request_user_input` ของ Codex จะถูกส่งกลับไปยัง
แชตต้นทาง และข้อความติดตามผลที่เข้าคิวถัดไปจะตอบคำขอเซิร์ฟเวอร์เนทีฟนั้น
แทนที่จะถูกบังคับทิศทางเป็นบริบทเพิ่มเติม คำขอ elicitation ของ MCP อื่น ๆ
ยังคงล้มเหลวแบบปิด

การบังคับทิศทางคิวของรันที่กำลังทำงานอยู่แมปกับ `turn/steer` ของเซิร์ฟเวอร์แอป Codex ด้วย
ค่าเริ่มต้น `messages.queue.mode: "steer"` OpenClaw จะรวมข้อความแชตที่เข้าคิว
สำหรับช่วงเวลานิ่งที่กำหนดค่าไว้ และส่งเป็นคำขอ `turn/steer` เดียวตาม
ลำดับที่มาถึง โหมด `queue` แบบเดิมจะส่งคำขอ `turn/steer` แยกกัน Codex
รีวิวและเทิร์น Compaction ด้วยตนเองสามารถปฏิเสธการบังคับทิศทางในเทิร์นเดียวกันได้ ซึ่งในกรณีนั้น
OpenClaw จะใช้คิวติดตามผลเมื่อโหมดที่เลือกอนุญาตให้ fallback ดู
[คิวการบังคับทิศทาง](/th/concepts/queue-steering)

เมื่อโมเดลที่เลือกใช้ฮาร์เนส Codex, Compaction เธรดเนทีฟจะ
ถูกมอบหมายให้เซิร์ฟเวอร์แอป Codex OpenClaw เก็บสำเนาเงาทรานสคริปต์ไว้สำหรับประวัติ
ช่องทาง การค้นหา `/new`, `/reset` และการสลับโมเดลหรือฮาร์เนสในอนาคต
สำเนาเงารวมพรอมป์ของผู้ใช้ ข้อความผู้ช่วยสุดท้าย และเรคคอร์ดการใช้เหตุผลหรือแผนของ Codex
แบบเบาเมื่อเซิร์ฟเวอร์แอปปล่อยออกมา วันนี้ OpenClaw
บันทึกเฉพาะสัญญาณเริ่มและเสร็จสิ้นของ Compaction เนทีฟเท่านั้น ยังไม่เปิดเผย
สรุป Compaction ที่มนุษย์อ่านได้ หรือรายการตรวจสอบได้ว่า Codex
เก็บรายการใดไว้หลัง Compaction

เนื่องจาก Codex เป็นเจ้าของเธรดเนทีฟที่เป็นแหล่งอ้างอิงหลัก `tool_result_persist` จึงยัง
ไม่ได้เขียนเรคคอร์ดผลลัพธ์เครื่องมือเนทีฟของ Codex ใหม่ในปัจจุบัน มันมีผลเฉพาะเมื่อ
OpenClaw กำลังเขียนผลลัพธ์เครื่องมือในทรานสคริปต์เซสชันที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่ต้องใช้ PI รูปภาพ วิดีโอ เพลง PDF, TTS และการทำความเข้าใจสื่อ
ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็นผู้ให้บริการ `/model` ปกติ:** นี่เป็นสิ่งที่คาดไว้สำหรับ
คอนฟิกใหม่ เลือกโมเดล `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"` (หรือ ref `codex/*` แบบเดิม), เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` กีดกัน
`codex` หรือไม่

**OpenClaw ใช้ PI แทน Codex:** `agentRuntime.id: "auto"` ยังสามารถใช้ PI เป็น
แบ็กเอนด์ความเข้ากันได้เมื่อไม่มีฮาร์เนส Codex รับรันนั้น ตั้งค่า
`agentRuntime.id: "codex"` เพื่อบังคับเลือก Codex ระหว่างทดสอบ
รันไทม์ Codex ที่ถูกบังคับจะล้มเหลวแทนที่จะ fallback ไปเป็น PI เมื่อเซิร์ฟเวอร์แอป Codex
ถูกเลือกแล้ว ความล้มเหลวของมันจะแสดงโดยตรง

**เซิร์ฟเวอร์แอปถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้ handshake ของเซิร์ฟเวอร์แอป
รายงานเวอร์ชัน `0.125.0` หรือใหม่กว่า พรีรีลีสเวอร์ชันเดียวกันหรือเวอร์ชันที่ต่อท้ายบิลด์
เช่น `0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ
เกณฑ์ขั้นต่ำของโปรโตคอลเสถียร `0.125.0` คือสิ่งที่ OpenClaw ทดสอบ

**การค้นหาโมเดลช้า:** ลด `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิดใช้การค้นหา

**ทรานสปอร์ต WebSocket ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`,
และตรวจสอบว่าเซิร์ฟเวอร์แอประยะไกลพูดโปรโตคอลเซิร์ฟเวอร์แอป Codex เวอร์ชันเดียวกัน

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นสิ่งที่คาดไว้ เว้นแต่คุณจะบังคับ
`agentRuntime.id: "codex"` สำหรับเอเจนต์นั้น หรือเลือก ref
`codex/*` แบบเดิม ref `openai/gpt-*` ปกติและ ref ผู้ให้บริการอื่น ๆ จะยังอยู่บนเส้นทาง
ผู้ให้บริการปกติของตัวเองในโหมด `auto` หากคุณบังคับ `agentRuntime.id: "codex"` ทุกเทิร์นแบบฝัง
สำหรับเอเจนต์นั้นต้องเป็นโมเดล OpenAI ที่ Codex รองรับ

**ติดตั้ง Computer Use แล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงานว่า
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงอยู่ ให้รีสตาร์ท
gateway เพื่อล้างการลงทะเบียนฮุกเนทีฟที่ค้างอยู่ หาก `computer-use.list_apps`
หมดเวลา ให้รีสตาร์ท Codex Computer Use หรือ Codex Desktop แล้วลองอีกครั้ง

## ที่เกี่ยวข้อง

- [Plugin ฮาร์เนสเอเจนต์](/th/plugins/sdk-agent-harness)
- [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [สถานะ](/th/cli/status)
- [ฮุก Plugin](/th/plugins/hooks)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
