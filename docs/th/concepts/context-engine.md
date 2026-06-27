---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw ประกอบบริบทของโมเดลอย่างไร
    - คุณกำลังสลับระหว่างเอนจินเดิมกับเอนจิน Plugin
    - คุณกำลังสร้าง Plugin เครื่องมือบริบท
sidebarTitle: Context engine
summary: 'เอนจินบริบท: การประกอบบริบทแบบเสียบเพิ่มได้, Compaction, และวงจรชีวิตของ subagent'
title: เอนจินบริบท
x-i18n:
    generated_at: "2026-06-27T17:25:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

**เอนจินบริบท** ควบคุมวิธีที่ OpenClaw สร้างบริบทโมเดลสำหรับแต่ละการรัน: จะรวมข้อความใด วิธีสรุปประวัติเก่ากว่า และวิธีจัดการบริบทข้ามขอบเขต subagent

OpenClaw มาพร้อมเอนจิน `legacy` ในตัวและใช้เป็นค่าเริ่มต้น - ผู้ใช้ส่วนใหญ่ไม่จำเป็นต้องเปลี่ยนค่านี้ ติดตั้งและเลือกเอนจิน Plugin เฉพาะเมื่อคุณต้องการพฤติกรรมการประกอบบริบท, Compaction หรือการเรียกคืนข้ามเซสชันที่แตกต่างออกไป

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    Plugin เอนจินบริบทติดตั้งเหมือน Plugin อื่น ๆ ของ OpenClaw

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
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
  <Step title="Switch back to legacy (optional)">
    ตั้งค่า `contextEngine` เป็น `"legacy"` (หรือลบคีย์นี้ออกทั้งหมด - `"legacy"` เป็นค่าเริ่มต้น)
  </Step>
</Steps>

## วิธีการทำงาน

ทุกครั้งที่ OpenClaw รันพรอมป์โมเดล เอนจินบริบทจะเข้าร่วมในสี่จุดของวงจรชีวิต:

<AccordionGroup>
  <Accordion title="1. Ingest">
    ถูกเรียกเมื่อมีการเพิ่มข้อความใหม่ลงในเซสชัน เอนจินสามารถจัดเก็บหรือทำดัชนีข้อความในที่เก็บข้อมูลของตนเองได้
  </Accordion>
  <Accordion title="2. Assemble">
    ถูกเรียกก่อนการรันโมเดลแต่ละครั้ง เอนจินจะส่งคืนชุดข้อความที่เรียงลำดับแล้ว (และ `systemPromptAddition` ที่ไม่บังคับ) ซึ่งพอดีกับงบประมาณโทเคน
  </Accordion>
  <Accordion title="3. Compact">
    ถูกเรียกเมื่อหน้าต่างบริบทเต็ม หรือเมื่อผู้ใช้รัน `/compact` เอนจินจะสรุปประวัติเก่ากว่าเพื่อเพิ่มพื้นที่ว่าง
  </Accordion>
  <Accordion title="4. After turn">
    ถูกเรียกหลังจากการรันเสร็จสมบูรณ์ เอนจินสามารถคงสถานะไว้, ทริกเกอร์ Compaction เบื้องหลัง หรืออัปเดตดัชนีได้
  </Accordion>
</AccordionGroup>

สำหรับฮาร์เนส Codex แบบ non-ACP ที่รวมมาในชุด OpenClaw ใช้วงจรชีวิตเดียวกันโดยฉายบริบทที่ประกอบแล้วลงในคำสั่งสำหรับนักพัฒนาของ Codex และพรอมป์ของเทิร์นปัจจุบัน Codex ยังคงเป็นเจ้าของประวัติ thread ดั้งเดิมและ compactor ดั้งเดิมของตัวเอง

### วงจรชีวิต Subagent (ไม่บังคับ)

OpenClaw เรียก hook วงจรชีวิต subagent ที่ไม่บังคับสองรายการ:

<ParamField path="prepareSubagentSpawn" type="method">
  เตรียมสถานะบริบทที่ใช้ร่วมกันก่อนที่การรันลูกจะเริ่มต้น hook จะได้รับคีย์เซสชันพาเรนต์/ลูก, `contextMode` (`isolated` หรือ `fork`), id/ไฟล์ transcript ที่พร้อมใช้งาน และ TTL ที่ไม่บังคับ หากส่งคืน rollback handle OpenClaw จะเรียกใช้เมื่อการ spawn ล้มเหลวหลังจากเตรียมการสำเร็จแล้ว การ spawn subagent ดั้งเดิมที่ร้องขอ `lightContext` และ resolve เป็น `contextMode="isolated"` จะข้าม hook นี้โดยตั้งใจ เพื่อให้ลูกเริ่มจากบริบท bootstrap แบบเบาโดยไม่มีสถานะก่อน spawn ที่จัดการโดยเอนจินบริบท
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  ทำความสะอาดเมื่อเซสชัน subagent เสร็จสมบูรณ์หรือถูกกวาดล้าง
</ParamField>

### ส่วนเพิ่มเติมของพรอมป์ระบบ

เมธอด `assemble` สามารถส่งคืนสตริง `systemPromptAddition` ได้ OpenClaw จะเติมค่านี้ไว้หน้าพรอมป์ระบบสำหรับการรัน ซึ่งช่วยให้เอนจินฉีดคำแนะนำการเรียกคืนแบบไดนามิก, คำสั่ง retrieval หรือคำใบ้ที่รับรู้บริบทได้โดยไม่ต้องใช้ไฟล์ workspace แบบคงที่

## เอนจิน legacy

เอนจิน `legacy` ในตัวจะรักษาพฤติกรรมดั้งเดิมของ OpenClaw:

- **Ingest**: ไม่ทำอะไร (ตัวจัดการเซสชันจัดการการคงอยู่ของข้อความโดยตรง)
- **Assemble**: ส่งผ่าน (ไปป์ไลน์ sanitize → validate → limit ที่มีอยู่ใน runtime จัดการการประกอบบริบท)
- **Compact**: มอบหมายให้ Compaction การสรุปในตัว ซึ่งสร้างสรุปเดียวของข้อความเก่ากว่าและคงข้อความล่าสุดไว้เหมือนเดิม
- **After turn**: ไม่ทำอะไร

เอนจิน legacy ไม่ลงทะเบียนเครื่องมือหรือให้ `systemPromptAddition`

เมื่อไม่ได้ตั้งค่า `plugins.slots.contextEngine` (หรือตั้งเป็น `"legacy"`) เอนจินนี้จะถูกใช้โดยอัตโนมัติ

## เอนจิน Plugin

Plugin สามารถลงทะเบียนเอนจินบริบทโดยใช้ API ของ Plugin:

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

factory `ctx` มีค่า `config`, `agentDir` และ `workspaceDir`
ที่ไม่บังคับ เพื่อให้ Plugin สามารถเริ่มต้นสถานะต่อ agent หรือต่อ workspace ก่อนที่
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

### อินเทอร์เฟซ ContextEngine

สมาชิกที่จำเป็น:

| สมาชิก | ชนิด | วัตถุประสงค์ |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | คุณสมบัติ | id เอนจิน, ชื่อ, เวอร์ชัน และเป็นเจ้าของ Compaction หรือไม่ |
| `ingest(params)`   | เมธอด | จัดเก็บข้อความเดียว |
| `assemble(params)` | เมธอด | สร้างบริบทสำหรับการรันโมเดล (ส่งคืน `AssembleResult`) |
| `compact(params)`  | เมธอด | สรุป/ลดบริบท |

`assemble` ส่งคืน `AssembleResult` พร้อม:

<ParamField path="messages" type="Message[]" required>
  ข้อความที่เรียงลำดับแล้วเพื่อส่งไปยังโมเดล
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  ค่าประมาณของเอนจินสำหรับจำนวนโทเคนทั้งหมดในบริบทที่ประกอบแล้ว OpenClaw ใช้ค่านี้สำหรับการตัดสินใจเกณฑ์ Compaction และการรายงานวินิจฉัย
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  เติมไว้หน้าพรอมป์ระบบ
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  ควบคุมค่าประมาณโทเคนที่ runner ใช้สำหรับการตรวจสอบ overflow
  ล่วงหน้า ค่าเริ่มต้นคือ `"assembled"` ซึ่งหมายถึงตรวจสอบเฉพาะค่าประมาณของ
  พรอมป์ที่ประกอบแล้วเท่านั้น - เหมาะสำหรับเอนจินที่ส่งคืนบริบทแบบมีหน้าต่างและครบถ้วนในตัวเอง
  ตั้งเป็น `"preassembly_may_overflow"` เฉพาะเมื่อมุมมองที่ประกอบแล้วของคุณอาจซ่อนความเสี่ยง overflow ใน
  transcript เบื้องหลัง จากนั้น runner จะใช้ค่ามากสุดระหว่างค่าประมาณที่ประกอบแล้ว
  กับค่าประมาณประวัติเซสชันก่อนประกอบ (แบบไม่ตัดหน้าต่าง) เมื่อตัดสินใจ
  ว่าจะทำ Compaction ล่วงหน้าหรือไม่ ไม่ว่าจะเลือกแบบใด ข้อความที่คุณส่งคืน
  ยังคงเป็นสิ่งที่โมเดลเห็น - `promptAuthority` มีผลเฉพาะกับการตรวจสอบล่วงหน้า
</ParamField>

`compact` ส่งคืน `CompactResult` เมื่อ Compaction หมุนเวียน transcript ที่ใช้งานอยู่
`result.sessionId` และ `result.sessionFile` จะระบุเซสชันตัวสืบทอด
ที่การลองใหม่หรือเทิร์นถัดไปต้องใช้

สมาชิกที่ไม่บังคับ:

| สมาชิก | ชนิด | วัตถุประสงค์ |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | เมธอด | เริ่มต้นสถานะเอนจินสำหรับเซสชัน เรียกหนึ่งครั้งเมื่อเอนจินพบเซสชันเป็นครั้งแรก (เช่น นำเข้าประวัติ) |
| `ingestBatch(params)`          | เมธอด | รับเทิร์นที่เสร็จสมบูรณ์เป็นชุด เรียกหลังจากการรันเสร็จสมบูรณ์ พร้อมข้อความทั้งหมดจากเทิร์นนั้นในครั้งเดียว |
| `afterTurn(params)`            | เมธอด | งานวงจรชีวิตหลังการรัน (คงสถานะไว้, ทริกเกอร์ Compaction เบื้องหลัง) |
| `prepareSubagentSpawn(params)` | เมธอด | ตั้งค่าสถานะที่ใช้ร่วมกันสำหรับเซสชันลูกก่อนเริ่มต้น |
| `onSubagentEnded(params)`      | เมธอด | ทำความสะอาดหลังจาก subagent สิ้นสุด |
| `dispose()`                    | เมธอด | ปล่อยทรัพยากร เรียกระหว่างการปิด Gateway หรือการโหลด Plugin ใหม่ - ไม่ใช่ต่อเซสชัน |

### การตั้งค่า Runtime

hook วงจรชีวิตที่รันภายใน OpenClaw จะได้รับอ็อบเจ็กต์
`runtimeSettings` ที่ไม่บังคับ นี่เป็นพื้นผิว API ภายในแบบ producer/consumer
ที่มีเวอร์ชันและอ่านอย่างเดียว: OpenClaw สร้างขึ้นสำหรับเอนจินบริบทที่เลือก
และเอนจินบริบทใช้ภายใน hook วงจรชีวิต ค่านี้ไม่ถูกเรนเดอร์
ไปยังผู้ใช้โดยตรง และไม่สร้างพื้นผิวการรายงานเฉพาะ

- `schemaVersion`: ปัจจุบันคือ `1`
- `runtime`: โฮสต์ OpenClaw, โหมด runtime (`normal`, `fallback` หรือ
  `degraded`) และ id ของ harness/runtime ที่ไม่บังคับ
- `contextEngineSelection`: id เอนจินบริบทที่เลือกและแหล่งที่มาของการเลือก
- `executionHost`: id และป้ายชื่อโฮสต์สำหรับพื้นผิวที่เรียก hook
- `model`: โมเดลที่ร้องขอ, โมเดลที่ resolve แล้ว, provider และ family ของโมเดลที่ไม่บังคับ
- `limits`: งบประมาณโทเคนพรอมป์และจำนวนโทเคนเอาต์พุตสูงสุดเมื่อทราบ
- `diagnostics`: โค้ดเหตุผลแบบปิดสำหรับ fallback และ degraded เมื่อทราบ

ฟิลด์ที่อาจไม่ทราบจะแสดงเป็น `null`; ฟิลด์ discriminator เช่น
โหมด runtime และแหล่งที่มาของการเลือกยังคงเป็น non-nullable เอนจินเก่ายังคง
เข้ากันได้: หากเอนจิน legacy แบบ strict ปฏิเสธ `runtimeSettings` ว่าเป็น
คุณสมบัติที่ไม่รู้จัก OpenClaw จะลองเรียกวงจรชีวิตอีกครั้งโดยไม่มีค่านั้นแทนการกักกัน
เอนจิน

### ข้อกำหนดของโฮสต์

เอนจินบริบทสามารถประกาศข้อกำหนดความสามารถของโฮสต์บน `info.hostRequirements`
OpenClaw ตรวจสอบข้อกำหนดเหล่านี้ก่อนเริ่มปฏิบัติการ และ fail closed
พร้อมข้อผิดพลาดที่อธิบายชัดเจนเมื่อ runtime ที่เลือกไม่สามารถตอบสนองได้

สำหรับการรัน agent ให้ประกาศ `assemble-before-prompt` เมื่อเอนจินต้องควบคุม
พรอมป์โมเดลจริงผ่าน `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

การรัน agent ด้วย Codex ดั้งเดิมและ OpenClaw embedded ตอบสนอง `assemble-before-prompt`
แบ็กเอนด์ CLI ทั่วไปไม่รองรับ ดังนั้นเอนจินที่ต้องใช้ความสามารถนี้จะถูกปฏิเสธก่อนที่
กระบวนการ CLI จะเริ่ม

### การแยกความล้มเหลว

OpenClaw แยกเอนจิน Plugin ที่เลือกออกจากเส้นทางการตอบกลับหลัก หาก
เอนจินที่ไม่ใช่ legacy หายไป, ตรวจสอบสัญญาไม่ผ่าน, throw ระหว่างการสร้าง factory
หรือ throw จากเมธอดวงจรชีวิต OpenClaw จะกักกันเอนจินนั้น
สำหรับกระบวนการ Gateway ปัจจุบัน และลดระดับงานเอนจินบริบทไปใช้
เอนจิน `legacy` ในตัว ข้อผิดพลาดจะถูกบันทึกพร้อมปฏิบัติการที่ล้มเหลว เพื่อให้
operator สามารถซ่อมแซม, อัปเดต หรือปิดใช้งาน Plugin ได้โดยที่ agent ไม่
เงียบไป

ความล้มเหลวของข้อกำหนดโฮสต์แตกต่างออกไป: เมื่อ engine ประกาศว่า runtime
ขาด capability ที่จำเป็น OpenClaw จะ fail closed ก่อนเริ่ม run การทำเช่นนี้
ปกป้อง engine ที่อาจทำให้ state เสียหายหากทำงานใน host ที่ไม่รองรับ

### ownsCompaction

`ownsCompaction` ควบคุมว่า auto-compaction ในระหว่าง attempt ที่มีมาให้ใน OpenClaw runtime จะยังเปิดใช้งานสำหรับ run นั้นหรือไม่:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    engine เป็นเจ้าของพฤติกรรม compaction OpenClaw จะปิด auto-compaction ที่มีมาให้ใน OpenClaw runtime สำหรับ run นั้น และ implementation `compact()` ของ engine จะรับผิดชอบ `/compact`, overflow recovery compaction และ proactive compaction ใดๆ ที่ต้องการทำใน `afterTurn()` OpenClaw อาจยังคงรัน pre-prompt overflow safeguard; เมื่อคาดการณ์ว่า transcript ทั้งหมดจะ overflow เส้นทาง recovery จะเรียก `compact()` ของ active engine ก่อนส่ง prompt อีกครั้ง
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    auto-compaction ที่มีมาให้ใน OpenClaw runtime อาจยังรันระหว่างการ execute prompt แต่เมธอด `compact()` ของ active engine จะยังถูกเรียกสำหรับ `/compact` และ overflow recovery
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **ไม่ได้** หมายความว่า OpenClaw จะ fallback ไปยังเส้นทาง compaction ของ legacy engine โดยอัตโนมัติ
</Warning>

นั่นหมายความว่ามีรูปแบบ Plugin ที่ถูกต้องอยู่สองแบบ:

<Tabs>
  <Tab title="Owning mode">
    implement อัลกอริทึม compaction ของคุณเองและตั้งค่า `ownsCompaction: true`
  </Tab>
  <Tab title="Delegating mode">
    ตั้งค่า `ownsCompaction: false` และให้ `compact()` เรียก `delegateCompactionToRuntime(...)` จาก `openclaw/plugin-sdk/core` เพื่อใช้พฤติกรรม compaction ที่มีมาให้ใน OpenClaw
  </Tab>
</Tabs>

`compact()` แบบ no-op ไม่ปลอดภัยสำหรับ active non-owning engine เพราะจะปิดเส้นทาง compaction ปกติของ `/compact` และ overflow-recovery สำหรับ engine slot นั้น

## ข้อมูลอ้างอิงการกำหนดค่า

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
slot เป็นแบบ exclusive ณ runtime - จะ resolve context engine ที่ลงทะเบียนไว้เพียงตัวเดียวสำหรับ run หรือการดำเนินการ compaction ที่กำหนด Plugin `kind: "context-engine"` ตัวอื่นที่เปิดใช้งานอยู่ยังสามารถโหลดและรันโค้ด registration ของตนได้; `plugins.slots.contextEngine` เพียงเลือก registered engine id ที่ OpenClaw จะ resolve เมื่อต้องใช้ context engine
</Note>

<Note>
**การ uninstall Plugin:** เมื่อคุณ uninstall Plugin ที่เลือกอยู่ในปัจจุบันเป็น `plugins.slots.contextEngine` OpenClaw จะรีเซ็ต slot กลับเป็นค่าเริ่มต้น (`legacy`) พฤติกรรมรีเซ็ตเดียวกันนี้ใช้กับ `plugins.slots.memory` ด้วย ไม่จำเป็นต้องแก้ config ด้วยตนเอง
</Note>

## ความสัมพันธ์กับ compaction และ memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction เป็นหนึ่งในความรับผิดชอบของ context engine legacy engine จะ delegate ไปยัง summarization ที่มีมาให้ใน OpenClaw Plugin engine สามารถ implement กลยุทธ์ compaction ใดก็ได้ (DAG summaries, vector retrieval และอื่นๆ)
  </Accordion>
  <Accordion title="Memory plugins">
    Memory plugins (`plugins.slots.memory`) แยกจาก context engine Memory plugins ให้ search/retrieval; context engine ควบคุมสิ่งที่ model เห็น ทั้งสองสามารถทำงานร่วมกันได้ - context engine อาจใช้ข้อมูล memory plugin ระหว่าง assembly Plugin engine ที่ต้องการ active memory prompt path ควรเลือกใช้ `buildMemorySystemPromptAddition(...)` จาก `openclaw/plugin-sdk/core` ซึ่งแปลง active memory prompt sections เป็น `systemPromptAddition` ที่พร้อม prepend หาก engine ต้องการการควบคุมระดับต่ำกว่า ก็ยังสามารถดึง raw lines จาก `openclaw/plugin-sdk/memory-host-core` ผ่าน `buildActiveMemoryPromptSection(...)` ได้
  </Accordion>
  <Accordion title="Session pruning">
    การ trim tool results เก่าใน memory ยังคงรันไม่ว่า context engine ใดจะ active อยู่
  </Accordion>
</AccordionGroup>

## เคล็ดลับ

- ใช้ `openclaw doctor` เพื่อตรวจสอบว่า engine ของคุณโหลดได้อย่างถูกต้อง
- หากสลับ engine session ที่มีอยู่จะดำเนินต่อไปด้วย history ปัจจุบันของตน engine ใหม่จะเข้ารับช่วงสำหรับ run ในอนาคต
- ข้อผิดพลาดของ engine จะถูก log และ plugin engine ที่เลือกจะถูก quarantine สำหรับ Gateway process ปัจจุบัน OpenClaw จะ fallback ไปยัง `legacy` สำหรับ user turns เพื่อให้ยังตอบกลับต่อได้ แต่คุณยังควรซ่อมแซม อัปเดต ปิดใช้งาน หรือ uninstall Plugin ที่เสียอยู่
- สำหรับการพัฒนา ใช้ `openclaw plugins install -l ./my-engine` เพื่อ link local plugin directory โดยไม่ต้อง copy

## ที่เกี่ยวข้อง

- [Compaction](/th/concepts/compaction) - การสรุปบทสนทนายาว
- [Context](/th/concepts/context) - วิธีสร้าง context สำหรับ agent turns
- [Plugin Architecture](/th/plugins/architecture) - การลงทะเบียน context engine plugins
- [Plugin manifest](/th/plugins/manifest) - ฟิลด์ใน plugin manifest
- [Plugins](/th/tools/plugin) - ภาพรวม Plugin
