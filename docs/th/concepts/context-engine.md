---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw ประกอบบริบทของโมเดลอย่างไร
    - คุณกำลังสลับระหว่างเอนจินรุ่นเดิมกับเอนจิน Plugin
    - คุณกำลังสร้าง Plugin สำหรับเอนจินบริบท
sidebarTitle: Context engine
summary: 'เอนจินบริบท: การประกอบบริบทแบบเสียบเปลี่ยนได้, Compaction และวงจรชีวิตของเอเจนต์ย่อย'
title: เอนจินบริบท
x-i18n:
    generated_at: "2026-05-06T09:07:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c33c94971751d92a2ce695db545a0c0abb7adcbe1820383b83f4201fa7e628d
    source_path: concepts/context-engine.md
    workflow: 16
---

**context engine** ควบคุมวิธีที่ OpenClaw สร้างบริบทของโมเดลสำหรับการรันแต่ละครั้ง: จะรวมข้อความใดบ้าง, จะสรุปประวัติเก่าอย่างไร, และจะจัดการบริบทข้ามขอบเขตของ subagent อย่างไร

OpenClaw มาพร้อม engine ในตัวชื่อ `legacy` และใช้เป็นค่าเริ่มต้น - ผู้ใช้ส่วนใหญ่ไม่จำเป็นต้องเปลี่ยนค่านี้ ติดตั้งและเลือก engine แบบ Plugin เฉพาะเมื่อคุณต้องการพฤติกรรมการประกอบบริบท, Compaction, หรือการเรียกคืนข้ามเซสชันที่แตกต่างออกไป

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ตรวจสอบว่า engine ใดกำลังใช้งานอยู่">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="ติดตั้ง engine แบบ Plugin">
    Plugin ของ context engine ติดตั้งเหมือนกับ Plugin อื่นของ OpenClaw

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

    รีสตาร์ต Gateway หลังจากติดตั้งและกำหนดค่าแล้ว

  </Step>
  <Step title="สลับกลับไปใช้ legacy (ไม่บังคับ)">
    ตั้งค่า `contextEngine` เป็น `"legacy"` (หรือลบคีย์นี้ออกทั้งหมด - `"legacy"` คือค่าเริ่มต้น)
  </Step>
</Steps>

## วิธีการทำงาน

ทุกครั้งที่ OpenClaw รันพรอมป์ต์ของโมเดล context engine จะเข้าร่วมในสี่จุดของวงจรชีวิต:

<AccordionGroup>
  <Accordion title="1. รับเข้า">
    เรียกเมื่อมีการเพิ่มข้อความใหม่ลงในเซสชัน engine สามารถจัดเก็บหรือทำดัชนีข้อความในที่เก็บข้อมูลของตัวเองได้
  </Accordion>
  <Accordion title="2. ประกอบ">
    เรียกก่อนการรันโมเดลแต่ละครั้ง engine จะส่งคืนชุดข้อความที่เรียงลำดับแล้ว (และ `systemPromptAddition` ที่เป็นทางเลือก) ซึ่งพอดีกับงบประมาณโทเค็น
  </Accordion>
  <Accordion title="3. Compact">
    เรียกเมื่อหน้าต่างบริบทเต็ม หรือเมื่อผู้ใช้รัน `/compact` engine จะสรุปประวัติเก่าเพื่อเพิ่มพื้นที่ว่าง
  </Accordion>
  <Accordion title="4. หลังจบรอบ">
    เรียกหลังจากการรันเสร็จสิ้น engine สามารถคงสถานะไว้, ทริกเกอร์ Compaction เบื้องหลัง, หรืออัปเดตดัชนีได้
  </Accordion>
</AccordionGroup>

สำหรับ harness ของ Codex แบบไม่ใช่ ACP ที่รวมมา OpenClaw ใช้วงจรชีวิตเดียวกันโดยฉายบริบทที่ประกอบแล้วเข้าไปในคำสั่งสำหรับนักพัฒนาของ Codex และพรอมป์ต์ของรอบปัจจุบัน Codex ยังคงเป็นเจ้าของประวัติ thread ดั้งเดิมและ compactor ดั้งเดิมของตัวเอง

### วงจรชีวิตของ subagent (ไม่บังคับ)

OpenClaw เรียก hook วงจรชีวิตของ subagent แบบไม่บังคับสองรายการ:

<ParamField path="prepareSubagentSpawn" type="method">
  เตรียมสถานะบริบทร่วมก่อนการรันลูกเริ่มต้น hook จะได้รับคีย์เซสชันแม่/ลูก, `contextMode` (`isolated` หรือ `fork`), id/ไฟล์ transcript ที่มีอยู่, และ TTL ที่เป็นทางเลือก หากส่งคืน rollback handle OpenClaw จะเรียกใช้เมื่อการ spawn ล้มเหลวหลังจากการเตรียมสำเร็จ
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  ล้างข้อมูลเมื่อเซสชัน subagent เสร็จสิ้นหรือถูกกวาดล้าง
</ParamField>

### ส่วนเพิ่มของพรอมป์ต์ระบบ

เมธอด `assemble` สามารถส่งคืนสตริง `systemPromptAddition` ได้ OpenClaw จะเติมค่านี้ไว้หน้าพรอมป์ต์ระบบสำหรับการรันนั้น สิ่งนี้ทำให้ engine สามารถฉีดคำแนะนำการเรียกคืนแบบไดนามิก, คำสั่ง retrieval, หรือคำใบ้ที่รับรู้บริบทได้โดยไม่ต้องใช้ไฟล์ workspace แบบคงที่

## engine legacy

engine `legacy` ในตัวจะคงพฤติกรรมดั้งเดิมของ OpenClaw ไว้:

- **รับเข้า**: no-op (session manager จัดการการคงอยู่ของข้อความโดยตรง)
- **ประกอบ**: ส่งผ่าน (pipeline เดิม sanitize → validate → limit ใน runtime จัดการการประกอบบริบท)
- **Compact**: มอบหมายให้ Compaction การสรุปในตัว ซึ่งสร้างสรุปเดียวของข้อความเก่าและคงข้อความล่าสุดไว้ตามเดิม
- **หลังจบรอบ**: no-op

engine legacy ไม่ลงทะเบียนเครื่องมือหรือให้ `systemPromptAddition`

เมื่อไม่ได้ตั้งค่า `plugins.slots.contextEngine` (หรือตั้งค่าเป็น `"legacy"`) engine นี้จะถูกใช้โดยอัตโนมัติ

## engine แบบ Plugin

Plugin สามารถลงทะเบียน context engine ได้โดยใช้ Plugin API:

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
แบบไม่บังคับ เพื่อให้ Plugin สามารถเริ่มต้นสถานะราย agent หรือราย workspace ก่อนที่
hook วงจรชีวิตแรกจะรัน

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

### interface ContextEngine

สมาชิกที่จำเป็น:

| สมาชิก             | ชนิด     | วัตถุประสงค์                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | คุณสมบัติ | id, ชื่อ, เวอร์ชันของ engine และระบุว่าเป็นเจ้าของ Compaction หรือไม่ |
| `ingest(params)`   | เมธอด   | จัดเก็บข้อความเดียว                                   |
| `assemble(params)` | เมธอด   | สร้างบริบทสำหรับการรันโมเดล (ส่งคืน `AssembleResult`) |
| `compact(params)`  | เมธอด   | สรุป/ลดบริบท                                 |

`assemble` ส่งคืน `AssembleResult` พร้อมด้วย:

<ParamField path="messages" type="Message[]" required>
  ข้อความที่เรียงลำดับแล้วที่จะส่งไปยังโมเดล
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  ค่าประมาณจำนวนโทเค็นทั้งหมดในบริบทที่ประกอบแล้วของ engine OpenClaw ใช้ค่านี้สำหรับการตัดสินใจเกณฑ์ Compaction และการรายงานวินิจฉัย
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  เติมไว้หน้าพรอมป์ต์ระบบ
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  ควบคุมค่าประมาณโทเค็นที่ runner ใช้สำหรับการตรวจสอบ overflow
  ล่วงหน้า ค่าเริ่มต้นคือ `"assembled"` ซึ่งหมายถึงตรวจสอบเฉพาะค่าประมาณของ
  พรอมป์ต์ที่ประกอบแล้ว - เหมาะสำหรับ engine ที่ส่งคืนบริบทแบบมีหน้าต่างและสมบูรณ์ในตัวเอง
  ตั้งค่าเป็น `"preassembly_may_overflow"` เฉพาะเมื่อมุมมองที่ประกอบแล้วของคุณสามารถซ่อนความเสี่ยง overflow
  ใน transcript พื้นฐานได้ จากนั้น runner จะใช้ค่าสูงสุดระหว่างค่าประมาณที่ประกอบแล้ว
  และค่าประมาณประวัติเซสชันก่อนการประกอบ (แบบไม่มีหน้าต่าง) เมื่อตัดสินใจ
  ว่าจะ Compact ล่วงหน้าหรือไม่ ไม่ว่าแบบใด ข้อความที่คุณส่งคืน
  ยังคงเป็นสิ่งที่โมเดลเห็น - `promptAuthority` มีผลต่อการตรวจสอบล่วงหน้าเท่านั้น
</ParamField>

`compact` ส่งคืน `CompactResult` เมื่อ Compaction หมุนเวียน transcript ที่ใช้งานอยู่
`result.sessionId` และ `result.sessionFile` จะระบุเซสชันถัดไป
ที่การลองใหม่หรือรอบถัดไปต้องใช้

สมาชิกแบบไม่บังคับ:

| สมาชิก                         | ชนิด   | วัตถุประสงค์                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | เมธอด | เริ่มต้นสถานะ engine สำหรับเซสชัน เรียกหนึ่งครั้งเมื่อ engine เห็นเซสชันเป็นครั้งแรก (เช่น นำเข้าประวัติ) |
| `ingestBatch(params)`          | เมธอด | รับรอบที่เสร็จสิ้นแล้วเป็น batch เรียกหลังการรันเสร็จสิ้น พร้อมข้อความทั้งหมดจากรอบนั้นในครั้งเดียว     |
| `afterTurn(params)`            | เมธอด | งานวงจรชีวิตหลังการรัน (คงสถานะไว้, ทริกเกอร์ Compaction เบื้องหลัง)                                         |
| `prepareSubagentSpawn(params)` | เมธอด | ตั้งค่าสถานะร่วมสำหรับเซสชันลูกก่อนเริ่มต้น                                                       |
| `onSubagentEnded(params)`      | เมธอด | ล้างข้อมูลหลังจาก subagent สิ้นสุด                                                                                 |
| `dispose()`                    | เมธอด | ปล่อยทรัพยากร เรียกระหว่างการปิด Gateway หรือโหลด Plugin ใหม่ - ไม่ใช่ต่อเซสชัน                           |

### ownsCompaction

`ownsCompaction` ควบคุมว่า auto-compaction ในระหว่าง attempt ในตัวของ Pi จะยังเปิดใช้งานสำหรับการรันหรือไม่:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    engine เป็นเจ้าของพฤติกรรม Compaction OpenClaw จะปิด auto-compaction ในตัวของ Pi สำหรับการรันนั้น และการติดตั้งใช้งาน `compact()` ของ engine จะรับผิดชอบ `/compact`, Compaction สำหรับการกู้คืน overflow, และ Compaction เชิงรุกใด ๆ ที่ต้องการทำใน `afterTurn()` OpenClaw อาจยังรัน safeguard overflow ก่อนพรอมป์ต์ เมื่อคาดการณ์ว่า transcript ทั้งหมดจะ overflow เส้นทางการกู้คืนจะเรียก `compact()` ของ engine ที่ใช้งานอยู่ก่อนส่งพรอมป์ต์อีกครั้ง
  </Accordion>
  <Accordion title="ownsCompaction: false หรือไม่ได้ตั้งค่า">
    auto-compaction ในตัวของ Pi อาจยังรันระหว่างการดำเนินการพรอมป์ต์ แต่เมธอด `compact()` ของ engine ที่ใช้งานอยู่จะยังถูกเรียกสำหรับ `/compact` และการกู้คืน overflow
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **ไม่ได้** หมายความว่า OpenClaw จะ fallback ไปใช้เส้นทาง Compaction ของ engine legacy โดยอัตโนมัติ
</Warning>

นั่นหมายความว่ามีรูปแบบ Plugin ที่ถูกต้องสองแบบ:

<Tabs>
  <Tab title="โหมดเป็นเจ้าของ">
    ใช้อัลกอริทึม Compaction ของคุณเองและตั้งค่า `ownsCompaction: true`
  </Tab>
  <Tab title="โหมดมอบหมาย">
    ตั้งค่า `ownsCompaction: false` และให้ `compact()` เรียก `delegateCompactionToRuntime(...)` จาก `openclaw/plugin-sdk/core` เพื่อใช้พฤติกรรม Compaction ในตัวของ OpenClaw
  </Tab>
</Tabs>

`compact()` แบบ no-op ไม่ปลอดภัยสำหรับ engine ที่ใช้งานอยู่และไม่ได้เป็นเจ้าของ เพราะจะปิดเส้นทาง Compaction ปกติของ `/compact` และการกู้คืน overflow สำหรับ slot ของ engine นั้น

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
slot เป็นแบบเอกสิทธิ์ในขณะรัน - จะ resolve context engine ที่ลงทะเบียนไว้เพียงหนึ่งรายการสำหรับการรันหรือการดำเนินการ Compaction ที่กำหนด Plugin `kind: "context-engine"` อื่นที่เปิดใช้งานอยู่ยังสามารถโหลดและรันโค้ดการลงทะเบียนของตนได้ `plugins.slots.contextEngine` เพียงเลือก id ของ engine ที่ลงทะเบียนซึ่ง OpenClaw จะ resolve เมื่อต้องใช้ context engine เท่านั้น
</Note>

<Note>
**การถอนการติดตั้ง Plugin:** เมื่อคุณถอนการติดตั้ง Plugin ที่เลือกอยู่ในปัจจุบันเป็น `plugins.slots.contextEngine` OpenClaw จะรีเซ็ต slot กลับเป็นค่าเริ่มต้น (`legacy`) พฤติกรรมการรีเซ็ตเดียวกันนี้ใช้กับ `plugins.slots.memory` ด้วย ไม่จำเป็นต้องแก้ไข config ด้วยตนเอง
</Note>

## ความสัมพันธ์กับ Compaction และหน่วยความจำ

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction เป็นความรับผิดชอบอย่างหนึ่งของเอนจินบริบท เอนจินเดิมมอบหมายงานให้การสรุปในตัวของ OpenClaw เอนจิน Plugin สามารถใช้กลยุทธ์การ Compaction ใดก็ได้ (สรุปแบบ DAG, การดึงคืนเวกเตอร์ ฯลฯ)
  </Accordion>
  <Accordion title="Memory plugins">
    Plugin หน่วยความจำ (`plugins.slots.memory`) แยกจากเอนจินบริบท Plugin หน่วยความจำให้การค้นหา/การดึงคืน ส่วนเอนจินบริบทควบคุมสิ่งที่โมเดลเห็น ทั้งสองสามารถทำงานร่วมกันได้ - เอนจินบริบทอาจใช้ข้อมูลจาก Plugin หน่วยความจำระหว่างการประกอบ เอนจิน Plugin ที่ต้องการเส้นทางพรอมป์ Active Memory ควรเลือกใช้ `buildMemorySystemPromptAddition(...)` จาก `openclaw/plugin-sdk/core` ซึ่งแปลงส่วนพรอมป์ Active Memory เป็น `systemPromptAddition` ที่พร้อมนำไปเติมด้านหน้า หากเอนจินต้องการการควบคุมระดับต่ำกว่า ก็ยังสามารถดึงบรรทัดดิบจาก `openclaw/plugin-sdk/memory-host-core` ผ่าน `buildActiveMemoryPromptSection(...)` ได้
  </Accordion>
  <Accordion title="Session pruning">
    การตัดผลลัพธ์เครื่องมือเก่าในหน่วยความจำยังคงทำงานไม่ว่าเอนจินบริบทใดจะเปิดใช้งานอยู่
  </Accordion>
</AccordionGroup>

## เคล็ดลับ

- ใช้ `openclaw doctor` เพื่อตรวจสอบว่าเอนจินของคุณโหลดอย่างถูกต้อง
- หากสลับเอนจิน เซสชันที่มีอยู่จะยังคงใช้ประวัติปัจจุบันของตน เอนจินใหม่จะเข้ามารับช่วงสำหรับการรันในอนาคต
- ข้อผิดพลาดของเอนจินจะถูกบันทึกและแสดงใน diagnostics หากเอนจิน Plugin ลงทะเบียนไม่สำเร็จ หรือไม่สามารถแก้ไข id ของเอนจินที่เลือกได้ OpenClaw จะไม่ถอยกลับโดยอัตโนมัติ การรันจะล้มเหลวจนกว่าคุณจะแก้ไข Plugin หรือสลับ `plugins.slots.contextEngine` กลับเป็น `"legacy"`
- สำหรับการพัฒนา ให้ใช้ `openclaw plugins install -l ./my-engine` เพื่อเชื่อมโยงไดเรกทอรี Plugin ภายในเครื่องโดยไม่ต้องคัดลอก

## ที่เกี่ยวข้อง

- [Compaction](/th/concepts/compaction) - การสรุปบทสนทนายาว
- [บริบท](/th/concepts/context) - วิธีสร้างบริบทสำหรับรอบการทำงานของเอเจนต์
- [สถาปัตยกรรม Plugin](/th/plugins/architecture) - การลงทะเบียน Plugin เอนจินบริบท
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) - ฟิลด์แมนิเฟสต์ของ Plugin
- [Plugins](/th/tools/plugin) - ภาพรวม Plugin
