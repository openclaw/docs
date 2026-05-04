---
read_when:
    - คุณต้องทราบว่าจะนำเข้าจากพาธย่อยใดของ SDK
    - คุณต้องการเอกสารอ้างอิงสำหรับเมธอดการลงทะเบียนทั้งหมดบน OpenClawPluginApi
    - คุณกำลังค้นหาการส่งออกของ SDK ที่เฉพาะเจาะจง
sidebarTitle: Plugin SDK overview
summary: แผนผังการนำเข้า เอกสารอ้างอิง API สำหรับการลงทะเบียน และสถาปัตยกรรม SDK
title: ภาพรวม Plugin SDK
x-i18n:
    generated_at: "2026-05-04T18:24:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK คือสัญญาแบบมีชนิดข้อมูลระหว่าง Plugin กับแกนหลัก หน้านี้เป็น
ข้อมูลอ้างอิงสำหรับ **สิ่งที่ต้อง import** และ **สิ่งที่คุณสามารถลงทะเบียนได้**

<Note>
  หน้านี้สำหรับผู้เขียน Plugin ที่ใช้ `openclaw/plugin-sdk/*` ภายใน
  OpenClaw สำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
  ที่ต้องการเรียกใช้เอเจนต์ผ่าน Gateway ให้ใช้
  [OpenClaw App SDK](/th/concepts/openclaw-sdk) และแพ็กเกจ `@openclaw/sdk`
  แทน
</Note>

<Tip>
กำลังมองหาคู่มือวิธีทำอยู่หรือไม่ เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins), ใช้ [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) สำหรับ Plugin ช่องทาง, [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) สำหรับ Plugin ผู้ให้บริการ และ [Hook ของ Plugin](/th/plugins/hooks) สำหรับ Plugin hook เครื่องมือหรือวงจรชีวิต
</Tip>

## รูปแบบการ import

ให้ import จาก subpath ที่เฉพาะเจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

แต่ละ subpath เป็นโมดูลขนาดเล็กที่ครบถ้วนในตัวเอง สิ่งนี้ช่วยให้การเริ่มต้นทำงานเร็ว
และป้องกันปัญหา dependency แบบวนกลับ สำหรับตัวช่วย entry/build เฉพาะช่องทาง
ให้เลือกใช้ `openclaw/plugin-sdk/channel-core`; เก็บ `openclaw/plugin-sdk/core` ไว้สำหรับ
พื้นผิวครอบคลุมที่กว้างกว่าและตัวช่วยร่วม เช่น
`buildChannelConfigSchema`

สำหรับการกำหนดค่าช่องทาง ให้เผยแพร่ JSON Schema ที่ช่องทางเป็นเจ้าของผ่าน
`openclaw.plugin.json#channelConfigs` subpath `plugin-sdk/channel-config-schema`
มีไว้สำหรับ primitive ของ schema ร่วมและตัวสร้างทั่วไป Plugin ที่มาพร้อมกับ OpenClaw
ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ schema ของช่องทางที่มาพร้อมกันซึ่งยังคงเก็บไว้
export ความเข้ากันได้ที่เลิกแนะนำแล้วยังคงอยู่บน
`plugin-sdk/channel-config-schema-legacy`; subpath ของ schema ที่มาพร้อมกันทั้งสองแบบไม่ใช่
รูปแบบสำหรับ Plugin ใหม่

<Warning>
  อย่า import seam อำนวยความสะดวกที่มีแบรนด์ผู้ให้บริการหรือช่องทาง (เช่น
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)
  Plugin ที่มาพร้อมกันประกอบ subpath SDK ทั่วไปภายใน barrel `api.ts` /
  `runtime-api.ts` ของตัวเอง; ผู้ใช้แกนหลักควรใช้ barrel เฉพาะ Plugin เหล่านั้น
  หรือเพิ่มสัญญา SDK ทั่วไปแบบแคบเมื่อความจำเป็นนั้นเป็นแบบ
  ข้ามช่องทางจริง ๆ

seam ตัวช่วยของ Plugin ที่มาพร้อมกันชุดเล็ก ๆ ยังคงปรากฏใน export map ที่สร้างขึ้น
เมื่อมีการติดตามการใช้งานโดยเจ้าของ สิ่งเหล่านี้มีไว้สำหรับการบำรุงรักษา Plugin
ที่มาพร้อมกันเท่านั้น และไม่ใช่เส้นทาง import ที่แนะนำสำหรับ Plugin บุคคลที่สามใหม่

`openclaw/plugin-sdk/discord` และ `openclaw/plugin-sdk/telegram-account` ยัง
คงไว้เป็น facade ความเข้ากันได้ที่เลิกแนะนำแล้วสำหรับการใช้งานโดยเจ้าของที่ติดตามไว้ อย่า
คัดลอกเส้นทาง import เหล่านั้นไปยัง Plugin ใหม่; ให้ใช้ตัวช่วย runtime ที่ฉีดเข้ามาและ
subpath SDK ช่องทางทั่วไปแทน
</Warning>

## ข้อมูลอ้างอิง subpath

Plugin SDK ถูกเปิดเผยเป็นชุดของ subpath แบบแคบที่จัดกลุ่มตามพื้นที่ (entry ของ Plugin,
ช่องทาง, ผู้ให้บริการ, auth, runtime, capability, memory และตัวช่วยของ Plugin
ที่มาพร้อมกันซึ่งสงวนไว้) สำหรับแค็ตตาล็อกทั้งหมดที่จัดกลุ่มและเชื่อมโยงไว้ โปรดดู
[subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)

รายการ subpath กว่า 200 รายการที่สร้างขึ้นอยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`

## API การลงทะเบียน

callback `register(api)` ได้รับออบเจ็กต์ `OpenClawPluginApi` ที่มี
เมธอดเหล่านี้:

### การลงทะเบียน capability

| เมธอด                                           | สิ่งที่ลงทะเบียน                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | การอนุมานข้อความ (LLM)                  |
| `api.registerAgentHarness(...)`                  | ตัวเรียกใช้งานเอเจนต์ระดับต่ำแบบทดลอง |
| `api.registerCliBackend(...)`                    | backend การอนุมาน CLI ภายในเครื่อง           |
| `api.registerChannel(...)`                       | ช่องทางการรับส่งข้อความ                     |
| `api.registerSpeechProvider(...)`                | การสังเคราะห์ text-to-speech / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | การถอดเสียงแบบเรียลไทม์แบบสตรีม      |
| `api.registerRealtimeVoiceProvider(...)`         | เซสชันเสียงแบบเรียลไทม์สองทาง        |
| `api.registerMediaUnderstandingProvider(...)`    | การวิเคราะห์รูปภาพ/เสียง/วิดีโอ            |
| `api.registerImageGenerationProvider(...)`       | การสร้างรูปภาพ                      |
| `api.registerMusicGenerationProvider(...)`       | การสร้างเพลง                      |
| `api.registerVideoGenerationProvider(...)`       | การสร้างวิดีโอ                      |
| `api.registerWebFetchProvider(...)`              | ผู้ให้บริการดึงเว็บ / scrape           |
| `api.registerWebSearchProvider(...)`             | การค้นหาเว็บ                            |

### เครื่องมือและคำสั่ง

| เมธอด                          | สิ่งที่ลงทะเบียน                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | เครื่องมือเอเจนต์ (จำเป็นหรือ `{ optional: true }`) |
| `api.registerCommand(def)`      | คำสั่งกำหนดเอง (ข้าม LLM)             |

คำสั่งของ Plugin สามารถตั้งค่า `agentPromptGuidance` เมื่อเอเจนต์ต้องการ
คำใบ้การกำหนดเส้นทางสั้น ๆ ที่คำสั่งเป็นเจ้าของ เก็บข้อความนั้นให้เกี่ยวกับตัวคำสั่งเอง;
อย่าเพิ่มนโยบายเฉพาะผู้ให้บริการหรือเฉพาะ Plugin ไปยังตัวสร้าง prompt ของแกนหลัก

### โครงสร้างพื้นฐาน

| เมธอด                                         | สิ่งที่ลงทะเบียน                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | hook เหตุการณ์                              |
| `api.registerHttpRoute(params)`                | endpoint HTTP ของ Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | เมธอด RPC ของ Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | ตัวประกาศการค้นพบ Gateway ภายในเครื่อง      |
| `api.registerCli(registrar, opts?)`            | คำสั่งย่อย CLI                          |
| `api.registerService(service)`                 | บริการเบื้องหลัง                      |
| `api.registerInteractiveHandler(registration)` | handler แบบโต้ตอบ                     |
| `api.registerAgentToolResultMiddleware(...)`   | middleware ผลลัพธ์เครื่องมือ runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | ส่วน prompt เพิ่มเติมที่อยู่ใกล้ memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus ค้นหา/อ่าน memory เพิ่มเติม      |

### Host hook สำหรับ Plugin workflow

Host hook คือ seam ของ SDK สำหรับ Plugin ที่ต้องเข้าร่วมในวงจรชีวิตของโฮสต์
แทนที่จะเพิ่มเพียงผู้ให้บริการ ช่องทาง หรือเครื่องมือเท่านั้น สิ่งเหล่านี้เป็น
สัญญาทั่วไป; Plan Mode สามารถใช้ได้ แต่ workflow การอนุมัติ
gate นโยบาย workspace, ตัวตรวจสอบเบื้องหลัง, wizard ตั้งค่า และ Plugin เสริม UI
ก็ใช้ได้เช่นกัน

| เมธอด                                                                   | สัญญาที่เป็นเจ้าของ                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | สถานะเซสชันที่ Plugin เป็นเจ้าของและเข้ากันได้กับ JSON ซึ่งฉายผ่านเซสชัน Gateway                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | บริบทที่คงทนแบบ exactly-once ซึ่งฉีดเข้าไปใน turn ถัดไปของเอเจนต์สำหรับหนึ่งเซสชัน                                                    |
| `api.registerTrustedToolPolicy(...)`                                     | นโยบายเครื่องมือ pre-plugin ที่มาพร้อมกัน/เชื่อถือได้ ซึ่งสามารถบล็อกหรือเขียน params ของเครื่องมือใหม่                                                      |
| `api.registerToolMetadata(...)`                                          | metadata การแสดงผลแค็ตตาล็อกเครื่องมือโดยไม่เปลี่ยน implementation ของเครื่องมือ                                                            |
| `api.registerCommand(...)`                                               | คำสั่ง Plugin แบบกำหนดขอบเขต; ผลลัพธ์คำสั่งสามารถตั้งค่า `continueAgent: true`; คำสั่ง native ของ Discord รองรับ `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | descriptor การมีส่วนร่วมของ Control UI สำหรับพื้นผิวเซสชัน เครื่องมือ การเรียกใช้ หรือการตั้งค่า                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | callback ทำความสะอาดสำหรับทรัพยากร runtime ที่ Plugin เป็นเจ้าของบนเส้นทาง reset/delete/reload                                                 |
| `api.registerAgentEventSubscription(...)`                                | การสมัครรับเหตุการณ์ที่ทำให้ปลอดภัยแล้วสำหรับสถานะ workflow และตัวตรวจสอบ                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | สถานะ scratch ของ Plugin ต่อการรัน ซึ่งถูกล้างเมื่อวงจรชีวิตการรันสิ้นสุด                                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | ระเบียนงานตัวจัดกำหนดการเซสชันที่ Plugin เป็นเจ้าของ พร้อมการทำความสะอาดแบบกำหนดได้แน่นอน                                                             |

สัญญาเหล่านี้ตั้งใจแยกอำนาจ:

- Plugin ภายนอกสามารถเป็นเจ้าของส่วนขยายเซสชัน, descriptor UI, คำสั่ง, metadata เครื่องมือ,
  การฉีด turn ถัดไป และ hook ปกติ
- นโยบายเครื่องมือที่เชื่อถือได้รันก่อน hook `before_tool_call` ทั่วไป และเป็นแบบ
  ที่มาพร้อมกันเท่านั้น เพราะมีส่วนร่วมในนโยบายความปลอดภัยของโฮสต์
- ความเป็นเจ้าของคำสั่งที่สงวนไว้เป็นแบบที่มาพร้อมกันเท่านั้น Plugin ภายนอกควรใช้
  ชื่อคำสั่งหรือ alias ของตัวเอง
- `allowPromptInjection=false` ปิดใช้งาน hook ที่แก้ไข prompt รวมถึง
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  ช่อง prompt จาก `before_agent_start` แบบเดิม และ
  `enqueueNextTurnInjection`

ตัวอย่างผู้ใช้ที่ไม่ใช่ Plan:

| รูปแบบ Plugin                 | Hook ที่ใช้                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| workflow การอนุมัติ            | ส่วนขยายเซสชัน, การต่อเนื่องของคำสั่ง, การฉีด turn ถัดไป, descriptor UI                                                            |
| gate นโยบายงบประมาณ/workspace | นโยบายเครื่องมือที่เชื่อถือได้, metadata เครื่องมือ, การฉายเซสชัน                                                                                 |
| ตัวตรวจสอบวงจรชีวิตเบื้องหลัง | การทำความสะอาดวงจรชีวิต runtime, การสมัครรับเหตุการณ์เอเจนต์, ความเป็นเจ้าของ/การทำความสะอาดตัวจัดกำหนดการเซสชัน, การมีส่วนร่วมกับ prompt Heartbeat, descriptor UI |
| wizard ตั้งค่าหรือ onboarding   | ส่วนขยายเซสชัน, คำสั่งแบบกำหนดขอบเขต, descriptor Control UI                                                                              |

<Note>
  namespace ผู้ดูแลแกนหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) จะคงเป็น `operator.admin` เสมอ แม้ว่า Plugin จะพยายามกำหนด
  ขอบเขตเมธอด gateway ที่แคบกว่า ให้เลือกใช้ prefix เฉพาะ Plugin สำหรับ
  เมธอดที่ Plugin เป็นเจ้าของ
</Note>

<Accordion title="เมื่อใดควรใช้ middleware ผลลัพธ์เครื่องมือ">
  Plugin ที่มาพร้อมกันสามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อ
  จำเป็นต้องเขียนผลลัพธ์เครื่องมือใหม่หลังการดำเนินการและก่อนที่ runtime
  จะป้อนผลลัพธ์นั้นกลับเข้าไปในโมเดล นี่คือ seam ที่เป็นกลางต่อ runtime และเชื่อถือได้
  สำหรับตัวลด output แบบ async เช่น tokenjuice

Plugin ที่มาพร้อมกันต้องประกาศ `contracts.agentToolResultMiddleware` สำหรับแต่ละ
runtime เป้าหมาย เช่น `["pi", "codex"]` Plugin ภายนอก
ไม่สามารถลงทะเบียน middleware นี้ได้; ให้ใช้ hook Plugin ของ OpenClaw ตามปกติสำหรับงาน
ที่ไม่ต้องการจังหวะผลลัพธ์เครื่องมือก่อนเข้าโมเดล เส้นทางการลงทะเบียน factory ของ extension
แบบฝังเฉพาะ Pi เดิมถูกนำออกแล้ว
</Accordion>

### การลงทะเบียนการค้นพบ Gateway

`api.registerGatewayDiscoveryService(...)` ช่วยให้ Plugin โฆษณา Gateway ที่ใช้งานอยู่บนทรานสปอร์ตการค้นหาในเครื่อง เช่น mDNS/Bonjour ได้ OpenClaw จะเรียกใช้บริการนี้ระหว่างการเริ่มต้น Gateway เมื่อเปิดใช้การค้นหาในเครื่อง ส่งพอร์ต Gateway ปัจจุบันและข้อมูลคำใบ้ TXT ที่ไม่ใช่ความลับให้ และเรียกตัวจัดการ `stop` ที่ส่งกลับมาระหว่างการปิด Gateway

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

Plugin สำหรับการค้นหา Gateway ต้องไม่ถือว่าค่า TXT ที่โฆษณาเป็นความลับหรือการยืนยันตัวตน การค้นหาเป็นคำใบ้สำหรับการกำหนดเส้นทางเท่านั้น ส่วนความเชื่อถือยังเป็นหน้าที่ของการยืนยันตัวตนของ Gateway และการตรึง TLS

### เมตาดาทาการลงทะเบียน CLI

`api.registerCli(registrar, opts?)` รับเมตาดาทาระดับบนสุดสองชนิด:

- `commands`: รากคำสั่งแบบชัดเจนที่เป็นของ registrar
- `descriptors`: descriptor คำสั่งขณะ parse ที่ใช้สำหรับความช่วยเหลือของ CLI ราก การกำหนดเส้นทาง และการลงทะเบียน CLI ของ Plugin แบบ lazy

หากคุณต้องการให้คำสั่งของ Plugin ยังคงโหลดแบบ lazy ในเส้นทาง CLI รากตามปกติ ให้ระบุ `descriptors` ที่ครอบคลุมรากคำสั่งระดับบนสุดทุกตัวที่ registrar นั้นเปิดเผย

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

ใช้ `commands` อย่างเดียวเฉพาะเมื่อคุณไม่ต้องการการลงทะเบียน CLI รากแบบ lazy เส้นทางความเข้ากันได้แบบ eager นั้นยังรองรับอยู่ แต่จะไม่ติดตั้ง placeholder ที่มี descriptor รองรับสำหรับการโหลดแบบ lazy ขณะ parse

### การลงทะเบียนแบ็กเอนด์ CLI

`api.registerCliBackend(...)` ช่วยให้ Plugin เป็นเจ้าของ config เริ่มต้นสำหรับแบ็กเอนด์ AI CLI ในเครื่อง เช่น `codex-cli`

- `id` ของแบ็กเอนด์จะกลายเป็นคำนำหน้า provider ในการอ้างอิงโมเดล เช่น `codex-cli/gpt-5`
- `config` ของแบ็กเอนด์ใช้รูปทรงเดียวกับ `agents.defaults.cliBackends.<id>`
- config ของผู้ใช้ยังมีสิทธิ์เหนือกว่า OpenClaw จะ merge `agents.defaults.cliBackends.<id>` ทับค่าเริ่มต้นของ Plugin ก่อนเรียกใช้ CLI
- ใช้ `normalizeConfig` เมื่อแบ็กเอนด์ต้องเขียนซ้ำเพื่อความเข้ากันได้หลัง merge แล้ว เช่น การทำให้รูปทรง flag เก่าเป็นรูปแบบปกติ
- ใช้ `resolveExecutionArgs` สำหรับการเขียน argv ใหม่ตามคำขอที่เป็นของ dialect ของ CLI เช่น การแมประดับ thinking ของ OpenClaw ไปเป็น flag effort แบบ native

### สล็อตเฉพาะ

| เมธอด                                     | สิ่งที่ลงทะเบียน                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (ใช้งานได้ครั้งละหนึ่งรายการ) callback `assemble()` จะได้รับ `availableTools` และ `citationsMode` เพื่อให้ engine ปรับแต่งส่วนเพิ่มของ prompt ได้ |
| `api.registerMemoryCapability(capability)` | ความสามารถ memory แบบรวมศูนย์                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | ตัวสร้างส่วน prompt ของ memory                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | resolver แผน flush ของ memory                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | adapter runtime ของ memory                                                                                                                                    |

### Adapter embedding ของ memory

| เมธอด                                         | สิ่งที่ลงทะเบียน                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter embedding ของ memory สำหรับ Plugin ที่ใช้งานอยู่ |

- `registerMemoryCapability` คือ API Plugin memory แบบเฉพาะที่แนะนำ
- `registerMemoryCapability` อาจเปิดเผย `publicArtifacts.listArtifacts(...)` ด้วย เพื่อให้ Plugin คู่ข้างเคียงใช้ artifact memory ที่ export แล้วผ่าน `openclaw/plugin-sdk/memory-host-core` แทนการเข้าถึง layout ส่วนตัวของ Plugin memory เฉพาะตัว
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` และ `registerMemoryRuntime` คือ API Plugin memory แบบเฉพาะที่รองรับความเข้ากันได้กับแบบเดิม
- `MemoryFlushPlan.model` สามารถตรึงรอบ flush ไปยังการอ้างอิง `provider/model` ที่แน่นอนได้ เช่น `ollama/qwen3:8b` โดยไม่สืบทอด fallback chain ที่ใช้งานอยู่
- `registerMemoryEmbeddingProvider` ช่วยให้ Plugin memory ที่ใช้งานอยู่ลงทะเบียน id ของ adapter embedding ได้หนึ่งรายการหรือมากกว่า เช่น `openai`, `gemini` หรือ id แบบกำหนดเองที่ Plugin กำหนด
- config ของผู้ใช้ เช่น `agents.defaults.memorySearch.provider` และ `agents.defaults.memorySearch.fallback` จะ resolve เทียบกับ id adapter ที่ลงทะเบียนเหล่านั้น

### เหตุการณ์และ lifecycle

| เมธอด                                       | สิ่งที่ทำ                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | hook lifecycle แบบ typed          |
| `api.onConversationBindingResolved(handler)` | callback การผูก conversation |

ดู [hook ของ Plugin](/th/plugins/hooks) สำหรับตัวอย่าง ชื่อ hook ที่พบบ่อย และ semantics ของ guard

### Semantics การตัดสินใจของ hook

- `before_tool_call`: การส่งกลับ `{ block: true }` ถือเป็น terminal เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่ priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: การส่งกลับ `{ block: false }` จะถูกถือว่าไม่มีการตัดสินใจ (เหมือนกับละเว้น `block`) ไม่ใช่การ override
- `before_install`: การส่งกลับ `{ block: true }` ถือเป็น terminal เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่ priority ต่ำกว่าจะถูกข้าม
- `before_install`: การส่งกลับ `{ block: false }` จะถูกถือว่าไม่มีการตัดสินใจ (เหมือนกับละเว้น `block`) ไม่ใช่การ override
- `reply_dispatch`: การส่งกลับ `{ handled: true, ... }` ถือเป็น terminal เมื่อ handler ใด claim dispatch แล้ว handler ที่ priority ต่ำกว่าและเส้นทาง dispatch โมเดลเริ่มต้นจะถูกข้าม
- `message_sending`: การส่งกลับ `{ cancel: true }` ถือเป็น terminal เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่ priority ต่ำกว่าจะถูกข้าม
- `message_sending`: การส่งกลับ `{ cancel: false }` จะถูกถือว่าไม่มีการตัดสินใจ (เหมือนกับละเว้น `cancel`) ไม่ใช่การ override
- `message_received`: ใช้ฟิลด์ typed `threadId` เมื่อคุณต้องการการกำหนดเส้นทาง thread/topic ขาเข้า เก็บ `metadata` ไว้สำหรับส่วนเพิ่มเติมเฉพาะ channel
- `message_sending`: ใช้ฟิลด์การกำหนดเส้นทาง typed `replyToId` / `threadId` ก่อน fallback ไปยัง `metadata` เฉพาะ channel
- `gateway_start`: ใช้ `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับสถานะ startup ที่ Gateway เป็นเจ้าของ แทนการพึ่งพา hook ภายใน `gateway:startup`
- `cron_changed`: สังเกตการเปลี่ยนแปลง lifecycle ของ Cron ที่ Gateway เป็นเจ้าของ ใช้ `event.job?.state?.nextRunAtMs` และ `ctx.getCron?.()` เมื่อซิงค์ตัวจัดตาราง wake ภายนอก และคงให้ OpenClaw เป็นแหล่งข้อมูลจริงสำหรับการตรวจสอบงานถึงกำหนดและการดำเนินการ

### ฟิลด์ของออบเจ็กต์ API

| ฟิลด์                    | ชนิด                      | คำอธิบาย                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id ของ Plugin                                                                                   |
| `api.name`               | `string`                  | ชื่อที่แสดง                                                                                |
| `api.version`            | `string?`                 | เวอร์ชันของ Plugin (ไม่บังคับ)                                                                   |
| `api.description`        | `string?`                 | คำอธิบาย Plugin (ไม่บังคับ)                                                               |
| `api.source`             | `string`                  | เส้นทาง source ของ Plugin                                                                          |
| `api.rootDir`            | `string?`                 | ไดเรกทอรีรากของ Plugin (ไม่บังคับ)                                                            |
| `api.config`             | `OpenClawConfig`          | snapshot config ปัจจุบัน (snapshot runtime ในหน่วยความจำที่ใช้งานอยู่เมื่อมีให้ใช้)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | config เฉพาะ Plugin จาก `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [ตัวช่วย runtime](/th/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | logger แบบ scoped (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือหน้าต่าง startup/setup แบบ lightweight ก่อน full-entry |
| `api.resolvePath(input)` | `(string) => string`      | resolve เส้นทางแบบสัมพันธ์กับรากของ Plugin                                                        |

## Convention ของโมดูลภายใน

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
  `./runtime-api.ts` เส้นทาง SDK เป็นสัญญาภายนอกเท่านั้น
</Warning>

พื้นผิวสาธารณะของ Plugin ที่ bundled และโหลดผ่าน facade (`api.ts`, `runtime-api.ts`, `index.ts`, `setup-entry.ts` และไฟล์ entry สาธารณะที่คล้ายกัน) จะเลือกใช้ snapshot config runtime ที่ใช้งานอยู่เมื่อ OpenClaw กำลังรันอยู่ หากยังไม่มี snapshot runtime จะ fallback ไปยังไฟล์ config ที่ resolve แล้วบนดิสก์ facade ของ Plugin bundled ที่ package แล้วควรถูกโหลดผ่านตัวโหลด facade ของ Plugin ใน OpenClaw; การ import โดยตรงจาก `dist/extensions/...` จะข้าม manifest และการตรวจสอบ sidecar ของ runtime ที่การติดตั้งแบบ packaged ใช้สำหรับโค้ดที่ Plugin เป็นเจ้าของ

Plugin provider สามารถเปิดเผย barrel สัญญาแบบแคบในเครื่องของ Plugin ได้ เมื่อ helper นั้นตั้งใจให้เฉพาะกับ provider และยังไม่ควรอยู่ใน subpath SDK ทั่วไป ตัวอย่างแบบ bundled:

- **Anthropic**: seam `api.ts` / `contract-api.ts` สาธารณะสำหรับ helper สตรีม beta-header และ `service_tier` ของ Claude
- **`@openclaw/openai-provider`**: `api.ts` export ตัวสร้าง provider, helper โมเดลเริ่มต้น และตัวสร้าง provider realtime
- **`@openclaw/openrouter-provider`**: `api.ts` export ตัวสร้าง provider พร้อม helper onboarding/config

<Warning>
  โค้ด production ของ Extension ควรหลีกเลี่ยง import `openclaw/plugin-sdk/<other-plugin>` ด้วย หาก helper นั้นแชร์กันจริง ให้ยกระดับไปยัง subpath SDK ที่เป็นกลาง เช่น `openclaw/plugin-sdk/speech`, `.../provider-model-shared` หรือพื้นผิวอื่นที่เน้น capability แทนการผูก Plugin สองตัวเข้าด้วยกัน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="จุดเข้าใช้งาน" icon="door-open" href="/th/plugins/sdk-entrypoints">
    ตัวเลือก `definePluginEntry` และ `defineChannelPluginEntry`
  </Card>
  <Card title="ตัวช่วยรันไทม์" icon="gears" href="/th/plugins/sdk-runtime">
    ข้อมูลอ้างอิงเนมสเปซ `api.runtime` ฉบับเต็ม
  </Card>
  <Card title="การตั้งค่าและการกำหนดค่า" icon="sliders" href="/th/plugins/sdk-setup">
    การจัดแพ็กเกจ, manifest และสคีมาการกำหนดค่า
  </Card>
  <Card title="การทดสอบ" icon="vial" href="/th/plugins/sdk-testing">
    ยูทิลิตีทดสอบและกฎ lint
  </Card>
  <Card title="การย้าย SDK" icon="arrows-turn-right" href="/th/plugins/sdk-migration">
    การย้ายจากพื้นผิวที่เลิกใช้แล้ว
  </Card>
  <Card title="กลไกภายในของ Plugin" icon="diagram-project" href="/th/plugins/architecture">
    สถาปัตยกรรมเชิงลึกและโมเดลความสามารถ
  </Card>
</CardGroup>
