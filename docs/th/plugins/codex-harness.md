---
read_when:
    - คุณต้องการใช้ฮาร์เนส app-server ของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่าฮาร์เนสของ Codex
    - คุณต้องการให้การปรับใช้เฉพาะ Codex ล้มเหลวแทนที่จะย้อนกลับไปใช้ PI
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านชุดทดสอบ Codex app-server ที่รวมมาให้
title: ฮาร์เนสของ Codex
x-i18n:
    generated_at: "2026-05-07T13:23:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่รวมมาพร้อมระบบทำให้ OpenClaw เรียกใช้รอบของเอเจนต์แบบฝังผ่านเซิร์ฟเวอร์แอปของ Codex แทนชุดควบคุม PI ในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง: การค้นหาโมเดล การดำเนินการต่อเธรดแบบเนทีฟ การทำ Compaction แบบเนทีฟ และการดำเนินการผ่านเซิร์ฟเวอร์แอป OpenClaw ยังคงเป็นเจ้าของช่องทางแชต ไฟล์เซสชัน การเลือกโมเดล เครื่องมือ การอนุมัติ การส่งสื่อ และสำเนาทรานสคริปต์ที่มองเห็นได้

เมื่อรอบแชตจากต้นทางทำงานผ่านชุดควบคุม Codex การตอบกลับที่มองเห็นได้จะใช้เครื่องมือ `message` ของ OpenClaw เป็นค่าเริ่มต้น หากการดีพลอยยังไม่ได้กำหนดค่า `messages.visibleReplies` ไว้อย่างชัดเจน เอเจนต์ยังสามารถจบรอบ Codex ของตนแบบส่วนตัวได้ โดยจะโพสต์ไปยังช่องทางก็ต่อเมื่อเรียก `message(action="send")` เท่านั้น ตั้งค่า `messages.visibleReplies: "automatic"` เพื่อให้การตอบกลับสุดท้ายของแชตโดยตรงยังคงอยู่บนเส้นทางการส่งอัตโนมัติแบบเดิม

รอบ Heartbeat ของ Codex ยังได้รับเครื่องมือ `heartbeat_respond` เป็นค่าเริ่มต้นด้วย เพื่อให้เอเจนต์บันทึกได้ว่าการปลุกควรเงียบไว้หรือควรแจ้งเตือน โดยไม่ต้องเข้ารหัสโฟลว์ควบคุมนั้นไว้ในข้อความสุดท้าย

คำแนะนำเชิงริเริ่มเฉพาะ Heartbeat จะถูกส่งเป็นคำสั่งสำหรับนักพัฒนาในโหมดการทำงานร่วมกันของ Codex ในรอบ Heartbeat นั้นเอง รอบแชตปกติจะกู้คืนโหมดค่าเริ่มต้นของ Codex แทนการพกแนวคิดของ Heartbeat ไว้ในพรอมป์รันไทม์ปกติ

หากคุณกำลังพยายามทำความเข้าใจภาพรวม ให้เริ่มจาก
[รันไทม์เอเจนต์](/th/concepts/agent-runtimes) สรุปสั้น ๆ คือ:
`openai/gpt-5.5` คืออ้างอิงโมเดล, `codex` คือรันไทม์ และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## การกำหนดค่าแบบรวดเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ "Codex ใน OpenClaw" ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วยการสมัครสมาชิก ChatGPT/Codex แล้วเรียกใช้รอบของเอเจนต์แบบฝังผ่านรันไทม์เซิร์ฟเวอร์แอป Codex แบบเนทีฟ อ้างอิงโมเดลยังคงเป็นแบบมาตรฐานที่ `openai/gpt-*`; การยืนยันตัวตนแบบสมัครสมาชิกมาจากบัญชี/โปรไฟล์ Codex ไม่ใช่จากคำนำหน้าโมเดล `openai-codex/*`

ก่อนอื่น ให้ลงชื่อเข้าใช้ด้วย Codex OAuth หากคุณยังไม่ได้ทำ:

```bash
openclaw models auth login --provider openai-codex
```

จากนั้นเปิดใช้ Plugin `codex` ที่รวมมาพร้อมระบบและบังคับใช้รันไทม์ Codex:

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

หากการกำหนดค่าของคุณใช้ `plugins.allow` ให้รวม `codex` ไว้ที่นั่นด้วย:

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

อย่าใช้ `openai-codex/gpt-*` ในการกำหนดค่า คำนำหน้านั้นเป็นเส้นทางเดิมที่
`openclaw doctor --fix` จะเขียนใหม่เป็น `openai/gpt-*` ครอบคลุมโมเดลหลัก โมเดลสำรอง การแทนที่ heartbeat/subagent/compaction, hooks, การแทนที่ระดับช่องทาง และหมุดเส้นทางเซสชันที่คงอยู่ซึ่งล้าสมัย

## Plugin นี้เปลี่ยนอะไร

Plugin `codex` ที่รวมมาพร้อมระบบเพิ่มความสามารถแยกกันหลายอย่าง:

| ความสามารถ                        | วิธีใช้                                      | สิ่งที่ทำ                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| รันไทม์แบบฝังเนทีฟ           | `agentRuntime.id: "codex"`                          | เรียกใช้รอบของเอเจนต์แบบฝังของ OpenClaw ผ่านเซิร์ฟเวอร์แอป Codex                  |
| คำสั่งควบคุมแชตแบบเนทีฟ      | `/codex bind`, `/codex resume`, `/codex steer`, ... | ผูกและควบคุมเธรดเซิร์ฟเวอร์แอป Codex จากการสนทนาผ่านข้อความ    |
| ผู้ให้บริการ/แคตตาล็อกเซิร์ฟเวอร์แอป Codex | ภายใน `codex` ที่แสดงผ่านชุดควบคุม     | ให้รันไทม์ค้นหาและตรวจสอบความถูกต้องของโมเดลเซิร์ฟเวอร์แอป                     |
| เส้นทางการเข้าใจสื่อของ Codex    | เส้นทางความเข้ากันได้ของโมเดลรูปภาพ `codex/*`           | เรียกใช้รอบเซิร์ฟเวอร์แอป Codex แบบจำกัดขอบเขตสำหรับโมเดลเข้าใจรูปภาพที่รองรับ |
| ตัวส่งต่อ hook แบบเนทีฟ                 | Plugin hooks รอบเหตุการณ์เนทีฟของ Codex             | ให้ OpenClaw สังเกต/บล็อกเหตุการณ์เครื่องมือ/การจบงานแบบเนทีฟของ Codex ที่รองรับ  |

การเปิดใช้ Plugin ทำให้ความสามารถเหล่านั้นพร้อมใช้งาน สิ่งนี้ **ไม่ได้**:

- แทนที่พื้นผิวคีย์ API โดยตรงของ OpenAI เช่น รูปภาพ embeddings เสียง หรือเรียลไทม์
- แปลงอ้างอิงโมเดล `openai-codex/*` โดยไม่มี `openclaw doctor --fix`
- ทำให้ ACP/acpx เป็นเส้นทาง Codex ค่าเริ่มต้น
- สลับเซสชันเดิมที่บันทึกรันไทม์ PI ไว้แล้วทันที
- แทนที่การส่งผ่านช่องทางของ OpenClaw ไฟล์เซสชัน ที่เก็บโปรไฟล์ยืนยันตัวตน หรือการกำหนดเส้นทางข้อความ

Plugin เดียวกันนี้ยังเป็นเจ้าของพื้นผิวคำสั่งควบคุมแชต `/codex` แบบเนทีฟด้วย หากเปิดใช้ Plugin และผู้ใช้ขอให้ผูก ดำเนินการต่อ ชี้นำ หยุด หรือตรวจสอบเธรด Codex จากแชต เอเจนต์ควรใช้ `/codex ...` แทน ACP ACP ยังคงเป็นทางเลือกสำรองแบบชัดเจนเมื่อผู้ใช้ขอ ACP/acpx หรือกำลังทดสอบอะแดปเตอร์ ACP ของ Codex

รอบ Codex แบบเนทีฟเก็บ OpenClaw plugin hooks ไว้เป็นชั้นความเข้ากันได้สาธารณะ สิ่งเหล่านี้เป็น OpenClaw hooks ในกระบวนการ ไม่ใช่ hooks คำสั่ง `hooks.json` ของ Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` สำหรับระเบียนทรานสคริปต์ที่มิเรอร์
- `before_agent_finalize` ผ่านตัวส่งต่อ `Stop` ของ Codex
- `agent_end`

Plugins ยังสามารถลงทะเบียนมิดเดิลแวร์ผลลัพธ์เครื่องมือที่เป็นกลางต่อรันไทม์ เพื่อเขียนผลลัพธ์เครื่องมือแบบไดนามิกของ OpenClaw ใหม่หลังจาก OpenClaw เรียกใช้เครื่องมือ และก่อนส่งผลลัพธ์กลับไปยัง Codex สิ่งนี้แยกจาก Plugin hook สาธารณะ `tool_result_persist` ซึ่งแปลงการเขียนผลลัพธ์เครื่องมือในทรานสคริปต์ที่ OpenClaw เป็นเจ้าของ

สำหรับความหมายของ Plugin hook เอง โปรดดู [Plugin hooks](/th/plugins/hooks)
และ [ลักษณะการทำงานของ Plugin guard](/th/tools/plugin)

อ้างอิงโมเดลเอเจนต์ของ OpenAI ใช้ชุดควบคุมนี้เป็นค่าเริ่มต้น การกำหนดค่าใหม่ควรคงอ้างอิงโมเดล OpenAI ให้เป็นมาตรฐานในรูป `openai/gpt-*`; `agentRuntime.id: "codex"` ยังคงใช้ได้ แต่ไม่จำเป็นอีกต่อไปสำหรับรอบเอเจนต์ OpenAI อ้างอิงโมเดลเดิม `codex/*` ยังเลือกชุดควบคุมนี้โดยอัตโนมัติเพื่อความเข้ากันได้ แต่คำนำหน้าผู้ให้บริการเดิมที่มีรันไทม์รองรับจะไม่แสดงเป็นตัวเลือกโมเดล/ผู้ให้บริการปกติ

หากเส้นทางโมเดลที่กำหนดค่าไว้ยังเป็น `openai-codex/*`, `openclaw doctor --fix`
จะเขียนใหม่เป็น `openai/*` สำหรับเส้นทางเอเจนต์ที่ตรงกัน จะตั้งค่ารันไทม์เอเจนต์เป็น `codex` และคงการแทนที่โปรไฟล์ยืนยันตัวตน `openai-codex` ที่มีอยู่ไว้

## แผนที่เส้นทาง

ใช้ตารางนี้ก่อนเปลี่ยนการกำหนดค่า:

| ลักษณะการทำงานที่ต้องการ                                     | อ้างอิงโมเดล                  | การกำหนดค่ารันไทม์                         | เส้นทางยืนยันตัวตน/โปรไฟล์             | ป้ายสถานะที่คาดหวัง        |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ------------------------------ | ---------------------------- |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-*`             | ละไว้หรือ `agentRuntime.id: "codex"`  | Codex OAuth หรือบัญชี Codex   | `Runtime: OpenAI Codex`      |
| การยืนยันตัวตนด้วยคีย์ API ของ OpenAI สำหรับโมเดลเอเจนต์                 | `openai/gpt-*`             | ละไว้หรือ `agentRuntime.id: "codex"`  | โปรไฟล์คีย์ API `openai-codex` | `Runtime: OpenAI Codex`      |
| การกำหนดค่าเดิมที่ต้องซ่อมด้วย doctor               | `openai-codex/gpt-*`       | ซ่อมเป็น `codex`                    | การยืนยันตัวตนที่กำหนดค่าไว้เดิม       | ตรวจสอบอีกครั้งหลัง `doctor --fix` |
| ผู้ให้บริการผสมพร้อมโหมดอัตโนมัติแบบระมัดระวัง          | อ้างอิงเฉพาะผู้ให้บริการ     | `agentRuntime.id: "auto"`              | ตามผู้ให้บริการที่เลือก          | ขึ้นอยู่กับรันไทม์ที่เลือก  |
| เซสชันอะแดปเตอร์ Codex ACP แบบชัดเจน                   | ขึ้นอยู่กับพรอมป์/โมเดล ACP | `sessions_spawn` พร้อม `runtime: "acp"` | การยืนยันตัวตนแบ็กเอนด์ ACP               | สถานะงาน/เซสชัน ACP      |

จุดแบ่งสำคัญคือผู้ให้บริการเทียบกับรันไทม์:

- `openai-codex/*` คือเส้นทางเดิมที่ doctor จะเขียนใหม่
- `agentRuntime.id: "codex"` ต้องใช้ชุดควบคุม Codex และจะปิดแบบปลอดภัยหากใช้งานไม่ได้
- `agentRuntime.id: "auto"` ให้ชุดควบคุมที่ลงทะเบียนไว้รับสิทธิ์เส้นทางผู้ให้บริการที่ตรงกัน; อ้างอิงเอเจนต์ OpenAI จะแปลงไปยัง Codex แทน PI
- `/codex ...` ตอบคำถามว่า "การสนทนา Codex แบบเนทีฟใดที่แชตนี้ควรผูกหรือควบคุม?"
- ACP ตอบคำถามว่า "acpx ควรเปิดกระบวนการชุดควบคุมภายนอกใด?"

## เลือกคำนำหน้าโมเดลที่ถูกต้อง

เส้นทางตระกูล OpenAI เจาะจงตามคำนำหน้า สำหรับการตั้งค่าทั่วไปที่ใช้การสมัครสมาชิกพร้อมรันไทม์ Codex แบบเนทีฟ ให้ใช้ `openai/*`
ถือว่า `openai-codex/*` เป็นการกำหนดค่าเดิมที่ doctor ควรเขียนใหม่:

| อ้างอิงโมเดล                                         | เส้นทางรันไทม์                             | ใช้เมื่อ                                                          |
| ------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `openai/gpt-5.4`                                  | ชุดควบคุมเซิร์ฟเวอร์แอป Codex สำหรับรอบเอเจนต์ | คุณต้องการโมเดลเอเจนต์ OpenAI ผ่าน Codex                       |
| `openai-codex/gpt-5.5`                            | เส้นทางเดิมที่ doctor ซ่อมให้          | คุณใช้การกำหนดค่าเก่า; เรียก `openclaw doctor --fix` เพื่อเขียนใหม่ |
| `openai/gpt-5.5` + โปรไฟล์คีย์ API `openai-codex` | ชุดควบคุมเซิร์ฟเวอร์แอป Codex                 | คุณต้องการการยืนยันตัวตนด้วยคีย์ API สำหรับโมเดลเอเจนต์ OpenAI                  |

GPT-5.5 อาจปรากฏได้ทั้งในเส้นทางคีย์ API โดยตรงของ OpenAI และเส้นทางสมัครสมาชิก Codex เมื่อบัญชีของคุณเปิดเผยเส้นทางเหล่านั้น ใช้ `openai/gpt-5.5` พร้อมชุดควบคุมเซิร์ฟเวอร์แอป Codex สำหรับรันไทม์ Codex แบบเนทีฟ หรือใช้ `openai/gpt-5.5` โดยไม่มีการแทนที่รันไทม์ Codex สำหรับทราฟฟิกคีย์ API โดยตรง

อ้างอิงเดิม `codex/gpt-*` ยังคงยอมรับเป็นนามแฝงเพื่อความเข้ากันได้ การย้ายข้อมูลเพื่อความเข้ากันได้ของ doctor จะเขียนอ้างอิงรันไทม์เดิมใหม่เป็นอ้างอิงโมเดลมาตรฐาน และบันทึกนโยบายรันไทม์แยกไว้ต่างหาก การกำหนดค่าชุดควบคุมเซิร์ฟเวอร์แอปแบบเนทีฟใหม่ควรใช้ `openai/gpt-*` พร้อม `agentRuntime.id: "codex"`

`agents.defaults.imageModel` ใช้การแบ่งคำนำหน้าแบบเดียวกัน ใช้
`openai/gpt-*` สำหรับเส้นทาง OpenAI ปกติ และ `codex/gpt-*` เมื่อการเข้าใจรูปภาพควรทำงานผ่านรอบเซิร์ฟเวอร์แอป Codex แบบจำกัดขอบเขต อย่าใช้
`openai-codex/gpt-*`; doctor จะเขียนคำนำหน้าเดิมนั้นใหม่เป็น `openai/gpt-*` โมเดลเซิร์ฟเวอร์แอป Codex ต้องประกาศว่ารองรับอินพุตรูปภาพ; โมเดล Codex แบบข้อความเท่านั้นจะล้มเหลวก่อนรอบสื่อจะเริ่ม

ใช้ `/status` เพื่อยืนยันชุดควบคุมที่มีผลสำหรับเซสชันปัจจุบัน หากการเลือกดูน่าประหลาดใจ ให้เปิดการบันทึกดีบักสำหรับซับซิสเต็ม `agents/harness` และตรวจสอบระเบียนแบบมีโครงสร้าง `agent harness selected` ของ Gateway ระเบียนนี้มี id ของชุดควบคุมที่เลือก เหตุผลการเลือก นโยบายรันไทม์/สำรอง และในโหมด `auto` ผลการรองรับของผู้สมัคร Plugin แต่ละตัว

### คำเตือนของ doctor หมายถึงอะไร

`openclaw doctor` เตือนเมื่ออ้างอิงโมเดลที่กำหนดค่าไว้หรือสถานะเส้นทางเซสชันที่คงอยู่ยังใช้ `openai-codex/*` อยู่ `openclaw doctor --fix` จะเขียนเส้นทางเหล่านั้นใหม่เป็น:

- `openai/<model>`
- `agentRuntime.id: "codex"`

เส้นทาง `codex` บังคับใช้ชุดควบคุม Codex แบบเนทีฟ ไม่อนุญาตให้ใช้การกำหนดค่ารันไทม์ PI สำหรับรอบโมเดลเอเจนต์ OpenAI
Doctor ยังซ่อมหมุดเซสชันที่คงอยู่ซึ่งล้าสมัยในที่เก็บเซสชันเอเจนต์ที่ค้นพบ เพื่อให้การสนทนาเก่าไม่ติดค้างอยู่กับเส้นทางที่ถูกลบไปแล้ว

การเลือกชุดควบคุมไม่ใช่การควบคุมเซสชันแบบสด เมื่อรอบแบบฝังทำงาน OpenClaw จะบันทึก id ชุดควบคุมที่เลือกไว้ในเซสชันนั้น และใช้ต่อไปสำหรับรอบถัด ๆ ไปใน id เซสชันเดียวกัน เปลี่ยนการกำหนดค่า `agentRuntime` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อคุณต้องการให้เซสชันในอนาคตใช้ชุดควบคุมอื่น; ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับการสนทนาที่มีอยู่ระหว่าง PI และ Codex วิธีนี้หลีกเลี่ยงการเล่นทรานสคริปต์เดียวซ้ำผ่านระบบเซสชันเนทีฟสองระบบที่เข้ากันไม่ได้

เซสชันเดิมที่สร้างก่อนมีหมุดชุดควบคุมจะถือว่าเป็นเซสชันที่ถูกตรึงไว้กับ PI เมื่อมีประวัติทรานสคริปต์แล้ว ใช้ `/new` หรือ `/reset` เพื่อเลือกให้การสนทนานั้นเข้าสู่ Codex หลังเปลี่ยนการกำหนดค่า

`/status` แสดงรันไทม์โมเดลที่มีผล ชุดควบคุม PI ค่าเริ่มต้นจะแสดงเป็น
`Runtime: OpenClaw Pi Default` และชุดควบคุมเซิร์ฟเวอร์แอป Codex จะแสดงเป็น
`Runtime: OpenAI Codex`

## ข้อกำหนด

- มี OpenClaw พร้อม Plugin `codex` ที่รวมมาให้ใช้งานได้
- Codex app-server `0.125.0` หรือใหม่กว่า โดยค่าเริ่มต้น Plugin ที่รวมมาจะจัดการไบนารี Codex app-server ที่เข้ากันได้ ดังนั้นคำสั่ง `codex` ภายในเครื่องบน `PATH` จะไม่ส่งผลต่อการเริ่มต้น harness ตามปกติ
- มีการยืนยันตัวตน Codex ให้กับโปรเซส app-server หรือให้กับสะพานการยืนยันตัวตน Codex ของ OpenClaw การเริ่ม app-server ภายในเครื่องจะใช้โฮม Codex ที่ OpenClaw จัดการแยกสำหรับแต่ละ agent และ child `HOME` ที่แยกออกมา ดังนั้นโดยค่าเริ่มต้นจะไม่อ่านบัญชี `~/.codex` ส่วนตัว, skills, plugins, config, thread state หรือ `$HOME/.agents/skills` แบบ native ของคุณ

Plugin จะบล็อกการ handshake ของ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน ซึ่งช่วยให้ OpenClaw อยู่บนพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้ว

สำหรับ live และ Docker smoke tests การยืนยันตัวตนมักมาจากบัญชี Codex CLI หรือโปรไฟล์การยืนยันตัวตน OpenClaw `openai-codex` การเริ่ม local stdio app-server ยังสามารถถอยไปใช้ `CODEX_API_KEY` / `OPENAI_API_KEY` ได้เมื่อไม่มีบัญชีอยู่

## ไฟล์บูตสแตรปของ workspace

Codex จัดการ `AGENTS.md` เองผ่านการค้นพบเอกสารโปรเจ็กต์แบบ native OpenClaw ไม่เขียนไฟล์เอกสารโปรเจ็กต์ Codex แบบสังเคราะห์ หรือพึ่งพาชื่อไฟล์ fallback ของ Codex สำหรับไฟล์ persona เพราะ fallback ของ Codex ใช้เฉพาะเมื่อไม่มี `AGENTS.md`

เพื่อให้ workspace ของ OpenClaw มีความเท่าเทียมกัน Codex harness จะ resolve ไฟล์บูตสแตรปอื่นๆ (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` และ `MEMORY.md` เมื่อมีอยู่) แล้วส่งต่อผ่าน developer instructions ของ Codex บน `thread/start` และ `thread/resume` วิธีนี้ทำให้ `SOUL.md` และบริบท persona/profile ของ workspace ที่เกี่ยวข้องมองเห็นได้บนเลน native สำหรับปรับพฤติกรรมของ Codex โดยไม่ทำซ้ำ `AGENTS.md`

## เพิ่ม Codex ควบคู่กับโมเดลอื่น

อย่าตั้งค่า `agentRuntime.id: "codex"` แบบ global หาก agent เดียวกันควรสลับได้อย่างอิสระระหว่าง Codex กับโมเดล provider ที่ไม่ใช่ Codex runtime ที่ถูกบังคับจะใช้กับทุก turn ที่ฝังอยู่สำหรับ agent หรือ session นั้น หากคุณเลือกโมเดล Anthropic ขณะ runtime นั้นถูกบังคับ OpenClaw จะยังพยายามใช้ Codex harness และล้มเหลวแบบปิด แทนที่จะ route turn นั้นผ่าน PI อย่างเงียบๆ

ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้แทน:

- วาง Codex ไว้บน agent เฉพาะด้วย `agentRuntime.id: "codex"`
- ให้ agent เริ่มต้นใช้ `agentRuntime.id: "auto"` และ PI fallback สำหรับการใช้งาน provider แบบผสมตามปกติ
- ใช้ ref แบบเดิม `codex/*` เพื่อความเข้ากันได้เท่านั้น config ใหม่ควรใช้ `openai/*` พร้อมนโยบาย Codex runtime ที่ระบุชัดเจน

ตัวอย่างนี้ทำให้ agent เริ่มต้นอยู่บนการเลือกอัตโนมัติตามปกติ และเพิ่ม agent Codex แยกต่างหาก:

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

- agent เริ่มต้น `main` ใช้เส้นทาง provider ตามปกติและ PI compatibility fallback
- agent `codex` ใช้ Codex app-server harness
- หาก Codex หายไปหรือไม่รองรับสำหรับ agent `codex` turn นั้นจะล้มเหลว แทนที่จะใช้ PI อย่างเงียบๆ

## การ route คำสั่งของ agent

Agents ควร route คำขอของผู้ใช้ตามเจตนา ไม่ใช่ตามคำว่า "Codex" เพียงอย่างเดียว:

| ผู้ใช้ขอให้...                                       | Agent ควรใช้...                              |
| ------------------------------------------------------ | ------------------------------------------------ |
| "ผูกแชตนี้กับ Codex"                              | `/codex bind`                                    |
| "ดำเนินต่อ thread Codex `<id>` ที่นี่"                      | `/codex resume <id>`                             |
| "แสดง threads ของ Codex"                                   | `/codex threads`                                 |
| "ยื่นรายงานสนับสนุนสำหรับการรัน Codex ที่มีปัญหา"            | `/diagnostics [note]`                            |
| "ส่ง feedback ของ Codex เฉพาะสำหรับ thread ที่แนบมานี้เท่านั้น"    | `/codex diagnostics [note]`                      |
| "ใช้ subscription ChatGPT/Codex ของฉันกับ Codex runtime" | `openai/*`                                       |
| "ซ่อม config/session pins เดิม `openai-codex/*`"      | `openclaw doctor --fix`                          |
| "รัน Codex ผ่าน ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "เริ่ม Claude Code/Gemini/OpenCode/Cursor ใน thread" | ACP/acpx ไม่ใช่ `/codex` และไม่ใช่ sub-agents แบบ native |

OpenClaw จะโฆษณาคำแนะนำ ACP spawn ให้ agents เฉพาะเมื่อ ACP เปิดใช้งานอยู่, dispatch ได้ และมี runtime backend ที่โหลดแล้วรองรับ หาก ACP ไม่พร้อมใช้งาน system prompt และ plugin skills ไม่ควรสอน agent เกี่ยวกับการ route ผ่าน ACP

## การปรับใช้ที่ใช้ Codex เท่านั้น

บังคับใช้ Codex harness เมื่อคุณต้องพิสูจน์ว่า turn ของ embedded agent ทุกครั้งใช้ Codex runtime ของ Plugin ที่ระบุชัดเจนจะล้มเหลวแบบปิดและจะไม่ถูกลองซ้ำผ่าน PI อย่างเงียบๆ:

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

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Codex Plugin ถูกปิดใช้งาน, app-server เก่าเกินไป หรือ app-server เริ่มไม่ได้

## Codex ราย agent

คุณสามารถทำให้ agent หนึ่งใช้ Codex เท่านั้น ขณะที่ agent เริ่มต้นยังคงใช้การเลือกอัตโนมัติตามปกติ:

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

ใช้คำสั่ง session ตามปกติเพื่อสลับ agents และโมเดล `/new` สร้าง session OpenClaw ใหม่ และ Codex harness จะสร้างหรือดำเนินต่อ thread app-server แบบ sidecar ตามต้องการ `/reset` ล้างการผูก session OpenClaw สำหรับ thread นั้น และให้ turn ถัดไป resolve harness จาก config ปัจจุบันอีกครั้ง

## การค้นหาโมเดล

โดยค่าเริ่มต้น Codex Plugin จะถาม app-server เพื่อหาโมเดลที่พร้อมใช้งาน หากการค้นหาล้มเหลวหรือหมดเวลา จะใช้ fallback catalog ที่รวมมาให้สำหรับ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

คุณสามารถปรับการค้นหาได้ภายใต้ `plugins.entries.codex.config.discovery`:

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

ปิดการค้นหาเมื่อคุณต้องการให้ startup หลีกเลี่ยงการ probe Codex และใช้เฉพาะ fallback catalog:

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

โดยค่าเริ่มต้น Plugin จะเริ่มไบนารี Codex ที่ OpenClaw จัดการภายในเครื่องด้วย:

```bash
codex app-server --listen stdio://
```

ไบนารีที่จัดการนี้จัดส่งมากับแพ็กเกจ Plugin `codex` วิธีนี้ทำให้เวอร์ชัน app-server ผูกกับ Plugin ที่รวมมา แทนที่จะเป็น Codex CLI แยกตัวใดก็ตามที่บังเอิญติดตั้งอยู่ในเครื่อง ตั้งค่า `appServer.command` เฉพาะเมื่อคุณตั้งใจต้องการรัน executable อื่น

โดยค่าเริ่มต้น OpenClaw เริ่ม session ของ local Codex harness ในโหมด YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` และ `sandbox: "danger-full-access"` นี่คือท่าทาง trusted local operator ที่ใช้สำหรับ Heartbeat อัตโนมัติ: Codex สามารถใช้ shell และ network tools ได้โดยไม่หยุดที่ native approval prompts ซึ่งไม่มีใครอยู่ตอบ

หากต้องการ opt in ไปใช้การอนุมัติที่ Codex guardian-reviewed ให้ตั้งค่า `appServer.mode: "guardian"`:

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

โหมด Guardian ใช้เส้นทางการอนุมัติ auto-review แบบ native ของ Codex เมื่อ Codex ขอออกจาก sandbox, เขียนนอก workspace หรือเพิ่ม permission เช่น network access, Codex จะ route คำขออนุมัตินั้นไปยัง reviewer แบบ native แทน prompt มนุษย์ reviewer จะใช้กรอบความเสี่ยงของ Codex และอนุมัติหรือปฏิเสธคำขอเฉพาะนั้น ใช้ Guardian เมื่อคุณต้องการ guardrails มากกว่าโหมด YOLO แต่ยังต้องการให้ agents ที่ไม่มีคนเฝ้าทำงานต่อได้

preset `guardian` ขยายเป็น `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"` field นโยบายแต่ละรายการยัง override `mode` ได้ ดังนั้นการปรับใช้ขั้นสูงสามารถผสม preset กับตัวเลือกที่ระบุชัดเจนได้ ค่า reviewer เดิม `guardian_subagent` ยังยอมรับเป็น alias เพื่อความเข้ากันได้ แต่ config ใหม่ควรใช้ `auto_review`

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

โดยค่าเริ่มต้น การเริ่ม stdio app-server จะสืบทอด process environment ของ OpenClaw แต่ OpenClaw เป็นเจ้าของสะพานบัญชี Codex app-server และตั้งค่าทั้ง `CODEX_HOME` และ `HOME` เป็นไดเรกทอรีราย agent ภายใต้ state ของ OpenClaw สำหรับ agent นั้น skill loader ของ Codex เองอ่าน `$CODEX_HOME/skills` และ `$HOME/.agents/skills` ดังนั้นค่าทั้งสองจึงถูกแยกสำหรับการเริ่ม local app-server วิธีนี้ทำให้ skills, plugins, config, accounts และ thread state แบบ native ของ Codex อยู่ใน scope ของ OpenClaw agent แทนที่จะรั่วเข้ามาจากโฮม Codex CLI ส่วนตัวของ operator

OpenClaw plugins และ snapshots ของ OpenClaw skill ยังคงไหลผ่าน plugin registry และ skill loader ของ OpenClaw เอง asset ส่วนตัวของ Codex CLI จะไม่ไหลผ่าน หากคุณมี Codex CLI skills หรือ plugins ที่มีประโยชน์และควรกลายเป็นส่วนหนึ่งของ OpenClaw agent ให้ inventory อย่างชัดเจน:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider จะคัดลอก skills เข้าไปใน workspace ของ OpenClaw agent ปัจจุบัน native plugins, hooks และไฟล์ config ของ Codex จะถูกรายงานหรือ archive เพื่อให้ตรวจสอบด้วยตนเอง แทนที่จะเปิดใช้งานอัตโนมัติ เพราะสิ่งเหล่านี้สามารถ execute commands, expose MCP servers หรือพก credentials ได้

การยืนยันตัวตนถูกเลือกตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน OpenClaw Codex ที่ระบุชัดเจนสำหรับ agent
2. บัญชีที่มีอยู่ของ app-server ในโฮม Codex ของ agent นั้น
3. สำหรับการเริ่ม local stdio app-server เท่านั้น ใช้ `CODEX_API_KEY` แล้วจึง `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server อยู่และยังต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw เห็นโปรไฟล์การยืนยันตัวตน Codex แบบ ChatGPT subscription จะลบ `CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากโปรเซสลูก Codex ที่ spawn มา วิธีนี้ทำให้ API keys ระดับ Gateway ยังคงพร้อมสำหรับ embeddings หรือโมเดล OpenAI โดยตรง โดยไม่ทำให้ turn ของ native Codex app-server ถูกคิดเงินผ่าน API โดยไม่ตั้งใจ โปรไฟล์ Codex API-key ที่ระบุชัดเจนและ local stdio env-key fallback จะใช้การเข้าสู่ระบบของ app-server แทน env ที่สืบทอดจาก child-process การเชื่อมต่อ WebSocket app-server จะไม่ได้รับ env API-key fallback ของ Gateway ให้ใช้โปรไฟล์การยืนยันตัวตนที่ระบุชัดเจนหรือบัญชีของ remote app-server เอง

หากการปรับใช้ต้องการการแยก environment เพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นลงใน `appServer.clearEnv`:

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

`appServer.clearEnv` มีผลเฉพาะกับโปรเซสลูก Codex app-server ที่ spawn มาเท่านั้น

เครื่องมือแบบไดนามิกของ Codex ใช้โปรไฟล์ `native-first` เป็นค่าเริ่มต้น ในโหมดนั้น
OpenClaw จะไม่เปิดเผยเครื่องมือแบบไดนามิกที่ซ้ำกับการดำเนินการพื้นที่ทำงานแบบเนทีฟของ Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` และ
`update_plan` เครื่องมือผสานรวมของ OpenClaw เช่น การรับส่งข้อความ, เซสชัน, สื่อ,
cron, เบราว์เซอร์, nodes, gateway, `heartbeat_respond` และ `web_search` ยังคง
พร้อมใช้งาน

ฟิลด์ Plugin Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น          | ความหมาย                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | ใช้ `"openclaw-compat"` เพื่อเปิดเผยชุดเครื่องมือแบบไดนามิกทั้งหมดของ OpenClaw ให้กับ Codex app-server |
| `codexDynamicToolsExclude` | `[]`             | ชื่อเครื่องมือแบบไดนามิกของ OpenClaw เพิ่มเติมที่จะละเว้นจากเทิร์นของ Codex app-server               |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์                         | ค่าเริ่มต้น                                  | ความหมาย                                                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                | `"stdio"` จะสปอว์น Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                             |
| `command`                     | ไบนารี Codex ที่จัดการให้                     | ไฟล์ปฏิบัติการสำหรับทรานสปอร์ต stdio ปล่อยว่างไว้เพื่อใช้ไบนารีที่จัดการให้ ตั้งค่าเฉพาะเมื่อต้องการเขียนทับอย่างชัดเจน                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]` | อาร์กิวเมนต์สำหรับทรานสปอร์ต stdio                                                                                                                                                                                                       |
| `url`                         | ไม่ได้ตั้งค่า                                    | URL ของ WebSocket app-server                                                                                                                                                                                                            |
| `authToken`                   | ไม่ได้ตั้งค่า                                    | โทเคน Bearer สำหรับทรานสปอร์ต WebSocket                                                                                                                                                                                                |
| `headers`                     | `{}`                                     | ส่วนหัว WebSocket เพิ่มเติม                                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                     | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากกระบวนการ stdio app-server ที่สปอว์น หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว `CODEX_HOME` และ `HOME` ถูกสงวนไว้สำหรับการแยก Codex ต่อเอเจนต์ของ OpenClaw ในการเรียกใช้แบบโลคัล |
| `requestTimeoutMs`            | `60000`                                  | เวลาหมดอายุสำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | หน้าต่างเงียบหลังจากคำขอ Codex app-server ที่มีขอบเขตตามเทิร์น ขณะที่ OpenClaw รอ `turn/completed` เพิ่มค่านี้สำหรับเฟสหลังใช้เครื่องมือที่ช้า หรือเฟสสังเคราะห์ที่มีเพียงสถานะ                                                                  |
| `mode`                        | `"yolo"`                                 | พรีเซ็ตสำหรับการทำงานแบบ YOLO หรือที่ผ่านการตรวจทานโดย guardian                                                                                                                                                                                      |
| `approvalPolicy`              | `"never"`                                | นโยบายการอนุมัติแบบเนทีฟของ Codex ที่ส่งไปยังการเริ่ม/ดำเนินต่อ/เทิร์นของเธรด                                                                                                                                                                       |
| `sandbox`                     | `"danger-full-access"`                   | โหมด sandbox แบบเนทีฟของ Codex ที่ส่งไปยังการเริ่ม/ดำเนินต่อของเธรด                                                                                                                                                                               |
| `approvalsReviewer`           | `"user"`                                 | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทานพรอมป์การอนุมัติแบบเนทีฟ `guardian_subagent` ยังคงเป็น alias แบบเดิม                                                                                                                         |
| `serviceTier`                 | ไม่ได้ตั้งค่า                                    | ระดับบริการ Codex app-server แบบไม่บังคับ: `"fast"`, `"flex"` หรือ `null` ค่าแบบเดิมที่ไม่ถูกต้องจะถูกละเว้น                                                                                                                            |

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดเวลาแยกจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` แต่ละรายการต้องได้รับ
การตอบกลับจาก OpenClaw ภายใน 30 วินาที เมื่อหมดเวลา OpenClaw จะยกเลิกสัญญาณ
เครื่องมือในจุดที่รองรับ และส่งคืนการตอบกลับเครื่องมือแบบไดนามิกที่ล้มเหลวให้ Codex เพื่อให้
เทิร์นดำเนินต่อได้ แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`

หลังจาก OpenClaw ตอบกลับคำขอ app-server ที่มีขอบเขตตามเทิร์นของ Codex แล้ว harness
ยังคาดว่า Codex จะจบเทิร์นเนทีฟด้วย `turn/completed` ด้วย หาก
app-server เงียบไปเป็นเวลา `appServer.turnCompletionIdleTimeoutMs` หลังจากการ
ตอบกลับนั้น OpenClaw จะพยายามขัดจังหวะเทิร์นของ Codex อย่างดีที่สุด บันทึกการวินิจฉัย
การหมดเวลา และปล่อย lane ของเซสชัน OpenClaw เพื่อไม่ให้ข้อความแชตถัดไปถูก
ต่อคิวอยู่หลังเทิร์นเนทีฟที่ค้างอยู่ การแจ้งเตือนใด ๆ ที่ยังไม่สิ้นสุดสำหรับเทิร์นเดียวกัน
รวมถึง `rawResponseItem/completed` จะปิด watchdog ระยะสั้นนั้น เพราะ Codex ได้พิสูจน์แล้วว่า
เทิร์นยังมีชีวิตอยู่ ส่วน watchdog สำหรับปลายทางที่ยาวกว่ายังคงป้องกันเทิร์นที่ติดจริง ๆ
การวินิจฉัยการหมดเวลารวมถึงเมธอดการแจ้งเตือนล่าสุดของ app-server และสำหรับรายการ
การตอบกลับ assistant แบบดิบ จะรวมชนิดรายการ บทบาท id และตัวอย่างข้อความ assistant แบบจำกัดขนาด

การเขียนทับสภาพแวดล้อมยังคงพร้อมใช้งานสำหรับการทดสอบแบบโลคัล:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้ามไบนารีที่จัดการให้เมื่อ
ไม่ได้ตั้งค่า `appServer.command`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบแบบโลคัลเฉพาะครั้ง แนะนำให้ใช้ config
สำหรับการปรับใช้ที่ทำซ้ำได้ เพราะทำให้พฤติกรรมของ Plugin อยู่ในไฟล์ที่ผ่านการตรวจทานเดียวกัน
กับการตั้งค่า harness ของ Codex ส่วนที่เหลือ

## การใช้งานคอมพิวเตอร์

Computer Use มีคู่มือการตั้งค่าแยกของตัวเอง:
[Codex Computer Use](/th/plugins/codex-computer-use)

สรุปสั้น ๆ: OpenClaw ไม่ได้ vendoring แอปควบคุมเดสก์ท็อปหรือดำเนินการ
เดสก์ท็อปเอง แต่จะเตรียม Codex app-server ตรวจสอบว่าเซิร์ฟเวอร์ MCP
`computer-use` พร้อมใช้งาน แล้วให้ Codex จัดการการเรียกเครื่องมือ MCP แบบเนทีฟ
ระหว่างเทิร์นโหมด Codex

สำหรับการเข้าถึงไดรเวอร์ TryCua โดยตรงนอกโฟลว์ marketplace ของ Codex ให้ลงทะเบียน
`cua-driver mcp` ด้วย `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`
ดู [Codex Computer Use](/th/plugins/codex-computer-use) สำหรับความแตกต่าง
ระหว่าง Computer Use ที่ Codex เป็นเจ้าของกับการลงทะเบียน MCP โดยตรง

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

Computer Use เป็นของ macOS โดยเฉพาะ และอาจต้องมีสิทธิ์ของ OS โลคัลก่อนที่
เซิร์ฟเวอร์ Codex MCP จะควบคุมแอปได้ หาก `computerUse.enabled` เป็น true และเซิร์ฟเวอร์ MCP
ไม่พร้อมใช้งาน เทิร์นโหมด Codex จะล้มเหลวก่อนเริ่มเธรด แทนที่จะ
ทำงานเงียบ ๆ โดยไม่มีเครื่องมือ Computer Use แบบเนทีฟ ดู
[Codex Computer Use](/th/plugins/codex-computer-use) สำหรับตัวเลือก marketplace,
ข้อจำกัดของแค็ตตาล็อกระยะไกล เหตุผลของสถานะ และการแก้ไขปัญหา

เมื่อ `computerUse.autoInstall` เป็น true OpenClaw สามารถลงทะเบียน
marketplace Codex Desktop มาตรฐานที่ bundled มาได้จาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` หาก Codex
ยังไม่พบ marketplace โลคัล ใช้ `/new` หรือ `/reset` หลังจาก
เปลี่ยน runtime หรือ config ของ Computer Use เพื่อให้เซสชันที่มีอยู่ไม่คงการผูก PI หรือเธรด Codex เก่าไว้

## สูตรทั่วไป

Codex แบบโลคัลพร้อมทรานสปอร์ต stdio เริ่มต้น:

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

การอนุมัติ Codex ที่ผ่านการตรวจทานโดย guardian:

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

app-server ระยะไกลพร้อมส่วนหัวที่ระบุชัดเจน:

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
กับเธรด Codex ที่มีอยู่แล้ว เทิร์นถัดไปจะส่งโมเดล
OpenAI, provider, นโยบายการอนุมัติ, sandbox และระดับบริการที่เลือกอยู่ในปัจจุบันไปยัง
app-server อีกครั้ง การสลับจาก `openai/gpt-5.5` เป็น `openai/gpt-5.2` จะคงการ
ผูกเธรดไว้ แต่ขอให้ Codex ดำเนินต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

Plugin ที่ bundled มาจะลงทะเบียน `/codex` เป็นคำสั่ง slash ที่ได้รับอนุญาต คำสั่งนี้เป็น
แบบทั่วไปและทำงานบนทุก channel ที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบทั่วไป:

- `/codex status` แสดงการเชื่อมต่อแอปเซิร์ฟเวอร์แบบสด โมเดล บัญชี ขีดจำกัดอัตราการใช้งาน เซิร์ฟเวอร์ MCP และ Skills
- `/codex models` แสดงรายการโมเดลแอปเซิร์ฟเวอร์ Codex แบบสด
- `/codex threads [filter]` แสดงรายการเธรด Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันเข้ากับเธรด Codex ที่มีอยู่
- `/codex compact` ขอให้แอปเซิร์ฟเวอร์ Codex ทำ Compaction ให้เธรดที่แนบอยู่
- `/codex review` เริ่มการรีวิวเนทีฟของ Codex สำหรับเธรดที่แนบอยู่
- `/codex diagnostics [note]` จะถามก่อนส่งฟีดแบ็กการวินิจฉัยของ Codex สำหรับเธรดที่แนบอยู่
- `/codex computer-use status` ตรวจสอบ Plugin Computer Use และเซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้
- `/codex computer-use install` ติดตั้ง Plugin Computer Use ที่กำหนดค่าไว้และโหลดเซิร์ฟเวอร์ MCP ใหม่
- `/codex account` แสดงสถานะบัญชีและขีดจำกัดอัตราการใช้งาน
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของแอปเซิร์ฟเวอร์ Codex
- `/codex skills` แสดงรายการ Skills ของแอปเซิร์ฟเวอร์ Codex

เมื่อ Codex รายงานความล้มเหลวจากขีดจำกัดการใช้งาน OpenClaw จะรวมเวลารีเซ็ต
แอปเซิร์ฟเวอร์ครั้งถัดไปเมื่อ Codex ให้ข้อมูลนั้นไว้ ใช้ `/codex account` ใน
บทสนทนาเดียวกันเพื่อตรวจสอบบัญชีปัจจุบันและหน้าต่างขีดจำกัดอัตราการใช้งาน

### เวิร์กโฟลว์การดีบักทั่วไป

เมื่อเอเจนต์ที่ใช้ Codex ทำสิ่งที่ไม่คาดคิดใน Telegram, Discord, Slack
หรือช่องทางอื่น ให้เริ่มจากบทสนทนาที่เกิดปัญหา:

1. เรียกใช้ `/diagnostics bad tool choice after image upload` หรือบันทึกสั้นๆ อื่น
   ที่อธิบายสิ่งที่คุณเห็น
2. อนุมัติคำขอการวินิจฉัยหนึ่งครั้ง การอนุมัติจะสร้างไฟล์ zip การวินิจฉัยของ Gateway
   ในเครื่อง และเนื่องจากเซสชันกำลังใช้ฮาร์เนส Codex จึงจะส่งชุดฟีดแบ็ก Codex
   ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
3. คัดลอกคำตอบการวินิจฉัยที่เสร็จสมบูรณ์ไปยังรายงานบั๊กหรือเธรดสนับสนุน
   คำตอบนั้นมีพาธชุดข้อมูลในเครื่อง สรุปความเป็นส่วนตัว รหัสเซสชัน OpenClaw
   รหัสเธรด Codex และบรรทัด `Inspect locally` สำหรับแต่ละเธรด Codex
4. หากคุณต้องการดีบักการรันด้วยตัวเอง ให้เรียกใช้คำสั่ง `Inspect locally`
   ที่พิมพ์ไว้ในเทอร์มินัล คำสั่งจะมีรูปแบบคล้าย `codex resume <thread-id>` และเปิด
   เธรด Codex เนทีฟ เพื่อให้คุณตรวจสอบบทสนทนา ทำต่อในเครื่อง
   หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือแผนนั้น

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลดฟีดแบ็ก Codex
สำหรับเธรดที่แนบอยู่ในปัจจุบันโดยเฉพาะ โดยไม่รวมชุดการวินิจฉัย Gateway ของ OpenClaw
แบบเต็ม สำหรับรายงานสนับสนุนส่วนใหญ่ `/diagnostics [note]` เป็นจุดเริ่มต้นที่ดีกว่า
เพราะจะผูกสถานะ Gateway ในเครื่องและรหัสเธรด Codex เข้าด้วยกันในคำตอบเดียว ดู
[การส่งออกการวินิจฉัย](/th/gateway/diagnostics) สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรมแชตกลุ่มแบบเต็ม

แกนหลักของ OpenClaw ยังเปิดเผย `/diagnostics [note]` แบบเฉพาะเจ้าของในฐานะคำสั่ง
การวินิจฉัย Gateway ทั่วไป พรอมป์อนุมัติของคำสั่งนี้แสดงคำนำเกี่ยวกับข้อมูลอ่อนไหว
ลิงก์ไปยัง [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) และขอเรียกใช้
`openclaw gateway diagnostics export --json` ผ่านการอนุมัติ exec อย่างชัดเจน
ทุกครั้ง ห้ามอนุมัติการวินิจฉัยด้วยกฎอนุญาตทั้งหมด หลังอนุมัติ
OpenClaw จะส่งรายงานที่วางได้พร้อมพาธชุดข้อมูลในเครื่องและสรุปแมนิเฟสต์
เมื่อเซสชัน OpenClaw ที่ใช้งานอยู่กำลังใช้ฮาร์เนส Codex การอนุมัติเดียวกันนั้น
จะอนุญาตให้ส่งชุดฟีดแบ็ก Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
พรอมป์อนุมัติจะระบุว่าจะส่งฟีดแบ็ก Codex แต่จะไม่แสดงรหัสเซสชันหรือเธรด Codex
ก่อนการอนุมัติ

หากเจ้าของเรียกใช้ `/diagnostics` ในแชตกลุ่ม OpenClaw จะรักษาช่องทางที่ใช้ร่วมกันให้สะอาด:
กลุ่มจะได้รับเพียงประกาศสั้นๆ ส่วนคำนำการวินิจฉัย พรอมป์อนุมัติ
และรหัสเซสชัน/เธรด Codex จะถูกส่งไปยังเจ้าของผ่านเส้นทางอนุมัติส่วนตัว
หากไม่มีเส้นทางเจ้าของแบบส่วนตัว OpenClaw จะปฏิเสธคำขอจากกลุ่มและขอให้เจ้าของเรียกใช้จาก DM

การอัปโหลด Codex ที่ได้รับอนุมัติจะเรียกแอปเซิร์ฟเวอร์ Codex `feedback/upload` และขอให้
แอปเซิร์ฟเวอร์รวมบันทึกสำหรับแต่ละเธรดที่ระบุและเธรดย่อย Codex ที่ถูกสร้างขึ้น
เมื่อมี การอัปโหลดจะผ่านเส้นทางฟีดแบ็กปกติของ Codex ไปยังเซิร์ฟเวอร์ OpenAI;
หากฟีดแบ็ก Codex ถูกปิดใช้งานในแอปเซิร์ฟเวอร์นั้น คำสั่งจะคืนข้อผิดพลาดของ
แอปเซิร์ฟเวอร์ คำตอบการวินิจฉัยที่เสร็จสมบูรณ์จะแสดงรายการช่องทาง
รหัสเซสชัน OpenClaw รหัสเธรด Codex และคำสั่ง `codex resume <thread-id>`
ในเครื่องสำหรับเธรดที่ถูกส่ง หากคุณปฏิเสธหรือเพิกเฉยต่อการอนุมัติ
OpenClaw จะไม่พิมพ์รหัส Codex เหล่านั้น การอัปโหลดนี้ไม่ได้แทนที่การส่งออก
การวินิจฉัย Gateway ในเครื่อง

`/codex resume` เขียนไฟล์ผูก sidecar เดียวกับที่ฮาร์เนสใช้สำหรับเทิร์นปกติ
ในข้อความถัดไป OpenClaw จะกลับไปใช้เธรด Codex นั้น ส่งโมเดล OpenClaw
ที่เลือกอยู่ในปัจจุบันไปยังแอปเซิร์ฟเวอร์ และเปิดใช้ประวัติแบบขยายต่อไป

### ตรวจสอบเธรด Codex จาก CLI

วิธีที่เร็วที่สุดในการทำความเข้าใจการรัน Codex ที่ผิดพลาดมักคือการเปิดเธรด Codex
เนทีฟโดยตรง:

```sh
codex resume <thread-id>
```

ใช้วิธีนี้เมื่อคุณพบเห็นบั๊กในบทสนทนาช่องทางหนึ่ง และต้องการตรวจสอบเซสชัน Codex
ที่มีปัญหา ทำต่อในเครื่อง หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือแนวทางการให้เหตุผล
นั้น เส้นทางที่ง่ายที่สุดมักคือเรียกใช้ `/diagnostics [note]` ก่อน: หลังคุณอนุมัติแล้ว
รายงานที่เสร็จสมบูรณ์จะแสดงรายการแต่ละเธรด Codex และพิมพ์คำสั่ง `Inspect locally`
เช่น `codex resume <thread-id>` คุณสามารถคัดลอกคำสั่งนั้นไปยังเทอร์มินัลได้โดยตรง

คุณยังสามารถรับรหัสเธรดจาก `/codex binding` สำหรับแชตปัจจุบัน หรือ
`/codex threads [filter]` สำหรับเธรดแอปเซิร์ฟเวอร์ Codex ล่าสุด จากนั้นเรียกใช้คำสั่ง
`codex resume` เดียวกันในเชลล์ของคุณ

พื้นผิวคำสั่งต้องใช้แอปเซิร์ฟเวอร์ Codex `0.125.0` หรือใหม่กว่า เมธอดควบคุมแต่ละรายการ
จะถูกรายงานเป็น `unsupported by this Codex app-server` หากแอปเซิร์ฟเวอร์ในอนาคต
หรือแบบกำหนดเองไม่ได้เปิดเผยเมธอด JSON-RPC นั้น

## ขอบเขตฮุก

ฮาร์เนส Codex มีชั้นฮุกสามชั้น:

| ชั้น                                  | เจ้าของ                  | วัตถุประสงค์                                                        |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| ฮุก Plugin ของ OpenClaw               | OpenClaw                 | ความเข้ากันได้ของผลิตภัณฑ์/Plugin ระหว่างฮาร์เนส PI และ Codex      |
| มิดเดิลแวร์ส่วนขยายแอปเซิร์ฟเวอร์ Codex | Plugin ที่มากับ OpenClaw | พฤติกรรมอะแดปเตอร์ต่อเทิร์นรอบเครื่องมือแบบไดนามิกของ OpenClaw     |
| ฮุกเนทีฟ Codex                        | Codex                    | วงจรชีวิต Codex ระดับต่ำและนโยบายเครื่องมือเนทีฟจากการกำหนดค่า Codex |

OpenClaw ไม่ใช้ไฟล์ Codex `hooks.json` ระดับโปรเจกต์หรือทั่วระบบเพื่อกำหนดเส้นทาง
พฤติกรรม Plugin ของ OpenClaw สำหรับบริดจ์เครื่องมือเนทีฟและสิทธิ์ที่รองรับ
OpenClaw จะฉีดการกำหนดค่า Codex ต่อเธรดสำหรับ `PreToolUse`, `PostToolUse`,
`PermissionRequest` และ `Stop` เมื่อเปิดใช้การอนุมัติของแอปเซิร์ฟเวอร์ Codex
(`approvalPolicy` ไม่ใช่ `"never"`) การกำหนดค่าฮุกเนทีฟที่ฉีดโดยค่าเริ่มต้น
จะละเว้น `PermissionRequest` เพื่อให้ผู้ตรวจสอบของแอปเซิร์ฟเวอร์ Codex และบริดจ์
การอนุมัติของ OpenClaw จัดการการยกระดับจริงหลังการรีวิว ผู้ปฏิบัติการยังสามารถเพิ่ม
`permission_request` ไปยัง `nativeHookRelay.events` อย่างชัดเจนได้เมื่อจำเป็นต้องใช้
รีเลย์ความเข้ากันได้ ฮุก Codex อื่นๆ เช่น `SessionStart` และ `UserPromptSubmit`
ยังคงเป็นการควบคุมระดับ Codex; ฮุกเหล่านี้ไม่ได้เปิดเผยเป็นฮุก Plugin ของ OpenClaw
ในสัญญา v1

สำหรับเครื่องมือแบบไดนามิกของ OpenClaw OpenClaw จะดำเนินการเครื่องมือหลัง Codex ขอให้เรียก
ดังนั้น OpenClaw จึงเรียกพฤติกรรม Plugin และมิดเดิลแวร์ที่ตนเป็นเจ้าของใน
อะแดปเตอร์ฮาร์เนส สำหรับเครื่องมือเนทีฟของ Codex, Codex เป็นเจ้าของเรคคอร์ดเครื่องมือ
ตามมาตรฐาน OpenClaw สามารถมิเรอร์เหตุการณ์ที่เลือกได้ แต่ไม่สามารถเขียนเธรด Codex
เนทีฟใหม่ได้ เว้นแต่ Codex จะเปิดเผยการดำเนินการนั้นผ่านแอปเซิร์ฟเวอร์หรือคอลแบ็กฮุก
เนทีฟ

การฉายภาพ Compaction และวงจรชีวิต LLM มาจากการแจ้งเตือนของแอปเซิร์ฟเวอร์ Codex
และสถานะอะแดปเตอร์ OpenClaw ไม่ใช่คำสั่งฮุก Codex เนทีฟ เหตุการณ์
`before_compaction`, `after_compaction`, `llm_input` และ
`llm_output` ของ OpenClaw เป็นการสังเกตระดับอะแดปเตอร์ ไม่ใช่การจับข้อมูลแบบไบต์ต่อไบต์
ของคำขอภายในหรือเพย์โหลด Compaction ของ Codex

การแจ้งเตือนแอปเซิร์ฟเวอร์ Codex แบบเนทีฟ `hook/started` และ `hook/completed`
จะถูกฉายเป็นเหตุการณ์เอเจนต์ `codex_app_server.hook` สำหรับเส้นทางการทำงานและการดีบัก
การแจ้งเตือนเหล่านี้ไม่ได้เรียกฮุก Plugin ของ OpenClaw

## สัญญาการรองรับ V1

โหมด Codex ไม่ใช่ PI ที่มีเพียงการเรียกโมเดลแตกต่างกันอยู่เบื้องหลัง Codex เป็นเจ้าของ
ลูปโมเดลเนทีฟมากกว่า และ OpenClaw ปรับพื้นผิว Plugin และเซสชันของตน
รอบขอบเขตนั้น

รองรับในรันไทม์ Codex v1:

| พื้นผิว                                       | การรองรับ                                                                              | เหตุผล                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ลูปโมเดล OpenAI ผ่าน Codex               | รองรับ                                                                            | แอปเซิร์ฟเวอร์ Codex เป็นเจ้าของเทิร์น OpenAI, การดำเนินเธรดเดิมต่อ และการดำเนินเครื่องมือเดิมต่อ                                                                                                                 |
| การกำหนดเส้นทางและการส่งมอบช่องทาง OpenClaw         | รองรับ                                                                            | Telegram, Discord, Slack, WhatsApp, iMessage และช่องทางอื่นๆ ยังคงอยู่นอกรันไทม์ของโมเดล                                                                                                           |
| เครื่องมือแบบไดนามิกของ OpenClaw                        | รองรับ                                                                            | Codex ขอให้ OpenClaw เรียกใช้เครื่องมือเหล่านี้ ดังนั้น OpenClaw จึงยังอยู่ในเส้นทางการเรียกใช้                                                                                                                       |
| Plugin พรอมป์และบริบท                    | รองรับ                                                                            | OpenClaw สร้างโอเวอร์เลย์พรอมป์และส่งบริบทเข้าสู่เทิร์น Codex ก่อนเริ่มหรือดำเนินเธรดต่อ                                                                                           |
| วงจรชีวิตของเอนจินบริบท                      | รองรับ                                                                            | การประกอบ, การนำเข้า หรือการบำรุงรักษาหลังเทิร์น และการประสานงาน Compaction ของเอนจินบริบททำงานสำหรับเทิร์น Codex                                                                                                |
| ฮุกเครื่องมือแบบไดนามิก                            | รองรับ                                                                            | `before_tool_call`, `after_tool_call` และมิดเดิลแวร์ผลลัพธ์เครื่องมือทำงานรอบเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของ                                                                                                 |
| ฮุกวงจรชีวิต                               | รองรับในฐานะการสังเกตของอะแดปเตอร์                                                    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` และ `after_compaction` จะทำงานพร้อมเพย์โหลดโหมด Codex ที่ตรงตามจริง                                                                                  |
| เกตการแก้ไขคำตอบสุดท้าย                    | รองรับผ่านรีเลย์ฮุกเดิม                                              | Codex `Stop` ถูกรีเลย์ไปยัง `before_agent_finalize`; `revise` ขอให้ Codex ทำรอบโมเดลอีกหนึ่งครั้งก่อนสรุปผล                                                                                       |
| การบล็อกหรือสังเกตเชลล์, แพตช์ และ MCP เดิม | รองรับผ่านรีเลย์ฮุกเดิม                                              | Codex `PreToolUse` และ `PostToolUse` ถูกรีเลย์สำหรับพื้นผิวเครื่องมือเดิมที่คอมมิตแล้ว รวมถึงเพย์โหลด MCP บนแอปเซิร์ฟเวอร์ Codex `0.125.0` หรือใหม่กว่า รองรับการบล็อก แต่ไม่รองรับการเขียนอาร์กิวเมนต์ใหม่      |
| นโยบายสิทธิ์เดิม                      | รองรับผ่านการอนุมัติของแอปเซิร์ฟเวอร์ Codex และรีเลย์ฮุกเดิมเพื่อความเข้ากันได้ | คำขออนุมัติของแอปเซิร์ฟเวอร์ Codex ถูกส่งผ่าน OpenClaw หลังจากการตรวจสอบของ Codex รีเลย์ฮุกเดิม `PermissionRequest` เป็นตัวเลือกสำหรับโหมดการอนุมัติเดิม เพราะ Codex ส่งออกมาก่อนการตรวจสอบของตัวคุ้มกัน |
| การจับเส้นทางของแอปเซิร์ฟเวอร์                 | รองรับ                                                                            | OpenClaw บันทึกคำขอที่ส่งไปยังแอปเซิร์ฟเวอร์และการแจ้งเตือนจากแอปเซิร์ฟเวอร์ที่ได้รับ                                                                                                           |

ไม่รองรับในรันไทม์ Codex v1:

| พื้นผิว                                             | ขอบเขต V1                                                                                                                                     | เส้นทางในอนาคต                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| การแก้ไขอาร์กิวเมนต์เครื่องมือเดิม                       | ฮุกก่อนเครื่องมือเดิมของ Codex สามารถบล็อกได้ แต่ OpenClaw ไม่เขียนอาร์กิวเมนต์เครื่องมือเดิมของ Codex ใหม่                                               | ต้องมีการรองรับฮุก/สคีมา Codex สำหรับอินพุตเครื่องมือทดแทน                            |
| ประวัติทรานสคริปต์เดิมของ Codex ที่แก้ไขได้            | Codex เป็นเจ้าของประวัติเธรดเดิมที่เป็นแหล่งจริง OpenClaw เป็นเจ้าของสำเนาสะท้อนและสามารถฉายบริบทในอนาคตได้ แต่ไม่ควรแก้ไขอินเทอร์นัลที่ไม่รองรับ | เพิ่ม API แอปเซิร์ฟเวอร์ Codex ที่ชัดเจนหากจำเป็นต้องผ่าตัดเธรดเดิม                    |
| `tool_result_persist` สำหรับระเบียนเครื่องมือเดิมของ Codex | ฮุกนั้นแปลงการเขียนทรานสคริปต์ที่ OpenClaw เป็นเจ้าของ ไม่ใช่ระเบียนเครื่องมือเดิมของ Codex                                                           | อาจสะท้อนระเบียนที่แปลงแล้วได้ แต่การเขียนแหล่งจริงใหม่ต้องอาศัยการรองรับจาก Codex              |
| เมตาดาตา Compaction เดิมแบบละเอียด                     | OpenClaw สังเกตจุดเริ่มต้นและจุดสิ้นสุดของ Compaction แต่ไม่ได้รับรายการคงไว้/ทิ้งที่เสถียร, ส่วนต่างโทเค็น หรือเพย์โหลดสรุป            | ต้องมีอีเวนต์ Compaction ของ Codex ที่ละเอียดขึ้น                                                     |
| การแทรกแซง Compaction                             | ฮุก Compaction ปัจจุบันของ OpenClaw อยู่ระดับการแจ้งเตือนในโหมด Codex                                                                         | เพิ่มฮุกก่อน/หลัง Compaction ของ Codex หาก Plugin ต้องยับยั้งหรือเขียน Compaction เดิมใหม่ |
| การจับคำขอ API โมเดลแบบไบต์ต่อไบต์             | OpenClaw สามารถจับคำขอและการแจ้งเตือนของแอปเซิร์ฟเวอร์ได้ แต่แกน Codex สร้างคำขอ API OpenAI สุดท้ายภายใน                      | ต้องมีอีเวนต์ติดตามคำขอโมเดลของ Codex หรือ API ดีบัก                                   |

## เครื่องมือ, สื่อ และ Compaction

ฮาร์เนส Codex เปลี่ยนเฉพาะตัวเรียกใช้เอเจนต์ฝังตัวระดับล่างเท่านั้น

OpenClaw ยังคงสร้างรายการเครื่องมือและรับผลลัพธ์เครื่องมือแบบไดนามิกจาก
ฮาร์เนส ข้อความ, รูปภาพ, วิดีโอ, เพลง, TTS, การอนุมัติ และเอาต์พุตเครื่องมือส่งข้อความ
ยังคงผ่านเส้นทางการส่งมอบปกติของ OpenClaw

รีเลย์ฮุกเดิมตั้งใจให้เป็นแบบทั่วไป แต่สัญญาการรองรับ v1
จำกัดอยู่ที่เส้นทางเครื่องมือเดิมและสิทธิ์ของ Codex ที่ OpenClaw ทดสอบ ใน
รันไทม์ Codex นั่นรวมถึงเพย์โหลดเชลล์, แพตช์ และ MCP `PreToolUse`,
`PostToolUse` และ `PermissionRequest` อย่าสันนิษฐานว่าอีเวนต์ฮุก Codex
ในอนาคตทุกอีเวนต์เป็นพื้นผิว Plugin ของ OpenClaw จนกว่าสัญญารันไทม์จะระบุ
ชื่ออีเวนต์นั้น

สำหรับ `PermissionRequest` OpenClaw จะส่งกลับคำตัดสินอนุญาตหรือปฏิเสธอย่างชัดเจน
เฉพาะเมื่อนโยบายตัดสินแล้ว ผลลัพธ์ที่ไม่มีคำตัดสินไม่ใช่การอนุญาต Codex ถือว่า
ไม่มีคำตัดสินจากฮุกและปล่อยต่อไปยังตัวคุ้มกันหรือเส้นทางการอนุมัติจากผู้ใช้ของตนเอง
โหมดการอนุมัติของแอปเซิร์ฟเวอร์ Codex จะละฮุกเดิมนี้โดยค่าเริ่มต้น ย่อหน้านี้
มีผลเมื่อ `permission_request` ถูกใส่ไว้อย่างชัดเจนใน
`nativeHookRelay.events` หรือรันไทม์เพื่อความเข้ากันได้ติดตั้งฮุกนั้น
เมื่อผู้ปฏิบัติการเลือก `allow-always` สำหรับคำขอสิทธิ์เดิมของ Codex
OpenClaw จะจดจำลายนิ้วมือ provider/session/tool input/cwd ที่ตรงนั้นสำหรับ
ช่วงเวลาของเซสชันที่จำกัด การตัดสินใจที่จดจำไว้ตั้งใจให้ตรงแบบเป๊ะเท่านั้น:
คำสั่ง, อาร์กิวเมนต์, เพย์โหลดเครื่องมือ หรือ cwd ที่เปลี่ยนไปจะสร้างการอนุมัติ
ใหม่

การขออนุมัติเครื่องมือ Codex MCP ถูกส่งผ่านโฟลว์การอนุมัติ Plugin ของ OpenClaw
เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"` พรอมป์ Codex `request_user_input` จะถูกส่งกลับไปยัง
แชทต้นทาง และข้อความติดตามที่เข้าคิวถัดไปจะตอบคำขอเซิร์ฟเวอร์เดิมนั้นแทนที่จะถูก
นำทางเป็นบริบทเพิ่มเติม คำขอ MCP elicitation อื่นๆ ยังคงล้มเหลวแบบปิด

การนำทางคิวระหว่างรันที่ใช้งานอยู่แมปกับ `turn/steer` ของแอปเซิร์ฟเวอร์ Codex ด้วย
ค่าเริ่มต้น `messages.queue.mode: "steer"` OpenClaw จะรวมข้อความแชทที่เข้าคิว
สำหรับช่วงเวลานิ่งที่กำหนดค่าไว้ และส่งเป็นคำขอ `turn/steer` เดียวตาม
ลำดับที่มาถึง โหมด `queue` แบบเดิมส่งคำขอ `turn/steer` แยกกัน การตรวจสอบ
Codex และเทิร์น Compaction แบบแมนนวลสามารถปฏิเสธการนำทางในเทิร์นเดียวกันได้ ซึ่งในกรณีนั้น
OpenClaw จะใช้คิวติดตามเมื่อโหมดที่เลือกอนุญาตให้ถอยกลับ ดู
[คิวการนำทาง](/th/concepts/queue-steering)

เมื่อโมเดลที่เลือกใช้ฮาร์เนส Codex, Compaction เธรดเดิมจะถูกมอบหมายให้
แอปเซิร์ฟเวอร์ Codex OpenClaw เก็บสำเนาทรานสคริปต์สะท้อนสำหรับประวัติช่องทาง,
การค้นหา, `/new`, `/reset` และการสลับโมเดลหรือฮาร์เนสในอนาคต สำเนาสะท้อน
รวมพรอมป์ผู้ใช้, ข้อความผู้ช่วยสุดท้าย และระเบียนการให้เหตุผลหรือแผนแบบเบาของ Codex
เมื่อแอปเซิร์ฟเวอร์ส่งออกมา ปัจจุบัน OpenClaw บันทึกเฉพาะสัญญาณการเริ่มต้นและ
การเสร็จสิ้น Compaction เดิมเท่านั้น ยังไม่เปิดเผยสรุป Compaction ที่มนุษย์อ่านได้
หรือรายการที่ตรวจสอบได้ว่า Codex เก็บรายการใดไว้หลัง Compaction

เพราะ Codex เป็นเจ้าของเธรดเดิมที่เป็นแหล่งจริง `tool_result_persist` จึงไม่ได้
เขียนระเบียนผลลัพธ์เครื่องมือเดิมของ Codex ใหม่ในปัจจุบัน โดยจะใช้เฉพาะเมื่อ
OpenClaw กำลังเขียนผลลัพธ์เครื่องมือทรานสคริปต์เซสชันที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่ต้องใช้ PI รูปภาพ, วิดีโอ, เพลง, PDF, TTS และการทำความเข้าใจสื่อ
ยังคงใช้การตั้งค่า provider/model ที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็น provider `/model` ปกติ:** นั่นเป็นสิ่งที่คาดไว้สำหรับ
คอนฟิกใหม่ เลือกโมเดล `openai/gpt-*` ที่มี
`agentRuntime.id: "codex"` (หรืออ้างอิง `codex/*` แบบเดิม), เปิดใช้งาน
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ตัด
`codex` ออกหรือไม่

**OpenClaw ใช้ PI แทน Codex:** `agentRuntime.id: "auto"` ยังสามารถใช้ PI เป็น
แบ็กเอนด์เพื่อความเข้ากันได้เมื่อไม่มีฮาร์เนส Codex รับรันนั้น ตั้งค่า
`agentRuntime.id: "codex"` เพื่อบังคับเลือก Codex ระหว่างทดสอบ รันไทม์ Codex
ที่ถูกบังคับจะล้มเหลวแทนการถอยกลับไปใช้ PI เมื่อเลือกแอปเซิร์ฟเวอร์ Codex แล้ว
ความล้มเหลวของแอปเซิร์ฟเวอร์จะแสดงโดยตรง

**แอปเซิร์ฟเวอร์ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้แฮนด์เชกของแอปเซิร์ฟเวอร์
รายงานเวอร์ชัน `0.125.0` หรือใหม่กว่า พรีรีลีสเวอร์ชันเดียวกันหรือเวอร์ชันที่มี
ส่วนต่อท้ายบิลด์ เช่น `0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธเพราะ
พื้นโปรโตคอลเสถียร `0.125.0` คือสิ่งที่ OpenClaw ทดสอบ

**การค้นพบโมเดลช้า:** ลด `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิดใช้งานการค้นพบ

**ทรานสปอร์ต WebSocket ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`,
และตรวจสอบว่าแอปเซิร์ฟเวอร์ระยะไกลพูดโปรโตคอลแอปเซิร์ฟเวอร์ Codex เวอร์ชันเดียวกัน

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นั่นเป็นสิ่งที่คาดไว้ เว้นแต่คุณบังคับ
`agentRuntime.id: "codex"` สำหรับเอเจนต์นั้นหรือเลือกอ้างอิง `codex/*`
แบบเดิม อ้างอิง `openai/gpt-*` ทั่วไปและ provider อื่นๆ จะยังอยู่บนเส้นทาง
provider ปกติในโหมด `auto` หากคุณบังคับ `agentRuntime.id: "codex"` ทุกเทิร์น
ฝังตัวสำหรับเอเจนต์นั้นต้องเป็นโมเดล OpenAI ที่ Codex รองรับ

**ติดตั้ง Computer Use แล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงานว่า
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงเป็นอยู่ ให้รีสตาร์ท
Gateway เพื่อล้างการลงทะเบียน native hook ที่ค้างอยู่ หาก `computer-use.list_apps`
หมดเวลา ให้รีสตาร์ท Codex Computer Use หรือ Codex Desktop แล้วลองอีกครั้ง

## ที่เกี่ยวข้อง

- [Plugin ฮาร์เนสเอเจนต์](/th/plugins/sdk-agent-harness)
- [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [สถานะ](/th/cli/status)
- [ฮุกของ Plugin](/th/plugins/hooks)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
