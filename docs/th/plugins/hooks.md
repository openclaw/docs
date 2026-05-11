---
read_when:
    - คุณกำลังสร้าง Plugin ที่ต้องใช้ before_tool_call, before_agent_reply, ฮุกข้อความ หรือฮุกวงจรชีวิต
    - คุณต้องบล็อก เขียนใหม่ หรือกำหนดให้ต้องมีการอนุมัติสำหรับการเรียกใช้เครื่องมือจาก Plugin
    - คุณกำลังตัดสินใจเลือกระหว่างฮุกภายในกับฮุกของ Plugin
summary: 'ฮุกของ Plugin: ดักจับเหตุการณ์วงจรชีวิตของเอเจนต์ เครื่องมือ ข้อความ เซสชัน และ Gateway'
title: ฮุกของ Plugin
x-i18n:
    generated_at: "2026-05-11T20:35:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

hook ของ Plugin เป็นจุดขยายภายในโปรเซสสำหรับ Plugin ของ OpenClaw ใช้เมื่อ
Plugin จำเป็นต้องตรวจสอบหรือเปลี่ยนแปลงการรันของเอเจนต์, การเรียกเครื่องมือ,
โฟลว์ข้อความ, วงจรชีวิตของเซสชัน, การกำหนดเส้นทาง subagent, การติดตั้ง,
หรือการเริ่มต้น Gateway

ใช้ [hook ภายใน](/th/automation/hooks) แทนเมื่อคุณต้องการสคริปต์ `HOOK.md`
ขนาดเล็กที่ติดตั้งโดยผู้ปฏิบัติงานสำหรับเหตุการณ์คำสั่งและ Gateway เช่น
`/new`, `/reset`, `/stop`, `agent:bootstrap`, หรือ `gateway:startup`

## เริ่มต้นอย่างรวดเร็ว

ลงทะเบียน hook ของ Plugin แบบมี type ด้วย `api.on(...)` จาก entry ของ Plugin:

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

ตัวจัดการ hook ทำงานตามลำดับแบบต่อเนื่อง โดยเรียง `priority` จากมากไปน้อย
hook ที่มี priority เท่ากันจะรักษาลำดับการลงทะเบียนไว้

`api.on(name, handler, opts?)` รองรับ:

- `priority` - การเรียงลำดับตัวจัดการ (ค่าสูงกว่าทำงานก่อน)
- `timeoutMs` - งบเวลาต่อ hook แบบไม่บังคับ เมื่อกำหนดไว้ hook runner จะยกเลิก
  ตัวจัดการนั้นหลังงบเวลาหมด และดำเนินการต่อกับตัวถัดไป แทนที่จะปล่อยให้งานตั้งค่า
  หรือเรียกคืนที่ช้าใช้เวลา timeout ของโมเดลที่ผู้เรียกกำหนดไว้ หากไม่ระบุ จะใช้
  timeout เริ่มต้นสำหรับการสังเกต/การตัดสินใจที่ hook runner ใช้โดยทั่วไป

ผู้ปฏิบัติงานยังสามารถตั้งงบเวลาของ hook ได้โดยไม่ต้องแก้โค้ด Plugin:

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

`hooks.timeouts.<hookName>` แทนที่ `hooks.timeoutMs` ซึ่งแทนที่ค่า
`api.on(..., { timeoutMs })` ที่ Plugin เขียนไว้ ค่าที่กำหนดแต่ละค่าต้องเป็น
จำนวนเต็มบวกไม่เกิน 600000 มิลลิวินาที ควรใช้การแทนที่ราย hook สำหรับ hook
ที่ทราบว่าช้า เพื่อไม่ให้ Plugin หนึ่งได้รับงบเวลาที่ยาวขึ้นในทุกที่

แต่ละ hook ได้รับ `event.context.pluginConfig` ซึ่งเป็น config ที่ resolve แล้ว
สำหรับ Plugin ที่ลงทะเบียนตัวจัดการนั้น ใช้ค่านี้สำหรับการตัดสินใจของ hook
ที่ต้องใช้ตัวเลือกปัจจุบันของ Plugin; OpenClaw จะ inject ให้ต่อหนึ่งตัวจัดการ
โดยไม่แก้ไขอ็อบเจกต์เหตุการณ์ร่วมที่ Plugin อื่นเห็น

## แค็ตตาล็อก hook

hook ถูกจัดกลุ่มตามพื้นผิวที่ขยาย ชื่อที่เป็น **ตัวหนา** รองรับผลลัพธ์การตัดสินใจ
(บล็อก, ยกเลิก, แทนที่, หรือต้องขออนุมัติ); รายการอื่นทั้งหมดเป็นแบบสังเกตเท่านั้น

**รอบการทำงานของเอเจนต์**

- `before_model_resolve` - แทนที่ provider หรือโมเดลก่อนโหลดข้อความเซสชัน
- `agent_turn_prepare` - ใช้การฉีดรอบการทำงานจาก Plugin ที่เข้าคิวไว้ และเพิ่มบริบทในรอบเดียวกันก่อน prompt hooks
- `before_prompt_build` - เพิ่มบริบทแบบไดนามิกหรือข้อความ system-prompt ก่อนการเรียกโมเดล
- `before_agent_start` - phase รวมเพื่อความเข้ากันได้เท่านั้น; ควรใช้ hook สองรายการด้านบน
- **`before_agent_run`** - ตรวจสอบ prompt สุดท้ายและข้อความเซสชันก่อนส่งให้โมเดล และเลือกบล็อกการรันได้
- **`before_agent_reply`** - ตัดรอบการทำงานของโมเดลให้สั้นลงด้วยคำตอบสังเคราะห์หรือความเงียบ
- **`before_agent_finalize`** - ตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้โมเดลทำงานอีกหนึ่งรอบ
- `agent_end` - สังเกตข้อความสุดท้าย, สถานะความสำเร็จ, และระยะเวลาการรัน
- `heartbeat_prompt_contribution` - เพิ่มบริบทเฉพาะ Heartbeat สำหรับ Plugin ตรวจสอบเบื้องหลังและวงจรชีวิต

**การสังเกตการสนทนา**

- `model_call_started` / `model_call_ended` - สังเกต metadata การเรียก provider/model ที่ผ่านการทำให้ปลอดภัยแล้ว, เวลา, ผลลัพธ์, และแฮช request-id แบบจำกัด โดยไม่มีเนื้อหา prompt หรือ response
- `llm_input` - สังเกต input ของ provider (system prompt, prompt, ประวัติ)
- `llm_output` - สังเกต output ของ provider

**เครื่องมือ**

- **`before_tool_call`** - เขียน params ของเครื่องมือใหม่, บล็อกการดำเนินการ, หรือบังคับขออนุมัติ
- `after_tool_call` - สังเกตผลลัพธ์ของเครื่องมือ, ข้อผิดพลาด, และระยะเวลา
- **`tool_result_persist`** - เขียนข้อความผู้ช่วยที่สร้างจากผลลัพธ์เครื่องมือใหม่
- **`before_message_write`** - ตรวจสอบหรือบล็อกการเขียนข้อความที่กำลังดำเนินอยู่ (พบไม่บ่อย)

**ข้อความและการส่งมอบ**

- **`inbound_claim`** - claim ข้อความขาเข้าก่อนการกำหนดเส้นทางเอเจนต์ (คำตอบสังเคราะห์)
- `message_received` - สังเกตเนื้อหาขาเข้า, ผู้ส่ง, เธรด, และ metadata
- **`message_sending`** - เขียนเนื้อหาขาออกใหม่หรือยกเลิกการส่งมอบ
- `message_sent` - สังเกตความสำเร็จหรือความล้มเหลวของการส่งมอบขาออก
- **`before_dispatch`** - ตรวจสอบหรือเขียน dispatch ขาออกใหม่ก่อนส่งต่อให้ channel
- **`reply_dispatch`** - เข้าร่วม pipeline dispatch คำตอบสุดท้าย

**เซสชันและ Compaction**

- `session_start` / `session_end` - ติดตามขอบเขตวงจรชีวิตของเซสชัน `reason` ของเหตุการณ์เป็นหนึ่งใน `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart`, หรือ `unknown` ค่า `shutdown` และ `restart` จะทำงานจาก finalizer การปิด Gateway เมื่อโปรเซสถูกหยุดหรือเริ่มใหม่ขณะที่เซสชันยังทำงานอยู่ เพื่อให้ Plugin downstream (เช่น memory หรือ transcript stores) สามารถ finalize แถว ghost ที่อาจค้างอยู่ในสถานะเปิดข้ามการ restart ได้ finalizer ถูกจำกัดเวลาเพื่อไม่ให้ Plugin ที่ช้าบล็อก SIGTERM/SIGINT
- `before_compaction` / `after_compaction` - สังเกตหรือ annotate รอบ Compaction
- `before_reset` - สังเกตเหตุการณ์รีเซ็ตเซสชัน (`/reset`, การรีเซ็ตแบบ programmatic)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - ประสานการกำหนดเส้นทาง subagent และการส่งมอบเมื่อเสร็จสิ้น

**วงจรชีวิต**

- `gateway_start` / `gateway_stop` - เริ่มหรือหยุดบริการที่ Plugin เป็นเจ้าของพร้อมกับ Gateway
- `cron_changed` - สังเกตการเปลี่ยนแปลงวงจรชีวิต Cron ที่ Gateway เป็นเจ้าของ (เพิ่ม, อัปเดต, ลบ, เริ่ม, เสร็จสิ้น, กำหนดเวลา)
- **`before_install`** - ตรวจสอบการสแกนการติดตั้ง skill หรือ Plugin และเลือกบล็อกได้

## นโยบายการเรียกเครื่องมือ

`before_tool_call` ได้รับ:

- `event.toolName`
- `event.params`
- `event.derivedPaths` แบบไม่บังคับ ซึ่งมี hint เส้นทางเป้าหมายที่ host derive แบบ best-effort
  สำหรับ envelope ของเครื่องมือที่รู้จักดี เช่น `apply_patch`; เมื่อมีอยู่
  เส้นทางเหล่านี้อาจไม่สมบูรณ์หรืออาจประเมินเกินสิ่งที่เครื่องมือจะ
  แตะจริง (เช่น input ที่ผิดรูปแบบหรือไม่ครบถ้วน)
- `event.runId` แบบไม่บังคับ
- `event.toolCallId` แบบไม่บังคับ
- ฟิลด์บริบท เช่น `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ตั้งค่าในการรันที่ขับเคลื่อนโดย Cron), และ `ctx.trace` สำหรับวินิจฉัย

สามารถ return:

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

- `block: true` เป็น terminal และข้ามตัวจัดการที่มี priority ต่ำกว่า
- `block: false` ถือว่าไม่มีการตัดสินใจ
- `params` เขียนพารามิเตอร์เครื่องมือใหม่สำหรับการดำเนินการ
- `requireApproval` หยุดการรันของเอเจนต์ชั่วคราวและถามผู้ใช้ผ่านการอนุมัติของ Plugin
  คำสั่ง `/approve` สามารถอนุมัติได้ทั้ง exec และการอนุมัติของ Plugin
- `block: true` ที่มี priority ต่ำกว่ายังสามารถบล็อกได้หลัง hook ที่มี priority สูงกว่า
  ขออนุมัติแล้ว
- `onResolution` ได้รับการตัดสินใจอนุมัติที่ resolve แล้ว - `allow-once`,
  `allow-always`, `deny`, `timeout`, หรือ `cancelled`

Plugin ที่ bundle มาด้วยซึ่งต้องใช้นโยบายระดับ host สามารถลงทะเบียนนโยบายเครื่องมือที่ trusted
ด้วย `api.registerTrustedToolPolicy(...)` นโยบายเหล่านี้ทำงานก่อน hook
`before_tool_call` ปกติ และก่อนการตัดสินใจของ Plugin ภายนอก ใช้เฉพาะ
สำหรับ gate ที่ host trusted เช่น นโยบาย workspace, การบังคับใช้งบประมาณ,
หรือความปลอดภัยของ workflow ที่สงวนไว้ Plugin ภายนอกควรใช้ hook `before_tool_call`
ตามปกติ

### การคงอยู่ของผลลัพธ์เครื่องมือ

ผลลัพธ์เครื่องมือสามารถมี `details` แบบมีโครงสร้างสำหรับการเรนเดอร์ UI,
การวินิจฉัย, การกำหนดเส้นทาง media, หรือ metadata ที่ Plugin เป็นเจ้าของ
ให้ถือว่า `details` เป็น metadata ระหว่างรัน ไม่ใช่เนื้อหา prompt:

- OpenClaw ลบ `toolResult.details` ก่อน replay ให้ provider และก่อน input ของ Compaction
  เพื่อไม่ให้ metadata กลายเป็นบริบทของโมเดล
- รายการเซสชันที่คงอยู่จะเก็บเฉพาะ `details` แบบจำกัด ข้อมูลรายละเอียดที่ใหญ่เกินไปจะ
  ถูกแทนที่ด้วยสรุปแบบกะทัดรัดและ `persistedDetailsTruncated: true`
- `tool_result_persist` และ `before_message_write` ทำงานก่อน cap การคงอยู่สุดท้าย
  hook ยังควรรักษา `details` ที่ return ให้มีขนาดเล็ก และหลีกเลี่ยงการ
  วางข้อความที่เกี่ยวข้องกับ prompt ไว้เฉพาะใน `details`; ให้วาง output ของเครื่องมือที่โมเดลเห็นได้
  ใน `content`

## hook ของ prompt และโมเดล

ใช้ hook เฉพาะ phase สำหรับ Plugin ใหม่:

- `before_model_resolve`: รับเฉพาะ prompt ปัจจุบันและ metadata ของ attachment
  return `providerOverride` หรือ `modelOverride`
- `agent_turn_prepare`: รับ prompt ปัจจุบัน, ข้อความเซสชันที่เตรียมไว้,
  และการฉีดที่เข้าคิวแบบ exactly-once ใดๆ ที่ drain สำหรับเซสชันนี้ return
  `prependContext` หรือ `appendContext`
- `before_prompt_build`: รับ prompt ปัจจุบันและข้อความเซสชัน
  return `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, หรือ `appendSystemContext`
- `heartbeat_prompt_contribution`: ทำงานเฉพาะรอบ Heartbeat และ return
  `prependContext` หรือ `appendContext` มีไว้สำหรับ monitor เบื้องหลัง
  ที่ต้องสรุปสถานะปัจจุบันโดยไม่เปลี่ยนรอบการทำงานที่ผู้ใช้เริ่ม

`before_agent_start` ยังอยู่เพื่อความเข้ากันได้ ควรใช้ hook ที่ชัดเจนด้านบน
เพื่อให้ Plugin ของคุณไม่ขึ้นกับ phase รวมแบบ legacy

`before_agent_run` ทำงานหลังการสร้าง prompt และก่อน input ใดๆ ของโมเดล
รวมถึงการโหลดรูปภาพเฉพาะ prompt และการสังเกต `llm_input` โดยได้รับ
input ปัจจุบันของผู้ใช้เป็น `prompt` พร้อมประวัติเซสชันที่โหลดแล้วใน `messages`
และ system prompt ที่ใช้งานอยู่ return `{ outcome: "block", reason, message? }`
เพื่อหยุดการรันก่อนที่โมเดลจะอ่าน prompt ได้ `reason` เป็นข้อมูลภายใน;
`message` เป็นข้อความแทนที่ที่ผู้ใช้เห็นได้ outcome ที่รองรับมีเพียง
`pass` และ `block`; รูปแบบการตัดสินใจที่ไม่รองรับจะ fail closed

เมื่อการรันถูกบล็อก OpenClaw จะเก็บเฉพาะข้อความแทนที่ใน
`message.content` พร้อม metadata การบล็อกที่ไม่อ่อนไหว เช่น id ของ Plugin
ที่บล็อกและ timestamp ข้อความต้นฉบับของผู้ใช้จะไม่ถูกเก็บไว้ใน transcript
หรือบริบทในอนาคต เหตุผลการบล็อกภายในถือเป็นข้อมูลอ่อนไหวและถูกตัดออกจาก
payload ของ transcript, ประวัติ, broadcast, log, และการวินิจฉัย การสังเกตการณ์
ควรใช้ฟิลด์ที่ผ่านการทำให้ปลอดภัยแล้ว เช่น blocker id, outcome, timestamp,
หรือหมวดหมู่ที่ปลอดภัย

`before_agent_start` และ `agent_end` มี `event.runId` เมื่อ OpenClaw
ระบุการรันที่ใช้งานอยู่ได้ ค่าเดียวกันนี้ยังมีใน `ctx.runId` ด้วย
การรันที่ขับเคลื่อนโดย Cron ยังเปิดเผย `ctx.jobId` (id ของงาน Cron ต้นทาง)
เพื่อให้ hook ของ Plugin สามารถจำกัดขอบเขต metrics, side effect, หรือ state
ไปยังงานที่กำหนดเวลาเฉพาะได้

สำหรับการรันที่มีต้นทางจาก channel, `ctx.messageProvider` คือพื้นผิว provider
เช่น `discord` หรือ `telegram` ขณะที่ `ctx.channelId` คือ identifier ของเป้าหมาย
การสนทนาเมื่อ OpenClaw derive ได้จาก session key หรือ metadata การส่งมอบ

`agent_end` เป็น hook แบบสังเกตและทำงานแบบ fire-and-forget หลังรอบการทำงาน
hook runner ใช้ timeout 30 วินาที เพื่อไม่ให้ Plugin หรือ embedding endpoint
ที่ค้างทำให้ promise ของ hook pending ตลอดไป timeout จะถูก log และ
OpenClaw ดำเนินการต่อ; มันไม่ยกเลิกงาน network ที่ Plugin เป็นเจ้าของ เว้นแต่
Plugin จะใช้ abort signal ของตัวเองด้วย

ใช้ `model_call_started` และ `model_call_ended` สำหรับเทเลเมทรีของการเรียกผู้ให้บริการ
ที่ไม่ควรได้รับพรอมป์ดิบ ประวัติ คำตอบ ส่วนหัว เนื้อหาคำขอ
หรือ ID คำขอของผู้ให้บริการ Hook เหล่านี้รวมเมทาดาทาที่เสถียร เช่น
`runId`, `callId`, `provider`, `model`, `api`/`transport` ที่เป็นตัวเลือก,
`durationMs`/`outcome` ตอนจบ และ `upstreamRequestIdHash` เมื่อ OpenClaw สามารถสร้าง
แฮช ID คำขอของผู้ให้บริการแบบมีขอบเขตได้

`before_agent_finalize` ทำงานเฉพาะเมื่อฮาร์เนสกำลังจะยอมรับคำตอบสุดท้ายตามธรรมชาติ
จากผู้ช่วยเท่านั้น ไม่ใช่เส้นทางการยกเลิก `/stop` และจะไม่ทำงาน
เมื่อผู้ใช้ยกเลิกเทิร์น ให้คืน `{ action: "revise", reason }` เพื่อขอให้
ฮาร์เนสทำรอบโมเดลอีกหนึ่งครั้งก่อนสรุปผล, `{ action:
"finalize", reason? }` เพื่อบังคับสรุปผล หรือไม่ต้องคืนผลลัพธ์เพื่อดำเนินการต่อ
Hook `Stop` แบบเนทีฟของ Codex จะถูกส่งต่อเข้า Hook นี้เป็นการตัดสินใจ
`before_agent_finalize` ของ OpenClaw

เมื่อคืนค่า `action: "revise"` Plugin สามารถใส่เมทาดาทา `retry` เพื่อทำให้
รอบโมเดลเพิ่มเติมมีขอบเขตและปลอดภัยต่อการเล่นซ้ำ:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` จะถูกต่อท้ายเหตุผลการแก้ไขที่ส่งไปยังฮาร์เนส
`idempotencyKey` ช่วยให้โฮสต์นับการลองซ้ำสำหรับคำขอ Plugin เดียวกันข้าม
การตัดสินใจสรุปผลที่เทียบเท่ากัน และ `maxAttempts` จำกัดจำนวนรอบเพิ่มเติม
ที่โฮสต์จะอนุญาตก่อนดำเนินการต่อด้วยคำตอบสุดท้ายตามธรรมชาติ

Plugin ที่ไม่ได้รวมมากับระบบซึ่งต้องใช้ Hook การสนทนาดิบ (`before_model_resolve`,
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

Hook ที่แก้ไขพรอมป์และการฉีดข้อมูลแบบคงทนสำหรับเทิร์นถัดไปสามารถปิดใช้งานแยกตาม Plugin
ได้ด้วย `plugins.entries.<id>.hooks.allowPromptInjection=false`

### ส่วนขยายเซสชันและการฉีดข้อมูลเทิร์นถัดไป

Plugin เวิร์กโฟลว์สามารถคงสถานะเซสชันขนาดเล็กที่เข้ากันได้กับ JSON ด้วย
`api.registerSessionExtension(...)` และอัปเดตผ่านเมธอด Gateway
`sessions.pluginPatch` แถวเซสชันจะฉายสถานะส่วนขยายที่ลงทะเบียนไว้ผ่าน
`pluginExtensions` ทำให้ Control UI และไคลเอนต์อื่นเรนเดอร์สถานะที่ Plugin เป็นเจ้าของ
ได้โดยไม่ต้องรู้รายละเอียดภายในของ Plugin

ใช้ `api.enqueueNextTurnInjection(...)` เมื่อ Plugin ต้องการให้บริบทแบบคงทน
ไปถึงเทิร์นโมเดลถัดไปเพียงครั้งเดียว OpenClaw จะระบายการฉีดข้อมูลที่อยู่ในคิวก่อน
Hook พรอมป์ ทิ้งการฉีดข้อมูลที่หมดอายุ และลบรายการซ้ำตาม `idempotencyKey`
ต่อ Plugin นี่คือจุดเชื่อมต่อที่เหมาะสำหรับการดำเนินต่อหลังการอนุมัติ สรุปนโยบาย
ส่วนต่างจากมอนิเตอร์เบื้องหลัง และการดำเนินคำสั่งต่อที่ควรมองเห็นได้
ต่อโมเดลในเทิร์นถัดไป แต่ไม่ควรกลายเป็นข้อความพรอมป์ระบบถาวร

ความหมายของการล้างข้อมูลเป็นส่วนหนึ่งของสัญญา การล้างส่วนขยายเซสชันและ
คอลแบ็กการล้างวงจรชีวิตรันไทม์จะได้รับ `reset`, `delete`, `disable` หรือ
`restart` โฮสต์จะลบสถานะส่วนขยายเซสชันถาวรของ Plugin เจ้าของ
และการฉีดข้อมูลเทิร์นถัดไปที่รอดำเนินการสำหรับ reset/delete/disable; restart จะเก็บ
สถานะเซสชันแบบคงทนไว้ ขณะที่คอลแบ็กการล้างข้อมูลช่วยให้ Plugin ปล่อยงานตัวจัดตารางเวลา
บริบทการรัน และทรัพยากรนอกแบนด์อื่นสำหรับเจเนอเรชันรันไทม์เก่า

## Hook ข้อความ

ใช้ Hook ข้อความสำหรับการกำหนดเส้นทางและนโยบายการส่งมอบระดับช่องทาง:

- `message_received`: สังเกตเนื้อหาขาเข้า ผู้ส่ง `threadId`, `messageId`,
  `senderId`, ความสัมพันธ์กับ run/session ที่เป็นตัวเลือก และเมทาดาทา
- `message_sending`: เขียน `content` ใหม่หรือคืน `{ cancel: true }`
- `message_sent`: สังเกตความสำเร็จหรือความล้มเหลวสุดท้าย

สำหรับคำตอบ TTS แบบเสียงเท่านั้น `content` อาจมีถอดความคำพูดที่ซ่อนอยู่
แม้เมื่อเพย์โหลดช่องทางไม่มีข้อความ/คำบรรยายที่มองเห็นได้ การเขียน
`content` ใหม่นั้นอัปเดตเฉพาะถอดความที่ Hook มองเห็นได้เท่านั้น; จะไม่ถูกเรนเดอร์เป็น
คำบรรยายสื่อ

บริบท Hook ข้อความเปิดเผยฟิลด์ความสัมพันธ์ที่เสถียรเมื่อมี:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, และ `ctx.callDepth` ควรใช้
ฟิลด์ชั้นหนึ่งเหล่านี้ก่อนอ่านเมทาดาทาแบบเก่า

ควรใช้ฟิลด์ `threadId` และ `replyToId` ที่มีชนิดกำกับก่อนใช้เมทาดาทาเฉพาะช่องทาง

กฎการตัดสินใจ:

- `message_sending` ที่มี `cancel: true` ถือเป็นจุดสิ้นสุด
- `message_sending` ที่มี `cancel: false` ถือว่าไม่มีการตัดสินใจ
- `content` ที่ถูกเขียนใหม่จะส่งต่อไปยัง Hook ลำดับความสำคัญต่ำกว่าต่อไป เว้นแต่ Hook ถัดไป
  จะยกเลิกการส่งมอบ
- `message_sending` สามารถคืน `cancelReason` และ `metadata` แบบมีขอบเขตพร้อม
  การยกเลิกได้ API วงจรชีวิตข้อความใหม่เปิดเผยสิ่งนี้เป็นผลลัพธ์การส่งมอบที่ถูกระงับ
  พร้อมเหตุผล `cancelled_by_message_sending_hook`; การส่งมอบโดยตรงแบบเก่า
  ยังคงคืนอาร์เรย์ผลลัพธ์ว่างเพื่อความเข้ากันได้
- `message_sent` ใช้เพื่อสังเกตเท่านั้น ความล้มเหลวของตัวจัดการจะถูกบันทึกและไม่
  เปลี่ยนผลลัพธ์การส่งมอบ

## Hook การติดตั้ง

`before_install` ทำงานหลังการสแกนในตัวสำหรับการติดตั้ง Skills และ Plugin
คืนผลการค้นหาเพิ่มเติมหรือ `{ block: true, blockReason }` เพื่อหยุด
การติดตั้ง

`block: true` ถือเป็นจุดสิ้นสุด `block: false` ถือว่าไม่มีการตัดสินใจ

## วงจรชีวิต Gateway

ใช้ `gateway_start` สำหรับบริการ Plugin ที่ต้องใช้สถานะที่ Gateway เป็นเจ้าของ
บริบทเปิดเผย `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับ
การตรวจสอบและอัปเดต cron ใช้ `gateway_stop` เพื่อล้างทรัพยากรที่ทำงานยาวนาน

อย่าพึ่งพา Hook ภายใน `gateway:startup` สำหรับบริการรันไทม์ที่ Plugin เป็นเจ้าของ

`cron_changed` จะเริ่มทำงานสำหรับเหตุการณ์วงจรชีวิต cron ที่ Gateway เป็นเจ้าของ พร้อมเพย์โหลด
เหตุการณ์แบบมีชนิด ซึ่งครอบคลุมเหตุผล `added`, `updated`, `removed`, `started`, `finished`,
และ `scheduled` เหตุการณ์จะพกสแนปชอต `PluginHookGatewayCronJob`
(รวมถึง `state.nextRunAtMs`, `state.lastRunStatus` และ
`state.lastError` เมื่อมี) พร้อม `PluginHookGatewayCronDeliveryStatus`
เป็น `not-requested` | `delivered` | `not-delivered` | `unknown` เหตุการณ์ที่ถูกลบ
ยังคงพกสแนปชอตงานที่ถูกลบ เพื่อให้ตัวจัดตารางเวลาภายนอกสามารถ
ปรับสถานะให้สอดคล้องกัน ใช้ `ctx.getCron?.()` และ `ctx.config` จากบริบท
รันไทม์เมื่อซิงค์ตัวจัดตารางเวลาปลุกภายนอก และให้ OpenClaw เป็น
แหล่งข้อมูลจริงสำหรับการตรวจสอบกำหนดเวลาและการดำเนินการ

## รายการที่จะเลิกใช้งานเร็วๆ นี้

พื้นผิวบางส่วนที่อยู่ใกล้ Hook ถูกเลิกใช้แล้วแต่ยังรองรับอยู่ ให้ย้าย
ก่อนรุ่นใหญ่ถัดไป:

- **ซองช่องทางข้อความล้วน** ในตัวจัดการ `inbound_claim` และ `message_received`
  อ่าน `BodyForAgent` และบล็อกบริบทผู้ใช้แบบมีโครงสร้าง
  แทนการแยกวิเคราะห์ข้อความซองแบบแบน ดู
  [ซองช่องทางข้อความล้วน → BodyForAgent](/th/plugins/sdk-migration#active-deprecations)
- **`before_agent_start`** ยังคงมีเพื่อความเข้ากันได้ Plugin ใหม่ควรใช้
  `before_model_resolve` และ `before_prompt_build` แทนเฟสที่รวมกัน
- **`onResolution` ใน `before_tool_call`** ตอนนี้ใช้ยูเนียนแบบมีชนิด
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) แทน `string` แบบอิสระ

สำหรับรายการเต็ม - การลงทะเบียนความสามารถหน่วยความจำ โปรไฟล์การคิดของผู้ให้บริการ
ผู้ให้บริการการยืนยันตัวตนภายนอก ชนิดการค้นหาผู้ให้บริการ ตัวเข้าถึงรันไทม์งาน
และการเปลี่ยนชื่อ `command-auth` → `command-status` - ดู
[การย้าย Plugin SDK → รายการเลิกใช้งานที่ยังมีผล](/th/plugins/sdk-migration#active-deprecations)

## ที่เกี่ยวข้อง

- [การย้าย Plugin SDK](/th/plugins/sdk-migration) - รายการเลิกใช้งานที่ยังมีผลและไทม์ไลน์การนำออก
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints)
- [Hook ภายใน](/th/automation/hooks)
- [รายละเอียดภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)
