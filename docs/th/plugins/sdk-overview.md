---
read_when:
    - คุณจำเป็นต้องทราบว่าจะนำเข้าจากพาธย่อยใดของ SDK
    - คุณต้องการเอกสารอ้างอิงสำหรับเมธอดการลงทะเบียนทั้งหมดบน OpenClawPluginApi
    - คุณกำลังค้นหา export ของ SDK ที่เฉพาะเจาะจง
sidebarTitle: Plugin SDK overview
summary: แผนที่การนำเข้า, เอกสารอ้างอิง API การลงทะเบียน, และสถาปัตยกรรม SDK
title: ภาพรวม SDK ของ Plugin
x-i18n:
    generated_at: "2026-07-01T20:39:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK คือสัญญาแบบมีชนิดข้อมูลระหว่าง Plugin กับคอร์ หน้านี้คือ
เอกสารอ้างอิงสำหรับ **สิ่งที่ต้อง import** และ **สิ่งที่คุณลงทะเบียนได้**

<Note>
  หน้านี้สำหรับผู้เขียน Plugin ที่ใช้ `openclaw/plugin-sdk/*` ภายใน
  OpenClaw สำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
  ที่ต้องการรันเอเจนต์ผ่าน Gateway ให้ใช้
  [การผสานรวม Gateway สำหรับแอปภายนอก](/th/gateway/external-apps) แทน
</Note>

<Tip>
กำลังมองหาคู่มือวิธีทำอยู่ใช่ไหม เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins), ใช้ [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) สำหรับ Plugin ช่องทาง, [Provider Plugin](/th/plugins/sdk-provider-plugins) สำหรับ Provider Plugin, [Plugin แบ็กเอนด์ CLI](/th/plugins/cli-backend-plugins) สำหรับแบ็กเอนด์ AI CLI แบบโลคัล และ [Plugin hooks](/th/plugins/hooks) สำหรับ Plugin เครื่องมือหรือ hook วงจรชีวิต
</Tip>

## ข้อตกลงการ import

ให้ import จาก subpath ที่เฉพาะเจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

แต่ละ subpath เป็นโมดูลขนาดเล็กที่ครบถ้วนในตัวเอง วิธีนี้ช่วยให้การเริ่มต้นเร็ว
และป้องกันปัญหา dependency แบบวนรอบ สำหรับ entry/build helper เฉพาะช่องทาง
ให้เลือกใช้ `openclaw/plugin-sdk/channel-core`; เก็บ `openclaw/plugin-sdk/core` ไว้สำหรับ
พื้นผิวแบบครอบคลุมที่กว้างกว่าและ helper ที่ใช้ร่วมกัน เช่น
`buildChannelConfigSchema`

สำหรับ config ช่องทาง ให้เผยแพร่ JSON Schema ที่ช่องทางเป็นเจ้าของผ่าน
`openclaw.plugin.json#channelConfigs` subpath `plugin-sdk/channel-config-schema`
มีไว้สำหรับ primitive ของ schema ที่ใช้ร่วมกันและตัวสร้างแบบทั่วไป Plugin ที่บันเดิลมากับ
OpenClaw ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ schema ช่องทางแบบบันเดิล
ที่ยังคงไว้ export ความเข้ากันได้ที่เลิกใช้แล้วยังคงอยู่บน
`plugin-sdk/channel-config-schema-legacy`; subpath schema แบบบันเดิลทั้งสองไม่ใช่
รูปแบบสำหรับ Plugin ใหม่

<Warning>
  อย่า import จุดเชื่อมอำนวยความสะดวกที่มีแบรนด์ provider หรือช่องทาง (เช่น
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)
  Plugin ที่บันเดิลมาจะประกอบ subpath SDK ทั่วไปภายใน barrel `api.ts` /
  `runtime-api.ts` ของตัวเอง; ผู้ใช้ฝั่งคอร์ควรใช้ barrel ภายใน Plugin เหล่านั้น
  หรือเพิ่มสัญญา SDK ทั่วไปแบบแคบเมื่อความต้องการนั้นเป็นแบบข้ามช่องทางจริง ๆ

จุดเชื่อม helper ของ Plugin แบบบันเดิลจำนวนเล็กน้อยยังคงปรากฏใน export map
ที่สร้างขึ้นเมื่อมีการติดตามการใช้งานของเจ้าของ จุดเชื่อมเหล่านี้มีไว้สำหรับการดูแลรักษา
Plugin แบบบันเดิลเท่านั้น และไม่ใช่เส้นทาง import ที่แนะนำสำหรับ Plugin บุคคลที่สามใหม่

`openclaw/plugin-sdk/discord` และ `openclaw/plugin-sdk/telegram-account` ยังถูกเก็บไว้
เป็น facade ความเข้ากันได้ที่เลิกใช้แล้วสำหรับการใช้งานของเจ้าของที่ติดตามไว้ อย่าคัดลอก
เส้นทาง import เหล่านั้นไปยัง Plugin ใหม่; ให้ใช้ runtime helper ที่ฉีดเข้ามาและ
subpath SDK ช่องทางทั่วไปแทน
</Warning>

## เอกสารอ้างอิง subpath

Plugin SDK ถูกเปิดเผยเป็นชุด subpath แบบแคบที่จัดกลุ่มตามพื้นที่ (entry ของ Plugin,
ช่องทาง, provider, auth, runtime, capability, memory และ helper ของ Plugin แบบบันเดิล
ที่สงวนไว้) สำหรับแค็ตตาล็อกฉบับเต็มที่จัดกลุ่มและลิงก์ไว้แล้ว ดู
[subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)

รายการ entrypoint ของคอมไพเลอร์อยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package export ถูกสร้างจาก
ชุดสาธารณะหลังจากหัก subpath สำหรับ test/internal เฉพาะภายใน repo ที่ระบุไว้ใน
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` ออกแล้ว รัน
`pnpm plugin-sdk:surface` เพื่อตรวจนับจำนวน export สาธารณะ subpath สาธารณะที่เลิกใช้แล้ว
ซึ่งเก่าพอและไม่ได้ถูกใช้โดยโค้ด production ของส่วนขยายแบบบันเดิลจะถูกติดตามใน
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel re-export
ที่เลิกใช้แล้วแบบกว้างจะถูกติดตามใน
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`

## API การลงทะเบียน

callback `register(api)` จะได้รับออบเจ็กต์ `OpenClawPluginApi` ที่มี
เมธอดเหล่านี้:

### การลงทะเบียน capability

| เมธอด                                           | สิ่งที่ลงทะเบียน                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | การอนุมานข้อความ (LLM)                  |
| `api.registerAgentHarness(...)`                  | ตัวดำเนินการเอเจนต์ระดับต่ำเชิงทดลอง |
| `api.registerCliBackend(...)`                    | แบ็กเอนด์การอนุมาน CLI แบบโลคัล           |
| `api.registerChannel(...)`                       | ช่องทางการส่งข้อความ                     |
| `api.registerEmbeddingProvider(...)`             | provider embedding เวกเตอร์ที่นำกลับมาใช้ซ้ำได้    |
| `api.registerSpeechProvider(...)`                | การสังเคราะห์ข้อความเป็นเสียง / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | การถอดเสียงแบบเรียลไทม์แบบสตรีม      |
| `api.registerRealtimeVoiceProvider(...)`         | เซสชันเสียงเรียลไทม์แบบสองทาง        |
| `api.registerMediaUnderstandingProvider(...)`    | การวิเคราะห์รูปภาพ/เสียง/วิดีโอ            |
| `api.registerImageGenerationProvider(...)`       | การสร้างรูปภาพ                      |
| `api.registerMusicGenerationProvider(...)`       | การสร้างเพลง                      |
| `api.registerVideoGenerationProvider(...)`       | การสร้างวิดีโอ                      |
| `api.registerWebFetchProvider(...)`              | provider ดึงข้อมูลเว็บ / scrape           |
| `api.registerWebSearchProvider(...)`             | การค้นหาเว็บ                            |

Embedding provider ที่ลงทะเบียนด้วย `api.registerEmbeddingProvider(...)` ต้อง
ถูกระบุใน `contracts.embeddingProviders` ใน manifest ของ Plugin ด้วย นี่คือ
พื้นผิว embedding ทั่วไปสำหรับการสร้างเวกเตอร์ที่นำกลับมาใช้ซ้ำได้ การค้นหา memory
สามารถใช้พื้นผิว provider ทั่วไปนี้ได้ จุดเชื่อมรุ่นเก่า
`api.registerMemoryEmbeddingProvider(...)` และ
`contracts.memoryEmbeddingProviders` เป็นความเข้ากันได้ที่เลิกใช้แล้วระหว่างที่
provider เฉพาะ memory ที่มีอยู่ย้ายออกไป

provider เฉพาะ memory ที่ยังเปิด runtime `batchEmbed(...)` จะยังอยู่บน
สัญญาการ batching รายไฟล์เดิม เว้นแต่ runtime ของตัวเองจะตั้งค่า
`sourceWideBatchEmbed: true` อย่างชัดเจน การ opt-in นี้ทำให้ host ของ memory ส่ง chunk จาก
ไฟล์ memory ที่ dirty หลายไฟล์และ source ที่เปิดใช้งานแล้วในการเรียก `batchEmbed(...)` ครั้งเดียว
ได้จนถึงขีดจำกัด batch ของ host adapter แบบ batch ที่อัปโหลดไฟล์คำขอ JSONL ต้อง
แบ่งงาน provider ก่อนถึงเพดานขนาดอัปโหลดและเพดานจำนวนคำขอด้วย
provider ต้องคืน embedding หนึ่งรายการต่อ input chunk ในลำดับเดียวกับ
`batch.chunks`; อย่าใส่ flag นี้เมื่อ provider คาดหวัง batch เฉพาะภายในไฟล์หรือ
ไม่สามารถรักษาลำดับ input ข้ามงาน source-wide ที่ใหญ่กว่าได้

### เครื่องมือและคำสั่ง

ใช้ [`defineToolPlugin`](/th/plugins/tool-plugins) สำหรับ Plugin ที่มีเฉพาะเครื่องมือแบบง่าย
พร้อมชื่อเครื่องมือคงที่ ใช้ `api.registerTool(...)` โดยตรงสำหรับ Plugin แบบผสม
หรือการลงทะเบียนเครื่องมือแบบไดนามิกเต็มรูปแบบ

| เมธอด                          | สิ่งที่ลงทะเบียน                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | เครื่องมือเอเจนต์ (จำเป็นหรือ `{ optional: true }`) |
| `api.registerCommand(def)`      | คำสั่งแบบกำหนดเอง (ข้าม LLM)             |

คำสั่ง Plugin สามารถตั้งค่า `agentPromptGuidance` เมื่อเอเจนต์ต้องการคำใบ้ routing
สั้น ๆ ที่คำสั่งเป็นเจ้าของ ให้ข้อความนั้นเกี่ยวกับตัวคำสั่งเอง; อย่าเพิ่ม
นโยบายเฉพาะ provider หรือ Plugin เข้าไปในตัวสร้าง prompt ของคอร์

รายการ guidance อาจเป็นสตริงแบบ legacy ซึ่งใช้กับทุกพื้นผิว prompt หรือ
รายการแบบมีโครงสร้าง:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` แบบมีโครงสร้างอาจมี `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` หรือ `subagent` `pi_main` ยังคงเป็น alias ที่เลิกใช้แล้ว
สำหรับ `openclaw_main` ละเว้น `surfaces` เมื่อจงใจให้ guidance ใช้กับทุกพื้นผิว
อย่าส่งอาร์เรย์ `surfaces` ว่าง; อาร์เรย์นั้นจะถูกปฏิเสธเพื่อไม่ให้การสูญเสีย scope
โดยไม่ตั้งใจกลายเป็นข้อความ prompt แบบ global

คำสั่งสำหรับนักพัฒนา app-server ของ Codex แบบ native เข้มงวดกว่าพื้นผิว prompt อื่น:
เฉพาะ guidance ที่กำหนด scope เป็น `codex_app_server` อย่างชัดเจนเท่านั้นที่จะถูกยกระดับเข้า
lane ที่มีลำดับความสำคัญสูงกว่านั้น guidance แบบสตริง legacy และ guidance แบบมีโครงสร้าง
ที่ไม่ได้กำหนด scope ยังคงใช้ได้กับพื้นผิว prompt ที่ไม่ใช่ Codex เพื่อความเข้ากันได้

### โครงสร้างพื้นฐาน

| เมธอด                                         | สิ่งที่ลงทะเบียน                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook                              |
| `api.registerHttpRoute(params)`                | endpoint HTTP ของ Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | เมธอด RPC ของ Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | ตัวประกาศการค้นพบ Gateway แบบโลคัล      |
| `api.registerCli(registrar, opts?)`            | คำสั่งย่อย CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI ของฟีเจอร์ Node ใต้ `openclaw nodes` |
| `api.registerService(service)`                 | บริการเบื้องหลัง                      |
| `api.registerInteractiveHandler(registration)` | ตัวจัดการแบบ interactive                     |
| `api.registerAgentToolResultMiddleware(...)`   | middleware ผลลัพธ์เครื่องมือของ runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | ส่วน prompt เสริมที่อยู่ติดกับ memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus การค้นหา/อ่าน memory เสริม      |

### Host hooks สำหรับ workflow Plugin

Host hooks คือจุดเชื่อม SDK สำหรับ Plugin ที่ต้องเข้าร่วมในวงจรชีวิตของ host
แทนที่จะเพียงเพิ่ม provider, ช่องทาง หรือเครื่องมือ จุดเชื่อมเหล่านี้เป็น
สัญญาทั่วไป; Plan Mode สามารถใช้ได้ แต่ workflow การอนุมัติ,
gate นโยบาย workspace, monitor เบื้องหลัง, wizard ตั้งค่า และ Plugin คู่กับ UI
ก็ใช้ได้เช่นกัน

| วิธีการ                                                                               | สัญญาที่รับผิดชอบ                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | สถานะเซสชันที่ Plugin เป็นเจ้าของและเข้ากันได้กับ JSON ซึ่งถูกฉายผ่านเซสชันของ Gateway                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | บริบทแบบคงทนและรับประกันครั้งเดียวพอดี ซึ่งถูกฉีดเข้าในเทิร์นถัดไปของเอเจนต์สำหรับหนึ่งเซสชัน                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | นโยบายเครื่องมือที่เชื่อถือได้ก่อน Plugin ซึ่งถูกควบคุมด้วย manifest และสามารถบล็อกหรือเขียนพารามิเตอร์เครื่องมือใหม่ได้                                                                        |
| `api.registerToolMetadata(...)`                                                      | เมทาดาทาการแสดงผลของแค็ตตาล็อกเครื่องมือโดยไม่เปลี่ยนการติดตั้งใช้งานเครื่องมือ                                                                                     |
| `api.registerCommand(...)`                                                           | คำสั่ง Plugin แบบมีขอบเขต; ผลลัพธ์คำสั่งสามารถตั้งค่า `continueAgent: true` หรือ `suppressReply: true`; คำสั่งเนทีฟของ Discord รองรับ `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | ตัวบรรยายการสนับสนุน Control UI สำหรับพื้นผิวเซสชัน เครื่องมือ รัน หรือการตั้งค่า                                                                           |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | คอลแบ็กการล้างข้อมูลสำหรับทรัพยากรรันไทม์ที่ Plugin เป็นเจ้าของในเส้นทางรีเซ็ต/ลบ/โหลดใหม่                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | การสมัครรับเหตุการณ์ที่ผ่านการทำให้ปลอดภัยแล้วสำหรับสถานะเวิร์กโฟลว์และมอนิเตอร์                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | สถานะชั่วคราวของ Plugin ต่อการรัน ซึ่งถูกล้างเมื่อวงจรชีวิตการรันสิ้นสุด                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | เมทาดาทาการล้างข้อมูลสำหรับงานตัวจัดกำหนดการที่ Plugin เป็นเจ้าของ; ไม่ได้จัดกำหนดการงานหรือสร้างระเบียนงาน                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | การส่งไฟล์แนบที่โฮสต์เป็นตัวกลาง เฉพาะแบบ bundled-only ไปยังเส้นทางเซสชัน direct-outbound ที่ใช้งานอยู่                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | เทิร์นเซสชันตามกำหนดเวลาที่มี Cron หนุนหลัง เฉพาะแบบ bundled-only รวมถึงการล้างข้อมูลตามแท็ก                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | แอ็กชันเซสชันแบบมีชนิดที่ไคลเอนต์สามารถส่งผ่าน Gateway ได้                                                                                             |

ใช้เนมสเปซที่จัดกลุ่มไว้สำหรับโค้ด Plugin ใหม่:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

เมธอดแบบแบนที่เทียบเท่ายังคงพร้อมใช้งานในฐานะนามแฝงความเข้ากันได้ที่เลิกใช้แล้ว
สำหรับ Plugin ที่มีอยู่ อย่าเพิ่มโค้ด Plugin ใหม่ที่เรียก
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` หรือ
`api.unscheduleSessionTurnsByTag` โดยตรง

`scheduleSessionTurn(...)` เป็นตัวช่วยตามขอบเขตเซสชันเหนือกว่าตัวจัดกำหนดการ Cron
ของ Gateway Cron รับผิดชอบเวลาและสร้างระเบียนงานเบื้องหลังเมื่อ
เทิร์นทำงาน; Plugin SDK จำกัดเฉพาะเซสชันเป้าหมาย การตั้งชื่อที่ Plugin เป็นเจ้าของ
และการล้างข้อมูล ใช้ `api.runtime.tasks.managedFlows` ภายในเทิร์นที่จัดกำหนดการไว้
เมื่องานนั้นต้องการสถานะ Task Flow หลายขั้นตอนแบบคงทน

สัญญาแยกอำนาจโดยเจตนา:

- Plugin ภายนอกสามารถเป็นเจ้าของส่วนขยายเซสชัน ตัวบรรยาย UI คำสั่ง เมทาดาทาเครื่องมือ การฉีดเทิร์นถัดไป และฮุกปกติได้
- นโยบายเครื่องมือที่เชื่อถือได้ทำงานก่อนฮุก `before_tool_call` ทั่วไปและเป็นที่เชื่อถือโดยโฮสต์ นโยบายแบบ bundled ทำงานก่อน; นโยบายของ Plugin ที่ติดตั้งต้องมีการเปิดใช้อย่างชัดเจนพร้อม id ภายในเครื่องใน
  `contracts.trustedToolPolicies` และทำงานถัดไปตามลำดับการโหลด Plugin id นโยบาย
  มีขอบเขตอยู่กับ Plugin ที่ลงทะเบียน
- การเป็นเจ้าของคำสั่งที่สงวนไว้เป็นแบบ bundled-only Plugin ภายนอกควรใช้ชื่อคำสั่งหรือนามแฝงของตนเอง
- `allowPromptInjection=false` ปิดใช้งานฮุกที่เปลี่ยน prompt รวมถึง
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  ฟิลด์ prompt จาก `before_agent_start` แบบเดิม และ
  `enqueueNextTurnInjection`

ตัวอย่างผู้บริโภคที่ไม่ใช่ Plan:

| ต้นแบบ Plugin             | ฮุกที่ใช้                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| เวิร์กโฟลว์การอนุมัติ            | ส่วนขยายเซสชัน การดำเนินคำสั่งต่อ การฉีดเทิร์นถัดไป ตัวบรรยาย UI                                                            |
| ประตูควบคุมนโยบายงบประมาณ/พื้นที่ทำงาน | นโยบายเครื่องมือที่เชื่อถือได้ เมทาดาทาเครื่องมือ การฉายเซสชัน                                                                                 |
| มอนิเตอร์วงจรชีวิตเบื้องหลัง | การล้างข้อมูลวงจรชีวิตรันไทม์ การสมัครรับเหตุการณ์เอเจนต์ การเป็นเจ้าของ/ล้างข้อมูลงานตัวจัดกำหนดการเซสชัน การสนับสนุน prompt Heartbeat ตัวบรรยาย UI |
| ตัวช่วยตั้งค่าหรือตัวช่วยเริ่มต้นใช้งาน   | ส่วนขยายเซสชัน คำสั่งแบบมีขอบเขต ตัวบรรยาย Control UI                                                                              |

<Note>
  เนมสเปซผู้ดูแลหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) จะคงเป็น `operator.admin` เสมอ แม้ว่า Plugin จะพยายามกำหนด
  ขอบเขตเมธอด Gateway ที่แคบกว่า ควรใช้คำนำหน้าเฉพาะ Plugin สำหรับ
  เมธอดที่ Plugin เป็นเจ้าของ
</Note>

<Accordion title="เมื่อใดควรใช้มิดเดิลแวร์ผลลัพธ์เครื่องมือ">
  Plugin แบบ bundled และ Plugin ที่ติดตั้งซึ่งเปิดใช้อย่างชัดเจนพร้อมสัญญา
  manifest ที่ตรงกัน สามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อ
  ต้องเขียนผลลัพธ์เครื่องมือใหม่หลังการดำเนินการและก่อนที่รันไทม์
  จะป้อนผลลัพธ์นั้นกลับเข้าโมเดล นี่คือจุดเชื่อมต่อที่รันไทม์เป็นกลางและเชื่อถือได้
  สำหรับตัวลดเอาต์พุตแบบอะซิงก์ เช่น tokenjuice

Plugin ต้องประกาศ `contracts.agentToolResultMiddleware` สำหรับแต่ละรันไทม์เป้าหมาย
เช่น `["openclaw", "codex"]` Plugin ที่ติดตั้งโดยไม่มี
สัญญานั้น หรือไม่มีการเปิดใช้อย่างชัดเจน จะไม่สามารถลงทะเบียนมิดเดิลแวร์นี้ได้; ให้ใช้
ฮุก Plugin ปกติของ OpenClaw สำหรับงานที่ไม่ต้องการจังหวะผลลัพธ์เครื่องมือก่อนโมเดล
เส้นทางการลงทะเบียนโรงงานส่วนขยายแบบเก่า
ที่มีเฉพาะ embedded-runner-only ถูกนำออกแล้ว
</Accordion>

### การลงทะเบียนการค้นพบ Gateway

`api.registerGatewayDiscoveryService(...)` ให้ Plugin ประกาศ Gateway ที่ใช้งานอยู่
บนทรานสปอร์ตการค้นพบภายในเครื่อง เช่น mDNS/Bonjour OpenClaw เรียก
บริการนี้ระหว่างเริ่มต้น Gateway เมื่อเปิดใช้การค้นพบภายในเครื่อง ส่ง
พอร์ต Gateway ปัจจุบันและข้อมูลคำใบ้ TXT ที่ไม่ใช่ความลับ และเรียกตัวจัดการ
`stop` ที่ส่งคืนระหว่างปิด Gateway

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
การยืนยันตัวตน การค้นพบเป็นคำใบ้การกำหนดเส้นทาง; การยืนยันตัวตนของ Gateway และการปักหมุด TLS ยังคง
เป็นเจ้าของความเชื่อถือ

### เมทาดาทาการลงทะเบียน CLI

`api.registerCli(registrar, opts?)` รับเมทาดาทาคำสั่งสองประเภท:

- `commands`: ชื่อคำสั่งแบบชัดเจนที่ registrar เป็นเจ้าของ
- `descriptors`: ตัวบรรยายคำสั่งขณะ parse ที่ใช้สำหรับความช่วยเหลือของ CLI,
  การกำหนดเส้นทาง และการลงทะเบียน CLI ของ Plugin แบบ lazy
- `parentPath`: เส้นทางคำสั่งแม่แบบไม่บังคับสำหรับกลุ่มคำสั่งซ้อน เช่น
  `["nodes"]`

สำหรับฟีเจอร์โหนดแบบจับคู่ ควรใช้
`api.registerNodeCliFeature(registrar, opts?)` มันเป็น wrapper ขนาดเล็กรอบ
`api.registerCli(..., { parentPath: ["nodes"] })` และทำให้คำสั่ง เช่น
`openclaw nodes canvas` เป็นฟีเจอร์โหนดที่ Plugin เป็นเจ้าของอย่างชัดเจน

หากคุณต้องการให้คำสั่ง Plugin ยังคงโหลดแบบ lazy ในเส้นทาง CLI รากตามปกติ
ให้ระบุ `descriptors` ที่ครอบคลุมรากคำสั่งระดับบนสุดทุกตัวที่
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

คำสั่งซ้อนจะได้รับคำสั่งแม่ที่แก้ไขแล้วเป็น `program`:

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

ใช้ `commands` เพียงอย่างเดียวเฉพาะเมื่อคุณไม่ต้องการการลงทะเบียน CLI รากแบบ lazy
เส้นทางความเข้ากันได้แบบ eager นั้นยังรองรับอยู่ แต่ไม่ได้ติดตั้ง
placeholder ที่มี descriptor หนุนหลังสำหรับการโหลดแบบ lazy ในขณะ parse

### การลงทะเบียนแบ็กเอนด์ CLI

`api.registerCliBackend(...)` ให้ Plugin เป็นเจ้าของ config เริ่มต้นสำหรับแบ็กเอนด์
AI CLI ภายในเครื่อง เช่น `claude-cli` หรือ `my-cli`

- `id` ของแบ็กเอนด์จะกลายเป็นคำนำหน้าผู้ให้บริการใน refs ของโมเดล เช่น `my-cli/gpt-5`
- `config` ของแบ็กเอนด์ใช้รูปแบบเดียวกับ `agents.defaults.cliBackends.<id>`
- การกำหนดค่าของผู้ใช้ยังคงมีผลเหนือกว่า OpenClaw จะผสาน `agents.defaults.cliBackends.<id>` ทับค่าเริ่มต้นของ
  plugin ก่อนเรียกใช้ CLI
- ใช้ `normalizeConfig` เมื่อแบ็กเอนด์ต้องเขียนค่าความเข้ากันได้ใหม่หลังการผสาน
  (เช่น การทำให้รูปแบบแฟล็กเก่าเป็นมาตรฐาน)
- ใช้ `resolveExecutionArgs` สำหรับการเขียน argv ใหม่ตามขอบเขตคำขอ ซึ่งเป็นของ
  ภาษาถิ่นของ CLI เช่น การแมประดับการคิดของ OpenClaw ไปยังแฟล็ก effort
  แบบเนทีฟ hook จะได้รับ `ctx.executionMode`; ใช้ `"side-question"` เพื่อเพิ่ม
  แฟล็กการแยกแบบเนทีฟของแบ็กเอนด์สำหรับการเรียก `/btw` ชั่วคราว หากแฟล็กเหล่านั้น
  ปิดใช้เครื่องมือเนทีฟได้อย่างเชื่อถือได้สำหรับ CLI ที่โดยปกติเปิดใช้อยู่เสมอ ให้ประกาศ
  `sideQuestionToolMode: "disabled"` ด้วย

สำหรับคู่มือการเขียนแบบครบวงจร โปรดดู
[Plugin แบ็กเอนด์ CLI](/th/plugins/cli-backend-plugins)

### สล็อตเฉพาะ

| เมธอด                                     | สิ่งที่ลงทะเบียน                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | เอนจินบริบท (ใช้งานได้ครั้งละหนึ่งรายการ) lifecycle callbacks จะได้รับ `runtimeSettings` เมื่อโฮสต์สามารถให้การวินิจฉัยโมเดล/ผู้ให้บริการ/โหมดได้; เอนจิน strict รุ่นเก่าจะถูกลองใหม่โดยไม่มีคีย์นั้น |
| `api.registerMemoryCapability(capability)` | ความสามารถหน่วยความจำแบบรวม                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | ตัวสร้างส่วนพรอมป์หน่วยความจำ                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | ตัวแก้แผน flush หน่วยความจำ                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | อะแดปเตอร์รันไทม์หน่วยความจำ                                                                                                                                                                             |

### อะแดปเตอร์ embedding หน่วยความจำที่เลิกใช้แล้ว

| เมธอด                                         | สิ่งที่ลงทะเบียน                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | อะแดปเตอร์ embedding หน่วยความจำสำหรับ plugin ที่ใช้งานอยู่ |

- `registerMemoryCapability` คือ API plugin หน่วยความจำเฉพาะที่แนะนำ
- `registerMemoryCapability` อาจเปิดเผย `publicArtifacts.listArtifacts(...)`
  ด้วย เพื่อให้ plugin คู่ขนานสามารถใช้ artifact หน่วยความจำที่ส่งออกผ่าน
  `openclaw/plugin-sdk/memory-host-core` แทนการเข้าถึงเลย์เอาต์ส่วนตัวของ
  plugin หน่วยความจำเฉพาะ
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` และ
  `registerMemoryRuntime` คือ API plugin หน่วยความจำเฉพาะที่เข้ากันได้กับรุ่นเดิม
- `MemoryFlushPlan.model` สามารถตรึง turn การ flush กับ ref `provider/model`
  ที่แน่นอนได้ เช่น `ollama/qwen3:8b` โดยไม่สืบทอดเชน fallback ที่ใช้งานอยู่
- `registerMemoryEmbeddingProvider` เลิกใช้แล้ว ผู้ให้บริการ embedding ใหม่
  ควรใช้ `api.registerEmbeddingProvider(...)` และ
  `contracts.embeddingProviders`
- ผู้ให้บริการเฉพาะหน่วยความจำที่มีอยู่ยังคงทำงานต่อไปในช่วงเวลาการย้ายระบบ
  แต่รายงานการตรวจสอบ plugin จะรายงานสิ่งนี้เป็นหนี้ความเข้ากันได้สำหรับ
  plugin ที่ไม่ได้ bundled

### เหตุการณ์และ lifecycle

| เมธอด                                       | สิ่งที่ทำ                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | lifecycle hook แบบมีชนิด          |
| `api.onConversationBindingResolved(handler)` | callback การผูกการสนทนา |

ดู [Plugin hooks](/th/plugins/hooks) สำหรับตัวอย่าง ชื่อ hook ทั่วไป และความหมายของ guard

### ความหมายของการตัดสินใจใน hook

`before_install` เป็น lifecycle hook ของรันไทม์ plugin ไม่ใช่พื้นผิวนโยบายการติดตั้งของผู้ปฏิบัติการ
ใช้ `security.installPolicy` เมื่อการตัดสินใจอนุญาต/บล็อกต้องครอบคลุมเส้นทางติดตั้งหรืออัปเดตผ่าน CLI และ Gateway

- `before_tool_call`: การคืนค่า `{ block: true }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่าแล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: การคืนค่า `{ block: false }` ถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `block`) ไม่ใช่การ override
- `before_install`: การคืนค่า `{ block: true }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่าแล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: การคืนค่า `{ block: false }` ถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `block`) ไม่ใช่การ override
- `reply_dispatch`: การคืนค่า `{ handled: true, ... }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใดอ้างสิทธิ์ dispatch แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าและเส้นทาง dispatch โมเดลเริ่มต้นจะถูกข้าม
- `message_sending`: การคืนค่า `{ cancel: true }` ถือเป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่าแล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: การคืนค่า `{ cancel: false }` ถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `cancel`) ไม่ใช่การ override
- `message_received`: ใช้ฟิลด์แบบมีชนิด `threadId` เมื่อคุณต้องการกำหนดเส้นทางเธรด/หัวข้อขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเสริมเฉพาะช่องทาง
- `message_sending`: ใช้ฟิลด์กำหนดเส้นทางแบบมีชนิด `replyToId` / `threadId` ก่อน fallback ไปยัง `metadata` เฉพาะช่องทาง
- `gateway_start`: ใช้ `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับสถานะเริ่มต้นที่ Gateway เป็นเจ้าของ แทนการพึ่งพา hook ภายใน `gateway:startup`
- `cron_changed`: สังเกตการเปลี่ยนแปลง lifecycle ของ cron ที่ Gateway เป็นเจ้าของ ใช้ `event.job?.state?.nextRunAtMs` และ `ctx.getCron?.()` เมื่อซิงก์ตัวตั้งเวลาปลุกภายนอก และคงให้ OpenClaw เป็นแหล่งข้อมูลจริงสำหรับการตรวจสอบกำหนดเวลาและการดำเนินการ

### ฟิลด์อ็อบเจ็กต์ API

| ฟิลด์                    | ชนิด                      | คำอธิบาย                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id ของ Plugin                                                                                   |
| `api.name`               | `string`                  | ชื่อที่แสดง                                                                                |
| `api.version`            | `string?`                 | เวอร์ชัน Plugin (ไม่บังคับ)                                                                   |
| `api.description`        | `string?`                 | คำอธิบาย Plugin (ไม่บังคับ)                                                               |
| `api.source`             | `string`                  | พาธซอร์สของ Plugin                                                                          |
| `api.rootDir`            | `string?`                 | ไดเรกทอรีรูทของ Plugin (ไม่บังคับ)                                                            |
| `api.config`             | `OpenClawConfig`          | snapshot การกำหนดค่าปัจจุบัน (snapshot รันไทม์ในหน่วยความจำที่ใช้งานอยู่เมื่อมีให้ใช้)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | การกำหนดค่าเฉพาะ Plugin จาก `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [ตัวช่วยรันไทม์](/th/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | logger ตามขอบเขต (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดโหลดปัจจุบัน; `"setup-runtime"` คือช่วงเริ่มต้น/ตั้งค่าแบบเบาก่อน entry เต็ม |
| `api.resolvePath(input)` | `(string) => string`      | แก้พาธที่สัมพันธ์กับรูทของ plugin                                                        |

## ข้อตกลงของโมดูลภายใน

ภายใน plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในสำหรับการนำเข้า:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  ห้ามนำเข้า plugin ของคุณเองผ่าน `openclaw/plugin-sdk/<your-plugin>`
  จากโค้ด production ให้กำหนดเส้นทางการนำเข้าภายในผ่าน `./api.ts` หรือ
  `./runtime-api.ts` พาธ SDK เป็นสัญญาภายนอกเท่านั้น
</Warning>

พื้นผิวสาธารณะของ plugin แบบ bundled ที่โหลดผ่าน facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` และไฟล์ entry สาธารณะที่คล้ายกัน) จะเลือกใช้
snapshot การกำหนดค่ารันไทม์ที่ใช้งานอยู่เมื่อ OpenClaw กำลังทำงานแล้ว หากยังไม่มี
snapshot รันไทม์ จะ fallback ไปยังไฟล์การกำหนดค่าที่ resolve แล้วบนดิสก์
facade ของ plugin bundled ที่แพ็กเกจแล้วควรโหลดผ่าน loader facade ของ plugin
ของ OpenClaw; การนำเข้าโดยตรงจาก `dist/extensions/...` จะข้าม manifest
และการตรวจสอบ sidecar ของรันไทม์ที่การติดตั้งแบบแพ็กเกจใช้สำหรับโค้ดที่ plugin เป็นเจ้าของ

Plugin ผู้ให้บริการสามารถเปิดเผย contract barrel ภายใน plugin ที่แคบได้ เมื่อ
ตัวช่วยนั้นตั้งใจให้เฉพาะผู้ให้บริการและยังไม่ควรอยู่ใน subpath SDK ทั่วไป
ตัวอย่าง bundled:

- **Anthropic**: seam สาธารณะ `api.ts` / `contract-api.ts` สำหรับตัวช่วยสตรีม
  beta-header ของ Claude และ `service_tier`
- **`@openclaw/openai-provider`**: `api.ts` ส่งออกตัวสร้างผู้ให้บริการ
  ตัวช่วยโมเดลเริ่มต้น และตัวสร้างผู้ให้บริการ realtime
- **`@openclaw/openrouter-provider`**: `api.ts` ส่งออกตัวสร้างผู้ให้บริการ
  พร้อมตัวช่วย onboarding/การกำหนดค่า

<Warning>
  โค้ด production ของ extension ควรหลีกเลี่ยงการนำเข้า `openclaw/plugin-sdk/<other-plugin>`
  ด้วย หากตัวช่วยถูกแชร์จริง ให้ยกระดับไปยัง subpath SDK ที่เป็นกลาง
  เช่น `openclaw/plugin-sdk/speech`, `.../provider-model-shared` หรือพื้นผิวอื่น
  ที่มุ่งตามความสามารถ แทนการผูก plugin สองตัวเข้าด้วยกัน
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
    การแพ็กเกจ manifest และ schema การกำหนดค่า
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
