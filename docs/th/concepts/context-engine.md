---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw ประกอบบริบทของโมเดลอย่างไร
    - คุณกำลังสลับระหว่างเอนจินแบบเดิมและเอนจิน Plugin
    - คุณกำลังสร้าง Plugin เอนจินบริบท
sidebarTitle: Context engine
summary: 'เอนจินบริบท: การประกอบบริบทแบบเสียบต่อได้, Compaction, และวงจรชีวิตของเอเจนต์ย่อย'
title: เอนจินบริบท
x-i18n:
    generated_at: "2026-06-30T14:32:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

**เอนจินบริบท** ควบคุมวิธีที่ OpenClaw สร้างบริบทโมเดลสำหรับแต่ละรัน: จะรวมข้อความใด วิธีสรุปประวัติเก่ากว่า และวิธีจัดการบริบทข้ามขอบเขต subagent

OpenClaw มาพร้อมเอนจิน `legacy` ในตัวและใช้เป็นค่าเริ่มต้น - ผู้ใช้ส่วนใหญ่ไม่จำเป็นต้องเปลี่ยนสิ่งนี้ ติดตั้งและเลือกเอนจิน Plugin เฉพาะเมื่อคุณต้องการพฤติกรรมการประกอบ, Compaction, หรือการเรียกคืนข้ามเซสชันที่แตกต่างออกไป

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ตรวจสอบว่าเอนจินใดใช้งานอยู่">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="ติดตั้งเอนจิน Plugin">
    Plugin เอนจินบริบทติดตั้งเหมือนกับ Plugin อื่นของ OpenClaw

    <Tabs>
      <Tab title="จาก npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="จากพาธในเครื่อง">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="เปิดใช้และเลือกเอนจิน">
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

    รีสตาร์ท Gateway หลังจากติดตั้งและกำหนดค่าแล้ว

  </Step>
  <Step title="สลับกลับเป็น legacy (ไม่บังคับ)">
    ตั้งค่า `contextEngine` เป็น `"legacy"` (หรือลบคีย์ออกทั้งหมด - `"legacy"` เป็นค่าเริ่มต้น)
  </Step>
</Steps>

## วิธีการทำงาน

ทุกครั้งที่ OpenClaw รันพรอมป์โมเดล เอนจินบริบทจะเข้าร่วมที่จุด lifecycle สี่จุด:

<AccordionGroup>
  <Accordion title="1. รับเข้า">
    เรียกเมื่อมีการเพิ่มข้อความใหม่เข้าในเซสชัน เอนจินสามารถจัดเก็บหรือทำดัชนีข้อความในที่เก็บข้อมูลของตนเองได้
  </Accordion>
  <Accordion title="2. ประกอบ">
    เรียกก่อนการรันโมเดลแต่ละครั้ง เอนจินส่งคืนชุดข้อความแบบเรียงลำดับ (และ `systemPromptAddition` ที่ไม่บังคับ) ที่พอดีกับงบประมาณโทเคน
  </Accordion>
  <Accordion title="3. Compact">
    เรียกเมื่อหน้าต่างบริบทเต็ม หรือเมื่อผู้ใช้รัน `/compact` เอนจินจะสรุปประวัติเก่ากว่าเพื่อเพิ่มพื้นที่ว่าง
  </Accordion>
  <Accordion title="4. หลังเทิร์น">
    เรียกหลังจากรันเสร็จ เอนจินสามารถคงสถานะไว้, ทริกเกอร์ Compaction เบื้องหลัง, หรืออัปเดตดัชนีได้
  </Accordion>
</AccordionGroup>

สำหรับฮาร์เนส Codex แบบไม่ใช่ ACP ที่รวมมา OpenClaw ใช้ lifecycle เดียวกันโดยฉายบริบทที่ประกอบแล้วเข้าไปในคำสั่งสำหรับนักพัฒนาของ Codex และพรอมป์ของเทิร์นปัจจุบัน Codex ยังคงเป็นเจ้าของประวัติเธรดแบบเนทีฟและ compactor แบบเนทีฟของตนเอง

### Lifecycle ของ subagent (ไม่บังคับ)

OpenClaw เรียก hook lifecycle ของ subagent ที่ไม่บังคับสองรายการ:

<ParamField path="prepareSubagentSpawn" type="method">
  เตรียมสถานะบริบทร่วมก่อนที่รันลูกจะเริ่ม hook ได้รับคีย์เซสชันแม่/ลูก, `contextMode` (`isolated` หรือ `fork`), id/ไฟล์ transcript ที่พร้อมใช้งาน, และ TTL ที่ไม่บังคับ หากส่งคืน handle สำหรับ rollback, OpenClaw จะเรียกใช้เมื่อการ spawn ล้มเหลวหลังจากการเตรียมสำเร็จ การ spawn subagent แบบเนทีฟที่ร้องขอ `lightContext` และ resolve เป็น `contextMode="isolated"` จะข้าม hook นี้โดยตั้งใจ เพื่อให้ลูกเริ่มจากบริบท bootstrap แบบเบาโดยไม่มีสถานะก่อน spawn ที่จัดการโดยเอนจินบริบท
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  ล้างข้อมูลเมื่อเซสชัน subagent เสร็จสิ้นหรือถูกกวาดล้าง
</ParamField>

### การเพิ่ม system prompt

เมธอด `assemble` สามารถส่งคืนสตริง `systemPromptAddition` ได้ OpenClaw จะเติมสิ่งนี้ไว้หน้าสุดของ system prompt สำหรับการรัน สิ่งนี้ทำให้เอนจินแทรกคำแนะนำการเรียกคืนแบบไดนามิก, คำสั่ง retrieval, หรือคำใบ้ที่รับรู้บริบทได้โดยไม่ต้องใช้ไฟล์ workspace แบบคงที่

## เอนจิน legacy

เอนจิน `legacy` ในตัวรักษาพฤติกรรมเดิมของ OpenClaw:

- **Ingest**: no-op (ตัวจัดการเซสชันจัดการการคงอยู่ของข้อความโดยตรง)
- **Assemble**: pass-through (pipeline sanitize → validate → limit ที่มีอยู่ใน runtime จัดการการประกอบบริบท)
- **Compact**: มอบหมายให้ Compaction การสรุปในตัว ซึ่งสร้างสรุปเดียวของข้อความเก่ากว่าและคงข้อความล่าสุดไว้เหมือนเดิม
- **After turn**: no-op

เอนจิน legacy ไม่ลงทะเบียนเครื่องมือหรือให้ `systemPromptAddition`

เมื่อไม่ได้ตั้งค่า `plugins.slots.contextEngine` (หรือตั้งเป็น `"legacy"`) เอนจินนี้จะถูกใช้โดยอัตโนมัติ

## เอนจิน Plugin

Plugin สามารถลงทะเบียนเอนจินบริบทโดยใช้ Plugin API:

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
ที่ไม่บังคับ เพื่อให้ Plugin สามารถ initialize สถานะต่อ agent หรือ ต่อ workspace ก่อนที่
hook lifecycle แรกจะรัน

จากนั้นเปิดใช้ใน config:

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

| สมาชิก            | ชนิด     | วัตถุประสงค์                                             |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | id เอนจิน, ชื่อ, เวอร์ชัน, และเป็นเจ้าของ Compaction หรือไม่ |
| `ingest(params)`   | Method   | จัดเก็บข้อความเดียว                                     |
| `assemble(params)` | Method   | สร้างบริบทสำหรับการรันโมเดล (ส่งคืน `AssembleResult`) |
| `compact(params)`  | Method   | สรุป/ลดบริบท                                            |

`assemble` ส่งคืน `AssembleResult` พร้อม:

<ParamField path="messages" type="Message[]" required>
  ข้อความแบบเรียงลำดับที่จะส่งไปยังโมเดล
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  ค่าประมาณจำนวนโทเคนทั้งหมดของเอนจินในบริบทที่ประกอบแล้ว OpenClaw ใช้สิ่งนี้สำหรับการตัดสินใจ threshold ของ Compaction และการรายงาน diagnostic
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  เติมไว้หน้าสุดของ system prompt
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  ควบคุมค่าประมาณโทเคนที่ runner ใช้สำหรับ precheck overflow
  เชิงป้องกัน ค่าเริ่มต้นคือ `"assembled"` ซึ่งหมายความว่าจะตรวจเฉพาะค่าประมาณของพรอมป์
  ที่ประกอบแล้วสำหรับเอนจินที่ไม่ได้เป็นเจ้าของ Compaction
  เอนจินที่ตั้งค่า `ownsCompaction: true` จัดการ prompt admission ของตนเอง
  ดังนั้น OpenClaw จะข้าม precheck ก่อนพรอมป์แบบ generic ตามค่าเริ่มต้น ตั้งค่า
  `"preassembly_may_overflow"` เฉพาะเมื่อมุมมองที่ประกอบแล้วของคุณสามารถซ่อนความเสี่ยง
  overflow ใน transcript เบื้องหลังได้ จากนั้น runner จะคง precheck แบบ generic
  ไว้และใช้ค่าสูงสุดระหว่างค่าประมาณที่ประกอบแล้วกับค่าประมาณประวัติเซสชัน
  ก่อนการประกอบ (ไม่ถูก window) เมื่อตัดสินใจว่าจะ compact ล่วงหน้าหรือไม่
  ไม่ว่าแบบใด ข้อความที่คุณส่งคืนยังคงเป็นสิ่งที่โมเดลเห็น - `promptAuthority` มีผลเฉพาะกับ precheck
</ParamField>

`compact` ส่งคืน `CompactResult` เมื่อ Compaction หมุน transcript ที่ใช้งานอยู่
`result.sessionId` และ `result.sessionFile` จะระบุเซสชันตัวถัดไป
ที่ retry หรือเทิร์นถัดไปต้องใช้

สมาชิกที่ไม่บังคับ:

| สมาชิก                         | ชนิด   | วัตถุประสงค์                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Initialize สถานะเอนจินสำหรับเซสชัน เรียกหนึ่งครั้งเมื่อเอนจินเห็นเซสชันครั้งแรก (เช่น import ประวัติ) |
| `ingestBatch(params)`          | Method | รับเทิร์นที่เสร็จสมบูรณ์เข้าเป็น batch เรียกหลังจากรันเสร็จ พร้อมข้อความทั้งหมดจากเทิร์นนั้นในครั้งเดียว |
| `afterTurn(params)`            | Method | งาน lifecycle หลังรัน (คงสถานะไว้, ทริกเกอร์ Compaction เบื้องหลัง) |
| `prepareSubagentSpawn(params)` | Method | ตั้งค่าสถานะร่วมสำหรับเซสชันลูกก่อนเริ่มต้น |
| `onSubagentEnded(params)`      | Method | ล้างข้อมูลหลังจาก subagent สิ้นสุด |
| `dispose()`                    | Method | ปล่อยทรัพยากร เรียกระหว่างการปิด Gateway หรือ reload Plugin - ไม่ใช่ต่อเซสชัน |

### การตั้งค่า Runtime

hook lifecycle ที่รันภายใน OpenClaw จะได้รับออบเจ็กต์
`runtimeSettings` ที่ไม่บังคับ สิ่งนี้เป็นพื้นผิว API ภายในแบบมีเวอร์ชันและอ่านอย่างเดียว
สำหรับ producer/consumer: OpenClaw ผลิตให้เอนจินบริบทที่เลือก
และเอนจินบริบทใช้ภายใน hook lifecycle สิ่งนี้ไม่ได้
render โดยตรงให้ผู้ใช้และไม่ได้สร้างพื้นผิวรายงานเฉพาะ

- `schemaVersion`: ปัจจุบันคือ `1`
- `runtime`: host ของ OpenClaw, โหมด runtime (`normal`, `fallback`, หรือ
  `degraded`), และ id ของ harness/runtime ที่ไม่บังคับ
- `contextEngineSelection`: id เอนจินบริบทที่เลือกและแหล่งที่มาของการเลือก
- `executionHost`: id และ label ของ host สำหรับพื้นผิวที่เรียก hook
- `model`: โมเดลที่ร้องขอ, โมเดลที่ resolve แล้ว, provider, และตระกูลโมเดลที่ไม่บังคับ
- `limits`: งบประมาณโทเคนพรอมป์และโทเคนเอาต์พุตสูงสุดเมื่อทราบ
- `diagnostics`: โค้ดเหตุผล fallback แบบปิดและ degraded เมื่อทราบ

ฟิลด์ที่อาจไม่ทราบจะแสดงเป็น `null`; ฟิลด์ discriminator เช่น
โหมด runtime และแหล่งที่มาของการเลือกยังคงไม่เป็น nullable เอนจินเก่ายังคง
เข้ากันได้: หากเอนจิน legacy แบบเข้มงวดปฏิเสธ `runtimeSettings` ว่าเป็น
property ที่ไม่รู้จัก OpenClaw จะลองเรียก lifecycle อีกครั้งโดยไม่มีสิ่งนี้แทนที่จะ quarantine
เอนจิน

### ข้อกำหนดของ Host

เอนจินบริบทสามารถประกาศข้อกำหนด capability ของ host ได้ที่ `info.hostRequirements`
OpenClaw ตรวจสอบข้อกำหนดเหล่านี้ก่อนเริ่ม operation และ fail closed
พร้อมข้อผิดพลาดที่อธิบายได้เมื่อ runtime ที่เลือกไม่สามารถตอบสนองได้

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

การรัน agent แบบ Native Codex และ OpenClaw embedded รองรับ `assemble-before-prompt`
backend CLI แบบ generic ไม่รองรับ ดังนั้นเอนจินที่ต้องใช้ capability นี้จะถูกปฏิเสธก่อน
กระบวนการ CLI เริ่มต้น

### การแยกความล้มเหลว

OpenClaw แยกเอนจิน Plugin ที่เลือกไว้ออกจากเส้นทางการตอบกลับหลัก หากเอนจินที่ไม่ใช่ legacy
หายไป, ไม่ผ่านการตรวจสอบสัญญา, throw ระหว่างการสร้าง factory
หรือ throw จากเมธอด lifecycle, OpenClaw จะกักกันเอนจินนั้น
สำหรับกระบวนการ Gateway ปัจจุบัน และลดระดับงาน context-engine ไปใช้
เอนจิน `legacy` ในตัว ระบบจะบันทึกข้อผิดพลาดพร้อมกับการดำเนินการที่ล้มเหลว เพื่อให้
ผู้ปฏิบัติงานสามารถซ่อมแซม อัปเดต หรือปิดใช้งาน Plugin ได้โดยที่ agent ไม่
เงียบหายไป

ความล้มเหลวด้านข้อกำหนดของโฮสต์นั้นต่างออกไป: เมื่อเอนจินประกาศว่า runtime
ขาด capability ที่จำเป็น OpenClaw จะ fail closed ก่อนเริ่ม run การทำเช่นนี้
ปกป้องเอนจินที่อาจทำให้ state เสียหายหากรันในโฮสต์ที่ไม่รองรับ

### ownsCompaction

`ownsCompaction` ควบคุมว่า auto-compaction ภายใน attempt ที่มีใน runtime ของ OpenClaw จะยังเปิดใช้งานสำหรับ run นั้นหรือไม่:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    เอนจินเป็นเจ้าของพฤติกรรม compaction OpenClaw จะปิด auto-compaction ในตัวของ runtime OpenClaw และการตรวจสอบล้นก่อน pre-prompt แบบทั่วไปสำหรับ run นั้น และ implementation `compact()` ของเอนจินจะรับผิดชอบ `/compact`, compaction สำหรับการกู้คืนเมื่อ provider overflow และ proactive compaction ใดๆ ที่ต้องการทำใน `afterTurn()` OpenClaw ยังจะรัน pre-prompt overflow safeguard เมื่อเอนจินคืนค่า `promptAuthority: "preassembly_may_overflow"` จาก `assemble()`
  </Accordion>
  <Accordion title="ownsCompaction: false หรือไม่ได้ตั้งค่า">
    auto-compaction ในตัวของ runtime OpenClaw อาจยังรันระหว่างการประมวลผล prompt แต่เมธอด `compact()` ของเอนจินที่ใช้งานอยู่ยังคงถูกเรียกสำหรับ `/compact` และการกู้คืนจาก overflow
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **ไม่ได้** หมายความว่า OpenClaw จะ fallback ไปใช้เส้นทาง compaction ของเอนจิน legacy โดยอัตโนมัติ
</Warning>

นั่นหมายความว่ามีรูปแบบ Plugin ที่ถูกต้องสองแบบ:

<Tabs>
  <Tab title="โหมดเป็นเจ้าของ">
    Implement อัลกอริทึม compaction ของคุณเองและตั้งค่า `ownsCompaction: true`
  </Tab>
  <Tab title="โหมดมอบหมาย">
    ตั้งค่า `ownsCompaction: false` และให้ `compact()` เรียก `delegateCompactionToRuntime(...)` จาก `openclaw/plugin-sdk/core` เพื่อใช้พฤติกรรม compaction ในตัวของ OpenClaw
  </Tab>
</Tabs>

`compact()` แบบ no-op ไม่ปลอดภัยสำหรับเอนจินที่กำลังใช้งานและไม่ได้เป็นเจ้าของ เพราะมันจะปิดเส้นทาง compaction ปกติของ `/compact` และ overflow-recovery สำหรับช่องเอนจินนั้น

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
slot เป็นแบบเอกสิทธิ์เฉพาะขณะ run - สำหรับ run หรือการดำเนินการ compaction หนึ่งๆ จะ resolve context engine ที่ลงทะเบียนไว้เพียงตัวเดียวเท่านั้น Plugin อื่นที่เปิดใช้งานและเป็น `kind: "context-engine"` ยังสามารถโหลดและรันโค้ด registration ของตัวเองได้; `plugins.slots.contextEngine` เพียงเลือก id ของเอนจินที่ลงทะเบียนไว้ซึ่ง OpenClaw จะ resolve เมื่อจำเป็นต้องใช้ context engine
</Note>

<Note>
**การถอนการติดตั้ง Plugin:** เมื่อคุณถอนการติดตั้ง Plugin ที่กำลังถูกเลือกเป็น `plugins.slots.contextEngine` อยู่ OpenClaw จะรีเซ็ต slot กลับไปเป็นค่าเริ่มต้น (`legacy`) พฤติกรรมรีเซ็ตเดียวกันนี้ใช้กับ `plugins.slots.memory` ด้วย ไม่จำเป็นต้องแก้ไข config ด้วยตนเอง
</Note>

## ความสัมพันธ์กับ compaction และ memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction เป็นหนึ่งในความรับผิดชอบของ context engine เอนจิน legacy มอบหมายไปยังการสรุปความในตัวของ OpenClaw เอนจิน Plugin สามารถ implement กลยุทธ์ compaction แบบใดก็ได้ (สรุปแบบ DAG, vector retrieval ฯลฯ)
  </Accordion>
  <Accordion title="Plugin memory">
    Plugin memory (`plugins.slots.memory`) แยกจาก context engine Plugin memory ให้ความสามารถด้านการค้นหา/retrieval; context engine ควบคุมสิ่งที่โมเดลเห็น ทั้งสองอย่างสามารถทำงานร่วมกันได้ - context engine อาจใช้ข้อมูลจาก Plugin memory ระหว่าง assembly เอนจิน Plugin ที่ต้องการใช้เส้นทาง active memory prompt ควรเลือกใช้ `buildMemorySystemPromptAddition(...)` จาก `openclaw/plugin-sdk/core` ซึ่งแปลงส่วน active memory prompt ให้เป็น `systemPromptAddition` ที่พร้อม prepend หากเอนจินต้องการการควบคุมระดับต่ำกว่า ก็ยังสามารถดึงบรรทัดดิบจาก `openclaw/plugin-sdk/memory-host-core` ผ่าน `buildActiveMemoryPromptSection(...)` ได้
  </Accordion>
  <Accordion title="การ prune session">
    การตัดผลลัพธ์ tool เก่าใน memory ยังคงทำงานไม่ว่า context engine ใดจะ active อยู่
  </Accordion>
</AccordionGroup>

## เคล็ดลับ

- ใช้ `openclaw doctor` เพื่อตรวจสอบว่าเอนจินของคุณโหลดอย่างถูกต้อง
- หากสลับเอนจิน session ที่มีอยู่จะดำเนินต่อไปพร้อม history ปัจจุบัน เอนจินใหม่จะรับช่วงสำหรับ run ในอนาคต
- ข้อผิดพลาดของเอนจินจะถูกบันทึก และเอนจิน Plugin ที่เลือกไว้จะถูกกักกันสำหรับกระบวนการ Gateway ปัจจุบัน OpenClaw จะ fallback ไปที่ `legacy` สำหรับ turn ของผู้ใช้เพื่อให้การตอบกลับดำเนินต่อไปได้ แต่คุณยังควรซ่อมแซม อัปเดต ปิดใช้งาน หรือถอนการติดตั้ง Plugin ที่เสีย
- สำหรับการพัฒนา ใช้ `openclaw plugins install -l ./my-engine` เพื่อ link ไดเรกทอรี Plugin ภายในเครื่องโดยไม่ต้องคัดลอก

## ที่เกี่ยวข้อง

- [Compaction](/th/concepts/compaction) - การสรุปบทสนทนายาวๆ
- [Context](/th/concepts/context) - วิธีสร้าง context สำหรับ turn ของ agent
- [สถาปัตยกรรม Plugin](/th/plugins/architecture) - การลงทะเบียน Plugin context engine
- [manifest ของ Plugin](/th/plugins/manifest) - ฟิลด์ manifest ของ Plugin
- [Plugins](/th/tools/plugin) - ภาพรวม Plugin
