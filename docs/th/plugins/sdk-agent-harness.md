---
read_when:
    - คุณกำลังเปลี่ยนรันไทม์เอเจนต์แบบฝังตัวหรือรีจิสทรีของฮาร์เนส
    - คุณกำลังลงทะเบียนฮาร์เนสเอเจนต์จาก Plugin ที่รวมมาให้หรือ Plugin ที่เชื่อถือได้
    - คุณต้องเข้าใจว่า Plugin ของ Codex เกี่ยวข้องกับผู้ให้บริการโมเดลอย่างไร
sidebarTitle: Agent Harness
summary: ส่วนติดต่อ SDK รุ่นทดลองสำหรับ Plugin ที่แทนที่ตัวดำเนินการเอเจนต์แบบฝังตัวระดับต่ำ
title: Plugin สำหรับฮาร์เนสของเอเจนต์
x-i18n:
    generated_at: "2026-05-03T10:18:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**ฮาร์เนสของเอเจนต์** คือ executor ระดับต่ำสำหรับหนึ่งรอบของเอเจนต์ OpenClaw ที่เตรียมไว้แล้ว ไม่ใช่ผู้ให้บริการโมเดล ไม่ใช่ช่องทาง และไม่ใช่รีจิสทรีเครื่องมือ สำหรับโมเดลทางความคิดที่ผู้ใช้เห็น โปรดดู [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)

ใช้พื้นผิวนี้เฉพาะกับ Plugin แบบเนทีฟที่มาพร้อมกันหรือเชื่อถือได้เท่านั้น สัญญานี้ยังอยู่ในสถานะทดลอง เพราะชนิดของพารามิเตอร์จงใจสะท้อน runner แบบฝังตัวในปัจจุบัน

## ควรใช้ฮาร์เนสเมื่อใด

ลงทะเบียนฮาร์เนสของเอเจนต์เมื่อกลุ่มโมเดลมีรันไทม์เซสชันแบบเนทีฟของตัวเอง และ transport ของผู้ให้บริการ OpenClaw ตามปกติเป็นนามธรรมที่ไม่เหมาะสม

ตัวอย่าง:

- เซิร์ฟเวอร์เอเจนต์เขียนโค้ดแบบเนทีฟที่เป็นเจ้าของเธรดและ Compaction
- CLI หรือ daemon ในเครื่องที่ต้องสตรีมเหตุการณ์แผน/เหตุผล/เครื่องมือแบบเนทีฟ
- รันไทม์โมเดลที่ต้องมี resume id ของตัวเอง นอกเหนือจาก transcript เซสชันของ OpenClaw

อย่า ลงทะเบียนฮาร์เนสเพียงเพื่อเพิ่ม LLM API ใหม่ สำหรับ HTTP หรือ WebSocket model APIs ตามปกติ ให้สร้าง [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins)

## สิ่งที่ core ยังเป็นเจ้าของ

ก่อนเลือกฮาร์เนส OpenClaw ได้ resolve สิ่งเหล่านี้แล้ว:

- ผู้ให้บริการและโมเดล
- สถานะ auth ของรันไทม์
- ระดับการคิดและงบประมาณ context
- ไฟล์ transcript/เซสชันของ OpenClaw
- workspace, sandbox และนโยบายเครื่องมือ
- callback สำหรับการตอบกลับช่องทางและ callback สำหรับสตรีม
- นโยบาย fallback ของโมเดลและการสลับโมเดลแบบ live

การแยกนี้เป็นไปโดยตั้งใจ ฮาร์เนสจะรัน attempt ที่เตรียมไว้แล้ว ไม่ได้เลือกผู้ให้บริการ แทนที่การส่งผ่านช่องทาง หรือสลับโมเดลอย่างเงียบ ๆ

attempt ที่เตรียมไว้ยังรวม `params.runtimePlan` ซึ่งเป็นชุดนโยบายที่ OpenClaw เป็นเจ้าของสำหรับการตัดสินใจของรันไทม์ที่ต้องใช้ร่วมกันระหว่าง PI และฮาร์เนสแบบเนทีฟ:

- `runtimePlan.tools.normalize(...)` และ
  `runtimePlan.tools.logDiagnostics(...)` สำหรับนโยบาย schema ของเครื่องมือที่รับรู้ผู้ให้บริการ
- `runtimePlan.transcript.resolvePolicy(...)` สำหรับนโยบาย sanitization ของ transcript และการซ่อมแซม tool-call
- `runtimePlan.delivery.isSilentPayload(...)` สำหรับการระงับการส่ง `NO_REPLY` และสื่อที่ใช้ร่วมกัน
- `runtimePlan.outcome.classifyRunResult(...)` สำหรับการจัดประเภท fallback ของโมเดล
- `runtimePlan.observability` สำหรับ metadata ของผู้ให้บริการ/โมเดล/ฮาร์เนสที่ resolve แล้ว

ฮาร์เนสอาจใช้แผนนี้สำหรับการตัดสินใจที่ต้องสอดคล้องกับพฤติกรรมของ PI แต่ยังควรมองว่าเป็นสถานะ attempt ที่ host เป็นเจ้าของ อย่า mutate แผนนี้หรือใช้เพื่อสลับผู้ให้บริการ/โมเดลภายในรอบเดียวกัน

## ลงทะเบียนฮาร์เนส

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## นโยบายการเลือก

OpenClaw เลือกฮาร์เนสหลัง resolve ผู้ให้บริการ/โมเดลแล้ว:

1. harness id ที่บันทึกไว้ของเซสชันเดิมชนะ เพื่อไม่ให้การเปลี่ยน config/env hot-switch transcript นั้นไปยังรันไทม์อื่น
2. `OPENCLAW_AGENT_RUNTIME=<id>` บังคับใช้ฮาร์เนสที่ลงทะเบียนด้วย id นั้นสำหรับเซสชันที่ยังไม่ได้ pin
3. `OPENCLAW_AGENT_RUNTIME=pi` บังคับใช้ฮาร์เนส PI ที่มีมาให้
4. `OPENCLAW_AGENT_RUNTIME=auto` ถามฮาร์เนสที่ลงทะเบียนไว้ว่ารองรับผู้ให้บริการ/โมเดลที่ resolve แล้วหรือไม่
5. หากไม่มีฮาร์เนสที่ลงทะเบียนตรงกัน OpenClaw จะใช้ PI เว้นแต่ปิดใช้งาน PI fallback

ความล้มเหลวของฮาร์เนส Plugin จะแสดงเป็นความล้มเหลวของการรัน ในโหมด `auto` จะใช้ PI fallback เฉพาะเมื่อไม่มีฮาร์เนส Plugin ที่ลงทะเบียนรองรับผู้ให้บริการ/โมเดลที่ resolve แล้ว เมื่อฮาร์เนส Plugin claim การรันแล้ว OpenClaw จะไม่ replay รอบเดียวกันนั้นผ่าน PI เพราะอาจเปลี่ยน semantics ของ auth/runtime หรือทำ side effects ซ้ำ

harness id ที่เลือกจะถูก persist พร้อม session id หลังจากการรันแบบฝังตัว เซสชัน legacy ที่สร้างก่อนมี harness pins จะถูกถือว่า PI-pinned เมื่อมีประวัติ transcript แล้ว ใช้เซสชันใหม่/รีเซ็ตเมื่อเปลี่ยนระหว่าง PI และฮาร์เนส Plugin แบบเนทีฟ `/status` แสดง harness ids ที่ไม่ใช่ค่าเริ่มต้น เช่น `codex` ถัดจาก `Fast`; PI จะถูกซ่อนเพราะเป็น path ความเข้ากันได้เริ่มต้น หากฮาร์เนสที่เลือกดูน่าแปลกใจ ให้เปิดใช้งาน debug logging ของ `agents/harness` และตรวจสอบระเบียนแบบมีโครงสร้าง `agent harness selected` ของ Gateway ระเบียนนี้รวม harness id ที่เลือก เหตุผลการเลือก นโยบาย runtime/fallback และในโหมด `auto` รวมผลการรองรับของผู้สมัคร Plugin แต่ละตัว

Plugin Codex ที่มาพร้อมกันลงทะเบียน `codex` เป็น harness id ของมัน Core มองสิ่งนี้เป็น harness id ของ Plugin ปกติ alias ที่เฉพาะกับ Codex ควรอยู่ใน Plugin หรือ config ของ operator ไม่ใช่ในตัวเลือก runtime ที่ใช้ร่วมกัน

## การจับคู่ผู้ให้บริการกับฮาร์เนส

ฮาร์เนสส่วนใหญ่ควรลงทะเบียนผู้ให้บริการด้วย ผู้ให้บริการทำให้ model refs, สถานะ auth, metadata ของโมเดล และการเลือก `/model` มองเห็นได้ต่อส่วนที่เหลือของ OpenClaw จากนั้นฮาร์เนสจะ claim ผู้ให้บริการนั้นใน `supports(...)`

Plugin Codex ที่มาพร้อมกันทำตามรูปแบบนี้:

- model refs ผู้ใช้ที่แนะนำ: `openai/gpt-5.5` พร้อม
  `agentRuntime.id: "codex"`
- refs ความเข้ากันได้: refs legacy `codex/gpt-*` ยังคงรับได้ แต่ config ใหม่ไม่ควรใช้เป็น refs ผู้ให้บริการ/โมเดลตามปกติ
- harness id: `codex`
- auth: ความพร้อมใช้งานผู้ให้บริการแบบ synthetic เพราะฮาร์เนส Codex เป็นเจ้าของการ login/เซสชัน Codex แบบเนทีฟ
- คำขอ app-server: OpenClaw ส่ง bare model id ไปยัง Codex และให้ฮาร์เนสคุยกับโปรโตคอล app-server แบบเนทีฟ

Plugin Codex เป็นแบบ additive refs `openai/gpt-*` ทั่วไปยังคงใช้ path ผู้ให้บริการ OpenClaw ตามปกติ เว้นแต่คุณบังคับใช้ฮาร์เนส Codex ด้วย `agentRuntime.id: "codex"` refs `codex/gpt-*` ที่เก่ากว่ายังคงเลือกผู้ให้บริการและฮาร์เนส Codex เพื่อความเข้ากันได้

สำหรับการตั้งค่าของ operator ตัวอย่าง prefix ของโมเดล และ config เฉพาะ Codex โปรดดู [ฮาร์เนส Codex](/th/plugins/codex-harness)

OpenClaw ต้องใช้ Codex app-server `0.125.0` หรือใหม่กว่า Plugin Codex ตรวจสอบ handshake initialize ของ app-server และบล็อกเซิร์ฟเวอร์ที่เก่ากว่าหรือไม่มีเวอร์ชัน เพื่อให้ OpenClaw รันกับพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้วเท่านั้น floor `0.125.0` รวมการรองรับ payload ของ hook MCP แบบเนทีฟที่ลงใน Codex `0.124.0` พร้อมกับ pin OpenClaw ไว้กับ stable line รุ่นใหม่กว่าที่ผ่านการทดสอบแล้ว

### middleware ผลลัพธ์เครื่องมือ

Plugin ที่มาพร้อมกันสามารถแนบ middleware ผลลัพธ์เครื่องมือที่เป็นกลางต่อรันไทม์ผ่าน `api.registerAgentToolResultMiddleware(...)` เมื่อ manifest ของพวกมันประกาศ runtime ids เป้าหมายไว้ใน `contracts.agentToolResultMiddleware` seam ที่เชื่อถือได้นี้มีไว้สำหรับ transform ผลลัพธ์เครื่องมือแบบ async ที่ต้องรันก่อนที่ PI หรือ Codex จะ feed เอาต์พุตเครื่องมือกลับเข้าโมเดล

Plugin legacy ที่มาพร้อมกันยังคงใช้ `api.registerCodexAppServerExtensionFactory(...)` สำหรับ middleware เฉพาะ Codex app-server ได้ แต่ transform ผลลัพธ์ใหม่ควรใช้ API ที่เป็นกลางต่อรันไทม์ hook `api.registerEmbeddedExtensionFactory(...)` ที่ใช้เฉพาะ Pi ถูกนำออกแล้ว transform ผลลัพธ์เครื่องมือของ Pi ต้องใช้ middleware ที่เป็นกลางต่อรันไทม์

### การจัดประเภทผลลัพธ์ปลายทาง

ฮาร์เนสแบบเนทีฟที่เป็นเจ้าของ protocol projection ของตัวเองสามารถใช้ `classifyAgentHarnessTerminalOutcome(...)` จาก `openclaw/plugin-sdk/agent-harness-runtime` เมื่อรอบที่เสร็จสมบูรณ์ไม่มีข้อความ assistant ที่มองเห็นได้ helper จะคืนค่า `empty`, `reasoning-only` หรือ `planning-only` เพื่อให้นโยบาย fallback ของ OpenClaw ตัดสินใจว่าจะ retry บนโมเดลอื่นหรือไม่ โดยตั้งใจไม่จัดประเภท prompt errors, รอบที่ยัง in-flight และการตอบกลับเงียบโดยตั้งใจ เช่น `NO_REPLY`

### โหมดฮาร์เนส Codex แบบเนทีฟ

ฮาร์เนส `codex` ที่มาพร้อมกันคือโหมด Codex แบบเนทีฟสำหรับรอบเอเจนต์ OpenClaw แบบฝังตัว เปิดใช้งาน Plugin `codex` ที่มาพร้อมกันก่อน และรวม `codex` ใน `plugins.allow` หาก config ของคุณใช้ allowlist ที่จำกัด config app-server แบบเนทีฟควรใช้ `openai/gpt-*` พร้อม `agentRuntime.id: "codex"` ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่าน PI แทน refs โมเดล legacy `codex/*` ยังคงเป็น alias ความเข้ากันได้สำหรับฮาร์เนสแบบเนทีฟ

เมื่อโหมดนี้รัน Codex เป็นเจ้าของ native thread id, พฤติกรรม resume, Compaction และการ execution ของ app-server OpenClaw ยังเป็นเจ้าของช่องทางแชต, mirror ของ transcript ที่มองเห็นได้, นโยบายเครื่องมือ, approvals, การส่งสื่อ และการเลือกเซสชัน ใช้ `agentRuntime.id: "codex"` เมื่อคุณต้องพิสูจน์ว่ามีเพียง path Codex app-server เท่านั้นที่สามารถ claim การรันได้ รันไทม์ Plugin แบบ explicit จะ fail closed; ความล้มเหลวในการเลือก Codex app-server และความล้มเหลวของรันไทม์จะไม่ถูก retry ผ่าน PI

## ความเข้มงวดของรันไทม์

โดยค่าเริ่มต้น OpenClaw รันเอเจนต์แบบฝังตัวด้วย OpenClaw Pi ในโหมด `auto` ฮาร์เนส Plugin ที่ลงทะเบียนสามารถ claim คู่ผู้ให้บริการ/โมเดลได้ และ PI จะจัดการรอบเมื่อไม่มีตัวใดตรงกัน ใช้รันไทม์ Plugin แบบ explicit เช่น `agentRuntime.id: "codex"` เมื่อการเลือกฮาร์เนสที่ขาดหายควรล้มเหลวแทนที่จะ route ผ่าน PI ความล้มเหลวของฮาร์เนส Plugin ที่เลือกจะล้มเหลวแบบ hard เสมอ สิ่งนี้ไม่บล็อก `agentRuntime.id: "pi"` หรือ `OPENCLAW_AGENT_RUNTIME=pi` แบบ explicit

สำหรับการรันแบบฝังตัวเฉพาะ Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

หากคุณต้องการให้ฮาร์เนส Plugin ที่ลงทะเบียนใด ๆ claim โมเดลที่ตรงกัน และใช้ PI ในกรณีอื่น ให้ตั้ง `id: "auto"`:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

override รายเอเจนต์ใช้ shape เดียวกัน:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` ยังคง override รันไทม์ที่กำหนดค่าไว้

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

เมื่อใช้รันไทม์ Plugin แบบ explicit เซสชันจะล้มเหลวตั้งแต่เนิ่น ๆ เมื่อฮาร์เนสที่ขอไม่ได้ลงทะเบียน ไม่รองรับผู้ให้บริการ/โมเดลที่ resolve แล้ว หรือ fail ก่อนสร้าง side effects ของรอบ นั่นเป็นเจตนาสำหรับการ deploy เฉพาะ Codex และสำหรับ live tests ที่ต้องพิสูจน์ว่า path Codex app-server ถูกใช้งานจริง

การตั้งค่านี้ควบคุมเฉพาะฮาร์เนสเอเจนต์แบบฝังตัวเท่านั้น ไม่ได้ปิดใช้งานการ routing โมเดลเฉพาะผู้ให้บริการสำหรับภาพ วิดีโอ เพลง TTS, PDF หรืออื่น ๆ

## เซสชันแบบเนทีฟและ mirror ของ transcript

ฮาร์เนสอาจเก็บ native session id, thread id หรือ resume token ฝั่ง daemon ให้ผูก binding นั้นกับเซสชัน OpenClaw อย่างชัดเจน และ mirror เอาต์พุต assistant/เครื่องมือที่ผู้ใช้มองเห็นลงใน transcript ของ OpenClaw ต่อไป

transcript ของ OpenClaw ยังคงเป็นเลเยอร์ความเข้ากันได้สำหรับ:

- ประวัติเซสชันที่ช่องทางมองเห็นได้
- การค้นหาและ indexing transcript
- การสลับกลับไปยังฮาร์เนส PI ที่มีมาให้ในรอบถัดไป
- พฤติกรรม `/new`, `/reset` และการลบเซสชันแบบ generic

หากฮาร์เนสของคุณเก็บ sidecar binding ให้ implement `reset(...)` เพื่อให้ OpenClaw ล้างได้เมื่อเซสชัน OpenClaw ที่เป็นเจ้าของถูกรีเซ็ต

## ผลลัพธ์เครื่องมือและสื่อ

Core สร้างรายการเครื่องมือของ OpenClaw และส่งเข้า attempt ที่เตรียมไว้ เมื่อฮาร์เนส execute dynamic tool call ให้คืนผลลัพธ์เครื่องมือกลับผ่าน shape ผลลัพธ์ของฮาร์เนส แทนที่จะส่งสื่อของช่องทางเอง

สิ่งนี้ทำให้เอาต์พุตข้อความ ภาพ วิดีโอ เพลง TTS, approval และ messaging-tool อยู่บน path การส่งเดียวกันกับการรันที่ backing โดย PI

## ข้อจำกัดปัจจุบัน

- พาธนำเข้าสาธารณะเป็นแบบทั่วไป แต่ alias ของชนิด attempt/result บางรายการยังคง
  ใช้ชื่อ `Pi` เพื่อความเข้ากันได้
- การติดตั้งฮาร์เนสของบุคคลที่สามยังอยู่ในขั้นทดลอง แนะนำให้ใช้ Plugin ผู้ให้บริการ
  จนกว่าคุณจะต้องใช้รันไทม์เซสชันแบบเนทีฟ
- รองรับการสลับฮาร์เนสข้ามรอบโต้ตอบ อย่าสลับฮาร์เนสใน
  ระหว่างรอบโต้ตอบหลังจากเครื่องมือแบบเนทีฟ การอนุมัติ ข้อความของผู้ช่วย หรือการส่ง
  ข้อความได้เริ่มแล้ว

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview)
- [ตัวช่วยรันไทม์](/th/plugins/sdk-runtime)
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins)
- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
