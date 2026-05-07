---
read_when:
    - คุณต้องการใช้ชุดเครื่องมือ app-server ของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่าฮาร์เนสของ Codex
    - คุณต้องการให้การปรับใช้แบบ Codex เท่านั้นล้มเหลวแทนที่จะย้อนกลับไปใช้ PI
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่รวมมาให้
title: ฮาร์เนส Codex
x-i18n:
    generated_at: "2026-05-07T01:53:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่มาพร้อมชุดแจกจ่ายช่วยให้ OpenClaw รันเทิร์นเอเจนต์แบบฝังผ่าน
Codex app-server แทน PI harness ในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับต่ำ: การค้นหา
model, การ resume เธรดแบบเนทีฟ, compaction แบบเนทีฟ และการดำเนินการผ่าน app-server
OpenClaw ยังคงเป็นเจ้าของช่องแชท, ไฟล์เซสชัน, การเลือก model, tools,
approvals, การส่งสื่อ และมิเรอร์ transcript ที่มองเห็นได้

เมื่อเทิร์นแชทต้นทางรันผ่าน Codex harness คำตอบที่มองเห็นได้จะใช้ค่าเริ่มต้นเป็น
tool `message` ของ OpenClaw หาก deployment ยังไม่ได้กำหนดค่า
`messages.visibleReplies` อย่างชัดเจน เอเจนต์ยังคงจบเทิร์น Codex แบบส่วนตัวได้;
เอเจนต์จะโพสต์ไปยังช่องเฉพาะเมื่อเรียก `message(action="send")` เท่านั้น ตั้งค่า
`messages.visibleReplies: "automatic"` เพื่อให้คำตอบสุดท้ายของแชทโดยตรงอยู่บน
เส้นทางการส่งอัตโนมัติแบบเดิมต่อไป

เทิร์น Heartbeat ของ Codex ยังได้รับ tool `heartbeat_respond` เป็นค่าเริ่มต้นด้วย
ดังนั้นเอเจนต์จึงบันทึกได้ว่าการปลุกควรเงียบไว้หรือแจ้งเตือน โดยไม่ต้องเข้ารหัส
โฟลว์ควบคุมนั้นในข้อความสุดท้าย

คำแนะนำ initiative เฉพาะ Heartbeat จะถูกส่งเป็นคำสั่ง developer ของโหมดการทำงานร่วมกัน
ของ Codex ในเทิร์น Heartbeat นั้นเอง เทิร์นแชทธรรมดาจะกู้คืนโหมด Codex Default
แทนที่จะพกปรัชญา Heartbeat ไว้ใน prompt runtime ปกติ

หากคุณกำลังพยายามทำความเข้าใจภาพรวม ให้เริ่มจาก
[รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) สรุปสั้น ๆ คือ:
`openai/gpt-5.5` คือ model ref, `codex` คือ runtime และ Telegram,
Discord, Slack หรือช่องอื่นยังคงเป็นพื้นผิวการสื่อสาร

## การกำหนดค่าอย่างรวดเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ "Codex ใน OpenClaw" ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
การสมัครสมาชิก ChatGPT/Codex จากนั้นรันเทิร์นเอเจนต์แบบฝังผ่าน runtime
Codex app-server แบบเนทีฟ model ref ยังคงเป็นมาตรฐานในรูป `openai/gpt-*`;
auth ของการสมัครสมาชิกมาจากบัญชี/โปรไฟล์ Codex ไม่ใช่จาก prefix model
`openai-codex/*`

ก่อนอื่นให้ลงชื่อเข้าใช้ด้วย Codex OAuth หากคุณยังไม่ได้ทำ:

```bash
openclaw models auth login --provider openai-codex
```

จากนั้นเปิดใช้ Plugin `codex` ที่มาพร้อมชุดแจกจ่ายและบังคับใช้ Codex runtime:

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

หากการกำหนดค่าของคุณใช้ `plugins.allow` ให้ใส่ `codex` ไว้ในนั้นด้วย:

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

อย่าใช้ `openai-codex/gpt-*` ในการกำหนดค่า prefix นั้นเป็นเส้นทางเดิมที่
`openclaw doctor --fix` เขียนใหม่เป็น `openai/gpt-*` ครอบคลุม model หลัก,
fallback, การ override ของ heartbeat/subagent/compaction, hooks, การ override ช่อง,
และ route pin ของเซสชันที่ persist ไว้และล้าสมัย

## Plugin นี้เปลี่ยนอะไร

Plugin `codex` ที่มาพร้อมชุดแจกจ่ายเพิ่มความสามารถแยกกันหลายอย่าง:

| ความสามารถ                        | วิธีใช้ของคุณ                                      | สิ่งที่ทำ                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime แบบฝังเนทีฟ           | `agentRuntime.id: "codex"`                          | รันเทิร์นเอเจนต์แบบฝังของ OpenClaw ผ่าน Codex app-server                  |
| คำสั่งควบคุมแชทแบบเนทีฟ      | `/codex bind`, `/codex resume`, `/codex steer`, ... | bind และควบคุมเธรด Codex app-server จากบทสนทนาในระบบข้อความ    |
| Provider/catalog ของ Codex app-server | ภายใน `codex` ที่แสดงผ่าน harness     | ให้ runtime ค้นหาและตรวจสอบ model ของ app-server ได้                     |
| เส้นทางทำความเข้าใจสื่อของ Codex    | เส้นทางความเข้ากันได้ของ image-model `codex/*`           | รันเทิร์น Codex app-server แบบจำกัดขอบเขตสำหรับ model ทำความเข้าใจรูปภาพที่รองรับ |
| Hook relay แบบเนทีฟ                 | Hook ของ Plugin รอบเหตุการณ์ Codex-native             | ให้ OpenClaw สังเกต/บล็อกเหตุการณ์ tool/finalization แบบ Codex-native ที่รองรับได้  |

การเปิดใช้ Plugin ทำให้ความสามารถเหล่านั้นพร้อมใช้งาน แต่ **ไม่ได้**:

- เริ่มใช้ Codex สำหรับ OpenAI model ทุกตัว
- แปลง model ref `openai-codex/*` เป็น runtime แบบเนทีฟโดยไม่มี doctor
  ตรวจสอบว่า Codex ถูกติดตั้ง, เปิดใช้, เพิ่ม harness `codex`,
  และพร้อมใช้ OAuth แล้ว
- ทำให้ ACP/acpx เป็นเส้นทาง Codex เริ่มต้น
- hot-switch เซสชันที่มีอยู่ซึ่งบันทึก PI runtime ไว้แล้ว
- แทนที่การส่งผ่านช่องของ OpenClaw, ไฟล์เซสชัน, พื้นที่จัดเก็บ auth-profile หรือ
  การกำหนดเส้นทางข้อความ

Plugin เดียวกันนี้ยังเป็นเจ้าของพื้นผิวคำสั่งควบคุมแชท `/codex` แบบเนทีฟด้วย หาก
เปิดใช้ Plugin และผู้ใช้ขอ bind, resume, steer, stop หรือตรวจสอบ
เธรด Codex จากแชท เอเจนต์ควรเลือกใช้ `/codex ...` แทน ACP โดย ACP ยังคง
เป็น fallback ที่ชัดเจนเมื่อผู้ใช้ขอ ACP/acpx หรือกำลังทดสอบ ACP
Codex adapter

เทิร์น Codex แบบเนทีฟยังคงใช้ hook ของ Plugin OpenClaw เป็นเลเยอร์ความเข้ากันได้สาธารณะ
สิ่งเหล่านี้เป็น hook ของ OpenClaw ใน process ไม่ใช่ command hook `hooks.json` ของ Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` สำหรับระเบียน transcript ที่มิเรอร์
- `before_agent_finalize` ผ่าน relay `Stop` ของ Codex
- `agent_end`

Plugin ยังสามารถลงทะเบียน middleware ผลลัพธ์ tool ที่ไม่ผูกกับ runtime เพื่อเขียนใหม่
ผลลัพธ์ tool แบบไดนามิกของ OpenClaw หลังจาก OpenClaw ดำเนินการ tool และก่อนที่
ผลลัพธ์จะถูกส่งกลับไปยัง Codex สิ่งนี้แยกจาก hook Plugin สาธารณะ
`tool_result_persist` ซึ่งแปลงการเขียนผลลัพธ์ tool ลง transcript ที่ OpenClaw เป็นเจ้าของ

สำหรับ semantic ของ hook Plugin เอง โปรดดู [Hook ของ Plugin](/th/plugins/hooks)
และ [พฤติกรรม guard ของ Plugin](/th/tools/plugin)

Harness ปิดอยู่โดยค่าเริ่มต้น การกำหนดค่าใหม่ควรคง OpenAI model ref
มาตรฐานเป็น `openai/gpt-*` และบังคับใช้อย่างชัดเจนด้วย
`agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` เมื่อ
ต้องการการดำเนินการผ่าน app-server แบบเนทีฟ model ref เดิม `codex/*` ยัง auto-select
harness เพื่อความเข้ากันได้ แต่ prefix provider เดิมที่มี runtime รองรับจะ
ไม่แสดงเป็นตัวเลือก model/provider ปกติ

หากเส้นทาง model ที่กำหนดค่าไว้ยังเป็น `openai-codex/*`, `openclaw doctor --fix`
จะเขียนใหม่เป็น `openai/*` สำหรับเส้นทางเอเจนต์ที่ตรงกัน จะตั้งค่า agent runtime
เป็น `codex` เฉพาะเมื่อ Plugin Codex ติดตั้งแล้ว, เปิดใช้แล้ว, เพิ่ม
harness `codex` และมี OAuth ที่ใช้งานได้; มิฉะนั้นจะตั้งค่า runtime เป็น `pi`

## แผนที่เส้นทาง

ใช้ตารางนี้ก่อนเปลี่ยนการกำหนดค่า:

| พฤติกรรมที่ต้องการ                                     | Model ref                  | การกำหนดค่า runtime                         | เส้นทาง auth/profile           | ป้ายสถานะที่คาดไว้          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| การสมัครสมาชิก ChatGPT/Codex พร้อม Codex runtime แบบเนทีฟ | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth หรือบัญชี Codex | `Runtime: OpenAI Codex`        |
| OpenAI API ผ่าน runner ปกติของ OpenClaw            | `openai/gpt-*`             | ละไว้ หรือ `runtime: "pi"`             | OpenAI API key               | `Runtime: OpenClaw Pi Default` |
| การกำหนดค่าเดิมที่ต้องซ่อมด้วย doctor               | `openai-codex/gpt-*`       | ซ่อมเป็น `codex` หรือ `pi`            | auth ที่กำหนดค่าไว้อยู่แล้ว     | ตรวจสอบใหม่หลัง `doctor --fix`   |
| Provider ผสมพร้อมโหมด auto แบบอนุรักษ์นิยม          | ref เฉพาะ provider     | `agentRuntime.id: "auto"`              | ตาม provider ที่เลือก        | ขึ้นอยู่กับ runtime ที่เลือก    |
| เซสชัน Codex ACP adapter แบบชัดเจน                   | ขึ้นอยู่กับ prompt/model ของ ACP | `sessions_spawn` พร้อม `runtime: "acp"` | auth ของ backend ACP             | สถานะ task/session ของ ACP        |

การแยกที่สำคัญคือ provider เทียบกับ runtime:

- `openai-codex/*` คือเส้นทางเดิมที่ doctor เขียนใหม่
- `agentRuntime.id: "codex"` ต้องใช้ Codex harness และปิดแบบปลอดภัยหาก
  ไม่พร้อมใช้งาน
- `agentRuntime.id: "auto"` ให้ harness ที่ลงทะเบียนไว้ claim เส้นทาง provider
  ที่ตรงกัน แต่ ref OpenAI มาตรฐานยังคงเป็นของ PI เว้นแต่ harness จะรองรับ
  คู่ provider/model นั้น
- `/codex ...` ตอบคำถามว่า "บทสนทนา Codex แบบเนทีฟใดควรให้แชทนี้ bind
  หรือควบคุม?"
- ACP ตอบคำถามว่า "process harness ภายนอกใดควรให้ acpx เปิดใช้?"

## เลือก prefix model ที่ถูกต้อง

เส้นทางตระกูล OpenAI เฉพาะตาม prefix สำหรับการตั้งค่าทั่วไปที่ใช้การสมัครสมาชิกบวก
Codex runtime แบบเนทีฟ ให้ใช้ `openai/*` พร้อม `agentRuntime.id: "codex"`
ให้ถือว่า `openai-codex/*` เป็นการกำหนดค่าเดิมที่ doctor ควรเขียนใหม่:

| Model ref                                     | เส้นทาง runtime                                 | ใช้เมื่อ                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI provider ผ่าน plumbing ของ OpenClaw/PI | คุณต้องการเข้าถึง OpenAI Platform API โดยตรงในปัจจุบันด้วย `OPENAI_API_KEY` |
| `openai-codex/gpt-5.5`                        | เส้นทางเดิมที่ doctor ซ่อม              | คุณอยู่บนการกำหนดค่าเก่า; รัน `openclaw doctor --fix` เพื่อเขียนใหม่         |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | คุณต้องการ auth การสมัครสมาชิก ChatGPT/Codex พร้อมการดำเนินการ Codex แบบเนทีฟ     |

GPT-5.5 อาจปรากฏได้ทั้งบนเส้นทาง OpenAI API-key โดยตรงและเส้นทางการสมัครสมาชิก Codex
เมื่อบัญชีของคุณเปิดเผยเส้นทางเหล่านั้น ใช้ `openai/gpt-5.5` พร้อม Codex app-server
harness สำหรับ Codex runtime แบบเนทีฟ หรือ `openai/gpt-5.5` โดยไม่มีการ override
Codex runtime สำหรับทราฟฟิก API-key โดยตรง

Ref เดิม `codex/gpt-*` ยังคงรับเป็น alias เพื่อความเข้ากันได้ การ migration
เพื่อความเข้ากันได้ของ doctor จะเขียน runtime ref เดิมเป็น model ref มาตรฐาน
และบันทึกนโยบาย runtime แยกต่างหาก การกำหนดค่า native app-server harness ใหม่
ควรใช้ `openai/gpt-*` พร้อม `agentRuntime.id: "codex"`

`agents.defaults.imageModel` ใช้การแยก prefix แบบเดียวกัน ใช้
`openai/gpt-*` สำหรับเส้นทาง OpenAI ปกติ และ `codex/gpt-*` เมื่อการทำความเข้าใจรูปภาพ
ควรรันผ่านเทิร์น Codex app-server แบบจำกัดขอบเขต อย่าใช้
`openai-codex/gpt-*`; doctor จะเขียน prefix เดิมนั้นใหม่เป็น `openai/gpt-*` โดย
model ของ Codex app-server ต้องประกาศว่ารองรับอินพุตรูปภาพ; model Codex แบบ text-only
จะล้มเหลวก่อนที่เทิร์นสื่อจะเริ่ม

ใช้ `/status` เพื่อยืนยัน harness ที่มีผลสำหรับเซสชันปัจจุบัน หากการเลือก
ดูน่าประหลาดใจ ให้เปิด debug logging สำหรับ subsystem `agents/harness`
และตรวจสอบระเบียนแบบมีโครงสร้าง `agent harness selected` ของ gateway ซึ่ง
รวม id ของ harness ที่เลือก, เหตุผลการเลือก, นโยบาย runtime/fallback และ,
ในโหมด `auto`, ผลการรองรับของ candidate แต่ละตัวจาก Plugin

### คำเตือนของ doctor หมายความว่าอะไร

`openclaw doctor` เตือนเมื่อ model ref ที่กำหนดค่าไว้หรือสถานะเส้นทางเซสชันที่ persist
ไว้ยังใช้ `openai-codex/*` อยู่ `openclaw doctor --fix` เขียนเส้นทางเหล่านั้นใหม่เป็น:

- `openai/<model>`
- `agentRuntime.id: "codex"` เมื่อ Codex ติดตั้งแล้ว, เปิดใช้แล้ว, เพิ่ม
  harness `codex` และมี OAuth ที่ใช้งานได้
- `agentRuntime.id: "pi"` มิฉะนั้น

เส้นทาง `codex` บังคับใช้ Codex harness แบบเนทีฟ เส้นทาง `pi` ทำให้
เอเจนต์อยู่บน runner เริ่มต้นของ OpenClaw แทนที่จะเปิดใช้หรือติดตั้ง Codex เป็น
ผลข้างเคียงของการล้างเส้นทางเดิม
Doctor ยังซ่อม pin เซสชันที่ persist ไว้และล้าสมัยใน store เซสชันเอเจนต์ที่ค้นพบ
เพื่อให้บทสนทนาเก่าไม่ติดค้างบนเส้นทางที่ถูกนำออกไป

การเลือก harness ไม่ใช่การควบคุมเซสชันแบบสด เมื่อเทิร์นแบบ embedded ทำงาน
OpenClaw จะบันทึก id ของ harness ที่เลือกไว้ในเซสชันนั้นและใช้ต่อไปสำหรับ
เทิร์นถัดไปใน session id เดียวกัน เปลี่ยนการตั้งค่า `agentRuntime` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อคุณต้องการให้เซสชันในอนาคตใช้ harness อื่น;
ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับบทสนทนาที่มีอยู่
ระหว่าง PI และ Codex วิธีนี้ช่วยหลีกเลี่ยงการเล่น transcript เดียวซ้ำผ่าน
ระบบเซสชัน native สองระบบที่เข้ากันไม่ได้

เซสชัน legacy ที่สร้างก่อนมีการ pin harness จะถูกถือว่า pin กับ PI เมื่อมี
ประวัติ transcript แล้ว ใช้ `/new` หรือ `/reset` เพื่อเลือกให้บทสนทนานั้นใช้
Codex หลังจากเปลี่ยนการตั้งค่า

`/status` แสดง runtime ของโมเดลที่มีผลอยู่ harness PI เริ่มต้นจะแสดงเป็น
`Runtime: OpenClaw Pi Default` และ harness app-server ของ Codex จะแสดงเป็น
`Runtime: OpenAI Codex`

## ข้อกำหนด

- OpenClaw พร้อม Plugin `codex` ที่ bundled ไว้และพร้อมใช้งาน
- Codex app-server `0.125.0` หรือใหม่กว่า โดยค่าเริ่มต้น Plugin ที่ bundled ไว้จะจัดการไบนารี
  Codex app-server ที่เข้ากันได้ ดังนั้นคำสั่ง `codex` ภายในเครื่องบน `PATH` จะ
  ไม่กระทบต่อการเริ่ม harness ตามปกติ
- auth ของ Codex พร้อมใช้งานสำหรับ process ของ app-server หรือสำหรับ auth bridge ของ Codex
  ใน OpenClaw การเปิด app-server แบบ local ใช้ Codex home ที่ OpenClaw จัดการสำหรับแต่ละ
  agent และ child `HOME` ที่แยกออกมา ดังนั้นโดยค่าเริ่มต้นจะไม่อ่านบัญชี
  `~/.codex`, skills, plugins, config, thread state หรือ
  `$HOME/.agents/skills` native ส่วนตัวของคุณ

Plugin จะบล็อก handshake ของ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน วิธีนี้ทำให้
OpenClaw อยู่บนพื้นผิว protocol ที่ผ่านการทดสอบแล้ว

สำหรับ smoke test แบบ live และ Docker โดยปกติ auth จะมาจากบัญชี Codex CLI
หรือ auth profile `openai-codex` ของ OpenClaw การเปิด stdio app-server แบบ local ยังสามารถ
fallback ไปใช้ `CODEX_API_KEY` / `OPENAI_API_KEY` ได้เมื่อไม่มีบัญชีอยู่

## ไฟล์ bootstrap ของ workspace

Codex จัดการ `AGENTS.md` เองผ่านการค้นพบ project-doc แบบ native OpenClaw
ไม่เขียนไฟล์ project-doc ของ Codex แบบสังเคราะห์หรือพึ่งพาชื่อไฟล์ fallback
ของ Codex สำหรับไฟล์ persona เพราะ fallback ของ Codex ใช้เฉพาะเมื่อ
ไม่มี `AGENTS.md`

เพื่อให้ workspace ของ OpenClaw มี parity กัน harness ของ Codex จะ resolve ไฟล์ bootstrap
อื่นๆ (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` และ `MEMORY.md` เมื่อมีอยู่) และส่งต่อผ่านคำสั่ง developer ของ Codex
บน `thread/start` และ `thread/resume` วิธีนี้ทำให้ `SOUL.md` และบริบท
persona/profile ของ workspace ที่เกี่ยวข้องมองเห็นได้บนเลนกำหนดพฤติกรรมของ Codex
แบบ native โดยไม่ทำซ้ำ `AGENTS.md`

## เพิ่ม Codex ควบคู่กับโมเดลอื่น

อย่าตั้ง `agentRuntime.id: "codex"` แบบ global หาก agent เดียวกันควรสลับได้อย่างอิสระ
ระหว่าง Codex และโมเดล provider ที่ไม่ใช่ Codex runtime ที่บังคับใช้จะมีผลกับทุก
เทิร์นแบบ embedded สำหรับ agent หรือเซสชันนั้น หากคุณเลือกโมเดล Anthropic ในขณะที่
runtime นั้นถูกบังคับอยู่ OpenClaw จะยังพยายามใช้ harness ของ Codex และ fail closed
แทนที่จะ route เทิร์นนั้นผ่าน PI แบบเงียบๆ

ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้แทน:

- วาง Codex ไว้บน agent เฉพาะด้วย `agentRuntime.id: "codex"`
- ให้ agent เริ่มต้นใช้ `agentRuntime.id: "auto"` และ PI fallback สำหรับการใช้งาน
  provider แบบผสมตามปกติ
- ใช้ refs แบบ legacy `codex/*` เพื่อความเข้ากันได้เท่านั้น config ใหม่ควรเลือกใช้
  `openai/*` พร้อมนโยบาย runtime ของ Codex ที่ระบุชัดเจน

ตัวอย่างนี้ทำให้ agent เริ่มต้นใช้การเลือกอัตโนมัติตามปกติและ
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

- agent `main` เริ่มต้นใช้ path ของ provider ตามปกติและ PI compatibility fallback
- agent `codex` ใช้ harness ของ Codex app-server
- หาก Codex ขาดหายไปหรือไม่รองรับสำหรับ agent `codex` เทิร์นจะล้มเหลว
  แทนที่จะใช้ PI แบบเงียบๆ

## การ route คำสั่งของ agent

agent ควร route คำขอของผู้ใช้ตามเจตนา ไม่ใช่แค่ตามคำว่า "Codex" อย่างเดียว:

| ผู้ใช้ขอให้...                                         | agent ควรใช้...                                  |
| ------------------------------------------------------ | ------------------------------------------------ |
| "ผูกแชทนี้กับ Codex"                                  | `/codex bind`                                    |
| "Resume thread Codex `<id>` ที่นี่"                    | `/codex resume <id>`                             |
| "แสดง thread ของ Codex"                               | `/codex threads`                                 |
| "ส่งรายงาน support สำหรับการรัน Codex ที่ผิดพลาด"      | `/diagnostics [note]`                            |
| "ส่ง feedback ของ Codex เฉพาะสำหรับ thread ที่แนบมานี้" | `/codex diagnostics [note]`                      |
| "ใช้ subscription ChatGPT/Codex ของฉันกับ runtime Codex" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "ซ่อม config/session pins เก่า `openai-codex/*`"       | `openclaw doctor --fix`                          |
| "รัน Codex ผ่าน ACP/acpx"                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "เริ่ม Claude Code/Gemini/OpenCode/Cursor ใน thread"   | ACP/acpx ไม่ใช่ `/codex` และไม่ใช่ sub-agents แบบ native |

OpenClaw จะโฆษณาคำแนะนำ ACP spawn ให้ agent เฉพาะเมื่อ ACP เปิดใช้งานอยู่,
dispatch ได้ และมี runtime backend ที่โหลดแล้วรองรับ หาก ACP ไม่พร้อมใช้งาน
system prompt และ Skills ของ Plugin ไม่ควรสอน agent เกี่ยวกับการ route ของ ACP

## การ deploy แบบ Codex-only

บังคับใช้ harness ของ Codex เมื่อคุณต้องพิสูจน์ว่าทุกเทิร์นของ embedded agent
ใช้ Codex runtime ของ Plugin ที่ระบุชัดเจนจะ fail closed และจะไม่ retry
ผ่าน PI แบบเงียบๆ:

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

## Codex ต่อ agent

คุณสามารถทำให้ agent หนึ่งเป็น Codex-only ขณะที่ agent เริ่มต้นยังใช้
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

ใช้คำสั่งเซสชันตามปกติเพื่อสลับ agent และโมเดล `/new` จะสร้างเซสชัน
OpenClaw ใหม่ และ harness ของ Codex จะสร้างหรือ resume thread app-server sidecar
ตามต้องการ `/reset` จะล้างการผูกเซสชัน OpenClaw สำหรับ thread นั้น
และให้เทิร์นถัดไป resolve harness จาก config ปัจจุบันอีกครั้ง

## การค้นพบโมเดล

โดยค่าเริ่มต้น Plugin Codex จะถาม app-server สำหรับโมเดลที่พร้อมใช้งาน หาก
การค้นพบล้มเหลวหรือ timeout จะใช้ catalog fallback ที่ bundled ไว้สำหรับ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

คุณปรับการค้นพบได้ภายใต้ `plugins.entries.codex.config.discovery`:

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

ปิดการค้นพบเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการ probe Codex และใช้
catalog fallback ต่อไป:

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

ไบนารีที่จัดการไว้นี้ถูกจัดส่งมากับ package ของ Plugin `codex` วิธีนี้ทำให้
เวอร์ชันของ app-server ผูกกับ Plugin ที่ bundled ไว้ แทนที่จะขึ้นกับ Codex CLI
แยกต่างหากตัวใดก็ตามที่ติดตั้งในเครื่อง ตั้งค่า `appServer.command` เฉพาะเมื่อ
คุณต้องการรัน executable อื่นโดยตั้งใจเท่านั้น

โดยค่าเริ่มต้น OpenClaw เริ่มเซสชัน harness Codex แบบ local ในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือ posture ของ operator ภายในเครื่องที่เชื่อถือได้ซึ่งใช้
สำหรับ Heartbeat แบบ autonomous: Codex สามารถใช้เครื่องมือ shell และ network ได้โดยไม่
หยุดที่ native approval prompts ซึ่งไม่มีใครอยู่ตอบ

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

โหมด Guardian ใช้เส้นทาง approval แบบ auto-review native ของ Codex เมื่อ Codex ขอ
ออกจาก sandbox, เขียนนอก workspace หรือเพิ่ม permission เช่นการเข้าถึง network
Codex จะ route คำขอ approval นั้นไปยัง reviewer native แทน prompt มนุษย์
reviewer จะใช้กรอบความเสี่ยงของ Codex และอนุมัติหรือปฏิเสธคำขอเฉพาะนั้น
ใช้ Guardian เมื่อคุณต้องการ guardrails มากกว่าโหมด YOLO แต่ยังต้องการให้ agent
ที่ไม่มีคนเฝ้าสามารถคืบหน้าได้

preset `guardian` จะ expand เป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"`
field นโยบายแต่ละรายการยัง override `mode` ได้ ดังนั้น deployment ขั้นสูงสามารถผสม
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

การเปิด stdio app-server จะ inherit environment ของ process OpenClaw โดยค่าเริ่มต้น
แต่ OpenClaw เป็นเจ้าของ bridge บัญชี Codex app-server และตั้งทั้ง
`CODEX_HOME` และ `HOME` เป็น directory ต่อ agent ภายใต้ state ของ OpenClaw
ของ agent นั้น skill loader ของ Codex เองอ่าน `$CODEX_HOME/skills` และ
`$HOME/.agents/skills` ดังนั้นค่าทั้งสองจึงถูกแยกไว้สำหรับการเปิด app-server
แบบ local วิธีนี้ทำให้ skills, plugins, config, accounts และ thread
state แบบ Codex-native ถูก scope กับ agent ของ OpenClaw แทนที่จะรั่วเข้ามาจาก
home ของ Codex CLI ส่วนตัวของ operator

Plugin ของ OpenClaw และ snapshot ของ Skills ของ OpenClaw ยังคงไหลผ่าน registry ของ Plugin
และ skill loader ของ OpenClaw เอง asset ของ Codex CLI ส่วนตัวจะไม่ถูกส่งผ่าน
หากคุณมี skills หรือ plugins ของ Codex CLI ที่มีประโยชน์และควรกลายเป็นส่วนหนึ่งของ agent
OpenClaw ให้ทำ inventory อย่างชัดเจน:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

provider migration ของ Codex จะคัดลอก skills เข้าไปใน workspace ของ agent OpenClaw
ปัจจุบัน plugins, hooks และไฟล์ config native ของ Codex จะถูกรายงานหรือ archive
ไว้ให้ review ด้วยตนเอง แทนที่จะเปิดใช้งานอัตโนมัติ เพราะสิ่งเหล่านี้สามารถ
รันคำสั่ง, expose MCP servers หรือมี credentials ได้

auth จะถูกเลือกตามลำดับนี้:

1. auth profile Codex ของ OpenClaw ที่ระบุชัดเจนสำหรับ agent
2. บัญชีที่มีอยู่ของ app-server ใน Codex home ของ agent นั้น
3. เฉพาะการเปิด stdio app-server แบบ local เท่านั้น, `CODEX_API_KEY`, จากนั้น
   `OPENAI_API_KEY`, เมื่อไม่มีบัญชี app-server อยู่และยังต้องใช้ OpenAI auth

เมื่อ OpenClaw พบโปรไฟล์การยืนยันตัวตน Codex แบบการสมัครสมาชิก ChatGPT จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่ถูกสร้างขึ้น การทำเช่นนี้
ทำให้คีย์ API ระดับ Gateway ยังพร้อมใช้งานสำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้เทิร์น app-server ของ Codex แบบเนทีฟถูกเรียกเก็บเงินผ่าน API โดยไม่ตั้งใจ
โปรไฟล์คีย์ API ของ Codex แบบชัดเจนและ fallback คีย์ env ของ stdio ภายในเครื่องใช้การเข้าสู่ระบบ app-server
แทน env ของกระบวนการลูกที่สืบทอดมา การเชื่อมต่อ app-server ผ่าน WebSocket
จะไม่ได้รับ fallback คีย์ API จาก env ของ Gateway ให้ใช้โปรไฟล์การยืนยันตัวตนแบบชัดเจนหรือบัญชีของ
app-server ระยะไกลเอง

หากการปรับใช้ต้องการการแยก environment เพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นใน
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

`appServer.clearEnv` มีผลเฉพาะกับกระบวนการลูก Codex app-server ที่ถูกสร้างขึ้นเท่านั้น

เครื่องมือแบบไดนามิกของ Codex ใช้โปรไฟล์ `native-first` เป็นค่าเริ่มต้น ในโหมดนั้น
OpenClaw จะไม่เปิดเผยเครื่องมือแบบไดนามิกที่ซ้ำกับการดำเนินการ workspace แบบเนทีฟของ Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` และ
`update_plan` เครื่องมือการผสานรวมของ OpenClaw เช่น การรับส่งข้อความ เซสชัน สื่อ
cron, browser, nodes, gateway, `heartbeat_respond` และ `web_search` ยังพร้อมใช้งาน

ฟิลด์ Plugin Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น          | ความหมาย                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | ใช้ `"openclaw-compat"` เพื่อเปิดเผยชุดเครื่องมือแบบไดนามิกของ OpenClaw ทั้งหมดให้ Codex app-server |
| `codexDynamicToolsExclude` | `[]`             | ชื่อเครื่องมือแบบไดนามิกของ OpenClaw เพิ่มเติมที่จะละเว้นจากเทิร์นของ Codex app-server               |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์               | ค่าเริ่มต้น                                  | ความหมาย                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` สร้าง Codex; `"websocket"` เชื่อมต่อกับ `url`                                                                                                                                                                             |
| `command`           | ไบนารี Codex ที่จัดการให้                     | ไฟล์ปฏิบัติการสำหรับ stdio transport เว้นไว้เพื่อใช้ไบนารีที่จัดการให้ ตั้งค่าเฉพาะเมื่อต้องการ override อย่างชัดเจน                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | อาร์กิวเมนต์สำหรับ stdio transport                                                                                                                                                                                                       |
| `url`               | ไม่ได้ตั้งค่า                                    | URL ของ WebSocket app-server                                                                                                                                                                                                            |
| `authToken`         | ไม่ได้ตั้งค่า                                    | Bearer token สำหรับ WebSocket transport                                                                                                                                                                                                |
| `headers`           | `{}`                                     | header เพิ่มเติมของ WebSocket                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | ชื่อตัวแปร environment เพิ่มเติมที่ถูกลบออกจากกระบวนการ stdio app-server ที่ถูกสร้างขึ้น หลังจาก OpenClaw สร้าง environment ที่สืบทอดมาแล้ว `CODEX_HOME` และ `HOME` ถูกสงวนไว้สำหรับการแยก Codex รายเอเจนต์ของ OpenClaw เมื่อเปิดใช้งานภายในเครื่อง |
| `requestTimeoutMs`  | `60000`                                  | timeout สำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | preset สำหรับการดำเนินการแบบ YOLO หรือแบบตรวจทานโดย guardian                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | นโยบายการอนุมัติ Codex แบบเนทีฟที่ส่งไปยังการเริ่ม/resume/เทิร์นของเธรด                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | โหมด sandbox ของ Codex แบบเนทีฟที่ส่งไปยังการเริ่ม/resume ของเธรด                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทาน prompt การอนุมัติแบบเนทีฟ `guardian_subagent` ยังคงเป็น alias เดิม                                                                                                                         |
| `serviceTier`       | ไม่ได้ตั้งค่า                                    | service tier ของ Codex app-server แบบไม่บังคับ: `"fast"`, `"flex"` หรือ `null` ค่าเดิมที่ไม่ถูกต้องจะถูกเพิกเฉย                                                                                                                            |

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกจาก
`appServer.requestTimeoutMs`: คำขอ `item/tool/call` ของ Codex แต่ละครั้งต้องได้รับ
คำตอบจาก OpenClaw ภายใน 30 วินาที เมื่อ timeout OpenClaw จะยกเลิกสัญญาณเครื่องมือ
เมื่อรองรับ และส่งคืนคำตอบเครื่องมือแบบไดนามิกที่ล้มเหลวไปยัง Codex เพื่อให้
เทิร์นดำเนินต่อได้ แทนที่จะปล่อยให้เซสชันอยู่ใน `processing`

หลังจาก OpenClaw ตอบกลับคำขอ app-server แบบมีขอบเขตตามเทิร์นของ Codex แล้ว harness
ยังคาดหวังให้ Codex จบเทิร์นแบบเนทีฟด้วย `turn/completed` หาก
app-server เงียบไป 60 วินาทีหลังคำตอบนั้น OpenClaw จะพยายามอย่างดีที่สุดเพื่อ
interrupt เทิร์น Codex, บันทึก timeout สำหรับการวินิจฉัย และปล่อย lane เซสชันของ
OpenClaw เพื่อให้ข้อความแชตถัดไปไม่ถูกคิวค้างอยู่หลังเทิร์นเนทีฟที่ค้างอยู่

environment overrides ยังพร้อมใช้งานสำหรับการทดสอบภายในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ข้ามไบนารีที่จัดการให้เมื่อ
`appServer.command` ไม่ได้ตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบภายในเครื่องแบบครั้งเดียว แนะนำให้ใช้ config
สำหรับการปรับใช้ที่ทำซ้ำได้ เพราะช่วยเก็บพฤติกรรมของ Plugin ไว้ในไฟล์ที่ผ่านการตรวจทานเดียวกัน
กับการตั้งค่า harness ของ Codex ส่วนที่เหลือ

## การใช้คอมพิวเตอร์

การใช้คอมพิวเตอร์ครอบคลุมอยู่ในคู่มือการตั้งค่าของตัวเอง:
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use).

สรุปสั้น ๆ: OpenClaw ไม่ได้รวมแอปควบคุมเดสก์ท็อปไว้ในตัวหรือดำเนินการ
บนเดสก์ท็อปเอง แต่จะเตรียม Codex app-server, ตรวจสอบว่า
MCP server ของ `computer-use` พร้อมใช้งาน แล้วให้ Codex จัดการการเรียกเครื่องมือ
MCP แบบเนทีฟระหว่างเทิร์นในโหมด Codex

สำหรับการเข้าถึงไดรเวอร์ TryCua โดยตรงนอก flow ของ marketplace ของ Codex ให้ลงทะเบียน
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

การใช้คอมพิวเตอร์เฉพาะเจาะจงกับ macOS และอาจต้องมีสิทธิ์ OS ภายในเครื่องก่อนที่
MCP server ของ Codex จะควบคุมแอปได้ หาก `computerUse.enabled` เป็น true และ MCP
server ไม่พร้อมใช้งาน เทิร์นในโหมด Codex จะล้มเหลวก่อนเธรดเริ่ม แทนที่จะ
ทำงานต่ออย่างเงียบ ๆ โดยไม่มีเครื่องมือการใช้คอมพิวเตอร์แบบเนทีฟ ดู
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use) สำหรับตัวเลือก marketplace,
ข้อจำกัดของแค็ตตาล็อกระยะไกล, เหตุผลสถานะ และการแก้ไขปัญหา

เมื่อ `computerUse.autoInstall` เป็น true OpenClaw สามารถลงทะเบียน
marketplace มาตรฐานที่ bundle มากับ Codex Desktop จาก
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` หาก Codex
ยังไม่พบ marketplace ภายในเครื่อง ใช้ `/new` หรือ `/reset` หลังจาก
เปลี่ยน runtime หรือ config การใช้คอมพิวเตอร์ เพื่อไม่ให้เซสชันเดิมยังคงเก็บ
binding เธรด PI หรือ Codex เก่าไว้

## สูตรที่ใช้บ่อย

Codex ภายในเครื่องพร้อม stdio transport ค่าเริ่มต้น:

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

การสลับโมเดลยังคงถูกควบคุมโดย OpenClaw เมื่อเซสชัน OpenClaw แนบอยู่กับ
เธรด Codex ที่มีอยู่ เทิร์นถัดไปจะส่งโมเดล
OpenAI, provider, นโยบายการอนุมัติ, sandbox และ service tier ที่เลือกอยู่ในปัจจุบันไปยัง
app-server อีกครั้ง การสลับจาก `openai/gpt-5.5` ไปเป็น `openai/gpt-5.2` จะคง
binding ของเธรดไว้ แต่ขอให้ Codex ดำเนินการต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

Plugin ที่ bundle มาลงทะเบียน `/codex` เป็น slash command ที่ได้รับอนุญาต คำสั่งนี้เป็น
แบบทั่วไปและทำงานได้บนทุกช่องทางที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` แสดงการเชื่อมต่อ app-server สด, โมเดล, บัญชี, ขีดจำกัดอัตราการใช้งาน, เซิร์ฟเวอร์ MCP และ Skills
- `/codex models` แสดงรายการโมเดล Codex app-server แบบสด
- `/codex threads [filter]` แสดงรายการเธรด Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันกับเธรด Codex ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server compact เธรดที่แนบอยู่
- `/codex review` เริ่มการรีวิวแบบ native ของ Codex สำหรับเธรดที่แนบอยู่
- `/codex diagnostics [note]` ขออนุมัติก่อนส่งฟีดแบ็กการวินิจฉัย Codex สำหรับเธรดที่แนบอยู่
- `/codex computer-use status` ตรวจสอบ Plugin Computer Use และเซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้
- `/codex computer-use install` ติดตั้ง Plugin Computer Use ที่กำหนดค่าไว้และโหลดเซิร์ฟเวอร์ MCP ใหม่
- `/codex account` แสดงสถานะบัญชีและขีดจำกัดอัตราการใช้งาน
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของ Codex app-server
- `/codex skills` แสดงรายการ Skills ของ Codex app-server

เมื่อ Codex รายงานความล้มเหลวจากขีดจำกัดการใช้งาน OpenClaw จะรวมเวลารีเซ็ต
app-server ถัดไปเมื่อ Codex ให้ข้อมูลนั้นมา ใช้ `/codex account` ในบทสนทนาเดียวกัน
เพื่อตรวจสอบบัญชีปัจจุบันและช่วงเวลาขีดจำกัดอัตราการใช้งาน

### เวิร์กโฟลว์การดีบักทั่วไป

เมื่อเอเจนต์ที่ใช้ Codex ทำสิ่งที่ไม่คาดคิดใน Telegram, Discord, Slack,
หรือช่องทางอื่น ให้เริ่มจากบทสนทนาที่เกิดปัญหา:

1. เรียกใช้ `/diagnostics bad tool choice after image upload` หรือโน้ตสั้นอื่น
   ที่อธิบายสิ่งที่คุณเห็น
2. อนุมัติคำขอการวินิจฉัยหนึ่งครั้ง การอนุมัติจะสร้างไฟล์ zip การวินิจฉัย Gateway
   ในเครื่อง และเนื่องจากเซสชันกำลังใช้ Codex harness จึงส่งชุดฟีดแบ็ก Codex
   ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
3. คัดลอกการตอบกลับการวินิจฉัยที่เสร็จแล้วลงในรายงานบั๊กหรือเธรดซัพพอร์ต
   ข้อความนั้นมีพาธบันเดิลในเครื่อง, สรุปความเป็นส่วนตัว, รหัสเซสชัน OpenClaw,
   รหัสเธรด Codex และบรรทัด `Inspect locally` สำหรับแต่ละเธรด Codex
4. หากคุณต้องการดีบักการรันด้วยตัวเอง ให้เรียกใช้คำสั่ง `Inspect locally`
   ที่พิมพ์ไว้ในเทอร์มินัล คำสั่งจะมีรูปแบบเช่น `codex resume <thread-id>` และเปิด
   เธรด Codex แบบ native เพื่อให้คุณตรวจสอบบทสนทนา ดำเนินต่อในเครื่อง
   หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือหรือแผนเฉพาะนั้น

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลดฟีดแบ็ก Codex
สำหรับเธรดที่แนบอยู่ในปัจจุบันโดยไม่รวมบันเดิลการวินิจฉัย Gateway ของ OpenClaw
แบบเต็ม สำหรับรายงานซัพพอร์ตส่วนใหญ่ `/diagnostics [note]` เป็นจุดเริ่มต้น
ที่ดีกว่า เพราะรวมสถานะ Gateway ในเครื่องและรหัสเธรด Codex ไว้ในคำตอบเดียวกัน
ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรมแชตกลุ่มฉบับเต็ม

แกนหลักของ OpenClaw ยังเปิดให้ใช้ `/diagnostics [note]` สำหรับเจ้าของเท่านั้น
ในฐานะคำสั่งการวินิจฉัย Gateway ทั่วไป พรอมป์การอนุมัติจะแสดงคำนำเรื่องข้อมูลอ่อนไหว
ลิงก์ไปยัง [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) และขอเรียกใช้
`openclaw gateway diagnostics export --json` ผ่านการอนุมัติ exec อย่างชัดเจน
ทุกครั้ง อย่าอนุมัติการวินิจฉัยด้วยกฎอนุญาตทั้งหมด หลังจากอนุมัติแล้ว
OpenClaw จะส่งรายงานที่วางต่อได้พร้อมพาธบันเดิลในเครื่องและสรุป manifest
เมื่อเซสชัน OpenClaw ที่ใช้งานอยู่ใช้ Codex harness การอนุมัติเดียวกันนั้น
ยังอนุญาตให้ส่งชุดฟีดแบ็ก Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย
พรอมป์การอนุมัติจะบอกว่าจะส่งฟีดแบ็ก Codex แต่จะไม่แสดงรหัสเซสชันหรือเธรด
Codex ก่อนการอนุมัติ

หาก `/diagnostics` ถูกเรียกโดยเจ้าของในแชตกลุ่ม OpenClaw จะรักษาช่องทางร่วม
ให้สะอาด: กลุ่มจะได้รับเพียงประกาศสั้น ๆ ขณะที่คำนำการวินิจฉัย พรอมป์อนุมัติ
และรหัสเซสชัน/เธรด Codex จะถูกส่งถึงเจ้าของผ่านเส้นทางอนุมัติส่วนตัว หากไม่มี
เส้นทางเจ้าของแบบส่วนตัว OpenClaw จะปฏิเสธคำขอกลุ่มและขอให้เจ้าของเรียกใช้จาก DM

การอัปโหลด Codex ที่อนุมัติแล้วเรียก Codex app-server `feedback/upload` และขอให้
app-server รวมบันทึกสำหรับแต่ละเธรดที่ระบุและเธรดย่อย Codex ที่ถูกสร้างขึ้น
เมื่อมีให้ใช้งาน การอัปโหลดจะผ่านเส้นทางฟีดแบ็กปกติของ Codex ไปยังเซิร์ฟเวอร์
OpenAI; หากฟีดแบ็ก Codex ถูกปิดใช้งานใน app-server นั้น คำสั่งจะคืนข้อผิดพลาด
จาก app-server การตอบกลับการวินิจฉัยที่เสร็จแล้วจะแสดงรายการช่องทาง,
รหัสเซสชัน OpenClaw, รหัสเธรด Codex และคำสั่ง `codex resume <thread-id>`
ในเครื่องสำหรับเธรดที่ถูกส่ง หากคุณปฏิเสธหรือเพิกเฉยต่อการอนุมัติ OpenClaw
จะไม่พิมพ์รหัส Codex เหล่านั้น การอัปโหลดนี้ไม่ได้แทนที่การส่งออกการวินิจฉัย
Gateway ในเครื่อง

`/codex resume` เขียนไฟล์ binding sidecar เดียวกับที่ harness ใช้สำหรับเทิร์นปกติ
ในข้อความถัดไป OpenClaw จะดำเนินเธรด Codex นั้นต่อ ส่งโมเดล OpenClaw ที่เลือกอยู่
ในปัจจุบันไปยัง app-server และเปิดใช้ประวัติแบบขยายต่อไป

### ตรวจสอบเธรด Codex จาก CLI

วิธีที่เร็วที่สุดในการทำความเข้าใจการรัน Codex ที่ผิดพลาดมักเป็นการเปิดเธรด Codex
แบบ native โดยตรง:

```sh
codex resume <thread-id>
```

ใช้วิธีนี้เมื่อคุณพบข้อบกพร่องในบทสนทนาของช่องทาง และต้องการตรวจสอบเซสชัน
Codex ที่มีปัญหา ดำเนินต่อในเครื่อง หรือถาม Codex ว่าทำไมจึงเลือกเครื่องมือ
หรือแนวทางการให้เหตุผลเฉพาะนั้น เส้นทางที่ง่ายที่สุดมักเป็นการเรียกใช้
`/diagnostics [note]` ก่อน: หลังจากคุณอนุมัติ รายงานที่เสร็จแล้วจะแสดงรายการ
แต่ละเธรด Codex และพิมพ์คำสั่ง `Inspect locally` เช่น
`codex resume <thread-id>` คุณสามารถคัดลอกคำสั่งนั้นลงในเทอร์มินัลได้โดยตรง

คุณยังสามารถรับรหัสเธรดจาก `/codex binding` สำหรับแชตปัจจุบัน หรือ
`/codex threads [filter]` สำหรับเธรด Codex app-server ล่าสุด จากนั้นเรียกใช้คำสั่ง
`codex resume` เดียวกันในเชลล์ของคุณ

พื้นผิวคำสั่งต้องใช้ Codex app-server `0.125.0` หรือใหม่กว่า เมธอดควบคุมแต่ละรายการ
จะถูกรายงานเป็น `unsupported by this Codex app-server` หาก app-server ในอนาคต
หรือแบบกำหนดเองไม่ได้เปิดเผยเมธอด JSON-RPC นั้น

## ขอบเขตของฮุก

Codex harness มีฮุกสามชั้น:

| ชั้น                                  | เจ้าของ                   | วัตถุประสงค์                                                        |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| ฮุก Plugin ของ OpenClaw               | OpenClaw                  | ความเข้ากันได้ของผลิตภัณฑ์/Plugin ระหว่าง PI และ Codex harnesses   |
| มิดเดิลแวร์ส่วนขยาย Codex app-server | Plugins ที่มากับ OpenClaw | พฤติกรรมอะแดปเตอร์ต่อเทิร์นรอบเครื่องมือแบบไดนามิกของ OpenClaw     |
| ฮุก native ของ Codex                  | Codex                     | วงจรชีวิตระดับล่างของ Codex และนโยบายเครื่องมือ native จาก config ของ Codex |

OpenClaw ไม่ใช้ไฟล์ `hooks.json` ของโปรเจกต์หรือแบบ global ของ Codex เพื่อกำหนดเส้นทาง
พฤติกรรม Plugin ของ OpenClaw สำหรับบริดจ์เครื่องมือ native และสิทธิ์ที่รองรับ
OpenClaw จะฉีด config Codex ต่อเธรดสำหรับ `PreToolUse`, `PostToolUse`,
`PermissionRequest` และ `Stop` เมื่อเปิดใช้การอนุมัติของ Codex app-server
(`approvalPolicy` ไม่ใช่ `"never"`) config ฮุก native เริ่มต้นที่ฉีดจะละเว้น
`PermissionRequest` เพื่อให้ผู้รีวิวของ Codex app-server และบริดจ์การอนุมัติของ
OpenClaw จัดการการยกระดับจริงหลังการรีวิว ผู้ปฏิบัติงานยังสามารถเพิ่ม
`permission_request` ลงใน `nativeHookRelay.events` อย่างชัดเจนได้เมื่อจำเป็นต้องใช้
relay เพื่อความเข้ากันได้ ฮุก Codex อื่น ๆ เช่น `SessionStart` และ
`UserPromptSubmit` ยังคงเป็นตัวควบคุมระดับ Codex; ฮุกเหล่านี้ไม่ได้ถูกเปิดเผย
เป็นฮุก Plugin ของ OpenClaw ในสัญญา v1

สำหรับเครื่องมือแบบไดนามิกของ OpenClaw, OpenClaw จะเรียกใช้เครื่องมือหลังจาก Codex
ขอการเรียกใช้ ดังนั้น OpenClaw จะยิงพฤติกรรม Plugin และมิดเดิลแวร์ที่ตนเป็นเจ้าของ
ในอะแดปเตอร์ harness สำหรับเครื่องมือ native ของ Codex, Codex เป็นเจ้าของบันทึกเครื่องมือ
ตามแบบฉบับ OpenClaw สามารถสะท้อนเหตุการณ์ที่เลือกได้ แต่ไม่สามารถเขียนเธรด Codex
แบบ native ใหม่ได้ เว้นแต่ Codex จะเปิดเผยการดำเนินการนั้นผ่าน app-server
หรือ callback ฮุก native

การฉายภาพ Compaction และวงจรชีวิต LLM มาจากการแจ้งเตือนของ Codex app-server
และสถานะอะแดปเตอร์ OpenClaw ไม่ใช่คำสั่งฮุก native ของ Codex เหตุการณ์
`before_compaction`, `after_compaction`, `llm_input` และ `llm_output` ของ OpenClaw
เป็นการสังเกตระดับอะแดปเตอร์ ไม่ใช่การจับข้อมูลแบบ byte-for-byte ของคำขอภายใน
หรือ payload การ compaction ของ Codex

การแจ้งเตือน Codex native `hook/started` และ `hook/completed` ของ app-server
จะถูกฉายเป็นเหตุการณ์เอเจนต์ `codex_app_server.hook` สำหรับเส้นทางการทำงานและการดีบัก
การแจ้งเตือนเหล่านี้ไม่ได้เรียกฮุก Plugin ของ OpenClaw

## สัญญาการรองรับ V1

โหมด Codex ไม่ใช่ PI ที่มีการเรียกโมเดลอื่นอยู่ข้างใต้ Codex เป็นเจ้าของลูปโมเดล
native มากกว่า และ OpenClaw ปรับพื้นผิว Plugin และเซสชันของตนรอบขอบเขตนั้น

รองรับใน runtime Codex v1:

| พื้นผิว                                       | การรองรับ                                                                              | เหตุผล                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ลูปโมเดล OpenAI ผ่าน Codex               | รองรับ                                                                            | app-server ของ Codex เป็นเจ้าของรอบ OpenAI, การกลับมาทำงานต่อของเธรดแบบเนทีฟ และการทำงานต่อของเครื่องมือแบบเนทีฟ                                                                                                                 |
| การกำหนดเส้นทางและการส่งมอบช่องทาง OpenClaw         | รองรับ                                                                            | Telegram, Discord, Slack, WhatsApp, iMessage และช่องทางอื่นยังอยู่นอก runtime ของโมเดล                                                                                                           |
| เครื่องมือแบบไดนามิกของ OpenClaw                        | รองรับ                                                                            | Codex ขอให้ OpenClaw ดำเนินการเครื่องมือเหล่านี้ ดังนั้น OpenClaw จึงยังอยู่ในเส้นทางการดำเนินการ                                                                                                                       |
| Prompt และ context Plugin                    | รองรับ                                                                            | OpenClaw สร้าง prompt overlays และฉาย context เข้าไปในรอบ Codex ก่อนเริ่มต้นหรือกลับมาทำงานต่อของเธรด                                                                                           |
| วงจรชีวิตของ context engine                      | รองรับ                                                                            | การประกอบ, การ ingest หรือการบำรุงรักษาหลังรอบ และการประสานงาน Compaction ของ context-engine ทำงานสำหรับรอบ Codex                                                                                                |
| hook เครื่องมือแบบไดนามิก                            | รองรับ                                                                            | `before_tool_call`, `after_tool_call` และมิดเดิลแวร์ผลลัพธ์เครื่องมือทำงานล้อมรอบเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของ                                                                                                 |
| hook วงจรชีวิต                               | รองรับในฐานะการสังเกตของอะแดปเตอร์                                                    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` และ `after_compaction` ทำงานพร้อม payload โหมด Codex ที่ตรงตามจริง                                                                                  |
| gate การแก้ไขคำตอบสุดท้าย                    | รองรับผ่าน native hook relay                                              | Codex `Stop` ถูกส่งต่อไปยัง `before_agent_finalize`; `revise` ขอให้ Codex ทำ model pass อีกหนึ่งครั้งก่อนสรุปผล                                                                                       |
| shell, patch และบล็อกหรือการสังเกต MCP แบบเนทีฟ | รองรับผ่าน native hook relay                                              | Codex `PreToolUse` และ `PostToolUse` ถูกส่งต่อสำหรับพื้นผิวเครื่องมือเนทีฟที่ committed แล้ว รวมถึง payload MCP บน Codex app-server `0.125.0` หรือใหม่กว่า รองรับการบล็อก แต่ไม่รองรับการเขียน argument ใหม่      |
| นโยบายสิทธิ์แบบเนทีฟ                      | รองรับผ่านการอนุมัติของ Codex app-server และ compatibility native hook relay | คำขออนุมัติของ Codex app-server ถูกกำหนดเส้นทางผ่าน OpenClaw หลังจาก Codex review แล้ว `PermissionRequest` native hook relay เป็นแบบ opt-in สำหรับโหมดการอนุมัติแบบเนทีฟ เพราะ Codex ส่งออกมาก่อน guardian review |
| การบันทึก trajectory ของ app-server                 | รองรับ                                                                            | OpenClaw บันทึกคำขอที่ส่งไปยัง app-server และ notification ของ app-server ที่ได้รับ                                                                                                           |

ไม่รองรับใน Codex runtime v1:

| พื้นผิว                                             | ขอบเขต V1                                                                                                                                     | เส้นทางในอนาคต                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| การเปลี่ยน argument เครื่องมือแบบเนทีฟ                       | hook ก่อนใช้เครื่องมือแบบเนทีฟของ Codex สามารถบล็อกได้ แต่ OpenClaw ไม่ได้เขียน argument เครื่องมือเนทีฟของ Codex ใหม่                                               | ต้องใช้การรองรับ hook/schema ของ Codex สำหรับอินพุตเครื่องมือทดแทน                            |
| ประวัติ transcript แบบเนทีฟของ Codex ที่แก้ไขได้            | Codex เป็นเจ้าของประวัติเธรดเนทีฟ canonical OpenClaw เป็นเจ้าของ mirror และสามารถฉาย context ในอนาคตได้ แต่ไม่ควรเปลี่ยน internals ที่ไม่รองรับ | เพิ่ม API ของ Codex app-server อย่างชัดเจน หากจำเป็นต้องผ่าตัดเธรดเนทีฟ                    |
| `tool_result_persist` สำหรับระเบียนเครื่องมือเนทีฟของ Codex | hook นั้นแปลงการเขียน transcript ที่ OpenClaw เป็นเจ้าของ ไม่ใช่ระเบียนเครื่องมือเนทีฟของ Codex                                                           | อาจ mirror ระเบียนที่แปลงแล้วได้ แต่การเขียน canonical ใหม่ต้องใช้การรองรับจาก Codex              |
| metadata Compaction แบบเนทีฟที่ละเอียด                     | OpenClaw สังเกตการเริ่มต้นและการเสร็จสิ้นของ Compaction แต่ไม่ได้รับรายการ kept/dropped ที่เสถียร, token delta หรือ payload สรุป            | ต้องใช้ event Compaction ของ Codex ที่ละเอียดขึ้น                                                     |
| การแทรกแซง Compaction                             | hook Compaction ปัจจุบันของ OpenClaw อยู่ในระดับ notification ในโหมด Codex                                                                         | เพิ่ม hook ก่อน/หลัง Compaction ของ Codex หาก Plugin จำเป็นต้อง veto หรือเขียน Compaction แบบเนทีฟใหม่ |
| การบันทึกคำขอ API โมเดลแบบ byte-for-byte             | OpenClaw สามารถบันทึกคำขอและ notification ของ app-server ได้ แต่ core ของ Codex สร้างคำขอ OpenAI API ขั้นสุดท้ายภายใน                      | ต้องใช้ event tracing คำขอโมเดลของ Codex หรือ debug API                                   |

## เครื่องมือ, สื่อ และ Compaction

Codex harness เปลี่ยนเฉพาะ executor ของ agent แบบฝังตัวระดับล่างเท่านั้น

OpenClaw ยังสร้างรายการเครื่องมือและรับผลลัพธ์เครื่องมือแบบไดนามิกจาก
harness ข้อความ, รูปภาพ, วิดีโอ, เพลง, TTS, การอนุมัติ และเอาต์พุตของ messaging-tool
ยังคงผ่านเส้นทางการส่งมอบปกติของ OpenClaw

native hook relay ตั้งใจให้เป็นแบบทั่วไป แต่สัญญาการรองรับ v1
จำกัดอยู่ที่เส้นทางเครื่องมือและสิทธิ์แบบเนทีฟของ Codex ที่ OpenClaw ทดสอบ ใน
Codex runtime นั้นรวมถึง shell, patch และ MCP `PreToolUse`,
`PostToolUse` และ payload `PermissionRequest` อย่าสันนิษฐานว่า event hook ของ Codex
ในอนาคตทุกตัวเป็นพื้นผิว Plugin ของ OpenClaw จนกว่า runtime contract จะระบุชื่อ
ไว้

สำหรับ `PermissionRequest` OpenClaw จะส่งคืนการตัดสินใจ allow หรือ deny อย่างชัดเจน
เมื่อ policy ตัดสิน ผลลัพธ์แบบไม่มีการตัดสินใจไม่ใช่ allow Codex ถือว่าไม่มี
การตัดสินใจจาก hook และปล่อยต่อไปยัง guardian หรือเส้นทางอนุมัติของผู้ใช้เอง
โหมดการอนุมัติของ Codex app-server จะละเว้น hook แบบเนทีฟนี้โดยค่าเริ่มต้น ย่อหน้านี้
มีผลเมื่อ `permission_request` ถูกรวมไว้อย่างชัดเจนใน
`nativeHookRelay.events` หรือ runtime compatibility ติดตั้งไว้
เมื่อ operator เลือก `allow-always` สำหรับคำขอสิทธิ์แบบเนทีฟของ Codex
OpenClaw จะจดจำ fingerprint ของ provider/session/tool input/cwd ที่แน่นอนนั้นสำหรับ
ช่วง session ที่มีขอบเขต การตัดสินใจที่จดจำไว้นั้นตั้งใจให้เป็นแบบตรงกันเป๊ะเท่านั้น:
คำสั่ง, argument, payload เครื่องมือ หรือ cwd ที่เปลี่ยนไปจะสร้าง
การอนุมัติใหม่

การขออนุมัติเครื่องมือ Codex MCP จะถูกกำหนดเส้นทางผ่าน flow การอนุมัติ Plugin
ของ OpenClaw เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"` prompt `request_user_input` ของ Codex จะถูกส่งกลับไปยัง
แชตต้นทาง และข้อความติดตามผลที่อยู่ในคิวถัดไปจะตอบคำขอ server แบบเนทีฟนั้น
แทนที่จะถูกนำทางเป็น context เพิ่มเติม คำขอ elicitation ของ MCP อื่นๆ
ยังคง fail closed

การนำทางคิว active-run จะ map เข้ากับ Codex app-server `turn/steer` ด้วย
ค่าเริ่มต้น `messages.queue.mode: "steer"` OpenClaw จะ batch ข้อความแชตที่อยู่ในคิว
สำหรับ quiet window ที่กำหนดค่าไว้ แล้วส่งเป็นคำขอ `turn/steer` เดียว
ตามลำดับที่มาถึง โหมดเดิม `queue` จะส่งคำขอ `turn/steer` แยกกัน Codex
review และรอบ Compaction แบบ manual อาจปฏิเสธ same-turn steering ซึ่งในกรณีนั้น
OpenClaw จะใช้คิว followup เมื่อโหมดที่เลือกอนุญาต fallback ดู
[คิว Steering](/th/concepts/queue-steering)

เมื่อโมเดลที่เลือกใช้ Codex harness การ Compaction เธรดแบบเนทีฟจะ
มอบหมายให้ Codex app-server OpenClaw เก็บ transcript mirror สำหรับประวัติช่องทาง,
การค้นหา, `/new`, `/reset` และการสลับโมเดลหรือ harness ในอนาคต
mirror รวม prompt ของผู้ใช้, ข้อความ assistant สุดท้าย และระเบียน reasoning หรือ plan
แบบเบาของ Codex เมื่อ app-server ส่งออกมา ปัจจุบัน OpenClaw บันทึกเฉพาะ
สัญญาณเริ่มต้นและเสร็จสิ้น Compaction แบบเนทีฟ ยังไม่ expose
สรุป Compaction ที่มนุษย์อ่านได้หรือรายการตรวจสอบได้ว่า Codex
เก็บ entry ใดไว้หลัง Compaction

เนื่องจาก Codex เป็นเจ้าของเธรดเนทีฟ canonical, `tool_result_persist` จึงไม่
เขียนระเบียนผลลัพธ์เครื่องมือเนทีฟของ Codex ใหม่ในขณะนี้ มันมีผลเฉพาะเมื่อ
OpenClaw กำลังเขียนผลลัพธ์เครื่องมือ transcript ของ session ที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่จำเป็นต้องใช้ PI รูปภาพ, วิดีโอ, เพลง, PDF, TTS และการทำความเข้าใจสื่อ
ยังคงใช้การตั้งค่า provider/model ที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ปัญหา

**Codex ไม่ปรากฏเป็น provider ปกติใน `/model`:** นี่เป็นสิ่งที่คาดไว้สำหรับ
config ใหม่ เลือกโมเดล `openai/gpt-*` พร้อม
`agentRuntime.id: "codex"` (หรือ ref เดิม `codex/*`), เปิดใช้งาน
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ไม่ได้ exclude
`codex`

**OpenClaw ใช้ PI แทน Codex:** `agentRuntime.id: "auto"` ยังสามารถใช้ PI เป็น
backend compatibility ได้เมื่อไม่มี Codex harness อ้างสิทธิ์ run ตั้งค่า
`agentRuntime.id: "codex"` เพื่อบังคับการเลือก Codex ระหว่างทดสอบ
Codex runtime ที่ถูกบังคับจะล้มเหลวแทนที่จะ fallback ไปยัง PI เมื่อเลือก Codex app-server
แล้ว ความล้มเหลวของมันจะแสดงโดยตรง

**app-server ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้ app-server handshake
รายงานเวอร์ชัน `0.125.0` หรือใหม่กว่า prerelease เวอร์ชันเดียวกันหรือเวอร์ชันที่มี suffix build
เช่น `0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ
stable `0.125.0` protocol floor คือสิ่งที่ OpenClaw ทดสอบ

**การค้นพบโมเดลช้า:** ลดค่า `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิดใช้งาน discovery

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`
และตรวจสอบว่า app-server ระยะไกลพูด protocol version เดียวกันของ Codex app-server

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นสิ่งที่คาดไว้ เว้นแต่คุณจะบังคับ
`agentRuntime.id: "codex"` สำหรับ agent นั้นหรือเลือก ref เดิม
`codex/*` ref `openai/gpt-*` ปกติและ ref ของ provider อื่นจะยังอยู่บนเส้นทาง
provider ปกติในโหมด `auto` หากคุณบังคับ `agentRuntime.id: "codex"` ทุก embedded
turn สำหรับ agent นั้นต้องเป็นโมเดล OpenAI ที่ Codex รองรับ

**Computer Use ติดตั้งแล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงานว่า
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงเกิดขึ้น ให้รีสตาร์ท
Gateway เพื่อล้างการลงทะเบียน native hook ที่ค้างอยู่ หาก `computer-use.list_apps`
หมดเวลา ให้รีสตาร์ท Codex Computer Use หรือ Codex Desktop แล้วลองอีกครั้ง

## ที่เกี่ยวข้อง

- [Plugin สำหรับชุดทดสอบเอเจนต์](/th/plugins/sdk-agent-harness)
- [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [สถานะ](/th/cli/status)
- [Plugin hooks](/th/plugins/hooks)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
