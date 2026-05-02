---
read_when:
    - คุณต้องทราบว่าควรนำเข้าจากเส้นทางย่อยใดของ SDK
    - คุณต้องการเอกสารอ้างอิงสำหรับเมธอดการลงทะเบียนทั้งหมดบน OpenClawPluginApi
    - คุณกำลังค้นหารายการส่งออกเฉพาะของ SDK
sidebarTitle: Plugin SDK overview
summary: แผนที่การนำเข้า, เอกสารอ้างอิงส่วนติดต่อโปรแกรมประยุกต์สำหรับการลงทะเบียน และสถาปัตยกรรมชุดพัฒนาซอฟต์แวร์
title: ภาพรวมของ Plugin SDK
x-i18n:
    generated_at: "2026-05-02T10:26:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK คือสัญญาแบบมีชนิดข้อมูลระหว่าง Plugin กับแกนหลัก หน้านี้คือ
ข้อมูลอ้างอิงสำหรับ **สิ่งที่ต้อง import** และ **สิ่งที่คุณสามารถลงทะเบียนได้**

<Note>
  หน้านี้สำหรับผู้เขียน Plugin ที่ใช้ `openclaw/plugin-sdk/*` ภายใน
  OpenClaw สำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
  ที่ต้องการเรียกใช้เอเจนต์ผ่าน Gateway ให้ใช้
  [OpenClaw App SDK](/th/concepts/openclaw-sdk) และแพ็กเกจ `@openclaw/sdk`
  แทน
</Note>

<Tip>
กำลังมองหาคู่มือวิธีทำอยู่หรือไม่ เริ่มที่ [การสร้าง Plugin](/th/plugins/building-plugins), ใช้ [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) สำหรับ Plugin ช่องทาง, [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) สำหรับ Plugin ผู้ให้บริการ และ [ฮุก Plugin](/th/plugins/hooks) สำหรับ Plugin ฮุกเครื่องมือหรือวงจรชีวิต
</Tip>

## รูปแบบการ import

ให้ import จากซับพาธที่เฉพาะเจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

แต่ละซับพาธเป็นโมดูลขนาดเล็กที่แยกตัวเองครบถ้วน วิธีนี้ช่วยให้การเริ่มต้นทำงานเร็ว
และป้องกันปัญหาการพึ่งพาแบบวนรอบ สำหรับตัวช่วย entry/build ที่เฉพาะกับช่องทาง
ควรใช้ `openclaw/plugin-sdk/channel-core`; เก็บ `openclaw/plugin-sdk/core` ไว้สำหรับ
พื้นผิวรวมที่กว้างกว่าและตัวช่วยที่ใช้ร่วมกัน เช่น
`buildChannelConfigSchema`

สำหรับคอนฟิกช่องทาง ให้เผยแพร่ JSON Schema ที่ช่องทางเป็นเจ้าของผ่าน
`openclaw.plugin.json#channelConfigs` ซับพาธ `plugin-sdk/channel-config-schema`
มีไว้สำหรับ primitive ของสคีมาที่ใช้ร่วมกันและตัวสร้างทั่วไป Plugin ที่บันเดิลมากับ
OpenClaw ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับสคีมาช่องทางบันเดิลที่ยังคงไว้
export เพื่อความเข้ากันได้ที่เลิกใช้แล้วคงอยู่ใน
`plugin-sdk/channel-config-schema-legacy`; ซับพาธสคีมาบันเดิลทั้งสองไม่ใช่
รูปแบบสำหรับ Plugin ใหม่

<Warning>
  อย่า import seam อำนวยความสะดวกที่ติดแบรนด์ผู้ให้บริการหรือช่องทาง (เช่น
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)
  Plugin ที่บันเดิลมาจะประกอบซับพาธ SDK ทั่วไปไว้ภายใน barrel `api.ts` /
  `runtime-api.ts` ของตนเอง; ผู้ใช้แกนหลักควรใช้ barrel ภายใน Plugin เหล่านั้น
  หรือเพิ่มสัญญา SDK ทั่วไปแบบแคบเมื่อความจำเป็นนั้นเป็นแบบข้ามช่องทางจริง ๆ

seam ตัวช่วยของ Plugin บันเดิลชุดเล็กยังคงปรากฏในแผนที่ export ที่สร้างขึ้น
เมื่อมีการติดตามการใช้งานโดยเจ้าของ seam เหล่านี้มีไว้สำหรับการบำรุงรักษา
Plugin บันเดิลเท่านั้น และไม่แนะนำให้ใช้เป็นพาธ import สำหรับ Plugin บุคคลที่สามใหม่

`openclaw/plugin-sdk/discord` และ `openclaw/plugin-sdk/telegram-account` ยังถูกเก็บไว้เป็น
facade เพื่อความเข้ากันได้ที่เลิกใช้แล้วสำหรับการใช้งานโดยเจ้าของที่ติดตามไว้ อย่า
คัดลอกพาธ import เหล่านี้ไปยัง Plugin ใหม่; ให้ใช้ตัวช่วยรันไทม์ที่ฉีดเข้ามาและ
ซับพาธ SDK ช่องทางทั่วไปแทน
</Warning>

## ข้อมูลอ้างอิงซับพาธ

Plugin SDK ถูกเปิดเผยเป็นชุดซับพาธแคบที่จัดกลุ่มตามพื้นที่ (entry ของ Plugin,
ช่องทาง, ผู้ให้บริการ, การยืนยันตัวตน, รันไทม์, ความสามารถ, หน่วยความจำ และตัวช่วย
Plugin บันเดิลที่สงวนไว้) สำหรับแค็ตตาล็อกฉบับเต็มที่จัดกลุ่มและลิงก์ไว้ โปรดดู
[ซับพาธ Plugin SDK](/th/plugins/sdk-subpaths)

รายการซับพาธกว่า 200 รายการที่สร้างขึ้นอยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`

## API การลงทะเบียน

คอลแบ็ก `register(api)` จะได้รับอ็อบเจกต์ `OpenClawPluginApi` พร้อมเมธอดเหล่านี้:

### การลงทะเบียนความสามารถ

| เมธอด                                           | สิ่งที่ลงทะเบียน                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | การอนุมานข้อความ (LLM)                  |
| `api.registerAgentHarness(...)`                  | ตัวดำเนินการเอเจนต์ระดับต่ำเชิงทดลอง |
| `api.registerCliBackend(...)`                    | แบ็กเอนด์การอนุมาน CLI ในเครื่อง           |
| `api.registerChannel(...)`                       | ช่องทางการรับส่งข้อความ                     |
| `api.registerSpeechProvider(...)`                | การสังเคราะห์ข้อความเป็นเสียง / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | การถอดความแบบเรียลไทม์ชนิดสตรีม      |
| `api.registerRealtimeVoiceProvider(...)`         | เซสชันเสียงเรียลไทม์แบบสองทาง        |
| `api.registerMediaUnderstandingProvider(...)`    | การวิเคราะห์รูปภาพ/เสียง/วิดีโอ            |
| `api.registerImageGenerationProvider(...)`       | การสร้างรูปภาพ                      |
| `api.registerMusicGenerationProvider(...)`       | การสร้างเพลง                      |
| `api.registerVideoGenerationProvider(...)`       | การสร้างวิดีโอ                      |
| `api.registerWebFetchProvider(...)`              | ผู้ให้บริการดึงข้อมูลเว็บ / scrape           |
| `api.registerWebSearchProvider(...)`             | การค้นหาเว็บ                            |

### เครื่องมือและคำสั่ง

| เมธอด                          | สิ่งที่ลงทะเบียน                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | เครื่องมือเอเจนต์ (จำเป็นหรือ `{ optional: true }`) |
| `api.registerCommand(def)`      | คำสั่งกำหนดเอง (ข้าม LLM)             |

คำสั่งของ Plugin สามารถตั้งค่า `agentPromptGuidance` ได้เมื่อเอเจนต์ต้องการ
คำใบ้การกำหนดเส้นทางสั้น ๆ ที่คำสั่งเป็นเจ้าของ ให้เนื้อหานั้นเกี่ยวกับตัวคำสั่งเอง;
อย่าเพิ่มนโยบายเฉพาะผู้ให้บริการหรือเฉพาะ Plugin เข้าไปในตัวสร้างพรอมป์แกนหลัก

### โครงสร้างพื้นฐาน

| เมธอด                                         | สิ่งที่ลงทะเบียน                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | ฮุกเหตุการณ์                              |
| `api.registerHttpRoute(params)`                | ปลายทาง HTTP ของ Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | เมธอด RPC ของ Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | ตัวประกาศการค้นพบ Gateway ในเครื่อง      |
| `api.registerCli(registrar, opts?)`            | คำสั่งย่อย CLI                          |
| `api.registerService(service)`                 | บริการเบื้องหลัง                      |
| `api.registerInteractiveHandler(registration)` | ตัวจัดการแบบโต้ตอบ                     |
| `api.registerAgentToolResultMiddleware(...)`   | มิดเดิลแวร์ผลลัพธ์เครื่องมือของรันไทม์          |
| `api.registerMemoryPromptSupplement(builder)`  | ส่วนพรอมป์เพิ่มเติมที่อยู่ใกล้หน่วยความจำ |
| `api.registerMemoryCorpusSupplement(adapter)`  | คลังข้อมูลค้นหา/อ่านหน่วยความจำเพิ่มเติม      |

### ฮุกโฮสต์สำหรับ Plugin เวิร์กโฟลว์

ฮุกโฮสต์คือ seam ของ SDK สำหรับ Plugin ที่ต้องมีส่วนร่วมในวงจรชีวิตของโฮสต์
แทนที่จะเพิ่มเฉพาะผู้ให้บริการ ช่องทาง หรือเครื่องมือเท่านั้น ฮุกเหล่านี้เป็น
สัญญาทั่วไป; โหมด Plan ใช้งานได้ แต่เวิร์กโฟลว์การอนุมัติ,
เกตนโยบายพื้นที่ทำงาน, มอนิเตอร์เบื้องหลัง, วิซาร์ดตั้งค่า และ Plugin คู่หู UI
ก็ใช้งานได้เช่นกัน

| เมธอด                                                                   | สัญญาที่เมธอดเป็นเจ้าของ                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | สถานะเซสชันที่ Plugin เป็นเจ้าของและเข้ากันได้กับ JSON ซึ่งฉายผ่านเซสชัน Gateway                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | บริบทที่คงทนและเกิดครั้งเดียวพอดี ซึ่งถูกฉีดเข้าสู่เทิร์นเอเจนต์ถัดไปสำหรับหนึ่งเซสชัน                                                    |
| `api.registerTrustedToolPolicy(...)`                                     | นโยบายเครื่องมือก่อน Plugin แบบบันเดิล/เชื่อถือได้ ซึ่งสามารถบล็อกหรือเขียนพารามิเตอร์เครื่องมือใหม่ได้                                                      |
| `api.registerToolMetadata(...)`                                          | เมทาดาทาการแสดงผลของแค็ตตาล็อกเครื่องมือโดยไม่เปลี่ยนการนำเครื่องมือไปใช้                                                            |
| `api.registerCommand(...)`                                               | คำสั่ง Plugin แบบมีขอบเขต; ผลลัพธ์คำสั่งสามารถตั้งค่า `continueAgent: true`; คำสั่งเนทีฟของ Discord รองรับ `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | ตัวอธิบายการมีส่วนร่วมของ UI ควบคุมสำหรับพื้นผิวเซสชัน เครื่องมือ การรัน หรือการตั้งค่า                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | คอลแบ็กทำความสะอาดสำหรับทรัพยากรรันไทม์ที่ Plugin เป็นเจ้าของบนเส้นทางรีเซ็ต/ลบ/โหลดใหม่                                                 |
| `api.registerAgentEventSubscription(...)`                                | การสมัครรับเหตุการณ์ที่ผ่านการทำให้ปลอดภัยสำหรับสถานะเวิร์กโฟลว์และมอนิเตอร์                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | สถานะชั่วคราวของ Plugin ต่อการรัน ซึ่งถูกล้างเมื่อวงจรชีวิตการรันสิ้นสุด                                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | ระเบียนงานตัวจัดกำหนดการเซสชันที่ Plugin เป็นเจ้าของ พร้อมการทำความสะอาดที่กำหนดแน่นอน                                                             |

สัญญาเหล่านี้จงใจแยกอำนาจออกจากกัน:

- Plugin ภายนอกสามารถเป็นเจ้าของส่วนขยายเซสชัน ตัวอธิบาย UI คำสั่ง เมทาดาทาเครื่องมือ
  การฉีดในเทิร์นถัดไป และฮุกปกติ
- นโยบายเครื่องมือที่เชื่อถือได้ทำงานก่อนฮุก `before_tool_call` ทั่วไป และเป็นแบบ
  บันเดิลเท่านั้น เพราะมีส่วนร่วมในนโยบายความปลอดภัยของโฮสต์
- การเป็นเจ้าของคำสั่งที่สงวนไว้เป็นแบบบันเดิลเท่านั้น Plugin ภายนอกควรใช้
  ชื่อคำสั่งหรือนามแฝงของตนเอง
- `allowPromptInjection=false` ปิดใช้งานฮุกที่เปลี่ยนแปลงพรอมป์ รวมถึง
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  ฟิลด์พรอมป์จาก `before_agent_start` แบบเดิม และ
  `enqueueNextTurnInjection`

ตัวอย่างผู้ใช้ที่ไม่ใช่ Plan:

| รูปแบบ Plugin             | ฮุกที่ใช้                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| เวิร์กโฟลว์การอนุมัติ            | ส่วนขยายเซสชัน, การดำเนินคำสั่งต่อ, การฉีดในเทิร์นถัดไป, ตัวอธิบาย UI                                                            |
| เกตนโยบายงบประมาณ/พื้นที่ทำงาน | นโยบายเครื่องมือที่เชื่อถือได้, เมทาดาทาเครื่องมือ, การฉายเซสชัน                                                                                 |
| มอนิเตอร์วงจรชีวิตเบื้องหลัง | การทำความสะอาดวงจรชีวิตรันไทม์, การสมัครรับเหตุการณ์เอเจนต์, การเป็นเจ้าของ/ทำความสะอาดตัวจัดกำหนดการเซสชัน, การมีส่วนร่วมพรอมป์ Heartbeat, ตัวอธิบาย UI |
| วิซาร์ดตั้งค่าหรือเริ่มใช้งาน   | ส่วนขยายเซสชัน, คำสั่งแบบมีขอบเขต, ตัวอธิบาย UI ควบคุม                                                                              |

<Note>
  เนมสเปซผู้ดูแลแกนหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) จะคงเป็น `operator.admin` เสมอ แม้ว่า Plugin จะพยายามกำหนด
  ขอบเขตเมธอด Gateway ที่แคบกว่า ควรใช้คำนำหน้าเฉพาะ Plugin สำหรับ
  เมธอดที่ Plugin เป็นเจ้าของ
</Note>

<Accordion title="ควรใช้มิดเดิลแวร์ผลลัพธ์เครื่องมือเมื่อใด">
  Plugin ที่บันเดิลมาสามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อ
  ต้องเขียนผลลัพธ์เครื่องมือใหม่หลังการเรียกใช้และก่อนที่รันไทม์จะ
  ป้อนผลลัพธ์นั้นกลับเข้าโมเดล นี่คือ seam ที่เชื่อถือได้และเป็นกลางต่อรันไทม์
  สำหรับตัวลดเอาต์พุตแบบ async เช่น tokenjuice

Plugin ที่บันเดิลมาต้องประกาศ `contracts.agentToolResultMiddleware` สำหรับแต่ละ
รันไทม์เป้าหมาย เช่น `["pi", "codex"]` Plugin ภายนอก
ไม่สามารถลงทะเบียนมิดเดิลแวร์นี้ได้; ให้ใช้ฮุก Plugin ของ OpenClaw ตามปกติสำหรับงาน
ที่ไม่ต้องการจังหวะผลลัพธ์เครื่องมือก่อนเข้าโมเดล เส้นทางการลงทะเบียน factory
ส่วนขยายแบบฝังเดิมที่ใช้ได้เฉพาะ Pi ถูกลบออกแล้ว
</Accordion>

### การลงทะเบียนการค้นพบ Gateway

`api.registerGatewayDiscoveryService(...)` ช่วยให้ Plugin ประกาศ Gateway ที่ใช้งานอยู่บนการขนส่งสำหรับการค้นพบภายในเครื่อง เช่น mDNS/Bonjour ได้ OpenClaw เรียก service ระหว่างการเริ่มต้น Gateway เมื่อเปิดใช้งานการค้นพบภายในเครื่อง ส่งพอร์ต Gateway ปัจจุบันและข้อมูลคำใบ้ TXT ที่ไม่ใช่ความลับ และเรียกตัวจัดการ `stop` ที่ส่งคืนมาในระหว่างการปิด Gateway

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

Plugin สำหรับการค้นพบ Gateway ต้องไม่ถือว่าค่า TXT ที่ประกาศเป็นความลับหรือการยืนยันตัวตน การค้นพบเป็นเพียงคำใบ้สำหรับการกำหนดเส้นทาง ส่วนความน่าเชื่อถือยังเป็นหน้าที่ของการยืนยันตัวตนของ Gateway และ TLS pinning

### เมตาดาต้าการลงทะเบียน CLI

`api.registerCli(registrar, opts?)` รับเมตาดาต้าระดับบนสุดสองชนิด:

- `commands`: รากคำสั่งแบบชัดเจนที่ registrar เป็นเจ้าของ
- `descriptors`: ตัวอธิบายคำสั่งในช่วง parse ที่ใช้สำหรับความช่วยเหลือของ CLI ราก,
  การกำหนดเส้นทาง และการลงทะเบียน CLI ของ Plugin แบบ lazy

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

ใช้ `commands` เพียงอย่างเดียวเฉพาะเมื่อคุณไม่ต้องการการลงทะเบียน CLI รากแบบ lazy เส้นทางความเข้ากันได้แบบ eager นั้นยังคงรองรับอยู่ แต่จะไม่ติดตั้ง placeholder ที่มี descriptor รองรับสำหรับการโหลดแบบ lazy ในช่วง parse

### การลงทะเบียนแบ็กเอนด์ CLI

`api.registerCliBackend(...)` ช่วยให้ Plugin เป็นเจ้าของ config เริ่มต้นสำหรับแบ็กเอนด์ AI CLI ภายในเครื่อง เช่น `codex-cli`

- `id` ของแบ็กเอนด์จะกลายเป็นคำนำหน้าผู้ให้บริการใน model ref เช่น `codex-cli/gpt-5`
- `config` ของแบ็กเอนด์ใช้รูปแบบเดียวกับ `agents.defaults.cliBackends.<id>`
- config ของผู้ใช้ยังคงมีสิทธิ์เหนือกว่า OpenClaw จะผสาน `agents.defaults.cliBackends.<id>` ทับค่าเริ่มต้นของ
  Plugin ก่อนเรียกใช้ CLI
- ใช้ `normalizeConfig` เมื่อแบ็กเอนด์ต้องเขียนใหม่เพื่อความเข้ากันได้หลังการผสาน
  (เช่น การปรับรูปแบบ flag เก่าให้เป็นมาตรฐาน)

### สล็อตแบบผูกขาด

| เมธอด                                     | สิ่งที่ลงทะเบียน                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | context engine (ใช้งานได้ทีละหนึ่งตัว) callback `assemble()` จะได้รับ `availableTools` และ `citationsMode` เพื่อให้ engine ปรับแต่งส่วนเพิ่มของ prompt ได้ |
| `api.registerMemoryCapability(capability)` | ความสามารถ memory แบบรวมศูนย์                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | ตัวสร้างส่วน prompt ของ memory                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | resolver ของแผน flush memory                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | adapter ของ runtime memory                                                                                                                                    |

### adapter สำหรับ memory embedding

| เมธอด                                         | สิ่งที่ลงทะเบียน                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter สำหรับ memory embedding ของ Plugin ที่ใช้งานอยู่ |

- `registerMemoryCapability` เป็น API สำหรับ Plugin memory แบบผูกขาดที่แนะนำ
- `registerMemoryCapability` อาจเปิดเผย `publicArtifacts.listArtifacts(...)`
  ด้วย เพื่อให้ Plugin คู่ขนานใช้ artifact ของ memory ที่ export ผ่าน
  `openclaw/plugin-sdk/memory-host-core` แทนการเข้าถึง layout ส่วนตัวของ
  Plugin memory ตัวใดตัวหนึ่ง
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` และ
  `registerMemoryRuntime` เป็น API สำหรับ Plugin memory แบบผูกขาดที่เข้ากันได้กับระบบเดิม
- `MemoryFlushPlan.model` สามารถตรึงรอบการ flush ไปยัง reference `provider/model`
  ที่แน่นอน เช่น `ollama/qwen3:8b` โดยไม่สืบทอด fallback chain ที่ใช้งานอยู่
- `registerMemoryEmbeddingProvider` ช่วยให้ Plugin memory ที่ใช้งานอยู่ลงทะเบียน id ของ
  embedding adapter ได้หนึ่งรายการหรือมากกว่า (เช่น `openai`, `gemini` หรือ id แบบกำหนดเอง
  ที่ Plugin กำหนด)
- config ของผู้ใช้ เช่น `agents.defaults.memorySearch.provider` และ
  `agents.defaults.memorySearch.fallback` จะ resolve กับ id ของ adapter ที่ลงทะเบียนเหล่านั้น

### เหตุการณ์และวงจรชีวิต

| เมธอด                                       | สิ่งที่ทำ                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | lifecycle hook แบบ typed          |
| `api.onConversationBindingResolved(handler)` | callback สำหรับ conversation binding |

ดู [Plugin hooks](/th/plugins/hooks) สำหรับตัวอย่าง ชื่อ hook ทั่วไป และ semantics ของ guard

### semantics การตัดสินใจของ Hook

- `before_tool_call`: การส่งคืน `{ block: true }` เป็นผลลัพธ์สุดท้าย เมื่อ handler ใดตั้งค่าแล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: การส่งคืน `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `block`) ไม่ใช่การ override
- `before_install`: การส่งคืน `{ block: true }` เป็นผลลัพธ์สุดท้าย เมื่อ handler ใดตั้งค่าแล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: การส่งคืน `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `block`) ไม่ใช่การ override
- `reply_dispatch`: การส่งคืน `{ handled: true, ... }` เป็นผลลัพธ์สุดท้าย เมื่อ handler ใดอ้างสิทธิ์การ dispatch แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าและเส้นทางการ dispatch ไปยังโมเดลเริ่มต้นจะถูกข้าม
- `message_sending`: การส่งคืน `{ cancel: true }` เป็นผลลัพธ์สุดท้าย เมื่อ handler ใดตั้งค่าแล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: การส่งคืน `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `cancel`) ไม่ใช่การ override
- `message_received`: ใช้ฟิลด์ typed `threadId` เมื่อคุณต้องการการกำหนดเส้นทาง thread/topic ขาเข้า เก็บ `metadata` ไว้สำหรับส่วนเสริมเฉพาะ channel
- `message_sending`: ใช้ฟิลด์การกำหนดเส้นทาง typed `replyToId` / `threadId` ก่อน fallback ไปยัง `metadata` เฉพาะ channel
- `gateway_start`: ใช้ `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับสถานะเริ่มต้นที่ Gateway เป็นเจ้าของ แทนการพึ่งพา hook ภายใน `gateway:startup`
- `cron_changed`: สังเกตการเปลี่ยนแปลงวงจรชีวิต Cron ที่ Gateway เป็นเจ้าของ ใช้ `event.job?.state?.nextRunAtMs` และ `ctx.getCron?.()` เมื่อ sync ตัวตั้งปลุกภายนอก และคงให้ OpenClaw เป็นแหล่งข้อมูลจริงสำหรับการตรวจสอบงานที่ครบกำหนดและการดำเนินการ

### ฟิลด์ของอ็อบเจกต์ API

| ฟิลด์                    | ประเภท                      | คำอธิบาย                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id ของ Plugin                                                                                   |
| `api.name`               | `string`                  | ชื่อที่แสดง                                                                                |
| `api.version`            | `string?`                 | เวอร์ชันของ Plugin (ไม่บังคับ)                                                                   |
| `api.description`        | `string?`                 | คำอธิบายของ Plugin (ไม่บังคับ)                                                               |
| `api.source`             | `string`                  | path ของแหล่งที่มา Plugin                                                                          |
| `api.rootDir`            | `string?`                 | ไดเรกทอรีรากของ Plugin (ไม่บังคับ)                                                            |
| `api.config`             | `OpenClawConfig`          | snapshot ของ config ปัจจุบัน (snapshot runtime ในหน่วยความจำที่ใช้งานอยู่เมื่อมี)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | config เฉพาะ Plugin จาก `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [ตัวช่วย runtime](/th/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | logger ตาม scope (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือช่วง startup/setup แบบเบาก่อน full-entry |
| `api.resolvePath(input)` | `(string) => string`      | resolve path ที่สัมพันธ์กับราก Plugin                                                        |

## ข้อตกลงของโมดูลภายใน

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่องสำหรับการ import ภายใน:

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
  `./runtime-api.ts` path ของ SDK เป็นสัญญาภายนอกเท่านั้น
</Warning>

พื้นผิวสาธารณะของ Plugin ที่ bundled และโหลดผ่าน facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` และไฟล์ entry สาธารณะลักษณะเดียวกัน) จะเลือกใช้
snapshot config runtime ที่ใช้งานอยู่เมื่อ OpenClaw กำลังทำงานอยู่ หากยังไม่มี
snapshot runtime จะ fallback ไปยังไฟล์ config ที่ resolve ได้บนดิสก์
facade ของ Plugin ที่ bundled แบบ packaged ควรถูกโหลดผ่าน loader facade ของ Plugin
ของ OpenClaw; การ import โดยตรงจาก `dist/extensions/...` จะข้ามการตรวจ manifest
และ runtime sidecar ที่การติดตั้งแบบ packaged ใช้สำหรับโค้ดที่ Plugin เป็นเจ้าของ

Plugin ผู้ให้บริการสามารถเปิดเผย contract barrel เฉพาะ Plugin แบบแคบได้ เมื่อ
helper ตั้งใจให้เฉพาะผู้ให้บริการจริง ๆ และยังไม่เหมาะอยู่ใน subpath SDK ทั่วไป
ตัวอย่างที่ bundled:

- **Anthropic**: seam สาธารณะ `api.ts` / `contract-api.ts` สำหรับ helper ของ Claude
  beta-header และ stream `service_tier`
- **`@openclaw/openai-provider`**: `api.ts` export provider builder,
  helper สำหรับโมเดลเริ่มต้น และ realtime provider builder
- **`@openclaw/openrouter-provider`**: `api.ts` export provider builder
  รวมถึง helper onboarding/config

<Warning>
  โค้ด production ของ Extension ควรหลีกเลี่ยงการ import
  `openclaw/plugin-sdk/<other-plugin>` ด้วย หาก helper ถูกใช้ร่วมกันอย่างแท้จริง ให้ยกระดับไปยัง subpath SDK ที่เป็นกลาง
  เช่น `openclaw/plugin-sdk/speech`, `.../provider-model-shared` หรือพื้นผิวอื่นที่มุ่งตาม capability
  แทนการผูก Plugin สองตัวเข้าด้วยกัน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="จุดเข้าใช้งาน" icon="door-open" href="/th/plugins/sdk-entrypoints">
    ตัวเลือกของ `definePluginEntry` และ `defineChannelPluginEntry`
  </Card>
  <Card title="ตัวช่วยรันไทม์" icon="gears" href="/th/plugins/sdk-runtime">
    ข้อมูลอ้างอิง namespace `api.runtime` ฉบับเต็ม
  </Card>
  <Card title="การตั้งค่าเริ่มต้นและการกำหนดค่า" icon="sliders" href="/th/plugins/sdk-setup">
    การจัดแพ็กเกจ, manifest, และ schema การกำหนดค่า
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
