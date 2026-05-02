---
read_when:
    - คุณกำลังสร้าง Plugin ที่ต้องใช้ before_tool_call, before_agent_reply, ฮุกข้อความ หรือฮุกวงจรชีวิต
    - คุณต้องบล็อก เขียนใหม่ หรือกำหนดให้การเรียกใช้เครื่องมือจาก Plugin ต้องได้รับการอนุมัติ
    - คุณกำลังตัดสินใจระหว่างฮุกภายในกับฮุกของ Plugin
summary: 'ฮุกของ Plugin: ดักจับเหตุการณ์วงจรชีวิตของเอเจนต์ เครื่องมือ ข้อความ เซสชัน และ Gateway'
title: ฮุกของ Plugin
x-i18n:
    generated_at: "2026-05-02T10:23:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

Hook ของ Plugin เป็นจุดขยายในโปรเซสสำหรับ Plugin ของ OpenClaw ใช้เมื่อ
Plugin ต้องตรวจสอบหรือเปลี่ยนแปลงการรันของเอเจนต์ การเรียกใช้เครื่องมือ โฟลว์ข้อความ
วงจรชีวิตเซสชัน การกำหนดเส้นทางซับเอเจนต์ การติดตั้ง หรือการเริ่มต้น Gateway

ใช้ [Hook ภายใน](/th/automation/hooks) แทนเมื่อคุณต้องการสคริปต์ `HOOK.md`
ขนาดเล็กที่ผู้ปฏิบัติงานติดตั้งไว้ สำหรับเหตุการณ์คำสั่งและ Gateway เช่น
`/new`, `/reset`, `/stop`, `agent:bootstrap` หรือ `gateway:startup`

## เริ่มต้นอย่างรวดเร็ว

ลงทะเบียน Hook ของ Plugin ที่มีชนิดกำกับด้วย `api.on(...)` จาก entry ของ Plugin:

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

ตัวจัดการ Hook จะรันตามลำดับจาก `priority` สูงไปต่ำ Hook ที่มีลำดับความสำคัญเท่ากัน
จะคงลำดับการลงทะเบียนไว้

`api.on(name, handler, opts?)` รับค่า:

- `priority` — ลำดับของตัวจัดการ (ค่าสูงกว่ารันก่อน)
- `timeoutMs` — งบเวลาต่อ Hook ที่เป็นตัวเลือก เมื่อกำหนดไว้ ตัวรัน Hook จะยกเลิก
  ตัวจัดการนั้นหลังจากงบเวลาหมดลง แล้วดำเนินการต่อกับตัวถัดไป แทนที่จะปล่อยให้
  งานตั้งค่าหรือเรียกคืนที่ช้ากิน timeout ของโมเดลที่ผู้เรียกกำหนดไว้
  ไม่ต้องระบุเพื่อใช้ timeout เริ่มต้นสำหรับการสังเกต/การตัดสินใจที่ตัวรัน
  Hook ใช้โดยทั่วไป

แต่ละ Hook จะได้รับ `event.context.pluginConfig` ซึ่งเป็น config ที่แก้ไขแล้วสำหรับ
Plugin ที่ลงทะเบียนตัวจัดการนั้น ใช้สำหรับการตัดสินใจของ Hook ที่ต้องใช้ตัวเลือก
Plugin ปัจจุบัน OpenClaw จะฉีดค่านี้ให้แต่ละตัวจัดการโดยไม่กลายพันธุ์อ็อบเจ็กต์เหตุการณ์
ร่วมที่ Plugin อื่นเห็น

## แค็ตตาล็อก Hook

Hook ถูกจัดกลุ่มตามพื้นผิวที่ขยาย ชื่อใน **ตัวหนา** รับผลลัพธ์การตัดสินใจ
(บล็อก ยกเลิก เขียนทับ หรือต้องขออนุมัติ) ส่วนที่เหลือทั้งหมดเป็นแบบสังเกตเท่านั้น

**เทิร์นของเอเจนต์**

- `before_model_resolve` — เขียนทับ provider หรือโมเดลก่อนโหลดข้อความเซสชัน
- `agent_turn_prepare` — ใช้การฉีดเทิร์นของ Plugin ที่อยู่ในคิว และเพิ่มบริบทในเทิร์นเดียวกันก่อน Hook ของพรอมป์
- `before_prompt_build` — เพิ่มบริบทแบบไดนามิกหรือข้อความ system prompt ก่อนการเรียกโมเดล
- `before_agent_start` — เฟสรวมสำหรับความเข้ากันได้เท่านั้น ควรใช้ Hook สองตัวข้างต้น
- **`before_agent_reply`** — ลัดวงจรเทิร์นของโมเดลด้วยคำตอบสังเคราะห์หรือความเงียบ
- **`before_agent_finalize`** — ตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้รันโมเดลอีกหนึ่งรอบ
- `agent_end` — สังเกตข้อความสุดท้าย สถานะความสำเร็จ และระยะเวลาการรัน
- `heartbeat_prompt_contribution` — เพิ่มบริบทเฉพาะ Heartbeat สำหรับ Plugin ตัวตรวจสอบเบื้องหลังและวงจรชีวิต

**การสังเกตบทสนทนา**

- `model_call_started` / `model_call_ended` — สังเกตเมตาดาต้าการเรียก provider/โมเดลที่ผ่านการทำให้ปลอดภัย เวลา ผลลัพธ์ และแฮช request-id แบบจำกัด โดยไม่มีเนื้อหาพรอมป์หรือคำตอบ
- `llm_input` — สังเกตอินพุตของ provider (system prompt, prompt, history)
- `llm_output` — สังเกตเอาต์พุตของ provider

**เครื่องมือ**

- **`before_tool_call`** — เขียนพารามิเตอร์เครื่องมือใหม่ บล็อกการทำงาน หรือต้องขออนุมัติ
- `after_tool_call` — สังเกตผลลัพธ์เครื่องมือ ข้อผิดพลาด และระยะเวลา
- **`tool_result_persist`** — เขียนข้อความผู้ช่วยที่สร้างจากผลลัพธ์เครื่องมือใหม่
- **`before_message_write`** — ตรวจสอบหรือบล็อกการเขียนข้อความที่กำลังดำเนินอยู่ (พบน้อย)

**ข้อความและการส่งมอบ**

- **`inbound_claim`** — claim ข้อความขาเข้าก่อนการกำหนดเส้นทางเอเจนต์ (คำตอบสังเคราะห์)
- `message_received` — สังเกตเนื้อหาขาเข้า ผู้ส่ง เธรด และเมตาดาต้า
- **`message_sending`** — เขียนเนื้อหาขาออกใหม่หรือยกเลิกการส่งมอบ
- `message_sent` — สังเกตความสำเร็จหรือความล้มเหลวของการส่งมอบขาออก
- **`before_dispatch`** — ตรวจสอบหรือเขียน dispatch ขาออกใหม่ก่อนส่งต่อให้ช่องทาง
- **`reply_dispatch`** — เข้าร่วมใน pipeline การ dispatch คำตอบสุดท้าย

**เซสชันและ Compaction**

- `session_start` / `session_end` — ติดตามขอบเขตวงจรชีวิตเซสชัน
- `before_compaction` / `after_compaction` — สังเกตหรือใส่คำอธิบายประกอบรอบ Compaction
- `before_reset` — สังเกตเหตุการณ์รีเซ็ตเซสชัน (`/reset`, การรีเซ็ตเชิงโปรแกรม)

**ซับเอเจนต์**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — ประสานการกำหนดเส้นทางซับเอเจนต์และการส่งมอบเมื่อเสร็จสิ้น

**วงจรชีวิต**

- `gateway_start` / `gateway_stop` — เริ่มหรือหยุดบริการที่ Plugin เป็นเจ้าของพร้อมกับ Gateway
- `cron_changed` — สังเกตการเปลี่ยนแปลงวงจรชีวิต Cron ที่ Gateway เป็นเจ้าของ (เพิ่ม อัปเดต ลบ เริ่ม เสร็จสิ้น ตั้งเวลา)
- **`before_install`** — ตรวจสอบการสแกนการติดตั้ง Skills หรือ Plugin และเลือกบล็อกได้

## นโยบายการเรียกเครื่องมือ

`before_tool_call` ได้รับ:

- `event.toolName`
- `event.params`
- `event.runId` ที่เป็นตัวเลือก
- `event.toolCallId` ที่เป็นตัวเลือก
- ฟิลด์บริบท เช่น `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (กำหนดในการรันที่ขับเคลื่อนด้วย Cron) และ `ctx.trace` สำหรับวินิจฉัย

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

- `block: true` เป็นปลายทางและข้ามตัวจัดการที่มีลำดับความสำคัญต่ำกว่า
- `block: false` ถือว่าไม่มีการตัดสินใจ
- `params` เขียนพารามิเตอร์เครื่องมือใหม่สำหรับการดำเนินการ
- `requireApproval` หยุดการรันเอเจนต์ชั่วคราวและถามผู้ใช้ผ่านการอนุมัติของ Plugin
  คำสั่ง `/approve` สามารถอนุมัติได้ทั้งการอนุมัติ exec และ Plugin
- `block: true` ที่มีลำดับความสำคัญต่ำกว่ายังสามารถบล็อกได้หลังจาก Hook ที่มีลำดับความสำคัญสูงกว่าขออนุมัติแล้ว
- `onResolution` ได้รับการตัดสินใจอนุมัติที่แก้ไขแล้ว — `allow-once`,
  `allow-always`, `deny`, `timeout` หรือ `cancelled`

Plugin ที่มาพร้อมระบบซึ่งต้องใช้นโยบายระดับโฮสต์สามารถลงทะเบียนนโยบายเครื่องมือที่เชื่อถือได้
ด้วย `api.registerTrustedToolPolicy(...)` นโยบายเหล่านี้จะรันก่อน Hook
`before_tool_call` ปกติและก่อนการตัดสินใจของ Plugin ภายนอก ใช้เฉพาะกับ
gate ที่โฮสต์เชื่อถือ เช่น นโยบายพื้นที่ทำงาน การบังคับใช้งบประมาณ หรือ
ความปลอดภัยของเวิร์กโฟลว์ที่สงวนไว้ Plugin ภายนอกควรใช้ Hook `before_tool_call`
ตามปกติ

### การคงอยู่ของผลลัพธ์เครื่องมือ

ผลลัพธ์เครื่องมือสามารถมี `details` แบบมีโครงสร้างสำหรับการเรนเดอร์ UI การวินิจฉัย
การกำหนดเส้นทางสื่อ หรือเมตาดาต้าที่ Plugin เป็นเจ้าของ ให้ถือว่า `details` เป็นเมตาดาต้ารันไทม์
ไม่ใช่เนื้อหาพรอมป์:

- OpenClaw ลบ `toolResult.details` ก่อน replay ของ provider และอินพุต Compaction
  เพื่อไม่ให้เมตาดาต้ากลายเป็นบริบทของโมเดล
- รายการเซสชันที่ถูกคงไว้จะเก็บเฉพาะ `details` แบบจำกัด รายละเอียดที่ใหญ่เกินไปจะ
  ถูกแทนที่ด้วยสรุปแบบกะทัดรัดและ `persistedDetailsTruncated: true`
- `tool_result_persist` และ `before_message_write` รันก่อนขีดจำกัดการคงอยู่สุดท้าย
  Hook ยังคงควรทำให้ `details` ที่คืนมามีขนาดเล็ก และหลีกเลี่ยงการวาง
  ข้อความที่เกี่ยวข้องกับพรอมป์ไว้เฉพาะใน `details`; ใส่เอาต์พุตเครื่องมือที่โมเดลเห็นได้
  ใน `content`

## Hook ของพรอมป์และโมเดล

ใช้ Hook เฉพาะเฟสสำหรับ Plugin ใหม่:

- `before_model_resolve`: ได้รับเฉพาะพรอมป์ปัจจุบันและเมตาดาต้าไฟล์แนบ
  คืนค่า `providerOverride` หรือ `modelOverride`
- `agent_turn_prepare`: ได้รับพรอมป์ปัจจุบัน ข้อความเซสชันที่เตรียมแล้ว
  และการฉีดที่อยู่ในคิวแบบ exactly-once ซึ่งถูก drain สำหรับเซสชันนี้ คืนค่า
  `prependContext` หรือ `appendContext`
- `before_prompt_build`: ได้รับพรอมป์ปัจจุบันและข้อความเซสชัน
  คืนค่า `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` หรือ `appendSystemContext`
- `heartbeat_prompt_contribution`: รันเฉพาะสำหรับเทิร์น Heartbeat และคืนค่า
  `prependContext` หรือ `appendContext` มีไว้สำหรับตัวตรวจสอบเบื้องหลัง
  ที่ต้องสรุปสถานะปัจจุบันโดยไม่เปลี่ยนเทิร์นที่ผู้ใช้เริ่ม

`before_agent_start` ยังคงอยู่เพื่อความเข้ากันได้ ควรใช้ Hook ที่ชัดเจนข้างต้น
เพื่อให้ Plugin ของคุณไม่พึ่งพาเฟสรวมแบบเดิม

`before_agent_start` และ `agent_end` รวม `event.runId` เมื่อ OpenClaw สามารถ
ระบุการรันที่ใช้งานอยู่ได้ ค่าเดียวกันยังอยู่ใน `ctx.runId` ด้วย
การรันที่ขับเคลื่อนด้วย Cron ยังเปิดเผย `ctx.jobId` (id งาน Cron ต้นทาง) เพื่อให้
Hook ของ Plugin สามารถจำกัดขอบเขตเมตริก ผลข้างเคียง หรือสถานะไว้กับงานที่ตั้งเวลาไว้เฉพาะเจาะจง

สำหรับการรันที่มีที่มาจากช่องทาง `ctx.messageProvider` คือพื้นผิว provider เช่น
`discord` หรือ `telegram` ส่วน `ctx.channelId` คือ identifier เป้าหมายของบทสนทนา
เมื่อ OpenClaw สามารถอนุมานได้จาก session key หรือเมตาดาต้าการส่งมอบ

`agent_end` เป็น Hook สำหรับสังเกต และรันแบบ fire-and-forget หลังจบเทิร์น
ตัวรัน Hook ใช้ timeout 30 วินาที เพื่อให้ Plugin หรือ endpoint embedding
ที่ค้างไม่สามารถปล่อยให้ promise ของ Hook ค้างอยู่ตลอดไปได้ timeout จะถูกบันทึก log และ
OpenClaw จะดำเนินการต่อ; มันไม่ยกเลิกงานเครือข่ายที่ Plugin เป็นเจ้าของ เว้นแต่
Plugin จะใช้ abort signal ของตัวเองด้วย

ใช้ `model_call_started` และ `model_call_ended` สำหรับ telemetry ของการเรียก provider
ที่ไม่ควรได้รับพรอมป์ดิบ ประวัติ คำตอบ header เนื้อหา request
หรือ request ID ของ provider Hook เหล่านี้รวมเมตาดาต้าที่เสถียร เช่น
`runId`, `callId`, `provider`, `model`, `api`/`transport` ที่เป็นตัวเลือก,
`durationMs`/`outcome` ปลายทาง และ `upstreamRequestIdHash` เมื่อ OpenClaw สามารถอนุมาน
แฮช request-id ของ provider แบบจำกัดได้

`before_agent_finalize` รันเฉพาะเมื่อ harness กำลังจะยอมรับคำตอบผู้ช่วยสุดท้ายตามธรรมชาติ
ไม่ใช่เส้นทางการยกเลิก `/stop` และไม่รันเมื่อผู้ใช้ยกเลิกเทิร์น คืนค่า `{ action: "revise", reason }`
เพื่อขอให้ harness รันโมเดลอีกหนึ่งรอบก่อน finalization, `{ action:
"finalize", reason? }` เพื่อบังคับ finalization หรือไม่ต้องคืนผลลัพธ์เพื่อดำเนินการต่อ
Hook `Stop` แบบ native ของ Codex จะถูกส่งต่อเข้ามาใน Hook นี้เป็นการตัดสินใจ
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

Hook ที่กลายพันธุ์พรอมป์และการฉีดเทิร์นถัดไปแบบคงทนสามารถปิดได้ต่อ Plugin
ด้วย `plugins.entries.<id>.hooks.allowPromptInjection=false`

### ส่วนขยายเซสชันและการฉีดเทิร์นถัดไป

Plugin เวิร์กโฟลว์สามารถคงสถานะเซสชันขนาดเล็กที่เข้ากันได้กับ JSON ด้วย
`api.registerSessionExtension(...)` และอัปเดตผ่านเมธอด
`sessions.pluginPatch` ของ Gateway แถวเซสชันจะ project สถานะส่วนขยายที่ลงทะเบียนไว้
ผ่าน `pluginExtensions` ทำให้ Control UI และ client อื่นสามารถเรนเดอร์
สถานะที่ Plugin เป็นเจ้าของโดยไม่ต้องรู้ internals ของ Plugin

ใช้ `api.enqueueNextTurnInjection(...)` เมื่อ Plugin ต้องการบริบทแบบคงทนให้
ถึงเทิร์นโมเดลถัดไปพอดีหนึ่งครั้ง OpenClaw จะ drain การฉีดที่อยู่ในคิวก่อน
Hook ของพรอมป์ ทิ้งการฉีดที่หมดอายุ และ deduplicate ด้วย `idempotencyKey`
ต่อ Plugin นี่คือ seam ที่เหมาะสำหรับการกลับมาทำงานต่อหลังอนุมัติ สรุปนโยบาย
delta ของตัวตรวจสอบเบื้องหลัง และการต่อเนื่องของคำสั่งที่ควรมองเห็นได้ต่อ
โมเดลในเทิร์นถัดไป แต่ไม่ควรกลายเป็นข้อความ system prompt ถาวร

ความหมายของการล้างข้อมูลเป็นส่วนหนึ่งของสัญญา callback สำหรับการล้างข้อมูลส่วนขยายเซสชันและ
การล้างข้อมูลวงจรชีวิตรันไทม์จะได้รับ `reset`, `delete`, `disable` หรือ
`restart` โฮสต์จะลบสถานะส่วนขยายเซสชันถาวรของ Plugin เจ้าของ
และการฉีดเทิร์นถัดไปที่ค้างอยู่สำหรับ reset/delete/disable; restart จะเก็บ
สถานะเซสชันแบบคงทนไว้ ขณะที่ callback การล้างข้อมูลให้ Plugin ปล่อยงาน scheduler
บริบทการรัน และทรัพยากรนอกแบนด์อื่นของ generation รันไทม์เก่า

## Hook ของข้อความ

ใช้ Hook ของข้อความสำหรับนโยบายการกำหนดเส้นทางและการส่งมอบระดับช่องทาง:

- `message_received`: สังเกตเนื้อหาขาเข้า ผู้ส่ง `threadId`, `messageId`,
  `senderId`, ความสัมพันธ์ของ run/session แบบไม่บังคับ และ metadata.
- `message_sending`: เขียน `content` ใหม่หรือส่งคืน `{ cancel: true }`.
- `message_sent`: สังเกตความสำเร็จหรือความล้มเหลวสุดท้าย.

สำหรับการตอบกลับ TTS แบบเสียงเท่านั้น `content` อาจมีทรานสคริปต์เสียงพูดที่ซ่อนอยู่
แม้เมื่อ payload ของช่องทางไม่มีข้อความ/คำบรรยายภาพที่มองเห็นได้ การเขียน
`content` นั้นใหม่จะอัปเดตเฉพาะทรานสคริปต์ที่ hook มองเห็นเท่านั้น; จะไม่ถูกแสดงเป็น
คำบรรยายสื่อ

บริบทของ message hook เปิดเผยฟิลด์ความสัมพันธ์ที่เสถียรเมื่อพร้อมใช้งาน:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, และ `ctx.callDepth` ควรใช้
ฟิลด์ชั้นหนึ่งเหล่านี้ก่อนอ่าน metadata เดิม

ควรใช้ฟิลด์ `threadId` และ `replyToId` ที่มีชนิดกำกับก่อนใช้ metadata
เฉพาะช่องทาง

กฎการตัดสินใจ:

- `message_sending` ที่มี `cancel: true` เป็นปลายทางสุดท้าย
- `message_sending` ที่มี `cancel: false` จะถือว่าไม่มีการตัดสินใจ
- `content` ที่เขียนใหม่จะส่งต่อไปยัง hook ที่มีลำดับความสำคัญต่ำกว่าต่อไป เว้นแต่ hook ภายหลัง
  จะยกเลิกการส่ง

## ติดตั้ง hook

`before_install` ทำงานหลังจากการสแกนในตัวสำหรับการติดตั้ง skill และ Plugin
ส่งคืนผลการค้นหาเพิ่มเติมหรือ `{ block: true, blockReason }` เพื่อหยุด
การติดตั้ง

`block: true` เป็นปลายทางสุดท้าย `block: false` จะถือว่าไม่มีการตัดสินใจ

## วงจรชีวิต Gateway

ใช้ `gateway_start` สำหรับบริการ Plugin ที่ต้องใช้สถานะที่ Gateway เป็นเจ้าของ
บริบทเปิดเผย `ctx.config`, `ctx.workspaceDir`, และ `ctx.getCron?.()` สำหรับ
การตรวจสอบและอัปเดต Cron ใช้ `gateway_stop` เพื่อล้าง
ทรัพยากรที่ทำงานระยะยาว

อย่าพึ่งพา hook ภายใน `gateway:startup` สำหรับบริการรันไทม์ที่ Plugin เป็นเจ้าของ

`cron_changed` ทำงานสำหรับเหตุการณ์วงจรชีวิต Cron ที่ Gateway เป็นเจ้าของ พร้อม payload
เหตุการณ์แบบมีชนิดกำกับที่ครอบคลุมเหตุผล `added`, `updated`, `removed`, `started`, `finished`,
และ `scheduled` เหตุการณ์จะพก snapshot ของ `PluginHookGatewayCronJob`
(รวมถึง `state.nextRunAtMs`, `state.lastRunStatus`, และ
`state.lastError` เมื่อมีอยู่) พร้อม `PluginHookGatewayCronDeliveryStatus`
เป็น `not-requested` | `delivered` | `not-delivered` | `unknown` เหตุการณ์ที่ถูกลบ
ยังคงพก snapshot ของงานที่ถูกลบ เพื่อให้ตัวจัดกำหนดการภายนอกสามารถ
ปรับสถานะให้สอดคล้องกันได้ ใช้ `ctx.getCron?.()` และ `ctx.config` จากบริบท
รันไทม์เมื่อซิงก์ตัวจัดกำหนดการปลุกภายนอก และให้ OpenClaw เป็น
แหล่งความจริงสำหรับการตรวจสอบกำหนดเวลาและการดำเนินการ

## การเลิกใช้งานที่กำลังจะมาถึง

พื้นผิวบางส่วนที่เกี่ยวข้องกับ hook ถูกเลิกใช้แล้วแต่ยังคงรองรับอยู่ ให้ย้าย
ก่อนรุ่นหลักถัดไป:

- **envelope ช่องทางแบบ plaintext** ในตัวจัดการ `inbound_claim` และ `message_received`
  อ่าน `BodyForAgent` และบล็อกบริบทผู้ใช้แบบมีโครงสร้าง
  แทนการแยกวิเคราะห์ข้อความ envelope แบบแบน ดู
  [envelope ช่องทางแบบ plaintext → BodyForAgent](/th/plugins/sdk-migration#active-deprecations)
- **`before_agent_start`** ยังคงมีอยู่เพื่อความเข้ากันได้ Plugin ใหม่ควรใช้
  `before_model_resolve` และ `before_prompt_build` แทนเฟส
  ที่รวมกัน
- **`onResolution` ใน `before_tool_call`** ตอนนี้ใช้ union แบบมีชนิดกำกับ
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) แทน `string` แบบอิสระ

สำหรับรายการทั้งหมด — การลงทะเบียนความสามารถ memory, โปรไฟล์การคิดของ provider,
provider auth ภายนอก, ชนิดการค้นพบ provider, accessor รันไทม์ของ task,
และการเปลี่ยนชื่อ `command-auth` → `command-status` — ดู
[การย้าย Plugin SDK → การเลิกใช้งานที่ใช้งานอยู่](/th/plugins/sdk-migration#active-deprecations)

## ที่เกี่ยวข้อง

- [การย้าย Plugin SDK](/th/plugins/sdk-migration) — การเลิกใช้งานที่ใช้งานอยู่และไทม์ไลน์การนำออก
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [entry point ของ Plugin](/th/plugins/sdk-entrypoints)
- [hook ภายใน](/th/automation/hooks)
- [ภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)
