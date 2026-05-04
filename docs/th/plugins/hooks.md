---
read_when:
    - คุณกำลังสร้าง Plugin ที่ต้องใช้ before_tool_call, before_agent_reply, ฮุกข้อความ หรือฮุกวงจรชีวิต
    - คุณต้องบล็อก เขียนใหม่ หรือกำหนดให้ต้องได้รับการอนุมัติสำหรับการเรียกใช้เครื่องมือจาก Plugin
    - คุณกำลังตัดสินใจเลือกระหว่างฮุกภายในกับฮุกของ Plugin
summary: 'ฮุกของ Plugin: ดักจับเหตุการณ์วงจรชีวิตของเอเจนต์ เครื่องมือ ข้อความ เซสชัน และ Gateway'
title: ฮุกของ Plugin
x-i18n:
    generated_at: "2026-05-04T18:24:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37c7273036463c87e478db5678822b676c89447caee65f2f3f47a45194d1e37b
    source_path: plugins/hooks.md
    workflow: 16
---

ฮุกของ Plugin เป็นจุดขยายในโปรเซสสำหรับ Plugin ของ OpenClaw ใช้ฮุกเหล่านี้
เมื่อ Plugin ต้องตรวจสอบหรือเปลี่ยนการรันของเอเจนต์ การเรียกเครื่องมือ โฟลว์ข้อความ
วงจรชีวิตเซสชัน การกำหนดเส้นทาง subagent การติดตั้ง หรือการเริ่มต้น Gateway

ให้ใช้ [ฮุกภายใน](/th/automation/hooks) แทน เมื่อคุณต้องการสคริปต์ `HOOK.md`
ขนาดเล็กที่ติดตั้งโดยผู้ปฏิบัติงานสำหรับเหตุการณ์คำสั่งและ Gateway เช่น
`/new`, `/reset`, `/stop`, `agent:bootstrap` หรือ `gateway:startup`

## เริ่มต้นอย่างรวดเร็ว

ลงทะเบียนฮุก Plugin แบบมีชนิดด้วย `api.on(...)` จาก entry ของ Plugin ของคุณ:

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

ตัวจัดการฮุกจะรันตามลำดับทีละตัวโดยเรียง `priority` จากมากไปน้อย ฮุกที่มี priority เท่ากัน
จะคงลำดับการลงทะเบียนไว้

`api.on(name, handler, opts?)` รับค่า:

- `priority` — การจัดลำดับตัวจัดการ (ค่าสูงกว่าจะรันก่อน)
- `timeoutMs` — งบเวลาต่อฮุกที่เป็นตัวเลือก เมื่อตั้งค่าไว้ ตัวรันฮุกจะยกเลิกตัวจัดการนั้น
  หลังงบเวลาหมดลงและดำเนินการต่อกับตัวถัดไป แทนที่จะปล่อยให้งานตั้งค่าหรือเรียกคืนข้อมูลที่ช้า
  ใช้เวลา timeout ของโมเดลที่ผู้เรียกกำหนดไว้ เว้นค่าไว้เพื่อใช้ timeout เริ่มต้นสำหรับการสังเกต/การตัดสินใจ
  ที่ตัวรันฮุกใช้อย่างทั่วไป

ผู้ปฏิบัติงานยังสามารถตั้งงบเวลาของฮุกได้โดยไม่ต้องแพตช์โค้ด Plugin:

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
`api.on(..., { timeoutMs })` ที่ผู้เขียน Plugin ระบุ ค่าแต่ละรายการที่กำหนดต้องเป็น
จำนวนเต็มบวกไม่เกิน 600000 มิลลิวินาที ควรใช้การ override ต่อฮุกสำหรับฮุกที่ทราบว่าช้า
เพื่อไม่ให้ Plugin หนึ่งได้งบเวลาที่ยาวขึ้นในทุกที่

แต่ละฮุกจะได้รับ `event.context.pluginConfig` ซึ่งเป็น config ที่ resolve แล้วสำหรับ
Plugin ที่ลงทะเบียนตัวจัดการนั้น ใช้ค่านี้สำหรับการตัดสินใจของฮุกที่ต้องใช้ตัวเลือก Plugin
ปัจจุบัน OpenClaw จะ inject ค่านี้ต่อหนึ่งตัวจัดการโดยไม่ mutate ออบเจ็กต์เหตุการณ์ร่วม
ที่ Plugin อื่นเห็น

## แค็ตตาล็อกฮุก

ฮุกถูกจัดกลุ่มตามพื้นผิวที่ฮุกขยาย ชื่อที่เป็น **ตัวหนา** รับผลลัพธ์การตัดสินใจได้
(บล็อก ยกเลิก override หรือต้องขออนุมัติ) ส่วนที่เหลือทั้งหมดเป็นแบบสังเกตเท่านั้น

**เทิร์นของเอเจนต์**

- `before_model_resolve` — override provider หรือ model ก่อนโหลดข้อความเซสชัน
- `agent_turn_prepare` — ใช้การ inject เทิร์นของ Plugin ที่เข้าคิวไว้และเพิ่มบริบทในเทิร์นเดียวกันก่อนฮุก prompt
- `before_prompt_build` — เพิ่มบริบทแบบไดนามิกหรือข้อความ system-prompt ก่อนเรียกโมเดล
- `before_agent_start` — เฟสรวมเพื่อความเข้ากันได้เท่านั้น ควรใช้สองฮุกข้างต้น
- **`before_agent_reply`** — ตัดเทิร์นของโมเดลให้จบก่อนด้วย reply สังเคราะห์หรือความเงียบ
- **`before_agent_finalize`** — ตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้โมเดลรันอีกหนึ่งรอบ
- `agent_end` — สังเกตข้อความสุดท้าย สถานะความสำเร็จ และระยะเวลาการรัน
- `heartbeat_prompt_contribution` — เพิ่มบริบทเฉพาะ Heartbeat สำหรับ Plugin ตรวจสอบเบื้องหลังและวงจรชีวิต

**การสังเกตบทสนทนา**

- `model_call_started` / `model_call_ended` — สังเกตเมตาดาต้าการเรียก provider/model ที่ sanitize แล้ว เวลา ผลลัพธ์ และแฮช request-id แบบจำกัด โดยไม่มีเนื้อหา prompt หรือ response
- `llm_input` — สังเกต input ของ provider (system prompt, prompt, history)
- `llm_output` — สังเกต output ของ provider

**เครื่องมือ**

- **`before_tool_call`** — เขียน params ของเครื่องมือใหม่ บล็อกการทำงาน หรือขออนุมัติ
- `after_tool_call` — สังเกตผลลัพธ์เครื่องมือ ข้อผิดพลาด และระยะเวลา
- **`tool_result_persist`** — เขียนข้อความ assistant ที่สร้างจากผลลัพธ์เครื่องมือใหม่
- **`before_message_write`** — ตรวจสอบหรือบล็อกการเขียนข้อความที่กำลังดำเนินอยู่ (พบไม่บ่อย)

**ข้อความและการส่งมอบ**

- **`inbound_claim`** — claim ข้อความขาเข้าก่อนการกำหนดเส้นทางเอเจนต์ (reply สังเคราะห์)
- `message_received` — สังเกตเนื้อหาขาเข้า ผู้ส่ง เธรด และเมตาดาต้า
- **`message_sending`** — เขียนเนื้อหาขาออกใหม่หรือยกเลิกการส่งมอบ
- `message_sent` — สังเกตความสำเร็จหรือความล้มเหลวของการส่งมอบขาออก
- **`before_dispatch`** — ตรวจสอบหรือเขียน dispatch ขาออกใหม่ก่อนส่งต่อให้ channel
- **`reply_dispatch`** — เข้าร่วม pipeline การ dispatch reply ขั้นสุดท้าย

**เซสชันและ Compaction**

- `session_start` / `session_end` — ติดตามขอบเขตวงจรชีวิตเซสชัน
- `before_compaction` / `after_compaction` — สังเกตหรือใส่ annotation ให้รอบ Compaction
- `before_reset` — สังเกตเหตุการณ์รีเซ็ตเซสชัน (`/reset`, การรีเซ็ตผ่านโปรแกรม)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — ประสานการกำหนดเส้นทาง subagent และการส่งมอบเมื่อเสร็จสิ้น

**วงจรชีวิต**

- `gateway_start` / `gateway_stop` — เริ่มหรือหยุดบริการที่ Plugin เป็นเจ้าของพร้อมกับ Gateway
- `cron_changed` — สังเกตการเปลี่ยนแปลงวงจรชีวิต Cron ที่ Gateway เป็นเจ้าของ (เพิ่ม อัปเดต ลบ เริ่ม เสร็จสิ้น ตั้งเวลา)
- **`before_install`** — ตรวจสอบการสแกนติดตั้ง Skills หรือ Plugin และเลือกบล็อกได้

## นโยบายการเรียกเครื่องมือ

`before_tool_call` ได้รับ:

- `event.toolName`
- `event.params`
- `event.runId` ที่เป็นตัวเลือก
- `event.toolCallId` ที่เป็นตัวเลือก
- ฟิลด์บริบท เช่น `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ตั้งค่าในการรันที่ขับเคลื่อนด้วย Cron) และ `ctx.trace` สำหรับวินิจฉัย

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

- `block: true` เป็นสถานะสุดท้ายและข้ามตัวจัดการที่มี priority ต่ำกว่า
- `block: false` จะถือว่าไม่มีการตัดสินใจ
- `params` เขียนพารามิเตอร์เครื่องมือใหม่สำหรับการดำเนินการ
- `requireApproval` หยุดการรันเอเจนต์ชั่วคราวและถามผู้ใช้ผ่านการอนุมัติของ Plugin
  คำสั่ง `/approve` สามารถอนุมัติได้ทั้ง exec และการอนุมัติของ Plugin
- `block: true` ที่มี priority ต่ำกว่ายังสามารถบล็อกได้หลังจากฮุกที่มี priority สูงกว่าขออนุมัติแล้ว
- `onResolution` ได้รับการตัดสินใจอนุมัติที่ resolve แล้ว ได้แก่ `allow-once`,
  `allow-always`, `deny`, `timeout` หรือ `cancelled`

Plugin ที่ bundled ซึ่งต้องใช้นโยบายระดับโฮสต์สามารถลงทะเบียนนโยบายเครื่องมือที่เชื่อถือได้
ด้วย `api.registerTrustedToolPolicy(...)` นโยบายเหล่านี้รันก่อนฮุก
`before_tool_call` ปกติและก่อนการตัดสินใจของ Plugin ภายนอก ใช้เฉพาะกับ gate ที่โฮสต์เชื่อถือ
เช่น นโยบาย workspace การบังคับใช้งบประมาณ หรือความปลอดภัยของ workflow ที่สงวนไว้
Plugin ภายนอกควรใช้ฮุก `before_tool_call` ปกติ

### การ persist ผลลัพธ์เครื่องมือ

ผลลัพธ์เครื่องมือสามารถมี `details` แบบมีโครงสร้างสำหรับการแสดงผลใน UI การวินิจฉัย
การกำหนดเส้นทางสื่อ หรือเมตาดาต้าที่ Plugin เป็นเจ้าของ ให้ถือว่า `details` เป็นเมตาดาต้า runtime
ไม่ใช่เนื้อหา prompt:

- OpenClaw จะลบ `toolResult.details` ก่อน replay ไปยัง provider และก่อน input ของ Compaction
  เพื่อไม่ให้เมตาดาต้ากลายเป็นบริบทของโมเดล
- รายการเซสชันที่ persist แล้วจะเก็บเฉพาะ `details` แบบจำกัด ข้อมูล details ที่ใหญ่เกินไปจะถูก
  แทนที่ด้วยสรุปขนาดกะทัดรัดและ `persistedDetailsTruncated: true`
- `tool_result_persist` และ `before_message_write` รันก่อน cap การ persist ขั้นสุดท้าย
  ฮุกยังควรรักษา `details` ที่ return ให้มีขนาดเล็กและหลีกเลี่ยงการวางข้อความที่เกี่ยวข้องกับ prompt
  ไว้เฉพาะใน `details`; ให้วาง output ของเครื่องมือที่โมเดลมองเห็นได้ไว้ใน `content`

## ฮุก prompt และโมเดล

ใช้ฮุกเฉพาะเฟสสำหรับ Plugin ใหม่:

- `before_model_resolve`: รับเฉพาะ prompt ปัจจุบันและเมตาดาต้า attachment
  return `providerOverride` หรือ `modelOverride`
- `agent_turn_prepare`: รับ prompt ปัจจุบัน ข้อความเซสชันที่เตรียมไว้
  และการ inject ที่เข้าคิวแบบใช้ครั้งเดียวพอดีซึ่งถูก drain สำหรับเซสชันนี้ return
  `prependContext` หรือ `appendContext`
- `before_prompt_build`: รับ prompt ปัจจุบันและข้อความเซสชัน
  return `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` หรือ `appendSystemContext`
- `heartbeat_prompt_contribution`: รันเฉพาะเทิร์น Heartbeat และ return
  `prependContext` หรือ `appendContext` มีไว้สำหรับตัวตรวจสอบเบื้องหลัง
  ที่ต้องสรุปสถานะปัจจุบันโดยไม่เปลี่ยนเทิร์นที่ผู้ใช้เริ่มต้น

`before_agent_start` ยังคงอยู่เพื่อความเข้ากันได้ ควรใช้ฮุกแบบชัดเจนข้างต้น
เพื่อให้ Plugin ของคุณไม่ต้องพึ่งพาเฟสรวมแบบ legacy

`before_agent_start` และ `agent_end` จะมี `event.runId` เมื่อ OpenClaw สามารถ
ระบุการรันที่ active ได้ ค่าเดียวกันยังมีใน `ctx.runId` ด้วย
การรันที่ขับเคลื่อนด้วย Cron ยังเปิดเผย `ctx.jobId` (id ของงาน Cron ต้นทาง) เพื่อให้
ฮุก Plugin สามารถจำกัด scope ของ metrics, side effects หรือ state ไปยังงานที่ตั้งเวลาไว้เฉพาะได้

สำหรับการรันที่มีต้นทางจาก channel, `ctx.messageProvider` คือพื้นผิว provider เช่น
`discord` หรือ `telegram` ขณะที่ `ctx.channelId` คือ identifier เป้าหมายของบทสนทนา
เมื่อ OpenClaw สามารถ derive ได้จาก session key หรือเมตาดาต้าการส่งมอบ

`agent_end` เป็นฮุกสังเกตและรันแบบ fire-and-forget หลังจบเทิร์น
ตัวรันฮุกใช้ timeout 30 วินาที เพื่อไม่ให้ Plugin หรือ endpoint สำหรับ embedding ที่ค้างอยู่
ปล่อยให้ promise ของฮุก pending ตลอดไป timeout จะถูกบันทึกใน log และ
OpenClaw จะดำเนินการต่อ โดยจะไม่ยกเลิกงาน network ที่ Plugin เป็นเจ้าของ เว้นแต่
Plugin จะใช้ abort signal ของตัวเองด้วย

ใช้ `model_call_started` และ `model_call_ended` สำหรับ telemetry การเรียก provider
ที่ไม่ควรได้รับ prompt ดิบ history response headers request bodies หรือ request ID ของ provider
ฮุกเหล่านี้รวมเมตาดาต้าที่เสถียร เช่น `runId`, `callId`, `provider`, `model`,
`api`/`transport` ที่เป็นตัวเลือก, `durationMs`/`outcome` ขั้นสุดท้าย และ
`upstreamRequestIdHash` เมื่อ OpenClaw สามารถ derive แฮช request-id ของ provider
แบบจำกัดได้

`before_agent_finalize` รันเฉพาะเมื่อ harness กำลังจะยอมรับคำตอบสุดท้ายของ assistant
ตามธรรมชาติ ไม่ใช่เส้นทางการยกเลิก `/stop` และไม่รันเมื่อผู้ใช้ abort เทิร์น
return `{ action: "revise", reason }` เพื่อขอให้ harness รันโมเดลอีกหนึ่งรอบก่อน finalize,
`{ action: "finalize", reason? }` เพื่อบังคับ finalize หรือเว้นผลลัพธ์ไว้เพื่อดำเนินการต่อ
ฮุก `Stop` แบบ native ของ Codex จะถูก relay เข้าสู่ฮุกนี้เป็นการตัดสินใจ
`before_agent_finalize` ของ OpenClaw

เมื่อ return `action: "revise"` Plugin สามารถใส่เมตาดาต้า `retry` เพื่อทำให้
การรันโมเดลเพิ่มเติมมีขอบเขตและ replay ได้อย่างปลอดภัย:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` จะถูกต่อท้าย reason การ revise ที่ส่งไปยัง harness
`idempotencyKey` ให้โฮสต์นับ retry สำหรับคำขอ Plugin เดียวกันข้ามการตัดสินใจ finalize
ที่เทียบเท่ากันได้ และ `maxAttempts` จำกัดจำนวนรอบเพิ่มเติมที่โฮสต์จะอนุญาต
ก่อนดำเนินการต่อด้วยคำตอบสุดท้ายตามธรรมชาติ

Plugin ที่ไม่ได้ bundled ซึ่งต้องใช้ `llm_input`, `llm_output`,
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

ฮุกที่ mutate prompt และการ inject เทิร์นถัดไปแบบ durable สามารถปิดใช้งานต่อ Plugin ได้
ด้วย `plugins.entries.<id>.hooks.allowPromptInjection=false`

### ส่วนขยายเซสชันและการ inject เทิร์นถัดไป

Plugin สำหรับเวิร์กโฟลว์สามารถคงสถานะเซสชันขนาดเล็กที่เข้ากันได้กับ JSON ด้วย
`api.registerSessionExtension(...)` และอัปเดตผ่านเมธอด
`sessions.pluginPatch` ของ Gateway ได้ แถวเซสชันจะแสดงสถานะส่วนขยายที่ลงทะเบียนไว้
ผ่าน `pluginExtensions` ทำให้ UI ควบคุมและไคลเอนต์อื่นๆ เรนเดอร์
สถานะที่ Plugin เป็นเจ้าของได้โดยไม่ต้องรู้รายละเอียดภายในของ Plugin

ใช้ `api.enqueueNextTurnInjection(...)` เมื่อ Plugin ต้องการบริบทที่คงทนเพื่อ
ไปถึงเทิร์นโมเดลถัดไปแบบครั้งเดียวพอดี OpenClaw จะระบายอินเจกชันที่อยู่ในคิวก่อน
ฮุกพรอมป์ ทิ้งอินเจกชันที่หมดอายุ และลบรายการซ้ำตาม `idempotencyKey`
ต่อ Plugin นี่คือจุดเชื่อมต่อที่เหมาะสมสำหรับการกลับมาทำงานต่อหลังการอนุมัติ สรุปนโยบาย
เดลตาจากตัวมอนิเตอร์เบื้องหลัง และการดำเนินคำสั่งต่อเนื่องที่ควรปรากฏต่อ
โมเดลในเทิร์นถัดไป แต่ไม่ควรกลายเป็นข้อความพรอมป์ระบบถาวร

ความหมายเชิงการล้างข้อมูลเป็นส่วนหนึ่งของสัญญา คอลแบ็กการล้างข้อมูลส่วนขยายเซสชันและ
การล้างข้อมูลวงจรชีวิตรันไทม์จะได้รับ `reset`, `delete`, `disable` หรือ
`restart` โฮสต์จะลบสถานะส่วนขยายเซสชันถาวรของ Plugin ที่เป็นเจ้าของ
และอินเจกชันเทิร์นถัดไปที่ค้างอยู่สำหรับ reset/delete/disable ส่วน restart จะคง
สถานะเซสชันที่คงทนไว้ ขณะที่คอลแบ็กการล้างข้อมูลเปิดทางให้ Plugin ปล่อยงานตัวจัดตารางเวลา
บริบทรัน และทรัพยากรนอกแบนด์อื่นๆ สำหรับรุ่นรันไทม์เดิม

## ฮุกข้อความ

ใช้ฮุกข้อความสำหรับการกำหนดเส้นทางและนโยบายการส่งมอบระดับช่องทาง:

- `message_received`: สังเกตเนื้อหาขาเข้า ผู้ส่ง, `threadId`, `messageId`,
  `senderId`, ความสัมพันธ์กับรัน/เซสชันแบบไม่บังคับ และเมทาดาทา
- `message_sending`: เขียน `content` ใหม่หรือคืนค่า `{ cancel: true }`
- `message_sent`: สังเกตความสำเร็จหรือความล้มเหลวสุดท้าย

สำหรับการตอบกลับ TTS ที่มีเฉพาะเสียง `content` อาจมีบันทึกถ้อยคำที่พูดแบบซ่อนอยู่
แม้เมื่อเพย์โหลดของช่องทางไม่มีข้อความ/คำบรรยายที่มองเห็นได้ การเขียน
`content` นั้นใหม่จะอัปเดตเฉพาะบันทึกถ้อยคำที่ฮุกมองเห็นเท่านั้น และจะไม่ถูกเรนเดอร์เป็น
คำบรรยายสื่อ

บริบทของฮุกข้อความจะแสดงฟิลด์ความสัมพันธ์ที่เสถียรเมื่อมีให้ใช้:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` และ `ctx.callDepth` ให้ใช้
ฟิลด์ระดับเฟิร์สต์คลาสเหล่านี้ก่อนอ่านเมทาดาทาแบบเดิม

ให้ใช้ฟิลด์ `threadId` และ `replyToId` ที่มีชนิดข้อมูลก่อนใช้เมทาดาทาเฉพาะช่องทาง

กฎการตัดสินใจ:

- `message_sending` พร้อม `cancel: true` เป็นการตัดสินใจสุดท้าย
- `message_sending` พร้อม `cancel: false` จะถือว่าไม่มีการตัดสินใจ
- `content` ที่เขียนใหม่จะส่งต่อไปยังฮุกที่มีลำดับความสำคัญต่ำกว่าต่อไป เว้นแต่ฮุกภายหลัง
  จะยกเลิกการส่งมอบ

## ฮุกการติดตั้ง

`before_install` จะทำงานหลังการสแกนในตัวสำหรับการติดตั้ง Skills และ Plugin
คืนค่าผลการค้นพบเพิ่มเติมหรือ `{ block: true, blockReason }` เพื่อหยุด
การติดตั้ง

`block: true` เป็นการตัดสินใจสุดท้าย `block: false` จะถือว่าไม่มีการตัดสินใจ

## วงจรชีวิต Gateway

ใช้ `gateway_start` สำหรับบริการของ Plugin ที่ต้องการสถานะที่ Gateway เป็นเจ้าของ
บริบทจะแสดง `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับ
การตรวจสอบและอัปเดต cron ใช้ `gateway_stop` เพื่อล้างทรัพยากรที่ทำงานระยะยาว

อย่าพึ่งพาฮุกภายใน `gateway:startup` สำหรับบริการรันไทม์ที่ Plugin เป็นเจ้าของ

`cron_changed` จะทำงานสำหรับเหตุการณ์วงจรชีวิต cron ที่ Gateway เป็นเจ้าของ โดยมี
เพย์โหลดเหตุการณ์แบบมีชนิดที่ครอบคลุมเหตุผล `added`, `updated`, `removed`, `started`, `finished`,
และ `scheduled` เหตุการณ์จะนำสแนปช็อต `PluginHookGatewayCronJob`
(รวมถึง `state.nextRunAtMs`, `state.lastRunStatus` และ
`state.lastError` เมื่อมี) พร้อม `PluginHookGatewayCronDeliveryStatus`
เป็น `not-requested` | `delivered` | `not-delivered` | `unknown` เหตุการณ์ที่ถูกลบ
ยังคงมีสแนปช็อตงานที่ถูกลบเพื่อให้ตัวจัดตารางเวลาภายนอกสามารถกระทบยอดสถานะได้
ใช้ `ctx.getCron?.()` และ `ctx.config` จากบริบทรันไทม์เมื่อซิงค์ตัวจัดตารางเวลาปลุกภายนอก
และให้ OpenClaw เป็นแหล่งข้อมูลจริงสำหรับการตรวจสอบเวลาถึงกำหนดและการดำเนินการ

## การเลิกใช้งานที่กำลังจะมาถึง

พื้นผิวบางส่วนที่อยู่ใกล้กับฮุกถูกเลิกใช้แล้วแต่ยังรองรับอยู่ ให้ย้ายก่อน
รีลีสเมเจอร์ถัดไป:

- **เอนเวโลปช่องทางแบบข้อความธรรมดา** ในตัวจัดการ `inbound_claim` และ `message_received`
  อ่าน `BodyForAgent` และบล็อกบริบทผู้ใช้แบบมีโครงสร้าง
  แทนการแยกวิเคราะห์ข้อความเอนเวโลปแบบแบน ดู
  [เอนเวโลปช่องทางแบบข้อความธรรมดา → BodyForAgent](/th/plugins/sdk-migration#active-deprecations)
- **`before_agent_start`** ยังคงอยู่เพื่อความเข้ากันได้ Plugin ใหม่ควรใช้
  `before_model_resolve` และ `before_prompt_build` แทนเฟสแบบรวม
- **`onResolution` ใน `before_tool_call`** ตอนนี้ใช้ยูเนียน
  `PluginApprovalResolution` แบบมีชนิด (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) แทน `string` แบบรูปแบบอิสระ

สำหรับรายการทั้งหมด — การลงทะเบียนความสามารถหน่วยความจำ โปรไฟล์การคิดของผู้ให้บริการ
ผู้ให้บริการตรวจสอบสิทธิ์ภายนอก ชนิดการค้นพบผู้ให้บริการ ตัวเข้าถึงรันไทม์งาน
และการเปลี่ยนชื่อ `command-auth` → `command-status` — ดู
[การย้าย Plugin SDK → การเลิกใช้งานที่ยังมีผล](/th/plugins/sdk-migration#active-deprecations)

## ที่เกี่ยวข้อง

- [การย้าย Plugin SDK](/th/plugins/sdk-migration) — การเลิกใช้งานที่ยังมีผลและกำหนดเวลาการนำออก
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints)
- [ฮุกภายใน](/th/automation/hooks)
- [รายละเอียดภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)
