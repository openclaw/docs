---
read_when:
    - คุณกำลังเปลี่ยนแปลงรันไทม์เอเจนต์แบบฝังหรือรีจิสทรี harness
    - คุณกำลังลงทะเบียน harness ของเอเจนต์จาก Plugin ที่บันเดิลมาหรือเชื่อถือได้
    - คุณต้องเข้าใจว่า Plugin Codex เกี่ยวข้องกับผู้ให้บริการโมเดลอย่างไร
sidebarTitle: Agent Harness
summary: พื้นที่ผิว SDK แบบทดลองสำหรับ Plugin ที่มาแทนตัวดำเนินการเอเจนต์แบบฝังระดับล่าง
title: Plugin harness ของเอเจนต์
x-i18n:
    generated_at: "2026-04-26T11:37:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**agent harness** คือตัวดำเนินการระดับล่างสำหรับหนึ่งเทิร์นของเอเจนต์ OpenClaw ที่เตรียมไว้แล้ว มันไม่ใช่ผู้ให้บริการโมเดล ไม่ใช่ channel และไม่ใช่รีจิสทรีเครื่องมือ สำหรับมุมมองเชิงแนวคิดที่ผู้ใช้มองเห็น โปรดดู [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)

ให้ใช้พื้นผิวนี้เฉพาะกับ Plugin แบบ native ที่บันเดิลมาหรือเชื่อถือได้เท่านั้น contract นี้ยังคงเป็นแบบทดลอง เนื่องจากชนิดของพารามิเตอร์ตั้งใจให้สะท้อน embedded runner ปัจจุบันโดยตรง

## เมื่อใดควรใช้ harness

ให้ลงทะเบียน agent harness เมื่อกลุ่มโมเดลหนึ่งมีรันไทม์เซสชันแบบ native ของตัวเอง และ transport ของ provider แบบปกติใน OpenClaw ไม่ใช่นามธรรมที่เหมาะสม

ตัวอย่าง:

- เซิร์ฟเวอร์ coding-agent แบบ native ที่เป็นเจ้าของ threads และ Compaction
- CLI หรือ daemon ในเครื่องที่ต้องสตรีมเหตุการณ์ plan/reasoning/tool แบบ native
- รันไทม์โมเดลที่ต้องมี resume id ของตัวเองเพิ่มเติมจาก session transcript ของ OpenClaw

**อย่า**ลงทะเบียน harness เพียงเพื่อเพิ่ม API ของ LLM ใหม่ สำหรับ API ของโมเดลแบบ HTTP หรือ WebSocket ปกติ ให้สร้าง [provider plugin](/th/plugins/sdk-provider-plugins)

## สิ่งที่ core ยังคงเป็นเจ้าของ

ก่อนที่จะมีการเลือก harness, OpenClaw ได้ resolve สิ่งต่อไปนี้แล้ว:

- provider และ model
- สถานะการยืนยันตัวตนของ runtime
- ระดับการคิดและงบประมาณ context
- ไฟล์ transcript/session ของ OpenClaw
- workspace, sandbox และนโยบายเครื่องมือ
- callback สำหรับการตอบกลับของ channel และ callback สำหรับการสตรีม
- นโยบาย fallback ของโมเดลและการสลับโมเดลแบบสด

การแยกส่วนนี้ตั้งใจไว้โดยชัดเจน harness จะรันความพยายามที่เตรียมไว้แล้ว; มันจะไม่เลือก provider ไม่แทนที่การส่งมอบของ channel และไม่สลับโมเดลแบบเงียบ ๆ

ความพยายามที่เตรียมไว้ยังรวม `params.runtimePlan` ซึ่งเป็นชุดนโยบายที่ OpenClaw เป็นเจ้าของสำหรับการตัดสินใจด้าน runtime ที่ต้องคงใช้ร่วมกันระหว่าง PI และ harness แบบ native:

- `runtimePlan.tools.normalize(...)` และ
  `runtimePlan.tools.logDiagnostics(...)` สำหรับนโยบาย schema ของเครื่องมือที่รับรู้ provider
- `runtimePlan.transcript.resolvePolicy(...)` สำหรับนโยบายการทำให้ transcript ปลอดภัยและการซ่อมแซม tool-call
- `runtimePlan.delivery.isSilentPayload(...)` สำหรับการระงับการส่งมอบ `NO_REPLY` และสื่อที่ใช้ร่วมกัน
- `runtimePlan.outcome.classifyRunResult(...)` สำหรับการจำแนก fallback ของโมเดล
- `runtimePlan.observability` สำหรับเมทาดาทา provider/model/harness ที่ resolve แล้ว

Harness สามารถใช้แผนนี้สำหรับการตัดสินใจที่ต้องสอดคล้องกับพฤติกรรมของ PI ได้ แต่ยังควรมองมันเป็นสถานะของความพยายามที่ host เป็นเจ้าของ อย่าเปลี่ยนแปลงมัน หรือใช้มันเพื่อสลับ provider/model ภายในหนึ่งเทิร์น

## ลงทะเบียน harness

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

OpenClaw จะเลือก harness หลังจาก resolve provider/model แล้ว:

1. harness id ที่บันทึกไว้ของเซสชันที่มีอยู่จะมีสิทธิ์ก่อน ดังนั้นการเปลี่ยนแปลง config/env จะไม่สลับ transcript นั้นไประหว่างรันไทม์อื่นแบบ hot-switch
2. `OPENCLAW_AGENT_RUNTIME=<id>` จะบังคับใช้ harness ที่ลงทะเบียนแล้วซึ่งมี id นั้นสำหรับเซสชันที่ยังไม่ได้ถูกปักหมุดไว้
3. `OPENCLAW_AGENT_RUNTIME=pi` จะบังคับใช้ harness PI ที่มีมาในระบบ
4. `OPENCLAW_AGENT_RUNTIME=auto` จะถาม harness ที่ลงทะเบียนไว้ว่าแต่ละตัวรองรับ provider/model ที่ resolve แล้วหรือไม่
5. หากไม่มี harness ที่ลงทะเบียนตัวใดตรงกัน OpenClaw จะใช้ PI เว้นแต่จะปิด PI fallback ไว้

ความล้มเหลวของ harness จาก Plugin จะแสดงเป็นความล้มเหลวของการรัน ในโหมด `auto` จะใช้ PI fallback เฉพาะเมื่อไม่มี plugin harness ที่ลงทะเบียนไว้ตัวใดรองรับ provider/model ที่ resolve แล้วเท่านั้น เมื่อ plugin harness ใดรับงานรันไปแล้ว OpenClaw จะไม่เล่นเทิร์นเดิมซ้ำผ่าน PI เพราะนั่นอาจเปลี่ยนความหมายของ auth/runtime หรือทำให้เกิดผลข้างเคียงซ้ำซ้อน

harness id ที่เลือกจะถูกบันทึกไว้ร่วมกับ session id หลังจากมีการรันแบบ embedded เซสชันรุ่นเก่าที่สร้างก่อนมีการปักหมุด harness จะถือว่าเป็นแบบ PI-pinned เมื่อมีประวัติ transcript แล้ว ให้ใช้เซสชันใหม่/รีเซ็ตเมื่อสลับระหว่าง PI กับ plugin harness แบบ native `/status` จะแสดง harness id ที่ไม่ใช่ค่าเริ่มต้น เช่น `codex` ถัดจาก `Fast`; PI จะถูกซ่อนเพราะเป็นเส้นทาง compatibility ค่าเริ่มต้น หาก harness ที่เลือกดูไม่คาดคิด ให้เปิดใช้บันทึกดีบัก `agents/harness` และตรวจสอบระเบียนแบบ structured ของ gateway ชื่อ `agent harness selected` ซึ่งจะรวม harness id ที่เลือก เหตุผลในการเลือก นโยบาย runtime/fallback และในโหมด `auto` จะรวมผลการรองรับของผู้สมัครจาก Plugin แต่ละตัว

Plugin Codex ที่บันเดิลมาจะลงทะเบียน `codex` เป็น harness id ของมัน Core จะมองสิ่งนี้เป็น harness id ของ Plugin ทั่วไป; alias ที่เฉพาะกับ Codex ควรอยู่ใน Plugin หรือ config ของผู้ดูแลระบบ ไม่ใช่ในตัวเลือก runtime ที่ใช้ร่วมกัน

## การจับคู่ provider กับ harness

Harness ส่วนใหญ่ควรลงทะเบียน provider ด้วย provider จะทำให้ model ref, สถานะ auth, เมทาดาทาของโมเดล และการเลือก `/model` มองเห็นได้ต่อส่วนอื่นของ OpenClaw จากนั้น harness จึงค่อยอ้างสิทธิ์ provider นั้นใน `supports(...)`

Plugin Codex ที่บันเดิลมาทำตามรูปแบบนี้:

- model ref ที่ผู้ใช้นิยมใช้: `openai/gpt-5.5` ร่วมกับ
  `agentRuntime.id: "codex"`
- ref สำหรับ compatibility: ref `codex/gpt-*` แบบเดิมยังคงใช้งานได้ แต่ config ใหม่ไม่ควรใช้เป็น ref provider/model ปกติ
- harness id: `codex`
- auth: ความพร้อมใช้งานของ provider แบบสังเคราะห์ เพราะ harness Codex เป็นเจ้าของการล็อกอิน/เซสชัน Codex แบบ native
- คำขอ app-server: OpenClaw ส่ง model id แบบเปล่าไปยัง Codex และให้ harness คุยกับโปรโตคอล app-server แบบ native

Plugin Codex เป็นส่วนเสริม ref `openai/gpt-*` ปกติจะยังคงใช้เส้นทาง provider ปกติของ OpenClaw เว้นแต่คุณจะบังคับใช้ harness Codex ด้วย
`agentRuntime.id: "codex"` ref `codex/gpt-*` รุ่นเก่ายังคงเลือก provider และ harness ของ Codex เพื่อคง compatibility

สำหรับการตั้งค่าฝั่งผู้ดูแลระบบ ตัวอย่าง prefix ของโมเดล และ config ที่ใช้เฉพาะ Codex โปรดดู
[Codex Harness](/th/plugins/codex-harness)

OpenClaw ต้องใช้ Codex app-server รุ่น `0.125.0` หรือใหม่กว่า Plugin Codex จะตรวจสอบ initialize handshake ของ app-server และบล็อกเซิร์ฟเวอร์ที่เก่ากว่าหรือไม่มีเวอร์ชัน เพื่อให้ OpenClaw ทำงานเฉพาะกับพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้ว ค่า floor `0.125.0` นี้รวมการรองรับ payload ของ native MCP hook ที่เพิ่มเข้ามาใน Codex `0.124.0` พร้อมทั้งตรึง OpenClaw ให้อยู่บนสายรุ่นเสถียรใหม่กว่าที่ผ่านการทดสอบแล้ว

### มิดเดิลแวร์ผลลัพธ์ของเครื่องมือ

Plugin ที่บันเดิลมาสามารถแนบมิดเดิลแวร์ผลลัพธ์ของเครื่องมือที่เป็นกลางต่อ runtime ได้ผ่าน
`api.registerAgentToolResultMiddleware(...)` เมื่อ manifest ของมันประกาศ targeted runtime id ไว้ใน `contracts.agentToolResultMiddleware` seam ที่เชื่อถือได้นี้มีไว้สำหรับการแปลงผลลัพธ์ของเครื่องมือแบบ async ซึ่งต้องรันก่อนที่ PI หรือ Codex จะป้อนเอาต์พุตของเครื่องมือกลับเข้าไปในโมเดล

Plugin ที่บันเดิลมารุ่นเก่ายังคงใช้
`api.registerCodexAppServerExtensionFactory(...)` สำหรับมิดเดิลแวร์ที่ใช้ได้เฉพาะ Codex app-server เท่านั้นได้ แต่การแปลงผลลัพธ์ใหม่ควรใช้ API ที่เป็นกลางต่อ runtime hook `api.registerEmbeddedExtensionFactory(...)` ที่ใช้เฉพาะ Pi ถูกนำออกแล้ว; การแปลงผลลัพธ์ของเครื่องมือใน Pi ต้องใช้มิดเดิลแวร์ที่เป็นกลางต่อ runtime

### การจำแนกผลลัพธ์ปลายทางของเทอร์มินัล

Harness แบบ native ที่เป็นเจ้าของ projection ของโปรโตคอลตนเองสามารถใช้
`classifyAgentHarnessTerminalOutcome(...)` จาก
`openclaw/plugin-sdk/agent-harness-runtime` เมื่อเทิร์นที่เสร็จสมบูรณ์แล้วไม่ได้สร้างข้อความ assistant ที่มองเห็นได้ helper นี้จะคืนค่า `empty`, `reasoning-only` หรือ `planning-only` เพื่อให้นโยบาย fallback ของ OpenClaw ตัดสินใจได้ว่าจะลองใหม่ด้วยโมเดลอื่นหรือไม่ โดยตั้งใจไม่จำแนกข้อผิดพลาดของพรอมป์ต์ เทิร์นที่ยังไม่เสร็จ และการตอบกลับแบบเงียบโดยเจตนา เช่น `NO_REPLY`

### โหมด native Codex harness

harness `codex` ที่บันเดิลมาคือโหมด Codex แบบ native สำหรับเทิร์นเอเจนต์ OpenClaw แบบ embedded ให้เปิดใช้ Plugin `codex` ที่บันเดิลมาก่อน และรวม `codex` ไว้ใน `plugins.allow` หาก config ของคุณใช้ allowlist แบบเข้มงวด config ของ app-server แบบ native ควรใช้ `openai/gpt-*` ร่วมกับ `agentRuntime.id: "codex"`
ให้ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่าน PI แทน ref โมเดล `codex/*` แบบเดิมยังคงเป็น alias สำหรับ compatibility ของ harness แบบ native

เมื่อโหมดนี้ทำงาน Codex จะเป็นเจ้าของ native thread id, พฤติกรรมการ resume, Compaction และการทำงานของ app-server OpenClaw ยังคงเป็นเจ้าของ channel แชต, transcript mirror ที่มองเห็นได้, นโยบายเครื่องมือ, approvals, การส่งมอบสื่อ และการเลือกเซสชัน ใช้ `agentRuntime.id: "codex"` โดยไม่ใส่การแทนที่ `fallback` เมื่อคุณต้องการพิสูจน์ว่าเฉพาะเส้นทาง Codex app-server เท่านั้นที่สามารถรับงานรันนี้ได้ runtime ของ Plugin แบบ explicit ล้มเหลวแบบ fail closed เป็นค่าเริ่มต้นอยู่แล้ว ให้ตั้งค่า `fallback: "pi"` เฉพาะเมื่อคุณตั้งใจให้ PI จัดการกรณีที่ไม่มีการเลือก harness เท่านั้น ความล้มเหลวของ Codex app-server จะล้มเหลวโดยตรงอยู่แล้วแทนที่จะลองใหม่ผ่าน PI

## ปิด PI fallback

โดยค่าเริ่มต้น OpenClaw จะรันเอเจนต์แบบ embedded โดยตั้ง `agents.defaults.agentRuntime`
เป็น `{ id: "auto", fallback: "pi" }` ในโหมด `auto` plugin harness ที่ลงทะเบียนไว้สามารถอ้างสิทธิ์คู่ provider/model ได้ หากไม่มีตัวใดตรง OpenClaw จะ fallback ไปใช้ PI

ในโหมด `auto` ให้ตั้ง `fallback: "none"` เมื่อคุณต้องการให้การไม่มีการเลือก plugin harness ถือเป็นความล้มเหลวแทนที่จะใช้ PI runtime ของ Plugin แบบ explicit เช่น
`runtime: "codex"` จะล้มเหลวแบบ fail closed เป็นค่าเริ่มต้นอยู่แล้ว เว้นแต่จะตั้ง `fallback: "pi"` ใน config เดียวกันหรือในขอบเขตการแทนที่จาก environment ความล้มเหลวของ plugin harness ที่ถูกเลือกแล้วจะล้มเหลวแบบ hard เสมอ สิ่งนี้ไม่ขัดขวาง `runtime: "pi"` หรือ
`OPENCLAW_AGENT_RUNTIME=pi` ที่ระบุชัดเจน

สำหรับการรันแบบ embedded ที่ใช้ Codex เท่านั้น:

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

หากคุณต้องการให้ plugin harness ที่ลงทะเบียนไว้ใด ๆ มารับโมเดลที่ตรงกัน แต่ไม่ต้องการให้ OpenClaw fallback ไปใช้ PI แบบเงียบ ๆ ให้คง `runtime: "auto"` ไว้และปิด fallback:

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

การแทนที่รายเอเจนต์ใช้รูปแบบเดียวกัน:

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

`OPENCLAW_AGENT_RUNTIME` ยังคงแทนที่ runtime ที่ตั้งค่าไว้ ใช้
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อปิด PI fallback จาก environment

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

เมื่อปิด fallback แล้ว เซสชันจะล้มเหลวตั้งแต่ต้นหาก harness ที่ร้องขอไม่ได้ลงทะเบียนไว้ ไม่รองรับ provider/model ที่ resolve แล้ว หรือล้มเหลวก่อนจะสร้างผลข้างเคียงของเทิร์น นี่เป็นพฤติกรรมที่ตั้งใจไว้สำหรับการติดตั้งที่ใช้ Codex เท่านั้น และสำหรับการทดสอบแบบสดที่ต้องพิสูจน์ว่าเส้นทาง Codex app-server ถูกใช้งานจริง

การตั้งค่านี้ควบคุมเฉพาะ harness ของเอเจนต์แบบ embedded เท่านั้น มันไม่ได้ปิดการกำหนดเส้นทางโมเดลเฉพาะ provider สำหรับรูปภาพ วิดีโอ เพลง TTS PDF หรืออย่างอื่น

## เซสชันแบบ native และ transcript mirror

Harness อาจเก็บ native session id, thread id หรือ daemon-side resume token ให้คงการผูกโยงนี้ไว้กับเซสชัน OpenClaw อย่างชัดเจน และคงการ mirror เอาต์พุต assistant/tool ที่ผู้ใช้มองเห็นได้ลงใน transcript ของ OpenClaw

transcript ของ OpenClaw ยังคงเป็นเลเยอร์ compatibility สำหรับ:

- ประวัติเซสชันที่มองเห็นได้ใน channel
- การค้นหาและทำดัชนี transcript
- การสลับกลับไปใช้ harness PI ที่มีมาในระบบในเทิร์นถัดไป
- พฤติกรรมทั่วไปของ `/new`, `/reset` และการลบเซสชัน

หาก harness ของคุณเก็บ sidecar binding ไว้ ให้ติดตั้ง `reset(...)` เพื่อให้ OpenClaw สามารถล้างมันได้เมื่อเซสชัน OpenClaw ที่เป็นเจ้าของถูกรีเซ็ต

## ผลลัพธ์ของเครื่องมือและสื่อ

Core จะสร้างรายการเครื่องมือของ OpenClaw และส่งเข้าไปในความพยายามที่เตรียมไว้แล้ว
เมื่อ harness เรียกใช้ dynamic tool call ให้ส่งผลลัพธ์ของเครื่องมือกลับผ่านรูปแบบผลลัพธ์ของ harness แทนการส่งสื่อของ channel เอง

วิธีนี้ช่วยให้เอาต์พุตของข้อความ รูปภาพ วิดีโอ เพลง TTS การอนุมัติ และเครื่องมือส่งข้อความ อยู่บนเส้นทางการส่งมอบเดียวกันกับการรันที่รองรับโดย PI

## ข้อจำกัดปัจจุบัน

- พาธ import สาธารณะเป็นแบบทั่วไป แต่ type alias ของ attempt/result บางตัวยังคงมีชื่อ `Pi` เพื่อความเข้ากันได้
- การติดตั้ง harness ของบุคคลที่สามยังเป็นแบบทดลอง ให้เลือกใช้ provider plugin จนกว่าคุณจะต้องใช้รันไทม์เซสชันแบบ native
- รองรับการสลับ harness ข้ามเทิร์น อย่าสลับ harness กลางเทิร์นหลังจากเริ่มใช้ native tools, approvals, ข้อความ assistant หรือการส่งข้อความแล้ว

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview)
- [Runtime Helpers](/th/plugins/sdk-runtime)
- [Provider Plugins](/th/plugins/sdk-provider-plugins)
- [Codex Harness](/th/plugins/codex-harness)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
