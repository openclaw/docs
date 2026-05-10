---
read_when:
    - คุณกำลังเปลี่ยนรันไทม์เอเจนต์แบบฝังตัวหรือรีจิสทรีของฮาร์เนส
    - คุณกำลังลงทะเบียนฮาร์เนสของเอเจนต์จาก Plugin ที่รวมมาให้หรือเชื่อถือได้
    - คุณต้องเข้าใจว่า Plugin Codex เกี่ยวข้องกับผู้ให้บริการโมเดลอย่างไร
sidebarTitle: Agent Harness
summary: ส่วนติดต่อ SDK เชิงทดลองสำหรับ Plugin ที่แทนที่ตัวดำเนินการเอเจนต์แบบฝังตัวระดับต่ำ
title: Plugin สำหรับชุดควบคุมเอเจนต์
x-i18n:
    generated_at: "2026-05-10T19:49:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**ฮาร์เนสเอเจนต์** คือ executor ระดับต่ำสำหรับหนึ่งเทิร์นของเอเจนต์ OpenClaw ที่เตรียมไว้แล้ว ไม่ใช่ผู้ให้บริการโมเดล ไม่ใช่ช่องทาง และไม่ใช่ registry ของเครื่องมือ สำหรับโมเดลทางความคิดที่ผู้ใช้เห็น ให้ดู [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)

ใช้พื้นผิวนี้เฉพาะกับ Plugin แบบ native ที่ bundled หรือเชื่อถือได้เท่านั้น สัญญายังเป็นแบบทดลอง เพราะชนิดพารามิเตอร์ตั้งใจให้สะท้อน runner แบบฝังตัวปัจจุบัน

## ควรใช้ฮาร์เนสเมื่อใด

ลงทะเบียนฮาร์เนสเอเจนต์เมื่อ family ของโมเดลมีรันไทม์เซสชัน native ของตัวเอง และ transport ผู้ให้บริการ OpenClaw ปกติเป็น abstraction ที่ไม่เหมาะสม

ตัวอย่าง:

- เซิร์ฟเวอร์เอเจนต์เขียนโค้ดแบบ native ที่เป็นเจ้าของเธรดและ Compaction
- CLI หรือ daemon ภายในเครื่องที่ต้อง stream เหตุการณ์ native plan/reasoning/tool
- รันไทม์โมเดลที่ต้องมี resume id ของตัวเองนอกเหนือจาก transcript ของเซสชัน OpenClaw

อย่าลงทะเบียนฮาร์เนสเพียงเพื่อเพิ่ม LLM API ใหม่ สำหรับ API โมเดล HTTP หรือ WebSocket ปกติ ให้สร้าง [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins)

## สิ่งที่ core ยังเป็นเจ้าของ

ก่อนเลือกฮาร์เนส OpenClaw ได้ resolve สิ่งต่อไปนี้แล้ว:

- ผู้ให้บริการและโมเดล
- สถานะ auth ของรันไทม์
- ระดับ thinking และ context budget
- ไฟล์ transcript/เซสชัน OpenClaw
- workspace, sandbox และนโยบายเครื่องมือ
- callback สำหรับการตอบกลับของช่องทางและ callback สำหรับ streaming
- นโยบาย fallback ของโมเดลและการสลับโมเดลสด

การแบ่งส่วนนี้ตั้งใจไว้ ฮาร์เนสรัน attempt ที่เตรียมไว้แล้ว ไม่ได้เลือกผู้ให้บริการ แทนที่การส่งผ่านช่องทาง หรือสลับโมเดลอย่างเงียบ ๆ

attempt ที่เตรียมไว้ยังมี `params.runtimePlan` ซึ่งเป็นชุดนโยบายที่ OpenClaw เป็นเจ้าของสำหรับการตัดสินใจด้านรันไทม์ที่ต้องคงไว้ร่วมกันระหว่าง PI และฮาร์เนส native:

- `runtimePlan.tools.normalize(...)` และ
  `runtimePlan.tools.logDiagnostics(...)` สำหรับนโยบาย schema เครื่องมือที่รับรู้ผู้ให้บริการ
- `runtimePlan.transcript.resolvePolicy(...)` สำหรับการ sanitize transcript และนโยบายซ่อมแซม tool-call
- `runtimePlan.delivery.isSilentPayload(...)` สำหรับ `NO_REPLY` ที่ใช้ร่วมกันและการระงับการส่งมอบ media
- `runtimePlan.outcome.classifyRunResult(...)` สำหรับการจัดประเภท fallback ของโมเดล
- `runtimePlan.observability` สำหรับ metadata ผู้ให้บริการ/โมเดล/ฮาร์เนสที่ resolve แล้ว

ฮาร์เนสอาจใช้ plan สำหรับการตัดสินใจที่ต้องตรงกับพฤติกรรม PI แต่ยังควรมองว่าเป็นสถานะ attempt ที่ host เป็นเจ้าของ อย่า mutate หรือใช้เพื่อสลับผู้ให้บริการ/โมเดลภายในเทิร์น

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

OpenClaw เลือกฮาร์เนสหลังจาก resolve ผู้ให้บริการ/โมเดล:

1. นโยบายรันไทม์ระดับโมเดลมีสิทธิ์ก่อน
2. นโยบายรันไทม์ระดับผู้ให้บริการตามมา
3. `auto` ถามฮาร์เนสที่ลงทะเบียนไว้ว่ารองรับผู้ให้บริการ/โมเดลที่ resolve แล้วหรือไม่
4. หากไม่มีฮาร์เนสที่ลงทะเบียนไว้ตรงกัน OpenClaw จะใช้ PI เว้นแต่ fallback ของ PI ถูกปิดใช้งาน

ความล้มเหลวของฮาร์เนส Plugin จะแสดงเป็นความล้มเหลวของ run ในโหมด `auto` จะใช้ fallback ของ PI เฉพาะเมื่อไม่มีฮาร์เนส Plugin ที่ลงทะเบียนไว้รองรับผู้ให้บริการ/โมเดลที่ resolve แล้วเท่านั้น เมื่อฮาร์เนส Plugin claim run แล้ว OpenClaw จะไม่ replay เทิร์นเดียวกันนั้นผ่าน PI เพราะอาจเปลี่ยน semantic ของ auth/รันไทม์หรือทำให้ side effect ซ้ำ

selection จะละเว้น runtime pin ระดับทั้งเซสชันและทั้งเอเจนต์ ซึ่งรวมถึงค่า `agentHarnessId` ของเซสชันเก่า, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime` และ `OPENCLAW_AGENT_RUNTIME` `/status` แสดงรันไทม์จริงที่เลือกจาก route ผู้ให้บริการ/โมเดล
หากฮาร์เนสที่เลือกดูไม่คาดคิด ให้เปิด debug logging ของ `agents/harness` แล้วตรวจสอบ record แบบมีโครงสร้าง `agent harness selected` ของ Gateway ซึ่งมี id ฮาร์เนสที่เลือก เหตุผลการเลือก นโยบายรันไทม์/fallback และในโหมด `auto` จะมีผลการรองรับของ candidate Plugin แต่ละตัว

Plugin Codex ที่ bundled ลงทะเบียน `codex` เป็น id ฮาร์เนส core ปฏิบัติต่อค่านี้เป็น id ฮาร์เนส Plugin ปกติ alias เฉพาะ Codex ควรอยู่ใน Plugin หรือ config ของ operator ไม่ใช่ใน runtime selector ที่ใช้ร่วมกัน

## การจับคู่ผู้ให้บริการกับฮาร์เนส

ฮาร์เนสส่วนใหญ่ควรลงทะเบียนผู้ให้บริการด้วย ผู้ให้บริการทำให้ model ref, สถานะ auth, metadata โมเดล และการเลือก `/model` มองเห็นได้กับส่วนอื่นของ OpenClaw จากนั้นฮาร์เนสจะ claim ผู้ให้บริการนั้นใน `supports(...)`

Plugin Codex ที่ bundled ใช้ pattern นี้:

- model ref ของผู้ใช้ที่แนะนำ: `openai/gpt-5.5`
- ref สำหรับ compatibility: ref เก่า `codex/gpt-*` ยังยอมรับได้ แต่ config ใหม่ไม่ควรใช้เป็น ref ผู้ให้บริการ/โมเดลปกติ
- id ฮาร์เนส: `codex`
- auth: ความพร้อมใช้งานของผู้ให้บริการแบบ synthetic เพราะฮาร์เนส Codex เป็นเจ้าของ native Codex login/session
- คำขอ app-server: OpenClaw ส่งเฉพาะ id โมเดลแบบ bare ไปยัง Codex และให้ฮาร์เนสคุยกับโปรโตคอล native app-server

Plugin Codex เป็นแบบ additive ref เอเจนต์ `openai/gpt-*` ธรรมดาบนผู้ให้บริการ OpenAI ทางการจะเลือกฮาร์เนส Codex ตามค่าเริ่มต้น ref เก่า `codex/gpt-*` ยังเลือกผู้ให้บริการและฮาร์เนส Codex เพื่อ compatibility

สำหรับการตั้งค่า operator ตัวอย่าง model prefix และ config เฉพาะ Codex ให้ดู [ฮาร์เนส Codex](/th/plugins/codex-harness)

OpenClaw ต้องใช้ Codex app-server `0.125.0` หรือใหม่กว่า Plugin Codex ตรวจ handshake การ initialize ของ app-server และบล็อกเซิร์ฟเวอร์ที่เก่ากว่าหรือไม่มีเวอร์ชัน เพื่อให้ OpenClaw รันกับพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้วเท่านั้น floor `0.125.0` รวมถึงการรองรับ payload ของ native MCP hook ที่เข้ามาใน Codex `0.124.0` พร้อมกับ pin OpenClaw กับสาย stable ที่ใหม่กว่าและผ่านการทดสอบแล้ว

### middleware ของผลลัพธ์เครื่องมือ

Plugin ที่ bundled สามารถแนบ middleware ผลลัพธ์เครื่องมือที่เป็นกลางต่อรันไทม์ผ่าน `api.registerAgentToolResultMiddleware(...)` เมื่อ manifest ประกาศ id รันไทม์เป้าหมายใน `contracts.agentToolResultMiddleware` seam ที่เชื่อถือได้นี้มีไว้สำหรับ transform ผลลัพธ์เครื่องมือแบบ async ที่ต้องรันก่อนที่ PI หรือ Codex จะป้อน output ของเครื่องมือกลับเข้าโมเดล

Plugin เก่าที่ bundled ยังใช้ `api.registerCodexAppServerExtensionFactory(...)` สำหรับ middleware เฉพาะ Codex app-server ได้ แต่ transform ผลลัพธ์ใหม่ควรใช้ API ที่เป็นกลางต่อรันไทม์
hook เฉพาะ Pi `api.registerEmbeddedExtensionFactory(...)` ถูกลบแล้ว transform ผลลัพธ์เครื่องมือของ Pi ต้องใช้ middleware ที่เป็นกลางต่อรันไทม์

### การจัดประเภทผลลัพธ์ปลายทาง

ฮาร์เนส native ที่เป็นเจ้าของ protocol projection ของตัวเองสามารถใช้ `classifyAgentHarnessTerminalOutcome(...)` จาก `openclaw/plugin-sdk/agent-harness-runtime` เมื่อเทิร์นที่เสร็จแล้วไม่มีข้อความผู้ช่วยที่มองเห็นได้ helper จะคืนค่า `empty`, `reasoning-only` หรือ `planning-only` เพื่อให้นโยบาย fallback ของ OpenClaw ตัดสินใจว่าจะ retry บนโมเดลอื่นหรือไม่ โดยตั้งใจไม่จัดประเภทข้อผิดพลาด prompt, เทิร์นที่ยังรันอยู่ และการตอบกลับแบบเงียบโดยตั้งใจ เช่น `NO_REPLY`

### โหมดฮาร์เนส Codex แบบ native

ฮาร์เนส `codex` ที่ bundled คือโหมด Codex แบบ native สำหรับเทิร์นเอเจนต์ OpenClaw แบบฝังตัว เปิดใช้ Plugin `codex` ที่ bundled ก่อน และใส่ `codex` ใน `plugins.allow` หาก config ของคุณใช้ allowlist แบบจำกัด config native app-server ควรใช้ `openai/gpt-*`; เทิร์นเอเจนต์ OpenAI จะเลือกฮาร์เนส Codex ตามค่าเริ่มต้น route เก่า `openai-codex/*` ควรซ่อมด้วย `openclaw doctor --fix` และ model ref เก่า `codex/*` ยังคงเป็น alias เพื่อ compatibility สำหรับฮาร์เนส native

เมื่อโหมดนี้รัน Codex เป็นเจ้าของ native thread id, พฤติกรรม resume, Compaction และการ execution ของ app-server OpenClaw ยังเป็นเจ้าของช่องทางแชต mirror transcript ที่มองเห็นได้ นโยบายเครื่องมือ approvals การส่งมอบ media และการเลือกเซสชัน ใช้ `agentRuntime.id: "codex"` ของผู้ให้บริการ/โมเดลเมื่อคุณต้องพิสูจน์ว่าเฉพาะเส้นทาง Codex app-server เท่านั้นที่ claim run ได้ รันไทม์ Plugin แบบ explicit จะ fail closed; ความล้มเหลวในการเลือก Codex app-server และความล้มเหลวของรันไทม์จะไม่ถูก retry ผ่าน PI

## ความเข้มงวดของรันไทม์

โดยค่าเริ่มต้น OpenClaw ใช้นโยบายรันไทม์ผู้ให้บริการ/โมเดลแบบ `auto`: ฮาร์เนส Plugin ที่ลงทะเบียนไว้สามารถ claim คู่ผู้ให้บริการ/โมเดลได้ และ PI จัดการเทิร์นเมื่อไม่มีตัวใดตรงกัน ref เอเจนต์ OpenAI บนผู้ให้บริการ OpenAI ทางการจะใช้ Codex เป็นค่าเริ่มต้น ใช้รันไทม์ Plugin ผู้ให้บริการ/โมเดลแบบ explicit เช่น `agentRuntime.id: "codex"` เมื่อการเลือกฮาร์เนสที่หายไปควรล้มเหลวแทนที่จะ route ผ่าน PI ความล้มเหลวของฮาร์เนส Plugin ที่เลือกไว้จะล้มเหลวแบบ hard เสมอ สิ่งนี้ไม่บล็อก `agentRuntime.id: "pi"` ระดับผู้ให้บริการ/โมเดลแบบ explicit

สำหรับ run แบบฝังตัวเฉพาะ Codex:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

หากคุณต้องการ backend CLI สำหรับโมเดล canonical หนึ่งตัว ให้ใส่รันไทม์ไว้ใน entry ของโมเดลนั้น:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

override รายเอเจนต์ใช้ shape ระดับโมเดลเดียวกัน:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

ตัวอย่างรันไทม์ทั้งเอเจนต์แบบเก่าเช่นนี้จะถูกละเว้น:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

เมื่อใช้รันไทม์ Plugin แบบ explicit เซสชันจะล้มเหลวตั้งแต่ต้นเมื่อฮาร์เนสที่ร้องขอไม่ได้ลงทะเบียน ไม่รองรับผู้ให้บริการ/โมเดลที่ resolve แล้ว หรือล้มเหลวก่อนสร้าง side effect ของเทิร์น นี่เป็นความตั้งใจสำหรับ deployment เฉพาะ Codex และสำหรับ live test ที่ต้องพิสูจน์ว่าเส้นทาง Codex app-server ถูกใช้งานจริง

การตั้งค่านี้ควบคุมเฉพาะฮาร์เนสเอเจนต์แบบฝังตัว ไม่ได้ปิดใช้ routing โมเดลเฉพาะผู้ให้บริการสำหรับรูปภาพ วิดีโอ เพลง TTS, PDF หรืออื่น ๆ

## เซสชัน native และ mirror ของ transcript

ฮาร์เนสอาจเก็บ native session id, thread id หรือ resume token ฝั่ง daemon ให้ผูก binding นั้นกับเซสชัน OpenClaw อย่างชัดเจน และ mirror output ของผู้ช่วย/เครื่องมือที่ผู้ใช้มองเห็นเข้า transcript ของ OpenClaw ต่อไป

transcript ของ OpenClaw ยังคงเป็นเลเยอร์ compatibility สำหรับ:

- ประวัติเซสชันที่ช่องทางมองเห็นได้
- การค้นหาและ indexing transcript
- การสลับกลับไปยังฮาร์เนส PI ในตัวบนเทิร์นถัดไป
- พฤติกรรมทั่วไปของ `/new`, `/reset` และการลบเซสชัน

หากฮาร์เนสของคุณเก็บ sidecar binding ให้ implement `reset(...)` เพื่อให้ OpenClaw ล้างได้เมื่อเซสชัน OpenClaw ที่เป็นเจ้าของถูก reset

## ผลลัพธ์เครื่องมือและ media

core สร้างรายการเครื่องมือ OpenClaw และส่งเข้า attempt ที่เตรียมไว้ เมื่อฮาร์เนส execute dynamic tool call ให้คืนผลลัพธ์เครื่องมือกลับผ่าน shape ผลลัพธ์ของฮาร์เนส แทนที่จะส่ง media ช่องทางเอง

สิ่งนี้ทำให้ output ข้อความ รูปภาพ วิดีโอ เพลง TTS, approval และ messaging-tool อยู่บนเส้นทางการส่งมอบเดียวกับ run ที่หนุนด้วย PI

## ข้อจำกัดปัจจุบัน

- path import สาธารณะเป็นแบบ generic แต่ alias ของชนิด attempt/result บางตัวยังมีชื่อ `Pi` เพื่อ compatibility
- การติดตั้งฮาร์เนสของบุคคลที่สามยังเป็นแบบทดลอง ให้ใช้ Plugin ผู้ให้บริการก่อนจนกว่าคุณต้องการรันไทม์เซสชัน native
- รองรับการสลับฮาร์เนสข้ามเทิร์น อย่าสลับฮาร์เนสกลางเทิร์นหลังจาก native tools, approvals, ข้อความผู้ช่วย หรือการส่งข้อความเริ่มไปแล้ว

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview)
- [ตัวช่วยรันไทม์](/th/plugins/sdk-runtime)
- [Plugin สำหรับผู้ให้บริการ](/th/plugins/sdk-provider-plugins)
- [Harness ของ Codex](/th/plugins/codex-harness)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
