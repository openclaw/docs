---
read_when:
    - คุณกำลังเปลี่ยนรันไทม์เอเจนต์แบบฝังตัวหรือรีจิสทรีของฮาร์เนส
    - คุณกำลังลงทะเบียนฮาร์เนสของเอเจนต์จาก Plugin ที่รวมมาให้หรือเชื่อถือได้
    - คุณต้องทำความเข้าใจว่า Plugin ของ Codex เกี่ยวข้องกับผู้ให้บริการโมเดลอย่างไร
sidebarTitle: Agent Harness
summary: ส่วนติดต่อ SDK แบบทดลองสำหรับ Plugin ที่แทนที่ตัวดำเนินการเอเจนต์แบบฝังตัวระดับต่ำ
title: Plugin สำหรับฮาร์เนสเอเจนต์
x-i18n:
    generated_at: "2026-05-07T13:23:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**agent harness** คือ executor ระดับต่ำสำหรับเทิร์นของ OpenClaw agent ที่เตรียมไว้หนึ่งครั้ง ซึ่งไม่ใช่ model provider ไม่ใช่ channel และไม่ใช่ tool registry สำหรับ mental model ที่แสดงต่อผู้ใช้ โปรดดู [Agent runtimes](/th/concepts/agent-runtimes)

ใช้พื้นผิวนี้เฉพาะกับ Plugin native ที่ bundled หรือเชื่อถือได้เท่านั้น contract นี้ยังอยู่ในขั้นทดลอง เพราะประเภทพารามิเตอร์ตั้งใจให้สะท้อน runner แบบ embedded ปัจจุบัน

## ควรใช้ harness เมื่อใด

ลงทะเบียน agent harness เมื่อ model family มี runtime session แบบ native ของตัวเอง และ transport ของ OpenClaw provider ปกติไม่ใช่ abstraction ที่เหมาะสม

ตัวอย่าง:

- เซิร์ฟเวอร์ coding-agent แบบ native ที่เป็นเจ้าของ thread และ compaction
- CLI หรือ daemon แบบ local ที่ต้อง stream เหตุการณ์ native plan/reasoning/tool
- runtime ของ model ที่ต้องใช้ resume id ของตัวเองเพิ่มเติมจาก transcript ของ OpenClaw session

อย่าลงทะเบียน harness เพียงเพื่อเพิ่ม LLM API ใหม่ สำหรับ API model แบบ HTTP หรือ WebSocket ปกติ ให้สร้าง [provider plugin](/th/plugins/sdk-provider-plugins)

## สิ่งที่ core ยังคงเป็นเจ้าของ

ก่อนที่ harness จะถูกเลือก OpenClaw ได้ resolve สิ่งเหล่านี้แล้ว:

- provider และ model
- สถานะ runtime auth
- ระดับ thinking และ context budget
- ไฟล์ transcript/session ของ OpenClaw
- workspace, sandbox และ tool policy
- callback สำหรับ channel reply และ callback สำหรับ streaming
- นโยบาย model fallback และ live model switching

การแบ่งนี้เป็นไปโดยตั้งใจ harness จะรัน attempt ที่เตรียมไว้แล้ว ไม่ได้เลือก provider แทนที่การส่งผ่าน channel หรือสลับ model อย่างเงียบ ๆ

attempt ที่เตรียมไว้ยังมี `params.runtimePlan` ซึ่งเป็น policy bundle ที่ OpenClaw เป็นเจ้าของสำหรับการตัดสินใจของ runtime ที่ต้องใช้ร่วมกันระหว่าง PI และ native harnesses:

- `runtimePlan.tools.normalize(...)` และ
  `runtimePlan.tools.logDiagnostics(...)` สำหรับนโยบาย tool schema ที่รับรู้ provider
- `runtimePlan.transcript.resolvePolicy(...)` สำหรับการ sanitize transcript และ
  นโยบายซ่อมแซม tool-call
- `runtimePlan.delivery.isSilentPayload(...)` สำหรับการ suppress การส่งมอบ `NO_REPLY` และ media ร่วมกัน
- `runtimePlan.outcome.classifyRunResult(...)` สำหรับการจัดประเภท model fallback
- `runtimePlan.observability` สำหรับ metadata ของ provider/model/harness ที่ resolve แล้ว

Harnesses อาจใช้ plan สำหรับการตัดสินใจที่ต้องตรงกับพฤติกรรม PI แต่ยังควรถือว่าเป็น attempt state ที่ host เป็นเจ้าของ อย่า mutate หรือใช้เพื่อสลับ providers/models ภายในเทิร์น

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

OpenClaw เลือก harness หลังจาก resolve provider/model แล้ว:

1. harness id ที่บันทึกไว้ของ session เดิมจะชนะ เพื่อไม่ให้การเปลี่ยน config/env hot-switch transcript นั้นไปยัง runtime อื่น
2. `OPENCLAW_AGENT_RUNTIME=<id>` บังคับใช้ harness ที่ลงทะเบียนไว้ซึ่งมี id นั้นกับ session ที่ยังไม่ได้ถูก pin
3. `OPENCLAW_AGENT_RUNTIME=pi` บังคับใช้ harness PI ในตัว
4. `OPENCLAW_AGENT_RUNTIME=auto` ขอให้ harnesses ที่ลงทะเบียนไว้ตรวจว่ารองรับ provider/model ที่ resolve แล้วหรือไม่
5. หากไม่มี harness ที่ลงทะเบียนไว้ตรงกัน OpenClaw จะใช้ PI เว้นแต่ PI fallback ถูกปิดใช้งาน

ความล้มเหลวของ Plugin harness จะแสดงเป็น run failures ในโหมด `auto` จะใช้ PI fallback เฉพาะเมื่อไม่มี Plugin harness ที่ลงทะเบียนไว้รองรับ provider/model ที่ resolve แล้วเท่านั้น เมื่อ Plugin harness claim run แล้ว OpenClaw จะไม่ replay เทิร์นเดียวกันนั้นผ่าน PI เพราะอาจเปลี่ยนความหมายของ auth/runtime หรือทำให้ side effects ซ้ำ

harness id ที่เลือกจะถูก persist พร้อม session id หลังจาก embedded run Legacy sessions ที่สร้างก่อนมี harness pins จะถูกถือว่า pin กับ PI เมื่อมีประวัติ transcript แล้ว ใช้ session ใหม่หรือ reset session เมื่อเปลี่ยนระหว่าง PI กับ native Plugin harness `/status` แสดง harness id ที่ไม่ใช่ค่า default เช่น `codex` ถัดจาก `Fast`; PI ถูกซ่อนไว้เพราะเป็น path ความเข้ากันได้เริ่มต้น หาก harness ที่เลือกดูน่าประหลาดใจ ให้เปิดใช้งาน debug logging ของ `agents/harness` และตรวจสอบ structured record `agent harness selected` ของ gateway ซึ่งมี harness id ที่เลือก เหตุผลการเลือก นโยบาย runtime/fallback และในโหมด `auto` มี support result ของผู้สมัคร Plugin แต่ละตัว

Codex Plugin ที่ bundled ลงทะเบียน `codex` เป็น harness id ของตัวเอง Core ปฏิบัติต่อค่านี้เป็น Plugin harness id ปกติ aliases เฉพาะ Codex ควรอยู่ใน Plugin หรือ config ของ operator ไม่ใช่ใน shared runtime selector

## การจับคู่ provider กับ harness

Harnesses ส่วนใหญ่ควรลงทะเบียน provider ด้วย provider ทำให้ model refs, auth status, model metadata และการเลือก `/model` มองเห็นได้ต่อส่วนอื่นของ OpenClaw จากนั้น harness จึง claim provider นั้นใน `supports(...)`

Codex Plugin ที่ bundled ทำตามรูปแบบนี้:

- model refs ที่แนะนำสำหรับผู้ใช้: `openai/gpt-5.5` พร้อม
  `agentRuntime.id: "codex"`
- refs เพื่อความเข้ากันได้: legacy `codex/gpt-*` refs ยังคงถูกยอมรับ แต่ config ใหม่ไม่ควรใช้เป็น refs provider/model ปกติ
- harness id: `codex`
- auth: ความพร้อมใช้งานของ provider แบบ synthetic เพราะ Codex harness เป็นเจ้าของ native Codex login/session
- คำขอ app-server: OpenClaw ส่งเฉพาะ model id เปล่าไปยัง Codex และให้ harness คุยกับ protocol ของ native app-server

Codex Plugin เป็นแบบ additive refs `openai/gpt-*` ธรรมดายังคงใช้ path ของ OpenClaw provider ปกติ เว้นแต่คุณบังคับ Codex harness ด้วย `agentRuntime.id: "codex"` refs `codex/gpt-*` ที่เก่ากว่ายังคงเลือก Codex provider และ harness เพื่อความเข้ากันได้

สำหรับการตั้งค่า operator ตัวอย่าง model prefix และ config เฉพาะ Codex โปรดดู [Codex Harness](/th/plugins/codex-harness)

OpenClaw ต้องใช้ Codex app-server `0.125.0` หรือใหม่กว่า Codex Plugin ตรวจสอบ app-server initialize handshake และบล็อก server ที่เก่ากว่าหรือไม่มี version เพื่อให้ OpenClaw รันเฉพาะกับพื้นผิว protocol ที่ได้ทดสอบแล้วเท่านั้น floor `0.125.0` รวมการรองรับ native MCP hook payload ที่เพิ่มเข้ามาใน Codex `0.124.0` พร้อมทั้ง pin OpenClaw กับ stable line ที่ใหม่กว่าและผ่านการทดสอบแล้ว

### Tool-result middleware

Plugin ที่ bundled สามารถแนบ tool-result middleware ที่ไม่ผูกกับ runtime ผ่าน `api.registerAgentToolResultMiddleware(...)` เมื่อ manifest ประกาศ runtime ids เป้าหมายไว้ใน `contracts.agentToolResultMiddleware` seam ที่เชื่อถือได้นี้มีไว้สำหรับ async tool-result transforms ที่ต้องรันก่อนที่ PI หรือ Codex จะป้อน tool output กลับเข้า model

Legacy bundled plugins ยังสามารถใช้ `api.registerCodexAppServerExtensionFactory(...)` สำหรับ middleware เฉพาะ Codex app-server ได้ แต่ result transforms ใหม่ควรใช้ API ที่ไม่ผูกกับ runtime hook เฉพาะ Pi `api.registerEmbeddedExtensionFactory(...)` ถูกนำออกแล้ว; tool-result transforms ของ Pi ต้องใช้ middleware ที่ไม่ผูกกับ runtime

### การจัดประเภท terminal outcome

Native harnesses ที่เป็นเจ้าของ protocol projection ของตัวเองสามารถใช้ `classifyAgentHarnessTerminalOutcome(...)` จาก `openclaw/plugin-sdk/agent-harness-runtime` เมื่อเทิร์นที่เสร็จสิ้นไม่มีข้อความ assistant ที่มองเห็นได้ helper จะคืนค่า `empty`, `reasoning-only` หรือ `planning-only` เพื่อให้นโยบาย fallback ของ OpenClaw ตัดสินใจว่าจะ retry บน model อื่นหรือไม่ โดยตั้งใจไม่จัดประเภท prompt errors, in-flight turns และ intentional silent replies เช่น `NO_REPLY`

### โหมด native Codex harness

harness `codex` ที่ bundled คือโหมด native Codex สำหรับ embedded OpenClaw agent turns เปิดใช้งาน bundled `codex` Plugin ก่อน และใส่ `codex` ใน `plugins.allow` หาก config ของคุณใช้ allowlist แบบจำกัด config ของ native app-server ควรใช้ `openai/gpt-*`; OpenAI agent turns จะเลือก Codex harness เป็นค่า default legacy routes `openai-codex/*` ควรถูกซ่อมด้วย `openclaw doctor --fix` และ legacy `codex/*` model refs ยังคงเป็น compatibility aliases สำหรับ native harness

เมื่อโหมดนี้รัน Codex จะเป็นเจ้าของ native thread id, resume behavior, compaction และการ execute ของ app-server OpenClaw ยังคงเป็นเจ้าของ chat channel, visible transcript mirror, tool policy, approvals, media delivery และ session selection ใช้ `agentRuntime.id: "codex"` เมื่อคุณต้องพิสูจน์ว่าเฉพาะ path ของ Codex app-server เท่านั้นที่สามารถ claim run ได้ Explicit plugin runtimes จะ fail closed; ความล้มเหลวของการเลือก Codex app-server และความล้มเหลวของ runtime จะไม่ถูก retry ผ่าน PI

## ความเข้มงวดของ runtime

ตามค่า default OpenClaw รัน embedded agents ด้วย OpenClaw Pi ในโหมด `auto` Plugin harnesses ที่ลงทะเบียนไว้สามารถ claim คู่ provider/model และ PI จะจัดการเทิร์นเมื่อไม่มีรายการใดตรงกัน ใช้ explicit Plugin runtime เช่น `agentRuntime.id: "codex"` เมื่อการเลือก harness ที่หายไปควร fail แทนที่จะ route ผ่าน PI ความล้มเหลวของ Plugin harness ที่เลือกแล้วจะ fail hard เสมอ สิ่งนี้ไม่บล็อก `agentRuntime.id: "pi"` หรือ `OPENCLAW_AGENT_RUNTIME=pi` แบบ explicit

สำหรับ embedded runs เฉพาะ Codex:

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

หากคุณต้องการให้ Plugin harness ที่ลงทะเบียนไว้ตัวใดก็ได้ claim models ที่ตรงกัน และมิฉะนั้นให้ใช้ PI ให้ตั้ง `id: "auto"`:

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

overrides ต่อ agent ใช้ shape เดียวกัน:

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

`OPENCLAW_AGENT_RUNTIME` ยังคง override runtime ที่กำหนดค่าไว้

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

เมื่อใช้ explicit Plugin runtime session จะ fail ตั้งแต่ต้นเมื่อ harness ที่ร้องขอไม่ได้ลงทะเบียน ไม่รองรับ provider/model ที่ resolve แล้ว หรือ fail ก่อนสร้าง turn side effects นั่นเป็นพฤติกรรมโดยตั้งใจสำหรับ deployment เฉพาะ Codex และสำหรับ live tests ที่ต้องพิสูจน์ว่า path ของ Codex app-server ถูกใช้งานจริง

การตั้งค่านี้ควบคุมเฉพาะ embedded agent harness เท่านั้น ไม่ได้ปิดใช้งานการ route model เฉพาะ provider สำหรับ image, video, music, TTS, PDF หรืออื่น ๆ

## Native sessions และ transcript mirror

Harness อาจเก็บ native session id, thread id หรือ resume token ฝั่ง daemon เก็บ binding นั้นให้เชื่อมโยงกับ OpenClaw session อย่างชัดเจน และ mirror assistant/tool output ที่ผู้ใช้มองเห็นได้เข้าไปยัง transcript ของ OpenClaw ต่อไป

transcript ของ OpenClaw ยังคงเป็น compatibility layer สำหรับ:

- ประวัติ session ที่ channel มองเห็นได้
- การค้นหาและ indexing transcript
- การสลับกลับไปใช้ PI harness ในตัวในเทิร์นภายหลัง
- พฤติกรรม `/new`, `/reset` และการลบ session แบบ generic

หาก harness ของคุณเก็บ sidecar binding ให้ implement `reset(...)` เพื่อให้ OpenClaw สามารถล้างมันเมื่อ OpenClaw session ที่เป็นเจ้าของถูก reset

## Tool และ media results

Core สร้างรายการ tool ของ OpenClaw และส่งเข้าไปใน attempt ที่เตรียมไว้ เมื่อ harness execute dynamic tool call ให้คืน tool result กลับผ่าน result shape ของ harness แทนการส่ง channel media เอง

สิ่งนี้ทำให้ outputs ของ text, image, video, music, TTS, approval และ messaging-tool อยู่บน delivery path เดียวกับ runs ที่มี PI รองรับ

## ข้อจำกัดปัจจุบัน

- เส้นทางนำเข้าสาธารณะเป็นแบบทั่วไป แต่ alias ชนิดของความพยายาม/ผลลัพธ์บางรายการยัง
  มีชื่อ `Pi` เพื่อความเข้ากันได้
- การติดตั้งฮาร์เนสของบุคคลที่สามยังเป็นแบบทดลอง ควรใช้ Plugin ผู้ให้บริการ
  จนกว่าคุณจะต้องใช้รันไทม์เซสชันแบบเนทีฟ
- รองรับการสลับฮาร์เนสข้ามเทิร์น อย่าสลับฮาร์เนสระหว่าง
  เทิร์นหลังจากที่เครื่องมือเนทีฟ การอนุมัติ ข้อความของผู้ช่วย หรือการส่งข้อความ
  เริ่มต้นแล้ว

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview)
- [ตัวช่วยรันไทม์](/th/plugins/sdk-runtime)
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins)
- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
