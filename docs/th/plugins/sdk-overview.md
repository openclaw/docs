---
read_when:
    - คุณต้องทราบว่าจะนำเข้าจากเส้นทางย่อยใดของ SDK
    - คุณต้องการเอกสารอ้างอิงสำหรับเมธอดการลงทะเบียนทั้งหมดบน OpenClawPluginApi
    - คุณกำลังค้นหา export เฉพาะของ SDK
sidebarTitle: Plugin SDK overview
summary: ข้อมูลอ้างอิง Import map, registration API และสถาปัตยกรรม SDK
title: ภาพรวม Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:07:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK ของ Plugin เป็นสัญญาแบบมีชนิดข้อมูลระหว่าง Plugin กับแกนหลัก หน้านี้เป็น
ข้อมูลอ้างอิงสำหรับ **สิ่งที่ควรนำเข้า** และ **สิ่งที่คุณสามารถลงทะเบียนได้**

<Note>
  หน้านี้มีไว้สำหรับผู้เขียน Plugin ที่ใช้ `openclaw/plugin-sdk/*` ภายใน
  OpenClaw สำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
  ที่ต้องการรันเอเจนต์ผ่าน Gateway ให้ใช้
  [การผสานรวม Gateway สำหรับแอปภายนอก](/th/gateway/external-apps) แทน
</Note>

<Tip>
กำลังมองหาคู่มือวิธีทำอยู่หรือไม่ เริ่มที่ [การสร้าง Plugin](/th/plugins/building-plugins), ใช้ [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) สำหรับ Plugin ช่องทาง, [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) สำหรับ Plugin ผู้ให้บริการ, [Plugin แบ็กเอนด์ CLI](/th/plugins/cli-backend-plugins) สำหรับแบ็กเอนด์ CLI ของ AI ในเครื่อง และ [ฮุกของ Plugin](/th/plugins/hooks) สำหรับ Plugin เครื่องมือหรือฮุกวงจรชีวิต
</Tip>

## แนวทางการนำเข้า

ให้นำเข้าจากเส้นทางย่อยที่เฉพาะเจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

แต่ละเส้นทางย่อยเป็นโมดูลขนาดเล็กที่สมบูรณ์ในตัวเอง วิธีนี้ช่วยให้การเริ่มต้นเร็ว
และป้องกันปัญหา dependency แบบวนรอบ สำหรับตัวช่วย entry/build เฉพาะช่องทาง
ให้เลือกใช้ `openclaw/plugin-sdk/channel-core`; เก็บ `openclaw/plugin-sdk/core` ไว้สำหรับ
พื้นผิวแบบครอบคลุมที่กว้างกว่าและตัวช่วยที่ใช้ร่วมกัน เช่น
`buildChannelConfigSchema`

สำหรับการกำหนดค่าช่องทาง ให้เผยแพร่ JSON Schema ที่ช่องทางเป็นเจ้าของผ่าน
`openclaw.plugin.json#channelConfigs` เส้นทางย่อย `plugin-sdk/channel-config-schema`
มีไว้สำหรับ primitive ของ schema ที่ใช้ร่วมกันและ builder ทั่วไป Plugin ที่รวมมากับ OpenClaw
ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ schema ของช่องทางที่รวมมาและยังคงเก็บไว้
export เพื่อความเข้ากันได้ที่เลิกใช้แล้วจะยังอยู่ที่
`plugin-sdk/channel-config-schema-legacy`; เส้นทางย่อย schema ของช่องทางที่รวมมาทั้งสองแบบไม่ใช่
รูปแบบสำหรับ Plugin ใหม่

<Warning>
  อย่านำเข้า seam อำนวยความสะดวกที่มีแบรนด์ของผู้ให้บริการหรือช่องทาง (เช่น
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)
  Plugin ที่รวมมาจะประกอบเส้นทางย่อย SDK ทั่วไปภายใน barrel `api.ts` /
  `runtime-api.ts` ของตัวเอง; ผู้ใช้ในแกนหลักควรใช้ barrel ภายใน Plugin เหล่านั้น
  หรือเพิ่มสัญญา SDK ทั่วไปที่แคบเมื่อความต้องการนั้นเป็นแบบข้ามช่องทางจริงๆ

seam ตัวช่วยของ Plugin ที่รวมมาชุดเล็กๆ ยังคงปรากฏใน export map ที่สร้างขึ้น
เมื่อมีการติดตามการใช้งานจากเจ้าของ seam เหล่านี้มีไว้เพื่อการบำรุงรักษา
Plugin ที่รวมมาเท่านั้น และไม่แนะนำให้ใช้เป็นเส้นทางนำเข้าสำหรับ Plugin ภายนอกใหม่

`openclaw/plugin-sdk/discord` และ `openclaw/plugin-sdk/telegram-account` ยังถูกเก็บไว้
เป็น facade เพื่อความเข้ากันได้ที่เลิกใช้แล้วสำหรับการใช้งานจากเจ้าของที่ติดตามไว้ อย่า
คัดลอกเส้นทางนำเข้าเหล่านั้นไปยัง Plugin ใหม่; ให้ใช้ตัวช่วย runtime ที่ฉีดเข้ามาและ
เส้นทางย่อย SDK ช่องทางทั่วไปแทน
</Warning>

## ข้อมูลอ้างอิงเส้นทางย่อย

SDK ของ Plugin ถูกเปิดเผยเป็นชุดเส้นทางย่อยที่แคบซึ่งจัดกลุ่มตามพื้นที่ (entry ของ Plugin,
ช่องทาง, ผู้ให้บริการ, auth, runtime, capability, memory และตัวช่วยของ
Plugin ที่รวมมาซึ่งสงวนไว้) สำหรับแค็ตตาล็อกแบบเต็มที่จัดกลุ่มและลิงก์ไว้ โปรดดู
[เส้นทางย่อย SDK ของ Plugin](/th/plugins/sdk-subpaths)

รายการ entrypoint ของคอมไพเลอร์อยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package exports ถูกสร้างจาก
ชุดย่อยสาธารณะหลังจากหักลบเส้นทางย่อยสำหรับทดสอบ/ภายในเฉพาะ repo-local ที่ระบุไว้ใน
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` รัน
`pnpm plugin-sdk:surface` เพื่อตรวจสอบจำนวน export สาธารณะ เส้นทางย่อยสาธารณะที่เลิกใช้แล้ว
ซึ่งเก่าเพียงพอและไม่ได้ถูกใช้โดยโค้ด production ของส่วนขยายที่รวมมา
ถูกติดตามใน `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel
re-export ที่เลิกใช้แล้วแบบกว้างถูกติดตามใน
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`

## API การลงทะเบียน

คอลแบ็ก `register(api)` ได้รับอ็อบเจ็กต์ `OpenClawPluginApi` พร้อมเมธอดเหล่านี้:

### การลงทะเบียนความสามารถ

| เมธอด                                           | สิ่งที่ลงทะเบียน                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | การอนุมานข้อความ (LLM)                  |
| `api.registerAgentHarness(...)`                  | ตัวดำเนินการเอเจนต์ระดับต่ำแบบทดลอง |
| `api.registerCliBackend(...)`                    | แบ็กเอนด์การอนุมาน CLI ในเครื่อง           |
| `api.registerChannel(...)`                       | ช่องทางรับส่งข้อความ                     |
| `api.registerEmbeddingProvider(...)`             | ผู้ให้บริการ embedding เวกเตอร์ที่ใช้ซ้ำได้    |
| `api.registerSpeechProvider(...)`                | การสังเคราะห์ข้อความเป็นเสียง / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | การถอดเสียงแบบเรียลไทม์แบบสตรีม      |
| `api.registerRealtimeVoiceProvider(...)`         | เซสชันเสียงเรียลไทม์แบบสองทาง        |
| `api.registerMediaUnderstandingProvider(...)`    | การวิเคราะห์รูปภาพ/เสียง/วิดีโอ            |
| `api.registerImageGenerationProvider(...)`       | การสร้างรูปภาพ                      |
| `api.registerMusicGenerationProvider(...)`       | การสร้างเพลง                      |
| `api.registerVideoGenerationProvider(...)`       | การสร้างวิดีโอ                      |
| `api.registerWebFetchProvider(...)`              | ผู้ให้บริการดึงข้อมูลเว็บ / scrape           |
| `api.registerWebSearchProvider(...)`             | การค้นหาเว็บ                            |

ผู้ให้บริการ embedding ที่ลงทะเบียนด้วย `api.registerEmbeddingProvider(...)` ต้อง
ถูกระบุไว้ใน `contracts.embeddingProviders` ใน manifest ของ Plugin ด้วย นี่คือ
พื้นผิว embedding ทั่วไปสำหรับการสร้างเวกเตอร์ที่ใช้ซ้ำได้ การค้นหา memory
สามารถใช้พื้นผิวผู้ให้บริการทั่วไปนี้ได้ seam รุ่นเก่า
`api.registerMemoryEmbeddingProvider(...)` และ
`contracts.memoryEmbeddingProviders` เป็นความเข้ากันได้ที่เลิกใช้แล้วในขณะที่
ผู้ให้บริการเฉพาะ memory ที่มีอยู่กำลังย้ายไปใช้แบบใหม่

ผู้ให้บริการเฉพาะ memory ที่ยังคงเปิดเผย runtime `batchEmbed(...)` จะอยู่บน
สัญญาการแบ่ง batch ต่อไฟล์ที่มีอยู่ เว้นแต่ runtime ของผู้ให้บริการนั้นจะตั้งค่า
`sourceWideBatchEmbed: true` อย่างชัดเจน การเลือกใช้นั้นทำให้ host ของ memory ส่ง chunk จาก
ไฟล์ memory ที่เปลี่ยนแปลงหลายไฟล์และแหล่งที่เปิดใช้งานได้ในการเรียก `batchEmbed(...)` ครั้งเดียว
จนถึงขีดจำกัด batch ของ host อะแดปเตอร์ batch ที่อัปโหลดไฟล์คำขอ JSONL ต้อง
แยกงานของผู้ให้บริการก่อนถึงเพดานขนาดอัปโหลดและเพดานจำนวนคำขอด้วย
ผู้ให้บริการต้องส่งคืน embedding หนึ่งรายการต่อ chunk อินพุตในลำดับเดียวกับ
`batch.chunks`; ไม่ต้องใส่ flag เมื่อผู้ให้บริการคาดหวัง batch ภายในไฟล์เดียว
หรือไม่สามารถรักษาลำดับอินพุตข้ามงานที่กว้างครอบคลุมหลายแหล่งได้

### เครื่องมือและคำสั่ง

ใช้ [`defineToolPlugin`](/th/plugins/tool-plugins) สำหรับ Plugin แบบเครื่องมืออย่างเดียวที่เรียบง่าย
พร้อมชื่อเครื่องมือคงที่ ใช้ `api.registerTool(...)` โดยตรงสำหรับ Plugin แบบผสม
หรือการลงทะเบียนเครื่องมือแบบไดนามิกเต็มรูปแบบ

| เมธอด                          | สิ่งที่ลงทะเบียน                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | เครื่องมือของเอเจนต์ (จำเป็นหรือ `{ optional: true }`) |
| `api.registerCommand(def)`      | คำสั่งกำหนดเอง (ข้าม LLM)             |

คำสั่งของ Plugin สามารถตั้งค่า `agentPromptGuidance` ได้เมื่อเอเจนต์ต้องการคำใบ้การกำหนดเส้นทางสั้นๆ
ที่คำสั่งเป็นเจ้าของ ให้ข้อความนั้นเกี่ยวกับตัวคำสั่งเอง; อย่าเพิ่ม
นโยบายเฉพาะผู้ให้บริการหรือเฉพาะ Plugin ลงใน prompt builder ของแกนหลัก

รายการ guidance อาจเป็นสตริงแบบ legacy ซึ่งใช้กับทุกพื้นผิว prompt หรือ
เป็นรายการแบบมีโครงสร้าง:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` แบบมีโครงสร้างอาจมี `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` หรือ `subagent` `pi_main` ยังคงเป็น alias ที่เลิกใช้แล้ว
สำหรับ `openclaw_main` ละเว้น `surfaces` สำหรับ guidance ที่ตั้งใจให้ใช้กับทุกพื้นผิว อย่า
ส่งอาร์เรย์ `surfaces` ว่าง; ระบบจะปฏิเสธเพื่อไม่ให้การสูญเสียขอบเขตโดยไม่ตั้งใจ
กลายเป็นข้อความ prompt แบบทั่วโลก

คำสั่ง developer ของ native Codex app-server เข้มงวดกว่าพื้นผิว prompt อื่น:
เฉพาะ guidance ที่กำหนดขอบเขตไปยัง `codex_app_server` อย่างชัดเจนเท่านั้นที่จะถูกยกระดับเข้าสู่
เลนที่มีลำดับความสำคัญสูงกว่านั้น guidance แบบสตริง legacy และ guidance แบบมีโครงสร้างที่ไม่กำหนดขอบเขต
ยังคงพร้อมใช้งานกับพื้นผิว prompt ที่ไม่ใช่ Codex เพื่อความเข้ากันได้

### โครงสร้างพื้นฐาน

| เมธอด                                         | สิ่งที่ลงทะเบียน                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | ฮุกเหตุการณ์                              |
| `api.registerHttpRoute(params)`                | endpoint HTTP ของ Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | เมธอด RPC ของ Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | ตัวประกาศการค้นพบ Gateway ในเครื่อง      |
| `api.registerCli(registrar, opts?)`            | คำสั่งย่อย CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI ฟีเจอร์ Node ภายใต้ `openclaw nodes` |
| `api.registerService(service)`                 | บริการเบื้องหลัง                      |
| `api.registerInteractiveHandler(registration)` | ตัวจัดการแบบโต้ตอบ                     |
| `api.registerAgentToolResultMiddleware(...)`   | middleware ผลลัพธ์เครื่องมือของ runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | ส่วน prompt เสริมที่อยู่ข้างเคียง memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus เสริมสำหรับค้นหา/อ่าน memory      |

### ฮุก host สำหรับ Plugin เวิร์กโฟลว์

ฮุก host คือ seam ของ SDK สำหรับ Plugin ที่ต้องเข้าร่วมในวงจรชีวิตของ host
แทนที่จะเพิ่มเพียงผู้ให้บริการ ช่องทาง หรือเครื่องมือเท่านั้น สิ่งเหล่านี้เป็น
สัญญาทั่วไป; โหมดแผนสามารถใช้ได้ แต่เวิร์กโฟลว์การอนุมัติ,
ด่านนโยบาย workspace, มอนิเตอร์เบื้องหลัง, วิซาร์ดตั้งค่า และ Plugin คู่หู UI
ก็ใช้ได้เช่นกัน

| วิธีการ                                                                              | สัญญาที่เป็นเจ้าของ                                                                                                                |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | สถานะเซสชันที่ Plugin เป็นเจ้าของและเข้ากันได้กับ JSON ซึ่งฉายผ่านเซสชันของ Gateway                                                |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | บริบทที่ทนทานแบบดำเนินการครั้งเดียวพอดี ซึ่งถูกแทรกเข้าไปในรอบถัดไปของเอเจนต์สำหรับหนึ่งเซสชัน                                      |
| `api.registerTrustedToolPolicy(...)`                                                 | นโยบายเครื่องมือที่เชื่อถือได้ก่อนถึง Plugin ซึ่งถูกควบคุมด้วยแมนิเฟสต์ และสามารถบล็อกหรือเขียนพารามิเตอร์เครื่องมือใหม่ได้          |
| `api.registerToolMetadata(...)`                                                      | เมตาดาทาการแสดงผลแค็ตตาล็อกเครื่องมือโดยไม่เปลี่ยนการใช้งานเครื่องมือ                                                             |
| `api.registerCommand(...)`                                                           | คำสั่ง Plugin แบบมีขอบเขต; ผลลัพธ์ของคำสั่งสามารถตั้งค่า `continueAgent: true`; คำสั่งเนทีฟของ Discord รองรับ `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | ตัวบรรยายการมีส่วนร่วมของ Control UI สำหรับพื้นผิวเซสชัน เครื่องมือ การรัน หรือการตั้งค่า                                            |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | คอลแบ็กการล้างข้อมูลสำหรับทรัพยากรรันไทม์ที่ Plugin เป็นเจ้าของบนเส้นทางรีเซ็ต/ลบ/โหลดซ้ำ                                           |
| `api.agent.events.registerAgentEventSubscription(...)`                               | การสมัครรับอีเวนต์ที่ผ่านการทำให้ปลอดภัยสำหรับสถานะเวิร์กโฟลว์และมอนิเตอร์                                                          |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | สถานะชั่วคราวต่อการรันของ Plugin ที่ถูกล้างเมื่อวงจรชีวิตการรันสิ้นสุด                                                              |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | เมตาดาทาการล้างข้อมูลสำหรับงานตัวจัดกำหนดการที่ Plugin เป็นเจ้าของ; ไม่ได้จัดกำหนดการงานหรือสร้างระเบียนงาน                         |
| `api.session.workflow.sendSessionAttachment(...)`                                    | การส่งไฟล์แนบผ่านโฮสต์สำหรับแบบ bundled-only ไปยังเส้นทางเซสชัน direct-outbound ที่ใช้งานอยู่                                        |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | รอบเซสชันตามกำหนดเวลาแบบ bundled-only ที่หนุนด้วย Cron พร้อมการล้างข้อมูลตามแท็ก                                                     |
| `api.session.controls.registerSessionAction(...)`                                    | แอ็กชันเซสชันแบบมีชนิดที่ไคลเอนต์สามารถส่งผ่าน Gateway ได้                                                                          |

ใช้ namespace แบบจัดกลุ่มสำหรับโค้ด Plugin ใหม่:

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

เมธอดแบบแบนที่เทียบเท่ายังคงพร้อมใช้งานเป็น alias ความเข้ากันได้ที่เลิกแนะนำแล้ว
สำหรับ Plugin ที่มีอยู่ ห้ามเพิ่มโค้ด Plugin ใหม่ที่เรียก
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` หรือ
`api.unscheduleSessionTurnsByTag` โดยตรง

`scheduleSessionTurn(...)` เป็นความสะดวกในขอบเขตเซสชันเหนือ
ตัวจัดกำหนดการ Cron ของ Gateway Cron เป็นเจ้าของเรื่องเวลาและสร้างระเบียนงานเบื้องหลังเมื่อ
รอบทำงาน; Plugin SDK จำกัดเฉพาะเซสชันเป้าหมาย การตั้งชื่อที่ Plugin เป็นเจ้าของ
และการล้างข้อมูล ใช้ `api.runtime.tasks.managedFlows` ภายในรอบที่ถูกจัดกำหนดการ
เมื่องานนั้นเองต้องการสถานะ Task Flow หลายขั้นตอนที่ทนทาน

สัญญาแยกอำนาจโดยตั้งใจ:

- Plugin ภายนอกสามารถเป็นเจ้าของส่วนขยายเซสชัน ตัวบรรยาย UI คำสั่ง เมตาดาทา
  เครื่องมือ การแทรกรอบถัดไป และ hook ปกติ
- นโยบายเครื่องมือที่เชื่อถือได้จะทำงานก่อน hook `before_tool_call` ทั่วไป และเป็น
  สิ่งที่โฮสต์เชื่อถือ นโยบายแบบ bundled จะทำงานก่อน; นโยบายของ Plugin ที่ติดตั้งต้องมี
  การเปิดใช้งานอย่างชัดเจนพร้อม id ภายในของตนใน
  `contracts.trustedToolPolicies` และทำงานถัดไปตามลำดับการโหลด Plugin id ของนโยบาย
  จะถูกกำหนดขอบเขตอยู่กับ Plugin ที่ลงทะเบียน
- การเป็นเจ้าของคำสั่งที่สงวนไว้เป็นแบบ bundled-only Plugin ภายนอกควรใช้ชื่อคำสั่ง
  หรือ alias ของตนเอง
- `allowPromptInjection=false` ปิดใช้งาน hook ที่แก้ไขพรอมป์ รวมถึง
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  ฟิลด์พรอมป์จาก `before_agent_start` แบบเดิม และ
  `enqueueNextTurnInjection`

ตัวอย่างของผู้ใช้ที่ไม่ใช่ Plan:

| รูปแบบ Plugin                 | hook ที่ใช้                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| เวิร์กโฟลว์การอนุมัติ          | ส่วนขยายเซสชัน การดำเนินคำสั่งต่อ การแทรกรอบถัดไป ตัวบรรยาย UI                                                                      |
| ประตูตรวจนโยบายงบประมาณ/เวิร์กสเปซ | นโยบายเครื่องมือที่เชื่อถือได้ เมตาดาทาเครื่องมือ การฉายเซสชัน                                                                        |
| มอนิเตอร์วงจรชีวิตเบื้องหลัง  | การล้างข้อมูลวงจรชีวิตรันไทม์ การสมัครรับอีเวนต์เอเจนต์ การเป็นเจ้าของ/ล้างข้อมูลงานตัวจัดกำหนดการเซสชัน การมีส่วนร่วมพรอมป์ Heartbeat ตัวบรรยาย UI |
| ตัวช่วยตั้งค่าหรือเริ่มใช้งาน  | ส่วนขยายเซสชัน คำสั่งแบบมีขอบเขต ตัวบรรยาย Control UI                                                                                |

<Note>
  namespace ผู้ดูแลระบบแกนหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) จะยังคงเป็น `operator.admin` เสมอ แม้ว่า Plugin จะพยายามกำหนด
  ขอบเขตเมธอด Gateway ที่แคบกว่า ควรใช้คำนำหน้าเฉพาะ Plugin สำหรับ
  เมธอดที่ Plugin เป็นเจ้าของ
</Note>

<Accordion title="ควรใช้มิดเดิลแวร์ผลลัพธ์เครื่องมือเมื่อใด">
  Plugin แบบ bundled และ Plugin ที่ติดตั้งซึ่งเปิดใช้งานอย่างชัดเจนพร้อมสัญญา
  แมนิเฟสต์ที่ตรงกัน สามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อ
  ต้องเขียนผลลัพธ์เครื่องมือใหม่หลังการดำเนินการและก่อนที่รันไทม์
  จะป้อนผลลัพธ์นั้นกลับเข้าโมเดล นี่คือ seam ที่รันไทม์เชื่อถือและเป็นกลาง
  สำหรับตัวลดเอาต์พุตแบบ async เช่น tokenjuice

Plugin ต้องประกาศ `contracts.agentToolResultMiddleware` สำหรับรันไทม์เป้าหมายแต่ละตัว
เช่น `["openclaw", "codex"]` Plugin ที่ติดตั้งซึ่งไม่มีสัญญานั้น
หรือไม่มีการเปิดใช้งานอย่างชัดเจน จะไม่สามารถลงทะเบียนมิดเดิลแวร์นี้ได้; ให้ใช้
hook Plugin ของ OpenClaw ตามปกติสำหรับงานที่ไม่ต้องการจังหวะผลลัพธ์เครื่องมือก่อนถึงโมเดล
เส้นทางการลงทะเบียน factory ส่วนขยายแบบเดิมที่ใช้ได้เฉพาะ embedded-runner
ถูกลบออกแล้ว
</Accordion>

### การลงทะเบียนการค้นพบ Gateway

`api.registerGatewayDiscoveryService(...)` ให้ Plugin ประกาศ Gateway ที่ใช้งานอยู่
บนทรานสปอร์ตการค้นพบภายในเครื่อง เช่น mDNS/Bonjour OpenClaw เรียก
บริการนี้ระหว่างการเริ่มต้น Gateway เมื่อเปิดใช้การค้นพบภายในเครื่อง ส่งผ่าน
พอร์ต Gateway ปัจจุบันและข้อมูลใบ้ TXT ที่ไม่ใช่ความลับ และเรียก handler
`stop` ที่ส่งคืนระหว่างการปิด Gateway

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
การยืนยันตัวตน การค้นพบเป็นเพียงใบ้สำหรับการกำหนดเส้นทาง; การยืนยันตัวตนของ Gateway และการ pinning TLS
ยังคงเป็นเจ้าของความไว้วางใจ

### เมตาดาทาการลงทะเบียน CLI

`api.registerCli(registrar, opts?)` รับเมตาดาทาคำสั่งสองชนิด:

- `commands`: ชื่อคำสั่งแบบชัดเจนที่ registrar เป็นเจ้าของ
- `descriptors`: ตัวบรรยายคำสั่งขณะแยกวิเคราะห์ที่ใช้สำหรับความช่วยเหลือ CLI,
  การกำหนดเส้นทาง และการลงทะเบียน CLI ของ Plugin แบบ lazy
- `parentPath`: เส้นทางคำสั่งแม่แบบไม่บังคับสำหรับกลุ่มคำสั่งซ้อน เช่น
  `["nodes"]`

สำหรับฟีเจอร์ paired-node ควรใช้
`api.registerNodeCliFeature(registrar, opts?)` นี่เป็น wrapper ขนาดเล็กรอบ
`api.registerCli(..., { parentPath: ["nodes"] })` และทำให้คำสั่งอย่าง
`openclaw nodes canvas` เป็นฟีเจอร์โหนดที่ Plugin เป็นเจ้าของอย่างชัดเจน

หากต้องการให้คำสั่ง Plugin ยังคงโหลดแบบ lazy ในเส้นทาง CLI รากปกติ
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

ใช้ `commands` เพียงอย่างเดียวเฉพาะเมื่อไม่ต้องการการลงทะเบียน CLI รากแบบ lazy
เส้นทางความเข้ากันได้แบบ eager นั้นยังคงรองรับ แต่จะไม่ติดตั้ง
placeholder ที่หนุนด้วย descriptor สำหรับการโหลดแบบ lazy ขณะแยกวิเคราะห์

### การลงทะเบียนแบ็กเอนด์ CLI

`api.registerCliBackend(...)` ให้ Plugin เป็นเจ้าของ config ค่าเริ่มต้นสำหรับแบ็กเอนด์
AI CLI ภายในเครื่อง เช่น `claude-cli` หรือ `my-cli`

- `id` ของแบ็กเอนด์จะกลายเป็นคำนำหน้าผู้ให้บริการใน model ref เช่น `my-cli/gpt-5`
- `config` ของแบ็กเอนด์ใช้รูปทรงเดียวกับ `agents.defaults.cliBackends.<id>`
- config ของผู้ใช้ยังคงชนะ OpenClaw รวม `agents.defaults.cliBackends.<id>` ทับ
  ค่าเริ่มต้นของ Plugin ก่อนรัน CLI
- ใช้ `normalizeConfig` เมื่อแบ็กเอนด์ต้องการการเขียนใหม่เพื่อความเข้ากันได้หลัง merge
  (เช่น การปรับรูปทรง flag แบบเก่าให้เป็นปกติ)
- ใช้ `resolveExecutionArgs` สำหรับการเขียน argv ใหม่ในขอบเขตคำขอที่เป็นของ
  dialect ของ CLI เช่น การแมประดับ thinking ของ OpenClaw ไปยัง flag effort
  เนทีฟ hook จะได้รับ `ctx.executionMode`; ใช้ `"side-question"` เพื่อเพิ่ม
  flag การแยกแบบเนทีฟของแบ็กเอนด์สำหรับการเรียก `/btw` ชั่วคราว หาก flag เหล่านั้น
  ปิดเครื่องมือเนทีฟได้อย่างเชื่อถือได้สำหรับ CLI ที่มิฉะนั้นจะเปิดอยู่เสมอ ให้ประกาศ
  `sideQuestionToolMode: "disabled"` ด้วย

สำหรับคู่มือการเขียนแบบครบวงจร โปรดดู
[Plugin แบ็กเอนด์ CLI](/th/plugins/cli-backend-plugins)

### สล็อตพิเศษ

| วิธีการ                                     | สิ่งที่ลงทะเบียน                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | เอนจินบริบท (ใช้งานได้ครั้งละหนึ่งรายการ) คอลแบ็กวงจรชีวิตจะได้รับ `runtimeSettings` เมื่อโฮสต์สามารถให้การวินิจฉัยโมเดล/ผู้ให้บริการ/โหมดได้ เอนจินแบบเข้มงวดรุ่นเก่าจะถูกลองใหม่โดยไม่มีคีย์นั้น |
| `api.registerMemoryCapability(capability)` | ความสามารถด้านหน่วยความจำแบบรวมศูนย์                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | ตัวสร้างส่วนพรอมป์หน่วยความจำ                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | ตัวแก้แผนล้างหน่วยความจำ                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | อะแดปเตอร์รันไทม์หน่วยความจำ                                                                                                                                                                             |

### อะแดปเตอร์ฝังหน่วยความจำที่เลิกใช้แล้ว

| วิธีการ                                         | สิ่งที่ลงทะเบียน                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | อะแดปเตอร์ฝังหน่วยความจำสำหรับ Plugin ที่ใช้งานอยู่ |

- `registerMemoryCapability` เป็น API เฉพาะสำหรับ Plugin หน่วยความจำที่แนะนำ
- `registerMemoryCapability` ยังอาจเปิดเผย `publicArtifacts.listArtifacts(...)`
  เพื่อให้ Plugin คู่กันสามารถใช้ artifact หน่วยความจำที่ส่งออกผ่าน
  `openclaw/plugin-sdk/memory-host-core` แทนการเข้าไปแตะโครงร่างส่วนตัวของ
  Plugin หน่วยความจำเฉพาะรายการ
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` และ
  `registerMemoryRuntime` เป็น API เฉพาะสำหรับ Plugin หน่วยความจำที่เข้ากันได้กับระบบเดิม
- `MemoryFlushPlan.model` สามารถตรึงรอบการล้างไว้กับอ้างอิง `provider/model`
  ที่แน่นอนได้ เช่น `ollama/qwen3:8b` โดยไม่สืบทอดเชน fallback ที่ใช้งานอยู่
- `registerMemoryEmbeddingProvider` เลิกใช้แล้ว ผู้ให้บริการ embedding รายใหม่
  ควรใช้ `api.registerEmbeddingProvider(...)` และ
  `contracts.embeddingProviders`
- ผู้ให้บริการเฉพาะหน่วยความจำที่มีอยู่ยังคงทำงานต่อในช่วงหน้าต่างการย้ายระบบ
  แต่รายงานการตรวจสอบ Plugin จะระบุสิ่งนี้เป็นหนี้ความเข้ากันได้สำหรับ
  Plugin ที่ไม่ได้บันเดิลมา

### เหตุการณ์และวงจรชีวิต

| วิธีการ                                       | สิ่งที่ทำ                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | ฮุกวงจรชีวิตแบบมีชนิด          |
| `api.onConversationBindingResolved(handler)` | คอลแบ็กการแก้การผูกบทสนทนา |

ดู [ฮุก Plugin](/th/plugins/hooks) สำหรับตัวอย่าง ชื่อฮุกทั่วไป และ
ความหมายของ guard

### ความหมายของการตัดสินใจในฮุก

`before_install` เป็นฮุกวงจรชีวิตของรันไทม์ Plugin ไม่ใช่พื้นผิวนโยบายการติดตั้ง
ของผู้ปฏิบัติการ ใช้ `security.installPolicy` เมื่อต้องให้การตัดสินใจอนุญาต/บล็อก
ครอบคลุมเส้นทางติดตั้งหรืออัปเดตผ่าน CLI และ Gateway

- `before_tool_call`: การคืนค่า `{ block: true }` เป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: การคืนค่า `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `block`) ไม่ใช่การแทนที่
- `before_install`: การคืนค่า `{ block: true }` เป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: การคืนค่า `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `block`) ไม่ใช่การแทนที่
- `reply_dispatch`: การคืนค่า `{ handled: true, ... }` เป็นจุดสิ้นสุด เมื่อ handler ใดอ้างสิทธิ์การส่งแล้ว handler ที่มีลำดับความสำคัญต่ำกว่าและเส้นทางส่งค่าเริ่มต้นของโมเดลจะถูกข้าม
- `message_sending`: การคืนค่า `{ cancel: true }` เป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: การคืนค่า `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `cancel`) ไม่ใช่การแทนที่
- `message_received`: ใช้ฟิลด์แบบมีชนิด `threadId` เมื่อคุณต้องกำหนดเส้นทางเธรด/หัวข้อขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเสริมเฉพาะช่องทาง
- `message_sending`: ใช้ฟิลด์กำหนดเส้นทางแบบมีชนิด `replyToId` / `threadId` ก่อน fallback ไปยัง `metadata` เฉพาะช่องทาง
- `gateway_start`: ใช้ `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับสถานะเริ่มต้นที่ Gateway เป็นเจ้าของ แทนการพึ่งพาฮุกภายใน `gateway:startup`
- `cron_changed`: สังเกตการเปลี่ยนแปลงวงจรชีวิต Cron ที่ Gateway เป็นเจ้าของ ใช้ `event.job?.state?.nextRunAtMs` และ `ctx.getCron?.()` เมื่อซิงก์ตัวจัดกำหนดการปลุกภายนอก และคงให้ OpenClaw เป็นแหล่งความจริงสำหรับการตรวจสอบกำหนดครบและการดำเนินการ

### ฟิลด์ออบเจ็กต์ API

| ฟิลด์                    | ชนิด                      | คำอธิบาย                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | รหัส Plugin                                                                                   |
| `api.name`               | `string`                  | ชื่อที่แสดง                                                                                |
| `api.version`            | `string?`                 | เวอร์ชัน Plugin (ไม่บังคับ)                                                                   |
| `api.description`        | `string?`                 | คำอธิบาย Plugin (ไม่บังคับ)                                                               |
| `api.source`             | `string`                  | พาธแหล่งที่มาของ Plugin                                                                          |
| `api.rootDir`            | `string?`                 | ไดเรกทอรีรากของ Plugin (ไม่บังคับ)                                                            |
| `api.config`             | `OpenClawConfig`          | สแนปชอต config ปัจจุบัน (สแนปชอตรันไทม์ในหน่วยความจำที่ใช้งานอยู่เมื่อมีให้ใช้)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | config เฉพาะ Plugin จาก `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [ตัวช่วยรันไทม์](/th/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | logger แบบจำกัดขอบเขต (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือหน้าต่างเริ่มต้น/ตั้งค่าแบบเบาก่อนเข้า entry เต็ม |
| `api.resolvePath(input)` | `(string) => string`      | แก้พาธโดยอิงจากรากของ Plugin                                                        |

## ข้อตกลงของโมดูลภายใน

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในสำหรับการนำเข้า:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  ห้ามนำเข้า Plugin ของคุณเองผ่าน `openclaw/plugin-sdk/<your-plugin>`
  จากโค้ด production ให้กำหนดเส้นทางการนำเข้าภายในผ่าน `./api.ts` หรือ
  `./runtime-api.ts` พาธ SDK เป็นสัญญาภายนอกเท่านั้น
</Warning>

พื้นผิวสาธารณะของ Plugin ที่บันเดิลมาและโหลดผ่าน facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` และไฟล์ entry สาธารณะที่คล้ายกัน) จะเลือกใช้
สแนปชอต config ของรันไทม์ที่ใช้งานอยู่เมื่อ OpenClaw กำลังทำงานอยู่ หากยังไม่มี
สแนปชอตรันไทม์ ก็จะ fallback ไปยังไฟล์ config ที่แก้พาธแล้วบนดิสก์
facade ของ Plugin ที่บันเดิลและแพ็กเกจแล้วควรถูกโหลดผ่านตัวโหลด facade ของ Plugin
ของ OpenClaw การนำเข้าโดยตรงจาก `dist/extensions/...` จะข้าม manifest
และการตรวจสอบ sidecar ของรันไทม์ที่การติดตั้งแบบแพ็กเกจใช้สำหรับโค้ดที่ Plugin เป็นเจ้าของ

Plugin ผู้ให้บริการสามารถเปิดเผย barrel สัญญาแบบแคบที่อยู่ภายใน Plugin ได้เมื่อ
ตัวช่วยนั้นตั้งใจให้เฉพาะกับผู้ให้บริการและยังไม่ควรอยู่ใน subpath SDK แบบทั่วไป
ตัวอย่างที่บันเดิลมา:

- **Anthropic**: seam สาธารณะ `api.ts` / `contract-api.ts` สำหรับตัวช่วยสตรีม
  beta-header ของ Claude และ `service_tier`
- **`@openclaw/openai-provider`**: `api.ts` ส่งออกตัวสร้างผู้ให้บริการ
  ตัวช่วยโมเดลค่าเริ่มต้น และตัวสร้างผู้ให้บริการ realtime
- **`@openclaw/openrouter-provider`**: `api.ts` ส่งออกตัวสร้างผู้ให้บริการ
  พร้อมตัวช่วย onboarding/config

<Warning>
  โค้ด production ของส่วนขยายควรหลีกเลี่ยงการนำเข้า `openclaw/plugin-sdk/<other-plugin>`
  เช่นกัน หากตัวช่วยนั้นใช้ร่วมกันจริง ให้ยกระดับไปยัง subpath SDK ที่เป็นกลาง
  เช่น `openclaw/plugin-sdk/speech`, `.../provider-model-shared` หรือพื้นผิว
  ที่มุ่งตามความสามารถอื่น แทนการผูก Plugin สองรายการเข้าด้วยกัน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/th/plugins/sdk-entrypoints">
    ตัวเลือก `definePluginEntry` และ `defineChannelPluginEntry`
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/th/plugins/sdk-runtime">
    อ้างอิง namespace `api.runtime` ฉบับเต็ม
  </Card>
  <Card title="Setup and config" icon="sliders" href="/th/plugins/sdk-setup">
    การแพ็กเกจ manifest และสคีมา config
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
