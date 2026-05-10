---
read_when:
    - คุณต้องทราบว่าจะนำเข้าจากพาธย่อยใดของ SDK
    - คุณต้องการข้อมูลอ้างอิงสำหรับเมธอดการลงทะเบียนทั้งหมดของ OpenClawPluginApi
    - คุณกำลังค้นหารายการเฉพาะที่ SDK ส่งออก
sidebarTitle: Plugin SDK overview
summary: แผนที่การนำเข้า เอกสารอ้างอิง API การลงทะเบียน และสถาปัตยกรรม SDK
title: ภาพรวม Plugin SDK
x-i18n:
    generated_at: "2026-05-10T19:51:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK ของ Plugin คือสัญญาแบบมีชนิดข้อมูลระหว่าง Plugin กับแกนหลัก หน้านี้เป็น
ข้อมูลอ้างอิงสำหรับ **สิ่งที่ต้อง import** และ **สิ่งที่คุณสามารถลงทะเบียนได้**

<Note>
  หน้านี้สำหรับผู้เขียน Plugin ที่ใช้ `openclaw/plugin-sdk/*` ภายใน
  OpenClaw สำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
  ที่ต้องการเรียกใช้เอเจนต์ผ่าน Gateway ให้ใช้
  [OpenClaw App SDK](/th/concepts/openclaw-sdk) และแพ็กเกจ `@openclaw/sdk`
  แทน
</Note>

<Tip>
กำลังมองหาคู่มือวิธีทำอยู่หรือไม่ เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins), ใช้ [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) สำหรับ Plugin ช่องทาง, [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) สำหรับ Plugin ผู้ให้บริการ, [Plugin แบ็กเอนด์ CLI](/th/plugins/cli-backend-plugins) สำหรับแบ็กเอนด์ CLI AI ในเครื่อง และ [hook ของ Plugin](/th/plugins/hooks) สำหรับ Plugin hook เครื่องมือหรือวงจรชีวิต
</Tip>

## แบบแผนการ import

ให้ import จาก subpath เฉพาะเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

แต่ละ subpath เป็นโมดูลขนาดเล็กและสมบูรณ์ในตัวเอง วิธีนี้ช่วยให้การเริ่มต้นทำงานเร็ว
และป้องกันปัญหาการขึ้นต่อกันแบบวงกลม สำหรับตัวช่วย entry/build เฉพาะช่องทาง
ให้เลือกใช้ `openclaw/plugin-sdk/channel-core`; เก็บ `openclaw/plugin-sdk/core` ไว้สำหรับ
พื้นผิวแบบครอบคลุมที่กว้างกว่าและตัวช่วยที่ใช้ร่วมกัน เช่น
`buildChannelConfigSchema`

สำหรับการกำหนดค่าช่องทาง ให้เผยแพร่ JSON Schema ที่ช่องทางเป็นเจ้าของผ่าน
`openclaw.plugin.json#channelConfigs` subpath `plugin-sdk/channel-config-schema`
มีไว้สำหรับ primitive ของ schema ที่ใช้ร่วมกันและตัวสร้างแบบทั่วไป Plugin ที่มาพร้อมกับ
OpenClaw ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ schema ช่องทางที่มาพร้อมชุดซึ่งยังคงไว้
export เพื่อความเข้ากันได้ที่เลิกใช้แล้วจะยังอยู่ใน
`plugin-sdk/channel-config-schema-legacy`; subpath schema ที่มาพร้อมชุดทั้งสองแบบไม่ใช่
รูปแบบสำหรับ Plugin ใหม่

<Warning>
  อย่า import seam อำนวยความสะดวกที่มีแบรนด์ผู้ให้บริการหรือช่องทาง (เช่น
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)
  Plugin ที่มาพร้อมชุดจะประกอบ subpath SDK แบบทั่วไปภายใน barrel `api.ts` /
  `runtime-api.ts` ของตนเอง; ผู้ใช้แกนหลักควรใช้ barrel ภายใน Plugin เหล่านั้น
  หรือเพิ่มสัญญา SDK แบบทั่วไปที่แคบเมื่อความจำเป็นนั้นเป็นแบบข้ามช่องทางจริงๆ

seam ตัวช่วยของ Plugin ที่มาพร้อมชุดจำนวนเล็กน้อยยังปรากฏใน export map ที่สร้างขึ้น
เมื่อมีการติดตามการใช้งานของเจ้าของ seam เหล่านี้มีไว้สำหรับการบำรุงรักษา
Plugin ที่มาพร้อมชุดเท่านั้น และไม่แนะนำให้เป็นเส้นทาง import สำหรับ Plugin บุคคลที่สาม
ใหม่

`openclaw/plugin-sdk/discord` และ `openclaw/plugin-sdk/telegram-account` ยังถูกเก็บไว้
เป็น facade ความเข้ากันได้ที่เลิกใช้แล้วสำหรับการใช้งานของเจ้าของที่ติดตามไว้ อย่า
คัดลอกเส้นทาง import เหล่านั้นไปยัง Plugin ใหม่; ให้ใช้ตัวช่วย runtime ที่ฉีดเข้ามาและ
subpath SDK ช่องทางแบบทั่วไปแทน
</Warning>

## ข้อมูลอ้างอิง subpath

SDK ของ Plugin เปิดเผยเป็นชุด subpath แบบแคบที่จัดกลุ่มตามพื้นที่ (entry ของ Plugin,
ช่องทาง, ผู้ให้บริการ, การยืนยันตัวตน, runtime, ความสามารถ, หน่วยความจำ และตัวช่วย
Plugin ที่มาพร้อมชุดซึ่งสงวนไว้) สำหรับรายการทั้งหมดที่จัดกลุ่มและลิงก์ไว้ ดู
[subpath ของ SDK ของ Plugin](/th/plugins/sdk-subpaths)

รายการ entrypoint ของคอมไพเลอร์อยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package exports ถูกสร้างจาก
ชุดย่อยสาธารณะหลังจากหัก subpath สำหรับการทดสอบ/ภายในเฉพาะ repo-local ที่ระบุไว้ใน
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` เรียกใช้
`pnpm plugin-sdk:surface` เพื่อตรวจสอบจำนวน public export subpath สาธารณะ
ที่เลิกใช้แล้วซึ่งเก่าพอและไม่ได้ถูกใช้โดยโค้ด production ของ extension ที่มาพร้อมชุดจะถูกติดตามใน
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel re-export ที่เลิกใช้แล้วแบบกว้าง
ถูกติดตามใน
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`

## API การลงทะเบียน

callback `register(api)` จะได้รับออบเจ็กต์ `OpenClawPluginApi` ที่มี
เมธอดเหล่านี้:

### การลงทะเบียนความสามารถ

| เมธอด                                           | สิ่งที่ลงทะเบียน                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | การอนุมานข้อความ (LLM)                  |
| `api.registerAgentHarness(...)`                  | ตัวดำเนินการเอเจนต์ระดับต่ำแบบทดลอง |
| `api.registerCliBackend(...)`                    | แบ็กเอนด์การอนุมาน CLI ในเครื่อง           |
| `api.registerChannel(...)`                       | ช่องทางการรับส่งข้อความ                     |
| `api.registerSpeechProvider(...)`                | การสังเคราะห์ข้อความเป็นเสียง / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | การถอดเสียงแบบเรียลไทม์แบบสตรีม      |
| `api.registerRealtimeVoiceProvider(...)`         | เซสชันเสียงแบบเรียลไทม์สองทาง        |
| `api.registerMediaUnderstandingProvider(...)`    | การวิเคราะห์รูปภาพ/เสียง/วิดีโอ            |
| `api.registerImageGenerationProvider(...)`       | การสร้างรูปภาพ                      |
| `api.registerMusicGenerationProvider(...)`       | การสร้างเพลง                      |
| `api.registerVideoGenerationProvider(...)`       | การสร้างวิดีโอ                      |
| `api.registerWebFetchProvider(...)`              | ผู้ให้บริการ fetch / scrape เว็บ           |
| `api.registerWebSearchProvider(...)`             | การค้นหาเว็บ                            |

### เครื่องมือและคำสั่ง

| เมธอด                          | สิ่งที่ลงทะเบียน                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | เครื่องมือเอเจนต์ (จำเป็นหรือ `{ optional: true }`) |
| `api.registerCommand(def)`      | คำสั่งกำหนดเอง (ข้าม LLM)             |

คำสั่งของ Plugin สามารถตั้งค่า `agentPromptGuidance` ได้เมื่อเอเจนต์ต้องการ
คำใบ้การกำหนดเส้นทางสั้นๆ ที่คำสั่งเป็นเจ้าของ ให้ข้อความนั้นเกี่ยวกับตัวคำสั่งเอง;
อย่าเพิ่มนโยบายเฉพาะผู้ให้บริการหรือเฉพาะ Plugin ไปยังตัวสร้าง prompt ของแกนหลัก

### โครงสร้างพื้นฐาน

| เมธอด                                         | สิ่งที่ลงทะเบียน                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | hook เหตุการณ์                              |
| `api.registerHttpRoute(params)`                | endpoint HTTP ของ Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | เมธอด RPC ของ Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | ตัวประกาศการค้นพบ Gateway ในเครื่อง      |
| `api.registerCli(registrar, opts?)`            | คำสั่งย่อย CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI ฟีเจอร์ Node ภายใต้ `openclaw nodes` |
| `api.registerService(service)`                 | บริการเบื้องหลัง                      |
| `api.registerInteractiveHandler(registration)` | handler แบบโต้ตอบ                     |
| `api.registerAgentToolResultMiddleware(...)`   | middleware ผลลัพธ์เครื่องมือของ runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | ส่วน prompt เพิ่มเติมที่อยู่ใกล้หน่วยความจำ |
| `api.registerMemoryCorpusSupplement(adapter)`  | คลังค้นหา/อ่านหน่วยความจำเพิ่มเติม      |

### hook โฮสต์สำหรับ Plugin เวิร์กโฟลว์

hook โฮสต์คือ seam ของ SDK สำหรับ Plugin ที่ต้องมีส่วนร่วมในวงจรชีวิตของโฮสต์
แทนที่จะเพิ่มเพียงผู้ให้บริการ ช่องทาง หรือเครื่องมือเท่านั้น สิ่งเหล่านี้เป็น
สัญญาแบบทั่วไป; Plan Mode สามารถใช้ได้ แต่เวิร์กโฟลว์การอนุมัติ,
gate นโยบายเวิร์กสเปซ, ตัวตรวจสอบเบื้องหลัง, wizard การตั้งค่า และ Plugin ร่วม UI
ก็ใช้ได้เช่นกัน

| เมธอด                                                                   | สัญญาที่เป็นเจ้าของ                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | สถานะเซสชันแบบ JSON-compatible ที่ Plugin เป็นเจ้าของ และฉายผ่านเซสชัน Gateway                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | บริบทแบบคงทน exactly-once ที่ฉีดเข้าสู่รอบเอเจนต์ถัดไปสำหรับหนึ่งเซสชัน                                                    |
| `api.registerTrustedToolPolicy(...)`                                     | นโยบายเครื่องมือ pre-plugin ที่มาพร้อมชุด/เชื่อถือได้ ซึ่งสามารถบล็อกหรือเขียน params ของเครื่องมือใหม่                                                      |
| `api.registerToolMetadata(...)`                                          | metadata การแสดงผลแค็ตตาล็อกเครื่องมือโดยไม่เปลี่ยน implementation ของเครื่องมือ                                                            |
| `api.registerCommand(...)`                                               | คำสั่ง Plugin แบบ scoped; ผลลัพธ์คำสั่งสามารถตั้งค่า `continueAgent: true`; คำสั่ง native ของ Discord รองรับ `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | descriptor การมีส่วนร่วมของ Control UI สำหรับพื้นผิวเซสชัน เครื่องมือ การรัน หรือการตั้งค่า                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | callback ล้างทรัพยากร runtime ที่ Plugin เป็นเจ้าของบนเส้นทาง reset/delete/reload                                                 |
| `api.registerAgentEventSubscription(...)`                                | การสมัครรับเหตุการณ์ที่ทำให้ปลอดภัยแล้วสำหรับสถานะเวิร์กโฟลว์และตัวตรวจสอบ                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | สถานะ scratch ของ Plugin ต่อการรัน ซึ่งถูกล้างเมื่อวงจรชีวิตการรันสิ้นสุด                                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | ระเบียนงาน scheduler ของเซสชันที่ Plugin เป็นเจ้าของ พร้อมการล้างแบบกำหนดได้แน่นอน                                                             |

สัญญาเหล่านี้ตั้งใจแยกอำนาจ:

- Plugin ภายนอกสามารถเป็นเจ้าของ extension ของเซสชัน, descriptor UI, คำสั่ง, metadata
  ของเครื่องมือ, การฉีดในรอบถัดไป และ hook ปกติ
- นโยบายเครื่องมือที่เชื่อถือได้ทำงานก่อน hook `before_tool_call` ทั่วไป และเป็นแบบ
  bundled-only เพราะมีส่วนร่วมในนโยบายความปลอดภัยของโฮสต์
- การเป็นเจ้าของคำสั่งที่สงวนไว้เป็นแบบ bundled-only Plugin ภายนอกควรใช้
  ชื่อคำสั่งหรือ alias ของตนเอง
- `allowPromptInjection=false` ปิดใช้งาน hook ที่แก้ไข prompt รวมถึง
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  ฟิลด์ prompt จาก `before_agent_start` แบบเดิม และ
  `enqueueNextTurnInjection`

ตัวอย่างผู้ใช้ที่ไม่ใช่ Plan:

| รูปแบบ Plugin             | hook ที่ใช้                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| เวิร์กโฟลว์การอนุมัติ            | extension ของเซสชัน, การดำเนินคำสั่งต่อ, การฉีดในรอบถัดไป, descriptor UI                                                            |
| gate นโยบายงบประมาณ/เวิร์กสเปซ | นโยบายเครื่องมือที่เชื่อถือได้, metadata ของเครื่องมือ, การฉายเซสชัน                                                                                 |
| ตัวตรวจสอบวงจรชีวิตเบื้องหลัง | การล้างวงจรชีวิต runtime, การสมัครรับเหตุการณ์เอเจนต์, การเป็นเจ้าของ/ล้าง scheduler ของเซสชัน, การมีส่วนร่วม prompt ของ heartbeat, descriptor UI |
| wizard การตั้งค่าหรือ onboarding   | extension ของเซสชัน, คำสั่งแบบ scoped, descriptor ของ Control UI                                                                              |

<Note>
  namespace ผู้ดูแลระบบแกนหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) จะยังคงเป็น `operator.admin` เสมอ แม้ว่า Plugin จะพยายามกำหนด
  scope เมธอด gateway ที่แคบกว่า ให้เลือก prefix เฉพาะ Plugin สำหรับ
  เมธอดที่ Plugin เป็นเจ้าของ
</Note>

<Accordion title="When to use tool-result middleware">
  Plugin ที่มาพร้อมชุดสามารถใช้ `api.registerAgentToolResultMiddleware(...)` ได้เมื่อ
  ต้องเขียนผลลัพธ์ของเครื่องมือใหม่หลังการดำเนินการและก่อนที่ runtime
  จะป้อนผลลัพธ์นั้นกลับเข้าโมเดล นี่คือ seam ที่ runtime-neutral และเชื่อถือได้
  สำหรับตัวลดผลลัพธ์แบบ async เช่น tokenjuice

Plugin ที่มาพร้อมชุดต้องประกาศ `contracts.agentToolResultMiddleware` สำหรับแต่ละ
runtime เป้าหมาย เช่น `["pi", "codex"]` Plugin ภายนอก
ไม่สามารถลงทะเบียน middleware นี้ได้ ให้ใช้ hook ปกติของ Plugin OpenClaw สำหรับงาน
ที่ไม่ต้องการ timing ของผลลัพธ์เครื่องมือก่อนเข้าโมเดล เส้นทางการลงทะเบียน factory ของส่วนขยายแบบฝัง
ที่ใช้ได้เฉพาะ Pi เดิมถูกนำออกแล้ว
</Accordion>

### การลงทะเบียนการค้นพบ Gateway

`api.registerGatewayDiscoveryService(...)` ช่วยให้ Plugin โฆษณา Gateway ที่ใช้งานอยู่
บนทรานสปอร์ตการค้นพบในเครื่อง เช่น mDNS/Bonjour OpenClaw เรียกใช้
service ระหว่างการเริ่มต้น Gateway เมื่อเปิดใช้การค้นพบในเครื่อง ส่ง
พอร์ต Gateway ปัจจุบันและข้อมูล hint TXT ที่ไม่เป็นความลับ และเรียก
handler `stop` ที่ส่งคืนมาระหว่างการปิด Gateway

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Plugin การค้นพบ Gateway ต้องไม่ถือว่าค่า TXT ที่โฆษณาเป็นความลับหรือ
การยืนยันตัวตน การค้นพบเป็น hint สำหรับการกำหนดเส้นทาง การยืนยันตัวตนของ Gateway และ
การ pin TLS ยังคงเป็นเจ้าของความน่าเชื่อถือ

### metadata การลงทะเบียน CLI

`api.registerCli(registrar, opts?)` รับ metadata ของคำสั่งสองชนิด:

- `commands`: ชื่อคำสั่งที่ registrar เป็นเจ้าของอย่างชัดเจน
- `descriptors`: ตัวบรรยายคำสั่งในช่วง parse ที่ใช้สำหรับ help ของ CLI,
  การกำหนดเส้นทาง และการลงทะเบียน CLI ของ Plugin แบบ lazy
- `parentPath`: เส้นทางคำสั่งแม่ที่ไม่บังคับสำหรับกลุ่มคำสั่งซ้อน เช่น
  `["nodes"]`

สำหรับฟีเจอร์ paired-node ให้เลือกใช้
`api.registerNodeCliFeature(registrar, opts?)` เป็น wrapper ขนาดเล็กครอบ
`api.registerCli(..., { parentPath: ["nodes"] })` และทำให้คำสั่งเช่น
`openclaw nodes canvas` เป็นฟีเจอร์ node ที่ Plugin เป็นเจ้าของอย่างชัดเจน

หากคุณต้องการให้คำสั่งของ Plugin ยังคงโหลดแบบ lazy ในเส้นทาง CLI root ปกติ
ให้ระบุ `descriptors` ที่ครอบคลุม root ของคำสั่งระดับบนสุดทุกตัวที่
registrar นั้นเปิดเผย

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

คำสั่งซ้อนจะได้รับคำสั่งแม่ที่ resolve แล้วในชื่อ `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

ใช้ `commands` เพียงอย่างเดียวเฉพาะเมื่อคุณไม่ต้องการการลงทะเบียน CLI root แบบ lazy
เส้นทางความเข้ากันได้แบบ eager นั้นยังคงรองรับอยู่ แต่จะไม่ติดตั้ง
placeholder ที่มี descriptor รองรับสำหรับการโหลดแบบ lazy ในช่วง parse

### การลงทะเบียน backend ของ CLI

`api.registerCliBackend(...)` ช่วยให้ Plugin เป็นเจ้าของ config เริ่มต้นสำหรับ backend
AI CLI ในเครื่อง เช่น `codex-cli`

- `id` ของ backend จะกลายเป็น prefix ของ provider ใน model ref เช่น `codex-cli/gpt-5`
- `config` ของ backend ใช้ shape เดียวกับ `agents.defaults.cliBackends.<id>`
- config ของผู้ใช้ยังคงมีผลเหนือกว่า OpenClaw จะ merge `agents.defaults.cliBackends.<id>` ทับ
  ค่าเริ่มต้นของ Plugin ก่อนเรียกใช้ CLI
- ใช้ `normalizeConfig` เมื่อ backend ต้องการการเขียนใหม่เพื่อความเข้ากันได้หลัง merge
  (เช่น การ normalize shape ของ flag แบบเก่า)
- ใช้ `resolveExecutionArgs` สำหรับการเขียน argv ใหม่ตามขอบเขตคำขอที่เป็นของ
  dialect ของ CLI เช่น การ map ระดับ thinking ของ OpenClaw ไปยัง flag effort แบบ native

สำหรับคู่มือการเขียนแบบครบวงจร โปรดดู
[Plugin backend ของ CLI](/th/plugins/cli-backend-plugins)

### slot แบบ exclusive

| Method                                     | สิ่งที่ลงทะเบียน                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | เอนจินบริบท (ใช้งานได้ครั้งละหนึ่งตัว) callback `assemble()` ได้รับ `availableTools` และ `citationsMode` เพื่อให้เอนจินปรับแต่ง prompt เพิ่มเติมได้ |
| `api.registerMemoryCapability(capability)` | capability หน่วยความจำแบบรวมศูนย์                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | builder ส่วน prompt ของหน่วยความจำ                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | resolver แผน flush หน่วยความจำ                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | adapter runtime ของหน่วยความจำ                                                                                                                                    |

### adapter embedding ของหน่วยความจำ

| Method                                         | สิ่งที่ลงทะเบียน                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter embedding หน่วยความจำสำหรับ Plugin ที่ใช้งานอยู่ |

- `registerMemoryCapability` คือ API Plugin หน่วยความจำแบบ exclusive ที่แนะนำ
- `registerMemoryCapability` ยังอาจเปิดเผย `publicArtifacts.listArtifacts(...)`
  เพื่อให้ Plugin คู่ขนานสามารถใช้ artifact หน่วยความจำที่ export ผ่าน
  `openclaw/plugin-sdk/memory-host-core` แทนการเข้าถึง layout ส่วนตัวของ
  Plugin หน่วยความจำตัวใดตัวหนึ่ง
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` และ
  `registerMemoryRuntime` เป็น API Plugin หน่วยความจำแบบ exclusive ที่รองรับแบบ legacy
- `MemoryFlushPlan.model` สามารถ pin turn การ flush ไปยัง reference `provider/model`
  ที่แน่นอน เช่น `ollama/qwen3:8b` โดยไม่รับช่วง
  fallback chain ที่ใช้งานอยู่
- `registerMemoryEmbeddingProvider` ช่วยให้ Plugin หน่วยความจำที่ใช้งานอยู่ลงทะเบียน
  id ของ adapter embedding หนึ่งรายการหรือมากกว่า (เช่น `openai`, `gemini` หรือ id แบบกำหนดเอง
  ที่ Plugin กำหนด)
- config ของผู้ใช้ เช่น `agents.defaults.memorySearch.provider` และ
  `agents.defaults.memorySearch.fallback` จะ resolve กับ id adapter ที่ลงทะเบียนเหล่านั้น

### เหตุการณ์และ lifecycle

| Method                                       | สิ่งที่ทำ                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | hook lifecycle แบบ typed          |
| `api.onConversationBindingResolved(handler)` | callback การ resolve binding ของการสนทนา |

ดู [hook ของ Plugin](/th/plugins/hooks) สำหรับตัวอย่าง ชื่อ hook ทั่วไป และ
ความหมายของ guard

### ความหมายการตัดสินใจของ hook

- `before_tool_call`: การส่งคืน `{ block: true }` ถือเป็น terminal เมื่อ handler ใดตั้งค่าแล้ว handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: การส่งคืน `{ block: false }` จะถูกถือว่าไม่มีการตัดสินใจ (เหมือนกับการละเว้น `block`) ไม่ใช่ override
- `before_install`: การส่งคืน `{ block: true }` ถือเป็น terminal เมื่อ handler ใดตั้งค่าแล้ว handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_install`: การส่งคืน `{ block: false }` จะถูกถือว่าไม่มีการตัดสินใจ (เหมือนกับการละเว้น `block`) ไม่ใช่ override
- `reply_dispatch`: การส่งคืน `{ handled: true, ... }` ถือเป็น terminal เมื่อ handler ใดอ้างสิทธิ์ dispatch แล้ว handler ที่มี priority ต่ำกว่าและเส้นทาง dispatch โมเดลเริ่มต้นจะถูกข้าม
- `message_sending`: การส่งคืน `{ cancel: true }` ถือเป็น terminal เมื่อ handler ใดตั้งค่าแล้ว handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `message_sending`: การส่งคืน `{ cancel: false }` จะถูกถือว่าไม่มีการตัดสินใจ (เหมือนกับการละเว้น `cancel`) ไม่ใช่ override
- `message_received`: ใช้ฟิลด์ `threadId` แบบ typed เมื่อต้องการการกำหนดเส้นทาง thread/topic ขาเข้า เก็บ `metadata` ไว้สำหรับส่วนเสริมเฉพาะ channel
- `message_sending`: ใช้ฟิลด์ routing `replyToId` / `threadId` แบบ typed ก่อน fallback ไปยัง `metadata` เฉพาะ channel
- `gateway_start`: ใช้ `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับสถานะเริ่มต้นที่ Gateway เป็นเจ้าของ แทนการพึ่งพา hook ภายใน `gateway:startup`
- `cron_changed`: สังเกตการเปลี่ยนแปลง lifecycle ของ cron ที่ gateway เป็นเจ้าของ ใช้ `event.job?.state?.nextRunAtMs` และ `ctx.getCron?.()` เมื่อ sync scheduler การปลุกภายนอก และคงให้ OpenClaw เป็น source of truth สำหรับการตรวจสอบและการดำเนินการที่ถึงกำหนด

### ฟิลด์ของ object API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id ของ Plugin                                                                                   |
| `api.name`               | `string`                  | ชื่อที่แสดง                                                                                |
| `api.version`            | `string?`                 | เวอร์ชันของ Plugin (ไม่บังคับ)                                                                   |
| `api.description`        | `string?`                 | คำอธิบาย Plugin (ไม่บังคับ)                                                               |
| `api.source`             | `string`                  | เส้นทาง source ของ Plugin                                                                          |
| `api.rootDir`            | `string?`                 | ไดเรกทอรี root ของ Plugin (ไม่บังคับ)                                                            |
| `api.config`             | `OpenClawConfig`          | snapshot config ปัจจุบัน (snapshot runtime ในหน่วยความจำที่ใช้งานอยู่เมื่อมี)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | config เฉพาะ Plugin จาก `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [helper ของ runtime](/th/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | logger ตาม scope (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดการโหลดปัจจุบัน `"setup-runtime"` คือหน้าต่าง startup/setup แบบเบาก่อน entry เต็ม |
| `api.resolvePath(input)` | `(string) => string`      | Resolve เส้นทางแบบสัมพัทธ์กับ root ของ Plugin                                                        |

## แบบแผน module ภายใน

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ในเครื่องสำหรับ import ภายใน:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  ห้าม import Plugin ของคุณเองผ่าน `openclaw/plugin-sdk/<your-plugin>`
  จากโค้ด production ให้กำหนดเส้นทาง import ภายในผ่าน `./api.ts` หรือ
  `./runtime-api.ts` เส้นทาง SDK เป็น contract ภายนอกเท่านั้น
</Warning>

พื้นผิวสาธารณะของ Plugin ที่รวมมากับแพ็กเกจซึ่งโหลดผ่านฟาซาด (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` และไฟล์จุดเข้าใช้งานสาธารณะที่คล้ายกัน) ควรใช้
สแนปช็อตคอนฟิก runtime ที่ใช้งานอยู่เมื่อ OpenClaw กำลังรันอยู่แล้ว หากยังไม่มี
สแนปช็อต runtime ก็จะย้อนกลับไปใช้ไฟล์คอนฟิกที่แก้ไขค่าแล้วบนดิสก์
ฟาซาดของ Plugin ที่รวมมากับแพ็กเกจควรถูกโหลดผ่านตัวโหลดฟาซาด Plugin ของ OpenClaw;
การนำเข้าโดยตรงจาก `dist/extensions/...` จะข้าม manifest
และการตรวจสอบ sidecar ของ runtime ที่การติดตั้งแบบแพ็กเกจใช้กับโค้ดที่ Plugin เป็นเจ้าของ

Plugin ผู้ให้บริการสามารถเปิดเผย barrel สัญญาเฉพาะใน Plugin แบบจำกัดได้เมื่อ
ตัวช่วยนั้นตั้งใจให้เฉพาะกับผู้ให้บริการและยังไม่เหมาะจะอยู่ใน subpath SDK
ทั่วไป ตัวอย่างที่รวมมา:

- **Anthropic**: แนวเชื่อมสาธารณะ `api.ts` / `contract-api.ts` สำหรับตัวช่วยสตรีม
  beta-header ของ Claude และ `service_tier`
- **`@openclaw/openai-provider`**: `api.ts` ส่งออกตัวสร้างผู้ให้บริการ,
  ตัวช่วย default-model และตัวสร้างผู้ให้บริการแบบเรียลไทม์
- **`@openclaw/openrouter-provider`**: `api.ts` ส่งออกตัวสร้างผู้ให้บริการ
  พร้อมตัวช่วย onboarding/config

<Warning>
  โค้ดโปรดักชันของส่วนขยายควรหลีกเลี่ยงการนำเข้า `openclaw/plugin-sdk/<other-plugin>`
  ด้วย หากตัวช่วยนั้นใช้ร่วมกันจริง ให้ยกระดับไปยัง subpath SDK ที่เป็นกลาง
  เช่น `openclaw/plugin-sdk/speech`, `.../provider-model-shared` หรือพื้นผิวอื่น
  ที่มุ่งตามความสามารถ แทนการผูก Plugin สองตัวเข้าด้วยกัน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="จุดเข้าใช้งาน" icon="door-open" href="/th/plugins/sdk-entrypoints">
    ตัวเลือก `definePluginEntry` และ `defineChannelPluginEntry`
  </Card>
  <Card title="ตัวช่วย runtime" icon="gears" href="/th/plugins/sdk-runtime">
    ข้อมูลอ้างอิง namespace `api.runtime` ฉบับเต็ม
  </Card>
  <Card title="การตั้งค่าและคอนฟิก" icon="sliders" href="/th/plugins/sdk-setup">
    การแพ็กเกจ, manifest และ schema คอนฟิก
  </Card>
  <Card title="การทดสอบ" icon="vial" href="/th/plugins/sdk-testing">
    ยูทิลิตีทดสอบและกฎ lint
  </Card>
  <Card title="การย้าย SDK" icon="arrows-turn-right" href="/th/plugins/sdk-migration">
    การย้ายจากพื้นผิวที่เลิกใช้แล้ว
  </Card>
  <Card title="ภายใน Plugin" icon="diagram-project" href="/th/plugins/architecture">
    สถาปัตยกรรมเชิงลึกและโมเดลความสามารถ
  </Card>
</CardGroup>
