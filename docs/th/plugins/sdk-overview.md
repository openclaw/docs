---
read_when:
    - คุณต้องทราบว่าจะนำเข้าจากเส้นทางย่อยใดของ SDK
    - คุณต้องการเอกสารอ้างอิงสำหรับเมธอดการลงทะเบียนทั้งหมดใน OpenClawPluginApi
    - คุณกำลังค้นหารายการส่งออกของ SDK ที่เฉพาะเจาะจง
sidebarTitle: Plugin SDK overview
summary: แมปการนำเข้า เอกสารอ้างอิง API สำหรับการลงทะเบียน และสถาปัตยกรรม SDK
title: ภาพรวม Plugin SDK
x-i18n:
    generated_at: "2026-05-07T13:24:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK คือสัญญาแบบ typed ระหว่าง Plugin กับแกนหลัก หน้านี้เป็น
เอกสารอ้างอิงสำหรับ **สิ่งที่ต้อง import** และ **สิ่งที่คุณสามารถ register ได้**

<Note>
  หน้านี้สำหรับผู้เขียน Plugin ที่ใช้ `openclaw/plugin-sdk/*` ภายใน
  OpenClaw สำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
  ที่ต้องการรัน agent ผ่าน Gateway ให้ใช้
  [OpenClaw App SDK](/th/concepts/openclaw-sdk) และแพ็กเกจ `@openclaw/sdk`
  แทน
</Note>

<Tip>
กำลังมองหาคู่มือวิธีทำอยู่ใช่ไหม เริ่มด้วย [การสร้าง Plugin](/th/plugins/building-plugins), ใช้ [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) สำหรับ Plugin ช่องทาง, [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) สำหรับ Plugin ผู้ให้บริการ, [Plugin แบ็กเอนด์ CLI](/th/plugins/cli-backend-plugins) สำหรับแบ็กเอนด์ AI CLI แบบโลคัล และ [hook ของ Plugin](/th/plugins/hooks) สำหรับ Plugin hook ของเครื่องมือหรือ lifecycle
</Tip>

## แบบแผนการ import

ให้ import จาก subpath ที่เจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

แต่ละ subpath เป็นโมดูลขนาดเล็กที่สมบูรณ์ในตัวเอง ซึ่งช่วยให้เริ่มต้นได้เร็วและ
ป้องกันปัญหา circular dependency สำหรับตัวช่วย entry/build เฉพาะช่องทาง
ควรใช้ `openclaw/plugin-sdk/channel-core`; เก็บ `openclaw/plugin-sdk/core` ไว้สำหรับ
พื้นผิวแบบ umbrella ที่กว้างกว่าและตัวช่วยร่วม เช่น
`buildChannelConfigSchema`

สำหรับ config ของช่องทาง ให้เผยแพร่ JSON Schema ที่ช่องทางเป็นเจ้าของผ่าน
`openclaw.plugin.json#channelConfigs` subpath `plugin-sdk/channel-config-schema`
มีไว้สำหรับ schema primitive ที่ใช้ร่วมกันและ builder ทั่วไป Plugin ที่ bundled มากับ OpenClaw
ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ schema ของช่องทางที่ bundled ซึ่งยังคงเก็บไว้
export สำหรับความเข้ากันได้ที่เลิกแนะนำแล้วยังคงอยู่ที่
`plugin-sdk/channel-config-schema-legacy`; subpath schema แบบ bundled ทั้งสองไม่ใช่
รูปแบบสำหรับ Plugin ใหม่

<Warning>
  อย่า import seam อำนวยความสะดวกที่ผูกแบรนด์ผู้ให้บริการหรือช่องทางไว้ (เช่น
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)
  Plugin ที่ bundled จะประกอบ subpath SDK ทั่วไปภายใน barrel `api.ts` /
  `runtime-api.ts` ของตนเอง; ผู้ใช้แกนหลักควรใช้ barrel เฉพาะ Plugin เหล่านั้น
  หรือเพิ่มสัญญา SDK ทั่วไปแบบแคบเมื่อความจำเป็นนั้นเป็นแบบ
  ข้ามช่องทางจริงๆ

seam ตัวช่วยของ Plugin แบบ bundled ชุดเล็กยังคงปรากฏใน export map ที่สร้างขึ้น
เมื่อมีการติดตามการใช้งานของเจ้าของ seam เหล่านี้มีไว้สำหรับการบำรุงรักษา
Plugin แบบ bundled เท่านั้น และไม่แนะนำให้ใช้เป็น import path สำหรับ
Plugin บุคคลที่สามใหม่

`openclaw/plugin-sdk/discord` และ `openclaw/plugin-sdk/telegram-account` ยัง
คงไว้เป็น facade เพื่อความเข้ากันได้ที่เลิกแนะนำแล้วสำหรับการใช้งานของเจ้าของที่ติดตามไว้ อย่า
คัดลอก import path เหล่านี้ลงใน Plugin ใหม่; ให้ใช้ตัวช่วย runtime ที่ฉีดเข้ามาและ
subpath SDK ช่องทางทั่วไปแทน
</Warning>

## เอกสารอ้างอิง subpath

Plugin SDK ถูกเปิดเผยเป็นชุด subpath แคบที่จัดกลุ่มตามพื้นที่ (entry ของ Plugin,
ช่องทาง, ผู้ให้บริการ, auth, runtime, capability, memory และตัวช่วย Plugin แบบ bundled ที่สงวนไว้)
สำหรับแค็ตตาล็อกฉบับเต็ม ซึ่งจัดกลุ่มและลิงก์ไว้แล้ว ดู
[subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)

รายการ subpath มากกว่า 200 รายการที่สร้างขึ้นอยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`

## API การ register

callback `register(api)` ได้รับอ็อบเจ็กต์ `OpenClawPluginApi` พร้อมเมธอดเหล่านี้:

### การ register capability

| เมธอด                                           | สิ่งที่ register                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | การอนุมานข้อความ (LLM)                  |
| `api.registerAgentHarness(...)`                  | executor agent ระดับต่ำแบบทดลอง |
| `api.registerCliBackend(...)`                    | แบ็กเอนด์การอนุมาน CLI แบบโลคัล           |
| `api.registerChannel(...)`                       | ช่องทางการส่งข้อความ                     |
| `api.registerSpeechProvider(...)`                | การสังเคราะห์ text-to-speech / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | การถอดเสียงแบบเรียลไทม์ชนิดสตรีม      |
| `api.registerRealtimeVoiceProvider(...)`         | เซสชันเสียงเรียลไทม์แบบ duplex        |
| `api.registerMediaUnderstandingProvider(...)`    | การวิเคราะห์รูปภาพ/เสียง/วิดีโอ            |
| `api.registerImageGenerationProvider(...)`       | การสร้างรูปภาพ                      |
| `api.registerMusicGenerationProvider(...)`       | การสร้างเพลง                      |
| `api.registerVideoGenerationProvider(...)`       | การสร้างวิดีโอ                      |
| `api.registerWebFetchProvider(...)`              | ผู้ให้บริการดึง/ scrape เว็บ           |
| `api.registerWebSearchProvider(...)`             | การค้นหาเว็บ                            |

### เครื่องมือและคำสั่ง

| เมธอด                          | สิ่งที่ register                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | เครื่องมือ agent (จำเป็นหรือ `{ optional: true }`) |
| `api.registerCommand(def)`      | คำสั่งกำหนดเอง (ข้าม LLM)             |

คำสั่งของ Plugin สามารถตั้งค่า `agentPromptGuidance` ได้เมื่อ agent ต้องการ hint การ routing
สั้นๆ ที่คำสั่งเป็นเจ้าของ ให้ข้อความนั้นเกี่ยวกับตัวคำสั่งเอง; อย่าเพิ่ม
นโยบายเฉพาะผู้ให้บริการหรือเฉพาะ Plugin ลงในตัวสร้าง prompt ของแกนหลัก

### โครงสร้างพื้นฐาน

| เมธอด                                         | สิ่งที่ register                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | event hook                              |
| `api.registerHttpRoute(params)`                | endpoint HTTP ของ Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | เมธอด RPC ของ Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | ตัวประกาศการค้นพบ Gateway แบบโลคัล      |
| `api.registerCli(registrar, opts?)`            | subcommand ของ CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI ฟีเจอร์ Node ภายใต้ `openclaw nodes` |
| `api.registerService(service)`                 | service เบื้องหลัง                      |
| `api.registerInteractiveHandler(registration)` | handler แบบโต้ตอบ                     |
| `api.registerAgentToolResultMiddleware(...)`   | middleware tool-result ของ runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | ส่วน prompt เสริมใกล้เคียง memory แบบเพิ่มเข้าไป |
| `api.registerMemoryCorpusSupplement(adapter)`  | คลัง search/read ของ memory แบบเพิ่มเข้าไป      |

### host hook สำหรับ Plugin workflow

host hook คือ seam ของ SDK สำหรับ Plugin ที่ต้องเข้าร่วมใน lifecycle ของ host
แทนที่จะเพิ่มเพียงผู้ให้บริการ ช่องทาง หรือเครื่องมือเท่านั้น เป็น
สัญญาทั่วไป; Plan Mode สามารถใช้ได้ แต่ workflow การอนุมัติ,
ประตู policy ของ workspace, monitor เบื้องหลัง, wizard การตั้งค่า และ Plugin คู่ UI
ก็ใช้ได้เช่นกัน

| เมธอด                                                                   | สัญญาที่เป็นเจ้าของ                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | state ของเซสชันที่ Plugin เป็นเจ้าของและเข้ากันได้กับ JSON ซึ่งฉายผ่านเซสชัน Gateway                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | context แบบคงทนและ exactly-once ที่ฉีดเข้า turn ถัดไปของ agent สำหรับหนึ่งเซสชัน                                                    |
| `api.registerTrustedToolPolicy(...)`                                     | policy เครื่องมือ pre-plugin แบบ bundled/trusted ที่สามารถ block หรือ rewrite params ของเครื่องมือ                                                      |
| `api.registerToolMetadata(...)`                                          | metadata การแสดงผลแค็ตตาล็อกเครื่องมือโดยไม่เปลี่ยน implementation ของเครื่องมือ                                                            |
| `api.registerCommand(...)`                                               | คำสั่ง Plugin แบบ scoped; ผลลัพธ์คำสั่งสามารถตั้งค่า `continueAgent: true`; คำสั่ง native ของ Discord รองรับ `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | descriptor การสนับสนุน Control UI สำหรับพื้นผิวเซสชัน เครื่องมือ run หรือ settings                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | callback cleanup สำหรับทรัพยากร runtime ที่ Plugin เป็นเจ้าของบนเส้นทาง reset/delete/reload                                                 |
| `api.registerAgentEventSubscription(...)`                                | subscription event ที่ sanitize แล้วสำหรับ state ของ workflow และ monitor                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | state scratch ของ Plugin ต่อ run ที่ล้างเมื่อ lifecycle ของ run สิ้นสุด                                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | ระเบียน job scheduler ของเซสชันที่ Plugin เป็นเจ้าของ พร้อม cleanup แบบกำหนดได้แน่นอน                                                             |

สัญญาเหล่านี้จงใจแยกอำนาจ:

- Plugin ภายนอกสามารถเป็นเจ้าของ session extension, UI descriptor, command, tool
  metadata, next-turn injection และ hook ปกติได้
- policy เครื่องมือที่ trusted จะรันก่อน hook `before_tool_call` ปกติ และเป็น
  bundled-only เพราะเข้าร่วมใน policy ด้านความปลอดภัยของ host
- ownership ของคำสั่งที่สงวนไว้เป็น bundled-only Plugin ภายนอกควรใช้
  ชื่อคำสั่งหรือ alias ของตนเอง
- `allowPromptInjection=false` ปิดใช้งาน hook ที่ mutate prompt รวมถึง
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  field prompt จาก `before_agent_start` แบบ legacy และ
  `enqueueNextTurnInjection`

ตัวอย่างผู้ใช้ที่ไม่ใช่ Plan:

| archetype ของ Plugin             | hook ที่ใช้                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| workflow การอนุมัติ            | session extension, command continuation, next-turn injection, UI descriptor                                                            |
| ประตู policy ด้านงบประมาณ/workspace | trusted tool policy, tool metadata, session projection                                                                                 |
| monitor lifecycle เบื้องหลัง | runtime lifecycle cleanup, agent event subscription, ownership/cleanup ของ session scheduler, heartbeat prompt contribution, UI descriptor |
| wizard การตั้งค่าหรือ onboarding   | session extension, scoped commands, Control UI descriptor                                                                              |

<Note>
  namespace admin ของแกนหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) จะยังคงเป็น `operator.admin` เสมอ แม้ว่า Plugin จะพยายามกำหนด
  scope เมธอด gateway ที่แคบกว่า ควรใช้ prefix เฉพาะ Plugin สำหรับ
  เมธอดที่ Plugin เป็นเจ้าของ
</Note>

<Accordion title="When to use tool-result middleware">
  Plugin แบบ bundled สามารถใช้ `api.registerAgentToolResultMiddleware(...)` ได้เมื่อ
  ต้อง rewrite ผลลัพธ์ของเครื่องมือหลังการดำเนินการและก่อนที่ runtime จะ
  ป้อนผลลัพธ์นั้นกลับเข้าโมเดล นี่คือ seam ที่ trusted และ runtime-neutral
  สำหรับ reducer เอาต์พุตแบบ async เช่น tokenjuice

Plugin ที่ bundled มาต้องประกาศ `contracts.agentToolResultMiddleware` สำหรับแต่ละ
runtime เป้าหมาย เช่น `["pi", "codex"]` Plugin ภายนอก
ไม่สามารถลงทะเบียน middleware นี้ได้ ให้ใช้ hook Plugin ของ OpenClaw ตามปกติสำหรับงาน
ที่ไม่ต้องใช้จังหวะเวลาในการจัดการผลลัพธ์เครื่องมือก่อนเข้าโมเดล เส้นทางการลงทะเบียน
extension factory แบบฝังตัวที่รองรับเฉพาะ Pi เดิมถูกนำออกแล้ว
</Accordion>

### การลงทะเบียนการค้นพบ Gateway

`api.registerGatewayDiscoveryService(...)` ช่วยให้ Plugin ประกาศ Gateway ที่กำลังใช้งาน
บนทรานสปอร์ตการค้นพบภายในเครื่อง เช่น mDNS/Bonjour ได้ OpenClaw จะเรียก
service นี้ระหว่างการเริ่มต้น Gateway เมื่อเปิดใช้การค้นพบภายในเครื่อง ส่งผ่าน
พอร์ต Gateway ปัจจุบันและข้อมูลคำใบ้ TXT ที่ไม่ใช่ความลับ แล้วเรียก handler
`stop` ที่ส่งกลับมาระหว่างการปิด Gateway

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

Plugin การค้นพบ Gateway ต้องไม่ถือว่าค่า TXT ที่ประกาศเป็นความลับหรือ
การยืนยันตัวตน การค้นพบเป็นคำใบ้สำหรับการกำหนดเส้นทางเท่านั้น การยืนยันตัวตนของ Gateway และการ pin TLS ยังคง
เป็นผู้กำหนดความน่าเชื่อถือ

### เมตาดาตาการลงทะเบียน CLI

`api.registerCli(registrar, opts?)` รับเมตาดาตาคำสั่งสองชนิด:

- `commands`: ชื่อคำสั่งแบบชัดเจนที่ registrar เป็นเจ้าของ
- `descriptors`: descriptor ของคำสั่งในช่วง parse ที่ใช้สำหรับวิธีใช้ CLI,
  การกำหนดเส้นทาง และการลงทะเบียน CLI ของ Plugin แบบ lazy
- `parentPath`: เส้นทางคำสั่งแม่ที่เป็นตัวเลือกสำหรับกลุ่มคำสั่งซ้อน เช่น
  `["nodes"]`

สำหรับฟีเจอร์ Node ที่จับคู่แล้ว ให้ใช้
`api.registerNodeCliFeature(registrar, opts?)` มากกว่า ฟังก์ชันนี้เป็น wrapper ขนาดเล็กของ
`api.registerCli(..., { parentPath: ["nodes"] })` และทำให้คำสั่งอย่าง
`openclaw nodes canvas` เป็นฟีเจอร์ Node ที่ Plugin เป็นเจ้าของอย่างชัดเจน

หากต้องการให้คำสั่ง Plugin โหลดแบบ lazy ในเส้นทาง CLI รากตามปกติ
ให้ระบุ `descriptors` ที่ครอบคลุมรากคำสั่งระดับบนสุดทุกคำสั่งที่
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

คำสั่งซ้อนจะได้รับคำสั่งแม่ที่ resolve แล้วเป็น `program`:

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

ใช้ `commands` เพียงอย่างเดียวเฉพาะเมื่อคุณไม่ต้องใช้การลงทะเบียน CLI รากแบบ lazy
เส้นทางความเข้ากันได้แบบ eager นั้นยังรองรับอยู่ แต่จะไม่ติดตั้ง
placeholder ที่มี descriptor รองรับสำหรับการโหลดแบบ lazy ในช่วง parse

### การลงทะเบียนแบ็กเอนด์ CLI

`api.registerCliBackend(...)` ช่วยให้ Plugin เป็นเจ้าของ config เริ่มต้นสำหรับแบ็กเอนด์
AI CLI ภายในเครื่อง เช่น `codex-cli`

- `id` ของแบ็กเอนด์จะกลายเป็น prefix ของ provider ในการอ้างอิงโมเดล เช่น `codex-cli/gpt-5`
- `config` ของแบ็กเอนด์ใช้รูปแบบเดียวกับ `agents.defaults.cliBackends.<id>`
- config ของผู้ใช้ยังคงมีสิทธิ์เหนือกว่า OpenClaw จะ merge `agents.defaults.cliBackends.<id>` ทับค่าเริ่มต้นของ
  Plugin ก่อนเรียกใช้ CLI
- ใช้ `normalizeConfig` เมื่อแบ็กเอนด์ต้องการ rewrite เพื่อความเข้ากันได้หลัง merge
  (เช่น การ normalize รูปแบบ flag เดิม)
- ใช้ `resolveExecutionArgs` สำหรับการ rewrite argv ตามขอบเขตคำขอที่เป็นของ
  dialect ของ CLI เช่น การแมประดับการคิดของ OpenClaw ไปยัง flag effort แบบ native

สำหรับคู่มือการเขียนแบบครบวงจร ดูที่
[Plugin แบ็กเอนด์ CLI](/th/plugins/cli-backend-plugins)

### slot แบบ exclusive

| เมธอด                                     | สิ่งที่ลงทะเบียน                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | context engine (ใช้งานได้ครั้งละหนึ่งตัว) callback `assemble()` ได้รับ `availableTools` และ `citationsMode` เพื่อให้ engine ปรับแต่งการเพิ่ม prompt ได้ |
| `api.registerMemoryCapability(capability)` | ความสามารถ memory แบบรวม                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | builder สำหรับส่วน prompt ของ memory                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | resolver สำหรับแผน flush memory                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | adapter runtime ของ memory                                                                                                                                    |

### adapter embedding ของ memory

| เมธอด                                         | สิ่งที่ลงทะเบียน                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter embedding ของ memory สำหรับ Plugin ที่ใช้งานอยู่ |

- `registerMemoryCapability` คือ API Plugin memory แบบ exclusive ที่แนะนำ
- `registerMemoryCapability` อาจเปิดเผย `publicArtifacts.listArtifacts(...)` ด้วย
  เพื่อให้ Plugin คู่ขนานสามารถใช้ artifact ของ memory ที่ export แล้วผ่าน
  `openclaw/plugin-sdk/memory-host-core` แทนการเข้าถึง layout ส่วนตัวของ
  Plugin memory เฉพาะตัว
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` และ
  `registerMemoryRuntime` เป็น API Plugin memory แบบ exclusive ที่เข้ากันได้กับ legacy
- `MemoryFlushPlan.model` สามารถ pin turn การ flush ไปยังการอ้างอิง `provider/model`
  ที่แน่นอน เช่น `ollama/qwen3:8b` โดยไม่สืบทอด fallback chain ที่ใช้งานอยู่
- `registerMemoryEmbeddingProvider` ช่วยให้ Plugin memory ที่ใช้งานอยู่ลงทะเบียน
  id ของ adapter embedding ได้หนึ่งรายการขึ้นไป (เช่น `openai`, `gemini` หรือ id ที่
  Plugin กำหนดเอง)
- config ของผู้ใช้ เช่น `agents.defaults.memorySearch.provider` และ
  `agents.defaults.memorySearch.fallback` จะ resolve กับ id ของ adapter ที่ลงทะเบียนไว้เหล่านั้น

### event และ lifecycle

| เมธอด                                       | สิ่งที่ทำ                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | hook lifecycle แบบ typed          |
| `api.onConversationBindingResolved(handler)` | callback การ resolve การผูก conversation |

ดู [hook ของ Plugin](/th/plugins/hooks) สำหรับตัวอย่าง ชื่อ hook ที่ใช้บ่อย และ
semantics ของ guard

### semantics การตัดสินใจของ hook

- `before_tool_call`: การส่งกลับ `{ block: true }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: การส่งกลับ `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนละ `block` ไว้) ไม่ใช่การ override
- `before_install`: การส่งกลับ `{ block: true }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_install`: การส่งกลับ `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนละ `block` ไว้) ไม่ใช่การ override
- `reply_dispatch`: การส่งกลับ `{ handled: true, ... }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใด claim dispatch แล้ว handler ที่มี priority ต่ำกว่าและเส้นทาง dispatch โมเดลเริ่มต้นจะถูกข้าม
- `message_sending`: การส่งกลับ `{ cancel: true }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `message_sending`: การส่งกลับ `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนละ `cancel` ไว้) ไม่ใช่การ override
- `message_received`: ใช้ field `threadId` แบบ typed เมื่อคุณต้องกำหนดเส้นทาง thread/topic ขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเพิ่มเติมเฉพาะ channel
- `message_sending`: ใช้ field การกำหนดเส้นทาง `replyToId` / `threadId` แบบ typed ก่อน fallback ไปยัง `metadata` เฉพาะ channel
- `gateway_start`: ใช้ `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับสถานะ startup ที่ Gateway เป็นเจ้าของ แทนการพึ่งพา hook ภายใน `gateway:startup`
- `cron_changed`: สังเกตการเปลี่ยนแปลง lifecycle ของ Cron ที่ Gateway เป็นเจ้าของ ใช้ `event.job?.state?.nextRunAtMs` และ `ctx.getCron?.()` เมื่อ sync scheduler ปลุกภายนอก และให้ OpenClaw เป็นแหล่งข้อมูลจริงสำหรับการตรวจสอบและการเรียกใช้งานเมื่อถึงกำหนด

### field ของออบเจ็กต์ API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id ของ Plugin                                                                                   |
| `api.name`               | `string`                  | ชื่อที่แสดง                                                                                |
| `api.version`            | `string?`                 | เวอร์ชัน Plugin (ไม่บังคับ)                                                                   |
| `api.description`        | `string?`                 | คำอธิบาย Plugin (ไม่บังคับ)                                                               |
| `api.source`             | `string`                  | เส้นทาง source ของ Plugin                                                                          |
| `api.rootDir`            | `string?`                 | ไดเรกทอรีรากของ Plugin (ไม่บังคับ)                                                            |
| `api.config`             | `OpenClawConfig`          | snapshot config ปัจจุบัน (snapshot runtime ในหน่วยความจำที่ใช้งานอยู่เมื่อมี)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | config เฉพาะ Plugin จาก `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [helper runtime](/th/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | logger ตามขอบเขต (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดโหลดปัจจุบัน; `"setup-runtime"` คือช่วง startup/setup แบบเบาก่อนเข้า entry เต็ม |
| `api.resolvePath(input)` | `(string) => string`      | resolve เส้นทางแบบสัมพันธ์กับรากของ Plugin                                                        |

## แบบแผนโมดูลภายใน

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่องสำหรับ import ภายใน:

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

surface สาธารณะของ Plugin ที่ bundled และโหลดผ่าน facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` และไฟล์ entry สาธารณะลักษณะคล้ายกัน) จะเลือกใช้
snapshot config runtime ที่ใช้งานอยู่เมื่อ OpenClaw กำลังทำงานอยู่ หากยังไม่มี
snapshot runtime จะ fallback ไปยังไฟล์ config ที่ resolve แล้วบนดิสก์
facade ของ Plugin ที่ bundled แบบ packaged ควรถูกโหลดผ่าน loader facade ของ Plugin
ของ OpenClaw; การ import โดยตรงจาก `dist/extensions/...` จะข้าม manifest
และการตรวจ sidecar ของ runtime ที่ install แบบ packaged ใช้สำหรับโค้ดที่ Plugin เป็นเจ้าของ

Plugin ผู้ให้บริการสามารถเปิดเผย barrel ของสัญญาแบบแคบภายใน Plugin ได้ เมื่อ
ตัวช่วยนั้นตั้งใจให้เฉพาะเจาะจงกับผู้ให้บริการและยังไม่ควรอยู่ในพาธย่อย SDK
แบบทั่วไป ตัวอย่างที่มาพร้อมชุด:

- **Anthropic**: รอยต่อสาธารณะ `api.ts` / `contract-api.ts` สำหรับตัวช่วยสตรีม
  beta-header ของ Claude และ `service_tier`
- **`@openclaw/openai-provider`**: `api.ts` ส่งออกตัวสร้างผู้ให้บริการ,
  ตัวช่วยโมเดลเริ่มต้น และตัวสร้างผู้ให้บริการแบบเรียลไทม์
- **`@openclaw/openrouter-provider`**: `api.ts` ส่งออกตัวสร้างผู้ให้บริการ
  พร้อมตัวช่วย onboarding/config

<Warning>
  โค้ด production ของ Extension ควรหลีกเลี่ยงการ import
  `openclaw/plugin-sdk/<other-plugin>` ด้วย หากตัวช่วยใช้ร่วมกันจริง ให้ยกระดับไปยังพาธย่อย SDK
  ที่เป็นกลาง เช่น `openclaw/plugin-sdk/speech`, `.../provider-model-shared` หรือพื้นผิวอื่น
  ที่มุ่งเน้นความสามารถ แทนการผูก Plugin สองตัวเข้าด้วยกัน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/th/plugins/sdk-entrypoints">
    ตัวเลือก `definePluginEntry` และ `defineChannelPluginEntry`
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/th/plugins/sdk-runtime">
    เอกสารอ้างอิง namespace `api.runtime` ฉบับเต็ม
  </Card>
  <Card title="Setup and config" icon="sliders" href="/th/plugins/sdk-setup">
    การจัดแพ็กเกจ, manifest และ schema ของ config
  </Card>
  <Card title="Testing" icon="vial" href="/th/plugins/sdk-testing">
    ยูทิลิตีทดสอบและกฎ lint
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/th/plugins/sdk-migration">
    การย้ายจากพื้นผิวที่เลิกใช้แล้ว
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/th/plugins/architecture">
    สถาปัตยกรรมเชิงลึกและโมเดลความสามารถ
  </Card>
</CardGroup>
