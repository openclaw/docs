---
read_when:
    - คุณต้องการใช้ชุดโครงทดสอบ app-server ของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่าฮาร์เนสของ Codex
    - คุณต้องการให้การปรับใช้แบบเฉพาะ Codex ล้มเหลวแทนที่จะเปลี่ยนกลับไปใช้ PI
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่รวมมาให้
title: ฮาร์เนส Codex
x-i18n:
    generated_at: "2026-04-30T20:05:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่รวมมาให้ช่วยให้ OpenClaw รันรอบเอเจนต์แบบฝังตัวผ่าน
Codex app-server แทนฮาร์เนส PI ที่มีมาในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง: การค้นหา
โมเดล, การกลับมาทำงานต่อของเธรดแบบเนทีฟ, Compaction แบบเนทีฟ และการประมวลผลบน app-server
OpenClaw ยังคงเป็นเจ้าของช่องทางแชต, ไฟล์เซสชัน, การเลือกโมเดล, เครื่องมือ,
การอนุมัติ, การส่งสื่อ และสำเนาทรานสคริปต์ที่มองเห็นได้

หากคุณกำลังพยายามทำความเข้าใจภาพรวม ให้เริ่มจาก
[รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) สรุปสั้น ๆ คือ:
`openai/gpt-5.5` คือการอ้างอิงโมเดล, `codex` คือรันไทม์ และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## Plugin นี้เปลี่ยนอะไร

Plugin `codex` ที่รวมมาให้เพิ่มความสามารถแยกกันหลายอย่าง:

| ความสามารถ                        | วิธีใช้                                      | สิ่งที่ทำ                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| รันไทม์แบบฝังตัวเนทีฟ           | `agentRuntime.id: "codex"`                          | รันรอบเอเจนต์แบบฝังตัวของ OpenClaw ผ่าน Codex app-server                  |
| คำสั่งควบคุมแชตเนทีฟ      | `/codex bind`, `/codex resume`, `/codex steer`, ... | ผูกและควบคุมเธรด Codex app-server จากการสนทนาผ่านข้อความ    |
| ผู้ให้บริการ/แค็ตตาล็อก Codex app-server | ภายใน `codex` แสดงผ่านฮาร์เนส     | ให้รันไทม์ค้นหาและตรวจสอบโมเดล app-server                     |
| เส้นทางการเข้าใจสื่อของ Codex    | เส้นทางความเข้ากันได้ของโมเดลรูปภาพ `codex/*`           | รันรอบ Codex app-server แบบจำกัดขอบเขตสำหรับโมเดลเข้าใจรูปภาพที่รองรับ |
| การส่งต่อฮุคเนทีฟ                 | ฮุค Plugin รอบเหตุการณ์เนทีฟของ Codex             | ให้ OpenClaw สังเกตการณ์/บล็อกเหตุการณ์เครื่องมือ/การจบงานเนทีฟของ Codex ที่รองรับ  |

การเปิดใช้ Plugin ทำให้ความสามารถเหล่านั้นพร้อมใช้งาน สิ่งนี้ **ไม่ได้**:

- เริ่มใช้ Codex สำหรับโมเดล OpenAI ทุกตัว
- แปลงการอ้างอิงโมเดล `openai-codex/*` เป็นรันไทม์เนทีฟ
- ทำให้ ACP/acpx เป็นเส้นทาง Codex เริ่มต้น
- สลับเซสชันเดิมที่บันทึกรันไทม์ PI ไว้แล้วแบบทันที
- แทนที่การส่งผ่านช่องทางของ OpenClaw, ไฟล์เซสชัน, การจัดเก็บโปรไฟล์ยืนยันตัวตน หรือ
  การกำหนดเส้นทางข้อความ

Plugin เดียวกันยังเป็นเจ้าของพื้นผิวคำสั่งควบคุมแชตเนทีฟ `/codex` ด้วย หาก
เปิดใช้ Plugin แล้วผู้ใช้ขอผูก, กลับมาทำงานต่อ, บังคับทิศทาง, หยุด หรือตรวจสอบ
เธรด Codex จากแชต เอเจนต์ควรเลือกใช้ `/codex ...` แทน ACP ACP ยังคง
เป็นทางสำรองที่ชัดเจนเมื่อผู้ใช้ขอ ACP/acpx หรือกำลังทดสอบอะแดปเตอร์ ACP
ของ Codex

รอบ Codex แบบเนทีฟยังคงใช้ฮุค Plugin ของ OpenClaw เป็นเลเยอร์ความเข้ากันได้สาธารณะ
ฮุคเหล่านี้เป็นฮุค OpenClaw ในโปรเซส ไม่ใช่ฮุคคำสั่ง Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` สำหรับเรคอร์ดทรานสคริปต์ที่สะท้อน
- `before_agent_finalize` ผ่านการส่งต่อ `Stop` ของ Codex
- `agent_end`

Plugins ยังสามารถลงทะเบียนมิดเดิลแวร์ผลลัพธ์เครื่องมือที่ไม่ผูกกับรันไทม์ เพื่อเขียนผลลัพธ์
เครื่องมือแบบไดนามิกของ OpenClaw ใหม่หลังจาก OpenClaw ประมวลผลเครื่องมือและก่อนที่
ผลลัพธ์จะถูกส่งกลับไปยัง Codex สิ่งนี้แยกจากฮุค Plugin สาธารณะ
`tool_result_persist` ซึ่งแปลงการเขียนผลลัพธ์เครื่องมือลงทรานสคริปต์ที่ OpenClaw เป็นเจ้าของ

สำหรับความหมายของฮุค Plugin เอง ดู [ฮุค Plugin](/th/plugins/hooks)
และ [พฤติกรรมตัวคุม Plugin](/th/tools/plugin)

ฮาร์เนสปิดไว้โดยค่าเริ่มต้น คอนฟิกใหม่ควรคงการอ้างอิงโมเดล OpenAI แบบมาตรฐานไว้เป็น
`openai/gpt-*` และบังคับใช้อย่างชัดเจนด้วย
`agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` เมื่อต้องการ
การประมวลผล app-server แบบเนทีฟ การอ้างอิงโมเดลเดิม `codex/*` ยังคงเลือก
ฮาร์เนสโดยอัตโนมัติเพื่อความเข้ากันได้ แต่คำนำหน้าผู้ให้บริการเดิมที่มีรันไทม์รองรับ
จะไม่แสดงเป็นตัวเลือกโมเดล/ผู้ให้บริการปกติ

หากเปิดใช้ Plugin `codex` แต่โมเดลหลักยังเป็น
`openai-codex/*`, `openclaw doctor` จะแจ้งเตือนแทนการเปลี่ยนเส้นทาง สิ่งนี้
ตั้งใจให้เป็นเช่นนั้น: `openai-codex/*` ยังคงเป็นเส้นทาง OAuth/การสมัครสมาชิกของ PI Codex และ
การประมวลผล app-server แบบเนทีฟยังคงเป็นตัวเลือกรันไทม์ที่ต้องระบุอย่างชัดเจน

## แผนที่เส้นทาง

ใช้ตารางนี้ก่อนเปลี่ยนคอนฟิก:

| พฤติกรรมที่ต้องการ                            | การอ้างอิงโมเดล                  | คอนฟิกรันไทม์                         | ข้อกำหนดของ Plugin          | ป้ายสถานะที่คาดหวัง          |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API ผ่านตัวรัน OpenClaw ปกติ   | `openai/gpt-*`             | ละไว้หรือ `runtime: "pi"`             | ผู้ให้บริการ OpenAI             | `Runtime: OpenClaw Pi Default` |
| OAuth/การสมัครสมาชิก Codex ผ่าน PI         | `openai-codex/gpt-*`       | ละไว้หรือ `runtime: "pi"`             | ผู้ให้บริการ OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| รอบแบบฝังตัวของ Codex app-server เนทีฟ      | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| ผู้ให้บริการผสมพร้อมโหมดอัตโนมัติแบบอนุรักษ์นิยม | การอ้างอิงเฉพาะผู้ให้บริการ     | `agentRuntime.id: "auto"`              | รันไทม์ Plugin เสริม    | ขึ้นอยู่กับรันไทม์ที่เลือก    |
| เซสชันอะแดปเตอร์ Codex ACP แบบชัดเจน          | ขึ้นอยู่กับพรอมป์/โมเดล ACP | `sessions_spawn` พร้อม `runtime: "acp"` | แบ็กเอนด์ `acpx` ที่สมบูรณ์      | สถานะงาน/เซสชัน ACP        |

จุดแบ่งสำคัญคือผู้ให้บริการเทียบกับรันไทม์:

- `openai-codex/*` ตอบว่า "PI ควรใช้เส้นทางผู้ให้บริการ/ยืนยันตัวตนใด?"
- `agentRuntime.id: "codex"` ตอบว่า "ลูปใดควรประมวลผลรอบแบบฝังตัวนี้?"
- `/codex ...` ตอบว่า "แชตนี้ควรผูกหรือควบคุมการสนทนา Codex เนทีฟใด?"
- ACP ตอบว่า "acpx ควรเรียกโปรเซสฮาร์เนสภายนอกใด?"

## เลือกคำนำหน้าโมเดลที่ถูกต้อง

เส้นทางตระกูล OpenAI เจาะจงตามคำนำหน้า ใช้ `openai-codex/*` เมื่อคุณต้องการ
Codex OAuth ผ่าน PI; ใช้ `openai/*` เมื่อคุณต้องการเข้าถึง OpenAI API โดยตรง หรือ
เมื่อคุณกำลังบังคับใช้ฮาร์เนส Codex app-server แบบเนทีฟ:

| การอ้างอิงโมเดล                                     | เส้นทางรันไทม์                                 | ใช้เมื่อ                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | ผู้ให้บริการ OpenAI ผ่านท่อ OpenClaw/PI | คุณต้องการเข้าถึง OpenAI Platform API โดยตรงปัจจุบันด้วย `OPENAI_API_KEY` |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth ผ่าน OpenClaw/PI       | คุณต้องการยืนยันตัวตนการสมัครสมาชิก ChatGPT/Codex ด้วยตัวรัน PI เริ่มต้น      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | ฮาร์เนส Codex app-server                     | คุณต้องการการประมวลผล Codex app-server แบบเนทีฟสำหรับรอบเอเจนต์แบบฝังตัว   |

ปัจจุบัน GPT-5.5 ใน OpenClaw ใช้ได้เฉพาะการสมัครสมาชิก/OAuth ใช้
`openai-codex/gpt-5.5` สำหรับ PI OAuth หรือ `openai/gpt-5.5` พร้อมฮาร์เนส
Codex app-server การเข้าถึงด้วยคีย์ API โดยตรงสำหรับ `openai/gpt-5.5` จะรองรับ
เมื่อ OpenAI เปิดใช้ GPT-5.5 บน API สาธารณะ

การอ้างอิงเดิม `codex/gpt-*` ยังคงยอมรับเป็นนามแฝงเพื่อความเข้ากันได้ การย้ายข้อมูล
ความเข้ากันได้ของ Doctor จะเขียนการอ้างอิงรันไทม์หลักเดิมใหม่เป็นการอ้างอิงโมเดล
มาตรฐานและบันทึกนโยบายรันไทม์แยกไว้ ขณะที่การอ้างอิงเดิมที่ใช้เฉพาะเป็นตัวสำรอง
จะคงไว้ไม่เปลี่ยน เพราะรันไทม์ถูกกำหนดค่าสำหรับคอนเทนเนอร์เอเจนต์ทั้งชุด
คอนฟิก PI Codex OAuth ใหม่ควรใช้ `openai-codex/gpt-*`; คอนฟิกฮาร์เนส
app-server เนทีฟใหม่ควรใช้ `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"`

`agents.defaults.imageModel` ใช้การแบ่งคำนำหน้าเดียวกัน ใช้
`openai-codex/gpt-*` เมื่อการเข้าใจรูปภาพควรรันผ่านเส้นทางผู้ให้บริการ OpenAI
Codex OAuth ใช้ `codex/gpt-*` เมื่อการเข้าใจรูปภาพควรรัน
ผ่านรอบ Codex app-server แบบจำกัดขอบเขต โมเดล Codex app-server ต้อง
ประกาศว่ารองรับอินพุตรูปภาพ; โมเดล Codex แบบข้อความอย่างเดียวจะล้มเหลวก่อนรอบสื่อ
เริ่มต้น

ใช้ `/status` เพื่อยืนยันฮาร์เนสที่มีผลสำหรับเซสชันปัจจุบัน หากการเลือก
น่าประหลาดใจ ให้เปิดการบันทึกดีบักสำหรับซับซิสเต็ม `agents/harness`
และตรวจสอบเรคอร์ดแบบมีโครงสร้าง `agent harness selected` ของ Gateway ซึ่ง
มีรหัสฮาร์เนสที่เลือก, เหตุผลการเลือก, นโยบายรันไทม์/ตัวสำรอง และ
ในโหมด `auto` ผลลัพธ์การรองรับของผู้สมัคร Plugin แต่ละตัว

### ความหมายของคำเตือนจาก doctor

`openclaw doctor` จะแจ้งเตือนเมื่อทั้งหมดนี้เป็นจริง:

- Plugin `codex` ที่รวมมาให้ถูกเปิดใช้หรือได้รับอนุญาต
- โมเดลหลักของเอเจนต์เป็น `openai-codex/*`
- รันไทม์ที่มีผลของเอเจนต์นั้นไม่ใช่ `codex`

คำเตือนนั้นมีอยู่เพราะผู้ใช้มักคาดว่า "เปิดใช้ Plugin Codex" จะหมายถึง
"รันไทม์ Codex app-server แบบเนทีฟ" OpenClaw ไม่ได้ข้ามไปเช่นนั้น คำเตือน
หมายความว่า:

- **ไม่จำเป็นต้องเปลี่ยนแปลง** หากคุณตั้งใจใช้ ChatGPT/Codex OAuth ผ่าน PI
- เปลี่ยนโมเดลเป็น `openai/<model>` และตั้งค่า
  `agentRuntime.id: "codex"` หากคุณตั้งใจใช้การประมวลผล
  app-server แบบเนทีฟ
- เซสชันเดิมยังต้องใช้ `/new` หรือ `/reset` หลังเปลี่ยนรันไทม์
  เพราะหมุดรันไทม์ของเซสชันติดอยู่กับเซสชัน

การเลือกฮาร์เนสไม่ใช่การควบคุมเซสชันแบบสด เมื่อรอบแบบฝังตัวรัน
OpenClaw จะบันทึกรหัสฮาร์เนสที่เลือกไว้บนเซสชันนั้นและใช้ต่อไปสำหรับ
รอบถัดไปในรหัสเซสชันเดียวกัน เปลี่ยนคอนฟิก `agentRuntime` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อคุณต้องการให้เซสชันในอนาคตใช้ฮาร์เนสอื่น;
ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับการสนทนาเดิม
ระหว่าง PI และ Codex วิธีนี้หลีกเลี่ยงการเล่นซ้ำทรานสคริปต์เดียวผ่าน
ระบบเซสชันเนทีฟสองระบบที่เข้ากันไม่ได้

เซสชันเดิมที่สร้างก่อนมีหมุดฮาร์เนสจะถือว่าเป็นเซสชันที่ปักกับ PI เมื่อมี
ประวัติทรานสคริปต์แล้ว ใช้ `/new` หรือ `/reset` เพื่อเลือกให้การสนทนานั้น
เข้า Codex หลังเปลี่ยนคอนฟิก

`/status` แสดงรันไทม์โมเดลที่มีผล ฮาร์เนส PI เริ่มต้นแสดงเป็น
`Runtime: OpenClaw Pi Default` และฮาร์เนส Codex app-server แสดงเป็น
`Runtime: OpenAI Codex`

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` ที่รวมมาให้พร้อมใช้งาน
- Codex app-server `0.125.0` หรือใหม่กว่า Plugin ที่รวมมาให้จัดการไบนารี
  Codex app-server ที่เข้ากันได้โดยค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH` จึง
  ไม่กระทบการเริ่มฮาร์เนสตามปกติ
- การยืนยันตัวตน Codex ที่พร้อมให้โปรเซส app-server หรือบริดจ์ยืนยันตัวตน Codex
  ของ OpenClaw การเรียก app-server แบบ stdio ในเครื่องใช้โฮม Codex ที่ OpenClaw จัดการให้สำหรับแต่ละ
  เอเจนต์และ `HOME` ของโปรเซสลูกที่แยกกัน ดังนั้นโดยค่าเริ่มต้นจึงไม่อ่านบัญชี
  `~/.codex` ส่วนตัว, Skills, Plugins, คอนฟิก, สถานะเธรด หรือ
  `$HOME/.agents/skills` เนทีฟของคุณ

Plugin จะบล็อกการจับมือ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน สิ่งนี้ทำให้
OpenClaw อยู่บนพื้นผิวโปรโตคอลที่ผ่านการทดสอบมาแล้ว

สำหรับการทดสอบควันแบบสดและ Docker การยืนยันตัวตนมักมาจากบัญชี Codex CLI
หรือโปรไฟล์ยืนยันตัวตน `openai-codex` ของ OpenClaw การเรียก app-server แบบ stdio ในเครื่อง
ยังสามารถถอยไปใช้ `CODEX_API_KEY` / `OPENAI_API_KEY` ได้เมื่อไม่มีบัญชีอยู่

## คอนฟิกขั้นต่ำ

ใช้ `openai/gpt-5.5`, เปิดใช้ Plugin ที่รวมมาให้ และบังคับใช้ฮาร์เนส `codex`:

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
`codex/<model>` ยังคงเปิดใช้ Plugin `codex` ที่รวมมาให้โดยอัตโนมัติ คอนฟิกใหม่ควร
เลือกใช้ `openai/<model>` พร้อมรายการ `agentRuntime` ที่ชัดเจนด้านบน

## เพิ่ม Codex ควบคู่กับโมเดลอื่นๆ

อย่าตั้งค่า `agentRuntime.id: "codex"` แบบทั่วทั้งระบบ หาก agent เดียวกันควรสลับได้อย่างอิสระ
ระหว่าง Codex กับโมเดล provider ที่ไม่ใช่ Codex runtime ที่ถูกบังคับใช้จะมีผลกับทุก
embedded turn สำหรับ agent หรือ session นั้น หากคุณเลือกโมเดล Anthropic ในขณะที่
runtime นั้นถูกบังคับใช้ OpenClaw จะยังคงลองใช้ Codex harness และ fail closed
แทนที่จะ route turn นั้นผ่าน PI อย่างเงียบ ๆ

ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้แทน:

- วาง Codex ไว้บน agent เฉพาะที่มี `agentRuntime.id: "codex"`
- คง agent เริ่มต้นไว้บน `agentRuntime.id: "auto"` และใช้ PI fallback สำหรับการใช้งาน provider แบบผสมตามปกติ
- ใช้ refs แบบเดิม `codex/*` เพื่อความเข้ากันได้เท่านั้น config ใหม่ควรเลือกใช้
  `openai/*` พร้อมนโยบาย Codex runtime ที่ชัดเจน

ตัวอย่างนี้คง agent เริ่มต้นไว้บนการเลือกอัตโนมัติตามปกติ และ
เพิ่ม agent Codex แยกต่างหาก:

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

- agent เริ่มต้น `main` ใช้เส้นทาง provider ตามปกติและ PI compatibility fallback
- agent `codex` ใช้ Codex app-server harness
- หาก Codex หายไปหรือไม่รองรับสำหรับ agent `codex` turn จะล้มเหลว
  แทนที่จะใช้ PI อย่างเงียบ ๆ

## การ route คำสั่งของ agent

Agents ควร route คำขอของผู้ใช้ตามเจตนา ไม่ใช่แค่จากคำว่า "Codex" เพียงอย่างเดียว:

| ผู้ใช้ขอให้...                                         | Agent ควรใช้...                              |
| -------------------------------------------------------- | ------------------------------------------------ |
| "ผูกแชทนี้กับ Codex"                                | `/codex bind`                                    |
| "ดำเนินการต่อจาก Codex thread `<id>` ที่นี่"                        | `/codex resume <id>`                             |
| "แสดง Codex threads"                                     | `/codex threads`                                 |
| "ยื่นรายงานขอความช่วยเหลือสำหรับการรัน Codex ที่มีปัญหา"              | `/diagnostics [note]`                            |
| "ส่ง feedback ของ Codex สำหรับ thread ที่แนบมานี้เท่านั้น"      | `/codex diagnostics [note]`                      |
| "ใช้ Codex เป็น runtime สำหรับ agent นี้"                | เปลี่ยน config เป็น `agentRuntime.id`               |
| "ใช้ subscription ChatGPT/Codex ของฉันกับ OpenClaw ตามปกติ" | refs โมเดล `openai-codex/*`                      |
| "รัน Codex ผ่าน ACP/acpx"                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "เริ่ม Claude Code/Gemini/OpenCode/Cursor ใน thread"   | ACP/acpx ไม่ใช่ `/codex` และไม่ใช่ native sub-agents |

OpenClaw จะโฆษณาคำแนะนำการ spawn ของ ACP ให้ agents เฉพาะเมื่อเปิดใช้ ACP แล้ว
สามารถ dispatch ได้ และมี runtime backend ที่โหลดอยู่รองรับ หาก ACP ไม่พร้อมใช้งาน
system prompt และ plugin skills ไม่ควรสอน agent เกี่ยวกับการ
route ผ่าน ACP

## การ deploy แบบ Codex-only

บังคับใช้ Codex harness เมื่อคุณต้องการพิสูจน์ว่าทุก embedded agent turn
ใช้ Codex runtime ของ plugin ที่ระบุอย่างชัดเจนจะไม่มี PI fallback เป็นค่าเริ่มต้น ดังนั้น
`fallback: "none"` จึงเป็นทางเลือก แต่ก็มักมีประโยชน์ในฐานะเอกสารประกอบ:

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

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Codex plugin ถูกปิดใช้งาน
app-server เก่าเกินไป หรือ app-server เริ่มทำงานไม่ได้ ตั้งค่า
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` เฉพาะเมื่อคุณตั้งใจให้ PI จัดการ
การเลือก harness ที่หายไป

## Codex ต่อ agent

คุณสามารถทำให้ agent หนึ่งเป็น Codex-only ขณะที่ agent เริ่มต้นยังคงใช้
auto-selection ตามปกติ:

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

ใช้คำสั่ง session ตามปกติเพื่อสลับ agents และโมเดล `/new` จะสร้าง
OpenClaw session ใหม่ และ Codex harness จะสร้างหรือดำเนินการต่อ sidecar app-server
thread ของตนตามต้องการ `/reset` จะล้าง OpenClaw session binding สำหรับ thread นั้น
และให้ turn ถัดไป resolve harness จาก config ปัจจุบันอีกครั้ง

## การค้นพบโมเดล

ตามค่าเริ่มต้น Codex plugin จะถาม app-server ถึงโมเดลที่พร้อมใช้งาน หาก
การค้นพบล้มเหลวหรือหมดเวลา จะใช้ fallback catalog ที่ bundled ไว้สำหรับ:

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

ปิดการค้นพบเมื่อคุณต้องการให้ startup หลีกเลี่ยงการ probe Codex และใช้เฉพาะ
fallback catalog:

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

ตามค่าเริ่มต้น plugin จะเริ่ม binary Codex ที่ OpenClaw จัดการในเครื่องด้วย:

```bash
codex app-server --listen stdio://
```

binary ที่จัดการนี้ถูกประกาศเป็น bundled plugin runtime dependency และถูก staged
พร้อมกับ dependencies อื่น ๆ ของ plugin `codex` วิธีนี้ทำให้เวอร์ชัน app-server
ผูกกับ bundled plugin แทนที่จะขึ้นกับ Codex CLI แยกต่างหากตัวใดก็ตาม
ที่ติดตั้งอยู่ในเครื่อง ตั้งค่า `appServer.command` เฉพาะเมื่อคุณ
ตั้งใจจะรัน executable อื่น

ตามค่าเริ่มต้น OpenClaw จะเริ่ม session ของ Codex harness ในเครื่องในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือท่าทีของ operator ในเครื่องที่เชื่อถือได้ซึ่งใช้
สำหรับ Heartbeat อัตโนมัติ: Codex สามารถใช้ shell และเครื่องมือ network ได้โดยไม่
หยุดรอ native approval prompts ที่ไม่มีใครอยู่ตอบ

หากต้องการเลือกใช้การอนุมัติที่ Codex guardian-review ให้ตั้งค่า `appServer.mode:
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

Guardian mode ใช้เส้นทางการอนุมัติแบบ auto-review ดั้งเดิมของ Codex เมื่อ Codex ขอออกจาก
sandbox เขียนนอก workspace หรือเพิ่ม permissions เช่น network
access Codex จะ route คำขออนุมัตินั้นไปยัง native reviewer แทน
human prompt reviewer จะใช้ risk framework ของ Codex และอนุมัติหรือปฏิเสธ
คำขอเฉพาะนั้น ใช้ Guardian เมื่อคุณต้องการ guardrails มากกว่าโหมด YOLO
แต่ยังต้องการให้ unattended agents เดินหน้าต่อได้

preset `guardian` จะขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"`
ฟิลด์นโยบายแต่ละรายการยังคง override `mode` ได้ ดังนั้น deployment ขั้นสูงจึงสามารถผสม
preset กับตัวเลือกที่ระบุชัดเจนได้ ค่า reviewer รุ่นเก่า `guardian_subagent`
ยังคงยอมรับเป็น compatibility alias แต่ config ใหม่ควรใช้
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

การ launch stdio app-server จะสืบทอด process environment ของ OpenClaw ตามค่าเริ่มต้น
แต่ OpenClaw เป็นเจ้าของ account bridge ของ Codex app-server และตั้งค่าทั้ง
`CODEX_HOME` และ `HOME` ให้เป็นไดเรกทอรีต่อ agent ภายใต้ state ของ OpenClaw
ของ agent นั้น skill loader ของ Codex เองอ่าน `$CODEX_HOME/skills` และ
`$HOME/.agents/skills` ดังนั้นทั้งสองค่าจึงถูกแยกไว้สำหรับการ launch app-server
ในเครื่อง วิธีนี้ทำให้ Codex-native skills, plugins, config, accounts และ thread
state ถูกจำกัดขอบเขตไว้กับ OpenClaw agent แทนที่จะรั่วเข้ามาจาก Codex CLI home
ส่วนตัวของ operator

OpenClaw plugins และ OpenClaw skill snapshots ยังคงไหลผ่าน plugin registry และ skill loader
ของ OpenClaw เอง asset ส่วนตัวของ Codex CLI จะไม่ไหลผ่าน หากคุณมี
Codex CLI skills หรือ plugins ที่มีประโยชน์และควรกลายเป็นส่วนหนึ่งของ OpenClaw agent
ให้ทำ inventory อย่างชัดเจน:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider จะคัดลอก skills เข้าไปใน workspace ของ OpenClaw agent
ปัจจุบัน ส่วน Codex native plugins, hooks และ config files จะถูกรายงานหรือ archive
เพื่อให้ตรวจสอบด้วยตนเองแทนที่จะเปิดใช้งานโดยอัตโนมัติ เพราะสิ่งเหล่านี้สามารถ
execute commands, expose MCP servers หรือมี credentials ได้

Auth ถูกเลือกตามลำดับนี้:

1. โปรไฟล์ OpenClaw Codex auth ที่ระบุชัดเจนสำหรับ agent
2. account ที่มีอยู่ของ app-server ใน Codex home ของ agent นั้น
3. เฉพาะการ launch app-server แบบ local stdio เท่านั้น ใช้ `CODEX_API_KEY` จากนั้น
   `OPENAI_API_KEY` เมื่อไม่มี account ของ app-server และยังต้องใช้ OpenAI auth

เมื่อ OpenClaw เห็นโปรไฟล์ Codex auth แบบ ChatGPT subscription จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจาก process ลูกของ Codex ที่ spawn ขึ้น
วิธีนี้ทำให้ API keys ระดับ Gateway ยังคงพร้อมใช้งานสำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้ native Codex app-server turns ถูกคิดค่าใช้จ่ายผ่าน API โดยไม่ตั้งใจ
โปรไฟล์ Codex API-key ที่ระบุชัดเจนและ env-key fallback แบบ local stdio ใช้ app-server
login แทน child-process env ที่สืบทอดมา การเชื่อมต่อ WebSocket app-server
จะไม่ได้รับ Gateway env API-key fallback; ให้ใช้โปรไฟล์ auth ที่ระบุชัดเจนหรือ account
ของ remote app-server เอง

หาก deployment ต้องการการแยก environment เพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นลงใน
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

`appServer.clearEnv` มีผลเฉพาะกับ process ลูกของ Codex app-server ที่ spawn ขึ้นเท่านั้น

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์               | ค่าเริ่มต้น                                  | ความหมาย                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` จะเริ่ม Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                             |
| `command`           | ไบนารี Codex ที่จัดการให้                     | ไฟล์ปฏิบัติการสำหรับการขนส่งแบบ stdio ปล่อยว่างไว้เพื่อใช้ไบนารีที่จัดการให้; ตั้งค่าเฉพาะเมื่อต้องการแทนที่อย่างชัดเจนเท่านั้น                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | อาร์กิวเมนต์สำหรับการขนส่งแบบ stdio                                                                                                                                                                                                       |
| `url`               | ไม่ได้ตั้งค่า                                    | URL ของ app-server แบบ WebSocket                                                                                                                                                                                                            |
| `authToken`         | ไม่ได้ตั้งค่า                                    | โทเค็น Bearer สำหรับการขนส่งแบบ WebSocket                                                                                                                                                                                                |
| `headers`           | `{}`                                     | ส่วนหัว WebSocket เพิ่มเติม                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากกระบวนการ app-server แบบ stdio ที่เริ่มขึ้น หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว `CODEX_HOME` และ `HOME` สงวนไว้สำหรับการแยก Codex รายเอเจนต์ของ OpenClaw ในการเปิดใช้งานแบบโลคัล |
| `requestTimeoutMs`  | `60000`                                  | หมดเวลาสำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | พรีเซ็ตสำหรับการดำเนินการแบบ YOLO หรือแบบมี guardian ตรวจทาน                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | นโยบายการอนุมัติเนทีฟของ Codex ที่ส่งไปยังการเริ่มเธรด/กลับมาทำต่อ/เทิร์น                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | โหมด sandbox เนทีฟของ Codex ที่ส่งไปยังการเริ่มเธรด/กลับมาทำต่อ                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทานพรอมต์การอนุมัติเนทีฟ `guardian_subagent` ยังคงเป็นนามแฝงเดิม                                                                                                                         |
| `serviceTier`       | ไม่ได้ตั้งค่า                                    | ระดับบริการ app-server ของ Codex แบบไม่บังคับ: `"fast"`, `"flex"` หรือ `null` ค่าเดิมที่ไม่ถูกต้องจะถูกละเว้น                                                                                                                            |

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกต่างหากจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` แต่ละรายการต้องได้รับ
การตอบกลับจาก OpenClaw ภายใน 30 วินาที เมื่อหมดเวลา OpenClaw จะยกเลิกสัญญาณ
เครื่องมือในที่ที่รองรับ และส่งการตอบกลับเครื่องมือแบบไดนามิกที่ล้มเหลวไปยัง Codex เพื่อให้
เทิร์นดำเนินต่อได้ แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`

หลังจาก OpenClaw ตอบกลับคำขอ app-server ของ Codex ที่มีขอบเขตตามเทิร์นแล้ว harness
ยังคาดว่า Codex จะจบเทิร์นเนทีฟด้วย `turn/completed` หาก
app-server เงียบไป 60 วินาทีหลังจากการตอบกลับนั้น OpenClaw จะพยายามอย่างดีที่สุด
เพื่อขัดจังหวะเทิร์น Codex บันทึกการหมดเวลาเพื่อการวินิจฉัย และปล่อย lane ของเซสชัน
OpenClaw เพื่อไม่ให้ข้อความแชทถัดไปถูกเข้าคิวไว้หลังเทิร์นเนทีฟที่ค้างอยู่

การแทนที่สภาพแวดล้อมยังคงพร้อมใช้งานสำหรับการทดสอบแบบโลคัล:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้ามไบนารีที่จัดการให้เมื่อ
`appServer.command` ไม่ได้ตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกนำออกแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบแบบโลคัลครั้งเดียว ควรใช้ config
สำหรับการปรับใช้ที่ทำซ้ำได้ เพราะทำให้พฤติกรรมของ plugin อยู่ในไฟล์ที่ตรวจทานแล้วไฟล์เดียวกัน
กับการตั้งค่า Codex harness ส่วนที่เหลือ

## การใช้คอมพิวเตอร์

การใช้คอมพิวเตอร์ครอบคลุมอยู่ในคู่มือการตั้งค่าของตัวเอง:
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use).

สรุปสั้น ๆ: OpenClaw ไม่ได้รวมแอปควบคุมเดสก์ท็อปไว้ในตัวหรือดำเนินการ
บนเดสก์ท็อปเอง โดยจะเตรียม Codex app-server ตรวจสอบว่าเซิร์ฟเวอร์ MCP
`computer-use` พร้อมใช้งาน แล้วปล่อยให้ Codex จัดการการเรียกเครื่องมือ MCP
เนทีฟระหว่างเทิร์นโหมด Codex

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

การใช้คอมพิวเตอร์เฉพาะกับ macOS และอาจต้องใช้สิทธิ์ของ OS แบบโลคัลก่อนที่
เซิร์ฟเวอร์ MCP ของ Codex จะควบคุมแอปได้ หาก `computerUse.enabled` เป็น true และเซิร์ฟเวอร์ MCP
ไม่พร้อมใช้งาน เทิร์นโหมด Codex จะล้มเหลวก่อนเริ่มเธรด แทนที่จะทำงานแบบเงียบ ๆ
โดยไม่มีเครื่องมือการใช้คอมพิวเตอร์เนทีฟ ดู
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use) สำหรับตัวเลือก marketplace,
ข้อจำกัดของแค็ตตาล็อกระยะไกล, เหตุผลสถานะ และการแก้ปัญหา

เมื่อ `computerUse.autoInstall` เป็น true OpenClaw สามารถลงทะเบียน
marketplace Codex Desktop มาตรฐานที่รวมไว้จาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` หาก Codex
ยังไม่พบ marketplace แบบโลคัล ใช้ `/new` หรือ `/reset` หลังจากเปลี่ยน
config ของ runtime หรือการใช้คอมพิวเตอร์ เพื่อไม่ให้เซสชันที่มีอยู่ยังคงใช้การผูก
PI หรือเธรด Codex เก่า

## สูตรที่ใช้บ่อย

Codex แบบโลคัลพร้อมการขนส่ง stdio ค่าเริ่มต้น:

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

การตรวจสอบ Codex-only harness:

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

การอนุมัติ Codex ที่มี guardian ตรวจทาน:

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

การสลับโมเดลยังคงถูกควบคุมโดย OpenClaw เมื่อเซสชัน OpenClaw เชื่อมกับ
เธรด Codex ที่มีอยู่แล้ว เทิร์นถัดไปจะส่งโมเดล OpenAI, provider, นโยบายการอนุมัติ,
sandbox และระดับบริการที่เลือกอยู่ในปัจจุบันไปยัง app-server อีกครั้ง
การสลับจาก `openai/gpt-5.5` เป็น `openai/gpt-5.2` จะคงการผูกเธรดไว้
แต่ขอให้ Codex ดำเนินการต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

plugin ที่รวมไว้จะลงทะเบียน `/codex` เป็นคำสั่ง slash ที่ได้รับอนุญาต คำสั่งนี้
เป็นแบบทั่วไปและทำงานได้ในทุก channel ที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` แสดงการเชื่อมต่อ app-server แบบสด, โมเดล, บัญชี, ขีดจำกัดอัตรา, เซิร์ฟเวอร์ MCP และ skills
- `/codex models` แสดงรายการโมเดล app-server ของ Codex แบบสด
- `/codex threads [filter]` แสดงรายการเธรด Codex ล่าสุด
- `/codex resume <thread-id>` เชื่อมเซสชัน OpenClaw ปัจจุบันกับเธรด Codex ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server กระชับเธรดที่เชื่อมอยู่
- `/codex review` เริ่มการตรวจทานเนทีฟของ Codex สำหรับเธรดที่เชื่อมอยู่
- `/codex diagnostics [note]` ขออนุมัติก่อนส่งฟีดแบ็กการวินิจฉัยของ Codex สำหรับเธรดที่เชื่อมอยู่
- `/codex computer-use status` ตรวจสอบ plugin การใช้คอมพิวเตอร์ที่กำหนดค่าไว้และเซิร์ฟเวอร์ MCP
- `/codex computer-use install` ติดตั้ง plugin การใช้คอมพิวเตอร์ที่กำหนดค่าไว้และโหลดเซิร์ฟเวอร์ MCP ใหม่
- `/codex account` แสดงสถานะบัญชีและขีดจำกัดอัตรา
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของ Codex app-server
- `/codex skills` แสดงรายการ skills ของ Codex app-server

### เวิร์กโฟลว์การดีบักที่ใช้บ่อย

เมื่อเอเจนต์ที่ใช้ Codex อยู่เบื้องหลังทำสิ่งที่ไม่คาดคิดใน Telegram, Discord, Slack
หรือ channel อื่น ให้เริ่มจากบทสนทนาที่เกิดปัญหา:

1. เรียกใช้ `/diagnostics bad tool choice after image upload` หรือบันทึกสั้น ๆ อื่น
   ที่อธิบายสิ่งที่คุณเห็น
2. อนุมัติคำขอการวินิจฉัยหนึ่งครั้ง การอนุมัติจะสร้างไฟล์ zip การวินิจฉัยของ Gateway
   แบบโลคัล และเนื่องจากเซสชันใช้ Codex harness จึงส่งชุดฟีดแบ็ก Codex
   ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
3. คัดลอกการตอบกลับการวินิจฉัยที่เสร็จสมบูรณ์ลงในรายงานบั๊กหรือเธรดสนับสนุน
   การตอบกลับนี้มีพาธชุดข้อมูลโลคัล, สรุปความเป็นส่วนตัว, id เซสชัน OpenClaw,
   id เธรด Codex และบรรทัด `Inspect locally` สำหรับแต่ละเธรด Codex
4. หากคุณต้องการดีบักการรันด้วยตัวเอง ให้รันคำสั่ง `Inspect locally`
   ที่พิมพ์ออกมาในเทอร์มินัล คำสั่งจะมีหน้าตาเหมือน `codex resume <thread-id>` และเปิด
   เธรด Codex เนทีฟเพื่อให้คุณตรวจสอบบทสนทนา ดำเนินการต่อแบบโลคัล
   หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือแผนบางอย่าง

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลดข้อเสนอแนะของ Codex สำหรับเธรดที่แนบอยู่ในขณะนั้นโดยไม่รวมชุดข้อมูลวินิจฉัย Gateway ทั้งหมดของ OpenClaw เท่านั้น สำหรับรายงานสนับสนุนส่วนใหญ่ `/diagnostics [note]` เป็นจุดเริ่มต้นที่ดีกว่า เพราะผูกสถานะ Gateway ภายในเครื่องและรหัสเธรด Codex ไว้ด้วยกันในคำตอบเดียว ดู [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics) สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรมในแชตกลุ่มทั้งหมด

แกนหลักของ OpenClaw ยังเปิดเผย `/diagnostics [note]` สำหรับเจ้าของเท่านั้นในฐานะคำสั่งข้อมูลวินิจฉัย Gateway ทั่วไป พรอมป์อนุมัติของคำสั่งนี้จะแสดงคำนำเกี่ยวกับข้อมูลอ่อนไหว ลิงก์ไปยัง [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics) และขอเรียกใช้ `openclaw gateway diagnostics export --json` ผ่านการอนุมัติ exec อย่างชัดเจนทุกครั้ง อย่าอนุมัติข้อมูลวินิจฉัยด้วยกฎอนุญาตทั้งหมด หลังจากอนุมัติแล้ว OpenClaw จะส่งรายงานที่นำไปวางต่อได้พร้อมพาธชุดข้อมูลภายในเครื่องและสรุป manifest เมื่อเซสชัน OpenClaw ที่ใช้งานอยู่ใช้ฮาร์เนส Codex การอนุมัติเดียวกันนั้นจะอนุญาตให้ส่งชุดข้อเสนอแนะ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย พรอมป์อนุมัติจะแจ้งว่าจะส่งข้อเสนอแนะ Codex แต่จะไม่แสดงรหัสเซสชันหรือรหัสเธรด Codex ก่อนการอนุมัติ

หากเจ้าของเรียกใช้ `/diagnostics` ในแชตกลุ่ม OpenClaw จะรักษาช่องทางที่ใช้ร่วมกันให้สะอาด: กลุ่มจะได้รับเพียงประกาศสั้น ๆ ส่วนคำนำข้อมูลวินิจฉัย พรอมป์อนุมัติ และรหัสเซสชัน/เธรด Codex จะถูกส่งถึงเจ้าของผ่านเส้นทางอนุมัติส่วนตัว หากไม่มีเส้นทางเจ้าของส่วนตัว OpenClaw จะปฏิเสธคำขอจากกลุ่มและขอให้เจ้าของเรียกใช้จาก DM

การอัปโหลด Codex ที่ได้รับอนุมัติจะเรียก Codex app-server `feedback/upload` และขอให้ app-server รวมบันทึกสำหรับแต่ละเธรดที่ระบุและเธรดย่อย Codex ที่สร้างขึ้นเมื่อมี การอัปโหลดจะผ่านเส้นทางข้อเสนอแนะปกติของ Codex ไปยังเซิร์ฟเวอร์ OpenAI; หากข้อเสนอแนะ Codex ถูกปิดใช้งานใน app-server นั้น คำสั่งจะส่งคืนข้อผิดพลาดของ app-server คำตอบข้อมูลวินิจฉัยที่เสร็จสมบูรณ์จะแสดงรายการช่องทาง รหัสเซสชัน OpenClaw รหัสเธรด Codex และคำสั่ง `codex resume <thread-id>` ภายในเครื่องสำหรับเธรดที่ส่งไป หากคุณปฏิเสธหรือเพิกเฉยต่อการอนุมัติ OpenClaw จะไม่พิมพ์รหัส Codex เหล่านั้น การอัปโหลดนี้ไม่ได้แทนที่การส่งออกข้อมูลวินิจฉัย Gateway ภายในเครื่อง

`/codex resume` เขียนไฟล์ผูก sidecar เดียวกับที่ฮาร์เนสใช้สำหรับรอบปกติ ในข้อความถัดไป OpenClaw จะดำเนินเธรด Codex นั้นต่อ ส่งโมเดล OpenClaw ที่เลือกอยู่ในขณะนั้นเข้า app-server และเปิดใช้ประวัติแบบขยายต่อไป

### ตรวจสอบเธรด Codex จาก CLI

วิธีที่เร็วที่สุดในการทำความเข้าใจการรัน Codex ที่ผิดพลาดมักเป็นการเปิดเธรด Codex ดั้งเดิมโดยตรง:

```sh
codex resume <thread-id>
```

ใช้วิธีนี้เมื่อคุณพบข้อบกพร่องในการสนทนาผ่านช่องทางและต้องการตรวจสอบเซสชัน Codex ที่มีปัญหา ดำเนินต่อภายในเครื่อง หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือเหตุผลบางอย่าง เส้นทางที่ง่ายที่สุดมักเป็นการรัน `/diagnostics [note]` ก่อน: หลังจากคุณอนุมัติแล้ว รายงานที่เสร็จสมบูรณ์จะแสดงรายการเธรด Codex แต่ละรายการและพิมพ์คำสั่ง `Inspect locally` เช่น `codex resume <thread-id>` คุณสามารถคัดลอกคำสั่งนั้นไปยังเทอร์มินัลได้โดยตรง

คุณยังสามารถรับรหัสเธรดจาก `/codex binding` สำหรับแชตปัจจุบัน หรือ `/codex threads [filter]` สำหรับเธรด Codex app-server ล่าสุด จากนั้นรันคำสั่ง `codex resume` เดียวกันในเชลล์ของคุณ

พื้นผิวคำสั่งต้องใช้ Codex app-server `0.125.0` หรือใหม่กว่า เมธอดควบคุมแต่ละรายการจะถูกรายงานเป็น `unsupported by this Codex app-server` หาก app-server ในอนาคตหรือแบบกำหนดเองไม่เปิดเผยเมธอด JSON-RPC นั้น

## ขอบเขตฮุก

ฮาร์เนส Codex มีเลเยอร์ฮุกสามชั้น:

| เลเยอร์                                 | เจ้าของ                    | วัตถุประสงค์                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| ฮุก Plugin ของ OpenClaw                 | OpenClaw                 | ความเข้ากันได้ของผลิตภัณฑ์/Plugin ระหว่างฮาร์เนส PI และ Codex         |
| มิดเดิลแวร์ส่วนขยาย Codex app-server | Plugin ที่มาพร้อม OpenClaw | พฤติกรรมอะแดปเตอร์ต่อรอบรอบเครื่องมือแบบไดนามิกของ OpenClaw            |
| ฮุกดั้งเดิมของ Codex                    | Codex                    | วงจรชีวิต Codex ระดับต่ำและนโยบายเครื่องมือดั้งเดิมจากการกำหนดค่า Codex |

OpenClaw ไม่ใช้ไฟล์ Codex `hooks.json` ระดับโปรเจ็กต์หรือระดับโกลบอลเพื่อกำหนดเส้นทางพฤติกรรม Plugin ของ OpenClaw สำหรับสะพานเครื่องมือดั้งเดิมและสิทธิ์ที่รองรับ OpenClaw จะแทรกการกำหนดค่า Codex ต่อเธรดสำหรับ `PreToolUse`, `PostToolUse`, `PermissionRequest` และ `Stop` ฮุก Codex อื่น ๆ เช่น `SessionStart` และ `UserPromptSubmit` ยังคงเป็นการควบคุมระดับ Codex; สิ่งเหล่านี้ไม่ได้ถูกเปิดเผยเป็นฮุก Plugin ของ OpenClaw ในสัญญา v1

สำหรับเครื่องมือแบบไดนามิกของ OpenClaw นั้น OpenClaw จะเรียกใช้เครื่องมือหลังจาก Codex ขอให้เรียก ดังนั้น OpenClaw จึงทริกเกอร์พฤติกรรม Plugin และมิดเดิลแวร์ที่ตนเป็นเจ้าของในอะแดปเตอร์ฮาร์เนส สำหรับเครื่องมือดั้งเดิมของ Codex นั้น Codex เป็นเจ้าของเรกคอร์ดเครื่องมือที่เป็นแหล่งอ้างอิง OpenClaw สามารถสะท้อนเหตุการณ์ที่เลือกได้ แต่ไม่สามารถเขียนเธรด Codex ดั้งเดิมใหม่ได้ เว้นแต่ Codex จะเปิดเผยการดำเนินการนั้นผ่าน app-server หรือคอลแบ็กฮุกดั้งเดิม

การฉายภาพ Compaction และวงจรชีวิต LLM มาจากการแจ้งเตือน Codex app-server และสถานะอะแดปเตอร์ OpenClaw ไม่ใช่คำสั่งฮุก Codex ดั้งเดิม เหตุการณ์ `before_compaction`, `after_compaction`, `llm_input` และ `llm_output` ของ OpenClaw เป็นการสังเกตระดับอะแดปเตอร์ ไม่ใช่การจับ payload คำขอหรือ Compaction ภายในของ Codex แบบตรงทุกไบต์

การแจ้งเตือน app-server `hook/started` และ `hook/completed` ดั้งเดิมของ Codex จะถูกฉายเป็นเหตุการณ์เอเจนต์ `codex_app_server.hook` สำหรับเส้นทางการทำงานและการดีบัก สิ่งเหล่านี้จะไม่เรียกฮุก Plugin ของ OpenClaw

## สัญญารองรับ V1

โหมด Codex ไม่ใช่ PI ที่มีการเรียกโมเดลต่างออกไปอยู่ด้านล่าง Codex เป็นเจ้าของลูปโมเดลดั้งเดิมมากกว่า และ OpenClaw ปรับพื้นผิว Plugin และเซสชันของตนรอบขอบเขตนั้น

รองรับในรันไทม์ Codex v1:

| พื้นผิว                                       | การรองรับ                                 | เหตุผล                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ลูปโมเดล OpenAI ผ่าน Codex               | รองรับ                               | Codex app-server เป็นเจ้าของรอบ OpenAI การดำเนินเธรดดั้งเดิมต่อ และการดำเนินเครื่องมือดั้งเดิมต่อ                                                                                                            |
| การกำหนดเส้นทางและการส่งมอบช่องทาง OpenClaw         | รองรับ                               | Telegram, Discord, Slack, WhatsApp, iMessage และช่องทางอื่น ๆ อยู่ภายนอกรันไทม์โมเดล                                                                                                      |
| เครื่องมือแบบไดนามิกของ OpenClaw                        | รองรับ                               | Codex ขอให้ OpenClaw เรียกใช้เครื่องมือเหล่านี้ ดังนั้น OpenClaw จึงยังอยู่ในเส้นทางการเรียกใช้                                                                                                                  |
| Plugin พรอมป์และบริบท                    | รองรับ                               | OpenClaw สร้างโอเวอร์เลย์พรอมป์และฉายบริบทเข้าไปในรอบ Codex ก่อนเริ่มหรือดำเนินเธรดต่อ                                                                                      |
| วงจรชีวิตเอนจินบริบท                      | รองรับ                               | การประกอบ การนำเข้าหรือการบำรุงรักษาหลังรอบ และการประสานงาน Compaction ของเอนจินบริบททำงานสำหรับรอบ Codex                                                                                           |
| ฮุกเครื่องมือแบบไดนามิก                            | รองรับ                               | `before_tool_call`, `after_tool_call` และมิดเดิลแวร์ผลลัพธ์เครื่องมือทำงานรอบเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของ                                                                                            |
| ฮุกวงจรชีวิต                               | รองรับเป็นการสังเกตของอะแดปเตอร์       | `llm_input`, `llm_output`, `agent_end`, `before_compaction` และ `after_compaction` ทริกเกอร์พร้อม payload โหมด Codex ที่ตรงไปตรงมา                                                                             |
| เกตแก้ไขคำตอบสุดท้าย                    | รองรับผ่านรีเลย์ฮุกดั้งเดิม | Codex `Stop` ถูกรีเลย์ไปยัง `before_agent_finalize`; `revise` ขอให้ Codex ทำรอบโมเดลอีกหนึ่งครั้งก่อนสรุปผล                                                                                  |
| บล็อกหรือสังเกตเชลล์ แพตช์ และ MCP ดั้งเดิม | รองรับผ่านรีเลย์ฮุกดั้งเดิม | Codex `PreToolUse` และ `PostToolUse` ถูกรีเลย์สำหรับพื้นผิวเครื่องมือดั้งเดิมที่คอมมิตแล้ว รวมถึง payload MCP บน Codex app-server `0.125.0` หรือใหม่กว่า รองรับการบล็อก แต่ไม่รองรับการเขียนอาร์กิวเมนต์ใหม่ |
| นโยบายสิทธิ์ดั้งเดิม                      | รองรับผ่านรีเลย์ฮุกดั้งเดิม | Codex `PermissionRequest` สามารถถูกกำหนดเส้นทางผ่านนโยบาย OpenClaw ได้เมื่อรันไทม์เปิดเผย หาก OpenClaw ไม่ส่งคืนการตัดสินใจ Codex จะดำเนินต่อผ่าน guardian ปกติหรือเส้นทางอนุมัติของผู้ใช้     |
| การจับเส้นทางการทำงานของ app-server                 | รองรับ                               | OpenClaw บันทึกคำขอที่ส่งไปยัง app-server และการแจ้งเตือน app-server ที่ได้รับ                                                                                                      |

ไม่รองรับในรันไทม์ Codex v1:

| พื้นผิว                                             | ขอบเขต V1                                                                                                                                     | เส้นทางในอนาคต                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| การเปลี่ยนแปลงอาร์กิวเมนต์ของเครื่องมือเนทีฟ                       | hook ก่อนใช้เครื่องมือของ Codex native สามารถบล็อกได้ แต่ OpenClaw จะไม่เขียนอาร์กิวเมนต์เครื่องมือ Codex-native ใหม่                                               | ต้องมีการรองรับ hook/สคีมาของ Codex สำหรับแทนที่อินพุตเครื่องมือ                            |
| ประวัติทรานสคริปต์ Codex-native ที่แก้ไขได้            | Codex เป็นเจ้าของประวัติ thread เนทีฟตามหลัก OpenClaw เป็นเจ้าของสำเนาสะท้อนและสามารถฉายบริบทในอนาคตได้ แต่ไม่ควรแก้ไข internals ที่ไม่รองรับ | เพิ่ม API ของ Codex app-server แบบชัดเจน หากจำเป็นต้องผ่าตัด thread เนทีฟ                    |
| `tool_result_persist` สำหรับเรคคอร์ดเครื่องมือ Codex-native | hook นั้นแปลงการเขียนทรานสคริปต์ที่ OpenClaw เป็นเจ้าของ ไม่ใช่เรคคอร์ดเครื่องมือ Codex-native                                                           | อาจสะท้อนเรคคอร์ดที่แปลงแล้วได้ แต่การเขียนใหม่ตามหลักต้องมีการรองรับจาก Codex              |
| เมทาดาทา Compaction เนทีฟแบบละเอียด                     | OpenClaw สังเกตการเริ่มและการเสร็จสิ้นของ Compaction แต่ไม่ได้รับรายการที่คงไว้/ทิ้งไปที่เสถียร, token delta หรือ payload สรุป            | ต้องมี event Compaction ของ Codex ที่ละเอียดขึ้น                                                     |
| การแทรกแซง Compaction                             | hook Compaction ปัจจุบันของ OpenClaw อยู่ในระดับการแจ้งเตือนในโหมด Codex                                                                         | เพิ่ม hook ก่อน/หลัง Compaction ของ Codex หาก Plugin ต้อง veto หรือเขียน Compaction เนทีฟใหม่ |
| การจับคำขอ model API แบบ byte-for-byte             | OpenClaw สามารถจับคำขอและการแจ้งเตือนของ app-server ได้ แต่ Codex core สร้างคำขอ OpenAI API ขั้นสุดท้ายภายใน                      | ต้องมี event tracing คำขอโมเดลของ Codex หรือ debug API                                   |

## เครื่องมือ สื่อ และ Compaction

Codex harness เปลี่ยนเฉพาะ executor ของเอเจนต์ฝังตัวระดับล่างเท่านั้น

OpenClaw ยังคงสร้างรายการเครื่องมือและรับผลลัพธ์เครื่องมือแบบไดนามิกจาก
harness ข้อความ รูปภาพ วิดีโอ เพลง TTS การอนุมัติ และเอาต์พุตของเครื่องมือส่งข้อความ
ยังคงผ่านเส้นทางการส่งมอบปกติของ OpenClaw

native hook relay ตั้งใจให้อยู่ในรูปแบบทั่วไป แต่สัญญาการรองรับ v1
จำกัดเฉพาะเส้นทางเครื่องมือและสิทธิ์ Codex-native ที่ OpenClaw ทดสอบ ใน
runtime ของ Codex นั่นรวมถึง payload ของ shell, patch และ MCP `PreToolUse`,
`PostToolUse` และ `PermissionRequest` อย่าสันนิษฐานว่า event hook ของ Codex
ในอนาคตทุกตัวเป็นพื้นผิว Plugin ของ OpenClaw จนกว่า runtime contract จะระบุชื่อไว้

สำหรับ `PermissionRequest` OpenClaw จะคืนเฉพาะการตัดสินใจอนุญาตหรือปฏิเสธอย่างชัดเจน
เมื่อนโยบายตัดสิน ผลลัพธ์แบบไม่มีการตัดสินใจไม่ใช่การอนุญาต Codex ถือว่านั่นเป็นการไม่มี
การตัดสินใจจาก hook และปล่อยให้ตกไปยังเส้นทาง guardian หรือการอนุมัติจากผู้ใช้ของตัวเอง

การร้องขออนุมัติเครื่องมือ Codex MCP จะถูกส่งผ่าน flow การอนุมัติ Plugin
ของ OpenClaw เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"` prompt ของ Codex `request_user_input` จะถูกส่งกลับไปยัง
แชทต้นทาง และข้อความติดตามผลถัดไปในคิวจะตอบคำขอเซิร์ฟเวอร์เนทีฟนั้น
แทนที่จะถูกนำทางเป็นบริบทเพิ่มเติม คำขอ elicitation ของ MCP อื่นๆ
ยังคง fail closed

การ steering คิวของ active-run จับคู่กับ Codex app-server `turn/steer` ด้วย
ค่าเริ่มต้น `messages.queue.mode: "steer"` OpenClaw จะรวมข้อความแชทที่อยู่ในคิว
ตามช่วงเวลานิ่งที่กำหนดค่าไว้และส่งเป็นคำขอ `turn/steer` เดียว
ตามลำดับที่มาถึง โหมด `queue` แบบเดิมส่งคำขอ `turn/steer` แยกกัน การ turn ของ
Codex review และ Compaction แบบแมนนวลอาจปฏิเสธ same-turn steering ซึ่งในกรณีนั้น
OpenClaw จะใช้คิว followup เมื่อโหมดที่เลือกอนุญาต fallback ดู
[คิว steering](/th/concepts/queue-steering)

เมื่อโมเดลที่เลือกใช้ Codex harness, Compaction ของ thread เนทีฟจะ
มอบหมายให้ Codex app-server OpenClaw เก็บสำเนาสะท้อนของทรานสคริปต์สำหรับประวัติช่องทาง,
การค้นหา, `/new`, `/reset` และการสลับโมเดลหรือ harness ในอนาคต สำเนาสะท้อน
รวม prompt ของผู้ใช้ ข้อความสุดท้ายของ assistant และเรคคอร์ดการให้เหตุผลหรือแผนของ Codex
แบบเบาเมื่อ app-server ส่งออกมา ปัจจุบัน OpenClaw บันทึกเฉพาะสัญญาณ
เริ่มและเสร็จสิ้นของ Compaction เนทีฟเท่านั้น ยังไม่ได้เปิดเผยสรุป Compaction
ที่มนุษย์อ่านได้ หรือรายการที่ตรวจสอบย้อนหลังได้ว่า Codex คง entry ใดไว้
หลัง Compaction

เพราะ Codex เป็นเจ้าของ thread เนทีฟตามหลัก `tool_result_persist` จึงยังไม่
เขียนเรคคอร์ดผลลัพธ์เครื่องมือ Codex-native ใหม่ในปัจจุบัน ใช้เฉพาะเมื่อ
OpenClaw กำลังเขียนผลลัพธ์เครื่องมือของทรานสคริปต์เซสชันที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่ต้องใช้ PI รูปภาพ วิดีโอ เพลง PDF TTS และการทำความเข้าใจสื่อ
ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็นผู้ให้บริการ `/model` ปกติ:** นี่เป็นสิ่งที่คาดไว้สำหรับ
config ใหม่ เลือกโมเดล `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"` (หรือ ref `codex/*` แบบเดิม), เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ไม่ได้ตัด
`codex` ออก

**OpenClaw ใช้ PI แทน Codex:** `agentRuntime.id: "auto"` ยังสามารถใช้ PI เป็น
backend ความเข้ากันได้เมื่อไม่มี Codex harness ใดรับ run นั้น ตั้งค่า
`agentRuntime.id: "codex"` เพื่อบังคับการเลือก Codex ระหว่างทดสอบ runtime ของ
Codex ที่ถูกบังคับจะล้มเหลวแทนการ fallback ไปยัง PI เว้นแต่คุณจะตั้งค่า
`agentRuntime.fallback: "pi"` อย่างชัดเจน เมื่อเลือก Codex app-server แล้ว
ความล้มเหลวของมันจะแสดงโดยตรงโดยไม่ต้องมี config fallback เพิ่มเติม

**app-server ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้ handshake ของ app-server
รายงานเวอร์ชัน `0.125.0` หรือใหม่กว่า prerelease เวอร์ชันเดียวกันหรือเวอร์ชันที่มี suffix build
เช่น `0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ
protocol floor เสถียร `0.125.0` คือสิ่งที่ OpenClaw ทดสอบ

**การค้นพบโมเดลช้า:** ลด `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิดใช้ discovery

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`
และตรวจสอบว่า app-server ระยะไกลใช้ protocol version เดียวกันของ Codex app-server

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นสิ่งที่คาดไว้ เว้นแต่คุณบังคับ
`agentRuntime.id: "codex"` สำหรับเอเจนต์นั้น หรือเลือก ref `codex/*`
แบบเดิม ref `openai/gpt-*` ปกติและ ref ผู้ให้บริการอื่นๆ จะอยู่บนเส้นทาง
ผู้ให้บริการปกติในโหมด `auto` หากคุณบังคับ `agentRuntime.id: "codex"` ทุก turn
แบบฝังตัวสำหรับเอเจนต์นั้นต้องเป็นโมเดล OpenAI ที่ Codex รองรับ

**ติดตั้ง Computer Use แล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงาน
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงอยู่ ให้รีสตาร์ท
gateway เพื่อล้างการลงทะเบียน native hook ที่ค้างอยู่ หาก `computer-use.list_apps`
หมดเวลา ให้รีสตาร์ท Codex Computer Use หรือ Codex Desktop แล้วลองใหม่

## ที่เกี่ยวข้อง

- [Plugin agent harness](/th/plugins/sdk-agent-harness)
- [runtime ของเอเจนต์](/th/concepts/agent-runtimes)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [สถานะ](/th/cli/status)
- [hook ของ Plugin](/th/plugins/hooks)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
