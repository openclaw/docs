---
read_when:
    - คุณต้องการใช้ฮาร์เนส app-server ของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่าฮาร์เนสของ Codex
    - คุณต้องการให้การปรับใช้แบบ Codex เท่านั้นล้มเหลว แทนที่จะถอยกลับไปใช้ PI
summary: เรียกใช้เทิร์นของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านฮาร์เนส app-server ของแอป Codex ที่รวมมาให้
title: ชุดควบคุม Codex
x-i18n:
    generated_at: "2026-05-01T10:19:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่มาพร้อมชุดติดตั้งช่วยให้ OpenClaw รันรอบการทำงานของเอเจนต์แบบฝังผ่าน
Codex app-server แทน PI harness ในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง: การค้นหา
โมเดล, การ resume thread แบบ native, compaction แบบ native และการรันผ่าน app-server
OpenClaw ยังเป็นเจ้าของช่องทางแชต, ไฟล์เซสชัน, การเลือกโมเดล, เครื่องมือ,
การอนุมัติ, การส่งสื่อ และกระจก transcript ที่มองเห็นได้

หากคุณกำลังพยายามทำความเข้าใจภาพรวม ให้เริ่มจาก
[รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) สรุปสั้นคือ:
`openai/gpt-5.5` คือ model ref, `codex` คือ runtime และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## คอนฟิกแบบเร็ว

หากต้องการใช้ Codex harness สำหรับรอบการทำงานของเอเจนต์ GPT ให้คง model ref แบบ canonical เป็น
`openai/gpt-*`, เปิดใช้ Plugin `codex` ที่มาพร้อมชุดติดตั้ง และตั้งค่า
`agentRuntime.id: "codex"`:

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

อย่าใช้ `openai-codex/gpt-*` สำหรับเส้นทางนี้ สิ่งนั้นจะเลือก Codex OAuth ผ่าน
PI runner ปกติ เว้นแต่คุณจะบังคับ runtime แยกต่างหาก การเปลี่ยนคอนฟิกมีผลกับ
เซสชันใหม่หรือเซสชันที่ reset แล้ว; เซสชันที่มีอยู่จะคง runtime ที่บันทึกไว้

## Plugin นี้เปลี่ยนอะไร

Plugin `codex` ที่มาพร้อมชุดติดตั้งเพิ่มความสามารถหลายส่วนแยกกัน:

| ความสามารถ | วิธีใช้ | สิ่งที่ทำ |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime แบบฝัง native | `agentRuntime.id: "codex"` | รันรอบการทำงานของเอเจนต์แบบฝังของ OpenClaw ผ่าน Codex app-server |
| คำสั่งควบคุมแชต native | `/codex bind`, `/codex resume`, `/codex steer`, ... | ผูกและควบคุม thread ของ Codex app-server จากบทสนทนาในแอปส่งข้อความ |
| Provider/catalog ของ Codex app-server | ภายในของ `codex`, เปิดเผยผ่าน harness | ให้ runtime ค้นหาและตรวจสอบโมเดล app-server ได้ |
| เส้นทางการเข้าใจสื่อของ Codex | เส้นทางความเข้ากันได้ของโมเดลภาพ `codex/*` | รันรอบการทำงาน Codex app-server แบบมีขอบเขตสำหรับโมเดลการเข้าใจภาพที่รองรับ |
| รีเลย์ hook native | Plugin hooks รอบเหตุการณ์แบบ Codex-native | ให้ OpenClaw สังเกต/บล็อกเหตุการณ์เครื่องมือ/การ finalization แบบ Codex-native ที่รองรับได้ |

การเปิดใช้ Plugin จะทำให้ความสามารถเหล่านั้นพร้อมใช้งาน แต่ **ไม่ได้**:

- เริ่มใช้ Codex สำหรับทุกโมเดล OpenAI
- แปลง model ref `openai-codex/*` เป็น runtime native
- ทำให้ ACP/acpx เป็นเส้นทาง Codex เริ่มต้น
- hot-switch เซสชันที่มีอยู่ซึ่งบันทึก PI runtime ไว้แล้ว
- แทนที่การส่งผ่านช่องทางของ OpenClaw, ไฟล์เซสชัน, ที่เก็บ auth-profile หรือ
  การ route ข้อความ

Plugin เดียวกันนี้ยังเป็นเจ้าของพื้นผิวคำสั่งควบคุมแชต `/codex` แบบ native ด้วย หาก
Plugin เปิดใช้อยู่และผู้ใช้ขอ bind, resume, steer, stop หรือตรวจสอบ
thread ของ Codex จากแชต เอเจนต์ควรเลือกใช้ `/codex ...` แทน ACP โดย ACP ยังคงเป็น
fallback แบบชัดเจนเมื่อผู้ใช้ขอ ACP/acpx หรือกำลังทดสอบ ACP
Codex adapter

รอบการทำงาน Codex native จะคง OpenClaw plugin hooks เป็นชั้นความเข้ากันได้สาธารณะ
สิ่งเหล่านี้คือ hook ของ OpenClaw ภายในโปรเซส ไม่ใช่ hook คำสั่ง `hooks.json` ของ Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` สำหรับรายการ transcript ที่ mirror
- `before_agent_finalize` ผ่านรีเลย์ Codex `Stop`
- `agent_end`

Plugin ยังสามารถลงทะเบียน middleware ผลลัพธ์เครื่องมือที่เป็นกลางต่อ runtime เพื่อเขียนใหม่
ผลลัพธ์เครื่องมือแบบ dynamic ของ OpenClaw หลังจาก OpenClaw รันเครื่องมือและก่อนที่
ผลลัพธ์จะถูกส่งกลับไปยัง Codex สิ่งนี้แยกจาก hook Plugin สาธารณะ
`tool_result_persist` ซึ่งแปลงการเขียนผลลัพธ์เครื่องมือใน transcript ที่ OpenClaw เป็นเจ้าของ

สำหรับความหมายของ hook Plugin เอง ดู [Plugin hooks](/th/plugins/hooks)
และ [พฤติกรรม guard ของ Plugin](/th/tools/plugin)

Harness ปิดเป็นค่าเริ่มต้น คอนฟิกใหม่ควรคง model ref ของ OpenAI
แบบ canonical เป็น `openai/gpt-*` และบังคับอย่างชัดเจนด้วย
`agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` เมื่อ
ต้องการการรันผ่าน app-server แบบ native model ref เดิมแบบ legacy `codex/*` ยังคง auto-select
harness เพื่อความเข้ากันได้ แต่ prefix provider legacy ที่มี runtime รองรับจะ
ไม่แสดงเป็นตัวเลือก model/provider ปกติ

หากเปิดใช้ Plugin `codex` แล้วแต่โมเดลหลักยังเป็น
`openai-codex/*`, `openclaw doctor` จะเตือนแทนการเปลี่ยน route สิ่งนี้เป็น
พฤติกรรมที่ตั้งใจไว้: `openai-codex/*` ยังคงเป็นเส้นทาง PI Codex OAuth/subscription และ
การรันผ่าน app-server แบบ native ยังคงเป็นตัวเลือก runtime ที่ต้องระบุอย่างชัดเจน

## แผนที่ route

ใช้ตารางนี้ก่อนเปลี่ยนคอนฟิก:

| พฤติกรรมที่ต้องการ | Model ref | คอนฟิก runtime | ข้อกำหนดของ Plugin | ป้ายสถานะที่คาดหวัง |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API ผ่าน OpenClaw runner ปกติ | `openai/gpt-*` | ละไว้หรือ `runtime: "pi"` | OpenAI provider | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/subscription ผ่าน PI | `openai-codex/gpt-*` | ละไว้หรือ `runtime: "pi"` | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| รอบการทำงานแบบฝังผ่าน Codex app-server native | `openai/gpt-*` | `agentRuntime.id: "codex"` | Plugin `codex` | `Runtime: OpenAI Codex` |
| Provider ผสมพร้อมโหมด auto แบบระมัดระวัง | ref เฉพาะ provider | `agentRuntime.id: "auto"` | runtime ของ Plugin แบบไม่บังคับ | ขึ้นอยู่กับ runtime ที่เลือก |
| เซสชัน Codex ACP adapter แบบชัดเจน | ขึ้นอยู่กับ prompt/model ของ ACP | `sessions_spawn` พร้อม `runtime: "acp"` | backend `acpx` ที่สมบูรณ์ | สถานะงาน/เซสชัน ACP |

จุดแยกสำคัญคือ provider เทียบกับ runtime:

- `openai-codex/*` ตอบว่า "PI ควรใช้เส้นทาง provider/auth ใด?"
- `agentRuntime.id: "codex"` ตอบว่า "loop ใดควรรันรอบการทำงานแบบฝังนี้?"
- `/codex ...` ตอบว่า "บทสนทนา Codex native ใดที่แชตนี้ควร bind
  หรือควบคุม?"
- ACP ตอบว่า "โปรเซส harness ภายนอกใดที่ acpx ควร launch?"

## เลือก prefix โมเดลให้ถูก

เส้นทางตระกูล OpenAI ขึ้นกับ prefix โดยเฉพาะ ใช้ `openai-codex/*` เมื่อคุณต้องการ
Codex OAuth ผ่าน PI; ใช้ `openai/*` เมื่อคุณต้องการเข้าถึง OpenAI API โดยตรง หรือ
เมื่อคุณกำลังบังคับ Codex app-server harness แบบ native:

| Model ref | เส้นทาง runtime | ใช้เมื่อ |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | OpenAI provider ผ่าน plumbing ของ OpenClaw/PI | คุณต้องการการเข้าถึง OpenAI Platform API โดยตรงปัจจุบันด้วย `OPENAI_API_KEY` |
| `openai-codex/gpt-5.5` | OpenAI Codex OAuth ผ่าน OpenClaw/PI | คุณต้องการ auth แบบ subscription ของ ChatGPT/Codex พร้อม PI runner เริ่มต้น |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness | คุณต้องการการรันผ่าน Codex app-server native สำหรับรอบการทำงานของเอเจนต์แบบฝัง |

GPT-5.5 ปัจจุบันเป็นแบบ subscription/OAuth-only ใน OpenClaw ใช้
`openai-codex/gpt-5.5` สำหรับ PI OAuth หรือ `openai/gpt-5.5` พร้อม Codex
app-server harness การเข้าถึงด้วย API key โดยตรงสำหรับ `openai/gpt-5.5` จะรองรับ
เมื่อ OpenAI เปิดใช้ GPT-5.5 บน public API แล้ว

ref legacy `codex/gpt-*` ยังคงยอมรับเป็น alias เพื่อความเข้ากันได้ การ migration เพื่อความเข้ากันได้ของ Doctor
จะเขียน ref runtime หลักแบบ legacy ใหม่เป็น model ref แบบ canonical
และบันทึกนโยบาย runtime แยกต่างหาก ส่วน ref legacy ที่เป็น fallback-only
จะปล่อยไว้ตามเดิม เพราะ runtime ถูกคอนฟิกสำหรับคอนเทนเนอร์เอเจนต์ทั้งหมด
คอนฟิก PI Codex OAuth ใหม่ควรใช้ `openai-codex/gpt-*`; คอนฟิก native
app-server harness ใหม่ควรใช้ `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"`

`agents.defaults.imageModel` ใช้การแบ่ง prefix แบบเดียวกัน ใช้
`openai-codex/gpt-*` เมื่อการเข้าใจภาพควรรันผ่านเส้นทาง OpenAI
Codex OAuth provider ใช้ `codex/gpt-*` เมื่อการเข้าใจภาพควรรัน
ผ่านรอบการทำงาน Codex app-server แบบมีขอบเขต โมเดล Codex app-server ต้อง
ประกาศรองรับ input ภาพ; โมเดล Codex แบบ text-only จะล้มเหลวก่อนที่ media turn
จะเริ่ม

ใช้ `/status` เพื่อยืนยัน harness ที่มีผลสำหรับเซสชันปัจจุบัน หาก
การเลือกดูน่าแปลกใจ ให้เปิด debug logging สำหรับ subsystem `agents/harness`
และตรวจสอบ record แบบ structured `agent harness selected` ของ gateway ซึ่ง
รวม selected harness id, เหตุผลการเลือก, นโยบาย runtime/fallback และ,
ในโหมด `auto`, ผลการรองรับของ candidate แต่ละตัวจาก Plugin

### ความหมายของคำเตือน doctor

`openclaw doctor` จะเตือนเมื่อสิ่งเหล่านี้เป็นจริงทั้งหมด:

- Plugin `codex` ที่มาพร้อมชุดติดตั้งเปิดใช้หรืออนุญาตอยู่
- โมเดลหลักของเอเจนต์เป็น `openai-codex/*`
- runtime ที่มีผลของเอเจนต์นั้นไม่ใช่ `codex`

คำเตือนนั้นมีอยู่เพราะผู้ใช้มักคาดว่า "เปิดใช้ Codex plugin" จะหมายถึง
"runtime Codex app-server แบบ native" OpenClaw ไม่สรุปเช่นนั้น คำเตือน
หมายความว่า:

- **ไม่จำเป็นต้องเปลี่ยนอะไร** หากคุณตั้งใจใช้ ChatGPT/Codex OAuth ผ่าน PI
- เปลี่ยนโมเดลเป็น `openai/<model>` และตั้งค่า
  `agentRuntime.id: "codex"` หากคุณตั้งใจใช้การรันผ่าน app-server
  แบบ native
- เซสชันที่มีอยู่ยังต้องใช้ `/new` หรือ `/reset` หลังจากเปลี่ยน runtime,
  เพราะ runtime pin ของเซสชันเป็นแบบ sticky

การเลือก harness ไม่ใช่การควบคุมเซสชันแบบ live เมื่อรอบการทำงานแบบฝังรัน
OpenClaw จะบันทึก selected harness id บนเซสชันนั้นและใช้ต่อไปสำหรับ
รอบการทำงานภายหลังใน session id เดียวกัน เปลี่ยนคอนฟิก `agentRuntime` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อคุณต้องการให้เซสชันในอนาคตใช้ harness อื่น;
ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับบทสนทนาที่มีอยู่
ระหว่าง PI และ Codex สิ่งนี้หลีกเลี่ยงการ replay transcript เดียวผ่าน
ระบบเซสชัน native ที่เข้ากันไม่ได้สองระบบ

เซสชัน legacy ที่สร้างก่อนมี harness pin จะถือว่า pin กับ PI แล้วเมื่อ
มีประวัติ transcript ใช้ `/new` หรือ `/reset` เพื่อให้บทสนทนานั้นเลือกเข้าใช้
Codex หลังจากเปลี่ยนคอนฟิก

`/status` แสดง runtime ของโมเดลที่มีผล PI harness เริ่มต้นจะแสดงเป็น
`Runtime: OpenClaw Pi Default` และ Codex app-server harness จะแสดงเป็น
`Runtime: OpenAI Codex`

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` ที่มาพร้อมชุดติดตั้งพร้อมใช้งาน
- Codex app-server `0.125.0` หรือใหม่กว่า Plugin ที่มาพร้อมชุดติดตั้งจัดการ
  binary ของ Codex app-server ที่เข้ากันได้เป็นค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH`
  จึงไม่มีผลต่อการเริ่มต้น harness ปกติ
- มี Codex auth ให้กับโปรเซส app-server หรือให้กับ Codex auth
  bridge ของ OpenClaw การ launch app-server ผ่าน stdio ในเครื่องใช้ Codex home ที่ OpenClaw จัดการสำหรับแต่ละ
  เอเจนต์และ `HOME` ของ child ที่แยกออกมา ดังนั้นโดยค่าเริ่มต้นจึงไม่อ่านบัญชี
  `~/.codex` ส่วนตัวของคุณ, skills, plugins, config, สถานะ thread หรือ native
  `$HOME/.agents/skills`

Plugin จะบล็อก handshake ของ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน สิ่งนั้นช่วยให้
OpenClaw อยู่บนพื้นผิว protocol ที่ผ่านการทดสอบแล้ว

สำหรับการทดสอบ smoke แบบ live และ Docker โดยปกติ auth จะมาจากบัญชี Codex CLI
หรือ auth profile `openai-codex` ของ OpenClaw การ launch app-server ผ่าน stdio ในเครื่องยัง
fallback ไปยัง `CODEX_API_KEY` / `OPENAI_API_KEY` ได้เมื่อไม่มีบัญชีอยู่

## เพิ่ม Codex ควบคู่กับโมเดลอื่นๆ

อย่าตั้งค่า `agentRuntime.id: "codex"` แบบทั่วทั้งระบบ หากเอเจนต์เดียวกันควรสลับได้อย่างอิสระ
ระหว่าง Codex และโมเดลผู้ให้บริการที่ไม่ใช่ Codex รันไทม์ที่บังคับใช้จะมีผลกับทุก
เทิร์นแบบฝังสำหรับเอเจนต์หรือเซสชันนั้น หากคุณเลือกโมเดล Anthropic ขณะที่
รันไทม์นั้นถูกบังคับอยู่ OpenClaw จะยังคงลองใช้ฮาร์เนส Codex และปิดด้วยความล้มเหลว
แทนที่จะส่งเทิร์นนั้นผ่าน PI อย่างเงียบ ๆ

ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้แทน:

- วาง Codex ไว้ในเอเจนต์เฉพาะที่มี `agentRuntime.id: "codex"`
- คงเอเจนต์เริ่มต้นไว้ที่ `agentRuntime.id: "auto"` และใช้ `fallback` ของ PI สำหรับการใช้งานผู้ให้บริการแบบผสมตามปกติ
- ใช้การอ้างอิงแบบเดิม `codex/*` เพื่อความเข้ากันได้เท่านั้น คอนฟิกใหม่ควรเลือกใช้
  `openai/*` พร้อมนโยบายรันไทม์ Codex ที่ระบุชัดเจน

ตัวอย่างเช่น รูปแบบนี้คงเอเจนต์เริ่มต้นไว้กับการเลือกอัตโนมัติตามปกติ และ
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

- เอเจนต์ `main` เริ่มต้นใช้เส้นทางผู้ให้บริการตามปกติและ `fallback` ความเข้ากันได้ของ PI
- เอเจนต์ `codex` ใช้ฮาร์เนส app-server ของ Codex
- หาก Codex ขาดหายหรือไม่รองรับสำหรับเอเจนต์ `codex` เทิร์นจะล้มเหลว
  แทนที่จะใช้ PI อย่างเงียบ ๆ

## การกำหนดเส้นทางคำสั่งของเอเจนต์

เอเจนต์ควรกำหนดเส้นทางคำขอของผู้ใช้ตามเจตนา ไม่ใช่ตามคำว่า "Codex" เพียงอย่างเดียว:

| ผู้ใช้ขอให้...                                         | เอเจนต์ควรใช้...                              |
| -------------------------------------------------------- | ------------------------------------------------ |
| "ผูกแชตนี้กับ Codex"                                | `/codex bind`                                    |
| "ดำเนินการต่อจากเธรด Codex `<id>` ที่นี่"                        | `/codex resume <id>`                             |
| "แสดงเธรด Codex"                                     | `/codex threads`                                 |
| "ส่งรายงานสนับสนุนสำหรับการรัน Codex ที่ผิดพลาด"              | `/diagnostics [note]`                            |
| "ส่งฟีดแบ็ก Codex สำหรับเธรดที่แนบมานี้เท่านั้น"      | `/codex diagnostics [note]`                      |
| "ใช้ Codex เป็นรันไทม์สำหรับเอเจนต์นี้"                | เปลี่ยนคอนฟิกเป็น `agentRuntime.id`               |
| "ใช้การสมัครสมาชิก ChatGPT/Codex ของฉันกับ OpenClaw ปกติ" | การอ้างอิงโมเดล `openai-codex/*`                      |
| "รัน Codex ผ่าน ACP/acpx"                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "เริ่ม Claude Code/Gemini/OpenCode/Cursor ในเธรด"   | ACP/acpx ไม่ใช่ `/codex` และไม่ใช่ซับเอเจนต์เนทีฟ |

OpenClaw จะแสดงคำแนะนำการ spawn ของ ACP ให้เอเจนต์เห็นเฉพาะเมื่อ ACP เปิดใช้งานอยู่
สามารถ dispatch ได้ และมีแบ็กเอนด์รันไทม์ที่โหลดอยู่รองรับ หาก ACP ไม่พร้อมใช้งาน
system prompt และ Skills ของ Plugin ไม่ควรสอนเอเจนต์เกี่ยวกับการกำหนดเส้นทาง
ACP

## การปรับใช้เฉพาะ Codex

บังคับใช้ฮาร์เนส Codex เมื่อคุณต้องพิสูจน์ว่าทุกเทิร์นของเอเจนต์แบบฝัง
ใช้ Codex รันไทม์ Plugin ที่ระบุชัดเจนจะไม่มี `fallback` ไปยัง PI เป็นค่าเริ่มต้น ดังนั้น
`fallback: "none"` จึงเป็นตัวเลือก แต่บ่อยครั้งมีประโยชน์ในฐานะเอกสารกำกับ:

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

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Plugin Codex ถูกปิดใช้งาน
app-server เก่าเกินไป หรือ app-server เริ่มทำงานไม่ได้ ตั้งค่า
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` เฉพาะเมื่อคุณตั้งใจให้ PI จัดการ
การเลือกฮาร์เนสที่ขาดหาย

## Codex ต่อเอเจนต์

คุณสามารถทำให้เอเจนต์หนึ่งเป็นแบบ Codex เท่านั้น ขณะที่เอเจนต์เริ่มต้นยังคงใช้
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

ใช้คำสั่งเซสชันปกติเพื่อสลับเอเจนต์และโมเดล `/new` จะสร้างเซสชัน
OpenClaw ใหม่ และฮาร์เนส Codex จะสร้างหรือดำเนินการต่อจากเธรด app-server
ข้างเคียงตามที่จำเป็น `/reset` จะล้างการผูกเซสชัน OpenClaw สำหรับเธรดนั้น
และให้เทิร์นถัดไปแก้หาฮาร์เนสจากคอนฟิกปัจจุบันอีกครั้ง

## การค้นพบโมเดล

ตามค่าเริ่มต้น Plugin Codex จะถาม app-server หาโมเดลที่พร้อมใช้งาน หาก
การค้นพบล้มเหลวหรือหมดเวลา จะใช้แค็ตตาล็อก fallback ที่รวมมาให้สำหรับ:

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

ปิดใช้งานการค้นพบเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการ probe Codex และยึดกับ
แค็ตตาล็อก fallback:

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

ตามค่าเริ่มต้น Plugin จะเริ่มไบนารี Codex ที่ OpenClaw จัดการไว้ในเครื่องด้วย:

```bash
codex app-server --listen stdio://
```

ไบนารีที่จัดการนี้ถูกประกาศเป็น dependency รันไทม์ของ Plugin ที่รวมมาให้ และถูกจัดเตรียม
พร้อมกับ dependency อื่น ๆ ของ Plugin `codex` วิธีนี้ทำให้เวอร์ชันของ app-server
ผูกกับ Plugin ที่รวมมาให้ แทนที่จะขึ้นกับ Codex CLI แยกต่างหากตัวใดก็ตาม
ที่ติดตั้งอยู่ในเครื่อง ตั้งค่า `appServer.command` เฉพาะเมื่อคุณ
ตั้งใจจะรันไฟล์ปฏิบัติการคนละตัว

ตามค่าเริ่มต้น OpenClaw จะเริ่มเซสชันฮาร์เนส Codex ในเครื่องในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือ posture ของตัวดำเนินการในเครื่องที่เชื่อถือได้ซึ่งใช้
สำหรับ Heartbeat อัตโนมัติ: Codex สามารถใช้เครื่องมือ shell และเครือข่ายได้โดยไม่
หยุดที่ prompt การอนุมัติเนทีฟซึ่งไม่มีใครอยู่ตอบ

หากต้องการเลือกใช้การอนุมัติที่ผ่านการตรวจทานโดย guardian ของ Codex ให้ตั้งค่า `appServer.mode:
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

โหมด Guardian ใช้เส้นทางการอนุมัติแบบตรวจทานอัตโนมัติเนทีฟของ Codex เมื่อ Codex ขอ
ออกจาก sandbox เขียนนอก workspace หรือเพิ่มสิทธิ์ เช่น การเข้าถึงเครือข่าย
Codex จะส่งคำขออนุมัตินั้นไปยัง reviewer เนทีฟแทน prompt มนุษย์
reviewer จะใช้กรอบความเสี่ยงของ Codex และอนุมัติหรือปฏิเสธ
คำขอเฉพาะนั้น ใช้ Guardian เมื่อคุณต้องการ guardrail มากกว่าโหมด YOLO
แต่ยังต้องการให้เอเจนต์ที่ไม่มีคนเฝ้าทำงานต่อได้

preset `guardian` ขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"`
ฟิลด์นโยบายแต่ละรายการยังคง override `mode` ได้ ดังนั้นการปรับใช้ขั้นสูงจึงสามารถผสม
preset กับตัวเลือกที่ระบุชัดเจนได้ ค่า reviewer เดิม `guardian_subagent`
ยังคงยอมรับเป็น alias เพื่อความเข้ากันได้ แต่คอนฟิกใหม่ควรใช้
`auto_review`

สำหรับ app-server ที่กำลังทำงานอยู่แล้ว ให้ใช้การขนส่ง WebSocket:

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

การเปิด app-server แบบ Stdio จะสืบทอดสภาพแวดล้อมของ process ของ OpenClaw ตามค่าเริ่มต้น
แต่ OpenClaw เป็นเจ้าของสะพานบัญชี app-server ของ Codex และตั้งค่าทั้ง
`CODEX_HOME` และ `HOME` เป็นไดเรกทอรีต่อเอเจนต์ภายใต้สถานะ OpenClaw
ของเอเจนต์นั้น ตัวโหลด Skills ของ Codex เองอ่าน `$CODEX_HOME/skills` และ
`$HOME/.agents/skills` ดังนั้นทั้งสองค่าจึงถูกแยกสำหรับการเปิด app-server
ในเครื่อง วิธีนี้ทำให้ Skills เนทีฟของ Codex, plugins, คอนฟิก, บัญชี และสถานะเธรด
ถูกจำกัดขอบเขตไว้กับเอเจนต์ OpenClaw แทนที่จะรั่วเข้ามาจาก home ของ Codex CLI
ส่วนตัวของตัวดำเนินการ

Plugins ของ OpenClaw และ snapshot Skills ของ OpenClaw ยังคงไหลผ่าน
รีจิสทรี Plugin และตัวโหลด Skills ของ OpenClaw เอง แอสเซต Codex CLI ส่วนตัวไม่เป็นเช่นนั้น หากคุณมี
Skills หรือ plugins ของ Codex CLI ที่มีประโยชน์และควรกลายเป็นส่วนหนึ่งของเอเจนต์ OpenClaw
ให้ทำ inventory อย่างชัดเจน:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

ผู้ให้บริการการย้าย Codex จะคัดลอก Skills ไปยัง workspace ของเอเจนต์ OpenClaw ปัจจุบัน
plugins เนทีฟของ Codex, hooks และไฟล์คอนฟิกจะถูกรายงานหรือเก็บถาวร
เพื่อให้ตรวจทานด้วยตนเองแทนที่จะเปิดใช้งานโดยอัตโนมัติ เพราะสิ่งเหล่านั้นสามารถ
รันคำสั่ง เปิดเผยเซิร์ฟเวอร์ MCP หรือพก credentials ได้

Auth ถูกเลือกตามลำดับนี้:

1. โปรไฟล์ auth Codex ของ OpenClaw ที่ระบุชัดเจนสำหรับเอเจนต์
2. บัญชีเดิมของ app-server ใน home ของ Codex ของเอเจนต์นั้น
3. สำหรับการเปิด app-server แบบ stdio ในเครื่องเท่านั้น `CODEX_API_KEY` แล้วตามด้วย
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server และยังจำเป็นต้องใช้ auth ของ OpenAI

เมื่อ OpenClaw เห็นโปรไฟล์ auth ของ Codex แบบการสมัครสมาชิก ChatGPT จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจาก process ลูก Codex ที่ spawn ขึ้นมา วิธีนี้
ทำให้คีย์ API ระดับ Gateway ยังคงพร้อมใช้งานสำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้เทิร์น app-server เนทีฟของ Codex ถูกคิดเงินผ่าน API โดยไม่ตั้งใจ
โปรไฟล์ API-key ของ Codex ที่ระบุชัดเจนและ fallback env-key ของ stdio ในเครื่องใช้การเข้าสู่ระบบ
app-server แทน env ที่ process ลูกสืบทอดมา การเชื่อมต่อ app-server แบบ WebSocket
จะไม่ได้รับ fallback ของคีย์ API จาก env ของ Gateway ให้ใช้โปรไฟล์ auth ที่ระบุชัดเจนหรือ
บัญชีของ app-server ระยะไกลเอง

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

`appServer.clearEnv` มีผลเฉพาะกับ process ลูก app-server ของ Codex ที่ spawn ขึ้นมาเท่านั้น

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์               | ค่าเริ่มต้น                                  | ความหมาย                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` จะ spawn Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                             |
| `command`           | ไบนารี Codex ที่จัดการให้                     | ไฟล์ปฏิบัติการสำหรับ stdio transport เว้นว่างไว้เพื่อใช้ไบนารีที่จัดการให้; ตั้งค่าเฉพาะเมื่อต้องการ override อย่างชัดเจน                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | อาร์กิวเมนต์สำหรับ stdio transport                                                                                                                                                                                                       |
| `url`               | ไม่ได้ตั้งค่า                                    | URL ของ WebSocket app-server                                                                                                                                                                                                            |
| `authToken`         | ไม่ได้ตั้งค่า                                    | Bearer token สำหรับ WebSocket transport                                                                                                                                                                                                |
| `headers`           | `{}`                                     | header เพิ่มเติมของ WebSocket                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากกระบวนการ stdio app-server ที่ spawn หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว `CODEX_HOME` และ `HOME` ถูกสงวนไว้สำหรับการแยก Codex ต่อ agent ของ OpenClaw ในการเปิดใช้งานแบบ local |
| `requestTimeoutMs`  | `60000`                                  | ระยะหมดเวลาสำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | preset สำหรับการดำเนินการแบบ YOLO หรือแบบ guardian-reviewed                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | นโยบายการอนุมัติ native ของ Codex ที่ส่งไปยัง thread start/resume/turn                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | โหมด sandbox native ของ Codex ที่ส่งไปยัง thread start/resume                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจสอบ prompt การอนุมัติ native `guardian_subagent` ยังคงเป็น alias แบบ legacy                                                                                                                         |
| `serviceTier`       | ไม่ได้ตั้งค่า                                    | service tier ของ Codex app-server แบบไม่บังคับ: `"fast"`, `"flex"` หรือ `null` ค่า legacy ที่ไม่ถูกต้องจะถูกละเว้น                                                                                                                            |

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของจะถูกจำกัดแยกจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` แต่ละรายการต้องได้รับ
การตอบกลับจาก OpenClaw ภายใน 30 วินาที เมื่อหมดเวลา OpenClaw จะ abort สัญญาณ
เครื่องมือเมื่อรองรับ และส่งการตอบกลับ dynamic-tool ที่ล้มเหลวกลับไปยัง Codex เพื่อให้
turn ดำเนินต่อไปได้แทนที่จะปล่อยให้ session ค้างอยู่ในสถานะ `processing`

หลังจาก OpenClaw ตอบกลับคำขอ app-server ของ Codex ที่มีขอบเขตตาม turn แล้ว harness
ยังคาดว่า Codex จะจบ native turn ด้วย `turn/completed` ด้วย หาก
app-server เงียบไปเป็นเวลา 60 วินาทีหลังจากการตอบกลับนั้น OpenClaw จะพยายาม
interrupt turn ของ Codex แบบ best-effort, บันทึก diagnostic timeout และปล่อย
lane ของ session OpenClaw เพื่อไม่ให้ข้อความแชทติดตามผลถูกต่อคิวอยู่หลัง
native turn ที่ค้างเก่า

Environment override ยังคงพร้อมใช้งานสำหรับการทดสอบแบบ local:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้ามไบนารีที่จัดการให้เมื่อ
`appServer.command` ไม่ได้ตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบแบบ local เฉพาะครั้งเดียว Config
เป็นตัวเลือกที่แนะนำสำหรับ deployment ที่ทำซ้ำได้ เพราะทำให้พฤติกรรมของ Plugin อยู่ใน
ไฟล์ที่ผ่านการ review เดียวกับการตั้งค่า Codex harness ส่วนที่เหลือ

## การใช้คอมพิวเตอร์

การใช้คอมพิวเตอร์มีคู่มือการตั้งค่าของตัวเอง:
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use)

เวอร์ชันสั้นคือ: OpenClaw ไม่ได้ vendor แอปควบคุม desktop หรือดำเนินการ
กับ desktop เอง แต่จะเตรียม Codex app-server, ตรวจสอบว่า
MCP server `computer-use` พร้อมใช้งาน แล้วปล่อยให้ Codex จัดการการเรียก
เครื่องมือ MCP native ระหว่าง turn ในโหมด Codex

สำหรับการเข้าถึง driver ของ TryCua โดยตรงนอก flow ของ Codex marketplace ให้ลงทะเบียน
`cua-driver mcp` ด้วย `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`
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

สามารถตรวจสอบหรือติดตั้งการตั้งค่าได้จาก command surface:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

การใช้คอมพิวเตอร์เฉพาะสำหรับ macOS และอาจต้องใช้สิทธิ์ของ OS แบบ local ก่อนที่
Codex MCP server จะควบคุมแอปได้ หาก `computerUse.enabled` เป็น true และ MCP
server ไม่พร้อมใช้งาน turn ในโหมด Codex จะล้มเหลวก่อนเริ่ม thread แทนที่จะ
ทำงานต่ออย่างเงียบ ๆ โดยไม่มีเครื่องมือ Computer Use native ดู
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use) สำหรับตัวเลือก marketplace,
ขีดจำกัดของ remote catalog, เหตุผลของสถานะ และการแก้ไขปัญหา

เมื่อ `computerUse.autoInstall` เป็น true, OpenClaw สามารถลงทะเบียน
Codex Desktop marketplace มาตรฐานที่ bundled มาจาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ได้ หาก Codex
ยังไม่พบ marketplace แบบ local ใช้ `/new` หรือ `/reset` หลังจาก
เปลี่ยน runtime หรือ config ของ Computer Use เพื่อไม่ให้ session เดิมเก็บ
การผูก PI หรือ thread ของ Codex เก่าไว้

## สูตรที่ใช้บ่อย

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

Remote app-server พร้อม header ที่ระบุชัดเจน:

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
กับ thread ของ Codex ที่มีอยู่ turn ถัดไปจะส่งโมเดล OpenAI, provider,
นโยบายการอนุมัติ, sandbox และ service tier ที่เลือกอยู่ในขณะนั้นไปยัง
app-server อีกครั้ง การสลับจาก `openai/gpt-5.5` เป็น `openai/gpt-5.2` จะคง
การผูก thread ไว้ แต่ขอให้ Codex ดำเนินการต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

Plugin ที่ bundled มาจะลงทะเบียน `/codex` เป็น slash command ที่ได้รับอนุญาต คำสั่งนี้
เป็นแบบทั่วไปและใช้งานได้กับทุกช่องทางที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` แสดงการเชื่อมต่อ app-server แบบ live, โมเดล, บัญชี, rate limit, MCP server และ skills
- `/codex models` แสดงรายการโมเดลของ Codex app-server แบบ live
- `/codex threads [filter]` แสดงรายการ thread ของ Codex ล่าสุด
- `/codex resume <thread-id>` แนบ session OpenClaw ปัจจุบันเข้ากับ thread ของ Codex ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server compact thread ที่แนบอยู่
- `/codex review` เริ่ม review native ของ Codex สำหรับ thread ที่แนบอยู่
- `/codex diagnostics [note]` ขออนุญาตก่อนส่ง feedback diagnostics ของ Codex สำหรับ thread ที่แนบอยู่
- `/codex computer-use status` ตรวจสอบ Plugin การใช้คอมพิวเตอร์และ MCP server ที่กำหนดค่าไว้
- `/codex computer-use install` ติดตั้ง Plugin การใช้คอมพิวเตอร์ที่กำหนดค่าไว้และ reload MCP server
- `/codex account` แสดงสถานะบัญชีและ rate-limit
- `/codex mcp` แสดงรายการสถานะ MCP server ของ Codex app-server
- `/codex skills` แสดงรายการ skills ของ Codex app-server

### workflow การ debug ที่ใช้บ่อย

เมื่อ agent ที่ใช้ Codex ทำสิ่งที่ไม่คาดคิดใน Telegram, Discord, Slack,
หรือช่องทางอื่น ให้เริ่มจากบทสนทนาที่เกิดปัญหา:

1. รัน `/diagnostics bad tool choice after image upload` หรือ note สั้น ๆ อื่น
   ที่อธิบายสิ่งที่คุณเห็น
2. อนุมัติคำขอ diagnostics หนึ่งครั้ง การอนุมัติจะสร้าง zip diagnostics ของ Gateway
   แบบ local และเนื่องจาก session ใช้ Codex harness อยู่ จึงจะ
   ส่ง Codex feedback bundle ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ของ OpenAI ด้วย
3. คัดลอกการตอบกลับ diagnostics ที่เสร็จแล้วไปยังรายงาน bug หรือ thread support
   โดยจะมี path ของ bundle แบบ local, สรุปความเป็นส่วนตัว, session id ของ OpenClaw,
   thread id ของ Codex และบรรทัด `Inspect locally` สำหรับแต่ละ thread ของ Codex
4. หากคุณต้องการ debug การรันด้วยตัวเอง ให้รันคำสั่ง `Inspect locally`
   ที่พิมพ์ไว้ใน terminal คำสั่งจะมีหน้าตาเช่น `codex resume <thread-id>` และเปิด
   thread native ของ Codex เพื่อให้คุณตรวจสอบบทสนทนา, ดำเนินการต่อแบบ local,
   หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือแผนนั้น

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลดฟีดแบ็ก Codex
สำหรับเธรดที่แนบอยู่ในปัจจุบันโดยเฉพาะ โดยไม่รวมชุดข้อมูลวินิจฉัย OpenClaw
Gateway แบบเต็ม สำหรับรายงานสนับสนุนส่วนใหญ่ `/diagnostics [note]` เป็นจุดเริ่มต้นที่ดีกว่า
เพราะผูกสถานะ Gateway ในเครื่องและรหัสเธรด Codex เข้าด้วยกันในคำตอบเดียว ดู [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics)
สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรมในแชตกลุ่มแบบเต็ม

แกนหลักของ OpenClaw ยังเปิดให้ใช้ `/diagnostics [note]` เฉพาะเจ้าของเท่านั้น เป็นคำสั่งข้อมูลวินิจฉัย
Gateway ทั่วไป พรอมป์ขออนุมัติจะแสดงคำนำเรื่องข้อมูลละเอียดอ่อน
ลิงก์ไปยัง [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics) และขอเรียกใช้
`openclaw gateway diagnostics export --json` ผ่านการอนุมัติ exec อย่างชัดเจน
ทุกครั้ง อย่าอนุมัติข้อมูลวินิจฉัยด้วยกฎ allow-all หลังอนุมัติแล้ว
OpenClaw จะส่งรายงานที่วางได้ พร้อมพาธชุดข้อมูลในเครื่องและสรุป manifest
เมื่อเซสชัน OpenClaw ที่ใช้งานอยู่กำลังใช้ฮาร์เนส Codex การอนุมัติเดียวกันนั้น
ยังอนุญาตให้ส่งชุดฟีดแบ็ก Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
พรอมป์ขออนุมัติจะแจ้งว่าฟีดแบ็ก Codex จะถูกส่ง แต่ไม่ได้แสดงรหัสเซสชันหรือเธรด Codex ก่อนอนุมัติ

หาก `/diagnostics` ถูกเรียกโดยเจ้าของในแชตกลุ่ม OpenClaw จะรักษาช่องทางที่ใช้ร่วมกันให้สะอาด:
กลุ่มจะได้รับเพียงประกาศสั้น ๆ ขณะที่คำนำข้อมูลวินิจฉัย พรอมป์ขออนุมัติ
และรหัสเซสชัน/เธรด Codex จะถูกส่งให้เจ้าของผ่านเส้นทางอนุมัติส่วนตัว
หากไม่มีเส้นทางเจ้าของส่วนตัว OpenClaw จะปฏิเสธคำขอจากกลุ่มและขอให้เจ้าของเรียกใช้จากแชตส่วนตัว

การอัปโหลด Codex ที่ได้รับอนุมัติจะเรียก Codex app-server `feedback/upload` และขอให้
app-server รวมบันทึกสำหรับแต่ละเธรดที่ระบุและเธรดย่อย Codex ที่ถูกสร้างขึ้น
เมื่อมีให้ใช้ การอัปโหลดจะผ่านเส้นทางฟีดแบ็กปกติของ Codex ไปยังเซิร์ฟเวอร์ OpenAI;
หากฟีดแบ็ก Codex ถูกปิดใช้งานใน app-server นั้น คำสั่งจะคืนข้อผิดพลาดจาก
app-server คำตอบข้อมูลวินิจฉัยที่เสร็จสมบูรณ์จะแสดงรายการช่องทาง
รหัสเซสชัน OpenClaw รหัสเธรด Codex และคำสั่ง `codex resume <thread-id>`
ในเครื่องสำหรับเธรดที่ถูกส่ง หากคุณปฏิเสธหรือเพิกเฉยต่อการอนุมัติ
OpenClaw จะไม่พิมพ์รหัส Codex เหล่านั้น การอัปโหลดนี้ไม่ได้แทนที่การส่งออกข้อมูลวินิจฉัย
Gateway ในเครื่อง

`/codex resume` เขียนไฟล์ผูก sidecar เดียวกับที่ฮาร์เนสใช้สำหรับ
รอบปกติ ในข้อความถัดไป OpenClaw จะกลับไปทำงานต่อที่เธรด Codex นั้น ส่งโมเดล OpenClaw
ที่เลือกอยู่ในปัจจุบันเข้าไปยัง app-server และคงการเปิดใช้ประวัติแบบขยายไว้

### ตรวจสอบเธรด Codex จาก CLI

วิธีที่เร็วที่สุดในการทำความเข้าใจการรัน Codex ที่มีปัญหามักเป็นการเปิดเธรด Codex
ดั้งเดิมโดยตรง:

```sh
codex resume <thread-id>
```

ใช้สิ่งนี้เมื่อคุณสังเกตเห็นบั๊กในการสนทนาของช่องทาง และต้องการตรวจสอบเซสชัน Codex
ที่มีปัญหา ทำงานต่อในเครื่อง หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือเหตุผล
บางอย่าง เส้นทางที่ง่ายที่สุดมักเป็นการเรียกใช้ `/diagnostics [note]` ก่อน:
หลังคุณอนุมัติแล้ว รายงานที่เสร็จสมบูรณ์จะแสดงรายการแต่ละเธรด Codex
และพิมพ์คำสั่ง `Inspect locally` เช่น `codex resume <thread-id>` คุณสามารถคัดลอกคำสั่งนั้นไปยังเทอร์มินัลได้โดยตรง

คุณยังสามารถรับรหัสเธรดจาก `/codex binding` สำหรับแชตปัจจุบัน หรือ
`/codex threads [filter]` สำหรับเธรด Codex app-server ล่าสุด แล้วเรียกใช้คำสั่ง
`codex resume` เดียวกันในเชลล์ของคุณ

พื้นผิวคำสั่งต้องใช้ Codex app-server `0.125.0` หรือใหม่กว่า เมธอดควบคุมแต่ละรายการ
จะถูกรายงานเป็น `unsupported by this Codex app-server` หาก app-server ในอนาคตหรือแบบกำหนดเอง
ไม่ได้เปิดเผยเมธอด JSON-RPC นั้น

## ขอบเขตของฮุก

ฮาร์เนส Codex มีเลเยอร์ฮุกสามชั้น:

| เลเยอร์                                 | เจ้าของ                    | วัตถุประสงค์                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| ฮุกของ OpenClaw Plugin                 | OpenClaw                 | ความเข้ากันได้ของผลิตภัณฑ์/Plugin ระหว่างฮาร์เนส PI และ Codex         |
| มิดเดิลแวร์ส่วนขยายของ Codex app-server | Plugin ที่มาพร้อม OpenClaw | พฤติกรรมอะแดปเตอร์ต่อรอบรอบเครื่องมือไดนามิกของ OpenClaw            |
| ฮุกดั้งเดิมของ Codex                    | Codex                    | วงจรชีวิตระดับต่ำของ Codex และนโยบายเครื่องมือดั้งเดิมจากการกำหนดค่า Codex |

OpenClaw ไม่ใช้ไฟล์ `hooks.json` ระดับโปรเจกต์หรือระดับ global ของ Codex เพื่อกำหนดเส้นทาง
พฤติกรรม OpenClaw Plugin สำหรับสะพานเครื่องมือดั้งเดิมและสิทธิ์ที่รองรับ
OpenClaw จะฉีดการกำหนดค่า Codex ต่อเธรดสำหรับ `PreToolUse`, `PostToolUse`,
`PermissionRequest` และ `Stop` ฮุก Codex อื่น ๆ เช่น `SessionStart` และ
`UserPromptSubmit` ยังคงเป็นการควบคุมระดับ Codex; สิ่งเหล่านี้ไม่ได้ถูกเปิดเผยเป็น
ฮุกของ OpenClaw Plugin ในสัญญา v1

สำหรับเครื่องมือไดนามิกของ OpenClaw OpenClaw จะเรียกใช้เครื่องมือหลังจาก Codex ขอให้
เรียก ดังนั้น OpenClaw จึงยิงพฤติกรรม Plugin และมิดเดิลแวร์ที่ตนเป็นเจ้าของใน
อะแดปเตอร์ฮาร์เนส สำหรับเครื่องมือดั้งเดิมของ Codex Codex เป็นเจ้าของระเบียนเครื่องมือมาตรฐาน
OpenClaw สามารถสะท้อนเหตุการณ์ที่เลือกได้ แต่ไม่สามารถเขียนเธรด Codex ดั้งเดิมใหม่
เว้นแต่ Codex จะเปิดเผยการดำเนินการนั้นผ่าน app-server หรือ callback ของฮุกดั้งเดิม

การฉายภาพ Compaction และวงจรชีวิต LLM มาจากการแจ้งเตือนของ Codex app-server
และสถานะอะแดปเตอร์ OpenClaw ไม่ใช่คำสั่งฮุกดั้งเดิมของ Codex
เหตุการณ์ `before_compaction`, `after_compaction`, `llm_input` และ
`llm_output` ของ OpenClaw เป็นการสังเกตระดับอะแดปเตอร์ ไม่ใช่การจับข้อมูลแบบไบต์ต่อไบต์
ของคำขอภายในหรือ payload Compaction ของ Codex

การแจ้งเตือน app-server `hook/started` และ `hook/completed` ดั้งเดิมของ Codex
จะถูกฉายเป็นเหตุการณ์เอเจนต์ `codex_app_server.hook` สำหรับ trajectory และการดีบัก
การแจ้งเตือนเหล่านี้ไม่ได้เรียกฮุกของ OpenClaw Plugin

## สัญญาการรองรับ V1

โหมด Codex ไม่ใช่ PI ที่มีการเรียกโมเดลอื่นอยู่เบื้องล่าง Codex เป็นเจ้าของลูปโมเดลดั้งเดิม
มากกว่า และ OpenClaw ปรับพื้นผิว Plugin และเซสชันของตนรอบขอบเขตนั้น

รองรับในรันไทม์ Codex v1:

| พื้นผิว                                       | การรองรับ                                 | เหตุผล                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ลูปโมเดล OpenAI ผ่าน Codex               | รองรับ                               | Codex app-server เป็นเจ้าของรอบ OpenAI การกลับไปทำงานต่อของเธรดดั้งเดิม และการทำงานต่อของเครื่องมือดั้งเดิม                                                                                                            |
| การกำหนดเส้นทางและการส่งมอบช่องทาง OpenClaw         | รองรับ                               | Telegram, Discord, Slack, WhatsApp, iMessage และช่องทางอื่น ๆ ยังคงอยู่นอกรันไทม์โมเดล                                                                                                      |
| เครื่องมือไดนามิกของ OpenClaw                        | รองรับ                               | Codex ขอให้ OpenClaw เรียกใช้เครื่องมือเหล่านี้ ดังนั้น OpenClaw จึงยังอยู่ในเส้นทางการดำเนินการ                                                                                                                  |
| Plugin พรอมป์และบริบท                    | รองรับ                               | OpenClaw สร้าง prompt overlay และฉายบริบทเข้าไปในรอบ Codex ก่อนเริ่มหรือกลับไปทำงานต่อที่เธรด                                                                                      |
| วงจรชีวิต context engine                      | รองรับ                               | การประกอบ การนำเข้า หรือการบำรุงรักษาหลังรอบ และการประสาน Compaction ของ context engine จะทำงานสำหรับรอบ Codex                                                                                           |
| ฮุกเครื่องมือไดนามิก                            | รองรับ                               | `before_tool_call`, `after_tool_call` และมิดเดิลแวร์ผลลัพธ์เครื่องมือทำงานรอบเครื่องมือไดนามิกที่ OpenClaw เป็นเจ้าของ                                                                                            |
| ฮุกวงจรชีวิต                               | รองรับในฐานะการสังเกตของอะแดปเตอร์       | `llm_input`, `llm_output`, `agent_end`, `before_compaction` และ `after_compaction` ยิงพร้อม payload โหมด Codex ที่ตรงตามจริง                                                                             |
| เกตการแก้ไขคำตอบสุดท้าย                    | รองรับผ่านตัวส่งต่อฮุกดั้งเดิม | Codex `Stop` ถูกส่งต่อไปยัง `before_agent_finalize`; `revise` ขอให้ Codex ทำรอบโมเดลอีกหนึ่งครั้งก่อนสรุปผล                                                                                  |
| การบล็อกหรือสังเกต shell, patch และ MCP ดั้งเดิม | รองรับผ่านตัวส่งต่อฮุกดั้งเดิม | Codex `PreToolUse` และ `PostToolUse` ถูกส่งต่อสำหรับพื้นผิวเครื่องมือดั้งเดิมที่ยืนยันแล้ว รวมถึง payload MCP บน Codex app-server `0.125.0` หรือใหม่กว่า รองรับการบล็อก แต่ไม่รองรับการเขียนอาร์กิวเมนต์ใหม่ |
| นโยบายสิทธิ์ดั้งเดิม                      | รองรับผ่านตัวส่งต่อฮุกดั้งเดิม | Codex `PermissionRequest` สามารถถูกกำหนดเส้นทางผ่านนโยบาย OpenClaw ในที่ที่รันไทม์เปิดเผย หาก OpenClaw ไม่คืนการตัดสินใจ Codex จะทำงานต่อผ่าน guardian ปกติหรือเส้นทางอนุมัติของผู้ใช้     |
| การจับ trajectory ของ app-server                 | รองรับ                               | OpenClaw บันทึกคำขอที่ส่งไปยัง app-server และการแจ้งเตือนจาก app-server ที่ได้รับ                                                                                                      |

ไม่รองรับในรันไทม์ Codex v1:

| พื้นผิว                                             | ขอบเขต V1                                                                                                                                     | เส้นทางในอนาคต                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| การเปลี่ยนแปลงอาร์กิวเมนต์ของเครื่องมือเนทีฟ                       | hooks ก่อนใช้เครื่องมือเนทีฟของ Codex สามารถบล็อกได้ แต่ OpenClaw ไม่เขียนอาร์กิวเมนต์เครื่องมือเนทีฟของ Codex ใหม่                                               | ต้องมีการรองรับ hook/schema ของ Codex สำหรับอินพุตเครื่องมือทดแทน                            |
| ประวัติทรานสคริปต์เนทีฟของ Codex ที่แก้ไขได้            | Codex เป็นเจ้าของประวัติเธรดเนทีฟตามบัญญัติ OpenClaw เป็นเจ้าของสำเนาสะท้อนและสามารถฉายบริบทในอนาคตได้ แต่ไม่ควรเปลี่ยนแปลง internals ที่ไม่รองรับ | เพิ่ม API ของ app-server ของ Codex อย่างชัดเจนหากจำเป็นต้องผ่าตัดเธรดเนทีฟ                    |
| `tool_result_persist` สำหรับระเบียนเครื่องมือเนทีฟของ Codex | hook นั้นแปลงการเขียนทรานสคริปต์ที่ OpenClaw เป็นเจ้าของ ไม่ใช่ระเบียนเครื่องมือเนทีฟของ Codex                                                           | อาจสะท้อนระเบียนที่แปลงแล้วได้ แต่การเขียนใหม่ตามบัญญัติต้องมีการรองรับจาก Codex              |
| เมทาดาทา compaction เนทีฟแบบสมบูรณ์                     | OpenClaw สังเกตการเริ่มและเสร็จสิ้นของ compaction แต่ไม่ได้รับรายการ kept/dropped ที่เสถียร token delta หรือ payload สรุป            | ต้องมีเหตุการณ์ compaction ของ Codex ที่สมบูรณ์กว่า                                                     |
| การแทรกแซง compaction                             | hooks compaction ของ OpenClaw ปัจจุบันอยู่ในระดับการแจ้งเตือนในโหมด Codex                                                                         | เพิ่ม hooks ก่อน/หลัง compaction ของ Codex หาก plugins ต้อง veto หรือเขียน compaction เนทีฟใหม่ |
| การจับคำขอ API โมเดลแบบ byte-for-byte             | OpenClaw สามารถจับคำขอและการแจ้งเตือนของ app-server ได้ แต่แกน Codex สร้างคำขอ OpenAI API ขั้นสุดท้ายภายใน                      | ต้องมีเหตุการณ์ tracing คำขอโมเดลของ Codex หรือ debug API                                   |

## เครื่องมือ สื่อ และ compaction

harness ของ Codex เปลี่ยนเฉพาะตัวดำเนินการ agent แบบฝังตัวระดับต่ำเท่านั้น

OpenClaw ยังคงสร้างรายการเครื่องมือและรับผลลัพธ์เครื่องมือแบบไดนามิกจาก
harness ข้อความ รูปภาพ วิดีโอ เพลง TTS การอนุมัติ และเอาต์พุตเครื่องมือส่งข้อความ
ยังคงผ่านเส้นทางการส่งมอบปกติของ OpenClaw

relay hook เนทีฟถูกตั้งใจให้เป็นแบบทั่วไป แต่สัญญาการรองรับ v1
จำกัดอยู่ที่เส้นทางเครื่องมือเนทีฟของ Codex และ permission ที่ OpenClaw ทดสอบ ใน
runtime ของ Codex นั่นรวมถึง shell, patch และ payload ของ MCP `PreToolUse`,
`PostToolUse` และ `PermissionRequest` อย่าสันนิษฐานว่าเหตุการณ์ hook ของ Codex
ในอนาคตทุกอย่างเป็นพื้นผิว Plugin ของ OpenClaw จนกว่า runtime contract จะระบุชื่อไว้

สำหรับ `PermissionRequest` OpenClaw จะส่งคืนการตัดสินใจ allow หรือ deny อย่างชัดเจน
เมื่อ policy ตัดสินเท่านั้น ผลลัพธ์ที่ไม่มีการตัดสินใจไม่ใช่การ allow Codex ถือว่านั่นคือไม่มี
การตัดสินใจจาก hook และปล่อยต่อไปยัง guardian ของตัวเองหรือเส้นทางการอนุมัติจากผู้ใช้

การร้องขอการอนุมัติเครื่องมือ Codex MCP จะถูกส่งผ่าน flow การอนุมัติของ Plugin
ของ OpenClaw เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"` prompts ของ Codex `request_user_input` จะถูกส่งกลับไปยัง
แชทต้นทาง และข้อความ follow-up ถัดไปในคิวจะตอบคำขอ server เนทีฟนั้น
แทนที่จะถูกชี้นำเป็นบริบทเพิ่มเติม คำขอ elicitation ของ MCP อื่นๆ ยังคง fail closed

การชี้นำคิว active-run map กับ Codex app-server `turn/steer` ด้วยค่าเริ่มต้น
`messages.queue.mode: "steer"` OpenClaw จะ batch ข้อความแชทในคิว
ตามช่วง quiet window ที่กำหนดค่าไว้ แล้วส่งเป็นคำขอ `turn/steer` เดียว
ตามลำดับการมาถึง โหมด `queue` แบบเดิมส่งคำขอ `turn/steer` แยกกัน การ review
ของ Codex และเทิร์น compaction แบบ manual อาจปฏิเสธการชี้นำ same-turn ซึ่งในกรณีนั้น
OpenClaw จะใช้คิว followup เมื่อโหมดที่เลือกอนุญาต fallback ดู
[คิวการชี้นำ](/th/concepts/queue-steering)

เมื่อโมเดลที่เลือกใช้ harness ของ Codex การ compaction เธรดเนทีฟจะถูก
มอบหมายให้ Codex app-server OpenClaw เก็บสำเนาสะท้อนทรานสคริปต์ไว้สำหรับประวัติ
channel, การค้นหา, `/new`, `/reset` และการสลับโมเดลหรือ harness ในอนาคต
สำเนาสะท้อนรวมถึง prompt ของผู้ใช้ ข้อความ assistant ขั้นสุดท้าย และระเบียน
reasoning หรือ plan ของ Codex แบบเบาเมื่อ app-server ส่งออกมา ในปัจจุบัน OpenClaw
บันทึกเฉพาะสัญญาณเริ่มและเสร็จสิ้น compaction เนทีฟ ยังไม่เปิดเผย
สรุป compaction ที่มนุษย์อ่านได้หรือรายการที่ตรวจสอบได้ว่า Codex
เก็บรายการใดไว้หลัง compaction

เนื่องจาก Codex เป็นเจ้าของเธรดเนทีฟตามบัญญัติ `tool_result_persist` จึงยังไม่
เขียนระเบียนผลลัพธ์เครื่องมือเนทีฟของ Codex ใหม่ในปัจจุบัน มันใช้เฉพาะเมื่อ
OpenClaw กำลังเขียนผลลัพธ์เครื่องมือของทรานสคริปต์เซสชันที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่ต้องใช้ PI รูปภาพ วิดีโอ เพลง PDF TTS และการทำความเข้าใจสื่อ
ยังคงใช้การตั้งค่า provider/model ที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็น provider ปกติของ `/model`:** นั่นเป็นสิ่งที่คาดไว้สำหรับ
configs ใหม่ เลือกโมเดล `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"` (หรือ ref เดิม `codex/*`) เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ไม่ได้ exclude
`codex`

**OpenClaw ใช้ PI แทน Codex:** `agentRuntime.id: "auto"` ยังสามารถใช้ PI เป็น
backend ความเข้ากันได้เมื่อไม่มี harness ของ Codex ใด claim การ run ตั้งค่า
`agentRuntime.id: "codex"` เพื่อบังคับเลือก Codex ระหว่างทดสอบ runtime ของ Codex
ที่ถูกบังคับตอนนี้จะ fail แทนที่จะ fallback ไปยัง PI เว้นแต่คุณจะตั้งค่า
`agentRuntime.fallback: "pi"` อย่างชัดเจน เมื่อเลือก Codex app-server แล้ว
ความล้มเหลวของมันจะแสดงโดยตรงโดยไม่มี config fallback เพิ่มเติม

**app-server ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้ handshake ของ app-server
รายงานเวอร์ชัน `0.125.0` หรือใหม่กว่า prereleases เวอร์ชันเดียวกันหรือเวอร์ชันที่มี suffix build
เช่น `0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ
protocol floor ของ stable `0.125.0` คือสิ่งที่ OpenClaw ทดสอบ

**การค้นหาโมเดลช้า:** ลดค่า `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิดการค้นหา

**การขนส่ง WebSocket fail ทันที:** ตรวจสอบ `appServer.url`, `authToken`
และว่า app-server ระยะไกลพูดเวอร์ชัน protocol ของ Codex app-server เดียวกัน

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นั่นเป็นสิ่งที่คาดไว้ เว้นแต่คุณจะบังคับ
`agentRuntime.id: "codex"` สำหรับ agent นั้นหรือเลือก ref เดิม
`codex/*` refs `openai/gpt-*` แบบ plain และ provider อื่นๆ ยังคงอยู่บนเส้นทาง
provider ปกติในโหมด `auto` หากคุณบังคับ `agentRuntime.id: "codex"` ทุกเทิร์นแบบฝังตัว
สำหรับ agent นั้นต้องเป็นโมเดล OpenAI ที่ Codex รองรับ

**Computer Use ติดตั้งแล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงาน
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงอยู่ ให้รีสตาร์ท
gateway เพื่อล้างการลงทะเบียน hook เนทีฟที่ค้างอยู่ หาก `computer-use.list_apps`
timeout ให้รีสตาร์ท Codex Computer Use หรือ Codex Desktop แล้วลองอีกครั้ง

## ที่เกี่ยวข้อง

- [Plugins harness ของ agent](/th/plugins/sdk-agent-harness)
- [Runtimes ของ agent](/th/concepts/agent-runtimes)
- [Providers โมเดล](/th/concepts/model-providers)
- [Provider OpenAI](/th/providers/openai)
- [สถานะ](/th/cli/status)
- [Hooks ของ Plugin](/th/plugins/hooks)
- [อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
