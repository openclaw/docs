---
read_when:
    - คุณกำลังสร้าง Plugin ที่ต้องใช้ before_tool_call, before_agent_reply, ฮุกข้อความ หรือฮุกวงจรชีวิต
    - คุณต้องบล็อก เขียนใหม่ หรือกำหนดให้ต้องได้รับการอนุมัติสำหรับการเรียกใช้เครื่องมือจาก Plugin
    - คุณกำลังตัดสินใจระหว่างฮุกภายในกับฮุกของ Plugin
summary: 'Plugin hooks: สกัดกั้นเหตุการณ์วงจรชีวิตของเอเจนต์ เครื่องมือ ข้อความ เซสชัน และ Gateway'
title: ฮุกของ Plugin
x-i18n:
    generated_at: "2026-06-27T17:55:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

ฮุกของ Plugin เป็นจุดขยายในกระบวนการสำหรับ Plugin ของ OpenClaw ใช้ฮุกเหล่านี้
เมื่อ Plugin ต้องตรวจสอบหรือเปลี่ยนแปลงการรันของเอเจนต์ การเรียกเครื่องมือ โฟลว์ข้อความ
วงจรชีวิตเซสชัน การกำหนดเส้นทางซับเอเจนต์ การติดตั้ง หรือการเริ่มต้น Gateway

ใช้ [ฮุกภายใน](/th/automation/hooks) แทนเมื่อคุณต้องการสคริปต์ `HOOK.md`
ขนาดเล็กที่ติดตั้งโดยผู้ปฏิบัติงานสำหรับเหตุการณ์คำสั่งและ Gateway เช่น
`/new`, `/reset`, `/stop`, `agent:bootstrap` หรือ `gateway:startup`

## เริ่มต้นอย่างรวดเร็ว

ลงทะเบียนฮุก Plugin แบบมีชนิดด้วย `api.on(...)` จากเอนทรีของ Plugin:

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

ตัวจัดการฮุกทำงานตามลำดับจาก `priority` สูงไปต่ำ ฮุกที่มี priority เท่ากัน
จะคงลำดับการลงทะเบียนไว้

`api.on(name, handler, opts?)` รับค่า:

- `priority` - ลำดับการทำงานของตัวจัดการ (ค่าสูงกว่าจะทำงานก่อน)
- `timeoutMs` - งบเวลาต่อฮุกแบบไม่บังคับ เมื่อตั้งค่า ตัวรันฮุกจะยกเลิก
  ตัวจัดการนั้นหลังงบเวลาหมดลงและทำงานตัวถัดไปต่อ แทนที่จะปล่อยให้การตั้งค่า
  หรือการเรียกคืนที่ช้ากิน timeout โมเดลที่ผู้เรียกกำหนดไว้ ละไว้เพื่อใช้ timeout
  การสังเกต/การตัดสินใจเริ่มต้นที่ตัวรันฮุกนำไปใช้แบบทั่วไป

ผู้ปฏิบัติงานยังตั้งงบเวลาฮุกได้โดยไม่ต้องแพตช์โค้ด Plugin:

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
`api.on(..., { timeoutMs })` ที่ Plugin เขียนไว้ ค่าที่กำหนดแต่ละค่าต้องเป็น
จำนวนเต็มบวกที่ไม่เกิน 600000 มิลลิวินาที ควรใช้การแทนที่รายฮุกสำหรับฮุกที่ทราบว่า
ช้า เพื่อไม่ให้ Plugin หนึ่งได้รับงบเวลาที่ยาวขึ้นทุกที่

แต่ละฮุกจะได้รับ `event.context.pluginConfig` ซึ่งเป็น config ที่ resolve แล้วสำหรับ
Plugin ที่ลงทะเบียนตัวจัดการนั้น ใช้ค่านี้สำหรับการตัดสินใจของฮุกที่ต้องใช้ตัวเลือก
Plugin ปัจจุบัน OpenClaw ฉีดค่านี้ให้ต่อหนึ่งตัวจัดการโดยไม่กลายพันธุ์อ็อบเจกต์
เหตุการณ์ร่วมที่ Plugin อื่นเห็น

## แคตตาล็อกฮุก

ฮุกถูกจัดกลุ่มตามพื้นผิวที่ฮุกขยาย ชื่อที่เป็น **ตัวหนา** รับผลการตัดสินใจได้
(บล็อก ยกเลิก แทนที่ หรือขออนุมัติ); รายการอื่นทั้งหมดเป็นการสังเกตเท่านั้น

**เทิร์นเอเจนต์**

- `before_model_resolve` - แทนที่ผู้ให้บริการหรือโมเดลก่อนโหลดข้อความเซสชัน
- `agent_turn_prepare` - ใช้การฉีดเทิร์นของ Plugin ที่เข้าคิวไว้ และเพิ่มบริบทในเทิร์นเดียวกันก่อนฮุกพรอมป์
- `before_prompt_build` - เพิ่มบริบทแบบไดนามิกหรือข้อความ system prompt ก่อนการเรียกโมเดล
- `before_agent_start` - เฟสรวมเพื่อความเข้ากันได้เท่านั้น; ควรใช้สองฮุกด้านบน
- **`before_agent_run`** - ตรวจสอบพรอมป์สุดท้ายและข้อความเซสชันก่อนส่งไปยังโมเดล และเลือกบล็อกการรันได้
- **`before_agent_reply`** - ตัดเทิร์นโมเดลให้สั้นลงด้วยการตอบกลับสังเคราะห์หรือความเงียบ
- **`before_agent_finalize`** - ตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้โมเดลทำงานอีกหนึ่งรอบ
- `agent_end` - สังเกตข้อความสุดท้าย สถานะสำเร็จ และระยะเวลาการรัน
- `heartbeat_prompt_contribution` - เพิ่มบริบทเฉพาะ Heartbeat สำหรับ Plugin มอนิเตอร์เบื้องหลังและวงจรชีวิต

**การสังเกตบทสนทนา**

- `model_call_started` / `model_call_ended` - สังเกตเมทาดาทาการเรียกผู้ให้บริการ/โมเดลที่ผ่านการทำให้ปลอดภัยแล้ว เวลา ผลลัพธ์ และแฮช request id ที่มีขอบเขต โดยไม่มีเนื้อหาพรอมป์หรือคำตอบ
- `llm_input` - สังเกตอินพุตของผู้ให้บริการ (system prompt, prompt, history)
- `llm_output` - สังเกตเอาต์พุตของผู้ให้บริการ การใช้งาน และ `contextTokenBudget` ที่ resolve แล้วเมื่อมี

**เครื่องมือ**

- **`before_tool_call`** - เขียนพารามิเตอร์เครื่องมือใหม่ บล็อกการทำงาน หรือขออนุมัติ
- `after_tool_call` - สังเกตผลลัพธ์เครื่องมือ ข้อผิดพลาด และระยะเวลา
- `resolve_exec_env` - เพิ่มตัวแปรสภาพแวดล้อมที่ Plugin เป็นเจ้าของให้กับ `exec`
- **`tool_result_persist`** - เขียนข้อความ assistant ที่ผลิตจากผลลัพธ์เครื่องมือใหม่
- **`before_message_write`** - ตรวจสอบหรือบล็อกการเขียนข้อความที่กำลังดำเนินอยู่ (พบไม่บ่อย)

**ข้อความและการส่งมอบ**

- **`inbound_claim`** - claim ข้อความขาเข้าก่อนการกำหนดเส้นทางเอเจนต์ (การตอบกลับสังเคราะห์)
- `message_received` — สังเกตเนื้อหาขาเข้า ผู้ส่ง เธรด และเมทาดาทา
- **`message_sending`** — เขียนเนื้อหาขาออกใหม่หรือยกเลิกการส่งมอบ
- **`reply_payload_sending`** — กลายพันธุ์หรือยกเลิก payload การตอบกลับที่ normalize แล้วก่อนส่งมอบ
- `message_sent` — สังเกตความสำเร็จหรือความล้มเหลวของการส่งมอบขาออก
- **`before_dispatch`** - ตรวจสอบหรือเขียน dispatch ขาออกใหม่ก่อนส่งต่อให้ช่องทาง
- **`reply_dispatch`** - เข้าร่วมใน pipeline dispatch การตอบกลับสุดท้าย

**เซสชันและ Compaction**

- `session_start` / `session_end` - ติดตามขอบเขตวงจรชีวิตเซสชัน `reason` ของเหตุการณ์เป็นหนึ่งใน `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` หรือ `unknown` ค่า `shutdown` และ `restart` จะทำงานจากตัวปิดท้ายการปิด Gateway เมื่อกระบวนการถูกหยุดหรือรีสตาร์ตขณะที่เซสชันยังทำงานอยู่ เพื่อให้ Plugin ปลายทาง (เช่น memory หรือ transcript store) ปิดท้ายแถว ghost ที่ไม่เช่นนั้นจะถูกทิ้งไว้ในสถานะเปิดข้ามการรีสตาร์ตได้ ตัวปิดท้ายมีขอบเขตเวลาเพื่อไม่ให้ Plugin ที่ช้าบล็อก SIGTERM/SIGINT ได้
- `before_compaction` / `after_compaction` - สังเกตหรือใส่หมายเหตุรอบ Compaction
- `before_reset` - สังเกตเหตุการณ์รีเซ็ตเซสชัน (`/reset`, การรีเซ็ตผ่านโปรแกรม)

**ซับเอเจนต์**

- `subagent_spawned` / `subagent_ended` - สังเกตการเปิดตัวและการเสร็จสิ้นของซับเอเจนต์
- `subagent_delivery_target` - ฮุกความเข้ากันได้สำหรับการส่งมอบเมื่อเสร็จสิ้นเมื่อไม่มีการผูกเซสชันหลักที่ฉายเส้นทางได้
- `subagent_spawning` - ฮุกความเข้ากันได้ที่เลิกใช้แล้ว ตอนนี้ core เตรียมการผูกซับเอเจนต์ `thread: true` ผ่านอะแดปเตอร์ session-binding ของช่องทางก่อนที่ `subagent_spawned` จะทำงาน
- `subagent_spawned` รวม `resolvedModel` และ `resolvedProvider` เมื่อ OpenClaw resolve โมเดลเนทีฟของเซสชันลูกก่อนเปิดตัวแล้ว
- `subagent_ended` พก `targetSessionKey` (ตัวตน — ค่านี้ตรงกับ `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` หรือ `"acp"`), `reason`, `outcome` แบบไม่บังคับ (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` หรือ `"deleted"`), `error` แบบไม่บังคับ, `runId`, `endedAt`, `accountId` และ `sendFarewell` โดย **ไม่** รวม `agentId` หรือ `childSessionKey`; ใช้ `targetSessionKey` เพื่อเชื่อมโยงกับเหตุการณ์ `subagent_spawned` ที่สอดคล้องกัน

**วงจรชีวิต**

- `gateway_start` / `gateway_stop` - เริ่มหรือหยุดบริการที่ Plugin เป็นเจ้าของพร้อมกับ Gateway
- `deactivate` - alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `gateway_stop`; ใช้ `gateway_stop` ใน Plugin ใหม่
- `cron_changed` - สังเกตการเปลี่ยนแปลงวงจรชีวิต Cron ที่ Gateway เป็นเจ้าของ (เพิ่ม อัปเดต ลบ เริ่ม เสร็จสิ้น ตั้งเวลา)
- **`before_install`** - ตรวจสอบวัสดุติดตั้ง skill หรือ Plugin ที่ staging แล้วจาก runtime
  Plugin ที่โหลดไว้

## ดีบักฮุก runtime

ใช้ `before_model_resolve` เมื่อ Plugin ต้องสลับผู้ให้บริการหรือโมเดล
สำหรับเทิร์นเอเจนต์ ฮุกนี้ทำงานก่อนการ resolve โมเดล; `llm_output` จะทำงานหลังจาก
ความพยายามใช้โมเดลผลิตเอาต์พุต assistant แล้วเท่านั้น

เพื่อพิสูจน์โมเดลเซสชันที่มีผลจริง ให้ตรวจสอบการลงทะเบียน runtime จากนั้นใช้
`openclaw sessions` หรือพื้นผิวเซสชัน/สถานะของ Gateway เมื่อดีบัก payload
ของผู้ให้บริการ ให้เริ่ม Gateway ด้วย `--raw-stream` และ
`--raw-stream-path <path>`; flags เหล่านั้นจะเขียนเหตุการณ์ raw model stream ไปยังไฟล์
jsonl

## นโยบายการเรียกเครื่องมือ

`before_tool_call` ได้รับ:

- `event.toolName`
- `event.params`
- `event.toolKind` และ `event.toolInputKind` แบบไม่บังคับ ซึ่งเป็นตัวจำแนกที่ host มีอำนาจตัดสิน
  สำหรับเครื่องมือที่ตั้งใจใช้ชื่อร่วมกัน; ตัวอย่างเช่น การเรียก `exec` ในโหมด code ภายนอก
  ใช้ `toolKind: "code_mode_exec"` และรวม
  `toolInputKind: "javascript" | "typescript"` เมื่อทราบภาษาอินพุต
- `event.derivedPaths` แบบไม่บังคับ ซึ่งมีคำใบ้ path เป้าหมายที่ host อนุมานแบบดีที่สุดเท่าที่ทำได้
  สำหรับ envelope เครื่องมือที่รู้จักดี เช่น `apply_patch`; เมื่อมี
  path เหล่านี้อาจไม่สมบูรณ์หรืออาจประมาณเกินสิ่งที่เครื่องมือจะแตะต้องจริง
  (ตัวอย่างเช่น เมื่ออินพุตผิดรูปหรือเป็นบางส่วน)
- `event.runId` แบบไม่บังคับ
- `event.toolCallId` แบบไม่บังคับ
- ฟิลด์บริบท เช่น `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ตั้งค่าในการรันที่ขับเคลื่อนด้วย Cron), `ctx.toolKind`,
  `ctx.toolInputKind` และ `ctx.trace` เพื่อการวินิจฉัย

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

พฤติกรรม guard ของฮุกสำหรับฮุกวงจรชีวิตแบบมีชนิด:

- `block: true` เป็นค่าสุดท้ายและข้ามตัวจัดการที่มี priority ต่ำกว่า
- `block: false` ถือว่าไม่มีการตัดสินใจ
- `params` เขียนพารามิเตอร์เครื่องมือใหม่สำหรับการทำงาน
- `requireApproval` หยุดการรันเอเจนต์ชั่วคราวและถามผู้ใช้ผ่านการอนุมัติของ Plugin
  คำสั่ง `/approve` สามารถอนุมัติได้ทั้ง exec และการอนุมัติของ Plugin
  ใน relay `PreToolUse` เนทีฟของโหมด report ใน Codex app-server สิ่งนี้จะถูกเลื่อนไปยัง
  คำขออนุมัติ app-server ที่ตรงกัน; ดู [runtime ฮาร์เนส Codex](/th/plugins/codex-harness-runtime#hook-boundaries)
- `block: true` ที่มี priority ต่ำกว่ายังสามารถบล็อกได้หลังจากฮุกที่มี priority สูงกว่า
  ขออนุมัติแล้ว
- `onResolution` ได้รับการตัดสินใจอนุมัติที่ resolve แล้ว - `allow-once`,
  `allow-always`, `deny`, `timeout` หรือ `cancelled`

ดู [คำขอสิทธิ์ของ Plugin](/th/plugins/plugin-permission-requests) สำหรับ
การกำหนดเส้นทางการอนุมัติ พฤติกรรมการตัดสินใจ และเวลาที่ควรใช้ `requireApproval` แทน
เครื่องมือแบบไม่บังคับหรือการอนุมัติ exec

Plugin ที่ต้องการนโยบายระดับ host สามารถลงทะเบียนนโยบายเครื่องมือที่เชื่อถือได้ด้วย
`api.registerTrustedToolPolicy(...)` นโยบายเหล่านี้ทำงานก่อนฮุก
`before_tool_call` ปกติ และก่อนการตัดสินใจของฮุกตามปกติ นโยบายที่เชื่อถือได้แบบ bundled
ทำงานก่อน; นโยบายที่เชื่อถือได้ของ Plugin ที่ติดตั้งแล้วทำงานถัดไปตามลำดับการโหลด Plugin;
ฮุก `before_tool_call` ปกติทำงานหลังจากนั้น Plugin แบบ bundled คง path
trusted-policy ที่มีอยู่ไว้ Plugin ที่ติดตั้งแล้วต้องเปิดใช้อย่างชัดเจน
และประกาศ id นโยบายทุกตัวใน `contracts.trustedToolPolicies`; id ที่ไม่ได้ประกาศ
จะถูกปฏิเสธก่อนการลงทะเบียน id นโยบายถูกจำกัดขอบเขตตาม Plugin ที่ลงทะเบียน
ดังนั้น Plugin ต่างกันอาจใช้ id ภายในเดียวกันซ้ำได้ ใช้ชั้นนี้เฉพาะสำหรับ
ด่านที่ host เชื่อถือ เช่น นโยบาย workspace การบังคับใช้งบประมาณ หรือ
ความปลอดภัยของ workflow ที่สงวนไว้

### ฮุกสภาพแวดล้อม Exec

`resolve_exec_env` ให้ Plugin เพิ่มตัวแปรสภาพแวดล้อมให้กับการเรียกเครื่องมือ
`exec` หลังจากสร้างสภาพแวดล้อม exec พื้นฐานแล้วและก่อนที่คำสั่งจะทำงาน โดยได้รับ:

- `event.sessionKey`
- `event.toolName`, ปัจจุบันเป็น `"exec"` เสมอ
- `event.host`, หนึ่งใน `"gateway"`, `"sandbox"` หรือ `"node"`
- ฟิลด์บริบท เช่น `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` และ `ctx.channelId`

คืนค่า `Record<string, string>` เพื่อ merge เข้าในสภาพแวดล้อม exec ตัวจัดการ
ทำงานตามลำดับ priority และผลลัพธ์ฮุกที่มาทีหลังจะแทนที่ผลลัพธ์ฮุกที่มาก่อน
สำหรับ key เดียวกัน

เอาต์พุตของ hook จะถูกกรองผ่านนโยบายคีย์ของสภาพแวดล้อม exec ฝั่งโฮสต์ก่อน
ที่จะถูกผสาน คีย์ที่ไม่ถูกต้อง, `PATH`, และคีย์อันตรายที่เขียนทับโฮสต์ เช่น
`LD_*`, `DYLD_*`, `NODE_OPTIONS`, ตัวแปร proxy และตัวแปรเขียนทับ TLS
จะถูกทิ้ง env ของ plugin ที่ผ่านการกรองแล้วจะถูกรวมไว้ใน metadata การอนุมัติ/การตรวจสอบของ gateway
และส่งต่อไปยังคำขอ execution ของ node-host

### การคงอยู่ของผลลัพธ์เครื่องมือ

ผลลัพธ์เครื่องมือสามารถมี `details` แบบมีโครงสร้างสำหรับการเรนเดอร์ UI, การวินิจฉัย,
การกำหนดเส้นทางสื่อ หรือ metadata ที่ plugin เป็นเจ้าของ ให้ถือว่า `details` เป็น metadata ของ runtime
ไม่ใช่เนื้อหา prompt:

- OpenClaw จะตัด `toolResult.details` ออกก่อน provider replay และอินพุต compaction
  เพื่อไม่ให้ metadata กลายเป็น context ของโมเดล
- รายการ session ที่คงอยู่จะเก็บเฉพาะ `details` ที่มีขอบเขตจำกัด details ที่ใหญ่เกินไปจะ
  ถูกแทนที่ด้วยสรุปแบบกระชับและ `persistedDetailsTruncated: true`
- `tool_result_persist` และ `before_message_write` ทำงานก่อนเพดานการคงอยู่ขั้นสุดท้าย
  Hooks จึงควรรักษา `details` ที่ส่งคืนให้มีขนาดเล็ก และหลีกเลี่ยงการวางข้อความที่เกี่ยวข้องกับ prompt
  ไว้เฉพาะใน `details`; ให้วางเอาต์พุตเครื่องมือที่โมเดลมองเห็นได้ไว้ใน `content`

## Hooks สำหรับ prompt และโมเดล

ใช้ hooks เฉพาะ phase สำหรับ plugins ใหม่:

- `before_model_resolve`: รับเฉพาะ prompt ปัจจุบันและ metadata ของไฟล์แนบ
  ส่งคืน `providerOverride` หรือ `modelOverride`
- `agent_turn_prepare`: รับ prompt ปัจจุบัน, ข้อความ session ที่เตรียมไว้,
  และ queued injections แบบ exactly-once ใดๆ ที่ถูก drain สำหรับ session นี้ ส่งคืน
  `prependContext` หรือ `appendContext`
- `before_prompt_build`: รับ prompt ปัจจุบันและข้อความ session
  ส่งคืน `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` หรือ `appendSystemContext`
- `heartbeat_prompt_contribution`: ทำงานเฉพาะสำหรับรอบ heartbeat และส่งคืน
  `prependContext` หรือ `appendContext` มีไว้สำหรับตัวเฝ้าดูเบื้องหลัง
  ที่ต้องสรุปสถานะปัจจุบันโดยไม่เปลี่ยนรอบที่ผู้ใช้เริ่มต้น

`before_agent_start` ยังคงอยู่เพื่อความเข้ากันได้ ควรใช้ hooks แบบชัดเจนด้านบน
เพื่อให้ plugin ของคุณไม่ขึ้นกับ phase รวมแบบ legacy

`before_agent_run` ทำงานหลังจากสร้าง prompt และก่อนอินพุตโมเดลใดๆ
รวมถึงการโหลดรูปภาพเฉพาะ prompt และการสังเกต `llm_input` โดยรับอินพุตผู้ใช้ปัจจุบันเป็น `prompt`,
พร้อมประวัติ session ที่โหลดแล้วใน `messages`
และ system prompt ที่ใช้งานอยู่ ส่งคืน `{ outcome: "block", reason, message? }`
เพื่อหยุด run ก่อนที่โมเดลจะอ่าน prompt ได้ `reason` เป็นข้อมูลภายใน;
`message` เป็นข้อความแทนที่ที่แสดงต่อผู้ใช้ outcome ที่รองรับมีเพียง
`pass` และ `block`; รูปแบบ decision ที่ไม่รองรับจะ fail closed

เมื่อ run ถูกบล็อก OpenClaw จะเก็บเฉพาะข้อความแทนที่ใน
`message.content` พร้อม metadata การบล็อกที่ไม่ละเอียดอ่อน เช่น id ของ plugin ที่บล็อก
และ timestamp ข้อความต้นฉบับของผู้ใช้จะไม่ถูกเก็บไว้ใน transcript หรือ context ในอนาคต
เหตุผลการบล็อกภายในถือเป็นข้อมูลละเอียดอ่อนและถูกแยกออกจาก
transcript, history, broadcast, log และ payload การวินิจฉัย Observability
ควรใช้ฟิลด์ที่ผ่านการทำให้ปลอดภัยแล้ว เช่น blocker id, outcome, timestamp หรือ category ที่ปลอดภัย

`before_agent_start` และ `agent_end` จะมี `event.runId` เมื่อ OpenClaw สามารถ
ระบุ run ที่ใช้งานอยู่ได้ ค่าเดียวกันนี้ยังอยู่ใน `ctx.runId` ด้วย
run ที่ขับเคลื่อนด้วย Cron จะเปิดเผย `ctx.jobId` ด้วย (id ของงาน cron ต้นทาง) เพื่อให้
plugin hooks สามารถกำหนดขอบเขต metrics, side effects หรือ state ไปยังงานที่ตั้งเวลาไว้เฉพาะงานหนึ่งได้

สำหรับ run ที่เริ่มจาก channel, `ctx.channel` และ `ctx.messageProvider` จะระบุ
พื้นผิวของ provider เช่น `discord` หรือ `telegram` ส่วน `ctx.channelId` คือ
ตัวระบุเป้าหมายการสนทนาเมื่อ OpenClaw สามารถอนุมานได้จากคีย์ session
หรือ metadata การส่งมอบ

เมื่อมีตัวตนของผู้ส่ง context ของ agent hook จะรวมสิ่งต่อไปนี้ด้วย:

- `ctx.senderId` — ID ผู้ส่งที่อยู่ในขอบเขต channel (เช่น Feishu `open_id`, Discord
  user ID) เติมค่าเมื่อ run มีต้นทางจากข้อความผู้ใช้ที่มี metadata ผู้ส่งที่ทราบ
- `ctx.chatId` — ตัวระบุการสนทนาตาม transport ดั้งเดิม (เช่น Feishu
  `chat_id`, Telegram `chat_id`) เติมค่าเมื่อ channel ต้นทาง
  ให้ ID การสนทนาดั้งเดิม
- `ctx.channelContext.sender.id` — ID ผู้ส่งเดียวกับ `ctx.senderId` ภายใต้
  ออบเจกต์ที่ channel เป็นเจ้าของ ซึ่ง plugins สามารถขยายด้วยฟิลด์เฉพาะ channel ได้
- `ctx.channelContext.chat.id` — ID การสนทนาเดียวกับ `ctx.chatId` ภายใต้
  ออบเจกต์ที่ channel เป็นเจ้าของ ซึ่ง plugins สามารถขยายด้วยฟิลด์เฉพาะ channel ได้

Core กำหนดเฉพาะฟิลด์ `id` ที่ซ้อนอยู่เท่านั้น Channel plugins ที่ส่ง
metadata ผู้ส่งหรือแชทที่สมบูรณ์ขึ้นผ่าน inbound helper สามารถเพิ่ม
`PluginHookChannelSenderContext` หรือ `PluginHookChannelChatContext` จาก
`openclaw/plugin-sdk/channel-inbound` ได้:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Channel plugins ส่งฟิลด์เหล่านั้นผ่าน inbound SDK helper:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

ฟิลด์เหล่านี้เป็นตัวเลือกและจะไม่มีอยู่สำหรับ run ที่มีต้นทางจากระบบ (heartbeat,
cron, exec-event)

`ctx.senderExternalId` ยังคงอยู่ในฐานะฟิลด์ความเข้ากันได้กับซอร์สที่เลิกแนะนำแล้วสำหรับ
plugins รุ่นเก่า Core จะไม่เติมค่านี้; ตัวตนผู้ส่งเฉพาะ channel แบบใหม่
ควรอยู่ภายใต้ `ctx.channelContext.sender` ผ่าน module augmentation

`agent_end` เป็น observation hook เส้นทาง Gateway และ harness แบบคงอยู่จะเรียกแบบ
fire-and-forget หลังจบรอบ ขณะที่เส้นทาง CLI แบบ one-shot อายุสั้นจะรอ
promise ของ hook ก่อน cleanup process เพื่อให้ plugins ที่เชื่อถือได้สามารถ flush
observability ของ terminal หรือ capture state ได้ hook runner ใช้ timeout 30 วินาที เพื่อให้
plugin หรือ endpoint ฝังตัวที่ค้างไม่สามารถปล่อยให้ promise ของ hook pending
ตลอดไป เมื่อ timeout จะมีการบันทึก log และ OpenClaw จะทำงานต่อ; จะไม่ยกเลิก
งานเครือข่ายที่ plugin เป็นเจ้าของ เว้นแต่ plugin จะใช้ abort signal ของตัวเองด้วย

ใช้ `model_call_started` และ `model_call_ended` สำหรับ telemetry ของการเรียก provider
ที่ไม่ควรได้รับ raw prompts, history, responses, headers, request
bodies หรือ provider request IDs hooks เหล่านี้มี metadata ที่เสถียร เช่น
`runId`, `callId`, `provider`, `model`, `api`/`transport` ที่เป็นตัวเลือก,
`durationMs`/`outcome` ขั้นสุดท้าย และ `upstreamRequestIdHash` เมื่อ OpenClaw สามารถอนุมาน
hash ของ provider request-id ที่มีขอบเขตจำกัดได้ เมื่อ runtime resolve metadata ของ context-window แล้ว
event และ context ของ hook จะมี `contextTokenBudget` ด้วย ซึ่งเป็น
token budget ที่มีผลหลังจากเพดานของ model/config/agent รวมถึง
`contextWindowSource` และ `contextWindowReferenceTokens` เมื่อมีการใช้เพดานที่ต่ำกว่า

`before_agent_finalize` ทำงานเฉพาะเมื่อ harness กำลังจะยอมรับคำตอบ assistant ขั้นสุดท้ายตามธรรมชาติ
ไม่ใช่เส้นทางการยกเลิก `/stop` และจะไม่
ทำงานเมื่อผู้ใช้ abort รอบ ส่งคืน `{ action: "revise", reason }` เพื่อขอให้
harness เรียกโมเดลอีกหนึ่งรอบก่อน finalization, `{ action:
"finalize", reason? }` เพื่อบังคับ finalization หรือไม่ส่งผลลัพธ์เพื่อดำเนินการต่อ
hooks `Stop` ดั้งเดิมของ Codex จะถูก relay เข้าสู่ hook นี้ในฐานะ decision ของ OpenClaw
`before_agent_finalize`

เมื่อส่งคืน `action: "revise"` plugins สามารถรวม metadata `retry` เพื่อทำให้
การเรียกโมเดลเพิ่มเติมมีขอบเขตจำกัดและ replay-safe:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` จะถูก append เข้ากับเหตุผล revision ที่ส่งไปยัง harness
`idempotencyKey` ช่วยให้โฮสต์นับ retries สำหรับคำขอ plugin เดียวกันข้าม
finalize decisions ที่เทียบเท่ากันได้ และ `maxAttempts` จำกัดจำนวนรอบเพิ่มเติม
ที่โฮสต์จะอนุญาตก่อนดำเนินการต่อด้วยคำตอบขั้นสุดท้ายตามธรรมชาติ

Plugins ที่ไม่ใช่ bundled และต้องการ raw conversation hooks (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` หรือ `before_agent_run`) ต้องตั้งค่า:

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

hooks ที่แก้ไข prompt และ durable next-turn injections สามารถปิดใช้งานเป็นราย plugin
ด้วย `plugins.entries.<id>.hooks.allowPromptInjection=false`

### Session extensions และ next-turn injections

Workflow plugins สามารถคง state ของ session ขนาดเล็กที่เข้ากันได้กับ JSON ด้วย
`api.registerSessionExtension(...)` และอัปเดตผ่านเมธอด Gateway
`sessions.pluginPatch` แถว session จะ project state ของ extension ที่ลงทะเบียนไว้
ผ่าน `pluginExtensions` ทำให้ Control UI และ clients อื่นๆ เรนเดอร์
สถานะที่ plugin เป็นเจ้าของได้โดยไม่ต้องรู้ internals ของ plugin

ใช้ `api.enqueueNextTurnInjection(...)` เมื่อ plugin ต้องการ context แบบ durable เพื่อ
ส่งถึงรอบโมเดลถัดไปเพียงครั้งเดียว OpenClaw จะ drain queued injections ก่อน
prompt hooks, ทิ้ง injections ที่หมดอายุ และ deduplicate ตาม `idempotencyKey`
ต่อ plugin นี่คือ seam ที่เหมาะสำหรับ approval resumes, policy summaries,
background monitor deltas และ command continuations ที่ควรให้โมเดลเห็น
ในรอบถัดไปแต่ไม่ควรกลายเป็นข้อความ system prompt ถาวร

semantics ของ cleanup เป็นส่วนหนึ่งของ contract callbacks สำหรับ session extension cleanup และ
runtime lifecycle cleanup จะได้รับ `reset`, `delete`, `disable` หรือ
`restart` โฮสต์จะลบ state ของ session extension แบบคงอยู่ที่ plugin เป็นเจ้าของ
และ pending next-turn injections สำหรับ reset/delete/disable; restart จะเก็บ
state ของ session แบบ durable ไว้ ขณะที่ cleanup callbacks ให้ plugins ปล่อย scheduler
jobs, run context และทรัพยากร out-of-band อื่นๆ สำหรับ runtime generation เดิม

## Message hooks

ใช้ message hooks สำหรับการกำหนดเส้นทางและนโยบายการส่งมอบระดับ channel:

- `message_received`: สังเกต content ขาเข้า, sender, `threadId`, `messageId`,
  `senderId`, ความสัมพันธ์ run/session ที่เป็นตัวเลือก และ metadata
- `message_sending`: เขียน `content` ใหม่ หรือส่งคืน `{ cancel: true }`
- `reply_payload_sending`: เขียนออบเจกต์ `ReplyPayload` ที่ normalize แล้วใหม่ (รวมถึง
  `presentation`, `delivery`, media refs และ text) หรือส่งคืน `{ cancel: true }`
- `message_sent`: สังเกตความสำเร็จหรือความล้มเหลวขั้นสุดท้าย

สำหรับการตอบกลับ TTS แบบเสียงเท่านั้น `content` อาจมี transcript คำพูดที่ซ่อนอยู่
แม้ว่า payload ของ channel จะไม่มีข้อความ/คำบรรยายที่มองเห็นได้ การเขียน
`content` นั้นใหม่จะอัปเดตเฉพาะ transcript ที่ hook มองเห็นได้; จะไม่ถูกเรนเดอร์เป็น
คำบรรยายสื่อ

events `reply_payload_sending` อาจมี `usageState` ซึ่งเป็น snapshot แบบ live best-effort
ต่อรอบของ model/usage/context การส่งมอบแบบ durable, replay ที่กู้คืนมา และ
การตอบกลับที่ไม่มีความสัมพันธ์ run ที่แน่นอนจะละเว้นค่านี้

context ของ message hook เปิดเผยฟิลด์ความสัมพันธ์ที่เสถียรเมื่อมี:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` และ `ctx.callDepth` context ขาเข้า
และ `before_dispatch` ยังเปิดเผย metadata การตอบกลับเมื่อ channel มี
ข้อมูลข้อความที่อ้างอิงซึ่งผ่านการกรองการมองเห็นแล้ว: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` และ `replyToIsQuote` ควรใช้ฟิลด์ชั้นหนึ่งเหล่านี้
ก่อนอ่าน metadata แบบ legacy

ควรใช้ฟิลด์ `threadId` และ `replyToId` ที่มี type ก่อนใช้ metadata เฉพาะ channel

กฎการตัดสินใจ:

- `message_sending` ที่มี `cancel: true` เป็นสถานะสิ้นสุด
- `message_sending` ที่มี `cancel: false` จะถือว่าไม่มีการตัดสินใจ
- `content` ที่เขียนใหม่จะดำเนินต่อไปยังฮุกที่มีลำดับความสำคัญต่ำกว่า เว้นแต่ฮุกถัดไป
  จะยกเลิกการส่ง
- `reply_payload_sending` ทำงานหลังการทำให้ payload เป็นมาตรฐานและก่อนการส่งผ่านช่องทาง
  รวมถึงการตอบกลับที่ถูกส่งกลับไปยังช่องทางต้นทาง ตัวจัดการ
  ทำงานตามลำดับ และตัวจัดการแต่ละตัวจะเห็น payload ล่าสุดที่สร้างโดย
  ตัวจัดการที่มีลำดับความสำคัญสูงกว่า
- payload ของ `reply_payload_sending` ไม่เปิดเผยเครื่องหมายความน่าเชื่อถือของรันไทม์ เช่น
  `trustedLocalMedia`; Plugin สามารถแก้ไขรูปแบบ payload ได้ แต่ไม่สามารถให้ความน่าเชื่อถือแก่สื่อภายในเครื่องได้
- `message_sending` สามารถคืนค่า `cancelReason` และ `metadata` ที่มีขอบเขตพร้อมกับ
  การยกเลิก API วงจรชีวิตข้อความใหม่เปิดเผยสิ่งนี้เป็นผลลัพธ์การส่งที่ถูกระงับ
  พร้อมเหตุผล `cancelled_by_message_sending_hook`; การส่งโดยตรงแบบเดิม
  ยังคงคืนค่าอาร์เรย์ผลลัพธ์ว่างเพื่อความเข้ากันได้
- `message_sent` ใช้สำหรับสังเกตการณ์เท่านั้น ความล้มเหลวของตัวจัดการจะถูกบันทึก และไม่
  เปลี่ยนผลลัพธ์การส่ง

## ฮุกการติดตั้ง

ใช้ `security.installPolicy` สำหรับการตัดสินใจอนุญาต/บล็อกที่ผู้ปฏิบัติงานเป็นเจ้าของ
นโยบายนั้นทำงานจากการกำหนดค่า OpenClaw ครอบคลุมเส้นทางการติดตั้งและอัปเดตของ CLI และจะปิดกั้นโดยค่าเริ่มต้นเมื่อเปิดใช้แต่ไม่พร้อมใช้งาน

`before_install` เป็นฮุกวงจรชีวิตของรันไทม์ Plugin โดยทำงานหลัง
`security.installPolicy` เฉพาะในกระบวนการ OpenClaw ที่โหลดฮุกของ Plugin
แล้ว เช่น โฟลว์การติดตั้งที่รองรับโดย Gateway ซึ่งมีประโยชน์สำหรับ
การสังเกตการณ์ คำเตือน และการตรวจสอบความเข้ากันได้ที่ Plugin เป็นเจ้าของ แต่ไม่ใช่
ขอบเขตความปลอดภัยหลักระดับองค์กรหรือโฮสต์สำหรับการติดตั้ง ฟิลด์ `builtinScan`
ยังคงอยู่ใน payload ของเหตุการณ์เพื่อความเข้ากันได้ แต่ OpenClaw จะไม่
เรียกใช้การบล็อกโค้ดอันตรายแบบติดตั้งในตัวระหว่างการติดตั้งอีกต่อไป ดังนั้นจึงเป็นผลลัพธ์ `ok`
ว่าง ส่งคืนข้อค้นพบเพิ่มเติมหรือ `{ block: true, blockReason }` เพื่อหยุด
การติดตั้งในกระบวนการนั้น

`block: true` เป็นสถานะสิ้นสุด `block: false` จะถือว่าไม่มีการตัดสินใจ
ความล้มเหลวของตัวจัดการจะบล็อกการติดตั้งแบบปิดกั้นโดยค่าเริ่มต้น

## วงจรชีวิต Gateway

ใช้ `gateway_start` สำหรับบริการ Plugin ที่ต้องใช้สถานะที่ Gateway เป็นเจ้าของ
บริบทเปิดเผย `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับ
การตรวจสอบและอัปเดต cron ใช้ `gateway_stop` เพื่อล้างทรัพยากร
ที่ทำงานระยะยาว

อย่าพึ่งพาฮุกภายใน `gateway:startup` สำหรับบริการรันไทม์
ที่ Plugin เป็นเจ้าของ

`cron_changed` จะทำงานสำหรับเหตุการณ์วงจรชีวิต cron ที่ gateway เป็นเจ้าของ พร้อม
payload เหตุการณ์แบบมีชนิดซึ่งครอบคลุมเหตุผล `added`, `updated`, `removed`, `started`, `finished`,
และ `scheduled` เหตุการณ์มีสแนปชอต `PluginHookGatewayCronJob`
(รวมถึง `state.nextRunAtMs`, `state.lastRunStatus` และ
`state.lastError` เมื่อมี) พร้อม `PluginHookGatewayCronDeliveryStatus`
เป็น `not-requested` | `delivered` | `not-delivered` | `unknown` เหตุการณ์ที่ถูกลบ
ยังคงมีสแนปชอตงานที่ถูกลบ เพื่อให้ตัวจัดตารางเวลาภายนอกสามารถ
ปรับสถานะให้ตรงกันได้ ใช้ `ctx.getCron?.()` และ `ctx.config` จากบริบท
รันไทม์เมื่อซิงค์ตัวจัดตารางเวลาปลุกภายนอก และให้ OpenClaw เป็น
แหล่งข้อมูลจริงสำหรับการตรวจสอบกำหนดเวลาและการดำเนินการ

## การเลิกใช้งานที่กำลังจะมาถึง

มีพื้นผิวบางส่วนที่อยู่ใกล้กับฮุกซึ่งเลิกใช้แล้วแต่ยังรองรับอยู่ ให้ย้าย
ก่อนรุ่นหลักถัดไป:

- **ซองช่องทางข้อความธรรมดา** ในตัวจัดการ `inbound_claim` และ `message_received`
  อ่าน `BodyForAgent` และบล็อกบริบทผู้ใช้แบบมีโครงสร้าง
  แทนการแยกวิเคราะห์ข้อความซองแบบแบน ดู
  [ซองช่องทางข้อความธรรมดา → BodyForAgent](/th/plugins/sdk-migration#active-deprecations)
- **`before_agent_start`** ยังคงอยู่เพื่อความเข้ากันได้ Plugin ใหม่ควรใช้
  `before_model_resolve` และ `before_prompt_build` แทนเฟสที่รวมกัน
- **`subagent_spawning`** ยังคงอยู่เพื่อความเข้ากันได้กับ Plugin รุ่นเก่า แต่
  Plugin ใหม่ไม่ควรคืนค่าการกำหนดเส้นทางเธรดจากฮุกนี้ Core เตรียม
  การผูก subagent แบบ `thread: true` ผ่านอะแดปเตอร์การผูกเซสชันช่องทาง
  ก่อนที่ `subagent_spawned` จะทำงาน
- **`deactivate`** ยังคงเป็นนามแฝงความเข้ากันได้สำหรับการล้างข้อมูลที่เลิกใช้แล้วจนถึง
  หลัง 2026-08-16 Plugin ใหม่ควรใช้ `gateway_stop`
- **`onResolution` ใน `before_tool_call`** ตอนนี้ใช้ยูเนียนแบบมีชนิด
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) แทน `string` แบบอิสระ

สำหรับรายการทั้งหมด ได้แก่ การลงทะเบียนความสามารถหน่วยความจำ โปรไฟล์การคิดของผู้ให้บริการ
ผู้ให้บริการยืนยันตัวตนภายนอก ชนิดการค้นหาผู้ให้บริการ ตัวเข้าถึงรันไทม์งาน
และการเปลี่ยนชื่อ `command-auth` → `command-status` โปรดดู
[การย้าย Plugin SDK → การเลิกใช้งานที่ยังมีผล](/th/plugins/sdk-migration#active-deprecations)

## ที่เกี่ยวข้อง

- [การย้าย Plugin SDK](/th/plugins/sdk-migration) - การเลิกใช้งานที่ยังมีผลและไทม์ไลน์การลบ
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [จุดเริ่มต้น Plugin](/th/plugins/sdk-entrypoints)
- [ฮุกภายใน](/th/automation/hooks)
- [รายละเอียดภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)
