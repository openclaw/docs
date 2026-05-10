---
read_when:
    - คุณกำลังสร้าง Plugin ที่ต้องใช้ before_tool_call, before_agent_reply, ฮุกข้อความ หรือฮุกวงจรชีวิต
    - คุณจำเป็นต้องบล็อก เขียนใหม่ หรือกำหนดให้ต้องได้รับการอนุมัติสำหรับการเรียกใช้เครื่องมือจาก Plugin
    - คุณกำลังตัดสินใจเลือกระหว่างฮุกภายในกับฮุกของ Plugin
summary: 'ฮุกของ Plugin: ดักจับเหตุการณ์วงจรชีวิตของเอเจนต์ เครื่องมือ ข้อความ เซสชัน และ Gateway'
title: ฮุกของ Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebdbb743441dfa9eba3d476171c1c8e9d9628d2669aeea0806ede19bafd61f62
    source_path: plugins/hooks.md
    workflow: 16
---

Hook ของ Plugin เป็นจุดต่อขยายแบบในโปรเซสสำหรับ Plugin ของ OpenClaw ใช้เมื่อ
Plugin ต้องตรวจสอบหรือเปลี่ยนแปลงการรันของเอเจนต์, การเรียกเครื่องมือ, โฟลว์ข้อความ,
วงจรชีวิตเซสชัน, การกำหนดเส้นทางเอเจนต์ย่อย, การติดตั้ง หรือการเริ่มต้น Gateway

ให้ใช้ [hook ภายใน](/th/automation/hooks) แทนเมื่อคุณต้องการสคริปต์ `HOOK.md`
ขนาดเล็กที่ติดตั้งโดยผู้ปฏิบัติงานสำหรับคำสั่งและเหตุการณ์ Gateway เช่น
`/new`, `/reset`, `/stop`, `agent:bootstrap` หรือ `gateway:startup`

## เริ่มต้นอย่างรวดเร็ว

ลงทะเบียน hook ของ Plugin ที่มีชนิดกำกับด้วย `api.on(...)` จากรายการเข้าใช้งานของ Plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

ตัวจัดการ hook จะรันตามลำดับจาก `priority` สูงไปต่ำ hook ที่มีลำดับความสำคัญเท่ากัน
จะคงลำดับการลงทะเบียนไว้

`api.on(name, handler, opts?)` รับค่า:

- `priority` - ลำดับของตัวจัดการ (ค่าสูงกว่าจะรันก่อน)
- `timeoutMs` - งบเวลาต่อ hook ที่ไม่บังคับ เมื่อกำหนดไว้ ตัวรัน hook จะยกเลิก
  ตัวจัดการนั้นหลังงบเวลาหมดลงและทำต่อกับตัวถัดไป แทนที่จะปล่อยให้การตั้งค่าหรือการเรียกคืนที่ช้า
  ใช้เวลาจนหมด timeout ของโมเดลที่ผู้เรียกกำหนดไว้ หากไม่ใส่ จะใช้ timeout เริ่มต้นสำหรับการสังเกต/ตัดสินใจ
  ที่ตัวรัน hook ใช้โดยทั่วไป

ผู้ปฏิบัติงานยังสามารถตั้งค่างบเวลาของ hook ได้โดยไม่ต้องแก้โค้ด Plugin:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` จะแทนที่ `hooks.timeoutMs` ซึ่งจะแทนที่ค่า
`api.on(..., { timeoutMs })` ที่ผู้เขียน Plugin กำหนดไว้ ค่าที่กำหนดแต่ละค่าต้องเป็น
จำนวนเต็มบวกที่ไม่เกิน 600000 มิลลิวินาที ควรใช้การแทนที่ราย hook
สำหรับ hook ที่ทราบว่าช้า เพื่อไม่ให้ Plugin หนึ่งได้รับงบเวลาที่ยาวขึ้น
ทุกที่

แต่ละ hook จะได้รับ `event.context.pluginConfig` ซึ่งเป็น config ที่แก้ค่าแล้วสำหรับ
Plugin ที่ลงทะเบียนตัวจัดการนั้น ใช้ค่านี้สำหรับการตัดสินใจของ hook ที่ต้องการ
ตัวเลือก Plugin ปัจจุบัน; OpenClaw จะฉีดค่านี้ให้ต่อหนึ่งตัวจัดการโดยไม่กลายพันธุ์
ออบเจ็กต์เหตุการณ์ที่แชร์ซึ่ง Plugin อื่นเห็น

## แคตตาล็อก hook

Hook ถูกจัดกลุ่มตามพื้นผิวที่ขยาย ชื่อที่เป็น **ตัวหนา** รับผลลัพธ์การตัดสินใจได้
(บล็อก, ยกเลิก, แทนที่ หรือขออนุมัติ); รายการอื่นทั้งหมดเป็นแบบสังเกตเท่านั้น

**รอบการทำงานของเอเจนต์**

- `before_model_resolve` - แทนที่ provider หรือ model ก่อนโหลดข้อความเซสชัน
- `agent_turn_prepare` - ใช้การแทรกของรอบ Plugin ที่อยู่ในคิวและเพิ่มบริบทในรอบเดียวกันก่อน prompt hooks
- `before_prompt_build` - เพิ่มบริบทแบบไดนามิกหรือข้อความ system prompt ก่อนเรียกโมเดล
- `before_agent_start` - เฟสรวมเพื่อความเข้ากันได้เท่านั้น; ควรใช้ hook สองรายการข้างต้น
- **`before_agent_run`** - ตรวจสอบ prompt สุดท้ายและข้อความเซสชันก่อนส่งให้โมเดล และเลือกบล็อกการรันได้
- **`before_agent_reply`** - ลัดวงจรรอบของโมเดลด้วยการตอบกลับสังเคราะห์หรือการเงียบ
- **`before_agent_finalize`** - ตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้โมเดลผ่านอีกหนึ่งรอบ
- `agent_end` - สังเกตข้อความสุดท้าย สถานะความสำเร็จ และระยะเวลาการรัน
- `heartbeat_prompt_contribution` - เพิ่มบริบทเฉพาะ Heartbeat สำหรับ Plugin ตรวจสอบเบื้องหลังและวงจรชีวิต

**การสังเกตบทสนทนา**

- `model_call_started` / `model_call_ended` - สังเกต metadata ของการเรียก provider/model ที่ผ่านการทำความสะอาดแล้ว เวลา ผลลัพธ์ และแฮช request-id แบบจำกัดขนาด โดยไม่มีเนื้อหา prompt หรือ response
- `llm_input` - สังเกตอินพุตของ provider (system prompt, prompt, history)
- `llm_output` - สังเกตเอาต์พุตของ provider

**เครื่องมือ**

- **`before_tool_call`** - เขียน params ของเครื่องมือใหม่, บล็อกการทำงาน หรือขออนุมัติ
- `after_tool_call` - สังเกตผลลัพธ์เครื่องมือ ข้อผิดพลาด และระยะเวลา
- **`tool_result_persist`** - เขียนข้อความผู้ช่วยที่สร้างจากผลลัพธ์เครื่องมือใหม่
- **`before_message_write`** - ตรวจสอบหรือบล็อกการเขียนข้อความที่กำลังดำเนินอยู่ (พบไม่บ่อย)

**ข้อความและการส่งมอบ**

- **`inbound_claim`** - claim ข้อความขาเข้าก่อนกำหนดเส้นทางเอเจนต์ (การตอบกลับสังเคราะห์)
- `message_received` - สังเกตเนื้อหาขาเข้า ผู้ส่ง เธรด และ metadata
- **`message_sending`** - เขียนเนื้อหาขาออกใหม่หรือยกเลิกการส่งมอบ
- `message_sent` - สังเกตความสำเร็จหรือความล้มเหลวของการส่งมอบขาออก
- **`before_dispatch`** - ตรวจสอบหรือเขียน dispatch ขาออกใหม่ก่อนส่งต่อให้ช่องทาง
- **`reply_dispatch`** - เข้าร่วมใน pipeline การ dispatch คำตอบสุดท้าย

**เซสชันและ Compaction**

- `session_start` / `session_end` - ติดตามขอบเขตวงจรชีวิตเซสชัน
- `before_compaction` / `after_compaction` - สังเกตหรือใส่คำอธิบายประกอบรอบ Compaction
- `before_reset` - สังเกตเหตุการณ์รีเซ็ตเซสชัน (`/reset`, การรีเซ็ตผ่านโปรแกรม)

**เอเจนต์ย่อย**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - ประสานการกำหนดเส้นทางเอเจนต์ย่อยและการส่งมอบเมื่อเสร็จสิ้น

**วงจรชีวิต**

- `gateway_start` / `gateway_stop` - เริ่มหรือหยุดบริการที่ Plugin เป็นเจ้าของพร้อมกับ Gateway
- `cron_changed` - สังเกตการเปลี่ยนแปลงวงจรชีวิต Cron ที่ Gateway เป็นเจ้าของ (เพิ่ม, อัปเดต, ลบ, เริ่ม, เสร็จสิ้น, กำหนดเวลาแล้ว)
- **`before_install`** - ตรวจสอบการสแกนการติดตั้ง skill หรือ Plugin และเลือกบล็อกได้

## นโยบายการเรียกเครื่องมือ

`before_tool_call` ได้รับ:

- `event.toolName`
- `event.params`
- `event.derivedPaths` ที่ไม่บังคับ ซึ่งมีคำใบ้ path เป้าหมายแบบ best-effort ที่ host ได้อนุมานมา
  สำหรับ envelope ของเครื่องมือที่เป็นที่รู้จัก เช่น `apply_patch`; เมื่อมีค่า
  path เหล่านี้อาจไม่สมบูรณ์ หรืออาจครอบคลุมมากกว่าสิ่งที่เครื่องมือจะแตะจริง
  (เช่น กรณีอินพุตผิดรูปหรือบางส่วน)
- `event.runId` ที่ไม่บังคับ
- `event.toolCallId` ที่ไม่บังคับ
- ฟิลด์บริบท เช่น `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ตั้งค่าในการรันที่ขับเคลื่อนด้วย Cron) และ `ctx.trace` สำหรับการวินิจฉัย

สามารถคืนค่า:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

กฎ:

- `block: true` เป็นการตัดสินใจสุดท้ายและข้ามตัวจัดการที่มีลำดับความสำคัญต่ำกว่า
- `block: false` ถือว่าไม่มีการตัดสินใจ
- `params` เขียนพารามิเตอร์เครื่องมือใหม่สำหรับการทำงาน
- `requireApproval` หยุดการรันเอเจนต์ชั่วคราวและถามผู้ใช้ผ่านการอนุมัติของ Plugin
  คำสั่ง `/approve` สามารถอนุมัติได้ทั้งการอนุมัติ exec และ Plugin
- `block: true` ที่มีลำดับความสำคัญต่ำกว่ายังสามารถบล็อกได้หลังจาก hook ที่มีลำดับความสำคัญสูงกว่า
  ขออนุมัติแล้ว
- `onResolution` ได้รับการตัดสินใจอนุมัติที่แก้ค่าแล้ว - `allow-once`,
  `allow-always`, `deny`, `timeout` หรือ `cancelled`

Plugin ที่มาพร้อมระบบซึ่งต้องใช้นโยบายระดับ host สามารถลงทะเบียนนโยบายเครื่องมือที่เชื่อถือได้
ด้วย `api.registerTrustedToolPolicy(...)` นโยบายเหล่านี้จะรันก่อน hook
`before_tool_call` ปกติและก่อนการตัดสินใจของ Plugin ภายนอก ใช้เฉพาะ
สำหรับด่านที่ host เชื่อถือ เช่น นโยบาย workspace, การบังคับใช้งบประมาณ หรือ
ความปลอดภัยของ workflow ที่สงวนไว้ Plugin ภายนอกควรใช้ hook `before_tool_call`
ปกติ

### การคงอยู่ของผลลัพธ์เครื่องมือ

ผลลัพธ์เครื่องมือสามารถมี `details` แบบมีโครงสร้างสำหรับการเรนเดอร์ UI, การวินิจฉัย,
การกำหนดเส้นทางสื่อ หรือ metadata ที่ Plugin เป็นเจ้าของ ให้ถือว่า `details` เป็น metadata ขณะรัน
ไม่ใช่เนื้อหา prompt:

- OpenClaw ตัด `toolResult.details` ออกก่อน replay ให้ provider และก่อนอินพุต Compaction
  เพื่อไม่ให้ metadata กลายเป็นบริบทของโมเดล
- รายการเซสชันที่คงอยู่จะเก็บเฉพาะ `details` ที่จำกัดขนาด รายละเอียดที่ใหญ่เกินไปจะถูก
  แทนที่ด้วยสรุปขนาดกะทัดรัดและ `persistedDetailsTruncated: true`
- `tool_result_persist` และ `before_message_write` รันก่อนเพดานการคงอยู่ขั้นสุดท้าย
  Hook ยังควรเก็บ `details` ที่คืนค่าให้มีขนาดเล็กและหลีกเลี่ยง
  การวางข้อความที่เกี่ยวข้องกับ prompt ไว้เฉพาะใน `details`; ให้วางเอาต์พุตเครื่องมือที่โมเดลเห็นได้
  ใน `content`

## Hook สำหรับ prompt และ model

ใช้ hook เฉพาะเฟสสำหรับ Plugin ใหม่:

- `before_model_resolve`: ได้รับเฉพาะ prompt ปัจจุบันและ metadata ของไฟล์แนบ
  คืนค่า `providerOverride` หรือ `modelOverride`
- `agent_turn_prepare`: ได้รับ prompt ปัจจุบัน ข้อความเซสชันที่เตรียมไว้
  และการแทรกในคิวแบบครั้งเดียวพอดีที่ถูกระบายสำหรับเซสชันนี้ คืนค่า
  `prependContext` หรือ `appendContext`
- `before_prompt_build`: ได้รับ prompt ปัจจุบันและข้อความเซสชัน
  คืนค่า `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` หรือ `appendSystemContext`
- `heartbeat_prompt_contribution`: รันเฉพาะสำหรับรอบ Heartbeat และคืนค่า
  `prependContext` หรือ `appendContext` มีไว้สำหรับมอนิเตอร์เบื้องหลัง
  ที่ต้องสรุปสถานะปัจจุบันโดยไม่เปลี่ยนรอบที่ผู้ใช้เริ่ม

`before_agent_start` ยังคงอยู่เพื่อความเข้ากันได้ ควรใช้ hook ที่ชัดเจนข้างต้น
เพื่อไม่ให้ Plugin ของคุณขึ้นกับเฟสรวมแบบเดิม

`before_agent_run` รันหลังสร้าง prompt และก่อนอินพุตใด ๆ ของโมเดล
รวมถึงการโหลดรูปภาพเฉพาะ prompt และการสังเกต `llm_input` โดยได้รับ
อินพุตผู้ใช้ปัจจุบันเป็น `prompt` พร้อมกับประวัติเซสชันที่โหลดแล้วใน `messages`
และ system prompt ที่ใช้งานอยู่ คืนค่า `{ outcome: "block", reason, message? }`
เพื่อหยุดการรันก่อนที่โมเดลจะอ่าน prompt ได้ `reason` เป็นข้อมูลภายใน;
`message` เป็นข้อความแทนที่ที่ผู้ใช้เห็น outcome ที่รองรับมีเพียง
`pass` และ `block`; รูปแบบการตัดสินใจที่ไม่รองรับจะปิดแบบปลอดภัย

เมื่อการรันถูกบล็อก OpenClaw จะเก็บเฉพาะข้อความแทนที่ใน
`message.content` พร้อม metadata การบล็อกที่ไม่อ่อนไหว เช่น id ของ Plugin ที่บล็อก
และ timestamp ข้อความผู้ใช้ต้นฉบับจะไม่ถูกเก็บไว้ใน transcript หรือบริบทอนาคต
เหตุผลการบล็อกภายในถือเป็นข้อมูลอ่อนไหวและถูกตัดออกจาก payload ของ
transcript, history, broadcast, log และ diagnostics การสังเกตควรใช้ฟิลด์ที่ทำความสะอาดแล้ว
เช่น id ของผู้บล็อก, outcome, timestamp หรือหมวดหมู่ที่ปลอดภัย

`before_agent_start` และ `agent_end` รวม `event.runId` เมื่อ OpenClaw สามารถ
ระบุการรันที่ใช้งานอยู่ได้ ค่าเดียวกันนี้ยังอยู่ใน `ctx.runId`
การรันที่ขับเคลื่อนด้วย Cron ยังเปิดเผย `ctx.jobId` (id ของงาน Cron ต้นทาง) เพื่อให้
hook ของ Plugin สามารถจำกัดขอบเขต metrics, side effects หรือ state ไปยังงานที่กำหนดเวลาไว้รายการหนึ่ง

สำหรับการรันที่มาจากช่องทาง `ctx.messageProvider` คือพื้นผิว provider เช่น
`discord` หรือ `telegram` ส่วน `ctx.channelId` คือ identifier เป้าหมายของบทสนทนา
เมื่อ OpenClaw สามารถอนุมานได้จาก session key หรือ metadata การส่งมอบ

`agent_end` เป็น hook แบบสังเกตและรันแบบ fire-and-forget หลังจบรอบ
ตัวรัน hook ใช้ timeout 30 วินาที เพื่อไม่ให้ Plugin หรือ endpoint embedding
ที่ค้างทำให้ promise ของ hook รออยู่ตลอดไป timeout จะถูกบันทึก log และ
OpenClaw จะทำต่อ; มันจะไม่ยกเลิกงานเครือข่ายที่ Plugin เป็นเจ้าของ เว้นแต่
Plugin จะใช้ abort signal ของตัวเองด้วย

ใช้ `model_call_started` และ `model_call_ended` สำหรับ telemetry ของการเรียก provider
ที่ไม่ควรได้รับ prompt, history, response, header, request body หรือ provider request ID แบบดิบ
Hook เหล่านี้มี metadata ที่เสถียร เช่น `runId`, `callId`, `provider`, `model`,
`api`/`transport` ที่ไม่บังคับ, `durationMs`/`outcome` สุดท้าย และ
`upstreamRequestIdHash` เมื่อ OpenClaw สามารถอนุมานแฮช provider request-id แบบจำกัดขนาดได้

`before_agent_finalize` ทำงานเฉพาะเมื่อ harness กำลังจะยอมรับคำตอบสุดท้ายแบบภาษาธรรมชาติจาก assistant เท่านั้น ไม่ใช่เส้นทางการยกเลิก `/stop` และไม่ทำงานเมื่อผู้ใช้ยกเลิก turn ให้ส่งคืน `{ action: "revise", reason }` เพื่อขอให้ harness ทำ model pass อีกหนึ่งครั้งก่อน finalization, `{ action:
"finalize", reason? }` เพื่อบังคับ finalization หรือไม่ต้องส่งผลลัพธ์เพื่อดำเนินการต่อ hooks `Stop` แบบเนทีฟของ Codex จะถูกส่งต่อมายัง hook นี้เป็นการตัดสินใจ `before_agent_finalize` ของ OpenClaw

เมื่อส่งคืน `action: "revise"` plugins สามารถรวม metadata `retry` เพื่อทำให้ model pass เพิ่มเติมมีขอบเขตและ replay-safe ได้:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` จะถูกผนวกเข้ากับเหตุผลของการแก้ไขที่ส่งไปยัง harness
`idempotencyKey` ช่วยให้ host นับ retries สำหรับคำขอจาก plugin เดียวกันข้ามการตัดสินใจ finalize ที่เทียบเท่ากัน และ `maxAttempts` จำกัดจำนวน pass เพิ่มเติมที่ host จะอนุญาตก่อนดำเนินการต่อด้วยคำตอบสุดท้ายตามธรรมชาติ

Plugins ที่ไม่ได้ bundle มาด้วยซึ่งต้องใช้ raw conversation hooks (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end`, หรือ `before_agent_run`) ต้องตั้งค่า:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

hooks ที่แก้ไข prompt และการฉีดข้อมูลสำหรับ turn ถัดไปแบบ durable สามารถปิดใช้งานแยกตาม plugin ได้ด้วย `plugins.entries.<id>.hooks.allowPromptInjection=false`

### ส่วนขยาย session และการฉีดข้อมูลสำหรับ turn ถัดไป

Workflow plugins สามารถคงสถานะ session ขนาดเล็กที่เข้ากันได้กับ JSON ด้วย `api.registerSessionExtension(...)` และอัปเดตผ่านเมธอด `sessions.pluginPatch` ของ Gateway ได้ แถว session จะ project สถานะ extension ที่ลงทะเบียนไว้ผ่าน `pluginExtensions` ทำให้ Control UI และ client อื่น ๆ แสดงสถานะที่ plugin เป็นเจ้าของได้โดยไม่ต้องรู้ internals ของ plugin

ใช้ `api.enqueueNextTurnInjection(...)` เมื่อ plugin ต้องการบริบทแบบ durable ให้ไปถึง model turn ถัดไปเพียงครั้งเดียว OpenClaw จะ drain injections ที่อยู่ในคิวก่อน prompt hooks, ทิ้ง injections ที่หมดอายุ และ deduplicate ตาม `idempotencyKey` ต่อ plugin นี่คือ seam ที่เหมาะสำหรับ approval resumes, policy summaries, background monitor deltas และ command continuations ที่ควรมองเห็นได้สำหรับ model ใน turn ถัดไป แต่ไม่ควรกลายเป็นข้อความ system prompt ถาวร

ความหมายด้าน cleanup เป็นส่วนหนึ่งของ contract การ cleanup session extension และ callbacks cleanup lifecycle ของ runtime จะได้รับ `reset`, `delete`, `disable` หรือ `restart` host จะลบสถานะ persistent session extension ของ plugin เจ้าของและ pending next-turn injections สำหรับ reset/delete/disable; restart จะคงสถานะ session แบบ durable ไว้ ขณะที่ cleanup callbacks ให้ plugins ปล่อย scheduler jobs, run context และทรัพยากร out-of-band อื่น ๆ สำหรับ runtime generation เก่า

## Message hooks

ใช้ message hooks สำหรับนโยบาย routing และ delivery ระดับ channel:

- `message_received`: สังเกต inbound content, sender, `threadId`, `messageId`,
  `senderId`, ความสัมพันธ์ run/session ที่เป็น optional และ metadata
- `message_sending`: เขียน `content` ใหม่หรือส่งคืน `{ cancel: true }`
- `message_sent`: สังเกต success หรือ failure สุดท้าย

สำหรับ audio-only TTS replies, `content` อาจมี hidden spoken transcript แม้ว่า channel payload จะไม่มีข้อความ/caption ที่มองเห็นได้ การเขียน `content` นั้นใหม่จะอัปเดตเฉพาะ transcript ที่ hook มองเห็นเท่านั้น; จะไม่ถูก render เป็น media caption

บริบท Message hook เปิดเผย fields ความสัมพันธ์ที่เสถียรเมื่อมีให้ใช้:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` และ `ctx.callDepth` ให้ใช้ first-class fields เหล่านี้ก่อนอ่าน legacy metadata

ควรใช้ fields `threadId` และ `replyToId` ที่มี type ก่อนใช้ metadata เฉพาะ channel

กฎการตัดสินใจ:

- `message_sending` ที่มี `cancel: true` เป็น terminal
- `message_sending` ที่มี `cancel: false` จะถือว่าไม่มีการตัดสินใจ
- `content` ที่ถูกเขียนใหม่จะดำเนินต่อไปยัง hooks ที่มี priority ต่ำกว่า เว้นแต่ hook ภายหลังจะยกเลิก delivery
- `message_sending` สามารถส่งคืน `cancelReason` และ `metadata` แบบมีขอบเขตพร้อมกับการยกเลิกได้ APIs lifecycle message ใหม่เปิดเผยสิ่งนี้เป็นผลลัพธ์ delivery ที่ถูก suppress พร้อมเหตุผล `cancelled_by_message_sending_hook`; legacy direct delivery ยังคงส่งคืน array ผลลัพธ์ว่างเพื่อ compatibility
- `message_sent` เป็นการสังเกตเท่านั้น ความล้มเหลวของ handler จะถูกบันทึก log และไม่เปลี่ยนผลลัพธ์ delivery

## Install hooks

`before_install` ทำงานหลังการสแกนในตัวสำหรับการติดตั้ง skill และ plugin ส่งคืน findings เพิ่มเติมหรือ `{ block: true, blockReason }` เพื่อหยุดการติดตั้ง

`block: true` เป็น terminal `block: false` จะถือว่าไม่มีการตัดสินใจ

## Gateway lifecycle

ใช้ `gateway_start` สำหรับบริการ plugin ที่ต้องการสถานะที่ Gateway เป็นเจ้าของ บริบทเปิดเผย `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับการตรวจสอบและอัปเดต cron ใช้ `gateway_stop` เพื่อ cleanup ทรัพยากรที่ทำงานระยะยาว

อย่าพึ่งพา hook ภายใน `gateway:startup` สำหรับบริการ runtime ที่ plugin เป็นเจ้าของ

`cron_changed` จะ fire สำหรับเหตุการณ์ cron lifecycle ที่ gateway เป็นเจ้าของ พร้อม event payload ที่มี type ครอบคลุมเหตุผล `added`, `updated`, `removed`, `started`, `finished` และ `scheduled` event จะมี snapshot `PluginHookGatewayCronJob` (รวมถึง `state.nextRunAtMs`, `state.lastRunStatus` และ `state.lastError` เมื่อมี) พร้อม `PluginHookGatewayCronDeliveryStatus` เป็น `not-requested` | `delivered` | `not-delivered` | `unknown` events ที่ถูกลบแล้วยังคงมี snapshot ของ job ที่ถูกลบ เพื่อให้ external schedulers reconcile สถานะได้ ใช้ `ctx.getCron?.()` และ `ctx.config` จากบริบท runtime เมื่อ sync external wake schedulers และให้ OpenClaw เป็น source of truth สำหรับ due checks และ execution

## การเลิกใช้งานที่กำลังจะมาถึง

surfaces บางส่วนที่อยู่ใกล้เคียงกับ hook ถูก deprecated แต่ยังรองรับอยู่ ให้ migrate ก่อน major release ถัดไป:

- **Plaintext channel envelopes** ใน handlers `inbound_claim` และ `message_received`
  อ่าน `BodyForAgent` และบล็อก user-context แบบ structured แทนการ parse ข้อความ envelope แบบ flat ดู
  [Plaintext channel envelopes → BodyForAgent](/th/plugins/sdk-migration#active-deprecations)
- **`before_agent_start`** ยังคงอยู่เพื่อ compatibility Plugins ใหม่ควรใช้
  `before_model_resolve` และ `before_prompt_build` แทน phase แบบรวม
- **`onResolution` ใน `before_tool_call`** ตอนนี้ใช้ union แบบมี type
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) แทน `string` แบบ free-form

สำหรับรายการทั้งหมด ได้แก่ memory capability registration, provider thinking
profile, external auth providers, provider discovery types, task runtime
accessors และการเปลี่ยนชื่อ `command-auth` → `command-status` ดู
[Plugin SDK migration → Active deprecations](/th/plugins/sdk-migration#active-deprecations)

## ที่เกี่ยวข้อง

- [Plugin SDK migration](/th/plugins/sdk-migration) - active deprecations และ removal timeline
- [Building plugins](/th/plugins/building-plugins)
- [Plugin SDK overview](/th/plugins/sdk-overview)
- [Plugin entry points](/th/plugins/sdk-entrypoints)
- [Internal hooks](/th/automation/hooks)
- [Plugin architecture internals](/th/plugins/architecture-internals)
