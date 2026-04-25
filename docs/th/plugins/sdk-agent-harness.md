---
read_when:
    - คุณกำลังเปลี่ยน runtime ของเอเจนต์แบบฝังตัวหรือ registry ของ harness
    - คุณกำลังลงทะเบียน agent harness จาก Plugin ที่ bundle มาให้หรือ Plugin ที่เชื่อถือได้
    - คุณต้องการทำความเข้าใจว่า Codex Plugin เชื่อมโยงกับ model provider อย่างไร
sidebarTitle: Agent Harness
summary: พื้นผิว SDK แบบทดลองสำหรับ Plugin ที่ใช้แทน executor ระดับล่างของเอเจนต์แบบฝังตัว
title: Agent harness Plugin
x-i18n:
    generated_at: "2026-04-25T13:54:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**agent harness** คือ executor ระดับล่างสำหรับหนึ่งเทิร์นของเอเจนต์ OpenClaw ที่เตรียมไว้แล้ว
มันไม่ใช่ model provider, ไม่ใช่ channel และไม่ใช่ registry ของ tool
สำหรับกรอบความเข้าใจฝั่งผู้ใช้ ดู [Agent runtimes](/th/concepts/agent-runtimes)

ให้ใช้พื้นผิวนี้เฉพาะกับ Plugin แบบ native ที่ bundle มาให้หรือเชื่อถือได้เท่านั้น สัญญานี้
ยังอยู่ในสถานะแบบทดลอง เพราะชนิดพารามิเตอร์ตั้งใจให้สะท้อน embedded runner ปัจจุบัน

## ควรใช้ harness เมื่อใด

ลงทะเบียน agent harness เมื่อ model family หนึ่งมี session
runtime แบบเนทีฟของตัวเอง และ transport ของ provider แบบปกติของ OpenClaw เป็น abstraction ที่ไม่เหมาะสม

ตัวอย่าง:

- เซิร์ฟเวอร์ coding-agent แบบเนทีฟที่เป็นเจ้าของ thread และ Compaction
- CLI หรือ daemon ภายในเครื่องที่ต้องสตรีม event แบบเนทีฟของแผน/reasoning/tool
- model runtime ที่ต้องการ resume id ของตัวเองเพิ่มเติมจาก
  session transcript ของ OpenClaw

**อย่า** ลงทะเบียน harness เพียงเพื่อเพิ่ม LLM API ใหม่ สำหรับ model API แบบ HTTP หรือ
WebSocket ปกติ ให้สร้าง [provider plugin](/th/plugins/sdk-provider-plugins)

## สิ่งที่ core ยังคงเป็นเจ้าของ

ก่อนจะเลือก harness, OpenClaw ได้ resolve สิ่งต่อไปนี้แล้ว:

- provider และโมเดล
- สถานะ auth ของ runtime
- ระดับการคิดและงบประมาณ context
- ไฟล์ transcript/session ของ OpenClaw
- workspace, sandbox และนโยบาย tool
- callback สำหรับการตอบกลับของ channel และ callback สำหรับการสตรีม
- นโยบาย fallback ของโมเดลและการสลับ live model

การแยกส่วนนี้ตั้งใจทำไว้แบบนั้น harness จะรัน attempt ที่เตรียมไว้แล้ว; มันไม่ได้เลือก
provider, ไม่ได้แทนที่การส่งของ channel และไม่ได้สลับโมเดลแบบเงียบ ๆ

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

1. harness id ที่บันทึกไว้ของเซสชันที่มีอยู่จะชนะ ดังนั้นการเปลี่ยน config/env
   จะไม่ hot-switch transcript นั้นไปยัง runtime อื่น
2. `OPENCLAW_AGENT_RUNTIME=<id>` จะบังคับใช้ harness ที่ลงทะเบียนด้วย id นั้นสำหรับ
   เซสชันที่ยังไม่ถูกปักหมุด
3. `OPENCLAW_AGENT_RUNTIME=pi` จะบังคับใช้ PI harness ในตัว
4. `OPENCLAW_AGENT_RUNTIME=auto` จะถาม harness ที่ลงทะเบียนไว้ว่ารองรับ
   provider/model ที่ resolve แล้วหรือไม่
5. หากไม่มี harness ที่ลงทะเบียนตัวใดตรงกัน OpenClaw จะใช้ PI เว้นแต่จะ
   ปิด PI fallback ไว้

ความล้มเหลวของ Plugin harness จะถูกแสดงเป็นความล้มเหลวของการรัน ในโหมด `auto`, PI fallback
จะถูกใช้เฉพาะเมื่อไม่มี plugin harness ที่ลงทะเบียนตัวใดรองรับ
provider/model ที่ resolve แล้ว เมื่อ plugin harness ใดรับการรันไปแล้ว
OpenClaw จะไม่ replay เทิร์นเดียวกันนั้นผ่าน PI เพราะอาจเปลี่ยน semantics ของ auth/runtime
หรือทำให้เกิด side effect ซ้ำ

harness id ที่ถูกเลือกจะถูก persist ไว้กับ session id หลังจากการรันแบบฝังตัว
เซสชัน legacy ที่สร้างก่อนมีการปักหมุด harness จะถูกถือว่าเป็น PI-pinned เมื่อมี
ประวัติ transcript แล้ว ให้ใช้เซสชันใหม่/รีเซ็ตเมื่อสลับระหว่าง PI กับ
native plugin harness `/status` จะแสดง harness id ที่ไม่ใช่ค่าเริ่มต้น เช่น `codex`
ถัดจาก `Fast`; ส่วน PI จะถูกซ่อนไว้เพราะเป็นเส้นทางความเข้ากันได้เริ่มต้น
หาก harness ที่เลือกดูผิดคาด ให้เปิด `agents/harness` debug logging แล้ว
ตรวจสอบระเบียน structured `agent harness selected` ของ gateway ซึ่งรวม
harness id ที่ถูกเลือก เหตุผลของการเลือก นโยบาย runtime/fallback และในโหมด
`auto` จะรวมผลการรองรับของ candidate จากแต่ละ Plugin

Codex Plugin ที่มากับระบบจะลงทะเบียน `codex` เป็น harness id ของมัน โดย core จะถือว่า
นี่เป็น plugin harness id ปกติหนึ่งตัว; alias เฉพาะ Codex ควรอยู่ใน Plugin
หรือ config ของ operator ไม่ใช่ในตัวเลือก runtime ที่ใช้ร่วมกัน

## การจับคู่ provider กับ harness

harness ส่วนใหญ่ควรลงทะเบียน provider ด้วย โดย provider จะทำให้ model ref,
สถานะ auth, metadata ของโมเดล และการเลือก `/model` มองเห็นได้จากส่วนอื่นของ
OpenClaw จากนั้น harness จึงอ้างสิทธิ์ provider นั้นใน `supports(...)`

Codex Plugin ที่มากับระบบทำตามรูปแบบนี้:

- model ref ฝั่งผู้ใช้ที่แนะนำ: `openai/gpt-5.5` พร้อม
  `embeddedHarness.runtime: "codex"`
- ref เพื่อความเข้ากันได้: ref แบบเดิม `codex/gpt-*` ยังคงรับได้ แต่ config ใหม่
  ไม่ควรใช้เป็น ref `provider/model` แบบปกติ
- harness id: `codex`
- auth: synthetic provider availability เพราะ Codex harness เป็นเจ้าของ
  Codex login/session แบบเนทีฟ
- คำขอ app-server: OpenClaw จะส่ง bare model id ไปให้ Codex และปล่อยให้
  harness คุยกับโปรโตคอล app-server แบบเนทีฟ

Codex Plugin เป็นแบบ additive กล่าวคือ ref แบบ `openai/gpt-*` ธรรมดายังคงใช้
เส้นทาง provider ปกติของ OpenClaw เว้นแต่คุณจะบังคับ Codex harness ด้วย
`embeddedHarness.runtime: "codex"` ส่วน ref แบบเก่า `codex/gpt-*` ยังคงเลือก
Codex provider และ harness เพื่อความเข้ากันได้

สำหรับการตั้งค่าฝั่ง operator, ตัวอย่าง model prefix และ config แบบ Codex-only ดู
[Codex Harness](/th/plugins/codex-harness)

OpenClaw ต้องการ Codex app-server รุ่น `0.118.0` หรือใหม่กว่า Codex Plugin จะตรวจสอบ
initialize handshake ของ app-server และบล็อกเซิร์ฟเวอร์ที่เก่ากว่าหรือไม่มีเวอร์ชัน
เพื่อให้ OpenClaw รันเฉพาะกับพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้วเท่านั้น

### Tool-result middleware

Plugin ที่ bundle มาให้สามารถแนบ tool-result middleware ที่ไม่ขึ้นกับ runtime ได้ผ่าน
`api.registerAgentToolResultMiddleware(...)` เมื่อ manifest ของมันประกาศ
runtime id เป้าหมายไว้ใน `contracts.agentToolResultMiddleware` seam ที่เชื่อถือได้นี้
มีไว้สำหรับการแปลงผลลัพธ์ของ tool แบบ async ที่ต้องรันก่อนที่ PI หรือ Codex จะส่ง
output ของ tool กลับเข้าไปยังโมเดล

Plugin แบบเดิมที่ bundle มาให้ยังสามารถใช้
`api.registerCodexAppServerExtensionFactory(...)` สำหรับ Codex app-server-only
middleware ได้ แต่การแปลงผลลัพธ์ใหม่ควรใช้ API ที่ไม่ขึ้นกับ runtime
hook แบบ Pi-only `api.registerEmbeddedExtensionFactory(...)` ถูกนำออกแล้ว;
การแปลงผลลัพธ์ของ tool สำหรับ Pi ต้องใช้ middleware ที่ไม่ขึ้นกับ runtime

### โหมด Native Codex harness

`codex` harness ที่ bundle มาให้คือโหมด Codex แบบเนทีฟสำหรับเทิร์นเอเจนต์
OpenClaw แบบฝังตัว ให้เปิดใช้ `codex` Plugin ที่มากับระบบก่อน และรวม `codex` ไว้ใน
`plugins.allow` หาก config ของคุณใช้ allowlist แบบจำกัด config ของ native app-server ควรใช้ `openai/gpt-*` ร่วมกับ `embeddedHarness.runtime: "codex"`
ส่วน `openai-codex/*` ใช้สำหรับ Codex OAuth ผ่าน PI ref โมเดลแบบเดิม `codex/*`
ยังคงเป็น alias เพื่อความเข้ากันได้สำหรับ native harness

เมื่อโหมดนี้ทำงาน Codex จะเป็นเจ้าของ native thread id, พฤติกรรม resume,
Compaction และการทำงานของ app-server ส่วน OpenClaw ยังคงเป็นเจ้าของ chat channel,
visible transcript mirror, นโยบาย tool, approvals, การส่งสื่อ และการเลือกเซสชัน
ใช้ `embeddedHarness.runtime: "codex"` โดยไม่ต้อง override `fallback`
เมื่อคุณต้องการพิสูจน์ว่ามีเพียงเส้นทาง Codex app-server เท่านั้นที่สามารถรับการรันได้
runtime ของ Plugin แบบระบุชัดเจนจะ fail closed ตามค่าเริ่มต้นอยู่แล้ว ตั้ง `fallback: "pi"`
เฉพาะเมื่อคุณตั้งใจให้ PI จัดการกรณีที่ไม่มี harness เท่านั้น
ความล้มเหลวของ Codex app-server จะล้มเหลวโดยตรงแทนที่จะลองใหม่ผ่าน PI อยู่แล้ว

## ปิด PI fallback

ตามค่าเริ่มต้น OpenClaw จะรันเอเจนต์แบบฝังตัวโดยใช้ `agents.defaults.embeddedHarness`
เป็น `{ runtime: "auto", fallback: "pi" }` ในโหมด `auto`, plugin harness ที่ลงทะเบียน
สามารถอ้างสิทธิ์คู่ provider/model ได้ หากไม่มีตัวใดตรงกัน OpenClaw จะ fallback ไปใช้
PI

ในโหมด `auto` ให้ตั้ง `fallback: "none"` เมื่อคุณต้องการให้กรณีที่ไม่สามารถเลือก
plugin harness ได้ล้มเหลว แทนที่จะไปใช้ PI ส่วน runtime ของ Plugin แบบระบุชัดเจน เช่น
`runtime: "codex"` จะ fail closed ตามค่าเริ่มต้นอยู่แล้ว เว้นแต่จะตั้ง `fallback: "pi"`
ใน config เดียวกันหรือในขอบเขต environment override เดียวกัน ความล้มเหลวของ plugin harness
ที่ถูกเลือกจะล้มเหลวแบบ hard เสมอ ซึ่งไม่ได้บล็อก `runtime: "pi"` แบบระบุชัดเจนหรือ
`OPENCLAW_AGENT_RUNTIME=pi`

สำหรับการรันแบบฝังตัวที่เป็น Codex-only:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

หากคุณต้องการให้ plugin harness ที่ลงทะเบียนตัวใดก็ได้อ้างสิทธิ์โมเดลที่ตรงกัน แต่ไม่เคย
ต้องการให้ OpenClaw fallback ไปใช้ PI แบบเงียบ ๆ ให้คง `runtime: "auto"` และปิด
fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

การแทนที่ต่อเอเจนต์ใช้รูปแบบเดียวกัน:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` ยังคง override runtime ที่กำหนดค่าไว้ ใช้
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อปิด PI fallback จาก
environment

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

เมื่อปิด fallback แล้ว เซสชันจะล้มเหลวตั้งแต่ต้นเมื่อ harness ที่ร้องขอไม่ได้
ลงทะเบียนไว้, ไม่รองรับ provider/model ที่ resolve แล้ว หรือ ล้มเหลวก่อน
จะเกิด side effect ของเทิร์น ซึ่งเป็นพฤติกรรมที่ตั้งใจไว้สำหรับการติดตั้งใช้งานแบบ Codex-only และ
สำหรับ live test ที่ต้องพิสูจน์ว่าเส้นทาง Codex app-server ถูกใช้งานจริง

การตั้งค่านี้ควบคุมเฉพาะ harness ของเอเจนต์แบบฝังตัวเท่านั้น มันไม่ได้ปิด
การกำหนดเส้นทางโมเดลเฉพาะ provider สำหรับ image, วิดีโอ, เพลง, TTS, PDF หรืออย่างอื่น

## Native session และ transcript mirror

harness อาจเก็บ native session id, thread id หรือ daemon-side resume token
ให้เก็บการผูกนี้ให้สัมพันธ์กับเซสชันของ OpenClaw อย่างชัดเจน และคงการ mirror
output ของ assistant/tool ที่ผู้ใช้มองเห็นได้ลงใน transcript ของ OpenClaw

transcript ของ OpenClaw ยังคงเป็นชั้นความเข้ากันได้สำหรับ:

- ประวัติเซสชันที่มองเห็นได้จาก channel
- การค้นหาและทำดัชนี transcript
- การสลับกลับไปใช้ PI harness ในตัวในเทิร์นถัดไป
- พฤติกรรมทั่วไปของ `/new`, `/reset` และการลบเซสชัน

หาก harness ของคุณเก็บ sidecar binding ให้ติดตั้ง `reset(...)` เพื่อให้ OpenClaw
สามารถล้างมันได้เมื่อเซสชัน OpenClaw ที่เป็นเจ้าของถูกรีเซ็ต

## ผลลัพธ์ของ tool และสื่อ

core จะสร้างรายการ tool ของ OpenClaw และส่งเข้าไปใน prepared attempt
เมื่อ harness รันการเรียก dynamic tool ให้ส่งผลลัพธ์ของ tool กลับผ่าน
result shape ของ harness แทนการส่งสื่อของ channel ด้วยตัวเอง

วิธีนี้ช่วยให้ output ของข้อความ, รูปภาพ, วิดีโอ, เพลง, TTS, approval และ messaging-tool
อยู่บนเส้นทางการส่งเดียวกับการรันที่รองรับด้วย PI

## ข้อจำกัดปัจจุบัน

- พาธ import สาธารณะเป็นแบบทั่วไป แต่ alias ของชนิด attempt/result บางตัวยังคง
  มีชื่อ `Pi` เพื่อความเข้ากันได้
- การติดตั้ง harness ของ third-party ยังอยู่ในสถานะแบบทดลอง ควรใช้ provider plugin
  ไปก่อนจนกว่าคุณจะต้องใช้ native session runtime
- รองรับการสลับ harness ข้ามเทิร์น แต่อย่าสลับ harness กลางเทิร์นหลังจาก native tool,
  approval, ข้อความ assistant หรือการส่งข้อความเริ่มต้นไปแล้ว

## ที่เกี่ยวข้อง

- [SDK Overview](/th/plugins/sdk-overview)
- [Runtime Helpers](/th/plugins/sdk-runtime)
- [Provider Plugins](/th/plugins/sdk-provider-plugins)
- [Codex Harness](/th/plugins/codex-harness)
- [Model Providers](/th/concepts/model-providers)
