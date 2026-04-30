---
read_when:
    - คุณกำลังสร้าง Plugin ที่ต้องใช้ before_tool_call, before_agent_reply, ฮุกข้อความ หรือฮุกวงจรชีวิต
    - คุณต้องบล็อก เขียนใหม่ หรือกำหนดให้การเรียกใช้เครื่องมือจาก Plugin ต้องได้รับการอนุมัติ
    - คุณกำลังเลือกระหว่างฮุกภายในกับฮุกของ Plugin
summary: 'ฮุกของ Plugin: ดักจับเหตุการณ์วงจรชีวิตของเอเจนต์ เครื่องมือ ข้อความ เซสชัน และ Gateway'
title: ฮุกของ Plugin
x-i18n:
    generated_at: "2026-04-30T10:06:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

ฮุกของ Plugin เป็นจุดขยายในกระบวนการสำหรับ Plugin ของ OpenClaw ใช้เมื่อ Plugin ต้องตรวจสอบหรือเปลี่ยนการรันของเอเจนต์, การเรียกใช้เครื่องมือ, โฟลว์ข้อความ,
วงจรชีวิตเซสชัน, การกำหนดเส้นทางซับเอเจนต์, การติดตั้ง, หรือการเริ่มต้น Gateway

ใช้ [ฮุกภายใน](/th/automation/hooks) แทนเมื่อคุณต้องการสคริปต์ `HOOK.md` ขนาดเล็ก
ที่ผู้ปฏิบัติงานติดตั้งไว้ สำหรับเหตุการณ์คำสั่งและ Gateway เช่น
`/new`, `/reset`, `/stop`, `agent:bootstrap`, หรือ `gateway:startup`

## เริ่มต้นอย่างรวดเร็ว

ลงทะเบียนฮุก Plugin แบบมีชนิดด้วย `api.on(...)` จากรายการเข้าของ Plugin ของคุณ:

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

ตัวจัดการฮุกทำงานตามลำดับจาก `priority` มากไปน้อย ฮุกที่มี priority เท่ากัน
จะคงลำดับการลงทะเบียนไว้

`api.on(name, handler, opts?)` รับค่า:

- `priority` — ลำดับของตัวจัดการ (ค่าที่สูงกว่าจะทำงานก่อน)
- `timeoutMs` — งบเวลาต่อฮุกที่เป็นทางเลือก เมื่อตั้งค่า ตัวรันฮุกจะยกเลิก
  ตัวจัดการนั้นหลังงบเวลาหมดและทำงานตัวถัดไป แทนที่จะปล่อยให้งานตั้งค่าหรือเรียกคืนที่ช้าใช้ timeout ของโมเดลที่ผู้เรียกกำหนดไว้
  ละไว้เพื่อใช้ timeout เริ่มต้นสำหรับการสังเกต/การตัดสินใจที่
  ตัวรันฮุกใช้โดยทั่วไป

ฮุกแต่ละตัวได้รับ `event.context.pluginConfig` ซึ่งเป็นคอนฟิกที่ resolve แล้วสำหรับ
Plugin ที่ลงทะเบียนตัวจัดการนั้น ใช้สำหรับการตัดสินใจของฮุกที่ต้องใช้
ตัวเลือก Plugin ปัจจุบัน; OpenClaw จะฉีดค่านี้ต่อแต่ละตัวจัดการโดยไม่กลายพันธุ์
ออบเจ็กต์เหตุการณ์ร่วมที่ Plugin อื่นเห็น

## แค็ตตาล็อกฮุก

ฮุกถูกจัดกลุ่มตามพื้นผิวที่ขยาย ชื่อที่เป็น **ตัวหนา** รับ
ผลลัพธ์การตัดสินใจได้ (บล็อก, ยกเลิก, แทนที่, หรือขออนุมัติ); นอกนั้นทั้งหมดเป็น
การสังเกตเท่านั้น

**รอบของเอเจนต์**

- `before_model_resolve` — แทนที่ผู้ให้บริการหรือโมเดลก่อนโหลดข้อความเซสชัน
- `agent_turn_prepare` — ใช้การฉีดรอบของ Plugin ที่เข้าคิวไว้และเพิ่มบริบทในรอบเดียวกันก่อนฮุกพรอมป์
- `before_prompt_build` — เพิ่มบริบทแบบไดนามิกหรือข้อความพรอมป์ระบบก่อนการเรียกโมเดล
- `before_agent_start` — เฟสรวมสำหรับความเข้ากันได้เท่านั้น; ควรใช้สองฮุกข้างต้น
- **`before_agent_reply`** — ลัดวงจรรอบของโมเดลด้วยคำตอบสังเคราะห์หรือความเงียบ
- **`before_agent_finalize`** — ตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้โมเดลทำงานเพิ่มอีกหนึ่งรอบ
- `agent_end` — สังเกตข้อความสุดท้าย, สถานะสำเร็จ, และระยะเวลาการรัน
- `heartbeat_prompt_contribution` — เพิ่มบริบทสำหรับ Heartbeat เท่านั้น สำหรับ Plugin เฝ้าติดตามเบื้องหลังและวงจรชีวิต

**การสังเกตบทสนทนา**

- `model_call_started` / `model_call_ended` — สังเกตเมตาดาต้าการเรียกผู้ให้บริการ/โมเดลที่ผ่านการทำให้ปลอดภัยแล้ว, เวลา, ผลลัพธ์, และแฮชรหัสคำขอแบบจำกัด โดยไม่มีเนื้อหาพรอมป์หรือคำตอบ
- `llm_input` — สังเกตอินพุตของผู้ให้บริการ (พรอมป์ระบบ, พรอมป์, ประวัติ)
- `llm_output` — สังเกตเอาต์พุตของผู้ให้บริการ

**เครื่องมือ**

- **`before_tool_call`** — เขียนพารามิเตอร์เครื่องมือใหม่, บล็อกการทำงาน, หรือขออนุมัติ
- `after_tool_call` — สังเกตผลลัพธ์เครื่องมือ, ข้อผิดพลาด, และระยะเวลา
- **`tool_result_persist`** — เขียนข้อความผู้ช่วยที่สร้างจากผลลัพธ์เครื่องมือใหม่
- **`before_message_write`** — ตรวจสอบหรือบล็อกการเขียนข้อความที่กำลังดำเนินอยู่ (พบน้อย)

**ข้อความและการส่งมอบ**

- **`inbound_claim`** — อ้างสิทธิ์ข้อความขาเข้าก่อนการกำหนดเส้นทางเอเจนต์ (คำตอบสังเคราะห์)
- `message_received` — สังเกตเนื้อหาขาเข้า, ผู้ส่ง, เธรด, และเมตาดาต้า
- **`message_sending`** — เขียนเนื้อหาขาออกใหม่หรือยกเลิกการส่งมอบ
- `message_sent` — สังเกตความสำเร็จหรือความล้มเหลวของการส่งมอบขาออก
- **`before_dispatch`** — ตรวจสอบหรือเขียน dispatch ขาออกใหม่ก่อนส่งต่อให้ช่องทาง
- **`reply_dispatch`** — มีส่วนร่วมในไปป์ไลน์ dispatch คำตอบสุดท้าย

**เซสชันและ Compaction**

- `session_start` / `session_end` — ติดตามขอบเขตวงจรชีวิตเซสชัน
- `before_compaction` / `after_compaction` — สังเกตหรือใส่คำอธิบายประกอบรอบ Compaction
- `before_reset` — สังเกตเหตุการณ์รีเซ็ตเซสชัน (`/reset`, การรีเซ็ตแบบโปรแกรม)

**ซับเอเจนต์**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — ประสานการกำหนดเส้นทางซับเอเจนต์และการส่งมอบเมื่อเสร็จสิ้น

**วงจรชีวิต**

- `gateway_start` / `gateway_stop` — เริ่มหรือหยุดบริการที่ Plugin เป็นเจ้าของพร้อมกับ Gateway
- `cron_changed` — สังเกตการเปลี่ยนแปลงวงจรชีวิต Cron ที่ Gateway เป็นเจ้าของ (เพิ่มแล้ว, อัปเดตแล้ว, ลบแล้ว, เริ่มแล้ว, เสร็จแล้ว, จัดกำหนดการแล้ว)
- **`before_install`** — ตรวจสอบการสแกนติดตั้ง Skill หรือ Plugin และบล็อกได้ตามต้องการ

## นโยบายการเรียกเครื่องมือ

`before_tool_call` ได้รับ:

- `event.toolName`
- `event.params`
- `event.runId` ที่เป็นทางเลือก
- `event.toolCallId` ที่เป็นทางเลือก
- ฟิลด์บริบท เช่น `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ตั้งค่าในการรันที่ขับเคลื่อนด้วย Cron), และ `ctx.trace` สำหรับวินิจฉัย

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

- `block: true` เป็นจุดสิ้นสุดและข้ามตัวจัดการที่มี priority ต่ำกว่า
- `block: false` ถือว่าไม่มีการตัดสินใจ
- `params` เขียนพารามิเตอร์เครื่องมือใหม่สำหรับการทำงาน
- `requireApproval` หยุดการรันเอเจนต์ไว้ชั่วคราวและถามผู้ใช้ผ่านการอนุมัติของ Plugin
  คำสั่ง `/approve` สามารถอนุมัติทั้งการอนุมัติ exec และ Plugin ได้
- `block: true` จาก priority ที่ต่ำกว่ายังสามารถบล็อกได้หลังจากฮุก priority สูงกว่า
  ขออนุมัติแล้ว
- `onResolution` ได้รับผลการตัดสินใจอนุมัติที่ resolve แล้ว — `allow-once`,
  `allow-always`, `deny`, `timeout`, หรือ `cancelled`

Plugin ที่รวมมาและต้องใช้นโยบายระดับโฮสต์สามารถลงทะเบียนนโยบายเครื่องมือที่เชื่อถือได้
ด้วย `api.registerTrustedToolPolicy(...)` สิ่งเหล่านี้ทำงานก่อนฮุก
`before_tool_call` ทั่วไปและก่อนการตัดสินใจของ Plugin ภายนอก ใช้เฉพาะ
สำหรับด่านที่โฮสต์เชื่อถือ เช่น นโยบายเวิร์กสเปซ, การบังคับใช้งบประมาณ, หรือ
ความปลอดภัยของเวิร์กโฟลว์ที่สงวนไว้ Plugin ภายนอกควรใช้ฮุก `before_tool_call`
ปกติ

### การคงอยู่ของผลลัพธ์เครื่องมือ

ผลลัพธ์เครื่องมือสามารถมี `details` แบบมีโครงสร้างสำหรับการเรนเดอร์ UI, การวินิจฉัย,
การกำหนดเส้นทางสื่อ, หรือเมตาดาต้าที่ Plugin เป็นเจ้าของ ปฏิบัติต่อ `details` เป็นเมตาดาต้ารันไทม์
ไม่ใช่เนื้อหาพรอมป์:

- OpenClaw ตัด `toolResult.details` ออกก่อน replay ผู้ให้บริการและอินพุต Compaction
  เพื่อไม่ให้เมตาดาต้ากลายเป็นบริบทของโมเดล
- รายการเซสชันที่คงอยู่จะเก็บเฉพาะ `details` แบบจำกัด รายละเอียดที่ใหญ่เกินไปจะ
  ถูกแทนที่ด้วยสรุปย่อและ `persistedDetailsTruncated: true`
- `tool_result_persist` และ `before_message_write` ทำงานก่อนขีดจำกัดการคงอยู่สุดท้าย
  ฮุกยังควรรักษา `details` ที่คืนค่าให้เล็กและหลีกเลี่ยง
  การวางข้อความที่เกี่ยวข้องกับพรอมป์ไว้เฉพาะใน `details`; ใส่เอาต์พุตเครื่องมือที่โมเดลเห็นได้
  ไว้ใน `content`

## ฮุกพรอมป์และโมเดล

ใช้ฮุกเฉพาะเฟสสำหรับ Plugin ใหม่:

- `before_model_resolve`: ได้รับเฉพาะพรอมป์ปัจจุบันและ
  เมตาดาต้าไฟล์แนบ คืนค่า `providerOverride` หรือ `modelOverride`
- `agent_turn_prepare`: ได้รับพรอมป์ปัจจุบัน, ข้อความเซสชันที่เตรียมไว้,
  และการฉีดที่เข้าคิวแบบครั้งเดียวเป๊ะที่ถูกระบายออกสำหรับเซสชันนี้ คืนค่า
  `prependContext` หรือ `appendContext`
- `before_prompt_build`: ได้รับพรอมป์ปัจจุบันและข้อความเซสชัน
  คืนค่า `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, หรือ `appendSystemContext`
- `heartbeat_prompt_contribution`: ทำงานเฉพาะสำหรับรอบ Heartbeat และคืนค่า
  `prependContext` หรือ `appendContext` มีไว้สำหรับตัวเฝ้าติดตามเบื้องหลัง
  ที่ต้องสรุปสถานะปัจจุบันโดยไม่เปลี่ยนรอบที่ผู้ใช้เริ่ม

`before_agent_start` ยังคงอยู่เพื่อความเข้ากันได้ ควรใช้ฮุกที่ชัดเจนด้านบน
เพื่อให้ Plugin ของคุณไม่พึ่งพาเฟสรวมแบบดั้งเดิม

`before_agent_start` และ `agent_end` มี `event.runId` เมื่อ OpenClaw สามารถ
ระบุการรันที่ทำงานอยู่ได้ ค่าเดียวกันยังมีอยู่ใน `ctx.runId`
การรันที่ขับเคลื่อนด้วย Cron ยังเปิดเผย `ctx.jobId` (รหัสงาน Cron ต้นทาง) เพื่อให้
ฮุก Plugin สามารถจำกัดขอบเขตเมตริก, ผลข้างเคียง, หรือสถานะให้อยู่กับงานที่จัดกำหนดการเฉพาะได้

`agent_end` เป็นฮุกการสังเกตและทำงานแบบ fire-and-forget หลังจบรอบ
ตัวรันฮุกใช้ timeout 30 วินาทีเพื่อให้ Plugin หรือ endpoint embedding ที่ค้าง
ไม่ปล่อย promise ของฮุกให้ค้างอยู่ตลอดไป timeout จะถูกบันทึกใน log และ
OpenClaw ดำเนินต่อ; มันไม่ยกเลิกงานเครือข่ายที่ Plugin เป็นเจ้าของ เว้นแต่
Plugin จะใช้ abort signal ของตนเองด้วย

ใช้ `model_call_started` และ `model_call_ended` สำหรับ telemetry การเรียกผู้ให้บริการ
ที่ไม่ควรได้รับพรอมป์ดิบ, ประวัติ, คำตอบ, header, request
body, หรือรหัสคำขอของผู้ให้บริการ ฮุกเหล่านี้มีเมตาดาต้าที่เสถียร เช่น
`runId`, `callId`, `provider`, `model`, `api`/`transport` ที่เป็นทางเลือก, ค่า terminal
`durationMs`/`outcome`, และ `upstreamRequestIdHash` เมื่อ OpenClaw สามารถสร้าง
แฮชรหัสคำขอของผู้ให้บริการแบบจำกัดได้

`before_agent_finalize` ทำงานเฉพาะเมื่อ harness กำลังจะยอมรับ
คำตอบผู้ช่วยสุดท้ายตามธรรมชาติ ไม่ใช่เส้นทางการยกเลิก `/stop` และไม่
ทำงานเมื่อผู้ใช้ยกเลิกรอบ คืนค่า `{ action: "revise", reason }` เพื่อขอให้
harness ทำโมเดลเพิ่มอีกหนึ่งรอบก่อน finalize, `{ action:
"finalize", reason? }` เพื่อบังคับ finalize, หรือละผลลัพธ์เพื่อดำเนินต่อ
ฮุก `Stop` แบบ native ของ Codex จะถูกถ่ายทอดเข้าฮุกนี้เป็นการตัดสินใจ
`before_agent_finalize` ของ OpenClaw

Plugin ที่ไม่ได้รวมมาและต้องใช้ `llm_input`, `llm_output`,
`before_agent_finalize`, หรือ `agent_end` ต้องตั้งค่า:

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

ฮุกที่กลายพันธุ์พรอมป์และการฉีดรอบถัดไปแบบคงทนสามารถปิดใช้งานต่อ Plugin
ได้ด้วย `plugins.entries.<id>.hooks.allowPromptInjection=false`

### ส่วนขยายเซสชันและการฉีดรอบถัดไป

Plugin เวิร์กโฟลว์สามารถคงสถานะเซสชันขนาดเล็กที่เข้ากันได้กับ JSON ด้วย
`api.registerSessionExtension(...)` และอัปเดตผ่านเมธอด Gateway
`sessions.pluginPatch` แถวเซสชันจะ project สถานะส่วนขยายที่ลงทะเบียนไว้
ผ่าน `pluginExtensions` ทำให้ Control UI และไคลเอ็นต์อื่นเรนเดอร์
สถานะที่ Plugin เป็นเจ้าของได้โดยไม่ต้องเรียนรู้รายละเอียดภายในของ Plugin

ใช้ `api.enqueueNextTurnInjection(...)` เมื่อ Plugin ต้องการให้บริบทแบบคงทน
ไปถึงรอบโมเดลถัดไปเพียงครั้งเดียว OpenClaw ระบายการฉีดที่เข้าคิวไว้ก่อน
ฮุกพรอมป์, ทิ้งการฉีดที่หมดอายุ, และลบรายการซ้ำด้วย `idempotencyKey`
ต่อ Plugin นี่คือ seam ที่เหมาะสำหรับการกลับมาทำต่อหลังการอนุมัติ, สรุปนโยบาย,
เดลตาของตัวเฝ้าติดตามเบื้องหลัง, และการดำเนินต่อของคำสั่งที่ควรให้โมเดลเห็นได้
ในรอบถัดไป แต่ไม่ควรกลายเป็นข้อความพรอมป์ระบบถาวร

ความหมายของการ cleanup เป็นส่วนหนึ่งของสัญญา การ cleanup ส่วนขยายเซสชันและ
callback cleanup วงจรชีวิตรันไทม์ได้รับ `reset`, `delete`, `disable`, หรือ
`restart` โฮสต์จะลบสถานะส่วนขยายเซสชันถาวรของ Plugin เจ้าของ
และการฉีดรอบถัดไปที่ค้างอยู่สำหรับ reset/delete/disable; restart จะคง
สถานะเซสชันแบบคงทนไว้ ขณะที่ callback cleanup ให้ Plugin ปล่อยงาน scheduler,
บริบทรัน, และทรัพยากรนอกแบนด์อื่นสำหรับ generation รันไทม์เดิม

## ฮุกข้อความ

ใช้ฮุกข้อความสำหรับนโยบายการกำหนดเส้นทางและการส่งมอบระดับช่องทาง:

- `message_received`: สังเกตเนื้อหาขาเข้า, ผู้ส่ง, `threadId`, `messageId`,
  `senderId`, ความสัมพันธ์ run/session ที่เป็นทางเลือก, และเมตาดาต้า
- `message_sending`: เขียน `content` ใหม่หรือคืนค่า `{ cancel: true }`
- `message_sent`: สังเกตความสำเร็จหรือความล้มเหลวสุดท้าย

สำหรับการตอบกลับ TTS แบบเสียงเท่านั้น `content` อาจมีทรานสคริปต์เสียงพูดที่ซ่อนอยู่
แม้ว่า payload ของช่องทางจะไม่มีข้อความ/คำบรรยายที่มองเห็นได้ การเขียนใหม่ของ
`content` จะอัปเดตเฉพาะทรานสคริปต์ที่ฮุกมองเห็นเท่านั้น โดยจะไม่ถูกเรนเดอร์เป็น
คำบรรยายสื่อ

บริบทของฮุกข้อความจะแสดงฟิลด์ความสัมพันธ์ที่เสถียรเมื่อพร้อมใช้งาน:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, และ `ctx.callDepth` ให้ใช้
ฟิลด์ชั้นหนึ่งเหล่านี้ก่อนอ่านเมตาดาตาแบบเดิม

ให้ใช้ฟิลด์ `threadId` และ `replyToId` แบบมีชนิดก่อนใช้เมตาดาตาเฉพาะช่องทาง

กฎการตัดสินใจ:

- `message_sending` ที่มี `cancel: true` ถือเป็นสิ้นสุด
- `message_sending` ที่มี `cancel: false` ถือว่าไม่มีการตัดสินใจ
- `content` ที่เขียนใหม่จะยังส่งต่อไปยังฮุกที่มีลำดับความสำคัญต่ำกว่า เว้นแต่ฮุกภายหลัง
  จะยกเลิกการส่งมอบ

## ฮุกการติดตั้ง

`before_install` จะทำงานหลังการสแกนในตัวสำหรับการติดตั้ง skill และ Plugin
ให้ส่งคืนผลการตรวจพบเพิ่มเติมหรือ `{ block: true, blockReason }` เพื่อหยุด
การติดตั้ง

`block: true` ถือเป็นสิ้นสุด `block: false` ถือว่าไม่มีการตัดสินใจ

## วงจรชีวิตของ Gateway

ใช้ `gateway_start` สำหรับบริการ Plugin ที่ต้องการสถานะที่ Gateway เป็นเจ้าของ
บริบทจะแสดง `ctx.config`, `ctx.workspaceDir`, และ `ctx.getCron?.()` สำหรับ
การตรวจสอบและอัปเดต cron ใช้ `gateway_stop` เพื่อล้างทรัพยากรที่ทำงานยาวนาน

อย่าพึ่งพาฮุกภายใน `gateway:startup` สำหรับบริการ runtime ที่ Plugin เป็นเจ้าของ

`cron_changed` จะทริกเกอร์สำหรับเหตุการณ์วงจรชีวิต cron ที่ gateway เป็นเจ้าของ โดยมี
payload เหตุการณ์แบบมีชนิดที่ครอบคลุมเหตุผล `added`, `updated`, `removed`, `started`, `finished`,
และ `scheduled` เหตุการณ์จะพก snapshot ของ `PluginHookGatewayCronJob`
(รวมถึง `state.nextRunAtMs`, `state.lastRunStatus`, และ
`state.lastError` เมื่อมีอยู่) พร้อมด้วย `PluginHookGatewayCronDeliveryStatus`
ของ `not-requested` | `delivered` | `not-delivered` | `unknown` เหตุการณ์ที่ถูกลบ
ยังคงพก snapshot ของงานที่ลบแล้ว เพื่อให้ตัวจัดตารางภายนอกสามารถ
ปรับสถานะให้ตรงกันได้ ใช้ `ctx.getCron?.()` และ `ctx.config` จากบริบท runtime
เมื่อซิงค์ตัวจัดตารางปลุกภายนอก และให้ OpenClaw เป็น
แหล่งข้อมูลจริงสำหรับการตรวจสอบกำหนดเวลาและการดำเนินการ

## การเลิกใช้งานที่กำลังจะมาถึง

พื้นผิวบางส่วนที่อยู่ติดกับฮุกถูกเลิกใช้แล้วแต่ยังรองรับอยู่ ให้ย้าย
ก่อนรุ่น major ถัดไป:

- **ซองข้อความช่องทางแบบข้อความธรรมดา** ใน handler `inbound_claim` และ `message_received`
  อ่าน `BodyForAgent` และบล็อกบริบทผู้ใช้แบบมีโครงสร้าง
  แทนการแยกวิเคราะห์ข้อความซองแบบแบน ดู
  [ซองข้อความช่องทางแบบข้อความธรรมดา → BodyForAgent](/th/plugins/sdk-migration#active-deprecations)
- **`before_agent_start`** ยังคงมีไว้เพื่อความเข้ากันได้ Plugin ใหม่ควรใช้
  `before_model_resolve` และ `before_prompt_build` แทนเฟสแบบรวม
- **`onResolution` ใน `before_tool_call`** ตอนนี้ใช้ union แบบมีชนิด
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) แทน `string` แบบอิสระ

สำหรับรายการทั้งหมด ได้แก่ การลงทะเบียนความสามารถหน่วยความจำ, โปรไฟล์ thinking ของ provider,
provider การยืนยันตัวตนภายนอก, ชนิดการค้นพบ provider, ตัวเข้าถึง runtime ของงาน,
และการเปลี่ยนชื่อ `command-auth` → `command-status` ดู
[การย้าย Plugin SDK → การเลิกใช้งานที่มีผลอยู่](/th/plugins/sdk-migration#active-deprecations)

## ที่เกี่ยวข้อง

- [การย้าย Plugin SDK](/th/plugins/sdk-migration) — การเลิกใช้งานที่มีผลอยู่และไทม์ไลน์การลบ
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- [ฮุกภายใน](/th/automation/hooks)
- [ภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)
