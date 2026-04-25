---
read_when:
    - การสร้างหรือดีบัก native Plugins ของ OpenClaw
    - การทำความเข้าใจโมเดลความสามารถของ Plugin หรือขอบเขตความเป็นเจ้าของ
    - การทำงานกับไปป์ไลน์การโหลด Plugin หรือรีจิสทรี
    - การติดตั้งใช้งาน provider runtime hooks หรือ channel plugins
sidebarTitle: Internals
summary: 'Plugin internals: โมเดลความสามารถ, ownership, สัญญา, ไปป์ไลน์การโหลด และตัวช่วยรันไทม์'
title: Plugin internals
x-i18n:
    generated_at: "2026-04-25T13:52:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1fd7d9192c8c06aceeb6e8054a740bba27c94770e17eabf064627adda884e77
    source_path: plugins/architecture.md
    workflow: 15
---

นี่คือ **ข้อมูลอ้างอิงสถาปัตยกรรมเชิงลึก** สำหรับระบบ Plugin ของ OpenClaw สำหรับ
คู่มือเชิงปฏิบัติ ให้เริ่มจากหน้าที่เจาะจงด้านใดด้านหนึ่งด้านล่างนี้

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการเพิ่ม เปิดใช้งาน และแก้ไขปัญหา plugins
  </Card>
  <Card title="Building plugins" icon="rocket" href="/th/plugins/building-plugins">
    บทช่วยสอน Plugin ตัวแรกพร้อม manifest ที่เล็กที่สุดแต่ทำงานได้
  </Card>
  <Card title="Channel plugins" icon="comments" href="/th/plugins/sdk-channel-plugins">
    สร้าง channel Plugin สำหรับระบบส่งข้อความ
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/th/plugins/sdk-provider-plugins">
    สร้าง provider Plugin สำหรับโมเดล
  </Card>
  <Card title="SDK overview" icon="book" href="/th/plugins/sdk-overview">
    ข้อมูลอ้างอิง import map และ registration API
  </Card>
</CardGroup>

## โมเดลความสามารถสาธารณะ

Capabilities คือโมเดล **native plugin** แบบสาธารณะภายใน OpenClaw ทุก
native OpenClaw plugin จะลงทะเบียนกับ capability type อย่างน้อยหนึ่งประเภท:

| Capability             | วิธีลงทะเบียน                                  | ตัวอย่าง plugins                     |
| ---------------------- | ----------------------------------------------- | ------------------------------------ |
| Text inference         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI inference backend  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Speech                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Realtime voice         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Media understanding    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Image generation       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Music generation       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Video generation       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web fetch              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web search             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / messaging    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway discovery      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

Plugin ที่ลงทะเบียนศูนย์ capabilities แต่ให้ hooks, tools, discovery
services หรือ background services จะถือเป็น Plugin แบบ **legacy hook-only** โดย pattern
นี้ยังคงรองรับอย่างสมบูรณ์

### แนวทางด้านความเข้ากันได้กับภายนอก

โมเดล capability ถูกนำลงใน core แล้วและถูกใช้โดย bundled/native plugins
ในปัจจุบัน แต่ความเข้ากันได้ของ plugins ภายนอกยังต้องมีเกณฑ์ที่เข้มงวดกว่าแค่ “มันถูก export จึงถือว่า freeze แล้ว”

| สถานการณ์ของ Plugin                              | แนวทาง                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Existing external plugins                        | ให้ integrations แบบ hook-based ยังคงทำงานได้ต่อไป; นี่คือ baseline ของความเข้ากันได้          |
| New bundled/native plugins                       | ควรใช้การลงทะเบียน capability แบบ explicit แทนการเข้าถึงแบบ vendor-specific หรือการออกแบบ hook-only แบบใหม่ |
| External plugins adopting capability registration | ทำได้ แต่ควรถือว่าพื้นผิว helper เฉพาะ capability ยังมีการเปลี่ยนแปลงได้ เว้นแต่เอกสารจะระบุว่าเสถียร |

การลงทะเบียน capability คือทิศทางที่ตั้งใจไว้ Legacy hooks ยังคงเป็นเส้นทางที่ปลอดภัยที่สุด
ในการไม่ทำให้ external plugins พังระหว่างช่วงเปลี่ยนผ่าน helper subpaths ที่ export ออกมา
ไม่ได้มีสถานะเท่ากันทั้งหมด — ควรเลือกใช้สัญญาที่แคบและมีเอกสารกำกับ แทน helper exports ที่หลุดออกมาโดยบังเอิญ

### รูปทรงของ Plugin

OpenClaw จัดประเภททุก plugin ที่โหลดแล้วเป็น shape ตามพฤติกรรมการลงทะเบียนจริงของมัน
(ไม่ใช่เพียงข้อมูลเมตาแบบ static):

- **plain-capability**: ลงทะเบียน capability type เดียวพอดี (เช่น
  provider-only plugin อย่าง `mistral`)
- **hybrid-capability**: ลงทะเบียนหลาย capability types (เช่น
  `openai` เป็นเจ้าของ text inference, speech, media understanding และ image
  generation)
- **hook-only**: ลงทะเบียนเฉพาะ hooks (typed หรือ custom), ไม่มี
  capabilities, tools, commands หรือ services
- **non-capability**: ลงทะเบียน tools, commands, services หรือ routes แต่ไม่มี
  capabilities

ใช้ `openclaw plugins inspect <id>` เพื่อดู shape ของ plugin และรายละเอียด capability
ดู [ข้อมูลอ้างอิง CLI](/th/cli/plugins#inspect) สำหรับรายละเอียด

### Legacy hooks

hook `before_agent_start` ยังคงรองรับอยู่ในฐานะเส้นทางความเข้ากันได้สำหรับ
hook-only plugins Legacy plugins ที่ใช้งานจริงยังคงพึ่งพามันอยู่

ทิศทาง:

- ให้มันยังคงทำงานได้
- จัดทำเอกสารว่าเป็น legacy
- ควรใช้ `before_model_resolve` สำหรับงาน override โมเดล/provider
- ควรใช้ `before_prompt_build` สำหรับงานแก้ไข prompt
- นำออกได้ก็ต่อเมื่อการใช้งานจริงลดลงและ fixture coverage พิสูจน์ความปลอดภัยของการย้ายได้แล้วเท่านั้น

### สัญญาณความเข้ากันได้

เมื่อคุณรัน `openclaw doctor` หรือ `openclaw plugins inspect <id>` คุณอาจเห็น
หนึ่งในป้ายเหล่านี้:

| สัญญาณ                    | ความหมาย                                                     |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | คอนฟิก parse ได้ตามปกติและ plugins resolve ได้              |
| **compatibility advisory** | Plugin ใช้ pattern ที่รองรับแต่เก่ากว่า (เช่น `hook-only`) |
| **legacy warning**        | Plugin ใช้ `before_agent_start` ซึ่ง deprecated แล้ว         |
| **hard error**            | คอนฟิกไม่ถูกต้องหรือ plugin โหลดไม่สำเร็จ                   |

ทั้ง `hook-only` และ `before_agent_start` จะไม่ทำให้ plugin ของคุณพังในวันนี้:
`hook-only` เป็นเพียงคำแนะนำ และ `before_agent_start` จะทริกเกอร์แค่คำเตือน สัญญาณเหล่านี้
ยังปรากฏใน `openclaw status --all` และ `openclaw plugins doctor` ด้วย

## ภาพรวมสถาปัตยกรรม

ระบบ Plugin ของ OpenClaw มี 4 ชั้น:

1. **Manifest + discovery**
   OpenClaw ค้นหา candidate plugins จาก paths ที่กำหนดไว้, workspace roots,
   global plugin roots และ bundled plugins โดย discovery จะอ่าน
   native manifests `openclaw.plugin.json` รวมถึง supported bundle manifests ก่อน
2. **Enablement + validation**
   Core ตัดสินใจว่า plugin ที่ค้นพบแล้วตัวใดถูกเปิดใช้งาน ปิดใช้งาน ถูกบล็อก หรือ
   ถูกเลือกสำหรับ exclusive slot เช่น memory
3. **Runtime loading**
   native OpenClaw plugins จะถูกโหลด in-process ผ่าน jiti และลงทะเบียน
   capabilities เข้าไปยังรีจิสทรีกลาง ส่วน bundles ที่เข้ากันได้จะถูก normalize เป็น
   registry records โดยไม่ต้อง import runtime code
4. **Surface consumption**
   ส่วนที่เหลือของ OpenClaw จะอ่านรีจิสทรีเพื่อแสดง tools, channels, provider
   setup, hooks, HTTP routes, CLI commands และ services

สำหรับ plugin CLI โดยเฉพาะ การค้นหา root command ถูกแยกเป็น 2 ระยะ:

- ข้อมูลเมตาในช่วง parse-time มาจาก `registerCli(..., { descriptors: [...] })`
- โมดูล plugin CLI จริงสามารถคงความ lazy ไว้และลงทะเบียนเมื่อถูกเรียกใช้ครั้งแรกได้

สิ่งนี้ช่วยให้โค้ด CLI ที่ plugin เป็นเจ้าของยังอยู่ภายใน plugin ขณะเดียวกันก็ยังเปิดให้ OpenClaw
จองชื่อ root commands ได้ก่อน parse

ขอบเขตการออกแบบที่สำคัญคือ:

- การตรวจสอบ manifest/config ควรทำงานจาก **manifest/schema metadata**
  โดยไม่ต้องรัน plugin code
- native capability discovery อาจโหลด plugin entry code ที่เชื่อถือได้เพื่อสร้าง
  non-activating registry snapshot
- native runtime behavior มาจากเส้นทาง `register(api)` ของโมดูล plugin โดยมี
  `api.registrationMode === "full"`

การแยกแบบนี้ช่วยให้ OpenClaw ตรวจสอบคอนฟิก อธิบาย plugins ที่หายไป/ถูกปิดใช้งาน และ
สร้าง hints สำหรับ UI/schema ได้ก่อนที่ runtime เต็มรูปแบบจะทำงาน

### การวางแผนการเปิดใช้งาน

การวางแผนการเปิดใช้งานเป็นส่วนหนึ่งของ control plane ผู้เรียกสามารถถามได้ว่า plugins ใด
เกี่ยวข้องกับคำสั่ง, provider, channel, route, agent harness หรือ
capability ที่เจาะจง ก่อนจะโหลด runtime registries ที่กว้างกว่า

planner รักษาพฤติกรรม manifest ปัจจุบันให้ยังคงเข้ากันได้:

- ฟิลด์ `activation.*` คือ planner hints แบบ explicit
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` และ hooks ยังคงเป็น fallback ด้าน ownership ของ manifest
- planner API แบบ ids-only ยังคงพร้อมใช้งานสำหรับ callers เดิม
- plan API รายงาน reason labels เพื่อให้ diagnostics แยกความต่างระหว่าง explicit
  hints กับ ownership fallback ได้

อย่ามอง `activation` ว่าเป็น lifecycle hook หรือเป็นตัวแทนของ
`register(...)` มันคือ metadata ที่ใช้จำกัดขอบเขตการโหลด ควรใช้ฟิลด์ ownership
เมื่อฟิลด์เหล่านั้นอธิบายความสัมพันธ์ได้อยู่แล้ว และใช้ `activation` เฉพาะเมื่อจำเป็นต้องมี planner hints เพิ่มเติม

### Channel plugins และ shared message tool

Channel plugins ไม่จำเป็นต้องลงทะเบียน send/edit/react tool แยกต่างหากสำหรับการกระทำแชตปกติ
OpenClaw คง `message` tool แบบใช้ร่วมกันไว้ใน core เพียงตัวเดียว และ
channel plugins เป็นเจ้าของการค้นพบและการรันที่เฉพาะกับช่องทางภายใต้มัน

ขอบเขตปัจจุบันคือ:

- core เป็นเจ้าของ shared `message` tool host, prompt wiring, การจัดการ
  session/thread bookkeeping และ execution dispatch
- channel plugins เป็นเจ้าของ scoped action discovery, capability discovery และ
  channel-specific schema fragments ใดๆ
- channel plugins เป็นเจ้าของไวยากรณ์บทสนทนา session ที่เฉพาะกับ provider เช่น
  วิธีที่ conversation ids เข้ารหัส thread ids หรือสืบทอดจาก parent conversations
- channel plugins เป็นผู้รัน action สุดท้ายผ่าน action adapter ของตน

สำหรับ channel plugins พื้นผิว SDK คือ
`ChannelMessageActionAdapter.describeMessageTool(...)` การเรียก discovery แบบรวมนี้ช่วยให้ plugin
ส่งกลับ visible actions, capabilities และ schema contributions ของมันพร้อมกัน
เพื่อไม่ให้ส่วนเหล่านี้ drift ออกจากกัน

เมื่อพารามิเตอร์ของ message-tool ที่เฉพาะกับช่องทางมี media source เช่น
local path หรือ remote media URL plugin ควรส่งกลับ
`mediaSourceParams` จาก `describeMessageTool(...)` ด้วย Core ใช้รายการ explicit นี้
เพื่อใช้ sandbox path normalization และ outbound media-access hints
โดยไม่ต้อง hardcode ชื่อพารามิเตอร์ที่ plugin เป็นเจ้าของ
ควรใช้ maps ที่มีขอบเขตต่อ action ตรงนั้น ไม่ใช่ flat list ระดับทั้งช่องทาง
เพื่อไม่ให้ media param ที่มีผลเฉพาะกับ profile ถูก normalize กับ actions ที่ไม่เกี่ยวข้อง เช่น
`send`

Core ส่ง runtime scope เข้าไปในขั้นตอน discovery นั้น ฟิลด์สำคัญได้แก่:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- trusted inbound `requesterSenderId`

สิ่งนี้สำคัญกับ plugins ที่ไวต่อบริบท ช่องทางหนึ่งสามารถซ่อนหรือแสดง
message actions ตาม active account, current room/thread/message หรือ
trusted requester identity ได้ โดยไม่ต้อง hardcode สาขาที่เฉพาะกับช่องทางใน core `message` tool

นี่คือเหตุผลว่าทำไมการเปลี่ยนแปลง embedded-runner routing ยังคงเป็นงานของ plugin: runner
มีหน้าที่ส่งต่อ current chat/session identity เข้าไปยังขอบเขต discovery ของ plugin
เพื่อให้ shared `message` tool แสดงพื้นผิวที่ channel เป็นเจ้าของได้อย่างถูกต้องสำหรับ turn ปัจจุบัน

สำหรับ execution helpers ที่ channel เป็นเจ้าของ bundled plugins ควรเก็บ execution
runtime ไว้ภายใน extension modules ของตัวเอง Core ไม่ได้เป็นเจ้าของ Discord,
Slack, Telegram หรือ WhatsApp message-action runtimes ใต้ `src/agents/tools`
อีกต่อไป เราไม่ได้เผยแพร่ subpaths แบบ `plugin-sdk/*-action-runtime` แยก และ bundled
plugins ควร import runtime code ภายในของตัวเองโดยตรงจาก extension-owned modules

ขอบเขตเดียวกันนี้ใช้กับ provider-named SDK seams โดยทั่วไปด้วย: core
ไม่ควร import convenience barrels ที่เฉพาะกับช่องทางสำหรับ Slack, Discord, Signal,
WhatsApp หรือ extensions ที่คล้ายกัน หาก core ต้องการพฤติกรรมบางอย่าง ก็ให้
consume ผ่าน `api.ts` / `runtime-api.ts` barrel ของ bundled plugin เอง หรือผลักความต้องการนั้น
ขึ้นเป็น generic capability ที่แคบใน SDK ที่ใช้ร่วมกัน

สำหรับ polls โดยเฉพาะ จะมีเส้นทางการทำงานอยู่สองแบบ:

- `outbound.sendPoll` คือ baseline แบบใช้ร่วมกันสำหรับ channels ที่เข้ากับ
  โมเดล poll แบบทั่วไป
- `actions.handleAction("poll")` คือเส้นทางที่แนะนำสำหรับ semantics ของ poll ที่เฉพาะกับช่องทาง หรือพารามิเตอร์ poll เพิ่มเติม

ตอนนี้ core จะเลื่อนการ parse shared poll ออกไปจนกว่าการ dispatch poll ของ plugin จะปฏิเสธ
action นั้นเสียก่อน ดังนั้น poll handlers ที่ plugin เป็นเจ้าของจึงสามารถรับฟิลด์ poll ที่เฉพาะกับช่องทางได้ โดยไม่ถูก generic poll parser บล็อกก่อน

ดู [Plugin architecture internals](/th/plugins/architecture-internals) สำหรับลำดับการเริ่มต้นระบบแบบเต็ม

## โมเดล ownership ของ capability

OpenClaw มอง native plugin ว่าเป็นขอบเขตความเป็นเจ้าของของ **บริษัท** หรือ **ฟีเจอร์**
ไม่ใช่ถุงรวม integrations ที่ไม่เกี่ยวข้องกัน

นั่นหมายความว่า:

- plugin ของบริษัทโดยทั่วไปควรเป็นเจ้าของทุกพื้นผิวของบริษัทนั้นที่เชื่อมกับ OpenClaw
- plugin ของฟีเจอร์โดยทั่วไปควรเป็นเจ้าของพื้นผิวเต็มของฟีเจอร์ที่มันนำเข้ามา
- channels ควรใช้ shared core capabilities แทนการนำพฤติกรรมของ provider ไปเขียนใหม่แบบเฉพาะกิจ

<Accordion title="ตัวอย่างรูปแบบ ownership ข้าม bundled plugins">
  - **Vendor multi-capability**: `openai` เป็นเจ้าของ text inference, speech, realtime
    voice, media understanding และ image generation ส่วน `google` เป็นเจ้าของ text
    inference ร่วมกับ media understanding, image generation และ web search
    `qwen` เป็นเจ้าของ text inference ร่วมกับ media understanding และ video generation
  - **Vendor single-capability**: `elevenlabs` และ `microsoft` เป็นเจ้าของ speech;
    `firecrawl` เป็นเจ้าของ web-fetch; `minimax` / `mistral` / `moonshot` / `zai` เป็นเจ้าของ
    media-understanding backends
  - **Feature plugin**: `voice-call` เป็นเจ้าของ call transport, tools, CLI, routes
    และ Twilio media-stream bridging แต่ใช้ shared capabilities สำหรับ speech, realtime
    transcription และ realtime voice แทนการ import vendor plugins โดยตรง
</Accordion>

สถานะปลายทางที่ตั้งใจไว้คือ:

- OpenAI อยู่ใน plugin เดียว แม้ว่าจะครอบคลุม text models, speech, images และ
  video ในอนาคตก็ตาม
- vendor อื่นก็สามารถทำแบบเดียวกันกับพื้นที่ผิวของตัวเองได้
- channels ไม่ต้องสนใจว่า vendor plugin ใดเป็นเจ้าของ provider; พวกมันใช้ shared capability contract ที่ core เปิดให้

นี่คือความแตกต่างที่สำคัญ:

- **plugin** = ขอบเขตความเป็นเจ้าของ
- **capability** = core contract ที่หลาย plugins สามารถติดตั้งใช้งานหรือใช้ได้

ดังนั้นหาก OpenClaw เพิ่มโดเมนใหม่อย่าง video คำถามแรกไม่ใช่
“provider ไหนควร hardcode การจัดการ video?” คำถามแรกคือ “core video capability contract คืออะไร?”
เมื่อมี contract นั้นแล้ว vendor plugins ก็สามารถลงทะเบียนกับมัน และ channel/feature plugins ก็สามารถใช้มันได้

หาก capability นั้นยังไม่มี การเคลื่อนไหวที่ถูกต้องโดยทั่วไปคือ:

1. กำหนด capability ที่ขาดอยู่ใน core
2. เปิดให้ใช้ผ่าน plugin API/runtime แบบมีชนิด
3. เชื่อม channels/features เข้ากับ capability นั้น
4. ให้ vendor plugins ลงทะเบียน implementation

วิธีนี้ทำให้ ownership ชัดเจน ขณะเดียวกันก็หลีกเลี่ยงพฤติกรรมใน core ที่พึ่งพา vendor เดียวหรือเส้นทางโค้ดเฉพาะ plugin แบบครั้งเดียวจบ

### การแบ่งชั้นของ capability

ใช้โมเดลทางความคิดนี้เมื่อตัดสินใจว่าโค้ดควรอยู่ที่ไหน:

- **ชั้น core capability**: orchestration, policy, fallback, กฎการ merge คอนฟิก, delivery semantics และ typed contracts ที่ใช้ร่วมกัน
- **ชั้น vendor plugin**: APIs, auth, model catalogs, speech
  synthesis, image generation, future video backends และ usage endpoints ที่เฉพาะกับ vendor
- **ชั้น channel/feature plugin**: integration สำหรับ Slack/Discord/voice-call/ฯลฯ
  ที่ใช้ core capabilities และนำไปแสดงบนพื้นผิวหนึ่ง

ตัวอย่างเช่น TTS ใช้รูปแบบนี้:

- core เป็นเจ้าของนโยบาย TTS ตอนตอบกลับ, ลำดับ fallback, prefs และ channel delivery
- `openai`, `elevenlabs` และ `microsoft` เป็นเจ้าของ implementations ของ synthesis
- `voice-call` ใช้ telephony TTS runtime helper

ควรใช้ pattern เดียวกันนี้กับ capabilities ในอนาคต

### ตัวอย่าง company plugin แบบ multi-capability

company plugin ควรรู้สึกเป็นหนึ่งเดียวจากมุมมองภายนอก หาก OpenClaw มี shared
contracts สำหรับ models, speech, realtime transcription, realtime voice, media
understanding, image generation, video generation, web fetch และ web search,
vendor ก็สามารถเป็นเจ้าของทุกพื้นผิวของตนในที่เดียวได้:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

สิ่งสำคัญไม่ใช่ชื่อ helper ที่แน่นอน แต่เป็นรูปทรง:

- plugin เดียวเป็นเจ้าของพื้นผิวของ vendor
- core ยังคงเป็นเจ้าของ capability contracts
- channels และ feature plugins ใช้ `api.runtime.*` helpers ไม่ใช่ vendor code
- contract tests สามารถยืนยันได้ว่า plugin ได้ลงทะเบียน capabilities ที่มันอ้างว่าเป็นเจ้าของจริง

### ตัวอย่าง capability: video understanding

OpenClaw มอง image/audio/video understanding เป็น shared
capability เดียวอยู่แล้ว โมเดล ownership แบบเดียวกันก็ใช้ที่นี่ด้วย:

1. core กำหนด media-understanding contract
2. vendor plugins ลงทะเบียน `describeImage`, `transcribeAudio` และ
   `describeVideo` ตามที่เหมาะสม
3. channels และ feature plugins ใช้ shared core behavior แทนการ
   เชื่อมโดยตรงกับ vendor code

วิธีนี้หลีกเลี่ยงการฝังสมมติฐานเรื่อง video ของ provider รายใดรายหนึ่งลงใน core Plugin เป็นเจ้าของ
พื้นผิวของ vendor; core เป็นเจ้าของ capability contract และ fallback behavior

Video generation ใช้ลำดับแบบเดียวกันนี้อยู่แล้ว: core เป็นเจ้าของ typed
capability contract และ runtime helper และ vendor plugins ลงทะเบียน
implementations ของ `api.registerVideoGenerationProvider(...)` กับมัน

ต้องการ rollout checklist แบบจับต้องได้หรือไม่ ดู
[Capability Cookbook](/th/plugins/architecture)

## สัญญาและการบังคับใช้

พื้นผิว Plugin API ถูกทำให้เป็นแบบมีชนิดและรวมศูนย์ไว้อย่างตั้งใจใน
`OpenClawPluginApi` สัญญานี้กำหนดจุดลงทะเบียนที่รองรับและ
runtime helpers ที่ plugin สามารถพึ่งพาได้

เหตุใดสิ่งนี้จึงสำคัญ:

- ผู้เขียน plugin ได้มาตรฐานภายในที่เสถียรหนึ่งเดียว
- core สามารถปฏิเสธ ownership ที่ซ้ำกัน เช่น plugins สองตัวลงทะเบียน
  provider id เดียวกัน
- ระหว่างเริ่มต้นระบบสามารถแสดง diagnostics ที่นำไปแก้ไขได้สำหรับ registration ที่ผิดรูปแบบ
- contract tests สามารถบังคับ ownership ของ bundled-plugin และป้องกันการ drift แบบเงียบๆ ได้

มีการบังคับใช้อยู่สองชั้น:

1. **การบังคับใช้ตอน runtime registration**
   รีจิสทรี plugin จะตรวจสอบ registrations ขณะ plugins โหลด ตัวอย่างเช่น:
   provider ids ซ้ำ, speech provider ids ซ้ำ และ
   registrations ที่ผิดรูปแบบ จะให้ plugin diagnostics แทนพฤติกรรมที่ไม่กำหนดไว้
2. **contract tests**
   bundled plugins จะถูกจับไว้ใน contract registries ระหว่างการรันทดสอบ เพื่อให้
   OpenClaw ยืนยัน ownership ได้อย่างชัดเจน ปัจจุบันใช้กับ model
   providers, speech providers, web search providers และ bundled registration
   ownership

ผลลัพธ์เชิงปฏิบัติคือ OpenClaw รู้ตั้งแต่ต้นว่า plugin ไหนเป็นเจ้าของพื้นผิวใด
สิ่งนี้ทำให้ core และ channels ทำงานร่วมกันได้อย่างลื่นไหล เพราะ ownership ถูกประกาศไว้
มีชนิดกำกับ และทดสอบได้ แทนที่จะเป็นเรื่องโดยนัย

### อะไรควรอยู่ในสัญญา

สัญญา plugin ที่ดีควรมีลักษณะดังนี้:

- มีชนิดกำกับ
- ขนาดเล็ก
- เฉพาะกับ capability
- เป็นเจ้าของโดย core
- ใช้ซ้ำได้โดยหลาย plugins
- channels/features สามารถใช้ได้โดยไม่ต้องรู้เรื่อง vendor

สัญญา plugin ที่ไม่ดีคือ:

- นโยบายเฉพาะ vendor ที่ซ่อนอยู่ใน core
- ช่องทางหลบเลี่ยงเฉพาะ plugin แบบครั้งเดียวที่ข้ามรีจิสทรี
- โค้ดของ channel ที่เข้าถึง implementation ของ vendor โดยตรง
- ออบเจ็กต์ runtime แบบเฉพาะกิจที่ไม่ได้เป็นส่วนหนึ่งของ `OpenClawPluginApi` หรือ
  `api.runtime`

หากลังเล ให้ยกระดับ abstraction ขึ้น: กำหนด capability ก่อน แล้วจึงให้ plugins มาเสียบเข้ากับมัน

## โมเดลการทำงาน

native OpenClaw plugins ทำงาน **in-process** ร่วมกับ Gateway โดยไม่ได้
sandboxed native plugin ที่ถูกโหลดแล้วมีขอบเขตความไว้วางใจในระดับ process เท่ากับโค้ด core

ผลที่ตามมา:

- native plugin สามารถลงทะเบียน tools, network handlers, hooks และ services ได้
- บั๊กใน native plugin สามารถทำให้ gateway ล่มหรือไม่เสถียรได้
- native plugin ที่เป็นอันตรายเทียบเท่ากับ arbitrary code execution ภายใน process ของ OpenClaw

compatible bundles ปลอดภัยกว่าโดยค่าเริ่มต้น เพราะปัจจุบัน OpenClaw มองพวกมัน
เป็น metadata/content packs ในรุ่นปัจจุบัน สิ่งนี้โดยมากหมายถึง
bundled skills

ใช้ allowlists และ explicit install/load paths สำหรับ plugins ที่ไม่ใช่ bundled
และให้ถือว่า workspace plugins เป็นโค้ดสำหรับช่วงพัฒนา ไม่ใช่ค่าเริ่มต้นสำหรับ production

สำหรับชื่อแพ็กเกจ workspace ที่เป็น bundled ให้คง plugin id ผูกอยู่กับชื่อ npm:
`@openclaw/<id>` โดยค่าเริ่มต้น หรือใช้ suffix แบบมีชนิดที่ได้รับอนุมัติ เช่น
`-provider`, `-plugin`, `-speech`, `-sandbox` หรือ `-media-understanding` เมื่อ
แพ็กเกจนั้นจงใจเปิดเผยบทบาทของ plugin ที่แคบกว่า

หมายเหตุเรื่องความไว้วางใจที่สำคัญ:

- `plugins.allow` เชื่อถือ **plugin ids** ไม่ใช่แหล่งที่มาของซอร์ส
- workspace plugin ที่มี id เดียวกับ bundled plugin จะ shadow bundled
  copy โดยตั้งใจ เมื่อ workspace plugin นั้นถูกเปิดใช้งาน/อยู่ใน allowlist
- สิ่งนี้เป็นเรื่องปกติและมีประโยชน์สำหรับการพัฒนาในเครื่อง การทดสอบแพตช์ และ hotfixes
- ความไว้วางใจของ bundled-plugin ถูก resolve จาก source snapshot — manifest และ
  โค้ดบนดิสก์ตอนโหลด — ไม่ได้อิงจาก install metadata การบันทึกการติดตั้งที่เสียหาย
  หรือถูกสลับ ไม่สามารถขยายพื้นผิวความไว้วางใจของ bundled plugin อย่างเงียบๆ
  ให้เกินกว่าที่ซอร์สจริงอ้างไว้ได้

## ขอบเขตของ export

OpenClaw export capabilities ไม่ใช่ convenience implementation

ให้คงการลงทะเบียน capability เป็นแบบสาธารณะ และลด helper exports ที่ไม่ใช่สัญญา:

- helper subpaths ที่เฉพาะกับ bundled-plugin
- runtime plumbing subpaths ที่ไม่ได้ตั้งใจให้เป็น public API
- convenience helpers ที่เฉพาะกับ vendor
- setup/onboarding helpers ที่เป็นรายละเอียด implementation

helper subpaths ของ bundled-plugin บางส่วนยังคงอยู่ใน generated SDK export
map เพื่อความเข้ากันได้และการดูแล bundled-plugin ตัวอย่างในปัจจุบันได้แก่
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` และ seams `plugin-sdk/matrix*` หลายรายการ ให้ถือว่าสิ่งเหล่านี้เป็น
exports แบบ reserved implementation-detail ไม่ใช่ SDK pattern ที่แนะนำสำหรับ third-party plugins ใหม่

## ภายในและข้อมูลอ้างอิง

สำหรับ load pipeline, registry model, provider runtime hooks, Gateway HTTP
routes, message tool schemas, channel target resolution, provider catalogs,
context engine plugins และคู่มือการเพิ่ม capability ใหม่ โปรดดู
[Plugin architecture internals](/th/plugins/architecture-internals)

## ที่เกี่ยวข้อง

- [Building plugins](/th/plugins/building-plugins)
- [Plugin SDK setup](/th/plugins/sdk-setup)
- [Plugin manifest](/th/plugins/manifest)
