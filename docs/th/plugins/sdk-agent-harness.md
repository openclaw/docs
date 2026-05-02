---
read_when:
    - คุณกำลังเปลี่ยนแปลงรันไทม์เอเจนต์แบบฝังหรือรีจิสทรีฮาร์เนส
    - คุณกำลังลงทะเบียนฮาร์เนสของเอเจนต์จาก Plugin ที่บันเดิลมาด้วยหรือเชื่อถือได้
    - คุณต้องเข้าใจว่า Plugin Codex เกี่ยวข้องกับผู้ให้บริการโมเดลอย่างไร
sidebarTitle: Agent Harness
summary: อินเทอร์เฟซ SDK เชิงทดลองสำหรับ Plugin ที่แทนที่ตัวดำเนินการเอเจนต์แบบฝังตัวระดับต่ำ
title: Plugin ฮาร์เนสของเอเจนต์
x-i18n:
    generated_at: "2026-05-02T10:25:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**ฮาร์เนสเอเจนต์** คือ executor ระดับต่ำสำหรับหนึ่งเทิร์นของเอเจนต์ OpenClaw ที่เตรียมไว้แล้ว
ไม่ใช่ผู้ให้บริการโมเดล ไม่ใช่ช่องทาง และไม่ใช่รีจิสทรีเครื่องมือ
สำหรับโมเดลความเข้าใจฝั่งผู้ใช้ โปรดดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)

ใช้พื้นผิวนี้เฉพาะกับ Plugin เนทีฟที่มาพร้อมชุดหรือเชื่อถือได้เท่านั้น สัญญายังเป็น
แบบทดลองอยู่ เพราะชนิดพารามิเตอร์ตั้งใจสะท้อน runner แบบฝังปัจจุบัน

## ควรใช้ฮาร์เนสเมื่อใด

ลงทะเบียนฮาร์เนสเอเจนต์เมื่อแฟมิลีโมเดลมีรันไทม์เซสชันเนทีฟของตัวเอง
และทรานสปอร์ตผู้ให้บริการ OpenClaw ปกติเป็น abstraction ที่ไม่เหมาะสม

ตัวอย่าง:

- เซิร์ฟเวอร์เอเจนต์เขียนโค้ดเนทีฟที่เป็นเจ้าของเธรดและ compaction
- CLI หรือ daemon ในเครื่องที่ต้องสตรีมเหตุการณ์แผน/การให้เหตุผล/เครื่องมือแบบเนทีฟ
- รันไทม์โมเดลที่ต้องใช้ resume id ของตัวเองนอกเหนือจากทรานสคริปต์เซสชันของ OpenClaw

**ห้าม** ลงทะเบียนฮาร์เนสเพียงเพื่อเพิ่ม API ของ LLM ใหม่ สำหรับ API โมเดล HTTP หรือ
WebSocket ปกติ ให้สร้าง [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins)

## core ยังเป็นเจ้าของอะไรอยู่

ก่อนเลือกฮาร์เนส OpenClaw ได้ resolve สิ่งต่อไปนี้แล้ว:

- ผู้ให้บริการและโมเดล
- สถานะ auth ของรันไทม์
- ระดับการคิดและงบประมาณคอนเท็กซ์
- ไฟล์ทรานสคริปต์/เซสชันของ OpenClaw
- workspace, sandbox และนโยบายเครื่องมือ
- callback สำหรับการตอบกลับช่องทางและ callback สำหรับการสตรีม
- นโยบาย model fallback และการสลับโมเดลสด

การแบ่งส่วนนี้เป็นความตั้งใจ ฮาร์เนสรัน attempt ที่เตรียมไว้แล้ว ไม่ได้เลือก
ผู้ให้บริการ แทนที่การส่งมอบช่องทาง หรือสลับโมเดลอย่างเงียบๆ

attempt ที่เตรียมไว้ยังรวม `params.runtimePlan` ซึ่งเป็นชุดนโยบายที่ OpenClaw เป็นเจ้าของ
สำหรับการตัดสินใจรันไทม์ที่ต้องคงไว้ร่วมกันระหว่าง PI และฮาร์เนสเนทีฟ:

- `runtimePlan.tools.normalize(...)` และ
  `runtimePlan.tools.logDiagnostics(...)` สำหรับนโยบายสคีมาเครื่องมือที่รู้บริบทผู้ให้บริการ
- `runtimePlan.transcript.resolvePolicy(...)` สำหรับการ sanitize ทรานสคริปต์และ
  นโยบายซ่อมแซม tool-call
- `runtimePlan.delivery.isSilentPayload(...)` สำหรับการกดการส่งมอบ `NO_REPLY` และสื่อร่วมกัน
- `runtimePlan.outcome.classifyRunResult(...)` สำหรับการจัดประเภท model fallback
- `runtimePlan.observability` สำหรับเมทาดาทาผู้ให้บริการ/โมเดล/ฮาร์เนสที่ resolve แล้ว

ฮาร์เนสอาจใช้แผนนี้สำหรับการตัดสินใจที่ต้องตรงกับพฤติกรรมของ PI แต่
ยังควรมองว่าเป็นสถานะ attempt ที่ host เป็นเจ้าของ ห้าม mutate หรือใช้เพื่อ
สลับผู้ให้บริการ/โมเดลภายในเทิร์น

## ลงทะเบียนฮาร์เนส

**อิมพอร์ต:** `openclaw/plugin-sdk/agent-harness`

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

OpenClaw เลือกฮาร์เนสหลังจาก resolve ผู้ให้บริการ/โมเดลแล้ว:

1. harness id ที่บันทึกไว้ของเซสชันเดิมชนะ เพื่อให้การเปลี่ยน config/env ไม่
   hot-switch ทรานสคริปต์นั้นไปยังรันไทม์อื่น
2. `OPENCLAW_AGENT_RUNTIME=<id>` บังคับใช้ฮาร์เนสที่ลงทะเบียนไว้ซึ่งมี id นั้นสำหรับ
   เซสชันที่ยังไม่ได้ pin
3. `OPENCLAW_AGENT_RUNTIME=pi` บังคับใช้ฮาร์เนส PI ในตัว
4. `OPENCLAW_AGENT_RUNTIME=auto` ขอให้ฮาร์เนสที่ลงทะเบียนไว้ตอบว่ารองรับ
   ผู้ให้บริการ/โมเดลที่ resolve แล้วหรือไม่
5. หากไม่มีฮาร์เนสที่ลงทะเบียนไว้ตรงกัน OpenClaw จะใช้ PI เว้นแต่จะปิดใช้
   PI fallback

ความล้มเหลวของฮาร์เนส Plugin จะแสดงเป็นความล้มเหลวของการรัน ในโหมด `auto` จะใช้ PI fallback
เฉพาะเมื่อไม่มีฮาร์เนส Plugin ที่ลงทะเบียนไว้รองรับ
ผู้ให้บริการ/โมเดลที่ resolve แล้วเท่านั้น เมื่อฮาร์เนส Plugin ได้ claim การรันแล้ว OpenClaw จะไม่
replay เทิร์นเดียวกันนั้นผ่าน PI เพราะอาจเปลี่ยน semantics ของ auth/รันไทม์
หรือทำ side effect ซ้ำ

harness id ที่เลือกจะถูก persist พร้อม session id หลังจากการรันแบบฝัง
เซสชัน legacy ที่สร้างก่อนมี harness pin จะถือว่าเป็น PI-pinned เมื่อมีประวัติ
ทรานสคริปต์แล้ว ใช้เซสชันใหม่/รีเซ็ตเมื่อเปลี่ยนระหว่าง PI กับ
ฮาร์เนส Plugin เนทีฟ `/status` แสดง harness id ที่ไม่ใช่ค่าเริ่มต้น เช่น `codex`
ถัดจาก `Fast`; PI จะถูกซ่อนไว้เพราะเป็นเส้นทางความเข้ากันได้เริ่มต้น
หากฮาร์เนสที่เลือกดูน่าประหลาดใจ ให้เปิดการล็อก debug `agents/harness` และ
ตรวจสอบเรคคอร์ด `agent harness selected` แบบมีโครงสร้างของ gateway ซึ่งรวม
harness id ที่เลือก เหตุผลการเลือก นโยบายรันไทม์/fallback และในโหมด
`auto` ผลการรองรับของ candidate Plugin แต่ละตัว

Plugin Codex ที่มาพร้อมชุดลงทะเบียน `codex` เป็น harness id ของตัวเอง core ปฏิบัติต่อสิ่งนั้น
เป็น harness id ของ Plugin ปกติ alias เฉพาะ Codex ควรอยู่ใน Plugin
หรือ config ของ operator ไม่ใช่ในตัวเลือกรันไทม์ร่วม

## การจับคู่ผู้ให้บริการกับฮาร์เนส

ฮาร์เนสส่วนใหญ่ควรลงทะเบียนผู้ให้บริการด้วย ผู้ให้บริการทำให้ model ref,
สถานะ auth, เมทาดาทาโมเดล และการเลือก `/model` มองเห็นได้ต่อส่วนที่เหลือของ
OpenClaw จากนั้นฮาร์เนสจึง claim ผู้ให้บริการนั้นใน `supports(...)`

Plugin Codex ที่มาพร้อมชุดทำตาม pattern นี้:

- model ref ผู้ใช้ที่แนะนำ: `openai/gpt-5.5` พร้อม
  `agentRuntime.id: "codex"`
- ref เพื่อความเข้ากันได้: ref legacy `codex/gpt-*` ยังยอมรับอยู่ แต่ config ใหม่
  ไม่ควรใช้เป็น ref ผู้ให้บริการ/โมเดลปกติ
- harness id: `codex`
- auth: ความพร้อมใช้งานผู้ให้บริการสังเคราะห์ เพราะฮาร์เนส Codex เป็นเจ้าของ
  login/เซสชัน Codex เนทีฟ
- คำขอ app-server: OpenClaw ส่ง model id เปล่าไปยัง Codex และให้
  ฮาร์เนสคุยกับโปรโตคอล app-server เนทีฟ

Plugin Codex เป็นแบบเพิ่มเข้ามา ref `openai/gpt-*` แบบ plain ยังคงใช้
เส้นทางผู้ให้บริการ OpenClaw ปกติ เว้นแต่คุณจะบังคับฮาร์เนส Codex ด้วย
`agentRuntime.id: "codex"` ref `codex/gpt-*` รุ่นเก่ายังเลือก
ผู้ให้บริการและฮาร์เนส Codex เพื่อความเข้ากันได้

สำหรับการตั้งค่า operator, ตัวอย่าง prefix โมเดล และ config เฉพาะ Codex โปรดดู
[ฮาร์เนส Codex](/th/plugins/codex-harness)

OpenClaw ต้องใช้ Codex app-server `0.125.0` หรือใหม่กว่า Plugin Codex ตรวจสอบ
handshake initialize ของ app-server และบล็อกเซิร์ฟเวอร์ที่เก่ากว่าหรือไม่มีเวอร์ชัน เพื่อให้
OpenClaw รันกับพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้วเท่านั้น floor
`0.125.0` รวมการรองรับ payload hook MCP เนทีฟที่ landed ใน
Codex `0.124.0` ขณะเดียวกันก็ pin OpenClaw ไว้กับสาย stable ที่ใหม่กว่าและผ่านการทดสอบแล้ว

### middleware ของผลลัพธ์เครื่องมือ

Plugin ที่มาพร้อมชุดสามารถแนบ middleware ของผลลัพธ์เครื่องมือที่เป็นกลางต่อรันไทม์ผ่าน
`api.registerAgentToolResultMiddleware(...)` เมื่อ manifest ประกาศ
runtime id เป้าหมายใน `contracts.agentToolResultMiddleware` seam ที่เชื่อถือได้นี้
มีไว้สำหรับ transform ผลลัพธ์เครื่องมือแบบ async ที่ต้องรันก่อน PI หรือ Codex ป้อน
เอาต์พุตเครื่องมือกลับเข้าสู่โมเดล

Plugin legacy ที่มาพร้อมชุดยังใช้
`api.registerCodexAppServerExtensionFactory(...)` สำหรับ middleware เฉพาะ Codex app-server ได้
แต่ transform ผลลัพธ์ใหม่ควรใช้ API ที่เป็นกลางต่อรันไทม์
hook เฉพาะ Pi `api.registerEmbeddedExtensionFactory(...)` ถูกลบแล้ว
transform ผลลัพธ์เครื่องมือของ Pi ต้องใช้ middleware ที่เป็นกลางต่อรันไทม์

### การจัดประเภทผลลัพธ์ terminal

ฮาร์เนสเนทีฟที่เป็นเจ้าของ protocol projection ของตัวเองสามารถใช้
`classifyAgentHarnessTerminalOutcome(...)` จาก
`openclaw/plugin-sdk/agent-harness-runtime` เมื่อเทิร์นที่เสร็จสมบูรณ์ไม่สร้าง
ข้อความผู้ช่วยที่มองเห็นได้ helper จะคืนค่า `empty`, `reasoning-only` หรือ
`planning-only` เพื่อให้นโยบาย fallback ของ OpenClaw ตัดสินใจว่าจะ retry บน
โมเดลอื่นหรือไม่ โดยตั้งใจไม่จัดประเภท prompt error, เทิร์นที่กำลังรัน และ
การตอบแบบเงียบที่ตั้งใจไว้ เช่น `NO_REPLY`

### โหมดฮาร์เนส Codex เนทีฟ

ฮาร์เนส `codex` ที่มาพร้อมชุดคือโหมด Codex เนทีฟสำหรับเทิร์นเอเจนต์ OpenClaw แบบฝัง
เปิดใช้ Plugin `codex` ที่มาพร้อมชุดก่อน และรวม `codex` ไว้ใน
`plugins.allow` หาก config ของคุณใช้ allowlist แบบจำกัด config app-server เนทีฟ
ควรใช้ `openai/gpt-*` พร้อม `agentRuntime.id: "codex"`
ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่าน PI แทน ref โมเดล `codex/*`
แบบ legacy ยังคงเป็น alias เพื่อความเข้ากันได้สำหรับฮาร์เนสเนทีฟ

เมื่อโหมดนี้รัน Codex เป็นเจ้าของ thread id เนทีฟ, พฤติกรรม resume,
compaction และการดำเนินการ app-server OpenClaw ยังเป็นเจ้าของช่องทางแชต,
mirror ทรานสคริปต์ที่มองเห็นได้, นโยบายเครื่องมือ, การอนุมัติ, การส่งมอบสื่อ และการเลือก
เซสชัน ใช้ `agentRuntime.id: "codex"` โดยไม่มี override `fallback`
เมื่อคุณต้องพิสูจน์ว่าเฉพาะเส้นทาง Codex app-server เท่านั้นที่ claim การรันได้
รันไทม์ Plugin แบบ explicit fail closed เป็นค่าเริ่มต้นอยู่แล้ว ตั้งค่า `fallback: "pi"`
เฉพาะเมื่อคุณตั้งใจให้ PI จัดการการเลือกฮาร์เนสที่หายไป ความล้มเหลวของ
Codex app-server จะ fail โดยตรงอยู่แล้ว แทนที่จะ retry ผ่าน PI

## ปิดใช้ PI fallback

โดยค่าเริ่มต้น OpenClaw รันเอเจนต์แบบฝังโดยตั้งค่า `agents.defaults.agentRuntime`
เป็น `{ id: "auto", fallback: "pi" }` ในโหมด `auto` ฮาร์เนส Plugin ที่ลงทะเบียนไว้
สามารถ claim คู่ผู้ให้บริการ/โมเดลได้ หากไม่มีตัวใดตรงกัน OpenClaw จะ fallback
ไปยัง PI

ในโหมด `auto` ให้ตั้งค่า `fallback: "none"` เมื่อคุณต้องการให้การเลือกฮาร์เนส Plugin
ที่หายไป fail แทนที่จะใช้ PI รันไทม์ Plugin แบบ explicit เช่น
`agentRuntime.id: "codex"` fail closed เป็นค่าเริ่มต้นอยู่แล้ว เว้นแต่
ตั้งค่า `fallback: "pi"` ใน config เดียวกันหรือ scope override ของ environment เดียวกัน
ความล้มเหลวของฮาร์เนส Plugin ที่เลือกไว้จะ fail hard เสมอ สิ่งนี้ไม่บล็อก
`agentRuntime.id: "pi"` แบบ explicit หรือ `OPENCLAW_AGENT_RUNTIME=pi`

สำหรับการรันแบบฝังเฉพาะ Codex:

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

หากคุณต้องการให้ฮาร์เนส Plugin ที่ลงทะเบียนไว้ใดๆ claim โมเดลที่ตรงกัน แต่ไม่ต้องการให้
OpenClaw fallback ไปยัง PI อย่างเงียบๆ ให้คง `runtime: "auto"` และปิดใช้
fallback:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

override รายเอเจนต์ใช้รูปแบบเดียวกัน:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` ยังคง override รันไทม์ที่ config ไว้ ใช้
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อปิดใช้ PI fallback จาก
environment

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

เมื่อปิดใช้ fallback เซสชันจะ fail ตั้งแต่ต้นเมื่อฮาร์เนสที่ขอไม่ได้
ลงทะเบียน ไม่รองรับผู้ให้บริการ/โมเดลที่ resolve แล้ว หรือ fail ก่อน
สร้าง side effect ของเทิร์น นี่เป็นความตั้งใจสำหรับ deployment เฉพาะ Codex และ
สำหรับ live test ที่ต้องพิสูจน์ว่าเส้นทาง Codex app-server ถูกใช้งานจริง

การตั้งค่านี้ควบคุมเฉพาะฮาร์เนสเอเจนต์แบบฝัง ไม่ได้ปิดใช้
การกำหนดเส้นทางโมเดลเฉพาะผู้ให้บริการสำหรับภาพ วิดีโอ เพลง TTS, PDF หรืออื่นๆ

## เซสชันเนทีฟและ mirror ทรานสคริปต์

ฮาร์เนสอาจเก็บ session id, thread id หรือ resume token ฝั่ง daemon แบบเนทีฟ
ผูก binding นั้นให้สัมพันธ์กับเซสชัน OpenClaw อย่างชัดเจน และคงการ
mirror เอาต์พุตผู้ช่วย/เครื่องมือที่ผู้ใช้มองเห็นได้เข้าสู่ทรานสคริปต์ OpenClaw

ทรานสคริปต์ OpenClaw ยังคงเป็นชั้นความเข้ากันได้สำหรับ:

- ประวัติเซสชันที่ช่องทางมองเห็นได้
- การค้นหาและจัดทำดัชนีทรานสคริปต์
- การสลับกลับไปยังฮาร์เนส PI ในตัวในเทิร์นถัดไป
- พฤติกรรม `/new`, `/reset` และการลบเซสชันแบบทั่วไป

หากฮาร์เนสของคุณเก็บ binding แบบ sidecar ให้ implement `reset(...)` เพื่อให้ OpenClaw
ล้างได้เมื่อเซสชัน OpenClaw ที่เป็นเจ้าของถูกรีเซ็ต

## ผลลัพธ์เครื่องมือและสื่อ

Core สร้างรายการเครื่องมือของ OpenClaw และส่งเข้าไปยัง attempt ที่เตรียมไว้
เมื่อฮาร์เนสเรียกใช้การเรียกเครื่องมือแบบไดนามิก ให้ส่งผลลัพธ์ของเครื่องมือกลับผ่าน
รูปแบบผลลัพธ์ของฮาร์เนส แทนการส่งสื่อของช่องทางด้วยตัวเอง

วิธีนี้ทำให้เอาต์พุตข้อความ รูปภาพ วิดีโอ เพลง TTS การอนุมัติ และเครื่องมือส่งข้อความ
อยู่บนเส้นทางการส่งมอบเดียวกับการรันที่รองรับโดย Pi

## ข้อจำกัดปัจจุบัน

- เส้นทาง import สาธารณะเป็นแบบทั่วไป แต่ type alias ของ attempt/result บางรายการยังคง
  ใช้ชื่อ `Pi` เพื่อความเข้ากันได้
- การติดตั้งฮาร์เนสของบุคคลที่สามยังเป็นแบบทดลอง ควรใช้ Plugin ของผู้ให้บริการ
  จนกว่าคุณจะต้องการรันไทม์เซสชันแบบ native
- รองรับการสลับฮาร์เนสข้าม turn อย่าสลับฮาร์เนสใน
  กลาง turn หลังจากเครื่องมือ native การอนุมัติ ข้อความของผู้ช่วย หรือการส่งข้อความ
  เริ่มต้นแล้ว

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview)
- [ตัวช่วยรันไทม์](/th/plugins/sdk-runtime)
- [Plugin ของผู้ให้บริการ](/th/plugins/sdk-provider-plugins)
- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
