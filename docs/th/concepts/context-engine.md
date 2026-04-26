---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw ประกอบบริบทของโมเดลอย่างไร
    - คุณกำลังสลับระหว่างเอนจินแบบเดิมกับเอนจิน Plugin
    - คุณกำลังสร้าง Plugin เอนจินบริบท
sidebarTitle: Context engine
summary: 'เอนจินบริบท: การประกอบบริบทแบบเสียบปลั๊กได้, Compaction และวงจรชีวิตของ subagent'
title: เอนจินบริบท
x-i18n:
    generated_at: "2026-04-26T11:27:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

**เอนจินบริบท** ควบคุมวิธีที่ OpenClaw สร้างบริบทของโมเดลสำหรับแต่ละการรัน: จะรวมข้อความใดบ้าง จะสรุปประวัติเก่าอย่างไร และจะจัดการบริบทข้ามขอบเขตของ subagent อย่างไร

OpenClaw มาพร้อมเอนจิน `legacy` ที่มีมาในระบบและใช้เป็นค่าเริ่มต้น — ผู้ใช้ส่วนใหญ่ไม่จำเป็นต้องเปลี่ยนสิ่งนี้ ติดตั้งและเลือกเอนจิน Plugin เฉพาะเมื่อคุณต้องการพฤติกรรมการประกอบ, Compaction หรือการเรียกคืนข้ามเซสชันที่แตกต่างออกไป

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ตรวจสอบว่าเอนจินใดกำลังทำงานอยู่">
    ```bash
    openclaw doctor
    # หรือตรวจสอบ config โดยตรง:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="ติดตั้งเอนจิน Plugin">
    Plugin เอนจินบริบทติดตั้งได้เหมือน Plugin อื่น ๆ ของ OpenClaw

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
          contextEngine: "lossless-claw", // ต้องตรงกับ id เอนจินที่ Plugin ลงทะเบียนไว้
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // config เฉพาะของ Plugin ใส่ไว้ที่นี่ (ดูเอกสารของ Plugin)
          },
        },
      },
    }
    ```

    รีสตาร์ต gateway หลังจากติดตั้งและกำหนดค่าแล้ว

  </Step>
  <Step title="สลับกลับไปใช้ legacy (ไม่บังคับ)">
    ตั้งค่า `contextEngine` เป็น `"legacy"` (หรือลบคีย์นี้ออกทั้งหมด — `"legacy"` เป็นค่าเริ่มต้น)
  </Step>
</Steps>

## วิธีการทำงาน

ทุกครั้งที่ OpenClaw รัน prompt ของโมเดล เอนจินบริบทจะเข้าร่วมใน 4 จุดของวงจรชีวิต:

<AccordionGroup>
  <Accordion title="1. Ingest">
    ถูกเรียกเมื่อมีการเพิ่มข้อความใหม่เข้าในเซสชัน เอนจินสามารถจัดเก็บหรือทำดัชนีข้อความนั้นใน data store ของตัวเองได้
  </Accordion>
  <Accordion title="2. Assemble">
    ถูกเรียกก่อนการรันโมเดลแต่ละครั้ง เอนจินจะส่งคืนชุดข้อความแบบมีลำดับ (และ `systemPromptAddition` แบบไม่บังคับ) ที่พอดีกับงบประมาณโทเค็น
  </Accordion>
  <Accordion title="3. Compact">
    ถูกเรียกเมื่อ context window เต็ม หรือเมื่อผู้ใช้รัน `/compact` เอนจินจะสรุปประวัติเก่าเพื่อคืนพื้นที่
  </Accordion>
  <Accordion title="4. After turn">
    ถูกเรียกหลังจากการรันเสร็จสิ้น เอนจินสามารถคงสถานะไว้, ทริกเกอร์ Compaction แบบเบื้องหลัง หรืออัปเดตดัชนีได้
  </Accordion>
</AccordionGroup>

สำหรับ Codex harness แบบ non-ACP ที่รวมมาในระบบ OpenClaw จะใช้วงจรชีวิตเดียวกันโดยฉายบริบทที่ประกอบแล้วไปยังคำสั่งนักพัฒนา Codex และ prompt ของเทิร์นปัจจุบัน Codex ยังคงเป็นเจ้าของประวัติเธรดแบบเนทีฟและ compactor แบบเนทีฟของตัวเอง

### วงจรชีวิตของ subagent (ไม่บังคับ)

OpenClaw เรียก hook วงจรชีวิตของ subagent แบบไม่บังคับสองตัว:

<ParamField path="prepareSubagentSpawn" type="method">
  เตรียมสถานะบริบทร่วมก่อนที่การรันของ child จะเริ่มขึ้น hook นี้รับ parent/child session key, `contextMode` (`isolated` หรือ `fork`), transcript id/files ที่พร้อมใช้ และ TTL แบบไม่บังคับ หากมันคืน rollback handle กลับมา OpenClaw จะเรียกมันเมื่อการ spawn ล้มเหลวหลังจากการเตรียมสำเร็จแล้ว
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  ทำความสะอาดเมื่อเซสชัน subagent เสร็จสิ้นหรือถูก sweep
</ParamField>

### การเพิ่ม system prompt

เมธอด `assemble` สามารถคืนสตริง `systemPromptAddition` ได้ OpenClaw จะเติมสิ่งนี้ไว้ข้างหน้าของ system prompt สำหรับการรันนั้น วิธีนี้ช่วยให้เอนจินแทรกคำแนะนำการเรียกคืนแบบไดนามิก, คำสั่ง retrieval หรือคำใบ้ที่รับรู้บริบทได้ โดยไม่ต้องพึ่งไฟล์ workspace แบบคงที่

## เอนจิน legacy

เอนจิน `legacy` ที่มีมาในระบบจะคงพฤติกรรมดั้งเดิมของ OpenClaw ไว้:

- **Ingest**: ไม่ทำอะไร (session manager จัดการการคงข้อความไว้โดยตรงอยู่แล้ว)
- **Assemble**: ส่งผ่านตรง (pipeline sanitize → validate → limit ที่มีอยู่ใน runtime จะจัดการการประกอบบริบท)
- **Compact**: มอบหมายให้ Compaction แบบสรุปผลที่มีมาในระบบ ซึ่งจะสร้างสรุปเดียวของข้อความเก่าและคงข้อความล่าสุดไว้
- **After turn**: ไม่ทำอะไร

เอนจิน legacy จะไม่ลงทะเบียนเครื่องมือและไม่ให้ `systemPromptAddition`

เมื่อไม่มีการตั้งค่า `plugins.slots.contextEngine` (หรือตั้งเป็น `"legacy"`) ระบบจะใช้เอนจินนี้โดยอัตโนมัติ

## เอนจิน Plugin

Plugin สามารถลงทะเบียนเอนจินบริบทโดยใช้ Plugin API:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
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

| สมาชิก             | ชนิด     | วัตถุประสงค์                                                  |
| ------------------ | -------- | -------------------------------------------------------------- |
| `info`             | Property | id ชื่อ เวอร์ชันของเอนจิน และระบุว่าเป็นเจ้าของ Compaction หรือไม่ |
| `ingest(params)`   | Method   | จัดเก็บข้อความเดี่ยวหนึ่งรายการ                               |
| `assemble(params)` | Method   | สร้างบริบทสำหรับการรันโมเดล (คืนค่า `AssembleResult`)         |
| `compact(params)`  | Method   | สรุป/ลดบริบท                                                  |

`assemble` จะคืน `AssembleResult` ที่มี:

<ParamField path="messages" type="Message[]" required>
  ข้อความแบบมีลำดับที่จะส่งให้โมเดล
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  ค่าประมาณจำนวนโทเค็นทั้งหมดของเอนจินในบริบทที่ประกอบแล้ว OpenClaw ใช้ค่านี้ในการตัดสิน threshold ของ Compaction และการรายงานเชิงวินิจฉัย
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  เติมไว้ข้างหน้าของ system prompt
</ParamField>

สมาชิกที่ไม่บังคับ:

| สมาชิก                         | ชนิด   | วัตถุประสงค์                                                                                                     |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | เริ่มต้นสถานะของเอนจินสำหรับเซสชัน ถูกเรียกหนึ่งครั้งเมื่อเอนจินพบเซสชันเป็นครั้งแรก (เช่น นำเข้าประวัติ) |
| `ingestBatch(params)`          | Method | รับข้อความของเทิร์นที่เสร็จสมบูรณ์เป็นชุด ถูกเรียกหลังการรันเสร็จ โดยรับข้อความทั้งหมดจากเทิร์นนั้นพร้อมกัน |
| `afterTurn(params)`            | Method | งานวงจรชีวิตหลังการรัน (คงสถานะไว้, ทริกเกอร์ Compaction แบบเบื้องหลัง)                                       |
| `prepareSubagentSpawn(params)` | Method | ตั้งค่าสถานะร่วมสำหรับเซสชัน child ก่อนเริ่มทำงาน                                                               |
| `onSubagentEnded(params)`      | Method | ทำความสะอาดหลัง subagent จบการทำงาน                                                                              |
| `dispose()`                    | Method | ปล่อยทรัพยากร ถูกเรียกระหว่างการปิด gateway หรือรีโหลด Plugin — ไม่ได้เรียกรายเซสชัน                         |

### ownsCompaction

`ownsCompaction` ควบคุมว่าระบบ auto-compaction ในตัวของ Pi ระหว่างความพยายามรันจะยังเปิดใช้งานอยู่หรือไม่สำหรับการรันนั้น:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    เอนจินเป็นเจ้าของพฤติกรรม Compaction OpenClaw จะปิด auto-compaction ในตัวของ Pi สำหรับการรันนั้น และการติดตั้ง `compact()` ของเอนจินจะรับผิดชอบต่อ `/compact`, overflow recovery compaction และ Compaction เชิงรุกใด ๆ ที่มันต้องการทำใน `afterTurn()` OpenClaw อาจยังคงรันกลไกป้องกัน overflow ก่อน prompt; เมื่อระบบคาดการณ์ว่า transcript เต็มจะล้น recovery path จะเรียก `compact()` ของเอนจินที่กำลังทำงานอยู่ก่อนส่ง prompt อีกครั้ง
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    auto-compaction ในตัวของ Pi อาจยังคงทำงานระหว่างการรัน prompt แต่เมธอด `compact()` ของเอนจินที่กำลังทำงานอยู่ก็ยังจะถูกเรียกสำหรับ `/compact` และ overflow recovery
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **ไม่ได้** หมายความว่า OpenClaw จะ fallback ไปใช้เส้นทาง Compaction ของเอนจิน legacy โดยอัตโนมัติ
</Warning>

นั่นหมายความว่ามีรูปแบบ Plugin ที่ถูกต้องอยู่สองแบบ:

<Tabs>
  <Tab title="โหมดเป็นเจ้าของ">
    ติดตั้งอัลกอริทึม Compaction ของคุณเองและตั้ง `ownsCompaction: true`
  </Tab>
  <Tab title="โหมดมอบหมาย">
    ตั้ง `ownsCompaction: false` และให้ `compact()` เรียก `delegateCompactionToRuntime(...)` จาก `openclaw/plugin-sdk/core` เพื่อใช้พฤติกรรม Compaction ที่มีมาในระบบของ OpenClaw
  </Tab>
</Tabs>

`compact()` แบบไม่ทำอะไรนั้นไม่ปลอดภัยสำหรับเอนจินที่กำลังทำงานอยู่และไม่เป็นเจ้าของ เพราะมันจะปิดเส้นทาง `/compact` และ overflow-recovery compaction ตามปกติสำหรับสล็อตเอนจินนั้น

## เอกสารอ้างอิงการกำหนดค่า

```json5
{
  plugins: {
    slots: {
      // เลือกเอนจินบริบทที่กำลังทำงานอยู่ ค่าเริ่มต้น: "legacy"
      // ตั้งเป็น id ของ Plugin เพื่อใช้เอนจิน Plugin
      contextEngine: "legacy",
    },
  },
}
```

<Note>
สล็อตนี้เป็นแบบ exclusive ในขณะรัน — จะมีเพียงเอนจินบริบทที่ลงทะเบียนไว้หนึ่งตัวเท่านั้นที่ถูก resolve สำหรับการรันหรือการทำ Compaction ที่กำหนด Plugin `kind: "context-engine"` ตัวอื่นที่เปิดใช้งานอยู่ยังสามารถโหลดและรันโค้ดการลงทะเบียนของตัวเองได้; `plugins.slots.contextEngine` มีหน้าที่เพียงเลือกว่าขณะ OpenClaw ต้องการเอนจินบริบท จะ resolve ไปยัง id เอนจินที่ลงทะเบียนตัวใด
</Note>

<Note>
**การถอนการติดตั้ง Plugin:** เมื่อคุณถอนการติดตั้ง Plugin ที่ถูกเลือกอยู่ใน `plugins.slots.contextEngine`, OpenClaw จะรีเซ็ตสล็อตกลับไปเป็นค่าเริ่มต้น (`legacy`) พฤติกรรมการรีเซ็ตแบบเดียวกันนี้ใช้กับ `plugins.slots.memory` ด้วย ไม่จำเป็นต้องแก้ config เอง
</Note>

## ความสัมพันธ์กับ Compaction และ Memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction เป็นหนึ่งในความรับผิดชอบของเอนจินบริบท เอนจิน legacy จะมอบหมายให้กับการสรุปผลที่มีมาในระบบของ OpenClaw ส่วนเอนจิน Plugin สามารถติดตั้งกลยุทธ์ Compaction แบบใดก็ได้ (เช่น DAG summaries, vector retrieval เป็นต้น)
  </Accordion>
  <Accordion title="Memory Plugins">
    Memory Plugins (`plugins.slots.memory`) แยกจากเอนจินบริบท Memory Plugins ให้ความสามารถด้าน search/retrieval; เอนจินบริบทควบคุมสิ่งที่โมเดลมองเห็น ทั้งสองอย่างสามารถทำงานร่วมกันได้ — เอนจินบริบทอาจใช้ข้อมูลจาก memory plugin ระหว่างการประกอบบริบท เอนจิน Plugin ที่ต้องการใช้เส้นทาง prompt ของ Active Memory ควรใช้ `buildMemorySystemPromptAddition(...)` จาก `openclaw/plugin-sdk/core` ซึ่งจะแปลงส่วน prompt ของ Active Memory ที่กำลังใช้งานให้เป็น `systemPromptAddition` ที่พร้อมเติมไว้ข้างหน้า หากเอนจินต้องการควบคุมในระดับลึกกว่านั้น ก็ยังสามารถดึงบรรทัดดิบจาก `openclaw/plugin-sdk/memory-host-core` ผ่าน `buildActiveMemoryPromptSection(...)` ได้
  </Accordion>
  <Accordion title="การตัดแต่งเซสชัน">
    การตัดผลลัพธ์เครื่องมือเก่าออกจากหน่วยความจำยังคงทำงานไม่ว่าเอนจินบริบทใดจะกำลังทำงานอยู่
  </Accordion>
</AccordionGroup>

## เคล็ดลับ

- ใช้ `openclaw doctor` เพื่อตรวจสอบว่าเอนจินของคุณโหลดได้ถูกต้อง
- หากกำลังสลับเอนจิน เซสชันที่มีอยู่จะยังคงใช้ประวัติเดิมต่อไป เอนจินใหม่จะเข้ามารับช่วงสำหรับการรันในอนาคต
- ข้อผิดพลาดของเอนจินจะถูกบันทึกลงล็อกและแสดงในข้อมูลวินิจฉัย หากเอนจิน Plugin ลงทะเบียนไม่สำเร็จ หรือไม่สามารถ resolve id ของเอนจินที่เลือกไว้ได้ OpenClaw จะไม่ fallback ให้อัตโนมัติ; การรันจะล้มเหลวจนกว่าคุณจะแก้ไข Plugin หรือสลับ `plugins.slots.contextEngine` กลับเป็น `"legacy"`
- สำหรับการพัฒนา ให้ใช้ `openclaw plugins install -l ./my-engine` เพื่อเชื่อมลิงก์ไดเรกทอรี Plugin ในเครื่องโดยไม่ต้องคัดลอก

## ที่เกี่ยวข้อง

- [Compaction](/th/concepts/compaction) — การสรุปบทสนทนายาว
- [บริบท](/th/concepts/context) — วิธีสร้างบริบทสำหรับแต่ละเทิร์นของเอเจนต์
- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — การลงทะเบียน Plugin เอนจินบริบท
- [manifest ของ Plugin](/th/plugins/manifest) — ฟิลด์ของ manifest Plugin
- [Plugins](/th/tools/plugin) — ภาพรวมของ Plugin
