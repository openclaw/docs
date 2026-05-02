---
read_when:
    - คุณกำลังเลือกระหว่าง PI, Codex, ACP หรือรันไทม์เอเจนต์แบบเนทีฟอื่น
    - ป้ายกำกับผู้ให้บริการ/โมเดล/รันไทม์ในสถานะหรือการกำหนดค่าทำให้คุณสับสน
    - คุณกำลังจัดทำเอกสารเกี่ยวกับความเท่าเทียมของการรองรับสำหรับฮาร์เนสแบบเนทีฟ
summary: OpenClaw แยกผู้ให้บริการโมเดล โมเดล ช่องทาง และรันไทม์ของเอเจนต์อย่างไร
title: รันไทม์ของเอเจนต์
x-i18n:
    generated_at: "2026-05-02T10:13:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**agent runtime** คือคอมโพเนนต์ที่เป็นเจ้าของลูปโมเดลที่เตรียมไว้หนึ่งลูป: คอมโพเนนต์นี้รับพรอมป์, ขับเคลื่อนเอาต์พุตของโมเดล, จัดการการเรียกใช้เครื่องมือเนทีฟ, และส่งคืนเทิร์นที่เสร็จสมบูรณ์ให้ OpenClaw

runtime มักสับสนกับ provider ได้ง่าย เพราะทั้งสองอย่างปรากฏใกล้กับการกำหนดค่าโมเดล ทั้งสองอย่างเป็นเลเยอร์ต่างกัน:

| เลเยอร์       | ตัวอย่าง                              | ความหมาย                                                            |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | วิธีที่ OpenClaw ยืนยันตัวตน, ค้นพบโมเดล, และตั้งชื่อ model refs |
| โมเดล         | `gpt-5.5`, `claude-opus-4-6`          | โมเดลที่เลือกสำหรับเทิร์นของ agent                                  |
| Agent runtime | `pi`, `codex`, `claude-cli`           | ลูประดับล่างหรือแบ็กเอนด์ที่ดำเนินการเทิร์นที่เตรียมไว้             |
| Channel       | Telegram, Discord, Slack, WhatsApp    | ตำแหน่งที่ข้อความเข้าและออกจาก OpenClaw                             |

คุณจะเห็นคำว่า **harness** ในโค้ดด้วย harness คืออิมพลีเมนเทชันที่จัดเตรียม agent runtime ตัวอย่างเช่น Codex harness ที่รวมมาในตัวจะอิมพลีเมนต์ runtime `codex` การกำหนดค่าสาธารณะใช้ `agentRuntime.id`; `openclaw doctor --fix` จะเขียน runtime-policy keys แบบเก่าใหม่ให้อยู่ในรูปแบบนั้น

มี runtime สองตระกูล:

- **Embedded harnesses** ทำงานภายในลูป agent ที่ OpenClaw เตรียมไว้ ปัจจุบันคือ runtime `pi` ในตัว รวมถึง Plugin harnesses ที่ลงทะเบียนไว้ เช่น `codex`
- **CLI backends** เรียกใช้โปรเซส CLI ในเครื่อง พร้อมคง model ref ให้เป็นแบบ canonical ตัวอย่างเช่น `anthropic/claude-opus-4-7` กับ `agentRuntime.id: "claude-cli"` หมายถึง "เลือกโมเดล Anthropic แล้วดำเนินการผ่าน Claude CLI" `claude-cli` ไม่ใช่ embedded harness id และต้องไม่ส่งไปยังการเลือก AgentHarness

## พื้นผิวของ Codex

ความสับสนส่วนใหญ่มาจากพื้นผิวหลายแบบที่ใช้ชื่อ Codex ร่วมกัน:

| พื้นผิว                                              | ชื่อ/การกำหนดค่าใน OpenClaw                 | สิ่งที่ทำ                                                                                                 |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| runtime เนทีฟ Codex app-server                      | `openai/*` plus `agentRuntime.id: "codex"` | เรียกใช้เทิร์น agent แบบฝังผ่าน Codex app-server นี่คือการตั้งค่าสมาชิก ChatGPT/Codex ตามปกติ |
| เส้นทาง provider Codex OAuth                         | `openai-codex/*` model refs                | ใช้ OAuth ของสมาชิก ChatGPT/Codex ผ่าน OpenClaw PI runner ปกติ                                             |
| Codex ACP adapter                                    | `runtime: "acp"`, `agentId: "codex"`       | เรียกใช้ Codex ผ่าน control plane ภายนอกของ ACP/acpx ใช้เฉพาะเมื่อมีการขอ ACP/acpx อย่างชัดเจน |
| ชุดคำสั่งควบคุมแชต Codex เนทีฟ                       | `/codex ...`                               | ผูก, กลับมาใช้งานต่อ, บังคับทิศทาง, หยุด, และตรวจสอบเธรด Codex app-server จากแชต                         |
| เส้นทาง OpenAI Platform API สำหรับโมเดลสไตล์ GPT/Codex | `openai/*` model refs                      | ใช้การยืนยันตัวตนด้วย API key ของ OpenAI เว้นแต่ runtime override เช่น `agentRuntime.id: "codex"` จะเรียกใช้เทิร์น |

พื้นผิวเหล่านั้นแยกจากกันโดยตั้งใจ การเปิดใช้ Plugin `codex` ทำให้ฟีเจอร์เนทีฟของ app-server พร้อมใช้งาน; มันไม่ได้เขียน `openai-codex/*` ใหม่เป็น `openai/*`, ไม่ได้เปลี่ยนเซสชันที่มีอยู่, และไม่ได้ทำให้ ACP เป็นค่าเริ่มต้นของ Codex การเลือก `openai-codex/*` หมายถึง "ใช้เส้นทาง provider Codex OAuth" เว้นแต่คุณจะบังคับ runtime แยกต่างหาก

การตั้งค่าสมาชิก ChatGPT/Codex ที่พบบ่อยใช้ Codex OAuth สำหรับการยืนยันตัวตน แต่คง model ref เป็น `openai/*` และเลือก runtime `codex`:

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

นั่นหมายความว่า OpenClaw เลือก OpenAI model ref แล้วจึงขอให้ runtime Codex app-server เรียกใช้เทิร์น agent แบบฝัง ไม่ได้หมายความว่า "ใช้การคิดค่าบริการผ่าน API" และไม่ได้หมายความว่า channel, แคตตาล็อก provider ของโมเดล, หรือที่เก็บเซสชัน OpenClaw กลายเป็น Codex

เมื่อเปิดใช้ Plugin `codex` ที่รวมมาในตัว การควบคุม Codex ด้วยภาษาธรรมชาติควรใช้พื้นผิวคำสั่งเนทีฟ `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) แทน ACP ใช้ ACP สำหรับ Codex เฉพาะเมื่อผู้ใช้ขอ ACP/acpx อย่างชัดเจน หรือกำลังทดสอบเส้นทาง ACP adapter เท่านั้น Claude Code, Gemini CLI, OpenCode, Cursor, และ harnesses ภายนอกที่คล้ายกันยังคงใช้ ACP

นี่คือ decision tree สำหรับ agent:

1. หากผู้ใช้ขอ **Codex bind/control/thread/resume/steer/stop** ให้ใช้พื้นผิวคำสั่งเนทีฟ `/codex` เมื่อเปิดใช้ Plugin `codex` ที่รวมมาในตัว
2. หากผู้ใช้ขอ **Codex เป็น embedded runtime** หรือต้องการประสบการณ์ Codex agent ปกติที่รองรับด้วยการสมัครสมาชิก ให้ใช้ `openai/<model>` กับ `agentRuntime.id: "codex"`
3. หากผู้ใช้ขอ **การยืนยันตัวตน Codex OAuth/subscription บน OpenClaw runner ปกติ** ให้ใช้ `openai-codex/<model>` และปล่อย runtime เป็น PI
4. หากผู้ใช้พูดอย่างชัดเจนว่า **ACP**, **acpx**, หรือ **Codex ACP adapter** ให้ใช้ ACP กับ `runtime: "acp"` และ `agentId: "codex"`
5. หากคำขอเป็น **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, หรือ harness ภายนอกอื่น** ให้ใช้ ACP/acpx ไม่ใช่ runtime sub-agent เนทีฟ

| คุณหมายถึง...                         | ใช้...                                       |
| --------------------------------------- | -------------------------------------------- |
| การควบคุมแชต/เธรด Codex app-server    | `/codex ...` จาก Plugin `codex` ที่รวมมาในตัว |
| agent runtime แบบฝังของ Codex app-server | `agentRuntime.id: "codex"`                   |
| OpenAI Codex OAuth บน PI runner        | `openai-codex/*` model refs                  |
| Claude Code หรือ harness ภายนอกอื่น   | ACP/acpx                                     |

สำหรับการแยก prefix ตระกูล OpenAI ดู [OpenAI](/th/providers/openai) และ [Model providers](/th/concepts/model-providers) สำหรับสัญญาการรองรับ runtime Codex ดู [Codex harness](/th/plugins/codex-harness#v1-support-contract)

## ความเป็นเจ้าของ runtime

runtime ต่างชนิดเป็นเจ้าของส่วนต่าง ๆ ของลูปในระดับที่ต่างกัน

| พื้นผิว                     | OpenClaw PI แบบฝัง                    | Codex app-server                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| เจ้าของลูปโมเดล            | OpenClaw ผ่าน PI embedded runner | Codex app-server                                                            |
| สถานะเธรด canonical        | transcript ของ OpenClaw                     | เธรด Codex พร้อมสำเนา transcript ของ OpenClaw                               |
| เครื่องมือไดนามิกของ OpenClaw | ลูปเครื่องมือ OpenClaw เนทีฟ               | เชื่อมผ่าน Codex adapter                                           |
| เครื่องมือ shell และไฟล์เนทีฟ | เส้นทาง PI/OpenClaw                        | เครื่องมือเนทีฟของ Codex เชื่อมผ่าน hooks เนทีฟเมื่อรองรับ            |
| Context engine              | การประกอบ context เนทีฟของ OpenClaw        | OpenClaw projects ประกอบ context เข้าไปในเทิร์น Codex                     |
| Compaction                  | OpenClaw หรือ context engine ที่เลือก     | Compaction เนทีฟของ Codex พร้อมการแจ้งเตือนของ OpenClaw และการดูแลสำเนา |
| การส่งมอบผ่าน channel       | OpenClaw                                | OpenClaw                                                                    |

การแบ่งความเป็นเจ้าของนี้คือกฎการออกแบบหลัก:

- หาก OpenClaw เป็นเจ้าของพื้นผิว OpenClaw สามารถจัดเตรียมพฤติกรรม Plugin hook ปกติได้
- หาก runtime เนทีฟเป็นเจ้าของพื้นผิว OpenClaw ต้องการ runtime events หรือ hooks เนทีฟ
- หาก runtime เนทีฟเป็นเจ้าของสถานะเธรด canonical OpenClaw ควรทำสำเนาและฉาย context ไม่ใช่เขียน internals ที่ไม่รองรับใหม่

## การเลือก runtime

OpenClaw เลือก embedded runtime หลังจาก resolve provider และโมเดลแล้ว:

1. runtime ที่บันทึกไว้ของเซสชันมีสิทธิ์ก่อน การเปลี่ยนการกำหนดค่าไม่ได้ hot-switch transcript ที่มีอยู่ไปยังระบบเธรดเนทีฟอื่น
2. `OPENCLAW_AGENT_RUNTIME=<id>` บังคับใช้ runtime นั้นสำหรับเซสชันใหม่หรือเซสชันที่ reset
3. `agents.defaults.agentRuntime.id` หรือ `agents.list[].agentRuntime.id` สามารถตั้งเป็น `auto`, `pi`, embedded harness id ที่ลงทะเบียนไว้ เช่น `codex`, หรือ alias ของ CLI backend ที่รองรับ เช่น `claude-cli`
4. ในโหมด `auto` runtime ของ Plugin ที่ลงทะเบียนไว้สามารถ claim คู่ provider/model ที่รองรับ
5. หากไม่มี runtime ใด claim เทิร์นในโหมด `auto` และตั้ง `fallback: "pi"` ไว้ (ค่าเริ่มต้น) OpenClaw จะใช้ PI เป็น fallback เพื่อความเข้ากันได้ ตั้ง `fallback: "none"` เพื่อให้การเลือกในโหมด `auto` ที่ไม่ตรงกันล้มเหลวแทน

runtime ของ Plugin ที่ระบุชัดเจนจะ fail closed โดยค่าเริ่มต้น ตัวอย่างเช่น `agentRuntime.id: "codex"` หมายถึง Codex หรือข้อผิดพลาดการเลือกที่ชัดเจน เว้นแต่คุณตั้ง `fallback: "pi"` ในขอบเขต override เดียวกัน runtime override จะไม่สืบทอดการตั้งค่า fallback ที่กว้างกว่า ดังนั้น `agentRuntime.id: "codex"` ระดับ agent จะไม่ถูกส่งกลับไปยัง PI แบบเงียบ ๆ เพียงเพราะ defaults ใช้ `fallback: "pi"`

alias ของ CLI backend แตกต่างจาก embedded harness ids รูปแบบ Claude CLI ที่แนะนำคือ:

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

refs แบบเก่า เช่น `claude-cli/claude-opus-4-7` ยังรองรับเพื่อความเข้ากันได้ แต่การกำหนดค่าใหม่ควรคง provider/model ให้เป็น canonical และใส่ execution backend ใน `agentRuntime.id`

โหมด `auto` ตั้งใจให้ระมัดระวัง runtime ของ Plugin สามารถ claim คู่ provider/model ที่เข้าใจได้ แต่ Plugin Codex จะไม่ claim provider `openai-codex` ในโหมด `auto` สิ่งนี้คง `openai-codex/*` ให้เป็นเส้นทาง PI Codex OAuth ที่ชัดเจน และหลีกเลี่ยงการย้ายการกำหนดค่า subscription-auth ไปยัง native app-server harness อย่างเงียบ ๆ

หาก `openclaw doctor` เตือนว่าเปิดใช้ Plugin `codex` อยู่ขณะที่ `openai-codex/*` ยัง route ผ่าน PI ให้ถือว่านั่นเป็นการวินิจฉัย ไม่ใช่การ migration คงการกำหนดค่าไว้ตามเดิมเมื่อ PI Codex OAuth คือสิ่งที่คุณต้องการ เปลี่ยนเป็น `openai/<model>` พร้อม `agentRuntime.id: "codex"` เฉพาะเมื่อคุณต้องการการดำเนินการผ่าน Codex app-server เนทีฟ

## สัญญาความเข้ากันได้

เมื่อ runtime ไม่ใช่ PI ควรจัดทำเอกสารว่ารองรับพื้นผิวใดของ OpenClaw ใช้รูปแบบนี้สำหรับเอกสาร runtime:

| คำถาม                               | เหตุผลที่สำคัญ                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ใครเป็นเจ้าของวงรอบโมเดล?               | กำหนดว่าการลองใหม่ การดำเนินการต่อของเครื่องมือ และการตัดสินใจคำตอบสุดท้ายเกิดขึ้นที่ใด                   |
| ใครเป็นเจ้าของประวัติเธรดที่เป็นแหล่งอ้างอิงหลัก?     | กำหนดว่า OpenClaw สามารถแก้ไขประวัติได้ หรือทำได้เพียงสะท้อนประวัตินั้น                                   |
| เครื่องมือแบบไดนามิกของ OpenClaw ทำงานหรือไม่?        | การรับส่งข้อความ เซสชัน Cron และเครื่องมือที่ OpenClaw เป็นเจ้าของต้องพึ่งพาสิ่งนี้                                 |
| hook ของเครื่องมือแบบไดนามิกทำงานหรือไม่?            | Plugin คาดหวัง `before_tool_call`, `after_tool_call` และ middleware รอบเครื่องมือที่ OpenClaw เป็นเจ้าของ |
| hook ของเครื่องมือ native ทำงานหรือไม่?             | Shell, patch และเครื่องมือที่ runtime เป็นเจ้าของต้องการการรองรับ hook แบบ native สำหรับนโยบายและการสังเกต        |
| lifecycle ของ context engine ทำงานหรือไม่? | Plugin ด้านหน่วยความจำและ context ต้องพึ่งพา lifecycle ของ assemble, ingest, after-turn และ Compaction      |
| มีการเปิดเผยข้อมูล Compaction ใดบ้าง?       | Plugin บางตัวต้องการเพียงการแจ้งเตือน ขณะที่บางตัวต้องการ metadata ของสิ่งที่เก็บไว้/ทิ้งไป                    |
| อะไรที่ตั้งใจไม่รองรับ?     | ผู้ใช้ไม่ควรสันนิษฐานว่าเทียบเท่า PI ในจุดที่ native runtime เป็นเจ้าของสถานะมากกว่า                  |

สัญญาการรองรับ runtime ของ Codex มีเอกสารอยู่ใน
[Codex harness](/th/plugins/codex-harness#v1-support-contract)

## ป้าย Status

เอาต์พุต Status อาจแสดงทั้งป้าย `Execution` และ `Runtime` ให้อ่านเป็น
ข้อมูลวินิจฉัย ไม่ใช่ชื่อ provider

- การอ้างอิงโมเดล เช่น `openai/gpt-5.5` บอก provider/model ที่เลือก
- runtime id เช่น `codex` บอกว่าวงรอบใดกำลังเรียกใช้เทิร์นนั้น
- ป้ายช่องทาง เช่น Telegram หรือ Discord บอกว่าการสนทนาเกิดขึ้นที่ใด

หากเซสชันยังแสดง PI หลังจากเปลี่ยนการกำหนดค่า runtime ให้เริ่มเซสชันใหม่
ด้วย `/new` หรือล้างเซสชันปัจจุบันด้วย `/reset` เซสชันที่มีอยู่จะเก็บ
runtime ที่บันทึกไว้ เพื่อไม่ให้ transcript ถูกเล่นซ้ำผ่านระบบเซสชัน native
สองระบบที่เข้ากันไม่ได้

## ที่เกี่ยวข้อง

- [Codex harness](/th/plugins/codex-harness)
- [OpenAI](/th/providers/openai)
- [Plugin harness ของเอเจนต์](/th/plugins/sdk-agent-harness)
- [วงรอบเอเจนต์](/th/concepts/agent-loop)
- [โมเดล](/th/concepts/models)
- [Status](/th/cli/status)
