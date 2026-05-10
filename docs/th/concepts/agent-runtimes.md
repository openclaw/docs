---
read_when:
    - คุณกำลังเลือกระหว่าง PI, Codex, ACP หรือรันไทม์เอเจนต์เนทีฟอื่น
    - คุณสับสนกับป้ายกำกับผู้ให้บริการ/โมเดล/รันไทม์ในสถานะหรือการกำหนดค่า
    - คุณกำลังจัดทำเอกสารเกี่ยวกับความเท่าเทียมด้านการรองรับสำหรับฮาร์เนสแบบเนทีฟ
summary: วิธีที่ OpenClaw แยกผู้ให้บริการโมเดล โมเดล ช่องทาง และรันไทม์ของเอเจนต์
title: รันไทม์ของเอเจนต์
x-i18n:
    generated_at: "2026-05-10T19:32:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**รันไทม์ของเอเจนต์** คือคอมโพเนนต์ที่เป็นเจ้าของลูปโมเดลที่เตรียมไว้หนึ่งชุด: รับพรอมป์ ขับเคลื่อนเอาต์พุตของโมเดล จัดการการเรียกเครื่องมือแบบเนทีฟ และส่งเทิร์นที่เสร็จแล้วกลับไปยัง OpenClaw

รันไทม์อาจสับสนกับผู้ให้บริการได้ง่าย เพราะทั้งคู่ปรากฏอยู่ใกล้กับการกำหนดค่าโมเดล ทั้งสองเป็นเลเยอร์ที่ต่างกัน:

| เลเยอร์       | ตัวอย่าง                              | ความหมาย                                                           |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| ผู้ให้บริการ  | `openai`, `anthropic`, `openai-codex` | วิธีที่ OpenClaw ตรวจสอบสิทธิ์ ค้นพบโมเดล และตั้งชื่อ model refs |
| โมเดล         | `gpt-5.5`, `claude-opus-4-6`          | โมเดลที่เลือกสำหรับเทิร์นของเอเจนต์                              |
| รันไทม์ของเอเจนต์ | `pi`, `codex`, `claude-cli`           | ลูประดับต่ำหรือแบ็กเอนด์ที่ดำเนินเทิร์นที่เตรียมไว้             |
| ช่องทาง       | Telegram, Discord, Slack, WhatsApp    | จุดที่ข้อความเข้าและออกจาก OpenClaw                              |

คุณจะเห็นคำว่า **harness** ในโค้ดด้วย harness คือการใช้งานจริงที่ให้รันไทม์ของเอเจนต์ ตัวอย่างเช่น Codex harness ที่รวมมาให้ใช้งานรันไทม์ `codex` การกำหนดค่าสาธารณะใช้ `agentRuntime.id` บนรายการผู้ให้บริการหรือโมเดล ส่วนคีย์รันไทม์ระดับทั้งเอเจนต์เป็นของเดิมและถูกละเว้น `openclaw doctor --fix` จะลบการตรึงรันไทม์ระดับทั้งเอเจนต์แบบเก่า และเขียน runtime model refs แบบเดิมใหม่ให้เป็น provider/model refs ตามหลัก พร้อมนโยบายรันไทม์แบบกำหนดขอบเขตที่โมเดลเมื่อจำเป็น

มีรันไทม์สองตระกูล:

- **Embedded harnesses** ทำงานภายในลูปเอเจนต์ที่เตรียมไว้ของ OpenClaw ปัจจุบันคือรันไทม์ `pi` ในตัว รวมถึง Plugin harnesses ที่ลงทะเบียนไว้ เช่น `codex`
- **CLI backends** เรียกใช้โปรเซส CLI ภายในเครื่อง โดยยังคง model ref ให้เป็นแบบ canonical ตัวอย่างเช่น `anthropic/claude-opus-4-7` พร้อม `agentRuntime.id: "claude-cli"` ที่กำหนดขอบเขตระดับโมเดล หมายถึง “เลือกโมเดล Anthropic แล้วดำเนินการผ่าน Claude CLI” `claude-cli` ไม่ใช่ embedded harness id และต้องไม่ส่งเข้าไปในการเลือก AgentHarness

## พื้นผิวของ Codex

ความสับสนส่วนใหญ่มาจากหลายพื้นผิวที่ใช้ชื่อ Codex ร่วมกัน:

| พื้นผิว                                          | ชื่อ/การกำหนดค่าใน OpenClaw          | สิ่งที่ทำ                                                                                                   |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| รันไทม์ app-server ของ Codex แบบเนทีฟ            | `openai/*` model refs                | รันเทิร์นเอเจนต์แบบฝังตัวของ OpenAI ผ่าน Codex app-server นี่คือการตั้งค่า ChatGPT/Codex แบบ subscription ทั่วไป |
| โปรไฟล์ตรวจสอบสิทธิ์ Codex OAuth                | `openai-codex` auth provider         | จัดเก็บการตรวจสอบสิทธิ์ ChatGPT/Codex แบบ subscription ที่ Codex app-server harness ใช้                      |
| อะแดปเตอร์ Codex ACP                            | `runtime: "acp"`, `agentId: "codex"` | รัน Codex ผ่าน control plane ภายนอก ACP/acpx ใช้เฉพาะเมื่อมีการขอ ACP/acpx อย่างชัดเจน                     |
| ชุดคำสั่งควบคุมแชต Codex แบบเนทีฟ               | `/codex ...`                         | ผูก กลับมาทำต่อ กำกับ หยุด และตรวจสอบเธรด Codex app-server จากแชต                                        |
| เส้นทาง OpenAI Platform API สำหรับพื้นผิวที่ไม่ใช่เอเจนต์ | `openai/*` พร้อมการตรวจสอบสิทธิ์ด้วย API key | ใช้สำหรับ OpenAI APIs โดยตรง เช่น รูปภาพ embeddings เสียง และ realtime                                  |

พื้นผิวเหล่านี้แยกจากกันโดยตั้งใจ การเปิดใช้ Plugin `codex` ทำให้ฟีเจอร์ app-server แบบเนทีฟพร้อมใช้งาน `openclaw doctor --fix` เป็นเจ้าของการซ่อมแซมเส้นทาง `openai-codex/*` แบบเดิมและการล้างการตรึงเซสชันที่ค้างอยู่ การเลือก `openai/*` สำหรับโมเดลเอเจนต์ตอนนี้หมายถึง “รันสิ่งนี้ผ่าน Codex” เว้นแต่ว่ากำลังใช้พื้นผิว OpenAI API ที่ไม่ใช่เอเจนต์

การตั้งค่า ChatGPT/Codex แบบ subscription ที่พบบ่อยใช้ Codex OAuth สำหรับการตรวจสอบสิทธิ์ แต่คง model ref เป็น `openai/*` และเลือกรันไทม์ `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

นั่นหมายความว่า OpenClaw เลือก OpenAI model ref แล้วขอให้รันไทม์ Codex app-server รันเทิร์นเอเจนต์แบบฝังตัว ไม่ได้หมายความว่า “ใช้การคิดค่าบริการผ่าน API” และไม่ได้หมายความว่าช่องทาง แคตตาล็อกผู้ให้บริการโมเดล หรือที่เก็บเซสชันของ OpenClaw กลายเป็น Codex

เมื่อเปิดใช้ Plugin `codex` ที่รวมมาให้ การควบคุม Codex ด้วยภาษาธรรมชาติควรใช้พื้นผิวคำสั่ง `/codex` แบบเนทีฟ (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) แทน ACP ใช้ ACP สำหรับ Codex เฉพาะเมื่อผู้ใช้ขอ ACP/acpx อย่างชัดเจน หรือกำลังทดสอบเส้นทางอะแดปเตอร์ ACP ส่วน Claude Code, Gemini CLI, OpenCode, Cursor และ external harnesses ที่คล้ายกันยังคงใช้ ACP

นี่คือแผนผังการตัดสินใจสำหรับเอเจนต์:

1. หากผู้ใช้ขอ **Codex bind/control/thread/resume/steer/stop** ให้ใช้พื้นผิวคำสั่ง `/codex` แบบเนทีฟเมื่อเปิดใช้ Plugin `codex` ที่รวมมาให้
2. หากผู้ใช้ขอ **Codex เป็นรันไทม์แบบฝังตัว** หรือต้องการประสบการณ์เอเจนต์ Codex ปกติที่รองรับด้วย subscription ให้ใช้ `openai/<model>`
3. หากผู้ใช้เลือก **PI สำหรับโมเดล OpenAI อย่างชัดเจน** ให้คง model ref เป็น `openai/<model>` และตั้งนโยบายรันไทม์ระดับผู้ให้บริการ/โมเดลเป็น `agentRuntime.id: "pi"` โปรไฟล์ตรวจสอบสิทธิ์ `openai-codex` ที่เลือกจะถูกส่งภายในผ่าน legacy Codex-auth transport ของ PI
4. หากการกำหนดค่าเดิมยังมี **`openai-codex/*` model refs** ให้ซ่อมแซมเป็น `openai/<model>` ด้วย `openclaw doctor --fix`; doctor จะคงเส้นทางตรวจสอบสิทธิ์ Codex ไว้โดยเพิ่ม `agentRuntime.id: "codex"` ที่กำหนดขอบเขตระดับผู้ให้บริการ/โมเดลในจุดที่ model ref เดิมสื่อความหมายนั้น
5. หากผู้ใช้ระบุ **ACP**, **acpx** หรือ **Codex ACP adapter** อย่างชัดเจน ให้ใช้ ACP พร้อม `runtime: "acp"` และ `agentId: "codex"`
6. หากคำขอเป็นเรื่อง **Claude Code, Gemini CLI, OpenCode, Cursor, Droid หรือ external harness อื่น** ให้ใช้ ACP/acpx ไม่ใช่รันไทม์ sub-agent แบบเนทีฟ

| คุณหมายถึง...                             | ใช้...                                       |
| ----------------------------------------- | -------------------------------------------- |
| การควบคุมแชต/เธรด Codex app-server       | `/codex ...` จาก Plugin `codex` ที่รวมมาให้ |
| รันไทม์เอเจนต์แบบฝังตัวของ Codex app-server | `openai/*` agent model refs                  |
| OpenAI Codex OAuth                        | `openai-codex` auth profiles                 |
| Claude Code หรือ external harness อื่น    | ACP/acpx                                     |

สำหรับการแยกคำนำหน้าตระกูล OpenAI โปรดดู [OpenAI](/th/providers/openai) และ [ผู้ให้บริการโมเดล](/th/concepts/model-providers) สำหรับสัญญาการรองรับรันไทม์ Codex โปรดดู [รันไทม์ Codex harness](/th/plugins/codex-harness-runtime#v1-support-contract)

## ความเป็นเจ้าของรันไทม์

รันไทม์ต่างกันเป็นเจ้าของลูปในระดับที่ต่างกัน

| พื้นผิว                     | OpenClaw PI แบบฝังตัว                  | Codex app-server                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| เจ้าของลูปโมเดล             | OpenClaw ผ่าน PI embedded runner        | Codex app-server                                                            |
| สถานะเธรด canonical         | transcript ของ OpenClaw                 | เธรด Codex พร้อม transcript mirror ของ OpenClaw                             |
| เครื่องมือแบบไดนามิกของ OpenClaw | ลูปเครื่องมือ OpenClaw แบบเนทีฟ         | เชื่อมผ่านอะแดปเตอร์ Codex                                                   |
| เครื่องมือ shell และไฟล์แบบเนทีฟ | เส้นทาง PI/OpenClaw                    | เครื่องมือเนทีฟของ Codex เชื่อมผ่าน native hooks ในจุดที่รองรับ            |
| เอนจินบริบท                 | การประกอบบริบทแบบเนทีฟของ OpenClaw     | OpenClaw projects ประกอบบริบทเข้าไปในเทิร์น Codex                          |
| Compaction                  | OpenClaw หรือเอนจินบริบทที่เลือก       | Compaction แบบเนทีฟของ Codex พร้อมการแจ้งเตือน OpenClaw และการบำรุงรักษา mirror |
| การส่งผ่านช่องทาง           | OpenClaw                                | OpenClaw                                                                    |

การแบ่งความเป็นเจ้าของนี้คือกฎออกแบบหลัก:

- หาก OpenClaw เป็นเจ้าของพื้นผิว OpenClaw สามารถให้พฤติกรรม Plugin hook ปกติได้
- หากรันไทม์แบบเนทีฟเป็นเจ้าของพื้นผิว OpenClaw ต้องการ runtime events หรือ native hooks
- หากรันไทม์แบบเนทีฟเป็นเจ้าของสถานะเธรด canonical OpenClaw ควร mirror และ project บริบท ไม่ใช่เขียน internals ที่ไม่รองรับใหม่

## การเลือกรันไทม์

OpenClaw เลือกรันไทม์แบบฝังตัวหลังจากแก้ผู้ให้บริการและโมเดลแล้ว:

1. นโยบายรันไทม์ที่กำหนดขอบเขตระดับโมเดลชนะก่อน สิ่งนี้อยู่ได้ในรายการโมเดลของผู้ให้บริการที่กำหนดค่าไว้ หรือใน `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`
2. นโยบายรันไทม์ที่กำหนดขอบเขตระดับผู้ให้บริการตามมาที่ `models.providers.<provider>.agentRuntime`
3. ในโหมด `auto` รันไทม์ของ Plugin ที่ลงทะเบียนไว้สามารถ claim คู่ผู้ให้บริการ/โมเดลที่รองรับ
4. หากไม่มีรันไทม์ใด claim เทิร์นในโหมด `auto` OpenClaw จะใช้ PI เป็นรันไทม์ความเข้ากันได้ ใช้ runtime id แบบชัดเจนเมื่อการรันต้องเข้มงวด

การตรึงรันไทม์ระดับทั้งเซสชันและทั้งเอเจนต์ถูกละเว้น ซึ่งรวมถึง `OPENCLAW_AGENT_RUNTIME`, สถานะเซสชัน `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime` รัน `openclaw doctor --fix` เพื่อลบการกำหนดค่ารันไทม์ระดับทั้งเอเจนต์ที่ค้างอยู่ และแปลง runtime model refs แบบเดิมในจุดที่ OpenClaw สามารถรักษาเจตนาไว้ได้

รันไทม์ Plugin ระดับผู้ให้บริการ/โมเดลที่ระบุอย่างชัดเจนจะ fail closed ตัวอย่างเช่น `agentRuntime.id: "codex"` บนผู้ให้บริการหรือโมเดล หมายถึง Codex หรือข้อผิดพลาดการเลือก/รันไทม์ที่ชัดเจน และจะไม่ถูกส่งกลับไปยัง PI อย่างเงียบ ๆ

นามแฝง CLI backend ต่างจาก embedded harness ids รูปแบบ Claude CLI ที่แนะนำคือ:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

refs แบบเดิม เช่น `claude-cli/claude-opus-4-7` ยังรองรับเพื่อความเข้ากันได้ แต่การกำหนดค่าใหม่ควรคง provider/model ให้เป็น canonical และใส่ execution backend ไว้ในนโยบายรันไทม์ระดับผู้ให้บริการ/โมเดล

โหมด `auto` ตั้งใจให้อนุรักษนิยมสำหรับผู้ให้บริการส่วนใหญ่ โมเดลเอเจนต์ OpenAI เป็นข้อยกเว้น: รันไทม์ที่ไม่ได้ตั้งค่าและ `auto` จะแก้เป็น Codex harness ทั้งคู่ การกำหนดค่ารันไทม์ PI แบบชัดเจนยังคงเป็นเส้นทางความเข้ากันได้แบบ opt-in สำหรับเทิร์นเอเจนต์ `openai/*`; เมื่อจับคู่กับโปรไฟล์ตรวจสอบสิทธิ์ `openai-codex` ที่เลือก OpenClaw จะส่ง PI ภายในผ่าน legacy Codex-auth transport โดยคง model ref สาธารณะเป็น `openai/*` การตรึงเซสชัน OpenAI PI ที่ค้างอยู่จะถูกละเว้นโดยการเลือกรันไทม์ และสามารถล้างได้ด้วย `openclaw doctor --fix`

หาก `openclaw doctor` เตือนว่าเปิดใช้ Plugin `codex` ขณะที่ `openai-codex/*` ยังคงอยู่ในการกำหนดค่า ให้ถือว่านั่นเป็นสถานะเส้นทางเดิม รัน `openclaw doctor --fix` เพื่อเขียนใหม่เป็น `openai/*` พร้อมรันไทม์ Codex

## สัญญาความเข้ากันได้

เมื่อรันไทม์ไม่ใช่ PI ควรจัดทำเอกสารว่ารองรับพื้นผิวใดของ OpenClaw ใช้รูปแบบนี้สำหรับเอกสารรันไทม์:

| คำถาม                               | เหตุผลที่สำคัญ                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ใครเป็นเจ้าของลูปโมเดล?               | กำหนดว่าการลองซ้ำ การดำเนินการต่อของเครื่องมือ และการตัดสินใจคำตอบสุดท้ายเกิดขึ้นที่ใด                   |
| ใครเป็นเจ้าของประวัติ thread ตามแบบแผน?     | กำหนดว่า OpenClaw สามารถแก้ไขประวัติหรือทำได้เพียงมิเรอร์ประวัติเท่านั้น                                   |
| เครื่องมือแบบไดนามิกของ OpenClaw ทำงานหรือไม่?        | การส่งข้อความ เซสชัน cron และเครื่องมือที่ OpenClaw เป็นเจ้าของต้องพึ่งพาสิ่งนี้                                 |
| hook เครื่องมือแบบไดนามิกทำงานหรือไม่?            | Plugins คาดหวัง `before_tool_call`, `after_tool_call` และ middleware รอบเครื่องมือที่ OpenClaw เป็นเจ้าของ |
| hook เครื่องมือเนทีฟทำงานหรือไม่?             | Shell, patch และเครื่องมือที่ runtime เป็นเจ้าของต้องการการรองรับ hook เนทีฟสำหรับนโยบายและการสังเกต        |
| lifecycle ของ context engine ทำงานหรือไม่? | หน่วยความจำและ context plugins ขึ้นอยู่กับ lifecycle ของ assemble, ingest, after-turn และ compaction      |
| เปิดเผยข้อมูล compaction ใดบ้าง?       | plugins บางตัวต้องการเพียงการแจ้งเตือน ขณะที่บางตัวต้องการ metadata ของสิ่งที่เก็บไว้/ตัดทิ้ง                    |
| อะไรที่ไม่รองรับโดยตั้งใจ?     | ผู้ใช้ไม่ควรถือว่ามีความเทียบเท่า PI ในจุดที่ native runtime เป็นเจ้าของ state มากกว่า                  |

สัญญาการรองรับ runtime ของ Codex มีบันทึกไว้ใน
[Codex harness runtime](/th/plugins/codex-harness-runtime#v1-support-contract)

## ป้ายกำกับสถานะ

เอาต์พุตสถานะอาจแสดงทั้งป้ายกำกับ `Execution` และ `Runtime` ให้อ่านเป็น
ข้อมูลวินิจฉัย ไม่ใช่ชื่อ provider

- model ref เช่น `openai/gpt-5.5` บอก provider/model ที่เลือก
- runtime id เช่น `codex` บอกว่าลูปใดกำลังดำเนินการ turn
- ป้ายกำกับ channel เช่น Telegram หรือ Discord บอกว่าการสนทนาเกิดขึ้นที่ใด

หากการรันยังแสดง runtime ที่ไม่คาดคิด ให้ตรวจสอบนโยบาย runtime ของ provider/model
ที่เลือกก่อน session runtime pins แบบเดิมไม่ได้ตัดสิน routing อีกต่อไป

## ที่เกี่ยวข้อง

- [Codex harness](/th/plugins/codex-harness)
- [Codex harness runtime](/th/plugins/codex-harness-runtime)
- [OpenAI](/th/providers/openai)
- [Agent harness plugins](/th/plugins/sdk-agent-harness)
- [Agent loop](/th/concepts/agent-loop)
- [Models](/th/concepts/models)
- [Status](/th/cli/status)
