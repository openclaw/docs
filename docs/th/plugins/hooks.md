---
read_when:
    - คุณกำลังสร้าง Plugin ที่ต้องใช้ before_tool_call, before_agent_reply, ฮุกข้อความ หรือฮุกวงจรชีวิต
    - คุณต้องบล็อก เขียนใหม่ หรือกำหนดให้การเรียกใช้เครื่องมือจาก Plugin ต้องได้รับการอนุมัติ
    - คุณกำลังตัดสินใจระหว่างฮุกภายในกับฮุกของ Plugin
summary: 'Plugin hooks: ดักจับเหตุการณ์วงจรชีวิตของเอเจนต์ เครื่องมือ ข้อความ เซสชัน และ Gateway'
title: ฮุกของ Plugin
x-i18n:
    generated_at: "2026-05-06T09:24:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

ฮุกของ Plugin เป็นจุดขยายแบบ in-process สำหรับ Plugin ของ OpenClaw ใช้ฮุกเหล่านี้
เมื่อ Plugin จำเป็นต้องตรวจสอบหรือเปลี่ยน agent runs, tool calls, message flow,
session lifecycle, subagent routing, installs หรือการเริ่มต้น Gateway

ใช้ [ฮุกภายใน](/th/automation/hooks) แทนเมื่อคุณต้องการสคริปต์ `HOOK.md`
ขนาดเล็กที่ติดตั้งโดยผู้ปฏิบัติการ สำหรับเหตุการณ์คำสั่งและ Gateway เช่น
`/new`, `/reset`, `/stop`, `agent:bootstrap` หรือ `gateway:startup`

## เริ่มต้นอย่างรวดเร็ว

ลงทะเบียนฮุก Plugin แบบมีชนิดด้วย `api.on(...)` จากจุดเข้า Plugin ของคุณ:

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

ตัวจัดการฮุกทำงานตามลำดับทีละรายการโดยเรียง `priority` จากมากไปน้อย ฮุกที่มี priority
เท่ากันจะคงลำดับการลงทะเบียนไว้

`api.on(name, handler, opts?)` รับ:

- `priority` - ลำดับของตัวจัดการ (ค่ามากกว่าจะทำงานก่อน)
- `timeoutMs` - งบเวลาต่อฮุกที่ระบุได้ เมื่อกำหนดไว้ ตัวรันฮุกจะยกเลิกตัวจัดการนั้น
  หลังงบเวลาหมดและทำงานต่อกับตัวถัดไป แทนที่จะปล่อยให้ setup หรือ recall ที่ช้า
  ใช้ timeout ของโมเดลที่ผู้เรียกกำหนดไว้ ละไว้เพื่อใช้ timeout เริ่มต้นสำหรับ observation/decision
  ที่ตัวรันฮุกใช้โดยทั่วไป

ผู้ปฏิบัติการยังสามารถตั้งงบเวลาฮุกได้โดยไม่ต้องแก้โค้ด Plugin:

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
`api.on(..., { timeoutMs })` ที่ผู้เขียน Plugin กำหนดไว้ แต่ละค่าที่กำหนดต้องเป็น
จำนวนเต็มบวกที่ไม่เกิน 600000 มิลลิวินาที ควรใช้การ override รายฮุกสำหรับฮุกที่ทราบว่าช้า
เพื่อไม่ให้ Plugin หนึ่งได้งบเวลาที่ยาวขึ้นทุกที่

แต่ละฮุกจะได้รับ `event.context.pluginConfig` ซึ่งเป็น config ที่ resolve แล้วสำหรับ
Plugin ที่ลงทะเบียนตัวจัดการนั้น ใช้ค่านี้สำหรับการตัดสินใจของฮุกที่ต้องใช้ตัวเลือก Plugin
ปัจจุบัน OpenClaw จะแทรกค่านี้ต่อหนึ่งตัวจัดการโดยไม่กลายพันธุ์ออบเจ็กต์เหตุการณ์ร่วม
ที่ Plugin อื่นเห็น

## แค็ตตาล็อกฮุก

ฮุกถูกจัดกลุ่มตามพื้นผิวที่ฮุกขยาย ชื่อที่เป็น **ตัวหนา** รับผลการตัดสินใจ
(block, cancel, override หรือ require approval); ชื่ออื่นทั้งหมดเป็น observation-only

**Agent turn**

- `before_model_resolve` - override provider หรือ model ก่อนโหลดข้อความ session
- `agent_turn_prepare` - ใช้ queued plugin turn injections และเพิ่ม context รอบเดียวกันก่อน prompt hooks
- `before_prompt_build` - เพิ่ม context แบบไดนามิกหรือข้อความ system-prompt ก่อนการเรียก model
- `before_agent_start` - phase รวมเพื่อความเข้ากันได้เท่านั้น; ควรใช้ฮุกสองตัวด้านบน
- **`before_agent_reply`** - ลัดวงจร model turn ด้วย reply สังเคราะห์หรือความเงียบ
- **`before_agent_finalize`** - ตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอ model pass เพิ่มอีกหนึ่งครั้ง
- `agent_end` - สังเกตข้อความสุดท้าย สถานะความสำเร็จ และระยะเวลาการรัน
- `heartbeat_prompt_contribution` - เพิ่ม context เฉพาะ Heartbeat สำหรับ Plugin ตรวจสอบเบื้องหลังและ lifecycle

**การสังเกตการสนทนา**

- `model_call_started` / `model_call_ended` - สังเกต metadata การเรียก provider/model ที่ sanitize แล้ว, timing, outcome และ hash ของ request-id แบบจำกัด โดยไม่มีเนื้อหา prompt หรือ response
- `llm_input` - สังเกต input ของ provider (system prompt, prompt, history)
- `llm_output` - สังเกต output ของ provider

**เครื่องมือ**

- **`before_tool_call`** - เขียน params ของเครื่องมือใหม่, block การทำงาน หรือ require approval
- `after_tool_call` - สังเกตผลลัพธ์เครื่องมือ ข้อผิดพลาด และระยะเวลา
- **`tool_result_persist`** - เขียนข้อความ assistant ที่สร้างจากผลลัพธ์เครื่องมือใหม่
- **`before_message_write`** - ตรวจสอบหรือ block การเขียนข้อความที่กำลังดำเนินอยู่ (พบน้อย)

**ข้อความและการส่งมอบ**

- **`inbound_claim`** - claim ข้อความขาเข้าก่อน agent routing (synthetic replies)
- `message_received` - สังเกตเนื้อหาขาเข้า ผู้ส่ง เธรด และ metadata
- **`message_sending`** - เขียนเนื้อหาขาออกใหม่หรือยกเลิกการส่ง
- `message_sent` - สังเกตการส่งขาออกสำเร็จหรือล้มเหลว
- **`before_dispatch`** - ตรวจสอบหรือเขียน outbound dispatch ใหม่ก่อนส่งต่อให้ channel
- **`reply_dispatch`** - มีส่วนร่วมใน pipeline การ dispatch reply ขั้นสุดท้าย

**Sessions และ Compaction**

- `session_start` / `session_end` - ติดตามขอบเขต lifecycle ของ session
- `before_compaction` / `after_compaction` - สังเกตหรือ annotate รอบ Compaction
- `before_reset` - สังเกตเหตุการณ์ session-reset (`/reset`, programmatic resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - ประสาน subagent routing และการส่งมอบ completion

**Lifecycle**

- `gateway_start` / `gateway_stop` - เริ่มหรือหยุดบริการที่ Plugin เป็นเจ้าของพร้อมกับ Gateway
- `cron_changed` - สังเกตการเปลี่ยนแปลง lifecycle ของ Cron ที่ Gateway เป็นเจ้าของ (added, updated, removed, started, finished, scheduled)
- **`before_install`** - ตรวจสอบการสแกนการติดตั้ง Skills หรือ Plugin และ block ได้ตามต้องการ

## นโยบายการเรียกเครื่องมือ

`before_tool_call` ได้รับ:

- `event.toolName`
- `event.params`
- `event.runId` ที่ระบุได้
- `event.toolCallId` ที่ระบุได้
- ฟิลด์ context เช่น `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ตั้งค่าในการรันที่ขับเคลื่อนด้วย Cron) และ diagnostic `ctx.trace`

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

- `block: true` เป็น terminal และข้ามตัวจัดการที่ priority ต่ำกว่า
- `block: false` ถือว่าไม่มีการตัดสินใจ
- `params` เขียนพารามิเตอร์เครื่องมือใหม่สำหรับการทำงาน
- `requireApproval` หยุด agent run ชั่วคราวและถามผู้ใช้ผ่านการอนุมัติของ Plugin
  คำสั่ง `/approve` สามารถอนุมัติได้ทั้ง exec และการอนุมัติของ Plugin
- `block: true` ที่ priority ต่ำกว่ายังสามารถ block ได้หลังจากฮุก priority สูงกว่า
  ขอการอนุมัติแล้ว
- `onResolution` ได้รับการตัดสินใจอนุมัติที่ resolve แล้ว - `allow-once`,
  `allow-always`, `deny`, `timeout` หรือ `cancelled`

Plugin ที่มาพร้อมระบบซึ่งต้องใช้นโยบายระดับ host สามารถลงทะเบียน trusted tool policies
ด้วย `api.registerTrustedToolPolicy(...)` ได้ นโยบายเหล่านี้ทำงานก่อนฮุก
`before_tool_call` ทั่วไปและก่อนการตัดสินใจของ Plugin ภายนอก ใช้เฉพาะกับ gate
ที่ host เชื่อถือ เช่น workspace policy, budget enforcement หรือ
reserved workflow safety เท่านั้น Plugin ภายนอกควรใช้ฮุก `before_tool_call`
ปกติ

### การ persist ผลลัพธ์เครื่องมือ

ผลลัพธ์เครื่องมือสามารถมี `details` แบบมีโครงสร้างสำหรับการเรนเดอร์ UI, diagnostics,
media routing หรือ metadata ที่ Plugin เป็นเจ้าของ ถือว่า `details` เป็น runtime metadata
ไม่ใช่เนื้อหา prompt:

- OpenClaw จะตัด `toolResult.details` ออกก่อน provider replay และ input ของ Compaction
  เพื่อไม่ให้ metadata กลายเป็น context ของ model
- รายการ session ที่ persist แล้วจะเก็บเฉพาะ `details` แบบจำกัด รายละเอียดที่ใหญ่เกินไปจะถูก
  แทนที่ด้วยสรุปแบบกะทัดรัดและ `persistedDetailsTruncated: true`
- `tool_result_persist` และ `before_message_write` ทำงานก่อนขีดจำกัดการ persist ขั้นสุดท้าย
  ฮุกยังควรทำให้ `details` ที่ return มีขนาดเล็ก และหลีกเลี่ยงการวางข้อความที่เกี่ยวข้องกับ prompt
  ไว้เฉพาะใน `details`; ให้ใส่ output ของเครื่องมือที่ model มองเห็นได้ใน `content`

## ฮุก Prompt และ model

ใช้ฮุกเฉพาะ phase สำหรับ Plugin ใหม่:

- `before_model_resolve`: ได้รับเฉพาะ prompt ปัจจุบันและ metadata ของ attachment
  return `providerOverride` หรือ `modelOverride`
- `agent_turn_prepare`: ได้รับ prompt ปัจจุบัน, ข้อความ session ที่เตรียมแล้ว,
  และ queued injections แบบ exactly-once ใด ๆ ที่ drained สำหรับ session นี้ return
  `prependContext` หรือ `appendContext`
- `before_prompt_build`: ได้รับ prompt ปัจจุบันและข้อความ session
  return `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` หรือ `appendSystemContext`
- `heartbeat_prompt_contribution`: ทำงานเฉพาะกับ Heartbeat turns และ return
  `prependContext` หรือ `appendContext` มีไว้สำหรับ background monitors
  ที่ต้องสรุปสถานะปัจจุบันโดยไม่เปลี่ยน turns ที่ผู้ใช้เริ่ม

`before_agent_start` ยังมีอยู่เพื่อความเข้ากันได้ ควรใช้ฮุกที่ชัดเจนด้านบน
เพื่อให้ Plugin ของคุณไม่ขึ้นกับ phase รวมแบบ legacy

`before_agent_start` และ `agent_end` มี `event.runId` เมื่อ OpenClaw สามารถ
ระบุการรันที่ใช้งานอยู่ได้ ค่าเดียวกันยังมีใน `ctx.runId` ด้วย
การรันที่ขับเคลื่อนด้วย Cron ยังเปิดเผย `ctx.jobId` (id ของ cron job ต้นทาง) เพื่อให้
ฮุก Plugin สามารถจำกัดขอบเขต metrics, side effects หรือ state ไว้กับ scheduled job
เฉพาะรายการได้

สำหรับการรันที่มาจาก channel, `ctx.messageProvider` คือพื้นผิว provider เช่น
`discord` หรือ `telegram` ขณะที่ `ctx.channelId` คือ identifier ของเป้าหมายการสนทนา
เมื่อ OpenClaw สามารถอนุมานได้จาก session key หรือ delivery metadata

`agent_end` เป็นฮุก observation และทำงานแบบ fire-and-forget หลัง turn
ตัวรันฮุกใช้ timeout 30 วินาทีเพื่อไม่ให้ Plugin หรือ embedding endpoint
ที่ค้างอยู่ปล่อยให้ promise ของฮุก pending ตลอดไป timeout จะถูกบันทึก log และ
OpenClaw จะทำงานต่อ; timeout จะไม่ยกเลิกงานเครือข่ายที่ Plugin เป็นเจ้าของ
เว้นแต่ Plugin จะใช้ abort signal ของตัวเองด้วย

ใช้ `model_call_started` และ `model_call_ended` สำหรับ telemetry ของการเรียก provider
ที่ไม่ควรได้รับ raw prompts, history, responses, headers, request bodies หรือ
provider request IDs ฮุกเหล่านี้มี metadata ที่เสถียร เช่น `runId`, `callId`,
`provider`, `model`, `api`/`transport` ที่ระบุได้, `durationMs`/`outcome` ขั้นสุดท้าย
และ `upstreamRequestIdHash` เมื่อ OpenClaw สามารถ derive hash ของ provider request-id
แบบจำกัดได้

`before_agent_finalize` ทำงานเฉพาะเมื่อ harness กำลังจะยอมรับคำตอบสุดท้ายตามธรรมชาติ
ของ assistant ไม่ใช่ path การยกเลิก `/stop` และไม่ทำงานเมื่อผู้ใช้ abort turn
return `{ action: "revise", reason }` เพื่อขอให้ harness ทำ model pass อีกหนึ่งครั้ง
ก่อน finalization, `{ action:
"finalize", reason? }` เพื่อบังคับ finalization หรือไม่ต้องส่งผลลัพธ์เพื่อดำเนินการต่อ
ฮุก `Stop` แบบ native ของ Codex จะถูก relay เข้าสู่ฮุกนี้ในฐานะการตัดสินใจ
`before_agent_finalize` ของ OpenClaw

เมื่อ return `action: "revise"` Plugin สามารถใส่ metadata `retry` เพื่อทำให้
model pass เพิ่มเติมมีขอบเขตและ replay-safe:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` จะถูกต่อท้าย reason การ revision ที่ส่งไปยัง harness
`idempotencyKey` ช่วยให้ host นับ retry สำหรับคำขอ Plugin เดียวกันข้าม
การตัดสินใจ finalize ที่เทียบเท่ากัน และ `maxAttempts` จำกัดจำนวน pass เพิ่มเติม
ที่ host จะอนุญาตก่อนดำเนินการต่อด้วยคำตอบสุดท้ายตามธรรมชาติ

Plugin ที่ไม่ได้มาพร้อมระบบซึ่งต้องใช้ `llm_input`, `llm_output`,
`before_agent_finalize` หรือ `agent_end` ต้องตั้งค่า:

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

ฮุกที่กลายพันธุ์ prompt และ durable next-turn injections สามารถปิดเป็นราย Plugin
ด้วย `plugins.entries.<id>.hooks.allowPromptInjection=false`

### Session extensions และ next-turn injections

Plugin เวิร์กโฟลว์สามารถคงสถานะเซสชันขนาดเล็กที่เข้ากันได้กับ JSON ด้วย
`api.registerSessionExtension(...)` และอัปเดตผ่านเมธอด
`sessions.pluginPatch` ของ Gateway ได้ แถวเซสชันจะฉายสถานะส่วนขยายที่ลงทะเบียนไว้
ผ่าน `pluginExtensions` ทำให้ Control UI และไคลเอนต์อื่นๆ แสดงสถานะที่
Plugin เป็นเจ้าของได้โดยไม่ต้องรู้รายละเอียดภายในของ Plugin

ใช้ `api.enqueueNextTurnInjection(...)` เมื่อ Plugin ต้องการบริบทที่คงทนเพื่อ
ไปถึงรอบโมเดลถัดไปเพียงครั้งเดียวอย่างแม่นยำ OpenClaw จะระบาย injection ที่อยู่ในคิวก่อน
prompt hooks, ทิ้ง injection ที่หมดอายุแล้ว, และลบรายการซ้ำด้วย `idempotencyKey`
ต่อ Plugin นี่คือจุดเชื่อมต่อที่เหมาะสำหรับการดำเนินการต่อหลังการอนุมัติ, สรุปนโยบาย,
เดลตาของมอนิเตอร์พื้นหลัง, และการดำเนินคำสั่งต่อเนื่องที่ควรมองเห็นได้โดย
โมเดลในรอบถัดไป แต่ไม่ควรกลายเป็นข้อความ system prompt แบบถาวร

ความหมายของการล้างข้อมูลเป็นส่วนหนึ่งของสัญญา callback สำหรับการล้างข้อมูลของส่วนขยายเซสชันและ
วงจรชีวิต runtime จะได้รับ `reset`, `delete`, `disable`, หรือ
`restart` โฮสต์จะลบสถานะส่วนขยายเซสชันถาวรของ Plugin เจ้าของ
และ next-turn injections ที่ค้างอยู่สำหรับ reset/delete/disable; restart จะเก็บ
สถานะเซสชันที่คงทนไว้ ขณะที่ callback การล้างข้อมูลเปิดให้ Plugin ปล่อย
งาน scheduler, บริบทการรัน, และทรัพยากรนอกแบนด์อื่นๆ สำหรับรุ่น runtime เดิม

## ฮุกข้อความ

ใช้ฮุกข้อความสำหรับการกำหนดเส้นทางและนโยบายการส่งมอบระดับช่องทาง:

- `message_received`: สังเกตเนื้อหาขาเข้า, ผู้ส่ง, `threadId`, `messageId`,
  `senderId`, ความสัมพันธ์ run/session แบบไม่บังคับ, และเมตาดาตา
- `message_sending`: เขียน `content` ใหม่หรือคืนค่า `{ cancel: true }`
- `message_sent`: สังเกตความสำเร็จหรือความล้มเหลวสุดท้าย

สำหรับการตอบกลับ TTS แบบเสียงเท่านั้น `content` อาจมีถอดเสียงพูดที่ซ่อนอยู่
แม้เมื่อ payload ของช่องทางไม่มีข้อความ/คำบรรยายที่มองเห็นได้ การเขียน
`content` นั้นใหม่จะอัปเดตเฉพาะถอดเสียงที่ฮุกมองเห็นได้เท่านั้น; จะไม่ถูกแสดงเป็น
คำบรรยายสื่อ

บริบทของฮุกข้อความเปิดเผยฟิลด์ความสัมพันธ์ที่เสถียรเมื่อมีให้ใช้:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, และ `ctx.callDepth` ควรใช้
ฟิลด์ชั้นหนึ่งเหล่านี้ก่อนอ่านเมตาดาตาแบบเดิม

ควรใช้ฟิลด์ `threadId` และ `replyToId` ที่มีชนิดข้อมูลก่อนใช้เมตาดาตาเฉพาะช่องทาง

กฎการตัดสินใจ:

- `message_sending` ที่มี `cancel: true` เป็นการตัดสินใจสุดท้าย
- `message_sending` ที่มี `cancel: false` ถือว่าไม่มีการตัดสินใจ
- `content` ที่ถูกเขียนใหม่จะดำเนินต่อไปยังฮุกที่มีลำดับความสำคัญต่ำกว่า เว้นแต่ฮุกถัดไป
  จะยกเลิกการส่งมอบ

## ฮุกการติดตั้ง

`before_install` ทำงานหลังการสแกนในตัวสำหรับการติดตั้ง skill และ Plugin
คืนผลการค้นพบเพิ่มเติมหรือ `{ block: true, blockReason }` เพื่อหยุด
การติดตั้ง

`block: true` เป็นการตัดสินใจสุดท้าย `block: false` ถือว่าไม่มีการตัดสินใจ

## วงจรชีวิต Gateway

ใช้ `gateway_start` สำหรับบริการ Plugin ที่ต้องการสถานะที่ Gateway เป็นเจ้าของ บริบท
เปิดเผย `ctx.config`, `ctx.workspaceDir`, และ `ctx.getCron?.()` สำหรับ
การตรวจสอบและอัปเดต cron ใช้ `gateway_stop` เพื่อล้าง
ทรัพยากรที่ทำงานยาวนาน

อย่าพึ่งพาฮุกภายใน `gateway:startup` สำหรับบริการ runtime ที่ Plugin เป็นเจ้าของ

`cron_changed` จะเกิดขึ้นสำหรับเหตุการณ์วงจรชีวิต cron ที่ gateway เป็นเจ้าของ โดยมี
payload เหตุการณ์แบบมีชนิดข้อมูลครอบคลุมเหตุผล `added`, `updated`, `removed`, `started`, `finished`,
และ `scheduled` เหตุการณ์จะพก snapshot ของ `PluginHookGatewayCronJob`
(รวมถึง `state.nextRunAtMs`, `state.lastRunStatus`, และ
`state.lastError` เมื่อมี) พร้อมกับ `PluginHookGatewayCronDeliveryStatus`
ของ `not-requested` | `delivered` | `not-delivered` | `unknown` เหตุการณ์ที่ถูกลบแล้ว
ยังคงพก snapshot ของงานที่ถูกลบเพื่อให้ scheduler ภายนอกสามารถ
ปรับสถานะให้สอดคล้องกันได้ ใช้ `ctx.getCron?.()` และ `ctx.config` จากบริบท runtime
เมื่อซิงค์ wake schedulers ภายนอก และให้ OpenClaw เป็น
แหล่งข้อมูลจริงสำหรับการตรวจสอบกำหนดเวลาและการดำเนินการ

## การเลิกใช้งานที่กำลังจะมาถึง

พื้นผิวบางส่วนที่อยู่ใกล้กับฮุกถูกเลิกใช้แล้วแต่ยังรองรับอยู่ ให้ย้าย
ก่อนรุ่น major ถัดไป:

- **ซองช่องทางข้อความล้วน** ใน handler `inbound_claim` และ `message_received`
  อ่าน `BodyForAgent` และบล็อกบริบทผู้ใช้แบบมีโครงสร้าง
  แทนการแยกวิเคราะห์ข้อความซองแบบแบน ดู
  [ซองช่องทางข้อความล้วน → BodyForAgent](/th/plugins/sdk-migration#active-deprecations)
- **`before_agent_start`** ยังคงอยู่เพื่อความเข้ากันได้ Plugin ใหม่ควรใช้
  `before_model_resolve` และ `before_prompt_build` แทนเฟสแบบรวม
- **`onResolution` ใน `before_tool_call`** ตอนนี้ใช้ union
  `PluginApprovalResolution` แบบมีชนิดข้อมูล (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) แทน `string` แบบอิสระ

สำหรับรายการทั้งหมด - การลงทะเบียนความสามารถของหน่วยความจำ, โปรไฟล์ thinking ของ provider,
provider การยืนยันตัวตนภายนอก, ชนิดข้อมูลการค้นหา provider, accessor ของ runtime งาน,
และการเปลี่ยนชื่อ `command-auth` → `command-status` - ดู
[การย้าย Plugin SDK → การเลิกใช้งานที่ใช้งานอยู่](/th/plugins/sdk-migration#active-deprecations)

## ที่เกี่ยวข้อง

- [การย้าย Plugin SDK](/th/plugins/sdk-migration) - การเลิกใช้งานที่ใช้งานอยู่และไทม์ไลน์การลบออก
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- [ฮุกภายใน](/th/automation/hooks)
- [รายละเอียดภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)
