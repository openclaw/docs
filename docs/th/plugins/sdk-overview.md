---
read_when:
    - คุณต้องทราบว่าควรนำเข้าจากพาธย่อยใดของ SDK
    - คุณต้องการเอกสารอ้างอิงสำหรับเมธอดการลงทะเบียนทั้งหมดของ OpenClawPluginApi
    - คุณกำลังค้นหาสิ่งที่ SDK ส่งออกแบบเฉพาะเจาะจง
sidebarTitle: Plugin SDK overview
summary: แผนผังการนำเข้า คู่มืออ้างอิง API การลงทะเบียน และสถาปัตยกรรม SDK
title: ภาพรวม Plugin SDK
x-i18n:
    generated_at: "2026-04-30T10:08:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK คือสัญญาแบบมีชนิดข้อมูลระหว่าง Plugin กับ core หน้านี้เป็น
เอกสารอ้างอิงสำหรับ **สิ่งที่ต้อง import** และ **สิ่งที่คุณสามารถ register ได้**

<Note>
  หน้านี้สำหรับผู้เขียน Plugin ที่ใช้ `openclaw/plugin-sdk/*` ภายใน
  OpenClaw สำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
  ที่ต้องการรัน agent ผ่าน Gateway ให้ใช้
  [OpenClaw App SDK](/th/concepts/openclaw-sdk) และแพ็กเกจ `@openclaw/sdk`
  แทน
</Note>

<Tip>
กำลังมองหาคู่มือวิธีทำอยู่หรือไม่ เริ่มที่ [การสร้าง Plugin](/th/plugins/building-plugins), ใช้ [Channel plugins](/th/plugins/sdk-channel-plugins) สำหรับ Plugin ช่องทาง, [Provider plugins](/th/plugins/sdk-provider-plugins) สำหรับ Provider Plugin และ [Plugin hooks](/th/plugins/hooks) สำหรับ Plugin ของเครื่องมือหรือ lifecycle hook
</Tip>

## แนวทางการ import

ให้ import จาก subpath ที่เฉพาะเจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

แต่ละ subpath เป็นโมดูลขนาดเล็กที่สมบูรณ์ในตัวเอง วิธีนี้ช่วยให้การเริ่มต้นทำได้รวดเร็วและ
ป้องกันปัญหา circular dependency สำหรับตัวช่วย entry/build เฉพาะช่องทาง
ให้เลือกใช้ `openclaw/plugin-sdk/channel-core`; เก็บ `openclaw/plugin-sdk/core` ไว้สำหรับ
พื้นผิวแบบครอบคลุมที่กว้างกว่าและตัวช่วยที่ใช้ร่วมกัน เช่น
`buildChannelConfigSchema`

สำหรับการกำหนดค่าช่องทาง ให้เผยแพร่ JSON Schema ที่ช่องทางเป็นเจ้าของผ่าน
`openclaw.plugin.json#channelConfigs` subpath `plugin-sdk/channel-config-schema`
มีไว้สำหรับ schema primitives ที่ใช้ร่วมกันและตัวสร้างทั่วไป Plugin ที่บันเดิลมากับ OpenClaw
ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ schema ของช่องทางที่บันเดิลซึ่งยังคงเก็บไว้
export สำหรับความเข้ากันได้ที่เลิกใช้แล้วจะยังคงอยู่ที่
`plugin-sdk/channel-config-schema-legacy`; ทั้งสอง subpath ของ schema ที่บันเดิลไม่ใช่
รูปแบบสำหรับ Plugin ใหม่

<Warning>
  อย่า import convenience seam ที่มีแบรนด์ provider หรือช่องทาง (เช่น
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)
  Plugin ที่บันเดิลจะประกอบ subpath SDK ทั่วไปไว้ภายใน barrel `api.ts` /
  `runtime-api.ts` ของตัวเอง; ผู้ใช้ core ควรใช้ barrel ภายใน Plugin เหล่านั้น
  หรือเพิ่มสัญญา SDK ทั่วไปแบบแคบเมื่อความจำเป็นนั้นเป็นแบบ
  ข้ามช่องทางจริง ๆ

มี seam ตัวช่วยของ bundled-plugin ชุดเล็ก ๆ ที่ยังคงปรากฏใน export map ที่สร้างขึ้น
เมื่อมีการติดตามการใช้งานของ owner อยู่ สิ่งเหล่านี้มีไว้สำหรับการบำรุงรักษา bundled-plugin
เท่านั้น และไม่ใช่พาธ import ที่แนะนำสำหรับ Plugin ของบุคคลที่สามใหม่

`openclaw/plugin-sdk/discord` และ `openclaw/plugin-sdk/telegram-account` ยังถูกเก็บไว้
เป็น facade สำหรับความเข้ากันได้ที่เลิกใช้แล้วสำหรับการใช้งานของ owner ที่ติดตามไว้ อย่า
คัดลอกพาธ import เหล่านั้นไปยัง Plugin ใหม่; ให้ใช้ runtime helper ที่ inject เข้ามาและ
subpath ของ channel SDK ทั่วไปแทน
</Warning>

## เอกสารอ้างอิง subpath

Plugin SDK ถูกเปิดเผยเป็นชุดของ subpath แบบแคบที่จัดกลุ่มตามพื้นที่ (entry ของ Plugin,
ช่องทาง, provider, auth, runtime, capability, memory และตัวช่วย bundled-plugin
ที่สงวนไว้) สำหรับแค็ตตาล็อกฉบับเต็มที่จัดกลุ่มและลิงก์ไว้ ดูที่
[Subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)

รายการ subpath กว่า 200 รายการที่สร้างขึ้นอยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`

## API การ register

callback `register(api)` จะได้รับออบเจ็กต์ `OpenClawPluginApi` พร้อมเมธอดเหล่านี้:

### การ register capability

| เมธอด                                           | สิ่งที่ register                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | การอนุมานข้อความ (LLM)                  |
| `api.registerAgentHarness(...)`                  | ตัวดำเนินการ agent ระดับต่ำแบบทดลอง |
| `api.registerCliBackend(...)`                    | backend การอนุมาน CLI ภายในเครื่อง           |
| `api.registerChannel(...)`                       | ช่องทางรับส่งข้อความ                     |
| `api.registerSpeechProvider(...)`                | Text-to-speech / การสังเคราะห์ STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | การถอดเสียงแบบเรียลไทม์ที่สตรีมอยู่      |
| `api.registerRealtimeVoiceProvider(...)`         | เซสชันเสียงเรียลไทม์แบบสองทาง        |
| `api.registerMediaUnderstandingProvider(...)`    | การวิเคราะห์รูปภาพ/เสียง/วิดีโอ            |
| `api.registerImageGenerationProvider(...)`       | การสร้างรูปภาพ                      |
| `api.registerMusicGenerationProvider(...)`       | การสร้างเพลง                      |
| `api.registerVideoGenerationProvider(...)`       | การสร้างวิดีโอ                      |
| `api.registerWebFetchProvider(...)`              | provider สำหรับดึงข้อมูลเว็บ / scrape           |
| `api.registerWebSearchProvider(...)`             | การค้นหาเว็บ                            |

### เครื่องมือและคำสั่ง

| เมธอด                          | สิ่งที่ register                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | เครื่องมือ agent (จำเป็นหรือ `{ optional: true }`) |
| `api.registerCommand(def)`      | คำสั่งกำหนดเอง (ข้าม LLM)             |

คำสั่งของ Plugin สามารถตั้งค่า `agentPromptGuidance` ได้เมื่อ agent ต้องการคำใบ้ routing สั้น ๆ
ที่คำสั่งเป็นเจ้าของ ให้ข้อความนั้นเกี่ยวกับตัวคำสั่งเอง; อย่าเพิ่ม
นโยบายเฉพาะ provider หรือ Plugin ลงใน core prompt builder

### โครงสร้างพื้นฐาน

| เมธอด                                         | สิ่งที่ register                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | event hook                              |
| `api.registerHttpRoute(params)`                | endpoint HTTP ของ Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | เมธอด RPC ของ Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | ตัวประกาศการค้นพบ Gateway ภายในเครื่อง      |
| `api.registerCli(registrar, opts?)`            | subcommand ของ CLI                          |
| `api.registerService(service)`                 | บริการเบื้องหลัง                      |
| `api.registerInteractiveHandler(registration)` | handler แบบโต้ตอบ                     |
| `api.registerAgentToolResultMiddleware(...)`   | middleware ผลลัพธ์เครื่องมือของ runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | ส่วน prompt เพิ่มเติมที่อยู่ติดกับ memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus สำหรับค้นหา/อ่าน memory เพิ่มเติม      |

### Host hooks สำหรับ Workflow Plugin

Host hook คือ seam ของ SDK สำหรับ Plugin ที่ต้องมีส่วนร่วมใน lifecycle ของ host
แทนที่จะเพิ่มเพียง provider, ช่องทาง หรือเครื่องมือ สัญญาเหล่านี้เป็นสัญญาทั่วไป;
Plan Mode สามารถใช้ได้ แต่ workflow การอนุมัติ, gate นโยบาย workspace,
monitor เบื้องหลัง, setup wizard และ UI companion
Plugin ก็ใช้ได้เช่นกัน

| เมธอด                                                                   | สัญญาที่เมธอดเป็นเจ้าของ                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | state ของเซสชันที่ Plugin เป็นเจ้าของและเข้ากันได้กับ JSON ซึ่งถูกฉายผ่านเซสชัน Gateway    |
| `api.enqueueNextTurnInjection(...)`                                      | context แบบทนทาน exactly-once ที่ inject เข้าสู่ agent turn ถัดไปสำหรับหนึ่งเซสชัน    |
| `api.registerTrustedToolPolicy(...)`                                     | นโยบายเครื่องมือ pre-plugin แบบบันเดิล/เชื่อถือได้ที่สามารถบล็อกหรือเขียน params ของเครื่องมือใหม่      |
| `api.registerToolMetadata(...)`                                          | metadata สำหรับแสดงแค็ตตาล็อกเครื่องมือโดยไม่เปลี่ยน implementation ของเครื่องมือ            |
| `api.registerCommand(...)`                                               | คำสั่ง Plugin แบบ scoped; ผลลัพธ์คำสั่งสามารถตั้งค่า `continueAgent: true`             |
| `api.registerControlUiDescriptor(...)`                                   | descriptor การมีส่วนร่วมของ Control UI สำหรับพื้นผิวเซสชัน เครื่องมือ run หรือ settings  |
| `api.registerRuntimeLifecycle(...)`                                      | callback cleanup สำหรับทรัพยากร runtime ที่ Plugin เป็นเจ้าของบนพาธ reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | subscription event ที่ sanitize แล้วสำหรับ state ของ workflow และ monitor                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | scratch state ต่อ run ของ Plugin ที่ถูกล้างเมื่อ run lifecycle สิ้นสุด                    |
| `api.registerSessionSchedulerJob(...)`                                   | ระเบียนงาน session scheduler ที่ Plugin เป็นเจ้าของพร้อม cleanup แบบ deterministic             |

สัญญาเหล่านี้จงใจแยกอำนาจ:

- Plugin ภายนอกสามารถเป็นเจ้าของ session extension, UI descriptor, คำสั่ง, metadata ของเครื่องมือ, next-turn injection และ hook ปกติได้
- Trusted tool policy จะทำงานก่อน hook `before_tool_call` ปกติ และเป็นแบบ bundled-only เพราะมีส่วนร่วมในนโยบายความปลอดภัยของ host
- ความเป็นเจ้าของคำสั่งที่สงวนไว้เป็นแบบ bundled-only Plugin ภายนอกควรใช้
  ชื่อคำสั่งหรือ alias ของตนเอง
- `allowPromptInjection=false` ปิดใช้งาน hook ที่แก้ไข prompt รวมถึง
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  ฟิลด์ prompt จาก `before_agent_start` แบบ legacy และ
  `enqueueNextTurnInjection`

ตัวอย่างของผู้ใช้ที่ไม่ใช่ Plan:

| รูปแบบ Plugin             | Hook ที่ใช้                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow การอนุมัติ            | Session extension, การดำเนินคำสั่งต่อ, next-turn injection, UI descriptor                                                            |
| Gate นโยบายงบประมาณ/workspace | Trusted tool policy, metadata ของเครื่องมือ, session projection                                                                                 |
| Monitor lifecycle เบื้องหลัง | Cleanup ของ runtime lifecycle, subscription event ของ agent, ความเป็นเจ้าของ/cleanup ของ session scheduler, heartbeat prompt contribution, UI descriptor |
| Setup หรือ onboarding wizard   | Session extension, คำสั่งแบบ scoped, descriptor ของ Control UI                                                                              |

<Note>
  namespace สำหรับผู้ดูแล core ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) จะยังคงเป็น `operator.admin` เสมอ แม้ว่า Plugin จะพยายามกำหนด
  scope ของเมธอด Gateway ที่แคบกว่า ให้ใช้ prefix เฉพาะ Plugin สำหรับ
  เมธอดที่ Plugin เป็นเจ้าของ
</Note>

<Accordion title="ควรใช้ middleware ผลลัพธ์เครื่องมือเมื่อใด">
  Plugin ที่บันเดิลสามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อ
  ต้องเขียนผลลัพธ์เครื่องมือใหม่หลังจากดำเนินการแล้วและก่อนที่ runtime
  จะป้อนผลลัพธ์นั้นกลับเข้าโมเดล นี่คือ seam ที่เชื่อถือได้และเป็นกลางต่อ runtime
  สำหรับตัวลดผลลัพธ์แบบ async เช่น tokenjuice

Plugin ที่บันเดิลต้องประกาศ `contracts.agentToolResultMiddleware` สำหรับ runtime
เป้าหมายแต่ละตัว เช่น `["pi", "codex"]` Plugin ภายนอก
ไม่สามารถ register middleware นี้ได้; ให้ใช้ hook ของ OpenClaw Plugin ปกติสำหรับงาน
ที่ไม่ต้องการ timing ของผลลัพธ์เครื่องมือก่อนเข้าโมเดล พาธการ register factory ของ
extension แบบฝังที่เคยมีเฉพาะ Pi ได้ถูกลบออกแล้ว
</Accordion>

### การ register การค้นพบ Gateway

`api.registerGatewayDiscoveryService(...)` ช่วยให้ Plugin ประกาศ Gateway ที่ใช้งานอยู่
บน transport การค้นพบภายในเครื่อง เช่น mDNS/Bonjour OpenClaw จะเรียก
บริการระหว่างการเริ่มต้น Gateway เมื่อเปิดใช้การค้นพบภายในเครื่อง ส่ง
พอร์ต Gateway ปัจจุบันและข้อมูลคำใบ้ TXT ที่ไม่ใช่ความลับ และเรียก handler
`stop` ที่ส่งคืนมาในระหว่างการปิด Gateway

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

Plugin สำหรับการค้นพบ Gateway ต้องไม่ถือว่าค่า TXT ที่ประกาศเป็นความลับหรือ
การยืนยันตัวตน การค้นพบเป็นคำใบ้สำหรับการกำหนดเส้นทางเท่านั้น; การยืนยันตัวตนของ Gateway และการปักหมุด TLS ยังคง
เป็นเจ้าของความเชื่อถือ

### เมตาดาต้าการลงทะเบียน CLI

`api.registerCli(registrar, opts?)` ยอมรับเมตาดาต้าระดับบนสุดสองชนิด:

- `commands`: รากคำสั่งแบบชัดเจนที่ registrar เป็นเจ้าของ
- `descriptors`: ตัวอธิบายคำสั่งขณะ parse ที่ใช้สำหรับความช่วยเหลือ CLI ราก,
  การกำหนดเส้นทาง, และการลงทะเบียน CLI ของ Plugin แบบ lazy

หากคุณต้องการให้คำสั่งของ Plugin ยังคงโหลดแบบ lazy ในเส้นทาง CLI รากปกติ
ให้ระบุ `descriptors` ที่ครอบคลุมรากคำสั่งระดับบนสุดทุกตัวที่ registrar นั้น
เปิดเผย

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

ใช้ `commands` เพียงอย่างเดียวเฉพาะเมื่อคุณไม่ต้องการการลงทะเบียน CLI รากแบบ lazy
เส้นทางความเข้ากันได้แบบ eager นั้นยังคงรองรับอยู่ แต่จะไม่ติดตั้ง
placeholder ที่มี descriptor รองรับสำหรับการโหลดแบบ lazy ขณะ parse

### การลงทะเบียนแบ็กเอนด์ CLI

`api.registerCliBackend(...)` ให้ Plugin เป็นเจ้าของ config เริ่มต้นสำหรับแบ็กเอนด์
AI CLI ในเครื่อง เช่น `codex-cli`

- `id` ของแบ็กเอนด์จะกลายเป็นคำนำหน้า provider ใน model ref เช่น `codex-cli/gpt-5`
- `config` ของแบ็กเอนด์ใช้รูปแบบเดียวกับ `agents.defaults.cliBackends.<id>`
- config ของผู้ใช้ยังคงมีสิทธิ์เหนือกว่า OpenClaw จะผสาน `agents.defaults.cliBackends.<id>` ทับ
  ค่าเริ่มต้นของ Plugin ก่อนเรียกใช้ CLI
- ใช้ `normalizeConfig` เมื่อแบ็กเอนด์ต้องการเขียนความเข้ากันได้ใหม่หลังการผสาน
  (เช่น การปรับรูปแบบ flag เก่าให้เป็นมาตรฐาน)

### ช่องเฉพาะ

| เมธอด                                     | สิ่งที่ลงทะเบียน                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | เอ็นจิน context (ใช้งานได้ครั้งละหนึ่งตัว) callback `assemble()` จะได้รับ `availableTools` และ `citationsMode` เพื่อให้เอ็นจินปรับแต่งส่วนเพิ่มเติมของ prompt ได้ |
| `api.registerMemoryCapability(capability)` | ความสามารถ memory แบบรวมศูนย์                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | ตัวสร้างส่วน memory prompt                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | ตัวแก้ไขแผน flush memory                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | อะแดปเตอร์ runtime ของ memory                                                                                                                                    |

### อะแดปเตอร์ embedding ของ memory

| เมธอด                                         | สิ่งที่ลงทะเบียน                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | อะแดปเตอร์ embedding ของ memory สำหรับ Plugin ที่ใช้งานอยู่ |

- `registerMemoryCapability` คือ API Plugin memory แบบเฉพาะที่แนะนำ
- `registerMemoryCapability` อาจเปิดเผย `publicArtifacts.listArtifacts(...)`
  ด้วย เพื่อให้ Plugin คู่ทำงานสามารถใช้ artifact ของ memory ที่ export ผ่าน
  `openclaw/plugin-sdk/memory-host-core` แทนการเข้าถึง layout ส่วนตัวของ
  Plugin memory เฉพาะตัวหนึ่ง
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, และ
  `registerMemoryRuntime` เป็น API Plugin memory แบบเฉพาะที่เข้ากันได้กับ legacy
- `MemoryFlushPlan.model` สามารถปักหมุดรอบ flush ไปยัง reference `provider/model`
  ที่เจาะจงได้ เช่น `ollama/qwen3:8b` โดยไม่สืบทอดสาย fallback ที่ใช้งานอยู่
- `registerMemoryEmbeddingProvider` ให้ Plugin memory ที่ใช้งานอยู่ลงทะเบียน
  id อะแดปเตอร์ embedding หนึ่งรายการหรือมากกว่า (เช่น `openai`, `gemini`, หรือ id แบบกำหนดเองที่
  Plugin กำหนด)
- config ของผู้ใช้ เช่น `agents.defaults.memorySearch.provider` และ
  `agents.defaults.memorySearch.fallback` จะ resolve กับ id อะแดปเตอร์ที่ลงทะเบียนเหล่านั้น

### Events และ lifecycle

| เมธอด                                       | สิ่งที่ทำ                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | hook lifecycle แบบมี type          |
| `api.onConversationBindingResolved(handler)` | callback การ resolve binding ของบทสนทนา |

ดู [Hook ของ Plugin](/th/plugins/hooks) สำหรับตัวอย่าง, ชื่อ hook ทั่วไป, และ semantics ของ guard

### Semantics การตัดสินใจของ hook

- `before_tool_call`: การคืนค่า `{ block: true }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: การคืนค่า `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนละ `block` ไว้) ไม่ใช่การ override
- `before_install`: การคืนค่า `{ block: true }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: การคืนค่า `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนละ `block` ไว้) ไม่ใช่การ override
- `reply_dispatch`: การคืนค่า `{ handled: true, ... }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใดอ้างสิทธิ์ dispatch แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าและเส้นทาง dispatch โมเดลเริ่มต้นจะถูกข้าม
- `message_sending`: การคืนค่า `{ cancel: true }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: การคืนค่า `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนละ `cancel` ไว้) ไม่ใช่การ override
- `message_received`: ใช้ฟิลด์ `threadId` แบบมี type เมื่อคุณต้องการกำหนดเส้นทาง thread/topic ขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเพิ่มเติมเฉพาะ channel
- `message_sending`: ใช้ฟิลด์กำหนดเส้นทาง `replyToId` / `threadId` แบบมี type ก่อน fallback ไปยัง `metadata` เฉพาะ channel
- `gateway_start`: ใช้ `ctx.config`, `ctx.workspaceDir`, และ `ctx.getCron?.()` สำหรับสถานะ startup ที่ Gateway เป็นเจ้าของ แทนการพึ่งพา hook ภายใน `gateway:startup`
- `cron_changed`: สังเกตการเปลี่ยนแปลง lifecycle ของ cron ที่ Gateway เป็นเจ้าของ ใช้ `event.job?.state?.nextRunAtMs` และ `ctx.getCron?.()` เมื่อซิงค์ตัวจัดกำหนดการปลุกภายนอก และให้ OpenClaw เป็นแหล่งความจริงสำหรับการตรวจสอบกำหนดเวลาและการดำเนินการ

### ฟิลด์ของอ็อบเจ็กต์ API

| ฟิลด์                    | Type                      | คำอธิบาย                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id ของ Plugin                                                                                   |
| `api.name`               | `string`                  | ชื่อที่แสดง                                                                                |
| `api.version`            | `string?`                 | เวอร์ชันของ Plugin (ไม่บังคับ)                                                                   |
| `api.description`        | `string?`                 | คำอธิบายของ Plugin (ไม่บังคับ)                                                               |
| `api.source`             | `string`                  | พาธ source ของ Plugin                                                                          |
| `api.rootDir`            | `string?`                 | ไดเรกทอรีรากของ Plugin (ไม่บังคับ)                                                            |
| `api.config`             | `OpenClawConfig`          | snapshot config ปัจจุบัน (snapshot runtime ใน memory ที่ใช้งานอยู่เมื่อมี)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | config เฉพาะ Plugin จาก `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [ตัวช่วย Runtime](/th/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | logger แบบ scoped (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดโหลดปัจจุบัน; `"setup-runtime"` คือหน้าต่าง startup/setup แบบเบาก่อนเข้า entry เต็ม |
| `api.resolvePath(input)` | `(string) => string`      | Resolve พาธที่สัมพันธ์กับราก Plugin                                                        |

## แบบแผนโมดูลภายใน

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ในเครื่องสำหรับ import ภายใน:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  อย่า import Plugin ของคุณเองผ่าน `openclaw/plugin-sdk/<your-plugin>`
  จากโค้ด production ให้กำหนดเส้นทาง import ภายในผ่าน `./api.ts` หรือ
  `./runtime-api.ts` พาธ SDK เป็น contract ภายนอกเท่านั้น
</Warning>

พื้นผิวสาธารณะของ bundled Plugin ที่โหลดผ่าน facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, และไฟล์ entry สาธารณะที่คล้ายกัน) จะเลือกใช้
snapshot config runtime ที่ใช้งานอยู่เมื่อ OpenClaw กำลังทำงานอยู่แล้ว หากยังไม่มี
snapshot runtime จะ fallback ไปยังไฟล์ config ที่ resolve แล้วบนดิสก์
facade ของ bundled Plugin แบบแพ็กเกจควรถูกโหลดผ่าน loader facade ของ Plugin
ของ OpenClaw; การ import โดยตรงจาก `dist/extensions/...` จะข้าม mirror dependency runtime แบบ staged
ที่การติดตั้งแบบแพ็กเกจใช้สำหรับ dependency ที่ Plugin เป็นเจ้าของ

Plugin provider สามารถเปิดเผย barrel contract แบบแคบภายใน Plugin ได้ เมื่อ
ตัวช่วยนั้นตั้งใจให้เฉพาะ provider และยังไม่เหมาะอยู่ใน subpath SDK ทั่วไป
ตัวอย่าง bundled:

- **Anthropic**: seam สาธารณะ `api.ts` / `contract-api.ts` สำหรับตัวช่วยสตรีม Claude
  beta-header และ `service_tier`
- **`@openclaw/openai-provider`**: `api.ts` export ตัวสร้าง provider,
  ตัวช่วย default-model, และตัวสร้าง provider แบบ realtime
- **`@openclaw/openrouter-provider`**: `api.ts` export ตัวสร้าง provider
  พร้อมตัวช่วย onboarding/config

<Warning>
  โค้ด production ของ extension ควรหลีกเลี่ยงการ import `openclaw/plugin-sdk/<other-plugin>`
  เช่นกัน หากตัวช่วยหนึ่งถูกแชร์จริง ให้ยกระดับไปยัง subpath SDK ที่เป็นกลาง
  เช่น `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, หรือพื้นผิว
  ที่มุ่งตาม capability อื่น แทนการผูก Plugin สองตัวเข้าด้วยกัน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/th/plugins/sdk-entrypoints">
    ตัวเลือก `definePluginEntry` และ `defineChannelPluginEntry`
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/th/plugins/sdk-runtime">
    ข้อมูลอ้างอิง namespace `api.runtime` แบบเต็ม
  </Card>
  <Card title="Setup and config" icon="sliders" href="/th/plugins/sdk-setup">
    การแพ็กเกจ, manifest, และ schema config
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
