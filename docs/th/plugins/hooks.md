---
read_when:
    - คุณกำลังสร้าง Plugin ที่ต้องใช้ `before_tool_call`, `before_agent_reply`, message hooks หรือ lifecycle hooks
    - คุณต้องการบล็อก เขียนทับใหม่ หรือบังคับให้มีการอนุมัติสำหรับการเรียก tool จาก Plugin
    - คุณกำลังตัดสินใจเลือกระหว่าง internal hooks และ Plugin hooks
summary: 'Plugin hooks: สกัดกั้นเหตุการณ์ในวงจรชีวิตของ agent, tool, message, session และ Gateway'
title: Plugin hooks
x-i18n:
    generated_at: "2026-04-25T13:53:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: f263fb9064811de79fc4744ce13c5a7b9afb2d3b00330975426348af3411dc76
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin hooks คือจุดขยายแบบ in-process สำหรับ Plugin ของ OpenClaw ใช้มัน
เมื่อ Plugin ต้องตรวจสอบหรือเปลี่ยนแปลงการรันของ agent, การเรียก tool, การไหลของข้อความ,
วงจรชีวิตของเซสชัน, การกำหนดเส้นทางของ subagent, การติดตั้ง หรือการเริ่มต้น Gateway

ให้ใช้ [internal hooks](/th/automation/hooks) แทน เมื่อคุณต้องการสคริปต์ `HOOK.md`
ขนาดเล็กที่ติดตั้งโดย operator สำหรับเหตุการณ์ของคำสั่งและ Gateway เช่น
`/new`, `/reset`, `/stop`, `agent:bootstrap` หรือ `gateway:startup`

## เริ่มต้นอย่างรวดเร็ว

ลงทะเบียน Plugin hooks แบบมีชนิดด้วย `api.on(...)` จาก entry ของ Plugin ของคุณ:

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

ตัวจัดการ hook จะทำงานตามลำดับแบบ sequential โดยเรียง `priority` จากมากไปน้อย hooks ที่มีลำดับความสำคัญเท่ากัน
จะคงลำดับการลงทะเบียนไว้

## แค็ตตาล็อกของ hook

hooks ถูกจัดกลุ่มตามพื้นผิวที่มันขยาย ชื่อที่เป็น **ตัวหนา** รองรับ
ผลลัพธ์แบบ decision (block, cancel, override หรือ require approval); ส่วนที่เหลือทั้งหมดเป็นการสังเกตการณ์เท่านั้น

**เทิร์นของ Agent**

- `before_model_resolve` — เขียนทับ provider หรือ model ก่อนโหลดข้อความของเซสชัน
- `before_prompt_build` — เพิ่มบริบทแบบ dynamic หรือข้อความ system-prompt ก่อนการเรียกโมเดล
- `before_agent_start` — เฟสรวมสำหรับความเข้ากันได้เท่านั้น; ให้ใช้สอง hook ด้านบนแทน
- **`before_agent_reply`** — short-circuit เทิร์นของโมเดลด้วยคำตอบสังเคราะห์หรือความเงียบ
- `agent_end` — สังเกตข้อความสุดท้าย สถานะความสำเร็จ และระยะเวลาการรัน

**การสังเกตบทสนทนา**

- `llm_input` — สังเกตอินพุตของ provider (system prompt, prompt, ประวัติ)
- `llm_output` — สังเกตเอาต์พุตของ provider

**Tools**

- **`before_tool_call`** — เขียนทับพารามิเตอร์ของ tool, บล็อกการทำงาน หรือบังคับให้ต้องมีการอนุมัติ
- `after_tool_call` — สังเกตผลลัพธ์ของ tool, ข้อผิดพลาด และระยะเวลา
- **`tool_result_persist`** — เขียนทับข้อความ assistant ที่สร้างจากผลลัพธ์ของ tool
- **`before_message_write`** — ตรวจสอบหรือบล็อกการเขียนข้อความที่กำลังดำเนินอยู่ (พบไม่บ่อย)

**ข้อความและการส่ง**

- **`inbound_claim`** — รับช่วงข้อความขาเข้าก่อนการกำหนดเส้นทางไปยัง agent (คำตอบสังเคราะห์)
- `message_received` — สังเกตเนื้อหาขาเข้า ผู้ส่ง เธรด และ metadata
- **`message_sending`** — เขียนทับเนื้อหาขาออกหรือยกเลิกการส่ง
- `message_sent` — สังเกตความสำเร็จหรือความล้มเหลวของการส่งขาออก
- **`before_dispatch`** — ตรวจสอบหรือเขียนทับ dispatch ขาออกก่อนส่งต่อให้ช่องทาง
- **`reply_dispatch`** — มีส่วนร่วมใน pipeline การ dispatch คำตอบสุดท้าย

**เซสชันและ Compaction**

- `session_start` / `session_end` — ติดตามขอบเขตของวงจรชีวิตเซสชัน
- `before_compaction` / `after_compaction` — สังเกตหรือใส่หมายเหตุให้รอบการทำ Compaction
- `before_reset` — สังเกตเหตุการณ์รีเซ็ตเซสชัน (`/reset`, การรีเซ็ตแบบ programmatic)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — ประสานการกำหนดเส้นทางของ subagent และการส่งผลเมื่อเสร็จ

**วงจรชีวิต**

- `gateway_start` / `gateway_stop` — เริ่มหรือหยุดบริการที่ Plugin เป็นเจ้าของพร้อมกับ Gateway
- **`before_install`** — ตรวจสอบการสแกนติดตั้ง skill หรือ Plugin และสามารถบล็อกได้

## นโยบายการเรียก tool

`before_tool_call` จะได้รับ:

- `event.toolName`
- `event.params`
- `event.runId` แบบไม่บังคับ
- `event.toolCallId` แบบไม่บังคับ
- ฟิลด์บริบท เช่น `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId` และ
  `ctx.trace` สำหรับการวินิจฉัย

มันสามารถส่งกลับ:

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

- `block: true` เป็นการตัดสินใจขั้นสุดท้ายและจะข้ามตัวจัดการที่มีลำดับความสำคัญต่ำกว่า
- `block: false` จะถือว่าไม่มีการตัดสินใจ
- `params` จะเขียนทับพารามิเตอร์ของ tool สำหรับการทำงาน
- `requireApproval` จะหยุดการรันของ agent ชั่วคราวและถามผู้ใช้ผ่าน
  ระบบอนุมัติของ Plugin คำสั่ง `/approve` สามารถอนุมัติได้ทั้ง exec และการอนุมัติของ Plugin
- `block: true` จาก hook ที่มีลำดับความสำคัญต่ำกว่ายังสามารถบล็อกได้หลังจากที่ hook ที่มีลำดับความสำคัญสูงกว่า
  ขอการอนุมัติไปแล้ว
- `onResolution` จะได้รับผลการตัดสินใจอนุมัติที่สรุปแล้ว — `allow-once`,
  `allow-always`, `deny`, `timeout` หรือ `cancelled`

## hooks ของ prompt และ model

ใช้ hooks เฉพาะเฟสสำหรับ Plugin ใหม่:

- `before_model_resolve`: ได้รับเฉพาะ prompt ปัจจุบันและ
  metadata ของไฟล์แนบ ส่งกลับ `providerOverride` หรือ `modelOverride`
- `before_prompt_build`: ได้รับ prompt ปัจจุบันและข้อความของเซสชัน
  ส่งกลับ `prependContext`, `systemPrompt`, `prependSystemContext` หรือ
  `appendSystemContext`

`before_agent_start` ยังคงอยู่เพื่อความเข้ากันได้ ให้เลือกใช้ hooks แบบชัดเจนด้านบน
เพื่อไม่ให้ Plugin ของคุณขึ้นอยู่กับเฟสรวมแบบเดิม

`before_agent_start` และ `agent_end` จะมี `event.runId` เมื่อ OpenClaw สามารถ
ระบุการรันที่กำลังทำงานอยู่ได้ ค่าเดียวกันนี้ยังมีให้บน `ctx.runId`

Plugin ที่ไม่ได้มาพร้อมระบบซึ่งต้องใช้ `llm_input`, `llm_output` หรือ `agent_end` ต้องตั้งค่า:

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

hooks ที่กลายพันธุ์ prompt สามารถปิดใช้งานเป็นราย Plugin ได้ด้วย
`plugins.entries.<id>.hooks.allowPromptInjection=false`

## hooks ของข้อความ

ใช้ message hooks สำหรับการกำหนดเส้นทางระดับช่องทางและนโยบายการส่ง:

- `message_received`: สังเกตเนื้อหาขาเข้า ผู้ส่ง `threadId`, `messageId`,
  `senderId`, ความสัมพันธ์ของ run/session แบบไม่บังคับ และ metadata
- `message_sending`: เขียนทับ `content` หรือส่งกลับ `{ cancel: true }`
- `message_sent`: สังเกตความสำเร็จหรือความล้มเหลวขั้นสุดท้าย

สำหรับการตอบกลับ TTS แบบเสียงอย่างเดียว `content` อาจมี transcript ที่พูดออกมาซึ่งซ่อนอยู่
แม้ว่า payload ของช่องทางจะไม่มีข้อความ/คำบรรยายที่มองเห็นได้ การเขียนทับ `content`
ดังกล่าวจะอัปเดตเฉพาะ transcript ที่มองเห็นได้ใน hook เท่านั้น; มันจะไม่ถูกเรนเดอร์เป็น
คำบรรยายของสื่อ

บริบทของ message hook จะเปิดเผยฟิลด์ความสัมพันธ์ที่เสถียรเมื่อมีให้ใช้:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` และ `ctx.callDepth` ให้เลือกใช้
ฟิลด์ชั้นหนึ่งเหล่านี้ก่อนการอ่าน metadata แบบเดิม

ให้ใช้ฟิลด์ `threadId` และ `replyToId` แบบมีชนิดก่อนใช้ metadata เฉพาะช่องทาง

กฎของการตัดสินใจ:

- `message_sending` ที่มี `cancel: true` เป็นการตัดสินใจขั้นสุดท้าย
- `message_sending` ที่มี `cancel: false` จะถือว่าไม่มีการตัดสินใจ
- `content` ที่ถูกเขียนทับจะถูกส่งต่อไปยัง hooks ที่มีลำดับความสำคัญต่ำกว่าต่อ เว้นแต่ hook ภายหลังจะยกเลิกการส่ง

## hooks ของการติดตั้ง

`before_install` จะทำงานหลังการสแกนในตัวสำหรับการติดตั้ง skill และ Plugin
ส่งกลับผลการค้นพบเพิ่มเติม หรือ `{ block: true, blockReason }` เพื่อหยุด
การติดตั้ง

`block: true` เป็นการตัดสินใจขั้นสุดท้าย `block: false` จะถือว่าไม่มีการตัดสินใจ

## วงจรชีวิตของ Gateway

ใช้ `gateway_start` สำหรับบริการของ Plugin ที่ต้องใช้สถานะที่ Gateway เป็นเจ้าของ
บริบทจะเปิดให้ใช้ `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับ
การตรวจสอบและอัปเดต Cron ใช้ `gateway_stop` เพื่อทำความสะอาดทรัพยากรที่ทำงานระยะยาว

อย่าพึ่งพา hook ภายใน `gateway:startup` สำหรับบริการ runtime ที่ Plugin เป็นเจ้าของ

## การเลิกใช้งานที่กำลังจะมาถึง

มีพื้นผิวบางส่วนที่อยู่ใกล้กับ hooks ซึ่งเลิกใช้งานแล้วแต่ยังรองรับอยู่ ให้ย้ายระบบ
ก่อนรีลีสหลักถัดไป:

- **envelope ของช่องทางแบบ plaintext** ในตัวจัดการ `inbound_claim` และ `message_received`
  ให้อ่าน `BodyForAgent` และบล็อกบริบทผู้ใช้แบบมีโครงสร้าง
  แทนการ parse ข้อความ envelope แบบแบน ดู
  [Plaintext channel envelopes → BodyForAgent](/th/plugins/sdk-migration#active-deprecations)
- **`before_agent_start`** ยังคงอยู่เพื่อความเข้ากันได้ Plugin ใหม่ควรใช้
  `before_model_resolve` และ `before_prompt_build` แทนเฟสรวมนี้
- **`onResolution` ใน `before_tool_call`** ตอนนี้ใช้
  union แบบมีชนิด `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) แทน `string` แบบอิสระ

สำหรับรายการแบบเต็ม — การลงทะเบียนความสามารถของหน่วยความจำ, โปรไฟล์
thinking ของ provider, ผู้ให้บริการ auth ภายนอก, ชนิดการค้นหา provider, accessor ของ task runtime
และการเปลี่ยนชื่อ `command-auth` → `command-status` — ดู
[Plugin SDK migration → Active deprecations](/th/plugins/sdk-migration#active-deprecations)

## ที่เกี่ยวข้อง

- [Plugin SDK migration](/th/plugins/sdk-migration) — การเลิกใช้งานที่กำลังมีผลและกรอบเวลาการลบออก
- [Building plugins](/th/plugins/building-plugins)
- [Plugin SDK overview](/th/plugins/sdk-overview)
- [Plugin entry points](/th/plugins/sdk-entrypoints)
- [Internal hooks](/th/automation/hooks)
- [Plugin architecture internals](/th/plugins/architecture-internals)
