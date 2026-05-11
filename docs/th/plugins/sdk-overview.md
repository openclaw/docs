---
read_when:
    - คุณต้องทราบว่าควรนำเข้าจากเส้นทางย่อยใดของ SDK
    - คุณต้องการเอกสารอ้างอิงสำหรับเมธอดการลงทะเบียนทั้งหมดใน OpenClawPluginApi
    - คุณกำลังค้นหารายการส่งออกเฉพาะรายการหนึ่งของ SDK
sidebarTitle: Plugin SDK overview
summary: แมปการนำเข้า, เอกสารอ้างอิง API สำหรับการลงทะเบียน และสถาปัตยกรรม SDK
title: ภาพรวม Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:35:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK คือสัญญาแบบมีชนิดข้อมูลระหว่าง Plugin กับแกนหลัก หน้านี้คือ
เอกสารอ้างอิงสำหรับ **สิ่งที่ต้อง import** และ **สิ่งที่คุณสามารถลงทะเบียนได้**

<Note>
  หน้านี้สำหรับผู้เขียน Plugin ที่ใช้ `openclaw/plugin-sdk/*` ภายใน
  OpenClaw สำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
  ที่ต้องการเรียกใช้เอเจนต์ผ่าน Gateway ให้ใช้
  [OpenClaw App SDK](/th/concepts/openclaw-sdk) และแพ็กเกจ `@openclaw/sdk`
  แทน
</Note>

<Tip>
กำลังมองหาคู่มือแบบทำตามขั้นตอนอยู่หรือไม่ เริ่มที่ [การสร้าง Plugin](/th/plugins/building-plugins), ใช้ [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) สำหรับ Plugin ช่องทาง, [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) สำหรับ Plugin ผู้ให้บริการ, [Plugin แบ็กเอนด์ CLI](/th/plugins/cli-backend-plugins) สำหรับแบ็กเอนด์ CLI AI ภายในเครื่อง และ [ฮุกของ Plugin](/th/plugins/hooks) สำหรับ Plugin ที่เป็นฮุกเครื่องมือหรือวงจรชีวิต
</Tip>

## ข้อตกลงการ import

ให้ import จาก subpath ที่เฉพาะเจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

แต่ละ subpath เป็นโมดูลขนาดเล็กที่อยู่ได้ด้วยตัวเอง วิธีนี้ช่วยให้การเริ่มต้นรวดเร็วและ
ป้องกันปัญหา dependency แบบวนซ้ำ สำหรับ helper การเข้าใช้งาน/การสร้างเฉพาะช่องทาง
ให้เลือกใช้ `openclaw/plugin-sdk/channel-core`; เก็บ `openclaw/plugin-sdk/core` ไว้สำหรับ
พื้นผิวรวมที่กว้างกว่าและ helper ที่ใช้ร่วมกัน เช่น
`buildChannelConfigSchema`

สำหรับ config ของช่องทาง ให้เผยแพร่ JSON Schema ที่ช่องทางเป็นเจ้าของผ่าน
`openclaw.plugin.json#channelConfigs` subpath `plugin-sdk/channel-config-schema`
มีไว้สำหรับ primitive ของ schema ที่ใช้ร่วมกันและตัวสร้างทั่วไป Plugin ที่มาพร้อมกับ OpenClaw
ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ schema ของช่องทางที่มาพร้อมระบบซึ่งยังคงเก็บไว้
export เพื่อความเข้ากันได้ที่เลิกใช้แล้วยังคงอยู่บน
`plugin-sdk/channel-config-schema-legacy`; subpath schema ที่มาพร้อมระบบทั้งสองไม่ใช่
รูปแบบสำหรับ Plugin ใหม่

<Warning>
  อย่า import seam อำนวยความสะดวกที่ติดแบรนด์ผู้ให้บริการหรือช่องทาง (เช่น
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)
  Plugin ที่มาพร้อมระบบประกอบ subpath SDK ทั่วไปไว้ภายใน barrel `api.ts` /
  `runtime-api.ts` ของตนเอง; ผู้ใช้แกนหลักควรใช้ barrel ภายใน Plugin เหล่านั้น
  หรือเพิ่มสัญญา SDK ทั่วไปแบบแคบเมื่อความจำเป็นนั้นเป็นแบบข้ามช่องทางจริงๆ

seam helper ของ Plugin ที่มาพร้อมระบบชุดเล็กๆ ยังปรากฏใน export
map ที่สร้างขึ้นเมื่อมีการติดตามการใช้งานของเจ้าของอยู่ สิ่งเหล่านี้มีไว้สำหรับการบำรุงรักษา Plugin
ที่มาพร้อมระบบเท่านั้น และไม่ใช่เส้นทาง import ที่แนะนำสำหรับ Plugin บุคคลที่สามใหม่

`openclaw/plugin-sdk/discord` และ `openclaw/plugin-sdk/telegram-account` ยังถูกเก็บไว้เป็น facade เพื่อความเข้ากันได้
ที่เลิกใช้แล้วสำหรับการใช้งานของเจ้าของที่มีการติดตามอยู่ อย่า
คัดลอกเส้นทาง import เหล่านั้นไปยัง Plugin ใหม่; ให้ใช้ helper runtime ที่ฉีดเข้ามาและ
subpath SDK ช่องทางทั่วไปแทน
</Warning>

## เอกสารอ้างอิง subpath

Plugin SDK ถูกเปิดเผยเป็นชุด subpath แบบแคบที่จัดกลุ่มตามพื้นที่ (การเข้าใช้งาน Plugin,
ช่องทาง, ผู้ให้บริการ, การยืนยันตัวตน, runtime, ความสามารถ, หน่วยความจำ และ helper
ของ Plugin ที่มาพร้อมระบบที่สงวนไว้) สำหรับแค็ตตาล็อกทั้งหมด ซึ่งจัดกลุ่มและลิงก์ไว้แล้ว โปรดดู
[subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)

บัญชีรายการ entrypoint ของคอมไพเลอร์อยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package export ถูกสร้างจาก
ชุดสาธารณะหลังจากลบ subpath สำหรับทดสอบ/ภายในที่ใช้เฉพาะใน repo ซึ่งระบุไว้ใน
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` เรียกใช้
`pnpm plugin-sdk:surface` เพื่อตรวจนับจำนวน export สาธารณะ subpath สาธารณะที่เลิกใช้แล้ว
ซึ่งเก่าพอและไม่ได้ถูกใช้โดยโค้ด production ของส่วนขยายที่มาพร้อมระบบ
จะถูกติดตามใน `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel re-export
ที่เลิกใช้แล้วแบบกว้างจะถูกติดตามใน
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`

## API การลงทะเบียน

callback `register(api)` ได้รับอ็อบเจ็กต์ `OpenClawPluginApi` พร้อมเมธอดเหล่านี้:

### การลงทะเบียนความสามารถ

| เมธอด                                           | สิ่งที่ลงทะเบียน                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | การอนุมานข้อความ (LLM)                  |
| `api.registerAgentHarness(...)`                  | ตัวดำเนินการเอเจนต์ระดับต่ำแบบทดลอง |
| `api.registerCliBackend(...)`                    | แบ็กเอนด์การอนุมาน CLI ภายในเครื่อง           |
| `api.registerChannel(...)`                       | ช่องทางส่งข้อความ                     |
| `api.registerSpeechProvider(...)`                | การสังเคราะห์ข้อความเป็นเสียง / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | การถอดเสียงแบบเรียลไทม์ชนิดสตรีม      |
| `api.registerRealtimeVoiceProvider(...)`         | เซสชันเสียงแบบเรียลไทม์สองทาง        |
| `api.registerMediaUnderstandingProvider(...)`    | การวิเคราะห์รูปภาพ/เสียง/วิดีโอ            |
| `api.registerImageGenerationProvider(...)`       | การสร้างรูปภาพ                      |
| `api.registerMusicGenerationProvider(...)`       | การสร้างเพลง                      |
| `api.registerVideoGenerationProvider(...)`       | การสร้างวิดีโอ                      |
| `api.registerWebFetchProvider(...)`              | ผู้ให้บริการดึงข้อมูลเว็บ / scrape           |
| `api.registerWebSearchProvider(...)`             | การค้นหาเว็บ                            |

### เครื่องมือและคำสั่ง

| เมธอด                          | สิ่งที่ลงทะเบียน                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | เครื่องมือของเอเจนต์ (จำเป็นหรือ `{ optional: true }`) |
| `api.registerCommand(def)`      | คำสั่งกำหนดเอง (ข้าม LLM)             |

คำสั่งของ Plugin สามารถตั้งค่า `agentPromptGuidance` ได้เมื่อเอเจนต์ต้องการคำใบ้
การกำหนดเส้นทางสั้นๆ ที่คำสั่งเป็นเจ้าของ ให้ข้อความนั้นเกี่ยวกับตัวคำสั่งเอง; อย่าเพิ่ม
นโยบายเฉพาะผู้ให้บริการหรือเฉพาะ Plugin ไปยังตัวสร้างพรอมต์ของแกนหลัก

### โครงสร้างพื้นฐาน

| เมธอด                                         | สิ่งที่ลงทะเบียน                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | ฮุกเหตุการณ์                              |
| `api.registerHttpRoute(params)`                | endpoint HTTP ของ Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | เมธอด RPC ของ Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | ตัวประกาศการค้นพบ Gateway ภายในเครื่อง      |
| `api.registerCli(registrar, opts?)`            | คำสั่งย่อย CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI ฟีเจอร์ Node ภายใต้ `openclaw nodes` |
| `api.registerService(service)`                 | บริการเบื้องหลัง                      |
| `api.registerInteractiveHandler(registration)` | handler แบบโต้ตอบ                     |
| `api.registerAgentToolResultMiddleware(...)`   | middleware ผลลัพธ์เครื่องมือ runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | ส่วนพรอมต์เสริมที่อยู่ใกล้หน่วยความจำแบบเพิ่มต่อ |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus ค้นหา/อ่านหน่วยความจำแบบเพิ่มต่อ      |

### ฮุกโฮสต์สำหรับ Plugin เวิร์กโฟลว์

ฮุกโฮสต์คือ seam ของ SDK สำหรับ Plugin ที่ต้องเข้าร่วมในวงจรชีวิตของโฮสต์
แทนที่จะเพิ่มเพียงผู้ให้บริการ ช่องทาง หรือเครื่องมือเท่านั้น สิ่งเหล่านี้เป็น
สัญญาทั่วไป; Plan Mode ใช้งานได้ และเวิร์กโฟลว์การอนุมัติ,
ประตูควบคุมนโยบาย workspace, ตัวตรวจสอบเบื้องหลัง, wizard การตั้งค่า และ Plugin คู่ข้าง UI
ก็ใช้งานได้เช่นกัน

| เมธอด                                                                               | สัญญาที่เป็นเจ้าของ                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | สถานะเซสชันที่ Plugin เป็นเจ้าของและเข้ากันได้กับ JSON ซึ่งฉายผ่านเซสชัน Gateway                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | บริบทแบบทนทานที่ฉีดเข้าไปยังเทิร์นถัดไปของเอเจนต์สำหรับหนึ่งเซสชันแบบ exactly-once                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | นโยบายเครื่องมือก่อน Plugin ที่มาพร้อมระบบ/เชื่อถือได้ ซึ่งสามารถบล็อกหรือเขียนพารามิเตอร์เครื่องมือใหม่ได้                                                      |
| `api.registerToolMetadata(...)`                                                      | metadata การแสดงผลแค็ตตาล็อกเครื่องมือโดยไม่เปลี่ยน implementation ของเครื่องมือ                                                            |
| `api.registerCommand(...)`                                                           | คำสั่ง Plugin แบบมีขอบเขต; ผลลัพธ์คำสั่งสามารถตั้งค่า `continueAgent: true`; คำสั่ง native ของ Discord รองรับ `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | descriptor การมีส่วนร่วมของ UI ควบคุมสำหรับพื้นผิวเซสชัน เครื่องมือ การรัน หรือการตั้งค่า                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | callback ทำความสะอาดสำหรับทรัพยากร runtime ที่ Plugin เป็นเจ้าของบนเส้นทาง reset/delete/reload                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | การสมัครรับเหตุการณ์ที่ผ่านการทำความสะอาดแล้วสำหรับสถานะเวิร์กโฟลว์และตัวตรวจสอบ                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | สถานะ scratch ของ Plugin ต่อการรัน ซึ่งถูกล้างเมื่อวงจรชีวิตการรันสิ้นสุด                                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | metadata ทำความสะอาดสำหรับงาน scheduler ที่ Plugin เป็นเจ้าของ; ไม่ schedule งานหรือสร้าง record งาน                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | การส่งไฟล์แนบที่โฮสต์เป็นตัวกลางสำหรับ Plugin ที่มาพร้อมระบบเท่านั้น ไปยังเส้นทางเซสชัน direct-outbound ที่ใช้งานอยู่                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | เทิร์นเซสชันตามกำหนดเวลาที่สำรองด้วย Cron สำหรับ Plugin ที่มาพร้อมระบบเท่านั้น พร้อมการทำความสะอาดตามแท็ก                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | action เซสชันแบบมีชนิดข้อมูลที่ client สามารถ dispatch ผ่าน Gateway                                                                    |

ใช้ namespace ที่จัดกลุ่มไว้สำหรับโค้ด Plugin ใหม่:

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

เมธอดแบบ flat ที่เทียบเท่ากันยังคงใช้งานได้เป็น alias เพื่อความเข้ากันได้
ที่เลิกใช้แล้วสำหรับ Plugin ที่มีอยู่ อย่าเพิ่มโค้ด Plugin ใหม่ที่เรียก
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, หรือ
`api.unscheduleSessionTurnsByTag` โดยตรง

`scheduleSessionTurn(...)` เป็นตัวช่วยระดับเซสชันบนตัวจัดกำหนดการ
Cron ของ Gateway Cron เป็นเจ้าของเวลาและสร้างเรกคอร์ดงานเบื้องหลังเมื่อ
turn ทำงาน ส่วน Plugin SDK เพียงจำกัดเซสชันเป้าหมาย การตั้งชื่อที่ Plugin
เป็นเจ้าของ และการล้างข้อมูล ใช้ `api.runtime.tasks.managedFlows` ภายใน
turn ที่ถูกจัดกำหนดการไว้เมื่องานนั้นเองต้องมีสถานะ TaskFlow หลายขั้นตอนที่คงทน

สัญญาแยกอำนาจโดยตั้งใจ:

- Plugin ภายนอกสามารถเป็นเจ้าของส่วนขยายเซสชัน ตัวอธิบาย UI คำสั่ง เมทาดาต้าเครื่องมือ
  การฉีด next-turn และ hook ปกติ
- นโยบายเครื่องมือที่เชื่อถือได้ทำงานก่อน hook `before_tool_call` ทั่วไป และเป็น
  bundled-only เพราะนโยบายเหล่านี้มีส่วนร่วมในนโยบายความปลอดภัยของโฮสต์
- ความเป็นเจ้าของคำสั่งที่สงวนไว้เป็น bundled-only Plugin ภายนอกควรใช้ชื่อคำสั่ง
  หรือ alias ของตนเอง
- `allowPromptInjection=false` ปิดใช้งาน hook ที่แก้ไข prompt รวมถึง
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  ฟิลด์ prompt จาก `before_agent_start` แบบเดิม และ
  `enqueueNextTurnInjection`

ตัวอย่างของผู้ใช้ที่ไม่ใช่ Plan:

| รูปแบบต้นแบบของ Plugin      | Hook ที่ใช้                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| เวิร์กโฟลว์การอนุมัติ        | ส่วนขยายเซสชัน การดำเนินคำสั่งต่อ การฉีด next-turn ตัวอธิบาย UI                                                                     |
| ประตูนโยบายงบประมาณ/พื้นที่ทำงาน | นโยบายเครื่องมือที่เชื่อถือได้ เมทาดาต้าเครื่องมือ การฉายภาพเซสชัน                                                                  |
| ตัวเฝ้าติดตามวงจรชีวิตเบื้องหลัง | การล้างข้อมูลวงจรชีวิตรันไทม์ การสมัครรับเหตุการณ์ agent ความเป็นเจ้าของ/การล้างข้อมูลตัวจัดกำหนดการเซสชัน การร่วมให้ prompt ของ Heartbeat ตัวอธิบาย UI |
| วิซาร์ดตั้งค่าหรือเริ่มต้นใช้งาน | ส่วนขยายเซสชัน คำสั่งแบบจำกัดขอบเขต ตัวอธิบาย Control UI                                                                            |

<Note>
  เนมสเปซผู้ดูแลระบบแกนหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) จะคงเป็น `operator.admin` เสมอ แม้ Plugin จะพยายามกำหนด
  ขอบเขตเมธอด gateway ที่แคบกว่า ควรใช้คำนำหน้าเฉพาะ Plugin สำหรับ
  เมธอดที่ Plugin เป็นเจ้าของ
</Note>

<Accordion title="ควรใช้มิดเดิลแวร์ผลลัพธ์เครื่องมือเมื่อใด">
  Plugin แบบ bundled สามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อ
  ต้องเขียนผลลัพธ์เครื่องมือใหม่หลังการทำงานและก่อนที่รันไทม์จะ
  ป้อนผลลัพธ์นั้นกลับเข้าโมเดล นี่คือรอยต่อที่เชื่อถือได้และไม่ผูกกับรันไทม์
  สำหรับตัวลดเอาต์พุตแบบ async เช่น tokenjuice

Plugin แบบ bundled ต้องประกาศ `contracts.agentToolResultMiddleware` สำหรับแต่ละ
รันไทม์เป้าหมาย เช่น `["pi", "codex"]` Plugin ภายนอก
ไม่สามารถลงทะเบียนมิดเดิลแวร์นี้ได้ ให้ใช้ hook ของ OpenClaw Plugin ตามปกติสำหรับงาน
ที่ไม่ต้องอาศัยจังหวะผลลัพธ์เครื่องมือก่อนเข้าโมเดล เส้นทางการลงทะเบียน factory
ส่วนขยายแบบฝังที่รองรับเฉพาะ Pi แบบเก่าถูกนำออกแล้ว
</Accordion>

### การลงทะเบียนการค้นพบ Gateway

`api.registerGatewayDiscoveryService(...)` ช่วยให้ Plugin โฆษณา Gateway ที่ใช้งานอยู่
บนการขนส่งการค้นพบภายในเครื่อง เช่น mDNS/Bonjour OpenClaw เรียกบริการนี้
ระหว่างการเริ่มต้น Gateway เมื่อเปิดใช้การค้นพบภายในเครื่อง ส่งพอร์ต Gateway
ปัจจุบันและข้อมูล hint TXT ที่ไม่ใช่ความลับ และเรียก handler `stop` ที่ส่งคืน
ระหว่างการปิด Gateway

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
การยืนยันตัวตน การค้นพบเป็นเพียง hint สำหรับการกำหนดเส้นทาง ส่วนความเชื่อถือยังคงอยู่ภายใต้
การยืนยันตัวตนของ Gateway และการ pin TLS

### เมทาดาต้าการลงทะเบียน CLI

`api.registerCli(registrar, opts?)` รับเมทาดาต้าคำสั่งสองประเภท:

- `commands`: ชื่อคำสั่งแบบชัดเจนที่ registrar เป็นเจ้าของ
- `descriptors`: ตัวอธิบายคำสั่งในช่วง parse ที่ใช้สำหรับความช่วยเหลือของ CLI
  การกำหนดเส้นทาง และการลงทะเบียน CLI ของ Plugin แบบ lazy
- `parentPath`: path คำสั่งแม่แบบไม่บังคับสำหรับกลุ่มคำสั่งซ้อน เช่น
  `["nodes"]`

สำหรับฟีเจอร์ paired-node ควรใช้
`api.registerNodeCliFeature(registrar, opts?)` ซึ่งเป็น wrapper ขนาดเล็กรอบ
`api.registerCli(..., { parentPath: ["nodes"] })` และทำให้คำสั่งอย่าง
`openclaw nodes canvas` เป็นฟีเจอร์ node ที่ Plugin เป็นเจ้าของอย่างชัดเจน

หากต้องการให้คำสั่ง Plugin โหลดแบบ lazy ใน path CLI รากปกติ
ให้ระบุ `descriptors` ที่ครอบคลุมรากคำสั่งระดับบนทั้งหมดที่ registrar นั้นเปิดเผย

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
เส้นทางความเข้ากันได้แบบ eager นั้นยังรองรับอยู่ แต่จะไม่ติดตั้ง
placeholder ที่อิง descriptor สำหรับการโหลดแบบ lazy ในช่วง parse

### การลงทะเบียนแบ็กเอนด์ CLI

`api.registerCliBackend(...)` ช่วยให้ Plugin เป็นเจ้าของค่า config เริ่มต้นสำหรับแบ็กเอนด์
AI CLI ภายในเครื่อง เช่น `codex-cli`

- `id` ของแบ็กเอนด์จะกลายเป็นคำนำหน้า provider ใน model ref อย่าง `codex-cli/gpt-5`
- `config` ของแบ็กเอนด์ใช้รูปทรงเดียวกับ `agents.defaults.cliBackends.<id>`
- config ของผู้ใช้ยังคงชนะ OpenClaw จะ merge `agents.defaults.cliBackends.<id>` ทับ
  ค่าเริ่มต้นของ Plugin ก่อนเรียกใช้ CLI
- ใช้ `normalizeConfig` เมื่อแบ็กเอนด์ต้องเขียนความเข้ากันได้ใหม่หลัง merge
  (เช่น normalize รูปทรง flag เก่า)
- ใช้ `resolveExecutionArgs` สำหรับการเขียน argv ใหม่ตามขอบเขตคำขอที่เป็นของ
  dialect ของ CLI เช่น การแมประดับ thinking ของ OpenClaw ไปยัง flag effort
  แบบ native

สำหรับคู่มือการเขียนแบบครบวงจร ดู
[Plugin แบ็กเอนด์ CLI](/th/plugins/cli-backend-plugins)

### ช่องพิเศษเฉพาะ

| เมธอด                                     | สิ่งที่ลงทะเบียน                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | context engine (ใช้งานได้ครั้งละหนึ่งตัว) callback `assemble()` จะได้รับ `availableTools` และ `citationsMode` เพื่อให้ engine ปรับแต่งส่วนเพิ่มของ prompt ได้ |
| `api.registerMemoryCapability(capability)` | ความสามารถหน่วยความจำแบบรวมศูนย์                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | ตัวสร้างส่วน prompt ของหน่วยความจำ                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | resolver ของแผน flush หน่วยความจำ                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | อะแดปเตอร์รันไทม์หน่วยความจำ                                                                                                                              |

### อะแดปเตอร์ embedding ของหน่วยความจำ

| เมธอด                                         | สิ่งที่ลงทะเบียน                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | อะแดปเตอร์ embedding หน่วยความจำสำหรับ Plugin ที่ใช้งานอยู่ |

- `registerMemoryCapability` คือ API Plugin หน่วยความจำแบบ exclusive ที่แนะนำ
- `registerMemoryCapability` อาจเปิดเผย `publicArtifacts.listArtifacts(...)`
  ด้วย เพื่อให้ Plugin คู่ขนานใช้ artifact หน่วยความจำที่ export ผ่าน
  `openclaw/plugin-sdk/memory-host-core` แทนการเข้าถึง layout ส่วนตัวของ
  Plugin หน่วยความจำเฉพาะโดยตรง
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, และ
  `registerMemoryRuntime` เป็น API Plugin หน่วยความจำแบบ exclusive ที่เข้ากันได้กับแบบเดิม
- `MemoryFlushPlan.model` สามารถ pin turn สำหรับ flush ไปยัง reference
  `provider/model` ที่แน่นอน เช่น `ollama/qwen3:8b` โดยไม่สืบทอด
  fallback chain ที่ใช้งานอยู่
- `registerMemoryEmbeddingProvider` ช่วยให้ Plugin หน่วยความจำที่ใช้งานอยู่ลงทะเบียน
  id อะแดปเตอร์ embedding ได้หนึ่งรายการหรือมากกว่า (เช่น `openai`, `gemini` หรือ id
  แบบกำหนดเองโดย Plugin)
- config ของผู้ใช้ เช่น `agents.defaults.memorySearch.provider` และ
  `agents.defaults.memorySearch.fallback` จะ resolve กับ id อะแดปเตอร์ที่ลงทะเบียนไว้เหล่านั้น

### เหตุการณ์และวงจรชีวิต

| เมธอด                                       | สิ่งที่ทำ                    |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | hook วงจรชีวิตแบบมีชนิด       |
| `api.onConversationBindingResolved(handler)` | callback การ resolve การผูก conversation |

ดู [hook ของ Plugin](/th/plugins/hooks) สำหรับตัวอย่าง ชื่อ hook ทั่วไป และ
ความหมายของ guard

### ความหมายของการตัดสินใจใน hook

- `before_tool_call`: การส่งคืน `{ block: true }` เป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่าแล้ว handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: การส่งคืน `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `block`) ไม่ใช่การ override
- `before_install`: การส่งคืน `{ block: true }` เป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่าแล้ว handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_install`: การส่งคืน `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `block`) ไม่ใช่การ override
- `reply_dispatch`: การส่งคืน `{ handled: true, ... }` เป็นจุดสิ้นสุด เมื่อ handler ใด claim dispatch แล้ว handler ที่มี priority ต่ำกว่าและเส้นทาง dispatch โมเดลเริ่มต้นจะถูกข้าม
- `message_sending`: การส่งคืน `{ cancel: true }` เป็นจุดสิ้นสุด เมื่อ handler ใดตั้งค่าแล้ว handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `message_sending`: การส่งคืน `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `cancel`) ไม่ใช่การ override
- `message_received`: ใช้ฟิลด์ `threadId` แบบมีชนิดเมื่อคุณต้องการ routing ของ thread/topic ขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเสริมเฉพาะ channel
- `message_sending`: ใช้ฟิลด์ routing `replyToId` / `threadId` แบบมีชนิดก่อน fallback ไปยัง `metadata` เฉพาะ channel
- `gateway_start`: ใช้ `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับสถานะเริ่มต้นที่ Gateway เป็นเจ้าของ แทนการพึ่งพา hook `gateway:startup` ภายใน
- `cron_changed`: สังเกตการเปลี่ยนแปลงวงจรชีวิต Cron ที่ gateway เป็นเจ้าของ ใช้ `event.job?.state?.nextRunAtMs` และ `ctx.getCron?.()` เมื่อซิงค์ตัวจัดกำหนดการ wake ภายนอก และให้ OpenClaw เป็นแหล่งความจริงสำหรับการตรวจสอบกำหนดเวลาและการดำเนินงาน

### ฟิลด์ของออบเจ็กต์ API

| ฟิลด์                    | ประเภท                    | คำอธิบาย                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | รหัส Plugin                                                                                   |
| `api.name`               | `string`                  | ชื่อที่แสดง                                                                                |
| `api.version`            | `string?`                 | เวอร์ชัน Plugin (ไม่บังคับ)                                                                   |
| `api.description`        | `string?`                 | คำอธิบาย Plugin (ไม่บังคับ)                                                               |
| `api.source`             | `string`                  | พาธต้นทางของ Plugin                                                                          |
| `api.rootDir`            | `string?`                 | ไดเรกทอรีรากของ Plugin (ไม่บังคับ)                                                            |
| `api.config`             | `OpenClawConfig`          | สแนปชอตคอนฟิกปัจจุบัน (สแนปชอตรันไทม์ในหน่วยความจำที่ใช้งานอยู่เมื่อมีให้ใช้)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | คอนฟิกเฉพาะ Plugin จาก `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [ตัวช่วยรันไทม์](/th/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | ล็อกเกอร์แบบจำกัดขอบเขต (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดโหลดปัจจุบัน; `"setup-runtime"` คือหน้าต่างเริ่มต้น/ตั้งค่าแบบเบาก่อนเข้าเอนทรีเต็มรูปแบบ |
| `api.resolvePath(input)` | `(string) => string`      | แก้พาธโดยอิงจากรากของ Plugin                                                        |

## แบบแผนโมดูลภายใน

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel แบบโลคัลสำหรับการนำเข้าภายใน:

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

พื้นผิวสาธารณะของ bundled plugin ที่โหลดผ่าน facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` และไฟล์เอนทรีสาธารณะลักษณะเดียวกัน) จะเลือกใช้
สแนปชอตคอนฟิกรันไทม์ที่ใช้งานอยู่เมื่อ OpenClaw กำลังทำงานอยู่ หากยังไม่มีสแนปชอตรันไทม์
ก็จะย้อนกลับไปใช้ไฟล์คอนฟิกที่แก้พาธแล้วบนดิสก์
facade ของ packaged bundled plugin ควรถูกโหลดผ่านตัวโหลด facade ของ Plugin ของ OpenClaw;
การนำเข้าโดยตรงจาก `dist/extensions/...` จะข้ามการตรวจสอบ manifest
และ runtime sidecar ที่การติดตั้งแบบแพ็กเกจใช้กับโค้ดที่ Plugin เป็นเจ้าของ

Provider plugins สามารถเปิดเผย barrel สัญญาแบบแคบที่เป็นโลคัลของ Plugin ได้ เมื่อ
ตัวช่วยนั้นตั้งใจให้เฉพาะกับ provider และยังไม่ควรอยู่ใน subpath SDK แบบทั่วไป
ตัวอย่างที่ bundled มา:

- **Anthropic**: seam สาธารณะ `api.ts` / `contract-api.ts` สำหรับตัวช่วยสตรีมของ Claude
  beta-header และ `service_tier`
- **`@openclaw/openai-provider`**: `api.ts` ส่งออกตัวสร้าง provider,
  ตัวช่วยโมเดลเริ่มต้น และตัวสร้าง provider แบบเรียลไทม์
- **`@openclaw/openrouter-provider`**: `api.ts` ส่งออกตัวสร้าง provider
  พร้อมตัวช่วย onboarding/คอนฟิก

<Warning>
  โค้ด production ของ extension ควรหลีกเลี่ยงการนำเข้า `openclaw/plugin-sdk/<other-plugin>`
  เช่นกัน หากตัวช่วยนั้นใช้ร่วมกันจริง ให้ยกระดับไปยัง subpath SDK ที่เป็นกลาง
  เช่น `openclaw/plugin-sdk/speech`, `.../provider-model-shared` หรือพื้นผิวอื่น
  ที่มุ่งตามความสามารถ แทนการผูกสอง Plugin เข้าด้วยกัน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="จุดเข้าใช้งาน" icon="door-open" href="/th/plugins/sdk-entrypoints">
    ตัวเลือก `definePluginEntry` และ `defineChannelPluginEntry`
  </Card>
  <Card title="ตัวช่วยรันไทม์" icon="gears" href="/th/plugins/sdk-runtime">
    ข้อมูลอ้างอิงเนมสเปซ `api.runtime` ฉบับเต็ม
  </Card>
  <Card title="การตั้งค่าและคอนฟิก" icon="sliders" href="/th/plugins/sdk-setup">
    การแพ็กเกจ, manifests และสคีมาคอนฟิก
  </Card>
  <Card title="การทดสอบ" icon="vial" href="/th/plugins/sdk-testing">
    ยูทิลิตีทดสอบและกฎ lint
  </Card>
  <Card title="การย้าย SDK" icon="arrows-turn-right" href="/th/plugins/sdk-migration">
    การย้ายจากพื้นผิวที่เลิกใช้แล้ว
  </Card>
  <Card title="ภายในของ Plugin" icon="diagram-project" href="/th/plugins/architecture">
    สถาปัตยกรรมเชิงลึกและโมเดลความสามารถ
  </Card>
</CardGroup>
