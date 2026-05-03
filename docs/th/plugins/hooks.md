---
read_when:
    - คุณกำลังสร้าง Plugin ที่ต้องใช้ before_tool_call, before_agent_reply, ฮุกข้อความ หรือฮุกวงจรชีวิต
    - คุณต้องบล็อก เขียนใหม่ หรือกำหนดให้ต้องได้รับการอนุมัติสำหรับการเรียกใช้เครื่องมือจาก Plugin
    - คุณกำลังตัดสินใจเลือกระหว่างฮุกภายในกับฮุกของ Plugin
summary: 'ฮุกของ Plugin: ดักจับเหตุการณ์วงจรชีวิตของเอเจนต์ เครื่องมือ ข้อความ เซสชัน และ Gateway'
title: ฮุกของ Plugin
x-i18n:
    generated_at: "2026-05-03T21:36:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

ฮุกของ Plugin เป็นจุดขยายแบบ in-process สำหรับ Plugin ของ OpenClaw ใช้เมื่อ
Plugin ต้องตรวจสอบหรือเปลี่ยนแปลงการรันของเอเจนต์ การเรียกเครื่องมือ โฟลว์ข้อความ
วงจรชีวิตของเซสชัน การกำหนดเส้นทางเอเจนต์ย่อย การติดตั้ง หรือการเริ่มต้น Gateway

ใช้ [ฮุกภายใน](/th/automation/hooks) แทนเมื่อคุณต้องการสคริปต์ `HOOK.md` ขนาดเล็ก
ที่ติดตั้งโดยโอเปอเรเตอร์ สำหรับคำสั่งและเหตุการณ์ของ Gateway เช่น
`/new`, `/reset`, `/stop`, `agent:bootstrap` หรือ `gateway:startup`

## เริ่มต้นอย่างรวดเร็ว

ลงทะเบียนฮุกของ Plugin แบบมีชนิดด้วย `api.on(...)` จากจุดเข้าของ Plugin:

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

ตัวจัดการฮุกจะรันตามลำดับทีละตัวโดยเรียง `priority` จากมากไปน้อย ฮุกที่มี priority
เท่ากันจะคงลำดับการลงทะเบียนไว้

`api.on(name, handler, opts?)` รับ:

- `priority` — ลำดับของตัวจัดการ (ค่าที่สูงกว่าจะรันก่อน)
- `timeoutMs` — งบเวลาต่อฮุกแบบไม่บังคับ เมื่อกำหนดไว้ ตัวรันฮุกจะยกเลิก
  ตัวจัดการนั้นหลังงบเวลาหมดลงและทำต่อกับตัวถัดไป แทนที่จะปล่อยให้งานตั้งค่าหรือการเรียกคืนที่ช้า
  ใช้ timeout ของโมเดลที่ผู้เรียกกำหนดไว้จนหมด ละไว้เพื่อใช้ timeout เริ่มต้นสำหรับการสังเกต/การตัดสินใจที่
  ตัวรันฮุกใช้โดยทั่วไป

โอเปอเรเตอร์ยังสามารถตั้งงบเวลาของฮุกได้โดยไม่ต้องแพตช์โค้ดของ Plugin:

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

`hooks.timeouts.<hookName>` จะ override `hooks.timeoutMs` ซึ่ง override ค่า
`api.on(..., { timeoutMs })` ที่ผู้เขียน Plugin กำหนดไว้ แต่ละค่าที่กำหนดต้องเป็น
จำนวนเต็มบวกไม่เกิน 600000 มิลลิวินาที ควรใช้การ override รายฮุกสำหรับฮุกที่ทราบว่าช้า
เพื่อไม่ให้ Plugin หนึ่งได้งบเวลายาวขึ้นทุกที่

แต่ละฮุกจะได้รับ `event.context.pluginConfig` ซึ่งเป็นคอนฟิกที่ resolve แล้วสำหรับ
Plugin ที่ลงทะเบียนตัวจัดการนั้น ใช้สำหรับการตัดสินใจของฮุกที่ต้องใช้
ตัวเลือกปัจจุบันของ Plugin; OpenClaw ฉีดค่านี้ต่อหนึ่งตัวจัดการโดยไม่ mutate
อ็อบเจ็กต์เหตุการณ์ร่วมที่ Plugin อื่นเห็น

## แค็ตตาล็อกฮุก

ฮุกถูกจัดกลุ่มตามพื้นผิวที่ขยาย ชื่อที่เป็น **ตัวหนา** รับ
ผลลัพธ์การตัดสินใจได้ (บล็อก ยกเลิก override หรือขออนุมัติ); รายการอื่นทั้งหมด
ใช้สำหรับสังเกตเท่านั้น

**เทิร์นของเอเจนต์**

- `before_model_resolve` — override ผู้ให้บริการหรือโมเดลก่อนโหลดข้อความเซสชัน
- `agent_turn_prepare` — ใช้การฉีดเทิร์นของ Plugin ที่เข้าคิวไว้และเพิ่มบริบทในเทิร์นเดียวกันก่อนฮุกพรอมป์
- `before_prompt_build` — เพิ่มบริบทแบบไดนามิกหรือข้อความ system prompt ก่อนการเรียกโมเดล
- `before_agent_start` — เฟสรวมเพื่อความเข้ากันได้เท่านั้น; ควรใช้สองฮุกข้างต้น
- **`before_agent_reply`** — ลัดวงจรเทิร์นโมเดลด้วยคำตอบสังเคราะห์หรือความเงียบ
- **`before_agent_finalize`** — ตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้โมเดลรันเพิ่มอีกหนึ่งรอบ
- `agent_end` — สังเกตข้อความสุดท้าย สถานะความสำเร็จ และระยะเวลาการรัน
- `heartbeat_prompt_contribution` — เพิ่มบริบทสำหรับ Heartbeat เท่านั้นสำหรับ Plugin ตรวจสอบพื้นหลังและวงจรชีวิต

**การสังเกตการสนทนา**

- `model_call_started` / `model_call_ended` — สังเกตเมตาดาต้าของการเรียกผู้ให้บริการ/โมเดลที่ผ่านการทำให้ปลอดภัยแล้ว เวลา ผลลัพธ์ และแฮช request-id แบบมีขอบเขต โดยไม่มีเนื้อหาพรอมป์หรือคำตอบ
- `llm_input` — สังเกตอินพุตของผู้ให้บริการ (system prompt, prompt, ประวัติ)
- `llm_output` — สังเกตเอาต์พุตของผู้ให้บริการ

**เครื่องมือ**

- **`before_tool_call`** — เขียน params ของเครื่องมือใหม่ บล็อกการดำเนินการ หรือขออนุมัติ
- `after_tool_call` — สังเกตผลลัพธ์ของเครื่องมือ ข้อผิดพลาด และระยะเวลา
- **`tool_result_persist`** — เขียนข้อความของ assistant ที่สร้างจากผลลัพธ์เครื่องมือใหม่
- **`before_message_write`** — ตรวจสอบหรือบล็อกการเขียนข้อความที่กำลังดำเนินอยู่ (พบได้น้อย)

**ข้อความและการส่งมอบ**

- **`inbound_claim`** — claim ข้อความขาเข้าก่อนการกำหนดเส้นทางเอเจนต์ (คำตอบสังเคราะห์)
- `message_received` — สังเกตเนื้อหาขาเข้า ผู้ส่ง เธรด และเมตาดาต้า
- **`message_sending`** — เขียนเนื้อหาขาออกใหม่หรือยกเลิกการส่งมอบ
- `message_sent` — สังเกตความสำเร็จหรือความล้มเหลวของการส่งมอบขาออก
- **`before_dispatch`** — ตรวจสอบหรือเขียน dispatch ขาออกใหม่ก่อนส่งต่อให้ช่องทาง
- **`reply_dispatch`** — เข้าร่วมใน pipeline การ dispatch คำตอบสุดท้าย

**เซสชันและ Compaction**

- `session_start` / `session_end` — ติดตามขอบเขตวงจรชีวิตของเซสชัน
- `before_compaction` / `after_compaction` — สังเกตหรือใส่หมายเหตุให้รอบ Compaction
- `before_reset` — สังเกตเหตุการณ์รีเซ็ตเซสชัน (`/reset`, การรีเซ็ตผ่านโปรแกรม)

**เอเจนต์ย่อย**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — ประสานการกำหนดเส้นทางเอเจนต์ย่อยและการส่งมอบเมื่อเสร็จสิ้น

**วงจรชีวิต**

- `gateway_start` / `gateway_stop` — เริ่มหรือหยุดบริการที่ Plugin เป็นเจ้าของพร้อมกับ Gateway
- `cron_changed` — สังเกตการเปลี่ยนแปลงวงจรชีวิต Cron ที่ Gateway เป็นเจ้าของ (เพิ่ม อัปเดต ลบ เริ่มต้น เสร็จสิ้น กำหนดเวลา)
- **`before_install`** — ตรวจสอบการสแกนการติดตั้ง Skills หรือ Plugin และบล็อกได้ตามต้องการ

## นโยบายการเรียกเครื่องมือ

`before_tool_call` ได้รับ:

- `event.toolName`
- `event.params`
- `event.runId` แบบไม่บังคับ
- `event.toolCallId` แบบไม่บังคับ
- ฟิลด์บริบท เช่น `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ตั้งค่าในการรันที่ขับเคลื่อนด้วย Cron) และ `ctx.trace` สำหรับการวินิจฉัย

สามารถส่งคืน:

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

- `block: true` เป็นสถานะสิ้นสุดและข้ามตัวจัดการ priority ต่ำกว่า
- `block: false` ถือว่าไม่มีการตัดสินใจ
- `params` เขียนพารามิเตอร์ของเครื่องมือใหม่สำหรับการดำเนินการ
- `requireApproval` หยุดการรันเอเจนต์ชั่วคราวและขอผู้ใช้ผ่านการอนุมัติของ Plugin
  คำสั่ง `/approve` สามารถอนุมัติได้ทั้ง exec และการอนุมัติของ Plugin
- `block: true` จาก priority ต่ำกว่ายังสามารถบล็อกได้หลังฮุก priority สูงกว่า
  ขออนุมัติแล้ว
- `onResolution` ได้รับการตัดสินใจอนุมัติที่ resolve แล้ว — `allow-once`,
  `allow-always`, `deny`, `timeout` หรือ `cancelled`

Plugin ที่มาพร้อมระบบซึ่งต้องใช้นโยบายระดับโฮสต์สามารถลงทะเบียนนโยบายเครื่องมือที่เชื่อถือได้
ด้วย `api.registerTrustedToolPolicy(...)` นโยบายเหล่านี้รันก่อนฮุก
`before_tool_call` ทั่วไปและก่อนการตัดสินใจของ Plugin ภายนอก ใช้เฉพาะ
สำหรับด่านที่โฮสต์เชื่อถือ เช่น นโยบาย workspace การบังคับใช้งบประมาณ หรือ
ความปลอดภัยของ workflow ที่สงวนไว้ Plugin ภายนอกควรใช้ฮุก `before_tool_call`
ตามปกติ

### การคงอยู่ของผลลัพธ์เครื่องมือ

ผลลัพธ์เครื่องมือสามารถมี `details` แบบมีโครงสร้างสำหรับการเรนเดอร์ UI การวินิจฉัย
การกำหนดเส้นทางสื่อ หรือเมตาดาต้าที่ Plugin เป็นเจ้าของ ให้ถือว่า `details` เป็นเมตาดาต้ารันไทม์
ไม่ใช่เนื้อหาพรอมป์:

- OpenClaw ตัด `toolResult.details` ออกก่อน replay ไปยังผู้ให้บริการและอินพุตของ Compaction
  เพื่อไม่ให้เมตาดาต้ากลายเป็นบริบทของโมเดล
- รายการเซสชันที่ persist จะเก็บเฉพาะ `details` แบบมีขอบเขต details ที่ใหญ่เกินไปจะถูก
  แทนที่ด้วยสรุปแบบกะทัดรัดและ `persistedDetailsTruncated: true`
- `tool_result_persist` และ `before_message_write` รันก่อน cap การ persist ขั้นสุดท้าย
  ฮุกยังควรรักษา `details` ที่ส่งคืนให้มีขนาดเล็กและหลีกเลี่ยง
  การวางข้อความที่เกี่ยวข้องกับพรอมป์ไว้เฉพาะใน `details`; ให้วางเอาต์พุตเครื่องมือที่โมเดลเห็นได้
  ใน `content`

## ฮุกพรอมป์และโมเดล

ใช้ฮุกเฉพาะเฟสสำหรับ Plugin ใหม่:

- `before_model_resolve`: ได้รับเฉพาะพรอมป์ปัจจุบันและเมตาดาต้า
  ไฟล์แนบ ส่งคืน `providerOverride` หรือ `modelOverride`
- `agent_turn_prepare`: ได้รับพรอมป์ปัจจุบัน ข้อความเซสชันที่เตรียมไว้
  และการฉีดที่เข้าคิวแบบใช้ครั้งเดียวที่ drain สำหรับเซสชันนี้ ส่งคืน
  `prependContext` หรือ `appendContext`
- `before_prompt_build`: ได้รับพรอมป์ปัจจุบันและข้อความเซสชัน
  ส่งคืน `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` หรือ `appendSystemContext`
- `heartbeat_prompt_contribution`: รันเฉพาะสำหรับเทิร์น Heartbeat และส่งคืน
  `prependContext` หรือ `appendContext` มีไว้สำหรับตัวตรวจสอบพื้นหลัง
  ที่ต้องสรุปสถานะปัจจุบันโดยไม่เปลี่ยนเทิร์นที่ผู้ใช้เริ่มต้น

`before_agent_start` ยังคงอยู่เพื่อความเข้ากันได้ ควรใช้ฮุกที่ชัดเจนข้างต้น
เพื่อให้ Plugin ของคุณไม่ต้องพึ่งพาเฟสรวมแบบเดิม

`before_agent_start` และ `agent_end` รวม `event.runId` เมื่อ OpenClaw สามารถ
ระบุการรันที่ใช้งานอยู่ได้ ค่าเดียวกันยังพร้อมใช้งานที่ `ctx.runId`
การรันที่ขับเคลื่อนด้วย Cron ยังเปิดเผย `ctx.jobId` (id ของงาน Cron ต้นทาง) เพื่อให้
ฮุกของ Plugin สามารถกำหนดขอบเขตเมตริก ผลข้างเคียง หรือสถานะไปยังงานที่กำหนดเวลาไว้เฉพาะได้

สำหรับการรันที่มาจากช่องทาง `ctx.messageProvider` คือพื้นผิวผู้ให้บริการ เช่น
`discord` หรือ `telegram` ขณะที่ `ctx.channelId` คือ identifier เป้าหมายของการสนทนา
เมื่อ OpenClaw สามารถอนุมานได้จากคีย์เซสชันหรือเมตาดาต้าการส่งมอบ

`agent_end` เป็นฮุกสังเกตการณ์และรันแบบ fire-and-forget หลังจบเทิร์น
ตัวรันฮุกใช้ timeout 30 วินาทีเพื่อให้ Plugin หรือ endpoint embedding
ที่ค้างอยู่ไม่ทำให้ promise ของฮุกค้างตลอดไป timeout จะถูกบันทึก log และ
OpenClaw ทำต่อ; มันไม่ยกเลิกงานเครือข่ายที่ Plugin เป็นเจ้าของ เว้นแต่
Plugin จะใช้ abort signal ของตัวเองด้วย

ใช้ `model_call_started` และ `model_call_ended` สำหรับ telemetry ของการเรียกผู้ให้บริการ
ที่ไม่ควรได้รับพรอมป์ดิบ ประวัติ คำตอบ headers เนื้อหา request
หรือ request ID ของผู้ให้บริการ ฮุกเหล่านี้รวมเมตาดาต้าที่เสถียร เช่น
`runId`, `callId`, `provider`, `model`, `api`/`transport` แบบไม่บังคับ,
`durationMs`/`outcome` ขั้นสุดท้าย และ `upstreamRequestIdHash` เมื่อ OpenClaw สามารถอนุมาน
แฮช request-id ของผู้ให้บริการแบบมีขอบเขตได้

`before_agent_finalize` รันเฉพาะเมื่อ harness กำลังจะยอมรับ
คำตอบสุดท้ายตามธรรมชาติของ assistant มันไม่ใช่เส้นทางยกเลิก `/stop` และไม่
รันเมื่อผู้ใช้ยกเลิกเทิร์น ส่งคืน `{ action: "revise", reason }` เพื่อขอให้
harness เรียกโมเดลเพิ่มอีกหนึ่งรอบก่อน finalize, `{ action:
"finalize", reason? }` เพื่อบังคับ finalize หรือละผลลัพธ์เพื่อทำต่อ
ฮุก `Stop` แบบเนทีฟของ Codex จะถูก relay เข้าสู่ฮุกนี้เป็นการตัดสินใจ
`before_agent_finalize` ของ OpenClaw

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

ฮุกที่ mutate พรอมป์และการฉีดสำหรับเทิร์นถัดไปแบบ durable สามารถปิดใช้งานต่อ Plugin
ได้ด้วย `plugins.entries.<id>.hooks.allowPromptInjection=false`

### ส่วนขยายเซสชันและการฉีดเทิร์นถัดไป

Plugin workflow สามารถ persist สถานะเซสชันขนาดเล็กที่เข้ากันได้กับ JSON ด้วย
`api.registerSessionExtension(...)` และอัปเดตผ่านเมธอด
`sessions.pluginPatch` ของ Gateway แถวเซสชัน project สถานะส่วนขยายที่ลงทะเบียนไว้
ผ่าน `pluginExtensions` ทำให้ Control UI และไคลเอนต์อื่นเรนเดอร์
สถานะที่ Plugin เป็นเจ้าของได้โดยไม่ต้องรู้ internals ของ Plugin

ใช้ `api.enqueueNextTurnInjection(...)` เมื่อ Plugin ต้องการบริบทที่คงทนเพื่อ
ส่งต่อไปถึงรอบโมเดลถัดไปเพียงครั้งเดียวพอดี OpenClaw จะระบายการแทรกที่เข้าคิวไว้ก่อน
prompt hooks, ทิ้งการแทรกที่หมดอายุ และทำการลบรายการซ้ำตาม `idempotencyKey`
ต่อ Plugin นี่คือ seam ที่เหมาะสำหรับการกลับมาทำงานต่อหลังการอนุมัติ, สรุปนโยบาย,
เดลตาจากตัวติดตามเบื้องหลัง และการดำเนินคำสั่งต่อเนื่องที่ควรมองเห็นได้ต่อ
โมเดลในรอบถัดไป แต่ไม่ควรกลายเป็นข้อความ system prompt แบบถาวร

ความหมายของการล้างข้อมูลเป็นส่วนหนึ่งของสัญญา callback สำหรับการล้างข้อมูลส่วนขยายเซสชันและ
การล้างข้อมูลวงจรชีวิต runtime จะได้รับ `reset`, `delete`, `disable` หรือ
`restart` โฮสต์จะลบสถานะส่วนขยายเซสชันถาวรของ Plugin เจ้าของ
และการแทรกสำหรับรอบถัดไปที่ค้างอยู่เมื่อเป็น reset/delete/disable; restart จะคง
สถานะเซสชันที่คงทนไว้ ขณะที่ callback การล้างข้อมูลเปิดให้ Plugin ปล่อยงาน scheduler,
บริบทการรัน และทรัพยากรนอกแบนด์อื่น ๆ สำหรับ generation runtime เดิม

## ฮุกข้อความ

ใช้ฮุกข้อความสำหรับการกำหนดเส้นทางและนโยบายการส่งในระดับช่องทาง:

- `message_received`: สังเกตเนื้อหาขาเข้า ผู้ส่ง `threadId`, `messageId`,
  `senderId`, ความสัมพันธ์กับการรัน/เซสชันที่เป็นตัวเลือก และ metadata
- `message_sending`: เขียน `content` ใหม่ หรือคืนค่า `{ cancel: true }`
- `message_sent`: สังเกตผลสำเร็จหรือความล้มเหลวสุดท้าย

สำหรับการตอบกลับ TTS แบบเสียงเท่านั้น `content` อาจมี transcript คำพูดที่ซ่อนอยู่
แม้เมื่อ payload ของช่องทางไม่มีข้อความ/คำบรรยายภาพที่มองเห็นได้ การเขียน
`content` นั้นใหม่จะอัปเดตเฉพาะ transcript ที่ฮุกมองเห็นเท่านั้น; จะไม่ถูกเรนเดอร์เป็น
คำบรรยายสื่อ

บริบทฮุกข้อความเปิดเผยฟิลด์ความสัมพันธ์ที่เสถียรเมื่อมี:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` และ `ctx.callDepth` ควรใช้
ฟิลด์ชั้นหนึ่งเหล่านี้ก่อนอ่าน metadata แบบเดิม

ควรใช้ฟิลด์ `threadId` และ `replyToId` ที่มีชนิดกำกับก่อนใช้
metadata เฉพาะช่องทาง

กฎการตัดสินใจ:

- `message_sending` พร้อม `cancel: true` ถือเป็นจุดสิ้นสุด
- `message_sending` พร้อม `cancel: false` ถือว่าไม่มีการตัดสินใจ
- `content` ที่ถูกเขียนใหม่จะส่งต่อไปยังฮุกที่มีลำดับความสำคัญต่ำกว่า เว้นแต่ฮุกภายหลัง
  จะยกเลิกการส่ง

## ฮุกการติดตั้ง

`before_install` จะรันหลังการสแกนในตัวสำหรับการติดตั้ง Skills และ Plugin
คืนค่าผลการตรวจพบเพิ่มเติม หรือ `{ block: true, blockReason }` เพื่อหยุด
การติดตั้ง

`block: true` ถือเป็นจุดสิ้นสุด `block: false` ถือว่าไม่มีการตัดสินใจ

## วงจรชีวิต Gateway

ใช้ `gateway_start` สำหรับบริการของ Plugin ที่ต้องการสถานะที่ Gateway เป็นเจ้าของ บริบท
เปิดเผย `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับ
การตรวจสอบและอัปเดต cron ใช้ `gateway_stop` เพื่อล้างข้อมูล
ทรัพยากรที่รันเป็นเวลานาน

อย่าพึ่งพาฮุกภายใน `gateway:startup` สำหรับบริการ runtime
ที่ Plugin เป็นเจ้าของ

`cron_changed` จะทำงานสำหรับเหตุการณ์วงจรชีวิต cron ที่ gateway เป็นเจ้าของ พร้อม
payload เหตุการณ์ที่มีชนิดกำกับ ครอบคลุมเหตุผล `added`, `updated`, `removed`, `started`, `finished`
และ `scheduled` เหตุการณ์จะพก snapshot ของ `PluginHookGatewayCronJob`
(รวมถึง `state.nextRunAtMs`, `state.lastRunStatus` และ
`state.lastError` เมื่อมี) พร้อม `PluginHookGatewayCronDeliveryStatus`
ของ `not-requested` | `delivered` | `not-delivered` | `unknown` เหตุการณ์ที่ถูกลบ
ยังคงพก snapshot ของงานที่ถูกลบ เพื่อให้ scheduler ภายนอกสามารถ
กระทบยอดสถานะได้ ใช้ `ctx.getCron?.()` และ `ctx.config` จากบริบท
runtime เมื่อซิงก์ scheduler ปลุกระบบภายนอก และให้ OpenClaw เป็น
แหล่งข้อมูลจริงสำหรับการตรวจสอบกำหนดเวลาและการดำเนินงาน

## การเลิกใช้งานที่กำลังจะมาถึง

พื้นผิวบางส่วนที่อยู่ใกล้กับฮุกถูกเลิกใช้แล้วแต่ยังรองรับอยู่ ให้ย้าย
ก่อนรีลีสหลักครั้งถัดไป:

- **envelope ช่องทางแบบข้อความล้วน** ใน handler ของ `inbound_claim` และ `message_received`
  ให้อ่าน `BodyForAgent` และบล็อกบริบทผู้ใช้แบบมีโครงสร้าง
  แทนการแยกวิเคราะห์ข้อความ envelope แบบแบน ดู
  [envelope ช่องทางแบบข้อความล้วน → BodyForAgent](/th/plugins/sdk-migration#active-deprecations)
- **`before_agent_start`** ยังคงอยู่เพื่อความเข้ากันได้ Plugin ใหม่ควรใช้
  `before_model_resolve` และ `before_prompt_build` แทน phase
  แบบรวม
- **`onResolution` ใน `before_tool_call`** ตอนนี้ใช้ union ที่มีชนิดกำกับ
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) แทน `string` แบบอิสระ

สำหรับรายการทั้งหมด — การลงทะเบียนความสามารถหน่วยความจำ, profile การคิดของ provider,
provider การยืนยันตัวตนภายนอก, ชนิดการค้นพบ provider, accessor ของ runtime งาน,
และการเปลี่ยนชื่อ `command-auth` → `command-status` — ดู
[การย้าย Plugin SDK → การเลิกใช้งานที่ยังมีผล](/th/plugins/sdk-migration#active-deprecations)

## ที่เกี่ยวข้อง

- [การย้าย Plugin SDK](/th/plugins/sdk-migration) — การเลิกใช้งานที่ยังมีผลและไทม์ไลน์การลบออก
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- [ฮุกภายใน](/th/automation/hooks)
- [ส่วนภายในของสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)
