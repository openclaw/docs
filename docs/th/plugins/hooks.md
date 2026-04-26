---
read_when:
    - คุณกำลังสร้าง Plugin ที่ต้องใช้ before_tool_call, before_agent_reply, message hooks หรือ lifecycle hooks
    - คุณต้องบล็อก เขียนใหม่ หรือกำหนดให้ต้องมีการอนุมัติสำหรับการเรียกใช้เครื่องมือจาก Plugin
    - คุณกำลังตัดสินใจเลือกระหว่าง hooks ภายในกับ Plugin hooks
summary: 'Plugin hooks: ดักจับเหตุการณ์ในวงจรชีวิตของเอเจนต์ เครื่องมือ ข้อความ เซสชัน และ Gateway'
title: Plugin hooks
x-i18n:
    generated_at: "2026-04-26T11:37:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin hooks คือจุดขยายแบบ in-process สำหรับปลั๊กอิน OpenClaw ใช้เมื่อปลั๊กอิน
ต้องตรวจสอบหรือเปลี่ยนแปลงการรันของเอเจนต์ การเรียกใช้เครื่องมือ การไหลของข้อความ
วงจรชีวิตของเซสชัน การกำหนดเส้นทาง subagent การติดตั้ง หรือการเริ่มต้น Gateway

ให้ใช้ [internal hooks](/th/automation/hooks) แทน เมื่อคุณต้องการสคริปต์ `HOOK.md`
ขนาดเล็กที่ผู้ปฏิบัติการติดตั้งเองสำหรับคำสั่งและเหตุการณ์ของ Gateway เช่น
`/new`, `/reset`, `/stop`, `agent:bootstrap` หรือ `gateway:startup`

## เริ่มต้นอย่างรวดเร็ว

ลงทะเบียน Plugin hooks แบบมีชนิดด้วย `api.on(...)` จาก entry ของปลั๊กอินของคุณ:

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

ตัวจัดการ hook จะทำงานตามลำดับแบบ sequential โดยเรียง `priority` จากมากไปน้อย hooks
ที่มีลำดับความสำคัญเท่ากันจะคงลำดับการลงทะเบียนไว้

## แค็ตตาล็อก hooks

Hooks ถูกจัดกลุ่มตามพื้นผิวที่ขยาย ชื่อที่เป็น **ตัวหนา** รองรับ
ผลลัพธ์แบบตัดสินใจ (บล็อก ยกเลิก แทนที่ หรือกำหนดให้ต้องอนุมัติ); ที่เหลือทั้งหมดใช้เพื่อสังเกตการณ์เท่านั้น

**รอบการทำงานของเอเจนต์**

- `before_model_resolve` — แทนที่ provider หรือ model ก่อนโหลดข้อความของเซสชัน
- `before_prompt_build` — เพิ่มบริบทแบบไดนามิกหรือข้อความ system-prompt ก่อนการเรียก model
- `before_agent_start` — เฟสแบบรวมที่มีไว้เพื่อความเข้ากันได้เท่านั้น; ควรใช้สอง hooks ด้านบนแทน
- **`before_agent_reply`** — ตัดจบรอบการทำงานของ model ด้วยคำตอบสังเคราะห์หรือความเงียบ
- **`before_agent_finalize`** — ตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้ model ผ่านอีกหนึ่งรอบ
- `agent_end` — สังเกตข้อความสุดท้าย สถานะความสำเร็จ และระยะเวลาการรัน

**การสังเกตการณ์การสนทนา**

- `model_call_started` / `model_call_ended` — สังเกตเมทาดาทาการเรียก provider/model ที่ผ่านการทำให้ปลอดภัยแล้ว ระยะเวลา ผลลัพธ์ และค่าแฮช request-id แบบมีขอบเขต โดยไม่มีเนื้อหา prompt หรือ response
- `llm_input` — สังเกตอินพุตของ provider (system prompt, prompt, history)
- `llm_output` — สังเกตเอาต์พุตของ provider

**เครื่องมือ**

- **`before_tool_call`** — เขียนพารามิเตอร์ของเครื่องมือใหม่ บล็อกการทำงาน หรือกำหนดให้ต้องอนุมัติ
- `after_tool_call` — สังเกตผลลัพธ์ของเครื่องมือ ข้อผิดพลาด และระยะเวลา
- **`tool_result_persist`** — เขียนข้อความ assistant ที่ได้จากผลลัพธ์ของเครื่องมือใหม่
- **`before_message_write`** — ตรวจสอบหรือบล็อกการเขียนข้อความที่กำลังดำเนินอยู่ (พบไม่บ่อย)

**ข้อความและการส่งมอบ**

- **`inbound_claim`** — รับช่วงข้อความขาเข้าก่อนการกำหนดเส้นทางไปยังเอเจนต์ (คำตอบสังเคราะห์)
- `message_received` — สังเกตเนื้อหาขาเข้า ผู้ส่ง เธรด และเมทาดาทา
- **`message_sending`** — เขียนเนื้อหาขาออกใหม่หรือยกเลิกการส่ง
- `message_sent` — สังเกตความสำเร็จหรือความล้มเหลวของการส่งขาออก
- **`before_dispatch`** — ตรวจสอบหรือเขียน dispatch ขาออกใหม่ก่อนส่งต่อให้ channel
- **`reply_dispatch`** — มีส่วนร่วมในไปป์ไลน์การ dispatch คำตอบขั้นสุดท้าย

**เซสชันและ Compaction**

- `session_start` / `session_end` — ติดตามขอบเขตวงจรชีวิตของเซสชัน
- `before_compaction` / `after_compaction` — สังเกตหรือใส่คำอธิบายประกอบให้รอบการทำ Compaction
- `before_reset` — สังเกตเหตุการณ์รีเซ็ตเซสชัน (`/reset`, การรีเซ็ตแบบเป็นโปรแกรม)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — ประสานการกำหนดเส้นทางและการส่งมอบเมื่อเสร็จสิ้นของ subagent

**วงจรชีวิต**

- `gateway_start` / `gateway_stop` — เริ่มหรือหยุดบริการที่ปลั๊กอินเป็นเจ้าของพร้อมกับ Gateway
- **`before_install`** — ตรวจสอบการสแกนการติดตั้ง skill หรือ plugin และเลือกที่จะบล็อกได้

## นโยบายการเรียกใช้เครื่องมือ

`before_tool_call` จะได้รับ:

- `event.toolName`
- `event.params`
- `event.runId` แบบเลือกได้
- `event.toolCallId` แบบเลือกได้
- ฟิลด์บริบท เช่น `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (กำหนดบนการรันที่ขับเคลื่อนด้วย cron) และ `ctx.trace` สำหรับการวินิจฉัย

สามารถส่งกลับได้เป็น:

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

- `block: true` เป็นคำตัดสินสุดท้ายและจะข้าม handlers ที่มีลำดับความสำคัญต่ำกว่า
- `block: false` จะถือว่าไม่มีการตัดสินใจ
- `params` จะเขียนพารามิเตอร์ของเครื่องมือใหม่สำหรับการทำงาน
- `requireApproval` จะหยุดการรันของเอเจนต์ชั่วคราวและถามผู้ใช้ผ่านการอนุมัติของ plugin
  คำสั่ง `/approve` สามารถอนุมัติได้ทั้ง exec และการอนุมัติของ plugin
- `block: true` จาก hook ที่มีลำดับความสำคัญต่ำกว่ายังสามารถบล็อกได้หลังจาก hook ที่มีลำดับความสำคัญสูงกว่าร้องขอการอนุมัติแล้ว
- `onResolution` จะได้รับผลการอนุมัติที่สิ้นสุดแล้ว — `allow-once`,
  `allow-always`, `deny`, `timeout` หรือ `cancelled`

### การคงผลลัพธ์ของเครื่องมือ

ผลลัพธ์ของเครื่องมืออาจมี `details` แบบมีโครงสร้างสำหรับการเรนเดอร์ใน UI การวินิจฉัย
การกำหนดเส้นทางสื่อ หรือเมทาดาทาที่ปลั๊กอินเป็นเจ้าของ ให้ถือว่า `details` เป็นเมทาดาทาระหว่างรันไทม์
ไม่ใช่เนื้อหาของ prompt:

- OpenClaw จะตัด `toolResult.details` ออกก่อนการเล่นซ้ำให้ provider และอินพุตของ Compaction เพื่อไม่ให้เมทาดาทากลายเป็นบริบทของ model
- รายการเซสชันที่ถูกคงไว้จะเก็บเฉพาะ `details` แบบมีขอบเขต รายละเอียดที่ใหญ่เกินไป
  จะถูกแทนที่ด้วยสรุปแบบกะทัดรัดและ `persistedDetailsTruncated: true`
- `tool_result_persist` และ `before_message_write` จะทำงานก่อนถึงขีดจำกัดการคงข้อมูลขั้นสุดท้าย
  Hooks ควรรักษา `details` ที่ส่งกลับให้มีขนาดเล็ก และหลีกเลี่ยงการใส่ข้อความที่เกี่ยวข้องกับ prompt ไว้เฉพาะใน `details`; ให้นำเอาต์พุตเครื่องมือที่ model มองเห็นได้
  ใส่ไว้ใน `content`

## Prompt และ model hooks

ให้ใช้ hooks ตามเฟสสำหรับปลั๊กอินใหม่:

- `before_model_resolve`: จะได้รับเฉพาะ prompt ปัจจุบันและเมทาดาทาของไฟล์แนบ
  ส่งกลับ `providerOverride` หรือ `modelOverride`
- `before_prompt_build`: จะได้รับ prompt ปัจจุบันและข้อความของเซสชัน
  ส่งกลับ `prependContext`, `systemPrompt`, `prependSystemContext` หรือ
  `appendSystemContext`

`before_agent_start` ยังคงมีไว้เพื่อความเข้ากันได้ ควรใช้ explicit hooks ข้างต้น
เพื่อให้ปลั๊กอินของคุณไม่ต้องพึ่งพาเฟสแบบรวมรุ่นเก่า

`before_agent_start` และ `agent_end` มี `event.runId` รวมอยู่ด้วยเมื่อ OpenClaw สามารถ
ระบุการรันที่กำลังทำงานอยู่ได้ ค่าเดียวกันนี้ยังมีอยู่ใน `ctx.runId` ด้วย
การรันที่ขับเคลื่อนด้วย Cron ยังเปิดเผย `ctx.jobId` (id ของงาน cron ต้นทาง) เพื่อให้
Plugin hooks สามารถกำหนดขอบเขตของ metrics, side effects หรือสถานะไปยังงานตามกำหนดเวลา
งานใดงานหนึ่งโดยเฉพาะได้

ใช้ `model_call_started` และ `model_call_ended` สำหรับเทเลเมทรีการเรียก provider
ที่ไม่ควรได้รับ prompt ดิบ history responses headers request
bodies หรือ request ID ของ provider hooks เหล่านี้จะมีเมทาดาทาที่เสถียร เช่น
`runId`, `callId`, `provider`, `model`, `api`/`transport` แบบเลือกได้,
`durationMs`/`outcome` เมื่อสิ้นสุด และ `upstreamRequestIdHash` เมื่อ OpenClaw สามารถสร้าง
แฮช request-id ของ provider แบบมีขอบเขตได้

`before_agent_finalize` จะทำงานเฉพาะเมื่อ harness กำลังจะยอมรับ
คำตอบ assistant ขั้นสุดท้ายตามธรรมชาติ ไม่ใช่เส้นทางการยกเลิก `/stop` และจะไม่
ทำงานเมื่อผู้ใช้ยกเลิกรอบการทำงาน ส่งกลับ `{ action: "revise", reason }` เพื่อขอให้
harness ให้ model ผ่านอีกหนึ่งรอบก่อน finalize, `{ action:
"finalize", reason? }` เพื่อบังคับให้ finalize หรือไม่ต้องส่งผลลัพธ์กลับเพื่อดำเนินการต่อ
hooks `Stop` แบบ native ของ Codex จะถูกส่งต่อมายัง hook นี้ในรูป
การตัดสินใจ `before_agent_finalize` ของ OpenClaw

ปลั๊กอินที่ไม่ได้ bundled ซึ่งต้องใช้ `llm_input`, `llm_output`,
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

hooks ที่เปลี่ยน prompt สามารถปิดใช้งานเป็นรายปลั๊กอินได้ด้วย
`plugins.entries.<id>.hooks.allowPromptInjection=false`

## Message hooks

ใช้ message hooks สำหรับนโยบายการกำหนดเส้นทางและการส่งมอบในระดับ channel:

- `message_received`: สังเกตเนื้อหาขาเข้า ผู้ส่ง `threadId`, `messageId`,
  `senderId`, ความเชื่อมโยงกับ run/session แบบเลือกได้ และเมทาดาทา
- `message_sending`: เขียน `content` ใหม่หรือส่งกลับ `{ cancel: true }`
- `message_sent`: สังเกตความสำเร็จหรือความล้มเหลวขั้นสุดท้าย

สำหรับคำตอบ TTS แบบเสียงอย่างเดียว `content` อาจมีทรานสคริปต์คำพูดแบบซ่อนอยู่
แม้ payload ของ channel จะไม่มีข้อความ/คำบรรยายภาพที่มองเห็นได้ การเขียน
`content` นั้นใหม่จะอัปเดตเฉพาะทรานสคริปต์ที่มองเห็นได้จาก hook; จะไม่ถูกเรนเดอร์เป็น
คำบรรยายของสื่อ

บริบทของ message hook จะเปิดเผยฟิลด์ความเชื่อมโยงที่เสถียรเมื่อมีให้ใช้:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` และ `ctx.callDepth` ควรใช้
ฟิลด์ first-class เหล่านี้ก่อนอ่านเมทาดาทาแบบเดิม

ควรใช้ฟิลด์ `threadId` และ `replyToId` แบบมีชนิดก่อนใช้
เมทาดาทาเฉพาะของ channel

กฎการตัดสินใจ:

- `message_sending` ที่มี `cancel: true` เป็นคำตัดสินสุดท้าย
- `message_sending` ที่มี `cancel: false` จะถือว่าไม่มีการตัดสินใจ
- `content` ที่ถูกเขียนใหม่จะส่งต่อไปยัง hooks ที่มีลำดับความสำคัญต่ำกว่าต่อไป เว้นแต่ hook ถัดมาจะยกเลิกการส่ง

## Install hooks

`before_install` จะทำงานหลังจากการสแกนในตัวสำหรับการติดตั้ง skill และ plugin
ส่งกลับ findings เพิ่มเติม หรือ `{ block: true, blockReason }` เพื่อหยุด
การติดตั้ง

`block: true` เป็นคำตัดสินสุดท้าย `block: false` จะถือว่าไม่มีการตัดสินใจ

## วงจรชีวิตของ Gateway

ใช้ `gateway_start` สำหรับบริการของปลั๊กอินที่ต้องใช้สถานะที่ Gateway เป็นเจ้าของ
บริบทจะเปิดเผย `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับ
การตรวจสอบและอัปเดต cron ใช้ `gateway_stop` เพื่อทำความสะอาดทรัพยากรที่ทำงานระยะยาว

อย่าพึ่งพา hook ภายใน `gateway:startup` สำหรับบริการรันไทม์ที่ปลั๊กอินเป็นเจ้าของ

## การเลิกใช้งานที่กำลังจะมาถึง

มีพื้นผิวใกล้เคียงกับ hook บางส่วนที่ถูกเลิกใช้งานแล้วแต่ยังรองรับอยู่ ควรย้ายออก
ก่อนการออกรุ่นหลักถัดไป:

- **ซองข้อความ channel แบบ plaintext** ใน handlers ของ `inbound_claim` และ `message_received`
  ให้ใช้ `BodyForAgent` และบล็อกบริบทผู้ใช้แบบมีโครงสร้าง
  แทนการแยกวิเคราะห์ข้อความ envelope แบบแบน ดู
  [Plaintext channel envelopes → BodyForAgent](/th/plugins/sdk-migration#active-deprecations)
- **`before_agent_start`** ยังคงอยู่เพื่อความเข้ากันได้ ปลั๊กอินใหม่ควรใช้
  `before_model_resolve` และ `before_prompt_build` แทนเฟสแบบรวม
- **`onResolution` ใน `before_tool_call`** ตอนนี้ใช้
  union แบบมีชนิด `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) แทน `string` แบบอิสระ

สำหรับรายการทั้งหมด — การลงทะเบียนความสามารถของ memory, thinking profile
ของ provider, providers การยืนยันตัวตนภายนอก, types การค้นพบ provider, accessors ของ task runtime
และการเปลี่ยนชื่อ `command-auth` → `command-status` — ดู
[การย้าย Plugin SDK → การเลิกใช้งานที่ยังมีผล](/th/plugins/sdk-migration#active-deprecations)

## ที่เกี่ยวข้อง

- [การย้าย Plugin SDK](/th/plugins/sdk-migration) — การเลิกใช้งานที่ยังมีผลและกำหนดเวลาการนำออก
- [การสร้าง plugins](/th/plugins/building-plugins)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [จุดเริ่มต้นของ Plugin](/th/plugins/sdk-entrypoints)
- [internal hooks](/th/automation/hooks)
- [รายละเอียดภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)
