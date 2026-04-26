---
read_when:
    - คุณต้องการใช้ Codex app-server harness ที่มาพร้อมในชุด
    - คุณต้องการตัวอย่างการตั้งค่า Codex harness
    - คุณต้องการให้การติดตั้งใช้งานแบบ Codex-only ล้มเหลวแทนที่จะ fallback ไปใช้ PI
summary: รันเทิร์นเอเจนต์แบบ embedded ของ OpenClaw ผ่าน Codex app-server harness ที่มาพร้อมในชุด
title: Codex harness
x-i18n:
    generated_at: "2026-04-26T11:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

Plugin `codex` ที่มาพร้อมในชุดช่วยให้ OpenClaw รันเทิร์นเอเจนต์แบบ embedded ผ่าน
Codex app-server แทน PI harness ที่มาพร้อมในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง: การค้นหา
โมเดล การกลับมาทำงานต่อของ thread แบบ native, Compaction แบบ native และการรันผ่าน app-server
ส่วน OpenClaw ยังคงเป็นเจ้าของ channel แชต ไฟล์เซสชัน การเลือกโมเดล เครื่องมือ
การอนุมัติ การส่งสื่อ และ transcript mirror ที่มองเห็นได้

หากคุณกำลังพยายามทำความเข้าใจภาพรวม ให้เริ่มจาก
[Agent runtimes](/th/concepts/agent-runtimes) เวอร์ชันสั้นคือ:
`openai/gpt-5.5` คือ model ref, `codex` คือ runtime และ Telegram,
Discord, Slack หรือ channel อื่นยังคงเป็นพื้นผิวการสื่อสาร

## Plugin นี้เปลี่ยนอะไรบ้าง

Plugin `codex` ที่มาพร้อมในชุดเพิ่มความสามารถแยกกันหลายอย่าง:

| ความสามารถ                        | วิธีใช้งาน                                          | สิ่งที่มันทำ                                                                 |
| --------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| Native embedded runtime           | `agentRuntime.id: "codex"`                          | รันเทิร์นเอเจนต์แบบ embedded ของ OpenClaw ผ่าน Codex app-server            |
| Native chat-control commands      | `/codex bind`, `/codex resume`, `/codex steer`, ... | bind และควบคุม thread ของ Codex app-server จากการสนทนาในช่องข้อความ         |
| Codex app-server provider/catalog | ส่วนภายในของ `codex`, ที่แสดงผ่าน harness          | ช่วยให้ runtime ค้นหาและตรวจสอบโมเดลของ app-server ได้                    |
| Codex media-understanding path    | เส้นทางความเข้ากันได้ของ image-model แบบ `codex/*` | รันเทิร์น Codex app-server แบบมีขอบเขตสำหรับโมเดลทำความเข้าใจภาพที่รองรับ |
| Native hook relay                 | Plugin hook รอบเหตุการณ์ native ของ Codex         | ช่วยให้ OpenClaw สังเกต/บล็อกเหตุการณ์ tool/finalization แบบ native ของ Codex ที่รองรับ |

การเปิดใช้ Plugin จะทำให้ความสามารถเหล่านี้พร้อมใช้งาน แต่ **จะไม่**:

- เริ่มใช้ Codex สำหรับทุกโมเดลของ OpenAI
- แปลง model ref แบบ `openai-codex/*` ให้กลายเป็น native runtime
- ทำให้ ACP/acpx กลายเป็นเส้นทาง Codex ค่าเริ่มต้น
- hot-switch เซสชันที่มีการบันทึก runtime แบบ PI ไว้แล้ว
- แทนที่การส่งผ่าน channel, ไฟล์เซสชัน, การเก็บ auth-profile หรือ
  การกำหนดเส้นทางข้อความของ OpenClaw

Plugin เดียวกันนี้ยังเป็นเจ้าของพื้นผิวคำสั่งควบคุมแชต `/codex` แบบ native ด้วย หาก
Plugin ถูกเปิดใช้และผู้ใช้ขอ bind, resume, steer, stop หรือตรวจสอบ
thread ของ Codex จากแชต เอเจนต์ควรเลือกใช้ `/codex ...` แทน ACP
ACP ยังคงเป็น fallback แบบชัดเจนเมื่อผู้ใช้ขอ ACP/acpx หรือกำลังทดสอบ
Codex adapter ของ ACP

เทิร์น Codex แบบ native ยังคงใช้ Plugin hook ของ OpenClaw เป็น compatibility layer สาธารณะ
Hook เหล่านี้เป็น hook ของ OpenClaw ภายในโพรเซส ไม่ใช่ command hook ของ Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` สำหรับเรคคอร์ด transcript mirror
- `before_agent_finalize` ผ่าน Codex `Stop` relay
- `agent_end`

Plugin ยังสามารถลงทะเบียน middleware ของผลลัพธ์เครื่องมือแบบไม่ขึ้นกับ runtime เพื่อเขียนผลลัพธ์ของ dynamic tool ของ OpenClaw ใหม่ หลังจาก OpenClaw รันเครื่องมือแล้วและก่อนส่งผลลัพธ์กลับไปยัง Codex สิ่งนี้แยกจาก Plugin hook สาธารณะ
`tool_result_persist` ซึ่งใช้แปลงการเขียนผลลัพธ์เครื่องมือใน transcript ที่ OpenClaw เป็นเจ้าของ

สำหรับความหมายของ Plugin hook เอง ดู [Plugin hooks](/th/plugins/hooks)
และ [พฤติกรรมการ guard ของ Plugin](/th/tools/plugin)

Harness นี้ปิดอยู่เป็นค่าเริ่มต้น คอนฟิกใหม่ควรเก็บ OpenAI model ref
ไว้ในรูปแบบ canonical เป็น `openai/gpt-*` และบังคับอย่างชัดเจนด้วย
`agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` เมื่อ
ต้องการการรันผ่าน app-server แบบ native model ref แบบเก่า `codex/*` ยังเลือก
harness อัตโนมัติเพื่อความเข้ากันได้ แต่ prefix ของ provider แบบเก่าที่อิง runtime
จะไม่ถูกแสดงเป็นตัวเลือก model/provider ปกติ

หากเปิดใช้ Plugin `codex` แล้ว แต่โมเดลหลักยังคงเป็น
`openai-codex/*`, `openclaw doctor` จะเตือนแทนการเปลี่ยนเส้นทาง นี่เป็น
พฤติกรรมที่ตั้งใจ: `openai-codex/*` ยังคงเป็นเส้นทาง PI Codex OAuth/subscription และ
การรันผ่าน app-server แบบ native ยังคงเป็นตัวเลือก runtime ที่ต้องระบุอย่างชัดเจน

## แผนที่เส้นทาง

ใช้ตารางนี้ก่อนเปลี่ยนคอนฟิก:

| พฤติกรรมที่ต้องการ                            | Model ref                  | คอนฟิกรันไทม์                         | ข้อกำหนดของ Plugin          | ป้ายสถานะที่คาดหวัง            |
| --------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API ผ่านตัวรัน OpenClaw ปกติ           | `openai/gpt-*`             | ละเว้นไว้ หรือ `runtime: "pi"`         | OpenAI provider             | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/subscription ผ่าน PI              | `openai-codex/gpt-*`       | ละเว้นไว้ หรือ `runtime: "pi"`         | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| เทิร์น embedded แบบ native ของ Codex app-server | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| ผู้ให้บริการหลายรายพร้อมโหมด auto แบบอนุรักษ์นิยม | ref แบบเฉพาะ provider     | `agentRuntime.id: "auto"`              | Plugin runtime แบบเลือกได้  | ขึ้นกับ runtime ที่เลือก       |
| เซสชัน Codex ACP adapter แบบชัดเจน           | ขึ้นกับ prompt/model ของ ACP | `sessions_spawn` กับ `runtime: "acp"` | backend `acpx` ที่สมบูรณ์    | สถานะงาน/เซสชันของ ACP        |

การแยกที่สำคัญคือ provider เทียบกับ runtime:

- `openai-codex/*` ตอบคำถามว่า "PI ควรใช้เส้นทาง provider/auth ใด?"
- `agentRuntime.id: "codex"` ตอบคำถามว่า "ลูปใดควรรัน
  เทิร์น embedded นี้?"
- `/codex ...` ตอบคำถามว่า "แชตนี้ควร bind หรือควบคุม
  การสนทนา native ของ Codex รายการใด?"
- ACP ตอบคำถามว่า "acpx ควรเปิดโพรเซส harness ภายนอกตัวใด?"

## เลือก model prefix ให้ถูกต้อง

เส้นทางในตระกูล OpenAI แยกกันตาม prefix ใช้ `openai-codex/*` เมื่อคุณต้องการ
Codex OAuth ผ่าน PI; ใช้ `openai/*` เมื่อต้องการเข้าถึง OpenAI API โดยตรง หรือ
เมื่อต้องการบังคับใช้ Codex app-server harness แบบ native:

| Model ref                                     | เส้นทาง runtime                             | ใช้เมื่อ                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI provider ผ่านโครงสร้าง OpenClaw/PI   | คุณต้องการเข้าถึง OpenAI Platform API โดยตรงในปัจจุบันด้วย `OPENAI_API_KEY` |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth ผ่าน OpenClaw/PI         | คุณต้องการ auth แบบ ChatGPT/Codex subscription ด้วยตัวรัน PI เริ่มต้น     |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | คุณต้องการการรันผ่าน Codex app-server แบบ native สำหรับเทิร์นเอเจนต์แบบ embedded |

ปัจจุบัน GPT-5.5 ใน OpenClaw รองรับเฉพาะ subscription/OAuth ให้ใช้
`openai-codex/gpt-5.5` สำหรับ PI OAuth หรือ `openai/gpt-5.5` ร่วมกับ Codex
app-server harness การเข้าถึง `openai/gpt-5.5` ด้วย API key โดยตรงจะรองรับ
เมื่อ OpenAI เปิด GPT-5.5 บน public API

ref แบบเก่า `codex/gpt-*` ยังคงรองรับในฐานะ compatibility alias การย้ายเพื่อความเข้ากันได้ของ Doctor
จะเขียน ref หลักแบบ runtime เก่าให้เป็น canonical model
ref และบันทึกนโยบาย runtime แยกต่างหาก ส่วน ref แบบเก่าที่อยู่เฉพาะ fallback จะไม่ถูกเปลี่ยน เพราะ runtime ถูกกำหนดสำหรับทั้ง container ของเอเจนต์
คอนฟิก PI Codex OAuth ใหม่ควรใช้ `openai-codex/gpt-*`; คอนฟิกใหม่สำหรับ
app-server harness แบบ native ควรใช้ `openai/gpt-*` ร่วมกับ
`agentRuntime.id: "codex"`

`agents.defaults.imageModel` ใช้การแยก prefix แบบเดียวกัน ใช้
`openai-codex/gpt-*` เมื่อการทำความเข้าใจภาพควรรันผ่านเส้นทาง OpenAI
Codex OAuth provider ใช้ `codex/gpt-*` เมื่อการทำความเข้าใจภาพควรรัน
ผ่านเทิร์น Codex app-server แบบมีขอบเขต โมเดล Codex app-server ต้อง
ประกาศว่ารองรับอินพุตภาพ; โมเดล Codex แบบข้อความล้วนจะล้มเหลวก่อนเริ่มเทิร์นสื่อ

ใช้ `/status` เพื่อยืนยัน harness ที่มีผลจริงสำหรับเซสชันปัจจุบัน หากผลการเลือกดูผิดคาด ให้เปิดการบันทึก debug สำหรับ subsystem `agents/harness`
แล้วตรวจสอบเรคคอร์ดแบบมีโครงสร้าง `agent harness selected` ของ gateway ซึ่ง
รวม id ของ harness ที่เลือก เหตุผลในการเลือก นโยบาย runtime/fallback และ
ในโหมด `auto` จะรวมผลการรองรับของผู้สมัครแต่ละ Plugin ด้วย

### คำเตือนจาก doctor หมายความว่าอะไร

`openclaw doctor` จะเตือนเมื่อเงื่อนไขทั้งหมดต่อไปนี้เป็นจริง:

- Plugin `codex` ที่มาพร้อมในชุดถูกเปิดใช้หรืออยู่ใน allow
- โมเดลหลักของเอเจนต์เป็น `openai-codex/*`
- runtime ที่มีผลจริงของเอเจนต์นั้นไม่ใช่ `codex`

คำเตือนนี้มีอยู่เพราะผู้ใช้มักคาดว่า "เปิดใช้ Codex plugin" จะหมายถึง "ใช้ native Codex app-server runtime" OpenClaw จะไม่สรุปเช่นนั้น คำเตือนนี้หมายความว่า:

- **ไม่จำเป็นต้องเปลี่ยนอะไร** หากคุณตั้งใจใช้ ChatGPT/Codex OAuth ผ่าน PI
- เปลี่ยนโมเดลเป็น `openai/<model>` และตั้งค่า
  `agentRuntime.id: "codex"` หากคุณตั้งใจใช้การรัน
  ผ่าน app-server แบบ native
- เซสชันที่มีอยู่ยังต้องใช้ `/new` หรือ `/reset` หลังการเปลี่ยน runtime
  เพราะการปักหมุด runtime ของเซสชันเป็นแบบ sticky

การเลือก Harness ไม่ใช่ตัวควบคุมเซสชัน live เมื่อเทิร์น embedded ทำงาน
OpenClaw จะบันทึก id ของ harness ที่เลือกลงบนเซสชันนั้นและใช้ต่อไปสำหรับ
เทิร์นถัดมาใน session id เดียวกัน เปลี่ยนคอนฟิก `agentRuntime` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อต้องการให้เซสชันในอนาคตใช้ harness อื่น;
ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับการสนทนาที่มีอยู่
ระหว่าง PI กับ Codex วิธีนี้ช่วยหลีกเลี่ยงการ replay transcript เดียว
ผ่านระบบเซสชัน native ที่เข้ากันไม่ได้สองระบบ

เซสชันเก่าที่สร้างก่อนมีการปักหมุด harness จะถือว่าใช้ PI เมื่อมีประวัติ transcript แล้ว
ให้ใช้ `/new` หรือ `/reset` เพื่อเปลี่ยนการสนทนานั้นให้ใช้ Codex หลังเปลี่ยนคอนฟิก

`/status` จะแสดง runtime ของโมเดลที่มีผลจริง PI harness ค่าเริ่มต้นจะแสดงเป็น
`Runtime: OpenClaw Pi Default` และ Codex app-server harness จะแสดงเป็น
`Runtime: OpenAI Codex`

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` แบบ bundled พร้อมใช้งาน
- Codex app-server เวอร์ชัน `0.125.0` หรือใหม่กว่า Plugin ที่มาพร้อมในชุดจะจัดการ
  ไบนารี Codex app-server ที่เข้ากันได้ให้เป็นค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ภายในเครื่องบน `PATH`
  จะไม่กระทบต่อการเริ่ม harness ปกติ
- มี Codex auth พร้อมให้โพรเซส app-server ใช้งาน

Plugin จะบล็อกการจับมือ app-server ที่เก่าหรือไม่มีเวอร์ชัน วิธีนี้ช่วยให้
OpenClaw ใช้เฉพาะพื้นผิวโปรโตคอลที่ได้ทดสอบแล้ว

สำหรับการทดสอบ smoke แบบ live และ Docker, auth มักมาจาก `OPENAI_API_KEY`
ร่วมกับไฟล์ Codex CLI แบบเลือกได้ เช่น `~/.codex/auth.json` และ
`~/.codex/config.toml` ให้ใช้ชุดข้อมูล auth เดียวกับที่ Codex app-server
ในเครื่องของคุณใช้อยู่

## คอนฟิกขั้นต่ำ

ใช้ `openai/gpt-5.5`, เปิดใช้ Plugin ที่ bundled และบังคับใช้ `codex` harness:

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

หากคอนฟิกของคุณใช้ `plugins.allow`, ให้รวม `codex` ไว้ด้วย:

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

คอนฟิกแบบเก่าที่ตั้ง `agents.defaults.model` หรือโมเดลของเอเจนต์เป็น
`codex/<model>` จะยังคงเปิดใช้ Plugin `codex` ที่ bundled ให้อัตโนมัติ คอนฟิกใหม่ควร
เลือกใช้ `openai/<model>` ร่วมกับรายการ `agentRuntime` แบบชัดเจนด้านบน

## เพิ่ม Codex ควบคู่กับโมเดลอื่น

อย่าตั้ง `agentRuntime.id: "codex"` แบบส่วนกลาง หากเอเจนต์ตัวเดียวกันต้องสามารถสลับ
ระหว่าง Codex และโมเดลของ provider อื่นได้อย่างอิสระ runtime ที่ถูกบังคับจะมีผลกับทุก
เทิร์น embedded ของเอเจนต์หรือเซสชันนั้น หากคุณเลือกโมเดล Anthropic ขณะที่
runtime นี้ถูกบังคับ OpenClaw จะยังพยายามใช้ Codex harness และล้มเหลวแบบ fail closed
แทนที่จะกำหนดเส้นทางเทิร์นนั้นผ่าน PI อย่างเงียบ ๆ

ให้ใช้รูปแบบอย่างใดอย่างหนึ่งต่อไปนี้แทน:

- วาง Codex ไว้บนเอเจนต์เฉพาะที่ใช้ `agentRuntime.id: "codex"`
- คงเอเจนต์ค่าเริ่มต้นไว้ที่ `agentRuntime.id: "auto"` และใช้ PI fallback สำหรับการใช้งาน provider แบบผสมตามปกติ
- ใช้ ref แบบเก่า `codex/*` เพื่อความเข้ากันได้เท่านั้น คอนฟิกใหม่ควรเลือกใช้
  `openai/*` ร่วมกับนโยบาย runtime ของ Codex แบบชัดเจน

ตัวอย่างเช่น คอนฟิกนี้จะคงเอเจนต์ค่าเริ่มต้นไว้บนการเลือกอัตโนมัติแบบปกติ และ
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

ด้วยรูปแบบนี้:

- เอเจนต์ `main` ค่าเริ่มต้นจะใช้เส้นทาง provider ปกติและ PI compatibility fallback
- เอเจนต์ `codex` จะใช้ Codex app-server harness
- หาก Codex ไม่มีอยู่หรือไม่รองรับสำหรับเอเจนต์ `codex`, เทิร์นนั้นจะล้มเหลว
  แทนที่จะใช้ PI แบบเงียบ ๆ

## การกำหนดเส้นทางคำสั่งของเอเจนต์

เอเจนต์ควรกำหนดเส้นทางคำขอของผู้ใช้ตามเจตนา ไม่ใช่ตามคำว่า "Codex" เพียงอย่างเดียว:

| ผู้ใช้ขอ...                                             | เอเจนต์ควรใช้...                                 |
| ------------------------------------------------------- | ------------------------------------------------ |
| "Bind แชตนี้กับ Codex"                                  | `/codex bind`                                    |
| "Resume Codex thread `<id>` ที่นี่"                      | `/codex resume <id>`                             |
| "แสดง Codex threads"                                    | `/codex threads`                                 |
| "ใช้ Codex เป็น runtime สำหรับเอเจนต์นี้"               | เปลี่ยนคอนฟิกที่ `agentRuntime.id`              |
| "ใช้ ChatGPT/Codex subscription ของฉันกับ OpenClaw ปกติ" | model ref แบบ `openai-codex/*`                  |
| "รัน Codex ผ่าน ACP/acpx"                               | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "เริ่ม Claude Code/Gemini/OpenCode/Cursor ใน thread"    | ACP/acpx ไม่ใช่ `/codex` และไม่ใช่ native sub-agents |

OpenClaw จะประกาศแนวทางการ spawn ผ่าน ACP ให้เอเจนต์ทราบก็ต่อเมื่อ ACP ถูกเปิดใช้งาน
สามารถ dispatch ได้ และมี runtime backend ที่โหลดอยู่รองรับ หาก ACP ไม่พร้อมใช้งาน
system prompt และ Skills ของ Plugin ไม่ควรสอนเอเจนต์เกี่ยวกับการกำหนดเส้นทางผ่าน ACP

## การติดตั้งใช้งานแบบ Codex-only

บังคับใช้ Codex harness เมื่อต้องการพิสูจน์ว่าเทิร์นเอเจนต์แบบ embedded ทุกครั้ง
ใช้ Codex runtime ของ Plugin แบบชัดเจนจะไม่มี PI fallback เป็นค่าเริ่มต้น ดังนั้น
`fallback: "none"` จึงเป็นทางเลือก แต่ก็มักมีประโยชน์ในเชิงเอกสารประกอบ:

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

override ผ่านสภาพแวดล้อม:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

เมื่อบังคับใช้ Codex, OpenClaw จะล้มเหลวตั้งแต่ต้นหากปิด Plugin Codex อยู่,
app-server เก่าเกินไป หรือ app-server เริ่มทำงานไม่ได้ ให้ตั้ง
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` เฉพาะเมื่อคุณต้องการให้ PI มารับช่วง
เมื่อไม่มี harness อย่างตั้งใจเท่านั้น

## Codex ต่อเอเจนต์

คุณสามารถทำให้เอเจนต์หนึ่งใช้ Codex เท่านั้นได้ ขณะที่เอเจนต์ค่าเริ่มต้นยังคงใช้
การเลือกอัตโนมัติแบบปกติ:

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
เซสชัน OpenClaw ใหม่ และ Codex harness จะสร้างหรือ resume sidecar app-server
thread ตามความจำเป็น `/reset` จะล้างการ bind เซสชัน OpenClaw สำหรับ thread นั้น
และปล่อยให้เทิร์นถัดไป resolve harness จากคอนฟิกปัจจุบันอีกครั้ง

## การค้นหาโมเดล

โดยค่าเริ่มต้น Plugin Codex จะถาม app-server เพื่อขอโมเดลที่มีอยู่ หาก
การค้นหาล้มเหลวหรือหมดเวลา ระบบจะใช้แค็ตตาล็อก fallback ที่มาพร้อมในชุดสำหรับ:

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

ปิดการค้นหาเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการ probe Codex และใช้
แค็ตตาล็อก fallback เท่านั้น:

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

## การเชื่อมต่อและนโยบายของ App-server

โดยค่าเริ่มต้น Plugin จะเริ่มไบนารี Codex ที่ OpenClaw จัดการให้ในเครื่องด้วย:

```bash
codex app-server --listen stdio://
```

ไบนารีที่ระบบจัดการให้นี้ถูกประกาศเป็น bundled plugin runtime dependency และถูกจัดเตรียม
พร้อมกับ dependency อื่นของ Plugin `codex` วิธีนี้ช่วยผูกเวอร์ชัน app-server
เข้ากับ Plugin ที่มาพร้อมในชุด แทนที่จะผูกกับ Codex CLI แยกตัวใดก็ตาม
ที่บังเอิญติดตั้งอยู่ในเครื่อง ให้ตั้ง `appServer.command` เฉพาะเมื่อคุณ
ตั้งใจจะรัน executable ตัวอื่นจริง ๆ

โดยค่าเริ่มต้น OpenClaw จะเริ่มเซสชัน Codex harness ในเครื่องในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือท่าทีของผู้ปฏิบัติการในเครื่องที่เชื่อถือได้
ซึ่งใช้สำหรับ Heartbeat อัตโนมัติ: Codex สามารถใช้ shell และเครื่องมือเครือข่ายได้
โดยไม่ต้องหยุดที่ native approval prompt ซึ่งไม่มีใครอยู่มาตอบ

หากต้องการเลือกใช้ approvals แบบ guardian-reviewed ของ Codex ให้ตั้ง `appServer.mode:
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

โหมด Guardian ใช้เส้นทาง native auto-review approval ของ Codex เมื่อ Codex ขอ
ออกจาก sandbox, เขียนนอก workspace หรือเพิ่มสิทธิ์อย่างการเข้าถึงเครือข่าย
Codex จะส่งคำขออนุมัตินั้นไปยัง reviewer แบบ native แทน human prompt
Reviewer จะใช้กรอบความเสี่ยงของ Codex และอนุมัติหรือปฏิเสธคำขอเฉพาะนั้น
ใช้ Guardian เมื่อต้องการราวกันตกมากกว่าโหมด YOLO แต่ยังต้องการให้เอเจนต์แบบไม่ต้องเฝ้า
เดินหน้าต่อได้

preset `guardian` จะขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"`
ฟิลด์นโยบายแต่ละรายการยังคงมีสิทธิ์ override `mode` ดังนั้นการติดตั้งใช้งานขั้นสูงจึงสามารถผสม
preset นี้เข้ากับตัวเลือกแบบชัดเจนได้ ค่า reviewer แบบเก่า `guardian_subagent` ยัง
รองรับในฐานะ compatibility alias แต่คอนฟิกใหม่ควรใช้ `auto_review`

สำหรับ app-server ที่รันอยู่แล้ว ให้ใช้การขนส่งแบบ WebSocket:

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

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์              | ค่าเริ่มต้น                               | ความหมาย                                                                                                      |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `transport`        | `"stdio"`                                 | `"stdio"` จะเปิด Codex; `"websocket"` จะเชื่อมต่อไปยัง `url`                                                 |
| `command`          | ไบนารี Codex ที่ระบบจัดการให้             | executable สำหรับการขนส่งแบบ stdio ปล่อยว่างไว้เพื่อใช้ไบนารีที่ระบบจัดการให้; ตั้งค่านี้เฉพาะเมื่อ override อย่างชัดเจน |
| `args`             | `["app-server", "--listen", "stdio://"]`  | อาร์กิวเมนต์สำหรับการขนส่งแบบ stdio                                                                           |
| `url`              | ไม่ได้ตั้งค่า                              | URL ของ WebSocket app-server                                                                                  |
| `authToken`        | ไม่ได้ตั้งค่า                              | Bearer token สำหรับการขนส่งแบบ WebSocket                                                                      |
| `headers`          | `{}`                                      | WebSocket header เพิ่มเติม                                                                                     |
| `requestTimeoutMs` | `60000`                                   | ระยะหมดเวลาสำหรับการเรียก control-plane ของ app-server                                                        |
| `mode`             | `"yolo"`                                  | preset สำหรับการรันแบบ YOLO หรือ guardian-reviewed                                                            |
| `approvalPolicy`   | `"never"`                                 | นโยบาย native approval ของ Codex ที่ส่งตอนเริ่ม/resume/rัน thread                                             |
| `sandbox`          | `"danger-full-access"`                    | โหมด sandbox แบบ native ของ Codex ที่ส่งตอนเริ่ม/resume thread                                                 |
| `approvalsReviewer`| `"user"`                                  | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทาน native approval prompt เอง `guardian_subagent` ยังคงเป็น alias แบบเก่า |
| `serviceTier`      | ไม่ได้ตั้งค่า                              | service tier แบบเลือกได้ของ Codex app-server: `"fast"`, `"flex"` หรือ `null` ค่าแบบเก่าที่ไม่ถูกต้องจะถูกละเว้น |

override ผ่านสภาพแวดล้อมยังคงใช้งานได้สำหรับการทดสอบในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้ามไบนารีที่ระบบจัดการให้เมื่อ
`appServer.command` ไม่ได้ถูกตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกถอดออกแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว
คอนฟิกเป็นตัวเลือกที่ดีกว่าสำหรับการติดตั้งใช้งานที่ทำซ้ำได้ เพราะเก็บพฤติกรรมของ Plugin ไว้ใน
ไฟล์ที่ผ่านการตรวจสอบเดียวกันกับส่วนตั้งค่า Codex harness ที่เหลือ

## สูตรที่ใช้บ่อย

Codex ในเครื่องพร้อมการขนส่ง stdio ค่าเริ่มต้น:

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

approvals ของ Codex แบบ guardian-reviewed:

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

app-server ระยะไกลพร้อม header แบบชัดเจน:

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

การสลับโมเดลยังคงอยู่ภายใต้การควบคุมของ OpenClaw เมื่อเซสชัน OpenClaw ถูกผูก
กับ Codex thread ที่มีอยู่ เทิร์นถัดไปจะส่งโมเดล OpenAI ที่เลือกอยู่ในปัจจุบัน,
provider, approval policy, sandbox และ service tier ไปยัง
app-server อีกครั้ง การสลับจาก `openai/gpt-5.5` ไปเป็น `openai/gpt-5.2` จะยังคงการ bind ของ
thread ไว้ แต่ขอให้ Codex ทำงานต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

Plugin ที่มาพร้อมในชุดจะลงทะเบียน `/codex` เป็น slash command ที่ได้รับอนุญาต คำสั่งนี้
เป็นแบบทั่วไปและทำงานได้บนทุก channel ที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` แสดงการเชื่อมต่อ app-server แบบ live, โมเดล, บัญชี, rate limit, MCP server และ Skills
- `/codex models` แสดงโมเดล live ของ Codex app-server
- `/codex threads [filter]` แสดง Codex threads ล่าสุด
- `/codex resume <thread-id>` ผูกเซสชัน OpenClaw ปัจจุบันเข้ากับ Codex thread ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server ทำ Compaction กับ thread ที่ผูกไว้
- `/codex review` เริ่ม Codex native review สำหรับ thread ที่ผูกไว้
- `/codex account` แสดงสถานะบัญชีและ rate limit
- `/codex mcp` แสดงสถานะ MCP server ของ Codex app-server
- `/codex skills` แสดง Skills ของ Codex app-server

`/codex resume` จะเขียน sidecar binding file เดียวกับที่ harness ใช้สำหรับ
เทิร์นปกติ ในข้อความถัดไป OpenClaw จะ resume Codex thread นั้น ส่ง
โมเดล OpenClaw ที่เลือกอยู่ในปัจจุบันเข้าไปยัง app-server และเปิดใช้ประวัติแบบขยายต่อไป

พื้นผิวคำสั่งนี้ต้องใช้ Codex app-server เวอร์ชัน `0.125.0` หรือใหม่กว่า เมธอดควบคุมแต่ละตัวจะถูกรายงานเป็น `unsupported by this Codex app-server` หาก
app-server ในอนาคตหรือแบบกำหนดเองไม่เปิดเผยเมธอด JSON-RPC นั้น

## ขอบเขตของ Hook

Codex harness มี hook อยู่สามชั้น:

| ชั้น                                  | เจ้าของ                  | วัตถุประสงค์                                                          |
| ------------------------------------- | ------------------------ | ---------------------------------------------------------------------- |
| OpenClaw plugin hooks                 | OpenClaw                 | ความเข้ากันได้ของผลิตภัณฑ์/Plugin ข้าม PI และ Codex harness         |
| Codex app-server extension middleware | Plugin แบบ bundled ของ OpenClaw | พฤติกรรม adapter ต่อเทิร์นรอบ OpenClaw dynamic tools                  |
| Codex native hooks                    | Codex                    | วงจรชีวิตระดับล่างของ Codex และนโยบาย native tool จากคอนฟิก Codex   |

OpenClaw จะไม่ใช้ไฟล์ `hooks.json` ของ Codex แบบระดับโปรเจ็กต์หรือระดับโกลบอลเพื่อกำหนดเส้นทาง
พฤติกรรมของ OpenClaw Plugin สำหรับสะพาน native tool และ permission ที่รองรับ
OpenClaw จะ inject คอนฟิก Codex ต่อ thread สำหรับ `PreToolUse`, `PostToolUse`,
`PermissionRequest` และ `Stop` ส่วน hook อื่นของ Codex เช่น `SessionStart` และ
`UserPromptSubmit` ยังคงเป็นตัวควบคุมระดับ Codex; ยังไม่ถูกเปิดเผยเป็น
OpenClaw plugin hook ในสัญญา v1

สำหรับ OpenClaw dynamic tools, OpenClaw จะรันเครื่องมือหลังจากที่ Codex ขอ
การเรียกใช้ ดังนั้น OpenClaw จึงเรียกพฤติกรรม Plugin และ middleware ที่มันเป็นเจ้าของ
ใน harness adapter สำหรับ Codex-native tools, Codex เป็นเจ้าของเรคคอร์ดเครื่องมือหลัก
OpenClaw สามารถ mirror เหตุการณ์บางรายการได้ แต่ไม่สามารถเขียน thread native ของ Codex ใหม่ได้
เว้นแต่ Codex จะเปิดเผยการดำเนินการนั้นผ่าน app-server หรือ callback ของ native hook

projection ของ Compaction และวงจรชีวิต LLM มาจาก notification ของ Codex app-server
และสถานะ adapter ของ OpenClaw ไม่ใช่จากคำสั่ง native hook ของ Codex
เหตุการณ์ `before_compaction`, `after_compaction`, `llm_input` และ
`llm_output` ของ OpenClaw เป็นการสังเกตการณ์ระดับ adapter ไม่ใช่การจับข้อมูล
request หรือ payload ของ Compaction ภายใน Codex แบบ byte-for-byte

notification ของ Codex native `hook/started` และ `hook/completed` จาก app-server จะ
ถูกฉายเป็น agent event `codex_app_server.hook` สำหรับ trajectory และการดีบัก
โดยจะไม่เรียก OpenClaw plugin hooks

## สัญญาการรองรับ V1

โหมด Codex ไม่ใช่ PI ที่แค่เรียกโมเดลคนละตัวใต้ชั้นล่าง Codex เป็นเจ้าของ
ลูปโมเดลแบบ native มากกว่า และ OpenClaw จะปรับพื้นผิวของ Plugin และเซสชัน
รอบขอบเขตนั้น

รองรับใน Codex runtime v1:

| พื้นผิว                                       | การรองรับ                                  | เหตุผล                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ลูปโมเดล OpenAI ผ่าน Codex                    | รองรับ                                      | Codex app-server เป็นเจ้าของเทิร์น OpenAI, การ resume thread แบบ native และการต่อเนื่องของ native tool                                                                                                 |
| การกำหนดเส้นทางและการส่งผ่าน channel ของ OpenClaw | รองรับ                                      | Telegram, Discord, Slack, WhatsApp, iMessage และ channel อื่นยังคงอยู่นอก runtime ของโมเดล                                                                                                             |
| OpenClaw dynamic tools                        | รองรับ                                      | Codex ขอให้ OpenClaw รันเครื่องมือเหล่านี้ ดังนั้น OpenClaw ยังคงอยู่ในเส้นทางการทำงาน                                                                                                                 |
| Plugin ของ prompt และ context                 | รองรับ                                      | OpenClaw สร้าง prompt overlay และฉายบริบทเข้าไปใน Codex turn ก่อนเริ่มหรือ resume thread                                                                                                               |
| วงจรชีวิตของ context engine                   | รองรับ                                      | การประกอบ, การนำเข้า หรือการดูแลหลังเทิร์น และการประสานงาน Compaction ของ context engine จะทำงานสำหรับ Codex turns                                                                                     |
| Dynamic tool hooks                            | รองรับ                                      | `before_tool_call`, `after_tool_call` และ tool-result middleware จะทำงานรอบ dynamic tool ที่ OpenClaw เป็นเจ้าของ                                                                                        |
| Lifecycle hooks                               | รองรับในฐานะการสังเกตการณ์ระดับ adapter    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` และ `after_compaction` จะถูกเรียกด้วย payload ของโหมด Codex ที่ซื่อตรง                                                                        |
| Final-answer revision gate                    | รองรับผ่าน native hook relay               | Codex `Stop` จะถูกส่งต่อไปยัง `before_agent_finalize`; `revise` จะขอให้ Codex รันโมเดลอีกหนึ่งรอบก่อน finalize                                                                                         |
| บล็อกหรือสังเกต shell, patch และ MCP แบบ native | รองรับผ่าน native hook relay               | Codex `PreToolUse` และ `PostToolUse` จะถูกส่งต่อสำหรับพื้นผิว native tool ที่ยืนยันแล้ว รวมถึง payload ของ MCP บน Codex app-server `0.125.0` หรือใหม่กว่า รองรับการบล็อก; ไม่รองรับการเขียนอาร์กิวเมนต์ใหม่ |
| นโยบาย native permission                      | รองรับผ่าน native hook relay               | Codex `PermissionRequest` สามารถถูกกำหนดเส้นทางผ่านนโยบาย OpenClaw ได้ เมื่อ runtime เปิดเผยสิ่งนี้ หาก OpenClaw ไม่คืนผลการตัดสินใจ Codex จะเดินหน้าต่อผ่านเส้นทาง guardian หรือ user approval ตามปกติ |
| การจับ trajectory ของ app-server              | รองรับ                                      | OpenClaw บันทึก request ที่ส่งไปยัง app-server และ notification ที่ได้รับกลับมา                                                                                                                         |

ไม่รองรับใน Codex runtime v1:

| พื้นผิว                                             | ขอบเขตของ V1                                                                                                                                    | แนวทางในอนาคต                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| การแก้ไขอาร์กิวเมนต์ของ native tool                | pre-tool hook แบบ native ของ Codex บล็อกได้ แต่ OpenClaw ไม่เขียนอาร์กิวเมนต์ของ Codex-native tool ใหม่                                          | ต้องการการรองรับจาก schema/hook ของ Codex สำหรับการแทนที่อินพุตของ tool                  |
| ประวัติ transcript แบบ native ของ Codex ที่แก้ไขได้ | Codex เป็นเจ้าของประวัติ thread แบบ native หลัก OpenClaw เป็นเจ้าของ mirror และฉายบริบทในอนาคตได้ แต่ไม่ควรแก้ไขส่วนภายในที่ไม่รองรับ             | เพิ่ม API ของ Codex app-server แบบชัดเจน หากต้องมีการผ่าตัด thread แบบ native            |
| `tool_result_persist` สำหรับเรคคอร์ด Codex-native tool | hook นี้แปลงการเขียน transcript ที่ OpenClaw เป็นเจ้าของ ไม่ใช่เรคคอร์ด Codex-native tool                                                        | อาจ mirror เรคคอร์ดที่แปลงแล้วได้ แต่การเขียนหลักใหม่ต้องอาศัยการรองรับจาก Codex        |
| metadata ของ Compaction แบบละเอียด                  | OpenClaw สังเกตการเริ่มและจบของ Compaction ได้ แต่ไม่ได้รับ kept/dropped list, token delta หรือ payload สรุปแบบคงที่                              | ต้องการเหตุการณ์ Compaction ของ Codex ที่ละเอียดขึ้น                                      |
| การแทรกแซง Compaction                              | ปัจจุบัน hook ของ Compaction ใน OpenClaw เป็นระดับการแจ้งเตือนในโหมด Codex                                                                        | เพิ่ม Codex pre/post compaction hooks หาก Plugin ต้อง veto หรือเขียน native compaction ใหม่ |
| การจับคำขอ model API แบบ byte-for-byte             | OpenClaw จับ request และ notification ของ app-server ได้ แต่ Codex core สร้างคำขอ OpenAI API สุดท้ายภายในเอง                                     | ต้องการเหตุการณ์ tracing ของ model-request หรือ debug API จาก Codex                      |

## เครื่องมือ สื่อ และ Compaction

Codex harness เปลี่ยนเฉพาะตัวรันเอเจนต์แบบ embedded ระดับล่างเท่านั้น

OpenClaw ยังคงสร้างรายการเครื่องมือและรับผลลัพธ์ของ dynamic tool จาก
harness ข้อความ รูปภาพ วิดีโอ เพลง TTS approvals และเอาต์พุตของ messaging-tool
ยังคงผ่านเส้นทางการส่งปกติของ OpenClaw

native hook relay ถูกออกแบบให้เป็นแบบทั่วไปโดยตั้งใจ แต่สัญญาการรองรับ v1 ถูกจำกัดไว้
เฉพาะเส้นทาง native tool และ permission ของ Codex ที่ OpenClaw ทดสอบ ใน
Codex runtime สิ่งนี้รวมถึง payload ของ shell, patch และ MCP ใน `PreToolUse`,
`PostToolUse` และ `PermissionRequest` อย่าสันนิษฐานว่าเหตุการณ์ hook ของ Codex
ในอนาคตทุกตัวจะเป็นพื้นผิว Plugin ของ OpenClaw จนกว่าสัญญา runtime จะตั้งชื่อมันไว้

สำหรับ `PermissionRequest`, OpenClaw จะคืนการตัดสินใจแบบ allow หรือ deny อย่างชัดเจน
เฉพาะเมื่อมีการตัดสินจากนโยบาย ผลลัพธ์แบบ no-decision ไม่ใช่ allow Codex จะถือว่า
ไม่มีการตัดสินจาก hook และจะเดินหน้าต่อไปยังเส้นทาง guardian หรือ user approval ของตัวเอง

การร้องขอ approval ของ Codex MCP tool จะถูกกำหนดเส้นทางผ่านโฟลว์ approval ของ Plugin
ใน OpenClaw เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"` ส่วนพรอมป์ `request_user_input` ของ Codex จะถูกส่งกลับไปยังแชตต้นทาง และข้อความ follow-up ที่เข้าคิวไว้ถัดไปจะถูกใช้เพื่อตอบคำขอของ native server นั้น แทนที่จะถูก steer เป็นบริบทเพิ่มเติม คำขอ elicitation อื่นของ MCP ยังคงล้มเหลวแบบ fail closed

เมื่อโมเดลที่เลือกใช้ Codex harness, native thread compaction จะถูก
มอบหมายให้ Codex app-server OpenClaw ยังคงเก็บ transcript mirror สำหรับประวัติ channel,
การค้นหา, `/new`, `/reset` และการสลับโมเดลหรือ harness ในอนาคต mirror นี้
รวม user prompt, ข้อความ assistant สุดท้าย และเรคคอร์ด reasoning หรือ plan แบบเบา
ของ Codex เมื่อ app-server ปล่อยมันออกมา ปัจจุบัน OpenClaw บันทึกเฉพาะสัญญาณ
เริ่มต้นและเสร็จสิ้นของ native compaction เท่านั้น ยังไม่เปิดเผย
สรุป Compaction แบบมนุษย์อ่านได้ หรือรายการแบบตรวจสอบย้อนกลับได้ว่า Codex
เก็บรายการใดไว้หลัง Compaction

เนื่องจาก Codex เป็นเจ้าของ native thread หลัก `tool_result_persist` จึงยังไม่เขียน
เรคคอร์ดผลลัพธ์ของ Codex-native tool ใหม่ในตอนนี้ มันมีผลเฉพาะเมื่อ
OpenClaw กำลังเขียนผลลัพธ์เครื่องมือใน session transcript ที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่จำเป็นต้องใช้ PI การสร้างภาพ วิดีโอ เพลง PDF TTS และการทำความเข้าใจสื่อยังคงใช้การตั้งค่า provider/model ที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ปัญหา

**Codex ไม่ปรากฏเป็น provider ปกติใน `/model`:** นี่เป็นพฤติกรรมที่คาดไว้สำหรับ
คอนฟิกใหม่ ให้เลือกโมเดล `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"` (หรือ ref แบบเก่า `codex/*`), เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ไม่ได้ตัด
`codex` ออก

**OpenClaw ใช้ PI แทน Codex:** `agentRuntime.id: "auto"` ยังสามารถใช้ PI เป็น
backend เพื่อความเข้ากันได้เมื่อไม่มี Codex harness ตัวใดรับช่วงการรัน ให้ตั้ง
`agentRuntime.id: "codex"` เพื่อบังคับเลือก Codex ระหว่างการทดสอบ
runtime Codex ที่ถูกบังคับจะล้มเหลวแทนการ fallback ไป PI เว้นแต่คุณจะ
ตั้ง `agentRuntime.fallback: "pi"` อย่างชัดเจน เมื่อเลือก Codex app-server
แล้ว ความล้มเหลวของมันจะแสดงโดยตรงโดยไม่ต้องมีคอนฟิก fallback เพิ่มเติม

**app-server ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้การจับมือของ app-server
รายงานเวอร์ชัน `0.125.0` หรือใหม่กว่า prerelease เวอร์ชันเดียวกันหรือ
เวอร์ชันที่มี suffix ของ build เช่น `0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูก
ปฏิเสธ เพราะพื้นผิวโปรโตคอลขั้นต่ำที่ OpenClaw ทดสอบคือ `0.125.0` รุ่นเสถียร

**การค้นหาโมเดลช้า:** ลดค่า `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิดการค้นหา

**การขนส่งแบบ WebSocket ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`
และให้แน่ใจว่า app-server ระยะไกลใช้ Codex app-server protocol เวอร์ชันเดียวกัน

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นพฤติกรรมที่คาดไว้ เว้นแต่คุณจะบังคับ
`agentRuntime.id: "codex"` สำหรับเอเจนต์นั้น หรือเลือก ref แบบเก่า
`codex/*` ref แบบ `openai/gpt-*` ปกติและ ref ของ provider อื่นจะยังคงใช้เส้นทาง
provider ปกติในโหมด `auto` หากคุณบังคับ `agentRuntime.id: "codex"`, ทุก embedded
turn ของเอเจนต์นั้นจะต้องเป็นโมเดล OpenAI ที่ Codex รองรับ

## ที่เกี่ยวข้อง

- [Agent harness plugins](/th/plugins/sdk-agent-harness)
- [Agent runtimes](/th/concepts/agent-runtimes)
- [Model providers](/th/concepts/model-providers)
- [OpenAI provider](/th/providers/openai)
- [Status](/th/cli/status)
- [Plugin hooks](/th/plugins/hooks)
- [ข้อมูลอ้างอิงการตั้งค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
