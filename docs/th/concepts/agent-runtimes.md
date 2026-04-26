---
read_when:
    - คุณกำลังเลือกระหว่าง PI, Codex, ACP หรือ runtime ของเอเจนต์แบบเนทีฟอื่น ๆ
    - คุณสับสนกับป้ายกำกับ provider/model/runtime ในสถานะหรือ config
    - คุณกำลังจัดทำเอกสารความเท่าเทียมของการรองรับสำหรับ harness แบบเนทีฟ
summary: วิธีที่ OpenClaw แยกผู้ให้บริการโมเดล โมเดล ช่อง และ runtime ของเอเจนต์ออกจากกัน
title: runtime ของเอเจนต์
x-i18n:
    generated_at: "2026-04-26T11:27:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

**runtime ของเอเจนต์** คือคอมโพเนนต์ที่เป็นเจ้าของลูปโมเดลที่เตรียมไว้หนึ่งชุด: มัน
รับพรอมป์ ขับเคลื่อนผลลัพธ์ของโมเดล จัดการการเรียกใช้เครื่องมือแบบเนทีฟ และส่งคืน
เทิร์นที่เสร็จสมบูรณ์ให้กับ OpenClaw

runtime มักสับสนกับ provider ได้ง่าย เพราะทั้งสองอย่างปรากฏใกล้กับการกำหนดค่า
โมเดล แต่เป็นคนละชั้นกัน:

| ชั้น         | ตัวอย่าง                              | ความหมาย                                                       |
| ------------ | ------------------------------------- | -------------------------------------------------------------- |
| Provider     | `openai`, `anthropic`, `openai-codex` | วิธีที่ OpenClaw ยืนยันตัวตน ค้นหาโมเดล และตั้งชื่อ model ref |
| Model        | `gpt-5.5`, `claude-opus-4-6`          | โมเดลที่ถูกเลือกสำหรับเทิร์นของเอเจนต์                        |
| runtime ของเอเจนต์ | `pi`, `codex`, `claude-cli`           | ลูประดับล่างหรือ backend ที่รันเทิร์นที่เตรียมไว้             |
| ช่อง         | Telegram, Discord, Slack, WhatsApp    | จุดที่ข้อความเข้าและออกจาก OpenClaw                           |

คุณจะเห็นคำว่า **harness** ในโค้ดด้วย harness คือ implementation
ที่ให้ runtime ของเอเจนต์ ตัวอย่างเช่น Codex harness ที่รวมมาให้
implements runtime `codex` ใน config สาธารณะใช้ `agentRuntime.id`; `openclaw
doctor --fix` จะเขียนคีย์ runtime-policy แบบเก่าให้อยู่ในรูปแบบนั้น

มี runtime อยู่สองตระกูล:

- **Embedded harnesses** รันอยู่ภายในลูปเอเจนต์ที่เตรียมไว้ของ OpenClaw ปัจจุบัน
  มี runtime `pi` ที่มีมาในตัว รวมถึง plugin harnesses ที่ลงทะเบียนไว้ เช่น
  `codex`
- **CLI backends** รันกระบวนการ CLI ในเครื่อง โดยยังคง model ref
  ให้เป็น canonical เช่น `anthropic/claude-opus-4-7` พร้อม
  `agentRuntime.id: "claude-cli"` หมายถึง "เลือกโมเดล Anthropic แล้วรัน
  ผ่าน Claude CLI" โดย `claude-cli` ไม่ใช่ embedded harness id และห้ามส่ง
  ไปให้การเลือก AgentHarness

## สามสิ่งที่ชื่อ Codex

ความสับสนส่วนใหญ่มาจากการที่มีพื้นผิวสามแบบต่างกันซึ่งใช้ชื่อ Codex ร่วมกัน:

| พื้นผิว                                              | ชื่อ/config ใน OpenClaw              | สิ่งที่ทำ                                                                                         |
| ---------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| เส้นทาง provider OAuth ของ Codex                    | model refs แบบ `openai-codex/*`      | ใช้ OAuth ของการสมัครใช้งาน ChatGPT/Codex ผ่านตัวรัน PI ปกติของ OpenClaw                         |
| runtime app-server แบบเนทีฟของ Codex                | `agentRuntime.id: "codex"`           | รันเทิร์นเอเจนต์แบบ embedded ผ่าน Codex app-server harness ที่รวมมาให้                            |
| Codex ACP adapter                                    | `runtime: "acp"`, `agentId: "codex"` | รัน Codex ผ่าน control plane ภายนอก ACP/acpx ใช้เฉพาะเมื่อมีการขอ ACP/acpx อย่างชัดเจน          |
| ชุดคำสั่งควบคุมแชตแบบเนทีฟของ Codex                | `/codex ...`                         | bind, resume, steer, stop และตรวจสอบเธรด Codex app-server จากแชต                                 |
| เส้นทาง OpenAI Platform API สำหรับโมเดลสไตล์ GPT/Codex | model refs แบบ `openai/*`            | ใช้การยืนยันตัวตนด้วย OpenAI API key เว้นแต่มี runtime override เช่น `runtime: "codex"` มารันเทิร์น |

พื้นผิวเหล่านี้ถูกแยกจากกันโดยตั้งใจ การเปิดใช้ plugin `codex` จะทำให้
ฟีเจอร์ app-server แบบเนทีฟพร้อมใช้งาน; มันจะไม่เขียน
`openai-codex/*` ให้เป็น `openai/*`, ไม่เปลี่ยนเซสชันเดิม และ
ไม่ทำให้ ACP กลายเป็นค่าเริ่มต้นของ Codex การเลือก `openai-codex/*` หมายถึง "ใช้เส้นทาง provider OAuth ของ Codex"
เว้นแต่คุณจะบังคับ runtime แยกต่างหาก

การตั้งค่า Codex ที่พบบ่อยใช้ provider `openai` ร่วมกับ runtime `codex`:

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

นั่นหมายความว่า OpenClaw เลือก model ref ของ OpenAI แล้วจึงขอให้ Codex app-server
runtime รันเทิร์นเอเจนต์แบบ embedded มันไม่ได้หมายความว่าช่อง,
catalog ของผู้ให้บริการโมเดล หรือที่เก็บเซสชันของ OpenClaw จะกลายเป็น Codex

เมื่อ plugin `codex` ที่รวมมาให้ถูกเปิดใช้งาน การควบคุม Codex ด้วยภาษาธรรมชาติ
ควรใช้พื้นผิวคำสั่งแบบเนทีฟ `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) แทน ACP ใช้ ACP กับ
Codex เฉพาะเมื่อผู้ใช้ขอ ACP/acpx อย่างชัดเจน หรือกำลังทดสอบเส้นทาง
ACP adapter เท่านั้น ส่วน Claude Code, Gemini CLI, OpenCode, Cursor และ external
harness ลักษณะใกล้เคียงกันยังคงใช้ ACP

นี่คือต้นไม้การตัดสินใจฝั่งเอเจนต์:

1. หากผู้ใช้ขอ **Codex bind/control/thread/resume/steer/stop** ให้ใช้
   พื้นผิวคำสั่งแบบเนทีฟ `/codex` เมื่อ plugin `codex` ที่รวมมาให้ถูกเปิดใช้งาน
2. หากผู้ใช้ขอ **Codex เป็น embedded runtime** ให้ใช้
   `openai/<model>` ร่วมกับ `agentRuntime.id: "codex"`
3. หากผู้ใช้ขอ **Codex OAuth/subscription auth บนตัวรัน OpenClaw ปกติ**
   ให้ใช้ `openai-codex/<model>` และคง runtime เป็น PI
4. หากผู้ใช้ระบุชัดเจนว่า **ACP**, **acpx** หรือ **Codex ACP adapter** ให้ใช้
   ACP พร้อม `runtime: "acp"` และ `agentId: "codex"`
5. หากคำขอเกี่ยวกับ **Claude Code, Gemini CLI, OpenCode, Cursor, Droid หรือ
   external harness อื่น** ให้ใช้ ACP/acpx ไม่ใช่ runtime ของ sub-agent แบบเนทีฟ

| คุณหมายถึง...                         | ให้ใช้...                                      |
| ------------------------------------- | ---------------------------------------------- |
| การควบคุมแชต/เธรดของ Codex app-server    | `/codex ...` จาก plugin `codex` ที่รวมมาให้      |
| runtime เอเจนต์แบบ embedded ของ Codex app-server | `agentRuntime.id: "codex"`                     |
| OpenAI Codex OAuth บนตัวรัน PI        | model refs แบบ `openai-codex/*`                |
| Claude Code หรือ external harness อื่น | ACP/acpx                                       |

สำหรับการแยก prefix ของตระกูล OpenAI ดู [OpenAI](/th/providers/openai) และ
[ผู้ให้บริการโมเดล](/th/concepts/model-providers) สำหรับสัญญาการรองรับของ Codex runtime
ดู [Codex harness](/th/plugins/codex-harness#v1-support-contract)

## ความเป็นเจ้าของของ runtime

runtime แต่ละแบบเป็นเจ้าของลูปในระดับที่ต่างกัน

| พื้นผิว                     | PI embedded ของ OpenClaw                | Codex app-server                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| เจ้าของลูปโมเดล            | OpenClaw ผ่านตัวรัน PI embedded         | Codex app-server                                                            |
| สถานะเธรด canonical      | ทรานสคริปต์ของ OpenClaw                 | เธรด Codex พร้อมทรานสคริปต์เงาของ OpenClaw                               |
| เครื่องมือ dynamic ของ OpenClaw | ลูปเครื่องมือแบบเนทีฟของ OpenClaw       | bridge ผ่านอะแดปเตอร์ Codex                                               |
| เครื่องมือ shell และไฟล์แบบเนทีฟ | เส้นทาง PI/OpenClaw                     | เครื่องมือแบบเนทีฟของ Codex ซึ่ง bridge ผ่าน native hooks เมื่อรองรับ      |
| เอนจินบริบท              | การประกอบบริบทแบบเนทีฟของ OpenClaw      | บริบทของโปรเจกต์ OpenClaw ที่ประกอบเข้าไปในเทิร์นของ Codex                |
| Compaction                | OpenClaw หรือเอนจินบริบทที่เลือก        | Compaction แบบเนทีฟของ Codex พร้อมการแจ้งเตือนและการดูแล mirror ของ OpenClaw |
| การส่งผ่านช่อง             | OpenClaw                                | OpenClaw                                                                    |

การแยกความเป็นเจ้าของนี้คือกฎการออกแบบหลัก:

- หาก OpenClaw เป็นเจ้าของพื้นผิว OpenClaw ก็สามารถให้พฤติกรรม hook ของ Plugin ตามปกติได้
- หาก native runtime เป็นเจ้าของพื้นผิว OpenClaw จะต้องใช้ runtime events หรือ native hooks
- หาก native runtime เป็นเจ้าของสถานะเธรด canonical OpenClaw ควรทำ mirror และฉายบริบท ไม่ใช่เขียนทับภายในที่ไม่รองรับ

## การเลือก runtime

OpenClaw จะเลือก embedded runtime หลังจาก resolve provider และโมเดลแล้ว:

1. runtime ที่บันทึกไว้ของเซสชันมีความสำคัญสูงสุด การเปลี่ยน config จะไม่สลับ
   ทรานสคริปต์เดิมไปใช้ระบบเธรดแบบเนทีฟอื่นแบบ hot-switch
2. `OPENCLAW_AGENT_RUNTIME=<id>` จะบังคับ runtime นั้นสำหรับเซสชันใหม่หรือเซสชันที่รีเซ็ต
3. `agents.defaults.agentRuntime.id` หรือ `agents.list[].agentRuntime.id` สามารถตั้งเป็น
   `auto`, `pi`, embedded harness id ที่ลงทะเบียนไว้ เช่น `codex` หรือ
   alias ของ CLI backend ที่รองรับ เช่น `claude-cli`
4. ในโหมด `auto`, runtime ของ Plugin ที่ลงทะเบียนไว้สามารถ claim คู่ provider/model
   ที่รองรับได้
5. หากไม่มี runtime ใด claim เทิร์นในโหมด `auto` และตั้งค่า `fallback: "pi"`
   ไว้ (ค่าเริ่มต้น) OpenClaw จะใช้ PI เป็น fallback เพื่อความเข้ากันได้ ตั้งค่า
   `fallback: "none"` หากต้องการให้การเลือกแบบ `auto` ที่ไม่ตรงเงื่อนไขล้มเหลวแทน

runtime ของ Plugin แบบ explicit จะล้มเหลวแบบ fail closed ตามค่าเริ่มต้น เช่น
`runtime: "codex"` หมายถึงต้องเป็น Codex หรือเกิดข้อผิดพลาดการเลือกอย่างชัดเจน เว้นแต่คุณจะตั้ง
`fallback: "pi"` ในขอบเขต override เดียวกัน runtime override จะไม่สืบทอด
การตั้งค่า fallback ที่กว้างกว่า ดังนั้น `runtime: "codex"` ระดับเอเจนต์จะไม่ถูก
ส่งกลับไปหา PI แบบเงียบ ๆ เพียงเพราะค่าเริ่มต้นใช้ `fallback: "pi"`

alias ของ CLI backend ต่างจาก embedded harness id รูปแบบ Claude CLI
ที่แนะนำคือ:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

ref แบบเก่า เช่น `claude-cli/claude-opus-4-7` ยังคงรองรับอยู่เพื่อความเข้ากันได้
แต่ config ใหม่ควรเก็บ provider/model ไว้ในรูปแบบ canonical และใส่
backend ที่ใช้รันไว้ใน `agentRuntime.id`

โหมด `auto` ถูกออกแบบให้ระมัดระวังโดยตั้งใจ runtime ของ Plugin สามารถ claim
คู่ provider/model ที่เข้าใจได้ แต่ plugin Codex จะไม่ claim provider
`openai-codex` ในโหมด `auto` ซึ่งช่วยคงให้
`openai-codex/*` เป็นเส้นทาง PI Codex OAuth แบบ explicit และหลีกเลี่ยงการ
ย้าย config การยืนยันตัวตนแบบสมัครใช้งานไปยัง native app-server harness แบบเงียบ ๆ

หาก `openclaw doctor` เตือนว่า plugin `codex` ถูกเปิดใช้งานอยู่ ขณะที่
`openai-codex/*` ยังส่งผ่าน PI ให้ถือว่านั่นเป็นการวินิจฉัย ไม่ใช่การย้ายค่า
ให้คง config เดิมไว้หาก PI Codex OAuth คือสิ่งที่คุณต้องการ
สลับไปใช้ `openai/<model>` พร้อม `agentRuntime.id: "codex"` เฉพาะเมื่อคุณต้องการ
การรันแบบเนทีฟของ Codex app-server

## สัญญาความเข้ากันได้

เมื่อ runtime ไม่ใช่ PI ก็ควรมีเอกสารอธิบายว่ามันรองรับพื้นผิวใดของ OpenClaw
ให้ใช้รูปแบบนี้สำหรับเอกสาร runtime:

| คำถาม                               | เหตุผลที่สำคัญ                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| ใครเป็นเจ้าของลูปโมเดล?             | เป็นตัวกำหนดว่าการ retry, การต่อเนื่องของเครื่องมือ และการตัดสินคำตอบสุดท้ายเกิดขึ้นที่ใด     |
| ใครเป็นเจ้าของประวัติเธรด canonical? | เป็นตัวกำหนดว่า OpenClaw แก้ไขประวัติได้หรือทำได้เพียง mirror                                  |
| เครื่องมือ dynamic ของ OpenClaw ใช้ได้หรือไม่? | การส่งข้อความ เซสชัน Cron และเครื่องมือที่ OpenClaw เป็นเจ้าของอาศัยสิ่งนี้                      |
| dynamic tool hooks ใช้ได้หรือไม่?    | Plugin คาดหวัง `before_tool_call`, `after_tool_call` และ middleware รอบเครื่องมือที่ OpenClaw เป็นเจ้าของ |
| native tool hooks ใช้ได้หรือไม่?     | เครื่องมือ shell, patch และเครื่องมือที่ runtime เป็นเจ้าของต้องรองรับ native hook สำหรับนโยบายและการสังเกต |
| วงจรชีวิตของเอนจินบริบททำงานหรือไม่? | Plugin ด้าน memory และบริบทต้องพึ่งพาวงจรชีวิต assemble, ingest, after-turn และ Compaction    |
| มีการเปิดเผยข้อมูล Compaction อะไรบ้าง? | บาง Plugin ต้องการเพียงการแจ้งเตือน ขณะที่บางตัวต้องการเมทาดาต้าส่วนที่เก็บไว้/ทิ้งไป         |
| อะไรที่ตั้งใจไม่รองรับ?               | ผู้ใช้ไม่ควรสมมติว่าเทียบเท่า PI ในจุดที่ native runtime เป็นเจ้าของสถานะมากกว่า              |

สัญญาการรองรับของ Codex runtime มีเอกสารอยู่ใน
[Codex harness](/th/plugins/codex-harness#v1-support-contract)

## ป้ายกำกับสถานะ

ผลลัพธ์สถานะอาจแสดงทั้งป้ายกำกับ `Execution` และ `Runtime` ให้อ่านสิ่งเหล่านี้เป็น
ข้อมูลวินิจฉัย ไม่ใช่ชื่อผู้ให้บริการ

- model ref เช่น `openai/gpt-5.5` บอกคุณถึง provider/model ที่เลือก
- runtime id เช่น `codex` บอกคุณว่าลูปใดกำลังรันเทิร์นนั้น
- ป้ายกำกับช่อง เช่น Telegram หรือ Discord บอกคุณว่าการสนทนากำลังเกิดขึ้นที่ใด

หากเซสชันยังคงแสดง PI หลังจากเปลี่ยน config ของ runtime ให้เริ่มเซสชันใหม่
ด้วย `/new` หรือล้างเซสชันปัจจุบันด้วย `/reset` เซสชันเดิมจะคง runtime
ที่บันทึกไว้ เพื่อไม่ให้ทรานสคริปต์เดียวกันถูกเล่นซ้ำผ่านระบบเซสชันแบบเนทีฟสองแบบที่เข้ากันไม่ได้

## ที่เกี่ยวข้อง

- [Codex harness](/th/plugins/codex-harness)
- [OpenAI](/th/providers/openai)
- [Plugin harness ของเอเจนต์](/th/plugins/sdk-agent-harness)
- [ลูปเอเจนต์](/th/concepts/agent-loop)
- [Models](/th/concepts/models)
- [สถานะ](/th/cli/status)
