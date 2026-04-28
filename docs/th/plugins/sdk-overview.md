---
read_when:
    - คุณต้องการทราบว่าควร import จาก SDK subpath ใด
    - คุณต้องการข้อมูลอ้างอิงสำหรับเมธอดการลงทะเบียนทั้งหมดบน OpenClawPluginApi
    - คุณกำลังค้นหา export เฉพาะตัวใน SDK
sidebarTitle: SDK overview
summary: แผนที่ import, ข้อมูลอ้างอิง API การลงทะเบียน และสถาปัตยกรรม SDK
title: ภาพรวม Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:55:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK คือสัญญาแบบมีชนิดระหว่าง Plugin กับ core หน้านี้คือ
ข้อมูลอ้างอิงสำหรับ **ควร import อะไร** และ **คุณสามารถลงทะเบียนอะไรได้บ้าง**

<Tip>
  กำลังมองหาคู่มือ how-to อยู่ใช่ไหม?

- Plugin แรกของคุณ? เริ่มที่ [Building plugins](/th/plugins/building-plugins)
- Channel Plugin? ดู [Channel plugins](/th/plugins/sdk-channel-plugins)
- Provider Plugin? ดู [Provider plugins](/th/plugins/sdk-provider-plugins)
- Tool หรือ lifecycle hook Plugin? ดู [Plugin hooks](/th/plugins/hooks)
</Tip>

## รูปแบบการ import

ให้ import จาก subpath ที่เฉพาะเจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

แต่ละ subpath เป็นโมดูลขนาดเล็กที่แยกตัวได้เอง วิธีนี้ช่วยให้การเริ่มต้นเร็ว และ
ป้องกันปัญหา circular dependency สำหรับตัวช่วย entry/build ที่เฉพาะกับ channel
ควรใช้ `openclaw/plugin-sdk/channel-core`; และเก็บ `openclaw/plugin-sdk/core` ไว้สำหรับ
พื้นผิว umbrella ที่กว้างกว่าและตัวช่วยที่ใช้ร่วมกัน เช่น
`buildChannelConfigSchema`

สำหรับ channel config ให้เผยแพร่ JSON Schema ที่ channel เป็นเจ้าของผ่าน
`openclaw.plugin.json#channelConfigs` subpath `plugin-sdk/channel-config-schema`
มีไว้สำหรับ primitive ของ schema ที่ใช้ร่วมกันและ generic builder เท่านั้น
schema export ที่ตั้งชื่อตาม bundled-channel บน subpath นั้นเป็น
legacy compatibility export ไม่ใช่รูปแบบสำหรับ Plugin ใหม่

<Warning>
  อย่า import seam แบบ convenience ที่ติดแบรนด์ provider หรือ channel (ตัวอย่างเช่น
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)
  Plugin ที่ bundle มาให้จะประกอบ generic SDK subpath ภายใน `api.ts` /
  `runtime-api.ts` barrel ของตัวเอง; ผู้ใช้ใน core ควรใช้ barrel ภายใน Plugin เหล่านั้น
  หรือเพิ่ม generic SDK contract แบบแคบเมื่อความต้องการนั้นเป็นแบบ
  ข้ามช่องทางจริง ๆ

seam ตัวช่วยของ bundled-plugin จำนวนเล็กน้อย (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` และอื่นที่คล้ายกัน) ยังคงปรากฏอยู่ใน
generated export map โดยมีไว้เพื่อการดูแล bundled-plugin เท่านั้น และไม่ใช่
พาธ import ที่แนะนำสำหรับ third-party plugin ใหม่
</Warning>

## ข้อมูลอ้างอิง subpath

Plugin SDK ถูกเปิดเผยเป็นชุดของ subpath แบบแคบที่จัดกลุ่มตามพื้นที่ (plugin
entry, channel, provider, auth, runtime, capability, memory และตัวช่วยสำหรับ bundled-plugin ที่สงวนไว้) สำหรับแค็ตตาล็อกแบบเต็ม — ที่จัดกลุ่มและมีลิงก์ — ดู
[Plugin SDK subpaths](/th/plugins/sdk-subpaths)

รายการที่สร้างอัตโนมัติของ subpath กว่า 200 รายการอยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`

## API การลงทะเบียน

callback `register(api)` จะได้รับออบเจ็กต์ `OpenClawPluginApi` ที่มี
เมธอดเหล่านี้:

### การลงทะเบียน capability

| เมธอด                                           | สิ่งที่ลงทะเบียน                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Text inference (LLM)                  |
| `api.registerAgentHarness(...)`                  | executor ระดับล่างของเอเจนต์แบบทดลอง |
| `api.registerCliBackend(...)`                    | backend ของ local CLI inference       |
| `api.registerChannel(...)`                       | ช่องทางการส่งข้อความ                 |
| `api.registerSpeechProvider(...)`                | การสังเคราะห์ Text-to-speech / STT   |
| `api.registerRealtimeTranscriptionProvider(...)` | การถอดเสียงแบบเรียลไทม์ชนิดสตรีม     |
| `api.registerRealtimeVoiceProvider(...)`         | เซสชันเสียงแบบสองทิศทางเรียลไทม์     |
| `api.registerMediaUnderstandingProvider(...)`    | การวิเคราะห์ภาพ/เสียง/วิดีโอ         |
| `api.registerImageGenerationProvider(...)`       | การสร้างภาพ                           |
| `api.registerMusicGenerationProvider(...)`       | การสร้างเพลง                          |
| `api.registerVideoGenerationProvider(...)`       | การสร้างวิดีโอ                        |
| `api.registerWebFetchProvider(...)`              | provider สำหรับ web fetch / scrape    |
| `api.registerWebSearchProvider(...)`             | การค้นหาเว็บ                          |

### เครื่องมือและคำสั่ง

| เมธอด                          | สิ่งที่ลงทะเบียน                              |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | tool ของเอเจนต์ (required หรือ `{ optional: true }`) |
| `api.registerCommand(def)`      | คำสั่งแบบกำหนดเอง (ข้าม LLM)                  |

### โครงสร้างพื้นฐาน

| เมธอด                                         | สิ่งที่ลงทะเบียน                    |
| ---------------------------------------------- | ----------------------------------- |
| `api.registerHook(events, handler, opts?)`     | event hook                          |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint               |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC method                  |
| `api.registerGatewayDiscoveryService(service)` | ตัวประกาศ local Gateway discovery  |
| `api.registerCli(registrar, opts?)`            | CLI subcommand                      |
| `api.registerService(service)`                 | background service                  |
| `api.registerInteractiveHandler(registration)` | interactive handler                 |
| `api.registerAgentToolResultMiddleware(...)`   | tool-result middleware ของ runtime  |
| `api.registerMemoryPromptSupplement(builder)`  | ส่วน prompt เสริมที่อยู่ใกล้ memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus สำหรับ search/read memory แบบเสริม |

<Note>
  namespace ของ core admin ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) จะคงเป็น `operator.admin` เสมอ แม้ว่า Plugin จะพยายามกำหนด
  gateway method scope ที่แคบกว่าก็ตาม ควรใช้ prefix เฉพาะ Plugin สำหรับ
  method ที่เป็นของ Plugin เอง
</Note>

<Accordion title="ควรใช้ tool-result middleware เมื่อใด">
  Plugin ที่ bundle มาให้สามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อ
  ต้องการเขียนผลลัพธ์ของ tool ใหม่หลังการรัน และก่อนที่ runtime
  จะส่งผลลัพธ์นั้นกลับเข้าไปยังโมเดล นี่คือ seam แบบไม่ขึ้นกับ runtime ที่เชื่อถือได้
  สำหรับตัวลดทอน output แบบ async เช่น tokenjuice

Plugin ที่ bundle มาให้ต้องประกาศ `contracts.agentToolResultMiddleware` สำหรับแต่ละ
runtime เป้าหมาย เช่น `["pi", "codex"]` ส่วน external plugin
ไม่สามารถลงทะเบียน middleware นี้ได้; ให้ใช้ hook ของ OpenClaw Plugin แบบปกติสำหรับงาน
ที่ไม่ต้องการจังหวะก่อนโมเดลในขั้นผลลัพธ์ของ tool เส้นทางการลงทะเบียน embedded
extension factory แบบ Pi-only แบบเก่าถูกนำออกแล้ว
</Accordion>

### การลงทะเบียน Gateway discovery

`api.registerGatewayDiscoveryService(...)` ช่วยให้ Plugin โฆษณา
Gateway ที่กำลังทำงานอยู่บน transport สำหรับ discovery ในเครื่อง เช่น mDNS/Bonjour OpenClaw จะเรียก
service ระหว่างการเริ่มต้น Gateway เมื่อเปิดใช้ local discovery, ส่ง
พอร์ต Gateway ปัจจุบันและข้อมูล hint แบบ TXT ที่ไม่ใช่ความลับเข้าไป และเรียก
handler `stop` ที่ส่งกลับมาเมื่อ Gateway ปิดตัวลง

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

Plugin สำหรับ Gateway discovery ต้องไม่ถือว่าค่า TXT ที่โฆษณาเป็นความลับหรือ
การยืนยันตัวตน Discovery เป็นเพียง hint สำหรับการกำหนดเส้นทาง; ความเชื่อถือยังคงเป็นหน้าที่ของ Gateway auth และ TLS pinning

### Metadata ของการลงทะเบียน CLI

`api.registerCli(registrar, opts?)` รับ metadata ระดับบนสุดได้สองชนิด:

- `commands`: root command แบบระบุชัดเจนที่ registrar เป็นเจ้าของ
- `descriptors`: descriptor ของคำสั่งในขั้น parse-time ที่ใช้สำหรับ help ของ root CLI,
  การกำหนดเส้นทาง และการลงทะเบียน CLI ของ Plugin แบบ lazy

หากคุณต้องการให้คำสั่งของ Plugin ยังคงถูกโหลดแบบ lazy ในเส้นทาง root CLI ปกติ
ให้ระบุ `descriptors` ที่ครอบคลุมทุก top-level command root ที่ registrar นั้นเปิดเผย

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

ใช้ `commands` เพียงอย่างเดียวเฉพาะเมื่อคุณไม่ต้องการ lazy root CLI registration
เส้นทาง compatibility แบบ eager นี้ยังคงรองรับอยู่ แต่จะไม่ติดตั้ง
placeholder ที่รองรับ descriptor สำหรับการโหลดแบบ lazy ในขั้น parse-time

### การลงทะเบียน CLI backend

`api.registerCliBackend(...)` ช่วยให้ Plugin เป็นเจ้าของ config เริ่มต้นของ local
AI CLI backend เช่น `codex-cli`

- `id` ของ backend จะกลายเป็น prefix ของ provider ใน model ref เช่น `codex-cli/gpt-5`
- `config` ของ backend ใช้รูปแบบเดียวกับ `agents.defaults.cliBackends.<id>`
- config ของผู้ใช้ยังคงมีผลเหนือกว่า OpenClaw จะ merge `agents.defaults.cliBackends.<id>` ทับค่าเริ่มต้นของ Plugin ก่อนจะรัน CLI
- ใช้ `normalizeConfig` เมื่อ backend ต้องการ compatibility rewrite หลัง merge
  (เช่น normalize รูปแบบแฟล็กแบบเก่า)

### Exclusive slot

| เมธอด                                     | สิ่งที่ลงทะเบียน                                                                                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | context engine (ทำงานได้ครั้งละหนึ่งตัว) callback `assemble()` จะได้รับ `availableTools` และ `citationsMode` เพื่อให้ engine ปรับแต่งการเพิ่ม prompt ได้ |
| `api.registerMemoryCapability(capability)` | memory capability แบบรวมศูนย์                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | ตัวสร้างส่วน prompt ของ memory                                                                                                                           |
| `api.registerMemoryFlushPlan(resolver)`    | ตัว resolve แผนการ flush memory                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | memory runtime adapter                                                                                                                                    |

### ตัวปรับแต่ง embedding ของ memory

| เมธอด                                         | สิ่งที่ลงทะเบียน                           |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | memory embedding adapter สำหรับ Plugin ที่ทำงานอยู่ |

- `registerMemoryCapability` คือ API แบบ exclusive สำหรับ memory-plugin ที่แนะนำ
- `registerMemoryCapability` อาจเปิดเผย `publicArtifacts.listArtifacts(...)` ได้ด้วย
  เพื่อให้ companion plugin ใช้ artifact หน่วยความจำที่ export ออกมาผ่าน
  `openclaw/plugin-sdk/memory-host-core` แทนการเจาะเข้า layout ภายในของ
  memory plugin ใด plugin หนึ่ง
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` และ
  `registerMemoryRuntime` คือ API แบบ exclusive สำหรับ memory-plugin ที่คงไว้เพื่อความเข้ากันได้
- `registerMemoryEmbeddingProvider` ช่วยให้ memory plugin ที่กำลังทำงานอยู่ลงทะเบียน
  adapter id หนึ่งตัวหรือหลายตัว (เช่น `openai`, `gemini` หรือ id ที่ Plugin กำหนดเอง)
- config ของผู้ใช้ เช่น `agents.defaults.memorySearch.provider` และ
  `agents.defaults.memorySearch.fallback` จะ resolve กับ adapter id ที่ลงทะเบียนเหล่านั้น

### Event และ lifecycle

| เมธอด                                       | สิ่งที่ทำ                   |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | lifecycle hook แบบมีชนิด   |
| `api.onConversationBindingResolved(handler)` | callback ของ conversation binding |

ดู [Plugin hooks](/th/plugins/hooks) สำหรับตัวอย่าง ชื่อ hook ที่ใช้บ่อย และ
semantics ของ guard

### semantics ของการตัดสินใจของ hook

- `before_tool_call`: การส่งกลับ `{ block: true }` เป็นการตัดสินแบบสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: การส่งกลับ `{ block: false }` จะถือว่าไม่มีการตัดสิน (เหมือนกับการละเว้น `block`) ไม่ใช่การ override
- `before_install`: การส่งกลับ `{ block: true }` เป็นการตัดสินแบบสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: การส่งกลับ `{ block: false }` จะถือว่าไม่มีการตัดสิน (เหมือนกับการละเว้น `block`) ไม่ใช่การ override
- `reply_dispatch`: การส่งกลับ `{ handled: true, ... }` เป็นการตัดสินแบบสิ้นสุด เมื่อ handler ใดอ้างสิทธิ์การ dispatch แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าและเส้นทาง dispatch ของโมเดลตามค่าเริ่มต้นจะถูกข้าม
- `message_sending`: การส่งกลับ `{ cancel: true }` เป็นการตัดสินแบบสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: การส่งกลับ `{ cancel: false }` จะถือว่าไม่มีการตัดสิน (เหมือนกับการละเว้น `cancel`) ไม่ใช่การ override
- `message_received`: ใช้ฟิลด์ `threadId` แบบมีชนิดเมื่อคุณต้องการ routing ของ thread/topic ขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเสริมเฉพาะช่องทาง
- `message_sending`: ใช้ฟิลด์ routing แบบมีชนิด `replyToId` / `threadId` ก่อน fallback ไปยัง `metadata` เฉพาะช่องทาง
- `gateway_start`: ใช้ `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับสถานะตอนเริ่มต้นที่ gateway เป็นเจ้าของ แทนการพึ่งพา hook ภายใน `gateway:startup`

### ฟิลด์ของออบเจ็กต์ API

| ฟิลด์                    | ชนิด                      | คำอธิบาย                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | id ของ Plugin                                                                              |
| `api.name`               | `string`                  | ชื่อที่ใช้แสดง                                                                             |
| `api.version`            | `string?`                 | เวอร์ชันของ Plugin (ไม่บังคับ)                                                             |
| `api.description`        | `string?`                 | คำอธิบายของ Plugin (ไม่บังคับ)                                                             |
| `api.source`             | `string`                  | พาธต้นทางของ Plugin                                                                        |
| `api.rootDir`            | `string?`                 | ไดเรกทอรีรูทของ Plugin (ไม่บังคับ)                                                         |
| `api.config`             | `OpenClawConfig`          | snapshot ของ config ปัจจุบัน (snapshot ของ runtime ในหน่วยความจำที่ใช้งานอยู่เมื่อมี)     |
| `api.pluginConfig`       | `Record<string, unknown>` | config เฉพาะ Plugin จาก `plugins.entries.<id>.config`                                      |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/th/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | logger แบบมีขอบเขต (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือช่วง startup/setup แบบเบาก่อน full-entry         |
| `api.resolvePath(input)` | `(string) => string`      | resolve พาธให้สัมพันธ์กับรูทของ Plugin                                                     |

## รูปแบบโมดูลภายใน

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่องสำหรับ import ภายใน:

```
my-plugin/
  api.ts            # export สาธารณะสำหรับผู้ใช้ภายนอก
  runtime-api.ts    # export ของ runtime ที่ใช้ภายในเท่านั้น
  index.ts          # entry point ของ Plugin
  setup-entry.ts    # entry สำหรับ setup-only แบบเบา (ไม่บังคับ)
```

<Warning>
  อย่า import Plugin ของตัวเองผ่าน `openclaw/plugin-sdk/<your-plugin>`
  จาก production code ให้กำหนดเส้นทาง import ภายในผ่าน `./api.ts` หรือ
  `./runtime-api.ts` พาธ SDK เป็นเพียงสัญญาภายนอกเท่านั้น
</Warning>

พื้นผิวสาธารณะของ bundled plugin ที่โหลดผ่าน facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` และไฟล์ entry สาธารณะอื่นที่คล้ายกัน) จะให้ความสำคัญกับ
snapshot ของ runtime config ที่กำลังทำงานอยู่ เมื่อ OpenClaw ทำงานอยู่แล้ว หากยังไม่มี
runtime snapshot จะ fallback ไปยัง config file ที่ resolve แล้วบนดิสก์

provider plugin สามารถเปิดเผย plugin-local contract barrel แบบแคบได้ เมื่อ
helper นั้นตั้งใจให้เป็นแบบเฉพาะ provider และยังไม่ควรอยู่ใน generic SDK
subpath ตัวอย่างจาก bundled plugin:

- **Anthropic**: seam สาธารณะ `api.ts` / `contract-api.ts` สำหรับ Claude
  beta-header และตัวช่วย stream ของ `service_tier`
- **`@openclaw/openai-provider`**: `api.ts` export builder ของ provider,
  ตัวช่วย default-model และ builder ของ realtime provider
- **`@openclaw/openrouter-provider`**: `api.ts` export provider builder
  พร้อมตัวช่วย onboarding/config

<Warning>
  production code ของ extension ก็ควรหลีกเลี่ยง `openclaw/plugin-sdk/<other-plugin>`
  เช่นกัน หาก helper ตัวใดใช้ร่วมกันจริง ให้เลื่อนมันไปยัง SDK subpath แบบเป็นกลาง
  เช่น `openclaw/plugin-sdk/speech`, `.../provider-model-shared` หรือพื้นผิว
  ที่ยึดตาม capability แบบอื่น แทนการผูก Plugin สองตัวเข้าด้วยกัน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/th/plugins/sdk-entrypoints">
    ตัวเลือกของ `definePluginEntry` และ `defineChannelPluginEntry`
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/th/plugins/sdk-runtime">
    ข้อมูลอ้างอิง namespace `api.runtime` แบบเต็ม
  </Card>
  <Card title="Setup and config" icon="sliders" href="/th/plugins/sdk-setup">
    การแพ็กเกจ, manifest และ config schema
  </Card>
  <Card title="Testing" icon="vial" href="/th/plugins/sdk-testing">
    ยูทิลิตีทดสอบและกฎ lint
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/th/plugins/sdk-migration">
    การย้ายจากพื้นผิวที่เลิกใช้แล้ว
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/th/plugins/architecture">
    สถาปัตยกรรมเชิงลึกและโมเดล capability
  </Card>
</CardGroup>
