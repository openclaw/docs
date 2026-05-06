---
read_when:
    - คุณต้องการใช้ฮาร์เนส app-server ของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่าฮาร์เนสของ Codex
    - คุณต้องการให้การปรับใช้แบบ Codex เท่านั้นล้มเหลวแทนที่จะย้อนกลับไปใช้ PI
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่รวมมาให้
title: ฮาร์เนสของ Codex
x-i18n:
    generated_at: "2026-05-06T09:24:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่รวมมาในตัวช่วยให้ OpenClaw รันรอบการทำงานของเอเจนต์แบบฝังผ่าน
Codex app-server แทน PI harness ในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง: การค้นพบโมเดล
การกลับมาทำงานต่อของเธรดแบบเนทีฟ, compaction แบบเนทีฟ และการทำงานผ่าน app-server
OpenClaw ยังเป็นเจ้าของช่องแชต, ไฟล์เซสชัน, การเลือกโมเดล, tools,
การอนุมัติ, การส่งสื่อ และสำเนา transcript ที่มองเห็นได้

เมื่อรอบแชตต้นทางทำงานผ่าน Codex harness การตอบกลับที่มองเห็นได้จะมีค่าเริ่มต้น
เป็น tool `message` ของ OpenClaw หาก deployment ยังไม่ได้กำหนดค่า
`messages.visibleReplies` อย่างชัดเจน เอเจนต์ยังสามารถจบรอบ Codex ของตนแบบส่วนตัวได้
โดยจะโพสต์ไปยังช่องเมื่อเรียก `message(action="send")` เท่านั้น ตั้งค่า
`messages.visibleReplies: "automatic"` เพื่อให้การตอบกลับสุดท้ายของ direct-chat
ยังอยู่บนเส้นทางการส่งแบบอัตโนมัติดั้งเดิม

รอบ heartbeat ของ Codex จะได้รับ tool `heartbeat_respond` เป็นค่าเริ่มต้นด้วย ดังนั้น
เอเจนต์จึงบันทึกได้ว่าการปลุกควรเงียบไว้หรือแจ้งเตือน โดยไม่ต้องเข้ารหัส
control flow นั้นในข้อความสุดท้าย

คำแนะนำ initiative เฉพาะ heartbeat จะถูกส่งเป็น developer instruction
โหมดการร่วมมือของ Codex ในรอบ heartbeat นั้นเอง รอบแชตปกติจะกู้คืน
โหมด Codex Default แทนที่จะพกปรัชญา heartbeat ไว้ใน runtime prompt ปกติ

หากคุณกำลังพยายามตั้งหลัก ให้เริ่มจาก
[รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) สรุปสั้น ๆ คือ:
`openai/gpt-5.5` คือ model ref, `codex` คือ runtime และ Telegram,
Discord, Slack หรือช่องอื่นยังเป็นพื้นผิวการสื่อสาร

## คอนฟิกด่วน

ผู้ใช้ส่วนใหญ่ที่ต้องการ "Codex ใน OpenClaw" ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
การสมัครสมาชิก ChatGPT/Codex แล้วรันรอบเอเจนต์แบบฝังผ่านรันไทม์
Codex app-server แบบเนทีฟ model ref ยังคงเป็นรูปแบบมาตรฐาน
`openai/gpt-*`; auth ของการสมัครสมาชิกมาจากบัญชี/โปรไฟล์ Codex ไม่ใช่
จาก prefix โมเดล `openai-codex/*`

ก่อนอื่นให้ลงชื่อเข้าใช้ด้วย Codex OAuth หากยังไม่ได้ทำ:

```bash
openclaw models auth login --provider openai-codex
```

จากนั้นเปิดใช้ Plugin `codex` ที่รวมมาในตัวและบังคับใช้รันไทม์ Codex:

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

อย่าใช้ `openai-codex/gpt-*` ในคอนฟิก prefix นั้นเป็นเส้นทางดั้งเดิมที่
`openclaw doctor --fix` เขียนใหม่เป็น `openai/gpt-*` ครอบคลุมโมเดลหลัก,
fallback, การ override ของ heartbeat/subagent/compaction, hooks, การ override ช่อง
และ route pins ของเซสชันที่ persist ไว้แต่ล้าสมัย

## Plugin นี้เปลี่ยนอะไร

Plugin `codex` ที่รวมมาในตัวเพิ่มความสามารถแยกกันหลายอย่าง:

| ความสามารถ                        | วิธีใช้                                      | สิ่งที่ทำ                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| รันไทม์แบบฝังเนทีฟ           | `agentRuntime.id: "codex"`                          | รันรอบเอเจนต์แบบฝังของ OpenClaw ผ่าน Codex app-server                  |
| คำสั่งควบคุมแชตเนทีฟ      | `/codex bind`, `/codex resume`, `/codex steer`, ... | ผูกและควบคุมเธรด Codex app-server จากบทสนทนาใน messaging    |
| Provider/catalog ของ Codex app-server | ภายในของ `codex`, แสดงผ่าน harness     | ให้รันไทม์ค้นพบและตรวจสอบโมเดล app-server                     |
| เส้นทาง media-understanding ของ Codex    | เส้นทางความเข้ากันได้ของโมเดลภาพ `codex/*`           | รันรอบ Codex app-server แบบจำกัดขอบเขตสำหรับโมเดลทำความเข้าใจภาพที่รองรับ |
| การ relay hook เนทีฟ                 | Plugin hooks รอบเหตุการณ์ Codex-native             | ให้ OpenClaw สังเกต/บล็อกเหตุการณ์ tool/finalization แบบ Codex-native ที่รองรับ  |

การเปิดใช้ Plugin จะทำให้ความสามารถเหล่านั้นพร้อมใช้งาน สิ่งนี้ **ไม่**:

- เริ่มใช้ Codex สำหรับโมเดล OpenAI ทุกตัว
- แปลง model refs `openai-codex/*` เป็นรันไทม์เนทีฟโดยไม่มี doctor
  ตรวจสอบว่า Codex ถูกติดตั้ง, เปิดใช้, ให้ harness `codex`
  และพร้อมใช้งาน OAuth
- ทำให้ ACP/acpx เป็นเส้นทาง Codex เริ่มต้น
- hot-switch เซสชันที่มีอยู่ซึ่งบันทึก PI runtime ไว้แล้ว
- แทนที่การส่งผ่านช่องของ OpenClaw, ไฟล์เซสชัน, การจัดเก็บ auth-profile หรือ
  การ route ข้อความ

Plugin เดียวกันยังเป็นเจ้าของพื้นผิวคำสั่งควบคุมแชต `/codex` แบบเนทีฟด้วย หาก
Plugin เปิดใช้อยู่และผู้ใช้ขอ bind, resume, steer, stop หรือตรวจสอบ
เธรด Codex จากแชต เอเจนต์ควรเลือกใช้ `/codex ...` แทน ACP ACP ยังคงเป็น
fallback ที่ชัดเจนเมื่อผู้ใช้ขอ ACP/acpx หรือกำลังทดสอบ adapter Codex ของ ACP

รอบ Codex แบบเนทีฟคง OpenClaw plugin hooks ไว้เป็นชั้นความเข้ากันได้สาธารณะ
สิ่งเหล่านี้คือ hooks ของ OpenClaw ในโปรเซส ไม่ใช่ hooks คำสั่ง `hooks.json` ของ Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` สำหรับระเบียน transcript ที่ mirror
- `before_agent_finalize` ผ่าน relay `Stop` ของ Codex
- `agent_end`

Plugins ยังสามารถลงทะเบียน middleware ผลลัพธ์ tool ที่เป็นกลางต่อรันไทม์เพื่อเขียนใหม่
ผลลัพธ์ dynamic tool ของ OpenClaw หลังจาก OpenClaw เรียกใช้ tool และก่อนที่
ผลลัพธ์จะถูกส่งกลับไปยัง Codex สิ่งนี้แยกจาก plugin hook สาธารณะ
`tool_result_persist` ซึ่งแปลงการเขียนผลลัพธ์ tool ใน transcript ที่ OpenClaw เป็นเจ้าของ

สำหรับความหมายของ plugin hook เอง ดู [Plugin hooks](/th/plugins/hooks)
และ [พฤติกรรมของ Plugin guard](/th/tools/plugin)

harness ปิดอยู่โดยค่าเริ่มต้น คอนฟิกใหม่ควรคง model refs ของ OpenAI
ในรูปแบบมาตรฐานเป็น `openai/gpt-*` และบังคับใช้อย่างชัดเจนด้วย
`agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` เมื่อพวกเขา
ต้องการการทำงานผ่าน app-server แบบเนทีฟ model refs ดั้งเดิม `codex/*` ยังเลือก
harness อัตโนมัติเพื่อความเข้ากันได้ แต่ prefix provider ดั้งเดิมที่มี runtime รองรับ
จะไม่แสดงเป็นตัวเลือกโมเดล/provider ปกติ

หาก route โมเดลที่กำหนดค่าไว้ยังเป็น `openai-codex/*`, `openclaw doctor --fix`
จะเขียนใหม่เป็น `openai/*` สำหรับ route เอเจนต์ที่ตรงกัน จะตั้งค่ารันไทม์เอเจนต์
เป็น `codex` เฉพาะเมื่อ Plugin Codex ถูกติดตั้ง, เปิดใช้, ให้
harness `codex` และมี OAuth ที่ใช้งานได้ มิฉะนั้นจะตั้งค่ารันไทม์เป็น `pi`

## แผนที่ route

ใช้ตารางนี้ก่อนเปลี่ยนคอนฟิก:

| พฤติกรรมที่ต้องการ                                     | Model ref                  | คอนฟิกรันไทม์                         | route auth/โปรไฟล์           | ป้ายสถานะที่คาดไว้          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth หรือบัญชี Codex | `Runtime: OpenAI Codex`        |
| OpenAI API ผ่าน runner ปกติของ OpenClaw            | `openai/gpt-*`             | ละไว้ หรือ `runtime: "pi"`             | OpenAI API key               | `Runtime: OpenClaw Pi Default` |
| คอนฟิกดั้งเดิมที่ต้องซ่อมด้วย doctor               | `openai-codex/gpt-*`       | ซ่อมเป็น `codex` หรือ `pi`            | auth ที่กำหนดค่าไว้เดิม     | ตรวจซ้ำหลัง `doctor --fix`   |
| Providers แบบผสมด้วยโหมด auto เชิงอนุรักษ์          | refs เฉพาะ provider     | `agentRuntime.id: "auto"`              | ตาม provider ที่เลือก        | ขึ้นอยู่กับรันไทม์ที่เลือก    |
| เซสชัน adapter Codex ACP แบบชัดเจน                   | ขึ้นอยู่กับ prompt/model ของ ACP | `sessions_spawn` พร้อม `runtime: "acp"` | auth ของ ACP backend             | สถานะ task/session ของ ACP        |

จุดแบ่งสำคัญคือ provider เทียบกับ runtime:

- `openai-codex/*` คือ route ดั้งเดิมที่ doctor เขียนใหม่
- `agentRuntime.id: "codex"` ต้องใช้ Codex harness และ fail closed หาก
  ไม่พร้อมใช้งาน
- `agentRuntime.id: "auto"` ให้ harnesses ที่ลงทะเบียน claim route provider
  ที่ตรงกัน แต่ refs OpenAI แบบมาตรฐานยังเป็นของ PI เว้นแต่ harness จะรองรับ
  คู่ provider/model นั้น
- `/codex ...` ตอบคำถามว่า "บทสนทนา Codex แบบเนทีฟใดที่แชตนี้ควร bind
  หรือควบคุม?"
- ACP ตอบคำถามว่า "acpx ควร launch โปรเซส harness ภายนอกใด?"

## เลือก prefix โมเดลให้ถูกต้อง

Routes ตระกูล OpenAI ขึ้นอยู่กับ prefix สำหรับการตั้งค่าทั่วไปแบบสมัครสมาชิกบวก
รันไทม์ Codex แบบเนทีฟ ให้ใช้ `openai/*` กับ `agentRuntime.id: "codex"`
ถือว่า `openai-codex/*` เป็นคอนฟิกดั้งเดิมที่ doctor ควรเขียนใหม่:

| Model ref                                     | เส้นทางรันไทม์                                 | ใช้เมื่อ                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provider OpenAI ผ่าน plumbing ของ OpenClaw/PI | คุณต้องการเข้าถึง OpenAI Platform API โดยตรงในปัจจุบันด้วย `OPENAI_API_KEY` |
| `openai-codex/gpt-5.5`                        | route ดั้งเดิมที่ doctor ซ่อม              | คุณอยู่บนคอนฟิกเก่า; รัน `openclaw doctor --fix` เพื่อเขียนใหม่         |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | คุณต้องการ auth จากการสมัครสมาชิก ChatGPT/Codex พร้อมการทำงาน Codex แบบเนทีฟ     |

GPT-5.5 อาจปรากฏได้ทั้งบน route คีย์ API ของ OpenAI โดยตรงและ route การสมัครสมาชิก Codex
เมื่อบัญชีของคุณเปิดให้ใช้ ใช้ `openai/gpt-5.5` กับ Codex app-server
harness สำหรับรันไทม์ Codex แบบเนทีฟ หรือ `openai/gpt-5.5` โดยไม่มีการ override
รันไทม์ Codex สำหรับทราฟฟิกผ่านคีย์ API โดยตรง

refs ดั้งเดิม `codex/gpt-*` ยังคงยอมรับเป็น alias เพื่อความเข้ากันได้ การย้าย
ความเข้ากันได้ของ doctor เขียน runtime refs ดั้งเดิมใหม่เป็น model refs มาตรฐาน
และบันทึกนโยบายรันไทม์แยกต่างหาก คอนฟิก harness app-server แบบเนทีฟใหม่
ควรใช้ `openai/gpt-*` บวก `agentRuntime.id: "codex"`

`agents.defaults.imageModel` ใช้การแบ่ง prefix แบบเดียวกัน ใช้
`openai/gpt-*` สำหรับ route OpenAI ปกติ และ `codex/gpt-*` เมื่อการทำความเข้าใจภาพ
ควรรันผ่านรอบ Codex app-server แบบจำกัดขอบเขต อย่าใช้
`openai-codex/gpt-*`; doctor เขียน prefix ดั้งเดิมนั้นใหม่เป็น `openai/gpt-*` โมเดล
Codex app-server ต้องประกาศว่ารองรับอินพุตภาพ; โมเดล Codex แบบข้อความเท่านั้น
จะล้มเหลวก่อนที่รอบสื่อจะเริ่ม

ใช้ `/status` เพื่อยืนยัน harness ที่มีผลสำหรับเซสชันปัจจุบัน หากการเลือก
น่าประหลาดใจ ให้เปิด debug logging สำหรับ subsystem `agents/harness`
และตรวจสอบระเบียนเชิงโครงสร้าง `agent harness selected` ของ gateway ระเบียนนี้
มี id ของ harness ที่เลือก, เหตุผลการเลือก, นโยบาย runtime/fallback และ,
ในโหมด `auto`, ผลการรองรับของ candidate แต่ละ Plugin

### คำเตือนของ doctor หมายความว่าอะไร

`openclaw doctor` เตือนเมื่อ model refs ที่กำหนดค่าไว้หรือสถานะ route
ของเซสชันที่ persist ไว้ยังใช้ `openai-codex/*` `openclaw doctor --fix` เขียน route เหล่านั้นใหม่เป็น:

- `openai/<model>`
- `agentRuntime.id: "codex"` เมื่อ Codex ถูกติดตั้ง, เปิดใช้, ให้
  harness `codex` และมี OAuth ที่ใช้งานได้
- `agentRuntime.id: "pi"` มิฉะนั้น

route `codex` บังคับใช้ Codex harness แบบเนทีฟ route `pi` คงเอเจนต์ไว้บน
runner เริ่มต้นของ OpenClaw แทนที่จะเปิดใช้หรือติดตั้ง Codex เป็น
ผลข้างเคียงของการล้าง route ดั้งเดิม
Doctor ยังซ่อม session pins ที่ persist ไว้แต่ล้าสมัยใน store เซสชันเอเจนต์
ที่ค้นพบ เพื่อไม่ให้บทสนทนาเก่าค้างอยู่บน route ที่ถูกลบแล้ว

การเลือกฮาร์เนสไม่ใช่การควบคุมเซสชันสด เมื่อเทิร์นแบบฝังทำงาน
OpenClaw จะบันทึก id ฮาร์เนสที่เลือกไว้ในเซสชันนั้นและใช้ต่อไปสำหรับ
เทิร์นภายหลังใน id เซสชันเดียวกัน เปลี่ยน config `agentRuntime` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อต้องการให้เซสชันในอนาคตใช้ฮาร์เนสอื่น
ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับบทสนทนาที่มีอยู่
ระหว่าง PI และ Codex วิธีนี้ช่วยหลีกเลี่ยงการเล่น transcript เดียวซ้ำผ่าน
ระบบเซสชันเนทีฟสองระบบที่เข้ากันไม่ได้

เซสชันเก่าที่สร้างก่อนมีการตรึงฮาร์เนสจะถือว่าถูกตรึงกับ PI เมื่อมี
ประวัติ transcript แล้ว ใช้ `/new` หรือ `/reset` เพื่อเลือกให้บทสนทนานั้น
เข้าใช้ Codex หลังจากเปลี่ยน config

`/status` แสดง runtime ของโมเดลที่มีผล ฮาร์เนส PI ค่าเริ่มต้นจะแสดงเป็น
`Runtime: OpenClaw Pi Default` และฮาร์เนส app-server ของ Codex จะแสดงเป็น
`Runtime: OpenAI Codex`

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` แบบบันเดิลพร้อมใช้งาน
- Codex app-server `0.125.0` หรือใหม่กว่า Plugin แบบบันเดิลจัดการไบนารี
  Codex app-server ที่เข้ากันได้ตามค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH`
  จึงไม่กระทบการเริ่มต้นฮาร์เนสตามปกติ
- มี Codex auth ให้กับโปรเซส app-server หรือให้กับบริดจ์ Codex auth ของ OpenClaw
  การเปิด app-server ในเครื่องใช้ Codex home ที่ OpenClaw จัดการสำหรับแต่ละ
  agent และ `HOME` ของ child ที่แยกต่างหาก ดังนั้นโดยค่าเริ่มต้นจึงไม่อ่าน
  บัญชี `~/.codex` ส่วนตัว, Skills, plugins, config, สถานะเธรด หรือ
  `$HOME/.agents/skills` เนทีฟของคุณ

Plugin จะบล็อก handshake ของ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน วิธีนี้ช่วยให้
OpenClaw อยู่บนพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้ว

สำหรับการทดสอบ smoke แบบ live และ Docker โดยทั่วไป auth จะมาจากบัญชี Codex CLI
หรือโปรไฟล์ auth `openai-codex` ของ OpenClaw การเปิด app-server ผ่าน stdio ในเครื่อง
ยังสามารถ fallback ไปใช้ `CODEX_API_KEY` / `OPENAI_API_KEY` ได้เมื่อไม่มีบัญชี

## ไฟล์ bootstrap ของ workspace

Codex จัดการ `AGENTS.md` เองผ่านการค้นพบ project-doc แบบเนทีฟ OpenClaw
ไม่เขียนไฟล์ project-doc สังเคราะห์ของ Codex หรือพึ่งพาชื่อไฟล์ fallback ของ Codex
สำหรับไฟล์ persona เพราะ fallback ของ Codex ใช้เฉพาะเมื่อไม่มี `AGENTS.md`

เพื่อความเท่าเทียมของ workspace ใน OpenClaw ฮาร์เนส Codex จะ resolve ไฟล์ bootstrap
อื่น ๆ (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` และ `MEMORY.md` เมื่อมีอยู่) แล้วส่งต่อผ่านคำสั่ง developer ของ Codex
บน `thread/start` และ `thread/resume` วิธีนี้ทำให้ `SOUL.md` และบริบท persona/profile
ของ workspace ที่เกี่ยวข้องยังมองเห็นได้บนเลนกำหนดพฤติกรรมเนทีฟของ Codex
โดยไม่ต้องทำซ้ำ `AGENTS.md`

## เพิ่ม Codex ควบคู่กับโมเดลอื่น

อย่าตั้ง `agentRuntime.id: "codex"` แบบ global หาก agent เดียวกันควรสลับได้อย่างอิสระ
ระหว่าง Codex และโมเดลผู้ให้บริการที่ไม่ใช่ Codex runtime ที่บังคับใช้จะมีผลกับทุก
เทิร์นแบบฝังสำหรับ agent หรือเซสชันนั้น หากคุณเลือกโมเดล Anthropic ขณะที่ runtime
นั้นถูกบังคับอยู่ OpenClaw จะยังคงลองใช้ฮาร์เนส Codex และล้มเหลวแบบปิด
แทนที่จะ route เทิร์นนั้นผ่าน PI อย่างเงียบ ๆ

ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้แทน:

- วาง Codex ไว้บน agent เฉพาะที่มี `agentRuntime.id: "codex"`
- คง agent ค่าเริ่มต้นไว้ที่ `agentRuntime.id: "auto"` และใช้ PI fallback สำหรับการใช้งาน
  ผู้ให้บริการแบบผสมตามปกติ
- ใช้ refs แบบเก่า `codex/*` เพื่อความเข้ากันได้เท่านั้น config ใหม่ควรเลือกใช้
  `openai/*` พร้อมนโยบาย runtime ของ Codex ที่ระบุชัดเจน

ตัวอย่างเช่น รูปแบบนี้คง agent ค่าเริ่มต้นไว้บนการเลือกอัตโนมัติตามปกติและ
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

- agent ค่าเริ่มต้น `main` ใช้เส้นทางผู้ให้บริการปกติและ PI compatibility fallback
- agent `codex` ใช้ฮาร์เนส Codex app-server
- หาก Codex ขาดหายหรือไม่รองรับสำหรับ agent `codex` เทิร์นจะล้มเหลว
  แทนที่จะใช้ PI อย่างเงียบ ๆ

## การ route คำสั่งของ agent

Agents ควร route คำขอของผู้ใช้ตามเจตนา ไม่ใช่ตามคำว่า "Codex" เพียงอย่างเดียว:

| ผู้ใช้ขอให้...                                           | Agent ควรใช้...                                    |
| -------------------------------------------------------- | -------------------------------------------------- |
| "ผูกแชตนี้กับ Codex"                                    | `/codex bind`                                      |
| "ดำเนินเธรด Codex `<id>` ต่อที่นี่"                     | `/codex resume <id>`                               |
| "แสดงเธรด Codex"                                        | `/codex threads`                                   |
| "ส่งรายงาน support สำหรับการรัน Codex ที่มีปัญหา"       | `/diagnostics [note]`                              |
| "ส่ง feedback ของ Codex เฉพาะสำหรับเธรดที่แนบมานี้เท่านั้น" | `/codex diagnostics [note]`                        |
| "ใช้ subscription ChatGPT/Codex ของฉันกับ Codex runtime" | `openai/*` บวก `agentRuntime.id: "codex"`          |
| "ซ่อม config/session pins เก่า `openai-codex/*`"        | `openclaw doctor --fix`                            |
| "รัน Codex ผ่าน ACP/acpx"                               | ACP `sessions_spawn({ runtime: "acp", ... })`      |
| "เริ่ม Claude Code/Gemini/OpenCode/Cursor ในเธรด"       | ACP/acpx ไม่ใช่ `/codex` และไม่ใช่ sub-agents เนทีฟ |

OpenClaw จะประกาศคำแนะนำการ spawn ของ ACP ให้ agents เฉพาะเมื่อเปิดใช้ ACP,
dispatch ได้ และมี backend runtime ที่โหลดอยู่รองรับ หาก ACP ไม่พร้อมใช้งาน
system prompt และ plugin skills ไม่ควรสอน agent เกี่ยวกับการ route ของ ACP

## การ deploy เฉพาะ Codex

บังคับใช้ฮาร์เนส Codex เมื่อคุณต้องพิสูจน์ว่าเทิร์น agent แบบฝังทุกเทิร์น
ใช้ Codex runtime ของ Plugin ที่ระบุชัดเจนจะล้มเหลวแบบปิดและจะไม่ retry
ผ่าน PI อย่างเงียบ ๆ:

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

เมื่อบังคับใช้ Codex OpenClaw จะล้มเหลวตั้งแต่ต้นหากปิดใช้ Plugin Codex,
app-server เก่าเกินไป หรือ app-server เริ่มทำงานไม่ได้

## Codex ต่อ agent

คุณสามารถทำให้ agent หนึ่งเป็น Codex เท่านั้น ขณะที่ agent ค่าเริ่มต้นยังคง
การเลือกอัตโนมัติตามปกติ:

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

ใช้คำสั่งเซสชันปกติเพื่อสลับ agents และโมเดล `/new` สร้างเซสชัน OpenClaw ใหม่
และฮาร์เนส Codex จะสร้างหรือ resume เธรด sidecar app-server ตามต้องการ
`/reset` ล้างการผูกเซสชัน OpenClaw สำหรับเธรดนั้น และให้เทิร์นถัดไป resolve
ฮาร์เนสจาก config ปัจจุบันอีกครั้ง

## การค้นพบโมเดล

ตามค่าเริ่มต้น Plugin Codex จะถาม app-server เพื่อดูโมเดลที่พร้อมใช้งาน หาก
การค้นพบล้มเหลวหรือหมดเวลา จะใช้ fallback catalog แบบบันเดิลสำหรับ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

คุณปรับการค้นพบได้ใต้ `plugins.entries.codex.config.discovery`:

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

ปิดการค้นพบเมื่อต้องการให้การเริ่มต้นหลีกเลี่ยงการ probe Codex และยึดตาม
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

ตามค่าเริ่มต้น Plugin จะเริ่มไบนารี Codex ที่ OpenClaw จัดการในเครื่องด้วย:

```bash
codex app-server --listen stdio://
```

ไบนารีที่จัดการมาพร้อมกับแพ็กเกจ Plugin `codex` วิธีนี้ทำให้เวอร์ชัน app-server
ผูกกับ Plugin แบบบันเดิล แทนที่จะขึ้นกับ Codex CLI แยกต่างหากตัวใดก็ตามที่ติดตั้ง
อยู่ในเครื่อง ตั้งค่า `appServer.command` เฉพาะเมื่อคุณตั้งใจต้องการรัน executable
อื่น

ตามค่าเริ่มต้น OpenClaw เริ่มเซสชันฮาร์เนส Codex ในเครื่องในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือ posture ของ operator ในเครื่องที่เชื่อถือได้
ซึ่งใช้สำหรับ Heartbeat อัตโนมัติ: Codex สามารถใช้ shell และเครื่องมือ network
ได้โดยไม่หยุดรอ native approval prompts ที่ไม่มีใครอยู่ตอบ

หากต้องการเลือกใช้ approval ที่ Codex guardian ตรวจทาน ให้ตั้ง `appServer.mode:
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

โหมด Guardian ใช้เส้นทาง approval แบบ auto-review เนทีฟของ Codex เมื่อ Codex ขอออกจาก
sandbox, เขียนนอก workspace หรือเพิ่มสิทธิ์อย่างเช่นการเข้าถึง network Codex จะ route
คำขอ approval นั้นไปยัง reviewer เนทีฟแทน prompt มนุษย์ reviewer จะใช้กรอบความเสี่ยง
ของ Codex และอนุมัติหรือปฏิเสธคำขอเฉพาะนั้น ใช้ Guardian เมื่อคุณต้องการ guardrails
มากกว่าโหมด YOLO แต่ยังต้องการให้ agents ที่ไม่มีคนเฝ้าทำงานต่อไปได้

preset `guardian` จะขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"`
ฟิลด์นโยบายแต่ละรายการยังคง override `mode` ได้ ดังนั้นการ deploy ขั้นสูงสามารถผสม
preset กับตัวเลือกที่ระบุชัดเจนได้ ค่า reviewer เก่า `guardian_subagent` ยังยอมรับเป็น
alias เพื่อความเข้ากันได้ แต่ config ใหม่ควรใช้ `auto_review`

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

การเปิด app-server ผ่าน stdio จะสืบทอด environment ของโปรเซส OpenClaw ตามค่าเริ่มต้น
แต่ OpenClaw เป็นเจ้าของบริดจ์บัญชี Codex app-server และตั้งทั้ง `CODEX_HOME` และ
`HOME` เป็นไดเรกทอรีต่อ agent ภายใต้สถานะ OpenClaw ของ agent นั้น skill loader
ของ Codex เองอ่าน `$CODEX_HOME/skills` และ `$HOME/.agents/skills` ดังนั้นค่าทั้งสอง
จึงถูกแยกสำหรับการเปิด app-server ในเครื่อง วิธีนี้ทำให้ skills, plugins, config,
บัญชี และสถานะเธรดแบบ Codex-native ถูกจำกัดขอบเขตอยู่กับ agent ของ OpenClaw
แทนที่จะรั่วเข้ามาจาก Codex CLI home ส่วนตัวของ operator

OpenClaw plugins และ snapshot ของ OpenClaw skill ยังคงไหลผ่าน plugin registry
และ skill loader ของ OpenClaw เอง สินทรัพย์ Codex CLI ส่วนตัวจะไม่ไหลผ่าน หากคุณมี
skills หรือ plugins ของ Codex CLI ที่มีประโยชน์และควรกลายเป็นส่วนหนึ่งของ agent
OpenClaw ให้ทำ inventory อย่างชัดเจน:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

provider การ migration ของ Codex จะคัดลอก skills เข้าไปใน workspace ของ agent
OpenClaw ปัจจุบัน plugins, hooks และไฟล์ config เนทีฟของ Codex จะถูกรายงานหรือเก็บถาวร
เพื่อการตรวจทานด้วยตนเอง แทนที่จะถูกเปิดใช้งานโดยอัตโนมัติ เพราะสิ่งเหล่านี้สามารถ
รันคำสั่ง เปิดเผย MCP servers หรือมี credentials ได้

Auth จะถูกเลือกตามลำดับนี้:

1. โปรไฟล์ OpenClaw Codex auth ที่ระบุชัดเจนสำหรับ agent
2. บัญชีที่มีอยู่ของ app-server ใน Codex home ของ agent นั้น
3. เฉพาะการเปิด app-server ผ่าน stdio ในเครื่องเท่านั้น `CODEX_API_KEY` แล้วตามด้วย
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server และยังต้องใช้ OpenAI auth

เมื่อ OpenClaw พบโปรไฟล์ auth ของ Codex แบบการสมัครสมาชิก ChatGPT ระบบจะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่ถูก spawn การทำเช่นนี้
ทำให้คีย์ API ระดับ Gateway ยังพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้ turn ของ app-server ดั้งเดิมของ Codex ถูกคิดค่าใช้จ่ายผ่าน API โดยไม่ตั้งใจ
โปรไฟล์คีย์ API ของ Codex ที่กำหนดชัดเจนและ fallback คีย์ env ของ stdio แบบโลคัลจะใช้การเข้าสู่ระบบ
app-server แทน env ของกระบวนการลูกที่สืบทอดมา การเชื่อมต่อ app-server ผ่าน WebSocket
จะไม่ได้รับ fallback คีย์ API จาก env ของ Gateway ให้ใช้โปรไฟล์ auth ที่กำหนดชัดเจนหรือ
บัญชีของ app-server ระยะไกลเอง

หาก deployment ต้องการการแยกสภาพแวดล้อมเพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นลงใน
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

`appServer.clearEnv` มีผลเฉพาะกับกระบวนการลูก app-server ของ Codex ที่ถูก spawn เท่านั้น

เครื่องมือแบบไดนามิกของ Codex ใช้โปรไฟล์ `native-first` เป็นค่าเริ่มต้น ในโหมดนั้น
OpenClaw จะไม่เปิดเผยเครื่องมือแบบไดนามิกที่ซ้ำกับการทำงานใน workspace แบบดั้งเดิมของ Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` และ
`update_plan` เครื่องมืออินทิเกรชันของ OpenClaw เช่น messaging, sessions, media,
cron, browser, nodes, gateway, `heartbeat_respond` และ `web_search` ยังคง
พร้อมใช้งาน

ฟิลด์ Plugin ของ Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น          | ความหมาย                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | ใช้ `"openclaw-compat"` เพื่อเปิดเผยชุดเครื่องมือแบบไดนามิกทั้งหมดของ OpenClaw ให้กับ app-server ของ Codex |
| `codexDynamicToolsExclude` | `[]`             | ชื่อเครื่องมือแบบไดนามิกเพิ่มเติมของ OpenClaw ที่จะละเว้นจาก turn ของ app-server ของ Codex               |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์               | ค่าเริ่มต้น                                  | ความหมาย                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` จะ spawn Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                             |
| `command`           | ไบนารี Codex ที่จัดการให้                     | ไฟล์ปฏิบัติการสำหรับ transport แบบ stdio เว้นว่างไว้เพื่อใช้ไบนารีที่จัดการให้ ตั้งค่าเฉพาะเมื่อต้องการ override อย่างชัดเจน                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | อาร์กิวเมนต์สำหรับ transport แบบ stdio                                                                                                                                                                                                       |
| `url`               | ไม่ได้ตั้งค่า                                    | URL ของ app-server ผ่าน WebSocket                                                                                                                                                                                                            |
| `authToken`         | ไม่ได้ตั้งค่า                                    | Bearer token สำหรับ transport ผ่าน WebSocket                                                                                                                                                                                                |
| `headers`           | `{}`                                     | header เพิ่มเติมของ WebSocket                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากกระบวนการ app-server แบบ stdio ที่ถูก spawn หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว `CODEX_HOME` และ `HOME` ถูกสงวนไว้สำหรับการแยก Codex ราย agent ของ OpenClaw ในการเปิดแบบโลคัล |
| `requestTimeoutMs`  | `60000`                                  | timeout สำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | preset สำหรับการทำงานแบบ YOLO หรือที่มี guardian review                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | นโยบายการอนุมัติดั้งเดิมของ Codex ที่ส่งไปยัง thread start/resume/turn                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | โหมด sandbox ดั้งเดิมของ Codex ที่ส่งไปยัง thread start/resume                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจ review prompt การอนุมัติดั้งเดิม `guardian_subagent` ยังคงเป็น alias เดิม                                                                                                                         |
| `serviceTier`       | ไม่ได้ตั้งค่า                                    | service tier ของ app-server Codex ที่เลือกได้: `"fast"`, `"flex"` หรือ `null` ค่า legacy ที่ไม่ถูกต้องจะถูกละเว้น                                                                                                                            |

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของจะถูกจำกัดอย่างเป็นอิสระจาก
`appServer.requestTimeoutMs`: คำขอ `item/tool/call` แต่ละครั้งของ Codex ต้องได้รับ
การตอบกลับจาก OpenClaw ภายใน 30 วินาที เมื่อ timeout OpenClaw จะ abort สัญญาณของเครื่องมือ
เมื่อรองรับ และส่งคืนการตอบกลับเครื่องมือแบบไดนามิกที่ล้มเหลวให้ Codex เพื่อให้
turn ดำเนินต่อได้แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`

หลังจาก OpenClaw ตอบกลับคำขอ app-server ในขอบเขต turn ของ Codex แล้ว harness
ยังคาดหวังให้ Codex จบ turn ดั้งเดิมด้วย `turn/completed` หาก app-server
เงียบไป 60 วินาทีหลังจากการตอบกลับนั้น OpenClaw จะพยายาม interrupt turn ของ Codex
แบบ best-effort บันทึก timeout เพื่อการวินิจฉัย และปล่อย lane ของเซสชัน OpenClaw
เพื่อไม่ให้ข้อความแชทติดตามผลถูกคิวไว้หลัง turn ดั้งเดิมที่ค้างอยู่

override สภาพแวดล้อมยังพร้อมใช้งานสำหรับการทดสอบแบบโลคัล:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้ามไบนารีที่จัดการให้เมื่อ
`appServer.command` ไม่ได้ตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบแบบโลคัลเฉพาะครั้ง ควรใช้ config
สำหรับ deployment ที่ทำซ้ำได้ เพราะมันเก็บพฤติกรรมของ Plugin ไว้ในไฟล์ที่ผ่านการ review เดียวกัน
กับการตั้งค่า Codex harness ส่วนที่เหลือ

## การใช้คอมพิวเตอร์

การใช้คอมพิวเตอร์มีคู่มือตั้งค่าแยกของตัวเอง:
[Codex การใช้คอมพิวเตอร์](/th/plugins/codex-computer-use).

สรุปสั้น ๆ: OpenClaw ไม่ได้ vendor แอปควบคุมเดสก์ท็อปหรือดำเนินการ desktop action เอง
ระบบเตรียม app-server ของ Codex ตรวจสอบว่า MCP server `computer-use` พร้อมใช้งาน
จากนั้นให้ Codex จัดการการเรียกเครื่องมือ MCP ดั้งเดิมระหว่าง turn ในโหมด Codex

สำหรับการเข้าถึง driver TryCua โดยตรงนอก flow ของ marketplace ของ Codex ให้ register
`cua-driver mcp` ด้วย `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
ดู [Codex การใช้คอมพิวเตอร์](/th/plugins/codex-computer-use) สำหรับความแตกต่าง
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

สามารถตรวจสอบหรือติดตั้งการตั้งค่าได้จาก command surface:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

การใช้คอมพิวเตอร์รองรับเฉพาะ macOS และอาจต้องใช้สิทธิ์ OS แบบโลคัลก่อนที่
Codex MCP server จะควบคุมแอปได้ หาก `computerUse.enabled` เป็น true และ MCP
server ไม่พร้อมใช้งาน turn ในโหมด Codex จะล้มเหลวก่อน thread เริ่มต้น แทนที่จะ
ทำงานเงียบ ๆ โดยไม่มีเครื่องมือการใช้คอมพิวเตอร์ดั้งเดิม ดู
[Codex การใช้คอมพิวเตอร์](/th/plugins/codex-computer-use) สำหรับตัวเลือก marketplace,
ขีดจำกัดของ catalog ระยะไกล, เหตุผลของสถานะ และการแก้ไขปัญหา

เมื่อ `computerUse.autoInstall` เป็น true OpenClaw สามารถลงทะเบียน marketplace
Codex Desktop แบบ bundled มาตรฐานจาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` หาก Codex
ยังไม่พบ marketplace แบบโลคัล ใช้ `/new` หรือ `/reset` หลังจากเปลี่ยน runtime
หรือ config การใช้คอมพิวเตอร์ เพื่อไม่ให้เซสชันที่มีอยู่ยังคง binding ของ PI หรือ thread ของ Codex เก่า

## สูตรที่ใช้บ่อย

Codex แบบโลคัลพร้อม transport stdio ค่าเริ่มต้น:

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

การอนุมัติ Codex ที่มี guardian review:

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

app-server ระยะไกลพร้อม header ที่กำหนดชัดเจน:

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

การสลับโมเดลยังคงควบคุมโดย OpenClaw เมื่อเซสชัน OpenClaw ถูกแนบกับ
thread Codex ที่มีอยู่ turn ถัดไปจะส่งโมเดล OpenAI, provider, นโยบายการอนุมัติ,
sandbox และ service tier ที่เลือกอยู่ในปัจจุบันไปยัง app-server อีกครั้ง
การสลับจาก `openai/gpt-5.5` เป็น `openai/gpt-5.2` จะคง binding ของ thread ไว้
แต่ขอให้ Codex ดำเนินการต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

Plugin ที่ bundled จะลงทะเบียน `/codex` เป็น slash command ที่ได้รับอนุญาต
คำสั่งนี้เป็นแบบทั่วไปและทำงานได้บน channel ใด ๆ ที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` แสดงการเชื่อมต่อ app-server แบบสด, โมเดล, บัญชี, ขีดจำกัดอัตราการใช้งาน, เซิร์ฟเวอร์ MCP และ skills
- `/codex models` แสดงรายการโมเดล Codex app-server แบบสด
- `/codex threads [filter]` แสดงรายการเธรด Codex ล่าสุด
- `/codex resume <thread-id>` ผูกเซสชัน OpenClaw ปัจจุบันเข้ากับเธรด Codex ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server ทำ compact เธรดที่ผูกอยู่
- `/codex review` เริ่มการรีวิวแบบเนทีฟของ Codex สำหรับเธรดที่ผูกอยู่
- `/codex diagnostics [note]` ขออนุมัติก่อนส่งฟีดแบ็ก diagnostics ของ Codex สำหรับเธรดที่ผูกอยู่
- `/codex computer-use status` ตรวจสอบ Computer Use plugin และเซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้
- `/codex computer-use install` ติดตั้ง Computer Use plugin ที่กำหนดค่าไว้และโหลดเซิร์ฟเวอร์ MCP ใหม่
- `/codex account` แสดงสถานะบัญชีและขีดจำกัดอัตราการใช้งาน
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของ Codex app-server
- `/codex skills` แสดงรายการ skills ของ Codex app-server

เมื่อ Codex รายงานความล้มเหลวจากขีดจำกัดการใช้งาน OpenClaw จะรวมเวลารีเซ็ต
app-server ครั้งถัดไปไว้ด้วยเมื่อ Codex ให้ค่านั้นมา ใช้ `/codex account` ในบทสนทนาเดียวกัน
เพื่อตรวจสอบบัญชีปัจจุบันและหน้าต่างขีดจำกัดอัตราการใช้งาน

### เวิร์กโฟลว์ดีบักทั่วไป

เมื่อ agent ที่ใช้ Codex ทำสิ่งที่น่าประหลาดใจใน Telegram, Discord, Slack,
หรือช่องทางอื่น ให้เริ่มจากบทสนทนาที่เกิดปัญหา:

1. รัน `/diagnostics bad tool choice after image upload` หรือโน้ตสั้นอื่น
   ที่อธิบายสิ่งที่คุณเห็น
2. อนุมัติคำขอ diagnostics หนึ่งครั้ง การอนุมัติจะสร้างไฟล์ zip diagnostics ของ Gateway
   ภายในเครื่อง และเพราะเซสชันกำลังใช้ Codex harness จึงยัง
   ส่งบันเดิลฟีดแบ็ก Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
3. คัดลอกคำตอบ diagnostics ที่เสร็จแล้วลงในรายงานบั๊กหรือเธรดซัพพอร์ต
   คำตอบนี้มีพาธบันเดิลภายในเครื่อง, สรุปความเป็นส่วนตัว, id เซสชัน OpenClaw,
   id เธรด Codex และบรรทัด `Inspect locally` สำหรับแต่ละเธรด Codex
4. หากต้องการดีบักการรันด้วยตัวเอง ให้รันคำสั่ง `Inspect locally`
   ที่พิมพ์ออกมาในเทอร์มินัล คำสั่งจะมีลักษณะเช่น `codex resume <thread-id>` และเปิด
   เธรด Codex แบบเนทีฟเพื่อให้คุณตรวจสอบบทสนทนา, ดำเนินต่อในเครื่อง,
   หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือแผนนั้น

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลดฟีดแบ็ก Codex
สำหรับเธรดที่ผูกอยู่ในปัจจุบันโดยไม่รวมบันเดิล diagnostics เต็มของ OpenClaw
Gateway สำหรับรายงานซัพพอร์ตส่วนใหญ่ `/diagnostics [note]` เป็นจุดเริ่มต้น
ที่ดีกว่า เพราะรวมสถานะ Gateway ภายในเครื่องและ id เธรด Codex
ไว้ด้วยกันในคำตอบเดียว ดู [การส่งออก Diagnostics](/th/gateway/diagnostics)
สำหรับโมเดลความเป็นส่วนตัวแบบเต็มและพฤติกรรมในแชตกลุ่ม

แกนหลักของ OpenClaw ยังเปิดใช้ `/diagnostics [note]` สำหรับ owner เท่านั้นเป็นคำสั่ง
diagnostics ทั่วไปของ Gateway พรอมต์อนุมัติจะแสดงคำนำเกี่ยวกับข้อมูลอ่อนไหว,
ลิงก์ไปยัง [Diagnostics Export](/th/gateway/diagnostics), และขอเรียกใช้
`openclaw gateway diagnostics export --json` ผ่านการอนุมัติ exec อย่างชัดเจน
ทุกครั้ง อย่าอนุมัติ diagnostics ด้วยกฎ allow-all หลังอนุมัติแล้ว
OpenClaw จะส่งรายงานที่นำไปวางได้พร้อมพาธบันเดิลภายในเครื่องและสรุป manifest
เมื่อเซสชัน OpenClaw ที่ใช้งานอยู่กำลังใช้ Codex harness การอนุมัติเดียวกันนั้น
ยังอนุญาตให้ส่งบันเดิลฟีดแบ็ก Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
พรอมต์อนุมัติจะบอกว่าจะส่งฟีดแบ็ก Codex แต่จะไม่แสดง id เซสชันหรือเธรด Codex ก่อนอนุมัติ

หาก owner เรียกใช้ `/diagnostics` ในแชตกลุ่ม OpenClaw จะรักษาช่องทางร่วม
ให้สะอาด: กลุ่มจะได้รับเพียงประกาศสั้น ๆ ขณะที่คำนำ diagnostics, พรอมต์อนุมัติ,
และ id เซสชัน/เธรด Codex จะถูกส่งไปยัง owner ผ่านเส้นทางอนุมัติส่วนตัว
หากไม่มีเส้นทาง owner ส่วนตัว OpenClaw จะปฏิเสธคำขอกลุ่มและขอให้ owner รันจาก DM

การอัปโหลด Codex ที่อนุมัติแล้วจะเรียก Codex app-server `feedback/upload` และขอให้
app-server รวมบันทึกสำหรับแต่ละเธรดที่ระบุและ subthread Codex ที่ spawned
เมื่อมีให้ใช้ การอัปโหลดผ่านเส้นทางฟีดแบ็กปกติของ Codex ไปยังเซิร์ฟเวอร์ OpenAI;
หากฟีดแบ็ก Codex ถูกปิดใช้ใน app-server นั้น คำสั่งจะคืนข้อผิดพลาดของ
app-server คำตอบ diagnostics ที่เสร็จแล้วจะแสดงรายการช่องทาง,
id เซสชัน OpenClaw, id เธรด Codex และคำสั่ง `codex resume <thread-id>`
ภายในเครื่องสำหรับเธรดที่ถูกส่ง หากคุณปฏิเสธหรือเพิกเฉยต่อการอนุมัติ
OpenClaw จะไม่พิมพ์ id Codex เหล่านั้น การอัปโหลดนี้ไม่ได้แทนที่การส่งออก
diagnostics ของ Gateway ภายในเครื่อง

`/codex resume` เขียนไฟล์ sidecar binding เดียวกับที่ harness ใช้สำหรับ
turn ปกติ ในข้อความถัดไป OpenClaw จะ resume เธรด Codex นั้น, ส่งโมเดล OpenClaw
ที่เลือกอยู่ในปัจจุบันเข้า app-server, และคงการเปิดใช้ประวัติแบบขยายไว้

### ตรวจสอบเธรด Codex จาก CLI

วิธีที่เร็วที่สุดในการทำความเข้าใจการรัน Codex ที่ผิดพลาดมักเป็นการเปิดเธรด Codex
แบบเนทีฟโดยตรง:

```sh
codex resume <thread-id>
```

ใช้คำสั่งนี้เมื่อคุณสังเกตเห็นบั๊กในบทสนทนาของช่องทางและต้องการตรวจสอบเซสชัน Codex
ที่มีปัญหา, ดำเนินต่อในเครื่อง, หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือ
หรือเหตุผลบางอย่าง เส้นทางที่ง่ายที่สุดมักคือรัน
`/diagnostics [note]` ก่อน: หลังคุณอนุมัติแล้ว รายงานที่เสร็จจะระบุ
เธรด Codex แต่ละรายการและพิมพ์คำสั่ง `Inspect locally` เช่น
`codex resume <thread-id>` คุณสามารถคัดลอกคำสั่งนั้นลงในเทอร์มินัลได้โดยตรง

คุณยังสามารถรับ id เธรดจาก `/codex binding` สำหรับแชตปัจจุบัน หรือ
`/codex threads [filter]` สำหรับเธรด Codex app-server ล่าสุด แล้วรันคำสั่ง
`codex resume` เดียวกันใน shell ของคุณ

พื้นผิวคำสั่งต้องใช้ Codex app-server `0.125.0` หรือใหม่กว่า เมธอดควบคุมแต่ละรายการ
จะถูกรายงานเป็น `unsupported by this Codex app-server` หาก app-server ในอนาคต
หรือแบบกำหนดเองไม่ได้เปิดเผยเมธอด JSON-RPC นั้น

## ขอบเขตของ hook

Codex harness มี hook สามชั้น:

| ชั้น                                  | เจ้าของ                   | วัตถุประสงค์                                                           |
| ------------------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| hook ของ OpenClaw plugin              | OpenClaw                  | ความเข้ากันได้ของผลิตภัณฑ์/Plugin ระหว่าง PI และ Codex harnesses       |
| middleware ส่วนขยายของ Codex app-server | Plugin ที่รวมมากับ OpenClaw | พฤติกรรม adapter ต่อ turn รอบเครื่องมือไดนามิกของ OpenClaw              |
| hook เนทีฟของ Codex                   | Codex                     | วงจรชีวิต Codex ระดับล่างและนโยบายเครื่องมือเนทีฟจาก config ของ Codex |

OpenClaw ไม่ใช้ไฟล์ `hooks.json` ระดับโปรเจกต์หรือ global ของ Codex เพื่อกำหนดเส้นทาง
พฤติกรรม OpenClaw plugin สำหรับ bridge เครื่องมือเนทีฟและสิทธิ์ที่รองรับ
OpenClaw จะ inject config Codex ต่อเธรดสำหรับ `PreToolUse`, `PostToolUse`,
`PermissionRequest`, และ `Stop` hook อื่นของ Codex เช่น `SessionStart` และ
`UserPromptSubmit` ยังคงเป็นคอนโทรลระดับ Codex; ไม่ได้เปิดเผยเป็น
hook ของ OpenClaw plugin ในสัญญา v1

สำหรับเครื่องมือไดนามิกของ OpenClaw, OpenClaw จะเรียกใช้เครื่องมือหลังจาก Codex ขอ
การเรียกนั้น ดังนั้น OpenClaw จึง fire พฤติกรรม plugin และ middleware ที่ตนเป็นเจ้าของใน
harness adapter สำหรับเครื่องมือเนทีฟของ Codex, Codex เป็นเจ้าของบันทึกเครื่องมือที่เป็น canonical
OpenClaw สามารถ mirror เหตุการณ์ที่เลือกได้ แต่ไม่สามารถเขียนเธรด Codex แบบเนทีฟใหม่
เว้นแต่ Codex จะเปิดเผยการดำเนินการนั้นผ่าน app-server หรือ callback ของ hook เนทีฟ

การฉาย Compaction และวงจรชีวิต LLM มาจาก notification ของ Codex app-server
และสถานะ adapter ของ OpenClaw ไม่ใช่คำสั่ง hook เนทีฟของ Codex
เหตุการณ์ `before_compaction`, `after_compaction`, `llm_input`, และ
`llm_output` ของ OpenClaw เป็นการสังเกตระดับ adapter ไม่ใช่การจับ payload
คำขอหรือ Compaction ภายในของ Codex แบบ byte-for-byte

notification `hook/started` และ `hook/completed` ของ Codex native ใน app-server
จะถูกฉายเป็นเหตุการณ์ agent `codex_app_server.hook` สำหรับ trajectory และการดีบัก
เหตุการณ์เหล่านี้ไม่ได้เรียกใช้ hook ของ OpenClaw plugin

## สัญญาการรองรับ V1

โหมด Codex ไม่ใช่ PI ที่เพียงเปลี่ยนการเรียกโมเดลด้านล่าง Codex เป็นเจ้าของ
native model loop มากกว่า และ OpenClaw ปรับพื้นผิว plugin และเซสชัน
รอบขอบเขตนั้น

รองรับใน Codex runtime v1:

| พื้นผิว                                      | การรองรับ                                | เหตุผล                                                                                                                                                                                                  |
| --------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI model loop ผ่าน Codex                  | รองรับ                                   | Codex app-server เป็นเจ้าของ turn ของ OpenAI, การ resume เธรดเนทีฟ, และการดำเนินเครื่องมือเนทีฟต่อ                                                                                                  |
| การกำหนดเส้นทางและการส่งมอบของช่องทาง OpenClaw | รองรับ                                   | Telegram, Discord, Slack, WhatsApp, iMessage, และช่องทางอื่นยังอยู่นอก model runtime                                                                                                                   |
| เครื่องมือไดนามิกของ OpenClaw                | รองรับ                                   | Codex ขอให้ OpenClaw เรียกใช้เครื่องมือเหล่านี้ ดังนั้น OpenClaw ยังอยู่ในเส้นทางการทำงาน                                                                                                             |
| Prompt และ context plugins                    | รองรับ                                   | OpenClaw สร้าง prompt overlay และฉาย context เข้า turn ของ Codex ก่อนเริ่มหรือ resume เธรด                                                                                                            |
| วงจรชีวิตของ context engine                  | รองรับ                                   | การประกอบ, ingest หรือ maintenance หลัง turn, และการประสาน Compaction ของ context-engine ทำงานสำหรับ turn ของ Codex                                                                                   |
| Hook เครื่องมือไดนามิก                       | รองรับ                                   | `before_tool_call`, `after_tool_call`, และ middleware ผลลัพธ์เครื่องมือทำงานรอบเครื่องมือไดนามิกที่ OpenClaw เป็นเจ้าของ                                                                               |
| Hook วงจรชีวิต                               | รองรับเป็นการสังเกตของ adapter           | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, และ `after_compaction` fire ด้วย payload โหมด Codex ที่ตรงไปตรงมา                                                                         |
| Final-answer revision gate                    | รองรับผ่าน native hook relay             | Codex `Stop` ถูก relay ไปยัง `before_agent_finalize`; `revise` ขอให้ Codex ทำ model pass เพิ่มอีกครั้งก่อน finalization                                                                               |
| บล็อกหรือสังเกต shell, patch, และ MCP แบบเนทีฟ | รองรับผ่าน native hook relay             | Codex `PreToolUse` และ `PostToolUse` ถูก relay สำหรับพื้นผิวเครื่องมือเนทีฟที่ committed รวมถึง payload MCP บน Codex app-server `0.125.0` หรือใหม่กว่า รองรับการบล็อก; ไม่รองรับการเขียน argument ใหม่ |
| นโยบายสิทธิ์แบบเนทีฟ                         | รองรับผ่าน native hook relay             | Codex `PermissionRequest` สามารถถูกกำหนดเส้นทางผ่านนโยบาย OpenClaw เมื่อ runtime เปิดเผยให้ใช้ หาก OpenClaw ไม่ส่ง decision กลับ Codex จะดำเนินต่อผ่าน guardian ปกติหรือเส้นทางอนุมัติของผู้ใช้     |
| การจับ trajectory ของ app-server              | รองรับ                                   | OpenClaw บันทึกคำขอที่ส่งไปยัง app-server และ notification ของ app-server ที่ได้รับ                                                                                                                    |

ไม่รองรับใน Codex runtime v1:

| พื้นผิว                                             | ขอบเขต V1                                                                                                                                     | เส้นทางในอนาคต                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| การกลายพันธุ์อาร์กิวเมนต์ของเครื่องมือเนทีฟ                       | hook ก่อนใช้เครื่องมือแบบเนทีฟของ Codex สามารถบล็อกได้ แต่ OpenClaw จะไม่เขียนอาร์กิวเมนต์เครื่องมือแบบเนทีฟของ Codex ใหม่                                               | ต้องมีการรองรับ hook/schema ของ Codex สำหรับอินพุตเครื่องมือทดแทน                            |
| ประวัติทรานสคริปต์แบบเนทีฟของ Codex ที่แก้ไขได้            | Codex เป็นเจ้าของประวัติเธรดแบบเนทีฟที่เป็นข้อมูลหลัก OpenClaw เป็นเจ้าของสำเนาและสามารถฉายบริบทในอนาคตได้ แต่ไม่ควรแก้ไข internals ที่ไม่รองรับ | เพิ่ม API ของแอปเซิร์ฟเวอร์ Codex อย่างชัดเจน หากจำเป็นต้องผ่าตัดเธรดแบบเนทีฟ                    |
| `tool_result_persist` สำหรับเรกคอร์ดเครื่องมือแบบเนทีฟของ Codex | hook นั้นแปลงการเขียนทรานสคริปต์ที่ OpenClaw เป็นเจ้าของ ไม่ใช่เรกคอร์ดเครื่องมือแบบเนทีฟของ Codex                                                           | อาจทำสำเนาเรกคอร์ดที่แปลงแล้วได้ แต่การเขียนข้อมูลหลักใหม่ต้องได้รับการรองรับจาก Codex              |
| เมทาดาทา Compaction แบบเนทีฟที่สมบูรณ์                     | OpenClaw สังเกตเห็นการเริ่มและการเสร็จสิ้น Compaction แต่ไม่ได้รับรายการที่เก็บไว้/ทิ้งไปที่เสถียร, token delta หรือ payload สรุป            | ต้องมีเหตุการณ์ Compaction ของ Codex ที่สมบูรณ์ยิ่งขึ้น                                                     |
| การแทรกแซง Compaction                             | hook Compaction ของ OpenClaw ปัจจุบันอยู่ระดับการแจ้งเตือนในโหมด Codex                                                                         | เพิ่ม hook ก่อน/หลัง Compaction ของ Codex หาก Plugin จำเป็นต้องยับยั้งหรือเขียน Compaction แบบเนทีฟใหม่ |
| การจับคำขอ API ของโมเดลแบบ byte-for-byte             | OpenClaw สามารถจับคำขอและการแจ้งเตือนของแอปเซิร์ฟเวอร์ได้ แต่ core ของ Codex สร้างคำขอ OpenAI API สุดท้ายภายใน                      | ต้องมีเหตุการณ์ติดตามคำขอโมเดลของ Codex หรือ API สำหรับดีบัก                                   |

## เครื่องมือ สื่อ และ Compaction

harness ของ Codex เปลี่ยนเฉพาะตัวดำเนินการเอเจนต์แบบฝังตัวระดับต่ำเท่านั้น

OpenClaw ยังคงสร้างรายการเครื่องมือและรับผลลัพธ์เครื่องมือแบบไดนามิกจาก
harness ข้อความ รูปภาพ วิดีโอ เพลง TTS การอนุมัติ และเอาต์พุตของเครื่องมือส่งข้อความ
ยังคงผ่านเส้นทางการส่งมอบตามปกติของ OpenClaw

relay hook แบบเนทีฟตั้งใจให้เป็นแบบทั่วไป แต่สัญญาการรองรับ v1
จำกัดอยู่ที่เส้นทางเครื่องมือและสิทธิ์แบบเนทีฟของ Codex ที่ OpenClaw ทดสอบ ใน
รันไทม์ Codex ซึ่งรวมถึง payload ของ shell, patch และ MCP `PreToolUse`,
`PostToolUse` และ `PermissionRequest` อย่าสันนิษฐานว่าเหตุการณ์ hook ของ
Codex ทุกอย่างในอนาคตเป็นพื้นผิว Plugin ของ OpenClaw จนกว่าสัญญารันไทม์จะระบุ
ชื่อไว้

สำหรับ `PermissionRequest` OpenClaw จะส่งคืนเฉพาะการตัดสินใจอนุญาตหรือปฏิเสธอย่างชัดเจน
เมื่อ policy ตัดสิน ผลลัพธ์ที่ไม่มีการตัดสินใจไม่ใช่การอนุญาต Codex ถือว่านั่นเป็นการไม่มี
การตัดสินใจจาก hook และไหลต่อไปยัง guardian หรือเส้นทางอนุมัติจากผู้ใช้ของตัวเอง

การขออนุมัติเครื่องมือ MCP ของ Codex จะถูกส่งผ่าน flow การอนุมัติของ Plugin
ของ OpenClaw เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"` prompt ของ Codex `request_user_input` จะถูกส่งกลับไปยัง
แชตต้นทาง และข้อความติดตามผลที่อยู่คิวถัดไปจะตอบคำขอของเซิร์ฟเวอร์เนทีฟนั้น
แทนที่จะถูกนำไปเป็นบริบทเพิ่มเติม คำขอ elicitation ของ MCP อื่น ๆ ยังคงล้มเหลวแบบปิด

การบังคับทิศทางคิวของ run ที่กำลังทำงานอยู่แมปไปยัง `turn/steer` ของแอปเซิร์ฟเวอร์ Codex ด้วย
ค่าเริ่มต้น `messages.queue.mode: "steer"` OpenClaw จะรวมข้อความแชตที่อยู่ในคิว
สำหรับช่วง quiet window ที่กำหนดค่าไว้ และส่งเป็นคำขอ `turn/steer` หนึ่งรายการตาม
ลำดับที่มาถึง โหมด `queue` แบบเดิมจะส่งคำขอ `turn/steer` แยกกัน turn สำหรับ review
และ Compaction แบบแมนนวลของ Codex สามารถปฏิเสธการบังคับทิศทางใน turn เดียวกันได้ ซึ่งในกรณีนั้น
OpenClaw จะใช้คิวติดตามผลเมื่อโหมดที่เลือกอนุญาตให้ fallback ดู
[คิวการบังคับทิศทาง](/th/concepts/queue-steering)

เมื่อโมเดลที่เลือกใช้ harness ของ Codex จะมอบหมาย Compaction ของเธรดแบบเนทีฟ
ให้แอปเซิร์ฟเวอร์ Codex OpenClaw เก็บสำเนาทรานสคริปต์ไว้สำหรับประวัติช่องทาง
การค้นหา `/new`, `/reset` และการสลับโมเดลหรือ harness ในอนาคต สำเนานี้
รวม prompt ของผู้ใช้ ข้อความผู้ช่วยสุดท้าย และเรกคอร์ด reasoning หรือ plan ของ Codex แบบเบา
เมื่อแอปเซิร์ฟเวอร์ปล่อยออกมา ปัจจุบัน OpenClaw บันทึกเฉพาะสัญญาณเริ่มและเสร็จสิ้น
Compaction แบบเนทีฟเท่านั้น ยังไม่ได้เปิดเผยสรุป Compaction ที่มนุษย์อ่านได้
หรือรายการที่ตรวจสอบได้ว่า Codex เก็บ entry ใดไว้หลัง Compaction

เนื่องจาก Codex เป็นเจ้าของเธรดแบบเนทีฟที่เป็นข้อมูลหลัก `tool_result_persist` จึงยังไม่ได้
เขียนเรกคอร์ดผลลัพธ์เครื่องมือแบบเนทีฟของ Codex ใหม่ในปัจจุบัน มันจะใช้เฉพาะเมื่อ
OpenClaw กำลังเขียนผลลัพธ์เครื่องมือของทรานสคริปต์เซสชันที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่จำเป็นต้องใช้ PI รูปภาพ วิดีโอ เพลง PDF, TTS และการทำความเข้าใจสื่อ
ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็นผู้ให้บริการ `/model` ปกติ:** นี่เป็นสิ่งที่คาดไว้สำหรับ
config ใหม่ เลือกโมเดล `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"` (หรือ ref `codex/*` แบบเดิม), เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ไม่รวม
`codex` หรือไม่

**OpenClaw ใช้ PI แทน Codex:** `agentRuntime.id: "auto"` ยังสามารถใช้ PI เป็น
backend เพื่อความเข้ากันได้เมื่อไม่มี harness ของ Codex รับ run นั้น ตั้งค่า
`agentRuntime.id: "codex"` เพื่อบังคับการเลือก Codex ระหว่างทดสอบ รันไทม์
Codex ที่ถูกบังคับจะล้มเหลวแทนที่จะ fallback ไป PI เมื่อเลือกแอปเซิร์ฟเวอร์ Codex แล้ว
ความล้มเหลวของมันจะแสดงโดยตรง

**แอปเซิร์ฟเวอร์ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้ handshake ของแอปเซิร์ฟเวอร์
รายงานเวอร์ชัน `0.125.0` หรือใหม่กว่า prerelease เวอร์ชันเดียวกันหรือเวอร์ชันที่มี suffix
ของ build เช่น `0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ
protocol floor ที่เสถียร `0.125.0` คือสิ่งที่ OpenClaw ทดสอบ

**การค้นพบโมเดลช้า:** ลด `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิดการค้นพบ

**การขนส่ง WebSocket ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`
และตรวจสอบว่าแอปเซิร์ฟเวอร์ระยะไกลพูด protocol ของแอปเซิร์ฟเวอร์ Codex เวอร์ชันเดียวกัน

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นสิ่งที่คาดไว้ เว้นแต่คุณบังคับ
`agentRuntime.id: "codex"` สำหรับเอเจนต์นั้น หรือเลือก ref
`codex/*` แบบเดิม ref `openai/gpt-*` ปกติและ ref ของผู้ให้บริการอื่นจะยังอยู่บนเส้นทาง
ผู้ให้บริการปกติในโหมด `auto` หากคุณบังคับ `agentRuntime.id: "codex"` ทุก turn แบบฝังตัว
สำหรับเอเจนต์นั้นต้องเป็นโมเดล OpenAI ที่ Codex รองรับ

**Computer Use ติดตั้งแล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงาน
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงอยู่ ให้รีสตาร์ท
gateway เพื่อล้างการลงทะเบียน native hook ที่ค้างอยู่ หาก `computer-use.list_apps`
หมดเวลา ให้รีสตาร์ท Codex Computer Use หรือ Codex Desktop แล้วลองอีกครั้ง

## ที่เกี่ยวข้อง

- [Plugin harness เอเจนต์](/th/plugins/sdk-agent-harness)
- [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [สถานะ](/th/cli/status)
- [hook ของ Plugin](/th/plugins/hooks)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
