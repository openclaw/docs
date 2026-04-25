---
read_when:
    - คุณกำลังเลือกระหว่าง PI, Codex, ACP หรือ runtime ของ Agent แบบเนทีฟอื่น ๆ
    - คุณสับสนกับป้ายกำกับผู้ให้บริการ/โมเดล/runtime ในสถานะหรือการกำหนดค่า
    - คุณกำลังจัดทำเอกสารความเท่าเทียมของการรองรับสำหรับ harness แบบเนทีฟ
summary: วิธีที่ OpenClaw แยกผู้ให้บริการโมเดล โมเดล ช่องทาง และ runtime ของ Agent ออกจากกัน
title: runtime ของ Agent
x-i18n:
    generated_at: "2026-04-25T13:45:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f492209da2334361060f0827c243d5d845744be906db9ef116ea00384879b33
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

**runtime ของ Agent** คือคอมโพเนนต์ที่เป็นเจ้าของลูปโมเดลที่เตรียมไว้หนึ่งชุด: มัน
รับ prompt, ขับเอาต์พุตของโมเดล, จัดการการเรียกใช้เครื่องมือแบบเนทีฟ และส่งคืน
เทิร์นที่เสร็จสมบูรณ์กลับไปยัง OpenClaw

runtime มักสับสนกับผู้ให้บริการได้ง่าย เพราะทั้งสองอย่างแสดงอยู่ใกล้กับ
การกำหนดค่าโมเดล แต่เป็นคนละเลเยอร์กัน:

| เลเยอร์      | ตัวอย่าง                              | ความหมาย                                                       |
| ------------ | ------------------------------------- | -------------------------------------------------------------- |
| ผู้ให้บริการ | `openai`, `anthropic`, `openai-codex` | วิธีที่ OpenClaw ยืนยันตัวตน ค้นหาโมเดล และตั้งชื่อ model ref |
| โมเดล        | `gpt-5.5`, `claude-opus-4-6`          | โมเดลที่เลือกสำหรับเทิร์นของ Agent                            |
| runtime ของ Agent | `pi`, `codex`, runtime ที่ขับเคลื่อนด้วย ACP | ลูประดับล่างที่รันเทิร์นที่เตรียมไว้                         |
| ช่องทาง      | Telegram, Discord, Slack, WhatsApp    | ตำแหน่งที่ข้อความเข้าและออกจาก OpenClaw                      |

คุณจะเห็นคำว่า **harness** ในโค้ดและการกำหนดค่าด้วย harness คือ
implementation ที่จัดหา runtime ของ Agent ตัวอย่างเช่น Codex
harness ที่มาพร้อมระบบจะ implement runtime `codex` คีย์ในการกำหนดค่ายังคงชื่อว่า
`embeddedHarness` เพื่อความเข้ากันได้ แต่ในเอกสารสำหรับผู้ใช้และเอาต์พุตสถานะ
โดยทั่วไปควรใช้คำว่า runtime

การตั้งค่า Codex ทั่วไปใช้ผู้ให้บริการ `openai` ร่วมกับ runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

นั่นหมายความว่า OpenClaw เลือก OpenAI model ref แล้วจึงขอให้
runtime app-server ของ Codex รันเทิร์น Agent แบบ embedded ไม่ได้หมายความว่าช่องทาง
catalog ของผู้ให้บริการโมเดล หรือที่เก็บเซสชันของ OpenClaw จะกลายเป็น Codex

สำหรับการแยก prefix ของตระกูล OpenAI ดู [OpenAI](/th/providers/openai) และ
[Model providers](/th/concepts/model-providers) สำหรับสัญญาการรองรับของ runtime Codex
ดู [Codex harness](/th/plugins/codex-harness#v1-support-contract)

## ความเป็นเจ้าของของ runtime

runtime ต่างชนิดกันเป็นเจ้าของส่วนต่าง ๆ ของลูปในระดับที่ไม่เท่ากัน

| พื้นผิว                     | PI embedded ของ OpenClaw                | Codex app-server                                                          |
| --------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| เจ้าของลูปโมเดล            | OpenClaw ผ่าน runner แบบ PI embedded   | Codex app-server                                                          |
| สถานะเธรด canonical        | transcript ของ OpenClaw                | เธรดของ Codex พร้อม transcript mirror ของ OpenClaw                       |
| Dynamic tools ของ OpenClaw | ลูปเครื่องมือแบบเนทีฟของ OpenClaw      | เชื่อมผ่าน adapter ของ Codex                                              |
| เครื่องมือ shell และไฟล์แบบเนทีฟ | เส้นทางของ PI/OpenClaw                 | เครื่องมือเนทีฟของ Codex เชื่อมผ่าน native hook เมื่อรองรับ               |
| Context engine              | การประกอบบริบทแบบเนทีฟของ OpenClaw     | โปรเจกต์ของ OpenClaw ประกอบบริบทเข้าไปในเทิร์นของ Codex                  |
| Compaction                  | OpenClaw หรือ context engine ที่เลือก   | Compaction แบบเนทีฟของ Codex พร้อมการแจ้งเตือนและการดูแล mirror ของ OpenClaw |
| การส่งผ่านช่องทาง           | OpenClaw                                | OpenClaw                                                                  |

การแบ่งความเป็นเจ้าของนี้คือกฎการออกแบบหลัก:

- หาก OpenClaw เป็นเจ้าของพื้นผิว OpenClaw จะสามารถให้พฤติกรรม hook ของ Plugin แบบปกติได้
- หาก runtime แบบเนทีฟเป็นเจ้าของพื้นผิว OpenClaw จะต้องอาศัยเหตุการณ์ของ runtime หรือ native hook
- หาก runtime แบบเนทีฟเป็นเจ้าของสถานะเธรด canonical OpenClaw ควร mirror และ project บริบท ไม่ใช่เขียนทับ internals ที่ไม่รองรับ

## การเลือก runtime

OpenClaw จะเลือก runtime แบบ embedded หลังจาก resolve ผู้ให้บริการและโมเดลแล้ว:

1. runtime ที่บันทึกไว้ของเซสชันจะมีลำดับความสำคัญสูงสุด การเปลี่ยนแปลงการกำหนดค่าจะไม่สลับ
   transcript ที่มีอยู่ไปเป็นระบบเธรดเนทีฟอื่นแบบ hot-switch
2. `OPENCLAW_AGENT_RUNTIME=<id>` จะบังคับใช้ runtime นั้นสำหรับเซสชันใหม่หรือเซสชันที่รีเซ็ต
3. `agents.defaults.embeddedHarness.runtime` หรือ
   `agents.list[].embeddedHarness.runtime` สามารถตั้งค่าเป็น `auto`, `pi` หรือ
   runtime id ที่ลงทะเบียนไว้ เช่น `codex`
4. ในโหมด `auto` runtime ของ Plugin ที่ลงทะเบียนไว้สามารถ claim คู่
   ผู้ให้บริการ/โมเดลที่รองรับได้
5. หากไม่มี runtime ใด claim เทิร์นในโหมด `auto` และมีการตั้งค่า `fallback: "pi"`
   (ค่าเริ่มต้น) OpenClaw จะใช้ PI เป็น fallback สำหรับความเข้ากันได้ ตั้งค่า
   `fallback: "none"` เพื่อให้การเลือกในโหมด `auto` ที่ไม่ตรงกันล้มเหลวแทน

runtime ของ Plugin แบบระบุชัดจะ fail closed เป็นค่าเริ่มต้น ตัวอย่างเช่น
`runtime: "codex"` หมายถึงใช้ Codex หรือเกิดข้อผิดพลาดการเลือกอย่างชัดเจน เว้นแต่คุณจะตั้ง
`fallback: "pi"` ในขอบเขตการเขียนทับเดียวกัน การเขียนทับ runtime จะไม่สืบทอด
การตั้งค่า fallback จากขอบเขตที่กว้างกว่า ดังนั้น `runtime: "codex"` ระดับ Agent จะไม่ถูก
ส่งกลับไปที่ PI แบบเงียบ ๆ เพียงเพราะ defaults ใช้ `fallback: "pi"`

## สัญญาความเข้ากันได้

เมื่อ runtime ไม่ใช่ PI มันควรจัดทำเอกสารว่า OpenClaw รองรับพื้นผิวใดบ้าง
ใช้รูปแบบนี้สำหรับเอกสาร runtime:

| คำถาม                               | เหตุผลที่สำคัญ                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| ใครเป็นเจ้าของลูปโมเดล?            | กำหนดว่าการ retry การต่อเนื่องของเครื่องมือ และการตัดสินใจคำตอบสุดท้ายเกิดขึ้นที่ไหน       |
| ใครเป็นเจ้าของประวัติเธรด canonical? | กำหนดว่า OpenClaw สามารถแก้ไขประวัติได้หรือทำได้เพียง mirror                                |
| Dynamic tools ของ OpenClaw ใช้งานได้หรือไม่? | การส่งข้อความ เซสชัน Cron และเครื่องมือที่ OpenClaw เป็นเจ้าของพึ่งพาสิ่งนี้                |
| hook ของ dynamic tool ใช้งานได้หรือไม่? | Plugin คาดหวัง `before_tool_call`, `after_tool_call` และ middleware รอบเครื่องมือที่ OpenClaw เป็นเจ้าของ |
| hook ของ native tool ใช้งานได้หรือไม่? | shell, patch และเครื่องมือที่ runtime เป็นเจ้าของต้องการการรองรับ native hook สำหรับนโยบายและการสังเกตการณ์ |
| lifecycle ของ context engine ทำงานหรือไม่? | Plugin หน่วยความจำและบริบทขึ้นอยู่กับ assemble, ingest, after-turn และ lifecycle ของ Compaction |
| มีการเปิดเผยข้อมูล Compaction อะไรบ้าง? | Plugin บางตัวต้องการเพียงการแจ้งเตือน ขณะที่บางตัวต้องการ metadata ของสิ่งที่เก็บไว้/ตัดทิ้ง |
| อะไรที่ตั้งใจไม่รองรับ?             | ผู้ใช้ไม่ควรสมมติว่าเทียบเท่า PI ในจุดที่ runtime แบบเนทีฟเป็นเจ้าของสถานะมากกว่า         |

สัญญาการรองรับของ runtime Codex มีเอกสารอยู่ใน
[Codex harness](/th/plugins/codex-harness#v1-support-contract)

## ป้ายกำกับสถานะ

เอาต์พุตสถานะอาจแสดงทั้งป้ายกำกับ `Execution` และ `Runtime` ให้อ่านสิ่งเหล่านี้เป็น
ข้อมูลวินิจฉัย ไม่ใช่ชื่อผู้ให้บริการ

- model ref เช่น `openai/gpt-5.5` บอกผู้ให้บริการ/โมเดลที่เลือก
- runtime id เช่น `codex` บอกว่าลูปใดกำลังรันเทิร์นอยู่
- ป้ายช่องทาง เช่น Telegram หรือ Discord บอกว่าบทสนทนากำลังเกิดขึ้นที่ใด

หากเซสชันยังคงแสดง PI หลังจากเปลี่ยนการกำหนดค่า runtime แล้ว ให้เริ่มเซสชันใหม่
ด้วย `/new` หรือล้างเซสชันปัจจุบันด้วย `/reset` เซสชันที่มีอยู่จะคง runtime ที่บันทึกไว้
เพื่อไม่ให้ transcript เดียวกันถูกเล่นซ้ำผ่านระบบเซสชันเนทีฟที่เข้ากันไม่ได้สองระบบ

## ที่เกี่ยวข้อง

- [Codex harness](/th/plugins/codex-harness)
- [OpenAI](/th/providers/openai)
- [Agent harness plugins](/th/plugins/sdk-agent-harness)
- [Agent loop](/th/concepts/agent-loop)
- [Models](/th/concepts/models)
- [Status](/th/cli/status)
