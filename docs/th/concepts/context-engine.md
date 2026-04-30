---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw ประกอบบริบทของโมเดลอย่างไร
    - คุณกำลังสลับระหว่างเอนจินเดิมกับเอนจิน Plugin
    - คุณกำลังสร้าง Plugin เอนจินบริบท
sidebarTitle: Context engine
summary: 'เอนจินบริบท: การประกอบบริบทแบบเสียบต่อได้, Compaction, และวงจรชีวิตของเอเจนต์ย่อย'
title: เอนจินบริบท
x-i18n:
    generated_at: "2026-04-30T09:46:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

**context engine** จะควบคุมวิธีที่ OpenClaw สร้าง context ของโมเดลสำหรับแต่ละการรัน: จะรวมข้อความใดบ้าง, สรุปประวัติเก่าอย่างไร, และจัดการ context ข้ามขอบเขตของ subagent อย่างไร

OpenClaw มาพร้อม engine `legacy` ในตัวและใช้เป็นค่าเริ่มต้น — ผู้ใช้ส่วนใหญ่ไม่จำเป็นต้องเปลี่ยนค่านี้ ติดตั้งและเลือก Plugin engine เฉพาะเมื่อคุณต้องการพฤติกรรมการประกอบ, compaction, หรือการเรียกคืนข้ามเซสชันที่แตกต่างออกไป

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ตรวจสอบว่า engine ใดกำลังใช้งานอยู่">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="ติดตั้ง Plugin engine">
    context engine plugins ติดตั้งเหมือน Plugin อื่นของ OpenClaw

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

    รีสตาร์ท Gateway หลังติดตั้งและกำหนดค่าแล้ว

  </Step>
  <Step title="เปลี่ยนกลับเป็น legacy (ไม่บังคับ)">
    ตั้งค่า `contextEngine` เป็น `"legacy"` (หรือลบคีย์นี้ออกทั้งหมด — `"legacy"` คือค่าเริ่มต้น)
  </Step>
</Steps>

## วิธีการทำงาน

ทุกครั้งที่ OpenClaw รัน prompt ของโมเดล context engine จะเข้ามามีส่วนร่วมในจุด lifecycle สี่จุด:

<AccordionGroup>
  <Accordion title="1. รับเข้า">
    ถูกเรียกเมื่อมีการเพิ่มข้อความใหม่ลงในเซสชัน engine สามารถจัดเก็บหรือทำดัชนีข้อความใน data store ของตัวเองได้
  </Accordion>
  <Accordion title="2. ประกอบ">
    ถูกเรียกก่อนการรันโมเดลแต่ละครั้ง engine จะคืนชุดข้อความที่เรียงลำดับแล้ว (และ `systemPromptAddition` ที่ไม่บังคับ) ซึ่งพอดีกับงบประมาณ token
  </Accordion>
  <Accordion title="3. Compact">
    ถูกเรียกเมื่อ context window เต็ม หรือเมื่อผู้ใช้รัน `/compact` engine จะสรุปประวัติเก่าเพื่อคืนพื้นที่
  </Accordion>
  <Accordion title="4. หลังเทิร์น">
    ถูกเรียกหลังจากการรันเสร็จสิ้น engine สามารถคงสถานะ, ทริกเกอร์ background compaction, หรืออัปเดตดัชนีได้
  </Accordion>
</AccordionGroup>

สำหรับ Codex harness แบบ non-ACP ที่รวมมาให้ OpenClaw ใช้ lifecycle เดียวกันโดยฉาย context ที่ประกอบแล้วเข้าไปในคำสั่งสำหรับนักพัฒนาของ Codex และ prompt ของเทิร์นปัจจุบัน Codex ยังคงเป็นเจ้าของประวัติเธรดดั้งเดิมและ compactor ดั้งเดิมของตัวเอง

### lifecycle ของ subagent (ไม่บังคับ)

OpenClaw เรียก hook lifecycle ของ subagent ที่ไม่บังคับสองรายการ:

<ParamField path="prepareSubagentSpawn" type="method">
  เตรียมสถานะ context ที่ใช้ร่วมกันก่อนเริ่มรัน child hook จะได้รับคีย์เซสชัน parent/child, `contextMode` (`isolated` หรือ `fork`), transcript ids/files ที่มีอยู่, และ TTL ที่ไม่บังคับ หากคืน rollback handle มา OpenClaw จะเรียกใช้เมื่อ spawn ล้มเหลวหลังการเตรียมสำเร็จ
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  ทำความสะอาดเมื่อเซสชัน subagent เสร็จสิ้นหรือถูกกวาดล้าง
</ParamField>

### การเพิ่ม system prompt

เมธอด `assemble` สามารถคืนสตริง `systemPromptAddition` ได้ OpenClaw จะเติมข้อความนี้ไว้ด้านหน้าของ system prompt สำหรับการรันนั้น วิธีนี้ช่วยให้ engine แทรกคำแนะนำการเรียกคืนแบบไดนามิก, คำสั่ง retrieval, หรือคำใบ้ที่รับรู้ context โดยไม่ต้องใช้ไฟล์ workspace แบบคงที่

## legacy engine

engine `legacy` ในตัวจะรักษาพฤติกรรมดั้งเดิมของ OpenClaw:

- **รับเข้า**: no-op (session manager จัดการการคงข้อความโดยตรง)
- **ประกอบ**: pass-through (pipeline sanitize → validate → limit ที่มีอยู่ใน runtime จัดการการประกอบ context)
- **Compact**: มอบหมายให้ summarization compaction ในตัว ซึ่งสร้างสรุปเดียวของข้อความเก่าและคงข้อความล่าสุดไว้ตามเดิม
- **หลังเทิร์น**: no-op

legacy engine ไม่ลงทะเบียน tools หรือให้ `systemPromptAddition`

เมื่อไม่ได้ตั้งค่า `plugins.slots.contextEngine` (หรือตั้งเป็น `"legacy"`) จะใช้ engine นี้โดยอัตโนมัติ

## Plugin engines

Plugin สามารถลงทะเบียน context engine โดยใช้ plugin API:

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

factory `ctx` มีค่า `config`, `agentDir`, และ `workspaceDir` ที่ไม่บังคับ เพื่อให้ plugins เริ่มต้นสถานะต่อ agent หรือต่อ workspace ได้ก่อนที่ lifecycle hook แรกจะรัน

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

| สมาชิก            | ชนิด     | วัตถุประสงค์                                              |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | id, ชื่อ, เวอร์ชันของ engine และบอกว่าเป็นเจ้าของ compaction หรือไม่ |
| `ingest(params)`   | Method   | จัดเก็บข้อความเดียว                                      |
| `assemble(params)` | Method   | สร้าง context สำหรับการรันโมเดล (คืน `AssembleResult`) |
| `compact(params)`  | Method   | สรุป/ลด context                                          |

`assemble` คืน `AssembleResult` พร้อม:

<ParamField path="messages" type="Message[]" required>
  ข้อความที่เรียงลำดับแล้วที่จะส่งไปยังโมเดล
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  ค่าประมาณของ engine สำหรับจำนวน token ทั้งหมดใน context ที่ประกอบแล้ว OpenClaw ใช้ค่านี้สำหรับการตัดสินใจ threshold ของ compaction และรายงานวินิจฉัย
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  เติมไว้ด้านหน้าของ system prompt
</ParamField>

`compact` คืน `CompactResult` เมื่อ compaction หมุนเวียน transcript ที่ใช้งานอยู่ `result.sessionId` และ `result.sessionFile` จะระบุเซสชันถัดไปที่ retry หรือเทิร์นถัดไปต้องใช้

สมาชิกที่ไม่บังคับ:

| สมาชิก                        | ชนิด   | วัตถุประสงค์                                                                                                      |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | เริ่มต้นสถานะ engine สำหรับเซสชัน เรียกหนึ่งครั้งเมื่อ engine เห็นเซสชันครั้งแรก (เช่น นำเข้าประวัติ) |
| `ingestBatch(params)`          | Method | รับเข้าเทิร์นที่เสร็จสมบูรณ์เป็นชุด เรียกหลังการรันเสร็จสิ้น พร้อมข้อความทั้งหมดจากเทิร์นนั้นในครั้งเดียว |
| `afterTurn(params)`            | Method | งาน lifecycle หลังการรัน (คงสถานะ, ทริกเกอร์ background compaction) |
| `prepareSubagentSpawn(params)` | Method | ตั้งค่าสถานะที่ใช้ร่วมกันสำหรับเซสชัน child ก่อนเริ่มต้น |
| `onSubagentEnded(params)`      | Method | ทำความสะอาดหลัง subagent จบลง |
| `dispose()`                    | Method | ปล่อยทรัพยากร เรียกระหว่างการปิด Gateway หรือ reload Plugin — ไม่ใช่ต่อเซสชัน |

### ownsCompaction

`ownsCompaction` ควบคุมว่า in-attempt auto-compaction ในตัวของ Pi จะยังเปิดใช้งานสำหรับการรันนั้นหรือไม่:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    engine เป็นเจ้าของพฤติกรรม compaction OpenClaw ปิดใช้งาน auto-compaction ในตัวของ Pi สำหรับการรันนั้น และการใช้งาน `compact()` ของ engine รับผิดชอบ `/compact`, overflow recovery compaction, และ proactive compaction ใด ๆ ที่ต้องการทำใน `afterTurn()` OpenClaw อาจยังคงรัน pre-prompt overflow safeguard; เมื่อคาดการณ์ว่า transcript เต็มจะล้น recovery path จะเรียก `compact()` ของ engine ที่ใช้งานอยู่ก่อนส่ง prompt อีกครั้ง
  </Accordion>
  <Accordion title="ownsCompaction: false หรือไม่ได้ตั้งค่า">
    auto-compaction ในตัวของ Pi อาจยังรันระหว่างการประมวลผล prompt แต่เมธอด `compact()` ของ engine ที่ใช้งานอยู่ยังคงถูกเรียกสำหรับ `/compact` และ overflow recovery
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **ไม่ได้** หมายความว่า OpenClaw จะ fallback ไปยัง compaction path ของ legacy engine โดยอัตโนมัติ
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

`compact()` แบบ no-op ไม่ปลอดภัยสำหรับ engine ที่ใช้งานอยู่และไม่ได้เป็นเจ้าของ เพราะจะปิดใช้งาน `/compact` ปกติและ compaction path สำหรับ overflow-recovery ของ engine slot นั้น

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
slot นี้เป็นแบบ exclusive ขณะรัน — จะ resolve context engine ที่ลงทะเบียนไว้เพียงหนึ่งตัวสำหรับการรันหรือการดำเนินการ compaction ที่กำหนด plugins `kind: "context-engine"` อื่นที่เปิดใช้งานยังสามารถโหลดและรันโค้ดลงทะเบียนของตัวเองได้; `plugins.slots.contextEngine` เพียงเลือก id ของ engine ที่ลงทะเบียนซึ่ง OpenClaw จะ resolve เมื่อต้องใช้ context engine
</Note>

<Note>
**ถอนการติดตั้ง Plugin:** เมื่อคุณถอนการติดตั้ง Plugin ที่เลือกอยู่ในปัจจุบันเป็น `plugins.slots.contextEngine` OpenClaw จะรีเซ็ต slot กลับเป็นค่าเริ่มต้น (`legacy`) พฤติกรรมรีเซ็ตแบบเดียวกันนี้ใช้กับ `plugins.slots.memory` ไม่จำเป็นต้องแก้ config ด้วยตนเอง
</Note>

## ความสัมพันธ์กับ compaction และ memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction เป็นหนึ่งในหน้าที่ของเอนจินบริบท เอนจินแบบเดิมมอบหมายงานให้การสรุปในตัวของ OpenClaw เอนจิน Plugin สามารถใช้กลยุทธ์ Compaction ใดก็ได้ (สรุปแบบ DAG, การดึงข้อมูลแบบเวกเตอร์ ฯลฯ)
  </Accordion>
  <Accordion title="Plugin หน่วยความจำ">
    Plugin หน่วยความจำ (`plugins.slots.memory`) แยกจากเอนจินบริบท Plugin หน่วยความจำให้ความสามารถด้านการค้นหา/การดึงข้อมูล ส่วนเอนจินบริบทควบคุมสิ่งที่โมเดลมองเห็น ทั้งสองอย่างสามารถทำงานร่วมกันได้ — เอนจินบริบทอาจใช้ข้อมูลจาก Plugin หน่วยความจำระหว่างการประกอบบริบท เอนจิน Plugin ที่ต้องการเส้นทางพรอมป์ Active Memory ควรเลือกใช้ `buildMemorySystemPromptAddition(...)` จาก `openclaw/plugin-sdk/core` ซึ่งจะแปลงส่วนพรอมป์ Active Memory เป็น `systemPromptAddition` ที่พร้อมเติมไว้ข้างหน้า หากเอนจินต้องการการควบคุมระดับต่ำกว่า ก็ยังสามารถดึงบรรทัดดิบจาก `openclaw/plugin-sdk/memory-host-core` ผ่าน `buildActiveMemoryPromptSection(...)` ได้
  </Accordion>
  <Accordion title="การตัดทอนเซสชัน">
    การตัดผลลัพธ์เครื่องมือเก่าในหน่วยความจำยังคงทำงานอยู่ ไม่ว่าเอนจินบริบทใดจะกำลังใช้งานอยู่
  </Accordion>
</AccordionGroup>

## เคล็ดลับ

- ใช้ `openclaw doctor` เพื่อตรวจสอบว่าเอนจินของคุณโหลดได้อย่างถูกต้อง
- หากสลับเอนจิน เซสชันที่มีอยู่จะดำเนินต่อด้วยประวัติปัจจุบันของตัวเอง เอนจินใหม่จะเข้ามารับช่วงสำหรับการรันในอนาคต
- ข้อผิดพลาดของเอนจินจะถูกบันทึกและแสดงในข้อมูลวินิจฉัย หากเอนจิน Plugin ลงทะเบียนไม่สำเร็จหรือไม่สามารถแก้รหัสเอนจินที่เลือกได้ OpenClaw จะไม่ย้อนกลับโดยอัตโนมัติ การรันจะล้มเหลวจนกว่าคุณจะแก้ไข Plugin หรือสลับ `plugins.slots.contextEngine` กลับเป็น `"legacy"`
- สำหรับการพัฒนา ใช้ `openclaw plugins install -l ./my-engine` เพื่อลิงก์ไดเรกทอรี Plugin ภายในเครื่องโดยไม่ต้องคัดลอก

## ที่เกี่ยวข้อง

- [Compaction](/th/concepts/compaction) — การสรุปบทสนทนายาว
- [บริบท](/th/concepts/context) — วิธีสร้างบริบทสำหรับรอบการทำงานของเอเจนต์
- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — การลงทะเบียน Plugin เอนจินบริบท
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) — ฟิลด์แมนิเฟสต์ของ Plugin
- [Plugins](/th/tools/plugin) — ภาพรวมของ Plugin
