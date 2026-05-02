---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw ประกอบบริบทของโมเดลอย่างไร
    - คุณกำลังสลับระหว่างเอนจินแบบเดิมกับเอนจิน Plugin
    - คุณกำลังสร้าง Plugin สำหรับเอนจินบริบท
sidebarTitle: Context engine
summary: 'เอนจินบริบท: การประกอบบริบทแบบถอดเปลี่ยนได้, Compaction และวงจรชีวิตของเอเจนต์ย่อย'
title: เอนจินบริบท
x-i18n:
    generated_at: "2026-05-02T10:13:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

**context engine** ควบคุมวิธีที่ OpenClaw สร้าง context ของโมเดลสำหรับแต่ละการรัน: จะรวมข้อความใดบ้าง, จะสรุปประวัติเก่าอย่างไร, และจะจัดการ context ข้ามขอบเขตของ subagent อย่างไร

OpenClaw มาพร้อม engine `legacy` ในตัวและใช้เป็นค่าเริ่มต้น — ผู้ใช้ส่วนใหญ่ไม่จำเป็นต้องเปลี่ยนค่านี้ ติดตั้งและเลือก engine จาก Plugin เฉพาะเมื่อคุณต้องการพฤติกรรมการประกอบ, compaction, หรือการเรียกคืนข้ามเซสชันที่ต่างออกไป

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ตรวจสอบว่า engine ใดกำลังทำงานอยู่">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="ติดตั้ง engine จาก Plugin">
    Plugin context engine ติดตั้งเหมือน OpenClaw Plugin อื่น ๆ

    <Tabs>
      <Tab title="จาก npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="จากพาธภายในเครื่อง">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="เปิดใช้งานและเลือก engine">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    รีสตาร์ท gateway หลังจากติดตั้งและกำหนดค่า

  </Step>
  <Step title="สลับกลับไปใช้ legacy (ไม่บังคับ)">
    ตั้งค่า `contextEngine` เป็น `"legacy"` (หรือลบคีย์ออกทั้งหมด — `"legacy"` เป็นค่าเริ่มต้น)
  </Step>
</Steps>

## วิธีทำงาน

ทุกครั้งที่ OpenClaw รัน prompt ของโมเดล context engine จะเข้าร่วมในสี่จุดของวงจรชีวิต:

<AccordionGroup>
  <Accordion title="1. รับเข้า">
    เรียกเมื่อมีข้อความใหม่ถูกเพิ่มลงในเซสชัน engine สามารถจัดเก็บหรือทำดัชนีข้อความในแหล่งเก็บข้อมูลของตัวเองได้
  </Accordion>
  <Accordion title="2. ประกอบ">
    เรียกก่อนการรันโมเดลแต่ละครั้ง engine จะส่งคืนชุดข้อความที่เรียงลำดับแล้ว (และ `systemPromptAddition` ที่ไม่บังคับ) ซึ่งพอดีกับงบประมาณโทเค็น
  </Accordion>
  <Accordion title="3. Compact">
    เรียกเมื่อหน้าต่าง context เต็ม หรือเมื่อผู้ใช้รัน `/compact` engine จะสรุปประวัติเก่าเพื่อคืนพื้นที่ว่าง
  </Accordion>
  <Accordion title="4. หลังจบ turn">
    เรียกหลังจากการรันเสร็จสมบูรณ์ engine สามารถคงสถานะ, เรียก compaction ในพื้นหลัง, หรืออัปเดตดัชนี
  </Accordion>
</AccordionGroup>

สำหรับ Codex harness แบบไม่ใช่ ACP ที่รวมมา OpenClaw จะใช้วงจรชีวิตเดียวกันโดยฉาย context ที่ประกอบแล้วเข้าไปในคำสั่งสำหรับนักพัฒนาของ Codex และ prompt ของ turn ปัจจุบัน Codex ยังคงเป็นเจ้าของประวัติ thread แบบ native และ compactor แบบ native ของตัวเอง

### วงจรชีวิตของ subagent (ไม่บังคับ)

OpenClaw เรียก hook วงจรชีวิตของ subagent ที่ไม่บังคับสองรายการ:

<ParamField path="prepareSubagentSpawn" type="method">
  เตรียมสถานะ context ที่แชร์ก่อนที่การรัน child จะเริ่ม hook ได้รับคีย์เซสชัน parent/child, `contextMode` (`isolated` หรือ `fork`), transcript ids/files ที่พร้อมใช้งาน, และ TTL ที่ไม่บังคับ หากส่งคืน rollback handle OpenClaw จะเรียกใช้เมื่อการ spawn ล้มเหลวหลังจากการเตรียมสำเร็จแล้ว
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  ล้างข้อมูลเมื่อเซสชัน subagent เสร็จสมบูรณ์หรือถูกกวาดล้าง
</ParamField>

### การเพิ่ม system prompt

เมธอด `assemble` สามารถส่งคืนสตริง `systemPromptAddition` ได้ OpenClaw จะเติมสตริงนี้ไว้หน้าสุดของ system prompt สำหรับการรัน ซึ่งช่วยให้ engine แทรกแนวทางการเรียกคืนแบบไดนามิก, คำสั่งการดึงข้อมูล, หรือคำใบ้ตาม context ได้โดยไม่ต้องใช้ไฟล์ workspace แบบคงที่

## engine legacy

engine `legacy` ในตัวรักษาพฤติกรรมดั้งเดิมของ OpenClaw:

- **รับเข้า**: ไม่ทำงาน (session manager จัดการการคงอยู่ของข้อความโดยตรง)
- **ประกอบ**: ส่งผ่าน (pipeline sanitize → validate → limit ที่มีอยู่ใน runtime จัดการการประกอบ context)
- **Compact**: มอบหมายให้ compaction การสรุปในตัว ซึ่งสร้างสรุปเดียวของข้อความเก่าและเก็บข้อความล่าสุดไว้เหมือนเดิม
- **หลังจบ turn**: ไม่ทำงาน

engine legacy ไม่ลงทะเบียนเครื่องมือหรือให้ `systemPromptAddition`

เมื่อไม่ได้ตั้งค่า `plugins.slots.contextEngine` (หรือตั้งค่าเป็น `"legacy"`) engine นี้จะถูกใช้โดยอัตโนมัติ

## engine จาก Plugin

Plugin สามารถลงทะเบียน context engine โดยใช้ API ของ Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

factory `ctx` มีค่า `config`, `agentDir`, และ `workspaceDir`
ที่ไม่บังคับ เพื่อให้ Plugin เริ่มต้นสถานะต่อ agent หรือ ต่อ workspace ได้ก่อนที่
hook วงจรชีวิตตัวแรกจะรัน

จากนั้นเปิดใช้งานใน config:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### อินเทอร์เฟซ ContextEngine

สมาชิกที่จำเป็น:

| สมาชิก             | ชนิด     | จุดประสงค์                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | คุณสมบัติ | id, ชื่อ, เวอร์ชันของ engine และระบุว่า engine เป็นเจ้าของ compaction หรือไม่ |
| `ingest(params)`   | เมธอด   | จัดเก็บข้อความเดียว                                   |
| `assemble(params)` | เมธอด   | สร้าง context สำหรับการรันโมเดล (ส่งคืน `AssembleResult`) |
| `compact(params)`  | เมธอด   | สรุป/ลด context                                 |

`assemble` ส่งคืน `AssembleResult` พร้อม:

<ParamField path="messages" type="Message[]" required>
  ข้อความที่เรียงลำดับแล้วที่จะส่งไปยังโมเดล
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  ค่าประมาณของ engine สำหรับจำนวนโทเค็นทั้งหมดใน context ที่ประกอบแล้ว OpenClaw ใช้ค่านี้สำหรับการตัดสินใจ threshold ของ compaction และการรายงานวินิจฉัย
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  เติมไว้หน้าสุดของ system prompt
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  ควบคุมว่าค่าประมาณโทเค็นใดที่ runner ใช้สำหรับ precheck การล้นแบบล่วงหน้า ค่าเริ่มต้นคือ `"assembled"` ซึ่งหมายความว่าจะตรวจสอบเฉพาะค่าประมาณของ prompt ที่ประกอบแล้ว — เหมาะกับ engine ที่ส่งคืน context แบบมีหน้าต่างและสมบูรณ์ในตัวเอง ตั้งค่าเป็น `"preassembly_may_overflow"` เฉพาะเมื่อมุมมองที่ประกอบแล้วของคุณสามารถซ่อนความเสี่ยงการล้นใน transcript พื้นฐานได้ จากนั้น runner จะใช้ค่าสูงสุดระหว่างค่าประมาณที่ประกอบแล้วและค่าประมาณประวัติเซสชันก่อนประกอบ (ไม่มีการจำกัดหน้าต่าง) เมื่อตัดสินใจว่าจะทำ compact ล่วงหน้าหรือไม่ ไม่ว่าจะเลือกแบบใด ข้อความที่คุณส่งคืนยังคงเป็นสิ่งที่โมเดลเห็น — `promptAuthority` มีผลเฉพาะกับ precheck เท่านั้น
</ParamField>

`compact` ส่งคืน `CompactResult` เมื่อ compaction หมุนเวียน transcript ที่ใช้งานอยู่
`result.sessionId` และ `result.sessionFile` จะระบุเซสชันตัวสืบทอด
ที่ retry หรือ turn ถัดไปต้องใช้

สมาชิกที่ไม่บังคับ:

| สมาชิก                         | ชนิด   | จุดประสงค์                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | เมธอด | เริ่มต้นสถานะ engine สำหรับเซสชัน เรียกครั้งเดียวเมื่อ engine เห็นเซสชันเป็นครั้งแรก (เช่น นำเข้าประวัติ) |
| `ingestBatch(params)`          | เมธอด | รับ turn ที่เสร็จสมบูรณ์เข้าเป็น batch เรียกหลังจากการรันเสร็จสมบูรณ์ โดยมีข้อความทั้งหมดจาก turn นั้นในครั้งเดียว     |
| `afterTurn(params)`            | เมธอด | งานวงจรชีวิตหลังการรัน (คงสถานะ, เรียก compaction ในพื้นหลัง)                                         |
| `prepareSubagentSpawn(params)` | เมธอด | ตั้งค่าสถานะที่แชร์สำหรับเซสชัน child ก่อนเริ่มทำงาน                                                       |
| `onSubagentEnded(params)`      | เมธอด | ล้างข้อมูลหลังจาก subagent สิ้นสุด                                                                                 |
| `dispose()`                    | เมธอด | ปล่อยทรัพยากร เรียกระหว่างการปิด gateway หรือโหลด Plugin ใหม่ — ไม่ใช่ต่อเซสชัน                           |

### ownsCompaction

`ownsCompaction` ควบคุมว่า auto-compaction ระหว่าง attempt ในตัวของ Pi จะยังเปิดใช้งานอยู่สำหรับการรันหรือไม่:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    engine เป็นเจ้าของพฤติกรรม compaction OpenClaw จะปิด auto-compaction ในตัวของ Pi สำหรับการรันนั้น และ implementation `compact()` ของ engine จะรับผิดชอบ `/compact`, compaction สำหรับการกู้คืนจากการล้น, และ compaction เชิงรุกใด ๆ ที่ต้องการทำใน `afterTurn()` OpenClaw อาจยังรัน safeguard การล้นก่อน prompt เมื่อคาดการณ์ว่า transcript เต็มจะล้น เส้นทางการกู้คืนจะเรียก `compact()` ของ engine ที่ใช้งานอยู่ก่อนส่ง prompt อีกครั้ง
  </Accordion>
  <Accordion title="ownsCompaction: false หรือไม่ได้ตั้งค่า">
    auto-compaction ในตัวของ Pi อาจยังรันระหว่างการประมวลผล prompt แต่เมธอด `compact()` ของ engine ที่ใช้งานอยู่ยังคงถูกเรียกสำหรับ `/compact` และการกู้คืนจากการล้น
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **ไม่ได้** หมายความว่า OpenClaw จะ fallback ไปยังเส้นทาง compaction ของ engine legacy โดยอัตโนมัติ
</Warning>

นั่นหมายความว่ามีรูปแบบ Plugin ที่ถูกต้องสองแบบ:

<Tabs>
  <Tab title="โหมดเป็นเจ้าของ">
    ใช้อัลกอริทึม compaction ของคุณเองและตั้งค่า `ownsCompaction: true`
  </Tab>
  <Tab title="โหมดมอบหมาย">
    ตั้งค่า `ownsCompaction: false` และให้ `compact()` เรียก `delegateCompactionToRuntime(...)` จาก `openclaw/plugin-sdk/core` เพื่อใช้พฤติกรรม compaction ในตัวของ OpenClaw
  </Tab>
</Tabs>

`compact()` แบบไม่ทำงานไม่ปลอดภัยสำหรับ engine ที่ไม่เป็นเจ้าของแต่กำลังใช้งานอยู่ เพราะจะปิดเส้นทาง compaction ปกติของ `/compact` และการกู้คืนจากการล้นสำหรับ slot ของ engine นั้น

## อ้างอิงการกำหนดค่า

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
slot เป็นแบบเฉพาะตัวในเวลารัน — จะ resolve context engine ที่ลงทะเบียนไว้ได้เพียงหนึ่งรายการสำหรับการรันหรือการดำเนินการ compaction ใด ๆ Plugin `kind: "context-engine"` อื่นที่เปิดใช้งานอยู่ยังสามารถโหลดและรันโค้ดการลงทะเบียนของตนได้; `plugins.slots.contextEngine` เพียงเลือกว่า OpenClaw จะ resolve engine id ที่ลงทะเบียนไว้รายการใดเมื่อต้องการ context engine
</Note>

<Note>
**การถอนการติดตั้ง Plugin:** เมื่อคุณถอนการติดตั้ง Plugin ที่กำลังถูกเลือกเป็น `plugins.slots.contextEngine` อยู่ OpenClaw จะรีเซ็ต slot กลับไปเป็นค่าเริ่มต้น (`legacy`) พฤติกรรมการรีเซ็ตเดียวกันนี้ใช้กับ `plugins.slots.memory` ด้วย ไม่จำเป็นต้องแก้ config ด้วยตนเอง
</Note>

## ความสัมพันธ์กับ compaction และ memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction เป็นหนึ่งในความรับผิดชอบของเอนจินบริบท เอนจินเดิมมอบหมายงานให้การสรุปในตัวของ OpenClaw เอนจิน Plugin สามารถนำกลยุทธ์ Compaction ใดๆ มาใช้ได้ (การสรุปแบบ DAG, การค้นคืนแบบเวกเตอร์ เป็นต้น)
  </Accordion>
  <Accordion title="Plugin หน่วยความจำ">
    Plugin หน่วยความจำ (`plugins.slots.memory`) แยกจากเอนจินบริบท Plugin หน่วยความจำให้การค้นหา/การค้นคืน ส่วนเอนจินบริบทควบคุมสิ่งที่โมเดลเห็น ทั้งสองสามารถทำงานร่วมกันได้ — เอนจินบริบทอาจใช้ข้อมูลจาก Plugin หน่วยความจำระหว่างการประกอบบริบท เอนจิน Plugin ที่ต้องการเส้นทางพรอมป์ Active Memory ควรใช้ `buildMemorySystemPromptAddition(...)` จาก `openclaw/plugin-sdk/core` ซึ่งจะแปลงส่วนพรอมป์ Active Memory ให้เป็น `systemPromptAddition` ที่พร้อมเติมไว้ข้างหน้า หากเอนจินต้องการการควบคุมระดับต่ำกว่า ก็ยังสามารถดึงบรรทัดดิบจาก `openclaw/plugin-sdk/memory-host-core` ผ่าน `buildActiveMemoryPromptSection(...)` ได้
  </Accordion>
  <Accordion title="การตัดแต่งเซสชัน">
    การตัดผลลัพธ์เครื่องมือเก่าในหน่วยความจำยังคงทำงาน ไม่ว่าเอนจินบริบทใดจะใช้งานอยู่ก็ตาม
  </Accordion>
</AccordionGroup>

## เคล็ดลับ

- ใช้ `openclaw doctor` เพื่อตรวจสอบว่าเอนจินของคุณโหลดอย่างถูกต้อง
- หากสลับเอนจิน เซสชันที่มีอยู่จะดำเนินต่อด้วยประวัติปัจจุบัน เอนจินใหม่จะเข้ามารับช่วงสำหรับการรันในอนาคต
- ข้อผิดพลาดของเอนจินจะถูกบันทึกและแสดงในข้อมูลวินิจฉัย หากเอนจิน Plugin ลงทะเบียนไม่สำเร็จ หรือไม่สามารถระบุ id ของเอนจินที่เลือกได้ OpenClaw จะไม่ย้อนกลับโดยอัตโนมัติ การรันจะล้มเหลวจนกว่าคุณจะแก้ไข Plugin หรือสลับ `plugins.slots.contextEngine` กลับเป็น `"legacy"`
- สำหรับการพัฒนา ให้ใช้ `openclaw plugins install -l ./my-engine` เพื่อเชื่อมโยงไดเรกทอรี Plugin ภายในเครื่องโดยไม่ต้องคัดลอก

## ที่เกี่ยวข้อง

- [Compaction](/th/concepts/compaction) — การสรุปบทสนทนายาวๆ
- [บริบท](/th/concepts/context) — วิธีสร้างบริบทสำหรับรอบการทำงานของเอเจนต์
- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — การลงทะเบียน Plugin เอนจินบริบท
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) — ฟิลด์แมนิเฟสต์ของ Plugin
- [Plugin](/th/tools/plugin) — ภาพรวม Plugin
