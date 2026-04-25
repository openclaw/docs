---
read_when:
    - คุณต้องการเข้าใจว่า OpenClaw ประกอบบริบทของโมเดลอย่างไร
    - คุณกำลังสลับระหว่างเอนจินแบบเดิมกับเอนจิน Plugin
    - คุณกำลังสร้าง Plugin เอนจินบริบท
summary: 'เอนจินบริบท: การประกอบบริบทแบบเสียบปลั๊กได้, Compaction และวงจรชีวิตของ subagent'
title: เอนจินบริบท
x-i18n:
    generated_at: "2026-04-25T13:45:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1dc4a6f0a9fb669893a6a877924562d05168fde79b3c41df335d697e651d534d
    source_path: concepts/context-engine.md
    workflow: 15
---

**เอนจินบริบท** ควบคุมวิธีที่ OpenClaw สร้างบริบทของโมเดลสำหรับแต่ละการรัน:
จะรวมข้อความใดบ้าง จะสรุปประวัติเก่าอย่างไร และจะจัดการบริบทข้ามขอบเขตของ subagent อย่างไร

OpenClaw มาพร้อมกับเอนจิน `legacy` ในตัวและใช้เป็นค่าเริ่มต้น — ผู้ใช้ส่วนใหญ่ไม่จำเป็นต้องเปลี่ยนสิ่งนี้ ติดตั้งและเลือกเอนจิน Plugin เฉพาะเมื่อคุณต้องการพฤติกรรมการประกอบบริบท, Compaction หรือการเรียกคืนข้อมูลข้ามเซสชันที่แตกต่างออกไป

## เริ่มต้นอย่างรวดเร็ว

ตรวจสอบว่าเอนจินใดกำลังทำงานอยู่:

```bash
openclaw doctor
# หรือดูคอนฟิกโดยตรง:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### การติดตั้ง Plugin เอนจินบริบท

Plugin เอนจินบริบทติดตั้งได้เหมือน Plugin อื่น ๆ ของ OpenClaw ให้ติดตั้งก่อน แล้วจึงเลือกเอนจินใน slot:

```bash
# ติดตั้งจาก npm
openclaw plugins install @martian-engineering/lossless-claw

# หรือติดตั้งจากพาธในเครื่อง (สำหรับการพัฒนา)
openclaw plugins install -l ./my-context-engine
```

จากนั้นเปิดใช้ Plugin และเลือกให้เป็นเอนจินที่ใช้งานอยู่ในคอนฟิกของคุณ:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // ต้องตรงกับ engine id ที่ Plugin ลงทะเบียนไว้
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // คอนฟิกเฉพาะของ Plugin ใส่ไว้ที่นี่ (ดูจากเอกสารของ Plugin)
      },
    },
  },
}
```

รีสตาร์ต gateway หลังจากติดตั้งและกำหนดค่าแล้ว

หากต้องการสลับกลับไปยังเอนจินในตัว ให้ตั้ง `contextEngine` เป็น `"legacy"` (หรือลบคีย์นี้ออกทั้งหมดก็ได้ — `"legacy"` คือค่าเริ่มต้น)

## วิธีการทำงาน

ทุกครั้งที่ OpenClaw รันพรอมป์ของโมเดล เอนจินบริบทจะเข้าร่วมใน 4 จุดของวงจรชีวิต:

1. **Ingest** — เรียกเมื่อมีการเพิ่มข้อความใหม่เข้าสู่เซสชัน เอนจินสามารถจัดเก็บหรือทำดัชนีข้อความนั้นใน data store ของตัวเองได้
2. **Assemble** — เรียกก่อนการรันโมเดลแต่ละครั้ง เอนจินจะส่งคืนชุดข้อความที่เรียงลำดับแล้ว (และ `systemPromptAddition` แบบไม่บังคับ) ที่อยู่ภายในงบประมาณโทเค็น
3. **Compact** — เรียกเมื่อหน้าต่างบริบทเต็ม หรือเมื่อผู้ใช้รัน `/compact` เอนจินจะสรุปประวัติเก่าเพื่อคืนพื้นที่
4. **After turn** — เรียกหลังจากการรันเสร็จสิ้น เอนจินสามารถเก็บสถานะถาวร เรียก Compaction แบบเบื้องหลัง หรืออัปเดตดัชนีได้

สำหรับ Codex harness แบบ non-ACP ที่รวมมาในแพ็กเกจ OpenClaw จะใช้วงจรชีวิตเดียวกันนี้โดยฉายบริบทที่ประกอบแล้วไปยังคำสั่งนักพัฒนาของ Codex และพรอมป์ของเทิร์นปัจจุบัน Codex ยังคงเป็นผู้จัดการประวัติเธรดแบบเนทีฟและตัว Compact แบบเนทีฟของตัวเอง

### วงจรชีวิตของ subagent (ไม่บังคับ)

OpenClaw จะเรียก hook วงจรชีวิตของ subagent แบบไม่บังคับ 2 ตัว:

- **prepareSubagentSpawn** — เตรียมสถานะบริบทที่ใช้ร่วมกันก่อนที่การรันลูกจะเริ่มต้น hook นี้จะได้รับคีย์เซสชันของ parent/child, `contextMode`
  (`isolated` หรือ `fork`), transcript ids/files ที่ใช้ได้ และ TTL แบบไม่บังคับ
  หากส่งคืน rollback handle, OpenClaw จะเรียกมันเมื่อการ spawn ล้มเหลวหลังจากการเตรียมสำเร็จแล้ว
- **onSubagentEnded** — ทำความสะอาดเมื่อเซสชันของ subagent เสร็จสิ้นหรือถูกกวาดล้าง

### การเพิ่ม system prompt

เมธอด `assemble` สามารถส่งคืนสตริง `systemPromptAddition` ได้ OpenClaw
จะเติมค่านี้ไว้ด้านหน้าของ system prompt สำหรับการรัน วิธีนี้ช่วยให้เอนจินแทรกแนวทางการเรียกคืนแบบไดนามิก คำสั่งการดึงข้อมูล หรือคำแนะนำที่อิงตามบริบทได้ โดยไม่ต้องพึ่งไฟล์ workspace แบบคงที่

## เอนจิน legacy

เอนจิน `legacy` ในตัวจะคงพฤติกรรมดั้งเดิมของ OpenClaw ไว้:

- **Ingest**: no-op (session manager จัดการการเก็บข้อความถาวรโดยตรง)
- **Assemble**: pass-through (pipeline sanitize → validate → limit ที่มีอยู่ใน runtime เป็นผู้จัดการการประกอบบริบท)
- **Compact**: ส่งต่อไปยัง Compaction แบบสรุปในตัว ซึ่งจะสร้างสรุปเดียวของข้อความเก่าและเก็บข้อความล่าสุดไว้
- **After turn**: no-op

เอนจิน legacy จะไม่ลงทะเบียนเครื่องมือหรือให้ `systemPromptAddition`

เมื่อไม่ได้ตั้งค่า `plugins.slots.contextEngine` (หรือตั้งเป็น `"legacy"`) ระบบจะใช้เอนจินนี้โดยอัตโนมัติ

## เอนจิน Plugin

Plugin สามารถลงทะเบียนเอนจินบริบทได้ผ่าน Plugin API:

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
      // จัดเก็บข้อความไว้ใน data store ของคุณ
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // ส่งคืนข้อความที่อยู่ภายในงบประมาณ
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
      // สรุปบริบทที่เก่ากว่า
      return { ok: true, compacted: true };
    },
  }));
}
```

จากนั้นเปิดใช้ในคอนฟิก:

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

| สมาชิก             | ชนิดพร็อพเพอร์ตี/เมธอด | วัตถุประสงค์                                             |
| ------------------ | ---------------------- | -------------------------------------------------------- |
| `info`             | พร็อพเพอร์ตี            | engine id, ชื่อ, เวอร์ชัน และระบุว่าเป็นเจ้าของ Compaction หรือไม่ |
| `ingest(params)`   | เมธอด                  | จัดเก็บข้อความเดี่ยวหนึ่งรายการ                         |
| `assemble(params)` | เมธอด                  | สร้างบริบทสำหรับการรันโมเดล (ส่งคืน `AssembleResult`)    |
| `compact(params)`  | เมธอด                  | สรุป/ลดบริบท                                             |

`assemble` จะส่งคืน `AssembleResult` ซึ่งมี:

- `messages` — ข้อความที่เรียงลำดับแล้วซึ่งจะส่งไปยังโมเดล
- `estimatedTokens` (จำเป็น, `number`) — ค่าประมาณจำนวนโทเค็นรวมในบริบทที่ประกอบแล้วโดยเอนจิน OpenClaw ใช้ค่านี้เพื่อตัดสิน threshold ของ Compaction และใช้ในการรายงานการวินิจฉัย
- `systemPromptAddition` (ไม่บังคับ, `string`) — เติมไว้ด้านหน้าของ system prompt

สมาชิกแบบไม่บังคับ:

| สมาชิก                         | ชนิด   | วัตถุประสงค์                                                                                     |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------ |
| `bootstrap(params)`            | เมธอด | เริ่มต้นสถานะของเอนจินสำหรับเซสชัน เรียกหนึ่งครั้งเมื่อเอนจินเห็นเซสชันนี้ครั้งแรก (เช่น นำเข้าประวัติ) |
| `ingestBatch(params)`          | เมธอด | นำเข้าเทิร์นที่เสร็จสมบูรณ์เป็นชุด เรียกหลังการรันเสร็จ พร้อมข้อความทั้งหมดจากเทิร์นนั้นในครั้งเดียว |
| `afterTurn(params)`            | เมธอด | งานวงจรชีวิตหลังการรัน (เก็บสถานะถาวร, เรียก Compaction แบบเบื้องหลัง)                         |
| `prepareSubagentSpawn(params)` | เมธอด | ตั้งค่าสถานะที่ใช้ร่วมกันสำหรับเซสชันลูกก่อนเริ่มต้น                                             |
| `onSubagentEnded(params)`      | เมธอด | ทำความสะอาดหลังจาก subagent สิ้นสุด                                                               |
| `dispose()`                    | เมธอด | ปล่อยทรัพยากร เรียกตอน gateway ปิดตัวหรือ Plugin reload — ไม่ได้เรียกแยกต่อเซสชัน               |

### ownsCompaction

`ownsCompaction` ควบคุมว่าจะคงการทำ auto-compaction ภายในความพยายามของ Pi ไว้ระหว่างการรันหรือไม่:

- `true` — เอนจินเป็นเจ้าของพฤติกรรม Compaction OpenClaw จะปิด auto-compaction ในตัวของ Pi สำหรับการรันนั้น และการทำงานของ `compact()` ของเอนจินจะต้องรับผิดชอบ `/compact`, Compaction เพื่อกู้คืนเมื่อ overflow และ Compaction เชิงรุกใด ๆ ที่เอนจินต้องการทำใน `afterTurn()` OpenClaw อาจยังคงเรียกตัวป้องกัน overflow ก่อนพรอมป์อยู่; เมื่อระบบคาดการณ์ว่า transcript เต็มจะ overflow เส้นทางกู้คืนจะเรียก `compact()` ของเอนจินที่กำลังทำงานก่อนส่งพรอมป์อีกครั้ง
- `false` หรือไม่ได้ตั้งค่า — auto-compaction ในตัวของ Pi อาจยังทำงานระหว่างการดำเนินการพรอมป์ แต่เมธอด `compact()` ของเอนจินที่กำลังทำงานจะยังคงถูกเรียกสำหรับ `/compact` และการกู้คืนเมื่อ overflow

`ownsCompaction: false` **ไม่ได้** หมายความว่า OpenClaw จะ fallback ไปใช้เส้นทาง Compaction ของเอนจิน legacy โดยอัตโนมัติ

นั่นหมายความว่ามีรูปแบบ Plugin ที่ถูกต้องอยู่ 2 แบบ:

- **โหมดเป็นเจ้าของ** — ติดตั้งอัลกอริทึม Compaction ของคุณเองและตั้งค่า
  `ownsCompaction: true`
- **โหมดส่งต่อ** — ตั้งค่า `ownsCompaction: false` และให้ `compact()` เรียก
  `delegateCompactionToRuntime(...)` จาก `openclaw/plugin-sdk/core` เพื่อใช้พฤติกรรม Compaction ในตัวของ OpenClaw

`compact()` แบบ no-op ไม่ปลอดภัยสำหรับเอนจินแบบไม่เป็นเจ้าของที่กำลังทำงานอยู่ เพราะมันจะปิดเส้นทาง `/compact` และเส้นทางกู้คืนเมื่อ overflow ตามปกติสำหรับ slot ของเอนจินนั้น

## เอกสารอ้างอิงการกำหนดค่า

```json5
{
  plugins: {
    slots: {
      // เลือกเอนจินบริบทที่ทำงานอยู่ ค่าเริ่มต้น: "legacy"
      // ตั้งเป็น plugin id เพื่อใช้เอนจิน Plugin
      contextEngine: "legacy",
    },
  },
}
```

slot นี้เป็นแบบ exclusive ในขณะรัน — จะมีการ resolve เอนจินบริบทที่ลงทะเบียนไว้เพียงหนึ่งตัวสำหรับการรันหรือการทำ Compaction ที่กำหนด Plugin อื่นที่เปิดใช้งานอยู่และมี
`kind: "context-engine"` ยังสามารถโหลดและรันโค้ดลงทะเบียนของตนได้; `plugins.slots.contextEngine` เพียงเลือกว่าจะให้ OpenClaw resolve registered engine id ใดเมื่อจำเป็นต้องใช้เอนจินบริบท

## ความสัมพันธ์กับ Compaction และ memory

- **Compaction** เป็นหนึ่งในความรับผิดชอบของเอนจินบริบท เอนจิน legacy
  ส่งต่อไปยังการสรุปในตัวของ OpenClaw เอนจิน Plugin สามารถติดตั้งกลยุทธ์ Compaction แบบใดก็ได้ (DAG summaries, vector retrieval ฯลฯ)
- **memory plugins** (`plugins.slots.memory`) แยกจากเอนจินบริบท
  memory plugins ให้ความสามารถ search/retrieval; เอนจินบริบทควบคุมสิ่งที่โมเดลมองเห็น ทั้งสองสามารถทำงานร่วมกันได้ — เอนจินบริบทอาจใช้ข้อมูลของ memory plugin ระหว่างการประกอบบริบท เอนจิน Plugin ที่ต้องการใช้เส้นทาง prompt ของ active memory ควรเลือกใช้ `buildMemorySystemPromptAddition(...)` จาก
  `openclaw/plugin-sdk/core` ซึ่งจะแปลงส่วน prompt ของ Active Memory ให้เป็น `systemPromptAddition` ที่พร้อมเติมไว้ด้านหน้า หากเอนจินต้องการการควบคุมในระดับล่างกว่า ก็ยังสามารถดึงบรรทัดดิบจาก
  `openclaw/plugin-sdk/memory-host-core` ผ่าน
  `buildActiveMemoryPromptSection(...)` ได้
- **การตัดแต่งเซสชัน** (ตัดผลลัพธ์ของเครื่องมือเก่าในหน่วยความจำ) จะยังคงทำงานไม่ว่าเอนจินบริบทใดจะกำลังทำงานอยู่

## เคล็ดลับ

- ใช้ `openclaw doctor` เพื่อตรวจสอบว่าเอนจินของคุณโหลดอย่างถูกต้อง
- หากสลับเอนจิน เซสชันที่มีอยู่จะดำเนินต่อไปพร้อมประวัติปัจจุบันของมัน
  เอนจินใหม่จะเข้ามารับช่วงสำหรับการรันในอนาคต
- ข้อผิดพลาดของเอนจินจะถูกบันทึกและแสดงในข้อมูลวินิจฉัย หากเอนจิน Plugin
  ลงทะเบียนไม่สำเร็จหรือไม่สามารถ resolve engine id ที่เลือกไว้ได้ OpenClaw
  จะไม่ fallback โดยอัตโนมัติ; การรันจะล้มเหลวจนกว่าคุณจะแก้ Plugin หรือ
  เปลี่ยน `plugins.slots.contextEngine` กลับไปเป็น `"legacy"`
- สำหรับการพัฒนา ให้ใช้ `openclaw plugins install -l ./my-engine` เพื่อ link
  ไดเรกทอรี Plugin ในเครื่องโดยไม่ต้องคัดลอก

ดูเพิ่มเติม: [Compaction](/th/concepts/compaction), [Context](/th/concepts/context),
[Plugins](/th/tools/plugin), [Plugin manifest](/th/plugins/manifest)

## ที่เกี่ยวข้อง

- [Context](/th/concepts/context) — วิธีการสร้างบริบทสำหรับเทิร์นของเอเจนต์
- [Plugin Architecture](/th/plugins/architecture) — การลงทะเบียน Plugin เอนจินบริบท
- [Compaction](/th/concepts/compaction) — การสรุปการสนทนาที่ยาว
